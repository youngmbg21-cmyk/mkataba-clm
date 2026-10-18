/* Chromium verification: A PUT-AWAY BELONGS TO THE SUBJECT IT PUT AWAY
   (Young, 27 Sep 2026: "Once you put an item away on 'Prepared for you', it
   never comes back, even for the same contract's renewal next year.")
   ====================================================================
   f274 section 11 pins the reading. This file walks the owner's own case on
   the REAL app, with the browser's clock moved the way a year really passes:

   1. MAY 2027. Two signed agreements end in June 2027 and both renewals are
      prepared on Home. The reader presses Put away all, and the stamps go
      to the server and come back with the page.
   2. THREE WEEKS LATER, the same renewals: both stay away — the desk is a
      stack prepared once, not a queue that nags (the CONTROL).
   3. MAY 2028. One of them was renewed by a signed renewal to June 2028. Its
      renewal is back on Home's Prepared for you and on the Copilot's work
      page; the one whose term did not move stays away; and putting the new
      one away works and names this year's renewal.

   THE CLOCK IS THE BROWSER'S (page.clock.setFixedTime): Date moves, timers
   keep running, and the server keeps its own time. THE BOOK IS STAGED
   THROUGH THE PRODUCT'S OWN SAVE (persist), so every record — the renewal
   agreement included — is on the server and comes back with each reload.
   The renewal is a SIGNED CHILD AGREEMENT because a signed record's own term
   cannot be edited (EXECUTED_IMMUTABLE): only a signed amendment or renewal
   moves it, and effectiveExpiry is the one reading of that.

   RE-POINTED 28 Sep 2026 (Young: "lets add just this part to the home page
   and discard the current 2 cards"): Home's Prepared for you and its Put
   away / Put away all are gone. "On Home" now means the Renewals row of
   Home's Prepared by Copilot card; the put-away is Copilot's work's own
   (agRunAct(key, 'away'), the press its "Put away" button makes), which is
   now the one place a desk row is put away.

   Every claim is GATED on the thing it measures being on the page, so a
   build without the feature REPORTS its failures rather than timing out.
   AT THE PARENT (8f330c7) 3a, 3b, 3c and 3e FAIL: the stamp names the kind,
   never which renewal, so the renewed contract stays away for good. The
   stage lines, 1*, 2*, 3d and the page-error sweep pass on both sides.

   Run: node test/chromium/desk-comes-back-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'desk-comes-back');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* The two agreements. No notice period is recorded, so no letter can be
   drafted and each renewal is prepared as a renewal row (a letter would lead
   instead, and it is f274 section 11 that pins the letter). */
