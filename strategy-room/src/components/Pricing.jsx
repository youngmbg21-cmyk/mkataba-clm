import { useState } from 'react'
import { Chip } from './Field.jsx'
import { keToSek, project, MONTHS } from '../../shared/model.js'
import { fmt, fmtDate } from '../lib/format.js'

export default function Pricing({ model, raw, update, addRow, deleteRow, workspaceId }) {
  const [scenName, setScenName] = useState('')
  const fx = model.settings.fx
  const scenarios = raw.scenarios || []

  const avg =
    (model.tiers.reduce((a, t) => a + (t.price_se ? keToSek(t.price_ke, fx) / t.price_se : 0), 0) /
      (model.tiers.length || 1)) *
    100

  const saveScenario = async () => {
    const p = project(model)
    await addRow('scenarios', {
      name: scenName.trim() || `Scenario ${scenarios.length + 1}`,
      snapshot: {
        tiers: model.tiers.map(t => ({
          tier_key: t.tier_key,
          name: t.name,
          price_se: t.price_se,
          price_se_conf: t.price_se_conf,
          price_ke: t.price_ke,
          price_ke_conf: t.price_ke_conf
        })),
        fx
      },
      revenue_month24: Math.round(p.rows[MONTHS - 1].revenue),
      breakeven_month: p.breakeven
    })
    setScenName('')
  }

  const loadScenario = async s => {
    for (const saved of s.snapshot?.tiers || []) {
      const live = model.tiers.find(t => t.tier_key === saved.tier_key)
      if (!live) continue
      update('tiers', live.id, {
        price_se: saved.price_se,
        price_se_conf: saved.price_se_conf,
        price_ke: saved.price_ke,
        price_ke_conf: saved.price_ke_conf
      })
    }
  }

  return (
    <>
      <div className="card">
        <h2>Pricing lab</h2>
        <p className="sub">
          Set a monthly price per tier, per market. Kenya and Sweden are priced independently — the
          same product, two willingness-to-pay realities. Everything is converted back to SEK so you
          can compare like for like.
        </p>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Tier</th>
                <th className="r">Sweden · SEK/mo</th>
                <th className="r">Kenya · KES/mo</th>
                <th className="r">Kenya in SEK</th>
                <th className="r">Kenya vs Sweden</th>
              </tr>
            </thead>
            <tbody>
              {model.tiers.map(t => {
                const ratio = t.price_se ? (keToSek(t.price_ke, fx) / t.price_se) * 100 : 0
                return (
                  <tr key={t.id}>
                    <td>
                      <b>{t.name}</b>
                    </td>
                    <td className="r">
                      <input
                        type="number"
                        step={100}
                        value={t.price_se}
                        onChange={e =>
                          update('tiers', t.id, { price_se: parseFloat(e.target.value) || 0 })
                        }
                      />
                      <span style={{ marginLeft: 6, display: 'inline-block' }}>
                        <Chip
                          value={t.price_se_conf}
                          onChange={c => update('tiers', t.id, { price_se_conf: c })}
                        />
                      </span>
                    </td>
                    <td className="r">
                      <input
                        type="number"
                        step={100}
                        value={t.price_ke}
                        onChange={e =>
                          update('tiers', t.id, { price_ke: parseFloat(e.target.value) || 0 })
                        }
                      />
                      <span style={{ marginLeft: 6, display: 'inline-block' }}>
                        <Chip
                          value={t.price_ke_conf}
                          onChange={c => update('tiers', t.id, { price_ke_conf: c })}
                        />
                      </span>
                    </td>
                    <td className="r mono">{fmt(keToSek(t.price_ke, fx))}</td>
                    <td
                      className="r mono"
                      style={{ color: ratio < 25 ? 'var(--assumption)' : 'var(--ink-soft)' }}
                    >
                      {Math.round(ratio)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="note">
          Kenya is priced at about <b>{Math.round(avg)}%</b> of Sweden on average. Kenyan customers
          cost you the same to serve in AI usage and support, so a low percentage is only sustainable
          if Kenya also costs far less to sell to and support. Watch the per-customer cost line on
          the profit page.
        </div>
      </div>

      <div className="card">
        <h2>What sits in each tier</h2>
        <p className="sub">
          Tick a feature to include it in a tier. This is the fence that makes someone upgrade — if
          the free-est tier already does the job, nobody moves up.
        </p>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: '46%' }}>Feature</th>
                <th className="r">Essentials</th>
                <th className="r">Professional</th>
                <th className="r">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {model.features.map(f => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  {['ess', 'pro', 'ent'].map(k => (
                    <td className="r" key={k}>
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={!!f[k]}
                        onChange={e => update('features', f.id, { [k]: e.target.checked })}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Scenarios</h2>
        <p className="sub">
          Save the current prices under a name, then compare. Saved scenarios sit side by side so you
          and your partner can argue with numbers instead of opinions.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="e.g. Kenya entry-price test"
            value={scenName}
            onChange={e => setScenName(e.target.value)}
          />
          <button className="btn" onClick={saveScenario}>
            Save current prices
          </button>
        </div>

        <div className="scroll">
          <table style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Saved</th>
                <th className="r">Monthly revenue at month 24</th>
                <th className="r">Break-even month</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {scenarios.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--ink-soft)' }}>
                    Nothing saved yet.
                  </td>
                </tr>
              ) : (
                scenarios.map(s => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.name}</b>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      {fmtDate(s.created_at)}
                    </td>
                    <td className="r mono">{fmt(s.revenue_month24)}</td>
                    <td className="r mono">
                      {s.breakeven_month ? 'Month ' + s.breakeven_month : 'not in 24m'}
                    </td>
                    <td className="r">
                      <button className="btn ghost" onClick={() => loadScenario(s)}>
                        Load
                      </button>{' '}
                      <button className="btn ghost" onClick={() => deleteRow('scenarios', s.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
