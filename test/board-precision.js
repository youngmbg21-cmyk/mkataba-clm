/* THE BOARD'S PRECISION BOOK, measured (the owner's work order, Part 7,
   4 Oct 2026: "A hit rate everyone can see, kept from slipping").

   One book (test/board-precision-book.json), one judge, two halves:
     - the FREE half runs here, in the jsdom world, on every change (f502);
     - the COPILOT half runs in test/board-precision-eval.js against the real
       route, only when a Copilot key is present (npm run eval:board).
   Both read the same contracts (bookContracts) and the same judge
   (recipeMisses), so a miss means the same thing in either half. */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const BOOK_FILE = path.join(__dirname, 'board-precision-book.json');
const readBook = () => JSON.parse(fs.readFileSync(BOOK_FILE, 'utf8'));

const pad = n => String(n).padStart(2, '0');
/* a day in the month `off` months from now — mid-month, so no answer depends
   on the day the book is run */
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

/* f448's book: named counterparties, every stage, eight past months of
   signings that get a little faster */
function bookContracts(){
  const cs = [
    { id: 'MK-1', name: 'Warehouse Lease', counterparty: 'Siginon', status: 'Signed', value: 10e6, expiry: mon(2), folder: 'proc', metadata: { category: 'supplier', paymentTerms: '30 days' } },
    { id: 'MK-2', name: 'Distribution', counterparty: 'Sendy', status: 'Signed', value: 20e6, expiry: mon(7), folder: 'sales', metadata: { category: 'customer', paymentTerms: '60 days' } },
    { id: 'MK-3', name: 'Packaging', counterparty: 'Bidco', status: 'Draft', value: 5e6, folder: 'proc' },
    { id: 'MK-4', name: 'Retail', counterparty: 'Naivas', status: 'Under Review', value: 7e6, expiry: mon(14), folder: 'sales', metadata: { category: 'customer' } },
    { id: 'MK-5', name: 'Closed one', counterparty: 'Tuskys', status: 'Declined', value: 9e6 },
    { id: 'MK-6', name: 'Old Fleet', counterparty: 'Coast Motors', status: 'Signed', value: 3e6, expiry: mon(-1), metadata: { category: 'supplier' } },
    { id: 'MK-7', name: 'Freight', counterparty: 'Juno Logistics Ltd', status: 'Signed', value: 12e6, expiry: mon(3), folder: 'proc', owner: { name: 'Amina' } },
    { id: 'MK-8', name: 'Fresh supply', counterparty: 'Juno Fresh AB', status: 'Under Review', value: 4e6, expiry: mon(3), folder: 'proc' },
    { id: 'MK-9', name: 'Listing', counterparty: 'Juno Fresh AB', status: 'Draft', value: 2e6, folder: 'sales' },
  ];
  for (let k = 0; k < 8; k++){
    const off = k - 8;
    for (let j = 0; j < 3; j++){
      const days = 40 - 2 * k + j - 1, signed = mon(off, 10 + j), raised = new Date(Date.parse(signed + 'T00:00:00') - days * 864e5);
      cs.push({ id: 'MK-S' + k + j, name: 'Signed ' + k + j, counterparty: 'Kevian Kenya Ltd', status: 'Signed', value: 1e6 * (k + 1), expiry: mon(off + 12, 10 + j),
        signedAt: signed, _raisedAt: raised.toISOString(), folder: 'proc', negotiation: { rounds: Array.from({ length: 1 + (k % 3) }, () => ({})) } });
    }
  }
  return cs.map(c => ({ audit: [], metadata: {}, ...c }));
}

/* plain data, whatever realm it came from */
const J = v => v == null ? v : JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a == null ? null : a) === JSON.stringify(b == null ? null : b);
/* a split or a window is compared on the parts the book names */
const partsOf = (got, want) => {
  if (want == null || got == null) return same(got, want);
  if (typeof want !== 'object') return same(got, want);
  return Object.keys(want).every(k => same(got[k], want[k]));
};

/* THE ONE JUDGE: what a card's recipe (or the planner's P) got wrong against
   the book's want. Returns a list of plain sentences; empty is a hit. */
function recipeMisses(got, want){
  const out = [];
  const g = J(got) || {};
  for (const k of ['split', 'split2', 'window']) if (k in want && !partsOf(g[k] || null, want[k])) out.push(`${k}: wanted ${JSON.stringify(want[k])}, got ${JSON.stringify(g[k] || null)}`);
  for (const k of ['pic', 'measure', 'top', 'compare', 'title']) if (k in want && !same(g[k] == null ? null : g[k], want[k])) out.push(`${k}: wanted ${JSON.stringify(want[k])}, got ${JSON.stringify(g[k] == null ? null : g[k])}`);
  if ('trend' in want && !!g.trend !== !!want.trend) out.push(`trend: wanted ${!!want.trend}, got ${!!g.trend}`);
  if ('sort' in want && !partsOf(g.sort || null, want.sort)) out.push(`sort: wanted ${JSON.stringify(want.sort)}, got ${JSON.stringify(g.sort || null)}`);
  return out;
}

/* THE FREE HALF: one request in the jsdom world. A hit is the right card read
   free (or the board's own command, for a question with no chart words); a
   'copilot' request is a hit when HaTi hands it on rather than guess. */
function runFree(world, r){
  const w = world();
  try { return runFreeIn(w, r); } finally { try { w.close(); } catch (_){ /* a page left open keeps the run alive */ } }
}
function runFreeIn(w, r){
  if (r.after){ const a = w.hbAsk(r.after); if (!a) return { hit: false, why: ['the first question was not read: ' + r.after] }; }
  if (r.road === 'copilot'){
    const said = w.hbAsk(r.q);
    return said ? { hit: false, why: ['read free, but it is Copilot\'s to answer'] } : { hit: true, why: [] };
  }
  if (r.want.parse){
    const got = J(w.hbParse(r.q));
    return same(got, r.want.parse) ? { hit: true, why: [] } : { hit: false, why: [`parse: wanted ${JSON.stringify(r.want.parse)}, got ${JSON.stringify(got)}`] };
  }
  let said;
  try { said = w.hbAsk(r.q); } catch (e){ return { hit: false, why: ['threw: ' + e.message] }; }
  if (!said) return { hit: false, why: ['not read free: handed on to Copilot'] };
  const s = w.hbS(); const key = (s.path || []).slice(-1)[0];
  const D = key ? w.hbDigData(key, s.lens) : null;
  if (!D) return { hit: false, why: ['no card opened'] };
  const P = w.hbPlan(D);
  const why = recipeMisses(P, r.want);
  if ('set' in r.want){
    if (r.want.set === 'all'){ if (!D.whole) why.push(`set: wanted the whole book, got "${D.setLabel}"`); }
    else if (D.whole || !String(D.setLabel || '').toLowerCase().includes(String(r.want.set).toLowerCase())) why.push(`set: wanted "${r.want.set}", got ${D.whole ? 'the whole book' : '"' + D.setLabel + '"'}`);
  }
  return { hit: !why.length, why };
}

/* THE COPILOT HALF's judge: Copilot's answer (actions, or choices) against
   the book's want — the first action of the kind asked for, its recipe. */
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

module.exports = { ROOT, BOOK_FILE, readBook, mon, bookContracts, recipeMisses, runFree, judgeCopilot };
