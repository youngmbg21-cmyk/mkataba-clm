/* ============================================================
   HaTi — the counterparty's stage
   ============================================================
   The companion to test/world.js, and the answer to how two bugs shipped in
   the same week: the whole suite drove Wanjiru's side of the glass. Erik is
   half of every contract and had no coverage at all, so a Word download that
   produced one unreadable paragraph and a "sent" message that sent nothing
   both passed 342 green tests.

   This boots js/views/portal.js — the real counterparty page — into a real
   DOM, against a payload built by the REAL buildSharePayload, and lets a test
   do what Erik does: read the page, press its buttons, and check what he
   actually receives.

   Same contract as test/world.js: what is under test is loaded from js/, and
   only the application shell around it is stood in for. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

/* The portal's own dependencies, in js/app.js order. core.js is included
   because buildSharePayload — the thing that decides what Erik is allowed to
   see — must be the real one, not a copy kept in a test. */
const MODULES = [
  'js/richdoc.js',
  'js/docx.js',
  'js/docxwrite.js',
  'js/versioning.js',
  'js/wordflow.js',
  'js/core.js',
  // the real document renderer: the portal shows the contract through
  // docBody()/readOnlyDocHtml(), so stubbing it would mean asserting on my
  // rendering rather than the product's
  'js/views/contract.js',
  'js/views/portal.js',
];

const HOST_IDS = ['share-root', 'app-shell', 'modal-root', 'print-root', 'content'];

const STUB_TEMPLATES = new Proxy({}, {
  get: (_, k) => ({ id: String(k), folder: 'proc', valueType: 'standard', ic: 'file', kind: 'Contract', name: String(k) }),
  has: () => true,
});
const STUB_FOLDERS = {
  proc: { id: 'proc', name: 'Procurement & Raw Materials', color: '#2e9f80', ic: 'leaf' },
  corp: { id: 'corp', name: 'Corporate & Compliance', color: '#2e8763', ic: 'briefcase' },
};

