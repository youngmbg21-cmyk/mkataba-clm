/* ============================================================
   f310 — THE POP-UP DIET: the words that repeated the controls are gone
   ============================================================
   Owner, 13 Sep 2026, with the send pop-up on screen: "the pop ups have too
   many words which are unnecessary and makes the card overwhelming". Twenty-six
   pop-ups were measured on the real product (2,626 words between them) and a
   proposal was rendered INSIDE the real product for each; the owner approved
   all twenty-six "as shown".

   THE RULE, in the words the artifact used: anything a control already says
   goes; how the machinery works goes (to the hover); one line that tells a
   first-timer what happens next stays; a cost stays, next to the button; what
   the other side sees stays, in one line; a hint arrives when it is needed.

   THE SEND POP-UP is the one that changed shape as well as words: the owner's
   drawing — what travels, then what the round is for, then how it reaches
   them, then who, then the note — with one note box instead of two, the
   warnings folded to a count, and the email-off strip one line.

   Most claims here fail at the parent (the sentences were there; the order was
   the old two-screen order concatenated). The stale-key sweep is the net that
   stops a sentence coming back under its old name.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { buildPortal } = require('./portalworld');
const F = require('./clausefixtures.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CORE = read('js/core.js');
const I18N = read('js/i18n.js');

function contract(over = {}){
  return { id: 'MK-310', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', counterpartyEmail: 'erik@nordfrakt.example',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: F.protoRich(), format: 'rich', ...over };
}
async function negotiated(win){
  const c = contract();
  win.negoInit(c);
  const cl = win.negoClauseList(c).find(x => x.num === '4');
  await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS['4'].text}</p>`,
    { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS['4'].summary });
  return c;
}
/* f307's opener, copied on purpose: the same stage, and a second description
   of how to raise this dialog is the thing this codebase pays for. */
async function openShare(c, opts, tweak){
  const p = buildPortal({ url: 'http://localhost/hati/' });
  const win = p.win;
  win.API_MODE = () => true;
  win.api = async () => ({ ok: true });
  const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
  win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
  win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
  win.persist = () => {}; win.renderAuditSection = () => {};
  win.renderSharesSection = () => {}; win.refreshShareOverview = () => {};
  win.contractShares = async () => [];
  if (tweak) tweak(win);
  await win.openShareModal(c, opts);
  const root = win.document.getElementById('modal-root');
  return { win, root, $: sel => root.querySelector(sel),
    $$: sel => Array.from(root.querySelectorAll(sel)) };
}
/* a before b in document order */
const before = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & 4));

