/* F350 — THE COUNTERPARTY LEADS, AND THE WORK ORDER'S FOUR (Young, 21 Sep 2026)
   ========================================================================
   Two orders in one run.

   THE COLUMNS, off two renders the owner approved: *"the contract title column
   is deleted, the title of the contract goes below the name of the counterparty
   ... the name of the counter party is on black bold letters and the name of
   the contract is smaller and in grey"*, and of the Negotiations seat: *"do not
   delete any column but ... bring the words currently below the contract names
   as a new column on the right of the counterparty name."* Then: *"Important
   that the columns are well spaced so we can see the most of the counterparty
   name. Balance is key."*

   THE WORK ORDER (WORKORDER-five-off-five-images.md), built after he read it:
   the pop-up's ground and its cramped heading row, HaTi's own dropdown list
   across the platform, the brief that fails to run, a mandatory brief button
   before signing, and the Copilot rail naming its clause.

   Every claim was proved red at the parent. The PAINTED halves — a column's
   measured width, a card edge's colour, a menu's corner, the rail's own box —
   are in counterparty-leads-verify, because a token read out of the source is
   not a pixel on a page. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/* Comments are prose. A sweep that asks "does the code call this" reads CODE —
   the lesson this file's neighbours paid for twice in one week. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const REG  = read('js/views/register.js');
const CT   = read('js/views/contract.js');
const CORE = read('js/core.js');
const CE   = read('js/views/clauseeditor.js');
const SRV  = read('server/server.js');
const HTML = read('index.html');
const { buildWorld } = require('./world.js');

describe('f350 (1) — the counterparty leads and the title sits under it', () => {
  const win = buildWorld({ registerView: true }).win;

  test('the title is no longer a column of its own, on either seat', () => {
    assert.ok(!win.REG_COL_KEYS.includes('name'), 'Contracts draws no title column');
    assert.ok(!win.REG_COL_KEYS_NEGO.includes('name'), 'nor does Negotiations');
    /* NOTHING IT DREW WAS LOST: its builder is gone, and the cell that took
       its place carries the title, the family indent, the arrow and the +N
       toggle — that last one a real control. */
    assert.ok(!/CELL\.name\s*=/.test(strip(REG)), 'and its builder is deleted, not stubbed');
    const cp = /CELL\.counterparty=`([\s\S]*?)`;/.exec(REG);
    assert.ok(cp, 'the identity cell is readable');
    assert.match(cp[1], /class="reg-title"/, 'the leading line is the row title');
    assert.match(cp[1], /class="reg-sub"/, 'and the second line is the sub-line');
    assert.match(cp[1], /data-fam-toggle/, 'the family toggle came with it');
    assert.match(cp[1], /↳/, 'and so did the child arrow');
  });

  test('the counterparty leads and the contract name follows, in that order', () => {
    const cp = /CELL\.counterparty=`([\s\S]*?)`;/.exec(REG)[1];
    const lead = cp.indexOf('reg-title'), sub = cp.indexOf('reg-sub');
    assert.ok(lead > 0 && sub > lead, 'the identity line is written before the sub-line');
    /* The leading line is the party and the second is the title — asked of the
       readings each is built from, never of the words. */
    const leadHalf = cp.slice(lead, sub), subHalf = cp.slice(sub);
    assert.match(leadHalf, /esc\(cpName\)/, 'the counterparty leads');
    /* REVERSED IN PLACE 26 Sep 2026 — this pinned `esc(regTitleOf(c))`, which
       was the bug: regTitleOf already escapes, so a second esc printed "&amp;"
       wherever a title held an ampersand (the list options' floor: "names
       print &, never &amp;"). The title is interpolated as the reading hands
       it over, and no second escape may come back — on the line OR the hover. */
    assert.match(subHalf, /\$\{regTitleOf\(c\)\}/, 'and the contract name follows');
    assert.ok(!/esc\(regTitleOf\(c\)\)/.test(cp), 'escaped once, never twice');
  });

  test('ONE reading of the kind and the round, and both seats spell it through that', () => {
    assert.match(REG, /const kindRound=`\$\{cKind\(c\)\}/, 'one reading');
    assert.match(REG, /CELL\.kind=neg\?`<td class="reg-typecell">\$\{esc\(kindRound\)\}/,
      "the Negotiations seat's column prints it");
    const cp = /CELL\.counterparty=`([\s\S]*?)`;/.exec(REG)[1];
    assert.match(cp, /\$\{esc\(kindRound\)\}/, "and Contracts says it on the cell's hover");
  });

  test('the Negotiations seat gains a column of its own, and Contracts loses one', () => {
    /* RE-POINTED IN PLACE 24 Sep 2026: the owner took the value stream column
       off both seats ("Remove the value stream column from both pages as well
       but not from the filter"), so ten → nine and eight → seven. The claim
       about the kind column is unchanged. */
    assert.equal(win.REG_COL_KEYS.length, 9, 'nine on Contracts (ten before the stream column went)');
    assert.equal(win.REG_COL_KEYS_NEGO.length, 7, 'and seven on Negotiations (eight before it went)');
    assert.deepEqual(win.REG_COL_KEYS_NEGO.filter(k => !win.REG_COL_KEYS.includes(k)), ['kind']);
    /* IMMEDIATELY RIGHT OF THE COUNTERPARTY — the owner named the place. */
    const i = win.REG_COL_KEYS_NEGO.indexOf('counterparty');
    assert.equal(win.REG_COL_KEYS_NEGO[i + 1], 'kind', 'and it sits straight after it');
  });

  test('BALANCE: both seats sum to 100 and the six shared columns are cut identically', () => {
    assert.equal(win.REG_COL_W.reduce((a, b) => a + b, 0), 100);
    assert.equal(win.REG_COL_W_NEGO.reduce((a, b) => a + b, 0), 100);
    assert.equal(win.REG_COL_W.length, win.REG_COL_KEYS.length);
    assert.equal(win.REG_COL_W_NEGO.length, win.REG_COL_KEYS_NEGO.length);
    const A = Object.fromEntries(win.REG_COL_KEYS.map((k, i) => [k, win.REG_COL_W[i]]));
    const B = Object.fromEntries(win.REG_COL_KEYS_NEGO.map((k, i) => [k, win.REG_COL_W_NEGO[i]]));
    /* FIVE since 24 Sep 2026 — the stream column left both seats, and its
       width went back to the counterparty on both, so these still agree. */
    for (const k of ['mk', 'counterparty', 'value', 'expiry', 'stage'])
      assert.equal(A[k], B[k], k + ' is cut the same on both seats');
    assert.ok(!('stream' in A) && !('stream' in B), 'and neither seat has a stream column');
    /* "SO WE CAN SEE THE MOST OF THE COUNTERPARTY NAME" — it is the widest
       column on either table, and by a clear margin, because it now carries
       two facts where the two columns it replaced carried one each. */
    const widest = l => Object.entries(l).sort((x, y) => y[1] - x[1])[0][0];
    assert.equal(widest(A), 'counterparty', 'the widest column on Contracts');
    assert.equal(widest(B), 'counterparty', 'and on Negotiations');
    assert.ok(A.counterparty >= 26, 'and it took both old shares, not one');
  });

  test('the Type column sorts, and the title is a sort without a column', () => {
    assert.ok(win.REG_CMP.kind, 'the Type column has a comparator');
    assert.ok(win.REG_SORT_DEFDIR.kind, 'and a first direction');
    assert.ok(win.REG_SORTS.some(s => s.k === 'kind'), 'and a row in the dropdown');
    /* `name` keeps its comparator and its dropdown row: a sort with no column
       of its own, which `risk` has been since the dropdown was built. */
    assert.ok(win.REG_CMP.name && win.REG_SORTS.some(s => s.k === 'name'),
      'the title is still offered');
    assert.ok(!/sortableTh\('name'/.test(REG), 'but it has no head to press');
  });
});

