'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f937 — EVERY CHANGE UPDATES THE HANDBOOK (flow rule 9d; owner, 26 Oct 2026:
   "there should be a rule that whenever the platform changes or new features
   added, the guide instruction book is updated accordingly")

   The Handbook (js/handbook.js, drawn by js/views/handbook.js) is one chapter
   per thing a person can do. A rule nobody runs is a wish, so this file runs
   it on every change. What a machine CAN check:
   (1) EVERY DOOR HAS A CHAPTER: every place word (CA_PLACES), every place
       inside one (NAV_PLACES), every part of a contract (NAV_ACTS) and every
       Guide row is named by at least one chapter — or stood unnamed on
       26 Oct 2026 (DOORS_NOT_IN_THE_HANDBOOK, empty that day; it only SHRINKS).
   (2) EVERY BUTTON A CHAPTER QUOTES IS A LIVE LABEL: a {ui:key} is a
       dictionary key in BOTH books (or its _one/_other pair); a {door:key} is
       a real door. A renamed or retired label fails here.
   (3) EVERY CHAPTER IS WHOLE: both languages on every text, a part, words for
       "how do I …", and a picture recipe or a plain reason why none.
   (4) THE WIRING: the Guide's row, the place word, "/" and Jambo's mover, the
       page's place on refresh, the "how do I …" reader last in the chain, the
       words in both books, the day the book was last checked.
   (5) The check bites: a staged book missing a door fails it.
   What a machine CANNOT check — whether the sentences still tell the truth
   after a screen's behaviour changes — is the rule itself (CLAUDE.md 9d).
   Browser: test/chromium/handbook-verify.js (the page, the doors, the
   pictures from the seeded world).
   AT THE PARENT (40338e7) every claim FAILS: there is no Handbook.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const R = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const H = require('../js/handbook.js');
const APP = R('js/app.js'), CA = R('js/copilotacts.js'), NAV = R('js/navmap.js'), I18N = R('js/i18n.js'), VIEW = R('js/views/handbook.js');
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
const labelOk = k => inBoth(k) || (inBoth(k + '_one') && inBoth(k + '_other'));

