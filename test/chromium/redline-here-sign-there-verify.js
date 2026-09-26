/* Chromium verification: REDLINE HERE, SIGN THERE
   ============================================================
   Young, 26 September 2026: *"go as recommended. Start from the latest
   main"* — the go on the whole design, every decision as recommended. Walked
   end to end where a person actually looks:

     1  UPLOAD ASKS WHO RUNS THE SIGNING. "They do" opens a working file with a
        working reference (RL-###), and the button says what the press does.
     2  THE WORKING FILE LIVES ON NEGOTIATIONS. Off the Contracts list; a search
        there still finds it and says where it lives.
     3  THE SIGNING TAB IS THE HANDOVER: who runs the signing, no "Sign here"
        on HaTi's page, and the button holds on the one list.
     4  AGREE AND HAND OVER. The window, a clean Word file downloaded, the words
        lock, the status word and the waiting card.
     5  THEIR LINK READS ONLY and hands them the agreed Word file.
     6  THE SIGNED COPY COMES BACK THROUGH UPLOAD, is recognised, checked and
        filed — and the contract takes its number, printed everywhere a
        reference is.
     7  THE RECORD shows the signed copy, its fingerprint, and the seal checks.
     8  THE BLANKS THEY FILLED IN (Young ruled 26 Sep 2026: "yes, accept the
        filled-in blanks without asking"). A second file whose agreed words
        leave three blanks comes back with them filled: the same wording, the
        fills listed and kept, File as signed. Against the commit before that
        work (e2d34ea) 8a0–8e fail — the screen there reads "3 differences from
        the agreed wording" and offers only File with the difference and Hold;
        the two stage lines pass on both.

   Everything is read off the RENDERED page. A section that cannot be staged
   reports its failure rather than timing out.

   Run: node test/chromium/redline-here-sign-there-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'f388-'));

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* A BUILD WITHOUT THE FEATURE REPORTS A CHECK AT A TIME. The walk is one journey
   — every section stands on the file the first one opens — so where it stops,
   every check it did not reach is reported FAILED by name, read off this file's
   own calls rather than kept as a second list that could drift. A press waits
   seconds, not the driver's half minute, for a control that is not there. */
