/* ============================================================
   THEME TOKENS — the colour tidy-up changed nothing on screen
   ============================================================
   Step one of the three-theme work is plumbing: every brand colour that was
   typed straight into a file becomes a reference to one place. Nothing is
   meant to look different afterwards — not by a shade.

   "Not by a shade" is a claim you can only make by measuring.

   IT DOES NOT COMPARE PIXELS, and the first version of this did, which was a
   mistake worth recording. Hashing a screenshot of this app compares the phase
   of its animations as much as its colours: the live dot pulses, the Copilot
   badge breathes, relative times tick. Run twice on IDENTICAL code and the
   hashes differ. A test that fails against a baseline recorded ten seconds
   earlier is not a strict test, it is a broken one.

   So it compares COLOUR, which is the thing the refactor can actually break.
   Animation and transition are switched off, then every element on the page is
   asked for its resolved background, text, border, outline, fill, stroke and
   shadow — and the whole set is tallied into a sorted census: this exact shade,
   this many times. If one utility class stops resolving, or one hardcoded teal
   is replaced with a value a shade off, the census moves and it says which
   screen and which colour.

     node test/chromium/theme-tokens-verify.js --save     (record a baseline)
     node test/chromium/theme-tokens-verify.js            (check against it)

   It also asserts the thing the tidy-up is FOR: that changing the accent
   variables actually repaints the platform. A token nothing reads is not a
   token, and no census of the DEFAULT theme would ever notice.

   RE-RECORDED 21 Oct 2026 (twelfth), CHAMBERS FINISHED (owner: "Finish
   everything" after the fourteen-page review). Audited as a set difference:
   GONE — Jambo's old message box (#F8FAFC, its accent-900 ink #0A1C15), the
   compiled cool line #E2E8F0 (.border-hair), the Board's green-grey lines
   rgba(31,77,59,.12–.28), the docked panel's shadow rgba(43,43,45,.35), Our
   paper's mint mark wash #DFF2E7 and its empty gray dot. NEW — the warm box
   every panel already used (#EFECE5, --surface-2) and the Board's warm LINE
   channel rgba(105,83,33,.12–.28), chosen so a card's edge at .18 over white
   IS --color-divider #E4E0D7. No other hue.
   RE-RECORDED 20 Oct 2026 (eleventh), CHAMBERS AND NO DARK MODE (owner
   picked Chambers by name; "Let's not implement the dark theme. Remove it
   from HaTi"), by the one who owns the palette change. Ten light screens now,
   no dark ones; the "Navy repaints it / no green survives" pass became "no
   colour of the old look is drawn". Audited as a set difference against the
   tenth record's light screens: NEW are Chambers' own — the warm ramp and
   grounds (#161512, #5E5A51, #6F6A5E, #8E887B, #A8A295, #CFC9BC, #E4E0D7,
   #E9E5DC, #EFECE5, #F0EDE6, #F4F2ED, #F8F6F1), the green accent ramp
   (#1F4D3B … #0A1C15, #B5CDC1, #DCE7E1, #EEF3F0) and its alpha washes, the
   status inks and dots (#8A5A0A/#C98A14, #3A8A62, #8F2A22/#C2453B), the ink
   at 8/12% (shadows), and the helper "their side" blue now shown to everyone
   (--alt #3A64C4, -ink #24488F, -soft #E9EFFB; Blue readers saw teal there).
   GONE: the Blue and Green ramps and their washes, the Blue Ink Wash greys
   and ground, the bar's white veils, the old teal-tinted shadows, the status
   washes behind stage words (dot and word now) and slate-50 behind the
   chips (links now), and the bell count's dark-amber ink #2A1B04 (the count
   is white on the ink now; on the room screens, where the bell shows a
   count). Nothing else moved.
   RE-RECORDED 20 Oct 2026 (tenth), OWNER-ASKED ("build the dossier and the
   4b"): the Board's card carries the stage's act in its head, so History's
   light screen wears --btn-lift (rgba(10,20,40,0.18)), an existing token.
   Audited as a set difference: nothing else new, nothing gone.
   RE-RECORDED 20 Oct 2026 (ninth), OWNER-ASKED ("fix all of them"):
   Contracts opens on the List (REG_STATE_DEF show 'list'), and the panel's
   tabs came back. Audited as a set difference: every colour new is an
   existing token now drawn on more screens — the accent-700 ink and
   accent-100 wash, --danger/--st-ruby-fg, --st-green-bg on the register in
   both themes, and the accent-500 wash rgba(53,96,180,0.16) on the dark
   dashboard, contract and history screens. Gone (light): slate-300 and the
   rgba(10,20,40,0.18) shadow the wall's small papers wore.
   RE-RECORDED 19 Oct 2026 (eighth), OWNER-ASKED ("Yes, re-save it", after
   the gap build: every visible part of the picked redesign drawings; and
   "Design's colours" for the redline buttons). Audited as a set difference
   against the 18 Oct record: every colour new to the record is an existing
   token now drawn on more screens — the violet and green status pills
   (--st-violet-*, the green status pair), --st-amber-line (Redlines' "Waiting
   on you" edge), the Board's own hairline and glow washes (B2's round 17
   Board), the .ca-pop shadow under the list panel's ask box. Gone: the
   redline verbs' violet (#6d28d9/#c4b5fd, now the accent ink by the owner's
   yes) and the Board furniture History no longer draws.
   RE-RECORDED 18 Oct 2026 (seventh), OWNER-ASKED ("The SAP way, and call it
   Home"): no tab row above the page; the bar reads ‹ · Ha · the page's name
   and opens Recent. Audited as a set difference: no colour new; one gone, on
   the dark register, calendar and contract screens only — rgba(53,96,180,
   0.16), the pressed tab pill's fill, which left with the tabs (the same
   accent wash is still worn elsewhere). Explorer's Group by in the map's
   corner wears the map note's own ink, so no light screen gained a colour.
   RE-RECORDED 18 Oct 2026 (sixth), OWNER-ASKED (the overnight build, same
   standing yes): Round 21, "Paper first" — the templates screen's book is an
   index and a template's own paper, so its counts moved in both themes.
   Audited by key: no colour new, none gone.
   RE-RECORDED 18 Oct 2026 (fifth), OWNER-ASKED (the overnight build, same
   standing yes): Round 16, "Week by week" — the calendar opens on this week
   by the hour with five more weeks under it, and the month draws Monday to
   Friday, so the calendar's counts moved in both themes. Audited by key: no
   colour new, none gone.
   RE-RECORDED 18 Oct 2026 (fourth), OWNER-ASKED (the overnight build, same
   standing yes): Round 13, "Wall of papers" — the register screen's counts
   moved, light and dark; audited by key: nothing new, nothing gone.
   RE-RECORDED 18 Oct 2026 (third), OWNER-ASKED (the overnight build, same
   standing yes): Round 12, "Two sides" — History's two lanes moved its own
   counts, light and dark; audited as a set difference by key: only the
   History screen moved, no value new to the record, nothing gone.
   RE-RECORDED 17 Oct 2026 (second), OWNER-ASKED (the overnight build: "Build
   and update record even on new ones"): Round 7, "Read down" — a contract
   brought up is a page of its own on the desk, so the History screen (a
   strip on its History page) no longer draws the Board's own furniture
   around it: colours and counts only went away. Audited as a set
   difference: nothing new.
   RE-RECORDED 17 Oct 2026, OWNER-ASKED ("Yes, update the record"; then
   "update the colour lists and merge when green"): Rounds 1 and 2 — the left
   menu is not drawn on a computer, so its own three values (the rail's
   ground and its two navy washes) left the screens that drew it; the lit
   desk tab brings the accent's 100 rung at night (rgba(53, 96, 180, 0.16),
   an existing token) to five dark screens. Audited as a set difference:
   nothing new to the palette.
   RE-RECORDED 16 Oct 2026, OWNER-ASKED ("Yes, update the record"): the
   Contracts place's stage tabs became the Stage box, so the lit tab's tint
   (the accent at 12%) left the register screen, light and dark. Audited as a
   set difference: that one value gone, nothing new on any screen (Jambo's
   perch on Home had brought one new shadow layer; it was taken off, not
   recorded).
*/
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, CAL_TODAY_ASIDE } = require('../helpers');

