// HaTi — charts inside a Copilot answer. Globals window-attached like every
// module.
//
// THE RULE THAT MAKES THIS SAFE: THE MODEL NEVER SUPPLIES THE DATA.
//
// It emits a fenced block naming a chart KIND and nothing else. The client
// pulls those blocks out before the markdown renderer sees them, drops a
// placeholder in their place, and then hydrates each placeholder from LIVE
// APPLICATION STATE using a fixed recipe.
//
// So a chart in a chat answer is built by the same code, from the same records,
// as the dashboard beside it. It cannot drift, it cannot be stale, and it
// cannot be hallucinated — a model that invents a number gets to invent a
// SENTENCE, which the reader can weigh, and never a chart, which the reader
// reads as measured fact.
//
// The one exception is `quoted`, where the model supplies values it has already
// stated in the same reply. It is bounded, plain-number-only, and labelled as
// the model's own figures — see AI_CHART_RULES.

/* Chart.js, fetched on first use. Not in index.html's <head>, because most
   sessions never ask a question that draws one and this is 200KB. A workspace
   with no outbound network gets the graceful card rather than a broken panel —
   the same treatment as a recipe with no data. */
const AI_CHART_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
let _chartLib = null;
function aiChartLib(){
  if (_chartLib) return _chartLib;
  _chartLib = new Promise((resolve, reject) => {
    if (window.Chart) return resolve(window.Chart);
    const s = document.createElement('script');
    s.src = AI_CHART_CDN;
    s.async = true;
    s.onload = () => window.Chart ? resolve(window.Chart) : reject(new Error('Chart.js did not load'));
    s.onerror = () => reject(new Error('Chart.js could not be fetched'));
    document.head.appendChild(s);
  }).catch(e => { _chartLib = null; throw e; });
  return _chartLib;
}

/* Every live chart, keyed `aichart-<msgIdx>-<blockIdx>`. One registry so
   clearing the conversation is one pass: a Chart.js instance holds its canvas,
   its listeners and its animation frame, and dropping the DOM without calling
   destroy() leaks all three. */
const AI_CHARTS = new Map();
function aiChartDestroy(key){
  const ch = AI_CHARTS.get(key);
  if (ch){ try{ ch.destroy(); }catch(_){} AI_CHARTS.delete(key); }
}
function aiChartDestroyAll(){
  for (const key of Array.from(AI_CHARTS.keys())) aiChartDestroy(key);
}
/* Charts belonging to messages that are no longer on the screen. Called after
   every feed repaint, because the feed is rebuilt wholesale and a canvas from
   the previous paint is detached but still animating. */
function aiChartSweep(){
  for (const key of Array.from(AI_CHARTS.keys()))
    if (!document.getElementById(key)) aiChartDestroy(key);
}

/* ---------- reading live state ---------- */
const _acContracts = () => ((window.state && Array.isArray(state.contracts)) ? state.contracts : [])
  .filter(c => c && c.status !== 'Declined');
const _acAll = () => ((window.state && Array.isArray(state.contracts)) ? state.contracts : []);
const _acMoney = n => (typeof window.fmtMoney === 'function' ? fmtMoney(n) : `${typeof jxCurrency==='function'?jxCurrency():''} ` + Number(n || 0).toLocaleString());
const _acVal = c => Number((c && c.value) || 0);
const _acExpiry = c => (typeof window.effectiveExpiry === 'function' ? effectiveExpiry(c) : (c && c.expiry)) || null;
const _acDays = iso => (typeof window.daysUntil === 'function' ? daysUntil(iso)
  : Math.ceil((new Date(iso + 'T00:00:00') - Date.now()) / 86400000));
/* An obligation's due date and its state, read the way the rest of the product
   reads them — see js/obligations.js. A chart is a claim about the portfolio,
   so it has to be counting the same things every other surface counts. */
const _acDue = o => (typeof window.obligationDue === 'function' ? obligationDue(o) : ((o && o.due) || null));
const _acObState = o => (typeof window.obState === 'function' ? obState(o)
  : ((o && o.status === 'done') ? 'done' : 'open'));
