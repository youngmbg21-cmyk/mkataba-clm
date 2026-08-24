/* f237 — "COUNTERPARTY READY TO SIGN" IS SAID WHERE THE READER IS LOOKING
   =====================================================================
   Owner-reported 23 Aug 2026, off four screenshots, in three parts:

     1. "An alert saying counterparty was ready to sign is not appearing on
        the side panel."
     2. "When the counterparty has signalled that they are ready to sign, the
        bell sign at the bottom of the right corner should loudly turn green
        and blink signalling this. You can click on the bell to see the alert
        then it goes back to yellow."
     3. "Where it says in review, it should also say counterparty ready to
        sign unless you resume negotiations again which will then revert back
        to in review."

   THE FACT WAS ALREADY IN THE RECORD AND HAD EXACTLY ONE SURFACE. The
   counterparty presses Ready to sign, negoSignalReady stamps
   `c.negotiation.ready.counterparty`, negoReadySignal reads it back — and the
   only places that asked were the negotiation page's own notice and the
   dashboard. A reader on the register, on the alerts panel, or standing on the
   contract's own head row learned nothing.

   THREE READINGS, ONE PREDICATE. cpReadyToSign(c) (js/core.js) is the whole
   of it, and everything below asks it rather than repeating its arithmetic:
   the status word, the register chip, and the alerts panel's own row.

   WHY IT IS AN OVERLAY AND NOT A STATUS. `c.status` is untouched — it is what
   every filter, query, sweep and server guard reads, and a fourth value in
   that field would have to be taught to all of them. This joins
   contractPartiallySigned and contractExpired, which answered the same problem
   the same way: a DISPLAY branch over STATUS_META, computed at the moment it
   is drawn.

   AND THAT IS WHAT MAKES THE OWNER'S "UNLESS YOU RESUME NEGOTIATIONS" FREE.
   negoReadySignal already carries `stale` — the alignment reading — so filing
   a new change makes the overlay answer false with nothing to clear and no
   second record to keep in step. The signal itself is NOT erased: the
   counterparty said it, and the record of their having said it is theirs.

   THE BELL IS A DIFFERENT QUESTION FROM THE PANEL, and separating them is
   what reconciles the owner's ask with this codebase's standing rule that a
   count "clears when the work does, never when you look at it". That rule is
   about WORK — amber, and untouched here. Green is NEWS: a signal you have not
   yet seen. Looking clears the news; it does not clear the work, and the bell
   goes back to amber with the notice still under it. Per browser, keyed on the
   signal's own timestamp, so a SECOND signal turns it green again. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* WHY THIS FILE IS HALF SOURCE-READING, said out loud rather than left to be
   discovered. buildWorld deliberately never loads the shell (f215's rule), and
   cpReadyToSign, the three status builders and buildAlerts all live in
   js/core.js and js/app.js — so the BEHAVIOUR of those three surfaces cannot be
   driven here at all. It is driven in a real browser instead, in
   ready-to-sign-signal-verify, which signals from the counterparty's own seat
   and reads the rendered pixels. What this file holds is the half a browser is
   the wrong place for: that there is ONE predicate rather than four readings,
   that the alert kind is registered rather than special-cased, that the words
   exist in both languages, and that the bell's own news state — which lives in
   js/views/negotiation.js and IS in the world — behaves. The f236 split, on
   purpose: cause here, effect there, each naming the other. */
const CORE = read('js/core.js');
const APP = read('js/app.js');
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* A contract whose counterparty has signalled. Built through the product's own
   writer — a hand-stamped `ready` block would prove nothing about the reading,
   because the two could disagree about the shape. */
async function bench({ signal = true, thenFile = false } = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.toast = () => {};
  const c = supplyContract();
  win.negoInit(c);
  if (signal) win.negoSignalReady(c, { side: 'counterparty', by: 'Ola Nordmann' });
  if (thenFile){
    await win.negoFileProposal(c,
      win.negoBaseText(c).replace('thirty (30) days', 'ninety (90) days'),
      { side: 'owner', author: 'Young Mbagaya' });
  }
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
  win.getContract = id => (id === c.id ? c : null);
  return { w, win, c };
}
/* The fact the predicate is built on, read the way the predicate reads it. */
const signalled = (win, c) => {
  const s = win.negoReadySignal(c, 'counterparty');
  return !!(s && !s.stale);
};

