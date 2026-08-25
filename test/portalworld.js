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
const { runFileInContext } = require('./vmcache');

const ROOT = path.join(__dirname, '..');

/* The portal's own dependencies, in js/app.js order. core.js is included
   because buildSharePayload — the thing that decides what Erik is allowed to
   see — must be the real one, not a copy kept in a test. */
const MODULES = [
  'js/i18n.js',         // first, as js/app.js loads it: every label reads through i18t()
  'js/jurisdiction.js', // then this: money and law read from it
  'js/richdoc.js',
  'js/clausemodel.js',
  'js/redline.js',
  'js/docx.js',
  'js/docxwrite.js',
  'js/versioning.js',
  'js/discuss.js',
  'js/negotiation.js',
  'js/wordflow.js',
  'js/core.js',
  // the real document renderer: the portal shows the contract through
  // docBody()/readOnlyDocHtml(), so stubbing it would mean asserting on my
  // rendering rather than the product's
  'js/views/contract.js',
  // the shared Negotiation component: the counterparty's page renders the SAME
  // file the owner's tab does, so it has to be on this stage too — and since
  // 21 Aug 2026 that is two files, the stylesheet first (see its own header).
  'js/views/negotiation-css.js',
  'js/views/negotiation.js',
  'js/views/clauseeditor.js',
  'js/views/portal.js',
];

/* 'nego-tab' is the owner-side host for js/views/negotiation.js. It is on this
   stage because the negotiation tests need BOTH sides on one window: the portal
   renders the counterparty's copy into #pt-nego, and the owner's copy renders
   here, so the two can be diffed against each other. */
const HOST_IDS = ['share-root', 'app-shell', 'modal-root', 'print-root', 'content', 'nego-tab'];

const STUB_TEMPLATES = new Proxy({}, {
  get: (_, k) => ({ id: String(k), folder: 'proc', valueType: 'standard', ic: 'file', kind: 'Contract', name: String(k) }),
  has: () => true,
});
const STUB_FOLDERS = {
  proc: { id: 'proc', name: 'Procurement & Raw Materials', color: '#2e9f80', ic: 'leaf' },
  corp: { id: 'corp', name: 'Corporate & Compliance', color: '#2e8763', ic: 'briefcase' },
};