const _acMonthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const _acMonthLabel = k => {
  const [y, m] = String(k).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' });
};
/* The next N months as keys, so a month with nothing in it still appears —
   a gap in a timeline is information, and a chart that silently skips empty
   months tells the reader the deals are evenly spread when they are not. */
function _acMonthsAhead(n){
  const out = [], now = new Date();
  for (let i = 0; i < n; i++) out.push(_acMonthKey(new Date(now.getFullYear(), now.getMonth() + i, 1)));
  return out;
}
const AC_INK = '#33475c', AC_ACCENT = '#5980a6', AC_GOOD = '#2e8763', AC_WARN = '#b8862b', AC_BAD = '#b0453c';
const _acGrid = { color: 'rgba(38,55,74,.08)' };

/* A Chart.js config, with the house style applied once. Money axes format
   through the app's own currency helper, so a display-currency change is
   picked up by every chart without a single recipe knowing it happened. */
function _acConfig(type, data, opts = {}){
  const money = opts.unit === 'money';
  return { type, data, options: {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 220 },
    plugins: {
      legend: { display: opts.legend !== false && (data.datasets || []).length > 1,
        labels: { boxWidth: 10, font: { size: 10 }, color: AC_INK } },
      tooltip: { callbacks: { label: ctx => {
        const v = ctx.parsed.y != null ? ctx.parsed.y : ctx.parsed.x;
        const name = ctx.dataset.label ? ctx.dataset.label + ': ' : '';
        return name + (ctx.dataset._unit === 'money' || money ? _acMoney(v) : v);
      } } },
    },
    scales: opts.scales || {
      x: { stacked: !!opts.stacked, grid: { display: false }, ticks: { font: { size: 10 }, color: AC_INK } },
      y: { stacked: !!opts.stacked, beginAtZero: true, grid: _acGrid,
        ticks: { font: { size: 10 }, color: AC_INK,
          callback: v => money ? _acMoney(v) : v } },
    },
  } };
}

/* ---------- the fixed recipes ----------
   Pure functions of live state. `null` means "there is nothing to draw", which
   the caller turns into a plain sentence rather than an empty axis — an empty
   chart looks like a broken chart. */
