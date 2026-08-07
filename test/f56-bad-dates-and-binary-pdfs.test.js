/* ============================================================
   F56 — one bad record must not take a screen down, and bytes are not text
   ============================================================
   Two faults with the same shape: something that was ALMOST the right kind of
   value was used as if it were exactly the right kind, and the product carried
   on as though nothing had happened.

   BAD DATES. Everything downstream of an expiry assumes a clean YYYY-MM-DD,
   because the date pickers produce one. An expiry can also arrive from metadata
   extraction, a bulk migration, or a spreadsheet somebody typed — and then it
   reads "30 September 2026". `new Date("30 September 2026T00:00:00")` is an
   Invalid Date, and `toISOString()` on an Invalid Date THROWS. That threw out
   of renewalDecisionDate, out of renderDashboard and renderCalendar, and took
   Home and Calendar down for the WHOLE PORTFOLIO — over one field on one
   contract. Worse, it threw before setActiveNav ran, so the nav button never
   highlighted: the screen did not report an error, it reported nothing, and the
   button read as dead.

   BINARY AS PROSE. pdfFlatText's fallback was `inf ? pdfLatin(inf) : m[1]` —
   so when the inflate failed, the RAW COMPRESSED BYTES were handed to the
   string scraper. Deflate output is high-entropy, so across a few hundred
   kilobytes it reliably contains `Tj` or `BT` and plenty of `(`…`)` pairs. The
   test passed, the scraper scraped, and the noise between the parentheses was
   stored as the contract's text and printed by the PDF export.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { buildWorld } = require('./world');
const { loadViews, fakeDocument, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const ROOT = path.join(__dirname, '..');

/* ------------------------------------------------------------------ dates */

const badContract = (over = {}) => ({
  id: 'MK-BAD', name: 'Cold chain haulage — Savannah', counterparty: 'Savannah Consumer Goods Limited',
  folder: 'proc', status: 'Under Review', value: 4800000, valueType: 'standard',
  metadata: { expiryDate: '30 September 2026', noticePeriodDays: 60 },
  audit: [], comments: [], signatures: [], obligations: [], ...over,
});

/* The real renewalDecisionDate, on the real Home and Calendar renderers.
   obligations.js loads first so its export replaces the stub the harness
   supplies — the whole point is to exercise the shipped function. */
function screens(contracts) {
  const sb = loadViews(['js/obligations.js', 'js/views/home.js', 'js/views/calendar.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    state: { contracts, settings: {}, view: 'dashboard',
      serverStats: { total: contracts.length }, shareOverview: {}, shareByContract: {} },
  });
  return sb;
}

describe('F56 — an expiry that is not a date does not take the screen down', () => {
  test('"30 September 2026" is read as a date rather than thrown on', () => {
    const sb = screens([badContract()]);
    // 30 Sep 2026 less 60 days' notice
    assert.equal(sb.renewalDecisionDate(badContract()), '2026-08-01');
  });

  test('Home renders, with the whole portfolio on it', () => {
    const good = badContract({ id: 'MK-OK', name: 'Warehousing — Nordfrakt',
      metadata: { expiryDate: '2026-12-31', noticePeriodDays: 30 } });
    const sb = screens([badContract(), good]);
    sb.renderDashboard();
    const html = sb.document.getElementById('content').innerHTML;
    assert.ok(html.includes('Key metrics'), 'the dashboard must have rendered');
    assert.ok(html.includes('MK-OK'),
      'one malformed record must not cost every other contract its screen');
  });

  test('Calendar renders, and the malformed expiry lands on a real day', () => {
    const sb = screens([badContract()]);
    sb.renderCalendar();
    assert.match(sb.document.getElementById('content').innerHTML, /cal-day/,
      'the calendar grid must have rendered');
    /* Not only "does not crash": the grid is keyed by YYYY-MM-DD, so an event
       carrying "30 September 2026" was built, counted, and then drawn on no day
       at all — present in the data and invisible on the screen. */
    const evs = sb.calendarEvents();
    const exp = evs.find(e => e.type === 'expiry');
    assert.equal(exp.date, '2026-09-30', 'the expiry event has to key to a cell');
    assert.equal(evs.find(e => e.type === 'renewal').date, '2026-08-01');
  });

  test('a value that is no kind of date is null, not a guess', () => {
    const sb = screens([]);
    assert.equal(sb.dateOnly('to be confirmed'), null);
    assert.equal(sb.dateOnly(''), null);
    assert.equal(sb.dateOnly(null), null);
    assert.equal(sb.renewalDecisionDate(badContract({ metadata: { expiryDate: 'TBC', noticePeriodDays: 60 } })), null,
      'not knowing when a contract expires is a real answer, and every caller already handles it');
  });

  test('a full ISO datetime is accepted, and a clean date is untouched', () => {
    const sb = screens([]);
    assert.equal(sb.dateOnly('2026-09-30T14:22:07.001Z'), '2026-09-30');
    assert.equal(sb.dateOnly('2026-09-30'), '2026-09-30');
  });

  /* toISOString() converts to UTC first, so midnight local in Nairobi (UTC+3)
     comes back as the previous day — a renewal deadline reported one day early,
     every time, in the market this product is built for. */
  test('the day is the reader’s own day, not a UTC one', () => {
    const sb = screens([]);
    const c = badContract({ metadata: { expiryDate: '2026-03-01', noticePeriodDays: 1 } });
    assert.equal(sb.renewalDecisionDate(c), '2026-02-28');
  });
});

