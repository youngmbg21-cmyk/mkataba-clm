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
const month = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

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
  const page = await b.newPage({ viewport: { width: 1440, height: 780 } });
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

    const readList = () => page.evaluate(() => {
      const heads = [...document.querySelectorAll('.cu-table thead th')].map(th => th.textContent.trim());
      const at = heads.indexOf('NDA');
      return { heads, rows: Object.fromEntries([...document.querySelectorAll('tr[data-cu-cust]')].map(tr => {
        const td = at >= 0 ? tr.querySelectorAll('td')[at] : null;
        const pill = td && td.querySelector('.cu-nda');
        const sub = td && td.querySelector('.cu-nda-sub');
        return [tr.getAttribute('data-cu-cust'), { text: td ? [pill ? pill.textContent.trim() : td.textContent.trim(), sub ? sub.textContent.trim() : ''].filter(Boolean).join(' / ') : '', st: pill ? pill.getAttribute('data-cu-nda-st') : '',
          tone: pill ? (pill.className.match(/is-(\w+)/) || [])[1] || 'grey' : '', bg: pill ? getComputedStyle(pill).backgroundColor : '',
          dot: pill && pill.querySelector('i') ? getComputedStyle(pill.querySelector('i')).backgroundColor : '' }];
      })), foot: ((document.querySelector('.cu-foot') || {}).textContent || '').trim() };
    });

    console.log('\n1 · the NDA column answers for every party at once');
    const L = await readList();
    ok('1a the list carries an NDA column', L.heads.includes('NDA'), L.heads.join(' | '));
    const R = L.rows;
    ok('1b Givaudan: green "Mutual", then "to ' + month(GV_ENDS) + '"', R['givaudan east africa'] && R['givaudan east africa'].text === 'Mutual / to ' + month(GV_ENDS) && R['givaudan east africa'].tone === 'green', JSON.stringify(R['givaudan east africa']));
    ok('1c Naivas (two contracts, one of them the NDA): green "One-way", then "for good"', R['naivas supermarkets'] && R['naivas supermarkets'].text === 'One-way / for good' && R['naivas supermarkets'].tone === 'green', JSON.stringify(R['naivas supermarkets']));
    ok('1d SAP: signed, nobody confirmed — amber "Not confirmed", never the wording\'s guess', R['sap east africa'] && R['sap east africa'].text === 'Not confirmed' && R['sap east africa'].tone === 'amber', JSON.stringify(R['sap east africa']));
    ok('1e Carrefour: its secrecy ran out — "Ended", then "' + month(CK_ENDS) + '", not green', R['carrefour kenya'] && R['carrefour kenya'].text === 'Ended / ' + month(CK_ENDS) && R['carrefour kenya'].tone === 'grey', JSON.stringify(R['carrefour kenya']));
    /* RE-POINTED 19 Oct 2026 (lane A2, round 19 as drawn: "Not signed yet / draft") */
    ok('1f Krones: only a draft NDA — "Not signed yet", "draft" under it', R['krones east africa'] && R['krones east africa'].text === 'Not signed yet / draft' && R['krones east africa'].st === 'draft', JSON.stringify(R['krones east africa']));
    ok('1g Kabras: no NDA — "None"', R['kabras sugar'] && R['kabras sugar'].text === 'None' && !R['kabras sugar'].st, JSON.stringify(R['kabras sugar']));
    /* RE-POINTED 21 Oct 2026 (Chambers): a status is a dot and a word — the pill
       lost its wash, so the tone is read off the painted DOT. */
    const gvBg = (R['givaudan east africa'] || {}).dot || '', saBg = (R['sap east africa'] || {}).dot || '';
    ok('1h the pills are painted, green and amber apart', !!gvBg && gvBg !== 'rgba(0, 0, 0, 0)' && !!saBg && saBg !== 'rgba(0, 0, 0, 0)' && gvBg !== saBg, gvBg + ' / ' + saBg);

    console.log('\n2 · a filter finds the gaps');
    /* RE-POINTED 21 Oct 2026 (Part 8, the list head the Legora way): the NDA
       filter waits under "+ Filter" beside Stream and Owner, each choice
       counted; once chosen it is a chip whose own list re-chooses, its ×
       returns it to rest */
    const box = await page.evaluate(() => {
      const g = [...document.querySelectorAll('[data-lh-seat="customers"] select[data-lh-add] optgroup')];
      const nda = g.find(x => x.getAttribute('label') === 'NDA');
      return nda ? { groups: g.map(x => x.getAttribute('label')), opts: [...nda.querySelectorAll('option')].map(o => o.textContent.replace(/\s*\(\d+\)$/, '').trim()) } : null;
    });
    ok('2a "+ Filter" offers NDA beside Stream and Owner: In force · Not confirmed · None in force', !!box && box.groups.join(' · ') === 'Stream · Owner · NDA' && box.opts.join(' · ') === 'In force · Not confirmed · None in force', JSON.stringify(box));
    const pick = async v => {
      const done = await page.evaluate(v => {
        const chip = document.querySelector('[data-lh-seat="customers"] select[data-lh-f="nda"]');
        if (v === 'all'){ const x = document.querySelector('[data-lh-seat="customers"] [data-lh-x="nda"]'); if (x) x.click(); return true; }
        if (chip){ chip.value = v; chip.dispatchEvent(new Event('change', { bubbles: true })); return true; }
        const add = document.querySelector('[data-lh-seat="customers"] select[data-lh-add]'); if (!add) return false;
        const o = [...add.options].find(x => x.value === JSON.stringify(['nda', v])); if (!o) return false;
        add.value = o.value; add.dispatchEvent(new Event('change', { bubbles: true })); return true; }, v);
      if (done) await page.waitForFunction(v => { const s = document.querySelector('[data-lh-seat="customers"] select[data-lh-f="nda"]'); return v === 'all' ? !s : (!!s && s.value === v); }, v, { timeout: 4000 }).catch(() => {});
      return done;
    };
    const keys = async () => Object.keys((await readList()).rows).sort().join(', ');
    if (box){
      await pick('inforce');
      ok('2b In force leaves Givaudan and Naivas', (await keys()) === 'givaudan east africa, naivas supermarkets', await keys());
      /* RE-POINTED 19 Oct 2026 (lane A2, round 19 as drawn): the card's head
         counts the rows ("Parties 2"), the foot how many of them are drawn */
      /* RE-POINTED 21 Oct 2026 (Part 8): the foot is the list head's one foot, "1–2 of 2" */
      /* (Part 8) the list's count is the lit tab's number */
      ok('2c …and the list counts the same: "Live 2", "1–2 of 2"', /^1–2 of 2/.test((await readList()).foot)
        && await page.evaluate(() => (document.querySelector('[data-lh-seat="customers"] [role="tab"][aria-selected="true"] .n') || {}).textContent) === '2', (await readList()).foot);
      await pick('unconfirmed');
      ok('2d Not confirmed leaves SAP East Africa', (await keys()) === 'sap east africa', await keys());
      await pick('none');
      ok('2e None in force leaves Carrefour (ended), Kabras (none) and Krones (a draft)', (await keys()) === 'carrefour kenya, kabras sugar, krones east africa', await keys());
      await page.evaluate(() => { if (typeof placeSave === 'function') placeSave(); });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"] tr[data-cu-cust]'), null, { timeout: 10000 }).catch(() => {});
      ok('2f a refresh keeps it', (await keys()) === 'carrefour kenya, kabras sugar, krones east africa'
        && await page.evaluate(() => (document.querySelector('[data-lh-seat="customers"] select[data-lh-f="nda"]') || {}).value) === 'none', await keys());
      await pick('all');
    } else ['2b', '2c', '2d', '2e', '2f'].forEach(n => ok(n + ' (no NDA filter to choose from)', false));

    console.log('\n3 · the party\'s panel says it, with the door to the NDA');
    const panelOf = async key => {
      await page.click(`tr[data-cu-cust="${key}"]`).catch(() => {});
      await page.waitForFunction(k => (document.querySelector('#ins-panel h2, #ins-panel .ins-cp') || {}).textContent && document.querySelector('tr.is-sel[data-cu-cust="' + k + '"]'), key, { timeout: 4000 }).catch(() => {});
      return page.evaluate(() => { const f = document.querySelector('#ins-panel [data-ins-fact="nda"]');
        return f ? { text: f.textContent.replace(/\s+/g, ' ').trim(), amber: !!f.querySelector('.is-amber'), door: !!f.querySelector('[data-cu-nda]') } : null; });
    };
    const gv = await panelOf('givaudan east africa');
    ok('3a Givaudan\'s panel: "Both sides (mutual) · secret until …" and Open the NDA', !!gv && /^NDA ?Both sides \(mutual\) · secret until .+ Open the NDA ›$/.test(gv.text) && gv.door, JSON.stringify(gv));
    const sa = await panelOf('sap east africa');
    ok('3b SAP\'s panel says, in amber, that nobody has confirmed it — and still opens it', !!sa && /nobody has confirmed/.test(sa.text) && sa.amber && sa.door, JSON.stringify(sa));
    const ks = await panelOf('kabras sugar');
    /* RE-POINTED 19 Oct 2026 (round 19 as drawn: "None — no NDA with Kettle & Co, signed or in draft") */
    ok('3c Kabras\'s panel says None, in the drawing\'s sentence, with no door', !!ks && /^NDA ?None — no NDA with Kabras Sugar, signed or in draft$/.test(ks.text) && !ks.door, JSON.stringify(ks));
    await panelOf('givaudan east africa');
    if (await press('#ins-panel [data-cu-nda]', '3d the door to the NDA')) {
      await page.waitForFunction(() => state.view === 'dashboard' && !!document.querySelector('#bs-strip-ND-GV'), null, { timeout: 8000 }).catch(() => {});
      const st = await page.evaluate(() => ({ view: state.view, strip: !!document.querySelector('#bs-strip-ND-GV'),
        tile: ((document.querySelector('#bs-strip-ND-GV') || {}).textContent || '').includes('Secret until') }));
      ok('3d Open the NDA brings up its life line on the Board, the Secret until tile on it', st.view === 'dashboard' && st.strip && st.tile, JSON.stringify(st));
    }

    console.log('\n4 · the column costs the list nothing, at the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await page.evaluate(() => setView('customers'));
      await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"] tr[data-cu-cust]'), null, { timeout: 8000 }).catch(() => {});
      const fit = await page.evaluate(() => {
        const sc = document.querySelector('.cu-scroll'), cells = [...document.querySelectorAll('.cu-table .cu-nda-td')];
        /* a row is as tall as its party's two lines; the NDA cell never adds a line */
        const tall = cells.filter(td => { const tr = td.closest('tr'), id = tr.querySelector('.ap-id');
          return td.getBoundingClientRect().height > (id ? id.getBoundingClientRect().height : 40) + 20; }).length;
        const pills = [...document.querySelectorAll('.cu-table .cu-nda')].filter(p => p.scrollWidth > p.clientWidth + 1 || p.getBoundingClientRect().height > 30).length
          + [...document.querySelectorAll('.cu-table thead th, .cu-table td:not(:first-child)')].filter(x => x.scrollWidth > x.clientWidth + 1).length;
        const party = Math.round((document.querySelector('.cu-table thead th') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width);
        return { side: sc ? sc.scrollWidth - sc.clientWidth : -1, tall, pills, party, page: document.documentElement.scrollWidth - innerWidth };
      });
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/parties-${vp.width}x${vp.height}.png` });
      ok(`4 ${vp.width}×${vp.height}: the party's column keeps its room, no sideways scroll, no row grows, no pill cut`, fit.party >= 186 && fit.side <= 0 && fit.tall === 0 && fit.pills === 0 && fit.page <= 0, JSON.stringify(fit));
    }

    console.log('\n5 · in Swedish the words fit too');
    await page.setViewportSize({ width: 1536, height: 730 });
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('sv'); setView('customers'); });
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"] tr[data-cu-cust]'), null, { timeout: 8000 }).catch(() => {});
    const sv = await page.evaluate(() => ({
      head: [...document.querySelectorAll('.cu-table thead th')].filter(th => th.scrollWidth > th.clientWidth + 1).map(th => th.textContent.trim()),
      pills: [...document.querySelectorAll('.cu-table .cu-nda, .cu-table .cu-nda-sub, .cu-table td:not(:first-child)')].filter(p => p.scrollWidth > p.clientWidth + 1).map(p => p.textContent.trim()),
      words: [...document.querySelectorAll('.cu-table .cu-nda')].map(p => p.textContent.trim()).sort().join(', '),
      /* (Part 8) the NDA filter is still offered, under + Filter */
      box: [...document.querySelectorAll('[data-lh-seat="customers"] select[data-lh-add] option')].some(o => o.value.indexOf('["nda"') === 0) }));
    ok('5 Swedish: no head and no NDA word cut, the box still there', sv.box && !sv.head.length && !sv.pills.length && /Ömsesidigt/.test(sv.words) && /Inte bekräftat/.test(sv.words), JSON.stringify(sv));
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
