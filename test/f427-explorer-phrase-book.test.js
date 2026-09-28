/* f427 — EXPLORER'S PHRASE BOOK (the view recipe, step 7; Young, 28 Sep 2026:
   "Think of all variations of how people can ask questions to segment
   different requests").

   Each line is a real way of asking, in English or Swedish, and the recipe
   change the free built-in reader must make of it — no Copilot is asked, so
   the whole book runs for nothing. A line whose answer is null is NOT for the
   reader: it is a question about wording or something only Copilot can place,
   and it must be passed on untouched. Line 1 is the question that started it
   ("divide the floors by payment terms", answered as a reading of one
   contract on 28 Sep). A phrasing that fails is added here first; that is how
   the reader gets better.

   How a line is read: every key in the expected object must match the
   reader's result, and the result may carry no key the line does not name.
   Roles, views, sort, top and ask are exact; a narrowing ("only", "and",
   "hide", "highlight") names the conditions it must contain, as lower-case
   pieces of their labels. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BOOK = [
  { id: 'MK-101', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', folder: 'proc', kind: 'Supply', status: 'Signed', value: 48e6, metadata: { liabilityCapped: 'capped', governingLaw: 'Kenya', paymentTerms: '30 days' } },
  { id: 'MK-102', name: 'Modern Trade Listing', counterparty: 'Naivas Supermarkets', folder: 'sales', kind: 'Distribution', status: 'Under Review', value: 85e6, metadata: { liabilityCapped: 'uncapped', governingLaw: 'England', paymentTerms: '90 days' } },
  { id: 'MK-103', name: 'Retail Supply — Coast', counterparty: 'Carrefour Kenya', folder: 'sales', kind: 'Distribution', status: 'Draft', value: 22e6, metadata: { liabilityCapped: 'uncapped', governingLaw: 'England' } },
  { id: 'MK-104', name: 'Mutual Non-Disclosure', counterparty: 'Safaricom', folder: 'corp', kind: 'NDA', status: 'Signed', value: 0, metadata: { governingLaw: 'Kenya' } },
  { id: 'MK-105', name: 'Office Lease Westlands', counterparty: 'Delta Towers', folder: 'corp', kind: 'Lease', status: 'Declined', value: 12e6, metadata: { liabilityCapped: 'capped', governingLaw: 'Kenya' } },
  { id: 'MK-106', name: 'Creative Agency', counterparty: 'Ogilvy Africa', folder: 'mktg', kind: 'Services', status: 'Signed', value: 9e6, metadata: { liabilityCapped: 'capped', governingLaw: 'Sweden' } },
  { id: 'MK-107', name: 'Cold Chain Logistics', counterparty: 'Bolloré Transport', folder: 'wh', kind: 'Services', status: 'Under Review', value: 30e6, parentId: 'MK-101', relation: 'amendment', metadata: {} },
];
const FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' }, corp: { id: 'corp', name: 'Corporate & Compliance' },
  mktg: { id: 'mktg', name: 'Marketing & Brand' }, wh: { id: 'wh', name: 'Warehousing & Distribution' } };

/* [phrase, expected]. Expected keys: group floors columns colour size label
   time (a fact key) · view (brain|wiring|floors|grid|timeline) · sort · top
   ("n:by" or "n:by:per") · only / and / hide / highlight (label pieces) ·
   compare · linked · families · undo · everything · save · open · ask ·
   unknown (the role) · null = passed on to Copilot. */