/* ---------------------------------------------------------------- setView */

/* js/app.js is the shell module: it boots on load and wires the chrome. Loading
   it means stubbing what the shell reaches for — worth it, because the fault
   being tested is in setView itself and a paraphrase of setView would prove
   nothing about the file that ships. */
function shell(renderers = {}) {
  const document = fakeDocument();
  const calls = [];
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
    setTimeout: fn => { try { fn(); } catch (_) {} }, clearTimeout() {},
    document, location: { hash: '' },
    fetch: () => Promise.reject(new Error('no server in this stage')),
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    state: { contracts: [], settings: {}, view: 'dashboard' },
    LS: { session: 's', ui: 'u' }, lsSet() {},
    /* setView's neighbours read labels through the dictionary; this stage only
       needs the accessor to exist, not the whole language layer. */
    i18t: k => k, i18tn: k => k,
    hydrate() {}, getOrg: () => ({ name: 'Highland Corporate Ltd' }), getSession: () => null,
    currentUser: () => null, renderAuth() {}, startApp() {},
    API_MODE: () => true, persist() {}, api: () => Promise.reject(new Error('offline')),
    toast: (m, k) => calls.push({ kind: 'toast', message: m, tone: k }),
    // called near the END of setView — recording it proves the tail ran
    schedulePolling() { calls.push({ kind: 'tail' }); },
    esc: s => String(s == null ? '' : s), icon: () => '', fmtDT: s => String(s || ''),
    fmtMoney: n => 'KES ' + n, fmtMoneyShort: n => 'KES ' + n,
    FOLDERS: STUB_FOLDERS, TEMPLATES: STUB_TEMPLATES,
    metrics: () => ({ totalValue: 0, pending: 0, signed: 0, declined: 0, drafts: 0 }),
    overdueObligationCount: () => 0, questionCount: () => 0, questionDot: () => '',
    canEdit: () => true, canViewValues: () => true, isAdmin: () => true,
    myCreatableTemplates: () => [], customTemplates: () => [],
    contractRisk: () => 0, statusChip: () => '', daysUntil: () => 0, renewalDecisionsDue: () => [],
    approvalState: () => ({ required: false, ok: true, chain: [], next: null }),
    advicePendingCount: () => 0, effectiveExpiry: c => c.expiry || null, agreementsIn: cs => cs,
    renderDashboard() {}, renderFolder() {}, renderIntel() {}, renderCalendar() {},
    renderReports() {}, renderRegister() {}, renderMigration() {}, renderPipeline() {},
    renderAdviceDesk() {}, renderTemplatesPage() {}, renderPlaybookPage() {}, renderTeam() {},
    renderWorkspace() {},
    ...renderers,
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  // the import statements are the module system's, not the shell's
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8').replace(/^import .*$/gm, ''),
    sb, { filename: 'js/app.js' });
  return { sb, calls, document };
}

