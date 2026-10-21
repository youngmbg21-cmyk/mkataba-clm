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

   RE-POINTED 19 Oct 2026 (lane A2: round 19 "The SAP way", the People scene;
   the owner's "build all the gaps" reverses the 13 Oct face cards): the wall
   is a TABLE, the tabs are the Side box, the reader comes first then everyone
   by name, there is no A to Z edge, and the Parties panel names its people
   ("People at <party>"), each row choosing that person here, lit.

   RE-POINTED 21 Oct 2026 (Part 8, the owner's pick of "The Legora way"):
   the sides are the list head's tabs (Everyone · Ours · Theirs), the role
   here stands under the name, and the address left the row — it rides the
   name's hover, and the person's panel carries it as the link.

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

/* What the table is showing, read off the rendered DOM. */
const PAGE = () => {
  const cards = [...document.querySelectorAll('#dir-page [data-dir-row]')];
  const txt = (el, sel) => { const x = el.querySelector(sel); return x ? x.textContent.replace(/\s+/g, ' ').trim() : ''; };
  const heads = [...document.querySelectorAll('#dir-page thead th')].map(t => t.getAttribute('data-dir-col') || 'name');
  const col = (c, k) => { const i = heads.indexOf(k); const td = i >= 0 ? c.children[i] : null; return td ? td.textContent.replace(/\s+/g, ' ').trim() : ''; };
  /* (Part 8) the side is the lit tab of the list head */
  const side = document.querySelector('#dir-page [role="tab"][data-dir-tab][aria-selected="true"]');
  return {
    n: cards.length,
    names: cards.map(c => txt(c, '.dir-name')),
    roles: cards.map(c => txt(c, '.dir-sub .dir-role')),
    subs: cards.map(c => col(c, 'party')),
    mails: cards.map(c => { const w = c.querySelector('.dir-nm-w'); return w ? w.getAttribute('title') : null; }),
    rowLinks: cards.reduce((n, c) => n + c.querySelectorAll('a').length, 0),
    panelMail: !!document.querySelector('#ins-panel a[href^="mailto:"]'),
    words: (document.getElementById('dir-page') || {}).textContent || '',
    manage: !!document.getElementById('dir-manage'),
    tab: side ? side.getAttribute('data-dir-tab') : null,
    tabs: (typeof dirTabCount === 'function') ? DIR_TABS.map(k => ({ k, n: dirTabCount(dirBook(), k) })) : [],
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

    /* RE-POINTED 17 Oct 2026 (the owner picked "Desk tabs", Round 2): the left
       menu is not drawn on a computer; the Directory is a place Jambo opens */
    const door = await page.evaluate(() => ({ place: (caReadPlace('people') || {}).place, also: (caReadPlace('directory') || {}).place, slash: caSlashRows('people', { max: 5 }).map(r => r.k) }));
    check('the Directory is a place in Jambo\'s "/" list for a restricted member', door.place === 'people' && door.slash.includes('people'), JSON.stringify(door));
    check('and "directory" opens it too', door.also === 'people', String(door.also));
    /* RE-POINTED IN PLACE 16 Oct 2026 (the Control Room): Settings is
       everyone's now, and for a member it is their OWN settings — no roster,
       no Company tab — which is still why the roster lives here. */
    const settingsDoor = await page.evaluate(() => { const ok = (caReadPlace('settings') || {}).place === 'settings'; if (ok){ setView('counter'); counterAsk('settings'); } return { ok, why: ok ? 'opened by "settings"' : 'not a place' }; });
    await page.waitForTimeout(800);
    const theirFace = await page.evaluate(() => (typeof settingsTab === 'function') ? settingsTab() : '');
    check('Settings is theirs too, and it opens on their own settings — which is why the roster lives here',
      settingsDoor.ok && theirFace === 'you', settingsDoor.why + ' · ' + theirFace);

    /* PRESSED, not called. */
    await page.evaluate(w => { setView('counter'); counterAsk(w); }, 'people');
    await page.waitForTimeout(1200);
    const card = await page.evaluate(VISIBLE, '#dir-page .dir-card');
    check('pressing it lands on a page with the table on it', card.ok, card.why);
    const firstFace = await page.evaluate(VISIBLE, '#dir-page #dir-tbody tr[data-dir-row]');
    check('and a person is a painted row of the table', firstFace.ok, firstFace.why);

    const all = await page.evaluate(PAGE);
    const boot = await W.restricted.json('/api/bootstrap');
    check('the tabs open on Everyone', all.tab === 'all', all.tab);
    const sum = all.tabs.filter(t => t.k !== 'all').reduce((s, t) => s + t.n, 0);
    check('the three sides add up to Everyone, and Everyone is the cards on the wall',
      sum === all.n && (all.tabs.find(t => t.k === 'all') || {}).n === all.n, JSON.stringify(all.tabs) + ' vs ' + all.n);

    /* ---- OUR PEOPLE: the roster, the reader first ---- */
    await page.click('#dir-page [role="tab"][data-dir-tab="ours"]');
    await page.waitForTimeout(700);
    const p = await page.evaluate(PAGE);
    check('Our people is every colleague', p.n === boot.users.length, `${p.n} rows for ${boot.users.length} people`);
    const ai = p.names.findIndex(n => /Amina Otieno/.test(n));
    check('the reader first, then by name; the admin\'s row says Admin', /Restricted Legal/.test(p.names[0]) && ai > 0 && /Admin/i.test(p.roles[ai]), `${p.names[0]} · ${p.names[ai]} ${p.roles[ai]}`);
    /* (Part 8) the address rides the name's hover; the chosen person's panel carries it as the link */
    check('each row carries its address, and the panel\'s address is a mailto, so the wall can be acted on',
      p.mails.filter(m => /@/.test(m || '')).length === p.n && p.rowLinks === 0 && p.panelMail, JSON.stringify({ first: p.mails[0], rowLinks: p.rowLinks, panelMail: p.panelMail }));
    check('a job title an admin set is printed', /Commercial Counsel/.test(p.words));
    check('and the only links on the page are addresses', p.links.length > 0 && p.links.every(l => l.startsWith('mailto:')), `${p.links.length} links`);

    /* ---- THE ABSENCE, AS PIXELS ---- */
    const leaks = ['Sales & Route', 'signing limit', 'Signing limit', 'reviewed by'].filter(w => p.words.includes(w));
    check('nothing on the page names a limit or a review', leaks.length === 0, leaks.join(' | ') || 'clean');
    check('a non-admin is offered no door to Settings, because they have none', !p.manage);

    /* ---- THEIR PEOPLE: the other side, with their party ---- */
    await page.click('#dir-page [role="tab"][data-dir-tab="theirs"]');
    await page.waitForTimeout(700);
    const t = await page.evaluate(PAGE);
    check('Their people names at least one outside person', t.n >= 1, `${t.n} rows`);
    check('each with the party they belong to on the row', t.subs.every(s => s.length > 3 && !/Highland/.test(s)), t.subs[0]);
    const panel0 = t.panel;
    check('the first card is chosen and the panel describes that person',
      !!panel0.id && panel0.name === t.names[0], `${panel0.name} vs ${t.names[0]}`);
    if (t.n >= 2){
      await page.click('#dir-page #dir-tbody [data-dir-row]:nth-child(2)');
      await page.waitForTimeout(500);
      const t2 = await page.evaluate(PAGE);
      check('pressing another card moves the panel to them', t2.panel.name === t2.names[1], `${t2.panel.name} vs ${t2.names[1]}`);
      await page.click('#dir-page #dir-tbody [data-dir-row]:nth-child(1)');
      await page.waitForTimeout(400);
    }
    /* RE-POINTED 19 Oct 2026 (lane A2, check #1 against round 19's People
       scene, Henrik Dahl): someone on their side has the drawn two doors —
       Show their contracts · Email — and the party is a row of its own whose
       door lands on Parties with that party chosen and lit */
    const acts = (await page.evaluate(PAGE)).panel.acts;
    const show = acts.find(a => a.k === 'contracts');
    check('the panel offers Show their contracts and Email, as drawn', !!show && acts.map(a => a.k).join(',') === 'contracts,email', acts.map(a => a.t).join(' · '));
    check('and Show their contracts is live, because they are named on contracts', show && !show.dead);
    const partyKey = await page.evaluate(() => { const b = document.querySelector('#ins-panel [data-dir-party]'); return b ? b.getAttribute('data-dir-party') : null; });
    check('the Party row is a door onto the party', !!partyKey, String(partyKey));
    if (partyKey){
      await page.click('#ins-panel [data-dir-party]');
      await page.waitForFunction(k => state.view === 'customers' && !!document.querySelector(`#cu-tbody [data-cu-cust="${k}"].is-landed, #cu-tbody [data-cu-cust="${k}"].is-landed-held`), partyKey, { timeout: 8000 }).catch(() => {});
      const landed = await page.evaluate(k => ({ view: state.view, lit: !!document.querySelector(`#cu-tbody [data-cu-cust="${k}"].is-landed, #cu-tbody [data-cu-cust="${k}"].is-landed-held`),
        chosen: !!document.querySelector(`#cu-tbody [data-cu-cust="${k}"].is-sel`) }), partyKey);
      check('the Party row lands on Parties, that party chosen and lit', landed.view === 'customers' && landed.lit && landed.chosen, JSON.stringify(landed));
    }

    /* ---- THE EDGE, AND THE REFRESH ---- */
    await page.evaluate(w => { setView('counter'); counterAsk(w); }, 'people');
    await page.waitForTimeout(1000);
    const back = await page.evaluate(PAGE);
    check('the rail brings you back to the side you were on', back.tab === 'theirs', back.tab);
    /* RE-POINTED 19 Oct 2026: the drawing draws no A to Z edge; the table pages
       instead ("N of M shown · Show more") */
    const edge = await page.evaluate(() => ({ az: !!document.querySelector('#dir-page .dir-az'), foot: ((document.querySelector('#dir-page .dir-cardfoot') || {}).textContent || '').trim() }));
    /* RE-POINTED 21 Oct 2026 (Part 8): the list head's one foot, "1–12 of N" */
    check('no A to Z edge; the foot says how many are shown', !edge.az && /^1–\d+ of \d+/.test(edge.foot), JSON.stringify(edge));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const kept = await page.evaluate(() => ({ view: state.view, tab: (document.querySelector('#dir-page [role="tab"][data-dir-tab][aria-selected="true"]') || { getAttribute: () => null }).getAttribute('data-dir-tab') }));
    check('a refresh lands on People, on the same side', kept.view === 'directory' && kept.tab === 'theirs', JSON.stringify(kept));

    await ctx.close();

    /* ============ 2. A VIEWER (D-3) ============ */
    const ctxV = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const pv = await ctxV.newPage();
    pv.on('pageerror', e => errors.push('viewer: ' + e.message));
    await signIn(pv, h.base, 'vera@example.co.ke', 'their-own-pass-9');
    const vDoor = await pv.evaluate(() => (caReadPlace('people') || {}).place);
    check('a Viewer has the place too', vDoor === 'people', String(vDoor));
    await pv.evaluate(w => { setView('counter'); counterAsk(w); }, 'people');
    await pv.waitForTimeout(1200);
    await pv.click('#dir-page [role="tab"][data-dir-tab="ours"]');
    await pv.waitForTimeout(600);
    const vp = await pv.evaluate(PAGE);
    check('and gets the whole roster — reading who is here is their level of access', vp.n >= 5, `${vp.n} rows`);
    const vr = await pv.evaluate(() => { const r = [...document.querySelectorAll('#dir-page [data-dir-row]')].find(x => /Vera Reader/.test(x.textContent)); return r ? r.textContent.replace(/\s+/g, ' ').trim() : ''; });
    check('marked on their own row', /Vera Reader \(you\)/.test(vr), vr);
    check('a Viewer is offered no door to Settings', !vp.manage);
    await ctxV.close();

    /* ============ 3. AN ADMIN — one extra line, and the Parties door ======= */
    const ctxA = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const pa = await ctxA.newPage();
    pa.on('pageerror', e => errors.push('admin: ' + e.message));
    await signIn(pa, h.base, 'admin@example.co.ke', 'adminpassword1');
    await pa.evaluate(w => { setView('counter'); counterAsk(w); }, 'people');
    await pa.waitForTimeout(1200);
    const manage = await pa.evaluate(VISIBLE, '#dir-manage');
    check('an admin is pointed at Settings → People', manage.ok, manage.why);
    await pa.click('#dir-manage');
    await pa.waitForTimeout(1400);
    const landedA = await pa.evaluate(() => ({
      view: state.view, tab: typeof settingsTab === 'function' ? settingsTab() : null,
      roster: document.querySelectorAll('.st-person').length,
      /* the People table is on the Company board since 16 Oct 2026 (the
         Control Room), and a door that names People jumps down to it */
      inView: (() => { const el = document.getElementById('st-people-sec'); if (!el) return false;
        const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })(),
    }));
    check('and the line is a real door — it lands on the editable roster',
      landedA.view === 'team' && landedA.tab === 'company' && landedA.roster > 0 && landedA.inView, JSON.stringify(landedA));
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
      /* RE-POINTED 19 Oct 2026 (round 19 as drawn): "People at <party>", a row
         each; pressing one lands on People with that person chosen and lit */
      const sec = await pa.evaluate(() => { const s = document.querySelector('#ins-panel .cu-people'); return s ? { head: (s.querySelector('h3') || {}).textContent || '', rows: s.querySelectorAll('[data-cu-pp]').length } : null; });
      check('its panel names the people at the party, the number on its head the rows under it', !!sec && sec.rows === party.n && sec.head.includes(String(party.n)), JSON.stringify(sec));
      const who = await pa.evaluate(() => (document.querySelector('#ins-panel [data-cu-pp]') || {}).getAttribute('data-cu-pp'));
      await pa.click('#ins-panel [data-cu-pp]');
      await pa.waitForFunction(k => state.view === 'directory' && !!document.querySelector('#dir-tbody tr.is-sel'), who, { timeout: 8000 }).catch(() => {});
      const here = await pa.evaluate(() => { const r = document.querySelector('#dir-tbody tr.is-sel'); return { view: state.view, sel: r ? r.getAttribute('data-dir-row') : null, lit: !!(r && r.classList.contains('is-landed')) }; });
      check('and a row lands on People with that person chosen and lit', here.view === 'directory' && here.sel === who && here.lit, JSON.stringify(here));
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
