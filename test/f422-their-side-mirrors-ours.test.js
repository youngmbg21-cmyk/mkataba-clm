/* f422 — THEIR SIDE MIRRORS OURS, THEIR SIGNING PAGE IS OUR SIGNING TAB, AND
   HaTi CHECKS SPELLING ITSELF (Young picked them 28 Sep 2026: "implement mirror
   and signing copy plus option 2")

   (1)  js/spell.js — a reading of the NEW words only, against HaTi's own list;
        the contract's own words, the parties, names and legal words pass; a
        text not in English stands down; null (not checked) before the list is
        here; a suggestion goes in as whole words, in text only.
   (2)  the list is ours to serve: vendor/en-words-1.txt, fetched on first use.
   (3)  their change column draws OUR row: flat, in the same piles, no boxed
        card and no Open; an answer held on their page has its own pile, and
        "With …" names the sender.
   (4)  the clause editor opens for them, with no Copilot on it anywhere.
   (5)  the paper's chip says whose ASK it is ("your ask"), never "move".
   (6)  their clause panel no longer tells them to use Copilot.
   (7)  their head is the room head's shape: the state word from the plain
        lifecycle table, "from <sender>", and the key on the control row.
   (8)  their signing page: no bands, the four stages, who has signed and never
        our route, a Sign button naming the signer, and the pad's intent line.
   (9)  every new word is in both books.
   Red at the parent (2a034b9): every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

const WORDS = path.join(__dirname, '..', 'vendor', 'en-words-1.txt');
const I18N = R('js/i18n.js');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;

/* ---------------------------------------------------------------- (1)(2) */
test('f422 (1) the spell check reads only the new words, and says when it has not checked', () => {
  const S = require('../js/spell.js');
  assert.equal(S.spellSuspects('a', 'a b'), null, 'no list yet: null, never "nothing found"');
  assert.ok(S.spellLoadFrom(fs.readFileSync(WORDS, 'utf8')) > 100000);
  const before = 'This Agreement is governed by the laws of Kenya.';
  const c = { redlineText: '<p>The Provider shall deliver the Goods to Nordfrakt Logistik AB.</p>',
    counterparty: 'Nordfrakt Logistik AB', party: 'Wanjiru Catering Ltd', name: 'Supply' };
  const sus = S.spellSuspects(before,
    before + ' The courts of Nairobi have exclusve jurisdicton over the Nordfrakt counterparty.', c);
  assert.deepEqual(sus.map(s => s.word), ['exclusve', 'jurisdicton'],
    'only the two slips: a name mid-sentence, a legal word and the contract\'s own words pass');
  assert.deepEqual(sus.find(s => s.word === 'jurisdicton').suggestions.slice(0, 1), ['jurisdiction']);
  assert.deepEqual(S.spellSuspects('Kenya exclusve', 'Kenya exclusve', c), [], 'a word already there is not the reader\'s');
  assert.equal(S.spellSuggest('Jurisdicton')[0], 'Jurisdiction', 'the reader\'s capital comes back');
  const sv = 'Leverantören ska tillhandahålla lagerhållning och distribution enligt detta avtal. Betalning ska ske inom trettio dagar från fakturadatum. Parterna ska hålla all information konfidentiell under avtalstiden och fem år därefter.';
  assert.deepEqual(S.spellSuspects('', sv + ' Avtalet regleras av svensk lag.', {}), [], 'not English: it stands down');
  assert.equal(S.spellFixHtml('<a title="jurisdicton">Jurisdicton</a> jurisdicton', 'jurisdicton', 'jurisdiction'),
    '<a title="jurisdicton">Jurisdiction</a> jurisdiction', 'text only, whole words, the case kept');
  assert.equal(S.spellPlain('<p>Kenya.</p><p>The <b>juris</b>diction&nbsp;x</p>'), ' Kenya.  The jurisdiction x ');
  assert.match(S.spellListHtml([{ word: 'exclusve', suggestions: ['exclusive'] }]),
    /data-sp-fix="exclusve" data-sp-to="exclusive"[\s\S]*data-sp-leave="exclusve"/);
});

