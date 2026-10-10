/* Chromium verification: THE SIGNED COPY COMES BACK WITH DIFFERENT WORDS
   ============================================================
   Owner-asked 10 Oct 2026, after the coverage report showed "sending a
   contract out to be signed elsewhere" (js/views/handover.js) was about a
   quarter checked. redline-here-sign-there-verify walks the journey where
   their copy comes back the SAME (and with blanks filled). This walks the
   risky one: their signed copy changed a word of what was agreed.

     1  STAGE: a working file the other side signs, handed over (as the
        sibling check does it).
     2  THE FILING SCREEN SAYS IT: one difference, the agreed word struck and
        theirs marked, under the clause it sits in.
     3  THE BUTTONS FOLLOW WHO HAS SIGNED: everybody signed → no plain "File as
        signed", only file WITH the difference (an admin) or hold; untick
        "everybody signed" → Send it back leads.
     4  ACCEPTING NEEDS A REASON: backing out of the reason files nothing.
     5  WITH A REASON IT FILES, and the record says who accepted it and why;
        the duties suggested next are read off the SIGNED copy.
     6  SOMEBODY WHO MAY NOT ACCEPT (an editor who did not approve it) is not
        offered it, is told who may, and a hold leaves it unfiled.

   Everything is read off the RENDERED page or the stored record. A section
   that cannot be staged reports its failure rather than timing out.

   Run: node test/chromium/signed-copy-differs-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'differs-'));

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const EXPECT = (() => {
  const src = fs.readFileSync(__filename, 'utf8');
  const names = [...src.matchAll(/check\(\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
  return [...new Set(names)].filter(n => n !== 'the file ran to the end');
})();

const agreedOf = cp => [
  'SERVICES AGREEMENT',
  `This Agreement is made between ${cp} and Highland Corporate Ltd.`,
  '1. Term. This Agreement is effective from 1 October 2026 and continues until 31 December 2027.',
  '2. Services. The Provider shall make the Services available to the Customer throughout the Term.',
  '3. Fees. The Customer shall pay the fees set out in the Order Form within thirty days of invoice.',
  '4. Governing law. This Agreement is governed by the laws of Kenya.',
];
/* Their copy: their own title line, their numbering, both signatures — and
   ONE word changed in clause 3: thirty days became sixty. */
