import Field from './Field.jsx'
import { project, MONTHS } from '../../shared/model.js'
import { fmt } from '../lib/format.js'

function MarketGrowth({ market, update }) {
  const set = patch => update('markets', market.id, patch)
  return (
    <>
      <Field
        label="Customers you already have"
        value={market.start_customers}
        conf={market.start_conf}
        step={1}
        onValue={v => set({ start_customers: v })}
        onConf={c => set({ start_conf: c })}
      />
      <Field
        label="New customers won per month"
        value={market.new_per_month}
        conf={market.new_per_conf}
        step={0.5}
        onValue={v => set({ new_per_month: v })}
        onConf={c => set({ new_per_conf: c })}
      />
      <Field
        label="Monthly churn"
        value={market.churn}
        conf={market.churn_conf}
        unit="%"
        step={0.5}
        onValue={v => set({ churn: v })}
        onConf={c => set({ churn_conf: c })}
      />
      <Field
        label="Tier mix — Essentials"
        value={market.mix_ess}
        conf={market.mix_ess_conf}
        unit="%"
        step={5}
        onValue={v => set({ mix_ess: v })}
        onConf={c => set({ mix_ess_conf: c })}
      />
      <Field
        label="Tier mix — Professional"
        value={market.mix_pro}
        conf={market.mix_pro_conf}
        unit="%"
        step={5}
        onValue={v => set({ mix_pro: v })}
        onConf={c => set({ mix_pro_conf: c })}
      />
      <Field
        label="Tier mix — Enterprise"
        value={market.mix_ent}
        conf={market.mix_ent_conf}
        unit="%"
        step={5}
        onValue={v => set({ mix_ent: v })}
        onConf={c => set({ mix_ent_conf: c })}
      />
    </>
  )
}

export default function Growth({ model, update, updateSettings, addRow, deleteRow }) {
  const s = model.settings
  const p = project(model)

  const targetMonth = Math.min(Math.max(Number(s.target_month) || 24, 1), MONTHS)
  const arrAt = p.rows[targetMonth - 1].revenue * 12
  const gap = (Number(s.target_arr) || 0) - arrAt
  const need = Math.max(0, (Number(s.buffer) || 0) - p.minCash)

  return (
    <>
      <div className="card">
        <h2>How customers arrive</h2>
        <p className="sub">
          Two markets grow at different speeds and lose customers at different rates. Set each one
          honestly, including the tier mix — selling ten Essentials is not the same business as
          selling ten Enterprise.
        </p>
        <div className="split">
          <div>
            <div className="mkt se">Sweden</div>
            <MarketGrowth market={model.markets.SE} update={update} />
          </div>
          <div className="rule" />
          <div>
            <div className="mkt ke">Kenya</div>
            <MarketGrowth market={model.markets.KE} update={update} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>The target, working backwards</h2>
        <p className="sub">
          Say where you want to be. The model tells you whether today's plan gets there, and what has
          to change if it doesn't.
        </p>
        <Field
          label="Yearly revenue target"
          hint='What "we made it" looks like'
          value={s.target_arr}
          conf={s.target_arr_conf}
          unit="SEK"
          step={100000}
          onValue={v => updateSettings({ target_arr: v })}
          onConf={c => updateSettings({ target_arr_conf: c })}
        />
        <Field
          label="By month"
          hint="Month 1 is the month you start selling"
          value={s.target_month}
          conf={s.target_month_conf}
          step={1}
          onValue={v => updateSettings({ target_month: v })}
          onConf={c => updateSettings({ target_month_conf: c })}
        />

        <div className={'note' + (gap > 0 ? ' warn' : '')}>
          {gap <= 0 ? (
            <>
              On these numbers you pass the target by month {targetMonth}: yearly revenue would be
              about <b>{fmt(arrAt)}</b>. Check the assumptions behind it before celebrating.
            </>
          ) : (
            <>
              On these numbers you land at about <b>{fmt(arrAt)}</b> a year by month {targetMonth} —
              short by <b>{fmt(gap)}</b>. Closing it means more customers per month, higher prices,
              or a later date. The model will not close it for you.
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>People</h2>
        <p className="sub">
          Add a role and the month it starts. Salaries land in the cost base automatically, so hiring
          earlier pushes break-even later — you can see the trade instead of guessing it.
        </p>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Market</th>
                <th className="r">Cost SEK/mo</th>
                <th className="r">Starts month</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {model.roles.map(r => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="text"
                      value={r.name}
                      onChange={e => update('roles', r.id, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={r.market}
                      onChange={e => update('roles', r.id, { market: e.target.value })}
                    >
                      <option value="SE">Sweden</option>
                      <option value="KE">Kenya</option>
                    </select>
                  </td>
                  <td className="r">
                    <input
                      type="number"
                      step={1000}
                      value={r.cost}
                      onChange={e =>
                        update('roles', r.id, { cost: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="r">
                    <input
                      type="number"
                      style={{ width: 70 }}
                      value={r.start_month}
                      onChange={e =>
                        update('roles', r.id, { start_month: parseInt(e.target.value, 10) || 1 })
                      }
                    />
                  </td>
                  <td className="r">
                    <button className="btn ghost" onClick={() => deleteRow('roles', r.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          className="btn ghost"
          style={{ marginTop: 12 }}
          onClick={() =>
            addRow('roles', {
              name: 'New role',
              market: 'SE',
              cost: 45000,
              start_month: 12,
              sort: model.roles.length + 1
            })
          }
        >
          Add a role
        </button>
      </div>

      <div className="card">
        <h2>Funding</h2>
        <p className="sub">
          Cash you start with, against the deepest hole the plan digs. If the hole is deeper than the
          cash, the plan needs money or needs slowing down.
        </p>
        <Field
          label="Cash you start with"
          value={s.cash}
          conf={s.cash_conf}
          unit="SEK"
          step={10000}
          onValue={v => updateSettings({ cash: v })}
          onConf={c => updateSettings({ cash_conf: c })}
        />
        <Field
          label="Safety buffer you refuse to go below"
          value={s.buffer}
          conf={s.buffer_conf}
          unit="SEK"
          step={10000}
          onValue={v => updateSettings({ buffer: v })}
          onConf={c => updateSettings({ buffer_conf: c })}
        />

        <div className={'note' + (p.minCash >= s.buffer ? '' : ' warn')}>
          {p.minCash >= s.buffer ? (
            <>Cash never drops below your buffer. This plan can be self-funded as drawn.</>
          ) : (
            <>
              The plan digs a hole of <b>{fmt(Math.abs(Math.min(0, p.minCash)))}</b> at month{' '}
              {p.minCashMonth}. To keep your buffer intact you need roughly <b>{fmt(need)}</b> more —
              from savings, slower hiring, or outside money.
            </>
          )}
        </div>
      </div>
    </>
  )
}