describe('f237 (1) — the fact the whole feature rests on', async () => {
  test('a signalled contract carries a live signal', async () => {
    const { win, c } = await bench();
    assert.equal(signalled(win, c), true);
  });

  test('a contract nobody has signalled on does not', async () => {
    const { win, c } = await bench({ signal: false });
    assert.equal(signalled(win, c), false);
  });

  test('filing a new change reverts it — the owner\'s "unless you resume negotiations"', async () => {
    const { win, c } = await bench({ thenFile: true });
    assert.equal(signalled(win, c), false,
      'a live ask means the parties are not aligned, so the signal reads stale');
  });

  test('and the signal itself is NOT erased — they said it, and the record is theirs', async () => {
    const { c } = await bench({ thenFile: true });
    assert.ok(c.negotiation.ready && c.negotiation.ready.counterparty,
      'the stamp stays on the record; only the READING answers differently');
  });
});

describe('f237 (2) — ONE predicate, asked by three surfaces', () => {
  test('cpReadyToSign is declared in js/core.js and published', async () => {
    assert.match(CORE, /function\s+cpReadyToSign\s*\(/);
    assert.match(CORE, /\bcpReadyToSign\b[\s\S]{0,400}?READY_META/,
      'it is exported beside the palette it draws with');
  });

  test('it asks negoReadySignal THROUGH window — the ES-module rule', async () => {
    const body = strip(CORE).match(/function\s+cpReadyToSign[\s\S]*?\n\}/)[0];
    assert.match(body, /window\.negoReadySignal/,
      'a bare cross-module read throws; this predicate is asked from the register');
    assert.match(body, /try\s*\{/, 'and it must never take a page down');
  });

  test('it refuses anything that is not under review', async () => {
    const body = strip(CORE).match(/function\s+cpReadyToSign[\s\S]*?\n\}/)[0];
    assert.match(body, /Under Review/);
  });

  test('THE STORED STATUS IS NEVER WRITTEN — this is an overlay, not a fourth value', async () => {
    const body = strip(CORE).match(/function\s+cpReadyToSign[\s\S]*?\n\}/)[0];
    assert.ok(!/\.status\s*=/.test(body),
      'every filter, query and server guard reads c.status; drawing must not move it');
  });

  test('all three status builders ask it rather than repeating it', async () => {
    for (const fn of ['contractStage', 'contractStatusChip', 'contractStatusTextHtml']){
      const body = strip(CORE).match(new RegExp(fn + '[\\s\\S]{0,1400}'))[0];
      assert.match(body, /cpReadyToSign\(/, fn + ' does not ask the predicate');
    }
  });

  test('the chip wears the SHORT word and keeps the sentence on hover', async () => {
    assert.match(CORE, /READY_META_SHORT/);
    assert.match(strip(CORE), /title="\$\{i18t\('status_cp_ready'\)\}/,
      'a column has no room for a sentence; a tooltip does');
  });

  test('it is GREEN, and borrows the palette rather than naming a colour', async () => {
    const meta = CORE.match(/const READY_META\s*=.*/)[0];
    assert.ok((meta.match(/--st-green/g) || []).length >= 3, meta);
  });

  test('nothing outside core.js works this fact out for itself', async () => {
    for (const f of ['js/app.js', 'js/views/register.js', 'js/views/contract.js']){
      assert.ok(!/ready\s*&&\s*!\w*\.stale/.test(strip(read(f))),
        f + ' is repeating cpReadyToSign\'s arithmetic — ask the predicate');
    }
  });
});

describe('f237 (3) — the alerts panel', () => {
  test('cp-ready is a registered KIND, never special-cased at the draw', async () => {
    const row = APP.match(/\{\s*k:\s*'cp-ready'[^}]*\}/);
    assert.ok(row, 'ALERT_KINDS carries it');
    assert.match(row[0], /tone:\s*'green'/);
  });

  test('buildAlerts asks the predicate and opens the contract', async () => {
    const body = strip(APP).match(/function\s+buildAlerts[\s\S]*?\n\}\n/)[0];
    assert.match(body, /cpReadyToSign/);
    assert.match(body, /push\('cp-ready'[\s\S]{0,220}openWorkspace/,
      'every alert in this panel is a door');
  });

  test('COUNTING MUST NOT WRITE — it reads the record, never negoChanges', async () => {
    const body = strip(APP).match(/function\s+buildAlerts[\s\S]*?\n\}\n/)[0];
    assert.ok(!/negoChanges\(/.test(body),
      'negoChanges runs negoInit and would start a negotiation on every contract counted');
  });

  test('and it is guarded, so a stage without core.js draws no rows rather than throwing', async () => {
    const body = strip(APP).match(/function\s+buildAlerts[\s\S]*?\n\}\n/)[0];
    assert.match(body, /window\.cpReadyToSign/);
  });
});

