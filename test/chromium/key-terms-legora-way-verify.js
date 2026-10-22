/* Chromium verification: KEY TERMS, THE LEGORA WAY, ON A WHITE CARD
   ============================================================
   The owner, retiring the Details page (22 Oct 2026), was shown four ways for
   Key terms to take in what only Details held (filing, the code name, the
   parties, Fill from document) and picked "The Legora way but on a white
   card". Of the one part that could not be built as drawn — the quote of where
   each term was read, which HaTi keeps only for a paper Jambo read — the owner
   chose: a paper drafted from a template says "From the template".

   WHAT THIS PINS, in a real browser, at the owner's three screens:
     1 the sheet in the middle is Term · What it says · Where on the paper, on a
       white card, the parties under "Who it is between" (the other side's name
       and address one row), "+ Add a party" under it
     2 where on the paper: a drafted paper's terms say "From the template", an
       empty one "Not in the wording"; an uploaded paper's term quotes the words
       Jambo kept, with the clause they stand under
     3 the head: the filing as one line (reference · stream + Move · template ·
       owner, raised · code name + Set) and "Read all from the paper" with its cost
     4 every press is the old door, and Key terms comes back after it: Change on
       the other side opens both its boxes; Move shows the streams and moves
       through the one re-filer's question; Set opens the code-name dialog; +
       Add a party opens the party editor
     5 a reader who may not edit sees no Change, Move, Add or Read
   Red at the parent (2a39d1b): the sheet has no "Where on the paper", no filing
   line, no Read all, no Add a party.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/key-terms-legora-way-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/key-terms-legora-way-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
if (OUT) { try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {} }
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const UPLOAD_TEXT = 'MASTER SERVICES AGREEMENT\n\nThis agreement is made between Highland Corporate Ltd and Kestrel Logistics AB.\n\n'
  + '1. Services\nThe Supplier shall provide warehousing services.\n\n2. Fees\nThe total contract value is SEK 4,800,000 payable in instalments.\n'
  + 'Invoices are payable within thirty (30) days of receipt.\n\n3. Term\nThis agreement shall remain in force until 30 September 2027.\n\n'
  + '4. Governing law\nThis agreement is governed by the laws of Sweden.\n';

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  /* an uploaded paper Jambo read: its kept words (metadata.sourceSpans) */
  await W.admin.json('/api/contracts/MK-UP1', { method: 'PUT', body: { baseVersion: 0, contract: Object.assign(
    H.fixtureContract('MK-UP1', 'Kestrel MSA', 'Kestrel Logistics AB', H.FOLDER_A, 4800000, 'Under Review'),
    { source: 'upload', template: '', upload: { fileName: 'kestrel.pdf', extractedText: UPLOAD_TEXT }, expiry: '2027-09-30',
      metadata: { governingLaw: 'Sweden', paymentTerms: '30 days', confirmedAt: '2026-10-01',
        sourceSpans: { governingLaw: 'governed by the laws of Sweden', paymentTerms: 'payable within thirty (30) days of receipt' } } }) } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = async name => { if (OUT) await page.screenshot({ path: path.join(OUT, name) }); };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && typeof getContract === 'function' && getContract('MK-A2') && getContract('MK-UP1') ? true : null, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const KT_UP = () => document.querySelector('[data-dlg-page][data-pd-mid] [data-pd-mid-kt] #pd-kt') ? true : null;
    const openKt = async id => {
      await page.evaluate(i => pdOpenOnHome(i, 'copilot'), id);
      await until(i => window.intel && intel.paper && String(intel.paper.id) === i ? true : null, id, 10000);
      await page.waitForTimeout(400);
      await until(i => (typeof pdKtMid === 'function' && (document.querySelector('[data-pd-mid-kt]') || pdKtMid(i))) ? (document.querySelector('[data-pd-mid-kt] #pd-kt') ? true : null) : null, id, 10000);
    };
    const SHEET = () => {
      const m = document.querySelector('[data-pd-mid-kt]'); if (!m) return null;
      const t = m.querySelector('table.pd-kt-lg');
      const heads = t ? [...t.querySelectorAll('thead th')].map(x => x.textContent.trim()).filter(Boolean) : [];
      const rows = t ? [...t.querySelectorAll('tr[data-pd-og-row]')].map(r => ({ k: r.getAttribute('data-pd-og-row'), cells: [...r.children].map(td => td.innerText.replace(/\s+/g, ' ').trim()) })) : [];
      const card = m.closest('.dlg-pg-body > *') || m;
      const head = document.querySelector('[data-dlg-page][data-pd-mid] .dlg-pg-head');
      const file = document.querySelector('[data-pd-kt-file]');
      return { heads, rows, sub: t && t.querySelector('.pd-kt-lg-sub') ? t.querySelector('.pd-kt-lg-sub').textContent.trim() : '',
        bg: getComputedStyle(card).backgroundColor, add: !!m.querySelector('.pd-kt-add'),
        file: file ? file.innerText.replace(/\s+/g, ' ').trim() : '', fileInHead: !!(file && head && head.contains(file)),
        move: !!(file && file.querySelector('[data-pd-kt-move]')), set: !!(file && file.querySelector('[data-pd-kt-cn]')),
        read: (() => { const b = head && head.querySelector('[data-pd-kt-read]'); return b ? b.innerText.trim() : ''; })(),
        cost: (() => { const c = head && head.querySelector('#pd-kt-cost'); return c ? c.innerText.trim() : ''; })(),
        changes: m.querySelectorAll('[data-pd-kt-change], [data-pd-kt-party]').length,
        side: document.documentElement.scrollWidth <= innerWidth + 1 };
    };

    for (const [w, ht] of SCREENS) {
      const at = `${w}×${ht}`;
      await page.setViewportSize({ width: w, height: ht });
      await part(`1 ${at}`, async () => {
        await openKt('MK-A2');
        const S = await until(SHEET);
        check(`1a ${at} Key terms in the middle is Term · What it says · Where on the paper`,
          !!S && S.heads.join('|') === 'Term|What it says|Where on the paper', JSON.stringify(S && S.heads));
        check(`1b ${at} on a white card`, !!S && /rgb\(255, 255, 255\)/.test(S.bg), S && S.bg);
        const cp = S && S.rows.find(r => r.k === 'counterparty');
        check(`1c ${at} the parties under "Who it is between", the other side's name and address one row, + Add a party under it`,
          !!S && S.sub === 'Who it is between' && !!cp && cp.cells[0] === 'Nandi Dairy' && /^Counterparty · /.test(cp.cells[1]) && !S.rows.some(r => r.k === 'cpEmail') && S.add,
          JSON.stringify(S && { sub: S.sub, cp, add: S.add }));
        const ct = S && S.rows.find(r => r.k === 'contractType'), law = S && S.rows.find(r => r.k === 'governingLaw');
        check(`2a ${at} a drafted paper: a set term says "From the template", an empty one "Not in the wording"`,
          !!ct && ct.cells[2] === 'From the template' && !!law && law.cells[1] === '—' && law.cells[2] === 'Not in the wording',
          JSON.stringify({ ct: ct && ct.cells, law: law && law.cells }));
        check(`3a ${at} the filing is one line in the head: reference · stream Move · template · owner, raised · code name Set`,
          !!S && S.fileInHead && /^MK-A2 · .+ Move · Raw Material Supply Agreement · Amina Otieno, raised .+ · No code name Set$/.test(S.file) && S.move && S.set,
          S && S.file);
        check(`3b ${at} "Read all from the paper" in the head, its cost beside it`,
          !!S && S.read === 'Read all from the paper' && /Jambo call|Free/.test(S.cost), JSON.stringify(S && { read: S.read, cost: S.cost }));
        check(`3c ${at} nothing sideways`, !!S && S.side);
        await shot(`kt-legora-${w}.png`);
      });
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    await part('2b the uploaded paper', async () => {
      await openKt('MK-UP1');
      const S = await until(() => { const m = document.querySelector('[data-pd-mid-kt] tr[data-pd-og-row="governingLaw"]'); return m ? true : null; }) && await page.evaluate(SHEET);
      const law = S && S.rows.find(r => r.k === 'governingLaw'), pay = S && S.rows.find(r => r.k === 'paymentTerms');
      check('2b an uploaded paper quotes the words Jambo kept, with the clause they stand under',
        !!law && /^§4 .governed by the laws of Sweden.$/.test(law.cells[2]) && !!pay && /^§2 .payable within thirty \(30\) days of receipt.$/.test(pay.cells[2]),
        JSON.stringify({ law: law && law.cells, pay: pay && pay.cells }));
      await shot('kt-legora-upload.png');
    });

    await part('4 the doors', async () => {
      await openKt('MK-A2');
      await page.click('[data-pd-kt-change="counterparty"]');
      const boxes = await until(() => { const b = [...document.querySelectorAll('[data-pd-mid-kt] tr[data-pd-og-row="counterparty"] input')].map(i => i.getAttribute('data-kt')); return b.length ? b : null; });
      check('4a Change on the other side opens its name and its address', JSON.stringify(boxes) === '["counterparty","cpEmail"]', JSON.stringify(boxes));
      await page.click('[data-pd-kt-done="counterparty"]');
      await page.click('[data-pd-kt-move]');
      const opts = await until(() => { const s = document.querySelector('[data-pd-kt-file] [data-pd-kt-folder]'); return s ? [...s.options].map(o => o.value) : null; });
      check('4b Move shows the streams in the line', Array.isArray(opts) && opts.length > 1, JSON.stringify(opts));
      const to = await page.evaluate(() => [...document.querySelector('[data-pd-kt-folder]').options].map(o => o.value).find(v => v !== getContract('MK-A2').folder));
      await page.evaluate(v => { const s = document.querySelector('[data-pd-kt-folder]'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, to);
      const asked = await until(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Move it' && b.getClientRects().length) ? true : null);
      check('4c picking a stream asks the one re-filer\'s question', !!asked);
      if (asked) await page.getByRole('button', { name: 'Move it' }).click();
      const moved = await until(v => getContract('MK-A2').folder === v && document.querySelector('[data-pd-mid-kt] #pd-kt') && !document.querySelector('[data-pd-kt-folder]') ? true : null, to);
      check('4d moved, and Key terms stands again with the picker shut', !!moved, await page.evaluate(() => getContract('MK-A2').folder));
      await page.click('[data-pd-kt-cn]');
      const cn = await until(() => { const d = document.querySelector('#modal-root [role="dialog"]'); return d && /Code name/.test(d.innerText) && !document.querySelector('[data-pd-mid-kt]') ? true : null; });
      check('4e Set opens the code-name dialog', !!cn);
      await page.keyboard.press('Escape');
      check('4f closed, Key terms comes back', !!(await until(KT_UP)));
      await page.click('[data-pd-mid-kt] .pd-kt-add');
      const py = await until(() => { const d = document.querySelector('#modal-root [role="dialog"]'); return d && /Add a party/.test(d.innerText) ? true : null; });
      check('4g + Add a party opens the party editor', !!py);
      await page.keyboard.press('Escape');
      check('4h closed, Key terms comes back', !!(await until(KT_UP)));
    });

    await part('5 a reader', async () => {
      await page.evaluate(() => { window.canEdit = () => false; window.mayReFile = () => false; });
      if (await page.evaluate(() => !!document.querySelector('[data-pd-mid-kt]'))) await page.evaluate(() => pdMidClose());
      await page.waitForTimeout(300);
      await openKt('MK-A2');
      const S = await until(SHEET);
      check('5a a reader who may not edit sees no Change, Move, Add or Read', !!S && S.changes === 0 && !S.move && !S.add && !S.read,
        JSON.stringify(S && { changes: S.changes, move: S.move, add: S.add, read: S.read }));
    });
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
