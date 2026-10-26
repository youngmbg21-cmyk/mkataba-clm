/* Chromium verification — A SIGNED COPY THAT DID NOT GO OUT IS SAID WHERE YOU
   LOOK (flag D of the flow report; the owner's "fix flag D", 26 Oct 2026).
   ============================================================
   Before: the receipt's last stop read "Sealed and sent · Copies to both
   sides" with its tick even where a copy had failed, and nothing reached the
   bell or Needs you — the failure lived only in the copies panel, low on the
   receipt. Driven for real, with email ON against a stand-in provider:

     1  the receipt of a signed contract, its copies panel's own Send pressed
        while the provider REFUSES: every copy is recorded as failed;
     2  the receipt's last stop is not ticked: "Sealed — a copy did not go out",
        whose copy, "Send again below", the amber "!", and the copies panel
        with its Send again right under it;
     3  Needs you holds one row for it, urgent, on Home and the bell's count;
        its words say whose copy and why;
     4  the row's button opens the receipt and lands on Send again, pressing
        nothing;
     5  the provider delivers, Send again is pressed: the stop says "Sealed and
        sent" with its tick and the row is gone;
     6  the owner's three screens: the stop and Send again in view, nothing
        sideways.
   Red at the parent: 2 and 3 (and 4, whose row does not exist).
   Run: node test/chromium/copies-not-out-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHatiWithMail, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
/* A WAIT ASKS FOR THE STATE, BOUNDED */
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_){ return false; } };
const ID = 'MK-A1';

