/* THE STYLE AUDIT — Stylelint over HaTi's own sheets, with HaTi's own rules
   (stylelint-hati.js). A measuring instrument: it prints what departs from
   the theme and writes style.json for the detail report; it never fails.

   It reads the <style> blocks in index.html EXCEPT the generated Tailwind
   blob (`data-tw="compiled"` — never edited, CLAUDE.md), and the <style>
   blocks js/ files emit from template literals. Line numbers are the file's.

   Run: npm run audit:styles */
process.noDeprecation = true; /* Stylelint 16 warns about its CommonJS door on every run */
const fs = require('node:fs');
const path = require('node:path');
const stylelint = require('stylelint');
const { config } = require('./stylelint-hati.js');

const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, '..', 'shots'), 'detail-audit');

/* every <style>…</style> in a file, with the line its CSS starts on */
const blocksOf = (file, text) => {
  const out = [], re = /<style([^>]*)>([\s\S]*?)<\/style>/g;
  for (let m; (m = re.exec(text));) {
    if (/data-tw/.test(m[1])) continue;
    const css = m[2]; if (!css.trim() || /\$\{/.test(css) && css.length < 200) continue;
    const start = text.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length;
    /* a template literal's ${…} is not CSS: stand it in as a harmless word */
    out.push({ file, start, css: css.replace(/\$\{[^}]*\}/g, 'inherit') });
  }
  return out;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const blocks = blocksOf('index.html', fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  const walk = dir => { for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir + '/' + e.name; if (e.isDirectory()) walk(rel); else if (e.name.endsWith('.js')) blocks.push(...blocksOf(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8'))); } };
  walk('js');
  const found = [];
  for (const b of blocks) {
    const r = await stylelint.lint({ code: b.css, config });
    for (const res of r.results) for (const w of res.warnings) {
      /* a "<style" inside a JS string that is not a sheet: not CSS, not a finding */
      if (w.rule === 'CssSyntaxError') continue;
      const line = b.start + w.line - 1;
      const src = b.css.split('\n')[w.line - 1] || '';
      found.push({ file: b.file, line, rule: w.rule, text: w.text.replace(/\s*\([^)]*\)$/, ''), code: src.trim().slice(0, 160) });
    }
  }
  const byRule = {};
  for (const f of found) (byRule[f.rule] = byRule[f.rule] || []).push(f);
  fs.writeFileSync(path.join(OUT, 'style.json'), JSON.stringify({ blocks: blocks.length, found }, null, 1));
  console.log(`Looked at ${blocks.length} style blocks.`);
  for (const [k, list] of Object.entries(byRule).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${k} — ${list.length}`);
    for (const f of list.slice(0, 8)) console.log(`   ${f.file}:${f.line}  ${f.text}`);
    if (list.length > 8) console.log(`   … and ${list.length - 8} more`);
  }
  console.log(`\n${found.length} findings — written to ${path.join(OUT, 'style.json')}`);
})().catch(e => { console.error(e); process.exit(2); });
