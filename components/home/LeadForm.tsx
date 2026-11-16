'use client'

import { useState, useEffect, useRef, useMemo, FormEvent } from 'react'
import { createFormTracker } from '@/lib/form-funnel'
import PhoneField from '@/components/forms/PhoneField'
import {
  DEFAULT_COUNTRY, isValidEmail, normalizeEmail, isValidPhone, toStoredPhone,
  checkName, checkEmail, checkPhone, tidy, type FieldState,
} from '@/lib/form-validate'
import { joinName } from '@/lib/names'
import { useSearchParams } from 'next/navigation'
import { getTrafficData } from '@/analytics/traffic-identification'
import {
  trackFormView, trackFormStart, trackFormError, trackAddToCart, trackBeginCheckout, trackLead,
} from '@/analytics/events'

const SERVICES = [
  { value: 'web', label: 'Web' },
  { value: 'data', label: 'Data' },
  { value: 'social', label: 'Social' },
  { value: 'seo', label: 'SEO & Ads' },
  { value: 'engineering', label: 'Engineering' },
]

type Props = {
  idPrefix?: string
  /** Identity for analytics and the funnel. Defaults keep the homepage unchanged. */
  formId?: string
  formType?: string
  location?: string
  /** The heading above the fields, so a campaign page can speak its own language. */
  heading?: React.ReactNode
  blurb?: string
  submitLabel?: string
  /** Appended to the message, so the team sees which offer the lead came from. */
  contextNote?: string
}

