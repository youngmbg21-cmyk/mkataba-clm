/* BANNER-AND-ANSWER-TOP — two asks of the owner's, 20 Oct 2026:

     1  the Reading banner over Redlines: "the use of space in the banner is
        poor. The ask to join could be at the top as well so space is not
        wasted at the bottom of the banner" — Ask to join and the × ride the
        tag's line, the sentence under them, no line of its own for the button
     2  "when the output or answer is given by jambo, the page pushes me to
        the bottom of the output and i have to scroll up to begin reading. I
        should start from the top where the answer starts then scroll down":
        a long answer in Jambo's panel lands with its first line in view

   Run: node test/chromium/banner-and-answer-top-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

const TEXT = ['1. Definitions', 'In this Agreement the words below have the meanings given.',
  '2. Liability', 'The Supplier is liable for all loss, without limit.'].join('\n\n');
const BODY = TEXT.split('\n\n').map(p => /^\d+\./.test(p) ? `<h2>${p}</h2>` : `<p>${p}</p>`).join('');
const FIRST = 'START OF THE ANSWER: here is how to approach the liability cap.';
const LONG = [FIRST].concat(Array.from({ length: 30 }, (_, i) => `Point ${i + 1}: a sentence long enough to take a line or two in the panel, so the answer is far taller than the room it has.`)).join('\n\n');

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-BA1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich',
    /* somebody else leads this negotiation: the admin only reads it */
    desk: { leadId: 'u_someone_else', leadName: 'Young Mbagaya', members: [{ id: 'u_someone_else', name: 'Young Mbagaya', role: 'lead' }] },
    upload: { name: 'Supply.docx', extractedText: TEXT } } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(id => window.state && state.contracts && state.contracts.some(c => c.id === id), ID, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    console.log('\n1 · the Reading banner: Ask to join on the top line');
    await page.evaluate(id => openRedlineWorkbench(id), ID);
    const b = await until(() => { const n = document.querySelector('.rl-notices .dk-notice'); if (!n) return null;
      const r = e => e && e.getBoundingClientRect();
      const tag = r(n.querySelector('.dk-notice-tag')), btn = r(n.querySelector('.dk-notice-btn')), x = r(n.querySelector('.dk-notice-x')), txt = r(n.querySelector('.dk-notice-txt'));
      if (!tag || !btn || !txt) return null;
      const mid = q => q.top + q.height / 2;
      return { tagBtn: Math.round(Math.abs(mid(tag) - mid(btn))), tagX: x ? Math.round(Math.abs(mid(tag) - mid(x))) : null,
        btnRight: Math.round(r(n).right - btn.right), txtBelow: Math.round(txt.top - Math.max(tag.bottom, btn.bottom)),
        lastLine: Math.round(r(n).bottom - txt.bottom), h: Math.round(r(n).height) }; }, null, 12000);
    check('1a the banner is drawn', !!b, JSON.stringify(b));
    check('1b Ask to join sits on the tag\'s line', !!b && b.tagBtn <= 6, b && b.tagBtn);
    check('1c … with the × on the same line', !!b && b.tagX != null && b.tagX <= 6, b && b.tagX);
    check('1d … at the right of it', !!b && b.btnRight <= 60, b && b.btnRight);
    check('1e the sentence is under them, and the banner ends with it (no line for the button)', !!b && b.txtBelow >= 0 && b.lastLine <= 16, b && JSON.stringify({ below: b.txtBelow, last: b.lastLine }));
    await shot(page, '1-banner');

    console.log('\n2 · a long answer starts at its first line');
    ai.script([{ type: 'tool_use', id: 'tu_a', name: 'deliver_answer', input: { answer: LONG, citations: [] } }]);
    await page.evaluate(() => { state.aiConfigured = true; });
    await page.fill('#igd-input', 'how should I approach the liability cap in this contract?');
    await page.press('#igd-input', 'Enter');
    const land = await until(f => { const feed = document.getElementById('igd-feed'); if (!feed || feed.hidden) return null;
      const all = [...feed.querySelectorAll('.ai-msg')]; const last = all[all.length - 1];
      if (!last || !last.textContent.includes('START OF THE ANSWER') || last.querySelector('.typing')) return null;
      const sc = feed, fr = sc.getBoundingClientRect();
      const tw = document.createTreeWalker(last, NodeFilter.SHOW_TEXT); let first = null;
      while (tw.nextNode()) if (tw.currentNode.nodeValue.includes(f)) { first = tw.currentNode.parentElement; break; }
      const q = first && first.getBoundingClientRect();
      return { tall: sc.scrollHeight > sc.clientHeight + 100, firstInView: !!q && q.top >= fr.top - 2 && q.bottom <= fr.bottom + 2,
        atBottom: Math.abs(sc.scrollTop - (sc.scrollHeight - sc.clientHeight)) <= 2, top: q ? Math.round(q.top - fr.top) : null }; }, FIRST, 20000);
    check('2a the answer is far taller than the panel (the case being measured)', !!land && land.tall, JSON.stringify(land));
    check('2b its first line is in view', !!land && land.firstInView, land && land.top);
    check('2c … and the panel is not pushed to the answer\'s end', !!land && !land.atBottom);
    await shot(page, '2-answer-top');
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
