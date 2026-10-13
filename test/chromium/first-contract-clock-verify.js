/* Chromium verification: THE 30-MINUTE CLOCK (13 Oct 2026, owner's "go").
   ============================================================
   The crash course's first success factor for a small company is "first
   signed contract in under 30 minutes: sign-up, pick a template, send, sign,
   no training needed". Nobody had timed HaTi's path. This file is the clock.

   WHAT IT DOES. A robot plays a brand-new customer, through the real screens,
   with real presses, at 1280 px wide:
     1  signs up on the set-up screen (no sample book: an empty company);
     2  opens "+ Draft new agreement" and picks a template by name;
     3  answers the questions the template asks, and presses Create;
     4  completes whatever the Details hand-over still owes;
     5  presses Send, chooses Sign by email, and sends to the other party;
     6  the other party opens the emailed link in a second browser and signs;
     7  the owner names the route if asked, opens Signing, and signs;
     8  stops when the record says the contract is signed.
   Along the way it COUNTS: screens landed on, presses, fields typed, and the
   seconds the whole path took, and prints them as one line a push can read.

   WHAT IT PINS. test/chromium/first-contract-clock.json holds the counts the
   path had the day the clock was set. A change that adds a screen, a press
   or a field to the first contract fails here; a change that removes one is
   recorded by updating the file on purpose (like the colour census). The
   seconds are pinned as a RELATION (no more than 3x the recorded run, since
   a shared CI runner can be twice as slow as a laptop), never as an
   absolute, because a runner's speed is not the product's. The 15-minute bar
   is the owner's for a PERSON; the robot's counts are what a person's time is
   made of, so the counts are what the file guards.

   JAMBO ANSWERS INSTANTLY HERE (startClockAi below): the seconds are the
   product's own floor. A real model adds its seconds per reading on top.

   Run: node test/chromium/first-contract-clock-verify.js
        CLOCK_RECORD=1 node ...   # print the counts as JSON to paste into the baseline */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHatiWithMail } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BASELINE = path.join(__dirname, 'first-contract-clock.json');
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* ---- the counters: every press, every typed field, every screen ---- */
const clock = { t0: 0, screens: [], presses: 0, typed: 0, fallbacks: [] };
const secs = () => ((Date.now() - clock.t0) / 1000).toFixed(1);
const screen = name => { clock.screens.push(name); console.log(`  [${secs()}s] screen ${clock.screens.length}: ${name}`); };
const log = m => console.log(`  [${secs()}s] ${m}`);

/* A WAIT ASKS FOR THE STATE, BOUNDED: never a fixed pause. */
async function until(page, fn, ms = 15000, arg) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    let v = null;
    try { v = await page.evaluate(fn, arg); } catch (_) { v = null; }
    if (v) return v;
    await page.waitForTimeout(80);
  }
  return null;
}
async function press(page, sel, why) {
  const ok = await until(page, s => { const el = document.querySelector(s); return !!(el && !el.disabled && el.getClientRects().length); }, 15000, sel);
  if (!ok) throw new Error(`cannot press ${sel}${why ? ' (' + why + ')' : ''}`);
  try { await page.click(sel, { timeout: 6000 }); }
  catch (e) {
    /* a row that is re-drawn under the pointer: press the live element itself */
    const hit = await page.$eval(sel, el => { el.click(); return true; }).catch(() => false);
    if (!hit) throw e;
    log(`(pressed ${sel} on the live element: the first press found it re-drawn)`);
  }
  clock.presses++;
  log(`press ${sel}${why ? ' — ' + why : ''}`);
}
async function type(page, sel, value, why) {
  const ok = await until(page, s => !!document.querySelector(s), 15000, sel);
  if (!ok) throw new Error(`cannot type into ${sel}${why ? ' (' + why + ')' : ''}`);
  await page.fill(sel, value);
  clock.typed++;
  log(`type ${sel} = "${value}"${why ? ' — ' + why : ''}`);
}

/* Fill every EMPTY box inside a container, by type, the way a person would:
   a name where a name is asked, a date where a date is asked. Counts each. */