describe('f350 (2) — a dropped connection is retried; a refusal is not', () => {
  test('the call is bounded and a throw is retried ONCE', () => {
    const i = SRV.indexOf('async function anthropicMessages(');
    const w = strip(SRV.slice(i, SRV.indexOf('\nasync function', i + 10)));
    assert.ok(i > 0 && w.length > 200, 'the region is readable');
    assert.match(w, /AbortSignal\.timeout\(AI_HTTP_TIMEOUT_MS\)/, 'the wait is bounded');
    assert.match(w, /catch \(e\) \{ threw = e; \}/, 'a throw is caught rather than propagated');
    assert.match(w, /if \(threw\) \{/, 'no answer at all is what is retried');
    /* ANY HTTP STATUS IS AN ANSWER and must not be retried: a bad key, a
       refusal, a rate limit and a 500 each have their own sentence already,
       and f133 and f230 pin a provider error mapping to 502. A first pass
       retried a 5xx too and that was wider than the measurement — what was
       reported was "could not be reached", which is the throw. */
    assert.ok(!/status >= 4\d\d/.test(w) && !/status >= 5\d\d/.test(w),
      'a status is an answer, and no status is retried');
    /* ONE RETRY, not a loop: two attempts and no more. */
    assert.equal((w.match(/await send\(chosen\)/g) || []).length, 2, 'exactly two attempts');
  });

  test('and the two numbers are settable, never buried', () => {
    assert.match(SRV, /const AI_HTTP_TIMEOUT_MS = Number\(process\.env\.AI_HTTP_TIMEOUT_MS \|\| \d+\)/);
    assert.match(SRV, /const AI_RETRY_PAUSE_MS\s+= Number\(process\.env\.AI_RETRY_PAUSE_MS\s+\|\| \d+\)/);
  });

  test('a reading that failed carries the press that runs it again', () => {
    const i = CT.indexOf('const doorFor = x =>');
    const w = CT.slice(i, i + 400);
    assert.match(w, /!x\.working && !x\.ok && !x\.none && x\.key!=='filed'\) \? 'retry'/,
      'a failed tile is a door, and it is asked first');
    assert.match(strip(CT), /if\(go==='retry'\)\{ if\(window\.triageAndPaint\) triageAndPaint\(c,\{again:true\}\); return; \}/,
      'and the press runs the whole arrival read again');
    /* `again` is a PERSON asking, and it is the only thing that lifts the
       once-per-wording guard — which exists to stop a failure being retried
       SILENTLY and paid for on every send. */
    assert.match(strip(CT), /const again = !!\(opts && opts\.again\)/);
    assert.match(strip(CT), /if\(!again && \(window\.triageNeedsRead/);
  });
});

describe('f350 (3) — the brief is the LAST button before signing', () => {
  /* ---- REVERSED IN PLACE, 21 Sep 2026 ----
     This file pinned the brief as the FIRST button on the card, in the head's
     own slot, which is what the owner asked for on 17 Sep. He reversed it the
     same week: *"write brief should be the last button clicked … It should not
     be the first button in the signing page but last and mandatory."* Every
     other claim below — drawn in every state, two acts and never absent, the
     secondary button, the Overview card's own attribute, a sprite symbol that
     exists — is untouched and is the half that still governs. */
  const briefCtl = () => {
    const i = CT.indexOf("id=\"sc-brief\"");
    return i > 0 ? CT.slice(Math.max(0, i - 400), i + 500) : '';
  };
  test('it is drawn in every state, and it is the LAST stage\'s own act', () => {
    const w = briefCtl();
    assert.ok(w, 'the control is built');
    assert.match(w, /id="sc-brief"/);
    /* DRAWN WHATEVER THE BRIEF'S STATE: the only thing that branches is WHICH
       act it carries, never whether it is there. */
    assert.match(w, /data-kt-brief="\$\{briefStands\?'open':'run'\}"/,
      'one button, two acts, never absent');
    /* THE LAST STAGE'S OWN ACT, and `sign` is last in SIGN_STAGES. */
    assert.match(w, /st==='sign'/, 'it belongs to the last stage');
    const SC = read('js/signcheck.js');
    const stages = /const SIGN_STAGES = \[([^\]]*)\];/.exec(SC);
    assert.ok(stages && /'sign'\s*\]?\s*$/.test(stages[1].trim()), 'which is last: ' + stages[1]);
    /* AND THE CARD HEAD DRAWS NO CONTROL AT ALL: it carried this one and
       nothing else. */
    const head = /<div class="kt-tri-head">([\s\S]*?)<\/div>/.exec(CT.slice(CT.indexOf('id="sign-check"')));
    assert.ok(head, 'the card head is readable');
    assert.ok(!/<button/.test(head[1]), 'nothing is pressable in the head any more');
  });

  test('TWO DOORS, ONE ACT: it carries the Overview card’s own attribute', () => {
    /* `data-kt-brief` is what wireKtBriefCard binds, everywhere on the page —
       so this button and that card cannot drift about what writing or opening
       a brief means, and the panel that opens is the same panel. */
    assert.match(strip(CT), /wireKtBriefCard\(c,\{ after:scAgain \}\)/,
      'the sign-check card wires the act through the function that owns it');
    assert.match(strip(CT), /function wireKtBriefCard\(c,opts\)/, 'which learned an additive after');
    assert.match(strip(CT), /if\(r\) openCheckPanel\(c,'brief'\)/,
      'and the panel opens only where a brief really arrived');
  });

  test('it is the secondary button, never the filled one, and it says what it costs', () => {
    const w = briefCtl();
    assert.match(w, /class="sc-stage-act sc-brief"/, "the Run control's own clothes");
    assert.ok(!/ui-btn-primary/.test(w), 'one filled button per screen, and here that is Sign');
    assert.match(w, /sc_brief_title/, 'the cost rides the hover');
    /* THE MARK IS A SPRITE SYMBOL THAT EXISTS: a <use> at a missing symbol
       paints an empty box in silence. */
    const m = /<use href="#(i-[a-z-]+)"\/>/.exec(w);
    assert.ok(m, 'it carries a mark');
    assert.ok(HTML.includes(`id="${m[1]}"`), m[1] + ' is a real sprite symbol');
  });
});

