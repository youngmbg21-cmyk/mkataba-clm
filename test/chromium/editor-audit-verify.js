/* THE CLAUSE EDITOR'S AUDIT, IN A REAL BROWSER (owner, 13 Nov 2026, off four screenshots of MK-382's clause 3:
   "the redlines bullet points have been indented ... but in image 4 from the redline page, the paper is not
   respecting the design or form from the editor page"; "the jambo panel is the old jambo panel that is a card as
   opposed to being a panel that is separated by a thin line from top to bottom"; "the page tells me that I have not
   filed the redline for clause 3 when ... I had already done that"). The node half is f1027.

   WHAT THIS PINS, against a real server, in the new look
     1 a clause redlined with (a) (b) (c) limbs and saved: on Home's paper each limb hangs one step in, with the
       SAME gutter, step and marker measure the editor draws (a relation, never a typed number)
     2 the saved clause opened again from its Redlines row: the foot says it is filed, Save is grey, a press in the
       wording and out again makes nothing dirty, and Escape leaves without a question, back on Redlines
     3 Jambo's panel is a panel: flush to the window's right side and foot, from the page's top, square, no lift,
       one hairline on its left; Save on it is on screen and pressable, at the owner's three screens
     4 typed words: the foot says "Not filed yet" as they go in; Escape asks, quoting the typed words; Keep editing
       stays; Save files into the same change and opens the Notes panel; Escape then closes ONLY the panel
   AT THE PARENT (26c4b19) 1, 2, 3 and 4 fail: the limbs sit flush on Home's paper; the foot says "Draft saved at",
   Save is live over nothing and the way out asks; the panel is a card 8px in; Escape shuts the panel and the page.
   Run: node test/chromium/editor-audit-verify.js */
/* global stPrefSet, newLookApply, getContract, ensureFull, openRedlineWorkbench, negoClauseList, rlOpenClauseEditor, ceApply, clauseEditorOpen, clauseEditorDirty, ceBoxDirty */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const ID = 'MK-EA1';
const DOC = 'WAREHOUSING AND TRANSPORTATION SERVICES\n\n1. Services\nAIT shall provide warehousing and transportation services to the Customer.\n'
  + '2. Term and Termination\nThis Agreement runs for three years.\n'
  + '3. Pricing and Payment\nThe Customer shall pay all rates and charges specified in the applicable rate schedules and appendices to this Agreement.\n'
  + 'AIT may adjust pricing if there are significant increases in external costs.\n'
  + 'AIT may also revise pricing by providing thirty (30) days’ written notice.\n'
  + 'Payment shall be due within thirty (30) calendar days from the invoice date.\n'
  + '4. Liability\nEach party is liable for direct loss only.\n5. Governing Law\nThis Agreement is governed by the laws of Norway.';
const NEW = t => t
  .replace('if there are significant increases in external costs.',
    'to reflect a verified increase in external costs, provided that:\n(a) AIT gives the Customer reasonable supporting evidence of the increase;\n'
    + '(b) any such adjustment shall not exceed the percentage increase in the underlying cost, and shall not exceed ten (10) per cent of the affected charge in any twelve (12) month period; and')
  .replace('AIT may also revise pricing by providing thirty (30) days’ written notice.',
    '(c) AIT gives the Customer not less than thirty (30) days’ written notice before the adjustment takes effect.');

