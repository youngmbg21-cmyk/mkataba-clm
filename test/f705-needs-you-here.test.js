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
    /* round 3 as drawn (18 Oct 2026): their waiting redlines open with "Open redlines" */
    assert.match(html, /is-hot" data-pd-nd-kind="quiet"[\s\S]*title:quiet[\s\S]*<span class="late">sub:quiet<\/span>[\s\S]*data-pd-nd="quiet" data-pd-nd-id="MK-1">pd_nd_open_red</);
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
  /* RE-POINTED 18 Oct 2026 (round 3's Compare: "what needs you comes first
     and stays at the top of the Jambo tab"): Needs you here is PINNED above
     the conversation (pdJamboPinHtml), so it never scrolls away; the glance
     opens the conversation under it */
  test('1e on the paper, the tab opens on the dossier: Still owed is its own card, nothing pinned above it', () => {
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): Needs you here's
       rows are the dossier's Still owed card, under the spine and What Jambo
       read — one list, so the pin above the conversation is retired */
    const { ctx } = pdStage({ needs: [{ kind: 'note', n: 1 }] });
    assert.equal(ctx.pdJamboPinHtml(), '', 'nothing is pinned above the dossier');
    const top = ctx.pdJamboTopHtml();
    assert.match(top, /id="pd-glance"/);
    /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): the stage, then Needs you, then Jambo read */
    assert.ok(top.indexOf('class="ds-spine') < top.indexOf('id="pd-needs"') && top.indexOf('id="pd-needs"') < top.indexOf('data-pd-ds-card="read"'), 'stage, then Needs you, then Jambo read');
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
    /* RE-POINTED 20 Oct 2026: the dossier's Still owed says each empty box, with Fill in › onto that box */
    assert.match(ctx.pdGlanceHtml(c), /data-pd-ds-fill=/, 'Still owed says it, with its own Fill in');
    assert.equal(pdStage({ left: 3, needs: [{ kind: 'details', n: 3 }] }).ctx.pdNeedsHtml(c), '', 'details alone: no card, the glance says it');
  });
});

