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
/* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): People is drawn as round 6 drew it (dirnRender): ONE
   table (#dir-tbody tr[data-dir-row]) — the name (.cun-name), what differs under it (.cun-sub: a title, their party,
   "you"), then Role · Does for you · Waiting · Reach (td.cun-wait); RE-POINTED (P-26, owner's pick 20 Nov 2026: People
   the Legora + Stripe way): Role · Does for you · Agreements · Waiting on them, no Reach (Phone) column; tabs All · Yours · Outside · Waiting
   ([data-dirn-tab], the lit one .is-on); the chosen person's panel is Jambo's five parts (.jov5: the name as the
   headline .jov5-title; Email them [data-dirn-mail] and Show their contracts [data-dirn-contracts] as rows). No
   address rides a row: Email is the panel's door (PILL TO ACT, the harmony review). */
const PAGE = () => {
  const cards = [...document.querySelectorAll('#dir-page #dir-tbody tr[data-dir-row]')];
  const txt = (el, sel) => { const x = el.querySelector(sel); return x ? x.textContent.replace(/\s+/g, ' ').trim() : ''; };
  const side = document.querySelector('#dir-page [data-dirn-tab].is-on');
  const tabs = [...document.querySelectorAll('#dir-page [data-dirn-tab]')].map(t => ({ k: t.getAttribute('data-dirn-tab'), n: Number((t.querySelector('span') || {}).textContent || NaN) }));
  const P = document.getElementById('ins-panel');
  const door = (sel) => { const b = P && P.querySelector(sel); return b ? { t: b.textContent.replace(/\s+/g, ' ').trim(), dead: !!b.disabled } : null; };
  return {
    n: cards.length,
    names: cards.map(c => txt(c, '.cun-name')),
    /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): the Role cell is the second cell, a
       soft badge (.reg-badge); td.cun-wait is now only the Waiting on them cell */
    roles: cards.map(c => { const td = c.children[1]; const b = td && td.querySelector('.reg-badge'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : ''; }),
    subs: cards.map(c => txt(c, '.cun-sub')),
    rowLinks: cards.reduce((n, c) => n + c.querySelectorAll('a').length, 0),
    words: (document.getElementById('dir-page') || {}).textContent || '',
    manage: !!document.getElementById('dir-manage'),
    tab: side ? side.getAttribute('data-dirn-tab') : null,
    tabs,
    foot: ((document.querySelector('#dir-page .apn-foot') || {}).textContent || '').trim(),
    links: [...document.querySelectorAll('#dir-page a')].map(a => a.getAttribute('href')),
    panel: { id: P && P.getAttribute ? P.getAttribute('data-ins-id') : null,
      name: P ? txt(P, '.jov5-title') : '',
      mail: door('[data-dirn-mail]'), contracts: door('.jov5-group [data-dirn-contracts]') || door('[data-dirn-contracts]') },
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
    const settingsDoor = await page.evaluate(() => { const ok = (caReadPlace('settings') || {}).place === 'settings'; if (ok){ setView('counter'); ((t) => { const a = typeof jamboPageWordOf === 'function' && jamboPageWordOf(t); return a ? caGo(a) : caAskAnywhere(t, { all: true }); })('settings'); } return { ok, why: ok ? 'opened by "settings"' : 'not a place' }; });
    await page.waitForTimeout(800);
    const theirFace = await page.evaluate(() => (typeof settingsTab === 'function') ? settingsTab() : '');
    check('Settings is theirs too, and it opens on their own settings — which is why the roster lives here',
      settingsDoor.ok && theirFace === 'you', settingsDoor.why + ' · ' + theirFace);

    /* PRESSED, not called. */
    await page.evaluate(w => { setView('counter'); ((t) => { const a = typeof jamboPageWordOf === 'function' && jamboPageWordOf(t); return a ? caGo(a) : caAskAnywhere(t, { all: true }); })(w); }, 'people');
    await page.waitForTimeout(1200);
    const card = await page.evaluate(VISIBLE, '#dir-page .apn-card #dir-tbody');
    check('pressing it lands on a page with the table on it', card.ok, card.why);
    const firstFace = await page.evaluate(VISIBLE, '#dir-page #dir-tbody tr[data-dir-row]');
    check('and a person is a painted row of the table', firstFace.ok, firstFace.why);

    const all = await page.evaluate(PAGE);
    const boot = await W.restricted.json('/api/bootstrap');
    check('the tabs open on Everyone', all.tab === 'all', all.tab);
    /* RE-POINTED 17 Nov 2026 (#762): the sides are Yours and Outside (Waiting on them picks from both, it is no side) */
    const sum = all.tabs.filter(t => t.k === 'yours' || t.k === 'outside').reduce((s, t) => s + t.n, 0);
    check('the three sides add up to Everyone, and Everyone is the cards on the wall',
      sum === all.n && (all.tabs.find(t => t.k === 'all') || {}).n === all.n, JSON.stringify(all.tabs) + ' vs ' + all.n);

    /* ---- OUR PEOPLE: the roster, the reader first ---- */
    await page.click('#dir-page [data-dirn-tab="yours"]');
    await page.waitForTimeout(700);
    const p = await page.evaluate(PAGE);
    check('Our people is every colleague', p.n === boot.users.length, `${p.n} rows for ${boot.users.length} people`);
    const ai = p.names.findIndex(n => /Amina Otieno/.test(n));
    check('the reader first, then by name; the admin\'s row says Admin', /Restricted Legal/.test(p.names[0]) && ai > 0 && /Admin/i.test(p.roles[ai]), `${p.names[0]} · ${p.names[ai]} ${p.roles[ai]}`);
    /* (Part 8) the address rides the name's hover; the chosen person's panel carries it as the link */
    /* RE-POINTED 17 Nov 2026 (#762): no address rides a row (PILL TO ACT: Email is the panel's door); every colleague has
       an address on the record, and the chosen person's panel carries Email them, which writes to it */
    const mailsOk = await page.evaluate(() => dirBook().filter(x => x.side === 'ours').every(x => /@/.test(x.email || '')));
    check('each row carries its address, and the panel\'s address is a mailto, so the wall can be acted on',
      mailsOk && p.rowLinks === 0 && !!p.panel.mail, JSON.stringify({ mailsOk, rowLinks: p.rowLinks, panelMail: p.panel.mail }));
    check('a job title an admin set is printed', /Commercial Counsel/.test(p.words));
    /* RE-POINTED 17 Nov 2026 (#762): the page draws no link at all now (the address is the panel's Email door) */
    check('and the only links on the page are addresses', p.links.every(l => l.startsWith('mailto:')) && !!p.panel.mail, `${p.links.length} links`);

    /* ---- THE ABSENCE, AS PIXELS ---- */
    const leaks = ['Sales & Route', 'signing limit', 'Signing limit', 'reviewed by'].filter(w => p.words.includes(w));
    check('nothing on the page names a limit or a review', leaks.length === 0, leaks.join(' | ') || 'clean');
    check('a non-admin is offered no door to Settings, because they have none', !p.manage);

    /* ---- THEIR PEOPLE: the other side, with their party ---- */
    await page.click('#dir-page [data-dirn-tab="outside"]');
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
    /* RE-POINTED 17 Nov 2026 (#762): the five parts' "Reach them" rows — Email them · Show their contracts */
    const pan = (await page.evaluate(PAGE)).panel;
    const show = pan.contracts;
    check('the panel offers Show their contracts and Email, as drawn', !!show && !!pan.mail, JSON.stringify(pan));
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
    await page.evaluate(w => { setView('counter'); ((t) => { const a = typeof jamboPageWordOf === 'function' && jamboPageWordOf(t); return a ? caGo(a) : caAskAnywhere(t, { all: true }); })(w); }, 'people');
    await page.waitForTimeout(1000);
    const back = await page.evaluate(PAGE);
    check('the rail brings you back to the side you were on', back.tab === 'outside', back.tab);
    /* RE-POINTED 19 Oct 2026: the drawing draws no A to Z edge; the table pages
       instead ("N of M shown · Show more") */
    /* RE-POINTED 17 Nov 2026 (#762): the new look's table does not page; its foot says how many people the list holds,
       the All tab's own number */
    const edge = await page.evaluate(() => ({ az: !!document.querySelector('#dir-page .dir-az'), foot: ((document.querySelector('#dir-page .apn-foot') || {}).textContent || '').trim(),
      all: Number((document.querySelector('#dir-page [data-dirn-tab="all"] span') || {}).textContent || NaN) }));
    /* RE-POINTED 21 Nov 2026 (P-26, as drawn): the drawing has no foot line under the table — the chips say how many
       (All N); the rule kept is that the All chip's number is the rows the page holds (no cap, nothing trimmed) */
    const rowsAll = await page.evaluate(() => { const b = document.querySelector('#dir-page [data-dirn-tab="all"]'); if (b) b.click(); return new Promise(r => setTimeout(() => r(document.querySelectorAll('#dir-page #dir-tbody tr[data-dir-row]').length), 500)); });
    check('no A to Z edge, no foot line; the All chip counts every row', !edge.az && !edge.foot && edge.all === rowsAll, JSON.stringify(Object.assign({ rowsAll }, edge)));
    await page.evaluate(() => { const b = document.querySelector('#dir-page [data-dirn-tab="outside"]'); if (b) b.click(); });
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const kept = await page.evaluate(() => ({ view: state.view, tab: (document.querySelector('#dir-page [data-dirn-tab].is-on') || { getAttribute: () => null }).getAttribute('data-dirn-tab') }));
    check('a refresh lands on People, on the same side', kept.view === 'directory' && kept.tab === 'outside', JSON.stringify(kept));

    await ctx.close();

    /* ============ 2. A VIEWER (D-3) ============ */
    const ctxV = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const pv = await ctxV.newPage();
    pv.on('pageerror', e => errors.push('viewer: ' + e.message));
    await signIn(pv, h.base, 'vera@example.co.ke', 'their-own-pass-9');
    const vDoor = await pv.evaluate(() => (caReadPlace('people') || {}).place);
    check('a Viewer has the place too', vDoor === 'people', String(vDoor));
    await pv.evaluate(w => { setView('counter'); ((t) => { const a = typeof jamboPageWordOf === 'function' && jamboPageWordOf(t); return a ? caGo(a) : caAskAnywhere(t, { all: true }); })(w); }, 'people');
    await pv.waitForTimeout(1200);
    await pv.click('#dir-page [data-dirn-tab="yours"]');
    await pv.waitForTimeout(600);
    const vp = await pv.evaluate(PAGE);
    check('and gets the whole roster — reading who is here is their level of access', vp.n >= 5, `${vp.n} rows`);
    const vr = await pv.evaluate(() => { const r = [...document.querySelectorAll('#dir-page [data-dir-row]')].find(x => /Vera Reader/.test(x.textContent)); return r ? r.textContent.replace(/\s+/g, ' ').trim() : ''; });
    /* RE-POINTED 17 Nov 2026 (#762): "you" is said under the name (.cun-sub), not in brackets */
    const vrSub = await pv.evaluate(() => { const r = [...document.querySelectorAll('#dir-page [data-dir-row]')].find(x => /Vera Reader/.test(x.textContent)); const s = r && r.querySelector('.cun-sub'); return s ? s.textContent.trim() : ''; });
    check('marked on their own row', /Vera Reader/.test(vr) && /(^|· )you$/i.test(vrSub), vr + ' | ' + vrSub);
    check('a Viewer is offered no door to Settings', !vp.manage);
    await ctxV.close();

    /* ============ 3. AN ADMIN — one extra line, and the Parties door ======= */
    const ctxA = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const pa = await ctxA.newPage();
    pa.on('pageerror', e => errors.push('admin: ' + e.message));
    await signIn(pa, h.base, 'admin@example.co.ke', 'adminpassword1');
    await pa.evaluate(w => { setView('counter'); ((t) => { const a = typeof jamboPageWordOf === 'function' && jamboPageWordOf(t); return a ? caGo(a) : caAskAnywhere(t, { all: true }); })(w); }, 'people');
    await pa.waitForTimeout(1200);
    /* RETIRED 17 Nov 2026 (#762, owner's ruling, round 3): People's door for an admin to the editable roster
       ("Manage people in Settings ›", #dir-manage) stays gone in the new look — Settings' own list holds People & roles.
       The three checks on it (the line, its landing, the drawer behind it) are retired. */
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
      /* RETIRED 17 Nov 2026 (#762, owner's ruling, round 3): a party's "People at <party>" rows on the Parties panel,
         each landing on People with that person lit, stay gone in the new look (the two checks on them retired). */
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
