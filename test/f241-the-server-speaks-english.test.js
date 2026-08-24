/* f241 — THE SERVER SPEAKS ONE LANGUAGE, AND THE SCREEN SPEAKS THE READER'S.
 *
 * The functional audit of 23 Aug 2026 found twelve screens still English inside
 * a translated frame. The largest by far: the server answers a refusal with a
 * plain English sentence — 184 distinct ones — and js/api.js turns it into an
 * Error whose message is printed verbatim, half the time GLUED TO A TRANSLATED
 * PREFIX. So a Swedish reader who tried to save a signed contract met
 *
 *     "Det gick inte att spara: This contract has been executed and sealed."
 *
 * A sentence in two languages is worse than an untranslated one: it reads as a
 * rendering fault rather than as a missing translation.
 *
 * WHERE THE FIX GOES IS THE CLAIM THIS FILE PINS. Not the server — a message
 * answers a REQUEST, and a share link carries no account to read a language
 * off. Not each of ~200 call sites. At the ONE place a server sentence becomes
 * an Error, which is api(). One lookup, every caller.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const i18n = read('js/i18n.js');
const apijs = read('js/api.js');
const srv = read('server/server.js');

/* Load the dictionaries the way the parity test does. */
function dicts() {
  const m = i18n.match(/const STRINGS = \{[\s\S]*?\n\};/);
  assert.ok(m, 'STRINGS block found');
  const sandbox = {};
  // eslint-disable-next-line no-new-func
  new Function('g', m[0].replace('const STRINGS =', 'g.STRINGS =') + ';')(sandbox);
  return sandbox.STRINGS;
}
/* The lookup table, read out of the source the same way. */
function tables() {
  const a = i18n.match(/const SRV_MSG = \{[\s\S]*?\n\};/);
  const b = i18n.match(/const SRV_MSG_PREFIX = \[[\s\S]*?\n\];/);
  assert.ok(a && b, 'both tables found');
  const sandbox = {};
  // eslint-disable-next-line no-new-func
  new Function('g', a[0].replace('const SRV_MSG =', 'g.SRV_MSG =') + ';'
    + b[0].replace('const SRV_MSG_PREFIX =', 'g.SRV_MSG_PREFIX =') + ';')(sandbox);
  return sandbox;
}

