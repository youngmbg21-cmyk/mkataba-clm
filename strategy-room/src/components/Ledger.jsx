import Field from './Field.jsx'

function MarketFields({ market, update }) {
  const set = patch => update('markets', market.id, patch)
  const cur = market.code === 'SE' ? 'SEK' : 'KES'

  return (
    <>
      <Field
        label="New customers won per month"
        hint="Be honest, not hopeful"
        value={market.new_per_month}
        conf={market.new_per_conf}
        step={0.5}
        onValue={v => set({ new_per_month: v })}
        onConf={c => set({ new_per_conf: c })}
      />
      <Field
        label="Monthly churn"
        hint="Share of customers who leave each month"
        value={market.churn}
        conf={market.churn_conf}
        unit="%"
        step={0.5}
        onValue={v => set({ churn: v })}
        onConf={c => set({ churn_conf: c })}
      />
      <Field
        label="Cost to win one customer"
        hint="Marketing plus your time"
        value={market.cac}
        conf={market.cac_conf}
        unit={cur}
        step={100}
        onValue={v => set({ cac: v })}
        onConf={c => set({ cac_conf: c })}
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

export default function Ledger({ model, update, updateSettings, addRow, deleteRow }) {
  const s = model.settings

  return (
    <>
      <div className="card">
        <h2>Assumptions ledger</h2>
        <p className="sub">
          Every number the model uses lives here first. Tap the tag beside a number to move it from{' '}
          <b>Assumed</b> → <b>Estimated</b> → <b>Verified</b> as real evidence arrives from pilots,
          invoices and quotes. The bar at the top shows how much of your strategy is still guesswork.
        </p>

        <div className="split">
          <div>
            <div className="mkt se">Sweden</div>
            <MarketFields market={model.markets.SE} update={update} />
          </div>
          <div className="rule" />
          <div>
            <div className="mkt ke">Kenya</div>
            <MarketFields market={model.markets.KE} update={update} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Shared assumptions</h2>
        <p className="sub">Numbers that apply to the whole business, not one market.</p>
        <Field
          label="Exchange rate"
          hint="Kenyan shillings per 1 Swedish krona"
          value={s.fx}
          conf={s.fx_conf}
          unit="KES"
          step={0.1}
          onValue={v => updateSettings({ fx: v })}
          onConf={c => updateSettings({ fx_conf: c })}
        />
        <Field
          label="Cash you start with"
          value={s.cash}
          conf={s.cash_conf}
          unit="SEK"
          step={10000}
          onValue={v => updateSettings({ cash: v })}
          onConf={c => updateSettings({ cash_conf: c })}
        />
      </div>

      <div className="card">
        <h2>Evidence log</h2>
        <p className="sub">
          What did a real prospect actually say? One line per conversation. This is what turns an
          assumption into a verified number.
        </p>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Who</th>
                <th>Market</th>
                <th>What they told us</th>
                <th>Number it affects</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {model.evidence.map(e => (
                <tr key={e.id}>
                  <td>
                    <input
                      type="text"
                      value={e.who}
                      placeholder="Company or person"
                      onChange={ev => update('evidence', e.id, { who: ev.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={e.market}
                      onChange={ev => update('evidence', e.id, { market: ev.target.value })}
                    >
                      <option value="SE">Sweden</option>
                      <option value="KE">Kenya</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      style={{ width: '100%' }}
                      value={e.said}
                      placeholder='"We would pay around..."'
                      onChange={ev => update('evidence', e.id, { said: ev.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={e.affects}
                      placeholder="e.g. Professional price"
                      onChange={ev => update('evidence', e.id, { affects: ev.target.value })}
                    />
                  </td>
                  <td className="r">
                    <button className="btn ghost" onClick={() => deleteRow('evidence', e.id)}>
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
          onClick={() => addRow('evidence', { who: '', market: 'SE', said: '', affects: '' })}
        >
          Add a conversation
        </button>

        <div className="note">
          The tool gets smarter as you sell. It cannot make good numbers on its own — pilot calls do
          that.
        </div>
      </div>
    </>
  )
}
