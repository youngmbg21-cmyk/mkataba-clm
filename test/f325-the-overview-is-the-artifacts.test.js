/* f325 — THE OVERVIEW IS DRAWN AS THE ARTIFACT DRAWS IT
   ============================================================
   Young, 17 September 2026, over a picture of the artifact's record card and
   one of HaTi's: *"this is how the record card is designed in the artifact but
   this is not what you have built. I never sanctioned what you have built in
   image 2. Review what else I did not sanction and fix it."*

   The SHAPE is measured in a browser (overview-as-drawn-verify) — jsdom
   resolves no grid, so no check here can tell a row from a cell. What this
   file pins is everything the shape rests on and that a browser cannot see:

     · ONE reading behind both shapes, so the grid and the editable row can
       never print different values for one term
     · the artifact's own twelve on each section, named
     · the edit posture is in memory and never stored — a stored one would
       leave a colleague's screen in edit mode
     · the readings table BORROWS every count and spends nothing
     · the family check is deterministic: no route, no model, no write
     · every new name is published, and every new key is in both books

   Run: node --test test/f325-the-overview-is-the-artifacts.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const CONTRACT = read('js/views/contract.js');
const FAMILY = read('js/family.js');
const I18N = read('js/i18n.js');

/* A function's own body, matched BY NAME and never by parameter list: a net a
   signature can silence says nothing about the behaviour it was written for
   (the f255 lesson, and f178 paid it again the same week). */
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

describe('f325 (1) one reading behind both shapes', () => {
  test('ktFactReads exists and is what both the grid and the rows ask', () => {
    const R = fnBody(CONTRACT, 'ktFactReads');
    assert.ok(R, 'the shared reading is there');
    /* RE-POINTED IN PLACE 21 Sep 2026, when the deal grid became one cell
       builder over two field lists: the reading is asked in ktFieldCell, which
       is where a cell's value is now decided, rather than in the function that
       merely maps the list over it. The CLAIM is unchanged — every shape that
       prints a term reads it through one function. */
    for (const fn of ['ktTermsRowsHtml', 'ktFieldCell', 'ktRecordFactsHtml']) {
      const b = fnBody(CONTRACT, fn);
      assert.ok(b, fn + ' is there');
      assert.ok(/ktFactReads\(c\)/.test(b), fn + ' reads through it');
    }
  });
  test('it returns the RAW value, so each shape draws its own silence', () => {
    const R = fnBody(CONTRACT, 'ktFactReads');
    /* The grid's absence is an em-dash and the row's is "Not set" — two
       sentences for one silence, and neither may be baked into the reading. */
    assert.ok(!/ct_not_set|ct_pick_a_date/.test(R),
      'the shared reading names neither shape’s dash');
  });
});