const R = 'MK-9701', Q = 'MK-9702', KID = 'MK-9703';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && (await sample.isChecked())) await sample.uncheck();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }

    /* Move to a day, boot the app on it, and land on Home. */
    const at = async iso => {
      await page.clock.setFixedTime(new Date(iso + 'T09:00:00'));
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);
      await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(() => setView('dashboard'));
      await page.waitForTimeout(900);
    };
    /* What the reader can see, read off the page. */
    const look = () => page.evaluate(ids => {
      /* Home's card draws a Renewals row while that agent holds anything; its
         items are Copilot's work's own list. */
      const onHome = !!document.querySelector('[data-hm-agent-row="renew"]');
      const rows = onHome && typeof agentsData === 'function'
        ? agentsData().agents.renew.ready.map(x => x.cid + ':' + x.kind) : [];
      const items = (typeof deskItems === 'function' ? deskItems() : []).map(x => x.cid + ':' + x.kind);
      const stamp = id => { const c = getContract(id); const v = c && c.desk && c.desk.renewal; return v == null ? null : v; };
      return { today: new Date().toISOString().slice(0, 10), rows, items,
        stamps: Object.fromEntries(ids.map(id => [id, stamp(id)])) };
    }, [R, Q]);
    /* COPILOT'S WORK LIVES ON THE BOARD (Young, 7 Oct 2026, "Below the card"):
       the renewals agent's work is opened below the Prepared card. */
    const agents = async () => {
      const can = await page.evaluate(() => typeof hbOpenAgent === 'function');
      if (!can) return null;
      await page.evaluate(() => hbOpenAgent('renew')); await page.waitForTimeout(1200);
      return page.evaluate(() => [...document.querySelectorAll('[data-hb-ag-item]')]
        .map(b => b.getAttribute('data-hb-ag-item')));
    };

    /* ---- the stage: May 2027, two signed agreements ending in June ---- */
    await at('2027-05-01');
    const staged = await page.evaluate(async ([r, q]) => {
      const mk = (id, name, cp, exp) => ({ id, name, counterparty: cp, status: 'Signed', hash: 'PRE-SEEDED',
        template: 'FF', folder: TEMPLATES.FF.folder, value: 9800000, valueType: TEMPLATES.FF.valueType,
        expiry: exp, metadata: { expiryDate: exp }, signatures: [], comments: [], fields: {},
        audit: [{ at: nowISO(), user: 'System', action: 'Created', detail: 'Staged for the desk check' }] });
      /* THROUGH migrateContract, as every record the product files: a
         signed record stored without the fields the load step adds would
         refuse every later save as a change to its frozen parts (measured —
         a 409 on `rounds`), and the put-away would never reach the server. */
      const a = migrateContract(mk(r, 'Primary Distribution — Nairobi to Coast', 'Sendy Ltd', '2027-06-30'));
      const b = migrateContract(mk(q, 'Central Warehouse & 3PL — Industrial Area', 'Siginon Group', '2027-06-15'));
      state.contracts.unshift(a, b); persist(a); persist(b);
      await flushSaves();
      return true;
    }, [R, Q]);
    await at('2027-05-01');
    const s0 = await look();
    ok('the stage: it is 1 May 2027, both renewals are prepared, and Home draws one',
      !!staged && s0.today === '2027-05-01' && s0.items.includes(R + ':renewal') && s0.items.includes(Q + ':renewal')
        && s0.rows.some(x => x.endsWith(':renewal')), JSON.stringify({ today: s0.today, items: s0.items, rows: s0.rows }));

    /* ---- 1. Put each away on Copilot's work, and the stamps survive the server ---- */
    const all = await page.evaluate(async () => {
      if (typeof agentsData !== 'function' || typeof agRunAct !== 'function') return false;
      for (const it of agentsData().agents.renew.ready.slice()) await agRunAct(it.key, 'away');
      await flushSaves(); setView('dashboard');
      return true;
    });
    await page.waitForTimeout(600);
    const s1 = await look();
    ok('1a putting both away on Copilot\'s work takes them off Home', !!all && !s1.rows.some(x => x.startsWith(R) || x.startsWith(Q)),
      s1.rows.join(' | ') || '(none)');
    await at('2027-05-01');
    const s1b = await look();
    ok('1b after the round trip through the server neither comes back',
      !s1b.items.includes(R + ':renewal') && !s1b.items.includes(Q + ':renewal'), s1b.items.join(' | ') || '(none)');
    ok('1c and each record carries its stamp', s1b.stamps[R] != null && s1b.stamps[Q] != null, JSON.stringify(s1b.stamps));
    await page.screenshot({ path: path.join(OUT, '1-put-away.png') });

    /* ---- 2. The same renewals three weeks later: the CONTROL ---- */
    await at('2027-05-22');
    const s2 = await look();
    ok('2a three weeks on, the same renewals stay away on Home',
      s2.today === '2027-05-22' && !s2.rows.some(x => x.startsWith(R) || x.startsWith(Q))
        && !s2.items.includes(R + ':renewal') && !s2.items.includes(Q + ':renewal'),
      JSON.stringify({ today: s2.today, items: s2.items }));
    const a2 = await agents();
    ok('2b and in Copilot\'s work on the Board', !!a2 && !a2.includes('desk:' + R + ':renewal') && !a2.includes('desk:' + Q + ':renewal'),
      a2 ? (a2.join(' | ') || '(nothing ready)') : 'no door');

    /* ---- 3. May 2028: one of them was renewed for a year ---- */
    const renewed = await page.evaluate(async ([r, kid]) => {
      const p = getContract(r); if (!p) return null;
      const k = { id: kid, name: 'Renewal — ' + p.name, counterparty: p.counterparty, parentId: p.id, relation: 'renewal',
        status: 'Signed', hash: 'PRE-SEEDED', template: p.template, folder: p.folder, value: p.value, valueType: p.valueType,
        expiry: '2028-06-30', metadata: { expiryDate: '2028-06-30', effectiveDate: '2027-06-30' },
        signatures: [], comments: [], fields: {},
        audit: [{ at: nowISO(), user: 'System', action: 'Created', detail: 'Staged renewal for the desk check' }] };
      const kk = migrateContract(k);
      state.contracts.unshift(kk); persist(kk);
      await flushSaves();
      return true;
    }, [R, KID]);
    await at('2028-05-01');
    const gate = await page.evaluate(([r, kid]) => ({
      today: new Date().toISOString().slice(0, 10),
      kid: !!getContract(kid),
      term: typeof effectiveExpiry === 'function' ? effectiveExpiry(getContract(r)) : null,
    }), [R, KID]);
    ok('the stage: it is 1 May 2028 and the signed renewal moved the term to 30 June 2028',
      !!renewed && gate.today === '2028-05-01' && gate.kid && gate.term === '2028-06-30', JSON.stringify(gate));
    const s3 = await look();
    ok('3a this year\'s renewal is back on Home\'s Prepared by Copilot (RED at 8f330c7)',
      s3.rows.includes(R + ':renewal'), s3.rows.join(' | ') || '(nothing prepared)');
    await page.screenshot({ path: path.join(OUT, '3-back-on-home.png') });
    ok('3d CONTROL — the agreement whose term did not move stays away',
      !s3.items.includes(Q + ':renewal') && !s3.rows.some(x => x.startsWith(Q)), s3.items.join(' | ') || '(none)');
    const a3 = await agents();
    ok('3b and it is ready again in Copilot\'s work on the Board, under Renewals (RED at 8f330c7)',
      !!a3 && a3.includes('desk:' + R + ':renewal'), a3 ? (a3.join(' | ') || '(nothing ready)') : 'no door');
    ok('3d2 CONTROL — while the one that did not move is not', !!a3 && !a3.includes('desk:' + Q + ':renewal'),
      a3 ? (a3.join(' | ') || '(nothing ready)') : 'no door');
    await page.screenshot({ path: path.join(OUT, '3-back-on-copilots-work.png') });

    /* Putting this year's away: a real press, not refused by last year's stamp. */
    const btn = await page.evaluate(async r => {
      const it = (typeof agentsData === 'function') ? agentsData().agents.renew.ready.find(x => x.cid === r) : null;
      if (!it || typeof agRunAct !== 'function') return false;
      await agRunAct(it.key, 'away'); await flushSaves(); return true;
    }, R);
    await page.evaluate(() => setView('dashboard')); await page.waitForTimeout(900);
    const s4 = await look();
    ok('3c putting this year\'s renewal away takes it off Home again (RED at 8f330c7)',
      !!btn && !s4.rows.includes(R + ':renewal'), btn ? (s4.rows.join(' | ') || '(none)') : 'no row to press');
    const on = s4.stamps[R] && typeof s4.stamps[R] === 'object' ? s4.stamps[R].on : String(s4.stamps[R]);
    ok('3e and the stamp names this year\'s renewal (RED at 8f330c7)', on === '2028-06-30|0', on);
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    ok('no page errors', errs.length === 0, errs.join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
