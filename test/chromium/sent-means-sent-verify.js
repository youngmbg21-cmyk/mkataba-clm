/* Chromium verification: "SENT" MUST MEAN SENT, AT EVERY SEND DOOR
   (owner decision D1, 9 Oct 2026; f590 pins the rules in jsdom).
   ============================================================
   Driven twice: with email OFF (no provider — the test default and the real
   first-week state) and with a stubbed mail provider ON. On each:

     A. the send screen, email channel — the button, the contract's stage, the
        turn, the trail; OFF also presses "Copy link — I'll send it myself"
        and measures that THAT is the hand-over;
     B. the send screen, Word-file channel — the same four facts;
     C. Send all on Negotiate (#nego-send → onSendDirect →
        reshareToLastRecipient) onto a link made earlier — OFF the link never
        reached them, so the round hands nothing over; ON it did.

   Run: node test/chromium/sent-means-sent-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, startHatiWithMail, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));
/* A wait asks for the state, bounded — never a fixed pause standing in for it. */
async function waitFor(page, fn, arg, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    let v = null;
    try { v = await page.evaluate(fn, arg); } catch (_) { v = null; }
    if (v) return v;
    await pause(150);
  }
  return null;
}

const drafts = [
  { ...FIXTURES[1], id: 'MK-D1', name: 'Draft One', status: 'Draft' },
  { ...FIXTURES[1], id: 'MK-D2', name: 'Draft Two', status: 'Draft' },
  { ...FIXTURES[1], id: 'MK-D3', name: 'Draft Three', status: 'Draft' },
];

