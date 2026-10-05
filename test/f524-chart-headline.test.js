/* f524 — HEADLINE: THE CHART'S POINT ON THE SMALL CARD
   (Young picked "Headline", 5 Oct 2026, "Chart Reading Options")
   ============================================================================
   The browser half is chart-headline-verify; this pins, fast:
     (1) ONE READING — the line is hbHeadlineOf(hbReadingOf(…)), the same
         reading the enlarged card prints; no second counting;
     (2) NEVER THE TOTALS SAID AGAIN — the first sentence whose key is not in
         HB_HEAD_SKIP; a reading with no keys (stages, panels) leads with its
         first line; every chart reader records its keys;
     (3) WHERE — small cards only, under the totals; the enlarged card keeps
         its full reading and no headline; Value under contract and the
         ready-made panels wear it too (hbReadSrcHeadHtml);
     (4) READ MORE — opens the full reading block (with "What could explain
         this?") inside the same card; per sitting, never stored;
     (5) both books.
   Run: node --test test/f524-chart-headline.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const HB = read('js/views/homeboard.js');
const I18N = read('js/i18n.js');
const HTML = read('index.html');
const fn = name => { const i = HB.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return HB.slice(i, HB.indexOf('\n}\n', i) + 2); };

function load(){
  const ctx = {};
  vm.createContext(ctx);
  const skip = HB.match(/const HB_HEAD_SKIP = new Set\(\[[^\]]*\]\);/)[0];
  vm.runInContext(skip + '\n' + fn('hbHeadlineOf') + '\nthis.hbHeadlineOf = hbHeadlineOf; this.HB_HEAD_SKIP = HB_HEAD_SKIP;', ctx);
  return ctx;
}

describe('f524 (1)(2) the line is the reading\'s point', () => {
  test('the first sentence that is not the totals', () => {
    const w = load();
    assert.equal(w.hbHeadlineOf({ lines: ['30 contracts are counted here.', 'Most of them are in Jul and Aug.'], keys: ['hb_read_counted', 'hb_read_most_two'] }),
      'Most of them are in Jul and Aug.');
    assert.equal(w.hbHeadlineOf({ lines: ['KES 1B under contract.', '111 have no date.'], keys: ['hb_read_value', 'hb_read_none'] }), '111 have no date.');
    assert.equal(w.hbHeadlineOf({ lines: ['Only line.'], keys: ['hb_read_counted'] }), 'Only line.', 'a reading that is only totals still says something');
    assert.equal(w.hbHeadlineOf({ lines: ['Most of the value sits in Executed.'] }), 'Most of the value sits in Executed.', 'no keys: the first line');
    assert.equal(w.hbHeadlineOf(null), '');
    assert.equal(w.hbHeadlineOf({ lines: [] }), '');
  });
  test('the totals keys are the ones the readers write first', () => {
    for (const k of ['hb_read_value', 'hb_read_counted', 'hb_read_signed', 'hb_read_groups', 'hb_read_two', 'hb_read_avg'])
      assert.ok(load().HB_HEAD_SKIP.has(k), k);
    for (const k of ['hb_read_most_two', 'hb_read_busiest_two', 'hb_read_top', 'hb_read_cmp', 'hb_read_tl_soon'])
      assert.ok(!load().HB_HEAD_SKIP.has(k), k + ' is a point, not a total');
  });
  test('every chart reader records its keys beside its lines', () => {
    for (const n of ['hbReadCompareOf', 'hbReadTwoOf', 'hbReadingCore']){
      const f = fn(n);
      assert.match(f, /if \(l\)\{ lines\.push\(l\); keys\.push\(key\); \}/, n);
      assert.ok(!/return \{ lines, counts \}|\{ lines, counts \} : null/.test(f), n + ' returns its keys');
    }
    assert.match(fn('hbReadingOf'), /r\.lines\.push\(l\); r\.keys\.push\(key\);/);
  });
});

describe('f524 (3) where it is drawn', () => {
  test('a small chart: under the totals, from the one reading; enlarged: the full reading, no headline', () => {
    const f = fn('hbChartHtml');
    assert.match(f, /const head = big \? '' : hbHeadlineHtml\(D\.key, hbReadingOf\(D, cs, P, R\), cs\.length, hbWhySig\(D, P, cs\)\);/);
    assert.match(f, /<div class="hb-chart-lead">\$\{lead\}<span class="hb-chart-by">\$\{_hbE\(R\.by\)\}<\/span><\/div>\$\{head\}\$\{R\.body\}/, 'right under the totals, above the chart');
    assert.match(f, /\(!head && R\.say \?/, 'the trend arithmetic gives way to the point');
  });
  test('Value under contract and the ready-made panels wear it too', () => {
    assert.match(HB, /\$\{big \? hbReadSrcHtml\(D\.key\) : hbReadSrcHeadHtml\(D\.key\)\}<div class="hb-say">/);
    assert.match(HB, /\(p\.big \? hbReadSrcHtml\('hp:' \+ p\.kind\) : hbReadSrcHeadHtml\('hp:' \+ p\.kind\)\)/);
  });
});

describe('f524 (4) Read more', () => {
  test('opens the same block the enlarged card draws, per sitting', () => {
    const h = fn('hbHeadlineHtml');
    assert.match(h, /data-hb-read-more="\$\{_hbE\(key\)\}" aria-expanded="\$\{open\}"/);
    assert.match(h, /\(open \? hbReadBlockHtml\(key, reading, n, sig\) : ''\)/, 'the full reading, with "What could explain this?"');
    assert.match(HB, /const _hbReadOpen = new Set\(\);/, 'a sitting\'s fact');
    assert.ok(!/_hbReadOpen[^;\n]*hbSave|s\.readOpen/.test(HB), 'never stored');
    assert.match(HB, /if \(\(el = on\('\[data-hb-read-more\]'\)\)\)\{ hbReadMoreToggle\(el\.getAttribute\('data-hb-read-more'\)\); return; \}/);
    assert.ok(!/copilotAsk|fetch\(/.test(fn('hbReadMoreToggle') + h), 'the press spends nothing');
  });
  test('dressed in the board\'s own tokens', () => {
    assert.match(HTML, /\.hb-head-line\{[^}]*border-left:3px solid var\(--hb-glow\)/);
  });
});

describe('f524 (5) both books', () => {
  test('Read more and Show less, English and Swedish', () => {
    assert.match(I18N, /hb_head_more: "Read more",\n    hb_head_less: "Show less",/);
    assert.match(I18N, /hb_head_more: 'Läs mer',\n    hb_head_less: 'Visa mindre',/);
  });
});