const AI_CHART_RECIPES = {
  statusBreakdown(){
    const order = ['Draft', 'Under Review', 'Signed', 'Declined'];
    const cs = _acAll();
    if (!cs.length) return null;
    const counts = order.map(s => cs.filter(c => c.status === s).length);
    if (!counts.some(Boolean)) return null;
    return _acConfig('bar', { labels: order, datasets: [{ label: 'Contracts', data: counts,
      backgroundColor: [ '#98989b', AC_WARN, AC_GOOD, AC_BAD ], borderRadius: 4 }] },
      { legend: false });
  },

  expiryTimeline(){
    const months = _acMonthsAhead(12);
    const buckets = Object.fromEntries(months.map(m => [m, 0]));
    let any = false;
    for (const c of _acContracts()){
      const e = _acExpiry(c);
      if (!e) continue;
      const k = String(e).slice(0, 7);
      if (k in buckets){ buckets[k]++; any = true; }
    }
    if (!any) return null;
    /* Banded by urgency, because "when" is the whole question: the next
       quarter is the one somebody has to act on this month. */
    const colour = (_, i) => i < 3 ? AC_BAD : i < 6 ? AC_WARN : AC_ACCENT;
    return _acConfig('bar', { labels: months.map(_acMonthLabel),
      datasets: [{ label: 'Contracts expiring', data: months.map(m => buckets[m]),
        backgroundColor: months.map(colour), borderRadius: 4 }] }, { legend: false });
  },

  valueByCounterparty(){
    const by = new Map();
    for (const c of _acContracts()){
      const k = (c.counterparty || '').trim() || 'Unnamed';
      by.set(k, (by.get(k) || 0) + _acVal(c));
    }
    const top = [...by.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (!top.length) return null;
    /* Horizontal, because counterparty names are words and a vertical bar chart
       turns them into rotated stubs nobody reads. */
    const cfg = _acConfig('bar', { labels: top.map(x => x[0]),
      datasets: [{ label: 'Contract value', data: top.map(x => x[1]),
        backgroundColor: AC_ACCENT, borderRadius: 4, _unit: 'money' }] },
      { legend: false, unit: 'money', scales: {
        x: { beginAtZero: true, grid: _acGrid,
          ticks: { font: { size: 10 }, color: AC_INK, callback: v => _acMoney(v) } },
        y: { grid: { display: false }, ticks: { font: { size: 10 }, color: AC_INK } } } });
    cfg.options.indexAxis = 'y';
    return cfg;
  },

  renewalPipeline(){
    if (typeof window.renewalDecisionDate !== 'function') return null;
    const months = _acMonthsAhead(12);
    const count = Object.fromEntries(months.map(m => [m, 0]));
    const value = Object.fromEntries(months.map(m => [m, 0]));
    let any = false;
    for (const c of _acContracts()){
      const d = renewalDecisionDate(c);
      if (!d) continue;
      const k = String(d).slice(0, 7);
      if (k in count){ count[k]++; value[k] += _acVal(c); any = true; }
    }
    if (!any) return null;
    const cfg = _acConfig('bar', { labels: months.map(_acMonthLabel), datasets: [
      { type: 'bar', label: 'Value up for renewal', data: months.map(m => value[m]),
        backgroundColor: AC_ACCENT, borderRadius: 4, yAxisID: 'y', _unit: 'money' },
      { type: 'line', label: 'Decisions due', data: months.map(m => count[m]),
        borderColor: AC_WARN, backgroundColor: AC_WARN, tension: .3, yAxisID: 'y1' },
    ] }, { unit: 'money' });
    cfg.options.scales = {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: AC_INK } },
      y: { beginAtZero: true, position: 'left', grid: _acGrid,
        ticks: { font: { size: 10 }, color: AC_INK, callback: v => _acMoney(v) } },
      y1: { beginAtZero: true, position: 'right', grid: { display: false },
        ticks: { font: { size: 10 }, color: AC_INK, precision: 0 } },
    };
    return cfg;
  },

  /* NOT jurisdictionSplit. There is no jurisdiction field on a HaTi contract
     and the workspace is single-jurisdiction — inventing one to satisfy a
     chart would put a made-up legal fact on a chart axis. The app's own
     segmentation is the value stream, and that is real. */
  valueStreamSplit(){
    const F = (typeof window.FOLDERS === 'object' && FOLDERS) || {};
    const ids = Object.keys(F);
    if (!ids.length) return null;
    const cs = _acContracts();
    const count = ids.map(id => cs.filter(c => c.folder === id).length);
    const value = ids.map(id => cs.filter(c => c.folder === id).reduce((s, c) => s + _acVal(c), 0));
    if (!count.some(Boolean)) return null;
    const cfg = _acConfig('bar', { labels: ids.map(id => F[id].name), datasets: [
      { type: 'bar', label: 'Contracts', data: count, backgroundColor: AC_ACCENT, borderRadius: 4, yAxisID: 'y' },
      { type: 'line', label: 'Value', data: value, borderColor: AC_GOOD, backgroundColor: AC_GOOD,
        tension: .3, yAxisID: 'y1', _unit: 'money' },
    ] });
    cfg.options.scales = {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, color: AC_INK } },
      y: { beginAtZero: true, position: 'left', grid: _acGrid, ticks: { font: { size: 10 }, color: AC_INK, precision: 0 } },
      y1: { beginAtZero: true, position: 'right', grid: { display: false },
        ticks: { font: { size: 10 }, color: AC_INK, callback: v => _acMoney(v) } },
    };
    return cfg;
  },

  /* Derived from the audit trail, which is the only place the app records WHEN
     a contract moved. A contract whose trail does not carry both ends is left
     out rather than guessed at; if none of them do, there is no chart. */
  cycleTime(){
    const at = (c, re) => { const e = (c.audit || []).find(x => re.test(x.action || '')); return e ? Date.parse(e.at) : NaN; };
    const spans = { 'Draft → review': [], 'Review → signed': [] };
    for (const c of _acAll()){
      const made = at(c, /^Created$/i), rev = at(c, /^Status changed$|^Shared$/i), sig = at(c, /^Signed$|^Countersigned$/i);
      if (made && rev && rev >= made) spans['Draft → review'].push((rev - made) / 86400000);
      if (rev && sig && sig >= rev) spans['Review → signed'].push((sig - rev) / 86400000);
    }
    const labels = Object.keys(spans).filter(k => spans[k].length);
    if (!labels.length) return null;
    const avg = labels.map(k => Math.round(spans[k].reduce((a, b) => a + b, 0) / spans[k].length));
    return _acConfig('bar', { labels, datasets: [{ label: 'Average days', data: avg,
      backgroundColor: AC_ACCENT, borderRadius: 4 }] }, { legend: false });
  },

  obligationsDue(){
    if (typeof window.allObligations !== 'function') return null;
    const months = _acMonthsAhead(6);
    const open = Object.fromEntries(months.map(m => [m, 0]));
    let overdue = 0, any = false;
    for (const o of allObligations()){
      /* `o.done` is a field no obligation has ever carried — completion is
         `status === 'done'`, which is what obState() reads. Every completed
         obligation in the workspace was being drawn as still open. And the due
         date goes through the same normaliser the calendar uses, or one typed
         "31 March 2027" landed in no month and in no overdue bar either. */
      if (_acObState(o) === 'done') continue;
      const due = _acDue(o);
      if (!due){ continue; }
      if (_acDays(due) < 0){ overdue++; any = true; continue; }
      const k = String(due).slice(0, 7);
      if (k in open){ open[k]++; any = true; }
    }
    if (!any) return null;
    const labels = ['Overdue'].concat(months.map(_acMonthLabel));
    const data = [overdue].concat(months.map(m => open[m]));
    return _acConfig('bar', { labels, datasets: [{ label: 'Open obligations', data,
      backgroundColor: labels.map((_, i) => i === 0 ? AC_BAD : AC_ACCENT), borderRadius: 4 }] },
      { legend: false });
  },
};

