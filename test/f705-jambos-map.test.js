'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f705 — JAMBO'S MAP (owner, 18 Oct 2026: "Start with MiniSearch and the map
   for 30 tasks"; js/jambomap.js, vendor/minisearch-7.2.0.umd.js)

   (1) THE MAP: thirty tasks, each with ways of asking in English AND Svenska,
       each pointing at a door HaTi already has — a place word, a door, a
       Menu row, the Contracts place narrowed, a Settings section — and each
       titled in both books.
   (2) THE EXAM: a sentence in everyday words, typed into Jambo's box, lands
       where the task's door is — through caActOf, so whichever reader takes
       it, the person ends up in the right place. English and Svenska.
   (3) WHAT IT LEAVES ALONE: a question about what a contract says, a count,
       a date, a name, a sentence of words no task knows, and the Board's own
       words still go on exactly as before (the map answers null).
   (4) AN ADMIN'S TASK is offered to an admin only.
   (5) A TASK THAT NEEDS A CONTRACT asks which one when none is named or up.
   (6) NOT SURE: two or three close tasks are a card, one press each; the
       press is the task's own act.
   (7) THE DOORS: caGo opens the narrowed Contracts place and a Settings
       section through the doors that already exist (regGoFiltered, stFindGo),
       and says where it went.
   (8) THE WIRING: caActOf asks the map LAST; the card is drawn and pressed
       through caCardHtml / caCardPress; the Counter's box asks it too.
   (9) READING SPENDS NOTHING: no route, no model, nothing written.
   AT THE PARENT every claim FAILS: js/jambomap.js and the vendored
   MiniSearch do not exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const ACTS = R('js/copilotacts.js');
const MAP = R('js/jambomap.js');
const MS = R('vendor/minisearch-7.2.0.umd.js');
const I18N = R('js/i18n.js');

/* the two books' jm_ / ca_ lines: the first sighting is English, the second Svenska */
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+((?:jm|ca)_[a-z_]+): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const J = x => JSON.parse(JSON.stringify(x));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');

function stage({ lang = 'en', paper = 'MK-9', face = 'paper', view = 'dashboard', admin = true, board = null } = {}){
  const contracts = [{ id: 'MK-9', contractNo: 'MK-9', name: 'SaaS Agreement', status: 'Under Review', counterparty: 'Nordkust Industri AB' },
    { id: 'MK-12', contractNo: 'MK-12', name: 'Supply', status: 'Signed' }];
  const calls = [], spent = [];
  const hb = { face, saved: [] };
  const ctx = { intel: { paper: paper ? { id: paper } : null, history: [] } };
  Object.assign(ctx, {
    getContract: id => contracts.find(c => c.id === id) || null, contractRef: c => c.contractNo || c.id,
    getUsers: () => [], currentUser: () => ({ id: 'u1', name: 'Amina' }), isAdmin: () => admin,
    state: { contracts, view },
    i18t: (k, v) => fill(k in BOOKS[lang] ? BOOKS[lang][k] : k, v),
    setTimeout: () => 0,
    localStorage: { getItem: () => null, setItem: () => {} },
    needsYouOf: () => [],
    igHomePaperFace: () => hb.face === 'paper', igPaperUp: () => hb.face === 'paper' && !!ctx.intel.paper,
    hbParse: q => (board && board.test(q)) ? { act: 'panel', kind: 'obl' } : null,
    hbS: () => hb, hbSave: () => {}, hbFace: () => hb.face,
    hbSetFace: f => { calls.push(['face', f]); hb.face = f; },
    pdOpenOnHome: (id, tab) => calls.push(['paper', id, tab]),
    igPickAgain: () => { calls.push(['wall']); ctx.intel.paper = null; },
    regPlaceSet: patch => calls.push(['place', J(patch)]),
    regGoFiltered: patch => { calls.push(['narrowed', J(patch)]); return patch; },
    stFindGo: id => calls.push(['settings', id]),
    setView: v => { calls.push(['view', v]); ctx.state.view = v; },
    openPanel: k => calls.push(['panel', k]),
    renderIntelDock: () => calls.push(['dock']),
    toast: (m, kind) => calls.push(['toast', m, kind]),
    api: (...a) => { spent.push(['api', a[0]]); return Promise.resolve({}); },
    fetch: (...a) => { spent.push(['fetch', a[0]]); return Promise.resolve({}); },
  });
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(MS, ctx);
  vm.runInContext(ACTS, ctx);
  vm.runInContext(MAP, ctx);
  return { ctx, calls, hb, spent };
}

/* WHERE THE PERSON ENDS UP, whichever reader took the words: the task whose
   door this act is (a Menu row that downloads, prints or exports is "export") */
const EXPORTS = ['export', 'pdf', 'wordx', 'record'];
function lands(ctx, a){
  if (!a) return null;
  if (a.map) return a.map;
  const T = ctx.JM_TASKS;
  if (a.kind === 'go') { const t = T.find(x => x.to.place === a.place); return t ? t.k : 'place:' + a.place; }
  if (a.kind === 'door') { const t = T.find(x => x.to.door === a.door); return t ? t.k : 'door:' + a.door; }
  if (a.kind === 'menu') { if (EXPORTS.includes(a.menu)) return 'export'; const t = T.find(x => x.to.menu === a.menu); return t ? t.k : 'menu:' + a.menu; }
  /* "ready to sign" is the readiness card, whose door is signing (caReadyDoor) */
  if (a.kind === 'ready') return 'sign';
  return a.kind;
}
/* sure: the act itself; not sure: the card's first pick */
const landsOrFirst = (ctx, a) => a && a.kind === 'map' ? a.picks[0] : lands(ctx, a);

describe('f705 (1) the map: thirty tasks, both languages, each on an existing door', () => {
  const { ctx } = stage();
  const T = ctx.JM_TASKS;
  test('1a thirty tasks, each named once', () => {
    assert.equal(T.length, 30);
    assert.equal(new Set(T.map(x => x.k)).size, 30);
  });
  test('1b every task has at least three ways of asking in each language, and each way has a word the map can read', () => {
    for (const t of T){
      assert.ok((t.w.en || []).length >= 3, t.k + ' English');
      assert.ok((t.w.sv || []).length >= 3, t.k + ' Svenska');
      for (const w of [...t.w.en, ...t.w.sv]) assert.ok(ctx.jmTerms(w).length > 0, `${t.k}: "${w}" is only filler words`);
    }
  });
  test('1c every door exists today: places, doors, Menu rows, the narrowed list, Settings sections', () => {
    const places = J(ctx.CA_PLACES).map(p => p.k), doors = ctx.CA_DOORS.map(d => d[0]), menu = ctx.CA_MENU.map(m => m[0]);
    const SET = R('js/views/settings.js'), REG = R('js/views/register.js');
    for (const t of T){
      const to = t.to;
      if (to.place) assert.ok(places.includes(to.place), t.k + ' → place ' + to.place);
      if (to.door) assert.ok(doors.includes(to.door), t.k + ' → door ' + to.door);
      if (to.menu) assert.ok(menu.includes(to.menu), t.k + ' → menu ' + to.menu);
      if (to.door || to.menu) assert.ok(places.includes(to.home), t.k + ' asks which contract on ' + to.home);
      if (to.reg) assert.match(REG, new RegExp(`k:'${to.reg.view}'`), t.k + ' → narrowed ' + to.reg.view);
      if (to.st){
        const [kind, key] = to.st.split(':');
        if (kind === 'panel') assert.match(SET, new RegExp(`^  ${key}:\\{`, 'm'), t.k + ' → Settings panel ' + key);
        else if (kind === 'page') assert.match(SET, new RegExp(`ST_PAGES=\\[[^\\]]*'${key}'`), t.k + ' → Settings page ' + key);
        else if (kind === 'you') assert.match(SET, new RegExp(`key:'${key}'`), t.k + ' → Your settings ' + key);
        else assert.fail(t.k + ' → unknown Settings door ' + to.st);
      }
    }
  });
  test('1d every task is titled in both books, and the lines the map says are in both', () => {
    const keys = ['jm_pick_title', 'jm_pick_done', ...T.map(t => 'jm_t_' + t.k), ...T.filter(t => t.to.reg || t.to.st).map(t => 'jm_go_' + t.k)];
    for (const k of keys){
      assert.ok(BOOKS.en[k], k + ' English');
      assert.ok(BOOKS.sv[k], k + ' Svenska');
    }
    const same = T.filter(t => BOOKS.en['jm_t_' + t.k] === BOOKS.sv['jm_t_' + t.k]).map(t => t.k);
    assert.ok(same.length <= 2, 'Svenska is not English copied: ' + same.join(', '));
  });
});

/* THE EXAM: [what a person types, the task they mean]. Phrasings are NOT
   copies of the map's own ways of asking; each task is asked at least twice,
   at least once in Svenska. With a contract on the paper (MK-9) unless the
   line says otherwise. */
const EXAM = [
  ['what do I need to do?', 'needs'], ['anything waiting for me?', 'needs'], ['show me my tasks', 'needs'], ['vad ska jag göra idag?', 'needs'],
  ['where are all our agreements?', 'contracts'], ['I want to browse the contracts', 'contracts'], ['var hittar jag alla avtal?', 'contracts'],
  ['which contracts are expiring soon?', 'expiring'], ['show me what is up for renewal', 'expiring'], ['contracts ending in the next few months', 'expiring'], ['vilka avtal löper ut snart?', 'expiring'],
  ['I want to upload a scanned contract', 'upload'], ['how do I add a contract we received?', 'upload'], ['hur laddar jag upp ett avtal?', 'upload'],
  ['I need a new contract for a supplier', 'draft'], ['how do I start a contract from a template?', 'draft'], ['jag vill ha ett nytt avtal', 'draft'],
  ['where do I enter the start date and value?', 'fill'], ['some details are missing', 'fill'], ['fyll i det som saknas', 'fill'],
  ['I want to review the changes they made', 'redline'], ['how do I mark up this contract?', 'redline'], ['jag vill granska deras ändringar', 'redline'],
  ['where do I put my signature?', 'sign'], ["I'm ready to sign this", 'sign'], ['var skriver jag under?', 'sign'],
  ['how do I get them to sign?', 'signlink'], ['send the signing link', 'signlink'], ['skicka avtalet för underskrift', 'signlink'],
  ['how do I email this to the other side?', 'share'], ['share this contract with the counterparty', 'share'], ['skicka avtalet till motparten', 'share'],
  ['I need my manager to approve this', 'approval'], ['ask finance for approval', 'approval'], ['jag behöver godkännande från chefen', 'approval'],
  ["what's waiting for my approval?", 'approvals'], ['contracts I need to approve', 'approvals'], ['godkännanden som väntar på mig', 'approvals'],
  ['payments we owe this month', 'oblig'], ['show me our deliverables', 'oblig'], ['vad har vi lovat?', 'oblig'],
  ['who changed this clause?', 'history'], ['show me the activity log', 'history'], ['vad har hänt med avtalet?', 'history'],
  ['what deadlines are coming up?', 'calendar'], ['show me the key dates this week', 'calendar'], ['vilka viktiga datum har vi?', 'calendar'],
  ['I need to change a contract that is already signed', 'amend'], ['how do I extend this agreement?', 'amend'], ['göra ett tillägg till avtalet', 'amend'],
  ['can I get a PDF of this?', 'export'], ['I want to print this contract', 'export'], ['spara avtalet som pdf', 'export'],
  ['how do I cancel this contract?', 'end'], ['we want to terminate the agreement', 'end'], ['säga upp avtalet', 'end'],
  ['list of our suppliers', 'parties'], ['show me our customers', 'parties'], ['våra kunder', 'parties'],
  ["where can I find a colleague's phone number?", 'people'], ['contact details for the team members', 'people'], ['kollegornas telefonnummer', 'people'],
  ['I need help from legal', 'requests'], ['how do I ask the lawyers for a contract?', 'requests'], ['jag behöver juridisk hjälp', 'requests'],
  ['where are our standard templates?', 'ourpaper'], ['open the clause library', 'ourpaper'], ['var finns våra mallar?', 'ourpaper'],
  ['show me the dashboard', 'board'], ['where are the key figures?', 'board'], ['visa nyckeltalen', 'board'],
  ['I want to see reports', 'insights'], ['spend analysis by supplier', 'insights'], ['visa statistik', 'insights'],
  ['how do I add a new user?', 'team'], ['invite my colleague to HaTi', 'team'], ['bjud in en kollega', 'team'],
  ['set the signing limits', 'signcap'], ['how do I limit what Peter can sign?', 'signcap'], ['ändra signeringsgränser', 'signcap'],
  ['how do I make a folder private?', 'folders'], ['change who has access', 'folders'], ['begränsa åtkomst till en mapp', 'folders'],
  ['can I use HaTi in Swedish?', 'lang'], ['change the language to English', 'lang'], ['byt språk till engelska', 'lang'],
  ["I'm going on holiday next week", 'away'], ['who covers for me while I am away?', 'away'], ['jag ska på semester', 'away'],
];
/* typed with no contract on the paper (the Counter, the wall) */
const EXAM_NO_PAPER = [
  ['how do I bring in hundreds of old contracts?', 'import'], ['bulk import', 'import'], ['importera gamla avtal', 'import'],
];
/* NOT THE MAP'S: what a contract says, a count, a date, a name, a comparison,
   a translation, the Board's own reading, words no task knows */
const NOT_MINE = [
  'what does clause 7 say about liability?', 'summarise MK-9', 'how many contracts expire this year?', 'when does MK-12 expire?',
  'what is the value of the Nordkust deal?', 'which contracts have a liability cap above 10 million?', 'is there an auto-renewal clause in MK-12?',
  'compare MK-9 and MK-12', 'who signed the Nordkust contract?', 'Nordkust Industri AB', 'payment terms', 'what does the indemnity clause mean?',
  'translate this into Swedish', 'vad säger avtalet om ansvar?', 'hur många avtal har vi med Naivas?', 'top 10 contracts by value',
  'what is the notice period in MK-9', 'list contracts with Krones', 'total value of supplier contracts', 'which supplier has the highest value',
  'what are the payment terms with Naivas', 'find clauses about liability', 'show me risky contracts', 'what is unusual in this contract',
  'does this contract have a non-compete', 'explain the termination clause', 'write a summary for my boss', 'who is the counterparty',
  'draft an email to the supplier', 'what should I push back on', 'is this a good deal', 'show me the contracts signed in March',
  'contracts over 10 million', 'obligations of the supplier in MK-12', 'hur långt är uppsägningstiden?',
  'how long is the notice period', 'which contracts mention force majeure', 'list the contracts with Carrefour', 'what is our biggest contract',
  'show contracts by stream', 'are we exposed on currency', 'what did Naivas change in round 2', 'which clause limits liability', 'is MK-9 signed',
  'summary of MK-12', 'vilka avtal har Krones', 'vad är det totala värdet', 'what should I counter on clause 4', 'give me the top 5 risks',
  'how many NDAs do we have', 'find the indemnity in MK-9', 'does the supplier pay late fees', 'who owns the Kabras contract',
  'what is the term of the lease', 'analyse the payment terms',
  'which contracts end this year', 'what do we owe this month?', 'vilka avtal löper ut i år?',
];

describe('f705 (2) the exam: everyday words land on the task\'s door', () => {
  test('2a every question lands where its task\'s door is (a "which did you mean" card offers it first)', () => {
    const { ctx } = stage();
    const misses = EXAM.map(([q, k]) => [q, k, landsOrFirst(ctx, ctx.caActOf(q))]).filter(([, k, got]) => got !== k);
    assert.deepEqual(misses, [], misses.map(([q, k, got]) => `"${q}" → ${got}, wanted ${k}`).join('\n'));
  });
  test('2b with no contract on the paper', () => {
    const { ctx } = stage({ paper: null });
    const misses = EXAM_NO_PAPER.map(([q, k]) => [q, k, landsOrFirst(ctx, ctx.caActOf(q))]).filter(([, k, got]) => got !== k);
    assert.deepEqual(misses, [], misses.map(([q, k, got]) => `"${q}" → ${got}, wanted ${k}`).join('\n'));
  });
  test('2c most questions are answered at once, not with a card', () => {
    const { ctx } = stage();
    const cards = EXAM.filter(([q]) => { const a = ctx.caActOf(q); return a && a.kind === 'map'; }).map(([q]) => q);
    assert.ok(cards.length <= Math.floor(EXAM.length * 0.15), `${cards.length} of ${EXAM.length} were cards: ${cards.join(' | ')}`);
  });
  test('2d the exam is the same in Svenska (the reader\'s language does not change what is understood)', () => {
    const en = stage().ctx, sv = stage({ lang: 'sv' }).ctx;
    for (const [q] of EXAM) assert.deepEqual(J(landsOrFirst(sv, sv.caActOf(q))), J(landsOrFirst(en, en.caActOf(q))), q);
  });
});

describe('f705 (3) what the map leaves alone', () => {
  test('3a questions about a contract\'s words, counts, dates, names and the like answer null', () => {
    const { ctx } = stage();
    const taken = NOT_MINE.filter(q => ctx.jmRead(q)).map(q => `"${q}" → ${JSON.stringify(J(ctx.jmRead(q)))}`);
    assert.deepEqual(taken, []);
  });
  test('3b a sentence of filler words alone, and an empty ask, answer null', () => {
    const { ctx } = stage();
    for (const q of ['', '   ', 'how do I', 'where is it?', 'can you help me?', 'hur gör jag?']) assert.equal(ctx.jmRead(q), null, q);
  });
  test('3c longer than a "where is" is a question for Jambo', () => {
    const { ctx } = stage();
    assert.equal(ctx.jmRead('which contracts are expiring soon ' + 'and '.repeat(40)), null);
  });
  test('3d on the Board its own reader keeps its words', () => {
    const { ctx } = stage({ face: 'board', board: /by stream/i });
    assert.equal(ctx.jmRead('show me our obligations by stream'), null);
    assert.equal(lands(ctx, ctx.jmRead('show me our deliverables')), 'oblig', 'what the Board does not read, the map still does');
  });
  test('3e until MiniSearch has arrived the map answers null, and the ask goes on as before', () => {
    const { ctx } = stage();
    const keep = ctx.MiniSearch; ctx.MiniSearch = undefined;
    assert.equal(vm.runInContext('jmRead("which contracts are expiring soon?")', ctx), null);
    ctx.MiniSearch = keep;
  });
});

describe('f705 (4) an admin\'s task is offered to an admin only', () => {
  test('4a someone who is not an admin is not sent to the team, the limits or the folders', () => {
    const { ctx } = stage({ admin: false });
    for (const [q, k] of EXAM.filter(([, k]) => ['team', 'signcap', 'folders'].includes(k))){
      const a = ctx.caActOf(q), got = landsOrFirst(ctx, a);
      assert.notEqual(got, k, q);
      if (a && a.kind === 'map') assert.ok(!a.picks.some(p => ['team', 'signcap', 'folders'].includes(p)), q);
    }
  });
  test('4b their own settings are theirs: language and away', () => {
    const { ctx } = stage({ admin: false });
    assert.equal(lands(ctx, ctx.caActOf('change the language to English')), 'lang');
    assert.equal(lands(ctx, ctx.caActOf("I'm going on holiday next week")), 'away');
  });
});

describe('f705 (5) a task that needs a contract asks which one', () => {
  test('5a no paper up and none named: the "which contract?" place, never a guess', () => {
    const { ctx } = stage({ paper: null });
    const a = ctx.caActOf('how do I get them to sign?');
    assert.equal(a.kind, 'go'); assert.equal(a.missing, true); assert.equal(a.place, 'sign'); assert.equal(a.map, 'signlink');
    const b = ctx.caActOf('I want to review the changes they made');
    assert.equal(b.kind, 'go'); assert.equal(b.missing, true); assert.equal(b.place, 'redline');
  });
  test('5b a reference names the contract', () => {
    const { ctx } = stage({ paper: null });
    const a = ctx.caActOf('how do I get them to sign MK-12?');
    assert.equal(a.kind, 'door'); assert.equal(a.door, 'signlink'); assert.equal(a.cid, 'MK-12');
  });
  test('5c a door waits for its press: the act is a card, nothing moves', () => {
    const { ctx, calls } = stage();
    const a = ctx.caActOf('how do I get them to sign?');
    assert.equal(a.kind, 'door'); assert.equal(a.cid, 'MK-9');
    assert.deepEqual(calls.filter(c => c[0] !== 'dock'), []);
  });
});

describe('f705 (6) not sure: a card of two or three, one press each', () => {
  test('6a a word two tasks share is offered as a card, the closer first', () => {
    const { ctx } = stage();
    const a = ctx.jmRead('approval');
    assert.equal(a.kind, 'map');
    assert.ok(a.picks.length >= 2 && a.picks.length <= ctx.JM_PICKS, JSON.stringify(J(a.picks)));
    assert.ok(a.picks.includes('approval') && a.picks.includes('approvals'), JSON.stringify(J(a.picks)));
  });
  test('6b the card is drawn as Jambo\'s other cards, each button titled from the book', () => {
    const { ctx } = stage();
    const a = ctx.jmRead('approval');
    const html = ctx.caCardHtml(a, 0);
    assert.match(html, /class="ca-card"/); assert.match(html, /class="ca-acts"/);
    assert.ok(html.includes(BOOKS.en.jm_pick_title));
    const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    for (const k of a.picks) assert.ok(html.includes(`data-ca-act="jm:${k}"`) && html.includes(esc(BOOKS.en['jm_t_' + k])), k);
    assert.equal((html.match(/ui-btn-primary/g) || []).length, 1, 'one filled button');
  });
  test('6c a press is the task\'s own act, said and moved as a typed word; the card then says what opened', async () => {
    const { ctx, calls } = stage();
    const a = ctx.jmRead('approval');
    ctx.intel.history.push({ role: 'user', text: 'approval' }, { role: 'assistant', text: '', act: a });
    await ctx.caCardPress(1, 'jm:approvals');
    const said = ctx.intel.history[2];
    assert.equal(said.act.kind, 'go'); assert.equal(said.act.place, 'approvals');
    assert.ok(calls.some(c => c[0] === 'view' && c[1] === 'approvals'), JSON.stringify(calls));
    assert.equal(a.state, 'done');
    assert.ok(ctx.caCardHtml(a, 1).includes(fill(BOOKS.en.jm_pick_done, { what: BOOKS.en.jm_t_approvals })));
  });
  test('6d a press on a task the card did not offer, or a second press, does nothing', async () => {
    const { ctx } = stage();
    const a = ctx.jmRead('approval');
    ctx.intel.history.push({ role: 'assistant', text: '', act: a });
    await ctx.caCardPress(0, 'jm:import');
    assert.equal(a.state, 'ready'); assert.equal(ctx.intel.history.length, 1);
    await ctx.caCardPress(0, 'jm:' + a.picks[0]); const n = ctx.intel.history.length;
    await ctx.caCardPress(0, 'jm:' + a.picks[1]);
    assert.equal(ctx.intel.history.length, n);
  });
});

describe('f705 (7) the doors: the narrowed Contracts place and a Settings section, said', () => {
  test('7a "contracts ending soon" opens the Contracts place narrowed, as Home\'s tiles do', () => {
    const { ctx, calls } = stage();
    const a = ctx.caActOf('which contracts are expiring soon?');
    assert.equal(ctx.caGoSay(a), BOOKS.en.jm_go_expiring);
    assert.equal(ctx.caGo(a), true);
    assert.deepEqual(calls.find(c => c[0] === 'narrowed'), ['narrowed', { view: 'expiring90' }]);
  });
  test('7b a Settings task opens its section through the Settings finder\'s own door', () => {
    const { ctx, calls } = stage();
    for (const [q, id, k] of [['set the signing limits', 'panel:signcap', 'signcap'], ['change the language to English', 'you:lang', 'lang'], ['how do I add a new user?', 'page:team', 'team']]){
      const a = ctx.caActOf(q);
      assert.equal(ctx.caGoSay(a), BOOKS.en['jm_go_' + k], q);
      assert.equal(ctx.caGo(a), true, q);
      assert.deepEqual(calls.filter(c => c[0] === 'settings').pop(), ['settings', id], q);
    }
  });
  test('7c in Svenska Jambo says it in Svenska', () => {
    const { ctx } = stage({ lang: 'sv' });
    assert.equal(ctx.caGoSay(ctx.caActOf('vilka avtal löper ut snart?')), BOOKS.sv.jm_go_expiring);
  });
  test('7d where a door is missing on a stage, caGo says it could not, it does not pretend', () => {
    const { ctx } = stage();
    ctx.regGoFiltered = undefined;
    assert.equal(ctx.caGo(ctx.caActOf('which contracts are expiring soon?')), false);
  });
});

describe('f705 (8) the wiring', () => {
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  test('8a caActOf asks the map last, after every exact reader', () => {
    const body = strip(ACTS).match(/function caActOf\(q\)\{([\s\S]*?)\n\}/)[1];
    const at = w => body.indexOf(w);
    for (const w of ['caReadSend', 'caReadJob', 'caReadDoor', 'caReadPlace', 'caReadMenu', 'caReadDraft']) assert.ok(at(w) >= 0 && at(w) < at('jmRead('), w);
  });
  test('8b the card is drawn and pressed through Jambo\'s one card builder and one press', () => {
    const src = strip(ACTS);
    assert.match(src.match(/function caCardHtml\(a, i\)\{[\s\S]*?\n\}/)[0], /a\.kind === 'map'[^\n]*jmCardHtml\(a, i\)/);
    assert.match(src.match(/async function caCardPress\(i, act, btn\)\{[\s\S]*?\n\}/)[0], /a\.kind === 'map'[^\n]*jmCardPress\(i, act\)/);
  });
  test('8c the Counter\'s box asks the map before it hands the words to Jambo beside the Board', () => {
    const body = strip(R('js/views/counter.js')).match(/function counterAsk\(text\)\{([\s\S]*?)\n\}/)[1];
    assert.ok(body.indexOf('jmRead(') > body.indexOf('caReadPlace(') && body.indexOf('jmRead(') < body.indexOf('intelAsk('));
  });
  test('8d the app loads the map, after Jambo\'s word table; the library is fetched from HaTi itself', () => {
    const app = R('js/app.js');
    assert.ok(app.indexOf("import './jambomap.js'") > app.indexOf("import './copilotacts.js'"));
    assert.match(MAP, /const JM_LIB_SRC = 'vendor\/minisearch-7\.2\.0\.umd\.js'/);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'vendor', 'minisearch-7.2.0.LICENSE.txt')), 'the licence travels with the code');
    assert.match(R('vendor/README.md'), /minisearch-7\.2\.0\.umd\.js/);
  });
  test('8e the Brain knows the map: a part, a flow step, a lane, an area', () => {
    const B = R('js/brainmap.js');
    assert.match(B, /\['jambomap', 'jmRead', 'ai', 1\]/);
    assert.match(B, /\{ id: 'ask', steps: \[\['copilotask', 'jambomap'/);
    assert.match(B, /'copilotask', 'jambomap', 'menuask'/);
    assert.match(B, /\|copilotacts\|jambomap\)\\\.js\$\/, 'ai'\]/);
  });
});

describe('f705 (9) reading spends nothing', () => {
  test('9a the whole exam calls no route and no model, and writes nothing', () => {
    const { ctx, spent, calls } = stage();
    for (const [q] of [...EXAM, ...EXAM_NO_PAPER]) ctx.jmRead(q);
    for (const q of NOT_MINE) ctx.jmRead(q);
    assert.deepEqual(spent, []);
    assert.deepEqual(calls, []);
  });
});
