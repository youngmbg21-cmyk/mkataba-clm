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
  for (const k of ['pic', 'measure', 'top', 'compare', 'title']) if (k in want && !same(g[k] == null ? null : g[k], want[k])) out.push(`${k}: wanted ${JSON.stringify(want[k])}, got ${JSON.stringify(g[k] == null ? null : g[k])}`);
  if ('trend' in want && !!g.trend !== !!want.trend) out.push(`trend: wanted ${!!want.trend}, got ${!!g.trend}`);
  if ('sort' in want && !partsOf(g.sort || null, want.sort)) out.push(`sort: wanted ${JSON.stringify(want.sort)}, got ${JSON.stringify(g.sort || null)}`);
  return out;
}
/* Copilot's answer (actions, or choices) against the book's want — the
   first action of the kind asked for, its recipe. */
function judgeCopilot(res, want){
  const acts = (res && Array.isArray(res.actions)) ? res.actions : [];
  if (want.cards){
    const n = acts.filter(a => a && a.do === 'add_card').length;
    return n >= want.cards ? [] : [`cards: wanted at least ${want.cards}, got ${n}`];
  }
  const a = acts.find(x => x && x.do === want.do);
  if (!a) return [`do: wanted ${want.do}, got ${JSON.stringify(acts.map(x => x && x.do))}`];
  return want.recipe ? recipeMisses(a.recipe || {}, want.recipe) : [];
}
module.exports = { recipeMisses, judgeCopilot };
