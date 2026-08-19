/* Chromium verification: WRITING AN AMENDMENT FROM BLANK PAPER
   ============================================================
   Owner-asked (14 Aug 2026). f193 pins the model in node and f176 pins the two
   claims this reverses. THIS file exists because three of the four things that
   changed are things a node test cannot see:

     · A CARD THAT MOVED. Agreement family had been finished and exported for
       months and had never been drawn anywhere at all. "It renders" is a claim
       about pixels — whether it is on screen, in the slot the Obligations card
       used to hold, at a size that squares off against Key terms beside it.
     · A CARD THAT MOVED THE OTHER WAY. The obligations card is not re-rendered
       into the side panel, it is the SAME renderer filling the same element id
       in a different host — and its CSS was written for a stretched grid child.
       jsdom resolves no class rules, so only a browser can say whether the list
       still scrolls, whether the buttons are still visible, and whether the
       322px cap has stopped fighting the panel's own scroller.
     · A WHOLE JOURNEY. Press Create an amendment, fill nothing, press Create
       and open, and land on the Document tab of a new draft with your
       letterhead on it and the parent named in the recital — including the
       parent's date printed the way the paper writes it, through the real
       fmtDocDate, which the node stage does not carry.

   And one thing that is a rule rather than a picture, checked here because it
   is checked in the real cascade: the obligations row stays pressable on a
   contract that is already SIGNED, where the other two go dead.

   Run: node test/chromium/amendment-journey-verify.js */
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

/* Visible means visible: on screen, with size, nothing in its ancestry hiding
   it. The same walk portal-header-verbs-verify and reopen-a-refusal-verify do,
   for the same reason — this product has shipped rendered, wired, invisible
   controls before. */