test('f422 (2) the word list is ours to serve, and is fetched only on first use', () => {
  const S = require('../js/spell.js');
  assert.equal(S.SPELL_WORDS_SRC, 'vendor/en-words-1.txt');
  assert.ok(fs.existsSync(WORDS));
  assert.match(R('vendor/README.md'), /en-words-1\.txt/, 'where it came from is written down');
  const SRC = R('js/spell.js');
  assert.ok(!/\bapi\(|\/api\//.test(SRC.replace(/\/\*[\s\S]*?\*\//g, '')), 'no route');
  assert.match(R('js/app.js'), /import '\.\/spell\.js';/);
  /* both doors ask at their Save, and only wait where waiting buys a check */
  assert.match(R('js/views/clauseeditor.js'), /case 'save': cePullText\(\); ceSaveChecked\(\); break;/);
  assert.match(R('js/views/negotiation.js'), /addEventListener\('click', ev => \{ ev\.stopPropagation\(\); fileChecked\(\); \}\)/);
});

/* ------------------------------------------------------------------ the stage */
function theirPage(extraOwnerAsk){
  const p = buildPortal();
  const { win } = p;
  const c = win.migrateContract ? win.migrateContract(supplyContract()) : supplyContract();
  win.negoInit(c);
  const cl = win.negoClauseList(c);
  const pay = cl.find(x => /PAYMENT/i.test(x.headingText || ''));
  return { p, win, c, cl, pay };
}

/* ---------------------------------------------------------------- (3) */
test('f422 (3) their column draws our flat row in our piles, with no Open', async () => {
  const { p, win, c, pay } = theirPage();
  await win.negoEditClause(c, pay.clauseId, '<ol start="3"><li>Payment shall be made within sixty (60) days of a valid invoice.</li></ol>',
    { side: 'owner', author: 'Wanjiru Kamau' });
  p.open(sharePayloadFor(p, c, {}, { purpose: 'negotiate' }));
  const col = win.document.getElementById('rl-changes-col');
  assert.ok(col, 'the workbench mounted');
  const rows = [...col.querySelectorAll('.rl-card')];
  assert.ok(rows.length >= 1);
  assert.ok(rows.every(r => r.classList.contains('rl-card-d')), 'every row is the flat row');
  assert.equal(col.querySelectorAll('.rl-open-btn, .rl-receipt').length, 0, 'no boxed card, no Open');
  assert.ok(col.querySelector('[data-rl-band="awaiting"]'), 'the piles are drawn');
  const face = rows[0].querySelector('.rl-card-face');
  assert.deepEqual([...face.querySelectorAll('button')].map(b => b.textContent.trim()).slice(0, 3),
    ['Accept', 'Reject', 'Counter'], 'our ask on their seat: Accept · Reject · Counter');
  /* a decision pressed and held is answered-not-sent */
  await p.pressSel('#rl-changes-col [data-nego-accept]');
  const col2 = win.document.getElementById('rl-changes-col');
  assert.ok(col2.querySelector('[data-rl-band="answered"]'), 'a held answer has its own pile');
  const NEG = R('js/views/negotiation.js');
  assert.match(NEG, /const RL_CARD_BANDS = \['refused', 'awaiting', 'answered', 'drafts'/);
  assert.match(NEG, /i18t\(side === 'counterparty' \? 'ng_band_with_named' : 'ng_band_with', \{ who: otherSide \}\)/);
  assert.match(NEG, /return \{ c, side, previewSeat, unsent, banded: true \};/);
});

/* ---------------------------------------------------------------- (4) */
test('f422 (4) the clause editor opens for them, with no Copilot on it', async () => {
  const { win, c, pay } = theirPage();
  assert.equal(win.rlEditorTakesIt('counterparty', {}), true, 'their seat is taken to the editor');
  assert.equal(win.rlEditorTakesIt('counterparty', { preview: true }), false, 'our preview of it is not a chair');
  assert.equal(win.clauseEditorRefusal(c, { side: 'counterparty' }), null, 'no refusal for their seat');
  win.PORTAL_MODE = true;
  const ok = win.rlOpenClauseEditor(c, pay.clauseId, { side: 'counterparty', persist: false, again(){}, by: 'Erik Lindqvist' });
  assert.equal(ok, true);
  const page = win.document.getElementById('clause-editor');
  assert.ok(page, 'the page is up');
  assert.equal(page.querySelector('#ce-ask'), null, 'no ask box');
  assert.equal(page.querySelector('.ce-disc'), null, 'no Copilot disclaimer');
  assert.equal(page.querySelector('[data-ce-tab="chat"]'), null, 'no conversation tab');
  assert.equal(page.querySelector('[data-ce-tab="scan"]'), null, 'no Playbook scan');
  assert.ok(page.querySelector('[data-ce-tab="ladder"]'), 'the Ladder is their rail');
  assert.ok(!/Copilot/.test(page.querySelector('.ce-rail').textContent), 'the rail never names Copilot');
  win.rlCloseClauseEditor();
  const CE = R('js/views/clauseeditor.js');
  assert.match(CE, /async function ceAsk\(question, opts = \{\}\)\{\n[\s\S]{0,200}if \(ceNoAi\(\)\) return;/, 'the wall, not only the sign');
  assert.match(CE, /async function ceRunScan\(\)\{\n  if \(ceNoAi\(\)\) return;/);
  assert.match(CE, /const o = \{ side: ceSide\(\), author:/, 'it files under their own side');
  assert.match(CE, /if \(ceSide\(\) === 'owner' && window\.clauseLockTake/, 'their seat takes no lock');
});

/* ---------------------------------------------------------------- (5)(6) */
test('f422 (5) the paper says whose ASK it is, and (6) their panel never names Copilot', () => {
  assert.match(I18N, /\n    ng_rung_your_move: 'your ask',\n    ng_rung_their_move: 'their ask',/);
  assert.match(I18N, /\n    ng_rung_your_move: 'ditt förslag',\n    ng_rung_their_move: 'deras förslag',/);
  assert.match(R('js/views/negotiation.js'),
    /\$\{opts\.noAi \? '' : `<p class="rl-cp-note rl-cp-hint">\$\{i18t\('ng_cp_sel_hint'\)\}<\/p>`\}/);
});

/* ---------------------------------------------------------------- (7) */
test('f422 (7) their head is the room head: the plain state word, "from" the sender, the key on the control row', () => {
  const { p, win, c } = theirPage();
  p.open(sharePayloadFor(p, c, {}, { purpose: 'negotiate' }));
  const head = win.document.querySelector('.pw-id');
  assert.ok(head.querySelector('.pw-id-titlerow .pw-id-stat'), 'the state word beside the title');
  assert.match(head.querySelector('.pw-id-sub').textContent, /from Wanjiru Catering Ltd/);
  assert.ok(head.querySelector('.pw-id-row2 .rl-ctl-legend'), 'the key on the control row');
  assert.equal(win.document.querySelector('#rl-changes-col .rl-legend'), null, 'and not in the column head');
  const PT = R('js/views/portal.js');
  const fn = /function portalStatusWordHtml\(c\)\{[\s\S]*?\n\}/.exec(PT)[0];
  assert.match(fn, /STATUS_META\[c\.status\]/);
  assert.ok(!/contractStatusTextHtml\(/.test(fn), 'never the overlays: a hold, our reading of them');
});

/* ---------------------------------------------------------------- (8) */
test('f422 (8) their signing page: no bands, four stages, who has signed, and the intent line', async () => {
  const { p, win, c, pay } = theirPage();
  await win.negoEditClause(c, pay.clauseId, '<ol start="3"><li>Payment shall be made within sixty (60) days of a valid invoice.</li></ol>',
    { side: 'owner', author: 'Wanjiru Kamau' });
  win.negoChanges(c).forEach(ch => { ch.status = 'accepted'; });
  c.signatures = [{ party: 'first', name: 'Wanjiru Kamau', title: 'Director', email: 'wk@wanjiru.co.ke', at: '2026-09-27T11:02:00.000Z' }];
  const payload = sharePayloadFor(p, c, {}, { purpose: 'sign' });
  payload.purpose = 'sign'; payload.purposeChosen = 'sign';
  p.open(payload, { purpose: 'sign', share: { recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordkust.se' } });
  const d = win.document;
  assert.equal(d.getElementById('pt-agreed'), null, 'the green band is gone');
  assert.equal(d.getElementById('pt-history'), null, 'the history band is gone');
  assert.equal(d.querySelectorAll('.ps-stages > .ps-stage').length, 4, 'the four stages');
  assert.ok(d.querySelector('.ps-stages #pt-nego-open'), 'What changed lives in the first stage');
  const people = d.querySelectorAll('.ps-stage')[2].textContent;
  assert.match(people, /Wanjiru Kamau/);
  assert.match(people, /Your turn/);
  assert.ok(!/wk@wanjiru/.test(d.getElementById('share-root').innerHTML), 'our signer\'s address never travels to their page');
  assert.match(d.getElementById('pt-sign-word').textContent, /^Sign as Erik Lindqvist$/, 'the button names the signer');
  let asked = null;
  win.openSignaturePad = async o => { asked = o; return null; };
  p.setValue('pt-email', 'erik@nordkust.se');
  await p.click('pt-sign');
  assert.ok(asked && asked.intent === true, 'the pad opens with the intent line');
});

/* ---------------------------------------------------------------- (9) */
test('f422 (9) every new word is in both books', () => {
  for (const k of ['spl_head_n_one', 'spl_head_n_other', 'spl_use_title', 'spl_no_suggestion', 'spl_leave',
    'spl_save_as_written', 'spl_not_checked', 'ce_step_spelling', 'ng_band_answered', 'ng_band_with_named',
    'ng_edit_clause_title', 'po_from_org', 'po_before_you_sign', 'po_signed_head', 'po_stage_wording',
    'po_stage_wording_none', 'po_stage_wording_open_one', 'po_stage_wording_open_other', 'po_stage_wording_n_one',
    'po_stage_wording_n_other', 'po_stage_adopted', 'po_stage_not_taken', 'po_stage_read', 'po_stage_read_line', 'po_stage_people', 'po_stage_signed_at',
    'po_stage_none_yet', 'po_stage_you', 'po_stage_your_turn', 'po_stage_sign', 'po_sign_as', 'po_code_first'])
    assert.ok(inBoth(k), k);
});
