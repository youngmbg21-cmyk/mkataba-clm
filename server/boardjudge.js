/* THE BOARD'S PRECISION JUDGE — ONE copy, read by the precision tests
   (test/board-precision.js, f502), the Copilot half's eval script and the
   server's weekly accuracy run (runBoardAccuracy). A miss means the same
   thing wherever it is judged (work order "the board that answers right",
   Part 7, 5 Oct 2026). */
'use strict';
/* plain data, whatever realm it came from */
const J = v => v == null ? v : JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a == null ? null : a) === JSON.stringify(b == null ? null : b);
/* a split or a window is compared on the parts the book names */
const partsOf = (got, want) => {
  if (want == null || got == null) return same(got, want);
  if (typeof want !== 'object') return same(got, want);
  return Object.keys(want).every(k => same(got[k], want[k]));
};
/* what a card's recipe (or the planner's P) got wrong against the book's
   want. Returns a list of plain sentences; empty is a hit. */
function recipeMisses(got, want){
  const out = [];
  const g = J(got) || {};
  for (const k of ['split', 'split2', 'window']) if (k in want && !partsOf(g[k] || null, want[k])) out.push(`${k}: wanted ${JSON.stringify(want[k])}, got ${JSON.stringify(g[k] || null)}`);
  for (const k of ['pic', 'measure', 'top', 'compare', 'title', 'show']) if (k in want && !same(g[k] == null ? null : g[k], want[k])) out.push(`${k}: wanted ${JSON.stringify(want[k])}, got ${JSON.stringify(g[k] == null ? null : g[k])}`);
  if ('trend' in want && !!g.trend !== !!want.trend) out.push(`trend: wanted ${!!want.trend}, got ${!!g.trend}`);
  if ('sort' in want && !partsOf(g.sort || null, want.sort)) out.push(`sort: wanted ${JSON.stringify(want.sort)}, got ${JSON.stringify(g.sort || null)}`);
  return out;
}
/* Copilot's answer (actions, or choices) against the book's want — the
   first action of the kind asked for, its recipe. */
function judgeCopilot(res, want){
  const acts = (res && Array.isArray(res.actions)) ? res.actions : [];
  /* an open question (Charts That Explain): a hit is words, whatever it draws */
  if (want.answer) return String((res && res.answer) || '').trim() ? [] : ['answer: wanted words, got none'];
  if (want.cards){
    const n = acts.filter(a => a && a.do === 'add_card').length;
    return n >= want.cards ? [] : [`cards: wanted at least ${want.cards}, got ${n}`];
  }
  const a = acts.find(x => x && x.do === want.do);
  if (!a) return [`do: wanted ${want.do}, got ${JSON.stringify(acts.map(x => x && x.do))}`];
  return want.recipe ? recipeMisses(a.recipe || {}, want.recipe) : [];
}
/* EVERY NUMBER IN AN ANSWER (Charts That Explain, rec 8): a number Copilot
   states must be one it was shown — the same rule the board's fact sheet
   holds every summary to (hbFactCheck): the digits alone ("SEK 1.06B" →
   106). A figure it was shown in full may be said short (12,000,000 as 12M,
   1.2M or 1 200 000), so the shown figures are added in thousands, millions
   and billions too. Returns the numbers it was not shown; empty is clean. */
const _digits = t => (String(t || '').match(/\d(?:[\d\u00a0 ,.]*\d)?/g) || []).map(x => x.replace(/\D/g, '')).filter(Boolean);
function numbersOutside(text, shown){
  const have = new Set();
  const put = d => { if (d){ have.add(d); have.add(String(Number(d))); } };
  (String(shown || '').match(/\d+(?:\.\d+)?/g) || []).forEach(raw => {
    _digits(raw).forEach(put);
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1000) for (const div of [1e3, 1e6, 1e9]) if (n >= div) for (const dp of [0, 1, 2]) put(String((n / div).toFixed(dp)).replace(/\D/g, ''));
  });
  return _digits(text).filter(d => !have.has(d) && !have.has(String(Number(d))));
}
module.exports = { recipeMisses, judgeCopilot, numbersOutside };