describe('f310 (1) — the send pop-up is laid out as the owner drew it', () => {
  test('what travels, then the purpose, then the channel, then who, then the note, then the checks, then the link settings', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    const order = ['#share-manifest-line', '#share-purpose-wrap', '#share-tabs', '#sh-email', '#sh-summary', '#share-readiness', '#sh-link-opts', '#share-send']
      .map(s => [s, m.$(s)]);
    for (const [s, el] of order) assert.ok(el, s + ' is drawn');
    for (let i = 1; i < order.length; i++)
      assert.ok(before(order[i - 1][1], order[i][1]), `${order[i - 1][0]} comes before ${order[i][0]}`);
  });

  test('ONE note box, under the recipient, and it is the one the send reads', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    const boxes = m.$$('textarea');
    assert.equal(boxes.length, 1, 'two boxes for one sentence were one too many');
    assert.equal(boxes[0].id, 'sh-summary');
    assert.ok(!m.$('#sh-msg'), 'the "Personal message" box is gone');
    assert.match(m.$('#sh-summary-label').textContent, /^Note to Nordfrakt Logistik AB \(optional\)$/);
    const send = strip(CORE.slice(CORE.indexOf('async function openShareModal')));
    assert.match(send, /fval\('sh-summary'\)/, 'the send still reads the one box');
  });

  test('the sentences that repeated the controls are not drawn', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    const text = m.root.textContent.replace(/\s+/g, ' ');
    for (const gone of ['They read, accept, refuse or counter', 'Filled in from the contact',
      'This note is sent in the email', 'They keep one link and always see', 'sees this summary alongside',
      'Recipient name', 'Recipient email', 'What is this link for'])
      assert.ok(!text.includes(gone), 'gone: ' + gone);
    assert.ok(!m.$('#sh-prefill-note'), 'no sentence above the address');
    assert.equal(m.$('#sh-email').getAttribute('data-prefill-src'), 'record',
      'but the SOURCE survives as a fact on the box');
    assert.match(m.$('#share-purpose span').textContent, /What this round is for/);
  });

  test('the purpose row says ONE line under the chosen answer — the promise, not the room', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    const say = m.$('#share-purpose-say');
    assert.equal(say.textContent.trim(), 'They propose changes on their own page. Nothing can be signed on this link.');
    assert.ok(!say.querySelector('b'), 'no title in bold above it');
    m.$('#share-purpose [data-share-purpose="view"]').click();
    assert.equal(say.textContent.trim(), 'They read it and can do nothing else.');
  });

  test('the channel line and the where-it-goes line speak only where they carry something', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    assert.equal(m.$('#sh-ch-note').textContent.trim(), '', 'email: nothing');
    assert.equal(m.$('#sh-msg-where').textContent.trim(), '', 'email: the note goes where the email goes');
    m.$('[data-share-ch="word"]').click();
    assert.match(m.$('#sh-ch-note').textContent, /no page for them|cannot tell you when they open/i, 'a file says its cost');
    m.$('[data-share-ch="link"]').click();
    assert.match(m.$('#sh-msg-where').textContent, /carries no message/i, 'a copied link warns the note will not travel');
  });

  test('the warnings fold to a count; a BLOCK stays open with its tick', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    /* The harness loads classic scripts, so the readiness reading is a global
       the panel builder resolves at the call — which is what lets this claim
       stage both kinds of finding on one contract. */
    const parse = html => { const d = m.win.document.createElement('div'); d.innerHTML = html; return d; };
    m.win.contractReadiness = () => [{ severity: 'warn', label: 'No expiry is recorded.' }, { severity: 'warn', label: 'No effective date is recorded.' }];
    const notes = parse(m.win.readinessPanelHtml(contract(), { fold: true }));
    const sum = notes.querySelector('#share-readiness details > summary');
    assert.ok(sum, 'notes fold');
    assert.match(sum.textContent, /2 things worth checking before you send/);
    assert.ok(!notes.querySelector('#sh-ack'), 'and there is no tick to hide');
    m.win.contractReadiness = () => [{ severity: 'block', label: 'Nobody is named to sign.' }];
    const block = parse(m.win.readinessPanelHtml(contract(), { fold: true }));
    assert.ok(!block.querySelector('details'), 'a block never folds');
    assert.ok(block.querySelector('#sh-ack'), 'it carries the tick that lets the send through, in the open');
    /* and the real dialog is drawn with the fold asked for */
    assert.match(strip(CORE.slice(CORE.indexOf('async function openShareModal'), CORE.indexOf('function reshareNotSentModal'))),
      /readinessPanelHtml\(c, \{ fold:true \}\)/);
  });

  test('email off is one line with the way forward', () => {
    const send = strip(CORE.slice(CORE.indexOf('async function openShareModal'), CORE.indexOf('function reshareNotSentModal')));
    assert.match(send, /id="sh-noemail"[^\n]*co_email_off_line/);
    assert.ok(!/EMAIL_SETUP_LINE/.test(send), 'the four-line version is the mail panel’s, not this dialog’s');
    assert.ok(!/co_press_create_link/.test(send));
    assert.match(I18N, /co_email_off_line: 'Email is not set up on this workspace\. Copy the link and send it yourself, or set up email first\.'/);
  });

  test('the link tick keeps its sentence on the hover, not on the face', async () => {
    const { win } = buildWorld();
    const m = await openShare(await negotiated(win));
    const lab = m.$('#sh-durable').closest('label');
    assert.equal(lab.textContent.replace(/\s+/g, ' ').trim(), 'Keep this link open for the whole negotiation.');
    assert.match(lab.querySelector('[title]').getAttribute('title'), /single-answer link/);
  });
});