async function fillEmpties(page, rootSel, who) {
  /* HaTi dresses a date box with its own picker on the NEXT animation frame
     after the form mounts (dlgPinFoot -> popupControlsDress -> datePickDress):
     the native box goes out of sight and a face stands in its place. Listing
     the boxes in that one-frame gap would name a box nobody can type into
     (red on GitHub once, 13 Oct 2026). Ask for the state, bounded: every date
     box in the form dressed, or two seconds, whichever comes first. */
  await until(page, root => { const r = document.querySelector(root); if (!r) return false;
    const dates = [...r.querySelectorAll('input[type="date"]:not([data-native])')];
    return dates.every(i => i.dataset.dp === '1'); }, 2000, rootSel);
  const boxes = await page.evaluate(root => {
    const r = document.querySelector(root); if (!r) return [];
    const out = [];
    r.querySelectorAll('input, select, textarea').forEach((el, i) => {
      if (el.type === 'hidden' || el.type === 'checkbox' || el.type === 'radio' || el.type === 'button' || el.type === 'submit' || el.type === 'file') return;
      if (el.disabled || el.readOnly || el.offsetParent === null) return;
      if (String(el.value || '').trim()) return;
      if (!el.id) el.id = 'clk-' + i;
      const lbl = (el.closest('label') || {}).textContent || (el.labels && el.labels[0] && el.labels[0].textContent) || el.placeholder || el.name || el.id;
      out.push({ id: el.id, tag: el.tagName.toLowerCase(), type: el.type || '', label: String(lbl).trim().slice(0, 60),
        options: el.tagName === 'SELECT' ? [...el.options].map(o => o.value).filter(Boolean).slice(0, 5) : null });
    });
    return out;
  }, rootSel);
  for (const b of boxes) {
    const sel = '#' + CSS_escape(b.id);
    if (b.tag === 'select') {
      if (b.options && b.options.length) { await page.selectOption(sel, b.options[0]); clock.typed++; log(`pick ${sel} (${b.label}) = ${b.options[0]} — ${who}`); }
      continue;
    }
    let v = 'Stated';
    const l = b.label.toLowerCase();
    if (b.type === 'date') v = '2026-11-01';
    else if (b.type === 'number' || /amount|value|price|fee/.test(l)) v = '250000';
    else if (b.type === 'email' || /email/.test(l)) v = 'ola@nandi.co.ke';
    else if (/contact/.test(l)) v = 'Ola Nordmann';   /* their contact: a person (13 Oct 2026, item 6) */
    else if (/name|party|company|counterparty/.test(l)) v = 'Nandi Traders Ltd';
    else if (/address/.test(l)) v = 'Plot 12, Nairobi';
    else if (/day|notice|term|year|month/.test(l)) v = '30';
    /* dressed since it was listed: the box is out of sight now, a person
       would see the face; it is left as the journey was recorded */
    const seen = await page.evaluate(s => { const el = document.querySelector(s); return !!(el && el.offsetParent !== null); }, sel);
    if (!seen) { log(`skip ${sel} (${b.label}) — dressed since it was listed`); continue; }
    await type(page, sel, v, `${b.label} — ${who}`);
  }
  return boxes.length;
}
const CSS_escape = s => s.replace(/([^a-zA-Z0-9_-])/g, '\\$1');

/* ---- JAMBO'S STAND-IN FOR THE CLOCK ----
   The default test stub answers every tool with an empty object, which the
   product rightly treats as a cut-short reading, so a signing check that asks
   for three readings could never settle. This stand-in answers each tool with
   the SMALLEST WELL-FORMED answer its own schema allows (every required field,
   empty lists, a short sentence), instantly. It makes the clock the floor of a
   real customer's time: the real model adds its seconds on top. */
function startClockAi() {
  const http = require('node:http');
  const fillFrom = (schema) => {
    const out = {};
    const props = (schema && schema.properties) || {};
    for (const k of (schema && schema.required) || []) {
      const p = props[k] || {};
      out[k] = p.type === 'array' ? [] : p.type === 'object' ? fillFrom(p) : p.type === 'number' || p.type === 'integer' ? 0 : p.type === 'boolean' ? false : (p.enum && p.enum[0]) || 'Stated';
    }
    return out;
  };
  const calls = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_) {}
      const tools = Array.isArray(body.tools) ? body.tools : [];
      const name = (body.tool_choice && body.tool_choice.name) || (tools[0] && tools[0].name) || 'deliver_answer';
      calls.push(name);
      const tool = tools.find(t => t.name === name) || tools[0] || {};
      let input = fillFrom(tool.input_schema);
      if (name === 'deliver_answer') input = { answer: 'A short answer from the stand-in.', citations: [] };
      if (name === 'playbook_review') {
        /* one verdict per playbook position, category copied word for word
           from the PLAYBOOK JSON the prompt carries, as the real model is told */
        const text = JSON.stringify(body.messages || '');
        const cats = []; const re = /\\"category\\":\\"([^"\\]+)\\"/g; let m;
        while ((m = re.exec(text))) if (!cats.includes(m[1])) cats.push(m[1]);
        input = { verdicts: cats.map(category => ({ category, status: 'aligned', quote: '', position: '', note: 'Meets the position.' })) };
      }
      if (name === 'contract_brief') input = Object.assign(input, { overview: 'A mutual non-disclosure agreement between the two parties.', watchouts: [] });
      if (name === 'break_down') input = Object.assign(input, { head: 'The contract', sub: '', regions: [{ name: 'The whole contract', status: 'ok', items: [] }], points: [] });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'msg_clock', type: 'message', role: 'assistant', model: body.model || 'stand-in', stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 'tu_clock', name, input }], usage: { input_tokens: 10, output_tokens: 5 } }));
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ base: 'http://127.0.0.1:' + server.address().port, calls, stop: () => new Promise(r => server.close(r)) })));
}

