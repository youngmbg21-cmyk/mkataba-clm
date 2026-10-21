/* SETTINGS AS DRAWN, THE THIRD PASS (rounds 24, 25 and 26; the checker's
   differences against the owner's picked drawings after main moved on,
   built 19 Oct 2026; js/views/settings.js, js/clashkeys.js, index.html,
   server clashWatch / clashSeenRefresh)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 THE FRAME at the owner's three screens: the page's head is a card in
       the LEFT column (Settings · <company>, You · Company under it; a
       member's "Your settings" with Ask an admin), Jambo's panel the whole
       RIGHT column from under the bar to the window's foot, beside the head;
       his ask box whole in the window and never covered, at the top of the
       page and at its end; no sideways scroll
     2 every card door opens its PAGE with ‹ Settings (the one drawer, docked);
       ‹ Settings goes back and lands on the door that was pressed
     3 the cards' facts: "Signing limits · On, N people capped"; Jambo's day
       limit in calls, never money
     4 Jambo's first words are the drawing's, nothing after them
     5 Ready to delete → Review: the stream's Keeping tab with the contracts
       listed, landed on
     6 a stream's side panel: its acts on one row; a held contract's Open
       lands ON Release hold in the contract's Menu
     7 Data & backup: the chip "download Q3 as a PDF"; Downloads so far's Who
       in plain weight; the Menu's "Data & backup" opens The trail
     8 a clash made by a write is stamped by the server itself ("since")
     9 a member's sheet: back at the top the first heading is lit; devices said
       once with their count; the away card by first name, its days as drawn;
       quiet closed dropdowns (28px, a hairline edge, a thin chevron)
    10 no page errors
   At the parent (72f59b7, the lane before this pass) every check fails but
   the no-sideways-scroll halves of 1 and 10 (walls, held here).
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/settings-as-drawn-3-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const old = (id, name, cp, extra) => ({ ...H.fixtureContract(id, name, cp, 'sales', 1200000, 'Signed'), ...extra });
  const w = await H.seedWorkspace(h, { approvalRules: [], contracts: H.FIXTURES.concat([
    old('MK-S1', 'Distribution agreement', 'Skane Retail Ltd', { expiry: '2015-03-31' }),
    old('MK-S2', 'Agency agreement', 'Norrland Trade Ltd', { expiry: '2015-06-30' }),
    old('MK-S3', 'Settlement agreement', 'Vastkust Retail Ltd', { expiry: '2014-11-30', hold: { at: '2026-09-02T09:00:00.000Z', by: 'Amina Otieno', why: 'A dispute' } }),
  ]) });
  await w.admin.json('/api/keeping/sales', { method: 'PUT', body: { years: 10, then: 'delete' } }).catch(() => null);
  const boot = await w.admin.json('/api/bootstrap');
  const adminId = boot.me.id, R = w.users.restricted.id, U = w.users.unrestricted.id, N = w.users.novalues.id;
  await w.admin.json('/api/settings', { method: 'PUT', body: { ...(boot.settings || {}), signCap: { on: true } } });
  await w.admin.json('/api/users/' + U, { method: 'PATCH', body: { signCap: 5000000 } });
  await w.admin.json('/api/users/' + N, { method: 'PATCH', body: { signCap: 2000000 } });
  /* the clash, made by a write — nobody has Settings open */
  await w.admin.json('/api/users/' + R, { method: 'PATCH', body: { signCap: 10000000, overseerOn: 'always', overseerId: U, overseerBackupId: adminId } });
  await w.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: adminId, from: day(0), to: day(5) } }).catch(() => null);
  try { await w.admin.raw('/api/trail/export?from=2026-07-01&to=2026-09-30&as=pdf'); } catch (_) {}
  /* 8 · the server stamps the clash on its own, before any page asks */
  let stamped = null;
  for (let i = 0; i < 30 && !stamped; i++){ const b = await w.admin.json('/api/bootstrap'); stamped = (b.clashSeen || {})['clash:cap:' + R] || null; if (!stamped) await new Promise(r => setTimeout(r, 200)); }

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (email, pass, W = 1440, HH = 780) => {
    const ctx = await browser.newContext({ viewport: { width: W, height: HH } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts), null, { timeout: 20000 });
    return page;
  };
  const kit = page => {
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; }
      try { await page.locator(sel).first().click({ timeout: 4000 }); } catch (e) { check(what + ' (could not be pressed: ' + sel + ')', false, e.message.split('\n')[0]); return false; } return true; };
    const company = () => until(() => { if (!document.getElementById('set-page')) { setView('team'); return null; }
      if (settingsTab() !== 'company' || document.querySelector('#set-page[data-st-sub]')) { settingsGoTab('company'); try { settingsGoPage(''); } catch (_) {} return null; }
      return document.querySelector('#st-board .st-cards') && document.querySelector('#st-att') ? true : null; }, null, 15000);
    return { until, press, company };
  };
  /* the frame, read: head card, panel, ask box (whole, not covered), panel head (not covered) */
  const frame = page => page.evaluate(() => {
    const r = s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
    const bar = document.querySelector('#dk-back') ? Math.round(document.querySelector('#content-scroll').getBoundingClientRect().top) : null;
    const ask = document.getElementById('st-jb-form'), hd = document.getElementById('st-side-head');
    const hit = (el, sel) => { if (!el) return false; const q = el.getBoundingClientRect(); const x = q.left + 30, y = q.top + q.height / 2; const e = document.elementFromPoint(x, y); return !!(e && e.closest(sel)); };
    const sc = document.getElementById('content-scroll');
    return { head: r('#st-headcard'), side: r('#st-side'), ask: r('#st-jb-form'), scTop: bar, H: innerHeight, W: innerWidth,
      askSeen: hit(ask, '#st-jb-form'), headSeen: hit(hd, '#st-side'), winHead: getComputedStyle(document.getElementById('page-head')).display,
      sideways: document.documentElement.scrollWidth > innerWidth + 1 || (sc && sc.scrollWidth > sc.clientWidth + 1) };
  });
  try {
    console.log('\n1 · the frame, at the owner\'s three screens');
    for (const [W, HH] of [[1440, 780], [1536, 730], [1366, 950]]) {
      const p = await open('admin@example.co.ke', 'adminpassword1', W, HH); const k = kit(p);
      await k.company(); await p.waitForTimeout(500);
      const f0 = await frame(p);
      const tabs = await p.evaluate(() => [...document.querySelectorAll('#st-headcard .st-faces [data-st-tab]')].map(t => t.getAttribute('data-st-tab')).join(','));
      check(`1a ${W}×${HH}: the head is a card in the left column, its tabs inside`, !!f0.head && !!f0.side && f0.head.r <= f0.side.l && tabs === 'you,company' && f0.winHead === 'none',
        JSON.stringify({ head: f0.head, side: f0.side && f0.side.l, tabs, win: f0.winHead }));
      check(`1b ${W}×${HH}: Jambo's panel is the whole right column, from under the bar to the foot`, !!f0.side && !!f0.head && Math.abs(f0.side.t - f0.scTop) <= 1 && Math.abs(f0.side.b - f0.H) <= 1 && f0.side.t <= f0.head.t,
        f0.side && `${Math.round(f0.side.t)}→${Math.round(f0.side.b)} (bar ${f0.scTop}, window ${f0.H}, head ${f0.head ? Math.round(f0.head.t) : 'none'})`);
      check(`1c ${W}×${HH}: his ask box whole and seen at the top`, !!f0.ask && f0.ask.b <= f0.H + 0.5 && f0.askSeen && f0.headSeen, f0.ask && `ask ${Math.round(f0.ask.t)}→${Math.round(f0.ask.b)} seen ${f0.askSeen} head ${f0.headSeen}`);
      await shot(p, `25-company-frame-${W}x${HH}`);
      await p.evaluate(() => { document.getElementById('content-scroll').scrollTop = 1e6; }); await p.waitForTimeout(400);
      const f1 = await frame(p);
      check(`1d ${W}×${HH}: scrolled to the end, the panel stays whole and uncovered`, !!f1.side && !!f1.ask && Math.abs(f1.side.t - f1.scTop) <= 1 && f1.ask.b <= f1.H + 0.5 && f1.askSeen && f1.headSeen,
        f1.side && `side ${Math.round(f1.side.t)}→${Math.round(f1.side.b)} ask ${f1.askSeen} head ${f1.headSeen}`);
      check(`1e ${W}×${HH}: no sideways scroll`, !f0.sideways && !f1.sideways);
      await p.context().close();
    }
    const mem0 = await open('everything@example.co.ke', 'their-own-pass-9');
    const m0 = kit(mem0);
    const mh = await m0.until(() => { if (!document.getElementById('set-page')) { setView('team'); return null; }
      const c = document.getElementById('st-headcard'), s = document.getElementById('st-side'); if (!c || !s) return null;
      return { t: (c.querySelector('.st-hc-t') || {}).textContent, sub: (c.querySelector('[data-st-head-sub]') || {}).textContent, ask: !!c.querySelector('[data-st-ask-head]'), right: c.getBoundingClientRect().right <= s.getBoundingClientRect().left }; }, null, 15000);
    check('1f a member\'s head card: "Your settings · yours alone — nobody else sees them" with Ask an admin, beside Jambo', !!mh && mh.t === 'Your settings' && /yours alone/.test(mh.sub || '') && mh.ask && mh.right, JSON.stringify(mh));
    await mem0.context().close();

    const page = await open('admin@example.co.ke', 'adminpassword1');
    const { until, press, company } = kit(page);
    await company();

    console.log('\n2 · every card door opens its page with ‹ Settings');
    /* every door on a card (and the ladder's) — a page door, a panel's door */
    const doors = await page.evaluate(() => [...document.querySelectorAll('#set-page [data-st-card] .st-door')].map(d => ({ attr: d.hasAttribute('data-st-page') ? 'data-st-page' : 'data-st-panel',
      k: d.getAttribute('data-st-page') != null ? d.getAttribute('data-st-page') : d.getAttribute('data-st-panel'), card: d.closest('[data-st-card]').getAttribute('data-st-card'), t: d.textContent.trim() })));
    const bad = [];
    for (const d of doors) {
      /* a build that opens a drawer over the board is put back each time, so
         one door's answer never blocks the next press */
      await page.evaluate(() => { try { if (document.querySelector('body > #st-drawer.open') && typeof stDrawerClose === 'function') stDrawerClose(); } catch (_) {} });
      await company();
      await page.evaluate(sel => { const b = document.querySelector(sel); if (b) b.click(); }, `#set-page [data-st-card="${d.card}"] .st-door[${d.attr}="${d.k}"]`);
      /* a page at its own name with ‹ Settings: a page of its own, or the
         panel's drawer docked in the page — never a drawer over the board */
      const ok = await until(() => { const pg = document.querySelector('#set-page[data-st-sub]'), sub = pg && pg.getAttribute('data-st-sub');
        const dr = document.querySelector('#st-dock > #st-drawer.is-docked.open'), over = document.querySelector('body > #st-drawer.open');
        const back = document.querySelector('#set-page .st-pg-back');
        return pg && back && /Settings/.test(back.textContent) && !over && (sub !== 'panel' || dr) ? true : null; }, null, 4000);
      if (!ok) bad.push(d.t);
    }
    check(`2a ${doors.length} card doors each open their page with ‹ Settings, no drawer over the board`, doors.length >= 20 && !bad.length, bad.join(' | ') || doors.map(d => d.t).join(' | '));
    check('2b Jambo\'s agents is among them', doors.some(d => d.k === 'agents'), doors.map(d => d.k).join(','));
    await company();
    if (await press('#set-page [data-st-card="signing"] .st-door[data-st-panel="limits"]', '2c Everyone\'s signing limits ›')) {
      await until(() => document.querySelector('#st-dock #st-drawer.is-docked'));
      await shot(page, '25-door-page-1440x780');
      await press('#set-page .st-pg-back', '‹ Settings');
      const back = await until(() => { const l = document.querySelector('.is-landed'); return !document.querySelector('#set-page[data-st-sub]') && l ? { k: l.getAttribute('data-st-panel'), door: l.classList.contains('st-door'), hidden: document.getElementById('st-drawer').hidden } : null; });
      check('2c ‹ Settings goes back and lands on the door that was pressed; the drawer is put away', !!back && back.k === 'limits' && back.door && back.hidden, JSON.stringify(back));
    }

    console.log('\n3 · the cards\' facts');
    await company();
    const facts = await until(() => { const s = [...document.querySelectorAll('[data-st-card="signing"] .st-fact')].map(f => f.textContent.replace(/\s+/g, ' ').trim()), j = [...document.querySelectorAll('[data-st-card="copilot"] .st-fact')].map(f => f.textContent.replace(/\s+/g, ' ').trim());
      return s.length && j.length ? { s, j } : null; });
    check('3a "Signing limits · On, N people capped"', !!facts && facts.s.some(f => /^Signing limits ?On, \d+ (people|person) capped$/.test(f)), facts && JSON.stringify(facts.s));
    check('3b Jambo\'s day limit in calls, never money', !!facts && facts.j.some(f => /calls a day at most$/.test(f)) && !facts.j.some(f => /\$|KES|SEK/.test(f)), facts && JSON.stringify(facts.j));

    console.log('\n4 · his first words');
    const hello = await until(() => { const b = document.querySelector('#st-jb-feed [data-st-jb-hello] .st-jb-bub'); return b && /need/.test(b.textContent) ? b.textContent.trim() : null; });
    check('4a they end with "Each row’s button opens what settles it." — nothing after', !!hello && /Each row’s button opens what settles it\.$/.test(hello) && !/warns|nothing is blocked/.test(hello), hello);

    console.log('\n5 · Ready to delete → Review');
    if (await press('#st-att .st-need[data-st-need^="keep:"] .st-need-go', '5a Review')) {
      /* THE WAIT ASKS FOR THE WHOLE STATE (19 Oct 2026): the lander tries again
         every LAND_WAIT, so the list can be painted a beat before its light is
         on (measured: rows at 79 ms, lit at 163 ms); a read inside that beat
         said "not landed" on GitHub's runner. Wait for the rows AND the light,
         bounded; when the clock runs out, report what stood there. */
      const kpRead = () => { const d = document.getElementById('st-kp-due'); const rows = d ? d.querySelectorAll('tr[data-st-kp-row]').length : 0;
        return d && rows ? { rows, landed: d.classList.contains('is-landed'), tab: (document.querySelector('.st-ps-tab.is-on') || {}).textContent } : null; };
      await until(() => { const d = document.getElementById('st-kp-due');
        return d && d.querySelector('tr[data-st-kp-row]') && d.classList.contains('is-landed') ? true : null; }, null, 8000);
      const kp = await page.evaluate(kpRead);
      check('5a the Keeping tab, the contracts listed, landed on', !!kp && kp.rows === 2 && kp.landed, JSON.stringify(kp));
      await shot(page, '25-review-keeping-1440x780');
      await press('#st-dfoot [data-st-dclose]', 'close'); await until(() => !document.querySelector('#st-drawer.open'));
    }

    console.log('\n6 · a stream beside its list');
    await page.evaluate(() => settingsGoPage('streams'));
    await until(() => document.querySelector('.st-sw-row[data-st-sw-pick="sales"]'));
    if (await press('.st-sw-row[data-st-sw-pick="sales"]', '6a Sales')) {
      const acts = await until(() => { const a = document.querySelector('#st-jb-feed .st-swp-acts'); if (!a) return null; const b = [...a.querySelectorAll('button')].map(x => x.getBoundingClientRect());
        return b.length >= 3 ? { tops: [...new Set(b.map(x => Math.round(x.top)))], right: Math.round(b[b.length - 1].right), feed: Math.round(document.getElementById('st-jb-feed').getBoundingClientRect().right) } : null; });
      check('6a Delete these N · Change keeping · Close, on one row', !!acts && acts.tops.length === 1 && acts.right <= acts.feed, JSON.stringify(acts));
    }
    if (await press('#st-jb-feed [data-st-swp-open]', '6b the held contract\'s Open')) {
      /* RE-POINTED 21 Oct 2026 (the Dossier, 20 Oct): the Menu tab folded into the Dossier's All acts */
      const held = await until(() => { const r = document.querySelector('#ig-dock .pd-nx[data-pd-menu="MK-S3"] #ws-hold');
        return state.view === 'dashboard' && r && r.classList.contains('is-landed') && r.getBoundingClientRect().height > 0 ? r.textContent.trim() : null; }, null, 10000);
      check('6b it lands ON Release hold, in the contract\'s Menu beside its paper', !!held, String(held));
      await shot(page, '26-held-open-1440x780');
    }

    console.log('\n7 · Data & backup');
    await company();
    await page.evaluate(() => settingsGoPage('data'));
    const dt = await until(() => { const c = document.querySelector('#st-jb-feed [data-st-tr-pdf]'), w0 = document.querySelector('.st-tr-tb .st-ps-who');
      return c && w0 ? { chip: c.textContent.trim(), who: getComputedStyle(w0).fontWeight } : null; }, null, 10000);
    check('7a "download Q3 as a PDF"', !!dt && /^download Q\d as a PDF$/.test(dt.chip), dt && dt.chip);
    check('7b Downloads so far: Who in plain weight', !!dt && Number(dt.who) <= 400, dt && dt.who);
    await company();
    await page.evaluate(() => stDrawerOpen('backup'));
    const menuTab = await until(() => { const on = document.querySelector('[data-st-pg="data"] [data-st-bk-tab].is-on'); return on ? on.getAttribute('data-st-bk-tab') : null; });
    check('7c the Menu\'s "Data & backup" opens The trail, as the card\'s door does', menuTab === 'trail', String(menuTab));

    console.log('\n8 · a clash made by a write, stamped by the server');
    check('8a the server stamped it with no page open', !!stamped, String(stamped));
    await company();
    const since = await until(() => { const s = document.querySelector('#st-att .st-need[data-st-need^="clash:cap:"] .st-need-s'); return s && /since/.test(s.textContent) ? s.textContent.trim() : null; });
    check('8b its row says since when', !!since, since);

    console.log('\n9 · a member\'s sheet');
    const mem = await open('everything@example.co.ke', 'their-own-pass-9');
    const mk = kit(mem);
    await mk.until(() => { if (!document.getElementById('set-page')) { setView('team'); return null; } return document.querySelector('#set-page [data-st-toc]'); }, null, 15000);
    await mem.evaluate(() => { const sc = document.getElementById('content-scroll'); sc.scrollTop = 600; }); await mem.waitForTimeout(400);
    await mem.evaluate(() => { document.getElementById('content-scroll').scrollTop = 0; }); await mem.waitForTimeout(400);
    const top = await mem.evaluate(() => { const a = document.querySelector('#set-page [data-st-toc][aria-current="true"]'), f = document.querySelector('#set-page [data-st-toc]'); return { lit: a && a.textContent.trim(), first: f && f.textContent.trim() }; });
    check('9a back at the very top, the first heading is lit', top.lit && top.lit === top.first, JSON.stringify(top));
    const dev = await mem.evaluate(() => { const r = [...document.querySelectorAll('.st-sr')].find(x => /signed in/.test(x.textContent)); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('9b devices said once with their count', !!dev && /signed in — this computer/.test(dev) && !/a computer[\s\S]*a computer/.test(dev), dev);
    const away = await mem.evaluate(() => { const c = document.querySelector('[data-st-you-card="away"] .st-srows'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('9c the away card: the stand-in named whole once, then by first name, its days with their weekday', !!away && /from \w{3} \d{1,2} \w{3} to \w{3} \d{1,2} \w{3}\./.test(away) && /Each thing Amina answers says “for Unrestricted”/.test(away), away);
    const sel = await mem.evaluate(() => { const s = document.querySelector('#set-page select[data-st-brief]'); if (!s) return null; const c = getComputedStyle(s);
      const probe = document.createElement('div'); probe.style.color = 'var(--btn-edge)'; document.body.appendChild(probe); const edge = getComputedStyle(probe).color; probe.remove();
      return { h: Math.round(s.getBoundingClientRect().height), border: c.borderTopColor, edge, thin: /calc\(50% - 0\.8px\)/.test(c.backgroundImage) }; });
    check('9d a quiet closed dropdown: 28px, the hairline edge, a thin chevron', !!sel && Math.abs(sel.h - 28) <= 1 && sel.border === sel.edge && sel.thin, JSON.stringify(sel));
    await shot(mem, '24-you-member-1440x780');
  } catch (e) { check('the run itself', false, e.stack); }
  finally {
    console.log('\n10 · no page errors');
    check('10 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${failures ? failures + ' FAILED' : 'ALL PASS'}`);
    process.exit(failures ? 1 : 0);
  }
})();
