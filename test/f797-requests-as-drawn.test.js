'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f797 — REQUESTS, AS DRAWN (round 20 of the redesign, owner picked "The SAP
   way" by name, 17 Oct 2026; every drawn part built on the owner's yes of
   18 Oct 2026, "build all the gaps"; js/views/intake.js)
   (1) The band: the tabs, and BESIDE them the labelled boxes Request (words
       or a reference) · Stream · With — out of the list card's head.
       RE-POINTED 21 Oct 2026 (Part 8, the Legora way): the list head — the
       box, the tabs, + Filter's Stream and With, Columns.
   (2) The Open list oldest waiting first, as its head says; its count in a
       pill; the foot "N of M open". RE-POINTED (Part 8): the Open tab says it
       on hover, counted; the foot "1–N of N".
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

/* RE-POINTED 21 Oct 2026 (Part 8: the owner picked "the Legora way" for every
   list page). Round 20's band — the tabs with the labelled boxes Request ·
   Stream · With beside them — and the list card's own head ("Open requests 3
   oldest waiting first") are REVERSED: the list head stands under the page's
   head (js/views/listhead.js), the box to search or ask in, the views as tabs,
   then the chips (+ Filter offers Stream and With, a value only where it gives
   rows) with Columns at the end; the card's words are the tabs' hovers; the
   foot is "1–3 of 3". */
describe('f797 (1) the list head: the box, the tabs, + Filter', () => {
  test('1a the box under the page head, the tabs under it, Stream and With only under + Filter; no labelled band, no card head', () => {
    const { win, d } = world(); win.renderIntake();
    const head = d.querySelector('.ik-ins > [data-lh-seat="intake"].sap-band.ph-foot');
    assert.ok(head, 'the list head, the head card\'s lower half');
    assert.deepEqual([...head.children].map(e => e.className.split(' ')[0]), ['lh-ask', 'reg-views', 'lh-chips'], 'the box, the tabs, the chips');
    const box = head.querySelector('input#ik-q[type="search"][data-lh-q][data-ik-q]');
    assert.ok(box, 'the box keeps the page\'s own id and attribute');
    /* RE-POINTED 29 Oct 2026 (owner: "AI questions should only go to the jambo panel"): the box only searches */
    assert.equal(box.getAttribute('placeholder'), 'Search 3 requests');
    const groups = [...head.querySelectorAll('[data-lh-add] optgroup')];
    assert.deepEqual(groups.map(g => g.getAttribute('label')), ['Stream', 'With']);
    assert.deepEqual([...groups[0].querySelectorAll('option')].map(txt), ['Sales (2)', 'Procurement (1)'], 'the streams that hold a request, counted');
    assert.deepEqual([...groups[1].querySelectorAll('option')].map(txt), ['You (1)', 'Nobody yet (1)', 'A colleague (1)'], 'With: never "Anyone"');
    assert.equal(head.querySelectorAll('.lh-chip').length, 0, 'a filter is drawn only once it is added');
    assert.ok(!d.querySelector('.ik-tabbar, .ik-fb, .ik-fb-l, .ins-cardhead, select[data-ik-f]'), 'round 20\'s band and the list card\'s head are gone');
    assert.ok(!groups.some(g => g.getAttribute('label') === 'How it is handled'), 'How it is handled is a column, not a filter');
    assert.ok(head.querySelector('.lh-chips [data-lc-btn="intake"]'), 'Columns at the chip row\'s end');
  });
  test('1b the tab says "Finished" (left out while it holds nothing); the asker has the box and no filter', () => {
    const { win, d } = world(); win.renderIntake();
    assert.equal(win.ikTabViews(false).find(t => t.k === 'fin').label, 'Finished');
    assert.equal(d.querySelector('[data-lh-seat="intake"] [data-ik-view="fin"]'), null, 'nothing finished this month: no tab');
    win.ikFilters().view = 'fin'; win.renderIntake();
    assert.equal(d.querySelector('[data-lh-seat="intake"] [data-ik-view="fin"]').firstChild.textContent, 'Finished', 'lit, it stands');
    win.ikFilters().view = 'open';
    const a = world({ asker: true, list: [] }); a.win.renderIntake();
    const h = a.d.querySelector('[data-lh-seat="intake"]');
    assert.ok(h && h.querySelector('input[data-lh-q][data-ik-q]') && !h.querySelector('[data-lh-add], select'), 'the asker: the box, no filter');
  });
});