/* ---------- the series catalog, for `custom` ----------
   Every series is month-indexed on the same x-axis, so two of them in one chart
   are always comparable. The unit is declared here and enforced at build time:
   a chart mixing KES with a count has two different meanings on one axis, which
   is a chart that lies without stating a single false number. */
const AI_SERIES = {
  'contracts.signed':    { label: 'Contracts signed',       unit: 'count',
    at: (cs, k) => cs.filter(c => c.status === 'Signed' && String(c.signedAt || '').slice(0, 7) === k).length },
  'contracts.expiring':  { label: 'Contracts expiring',     unit: 'count',
    at: (cs, k) => cs.filter(c => String(_acExpiry(c) || '').slice(0, 7) === k).length },
  'value.expiring':      { label: 'Value expiring',         unit: 'money',
    at: (cs, k) => cs.filter(c => String(_acExpiry(c) || '').slice(0, 7) === k).reduce((s, c) => s + _acVal(c), 0) },
  'renewals.due':        { label: 'Renewal decisions due',  unit: 'count',
    at: (cs, k) => typeof window.renewalDecisionDate === 'function'
      ? cs.filter(c => String(renewalDecisionDate(c) || '').slice(0, 7) === k).length : 0 },
  'obligations.due':     { label: 'Obligations due',        unit: 'count',
    at: (_, k) => typeof window.allObligations === 'function'
      ? allObligations().filter(o => _acObState(o) !== 'done'
          && String(_acDue(o) || '').slice(0, 7) === k).length : 0 },
};
/* The slug a counterparty series is addressed by. Stable for a given name and
   safe inside a JSON string, so the model can copy it back verbatim. */
const aiSeriesSlug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);

/* The DYNAMIC half: one series per counterparty that actually has contracts, so
   "chart Nordfrakt against Siginon" is answerable with real keys rather than an
   invented one. Recomputed on every prompt build, because the portfolio moves. */