const BOOKLINES = [
  // ---------- floors ----------
  ['divide the floors by payment terms', { floors: 'payterms', view: 'floors' }],
  ['Divide the floors by payment terms', { floors: 'payterms', view: 'floors' }],
  ['floors by payment terms', { floors: 'payterms', view: 'floors' }],
  ['put the floors by value stream', { floors: 'folder', view: 'floors' }],
  ['stack the levels by risk', { floors: 'risk', view: 'floors' }],
  ['make the floors the liability cap', { floors: 'liability', view: 'floors' }],
  ['floors per counterparty', { floors: 'counterparty', view: 'floors' }],
  ['split the floors by governing law', { floors: 'law', view: 'floors' }],
  ['layers by owner', { floors: 'owner', view: 'floors' }],
  ['show the floors by expiry window', { floors: 'expiry', view: 'floors' }],
  ['floors by renewal decision', { floors: 'decision', view: 'floors' }],
  ['tiers by open obligations', { floors: 'obligations', view: 'floors' }],
  ['floors by whether read', { floors: 'read', view: 'floors' }],
  ['dela våningarna efter betalningsvillkor', { floors: 'payterms', view: 'floors' }],
  ['våningar efter värdeström', { floors: 'folder', view: 'floors' }],
  ['våningar efter risk', { floors: 'risk', view: 'floors' }],
  ['nivåer efter motpart', { floors: 'counterparty', view: 'floors' }],
  // ---------- floors without "by" (Young, 29 Sep 2026: "maybe i want copilot
  // to create floors of value stream or floors of owners") ----------
  ['floors of value stream', { floors: 'folder', view: 'floors' }],
  ['floors of owners', { floors: 'owner', view: 'floors' }],
  ['create floors of owners', { floors: 'owner', view: 'floors' }],
  ['make floors of the counterparties', { floors: 'counterparty', view: 'floors' }],
  ['show the streams as floors', { floors: 'folder', view: 'floors' }],
  ['put the owners on the floors', { floors: 'owner', view: 'floors' }],
  ['change the floors to value streams', { floors: 'folder', view: 'floors' }],
  ['switch the floors to payment terms', { floors: 'payterms', view: 'floors' }],
  ['make the floors governing law', { floors: 'law', view: 'floors' }],
  ['stream floors', { floors: 'folder', view: 'floors' }],
  ['one floor per customer', { floors: 'counterparty', view: 'floors' }],
  ['a floor for each type', { floors: 'kind', view: 'floors' }],
  ['floors should be risk', { floors: 'risk', view: 'floors' }],
  ['stack them by value', { floors: 'valueBand', view: 'floors' }],
  ['stacked by expiry window', { floors: 'expiry', view: 'floors' }],
  ['rows by stage', { floors: 'status', view: 'floors' }],
  ['våningar av värdeström', { floors: 'folder', view: 'floors' }],
  ['gör våningarna till ägare', { floors: 'owner', view: 'floors' }],
  ['visa värdeström som våningar', { floors: 'folder', view: 'floors' }],
  ['en våning per motpart', { floors: 'counterparty', view: 'floors' }],
  // ---------- other shapes without "by" ----------
  ['columns of owners', { columns: 'owner', view: 'grid' }],
  ['make the colours the risk', { colour: 'risk' }],
  ['colour-code by payment terms', { colour: 'payterms' }],
  ['colour-code the stages', { colour: 'status' }],
  ['label each dot with its owner', { label: 'owner' }],
  ['lanes by stage', { group: 'status' }],
  ['timeline with lanes by owner', { view: 'timeline', group: 'owner' }],
  ['group of streams', { group: 'folder' }],
  ['färglägg risk', { colour: 'risk' }],
  // ---------- back to where the map starts ----------
  ['reset', { everything: true, landing: true }],
  ['start over', { everything: true, landing: true }],
  ['back to the start', { everything: true, landing: true }],
  // ---------- columns and the grid ----------
  ['columns by counterparty', { columns: 'counterparty', view: 'grid' }],
  ['streams against stages', { columns: 'folder', floors: 'status', view: 'grid' }],
  ['value stream against stage', { columns: 'folder', floors: 'status', view: 'grid' }],
  ['counterparty vs risk', { columns: 'counterparty', floors: 'risk', view: 'grid' }],
  ['payment terms per stream grid', { columns: 'payterms', floors: 'folder', view: 'grid' }],
  ['show a grid of stream by stage', { columns: 'folder', floors: 'status', view: 'grid' }],
  ['matrix of type by governing law', { columns: 'kind', floors: 'law', view: 'grid' }],
  ['liability cap against value', { columns: 'liability', floors: 'valueBand', view: 'grid' }],
  ['columns by stream and floors by stage', { columns: 'folder', floors: 'status', view: 'grid' }],
  ['kolumner efter motpart', { columns: 'counterparty', view: 'grid' }],
  ['värdeström mot status', { columns: 'folder', floors: 'status', view: 'grid' }],
  ['motpart mot risk', { columns: 'counterparty', floors: 'risk', view: 'grid' }],
  ['show it as a grid', { view: 'grid' }],
  ['as a matrix', { view: 'grid' }],
  ['visa som rutnät', { view: 'grid' }],
  // ---------- grouping ----------
  ['group by customer', { group: 'counterparty' }],
  ['group by counterparty', { group: 'counterparty' }],
  ['group them by payment terms', { group: 'payterms' }],
  ['cluster by expiry', { group: 'expiry' }],
  ['bundle by value stream', { group: 'folder' }],
  ['split by stage', { group: 'status' }],
  ['divide by liability cap', { group: 'liability' }],
  ['separate them by governing law', { group: 'law' }],
  ['segment by owner', { group: 'owner' }],
  ['break it down by type', { group: 'kind' }],
  ['organise by risk', { group: 'risk' }],
  ['arrange by renewal', { group: 'decision' }],
  ['contracts by stream', { group: 'folder' }],
  ['per supplier', { group: 'counterparty' }],
  ['by signed year', { group: 'signedYear' }],
  ['group by year signed', { group: 'signedYear' }],
  ['group by quarter signed', { group: 'signedQuarter' }],
  ['group by expiry year', { group: 'expiryYear' }],
  ['group by month created', { group: 'createdMonth' }],
  ['group by where they came from', { group: 'source' }],
  ['group by open obligations', { group: 'obligations' }],
  ['group by value', { group: 'valueBand' }],
  ['group by region', { unknown: 'group' }],
  ['gruppera efter motpart', { group: 'counterparty' }],
  ['gruppera efter betalningsvillkor', { group: 'payterms' }],
  ['dela upp efter värdeström', { group: 'folder' }],
  ['klustra efter risk', { group: 'risk' }],
  ['gruppera efter ägare', { group: 'owner' }],
  ['gruppera efter tillämplig lag', { group: 'law' }],
  ['avtal per kund', { group: 'counterparty' }],
  // ---------- colour ----------
  ['colour by payment terms', { colour: 'payterms' }],
  ['color by risk', { colour: 'risk' }],
  ['colour them by stage', { colour: 'status' }],
  ['colour the dots by governing law', { colour: 'law' }],
  ['shade by value stream', { colour: 'folder' }],
  ['colour by liability cap', { colour: 'liability' }],
  ['colour by whether read', { colour: 'read' }],
  ['colour by rainbow sparkles', { unknown: 'colour' }],
  ['färga efter risk', { colour: 'risk' }],
  ['färga efter betalningsvillkor', { colour: 'payterms' }],
  ['färglägg efter värdeström', { colour: 'folder' }],
  // ---------- size ----------
  ['size by value', { size: 'value' }],
  ['size by obligations', { size: 'obligations' }],
  ['size them by nothing', { size: 'same' }],
  ['make them all the same size', { size: 'same' }],
  ['sized by money', { size: 'value' }],
  ['storlek efter värde', { size: 'value' }],
  ['storlek efter åtaganden', { size: 'obligations' }],
  // ---------- labels ----------
  ['label by owner', { label: 'owner' }],
  ['label them by counterparty', { label: 'counterparty' }],
  ['labelled by payment terms', { label: 'payterms' }],
  ['tag with governing law', { label: 'law' }],
  ['etiketter efter ägare', { label: 'owner' }],
  // ---------- several at once ----------
  ['colour by payment terms and size by value', { colour: 'payterms', size: 'value' }],
  ['group by stream, colour by risk and size by obligations', { group: 'folder', colour: 'risk', size: 'obligations' }],
  ['floors by payment terms and colour by risk', { floors: 'payterms', colour: 'risk', view: 'floors' }],
  ['gruppera efter motpart och färga efter risk', { group: 'counterparty', colour: 'risk' }],
  // ---------- the timeline ----------
  ['show it as a timeline', { view: 'timeline' }],
  ['timeline', { view: 'timeline' }],
  ['timeline of signing dates', { view: 'timeline', time: 'signed' }],
  ['timeline by expiry', { view: 'timeline', time: 'expiry' }],
  ['show renewals over time', { view: 'timeline', time: 'decision' }],
  ['timeline of when they were created', { view: 'timeline', time: 'created' }],
  ['visa tidslinje', { view: 'timeline' }],
  ['tidslinje efter signeringsdatum', { view: 'timeline', time: 'signed' }],
  // ---------- the views ----------
  ['brain view', { view: 'brain' }],
  ['show it as a brain', { view: 'brain' }],
  ['wiring', { view: 'wiring' }],
  ['network view', { view: 'wiring' }],
  ['hjärnvy', { view: 'brain' }],
  // ---------- which contracts: only ----------
  ['only drafts', { only: ['draft'] }],
  ['show only drafts', { only: ['draft'] }],
  ['just the signed ones', { only: ['executed'] }],
  ['only contracts in review', { only: ['review'] }],
  ['only Naivas', { only: ['naivas'] }],
  ['only Sales', { only: ['sales'] }],
  ['only NDAs', { only: ['nda'] }],
  ['only leases', { only: ['lease'] }],
  ['only uncapped contracts', { only: ['uncapped'] }],
  ['only English law contracts', { only: ['england'] }],
  ['only contracts under Kenyan law', { only: ['kenya'] }],
  ['only contracts over 20M', { only: ['over 20'] }],
  ['only contracts above SEK 50 million', { only: ['above 50'] }],
  ['only contracts under 10M', { only: ['under 10'] }],
  ['only uncapped Sales contracts over 20M', { only: ['uncapped', 'sales', 'over 20'] }],
  ['only contracts renewing in the next 90 days', { only: ['renewing'] }],
  ['only contracts expiring within 6 months', { only: ['expiring'] }],
  ['only contracts renewing this year', { only: ['renewing this year'] }],
  ['only contracts signed in 2025', { only: ['signed in 2025'] }],
  ['only overdue ones', { only: ['overdue'] }],
  ['only the ones waiting on us', { only: ['waiting on us'] }],
  ['only contracts waiting on them', { only: ['waiting on them'] }],
  ['only contracts not read yet', { only: ['not read'] }],
  ['only off-standard contracts', { only: ['off standard'] }],
  ['only contracts paying later than 30 days', { only: ['paying later than 30'] }],
  ['only contracts nobody owns', { only: ['nobody owns'] }],
  ['show me the signed Naivas contracts', { only: ['executed', 'naivas'] }],
  ['show the drafts', { only: ['draft'] }],
  ['find contracts expiring within 30 days', { only: ['expiring'] }],
  ['bara utkast', { only: ['draft'] }],
  ['visa bara signerade', { only: ['executed'] }],
  ['endast Naivas', { only: ['naivas'] }],
  ['bara avtal över 20 miljoner', { only: ['över 20'] }],
  ['bara obegränsat ansvar', { only: ['uncapped'] }],
  ['visa bara försenade', { only: ['overdue'] }],
  ['bara avtal som förnyas inom 90 dagar', { only: ['förnyas'] }],
  // ---------- hide ----------
  ['hide the closed ones', { hide: ['closed'] }],
  ['everything except NDAs', { hide: ['nda'] }],
  ['without the drafts', { hide: ['draft'] }],
  ['exclude Naivas', { hide: ['naivas'] }],
  ['leave out the leases', { hide: ['lease'] }],
  ['dölj stängda', { hide: ['closed'] }],
  ['allt utom utkast', { hide: ['draft'] }],
  // ---------- highlight ----------
  ['highlight the uncapped ones', { highlight: ['uncapped'] }],
  ['which contracts are waiting on us?', { highlight: ['waiting on us'] }],
  ['which ones renew in the next 60 days?', { highlight: ['renew'] }],
  ['light up the overdue contracts', { highlight: ['overdue'] }],
  ['markera obegränsat ansvar', { highlight: ['uncapped'] }],
  ['vilka väntar på oss', { highlight: ['waiting on us'] }],
  // ---------- follow-ups ----------
  ['of those, only Sales', { and: ['sales'] }],
  ['of those only the drafts', { and: ['draft'] }],
  ['and only over 20M', { and: ['over 20'] }],
  ['now only Naivas', { and: ['naivas'] }],
  ['among them the uncapped ones', { and: ['uncapped'] }],
  ['also only signed', { and: ['executed'] }],
  ['av dem bara Sales', { and: ['sales'] }],
  ['och bara signerade', { and: ['executed'] }],
  // ---------- top and sort ----------
  ['top 10 by value', { top: '10:value', sort: undefined }],
  ['top 5', { top: '5:value' }],
  ['the 3 biggest contracts', { top: '3:value' }],
  ['biggest 3 in each stream', { top: '3:value:folder' }],
  ['top 5 per counterparty', { top: '5:value:counterparty' }],
  ['the 10 slowest payers', { top: '10:payterms' }],
  ['top 10 with most obligations', { top: '10:obligations' }],
  ['topp 10', { top: '10:value' }],
  ['de 5 största avtalen', { top: '5:value' }],
  ['sort by value', { sort: 'value' }],
  ['order them by days to pay', { sort: 'payterms' }],
  ['sortera efter värde', { sort: 'value' }],
  // ---------- compare ----------
  ['compare Sales with Procurement', { compare: 'Sales & Route-to-Market|Procurement & Raw Materials' }],
  ['compare Naivas and Carrefour', { compare: 'Naivas Supermarkets|Carrefour Kenya' }],
  ['Naivas vs Carrefour', { compare: 'Naivas Supermarkets|Carrefour Kenya' }],
  ['compare the drafts to the signed ones', { compare: 'Drafting|Executed' }],
  ['jämför Sales med Procurement', { compare: 'Sales & Route-to-Market|Procurement & Raw Materials' }],
  // ---------- connections ----------
  ['what depends on MK-101', { linked: 'MK-101' }],
  ['everything tied to Naivas', { linked: 'Naivas Supermarkets' }],
  ['contracts connected to MK-107', { linked: 'MK-107' }],
  ['show amendments with their parents', { families: true }],
  ['show the contract families', { families: true }],
  ['vad beror på MK-101', { linked: 'MK-101' }],
  // ---------- undo, everything, save, open ----------
  ['undo', { undo: true }],
  ['go back', { undo: true }],
  ['Undo that', { undo: true }],
  ['ångra', { undo: true }],
  ['tillbaka', { undo: true }],
  ['show everything', { everything: true }],
  ['show all contracts', { everything: true }],
  ['reset the map', { everything: true, landing: true }],
  ['start again', { everything: true, landing: true }],
  ['visa allt', { everything: true }],
  ['återställ', { everything: true, landing: true }],
  ['save this view', { save: '' }],
  ['save this view as Renewals', { save: 'renewals' }],
  ['spara vyn som Förnyelser', { save: 'förnyelser' }],
  ['open view Renewals', { open: 'renewals' }],
  ['öppna vyn Förnyelser', { open: 'förnyelser' }],
  // ---------- ask back ----------
  ['payment terms', { ask: 'payterms' }],
  ['by owner', { group: 'owner' }],
  ['governing law?', { ask: 'law' }],
  ['the risk', { ask: 'risk' }],
  ['betalningsvillkor', { ask: 'payterms' }],
  ['efter ägare', { group: 'owner' }],
  // ---------- not for the reader: wording, analysis, Copilot's own ----------
  ['What does MK-101 say about liability?', null],
  ['Summarize my highest-value contract', null],
  ['Explain the termination clause in the Naivas deal', null],
  ['Which contracts have potentially risky or unlawful clauses?', null],
  ['What should I worry about?', null],
  ['How much money is under management?', null],
  ['Is the Naivas indemnity mutual?', null],
  ['Draft a reply to Carrefour', null],
  ['Vad säger MK-101 om ansvar?', null],
  ['Sammanfatta mitt största avtal', null],
  ['group by city', { unknown: 'group' }],
  ['cluster by sector', { unknown: 'group' }],
  ['cluster by moon phase', { unknown: 'group' }],
  ['floors by moon phase', { unknown: 'floors' }],
  ['put owners on the floors', { floors: 'owner', view: 'floors' }],
];