const BASELINE = path.join(__dirname, 'theme-tokens-baseline.json');
/* THE SAME LADDER EVERY OTHER HARNESS USES: an override, then the dev sandbox's
   own copy IF IT EXISTS, then whatever playwright installed. The bare path was
   true in exactly one place — on a CI runner playwright installs its own build
   and /opt/pw-browsers does not exist, so the launch threw before a single
   check ran. */
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SAVE = process.argv.includes('--save');
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  ok ? pass++ : fail++;
};

const BASE = ['RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY & SPECIFICATION', '1. The Supplier shall supply an estimated 5000 metric tonnes per annum meeting the agreed specification and the applicable KEBS/EAS standard.',
  '2. PRICE & CONTRACT VALUE', '2. The estimated annual contract value is KES 78,000,000, reviewed quarterly against published commodity indices.',
  '3. QUALITY & REJECTION', '3. Consignments failing specification may be rejected within 3 days of delivery.',
  '4. PAYMENT TERMS', '4. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n\n');

const SCREENS = [
  ['dashboard', async p => { await p.evaluate(() => setView('dashboard')); await pause(800); }],
  ['register',  async p => { await p.evaluate(() => setView('register')); await pause(600); }],
  ['calendar',  async p => { await p.evaluate(() => setView('calendar')); await pause(600); }],
  ['templates', async p => { await p.evaluate(() => setView('templates')); await pause(600); }],
  /* RE-POINTED 11 Oct 2026: the room's Document tab is gone (owner); its
     paper is Home's Document, so 'contract' photographs that, and 'keyterms'
     opens the room again before its tabs are pressed. */
  ['contract',  async p => { await p.evaluate(() => pdOpenOnHome('MK-82', 'doc')); await p.waitForSelector('#ig-canvas', { timeout: 10000 }).catch(() => {}); await pause(800); }],
  ['keyterms',  async p => { await p.evaluate(() => { openWorkspace('MK-82', { room: true }); roomGoTab(getContract('MK-82'), 'terms'); }); await p.waitForSelector('.room-tabrow', { timeout: 10000 }).catch(() => {}); await pause(600); }],
  ['signing',   async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'signing')); await pause(600); }],
  ['history',   async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'history')); await pause(600); }],
  /* RE-POINTED 15 Oct 2026: Negotiate folded into Home (stage 5); its page is
     opened by name for the checks, as the others do. */
  ['negotiate', async p => { await p.evaluate(() => openRedlineWorkbench('MK-82', { blanksAsked: true, page: true }));
                             await p.waitForSelector('#view-redline [id="rl-doc"]', { timeout: 10000 }); await pause(800); }],
  ['menu',      async p => { await p.evaluate(() => { openWorkspace('MK-82', { room: true }); });
                             await p.waitForSelector('#ws-more'); await p.click('#ws-more'); await pause(300); }],
];

