/* f1048 — THE CALM ROUND (owner's yes to each drawing, 14 Nov 2026: "build but do not push"):
     1 the Guide wears a coloured symbol per page, one tone per stage, you-are-here in ink, no hairlines
     2 the Board: Draft agreement ends the head's run and goes through the one draft door; "our paper" leads its links
     3 the New agreement sheet has two tabs; From scratch lives only on Our paper (New standard contract)
     4 Our paper's From scratch says what happens next, and a long sentence still names its paper
     5 Requests, the SAP way with colour: a SAP mark, the stream's chip, a coloured word, one filled button
     6 the Builder: a full bar in balance, the 720 paper, no outline on the clause in hand, short options that wrap,
       the clause named with "‹ All clauses"
     7 the email says what it is, the company on top, and small print that tells the truth about the link
     8 the send screen, the Legora way (replaced the same day by Four steps, f1049)
   At the parent every part fails: none of these names or rules exist there.
   Run: node --test test/f1048-the-calm-round.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CSS = read('index.html');
const body = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}', i) + 2); };

test('f1048 (1) the Guide: a symbol per page, a tone per stage, you are here in ink', () => {
  const A = read('js/app.js');
  assert.match(A, /k:'arrive', tone:'green'/); assert.match(A, /k:'negsign', tone:'amber'/);
  assert.match(A, /k:'live', tone:'steel'/); assert.match(A, /k:'book', tone:'violet'/);
  assert.match(body(A, 'guideNlRowHtml'), /guideNlMarkHtml\(shown\[0\], tone\)/);
  assert.match(body(A, 'guidePanelNlHtml'), /guideNlRowHtml\(hereRow,here,'ink'\)/);
  assert.match(CSS, /html\.lg-new \.gdn-mk\.t-ink\{background:var\(--color-text\);color:var\(--color-surface\)\}/);
  assert.match(CSS, /html\.lg-new \.gdn-r\{display:flex;align-items:center;gap:12px;padding:6px 0\}/, 'no hairline between rows');
});
test('f1048 (2) the Board: Draft agreement after Explorer, through the one door; our paper first above Jambo\'s box', () => {
  const HB = read('js/views/homeboard.js');
  assert.match(HB, /\$\{hbExplorerBtnHtml\(\)\}\$\{hbDraftBtnHtml\(\)\}`/);
  /* green and the size of its neighbours since 14 Nov 2026 (f1049) */
  assert.match(body(HB, 'hbDraftBtnHtml'), /hb-btn is-sm hb-draft-go/);
  assert.match(body(HB, 'hbDraftBtnHtml'), /canEdit\(\)\) return ''/, 'a viewer is not shown a door that refuses');
  assert.match(HB, /on\('\[data-hb-draft\]'\)\)\{ if \(typeof caGo === 'function'\) caGo\(\{ kind: 'go', place: 'draft' \}\)/);
  assert.match(read('js/flowmap.js'), /k: 'board'[\s\S]{0,400}d: \['draft', 'ourpaper', /, 'draft first since 14 Nov 2026, then our paper');
});
test('f1048 (3) New agreement: Our paper and Their paper; From scratch is the third tab only with the right (reversed in f1049)', () => {
  const W = read('js/wizard.js');
  assert.match(W, /\$\{\['ours','theirs'\]\.map\(k=>/);
  assert.doesNotMatch(W, /naScratch/, 'the old From scratch form is not back');
  assert.doesNotMatch(read('js/paperdesk.js'), /naScratchNow/);
  assert.doesNotMatch(CSS, /\.nsc-|#na-scratch/);
});
test('f1048 (4) From scratch on Our paper: what happens next, and a long sentence names its paper', () => {
  const NS = read('js/views/newstandard.js');
  assert.match(body(NS, 'nsOpenScratch'), /i18t\('ns_what_next'\)/);
  const fn = new Function('window', body(NS, 'nsNameFromSentence') + '; return nsNameFromSentence;')({});
  assert.equal(fn('Create a contract we want to build as a company contract for agreements between two parties for leasing us equipment for managing our warehouses'), 'Equipment Lease Agreement');
  assert.equal(fn('Two-year forklift lease'), 'Two-year forklift lease', 'a short sentence is its own name, as before');
  assert.equal(fn('x'.repeat(80)), '', 'nothing read, nothing named');
});
test('f1048 (5) Requests: SAP mark, stream chip, coloured word, the chosen row\'s button filled', () => {
  const R = body(read('js/views/intake.js'), 'iknRowHtml');
  assert.match(R, /listSapCellHtml\(S\.mk, name\)/);
  assert.match(R, /listChipHtml\(typeof listStreamTone === 'function' \? listStreamTone\(r\.folder\)/);
  assert.match(R, /listWordHtml\(S\.tone, word/);
  assert.match(R, /class="ui-btn \$\{sel \? 'ui-btn-primary ' : ''\}ui-btn-sm ikn-go"/);
});
test('f1048 (6) the Builder: full bar, 720 paper, no outline in hand, options wrap, the clause named', () => {
  assert.match(CSS, /html\.lg-new #tb-page \.tb-strip\{box-shadow:none;border-radius:0;/);
  assert.match(CSS, /html\.lg-new #tb-page \.tb-strip #tb-back\{display:none\}/);
  assert.match(CSS, /html\.lg-new #tb-page\{--doc-sheet-max:720px\}/);
  assert.match(CSS, /html\.lg-new #tb-page \.tb-sec\.is-on:focus-within\{outline:none;background:var\(--st-green-bg\)/);
  assert.match(CSS, /html\.lg-new #tb-page \.tb-ed:focus-visible\{outline:none;box-shadow:none\}/);
  assert.match(CSS, /html\.lg-new #tb-page \.tb-chips\{flex-wrap:wrap;overflow:visible\}/);
  const TB = read('js/views/templatebuilder.js');
  assert.match(body(TB, 'tbSecPickHtml'), /data-tb-allsecs/);
  assert.match(TB, /hit\('\[data-tb-allsecs\]'\)\) \{ tbFocus\(null\); return; \}/);
  assert.match(TB, /i18t\('tb_pb_use_ours_short'\)/);
  const I = read('js/i18n.js');
  assert.match(I, /tb_pb_use_ours_short: 'Use ours',/); assert.match(I, /tb_chip_s_mutual: 'Mutual',/); assert.match(I, /tb_chip_s_plain: 'Plainer',/);
});
test('f1048 (7) the email: what it is, the company on top, small print that tells the truth', () => {
  const M = require('../js/sharemail.js');
  const o = { channel: 'email', purpose: 'negotiate', sender: 'Amina Otieno', org: 'Highland Corporate Ltd', cName: 'Refined Sugar Supply',
    recName: 'Wanjiru Kamau', link: 'https://x.test/#share=t:1', round: 1, drawn: true, expires: '2026-11-28T00:00:00Z' };
  const lasting = M.shareMailOf(Object.assign({}, o, { durable: true }));
  assert.match(lasting.body, /Round 1 of the Refined Sugar Supply is ready for you to read\. You can reply with your own changes\./);
  assert.match(lasting.body, /This link is for you\. It stays open for the whole negotiation\. Replies to this email reach Amina Otieno\.$/);
  assert.doesNotMatch(lasting.body, /until/, 'a lasting link is never given an end date');
  const once = M.shareMailOf(o);
  assert.match(once.body, /It stays open until 28 November/);
  assert.match(lasting.html, />Highland Corporate Ltd<\/p>/);
  assert.match(lasting.html, /border-radius:999px/);
  const SRV = read('server/server.js');
  assert.match(SRV, /link, expires, durable: !!isDurable,/); assert.match(SRV, /expires: s\.expires_at, durable: !!s\.durable,/);
});
test('f1048 (8) the send screen: the Legora way was replaced by Four steps the same day (f1049); the lasting link still says so', () => {
  const C = read('js/core.js');
  assert.doesNotMatch(C, /function shareLegoraArrange/, 'the sentence of pills is gone');
  assert.match(C, /durable:!!\(document\.getElementById\('sh-durable'\)\|\|\{\}\)\.checked/);
  assert.doesNotMatch(CSS, /is-legora/);
});