describe('f325 (2) the artifact\'s twelve, on each section', () => {
  test('The deal carries the four the owner saw drawn as rows', () => {
    /* RE-POINTED IN PLACE 21 Sep 2026. The four typed facts are cells in
       ktFieldCell, which decides what each one draws; WHICH fields the card
       carries is OV_DEAL_FIELDS, one ordered list. The five supply-only terms
       moved to OV_ALSO_FIELDS by the owner's own ruling that day — they are
       still on the page, drawn where the contract records them, which is what
       the second half now asks. */
    const b = fnBody(CONTRACT, 'ktFieldCell');
    for (const k of ['ov_f_value', 'ov_f_effective', 'ov_f_expiry', 'me_notice_days'])
      assert.ok(b.includes(k), k + ' is a cell on The deal');
    const deal = /const OV_DEAL_FIELDS = \[[\s\S]*?\];/.exec(CONTRACT);
    const also = /const OV_ALSO_FIELDS = \[[\s\S]*?\];/.exec(CONTRACT);
    assert.ok(deal && also, 'both lists are there');
    for (const k of ['paymentTerms', 'liabilityCapped', 'governingLaw'])
      assert.ok(deal[0].includes(k), k + ' is on every contract');
    for (const k of ['volumeRebate', 'rebateTiers', 'priceReview',
      'rejectionWindowDays', 'exclusivity'])
      assert.ok(also[0].includes(k), k + ' is drawn where it is recorded');
  });
  test('The record carries the artifact\'s twelve filing attributes', () => {
    const b = fnBody(CONTRACT, 'ktRecordFactsHtml');
    for (const k of ['ov_f_reference', 'tf_our_party', 'reg_col_counterparty', 'ov_f_email',
      'ov_f_stream', 'ov_f_template', 'ov_f_owner', 'reg_col_status', 'ov_f_raised',
      'reg_col_signed', 'ov_f_filedby', 'ov_f_updated'])
      assert.ok(b.includes(k), k + ' is a cell on The record');
  });
  test('and neither invents a clause number', () => {
    /* HaTi records the WORDING a term was read from, never its number; a
       derived citation shown to a lawyer is a number the product invented.
       The artifact asks for one and the owner ruled it out by name. */
    const both = fnBody(CONTRACT, 'ktFieldCell') + fnBody(CONTRACT, 'ktRecordFactsHtml');
    assert.ok(!/cl\.\s|clauseNo|clauseNumber/.test(both), 'no clause citation is derived');
  });
  test('a grid whose rows are drawn above gives the fields up', () => {
    /* THE RECORD still draws its editable rows above the grid and takes those
       fields out of it — one fact, one place on the screen. THE DEAL no longer
       has rows above it at all: on 21 Sep 2026 its edit posture became a box
       IN the cell's own place in the same grid, so there is nothing to give up
       and nothing to filter. The claim under both is the same one, which is
       why the deal's half is asked as the shape that replaced it. */
    const rec = fnBody(CONTRACT, 'ktRecordFactsHtml');
    assert.ok(/opts\.rowsAbove/.test(rec), 'the record knows when the rows carry them');
    assert.ok(/skip\.has\(r\[0\]\)/.test(rec), 'and filters by key, never by position');
    const deal = fnBody(CONTRACT, 'ktDealFactsHtml');
    assert.ok(/opts\.edit/.test(deal), 'the deal takes a posture instead');
    assert.ok(!/opts\.rowsAbove/.test(deal), 'and no longer has rows above it to duck');
  });
});

