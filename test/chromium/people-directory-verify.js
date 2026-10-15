/* Chromium verification: THE DIRECTORY — a wall of faces everybody can read
   ============================================================
   f202 proves the absence (no folder access, no signing limits, no review
   flags reach a non-admin) and f669 the reading. Neither can see a pixel:
   jsdom resolves no class rules, so a card that is present and invisible, or
   a panel that never paints, passes them.

   So this file signs real people into the real shell and asks:

     · the Directory door is on screen for a restricted member, and pressing
       it lands on the wall
     · the Our people tab is the roster, admins first, each a card with a
       job title and an address, as visible pixels
     · the Their people tab names the other side's people with their party;
       a pressed card paints the panel, and its Open party door lands on
       Home's wall of paper narrowed to that party (step 2, 14 Oct 2026)
     · the A to Z edge moves the wall; a refresh keeps the tab
     · nothing on the page names a folder, a limit or a review
     · a VIEWER gets the same wall (D-3) and no door to Settings
     · an ADMIN gets the one line pointing at Settings → People, and it works;
       the Parties panel's People door lands here narrowed to the party
     · the phone still draws its People list under More, not a hand-off

   Run: node test/chromium/people-directory-verify.js */
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

const VISIBLE = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { ok: false, why: 'not in the document' };
  let n = el;
  while (n && n.nodeType === 1) {
    const cs = getComputedStyle(n);
    if (n.hasAttribute('hidden')) return { ok: false, why: (n.id || n.className || n.tagName) + ' is [hidden]' };
    if (cs.display === 'none') return { ok: false, why: (n.id || n.className || n.tagName) + ' is display:none' };
    if (cs.visibility === 'hidden') return { ok: false, why: (n.id || n.className || n.tagName) + ' is visibility:hidden' };
    n = n.parentElement;
  }
  const b = el.getBoundingClientRect();
  if (b.width < 2 || b.height < 2) return { ok: false, why: 'measures ' + Math.round(b.width) + 'x' + Math.round(b.height) };
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

