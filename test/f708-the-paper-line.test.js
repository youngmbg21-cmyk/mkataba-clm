'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f708 — THE PAPER'S LINE, "ONE LINE" (round 6 of the redesign: the owner
   picked "One line" by name and answered "No" to the ⋯ coming back, "since all
   those features should be covered in the menu tab", 17 Oct 2026)
   (1) Who and what: the number, the name, the other party, the code-name mark
       (an insider's), the stage as the house's pill with its round — the round
       read RAW, never through negoRound, which would make a negotiation.
   (2) Who is on it now: presence's slot on Home's line, the beat started while
       the paper is up and the row painted at once.
   (3) The paper's own acts: Notes says its word (same door, id and dot); no ⋯
       and no "‹ Contracts" — the way back is the frame's desk tabs.
   AT THE PARENT (edde23e) every test here FAILS but 3c, a control.
   The browser half: test/chromium/paper-line-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IG = R('js/views/intelligence.js');
const CORE = R('js/core.js');
const CT = R('js/views/contract.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

function stage(){
  const ctx = {
    i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), igEsc: x => String(x == null ? '' : x).replace(/</g, '&lt;'),
    icon: n => '<svg data-i="' + n + '"></svg>',
    contractStatusTextHtml: (c, more) => '<span class="room-stat">' + c.status + (more ? ' · ' + more : '') + '</span>',
  };
  const src = fnBody(IG, 'igLineRound') + '\n' + fnBody(IG, 'igLineIdHtml');
  vm.createContext(ctx); vm.runInContext(src, ctx);
  return ctx;
}

describe('f708 (1) who and what', () => {
  /* RE-POINTED 21 Oct 2026 (owner: "remove reference to the customer but keep the type of contract"): the party is the bar's */
  test('1a the number, the kind of contract, no party, the stage pill', () => {
    const ctx = stage();
    assert.equal(typeof ctx.igLineIdHtml, 'function', 'igLineIdHtml exists');
    const html = ctx.igLineIdHtml({ name: 'Master services agreement', counterparty: 'Nordvik Logistik AB', status: 'Draft' }, 'MK-0382');
    /* RE-POINTED 23 Oct 2026 (owner: "yes" to taking the ref off the line — the bar carries it) */
    assert.match(html, /<span class="ig-line-t">Master services agreement<\/span><\/span>/);
    assert.ok(!/hati-ref/.test(html), 'no ref on the line');
    assert.ok(!/ig-line-p/.test(html), 'no party on the line');
    ctx.bsShortName = c => String(c.name).replace(/\s+—\s+Nordvik Logistik AB$/, '');
    assert.match(ctx.igLineIdHtml({ name: 'Master services agreement — Nordvik Logistik AB', counterparty: 'Nordvik Logistik AB', status: 'Draft' }, 'MK-0382'), /<span class="ig-line-t">Master services agreement<\/span>/, 'a name that ends in the party loses it on the line');
    assert.match(html, /<span class="ig-line-st"><span class="room-stat">Draft<\/span><\/span>/);
    assert.ok(!/ig-line-cn/.test(html), 'no code name, no mark');
  });
  test('1b the round rides the pill only while it is negotiated, read raw', () => {
    const ctx = stage();
    const neg = { name: 'X', status: 'Under Review', negotiation: { round: 2 } };
    assert.match(ctx.igLineIdHtml(neg, 'MK-1'), /room-stat">Under Review · ig_line_round\[2\]</);
    assert.equal(ctx.igLineRound({ status: 'Signed', negotiation: { round: 3 } }), 0, 'signed: the round is history, not the stage');
    assert.equal(ctx.igLineRound({ status: 'Under Review' }), 0, 'no negotiation: no round');
    assert.equal(ctx.igLineRound({ status: 'Under Review', negotiation: { round: 0 } }), 0);
    const c = { status: 'Under Review', negotiation: { round: 2 } }; const before = JSON.stringify(c);
    ctx.igLineIdHtml(c, 'MK-1'); assert.equal(JSON.stringify(c), before, 'reading writes nothing');
    assert.ok(!/negoRound|negoInit/.test(fnBody(IG, 'igLineRound') + fnBody(IG, 'igLineIdHtml')), 'never negoRound, which would make one');
  });
  test('1c an insider\'s line carries the code-name mark, its whole sentence on the hover', () => {
    const html = stage().igLineIdHtml({ name: 'Distribution agreement', counterparty: 'Arktis', status: 'Draft', _codeName: { code: 'Project Falcon' } }, 'MK-0412');
    assert.match(html, /<span class="ig-line-cn" title="ig_line_cn_title\[Project Falcon,MK-0412\]"><svg data-i="lock"><\/svg>Project Falcon<\/span>/);
  });
  test('1d the house pill takes a word after the stage, one pill', () => {
    assert.match(CORE, /const contractStatusTextHtml = \(c, more\) => \{/);
    assert.match(CORE, /\$\{more \? ` \\u00b7 \$\{_holdEsc\(more\)\}` : ''\}<\/span>`;/);
  });
});

describe('f708 (2) who is on it now', () => {
  test('2a the line has presence\'s slot, and the paper starts the beat and paints the row', () => {
    assert.match(fnBody(IG, 'igStripHtml'), /\$\{onHome\?'<span class="ig-line-faces" data-pz-slot="paper"><\/span>':''\}/);
    const p = fnBody(IG, 'igPaintPaper');
    assert.match(p, /if\(homePaper===true\)\{ if\(typeof window\.pdPresenceOn==='function'\) pdPresenceOn\(c\);[\s\S]{0,120}presencePaint\(c\.id\)/);
  });
});

describe('f708 (3) the paper\'s own acts', () => {
  /* RE-POINTED 29 Oct 2026 (round 13 "The Legora way", owner's yes): Notes LEFT the line; the door's builder stays (the room by name draws it) */
  test('3a Notes left the line; the door\'s builder keeps its id and dot for the room', () => {
    assert.doesNotMatch(fnBody(IG, 'igStripActsHtml'), /roomChatDoorHtml/);
    const b = fnBody(CT, 'roomChatDoorHtml');
    assert.match(b, /id="hdr-chat" class="\$\{word\?'ui-btn ui-btn-sm room-chat ig-notes':'room-check room-chat'\}"/);
    assert.match(b, /<span class="ig-notes-w">\$\{esc\(i18t\('ig_line_notes'\)\)\}<\/span>/);
    assert.match(b, /id="hdr-chat-dot" class="room-badge" hidden/, 'the same dot');
  });
  test('3b no ⋯ and no "‹ Contracts" on the line', () => {
    const s = fnBody(IG, 'igStripHtml') + fnBody(IG, 'igStripActsHtml');
    assert.ok(!/data-ig-pick-again>/.test(s), 'the way back is the frame\'s');
    assert.ok(!/id="ws-more"|ig-more-btn/.test(s), 'the ⋯ rows are the Menu tab\'s');
  });
  test('3c [control] the Menu tab keeps the ⋯ rows', () => {
    assert.match(R('js/paperdesk.js'), /function pdMenuHtml\(/);
  });
  test('3d the new words, in both books', () => {
    for (const k of ['ig_line_round', 'ig_line_notes', 'ig_line_cn_title', 'brn_p_paperline', 'brn_pd_paperline'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