describe('f237 (4) — the bell: amber is WORK, green is NEWS', async () => {
  test('an unseen signal makes the bell news', async () => {
    const { win, c } = await bench();
    assert.equal(win.rlBellIsNews(c), true);
  });

  test('marking it seen turns it back to amber, and the notice is still there', async () => {
    const { win, c } = await bench();
    win.rlMarkReadySeen(c);
    assert.equal(win.rlBellIsNews(c), false, 'looking clears the NEWS');
    assert.equal(signalled(win, c), true, 'and never the WORK — the standing rule holds');
  });

  test('a SECOND signal is news again — the memory is keyed on the signal, not the contract', async () => {
    const { win, c } = await bench();
    win.rlMarkReadySeen(c);
    assert.equal(win.rlBellIsNews(c), false);
    c.negotiation.ready.counterparty.at = '2026-09-01T09:00:00.000Z';
    assert.equal(win.rlBellIsNews(c), true);
  });

  test('with nothing signalled there is nothing to have seen', async () => {
    const { win, c } = await bench({ signal: false });
    assert.equal(win.rlBellIsNews(c), false);
    assert.equal(win.rlReadySeen(c), true,
      '"seen" answers TRUE on an absence, so a bell with no signal is never green');
  });

  /* ---- REVERSED IN PLACE 23 Aug 2026, and the FEATURE MOVED rather than went
     ---- The owner asked for a bell that turns green and blinks, and it was
     built on the negotiation page's FLOATING bell. That afternoon they asked
     that nothing float over the page, so the floating bell was removed — and
     the green treatment moved to the HEADER bell, which is now the only one.
     The reading is untouched: rlBellIsNews is still the one predicate, still
     borrowed by the alerts row, and the two claims below still say what they
     always said — green while unseen, gone once seen — asked of the surface
     that carries it now. */
  test('the header bell wears the news state, off the rows\' own reading', async () => {
    const body = strip(APP).match(/function updateAlertBadge\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(body, /buildAlerts\(\)\.some\(a=>a && a\.news\)/,
      'it borrows the rows\' own news flag rather than recomputing the signal');
    assert.match(body, /classList\.toggle\('is-news'/,
      'and wears it as a state on the one bell that is left');
  });

  test('and the green is only ever the UNSEEN state', async () => {
    const { win, c } = await bench();
    assert.equal(win.rlBellIsNews(c), true, 'green while unseen');
    win.rlMarkReadySeen(c);
    assert.equal(win.rlBellIsNews(c), false,
      'and the bell hands itself back to amber once the panel has been opened');
  });
});

describe('f237 (5) — the clothes, read off the stylesheet', () => {
  const CSS = read('js/views/negotiation-css.js');

  test('the news bell is green and animated', async () => {
    const rule = CSS.match(/\.rl-notices-fab\.is-news\s*\{[^}]*\}/);
    assert.ok(rule, '.rl-notices-fab.is-news is declared');
    assert.match(rule[0], /--st-green/);
    assert.match(rule[0], /animation:\s*rl-bell-news/);
  });

  test('the animation is finite — a bell that blinks for ever is furniture', async () => {
    const rule = CSS.match(/\.rl-notices-fab\.is-news\s*\{[^}]*\}/)[0];
    const n = rule.match(/animation:[^;]*?(\d+)\s*(?:;|\})/);
    assert.ok(n && Number(n[1]) > 0 && Number(n[1]) < 10,
      'it blinks a few times and stops: ' + rule);
    assert.match(CSS, /@keyframes\s+rl-bell-news/);
  });

  test('and a reader who has asked for less motion gets none', async () => {
    assert.match(CSS, /prefers-reduced-motion:\s*reduce[\s\S]{0,220}rl-notices-fab\.is-news[^}]*animation:\s*none/);
  });
});

describe('f237 (6) — the words exist in both languages', () => {
  const I18N = read('js/i18n.js');
  for (const k of ['status_cp_ready', 'status_cp_ready_short', 'al_cp_ready', 'ng_notices_fab_ready']){
    test(k + ' is in both dictionaries', () => {
      const hits = I18N.split('\n').filter(l => l.includes(k + ':')).length;
      assert.ok(hits >= 2, k + ' appears ' + hits + ' time(s) — English and Swedish are both owed a line');
    });
  }
});

describe('f237 (7) — ONE reading, not four', () => {
  test('nothing outside core.js works out this fact for itself', async () => {
    const files = ['js/app.js', 'js/views/register.js', 'js/views/contract.js'];
    for (const f of files){
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      assert.ok(!/ready\s*&&\s*!\w*\.stale/.test(src),
        f + ' is repeating cpReadyToSign\'s arithmetic — ask the predicate');
    }
  });
});