describe('f350 (4) — the Copilot rail names the clause it is working on', () => {
  test('through the one presenting reading this page already has', () => {
    const i = CE.indexOf('<div class="ce-ah">');
    const w = CE.slice(i, i + 1900);
    assert.ok(i > 0, 'the rail head is readable');
    assert.match(w, /class="ce-ah-cl"/, 'the clause is named on the head');
    assert.match(w, /ceClauseLabel\(ceClause\(\)\)/,
      'through ceClauseLabel, which goes through clauseNameShown');
    /* An unnamed region still says something rather than drawing a gap. */
    assert.match(w, /\|\| _cet\('ce_this_clause'\)/, 'and a nameless clause still answers');
    /* It sits between Copilot's label and the tabs. */
    assert.ok(w.indexOf('ce-ah-cl') > w.indexOf('ce_copilot'), 'after the label');
    assert.ok(w.indexOf('ce-ah-cl') < w.indexOf('ce-tabs'), 'and before the tabs');
  });

  test('it elides rather than wrapping, and the whole name is on the hover', () => {
    assert.match(HTML + CE, /\.ce-ah-cl\{[^}]*text-overflow:ellipsis/);
    assert.match(HTML + CE, /\.ce-ah-cl\{[^}]*white-space:nowrap/);
    assert.match(HTML + CE, /\.ce-ah-cl\{[^}]*min-width:0/, 'and can shrink below its text');
    const w = CE.slice(CE.indexOf('<div class="ce-ah">'), CE.indexOf('<div class="ce-ah">') + 1900);
    assert.match(w, /class="ce-ah-cl" title="/, 'the whole name is on the hover');
  });
});

describe('f350 (5) — the pop-up has a ground, and every dropdown is HaTi’s own', () => {
  test('the cards have something to be white against', () => {
    assert.match(HTML, /\.na-body\{[^}]*background:var\(--color-bg\)/,
      'the body takes the page ground');
    /* RE-POINTED IN PLACE 22 Sep 2026 (proposal C). The GROUND is the claim
       and it is untouched; what sat on it stopped being six cards. The
       questions card still steps its edge up to .ui-btn's own token, and the
       CHOSEN thing is still the loudest on the screen — louder now, since a
       lit rail row is filled rather than outlined. */
    assert.match(HTML, /\.na-card\{[^}]*border:1px solid var\(--rule-strong\)/);
    assert.match(HTML, /\.na-pick\.on,\.na-pick\.on:hover\{ background:var\(--accent-fill\); \}/);
    assert.match(HTML, /\.na-pick\.on \.na-pick-n\{ color:#fff/);
  });

  test('the section heading is not cramped against the cards above it', () => {
    /* MEASURED AGAINST THE CARD GAP, never a typed number: the cards sit 12px
       apart, so a section boundary of 12 was exactly as tight as the gap
       INSIDE a section — the owner's complaint, unfixed. It has to be more. */
    /* RE-POINTED IN PLACE 22 Sep 2026: the gap INSIDE a section is the rail's
       own row gap now, not a card grid's. The RELATION is the claim and is
       unchanged — across a boundary must be more than within one. */
    const secGap = /\.na-sec \+ \.na-sec\{ margin-top:(\d+)px/.exec(HTML);
    const rowGap = /\.na-rows\{[^}]*gap:(\d+)px/.exec(HTML);
    assert.ok(secGap && rowGap, 'both gaps are readable');
    assert.ok(+secGap[1] > +rowGap[1],
      `a section stands clear of the one above: ${secGap[1]}px against ${rowGap[1]}px between rows`);
    assert.match(HTML, /\.na-sec-h\{[^}]*min-height:var\(--field-h,32px\)/, 'the row reserves the form’s own rung');
    assert.match(HTML, /\.na-lob select\{ height:var\(--field-h,32px\)/,
      'and its one control is the size of the controls beside it');
  });

  test('one delegated sweep, and what stays native is NAMED', () => {
    assert.match(CORE, /const SELECT_MENU_SEL = 'select:not\(\[multiple\]\):not\(\[size\]\):not\(\[data-native\]\)'/,
      'a list box is not a dropdown, and there is one escape hatch');
    assert.match(strip(CORE), /function selectMenuSweep\(root\)\{/);
    /* ONE ROOT, ONE LISTENER: a second root over the same control would answer
       one press twice and open the menu twice. */
    assert.match(strip(CORE), /try\{ selectMenuSweep\(\); \}catch\(_\)\{\}/, 'armed once, where the app starts');
    assert.ok(!/selectMenuWire\(fbar/.test(REG), "and the filter bar's own call is retired");
  });

  test('two whole surfaces stand down, asked at the press', () => {
    const i = CORE.indexOf('function selectMenuStandsDown()');
    const w = CORE.slice(i, i + 500);
    assert.ok(i > 0, 'the reading exists');
    assert.match(w, /PORTAL_MODE/, "the counterparty's seat keeps the system's list");
    assert.match(w, /window\.innerWidth < sm/, 'and so does a phone, where the picker is a thumb wheel');
    assert.match(strip(CORE), /if \(selectMenuStandsDown\(\)\) return;/, 'asked at the press, not at the binding');
    /* THE <select> REMAINS THE RECORD and the keyboard is left alone. */
    assert.match(strip(CORE), /new Event\('change', \{ bubbles: true \}\)/,
      "the select's own change still fires");
  });
});
