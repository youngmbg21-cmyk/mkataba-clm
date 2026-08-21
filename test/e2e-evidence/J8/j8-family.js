/* J8 — THE FAMILY. Walked in a real browser against a real server. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = path.join(__dirname, 'shots');

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

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
    await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2500);

    /* ---------- stage: a SIGNED master with a term, a party, a stream, letterhead ---------- */
    const parentId = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-A1');
      c.status = 'Signed';
      c.expiry = '2027-06-30';
      c.party = 'Highland Corporate Ltd (Kenya)';
      c.folder = 'proc';
      c.branding = { letterhead: 'HIGHLAND-LH-1' };
      c.counterparty = 'Kabras Sugar';
      c.counterpartyEmail = 'procurement@kabras.co.ke';
      c.value = 48000000; c.valueType = 'standard';
      c.metadata = Object.assign({}, c.metadata, { effectiveDate: '2026-07-31', currency: 'KES' });
      c.obligations = [{ id: 'ob-1', what: 'Quarterly report', due: '2026-12-31', assignee: 'Amina Otieno', done: false }];
      c.signerPlan = [{ id: 'sg-1', party: 'counterparty', order: 1, name: 'Grace Njeri', email: 'g@k.co.ke', role: 'Director', signed: true }];
      return c.id;
    });
    check('stage: a signed master with a term of its own', true, parentId);

    /* ================= 1. CREATE EACH OF THE SEVEN ================= */
    const SEVEN = ['amendment','addendum','variation','renewal','sow','annex','side-letter'];
    const WORD = { amendment:'Amendment', addendum:'Addendum', variation:'Variation',
      renewal:'Renewal', sow:'Statement of Work', annex:'Annex', 'side-letter':'Side Letter' };

    const made = await page.evaluate(async ({ parentId, SEVEN }) => {
      const parent = getContract(parentId);
      const out = [];
      for (const rel of SEVEN) {
        const r = createAmendment(parent, { relation: rel });
        out.push(r.error ? { rel, error: r.error } : {
          rel, id: r.contract.id, name: r.contract.name,
          body: r.contract.redlineText,
          counterparty: r.contract.counterparty,
          counterpartyEmail: r.contract.counterpartyEmail,
          party: r.contract.party, folder: r.contract.folder,
          branding: r.contract.branding,
          value: r.contract.value, valueType: r.contract.valueType,
          expiry: r.contract.expiry,
          metadataEff: (r.contract.metadata||{}).effectiveDate,
          fieldsEff: (r.contract.fields||{}).effDate,
          obligations: r.contract.obligations,
          signerPlan: r.contract.signerPlan,
          signatures: r.contract.signatures,
          owner: r.contract.owner,
          parentId: r.contract.parentId, relation: r.contract.relation,
          status: r.contract.status, template: r.contract.template,
        });
      }
      return out;
    }, { parentId, SEVEN });

    for (const m of made) {
      if (m.error) { check(`create ${m.rel}`, false, m.error); continue; }
      check(`create ${m.rel} — minted and filed against the parent`, m.parentId === parentId && m.relation === m.rel, `${m.id} rel=${m.relation}`);
      check(`create ${m.rel} — named "${WORD[m.rel]} No. 1"`, m.name.startsWith(`${WORD[m.rel]} No. 1`), m.name);
      check(`create ${m.rel} — a body is written`, !!m.body && m.body.length > 20, (m.body||'').slice(0, 60));
      check(`create ${m.rel} — recital names the parent`, /Refined Sugar Supply/.test(m.body || ''), null);
      check(`create ${m.rel} — recital carries the parent's real date`, /31 July 2026/.test(m.body || ''), (/dated ([^<(]+)/.exec(m.body)||[])[1]);
      check(`create ${m.rel} — counterparty carried`, m.counterparty === 'Kabras Sugar' && m.counterpartyEmail === 'procurement@kabras.co.ke', m.counterparty);
      check(`create ${m.rel} — party carried (the DOCUMENT's entity)`, m.party === 'Highland Corporate Ltd (Kenya)', m.party);
      check(`create ${m.rel} — stream carried`, m.folder === 'proc', m.folder);
      check(`create ${m.rel} — letterhead carried`, !!m.branding && m.branding.letterhead === 'HIGHLAND-LH-1', JSON.stringify(m.branding));
      check(`create ${m.rel} — value NOT carried`, m.value === 0, String(m.value));
      check(`create ${m.rel} — valueType IS inherited`, m.valueType === 'standard', m.valueType);
      check(`create ${m.rel} — effective date NOT carried`, !m.metadataEff && !m.fieldsEff, `md=${m.metadataEff} f=${m.fieldsEff}`);
      check(`create ${m.rel} — obligations NOT carried`, !m.obligations || m.obligations.length === 0, JSON.stringify(m.obligations));
      check(`create ${m.rel} — signers NOT carried`, !m.signerPlan || m.signerPlan.length === 0, JSON.stringify(m.signerPlan));
      check(`create ${m.rel} — stamped with an owner`, !!m.owner && !!m.owner.name, JSON.stringify(m.owner));
    }

    /* ---- the ordinal is PER KIND: "Addendum No. 2" must not count amendments ---- */
    const ordinals = await page.evaluate(({ parentId }) => {
      const parent = getContract(parentId);
      const a2 = createAmendment(parent, { relation: 'addendum' });
      const am2 = createAmendment(parent, { relation: 'amendment' });
      const an2 = createAmendment(parent, { relation: 'annex' });
      const an3 = createAmendment(parent, { relation: 'annex' });
      return { add2: a2.contract.name, amend2: am2.contract.name, annex2: an2.contract.name, annex3: an3.contract.name };
    }, { parentId });
    check('ordinal is PER KIND — the second addendum is "Addendum No. 2"', /^Addendum No\. 2\b/.test(ordinals.add2), ordinals.add2);
    check('ordinal is PER KIND — the second amendment is "Amendment No. 2"', /^Amendment No\. 2\b/.test(ordinals.amend2), ordinals.amend2);
    check('ordinal is PER KIND — annexes count annexes', /^Annex No\. 2\b/.test(ordinals.annex2) && /^Annex No\. 3\b/.test(ordinals.annex3), ordinals.annex2 + ' / ' + ordinals.annex3);

    /* ---- the blank body ---- */
    const blank = await page.evaluate(({ parentId }) => {
      const r = createAmendment(getContract(parentId), { relation: 'amendment', skeleton: false });
      return { body: r.contract.redlineText, id: r.contract.id };
    }, { parentId });
    check('a blank amendment gets FAMILY_BLANK_BODY, never an empty string', blank.body === '<p><br></p>', JSON.stringify(blank.body));

    /* ---- a DECLINED child keeps its number ---- */
    const declined = await page.evaluate(({ parentId }) => {
      const parent = getContract(parentId);
      const kids = familyChildren(parentId).filter(k => (k.relation||'') === 'side-letter');
      kids[0].status = 'Declined';
      const next = createAmendment(parent, { relation: 'side-letter' });
      return { declinedName: kids[0].name, nextName: next.contract.name };
    }, { parentId });
    check('a Declined child keeps its number — the next is No. 2, not a reuse', /No\. 2\b/.test(declined.nextName), `${declined.declinedName} declined → next is ${declined.nextName}`);

    /* ================= 2. LINKING RULES ================= */
    const link = await page.evaluate(({ parentId }) => {
      const parent = getContract(parentId);
      const child = familyChildren(parentId)[0];
      const standalone = state.contracts.find(c => !c.parentId && c.id !== parentId && !familyChildren(c.id).length);
      return {
        selfParent: linkError(standalone, standalone.id),
        underChild: linkError(standalone, child.id),
        masterUnderSomething: linkError(parent, standalone.id),
        standaloneToParent: linkError(standalone, parentId),
        noParent: linkError(standalone, null),
        standaloneId: standalone.id, childId: child.id,
      };
    }, { parentId });
    check('a contract cannot be its own parent', !!link.selfParent, link.selfParent);
    check('a document cannot be filed under a child (one level deep)', !!link.underChild, link.underChild);
    check('a master cannot be filed under anything', !!link.masterUnderSomething, link.masterUnderSomething);
    check('linking a standalone to a parent IS allowed', link.standaloneToParent === null, String(link.standaloneToParent));
    check('no parent chosen is refused in words', !!link.noParent, link.noParent);

    const unlink = await page.evaluate(({ parentId, standaloneId }) => {
      const s = getContract(standaloneId);
      applyParentLink(s, parentId, 'annex', '', currentUser());
      const linked = { parentId: s.parentId, relation: s.relation, audit: s.audit[s.audit.length-1] };
      clearParentLink(s, currentUser());
      return { linked, after: { parentId: s.parentId, relation: s.relation, audit: s.audit[s.audit.length-1] } };
    }, { parentId, standaloneId: link.standaloneId });
    check('link an existing document as a child', unlink.linked.parentId === parentId, `rel=${unlink.linked.relation} audit="${unlink.linked.audit.action}: ${unlink.linked.audit.detail}"`);
    check('…and unlink it again, with an audit line', !unlink.after.parentId, `audit="${unlink.after.audit.action}: ${unlink.after.audit.detail}"`);

    /* ================= 3. THE TERM ================= */
    const term = await page.evaluate(({ parentId }) => {
      const parent = getContract(parentId);
      // clear the decks: remove every child, then build exactly one amendment
      state.contracts = state.contracts.filter(c => c.parentId !== parentId);
      const r = createAmendment(parent, { relation: 'amendment', expiry: '2029-12-31' });
      const kid = r.contract;
      const asDraft = { eff: effectiveExpiry(parent), prop: proposedExpiry(parent), src: expirySource(parent) };
      kid.status = 'Signed';
      const asSigned = { eff: effectiveExpiry(parent), prop: proposedExpiry(parent), src: (expirySource(parent)||{}).id };
      return { kidId: kid.id, ownExpiry: ownExpiry(parent), asDraft: { eff: asDraft.eff, prop: asDraft.prop && asDraft.prop.date, propFrom: asDraft.prop && asDraft.prop.id, src: asDraft.src && asDraft.src.id }, asSigned };
    }, { parentId });
    check('a DRAFT amendment does NOT move the parent\'s end date', term.asDraft.eff === '2027-06-30', `effective=${term.asDraft.eff} own=${term.ownExpiry}`);
    check('…but its proposal is stated, and names the document asking', term.asDraft.prop === '2029-12-31' && term.asDraft.propFrom === term.kidId, `proposes ${term.asDraft.prop} from ${term.asDraft.propFrom}`);
    check('a SIGNED amendment DOES move the parent\'s end date', term.asSigned.eff === '2029-12-31', `effective=${term.asSigned.eff}`);
    check('…and the proposal stands down once it is executed', term.asSigned.prop === null, String(term.asSigned.prop));
    check('…and the parent names where the date came from', term.asSigned.src === term.kidId, term.asSigned.src);

    /* an ARCHIVED executed amendment still sets its parent's term */
    const arch = await page.evaluate(({ parentId, kidId }) => {
      const kid = getContract(kidId);
      kid.archived = { at: new Date().toISOString(), by: 'Amina Otieno' };
      return { eff: effectiveExpiry(getContract(parentId)), status: kid.status, archived: !!kid.archived };
    }, { parentId, kidId: term.kidId });
    check('an ARCHIVED executed amendment still sets its parent\'s term', arch.eff === '2029-12-31', `effective=${arch.eff} (child archived, status still ${arch.status})`);

    /* KPIs count agreements, not files */
    const counts = await page.evaluate(({ parentId }) => {
      const k = familyCounts(state.contracts);
      return { ...k, label: familyCountLabel(state.contracts), kids: familyChildren(parentId).length };
    }, { parentId });
    check('children do not count as separate agreements', counts.documents === counts.agreements + counts.amendments && counts.amendments === counts.kids,
      `${counts.agreements} agreements · ${counts.documents} documents (${counts.amendments} children) — "${counts.label}"`);

    fs.writeFileSync(path.join(__dirname, 'stage.json'), JSON.stringify({ parentId, kidId: term.kidId, made, ordinals, term, counts }, null, 2));
    await page.screenshot({ path: path.join(SHOTS, 'j8-after-model.png') });

    check('no page errors across the family model walk', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e) {
    check('J8 walk completed without throwing', false, e.message + '\n' + e.stack);
  } finally {
    const pass = results.filter(r => r.pass).length;
    console.log(`\n${pass}/${results.length} checks passed`);
    fs.writeFileSync(path.join(__dirname, 'results-model.json'), JSON.stringify(results, null, 2));
    await browser.close(); await h.stop();
    process.exit(pass === results.length ? 0 : 1);
  }
})();
