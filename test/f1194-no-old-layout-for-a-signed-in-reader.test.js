/* f1194 · NO OLD LAYOUT FOR A SIGNED-IN READER (owner, 23 Nov 2026, on photos of the older pages still showing: "do all
   three and merge"). (1) A narrow window keeps today's design: insFits is true from INS_NARROW_MIN, and Jambo's panel
   stands folded to its strip, opening OVER the page (is-narrow-over) and folding on Esc or a press outside; each page
   arrives folded. (2) A code-named contract chosen on the Wall wears today's frame (regLsFrame) with only what the wall
   card says. (3) The split-second fallbacks wait instead: the sheet's panel says Loading (pdWaitHtml), Fill in the
   contract and the Duties page wait for the middle (pdMidWait; their older places deleted). Fails at the parent. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function |\nconst [A-Z_]+ = /); return src.slice(at, nx > 0 ? at + 10 + nx : src.length); };
const INS = strip(read('js/views/inspector.js')), PD = strip(read('js/paperdesk.js')), OB = strip(read('js/obligations.js'));

test('f1194 (1) a narrow window keeps today\'s design, the panel folded and opening over the page', () => {
  assert.match(INS, /const INS_NARROW_MIN = 720;/);
  assert.match(fnBody(INS, 'insFits'), /if \(insNarrow\(\)\) return true;/);
  assert.match(fnBody(INS, 'insNarrow'), /w >= INS_NARROW_MIN && w < INS_MIN_W/);
  assert.match(fnBody(INS, 'jlFolded'), /if \(insNarrow\(\)\) return !_jlNarrowOpen;/);
  const A = fnBody(INS, 'jlNarrowApply');
  assert.match(A, /host\.classList\.toggle\('is-narrow-over', _jlNarrowOpen\)/);
  assert.match(A, /sh\.style\.setProperty\('--jl-room', JL_FOLDED \+ 'px'\)/, 'the page keeps its width under the panel');
  assert.match(fnBody(INS, 'jlFoldSet'), /if \(insNarrow\(\)\)\{ _jlNarrowOpen = !on;/, 'a narrow fold is never stored');
  assert.match(fnBody(INS, 'jlFrame'), /if \(!host\.querySelector\(':scope > \.jl-body'\)\) _jlNarrowOpen = false;/, 'each page arrives folded');
  assert.match(INS, /e\.key !== 'Escape'[\s\S]{0,400}jlFoldSet\(true\)/);
  assert.match(INS, /addEventListener\('pointerdown'[\s\S]{0,300}is-narrow-over[\s\S]{0,200}jlFoldSet\(true\)/);
  assert.match(INS, /h\.classList\.contains\('is-narrow-over'\)\) return;/, 'the slider leaves the open-over panel alone');
});

test('f1194 (2) a code-named contract on the Wall wears today\'s frame, saying only what the card says', () => {
  const C = fnBody(PD, 'pdChosenHtml');
  assert.match(C, /if \(c\._codeNamed && [^\n]*regLsFrame === 'function'[^\n]*\)\s*return regLsFrame\('pd-chosen ctls-chosen is-coded'/);
  const seg = C.slice(C.indexOf("regLsFrame('pd-chosen ctls-chosen is-coded'"), C.indexOf("if (c._codeNamed) return"));
  assert.match(seg, /igw_kept_list/); assert.match(seg, /cn_stop/);
  assert.doesNotMatch(seg, /data-pd-ch-open|ctls_h_tl|dossierOf|expiry|counterparty/, 'no door, no timeline, no dates, no other side');
});

test('f1194 (3) the split-second fallbacks wait instead of drawing an older version', () => {
  assert.match(fnBody(PD, 'pdWallHelloHtml'), /naSheetUp\(\)\) return pdWaitHtml\('pd-sheet-hello'\);/);
  assert.match(fnBody(PD, 'pdWaitHtml'), /aria-busy="true"/);
  /* RE-POINTED 23 Nov 2026 (owner: "delete the old versions and merge"): no older place to fall back to — the page waits
     for its contract's middle, bringing the contract to Home first, and says so if it never comes */
  const W = fnBody(PD, 'pdMidWait');
  assert.match(W, /roomHomeLand\(cid, \{ open: true \}\)/);
  assert.match(W, /Date\.now\(\) - t0 >= PD_MID_WAIT_MS\)\{ if \(typeof toast === 'function'\) toast\(_pdT\('pd_mid_never'\), 'warn'\)/);
  const F = fnBody(PD, 'pdFormOpen');
  assert.match(F, /return pdMidWait\(/); assert.doesNotMatch(F, /pdSetTab\('form'\)/, 'the panel\'s form tab is no place for it');
  const D = fnBody(OB, 'openDutiesPage');
  assert.match(D, /return window\.pdMidWait\(\(\) => openDutiesPage\(c, found, Object\.assign\(\{\}, o, \{ midReady: true \}\)\), c\.id\);/);
  assert.doesNotMatch(D, /maxWidth: '920px'/, 'the old pop-up is deleted');
  /* RE-POINTED 23 Nov 2026 (review): ca_go_draft is Jambo's sentence when he takes you to New agreement (caGoSay builds
     'ca_go_' + place), not the old sheet panel's, so it stays; the panel's own words are gone */
  assert.ok(!/ca_go_draft_can1/.test(read('js/i18n.js')), 'the old sheet panel\'s words left both books');
  assert.equal((read('js/i18n.js').match(/\bpd_mid_never:/g) || []).length, 2);
});
