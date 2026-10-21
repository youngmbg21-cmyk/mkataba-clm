/* THE TAIL ON THE LIFE LINE — where the reader looks
   ==================================================
   Owner picked "The tail on the life line", 17 Oct 2026 (piece 4 of the
   sensitive contracts plan: an NDA shows when secrecy ends and who keeps it
   secret, with a reminder before the duty lapses). f698 asks the reading and
   the server. This file asks the reader's questions in a real browser:
     1 · a mutual NDA's panel: "Secret until" in the Value tile's place, with
         "Clause 5 · confirm"; the facts line says who keeps it secret; the
         line draws the sharing and then a striped "kept secret" tail, painted
     2 · the mark opens the editor where the line was, on the wording's
         reading; Confirm stores it (the server names who), adds the
         reminder as an ordinary obligation a month before, and the line
         carries it; Cancel keeps nothing
     3 · a one-way NDA kept secret for good: its own words, an open tail
     4 · an NDA whose wording says nothing: "Not in the wording · set it",
         never a guessed date; its Details sheet carries the two facts
     5 · a private folder's NDA nobody has had read says "Not read yet"
     6 · Svenska; the phone's rows; the owner's three screens
   Run: node test/chromium/nda-tail-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'nda-tail');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail ? ' — ' + detail : ''));
  if (ok) passes++; else failures++;
};
/* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause */
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_){ return false; }
};
/* every driven half is guarded: a missing feature reports, never times out */
const press = async (page, sel) => { try { await page.click(sel, { timeout: 3000 }); return true; } catch (_){ return false; } };
const untilServer = async (W, id, fn, ms = 8000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms){
    try { const c = await W.admin.json('/api/contracts/' + id); if (fn(c)) return c; } catch (_){}
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
};

const MUTUAL = ['MUTUAL NON-DISCLOSURE AGREEMENT', '',
  'This agreement is made between Highland Corporate Ltd and Givaudan East Africa.', '',
  '1. Purpose', '', 'The Parties wish to explore a joint new product and each Party may disclose confidential information to the other.', '',
  '5. Duration of confidentiality', '',
  'The obligations of confidentiality in this Agreement shall survive for a period of three (3) years following termination or expiry of this Agreement. Trade secrets shall be kept confidential for so long as they remain trade secrets.', '',
  '6. Governing law', '', 'This Agreement is governed by the laws of Kenya.'].join('\n');
const ONEWAY = ['CONFIDENTIALITY AGREEMENT', '',
  'This agreement is made between Highland Corporate Ltd (the "Disclosing Party") and Kaybee Consulting Ltd (the "Recipient").', '',
  '2. Confidentiality', '', 'The Recipient shall hold all Confidential Information in confidence in perpetuity and use it only for the Purpose.'].join('\n');
const nda = (id, name, cp, status, body, folder) => ({ ...fixtureContract(id, name, cp, folder || 'corp', 0, status, body),
  template: null, valueType: 'none', expiry: '2027-07-31', fields: { effDate: '2026-07-05' }, metadata: { contractType: 'NDA', currency: 'KES' } });
