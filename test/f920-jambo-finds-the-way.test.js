'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f920 — JAMBO FINDS THE WAY (owner, 22 Oct 2026: "jambo is still very poor
   at navigating across the platform"; asked "show me where i can edit our
   standards for the procurement stream" and was given the open contract's
   Filing row, because the Menu reader takes any sentence with "stream")

   (1) THE EXAM: about a hundred everyday ways of asking to GO somewhere,
       none copied from the map's own ways of asking, English and Svenska.
       Where the person ends up must be the place they asked for.
   (2) A QUESTION OF WHERE NEVER PRESSES A MENU ROW: "show me where…",
       "take me to…", "visa mig var…" go on to the map and the model.
   (3) THE MAP OVERRULES ONE WORD: when a Menu row is read off a single word
       and the map is sure of a different task, the map's task is taken.
   (4) OUR STANDARDS, ON THE RIGHT BOOK: "standards for the procurement
       stream" opens Our paper → Our standards on the book that judges that
       stream's contracts (playbookKeyFor), a named contract type its own book.
   (5) THE AI TAKES YOU THERE (deliver_answer.goto, both hosts): one of the
       map's own tasks, offered only while the company's switch is on (on by
       default), run through the map's own door, never an admin's task for a
       non-admin.
   AT THE PARENT (1) scores below the bar, (2)–(5) fail.
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

