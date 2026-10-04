/* ============================================================
   f490 — ONE LINK CHECK FOR EVERY LINK KIND (the browser's half)
   ============================================================
   The process review, gap C (4 Oct 2026). signLinkRefusal was the one list a
   SIGNING link asked; every other kind of link asked whatever its door
   happened to ask — the send screen the desk and the review for every kind
   (an adviser link included), the phone nothing at all, no door the hold.

   Now one function, linkRefusal(c, {purpose, signerId, email, keep}), asks
   each kind the rows of ONE table (LINK_ASKS, js/core.js), and the server
   asks the same table (SRV_LINK_ASKS — pinned equal here, driven in f491):

     sign       hold · desk* · reviewer · reviewgate · signapproval · approval* · signcheck* · address
     negotiate  hold · desk  · reviewer · reviewgate
     view       hold · desk  · reviewer · reviewgate
     history    hold · desk  · reviewer · reviewgate
     status     hold · desk  · reviewer           (a status page carries no wording)
     advise     hold                              (an adviser is our own counsel)
     (* before signing has begun; `keep` — more time, a reminder — asks hold · desk)

   Red against the parent: no linkRefusal, no LINK_ASKS, no SRV_LINK_ASKS, the
   phone and the round send asked no hold, and the send screen refused an
   adviser link to a colleague who is not the lead.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadViews } = require('./dom');
const { buildPortal } = require('./portalworld');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CORE_RAW = read('js/core.js');
const CORE = strip(CORE_RAW);
const SERVER = strip(read('server/server.js'));

/* The object literal after `name =`, read as data. */
function literal(src, name){
  const at = src.indexOf(name);
  assert.ok(at >= 0, name + ' is declared');
  const open = src.indexOf('{', at);
  let i = open + 1, depth = 1;
  while (depth && i < src.length){ if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
  return new Function('return (' + src.slice(open, i) + ')')();
}
const arrayLit = (src, re) => { const m = re.exec(src); assert.ok(m, String(re)); return new Function('return ' + m[1])(); };

describe('f490 (1) one table, both hosts', () => {
  test('1a the browser and the wall carry the same rows', () => {
    const browser = literal(CORE, 'const LINK_ASKS=Object.freeze(');
    const wall = literal(SERVER, 'const SRV_LINK_ASKS = Object.freeze(');
    assert.deepEqual(browser, wall);
    assert.deepEqual(arrayLit(CORE, /const LINK_KEEP_ASKS=(\[[^\]]*\])/), arrayLit(SERVER, /const SRV_LINK_KEEP_ASKS = (\[[^\]]*\])/),
      'and the same keeping rows');
  });
  test('1b every kind the server knows has a row, and the rows say what the brief decided', () => {
    const T = literal(CORE, 'const LINK_ASKS=Object.freeze(');
    const kinds = arrayLit(SERVER, /const SHARE_PURPOSES = (\[[^\]]*\])/);
    assert.deepEqual([...Object.keys(T)].sort(), [...kinds].sort());
    for (const k of kinds) assert.equal(T[k][0], 'hold', `${k}: a held contract sends nothing`);
    for (const k of ['sign', 'negotiate', 'view', 'history', 'status']) assert.ok(T[k].includes('desk'), `${k} asks the desk`);
    assert.deepEqual(T.advise, ['hold'], 'an adviser link asks the hold alone');
    assert.ok(!T.status.includes('reviewgate'), 'a status page carries no wording for the gate to hold');
    assert.deepEqual(T.sign, ['hold', 'desk', 'reviewer', 'reviewgate', 'signapproval', 'approval', 'signcheck', 'address'],
      'the sign row is the list signLinkRefusal always asked, in its order');
  });
});

/* The function and its table, lifted out of js/core.js and run against stubs —
   the slice f463 (3b) runs, so the two files drive the same text. */
function env(o = {}){
  const body = CORE_RAW.slice(CORE_RAW.indexOf('function signLinkRefusal(c, opts={}){'));
  const fn = body.slice(0, body.indexOf('\nasync function issueSigningRouteLinks'));
  const sb = loadViews([], { i18t: (k, v) => k + (v ? JSON.stringify(v) : ''), i18tn: (k, n) => k + ':' + n,
    signerPlan: () => [{ id: 's1', email: 'grace@x.co' }], ...o });
  vm.runInContext(fn + '\nthis.linkRefusal=linkRefusal;this.signLinkRefusal=signLinkRefusal;this.linkAsks=linkAsks;', sb, { filename: 'core-link' });
  return sb;
}
const KINDS = ['sign', 'negotiate', 'view', 'history', 'status', 'advise'];
const C = { id: 'MK-1', status: 'Under Review' };
const kindsRefused = (s, extra = {}) => KINDS.filter(p => { const no = s.linkRefusal(C, { purpose: p, ...extra }); return !!no; });