async function run(mode) {
  const on = mode === 'on';
  const h = on ? await startHatiWithMail() : await startHati();
  await seedWorkspace(h, { contracts: [...FIXTURES, ...drafts], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: h.base });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const tag = s => `${mode.toUpperCase()} ${s}`;
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(x => x.id === 'MK-D3'), null, 15000);

    const facts = id => page.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      const sh = (c.audit || []).filter(a => a.action === 'Shared').map(a => a.detail);
      return { status: c.status, turn: c.negotiation && c.negotiation.turn, last: sh[sh.length - 1] || '' };
    }, id);

    /* ---------- A + B: the send screen ---------- */
    for (const [id, ch] of [['MK-D1', 'email'], ['MK-D2', 'word']]) {
      await page.evaluate(async id => {
        const c = state.contracts.find(x => x.id === id);
        await ensureFull(c);
        await openShareModal(c, { purpose: 'negotiate' });
      }, id);
      await waitFor(page, () => !!document.getElementById('share-send') && !document.getElementById('share-send').disabled);
      if (ch === 'word') await page.evaluate(() => document.querySelector('[data-share-ch="word"]').click());
      await page.evaluate(() => {
        document.getElementById('sh-email').value = 'erik@nandi.example';
        const ack = document.getElementById('sh-ack'); if (ack) ack.checked = true;
        document.getElementById('share-send').click();
      });
      const lbl = await waitFor(page, () => {
        const t = (document.getElementById('sh-send-lbl') || {}).textContent || '';
        return /Sending/.test(t) ? null : (t && t !== 'Send by email' && !/^Send the file/i.test(t) ? t : null);
      });
      const f = await facts(id);
      if (on) {
        check(tag(`${ch}: the button says Sent`), /Sent/.test(lbl || '') && !/Queued|Not sent/.test(lbl || ''), lbl);
        check(tag(`${ch}: the contract left Drafting`), f.status === 'Under Review', f.status);
        check(tag(`${ch}: the move is theirs`), f.turn === 'counterparty', f.turn);
        check(tag(`${ch}: the trail says sent`), /^Sent to/.test(f.last), f.last);
        /* C4: after the first send nothing is pending — the room still says
           whose move it is, and it is theirs (their first look). */
        if (ch === 'email') {
          const mv = await page.evaluate(id => { const c = state.contracts.find(x => x.id === id);
            const m = negWhoseMove(c); const s = negoMoveSay(c); return { k: m.k, why: m.why, word: s.word, say: s.say }; }, id);
          check(tag('after the first send the move reads as theirs'), mv.k === 'them' && mv.why === 'firstlook' && /Nandi Dairy/.test(mv.say),
            JSON.stringify(mv));
        }
      } else {
        check(tag(`${ch}: the button says Queued — email isn't set up`), /Queued/.test(lbl || ''), lbl);
        check(tag(`${ch}: the contract is still a draft`), f.status === 'Draft', f.status);
        check(tag(`${ch}: the move is still ours`), f.turn !== 'counterparty', String(f.turn));
        check(tag(`${ch}: the trail says NOT sent`), /NOT sent/.test(f.last) && !/^Sent to/.test(f.last), f.last);
        const btn = await page.evaluate(() => {
          const b = document.getElementById('share-by-hand'); if (!b) return null;
          b.scrollIntoView({ block: 'center' });
          const r = b.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return { text: b.textContent.trim(), painted: !!hit && (hit === b || b.contains(hit)) };
        });
        check(tag(`${ch}: the result box carries the person's own hand-over`), !!(btn && btn.painted), btn && btn.text);
        if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/sent-means-sent-${mode}-${ch}.png` });
        if (btn) {
          await page.evaluate(() => document.getElementById('share-by-hand').click());
          await waitFor(page, id => state.contracts.find(x => x.id === id).status === 'Under Review', id);
          const g = await facts(id);
          check(tag(`${ch}: their press IS the hand-over`), g.status === 'Under Review' && g.turn === 'counterparty',
            `${g.status} / ${g.turn}`);
          check(tag(`${ch}: and the trail says who passed it on`), /themselves/.test(g.last), g.last);
        }
      }
      await page.evaluate(() => { try { closeModal(); } catch (_) {} });
      await pause(300);
    }

    /* ---------- C: Send all on Negotiate, onto a link made earlier ---------- */
    await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-D3');
      await ensureFull(c);
      const payload = buildSharePayload(c, await sha256(canonicalDoc(c)), null, { purpose: 'negotiate' });
      await api('shares', 'POST', { payload, channel: 'email', durable: true, purpose: 'negotiate',
        recipient: { name: 'Erik', email: 'erik@nandi.example' } });
      negoInit(c);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[cl.length - 1].clauseId, '<p>Each party shall keep the terms of this agreement strictly confidential.</p>',
        { side: 'owner', author: 'Amina Otieno', why: 'Tighter.' });
      persist(c); await flushSaves();
      window.__ow = openRedlineWorkbench(c.id, { blanksAsked: true });
    });
    await waitFor(page, () => state.view === 'redline');
    const sendBtn = await waitFor(page, () => {
      const b = document.getElementById('nego-send'); return b && !b.disabled ? true : null;
    }, null, 10000);
    if (!sendBtn) {
      const why = await page.evaluate(() => ({ view: state.view, btn: !!document.getElementById('nego-send'),
        dis: (document.getElementById('nego-send') || {}).disabled, modal: (document.getElementById('modal-root') || {}).textContent.slice(0, 200),
        changes: (state.contracts.find(x => x.id === 'MK-D3').changes || []).length }));
      console.log('DEBUG', JSON.stringify(why));
    }
    check(tag('Send all is on the page'), !!sendBtn);
    if (sendBtn) {
      /* Earlier stages' toasts are cleared, so the sentence read below is
         this press's own. */
      await page.evaluate(() => { const r = document.getElementById('toast-root'); if (r) r.innerHTML = '';
        document.getElementById('nego-send').click(); });
      /* SEND ALL SAYS WHAT TRAVELS (the owner's 9 Oct review, A7): a batch
         send to an address on file asks once, naming the changes, before
         anything goes. A person answers it; so does this check. */
      const asked = await waitFor(page, () => {
        const ok = document.querySelector('#confirm-overlay #cf-ok');
        return ok ? (document.getElementById('confirm-overlay').textContent || '').replace(/\s+/g, ' ').trim() : null;
      }, null, 5000);
      check(tag('Send all: asks once, naming what travels'), !!asked && /Send 1 change/i.test(asked) && /Each party shall keep/.test(asked), (asked || '').slice(0, 140));
      if (asked) await page.click('#confirm-overlay #cf-ok');
      await pause(400);
      const toastText = await waitFor(page, () => {
        const t = document.getElementById('toast-root'); const s = t && t.textContent.trim();
        return s && /Sent|Not sent|turn/i.test(s) ? s : null;
      });
      const f = await facts('MK-D3');
      if (on) {
        check(tag('Send all: the round reached them and the move is theirs'), f.turn === 'counterparty', f.turn);
        check(tag('Send all: it left Drafting'), f.status === 'Under Review', f.status);
      } else {
        check(tag('Send all: nothing handed over — the move is still ours'), f.turn !== 'counterparty', String(f.turn));
        check(tag('Send all: still a draft'), f.status === 'Draft', f.status);
        check(tag('Send all: the toast says it was not sent'), /Not sent/i.test(toastText || ''), toastText);
        /* AND ITS ACTION IS THE PERSON'S OWN HAND-OVER (roundReachedByHand). */
        const pressed = await page.evaluate(() => {
          const b = [...document.querySelectorAll('#toast-root button')].find(x => /send it/i.test(x.textContent || ''));
          if (!b) return false; b.click(); return true;
        });
        const g = pressed ? await waitFor(page, () => {
          const c = state.contracts.find(x => x.id === 'MK-D3');
          return c.negotiation && c.negotiation.turn === 'counterparty' ? c.status : null; }) : null;
        check(tag('Send all: "Copy link — I\u2019ll send it" hands over'), g === 'Under Review', String(g));
      }
    }
    check(tag('no page errors'), errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
}

(async () => {
  try { await run('off'); await run('on'); }
  catch (e) { console.error(e); results.push({ name: 'crashed', pass: false }); }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})();
