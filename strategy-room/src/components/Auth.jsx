import { useState } from 'react'
import { supabase, configured } from '../lib/supabase.js'

/**
 * Sign in by email link. No passwords to remember or leak.
 */
export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (!configured) {
    return (
      <div className="signin">
        <div className="card">
          <h2>Not connected yet</h2>
          <p className="sub">
            This app needs two settings before it can run: <b>VITE_SUPABASE_URL</b> and{' '}
            <b>VITE_SUPABASE_ANON_KEY</b>. SETUP.md walks through where to find them. Nothing is
            broken — it just has not been pointed at a database yet.
          </p>
        </div>
      </div>
    )
  }

  const send = async e => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    })
    setBusy(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <div className="signin">
      <div className="card">
        <h2>HaTi Strategy Room</h2>
        {sent ? (
          <p className="sub">
            Check <b>{email}</b>. There is a sign-in link waiting. Open it on this device.
          </p>
        ) : (
          <>
            <p className="sub">
              Enter your email and we will send you a sign-in link. No password needed.
            </p>
            {error ? <div className="err">{error}</div> : null}
            <form onSubmit={send}>
              <input
                type="text"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button className="btn" disabled={busy || !email.trim()}>
                {busy ? 'Sending…' : 'Send me a link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
