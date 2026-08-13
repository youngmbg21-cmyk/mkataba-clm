/* Chromium verification: SETTINGS & RULES IS FOUR TABS AND ONE DRAWER
   ============================================================
   f193 proves the shape of the thing and f194 proves the wall. Neither can see
   a pixel: jsdom resolves no class rules at all, so a panel that is on the page
   and invisible passes both of them — which is the exact fault this codebase
   has already shipped once, when the counterparty's deal verbs sat behind
   [hidden] for a week with every test green.

   So this file opens the real shell in a real browser and asks the questions
   only a browser can answer:

     · every row on every tab opens a drawer that is VISIBLE PIXELS — measured
       through its ancestors, not asserted from its markup
     · the three ways out (✕, the scrim, Escape) each actually close it
     · nothing on the page spills sideways, at four window widths
     · a NON-ADMIN signs in for real and gets their own account page: no
       roster, no rules, no nav item, and the avatar opens their account
     · the phone's account sheet carries the same rows, below 768px

   Run: node test/chromium/settings-tabs-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* IS IT ACTUALLY ON SCREEN. Walks the ancestors for [hidden], .hidden,
   display:none, visibility:hidden and a zero box — the roll call that catches a
   control which is present, wired, tested and invisible. */
const VISIBLE = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { ok: false, why: 'not in the document' };
  let n = el;
  while (n && n.nodeType === 1) {
    const cs = getComputedStyle(n);
    if (n.hasAttribute('hidden')) return { ok: false, why: n.tagName + '#' + (n.id || '') + ' is [hidden]' };
    if (cs.display === 'none') return { ok: false, why: n.tagName + '#' + (n.id || '') + ' is display:none' };
    if (cs.visibility === 'hidden') return { ok: false, why: n.tagName + '#' + (n.id || '') + ' is visibility:hidden' };
    if (Number(cs.opacity) === 0) return { ok: false, why: n.tagName + '#' + (n.id || '') + ' is opacity:0' };
    n = n.parentElement;
  }
  const b = el.getBoundingClientRect();
  if (b.width < 2 || b.height < 2) return { ok: false, why: 'measures ' + Math.round(b.width) + 'x' + Math.round(b.height) };
  if (b.right < 0 || b.left > innerWidth) return { ok: false, why: 'sits off screen at x=' + Math.round(b.left) };
  return { ok: true, why: Math.round(b.width) + 'x' + Math.round(b.height) };
};

