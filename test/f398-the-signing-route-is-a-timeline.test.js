/**
 * f398 — THE SIGNING ROUTE IS A TIMELINE, AND IT NAMES PEOPLE WHO CAN BE
 * REACHED (Young ruled it 27 Sep 2026: "1, Yes. 2, Yes, 3, Yes. Then build
 * timeline").
 *
 * "Create render options for this pop up. The current design is frankly very
 * poor." Three designs were drawn working on the real Signing tab and the
 * owner picked Timeline by name, answering the page's three questions yes:
 *   1 · Save refuses a signer on their side who has no email;
 *   2 · Save refuses when the only name for a party is the company's;
 *   3 · Save refuses a party that signs — a guarantor — with nobody named.
 *
 * WHAT IS PINNED HERE, in five sections:
 *   (1) THE RULES, run for real: js/parties.js and js/approvals.js loaded into
 *       one VM, saveSignerPlan and signerPlanWhy asked about real routes. A
 *       reading must not write, and the side rule keeps its own words first.
 *   (2) THE WINDOW'S SHAPE, read off the source: one way to set the order (no
 *       Step box, no side dropdown), the refusal said in the window, one filled
 *       button in a named foot, queries asked of its own element, Escape that
 *       closes the smallest thing open, and their slot never opening on the
 *       company's name.
 *   (3) THE WORDS: every new sentence in both books, and the top line true for
 *       every order.
 *   (4) THE PHONE: its sheet hands the WHOLE route to the one save, and no
 *       longer pre-fills the company's name as a person.
 *   (5) THE CLOTHES: the tints are mixed from the surface, so they have a night
 *       answer, and nothing shouts !important.
 *
 * AT THE PARENT (5409902) 24 of the 30 claims FAIL (measured in a worktree at
 * unmodified main) — the three rules did not exist, the window was the old
 * form, the phone handed over two rows. The six that pass there are named:
 * (1i) the ordinary two-party route that has always saved and (1f)/(1g) the
 * two routes the new rules must NOT refuse (CONTROLS — at the parent nothing
 * refused anything, so they pass there trivially; they are what stops the new
 * rules over-reaching), and three WALLS that did not move: (1h) the side
 * rule's own words, (4c) the phone keeping no copy of the rules, (5c) no
 * !important. (2a) fails there as a whole: its first half (the Who else
 * prefill) is a wall, its second half is new.
 * The browser half is test/chromium/signing-route-timeline-verify.js.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const APPROVALS = read('js/approvals.js');
const MOBILE = read('js/mobile-contract.js');
const I18N = read('js/i18n.js');
const HTML = read('index.html');

/* One function's source, from its declaration to the closing brace at column
   0 — PIN THE REGION, NOT A BYTE COUNT. '' where it does not exist. */
const fnBody = (src, name) => {
  const at = src.indexOf('function ' + name + '(');
  if (at < 0) return '';
  const end = src.indexOf('\n}', at);
  return end < 0 ? src.slice(at) : src.slice(at, end + 2);
};
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/* THE STAGE FOR THE RULES. Both files are ordinary scripts to a VM: their
   top-level functions land on the context, which is also `window`, so the
   parties module is reached exactly as the browser reaches it. i18t echoes the
   key and its values, so a claim can read WHICH sentence and ABOUT WHOM. */
function load(){
  const audit = [], saved = [];
  const ctx = {
    console, Math, Date, JSON, Number, String, Array, Object, Map, Set, RegExp, Promise,
    i18t: (k, v) => k + (v ? ':' + Object.keys(v).sort().map(x => x + '=' + v[x]).join(',') : ''),
    i18tn: (k, n, v) => k, esc: x => String(x == null ? '' : x),
    logAudit: (c, action, detail) => audit.push({ action, detail }),
    persist: c => saved.push(c.id), toast: () => {}, currentUser: () => null, getUsers: () => [],
    fmtMoneyShort: x => String(x), state: { contracts: [], settings: {} },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
      createElement: () => ({ style: {} }), addEventListener: () => {} },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('js/parties.js'), ctx, { filename: 'parties.js' });
  try { vm.runInContext(APPROVALS, ctx, { filename: 'approvals.js' }); } catch (e) { /* it wires more than it needs */ }
  return { w: ctx, audit, saved };
}
const two = (plan) => ({ id: 'MK-160', counterparty: 'Juno Logistics Ltd', signerPlan: plan });
const guar = (w, plan) => {
  const c = { id: 'MK-147', counterparty: 'Muranga Distributors Ltd' };
  w.partiesSet(c, [
    { side: 'ours', name: 'Highland Corporate Ltd' },
    { side: 'theirs', name: 'Muranga Distributors Ltd', role: 'Distributor' },
    { side: 'theirs', name: 'Muranga Holdings Ltd', role: 'Guarantor', involvement: 'sign' },
  ]);
  const th = w.partiesTheirs(c);
  c.signerPlan = plan ? plan(th) : undefined;
  return { c, th };
};
const US = { party: 'internal', name: 'Amina Otieno', email: 'amina@highland.co.ke', role: 'Head of Legal', memberId: 'u2' };

