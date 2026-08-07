import { confidenceCount } from '../../shared/model.js'
import { supabase } from '../lib/supabase.js'

const TABS = [
  { id: 'ledger', label: 'Assumptions ledger' },
  { id: 'pricing', label: 'Pricing lab' },
  { id: 'profit', label: 'Path to profit' },
  { id: 'growth', label: 'Growth & resourcing' },
  { id: 'copilot', label: 'Strategy copilot' },
  { id: 'history', label: 'History' }
]

export default function Header({ model, tab, setTab, email, saving }) {
  const c = model ? confidenceCount(model) : { A: 0, E: 0, V: 0 }
  const total = c.A + c.E + c.V || 1
  const pct = n => (n / total) * 100 + '%'

  return (
    <header>
      <div className="wrap">
        <div className="hd">
          <div>
            <h1>HaTi Strategy Room</h1>
            <p className="tag">
              Price HaTi for Sweden and Kenya side by side, see when it pays for itself, and plan
              the people and money needed to get there.
            </p>
          </div>

          <div className="meter">
            <div className="lbl">
              <span>How solid is this model?</span>
              <span className="mono">{Math.round((c.V / total) * 100)}% verified</span>
            </div>
            <div className="bar">
              <i style={{ background: '#2E7D5B', width: pct(c.V) }} />
              <i style={{ background: '#C8B04A', width: pct(c.E) }} />
              <i style={{ background: '#B4462F', width: pct(c.A) }} />
            </div>
            <div className="lbl" style={{ marginTop: 6 }}>
              <span>Verified · Estimated · Assumed</span>
              <span className={'saving' + (saving ? ' on' : '')}>{saving ? 'Saving…' : 'Saved'}</span>
            </div>
          </div>
        </div>

        <nav role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div className="who">
            <span>{email}</span>
            <button onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </nav>
      </div>
    </header>
  )
}
