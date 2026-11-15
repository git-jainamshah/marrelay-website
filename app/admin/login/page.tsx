'use client'

/* eslint-disable @next/next/no-img-element */
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { PasswordInput } from '@/components/admin/ui'
import { isProduction, envLabel } from '@/lib/env'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' }))
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'That email and password did not match. Check both and try again.')
        return
      }
      // Internal-only: a single lightweight dataLayer push on successful admin login.
      if (typeof window !== 'undefined') {
        const w = window as unknown as { dataLayer: Record<string, unknown>[] }
        w.dataLayer = w.dataLayer || []
        w.dataLayer.push({
          event: 'admin_login',
          login_status: 'success',
          login_method: 'password',
          user_role: data?.user?.role || '',
          must_change_password: !!data.mustChangePassword,
        })
      }
      router.push(data.mustChangePassword ? '/admin/change-password' : (params.get('next') || '/admin'))
      router.refresh()
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ad-login">
      {/* ---- stage: the company, at full bleed ---- */}
      <section className="ad-login-stage" aria-hidden="true">
        <img className="bg" src="/assets/office-dark-hero.png" alt="" />
        <div className="veil" />
        <div className="grain" />
        <header className="top">
          <img src="/assets/marrelay-logo-white.png" alt="Marrelay" className="logo" />
          <span className="env">{isProduction ? 'Studio portal' : `${envLabel} portal`}</span>
        </header>
        <div className="mid">
          <div className="kick">Marrelay · Toronto</div>
          <h2>
            Websites, data and<br />marketing, for one<br /><em>fixed price.</em>
          </h2>
          <p>Everything that runs the studio, in one place. Leads, pitches, billing, and the words on the site.</p>
        </div>
        <footer className="bot">
          <span>Toronto {clock && <>· {clock} ET</>}</span>
          <span>marrelay.com</span>
        </footer>
      </section>

      {/* ---- panel: sign in ---- */}
      <section className="ad-login-panel">
        <form onSubmit={submit} className="ad-login-form" noValidate>
          <img src="/assets/marrelay-mark.png" alt="" width={40} height={40} className="mark" />
          <div className="ad-kicker">Welcome back</div>
          <h1>Sign in to <span className="it">Marrelay</span></h1>
          <p className="lede">Use the email and password you were given. Forgotten it? Ask an administrator to reset it from Access Management.</p>

          {error && <div className="ad-alert err" role="alert">{error}</div>}

          <label className="ad-label" htmlFor="login-email">Email</label>
          <input id="login-email" type="email" required className="ad-input" value={email} autoComplete="username" autoFocus
            placeholder="you@marrelay.com" onChange={(e) => setEmail(e.target.value)} />

          <label className="ad-label" htmlFor="login-password" style={{ marginTop: 16 }}>Password</label>
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" required />

          <button disabled={busy || !email || !password} className="ad-btn brand go">
            {busy ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
          </button>

          <p className="fine">
            Private system. Access is logged. {!isProduction && <>This is the <b>{envLabel}</b> environment; changes here do not affect the live site.</>}
          </p>
        </form>
      </section>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
