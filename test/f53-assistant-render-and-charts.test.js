/* f53 — the assistant's output is untrusted input, and its charts are not its own
   ============================================================
   Two claims, and they are the only two that matter about an AI surface:

   1. NOTHING THE MODEL WRITES CAN BECOME MARKUP. Its answer is shaped by the
      question, and a question can carry a counterparty's clause text — the
      negotiation screens put that text in the prompt. So the reply is treated
      as hostile: every non-markdown chunk is escaped, and a link only stays a
      link if its scheme is on an allow-list.

   2. THE MODEL NEVER SUPPLIES CHART DATA. It picks a KIND; the client builds
      the chart from live state with a fixed recipe. A model that invents a
      number gets to invent a SENTENCE, which a reader weighs — never a chart,
      which a reader reads as measured fact. `quoted` is the one exception and
      it is bounded, plain-number-only, and labelled on the card as the model's
      own figures. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const W = () => buildWorld({}).win;

describe('a reply cannot inject markup', () => {
  const w = W();
  test('a script tag renders as text', () => {
    const html = w.mdParse('Here is <script>alert(1)</script> for you');
    assert.ok(!/<script/i.test(html), 'got: ' + html);
    assert.match(html, /&lt;script&gt;/);
  });

  test('an img onerror renders as text', () => {
    const html = w.mdParse('![x](y) <img src=x onerror=alert(1)>');
    assert.ok(!/<img/i.test(html));
    assert.ok(!/onerror=/i.test(html.replace(/&\w+;/g, '')) || !/<img/i.test(html));
  });

  test('a javascript: link is not a link', () => {
    const html = w.mdParse('[click me](javascript:alert(1))');
    assert.ok(!/<a /.test(html), 'got: ' + html);
    assert.match(html, /click me/, 'but the words survive');
  });

  test('data: and vbscript: are refused too — an allow-list, not a block-list', () => {
    for (const u of ['data:text/html,<script>1</script>', 'vbscript:msgbox', 'VBScript:x'])
      assert.equal(w._mdSafeHref(u), null, u);
    for (const u of ['https://x.co', 'http://x.co', 'mailto:a@b.co', '#top', '/docs'])
      assert.ok(w._mdSafeHref(u), u);
  });

  test('an https link IS a link, and cannot be tabnabbed', () => {
    const html = w.mdParse('[HaTi](https://example.co.ke)');
    assert.match(html, /<a href="https:\/\/example\.co\.ke"/);
    assert.match(html, /rel="noopener noreferrer nofollow"/);
  });

  test('markup inside a code span stays literal', () => {
    const html = w.mdParse('Use `<b>bold</b>` here');
    assert.match(html, /<code>&lt;b&gt;bold&lt;\/b&gt;<\/code>/);
  });

  test('a tone marker cannot carry markup', () => {
    const html = w.aiRichText('{!<script>alert(1)</script>}');
    assert.ok(!/<script/i.test(html), 'got: ' + html);
  });
});

describe('markdown renders as markdown', () => {
  const w = W();
  test('headings, lists, bold and code', () => {
    const html = w.mdParse('## Renewals\n\n- **Naivas** expires soon\n- Siginon is `signed`\n');
    assert.match(html, /<h2 class="ai-h">Renewals<\/h2>/);
    assert.match(html, /<ul[^>]*class="ai-list"/);
    assert.match(html, /<strong>Naivas<\/strong>/);
    assert.match(html, /<code>signed<\/code>/);
  });

  test('a numbered list keeps its numbering', () => {
    const html = w.mdParse('3. third\n4. fourth');
    assert.match(html, /<ol start="3"/);
  });

  test('a table', () => {
    const html = w.mdParse('| Contract | Value |\n|---|---:|\n| MK-1 | 100 |');
    assert.match(html, /<table class="ai-table">/);
    assert.match(html, /<th[^>]*>Contract<\/th>/);
    assert.match(html, /<td style="text-align:right">100<\/td>/);
  });

  test('a fenced block is shown, not executed', () => {
    const html = w.mdParse('```\n<b>x</b>\n```');
    assert.match(html, /<pre class="ai-code"><code>&lt;b&gt;x&lt;\/b&gt;<\/code><\/pre>/);
  });

  test('tone markers colour, and only the four', () => {
    const html = w.aiToneHtml('{+signed} {-lapsed} {!9 days} {~standard} {?unknown}');
    assert.match(html, /class="ai-tone ai-tone-pos">signed</);
    assert.match(html, /class="ai-tone ai-tone-neg">lapsed</);
    assert.match(html, /class="ai-tone ai-tone-warn">9 days</);
    assert.match(html, /class="ai-tone ai-tone-mut">standard</);
    assert.match(html, /\{\?unknown\}/, 'an unknown marker is left alone, not swallowed');
  });
});

/* ---- NO BRACE REACHES THE PAGE (Young reported it 20 Sep 2026) ----
   "In hati where copilot generates information like in the attached copilots
   read and in the chatbot i see this sign {} being generated."

   THE MARKERS ARE THE PRODUCT'S OWN SYNTAX AND THE READER MUST NEVER SEE
   THEM. Every shape below was reproduced against the real renderer before a
   line of the fix was written, and each one is a way the model garbles the
   convention it was handed — which is not a fault it will stop having, so the
   RENDERER is the wall rather than the prompt. */
