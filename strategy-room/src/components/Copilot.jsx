import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { buildBrief } from '../../shared/brief.js'
import { fmtDate } from '../lib/format.js'

const STARTERS = [
  'Is Kenya priced too low to ever be worth the effort?',
  'Which single assumption, if wrong, breaks this plan?',
  'What has to be true for us to break even before month 18?',
  'Should we hire before or after break-even?'
]

export default function Copilot({ model, workspaceId }) {
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [past, setPast] = useState([])
  const [showPast, setShowPast] = useState(false)

  // What the copilot would be told if you asked right now. The server
  // rebuilds this from the saved numbers before asking, and returns the
  // exact text it used — that is what replaces this preview afterwards.
  const preview = buildBrief(model)

  const loadPast = async () => {
    const { data } = await supabase
      .from('copilot_log')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(25)
    setPast(data || [])
  }

  useEffect(() => {
    if (workspaceId) loadPast()
  }, [workspaceId])

  const ask = async q => {
    const text = String(q || '').trim()
    if (!text || busy) return

    setBusy(true)
    setError(null)
    setResult({ question: text, answer: null, briefing: null })

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Your sign-in has expired. Refresh the page.')

      const res = await fetch('/.netlify/functions/copilot', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ question: text, workspaceId })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'The copilot could not be reached.')
        setResult({ question: text, answer: null, briefing: data.briefing || null })
      } else {
        setResult({ question: text, answer: data.answer, briefing: data.briefing })
        loadPast()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const shown = result?.briefing || preview

  return (
    <>
      <div className="card">
        <h2>Strategy copilot</h2>
        <p className="sub">
          Ask questions about your own numbers. The copilot is handed the briefing below — nothing
          else — so it can never invent a figure you did not enter, and it always says which of your
          numbers were only assumed.
        </p>

        {error ? <div className="err">{error}</div> : null}

        <div className="row">
          <div>
            <h3 style={{ fontSize: 14, marginBottom: 10 }}>Start here</h3>
            {STARTERS.map(q => (
              <button key={q} className="qbtn" disabled={busy} onClick={() => ask(q)}>
                {q}
              </button>
            ))}
            <input
              type="text"
              placeholder="Or type your own question"
              style={{ width: '100%', marginTop: 6 }}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') ask(question)
              }}
            />
            <button
              className="btn"
              style={{ marginTop: 8 }}
              disabled={busy || !question.trim()}
              onClick={() => ask(question)}
            >
              {busy ? 'Thinking…' : 'Ask'}
            </button>
          </div>

          <div>
            <h3 style={{ fontSize: 14, marginBottom: 10 }}>
              {result?.briefing ? 'The briefing it received' : 'The briefing it will receive'}
            </h3>
            <textarea readOnly value={shown} />
            <button
              className="btn ghost"
              style={{ marginTop: 8 }}
              onClick={() => navigator.clipboard.writeText(shown)}
            >
              Copy briefing
            </button>
          </div>
        </div>

        {result ? (
          <div className="card" style={{ marginTop: 18, marginBottom: 0 }}>
            <b>{result.question}</b>
            {busy ? (
              <p className="sub" style={{ marginTop: 10 }}>
                Thinking…
              </p>
            ) : result.answer ? (
              <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{result.answer}</div>
            ) : (
              <p className="sub" style={{ marginTop: 10 }}>
                No answer came back. The briefing above is still what would have been sent — you can
                copy it into Claude by hand in the meantime.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="card">
        <h2>Questions you have asked before</h2>
        <p className="sub">
          Every question and answer is kept, along with the exact numbers the copilot was given at
          the time. Advice ages — this is how you check whether it held up.
        </p>

        <button className="btn ghost" onClick={() => setShowPast(v => !v)}>
          {showPast ? 'Hide' : `Show ${past.length} saved`}
        </button>

        {showPast &&
          past.map(row => (
            <details key={row.id} style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer' }}>
                <b>{row.question}</b>{' '}
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  · {fmtDate(row.created_at)}
                </span>
              </summary>
              <div style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>
                {row.answer || `(no answer — ${row.error || 'unknown problem'})`}
              </div>
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--ink-soft)' }}>
                  What it was told at the time
                </summary>
                <textarea readOnly value={row.briefing} style={{ marginTop: 8 }} />
              </details>
            </details>
          ))}
      </div>
    </>
  )
}