const VISIBLE = `(el) => {
  if (!el) return { on: false, why: 'absent' };
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return { on: false, why: 'no size' };
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0)
      return { on: false, why: (n.className || n.tagName) + ' is hidden' };
    if (n.hasAttribute && n.hasAttribute('hidden')) return { on: false, why: 'hidden attribute' };
  }
  return { on: true, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) };
}`;

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
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* A master agreement with a term of its own, opened on Key terms. */
    const cid = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Declined') || state.contracts[0];
      c.expiry = '2026-09-30';
      c.metadata = Object.assign({}, c.metadata, { effectiveDate: '2026-07-31' });
      state.activeId = c.id; state.selId = c.id;
      return c.id;
    });
    await page.evaluate(id => openWorkspace(id), cid);
    await page.waitForTimeout(1200);
    await page.evaluate(id => roomGoTab(getContract(id), 'terms'), cid);
    await page.waitForTimeout(800);

    /* ================= 1 · THE SWAP, ON KEY TERMS ================= */
    const side = await page.evaluate(`(() => {
      const vis = ${VISIBLE};
      const fam = document.getElementById('family-section');
      const ob = document.getElementById('obligations-section');
      const kt = document.querySelector('#kt-main, .terms-grid > :first-child')
        || document.getElementById('kt-side').parentElement.firstElementChild;
      const r = el => el ? el.getBoundingClientRect() : null;
      const a = r(fam), b = r(kt);
      const side = document.getElementById('kt-side');
      const pane = document.querySelector('[data-ws-pane="terms"]');
      const sr = r(side), pr = r(pane);
      return { fam: vis(fam), obPresent: !!ob,
        title: fam ? (fam.querySelector('h4') || {}).textContent : null,
        famH: a ? Math.round(a.height) : 0, ktH: b ? Math.round(b.height) : 0,
        sideScrolls: side ? getComputedStyle(side).overflowY : null,
        sideH: sr ? Math.round(sr.height) : 0,
        divider: !!document.getElementById('kt-resizer'),
        overrun: (sr && pr) ? Math.round(sr.bottom - pr.bottom) : null };
    })()`);
    check('Agreement family is on screen in the Key terms column',
      side.fam.on, side.fam.on ? `${side.fam.w}x${side.fam.h}` : side.fam.why);
    check('and it is the family card, by its own heading',
      /Agreement family/i.test(side.title || ''), side.title);
    check('the Obligations card has left this tab — one door, not two',
      !side.obPresent);
    /* ---- REVERSED IN PLACE, 19 Aug 2026 ---- this asserted that the two cards
       SQUARE OFF, which is what f176's third block claimed and what the grid
       used to do. The owner has asked for the opposite, and for a reason the
       squared layout could not answer: "keep the size of the card on the left
       intact ... add a divider between the two cards so that you can scroll on
       the right hand side especially when you can ran a renewal reason."

       Stretched, a tall right-hand card drags Key terms up with it and its own
       content runs off the bottom of the window. So the right column takes the
       column's full height and scrolls INSIDE it, the left card keeps its own
       height, and a divider between them sets the split. The claim underneath
       is the one that always mattered and is asserted last: neither card runs
       past the bottom of the page. */
    check('the right-hand COLUMN takes the height, and both cards keep their own',
      side.sideH > side.famH + 2 && side.famH > 0,
      `column ${side.sideH}px · family ${side.famH}px · key terms ${side.ktH}px`);
    check('…and it scrolls inside itself rather than running off the page',
      side.sideScrolls === 'auto' && side.overrun !== null && side.overrun <= 2,
      `overflow-y:${side.sideScrolls}, ${side.overrun}px past the pane`);
    check('…with a divider between the two to set the split', side.divider);

    /* ---- AND IT IS A REAL DRAG, NOT A DECORATION ----
       A splitter that renders and does not move is the fault this project has
       shipped before with controls that looked live (the unsent band's Send,
       dead on one seat for a day). Measured with a real pointer, both columns
       before and after, and the contract's own tab left exactly where it was. */
    const box = await page.evaluate(`(() => {
      const g = document.querySelector('.terms-grid');
      const kt = g.firstElementChild, sd = document.getElementById('kt-side');
      const h = document.getElementById('kt-resizer');
      const r = el => el.getBoundingClientRect();
      return { left: Math.round(r(kt).width), right: Math.round(r(sd).width),
        hx: r(h).left + r(h).width / 2, hy: r(h).top + r(h).height / 2 };
    })()`);
    await page.mouse.move(box.hx, box.hy);
    await page.mouse.down();
    await page.mouse.move(box.hx - 90, box.hy, { steps: 12 });
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 260));
    const after = await page.evaluate(`(() => {
      const g = document.querySelector('.terms-grid');
      const kt = g.firstElementChild, sd = document.getElementById('kt-side');
      const r = el => el.getBoundingClientRect();
      return { left: Math.round(r(kt).width), right: Math.round(r(sd).width),
        saved: Number(localStorage.getItem('hati.v1.ktLeftFrac')) || 0 };
    })()`);
    check('dragging the divider gives the room from one card to the other',
      after.left < box.left - 40 && after.right > box.right + 40,
      `left ${box.left}→${after.left}px · right ${box.right}→${after.right}px`);
    check('…and the split is remembered, so it is not re-set on the next paint',
      after.saved > 0.2 && after.saved < 0.75, String(after.saved));

    /* ================= 2 · THE BUTTONS ================= */
    const btns = await page.evaluate(`(() => {
      const vis = ${VISIBLE};
      const c = document.getElementById('fam-create');
      const a = document.getElementById('fam-add');
      const cs = c ? getComputedStyle(c) : null;
      return { create: vis(c), createLabel: c ? c.textContent.trim() : null,
        add: vis(a), addLabel: a ? a.textContent.trim() : null,
        primary: cs ? cs.backgroundColor : null,
        row: [...document.querySelectorAll('.fam-acts button')].map(b => b.textContent.trim()) };
    })()`);
    check('Create an amendment is a visible button',
      btns.create.on && /Create an amendment/i.test(btns.createLabel || ''),
      btns.create.on ? btns.createLabel : btns.create.why);
    /* THE WORD THAT HAD TO CHANGE. The old button read "Add an amendment" over
       an act that adds nothing — it attaches a document you already have. With
       a button beside it that genuinely writes one, two buttons read the same. */
    check('and the old one now says what it has always done',
      btns.add.on && /Link an existing document/i.test(btns.addLabel || ''),
      btns.add.on ? btns.addLabel : btns.add.why);
    check('nothing on the row still says "Add an amendment"',
      !btns.row.some(t => /Add an amendment/i.test(t)), JSON.stringify(btns.row));
    check('Create leads the row and wears the primary fill',
      btns.row[0] === btns.createLabel && btns.primary && btns.primary !== 'rgba(0, 0, 0, 0)',
      btns.primary);

    /* ================= 3 · THE FORM ================= */
    /* The master's effective date, ON THE RECORD and saved — the recital reads
       it back through the real fmtDocDate below, and a value only set in memory
       is dropped when the room reloads the contract from the server. */
    await page.evaluate(async id => {
      const c = getContract(id);
      c.metadata = Object.assign({}, c.metadata, { effectiveDate: '2026-07-31' });
      persist(c);
      if (window.flushSaves) await flushSaves();
    }, cid);
    await page.waitForTimeout(600);

    await page.click('#fam-create');
    await page.waitForTimeout(700);
    const form = await page.evaluate(`(() => {
      const vis = ${VISIBLE};
      const v = id => { const el = document.getElementById(id); return el ? el.value : null; };
      const sk = document.getElementById('am-skeleton');
      return { name: v('am-name'), rel: v('am-rel'), expiry: v('am-expiry'),
        skeleton: sk ? sk.checked : null, go: vis(document.getElementById('am-go')),
        goLabel: (document.getElementById('am-go') || {}).textContent,
        labels: [...document.querySelectorAll('#modal-root label > span:first-child')]
          .map(s => s.textContent.trim()).filter(Boolean) };
    })()`);
    check('the form opens with the name already counted',
      /^Amendment No\. 1 to /.test(form.name || ''), form.name);
    check('the kind defaults to Amendment', form.rel === 'amendment', form.rel);
    check('the end date is the one thing left blank to answer',
      form.expiry === '', JSON.stringify(form.expiry));
    check('and it asks the question in words', form.labels.some(l => /end date/i.test(l)),
      JSON.stringify(form.labels));
    check('the opening and closing lines are ticked by default', form.skeleton === true);
    check('Create and open is on screen', form.go.on && /Create and open/i.test(form.goLabel || ''),
      form.goLabel);

    /* The kind rewrites the name until somebody types over it. */
    await page.selectOption('#am-rel', 'annex');
    await page.waitForTimeout(200);
    const renamed = await page.evaluate(() => document.getElementById('am-name').value);
    check('changing the kind renames the default', /^Annex No\. 1 to /.test(renamed), renamed);
    await page.fill('#am-name', 'Amendment No. 1 — extended term');
    await page.selectOption('#am-rel', 'amendment');
    await page.waitForTimeout(200);
    const kept = await page.evaluate(() => document.getElementById('am-name').value);
    check('but a name typed by hand is not overwritten',
      kept === 'Amendment No. 1 — extended term', kept);

    /* ================= 4 · THE JOURNEY ================= */
    await page.fill('#am-expiry', '2029-03-31');
    await page.fill('#am-note', 're-prices maintenance from Q1');
    await page.click('#am-go');
    await page.waitForTimeout(1800);

    const landed = await page.evaluate(`(() => {
      const vis = ${VISIBLE};
      const c = getContract(state.activeId);
      const paper = document.querySelector('#view-workspace .rl-paper-title, .rl-paper-title');
      const sub = document.querySelector('.rl-paper-sub');
      const doc = document.querySelector('#doc-scroll, .doc-surface');
      return { tab: roomCurrentTab(), id: c.id, parentId: c.parentId, rel: c.relation,
        status: c.status, expiry: c.expiry, note: c.relationNote,
        cp: c.counterparty, party: c.party || null,
        title: paper ? paper.textContent.trim() : null,
        between: sub ? sub.textContent.trim() : null,
        body: doc ? doc.textContent : '',
        paperVis: vis(paper) };
    })()`);
    check('it lands on the Document tab, not on Key terms',
      landed.tab === 'docs', landed.tab);
    check('the draft is already filed against its parent',
      landed.parentId === cid && landed.rel === 'amendment' && landed.status === 'Draft',
      `${landed.id} → ${landed.parentId} (${landed.rel}, ${landed.status})`);
    check('the end date and the note came through the form',
      landed.expiry === '2029-03-31' && /re-prices maintenance/.test(landed.note || ''),
      `${landed.expiry} · ${landed.note}`);
    check('the paper is on screen, titled with the name that was typed',
      landed.paperVis.on && landed.title === 'Amendment No. 1 — extended term',
      landed.title);
    check('and it says who it is between', /between/i.test(landed.between || '')
      && new RegExp(landed.cp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(landed.between || ''),
      landed.between);
    /* THE RECITAL, printed through the real fmtDocDate — "31 Jul 2026", never
       the date input's 2026-07-31. This is the half the node stage cannot see. */
    check('the recital names the agreement being amended',
      /The parties entered into the/.test(landed.body), null);
    check('and prints its date the way paper writes a date, never the picker’s',
      /dated \d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/.test(landed.body)
      && !/dated \d{4}-\d{2}-\d{2}/.test(landed.body),
      (landed.body.match(/dated [^(]+/) || [])[0]);
    check('it closes with the survival line',
      /remain in full force and effect/.test(landed.body));
    check('no page error anywhere in the journey', errors.length === 0, errors.join(' | '));

    /* THE PAYOFF, back on the master. */
    const childIdEarly = landed.id;
    await page.evaluate(id => { openWorkspace(id); }, cid);
    await page.waitForTimeout(1000);
    await page.evaluate(id => roomGoTab(getContract(id), 'terms'), cid);
    await page.waitForTimeout(700);
    const master = await page.evaluate(() => {
      const fam = document.getElementById('family-section');
      return { html: fam ? fam.textContent.replace(/\s+/g, ' ') : '',
        create: !!document.getElementById('fam-create'),
        link: !!document.getElementById('fam-link') };
    });
    check('the master now reads as a master agreement',
      /master agreement/i.test(master.html) && /one agreement · 2 documents/i.test(master.html),
      master.html.slice(0, 150));
    /* THE SENTENCE THE WHOLE FEATURE EXISTS FOR: the date this agreement really
       ends is not the date typed on it. Read off the rendered card rather than
       against a date this test seeded — the record is reloaded from the server
       between screens, and asserting on my own seed would be asserting on the
       fixture rather than on the arithmetic. Both halves have to be there: the
       live date, the document it came from, and the fact that the master's own
       date is different and is still shown. */
    /* THE DRAFT PROPOSES, IT DOES NOT IMPOSE (owner-ruled 14 Aug 2026). The
       amendment made above is unsigned, so the master's live expiry must NOT
       have moved — and the proposal must be stated beside it, naming the
       document asking. Before the ruling this asserted the opposite. */
    const propLine = (master.html.match(/A draft document proposes[\s\S]*?signed\./) || [])[0] || '';
    check('a DRAFT amendment proposes the new term rather than imposing it',
      /2029-03-31/.test(propLine) && new RegExp(childIdEarly).test(propLine)
      && /until it is signed/i.test(propLine), propLine || master.html.slice(0, 200));
    /* "The live expiry X comes from Y" is the sentence that only appears once a
       SIGNED amendment has moved the term. The proposal sentence mentions the
       words "live expiry" in explaining that it has NOT moved it, so match the
       claim rather than the phrase. */
    check('and the live expiry itself has not moved',
      !/live expiry <?b?>?[\d-]/.test(master.html) && !/comes from/.test(master.html),
      (master.html.match(/comes from[^.]*\./) || ['not claimed'])[0]);

    /* Sign it, and the term moves — with the panel naming where it came from. */
    await page.evaluate(async id => {
      const c = getContract(id);
      c.status = 'Signed'; c.signedAt = nowISO();
      c.execution = { at: nowISO(), html: c.redlineText };
      persist(c); if (window.flushSaves) await flushSaves();
    }, childIdEarly);
    await page.evaluate(() => openWorkspace('MK-B2'));
    await page.waitForTimeout(900);
    await page.evaluate(id => { openWorkspace(id); }, cid);
    await page.waitForTimeout(1100);
    await page.evaluate(id => roomGoTab(getContract(id), 'terms'), cid);
    await page.waitForTimeout(800);
    const signedCard = await page.evaluate(() =>
      (document.getElementById('family-section') || {}).textContent.replace(/\s+/g, ' ').trim());
    const liveLine = (signedCard.match(/live expiry[^.]*\./) || [])[0] || '';
    check('once SIGNED, the live expiry is the amendment’s, naming both dates',
      /2029-03-31/.test(liveLine) && new RegExp(childIdEarly).test(liveLine)
      && /own date of \d{4}-\d{2}-\d{2}/.test(liveLine)
      && !/own date of 2029-03-31/.test(liveLine),
      liveLine);
    check('and it stops being described as a proposal',
      !/proposes/i.test(signedCard));
    check('"Link to a parent agreement" stands down on a master — it could only refuse',
      master.create && !master.link);

    /* ================= 5 · AN AMENDMENT CANNOT BE AMENDED ================= */
    const childId = childIdEarly;
    await page.evaluate(id => openWorkspace(id), childId);
    await page.waitForTimeout(900);
    await page.evaluate(id => roomGoTab(getContract(id), 'terms'), childId);
    await page.waitForTimeout(700);
    const child = await page.evaluate(() => ({
      create: !!document.getElementById('fam-create'),
      unlink: !!document.getElementById('fam-unlink'),
      text: (document.getElementById('family-section') || {}).textContent || '',
    }));
    check('standing on the amendment there is no Create — families are one deep',
      !child.create && child.unlink);
    check('and it says which agreement it belongs to',
      new RegExp(cid).test(child.text) && /filed as/i.test(child.text),
      child.text.replace(/\s+/g, ' ').slice(0, 120));
    /* "filed as a amendment" was what this said. A record is read by people. */
    check('without an English article that does not fit the word',
      !/ a (amendment|addendum|annex)/i.test(child.text));

    /* ================= 6 · OBLIGATIONS AS A CHECK ================= */
    await page.evaluate(id => roomGoTab(getContract(id), 'docs'), cid);
    await page.waitForTimeout(900);
    const rows = await page.evaluate(`(() => {
      const vis = ${VISIBLE};
      const card = document.getElementById('checks-card');
      const rs = [...card.querySelectorAll('.check-row')];
      return { order: rs.map(r => (r.querySelector('.cn') || {}).textContent.trim()),
        kinds: [...card.querySelectorAll('[data-check]')].map(b => b.getAttribute('data-check')),
        firstVis: vis(rs[0]),
        obLabel: (card.querySelector('[data-check="oblig"]') || {}).textContent };
    })()`);
    check('the Checks card carries three rows, obligations first',
      rows.kinds.join(',') === 'oblig,playbook,risk', rows.kinds.join(','));
    check('named Obligations, and visible', rows.firstVis.on && /Obligation/i.test(rows.order[0]),
      rows.order.join(' · '));

    /* Track one, so the row has a verdict to print and a panel to open. */
    await page.evaluate(id => {
      const c = getContract(id);
      c.obligations = [
        { id: 'ob_a', desc: 'Quarterly maintenance report', due: '2026-09-30', recurring: 'quarterly', status: 'open', party: 'theirs' },
        { id: 'ob_b', desc: 'Certificate of insurance', due: '2026-08-01', status: 'open', party: 'theirs' },
      ];
      renderChecksCard(c);
    }, cid);
    await page.waitForTimeout(400);
    const verdict = await page.evaluate(() =>
      (document.querySelector('[data-check="oblig"]') || {}).textContent.trim());
    check('once anything is tracked the row says how many', /2 tracked/.test(verdict), verdict);

    await page.click('[data-check="oblig"]');
    await page.waitForTimeout(700);
    const panel = await page.evaluate(`(() => {
      const vis = ${VISIBLE};
      const p = document.getElementById('side-panel');
      const host = document.getElementById('obligations-section');
      const list = document.querySelector('#side-panel .ob-list');
      const cs = list ? getComputedStyle(list) : null;
      return { panel: vis(p), title: p ? (p.querySelector('span') || {}).textContent : null,
        rows: document.querySelectorAll('#side-panel [data-ob-toggle]').length,
        add: vis(document.getElementById('ob-add')),
        find: vis(document.getElementById('ob-find')),
        maxH: cs ? cs.maxHeight : null,
        hostInPanel: !!(p && host && p.contains(host)),
        spills: list ? Math.round(list.scrollWidth - list.clientWidth) : 0 };
    })()`);
    check('the findings open in a panel over the document, at the right edge',
      panel.panel.on && /Obligation/i.test(panel.title || ''),
      panel.panel.on ? `${panel.panel.w}x${panel.panel.h}` : panel.panel.why);
    check('and it is the SAME card moved whole — both rows, both buttons',
      panel.hostInPanel && panel.rows === 2 && panel.add.on && panel.find.on,
      `${panel.rows} rows · add ${panel.add.on} · find ${panel.find.on}`);
    check('the 322px cap stands down inside a panel that scrolls on its own',
      panel.maxH === 'none', panel.maxH);
    check('nothing spills sideways out of the list', panel.spills <= 1, String(panel.spills));

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    check('Escape closes it', await page.evaluate(() => !document.getElementById('side-panel')));

    /* ================= 7 · THE RULE THE ROW DOES NOT INHERIT ================= */
    /* Checks refuses to re-run once the wording is sealed, which is right for a
       reading of the wording and wrong for a commitment kept beside it: a
       quarterly report starts mattering AFTER signature. */
    await page.evaluate(id => {
      const c = getContract(id);
      c.status = 'Signed'; c.obligations = [];
      renderChecksCard(c);
    }, cid);
    await page.waitForTimeout(400);
    const signed = await page.evaluate(() => {
      const g = k => document.querySelector(`[data-check="${k}"]`);
      return { oblig: !g('oblig').disabled, playbook: !g('playbook').disabled,
        risk: !g('risk').disabled, obOpacity: getComputedStyle(g('oblig')).opacity };
    });
    check('on a SIGNED contract the obligations sweep is still pressable',
      signed.oblig, `opacity ${signed.obOpacity}`);
    check('and the two checks that read the wording are not — the rule is intact',
      !signed.playbook && !signed.risk,
      `playbook ${signed.playbook} · risk ${signed.risk}`);

    check('still no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
