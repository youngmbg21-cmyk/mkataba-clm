'use strict';
/* f1249 — THE BOARD'S REMOTE (owner, 27 Nov 2026: "a side panel that will bring the charts that would usually appear
   under the need you card. The different charts that are currently hiding and would be summoned by prompting or the
   slash prompt"; built on "1: pick your choice. 2: yes. 3: yes").

   (1) 🎛️ STANDS FIRST on the Board's links line (jamboWaysHere puts 'hbremote' before every other door, so the fitting
       that leaves words out from the end never takes it), drawn by ONE builder (jamboRemoteBtnHtml) with aria-pressed.
   (2) WHILE IT IS PRESSED THE PANEL IS THE REMOTE: hbBoardHelloHtml returns hbRemoteHtml first; the welcome's head rule
       stands the panel's head down for it too; the box asks for a chart (igAskPlaceholder).
   (3) EVERY HIDDEN CHART, ONE PRESS: the rows are the six book readings (HB_KINDS), the ready charts (HB_GALLERY), the
       questions kept (s.myq) and the saved boards (s.saved); a press brings one through the EXISTING adders
       (hbAddPanel, hbGalleryRun, hbMyqRun) and lands on it; a press on one shown puts it away.
   (4) ONE FACT: "on" is read off s.panels (p.kind, p.gal, p.myq); the gallery and kept-question adders stamp it, the
       stored board keeps it, and every Board paint lets the remote follow (hbRemoteFollow in hbPaintBoard).
   (5) EIGHT AT MOST, SAID: a chart that leaves to make room is named (hb_panel_left), the ready charts' adder too.
   (6) "/" LISTS THE SAME CHARTS (hbRemoteSlashRows after the places and the moves), a choice BRINGS, never puts away.
   (7) NO MONEY, NO SPEND in the panel: no amount drawn, no Jambo call; every word in both books; the Handbook says it.
   AT THE PARENT (4d623f7) none of hbRemote* exists: every test here fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const HB = strip(read('js/views/homeboard.js'));
const CO = strip(read('js/components.js'));
const IG = strip(read('js/views/intelligence.js'));
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const HBK = read('js/handbook.js');
/* the body of one top-level function, comments stripped */
function fn(src, name){
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\n}\n', i);
  return src.slice(i, j + 2);
}

