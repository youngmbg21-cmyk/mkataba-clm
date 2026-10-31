'use strict';
/* f967 — THE NEW LOOK SWITCH (owner, 31 Oct 2026: the review room is built page by page behind one switch, "only you
   see until you approve each one"; yes to the switch).

   (1) ONE READING, ONE MARK: newLookOn reads an admin's own pref (prefs.newLook === true AND role admin); newLookApply
       is the one writer of html.lg-new, called before the first paint (startApp) and by the switch's writer.
   (2) THE SERVER IS THE WALL: PUT /api/me/prefs takes newLook only as true or false, refuses true from anyone but an
       admin (403), and stores nothing for off.
   (3) WITH IT OFF NOTHING MOVES: every rule of THE NEW LOOK's blocks in index.html is scoped under html.lg-new (or is
       the hidden .lg-only mark), so the old look is the old look.
   (4) the switch is drawn only for an admin, in both books' words. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* a selector list split at its own commas only, never inside :is( ) or :has( ) */
const topLevel = sel => { const out = []; let depth = 0, cur = '';
  for (const ch of sel){ if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth){ out.push(cur); cur = ''; } else cur += ch; }
  return out.concat(cur); };
const CORE = read('js/core.js'), SRV = read('server/server.js'), HTML = read('index.html'), ST = read('js/views/settings.js'), I18N = read('js/i18n.js');

test('f967 (1) one reading, one mark, before the first paint', () => {
  assert.match(CORE, /const newLookOn = \(\) => \{[^\n]*u\.role === 'admin' && u\.prefs && u\.prefs\.newLook === true/);
  assert.match(CORE, /const newLookApply = \(\) => \{ try \{ document\.documentElement\.classList\.toggle\('lg-new', newLookOn\(\)\); \}/);
  const start = CORE.slice(CORE.indexOf('function startApp(){'), CORE.indexOf('function startApp(){') + 1500);
  assert.match(start, /applyLanguage\(\{repaint:false\}\);\n\s*newLookApply\(\);/, 'applied before the shell is shown');
  assert.match(ST, /async function stNewLookSet\(on\)\{\n\s*if\(await stPrefSet\('newLook', on\)\)\{ if\(typeof newLookApply==='function'\) newLookApply\(\);/);
  assert.equal((CORE.match(/classList\.toggle\('lg-new'/g) || []).length, 1, 'one writer of the mark');
});

test('f967 (2) the server is the wall: a boolean, an admin\'s only', () => {
  const i = SRV.indexOf("if ('newLook' in (req.body || {}))");
  assert.ok(i > 0, 'the pref is handled');
  const body = SRV.slice(i, i + 600);
  assert.match(body, /typeof req\.body\.newLook !== 'boolean'\) return res\.status\(400\)/);
  assert.match(body, /req\.body\.newLook && !\(req\.user && req\.user\.role === 'admin'\)\) return res\.status\(403\)/);
  assert.match(body, /if \(req\.body\.newLook\) prefs\.newLook = true; else delete prefs\.newLook;/);
});

test('f967 (3) with it off nothing moves: every new-look rule waits on html.lg-new', () => {
  const blocks = [];
  let at = 0;
  while ((at = HTML.indexOf('/* ==== THE NEW LOOK', at)) >= 0){
    const end = HTML.indexOf('</style>', at);
    const next = HTML.indexOf('/* ====', at + 10);
    blocks.push(HTML.slice(at, next > 0 && next < end ? next : end));
    at += 10;
  }
  assert.ok(blocks.length >= 1, 'the frame block is there');
  for (const b of blocks){
    const css = b.replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].trim()).filter(sel => !/^@media/.test(sel));
    assert.ok(rules.length > 10, 'rules read');
    const loose = rules.filter(sel => topLevel(sel).some(one => { const s = one.trim().replace(/^@media[^{]*\{\s*/, ''); return s && !/^html\.lg-new\b/.test(s) && s !== '.lg-only'; }));
    assert.deepEqual(loose, [], 'every rule is scoped under html.lg-new');
  }
});

test('f967 (4) the switch is drawn for an admin only, in both books', () => {
  assert.match(ST, /\(\(typeof isAdmin==='function'&&isAdmin\(\)\)\?stSrHtml\(esc\(i18t\('st_you_newlook'\)\), `\$\{stSwHtml\('newlook'/);
  for (const k of ['st_you_newlook', 'st_you_newlook_sub', 'st_you_newlook_on', 'st_you_newlook_off'])
    assert.equal((I18N.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k + ' in both books');
});
