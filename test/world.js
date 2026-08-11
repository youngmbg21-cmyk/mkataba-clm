/* ============================================================
   HaTi — the scenario world
   ============================================================
   A browser-shaped stage on which the REAL negotiation modules run.

   The other test files render one view module and assert on its markup. The
   two scenario scripts need something else: a contract that can be carried
   through six rounds of a negotiation by the same functions the product calls,
   with the results readable afterwards. So this module boots a real DOM
   (jsdom), evaluates the real modules into it in the order js/app.js loads
   them, and supplies the application shell around them — the things a running
   app provides and a test must stand in for: the signed-in user, the save
   path, the toast bar, the fetch layer.

   What is REAL here (loaded from js/, not reimplemented):
     richdoc.js   — sanitising, the text projection, the canonical form
     docx.js      — the .docx reader, on real ZIP bytes
     docxwrite.js — the .docx writer (once fix 3 lands)
     versioning.js— versions, the word diff, redline review and adoption
     wordflow.js  — the Word round-trip: out, back, filed as a round

   What is STUBBED is the shell, never the logic under test: persist() records
   saves instead of writing to SQLite, toast() records messages, api() answers
   from a small in-memory server double. Crucially logAudit() is a recorder —
   the product decides what goes into the audit trail and who is named as the
   actor, which is exactly what the audit assertions read back. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const { runFileInContext } = require('./vmcache');

const ROOT = path.join(__dirname, '..');

/* The modules a negotiation actually runs through, in js/app.js order. */
const MODULES = [
  'js/i18n.js',         // first, as js/app.js loads it: every label reads through t()
  'js/jurisdiction.js', // then this: money and law read from it
  'js/richdoc.js',
  'js/aimd.js',      // the markdown/tone renderer: pure, no DOM beyond escaping
  'js/aichart.js',   // the chart recipes: pure functions of state
  'js/redline.js',
  'js/clausemodel.js',
  'js/docx.js',
  'js/docxwrite.js',
  'js/versioning.js',
  'js/discuss.js',
  'js/negotiation.js',
  /* The internal review sits directly on top of the change model and is read by
     it nowhere — it annotates changes, it never rewrites them — so it loads
     straight after and needs nothing else. approvals.js is NOT pulled in with
     it: reviewGateApplies asks contractHasDeviation through `window` and reads
     "no deviation" when the playbook module is absent, which is the right
     answer on a stage that has no playbook. */
  'js/review.js',
  /* The desk sits on the same shelf as the review: it annotates the contract
     with who is working it and never touches the change model, so it loads
     straight after and needs nothing else. negoFileChange calls into it through
     `window`, so a stage without it files changes exactly as before — which is
     the behaviour every test written before this feature is asserting. */
  'js/desk.js',
  'js/wordflow.js',
];
/* js/views/contract.js is loaded ONLY on request (buildWorld({contractView:true})).
   It is the whole workspace screen: it declares its own detectWordFile,
   extractWordText, dataUrlBytes and renderWorkspace, which replace the shell
   this stage provides and drag in the rest of the application. A test that
   needs something living in that file — paper execution, for one — asks for it
   and accepts the heavier stage; every other test keeps the light one. */
const CONTRACT_VIEW = 'js/views/contract.js';
/* The Negotiation tab renderer. Loaded on request like the contract view, and
   independently of it: a test can assert on the three panes without dragging in
   the whole workspace screen (buildWorld({negotiationView:true})), which is
   what the interaction tests do. */
const NEGOTIATION_VIEW = 'js/views/negotiation.js';
/* The clause library and playbook engine (buildWorld({playbook:true})). Loaded
   on request because applyClauseRedline no longer edits the document — it files
   a tracked insertClause change — so proving that needs playbook.js and
   negotiation.js standing on the same floor. */
const PLAYBOOK = 'js/playbook.js';
/* The dashboard (buildWorld({homeView:true})). Loaded on request like the
   others. renderDashboard itself needs the whole application shell — metrics,
   risk scoring, the family model, localStorage-backed KPI preferences — so what
   the tests drive is the pair of pure functions the readiness surface is built
   from, not the full boot. */
const HOME_VIEW = 'js/views/home.js';

/* The element ids the render paths write into. Present so a render call lands
   somewhere readable rather than silently doing nothing. */
const HOST_IDS = ['content', 'modal-root', 'print-root', 'share-root', 'app-shell',
  'versions-section', 'nego-section', 'audit-section', 'shares-section', 'doc-scroll',
  'nego-tab'];

