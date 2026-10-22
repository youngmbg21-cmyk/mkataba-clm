/* f866 — THE FIRST-TIMER ROUNDS (owner, 22 Oct 2026: "Yes to both asks", then
   the picks: On the card · One question · Who pays whom · He speaks · Four
   doors; the twelve "Use when" lines as written; the stream still asked; the
   verbs kept).
     (1) a "no" that helps: a read-only account is told what is true, who lifts
         it, and carries the one Ask an admin record — on Jambo's two cards and
         at every other door that refused to start a contract.
     (2) the right template: word stems and everyday words; what a card shares;
         one deciding question for papers easily confused; "Use when" lines.
     (3) a form in plain words: Who pays whom? as three presses, the meaning
         said under them, ONE builder for both forms; the other company named.
     (4) Jambo speaks first on a draft: once, nothing stored, off the one
         reading of what is owed; the empty Redlines column says what is true.
     (5) answering their changes: a plain reason where no rule is written, Ask
         a colleague on their row, Accept says it has not gone yet, Counter on
         a number names the two figures.
     (6) both books carry every new word.
   Red at the parent: none of these names exist there. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
/* a top-level declaration, whole: a function to its closing brace at column 0, a const to its first ';\n' */
const decl = (src, name) => {
  const m = new RegExp('^(?:async )?(?:function ' + name + '\\(|const ' + name + ' =)', 'm').exec(src);
  assert.ok(m, name + ' is declared');
  const i = m.index;
  const end = src.slice(i, i + 3).startsWith('con') ? src.indexOf(';\n', i) + 2 : src.indexOf('\n}', i) + 2;
  return src.slice(i, end);
};
const CA = read('js/copilotacts.js'), WZ = read('js/wizard.js'), TF = read('js/templatefields.js'), TR = read('js/triage.js');
const NG = read('js/views/negotiation.js'), LIB = read('js/views/library.js'), I18N = read('js/i18n.js'), CE = read('js/views/clauseeditor.js');
/* the two books: English first, Swedish after its own marker */
const svAt = I18N.indexOf("ca_dr_title: 'Skriv ett nytt avtal'");
const EN = I18N.slice(0, svAt), SV = I18N.slice(svAt);
const word = (book, k) => { const m = new RegExp('\\n\\s+' + k + ": (['\"])(.*?)\\1,\\n").exec(book); return m ? m[2] : null; };
const T = { ca_wall_head: 'You can read contracts but not start one yet.',
  ca_wall_body: '{who}, your admin, can change it.', ca_wall_body_any: 'An admin can change it.',
  ca_wall_ask: 'Ask {name} to let me draft', ca_wall_ask_any: 'Ask an admin to let me draft', ca_wall_an_admin: 'an admin',
  ca_wall_asked: 'Asked {who} · {when} · waits', ca_wall_what: 'Please make me an Editor.' };
