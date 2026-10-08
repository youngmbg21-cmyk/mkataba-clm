/* Chromium verification: THE BRAIN'S LANES (Young picked "Swimlane" off the
   Brain Lanes proposal and approved its rule, 8 Oct 2026: "build Brain lanes").
   ====================================================================
   f564 pins the catalogue (every part in one lane, every step a stage). This
   file measures what a reader SEES on the real Brain page: the fourth view by
   its button and by the key 4, one box per step of the playing flow, the four
   lanes and the stages named, the canvas stepping aside, the light walking
   the steps, a box pressed plays from its step, a gate an admin has switched
   off drawn amber, a known problem's red label opening its reason (on the
   board and in the side panel) and closing on Esc, the sub-title's counts
   matching the boxes, and the Swedish words.
   Every claim is GATED on the thing it measures being on the page, so a build
   without the view REPORTS its failures rather than timing out.
   AT THE PARENT (9ee408d) every check but the page-error sweep FAILS: there is
   no fourth view.
   Run: node test/chromium/brain-lanes-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'brain-lanes');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

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
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }
    const door = await page.$('[data-view="brain"]');
    if (door) await door.click();
    await page.waitForFunction(() => window.state && state.view === 'brain' && !!document.getElementById('br-cv'), null, { timeout: 15000 }).catch(() => {});

    /* ---- 1. the fourth view ---- */
    const btn = await page.$('[data-br-view="3"]');
    ok('1a a fourth view button, "Lanes", sits after Floors', !!btn && /Lanes/.test(await btn.textContent()), btn ? (await btn.textContent()).trim() : 'no button');
    if (!btn) throw new Error('no Lanes view on this build');
    await btn.click();
    await page.waitForFunction(() => document.querySelectorAll('#br-lanes .br-lb').length > 0, null, { timeout: 5000 }).catch(() => {});
    const s1 = await page.evaluate(() => {
      const f = (window._brPlayingFlow && window._brPlayingFlow()) || null;
      const cv = getComputedStyle(document.getElementById('br-cv')).display;
      const title = document.getElementById('br-ov-t').textContent;
      const lanes = [...document.querySelectorAll('#br-lanes .br-ln-lane')].map(t => t.textContent).join(' ');
      const stages = [...document.querySelectorAll('#br-lanes .br-ln-stage')].map(t => t.textContent);
      const flow = document.querySelector('.br-flow[aria-pressed="true"]');
      const fid = flow ? flow.getAttribute('data-br-flow') : '';
      const steps = (BRAIN_FLOWS.find(x => x.id === fid) || { steps: [] }).steps.length;
      return { cv, title, lanes, stages, fid, steps, boxes: document.querySelectorAll('#br-lanes .br-lb').length,
        pressed: document.querySelector('[data-br-view="3"]').getAttribute('aria-pressed') };
    });
    ok('1b pressing it names the view and lights the button', /Lanes view/.test(s1.title) && s1.pressed === 'true', s1.title);
    ok('1c the canvas steps aside while the lanes show', s1.cv === 'none', 'canvas display ' + s1.cv);
    ok('1d one box per step of the playing flow', s1.boxes > 0 && s1.boxes === s1.steps, s1.fid + ': ' + s1.boxes + ' boxes, ' + s1.steps + ' steps');
    ok('1e the four lanes are named', /Contract owner/.test(s1.lanes) && /HaTi/.test(s1.lanes) && /other side/.test(s1.lanes) && /Colleague/.test(s1.lanes), s1.lanes);
    ok('1f the stage is named over its columns', s1.stages.length > 0, s1.stages.join(' · '));
    await page.screenshot({ path: path.join(OUT, '1-lanes.png') });

    /* ---- 2. the light walks the steps; a box plays from its step ---- */
    const now0 = await page.evaluate(() => { const g = document.querySelector('#br-lanes .br-lb.is-now'); return g ? +g.getAttribute('data-br-step') : -1; });
    await page.click('[data-br-speed="2"]');
    await page.waitForTimeout(2400);
    const now1 = await page.evaluate(() => { const g = document.querySelector('#br-lanes .br-lb.is-now'); return g ? +g.getAttribute('data-br-step') : -1; });
    ok('2a the lit box moves on as the flow plays', now1 > now0, now0 + ' → ' + now1);
    const dot = await page.evaluate(() => { const d = document.getElementById('br-ldot'); return d ? d.getAttribute('transform') || '' : ''; });
    ok('2b the light sits on the board', /translate\(/.test(dot), dot);
    await page.click('#br-lanes .br-lb[data-br-step="2"]');
    await page.waitForTimeout(150);
    const jumped = await page.evaluate(() => { const g = document.querySelector('#br-lanes .br-lb.is-now'); const s = document.querySelector('.br-st.is-now .br-st-k'); return [g ? +g.getAttribute('data-br-step') : -1, s ? +s.textContent : 0]; });
    ok('2c pressing a box plays from that step, and the panel agrees', jumped[0] === 2 && jumped[1] === 3, 'board ' + jumped[0] + ', panel step ' + jumped[1]);

    /* ---- 3. File a redline: a gate switched off, a known problem ---- */
    await page.click('.br-flow[data-br-flow="redline"]');
    await page.waitForFunction(() => document.querySelectorAll('#br-lanes .br-lb').length === 10, null, { timeout: 4000 }).catch(() => {});
    const s3 = await page.evaluate(() => {
      const box = i => document.querySelector('#br-lanes .br-lb[data-br-step="' + i + '"]');
      const gateOn = typeof reviewGateCfg === 'function' && !!reviewGateCfg().on;
      const pbBoxes = [...document.querySelectorAll('#br-lanes .br-lb.is-pb')].length;
      const pills = [...document.querySelectorAll('#br-lanes .br-lpb')].map(g => g.textContent);
      const gates = [...document.querySelectorAll('#br-lanes .br-lb.is-gate')].length;
      return { boxes: document.querySelectorAll('#br-lanes .br-lb').length, gateOn, review: box(5) ? box(5).getAttribute('class') : '', pills, pbBoxes, gates,
        sub: document.getElementById('br-ov-s').textContent };
    });
    ok('3a another flow redraws the board', s3.boxes === 10, s3.boxes + ' boxes');
    ok('3b internal review, switched off in Settings, is drawn as a gate', !s3.gateOn && /is-gate/.test(s3.review), 'review gate on: ' + s3.gateOn + ' · ' + s3.review);
    ok('3c the known problem carries its red label on the board', s3.pills.length > 0 && /Email replies go unread/.test(s3.pills.join(' ')), s3.pills.join(' | '));
    const subN = (s3.sub.match(/known problems: (\d+)/) || [])[1], subG = (s3.sub.match(/switched off: (\d+)/) || [])[1];
    ok('3d the sub-title counts what the board draws', +subN === s3.pills.length && +subG === s3.gates, s3.sub + ' · drawn ' + s3.pills.length + ' labels, ' + s3.gates + ' gates');
    await page.screenshot({ path: path.join(OUT, '2-redline.png') });
    const pinned = await page.evaluate(async () => {
      const sc = document.getElementById('br-ln-scroll'), nm = document.querySelector('.br-ln-names .br-ln-lane');
      if (!sc || !nm) return null;
      sc.scrollLeft = sc.scrollWidth; await new Promise(r => setTimeout(r, 80));
      const r = nm.getBoundingClientRect(), st = document.getElementById('br-stage').getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { left: Math.round(r.x - st.x), seen: !!el && !!el.closest('.br-ln-names, .br-lanes') };
    });
    ok('3e a wide flow scrolls beside its lane names, which stay in view', !!pinned && pinned.left < 20 && pinned.seen, JSON.stringify(pinned));

    /* ---- 4. the red label opens its reason, and Esc closes it ---- */
    await page.click('#br-lanes .br-lpb');
    await page.waitForTimeout(150);
    const pop = await page.evaluate(() => { const b = document.getElementById('br-pbpop'); return b && !b.hidden ? { t: b.textContent, r: b.getBoundingClientRect().toJSON() } : null; });
    ok('4a pressing the label opens the box with the reason and the fix', !!pop && /Known problem 1/.test(pop.t) && /The reason/.test(pop.t) && /Fixed looks like/.test(pop.t), pop ? pop.t.slice(0, 90) : 'no box');
    ok('4b the box is inside the window', !!pop && pop.r.x >= 0 && pop.r.y >= 0 && pop.r.x + pop.r.width <= 1440 && pop.r.y + pop.r.height <= 900, pop ? JSON.stringify(pop.r) : '');
    await page.screenshot({ path: path.join(OUT, '3-reason.png') });
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    ok('4c Esc closes it', await page.evaluate(() => document.getElementById('br-pbpop').hidden));
    const side = await page.$('.br-st-pb[data-br-pb="1"]');
    ok('4d the side panel carries the same label', !!side);
    if (side){ await side.click(); await page.waitForTimeout(150); }
    ok('4e and it opens the same reason', await page.evaluate(() => { const b = document.getElementById('br-pbpop'); return !b.hidden && /Email replies go unread/.test(b.textContent); }));
    await page.mouse.click(700, 120); await page.waitForTimeout(100);
    ok('4f a press elsewhere closes it', await page.evaluate(() => document.getElementById('br-pbpop').hidden));

    /* ---- 5. keys, the way back, the other language ---- */
    await page.keyboard.press('1'); await page.waitForTimeout(500);
    const back = await page.evaluate(() => ({ cv: getComputedStyle(document.getElementById('br-cv')).display, lanes: document.getElementById('br-lanes').hidden }));
    ok('5a the key 1 goes back to the brain and the canvas returns', back.cv !== 'none' && back.lanes, JSON.stringify(back));
    await page.keyboard.press('4'); await page.waitForTimeout(400);
    ok('5b the key 4 opens the lanes', await page.evaluate(() => !document.getElementById('br-lanes').hidden && document.querySelectorAll('#br-lanes .br-lb').length > 0));
    const sv = await page.$('.lang-btn[data-lang="sv"]');
    if (sv){ await sv.click(); await page.waitForTimeout(1500); }
    const svW = await page.evaluate(() => ({ t: (document.getElementById('br-ov-t') || {}).textContent || '', l: [...document.querySelectorAll('#br-lanes .br-ln-lane')].map(t => t.textContent).join(' ') }));
    ok('5c in Swedish the view and its lanes are named in Swedish', /Banvy/.test(svW.t) && /Motparten/.test(svW.l), svW.t + ' · ' + svW.l);
    await page.screenshot({ path: path.join(OUT, '4-swedish.png') });
    const en2 = await page.$('.lang-btn[data-lang="en"]'); if (en2) { await en2.click(); await page.waitForTimeout(600); }
  } catch (e) {
    ok('the run reached its end', false, String(e).slice(0, 200));
  } finally {
    ok('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
