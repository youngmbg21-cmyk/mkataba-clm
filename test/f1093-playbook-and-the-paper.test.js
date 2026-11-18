'use strict';
/* f1093 — THE PLAYBOOK, AND THE PAPER IN A POP-UP (owner, 18 Nov 2026: "Let's rename standards to playbook across the
   platform. Also, remove 'open the paper' link from the standards but on the approvals page, add a link or press below
   the approve and refuse button that when pressed it brings up a pop up of the paper you usually see in the dossier
   redline page … you can press to go to the dossier page itself"; the drawing's two answers: each entry is a
   "position", and the link goes on departures only).

   (1) THE NAME: the page is Playbook in both books, its entries positions; the template meaning of "standard" (a
       company standard contract) is untouched.
   (2) THE LINK: "See it in the paper ›" under Allow once and Refuse, on departure rows only, a look never a decision.
   (3) THE POP-UP: the Dossier's own paper (redlineDocHtml where a negotiation stands, else docSheetHtml) and its own
       notes (pd2RedAnswers → pd2RedBlocks → pd2RedGroupHtml) with their buttons taken off; it lands on the quoted
       words (landOn); Open the Dossier › closes and opens the contract; nothing is written.
   (4) THE SERVER'S SENTENCES and their translations moved together. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); const k = src.indexOf('\nasync function ', i + 10); const e = [j, k].filter(x => x > 0); return src.slice(i, e.length ? Math.min(...e) : undefined); };
const I = R('js/i18n.js');
const books = () => { const m = [...I.matchAll(/^    apn_land_gone: /gm)].map(x => x.index); assert.equal(m.length, 2); const svAt = I.lastIndexOf('\n    ld_page:'); return { en: I.slice(0, svAt), sv: I.slice(svAt) }; };
const val = (src, k) => { const m = new RegExp(`^    ${k}: '((?:[^'\\\\]|\\\\.)*)',$`, 'm').exec(src); return m ? m[1] : null; };

describe('f1093 (1) the page is the Playbook, its entries positions', () => {
  test('the page, the Guide and Approvals say Playbook, both books', () => {
    const { en, sv } = books();
    assert.equal(val(en, 'ld_page'), 'Playbook');
    assert.equal(val(sv, 'ld_page'), 'Spelbok');
    assert.equal(val(en, 'gd_p_standards'), 'Playbook');
    assert.equal(val(en, 'apn_group_dep'), 'Departures from our playbook');
    assert.equal(val(en, 'apn_group_std'), 'Changes to our playbook');
    assert.equal(val(en, 'ld_new'), 'New position');
    assert.equal(val(en, 'ld_edit'), 'Edit the position');
    assert.equal(val(en, 'ld_n_standards_other'), '{n} positions');
    assert.equal(val(sv, 'ld_n_standards_other'), '{n} positioner');
  });
  test('no rulebook "standards" is left on the Playbook page or Approvals\' piles', () => {
    const { en } = books();
    const left = [...en.matchAll(/^    ((?:ld|apn|srv_ld|st_stddec|srv_stddec)_[a-z0-9_]*): '((?:[^'\\]|\\.)*)',$/gm)].filter(m => /\bstandards?\b/i.test(m[2])).map(m => m[1]);
    assert.deepEqual(left, []);
  });
  test('the template meaning of "standard" stays', () => {
    const { en } = books();
    assert.match(val(en, 'na_company') || val(en, 'lib_grp_company') || '', /[Ss]tandard/);
  });
  test('the Handbook\'s Playbook chapter carries the name and the pop-up', () => {
    const H = R('js/handbook.js');
    assert.match(H, /'Playbook: the ladder, and who says yes'/);
    assert.match(H, /'Spelbok: stegen, och vem som säger ja'/);
    assert.ok(!/ui:ld_open_paper/.test(H));
    assert.match(H, /\{ui:apn_peek\}/);
  });
  test('Jambo knows the new words for the page', () => {
    assert.match(R('js/copilotacts.js'), /k: 'standards', w: \[[^\]]*'our playbook'/);
    assert.match(R('js/jambomap.js'), /'our playbook', 'edit our playbook'/);
  });
});

describe('f1093 (2) "See it in the paper ›" on departure rows only', () => {
  const V = strip(R('js/views/approvalsview.js'));
  test('EVERY CONTRACT ROW carries it too, a signature and a receipt included (18 Nov 2026, second round)', () => {
    const row = fnBody(V, 'apnRowHtml');
    assert.match(row, /acts\+=apnPeekLinkHtml\('c:'\+c\.id\);\s*return `<tr data-ap-row/);
    const of = fnBody(V, 'apnPeekRowOf');
    assert.match(of, /k\.startsWith\('c:'\)/);
    assert.match(of, /apnQuote\(c\)/);
  });
  test('under the two buttons of a departure, never on a change to the playbook', () => {
    const row = fnBody(V, 'apnPileRowHtml');
    const dep = row.slice(row.indexOf("r.type==='departure'"), row.indexOf('} else {'));
    const std = row.slice(row.indexOf('} else {'));
    assert.match(dep, /apnPeekLinkHtml\(r\.key\)/);
    assert.ok(!/data-apn-peek/.test(std), 'no paper link on a change to a position');
  });
  test('the press opens the pop-up and decides nothing', () => {
    assert.match(V, /if\(b\.hasAttribute\('data-apn-peek'\)\) apnPeekOpen\(/);
    const o = fnBody(V, 'apnPeekOpen') + fnBody(V, 'apnPeekNotes') + fnBody(V, 'apnPeekPages');
    assert.ok(!/persist\(|signCheckAccept|logAudit|api\(/.test(o), 'a look writes nothing');
  });
  test('the Playbook page no longer opens the paper', () => {
    const L = strip(R('js/views/ladder.js'));
    assert.ok(!/data-ld-open/.test(L));
    assert.ok(!/^    ld_open_paper:/m.test(I), 'its words retired in both books');
  });
});

describe('f1093 (3) the pop-up is the Dossier\'s paper and notes', () => {
  const V = strip(R('js/views/approvalsview.js'));
  test('the same paper: redlined where a negotiation stands, else the working copy, read-only', () => {
    const p = fnBody(V, 'apnPeekPaperHtml');
    assert.match(p, /pdRedOk\(c\)/);
    assert.match(p, /redlineDocHtml\(c,\{ side:'owner', readonly:true \}\)/);
    assert.match(p, /docSheetHtml\(c,\{ copy:'work', canvasId:'apn-pk-doc', readOnly:true \}\)/);
  });
  test('ONE WINDOW, TWO PLACES: the Dossier\'s own notes painter draws the pop-up\'s notes (second round, 18 Nov 2026)', () => {
    const n = fnBody(V, 'apnPeekNotes');
    assert.match(n, /pd2NotesPaint\(c,\{ zoom, cv \}\)/);
    assert.ok(!/pd2RedAnswers|pd2RedBlocks|pd2RedGroupHtml|style\.top/.test(n), 'no notes code of its own');
    const P = strip(R('js/paperdesk.js'));
    assert.match(fnBody(P, 'pd2NotesPaint'), /if \(seat\) return pd2SeatPaint\(c, seat, zoom, cv\);/);
    /* the notes list and the sheet layout exist once, read by both */
    assert.match(fnBody(P, 'pd2NotesPaint'), /pd2NotesOnPaper\(c, cv, red\)/);
    assert.match(fnBody(P, 'pd2NotesPaint'), /pd2SheetLay\(zoom\)/);
    const seat = fnBody(P, 'pd2SeatPaint');
    assert.match(seat, /pd2NotesOnPaper\(c, cv, red\)/);
    assert.match(seat, /pd2SheetLay\(zoom\)/);
    assert.match(seat, /pd2GroupsPlace\(/);
    assert.match(seat, /querySelectorAll\('\.pd2-mn-a, \.pd2-rn-chips'\)\.forEach\(n => n\.remove\(\)\)/, 'a look: nothing to press');
    assert.ok(!/_pdTab|pd2WalkOn|pd2FillOn|CSS\.highlights|pd2DialsPaint/.test(seat), 'the Dossier\'s own state is neither asked nor touched');
  });
  test('it lands on the departure\'s words through the one lander, and is big', () => {
    const n = fnBody(V, 'apnPeekNotes');
    assert.match(n, /landOn\(el,/);
    assert.match(fnBody(V, 'apnPeekOpen'), /height:'calc\(100vh - 112px\)'/);
  });
  test('Open the Dossier › closes and opens the contract THROUGH ITS COVER (18 Nov 2026, second round)', () => {
    const d = fnBody(V, 'apnPeekDossier');
    assert.match(d, /closeModal\(\)/);
    assert.match(d, /roomHomeLand\(c\.id,\{ cover:true \}\)/);
    assert.ok(!/cover:false|openRedlineWorkbench/.test(d), 'never past the Cover');
  });
  test('the paper is the Dossier\'s: its wrapper, cut into pages on the desk', () => {
    const p = fnBody(V, 'apnPeekPaperHtml');
    assert.match(p, /class="ig-redpaper nego-onpaper"/);
    assert.match(fnBody(V, 'apnPeekPages'), /pagesWatch\(sheet,\{ mode:'work'/);
    assert.match(fnBody(V, 'apnPeekOpen'), /apnPeekPages\(c\); apnPeekNotes\(c, r\)/);
    assert.match(R('index.html'), /html\.lg-new \.apn-pk-b\{[^}]*background:var\(--desk-ground\)/);
  });
  test('published, and dressed by the Dossier\'s own rules', () => {
    assert.match(R('js/views/approvalsview.js'), /Object\.assign\(window,\{apnLandRow,apnPeekOpen,/);
    const H = R('index.html');
    assert.match(H, /html\.lg-new :is\(#pd2-notes, \.pd2-notes\.is-peek\) \.pd2-mn\{position:absolute/);
    assert.ok(!/#apn-pk-notes/.test(H), 'no copied note styles');
  });
});

describe('f1093 (4) the server\'s sentences moved with their translations', () => {
  test('each sentence the server says is the key its translation is found by', () => {
    const S = R('server/server.js');
    for (const t of ['Only an admin or Legal may change a position.', 'A position needs a name and the words we ask for.', 'That position is no longer there.',
      'A viewer cannot decide on our playbook.', 'An admin always decides on our playbook — the tick cannot be removed from them.']){
      assert.ok(S.includes(`'${t}'`), 'server says: ' + t);
      assert.ok(I.includes(`"${t}":`), 'SRV_MSG knows: ' + t);
    }
    assert.ok(!/may change a standard|decide on our standards\./.test(S.replace(/\/\*[\s\S]*?\*\//g, '')));
  });
});
