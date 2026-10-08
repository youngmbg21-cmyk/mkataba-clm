/* f631 — THE PHONE FITS (overnight run, stream G, 9 Oct 2026).
 *
 * The functional review measured, at 390px: the negotiation workbench's More,
 * Share and checks at x 394–566 and its facts strip cut to "N…"; Copilot's
 * prepared questions and its Plain/Legal toggle 22px tall at 12px; 12px type in
 * the phone shell; the counterparty's signature box 105px (the stylesheet named
 * a selector the pad does not draw), its ticks 15px, its tabs 32px; and
 * "Notes" opening nothing, because the phone hides the alerts aside and the
 * notes drawer wears the same class. "+ New" opened the desktop's New
 * agreement dialog on a phone.
 *
 * These pin the RULES by region (the stylesheet each lives in); the browser
 * half — measured boxes and photographs — is test/chromium/phone-fits-verify.js.
 * Red at the parent: every test below.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const between = (s, a, b) => { const i = s.indexOf(a); assert.ok(i >= 0, a); const j = s.indexOf(b, i + a.length); return s.slice(i, j < 0 ? undefined : j); };

const M = strip(read('js/mobile.js'));
const CSS = between(M, 'const M_CSS = `', '}`;');
const AI = strip(between(read('js/mobile-copilot.js'), 'const M_AI_CSS = `', '}`;'));
const PORTAL = strip(between(read('js/mobile-portal.js'), 'const M_PORTAL_CSS = `', '}`;'));

describe('f631 (G8) the workbench head fits a phone', () => {
  test('the acts and control row wrap, the facts strip steps out, controls are 44px — under the phone query only', () => {
    assert.match(CSS, /^const M_CSS = `\n@media \(max-width:767px\)\{/);
    assert.match(CSS, /body\.m-on\.m-redline #ws-head \.room-acts,\s*body\.m-on\.m-redline \.redline-page \.rl-actions\{[^}]*flex-wrap:wrap!important/);
    assert.match(CSS, /body\.m-on\.m-redline #ws-facts\{ display:none!important; \}/);
    assert.match(CSS, /body\.m-on\.m-redline #view-redline :is\([^)]*\.room-check[^)]*\)\{ min-height:44px!important; \}/);
  });
});

describe('f631 (G9) Copilot\'s toggle and questions are a finger\'s size', () => {
  test('44px and the card\'s type, !important over the inline 22px', () => {
    assert.match(AI, /#ai-panel #ai-style button\{ min-height:44px!important;/);
    assert.match(AI, /#ai-panel \.ai-chip\{ min-height:44px!important; font-size:var\(--t-card\)!important;/);
  });
});

describe('f631 (G10) a new agreement is a computer\'s work, said', () => {
  test('the row says Computer and the press says so; upload still opens', () => {
    const S = read('js/mobile-screens.js');
    const sheet = between(S, 'function mNewSheetHtml(){', 'data-m-act="new-upload"');
    assert.match(sheet, /m_draft_from_template[\s\S]*i18t\('m_computer'\)/);
    assert.match(S, /if\(k==='new-wizard'\)\{ mCloseSheet\(\); if\(window\.toast\) toast\(i18t\('mc_desk_msg'\),'warn'\); return; \}/);
    assert.match(S, /if\(k==='new-upload'\)\{ mCloseSheet\(\); if\(window\.openUploadModal\) openUploadModal\(\); return; \}/);
  });
});

describe('f631 (G11) nothing under 14px inside the phone shell', () => {
  test('the small type steps are re-said by scope inside the phone root', () => {
    assert.match(CSS, /body\.m-on #m-root,\s*body\.m-on\.m-redline #view-redline\{ --t-meta:var\(--t-card\); --t-label:var\(--t-card\); --t-body:var\(--t-card\);/);
    assert.match(CSS, /body\.m-on #m-root \.m-ob-act\{ min-height:44px; \}/);
  });
});

describe('f631 (G12–G14) the counterparty on a phone', () => {
  test('the pad\'s real canvas is 200px and its ticks have a 44px row', () => {
    assert.match(PORTAL, /#sig-pad #sig-canvas\{ width:100%!important; height:200px!important;/);
    assert.match(read('js/signature.js'), /<canvas id="sig-canvas"/, 'the element the rule names is the one the pad draws');
    assert.match(PORTAL, /#sig-pad #sig-intent-row\{ min-height:44px;/);
  });
  test('the title takes its row; tabs are 44px', () => {
    assert.match(PORTAL, /\.pw-id-titlerow > h1\{ flex:1 1 100%!important;/);
    assert.match(PORTAL, /\.pw-tabs \.pw-tab\{ min-height:44px!important;/);
  });
  test('the notes drawer comes back, full width, while the alerts aside stays hidden', () => {
    assert.match(read('js/views/portal.js'), /@media \(max-width:767px\)\{ \.pt-bell\{display:none;\} \.pt-alerts,\.pt-alerts-scrim\{display:none;\} \}/,
      'the cause: the portal hides .pt-alerts on a phone, and the notes drawer wears it');
    assert.match(PORTAL, /\.pt-alerts\.pt-notes\{ display:flex!important; width:100%!important;/);
  });
});

describe('f631 (G15) a tablet at 820px does not pan sideways', () => {
  test('the room tab row\'s right-hand slot may wrap below 1024', () => {
    const I = read('index.html');
    assert.match(I, /@media \(max-width:1023px\)\{\s*\.room-tabrow\{ flex-wrap:wrap; row-gap:var\(--s-2\); \}\s*#ws-tabrow-end\{ flex:1 1 auto!important; flex-wrap:wrap!important;/);
  });
  test('the Contracts table draws a narrow column set that sums to 100, and drops its floor', () => {
    const R = read('js/views/register.js');
    const get = n => JSON.parse(R.match(new RegExp('const ' + n + '\\s*=\\s*(\\[[^\\]]*\\]);'))[1].replace(/'/g, '"'));
    const k = get('REG_COL_KEYS_NARROW'), w = get('REG_COL_W_NARROW');
    const kn = get('REG_COL_KEYS_NEGO_NARROW'), wn = get('REG_COL_W_NEGO_NARROW');
    assert.equal(k.length, w.length); assert.equal(kn.length, wn.length);
    assert.equal(w.reduce((a, b) => a + b, 0), 100); assert.equal(wn.reduce((a, b) => a + b, 0), 100);
    assert.ok(!k.includes('signed') && !k.includes('owner') && k.includes('counterparty') && k.includes('acts'));
    assert.match(R, /if\(!ins && regNarrowTable\(\)\) return neg \? REG_COL_KEYS_NEGO_NARROW : REG_COL_KEYS_NARROW;/);
    assert.match(R, /regColStoreKey\(\)/, 'a drag on the narrow table is stored apart from the wide one');
    assert.match(read('index.html'), /#reg-scroll>table\.reg-table\.is-narrow\{min-width:0;\}/);
  });
});