export default function LeadForm({
  idPrefix = 'hs', formId = 'home-lead-form', formType = 'home', location = 'home',
  heading, blurb, submitLabel, contextNote,
}: Props) {
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [services, setServices] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [invalid, setInvalid] = useState<{ services?: boolean; consent?: boolean }>({})
  // A field only starts showing red once it has been left, or once Send was pressed.
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [tried, setTried] = useState(false)
  const touch = (k: string) => setTouched((p) => (p[k] ? p : { ...p, [k]: true }))
  const [done, setDone] = useState(false)
  const [consent, setConsent] = useState(false)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // prefill service from ?service= query string (ported from site.js)
  useEffect(() => {
    const svc = searchParams?.get('service')
    if (svc && SERVICES.some((s) => s.value === svc)) {
      setServices((prev) => (prev.includes(svc) ? prev : [...prev, svc]))
    }
  }, [searchParams])

  const startedRef = useRef(false)
  const funnel = useMemo(() => createFormTracker(formId, formType), [formId, formType])
  useEffect(() => {
    trackFormView({ formId, formType, location })
    funnel.view()
    // Capture how far they got even if they close the tab or switch away.
    const flush = () => funnel.snapshot(document.getElementById(formId) as HTMLFormElement | null)
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHide) }
  }, [funnel, formId, formType, location])
  const onFirstInteract = () => {
    if (startedRef.current) return
    startedRef.current = true
    trackFormStart({ formId, formType })
    funnel.start()
    trackBeginCheckout(services, '', location)
  }

  const toggleService = (value: string) => {
    setServices((prev) => {
      const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      if (!prev.includes(value)) trackAddToCart(next, '')
      return next
    })
    setInvalid((prev) => ({ ...prev, services: false }))
  }

  // Live state for the three typed fields, recomputed on every keystroke.
  const live = {
    first: checkName(firstName),
    last: checkName(lastName),
    email: checkEmail(email),
    phone: checkPhone(phone, country),
  }

  /**
   * Turns a field's live state into what the user actually sees. An empty
   * required field stays quiet until they try to send; a filled one that is
   * wrong speaks up as soon as they leave it, and keeps up as they fix it.
   */
  function view(key: keyof typeof live, emptyMsg: string) {
    const s: FieldState = live[key]
    const revealed = touched[key] || tried
    if (s.status === 'idle') return tried ? { cls: ' invalid', note: emptyMsg, bad: true } : { cls: '', note: null, bad: false }
    if (s.status === 'error') return revealed ? { cls: ' invalid', note: s.message!, bad: true } : { cls: '', note: null, bad: false }
    // A valid field may still carry a soft note, such as a likely address typo.
    return { cls: ' ok', note: s.message ?? null, bad: false }
  }

  const vFirst = view('first', 'Please tell us your first name.')
  const vLast = view('last', 'Please tell us your last name.')
  const vEmail = view('email', 'We need an email to reply to.')
  const vPhone = view('phone', 'A phone number helps us reach you.')

  const fullName = joinName(firstName, lastName)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTried(true)
    const bad = {
      first: live.first.status !== 'ok',
      last: live.last.status !== 'ok',
      email: !isValidEmail(email),
      phone: !isValidPhone(phone, country),
      services: services.length === 0,
      consent: !consent,
    }
    setInvalid({ services: bad.services, consent: bad.consent })
    const form = e.target as HTMLFormElement
    if (bad.first || bad.last || bad.email || bad.phone || bad.services || bad.consent) {
      const badFields = Object.keys(bad).filter((k) => (bad as Record<string, boolean>)[k])
      trackFormError({ formId, formType, errorFields: badFields })
      funnel.error(badFields)
      // Classes have not re-rendered yet, so go to the field by id instead.
      const firstKey = ['first', 'last', 'email', 'phone', 'services', 'consent'].find((k) => badFields.includes(k))
      const anchorId = firstKey === 'services' ? `${idPrefix}-${SERVICES[0].value}` : `${idPrefix}-${firstKey}`
      const firstBad = (document.getElementById(anchorId)?.closest('.field') as HTMLElement | null) || form
      const top = firstBad.getBoundingClientRect().top + window.pageYOffset - 140
      window.scrollTo({ top, behavior: 'smooth' })
      return
    }
    setSending(true)
    setSubmitError('')
    funnel.snapshot(form)
    funnel.submit()
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: tidy(firstName), lastName: tidy(lastName),
          email: normalizeEmail(email), phone: toStoredPhone(phone, country),
          company: tidy(company),
          message: [message.trim(), contextNote].filter(Boolean).join('\n\n'), services, consent,
          formType,
          sourcePage: window.location.pathname + window.location.search,
          traffic: getTrafficData(),
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(d.error || 'Something went wrong - please try again.')
        return
      }
      await trackLead({ name: fullName, firstName: tidy(firstName), lastName: tidy(lastName), email: normalizeEmail(email), phone: toStoredPhone(phone, country), services, formType, publicId: d.leadId, consent })
      funnel.success()
      setDone(true)
      const top = form.getBoundingClientRect().top + window.pageYOffset - 120
      window.scrollTo({ top, behavior: 'smooth' })
    } catch {
      setSubmitError('Network hiccup - please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form className={`lead-form${done ? ' done' : ''}`} noValidate onSubmit={handleSubmit} onFocusCapture={onFirstInteract} id={formId}
      onBlurCapture={funnel.handlers.onBlurCapture} onChangeCapture={funnel.handlers.onChangeCapture}>
      <div className="form-body">
        <div className="form-head">
          <h3>{heading ?? <>Book your <span className="it">free call</span></>}</h3>
          <p>{blurb ?? "About a minute to fill in. The rest we'll cover on the call."}</p>
        </div>

        <div className="form-row">
          <div className={`field${vFirst.cls}`}>
            <label htmlFor={`${idPrefix}-first`}>
              First name <span className="req">*</span>
            </label>
            <input
              type="text"
              id={`${idPrefix}-first`}
              name="firstName"
              placeholder="Jordan"
              autoComplete="given-name"
              value={firstName}
              onBlur={() => touch('first')}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={vFirst.bad}
            />
            {vFirst.note && <span className={`note${vFirst.bad ? ' bad' : ''}`} role={vFirst.bad ? 'alert' : undefined}>{vFirst.note}</span>}
          </div>

          <div className={`field${vLast.cls}`}>
            <label htmlFor={`${idPrefix}-last`}>
              Last name <span className="req">*</span>
            </label>
            <input
              type="text"
              id={`${idPrefix}-last`}
              name="lastName"
              placeholder="Lee"
              autoComplete="family-name"
              value={lastName}
              onBlur={() => touch('last')}
              onChange={(e) => setLastName(e.target.value)}
              aria-invalid={vLast.bad}
            />
            {vLast.note && <span className={`note${vLast.bad ? ' bad' : ''}`} role={vLast.bad ? 'alert' : undefined}>{vLast.note}</span>}
          </div>
        </div>

        <div className="form-row split-contact">
          <div className={`field${vEmail.cls}`}>
            <label htmlFor={`${idPrefix}-email`}>
              Email <span className="req">*</span>
            </label>
            <input
              type="email"
              id={`${idPrefix}-email`}
              name="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onBlur={() => touch('email')}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={vEmail.bad}
            />
            {vEmail.note && <span className={`note${vEmail.bad ? ' bad' : ''}`} role={vEmail.bad ? 'alert' : undefined}>{vEmail.note}</span>}
          </div>

          <div className={`field${vPhone.cls}`}>
            <label htmlFor={`${idPrefix}-phone`}>
              Phone <span className="req">*</span>
            </label>
            <PhoneField
              id={`${idPrefix}-phone`}
              digits={phone}
              country={country}
              status={vPhone.bad ? 'error' : vPhone.cls === ' ok' ? 'ok' : 'idle'}
              onBlur={() => touch('phone')}
              onChange={({ digits, country: c }) => { setPhone(digits); setCountry(c) }}
            />
            {vPhone.note && <span className={`note${vPhone.bad ? ' bad' : ''}`} role={vPhone.bad ? 'alert' : undefined}>{vPhone.note}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-company`}>
            Company <span className="opt">(optional)</span>
          </label>
          <input
            type="text"
            id={`${idPrefix}-company`}
            name="company"
            placeholder="Your company"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <div className={`field${invalid.services ? ' invalid' : ''}`}>
          <label>
            What do you need help with? <span className="req">*</span>
          </label>
          <div className="chips">
            {SERVICES.map((s) => (
              <label key={s.value} className={services.includes(s.value) ? 'checked' : undefined} htmlFor={`${idPrefix}-${s.value}`}>
                <input
                  type="checkbox"
                  id={`${idPrefix}-${s.value}`}
                  name="service"
                  value={s.value}
                  checked={services.includes(s.value)}
                  onChange={() => toggleService(s.value)}
                />
                <span className="dot"></span>
                {s.label}
              </label>
            ))}
          </div>
          <span className="err">Pick at least one.</span>
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-message`}>
            Anything else?{' '}
            <span style={{ color: 'var(--ink-soft)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <textarea
            id={`${idPrefix}-message`}
            name="message"
            rows={3}
            placeholder="A sentence on what you're building & what's stuck."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className={`field${invalid.consent ? ' invalid' : ''}`}>
          <label htmlFor={`${idPrefix}-consent`} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textTransform: 'none', letterSpacing: 0, cursor: 'pointer', fontSize: 13, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              id={`${idPrefix}-consent`}
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                setInvalid((p) => ({ ...p, consent: false }))
              }}
              style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: 'var(--brand)' }}
            />
            <span>
              I consent to sharing my personal details and agree to the{' '}
              <a href="/terms" target="_blank" style={{ textDecoration: 'underline' }}>Terms of Service</a> and{' '}
              <a href="/privacy" target="_blank" style={{ textDecoration: 'underline' }}>Privacy Policy</a>. <span className="req">*</span>
            </span>
          </label>
          <span className="err">Please tick the consent box so we can process your enquiry.</span>
        </div>

        {submitError && <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 12 }}>{submitError}</p>}

        <button type="submit" className="form-submit" disabled={sending}>
          {sending ? 'Sending…' : (submitLabel ?? 'Book my free call')}
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 11 L11 3 M5 3 H11 V9" />
          </svg>
        </button>
      </div>

      <div className={`form-success${done ? ' show' : ''}`}>
        <div className="tick">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--paper)" strokeWidth="2.4">
            <path d="M4 12 L10 18 L20 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3>
          {firstName ? <>Thanks, <span className="it">{firstName}</span>.</> : 'Thanks, got it.'}
        </h3>
        <p>
          Your request is in. We&apos;ll reply within one business day with a few times for your 30-minute call.
        </p>
      </div>
    </form>
  )
}
