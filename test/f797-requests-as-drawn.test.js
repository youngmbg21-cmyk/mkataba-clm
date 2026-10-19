'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f797 — REQUESTS, AS DRAWN (round 20 of the redesign, owner picked "The SAP
   way" by name, 17 Oct 2026; every drawn part built on the owner's yes of
   18 Oct 2026, "build all the gaps"; js/views/intake.js)
   (1) The band: the tabs, and BESIDE them the labelled boxes Request (words
       or a reference) · Stream · With — out of the list card's head.
   (2) The Open list oldest waiting first, as its head says; its count in a
       pill; the foot "N of M open".
   (3) The page head: "N open · what colleagues ask Legal for · advice too".
   (4) The request in Jambo's panel: reference · kind · who asked · stream,
       How it is handled and With as pills ("With you · by the NDA lane"),
       Start the draft · Promise a day · Hand back, their words quoted, the
       facts as rows, Attachments "1 of 3" as cards.
   (5) The counterparty's row says whether an NDA with them stands today —
       read from the book (Parties' own reading, cuNdaOf).
   (6) Jambo names the paper that fits, read WITHOUT AI (caDraftRank), and
       Start the draft opens the New agreement form with THAT one chosen —
       no model is asked.
   (7) With nothing chosen, Jambo says the list from its counts.
   (8) The words, in both books.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   The browser half: test/chromium/requests-and-notes-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IK = R('js/views/intake.js');
const CA = R('js/copilotacts.js');
const I18N = R('js/i18n.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
/* one top-level declaration of copilotacts.js, by name, whole */
const decl = (src, name) => {
  const m = new RegExp('^(?:async )?(?:function ' + name + '\\(|const ' + name + ' =)', 'm').exec(src);
  if (!m) return '';
  const i = m.index;
  const end = src.slice(i, i + 3).startsWith('con') ? src.indexOf(';\n', i) + 2 : src.indexOf('\n}', i) + 2;
  return src.slice(i, end);
};
const at = n => new Date(Date.now() - n * 864e5).toISOString();
const inDays = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };

function world(o){
  const w = buildWorld({ intakeView: true, registerView: true });
  const win = w.win;
  /* Naivas is in the book, so a request with them reads as routine (intakeRoad) */
  win.state = Object.assign(win.state || {}, { contracts: [{ id: 'MK-B1', name: 'Modern Trade Listing', counterparty: 'Naivas', folder: 'sales', status: 'Signed' }], settings: {}, view: 'intake' });
  win.currentUser = () => ({ id: 'u1', name: 'Amina Otieno', role: 'admin' });
  win.canEdit = () => !(o && o.asker);
  win.FOLDERS = { sales: { id: 'sales', name: 'Sales' }, proc: { id: 'proc', name: 'Procurement' } };
  win.visibleFolders = () => Object.values(win.FOLDERS);
  if (win.insForce) win.insForce(true);
  win._intakeState.list = (o && o.list) || [
    { id: 'REQ-1042', title: 'Mutual NDA with Naivas', need: 'Naivas want a two-month pilot. They asked for a mutual NDA first.', counterparty: 'Naivas', folder: 'sales', status: 'open', createdAt: at(1),
      by: { id: 'u9', name: 'Wanjiru Kamau' }, assignee: { id: 'u1', name: 'Amina Otieno' }, lane: 'NDA', files: [{ id: 'f1', name: 'pilot-brief.pdf', size: 240000 }] },
    { id: 'REQ-1039', title: 'Reseller agreement for Uganda', need: 'A reseller in Kampala.', folder: 'sales', status: 'open', createdAt: at(4), by: { id: 'u8', name: 'Achieng Odhiambo' } },
    { id: 'REQ-1037', title: 'Event venue booking', need: 'The hotel sent their own contract.', folder: 'proc', status: 'open', createdAt: at(3), by: { id: 'u7', name: 'Brian Ochieng' },
      assignee: { id: 'u5', name: 'Erik Ström' }, promisedAt: inDays(2) },
  ];
  win._intakeState.loaded = true;
  return { w, win, d: win.document };
}
const rowIds = d => [...d.querySelectorAll('.ik-lt [data-ik-row]')].map(r => r.getAttribute('data-ik-row'));
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

describe('f797 (1) the band: the tabs, and beside them the labelled boxes', () => {
  test('1a Request · Stream · With beside the tabs, each label before its box; none in the card head', () => {
    const { win, d } = world(); win.renderIntake();
    const bar = d.querySelector('.sap-band .reg-tabbar.ik-tabbar');
    assert.ok(bar, 'the band\'s one row');
    assert.ok(bar.querySelector(':scope > .rq-kinds'), 'the tabs first');
    const fb = bar.querySelector(':scope > .ik-fb');
    assert.ok(fb, 'the boxes beside them');
    const labels = [...fb.querySelectorAll('.ik-fb-l, .reg-f-l')].map(txt);
    assert.deepEqual(labels, ['Request', 'Stream', 'With']);
    assert.equal(fb.querySelector('[data-ik-q]').getAttribute('placeholder'), 'Words or a reference');
    assert.deepEqual([...fb.querySelectorAll('select[data-ik-f]')].map(s => s.getAttribute('data-ik-f')), ['folder', 'who']);
    assert.deepEqual([...fb.querySelectorAll('select[data-ik-f="who"] option')].map(txt), ['Anyone', 'You', 'Nobody yet', 'A colleague']);
    const head = d.querySelector('.ins-cardhead');
    assert.ok(!head.querySelector('[data-ik-q], [data-ik-filters]'), 'no find box or Filter fold left on the list\'s head');
    assert.ok(!d.querySelector('select[data-ik-f="road"]'), 'How it is handled is a column, not a box');
  });
  test('1b the tab says "Finished"; the asker has the find box alone', () => {
    const { win, d } = world(); win.renderIntake();
    assert.equal(d.querySelector('[data-ik-view="fin"]').firstChild.textContent, 'Finished');
    const a = world({ asker: true, list: [] }); a.win.renderIntake();
    const fb = a.d.querySelector('.ik-fb');
    assert.ok(fb && fb.querySelector('[data-ik-q]') && !fb.querySelector('select'), 'the asker: Request only');
  });
});

describe('f797 (2) oldest waiting first', () => {
  test('2a the Open list leads with the longest wait, and says so; its count in a pill', () => {
    const { win, d } = world(); win.renderIntake();
    assert.deepEqual(rowIds(d), ['REQ-1039', 'REQ-1037', 'REQ-1042']);
    const h = d.querySelector('.ins-cardhead-t');
    assert.match(txt(h), /^Open requests 3 oldest waiting first$/);
    assert.ok(h.querySelector('.ap-card-n.is-pill'), 'the count in its pill');
  });
  test('2b every other list newest first', () => {
    const { win, d } = world(); win.ikFilters().view = 'all'; win.renderIntake();
    assert.deepEqual(rowIds(d), ['REQ-1042', 'REQ-1037', 'REQ-1039']);
    assert.match(txt(d.querySelector('.ins-cardhead-t')), /newest first$/);
    win.ikFilters().view = 'open';
  });
  test('2c the foot: "3 of 3 open", and a box that narrows says how many of the tab\'s list are shown', () => {
    const { win, d } = world(); win.renderIntake();
    assert.equal(txt(d.querySelector('[data-ik-foot]')), '3 of 3 open');
    win.ikFilters().who = 'me'; win.renderIntake();
    assert.equal(txt(d.querySelector('[data-ik-foot]')), '1 of 3 open');
    win.ikFilters().who = 'all';
  });
});

describe('f797 (3) the page head', () => {
  test('3a "3 open · what colleagues ask Legal for · advice too"', () => {
    const { win } = world(); win.renderIntake();
    const f = win.document.createElement('div');
    /* the head is painted into the shell's slot (PAGE_HEAD_PAINT intake: ikPaintHead) */
    f.id = 'page-head-facts'; win.document.body.appendChild(f); win.ikPaintHead();
    assert.deepEqual([...f.children].map(txt), ['3 open', 'what colleagues ask Legal for · advice too']);
  });
});

describe('f797 (4) the request in Jambo\'s panel', () => {
  const open = () => { const x = world(); x.win.insSelect('intake:team', 'REQ-1042'); x.win.renderIntake(); return x; };
  test('4a reference · kind · who asked · stream; the road and With as pills; the three verbs, the rest under ⋯ at the pills\' end', () => {
    const { d } = open();
    const p = d.getElementById('ins-panel');
    assert.equal(txt(p.querySelector('.ins-eb')), 'REQ-1042 · Contract · from Wanjiru Kamau · Sales');
    const pills = p.querySelector('.jl-pills');
    assert.ok(pills, 'one row of pills');
    assert.equal(txt(pills.querySelector('.ik-road')), 'Routine', 'how it is handled, read from the words (the lane is said in With)');
    assert.equal(txt(pills.querySelector('.ik-with-chip')), 'With you · by the NDA lane');
    assert.ok(pills.querySelector('[data-ins-more]'), 'the ⋯ ends the pill row');
    const verbs = [...p.querySelectorAll('.ins-h .ins-acts [data-ins-act]')].map(txt);
    assert.deepEqual(verbs, ['Start the draft', 'Promise a day', 'Hand back']);
    const menu = [...p.querySelectorAll('[data-ins-menu] [data-act]')].map(b => b.getAttribute('data-act'));
    assert.ok(menu.includes('pick') && !menu.includes('promise'), 'Put it down stays under ⋯; Promise a day is a verb now');
  });
  test('4b their words quoted, then the facts as rows', () => {
    const { d } = open();
    const p = d.getElementById('ins-panel');
    assert.equal(txt(p.querySelector('.ik-need h3')), 'What Wanjiru asked for');
    assert.equal(txt(p.querySelector('.ik-ask-q')), '“Naivas want a two-month pilot. They asked for a mutual NDA first.”');
    const rows = [...p.querySelectorAll('.jl-rows.ik-rows > div')].map(r => [txt(r.querySelector('dt')), txt(r.querySelector('dd'))]);
    assert.deepEqual(rows.map(r => r[0]), ['Counterparty', 'Stream', 'How it is handled', 'With', 'Asked']);
    /* re-pointed 19 Oct 2026 (second check): the drawing's words, "our own template, nothing unusual asked" */
    assert.equal(rows[2][1], 'Routine — our own template, nothing unusual asked');
    assert.equal(rows[3][1], 'Amina Otieno (you), sent by the NDA lane');
    assert.match(rows[4][1], /^\S+ \d{1,2} \S+ · promised by —$/, 'the day it was asked, weekday first, no comma; no promise is a dash');
  });
  test('4c Attachments "1 of 3", each file a card: its size, who added it, Open', () => {
    const { d } = open();
    const sec = d.querySelector('#ins-panel .ik-files');
    assert.equal(txt(sec.querySelector('h3')), 'Attachments1 of 3');
    const card = sec.querySelector('.ik-file');
    assert.equal(txt(card.querySelector('b')), 'pilot-brief.pdf');
    assert.equal(txt(card.querySelector('.ik-file-b span')), '234 KB · added by Wanjiru');
    assert.equal(txt(card.querySelector('[data-ik-file]')), 'Open');
  });
  test('4d a promise past its day leads in red; a colleague holds it "With Erik Ström"', () => {
    const x = world({ list: [{ id: 'REQ-9', title: 'Late one', need: 'x', status: 'open', createdAt: at(9), promisedAt: inDays(-2),
      by: { id: 'u8', name: 'Achieng' }, assignee: { id: 'u5', name: 'Erik Ström' } }] });
    x.win.renderIntake();
    const pills = x.d.querySelector('#ins-panel .jl-pills');
    assert.equal(txt(pills.querySelector('.ins-pill.is-ruby')), 'Past its promise');
    assert.equal(txt(pills.querySelector('.ik-with-chip')), 'With Erik Ström');
    assert.ok(x.d.querySelector('#ins-panel [data-ins-fact="asked"] .ins-late'), 'the promise in the Asked row is red');
  });
});

describe('f797 (5) the counterparty\'s NDA today, read from the book', () => {
  test('5a none: "no NDA with them today"; in force: "an NDA in force, until …"; the name is the door to their contracts', () => {
    const x = world();
    x.win.cuKeyOf = n => String(n).toLowerCase();
    x.win.cuCustomerOf = k => k === 'naivas' ? { key: k, items: [{ id: 'MK-1' }] } : null;
    let st = { state: 'none', n: 0 };
    x.win.cuNdaOf = () => st;
    assert.equal(x.win.ikCpNdaWords('Naivas'), 'no NDA with them today');
    st = { state: 'inforce', ends: '2028-06-30', forGood: false };
    assert.match(x.win.ikCpNdaWords('Naivas'), /^an NDA in force, until /);
    st = { state: 'none' };
    const html = x.win.ikCpHtml({ counterparty: 'Naivas' });
    assert.match(html, /<button type="button" class="ik-cp-go" data-ik-cp="naivas"[^>]*>Naivas<\/button> <span class="ik-cp-nda">· no NDA with them today<\/span>/);
    assert.doesNotMatch(x.win.ikCpHtml({ counterparty: 'Nobody Known' }), /<button/, 'a name the book has never seen is said plainly');
  });
  test('5b the reading is Parties\' own (cuNdaOf), and the door is Open party, landed on', () => {
    const src = strip(IK);
    assert.match(src, /function ikCpNdaWords\(name\)\{[\s\S]*?cuNdaOf\(cuKeyOf\(name\)\)/);
    assert.match(src, /cuOpenCustomer\(b\.getAttribute\('data-ik-cp'\)\); if\(typeof jlLand==='function'\) jlLand\('list'\);/);
  });
});

describe('f797 (6) the paper that fits, read without AI; Start the draft chooses it', () => {
  const withRank = x => {
    /* draft-from-a-sentence's own ranking, the real functions */
    const code = ['CA_DRAFT_OPTS', 'caDraftWords', 'caDraftScore', 'caDraftShared', 'caDraftRank', 'caDraftTitleOf'].map(n => decl(CA, n)).join('\n');
    /* caDraftWords published too (second check: a fit needs a word of the paper's own name) */
    x.win.eval(code + '\nObject.assign(window,{caDraftWords,caDraftScore,caDraftShared,caDraftRank,caDraftTitleOf});');
    x.win.TEMPLATES = { ND: { id: 'ND', name: 'Mutual Non-Disclosure Agreement' }, DA: { id: 'DA', name: 'Distributor Agreement' } };
    x.win.draftCandidates = () => [
      { kind: 'builtin', id: 'DA', name: 'Distributor', blurb: 'Regional route-to-market distributor terms.' },
      { kind: 'builtin', id: 'ND', name: 'NDA', blurb: 'Confidentiality for NPD & vendor onboarding.' } ];
    return x;
  };
  test('6a the panel names the paper, bold, the words it shares, and what Start the draft does', () => {
    const x = withRank(world());
    x.win.insSelect('intake:team', 'REQ-1042'); x.win.renderIntake();
    const fit = x.d.querySelector('#ins-panel .ik-fit');
    assert.ok(fit, 'Jambo\'s line under the attachments');
    assert.equal(fit.getAttribute('data-ik-fit'), 'tid:ND');
    /* RE-POINTED 19 Oct 2026 (second pass): the name the New agreement form
       lists it under, so the panel and the form say one name; the drawing's
       sentence ("Sara asks for a mutual one, and nothing in her words departs
       from it") */
    assert.equal(txt(fit.querySelector('b')), 'NDA');
    assert.equal(txt(fit.querySelector('.jl-bub')), 'Our NDA fits: Wanjiru asks for “NDA”, and nothing in the ask departs from it. Start the draft opens the New agreement form with it chosen; you check it before anything is made.');
    assert.match(fit.getAttribute('title'), /no Jambo call/, 'it says it spends nothing');
  });
  test('6b none fits: said as none, never guessed', () => {
    const x = withRank(world());
    x.win.insSelect('intake:team', 'REQ-1037'); x.win.renderIntake();
    assert.match(txt(x.d.querySelector('#ins-panel .ik-fit .jl-bub')), /^Nothing on our paper shares a word with what Brian asked\./);
    assert.equal(x.d.querySelector('#ins-panel .ik-fit').getAttribute('data-ik-fit'), '');
  });
  test('6c Start the draft opens the form with THAT paper chosen, and asks no model', async () => {
    const x = withRank(world());
    const calls = [];
    x.win.openNewAgreement = o => calls.push(o);
    x.win.intakePrefillOf = () => ({ counterparty: 'Naivas' });
    const before = x.w.log.api.length;
    await x.win.intakeDraft('REQ-1042');
    assert.equal(calls.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(calls[0].pick)), { kind: 'tid', id: 'ND' });
    assert.ok(!x.w.log.api.slice(before).some(c => /ai\//.test(c.pathname)), 'no call to a model route');
    assert.equal(typeof x.win.intakeSuggestTemplate, 'undefined', 'the silent AI pick is retired');
  });
});

describe('f797 (7) with nothing chosen, Jambo says the list', () => {
  test('7a counted from the list, no call; a chip narrows to what nobody holds', () => {
    const x = world();
    x.win.insLetGo('intake:team'); x.win.renderIntake();
    const p = x.d.getElementById('ins-panel');
    assert.equal(txt(p.querySelector('.jl-bub')), '3 open requests. 1 nobody holds yet, asked 4 days ago. 1 is with you.');
    assert.match(txt(p.querySelector('.jl-src')), /no Jambo call/);
    assert.deepEqual([...p.querySelectorAll('.jl-chip')].map(txt), ['the ones nobody holds', 'ask for a contract']);
  });
});

describe('f797 (8) the words', () => {
  test('8a in both books', () => {
    const books = I18N.split(/\n  sv: \{/);
    assert.equal(books.length >= 2, true);
    for (const k of ['ik_v_finished', 'ik_hf_sub', 'ik_box_request', 'ik_box_request_ph', 'ik_sort_oldest', 'ik_foot_n_open', 'ik_pill_with_you_lane',
      'ik_with_sent_comma', 'ik_promised_by', 'ik_files_of', 'ik_file_by', 'ik_cp_nda_none', 'ik_cp_nda_inforce', 'jl_ik_fit_routine', 'jl_ik_fit_closest',
      'jl_ik_fit_none', 'jl_ik_fit_src', 'jl_ik_say_open_other', 'jl_ik_chip_nobody'])
      for (const b of books.slice(0, 2)) assert.ok(new RegExp('\\n\\s+' + k + ': ').test(b), k);
    assert.match(books[0], /ik_act_promise: 'Promise a day',/);
  });
});

/* SECOND PASS (lane A3, 19 Oct 2026): an advice request reads like the
   request drawn, and a refresh lands on the same tab, boxes and row.
   At the first pass (fc08e7f) every test here FAILS. */
describe('f797 (9) an advice request in round 20\'s shape', () => {
  const adv = () => {
    const x = world();
    x.win.state.advice = [{ id: 'AR-101', service: 'review', name: 'Erik Ström', company: 'Procurement', description: 'May Stratos pass our data to a subcontractor?',
      status: 'In progress', submittedAt: at(3), eta: inDays(1), assignee: 'Wanjiru Kamau' }];
    x.win.insSelect('intake:team', 'adv:AR-101'); x.win.renderIntake();
    return x;
  };
  test('9a one row of pills (where it stands, who holds it), their words quoted, the facts as rows', () => {
    const { d } = adv();
    const p = d.getElementById('ins-panel');
    assert.match(txt(p.querySelector('.ins-eb')), /^AR-101 · Advice · from Erik Ström · Procurement$/);
    const pills = p.querySelector('.jl-pills');
    assert.ok(pills, 'one row of pills, as the request\'s');
    assert.equal(txt(pills.querySelector('.ik-with-chip')), 'With Wanjiru Kamau');
    assert.equal(txt(p.querySelector('.ik-need h3')), 'What Erik asked for');
    assert.ok(p.querySelector('.ik-ask-q'), 'their words quoted');
    const rows = [...p.querySelectorAll('.jl-rows.ik-rows > div dt')].map(txt);
    assert.equal(rows[rows.length - 1], 'Asked', 'Asked · promised by closes the rows');
    assert.ok(rows.includes('With'));
    assert.equal(p.querySelector('.ins-kv'), null, 'the older two-column grid is gone');
    assert.match(txt(p.querySelector('[data-ins-fact="asked"] dd')), /· promised by \S+ \d{1,2} \S+$/);
  });
});

describe('f797 (10) a refresh lands at the same spot (PLACE_PARTS.intake)', () => {
  const APP = R('js/app.js');
  test('10a Requests is in the place store', () => {
    assert.match(APP, /intake:\['ikPlace','ikPlacePut'\]/);
  });
  test('10b the tab, the boxes and the chosen row come back, the row once the list is in', () => {
    const a = world();
    a.win.ikFilters().view = 'all'; a.win.ikFilters().folder = 'sales'; a.win.insSelect('intake:team', 'REQ-1039');
    const kept = JSON.parse(JSON.stringify(a.win.ikPlace()));
    const b = world();
    b.win._intakeState.loaded = false;
    b.win.insSelect('intake:team', null);
    b.win.ikPlacePut(kept);
    b.win.renderIntake();                       /* before the list is in: nothing chosen is lost */
    b.win._intakeState.loaded = true;
    b.win.renderIntake();
    assert.equal(b.win.ikFilters().view, 'all');
    assert.equal(b.win.ikFilters().folder, 'sales');
    assert.ok(b.d.querySelector('.ik-tabbar [data-ik-view="all"].is-on, .ik-tabbar [data-ik-view="all"][aria-selected="true"], .ik-tabbar [data-ik-view="all"][aria-current]'), 'the All tab lit');
    assert.match(txt(b.d.querySelector('#ins-panel .ins-eb')), /^REQ-1039 /, 'the chosen row is back');
  });
});

/* SECOND PASS (lane A3, 19 Oct 2026), the checker's findings. At the first
   pass (fc08e7f) every test here FAILS. */
describe('f797 (11) a tab\'s number is the list it opens; advice reads like a request', () => {
  const withAdv = () => {
    const x = world();
    x.win.state.advice = [{ id: 'AR-101', service: 'review', name: 'Erik Ström', company: 'Procurement', description: 'May they pass our data on?', status: 'Submitted', submittedAt: at(2) },
      { id: 'AR-102', service: 'review', name: 'Lina Ek', description: 'A question', status: 'Scoping', submittedAt: at(6), assignee: 'Wanjiru Kamau' }];
    return x;
  };
  const tabN = (d, k) => { const n = d.querySelector(`.ik-tabbar [data-ik-view="${k}"] .n`); return n && !n.hidden ? Number(n.textContent) : 0; };
  test('11a under a Stream box every tab counts what its list shows — advice has no stream', () => {
    const x = withAdv();
    x.win.ikFilters().folder = 'proc'; x.win.renderIntake();
    assert.equal(tabN(x.d, 'open'), x.d.querySelectorAll('.ik-lt [data-ik-row]').length, 'Open');
    assert.equal(tabN(x.d, 'advice'), 0, 'Advice: none in a stream');
    x.win.ikFilters().view = 'all'; x.win.renderIntake();
    assert.equal(tabN(x.d, 'all'), x.d.querySelectorAll('.ik-lt [data-ik-row]').length, 'All');
  });
  test('11b With = Nobody yet keeps the advice nobody holds, in the list and on the tab', () => {
    const x = withAdv();
    x.win.ikFilters().who = 'nobody'; x.win.renderIntake();
    const ids = [...x.d.querySelectorAll('.ik-lt [data-ik-row]')].map(r => r.getAttribute('data-ik-row'));
    assert.ok(ids.includes('adv:AR-101') && !ids.includes('adv:AR-102'), JSON.stringify(ids));
    assert.equal(tabN(x.d, 'open'), ids.length);
  });
  test('11c the find box narrows the tabs\' numbers too', () => {
    const x = withAdv();
    x.win.ikFilters().q = 'uganda'; x.win.renderIntake();
    assert.equal(tabN(x.d, 'open'), 1);
    assert.equal(tabN(x.d, 'advice'), 0);
  });
  test('11d an advice row: How it is handled "Standard", With its holder or "Nobody yet" in amber', () => {
    const x = withAdv(); x.win.ikFilters().view = 'advice'; x.win.renderIntake();
    const row = id => x.d.querySelector(`.ik-lt [data-ik-row="adv:${id}"]`);
    assert.equal(txt(row('AR-101').querySelector('.ik-road')), 'Standard');
    assert.equal(txt(row('AR-101').querySelector('.ik-with .ins-nobody')), 'Nobody yet');
    assert.equal(txt(row('AR-102').querySelector('.ik-with')), 'Wanjiru Kamau');
  });
  test('11e Jambo counts the advice nobody holds among those nobody holds', () => {
    const x = withAdv(); x.win.renderIntake();
    x.win.insLetGo('intake:team'); x.win.renderIntake();
    const say = txt(x.d.querySelector('#ins-panel .jl-bub'));
    assert.match(say, /2 nobody holds yet/, say);
  });
  test('11f the advice list landing after the first paint paints the list again', () => {
    const x = world(); x.win.renderIntake();
    const before = x.d.querySelectorAll('.ik-lt [data-ik-row]').length;
    x.win.state.advice = [{ id: 'AR-9', name: 'Erik', description: 'x', status: 'Submitted', submittedAt: at(1) }];
    x.win.rqPaintKindCounts();
    assert.equal(x.d.querySelectorAll('.ik-lt [data-ik-row]').length, before + 1);
  });
});

describe('f797 (12) the panel\'s acts do what they say', () => {
  test('12a Hand back asks "Hand this request back" and its button says Hand back', () => {
    const books = I18N.split(/\n  sv: \{/);
    assert.match(books[0], /ik_decline_title: "Hand this request back",/);
    assert.match(books[0], /ik_act_decline: "Hand back",/);
    assert.match(books[1], /ik_act_decline: "Lämna tillbaka",/);
  });
  test('12b Promise a day is chosen on a calendar, not typed', () => {
    const fn = decl(IK, 'intakePromiseAsk');
    assert.match(fn, /date:true/);
    assert.match(R('js/core.js'), /type="\$\{opts\.date\?'date':'text'\}"/);
  });
  test('12c Open opens the file in a tab of its own (never an SVG or a page), else saves it', () => {
    const fn = strip(decl(IK, 'intakeFileGet'));
    assert.match(fn, /window\.open\('', '_blank'\)/);
    assert.match(fn, /image\\\/\(png\|jpe\?g\|gif\|webp\)/);
    assert.match(strip(IK), /intakeFileGet\(r\.id, b\.getAttribute\('data-ik-file'\), b\.getAttribute\('data-ik-fname'\), \{ open:true \}\)/);
  });
  test('12d Start the draft\'s form carries "‹ Requests" back', async () => {
    const x = world();
    const calls = []; x.win.openNewAgreement = o => calls.push(o);
    x.win.intakePrefillOf = () => ({});
    await x.win.intakeDraft('REQ-1042');
    assert.equal(calls[0].backLabel, 'Requests');
    assert.match(R('js/wizard.js'), /back:o\.backLabel\|\|''/);
    assert.match(R('js/core.js'), /b\.textContent='‹ '\+page\.back;/);
  });
});

describe('f797 (13) second check: a fit is said only where the ask names the paper', () => {
  const rank = x => {
    x.win.draftCandidates = () => [
      { kind: 'builtin', id: 'EL', name: 'Equipment Lease', blurb: 'Lease of plant and machinery.' },
      { kind: 'builtin', id: 'ND', name: 'NDA', blurb: 'Confidentiality for NPD & vendor onboarding.' } ];
    x.win.eval(['CA_DRAFT_OPTS', 'caDraftWords', 'caDraftScore', 'caDraftShared', 'caDraftRank', 'caDraftTitleOf'].map(n => decl(CA, n)).join('\n')
      + '\nObject.assign(window,{caDraftWords,caDraftScore,caDraftShared,caDraftRank,caDraftTitleOf});');
    return x;
  };
  test('13a one word shared with a description is "the closest", never "fits"; the word as the ask spells it', () => {
    const x = rank(world({ list: [{ id: 'REQ-5', title: 'Cold-chain transport to the Nairobi plant', need: 'Trucks.', status: 'open', createdAt: at(1),
      by: { id: 'u8', name: 'Achieng Odhiambo' } }] }));
    x.win.renderIntake();
    const say = txt(x.d.querySelector('#ins-panel .ik-fit .jl-bub'));
    assert.match(say, /^Our Equipment Lease is the closest on our paper: Achieng's words name “plant”\./, say);
    assert.ok(!/departs/.test(say));
  });
  test('13b a word in the paper\'s own name is a fit', () => {
    const x = rank(world());
    x.win.insSelect('intake:team', 'REQ-1042'); x.win.renderIntake();
    assert.match(txt(x.d.querySelector('#ins-panel .ik-fit .jl-bub')), /^Our NDA fits: Wanjiru asks for “NDA”, and nothing in the ask departs from it\./);
  });
  test('13c an advice request\'s pills read like a request\'s: Standard, then who holds it; where it stands is a row', () => {
    const x = world();
    x.win.state.advice = [{ id: 'AR-7', service: 'review', name: 'Erik Ström', description: 'x', status: 'Submitted', submittedAt: at(1) }];
    x.win.insSelect('intake:team', 'adv:AR-7'); x.win.renderIntake();
    const p = x.d.getElementById('ins-panel');
    assert.deepEqual([...p.querySelectorAll('.jl-pills > span')].map(txt).slice(0, 2), ['Standard', 'Nobody holds it yet'], 'as a request nobody holds says it');
    assert.equal(txt(p.querySelector('[data-ins-fact="stands"] dt')), 'Where it stands');
    assert.equal(txt(p.querySelector('[data-ins-fact="road"] dt')), 'How it is handled');
  });
});
