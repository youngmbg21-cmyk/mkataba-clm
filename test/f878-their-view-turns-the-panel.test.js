/* ============================================================
   f878 — THEIR VIEW TURNS THE PANEL TOO (owner, 25 Oct 2026)
   ============================================================
   "when you press on their view, the paper should show you the
   counterpartys live paper and the panel should show you their redlines
   panel. … it should be uneditable … Their should be a note, not a big
   banner stating its a view only. … the look should be exactly like ours
   but just we cant edit their side."
   (1) the paper's switch on Their view opens Jambo's Redlines face where it
       is not up, and repaints it where it is; leaving it repaints ours;
   (2) the face draws the same column from their seat — the Negotiate page's
       own preview (side 'counterparty': our unsent drafts walled off,
       readonly) — with no notices, no Send;
   (3) one quiet note under the title, in both books; no verbs drawn.
   Measured at the parent (b246ebe): every test here fails.

   Run: node --test test/f878-their-view-turns-the-panel.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnRegion = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return strip(src.slice(i, j < 0 ? undefined : j)); };
const PD = R('js/paperdesk.js'), IG = R('js/views/intelligence.js'), I = R('index.html'), T = R('js/i18n.js');

describe('f878 their view turns the panel', () => {
  test('1 the switch opens or repaints the Redlines face', () => {
    assert.match(IG, /if\(p\.red==='theirs'&&!faceUp&&typeof window\.pdRedOpen==='function'\) pdRedOpen\(p\.id\);/);
    assert.match(IG, /else if\(\(p\.red==='theirs'\)!==was&&faceUp\) renderIntelDock\(\);/);
  });
  test('2 the face draws their seat, read-only, with no notices or Send', () => {
    assert.match(fnRegion(PD, 'pdRedTheirs'), /igTheirsOn\(c\)/);
    const o = fnRegion(PD, 'pdRedOpts');
    assert.match(o, /const side = pdRedTheirs\(c\) \? 'counterparty' : 'owner';/);
    assert.match(o, /rlBenchOpts\(c, \{ side, hostId: 'pd-redface'/);
    assert.match(fnRegion(PD, 'pdRedFaceHtml'), /if \(theirs\)\{ notices = ''; send = ''; \}/);
  });
  test('3 one quiet note under the title, both books; their verbs not drawn', () => {
    assert.match(fnRegion(PD, 'pdRedOpts'), /headNote: pdRedTheirsNoteHtml\(c\)/);
    assert.match(R('js/views/negotiation.js'), /\$\{opts\.headNote \? `<span class="rl-idx-br" aria-hidden="true"><\/span>\$\{opts\.headNote\}` : ''\}/);
    assert.equal((T.match(/^\s+rl_theirs_note: '/gm) || []).length, 2);
    assert.match(I, /#pd-redface \.rl-face\.is-theirs :is\(\.rl-card-verbs, \.rl-card-side\)\{display:none\}/);
  });
});
