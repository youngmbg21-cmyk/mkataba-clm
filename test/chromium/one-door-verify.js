/* Chromium verification: ONE DOOR TO A STANDARD CONTRACT.
   ============================================================
   Young's go on "One Door to Standards", 24 Sep 2026, every decision as
   recommended: "+ New standard contract" asks ONE question with three starts;
   every start ends in the same builder with Copilot's first move waiting; the
   name, category and value stream sit at the top of the builder; Publish asks
   once about anything still open. f376 pins the readings; this file PRESSES
   them, because every claim that matters here is a journey — a start that
   lands on the wrong tab, a chip that opens the box on the wrong field, a
   Publish that goes past its own question, all look correct in the source.

   Copilot is answered at the network edge (the outline and the small blank
   questions), never stubbed in the page: the routes, the builder and the
   rail are the product's own.

   Every driven half is GUARDED: a build without the feature REPORTS each
   claim as a failure rather than timing out on the first missing button.

   Run: node test/chromium/one-door-verify.js
   HATI_SHOT_DIR=/some/dir puts the screenshots somewhere else. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, para, styledPara, WORD_PARTS } = require('../docxfix');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'one-door');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

const OUTLINE = { title: 'Nordic Parcel Carrier Agreement', category: 'procurement', note: 'Five sections for a carrier agreement.', sections: [
  { heading: 'Parties', intent: 'Who the agreement is between.' },
  { heading: 'Services', intent: 'What the carrier collects and delivers.' },
  { heading: 'Payment terms', intent: 'When invoices are paid.' },
  { heading: 'Limitation of liability', intent: 'How far each side answers for loss.' },
  { heading: 'Escrow', intent: 'Source code held in escrow.', optional: true },
] };

/* A Word file with a heading ladder, a table and two gaps it marks itself. */
const cell = t => `<w:tc><w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p></w:tc>`;
const DOC = styledPara('Title', null, 0, 'SERVICES AGREEMENT')
  + para('This Agreement is made between Highland Corporate Ltd and [Supplier name] of [Supplier address].')
  + styledPara('Heading1', null, 0, '1. Scope')
  + para('The Supplier shall provide the Services described in the Schedule.')
  + styledPara('Heading1', null, 0, '2. Fees')
  + `<w:tbl><w:tr>${cell('Service')}${cell('Monthly fee')}</w:tr><w:tr>${cell('Parcel tracking')}${cell('EUR 4,000')}</w:tr></w:tbl>`
  + para('Invoices are paid within thirty (30) days.');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  /* GUARDED BY A SHORT FUSE: every button this file presses is on the screen
     at once or not at all, so a build without the feature fails each press in
     seconds and REPORTS it, instead of waiting thirty seconds a press and
     running into the runner's own timeout. */
  page.setDefaultTimeout(4000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let outlineMode = 'ok';
  await page.route('**/api/ai/outline', route => outlineMode === 'nokey'
    ? route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Copilot engine not configured', needsKey: true, kind: 'noKey' }) })
    : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(OUTLINE) }));
  /* The small questions: every bracketed gap is a blank; nothing else is answered. */
  await page.route('**/api/ai/blanks', route => {
    const b = route.request().postDataJSON() || {};
    const items = (b.candidates || []).filter(c => /^\[/.test(c.text))
      .map(c => ({ id: c.id, kind: 'blank', label: c.text.replace(/^\[|\]$/g, ''), type: 'text', why: '', variants: [] }));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items, category: 'procurement', answered: items.length, asked: (b.candidates || []).length }) });
  });

  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const has = sel => page.evaluate(s => !!document.querySelector(s), sel);
  const waitFor = async (fn, n = 25) => { for (let i = 0; i < n; i++) { if (await page.evaluate(fn)) return true; await pause(300); } return false; };
  const lane = () => page.evaluate(() => ((document.getElementById('tb-lane') || {}).textContent || '').replace(/\s+/g, ' '));
  const head = () => page.evaluate(() => {
    const h = document.getElementById('tb-head'); if (!h) return null;
    const chip = k => { const b = h.querySelector(`[data-tb-meta="${k}"]`); return b ? { empty: b.classList.contains('empty'), v: ((b.querySelector('.v') || {}).textContent || '').trim() } : null; };
    return { name: ((h.querySelector('[data-tb-meta="name"] .v') || {}).textContent || '').trim(), category: chip('category'), stream: chip('stream') };
  });
  const toTemplates = async () => { await page.evaluate(() => { try { closeModal(); } catch (_) {} setView('templates'); }); await pause(900); };
  const openStart = async k => {
    await page.click('#tpl-new').catch(() => {});
    await pause(450);
    await page.click(`[data-ns-start="${k}"]`).catch(() => {});
    await pause(500);
  };
  const intoBuilder = () => waitFor(() => !!document.getElementById('tb-page') && !!document.getElementById('tb-head'));
  /* A template's draft, read back OFF THE SERVER by the template's name — the
     builder's own state is module-private, and the claim is about what was
     saved, not what the page is holding. */
  const draftOf = async name => {
    const all = await api('templates');
    const t = (all.templates || all.list || all || []).filter(x => x && x.name === name).pop();
    if (!t) return null;
    const det = await api('templates/' + t.id);
    const d = (det.versions || []).find(v => v.status === 'draft');
    return d ? api(`templates/${t.id}/versions/${d.id}`) : null;
  };

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);
    await toTemplates();

    /* ================= 1 · ONE BUTTON, ONE QUESTION ================ */
    const btn = await page.evaluate(() => { const b = document.getElementById('tpl-new'); return b ? b.textContent.trim() : null; });
    check('1a · one create button, named for what it makes', btn === '+ New standard contract', btn);
    check('1b · and nothing beside it converts a document', !(await has('#tpl-convert')));
    await page.click('#tpl-new').catch(() => {});
    await pause(450);
    const starts = await page.evaluate(() => [...document.querySelectorAll('[data-ns-start]')].map(b => b.getAttribute('data-ns-start')));
    await shot('01-one-question');
    check('1c · the question has three answers, in the drawing’s order', starts.join(',') === 'scratch,template,contract', starts);
    await page.keyboard.press('Escape'); await pause(300);

    /* ================= 2 · FROM SCRATCH ================ */
    await openStart('scratch');
    const focus = await page.evaluate(() => document.activeElement && document.activeElement.id);
    check('2a · the caret is in the one box, "what is it for?"', focus === 'ns-say-box', focus);
    await page.fill('#ns-say-box', 'A carrier agreement for parcel deliveries across the Nordics').catch(() => {});
    await page.click('#ns-go').catch(() => {});
    const inA = await intoBuilder();
    await pause(1200);
    await shot('02-scratch-outline');
    const hA = await head();
    check('2b · the builder opens with Copilot’s name and category at its head, and the stream still to choose',
      inA && !!hA && hA.name === OUTLINE.title && hA.category && !hA.category.empty && hA.stream && hA.stream.empty, hA);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#tb-lane .tb-list li')].map(li => ({
      head: (li.querySelector('b') || {}).textContent, src: ((li.querySelector('.src') || {}).className || '').replace('src', '').trim(),
      on: !!(li.querySelector('input') || {}).checked })));
    check('2c · every proposed section says where its words come from', rows.length >= 5 && rows.every(r => ['lib', 'std', 'ai'].includes(r.src)), rows.map(r => r.head + ':' + r.src));
    check('2d · the optional one arrives unticked', rows.some(r => r.head === 'Escrow' && !r.on), rows.filter(r => r.head === 'Escrow'));
    check('2e · the liability clause is proposed ONCE — the model’s own heading answers the playbook’s',
      rows.filter(r => /liabilit/i.test(r.head || '')).length === 1, rows.map(r => r.head));
    check('2f · and the read the start spent is counted on the card', /read 1\b/.test(await lane()), (await lane()).slice(-40));
    const libN = rows.filter(r => r.on && r.src === 'lib').length;
    await page.click('[data-tb-out-add]').catch(() => {});
    await pause(900);
    const afterAdd = await page.evaluate(() => ({ foot: ((document.getElementById('tb-railfoot') || {}).textContent || '').trim(),
      written: [...document.querySelectorAll('[data-tb-sec]')].filter(s => !s.classList.contains('is-empty')).length }));
    await shot('03-scratch-added');
    check('2g · Add puts the sections on the paper, the library’s already written', libN > 0 && afterAdd.written === libN && new RegExp('^' + libN + ' of ').test(afterAdd.foot), { libN, ...afterAdd });
    await toTemplates();

    /* ================= 3 · FROM SCRATCH, COPILOT REFUSES ================ */
    outlineMode = 'nokey';
    await openStart('scratch');
    await page.fill('#ns-say-box', 'Supply of fresh produce to our stores').catch(() => {});
    await page.click('#ns-go').catch(() => {});
    await pause(900);
    const refused = await page.evaluate(() => ({ say: ((document.getElementById('ns-say') || {}).textContent || '').trim(), go: ((document.getElementById('ns-go') || {}).textContent || '').trim(), open: !!document.getElementById('ns-say-box') }));
    check('3a · the refusal is said on the same screen, and the button becomes the one press still open',
      refused.open && refused.say.length > 10 && refused.go === await page.evaluate(() => i18t('ns_open_builder')), refused);
    await page.click('#ns-go').catch(() => {});
    const inB = await intoBuilder();
    await pause(800);
    const kept = await page.evaluate(() => (document.getElementById('tb-ask') || {}).value || '');
    check('3b · the builder opens, and the sentence is in the box a press asks from again', inB && kept === 'Supply of fresh produce to our stores', kept);
    outlineMode = 'ok';
    await toTemplates();

    /* ================= 4 · FROM A TEMPLATE YOU HAVE — a Word file ================ */
    await openStart('template');
    const tab = await page.evaluate(() => { const b = document.querySelector('[data-ns-tab].on'); return b && b.getAttribute('data-ns-tab'); });
    check('4a · the upload tab leads', tab === 'upload', tab);
    await page.setInputFiles('#ns-file', { name: 'Services_Agreement.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from(mkDocx(DOC, { parts: WORD_PARTS })) }).catch(e => errors.push('setInputFiles: ' + e.message));
    await waitFor(() => !!((document.getElementById('ns-got') || {}).textContent || '').trim());
    const got = await page.evaluate(() => ((document.getElementById('ns-got') || {}).textContent || '').replace(/\s+/g, ' '));
    await shot('04-copied');
    check('4b · the copy says what it kept — the table among it — and that no word changed', /1 table/.test(got) && new RegExp(i18tSafe('ns_f_same')).test(got), got);
    await page.click('#ns-go').catch(() => {});
    const inC = await intoBuilder();
    await waitFor(() => !/Reading/i.test(((document.getElementById('tb-lane') || {}).textContent || '')) && !!document.querySelector('[data-tb-cand], [data-tb-cand-make]'));
    await pause(600);
    await shot('05-blanks-first');
    const hC = await head();
    const cands = await page.evaluate(() => [...document.querySelectorAll('[data-tb-cand]')].map(b => ({ id: b.getAttribute('data-tb-cand'), on: b.checked, t: b.closest('li').textContent.replace(/\s+/g, ' ').trim() })));
    check('4c · the builder opens on the Blanks tab with the document’s own gaps offered, UNTICKED',
      inC && cands.length >= 2 && cands.every(c => !c.on) && await page.evaluate(() => { const b = document.querySelector('[data-tb-tab].is-on, [data-tb-tab].on'); return !!b && b.getAttribute('data-tb-tab') === 'blanks'; }), cands.map(c => c.t.slice(0, 40)));
    check('4d · the name is the document’s own title, and the category is Copilot’s reading of the kind', !!hC && hC.name === 'Services Agreement' && hC.category && hC.category.v === await page.evaluate(() => tplCategoryName('procurement')), hC);
    check('4e · the table is on the paper', await page.evaluate(() => document.querySelectorAll('#tb-paperslot table').length) === 1);
    if (cands.length) {
      await page.click(`[data-tb-cand="${cands[0].id}"]`).catch(() => {});
      await pause(300);
      const make = await page.evaluate(() => { const b = document.querySelector('[data-tb-cand-make]'); return b ? { t: b.textContent.trim(), off: b.disabled } : null; });
      check('4f · the count follows the tick', !!make && !make.off && /1/.test(make.t), make);
      await page.click('[data-tb-cand-make]').catch(() => {});
      await pause(700);
      await page.click('#tb-save').catch(() => {});
      await pause(900);
      const saved = await page.evaluate(draftOf, 'Services Agreement');
      const keys = saved ? saved.fields.map(f => f.field_key || f.fieldKey) : [];
      const text = saved ? saved.blocks.map(b => b.content).join('\n') : '';
      check('4g · saved, the blank is a field AND a marker in the wording; the table travelled as the document’s own markup',
        keys.length === 1 && text.includes('{{' + keys[0] + '}}') && saved.blocks.some(b => b.format === 'rich' && /<table/.test(b.content)), { keys, rich: saved && saved.blocks.filter(b => b.format === 'rich').length });
    } else { check('4f · the count follows the tick', false, 'no candidates'); check('4g · saved, the blank is a field AND a marker in the wording', false, 'no candidates'); }
    await toTemplates();

    /* ================= 5 · ONE OF HaTi'S, THROUGH MAKE IT OURS ================ */
    await page.evaluate(() => { if (typeof tplMakeItOurs === 'function') tplMakeItOurs('RM'); });
    await pause(600);
    const pre = await page.evaluate(() => ({ tab: (document.querySelector('[data-ns-tab].on') || { getAttribute: () => null }).getAttribute('data-ns-tab'),
      pick: (document.querySelector('[data-ns-hati].on') || { getAttribute: () => null }).getAttribute('data-ns-hati'), go: !!document.getElementById('ns-go') && !document.getElementById('ns-go').disabled }));
    check('5a · Make it ours opens the one door on HaTi’s own tab with the template chosen', pre.tab === 'hati' && pre.pick === 'RM' && pre.go, pre);
    await page.click('#ns-go').catch(() => {});
    const inD = await intoBuilder();
    await waitFor(() => !/Reading/i.test(((document.getElementById('tb-lane') || {}).textContent || '')));
    await pause(600);
    await shot('06-hati-copy');
    const dLane = await lane();
    check('5b · its own blanks are not offered back as blanks to make', inD && !/\{\{/.test(dLane.split(/Counterparty\s*\*/)[0] || dLane) && await page.evaluate(() => document.querySelectorAll('[data-tb-cand]').length) === 0, dLane.slice(0, 160));
    const fieldRows = await page.evaluate(() => [...document.querySelectorAll('#tb-lane .tb-rows li')].filter(li => li.querySelector('[data-tb-fedit]')).map(li => li.textContent.replace(/\s+/g, ' ').slice(0, 60)));
    const unplaced = fieldRows.filter(t => /unplaced/i.test(t));
    /* GATED on the list being there at all: an empty list has nothing unplaced
       in it, and would pass on a build that never opened the Blanks tab. */
    check('5c · and every one of them is placed — none "unplaced"', fieldRows.length >= 3 && unplaced.length === 0, { rows: fieldRows.length, unplaced });
    await page.click('#tb-save').catch(() => {});
    await pause(900);
    const v5 = await page.evaluate(draftOf, 'Raw Material Supply Agreement');
    const hs = (() => { if (!v5) return { err: 'no draft' }; const text = v5.blocks.map(b => b.content).join('\n');
      return { n: v5.fields.length, orphan: v5.fields.map(f => f.field_key).filter(k => !text.includes('{{' + k + '}}')),
        stray: (text.match(/\{\{([^}]+)\}\}/g) || []).filter(m => !v5.fields.some(f => '{{' + f.field_key + '}}' === m)) }; })();
    check('5d · read back off the server: every field has its marker and every marker its field', hs.n > 3 && hs.orphan && hs.orphan.length === 0 && hs.stray.length === 0, hs);
    await toTemplates();

    /* ================= 6 · FROM ONE OF OUR CONTRACTS ================ */
    await openStart('contract');
    const list = await page.evaluate(() => [...document.querySelectorAll('[data-ns-c]')].map(b => b.getAttribute('data-ns-c')));
    check('6a · the contracts with wording are offered, and Use waits for a pick', list.includes('MK-A1') && await page.evaluate(() => !!document.getElementById('ns-go') && document.getElementById('ns-go').disabled), list);
    await page.click('[data-ns-c="MK-A1"]').catch(() => {});
    await page.click('#ns-go').catch(() => {});
    const inE = await intoBuilder();
    await pause(1200);
    await shot('07-contract-card');
    const eLane = await lane();
    const missing = await page.evaluate(() => [...document.querySelectorAll('[data-tb-k-add]')].map(b => b.getAttribute('data-tb-k-add')));
    check('6b · the card names each deal detail it took out, with a way to put it back', inE && /Kabras Sugar → /.test(eLane) && await has('[data-tb-putback]'), eLane.slice(0, 160));
    check('6c · each standard the contract lacks is named ONCE', missing.length > 0 && new Set(missing).size === missing.length, missing);
    const hE = await head();
    check('6d · filed where the contract was: its own value stream is on the chip', !!hE && hE.stream && !hE.stream.empty, hE);
    await page.click('[data-tb-putback]').catch(() => {});
    await pause(700);
    check('6e · Put back returns the words to the paper', /Kabras Sugar/.test(await page.evaluate(() => (document.getElementById('tb-paperslot') || {}).textContent || '')));
    await toTemplates();

    /* ================= 7 · PASTED WORDING, THE HEAD, AND THE QUESTION PUBLISH ASKS ================ */
    await openStart('template');
    await page.click('[data-ns-tab="paste"]').catch(() => {});
    await pause(300);
    await page.evaluate(() => {
      const host = document.querySelector('#ns-paste [contenteditable]') || document.getElementById('ns-paste');
      if (!host) return;
      const dt = new window.DataTransfer();
      dt.setData('text/html', '<h1>MASTER SERVICES AGREEMENT</h1><h2>1. Definitions</h2><p>In this Agreement the Supplier means [Supplier name].</p><h2>2. Fees</h2><p>The Customer shall pay the fees in the order.</p>');
      dt.setData('text/plain', 'MASTER SERVICES AGREEMENT');
      host.focus();
      host.dispatchEvent(new window.ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await pause(500);
    const pasted = await page.evaluate(() => ((document.getElementById('ns-pasted') || {}).textContent || '').replace(/\s+/g, ' '));
    check('7a · pasted wording is copied the same way — facts counted, no word changed', /2 clause numbers/.test(pasted) && new RegExp(i18tSafe('ns_f_same')).test(pasted), pasted);
    await page.click('#ns-go').catch(() => {});
    await intoBuilder();
    await waitFor(() => !/Reading/i.test(((document.getElementById('tb-lane') || {}).textContent || '')));
    await pause(500);
    const hF = await head();
    check('7b · it is OUR standard now, named for its own title and not yet filed', !!hF && hF.name === 'Master Services Agreement' && hF.stream && hF.stream.empty, hF);
    await page.click('#tb-publish').catch(() => {});
    await pause(600);
    await shot('08-publish-question');
    const q = await page.evaluate(() => ({ rows: [...document.querySelectorAll('.tb-pq-o')].map(r => r.textContent.replace(/\s+/g, ' ').trim()), doors: document.querySelectorAll('[data-tb-pq]').length, go: !!document.getElementById('tb-pq-go') }));
    check('7c · Publish asks once, naming each open item as a door — the stream first', q.go && q.rows.length >= 2 && q.doors === q.rows.length && q.rows[0].startsWith(i18tSafeText('tb_pq_stream')), q);
    await page.click('[data-tb-pq="0"]').catch(() => {});
    await pause(600);
    const door = await page.evaluate(() => ({ caret: document.activeElement && document.activeElement.id, asked: !!document.getElementById('tb-pq-go') }));
    check('7d · the stream row puts the question away and opens the stream picker, caret in it', door.caret === 'tpllib-m-stream' && !door.asked, door);
    await page.selectOption('#tpllib-m-stream', 'sales').catch(() => {});
    await page.click('#tpllib-m-save').catch(() => {});
    await pause(900);
    const hG = await head();
    check('7e · saved, the head is repainted and the reader is still in the builder', await has('#tb-page') && !!hG && hG.stream && !hG.stream.empty, hG);
    await page.click('#tb-publish').catch(() => {});
    await pause(600);
    const q2 = await page.evaluate(() => [...document.querySelectorAll('.tb-pq-o')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
    check('7f · chosen, the stream is no longer on the question', q2.length >= 1 && !q2.some(r => r.startsWith(i18tSafeText('tb_pq_stream'))), q2);
    if (await has('#tb-pq-go')) await page.click('#tb-pq-go').catch(() => {});
    await pause(2000);
    await shot('09-design-step');
    const design = await page.evaluate(() => ({ builder: !!document.getElementById('tb-page'), text: ((document.getElementById('content') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 200) }));
    check('7g · Publish anyway saves and opens the design step', !design.builder && /Design/.test(design.text), design.text.slice(0, 80));

    /* ================= 8 · THE STRIP IS ONE LINE AT EVERY WIDTH ================ */
    await toTemplates();
    await openStart('template');
    await page.click('[data-ns-tab="hati"]').catch(() => {});
    await page.evaluate(() => { const b = document.querySelector('[data-ns-hati]'); if (b) b.click(); });
    await page.click('#ns-go').catch(() => {});
    await intoBuilder();
    await pause(1000);
    const widths = [];
    for (const w of [1920, 1440, 1366, 1280, 1024]) {
      await page.setViewportSize({ width: w, height: 900 }); await pause(350);
      widths.push(await page.evaluate(x => { const s = document.querySelector('.tb-strip'); const n = document.querySelector('[data-tb-meta="name"]');
        const p = document.getElementById('tb-publish'); const r = s && s.getBoundingClientRect();
        return { w: x, h: r ? Math.round(r.height) : -1, name: n ? Math.round(n.getBoundingClientRect().width) : -1,
          publishIn: !!(p && r) && p.getBoundingClientRect().right <= r.right + 1 }; }, w));
    }
    check('8a · the strip stays ONE line at 30px from 1920 down to 1024, the name never vanishes and Publish stays on screen',
      widths.every(x => x.h > 0 && x.h <= 30 && x.name >= 60 && x.publishIn), widths);
    await page.setViewportSize({ width: 1440, height: 900 });

    check('9 · no page errors anywhere in the run', errors.length === 0, errors.slice(0, 5));
  } catch (e) {
    check('harness', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { bad.forEach(b => console.log('  FAIL ' + b.name)); process.exit(1); }
})();

/* The dictionary's English, read off the source so a check can name a sentence
   without typing it (the test runs outside the page). */
function i18tSafeText(key) {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'i18n.js'), 'utf8');
  const m = new RegExp('\\n\\s+' + key + ":\\s*'((?:[^'\\\\]|\\\\.)*)'").exec(src);
  return m ? m[1].replace(/\\'/g, "'") : '\u0000';
}
function i18tSafe(key) { return i18tSafeText(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