async function signOnPad(page, who, name) {
  const pad = await until(page, () => !!document.getElementById('sig-pad'), 15000);
  if (!pad) throw new Error(`${who}: the signature pad did not open`);
  screen(`${who}: the signature pad`);
  await press(page, '[data-sig-tab="type"]', 'type the name instead of drawing');
  await type(page, '#sig-typed', name, 'the signature');
  await press(page, '#sig-intent', 'the intent line');
  await press(page, '#sig-adopt-go', 'Adopt & sign');
}

(async () => {
  const ai = await startClockAi();
  const h = await startHatiWithMail({}, { ANTHROPIC_BASE_URL: ai.base });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const aiHits = [];
  page.on('response', r => { const u = r.url(); if (/\/api\/ai\//.test(u)) aiHits.push(`${r.status()} ${u.replace(h.base, '')}`); });
  let theirPage = null;
  try {
    clock.t0 = Date.now();

    /* ---- 1 sign up ---- */
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    const setup = await until(page, () => !!document.getElementById('su-go'));
    check('1 a new HaTi opens on the set-up screen', setup);
    screen('set-up');
    await type(page, '#su-org', 'Nairobi Fresh Produce Ltd', 'the company');
    await type(page, '#su-name', 'Wanjiru Kamau', 'my name');
    await type(page, '#su-title', 'Managing Director', 'my job title');
    await type(page, '#su-email', 'wanjiru@nairobifresh.co.ke', 'my email');
    await type(page, '#su-pass', 'adminpassword1', 'a password');
    const sampleOn = await page.evaluate(() => { const s = document.getElementById('su-sample'); return !!(s && s.checked); });
    if (sampleOn) await press(page, '#su-sample', 'no sample contracts: an empty company');
    await press(page, '#su-go', 'Create workspace');
    const landed = await until(page, () => (!document.getElementById('su-go') && window.state && state.view) ? state.view : null, 20000);
    log(`sign-up landed on view "${landed}"`);
    const seen = await page.evaluate(() => [...document.querySelectorAll('button, a')].filter(b => b.offsetParent !== null && /agreement|contract|draft|new/i.test(b.textContent)).map(b => (b.id ? '#' + b.id + ' ' : '') + b.textContent.trim().slice(0, 40)).slice(0, 12));
    log(`doors on the landing screen: ${JSON.stringify(seen)}`);
    /* an empty Home draws its own "Draft new agreement" (#hero-draft); a page
       head draws the same door as [data-page-new] */
    const door = await until(page, () => ['#hero-draft', '[data-page-new]'].find(s => { const el = document.querySelector(s); return el && el.offsetParent !== null; }) || null, 5000);
    check('2 sign-up lands on a screen with the new-agreement button', door, `view ${landed}, door ${door}`);
    screen(landed || 'landing');

    /* ---- 2 new agreement ---- */
    await press(page, door, '+ Draft new agreement');
    /* the two doors are a menu under the button; the first row drafts */
    const doors = await until(page, () => [...document.querySelectorAll('#nd-menu [data-nd-door]')].map(b => b.getAttribute('data-nd-door') + ': ' + b.querySelector('.nd-t').textContent.trim()), 6000);
    log(`doors offered: ${JSON.stringify(doors)}`);
    await press(page, '#nd-menu [data-nd-door="draft"]', 'the Draft door');
    const na = await until(page, () => !!document.getElementById('na-q'), 15000);
    check('3 the New agreement screen opens', na);
    screen('New agreement');
    /* the search reads template NAMES only: "non-disclosure" finds nothing,
       "NDA" finds the NDA (logged in BUGLOG as noticed, not fixed) */
    await type(page, '#na-q', 'NDA', 'search the templates');
    const row = await until(page, () => { const b = document.querySelector('.na-pick'); return b && b.getClientRects().length ? b.textContent.trim() : null; }, 8000);
    log(`first template offered: ${row}`);
    /* how often does the list re-draw while nothing is typed? (a probe, not a check) */
    const redraws = await page.evaluate(() => new Promise(res => { let n = 0; const root = document.getElementById('na-lists') || document.getElementById('na-root'); const mo = new MutationObserver(() => n++); mo.observe(root, { childList: true, subtree: true }); setTimeout(() => { mo.disconnect(); res(n); }, 1000); }));
    log(`template list mutations in one idle second: ${redraws}`);
    await press(page, '.na-pick', 'pick the template');
    const form = await until(page, () => { const f = document.getElementById('na-form'); return !!(f && f.querySelector('input, select, textarea')); }, 15000);
    check('4 the template\'s questions mount beside the list', form);
    const asked = await fillEmpties(page, '#na-form', 'the template\'s questions');
    log(`questions answered: ${asked}`);
    await press(page, '#na-create', 'Create');

    /* ---- 3 the room ---- */
    const room = await until(page, () => (window.state && state.view === 'workspace' && state.activeId) ? state.activeId : null, 20000);
    check('5 Create opens the contract room', room, room);
    const id = room;
    /* the Details hand-over ("Complete the details") opens over the room when
       something is still owed; its primary is "Fill the document" */
    const cd = await until(page, () => !!document.getElementById('cd-form'), 4000);
    const owedNow = await page.evaluate(i => { const c = getContract(i); const d = window.detailsOf ? detailsOf(c) : null; return d ? JSON.stringify(d).slice(0, 200) : 'no detailsOf'; }, id);
    log(`details owed on arrival: ${owedNow}`);
    if (cd) {
      screen('Complete the details');
      const owed = await fillEmpties(page, '#cd-form', 'Complete the details');
      log(`boxes still empty on the hand-over: ${owed}`);
      await press(page, '#cd-fill', 'Fill the document');
    } else screen('the contract room');

    /* ---- 4 send to sign ---- */
    await press(page, '#ws-share', 'Send');
    const sh = await until(page, () => !!document.getElementById('share-send'), 15000);
    check('6 the Send screen opens', sh);
    screen('Send');
    await press(page, '[data-share-purpose="sign"]', 'purpose: Sign');
    const emailTab = await page.evaluate(() => { const t = document.querySelector('[data-share-ch="email"]'); return t ? (t.getAttribute('aria-selected') || t.className) : null; });
    log(`email channel state: ${emailTab}`);
    if (!/true|on|active/.test(String(emailTab))) await press(page, '[data-share-ch="email"]', 'channel: email');
    const pre = await page.evaluate(() => ({ name: (document.getElementById('sh-name') || {}).value || '', email: (document.getElementById('sh-email') || {}).value || '' }));
    log(`Send prefilled: name="${pre.name}" email="${pre.email}"`);
    if (!pre.name) await type(page, '#sh-name', 'Ola Nordmann', 'their name');
    if (!pre.email) await type(page, '#sh-email', 'ola@nandi.co.ke', 'their email');
    /* readiness: whatever the panel still owes is a door; name the route if asked */
    const ready = await page.evaluate(() => { const w = document.getElementById('share-readiness-wrap'); return w ? w.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) : ''; });
    log(`readiness says: ${ready}`);
    const sendDisabled = await page.evaluate(() => { const b = document.getElementById('share-send'); return b ? b.disabled : null; });
    log(`Send button disabled: ${sendDisabled}`);
    const needSigners = await page.evaluate(() => { const b = document.getElementById('share-signer-edit'); return b ? b.textContent.trim() : null; });
    log(`who signs: ${needSigners}`);
    if (sendDisabled && needSigners) {
      /* "Who signs": nobody is named yet, so name one on each side through
         the route editor, as the screen asks */
      await press(page, '#share-signer-edit', 'Add signers');
      const ed = await until(page, () => !!document.getElementById('sp-save'), 10000);
      check('6b the signer route editor opens', ed);
      screen('who signs');
      const rowsBefore = await page.evaluate(() => [...document.querySelectorAll('[data-sp-f]')].map(i => `${i.getAttribute('data-sp-f')}@${i.getAttribute('data-sp-id')}=${i.value || ''}`));
      log(`route rows: ${JSON.stringify(rowsBefore)}`);
      const addable = await page.evaluate(() => { const b = document.getElementById('sp-add-signer'); return !!(b && b.getClientRects().length && !b.disabled); });
      const hasCp = rowsBefore.some(r => /email@/.test(r) && /nandi|ola/i.test(r)) ;
      if (addable && !hasCp) {
        await press(page, '#sp-add-signer', 'add a signer');
        const menu = await page.evaluate(() => [...document.querySelectorAll('[data-sp-do], [role="menuitem"]')].filter(b => b.getClientRects().length).map(b => (b.getAttribute('data-sp-do') || '') + ':' + b.textContent.trim().slice(0, 30)));
        log(`add-signer choices: ${JSON.stringify(menu)}`);
        const cpChoice = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-sp-do], [role="menuitem"]')].find(x => x.getClientRects().length && /nandi|other|counterpart|their/i.test(x.textContent)); if (!b) return null; b.click(); return b.textContent.trim().slice(0, 40); });
        if (cpChoice) { clock.presses++; log(`press choice "${cpChoice}"`); }
      }
      const rows = await page.evaluate(() => [...document.querySelectorAll('[data-sp-f]')].filter(i => i.getClientRects().length).map(i => ({ f: i.getAttribute('data-sp-f'), id: i.getAttribute('data-sp-id'), v: i.value || '', el: i.id })));
      log(`route rows now: ${JSON.stringify(rows.map(r => `${r.f}@${r.id}=${r.v}`))}`);
      for (const r of rows) {
        if (r.v) continue;
        if (r.f === 'name') await type(page, '#' + CSS_escape(r.el), 'Ola Nordmann', 'the signer\'s name');
        else if (r.f === 'email') await type(page, '#' + CSS_escape(r.el), 'ola@nandi.co.ke', 'the signer\'s email');
      }
      await press(page, '#sp-save', 'save who signs');
      const saved = await until(page, () => !document.getElementById('sp-save') && document.getElementById('share-send') && !document.getElementById('share-send').disabled, 10000);
      check('6c the route is saved and Send is live', saved);
      if (!saved) {
        const say = await page.evaluate(() => { const s = document.getElementById('sr-say'); return s ? s.textContent.trim() : (document.getElementById('share-send') || {}).disabled; });
        log(`after save: ${say}`);
      }
    }
    await press(page, '#share-send', 'Send');
    /* a signing link asks once: "Send the signing link to this address?" */
    const confirmSel = await until(page, () => { const ok = ['#cf-ok', '#confirm-ok', '[data-dlg-ok]', '#dlg-ok'].find(s => { const el = document.querySelector(s); return el && el.getClientRects().length; }); if (ok) return ok;
      const b = [...document.querySelectorAll('[role="dialog"] button, .modal button')].reverse().find(x => x.getClientRects().length && /^(send|yes|ok|send it)/i.test(x.textContent.trim())); if (!b) return null; if (!b.id) b.id = 'clk-confirm'; return '#' + b.id; }, 8000);
    log(`confirmation: ${confirmSel}`);
    if (confirmSel) await press(page, confirmSel, 'yes, send the signing link');
    const sent = await until(page, () => { const r = document.getElementById('sh-result'); return r && /sent/i.test(r.textContent) ? r.textContent.trim().slice(0, 120) : null; }, 20000);
    if (!sent) {
      const state = await page.evaluate(() => ({ result: (document.getElementById('sh-result') || {}).textContent || '', lbl: (document.getElementById('sh-send-lbl') || {}).textContent || '',
        dialogs: [...document.querySelectorAll('[role="dialog"] h2, [role="dialog"] h3, .dlg-h')].map(x => x.textContent.trim().slice(0, 60)), pd: !!document.getElementById('pd-cancel'),
        toasts: [...document.querySelectorAll('#toast-root *')].map(x => x.textContent.trim()).filter(Boolean).slice(0, 3) }));
      log(`after Send: ${JSON.stringify(state)}`);
    }
    check('7 the screen says what happened to the link', !!sent, sent);
    const linkOf = m => (String(m.text || '') + ' ' + String((m.body && m.body.html) || '')).match(/#share=t:([A-Za-z0-9_-]+)/);
    await page.keyboard.press('Escape').catch(() => {});

    /* ---- 5 the owner signs first (the route's default order: us, then them) ---- */
    const tabSel = await until(page, () => { const t = [...document.querySelectorAll('[data-room-tab], [data-ws-tab], [data-tab]')].find(x => x.getClientRects().length && /sign/i.test(x.getAttribute('data-room-tab') || x.getAttribute('data-ws-tab') || x.getAttribute('data-tab') || '')); if (!t) return null; if (!t.id) t.id = 'clk-signtab'; return '#' + t.id; }, 10000);
    log(`signing tab selector: ${tabSel}`);
    if (tabSel) await press(page, tabSel, 'the Signing tab');
    screen('Signing');
    const btn = await until(page, () => { const b = document.getElementById('sign-btn'); return b ? (b.textContent.trim() + (b.disabled ? ' [disabled]' : '')) : null; }, 15000);
    log(`the Sign button reads: ${btn}`);
    await press(page, '#sign-btn', 'Sign');
    const padOrCheck = await until(page, () => document.getElementById('sig-pad') ? 'pad' : (document.getElementById('sign-check') ? 'check' : null), 15000);
    log(`after Sign: ${padOrCheck}`);
    if (padOrCheck === 'check') {
      /* "Before you sign — N to settle": the button is the list. A person runs
         the readings it asks for, reads the brief, and presses Sign again. */
      screen('Before you sign');
      /* a probe, not a check: the obligations stamp hashes obligationsText, the
         sign check hashes playbookText — do they agree on this contract? */
      const probe = await page.evaluate(i => { const c = getContract(i); const a = obligationsText(c) || '', b = playbookText(c) || ''; return { obligationsText: a.length, playbookText: b.length, same: simhash64(a) === simhash64(b), seen: c.obligationsReadHash || null, now: playbookHashOf(b) }; }, id);
      log(`probe: ${JSON.stringify(probe)}`);
      for (let round = 0; round < 8; round++) {
        const card = await page.evaluate(() => ({
          btn: (document.getElementById('sign-btn') || {}).textContent || '',
          head: (document.querySelector('#sign-check .sc-head, #sign-check h3, #sign-check h4') || {}).textContent || '',
          rows: [...document.querySelectorAll('#sign-check [data-sc-row], #sign-check .sc-row, #sign-check li')].map(r => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 70)).slice(0, 6),
          run: (() => { const b = document.getElementById('sc-run') || document.querySelector('[data-sc-run]'); return b && b.getClientRects().length ? (b.disabled ? 'busy' : 'ready') : null; })(),
          brief: (() => { const b = document.querySelector('[data-sc-brief]'); return !!(b && b.getClientRects().length); })(),
          pad: !!document.getElementById('sig-pad') }));
        log(`before you sign, round ${round + 1}: button "${card.btn.trim()}" · run ${card.run} · brief ${card.brief}`);
        if (card.rows.length) log(`  rows: ${JSON.stringify(card.rows)}`);
        if (card.pad) break;
        const briefRow = await page.evaluate(() => { const b = document.getElementById('sc-brief') || document.querySelector('#sign-check [data-kt-brief="open"]'); return !!(b && b.getClientRects().length); });
        if (briefRow) {
          await press(page, '#sc-brief, #sign-check [data-kt-brief="open"]', 'Read the brief');
          const read = await until(page, () => { const b = document.querySelector('[data-brief-read]'); return !!(b && b.getClientRects().length); }, 15000);
          if (read) { await press(page, '[data-brief-read]', 'I have read it'); await page.keyboard.press('Escape').catch(() => {}); }
          else log('  the brief opened without a "read it" button');
          continue;
        }
        if (card.run === 'ready' && round < 2) {
          await press(page, '#sc-run, [data-sc-run]', 'Run the readings');
          /* "Run the brief, the standards and the obligations?" — yes */
          const ask = await until(page, () => { const b = document.getElementById('cf-ok'); return !!(b && b.getClientRects().length); }, 5000);
          if (ask) await press(page, '#cf-ok', 'yes, run them');
          const before = card.btn.trim();
          /* the readings are done when Jambo has answered and no new answer has
             landed for two seconds (bounded) */
          const hits0 = aiHits.length;
          const moved = await (async () => { const end = Date.now() + 45000; let lastN = aiHits.length, lastAt = Date.now(); while (Date.now() < end) { if (aiHits.length !== lastN) { lastN = aiHits.length; lastAt = Date.now(); } if (aiHits.length > hits0 && Date.now() - lastAt > 2000) break; await page.waitForTimeout(100); }
            return until(page, b => { const btn = document.getElementById('sign-btn'); return btn && btn.textContent.trim() !== b ? true : null; }, 8000, before); })();
          if (!moved) {
            const said = await page.evaluate(() => ({ card: (document.getElementById('sign-check') || {}).textContent.replace(/\s+/g, ' ').trim().slice(0, 600),
              buttons: [...document.querySelectorAll('#sign-check button')].filter(b => b.getClientRects().length).map(b => (b.id ? '#' + b.id + ' ' : '') + [...b.attributes].filter(a => a.name.startsWith('data-sc')).map(a => a.name).join(',') + ' "' + b.textContent.trim().slice(0, 30) + '"'),
              toasts: [...document.querySelectorAll('#toast-root *')].map(x => x.textContent.trim()).filter(Boolean).slice(0, 3) }));
            log(`  after Run, nothing moved: ${JSON.stringify(said)}`);
            log(`  stand-in was asked: ${JSON.stringify(ai.calls)}`);
            log(`  AI routes answered: ${JSON.stringify(aiHits.slice(-10))}`);
            log(`  page errors so far: ${JSON.stringify(errors.slice(-4))}`);
          }
          continue;
        }
        if (card.run === 'ready') { log('  the readings cannot be run here: pressing Sign to see what it offers'); await press(page, '#sign-btn', 'Sign, again'); const pad = await until(page, () => !!document.getElementById('sig-pad'), 6000); if (pad) break; const offer = await page.evaluate(() => [...document.querySelectorAll('#sign-check button, [role="dialog"] button')].filter(b => b.getClientRects().length).map(b => b.textContent.trim().slice(0, 30))); log(`  offered: ${JSON.stringify(offer)}`); break; }
        if (card.run === 'busy') { await until(page, () => { const b = document.getElementById('sc-run') || document.querySelector('[data-sc-run]'); return !b || !b.disabled; }, 60000); continue; }
        if (card.brief) {
          await press(page, '[data-sc-brief]', 'Read the brief');
          const read = await until(page, () => { const b = document.querySelector('[data-brief-read]'); return !!(b && b.getClientRects().length); }, 15000);
          if (read) await press(page, '[data-brief-read]', 'I have read it');
          else log('  the brief opened without a "read it" button');
          continue;
        }
        /* nothing left to run or read: press Sign again and expect the pad */
        await press(page, '#sign-btn', 'Sign, again');
        const pad = await until(page, () => !!document.getElementById('sig-pad'), 10000);
        if (pad) break;
      }
    }
    await signOnPad(page, 'the owner', 'Wanjiru Kamau');
    const mine = await until(page, i => { const c = getContract(i); return (c.signerPlan || []).some(s => s.signed) ? 'signed' : null; }, 20000, id);
    check('8 the owner\'s signature lands', !!mine);
    /* the signing link goes to them the moment it is their turn */
    const mailArrived = await (async () => { const end = Date.now() + 15000; while (Date.now() < end) { const m = h.mail.sent.find(x => linkOf(x)); if (m) return m; await page.waitForTimeout(150); } return null; })();
    log(`mails in the stub: ${h.mail.sent.length} ${JSON.stringify(h.mail.sent.map(m => ({ to: m.to, subject: m.subject.slice(0, 50), link: !!linkOf(m) })))}`);
    check('9 the signing email left the building (the mail stub holds it)', !!mailArrived, mailArrived && mailArrived.to);
    const token = mailArrived && linkOf(mailArrived)[1];

    /* ---- 6 the other side signs from the emailed link ---- */
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    theirPage = await ctx2.newPage();
    theirPage.on('pageerror', e => errors.push('their: ' + e.message));
    const theirHits = [];
    theirPage.on('response', async r => { const u = r.url(); if (/\/api\/shares\//.test(u) && r.request().method() !== 'GET') { let t = ''; try { t = (await r.text()).slice(0, 160); } catch (_) {} theirHits.push(`${r.status()} ${r.request().method()} ${u.replace(h.base, '')} ${t}`); } });
    await theirPage.goto(h.base + '/#share=t:' + token, { waitUntil: 'networkidle' });
    const portal = await until(theirPage, () => !!document.getElementById('pt-sign') || !!document.querySelector('[data-pt-tab="sign"]'), 20000);
    check('10 the other side\'s page opens from the emailed link', portal);
    screen('their page');
    const signTab = await theirPage.evaluate(() => { const t = document.querySelector('[data-pt-tab="sign"]'); return !!(t && t.getClientRects().length); });
    if (signTab) await press(theirPage, '[data-pt-tab="sign"]', 'their Signing tab');
    const ptBtn = await until(theirPage, () => { const b = document.getElementById('pt-sign'); return b ? (b.textContent.trim() + (b.disabled ? ' [disabled]' : '')) : null; }, 10000);
    log(`their Sign button reads: ${ptBtn}`);
    await press(theirPage, '#pt-sign', 'Sign');
    await signOnPad(theirPage, 'the other side', 'Ola Nordmann');
    /* a named guest proves who they are: a one-time code goes to their email
       and must be typed before the signature lands */
    const otp = await until(theirPage, () => { const b = document.getElementById('pt-otp'); return !!(b && b.getClientRects().length); }, 10000);
    if (otp) {
      screen('their one-time code');
      const codeMail = await (async () => { const end = Date.now() + 15000; while (Date.now() < end) { const m = [...h.mail.sent].reverse().find(x => x.to === 'ola@nandi.co.ke' && /\b\d{4,8}\b/.test(x.text || '')); if (m) return m; await theirPage.waitForTimeout(150); } return null; })();
      const code = codeMail && (codeMail.text.match(/\b(\d{4,8})\b/) || [])[1];
      log(`code mail: ${codeMail ? codeMail.subject.slice(0, 60) : 'none'} · code ${code ? 'found' : 'missing'}`);
      check('10a the one-time code reached their email', !!code);
      if (code) { await type(theirPage, '#pt-otp', code, 'the code from the email'); await press(theirPage, '#pt-otp-go', 'confirm the code'); }
    }
    const theirs = await until(theirPage, () => !document.getElementById('sig-pad') && !document.getElementById('pt-otp'), 20000);
    const posted = theirHits.filter(x => /verify-otp|respond|sign/.test(x) && /^2\d\d /.test(x)).length;
    log(`their page after the pad: posts ${JSON.stringify(theirHits.map(x => x.slice(0, 70)))}`);
    check('10b the other side\'s signature lands (pad and code gone, the server answered)', theirs && posted > 0, `${posted} answered`);

    /* ---- 7 the record, read from the server ---- */
    const api = h.client('owner');
    await api.json('/api/login', { method: 'POST', body: { email: 'wanjiru@nairobifresh.co.ke', password: 'adminpassword1' } });
    const signed = await (async () => { const end = Date.now() + 30000; while (Date.now() < end) { let c = null; try { c = await api.json('/api/contracts/' + encodeURIComponent(id)); } catch (_) { c = null; } const rec = c && (c.contract || c);
      if (rec && (rec.status === 'Signed' || rec.status === 'Executed' || rec.hash)) return `${rec.status}${rec.hash ? ' · sealed' : ''}`; await page.waitForTimeout(300); } return null; })();
    if (!signed) {
      let c = null; try { c = await api.json('/api/contracts/' + encodeURIComponent(id)); } catch (e) { c = { error: e.message }; }
      const rec = (c && (c.contract || c)) || {};
      log(`server record: status=${rec.status} hash=${!!rec.hash} signers=${JSON.stringify((rec.signerPlan || []).map(s => (s.party || '?') + ':' + !!s.signed))} signatures=${(rec.signatures || []).length} keys=${Object.keys(rec).slice(0, 14).join(',')}`);
      const inBrowser = await page.evaluate(i => { const c = getContract(i); return { status: c.status, signed: (c.signerPlan || []).map(s => !!s.signed), sigs: (c.signatures || []).length }; }, id);
      log(`browser record: ${JSON.stringify(inBrowser)}`);
    }
    check('11 the server\'s record says the contract is signed', !!signed, signed);

    /* ---- the clock ---- */
    const total = Number(secs());
    const out = { screens: clock.screens.length, presses: clock.presses, typed: clock.typed, seconds: total };
    console.log(`\nCLOCK ${JSON.stringify(out)}`);
    console.log(`  screens: ${clock.screens.join(' › ')}`);
    check('12 the whole path, robot-driven, takes under 15 minutes', total < 900, total + ' s');
    let base = null;
    try { base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')); } catch (_) { base = null; }
    if (process.env.CLOCK_RECORD) console.log(`RECORD ${JSON.stringify(out)}`);
    if (base) {
      check('13 no screen was added to the first contract', out.screens <= base.screens, `${out.screens} vs ${base.screens} recorded`);
      check('14 no press was added to the first contract', out.presses <= base.presses, `${out.presses} vs ${base.presses} recorded`);
      check('15 no typed field was added to the first contract', out.typed <= base.typed, `${out.typed} vs ${base.typed} recorded`);
      check('16 the path is no slower than 3x the recorded run', out.seconds <= base.seconds * 3, `${out.seconds}s vs ${base.seconds}s recorded`);
    } else check('13 a baseline is recorded (first-contract-clock.json)', false, 'none yet: run with CLOCK_RECORD=1 and save the RECORD line');
    check('17 no page errors on either seat', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('X the journey ran to the end', false, e.message);
    console.log(`  screens so far: ${clock.screens.join(' › ')} · presses ${clock.presses} · typed ${clock.typed} · ${secs()}s`);
    const shot = process.env.CLOCK_SHOT || path.join(__dirname, '_first-contract-clock-fail.png');
    try { await page.screenshot({ path: shot }); console.log(`  screenshot: ${shot}`); } catch (_) {}
  } finally {
    await browser.close().catch(() => {});
    await h.stop();
    await ai.stop();
  }
  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})();