describe('f325 (3) the edit posture is this sitting\'s, and nobody else\'s', () => {
  test('it is in memory and never stored', () => {
    /* PIN THE REGION, not a byte count and not an order: the posture is the
       three declarations from _ovEdit to the end of its writer, wherever in
       the file they happen to sit. */
    const a = CONTRACT.indexOf('const _ovEdit');
    assert.ok(a > 0, 'the posture is declared');
    const region = CONTRACT.slice(a, CONTRACT.indexOf('\n', CONTRACT.indexOf('function ovSetEditing', a)));
    assert.ok(/ovEditing/.test(region) && /ovSetEditing/.test(region), 'the reader and the writer');
    assert.ok(!/localStorage|lsSet|sessionStorage/.test(region),
      'a stored posture would leave a colleague’s screen in edit mode');
  });
  test('it is keyed through OV_KEY, so it is per contract', () => {
    assert.ok(/ovEditing\(dealK\)/.test(CONTRACT) && /ovEditing\(recK\)/.test(CONTRACT),
      'both sections ask it by their own key');
    assert.ok(/const dealK=OV_KEY\(c,'deal'\), recK=OV_KEY\(c,'record'\)/.test(CONTRACT),
      'and the keys are the fold’s own, which carry the contract id');
  });
  test('Move to another stream is not a second door onto the act', () => {
    /* The picker, its admin guard, its audit line and its repaint are
       ktStreamRowHtml's. This act opens the row that holds it. */
    assert.ok(/data-ov-move-stream/.test(CONTRACT), 'the act exists');
    /* READ THE CODE, NOT THE COMMENTS ABOUT IT — a first draft of this check
       matched the very sentence beside the handler explaining that the move
       belongs to ktStreamRowHtml, and so passed on the wrong thing. */
    const i = CONTRACT.indexOf("data-ov-move-stream]')");
    const handler = CONTRACT.slice(i, CONTRACT.indexOf("data-ov-read-go]')", i))
      .replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(i > 0 && /data-kt-edit="stream"/.test(handler),
      'it presses the row a reader presses');
    assert.ok(!/audit|PUT|api\(|folderSeerCount/.test(handler),
      'and re-implements no part of the move itself');
  });
});

describe('f325 (4) what Copilot read borrows every count', () => {
  /* RE-POINTED IN PLACE 26 Sep 2026 (the list inspector): the Overview's readings
     are COUNTED in ktReadingsRows and DRAWN in ktReadingsRowsHtml, split so the
     panel beside the lists reads the same rows — the claim is about the two
     together, which is the one place the readings live. */
  const B = (fnBody(CONTRACT, 'ktReadingsRows') || '') + (fnBody(CONTRACT, 'ktReadingsRowsHtml') || '');
  test('the table is five readings', () => {
    assert.ok(B, 'the builder is there');
    for (const k of ['ov_r_brief', 'ov_r_playbook', 'ov_r_oblig', 'ov_r_scan', 'ov_r_plain'])
      assert.ok(B.includes(k), k + ' is a row');
  });
  test('and it spends nothing and writes nothing', () => {
    assert.ok(!/api\(|fetch\(|aiAsk|copilotAsk/.test(B), 'no route is called to draw a table');
    assert.ok(!/c\.\w+\s*=[^=]/.test(B), 'reading must not write');
  });
  test('every figure is an existing reading, asked through window', () => {
    for (const r of ['contractObligations', 'openFindings', 'docReadHeld', 'playbookStale'])
      assert.ok(B.includes(r), r + ' is borrowed rather than re-counted');
    assert.ok(/_hasBrief/.test(B),
      'the brief is asked via the LIGHT LIST’s boolean, not _brief alone');
  });
  test('each row carries its date and a door', () => {
    assert.ok(/ov-r-w/.test(B) && /data-ov-read-go/.test(B), 'a when column and a door');
    assert.ok(/roomGoTab/.test(CONTRACT), 'and the door is the room’s own router');
  });
});

describe('f325 (5) the family check is deterministic', () => {
  const O = fnBody(FAMILY, 'familyOrder'), K = fnBody(FAMILY, 'familyCheck');
  test('both readings exist and are published', () => {
    assert.ok(O && K, 'familyOrder and familyCheck are built');
    assert.ok(/Object\.assign\(window,\{familyOrder,familyCheck,/.test(FAMILY),
      'and reachable across the module boundary — f232’s own rule');
  });
  test('no route, no model, no write', () => {
    const both = O + K + (fnBody(FAMILY, 'familyCheckReport') || '');
    assert.ok(!/api\(|fetch\(|\/api\/|anthropic|copilotPropose/.test(both),
      'a family check that called a model would be a second opinion, not a check');
    assert.ok(!/\.moved\s*=[^=]|c\.\w+\s*=[^=]/.test(both), 'it writes nothing to the record');
  });
  test('the parent leads and the children follow in signing order', () => {
    assert.ok(/role:'parent'/.test(O) && /role:'amendment'/.test(O), 'both roles named');
    assert.ok(/contractSignedAt/.test(O), 'the order is the product’s own signing reading');
  });
  test('an unsigned amendment is named but takes no term', () => {
    assert.ok(/if\(!r\.signed\) return;/.test(K),
      'a draft amendment has displaced nothing yet');
  });
  test('the check and the rows read the same thing', () => {
    assert.ok(/familyAgreement\(parent, e\.doc\)/.test(K),
      'the button gathers the reading each row already prints');
  });
});

describe('f325 (6) every new key is in both books', () => {
  const KEYS = ['ov_f_value', 'ov_f_effective', 'ov_f_expiry', 'ov_f_email', 'ov_f_stream',
    'ov_f_template', 'ov_f_filedby', 'ov_f_updated', 'ov_edit_details', 'ov_edit_done',
    'ov_move_stream', 'ov_r_brief', 'ov_r_brief_yes', 'ov_r_brief_part', 'ov_r_playbook',
    'ov_r_oblig', 'ov_r_scan', 'ov_r_plain', 'ov_r_ready', 'ov_r_none', 'ov_r_open',
    'ov_r_th_what', 'ov_r_th_found', 'ov_r_th_when', 'fa_check_family', 'fa_check_alone',
    'fa_check_unsigned', 'fa_check_inforce', 'fa_prec_rule', 'fa_prec_holds', 'fa_prec_none'];
  test('each is declared twice — a key in one book leaves a screen half-English', () => {
    for (const k of KEYS) {
      const n = (I18N.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length;
      assert.equal(n, 2, k + ' is in both books (found ' + n + ')');
    }
  });
  test('and the plural pairs are pairs', () => {
    for (const k of ['ov_r_departures', 'ov_r_oblig_n', 'ov_r_open_n']) {
      assert.equal((I18N.match(new RegExp('^\\s*' + k + '_one:', 'gm')) || []).length, 2, k + '_one');
      assert.equal((I18N.match(new RegExp('^\\s*' + k + '_other:', 'gm')) || []).length, 2, k + '_other');
    }
  });
});