function buildPortal(opts = {}) {
  const dom = new JSDOM(
    `<!doctype html><html><body>${HOST_IDS.map(id => `<div id="${id}"></div>`).join('')}</body></html>`,
    { runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;

  win.DecompressionStream = globalThis.DecompressionStream;
  win.Response = globalThis.Response;
  win.Blob = globalThis.Blob;
  win.TextEncoder = globalThis.TextEncoder;
  win.TextDecoder = globalThis.TextDecoder;
  win.console = console;
  win.setTimeout = fn => { try { fn(); } catch (_) {} return 0; };
  win.clearTimeout = () => {};
  win.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  // jsdom has no layout, so scrollIntoView does not exist; the product treats
  // it as a convenience but a missing function would still throw mid-handler
  win.Element.prototype.scrollIntoView = function () {};
  if (!win.URL.createObjectURL) win.URL.createObjectURL = () => 'blob:stub';
  if (!win.URL.revokeObjectURL) win.URL.revokeObjectURL = () => {};

  const log = { downloads: [], toasts: [], sent: [], modals: [] };

  /* Every file the page hands to the browser is captured instead of saved, so
     a test can read the bytes Erik would have received. */
  win.wordTriggerDownload = (dataUrl, fileName, mime) => {
    const b64 = String(dataUrl || '').split(',')[1] || '';
    log.downloads.push({ fileName, mime, bytes: new Uint8Array(Buffer.from(b64, 'base64')) });
  };

  Object.assign(win, {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    icon: () => '<i></i>',                       // not <svg>, so tests can assert on real markup
    fmtDT: iso => String(iso || ''),
    fmtKES: n => 'KES ' + Number(n || 0).toLocaleString('en-KE'),
    statusChip: s => `<span>${s}</span>`,
    toast: (m, k) => log.toasts.push({ msg: String(m), kind: k || 'ok' }),
    async sha256(str) { return crypto.createHash('sha256').update(String(str)).digest('hex'); },
    /* The portal's fetch layer. Every response Erik submits is captured in the
       shape the server would receive it. */
    async api(pathname, method, body) {
      if (/\/respond$/.test(pathname)) { log.sent.push({ pathname, body }); return { ok: true }; }
      return {};
    },
    currentUser: () => null,
    canEdit: () => false,
    API_MODE: () => true,
    ensureFull: async () => {},
  });
  win.window = win;

  const ctx = dom.getInternalVMContext();
  for (const rel of MODULES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    vm.runInContext(fs.readFileSync(abs, 'utf8'), ctx, { filename: rel });
  }
  /* Recorders are re-installed AFTER the modules load. Several of these names
     are declared by the modules themselves (wordflow.js defines
     wordTriggerDownload, core.js defines toast), and a declaration overwrites
     anything assigned beforehand — so an early assignment is silently lost. */
  win.toast = (m, k) => log.toasts.push({ msg: String(m), kind: k || 'ok' });
  win.wordTriggerDownload = (dataUrl, fileName, mime) => {
    const b64 = String(dataUrl || '').split(',')[1] || '';
    log.downloads.push({ fileName, mime, bytes: new Uint8Array(Buffer.from(b64, 'base64')) });
  };

  return {
    dom, win, log,
    /* Render the page the way portalEntry does for a server-backed link. */
    open(payload, o = {}) {
      win.renderSharePortal(payload, { token: 'tok_test', share: {}, emailConfigured: true, ...o });
      return win.document.getElementById('share-root').innerHTML;
    },
    html: () => win.document.getElementById('share-root').innerHTML,
    /* Press a control and wait for its handler to settle. The page's handlers
       are async — building a Word file, capturing a signature — so a caller
       that checked the result synchronously would read the state before the
       work had happened. Always `await p.click(...)`. */
    async click(id) {
      const el = win.document.getElementById(id);
      if (!el) throw new Error(`no control with id "${id}" on the counterparty page`);
      el.dispatchEvent(new win.Event('click', { bubbles: true }));
      for (let i = 0; i < 8; i++) await Promise.resolve();     // drain the microtask queue
      await new Promise(r => setImmediate(r));
      return el;
    },
    has: id => !!win.document.getElementById(id),
    setValue(id, v) {
      const el = win.document.getElementById(id);
      if (!el) throw new Error(`no field "${id}"`);
      el.value = v;
    },
    lastDownload: () => log.downloads[log.downloads.length - 1] || null,
    lastSent: () => (log.sent.length ? log.sent[log.sent.length - 1].body : null),
    toastText: () => log.toasts.map(t => t.msg).join(' | '),
  };
}

/* A share payload built by the product's own allow-list, from a contract of
   the shape Wanjiru actually negotiates. */
function sharePayloadFor(p, contract, who = {}) {
  return p.win.buildSharePayload(contract, 'dochash-test', {
    org: who.org || 'Wanjiru Catering Ltd', sharedBy: who.sharedBy || 'Wanjiru Kamau' });
}

const RICH_SUPPLY = [
  '<h1>RAW MATERIAL SUPPLY AGREEMENT</h1>',
  '<p>THIS AGREEMENT is made between <strong>Wanjiru Catering Ltd</strong> and <strong>Nordkust Industri AB</strong>.</p>',
  '<h2>1. TERM</h2>',
  '<ol><li>This Agreement runs for twelve (12) months.</li><li>Renewal shall be by written agreement.</li></ol>',
  '<h2>2. PAYMENT</h2>',
  '<ol start="3"><li>Payment shall be made within thirty (30) days of a valid invoice.</li></ol>',
  '<p>SIGNED for and on behalf of the parties:</p>',
].join('');

function supplyContract(over = {}) {
  return {
    id: 'MK-SUP-1', name: '12-Month Raw Material Supply Agreement',
    counterparty: 'Nordkust Industri AB', folder: 'proc', template: 'RM',
    status: 'Under Review', value: 4800000, valueType: 'estimated',
    lastAction: '26 Jul 2026', fields: {}, metadata: {}, comments: [], audit: [],
    signatures: [], rounds: [], versions: [],
    redlineText: RICH_SUPPLY, format: 'rich', ...over,
  };
}

module.exports = { buildPortal, sharePayloadFor, supplyContract, RICH_SUPPLY, STUB_TEMPLATES, STUB_FOLDERS };