(async () => {
  process.env.HATI_AGENTS_AUTO = 'off';
  const h = await startHatiWithMail({ mode: 'refuse', status: 422, message: 'The recipient address was rejected.' }, { HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => typeof window.getContract === 'function' && !!getContract('MK-A1'), null, 15000);

    /* ---- the stage: the signed contract is the reader's own, and its copies have somewhere to go ---- */
    const stage = await page.evaluate(async id => {
      const c = getContract(id); await ensureFull(c);
      const me = currentUser();
      c.owner = { id: me.id, name: me.name };
      delete c.distribution;
      if (typeof persist === 'function') persist(c);
      /* somebody to send the copies to, without touching the signed record: the company's records mailbox */
      state.settings = Object.assign({}, state.settings || {}, { recordsMailbox: 'records@example.co.ke' });
      const recs = (typeof distributionRecipients === 'function') ? distributionRecipients(c) : [];
      await new Promise(r => setTimeout(r, 1200));
      let kept = null; try { const x = await api('contracts/' + id); kept = !!(x && x.owner && String(x.owner.id) === String(me.id)); } catch (_){ kept = null; }
      return { status: c.status, owner: contractOwnedBy(c, me), kept, recipients: recs.map(r => r.email) };
    }, ID);
    check('0 · stage: a signed contract the reader owns, with somebody to send its copies to',
      stage.status === 'Signed' && stage.owner && stage.recipients.length >= 1, stage);

    /* ---- 1 · the receipt, and its own Send pressed while the provider refuses ---- */
    await page.evaluate(id => roomOpenAt(id, 'sign'), ID);
    const face = await until(page, () => !!document.querySelector('#pd-signface [data-pd-road-stop="sealed"]') && !!document.querySelector('#pd-signface #dist-send'), null, 10000);
    check('1a the receipt opens beside the paper with the copies panel and its Send', face);
    if (face){
      await page.locator('#pd-signface #dist-send').scrollIntoViewIfNeeded();
      await page.click('#pd-signface #dist-send');
    }
    const sent = await until(page, id => { const c = getContract(id); const d = c && c.distribution;
      return !!(d && d.at && Array.isArray(d.recipients) && d.recipients.length); }, ID, 15000);
    const rec = await page.evaluate(id => ((getContract(id).distribution || {}).recipients || []).map(r => r.status), ID);
    check('1b the provider refused: every copy is recorded as failed', sent && rec.length && rec.every(s => s === 'failed'), rec);

    /* ---- 2 · the receipt's last stop says it ---- */
    const stopOk = await until(page, () => { const s = document.querySelector('#pd-signface [data-pd-road-stop="sealed"]');
      return !!s && /did not go out/.test(s.textContent); }, null, 6000);
    const stop = await page.evaluate(() => {
      const s = document.querySelector('#pd-signface [data-pd-road-stop="sealed"]');
      const dot = s && s.querySelector('.pd-road-dot');
      const send = document.querySelector('#pd-signface #dist-send');
      const sr = s && s.getBoundingClientRect(), br = send && send.getBoundingClientRect();
      return { text: s ? s.textContent.replace(/\s+/g, ' ').trim() : '', done: !!(s && s.classList.contains('is-done')),
        now: !!(s && s.classList.contains('is-now')), dot: dot ? dot.textContent.trim() : '',
        sendBelow: !!(sr && br && br.top >= sr.bottom - 1), sendWord: send ? send.textContent.trim() : '' };
    });
    check('2a the last stop is not ticked "Sealed and sent": it says a copy did not go out, and to whom',
      stopOk && !stop.done && /Sealed — a copy did not go out|copies not delivered/.test(stop.text) && !/Sealed and sent/.test(stop.text) && /Send again below/.test(stop.text), stop.text);
    check('2b it wears the amber "!" of the stop that needs you', stop.now && stop.dot === '!', stop);
    check('2c the copies panel’s Send again stands right under it', stop.sendBelow && /Send again/.test(stop.sendWord), stop);
    if (OUT) await page.screenshot({ path: path.join(OUT, 'copies-receipt-1440x900.png') });

    /* ---- 3 · Needs you: Home and the bell ---- */
    const need = await page.evaluate(id => {
      const c = getContract(id);
      const L = needsYouOf(c).filter(x => x.kind === 'copies');
      const w = L[0] ? insNeedWords(c, L[0]) : null;
      return { n: L.length, urgent: !!(L[0] && L[0].urgent), title: w ? w.title : '', plain: w ? w.plain : '',
        desk: ndRead().you.some(r => r.key === 'c:' + id + ':copies'), bell: counterNeedsCount() };
    }, ID);
    check('3a Needs you holds one urgent row: "A signed copy did not go out", whose and why',
      need.n === 1 && need.urgent && /A signed copy did not go out/.test(need.title) && /could not be delivered/.test(need.plain), need);
    check('3b the one desk carries it, so Home and the bell count it', need.desk && need.bell >= 1, need);
    await page.evaluate(() => setView('counter'));
    const homeRow = await until(page, id => !!document.querySelector(`[data-nd-row="c:${id}:copies"]`), ID, 8000);
    const rowWords = await page.evaluate(id => { const r = document.querySelector(`[data-nd-row="c:${id}:copies"]`);
      const b = r && r.querySelector('button'); return { text: r ? r.textContent.replace(/\s+/g, ' ').trim() : '', btn: b ? b.textContent.trim() : '' }; }, ID);
    check('3c Home shows the row, with its one-word button', homeRow && /did not go out/.test(rowWords.text) && rowWords.btn === 'Look', rowWords);

    /* ---- 4 · its button lands on Send again, pressing nothing ---- */
    if (homeRow){
      const before = await page.evaluate(id => JSON.stringify(getContract(id).distribution), ID);
      await page.click(`[data-nd-row="c:${ID}:copies"] button`);
      const landed = await until(page, () => { const b = document.querySelector('#pd-signface #dist-send'); if (!b) return false;
        const r = b.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight; }, null, 8000);
      const after = await page.evaluate(id => JSON.stringify(getContract(id).distribution), ID);
      check('4 the row’s button opens the receipt with Send again in view, and sends nothing by itself', landed && after === before, { landed, same: after === before });
    } else check('4 the row’s button opens the receipt with Send again in view, and sends nothing by itself', false, 'no row');

    /* ---- 6 · the owner's three screens, while a copy is out ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht });
      await page.evaluate(id => roomOpenAt(id, 'sign'), ID);
      await until(page, () => !!document.querySelector('#pd-signface [data-pd-road-stop="sealed"]'), null, 6000);
      await page.evaluate(() => { const s = document.querySelector('#pd-signface [data-pd-road-stop="sealed"]'); if (s) s.scrollIntoView({ block: 'start' }); });
      const fit = await page.evaluate(() => {
        const s = document.querySelector('#pd-signface [data-pd-road-stop="sealed"]');
        const b = document.querySelector('#pd-signface #dist-send');
        const t = s && s.querySelector('.pd-road-t');
        const side = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
        const host = document.getElementById('pd-signface'); const hr = host && host.getBoundingClientRect();
        const inPanel = el => { if (!el || !hr) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= hr.left - 1 && r.right <= hr.right + 1; };
        return { side, stop: inPanel(t), send: inPanel(b), sendOneLine: !!b && b.getBoundingClientRect().height <= 44 };
      });
      check(`6 ${w}×${ht}: the stop's words and Send again sit inside the panel, Send again on one line, nothing sideways`,
        fit.side && fit.stop && fit.send && fit.sendOneLine, fit);
      if (OUT) await page.screenshot({ path: path.join(OUT, `copies-receipt-${w}x${ht}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ---- 5 · the provider delivers, Send again: ticked again, and the row goes ---- */
    h.mail.setMode('ok');
    await page.evaluate(id => roomOpenAt(id, 'sign'), ID);
    await until(page, () => !!document.querySelector('#pd-signface #dist-send'), null, 8000);
    await page.locator('#pd-signface #dist-send').scrollIntoViewIfNeeded();
    await page.click('#pd-signface #dist-send');
    const ok = await until(page, id => { const d = getContract(id).distribution;
      return !!(d && Array.isArray(d.recipients) && d.recipients.length && d.recipients.every(r => r.status === 'delivered')); }, ID, 15000);
    const tick = await until(page, () => { const s = document.querySelector('#pd-signface [data-pd-road-stop="sealed"]');
      return !!s && s.classList.contains('is-done') && /Sealed and sent/.test(s.textContent); }, null, 6000);
    const gone = await page.evaluate(id => needsYouOf(getContract(id)).every(x => x.kind !== 'copies') && !ndRead().you.some(r => r.key === 'c:' + id + ':copies'), ID);
    check('5 delivered on Send again: the stop says "Sealed and sent" with its tick, and the row is gone', ok && tick && gone, { ok, tick, gone });

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the stage ran to the end', false, String(e && e.message || e).split('\n')[0]);
  } finally {
    await browser.close();
    await h.stop();
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - failed} of ${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }
})();
