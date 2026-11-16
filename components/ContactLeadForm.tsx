'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { getTrafficData } from '@/analytics/traffic-identification'
import {
  trackFormView, trackFormStart, trackFormError, trackAddToCart, trackBeginCheckout, trackLead,
} from '@/analytics/events'
import { COUNTRIES, PROVINCES } from '@/lib/locations'
import PhoneField from '@/components/forms/PhoneField'
import SelectField from '@/components/forms/SelectField'
import {
  DEFAULT_COUNTRY, isValidEmail, isValidPhone, normalizeEmail, toStoredPhone, tidy, tidyMultiline,
  checkName, checkEmail, checkPhone, checkMessage, type FieldState,
} from '@/lib/form-validate'
import { joinName } from '@/lib/names'

const SERVICES = [
  { value: 'web', label: 'Web development' },
  { value: 'data', label: 'Data & analytics' },
  { value: 'social', label: 'Social' },
  { value: 'seo', label: 'SEO & ads' },
  { value: 'engineering', label: 'Engineering / CAD' },
]

const BUDGETS = [
  { value: '<5k', label: '< $5k' },
  { value: '5-15k', label: '$5–15k' },
  { value: '15-40k', label: '$15–40k' },
  { value: '40k+', label: '$40k+' },
  { value: 'unsure', label: 'Not sure yet' },
]