describe('f310 (2) — the other twenty-five: the retired sentences are not drawn', () => {
  /* Each entry is a builder file and a key (or literal) that used to be drawn
     on the face and is inert now. The KEY may stay in both books (the rule for
     retiring a key); what may not come back is a CALL that prints it. */
  const GONE = [
    ['js/views/contract.js', "i18t('ct_thats_all')"],
    ['js/views/contract.js', 'A contract another company sent you'],
    ['js/views/contract.js', 'Attach the signed copy to'],
    ['js/views/contract.js', "i18t('ct_change_and_save')"],
    ['js/views/contract.js', "i18t('ct_headings_bold')"],
    ['js/views/contract.js', "i18t('ct_tick_when_typing')"],
    ['js/views/contract.js', "i18t('ct_changed_become_pending')"],
    ['js/views/contract.js', 'Edit the wording below. Each clause you change'],
    ['js/review.js', "_rvE(i18t('rv_who_hint'))"],
    ['js/review.js', "say.textContent = i18t('rv_who_hint')"],
    ['js/review.js', "i18t('rv_entry_title'), i18t('rv_entry_sub')"],
    ['js/desk.js', "i18t('dk_add_hint')"],
    ['js/desk.js', "i18t('dk_ho_you_stay')"],
    ['js/draft.js', "i18t('dr_example')"],
    ['js/views/negotiation.js', "i18t('ng_memo_send_sub'"],
    ['js/playbook.js', "i18t('pb_adds_preferred')"],
    ['js/playbook.js', 'cl.preferred.slice(0,160)'],
    ['js/views/library.js', "i18t('lib_bring_standard_paper')"],
    ['js/views/library.js', "i18t('lib_so_you_can_send')"],
    ['js/views/library.js', "i18t('tf_our_party_hint')"],
    ['js/views/library.js', 'Fill in the blanks. Everything you type'],
    ['js/views/library.js', 'For high-volume, low-variation paper'],
    /* ---- THE RENEWAL CARD, 17 Sep 2026 (Young: "the comments should be at a
       minimum") ---- The diet applied to a CARD rather than a pop-up: the two
       sentences that explained the machinery, and the one that described what
       the button beside them does, are hovers now. The keys stay in both books;
       a CALL that prints them again is what this fails on. */
    ['js/ai.js', "i18t('rn_not_asked'))}</p>"],
    ['js/ai.js', "i18t('rn_fix_terms'"],
    ['js/ai.js', "i18t('rn_no_notice_fix'"],
    ['js/templatefields.js', 'Everything here is filed as contract data'],
    ['js/templatefields.js', '→ ${esc(f.hint)}'],
    ['js/wizard.js', '→ so you can send it to them'],
    ['js/views/intake.js', "i18t('ik_ask_sub')"],
    ['js/approvals.js', "i18t('ap_tip_autofill')"],
    ['js/approvals.js', "i18t('ap_signers_execute')"],
    ['js/views/templatelib.js', 'Upload your standard contract as a Word'],
    ['js/views/templatelib.js', 'Starts as a draft only template managers can see'],
    ['js/richpaste.js', 'Typeface, point size and colour'],
    ['js/metadata.js', 'Pattern-matched (no Copilot key)'],
    ['js/family.js', "as part of an existing agreement. The parent's renewal date"],
    ['js/family.js', "i18t('fa_end_unchanged')}. ${i18t("],
    ['js/core.js', "i18t('co_ch_email_note')"],
    ['js/core.js', "i18t('co_personal_message')"],
    ['js/core.js', "i18t('co_recipient_name')"],
    ['js/core.js', "i18t('co_one_link_current')"],
    ['js/core.js', "i18t('co_not_emailed')"],
    ['js/core.js', 'sh-prefill-note'],
  ];
  for (const [file, needle] of GONE){
    test(`${file} no longer draws “${needle.slice(0, 48)}”`, () => {
      assert.ok(!strip(read(file)).includes(needle));
    });
  }

  test('the lines that stayed are the short ones, in BOTH books', () => {
    const both = (k, en) => {
      const rows = I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || [];
      assert.equal(rows.length, 2, k + ' in English and Swedish');
      if (en) assert.ok(I18N.includes(`${k}: '${en}'`) || I18N.includes(`${k}: "${en}"`), k + ' says: ' + en);
    };
    both('rv_modal_sub', 'They clear or hold each change and hand it back. Nothing reaches the counterparty meanwhile.');
    both('fa_create_sub', 'Filed against {ref} — same parties, same letterhead.');
    both('fa_end_q', 'New end date (optional)');
    both('fa_skeleton_hint', 'Untick for a blank page.');
    both('fa_link_parent_sub');
    both('dk_sheet_sub', 'The lead decides what reaches the counterparty; contributors redline alongside.');
    both('dk_no_contributors', 'Nobody else yet.');
    both('dk_cp_knows', '{cp} sees one name: {who}.');
    both('dk_ho_sub', 'The new lead takes every decision from here; you stay on as a contributor.');
    both('dk_tell_them_sub', 'Otherwise they would simply see a new name.');
    both('rv_entry_desk_sub', 'Colleagues who redline alongside you.');
    both('dr_lead', 'Copilot picks the template that fits and fills in what you say. Nothing is created until you press Create.');
    both('ng_memo_send_privacy', 'Nothing is written to the contract.');
    both('ob_tick_to_add', 'Tick the ones to add. Nothing is saved until you confirm.');
    both('ct_paper_sig_line', 'Recorded as executed outside HaTi — no electronic signature is taken.');
    both('ct_plain_text_warn', 'Saving here converts the document to plain text — headings, bold and tables are lost.');
    both('ct_filed_in_their_name', 'Filed as a round in their name, for your decision.');
    both('ct_each_clause_own_change', 'Each clause you change becomes its own change for them to accept or reject.');
    both('co_upload_word_tail', 'they sent back.');
    both('lib_bulk_line', 'Download the sheet, fill one row per contract, upload it back. Up to {n} rows.');
    both('tl_convert_line'); both('tl_new_standard_line');
    both('ap_route_line', 'Signers sign in this order. The other side’s links open once every internal signature is in.');
    both('me_low_confidence', 'Low-confidence');
    both('set_grant_streams', 'Admins always keep full access.');
    both('pb_read_wording', 'Read the wording');
    both('ap_restart_keeps_wording', 'the wording and the history are untouched');
    both('ct_upload_hint', 'PDF, Word or a photo — or click to choose · up to {max}');
    both('ik_f_who', 'Who is it with? (optional)');
    both('tf_skip_later', 'You can skip this and fill it in later.');
    for (const k of ['co_what_round_for', 'co_purpose_negotiate_line', 'co_purpose_sign_line', 'co_purpose_view_line',
      'co_no_changes_yet_short', 'co_note_to', 'co_note_with_record', 'co_worth_checking_n_one', 'co_worth_checking_n_other',
      'co_name', 'co_email_req', 'co_email_off_line', 'co_keep_link_open_tip']) both(k);
  });

  test('the .doc refusal still arrives when it is needed — the hint left the drop zone, not the product', () => {
    const src = read('js/views/contract.js');
    assert.match(src, /const WORD_REFUSAL = /, 'the refusal for a legacy .doc is spoken at the drop');
    assert.ok(!/legacy \.doc must be re-saved first/.test(I18N.split('\n').find(l => /ct_upload_hint:/.test(l))));
  });

  test('the clause picker keeps the wording behind a press, not on the face', () => {
    const src = strip(read('js/playbook.js'));
    assert.match(src, /<details class="mt-1"><summary[^>]*>\$\{i18t\('pb_read_wording'\)\}<\/summary>/);
    assert.match(src, /_pbEsc\(cl\.preferred\)/, 'and the whole wording is there when it opens');
  });
});