describe('f490 (2) each kind asks its own rows', () => {
  test('2a [control] nothing holds, nothing is refused', () => {
    assert.deepEqual(kindsRefused(env()), []);
  });
  test('2b a contract on hold refuses every outward kind, in the kind\'s own words', () => {
    const s = env({ contractOnHold: () => true });
    assert.deepEqual(kindsRefused(s), KINDS);
    assert.match(s.linkRefusal(C, { purpose: 'sign' }).why, /^MK-1 is on hold .* so a signing link cannot be issued/, 'a signing link keeps its sentence');
    assert.match(s.linkRefusal(C, { purpose: 'view' }).why, /^MK-1 is on hold .* so no link goes out on it/);
    assert.equal(s.linkRefusal(C, { purpose: 'advise' }).kind, 'hold');
  });
  test('2c the desk: every kind that reaches the other side, never an adviser', () => {
    const s = env({ deskSendBlock: () => 'Only Wanjiru sends' });
    assert.deepEqual(kindsRefused(s), ['sign', 'negotiate', 'view', 'history', 'status']);
    assert.equal(s.linkRefusal(C, { purpose: 'status' }).kind, 'desk');
    const started = env({ deskSendBlock: () => 'Only Wanjiru sends', saStarted: () => true });
    assert.deepEqual(kindsRefused(started), ['negotiate', 'view', 'history', 'status'],
      'once signing has begun the next signer\'s link is the route carrying itself — every other kind still asks');
  });
  test('2d the review: the posture holds every kind that reaches them; the gate every kind carrying wording', () => {
    assert.deepEqual(kindsRefused(env({ reviewActorBlockMessage: () => 'hand it back' })),
      ['sign', 'negotiate', 'view', 'history', 'status']);
    assert.deepEqual(kindsRefused(env({ reviewGateMessage: () => 'not cleared' })),
      ['sign', 'negotiate', 'view', 'history']);
  });
  test('2e the signing link\'s own rows never hold another kind', () => {
    const s = env({ signApprovalHoldsLinks: () => 'waiting on FD',
      approvalState: () => ({ required: true, ok: false, rejected: [1], stale: [] }),
      signCheckLinkHolds: () => [{ category: 'Payment terms' }] });
    assert.deepEqual(kindsRefused(s), ['sign']);
    assert.equal(s.linkRefusal(C, { purpose: 'negotiate', signerId: 's1', email: 'other@x.co' }), null, 'nor does the address');
    assert.equal(env().signLinkRefusal(C, { signerId: 's1', email: 'other@x.co' }).kind, 'address');
  });
  test('2f keeping a link (more time, a reminder) asks the hold and the desk only', () => {
    assert.deepEqual(kindsRefused(env({ reviewGateMessage: () => 'x', reviewActorBlockMessage: () => 'y' }), { keep: true }), []);
    assert.deepEqual(kindsRefused(env({ deskSendBlock: () => 'lead only' }), { keep: true }),
      ['sign', 'negotiate', 'view', 'history', 'status']);
    assert.deepEqual(kindsRefused(env({ contractOnHold: () => true }), { keep: true }), KINDS);
  });
  test('2g an executed copy travels on any kind; an absent kind is a negotiation; an unknown one asks the strictest', () => {
    const s = env({ contractOnHold: () => true, deskSendBlock: () => 'lead only' });
    for (const p of KINDS) assert.equal(s.linkRefusal({ ...C, status: 'Signed' }, { purpose: p }), null, p);
    assert.equal(s.linkRefusal(C).kind, 'hold', 'no purpose → the negotiation row');
    assert.deepEqual([...env().linkAsks()], [...env().linkAsks('negotiate')]);
    assert.deepEqual([...env().linkAsks('nonsense')], [...env().linkAsks('sign')]);
  });
  test('2h signLinkRefusal is the sign row, nothing more', () => {
    assert.match(CORE, /function signLinkRefusal\(c, opts=\{\}\)\{\s*return linkRefusal\(c, \{ \.\.\.opts, purpose:'sign' \}\);\s*\}/);
  });
  test('2i the hold\'s new sentence is in both books', () => {
    const I = require('../js/i18n.js').STRINGS;
    assert.ok(I.en.sl_on_hold_link && I.sv.sl_on_hold_link);
    assert.match(I.en.sl_on_hold_link, /\{ref\}/); assert.match(I.sv.sl_on_hold_link, /\{ref\}/);
  });
});

