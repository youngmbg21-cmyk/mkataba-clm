/* f1037 — THE NOTES BESIDE THE REDLINED PAPER SAY HOW THEY ENDED (owner picked "The Legora Way", 13 Nov 2026:
   "shouldnt this redline page also have notes on the side so you can distiguish between where the notes have led to
   redlines vs where the notes are still there but redlines have not been addressed?")
   ============================================================================
   On the Redline view the paper had notes only for the other side's asks; the panel's risks (riskItemsOf, the list
   that folds "Covered by your redlines") had no place beside the paper. Now each stands by its clause:

     (1) ANSWERED — a redline of ours covering it: a green tick, "not sent yet", our new words quoted, NO LINK (owner, 13 Nov
         2026: "Remove the link"; was See the change
         carrying the change's id, and it stands by that change's own section;
     (2) OPEN — no redline: amber, "<severity> · no redline yet", Draft a redline (the risk's own Edit), by its clause;
     (3) THEY DECIDE — our redline accepted, the note goes; turned down, it is open again;
     (4) ONE GROUP PER CLAUSE, headed "N · Name"; the chips only when both kinds stand, each with its count;
     (5) A VIEWER is shown the notes but no Draft a redline; THEIR VIEW carries none of them;
     (7) OUR STANDARDS TOO (owner, 13 Nov 2026: "yes, add them"): a deviation answered by our redline on its words or one
         filed for it ("Playbook — <category>"); agreed it says so until Jambo reads again; open ones carry the Dossier's door;
         a missing one at the paper's end;
     (6) THE PAINTER asks for them on the red paper (was: and See the change is the paper's own link (rlLinkFocus).

   AT THE PARENT (ea9a894) every check fails: pd2RedAnswers, pd2RedBlocks, pd2RedChipsHtml and pd2RedGroupHtml do
   not exist and the painter draws only their asks.
   Run: node --test test/f1037-redline-notes-say-how-they-ended.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const PD = fs.readFileSync(path.join(__dirname, '..', 'js', 'paperdesk.js'), 'utf8');
const EN = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
function fnSrc(src, name){
  const at = src.search(new RegExp('function\\s+' + name + '\\s*\\('));
  if (at < 0) return '';
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && --d === 0) return src.slice(at, i + 1);
  }
  return '';
}

const RICH = '<h1>SERVICES</h1>'
  + '<h2>1. Services</h2><p>AIT shall provide warehousing services.</p>'
  + '<h2>2. Pricing</h2><p>AIT may revise pricing by providing thirty days written notice.</p>'
  + '<h2>3. Liability</h2><p>Each party is liable for direct loss only, never for lost goods.</p>'
  + '<h2>4. Notices</h2><p>Notices are sent by post only, to the registered office.</p>';

const NAMES = ['pdRedTheirs', 'pd2Find', 'pd2RedAnswers', 'pd2RedStdAnswers', 'pd2RedBlocks', 'pd2RedChipsHtml', 'pd2RedGroupHtml'];

async function stage(o = {}){
  const w = buildWorld({ negotiationView: true, playbook: true, risks: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.confirmDialog = async () => true;
  win.toast = () => {};
  const c = supplyContract({ redlineText: RICH });
  c.risks = { marked: [
    { title: 'AIT can raise prices on notice', quote: 'AIT may revise pricing by providing thirty days written notice.' },
    { title: 'Lost goods are never covered', quote: 'never for lost goods' },
    { title: 'Notices by post only', quote: 'Notices are sent by post only' }] };
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'dashboard' });
  win.getContract = id => (id === c.id ? c : null);
  if (o.viewer) win.canEdit = () => false;
  const cl = re => win.negoClauseList(c).find(x => re.test(String(x.heading || x.headingText || '') + ' ' + x.text));
  const ours = await win.negoEditClause(c, cl(/Pricing/).clauseId, '<p>AIT may adjust pricing to reflect a verified increase in external costs, capped at ten per cent a year.</p>', { side: 'owner', author: 'Young' });
  /* the paper's own module-level names the new readers lean on */
  win.eval(`var _pdE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    var _pdT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
    var _pdTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;
    var _pd2Unfolded = new Set(), _pd2Shut = new Set(); var PORTAL_MODE = false;
    if (typeof CSS === "undefined") var CSS = { escape: s => String(s).replace(/["\\\\]/g, "\\\\$&") };`);
  const srcs = NAMES.map(n => fnSrc(PD, n));
  if (srcs.some(s => !s)) return { win, c, ours, cl, missing: NAMES.filter((n, i) => !srcs[i]) };
  win.eval(srcs.join('\n') + '\nvar _pd2RedShow = "all";');
  const cv = () => { const d = win.document.createElement('div'); d.id = 'ig-canvas'; d.innerHTML = win.redlineDocHtml(c, { side: 'owner', readonly: true }); win.document.body.appendChild(d); return d; };
  return { win, c, ours, cl, cv };
}
const need = S => assert.deepEqual(S.missing || [], [], 'the readers exist');
const byTitle = (L, re) => L.find(n => re.test(n.k));