/* the doors, read off the code the way the browser reads them (f842's way) */
const listKeys = (src, head, re) => { const i = src.indexOf(head); assert.ok(i >= 0, head + ' is found'); const body = src.slice(i, src.indexOf('\n];', i)); return [...body.matchAll(re)].map(m => m[1]); };
const caPlaces = () => listKeys(CA, 'const CA_PLACES = [', /\{\s*k:\s*'([a-z]+)'/g);
const navPlaces = () => listKeys(NAV, 'const NAV_PLACES = [', /\n\s*\['([a-z]+)', navPlaceRe/g);
const navActs = () => listKeys(NAV, 'const NAV_ACTS = [', /\n\s*\['([a-z]+)', \//g);
const guideRows = () => { const rows = listKeys(APP, 'const GUIDE_STAGES = [', /'([a-z]+)'/g).filter(k => !['ask', 'draft', 'agree', 'sign', 'keep', 'see'].includes(k) || k === 'draft');
  const f = APP.slice(APP.indexOf('function guidePanelHtml('), APP.indexOf('\n}', APP.indexOf('function guidePanelHtml(')));
  return [...new Set(rows.concat([...f.matchAll(/guideRowHtml\('([a-z]+)'/g)].map(m => m[1])))]; };

/* the 26 Oct 2026 debt — only shrinks */
const DOORS_NOT_IN_THE_HANDBOOK = {
  /* empty on the day the rule was made: every door had its chapter. A door added later with none fails 1a. */
};

function handbookGaps(chapters = H.HANDBOOK_CHAPTERS){
  const doors = new Set(), acts = new Set();
  for (const c of chapters){ (c.doors || []).forEach(d => doors.add(d)); (c.acts || []).forEach(a => acts.add(a)); for (const m of H.hbkMarkersOf(c)) if (m.kind === 'door') doors.add(m.key); }
  const miss = [];
  for (const k of caPlaces()) if (!doors.has(k)) miss.push('place:' + k);
  for (const k of navPlaces()) if (!doors.has(k)) miss.push('place:' + k);
  for (const k of navActs()) if (!acts.has(k) && !doors.has(k)) miss.push('act:' + k);
  for (const k of guideRows()) if (!doors.has(k)) miss.push('guide:' + k);
  return [...new Set(miss)].sort();
}

describe('f937 (1) every door has a chapter', () => {
  test('1a every place word, place inside one, contract part and Guide row is named by a chapter, or stood unnamed on 26 Oct 2026', () => {
    assert.ok(caPlaces().length > 30 && navPlaces().length > 10 && navActs().length > 20 && guideRows().length > 15, 'the four lists were read');
    const gaps = handbookGaps().filter(k => !DOORS_NOT_IN_THE_HANDBOOK[k]);
    assert.deepEqual(gaps, [], 'a new door needs a chapter, or a line in one (flow rule 9d): ' + gaps.join(', '));
  });
  test('1b the debt only shrinks: a door given its chapter comes off the list', () => {
    const gaps = new Set(handbookGaps());
    for (const k of Object.keys(DOORS_NOT_IN_THE_HANDBOOK)) assert.ok(gaps.has(k), `${k} is in the Handbook now: take it off DOORS_NOT_IN_THE_HANDBOOK`);
  });
});

describe('f937 (2) every button a chapter quotes is a live label, every door a real door', () => {
  test('2a {ui:key} is a dictionary key in both books (or its _one/_other pair)', () => {
    const bad = [];
    for (const c of H.HANDBOOK_CHAPTERS) for (const m of H.hbkMarkersOf(c)) if (m.kind === 'ui' && !labelOk(m.key)) bad.push(c.k + ' {ui:' + m.key + '}');
    assert.deepEqual(bad, [], 'the Handbook quotes a button that no longer exists: ' + bad.join(', '));
  });
  test('2b {door:key} and `doors` name a place word, a place inside one, or the book; `acts` name contract parts', () => {
    const places = new Set(caPlaces().concat(navPlaces(), ['handbook'])), acts = new Set(navActs());
    const bad = [];
    for (const c of H.HANDBOOK_CHAPTERS){
      for (const m of H.hbkMarkersOf(c)) if (m.kind === 'door' && !places.has(m.key)) bad.push(c.k + ' {door:' + m.key + '}');
      for (const d of c.doors || []) if (!places.has(d)) bad.push(c.k + ' doors:' + d);
      for (const a of c.acts || []) if (!acts.has(a)) bad.push(c.k + ' acts:' + a);
    }
    assert.deepEqual(bad, [], 'a chapter names a door HaTi does not have: ' + bad.join(', '));
  });
});

describe('f937 (3) every chapter is whole', () => {
  const both = v => v && typeof v === 'object' && typeof v.en === 'string' && v.en.trim() && typeof v.sv === 'string' && v.sv.trim();
  test('3a a unique key, a part, both languages on every text, words for "how do I …"', () => {
    const seen = new Set(), bad = [];
    for (const c of H.HANDBOOK_CHAPTERS){
      if (seen.has(c.k)) bad.push(c.k + ' twice'); seen.add(c.k);
      if (!H.hbkPartOf(c.part)) bad.push(c.k + ' part');
      for (const f of ['title', 'eyebrow', 'what', 'tip', 'cost']) if (!both(c[f])) bad.push(c.k + ' ' + f);
      for (const f of ['when', 'how']) if (!Array.isArray(c[f]) || !c[f].length || !c[f].every(both)) bad.push(c.k + ' ' + f);
      if (!Array.isArray(c.path) || !c.path.length || !c.path.every(p => (typeof p === 'string' && p.startsWith('door:')) || both(p))) bad.push(c.k + ' path');
      if (!c.words || !Array.isArray(c.words.en) || !c.words.en.length || !Array.isArray(c.words.sv) || !c.words.sv.length) bad.push(c.k + ' words');
      if (c.read && (!both(c.read) || (c.read.key && !c.read.key.every(both)))) bad.push(c.k + ' read');
    }
    assert.deepEqual(bad, [], bad.join(', '));
    assert.ok(H.HANDBOOK_CHAPTERS.length >= 40, 'the book is whole: ' + H.HANDBOOK_CHAPTERS.length);
    assert.equal(H.HANDBOOK_PARTS.length, 8);
  });
  test('3b a picture recipe (steps, boxes, a caption in both books), or a plain reason why none', () => {
    const bad = [];
    for (const c of H.HANDBOOK_CHAPTERS){
      if (c.shot){ if (!Array.isArray(c.shot.go) || !c.shot.go.length || !Array.isArray(c.shot.boxes) || !c.shot.boxes.length || !both(c.shot.cap)) bad.push(c.k); }
      else if (!both(c.noShot)) bad.push(c.k + ' (no shot, no reason)');
    }
    assert.deepEqual(bad, [], bad.join(', '));
  });
  test('3c every part has at least one chapter, and the parts are the Guide\'s stages in order with Getting around first and Settings last', () => {
    assert.deepEqual(H.HANDBOOK_PARTS.map(p => p.k), ['around', 'ask', 'draft', 'agree', 'sign', 'keep', 'see', 'settings']);
    for (const p of H.HANDBOOK_PARTS) assert.ok(H.hbkChaptersOf(p.k).length >= 1, p.k + ' has chapters');
  });
});

describe('f937 (4) the wiring', () => {
  test('4a the Guide draws the Handbook\'s row above Settings; "handbook" is a place word, in "/" and in Jambo\'s mover; the page keeps its place', () => {
    const f = code(APP.slice(APP.indexOf('function guidePanelHtml('), APP.indexOf('\n}', APP.indexOf('function guidePanelHtml('))));
    assert.match(f, /guideRowHtml\('handbook',here,'is-foot'\)\}\s*\$\{guideRowHtml\('settings',here,'is-foot'\)/);
    assert.ok(caPlaces().includes('handbook'));
    assert.match(code(CA), /'guide', 'handbook', 'alerts', 'activity'\];/);
    assert.match(code(CA), /handbook: \(c, a\) => \(typeof hbkOpen === 'function'\) \? hbkOpen\(a && a\.chapter, \{ part: a && a\.part \}\)/);
    assert.match(code(APP), /handbook:\['hbkPlace','hbkPlacePut'\]/);
    assert.match(code(APP), /else if\(view==='handbook'\) renderHandbook\(\);/);
    assert.match(code(APP), /case 'handbook':\s+return \[i18t\('nav_handbook'\), ''\];/);
  });
  test('4b "how do I …" is read LAST in the chain, never with a contract named, never a task of Jambo\'s map', () => {
    assert.match(code(NAV), /navReadNone\(raw, t\) \|\| navReadHandbook\(raw, t\) \|\| null;/);
    const f = code(NAV.slice(NAV.indexOf('function navReadHandbook('), NAV.indexOf('\n}', NAV.indexOf('function navReadHandbook('))));
    assert.match(f, /jmRead\(raw\)\) return null/);
    assert.match(f, /\[A-Za-z\]\{2,4\}-\[A-Za-z0-9\]\+/);
    assert.match(f, /say: 'nav_go_handbook'/);
    const hit = H.hbkFind('how do I send this for review', 'en');
    assert.equal(hit && hit.k, '3.3');
    assert.equal((H.hbkFind('hur gör jag för att skicka på granskning', 'sv') || {}).k, '3.3');
    assert.equal(H.hbkFind('what is the weather', 'en'), null);
  });
  test('4c the words are in both books: the row, the page, the word, the help line, every label the page prints', () => {
    const keys = new Set(['nav_handbook', 'gd_p_handbook', 'gd_w_handbook', 'ca_w_handbook', 'ca_help_book', 'nav_go_handbook', 'brn_p_handbook', 'brn_pd_handbook', 'brn_p_hbkbook', 'brn_pd_hbkbook', 'brn_p_hbkask', 'brn_pd_hbkask']);
    for (const m of VIEW.matchAll(/_hbkT\('([a-z0-9_]+)'/g)) keys.add(m[1]);
    for (const p of H.HANDBOOK_PARTS){ if (p.w) keys.add(p.w); if (p.sub) keys.add(p.sub); if (p.gd){ keys.add('gd_s_' + p.gd); keys.add('gd_s_' + p.gd + '_w'); } }
    for (const k of navPlaces()) keys.add('hbk_d_' + k);
    const missing = [...keys].filter(k => !/^(gd_p_|ca_w_|hbk_d_)$/.test(k) && !k.endsWith('_') && !inBoth(k));
    assert.deepEqual(missing, [], 'in both books: ' + missing.join(', '));
  });
  test('4d the book says the day it was last checked, a real day on or after it was written', () => {
    assert.match(H.HANDBOOK_CHECKED, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(H.HANDBOOK_CHECKED >= '2026-10-26');
    assert.match(VIEW, /hbk_checked', \{ d: HANDBOOK_CHECKED \}/);
  });
  test('4e the brain names the page, the book and the reader; the server serves the pictures', () => {
    const B = R('js/brainmap.js'), S = R('server/server.js');
    for (const id of ['handbook', 'hbkbook', 'hbkask']) assert.ok(B.includes(`['${id}', `), id + ' in BRAIN_PARTS');
    assert.match(B, /\[\/\^js\\\/handbook\\\.js\$\/, 'see'\]/);
    assert.match(S, /app\.use\('\/handbook', express\.static\(path\.join\(__dirname, '\.\.', 'handbook'\)/);
  });
});

test('f937 (5) the check bites: a staged book missing a door fails', () => {
  const without = H.HANDBOOK_CHAPTERS.filter(c => c.k !== '5.1');
  const gaps = handbookGaps(without).filter(k => !DOORS_NOT_IN_THE_HANDBOOK[k]);
  assert.ok(gaps.includes('place:oblig') || gaps.includes('guide:oblig'), 'a door with no chapter is reported: ' + gaps.join(', '));
});
