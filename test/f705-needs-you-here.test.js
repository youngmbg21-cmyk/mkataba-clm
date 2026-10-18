'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f705 — JAMBO'S PANEL, "TABS AND FACES" (round 3 of the redesign: the owner
   picked "Tabs and faces" by name, 17 Oct 2026)
   (1) With a contract on Home's paper, Jambo's tab opens on NEEDS YOU HERE:
       this contract's prepared work first (hbAgentsData, the Counter's own
       reading, only the pieces on THIS contract), then the checklist's own
       items (needsYouOf), each row its one door (hbOpenAgent · needsYouGo).
       Its "All N" is the Counter's own number (counterNeedsCount) and opens
       the Counter. Nothing owed here: no card.
   (2) The two cards never say the same thing twice: the details still owed
       stay the glance's own row (where they tick off when filled in, the
       owner's "Alive"), so Needs you here leaves the checklist's 'details'
       item to it.
   (3) Every face's head opens with "‹ Jambo" (pdBackHtml), its × kept at the
       end; both close the face through its own close. The Redlines face's
       column takes it at the start of its head (opts.headStart); the
       Negotiate page passes nothing.
   (4) His tab carries the Counter's number beside a paper; the folded strip
       carries his face and the same count. The strip names no face (the
       owner's "No").
   (5) Reading writes nothing; the words are in both books.
   AT THE PARENT (4d152c2) every test here FAILS: pdNeedsRows, pdNeedsHtml,
   pdBackHtml and PD_BACK_CLOSE do not exist there, no face head draws a way
   back, the column has no headStart and the folded strip draws a sparkle.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const PD = R('js/paperdesk.js');
const IG = R('js/views/intelligence.js');
const NG = R('js/views/negotiation.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); const k = src.indexOf('\nasync function ', i + 10);
  const e = [j, k].filter(x => x > 0); return src.slice(i, e.length ? Math.min(...e) : undefined); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();

/* the panel in its own realm: one contract on the paper, the house's readings stubbed and counted */
function pdStage({ work = [], needs = [], left = 0, all = 7, paper = 'MK-1', counter = true } = {}){
  const c = { id: 'MK-1', contractNo: 'MK-1', counterparty: 'Nordvik Logistik AB', folder: 'proc', status: 'Under Review' };
  const pressed = [];
  const ctx = {
    intel: { paper: paper ? { id: paper } : null, dockOpen: true }, state: { view: 'dashboard' },
    getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
    i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), i18tn: (k, n) => k + ':' + n,
    igHomePaperFace: () => !!paper, hbFace: () => 'paper', canEdit: () => true, mayReFile: () => true, PORTAL_MODE: false,
    detailsOf: () => ({ left, all: 4, live: true, items: [] }),
    signBlockers: () => [], negoMayStartLine: () => '', contractStatusTextHtml: () => '<span class="room-stat">In review</span>',
    hbAgentsData: () => ({ ready: work.length, rows: work.length ? [{ k: 'round', items: work }] : [] }),
    needsYouOf: () => needs.slice(),
    insNeedWords: (cc, it) => ({ title: 'title:' + it.kind, sub: '<span class="late">sub:' + it.kind + '</span>', plain: 'sub:' + it.kind }),
    INS_NEED_VERB: { quiet: 'home_verb_answer', details: 'det_need_verb', note: 'home_verb_answer' },
    jamboFaceHtml: () => '<img class="jf" alt="">',
    hbOpenAgent: (k, key) => pressed.push(['agent', k, key]),
    needsYouGo: (kind, id) => pressed.push(['go', kind, id]),
    deskGoCounter: () => pressed.push(['counter']),
    renderIntelDock: () => {}, setTimeout: () => 0,
  };
  if (counter) ctx.counterNeedsCount = () => all;
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(PD, ctx);
  return { ctx, c, pressed };
}

describe('f705 (1) needs you here, on Jambo\'s tab beside a paper', () => {
  test('1a this contract\'s prepared work first, then the checklist\'s items; other contracts\' pieces are not here', () => {
    const { ctx, c } = pdStage({
      work: [{ cid: 'MK-1', key: 'round:MK-1', sum: '2 changes', urg: 'Arrived today' }, { cid: 'MK-2', key: 'round:MK-2', sum: 'other' }],
      needs: [{ kind: 'quiet', urgent: true, n: 2 }, { kind: 'note', urgent: false, n: 1 }] });
    const rows = J(ctx.pdNeedsRows(c));
    assert.equal(rows.length, 3, 'one piece on this contract + two owed items');
    assert.deepEqual(rows[0], { jw: true, k: 'round', key: 'round:MK-1', sum: '2 changes', urg: 'Arrived today' });
    assert.deepEqual(rows.slice(1).map(r => r.it.kind), ['quiet', 'note'], 'the checklist\'s own order');
  });
  test('1b the card: its name, how many, "All N" from the Counter\'s own number, each row its one door', () => {
    const { ctx, c } = pdStage({ work: [{ cid: 'MK-1', key: 'round:MK-1', sum: '2 changes' }], needs: [{ kind: 'quiet', urgent: true, n: 2 }], all: 7 });
    const html = ctx.pdNeedsHtml(c);
    assert.match(html, /id="pd-needs"[^>]*data-pd-needs-for="MK-1"/);
    assert.match(html, /pd_nd_title[\s\S]*class="pd-pill is-quiet"><i><\/i>2</, 'two rows, said once in the head');
    assert.match(html, /data-pd-nd-all[^>]*>pd_nd_all\[7\]/, 'All 7 — the Counter\'s own number');
    assert.match(html, /is-jw[\s\S]*cn_jw · ag_round[\s\S]*data-pd-nd-jw="round" data-pd-nd-key="round:MK-1">pd_nd_see</);
    assert.match(html, /is-hot" data-pd-nd-kind="quiet"[\s\S]*title:quiet[\s\S]*<span class="late">sub:quiet<\/span>[\s\S]*data-pd-nd="quiet" data-pd-nd-id="MK-1">home_verb_answer</);
    assert.ok(html.indexOf('data-pd-nd-jw') < html.indexOf('data-pd-nd="quiet"'), 'Jambo\'s work leads');
  });
  test('1c nothing owed here: no card at all', () => {
    const { ctx, c } = pdStage();
    assert.equal(ctx.pdNeedsHtml(c), '');
  });
  test('1d no Counter to count against: the rows stand, the "All" door is not drawn', () => {
    const { ctx, c } = pdStage({ needs: [{ kind: 'note', n: 1 }], counter: false });
    const html = ctx.pdNeedsHtml(c);
    assert.match(html, /data-pd-nd="note"/); assert.ok(!/data-pd-nd-all/.test(html));
  });
  test('1e on the paper, the tab opens on Needs you here, then the glance', () => {
    const { ctx } = pdStage({ needs: [{ kind: 'note', n: 1 }] });
    const top = ctx.pdJamboTopHtml();
    assert.ok(top.indexOf('id="pd-needs"') >= 0 && top.indexOf('id="pd-needs"') < top.indexOf('id="pd-glance"'));
    const wall = pdStage({ paper: null, needs: [{ kind: 'note', n: 1 }] });
    assert.ok(!/id="pd-needs"/.test(wall.ctx.pdJamboTopHtml()), 'the wall draws no contract\'s card');
  });
  test('1f the presses: a piece opens on Jambo\'s work, an item through needsYouGo, All on the Counter', () => {
    const w = fnBody(PD, 'pdNeedRowHtml');
    assert.match(w, /data-pd-nd-jw=/); assert.match(w, /data-pd-nd=/);
    const wiring = PD.slice(PD.indexOf('document._pdJamboTopWired = true'), PD.indexOf('JAMBO, ALIVE'));
    assert.match(wiring, /\[data-pd-nd-all\][\s\S]*deskGoCounter\(\)/);
    assert.match(wiring, /\[data-pd-nd-jw\][\s\S]*hbOpenAgent\(jw\.getAttribute\('data-pd-nd-jw'\), jw\.getAttribute\('data-pd-nd-key'\)/);
    assert.match(wiring, /\[data-pd-nd\][\s\S]*needsYouGo\(nd\.getAttribute\('data-pd-nd'\), nd\.getAttribute\('data-pd-nd-id'\)\)/);
    assert.match(fnBody(PD, 'pdChipsRepaint'), /pdNeedsRepaint\(\);\s*pdGlanceRepaint\(\)/, 'kept current in place with the glance');
  });
});

describe('f705 (2) the two cards do not say it twice', () => {
  test('2a details owed stay the glance\'s row; Needs you here leaves them to it', () => {
    const { ctx, c } = pdStage({ left: 3, needs: [{ kind: 'details', n: 3 }, { kind: 'note', n: 1 }] });
    assert.deepEqual(J(ctx.pdNeedsRows(c)).map(r => r.it.kind), ['note'], 'the checklist\'s details item is not drawn here');
    assert.match(ctx.pdGlanceHtml(c), /data-pd-glance="fill"/, 'the glance still says it, with its own Fill in');
    assert.equal(pdStage({ left: 3, needs: [{ kind: 'details', n: 3 }] }).ctx.pdNeedsHtml(c), '', 'details alone: no card, the glance says it');
  });
});

describe('f705 (3) the way back to Jambo on every face', () => {
  test('3a one builder, the face\'s own close', () => {
    const { ctx } = pdStage();
    const h = ctx.pdBackHtml('red');
    assert.match(h, /class="pd-back" data-pd-back="red" title="pd_back_jambo" aria-label="pd_back_jambo"/);
    assert.match(h, /#i-left[\s\S]*pd_tab_copilot<\/button>$/, '‹ and his name');
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, "The letter" as drawn): the
       send screen is a face of the panel too ("Before you send"), and its way
       back is the screen's own Cancel, asked through its guard. */
    assert.deepEqual(Object.keys(ctx.PD_BACK_CLOSE).sort(), ['amend', 'fill', 'red', 'send', 'signing']);
    for (const f of ctx.PD_FACE_WORDS) assert.ok(Object.keys(ctx.PD_BACK_CLOSE).includes(f), 'every face has its way back: ' + f);
    const map = PD.slice(PD.indexOf('const PD_BACK_CLOSE'), PD.indexOf('function pdBackHtml'));
    for (const [k, fn] of [['fill', 'pdFillClose'], ['red', 'pdRedClose'], ['signing', 'pdSignClose'], ['amend', 'pdAmendClose']])
      assert.match(map, new RegExp(k + ': \\(\\) => ' + fn + '\\(\\)'), k + ' closes through ' + fn);
    assert.match(map, /send: \(\) => \{[^}]*closeModalGuarded\(\)/, 'send closes through the screen\'s own guarded close');
    const wiring = PD.slice(PD.indexOf('document._pdJamboTopWired = true'), PD.indexOf('JAMBO, ALIVE'));
    assert.match(wiring, /closest\('\[data-pd-back\]'\)[\s\S]*PD_BACK_CLOSE\[back\.getAttribute\('data-pd-back'\)\]/);
  });
  /* RE-POINTED 18 Oct 2026 (the gaps of rounds 8–11 as drawn: the panel's
     row while a face is up reads Jambo's tab, the face's word, "‹ Jambo" at
     its end — and no ×): ‹ Jambo moved from each face's head into the panel's
     own row (pdFaceBackHtml, drawn by renderIntelDock's head), ONE builder for
     every face; the faces' heads draw neither it nor ×. */
  test('3b the panel\'s row carries it for every face; the faces\' heads draw neither it nor ×', () => {
    for (const [fn, face, x] of [['pdFillHeadHtml', 'fill', 'data-pd-ff-close'], ['pdSignHeadHtml', 'signing', 'data-pd-sf-close'], ['pdAmendHeadHtml', 'amend', 'data-pd-am-close']]){
      const b = fnBody(PD, fn);
      assert.ok(b.indexOf(`pdBackHtml('${face}')`) < 0 && b.indexOf(x) < 0 && b.indexOf('<h3>') > 0, fn + ': the title alone');
    }
    assert.doesNotMatch(fnBody(PD, 'pdRedOpts'), /headStart|headEnd/, 'the Redlines face passes no ‹ Jambo and no ×');
    assert.match(fnBody(PD, 'pdFaceBackHtml'), /pdBackHtml\(f\)/, 'one builder for whichever face is up');
    assert.match(IG.slice(IG.indexOf('function renderIntelDock(')), /pdFaceBackHtml\(\)/, 'drawn in the panel\'s own row');
    const head = NG.slice(NG.indexOf('<div class="rl-idx-top">'), NG.indexOf("${opts.headEnd || ''}"));
    assert.ok(head.indexOf("${opts.headStart || ''}") > 0 && head.indexOf("${opts.headStart || ''}") < head.indexOf('<span class="rl-idx-title">'),
      'the column\'s head takes the host\'s start before its name; the Negotiate page passes none');
  });
});

describe('f705 (4) his face and his count', () => {
  test('4a beside a paper his tab carries the Counter\'s number; off the paper, the Board\'s rule stands', () => {
    const { ctx, c } = pdStage({ all: 7 });
    assert.deepEqual(J(ctx.pdTabCount('copilot', c)), { n: 7, tone: 'warn' });
    assert.equal(pdStage({ all: 0 }).ctx.pdTabCount('copilot', c), null, 'nothing waiting: no count');
    const off = pdStage({ paper: null, all: 7 });
    assert.equal(off.ctx.pdTabCount('copilot', off.c), null, 'not on Home\'s paper: no count from here');
  });
  test('4b the folded strip: his face, the same count, the door\'s words, and no face named', () => {
    const at = IG.indexOf('if(!intel.dockOpen){', IG.indexOf('function renderIntelDock('));
    const fold = IG.slice(at, IG.indexOf("document.getElementById('igd-expand').addEventListener", at));
    assert.ok(at > 0 && fold.length < 3000, 'the folded strip\'s own lines');
    assert.match(fold, /pdTabCount\('copilot'/, 'the count his tab carries');
    assert.match(fold, /jamboFaceHtml\('hello',28,'igd-door-face'\)/, 'his face');
    assert.match(fold, /i18t\('int_copilot_panel'\)/, 'the door\'s own words');
    assert.ok(!/pdFaceNow|pdRedShows|pdFillShows|pdSignShows/.test(fold), 'the strip names no open face');
  });
});

describe('f705 (5) reading writes nothing, and both books speak', () => {
  test('5a the card reads and writes nothing', () => {
    const { ctx, c } = pdStage({ work: [{ cid: 'MK-1', key: 'k' }], needs: [{ kind: 'note', n: 1 }] });
    const before = JSON.stringify(c);
    ctx.pdNeedsHtml(c); ctx.pdNeedsRows(c);
    assert.equal(JSON.stringify(c), before);
  });
  test('5b the new words, in English and Svenska', () => {
    for (const k of ['pd_nd_title', 'pd_nd_all', 'pd_nd_all_tip', 'pd_nd_see', 'pd_back_jambo'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    assert.match(BOOKS.en.pd_nd_all, /\{n\}/); assert.match(BOOKS.sv.pd_nd_all, /\{n\}/);
  });
});