function aiDynamicSeries(){
  const by = new Map();
  for (const c of _acContracts()){
    const name = (c.counterparty || '').trim();
    if (!name) continue;
    if (!by.has(name)) by.set(name, []);
    by.get(name).push(c);
  }
  const out = {};
  for (const [name] of [...by.entries()].sort((a, b) =>
    b[1].reduce((s, c) => s + _acVal(c), 0) - a[1].reduce((s, c) => s + _acVal(c), 0)).slice(0, 12)){
    out['counterparty.' + aiSeriesSlug(name)] = { label: name + ' — value expiring', unit: 'money',
      at: (cs, k) => cs.filter(c => (c.counterparty || '').trim() === name
        && String(_acExpiry(c) || '').slice(0, 7) === k).reduce((s, c) => s + _acVal(c), 0) };
  }
  return out;
}
const aiAllSeries = () => Object.assign({}, AI_SERIES, aiDynamicSeries());

/* The catalog as the model reads it: `key — label (unit, x-axis)`. */
function aiSeriesCatalogText(){
  const all = aiAllSeries();
  const line = k => `  ${k} — ${all[k].label} (${all[k].unit === 'money' ? 'KES' : 'count'}, x-axis: month)`;
  const fixed = Object.keys(AI_SERIES).map(line).join('\n');
  const dyn = Object.keys(all).filter(k => !(k in AI_SERIES)).map(line).join('\n');
  return `SERIES CATALOG (for kind "custom"). Use only these keys; never invent one.\n${fixed}`
    + (dyn ? `\nPer counterparty, from this workspace's live portfolio:\n${dyn}` : '');
}

/* ---------- pulling blocks out of an answer ----------
   Runs BEFORE the markdown renderer. A fenced block that reached mdParse would
   be faithfully rendered as a code block full of JSON — the model's plumbing
   shown to the reader as if it were the answer. */
const AI_CHART_FENCE = /```+\s*hati-chart\s*\n([\s\S]*?)```+/gi;
function aiExtractCharts(src, msgIdx){
  const blocks = [];
  const text = String(src == null ? '' : src).replace(AI_CHART_FENCE, (m, body) => {
    const key = `aichart-${msgIdx}-${blocks.length}`;
    let spec = null, error = null;
    try{ spec = JSON.parse(String(body).trim()); }
    catch(e){ error = 'That chart block was not readable.'; }
    blocks.push({ key, spec, error });
    return `\n\n<!--${key}-->\n\n`;
  });
  return { text, blocks };
}
/* The placeholder survives markdown rendering as an HTML comment, which mdParse
   escapes — so it comes out the other side as visible text and is swapped for
   the real host here. Matching on the escaped form is deliberate: it proves the
   escaping happened. */
function aiPlaceCharts(html, blocks){
  let out = String(html == null ? '' : html);
  for (const b of blocks){
    const host = `<div class="ai-chart-host" id="${b.key}"></div>`;
    const esc = `&lt;!--${b.key}--&gt;`;
    out = out.includes(esc) ? out.split(esc).join(host)
      : out.includes(`<!--${b.key}-->`) ? out.split(`<!--${b.key}-->`).join(host)
      : out + host;
  }
  return out;
}

/* ---------- building one chart ---------- */
function aiChartCard(title, inner){
  const t = title ? `<div class="ai-chart-title">${(window._mdEsc ? _mdEsc(title) : title)}</div>` : '';
  return `<div class="ai-chart">${t}${inner}</div>`;
}
const aiChartNote = msg => aiChartCard(null,
  `<div class="ai-chart-note">${(window._mdEsc ? _mdEsc(msg) : msg)}</div>`);

/* `quoted` — the ONE kind carrying the model's own numbers. Bounded hard: 2–12
   plain numbers, no expressions, no strings that happen to look numeric. It is
   labelled on the card as the model's figures, because a reader cannot
   otherwise tell it apart from a chart built from the record — and that
   difference is the whole basis on which the others can be trusted. */
function aiQuotedConfig(spec){
  const items = Array.isArray(spec.items) ? spec.items : [];
  if (items.length < 2 || items.length > 12) return null;
  const labels = [], data = [];
  for (const it of items){
    const v = it && it.value;
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    labels.push(String((it && it.label) || ''));
    data.push(v);
  }
  const money = /kes|value|amount|money/i.test(String(spec.unit || ''));
  return _acConfig('bar', { labels, datasets: [{ label: String(spec.label || 'Stated in this answer'),
    data, backgroundColor: AC_WARN, borderRadius: 4, _unit: money ? 'money' : '' }] },
    { legend: false, unit: money ? 'money' : '' });
}

