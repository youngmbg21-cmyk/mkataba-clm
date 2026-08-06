/* ============================================================
   F68 — ticking off an obligation updates the number that counts them
   ============================================================
   An event × surface gap, of exactly the shape the negotiation room had.

   The sidebar carries a live count on Calendar: obligations due in the next
   sixty days. Every screen switch recomputes it, because setView() ends with
   updateSidebarCounts(). Nothing else does.

   So the three things that CHANGE that number — adding an obligation,
   completing one, removing one — all happen inside the workspace, which is not
   a screen switch. Mark the last obligation on your portfolio done and the
   badge beside Calendar still reads 1. It stays reading 1 until you happen to
   navigate somewhere and back, at which point it silently corrects itself.
   A number that is wrong and then quietly right is worse than one that is
   simply absent: nobody knows which reading to believe.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

const at = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
const isoDay = off => { const d = at(off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* Just enough of the application around js/obligations.js for its own section
   to render and its own buttons to be pressed — the file under test is the one
   that ships. */
function stage(contract) {
  const dom = new JSDOM('<!doctype html><html><body><div id="obligations-section"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const counted = [];
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, setTimeout: win.setTimeout.bind(win), clearTimeout: win.clearTimeout.bind(win),
    document: win.document, localStorage: win.localStorage, Event: win.Event,
    state: { contracts: [contract], settings: {}, view: 'workspace', activeId: contract.id },
    esc: s => String(s == null ? '' : s), icon: () => '', fmtDT: s => String(s || ''),
    toast() {}, persist() {}, logAudit() {}, openModal() {}, closeModal() {},
    canEdit: () => true, API_MODE: () => true, getUsers: () => [], nowISO: () => new Date().toISOString(),
    isUpload: () => false, effectiveExpiry: c => c.expiry || null,
    daysUntil: iso => Math.ceil((new Date(iso + 'T00:00:00') - Date.now()) / 86400000),
    // the surface under test: the shell's own recompute of the sidebar badges
    updateSidebarCounts() { counted.push(Date.now()); },
    renderCalendar() { counted.push('calendar'); },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  /* js/i18n.js first, as js/app.js loads it: every visible label in the module
     below reads through i18t(). */
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'), sb,
    { filename: 'js/i18n.js' });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/obligations.js'), 'utf8'), sb,
    { filename: 'js/obligations.js' });
  const press = sel => {
    const b = win.document.querySelector(sel);
    assert.ok(b, `the section must offer ${sel}`);
    b.dispatchEvent(new win.Event('click', { bubbles: true }));
  };
  return { sb, win, counted, press };
}

const contract = () => ({
  id: 'MK-OBL', name: 'Distribution agreement', counterparty: 'Tamu Beverages Ltd',
  folder: 'proc', status: 'Under Review', metadata: {}, expiry: null,
  audit: [], comments: [], signatures: [],
  obligations: [{ id: 'ob_1', desc: 'Pay the quarterly minimum', due: isoDay(20),
    recurring: 'quarterly', status: 'open', quote: '' }],
});

describe('F68 — the sidebar count follows the obligation it counts', () => {
  test('completing one recomputes the badge', () => {
    const c = contract();
    const t = stage(c);
    t.sb.renderObligationsSection(c);
    assert.equal(t.counted.length, 0, 'nothing has changed yet');
    t.press('[data-ob-toggle="0"]');
    assert.equal(c.obligations[0].status, 'done', 'the record moved');
    assert.ok(t.counted.length >= 1,
      'and the number beside Calendar has to move with it — otherwise it reads 1 '
      + 'over a portfolio with nothing due, and corrects itself only when the '
      + 'reader happens to navigate away and back');
  });

  test('reopening one recomputes it again', () => {
    const c = contract();
    c.obligations[0].status = 'done';
    const t = stage(c);
    t.sb.renderObligationsSection(c);
    t.press('[data-ob-toggle="0"]');
    assert.equal(c.obligations[0].status, 'open');
    assert.ok(t.counted.length >= 1);
  });

  test('removing one recomputes it too', () => {
    const c = contract();
    const t = stage(c);
    t.sb.renderObligationsSection(c);
    t.press('[data-ob-del="0"]');
    assert.equal(c.obligations.length, 0, 'the record moved');
    assert.ok(t.counted.length >= 1);
  });
});