function world() {
  const w = buildWorld({ intelView: true });
  w.win.state = { contracts: BOOK.map(c => JSON.parse(JSON.stringify(c))) };
  w.win.FOLDERS = FOLDERS;
  w.win.cKind = c => c.kind || '';
  /* the stages' own words, as the product prints them (STATUS_META) */
  w.win.statusLabel = st => ({ 'Draft': 'Drafting', 'Under Review': 'In Review', 'Signed': 'Executed', 'Declined': 'Closed' })[st] || st;
  w.win.getContract = id => w.win.state.contracts.find(c => c.id === id) || null;
  w.win.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
  w.win.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[]; intel.lastRole=null;');
  return w.win;
}
const win = world();
function compact(p) {
  if (!p) return null;
  const o = {};
  p.acts.forEach(a => {
    if (a.undo) o.undo = true; if (a.everything) o.everything = true; if (a.landing) o.landing = true;
    if (a.save != null) o.save = String(a.save).toLowerCase(); if (a.open) o.open = String(a.open).toLowerCase();
    if (a.ask) o.ask = a.ask; if (a.unknownFact) o.unknown = a.role || 'group';
    if (a.role && !a.unknownFact) o[a.role] = a.fact; if (a.view != null) o.view = win.IGB_VIEWS[a.view];
    if (a.sort) o.sort = a.sort; if (a.top) o.top = a.top.n + ':' + a.top.by + (a.top.per ? ':' + a.top.per : '');
    if (a.narrow) o[a.narrow.mode] = a.narrow.conds.map(c => String(c.label).toLowerCase());
    if (a.compare) o.compare = a.compare.aLabel + '|' + a.compare.bLabel;
    if (a.linked) o.linked = a.linked; if (a.linkedParty) o.linked = a.linkedParty; if (a.families) o.families = true;
  });
  return o;
}
function matches(got, want) {
  if (want === null) return got === null || (got.unknown === 'group');
  if (!got) return false;
  const keys = Object.keys(want).filter(k => want[k] !== undefined);
  const extra = Object.keys(got).filter(k => !(k in want) && !(k === 'sort' && got.top));
  if (extra.length) return false;
  return keys.every(k => {
    if (['only', 'and', 'hide', 'highlight'].includes(k)) return Array.isArray(got[k]) && got[k].length === want[k].length && want[k].every(piece => got[k].some(l => l.includes(piece)));
    return String(got[k]) === String(want[k]);
  });
}

