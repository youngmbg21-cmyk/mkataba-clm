/* ============================================================
   f875 — ROUNDS 3 TO 6 OF THE UI UPGRADE
   ============================================================
   The owner's "all yes" (24 Oct 2026), then "lets build all the rounds".
   (3) BESIDE THE PAPER: Actions is one card under its button (the SAP way);
       Key terms in the middle has "‹ Back to the paper", "Paper › Key terms"
       and a ✕; Clauses' head says "Clauses 13 · 2 need you · 1 worth a look";
       the Deal page the Legora way; Before you sign carries no second count;
       several numbered clauses are said by their numbers; the Send screen
       with no email set up opens on the link to copy; the chat window's brain
       line stands only while the brain is not live.
   (4) THE DOSSIER MIX: a Next card, the six stages on one line with ticks,
       "What happened so far"; What Jambo read (its Risks door) stands at
       every stage; the owed fields save one by one or all at once.
   (5) THE OTHER SIDE'S PAGE: where nobody is named to sign, steps 3 and 4 are
       one step, Signing, in one sentence — no form, no amber box; the other
       answers stay behind their door. THE OLD ROOM RETIRED: a door that
       opened it lands on the paper with its Dossier.
   (6) THE PHONE: Home opens "What do you need, Amina?" with the one ask box
       (Jambo), no tiles, no floating button, Needs you one quiet list; on
       Contracts the head says the book in numbers, + New, a status is a dot
       and a word, no stripe, no trailing dash.
   Measured at the parent (472b4eb): every test here fails.

   Run: node --test test/f875-rounds-three-to-six.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnRegion = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return strip(src.slice(i, j < 0 ? undefined : j)); };
const INDEX = R('index.html');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const PD = R('js/paperdesk.js');

describe('f875 (3) beside the paper', () => {
  test('3a Actions is one card under its button; pressed again it closes', () => {
    const f = fnRegion(PD, 'pdActsToggle');
    assert.match(f, /if \(pdActsPopOpen\(\) && _pdActsPop\.id === String\(id\) && _pdActsPop\.anchor === a\)\{ pdActsPopClose\(\); return true; \}/);
    assert.match(f, /el\.id = 'pd-acts-pop';/);
  });
  test('3b Key terms in the middle: a way back, where you are, and a ✕', () => {
    const f = fnRegion(PD, 'pdMidCrumbHtml');
    assert.match(f, /data-pd-mid-back>‹ \$\{_pdE\(back\)\}/);
    assert.match(f, /class="pd-mid-x" data-pd-mid-back/);
    assert.equal(BOOKS.en.pd_mid_back, 'Back to the paper');
    assert.ok(BOOKS.sv.pd_mid_back && BOOKS.sv.pd_mid_close);
  });
  test('3c the Clauses head names the tab, its count and what needs you', () => {
    const f = fnRegion(R('js/views/breakdown.js'), 'stkMarqueeHtml');
    assert.match(f, /i18t\('stk_mq_need', \{ n: T\.need \}\)/);
    assert.match(f, /<span class="stk-mq-name">\$\{E\(i18t\('pd_tab_clauses'\)\)\}<\/span>/);
  });
  test('3d Before you sign: no second count in the head while the list holds things', () => {
    assert.match(fnRegion(PD, 'pdSignPillHtml'), /if \(s\.holds\) return '';/);
  });
  test('3e several numbered clauses are said by their numbers, one keeps its name', () => {
    const f = fnRegion(R('js/negotiation.js'), 'negoBlockerClauses');
    assert.match(f, /if \(names\.length > 1 && names\.length <= NG_BLOCK_CLAUSES && nums\.every\(Boolean\)\)\{/);
    assert.equal(BOOKS.en.sgx_nb_clauses_n_other, 'clauses {list}');
  });
  test('3f the Send screen with no email set up opens on the link to copy', () => {
    assert.match(R('js/core.js'), /let ch=emailOff\(\)\?'link':'email';/);
    assert.equal(BOOKS.en.co_copy_the_link, 'Copy the link');
  });
  test('3g the chat window says the brain line only while the brain is not live', () => {
    assert.match(fnRegion(R('js/ai.js'), 'updateAiBrainPill'), /el\.hidden=!!b\.live;/);
  });
  test('3h the Deal page (the Legora way of 24 Oct, replaced by the Close Plan on 25 Oct): each point under what to do with it, §N beside its name', () => {
    const f = fnRegion(R('js/views/negotiation.js'), 'dealViewHtml');
    assert.match(f, /dealPlanFacts\(c, side\)/);
    assert.match(f, /class="deal-pr"/);
    assert.match(f, /s\.sec \?/);
  });
});

describe('f875 (4) the Dossier mix', () => {
  test('4a the six stages on one line, a Next card, what happened so far', () => {
    assert.match(fnRegion(PD, 'dossierLineHtml'), /class="ds-ln-st is-\$\{tone\}" data-ds-focus=/);
    assert.match(PD, /function dossierNextHtml\(/);
    assert.match(PD, /function dossierHappenedHtml\(/);
  });
  test('4b What Jambo read (its Risks to look at door) and the one desk\'s rows stand at every stage', () => {
    for (const st of ['fill', 'nego', 'sign', 'live']){
      const line = (INDEX.match(new RegExp(`#ig-dock \\.pd-dossier\\.is-mix\\[data-ds-focus="${st}"\\][^\\n]*`)) || [''])[0];
      assert.ok(line.includes(':not([data-pd-ds-card="read"])'), st + ' keeps What Jambo read');
      assert.ok(line.includes(':not(.pd-nd-row)'), st + ' keeps the one desk\'s rows');
    }
  });
  test('4c the owed fields save one by one, or all at once through the one confirm', () => {
    assert.match(fnRegion(PD, 'pdOgSaveIn'), /pdOgConfirm\(c, row\.getAttribute\('data-pd-og-row'\), \{ quiet: true, hold: true \}\)/);
  });
});

describe('f875 (5) the other side\'s page, and the old room', () => {
  const PO = R('js/views/portal.js');
  test('5a nobody named to sign: one Signing step, one sentence, no form, no amber box', () => {
    assert.match(PO, /const noSigners=!!\(p&&p\.signingOpen===false\)&&!portalExecuted\(\)&&!portalSignedRecord\(opts\);/);
    assert.match(fnRegion(PO, 'portalBeforeSignStagesHtml'), /\? stage\(3, false, i18t\('po_tab_signing'\), `<p class="ps-line">\$\{esc\(i18t\('po_no_signers_line',\{org\}\)\)\}<\/p>/);
    assert.match(PO, /\$\{portalBeforeSignStagesHtml\(c,p,\{ noSigners, other: noSigners \?/);
    assert.equal(BOOKS.en.po_no_signers_line, 'Nobody has been named to sign yet. {org} will send you a signing link once the wording is agreed. Until then you can read, comment and propose changes.');
    assert.ok(BOOKS.sv.po_no_signers_line && BOOKS.sv.po_other_answers);
  });
  test('5b the other answers stay, behind a door named for them', () => {
    assert.match(PO, /const portalOtherHtml=word=>`/);
    assert.match(PO, /\$\{portalOtherHtml\('po_other_answers'\)\}/);
  });
  test('5c a door that opened the old room lands on the paper with its Dossier', () => {
    assert.match(fnRegion(R('js/views/boardstrip.js'), 'roomRetiredLand'), /if \(page === 'ov' && typeof roomHomeLand === 'function'\)\{ const r = roomHomeLand\(id\); if \(r !== false\) return true; \}/);
  });
});

describe('f875 (6) the phone', () => {
  const MS = R('js/mobile-screens.js'), MJ = R('js/mobile.js');
  test('6a Home: "What do you need, Amina?", the one ask box, no tiles', () => {
    const f = fnRegion(MS, 'mHomeHtml');
    assert.match(f, /i18t\('cn_hello',\{name:first\}\)/);
    assert.match(f, /<form class="m-ask" data-m-ask role="search"><input id="m-ask"/);
    assert.doesNotMatch(f, /mKpiHtml\(D\)|m_your_metrics/);
  });
  test('6b no floating Jambo on Home or Contracts', () => {
    assert.match(R('js/mobile-copilot.js'), /const M_AI_SCREENS = \['approvals','portfolio'\];/);
  });
  test('6c Needs you: one quiet list, the agreement first, one short act word', () => {
    const f = fnRegion(MS, 'mHomeHtml');
    assert.match(f, /<span class="m-act-word">\$\{mEsc\(i18t\(M_ACT_WORD\[n\.kind\]\|\|'nd_btn_open'\)\)\}<\/span>/);
    assert.doesNotMatch(f, /border-radius:50%;flex:none;margin-top:6px;background:\$\{n\.dot\}/);
    assert.equal(BOOKS.en.m_waiting_on_you, 'Waiting on you · {n}');
  });
  test('6d Contracts: the book in numbers, + New, no stripe, no trailing dash', () => {
    const f = fnRegion(MS, 'mContractsHtml');
    assert.match(f, /<div class="m-sub">\$\{mEsc\(mBookLine\(\)\)\}<\/div>/);
    assert.doesNotMatch(f, /class="m-stripe"/);
    assert.match(f, /e&&e!=='\\u2014'\?/);
    assert.equal(BOOKS.en.m_new_short, '+ New');
    assert.equal(BOOKS.en.m_search_contracts, 'Search contracts, or ask Jambo');
  });
  test('6e a status is a dot and a word', () => {
    const f = fnRegion(MJ, 'mPill');
    assert.match(f, /<span class="m-pill"><i class="m-pill-dot"/);
    assert.match(MJ, /\.m-pill\{ display:inline-flex; align-items:center; gap:6px; padding:0; background:none;/);
  });
});