const signedOf = (cp, signer) => [
  para(`${cp.toUpperCase()} — SERVICES AGREEMENT`),
  ...agreedOf(cp).slice(1).map(t => para(t.replace(/^(\d)\. /, '§$1 ').replace('within thirty days', 'within sixty days'))),
  para(`Signed for ${cp}: ${signer}, 29 September 2026`),
  para('Signed for Highland Corporate Ltd: Amina Otieno, 30 September 2026'),
].join('');

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const press = async (p, sel, timeout = 5000) => { await p.waitForSelector(sel, { timeout }); await p.click(sel); };
    const login = async (p, email, pass) => {
      await p.goto(h.base + '/', { waitUntil: 'networkidle' });
      await p.waitForTimeout(600);
      await p.fill('#li-email', email);
      await p.fill('#li-pass', pass);
      await p.click('#li-go');
      await p.waitForTimeout(2400);
    };
    /* The sibling check's staging, verbatim in purpose: upload as "They do",
       settle the one list, hand over with a downloaded Word file. */
    const handOver = async (cp, file) => {
      fs.writeFileSync(file, Buffer.from(mkDocx(agreedOf(cp).map(t => para(t)).join(''))));
      await page.evaluate(() => { state.aiConfigured = false; openUploadModal(); });
      await page.waitForTimeout(400);
      await page.setInputFiles('#up-file', file);
      await page.waitForFunction(() => { const s2 = document.getElementById('up-step-2'); return s2 && !s2.classList.contains('hidden'); }, null, { timeout: 20000 }).catch(() => {});
      await press(page, '[data-up-route="outside"]');
      await page.fill('#up-cp', cp);
      await page.click('#up-go');
      await page.waitForTimeout(2500);
      const staged = await page.evaluate(async () => {
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
          persist(c); await flushSaves();
          renderWorkspace();
          await new Promise(r => setTimeout(r, 300));
          roomGoTab(c, 'sign');
          await new Promise(r => setTimeout(r, 700));
          return { id: c.id, route: c.signRoute || '', n: signReadiness(c).n };
        } catch (e) { return { err: String(e && e.message) }; }
      });
      await press(page, '#ho-hand');
      await page.waitForTimeout(700);
      await press(page, '[data-ho-ch="download"]');
      const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      await press(page, '#ho-go');
      await dl;
      await page.waitForTimeout(1500);
      const out = await page.evaluate(id => { const c = getContract(id); return !!(c && c.handover && c.handover.at); }, staged.id);
      return { ...staged, out };
    };
    /* Upload their copy, take the offer, land on the filing screen. */
    const openFiling = async (p, file) => {
      await p.evaluate(() => { state.aiConfigured = false; openUploadModal(); });
      await p.waitForTimeout(400);
      await p.setInputFiles('#up-file', file);
      const offered = await p.waitForSelector('#ho-up-match', { timeout: 20000 }).then(() => true).catch(() => false);
      await p.click('[data-ho-up-file]', { timeout: 5000 }).catch(() => {});
      await p.waitForSelector('.ho-file', { timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(600);
      return offered;
    };
    const acts = p => p.evaluate(() => ({
      file: !!document.querySelector('[data-ho-f="file"]'), accept: !!document.querySelector('[data-ho-f="accept"]'),
      hold: !!document.querySelector('[data-ho-f="hold"]'), sendback: !!document.querySelector('[data-ho-f="sendback"]'),
      acceptPartial: !!document.querySelector('[data-ho-f="accept-partial"]'),
      lead: ((document.querySelector('#ho-f-acts .ui-btn-primary') || {}).getAttribute ? document.querySelector('#ho-f-acts .ui-btn-primary').getAttribute('data-ho-f') : ''),
      who: ((document.getElementById('ho-f-acts') || {}).innerText || '').replace(/\s+/g, ' ') }));

    await login(page, 'admin@example.co.ke', 'adminpassword1');

    /* ===== 1. STAGE ===== */
    const A = await handOver('Savanna Logistics Ltd', path.join(OUT, 'a.docx'));
    check('1 · stage: a working file they sign, its list settled and handed over', A.id && A.route === 'outside' && A.n === 0 && A.out, JSON.stringify(A));

    /* ===== 2. THE FILING SCREEN SAYS IT ===== */
    const signedA = path.join(OUT, 'a-signed.docx');
    fs.writeFileSync(signedA, Buffer.from(mkDocx(signedOf('Savanna Logistics Ltd', 'Peter Kariuki'))));
    const offeredA = await openFiling(page, signedA);
    check('2a the Upload button still recognises a copy with a changed word as this contract\'s signed copy', offeredA);
    const scr = await page.evaluate(() => {
      const r = document.querySelector('.ho-file-r');
      return { text: r ? r.innerText.replace(/\s+/g, ' ') : '',
        del: [...document.querySelectorAll('.ho-diffs .ho-del')].map(x => x.textContent),
        ins: [...document.querySelectorAll('.ho-diffs .ho-ins')].map(x => x.textContent),
        head: [...document.querySelectorAll('.ho-diffs .ho-diff-h')].map(x => x.textContent.replace(/\s+/g, ' ').trim()) };
    });
    await page.screenshot({ path: path.join(OUT, '2-filing-differs.png') });
    check('2b the screen says there is one difference from the agreed wording', /1 difference from the agreed wording/.test(scr.text), scr.text.slice(0, 160));
    /* FIXED 10 Oct 2026 (BUGLOG 10 Oct): their "§3" was marked as words they
       added, and the clause was headed with the document's title. */
    check('2c the agreed word is struck and theirs is marked — and nothing else, not their "§3"', scr.del.join('|') === 'thirty' && scr.ins.join('|') === 'sixty', JSON.stringify({ del: scr.del, ins: scr.ins }));
    check('2d the difference is named by the clause it sits in, not by the document\'s title',
      scr.head.some(t => /^3\.?/.test(t)) && !scr.head.some(t => /SERVICES AGREEMENT/.test(t)), JSON.stringify(scr.head));

    /* ===== 3. THE BUTTONS FOLLOW WHO HAS SIGNED ===== */
    const all = await acts(page);
    check('3a everybody signed and the words differ: no plain "File as signed" — an admin may file with the difference, or hold',
      !all.file && all.accept && all.hold && !all.sendback, JSON.stringify(all));
    await page.evaluate(() => { const b = document.getElementById('ho-both'); if (b && b.checked) b.click(); });
    await page.waitForTimeout(300);
    const some = await acts(page);
    check('3b not everybody signed: Send it back leads, and accepting keeps the copy waiting rather than filing',
      some.lead === 'sendback' && some.acceptPartial && !some.accept && !some.file, JSON.stringify(some));
    await page.evaluate(() => { const b = document.getElementById('ho-both'); if (b && !b.checked) b.click(); });
    await page.waitForTimeout(300);

    /* ===== 4. ACCEPTING NEEDS A REASON ===== */
    await page.selectOption('#ho-via', 'docusign').catch(() => {});
    await press(page, '[data-ho-f="accept"]');
    const asked = await page.waitForSelector('#pd-input', { timeout: 5000 }).then(() => true).catch(() => false);
    check('4a accepting the difference asks for a reason first', asked);
    await page.click('#pd-cancel').catch(() => {});
    await page.waitForTimeout(800);
    const backed = await page.evaluate(async id => { const c = await api('contracts/' + encodeURIComponent(id));
      return { status: c.status, screen: !!document.querySelector('.ho-file') }; }, A.id);
    check('4b backing out of the reason files nothing, and the screen stays open', backed.status !== 'Signed' && backed.screen, JSON.stringify(backed));

    /* ===== 5. WITH A REASON IT FILES ===== */
    const WHY = 'Sixty days agreed by phone with Peter Kariuki on 28 September; CFO approved.';
    await press(page, '[data-ho-f="accept"]');
    await page.waitForSelector('#pd-input', { timeout: 5000 }).catch(() => {});
    await page.fill('#pd-input', WHY).catch(() => {});
    await page.click('#pd-ok').catch(() => {});
    /* THE DUTIES ARE READ OFF THE SIGNED COPY (FIXED 10 Oct 2026, BUGLOG 10
       Oct): the suggestions that open after filing quoted the agreed "thirty
       days" while the signed copy of record says sixty. */
    const duties = await page.waitForFunction(() => { const d = document.querySelector('.obd'); return d ? d.innerText.replace(/\s+/g, ' ') : ''; },
      null, { timeout: 15000 }).then(x => x.jsonValue()).catch(() => '');
    await page.screenshot({ path: path.join(OUT, '5-duties.png') });
    check('5d the duties suggested after filing quote the signed copy — sixty days — never the agreed thirty',
      /sixty days/i.test(duties) && !/thirty days/i.test(duties), duties.slice(0, 220));
    await page.waitForTimeout(500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#modal-root button')].find(x => /^(cancel|close)$/i.test(x.textContent.trim())); if (b) b.click(); });
    await page.waitForTimeout(500);
    const filed = await page.evaluate(async id => {
      const c = await api('contracts/' + encodeURIComponent(id));
      const sc = c.signedCopy || {};
      return { status: c.status, no: c.contractNo || '', same: !!(sc.compare && sc.compare.same),
        by: sc.differs && sc.differs.by && sc.differs.by.name, why: sc.differs && sc.differs.why };
    }, A.id);
    check('5a with a reason it is filed as signed and takes its contract number', filed.status === 'Signed' && /^MK-\d+$/.test(filed.no), JSON.stringify(filed));
    check('5b the record keeps that the words differ, who accepted it, and the reason in their words',
      !filed.same && filed.by === 'Amina Otieno' && filed.why === WHY, JSON.stringify(filed));
    await page.evaluate(id => { openWorkspace(id); }, A.id);
    await page.waitForTimeout(700);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForTimeout(1200);
    const rec = await page.evaluate(() => { const b = document.querySelector('.ho-ex'); return b ? b.innerText.replace(/\s+/g, ' ') : ''; });
    await page.screenshot({ path: path.join(OUT, '5-record.png') });
    check('5c the signed record shows it: differs from the agreed version, accepted by Amina Otieno, with the reason',
      /Accepted by Amina Otieno/.test(rec) && rec.includes('Sixty days agreed by phone'), rec.slice(0, 240));

    /* ===== 6. SOMEBODY WHO MAY NOT ACCEPT ===== */
    const B = await handOver('Kilima Packaging Ltd', path.join(OUT, 'b.docx'));
    check('6 · stage: a second file handed over', B.id && B.out, JSON.stringify(B));
    const signedB = path.join(OUT, 'b-signed.docx');
    fs.writeFileSync(signedB, Buffer.from(mkDocx(signedOf('Kilima Packaging Ltd', 'Grace Njeri'))));
    const ed = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
    ed.on('pageerror', e => errors.push('editor: ' + e.message));
    await login(ed, 'everything@example.co.ke', 'their-own-pass-9');
    const offeredB = await openFiling(ed, signedB);
    const edActs = await acts(ed);
    await ed.screenshot({ path: path.join(OUT, '6-editor.png') });
    check('6a an editor who did not approve it is not offered to accept the difference — only to hold it',
      offeredB && !edActs.accept && !edActs.file && edActs.hold, JSON.stringify(edActs));
    check('6b and the screen says who may accept it', /accepted by the person who approved this contract, or by an admin, with a reason/.test(edActs.who), edActs.who.slice(0, 200));
    await ed.click('[data-ho-f="hold"]').catch(() => {});
    await ed.waitForTimeout(3000);
    const held = await ed.evaluate(async id => {
      const c = await api('contracts/' + encodeURIComponent(id));
      const t = (document.getElementById('toast-root') || {}).innerText || '';
      return { status: c.status, out: !!(c.handover && c.handover.at && !c.handover.cancelledAt), toast: t.replace(/\s+/g, ' ').trim() };
    }, B.id);
    check('6c a hold files nothing — it stays out with them — and says what happened to the message',
      held.status !== 'Signed' && held.out && held.toast.length > 0, JSON.stringify(held));
    await ed.context().close();

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