(async () => {
  const h = await startHati({}, { HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const c0 = fixtureContract(ID, 'Warehousing and Transportation Services', 'AIT Worldwide Logistics Norway AS', FOLDER_A, 900000, 'Under Review', DOC);
    Object.assign(c0, { owner: { id: me.id, name: me.name }, negotiation: { round: 1, turn: 'owner', turnAt: new Date().toISOString(), rounds: [] } });
    await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
    const page = await (await browser.newContext({ viewport: { width: 1536, height: 730 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(id => window.state && state.contracts && state.contracts.some(c => c.id === id), ID, 20000);
    await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
    await page.keyboard.press('Escape').catch(() => {});

    /* the stage: the clause redlined with limbs in the editor, and saved */
    const S = await page.evaluate(async id => {
      const c = getContract(id); if (c._light && window.ensureFull) await ensureFull(c);
      openRedlineWorkbench(id);
      const cl = negoClauseList(c).find(x => /Customer shall pay all rates/.test(x.text || ''));
      return cl ? { clauseId: cl.clauseId, text: cl.text } : null;
    }, ID);
    check('0a the stage: the clause is found', !!S);
    await page.evaluate(([id, cid]) => rlOpenClauseEditor(getContract(id), cid, {}), [ID, S.clauseId]);
    await until(() => !!document.querySelector('#clause-editor [data-ce-act="save"]'));
    const applied = await page.evaluate(w => ceApply(w.split('\n').map(l => '<p>' + l.replace(/&/g, '&amp;') + '</p>').join(''), 'Jambo'), NEW(S.text));
    await page.click('#clause-editor [data-ce-act="save"]');
    const filed = await until(id => { const c = getContract(id); const ch = (c.changes || [])[0]; return ch && ch.status === 'pending' ? ch.id : null; }, ID, 8000);
    check('0b the stage: the redline is applied and filed', !!applied && !!filed, String(filed));
    const limbOf = sel => page.evaluate(sel => {
      const p = [...document.querySelectorAll(sel + ' p')].find(x => /^\s*\(b\)/.test(x.textContent)); if (!p) return null;
      const cs = getComputedStyle(p), mk = p.querySelector('.rl-marker'), mcs = mk ? getComputedStyle(mk) : null;
      const plain = [...document.querySelectorAll(sel + ' p')].find(x => /^\s*The Customer shall pay/.test(x.textContent));
      const r = document.createRange(); const tn = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let n, word = null;
      while ((n = tn.nextNode())) { const i = n.data.indexOf('any such'); if (i >= 0) { word = [n, i]; break; } }
      let x1 = null; if (word) { r.setStart(word[0], word[1]); r.setEnd(word[0], word[1] + 3); x1 = r.getBoundingClientRect().left; }
      return { pl: parseFloat(cs.paddingLeft), ml: parseFloat(cs.marginLeft), ti: parseFloat(cs.textIndent), fs: parseFloat(cs.fontSize),
        mkDisplay: mcs && mcs.display, mkW: mk ? mk.getBoundingClientRect().width : 0,
        stepIn: plain ? Math.round(p.getBoundingClientRect().left - plain.getBoundingClientRect().left) : null,
        wordIn: (plain && x1 != null) ? Math.round(x1 - plain.getBoundingClientRect().left) : null };
    }, sel);
    const ED = await limbOf('#clause-editor #ce-doc');

    /* 1 Home's paper */
    await page.evaluate(() => { try { if (window.closeContextPanel) window.closeContextPanel(); } catch (_) {} });
    await page.evaluate(id => { if (clauseEditorOpen()) window.rlCloseClauseEditor({ repaint: true }); openRedlineWorkbench(id); }, ID);
    await until(() => [...document.querySelectorAll('#ig-canvas p')].some(x => /^\s*\(b\)/.test(x.textContent)), null, 10000);
    const HM = await limbOf('#ig-canvas');
    const em = v => (v && v.fs) ? Math.round((v.pl / v.fs) * 100) / 100 : null;
    check('1a on Home\'s paper the limb hangs: a gutter, the marker a block the gutter\'s width', !!HM && HM.pl > 20 && HM.ti < -20 && HM.mkDisplay === 'inline-block' && HM.mkW >= HM.pl - 1, JSON.stringify(HM));
    check('1b and sits one step in from the clause\'s own paragraphs', !!HM && HM.ml > 20 && HM.stepIn > 20, JSON.stringify(HM));
    check('1c the SAME measures the editor draws (gutter and step, in em of each paper\'s own type)', !!HM && !!ED && em(HM) === em(ED)
      && Math.round((HM.ml / HM.fs) * 100) === Math.round((ED.ml / ED.fs) * 100), JSON.stringify({ home: HM, editor: ED }));
    check('1d the limb\'s words start two gutters in, clear of the marker', !!HM && HM.wordIn >= Math.round(HM.pl + HM.ml) - 2, JSON.stringify(HM));

    /* 2 opened again from its row, untouched */
    const row = await until(() => !!document.querySelector('[data-rl-cp-editor-row]'), null, 8000);
    check('2a the Redlines row offers Edit', !!row);
    await page.click('[data-rl-cp-editor-row]');
    await until(() => !!document.querySelector('#clause-editor #ce-clausebody[contenteditable="true"]'), null, 8000);
    const foot = () => page.evaluate(() => { const s = document.querySelector('#clause-editor [data-ce-act="save"]'), d = document.querySelector('#ce-draft'), is = document.querySelector('#clause-editor .ce-row-is');
      return { save: !!s && !s.disabled, draft: d && d.textContent.trim(), is: is && is.textContent.trim(), dirty: clauseEditorDirty(), boxDirty: ceBoxDirty() }; });
    const F2 = await foot();
    check('2b the foot says it is filed, and Save is grey', F2.draft === 'Filed as ' + filed + ' · no changes since' && !F2.save, JSON.stringify(F2));
    check('2c the line under the clause\'s head says it is filed', F2.is === 'Your draft, filed as ' + filed + ' · new typing is filed when you save', F2.is);
    const bb = await (await page.$('#ce-clausebody')).boundingBox();
    await page.mouse.click(bb.x + 180, bb.y + 14);
    await until(() => document.activeElement && document.activeElement.id === 'ce-clausebody', null, 3000);
    /* out again by a blur of the box itself: a press above it could land in the clause's own name, which is typed
       in too and keeps Escape for itself */
    await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
    await until(() => !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#ce-clausebody, #ce-clausehead')), null, 3000);
    const F2b = await foot();
    check('2d a press in the wording and out again makes nothing dirty', !F2b.dirty && !F2b.boxDirty && !F2b.save && /^Filed as /.test(F2b.draft || ''), JSON.stringify(F2b));

    /* 3 the panel, at the three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await until(wd => { const r = document.querySelector('#clause-editor .ce-rail'); return r && Math.abs(r.getBoundingClientRect().right - wd) <= 1; }, w, 3000);
      const G = await page.evaluate(() => { const rail = document.querySelector('#clause-editor .ce-rail'), pg = document.getElementById('clause-editor'), s = rail.querySelector('[data-ce-act="save"]');
        const r = rail.getBoundingClientRect(), p = pg.getBoundingClientRect(), cs = getComputedStyle(rail), sr = s.getBoundingClientRect();
        return { right: Math.round(innerWidth - r.right), bottom: Math.round(innerHeight - r.bottom), top: Math.round(r.top - p.top), radius: cs.borderTopLeftRadius + '/' + cs.borderBottomRightRadius, shadow: cs.boxShadow,
          line: cs.borderLeftWidth + ' ' + cs.borderLeftStyle, otherLines: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth].join(' '),
          saveHit: document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2) === s, saveIn: sr.bottom <= innerHeight && sr.right <= innerWidth, sideways: document.documentElement.scrollWidth - innerWidth }; });
      check(`3 ${w}×${ht}: the panel is flush, square, unlifted, one hairline on its left; Save is on it and pressable`,
        G.right === 0 && G.bottom === 0 && G.top === 0 && G.radius === '0px/0px' && G.shadow === 'none' && G.line === '1px solid' && G.otherLines === '0px 0px 0px'
        && G.saveHit && G.saveIn && G.sideways <= 0, JSON.stringify(G));
    }
    await page.setViewportSize({ width: 1536, height: 730 });

    /* 2e Escape, nothing typed: no question, back on Redlines */
    await page.keyboard.press('Escape');
    const left = await until(() => !clauseEditorOpen() && !document.querySelector('#modal-root [role="dialog"]') && !document.querySelector('[data-top-overlay]'), null, 4000);
    check('2e Escape leaves without a question', !!left, JSON.stringify(await page.evaluate(() => ({ open: clauseEditorOpen(), dlg: (document.querySelector('#modal-root [role="dialog"], [data-top-overlay]') || {}).innerText || null }))));
    check('2f and lands back on Redlines, the row there', !!(await until(() => !!document.querySelector('[data-rl-cp-editor-row]'), null, 6000)));

    /* 4 typed words */
    await page.click('[data-rl-cp-editor-row]');
    await until(() => !!document.querySelector('#clause-editor #ce-clausebody[contenteditable="true"]'), null, 8000);
    await page.evaluate(() => { const p = [...document.querySelectorAll('#ce-clausebody p')].find(x => /Payment shall be due/.test(x.textContent));
      const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); document.getElementById('ce-clausebody').focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await page.keyboard.type(' Interest runs after that.');
    const F4 = await until(() => { const d = document.querySelector('#ce-draft'); return /^Not filed yet/.test((d && d.textContent) || '') ? d.textContent.trim() : null; }, null, 4000);
    check('4a the foot says "Not filed yet" as the words go in, and Save wakes', !!F4 && (await foot()).save, String(F4));
    await page.keyboard.press('Escape');
    const asked = await until(() => { const d = document.querySelector('[data-top-overlay], #modal-root [role="dialog"]'); return d && /Leave this clause/.test(d.innerText || '') ? d.innerText : null; }, null, 4000);
    check('4b Escape asks, and quotes the typed words rather than the clause\'s first sentence', !!asked && /Interest runs after that/.test(asked) && !/What is not filed reads “The Customer shall pay/.test(asked), String(asked).replace(/\s+/g, ' ').slice(0, 260));
    await page.evaluate(() => { const b = document.querySelector('[data-top-overlay] [data-dlg-cancel], #modal-root [data-dlg-cancel]'); if (b) b.click(); });
    await until(() => !document.querySelector('[data-top-overlay]') && !document.querySelector('#modal-root [role="dialog"]'), null, 4000);
    check('4c Keep editing stays on the page, the words still there', await page.evaluate(() => clauseEditorOpen() && /Interest runs after that/.test(document.getElementById('ce-clausebody').textContent)));
    await page.click('#clause-editor [data-ce-act="save"]');
    const rev = await until(id => { const c = getContract(id); const ch = (c.changes || [])[0]; return ch && /Interest runs after that/.test(ch.newText || '') ? (c.changes || []).length : null; }, ID, 8000);
    check('4d Save files into the same change', rev === 1, String(rev));
    const panelUp = await until(() => !!document.querySelector('#context-panel.open'), null, 6000);
    check('4e the Notes panel opens on the filing', !!panelUp);
    if (panelUp) {
      await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
      await page.keyboard.press('Escape');
      const shut = await until(() => !document.querySelector('#context-panel.open'), null, 4000);
      const still = await page.evaluate(() => ({ open: clauseEditorOpen(), dlg: !!document.querySelector('[data-top-overlay], #modal-root [role="dialog"]') }));
      check('4f Escape closes ONLY the panel: the editor is still open and nothing is asked', !!shut && still.open && !still.dlg, JSON.stringify(still));
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
