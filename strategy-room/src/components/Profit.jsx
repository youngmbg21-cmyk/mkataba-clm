import Chart from './Chart.jsx'
import Field from './Field.jsx'
import { project, MONTHS } from '../../shared/model.js'
import { fmt } from '../lib/format.js'

function Stat({ label, value, tone }) {
  return (
    <div className={'stat' + (tone ? ' ' + tone : '')}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

export default function Profit({ model, update }) {
  const p = project(model)
  const last = p.rows[MONTHS - 1]
  const fixed = model.costs.filter(c => c.kind === 'fixed')
  const variable = model.costs.filter(c => c.kind === 'variable')

  return (
    <>
      <div className="card">
        <h2>Path to profit</h2>
        <p className="sub">
          Money in against money out, month by month, for the next two years. The point where the
          lines cross is the month HaTi stops costing you and starts paying you.
        </p>

        <Chart p={p} />

        <div className="row" style={{ marginTop: 18 }}>
          <div>
            <Stat
              label="Break-even"
              value={p.breakeven ? 'Month ' + p.breakeven : 'Not within 24 months'}
              tone={p.breakeven ? 'good' : 'warn'}
            />
            <Stat
              label="Deepest cash hole (funding needed)"
              value={`${fmt(Math.min(0, p.minCash))} (month ${p.minCashMonth})`}
              tone={p.minCash < model.settings.buffer ? 'warn' : 'good'}
            />
          </div>
          <div>
            <Stat label="Monthly revenue at month 24" value={fmt(last.revenue)} />
            <Stat
              label="Paying customers at month 24"
              value={`${Math.round(last.total)} (${Math.round(last.custSE)} SE / ${Math.round(
                last.custKE
              )} KE)`}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Cost base</h2>
        <p className="sub">
          Fixed costs run whether you have one customer or five hundred. Per-customer costs grow with
          the business — this is where AI usage bites.
        </p>

        <div className="row">
          <div>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>Fixed monthly</h3>
            {fixed.map(c => (
              <Field
                key={c.id}
                label={c.name}
                value={c.value}
                conf={c.confidence}
                unit="SEK"
                step={100}
                onValue={v => update('costs', c.id, { value: v })}
                onConf={x => update('costs', c.id, { confidence: x })}
              />
            ))}
          </div>
          <div>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>Per paying customer, per month</h3>
            {variable.map(c => (
              <Field
                key={c.id}
                label={c.name}
                value={c.value}
                conf={c.confidence}
                unit="SEK"
                step={10}
                onValue={v => update('costs', c.id, { value: v })}
                onConf={x => update('costs', c.id, { confidence: x })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Month by month</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th className="r">Customers</th>
                <th className="r">Revenue</th>
                <th className="r">Costs</th>
                <th className="r">Profit</th>
                <th className="r">Cash in bank</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map(r => (
                <tr key={r.month}>
                  <td className="mono">{r.month}</td>
                  <td className="r mono">{Math.round(r.total)}</td>
                  <td className="r mono">{fmt(r.revenue, '')}</td>
                  <td className="r mono">{fmt(r.costs, '')}</td>
                  <td
                    className="r mono"
                    style={{ color: r.profit >= 0 ? 'var(--verified)' : 'var(--assumption)' }}
                  >
                    {fmt(r.profit, '')}
                  </td>
                  <td className="r mono">{fmt(r.cash, '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
