/* f253 — OBLIGATIONS GET A HOME (owner-asked 29 Aug 2026, J-2.1)
   ========================================================================
   *"i want to first understand how obligations work in HaTi. I am not sure I
   understand how I follow up on obligations per contract"*

   THE ANSWER WAS THAT THERE WAS NOWHERE TO FOLLOW THEM UP. A contract's
   promises lived behind a card called CHECKS — the things you run BEFORE
   sending a contract out — and an obligation is the opposite: it starts
   mattering the day the paper is signed and outlives every one of them.

   WHAT IS PINNED HERE, and every one is a rule rather than a look:
     1  a FIFTH TAB, read from ONE list by both the row and the routing guard
     2  the count is amber ONLY when something is overdue
     3  every verb presses the ONE verb — no second way to complete
     4  every reading is BORROWED — obState, obligationDue, obligationIsTheirs
     5  "nobody owns this" is the SERVER'S own resolution, asked in one place
     6  a registered alert kind with a rank, never a special case at the draw
     7  the phase writes NOTHING to any record
     8  both languages

   WHAT DRAWS is obligations-tab-verify's: whether the tab is on screen, whether
   the five fit at 1280px, and whether the amber is amber are questions jsdom
   cannot answer at all. The two files name each other. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* Comments carry the arguments in this codebase and would answer half of these
   assertions by accident. Every claim that reads source strips them. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const OB = read('js/obligations.js');
const OB_CODE = strip(OB);
const ROOM = strip(read('js/views/contract.js'));
const APP = strip(read('js/app.js'));
const HOME = strip(read('js/views/home.js'));
const IG = strip(read('js/views/intelligence.js'));
const I18N = read('js/i18n.js');
const CSS = read('index.html');

/* A workspace with two people, so "resolves to a member" has something to
   resolve against and something to fail against. */