function stage({ lang = 'en', paper = 'MK-9', face = 'paper', view = 'dashboard', admin = true } = {}){
  const contracts = [{ id: 'MK-9', contractNo: 'MK-9', name: 'SaaS Agreement', status: 'Under Review', counterparty: 'Nordkust Industri AB' },
    { id: 'MK-12', contractNo: 'MK-12', name: 'Supply', status: 'Signed' }];
  const calls = [];
  const hb = { face, saved: [] };
  const ctx = { intel: { paper: paper ? { id: paper } : null, history: [] } };
  Object.assign(ctx, {
    getContract: id => contracts.find(c => c.id === id) || null, contractRef: c => c.contractNo || c.id,
    getUsers: () => [], currentUser: () => ({ id: 'u1', name: 'Amina' }), isAdmin: () => admin,
    state: { contracts, view, settings: {} },
    i18t: (k, v) => fill(k in BOOKS[lang] ? BOOKS[lang][k] : k, v),
    setTimeout: () => 0,
    localStorage: { getItem: () => null, setItem: () => {} },
    needsYouOf: () => [],
    igHomePaperFace: () => hb.face === 'paper', igPaperUp: () => hb.face === 'paper' && !!ctx.intel.paper,
    hbParse: () => null, hbS: () => hb, hbSave: () => {}, hbFace: () => hb.face,
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
    /* the company's value streams and books, as the page reads them */
    FOLDERS: { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Customers' }, corp: { id: 'corp', name: 'Corporate' } },
    STREAM_SHORT: { proc: 'Procurement', mfg: 'Manufacturing', dist: 'Distribution', sales: 'Sales', mktg: 'Marketing', corp: 'Corporate' },
    playbook: () => ({ _default: { label: 'Baseline' }, supply: { label: 'Supply' }, nda: { label: 'NDA' }, saas: { label: 'Software & SaaS' } }),
    playbookKeyFor: c => ({ proc: 'supply', sales: 'supply', dist: 'supply', mfg: 'supply' }[c.folder] || '_default'),
    sdGoBook: k => calls.push(['book', k]),
    pbTabGo: k => calls.push(['tab', k]),
    api: () => Promise.resolve({}), fetch: () => Promise.resolve({}),
  });
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(MS, ctx);
  vm.runInContext(ACTS, ctx);
  vm.runInContext(MAP, ctx);
  return { ctx, calls };
}

const EXPORTS = ['export', 'pdf', 'wordx', 'record'];
function lands(ctx, a){
  if (!a) return null;
  if (a.map) return a.map;
  const T = ctx.JM_TASKS;
  if (a.kind === 'go' && a.place === 'ourpaper' && a.std) return 'standards';
  if (a.kind === 'go') { const t = T.find(x => x.to.place === a.place && !x.to.std); return t ? t.k : 'place:' + a.place; }
  if (a.kind === 'door') { const t = T.find(x => x.to.door === a.door); return t ? t.k : 'door:' + a.door; }
  if (a.kind === 'menu') { if (EXPORTS.includes(a.menu)) return 'export'; const t = T.find(x => x.to.menu === a.menu); return t ? t.k : 'menu:' + a.menu; }
  if (a.kind === 'ready') return 'sign';
  return a.kind;
}
const landsOrFirst = (ctx, a) => a && a.kind === 'map' ? a.picks[0] : lands(ctx, a);

/* THE EXAM: [what a person types, where they mean to end up]. Written fresh on
   22 Oct 2026 BEFORE any of it was taught to the map; with a contract on the
   paper (MK-9). */
const EXAM = [
  /* the owner's own sentence, and its family */
  ['show me where i can edit our standards for the procurement stream', 'standards'],
  ['where can I edit our standards?', 'standards'], ['take me to our standards', 'standards'],
  ['I want to change our negotiation playbook', 'standards'], ['where are our fallback positions?', 'standards'],
  ['change the playbook for sales contracts', 'standards'], ['our standard positions for NDAs', 'standards'],
  ['standards for the procurement stream', 'standards'], ['open the playbook', 'standards'],
  ['where do we set what we accept in negotiations?', 'standards'],
  ['var ändrar vi våra standarder?', 'standards'], ['visa vår förhandlingsplaybook', 'standards'],
  /* the rest of the platform */
  ["what's on my plate today?", 'needs'], ['is there anything I should look at?', 'needs'], ['my to-do list', 'needs'], ['vad väntar på mig?', 'needs'],
  ['take me to the list of all agreements', 'contracts'], ['where do I find every contract we have?', 'contracts'], ['open the contract register', 'contracts'], ['ta mig till alla avtal', 'contracts'],
  ['which deals are running out soon?', 'expiring'], ['show me contracts close to their end date', 'expiring'],
  ['I have a contract in my email, how do I get it into HaTi?', 'upload'], ['add a document from my computer', 'upload'], ['ladda upp en fil', 'upload'],
  ['create a fresh NDA', 'draft'], ['where do I make a new agreement?', 'draft'], ['skapa ett nytt avtal', 'draft'],
  ['where do I put the contract value?', 'fill'], ['the contract is missing its end date', 'fill'],
  ['take me to the redlines', 'redline'], ['where can I see the tracked changes?', 'redline'], ['visa ändringarna', 'redline'],
  ['where do I e-sign this?', 'sign'], ['take me to signing', 'sign'],
  ['send it out for e-signature', 'signlink'],
  ['send this draft to the supplier', 'share'], ['where do I share the contract with the other party?', 'share'],
  ['request sign-off from my boss', 'approval'],
  ['show me what I have to approve', 'approvals'], ['my approvals queue', 'approvals'],
  ['where are our obligations?', 'oblig'], ['take me to the obligations list', 'oblig'], ['våra åtaganden', 'oblig'],
  ['where is the audit trail?', 'history'], ['show the timeline of this contract', 'history'],
  ['open the calendar', 'calendar'], ['where can I see upcoming dates?', 'calendar'], ['öppna kalendern', 'calendar'],
  ['I want to amend this contract', 'amend'], ['add an addendum', 'amend'],
  ['download this as Word', 'export'], ['get me a copy to print', 'export'],
  ['I want to end this contract', 'end'], ['terminate this deal', 'end'],
  ['where are our counterparties?', 'parties'], ['take me to the vendors', 'parties'], ['visa leverantörerna', 'parties'],
  ['where is the staff directory?', 'people'], ['find a colleague', 'people'],
  ['I want to ask legal for help', 'requests'], ['where do I submit a contract request?', 'requests'],
  ['where are the templates?', 'ourpaper'], ['take me to our paper', 'ourpaper'], ['visa mallarna', 'ourpaper'],
  ['go to the dashboard', 'board'], ['take me home', 'place:counter'],
  ['open the reports', 'board'], ['where are the analytics?', 'board'],
  ['open explorer', 'explorer'], ['a map of all our contracts', 'explorer'],
  ['give me the brief of this contract', 'brief'],
  ['where do I add a new user?', 'team'], ['invite someone to HaTi', 'team'],
  ['where do I set signing limits?', 'signcap'], ["change someone's signing limit", 'signcap'],
  ['where do I manage access to streams?', 'folders'], ['lock a stream so only legal can see it', 'folders'],
  ['change HaTi to Swedish', 'lang'], ['where do I change the language?', 'lang'],
  ['set up my out of office', 'away'], ["I'm going on leave next week", 'away'],
  ['bring our old contracts in from a spreadsheet', 'import'],
  /* filing is the re-file door's, asked as filing */
  ['move this contract to another stream', 'door:refile'], ['re-file this contract', 'door:refile'],
  /* asked as a place, in other words */
  ['bring me to the obligations', 'oblig'], ['take me to the approvals', 'approvals'], ['show me where the templates are', 'ourpaper'],
  ['where can I find the calendar?', 'calendar'], ['how do I get to the dashboard?', 'board'], ['show me where our suppliers are', 'parties'],
  ['show me where I can see our customers', 'parties'], ['take me to the people page', 'people'], ['show me where the requests are', 'requests'],
  ['where can I see the history of this contract?', 'history'], ['show me where to sign', 'sign'], ['show me where I change the language', 'lang'],
  ['visa mig var mallarna finns', 'ourpaper'], ['ta mig till kalendern', 'calendar'], ['var hittar jag våra standarder?', 'standards'],
  ['show me where i can edit our standards', 'standards'], ['where do I change our standards for supply contracts?', 'standards'],
  ['take me to the playbook for NDAs', 'standards'], ['where can I see our clause standards?', 'standards'],
];

/* THE BAR: at least nine in ten land where they were asked (at the parent:
   measured and written in MAP-HISTORY "JAMBO FINDS THE WAY") */
const EXAM_BAR = 0.9;

describe('f920 (1) the exam: a hundred ways of asking to go somewhere', () => {
  test('1a the exam is about a hundred sentences, Svenska among them', () => {
    assert.ok(EXAM.length >= 100, String(EXAM.length));
    assert.ok(EXAM.filter(([q]) => /[åäö]|\b(?:visa|var|ta mig|vår|våra)\b/i.test(q)).length >= 10);
  });
  test('1b at least nine in ten land where they were asked', () => {
    const { ctx } = stage();
    const misses = EXAM.map(([q, k]) => [q, k, landsOrFirst(ctx, ctx.caActOf(q))]).filter(([, k, got]) => got !== k);
    const score = (EXAM.length - misses.length) / EXAM.length;
    if (process.env.F738_SAY) console.log(`EXAM ${EXAM.length - misses.length} of ${EXAM.length}\n` + misses.map(([q, k, got]) => `"${q}" → ${got}, wanted ${k}`).join('\n'));
    assert.ok(score >= EXAM_BAR, `${EXAM.length - misses.length} of ${EXAM.length}\n` + misses.map(([q, k, got]) => `"${q}" → ${got}, wanted ${k}`).join('\n'));
  });
  test('1c the owner\'s sentence lands on Our standards, never on the open contract\'s Filing row', () => {
    const { ctx } = stage();
    const a = ctx.caActOf('show me where i can edit our standards for the procurement stream');
    assert.ok(a, 'something is read');
    assert.notEqual(a.kind, 'menu');
    assert.equal(lands(ctx, a), 'standards');
  });
});

describe('f920 (2) a question of where never presses a Menu row', () => {
  for (const q of ['show me where the filing is', 'take me to where I compare versions', 'visa mig var jag arkiverar', 'tell me where to delete a draft', 'bring me to the stream settings'])
    test(q, () => {
      const { ctx } = stage();
      assert.equal(ctx.caReadMenu(q), null);
    });
  test('2b a plain ask still presses its row', () => {
    const { ctx } = stage();
    assert.equal(ctx.caReadMenu('re-file this contract to another stream').menu, 'filing');
    assert.equal(ctx.caReadMenu('compare versions').menu, 'compare');
  });
});

describe('f920 (3) the map overrules one word', () => {
  test('3a a Menu row read off one word gives way to the map\'s sure task', () => {
    const { ctx } = stage();
    const a = ctx.caActOf('our standards for the procurement stream');
    assert.equal(lands(ctx, a), 'standards');
  });
  test('3b a Menu row the map agrees with stands', () => {
    const { ctx } = stage();
    const a = ctx.caActOf('archive this contract');
    assert.equal(a.kind, 'menu');
  });
  test('3c the wiring: caActOf asks jmOverrules after the Menu reader', () => {
    assert.match(ACTS, /const menu = caReadMenu\(t\); if \(menu\) return \(CA_MENU_LOOSE\.includes\(menu\.menu\) && typeof jmOverrules === 'function' && jmOverrules\(t, menu\)\) \|\| menu;/);
  });
});

describe('f920 (4) Our standards, on the right book', () => {
  const run = (q, opts) => { const s = stage(opts); const a = s.ctx.caActOf(q); s.ctx.caGo(a); return { a, calls: s.calls, ctx: s.ctx }; };
  test('4a the procurement stream opens the book that judges its contracts', () => {
    const { a, calls, ctx } = run('standards for the procurement stream');
    assert.equal(lands(ctx, a), 'standards');
    assert.equal(a.book, 'supply');
    assert.deepEqual(calls.filter(c => c[0] === 'view' || c[0] === 'book'), [['view', 'playbook'], ['book', 'supply']]);
  });
  test('4b a contract type named opens its own book', () => {
    assert.equal(run('our standard positions for NDAs').a.book, 'nda');
    assert.equal(run('take me to the playbook for SaaS').a.book, 'saas');
  });
  test('4c no stream or type named: the standards page, no book chosen', () => {
    const { a, calls, ctx } = run('take me to our standards');
    assert.equal(lands(ctx, a), 'standards');
    assert.equal(a.book || null, null);
    assert.deepEqual(calls.filter(c => c[0] === 'view'), [['view', 'playbook']]);
    assert.equal(calls.filter(c => c[0] === 'book').length, 0);
  });
  test('4d it says where it went, in both books', () => {
    for (const k of ['jm_t_standards', 'jm_s_standards', 'jm_go_standards', 'jm_go_standards_book']){
      assert.ok(BOOKS.en[k], k + ' English'); assert.ok(BOOKS.sv[k], k + ' Svenska');
    }
  });
});

describe('f920 (5) the AI takes you there', () => {
  const SRV = R('server/server.js'), AI = R('js/ai.js');
  test('5a deliver_answer carries goto on both hosts, its task one of the map\'s', () => {
    assert.match(SRV, /const AI_GOTO_SCHEMA = \{ type: 'object'/);
    assert.match(SRV, /goto: AI_GOTO_SCHEMA/);
    assert.match(AI, /const goto=\{type:'object'/);
    assert.match(SRV, /JM_TASK_KEYS/);
    assert.match(AI, /JM_TASKS\.map\(/);
  });
  test('5b the switch: absent is on, an admin turns it off, and off takes goto out of the tool', () => {
    assert.match(SRV, /const aiNavigateOn = \(\) => getSetting\('aiNavigate'\) !== false;/);
    assert.match(SRV, /if \(navigate !== undefined\) setSetting\('aiNavigate', !!navigate\);/);
    assert.match(SRV, /aiNavigateOn\(\) \? [^;]*goto/i);
    assert.match(SRV, /\.\.\.\(aiNavigateOn\(\) \? \{ goto: AI_GOTO_SCHEMA \} : \{\}\)/, 'the map route too');
  });
  test('5b2 the two hosts say the same rule, word for word', () => {
    for (const k of ['AI_GOTO_RULE', 'AI_GOTO_OFF_RULE']){
      const srv = SRV.match(new RegExp(`const ${k} = '((?:[^'\\\\]|\\\\.)*)';`));
      const web = AI.match(new RegExp(`const ${k}="([^"]*)";`));
      assert.ok(srv && web, k);
      assert.equal(web[1], srv[1].replace(/\\'/g, "'"), k);
    }
  });
  test('5b3 Settings shows the switch and what it costs, in both books', () => {
    const SET = R('js/views/settings.js');
    assert.match(SET, /id="ai-navigate"/);
    assert.match(SET, /navigate: !!document\.getElementById\('ai-navigate'\)\?\.checked/);
    for (const k of ['set_ai_navigate', 'set_ai_navigate_body', 'set_ai_navigate_cost']){
      const n = (I18N.match(new RegExp(`^    ${k}: `, 'gm')) || []).length;
      assert.equal(n, 2, k + ' in both books');
    }
  });
  test('5c the browser runs goto through the map\'s own door, never an admin task for a non-admin', () => {
    const s = stage({ admin: false });
    assert.equal(s.ctx.jmGotoAct({ task: 'team' }, 'add a user'), null);
    assert.equal(s.ctx.jmGotoAct({ task: 'nonsense' }, ''), null);
    const a = s.ctx.jmGotoAct({ task: 'standards', book: 'supply' }, 'where do I edit standards');
    assert.equal(a.map, 'standards'); assert.equal(a.book, 'supply');
    const b = s.ctx.jmGotoAct({ task: 'standards', book: 'nope' }, '');
    assert.equal(b.book || null, null);
  });
});

/* (6) THE EXACT SPOT (navigable by typing, stage 4; owner's yes, 22 Oct 2026): the AI may also name the
   one thing inside the place in words (goto.spot), which the browser reads with the same free map a typed
   ask is (navRead), the task the fallback. The server keeps the words short and markup-free; it never
   turns them into a route. */
describe('f920 (6) the AI names the exact spot, the map reads it', () => {
  const SRV = R('server/server.js'), AI = R('js/ai.js');
  test('6a the schema offers spot and the exact door beside task; a door may stand without a task (stage 2 of Jambo works like Copilot)', () => {
    assert.match(SRV, /spot: \{ type: 'string', description: 'OPTIONAL — when they name ONE thing inside a place/);
    assert.match(SRV, /door: AI_DOOR_SCHEMA,/);
    assert.match(SRV, /required: \[\] \};/);
  });
  test('6b aiGotoOf keeps a short clean spot and still refuses an unknown task', () => {
    const src = SRV.slice(SRV.indexOf('function aiGotoOf('), SRV.indexOf('const RULE_DOOR_KINDS'));
    const ctx = { aiNavigateOn: () => true, JM_TASK_KEYS: ['contracts', 'team'], JM_TASK_ADMIN: ['team'] };
    vm.createContext(ctx); vm.runInContext(src + ';this.aiGotoOf=aiGotoOf;', ctx);
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.aiGotoOf({ task: 'contracts', spot: '  clause 7 of <b>MK-A1</b>\n' }, {}))), { task: 'contracts', spot: 'clause 7 of b MK-A1 /b' });
    assert.equal(ctx.aiGotoOf({ task: 'contracts', spot: 'x'.repeat(300) }, {}).spot.length, 120);
    assert.equal(ctx.aiGotoOf({ task: 'nowhere', spot: 'clause 7 of MK-A1' }, {}), null);
    assert.equal(ctx.aiGotoOf({ task: 'team', spot: "Grace's signing limit" }, { admin: false }), null, 'an admin task stays an admin\'s');
  });
  test('6c the browser reads the spot with navRead first, the task its fallback', () => {
    const run = AI.slice(AI.indexOf('function aiGotoRun('), AI.indexOf('const AI_CALENDAR_RULE'));
    assert.match(run, /a=navRead\(g\.spot\)/);
    assert.ok(run.indexOf('navRead(g.spot)') < run.indexOf('jmGotoAct(g, q)'), 'the spot is read before the task');
  });
});

/* (7) TAUGHT FROM THE HELD-OUT SENTENCES (22 Oct 2026). Thirty sentences
   written after the exam missed nine; each is now a way of asking, and three
   earlier readers stopped taking sentences that were not theirs: "show the
   tracked changes" is the Redlines (only "with tracked changes" sends a Word
   copy), "show me the audit trail" is History (the sealed record is a file
   asked for as one), and "anything", "every" and "each" are filler. Red at
   the parent: every line below but the two kept pins. */
describe('f920 (7) the held-out sentences, taught', () => {
  const TAUGHT = [
    ['where is the list of things I owe people?', 'needs'], ['where are all the signed contracts?', 'contracts'],
    ['how can I put a pdf contract into the system?', 'upload'], ['where do I answer the missing questions on this contract?', 'fill'],
    ['things waiting for my sign-off', 'approvals'], ['who did what on this contract?', 'history'], ['colleague contact details', 'people'],
    ['show the tracked changes', 'redline'], ['show me the audit trail', 'history'], ['anything about to expire?', 'expiring'],
    ['list every contract we have', 'contracts'], ['where can I sign this agreement?', 'sign'],
  ];
  test('7a each lands where it was asked', () => {
    const { ctx } = stage();
    const misses = TAUGHT.map(([q, k]) => [q, k, landsOrFirst(ctx, ctx.caActOf(q))]).filter(([, k, got]) => got !== k);
    assert.deepEqual(misses, []);
  });
  test('7b the readers narrowed still take their own sentences', () => {
    const { ctx } = stage();
    const a = ctx.caActOf('send it with tracked changes'); assert.equal(a && a.kind, 'door'); assert.equal(a.door, 'word');
    const r = ctx.caActOf('save the audit trail'); assert.equal(r && r.kind, 'menu'); assert.equal(r.menu, 'record');
    const s = ctx.caActOf('attach the signed copy'); assert.equal(s && s.kind, 'menu'); assert.equal(s.menu, 'signed');
  });
});