describe('F56 — a view that cannot draw itself says so', () => {
  test('a throwing render does not stop the rest of the switch', () => {
    const { sb, calls } = shell({
      renderDashboard() { throw new Error('d.toISOString is not a function'); },
    });
    sb.setView('dashboard');
    assert.equal(sb.state.view, 'dashboard', 'the view still switched');
    assert.ok(calls.some(c => c.kind === 'tail'),
      'everything after the render — nav highlighting included — has to still run, '
      + 'or the button reads as dead rather than as broken');
  });

  test('and it names the view and the error', () => {
    const { sb, calls, document } = shell({
      renderCalendar() { throw new Error('d.toISOString is not a function'); },
    });
    sb.setView('calendar');
    const t = calls.find(c => c.kind === 'toast');
    assert.ok(t, 'silence is the one thing a broken screen must not do');
    assert.match(t.message, /Calendar could not be drawn/);
    assert.match(t.message, /toISOString/, 'the reason travels, not just the fact');
    assert.equal(t.tone, 'err');
    assert.match(document.getElementById('content').innerHTML, /could not be drawn/,
      'and the empty screen says it too — a toast is gone in four seconds');
  });

  test('the record is named when the error knows which one it was', () => {
    const { sb, calls } = shell({
      renderDashboard() { const e = new Error('bad date'); e.contractId = 'MK-BAD'; throw e; },
    });
    sb.setView('dashboard');
    assert.match(calls.find(c => c.kind === 'toast').message, /MK-BAD/);
  });

  test('and is not invented when it does not', () => {
    const { sb, calls } = shell({ renderReports() { throw new Error('bad date'); } });
    sb.setView('reports');
    const msg = calls.find(c => c.kind === 'toast').message;
    assert.match(msg, /Reports could not be drawn/);
    assert.ok(!/check /.test(msg), 'a guessed contract id sends someone to the wrong record');
  });

  test('a view that renders is left completely alone', () => {
    let drew = 0;
    const { sb } = shell({ renderRegister() { drew++; } });
    sb.setView('register');
    assert.equal(drew, 1);
    assert.equal(sb.document.getElementById('content').innerHTML, '',
      'nothing is written over a screen that drew itself');
  });
});

/* ------------------------------------------------------------------- PDFs */

/* A stream that DECLARES /FlateDecode and whose bytes will not inflate: a
   truncated file, an unsupported predictor, an encrypted document. The payload
   is chosen to look exactly like the one that caused this — it carries `Tj` and
   `BT` and several (…) pairs, so the old code's probe matched and the scraper
   found plenty to scrape. */
function undeflatablePdf() {
  let s = '\x78\x9c';                               // a zlib header that leads nowhere
  s += '\x01\x8f\xd3(\x92\xb4\xfeTj\x00\x11(\xe2\x9a\x7f)\x03BT\x9c(\xff\xfe\xab)\x14\x80';
  for (let i = 0; i < 400; i++) s += String.fromCharCode((i * 37 + 11) % 256);
  s += '(\x01\x02\x03\x04)Tj';
  const pdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n'
    + `2 0 obj\n<< /Length ${s.length} /Filter /FlateDecode >>\nstream\n${s}\nendstream\nendobj\n`
    + 'trailer\n<< /Root 1 0 R >>\n%%EOF';
  return { bytes: Uint8Array.from(pdf, ch => ch.charCodeAt(0) & 0xff), stream: s };
}
/* The same undeflatable stream inside a document with a real page tree, so the
   STRUCTURED reader walks it rather than the flat scrape. Both paths reached
   the same fault by different routes: pdfStreamBytes returned `inf || arr`, so
   a stream that would not inflate came back as its own compressed bytes and was
   handed to the content-stream walker as drawing operators. */