describe('f490 (3) every door asks it', () => {
  test('3a the send screen: the sign row by name, every other kind its own row — no second question', () => {
    const fn = /const doSend=async\(\)=>\{[\s\S]*?const wantDurable=/.exec(CORE)[0];
    assert.match(fn, /if\(purposeSel==='sign'\)\{\s*const no=signLinkRefusal\(c,\{ signerId:signerSel, email \}\);\s*if\(no\)\{ toast\(no\.why,'err'\); return false; \}\s*\}else\{\s*const no=linkRefusal\(c,\{ purpose:purposeSel \}\);/);
    assert.doesNotMatch(fn, /reviewSendBlock\(c\)/, 'the desk-and-review check that asked every kind the same is gone from this door');
    assert.match(fn, /const ack=purposeSel==='advise' \? null : document\.getElementById\('sh-ack'\);/,
      'and an adviser link is not asked a tick behind a fold its own purpose hides');
  });
  test('3b the round send and its four callers ask the kind they refresh', () => {
    assert.match(CORE, /async function reshareToLastRecipient\(c, opts=\{\}\)\{[\s\S]{0,200}const no=linkRefusal\(c,\{ purpose:SHARE_PURPOSE\(opts\.purpose\)\|\|'negotiate' \}\);\s*if\(no\) throw new Error\(no\.why\);/);
    const fn = /async function reshareToLastRecipient\(c, opts=\{\}\)\{[\s\S]*?const shares=/.exec(CORE)[0];
    assert.doesNotMatch(fn, /deskSendBlock|reviewGateMessage|reviewActorBlockMessage/, 'one question, not three of its own');
    assert.match(CORE, /function reviewSendBlock\(c, purpose\)\{[\s\S]{0,120}linkRefusal\(c,\{ purpose:purpose\|\|'negotiate' \}\)/,
      'the old toast helper is the one check\'s face');
  });
  test('3c the Negotiate page\'s Send asks it before the dialog', () => {
    const NV = strip(read('js/views/negotiation.js'));
    const at = NV.indexOf("host.querySelector('#nego-send')");
    assert.ok(at > 0);
    const seg = NV.slice(at, at + 900);
    assert.match(seg, /linkRefusal\(c, \{ purpose: 'negotiate' \}\)/);
    assert.doesNotMatch(seg, /deskSendBlock\(c\)/);
  });
  test('3d the phone asks every kind, the sign row still by name', () => {
    const M = strip(read('js/mobile-contract.js'));
    assert.match(M, /s\.share==='sign' && window\.signLinkRefusal[\s\S]{0,200}\}else if\(window\.linkRefusal\)\{\s*let no=null; try\{ no=linkRefusal\(c,\{ purpose:s\.share \}\); \}catch\(_\)\{ no=null; \}\s*if\(no\)\{ s\.shareErr=no\.why;/);
  });
  test('3e the status page\'s owner line greys Share with the check\'s sentence', () => {
    const D = strip(read('js/dealstands.js'));
    const fn = /function standsOwnerHeadHtml\(c\)\{[\s\S]*?\n\}/.exec(D)[0];
    assert.match(fn, /linkRefusal\(c, \{ purpose: 'status' \}\)/);
    assert.match(fn, /data-ds-share\$\{no \? ` disabled aria-disabled="true" title="\$\{dsEsc\(no\.why\)\}"` : ''\}/);
  });
  test('3f keeping a link: the reminder and Copilot\'s "keep it open" ask the keeping rows', () => {
    assert.match(CORE, /linkRefusal\(c,\{ purpose:SHARE_PURPOSE\(s\.purpose\)\|\|'negotiate', keep:true \}\)/, 'the shares list\'s Resend');
    assert.match(strip(read('js/views/agents.js')),
      /linkRefusal\(c, \{ purpose: it\.soon\.kind === 'sign' \? 'sign' : 'negotiate', keep: true \}\)[\s\S]{0,160}\n\s*let r = null;\s*try \{ r = await shareKeepOpen/);
  });
  test('3g the wall is asked at every route that mints, re-points or keeps a link', () => {
    const route = re => { const m = re.exec(SERVER); assert.ok(m, String(re)); return m[0]; };
    assert.match(route(/app\.post\('\/api\/shares', auth[\s\S]*?\n\}\);/), /srvLinkRefusal\(req, rvStored, purp, \{ payload, contractId: shareId \}\)/);
    assert.match(route(/app\.put\('\/api\/shares\/:token\/payload'[\s\S]*?\n\}\);/), /srvLinkRefusal\(req, linkStored, sharePurposeOf\(s\), \{ payload, contractId: s\.contract_id \}\)/);
    assert.match(route(/app\.post\('\/api\/shares\/:token\/extend'[\s\S]*?\n\}\);/), /srvLinkRefusal\(req, srvStoredContract\(s\.contract_id\), sharePurposeOf\(s\), \{ keep: true/);
    assert.match(route(/app\.post\('\/api\/shares\/:token\/resend'[\s\S]*?\n\}\);/), /srvLinkRefusal\(req, srvStoredContract\(s\.contract_id\), sharePurposeOf\(s\), \{ keep: true/);
  });
});

/* ---- THE SEND SCREEN, DRIVEN ----
   The real dialog in the one window that loads js/core.js (f139's stage), with
   the desk and the hold stood in for at the names linkRefusal reads. Every
   POST is captured; every toast is heard. */
const contract = () => ({
  id: 'MK-490', name: 'Mutual Non-Disclosure Agreement', counterparty: 'Juno Limited',
  template: 'NDA', status: 'Under Review', folder: 'corp', fields: {}, metadata: {},
  audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 0, valueType: 'none', format: 'rich',
  redlineText: '<h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1><h2>1. Confidentiality</h2><p>Each party keeps the other\'s information secret.</p>',
});
async function dialog(over = {}){
  const p = buildPortal({ url: 'http://localhost/hati/' });
  const win = p.win;
  const posted = [], said = [];
  const user = { id: 'u_g', name: 'Grace Wambui', role: 'legal', email: 'g@co.ke' };
  win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
  win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
  win.API_MODE = () => true;
  win.api = async (pathname, method, body) => {
    if (String(pathname) === 'shares' && method === 'POST'){
      posted.push(body);
      return { ok: true, token: 'tok_490', link: 'https://hati.test/#s=t:tok_490', emailSent: true, emailConfigured: true };
    }
    if (/\/shares$/.test(String(pathname))) return { shares: [] };
    return {};
  };
  win.persist = () => {}; win.renderAuditSection = () => {};
  win.renderSharesSection = () => {}; win.refreshShareOverview = () => {};
  win.confirmDialog = async () => true;
  win.toast = (m, k) => { said.push({ m: String(m), k }); };
  /* An adviser is asked about chosen clauses: one, ticked. */
  win.adviserClauses = () => [{ clauseId: 'cl-1', heading: 'Confidentiality' }];
  win.adviserClauseRowHtml = () => '<label><input type="checkbox" class="asl-cl" value="cl-1" checked> Confidentiality</label>';
  Object.assign(win, over);
  await win.openShareModal(contract());
  const root = win.document.getElementById('modal-root');
  const $ = sel => root.querySelector(sel);
  return { win, posted, said, $,
    async send(purpose){
      const b = root.querySelector(`[data-share-purpose="${purpose}"]`);
      assert.ok(b, `the dialog offers "${purpose}"`);
      b.dispatchEvent(new win.Event('click', { bubbles: true }));
      $('#sh-email').value = 'erik@juno.example';
      const ack = $('#sh-ack'); if (ack) ack.checked = true;
      $('#share-send').dispatchEvent(new win.Event('click', { bubbles: true }));
      for (let i = 0; i < 12; i++) await Promise.resolve();
      await new Promise(r => setImmediate(r));
    } };
}
const DESK = 'Only Wanjiru Kamau sends this negotiation to the counterparty. Your changes are on the record for them.';

describe('f490 (4) the send screen, pressed', () => {
  test('4a [control] the lead\'s seat: a view link goes', async () => {
    const d = await dialog();
    await d.send('view');
    assert.equal(d.posted.length, 1, JSON.stringify(d.said));
    assert.equal(d.posted[0].purpose, 'view');
  });
  test('4b not the lead: a view link is refused in the desk\'s words, nothing posted', async () => {
    const d = await dialog({ deskSendBlock: () => DESK });
    await d.send('view');
    assert.equal(d.posted.length, 0);
    assert.ok(d.said.some(x => x.m === DESK && x.k === 'err'), JSON.stringify(d.said));
  });
  test('4c not the lead: an adviser link still goes — our own counsel is not the other side', async () => {
    const d = await dialog({ deskSendBlock: () => DESK, reviewGateMessage: () => 'not cleared' });
    await d.send('advise');
    assert.ok(!d.said.some(x => x.m === DESK), 'the desk is not asked of an adviser link');
    assert.equal(d.posted.length, 1, JSON.stringify(d.said));
    assert.equal(d.posted[0].purpose, 'advise');
  });
  test('4d on hold: the adviser link is refused too, and says the hold', async () => {
    const d = await dialog({ contractOnHold: () => true });
    await d.send('advise');
    assert.equal(d.posted.length, 0);
    assert.ok(d.said.some(x => /on hold while a dispute is dealt with, so no link goes out/.test(x.m) && x.k === 'err'),
      JSON.stringify(d.said));
  });
});
