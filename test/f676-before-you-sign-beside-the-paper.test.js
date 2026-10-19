'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f676 — BEFORE YOU SIGN, BESIDE THE PAPER, AND THE DUPLICATES RETIRED (the
   one-page Home plan, stage 5; the owner picked "Checklist" by name on 14 Oct
   2026, with all three recommendations: the Negotiate page folds into Home;
   the room's Details, Signing, Obligations and History tabs go; once both
   have signed the face stays as the receipt)

   (1) A FACE OF JAMBO'S TAB THAT OWNS NO BUILDER AND NO WRITER: it draws the
       Signing column's four slots and asks the column's one painter
       (renderSignButton) to fill them; it signs nothing and files nothing.
   (2) THE PAPER BESIDE IT IS THE SIGNING COPY while it is open — never the
       redline, no banner word over it, no Track beside it — with the places
       to sign and every signature marked by the Signing tab's own painters,
       and its page arrows.
   (3) ITS PILL READS THE ONE LIST THE SIGN BUTTON READS (signReadiness);
       once signed it is the receipt — no Sign foot, no pill, and "What starts
       now" one press from the Board's Obligations view.
   (4) THE ROOM KEEPS OVERVIEW AND WHERE WE ARE; every door naming one of the
       four retired tabs opens its twin on Home (ROOM_TABS_HOME), the phone
       keeps its own screens.
   (5) THE NEGOTIATE PAGE FOLDS INTO HOME: every door onto a negotiation lands
       on Jambo's Redlines face (the page only when asked for by name, or on
       the phone); a bare visit decides before anything is drawn; the
       Negotiations list stays; the page's notices ride the face.
   (6) THE PAPER'S LINE TAKES THE CONTRACT'S ACTS: Notes · Share · ⋯ from the
       contract page's own builders, the ⋯ menu ONE builder and ONE wiring
       for both; Their view joins Clean and Redline.
   (7) Both books carry the new words; the brain names the face.
   (8) Found on the way: a landing on an answered box opens its fold, and a
       press on an answer on Home's paper never opens a retired tab.
   (9) What the room's Signing tab had, on Home too: the page arrows and
       size, the walk, a server's answer drawn there, a review row that reads
       without writing, the stage word, a refresh keeping the face, the
       Obligations count, doors that use Home only where it is loaded.
  (10) What the Negotiate page did, the Redlines face does: the glow, the
       live probe and presence, watching for their answer, the one send,
       risk cards finding clauses, the paper following the face SHOWING, the
       way back to the Clauses tab, no door drawn twice.
   AT THE PARENT every claim FAILS: none of these names exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = R('js/paperdesk.js');
const IG = R('js/views/intelligence.js');
const CT = R('js/views/contract.js');
const NEGO = R('js/views/negotiation.js');
const APP = R('js/app.js');
const HOME = R('js/views/home.js');
const CORE = R('js/core.js');
const CA = R('js/copilotacts.js');
const OB = R('js/obligations.js');
const AP = R('js/views/approvalsview.js');
const AG = R('js/views/agents.js');
const I18N = R('js/i18n.js');
const BRAIN = R('js/brainmap.js');
const HTML = R('index.html');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };
const section = (src, from, to) => { const i = src.indexOf(from); assert.ok(i >= 0, from); const j = src.indexOf(to, i + from.length); return src.slice(i, j < 0 ? undefined : j); };