test('f1249 (1) 🎛️ stands first on the Board\'s line, one builder, pressed state said', () => {
  const here = fn(CO, 'jamboWaysHere');
  assert.match(here, /const remote = k === 'board' && [^;]*hbBoardHelloOn\(\)/);
  assert.match(here, /\(remote \? \['hbremote'\] : \[\]\)\.concat\(teach \? \['teachhere'\] : \[\]/, 'the remote before every other door');
  const html = fn(CO, 'jamboWaysHtml');
  assert.match(html, /d === 'hbremote' \? jamboRemoteBtnHtml\(\)/);
  const btn = fn(CO, 'jamboRemoteBtnHtml');
  assert.match(btn, /data-hb-remote/); assert.match(btn, /aria-pressed="\$\{on\}"/); assert.match(btn, /\\u\{1F39B\}/);
  assert.match(CO, /Object\.assign\(window,\{[^}]*jamboRemoteBtnHtml/);
});

test('f1249 (2) pressed, the panel is the remote; its head stands down; the box asks for a chart', () => {
  const hello = fn(HB, 'hbBoardHelloHtml');
  const a = hello.indexOf('if (hbRemoteOn()) return hbRemoteHtml();'), b = hello.indexOf('hbBookData');
  assert.ok(a > 0 && a < b, 'the remote is returned before the welcome counts anything');
  assert.match(fn(HB, 'hbRemoteOn'), /_hbRm && hbBoardHelloOn\(\)/, 'only on the Board');
  assert.match(fn(HB, 'hbRemoteToggle'), /renderIntelDock\(\)/);
  assert.match(HTML, /#ig-dock:has\(\[data-hb-rm-panel\]\) > \.igd-head > :where\([^)]*\):not\(#igd-collapse, \.flex-1\)\{display:none\}/);
  assert.match(fn(IG, 'igAskPlaceholder'), /hbRemoteOn\(\)\) return i18t\('hb_rm_ph'\)/);
  const click = fn(HB, 'hbOnClick');
  ['data-hb-remote', 'data-hb-rm', 'data-hb-rm-clear'].forEach(a => assert.ok(click.includes(`closest('[${a}]')`), a + ' is pressed through the Board\'s one listener'));
});

test('f1249 (3) every hidden chart is a row; a press brings it through the existing adders, or puts it away', () => {
  const rows = fn(HB, 'hbRemoteRows');
  assert.match(rows, /HB_KIND_KEYS\.map/); assert.match(rows, /HB_GALLERY\.map/); assert.match(rows, /s\.myq/); assert.match(rows, /s\.saved/);
  const html = fn(HB, 'hbRemoteHtml');
  ['see', 'ready', 'asked', 'quiet', 'saved'].forEach(g => assert.ok(html.includes(`grp('${g}'`), 'group ' + g));
  const press = fn(HB, 'hbRemotePress');
  assert.match(press, /hbAddPanel\(v\)/); assert.match(press, /hbGalleryRun\(v\)/); assert.match(press, /hbMyqRun\(i\)/);
  assert.match(press, /hbLandOnCard/);
  assert.match(press, /drop\(p => p\.kind === v\)/); assert.match(press, /drop\(p => p\.gal === v\)/);
  assert.match(press, /if \(!hbBoardInFront\(\)\) return false;/);
});

test('f1249 (4) one fact: "on" off the board\'s own panels, stamped, kept, followed', () => {
  assert.match(fn(HB, 'hbGalleryRun'), /p\.gal = k;/);
  assert.match(fn(HB, 'hbMyqRun'), /p\.myq = q\.name;/);
  assert.match(HB, /\{ gal: p\.gal \}/, 'the stored board keeps which ready chart a card is');
  assert.match(HB, /\{ myq: p\.myq\.slice\(0, 120\) \}/);
  const paint = fn(HB, 'hbPaintBoard');
  assert.match(paint, /hbRemoteFollow\(\);\n\}$/, 'every Board paint lets the remote follow');
  assert.match(fn(HB, 'hbRemoteFollow'), /if \(sig === _hbRmSig\) return;/, 'nothing changed, nothing drawn');
});

test('f1249 (5) eight at most, and the one that leaves is said', () => {
  assert.match(HB, /const HB_PANELS_MAX = 8;/);
  assert.match(fn(HB, 'hbRemoteHtml'), /HB_PANELS_MAX/);
  assert.match(fn(HB, 'hbRemoteSaid'), /hb_panel_left/);
  assert.match(fn(HB, 'hbGalleryRun'), /left \? ' ' \+ i18t\('hb_panel_left'/);
  assert.match(fn(HB, 'hbMyqRun'), /hb_panel_left/);
});

test('f1249 (6) "/" lists the same charts, after the places and the moves; a choice brings', () => {
  const rows = fn(HB, 'hbAskPopRows');
  assert.match(rows, /const charts = onBoard \? hbRemoteSlashRows\(w\) : \[\];/);
  assert.match(rows, /places\.concat\(moves\)\.concat\(charts\)/);
  assert.match(fn(HB, 'hbAskPopChoose'), /r\.kind === 'chart'\)\{ _hbAskSet\(inp, ''\); hbRemotePress\(r\.k, \{ bring: true \}\)/);
  assert.match(fn(HB, 'hbAskPopHtml'), /r\.kind === 'chart' \? 'hb_rm_slash_head'/);
  assert.match(fn(HB, 'hbRemoteSlashRows'), /r\.alt/, 'a ready chart answers to its short name ("/pipeline")');
});

test('f1249 (7) no money, no spend; every word in both books; the Handbook says it', () => {
  const panel = ['hbRemoteRows', 'hbRemoteHtml', 'hbRemoteRowHtml', 'hbRemoteSay', 'hbRemoteThumb', 'hbRemotePress'].map(n => fn(HB, n)).join('\n');
  assert.doesNotMatch(panel, /fmtMoney|hbValueSay|copilotAsk|intelAsk|\/api\/ai/, 'nothing priced, nothing asked of Jambo');
  const keys = ['hb_rm_btn', 'hb_rm_title', 'hb_rm_count', 'hb_rm_lead', 'hb_rm_g_see', 'hb_rm_g_ready', 'hb_rm_g_asked', 'hb_rm_g_quiet', 'hb_rm_g_saved', 'hb_rm_g_saved_s', 'hb_rm_on', 'hb_rm_bring', 'hb_rm_foot', 'hb_rm_clear', 'hb_rm_cleared', 'hb_rm_ph', 'hb_rm_slash_head'];
  const sv = I18N.indexOf('\n  sv: {');
  assert.ok(sv > 0);
  keys.forEach(k => {
    const re = new RegExp('\\n\\s+' + k + ': ');
    assert.ok(re.test(I18N.slice(0, sv)), k + ' in English');
    assert.ok(re.test(I18N.slice(sv)), k + ' in Swedish');
  });
  assert.match(HBK, /press 🎛️, first in the green links above Jambo\\'s box/);
  assert.match(HBK, /trycker du på 🎛️, först bland de gröna länkarna/);
  assert.match(HBK, /'board remote'/);
});

require('node:test').describe('f1249 (7) the remote on the Overview only (owner, 28 Nov 2026: "the Remote should only show up on the overview panel not jambo side panel")', () => {
  require('node:test').test('🎛️ joins the line only while his conversation is not up', () => {
    const C = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'components.js'), 'utf8');
    require('node:assert/strict').match(C, /const remote = k === 'board' && typeof window\.hbBoardHelloOn === 'function' && window\.hbBoardHelloOn\(\)\s*&& !\(typeof window\.jamboTalkUp === 'function' && window\.jamboTalkUp\(\)\);/);
  });
});