const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    /* ================= 1. THE ADMIN'S PAGE ================= */
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');
    await page.evaluate(() => setView('team'));
    await page.waitForTimeout(1200);

    const tabs = await page.evaluate(() =>
      [...document.querySelectorAll('#set-page .st-tab')].map(b => b.textContent.trim()));
    check('the page opens as four tabs', tabs.length === 4, tabs.join(' · '));
    check('and it opens on People',
      (await page.evaluate(() => settingsTab())) === 'people'
      && (await page.evaluate(() => !!document.querySelector('.st-person'))),
      'People, with the roster on it');

    /* Switching by pressing the tab, not by calling the function. */
    for (const t of ['platform', 'build', 'you', 'people']) {
      await page.click(`.st-tab[data-st-tab="${t}"]`);
      await page.waitForTimeout(400);
      const on = await page.evaluate(() => ({
        tab: settingsTab(),
        marked: document.querySelector('.st-tab.on')?.getAttribute('data-st-tab'),
        body: document.getElementById('st-tabbody').children.length,
      }));
      check(`pressing "${t}" goes there and says so`,
        on.tab === t && on.marked === t && on.body > 0, JSON.stringify(on));
    }

    /* ---- every row on every tab opens a drawer, and it is visible ---- */
    const panelKeys = await page.evaluate(() =>
      Object.keys(SET_PANELS).filter(k => !SET_PANELS[k].show || SET_PANELS[k].show()));
    const bad = [];
    for (const k of panelKeys) {
      await page.evaluate(x => { settingsGoTab(SET_PANELS[x].tab); }, k);
      await page.waitForTimeout(250);
      /* PRESSED, not called: the row's own delegated handler is what a person
         uses, and a row that is drawn but not wired passes a function call. */
      await page.click(`[data-st-panel="${k}"]`);
      await page.waitForTimeout(500);
      const v = await page.evaluate(VISIBLE, '#st-drawer');
      const title = await page.evaluate(() => (document.querySelector('#st-dhead .rvd-title') || {}).textContent || '');
      const bodyLen = await page.evaluate(() => document.getElementById('st-dbody').textContent.trim().length);
      if (!v.ok || !title.trim() || bodyLen < 10) bad.push(`${k}: ${v.why}${title ? '' : ' · no title'}${bodyLen < 10 ? ' · empty' : ''}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    check(`all ${panelKeys.length} rows open a drawer with a name and something in it`,
      bad.length === 0, bad.slice(0, 4).join(' | ') || panelKeys.join(', '));

    /* ---- the three ways out ---- */
    const isOpen = () => page.evaluate(() => document.getElementById('st-drawer').classList.contains('open'));
    await page.evaluate(() => { settingsGoTab('platform'); });
    await page.click('[data-st-panel="company"]'); await page.waitForTimeout(450);
    check('the drawer is open before we try to close it', await isOpen());
    await page.click('.st-dx'); await page.waitForTimeout(400);
    check('the ✕ closes it', !(await isOpen()));

    await page.click('[data-st-panel="company"]'); await page.waitForTimeout(450);
    /* A real press on the scrim at a point that is NOT over the drawer. */
    await page.mouse.click(80, 400); await page.waitForTimeout(400);
    check('pressing the dimmed page closes it', !(await isOpen()));

    await page.click('[data-st-panel="company"]'); await page.waitForTimeout(450);
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    check('Escape closes it', !(await isOpen()));

    /* ---- the drawer covers the page rather than squeezing it ---- */
    const before = await page.evaluate(() => Math.round(document.getElementById('set-page').getBoundingClientRect().width));
    await page.click('[data-st-panel="company"]'); await page.waitForTimeout(500);
    const during = await page.evaluate(() => Math.round(document.getElementById('set-page').getBoundingClientRect().width));
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    check('opening it does not resize the page underneath', before === during, `${before}px → ${during}px`);

    /* ---- nothing spills sideways, at four widths ---- */
    const spills = [];
    for (const w of [1920, 1500, 1280, 1024]) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const t of ['people', 'platform', 'build', 'you']) {
        await page.evaluate(k => settingsGoTab(k), t);
        await page.waitForTimeout(250);
        const over = await page.evaluate(() => {
          const sc = document.getElementById('content-scroll');
          return Math.max(0, sc.scrollWidth - sc.clientWidth);
        });
        if (over > 2) spills.push(`${w}px ${t} +${over}px`);
      }
    }
    check('no tab spills sideways at 1920 / 1500 / 1280 / 1024', spills.length === 0, spills.join(' | ') || 'clean');
    await page.setViewportSize({ width: 1500, height: 1000 });

    /* ---- the People tab ---- */
    await page.evaluate(() => settingsGoTab('people'));
    await page.waitForTimeout(400);
    const people = await page.evaluate(() => ({
      rows: document.querySelectorAll('.st-person').length,
      chips: [...document.querySelectorAll('.st-person .st-chip')].map(c => c.textContent.trim()),
      banner: !!document.getElementById('st-people-banner'),
      bannerNames: (document.getElementById('st-people-banner') || {}).textContent || '',
    }));
    check('every member is a row with a completeness chip',
      people.rows >= 4 && people.chips.length === people.rows, `${people.rows} rows · ${people.chips.join(', ')}`);
    check('and the unfinished ones are NAMED in the banner, not just counted',
      people.banner && /Restricted Legal|No Values Legal|Unrestricted Legal/.test(people.bannerNames),
      people.bannerNames.replace(/\s+/g, ' ').trim().slice(0, 110));

    await page.click('#st-add-person'); await page.waitForTimeout(500);
    const addV = await page.evaluate(VISIBLE, '#tm-pass');
    check('"Add member" opens the person drawer with the temporary password on it', addV.ok, addV.why);
    const saveV = await page.evaluate(VISIBLE, '#st-dsave');
    check('and a real form drawer shows Save & close as visible pixels', saveV.ok, saveV.why);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    await page.click('.st-person'); await page.waitForTimeout(500);
    const editHas = await page.evaluate(() => ({
      pass: !!document.getElementById('tm-pass'),
      name: !!document.getElementById('tm-name'),
      roles: document.querySelectorAll('.st-role').length,
    }));
    check('editing opens the same drawer, without the temporary password',
      editHas.name && editHas.roles === 3 && !editHas.pass, JSON.stringify(editHas));
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    /* ---- the go-live checklist is a door ---- */
    await page.evaluate(() => { settingsGoTab('build'); });
    await page.waitForTimeout(300);
    await page.click('[data-st-panel="golive"]'); await page.waitForTimeout(500);
    const goRows = await page.evaluate(() => [...document.querySelectorAll('#st-golive .st-row')].length);
    await page.click('#st-golive [data-st-go]'); await page.waitForTimeout(600);
    const landed = await page.evaluate(() => ({
      tab: settingsTab(),
      title: (document.querySelector('#st-dhead .rvd-title') || {}).textContent || '',
    }));
    check('a go-live row is a door that lands on the setting that fixes it',
      goRows >= 6 && landed.title.length > 0, `${goRows} rows → ${landed.tab} · "${landed.title}"`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    /* ---- SIGNING LIMITS (phase 2), as pixels ---- */
    await page.evaluate(() => { settingsGoTab('people'); });
    await page.waitForTimeout(400);
    /* Give somebody a limit through the drawer, the way an admin would. */
    const target = await page.evaluate(() => (getUsers().find(u => u.role === 'legal') || {}).id);
    await page.evaluate(id => settingsPersonDrawer(id), target);
    await page.waitForTimeout(500);
    const capV = await page.evaluate(VISIBLE, '#tm-cap');
    check('the person drawer carries a Signing section with a limit box', capV.ok, capV.why);
    const saysBefore = await page.textContent('#tm-cap-says');
    await page.fill('#tm-cap', '4000000');
    await page.waitForTimeout(300);
    const saysAfter = await page.textContent('#tm-cap-says');
    check('and a live sentence that reads back what was just typed',
      saysAfter !== saysBefore && /4/.test(saysAfter), saysAfter.trim().slice(0, 90));
    await page.click('#tm-cap-none'); await page.waitForTimeout(300);
    const noLimit = await page.evaluate(() => ({
      disabled: document.getElementById('tm-cap').disabled,
      says: document.getElementById('tm-cap-says').textContent,
    }));
    check('"No limit" disables the box rather than leaving two answers on screen',
      noLimit.disabled && /any size/i.test(noLimit.says), noLimit.says.trim().slice(0, 80));
    await page.click('#tm-cap-none'); await page.waitForTimeout(200);
    await page.fill('#tm-cap', '4000000');
    await page.click('#st-dsave'); await page.waitForTimeout(900);
    const rowSays = await page.evaluate(id =>
      (document.querySelector(`[data-st-cap="${id}"]`) || {}).textContent || '', target);
    check('and the roster row says how much that person may sign for',
      /4/.test(rowSays), rowSays.trim());

    /* ---- WHERE THEY MAY SIGN (phase 4), as pixels ---- */
    await page.evaluate(id => settingsPersonDrawer(id), target);
    await page.waitForTimeout(500);
    const sfV = await page.evaluate(VISIBLE, '#tm-sign-mode');
    check('the Folders section carries a second list — where they may SIGN', sfV.ok, sfV.why);
    const sfWords = await page.evaluate(() => document.getElementById('st-dbody').textContent);
    check('and it says which way it cuts: it only ever narrows',
      /only ever narrows/i.test(sfWords), 'stated on the panel');
    const sfHidden = await page.evaluate(() =>
      getComputedStyle(document.getElementById('tm-sign-list')).display);
    await page.selectOption('#tm-sign-mode', 'pick'); await page.waitForTimeout(300);
    const sfShown = await page.evaluate(() => ({
      display: getComputedStyle(document.getElementById('tm-sign-list')).display,
      boxes: document.querySelectorAll('[data-tm-signfolder]').length,
    }));
    check('picking "only these" opens its own tick list, separate from what they may SEE',
      sfHidden === 'none' && sfShown.display === 'grid' && sfShown.boxes >= 6,
      `${sfShown.boxes} folders offered`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    /* ---- WHO CHECKS THEIR WORK (phase 3), as pixels ---- */
    await page.evaluate(id => settingsPersonDrawer(id), target);
    await page.waitForTimeout(500);
    const rvV = await page.evaluate(VISIBLE, '#tm-rv-checked');
    check('the person drawer carries a "who checks their work" section', rvV.ok, rvV.why);
    const rvOn = await page.evaluate(() => ({
      checked: document.getElementById('tm-rv-checked').checked,
      says: document.getElementById('tm-rv-says').textContent,
      selDisabled: document.getElementById('tm-rv-reviewer').disabled,
    }));
    check('an untouched member reads as CHECKED — the absence of the flag is the migration',
      rvOn.checked === true, JSON.stringify(rvOn.checked));
    await page.click('#tm-rv-checked'); await page.waitForTimeout(300);
    const rvOff = await page.evaluate(() => ({
      says: document.getElementById('tm-rv-says').textContent,
      selDisabled: document.getElementById('tm-rv-reviewer').disabled,
    }));
    check('taking them off says what that means, and stands the reviewer picker down',
      /without anybody looking/i.test(rvOff.says) && rvOff.selDisabled === true,
      rvOff.says.trim().slice(0, 80));
    await page.click('#tm-rv-checked'); await page.waitForTimeout(200);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    await page.evaluate(() => { settingsGoTab('platform'); });
    await page.waitForTimeout(300);
    /* The master switch's panel says the rest is per person, and names anybody
       who has been taken off rather than counting them. */
    await page.click('[data-st-panel="review"]'); await page.waitForTimeout(600);
    await page.evaluate(() => { document.getElementById('rv-gate-on').checked = true;
      document.getElementById('rv-gate-on').dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForTimeout(600);
    const gate = await page.evaluate(() => ({
      newChecked: !!(document.getElementById('rv-gate-newchecked') || {}).checked,
      words: document.getElementById('rv-gate-panel').textContent,
    }));
    check('the review panel is the MASTER switch and says the rest is per person',
      gate.newChecked === true && /per person|each person/i.test(gate.words),
      gate.words.replace(/\s+/g, ' ').trim().slice(0, 110));
    await page.evaluate(() => { document.getElementById('rv-gate-on').checked = false;
      document.getElementById('rv-gate-on').dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    await page.click('[data-st-panel="approvals"]'); await page.waitForTimeout(600);
    const ladder = await page.evaluate(VISIBLE, '#sc-ladder');
    const sw = await page.evaluate(() => ({
      on: document.getElementById('sc-rule-on').checked,
      rows: document.querySelectorAll('#sc-ladder .st-frow').length,
      note: document.getElementById('sc-ladder').textContent,
    }));
    check('the ladder is drawn beside the approval rules and the switch is OFF',
      ladder.ok && sw.on === false && sw.rows >= 3, `${sw.rows} rows · switch ${sw.on}`);
    const sfSwitch = await page.evaluate(() => {
      const b = document.getElementById('sf-rule-on');
      return b ? { there: true, on: b.checked } : { there: false };
    });
    check('and the folder rule has its OWN switch, also off by default',
      sfSwitch.there && sfSwitch.on === false, JSON.stringify(sfSwitch));
    check('and it says out loud that the limits are recorded, not enforced',
      /not enforced/i.test(sw.note), sw.note.replace(/\s+/g, ' ').trim().slice(-70));
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    /* ---- CLEARING THE SAMPLES, end to end ----
       The one destructive control on this page, and the one that could not go
       through the per-contract delete (which refuses anything past Draft, and
       half the samples are seeded as Signed). Pressed for real, with the
       confirm answered yes, and then checked against the register. */
    await page.evaluate(async () => {
      /* Two contracts a name-matching implementation would get wrong. */
      const mk = (id, name, seeded) => ({ id, name, counterparty: 'Kabras', folder: 'proc',
        status: 'Signed', value: 1, seeded: seeded || undefined, audit: [], signatures: [] });
      for (const c of [mk('MK-D1', 'Seeded Sugar', true), mk('MK-D2', 'Seeded Sugar', false)]) {
        await api('contracts/' + c.id, 'PUT', { contract: c, baseVersion: 0 });
        state.contracts.push(c);
      }
      window.__confirmWas = window.confirmDialog;
      window.confirmDialog = async () => true;
      settingsGoTab('build'); stDrawerOpen('samples');
    });
    await page.waitForTimeout(600);
    const samplesBefore = await page.evaluate(() => ({
      chip: (document.querySelector('[data-st-panel="samples"] .st-row-chip') || {}).textContent || '',
      btn: !!document.getElementById('st-samples-clear'),
    }));
    check('the samples panel counts what is seeded and offers to clear it',
      samplesBefore.btn, `chip "${samplesBefore.chip}"`);
    await page.click('#st-samples-clear');
    await page.waitForTimeout(1800);
    const samplesAfter = await page.evaluate(async () => {
      const list = await api('contracts?limit=200');
      const ids = (list.rows || []).map(c => c.id);
      return { seededGone: !ids.includes('MK-D1'), realKept: ids.includes('MK-D2'),
        onScreen: document.getElementById('st-dbody').textContent };
    });
    check('pressing it removes the seeded example and keeps the real one with the same name',
      samplesAfter.seededGone && samplesAfter.realKept,
      `seeded gone ${samplesAfter.seededGone} · real kept ${samplesAfter.realKept}`);
    check('and the panel says so afterwards rather than still offering the press',
      /No sample contracts are left|sample contracts are still here/i.test(samplesAfter.onScreen),
      samplesAfter.onScreen.replace(/\s+/g, ' ').trim().slice(0, 70));
    await page.evaluate(() => { window.confirmDialog = window.__confirmWas; });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    /* ---- the avatar is the account menu ---- */
    await page.click('#rail-avatar'); await page.waitForTimeout(600);
    const acct = await page.evaluate(() => ({
      open: document.getElementById('st-drawer').classList.contains('open'),
      title: (document.querySelector('#st-dhead .rvd-title') || {}).textContent || '',
      title2: !!document.getElementById('acct-title'),
      sessions: (document.getElementById('sessions-list') || {}).textContent || '',
    }));
    check('the avatar opens Your account, with the job title and the sessions on it',
      acct.open && acct.title2 && acct.sessions.length > 0, `"${acct.title}" · sessions "${acct.sessions.slice(0, 40)}"`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await ctx.close();

    /* ================= 2. A NON-ADMIN, SIGNED IN FOR REAL ================= */
    const ctx2 = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errors.push('member: ' + e.message));
    await signIn(p2, h.base, 'everything@example.co.ke', 'their-own-pass-9');
    const navHidden = await p2.evaluate(() => {
      const b = document.querySelector('.nav-item[data-view="team"]');
      return !b || b.classList.contains('hidden') || getComputedStyle(b).display === 'none';
    });
    check('an Editor has no Settings & Rules door in the sidebar', navHidden);

    /* The door they cannot see is not the wall. Arriving anyway — a bookmark, a
       restored session, a console — must land somewhere real. */
    await p2.evaluate(() => setView('team'));
    await p2.waitForTimeout(1200);
    const theirs = await p2.evaluate(() => ({
      words: document.getElementById('content').textContent,
      roster: document.querySelectorAll('.st-person').length,
      rules: !!document.getElementById('approval-rules'),
      gates: !!document.getElementById('rv-gate-panel') || !!document.getElementById('dk-rule-panel'),
      mine: !!document.getElementById('acct-title') && !!document.getElementById('pref-nav-all'),
      sessions: !!document.getElementById('sessions-list'),
      backup: !!document.getElementById('bk-export'),
      design: !!document.getElementById('brand-edit'),
    }));
    check('reaching the page anyway lands on their own account, not a blank',
      theirs.mine && theirs.sessions && theirs.backup, JSON.stringify({ mine: theirs.mine, sessions: theirs.sessions, backup: theirs.backup }));
    check('and it says why rather than going quiet',
      /admins/i.test(theirs.words), theirs.words.replace(/\s+/g, ' ').trim().slice(0, 90));
    check('the roster, the rules and the gates are not on it',
      theirs.roster === 0 && !theirs.rules && !theirs.gates,
      `${theirs.roster} people · rules ${theirs.rules} · gates ${theirs.gates}`);
    check("an Editor keeps the company-design door the old page gave them", theirs.design);

    const avatarLands = await p2.evaluate(async () => {
      document.getElementById('rail-avatar').click();
      await new Promise(r => setTimeout(r, 400));
      return { open: document.getElementById('st-drawer').classList.contains('open'),
               title: !!document.getElementById('acct-title') };
    });
    check('their avatar opens their account too', avatarLands.open && avatarLands.title, JSON.stringify(avatarLands));
    await ctx2.close();

    /* ================= 3. THE PHONE ================= */
    const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p3 = await ctx3.newPage();
    p3.on('pageerror', e => errors.push('phone: ' + e.message));
    await signIn(p3, h.base, 'everything@example.co.ke', 'their-own-pass-9');
    await p3.waitForTimeout(800);
    await p3.click('[data-m-act="account"]');
    await p3.waitForTimeout(900);
    const sheet = await p3.evaluate(() => ({
      title: !!document.getElementById('m-acct-title'),
      navAll: !!document.querySelector('[data-m-act="acct-nav-all"]'),
      sessions: !!document.getElementById('sessions-list'),
      backup: !!document.querySelector('[data-m-act="acct-backup"]'),
      words: document.querySelector('.m-sheet').textContent,
      shellHidden: getComputedStyle(document.getElementById('app-shell')).display === 'none',
    }));
    check('the phone is drawing the phone shell', sheet.shellHidden);
    check('and its account sheet carries the same rows as the laptop drawer',
      sheet.title && sheet.navAll && sheet.sessions && sheet.backup,
      JSON.stringify({ t: sheet.title, n: sheet.navAll, s: sheet.sessions, b: sheet.backup }));
    /* The honest read-only statement, not a switch wired to nothing. */
    const S = require('../../js/i18n.js').STRINGS.en;
    check('including the honest statement of what HaTi emails them',
      sheet.words.includes(S.set_still_emailed));
    /* The drawer is a laptop thing and must not be reachable here. */
    const noDrawer = await p3.evaluate(() => {
      const d = document.getElementById('st-drawer');
      return !d || getComputedStyle(d).display === 'none';
    });
    check('the laptop drawer never draws below 768px', noDrawer);
    await ctx3.close();

    check('no page errors anywhere', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