/* The today probe: a today column and heading put beside plain ones in the
   week the calendar drew, measured, and taken away again. */
const CAL_TODAY_PROBE = () => {
  const host = document.querySelector('.cal-wk-col') && document.querySelector('.cal-wk-col').parentElement;
  if (!host) return null;
  const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; host.append(d); return d; };
  const colPlain = mk('cal-wk-col'), colToday = mk('cal-wk-col is-today');
  const headPlain = mk('cal-wk-h', '<span>Mon</span><b>19</b>'), headToday = mk('cal-wk-h is-today', '<span>Mon</span><b>19</b>');
  const ink = mk(''); ink.style.color = 'var(--accent-ink)';
  const out = { colPlain: getComputedStyle(colPlain).backgroundColor, colToday: getComputedStyle(colToday).backgroundColor,
    headPlain: getComputedStyle(headPlain.querySelector('b')).color, headToday: getComputedStyle(headToday.querySelector('b')).color,
    accentInk: getComputedStyle(ink).color };
  for (const d of [colPlain, colToday, headPlain, headToday, ink]) d.remove();
  return out;
};

/* The census. Runs in the page: walks every element, takes the colour-bearing
   properties as the browser resolved them, and tallies. Sorted, so the order
   elements happen to be created in cannot move the answer. */
