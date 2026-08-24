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
/* THE WHOLE YEAR, for the reason pfMonthLabel gives: "Jan 27" beside a month
   name reads as a day of the month, and every chart drawn here sits on a
   screen that also prints real dates. */
const _acMonthLabel = k => {
  const [y, m] = String(k).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(langLocale(), { month: 'short', year: 'numeric' });
};
/* The next N months as keys, so a month with nothing in it still appears —
   a gap in a timeline is information, and a chart that silently skips empty
   months tells the reader the deals are evenly spread when they are not. */
function _acMonthsAhead(n){
  const out = [], now = new Date();
  for (let i = 0; i < n; i++) out.push(_acMonthKey(new Date(now.getFullYear(), now.getMonth() + i, 1)));
  return out;
}
/* Chart.js parses colour strings itself, so a CSS var() reference is opaque to
   it — the tokens are resolved to concrete values here, re-read on every chart
   build (aiChartHtml) so a theme toggle repaints the next chart correctly. */
const _acVar = (n, fb) => { try{ const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; }catch(e){ return fb; } };
let AC_INK = '#475569', AC_MUTED = '#94a3b8', AC_ACCENT = '#0d9488', AC_GOOD = '#10b981', AC_WARN = '#f59e0b', AC_BAD = '#f43f5e';
const _acGrid = { color: 'rgba(38,55,74,.08)' };
function _acRefreshPalette(){
  AC_INK    = _acVar('--color-neutral-600', '#475569');
  AC_MUTED  = _acVar('--st-gray-dot', '#94a3b8');
  AC_ACCENT = _acVar('--color-accent', '#0d9488');
  AC_GOOD   = _acVar('--st-green-dot', '#10b981');
  AC_WARN   = _acVar('--st-amber-dot', '#f59e0b');
  AC_BAD    = _acVar('--st-ruby-dot', '#f43f5e');
  const dark = !!(document.documentElement.classList && document.documentElement.classList.contains('dark'));
  _acGrid.color = dark ? 'rgba(148,163,184,.14)' : 'rgba(38,55,74,.08)';
}

/* A Chart.js config, with the house style applied once. Money axes format
   through the app's own currency helper, so a display-currency change is
   picked up by every chart without a single recipe knowing it happened. */