describe('f310 (5) — the renewal card is one row of buttons and three short lines', () => {
  /* Young, 17 September 2026, over a picture of the card: *"the buttons should
     be on the same line but also, the comments should be at a minimum"*. The
     SHAPE is measured in a browser; what is pinned here is that the machinery
     went to `title` rather than being deleted, and that the row is built once. */
  const AI = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '..', 'js/ai.js'), 'utf8');
  test('the three answers and the two acts are built into ONE row', () => {
    assert.ok(/\$\{settled\?'':decideRow\}/.test(AI),
      'the decision buttons are placed by the acts row, not by a row of their own');
    assert.ok(!/decideRow=asking\?`\s*\n\s*<div style="height:1px/.test(AI),
      'and the divider above them is gone');
    assert.ok(!/\$\{decideRow\}\s*\n\s*`\}/.test(AI),
      'decideRow is no longer emitted inside the reading block');
  });
  test('the label survives, inline, because Renew beside Start the renewal is ambiguous', () => {
    assert.ok(/rn_what_decided/.test(AI), 'the question is still asked');
    assert.ok(/<span[^>]*>\$\{i18t\('rn_what_decided'\)\}<\/span>/.test(AI),
      'as a span on the row, never a block above it');
  });
  test('what was cut went to a hover, it was not thrown away', () => {
    assert.ok(/title="\$\{_aiEsc\(srcWhy\)\}"/.test(AI), 'the notice-period machinery');
    assert.ok(/data-rn-ask title="\$\{_aiEsc\(i18t\('rn_not_asked'\)\)\}"/.test(AI),
      'what Copilot would weigh up is on the button that does it');
    assert.ok(/rn_to_none_why/.test(AI), 'and why the administrators are the ones told');
  });
  test('an absence is still STATED on the face, never only on a hover', () => {
    /* The one sentence this card may never drop: without it the expiry is
       silently shown as the deadline, which is the fault it was built for. */
    assert.ok(/i18t\('rn_no_notice',\{expiry:when\(w\.expiry\)\}\)/.test(AI),
      'no notice period recorded is drawn, not hidden');
  });
});
