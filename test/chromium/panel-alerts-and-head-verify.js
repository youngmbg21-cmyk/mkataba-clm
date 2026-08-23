/* Chromium verification: THE PANEL IS WHERE ALERTS LIVE, AND THE HEAD IS BLACK
   ============================================================
   Owner-asked 23 Aug 2026, off two screenshots and a set of drawn renders:

     1. "Implement B1" — the Tracked Changes head redrawn: the count is the
        headline, the cut's name is its caption underneath, and ALL OF IT is
        the primary ink rather than the label grey.
     2. "I never want to see image one in the platform again" — four orange
        boxes stacked over the change column, each saying an answer from the
        other side could not be taken in. They are rows in the alerts panel now.
     3. "I do not understand the need for the highlighted alert. Get rid of it"
        — the WORKING TEXT lid on an uploaded contract whose wording has been
        edited.

   WHY A BROWSER. Every claim here is a computed value, a painted pixel, or an
   absence on a real page:

     · the head's rules are a block at the end of a 3,500-line stylesheet, and
       this codebase has been caught more than once by a rule that reads
       perfectly in the source and loses a cascade fight on the way to the
       screen. What is asked is what the page DRAWS;
     · a toast that is not fired leaves nothing for a source test to read. The
       only honest question is whether #toast-root is empty on the page that
       would have shown four of them;
     · and deleting the WORKING TEXT block outright would have taken the
       contract's own wording with it (once c.redlineText exists, the branch
       above stops drawing the file's text) — so the check is that the lid is
       gone AND the words are still there.

   THE CLAIMS ARE RELATIONS, NOT NUMBERS, wherever the number is incidental —
   the 22 Aug sweep that moved 1,994 font sizes cost five test edits, four of
   them exactly that mistake.

   Run: node test/chromium/panel-alerts-and-head-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const px = v => Number(String(v || '').replace('px', ''));

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ============================================================
       1 · THE TRACKED CHANGES HEAD — RENDER B1
       ============================================================ */
    const cid = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      await ensureFull(c); negoInit(c);
      const cl = negoClauseList(c);
      /* One of ours and one of theirs, so All/Mine/Theirs read 2/1/1 and the
         live tab can be told from the resting ones by more than luck. */
      await negoEditClause(c, cl[0].clauseId,
        cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(+String(m).replace(/,/g, '') + 500)),
        { author: 'Amina Otieno', side: 'owner', why: 'Ours.' });
      await negoEditClause(c, cl[1].clauseId,
        cl[1].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(+String(m).replace(/,/g, '') + 7)),
        { author: 'Ola Nordmann', side: 'counterparty', why: 'Theirs.' });
      persist(c); await flushSaves();
      return c.id;
    });
    await page.waitForTimeout(1200);
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await page.waitForTimeout(2400);

    const head = await page.evaluate(() => {
      const one = el => { if (!el) return null; const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { text: el.textContent.trim(), color: s.color, size: s.fontSize,
          weight: s.fontWeight, tt: s.textTransform,
          bb: s.borderBottomColor, bw: s.borderBottomWidth,
          bg: s.backgroundColor, bd: s.borderTopWidth,
          x: Math.round(r.left), y: Math.round(r.top), h: Math.round(r.height) }; };
      const cap = document.querySelector('.rl-idx-k');
      const tabs = [...document.querySelectorAll('[data-rl-cardfilter]')];
      return {
        cap: one(cap),
        /* THE TOKEN RESOLVED, NOT THE TOKEN'S TEXT. getPropertyValue hands
           back '#1B2A28' while every computed colour is 'rgb(27, 42, 40)', and
           comparing those two is a test that fails on a correct page. The body
           carries --color-text, so its own computed colour IS the ink. */
        ink: getComputedStyle(document.body).color,
        tabs: tabs.map(t => ({ key: t.getAttribute('data-rl-cardfilter'),
          on: t.classList.contains('on'), ...one(t),
          num: one(t.querySelector('.rl-fseg-n')),
          word: one(t.querySelector('.rl-fseg-w')) })),
      };
    });

    const live = head.tabs.find(t => t.on), resting = head.tabs.filter(t => !t.on);
    check('the head draws three cuts and exactly one is live',
      head.tabs.length === 3 && !!live && resting.length === 2,
      head.tabs.map(t => t.key + (t.on ? '*' : '')).join(' '));
    check('the count is the headline and the word is its caption',
      !!live && px(live.num.size) > px(live.word.size) + 4
        && live.num.y < live.word.y,
      live && `${live.num.size} over ${live.word.size}`);
    check('and the word reads as a label — uppercase, small, under it',
      !!live && live.word.tt === 'uppercase', live && live.word.tt);
    check('the counts are the real numbers, not decoration',
      head.tabs.map(t => t.num.text).join('/') === '2/1/1',
      head.tabs.map(t => t.key + ':' + t.num.text).join(' '));

    /* B1 IS "ALL OF IT BLACK". The caption and the two RESTING tabs take the
       primary ink; only the live one is coloured. Read against the token
       rather than against a typed hex, so a palette change costs no edit. */
    const ink = head.ink;
    check('the caption is the primary ink — B1\'s deliberate exception to the size rule',
      head.cap.color === ink, `${head.cap.color} vs ${ink}`);
    check('and so is every resting tab, number and word alike',
      resting.every(t => t.color === ink && t.num.color === ink && t.word.color === ink),
      resting.map(t => t.key + ':' + t.color).join(' '));
    check('the live tab is the ONE coloured thing on the row',
      !!live && live.color !== ink, live && live.color);
    check('and its number and word follow it — one colour declaration, both inherit',
      !!live && live.num.color === live.color && live.word.color === live.color,
      live && `${live.num.color} / ${live.word.color}`);
    /* The underline is --accent-solid and the ink is --accent-ink: two tokens
       on purpose, because the ink has to carry text at 11px in both themes and
       the rule does not. What the claim protects is that a rule really DRAWS —
       a 2px border declared and computing to 0 is this codebase's own recorded
       fault, and only a browser can tell them apart. */
    check('it is marked by an underline that really draws, in an accent',
      !!live && px(live.bw) >= 2 && !/rgba\(0, 0, 0, 0\)/.test(live.bb)
        && live.bb !== ink,
      live && `${live.bw} ${live.bb}`);
    check('the resting tabs carry the same reserved height and no visible rule',
      resting.every(t => px(t.bw) === px(live.bw) && t.bb !== t.color),
      resting.map(t => t.bw + ' ' + t.bb).join(' | '));

    /* THE BOX AND THE FILL ARE GONE. Render B of 22 Aug put every count in a
       hairline box and FILLED the live one; at 19px the size already says
       which is which, and two marks for one fact is how they disagree. */
    check('no count wears a box any more',
      head.tabs.every(t => px(t.num.bd) === 0 && /rgba\(0, 0, 0, 0\)/.test(t.num.bg)),
      head.tabs.map(t => t.num.bd + '/' + t.num.bg).join(' '));

    check('the caption sits on its own line above the tabs',
      head.cap.y + head.cap.h <= live.y + 2, `${head.cap.y}+${head.cap.h} vs ${live.y}`);
    check('and they share one left edge, so the head reads as one column',
      Math.abs(head.cap.x - head.tabs[0].x) <= 1, `${head.cap.x} vs ${head.tabs[0].x}`);

    /* AND IT STILL FILTERS. The three safety properties this control has
       carried since it came back are not a design decision anybody may drop:
       three options, each showing its OWN count unmoved by the filter, and a
       row of choices rather than a dropdown. */
    await page.click('[data-rl-cardfilter="theirs"]');
    await page.waitForTimeout(700);
    const filtered = await page.evaluate(() => ({
      on: (document.querySelector('[data-rl-cardfilter].on') || {}).getAttribute
        ? document.querySelector('[data-rl-cardfilter].on').getAttribute('data-rl-cardfilter') : null,
      counts: [...document.querySelectorAll('[data-rl-cardfilter] .rl-fseg-n')].map(n => n.textContent.trim()),
      cards: document.querySelectorAll('#rl-changes-col .rl-card, #rl-changes-col .rl-receipt').length,
    }));
    check('pressing a cut narrows the column', filtered.on === 'theirs' && filtered.cards === 1,
      JSON.stringify(filtered));
    check('and every count still shows its OWN number, unmoved by the filter',
      filtered.counts.join('/') === '2/1/1', filtered.counts.join('/'));
    await page.click('[data-rl-cardfilter="all"]');
    await page.waitForTimeout(500);

    /* THE DARK THEME FOLLOWS FROM THE TOKENS, or the live tab is a deep green
       on an almost-black panel — the exact fault the reviewer's own count was
       caught with on 22 Aug. */
    await page.evaluate(() => setTheme('dark'));
    await page.waitForTimeout(1200);
    const dark = await page.evaluate(() => {
      const t = document.querySelector('[data-rl-cardfilter].on');
      const s = t && getComputedStyle(t);
      const lum = c => { const m = /(\d+), (\d+), (\d+)/.exec(c || ''); if (!m) return null;
        const f = v => { v = v / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
        return .2126 * f(+m[1]) + .7152 * f(+m[2]) + .0722 * f(+m[3]); };
      const panel = getComputedStyle(document.querySelector('#rl-changes-col')).backgroundColor;
      const bg = /rgba\(0, 0, 0, 0\)/.test(panel)
        ? getComputedStyle(document.body).backgroundColor : panel;
      const a = lum(s && s.color), b = lum(bg);
      return { color: s && s.color, bg,
        ratio: (a == null || b == null) ? null
          : Math.round(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)) * 100) / 100 };
    });
    check('at night the live tab is still legible against its own panel',
      dark.ratio !== null && dark.ratio >= 4.5, JSON.stringify(dark));
    await page.evaluate(() => setTheme('light'));
    await page.waitForTimeout(1000);

    /* ============================================================
       2 · AN ANSWER THAT WILL NOT LAND IS A ROW, NOT FOUR ORANGE BOXES
       ============================================================
       The reported shape, staged for real: four answers queued on the server
       that this browser genuinely cannot apply. The contracts are taken out of
       state.contracts, which is exactly the condition that produced the
       screenshot — an answer naming a contract this page does not hold. */
    const staged = await page.evaluate(async () => {
      const live = state.contracts.filter(x => x.status !== 'Signed' && x.status !== 'Declined');
      const made = [];
      for (const c of live.slice(0, 2)){
        await ensureFull(c);
        const full = await api('contracts/' + c.id);
        const payload = buildSharePayload(full, await sha256(canonicalDoc(full)), null,
          { purpose: 'negotiate' });
        const r = await api('shares', 'POST', { payload, channel: 'link',
          recipient: { name: 'Juno Limited', email: 'ola@juno.se' },
          purpose: 'negotiate', durable: true });
        made.push({ id: c.id, token: r && r.token });
      }
      return made;
    });
    check('two live negotiate links were minted for the stage',
      staged.length === 2 && staged.every(s => s.token), JSON.stringify(staged.map(s => s.id)));

    /* Each counterparty answers. Posted straight at the public route, which is
       the road a real answer travels. */
    for (const s of staged){
      await page.evaluate(async ({ token, id }) => {
        await fetch('/api/shares/' + token + '/respond', { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          /* `kind` is not decoration: the route refuses anything without it
             with a bare "Invalid response", which is how a staged answer can
             quietly never exist and take the whole check with it. */
          body: JSON.stringify({ kind: 'hati-response', action: 'ready',
            name: 'Ola Nordmann', id }) });
      }, s);
    }
    await page.waitForTimeout(900);

    /* NOW MAKE THEM UNAPPLIABLE, which is the reported condition. */
    await page.evaluate(ids => {
      state.contracts = state.contracts.filter(c => !ids.includes(c.id));
    }, staged.map(s => s.id));

    await page.evaluate(() => { const r = document.getElementById('toast-root'); if (r) r.innerHTML = ''; });
    for (let i = 0; i < 4; i++){
      await page.evaluate(() => pollPendingResponses());
      await page.waitForTimeout(900);
    }
    const afterPolls = await page.evaluate(() => ({
      toasts: [...document.querySelectorAll('#toast-root > *')]
        .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)),
      stuck: (window.pollStuckAnswers ? pollStuckAnswers() : []).map(s => s.id),
      rows: buildAlerts().filter(r => r.kind === 'answer-stuck')
        .map(r => ({ id: r.id, tone: r.tone, text: r.text })),
    }));
    check('FOUR POLLS AND NOT ONE POP-UP — the reported boxes are gone',
      afterPolls.toasts.length === 0, JSON.stringify(afterPolls.toasts));
    check('but the fact is not lost — it is recorded',
      afterPolls.stuck.length === 2, JSON.stringify(afterPolls.stuck));
    check('and it is a row in the panel, one per answer, naming its contract',
      afterPolls.rows.length === 2
        && afterPolls.rows.every(r => staged.some(s => s.id === r.id)),
      JSON.stringify(afterPolls.rows.map(r => r.id)));
    check('amber, because it is work owed rather than a failure',
      afterPolls.rows.every(r => r.tone === 'amber'),
      afterPolls.rows.map(r => r.tone).join(','));
    check('and the words never claim anything was lost',
      afterPolls.rows.every(r => !/fail|lost|error/i.test(r.text)),
      afterPolls.rows[0] && afterPolls.rows[0].text);

    await page.click('#hdr-notify');
    await page.waitForTimeout(900);
    const panel = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#context-panel [data-alert-i]')];
      const mine = rows.filter(r => r.getAttribute('data-alert-kind') === 'answer-stuck');
      return { n: mine.length,
        vis: mine.map(r => Math.round(r.getBoundingClientRect().height)),
        text: mine[0] ? (mine[0].innerText || '').replace(/\s+/g, ' ').trim() : '',
        good: mine.some(r => r.classList.contains('al-good')) };
    });
    check('they draw in the panel as visible pixels',
      panel.n === 2 && panel.vis.every(v => v > 8), JSON.stringify(panel.vis));
    check('each naming the agreement and its reference, the way every row does',
      /MK-/.test(panel.text), panel.text.slice(0, 80));
    check('and none of them is dressed as good news',
      panel.good === false, panel.good);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    /* ============================================================
       3 · THE WORKING TEXT LID IS GONE AND THE WORDING IS NOT
       ============================================================
       A RELOAD FIRST. Section 2 emptied state.contracts on purpose — that is
       the condition it exists to reproduce — and this section needs a contract
       to work on. The stuck memory goes with the reload, which is correct: it
       is per sitting, and section 2 has already made its claims. */
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2400);
    const upId = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      await ensureFull(c);
      c.source = 'upload';
      c.upload = { fileName: 'Counterparty draft.docx', size: 48210,
        uploadedBy: 'Amina Otieno', uploadedAt: new Date().toISOString(),
        extractedText: 'The parties agree as follows.', textChars: 3200 };
      c.format = 'rich';
      c.redlineText = '<h2>1. Scope</h2><p>The supplier shall deliver '
        + 'ZEBRAFISH CONSIGNMENTS monthly.</p>';
      persist(c); await flushSaves();
      return c.id;
    });
    await page.waitForTimeout(1200);
    await page.evaluate(id => { openWorkspace(id); }, upId);
    await page.waitForTimeout(1800);
    await page.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      if (window.roomGoTab) roomGoTab(c, 'doc');
    }, upId);
    await page.waitForTimeout(1600);

    const doc = await page.evaluate(() => {
      const anchor = document.querySelector('[data-anchor="redline"]');
      const txt = (document.getElementById('content') || document.body).innerText || '';
      return { anchor: !!anchor,
        words: /ZEBRAFISH CONSIGNMENTS/.test(txt),
        /* THE EXACT RETIRED STRING, not a case-insensitive "working text":
           the notices stack still carries docWorkingTextNoteHtml, which is a
           different thing (it offers Edit and Compare) and says "edited working
           text" in its own words. A loose match reports the note as the lid. */
        lid: /Working text \(edited\)/.test(txt),
        seal: /versions, Compare and the seal/i.test(txt),
        border: anchor ? getComputedStyle(anchor).borderTopWidth : null,
        bg: anchor ? getComputedStyle(anchor).backgroundColor : null };
    });
    check('the uploaded contract\'s edited wording is still on the page',
      doc.words, doc.words);
    check('the WORKING TEXT caption is gone', doc.lid === false, doc.lid);
    check('and the sentence that stood under it with it', doc.seal === false, doc.seal);
    check('the wording is the page, not a card on it — no border, no fill',
      doc.anchor && px(doc.border) === 0 && /rgba\(0, 0, 0, 0\)/.test(doc.bg),
      JSON.stringify({ border: doc.border, bg: doc.bg }));

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
