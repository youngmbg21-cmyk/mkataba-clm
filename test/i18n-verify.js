/* Phase 7 verification for the EN/SV build. Every check prints PASS or FAIL
   with what it actually asserted. Nothing here is taken on trust. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (name, cond, note) => { (cond ? pass++ : fail++); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? ' — ' + note : ''}`); };

function loadI18n(stored) {
  const store = new Map();
  if (stored != null) store.set('hati_lang', stored);
  const els = new Map();
  const sb = {
    console, Object, JSON, Array, String, Number, Boolean, RegExp, Date, Math,
    document: {
      readyState: 'complete',
      documentElement: {},
      addEventListener() {},
      getElementById(id) { if (!els.has(id)) els.set(id, { id, textContent: '', title: '', style: {} }); return els.get(id); },
      querySelectorAll() { return []; },
    },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
  };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'), sb, { filename: 'js/i18n.js' });
  sb._store = store; sb._els = els;
  return sb;
}

console.log('--- D1 toggle button: present, in the topbar, names the destination ---');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const btn = html.match(/<button id="langToggleBtn"[^>]*>([^<]*)<\/button>/);
const header = html.slice(html.indexOf('<!-- Command bar'), html.indexOf('<!-- body grid'));
ok('#langToggleBtn exists', !!btn);
ok('#langToggleBtn is inside the command bar (topbar)', header.includes('id="langToggleBtn"'));
ok('default label names the destination (Svenska while in English)', !!btn && btn[1].trim() === '🇸🇪 Svenska', btn && btn[1].trim());
{
  const en = loadI18n('en'), sv = loadI18n('sv');
  ok('English mode label = 🇸🇪 Svenska', en.t('lang_toggle') === '🇸🇪 Svenska', en.t('lang_toggle'));
  ok('Swedish mode label = 🇬🇧 English', sv.t('lang_toggle') === '🇬🇧 English', sv.t('lang_toggle'));
}

console.log('\n--- D3 the choice survives a restart (localStorage hati_lang) ---');
{
  const s = loadI18n(null);
  ok('defaults to English with nothing stored', s.getLang() === 'en');
  s.toggleLanguage();
  ok('toggle writes hati_lang=sv', s._store.get('hati_lang') === 'sv', String(s._store.get('hati_lang')));
  const s2 = loadI18n('sv');
  ok('a fresh load with hati_lang=sv starts in Swedish', s2.getLang() === 'sv');
  const s3 = loadI18n('de');   // a value with no dictionary
  ok('an unknown stored language falls back to English', s3.getLang() === 'en');
}

console.log('\n--- D7 a missing Swedish key shows English, never blank or a crash ---');
{
  const s = loadI18n('sv');
  ok('sanity: the key is Swedish before deletion', s.t('nav_home') === 'Hem', s.t('nav_home'));
  delete s.STRINGS.sv.nav_home;
  const after = s.t('nav_home');
  ok('after deleting the Swedish key it falls back to English', after === 'Home', after);
  ok('the fallback is not blank', after !== '' && after != null);
  s.STRINGS.sv.nav_home = 'Hem';   // restored
  ok('restored', s.t('nav_home') === 'Hem');
  ok('a key missing from BOTH halves returns the key name, not a blank', s.t('no_such_key_at_all') === 'no_such_key_at_all');
}

console.log('\n--- D9 placeholders and _one/_many ---');
{
  const en = loadI18n('en'), sv = loadI18n('sv');
  ok('{placeholder} substitutes', en.t('cmd_sub_folder_filtered', { folder: 'Sales' }) === 'filtered to Sales', en.t('cmd_sub_folder_filtered', { folder: 'Sales' }));
  ok('Swedish puts the value in its own word order', sv.t('cmd_sub_folder_filtered', { folder: 'Sales' }) === 'filtrerat till Sales', sv.t('cmd_sub_folder_filtered', { folder: 'Sales' }));
  ok('multi-placeholder', en.t('cmd_sub_workspace_party', { id: 'MK-1', name: 'N', party: 'P' }) === 'MK-1 · N — P');
  ok('_one selected at count 1', en.tn('toast_exported', 1) === 'Exported 1 contract to CSV', en.tn('toast_exported', 1));
  ok('_many selected at count 2', en.tn('toast_exported', 2) === 'Exported 2 contracts to CSV', en.tn('toast_exported', 2));
  ok('_one/_many exist in Swedish too', sv.tn('toast_exported', 1) === 'Exporterade 1 avtal till CSV', sv.tn('toast_exported', 1));
  const s = loadI18n('en');
  const bases = new Set(Object.keys(s.STRINGS.en).filter(k => /_one$/.test(k)).map(k => k.replace(/_one$/, '')));
  const orphans = [...bases].filter(b => !s.STRINGS.en[b + '_many'] || !s.STRINGS.sv[b + '_one'] || !s.STRINGS.sv[b + '_many']);
  ok('every _one has a matching _many in both halves', orphans.length === 0, orphans.join(', ') || `${bases.size} pairs`);
}

console.log('\n--- dictionary integrity ---');
{
  const s = loadI18n('en');
  const en = Object.keys(s.STRINGS.en), sv = Object.keys(s.STRINGS.sv);
  ok('same number of keys', en.length === sv.length, `${en.length} / ${sv.length}`);
  ok('same keys, same order', JSON.stringify(en) === JSON.stringify(sv));
  const blanks = en.filter(k => !String(s.STRINGS.sv[k] ?? '').trim());
  ok('no Swedish value is blank', blanks.length === 0, blanks.join(', '));
  // every key referenced anywhere in the converted code resolves
  const files = ['js/app.js', 'js/core.js', 'js/api.js', 'js/views/queue.js', 'js/views/calendar.js', 'index.html'];
  const refs = new Set();
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    [...src.matchAll(/\bt\('([a-z0-9_]+)'/g)].forEach(m => refs.add(m[1]));
    [...src.matchAll(/\btn\('([a-z0-9_]+)'/g)].forEach(m => { refs.add(m[1] + '_one'); refs.add(m[1] + '_many'); });
    [...src.matchAll(/data-i18n(?:-placeholder|-title|-aria)?="([^"]+)"/g)].forEach(m => refs.add(m[1]));
  }
  // prefixes used with runtime concatenation, e.g. t('cp_kind_'+r.kind)
  ['cp_kind_', 'status_', 'role_', 'stream_', 'cal_wd_', 'cal_ev_', 'share_', 'approval_'].forEach(p => refs.delete(p));
  const missing = [...refs].filter(k => !en.includes(k));
  ok('every key referenced in converted code exists', missing.length === 0, missing.join(', ') || `${refs.size} referenced`);
  // the English text left in index.html must match the dictionary's English
  const drift = [];
  [...html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)].forEach(m => {
    const [, key, text] = m;
    const want = s.STRINGS.en[key];
    if (want != null && text.trim() && text.trim().replace(/&amp;/g, '&') !== want) drift.push(`${key}: html="${text.trim()}" dict="${want}"`);
  });
  ok('index.html English defaults match STRINGS.en', drift.length === 0, drift.join(' | '));
}

console.log('\n--- D8 no inline language ternaries, no glued sentence fragments (converted files) ---');
{
  const converted = ['js/app.js', 'js/core.js', 'js/views/queue.js', 'js/views/calendar.js', 'js/i18n.js', 'js/api.js'];
  const bad = [];
  for (const f of converted) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    src.split('\n').forEach((line, i) => {
      if (!/\b(appLang|isSv|getLang\(\))\s*===?\s*['"]sv['"]\s*\?/.test(line)) return;
      // The spec itself prescribes one language ternary — Part C step 6's
      // toLocaleString(appLang === 'sv' ? 'sv-SE' : 'en-GB'). A ternary whose
      // BOTH branches are locale codes is that, and is not a UI string.
      const branches = line.match(/\?\s*'([a-zA-Z-]+)'\s*:\s*\(?\s*[a-zA-Z]*\s*\|?\|?\s*'([a-zA-Z-]+)'/);
      const isLocalePick = branches && /^[a-z]{2}-[A-Z]{2}$/.test(branches[1]) && /^[a-z]{2}-[A-Z]{2}$/.test(branches[2]);
      if (!isLocalePick) bad.push(`${f}:${i + 1} ${line.trim().slice(0, 70)}`);
    });
  }
  ok('no `appLang === "sv" ? … : …` UI ternary in converted files', bad.length === 0, bad.join(' | '));
}

console.log('\n--- D10 out-of-scope files untouched ---');
{
  const { execSync } = require('child_process');
  const changed = execSync('git diff --name-only 067a69d~1 HEAD', { cwd: ROOT }).toString().trim().split('\n');
  const forbidden = ['js/views/portal.js', 'js/views/adviceportal.js'];
  const touched = forbidden.filter(f => changed.includes(f));
  ok('deferred counterparty portal untouched', touched.length === 0, touched.join(', ') || 'portal.js + adviceportal.js not in the diff');
  const schemaDiff = execSync('git diff 067a69d~1 HEAD -- server/server.js', { cwd: ROOT }).toString();
  const schemaLines = schemaDiff.split('\n').filter(l => /^[+-]/.test(l) && !/^[+-][+-]/.test(l));
  const ddl = schemaLines.filter(l => /CREATE TABLE|ALTER TABLE|DROP TABLE|CREATE INDEX/i.test(l));
  ok('no schema DDL changed in server/server.js', ddl.length === 0, ddl.join(' | ') || `${schemaLines.length} changed lines, none DDL`);
  // strip comment lines before looking for logic changes: this build's own
  // comments say the words "jurisdiction" and "role_profile" precisely to
  // record that they are left alone
  const codeOnly = ls => ls.filter(l => { const b = l.slice(1).trim();
    return b && !b.startsWith('*') && !b.startsWith('//') && !b.startsWith('/*') && !b.endsWith('*/'); });
  const juris = codeOnly(schemaLines).filter(l => /jurisdiction|role_profile/i.test(l));
  ok('no jurisdiction / role_profile logic changed', juris.length === 0, juris.join(' | '));
  /* Scoped to application source. This build's own SUMMARY.md, BUGLOG.md and
     these very harnesses discuss jurisdiction and role_profile by name in order
     to record that they are left alone — prose about the guardrail is not a
     breach of it. */
  const srcPaths = changed.filter(f => /^(js\/|server\/|index\.html$)/.test(f));
  const allDiff = srcPaths.length ? execSync('git diff 067a69d~1 HEAD -- ' + srcPaths.join(' '), { cwd: ROOT }).toString() : '';
  const jurisAll = codeOnly(allDiff.split('\n').filter(l => /^[+-]/.test(l) && !/^[+-][+-]/.test(l))).filter(l => /jurisdiction|role_profile/i.test(l));
  ok('no jurisdiction / role_profile line changed anywhere', jurisAll.length === 0, jurisAll.join(' | '));
  console.log('      files changed across the build: ' + changed.join(', '));
}