describe('f705 (3) the way back to Jambo on every face', () => {
  test('3a one builder, the face\'s own close', () => {
    const { ctx } = pdStage();
    const h = ctx.pdBackHtml('red');
    /* RE-POINTED 19 Oct 2026 — JAMBO AS A TAB YOU FLIP TO (owner: "the first
       tab beside a contract is renamed Overview"; "Jambo" names only the
       conversation): the faces' back says "‹ Overview" */
    assert.match(h, /class="pd-back" data-pd-back="red" title="pd_trail_back[^"]*" aria-label="pd_trail_back[^"]*"/);
    /* RE-POINTED 20 Oct 2026: beside a paper the first tab is the Dossier */
    assert.match(h, /#i-left[\s\S]*pd_tab_dossier<\/button>$/, '‹ and the first tab\'s name');
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, "The letter" as drawn): the
       send screen is a face of the panel too ("Before you send"), and its way
       back is the screen's own Cancel, asked through its guard. */
    /* RE-POINTED 19 Oct 2026 (ONE TRAIL): two steps inside Redlines — the
       notes and the ladder the column turned to — go back to the piles */
    /* RE-POINTED 19 Oct 2026 (JAMBO AS A TAB YOU FLIP TO): the conversation
       the panel flips to has its one back too, to the landing as left */
    assert.deepEqual(Object.keys(ctx.PD_BACK_CLOSE).sort(), ['amend', 'fill', 'red', 'red-ladder', 'red-notes', 'send', 'signing', 'talk']);
    for (const f of ctx.PD_FACE_WORDS) assert.ok(Object.keys(ctx.PD_BACK_CLOSE).includes(f), 'every face has its way back: ' + f);
    const map = PD.slice(PD.indexOf('const PD_BACK_CLOSE'), PD.indexOf('function pdBackHtml'));
    for (const [k, fn] of [['fill', 'pdFillClose'], ['red', 'pdRedClose'], ['signing', 'pdSignClose'], ['amend', 'pdAmendClose']])
      assert.match(map, new RegExp(k + ': \\(\\) => ' + fn + '\\(\\)'), k + ' closes through ' + fn);
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, second pass: "‹ Jambo turns
       the panel back to Jambo's own words"): on the send face ‹ Jambo turns
       the panel and leaves the letter up; Cancel on the letter is the
       screen's own guarded close */
    /* RE-POINTED 19 Oct 2026 (owner: "Before you send's back returns to the
       panel it came from (normally Redlines)"): the letter still waits */
    assert.match(map, /send: \(\) => pdSendAway\(\)/, 'send turns the panel back to the face it came from, the letter stays');
    assert.doesNotMatch(fnBody(PD, 'pdSendAway').replace(/\/\*[\s\S]*?\*\//g, ''), /pdRedClose|pdFillClose|pdSignClose|pdAmendClose/, 'the face under the letter is not put away');
    assert.match(map, /talk: \(\) => pdTalkBack\(\)/, 'the conversation\'s back');
    const wiring = PD.slice(PD.indexOf('document._pdJamboTopWired = true'), PD.indexOf('JAMBO, ALIVE'));
    assert.match(wiring, /closest\('\[data-pd-back\]'\)[\s\S]*PD_BACK_CLOSE\[back\.getAttribute\('data-pd-back'\)\]/);
  });
  /* RE-POINTED AT THE INTEGRATION (19 Oct 2026), by the owner's answer (3)
     ("Fill in and Before you sign keep round 3's face head — ‹ Jambo · name ·
     count · × — not the tab row rounds 8 and 10 draw"): those faces and an
     amendment's open with ‹ Jambo, the title, then ×; only the Redlines face
     (round 9) and Before you send (round 11) carry ‹ Jambo in the panel's own
     row (pdFaceUp → PD_FACE_ROW, pdFaceBackHtml). */
  /* RE-POINTED 19 Oct 2026 — ONE TRAIL (owner): every face's way back is the
     panel's one trail line, never its own head; the column's head still takes
     a host's start (the Negotiate page passes none) */
  test('3b every face: the way back is the trail line, its head carries no ‹ Jambo and no ×', () => {
    for (const fn of ['pdFillHeadHtml', 'pdSignHeadHtml', 'pdAmendHeadHtml'])
      assert.doesNotMatch(fnBody(PD, fn).replace(/\/\*[\s\S]*?\*\//g, ''), /pdBackHtml\(|-close title/, fn);
    assert.doesNotMatch(fnBody(PD, 'pdRedOpts'), /headStart|headEnd/, 'the Redlines face passes no ‹ Jambo and no ×');
    /* RE-POINTED 19 Oct 2026 (JAMBO AS A TAB YOU FLIP TO): THE CLOTHES FOLLOW
       THE BUILDER — Home's trail is the one trail builder every Jambo panel
       draws (jamboTrailHtml, components.js), its back answering data-pd-back */
    assert.match(fnBody(PD, 'pdTrailHtml'), /jamboTrailHtml\(Object\.assign\(\{ attr: 'data-pd-back' \}, t\)/, 'one builder for whichever face is up');
    assert.match(R('js/components.js'), /class="pd-back" \$\{attr\}="\$\{e\(t\.back\)\}"/, 'its back carries the step it takes');
    assert.match(IG.slice(IG.indexOf('function renderIntelDock(')), /pdTrailHtml\(\)/, 'drawn under the panel\'s tabs');
    const head = NG.slice(NG.indexOf('<div class="rl-idx-top">'), NG.indexOf("${opts.headEnd || ''}"));
    assert.ok(head.indexOf("${opts.headStart || ''}") > 0 && head.indexOf("${opts.headStart || ''}") < head.indexOf('<span class="rl-idx-title">'),
      'the column\'s head takes the host\'s start before its name; the Negotiate page passes none');
  });
});

describe('f705 (4) his face and his count', () => {
  /* RE-POINTED 22 Oct 2026 (owner: "1, drawing" — the Checklist as drawn): beside a paper the tab carries
     this contract's own "Needs you N" (dossierOf), never the Counter's whole number */
  test('4a beside a paper his tab carries this contract\'s Needs you number; off the paper, the Board\'s rule stands', () => {
    const { ctx, c } = pdStage({ all: 7, needs: [{ kind: 'quiet', urgent: true, n: 2 }, { kind: 'note', urgent: false, n: 1 }] });
    const want = ctx.dossierOf(c).owedN;
    assert.ok(want > 0 && want !== 7, 'the fixture owes some, not the Counter\'s 7: ' + want);
    assert.deepEqual(J(ctx.pdTabCount('copilot', c)), { n: want, tone: 'warn' });
    assert.equal(pdStage({ all: 7 }).ctx.pdTabCount('copilot', c), null, 'nothing owed on this contract: no count, whatever the Counter holds');
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
