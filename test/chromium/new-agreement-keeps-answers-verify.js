/* Chromium verification: THE NEW AGREEMENT POP-UP KEEPS WHAT YOU TYPED
   (functional review, 9 Oct 2026 — C3, C5, C6; f592 pins the rules).
   ============================================================
   · a company standard's card counts its essentials as details and says how
     many of the template's own questions follow (C3);
   · an answer typed on one row is in the same box on the next row (C5);
   · Cancel and Escape ask before throwing typed answers away, "Keep editing"
     keeps the pop-up, and with nothing typed Cancel just closes (C5);
   · a refused Create prints on the card under the boxes, not as a toast over
     the dialog's buttons (C6).

   Run: node test/chromium/new-agreement-keeps-answers-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
async function waitFor(page, fn, arg, ms = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    let v = null; try { v = await page.evaluate(fn, arg); } catch (_) { v = null; }
    if (v) return v; await pause(120);
  }
  return null;
}

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const tpl = await W.admin.json('/api/templates', { method: 'POST', body: { name: 'Supply Standard', category: 'procurement', folder: 'proc' } });
  const tid = tpl.template.id; const tdet = await W.admin.json('/api/templates/' + tid); const tv = tdet.versions[0].id;
  await W.admin.json(`/api/templates/${tid}/versions/${tv}`, { method: 'PUT', body: { blocks: [
    { orderIndex: 0, blockType: 'heading', content: 'Supply Standard' },
    { orderIndex: 1, blockType: 'fixed_text', content: 'Between {{org_name}} and {{provider}} for {{goods}}.' }],
    fields: [{ fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', defaultValue: '{{org.company_name}}' },
      { fieldKey: 'provider', label: 'Provider name', fieldType: 'short_text' },
      { fieldKey: 'goods', label: 'Goods', fieldType: 'short_text' }] } });
  await W.admin.json(`/api/templates/${tid}/versions/${tv}/publish`, { method: 'POST', body: { changeNote: 'v1' } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const open = async () => {
    await page.evaluate(async () => { try { await tplLibRefresh(); } catch (_) {} openNewAgreement({}); });
    return waitFor(page, () => !!document.querySelector('#na-root #na-form input'));
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts.some(c => c.id === 'MK-A2'), null, 15000);

    check('the pop-up opens', !!(await open()));
    const sub = await page.evaluate(() => ({ name: document.getElementById('na-card-name').textContent,
      sub: document.getElementById('na-card-sub').textContent }));
    check('C3 a company standard counts details and the template’s questions apart',
      sub.name === 'Supply Standard' && /details/.test(sub.sub) && /3 template questions follow/.test(sub.sub), `${sub.name} · ${sub.sub}`);

    /* C5: type on the company standard's card, then press a HaTi row. */
    const typedId = await page.evaluate(() => {
      const el = document.querySelector('#na-form input[id$="-counterparty"]'); if (!el) return null;
      el.focus(); el.value = 'Juno Limited'; el.dispatchEvent(new Event('input', { bubbles: true })); return el.id;
    });
    check('C5 the card has a counterparty box', !!typedId, typedId);
    await page.evaluate(() => document.querySelector('[data-wz-tid]').click());
    const carried = await waitFor(page, () => {
      const el = document.getElementById('wz-counterparty'); return el ? el.value : null; });
    check('C5 the answer is in the same box on the next row', carried === 'Juno Limited', String(carried));

    await page.click('#wz-pick-cancel');
    const asked = await waitFor(page, () => !!document.getElementById('confirm-overlay'));
    check('C5 Cancel asks before throwing typed answers away', !!asked);
    await page.click('#cf-cancel');
    await pause(250);
    check('C5 "Keep editing" keeps the pop-up and the answer', await page.evaluate(() =>
      !!document.getElementById('na-root') && document.getElementById('wz-counterparty').value === 'Juno Limited'));

    await page.keyboard.press('Escape');
    const askedEsc = await waitFor(page, () => !!document.getElementById('confirm-overlay'));
    check('C5 Escape asks too', !!askedEsc);
    if (askedEsc) await page.click('#cf-ok');
    const gone = await waitFor(page, () => !document.getElementById('na-root'));
    check('C5 Discard closes it', !!gone);

    await open();
    await page.click('#wz-pick-cancel');
    const quiet = await waitFor(page, () => !document.getElementById('na-root') && !document.getElementById('confirm-overlay'));
    check('C5 with nothing typed, Cancel just closes — no question', !!quiet);

    /* C6: a refused Create, on a HaTi row. */
    await open();
    await page.evaluate(() => document.querySelector('[data-wz-tid]').click());
    await waitFor(page, () => !!document.getElementById('wz-cpemail'));
    await page.evaluate(() => { const e = document.getElementById('wz-cpemail'); e.value = 'not-an-address';
      e.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.click('#na-create');
    const err = await waitFor(page, () => {
      const e = document.getElementById('wz-err'); if (!e || !e.textContent.trim()) return null;
      e.scrollIntoView({ block: 'center' });
      const r = e.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + 4, r.top + r.height / 2);
      return { text: e.textContent.trim(), painted: !!hit && (hit === e || e.contains(hit)),
        toast: ((document.getElementById('toast-root') || {}).textContent || '').trim() };
    });
    check('C6 the refusal prints under the boxes', !!(err && err.painted), err && err.text);
    check('C6 and no toast sits over the buttons', !!err && !err.toast, err && err.toast);
    check('C6 nothing was created', await page.evaluate(() => !!document.getElementById('na-root')));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { console.error(e); fail++; }
  finally { await browser.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