function aiCustomConfig(spec){
  const all = aiAllSeries();
  const ds = Array.isArray(spec.datasets) ? spec.datasets : [];
  if (!ds.length || ds.length > 6) return { error: 'A custom chart needs between one and six datasets.' };
  const unknown = ds.map(d => d && d.series).filter(k => !(k in all));
  if (unknown.length) return { error: `Unknown series: ${unknown.join(', ')}.` };
  const units = [...new Set(ds.map(d => all[d.series].unit))];
  if (units.length > 1) return { error: 'That chart mixes money with counts on one axis.' };
  const months = _acMonthsAhead(12);
  const cs = _acContracts();
  const palette = [AC_ACCENT, AC_GOOD, AC_WARN, AC_BAD, '#7d5a14', '#5d5d60'];
  const datasets = ds.map((d, i) => {
    const s = all[d.series];
    const kind = d.display === 'line' || d.display === 'area' ? 'line' : 'bar';
    return { type: kind, label: String(d.label || s.label),
      data: months.map(k => s.at(cs, k)),
      borderColor: d.color || palette[i % palette.length],
      backgroundColor: d.color || palette[i % palette.length],
      fill: d.display === 'area', tension: .3, borderRadius: 4,
      _unit: s.unit === 'money' ? 'money' : '' };
  });
  if (!datasets.some(d => d.data.some(v => v))) return { empty: true };
  return { config: _acConfig('bar', { labels: months.map(_acMonthLabel), datasets },
    { unit: units[0] === 'money' ? 'money' : '', stacked: !!spec.stacked }) };
}

/* Turn one parsed block into a card. Never throws: a bad spec is a card that
   says so, because raw JSON on the page reads as a broken product. */
function aiChartHtml(block){
  const spec = block.spec;
  if (block.error || !spec || typeof spec !== 'object') return aiChartNote('That chart could not be read.');
  const title = spec.title ? String(spec.title).slice(0, 120) : '';
  const kind = String(spec.kind || '');
  if (kind === 'quoted'){
    const cfg = aiQuotedConfig(spec);
    if (!cfg) return aiChartNote('The figures for that chart were not usable.');
    block.config = cfg;
    return aiChartCard(title || spec.label || 'Figures stated above',
      `<div class="ai-chart-canvas"><canvas></canvas></div><div class="ai-chart-src">Figures as stated in this answer, not read from your records.</div>`);
  }
  if (kind === 'custom'){
    const r = aiCustomConfig(spec);
    if (r.error) return aiChartNote(r.error);
    if (r.empty) return aiChartNote('There is no data in your portfolio for that chart yet.');
    block.config = r.config;
    return aiChartCard(title, `<div class="ai-chart-canvas"><canvas></canvas></div>`);
  }
  const recipe = AI_CHART_RECIPES[kind];
  if (!recipe) return aiChartNote(`“${kind}” is not a chart HaTi knows how to draw.`);
  let cfg = null;
  try{ cfg = recipe(); }catch(e){ cfg = null; }
  if (!cfg) return aiChartNote('There is no data in your portfolio for that chart yet.');
  block.config = cfg;
  return aiChartCard(title, `<div class="ai-chart-canvas"><canvas></canvas></div>`);
}

/* Hydrate every placeholder that has a config. Called after the feed paints. */
async function aiHydrateCharts(blocks){
  const live = (blocks || []).filter(b => b.config && document.getElementById(b.key));
  if (!live.length) return;
  let Chart;
  try{ Chart = await aiChartLib(); }
  catch(e){
    for (const b of live){
      const host = document.getElementById(b.key);
      if (host) host.innerHTML = aiChartNote('Charts need an internet connection, and this workspace has none right now.');
    }
    return;
  }
  for (const b of live){
    const host = document.getElementById(b.key);
    const canvas = host && host.querySelector('canvas');
    if (!canvas) continue;
    aiChartDestroy(b.key);
    try{ AI_CHARTS.set(b.key, new Chart(canvas.getContext('2d'), b.config)); }
    catch(e){ host.innerHTML = aiChartNote('That chart could not be drawn.'); }
  }
}