const t = (k, v) => String(T[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : '');

describe('f866 (1) a "no" that helps', () => {
  const stage = (users, asked) => {
    const ctx = { window: {}, document: undefined, _caT: t, _caE: s => String(s), getUsers: () => users, todayISO: () => '2026-10-22', langLocale: () => 'en-GB' };
    ctx.window.stAskOpenOn = () => asked || null;
    vm.createContext(ctx);
    vm.runInContext(['DRAFT_WALL_PANEL', 'draftWallAdmins', 'draftWallAsked', 'draftWallSay', 'draftWallWhen', 'draftWallWhyHtml', 'draftWallActHtml'].map(n => decl(CA, n)).join('\n')
      + ';this.say=draftWallSay;this.why=draftWallWhyHtml;this.act=draftWallActHtml;this.P=DRAFT_WALL_PANEL;', ctx);
    return ctx;
  };
  test('1a one admin is named, by first name on the button; several or none, "an admin"', () => {
    const one = stage([{ id: 'u1', role: 'admin', name: 'Grace Njeri' }, { id: 'u2', role: 'legal', name: 'Peter' }]).say();
    assert.equal(one.ask, 'Ask Grace to let me draft');
    assert.match(one.body, /^Grace Njeri, your admin/);
    const many = stage([{ role: 'admin', name: 'A B' }, { role: 'admin', name: 'C D' }]).say();
    assert.equal(many.ask, 'Ask an admin to let me draft');
    assert.equal(many.body, 'An admin can change it.');
  });
  test('1b the card: the reason in bold, then the ask as the one filled button; once asked, where it waits', () => {
    const x = stage([{ role: 'admin', name: 'Grace Njeri' }]);
    assert.match(x.why(), /<p class="ca-why ca-wall"><b>You can read contracts but not start one yet\.<\/b>/);
    assert.match(x.act(), /<button[^>]*ui-btn-primary[^>]*data-ca-wall-ask>Ask Grace to let me draft<\/button>/);
    const y = stage([{ role: 'admin', name: 'Grace Njeri' }], { status: 'open', panel: 'me:role', createdAt: '2026-10-22T09:42:00Z' });
    assert.match(y.act(), /<span class="ca-wall-asked" data-ca-wall-act>Asked Grace Njeri · \d\d:\d\d · waits<\/span>/);
    assert.equal(x.P, 'me:role', 'the ask is about the person\'s role — the admin\'s drawer opens their person');
  });
  test('1c the press is the existing Ask an admin record (stAskDirect), and the toast door carries the same press', () => {
    const src = strip(decl(CA, 'draftWallSend'));
    assert.match(src, /window\.stAskDirect\(DRAFT_WALL_PANEL, _caT\('ca_wall_what'\), ''\)/);
    assert.match(strip(decl(CA, 'draftWallToast')), /action: \{ label: W\.ask, onClick\(\)\{ draftWallSend\(\); \} \}/);
  });
  test('1d both Jambo cards draw the reason and the ask; no door refuses with the bare sentence any more', () => {
    const S = strip(CA);
    assert.ok((S.match(/draftWallWhyHtml\(\)/g) || []).length >= 2, 'both draft cards');
    assert.ok((S.match(/draftWallActHtml\(\)/g) || []).length >= 2);
    for (const f of ['js/wizard.js', 'js/draft.js', 'js/views/library.js', 'js/views/intake.js', 'js/app.js', 'js/paperdesk.js', 'js/copilotacts.js'])
      assert.doesNotMatch(strip(read(f)), /toast\((?:i18t|_pdT|_caT)\('(?:wz_viewers_no_create|lib_viewers_no_create|ap_viewers_no_create|ct_viewers_no_add)'\)/, f);
    assert.match(strip(read('js/views/contract.js')), /function openUploadModal\(\)\{\n  if\(!canEdit\(\)\)\{ draftWallToast\(\); return; \}/);
  });
});

describe('f866 (2) the right template', () => {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(['caDraftWords', 'caDraftScore', 'caDraftMatched', 'caDraftShared', 'CA_DRAFT_PAIRS', 'caDraftPairOf'].map(n => decl(CA, n)).join('\n')
    + ';this.W=caDraftWords;this.S=caDraftScore;this.M=caDraftMatched;this.SH=caDraftShared;this.P=caDraftPairOf;', ctx);
  const q = 'draft a warehouse partnership agreement with Kilifi Haulage';
  const WH = { name: 'Warehousing', blurb: '3PL storage and temperature-controlled space.' };
  const FF = { name: 'Distribution Logistics', blurb: 'Primary and last-mile distribution.' };
  const RM = { name: 'Raw Material Supply', blurb: 'Commodity & ingredient supply into the plants.' };
  test('2a a word is read by its stem and its everyday family: warehouse finds Warehousing, haulage finds Logistics', () => {
    assert.ok(ctx.S(q, WH) > 0); assert.ok(ctx.S(q, FF) > 0); assert.equal(ctx.S(q, RM), 0);
    assert.deepEqual(Array.from(ctx.M(q, WH)), ['warehouse']);
    assert.deepEqual(Array.from(ctx.M(q, FF)), ['haulage']);
    assert.ok(ctx.S('we need trucks to deliver to our depots', FF) > 0);
    assert.ok(ctx.S('hyra en forklift', { name: 'Equipment Lease', blurb: 'Plant machinery lease and servicing.' }) > 0);
  });
  test('2b the old readings still hold: "agreement" counts for nothing; an NDA ask still finds the NDA', () => {
    assert.equal(ctx.S('a lease for the depot', { name: 'NDA', blurb: 'Confidentiality for NPD & vendor onboarding.' }), 0);
    assert.ok(ctx.S('draft an NDA with Volvo', { name: 'NDA', blurb: 'Confidentiality for NPD & vendor onboarding.' }) > 0);
    assert.deepEqual(Array.from(ctx.W('the agreement and the contract')), []);
    assert.deepEqual(Array.from(ctx.SH('Mutual NDA with Naivas', { name: 'NDA', blurb: 'Confidentiality for NPD & vendor onboarding.' })), ['NDA'],
      'a word only its family shares is never quoted as asked for');
  });
  test('2c store and move both among the closest: the one question is asked, its answers name the papers', () => {
    const P = ctx.P([{ kind: 'tid', id: 'RM' }, { kind: 'tid', id: 'WH' }, { kind: 'tid', id: 'FF' }]);
    assert.ok(P); assert.equal(P.q, 'na_dq_store_move');
    assert.deepEqual(JSON.parse(JSON.stringify(P.a)), [['store', 'WH'], ['move', 'FF'], ['both', 'WH']]);
    assert.equal(ctx.P([{ kind: 'tid', id: 'WH' }, { kind: 'tid', id: 'RM' }]), null, 'one of the two alone asks nothing');
  });
  test('2d the sheet: "Use when" on every card, what it shares, the question, the answer moves and marks — nothing picked', () => {
    const S = strip(WZ);
    assert.match(S, /function naUseWhen\(r\)\{[\s\S]*?'tpl_use_'\+r\.id/);
    assert.match(S, /<span class="na-use">\$\{esc\(use\)\}<\/span>/);
    assert.match(S, /i18t\('na_shares',\{ w:/);
    assert.match(S, /\$\{dqHtml\(\)\}<div class="na-closest" id="na-closest"/);
    assert.match(S, /data-na-dq="\$\{esc\(k\)\}" aria-pressed="\$\{dqAns===k\}"/);
    assert.match(S, /const q=e\.target\.closest\('\[data-na-dq\]'\);[\s\S]*?box\.innerHTML=closestHtml\(\); light\(\);/);
    assert.doesNotMatch(S.slice(S.indexOf("const q=e.target.closest('[data-na-dq]')"), S.indexOf("const q=e.target.closest('[data-na-dq]')") + 400), /pick\(/, 'an answer picks nothing');
    assert.match(S, /i18t\(naNoTeam\(\)\?'na_ask_admin_choose':'na_ask_legal'\)/);
  });
  test('2e the twelve "Use when" lines, as the owner approved them, in both books', () => {
    for (const id of ['RM', 'PK', 'CM', 'EQ', 'WH', 'FF', 'DA', 'RL', 'MK', 'ND', 'LE', 'PS']){
      assert.match(word(EN, 'tpl_use_' + id) || '', /^Use when /, id);
      assert.match(word(SV, 'tpl_use_' + id) || '', /^Används när /, id);
    }
    assert.equal(word(EN, 'tpl_use_WH'), 'Use when another company keeps our goods in their store, chilled or not.');
  });
});

describe('f866 (3) a form in plain words', () => {
  const stage = () => {
    const ctx = { window: {}, i18t: k => ({ tf_pw_say_customer: 'So we are the customer.', tf_pw_say_supplier: 'So we are the supplier.', tf_pw_say_none: 'No side.', tf_pw_we_pay: 'We pay them', tf_pw_they_pay: 'They pay us', tf_pw_no_money: 'No money', tf_our_side: 'Who pays whom?' })[k] || k };
    vm.createContext(ctx);
    vm.runInContext(['PAY_WHO', 'payWhoSay', 'payWhoHtml'].map(n => decl(TF, n)).join('\n') + ';this.H=payWhoHtml;', ctx);
    return ctx;
  };
  test('3a three presses; the answer box keeps the field\'s own id and value; its meaning said under it', () => {
    const h = stage().H('wz-side', 'customer');
    assert.match(h, /data-pw-v="customer" aria-checked="true">We pay them<\/button>/);
    assert.match(h, /data-pw-v="supplier" aria-checked="false">They pay us<\/button>/);
    assert.match(h, /data-pw-v="none" aria-checked="false">No money<\/button>/);
    assert.match(h, /<input id="wz-side" type="text" hidden value="customer" data-pw-input>/);
    assert.match(h, /data-pw-say>So we are the customer\.<\/span>/);
    const e = stage().H('tf-side', '');
    assert.match(e, /value="" data-pw-input>/); assert.match(e, /data-pw-say><\/span>/, 'unanswered says nothing');
  });
  test('3b ONE builder for both forms; "No money" writes nothing; the stored values are unchanged', () => {
    assert.match(strip(WZ), /if\(v\.key==='side' && v\.maps==='category' && typeof payWhoHtml==='function'\) return/);
    assert.match(strip(LIB), /payWhoHtml\('tf-side', sideF\.def\|\|''\)/);
    assert.match(strip(decl(TF, 'payWhoSet')), /box\.value = \(k === 'customer' \|\| k === 'supplier'\) \? k : '';/);
    assert.match(TF, /\{ v:'customer', l:i18t\('tf_side_customer'\) \}/, 'the field keeps its values');
  });
  test('3c the words: "Who pays whom?" and "The other company", with where its name is found', () => {
    assert.equal(word(EN, 'tf_our_side'), 'Who pays whom?');
    assert.equal(word(EN, 'tf_cp_other'), 'The other company');
    assert.equal(word(EN, 'tf_cp_other_help'), 'As on their invoices or letterhead');
    assert.match(strip(WZ), /const cp=v\.key==='counterparty'&&v\.maps==='counterparty';/);
  });
});

describe('f866 (4) Jambo speaks first on a draft', () => {
  const stage = (owed) => {
    const ctx = { window: {}, _frT: (k, v) => k + (v ? ' ' + JSON.stringify(v) : ''), _frE: s => String(s), isUpload: c => !!c.upload,
      detailsOf: () => ({ items: owed.map(([key, label]) => ({ key, label, open: true })).concat([{ key: 'party', label: 'Our party', open: false }]) }),
      TEMPLATES: { WH: { name: 'Warehousing & Cold-Chain Agreement' } }, langLocale: () => 'en-GB' };
    vm.createContext(ctx);
    vm.runInContext(['_frDraftOwed', 'firstDraftOwe', 'firstDraftOwed', 'firstDraftOf', 'firstDraftList', 'firstDraftTurns'].map(n => decl(TR, n)).join('\n')
      + ';this.owe=firstDraftOwe;this.owed=firstDraftOwed;this.turns=firstDraftTurns;', ctx);
    return ctx;
  };
  test('4a owed for a draft from our paper; never an upload, an amendment or a paper past Drafting', () => {
    const x = stage([]);
    assert.equal(x.owe({ id: 'A', status: 'Draft', template: 'WH' }), true); assert.equal(x.owed({ id: 'A' }), true);
    assert.equal(x.owe({ id: 'B', status: 'Draft', upload: true }), false);
    assert.equal(x.owe({ id: 'C', status: 'Draft', parentId: 'A' }), false);
    assert.equal(x.owe({ id: 'D', status: 'Under Review' }), false);
  });
  test('4b two turns: what is still open (the one reading of what is owed), then what comes after; Fill them in leads', () => {
    const x = stage([['value', 'Contract value'], ['site', 'Warehouse / site']]);
    const T2 = x.turns({ id: 'A', status: 'Draft', template: 'WH', counterparty: 'Kilifi Haulage' });
    assert.equal(T2.length, 2);
    assert.match(T2[0].text, /fr_draft_one .*"paper":"Warehousing & Cold-Chain Agreement".*"party":"Kilifi Haulage".*"list":"contract value and warehouse \/ site"/);
    assert.match(T2[1].text, /fr_draft_two/);
    assert.deepEqual(JSON.parse(JSON.stringify(T2[1].choices.map(c => [c.fr, !!c.lead, c.key || '']))), [['fill', true, 'value'], ['dsend', false, '']]);
  });
  test('4c nothing owed: it is complete, and Send leads', () => {
    const T2 = stage([]).turns({ id: 'A', status: 'Draft', template: 'WH', counterparty: 'Kilifi Haulage' });
    assert.match(T2[0].text, /fr_draft_one_whole/); assert.match(T2[1].text, /fr_draft_done/);
    assert.deepEqual(JSON.parse(JSON.stringify(T2[1].choices.map(c => [c.fr, !!c.lead]))), [['dsend', true]]);
  });
  test('4d said once, at the upload\'s own moment and limits; nothing stored; the presses are existing doors', () => {
    const due = strip(decl(TR, 'firstReadDue'));
    assert.match(due, /if \(firstDraftOwed\(c\)\)\{[\s\S]*?pdFaceNow\(\)\) return false;[\s\S]*?pdTab\(\) !== 'copilot'\) return false;[\s\S]*?intel\.busy\) return false;[\s\S]*?_frDraftOwed\.delete\(String\(c\.id\)\)/);
    assert.doesNotMatch(due.slice(due.indexOf('firstDraftOwed(c)'), due.indexOf('if (!t ||')), /persist\(/, 'nothing stored');
    const press = strip(decl(TR, 'firstReadPress'));
    assert.match(press, /ch\.fr === 'fill'\)\{[\s\S]*?pdTalkBack\(\)[\s\S]*?pdFillOpen\(c\.id, \{ key: ch\.key \|\| '' \}\)/);
    assert.match(press, /ch\.fr === 'dsend'\)\{[\s\S]*?openShareModal\(c, \{ purpose: 'negotiate' \}\)/);
    assert.match(strip(decl(TR, 'contractArrived')), /if \(!o\.elsewhere\) try \{ firstDraftOwe\(c\); \}/);
  });
  test('4e the empty Redlines column says what is true for a paper not yet sent, with the one send door; no standards, greyed with why', () => {
    const S = strip(NG);
    assert.match(S, /String\(\(c && c\.status\) \|\| ''\) === 'Draft'/);
    assert.match(S, /i18t\('ng_empty_first', \{ party: who \}\)/);
    assert.match(S, /data-rl-empty-send="\$\{_nea\(c\.id\)\}"/);
    assert.match(S, /window\.openShareModal\(c, \{ purpose: 'negotiate' \}\)/);
    assert.match(S, /none = !!B && Array\.isArray\(B\.standards\) && !B\.standards\.length;/, 'the book\'s own list, read as the object pbStandardsFor answers');
    assert.match(S, /none \? 'ng_prepare_dead_none' : null/);
  });
});

describe('f866 (5) answering their changes', () => {
  const ctx = { window: {}, i18t: (k, v) => k + (v ? ' ' + JSON.stringify(v) : '') };
  vm.createContext(ctx);
  vm.runInContext(['RL_PLAIN_FIG', 'rlPlainFigs', 'rlPlainFigureOf', 'rlPlainReasonOf'].map(n => decl(NG, n)).join('\n') + ';this.F=rlPlainFigureOf;this.R=rlPlainReasonOf;', ctx);
  test('5a a figure that moved is read off the stored wording: 60 days instead of the 30', () => {
    const ch = { oldText: 'Invoices are payable within thirty (30) days of receipt.', newText: 'Invoices are payable within sixty (60) days of receipt.' };
    assert.deepEqual({ ...ctx.F(ch) }, { now: '60 days', was: '30' });
    assert.match(ctx.R(ch), /^rl_plain_figure \{"now":"60 days","was":"30"\}$/);
    assert.deepEqual({ ...ctx.F({ oldText: 'a 5% fee', newText: 'a 7% fee' }) }, { now: '7%', was: '5' });
  });
  test('5b words added are quoted; nothing it can read, nothing said', () => {
    assert.match(ctx.R({ oldText: 'Each party is liable for loss it causes.', newText: "Each party is liable for loss it causes. Liability is limited to one month's fees." }),
      /^rl_plain_added \{"words":"Liability is limited to one month's fees"\}$/);
    assert.equal(ctx.R({ oldText: 'The Supplier shall deliver.', newText: 'The Provider shall deliver promptly.' }), '');
    assert.equal(ctx.F({ oldText: '30 days and 10 days', newText: '60 days and 20 days' }), null, 'two figures moved: no single reading');
  });
  test('5c only where no rule and no past answer decide: "Worth a look", read whole', () => {
    const S = strip(decl(NG, 'rlRowReadHtml'));
    assert.match(S, /const plain = \(j && j\.verdict === 'review'\) \? rlPlainReasonOf\(ch\) : '';/);
    assert.match(S, /\{ key: 'look', tone: 'amber', label: i18t\('rp_v_look'\) \}/);
    assert.match(read('js/views/negotiation-css.js'), /\.rl-card-read\[data-rl-row-read="look"\] \.rl-card-read-w\{display:block;-webkit-line-clamp:unset;overflow:visible\}/);
  });
  test('5d Ask a colleague on a live ask of theirs, our seat only, through the one send screen set to a colleague', () => {
    const S = strip(NG);
    assert.match(S, /out\.push\(acc, rej, relabel\(door, i18t\('ng_counter'\)\)\);\n\s+if \(side !== 'counterparty' && !rlOnTheirPage\(\)\) out\.push\(`<button type="button" class="rl-edit rl-ask-col" data-rl-ask-colleague=/);
    assert.match(strip(decl(NG, 'rlAskColleague')), /window\.openShareModal\(c, \{ purpose: 'colleague', note: i18t\(what \? 'rl_ask_col_note' : 'rl_ask_col_note_bare'/);
  });
  test('5e Accept on an ask of theirs says it has not gone yet and names the row\'s own way back; Counter on a number names the figures', () => {
    const S = strip(NG);
    assert.match(S, /toast\(i18t\('ng_decided_accepted_unsent', \{ what, party: [^}]*undo: i18t\('ng_change_decision'\) \}\), 'ok'\)/);
    assert.match(S, /\.\.\.\(F \? \{ fact: i18t\('rl_counter_fact', F\) \} : \{\}\)/);
    assert.match(strip(CE), /if \(opts && opts\.fact\) _ceThread\.push\(\{ who: 'ai', text: String\(opts\.fact\), read: \[\] \}\);/);
  });
});

describe('f866 (6) both books', () => {
  test('6a every new word is in English and Swedish', () => {
    const keys = ['ca_wall_head', 'ca_wall_body', 'ca_wall_body_any', 'ca_wall_ask', 'ca_wall_ask_any', 'ca_wall_an_admin', 'ca_wall_asked', 'ca_wall_what',
      'na_ask_admin_choose', 'na_shares', 'na_dq_none_called', 'na_dq_store_move', 'na_dq_store_move_none', 'na_dq_store', 'na_dq_move', 'na_dq_both',
      'tf_pw_we_pay', 'tf_pw_they_pay', 'tf_pw_no_money', 'tf_pw_say_customer', 'tf_pw_say_supplier', 'tf_pw_say_none', 'tf_cp_other', 'tf_cp_other_help',
      'fr_draft_one', 'fr_draft_one_whole', 'fr_draft_two', 'fr_draft_done', 'fr_draft_fill', 'fr_draft_send', 'fr_draft_them',
      'ng_prepare_dead_none', 'ng_empty_first', 'ng_empty_send',
      'rp_v_look', 'rl_plain_figure', 'rl_plain_added', 'rl_ask_col', 'rl_ask_col_title', 'rl_ask_col_note', 'rl_ask_col_note_bare', 'rl_counter_fact', 'ng_decided_accepted_unsent'];
    for (const k of keys){ assert.ok(word(EN, k), 'English ' + k); assert.ok(word(SV, k), 'Swedish ' + k); assert.notEqual(word(EN, k), word(SV, k), 'translated ' + k); }
  });
});