describe('f1037 (1) a note our redline answers', () => {
  test('green, "not sent yet", our new words quoted, no link, by that change\'s section', async () => {
    const S = await stage(); need(S);
    const cv = S.cv();
    const L = S.win.pd2RedAnswers(S.c, cv);
    const n = byTitle(L, /raise prices/);
    assert.ok(n, 'the pricing note is beside the paper');
    assert.equal(n.tone, 'done');
    assert.equal(n.state, S.win.i18t('pd2_rn_unsent'));
    assert.match(n.quote, /^AIT may adjust pricing to reflect a verified increase/, "the words our redline brings");
    assert.ok(n.quote.length <= 72, "cut at a word, with …");
    assert.equal(n.acts, '', 'no link: the note already stands by its change');
    assert.ok(n.hit && n.hit.el && n.hit.el.matches('section[data-clause]'), 'stands by a clause');
    assert.match(n.hit.el.getAttribute('data-nego-card-anchor') || '', new RegExp(S.ours.id));
  });
  test('its group draws the tick and "Answered by your redline"', async () => {
    const S = await stage(); need(S);
    const cv = S.cv();
    const B = S.win.pd2RedBlocks(S.c, cv, S.win.pd2RedAnswers(S.c, cv).map(n => Object.assign(n, { at: {} })));
    const g = B.find(b => b.items.some(x => /raise prices/.test(x.k)));
    const html = S.win.pd2RedGroupHtml(g, 0);
    assert.match(html, /pd2-rn-tick/);
    assert.match(html, new RegExp(S.win.i18t('pd2_rn_answered')));
    assert.match(html, /pd2-rn is-done/);
  });
});

describe('f1037 (2) a note with no redline', () => {
  test('amber, "no redline yet", Draft a redline pressing the risk\'s own Edit, by its clause', async () => {
    const S = await stage(); need(S);
    const cv = S.cv();
    const L = S.win.pd2RedAnswers(S.c, cv);
    const n = byTitle(L, /Lost goods/);
    assert.ok(n);
    assert.equal(n.tone, 'owe');
    assert.match(n.state, new RegExp(S.win.i18t('pd2_rn_none') + '$'));
    assert.match(n.acts, /data-pd2-go="redline" data-pd2-key="[^"]+"/);
    assert.match(n.acts, new RegExp(S.win.i18t('pd2_rn_draft')));
    assert.ok(n.hit, 'found on the paper');
    const sec = (n.hit.el || n.hit.range.startContainer.parentElement).closest('section[data-clause]');
    assert.ok(sec && /Liability/.test(sec.textContent));
  });
});

describe('f1037 (3) when they decide', () => {
  test('accepted: the note goes; turned down: it is open again', async () => {
    const S = await stage(); need(S);
    await S.win.negoResolve(S.c, S.ours.id, 'accepted', { side: 'counterparty', author: 'Erik' });
    assert.equal(byTitle(S.win.pd2RedAnswers(S.c, S.cv()), /raise prices/), undefined, 'agreed: gone');
    const T = await stage(); need(T);
    await T.win.negoResolve(T.c, T.ours.id, 'rejected', { side: 'counterparty', author: 'Erik' });
    const n = byTitle(T.win.pd2RedAnswers(T.c, T.cv()), /raise prices/);
    assert.ok(n && n.tone === 'owe', 'turned down: open again');
  });
});

describe('f1037 (4) one group per clause, and the chips', () => {
  test('a group per clause headed "N · Name"; chips only with both kinds, each with its count', async () => {
    const S = await stage(); need(S);
    const cv = S.cv();
    const L = S.win.pd2RedAnswers(S.c, cv).map(n => Object.assign(n, { at: {} }));
    const B = S.win.pd2RedBlocks(S.c, cv, L);
    const labels = B.map(b => b.label);
    assert.ok(labels.includes('2 · Pricing') && labels.includes('3 · Liability') && labels.includes('4 · Notices'), labels.join(' | '));
    assert.deepEqual(B.map(b => b.label), B.slice().sort((a, b) => a.y - b.y).map(b => b.label), 'in the paper\'s order');
    const chips = S.win.pd2RedChipsHtml(2, 1);
    assert.match(chips, /data-pd2-rn-chip="all"[^>]*aria-pressed="true">[^<]*<span>3<\/span>/);
    assert.match(chips, /data-pd2-rn-chip="open"[^>]*>[^<]*<span>2<\/span>/);
    assert.match(chips, /data-pd2-rn-chip="done"[^>]*>[^<]*<span>1<\/span>/);
    assert.equal(S.win.pd2RedChipsHtml(3, 0), '', 'one kind only: no chips');
  });
});

describe('f1037 (5) a viewer', () => {
  test('sees the notes, but no Draft a redline', async () => {
    const S = await stage({ viewer: true }); need(S);
    const n = byTitle(S.win.pd2RedAnswers(S.c, S.cv()), /Lost goods/);
    assert.ok(n);
    assert.equal(n.acts, '');
  });  test('their view (their copy as they get it) carries none of our notes', async () => {
    const S = await stage(); need(S);
    S.win.igTheirsOn = () => true;
    assert.equal(S.win.pd2RedAnswers(S.c, S.cv()).length, 0);
  });
});