function _acConfig(type, data, opts = {}){
  const money = opts.unit === 'money';
  /* A doughnut is parts-of-a-whole: no axes, the legend IS the labelling, and
     ctx.parsed is the raw value rather than an {x,y} pair. */
  if (type === 'doughnut' || type === 'pie'){
    return { type, data, options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 220 },
      cutout: type === 'doughnut' ? '58%' : 0,
      plugins: {
        legend: { display: opts.legend !== false, position: 'right',
          labels: { boxWidth: 10, font: { size: 10 }, color: AC_INK } },
        tooltip: { callbacks: { label: ctx => {
          const v = ctx.parsed;
          const total = (ctx.dataset.data || []).reduce((s, n) => s + (Number(n) || 0), 0);
          const pct = total ? Math.round(v / total * 100) : 0;
          return `${ctx.label}: ${money ? _acMoney(v) : v} (${pct}%)`;
        } } },
      },
    } };
  }
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
  /* A DOUGHNUT, because "where does the portfolio stand" is parts of one
     whole. The labels/data shape is unchanged from the bar it used to be —
     f53 pins that shape, and the CSV/copy toolbar reads it. */
  statusBreakdown(){
    const order = ['Draft', 'Under Review', 'Signed', 'Declined'];
    const cs = _acAll();
    if (!cs.length) return null;
    const counts = order.map(s => cs.filter(c => c.status === s).length);
    if (!counts.some(Boolean)) return null;
    return _acConfig('doughnut', { labels: order, datasets: [{ get label(){ return _acT('ch_s_contracts','Contracts'); }, data: counts,
      backgroundColor: [ AC_MUTED, AC_WARN, AC_GOOD, AC_BAD ], borderWidth: 0 }] });
  },

  /* Risk bands as a doughnut — Low / Medium / High share of the live
     portfolio, counted through the same contractRisk() the register and the
     dashboard use. No contractRisk on this stage (a cut-down test page, a
     stripped build) means no chart, never a guess. */
  riskBands(){
    if (typeof window.contractRisk !== 'function') return null;
    const cs = _acContracts();
    if (!cs.length) return null;
    const bands = { Low: 0, Medium: 0, High: 0 };
    for (const c of cs){
      const r = Number(contractRisk(c)) || 0;
      bands[r >= 70 ? 'High' : r >= 40 ? 'Medium' : 'Low']++;
    }
    if (!bands.Low && !bands.Medium && !bands.High) return null;
    return _acConfig('doughnut', { labels: Object.keys(bands),
      datasets: [{ get label(){ return _acT('ch_s_contracts','Contracts'); }, data: Object.values(bands),
        backgroundColor: [ AC_GOOD, AC_WARN, AC_BAD ], borderWidth: 0 }] });
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
      datasets: [{ get label(){ return _acT('ch_s_contracts_expiring','Contracts expiring'); }, data: months.map(m => buckets[m]),
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
      datasets: [{ get label(){ return _acT('ch_s_contract_value','Contract value'); }, data: top.map(x => x[1]),
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
      { type: 'bar', label: _acT('ch_s_value_up_for_renewal','Value up for renewal'), data: months.map(m => value[m]),
        backgroundColor: AC_ACCENT, borderRadius: 4, yAxisID: 'y', _unit: 'money' },
      { type: 'line', label: _acT('ch_s_decisions_due','Decisions due'), data: months.map(m => count[m]),
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
      { type: 'bar', label: _acT('ch_s_contracts','Contracts'), data: count, backgroundColor: AC_ACCENT, borderRadius: 4, yAxisID: 'y' },
      { type: 'line', label: _acT('ch_s_value','Value'), data: value, borderColor: AC_GOOD, backgroundColor: AC_GOOD,
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
    /* ---- THE TRAIL IS NOT THERE TO BE READ IN SERVER MODE ----
       HEAVY strips `audit` off every light row, so on a real workspace this
       found nothing and the chart answered "there is no data in your portfolio
       for that chart yet" — a statement about the customer's own records that
       was false. The two ENDS are carried on the row (_raisedAt / _signedAt),
       and repRaisedAt / repSignedAt are the shared readers that prefer them and
       fall back to the trail wherever there is one. The MIDDLE stamp has no
       carried twin, so where the trail is absent this now draws the one span it
       can honestly measure rather than claiming the book is empty. */
    const at = (c, re) => { const e = (c.audit || []).find(x => re.test(x.action || '')); return e ? Date.parse(e.at) : NaN; };
    const raised = c => (typeof repRaisedAt === 'function' ? repRaisedAt(c) : null) ?? at(c, /^Created$/i);
    const signed = c => (typeof repSignedAt === 'function' ? repSignedAt(c) : null) ?? at(c, /^Signed$|^Countersigned$/i);
    const spans = { 'Draft → review': [], 'Review → signed': [], 'Raised → signed': [] };
    for (const c of _acAll()){
      const made = raised(c), rev = at(c, /^Status changed$|^Shared$/i), sig = signed(c);
      if (made && sig && sig >= made && !rev) spans['Raised → signed'].push((sig - made) / 86400000);
      if (made && rev && rev >= made) spans['Draft → review'].push((rev - made) / 86400000);
      if (rev && sig && sig >= rev) spans['Review → signed'].push((sig - rev) / 86400000);
    }
    const labels = Object.keys(spans).filter(k => spans[k].length);
    if (!labels.length) return null;
    const avg = labels.map(k => Math.round(spans[k].reduce((a, b) => a + b, 0) / spans[k].length));
    return _acConfig('bar', { labels, datasets: [{ get label(){ return _acT('ch_s_average_days','Average days'); }, data: avg,
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
    return _acConfig('bar', { labels, datasets: [{ get label(){ return _acT('ch_s_open_obligations','Open obligations'); }, data,
      backgroundColor: labels.map((_, i) => i === 0 ? AC_BAD : AC_ACCENT), borderRadius: 4 }] },
      { legend: false });
  },
};

/* ---------- the series catalog, for `custom` ----------
   Every series is month-indexed on the same x-axis, so two of them in one chart
   are always comparable. The unit is declared here and enforced at build time:
   a chart mixing KES with a count has two different meanings on one axis, which
   is a chart that lies without stating a single false number. */
/* EVERY LABEL HERE IS A GETTER, and it has to be twice over: this is a
   top-level object literal, so a plain call would freeze the label at the
   language current when the file loaded (the getter trap, met a fifth time) —
   and _acT is declared further down the file, so a load-time call is inside its
   temporal dead zone and throws outright. A getter body runs when the label is
   read, which answers both. */
const AI_SERIES = {
  'contracts.signed':    { get label(){ return _acT('ch_s_contracts_signed','Contracts signed'); },       unit: 'count',
    at: (cs, k) => cs.filter(c => c.status === 'Signed' && String(c.signedAt || '').slice(0, 7) === k).length },
  'contracts.expiring':  { get label(){ return _acT('ch_s_contracts_expiring','Contracts expiring'); },     unit: 'count',
    at: (cs, k) => cs.filter(c => String(_acExpiry(c) || '').slice(0, 7) === k).length },
  'value.expiring':      { get label(){ return _acT('ch_s_value_expiring','Value expiring'); },         unit: 'money',
    at: (cs, k) => cs.filter(c => String(_acExpiry(c) || '').slice(0, 7) === k).reduce((s, c) => s + _acVal(c), 0) },
  'renewals.due':        { get label(){ return _acT('ch_s_renewal_decisions_due','Renewal decisions due'); },  unit: 'count',
    at: (cs, k) => typeof window.renewalDecisionDate === 'function'
      ? cs.filter(c => String(renewalDecisionDate(c) || '').slice(0, 7) === k).length : 0 },
  'obligations.due':     { get label(){ return _acT('ch_s_obligations_due','Obligations due'); },        unit: 'count',
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
   shown to the reader as if it were the answer.

   THREE PASSES, because the failure mode of each is the reader seeing raw
   JSON. Pass one is the contract (a ```hati-chart fence). Pass two rescues a
   spec the model wrapped in the wrong fence (```json is the common slip).
   Pass three rescues a bare, unfenced spec object. Both rescues fire ONLY on
   a body naming a kind this file actually knows — an ordinary JSON example in
   an answer stays exactly what it is. */
/* ---- A NAMED SHAPE IS HONOURED IN CODE, NOT ONLY IN THE PROMPT ----
   Owner-reported, 13 Aug 2026: "I asked for a bar graph and it gave me a pie
   chart." The exact words were "give the status in bar graph format", and the
   answer came back as the doughnut titled "Portfolio by lifecycle status" —
   which is `statusBreakdown`, a kind whose shape is baked in and cannot be
   anything else.

   AI_CHART_RULES has carried a HARD rule about this since the day `breakdown`
   was built, and the rule is right. What it cannot do is BIND. The trap here is
   not the model ignoring an instruction in general: it is that the reader named
   a slice ("the status") which is also the name of a fixed kind, and the kind
   won. A rule that only lives in a prompt loses that argument some fraction of
   the time, and the reader has no way to tell it lost.

   So the shape is now read from the reader's own words and applied to the spec
   before anything is drawn. The model still chooses WHAT to draw; this only
   decides HOW, which is the one thing the reader stated outright.

   THE ONE RULE THAT BOUNDS IT: a shape request may change the SHAPE and must
   never move a NUMBER. A fixed kind is rewritten only where the breakdown
   recipe is proven to compute the identical rows — see AC_SHAPE_SWAP, and see
   what is deliberately not in it. */
const AC_ASK_SHAPES = [
  /* Order matters: "horizontal bar" must be read before "bar". */
  { shape: 'hbar', re: /\bhorizontal\s+(?:bar|column)s?\b/i },
  { shape: 'pie', re: /\bpie\b/i },
  { shape: 'doughnut', re: /\b(?:doughnut|donut)\b/i },
  /* "bar" and "line" are ordinary English — a contract can be about a bar, and
     a clause has lines. Each pattern carries its own chart context so a shape
     is only ever read out of a sentence that is asking for one. */
  { shape: 'bar', re: /\b(?:bar|column)s?[\s-]*(?:chart|graph|plot|format|form|style|view)\b/i },
  { shape: 'bar', re: /\b(?:as|in|into|using)\s+(?:a\s+|the\s+)?(?:bar|column)s?\b/i },
  { shape: 'line', re: /\bline[\s-]*(?:chart|graph|plot|format)\b/i },
  { shape: 'line', re: /\b(?:as|in|into|using)\s+(?:a\s+|the\s+)?line\b/i },
];
function aiAskedShape(ask){
  const s = String(ask == null ? '' : ask);
  if (!s) return null;
  for (const cand of AC_ASK_SHAPES) if (cand.re.test(s)) return cand.shape;
  return null;
}
/* The fixed kinds whose figures a `breakdown` reproduces EXACTLY, with the
   shape each one is drawn in. `drawn` is what stops a needless rewrite: a
   reader asking for bars over expiryTimeline already has bars.

   NOT HERE, and each for its own reason — this list is short on purpose:
     valueByCounterparty — keeps a top ten and DROPS the tail; the breakdown
       folds the rest into "Other". Better arithmetic, and not the arithmetic
       the reader was shown. A request about drawing must not quietly restate
       the figures.
     valueStreamSplit — two datasets (contracts AND value) against two axes;
       a breakdown carries one measure, so a rewrite would silently answer
       half the question.
     renewalPipeline — decisions per month WITH value, which is its own
       arithmetic and not a slice of the book.
     cycleTime, obligationsDue — not a breakdown of the portfolio at all.
   Where a kind is not here the model's chart stands, and the prompt rule is
   what asks for `breakdown` next time. */
const AC_SHAPE_SWAP = {
  statusBreakdown: { group: 'status', measure: 'count', drawn: 'doughnut' },
  riskBands: { group: 'risk', measure: 'count', drawn: 'doughnut' },
  expiryTimeline: { group: 'month', measure: 'count', drawn: 'bar' },
};
/* Names are WORDS on these two groups, and vertical bars turn words into
   rotated stubs — the same reading AI_CHART_RULES states and valueByCounterparty
   was built on. "hbar" IS a bar chart, so answering "bar" with it honours the
   ask rather than overriding it. */
const AC_HBAR_GROUPS = ['counterparty', 'stream'];
function aiHonourShape(spec, ask){
  if (!spec || typeof spec !== 'object') return spec;
  const want = aiAskedShape(ask);
  if (!want || !AC_BD_SHAPES.includes(want)) return spec;
  const kind = String(spec.kind || '');
  const fit = (shape, group) =>
    (shape === 'bar' && AC_HBAR_GROUPS.includes(String(group || ''))) ? 'hbar' : shape;
  /* The model chose the right kind and the wrong shape — the cheap case. */
  if (kind === 'breakdown' || kind === 'quoted'){
    const shape = fit(want, spec.group);
    return String(spec.shape || '') === shape ? spec : { ...spec, shape };
  }
  const swap = AC_SHAPE_SWAP[kind];
  if (!swap) return spec;
  const shape = fit(want, swap.group);
  if (shape === swap.drawn) return spec;              // already the shape asked for
  return { ...spec, kind: 'breakdown', group: swap.group, measure: swap.measure, shape,
    /* The card keeps the title the model wrote — it describes the same figures,
       and the reader asked for a different drawing of them, not a new answer. */
    title: spec.title };
}

const AI_CHART_FENCE = /```+\s*hati-chart\s*\n([\s\S]*?)```+/gi;
const _acKindRe = () => new RegExp('"kind"\\s*:\\s*"(' +
  Object.keys(AI_CHART_RECIPES).concat(['quoted', 'custom', 'breakdown']).join('|') + ')"');
function aiExtractCharts(src, msgIdx, ask){
  const blocks = [];
  const take = body => {
    const key = `aichart-${msgIdx}-${blocks.length}`;
    let spec = null, error = null;
    try{ spec = JSON.parse(String(body).trim()); }
    catch(e){ error = 'That chart block was not readable.'; }
    /* THE SHAPE THE READER NAMED IS APPLIED HERE, at the one place a spec is
       born, so block.spec is the honoured spec and everything downstream — the
       card, the canvas, the CSV behind it — reads one truth. */
    if (spec) spec = aiHonourShape(spec, ask);
    blocks.push({ key, spec, error });
    return `\n\n<!--${key}-->\n\n`;
  };
  let text = String(src == null ? '' : src).replace(AI_CHART_FENCE, (m, body) => take(body));
  const kindRe = _acKindRe();
  // PASS 2 — the right spec in the wrong fence (```json / ```js / bare ```).
  text = text.replace(/```+[ \t]*(?:json|js|javascript)?[ \t]*\n(\{[\s\S]*?\})\s*```+/gi,
    (m, body) => kindRe.test(body) ? take(body) : m);
  // PASS 3 — no fence at all: a balanced-brace object around a known kind.
  for (let i = 0; i < 4; i++){
    const at = text.search(kindRe);
    if (at < 0) break;
    const open = text.lastIndexOf('{', at);
    if (open < 0) break;
    let depth = 0, end = -1, inStr = false, escp = false;
    for (let j = open; j < text.length; j++){
      const ch = text[j];
      if (inStr){ if (escp) escp = false; else if (ch === '\\') escp = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}'){ depth--; if (!depth){ end = j; break; } }
    }
    if (end < 0) break;   // unbalanced — leave it; the sanitizer escapes it
    text = text.slice(0, open) + take(text.slice(open, end + 1)) + text.slice(end + 1);
  }
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
const _acT = (k, fb) => (typeof window !== 'undefined' && typeof window.i18t === 'function') ? i18t(k) : fb;
/* THE WAY OUT OF THE SCREEN. Every canvas card carries three small buttons —
   copy as image (for pasting straight into a slide), download as PNG, and
   download the numbers behind it as CSV so anyone can check a figure rather
   than take the picture on trust. One delegated listener serves every chart
   surface: the Copilot feed, the Intel dock, the Reports cards. */
function aiChartActionsHtml(key){
  const btn = (act, title, svg) =>
    `<button type="button" class="ai-chart-btn" data-ac-act="${act}" data-ac-key="${key}" title="${title}" aria-label="${title}">${svg}</button>`;
  const sw = 'width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return `<div class="ai-chart-actions">`
    + btn('copy', _acT('ch_copy_img', 'Copy as image'),
        `<svg ${sw}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`)
    + btn('png', _acT('ch_dl_png', 'Download as PNG'),
        `<svg ${sw}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`)
    + btn('csv', _acT('ch_dl_csv', 'Download the data (CSV)'),
        `<svg ${sw}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>`)
    + `</div>`;
}
function aiChartCard(title, inner, key){
  const t = title ? `<div class="ai-chart-title">${(window._mdEsc ? _mdEsc(title) : title)}</div>` : '';
  const acts = key ? aiChartActionsHtml(key) : '';
  return `<div class="ai-chart">${acts}${t}${inner}</div>`;
}
const aiChartNote = msg => aiChartCard(null,
  `<div class="ai-chart-note">${(window._mdEsc ? _mdEsc(msg) : msg)}</div>`);

/* The live canvas re-drawn onto an opaque surface with a little padding — a
   transparent canvas pasted into a slide turns black on some backgrounds. */
function aiChartExportCanvas(key){
  const ch = AI_CHARTS.get(key);
  const src = ch && ch.canvas;
  if (!src || !src.width || !src.height) return null;
  const pad = 16;
  const out = document.createElement('canvas');
  out.width = src.width + pad * 2; out.height = src.height + pad * 2;
  const g = out.getContext('2d');
  g.fillStyle = _acVar('--color-surface', '#ffffff');
  g.fillRect(0, 0, out.width, out.height);
  g.drawImage(src, pad, pad);
  return out;
}
/* The numbers exactly as the chart holds them — labels down the side, one
   column per series. Raw values, no formatting: this file is for checking. */
function aiChartCsv(key){
  const ch = AI_CHARTS.get(key);
  if (!ch || !ch.data) return null;
  const escCsv = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const labels = ch.data.labels || [];
  const ds = ch.data.datasets || [];
  if (!labels.length || !ds.length) return null;
  const lines = [['Label'].concat(ds.map((d, i) => d.label || ('Series ' + (i + 1)))).map(escCsv).join(',')];
  labels.forEach((lb, i) => lines.push([lb].concat(ds.map(d => {
    const v = (d.data || [])[i];
    return (v && typeof v === 'object') ? (v.y != null ? v.y : v.x) : v;
  })).map(escCsv).join(',')));
  return lines.join('\n');
}
const _acDownloadCanvas = (cv, name) => cv.toBlob(blob => {
  if (!blob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}, 'image/png');
let _acActionsWired = false;
function aiChartWireActions(){
  if (_acActionsWired) return;
  if (typeof document === 'undefined' || !document.addEventListener) return;
  _acActionsWired = true;
  document.addEventListener('click', async e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-ac-act]') : null;
    if (!b) return;
    const act = b.getAttribute('data-ac-act'), key = b.getAttribute('data-ac-key');
    const say = (m, k) => { if (typeof toast === 'function') toast(m, k); };
    if (act === 'csv'){
      const csv = aiChartCsv(key);
      if (!csv) return say(_acT('ch_not_ready', 'That chart has not finished drawing yet.'), 'err');
      if (typeof downloadFile === 'function') downloadFile(`hati-chart-${key}.csv`, csv, 'text/csv');
      return;
    }
    const cv = aiChartExportCanvas(key);
    if (!cv) return say(_acT('ch_not_ready', 'That chart has not finished drawing yet.'), 'err');
    if (act === 'png') return _acDownloadCanvas(cv, `hati-chart-${key}.png`);
    if (act === 'copy'){
      try{
        if (typeof ClipboardItem === 'undefined' || !navigator.clipboard || !navigator.clipboard.write)
          throw new Error('image clipboard unsupported');
        const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
        if (!blob) throw new Error('no image');
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        say(_acT('ch_copied', 'Chart copied — paste it into your slide or document.'));
      }catch(_){
        // Not every browser lets a page write an image to the clipboard
        // (Firefox behind a flag, older Safari). The nearest thing: a PNG.
        _acDownloadCanvas(cv, `hati-chart-${key}.png`);
        say(_acT('ch_copy_fell_back', 'This browser cannot copy images, so the chart downloaded as a PNG instead.'));
      }
    }
  });
}
aiChartWireActions();

/* ---- A SLICE COLOUR PER SLICE, HOWEVER MANY THERE ARE ----
   A doughnut used to be handed a fixed list of six. Chart.js CYCLES a short
   colour array, so a seven-slice chart drew slice 7 in slice 1's colour and a
   twelve-slice chart drew two pairs — on a parts-of-a-whole chart, where the
   colour IS the label, two slices the same colour is two readings of one
   number. Ten come from the house tokens; past that they are walked round the
   hue circle by the golden angle (137.5°), which is the standard way to get
   an arbitrary number of colours nobody can confuse with their neighbours.
   Deterministic, so the same portfolio draws the same chart twice. */
function _acSliceColors(n){
  const base = [AC_ACCENT, AC_GOOD, AC_WARN, AC_BAD, AC_MUTED,
    _acVar('--st-amber-fg', '#b45309'), _acVar('--color-accent-700', '#0f766e'),
    _acVar('--st-ruby-fg', '#be123c'), _acVar('--st-green-fg', '#166534'),
    _acVar('--st-steel-fg', '#475569')];
  const out = [];
  for (let i = 0; i < Number(n || 0); i++)
    out.push(i < base.length ? base[i]
      : `hsl(${Math.round((i * 137.508) % 360)} 58% 47%)`);
  return out;
}

/* One labelled series, house-styled, from ANY caller's own aggregates — the
   Reports cards and the health report draw through this so a chart is one
   look everywhere. kind: 'bar' | 'hbar' | 'line' | 'doughnut' | 'pie'.

   PIE JOINED THE LIST (Young, 10 Aug 2026). _acConfig has always handled the
   type — parts-of-a-whole is parts-of-a-whole, and a pie is a doughnut with no
   hole — but nothing could ask for one, so a reader who said "a pie chart" got
   whatever shape the recipe happened to be baked with. */
function aiSimpleChart(kind, labels, values, opts = {}){
  if (!Array.isArray(labels) || !labels.length) return null;
  _acRefreshPalette();
  const money = opts.unit === 'money';
  const color = opts.color || AC_ACCENT;
  if (kind === 'doughnut' || kind === 'pie')
    return _acConfig(kind, { labels, datasets: [{ label: opts.label || '', data: values,
      backgroundColor: opts.colors || _acSliceColors(labels.length),
      borderWidth: 0 }] }, { unit: opts.unit });
  const cfg = _acConfig(kind === 'line' ? 'line' : 'bar',
    { labels, datasets: [{ label: opts.label || '', data: values,
      backgroundColor: opts.colors || color, borderColor: color, tension: .3, borderRadius: 4,
      _unit: money ? 'money' : '' }] },
    { legend: false, unit: opts.unit });
  if (kind === 'hbar'){
    cfg.options.indexAxis = 'y';
    cfg.options.scales = {
      x: { beginAtZero: true, grid: _acGrid, ticks: { font: { size: 10 }, color: AC_INK, callback: v => money ? _acMoney(v) : v } },
      y: { grid: { display: false }, ticks: { font: { size: 10 }, color: AC_INK } },
    };
  }
  return cfg;
}

/* ---------- `breakdown` — the reader picks the shape ----------
   THE GAP IT CLOSES. Every other kind bakes its shape into its recipe:
   statusBreakdown is a doughnut because parts-of-a-whole is what it means,
   valueByCounterparty runs horizontally because names are words. That is right
   for "how is my portfolio doing" and wrong the moment somebody asks for a
   shape by name. Ask for "a pie chart of the value under management" and the
   old catalogue had nothing to answer with: only two kinds were round and both
   counted contracts, so the model picked the nearest recipe and drew a bar.

   THREE INDEPENDENT CHOICES, and the model makes all three — WHAT TO SLICE BY,
   WHAT TO MEASURE, WHAT SHAPE TO DRAW. It supplies no figures whatsoever; this
   function computes every number from live state through the same helpers the
   fixed recipes use, so the safety rule at the top of this file is untouched.
   The model is choosing a QUESTION and a PICTURE, which is exactly the part a
   reader's words should decide.

   WHY THIS IS NOT JUST "ADD A PIE KIND". A pie of what? The shape is a
   property of the drawing, the group is a property of the question, and the
   measure is a property of the answer. Baking any two together is how the
   catalogue got into this state — eight kinds, none of which could be asked
   for a different shape. */
const AC_BD_GROUPS = ['stream', 'counterparty', 'status', 'risk', 'month'];
const AC_BD_SHAPES = ['pie', 'doughnut', 'bar', 'hbar', 'line'];
const AC_BD_MEASURES = ['value', 'count'];
/* Counterparties are unbounded — a workspace can hold hundreds, and a pie with
   two hundred slices is a coloured circle. The tail is FOLDED rather than
   dropped, because a top-ten that silently loses 40% of the portfolio is a
   chart that lies by omission. */
const AC_BD_TOPN = 10;
const AC_BD_GROUP_LABEL = { stream: 'value stream', counterparty: 'counterparty',
  status: 'status', risk: 'risk band', month: 'expiry month' };
const AC_BD_MEASURE_LABEL = { value: 'Contract value', count: 'Contracts' };

/* The rows, before anything is drawn. null = this stage cannot answer (no
   FOLDERS, no contractRisk); [] and all-zero are handled by the caller. */
function _acBreakdownRows(group, measure){
  const val = measure === 'value'
    ? (cs => cs.reduce((s, c) => s + _acVal(c), 0))
    : (cs => cs.length);
  if (group === 'stream'){
    const F = (typeof window.FOLDERS === 'object' && FOLDERS) || {};
    const ids = Object.keys(F);
    if (!ids.length) return null;
    const cs = _acContracts();
    return ids.map(id => ({ label: (F[id] && F[id].name) || id,
      value: val(cs.filter(c => c.folder === id)) }));
  }
  if (group === 'counterparty'){
    const by = new Map();
    for (const c of _acContracts()){
      const k = (c.counterparty || '').trim() || 'Unnamed';
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(c);
    }
    const rows = [...by.entries()].map(([k, cs]) => ({ label: k, value: val(cs) }))
      .filter(r => r.value > 0).sort((a, b) => b.value - a.value);
    if (rows.length <= AC_BD_TOPN) return rows;
    const top = rows.slice(0, AC_BD_TOPN);
    const rest = rows.slice(AC_BD_TOPN).reduce((s, r) => s + r.value, 0);
    if (rest) top.push({ get label(){ return _acT('ch_s_other_slice','Other'); }, value: rest });
    return top;
  }
  if (group === 'status'){
    /* _acAll, not _acContracts: Declined IS one of the statuses being broken
       down, and the chart that leaves it out is answering a different
       question. Every other group reads the LIVE portfolio, where a declined
       contract is not part of the total. statusBreakdown draws the same line. */
    const cs = _acAll();
    return ['Draft', 'Under Review', 'Signed', 'Declined']
      .map(s => ({ label: s, value: val(cs.filter(c => c.status === s)) }));
  }
  if (group === 'risk'){
    if (typeof window.contractRisk !== 'function') return null;
    const bands = { Low: [], Medium: [], High: [] };
    for (const c of _acContracts()){
      const r = Number(contractRisk(c)) || 0;
      bands[r >= 70 ? 'High' : r >= 40 ? 'Medium' : 'Low'].push(c);
    }
    return Object.keys(bands).map(k => ({ label: k, value: val(bands[k]) }));
  }
  if (group === 'month'){
    const months = _acMonthsAhead(12);
    const cs = _acContracts();
    return months.map(m => ({ label: _acMonthLabel(m),
      value: val(cs.filter(c => String(_acExpiry(c) || '').slice(0, 7) === m)) }));
  }
  return null;
}

function aiBreakdownConfig(spec){
  const group = String((spec && spec.group) || '');
  const measure = String((spec && spec.measure) || 'value');
  const shape = String((spec && spec.shape) || 'bar');
  if (!AC_BD_GROUPS.includes(group))
    return { error: `A breakdown needs "group" to be one of: ${AC_BD_GROUPS.join(', ')}.` };
  if (!AC_BD_MEASURES.includes(measure))
    return { error: `A breakdown needs "measure" to be "value" or "count".` };
  if (!AC_BD_SHAPES.includes(shape))
    return { error: `A breakdown needs "shape" to be one of: ${AC_BD_SHAPES.join(', ')}.` };
  let rows = null;
  try{ rows = _acBreakdownRows(group, measure); }catch(e){ rows = null; }
  if (!rows || !rows.length) return { empty: true };
  const round = shape === 'pie' || shape === 'doughnut';
  /* A ZERO IS A SLICE OF NOTHING AND A BAR OF SOMETHING. On a pie an empty
     category is invisible but still takes a legend row, which reads as a
     category that exists and was measured at nothing you can see. On a
     timeline an empty month is the point — expiryTimeline's own comment says
     a chart that skips empty months tells the reader the deals are evenly
     spread when they are not. So round shapes drop them and the rest keep
     them. */
  if (round) rows = rows.filter(r => Number(r.value) > 0);
  if (!rows.length || !rows.some(r => Number(r.value) > 0)) return { empty: true };
  const unit = measure === 'value' ? 'money' : '';
  const cfg = aiSimpleChart(shape, rows.map(r => r.label), rows.map(r => Number(r.value) || 0), {
    unit, label: AC_BD_MEASURE_LABEL[measure],
    colors: round ? _acSliceColors(rows.length) : undefined,
  });
  if (!cfg) return { empty: true };
  return { config: cfg,
    /* A default title, because this kind's whole point is that the reader
       asked for something specific and the card should say what it is. */
    title: `${AC_BD_MEASURE_LABEL[measure]} by ${AC_BD_GROUP_LABEL[group]}` };
}

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
  /* AND IT TAKES A SHAPE TOO (Young, 10 Aug 2026). "Draw those three figures
     as a pie" is the same request as the one `breakdown` answers, about numbers
     the model has already stated rather than about the record. Refusing the
     shape here would leave one narrow case where naming a shape still did
     nothing. Unknown or absent falls back to the bar it has always been. */
  const shape = AC_BD_SHAPES.includes(String(spec.shape || '')) ? String(spec.shape) : 'bar';
  if (shape !== 'bar'){
    const cfg = aiSimpleChart(shape, labels, data, { unit: money ? 'money' : '',
      label: String(spec.label || 'Stated in this answer'),
      /* Amber on every slice: the card says these are the model's own figures,
         and the colour is the second place that difference is stated. A round
         shape needs one colour per slice, so the family is kept and the wheel
         supplies the rest. */
      color: AC_WARN });
    if (cfg) return cfg;
  }
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
  const palette = [AC_ACCENT, AC_GOOD, AC_WARN, AC_BAD, _acVar('--st-amber-fg', '#b45309'), _acVar('--st-gray-fg', '#475569')];
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
  _acRefreshPalette();
  const spec = block.spec;
  if (block.error || !spec || typeof spec !== 'object') return aiChartNote('That chart could not be read.');
  const title = spec.title ? String(spec.title).slice(0, 120) : '';
  const kind = String(spec.kind || '');
  if (kind === 'quoted'){
    const cfg = aiQuotedConfig(spec);
    if (!cfg) return aiChartNote('The figures for that chart were not usable.');
    block.config = cfg;
    return aiChartCard(title || spec.label || 'Figures stated above',
      `<div class="ai-chart-canvas"><canvas></canvas></div><div class="ai-chart-src">Figures as stated in this answer, not read from your records.</div>`, block.key);
  }
  if (kind === 'custom'){
    const r = aiCustomConfig(spec);
    if (r.error) return aiChartNote(r.error);
    if (r.empty) return aiChartNote('There is no data in your portfolio for that chart yet.');
    block.config = r.config;
    return aiChartCard(title, `<div class="ai-chart-canvas"><canvas></canvas></div>`, block.key);
  }
  /* The same three outcomes as `custom`, and the same no-data SENTENCE as every
     fixed recipe — a reader who asked for a pie of an empty portfolio gets the
     friendly card, never a blank circle. */
  if (kind === 'breakdown'){
    const r = aiBreakdownConfig(spec);
    if (r.error) return aiChartNote(r.error);
    if (r.empty) return aiChartNote('There is no data in your portfolio for that chart yet.');
    block.config = r.config;
    return aiChartCard(title || r.title, `<div class="ai-chart-canvas"><canvas></canvas></div>`, block.key);
  }
  const recipe = AI_CHART_RECIPES[kind];
  if (!recipe) return aiChartNote(`“${kind}” is not a chart HaTi knows how to draw.`);
  let cfg = null;
  try{ cfg = recipe(); }catch(e){ cfg = null; }
  if (!cfg) return aiChartNote('There is no data in your portfolio for that chart yet.');
  block.config = cfg;
  return aiChartCard(title, `<div class="ai-chart-canvas"><canvas></canvas></div>`, block.key);
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
  statusBreakdown    — contracts by lifecycle status (a donut: parts of the whole)
  riskBands          — live contracts by risk band, Low/Medium/High (a donut)
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

  breakdown — the kind to use whenever the reader names a SHAPE, or asks for a
            split the eight kinds above do not already cover. You choose three
            things and HaTi computes every figure from the live record:
            { "kind":"breakdown", "title":"…",
              "group":"stream|counterparty|status|risk|month",
              "measure":"value|count",
              "shape":"pie|doughnut|bar|hbar|line" }
            group  — what to slice by. "month" is expiries over the next 12
                     months. "counterparty" keeps the top 10 and folds the rest
                     into "Other".
            measure— "value" is money (KES); "count" is a number of contracts.
            shape  — how to draw it. Use exactly the shape the reader asked for.
            Supply NO numbers, labels or arrays. Use "hbar" for a bar chart of
            counterparties or streams (their names are words, and vertical bars
            turn them into rotated stubs).

  custom  — { "kind":"custom", "title":"…", "stacked":false,
              "datasets":[{"series":"<key>","display":"line|bar|area","label":"…"}] }
            1–6 datasets. Every dataset must share the same unit; never mix KES
            with counts. Mixed bar and line is fine.

${aiSeriesCatalogText()}

Rules:
  · WHEN THE READER NAMES A SHAPE, THEY GET THAT SHAPE. "a pie chart", "as a
    line", "show it as a donut", "in bars" — you MUST answer with "breakdown"
    carrying that exact shape. Do not substitute a different shape because a
    fixed kind looks close enough; do not answer in prose with no chart because
    no fixed kind is round. The eight kinds above have their shapes baked in
    and cannot honour a request like this — breakdown exists for it.
      "a pie chart of the value of my money under management"
        → { "kind":"breakdown", "group":"counterparty", "measure":"value",
            "shape":"pie" }
      "show my contracts by stream as a doughnut"
        → { "kind":"breakdown", "group":"stream", "measure":"count",
            "shape":"doughnut" }
      "plot expiries over the next year as a line"
        → { "kind":"breakdown", "group":"month", "measure":"count",
            "shape":"line" }
  · THE TRAP, and it is the one that has actually been reported: naming a slice
    that MATCHES a fixed kind does not cancel the shape. "give the status in bar
    graph format" names a slice (status) AND a shape (bar), and the shape
    decides the kind every time — statusBreakdown can only ever be a doughnut,
    so answering with it ignores the only thing the reader asked for outright.
      "give the status in bar graph format"
        → { "kind":"breakdown", "group":"status", "measure":"count",
            "shape":"bar" }          NOT statusBreakdown
      "risk bands as a pie"
        → { "kind":"breakdown", "group":"risk", "measure":"count",
            "shape":"pie" }          NOT riskBands
  · If the reader names a shape but not what to slice by, choose the group that
    best fits their words — money under management, exposure or "who we do
    business with" is "counterparty"; "by department/team/area" is "stream".
  · A narrow question gets at most ONE chart — the single most useful one.
  · A BROAD portfolio question ("how is my portfolio doing", "give me an
    overview/report") may use up to FOUR charts, each a different kind, each
    placed next to the text it illustrates.
  · No chart for small talk, definitions, or advice-only answers.
  · Only the kinds listed above are valid. Anything else shows an error card.
  · Refer to each chart in your text ("see the expiry chart below — six
    contracts lapse in the next quarter"), so the reader knows why it is there.

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
  "Give me a pie chart of the value of my money under management." →
\`\`\`hati-chart
{ "kind": "breakdown", "group": "counterparty", "measure": "value",
  "shape": "pie", "title": "Value under management, by counterparty" }
\`\`\`
  "Split the portfolio by value stream — as a doughnut." →
\`\`\`hati-chart
{ "kind": "breakdown", "group": "stream", "measure": "value", "shape": "doughnut" }
\`\`\`
  "Chart value expiring against renewal decisions due." →
\`\`\`hati-chart
{ "kind": "custom", "title": "Expiry against renewals",
  "datasets":[{"series":"value.expiring","display":"bar"},
              {"series":"renewals.due","display":"line"}] }
\`\`\`
  (that last one is INVALID — it mixes KES with a count. Pick one unit.)
  "What is a force majeure clause?" → no chart. It is a definition.`;

/* ---------- tone markers, for the prompt ----------
   DUTIES, NOT AN INVITATION. The first draft of this block described the
   markers and asked nicely; real answers came back with none, and a page of
   uncoloured prose about five expiring contracts reads as if nothing in it
   is urgent. So the block now states formatting duties the way the rest of
   the prompt states data duties — with an example of the register wanted,
   because a model follows a worked example far more reliably than an
   adjective. */
const AI_TONE_RULES = `EMPHASIS — FORMATTING DUTIES, NOT OPTIONS
The interface renders the markers below as coloured highlights. They are how
emphasis reaches the reader; an answer without them reads flat and unfinished.

1. Make every figure BOLD (markdown **…**): every amount, percentage, count,
   date and contract id.
2. Wrap the phrase carrying each finding's VERDICT in a tone marker:
     {+…} good news        e.g. {+target beaten, and beaten early}
     {-…} bad news         e.g. {-lapsed without renewal}
     {!…} needs attention  e.g. {!five contracts expire inside 30 days}
     {~…} context/aside    e.g. {~drafted from the standard template}
3. Mandatory placements: any deadline inside 30 days, any overdue obligation
   and any deadlock gets {!…} or {-…}; a clean bill of health gets {+…}.
4. Dose: a short answer carries 1–2 markers; a portfolio overview carries one
   per section, typically 3–5. Never colour a whole paragraph, never mark
   ordinary prose, never nest markers.

The register wanted (an answer should read like this):
  "**Five contracts** lapse inside 30 days — {!three are still in Draft}, so
   they will expire unsigned unless someone moves. Your largest exposure,
   **Naivas (KES 163M)**, is {+signed and current}. {~Two of the five are
   renewals of standard paper.}"`;

if (typeof window !== 'undefined') Object.assign(window, {
  AI_CHART_RECIPES, AI_SERIES, AI_CHARTS, AI_CHART_CDN,
  aiChartLib, aiChartDestroy, aiChartDestroyAll, aiChartSweep,
  aiExtractCharts, aiPlaceCharts, aiChartHtml, aiHydrateCharts, aiChartCard, aiChartNote,
  aiChartActionsHtml, aiChartExportCanvas, aiChartCsv, aiChartWireActions, aiSimpleChart, _acRefreshPalette,
  aiQuotedConfig, aiCustomConfig, aiBreakdownConfig, _acBreakdownRows, _acSliceColors,
  AC_BD_GROUPS, AC_BD_SHAPES, AC_BD_MEASURES,
  aiAskedShape, aiHonourShape, AC_SHAPE_SWAP,
  aiAllSeries, aiDynamicSeries, aiSeriesCatalogText, aiSeriesSlug,
  AI_CHART_RULES, AI_TONE_RULES });
