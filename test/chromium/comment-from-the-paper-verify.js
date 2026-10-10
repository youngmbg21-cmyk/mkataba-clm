/* Chromium verification: A COMMENT ON HOME'S PAPER IS WRITTEN IN CHAT
   ============================================================
   Young, 10 Oct 2026 (the "HaTi Proposals" artifact, Part 2): "when i
   highlight and want to add a comment ... the comment should go to this
   panel". Highlight words on Home's Paper and press Comment:
     1. no pop-up asks for the note
     2. the Chat (Notes) panel opens with the highlighted words pinned whole
     3. Internal is the chosen room, and the caret is in the note box
     4. Add note puts the note in the thread
     5. no page errors
   Waits ask for the state, bounded. Red at main d259278 (1, 2, 3).
   Screenshots: test/chromium/shots/comment-from-the-paper/ (or HATI_SHOT_DIR).
   Run: node test/chromium/comment-from-the-paper-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'comment-from-the-paper');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2') && typeof pdOpenOnHome === 'function', null, { timeout: 20000 });
    await page.evaluate(() => pdOpenOnHome('MK-A2'));
    const opened = await until(() => !!document.querySelector('#ig-paper:not([hidden]) #ig-canvas [data-anchor]'), null, 15000);
    check('0. the contract is on Home\'s Paper', !!opened);
    if (!opened) throw new Error('no paper');
    /* highlight eight words inside a clause, as a mouse would, and let go */
    const picked = await page.evaluate(() => {
      const canvas = document.getElementById('ig-canvas');
      const host = [...canvas.querySelectorAll('[data-anchor] p, [data-anchor]')].find(el => el.textContent.trim().split(/\s+/).length > 14 && el.closest('[data-anchor]'));
      if (!host) return null;
      host.scrollIntoView({ block: 'center' });
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      let tn = null; while (walker.nextNode()){ if (walker.currentNode.textContent.trim().length > 40){ tn = walker.currentNode; break; } }
      if (!tn) return null;
      const t = tn.textContent, start = t.search(/\S/), words = t.slice(start).split(/\s+/).slice(0, 8).join(' ');
      const r = document.createRange(); r.setStart(tn, start); r.setEnd(tn, start + words.length);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      const b = r.getBoundingClientRect();
      return { words, x: b.left + b.width / 2, y: b.top + b.height / 2 };
    });
    check('0b. words are highlighted on the paper', !!picked, picked && picked.words);
    await page.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y);
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y })); }, picked);
    const menu = await until(() => { const m = document.querySelector('.nego-selmenu'); return m ? [...m.querySelectorAll('button')].map(b => b.textContent.trim()) : null; });
    check('0c. the highlight menu offers Comment', !!menu && menu.includes('Comment'), menu && menu.join(' · '));
    const at = await page.evaluate(() => { const b = [...document.querySelectorAll('.nego-selmenu button')].find(x => x.textContent.trim() === 'Comment');
      const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.click(at.x, at.y);
    const panel = await until(() => {
      const pin = document.querySelector('.rl-np-pin q'), on = document.querySelector('.rl-np-pinroom button.on');
      const box = document.querySelector('.rl-np-in');
      return pin ? { quote: pin.textContent, room: on ? on.textContent.trim() : '', caret: !!(box && document.activeElement === box) } : null;
    });
    const dialog = await page.evaluate(() => !!document.querySelector('#modal-root > *, .dlg-overlay, [role="dialog"] textarea'));
    check('1. no pop-up asks for the note', !dialog);
    check('2. the Chat panel opens with the words pinned whole', !!panel && panel.quote.replace(/\s+/g, ' ').includes(picked.words.replace(/\s+/g, ' ')), panel && panel.quote);
    check('3. Internal is chosen and the caret is in the note box', !!panel && /Internal/i.test(panel.room) && panel.caret, panel && JSON.stringify({ room: panel.room, caret: panel.caret }));
    await page.screenshot({ path: path.join(OUT, '1-pinned.png') });
    await page.fill('.rl-np-in', 'Where do we see these terms?');
    await page.click('.rl-np-send');
    const posted = await until(words => {
      const msgs = (getContract('MK-A2').messages || getContract('MK-A2').notes || []);
      const m = [...msgs].reverse().find(x => /Where do we see these terms/.test(String(x.text || x.body || '')));
      const inList = [...document.querySelectorAll('.rl-np')].some(el => /Where do we see these terms/.test(el.textContent));
      return (m || inList) ? { stored: !!m, anchored: !!(m && m.anchor && String(m.anchor.quote || '').includes(words.split(' ')[0])), shown: inList,
        body: m ? String(m.text || m.body) : '' } : null;
    }, picked.words);
    check('4. Add note puts it in the thread', !!posted && posted.shown && (!posted.stored || (posted.anchored && !/“/.test(posted.body))), posted && JSON.stringify(posted));
    await page.screenshot({ path: path.join(OUT, '2-posted.png') });
    check('5. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run stopped', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