const CENSUS = () => {
  const COLOUR_RE = /(rgba?\([^)]*\)|#[0-9a-f]{3,8})/gi;
  const PROPS = ['backgroundColor', 'color', 'borderTopColor', 'borderRightColor',
    'borderBottomColor', 'borderLeftColor', 'outlineColor', 'fill', 'stroke',
    'caretColor', 'textDecorationColor', 'columnRuleColor'];
  const tally = new Map();
  const add = v => {
    if (!v || v === 'none' || v === 'rgba(0, 0, 0, 0)') return;
    tally.set(v, (tally.get(v) || 0) + 1);
  };
  /* THE THEME CONTROL IS NOT PART OF THE PLATFORM'S PALETTE. Its swatches are
     samples of all three themes, so it carries navy and near-black while you
     are wearing green — on purpose, that is how a picker shows you what you
     are choosing between. Counting them would make every screen look like it
     had gained two colours, and would make the green sample look like a teal
     the sweep missed while you were on navy. Excluded in every pass, so both
     sides of the comparison are the platform itself. */
  /* WIDENED 24 Aug 2026 for the control that replaced the menu: two brand
     swatches, which are SAMPLES of the two workspaces exactly as the menu's
     rows were. The reasoning above is unchanged and is why they have to be
     here — uncounted, the green sample reads as a teal the sweep missed while
     the reader is wearing navy, which is what it reported on all ten screens. */
  /* (Gone with them on 20 Oct 2026: the swatches and the theme button; the selector is kept for a stale page.) */
  const CONTROL = el => el.closest && el.closest('#theme-menu, #theme-btn, [data-brand-pick]');
  for (const el of document.querySelectorAll('*')){
    if (CONTROL(el)) continue;
    const s = getComputedStyle(el);
    for (const p of PROPS) add(s[p]);
    /* Shadows and gradients carry brand colour too, and a refactor can break
       them without touching a single background-color. */
    for (const p of ['boxShadow', 'backgroundImage', 'textShadow']){
      const v = s[p];
      if (v && v !== 'none') for (const m of String(v).match(COLOUR_RE) || []) add(m);
    }
  }
  /* WHICH SHADES, NOT HOW MANY OF EACH. The first version tallied counts, and
     the first time markup legitimately changed — a theme menu, three rows on
     every page — all twenty screens failed with every colour identical and
     every count seventeen higher. It was measuring element count, which is not
     what a colour refactor can break. The set of shades in use is. */
  return [...tally.keys()].sort().join('\n');
};

