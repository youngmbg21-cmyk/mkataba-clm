/* Per-module i18n audit. Two jobs, both run per converted module:

     1. STRAY-STRING AUDIT — find user-visible string literals that are still
        outside the dictionary. A module is "clean" when this reports none.
     2. LENGTH RISK — flag Swedish values more than 40% longer than their
        English counterpart, which is where a sidebar item, a status chip or a
        command-bar button is most likely to wrap or truncate. Swedish runs
        longer than English as a rule, so this is the standing layout hazard.

   Usage:
     node test/i18n-audit.js                 audit every module marked converted
     node test/i18n-audit.js js/views/x.js   audit one module
     node test/i18n-audit.js --layout        rewrite LAYOUT_RISKS.md and exit

   The stray-string matcher is deliberately blunt: it over-reports rather than
   under-reports, and everything it flags is either converted or explicitly
   listed as a known non-string below. A clean run means someone looked at
   every hit. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

/* Modules whose user-visible text has been moved into the dictionary. Adding a
   file here is the claim that it is DONE — the audit then has to agree. */
const CONVERTED = [
  'index.html',
  'js/app.js',
  'js/views/queue.js',
  'js/views/calendar.js',
  'js/views/reports.js',
  'js/views/advice.js',
  'js/views/home.js',
  'js/views/register.js',
  'js/views/intelligence.js',
];

/* Text that looks like a user-visible string to the matcher but is not.
   Anything added here needs a reason beside it — the whole point of the audit
   is that a human looked at every hit once. */
const NOT_UI = [
  // ---- CSS, markup and style plumbing ----
  /^[a-z-]+:\s*[^;]+;/i,                 // inline style declarations
  /^(px|em|rem|vh|vw|%|fr|auto|none|flex|grid|block|inline|hidden|nowrap|ellipsis)$/i,
  /^#[0-9a-f]{3,8}$/i,                   // colour literals
  /^var\(--/,                            // CSS custom properties
  /^\d/,                                 // starts with a digit
  /^[A-Z][a-z]*-[a-z]/,                  // hyphenated identifiers e.g. Content-Type
  // ---- identifiers, not prose ----
  /^[a-z0-9_]+$/,                        // snake_case / lowercase ids
  /^[A-Z][a-zA-Z0-9]*$/,                 // single CapWord — a status key, class or id
  /^[A-Za-z]+([A-Z][a-z]+)+$/,           // camelCase / PascalCase identifiers
  // ---- app-internal vocabulary that is data, not chrome ----
  /^(Draft|Under Review|Signed|Declined)$/,      // stored contract status values
  /^(Admin|Legal|Viewer|Member)$/,               // ROLE_LABEL — written into records
  /^(GET|POST|PUT|DELETE|PATCH)$/,
  /^application\//, /^text\//, /^image\//,       // MIME types
  /^[A-Z]{2,}(-[A-Z0-9]+)?$/,                    // KES, SHA-256, MK-103 style codes
  /^T\d{2}:\d{2}(:\d{2})?$/,                     // ISO time suffix appended to a date, e.g. 'T00:00:00'
  /* CSS selectors, e.g. '#reg-tbody [data-row]'. Every token must be a
     selector token AND the whole string must carry at least one structural
     marker (# . [), so ordinary prose like "Recently updated" cannot match. */
  v => /[#.\[]/.test(v) && v.split(/\s+/).every(tok =>
    /^(\[[\w-]+(=.*)?\]?|[#.]?[\w-]+(\[[\w-]+(=.*)?\]?)?)$/.test(tok)),
  /* An HTML fragment whose only text is punctuation — an ellipsis separator in
     a pager, a lone em-dash. No words to translate. */
  v => /^<[a-z][^>]*>[^<>A-Za-zÅÄÖåäö]*<\/[a-z]+>$/i.test(v),
  /^<svg[\s\S]*<\/svg>$/i,                        // a whole inline SVG icon
  /^[MmLlHhVvCcSsQqTtAaZz][MmLlHhVvCcSsQqTtAaZz\d\s,.eE+-]*$/,   // SVG path data, e.g. 'M0,0 L10,5 L0,10 z'
  /^('[^']+'|"[^"]+"|[\w-]+)(\s*,\s*('[^']+'|"[^"]+"|[\w-]+))+$/,   // a font stack
  /* A utility class list, including Tailwind arbitrary values —
     'w-full rounded-xl border-inputln pl-3.5 focus:ring-[3px]'. Every token
     must look like a utility AND at least one must carry a '-', ':' or '[',
     which ordinary prose does not. */
  v => { const toks = v.split(/\s+/);
    return toks.length > 1
      && toks.every(tk => /^(\[[^\]]*\]|-?[a-z0-9][\w:./%-]*(\[[^\]]*\])?)$/i.test(tk))
      && toks.some(tk => /[-:[]/.test(tk)); },
  /^[;\s]*[a-z-]+\s*:\s*[^;]*;/i,                 // a style fragment that opens with ';' or whitespace
  // ---- class lists: all-lowercase words, digits and hyphens, e.g.
  //      "pipe-col scroll-thin", "w-5 h-5", "flex items-center gap-2" ----
  /^[a-z0-9][a-z0-9/:.\[\]()%-]*( [a-z0-9][a-z0-9/:.\[\]()%-]*)*$/,
];

/* A line carrying `i18n-exempt: <reason>` is skipped. This is the only way to
   keep a user-visible English literal in a converted module, and it forces the
   reason to be written at the site rather than remembered. Used for CSV export
   headers (a file format downstream tools parse by column name) and for
   defaults that are written into a stored record. */
const EXEMPT = /i18n-exempt:/;
/* Block form, for a run of lines that are all one deliberate decision — a CSV
   body, say. `i18n-exempt-begin: <reason>` … `i18n-exempt-end`. The reason is
   still required on the opening marker. */
const EXEMPT_BEGIN = /i18n-exempt-begin:/;
const EXEMPT_END = /i18n-exempt-end/;

const isUiString = s => {
  const v = String(s).trim();
  if (v.length < 3) return false;
  if (!/[A-Za-zÅÄÖåäö]/.test(v)) return false;          // no letters at all
  if (!/[A-ZÅÄÖ]/.test(v[0]) && !/\s/.test(v)) return false;  // lowercase single word
  return !NOT_UI.some(rule => typeof rule === 'function' ? rule(v) : rule.test(v));
};

function dictionaryKeys() {
  const vm = require('vm');
  const sb = {
    console, Object, JSON, Array, String, Number, Boolean, RegExp, Date, Math,
    document: { readyState: 'complete', documentElement: {}, addEventListener() {},
      getElementById: () => ({ style: {} }), querySelectorAll: () => [] },
    localStorage: { getItem: () => null, setItem() {} },
  };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'), sb, { filename: 'js/i18n.js' });
  return sb.STRINGS;
}

/* Strip what cannot contain a user-visible literal: comments, and the argument
   of t()/tn() (already dictionary keys). Keeps line numbers intact. */
function strippable(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))   // block comments
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))
    .replace(/\btn?\(\s*'[^']*'/g, m => ' '.repeat(m.length));
}