const ND1 = nda('ND-1', 'Mutual NDA — New Product Development', 'Givaudan East Africa', 'Signed', MUTUAL);
const ND3 = nda('ND-3', 'One-way NDA — Pricing Review', 'Kaybee Consulting Ltd', 'Draft', ONEWAY);
/* HaTi's own NDA standard: the paper is drawn from the record and says nothing of how long secrecy lasts */
const ND4 = { ...fixtureContract('ND-4', 'Vendor NDA — ERP Implementation', 'SAP East Africa', 'corp', 0, 'Under Review'), template: 'ND', valueType: 'none', expiry: '2027-07-31', fields: { effDate: '2026-07-14' } };
const ND5 = nda('ND-5', 'Mutual NDA — Retail Pilot', 'Naivas Supermarkets', 'Under Review', MUTUAL, 'sales');

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: FIXTURES.concat([ND1, ND3, ND4, ND5]), approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  await W.admin.json('/api/private-streams/sales', { method: 'PUT', body: { on: true, ids: [me.id] } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const P = await ctx.newPage();
    P.setDefaultTimeout(6000);
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke');
    await P.fill('#li-pass', 'adminpassword1');
    await P.click('#li-go');
    await until(P, () => !!(window.currentUser && currentUser() && typeof getContract === 'function' && getContract('ND-1')), null, 15000);
    const bring = async id => {
      await P.evaluate(i => { if (typeof setView === 'function' && state.view !== 'dashboard') setView('dashboard'); hbStripBring(i, 'ov'); }, id);
      return until(P, i => { const s = document.querySelector(`#bs-strip-${i}`); return !!s && !!(getContract(i) || {})._loaded && !!s.querySelector('[data-bs-kpi="value"]'); }, id, 10000);
    };
    const strip = id => P.evaluate(i => {
      const s = document.querySelector(`#bs-strip-${i}`); if (!s) return null;
      const t = q => { const e = s.querySelector(q); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; };
      const tail = s.querySelector('.bs-chart .bs-seg-secret');
      let painted = false;
      if (tail){ const r = tail.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); painted = at === tail; }
      return { tile: t('[data-bs-kpi="value"]'), mark: t('[data-bs-kpi="value"] .bs-nda-mark'), markBtn: !!s.querySelector('[data-bs-kpi="value"] button[data-bs-nda-edit]'),
        idline: t('[data-bs-f="dir"]'), icon: !!s.querySelector('[data-bs-f="dir"] .bs-nda-ic'),   /* RE-POINTED 21 Oct 2026 (the report simplified): who keeps it secret is a fact of The deal */ lg: t('.bs-nda .bs-lg'), cap: t('.bs-nda .bs-cap'),
        svg: [...s.querySelectorAll('.bs-nda .bs-chart text')].map(x => x.textContent).join(' | '),
        tail: !!tail, tailFill: tail ? tail.getAttribute('fill') : '', tailOpen: !!(tail && tail.classList.contains('is-open')), painted,
        terms: t('.bs-dl'), next: t('[data-bs-kpi="next"]') };
    }, id);

    /* ============ 1. A MUTUAL NDA'S PANEL ============ */
    check(await bring('ND-1'), '1 the NDA comes up on the Board');
    await P.evaluate(() => { const s = document.querySelector('#bs-strip-ND-1 .bs-chart'); if (s) s.scrollIntoView({ block: 'center' }); });
    let s1 = await strip('ND-1');
    check(!!s1 && /^Secret until 31 Jul 2030/.test(s1.tile) && s1.mark === 'Clause 5 · confirm' && s1.markBtn, '1a the Value tile reads "Secret until 31 Jul 2030", with "Clause 5 · confirm" as a press', s1 && s1.tile);
    check(!!s1 && /Mutual NDA: both sides keep it secret/.test(s1.idline) && s1.icon, '1b the facts line says who keeps it secret, beside its drawn sign', s1 && s1.idline);
    check(!!s1 && /Sharing/.test(s1.lg) && /Kept secret/.test(s1.lg), '1c the legend names the sharing and what is kept secret', s1 && s1.lg);
    check(!!s1 && s1.tail && /^url\(#bs-hatch-ND-1\)$/.test(s1.tailFill) && s1.painted, '1d the striped tail is drawn, and painted where it is', s1 && JSON.stringify({ fill: s1.tailFill, painted: s1.painted }));
    check(!!s1 && /Sharing ends 31 Jul 2027/.test(s1.svg) && /Secret until 31 Jul 2030/.test(s1.svg), '1e the line marks the day sharing ends and the day secrecy ends', s1 && s1.svg);
    check(!!s1 && /Both sides may share until 31 Jul 2027; what was shared stays secret until 31 Jul 2030\. \(Clause 5\.\) Trade secrets stay secret/.test(s1.cap), '1f its sentence says it, from the clause, trade secrets too', s1 && s1.cap);
    check(!!s1 && /Who keeps it secret Both sides \(mutual\)/.test(s1.terms) && /Secret until 31 Jul 2030/.test(s1.terms), '1g Key terms carry both facts', s1 && s1.terms);
    await P.screenshot({ path: path.join(OUT, '1-mutual-rest.png') });

    /* ============ 2. THE EDITOR, CONFIRM, THE REMINDER ============ */
    /* RE-POINTED 20 Oct 2026 (the Legora way, owner: "we should not be entering
       information in the board"): the tile's door opens the paper with the NDA's
       lines under Key terms, each changed on its line — the clause it was read
       from quoted there, for good and trade secrets, who the reminder goes to,
       and Done; nothing is typed on the Board */
    await press(P, '#bs-strip-ND-1 [data-bs-kpi="value"] [data-bs-nda-edit]');
    /* RE-POINTED 21 Oct 2026 (THE MIDDLE, owner): Key terms' table stands in the middle beside the Dossier */
    const ed = await until(P, () => !!document.querySelector('[data-pd-mid-kt] #pd-kt tr[data-pd-og-row="ndaDir"].is-changing'));
    const E = await P.evaluate(() => { const k = document.getElementById('pd-kt'); if (!k) return null;
      const ends = k.querySelector('tr[data-pd-og-row="ndaEnds"]'), dir = k.querySelector('tr[data-pd-og-row="ndaDir"]');
      return { q: ((ends && ends.querySelector('.pd-og-src q')) || {}).title || '', clause: ((ends && ends.querySelector('.pd-og-cl')) || {}).textContent || '',
        dir: (dir.querySelector('[data-pd-og-nda="dir"]') || {}).value, face: hbS().face }; });
    check(ed && !!E && E.face === 'paper' && E.clause === '§5' && /survive for a period of three \(3\) years/.test(E.q), '2a the paper\'s Key terms open, the line quoting the clause it read', E && JSON.stringify(E));
    await press(P, '#pd-kt [data-pd-kt-change="ndaEnds"]');
    await until(P, () => !!document.querySelector('#pd-kt tr[data-pd-og-row="ndaEnds"].is-changing [data-pd-og-nda="ends"]'));
    const E2 = await P.evaluate(() => { const r = document.querySelector('#pd-kt tr[data-pd-og-row="ndaEnds"]'); if (!r) return null;
      return { ends: r.querySelector('[data-pd-og-nda="ends"]').value, good: r.querySelector('[data-pd-og-nda="forGood"]').checked, trade: r.querySelector('[data-pd-og-nda="trade"]').checked,
        note: (r.querySelector('.pd-og-remind') || {}).textContent || '', acts: [...r.querySelectorAll('.pd-og-a button')].map(b => b.innerText) }; });
    check(!!E && E.dir === 'mutual' && !!E2 && E2.ends === '2030-07-31' && E2.trade && !E2.good, '2b it opens on the reading: mutual, 31 Jul 2030, trade secrets', E2 && JSON.stringify(E2));
    check(!!E2 && new RegExp(`A reminder goes to ${me.name} a month before`).test(E2.note) && E2.acts.join(',') === 'Done', '2c it says who the reminder goes to; Done on its line', E2 && `${E2.note} / ${E2.acts}`);
    await P.screenshot({ path: path.join(OUT, '2-editor.png') });
    /* putting Key terms away keeps nothing (RE-POINTED 21 Oct 2026: "‹ Paper" puts the middle away) */
    await P.evaluate(() => { const i = document.querySelector('#pd-kt [data-pd-og-nda="ends"]'); if (!i) return; i.value = '2031-01-31'; i.dispatchEvent(new Event('change', { bubbles: true })); });
    await press(P, '#ig-dock [data-pd-mid-back]');
    const cancelled = ed && await until(P, () => !getContract('ND-1').nda);
    check(!!cancelled, '2d putting it away ("‹ Paper") puts the line back and keeps nothing');
    await P.evaluate(() => pdKtOpen('ND-1', 'ndaDir'));
    await until(P, () => !!document.querySelector('#pd-kt [data-pd-kt-done="ndaDir"]'));
    await press(P, '#pd-kt [data-pd-kt-done="ndaDir"]');
    await until(P, () => !!document.querySelector('#pd-kt [data-pd-kt-change="ndaEnds"]'));
    await press(P, '#pd-kt [data-pd-kt-change="ndaEnds"]');
    await until(P, () => !!document.querySelector('#pd-kt [data-pd-kt-done="ndaEnds"]'));
    await press(P, '#pd-kt [data-pd-kt-done="ndaEnds"]');
    const srv = !ed ? null : await untilServer(W, 'ND-1', c => c.nda && c.nda.ends === '2030-07-31' && (c.obligations || []).some(o => o.origin === 'nda'));
    const rem = srv && srv.obligations.find(o => o.origin === 'nda');
    check(!!srv && srv.nda.dir === 'mutual' && srv.nda.who === me.name && srv.nda.trade === true, '2e Done stores the facts, and the server names who confirmed', srv && JSON.stringify(srv.nda));
    check(!!rem && rem.due === '2030-06-30' && rem.party === 'ours' && rem.assignee === me.name && rem.status === 'open' && srv.nda.ob === rem.id,
      '2f the reminder is an ordinary obligation, ours, the owner\'s, a month before', rem && JSON.stringify(rem));
    const toasted = await P.evaluate(() => [...document.querySelectorAll('.toast, [class*="toast"]')].some(t => /Confidentiality confirmed/.test(t.innerText || '')));
    await bring('ND-1');
    await until(P, () => /Confirmed by/.test((document.querySelector('#bs-strip-ND-1 [data-bs-kpi="value"]') || {}).innerText || ''));
    s1 = await strip('ND-1');
    check(!!s1 && new RegExp(`Confirmed by ${me.name}`).test(s1.tile) && !s1.markBtn, '2g the tile now says who confirmed it, and the mark is gone', s1 && s1.tile);
    check(!!s1 && /Reminder 30 Jun 2030/.test(s1.svg) && /^Next obligation 30 Jun 2030 Secrecy ends 31 Jul 2030/.test(s1.next), '2h the line and Next obligation carry the reminder', s1 && `${s1.next} | ${s1.svg}`);
    check(toasted, '2i a confirmation says it was saved');
    await P.screenshot({ path: path.join(OUT, '2-confirmed.png') });

    /* ============ 3. ONE-WAY, FOR GOOD ============ */
    check(await bring('ND-3'), '3 the one-way NDA comes up');
    const s3 = await strip('ND-3');
    check(!!s3 && /One-way NDA: they keep what we share secret/.test(s3.idline), '3a a one-way NDA says whose secret it is', s3 && s3.idline);
    check(!!s3 && /^Secret until For good/.test(s3.tile) && s3.mark === 'Clause 2 · confirm', '3b kept secret for good: no made-up day', s3 && s3.tile);
    check(!!s3 && s3.tail && s3.tailOpen && /Secret for good/.test(s3.svg), '3c its tail runs open to the line\'s edge', s3 && s3.svg);
    check(!!s3 && /We may share until 31 Jul 2027; Kaybee Consulting Ltd keeps it secret for good\./.test(s3.cap), '3d its sentence names who keeps it', s3 && s3.cap);

    /* ============ 4. NOTHING IN THE WORDING ============ */
    check(await bring('ND-4'), '4 HaTi\'s own NDA standard comes up');
    const s4 = await strip('ND-4');
    check(!!s4 && /^Secret until —/.test(s4.tile) && s4.mark === 'Not in the wording · set it' && s4.markBtn, '4a no period in the wording: a dash and "set it", never a guess', s4 && s4.tile);
    check(!!s4 && !s4.tail && /The wording does not say when secrecy ends\./.test(s4.cap), '4b no tail is drawn, and the sentence says why', s4 && s4.cap);
    await P.evaluate(() => bsStripPage('ND-4', 'details'));
    const det = await until(P, () => !!document.querySelector('#bs-strip-ND-4 #ov-ess'), null, 10000);
    const D4 = await P.evaluate(() => { const e = document.querySelector('#bs-strip-ND-4 #ov-ess'); return e ? { t: e.innerText.replace(/\s+/g, ' '), door: !!e.querySelector('[data-ov-nda-edit]') } : null; });
    check(det && !!D4 && /Secret until/.test(D4.t) && /Who keeps it secret Both sides \(mutual\)/.test(D4.t) && D4.door && !/Payment terms/.test(D4.t),
      '4c the Details sheet\'s eight carry the two facts in place of value and payment terms, with the door', D4 && D4.t.slice(0, 260));
    /* RE-POINTED 20 Oct 2026 (the Legora way): owed, the facts are the paper's grid rows */
    await press(P, '#bs-strip-ND-4 #ov-ess [data-ov-nda-edit]');
    check(await until(P, () => !!document.querySelector('#pd-og[data-pd-og-for="ND-4"] tr[data-pd-og-row="ndaDir"]') && hbS().face === 'paper'), '4d the cell\'s door opens the paper, the facts on the grid\'s rows');
    /* RE-POINTED 21 Oct 2026 (owner: the grey "not in the wording" line was noise): the row's amber box says it, and no grey line under the fact */
    const unsaid = await P.evaluate(() => { const r = document.querySelector('#pd-og tr[data-pd-og-row="ndaEnds"]'); return r ? { amb: r.classList.contains('is-amb'), src: !!r.querySelector('.pd-og-src.is-none') } : null; });
    check(!!unsaid && unsaid.amb && !unsaid.src, '4e the grid row is amber where the wording does not say, with no grey line under it', JSON.stringify(unsaid));

    /* ============ 5. A PRIVATE FOLDER'S NDA ============ */
    check(await bring('ND-5'), '5 the private NDA comes up');
    const s5 = await strip('ND-5');
    check(!!s5 && /^Secret until — Not read yet/.test(s5.tile) && !s5.markBtn, '5a nobody has had it read: "Not read yet", nothing read on arrival', s5 && s5.tile);

    /* ============ 6. THE OWNER'S THREE SCREENS, SVENSKA, THE PHONE ============ */
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]){
      await P.setViewportSize(vp);
      await bring('ND-3');
      await P.evaluate(() => { const b = document.querySelector('#bs-strip-ND-3 [data-bs-kpi="value"]'); if (b) b.scrollIntoView({ block: 'center' }); });
      const fit = await P.evaluate(() => {
        const s = document.querySelector('#bs-strip-ND-3'), m = s && s.querySelector('[data-bs-kpi="value"] [data-bs-nda-edit]');
        if (!m) return { press: false };
        const r = m.getBoundingClientRect(), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const cap = s.querySelector('.bs-nda .bs-cap');
        return { press: !!at && (at === m || m.contains(at)), whole: m.scrollWidth <= m.clientWidth + 1, side: s.scrollWidth - s.clientWidth, page: document.documentElement.scrollWidth - innerWidth, cap: !!cap };
      });
      check(fit.press && fit.whole && fit.side <= 1 && fit.page <= 1 && fit.cap, `6a at ${vp.width}×${vp.height}: the mark is on screen and whole, nothing scrolls sideways`, JSON.stringify(fit));
      await P.evaluate(() => { const b = document.querySelector('#bs-strip-ND-3'); if (b) b.scrollIntoView({ block: 'start' }); });
      await P.screenshot({ path: path.join(OUT, `oneway-${vp.width}x${vp.height}.png`) });
    }
    await P.setViewportSize({ width: 1440, height: 780 });
    await P.evaluate(() => langSet('sv'));
    await bring('ND-1');
    const sv = await strip('ND-1');
    check(!!sv && /^Hemligt till/.test(sv.tile) && /Ömsesidigt sekretessavtal: båda parter håller det hemligt/.test(sv.idline) && /Hålls hemligt/.test(sv.lg), '6b in Swedish: Hemligt till, the facts line and the legend', sv && `${sv.tile} | ${sv.idline}`);
    await P.evaluate(() => langSet('en'));
    const phone = await P.evaluate(() => { if (typeof mTermsHtml !== 'function') return null; const d = document.createElement('div'); d.innerHTML = mTermsHtml(getContract('ND-1')); return d.textContent.replace(/\s+/g, ' '); });
    check(phone == null || (/Who keeps it secret\s*Both sides \(mutual\)/.test(phone) && /Secret until\s*31 Jul 2030/.test(phone)), '6c the phone\'s key facts read the same two facts', phone ? phone.slice(0, 200) : 'the phone list is not published on this stage');

    check(!errors.length, '7 no page errors', errors.join(' | ').slice(0, 300));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
