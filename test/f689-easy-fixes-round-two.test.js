/* f689 — THE EASY FIXES, ROUND TWO (the owner's "Go", 15 Oct 2026)
   ========================================================================
     13  HaTi's own dropdown list stays open when a box ELSEWHERE scrolls
         (Jambo's conversation scrolling itself behind it); the page, or a box
         the control sits in, still carries it shut
   More of round two is added below as it is built. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('F689 (13) — a scroll that does not move the control leaves the list open', () => {
  const CORE = read('js/core.js');
  const from = CORE.indexOf('let _selMenuEl = null');
  const to = CORE.indexOf('function _selMenuAnchorEl(');
  const end = CORE.indexOf('\n', to);
  assert.ok(from > -1 && to > from, 'the list\'s code is found');
  const SRC = CORE.slice(from, end);
  function stage(){
    const dom = new JSDOM(`<!doctype html><body>
      <div id="form" style="overflow:auto;height:200px"><label id="lab">Stream <select id="sel"><option>Sales</option><option>Procurement</option></select></label></div>
      <div id="chat" style="overflow:auto;height:200px"><p>Jambo said something</p></div></body>`, { runScripts: 'outside-only', pretendToBeVisual: true });
    const w = dom.window;
    w.eval(SRC + '\n_selMenuArmDoc(); window._open = selectMenuOpen; window._showing = selectMenuShowing;');
    const doc = w.document;
    const scroll = el => el.dispatchEvent(new w.Event('scroll'));
    return { w, doc, scroll, open: () => w._open(doc.getElementById('sel')), showing: () => w._showing() };
  }
  test('the list opens', () => {
    const s = stage(); assert.equal(s.open(), true); assert.equal(s.showing(), true);
  });
  test('another box scrolling (the conversation) leaves it open', () => {
    const s = stage(); s.open(); s.scroll(s.doc.getElementById('chat')); assert.equal(s.showing(), true);
  });
  test('the box the control sits in scrolling shuts it', () => {
    const s = stage(); s.open(); s.scroll(s.doc.getElementById('form')); assert.equal(s.showing(), false);
  });
  test('the page scrolling shuts it', () => {
    const s = stage(); s.open(); s.scroll(s.doc); assert.equal(s.showing(), false);
  });
  test('a scroll inside the list itself leaves it open, as before', () => {
    const s = stage(); s.open(); s.scroll(s.doc.querySelector('.hati-selmenu')); assert.equal(s.showing(), true);
  });
});

describe('F689 (14) — the signing and sending path speaks the reader\'s language', () => {
  const I18N = read('js/i18n.js');
  function sv(){
    const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', url: 'https://hati.test/' });
    const w = dom.window;
    /* the language is remembered through core.js's store, not loaded here */
    const kept = {}; w.lsGet = k => kept[k]; w.lsSet = (k, v) => { kept[k] = v; };
    w.eval(I18N);
    w.langSet('sv', { repaint: false });
    assert.equal(w.langId(), 'sv', 'the stage reads Swedish');
    return w;
  }
  const w = sv();
  const SERVER = read('server/server.js');
  /* the server's own sentences, built exactly as the server builds them */
  const cases = [
    ['The approval step “Value ≥ KES 5M” was refused. Revise the contract and send it back for approval from Before you sign.', /^Godkännandesteget ”Value ≥ KES 5M” avslogs\./],
    ['This contract changed after “Legal review” was approved, so it has to be approved again before anyone signs it.', /^Avtalet ändrades efter att ”Legal review” godkändes/],
    ['This contract needs its approval step “Legal review” before anyone signs it.', /^Avtalet behöver sitt godkännandesteg ”Legal review”/],
    ['Internal approval is outstanding: “Legal review” is waiting. HaTi cannot stop a signature made elsewhere, so it asks for approval here.', /^Internt godkännande saknas: ”Legal review” väntar\./],
    ['Internal approval is outstanding: “Legal review” is out of date — the contract changed after it was approved. HaTi cannot stop a signature made elsewhere, so it asks for approval here.', /inaktuellt/],
    ['HaTi runs the signing on this contract. Choose "They run the signing" in Before you sign first.', /^HaTi sköter underskriften/],
    ['MK-2026-014 has been signed by at least one person, so it cannot go back to Draft. Restart the signing in Before you sign first if the wording has to be worked on again.', /^MK-2026-014 har signerats av minst en person/],
    ['Something on the check before signing is still held: a departure from our standards (Liability). Settle or accept each one in Before you sign first.', /^Något i kontrollen före signering hålls fortfarande: a departure from our standards \(Liability\)\. Klara av/],
  ];
  for (const [en, want] of cases) test(en.slice(0, 60) + '…', () => assert.match(w.srvMsg(en), want));
  test('each translated sentence is still the server\'s own wording (an edited server sentence would pass through untranslated)', () => {
    for (const frag of ['was refused. Revise the contract and send it back for approval from Before you sign.',
      'was approved, so it has to be approved again before anyone signs it.',
      'before anyone signs it.`', 'HaTi cannot stop a signature made elsewhere, so it asks for approval here.',
      'HaTi runs the signing on this contract. Choose "They run the signing" in Before you sign first.',
      'so it cannot go back to Draft. ', 'Restart the signing in Before you sign first if the wording has to be worked on again.',
      '. Settle or accept each one in Before you sign first.'])
      assert.ok(SERVER.includes(frag), frag);
  });
  test('an unknown sentence still passes through untouched', () => {
    assert.equal(w.srvMsg('Something nobody has written yet.'), 'Something nobody has written yet.');
  });
  test('the upload reader, the Library upload and the signature pad say nothing in English of their own', () => {
    const ROOM = read('js/views/contract.js'), LIB = read('js/views/library.js'), SIG = read('js/signature.js');
    for (const [src, s] of [[ROOM, 'Could not read that file'], [ROOM, 'Could not read this Word file'], [ROOM, 'This looks like a scan'],
      [ROOM, '`Reading page'], [ROOM, 'Reading details out of'], [LIB, 'This looks like a scan'], [LIB, '`Reading page'],
      [SIG, "'Could not read that image'"], [SIG, "'Could not read that file'"]])
      assert.ok(!src.includes(s), s);
    assert.equal(w.i18t('ct_up_page', { n: 2, total: 9 }), 'Läser sida 2 av 9…');
    assert.equal(w.i18t('si_img_fail'), 'Kunde inte läsa bilden');
  });
  test('the send screen\'s readiness rows are read from the books', () => {
    const CORE = read('js/core.js');
    for (const s of ['No expiry or term end is recorded', 'No effective date is recorded', 'This contract is still a Draft',
      'Internal approval was refused${', 'it needs approving again.`', 'cannot go out for signature until it clears.`'])
      assert.ok(!CORE.includes(s), s);
    assert.equal(w.i18t('sgx_rd_draft'), 'Avtalet är fortfarande ett utkast.');
  });
  test('every new entry is in both books', () => {
    const keys = ['ct_up_read_fail', 'ct_up_word_fail', 'ct_up_scan', 'ct_up_page', 'ct_up_page_local', 'ct_up_machine',
      'si_img_fail', 'si_file_fail', 'sgx_rd_term', 'sgx_rd_effective', 'sgx_rd_ap_hold', 'sgx_rd_draft',
      'srv_ap_step_refused', 'srv_ap_step_stale', 'srv_ap_step_needed', 'srv_ho_ap_waiting', 'srv_ho_ap_refused',
      'srv_ho_ap_stale', 'srv_ho_runs_here', 'srv_signed_no_draft', 'srv_check_require', 'srv_check_held'];
    for (const k of keys) assert.equal(I18N.split('\n').filter(l => new RegExp('^\\s+' + k + ':').test(l)).length, 2, k);
  });
});