describe('f1037 (6) the painter and the doors', () => {
  test('the red paper asks for the answers beside their asks; no See the change door is left', () => {
    const paint = fnSrc(PD, 'pd2NotesPaint');
    assert.match(paint, /pd2RedNotes\(c, cv\)\.concat\(pd2RedAnswers\(c, cv\)/);
    assert.match(paint, /pd2RedBlocks\(/);
    assert.doesNotMatch(PD, /data-pd2-go="see"|go === 'see'/);
    assert.match(PD, /go === 'redline' && typeof riskEditStart === 'function'/);
  });
  test('the words are in both books', () => {
    for (const k of ['pd2_rn_answered', 'pd2_rn_unsent', 'pd2_rn_sent', 'pd2_rn_none', 'pd2_rn_draft', 'pd2_rn_see', 'pd2_rn_chip_all', 'pd2_rn_chip_open', 'pd2_rn_chip_done'])
      assert.equal((EN.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in English and Swedish');
  });
});

describe('f1037 (7) our standards beside the redlined paper', () => {
  const V = c => { c.playbook = { verdicts: [
    { category: 'Price changes', status: 'deviation', quote: 'AIT may revise pricing by providing thirty days written notice.', position: 'Prices fixed for a year' },
    { category: 'Notices', status: 'deviation', quote: 'Notices are sent by post only', position: 'Email too' },
    { category: 'Liability cap', status: 'deviation', quote: 'never for lost goods', position: 'Goods covered' },
    { category: 'Data protection', status: 'missing', position: 'A data clause' },
    { category: 'Services', status: 'aligned' }] }; };
  test('answered by our redline on its words; open with the Dossier\'s door; missing at the end; met ones not drawn', async () => {
    const S = await stage(); need(S); V(S.c);
    const L = S.win.pd2RedStdAnswers(S.c, S.cv(), { chs: S.c.changes, unsent: new Set([String(S.ours.id)]), sec: sel => null, plain: t => String(t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() });
    const by = k => L.find(n => n.k === S.win.i18t('pd2_rn_std', { name: k }));
    assert.equal(by('Price changes').tone, 'done');
    assert.equal(by('Price changes').state, S.win.i18t('pd2_rn_unsent'));
    assert.equal(by('Notices').tone, 'owe');
    assert.match(by('Notices').state, new RegExp(S.win.i18t('pd2_std_differs') + ' · ' + S.win.i18t('pd2_rn_none')));
    assert.match(by('Notices').acts, /data-pd2-go="std-draft"/);
    assert.equal(by('Data protection').tone, 'owe');
    assert.equal(by('Data protection').orOwn, S.win.i18t('pd2_std_missing_h'));
    assert.match(by('Data protection').acts, new RegExp(S.win.i18t('pd2_std_add')));
    assert.equal(by('Services'), undefined, 'a standard met is not a note');
  });
  test('a redline filed for the standard ("Playbook — <category>") answers it wherever it stands', async () => {
    const S = await stage(); need(S); V(S.c);
    const ch = await S.win.negoEditClause(S.c, S.cl(/Liability/).clauseId, '<p>Each party is liable for direct loss, including lost goods.</p>', { side: 'owner', author: 'Young' });
    ch.note = 'Playbook — Liability cap (escalation position)';
    const L = S.win.pd2RedAnswers(S.c, S.cv());
    const n = L.find(x => x.std && /^Liability cap/.test(x.k));
    assert.ok(n && n.tone === 'done', 'answered');
  });
  test('agreed: it stays answered and says Jambo checks again; turned down: open again', async () => {
    const S = await stage(); need(S); V(S.c);
    await S.win.negoResolve(S.c, S.ours.id, 'accepted', { side: 'counterparty', author: 'Erik' });
    const a = S.win.pd2RedAnswers(S.c, S.cv()).find(x => x.std && /^Price changes/.test(x.k));
    assert.ok(a && a.tone === 'done' && a.state === S.win.i18t('pd2_rn_agreed'));
    const T = await stage(); need(T); V(T.c);
    await T.win.negoResolve(T.c, T.ours.id, 'rejected', { side: 'counterparty', author: 'Erik' });
    const b = T.win.pd2RedAnswers(T.c, T.cv()).find(x => x.std && /^Price changes/.test(x.k));
    assert.ok(b && b.tone === 'owe');
  });
  test('a viewer sees them with no door; their view carries none', async () => {
    const S = await stage({ viewer: true }); need(S); V(S.c);
    const n = S.win.pd2RedAnswers(S.c, S.cv()).find(x => x.std && /^Notices/.test(x.k));
    assert.ok(n); assert.equal(n.acts, '');
    S.win.igTheirsOn = () => true;
    assert.equal(S.win.pd2RedAnswers(S.c, S.cv()).length, 0);
  });
  test('the new word is in both books', () => {
    for (const k of ['pd2_rn_agreed', 'pd2_rn_std']) assert.equal((EN.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});
