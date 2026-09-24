/* ============================================================
   F377 — THE PROTOTYPE'S FACES ACROSS THE PLATFORM (owner-asked 24 Sep 2026)
   ============================================================
   "change the font in HaTi to match the prototype approach across the
   platform." The prototype makes three decisions and each lands on one token:
     screens            --font-heading / --font-body   Geist
     numbers and codes  --font-mono                    Geist (tabular digits, no typewriter)
     the contract       --font-doc                     Source Serif 4
   IBM Plex Sans stays named SECOND: Geist carries no Greek, and a name written
   in Greek must still read in a designed face (F85's reason).

   Every claim below is RED at the parent: there the tokens name IBM Plex Sans
   and JetBrains Mono, and neither new stylesheet exists. The WALLS are named. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const NCSS = fs.readFileSync(path.join(ROOT, 'js', 'views', 'negotiation-css.js'), 'utf8');
const token = n => { const m = new RegExp('--' + n + ':([^;]+);').exec(HTML); return m ? m[1].trim() : ''; };

let h;
before(async () => { h = await startHati(); });
after(async () => { await h.stop(); });

describe('F377 (1) the three decisions, one token each', () => {
  test('screens read Geist, with IBM Plex Sans named second', () => {
    for (const t of ['font-heading', 'font-body']) {
      assert.match(token(t), /^'Geist',\s*'IBM Plex Sans'/, `--${t} is ${token(t)}`);
    }
  });
  test('figures read the platform face, not a typewriter face', () => {
    assert.equal(token('font-mono'), token('font-body'),
      'the prototype draws figures in its platform face — the two tokens must say the same thing');
    assert.doesNotMatch(token('font-mono'), /JetBrains/);
  });
  test('the contract reads Source Serif 4, falling back to serifs', () => {
    assert.match(token('font-doc'), /^'Source Serif 4'/);
    assert.match(token('font-doc'), /serif\s*$/, 'a paper face that falls back to a sans is not a book face');
  });
  test('[wall] the SHA-256 fingerprint and the keyboard chip keep a true monospace', () => {
    assert.match(token('font-code'), /monospace\s*$/);
  });
});

describe('F377 (2) the files are in the repo and the server serves them', () => {
  test('index.html links both new stylesheets, and keeps fonts.css for the fallback', () => {
    assert.match(HTML, /<link rel="stylesheet" href="fonts\/geist\.css">/);
    assert.match(HTML, /<link rel="stylesheet" href="fonts\/source-serif-4\.css">/);
    assert.match(HTML, /<link rel="stylesheet" href="fonts\/fonts\.css">/, 'Plex must still load, or the Greek fallback names a face nobody has');
  });
  test('Geist is inlined and covers Latin and Cyrillic', async () => {
    const r = await fetch(h.base + '/fonts/geist.css');
    assert.equal(r.status, 200);
    const css = await r.text();
    assert.match(css, /font-family:'Geist'/);
    assert.match(css, /src:url\(data:font\/woff2;base64,/, 'the chrome face is inlined so it never flashes a system face');
    assert.match(css, /U\+0000-00FF/, 'Latin');
    assert.match(css, /U\+0400-045F/, 'Cyrillic');
  });
  test('Source Serif 4 is served as files, and every file it names answers', async () => {
    const r = await fetch(h.base + '/fonts/source-serif-4.css');
    assert.equal(r.status, 200);
    const css = await r.text();
    assert.match(css, /font-family:'Source Serif 4'/);
    assert.match(css, /font-style:italic/, 'the paper has italics');
    const files = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m => m[1]);
    assert.ok(files.length >= 8, `${files.length} files named`);
    for (const f of files) {
      const fr = await fetch(h.base + '/fonts/' + f);
      assert.equal(fr.status, 200, `${f} is named in the stylesheet and the server answered ${fr.status}`);
    }
    assert.match(css, /U\+0370/, 'the paper carries modern Greek itself');
  });
});

describe('F377 (3) every heading on the paper reads the paper\'s face', () => {
  test('the negotiate page\'s title and clause headings name --font-doc', () => {
    assert.match(NCSS, /\.rl-paper :is\(h1,h2,h3,h4,h5,h6\)\{font-family:var\(--font-doc\)\}/,
      'a clause heading is an h4 and took the shell\'s heading face');
    assert.match(NCSS, /\.rl-paper-title\{margin:10px 0 0;font-family:var\(--font-doc\);/);
  });
  test('the kicker above the title is a label, and reads the platform face', () => {
    assert.match(NCSS, /\.rl-paper-kick,\.rl-paper-kick p\{font-family:var\(--font-body\);/);
  });
});
