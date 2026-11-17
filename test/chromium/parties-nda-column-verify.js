/* "DO WE HAVE AN NDA WITH THEM?" — ON THE PARTY'S SHELF (owner picked "NDA
   column — the SAP way", 17 Oct 2026; piece 4b of the sensitive contracts and
   governance plan)

   WHAT THIS PINS, driven in a real browser on a seeded book of six parties
     1 the Parties list carries an NDA column that answers for every party at
       once, off the facts a person confirmed on each NDA and whether it is
       signed — never the wording's guess:
         in force, mutual, a day      → green "Mutual" / "to <month year>"
         in force, one-way, for good  → green "One-way" / "for good"
         signed, nobody confirmed     → amber "Not confirmed"
         its secrecy ran out          → grey  "Ended" / "<month year>"
         only a draft NDA             → grey  "Not signed yet"
         no NDA at all                → "None"
     2 a filter "NDA" (RE-POINTED 21 Oct 2026, Part 8, the list head the
       Legora way: under "+ Filter", a chip once chosen): In force · Not
       confirmed · None in force, each leaving exactly its parties, the lit
       tab and the foot counting the same; a refresh keeps it
     3 the party's panel repeats it as a sentence, with the door to the NDA:
       pressing it brings up that NDA's life line on the Board, where its
       Secret until tile is confirmed; a signed NDA nobody confirmed says so
       in amber
     4 the column takes its room from the heads, not the names: the party's
       column keeps its room for the name (at least 186px with 12px sides —
       before the column it was 190 with 14px sides at 1536 with the rail
       open, its narrowest), no head, cell or pill is cut, no row grows, at
       the owner's three screens; and in Swedish (5)

   Run: node test/chromium/parties-nda-column-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };
/* every day is counted from the day the check runs, never written down */
const day = off => { const t = new Date(); t.setUTCDate(t.getUTCDate() + off); return t.toISOString().slice(0, 10); };

const GV_ENDS = day(1400), CK_ENDS = day(-200);
const nda = (id, cp, status, rec) => ({ ...H.fixtureContract(id, 'Mutual NDA — ' + cp, cp, H.FOLDER_A, 0, status),
  template: null, valueType: 'none', metadata: { contractType: 'Mutual Non-Disclosure Agreement', currency: 'KES' }, ...(rec ? { nda: rec } : {}) });