describe('f676 (1) the face owns no builder and no writer', () => {
  const SEC = strip(section(PD, 'BEFORE YOU SIGN, BESIDE THE PAPER', '---- HISTORY: the trail'));
  test('1a the face draws the Signing column\'s four slots', () => {
    const html = strip(fnBody(PD, 'pdSignFaceHtml'));
    ['id="sign-seal-acts"', 'id="sign-side"', 'id="sign-block"', 'id="sign-wrap"'].forEach(s => assert.ok(html.includes(s), s));
    assert.match(html, /class="pd-sf-body scroll-thin sign-one"/, 'the column\'s own clothes, scoped');
  });
  test('1b the column\'s one painter fills them, and calls the face back', () => {
    assert.match(strip(fnBody(PD, 'pdSignFacePaint')), /renderSignButton\(c\)/);
    const rsb = strip(fnBody(CT, 'renderSignButton'));
    assert.ok((rsb.match(/pdSignCounts\(/g) || []).length >= 2, 'every way out of the painter tells the face (open, signed, signed outside)');
  });
  test('1c it signs nothing and files nothing', () => {
    ['signDocument(', 'negoFileChange(', 'changes.push(', 'saveContract(', 'openSignaturePad('].forEach(w =>
      assert.ok(!SEC.includes(w), 'the face does not call ' + w));
  });
  test('1d one face at a time: each opener clears the others', () => {
    const open = strip(fnBody(PD, 'pdOpenOnHome'));
    assert.match(open, /if \(tab === 'signing'\)\{[\s\S]*?_pdSign = String\(id\); _pdRed = null; _pdFill = null; _pdFillKey = null;/);
    assert.match(open, /_pdFill = String\(id\); _pdRed = null; _pdSign = null;/);
    assert.match(open, /_pdRed = String\(id\); _pdFill = null; _pdFillKey = null; _pdSign = null;/);
    assert.match(open, /if \(tab === 'sign'\)\{/, 'an approval asked of you still opens the Approvals page (unchanged)');
  });
  test('1e Jambo\'s tab draws it and a question or another contract puts it away', () => {
    const dock = strip(fnBody(IG, 'renderIntelDock'));
    assert.match(dock, /pdSignShows\(\)/);
    assert.match(dock, /<div id="pd-signface" class="pd-signface flex-1 min-h-0">\$\{pdSignFaceHtml\(pdContract\(\)\)\}<\/div>/);
    assert.match(dock, /pdSignFacePaint\(/);
    /* RE-POINTED 19 Oct 2026 — JAMBO AS A TAB YOU FLIP TO: a question keeps
       the face (the panel flips to the conversation over it, f840) */
    assert.doesNotMatch(strip(fnBody(IG, 'intelAsk')), /pdSignAway\(\)/);
    assert.ok((strip(IG).match(/pdSignSeen\(/g) || []).length >= 2, 'igAnalyze and the paper\'s hold');
  });
});

describe('f676 (2) the paper beside it is the signing copy', () => {
  test('2a igSignOn draws the signing copy on Home\'s canvas; never the redline', () => {
    assert.match(strip(fnBody(IG, 'igSignOn')), /pdSignFor\(\)===String\(p\.id\)/);
    assert.match(strip(fnBody(IG, 'igRedOn')), /if\(igSignOn\(c\)\) return false;/);
    assert.match(strip(fnBody(IG, 'igCleanOnRed')), /!igSignOn\(c\)/);
    assert.match(strip(fnBody(IG, 'igPaperHtml')), /signCopySheetHtml\(c,\{ canvasId:'ig-canvas', wrapId:'ig-signwrap' \}\)/);
    assert.match(strip(fnBody(IG, 'igPaperKey')), /igSignOn\(c\)\?':sign'/, 'the paper repaints when the copy changes');
  });
  test('2b the places to sign and the signatures given are the Signing tab\'s own painters', () => {
    const pp = strip(fnBody(PD, 'pdSignPaperPaint'));
    /* RE-POINTED (the gaps, round 10 "The road", 18 Oct 2026): the page arrows and
       size stand on the paper's line now (igSignCopyHtml), so the paper's own
       scroller is watched through scWireControls(host), which finds no buttons there */
    ['signSpotsPaint(c, cv)', 'pagesSignFlags(cv, 0)', 'pagesSignMarks(cv, pagesSignRows(c, c.signatures || []))', 'signCopyWatch(', 'scApplyZoom()', 'scPaintPage()', 'scWireControls(host)'].forEach(w =>
      assert.ok(pp.includes(w), w));
    assert.match(strip(fnBody(CT, 'signSpotsPaint')), /function signSpotsPaint\(c, ?cv\)/, 'the painter takes the canvas it marks');
  });
  /* RE-POINTED (the gaps, round 10 "The road", 18 Oct 2026): the owner's picked
     drawing puts "Signing copy" on the paper's line with its page arrows and size,
     which reverses the 10 Oct 2026 "no banner words" ruling for this line — the
     word is the copy's own pill in the head card, never a band over the paper */
  test('2c the signing copy says so on the paper\'s line (round 10 as drawn), and no Clean | Redline', () => {
    const s = strip(fnBody(IG, 'igStripHtml'));
    assert.match(s, /igSignOn\(c\)\?igSignCopyHtml\(c\)/, 'the word and its controls on the line');
    assert.match(strip(fnBody(IG, 'igSignCopyHtml')), /sc_signed_copy':'sc_signing_copy'/);
    assert.match(s, /!igSignOn\(c\)&&window\.pdRedOk/, 'no Clean | Redline while the signing copy shows');
  });
  test('2d no Track beside the signing copy: its pages are scaled, a clause\'s line would sit beside the wrong words', () => {
    assert.match(strip(fnBody(IG, 'igStrandPaint')), /if\(igSignOn\(c\)\)\{ sp\.hidden=true;/);
  });
});

describe('f676 (3) the one list, and the receipt', () => {
  test('3a the pill reads signReadiness — the list the Sign button reads', () => {
    const st = strip(fnBody(PD, 'pdSignState'));
    assert.match(st, /signReadiness\(c\)/);
    assert.doesNotMatch(st, /signBlockers\(/, 'one list, read once');
  });
  test('3b signed, the face is the receipt: no Sign foot, no pill, What starts now', () => {
    const html = strip(fnBody(PD, 'pdSignFaceHtml'));
    assert.match(html, /\$\{closed \? '' : `<div class="pd-sf-foot">\$\{wrap\}<\/div>`\}/);
    assert.match(strip(fnBody(PD, 'pdSignHeadHtml')), /s\.closed \? '' : pdSignPillHtml\(c\)/);
    const next = strip(fnBody(PD, 'pdSignNextHtml'));
    assert.match(next, /if \(!pdSignState\(c\)\.closed\) return '';/);
    assert.match(next, /c\.obligations/);
    assert.match(next, /data-pd-sf-oblig=/);
    assert.match(strip(fnBody(PD, 'pdSignWire')), /hbOpenView\(ob\.getAttribute\('data-pd-sf-oblig'\), 'oblig'\)/);
  });
});

describe('f676 (4) the room keeps two tabs; the four open their twins on Home', () => {
  test('4a ROOM_TABS is Overview and Where we are', () => {
    const rt = strip(section(CT, 'const ROOM_TABS=[', '\n];'));
    const keys = [...rt.matchAll(/\['([a-z]+)','/g)].map(m => m[1]);
    assert.deepEqual(keys, ['terms', 'stands']);
  });
  test('4b each retired tab has its twin, and the phone keeps its own', () => {
    assert.match(CT, /const ROOM_TABS_HOME = \{ details:'fill', sign:'signing', oblig:'oblig', history:'hist' \};/);
    const th = strip(fnBody(CT, 'roomTabHome'));
    assert.match(th, /window\.innerWidth<768\) return false;/);
    assert.match(th, /pdFillOpen\(c\.id\)/);
    assert.match(th, /pdSignOpen\(c\.id\)/);
    assert.match(th, /hbOpenView\(c\.id,ROOM_TABS_HOME\[k\]\)/);
  });
  test('4c roomGoTab sends the four home; one Home cannot open lands on the Overview', () => {
    assert.match(strip(fnBody(CT, 'roomGoTab')), /if\(ROOM_TABS_HOME\[k\]\)\{ if\(roomTabHome\(c,k\)\) return; if\(!ROOM_TABS\.some\(t=>t\[0\]===k\)\) k='terms'; \}/);
  });
  test('4d the doors that named the four ask roomOpenAt / roomTabHome', () => {
    assert.match(strip(fnBody(CT, 'roomOpenAt')), /if\(roomTabHome\(c,k\)\) return true;/);
    assert.match(strip(HOME), /if\(kind==='sign' && window\.roomOpenAt\)\{ roomOpenAt\(c\.id,'sign'\); return true; \}/);
    assert.match(strip(HOME), /if\(kind==='refused'\)\{ if\(window\.roomOpenAt\) roomOpenAt\(c\.id,'sign'\)/);
    assert.ok((strip(APP).match(/roomOpenAt\(c\.id,'sign'\)/g) || []).length >= 4, 'the bell\'s signing rows');
    assert.match(strip(APP), /roomOpenAt\(c\.id,'oblig'\)/, 'the bell\'s duty row');
    assert.match(strip(fnBody(CA, 'caRoomSign')), /pdSignOpen\(c\.id\)/);
    assert.match(strip(OB), /roomOpenAt\(cid, 'oblig'\)/);
    assert.match(strip(AP), /roomTabHome\(c,'sign'\)/);
    assert.match(strip(AG), /roomTabHome\(c, tab\)/);
    assert.match(strip(fnBody(CORE, 'openFromHash')), /window\.roomTabHome\(c,homeTab\)/, 'an email link naming a retired tab');
  });
});

describe('f676 (5) the Negotiate page folds into Home', () => {
  test('5a every door lands on the face; the page only by name', () => {
    const ow = strip(fnBody(NEGO, 'openRedlineWorkbench'));
    assert.match(ow, /if \(\(opts\.face \|\| !opts\.page\) && typeof window\.pdRedLand === 'function' && pdRedLand\(target\)\)\{/);
    assert.match(ow, /_rlPageFor = String\(target\);/);
    /* the two walls still come first */
    assert.ok(ow.indexOf('negoMayStart(held)') < ow.indexOf('pdRedLand(target)'));
    assert.ok(ow.indexOf('negoBlanksOpen(held)') < ow.indexOf('pdRedLand(target)'));
  });
  test('5b a bare visit decides before anything is drawn; the list stays', () => {
    assert.match(strip(APP), /view==='redline'[\s\S]{0,200}window\.rlHomeTakesIt\(\)\) return;/);
    const ht = strip(fnBody(NEGO, 'rlHomeTakesIt'));
    assert.match(ht, /if \(doorAsked === 'list'\) return false;/);
    assert.match(ht, /String\(c\.id\) === _rlPageFor\) return false;/);
    assert.match(ht, /negoMayStart\(c\)\.ok\) return false;/);
    assert.match(strip(fnBody(NEGO, 'openNegotiations')), /\|\| home \? 'list' : 'reopen'/);
  });
  test('5c the page\'s notices and its review door ride the face', () => {
    assert.match(strip(fnBody(PD, 'pdRedFaceHtml')), /rlFloatingNoticesHtml\(c, o\)/);
    /* RE-POINTED 19 Oct 2026 (round 9's gaps, third pass, lane C2): the
       column head's × builder (pdRedHeadEndHtml) went with its last caller —
       ‹ Jambo in the panel's row closes the face — so the face's options are
       asked: no head end, no way to the page it folded into */
    assert.ok(!/function pdRedHeadEndHtml\(/.test(PD), 'the stale head-end builder is gone');
    assert.doesNotMatch(strip(fnBody(PD, 'pdRedOpts')), /headEnd|data-pd-rf-nego/, 'no way to the page it folded into');
    assert.match(strip(HOME), /openRedlineWorkbench\(c\.id, \{ face: true \}\)/, 'a review lands on the face too');
    /* the page's Ask for review and Home's ⋯ row are one door */
    assert.match(strip(NEGO), /rlReviewDoor\(c, \(\) => renderRedline\(\)\)/);
    /* the ⋯ left the paper's line for the panel's Menu tab (owner, 15 Oct 2026): the same row, the same door */
    assert.match(strip(fnBody(PD, 'pdMenuWire')), /rlReviewDoor\(k\(\), again\)/);
  });
});

describe('f676 (6) the paper\'s line takes the contract\'s acts', () => {
  test('6a Notes · Share on the paper\'s line; the ⋯ rows are the panel\'s Menu tab, from the same builders (owner, 15 Oct 2026)', () => {
    const a = strip(fnBody(IG, 'igStripActsHtml'));
    /* RE-POINTED 17 Oct 2026 (round 6, "One line"): Home's line draws the same door with its word */
    assert.match(a, /roomChatDoorHtml\(\{ word:true \}\)/);
    assert.match(a, /id="ws-share"/);
    assert.doesNotMatch(a, /roomMoreMenuHtml|ws-more/, 'no ⋯ on the paper\'s line');
    assert.match(strip(fnBody(PD, 'pdMenuGroups')), /roomMoreMenuHtml\(c, \{ menuRow: clause \+ nego, noFocus: true \}\)/);
    const rows = strip(fnBody(IG, 'igNegoRowsHtml'));
    ['data-ig-review', 'data-ig-pbreview', 'data-ig-memo'].forEach(r => assert.ok(rows.includes(r), r));
    assert.match(strip(fnBody(IG, 'igStripHtml')), /\$\{onHome\?igStripActsHtml\(c\):''\}/);
  });
  test('6b ONE menu builder and ONE wiring, for the room and for Home', () => {
    const head = strip(fnBody(CT, 'wireRoomHead'));
    assert.match(head, /roomMenuWire\(c\);/);
    assert.match(strip(fnBody(PD, 'pdMenuWire')), /roomMenuWire\(k\(\)\)/);
    const more = strip(fnBody(CT, 'roomMoreMenuHtml'));
    assert.match(more, /opts\.noFocus/);
    assert.match(more, /opts\.menuRow/);
  });
  test('6c Their view joins Clean and Redline — the same paper from their seat, nothing to press', () => {
    const s = strip(fnBody(IG, 'igStripHtml'));
    assert.match(s, /data-ig-red="theirs"/);
    assert.match(strip(fnBody(IG, 'igTheirsOn')), /intel\.paper\.red==='theirs'/);
    assert.match(strip(fnBody(IG, 'igPaperHtml')), /igTheirsOn\(c\)\?\{ side:'counterparty', readonly:true, preview:true \}/);
  });
});

describe('f676 (7) the words and the brain', () => {
  const books = (() => { const i = I18N.indexOf('\n  sv: {'); return [I18N.slice(0, i), I18N.slice(i)]; })();
  test('7a both books carry every new word', () => {
    ['pd_sf_title', 'pd_sf_next_head', 'pd_sf_next_n_one', 'pd_sf_next_n_other', 'pd_sf_next_nodue_one', 'pd_sf_next_nodue_other',
      'pd_sf_next_none', 'pd_sf_next_go', 'int_red_theirs', 'int_red_theirs_title'].forEach(k =>
      books.forEach((b, n) => assert.match(b, new RegExp('\\b' + k + ':'), k + (n ? ' (sv)' : ' (en)'))));
  });
  test('7b the brain names the face and starts the signing flow there', () => {
    assert.match(BRAIN, /\['signface', 'pdSignOpen', 'see', 0\]/);
    /* stage 6 (14 Oct 2026): the face HEADS the step — the brain draws and plays a step by its first part */
    assert.match(BRAIN, /\['signface', 'signtab', 'linkcheck'\]/);
    assert.match(BRAIN, /\['redface', 'negpage', 'startnego', 'here', 'follow'\]/);
  });
  test('7c the face wears its own scoped clothes', () => {
    assert.match(HTML, /#pd-signface \.pd-sf-foot[,{]/);
    assert.match(HTML, /#ig-paper \.ig-signpaper\{/);
    assert.match(HTML, /#ig-strip \.ig-acts\{|\.ig-acts\{/);
  });
});

describe('f676 (8) found on the way: the doors into Fill in that now carry the room\'s Details traffic', () => {
  test('8a a landing on an answered box opens its "Show N filled" fold first', () => {
    assert.match(strip(fnBody(PD, 'pdFillLand')), /const fold = box && box\.closest \? box\.closest\('details'\) : null; if \(fold && !fold\.open\) fold\.open = true;/);
  });
  test('8b a press on an answer on Home\'s paper never opens the retired Details tab', () => {
    const i = CT.indexOf("document._homeAnswerWired = true;"); assert.ok(i > 0);
    const block = strip(CT.slice(i, CT.indexOf('\n}\n', i)));
    assert.match(block, /pdFillOpen\(c\.id, \{ key \}\)/);
    assert.doesNotMatch(block, /roomGoTab\(/, 'no room tab on the way');
  });
});

describe('f676 (9) what the room\'s Signing tab had, on Home too (found by the re-pointed checks)', () => {
  test('9a the signing copy keeps its page arrows and size — the room\'s controls, finding either paper', () => {
    /* RE-POINTED (round 10 as drawn): the controls stand on the line, nothing above the paper —
       RE-POINTED AGAIN (the gaps' second check, 18 Oct 2026): no row at all, not an empty one held,
       so the signing copy starts higher, never lower */
    assert.match(strip(fnBody(IG, 'igZoomCornerHtml')), /if\(igSignOn\(c\)\) return '';/); assert.doesNotMatch(IG, /IG_ZC_HOLD/, 'no empty row is held above the signing copy');
    assert.match(strip(fnBody(IG, 'igSignCopyHtml')), /scControlsHtml\(c\)/);
    assert.match(strip(fnBody(IG, 'igPaperHtml')), /zoom:\$\{igSignOn\(c\)\?1:/, 'the reading zoom stays off the signing copy');
    const els = strip(fnBody(CT, 'scEls'));
    assert.match(els, /getElementById\('doc-signwrap'\)/);
    assert.match(els, /getElementById\('ig-signwrap'\)/);
    ['scPaintPage', 'scPageGo', 'scApplyZoom', 'scZoomFit'].forEach(f => assert.match(strip(fnBody(CT, f)), /scEls\(\)/, f));
  });
  test('9b the walk to the places to sign stands on the paper\'s line and finds Home\'s paper', () => {
    assert.match(strip(fnBody(IG, 'igStripHtml')), /igSignOn\(c\)&&window\.signWalkHtml\?signWalkHtml\(c,\{ home:true \}\)/);
    assert.match(strip(fnBody(IG, 'igStripActsWire')), /#ws-walk/);
    assert.match(strip(fnBody(CT, 'signWalkGo')), /getElementById\('doc-canvas'\) \|\| document\.getElementById\('ig-canvas'\)/);
  });
  test('9c a server\'s answer about the contract on Home\'s paper is drawn there (the seal, the duties it starts)', () => {
    assert.match(strip(fnBody(CORE, 'contractOnHome')), /pdContract\(\); return !!\(p&&String\(p\.id\)===String\(c\.id\)\)/);
    assert.ok((strip(CORE).match(/contractOnScreen\(c\)\|\|contractOnHome\(c\)/g) || []).length >= 3, 'the sealed-meanwhile, refused-save and arrival repaints');
    assert.match(strip(OB), /!contractOnScreen\(c\) && !\(window\.contractOnHome && contractOnHome\(c\)\)/);
  });
  test('9d READING MUST NOT WRITE: the paper line\'s review row reads the stored review only', () => {
    const st = strip(fnBody(NEGO, 'rlReviewDoorState'));
    assert.doesNotMatch(st, /reviewState\(/, 'reviewState reads the negotiation\'s unsent asks, which creates one');
    assert.match(st, /reviewOpenList\(c\)\.some\(r => reviewIsReviewer\(r, me\)\)/);
  });
  test('9e the paper\'s line says the stage the room\'s head says', () => {
    assert.match(strip(fnBody(IG, 'igStripHtml')), /contractStatusMeta\(c\)/);
  });
  test('9f a refresh brings back the face that was open beside the paper', () => {
    assert.match(strip(fnBody(PD, 'pdFaceNow')), /pdSignShows\(\)\) return 'signing';[\s\S]*pdRedShows\(\)\) return 'red';[\s\S]*pdFillShows\(\)\) return 'fill';/);
    const HB = R('js/views/homeboard.js');
    assert.match(strip(fnBody(HB, 'hbPlace')), /p\.paper\.face = face/);
    assert.match(strip(fnBody(HB, 'hbPlacePut')), /PD_FACE_WORDS\.includes\(want\.face\)[\s\S]*pdOpenOnHome\(want\.id, want\.face\)/);
  });
  test('9g Fill in after another face of the same contract draws the working copy again', () => {
    assert.match(strip(fnBody(PD, 'pdOpenOnHome')), /const turned = _pdSign === String\(id\) \|\| _pdRed === String\(id\);[\s\S]*if \(turned\) pdSignPaper\(id\);/);
  });
  test('9h the Board\'s Obligations count is the room tab\'s: what is still owed, late only when overdue', () => {
    const HB = R('js/views/homeboard.js');
    assert.match(strip(fnBody(HB, 'hbCvCounts')), /obligationTabState\(c\)/);
  });
  test('9i the retired tabs\' doors use Home only where its paper is loaded', () => {
    assert.match(strip(fnBody(CT, 'roomTabHome')), /typeof window\.igWalk!=='function'\|\|typeof window\.igPaperHold!=='function'\) return false;/);
  });
});

describe('f676 (10) what the Negotiate page did, the Redlines face does too (found by the re-pointed checks)', () => {
  const RK = R('js/risks.js');
  const APPJ = R('js/app.js');
  test('10a Jambo\'s answer glows on the face: the page\'s after-paint is published, and the review door glows on the menu', () => {
    assert.match(NEGO, /Object\.assign\(window, \{ negoAfterPaint, negoTurnBannerHtml,/);
    /* RE-POINTED 15 Oct 2026: the ⋯ went; the Menu tab's review row, or the tab itself while it is shut, glows */
    /* RE-POINTED 18 Oct 2026 (round 9's gaps, "Piles" as drawn): the Redlines
       column's own head carries "Ask for review" ([data-rl-review-go]) — on
       the face that is the review door that glows; the menu rows stay */
    assert.match(NEGO, /escalate: \(\) => '\[data-rl-review\], \[data-rl-review-go\]:not\(:disabled\), #pd-body \.pd-menu \[data-ig-review\], #ig-dock \[data-pd-tab="menu"\]'/);
  });
  test('10b the live probe and the presence beat run for the face', () => {
    assert.match(strip(fnBody(NEGO, 'rlLiveHere')), /pdRedShows\(\)/);
    const poll = strip(fnBody(NEGO, 'rlStartLivePoll'));
    assert.match(poll, /if \(!rlLiveHere\(id\)\)\{/);
    assert.doesNotMatch(poll, /renderRedline\(\)/, 'each host repaints its own (rlLiveRepaint)');
    const paint = strip(fnBody(PD, 'pdRedFacePaint'));
    assert.match(paint, /rlStartLivePoll\(c\)/);
    assert.match(paint, /pdPresenceOn\(c\)/);
    assert.match(strip(fnBody(PD, 'pdRedClose')), /pdPresenceOff\(id\)/);
  });
  test('10c their answer is collected while the face watches', () => {
    assert.match(strip(fnBody(CORE, 'pollWaitingOnThem')), /const onHome=face==='red'\|\|face==='signing';/);
    assert.match(strip(fnBody(PD, 'pdArrived')), /pollNow\('opened face'\)/);
  });
  test('10d "Send to <them>" has the page\'s one send to press', () => {
    assert.match(strip(fnBody(PD, 'pdRedFaceHtml')), /<div hidden data-pd-rf-send>/);
  });
  test('10e a risk card finds its clause on Home\'s paper', () => {
    const g = strip(fnBody(RK, 'riskGoClause'));
    assert.match(g, /getElementById\('ig-paper'\)/);
    assert.match(g, /#ig-canvas \[data-clause=/);
  });
  test('10f the paper follows the face that is SHOWING, and a tab press gives it back', () => {
    assert.match(strip(fnBody(IG, 'igSignOn')), /pdSignShows\(\)/);
    assert.match(strip(fnBody(IG, 'igRedOn')), /pdRedShows\(\)&&pdRedFor\(\)===String\(p\.id\)/);
    assert.match(strip(PD), /pdSetTab\(tab\.getAttribute\('data-pd-tab'\)\);[\s\S]{0,260}igPaintPaper\(\)/);
  });
  test('10g the way back to the Clauses tab stands in Home\'s bar on that trip', () => {
    const h = strip(fnBody(APPJ, 'shellCrumbHome'));
    assert.match(h, /rlCameFrom\(id\)/);
    assert.match(h, /data-rl-back-clauses/);
    assert.match(strip(fnBody(IG, 'renderIntelDock')), /shellCrumbHome\(\)/);
  });
  test('10h an empty column\'s doors are not drawn twice', () => {
    assert.match(HTML, /#pd-redface \.rl-face:has\(\.rl-cards-empty \.rl-empty-acts\) \.pd-rf-foot\{display:none\}/);
  });
});
