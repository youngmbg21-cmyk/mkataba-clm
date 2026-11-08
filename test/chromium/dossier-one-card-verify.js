/* THE DOSSIER'S TOP IS ONE CARD (owner picked "One card", 8 Nov 2026: "I want 1 card but the read it, watch the read and
   the brief need to be better designed. May be like: 'Read it | Watch the read | The brief' in green and underlined").
   New look on, a paper that arrived 10 Sep with three changes of ours not sent and no read yet, at the owner's three screens:
     1 · one grey card: where it stands ("Negotiate · 1 to do") and six dots whose label says every stage; the next step
         as its heading; one sentence (who it goes to, what follows); the step's door the one full-width black button
     2 · its foot: Jambo's read in one line, no cost said (owner: "remove anything related to jambo calls"); then
         "Read it | Watch the read" as green underlined links divided by "|", on one line ("| The brief" once a brief is kept)
     3 · the doors are the existing ones: the button opens Send; Watch the read opens the read
   At the parent 1–3 fail: three lines (a wrapping stages line, a sentence with a link, a grey line of four links).
   Run: node test/chromium/dossier-one-card-verify.js (ONECARD_SHOTS=<dir> takes the pictures) */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const SHOTS = process.env.ONECARD_SHOTS || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const HTML = '<h1>Corporate Professional Services Agreement</h1><p>Between Highland Corporate Ltd and Jumenza LLC</p>'
  + '<h2>1. Services</h2><p>The Provider shall perform the professional services described in each statement of work.</p>'
  + '<h2>2. Fees</h2><p>The Company shall pay the fees set out in each statement of work within 30 days of invoice.</p>'
  + '<h2>3. Confidentiality</h2><p>Each party shall keep the other party\'s confidential information secret.</p>'
  + '<h2>4. Term</h2><p>This agreement runs for two years from the effective date.</p>';

(async () => {
  const h = await startHati();
  const b = fixtureContract('MK-408', 'Corporate Professional Services Agreement', 'Jumenza LLC', 'proc', 36000000, 'Under Review', 'x');
  Object.assign(b, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: { effDate: '2026-10-01' }, effectiveDate: '2026-10-01',
    upload: { name: 'Corporate_Professional_Services.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: '2026-09-10T09:00:00Z', uploadedBy: 'Amina Otieno' } });
  await seedWorkspace(h, { contracts: [b], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, W, H] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof roomHomeLand === 'function' && typeof currentUser === 'function' && !!currentUser(), null, 40000);
      /* three changes of ours, filed through the one funnel, not sent (the first page files them; the rest read them) */
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply();
        const c = getContract('MK-408'); if (window.ensureFull) await ensureFull(c);
        if (!(c.changes || []).length){
          for (const cl of negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front').slice(0, 3)){
            const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
            await negoEditClause(c, cl.clauseId, body.replace(/<\/p>\s*$/, ' as agreed in writing.</p>'), { side: 'owner', author: 'Amina Otieno' }); }
          await persist(c); }
        roomHomeLand('MK-408'); });
      const up = await until(page, () => !!document.querySelector('#ig-dock .pd2-card .pd2-card-go'), null, 20000);
      await page.evaluate(() => document.fonts && document.fonts.ready);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/one-card-${nm}.png` });
      const C = up ? await page.evaluate(() => { const c = document.querySelector('#ig-dock .pd2-card'), r = c.getBoundingClientRect();
        const go = c.querySelector('.pd2-card-go'), gr = go.getBoundingClientRect(), dots = c.querySelectorAll('.pd2-spine i');
        const links = [...c.querySelectorAll('.pd2-card-links .ui-link')], L = links.map(a => ({ t: a.textContent.trim(), color: getComputedStyle(a).color, under: getComputedStyle(a).textDecorationLine }));
        const tops = new Set(links.map(a => Math.round(a.getBoundingClientRect().top)));
        return { at: c.querySelector('.pd2-card-top > span').textContent.trim(), dots: dots.length, label: c.querySelector('.pd2-spine').getAttribute('aria-label'),
          head: c.querySelector('.pd2-next').textContent.trim(), say: (c.querySelector('.pd2-card-say') || {}).textContent || '',
          go: go.textContent.trim(), goBg: getComputedStyle(go).backgroundColor, goFull: Math.abs((r.width - 32) - gr.width) < 2,
          read: c.querySelector('.pd2-read').textContent.trim(), L, oneLine: tops.size === 1,
          seps: [...c.querySelectorAll('.pd2-card-sep')].map(x => x.textContent), cardBg: getComputedStyle(c).backgroundColor,
          accent: getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').trim(), old: !!document.querySelector('#ig-dock .pd2-dossier > .pd2-spine, #ig-dock .pd2-dossier > .pd2-next') }; }) : null;
      check(`${nm} 1 one card: where it stands and six dots, the next step as its heading, one sentence, one full-width black button`,
        !!C && C.at === 'Negotiate · 1 to do' && C.dots === 6 && /Arrived 10 Sep.*Negotiate, 1 to do.*Sign, 1 to do.*Live/.test(C.label) && C.head === 'Send your 3 changes'
        && /They go to Jumenza LLC together\./.test(C.say) && /Sign has 1 thing to do after this\./.test(C.say) && C.go === 'Send 3 changes' && C.goFull && C.goBg !== C.cardBg && !C.old, C);
      check(`${nm} 2 the foot: the read in one line, no cost; "Read it | Watch the read" green, underlined, one line`,
        !!C && C.read === 'Jambo has not read the paper yet' && !/call|free|cost/i.test(C.read + C.say) && C.L.map(x => x.t).join('|') === 'Read it|Watch the read'
        && C.seps.join('') === '|' && C.L.every(x => /underline/.test(x.under) && x.color === C.L[0].color) && C.oneLine, C && { read: C.read, L: C.L, seps: C.seps, oneLine: C.oneLine });
      /* 3 · the doors are the existing ones (once, at the first screen) */
      if (nm === 'laptop-a' && up){
        await page.click('#ig-dock .pd2-card [data-pd2-wk-open]');
        const walk = await until(page, () => !!document.getElementById('pd2-walk-head'), null, 8000);
        if (walk){ await page.click('[data-pd2-wk-speed="fast"]'); await page.click('[data-pd2-wk-play]'); }
        if (SHOTS && walk){ await until(page, () => /Reading § 2/.test((document.getElementById('pd2-walk-foot') || {}).textContent || ''), null, 8000); await page.screenshot({ path: `${SHOTS}/one-card-read-${nm}.png` }); }
        const walked = walk && await until(page, () => /Read whole/.test((document.getElementById('pd2-walk-foot') || {}).textContent || ''), null, 30000);
        const secs = await page.evaluate(() => (document.getElementById('pd2-walk-foot') || {}).textContent || '');
        await page.evaluate(() => pd2WalkClose());
        await until(page, () => !!document.querySelector('#ig-dock .pd2-card .pd2-card-go'), null, 8000);
        await page.click('#ig-dock .pd2-card .pd2-card-go');
        const send = await until(page, () => !!document.querySelector('#modal-root [data-sh-page], #share-send, #sh-letter'), null, 10000);
        check('3 the doors are the existing ones: the button opens Send, Watch the read opens the read and reads to the end', send && walk && walked, { send, walk, walked, secs });
      }
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
