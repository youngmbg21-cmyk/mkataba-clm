/* ============================================================
   COLLISION SWEEP — the real save path, on a real server
   ============================================================
   Shared rig for the C1 probes.

   The claim under test is about js/core.js's OWN conflict branch — persist() /
   flushSaves() / saveContract() / restoreHeavyFields() — so nothing here
   re-implements them. The block is sliced VERBATIM out of js/core.js at run
   time (from `const dirty=new Map();` to `function hydrate(){`) and evaluated
   in a vm sandbox whose `api` is a real cookie-keeping HTTP client pointed at a
   real HaTi server. Everything around it — toast, confirmDialog, state,
   renderWorkspace — is a RECORDER, exactly the shape test/world.js uses, so
   what is measured is the product's decision and not the harness's.

   If js/core.js ever loses those markers this file throws loudly rather than
   silently testing a re-implementation. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..', '..');
const CORE = path.join(ROOT, 'js', 'core.js');

const START = 'const dirty=new Map();';
const END = 'function hydrate(){';

function coreSaveSource() {
  const src = fs.readFileSync(CORE, 'utf8');
  const a = src.indexOf(START);
  const b = src.indexOf(END);
  if (a < 0 || b < 0 || b <= a) throw new Error('js/core.js markers moved — cannot slice the real save path');
  return src.slice(a, b);
}

/* A browser-shaped sandbox around the REAL save path. `client` is a
   helpers.js Client (cookie-keeping); `opts.keepMine` decides what the H-4
   dialog answers. */
function makeSaver(client, opts = {}) {
  const log = { toasts: [], dialogs: [], renders: 0, api: [] };
  const sandbox = {
    console,
    setTimeout, clearTimeout,
    JSON, Object, Array, Number, String, Boolean, Math, Date, Map, Set, Promise, Error, RegExp,
    state: opts.state || { view: 'contract', activeId: null, contracts: [] },
    uid: 200,
    API_MODE: () => true,
    canEdit: () => true,
    LS: { ui: 'hati.v1.ui', data: 'hati.v1.data' },
    lsSet: () => {},
    lsGet: () => null,
    i18t: k => k,
    toast: (msg, kind) => { log.toasts.push({ msg: String(msg), kind: kind || 'ok' }); },
    renderWorkspace: () => { log.renders++; },
    updateSidebarCounts: () => {},
    refreshStats: () => {},
    getContract: id => (sandbox.state.contracts || []).find(x => x && x.id === id) || null,
    normalizeDesignBranding: b => b,
    todayStr: () => '15 Aug 2026',
    confirmDialog: async (o) => {
      log.dialogs.push({ title: (o && o.title) || '', message: (o && o.message) || '',
        confirmLabel: (o && o.confirmLabel) || '', cancelLabel: (o && o.cancelLabel) || '' });
      return typeof opts.keepMine === 'function' ? opts.keepMine(log.dialogs.length) : !!opts.keepMine;
    },
    async api(pathname, method = 'GET', body) {
      log.api.push({ pathname, method, hasBody: body !== undefined });
      const r = await client.raw('/api/' + pathname, { method, body });
      if (r.status >= 400) {
        const e = new Error((r.json && r.json.error) || ('Request failed (' + r.status + ')'));
        e.status = r.status; e.data = r.json || null;
        throw e;
      }
      return r.json;
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(coreSaveSource(), sandbox, { filename: 'js/core.js[save-path-slice]' });
  /* `const dirty=new Map()` is a LEXICAL binding: in a vm context a top-level
     const never becomes a property of the global object, so it is read back
     through the context rather than off the sandbox (function declarations —
     persist, flushSaves, saveContract — do become globals, which is why those
     are reachable directly). */
  return { sandbox, log,
    saveContract: c => sandbox.saveContract(c),
    persist: c => sandbox.persist(c),
    flushSaves: () => sandbox.flushSaves(),
    dirtyIds: () => [...vm.runInContext('dirty', sandbox).keys()],
  };
}

/* ---------- tiny assertion kit; every probe prints PASS/FAIL and exits ---------- */
function harness(name) {
  let pass = 0, fail = 0;
  const lines = [];
  const ok = (cond, msg, detail) => {
    if (cond) { pass++; lines.push(`PASS  ${msg}`); }
    else { fail++; lines.push(`FAIL  ${msg}${detail !== undefined ? '  →  ' + JSON.stringify(detail) : ''}`); }
    console.log(lines[lines.length - 1]);
    return !!cond;
  };
  const note = (msg) => { console.log(`      · ${msg}`); };
  const done = () => {
    console.log(`\n${name}: ${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  };
  return { ok, note, done, counts: () => ({ pass, fail }) };
}

module.exports = { makeSaver, coreSaveSource, harness, ROOT };