/* ============================================================================
   1 · THE RULES
   ==========================================================================*/
describe('f398 (1) the three refusals, run for real', () => {
  test('(1a) a signer on their side with no email is refused, by name', () => {
    const { w } = load();
    assert.equal(typeof w.saveSignerPlan, 'function', 'the one save loads');
    const c = two();
    const why = w.saveSignerPlan(c, [US, { party: 'counterparty', name: 'Grace Njeri', email: '' }]);
    assert.equal(why, 'ap_need_their_email:name=Grace Njeri');
    assert.equal(c.signerPlan, undefined, 'and nothing was filed');
  });

  test('(1b) an address that is not one is refused too; a real one saves', () => {
    const { w, audit } = load();
    const c = two();
    assert.equal(w.saveSignerPlan(c, [US, { party: 'counterparty', name: 'Grace Njeri', email: 'grace at juno' }]),
      'ap_need_their_email:name=Grace Njeri');
    assert.equal(w.saveSignerPlan(c, [US, { party: 'counterparty', name: 'Grace Njeri', email: 'grace@juno.co.ke' }]), null);
    assert.deepEqual(c.signerPlan.map(s => s.name), ['Amina Otieno', 'Grace Njeri']);
    assert.ok(audit.some(e => e.action === 'Signing route'));
  });

  test('(1c) the company standing in for a person is refused — the owner\'s own NDA', () => {
    const { w } = load();
    const c = two();
    const why = w.saveSignerPlan(c, [US, { party: 'counterparty', name: 'Juno Logistics Ltd', email: 'legal@juno.co.ke' }]);
    assert.equal(why, 'ap_need_person:party=Juno Logistics Ltd');
    /* Folded: case and punctuation do not make it a person. */
    assert.equal(w.saveSignerPlan(c, [US, { party: 'counterparty', name: 'JUNO LOGISTICS, LTD.', email: 'legal@juno.co.ke' }]),
      'ap_need_person:party=Juno Logistics Ltd');
  });

  test('(1d) asked PER PARTY: a company name beside a real person is not a party left unsigned', () => {
    const { w } = load();
    const c = two();
    assert.equal(w.saveSignerPlan(c, [US,
      { party: 'counterparty', name: 'Grace Njeri', email: 'grace@juno.co.ke' },
      { party: 'counterparty', name: 'Juno Logistics Ltd', email: 'legal@juno.co.ke' }]), null,
      'the owner\'s question was "the ONLY name" — the card still flags it, the save is not refused over it');
    assert.equal(w.signerIsCompany(c, { party: 'counterparty', name: 'Juno Logistics Ltd' }), true, 'and the card\'s reading still says so');
    assert.equal(w.signerIsCompany(c, { party: 'internal', name: 'Juno Logistics Ltd' }), false, 'asked of their side only');
  });

  test('(1e) a party that signs with nobody named is refused — a guarantor included', () => {
    const { w } = load();
    const { c } = guar(w);
    const why = w.saveSignerPlan(c, [
      { party: 'counterparty', name: 'Joseph Kariuki', email: 'j@md.co.ke' }, US]);
    assert.equal(why, 'ap_need_party:party=Muranga Holdings Ltd');
  });

  test('(1f) a party that does not sign is not asked for', () => {
    const { w } = load();
    const c = { id: 'MK-9', counterparty: 'Muranga Distributors Ltd' };
    w.partiesSet(c, [
      { side: 'ours', name: 'Highland Corporate Ltd' },
      { side: 'theirs', name: 'Muranga Distributors Ltd' },
      { side: 'theirs', name: 'Muranga Bank Ltd', role: 'Paying agent', involvement: 'none' },
    ]);
    assert.equal(w.saveSignerPlan(c, [{ party: 'counterparty', name: 'Joseph Kariuki', email: 'j@md.co.ke' }, US]), null);
  });

  test('(1g) the guarantor\'s signer is counted for the guarantor, by the party it names', () => {
    const { w } = load();
    const { c, th } = guar(w);
    const why = w.saveSignerPlan(c, [
      { party: 'counterparty', name: 'Joseph Kariuki', email: 'j@md.co.ke', partyId: th[0].id, step: 1 },
      { party: 'counterparty', name: 'Grace Wambui', email: 'g@mh.co.ke', partyId: th[1].id, step: 1 },
      { ...US, step: 2 }]);
    assert.equal(why, null);
    assert.deepEqual(c.signerPlan.map(s => [s.name, s.step, s.partyId || '']),
      [['Joseph Kariuki', 1, th[0].id], ['Grace Wambui', 1, th[1].id], ['Amina Otieno', 2, '']]);
  });

  test('(1h) [wall] the side rule still comes first, in its own words', () => {
    const { w } = load();
    const c = two();
    assert.equal(w.saveSignerPlan(c, [US]), 'ap_need_their_side:them=Juno Logistics Ltd');
    assert.equal(w.saveSignerPlan(c, [{ party: 'counterparty', name: 'Grace Njeri', email: 'g@j.co' }]), 'ap_need_our_side:them=Juno Logistics Ltd');
  });

  test('(1i) [control] an ordinary two-party route saves, as it always did', () => {
    const { w } = load();
    const c = two();
    assert.equal(w.saveSignerPlan(c, [US, { party: 'counterparty', name: 'Grace Njeri', email: 'g@j.co' }]), null);
    assert.equal(c.signerPlan.length, 2);
  });

  test('(1j) READING MUST NOT WRITE: signerPlanWhy answers what Save would, and files nothing', () => {
    const { w, audit, saved } = load();
    assert.equal(typeof w.signerPlanWhy, 'function');
    const c = two([{ id: 'sg_x', party: 'internal', name: 'Old', email: 'o@h.co', order: 1 }]);
    const rows = [US, { party: 'counterparty', name: 'Juno Logistics Ltd', email: '' }];
    assert.equal(w.signerPlanWhy(c, rows), 'ap_need_person:party=Juno Logistics Ltd');
    assert.deepEqual(c.signerPlan.map(s => s.name), ['Old'], 'the route is untouched');
    assert.equal(audit.length + saved.length, 0, 'no audit line, no save');
    assert.equal(w.saveSignerPlan(c, rows), w.signerPlanWhy(c, rows), 'and Save refuses with the very same sentence');
  });

  test('(1k) the refusal says where it points, so the window can put the reader there', () => {
    const { w } = load();
    const c = two();
    const hit = w.signerPlanRefusal(c, [US, { id: 'sg_t', party: 'counterparty', name: 'Grace Njeri', email: '' }]);
    assert.deepEqual({ rowId: hit.rowId, field: hit.field }, { rowId: 'sg_t', field: 'email' });
    const co = w.signerPlanRefusal(c, [US, { id: 'sg_c', party: 'counterparty', name: 'Juno Logistics Ltd', email: 'x@y.z' }]);
    assert.deepEqual({ rowId: co.rowId, field: co.field }, { rowId: 'sg_c', field: 'name' });
  });
});

