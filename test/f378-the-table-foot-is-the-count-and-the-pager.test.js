/* F378 — THE TABLE'S FOOT IS THE COUNT AND THE PAGER (Young ruled 24 Sep 2026)
   =========================================================================
   Over a screenshot of the Contracts page's foot — the VALUE STREAMS key and
   "40 per page" under it: *"delete this from both the contracts and
   negotiations pages."* Asked whether Negotiations' own note in that spot
   ("one page — every group whole") should go as well: *"Remove it too."*

   What went: the key and the page-size note from the one foot both pages
   share, and the key above the Contracts page's Board view (the same page in
   a second shape). What stays, as CONTROLS: the count, the pager, and My
   Queue's key — a separate page that draws the same board and was not named.

   WHY MOSTLY SOURCE CLAIMS. The node world cannot draw the whole register
   (its rows reach for the application shell), and it STUBS the key as an
   empty string — so a node render would pass "no key" on the parent and prove
   nothing. The painted page is measured in test/chromium/register-foot-verify.js.
   What IS driven here is the one builder that gained an option: the board. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

/* COMMENTS ARE PROSE — the notes beside this change quote the very names the
   sweeps look for. A sweep reads CODE. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const REG = strip(read('js/views/register.js'));
const QUEUE_SRC = read('js/views/queue.js');
const QUEUE = strip(QUEUE_SRC);
const I18N = read('js/i18n.js');

/* Every script the product runs, comments stripped — "not called anywhere" is
   a claim about all of them, not about the one file that used to call it. */
const JS_FILES = (function walk(dir, out){
  for (const f of fs.readdirSync(path.join(__dirname, '..', dir))) {
    const rel = path.join(dir, f);
    const st = fs.statSync(path.join(__dirname, '..', rel));
    if (st.isDirectory()) walk(rel, out);
    else if (/\.js$/.test(f)) out.push(rel);
  }
  return out;
})('js', []).concat(['server/server.js']);

/* The board builder, loaded on its own with the shell stood in for. An EMPTY
   list never reaches a card, so the stand-ins below are only the pieces the
   frame itself asks for — and the key is a SENTINEL, never an empty string,
   so "it is drawn" and "it is not" are two different answers. */
function board(){
  const KEY = '<div data-key="1">KEY</div>';
  const sb = {
    folderLegendHtml: () => KEY,
    fmtMoneyShort: v => 'KES ' + v,
    i18t: k => k,
    state: { contracts: [] },
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(QUEUE_SRC, sb, { filename: 'js/views/queue.js' });
  return { sb, KEY };
}

test('F378 — the table\'s foot is the count and the pager', async t => {

  await t.test('(1) the foot both pages share draws no value-streams key', () => {
    assert.ok(!/folderLegendHtml\s*\(/.test(REG),
      'the register calls the key builder nowhere — table foot, board, either seat');
  });

  await t.test('(2) and no page-size note, on either seat', () => {
    for (const f of JS_FILES) {
      const src = strip(read(f));
      assert.ok(!/i18t\(\s*['"]reg_per_page['"]/.test(src), `${f} still prints "N per page"`);
      assert.ok(!/i18t\(\s*['"]ngl_no_paging['"]/.test(src), `${f} still prints "one page — every group whole"`);
    }
  });

  await t.test('(3) [wall] the two sentences are retired by not calling them — inert in BOTH books', () => {
    /* A key removed from one dictionary and not the other is how a screen
       ends up half-English; retiring by not calling keeps both books whole. */
    assert.equal((I18N.match(/\breg_per_page:/g) || []).length, 2, 'reg_per_page is still in both books');
    assert.equal((I18N.match(/\bngl_no_paging:/g) || []).length, 2, 'ngl_no_paging is still in both books');
  });

  await t.test('(4) the Contracts page asks the board WITHOUT its key', () => {
    assert.match(REG, /pipeBoardHtml\(cs,\{legend:false\}\)/,
      'the Board view is the same page, so its key goes with the table\'s');
    assert.ok(!/pipeBoardHtml\(cs\)/.test(REG), 'and no call on this page still takes the default');
  });

  await t.test('(5) the board builder honours it — and its default is the old markup', () => {
    const { sb, KEY } = board();
    const off = sb.pipeBoardHtml([], { legend: false });
    assert.ok(off.indexOf(KEY) < 0, '{legend:false} draws no key');
    assert.match(off, /class="board-cols board-4"/, 'and still draws the four columns');
    /* CONTROL: the default is what My Queue gets, byte for byte the line it
       drew before this change. */
    const on = sb.pipeBoardHtml([]);
    assert.ok(on.indexOf(`<div style="flex:none;margin-bottom:10px">${KEY}</div>`) >= 0,
      'with no options the key is drawn exactly as before');
    assert.ok(sb.pipeBoardHtml([], {}).indexOf(KEY) >= 0, 'an options object that says nothing changes nothing');
  });

  await t.test('(6) [control] My Queue — not named — still draws its key', () => {
    assert.match(QUEUE, /function renderPipeline\(\)\{[\s\S]*?\$\{pipeBoardHtml\(state\.contracts\)\}/,
      'the My Queue page passes no options, so its key stays');
  });

  await t.test('(7) [control] the count and the pager are still the foot', () => {
    assert.equal((REG.match(/id="reg-showing"/g) || []).length, 2,
      'the count is drawn under the table and under the board');
    assert.match(REG, /<div id="reg-pager"[^>]*>\$\{regPager\(cs\)\}<\/div>/, 'the pager is still drawn');
    /* The page size is still said where it matters: "Showing 1–40 of 50 ·
       page 1 of 2". */
    assert.match(REG, /i18t\('reg_page_of',\{p,n\}\)/, 'the count still says which page of how many');
  });
});