const EXPECT = (() => {
  const src = fs.readFileSync(__filename, 'utf8');
  const names = [...src.matchAll(/check\(\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
  const skip = new Set(['the file ran to the end', '5 · stage: a link for the other side']);
  return [...new Set(names)].filter(n => !skip.has(n));
})();

const AGREED = [
  'SOFTWARE AS A SERVICE AGREEMENT',
  'This Agreement is made between Nordkust Industri AB and Highland Corporate Ltd.',
  '1. Term. This Agreement is effective from 1 October 2026 and continues until 31 December 2027.',
  '2. Services. The Provider shall make the Services available to the Customer throughout the Term.',
  '3. Fees. The Customer shall pay the fees set out in the Order Form within thirty days of invoice.',
  '4. Governing law. This Agreement is governed by the laws of Denmark.',
];

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const press = async (sel, timeout = 5000) => { await page.waitForSelector(sel, { timeout }); await page.click(sel); };
    /* The one list, settled on the open file: a value, our signatory, a brief
       read, and the three readings current — so the handover is the press. */
    const stageReady = () => page.evaluate(async () => {
      try {
        const c = getContract(state.activeId);
        await ensureFull(c);
        const me = currentUser();
        c.value = 120000; c.fields = { ...(c.fields || {}), value: '120000' };
        c.signerPlan = [{ id: 'sg_me', party: 'internal', name: me.name, memberId: me.id, email: me.email, order: 1, signed: false, role: 'Head of Legal' }];
        c._brief = { v: 1, at: new Date(Date.now() + 60000).toISOString(), by: 'Stage', truncated: false, data: {} };
        if (window.briefMarkRead) briefMarkRead(c);
        const hash = playbookHashOf(playbookText(c));
        c.playbook = { label: 'Default', wordingHash: hash, verdicts: [] };
        c.obligationsReadHash = hash; c.signCheck = { at: new Date().toISOString(), wordingHash: hash };
        state.settings = { ...(state.settings || {}), approvalRules: [] };
        persist(c); await flushSaves();
        renderWorkspace();
        await new Promise(r => setTimeout(r, 300));
        roomGoTab(c, 'sign');
        await new Promise(r => setTimeout(r, 700));
        return { ok: true, n: signReadiness(c).n };
      } catch (e) { return { ok: false, err: String(e && e.message) }; }
    });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ===== 1. UPLOAD ASKS WHO RUNS THE SIGNING ===== */
    const f = path.join(OUT, 'saas.docx');
    fs.writeFileSync(f, Buffer.from(mkDocx(AGREED.map(t => para(t)).join(''))));
    /* No Copilot on this stage: the pattern reader is the path every workspace
       without a key takes, and nothing below depends on what a model read. */
    await page.evaluate(() => { state.aiConfigured = false; openUploadModal(); });
    await page.waitForTimeout(400);
    await page.setInputFiles('#up-file', f);
    let step2 = true;
    try {
      await page.waitForFunction(() => { const s2 = document.getElementById('up-step-2'); return s2 && !s2.classList.contains('hidden'); }, null, { timeout: 20000 });
    } catch (_) { step2 = false; }
    check('1 · stage: the upload dialog read the file', step2);
    const q = await page.evaluate(() => { const b = document.getElementById('up-route');
      return b ? { route: b.dataset.route, segs: [...b.querySelectorAll('[data-up-route]')].map(x => x.getAttribute('data-up-route') + ':' + x.getAttribute('aria-pressed')),
        go: document.getElementById('up-go').textContent.trim() } : null; });
    check('1a the upload asks who runs the signing, and HaTi is the default until an admin says otherwise',
      q && q.route === 'inside' && q.segs.includes('outside:false') && q.segs.includes('inside:true'), JSON.stringify(q));
    await press('[data-up-route="outside"]');
    const goWord = await page.evaluate(() => document.getElementById('up-go').textContent.trim());
    check('1b answering "They do" changes what the button says it will do', /redlining/i.test(goWord), goWord);
    if (!(await page.evaluate(() => document.getElementById('up-cp').value))) await page.fill('#up-cp', 'Nordkust Industri AB');
    await page.click('#up-go');
    await page.waitForTimeout(2500);
    const made = await page.evaluate(() => { const c = getContract(state.activeId);
      return c ? { id: c.id, route: c.signRoute || '', no: c.contractNo || '', view: state.view } : null; });
    check('1c it opens a working file with a working reference and no contract number yet',
      made && /^RL-\d{3}$/.test(made.id) && made.route === 'outside' && !made.no && made.view === 'workspace', JSON.stringify(made));
    const RL = made && made.id;

    /* ===== 2. IT LIVES ON NEGOTIATIONS ===== */
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(900);
    const onContracts = await page.evaluate(id => !!document.querySelector(`.reg-table tr[data-row="${id}"], .reg-table [data-sel="${id}"], .reg-table [data-row-id="${id}"]`)
      || [...document.querySelectorAll('.reg-table .reg-mk')].some(td => td.textContent.trim() === id), RL);
    check('2a the Contracts list does not carry a working file', !onContracts);
    await page.evaluate(id => { const R = regState(); R.query = id; regRepaint(); }, RL);
    await page.waitForTimeout(700);
    const found = await page.evaluate(id => { const td = [...document.querySelectorAll('.reg-table .reg-mk')].find(x => x.textContent.trim() === id);
      const row = td && td.closest('tr'); return row ? row.textContent.replace(/\s+/g, ' ') : ''; }, RL);
    check('2b a search on Contracts still finds it, and the row says where it lives', /on Negotiations/i.test(found), found.slice(0, 160));
    await page.evaluate(() => { const R = regState(); R.query = ''; regRepaint(); });
    await page.evaluate(() => { if (window.openNegotiations) openNegotiations({ list: true }); else setView('redline'); });
    await page.waitForTimeout(1200);
    const onNego = await page.evaluate(id => [...document.querySelectorAll('.reg-table .reg-mk')].some(td => td.textContent.trim() === id), RL);
    await page.screenshot({ path: path.join(OUT, '2-negotiations.png') });
    check('2c the Negotiations page lists it from the day it is opened, before a change is filed', onNego);

    /* ===== 3. THE SIGNING TAB IS THE HANDOVER ===== */
    await page.evaluate(id => { openWorkspace(id); }, RL);
    await page.waitForTimeout(700);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'sign'));
    await page.waitForTimeout(900);
    const tab = await page.evaluate(() => ({
      card: !!document.querySelector('#sign-block .ho-route'),
      flags: document.querySelectorAll('#doc-canvas [data-pg-flag]').length,
      btn: (document.getElementById('ho-hand') || {}).textContent || '',
      sign: !!document.getElementById('sign-btn'),
      head: ((document.getElementById('ws-next-action') || {}).textContent || '').trim(),
    }));
    await page.screenshot({ path: path.join(OUT, '3-signing-tab.png') });
    check('3a the Signing tab says who runs the signing', tab.card);
    check('3b HaTi\'s page draws no "Sign here" on a file they sign', tab.flags === 0, `${tab.flags} flags`);
    check('3c the one button is the handover, holding on the one list, and there is no Sign button',
      /Hand over/.test(tab.btn) && /to settle/.test(tab.btn) && !tab.sign, tab.btn.trim());
    check('3d the room\'s next step says the same', /Hand over/.test(tab.head), tab.head);

    /* ===== 4. AGREE AND HAND OVER ===== */
    const staged = await stageReady();
    check('4 · stage: nothing left on the list (value, signatory, brief, readings)', staged.ok && staged.n === 0, JSON.stringify(staged));
    /* the share the other side will read, made before the handover */
    const token = await page.evaluate(async id => {
      const c = getContract(id);
      const r = await api('shares', 'POST', { payload: { kind: 'hati-share', purpose: 'negotiate', purposeChosen: 'negotiate',
        org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
        contract: { id: c.id, name: c.name, docText: 'x' } }, channel: 'link', recipient: { name: 'Lars Berg', email: 'lars@nordkust.se' },
        expiryDays: 30, durable: true, purpose: 'negotiate' });
      return r && r.token;
    }, RL);
    await press('#ho-hand');
    await page.waitForTimeout(700);
    const win = await page.evaluate(() => { const w = document.querySelector('.ho-win'); return w ? w.innerText : ''; });
    await page.screenshot({ path: path.join(OUT, '4-window.png') });
    check('4a the window asks how they agreed, who signs for us and how the Word file leaves — nothing about how THEY sign',
      /How they agreed/.test(win) && /Signs for us/.test(win) && /Word file/.test(win) && !/DocuSign/.test(win), win.slice(0, 200).replace(/\s+/g, ' '));
    await press('[data-ho-ch="download"]');
    const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await press('#ho-go');
    const d = await dl;
    let docxPath = null;
    if (d) { docxPath = path.join(OUT, 'agreed.docx'); await d.saveAs(docxPath); }
    await page.waitForTimeout(1500);
    const bytes = docxPath ? fs.readFileSync(docxPath) : Buffer.alloc(0);
    check('4b the agreed words leave as a Word file — a real .docx, named by the working reference',
      !!d && bytes.slice(0, 2).toString() === 'PK' && new RegExp(RL + '-agreed\\.docx').test(d.suggestedFilename()), d ? d.suggestedFilename() : 'no download');
    const out = await page.evaluate(() => { const c = getContract(state.activeId);
      return { ho: !!(c.handover && c.handover.at), frozen: !!(window.negoWordingFrozen && negoWordingFrozen(c)),
        start: window.negoMayStart ? negoMayStart(c).why : '', status: (document.querySelector('.room-head') || {}).innerText || '',
        card: !!document.getElementById('ho-wait'), file: !!document.getElementById('ho-file') }; });
    await page.screenshot({ path: path.join(OUT, '4-out.png') });
    check('4c it is out with them: the status word says so, beside the days', /With them for signature/.test(out.status), out.status.split('\n').slice(0, 3).join(' | '));
    check('4d the words lock — the negotiation will not take a change', out.frozen && out.start === 'handover', JSON.stringify({ frozen: out.frozen, start: out.start }));
    check('4e the waiting card stands where the list stood, and the one button is filing the signed copy', out.card && out.file);

    /* ===== 5. THEIR LINK READS ONLY ===== */
    if (token) {
      const them = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
      them.on('pageerror', e => errors.push('their page: ' + e.message));
      await them.goto(h.base + '/#share=t:' + token, { waitUntil: 'networkidle' });
      await them.waitForTimeout(2500);
      const p = await them.evaluate(() => { const b = document.getElementById('pt-handover'); const a = document.getElementById('pt-ho-file');
        return { banner: b ? b.innerText : '', href: a ? a.getAttribute('href') : '', readOnly: !!(window.portalHandedOver && portalHandedOver()) }; });
      await them.screenshot({ path: path.join(OUT, '5-their-link.png') });
      check('5a their link says the agreed wording is with them to sign, and reads only', /with you to sign/i.test(p.banner) && p.readOnly, p.banner.slice(0, 120));
      check('5b and hands them the agreed Word file', /handover-file$/.test(p.href || ''), p.href);
      await them.context().close();
    } else check('5 · stage: a link for the other side', false, 'no token');

    /* ===== 6. THE SIGNED COPY COMES BACK THROUGH UPLOAD ===== */
    const signed = path.join(OUT, 'signed.docx');
    fs.writeFileSync(signed, Buffer.from(mkDocx([
      para('NORDKUST INDUSTRI AB — SOFTWARE AS A SERVICE AGREEMENT'),
      ...AGREED.slice(1).map(t => para(t.replace(/^(\d)\. /, '§$1 '))),
      para('Signed for Nordkust Industri AB: Lars Berg, 29 September 2026'),
      para('Signed for Highland Corporate Ltd: Amina Otieno, 30 September 2026'),
    ].join(''))));
    await page.evaluate(() => { state.aiConfigured = false; openUploadModal(); });
    await page.waitForTimeout(400);
    await page.setInputFiles('#up-file', signed);
    try { await page.waitForSelector('#ho-up-match', { timeout: 20000 }); } catch (_) {}
    const offer = await page.evaluate(() => { const m = document.getElementById('ho-up-match'); return m ? m.innerText : ''; });
    await page.screenshot({ path: path.join(OUT, '6-upload-offer.png') });
    check('6a the Upload button recognises the signed copy and asks — never assumes', new RegExp('signed copy of ' + RL).test(offer), offer.slice(0, 120));
    await page.click('[data-ho-up-file]').catch(() => {});
    await page.waitForSelector('.ho-file', { timeout: 15000 }).catch(() => {});
    const screen = await page.evaluate(() => { const r = document.querySelector('.ho-file-r'); return r ? r.innerText : ''; });
    await page.screenshot({ path: path.join(OUT, '6-filing.png') });
    check('6b the filing screen reads the same words, ignoring their design, and who signed', /Same wording as agreed/.test(screen) && /Amina Otieno/.test(screen), screen.slice(0, 160).replace(/\s+/g, ' '));
    await page.selectOption('#ho-via', 'docusign').catch(() => {});
    const fileBtn = await page.$('[data-ho-f="file"]');
    check('6c with the same words and everyone signed, the press is File as signed', !!fileBtn);
    if (fileBtn) { await fileBtn.click(); await page.waitForTimeout(3000); }
    await page.evaluate(() => { const b = [...document.querySelectorAll('#modal-root button')].find(x => /cancel/i.test(x.textContent)); if (b) b.click(); });
    await page.waitForTimeout(500);
    const filed = await page.evaluate(() => { const c = getContract(state.activeId);
      return { id: c.id, no: c.contractNo || '', status: c.status, sub: ((document.querySelector('.room-sub-id') || {}).textContent || '').trim(),
        crumb: ((document.getElementById('shell-title') || {}).textContent || '').replace(/\s+/g, ' ').trim() }; });
    check('6d filed as signed, it takes its contract number — from the server, in that save', /^MK-\d+$/.test(filed.no) && filed.status === 'Signed' && filed.id === RL, JSON.stringify(filed));
    check('6e the room\'s head and the breadcrumb print the number, not the working reference',
      filed.sub === filed.no && filed.crumb.includes(filed.no) && !filed.crumb.includes(RL), `${filed.sub} · ${filed.crumb}`);
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(900);
    const row = await page.evaluate(no => [...document.querySelectorAll('.reg-table .reg-mk')].some(td => td.textContent.trim() === no), filed.no);
    check('6f it is on the Contracts list now, under its number', row);
    await page.evaluate(() => { if (window.openNegotiations) openNegotiations({ list: true }); });
    await page.waitForTimeout(900);
    const still = await page.evaluate(id => (window.negoLiveList ? negoLiveList() : []).some(c => c.id === id), RL);
    check('6g and off the Negotiations page', !still);

    /* ===== 7. THE RECORD ===== */
    await page.evaluate(id => { openWorkspace(id); }, RL);
    await page.waitForTimeout(700);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForTimeout(1200);
    const rec = await page.evaluate(() => { const b = document.querySelector('.ho-ex');
      return b ? { text: b.innerText, open: !!b.querySelector('[data-ho-open-file]') } : null; });
    await page.screenshot({ path: path.join(OUT, '7-record.png') });
    check('7a the record shows the signed copy of record, its fingerprint and a way to open it',
      rec && /signed outside HaTi/i.test(rec.text) && /SHA-256/.test(rec.text) && rec.open, rec ? rec.text.slice(0, 120).replace(/\s+/g, ' ') : 'no block');
    /* The toast the reader sees is the answer: read off the page, never off a
       stub — the module calls its own toast, which a window stub never
       reaches. */
    const seal = await page.evaluate(async () => {
      const root = document.getElementById('toast-root');
      if (root) root.innerHTML = '';
      await verifySeal(getContract(state.activeId));
      await new Promise(r => setTimeout(r, 200));
      return root ? root.innerText.trim() : '';
    });
    check('7b the seal checks — over the signed copy itself', /valid/i.test(seal) && !/MISMATCH|cannot/i.test(seal), seal.slice(0, 160));

    /* ===== 8. THE BLANKS THEY FILLED IN (Young ruled 26 Sep 2026: "yes, accept
       the filled-in blanks without asking") =====
       A second file whose agreed words leave three blanks — a delivery address
       in the middle of a clause, a name and a date — comes back with all three
       filled. The same wording, the fills listed on the screen and kept on the
       record, and nobody asked to accept a difference. */
    const AGREED_B = [
      'SUPPLY AGREEMENT',
      'This Agreement is made between Kijani Foods Ltd and Highland Corporate Ltd.',
      '1. Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.',
      '2. Delivery. The Supplier shall deliver the Goods to: ______________________',
      '3. Fees. The Customer shall pay the fees within thirty days of invoice.',
      'For and on behalf of Kijani Foods Ltd',
      'Name: ______________________',
      'Date: ______________________',
    ];
    const fb = path.join(OUT, 'supply.docx');
    fs.writeFileSync(fb, Buffer.from(mkDocx(AGREED_B.map(t => para(t)).join(''))));
    await page.evaluate(() => { state.aiConfigured = false; openUploadModal(); });
    await page.waitForTimeout(400);
    await page.setInputFiles('#up-file', fb);
    await page.waitForFunction(() => { const s2 = document.getElementById('up-step-2'); return s2 && !s2.classList.contains('hidden'); }, null, { timeout: 20000 }).catch(() => {});
    await press('[data-up-route="outside"]');
    await page.fill('#up-cp', 'Kijani Foods Ltd');
    await page.click('#up-go');
    await page.waitForTimeout(2500);
    const RL2 = await page.evaluate(() => { const c = getContract(state.activeId); return c && c.signRoute === 'outside' ? c.id : ''; });
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'sign'));
    await page.waitForTimeout(700);
    const staged2 = await stageReady();
    check('8 · stage: a second working file, its list settled', /^RL-\d{3}$/.test(RL2) && RL2 !== RL && staged2.ok && staged2.n === 0, JSON.stringify({ RL2, staged2 }));
    await press('#ho-hand');
    await page.waitForTimeout(700);
    await press('[data-ho-ch="download"]');
    const dl2 = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await press('#ho-go');
    await dl2;
    await page.waitForTimeout(1500);
    const out2 = await page.evaluate(() => { const c = getContract(state.activeId); return !!(c.handover && c.handover.at); });
    check('8 · stage: handed over with its blanks — a ruled line does not hold the handover', out2);
    const signedB = path.join(OUT, 'supply-signed.docx');
    fs.writeFileSync(signedB, Buffer.from(mkDocx([
      para('KIJANI FOODS LTD — SUPPLY AGREEMENT'),
      para('This Agreement is made between Kijani Foods Ltd and Highland Corporate Ltd.'),
      para('§1 Term. This Agreement is effective from 1 October 2026 and continues until 30 September 2027.'),
      para('§2 Delivery. The Supplier shall deliver the Goods to: Warehouse 4, Mombasa Road, Nairobi'),
      para('§3 Fees. The Customer shall pay the fees within thirty days of invoice.'),
      para('For and on behalf of Kijani Foods Ltd'),
      para('Name: Wanjiru Kamau'),
      para('Date: 29 September 2026'),
      para('Signed for Kijani Foods Ltd: Wanjiru Kamau, 29 September 2026'),
      para('Signed for Highland Corporate Ltd: Amina Otieno, 30 September 2026'),
    ].join(''))));
    /* The check our signatory runs before signing draws the same list, off the
       same builder, in its own window — pressed through the waiting card. */
    await press('[data-ho-act="check"]').catch(() => {});
    await page.waitForSelector('#ho-fd-file', { timeout: 5000 }).catch(() => {});
    await page.setInputFiles('#ho-fd-file', signedB).catch(() => {});
    await page.click('#ho-fd-go', { timeout: 5000 }).catch(() => {});
    await page.waitForSelector('#ho-fd-out .ho-res', { timeout: 15000 }).catch(() => {});
    const chk = await page.evaluate(() => { const r = document.querySelector('#ho-fd-out .ho-res');
      return r ? { same: r.classList.contains('is-same'), text: r.innerText.replace(/\s+/g, ' '),
        rows: [...r.querySelectorAll('.ho-fills[open] .ho-fill')].length } : null; });
    check('8a0 the check before we sign reads the filled blanks as the same wording and lists them',
      chk && chk.same && chk.rows === 3 && /3 blanks they filled in/.test(chk.text), JSON.stringify(chk).slice(0, 220));
    await page.click('#ho-fd-cancel').catch(() => {});
    await page.waitForTimeout(400);
    await page.evaluate(() => { state.aiConfigured = false; openUploadModal(); });
    await page.waitForTimeout(400);
    await page.setInputFiles('#up-file', signedB);
    try { await page.waitForSelector('#ho-up-match', { timeout: 20000 }); } catch (_) {}
    await page.click('[data-ho-up-file]', { timeout: 5000 }).catch(() => {});
    await page.waitForSelector('.ho-file', { timeout: 15000 }).catch(() => {});
    const scr = await page.evaluate(() => {
      const r = document.querySelector('.ho-file-r');
      const f = document.querySelector('.ho-file-r .ho-fills');
      return { text: r ? r.innerText : '', open: !!(f && f.open),
        rows: f ? [...f.querySelectorAll('.ho-fill')].map(x => x.innerText.replace(/\s+/g, ' ').trim()) : [],
        file: !!document.querySelector('[data-ho-f="file"]'), accept: !!document.querySelector('[data-ho-f="accept"]'),
        sendback: !!document.querySelector('[data-ho-f="sendback"]'), hold: !!document.querySelector('[data-ho-f="hold"]') };
    });
    await page.waitForTimeout(600);   // the window fades in; a picture of the fade shows two screens at once
    await page.screenshot({ path: path.join(OUT, '8-filled-blanks.png') });
    check('8a the filing screen reads the filled blanks as the same wording, and says how many were filled',
      /Same wording as agreed/.test(scr.text) && /3 blanks they filled in/.test(scr.text), scr.text.slice(0, 200).replace(/\s+/g, ' '));
    check('8b the list is open and names each blank with what their copy says there',
      scr.open && scr.rows.length === 3 && scr.rows.some(t => /^Name Wanjiru Kamau$/.test(t)) && scr.rows.some(t => /^Date 29 September 2026$/.test(t))
        && scr.rows.some(t => /Warehouse 4, Mombasa Road, Nairobi$/.test(t)), JSON.stringify(scr.rows));
    check('8c the press is File as signed — nobody is asked to accept a difference, and nothing is sent back',
      scr.file && !scr.accept && !scr.sendback && !scr.hold, JSON.stringify({ file: scr.file, accept: scr.accept, sendback: scr.sendback, hold: scr.hold }));
    await page.selectOption('#ho-via', 'docusign').catch(() => {});
    if (scr.file){ await page.click('[data-ho-f="file"]'); await page.waitForTimeout(3000); }
    await page.evaluate(() => { const b = [...document.querySelectorAll('#modal-root button')].find(x => /cancel/i.test(x.textContent)); if (b) b.click(); });
    await page.waitForTimeout(500);
    const kept = await page.evaluate(async id => {
      const c = getContract(id);
      try { await ensureFull(c); } catch (_) {}
      const sc = c.signedCopy || {}, cmpr = sc.compare || {};
      const line = (c.audit || []).map(a => a && (a.detail || a.text || a.what || '')).find(t => /Executed outside HaTi|Signed copy filed/.test(t) || /blanks filled in/.test(t)) || '';
      return { status: c.status, filled: cmpr.filled, fills: (cmpr.fills || []).map(x => x.name + ': ' + x.text), line: String(line) };
    }, RL2);
    check('8d filed, the record keeps what was written in each blank, and the trail says how many',
      kept.status === 'Signed' && kept.filled === 3 && kept.fills.includes('Name: Wanjiru Kamau') && /3 blanks filled in/.test(kept.line), JSON.stringify(kept).slice(0, 300));
    await page.evaluate(id => { openWorkspace(id); }, RL2);
    await page.waitForTimeout(700);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForTimeout(1200);
    const rec2 = await page.evaluate(() => { const b = document.querySelector('.ho-ex'); return b ? b.innerText.replace(/\s+/g, ' ') : ''; });
    check('8e the signed record says it: the same as the agreed version, three blanks they filled in', /3 blanks they filled in/.test(rec2), rec2.slice(0, 200));

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the file ran to the end', false, String(e && e.stack || e).slice(0, 400));
    const why = 'not reached — ' + String((e && e.message) || e).split('\n')[0].slice(0, 140);
    const seen = new Set(results.map(r => r.name));
    for (const n of EXPECT) if (!seen.has(n)) check(n, false, why);
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed · shots in ${OUT}`);
  process.exit(failed ? 1 : 0);
})();