describe('the tone markers never leave their braces on the page', () => {
  const w = W();
  /* The one reading both surfaces use: the chat panel's aiFmt and the Insights
     dock's igFmtRich each end at aiRichText. Asked through it, so a second
     surface cannot be fixed and the first left behind. */
  const seen = src => w.aiRichText(src).replace(/<[^>]+>/g, '');

  test('DOUBLED BRACES fold to one span — all four counts', () => {
    /* MEASURED at the parent: {{+78%}} matched the INNER pair and left the
       outer ones standing, which is the "{ 78% }" in the owner's screenshot;
       an unbalanced pair left exactly one brace behind, which is the bare "}"
       beside three other figures on the same report. */
    for (const src of ['{+78%}', '{{+78%}}', '{{+78%}', '{+78%}}']){
      const html = w.aiRichText('getting ' + src + ' through');
      assert.match(html, /class="ai-tone ai-tone-pos">78%</, src + ' still colours');
      assert.ok(!/[{}]/.test(seen('getting ' + src + ' through')),
        src + ' left a brace on the page');
    }
  });

  test('A BOLD FIGURE INSIDE A MARKER is what the prompt ASKS FOR, and it colours', () => {
    /* AI_TONE_RULES rule 1: bold every figure. Rule 2: wrap the verdict in a
       marker. A marker round a figure therefore carries bold BY INSTRUCTION,
       and the old body class [^{}<>] refused the "<" that mdParse produced. */
    const html = w.aiRichText('adds {-**0.6 extra rounds**} when contested');
    assert.match(html, /class="ai-tone ai-tone-neg"><strong>0\.6 extra rounds<\/strong><\/span>/);
    assert.ok(!/[{}]/.test(seen('adds {-**0.6 extra rounds**} when contested')));
  });

  test('A DOUBLED BRACE WITH NO TONE CHARACTER is unwrapped, and given no colour', () => {
    /* The owner's report carried "{{2.0 rounds per deal}}" rendered literally.
       Which tone was meant is not knowable, so the words are kept and NOTHING
       is coloured — picking one would be the product asserting a verdict
       nobody wrote. */
    const src = 'they take {{2.0 rounds per deal}} over 2 deals';
    assert.equal(seen(src), 'they take 2.0 rounds per deal over 2 deals');
    assert.ok(!/ai-tone/.test(w.aiRichText(src)), 'no colour is invented');
  });

  test('THE WALL: a template blank keeps its braces', () => {
    /* {{lower_snake_case}} is this product's own syntax — AI_TEMPLATE_RULE
       asks the model for {{counterparty}}, one identifier by instruction — and
       a reader who asks Copilot how to mark a blank must get the braces back.
       The guard is that a blank is ONE WORD and emphasis is a PHRASE. */
    assert.match(seen('write it as {{counterparty}} in the section'), /\{\{counterparty\}\}/);
    assert.match(seen('use {{notice_days}} there'), /\{\{notice_days\}\}/);
  });

  test('AN UNFINISHED MARKER loses its syntax and keeps its words', () => {
    assert.equal(seen('a deadlock at {!three deals still open'),
      'a deadlock at three deals still open');
  });

  test('A MARKER ACROSS A BLANK LINE leaves neither brace', () => {
    /* mdParse puts a paragraph boundary through it and no span may wrap that,
       so the opener would be swept and the closer stranded in the NEXT
       paragraph — a "}" on the page. Taken off on the raw text instead. */
    const html = w.aiRichText('open {+one\n\ntwo} close');
    assert.ok(!/[{}]/.test(html.replace(/<[^>]+>/g, '')), 'got: ' + html);
    assert.ok(!/<span class="ai-tone[^"]*">[^<]*<\/p>/.test(html),
      'and no span is wrapped round a paragraph boundary');
  });

  test('A TONE SPAN NEVER WRAPS A BLOCK TAG', () => {
    /* The body was widened to admit the inline markup mdParse makes, and it is
       a NAMED list rather than <[^<>]*> for exactly this reason. */
    const html = w.aiRichText('first {+good}\n\nsecond {-bad}');
    assert.equal((html.match(/class="ai-tone/g) || []).length, 2, 'both colour');
    assert.ok(!/<span class="ai-tone[^"]*">(?:(?!<\/span>)[\s\S])*<p\b/.test(html));
  });

  test('ORDINARY PROSE IS UNTOUCHED', () => {
    const src = 'nothing to mark here at all, and no figure either';
    assert.equal(seen(src), src);
    assert.ok(!/ai-tone/.test(w.aiRichText(src)));
  });
});

describe('charts are built from state, never from the reply', () => {
  function seeded(){
    const w = W();
    w.state = { contracts: [
      { id:'MK-1', name:'Supply', counterparty:'Naivas', status:'Signed', folder:'proc',
        value:4000000, expiry:'2026-09-30', signedAt:'2026-02-01', audit:[] },
      { id:'MK-2', name:'3PL', counterparty:'Siginon', status:'Under Review', folder:'dist',
        value:2500000, expiry:'2026-11-15', audit:[] },
      { id:'MK-3', name:'Lease', counterparty:'Britam', status:'Draft', folder:'corp',
        value:1200000, audit:[] },
    ] };
    return w;
  }

  test('a block is pulled out before the markdown renderer ever sees it', () => {
    const w = seeded();
    const src = 'See the chart.\n\n```hati-chart\n{ "kind": "statusBreakdown" }\n```\n\nThat is all.';
    const { text, blocks } = w.aiExtractCharts(src, 0);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].spec.kind, 'statusBreakdown');
    assert.ok(!/hati-chart/.test(text), 'the fence is gone from the text');
    assert.ok(!/"kind"/.test(w.mdParse(text)), 'so no JSON can reach the reader');
  });

  test('the recipe reads live state, so the chart cannot disagree with the app', () => {
    const w = seeded();
    const cfg = w.AI_CHART_RECIPES.statusBreakdown();
    assert.deepEqual(Array.from(cfg.data.labels), ['Draft', 'Under Review', 'Signed', 'Declined']);
    assert.deepEqual(Array.from(cfg.data.datasets[0].data), [1, 1, 1, 0]);
    w.state.contracts.push({ id:'MK-4', name:'x', status:'Draft', audit:[] });
    assert.deepEqual(Array.from(w.AI_CHART_RECIPES.statusBreakdown().data.datasets[0].data), [2, 1, 1, 0],
      'rebuilt from state every time — never cached alongside the answer');
  });

  test('value charts read the counterparties that are really there', () => {
    const w = seeded();
    const cfg = w.AI_CHART_RECIPES.valueByCounterparty();
    assert.deepEqual(Array.from(cfg.data.labels), ['Naivas', 'Siginon', 'Britam']);
    assert.deepEqual(Array.from(cfg.data.datasets[0].data), [4000000, 2500000, 1200000]);
    assert.equal(cfg.options.indexAxis, 'y', 'names are words, so the bars run across');
  });

  test('an empty portfolio draws nothing rather than an empty axis', () => {
    const w = W(); w.state = { contracts: [] };
    for (const k of Object.keys(w.AI_CHART_RECIPES))
      assert.equal(w.AI_CHART_RECIPES[k](), null, k + ' must return null, not a blank chart');
  });

  test('no data becomes a sentence, not a broken card', () => {
    const w = W(); w.state = { contracts: [] };
    const html = w.aiChartHtml({ key:'k', spec:{ kind:'statusBreakdown' } });
    assert.match(html, /no data in your portfolio/i);
    assert.ok(!/canvas/.test(html));
  });

  test('an invalid kind is an error card, never raw JSON', () => {
    const w = seeded();
    const html = w.aiChartHtml({ key:'k', spec:{ kind:'profitForecast', title:'x' } });
    assert.match(html, /not a chart HaTi knows how to draw/);
    assert.ok(!/"kind"/.test(html), 'got: ' + html);
  });

  test('an unreadable block is an error card too', () => {
    const w = seeded();
    const { blocks } = w.aiExtractCharts('```hati-chart\n{ not json\n```', 0);
    assert.match(w.aiChartHtml(blocks[0]), /could not be read/);
  });

  test('an unknown series is named, and refused', () => {
    const w = seeded();
    const r = w.aiCustomConfig({ kind:'custom', datasets:[{ series:'revenue.ebitda' }] });
    assert.match(r.error, /Unknown series: revenue\.ebitda/);
  });

  test('a chart mixing money with counts is refused', () => {
    const w = seeded();
    const r = w.aiCustomConfig({ kind:'custom',
      datasets:[{ series:'value.expiring' }, { series:'renewals.due' }] });
    assert.match(r.error, /mixes money with counts/);
  });

  test('and one that does not is built', () => {
    const w = seeded();
    const r = w.aiCustomConfig({ kind:'custom',
      datasets:[{ series:'contracts.expiring', display:'bar' }] });
    assert.ok(r.config, r.error || 'no config');
    assert.equal(r.config.data.labels.length, 12, 'twelve months, including the empty ones');
  });

  test('every catalog key the model is given actually resolves', () => {
    const w = seeded();
    const all = w.aiAllSeries();
    const listed = w.aiSeriesCatalogText().match(/^ {2}([\w.-]+) —/gm).map(s => s.trim().split(' ')[0]);
    assert.ok(listed.length >= 5);
    for (const k of listed) assert.ok(all[k], 'catalog lists a key that does not exist: ' + k);
  });

  test('the catalog names this workspace\'s real counterparties', () => {
    const w = seeded();
    const cat = w.aiSeriesCatalogText();
    assert.match(cat, /counterparty\.naivas/);
    assert.match(cat, /never invent one/);
  });

  /* The one kind carrying the model's own numbers, and it is fenced in. */
  test('quoted accepts plain numbers, between two and twelve', () => {
    const w = seeded();
    assert.ok(w.aiQuotedConfig({ items:[{label:'a',value:1},{label:'b',value:2}] }));
    assert.equal(w.aiQuotedConfig({ items:[{label:'a',value:1}] }), null, 'one bar is not a chart');
    assert.equal(w.aiQuotedConfig({ items:Array.from({length:13},(_,i)=>({label:'x',value:i})) }), null);
  });

  test('quoted refuses anything that is not already a number', () => {
    const w = seeded();
    for (const bad of ['12', '1+1', null, {}, NaN, Infinity])
      assert.equal(w.aiQuotedConfig({ items:[{label:'a',value:bad},{label:'b',value:2}] }), null,
        'accepted ' + String(bad));
  });

  test('and the card says the figures are the model\'s, not the record\'s', () => {
    const w = seeded();
    const html = w.aiChartHtml({ key:'k', spec:{ kind:'quoted', label:'Stated',
      items:[{label:'a',value:1},{label:'b',value:2}] } });
    assert.match(html, /as stated in this answer, not read from your records/i);
  });
});

