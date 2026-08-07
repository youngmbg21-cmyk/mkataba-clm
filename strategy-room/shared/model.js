// =====================================================================
// THE MODEL — 24 months of customers, money in, money out.
//
// This file is used by BOTH the browser and the server function, so the
// numbers on screen and the numbers the copilot is given can never
// disagree. Do not fork it.
// =====================================================================

export const MONTHS = 24

export const CONF_LABEL = { A: 'Assumed', E: 'Estimated', V: 'Verified' }
export const CONF_NEXT = { A: 'E', E: 'V', V: 'A' }

/** Kenyan shillings -> Swedish kronor. */
export const keToSek = (kes, fx) => (fx ? kes / fx : 0)

/**
 * Run the model.
 *
 * `m` is the whole model in the shape built by shapeModel() below.
 * Returns 24 rows plus the headline results.
 */
export function project(m) {
  const rows = []
  const cust = {
    SE: Number(m.markets.SE.start_customers) || 0,
    KE: Number(m.markets.KE.start_customers) || 0
  }
  const fx = Number(m.settings.fx) || 1

  let cash = Number(m.settings.cash) || 0
  let breakeven = null
  let minCash = Infinity
  let minCashMonth = 1

  const fixed = m.costs
    .filter(c => c.kind === 'fixed')
    .reduce((a, c) => a + (Number(c.value) || 0), 0)
  const varPer = m.costs
    .filter(c => c.kind === 'variable')
    .reduce((a, c) => a + (Number(c.value) || 0), 0)

  // Cost of winning new customers, charged every month against the new
  // customers won that month. Simplistic but honest enough.
  const acq =
    (Number(m.markets.SE.new_per_month) || 0) * (Number(m.markets.SE.cac) || 0) +
    (Number(m.markets.KE.new_per_month) || 0) * keToSek(Number(m.markets.KE.cac) || 0, fx)

  for (let month = 1; month <= MONTHS; month++) {
    let revenue = 0
    let total = 0

    for (const code of ['SE', 'KE']) {
      const M = m.markets[code]
      const churn = Number(M.churn) || 0
      cust[code] = cust[code] * (1 - churn / 100) + (Number(M.new_per_month) || 0)
      total += cust[code]

      // Tier mix percentages are not forced to add up to 100 —
      // the model normalises them instead.
      const mixSum =
        (Number(M.mix_ess) || 0) + (Number(M.mix_pro) || 0) + (Number(M.mix_ent) || 0) || 1

      for (const t of m.tiers) {
        const share = (Number(M['mix_' + t.tier_key]) || 0) / mixSum
        const priceSek =
          code === 'SE' ? Number(t.price_se) || 0 : keToSek(Number(t.price_ke) || 0, fx)
        revenue += cust[code] * share * priceSek
      }
    }

    const people = m.roles
      .filter(r => month >= (Number(r.start_month) || 1))
      .reduce((a, r) => a + (Number(r.cost) || 0), 0)

    const costs = fixed + varPer * total + people + acq
    const profit = revenue - costs
    cash += profit

    if (profit > 0 && breakeven === null) breakeven = month
    if (cash < minCash) {
      minCash = cash
      minCashMonth = month
    }

    rows.push({
      month,
      custSE: cust.SE,
      custKE: cust.KE,
      total,
      revenue,
      costs,
      profit,
      cash
    })
  }

  return { rows, breakeven, minCash, minCashMonth, fixed, varPer, acq }
}

/**
 * Count how many numbers are Assumed / Estimated / Verified.
 * This is what the bar at the top of the screen shows.
 */
export function confidenceCount(m) {
  const c = { A: 0, E: 0, V: 0 }
  const add = tag => {
    if (tag && c[tag] !== undefined) c[tag]++
  }

  const s = m.settings
  ;[s.fx_conf, s.target_arr_conf, s.target_month_conf, s.cash_conf, s.buffer_conf].forEach(add)

  for (const code of ['SE', 'KE']) {
    const M = m.markets[code]
    ;[
      M.start_conf,
      M.new_per_conf,
      M.churn_conf,
      M.cac_conf,
      M.mix_ess_conf,
      M.mix_pro_conf,
      M.mix_ent_conf
    ].forEach(add)
  }

  m.tiers.forEach(t => {
    add(t.price_se_conf)
    add(t.price_ke_conf)
  })
  m.costs.forEach(x => add(x.confidence))

  return c
}

/** Every number still tagged Assumed, in plain English. */
export function stillAssumed(m) {
  const out = []
  const s = m.settings

  if (s.fx_conf === 'A') out.push('exchange rate')
  if (s.cash_conf === 'A') out.push('cash you start with')
  if (s.buffer_conf === 'A') out.push('safety buffer')
  if (s.target_arr_conf === 'A') out.push('yearly revenue target')

  m.tiers.forEach(t => {
    if (t.price_se_conf === 'A') out.push(`${t.name} price Sweden`)
    if (t.price_ke_conf === 'A') out.push(`${t.name} price Kenya`)
  })

  for (const code of ['SE', 'KE']) {
    const M = m.markets[code]
    if (M.new_per_conf === 'A') out.push(`new customers/month ${M.name}`)
    if (M.churn_conf === 'A') out.push(`churn ${M.name}`)
    if (M.cac_conf === 'A') out.push(`cost to win a customer ${M.name}`)
  }

  m.costs.forEach(c => {
    if (c.confidence === 'A') out.push(`cost: ${c.name}`)
  })

  return out
}

/**
 * Turn the raw database rows into the single object the rest of the app
 * (and the server function) works with.
 */
export function shapeModel({ settings, markets, tiers, features, costs, roles, evidence }) {
  const byCode = {}
  ;(markets || []).forEach(m => {
    byCode[m.code] = m
  })

  return {
    settings: settings || {},
    markets: {
      SE: byCode.SE || {},
      KE: byCode.KE || {}
    },
    tiers: [...(tiers || [])].sort((a, b) => a.sort - b.sort),
    features: [...(features || [])].sort((a, b) => a.sort - b.sort),
    costs: [...(costs || [])].sort((a, b) => a.sort - b.sort),
    roles: [...(roles || [])].sort((a, b) => a.sort - b.sort),
    evidence: evidence || []
  }
}