describe('f797 (2) oldest waiting first', () => {
  test('2a the Open list leads with the longest wait, and its tab says so on hover, counted', () => {
    const { win, d } = world(); win.renderIntake();
    assert.deepEqual(rowIds(d), ['REQ-1039', 'REQ-1037', 'REQ-1042']);
    const t = d.querySelector('[data-lh-seat="intake"] [data-ik-view="open"]');
    assert.equal(t.getAttribute('title'), 'Open requests · oldest waiting first');
    assert.equal(txt(t.querySelector('.n')), '3', 'the count on its tab');
  });
  test('2b every other list newest first', () => {
    const { win, d } = world(); win.ikFilters().view = 'all'; win.renderIntake();
    assert.deepEqual(rowIds(d), ['REQ-1042', 'REQ-1037', 'REQ-1039']);
    assert.match(d.querySelector('[data-lh-seat="intake"] [data-ik-view="all"]').getAttribute('title'), /newest first$/);
    win.ikFilters().view = 'open';
  });
  test('2c the foot: "1–3 of 3", a live status; a filter that narrows counts the rows behind it', () => {
    const { win, d } = world(); win.renderIntake();
    assert.equal(txt(d.querySelector('[data-ik-foot] [data-lh-foot="intake"][role="status"]')), '1–3 of 3');
    win.ikFilters().who = 'me'; win.renderIntake();
    assert.equal(txt(d.querySelector('[data-ik-foot]')), '1–1 of 1');
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
    /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): nothing chosen, his words are the Overview's head and quiet lines (.jov-head), its source line .jov-src, his chips the offers under "Ask me" (.jov-lnk.is-ask), each verb first with a capital as drawn */
    assert.equal(txt(p.querySelector('.jov-head')), '3 open requests. 1 nobody holds yet, asked 4 days ago. 1 is with you.');
    assert.match(txt(p.querySelector('.jov-src')), /no Jambo call/);
    assert.deepEqual([...p.querySelectorAll('.jov-lnk.is-ask')].map(txt), ['The ones nobody holds', 'Ask for a contract']);
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
    /* re-pointed 21 Oct 2026 (Part 8): the tabs stand in the list head, round 20's band is gone */
    assert.ok(b.d.querySelector('[data-lh-seat="intake"] [data-ik-view="all"].is-on, [data-lh-seat="intake"] [data-ik-view="all"][aria-selected="true"], [data-lh-seat="intake"] [data-ik-view="all"][aria-current]'), 'the All tab lit');
    assert.ok(b.d.querySelector('[data-lh-seat="intake"] .lh-chip[data-lh-chip="folder"]'), 'the Stream filter back as its chip');
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
  /* re-pointed 21 Oct 2026 (Part 8): the tabs stand in the list head; a tab
     with no rows is left out, and reads as 0 here */
  const tabN = (d, k) => { const n = d.querySelector(`[data-lh-seat="intake"] [data-ik-view="${k}"] .n`); return n && !n.hidden ? Number(n.textContent) : 0; };
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
    /* RE-POINTED 28 Oct 2026 (THE LIST LANGUAGE): "Nobody yet" is a reading with its amber dot */
    assert.equal(txt(row('AR-101').querySelector('.ik-with .ls-word-v') || row('AR-101').querySelector('.ik-with .ins-nobody')), 'Nobody yet');
    assert.equal(txt(row('AR-102').querySelector('.ik-with')), 'Wanjiru Kamau');
  });
  test('11e Jambo counts the advice nobody holds among those nobody holds', () => {
    const x = withAdv(); x.win.renderIntake();
    x.win.insLetGo('intake:team'); x.win.renderIntake();
    /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): nothing chosen, his words are the Overview's head and quiet lines (.jov-head), its source line .jov-src, his chips the offers under "Ask me" (.jov-lnk.is-ask), each verb first with a capital as drawn */
    const say = txt(x.d.querySelector('#ins-panel .jov-head'));
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

/* PART 8, THE LEGORA WAY (21 Oct 2026): the list head's presses end in this
   page's own writers. At c70f4b09 (before Requests took the head) every test
   here FAILS. */
describe('f797 (14) the list head\'s presses are the page\'s own', () => {
  const box = d => d.querySelector('[data-lh-seat="intake"] input[data-lh-q]');
  const tabN = (d, k) => { const n = d.querySelector(`[data-lh-seat="intake"] [data-ik-view="${k}"] .n`); return n ? Number(n.textContent) : 0; };
  test('14a words typed repaint the rows and the foot, never the box; the tabs follow on the recount', () => {
    const { win, d } = world(); win.renderIntake();
    const b = box(d);
    win.LH_PAGES.intake.setQuery('uganda');
    assert.equal(box(d), b, 'the same box stands (the caret stays in it)');
    assert.deepEqual(rowIds(d), ['REQ-1039']);
    assert.equal(txt(d.querySelector('[data-ik-foot]')), '1–1 of 1');
    assert.equal(win.ikFilters().q, 'uganda', 'the page\'s own kept words');
    win.lhHeadSync('intake');
    assert.equal(tabN(d, 'open'), 1, 'the Open tab counts what it shows');
    assert.equal(box(d), b, 'and the recount leaves the box too');
  });
  test('14b a tab, a filter added and its × write the page\'s own keys', () => {
    const { win, d } = world(); win.renderIntake();
    const pg = win.LH_PAGES.intake;
    pg.tab('all');
    assert.equal(win.ikFilters().view, 'all');
    assert.ok(d.querySelector('[data-lh-seat="intake"] [data-ik-view="all"].on'));
    pg.apply({ who: 'nobody' });
    assert.equal(win.ikFilters().who, 'nobody');
    assert.deepEqual(rowIds(d), ['REQ-1039']);
    assert.equal(txt(d.querySelector('[data-lh-seat="intake"] .lh-chip[data-lh-chip="who"] label > b')), 'Nobody yet', 'the chip says the value');
    pg.apply({ who: 'all' });
    assert.equal(d.querySelector('[data-lh-seat="intake"] .lh-chip'), null, '× puts it back at rest');
    assert.equal(rowIds(d).length, 3);
  });
  /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE): the reference rides the grey line, so Request alone stands first */
  test('14c Columns hides a column, its head and its cells; Request always stands', () => {
    const { win, d } = world(); win.renderIntake();
    win.lcSave('intake', { order: ['kind', 'road', 'with', 'files', 'asked', 'promised'], hidden: ['kind'] });
    win.renderIntake();
    const heads = [...d.querySelectorAll('.ik-lt thead th')].map(txt);
    assert.deepEqual(heads, ['Request', 'How it is handled', 'With', 'Files', 'Asked', 'Promised by']);
    assert.equal(d.querySelector('.ik-lt [data-ik-row]').children.length, 6, 'one cell less a row');
    assert.equal(d.querySelectorAll('.ik-lt colgroup col').length, 6);
    win.lcSave('intake', null);
  });
  test('14d the asker\'s Advice tab is a door to the advice desk, kept at zero, and a press goes there', () => {
    const a = world({ asker: true });
    const went = [];
    a.win.setView = v => went.push(v);
    a.win.renderIntake();
    const t = a.d.querySelector('[data-lh-seat="intake"] [data-ik-view="advice"]');
    assert.ok(t, 'no advice open: the door still stands');
    a.win.LH_PAGES.intake.tab('advice');
    assert.deepEqual(went, ['advice']);
    assert.equal(a.win.ikFilters().view, 'open', 'the list\'s own view is left as it was');
  });
  test('14e the door\'s beat counts the head again only where a number moved', () => {
    const { win, d } = world(); win.renderIntake();
    const row = d.querySelector('[data-lh-seat="intake"] [role="tablist"]');
    win.rqPaintKindCounts();
    assert.equal(d.querySelector('[data-lh-seat="intake"] [role="tablist"]'), row, 'nothing moved: the row stands');
    win._intakeState.list.push({ id: 'REQ-2001', title: 'One more', need: 'x', folder: 'sales', status: 'open', createdAt: at(0), by: { id: 'u8', name: 'Achieng' } });
    win.rqPaintKindCounts();
    assert.equal(tabN(d, 'open'), 4, 'a new request: the Open tab counts it');
  });
});
