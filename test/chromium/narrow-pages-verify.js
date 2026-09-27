/* THE NARROW OBLIGATIONS, REQUESTS AND OUR STANDARDS PAGES SAY IT RIGHT —
   measured in a real browser (the owner's list, 27 Sep 2026).

   Below 1040px of page these three pages draw the shape they always drew, and
   the faults the wide shapes fixed on 26 Sep were still there. The real app at
   a 1000px window (the Inspector stands down on its own measurement), three
   pages, read where a person reads them.

     1  Obligations: their obligation carries no "Nobody owns this"; no date is
        a raw 2026-09-20 string; the foot says each direction, never
        "Committed" or a "Paid 0"; "soon" holds something due in five days.
     2  The contract's Obligations tab: Chase on theirs; the document's end and
        the chase are on the row; a paid step's chip says "Paid", once.
     3  Requests: your own request is under "What you have asked for" and not
        in the queue too; the queue leads with the one past its promise; the
        heading counts what nobody holds; a declined request says so.
     4  Our standards: every book names a standard once.

   Against the parent (01bf6cc) this file reports every numbered check but
   1a, 3a (the stages) and 5 (the error sweep) red. */
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
const ISO = /\b\d{4}-\d{2}-\d{2}\b/;
const isoIn = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const admin = W.admin, colleague = W.restricted;
  const ADMIN_ID = (await admin.json('/api/bootstrap')).users.find(u => u.email === 'admin@example.co.ke').id;
  { /* MK-A1: one of theirs (chased), a document of theirs that ends, one of
       ours nobody will be reminded of, one due in five days, and a two-step
       payment chain whose first step is paid. */
    const c = await admin.json('/api/contracts/MK-A1');
    const v = c._v; delete c._v;
    c.obligations = [
      { id: 'o-theirs', desc: 'Deliver the audited accounts', due: isoIn(-3), status: 'open', party: 'theirs', amount: 250000, chasedAt: isoIn(-1), chasedBy: 'Amina Otieno' },
      { id: 'o-doc', desc: 'Hold a certificate of insurance', status: 'open', party: 'theirs', doc: { until: isoIn(10) } },
      { id: 'o-nobody', desc: 'File the annual return', due: isoIn(40), status: 'open', party: 'ours', assignee: 'Nobody At All' },
      { id: 'o-soon', desc: 'Renew the insurance', due: isoIn(5), status: 'open', party: 'ours', assignee: 'Amina Otieno', amount: 90000 },
      { id: 'o-pay1', desc: 'Pay the first tranche', due: isoIn(-20), status: 'done', completedAt: isoIn(-21), party: 'ours', assignee: 'Amina Otieno', amount: 400000 },
      { id: 'o-pay2', desc: 'Pay the second tranche', due: isoIn(12), status: 'open', party: 'ours', assignee: 'Amina Otieno', amount: 300000, after: 'o-pay1' },
    ];
    await admin.json('/api/contracts/MK-A1', { method: 'PUT', body: { contract: c, baseVersion: v } });
  }
  /* Requests: three from a colleague (one past its promise, one held by the
     admin, one nobody holds), and two of the admin's own (one live, one
     declined). */
  const ask = async (cl, title) => (await cl.json('/api/intake', { method: 'POST', body: { title, need: title + ' — please.' } })).request.id;
  await ask(colleague, 'Colleague: supply agreement for Nandi');       // the one nobody holds
  const rHeld = await ask(colleague, 'Colleague: NDA for the auditors');
  const rOver = await ask(colleague, 'Colleague: lease renewal');
  const rMine = await ask(admin, 'Admin: services agreement');
  const rDecl = await ask(admin, 'Admin: a request I declined');
  await admin.json('/api/intake/' + rHeld, { method: 'PATCH', body: { status: 'open', assignee: ADMIN_ID } });
  await admin.json('/api/intake/' + rOver, { method: 'PATCH', body: { status: 'open', promisedAt: '2020-01-01' } });
  await admin.json('/api/intake/' + rDecl, { method: 'PATCH', body: { status: 'declined', note: 'Not needed after all.' } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1000, height: 1000 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ================= 1 · THE OBLIGATIONS PAGE ================= */
    await page.evaluate(() => setView('obligations'));
    await page.waitForTimeout(1200);
    const ob = await page.evaluate(() => {
      const host = document.getElementById('content');
      const shape = (host.querySelector('.obw-page') || {}).getAttribute ? host.querySelector('.obw-page').getAttribute('data-ins') : null;
      const row = id => host.querySelector(`[data-obw-row="${id}"]`);
      const nobody = i18t('ob_no_owner');
      const when = [...host.querySelectorAll('.obw-when')].map(td => td.textContent + ' ' + ((td.querySelector('[title]') || {}).title || ''));
      const foot = (host.querySelector('.obw-total') || {}).textContent || '';
      const soonHead = i18t('ob_band_month');
      const bands = [...host.querySelectorAll('.obw-band')].map(b => b.textContent);
      const soonBand = [...host.querySelectorAll('tr')].reduce((acc, tr) => {
        if (tr.classList.contains('obw-band')) acc.cur = tr.textContent.startsWith(soonHead) ? 'soon' : 'other';
        else if (tr.getAttribute('data-obw-row') === 'o-soon') acc.soon = acc.cur; return acc; }, { cur: null, soon: null }).soon;
      return { shape, theirs: row('o-theirs') ? row('o-theirs').textContent : null, ours: row('o-nobody') ? row('o-nobody').textContent : null,
        nobody, when, foot, committed: i18t('ob_roll_committed'), owed: i18t('ob_mw_owed', { amt: '§' }).split('§')[0].trim(), soonBand, bands };
    });
    check('1a GATE — the narrow worklist is drawn, with the staged rows', ob.shape === '0' && ob.theirs != null && ob.ours != null, JSON.stringify({ shape: ob.shape }));
    check('1b their obligation carries no "Nobody owns this" — our own still does', ob.theirs != null && !ob.theirs.includes(ob.nobody) && ob.ours && ob.ours.includes(ob.nobody),
      (ob.theirs || '').slice(0, 90));
    check('1c no date is a raw 2026-09-20 string', ob.when.length > 0 && ob.when.every(t => !ISO.test(t)), ob.when.find(t => ISO.test(t)) || ob.when.slice(0, 2).join(' | '));
    check('1d the foot says each direction — never "Committed" or a "Paid 0"',
      !!ob.foot && !ob.foot.includes(ob.committed) && ob.foot.toLowerCase().includes(ob.owed.toLowerCase()) && !/\bPaid\s*(KES\s*)?0\b/.test(ob.foot), ob.foot.slice(0, 160));
    check('1e something due in five days sits under the soon heading', ob.soonBand === 'soon', JSON.stringify(ob.bands));

    /* ================= 2 · THE CONTRACT'S OBLIGATIONS TAB ================= */
    await page.evaluate(async () => { const c = getContract('MK-A1'); await ensureFull(c); openWorkspace(c.id); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const c = getContract('MK-A1'); roomGoTab(c, 'oblig'); });
    await page.waitForTimeout(1200);
    const tab = await page.evaluate(() => {
      const host = document.getElementById('ws-obligations-pane');
      const row = id => host && host.querySelector(`[data-obt-row="${id}"]`);
      const chip = host && host.querySelector('.obt-chip.is-done');
      const c = getContract('MK-A1');
      return { shape: host ? host.getAttribute('data-ins') : null,
        chase: !!(host && host.querySelector('[data-obt-chase="o-theirs"]')), chaseOurs: !!(host && host.querySelector('[data-obt-chase="o-soon"]')),
        doc: row('o-doc') ? row('o-doc').textContent : '', docSays: obDocSay(c.obligations.find(o => o.id === 'o-doc')).t,
        chased: row('o-theirs') ? row('o-theirs').textContent : '', chasedWord: i18t('ob_chased_short', { date: '§' }).split('§')[0].trim(),
        chip: chip ? chip.textContent.trim() : null, paid: i18t('ob_roll_paid'),
        dues: host ? [...host.querySelectorAll('.obt-due')].map(x => x.textContent) : [] };
    });
    check('2a Chase is on the open obligation of theirs, and not on ours', tab.shape === '0' && tab.chase && !tab.chaseOurs, JSON.stringify({ shape: tab.shape, chase: tab.chase, ours: tab.chaseOurs }));
    check('2b the document they hold says when it ends, and the chased one says it was chased',
      tab.doc.includes(tab.docSays) && tab.chased.includes(tab.chasedWord), `${tab.doc.slice(0, 80)} | ${tab.chased.slice(0, 80)}`);
    check('2c the paid step\'s chip says "Paid" — and no date on the tab is a raw string', tab.chip === tab.paid && tab.dues.every(t => !ISO.test(t)),
      JSON.stringify({ chip: tab.chip, dues: tab.dues.slice(0, 4) }));
    if (tab.chase) {
      await page.click('[data-obt-chase="o-theirs"]');
      await page.waitForTimeout(500);
    }
    /* The chase asks first, as it does everywhere: confirmDialog's own layer. */
    const asked = await page.evaluate(() => !!document.getElementById('confirm-overlay'));
    check('2d and pressing it asks first — the one chase act, not a silent send', asked, String(asked));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    /* ================= 3 · REQUESTS ================= */
    await page.evaluate(() => setView('intake'));
    await page.waitForTimeout(1600);
    const ik = await page.evaluate(ids => {
      const host = document.getElementById('content');
      const secs = [...host.querySelectorAll('section')].filter(s => s.querySelector('h3'));
      const queue = secs[0], mine = secs[1];
      const idsIn = sec => sec ? [...sec.querySelectorAll('.ik-row')].map(a => (a.textContent.match(/REQ-[A-Z0-9]+/) || [''])[0]) : [];
      const head = queue ? queue.querySelector('h3').textContent : '';
      const decl = mine ? [...mine.querySelectorAll('.ik-row')].find(a => a.textContent.includes(ids.rDecl)) : null;
      return { shape: (host.querySelector('[data-ins-page="intake"]') || {}).getAttribute ? host.querySelector('[data-ins-page="intake"]').getAttribute('data-ins') : null,
        queue: idsIn(queue), mine: idsIn(mine), head, waiting: i18t('ik_queue_head', { n: 2 }), held: i18tn('ik_head_held', 1, { n: 1 }),
        decl: decl ? decl.textContent.replace(/\s+/g, ' ') : '', declWord: i18t('ik_declined_after', { t: '§' }).split('§')[0].trim(),
        doneWord: i18tn('ik_done_hour', 2, { n: 2 }).replace(/\d+/g, '§').split('§')[0].trim() };
    }, { rDecl });
    check('3a GATE — the narrow Requests page is drawn with its two lists', ik.shape === '0' && ik.queue.length > 0 && ik.mine.length > 0, JSON.stringify({ shape: ik.shape, q: ik.queue, m: ik.mine }));
    check('3b your own request is under "What you have asked for" — and not in the queue too',
      ik.mine.includes(rMine) && !ik.queue.includes(rMine), JSON.stringify({ queue: ik.queue }));
    check('3c the queue leads with the request past its promise', ik.queue[0] === rOver, JSON.stringify(ik.queue));
    check('3d the heading counts what nobody holds, and the one being worked on beside it',
      ik.head.includes(ik.waiting) && ik.head.includes(ik.held), ik.head);
    check('3e a declined request says it was declined — never "done in"',
      ik.decl.includes(ik.declWord) && !(ik.doneWord && ik.decl.includes(ik.doneWord)), ik.decl.slice(0, 160));

    /* ================= 4 · OUR STANDARDS ================= */
    await page.evaluate(() => setView('playbook'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const b = document.querySelector('[data-pb-tab="playbook"]'); if (b) b.click(); });
    await page.waitForTimeout(600);
    const pb = await page.evaluate(() => {
      const pv = document.getElementById('playbook-view');
      if (!pv) return { cards: 0, dup: null };
      const cards = [...pv.children].filter(x => x.querySelector && x.querySelector('span'));
      let dup = null;
      cards.forEach(card => {
        const names = [...card.querySelectorAll('div[style*="flex-wrap"] > span')].map(s => s.textContent.replace(/\s*(<=|>=|<|>|=).*$/, '').replace(/\s*⚑\s*$/, '').trim().toLowerCase());
        const seen = new Set();
        names.forEach(n => { if (seen.has(n) && !dup) dup = ((card.querySelector('span') || {}).textContent || '') + ': ' + n; seen.add(n); });
      });
      return { cards: cards.length, dup };
    });
    check('4 every book on the Negotiation playbook tab names a standard once', pb.cards > 0 && !pb.dup, pb.dup || `${pb.cards} books, no name twice`);
  } finally {
    check('5 no page error anywhere in the run', errors.length === 0, errors.join(' | ') || 'none');
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:\n  ' + bad.map(b => b.name).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
