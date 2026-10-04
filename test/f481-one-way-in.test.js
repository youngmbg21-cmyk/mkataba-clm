/* f481 — ONE WAY IN (the process review, 4 Oct 2026)
   ============================================================================
   Two acts each had two doors on the rail:
     · importing a portfolio had "Import contracts" AND the upload's own link
     · the paper and its rulebook had "Templates" AND "Our standards"
   One door each now. The pages, their view ids and every other link to them
   are unchanged — this is a door merge, not a rewrite.

   WHAT THIS FILE PINS
     (1) the rail has no Import door; the upload door says "Upload several
         (import a portfolio)" and opens the importer, carrying its count
     (2) the rail has one door for Templates & standards; Our standards is the
         page's third tab, the old `playbook` view still opens it, and both
         views light the one door
     (3) every new word is in both books

   Run: node --test test/f481-one-way-in.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = p => { try{ return fs.readFileSync(path.join(__dirname, '..', p), 'utf8'); } catch(_){ return ''; } };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return '';
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0){ const ch = src[i]; if (ch === '{') depth++; else if (ch === '}') depth--; i++; }
  return src.slice(m.index, i);
};
const HTML = strip(read('index.html'));
const RAIL = HTML.slice(HTML.indexOf('<nav'), HTML.indexOf('</nav>'));
const LIB = read('js/views/library.js');
const CT = read('js/views/contract.js');
const EN = read('js/i18n.js');

describe('f481 (1) importing is reached from the upload door', () => {
  test('the rail carries no Import door', () => {
    assert.ok(RAIL.length > 1000, 'the rail was found');
    assert.ok(!/data-view="migration"/.test(RAIL));
  });
  test('the upload door says it plainly, opens the importer and carries the waiting count', () => {
    const up = strip(fnBody(CT, 'openUploadModal'));
    assert.match(up, /id="up-bulk"[^>]*>\$\{i18t\('ct_upload_several'\)\}/);
    assert.match(up, /navCounts\(\)\|\|\{\}\)\.migration/);
    assert.match(up, /getElementById\('up-bulk'\)\.addEventListener\('click',\(\)=>\{ closeModal\(\); setView\('migration'\); \}\)/);
  });
  test('the page itself is untouched and still routable', () => {
    assert.match(read('js/app.js'), /else if\(view==='migration'\) renderMigration\(\)/);
  });
});

describe('f481 (2) Templates & standards is one page with one door', () => {
  test('one rail door, named for both', () => {
    assert.ok(!/data-view="playbook"/.test(RAIL), 'the second door is gone');
    assert.match(RAIL, /data-view="templates"[^>]*data-i18n-title="nav_tpl_std_title"/);
    assert.match(RAIL, /data-i18n="nav_tpl_std"/);
  });
  test('the three tabs are one list, and Our standards is the third', () => {
    assert.match(LIB, /const PAPER_TABS=\['book','list','standards'\];/);
    const tpl = strip(fnBody(LIB, 'renderTemplatesPage'));
    assert.match(tpl, /data-paper-tab="standards"/);
    assert.match(tpl, /paperTabsWire\(\)/);
  });
  test('the old view id opens that tab, under the page\'s name, lighting the one door', () => {
    const pb = strip(fnBody(LIB, 'renderPlaybookPage'));
    assert.match(pb, /class="st-tabs-pin" style="flex:none">\$\{paperTabsHtml\('standards'\)\}<div class="st-tabs" role="tablist">/,
      'the page row and the sub-tabs pin together, in both shapes');
    assert.match(pb, /setActiveNav\('templates'\)/);
    assert.ok(!/setActiveNav\('playbook'\)/.test(pb));
    assert.match(read('js/app.js'), /case 'playbook':\s+return \[i18t\('nav_tpl_std'\)/);
  });
  test('a press on a tab of the other view changes view; the standards tab is the playbook view', () => {
    const w = strip(fnBody(LIB, 'paperTabsWire'));
    assert.match(w, /setView\('playbook'\)/);
    assert.match(w, /_tplPageTab=k;\s*setView\('templates'\)/);
  });
});

describe('f481 (3) both books', () => {
  for (const k of ['nav_tpl_std', 'nav_tpl_std_title', 'ct_upload_several', 'ct_import_waiting_one', 'ct_import_waiting_other'])
    test(k + ' is in English and Swedish', () =>
      assert.equal((EN.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2));
});