/* ---------- what the model is told ---------- */
const AI_CHART_RULES = () => `INLINE CHARTS
You may include ONE chart in a reply by emitting a fenced block:

\`\`\`hati-chart
{ "kind": "<kind>", "title": "optional short title" }
\`\`\`

You choose the KIND ONLY. HaTi builds the chart from the live record, so it can
never disagree with the rest of the screen. Never put numbers, labels or arrays
in the block — "quoted" below is the sole exception.

Kinds:
  statusBreakdown    — contracts by lifecycle status
  expiryTimeline     — contracts expiring per month, next 12 months
  valueByCounterparty— total contract value per counterparty, top 10
  renewalPipeline    — renewal decisions due per month, with value
  valueStreamSplit   — contracts and value per value stream
  cycleTime          — average days per lifecycle stage
  obligationsDue     — open obligations, overdue and per month ahead

  quoted  — the one kind where YOU supply the numbers, and only figures you have
            already stated in this same reply:
            { "kind":"quoted", "title":"…", "label":"…", "unit":"KES|count",
              "items":[{"label":"…","value":123}] }
            2–12 items, plain numbers, same currency and period as your text.

  custom  — { "kind":"custom", "title":"…", "stacked":false,
              "datasets":[{"series":"<key>","display":"line|bar|area","label":"…"}] }
            1–6 datasets. Every dataset must share the same unit; never mix KES
            with counts. Mixed bar and line is fine.

${aiSeriesCatalogText()}

Rules:
  · At most ONE chart per reply. Pick the single most useful one.
  · No chart for small talk, definitions, or advice-only answers.
  · Only the kinds listed above are valid. Anything else shows an error card.
  · Refer to the chart in your text ("see the expiry chart below — six contracts
    lapse in the next quarter"), so the reader knows why it is there.

Examples:
  "How many contracts are sitting in review?" →
\`\`\`hati-chart
{ "kind": "statusBreakdown", "title": "Where the portfolio stands" }
\`\`\`
  "What's coming up for renewal?" →
\`\`\`hati-chart
{ "kind": "renewalPipeline", "title": "Renewal decisions, next 12 months" }
\`\`\`
  "Which counterparties are we most exposed to?" →
\`\`\`hati-chart
{ "kind": "valueByCounterparty", "title": "Value by counterparty" }
\`\`\`
  "Anything overdue on obligations?" →
\`\`\`hati-chart
{ "kind": "obligationsDue" }
\`\`\`
  "How long does a contract take to get signed?" →
\`\`\`hati-chart
{ "kind": "cycleTime", "title": "Average days per stage" }
\`\`\`
  "Chart value expiring against renewal decisions due." →
\`\`\`hati-chart
{ "kind": "custom", "title": "Expiry against renewals",
  "datasets":[{"series":"value.expiring","display":"bar"},
              {"series":"renewals.due","display":"line"}] }
\`\`\`
  (that last one is INVALID — it mixes KES with a count. Pick one unit.)
  "What is a force majeure clause?" → no chart. It is a definition.`;

/* ---------- tone markers, for the prompt ---------- */
const AI_TONE_RULES = `EMPHASIS
Wrap short spans to colour them. Use them on statuses, deadlines, amounts and
risk statements — not on ordinary prose.
  {+…} good news        e.g. {+signed three weeks early}
  {-…} bad news         e.g. {-expired without renewal}
  {!…} needs attention  e.g. {!expires in 9 days}
  {~…} context/aside    e.g. {~drafted from the standard template}`;

if (typeof window !== 'undefined') Object.assign(window, {
  AI_CHART_RECIPES, AI_SERIES, AI_CHARTS, AI_CHART_CDN,
  aiChartLib, aiChartDestroy, aiChartDestroyAll, aiChartSweep,
  aiExtractCharts, aiPlaceCharts, aiChartHtml, aiHydrateCharts, aiChartCard, aiChartNote,
  aiQuotedConfig, aiCustomConfig, aiAllSeries, aiDynamicSeries, aiSeriesCatalogText, aiSeriesSlug,
  AI_CHART_RULES, AI_TONE_RULES });