function bench(obs){
  /* intelView rather than obligations alone: obState reads daysUntil, which is
     declared in js/views/intelligence.js, and the option pulls the obligations
     model in under it. contractView is what brings the room's tab row. */
  const w = buildWorld({ intelView: true, contractView: true });
  const win = w.win;
  const c = supplyContract({ id: 'MK-OB-1', obligations: obs || [] });
  /* The stage carries no `state` of its own for this pair of modules, so the
     book is supplied here — which is also what makes "read c.obligations raw"
     checkable: nothing in this file writes to it. */
  win.state = Object.assign(win.state || {}, { contracts: [c], activeId: c.id });
  /* ONE roster object, not a fresh one per call: langSet writes the chosen
     language onto the record currentUser() hands back, so a stub that mints a
     new object every time loses it and every screen stays English. */
  const roster = [
    { id: 'u1', name: 'Wanjiku Kamau', email: 'wanjiku@hati.test', role: 'admin' },
    { id: 'u2', name: 'Otieno Were',   email: 'otieno@hati.test',  role: 'editor' },
  ];
  win.getUsers = () => roster;
  win.currentUser = () => roster[0];
  win.getContract = id => (win.state.contracts.find(x => x.id === id) || null);
  return { w, win, c };
}
const day = off => {
  const d = new Date(); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

/* ================================================ 1 — THE FIFTH TAB */
describe('f253 (1) — a fifth tab, and one list behind it', () => {
  test('ROOM_TABS carries it, after Signing and before History', () => {
    const { win } = bench();
    /* Array.from, because the stage is another realm and a foreign Array does
       not pass a strict deep-equal against one of ours. */
    const keys = Array.from(win.ROOM_TABS).map(t => t[0]);
    assert.deepEqual(keys, ['terms', 'docs', 'sign', 'oblig', 'history'],
      'the order a contract’s life runs in: what it says, who signs it, '
      + 'what it commits you to, then the record of all three');
  });

  test('THE ROW AND THE GUARD READ THE SAME LIST', () => {
    /* The fault this is written for: the Insights tab row was written out
       separately from its routing guard, and the new tab DREW, registered its
       press, and redrew the previous page with nothing anywhere saying why.
       Nothing failed and nothing logged. */
    assert.match(ROOM, /ROOM_TABS\.map\(\(\[k,key,count\]\)=>/,
      'the row is built from the list');
    assert.match(ROOM, /const keys=ROOM_TABS\.map\(t=>t\[0\]\)/,
      'and the guard reads the same list rather than a whitelist of its own');
  });

  test('the pane exists and is painted only when the tab is selected', () => {
    assert.match(ROOM, /data-ws-pane="oblig"/, 'the pane');
    assert.match(ROOM, /id="ws-obligations-pane"/, 'the card inside it');
    assert.match(ROOM, /_wsTab==='oblig'.{0,60}roomPaintObligations\(c\)/,
      'a contract nobody opens this tab on pays nothing for it');
  });

  test('ONE FULL-WIDTH CARD, like the trail — not two columns', () => {
    const pane = ROOM.match(/data-ws-pane="oblig"[\s\S]{0,400}/)[0];
    assert.match(pane, /max-width:var\(--room-measure\)/,
      'the room’s one measure, so the five tabs read as one page');
    assert.ok(!/grid-template-columns/.test(pane),
      'this is a worklist and not a document: it wants the width');
  });
});

/* ================================================ 2 — THE COUNT */
describe('f253 (2) — the count, and the one thing it colours', () => {
  test('it counts what is OUTSTANDING, not what exists', () => {
    const { win, c } = bench([
      { id: 'o1', desc: 'Quarterly report', due: day(20), status: 'open' },
      { id: 'o2', desc: 'Insurance certificate', due: day(-3), status: 'open' },
      { id: 'o3', desc: 'Signed annex', due: day(-40), status: 'done' },
    ]);
    const st = win.obligationTabState(c);
    assert.equal(st.total, 3);
    assert.equal(st.open, 2, 'a completed obligation is not outstanding');
    assert.equal(st.overdue, 1);
  });

  test('AMBER ONLY WHEN SOMETHING IS OVERDUE', () => {
    /* A count that is always coloured is a warning nobody reads — the sidebar
       counts' own rule, applied to a tab. */
    const late = bench([{ id: 'o1', desc: 'a', due: day(-2), status: 'open' }]);
    const soon = bench([{ id: 'o1', desc: 'a', due: day(9), status: 'open' }]);
    assert.match(late.win.roomTabsHtml(late.c, 'docs'), /room-tab-n is-late/);
    assert.ok(!/is-late/.test(soon.win.roomTabsHtml(soon.c, 'docs')),
      'work that is merely coming up is a fact, not a warning');
  });

  test('and a contract with nothing outstanding draws no count at all', () => {
    const { win, c } = bench([{ id: 'o1', desc: 'a', due: day(-2), status: 'done' }]);
    assert.ok(!/room-tab-n/.test(win.roomTabsHtml(c, 'docs')), '"0" is furniture');
    assert.ok(!/room-tab-n/.test(win.roomTabsHtml(supplyContract(), 'docs')),
      'and so is a count on a contract that has none');
  });

  test('THE COUNT IS PAINTED, NOT MERELY BUILT — it rides the one funnel', () => {
    /* The row is built once per workspace render and ticking an obligation off
       is not a render. A new surface joins obligationSurfacesChanged or it goes
       stale the first time somebody completes one somewhere else. */
    assert.match(ROOM, /function wsPaintTabCounts\(c\)/);
    assert.match(ROOM, /wsPaintTabCounts\(c\);/, 'called on every tab change');
    const funnel = OB_CODE.match(/function obligationSurfacesChanged\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(funnel, /wsPaintTabCounts\(c\)/, 'and from the funnel');
    assert.match(funnel, /roomPaintObligations\(c\)/, 'which repaints the pane too');
  });
});

/* ================================================ 3 — THE ONE VERB */
describe('f253 (3) — one verb, one reading, nothing new written', () => {
  test('every act on this tab presses toggleObligation', () => {
    /* REVERSED IN PLACE 29 Aug 2026 (J-2.2): completing now asks two questions
       first, so the press opens the dialog and THE DIALOG presses the verb.
       The claim is unchanged and is stronger for being asked of both halves —
       there is still exactly one place that decides what completing means. */
    const paint = OB_CODE.match(/function roomPaintObligations\(c\)\{[\s\S]*?\n\}/)[0];
    assert.match(paint, /openObligationDone\(c, i\)/, 'completing asks first');
    assert.match(paint, /toggleObligation\(c, i, \{ from: 'obligations tab' \}\)/,
      'and reopening presses the verb directly — there is nothing to ask');
    const dlg = OB_CODE.match(/function openObligationDone\(c, i\)\{[\s\S]*?\n\}/)[0];
    assert.match(dlg, /toggleObligation\(c, i, \{ at, note/,
      'the dialog collects two answers and presses the same verb');
    for (const src of [paint, dlg])
      assert.ok(!/status\s*=\s*['"]done/.test(src),
        'a second way to complete an obligation is the fault this rulebook '
        + 'opens by warning about');
  });

  test('and the readings are BORROWED, never re-derived', () => {
    const html = OB_CODE.match(/function roomObligationsHtml\(c\)\{[\s\S]*?\n\}/)[0];
    for (const fn of ['obState', 'obligationDue', 'obligationIsTheirs', 'obligationOwner'])
      assert.ok(html.includes(fn) || strip(OB).includes(fn),
        `${fn} is the one reading and this tab asks it`);
    assert.ok(!/daysUntil\(/.test(html),
      'a new copy of "is this overdue" is how two screens come to disagree '
      + 'about one commitment');
  });

  test('the renderer writes nothing — it is a reading', () => {
    /* REVERSED IN PLACE 29 Aug 2026. It read "nothing is added to any record by
       this phase", which was true of J-2.1 and is not true of J-2.2 — six
       fields joined the record that day, and f254 pins exactly which six and
       that absence means unknown for every one of them. What this file is
       still about is that the TAB is a reading: the renderer writes nothing at
       all, and the acts on it go through the verbs that already existed. */
    const html = OB_CODE.match(/function roomObligationsHtml\(c\)\{[\s\S]*?\n\}/)[0];
    assert.ok(!/persist\(/.test(html), 'the renderer writes nothing');
    assert.ok(!/logAudit\(/.test(html), 'and records nothing');
    assert.ok(!/completedAt\s*=/.test(html), 'and stamps nothing');
  });

  test('the four bands are one list, and every obligation lands in exactly one', () => {
    const { win } = bench();
    assert.deepEqual(Array.from(win.OBLIG_BANDS).map(b => b[0]),
      ['overdue', 'month', 'later', 'done']);
    const cases = [
      [{ due: day(-1), status: 'open' }, 'overdue'],
      [{ due: day(-1), status: 'done' }, 'done'],
      [{ due: '', status: 'open' }, 'later'],
      [{ due: 'not a date at all', status: 'open' }, 'later'],
    ];
    for (const [o, want] of cases) assert.equal(win.obligationBand(o), want);
    /* A DATE INSIDE THIS CALENDAR MONTH, read through the normaliser — an
       obligation due "31 March 2027" gives NaN through a raw comparison and is
       never overdue, which is exactly how one came to be silent for a year. */
    const now = new Date();
    const mid = new Date(now.getFullYear(), now.getMonth(), 28);
    if (mid > now)
      assert.equal(win.obligationBand({ due: `${mid.getFullYear()}-${String(mid.getMonth()+1).padStart(2,'0')}-28`, status: 'open' }), 'month');
  });

  test('a band with nothing in it draws nothing', () => {
    const { win, c } = bench([{ id: 'o1', desc: 'Only one', due: day(400), status: 'open' }]);
    const h = win.roomObligationsHtml(c);
    assert.ok(h.includes('Later'), 'the band it is in');
    assert.ok(!h.includes('Overdue'), 'and not three empty headings above it');
  });
});

/* ================================================ 4 — NOBODY OWNS THIS */
describe('f253 (4) — "nobody owns this", and it is the server’s own reading', () => {
  test('email first, then name, and only where there is an address', () => {
    const { win } = bench();
    assert.ok(win.obligationReminderTo({ assignee: 'wanjiku@hati.test' }), 'by address');
    assert.ok(win.obligationReminderTo({ assignee: 'Wanjiku Kamau' }), 'by name');
    assert.ok(win.obligationReminderTo({ assignee: '  OTIENO WERE ' }), 'case and space');
    assert.equal(win.obligationReminderTo({ assignee: 'Someone Else' }), null);
    assert.equal(win.obligationReminderTo({ assignee: '' }), null,
      'nobody named is nobody to write to');
  });

  test('an account with no address is nowhere to write to', () => {
    const { win } = bench();
    win.getUsers = () => ([{ id: 'u9', name: 'No Address', email: '' }]);
    assert.equal(win.obligationReminderTo({ assignee: 'No Address' }), null);
  });

  test('the row says so, and only where a reminder could still matter', () => {
    const { win, c } = bench([
      { id: 'o1', desc: 'Owned', due: day(5), status: 'open', assignee: 'Wanjiku Kamau' },
      { id: 'o2', desc: 'Orphan', due: day(5), status: 'open', assignee: 'Nobody At All' },
      { id: 'o3', desc: 'Finished orphan', due: day(-5), status: 'done', assignee: 'Nobody At All' },
    ]);
    const h = win.roomObligationsHtml(c);
    assert.equal((h.match(/obt-unowned/g) || []).length, 1,
      'a completed obligation is nobody’s to chase, and saying so there '
      + 'would be noise on the one band that needs none');
  });

  test('ONE READING — the Insights page asks the same function', () => {
    /* Two answers to "will anybody be told" is exactly how a page comes to
       contradict the sweep that sends the mail. */
    assert.match(IG, /obligationReminderTo\(\{ assignee:a \}\)/,
      'the Insights obligations page asks it');
    assert.ok(!/byEmail\.add\(/.test(IG),
      'and keeps no private copy of the resolution');
  });

  test('it still MIRRORS the server, which is the authority', () => {
    const SRV = read('server/server.js');
    const fn = SRV.match(/function obligationRecipient\(assignee\)[\s\S]*?\n\}/)[0];
    assert.match(fn, /LOWER\(email\)=\?/, 'email first');
    assert.match(fn, /LOWER\(name\)=\?/, 'then name');
    assert.match(fn, /\/\.\+@\.\+\\\.\.\+\/\.test/, 'and only where there is an address');
  });
});

/* ================================================ 5 — THE BELL */
describe('f253 (5) — a registered alert kind, ranked', () => {
  const kinds = [...APP.match(/const ALERT_KINDS = \[[\s\S]*?\];/)[0]
    .matchAll(/k:'([a-z-]+)'/g)].map(m => m[1]);

  test('it is in the table with a tone and a mark', () => {
    assert.ok(kinds.includes('obligation'), 'registered, not a special case');
    assert.match(APP, /\{ k:'obligation',\s*tone:'amber'/,
      'amber: work owed by this reader and by nobody else');
  });

  test('ranked under the approvals and over the workspace’s own conditions', () => {
    assert.ok(kinds.indexOf('obligation') > kinds.indexOf('approval'),
      'everything above blocks a live deal and somebody else is waiting on it');
    assert.ok(kinds.indexOf('obligation') < kinds.indexOf('email-off'),
      'and a setting nobody is blocked on still ranks under every piece of work');
  });

  test('THE WINDOW IS THE REMINDER MAILS’ OWN, and a dateless one is not in it', () => {
    const body = APP.match(/function buildAlerts\(\)\{[\s\S]*?\n\}/)[0];
    const sweep = body.match(/if\(window\.openObligations[\s\S]*?\n  \}/)[0];
    assert.match(sweep, /openObligations\(7\)/, 'seven days, the first milestone');
    assert.match(sweep, /if\(o\.days==null\) return;/,
      'nothing is ever sent about an undated obligation, so a row claiming a '
      + 'deadline would be the panel inventing one');
    assert.match(sweep, /obligationIsMine\(o\)/, 'and only the reader’s own');
  });

  test('BORROWED, NEVER DERIVED, and it writes nothing', () => {
    const body = APP.match(/function buildAlerts\(\)\{[\s\S]*?\n\}/)[0];
    const sweep = body.match(/if\(window\.openObligations[\s\S]*?\n  \}/)[0];
    assert.ok(!/persist\(|logAudit\(/.test(sweep), 'a counting surface writes nothing');
    assert.ok(!/negoChanges\(/.test(sweep),
      'the standing trap on this panel is a count that starts a negotiation on '
      + 'every contract merely by asking about it');
  });

  test('and the row lands on the contract’s Obligations tab', () => {
    const body = APP.match(/function buildAlerts\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(body, /roomGoTab\(c,'oblig'\)/,
      'where the reader ends up is the tab the row was about');
  });

  test('obligationIsMine asks the RESOLUTION, not the string', () => {
    const { win } = bench();
    assert.equal(win.obligationIsMine({ assignee: 'wanjiku@hati.test' }), true,
      'an address and a name are one person here, exactly as they are to the sweep');
    assert.equal(win.obligationIsMine({ assignee: 'Wanjiku Kamau' }), true);
    assert.equal(win.obligationIsMine({ assignee: 'Otieno Were' }), false);
    assert.equal(win.obligationIsMine({ assignee: '' }), false);
  });
});

/* ================================================ 6 — HOME */
describe('f253 (6) — one entry in the catalogue, forcing nothing', () => {
  test('it is in the catalogue and in the order, and not in the default four', () => {
    assert.match(HOME, /obligations:'Obligations due'/);
    const order = HOME.match(/const KPI_ALL_ORDER=\[([^\]]*)\]/)[1];
    assert.ok(order.includes("'obligations'"), 'choosable');
    const def = HOME.match(/const DEFAULT_KPI_SEL=\[([^\]]*)\]/)[1];
    assert.ok(!def.includes("'obligations'"),
      'the catalogue is chosen from four at a time, so this forces nothing '
      + 'onto anybody’s Home');
  });

  test('AMBER ONLY WHEN SOMETHING IS LATE, the same rule as the tab', () => {
    const tile = HOME.match(/obligations: \{label:KPI_META\.obligations[\s\S]{0,420}/)[0];
    assert.match(tile, /grad:obLate\?G\.amber:G\.steel/);
  });

  test('and a dateless obligation is not counted as due', () => {
    const read = HOME.match(/const obDue=[\s\S]{0,200}/)[0];
    assert.ok(read.includes('openObligations(30)'), 'the one reading');
    assert.ok(read.includes('o.days!=null'),
      'counting a dateless one under a card headed "due" would put a deadline '
      + 'on the record that the record does not carry');
  });
});

/* ================================================ 7 — THE DRESS */
describe('f253 (7) — the stylesheet, and what it is not', () => {
  test('the tab count and the rows have rules of their own', () => {
    for (const sel of ['.obt-head', '.obt-band', '.obt-row', '.obt-unowned', '.room-tab-n'])
      assert.ok(CSS.includes(sel + '{'), `${sel} is defined in HaTi’s own sheet`);
  });

  test('NO BAND, STRIP, BANNER OR CALLOUT IS ADDED', () => {
    /* The owner's standing rule. Every count here rides a tab, a row or a
       control; nothing floats over a page and nothing narrates the screen. */
    const html = OB_CODE.match(/function roomObligationsHtml\(c\)\{[\s\S]*?\n\}/)[0];
    for (const w of ['rl-notices', 'nego-band', 'ct_', 'role="alert"'])
      assert.ok(!html.includes(w), `no ${w} on this tab`);
  });

  test('and the tokens it uses have a night answer', () => {
    /* --st-*-fg and --accent-ink are all redefined under html.dark; a raw
       accent ramp step used as text is the fault Phase A swept. */
    const rules = CSS.match(/\.obt-[\s\S]{0,2600}?\.room-tab-n\.is-late[^}]*\}/)[0];
    assert.ok(!/var\(--color-accent-[6-9]00\)/.test(rules),
      'the accent ramp has no dark answer; --accent-ink does');
  });
});

/* ================================================ 8 — BOTH LANGUAGES */
describe('f253 (8) — both languages', () => {
  const KEYS = ['tab_obligations', 'ob_band_overdue', 'ob_band_month', 'ob_band_later',
    'ob_band_done', 'ob_add', 'ob_find', 'ob_side_ours', 'ob_side_theirs', 'ob_no_date',
    'ob_done', 'ob_reopen', 'ob_edit', 'ob_remove', 'ob_no_owner', 'ob_no_owner_title',
    'al_ob_overdue', 'al_ob_today', 'kpi_obligations', 'home_ob_none', 'home_ob_sub'];

  test('every key is written twice and the two are not the same words', () => {
    for (const k of KEYS){
      const hits = [...I18N.matchAll(new RegExp('^    ' + k + ": '([^']*)'", 'gm'))].map(m => m[1]);
      assert.equal(hits.length, 2, `${k} is missing from one dictionary`);
      assert.notEqual(hits[0], hits[1], `${k} is untranslated`);
    }
  });

  test('the plural keys carry both forms in both languages', () => {
    for (const k of ['ob_head_open', 'ob_head_overdue', 'al_ob_due', 'home_ob_overdue'])
      for (const form of ['_one', '_other'])
        assert.equal((I18N.match(new RegExp('^    ' + k + form + ':', 'gm')) || []).length, 2,
          `${k}${form} is missing from one dictionary`);
  });

  test('the tab reads in the reader’s language, not in English', () => {
    const { win, c } = bench([{ id: 'o1', desc: 'x', due: day(-1), status: 'open' }]);
    win.langSet('sv', { repaint: false });
    const h = win.roomObligationsHtml(c);
    assert.ok(h.includes('Försenade'), 'the band');
    assert.ok(!h.includes('Overdue'), 'and nothing left behind in English');
    win.langSet('en', { repaint: false });
  });
});