console.log('\n--- D6 Swedish number/date formatting, storage unchanged ---');
{
  ok('money groups the Swedish way', (5000000).toLocaleString('sv-SE') === '5 000 000'.replace(/ /g, ' ') || (5000000).toLocaleString('sv-SE').replace(/\s/g, ' ') === '5 000 000', (5000000).toLocaleString('sv-SE'));
  ok('English money unchanged', (5000000).toLocaleString('en-KE') === '5,000,000');
  ok('month name localises', new Date(2026, 6, 1).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }).includes('juli'));
  const core = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
  ok('fmtDocAmount (document text) still pinned to en-KE', /return Number\.isFinite\(n\) \? n\.toLocaleString\('en-KE'\) : null;/.test(core));
  ok('todayStr (writes c.lastAction) not localised', /const todayStr = \(\) => new Date\(\)\.toLocaleDateString\('en-GB'/.test(core));
  ok('fmtDT (writes comment.ts / signedAt) not localised', /const fmtDT = iso => new Date\(iso\)\.toLocaleString\('en-KE'/.test(core));
}

console.log('\n--- D5 AI language wiring (static checks; a live call needs a key) ---');
{
  const srv = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
  ok('server has a Swedish and an English prompt note', /AI_LANG_NOTE = \{/.test(srv) && /Skriv hela svaret på svenska/.test(srv));
  ok('the note tells the model to keep JSON keys in English', /Keep the JSON keys and tool field names unchanged in English/.test(srv) && /Behåll JSON-nycklarna och verktygsfältens namn oförändrade på engelska/.test(srv));
  ok('the note forbids translating quoted contract text', /never translate a quotation/.test(srv) && /översätt aldrig ett citat/.test(srv));
  const n = (srv.match(/content: withLang\(prompt, req\) \}/g) || []).length;
  ok('all 7 tool-prompt endpoints wrapped', n === 7, `${n}/7`);
  ok('the Copilot chat system prompt carries the note', /buildCopilotSystem\(context, cx\) \+ '\\n\\n' \+ langNote\(reqLang\(req\)\)/.test(srv));
  ok('OCR deliberately NOT wrapped', /text: OCR_PROMPT/.test(srv) && !/OCR_PROMPT.*withLang/.test(srv));
  const api = fs.readFileSync(path.join(ROOT, 'js/api.js'), 'utf8');
  ok('client sends lang on the 8 prompt endpoints', /AI_PROMPT_PATHS\.includes\(path\)\) body=\{ \.\.\.body, lang:/.test(api));
  ok('ai/ocr is NOT in the client list', /AI_PROMPT_PATHS=\[[^\]]*\]/.test(api) && !/AI_PROMPT_PATHS=\[[^\]]*ai\/ocr/.test(api));
  const aijs = fs.readFileSync(path.join(ROOT, 'js/ai.js'), 'utf8');
  const localUses = (aijs.match(/\$\{localLangNote\(\)\}/g) || []).length;
  ok('browser-direct path appends the note at both of its prompt sites', localUses === 2, `${localUses}/2`);
  const pb = fs.readFileSync(path.join(ROOT, 'js/playbook.js'), 'utf8');
  const md = fs.readFileSync(path.join(ROOT, 'js/metadata.js'), 'utf8');
  ok('saved playbook review records its language', /lang:\(typeof getLang==='function'\?getLang\(\):'en'\)/.test(pb));
  ok('extracted metadata records its language', /meta\._lang = \(typeof getLang==='function'\?getLang\(\):'en'\)/.test(md));
}

console.log(`\n================  ${pass} passed, ${fail} failed  ================`);
process.exit(fail ? 1 : 0);