describe('charts are cleaned up', () => {
  test('destroying all empties the registry and calls destroy on each', () => {
    const w = W();
    let destroyed = 0;
    w.AI_CHARTS.set('aichart-0-0', { destroy(){ destroyed++; } });
    w.AI_CHARTS.set('aichart-0-1', { destroy(){ destroyed++; } });
    w.aiChartDestroyAll();
    assert.equal(destroyed, 2, 'a Chart holds a canvas, listeners and a frame');
    assert.equal(w.AI_CHARTS.size, 0);
  });

  test('the sweep drops charts whose message is no longer on the screen', () => {
    const w = W();
    let destroyed = 0;
    w.AI_CHARTS.set('aichart-9-9', { destroy(){ destroyed++; } });
    w.aiChartSweep();
    assert.equal(destroyed, 1, 'the feed is rebuilt wholesale — the old canvas is detached');
    assert.equal(w.AI_CHARTS.size, 0);
  });
});

describe('a chart spec never leaks onto a surface with no chart pipeline', () => {
  const w = W();
  test('a fenced hati-chart block is stripped', () => {
    const out = w._sanitizeAIMarkdown('Summary.\n\n```hati-chart\n{"kind":"statusBreakdown"}\n```\n\nEnd.');
    assert.ok(!/hati-chart|"kind"/.test(out), 'got: ' + out);
    assert.match(out, /Summary\.[\s\S]*End\./);
  });

  test('a json fence carrying a spec is stripped, an ordinary one is not', () => {
    assert.ok(!/kind/.test(w._sanitizeAIMarkdown('```json\n{"kind":"custom"}\n```')));
    assert.match(w._sanitizeAIMarkdown('```json\n{"clause":"7.1"}\n```'), /clause/);
  });

  test('a bare unfenced spec is stripped', () => {
    const out = w._sanitizeAIMarkdown('Here it is\n{ "kind": "expiryTimeline", "title": "x" }\nDone');
    assert.ok(!/"kind"/.test(out), 'got: ' + out);
  });
});