describe('f241 — the translation happens once, at the one door', () => {
  test('api() runs every server sentence through srvMsg', () => {
    assert.match(apijs, /srvMsg/, 'js/api.js knows about the lookup');
    assert.match(apijs, /new Error\(_sm\(data\?\.error\)/,
      'the Error a caller receives carries the translated sentence');
    assert.match(apijs, /toast\(_sm\(data\.error\)/,
      'and the 429 that api() surfaces itself is translated too');
  });

  test('it is read through window, because js/api.js can load first', () => {
    /* The always-false-guard family in its safe direction: a BARE cross-module
       read throws on a stage that has not loaded js/i18n.js, and this helper is
       in the path of every request the product makes. */
    assert.match(apijs, /typeof window\.srvMsg\s*===\s*'function'/,
      'guarded, and the guard names a function this project really publishes');
    assert.match(i18n, /\bsrvMsg\b[^\n]*langId/,
      'srvMsg is on the published list in js/i18n.js');
  });

  test('an unknown sentence passes through untouched', () => {
    const body = i18n.slice(i18n.indexOf('function srvMsg('));
    assert.match(body.slice(0, 600), /return raw;/,
      'so a message added on the server can never break the browser');
  });
});

describe('f241 — the table describes sentences the server really says', () => {
  const { SRV_MSG, SRV_MSG_PREFIX } = tables();

  test('every English key in the table is a sentence in server.js', () => {
    /* THE ENGLISH SIDE IS THE LOOKUP KEY, character for character. A message
       reworded on the server silently stops being translated, and nothing else
       would notice — this is what notices. */
    const missing = Object.keys(SRV_MSG).filter(en => !srv.includes(en));
    assert.deepEqual(missing, [],
      'these are in the lookup and no longer in the server — reword the key or drop it');
  });

  test('every prefix in the table is a prefix server.js really uses', () => {
    const missing = SRV_MSG_PREFIX.map(p => p[0]).filter(p => !srv.includes(p));
    assert.deepEqual(missing, []);
  });

  test('it covers the sentences a normal person actually meets', () => {
    /* Not a count — a named roll call, so the claim is about WHICH sentences
       rather than about how many. Each of these is on an ordinary road: signing
       in, saving, sharing, being refused, and the counterparty's own page. */
    for (const s of [
      'Email or password is incorrect',
      'Your current password is incorrect',
      'This contract has been executed and sealed',
      'Somebody has already signed this contract, so the signing route cannot be changed.',
      'You do not have access to that value stream',
      'Admin access required',
      'Share link not found or expired',
      'A response was already submitted for this link',
      'This contract is no longer available. Ask the sender for an up-to-date copy.',
      'That is not a Word (.docx) or PDF file — the converter reads those two kinds',
      'Copilot engine not configured',
    ]) assert.ok(SRV_MSG[s], `not translated: ${s}`);
  });

  test('a prefixed message keeps its detail verbatim', () => {
    /* The detail after the colon is the provider's own words or a file name —
       the half that says what to do next, and not ours to rewrite. */
    const body = i18n.slice(i18n.indexOf('function srvMsg('));
    assert.match(body.slice(0, 600), /raw\.slice\(pre\.length\)/);
  });
});

describe('f241 — both dictionaries carry every key the table names', () => {
  const S = dicts();
  const { SRV_MSG, SRV_MSG_PREFIX } = tables();
  const keys = [...new Set([...Object.values(SRV_MSG), ...SRV_MSG_PREFIX.map(p => p[1])])];

  for (const lang of Object.keys(S)) {
    test(`${lang} has all ${keys.length} of them`, () => {
      const gaps = keys.filter(k => S[lang][k] == null);
      assert.deepEqual(gaps, [], `${lang} would fall back to the key name on screen`);
    });
  }

  test('and the Swedish is really Swedish, not the English copied over', () => {
    /* The one shape a parity check by COUNT cannot see. A handful are genuinely
       identical in both (a product name, a bare number) — none of these is. */
    const same = keys.filter(k => S.en[k] === S.sv[k]);
    assert.deepEqual(same, []);
  });
});

describe('f241 — the twelve screens the audit named', () => {
  const S = dicts();
  const has = k => assert.ok(S.en[k] != null && S.sv[k] != null, `missing: ${k}`);

  test('the dialog defaults — about fifty dialogs across both shells', () => {
    const core = read('js/core.js');
    assert.ok(!/opts\.confirmLabel\|\|'Confirm'/.test(core), 'still in the source: /opts\.confirmLabel\|\|\'Confirm\'/');
    assert.ok(!/opts\.cancelLabel\|\|'Cancel'/.test(core), 'still in the source: /opts\.cancelLabel\|\|\'Cancel\'/');
    assert.match(core, /opts\.cancelLabel\|\|i18t\('act_cancel'\)/);
    has('act_ok'); has('act_are_you_sure');
  });

  test("the share dialog's first step", () => {
    const core = read('js/core.js');
    assert.ok(!/card\('contract','The contract'/.test(core), 'the option card is out of the source');
    assert.ok(!/>Next \$\{icon\('arrow-right'/.test(core), 'and no Next button is still an English literal');
    for (const k of ['co_share_kind_contract', 'co_share_kind_contract_sub',
      'co_share_kind_history', 'co_share_kind_history_sub',
      'co_share_kind_history_none', 'act_next']) has(k);
  });

  test('SHARE_PURPOSE_COPY — every member a getter, so the row turns over together', () => {
    const core = read('js/core.js');
    const block = core.slice(core.indexOf('const SHARE_PURPOSE_COPY'),
      core.indexOf('const SHARE_PURPOSE_COPY') + 900);
    assert.ok(!/label:'Negotiate'/.test(block), 'still in the source: /label:\'Negotiate\'/');
    assert.ok(!/blurb:'For an advisor/.test(block), 'still in the source: /blurb:\'For an advisor/');
    /* Getters, not calls: an object literal freezes the load-time language. */
    assert.equal((block.match(/get label\(\)/g) || []).length, 3);
    assert.equal((block.match(/get blurb\(\)/g) || []).length, 3);
  });

  test("the counterparty's verb row and everything it says afterwards", () => {
    const portal = read('js/views/portal.js');
    assert.ok(!/>Ready to sign<\/button>/.test(portal), 'still in the source: />Ready to sign<\/button>/');
    assert.doesNotMatch(portal, /Readiness sent &#10003;/);
    assert.ok(!/'Sending…'/.test(portal), 'still in the source: /\'Sending…\'/');
    assert.ok(!/portalSetDone\(pressed,'Sent — they know you are ready'\)/.test(portal), 'still in the source: /portalSetDone\(pressed,\'Sent — they know you are ready\'\)');
    for (const k of ['po_readiness_sent', 'po_sending', 'po_ready_done',
      'po_ready_toast', 'po_answer_toast', 'po_delivered',
      'po_lab_signature', 'po_done_signed_sent']) has(k);
  });

  test('the signing-code warning, which ran on into English mid-sentence', () => {
    const portal = read('js/views/portal.js');
    assert.ok(!/the address the sender invited — not to the address typed above/.test(portal), 'still in the source: /the address the sender invited — not to the address typed a');
    has('po_code_goes_only_to_full');
    assert.match(S.en.po_code_goes_only_to_full, /\{email\}/, 'the address is a hole in one sentence');
    assert.match(S.sv.po_code_goes_only_to_full, /\{email\}/);
  });

  test('the forced password-change gate — an invited colleague\'s first screen', () => {
    const core = read('js/core.js');
    assert.ok(!/return fail\('The new password must be at least 8 characters\.'\)/.test(core), 'still in the source: /return fail\(\'The new password must be at least 8 characte');
    assert.ok(!/Your account was created with a temporary password someone else chose/.test(core), 'still in the source: /Your account was created with a temporary password someone ');
    for (const k of ['co_temp_password_body', 'co_password_too_short',
      'co_passwords_differ', 'co_password_updated']) has(k);
  });

  test('the chart legends — and the category labels deliberately left alone', () => {
    const ac = read('js/aichart.js');
    assert.ok(!/label: 'Contracts'/.test(ac), 'still in the source: /label: \'Contracts\'/');
    assert.ok(!/label: 'Average days'/.test(ac), 'still in the source: /label: \'Average days\'/');
    /* THE CATEGORY LABELS DOUBLE AS THE CODE'S OWN KEYS: statusBreakdown's
       array is the filter over c.status and riskBands' are the counting keys.
       Translating those in place would silently empty the chart, so they are
       written down rather than swept. */
    assert.match(ac, /const order = \['Draft', 'Under Review', 'Signed', 'Declined'\]/);
    assert.match(ac, /const bands = \{ Low: 0, Medium: 0, High: 0 \}/);
    for (const k of ['ch_s_contracts', 'ch_s_average_days', 'ch_s_open_obligations']) has(k);
  });

  test('AI_SERIES labels are getters — the getter trap AND a dead zone', () => {
    const ac = read('js/aichart.js');
    const block = ac.slice(ac.indexOf('const AI_SERIES'), ac.indexOf('const AI_SERIES') + 1400);
    assert.equal((block.match(/get label\(\)/g) || []).length, 5,
      'a plain call here freezes the language at load AND throws inside _acT\'s dead zone');
  });

  test("the stream drawer's empty state, and the button its own header translates", () => {
    const reg = read('js/views/register.js');
    assert.ok(!/>\+ New contract<\/button>/.test(reg), 'still in the source: />\+ New contract<\/button>/');
    assert.ok(!/No contracts in this value stream yet/.test(reg), 'still in the source: /No contracts in this value stream yet/');
    for (const k of ['reg_stream_none_match', 'reg_stream_none_yet',
      'reg_stream_widen', 'reg_stream_create_hint']) has(k);
  });

  test('the paste report is ONE sentence, not six fragments', () => {
    const lib = read('js/views/library.js');
    assert.ok(!/characters\$\{kept\?` — \$\{kept\} kept`/.test(lib), 'still in the source: /characters\$\{kept\?` — \$\{kept\} kept`/');
    has('lib_paste_report');
    /* Whole sentences with named holes: word order differs between languages,
       so a sentence assembled from pieces is one no translator can fix. */
    for (const lang of ['en', 'sv']) {
      for (const hole of ['{n}', '{kept}', '{via}', '{preview}'])
        assert.ok(S[lang].lib_paste_report.includes(hole), `${lang} lost ${hole}`);
    }
  });

  test("the Copilot panel's chrome and its live sub-line", () => {
    const html = read('index.html');
    const ai = read('js/ai.js');
    assert.match(html, /id="ai-expand"[^>]*data-i18n-title="ai_expand_panel"/);
    assert.match(html, /id="ai-clear"[^>]*data-i18n-title="ai_delete_conversation"/);
    assert.match(html, /id="ai-min"[^>]*data-i18n-title="ai_minimize_hint"/);
    assert.match(html, /id="ai-close"[^>]*data-i18n-title="act_close"/);
    /* The sub-line is REPAINTED by script, so the words that matter are the
       three pairs in copilotBrainInfo rather than the markup. */
    assert.ok(!/label:'Claude Copilot · via server'/.test(ai), 'still in the source: /label:\'Claude Copilot · via server\'/');
    for (const k of ['ai_brain_server', 'ai_brain_server_hint', 'ai_brain_basic',
      'ai_brain_basic_hint', 'ai_searching_live']) has(k);
  });
});
