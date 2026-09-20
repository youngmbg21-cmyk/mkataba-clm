/* Chromium verification: NO BRACE REACHES THE PAGE
   ================================================
   Young, 20 Sep 2026: "In hati where copilot generates information like in the
   attached copilots read and in the chatbot i see this sign {} being
   generated. Fix this bug to Remote it from Outputs."

   THIS FILE EXISTS BECAUSE THE OWNER NAMED TWO SCREENS, and a fix proved on
   one function is not a fix proved on the screens a reader is looking at.
   Both surfaces are DRIVEN here with a real (scripted) Copilot answer carrying
   every garbled shape the model was seen writing, and the PAINTED text is what
   is read back — f53 pins the reader itself.

   MEASURED AT THE PARENT (bd2bf2d), the same answer on the same two screens:
     Copilot's read   "{ 78% }"  "{{2.0 rounds per deal}}"  "0.6 extra rounds}"
     the chat bubble  the same
   which is the owner's screenshot, reproduced.

   THE WALL IS DRIVEN TOO: "{{counterparty}}" is this product's own
   template-blank syntax (AI_TEMPLATE_RULE asks the model for
   {{lower_snake_case}}) and it must come back with its braces on, or a reader
   who asks Copilot how to mark a blank is told the wrong thing.

   Run: node test/chromium/no-braces-in-copilot-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'no-braces');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};

/* ONE ANSWER, EVERY SHAPE, used on both screens so neither can be fixed and
   the other left behind. Each line is a shape reproduced against the real
   renderer before the fix was written. */
const GARBLED = [
  '**Most deals close fast.** Two-thirds {{+sign within round 1}}, and the median',
  'time to signature is {+under 1 day}} — deciding on changes in {{+2 hours}.',
  '',
  '**Quality clauses create friction.** It appears in {-**21% of deals**} and adds',
  '{-0.6 extra rounds} when contested. They take {{2.0 rounds per deal}} over 2 deals.',
  '',
  '**One thing to do.** {!Check whether the language is genuinely non-negotiable}',
  'and, in a template, write the party as {{counterparty}} rather than a name.',
].join('\n');

const answer = () => ([{ type: 'tool_use', id: 'tu_' + Math.random().toString(36).slice(2),
  name: 'deliver_answer', input: { answer: GARBLED, citations: [] } }]);

/* WHAT THE READER SEES: the element's own text, with no markup in it. A brace
   inside an attribute is not on the page; a brace in the text is. */