function buildPortal(opts = {}) {
  /* No `url` by default, which puts this stage on an OPAQUE ORIGIN where
     localStorage throws — deliberate, because that is the counterparty's own
     situation and several tests exercise the save path around it.

     A test that needs the OWNER side of the app (openShareModal, say) has to
     have a signed-in user, and js/core.js reads the session out of
     localStorage. It cannot be faked by assigning window.currentUser: core.js
     declares that as a lexical `const`, so its own internal callers resolve to
     that binding and never see a replacement — the same trap negoResolve
     documents for canEdit. So such a test asks for a real origin instead. */
  const dom = new JSDOM(
    `<!doctype html><html><body>${HOST_IDS.map(id => `<div id="${id}"></div>`).join('')}</body></html>`,
    { runScripts: 'outside-only', pretendToBeVisual: true,
      ...(opts.url ? { url: opts.url } : {}) });
  const win = dom.window;

  win.DecompressionStream = globalThis.DecompressionStream;
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
  win.console = console;
  win.setTimeout = fn => { try { fn(); } catch (_) {} return 0; };
  win.clearTimeout = () => {};
  /* An interval NEVER FIRES here, and this stub is why f25 took 32 seconds.
     The signing screen arms a one-second ticker for the resend-code cooldown
     (portalStartOtp, js/views/portal.js — RESEND_COOLDOWN is 30000 and the
     ticker clears itself only once that much REAL time has passed). setTimeout
     above was stubbed and setInterval was not, so the genuine jsdom timer ran,
     held the event loop open, and every signing test sat idle for the full
     thirty seconds after its assertions had already passed. A CPU profile of
     that file was 29.9s idle out of 31.9s.
     Not firing is also the right behaviour on its own terms: a test that waits
     on a wall clock is a test that fails on a slow machine. Anything a ticker
     is supposed to do is asserted by calling it, not by waiting for it. The
     product calls tickCooldown() once synchronously before arming the
     interval, so the first painted state is still the real one. */
  win.setInterval = () => 0;
  win.clearInterval = () => {};
  win.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  // jsdom has no layout, so scrollIntoView does not exist; the product treats
  // it as a convenience but a missing function would still throw mid-handler
  win.Element.prototype.scrollIntoView = function () {};
  if (!win.URL.createObjectURL) win.URL.createObjectURL = () => 'blob:stub';
  if (!win.URL.revokeObjectURL) win.URL.revokeObjectURL = () => {};

  const log = { downloads: [], toasts: [], sent: [], modals: [], messages: [], derived: [] };

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
    statusChip: s => `<span>${s}</span>`,
    toast: (m, k) => log.toasts.push({ msg: String(m), kind: k || 'ok' }),
    async sha256(str) { return crypto.createHash('sha256').update(String(str)).digest('hex'); },
    /* The portal's fetch layer. Every response Erik submits is captured in the
       shape the server would receive it. */
    async api(pathname, method, body) {
      if (/\/respond$/.test(pathname)) { log.sent.push({ pathname, body }); return { ok: true }; }
      /* A message goes down its own route on purpose — it is not a response and
         must not close the link — so the stage records it separately and
         answers with the refreshed thread the real server returns. */
      if (/\/messages$/.test(pathname)) {
        log.sent.push({ pathname, body });
        log.messages.push({ id: log.messages.length + 1, side: 'counterparty',
          author: body.author, topic: body.topic, topicLabel: body.topicLabel,
          body: body.body, at: '2026-07-26T12:00:00Z' });
        return { ok: true, messages: log.messages.slice() };
      }
      /* Deriving a read-only ticket for an adviser. The route's own rules
         (a view cannot delegate, a signing holder was asked to sign) are
         server-side and proven in f123 against a real server; what this stage
         stands in for is the successful mint, so the page's half — the door,
         the held list, what it tells the reader — can be driven. */
      if (/\/derive-view$/.test(pathname)) {
        log.sent.push({ pathname, body });
        const n = log.derived.length + 1;
        const made = { ok: true, token: 'tok_child' + n, link: 'https://hati.test/#s=t:tok_child' + n,
          expiresAt: '2026-08-14T00:00:00.000Z', purpose: 'view' };
        log.derived.push(made);
        return made;
      }
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
    runFileInContext(abs, ctx, rel);              // compiled once per process, see test/vmcache.js
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
    /* The same press, addressed by SELECTOR rather than id. Added 15 Aug 2026
       for the unsent band, whose Send deliberately carries no id: it is a
       proxy, and the id belongs to the postbox it presses. Same bubbling and
       the same drain, so a delegated listener on document sees it exactly as
       it sees a real press. */
    async pressSel(sel) {
      const el = win.document.querySelector(sel);
      if (!el) throw new Error(`no control matching "${sel}" on the counterparty page`);
      el.dispatchEvent(new win.Event('click', { bubbles: true }));
      for (let i = 0; i < 8; i++) await Promise.resolve();
      await new Promise(r => setImmediate(r));
      return el;
    },
    has: id => !!win.document.getElementById(id),
    /* WHO IS ANSWERING, once the box stopped being a box (12 Aug 2026). The
       workbench header used to carry #nego-cp-name and a test simply typed
       into it; the header now carries verbs instead, and the name comes off
       the chain portalResponderName reads — the reader's own remembered name
       is the link a test can set. Prefer this over setValue('nego-cp-name'),
       which only exists on the signing screen now. */
    setResponderName(v) {
      this.rememberingWorks();
      if (win.negoRememberName) win.negoRememberName(v);
      const box = win.document.getElementById('nego-cp-name')
        || win.document.getElementById('pt-name');
      if (box) box.value = v;
    },
    /* GIVE THIS STAGE A MEMORY, for the one key the page remembers a name in.
       Call it when the test is about the REMEMBERING rather than about the
       name — a reader answering the "who are you?" question once and not being
       asked again on the next press.

       This stage sits on an opaque origin, where READING window.localStorage
       throws — deliberate, and the plain assignment further up does not take
       because jsdom defines it as an accessor, so the product's own try/catch
       has always swallowed both the read and the write. The store is DEFINED
       here the way win.crypto is, and only for that key: everything else
       answers null, which is what the no-op stub already promised. */
    rememberingWorks() {
      if (win._responderStore) return win._responderStore;
      const KEY = win.NEGO_NAME_KEY || 'hati.v1.responderName';
      let held = null;
      win._responderStore = {
        getItem: k => (k === KEY ? held : null),
        setItem: (k, val) => { if (k === KEY) held = String(val); },
        removeItem: k => { if (k === KEY) held = null; },
      };
      Object.defineProperty(win, 'localStorage',
        { value: win._responderStore, configurable: true, writable: true });
      return win._responderStore;
    },
    setValue(id, v) {
      const el = win.document.getElementById(id);
      if (!el) throw new Error(`no field "${id}"`);
      el.value = v;
    },
    lastDownload: () => log.downloads[log.downloads.length - 1] || null,
    lastSent: () => (log.sent.length ? log.sent[log.sent.length - 1].body : null),
    derived: () => log.derived.slice(),
    toastText: () => log.toasts.map(t => t.msg).join(' | '),
  };
}

/* A share payload built by the product's own allow-list, from a contract of
   the shape Wanjiru actually negotiates. */
function sharePayloadFor(p, contract, who = {}, opts) {
  return p.win.buildSharePayload(contract, 'dochash-test', {
    org: who.org || 'Wanjiru Catering Ltd', sharedBy: who.sharedBy || 'Wanjiru Kamau' }, opts);
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