test('f427 (1) the phrase book holds about two hundred lines, both languages, line 1 the question that started it', () => {
  assert.ok(BOOKLINES.length >= 200, 'lines: ' + BOOKLINES.length);
  assert.equal(BOOKLINES[0][0], 'divide the floors by payment terms');
  const sv = BOOKLINES.filter(([q]) => /[åäö]|\b(efter|bara|visa|dela|och|mot|gruppera|färga|ångra|tillbaka|endast|dölj|allt|topp|jämför|kolumner|nivåer|våningar)\b/i.test(q)).length;
  assert.ok(sv >= 40, 'Swedish lines: ' + sv);
});

test('f427 (2) every line reads as its recipe', () => {
  const bad = [];
  for (const [q, want] of BOOKLINES) {
    win.eval('intel.lastRole=null');
    const got = compact(win.igRecipeParse(q));
    if (!matches(got, want)) bad.push(`${JSON.stringify(q)} → ${JSON.stringify(got)} (wanted ${JSON.stringify(want)})`);
  }
  assert.deepEqual(bad, [], bad.length + ' of ' + BOOKLINES.length + ' lines misread:\n' + bad.join('\n'));
});

test('f427 (3) "instead" and "same but" change the role that was changed last', () => {
  win.eval('intel.lastRole="floors"');
  assert.deepEqual(compact(win.igRecipeParse('same but by value')), { floors: 'valueBand' });
  win.eval('intel.lastRole="colour"');
  assert.deepEqual(compact(win.igRecipeParse('risk instead')), { colour: 'risk' });
  win.eval('intel.lastRole="group"');
  assert.deepEqual(compact(win.igRecipeParse('samma men efter motpart')), { group: 'counterparty' });
  win.eval('intel.lastRole=null');
  assert.deepEqual(compact(win.igRecipeParse('same but by owner')), { group: 'owner' }, 'with nothing changed yet, it groups');
});

test('f427 (4) every fact on the list has words in both languages, and every word names a fact the map can cut', () => {
  const keys = win.GRAPH_GROUP_KEYS;
  const words = win.IG_FACT_WORDS;
  keys.forEach(k => assert.ok(Array.isArray(words[k]) && words[k].length >= 2, 'words for ' + k));
  Object.keys(words).forEach(k => assert.ok(keys.includes(k), k + ' is a grouping the map can cut'));
});