(async () => {
  const h = await startHati();
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'amina@highland.co.ke',
    password: 'adminpassword1', data: { uid: 300, contracts: [
      { id: 'MK-82', name: 'Retail Supply — Coast', counterparty: 'Naivas Supermarkets',
        folder: 'proc', value: 78000000, valueType: 'standard', status: 'Under Review',
        template: 'RM', lastAction: '06 Aug 2026', expiry: '2027-06-30',
        fields: { effDate: '2026-07-01' }, metadata: {}, comments: [], audit: [],
        signatures: [], obligations: [], rounds: [], versions: [], redlineText: BASE, format: 'text' },
      { id: 'MK-83', name: 'Cold Chain Logistics', counterparty: 'Nordfrakt Logistik AB',
        folder: 'dist', value: 24500000, valueType: 'standard', status: 'Signed',
        template: 'WH', lastAction: '02 Aug 2026', expiry: '2027-03-31', fields: {}, metadata: {},
        comments: [], audit: [], signatures: [], obligations: [], rounds: [], versions: [],
        redlineText: BASE, format: 'text' },
      { id: 'MK-84', name: 'Packaging Supply — Nairobi', counterparty: 'Bull Packaging Ltd',
        folder: 'proc', value: 12750000, valueType: 'standard', status: 'Draft',
        template: 'RM', lastAction: '05 Aug 2026', expiry: '2027-01-15', fields: {}, metadata: {},
        comments: [], audit: [], signatures: [], obligations: [], rounds: [], versions: [],
        redlineText: BASE, format: 'text' },
    ], settings: {} } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const [ck, cv] = String(admin.cookie || '').split('=');
  const census = {};

  async function open(){
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: ck, value: cv, url: h.base }]);
    const page = await ctx.newPage();
    page.on('pageerror', e => check('page error', false, e.message));
    await page.goto(h.base, { waitUntil: 'load' });
    /* WAIT FOR THE CONTRACT THIS PAGE IS ABOUT TO USE, not merely for "some
       contracts arrived". The line under this one calls getContract('MK-82')
       and hands the result straight to negoInit, so a bootstrap that has
       delivered A list but not YET the one holding MK-82 satisfies the old
       condition and then crashes with "Cannot read properties of undefined
       (reading 'changes')" — which reads as a product fault and is a race in
       the harness. It passed here every time and failed on every CI runner:
       a timing window is exactly the kind of thing that is invisible on the
       machine you wrote it on. */
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts)
      && state.contracts.some(c => c && c.id === 'MK-82'));
    /* Frozen: an animated box-shadow resolves to a different colour on every
       frame, which is exactly the instability that sank the pixel version. */
    await page.addStyleTag({ content:
      '*,*::before,*::after{animation:none!important;transition:none!important}' });
    await page.evaluate(async () => {
      const c = getContract('MK-82'); negoInit(c);
      const cls = negoClauseList(c);
      await negoEditClause(c, cls[0].clauseId,
        '<p>The Supplier shall deliver within fourteen (14) days of the order date.</p>',
        { side: 'counterparty', author: 'Grace Njeri', summary: 'Delivery in 14 days' });
      await negoEditClause(c, cls[1].clauseId,
        '<p>The estimated annual contract value is KES 74,000,000, reviewed twice yearly.</p>',
        { side: 'counterparty', author: 'Grace Njeri', summary: 'Value down to KES 74m' });
      negoResolve(c, negoChanges(c)[0].id, 'accepted', { by: 'Amina Otieno', side: 'owner' });
      persist(c);
    });
    await pause(400);
    return { ctx, page };
  }

  const todayLook = {};
  /* ONE APPEARANCE (Chambers, 20 Oct 2026): dark mode left HaTi, so the
     census is the light screens only. */
  for (const theme of ['light']){
    const { ctx, page } = await open();
    for (const [name, go] of SCREENS){
      await go(page);
      await page.addStyleTag({ content:
        '*,*::before,*::after{animation:none!important;transition:none!important}' });
      /* The week's today marks come out first (they are drawn on weekdays only,
         see CAL_TODAY_ASIDE), and are looked at by the probe below instead. */
      await page.evaluate(CAL_TODAY_ASIDE);
      census[`${name}--${theme}`] = await page.evaluate(CENSUS);
      if (name === 'calendar') todayLook[theme] = await page.evaluate(CAL_TODAY_PROBE);
    }
    await ctx.close();
  }
  /* THE TODAY LOOK, CHECKED ON ANY DAY (19 Oct 2026). The census measures the
     week without its today marks, because a weekend draws none; so the marks
     are put to the page as probes, a today column and heading beside plain
     ones, and must still look marked: the column washed, the heading's day in
     the accent ink. A relation, not a recorded shade. */
  for (const theme of ['light']){
    const r = todayLook[theme];
    check(`calendar--${theme} — the today column is washed and its day wears the accent ink (probed, any day)`,
      !!r && r.colToday !== r.colPlain && r.colToday !== 'rgba(0, 0, 0, 0)'
        && r.headToday === r.accentInk && r.headPlain !== r.accentInk,
      r ? JSON.stringify(r) : 'no week drawn');
  }

  /* ---- THE OLD LOOK IS GONE (Chambers, 20 Oct 2026) ----
     The Blue / Green switch it used to press left with the dark mode, so the
     point of the exercise turns round: no screen may still draw a colour of
     the look HaTi left — the Blue and Green accents, their bar, and the Ink
     Wash greys and grounds of either brand. A colour the census holds is
     enough; how often does not matter. (Explorer's map, which keeps its own
     dark stage, is not one of these screens.) */
  const OLD_LOOK = ['rgb(38, 76, 158)', 'rgb(31, 64, 136)', 'rgb(28, 56, 114)', 'rgb(18, 121, 109)', 'rgb(14, 106, 95)',
    'rgb(14, 95, 88)', 'rgb(3, 46, 42)', 'rgb(58, 95, 90)', 'rgb(84, 121, 116)', 'rgb(9, 25, 56)', 'rgb(55, 74, 109)',
    'rgb(80, 100, 138)', 'rgb(244, 248, 247)', 'rgb(243, 246, 251)', 'rgb(220, 233, 230)', 'rgb(218, 226, 241)'];
  for (const [name] of SCREENS){
    const set = new Set(String(census[`${name}--light`] || '').split('\n'));
    const left = OLD_LOOK.filter(c => set.has(c));
    check(`${name} — no colour of the old look is drawn`, set.size > 1 && left.length === 0, left.join(' | ') || null);
  }

  await browser.close();
  await h.stop();

  if (SAVE){
    fs.writeFileSync(BASELINE, JSON.stringify(census, null, 2) + '\n');
    console.log(`\nBaseline saved — ${Object.keys(census).length} screens.`);
    process.exit(0);
  }
  if (!fs.existsSync(BASELINE)){
    console.log('\nNo baseline recorded. Run with --save first.');
    process.exit(1);
  }
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  for (const k of Object.keys(base)){
    if (base[k] === census[k]){ check(`${k} — every colour unchanged`, true); continue; }
    const was = new Set(String(base[k]).split('\n'));
    const now = new Set(String(census[k] || '').split('\n'));
    const gone = [...was].filter(x => !now.has(x)).slice(0, 4);
    const added = [...now].filter(x => !was.has(x)).slice(0, 4);
    check(`${k} — every colour unchanged`, false,
      `\n        was: ${gone.join(' | ') || '(nothing)'}\n        now: ${added.join(' | ') || '(nothing)'}`);
  }

  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
