// =====================================================================
// THE BRIEFING — the only thing the copilot is ever told.
//
// The one rule that must survive: every number carries a tag, and the
// copilot must say which of them were only assumed. Nothing outside this
// text reaches the model, so it cannot invent a figure you did not enter.
//
// Built on the SERVER from the saved database rows, so the briefing is
// what the model is really given — not something the browser claimed.
// =====================================================================

import { project, confidenceCount, stillAssumed, keToSek, CONF_LABEL, MONTHS } from './model.js'

const round = n => Math.round(Number(n) || 0)

export function buildBrief(m) {
  const p = project(m)
  const last = p.rows[MONTHS - 1]
  const c = confidenceCount(m)
  const assumed = stillAssumed(m)
  const fx = Number(m.settings.fx) || 1

  const priceLines = m.tiers
    .map(
      t =>
        `  ${t.name}: Sweden ${round(t.price_se)} SEK [${CONF_LABEL[t.price_se_conf]}] | ` +
        `Kenya ${round(t.price_ke)} KES = ${round(keToSek(t.price_ke, fx))} SEK [${CONF_LABEL[t.price_ke_conf]}]`
    )
    .join('\n')

  const growthLines = ['SE', 'KE']
    .map(code => {
      const M = m.markets[code]
      return (
        `  ${M.name}: start ${round(M.start_customers)}, ` +
        `+${M.new_per_month}/month [${CONF_LABEL[M.new_per_conf]}], ` +
        `churn ${M.churn}%/month [${CONF_LABEL[M.churn_conf]}], ` +
        `mix ${M.mix_ess}/${M.mix_pro}/${M.mix_ent} (ess/pro/ent), ` +
        `cost to win a customer ${round(M.cac)} ${code === 'SE' ? 'SEK' : 'KES'} [${CONF_LABEL[M.cac_conf]}]`
      )
    })
    .join('\n')

  const fixedList = m.costs
    .filter(x => x.kind === 'fixed')
    .map(x => `${x.name} ${round(x.value)} [${CONF_LABEL[x.confidence]}]`)
    .join('; ')
  const varList = m.costs
    .filter(x => x.kind === 'variable')
    .map(x => `${x.name} ${round(x.value)} [${CONF_LABEL[x.confidence]}]`)
    .join('; ')

  const people =
    m.roles.map(r => `${r.name} ${round(r.cost)} SEK from month ${r.start_month}`).join('; ') ||
    'none'

  const tierContents = m.features
    .map(f => {
      const inTiers = [f.ess && 'Essentials', f.pro && 'Professional', f.ent && 'Enterprise']
        .filter(Boolean)
        .join(', ')
      return `  ${f.name}: ${inTiers || 'not in any tier'}`
    })
    .join('\n')

  const evidenceLines = m.evidence.length
    ? m.evidence.map(e => `  ${e.who} (${e.market}): "${e.said}" -> ${e.affects}`).join('\n')
    : '  none logged yet'

  return `HaTi — pricing and growth model, current state.
Currency: SEK. Exchange rate used: ${m.settings.fx} KES per 1 SEK (${CONF_LABEL[m.settings.fx_conf]}).

PRICES (monthly)
${priceLines}

WHAT SITS IN EACH TIER
${tierContents}

GROWTH
${growthLines}

COSTS
  Fixed per month: ${round(p.fixed)} SEK (${fixedList})
  Per customer per month: ${round(p.varPer)} SEK (${varList})
  Customer acquisition charged per month: ${round(p.acq)} SEK
  People: ${people}

RESULT OVER 24 MONTHS
  Break-even: ${p.breakeven ? 'month ' + p.breakeven : 'not reached'}
  Month 24 revenue: ${round(last.revenue)} SEK/month | customers: ${round(last.custSE)} SE + ${round(last.custKE)} KE
  Deepest cash point: ${round(p.minCash)} SEK at month ${p.minCashMonth}
  Cash at start: ${round(m.settings.cash)} SEK (${CONF_LABEL[m.settings.cash_conf]})
  Safety buffer: ${round(m.settings.buffer)} SEK (${CONF_LABEL[m.settings.buffer_conf]})
  Target: ${round(m.settings.target_arr)} SEK/year by month ${m.settings.target_month}

TRUST LEVEL
  ${c.V} verified, ${c.E} estimated, ${c.A} assumed.
  Still only assumed: ${assumed.join(', ') || 'none'}.

EVIDENCE FROM REAL CONVERSATIONS
${evidenceLines}`
}

/** The instruction wrapped around the briefing. */
export function buildPrompt(briefing, question) {
  return `You are a hard-nosed strategy and finance advisor to a two-person startup selling contract software in Sweden and Kenya.

Here is the entire model. Use ONLY these numbers. Never invent a figure.

${briefing}

Question: ${question}

Rules for your answer:
- Plain English. The reader is a business director, not an accountant or developer.
- Under 250 words.
- Start with the direct answer in one sentence.
- Name the specific numbers you used.
- If your answer leans on a number tagged Assumed, say so explicitly.
- End with a line beginning "Weak point:" naming the assumption that would most change this answer if it were wrong.`
}