/* What the wall is showing, read off the rendered DOM. */
const PAGE = () => {
  const cards = [...document.querySelectorAll('#dir-page [data-dir-row]')];
  const txt = (el, sel) => { const x = el.querySelector(sel); return x ? x.textContent.replace(/\s+/g, ' ').trim() : ''; };
  return {
    n: cards.length,
    names: cards.map(c => txt(c, '.dir-name')),
    roles: cards.map(c => txt(c, '.dir-role')),
    subs: cards.map(c => txt(c, '.dir-sub')),
    mails: cards.map(c => { const a = c.querySelector('.dir-mail a'); return a ? a.getAttribute('href') : null; }),
    words: (document.getElementById('dir-page') || {}).textContent || '',
    manage: !!document.getElementById('dir-manage'),
    tab: (document.querySelector('#dir-page [data-dir-tab].on') || {}).getAttribute ? document.querySelector('#dir-page [data-dir-tab].on').getAttribute('data-dir-tab') : null,
    tabs: [...document.querySelectorAll('#dir-page [data-dir-tab]')].map(t => ({ k: t.getAttribute('data-dir-tab'), n: Number((t.querySelector('.n') || {}).textContent || 0) })),
    links: [...document.querySelectorAll('#dir-page a')].map(a => a.getAttribute('href')),
    panel: { id: (document.getElementById('ins-panel') || {}).getAttribute ? document.getElementById('ins-panel').getAttribute('data-ins-id') : null,
      name: txt(document.getElementById('ins-panel') || document.body, '.ins-cp'),
      acts: [...document.querySelectorAll('#ins-panel [data-ins-act]')].map(b => ({ k: b.getAttribute('data-ins-act'), t: b.textContent.trim(), dead: b.disabled })) },
  };
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  /* A Viewer, so D-3 is asked of a real one rather than of a fixture. */
  await W.admin.json('/api/users', { method: 'POST', body: {
    name: 'Vera Reader', email: 'vera@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  {
    const c = h.client('vera@example.co.ke');
    await c.json('/api/login', { method: 'POST', body: { email: 'vera@example.co.ke', password: 'temporary-pass-1' } });
    await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  }
  /* And a job title on somebody, so the card has one to print. */
  await W.admin.json('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { title: 'Commercial Counsel' } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    /* ============ 1. A RESTRICTED MEMBER — the reader this page is for ====== */
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'restricted@example.co.ke', 'their-own-pass-9');

    const door = await page.evaluate(VISIBLE, '.nav-item[data-view="directory"]');
    check('the Directory door is on screen for a restricted member', door.ok, door.why);
    const doorWord = await page.evaluate(() => (document.querySelector('.nav-item[data-view="directory"]') || {}).textContent || '');
    check('and it says Directory', /Directory/.test(doorWord), doorWord.trim().slice(0, 30));
    const noSettings = await page.evaluate(VISIBLE, '.nav-item[data-view="team"]');
    check('while Settings & Rules is not — which is why the roster lives here', !noSettings.ok, noSettings.why);

    /* PRESSED, not called. */
    await page.click('.nav-item[data-view="directory"]');
    await page.waitForTimeout(1200);
    const card = await page.evaluate(VISIBLE, '#dir-page .dir-card');
    check('pressing it lands on a page with the wall on it', card.ok, card.why);
    const firstFace = await page.evaluate(VISIBLE, '#dir-page .dir-face');
    check('and a card is a painted thing, not a row', firstFace.ok, firstFace.why);

    const all = await page.evaluate(PAGE);
    const boot = await W.restricted.json('/api/bootstrap');
    check('Everyone is the tab it opens on', all.tab === 'all', all.tab);
    const sum = all.tabs.filter(t => t.k !== 'all').reduce((s, t) => s + t.n, 0);
    check('the three sides add up to Everyone, and Everyone is the cards on the wall',
      sum === all.n && (all.tabs.find(t => t.k === 'all') || {}).n === all.n, JSON.stringify(all.tabs) + ' vs ' + all.n);

    /* ---- OUR PEOPLE: the roster, as it was ---- */
    await page.click('#dir-page [data-dir-tab="ours"]');
    await page.waitForTimeout(700);
    const p = await page.evaluate(PAGE);
    check('Our people is every colleague', p.n === boot.users.length, `${p.n} cards for ${boot.users.length} people`);
    check('and the admin is named, first', /Amina Otieno/.test(p.names[0]) && /Admin/i.test(p.roles[0]), `${p.names[0]} · ${p.roles[0]}`);
    check('each address is a mailto, so the wall can be acted on',
      p.mails.filter(Boolean).length === p.n && p.mails.every(m => !m || m.startsWith('mailto:')), p.mails[0]);
    check('a job title an admin set is printed', /Commercial Counsel/.test(p.words));
    check('and the only links on the page are addresses', p.links.length > 0 && p.links.every(l => l.startsWith('mailto:')), `${p.links.length} links`);

    /* ---- THE ABSENCE, AS PIXELS ---- */
    const leaks = ['Sales & Route', 'signing limit', 'Signing limit', 'reviewed by'].filter(w => p.words.includes(w));
    check('nothing on the page names a limit or a review', leaks.length === 0, leaks.join(' | ') || 'clean');
    check('a non-admin is offered no door to Settings, because they have none', !p.manage);

    /* ---- THEIR PEOPLE: the other side, with their party ---- */
    await page.click('#dir-page [data-dir-tab="theirs"]');
    await page.waitForTimeout(700);
    const t = await page.evaluate(PAGE);
    check('Their people names at least one outside person', t.n >= 1, `${t.n} cards`);
    check('each with the party they belong to on the card', t.subs.every(s => s.length > 3 && !/Our side/.test(s)), t.subs[0]);
    const panel0 = t.panel;
    check('the first card is chosen and the panel describes that person',
      !!panel0.id && panel0.name === t.names[0], `${panel0.name} vs ${t.names[0]}`);
    if (t.n >= 2){
      await page.click('#dir-page [data-dir-row]:nth-child(2)');
      await page.waitForTimeout(500);
      const t2 = await page.evaluate(PAGE);
      check('pressing another card moves the panel to them', t2.panel.name === t2.names[1], `${t2.panel.name} vs ${t2.names[1]}`);
      await page.click('#dir-page [data-dir-row]:nth-child(1)');
      await page.waitForTimeout(400);
    }
    const acts = (await page.evaluate(PAGE)).panel.acts;
    const open = acts.find(a => a.k === 'party');
    check('the panel offers Open party, Draft new agreement and Open on Explorer',
      !!open && acts.some(a => a.k === 'draft') && acts.some(a => a.k === 'explorer'), acts.map(a => a.t).join(' · '));
    check('and Open party is live, because that party\'s contracts are loaded', open && !open.dead);
    await page.click('#ins-panel [data-ins-act="party"]');
    /* RE-POINTED 14 Oct 2026 (the overnight work order, step 2; was the
       Contracts page narrowed by its chip): Open party is Parties' own door
       (cuOpenCustomer), which lands on Home's wall of paper, nothing chosen,
       narrowed to that party by its one lit chip. Asked of the state, bounded. */
    await page.waitForFunction(() => state.view === 'dashboard' && !!document.querySelector('#ig-wall [data-igw-only-clear]'), null, { timeout: 8000 }).catch(() => {});
    const landed = await page.evaluate(() => ({ view: state.view, face: window.hbFace ? hbFace() : null, paper: !!(window.intel && intel.paper),
      only: !!(window.igWall && igWall.only && igWall.only.ids.length), chip: !!document.querySelector('#ig-wall [data-igw-only-clear]'),
      cards: document.querySelectorAll('#ig-wall [data-ig-pick]').length }));
    check('Open party lands on Home\'s wall narrowed to that party', landed.view === 'dashboard' && landed.face === 'paper' && !landed.paper
      && landed.only && landed.chip && landed.cards >= 1, JSON.stringify(landed));

    /* ---- THE EDGE, AND THE REFRESH ---- */
    await page.click('.nav-item[data-view="directory"]');
    await page.waitForTimeout(1000);
    const back = await page.evaluate(PAGE);
    check('the rail brings you back to the tab you were on', back.tab === 'theirs', back.tab);
    await page.click('#dir-page [data-dir-tab="all"]');
    await page.waitForTimeout(600);
    const edge = await page.evaluate(() => {
      const live = [...document.querySelectorAll('#dir-page .dir-az button:not(.is-dim)')];
      const dim = document.querySelectorAll('#dir-page .dir-az button.is-dim').length;
      return { live: live.map(b => b.getAttribute('data-dir-az')), dim, total: live.length + dim };
    });
    check('the A to Z edge is drawn, live where somebody is behind the letter, dimmed where nobody is',
      edge.total >= 26 && edge.live.length >= 1 && edge.dim >= 1, `${edge.live.join('')} live · ${edge.dim} dim`);
    const last = edge.live[edge.live.length - 1];
    const moved = await page.evaluate(L => {
      const sc = document.getElementById('dir-scroll');
      const before = sc.scrollTop;
      document.querySelector(`#dir-page .dir-az [data-dir-az="${L}"]`).click();
      const first = [...document.querySelectorAll('#dir-page .dir-face')].find(f => f.getAttribute('data-dir-letter') === L);
      const top = first.getBoundingClientRect().top - sc.getBoundingClientRect().top;
      return { before, after: sc.scrollTop, top: Math.round(top), fits: sc.scrollHeight > sc.clientHeight };
    }, last);
    check('pressing a letter puts the first card under it at the top of the wall (or the wall already fits)',
      !moved.fits || (moved.top >= 0 && moved.top < 40), JSON.stringify(moved));
    await page.click('#dir-page [data-dir-tab="theirs"]');
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const kept = await page.evaluate(() => ({ view: state.view, tab: (document.querySelector('#dir-page [data-dir-tab].on') || {}).getAttribute
      ? document.querySelector('#dir-page [data-dir-tab].on').getAttribute('data-dir-tab') : null }));
    check('a refresh lands on the Directory, on the same tab', kept.view === 'directory' && kept.tab === 'theirs', JSON.stringify(kept));

    await ctx.close();

    /* ============ 2. A VIEWER (D-3) ============ */
    const ctxV = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const pv = await ctxV.newPage();
    pv.on('pageerror', e => errors.push('viewer: ' + e.message));
    await signIn(pv, h.base, 'vera@example.co.ke', 'their-own-pass-9');
    const vDoor = await pv.evaluate(VISIBLE, '.nav-item[data-view="directory"]');
    check('a Viewer has the door too', vDoor.ok, vDoor.why);
    await pv.click('.nav-item[data-view="directory"]');
    await pv.waitForTimeout(1200);
    await pv.click('#dir-page [data-dir-tab="ours"]');
    await pv.waitForTimeout(600);
    const vp = await pv.evaluate(PAGE);
    check('and gets the whole roster — reading who is here is their level of access', vp.n >= 5, `${vp.n} cards`);
    check('marked on their own card', vp.names.some(n => /Vera Reader/.test(n) && /\(you\)|you/i.test(n)), vp.names.find(n => /Vera/.test(n)));
    check('a Viewer is offered no door to Settings', !vp.manage);
    await ctxV.close();

    /* ============ 3. AN ADMIN — one extra line, and the Parties door ======= */
    const ctxA = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const pa = await ctxA.newPage();
    pa.on('pageerror', e => errors.push('admin: ' + e.message));
    await signIn(pa, h.base, 'admin@example.co.ke', 'adminpassword1');
    await pa.click('.nav-item[data-view="directory"]');
    await pa.waitForTimeout(1200);
    const manage = await pa.evaluate(VISIBLE, '#dir-manage');
    check('an admin is pointed at Settings → People', manage.ok, manage.why);
    await pa.click('#dir-manage');
    await pa.waitForTimeout(1400);
    const landedA = await pa.evaluate(() => ({
      view: state.view, tab: typeof settingsTab === 'function' ? settingsTab() : null,
      roster: document.querySelectorAll('.st-person').length,
    }));
    check('and the line is a real door — it lands on the editable roster',
      landedA.view === 'team' && landedA.tab === 'people' && landedA.roster > 0, JSON.stringify(landedA));
    check('which is unchanged: its rows still open the person drawer',
      await pa.evaluate(() => !!document.querySelector('.st-person[data-st-panel^="person:"]')));

    /* ---- THE PARTIES PANEL'S PEOPLE DOOR ---- */
    await pa.evaluate(() => setView('customers'));
    await pa.waitForTimeout(1200);
    const party = await pa.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-cu-cust]')];
      for (const r of rows){
        const k = r.getAttribute('data-cu-cust');
        const n = (typeof dirPeopleOfParty === 'function') ? dirPeopleOfParty(k).length : 0;
        if (n){ r.click(); return { key: k, n }; }
      }
      return null;
    });
    check('a party with people named is on the Parties page', !!party, party && `${party.key} · ${party.n}`);
    if (party){
      await pa.waitForTimeout(600);
      const doorP = await pa.evaluate(() => {
        const b = [...document.querySelectorAll('#ins-panel [data-ins-act]')].find(x => x.getAttribute('data-ins-act') === 'people');
        return b ? { text: b.textContent.trim(), vis: !!b.offsetParent } : null;
      });
      check('its panel carries a People door with the number behind it', !!doorP && doorP.vis && doorP.text.includes(String(party.n)), doorP && doorP.text);
      await pa.click('#ins-panel [data-ins-act="people"]');
      await pa.waitForTimeout(1200);
      const here = await pa.evaluate(() => ({ view: state.view, n: document.querySelectorAll('#dir-page [data-dir-row]').length,
        party: (document.querySelector('#dir-page select[data-dir-f="party"]') || {}).value || null }));
      check('and the door lands on the Directory narrowed to that party, with exactly that many cards',
        here.view === 'directory' && here.n === party.n && here.party === party.key, JSON.stringify(here));
    }
    await ctxA.close();

    /* ============ 4. THE PHONE keeps its People screen ============ */
    const ctxP = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const pp = await ctxP.newPage();
    pp.on('pageerror', e => errors.push('phone: ' + e.message));
    await signIn(pp, h.base, 'restricted@example.co.ke', 'their-own-pass-9');
    await pp.evaluate(() => mGo('more'));
    await pp.waitForTimeout(800);
    const row = await pp.evaluate(VISIBLE, '[data-m-go="people"]');
    check('the phone offers People under More', row.ok, row.why);
    const promises = await pp.evaluate(() =>
      (document.querySelector('[data-m-go="people"]') || {}).textContent || '');
    check('and it does NOT say "open on a computer" — it is a real screen',
      !/computer/i.test(promises), promises.replace(/\s+/g, ' ').trim().slice(0, 70));

    await pp.click('[data-m-go="people"]');
    await pp.waitForTimeout(900);
    const phone = await pp.evaluate(() => ({
      screen: mS().screen,
      rows: document.querySelectorAll('[data-m-person]').length,
      shellHidden: getComputedStyle(document.getElementById('app-shell')).display === 'none',
    }));
    check('the phone is drawing the phone shell', phone.shellHidden);
    check('and People is a real screen with the same people on it',
      phone.screen === 'people' && phone.rows >= 4, `${phone.rows} rows`);

    /* ---- AN ABSENCE READS THE SAME ON BOTH SHELLS ---- */
    const S = require('../../js/i18n.js').STRINGS.en;
    const noTitle = await pp.evaluate(() => {
      const row = [...document.querySelectorAll('[data-m-person]')]
        .find(r => /Vera Reader/.test(r.textContent));
      return row ? row.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    check('the phone names a missing job title, in the laptop\'s own words',
      noTitle.includes(S.dir_no_title), noTitle.slice(0, 80));
    check('and the role still follows it rather than replacing it',
      /Viewer/.test(noTitle), noTitle.slice(0, 80));
    const backP = await pp.evaluate(VISIBLE, '[data-m-act="back"]');
    check('and a way back', backP.ok, backP.why);
    await pp.click('[data-m-act="back"]');
    await pp.waitForTimeout(700);
    check('which goes to More, where it was reached from',
      (await pp.evaluate(() => mS().screen)) === 'more');
    await ctxP.close();

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