const TIMELINES = [
  { value: 'asap', label: 'ASAP' },
  { value: '1mo', label: 'Within a month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'exploring', label: 'Just exploring' },
]

export default function ContactLeadForm() {
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('') // national digits only; the dial code lives in phoneCountry
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY)
  const [company, setCompany] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [budget, setBudget] = useState('')
  const [timeline, setTimeline] = useState('')
  const [message, setMessage] = useState('')
  const [referral, setReferral] = useState('')
  const [invalid, setInvalid] = useState<{ services?: boolean; consent?: boolean }>({})
  // A field only starts showing red once it has been left, or once Send was pressed.
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [tried, setTried] = useState(false)
  const touch = (k: string) => setTouched((p) => (p[k] ? p : { ...p, [k]: true }))
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [website, setWebsite] = useState('') // honeypot - humans never see or fill this
  const [consent, setConsent] = useState(false)
  const [referralDetail, setReferralDetail] = useState('')
  const [companyUrl, setCompanyUrl] = useState('')
  const [companyCountry, setCompanyCountry] = useState('')
  const [companyProvince, setCompanyProvince] = useState('')
  const [companyRemote, setCompanyRemote] = useState('')

  const startedRef = useRef(false)

  // prefill service from ?service= query string (ported from site.js)
  useEffect(() => {
    const svc = searchParams?.get('service')
    if (svc && SERVICES.some((s) => s.value === svc)) {
      setServices((prev) => (prev.includes(svc) ? prev : [...prev, svc]))
    }
  }, [searchParams])

  // funnel: form entered viewport / mounted
  useEffect(() => {
    trackFormView({ formId: 'contact-lead-form', formType: 'contact', location: 'contact-page' })
  }, [])

  // first interaction with the form -> form_start + begin_checkout (once)
  const onFirstInteract = () => {
    if (startedRef.current) return
    startedRef.current = true
    trackFormStart({ formId: 'contact-lead-form', formType: 'contact' })
    trackBeginCheckout(services, budget, 'contact')
  }

  const toggleService = (value: string) => {
    setServices((prev) => {
      const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      // ecommerce: adding a service to the "cart"
      if (!prev.includes(value)) trackAddToCart(next, budget)
      return next
    })
    setInvalid((prev) => ({ ...prev, services: false }))
  }

  // Live state for the typed fields, recomputed on every keystroke.
  const live = {
    first: checkName(firstName),
    last: checkName(lastName),
    email: checkEmail(email),
    phone: checkPhone(phone, phoneCountry),
    message: checkMessage(message),
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
  const vMessage = view('message', 'A sentence or two gets us started.')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTried(true)
    const bad = {
      first: live.first.status !== 'ok',
      last: live.last.status !== 'ok',
      email: !isValidEmail(email),
      phone: !isValidPhone(phone, phoneCountry),
      services: services.length === 0,
      message: live.message.status !== 'ok',
      consent: !consent,
    }
    setInvalid({ services: bad.services, consent: bad.consent })
    const form = e.target as HTMLFormElement
    if (bad.first || bad.last || bad.email || bad.phone || bad.services || bad.message || bad.consent) {
      const badFields = Object.keys(bad).filter((k) => (bad as Record<string, boolean>)[k])
      trackFormError({ formId: 'contact-lead-form', formType: 'contact', errorFields: badFields })
      // Classes have not re-rendered yet, so go to the field by id instead.
      const firstKey = ['first', 'last', 'email', 'phone', 'services', 'message', 'consent'].find((k) => badFields.includes(k))
      const anchorId = firstKey === 'services' ? `c-${SERVICES[0].value}` : `c-${firstKey}`
      const firstBad = (document.getElementById(anchorId)?.closest('.field') as HTMLElement | null) || form
      const top = firstBad.getBoundingClientRect().top + window.pageYOffset - 140
      window.scrollTo({ top, behavior: 'smooth' })
      return
    }

    setSending(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: tidy(firstName), lastName: tidy(lastName),
          email: normalizeEmail(email), phone: toStoredPhone(phone, phoneCountry),
          company: tidy(company), message: tidyMultiline(message),
          services, budget, timeline, referral, referralDetail, website,
          companyUrl, companyCountry, companyProvince, companyRemote,
          consent,
          formType: 'contact',
          sourcePage: window.location.pathname + window.location.search,
          traffic: getTrafficData(),
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(d.error || 'Something went wrong - please try again or email us directly.')
        return
      }
      // conversion: generate_lead + purchase with hashed PII + DB lead_id
      await trackLead({
        name: joinName(firstName, lastName), firstName: tidy(firstName), lastName: tidy(lastName),
        email: normalizeEmail(email), phone: toStoredPhone(phone, phoneCountry),
        services, budget, timeline,
        formType: 'contact', company: tidy(company), companyCountry, companyProvince, companyRemote,
        publicId: d.leadId, consent,
      })
      setDone(true)
      const top = form.getBoundingClientRect().top + window.pageYOffset - 120
      window.scrollTo({ top, behavior: 'smooth' })
    } catch {
      setSubmitError('Network hiccup - please try again or email us directly.')
    } finally {
      setSending(false)
    }
  }

  const greetingName = tidy(firstName) || 'friend'

  return (
    <form className={`lead-form${done ? ' done' : ''}`} noValidate onSubmit={handleSubmit} onFocusCapture={onFirstInteract} id="contact-lead-form">
      <div className="form-body">
        <div className="form-head">
          <h3>
            Tell us about the <span className="it">project</span>
          </h3>
          <p>The more you share, the sharper our first reply. Only the starred fields are required.</p>
        </div>

        <div className="form-row">
          <div className={`field${vFirst.cls}`}>
            <label htmlFor="c-first">
              First name <span className="req">*</span>
            </label>
            <input
              type="text"
              id="c-first"
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
            <label htmlFor="c-last">
              Last name <span className="req">*</span>
            </label>
            <input
              type="text"
              id="c-last"
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
            <label htmlFor="c-email">
              Email <span className="req">*</span>
            </label>
            <input
              type="email"
              id="c-email"
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
            <label htmlFor="c-phone">
              Phone <span className="req">*</span>
            </label>
            <PhoneField
              id="c-phone"
              digits={phone}
              country={phoneCountry}
              status={vPhone.bad ? 'error' : vPhone.cls === ' ok' ? 'ok' : 'idle'}
              onBlur={() => touch('phone')}
              onChange={({ digits, country }) => { setPhone(digits); setPhoneCountry(country) }}
            />
            {vPhone.note && <span className={`note${vPhone.bad ? ' bad' : ''}`} role={vPhone.bad ? 'alert' : undefined}>{vPhone.note}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="c-company">
              Company <span className="opt">(optional)</span>
            </label>
            <input
              type="text"
              id="c-company"
              name="company"
              placeholder="Your company, Inc."
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="c-company-url">
              Company website <span className="opt">(optional)</span>
            </label>
            <input
              type="url"
              id="c-company-url"
              name="companyUrl"
              placeholder="https://yourcompany.com"
              autoComplete="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row fluid">
          <div className="field">
            <label htmlFor="c-country">
              Company location <span className="opt">(optional)</span>
            </label>
            <SelectField
              id="c-country"
              name="companyCountry"
              value={companyCountry}
              onChange={(v) => { setCompanyCountry(v); setCompanyProvince('') }}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="Choose a country"
              ariaLabel="Country"
            />
          </div>
          {companyCountry && (
            <div className="field">
              <label htmlFor="c-province">
                {PROVINCES[companyCountry] ? 'Province or state' : 'Region'}
              </label>
              {PROVINCES[companyCountry] ? (
                <SelectField
                  id="c-province"
                  name="companyProvince"
                  value={companyProvince}
                  onChange={setCompanyProvince}
                  options={PROVINCES[companyCountry].map((p) => ({ value: p, label: p }))}
                  placeholder="Choose one"
                  ariaLabel="Province or state"
                />
              ) : (
                <input type="text" id="c-province" name="companyProvince" placeholder="Region"
                  value={companyProvince} onChange={(e) => setCompanyProvince(e.target.value)} />
              )}
            </div>
          )}
          <div className="field">
            <label htmlFor="c-remote">
              How the team works <span className="opt">(optional)</span>
            </label>
            <SelectField
              id="c-remote"
              name="companyRemote"
              value={companyRemote}
              onChange={setCompanyRemote}
              options={[
                { value: 'Yes', label: 'Fully remote' },
                { value: 'No', label: 'Based in an office' },
                { value: 'Hybrid', label: 'Hybrid' },
              ]}
              placeholder="Choose one"
              ariaLabel="How the team works"
            />
          </div>
        </div>

        <div className={`field${invalid.services ? ' invalid' : ''}`}>
          <label>
            Which service(s) are you interested in? <span className="req">*</span>
          </label>
          <div className="chips">
            {SERVICES.map((s) => (
              <label key={s.value} className={services.includes(s.value) ? 'checked' : undefined} htmlFor={`c-${s.value}`}>
                <input
                  type="checkbox"
                  id={`c-${s.value}`}
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
          <span className="err">Pick at least one service.</span>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Budget range</label>
            <div className="chips">
              {BUDGETS.map((b) => (
                <label key={b.value} className={budget === b.value ? 'checked' : undefined} htmlFor={`b-${b.value}`}>
                  <input
                    type="radio"
                    id={`b-${b.value}`}
                    name="budget"
                    value={b.value}
                    checked={budget === b.value}
                    onChange={() => setBudget(b.value)}
                  />
                  <span className="dot"></span>
                  {b.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <label>Timeline</label>
          <div className="chips">
            {TIMELINES.map((t) => (
              <label key={t.value} className={timeline === t.value ? 'checked' : undefined} htmlFor={`t-${t.value}`}>
                <input
                  type="radio"
                  id={`t-${t.value}`}
                  name="timeline"
                  value={t.value}
                  checked={timeline === t.value}
                  onChange={() => setTimeline(t.value)}
                />
                <span className="dot"></span>
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div className={`field${vMessage.cls}`}>
          <label htmlFor="c-message">
            Project description <span className="req">*</span>
          </label>
          <textarea
            id="c-message"
            name="message"
            rows={5}
            placeholder="What are you building? What's working, what's stuck, and what does 'done' look like? A scrappy paragraph is perfect."
            value={message}
            onBlur={() => touch('message')}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={vMessage.bad}
          />
          {vMessage.note && <span className={`note${vMessage.bad ? ' bad' : ''}`} role={vMessage.bad ? 'alert' : undefined}>{vMessage.note}</span>}
        </div>

        <div className="field">
          <label htmlFor="c-referral">How did you hear about us?</label>
          <SelectField
            id="c-referral"
            name="referral"
            value={referral}
            onChange={setReferral}
            options={[
              { value: 'referral', label: 'Someone referred us' },
              { value: 'google', label: 'Google search' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'linkedin', label: 'LinkedIn' },
              { value: 'twitter', label: 'X, formerly Twitter' },
              { value: 'event', label: 'An event or meetup' },
              { value: 'other', label: 'Somewhere else' },
            ]}
            placeholder="Choose one"
            ariaLabel="How you heard about us"
          />
          {referral === 'referral' && (
            <div style={{ marginTop: 10 }}>
              <label htmlFor="c-referral-detail">Who referred you?</label>
              <input
                type="text"
                id="c-referral-detail"
                name="referralDetail"
                placeholder="Their name or company, so we can thank them"
                value={referralDetail}
                onChange={(e) => setReferralDetail(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* honeypot - hidden from humans, catches bots */}
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <label htmlFor="c-website">Website</label>
          <input type="text" id="c-website" name="website" tabIndex={-1} autoComplete="off"
            value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className={`field${invalid.consent ? ' invalid' : ''}`} style={{ marginTop: 4 }}>
          <label htmlFor="c-consent" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textTransform: 'none', letterSpacing: 0, cursor: 'pointer', fontSize: 13.5, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              id="c-consent"
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

        {submitError && (
          <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 12 }}>{submitError}</p>
        )}

        <button type="submit" className="form-submit" disabled={sending}>
          {sending ? 'Sending…' : 'Request my discovery call'}
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
          Thanks, <span className="it">{greetingName}</span>!
        </h3>
        <p>
          Your project brief just landed in our inbox. Someone from our team will reach out to you shortly.
        </p>
      </div>
    </form>
  )
}