/* ============================================================================
   2 · THE WINDOW'S SHAPE
   ==========================================================================*/
describe('f398 (2) the window is a timeline', () => {
  const ed = fnBody(APPROVALS, 'openSignerPlanEditor');
  const win = fnBody(APPROVALS, 'signerRouteWindow');

  test('(2a) the empty route still opens on the people named [wall], and their slot never on the company', () => {
    assert.ok(/if\(!plan\.length/.test(ed) && /participantSignerRows/.test(ed), 'the Who else prefill is kept');
    assert.ok(!/them\.name\|\|c\.counterparty/.test(ed), 'no fallback to the company\'s name');
    assert.ok(/signerIsCompany\(c, \{ party:'counterparty', name:them\.name \}\)/.test(ed), 'a contact who IS the company is not a person either');
    assert.ok(/signerRouteWindow\(c, plan, back\)/.test(ed), 'and it hands the route to the window');
  });

  test('(2b) one way to set the order: no Step number box, no side dropdown', () => {
    assert.ok(win.length > 2000, 'the window exists');
    assert.ok(!/type="number"/.test(win), 'no number box');
    assert.ok(!/<select/.test(win), 'no dropdown');
    assert.ok(/class="sr-step"/.test(win) && /class="sr-node"/.test(win), 'numbered steps on a line');
    assert.ok(/i18t\('ap_sr_any'\)/.test(win), 'and a shared step says it signs in any order');
  });

  test('(2c) a person who is complete rests; one with something missing opens', () => {
    assert.ok(/const open=new Set\(rows\.filter\(r=>Object\.keys\(needs\(r\)\)\.length\)/.test(win));
    assert.ok(/sr-card is-rest/.test(win) && /sr-card is-open/.test(win));
  });

  test('(2d) the refusal is said IN the window, beside Save — not in a toast that fades', () => {
    const save = win.slice(win.indexOf("getElementById('sp-save')"));
    assert.ok(/saveSignerPlan\(c, plan\)/.test(save), 'the one save');
    assert.ok(/say=why;/.test(save), 'its sentence is kept for the foot');
    assert.ok(!/toast\(why/.test(save), 'and no toast says it instead');
    assert.ok(/id="sr-say" role="alert"/.test(win), 'the foot carries it, announced');
    assert.ok(/say=signerPlanWhy\(c, rowsOut\(\)\)\|\|''/.test(win), 'and it follows the reader\'s typing');
  });

  test('(2e) one filled button, in a named foot', () => {
    assert.equal((win.match(/ui-btn-primary/g) || []).length, 1, 'Save route is the one filled button');
    assert.ok(/class="dlg-foot sr-foot"/.test(win), 'the foot is named, so it is pinned');
    assert.ok(/id="sp-cancel"/.test(win) && /id="sp-save"/.test(win), 'Cancel then Save, same ids as ever');
  });

  test('(2f) the window asks only its own element, never the document, for its controls', () => {
    assert.ok(!/document\.querySelectorAll\(/.test(code(win)), 'no document-wide sweep');
    assert.ok(/const q=sel=>win\.querySelector\(sel\)/.test(win));
  });

  test('(2g) Escape closes the smallest thing open, and only that', () => {
    const k = win.slice(win.indexOf("if(e.key==='Escape')"));
    assert.ok(/if\(combo\)\{ comboHide\(\); e\.stopPropagation\(\); return; \}/.test(k), 'the team list first');
    assert.ok(/if\(menuAt\)\{ const a=menuAt; closeMenu\(\); try\{ a\.focus\(\); \}catch\(_\)\{\} e\.stopPropagation\(\); return; \}/.test(k),
      'then a menu, with focus back on its button');
  });

  test('(2h) moving from the keyboard: Alt+↑ and Alt+↓ ask the same moves the menu does', () => {
    assert.ok(/e\.altKey && \(e\.key==='ArrowUp' \|\| e\.key==='ArrowDown'\)/.test(win));
    assert.ok(/move\(r, e\.key==='ArrowUp'\?'up':'down'\)/.test(win), 'one mover, two doors');
    assert.ok(/aria-keyshortcuts/.test(win), 'and the menu says so to a screen reader');
  });

  test('(2i) the colleague picker fills the title and the address from the team record', () => {
    const pick = win.slice(win.indexOf('const comboPick='), win.indexOf('/* ---- ONE LISTENER PER KIND'));
    assert.ok(/r\.memberId=u\.id; r\.from=u\.id; r\.name=u\.name\|\|''; r\.email=u\.email\|\|'';/.test(pick));
    assert.ok(/if\(!r\.role\.trim\(\) \|\| \(was && r\.role===titleOf\(was\)\)\) r\.role=titleOf\(u\);/.test(pick),
      'a title the last pick filled is replaced; a typed one is kept');
  });

  test('(2j) the three readings are published for the phone and the page', () => {
    for (const n of ['signerRouteWindow', 'signerPlanWhy', 'signerPlanRefusal', 'signerIsCompany', 'signerHasEmail'])
      assert.ok(new RegExp('openSignerPlanEditor,saveSignerPlan,[^}]*\\b' + n + '\\b').test(APPROVALS), n + ' is on window');
  });
});

/* ============================================================================
   3 · THE WORDS
   ==========================================================================*/
describe('f398 (3) every new sentence is in both books', () => {
  const KEYS = ['ap_sr_any', 'ap_sr_for', 'ap_sr_add_to_step', 'ap_sr_add_step', 'ap_sr_who_next', 'ap_sr_who_with',
    'ap_sr_nobody_for', 'ap_sr_add_who', 'ap_sr_edit', 'ap_sr_edit_who', 'ap_sr_more_for', 'ap_sr_this_signer',
    'ap_sr_nobody_named', 'ap_sr_join', 'ap_sr_split', 'ap_sr_signs_for', 'ap_sr_title', 'ap_sr_name_ph', 'ap_sr_team',
    'ap_sr_no_match', 'ap_sr_who_for', 'ap_sr_is_company', 'ap_sr_email_theirs', 'ap_sr_email_ours', 'ap_sr_pick',
    'ap_sr_no_email', 'ap_need_party', 'ap_need_person', 'ap_need_their_email'];
  test('(3a) each key twice — English and Swedish — and the two differ', () => {
    for (const k of KEYS) {
      const rows = [...I18N.matchAll(new RegExp('\\n\\s*' + k + ": '([^']*)'", 'g'))].map(m => m[1]);
      assert.equal(rows.length, 2, k + ' in both books');
      assert.notEqual(rows[0], rows[1], k + ' is translated');
    }
  });
  test('(3b) the top line is true for every order, in both books', () => {
    assert.ok(I18N.includes("ap_route_line: 'Signing runs from the top step down. People in the same step sign in any order.'"));
    assert.ok(!/ap_route_line: '[^']*internal signature/.test(I18N), 'the internal-first sentence is gone');
    assert.ok(!/ap_route_line: '[^']*interna underskrifter/.test(I18N), 'and its Swedish twin');
  });
  test('(3c) the owner\'s two sentences read as the owner will read them', () => {
    assert.ok(I18N.includes("ap_need_person: '{party} is the company. Name the person who signs for it.'"));
    assert.ok(I18N.includes("ap_need_party: 'Name who signs for {party}. Every party that signs the agreement needs someone named.'"));
  });
});

/* ============================================================================
   4 · THE PHONE
   ==========================================================================*/
describe('f398 (4) the phone hands the whole route to the one save', () => {
  const st = fnBody(MOBILE, 'mSignersState');
  const sv = fnBody(MOBILE, 'mSignersSave');
  test('(4a) its two slots replace their own rows, and every other signer is handed back', () => {
    assert.ok(/const route = \(c\.signerPlan \|\| \[\]\)\.slice\(\)\.sort/.test(sv), 'the whole route, in order');
    assert.ok(/const why = saveSignerPlan\(c, rows\);/.test(sv));
    assert.ok(!/saveSignerPlan\(c, \[st\.ours, st\.theirs\]\)/.test(sv), 'not the two slots alone');
  });
  test('(4b) and never pre-fills the company\'s name as a person', () => {
    assert.ok(!/\|\| c\.counterparty \|\|/.test(st), 'no fallback to the company');
    assert.ok(/window\.signerIsCompany\(c, \{ party: 'counterparty', name: n \}\)/.test(st), 'asked through the same reading');
  });
  test('(4c) [wall] the phone keeps no copy of the rules', () => {
    assert.ok(!/ap_need_(party|person|their_email)/.test(MOBILE), 'the refusals are the save\'s own');
  });
});

/* ============================================================================
   5 · THE CLOTHES
   ==========================================================================*/
describe('f398 (5) the window wears the product\'s own clothes', () => {
  const block = HTML.slice(HTML.indexOf('THE SIGNING ROUTE IS A TIMELINE (Young ruled it 27 Sep 2026)'),
    HTML.indexOf('.sr-say svg{'));
  test('(5a) the rules are in HaTi\'s sheet', () => {
    assert.ok(block.length > 2000);
    for (const sel of ['.sr-step{', '.sr-node{', '.sr-card.is-rest{', '.sr-card.is-open{', '.sr-miss{', '.sr-win .sr-menu{', '.sr-cbl{', '.sr-say{'])
      assert.ok(block.includes(sel), sel);
  });
  test('(5b) the tints are MIXED from the surface, so the night has its own answer', () => {
    assert.ok(/\.sr-node\{[^}]*color-mix\(in srgb,var\(--accent-fill\) 10%,var\(--color-surface\)\)/.test(block));
    assert.ok(/\.sr-av\.us\{background:color-mix\(in srgb,var\(--accent-fill\) 16%,var\(--color-surface\)\)/.test(block));
    assert.ok(!/--color-accent-(50|100|300)\)/.test(block), 'not the ramp, which has no night value');
  });
  test('(5c) [wall] nothing shouts', () => {
    assert.ok(!/!important/.test(block));
  });
});
