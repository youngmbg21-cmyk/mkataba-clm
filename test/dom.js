/* A minimal browser stand-in for rendering one of the app's view modules and
   reading the HTML it produced.

   This is NOT a DOM implementation. It is exactly enough of one to run a
   render function that builds a string and assigns it to an element's
   innerHTML, which is how every view in this app works. The point is to assert
   on the markup the product actually generates — "no folder-B contract id
   appears in the dashboard" has to be checked against real output, not a
   paraphrase of it. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fakeElement(id) {
  const el = {
    id, innerHTML: '', textContent: '', style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    parentElement: null, children: [],
    addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {},
    setAttribute() {}, getAttribute() { return null; }, querySelector() { return null; },
    querySelectorAll() { return []; }, focus() {}, select() {}, contains() { return false; },
    scrollIntoView() {}, click() {},
  };
  el.parentElement = { style: {}, appendChild() {} };
  return el;
}

function fakeDocument() {
  const byId = new Map();
  return {
    _byId: byId,
    getElementById(id) { if (!byId.has(id)) byId.set(id, fakeElement(id)); return byId.get(id); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement(tag) { return fakeElement(tag); },
    addEventListener() {}, removeEventListener() {},
    body: { appendChild() {} },
  };
}

function fakeLocalStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}

/* Build a sandbox with the handful of globals the view modules reach for, then
   evaluate the given source files into it in order. Returns the sandbox, so a
   test can call `sandbox.renderDashboard()` and read
   `sandbox.document.getElementById('content').innerHTML`. */
function loadViews(files, overrides = {}) {
  const document = fakeDocument();
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, setTimeout, clearTimeout, encodeURIComponent, decodeURIComponent,
    document, localStorage: fakeLocalStorage(),
    // ---- app globals the dashboard reads ----
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    icon: () => '<svg></svg>',
    fmtKES: n => 'KES ' + Number(n || 0).toLocaleString('en-KE'),
    fmtKESshort: n => { n = Number(n || 0); if (n >= 1e6) return 'KES ' + (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M'; if (n >= 1e3) return 'KES ' + (n / 1e3).toFixed(0) + 'K'; return 'KES ' + n; },
    fmtDT: iso => String(iso || ''),
    statusChip: s => `<span class="badge">${s}</span>`,
    /* Mirrors STATUS_META / statusLabel() in js/core.js, which loads before
       every view module in js/app.js. The stage labels moved into the
       dictionary, so the stub resolves through t() exactly as the real one
       does — the sandbox has js/i18n.js loaded ahead of every file. */
    STATUS_META: {
      'Draft':        { k: 'status_draft',        dot: '#98989b' },
      'Under Review': { k: 'status_under_review', dot: '#b8862b' },
      'Signed':       { k: 'status_signed',       dot: '#2e8763' },
      'Declined':     { k: 'status_declined',     dot: '#b0453c' },
    },
    statusLabel: s => { const m = sandbox.STATUS_META[s]; return m ? sandbox.t(m.k) : s; },
    riskChip: r => `<span class="badge">R ${r}</span>`,
    shareChip: s => `<span class="badge">${s}</span>`,
    SHARE_META: { sent: {}, opened: {}, changes: {}, signed: {}, declined: {}, expired: {}, revoked: {} },
    contractRisk: () => 20,
    isMonetary: c => c.valueType !== 'none',
    // mirrors signatureCapacity() in js/core.js, which loads before every view
    // module in js/app.js — a signing capacity, never a permission level
    signatureCapacity: s => {
      if (!s) return '';
      const t = String(s.title || '').trim();
      if (t) return t;
      const r = String(s.role || '').trim();
      return (!r || ['Admin', 'Legal', 'Viewer'].includes(r)) ? '' : r;
    },
    signerTitle: u => String((u && u.title) || '').trim(),
    getApprovalCfg: () => ({ threshold: 5000000, approverRole: 'admin' }),
    agreementsIn: cs => cs.filter(c => !c.parentId),
    effectiveExpiry: c => c.expiry || null,
    daysUntil: iso => Math.ceil((new Date(iso + 'T00:00:00') - Date.now()) / 86400000),
    renewalDecisionDate: () => null,
    approvalState: () => ({ required: false, ok: true, chain: [], next: null, canApproveNext: false }),
    API_MODE: () => true,
    setActiveNav() {}, setView() {}, selectContract() {}, openWorkspace() {}, toast() {},
    regState: () => ({ query: '', stage: 'all', type: 'all', sort: 'updated', dir: -1, page: 1, sel: {}, view: null }),
    // mirrors metrics() in js/views/portal.js — server aggregates when present
    metrics() {
      const s = sandbox.state.serverStats;
      if (s) return { totalValue: s.totalValue || 0, pending: s.pending || 0, signed: s.signed || 0, declined: s.declined || 0, drafts: s.drafts || 0 };
      const cs = sandbox.state.contracts, active = cs.filter(c => c.status !== 'Declined');
      return { totalValue: active.reduce((a, c) => a + Number(c.value || 0), 0),
        pending: cs.filter(c => c.status === 'Under Review').length,
        signed: cs.filter(c => c.status === 'Signed').length,
        declined: cs.filter(c => c.status === 'Declined').length,
        drafts: cs.filter(c => c.status === 'Draft').length };
    },
    currentUser: () => ({ id: 'u_test', name: 'Test User', role: 'legal' }),
    canViewValues: () => true,
    state: { contracts: [], settings: {}, view: 'dashboard' },
    ...overrides,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  /* js/i18n.js loads before every other module in js/app.js, so t() is
     defined by the time any view's top-level code runs. The sandbox has to
     mirror that: a view module that renders a label through t() would
     otherwise throw ReferenceError here but work fine in the browser.
     Prepended rather than added to each test's file list so it stays true
     for tests written later. */
  const withI18n = files.includes('js/i18n.js') ? files : ['js/i18n.js', ...files];
  for (const f of withI18n) {
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    vm.runInContext(src, sandbox, { filename: f });
  }
  return sandbox;
}

/* js/core.js builds its sample portfolio at load time by calling mk(), which
   reads TEMPLATES[key].folder / .valueType. A proxy answers for any key, so the
   module evaluates without dragging js/templates.js and its localStorage
   folder-merging into the sandbox. */
const STUB_TEMPLATES = new Proxy({}, {
  get: (_, k) => ({ id: String(k), folder: 'proc', valueType: 'standard', ic: 'file', kind: 'Contract' }),
  has: () => true,
});
const STUB_FOLDERS = {
  proc: { id: 'proc', name: 'Procurement & Raw Materials', color: '#2e9f80', ic: 'leaf' },
  sales: { id: 'sales', name: 'Sales & Route-to-Market', color: '#b8862b', ic: 'store' },
  corp: { id: 'corp', name: 'Corporate & Compliance', color: '#2e8763', ic: 'briefcase' },
};

module.exports = { loadViews, fakeDocument, fakeElement, STUB_TEMPLATES, STUB_FOLDERS };
