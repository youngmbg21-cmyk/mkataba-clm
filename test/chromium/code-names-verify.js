/* CODE NAMES FOR CONFIDENTIAL DEALS — THE DETAILS LINE AND THE STAND-IN
   (owner picked "A code name field — the SAP way", 17 Oct 2026; piece 11 of
   the sensitive contracts and governance plan)

   WHAT THIS PINS, driven in a real browser (the server's wall — the front
   door, the mask, the files, the emails, Jambo — is f704's)
     1 the deal's owner finds one line on its Details: "Code name · None —
       everyone who may open it sees its real name · Give it a code name ›"
     2 its dialog: the code name, who knows the real name (the owner always),
       the real name said; Save → an 'ok' and the line says the code and who
       knows
     3 somebody outside the list: the deal is "Project Falcon" on the list,
       its real name and party nowhere in the page or the book it holds; its
       panel says the real name is shown only to the people on the deal; every
       door says why it stays shut
     4 the owner's three screens: the line and the dialog fit
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/code-names-verify.js */
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
const REAL = 'Exclusive Distribution — Carrefour Kenya', PARTY = 'Carrefour Kenya';

(async () => {
  const h = await H.startHati();
  const W = await H.seedWorkspace(h, { approvalRules: [], contracts: [
    H.fixtureContract('FAL-1', REAL, PARTY, H.FOLDER_B, 9e8, 'Under Review'),
    H.fixtureContract('OTH-1', 'Shelf placement — Quickmart', 'Quickmart', H.FOLDER_B, 2e6, 'Signed'),
  ] });
  const U = W.users.unrestricted, N = W.users.novalues;
  { const c = await W.admin.json('/api/contracts/FAL-1'); const v = c._v; delete c._v; c.owner = { id: U.id, name: U.name };
    await W.admin.json('/api/contracts/FAL-1', { method: 'PUT', body: { contract: c, baseVersion: v } }); }
  /* this quarter's access review is done: its ask is not what this check reads */
  for (const u of Object.values(W.users)) await W.admin.json('/api/access-review/mark', { method: 'POST', body: { userId: u.id, verdict: 'keep' } });
  await W.admin.json('/api/access-review/done', { method: 'POST', body: {} });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (email, pass) => {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'FAL-1'), null, { timeout: 20000 });
    return page;
  };
  try {
    let page = await open('everything@example.co.ke', 'their-own-pass-9');
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const line = () => until(() => { const r = document.querySelector('#kt-codename [data-cn-row]'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; }, null, 15000);
    /* RE-POINTED (B1 pass 4, round 7 as drawn: the code name is a row of Filing — "Code name · None · Everyone who may open it
       sees its real name · [Give it a code name]"): the row read by its parts, the key, the value, the line under it, its button */
    const parts = () => until(() => { const r = document.querySelector('#kt-codename [data-cn-row]'); if (!r) return null; const t = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      return { k: t(r.querySelector('.ov-fk')), v: t(r.querySelector('.ov-fv b')), sub: t(r.querySelector('.ov-fv .ov-fs')), btn: t(r.querySelector('[data-cn-edit]')) }; }, null, 15000);

    console.log('\n1 · the line on Details');
    await page.evaluate(() => roomOverviewOpen(getContract('FAL-1')));
    const l1 = await parts();
    check('1 "Code name · None · Everyone who may open it sees its real name. · Give it a code name"',
      !!l1 && l1.k === 'Code name' && l1.v === 'None' && l1.sub === 'Everyone who may open it sees its real name.' && l1.btn === 'Give it a code name', JSON.stringify(l1));

    console.log('\n2 · the dialog');
    if (await press('#kt-codename [data-cn-edit]', '2a Give it a code name')) {
      const d = await until(() => { const i = document.getElementById('cn-code'); const dlg = i && i.closest('[role="dialog"]'); if (!dlg) return null;
        const rows = [...dlg.querySelectorAll('#cn-people label')].map(l => ({ t: l.textContent.replace(/\s+/g, ' ').trim(), on: l.querySelector('input').checked, lock: l.querySelector('input').disabled }));
        return { text: dlg.textContent.replace(/\s+/g, ' ').trim(), rows, foot: [...dlg.querySelectorAll('[data-dlg-foot] button')].map(b => b.textContent.trim()) }; });
      const me = d && d.rows.find(r => /^Unrestricted Legal/.test(r.t));
      check('2a it asks the code name and who knows, the owner always on it; it says the real name; Save, Cancel last', !!d
        && /^Code name\s?Everyone outside the list sees the code name — in lists, search, the bell and Jambo — and cannot open the deal\./.test(d.text)
        && d.text.includes('Real name: ' + REAL) && !!me && me.on && me.lock && /you$/.test(me.t)
        && d.foot.join('|') === 'Save|Cancel', JSON.stringify(d && { ...d, text: d.text.slice(0, 200) }));
      await shot(page, 'code-name-dialog-1440x780');
      await page.fill('#cn-code', 'Project Falcon');
      await page.evaluate(id => { const i = document.querySelector(`#cn-people input[value="${id}"]`); if (i) i.checked = true; }, N.id);
      await press('#cn-save', '2b Save');
      const told = await until(() => { const t = (document.getElementById('toast-root') || {}).textContent || ''; return /know the real name/.test(t) ? t.replace(/\s+/g, ' ').trim() : null; });
      await until(() => { const r = document.querySelector('#kt-codename [data-cn-row]'); return r && /Project Falcon/.test(r.textContent) ? true : null; });
      const l2 = await parts();
      check('2b an \'ok\'; the row: "Code name · Project Falcon · who knows the real name: No Values Legal, Unrestricted Legal · Change"', !!told
        && /Project Falcon: 2 people know the real name\./.test(told)
        && !!l2 && l2.k === 'Code name' && l2.v === 'Project Falcon' && l2.sub === 'who knows the real name: No Values Legal, Unrestricted Legal' && l2.btn === 'Change', `${told} / ${JSON.stringify(l2)}`);
      await shot(page, 'code-name-line-1440x780');
    }
    const owner = page;

    console.log('\n3 · somebody outside the list');
    page = await open('admin@example.co.ke', 'adminpassword1');
    const book = await page.evaluate(([real, party]) => { const c = state.contracts.find(x => x.id === 'FAL-1');
      return { stub: c && { name: c.name, codeNamed: !!c._codeNamed, party: c.counterparty }, leak: [real, party].filter(t => JSON.stringify(state.contracts).includes(t)) }; }, [REAL, PARTY]);
    check('3a the book holds a stand-in: "Project Falcon", no party, the real name and party nowhere in it', !!book.stub && book.stub.name === 'Project Falcon'
      && book.stub.codeNamed && book.stub.party === '' && book.leak.length === 0, JSON.stringify(book));
    await page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); });
    const listed = await until(([real, party]) => { const t = document.body.innerText; return /Project Falcon/.test(t) ? { leak: [real, party].filter(x => t.includes(x)) } : null; }, [REAL, PARTY], 15000);
    check('3b on the Contracts list it is "Project Falcon"; the real name and party are not on the page', !!listed && listed.leak.length === 0, JSON.stringify(listed));
    await shot(page, 'code-name-outsider-list-1440x780');
    const panel = await page.evaluate(() => { const d = document.createElement('div'); d.innerHTML = insPanelHtml(getContract('FAL-1'), {}); return d.textContent.replace(/\s+/g, ' ').trim(); });
    check('3c its panel: "The real name is shown only to the people named on this deal." · Counterparty — (named on the deal only)',
      /The real name is shown only to the people named on this deal\./.test(panel) && /Counterparty\s?— \(named on the deal only\)/.test(panel), panel);
    await page.evaluate(() => regOpenContract('FAL-1'));
    const stop = await until(() => { const t = (document.getElementById('toast-root') || {}).textContent || ''; return /confidential deal/.test(t) ? t.replace(/\s+/g, ' ').trim() : null; });
    const where = await page.evaluate(() => (window.intel && intel.paper && intel.paper.id) || null);
    check('3d opening it says "Project Falcon is a confidential deal: only the people named on it may open it." and nothing opens', !!stop
      && /Project Falcon is a confidential deal: only the people named on it may open it\./.test(stop) && where !== 'FAL-1', `${stop} / ${where}`);
    await page.context().close();
    page = owner;

    console.log('\n4 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await page.evaluate(() => { closeModal(); roomOverviewOpen(getContract('FAL-1')); });
      await line();
      const fitLine = await page.evaluate(() => { const r = document.querySelector('#kt-codename [data-cn-row]'); const b = r.getBoundingClientRect();
        const go = r.querySelector('[data-cn-edit]'); const rg = document.createRange(); rg.selectNodeContents(go);
        return { inside: b.right <= innerWidth + 1, cut: rg.getBoundingClientRect().width > go.getBoundingClientRect().width + 1 }; });
      await page.evaluate(() => cnEditOpen(getContract('FAL-1')));
      const fitDlg = await until(() => { const i = document.getElementById('cn-code'); const dlg = i && i.closest('[role="dialog"]'); if (!dlg) return null;
        const r = dlg.getBoundingClientRect(), save = document.getElementById('cn-save').getBoundingClientRect();
        return { inside: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0, save: save.bottom <= innerHeight + 1 && save.width > 0 }; });
      await shot(page, `code-name-${vp.width}x${vp.height}`);
      check(`4 ${vp.width}×${vp.height}: the line and the dialog fit, Save on screen`, fitLine.inside && !fitLine.cut && !!fitDlg && fitDlg.inside && fitDlg.save, JSON.stringify({ fitLine, fitDlg }));
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