function undeflatablePagedPdf() {
  const { stream } = undeflatablePdf();
  const pdf = '%PDF-1.4\n'
    + '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
    + '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
    + '3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources << /Font << >> >> >>\nendobj\n'
    + `4 0 obj\n<< /Length ${stream.length} /Filter /FlateDecode >>\nstream\n${stream}\nendstream\nendobj\n`
    + 'trailer\n<< /Root 1 0 R >>\n%%EOF';
  return Uint8Array.from(pdf, ch => ch.charCodeAt(0) & 0xff);
}
function plainPdf(lines) {
  const content = 'BT /F1 11 Tf 56 780 Td\n'
    + lines.map(l => `(${l}) Tj\n`).join('') + 'ET';
  const pdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n'
    + `2 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`
    + 'trailer\n<< /Root 1 0 R >>\n%%EOF';
  return Uint8Array.from(pdf, ch => ch.charCodeAt(0) & 0xff);
}

describe('F56 — a PDF that will not inflate yields nothing, not noise', () => {
  test('extraction returns an empty string', async () => {
    const win = buildWorld({ contractView: true }).win;
    const { bytes } = undeflatablePdf();
    assert.equal(await win.extractPdfText(bytes.buffer), '',
      'the honest answer to "what does this say" is that we could not read it');
  });

  /* This is what the old code produced, and the assertion is here so the fault
     is on the record as something that really happened rather than as a
     description of it. */
  test('the bytes the old path scraped were genuinely unreadable', () => {
    const win = buildWorld({ contractView: true }).win;
    const scraped = win.pdfStringsFrom(undeflatablePdf().stream);
    assert.ok(scraped.length > 100, 'compressed bytes really do scrape into something');
    assert.equal(win.looksLikeText(scraped), false, 'and that something is not text');
  });

  test('and the structured reader gives nothing back for it either', async () => {
    const win = buildWorld({ contractView: true }).win;
    assert.equal(await win.extractPdfText(undeflatablePagedPdf().buffer), '',
      'a real page tree over an unreadable stream is still an unreadable document');
  });

  test('an uncompressed content stream still reads — the fix is not a blanket skip', async () => {
    const win = buildWorld({ contractView: true }).win;
    const out = await win.extractPdfText(plainPdf(['MASTER SUPPLY AGREEMENT', '1. SCOPE OF SERVICES']).buffer);
    assert.match(out, /MASTER SUPPLY AGREEMENT/);
    assert.match(out, /SCOPE OF SERVICES/);
  });

  test('empty is what puts the OCR offer in front of the reader', async () => {
    const win = buildWorld({ contractView: true }).win;
    const { bytes } = undeflatablePdf();
    const text = await win.extractPdfText(bytes.buffer);
    // ocrNeeded's own rule, restated here because that is the consequence the
    // empty string exists to produce
    assert.ok(String(text).trim().length < 200,
      'under the OCR floor, so the scan is offered to a reader who can act on it');
  });

  test('looksLikeText knows a contract from a byte dump', () => {
    const win = buildWorld({ contractView: true }).win;
    assert.equal(win.looksLikeText('1. SCOPE\nThe Provider shall deliver the Goods.'), true);
    assert.equal(win.looksLikeText('Prix: 4 800 000 KES — livraison à Nairobi'), true,
      'accented Latin-1 is text');
    assert.equal(win.looksLikeText(''), true, 'nothing is not garbage');
    let junk = '';
    for (let i = 0; i < 300; i++) junk += String.fromCharCode(i % 32);
    assert.equal(win.looksLikeText(junk), false);
  });

  test('a declared filter is not the only signal — a zlib header is one too', () => {
    const win = buildWorld({ contractView: true }).win;
    const bin = 'x'.repeat(50) + 'stream\n\x78\x9cJUNK';
    assert.equal(win.pdfStreamIsCompressed(bin, 57, '\x78\x9c\x01\x8f'), true);
    assert.equal(win.pdfStreamIsCompressed(bin, 57, 'BT /F1 11 Tf (Hello) Tj ET'), false,
      'an uncompressed content stream must not be mistaken for a compressed one');
  });
});