const PAINTED = sel => {
  const el = document.querySelector(sel);
  if (!el) return { err: 'not drawn: ' + sel };
  return { text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
    tones: el.querySelectorAll('.ai-tone').length,
    pos: el.querySelectorAll('.ai-tone-pos').length,
    neg: el.querySelectorAll('.ai-tone-neg').length,
    warn: el.querySelectorAll('.ai-tone-warn').length,
    strong: el.querySelectorAll('strong').length,
    /* THE RELATION, not a tally: bold anywhere on the page proves nothing —
       the shape that was broken is a bold figure INSIDE a marker. */
    boldInTone: el.querySelectorAll('.ai-tone strong').length };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2600);

    /* ═══════════ 0 · THE STAGE ═══════════
       The friction card draws nothing without negotiations, and its Copilot
       button does nothing without a key — so both are CONTROLS, reported
       rather than assumed. Real changes through the real funnel. */
    const seeded = await drive(page, async () => {
      const live = (state.contracts || []).filter(c => c.status !== 'Declined').slice(0, 3);
      let n = 0;
      for (const c of live){
        let cls = [];
        try { cls = negoClauseList(c); } catch (_) { continue; }
        if (!cls.length) continue;
        for (const [k, side] of [[0, 'owner'], [1, 'counterparty']]){
          const cl = cls[k]; if (!cl) continue;
          try {
            await negoFileChange(c, { clauseId: cl.clauseId, changeType: 'modify',
              oldText: cl.text, newText: (cl.text || '') + ' Amended for the stage.',
              bodyHtml: (cl.bodyHtml || '<p></p>') + '<p>Amended for the stage.</p>',
              clauseLabel: negoClauseLabel(cl) },
              { author: side === 'owner' ? 'Amina Otieno' : 'Their Counsel', side });
            n++;
          } catch (_) {}
        }
        const chs = (c.changes || []).slice();
        try { if (chs[0]) await negoResolve(c, chs[0].id, 'accepted'); } catch (_) {}
      }
      return { filed: n,
        deals: (typeof intelFrictionStats === 'function') ? intelFrictionStats(null).deals : -1,
        keyed: (typeof copilotAvailable === 'function') ? copilotAvailable() : null };
    }, undefined, { filed: 0, deals: -1, keyed: null });
    check('0a CONTROL — the friction brief has real negotiations to read',
      seeded.deals > 0, `${seeded.deals} deals, ${seeded.filed} changes filed`);
    check('0b CONTROL — Copilot is switched on, so the button does something',
      seeded.keyed === true, String(seeded.keyed));

    /* ═══════════ 1 · COPILOT'S READ, THE SCREEN IN THE REPORT ═══════════ */
    ai.script(answer());
    await drive(page, () => { setView('intel'); }, undefined, null);
    await pause(700);
    await drive(page, () => { intelGoTab('friction'); }, undefined, null);
    await pause(1500);
    const pressed = await drive(page, async () => {
      const b = document.getElementById('igf-ai-ask');
      if (!b) return { err: 'no Interpret button on the friction page' };
      b.click();
      return { ok: true };
    }, undefined, { err: 'blocked' });
    await pause(3000);
    const read = pressed.err ? { err: pressed.err }
      : await drive(page, PAINTED, '.igf-ai-read', { err: 'blocked' });
    await page.screenshot({ path: path.join(OUT, '01-copilots-read.png'), fullPage: true });

    check('1a the read really arrived', !read.err && (read.text || '').length > 80,
      read.err || `${(read.text || '').length} characters`);
    const readLeft = (read.text || '').replace(/\{\{counterparty\}\}/g, '');
    check('1b NO BRACE IS PAINTED — this is the report',
      !read.err && !/[{}]/.test(readLeft),
      read.err || (readLeft.match(/.{0,26}[{}].{0,26}/g) || ['none']).join(' | '));
    /* GATED ON THE COLOUR STILL LANDING, or "no braces" is satisfied by a fix
       that simply stopped marking anything — which would be a worse product
       and a green run. */
    check('1c and the colours still land — all three tones the answer used',
      !read.err && read.pos >= 1 && read.neg >= 1 && read.warn >= 1,
      read.err || `pos ${read.pos} · neg ${read.neg} · warn ${read.warn} (${read.tones} total)`);
    check('1d a BOLD figure inside a marker keeps both — the prompt asks for both',
      !read.err && read.boldInTone >= 1 && /21% of deals/.test(read.text || ''),
      read.err || `${read.boldInTone} bold runs inside a tone (${read.strong} bold on the page)`);
    check('1e THE WALL — a template blank keeps its braces',
      !read.err && /\{\{counterparty\}\}/.test(read.text || ''),
      read.err || ((read.text || '').match(/.{0,12}counterparty.{0,4}/) || ['the blank lost its braces'])[0]);
    check('1f and the words the model wrote are all still there',
      !read.err && /sign within round 1/.test(read.text || '')
      && /2\.0 rounds per deal/.test(read.text || '')
      && /2 hours/.test(read.text || ''),
      read.err || 'nothing was dropped');

    /* ═══════════ 2 · THE CHAT BUBBLE, THE OTHER SCREEN NAMED ═══════════
       openAI(prefill) submits, so this is the panel a reader types into, not a
       builder called from the side. */
    ai.script(answer());
    const chat = await drive(page, async () => {
      if (typeof openAI !== 'function') return { err: 'no chat panel on this build' };
      openAI('what is slowing my negotiations down?');
      return { ok: true };
    }, undefined, { err: 'blocked' });
    await pause(3200);
    const bubble = chat.err ? { err: chat.err } : await drive(page, () => {
      const rows = [...document.querySelectorAll('#ai-feed .ai-p')];
      if (!rows.length) return { err: 'no answer in the feed' };
      const host = rows[rows.length - 1].closest('div') || rows[rows.length - 1].parentElement;
      return { text: (host.textContent || '').replace(/\s+/g, ' ').trim(),
        tones: host.querySelectorAll('.ai-tone').length,
        pos: host.querySelectorAll('.ai-tone-pos').length,
        neg: host.querySelectorAll('.ai-tone-neg').length,
        warn: host.querySelectorAll('.ai-tone-warn').length,
        boldInTone: host.querySelectorAll('.ai-tone strong').length };
    }, undefined, { err: 'blocked' });
    await page.screenshot({ path: path.join(OUT, '02-chat.png') });

    check('2a the chat really answered', !bubble.err && (bubble.text || '').length > 80,
      bubble.err || `${(bubble.text || '').length} characters`);
    const chatLeft = (bubble.text || '').replace(/\{\{counterparty\}\}/g, '');
    check('2b NO BRACE IS PAINTED IN THE CHAT EITHER',
      !bubble.err && !/[{}]/.test(chatLeft),
      bubble.err || (chatLeft.match(/.{0,26}[{}].{0,26}/g) || ['none']).join(' | '));
    check('2c and the colours land there too',
      !bubble.err && bubble.pos >= 1 && bubble.neg >= 1 && bubble.warn >= 1,
      bubble.err || `pos ${bubble.pos} · neg ${bubble.neg} · warn ${bubble.warn}`);
    check('2c2 and a bold figure inside a marker survives here too',
      !bubble.err && bubble.boldInTone >= 1,
      bubble.err || `${bubble.boldInTone} bold runs inside a tone`);
    check('2d THE WALL holds on this surface as well',
      !bubble.err && /\{\{counterparty\}\}/.test(bubble.text || ''),
      bubble.err || ((bubble.text || '').match(/.{0,12}counterparty.{0,4}/) || ['the blank lost its braces'])[0]);

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run finished', false, String((e && e.message) || e));
  } finally {
    if (blocked.length) console.log('\nblocked evaluations: ' + blocked.slice(0, 4).join(' | '));
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