/* Pull quoted literals off a line by scanning it, not by alternating regex.
   A regex like /'([^']+)'|"([^"]+)"/ happily matches from the closing quote of
   one string to the opening quote of the next, so `folderQuery=''; setView('x')`
   reports "; setView(" as a user-visible string. Scanning cannot do that. */
function quotedOn(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; let j = i + 1, buf = '';
      while (j < line.length && line[j] !== q) {
        if (line[j] === '\\') { buf += line[j + 1] ?? ''; j += 2; continue; }
        buf += line[j]; j++;
      }
      if (j >= line.length) break;        // unterminated on this line — stop
      if (q !== '`') out.push(buf);       // template literals handled separately
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}

function strayStrings(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const body = strippable(src);
  const hits = [];
  const push = (line, text) => hits.push({ line, text });
  const rawLines = src.split('\n');
  let inBlock = false;
  body.split('\n').forEach((line, i) => {
    const raw = rawLines[i] || '';
    if (EXEMPT_BEGIN.test(raw)) { inBlock = true; return; }
    if (inBlock) { if (EXEMPT_END.test(raw)) inBlock = false; return; }
    // marker may sit on the line itself or the line above, so a long reason
    // can be written as its own comment line
    if (EXEMPT.test(raw) || EXEMPT.test(rawLines[i - 1] || '')) return;
    // quoted literals
    for (const v of quotedOn(line)) {
      // a fragment left behind by stripping a t('key') call out of a template
      // literal is not a literal of its own
      if (/[${}]/.test(v)) continue;
      if (isUiString(v)) push(i + 1, v);
    }
    // text runs between tags inside template literals
    // Text between tags. Requires a letter to start and rejects anything
    // carrying operators, so `d>=-3 && d<=60` is not read as markup.
    for (const m of line.matchAll(/>([^<>{}$`'"]{3,})</g)) {
      const v = m[1];
      if (!/^\s*[A-Za-zÅÄÖåäö]/.test(v)) continue;
      if (/[=&|+]/.test(v)) continue;
      if (isUiString(v)) push(i + 1, v.trim());
    }
  });
  return hits;
}

/* Required by test/i18n-verify.js for the converted-module list, so the two
   harnesses cannot disagree about what counts as done. Only the CLI below is
   skipped on require. */
module.exports = { CONVERTED, strayStrings };
if (require.main !== module) return;

const args = process.argv.slice(2);
const layoutOnly = args.includes('--layout');
const targets = args.filter(a => !a.startsWith('--'));

/* ---------------- length risk ---------------- */
const STRINGS = dictionaryKeys();
const THRESHOLD = 0.40;
/* Keys whose text lands somewhere width-constrained: the 210px sidebar, a
   status/risk chip, a command-bar button, a board column heading. */
const TIGHT = /^(nav_|cmd_|status_|share_|stream_|approval_|role_|lang_|panel_|queue_|cal_wd_|cal_ev_|value_|risk_|report_tab_|report_kpi_)/;
const risks = Object.keys(STRINGS.en).map(k => {
  const en = String(STRINGS.en[k] ?? ''), sv = String(STRINGS.sv[k] ?? '');
  if (!en.length) return null;
  const growth = (sv.length - en.length) / en.length;
  return { k, en, sv, growth, tight: TIGHT.test(k) };
}).filter(r => r && r.growth > THRESHOLD).sort((a, b) => b.growth - a.growth);

if (layoutOnly || !targets.length) {
  const tight = risks.filter(r => r.tight), loose = risks.filter(r => !r.tight);
  const pct = n => (n * 100).toFixed(0) + '%';
  const rows = rs => rs.map(r => `| \`${r.k}\` | ${r.en} | ${r.sv} | +${pct(r.growth)} |`).join('\n');
  const md = `# LAYOUT_RISKS

Swedish values more than **${pct(THRESHOLD)}** longer than their English
counterpart. Swedish runs longer than English as a rule, so this is where the
build is most likely to *look* wrong while every test passes.

Regenerate with \`node test/i18n-audit.js --layout\`. Nothing here has been
seen rendered — this container cannot reach the CDN the app loads its
stylesheet from, so every entry needs a human with a browser.

## Width-constrained — check these first

These land in the 210px sidebar, a status or risk chip, a command-bar button,
or a board column heading, where there is no room to grow.

${tight.length ? `| Key | English | Swedish | Growth |\n|---|---|---|---|\n${rows(tight)}` : '_None._'}

## Elsewhere in the layout

Subtitles, empty states, dialog bodies and table cells — more forgiving, but
worth a glance for wrapping.

${loose.length ? `| Key | English | Swedish | Growth |\n|---|---|---|---|\n${rows(loose)}` : '_None._'}

---

**${risks.length}** of ${Object.keys(STRINGS.en).length} keys exceed the
threshold; **${tight.length}** of them are width-constrained.
`;
  fs.writeFileSync(path.join(ROOT, 'LAYOUT_RISKS.md'), md);
  console.log(`LAYOUT_RISKS.md written — ${risks.length} over ${pct(THRESHOLD)} (${tight.length} width-constrained)`);
  if (layoutOnly) process.exit(0);
}

/* ---------------- stray-string audit ---------------- */
const files = targets.length ? targets : CONVERTED.filter(f => f.endsWith('.js'));
let total = 0;
for (const f of files) {
  const hits = strayStrings(f);
  total += hits.length;
  if (!hits.length) { console.log(`CLEAN  ${f}`); continue; }
  console.log(`STRAY  ${f} — ${hits.length}`);
  for (const h of hits) console.log(`         ${f}:${h.line}  ${JSON.stringify(h.text)}`);
}
console.log(`\n${total === 0 ? 'AUDIT CLEAN' : 'AUDIT: ' + total + ' stray strings'} across ${files.length} module(s)`);
process.exit(total === 0 ? 0 : 1);