function buildWorld(opts = {}) {
  /* A REAL ORIGIN, so localStorage works. Without a url jsdom serves the
     document from an opaque origin and every localStorage access throws — which
     the product survives (every one of them is wrapped, because a no-login
     portal origin can throw for real) but which means anything REMEMBERED per
     browser could not be exercised here at all: the pane layout, and now which
     discussion threads this reader has already opened. */
  const dom = new JSDOM(
    `<!doctype html><html><body>${HOST_IDS.map(id => `<div id="${id}"></div>`).join('')}</body></html>`,
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://hati.test/' });
  const win = dom.window;

  /* Platform pieces the modules reach for that jsdom does not carry. The .docx
     reader inflates with the platform's own DecompressionStream; Node has it. */
  win.DecompressionStream = globalThis.DecompressionStream;
  win.CompressionStream = globalThis.CompressionStream;
  win.Response = globalThis.Response;
  win.Blob = globalThis.Blob;
  /* A real WebCrypto, because js/core.js's sha256() falls back to a weak
     32-bit substitute when crypto.subtle is missing — and a stage that ran the
     hash chain on the substitute would be testing the fallback rather than the
     product. */
  // jsdom defines window.crypto as a read-only accessor, so it is REDEFINED
  // rather than assigned; a plain assignment silently does nothing and the
  // modules then run on core.js's weak fallback digest.
  Object.defineProperty(win, 'crypto', { value: globalThis.crypto, configurable: true, writable: true });
  win.TextEncoder = globalThis.TextEncoder;
  win.TextDecoder = globalThis.TextDecoder;
  win.Uint8Array = globalThis.Uint8Array;
  win.DataView = globalThis.DataView;
  win.ArrayBuffer = globalThis.ArrayBuffer;
  win.console = console;
  win.setTimeout = (fn) => { try { fn(); } catch (_) {} return 0; };   // run deferred UI work at once
  win.clearTimeout = () => {};
  /* An interval never fires — the same gap portalworld.js documents at length.
     setTimeout was stubbed here and setInterval was not, so js/core.js's own
     pollers (refreshShareOverview and refreshWaitingQuestions on 60s,
     refreshAiUsage on 30s, and schedulePolling's _pollTimer) armed real jsdom
     timers in every world this harness builds. Nothing asserts on a poll
     arriving by itself; the tests that care call the refresh directly. */
  win.setInterval = () => 0;
  win.clearInterval = () => {};
  if (!win.URL.createObjectURL) win.URL.createObjectURL = () => 'blob:stub';
  if (!win.URL.revokeObjectURL) win.URL.revokeObjectURL = () => {};

  /* ---------- the recorders: what the test reads back ---------- */
  const log = {
    audit: [],       // every logAudit(...) the product made
    toasts: [],      // every message shown to the user
    saves: 0,        // persist() calls
    renders: 0,      // renderWorkspace() calls
    downloads: [],   // every file the product handed to the browser
    modals: [],      // every modal opened, with its html
    api: [],         // every server call
  };

  /* ---------- the application shell ---------- */
  const user = opts.user || { id: 'u_wanjiru', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@company.co.ke' };

  const shell = {
    // identity + permissions
    currentUser: () => user,
    canEdit: () => (opts.canEdit === undefined ? true : !!opts.canEdit),
    isAdmin: () => user.role === 'admin',
    API_MODE: () => (opts.apiMode === undefined ? true : !!opts.apiMode),
    /* The Redline bench's live poll must never run on this stage: its
       interval is a real Node timer, and one un-cleared poll keeps the test
       process alive forever. The view checks this flag before starting. */
    RL_LIVE_POLL: false,
    FIRST_PARTY: opts.org || 'Wanjiru Catering Ltd',
    PORTAL_MODE: false,

    // time + formatting
    nowISO: () => new Date().toISOString(),
    todayStr: () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    fmtDT: iso => String(iso || ''),
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    icon: () => '<svg></svg>',

    // the audit trail: a RECORDER. The product decides the actor and the
    // wording; these assertions are about exactly that decision. The optional
    // structured `data` (X3 — first used by renumbering) travels through
    // exactly as js/core.js carries it, so its shape is assertable here.
    logAudit(c, action, detail, actor, data) {
      c.audit = c.audit || [];
      const entry = { at: shell.nowISO(), user: actor || user.name, action, detail,
        ...(data ? { data } : {}) };
      c.audit.push(entry);
      log.audit.push({ id: c.id, ...entry });
    },

    // storage + rendering
    persist(c) { log.saves++; if (c) c._persisted = (c._persisted || 0) + 1; },
    saveContract(c) { log.saves++; },
    renderWorkspace() { log.renders++; },
    renderVersionsSection() {},
    renderNegotiationSection() {},
    renderAuditSection() {},
    renderSharesSection() {},
    refreshShareOverview() {},
    toast(msg, kind) { log.toasts.push({ msg: String(msg), kind: kind || 'ok' }); },
    setView() {},
    runScan() {},

    // hashing — the real thing, so seals in the scenarios are real digests
    async sha256(str) {
      return crypto.createHash('sha256').update(String(str)).digest('hex');
    },

    // document helpers the modules borrow from core.js / views/contract.js
    isUpload: c => !!(c && c.source === 'upload'),
    isExternallyExecuted: c => !!c && (c.hash === 'MIGRATED'
      || !!(c.migration && c.migration.executedOutside)
      || !!(c.execution && c.execution.offPlatform)),
    fval: id => { const el = win.document.getElementById(id); return el ? (el.value || '') : ''; },
    normText: html => {
      const d = win.document.createElement('div');
      d.innerHTML = html || '';
      return (d.textContent || '').replace(/\s+/g, ' ').trim();
    },
    uploadMax: () => 25 * 1024 * 1024,
    uploadTooBigMsg: f => `“${f.name}” is too large.`,
    dataUrlBytes: durl => {
      const b64 = String(durl || '').split(',')[1] || '';
      return new Uint8Array(Buffer.from(b64, 'base64'));
    },
    detectWordFile: (dataUrl, mime, fileName) => {
      const bytes = shell.dataUrlBytes(dataUrl);
      if (bytes[0] === 0xd0 && bytes[1] === 0xcf) return 'doc';
      if (bytes[0] === 0x50 && bytes[1] === 0x4b) return 'docx';
      if (/\.docx$/i.test(fileName || '')) return 'docx';
      if (/\.doc$/i.test(fileName || '')) return 'doc';
      return null;
    },
    async extractWordText(dataUrl) {
      return win.docxExtract(shell.dataUrlBytes(dataUrl));
    },
    trackedNote: t => (t && (t.ins || t.del))
      ? `Word tracked changes found: ${t.ins} insertion${t.ins === 1 ? '' : 's'}, ${t.del} deletion${t.del === 1 ? '' : 's'} — read as accepted`
      : '',
    // a drafted contract with no working text yet renders from its template;
    // the scenarios always carry redlineText or an upload, so this is the floor
    freezeContractHtml: c => `<div data-anchor="redline">${shell.esc(c.redlineText || '')}</div>`,
    docBody: c => `<div>${shell.esc(c.redlineText || '')}</div>`,

    /* Modal plumbing. The html is REALLY written into #modal-root, because the
       product wires its buttons straight afterwards with
       getElementById(...).addEventListener — a modal that only recorded its
       markup would make every one of those a null dereference. */
    openModal(html, o) {
      log.modals.push({ html: String(html), opts: o || {} });
      const root = win.document.getElementById('modal-root');
      root.innerHTML = String(html);
      return root;
    },
    closeModal() { win.document.getElementById('modal-root').innerHTML = ''; },
    confirmDialog: async () => true,
    promptDialog: async () => null,

    // the fetch layer: an in-memory server double
    async api(pathname, method, body) {
      log.api.push({ pathname, method: method || 'GET', body });
      return shell._server(pathname, method || 'GET', body);
    },
    _server(pathname, method, body) {
      const files = shell._files;
      if (pathname === 'files' && method === 'POST') {
        const id = 'f_' + (++shell._fileSeq);
        files.set(id, { id, name: body.name, mime: body.mime, dataUrl: body.dataUrl });
        return { id };
      }
      const mf = /^files\/(.+)$/.exec(pathname);
      if (mf && method === 'GET') {
        const f = files.get(mf[1]);
        if (!f) { const e = new Error('not found'); e.status = 404; throw e; }
        return f;
      }
      return {};
    },
    _files: new Map(),
    _fileSeq: 0,
  };

  Object.assign(win, shell);
  win.window = win;

  /* Capture every file handed to the browser. Installed AFTER the modules load
     (below), because wordflow.js declares wordTriggerDownload itself and a
     declaration overwrites anything assigned beforehand. */
  const installDownloadRecorder = () => {
    win.wordTriggerDownload = (dataUrl, fileName, mime) => {
      const b64 = String(dataUrl || '').split(',')[1] || '';
      log.downloads.push({ fileName, mime, bytes: new Uint8Array(Buffer.from(b64, 'base64')) });
    };
  };

  /* ---------- evaluate the real modules into the window ---------- */
  const ctx = dom.getInternalVMContext();
  const loaded = [];
  const files = [...MODULES];
  if (opts.negotiationView) files.push(NEGOTIATION_VIEW);
  if (opts.contractView) files.push(CONTRACT_VIEW);
  if (opts.playbook) files.push(PLAYBOOK);
  if (opts.homeView) files.push(HOME_VIEW);
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;            // docxwrite.js arrives with fix 3
    runFileInContext(abs, ctx, rel);              // compiled once per process, see test/vmcache.js
    loaded.push(rel);
  }
  installDownloadRecorder();
  /* Re-install the shell functions the loaded modules DECLARE for themselves.
     js/views/contract.js declares renderWorkspace, renderSignButton,
     renderAuditSection and docBody; a declaration overwrites whatever was
     assigned before it, so the real renderWorkspace would run here and reach
     for the whole application (getContract, the view router, the DOM of a
     screen this stage does not have). The logic under test is still the real
     one — only the shell around it is stood in for. */
  for (const k of ['renderWorkspace', 'renderSignButton', 'renderAuditSection',
    'renderVersionsSection', 'renderNegotiationSection', 'renderSharesSection',
    'persist', 'toast', 'logAudit', 'docBody', 'freezeContractHtml', 'setView',
    'openModal', 'closeModal', 'isExternallyExecuted']) {
    if (shell[k]) win[k] = shell[k];
  }

  return { dom, win, log, user, shell, loaded,
    /* every audit entry recorded on this contract, newest last */
    auditOf: c => (c.audit || []).slice(),
    /* did any audit entry name `who` as the actor for an action matching re? */
    auditActor: (c, re) => (c.audit || []).filter(e => re.test(e.action + ' ' + e.detail)).map(e => e.user),
    toastText: () => log.toasts.map(t => t.msg).join(' | '),
    reset() { log.audit.length = 0; log.toasts.length = 0; log.downloads.length = 0; log.modals.length = 0; log.api.length = 0; log.saves = 0; log.renders = 0; },
  };
}

/* ---------- fixtures ---------- */

/* The agreement at the centre of both scenarios: Wanjiru's 12-month supply
   contract, drafted in HaTi from the Raw Material Supply template. Formatted
   (rich) because the formatting surviving the negotiation is itself a
   checklist line. */
const SUPPLY_RICH = [
  '<h1>RAW MATERIAL SUPPLY AGREEMENT</h1>',
  '<p>THIS AGREEMENT is made between <strong>Wanjiru Catering Ltd</strong> of Nairobi, Kenya ("the Supplier") and <strong>Nordkust Industri AB</strong> of Gothenburg, Sweden ("the Buyer").</p>',
  '<h2>1. TERM</h2>',
  '<ol><li>This Agreement runs for twelve (12) months from the Effective Date.</li>',
  '<li>Renewal shall be by written agreement of both parties.</li></ol>',
  '<h2>2. DELIVERY</h2>',
  '<ol start="3"><li>The Supplier shall deliver within fourteen (14) days of each purchase order.</li>',
  '<li>Delivery shall be DDP Gothenburg unless otherwise agreed in writing.</li></ol>',
  '<h2>3. PAYMENT</h2>',
  '<ol start="5"><li>Payment shall be made within thirty (30) days of a valid invoice.</li>',
  '<li>The annual contract value is KES 4,800,000.</li></ol>',
  '<h2>4. LIABILITY</h2>',
  '<ol start="7"><li>Liability under this Agreement is capped at the total sums paid in the preceding twelve months.</li></ol>',
  '<h2>5. GOVERNING LAW</h2>',
  '<ol start="8"><li>This Agreement is governed by the laws of Kenya.</li></ol>',
  '<p>SIGNED for and on behalf of the parties:</p>',
].join('');

function supplyContract(over = {}) {
  return {
    id: 'MK-SUP-1',
    name: '12-Month Raw Material Supply Agreement',
    counterparty: 'Nordkust Industri AB',
    folder: 'proc',
    template: 'RM',
    status: 'Under Review',
    value: 4800000,
    valueType: 'estimated',
    lastAction: '26 Jul 2026',
    fields: {},
    metadata: {},
    comments: [],
    audit: [],
    signatures: [],
    rounds: [],
    versions: [],
    compliance: { consent: false },
    redlineText: SUPPLY_RICH,
    format: 'rich',
    ...over,
  };
}

module.exports = { buildWorld, supplyContract, SUPPLY_RICH, MODULES, ROOT };