const CONTRACTS = [
  nda('ND-GV', 'Givaudan East Africa', 'Signed', { dir: 'mutual', ends: GV_ENDS, forGood: false, trade: true, clause: '5', who: 'Amina Otieno', at: day(-3) + 'T09:00:00Z' }),
  nda('ND-NV', 'Naivas Supermarkets', 'Signed', { dir: 'ours', forGood: true, clause: '4' }),
  H.fixtureContract('MK-NV1', 'Distribution agreement', 'Naivas Supermarkets', H.FOLDER_B, 48e6, 'Signed'),
  nda('ND-SA', 'SAP East Africa', 'Signed', null),
  nda('ND-CK', 'Carrefour Kenya', 'Signed', { dir: 'mutual', ends: CK_ENDS, clause: '6' }),
  H.fixtureContract('MK-CK1', 'Supply agreement', 'Carrefour Kenya', H.FOLDER_B, 22e6, 'Signed'),
  H.fixtureContract('MK-KS1', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48e6, 'Signed'),
  nda('ND-KE', 'Krones East Africa', 'Draft', null),
  H.fixtureContract('MK-KE1', 'Bottling line service', 'Krones East Africa', H.FOLDER_B, 12e6, 'Signed'),
];
CONTRACTS.forEach(c => { if (!c.nda && c.id.startsWith('MK-')) c.expiry = day(400); });

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const b = await chromium.launch({ executablePath: EXEC });
/* RE-POINTED 28 Oct 2026 (THE LIST'S COLUMNS, the owner's ranking): on a laptop beside the panel the columns a reader adds step aside first; what this file reads in them is read where they all have room */
  const page = await b.newPage({ viewport: { width: 1920, height: 1000 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  /* a press on a part that may not exist reports instead of waiting out the clock */
  const press = async (sel, what) => { const n = await page.locator(sel).count(); if (!n) { ok(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof setView === 'function' && state.contracts && state.contracts.some(c => c.id === 'ND-GV'), null, { timeout: 15000 });
    await page.evaluate(() => setView('customers'));
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"] tr[data-cu-cust]'), null, { timeout: 8000 }).catch(() => {});

    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762; Parties as drawn, round 6): the table is .cun-table and
       its NDA cell one status — a dot and a word (.cun-st: "Signed <year>", "Confirmed", "Ended", "In draft", "None"), the
       none and the ended greyed (.is-none); no second line under it */
    const readList = () => page.evaluate(() => {
      const heads = [...document.querySelectorAll('.cun-table thead th')].map(th => th.textContent.trim());
      const at = heads.indexOf('NDA');
      return { heads, rows: Object.fromEntries([...document.querySelectorAll('tr[data-cu-cust]')].map(tr => {
        const td = at >= 0 ? tr.querySelectorAll('td')[at] : null;
        const pill = td && td.querySelector('.cun-st');
        const sub = null;
        return [tr.getAttribute('data-cu-cust'), { text: td ? [pill ? pill.textContent.trim() : td.textContent.trim(), sub ? sub.textContent.trim() : ''].filter(Boolean).join(' / ') : '', st: pill ? pill.getAttribute('data-cu-nda-st') : '',
          tone: pill ? (pill.classList.contains('is-none') ? 'grey' : 'on') : '', bg: pill ? getComputedStyle(pill).backgroundColor : '',
          dot: pill && pill.querySelector('i') ? getComputedStyle(pill.querySelector('i')).backgroundColor : '' }];
      })), foot: ((document.querySelector('.cun-page .apn-foot') || {}).textContent || '').trim() };
    });

    console.log('\n1 · the NDA column answers for every party at once');
    const L = await readList();
    ok('1a the list carries an NDA column', L.heads.includes('NDA'), L.heads.join(' | '));
    const R = L.rows;
    ok('1b Givaudan: in force, "Signed <year>" (or "Confirmed" where no signing day is held), not greyed', R['givaudan east africa'] && /^(Signed \d{4}|Confirmed)$/.test(R['givaudan east africa'].text) && R['givaudan east africa'].tone === 'on', JSON.stringify(R['givaudan east africa']));
    ok('1c Naivas (two contracts, one of them the NDA): in force, "Signed <year>"', R['naivas supermarkets'] && /^(Signed \d{4}|Confirmed)$/.test(R['naivas supermarkets'].text) && R['naivas supermarkets'].tone === 'on', JSON.stringify(R['naivas supermarkets']));
    ok('1d SAP: signed, nobody confirmed — "Not confirmed", never the wording\'s guess, never "Confirmed"', R['sap east africa'] && /^Not confirmed$/i.test(R['sap east africa'].text), JSON.stringify(R['sap east africa']));
    ok('1e Carrefour: its secrecy ran out — "Ended", greyed', R['carrefour kenya'] && R['carrefour kenya'].text === 'Ended' && R['carrefour kenya'].tone === 'grey', JSON.stringify(R['carrefour kenya']));
    /* RE-POINTED 19 Oct 2026 (lane A2, round 19 as drawn: "Not signed yet / draft") */
    ok('1f Krones: only a draft NDA — "In draft"', R['krones east africa'] && R['krones east africa'].text === 'In draft', JSON.stringify(R['krones east africa']));
    ok('1g Kabras: no NDA — "None"', R['kabras sugar'] && R['kabras sugar'].text === 'None' && R['kabras sugar'].tone === 'grey', JSON.stringify(R['kabras sugar']));
    /* RE-POINTED 21 Oct 2026 (Chambers): a status is a dot and a word — the pill
       lost its wash, so the tone is read off the painted DOT. */
    const gvBg = (R['givaudan east africa'] || {}).dot || '', saBg = (R['sap east africa'] || {}).dot || '';
    ok('1h the pills are painted, green and amber apart', !!gvBg && gvBg !== 'rgba(0, 0, 0, 0)' && !!saBg && saBg !== 'rgba(0, 0, 0, 0)' && gvBg !== saBg, gvBg + ' / ' + saBg);

    console.log('\n2 · a filter finds the gaps');
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762; Parties as drawn, round 6): the list has no + Filter;
       the gaps are its own tab, "NDA missing" ([data-cun-tab="nda"]): the parties with no NDA in force — none at all, or
       one whose secrecy ran out (a draft on its way is not missing). The tab's number is the rows it draws and the foot
       counts the same; a refresh keeps it.
       RETIRED 17 Nov 2026 (#762): 2a ("+ Filter" offers NDA: In force · Not confirmed · None in force), 2b (In force
       leaves Givaudan and Naivas) and 2d (Not confirmed leaves SAP) — the new look's Parties has no NDA filter with those
       choices; the column itself says In force / Not confirmed on every row (1b–1d) */
    const tabN = () => page.evaluate(() => Number(((document.querySelector('[data-cun-tab="nda"] span') || {}).textContent || 'NaN').trim()));
    const keys = async () => Object.keys((await readList()).rows).sort().join(', ');
    const hasTab = await page.evaluate(() => !!document.querySelector('[data-cun-tab="nda"]'));
    if (hasTab){
      await page.click('[data-cun-tab="nda"]');
      await page.waitForFunction(() => !!document.querySelector('[data-cun-tab="nda"].is-on'), null, { timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(300);
      ok('2e NDA missing leaves Carrefour (ended) and Kabras (none)', (await keys()) === 'carrefour kenya, kabras sugar', await keys());
      const L2 = await readList();
      /* the foot counts the whole book (every party, every agreement), not the tab: the tab's number is what this pins */
      ok('2c …and the list counts the same: the tab\'s number is its rows',
        (await tabN()) === Object.keys(L2.rows).length, (await tabN()) + ' · ' + Object.keys(L2.rows).length + ' rows');
      await page.evaluate(() => { if (typeof placeSave === 'function') placeSave(); });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"] tr[data-cu-cust]'), null, { timeout: 10000 }).catch(() => {});
      ok('2f a refresh keeps it', (await keys()) === 'carrefour kenya, kabras sugar'
        && await page.evaluate(() => !!document.querySelector('[data-cun-tab="nda"].is-on')), await keys());
      if (await page.$('[data-cun-tab="all"]')) await page.click('[data-cun-tab="all"]').catch(() => {});
      await page.waitForTimeout(300);
    } else ['2e', '2c', '2f'].forEach(n => ok(n + ' (no NDA missing tab to choose)', false));

    console.log('\n3 · the party\'s panel says it, with the door to the NDA');
    /* RE-POINTED 17 Nov 2026 (#762): the chosen party's panel is Jambo's five parts; the NDA is a row of "The party's own
       facts" (.jov5-row: .jov5-k "NDA", its word in .jov5-rt) — the column's own reading in a sentence's words; the door to
       the NDA is looked for in that row or anywhere in the panel ([data-cu-nda]) */
    const panelOf = async key => {
      await page.click(`tr[data-cu-cust="${key}"]`).catch(() => {});
      await page.waitForFunction(k => !!document.querySelector('tr.is-sel[data-cu-cust="' + k + '"]') && !!document.querySelector('#ins-panel .jov5-title'), key, { timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(200);
      return page.evaluate(() => { const f = [...document.querySelectorAll('#ins-panel .jov5-row')].find(r => ((r.querySelector('.jov5-k') || {}).textContent || '').trim() === 'NDA');
        if (!f) return null;
        const v = f.querySelector('.jov5-rt'); const col = v ? getComputedStyle(v.querySelector('b') || v).color : '';
        return { text: (v ? v.textContent : '').replace(/\s+/g, ' ').trim(), color: col, door: !!(f.querySelector('[data-cu-nda]') || document.querySelector('#ins-panel [data-cu-nda]')) }; });
    };
    const gv = await panelOf('givaudan east africa');
    ok('3a Givaudan\'s panel says it is in force ("Signed <day>") and opens the NDA', !!gv && /^(Signed .+|Confirmed)$/.test(gv.text) && gv.door, JSON.stringify(gv));
    const sa = await panelOf('sap east africa');
    ok('3b SAP\'s panel says nobody has confirmed it ("Not confirmed") — and still opens it', !!sa && /^Not confirmed$/.test(sa.text) && sa.door, JSON.stringify(sa));
    const ks = await panelOf('kabras sugar');
    ok('3c Kabras\'s panel says None, with no door', !!ks && /^None$/.test(ks.text) && !ks.door, JSON.stringify(ks));
    await panelOf('givaudan east africa');
    if (await press('#ins-panel [data-cu-nda]', '3d the door to the NDA')) {
      /* RE-POINTED 9 Nov 2026 (the Board's contract card and its life line are gone): the NDA's facts open beside its
         paper (ndaEditOpen → Fill in's owed row, else Key terms in the middle) */
      await page.waitForFunction(() => state.view === 'dashboard' && typeof pdContract === 'function' && !!pdContract() && pdContract().id === 'ND-GV'
        && !!document.querySelector('[data-pd-mid-kt], #pd-fillface, [data-pd-tab="form"].on, #pd-form'), null, { timeout: 8000 }).catch(() => {});
      const st = await page.evaluate(() => ({ view: state.view, paper: !!(typeof pdContract === 'function' && pdContract() && pdContract().id === 'ND-GV'),
        facts: !!document.querySelector('[data-pd-mid-kt], #pd-fillface, #pd-form') }));
      ok('3d Open the NDA opens its facts beside its paper', st.view === 'dashboard' && st.paper && st.facts, JSON.stringify(st));
    }

    console.log('\n4 · the column costs the list nothing, at the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await page.evaluate(() => setView('customers'));
      await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"] tr[data-cu-cust]'), null, { timeout: 8000 }).catch(() => {});
      /* RE-POINTED 17 Nov 2026 (#762): the new look's table (.cun-table in .cu-scroll), the NDA cell one status (.cun-st) */
      const fit = await page.evaluate(() => {
        const sc = document.querySelector('.cu-scroll'), heads = [...document.querySelectorAll('.cun-table thead th')].map(th => th.textContent.trim());
        const at = heads.indexOf('NDA');
        const cells = at < 0 ? [] : [...document.querySelectorAll('.cun-table tr[data-cu-cust]')].map(tr => tr.querySelectorAll('td')[at]).filter(Boolean);
        /* a row is as tall as its party's lines; the NDA cell never adds a line */
        const tall = cells.filter(td => { const tr = td.closest('tr'), nm = tr.querySelector('td');
          return td.getBoundingClientRect().height > (nm ? nm.getBoundingClientRect().height : 40) + 1; }).length;
        const pills = cells.map(td => td.querySelector('.cun-st')).filter(Boolean).filter(p => p.scrollWidth > p.clientWidth + 1 || p.getBoundingClientRect().height > 30).length
          + [...document.querySelectorAll('.cun-table thead th, .cun-table td:not(:first-child)')].filter(x => x.scrollWidth > x.clientWidth + 1).length;
        const party = Math.round((document.querySelector('.cun-table thead th') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width);
        return { side: sc ? sc.scrollWidth - sc.clientWidth : -1, tall, pills, party, page: document.documentElement.scrollWidth - innerWidth, cells: cells.length };
      });
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/parties-${vp.width}x${vp.height}.png` });
      ok(`4 ${vp.width}×${vp.height}: the party's column keeps its room, no sideways scroll, no row grows, no pill cut`, fit.cells >= 6 && fit.party >= 186 && fit.side <= 0 && fit.tall === 0 && fit.pills === 0 && fit.page <= 0, JSON.stringify(fit));
    }

    console.log('\n5 · in Swedish the words fit too');
    await page.setViewportSize({ width: 1536, height: 730 });
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('sv'); setView('customers'); });
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"] tr[data-cu-cust]'), null, { timeout: 8000 }).catch(() => {});
    /* RE-POINTED 17 Nov 2026 (#762): the new look's table; the words are the new column's ("Inte bekräftat" for the one
       nobody confirmed, "Signerat <år>" — or "Bekräftat" where no signing day is held — for one in force); the gaps' tab ("NDA saknas") stands where the box stood */
    await page.waitForTimeout(300);
    const sv = await page.evaluate(() => {
      const heads = [...document.querySelectorAll('.cun-table thead th')];
      const at = heads.map(th => th.textContent.trim()).indexOf('NDA');
      const cells = at < 0 ? [] : [...document.querySelectorAll('.cun-table tr[data-cu-cust]')].map(tr => tr.querySelectorAll('td')[at]).filter(Boolean);
      return {
        head: heads.filter(th => th.scrollWidth > th.clientWidth + 1).map(th => th.textContent.trim()),
        pills: [...cells.map(td => td.querySelector('.cun-st')).filter(Boolean), ...document.querySelectorAll('.cun-table td:not(:first-child)')].filter(p => p.scrollWidth > p.clientWidth + 1).map(p => p.textContent.trim()),
        words: cells.map(td => td.textContent.trim()).sort().join(', '),
        box: !!document.querySelector('[data-cun-tab="nda"]') };
    });
    ok('5 Swedish: no head and no NDA word cut, the box still there', sv.box && !sv.head.length && !sv.pills.length && /(Signerat \d{4}|Bekräftat)/.test(sv.words) && /Inte bekräftat/.test(sv.words), JSON.stringify(sv));
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/parties-sv-1536x730.png` });
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('en'); });

    ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) {
    ok('the run finished', false, e.message);
  } finally {
    await b.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
