/* f242 — GREY OUT WHERE HaTi CAN KNOW BEFORE THE PRESS; SPEAK WHERE IT CANNOT.
 *
 * The functional audit found a class of button that is lit, pressable and
 * answers with a refusal — or with nothing at all. The owner's own ruling on
 * how to fix it is the shape this file pins, and the dividing line is one
 * question: CAN HaTi ANSWER THIS WHEN IT DRAWS THE BUTTON?
 *
 *   YES → grey it out, with the reason on hover. A dimmed control that cannot
 *         explain itself is a wall, so the reason is not optional. And a
 *         button wrongly greyed is WORSE than a silent press, because the
 *         reader cannot even try — which is why every one of these is
 *         asserted BOTH WAYS: dead when there is nothing, live when there is.
 *
 *   NO  → say what happened. Either the answer does not exist until the work
 *         runs (a scan, a playbook pass, an integrity check) or the press did
 *         something real and invisible (the clipboard).
 *
 * AND THE ONE RULE THAT MAKES ALL OF THIS NECESSARY: toast(msg) with no kind
 * PRINTS NOTHING. That is deliberate — about 250 ordinary confirmations would
 * otherwise blink after every press — which means a bare call in a place that
 * genuinely owes an answer is invisible, and looks exactly like a dead button.
 * Most of the defects below are one bare call each.
 *
 * THE PHONE IS ITS OWN CASE. Touch has no hover, so a grey row there cannot
 * carry its reason in a title attribute. Those rows keep their tap and talk.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract, SUPPLY_RICH } = require('./world.js');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
/* A bare toast — no second argument — is SILENT. This is the shape to hunt. */
const bare = (src, call) => new RegExp('toast\\(' + call + '\\)\\s*;').test(src);

describe('f242 · the seven that grey out', () => {
  test('Accept all / Reject all ask ONE reading, on all THREE surfaces', () => {
    /* They asked `p.pending` — is anything pending at all — while bulk() behind
       them asks negoBatchSplit, which is narrower on each button: Accept takes
       only what trips no signal, Reject only what came from the other side. So
       on a round where every pending change tripped the playbook, or where all
       of them were ours, they were lit and both answered with a refusal.

       AND THE PAIR IS DRAWN THREE TIMES — negoHeadHtml, negoAllHtml and the
       index column — which is this rulebook's own duplication warning: fixing
       one is not fixing the feature. */
    const src = read('js/views/negotiation.js');
    assert.match(src, /function negoBulkState\(c, side, canAct\)/,
      'one named reading, beside the split it is built on');
    assert.match(src, /negoBulkState,/, 'and it is published');
    const uses = (src.match(/negoBulkState\(c, side, canAct\)/g) || []).length;
    assert.equal(uses, 4, `all three drawing sites ask it, plus the helper itself (found ${uses})`);
    /* Nothing anywhere still decides this on the wider question. */
    assert.ok(!/id="nego-bulk-acc"\$\{p\.pending/.test(src));
    assert.ok(!/id="nego-all-acc"\$\{p\.pending/.test(src));
    assert.ok(!/canAct && p\.pending \? `\s*<button id="nego-all-acc"/.test(src),
      'and the live page no longer HIDES them when nothing is pending — it greys them');
    /* THE REASON IS ON HOVER — a grey button that cannot say why is a wall. */
    for (const k of ['ng_bulk_none_clear', 'ng_bulk_none_theirs', 'ng_bulk_none_pending'])
      assert.match(src, new RegExp(k), `${k} is not used`);
  });

  test('and the batch pair reaches NO live screen today — measured, not assumed', () => {
    /* The finding grey-not-dead-verify made in a real browser, recorded here
       so it cannot be quietly forgotten: the pair left the owner's page and
       the counterparty's page on the same day, and the three builders that
       still emit it are reached only through openNegotiationRoom — whose one
       live caller fires solely when that room is ALREADY open. The repair
       above is right and costs nothing; it is not a fix to a live screen, and
       CLAUDE.md's "their seat keeps them" was stale for a fortnight. */
    /* Written as the RELATION, not a count of mentions: EVERY caller of the
       door onto that room is itself guarded on the room already being open,
       so nothing can arrive there from a cold start. A count would move the
       next time a comment mentions the name. */
    const ct = read('js/views/contract.js');
    const calls = ct.split('\n')
      .map((l, i) => ({ l, i }))
      .filter(x => /openNegotiationOwnerRoom\(/.test(x.l) && !/^function /.test(x.l.trim()));
    assert.ok(calls.length >= 1, 'the door exists');
    for (const { l, i } of calls) {
      const near = ct.split('\n').slice(Math.max(0, i - 3), i + 1).join(' ');
      assert.match(near, /negoRoomIsOpen\(\)/,
        `line ${i + 1} reaches the room without checking it is already open`);
    }
    /* The counterparty's page says so in its own words, and that note is what
       makes the absence a decision rather than an accident. */
    assert.match(read('js/views/portal.js'), /AND NO BULK VERBS EITHER, as of 10 Aug 2026/);
  });

  test('Renumber greys when the plan would move nothing, and still speaks', () => {
    const src = read('js/views/negotiation.js');
    const i = src.indexOf('data-renumber-open');
    const block = src.slice(i - 1400, i + 500);
    assert.match(block, /negoRenumberPlan\(c\)/, 'the door asks the plan, as its handler does');
    assert.match(block, /ng_renumber_no_gaps/, 'and says why on hover');
    /* An unreadable plan is NOT "nothing to do": the door stays live and the
       act says so, rather than the reader being locked out by a failure. */
    assert.match(block, /catch \(e\) \{ \/\* unreadable is not "nothing to do"/);
    assert.ok(!bare(src, "i18t\\('ng_nothing_to_renumber'\\)"),
      'and the refusal behind it is audible for anybody who reaches it another way');
  });

  test('Resubmit greys on the chain\'s own rejected/stale steps', () => {
    const src = read('js/approvals.js');
    const i = src.indexOf('id="ap-resubmit"');
    const block = src.slice(i - 1200, i + 700);
    assert.match(block, /const back=\(st\.chain\|\|\[\]\)\.filter\(x=>x\.status==='rejected'\|\|x\.status==='stale'\)/,
      'the same set resubmitApproval itself requires');
    assert.match(block, /ap_nothing_resubmit/, 'the reason is on hover');
    assert.match(block, /disabled aria-disabled="true"/);
    assert.ok(!bare(src, "i18t\\('ap_nothing_resubmit'\\)"));
  });

  test('Restore this version asks ONE reading, and it is published', () => {
    /* "Go back to v3" stood lit over a contract that already read like v3, and
       answered the press with a refusal — a dead press the reader could only
       discover by making it. */
    const src = read('js/versioning.js');
    assert.match(src, /function restoreNoOpWhy\(c, n\)/);
    assert.match(src, /restoreVersion,restoreBlockedWhy,restoreNoOpWhy,/,
      'published, so nothing has to reach it through a bare cross-module read');
    /* Asked TWICE — by the button and by the act — so a press can never
       contradict what the button was drawn to say. */
    const uses = (src.match(/restoreNoOpWhy\(c\s*,\s*n\)/g) || []).length;
    assert.ok(uses >= 2, `the button and the act ask the same reading (found ${uses})`);
    assert.match(src, /restoreBtn\.disabled=!!noop/);
    assert.match(src, /restoreBtn\.title=noop/, 'the reason is the tooltip');
    assert.ok(!bare(src, "i18t\\('ve_already_reads'\\)"));
  });

  test('the two migration doors were already conditional — said out loud', () => {
    /* NOT a fix, a finding: "Review all" and "Re-run Copilot extraction" only
       render when k.review / heur are non-zero, so neither was ever a dead
       press. What WAS wrong on that screen is every confirmation being a bare
       toast, which is the next block. Asserted so a later change that makes
       them unconditional fails here rather than shipping. */
    const src = read('js/views/migration.js');
    assert.match(src, /canEdit\(\)&&k\.review\?`<button id="mig-review-all"/);
    assert.match(src, /canEdit\(\)&&heur&&API_MODE\(\)&&state\.aiConfigured\?`<button id="mig-rerun"/);
  });
});

describe('f242 · a grey button must go live again when there IS work', () => {
  /* THE HALF THAT MATTERS MOST. A button wrongly greyed is worse than a silent
     press: the reader cannot even try, and there is nothing on screen to say
     why not. These drive the REAL builder — negoPanesHtml, which is what the
     bench, the contract tab and the counterparty's page all mount — over a
     real contract, and read the drawn markup. */
  /* A RICH contract, because negoClauseList only stamps clause ids on stored
     rich wording — the shape f207/f208 use, and the shape a real negotiation
     always has. Without it the ids come back undefined and every filing is
     accepted and lands nowhere, which is a fixture that proves nothing. */
  const stage = () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const { win } = w;
    const c = supplyContract({ redlineText: SUPPLY_RICH, format: 'rich' });
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.negoInit(c);
    return { win, c, cl: win.negoClauseList(c)[0].clauseId };
  };
  const draw = (win, c, side) => win.negoPanesHtml(c, { side, canAct: true, persist: false });
  const dead = (html, id) =>
    new RegExp(`id="${id}"[^>]*\\bdisabled\\b`).test(html);

  /* AWAITED — negoEditClause is async (it fingerprints, which is a real hash).
     Un-awaited, the filing has not landed when the markup is read, and the
     button correctly draws dead: a fixture that proves the opposite of what it
     claims. */
  test('Accept all is dead with nothing pending and live with a clear ask', async () => {
    const { win, c, cl } = stage();
    let html = draw(win, c, 'owner');
    assert.ok(dead(html, 'nego-bulk-acc'), 'with nothing pending it is dead');
    assert.match(html, /Nothing is pending/, 'and says why rather than leaving a wall');

    /* A change of THEIRS, on wording that trips no playbook or scan signal.
       Filed through negoEditClause — the ordinary route every screen uses. */
    await win.negoEditClause(c, cl,
      '<p>The parties shall meet quarterly to review delivery performance.</p>',
      { side: 'counterparty', author: 'Their Counsel' });
    html = draw(win, c, 'owner');
    assert.ok(!dead(html, 'nego-bulk-acc'), 'with a clear pending change of theirs, Accept all is live');
    assert.ok(!dead(html, 'nego-bulk-rej'), 'and so is Reject all');
  });

  test('Reject all stays dead when everything pending is OURS', async () => {
    /* The narrower question the old guard could not ask: things ARE pending,
       and none of them is theirs to reject. */
    const { win, c, cl } = stage();
    await win.negoEditClause(c, cl,
      '<p>Each party shall bear its own costs of this Agreement.</p>',
      { side: 'owner', author: 'Us' });
    const html = draw(win, c, 'owner');
    assert.ok(dead(html, 'nego-bulk-rej'), 'nothing of theirs is pending, so it is dead');
    assert.match(html, /No changes from the other side are pending/,
      'and the reason is on the button, not left for the press to reveal');
  });
});

describe('f242 · the seven that speak, because greying is impossible', () => {
  test('Run scan says "no issues found" — the commonest outcome', () => {
    /* The clean result rode a bare toast, so a scan that ran, cost money and
       wrote an audit line answered with silence. */
    const src = read('js/ai.js');
    /* TWO DOORS ONTO ONE ACT — the register row's runScanFor and the contract's
       own runScan — and both had the same bare toast. Fixing one would have
       been the duplication warning in its usual direction. */
    assert.match(src, /toast\(n \? i18tn\('ai_scan_found',n,\{n\}\) : i18t\('ai_scan_clean'\), 'ok'\)/);
    assert.match(src, /toast\(n \? i18tn\('ai_scan_pinned',n,\{n\}\) : i18t\('ai_scan_clean'\), 'ok'\)/);
    assert.ok(!/'Scan complete — no issues found'/.test(src),
      'and neither is an English literal any more');
  });

  test('the playbook pass says so when everything is aligned', () => {
    const src = read('js/views/negotiation.js');
    assert.match(src, /i18t\('ng_pb_all_aligned'\) : i18t\('ng_pb_nothing_proposable'\)/);
    assert.match(src, /aligned === rev\.verdicts\.length \? 'ok' : 'warn'/,
      "the best outcome is 'ok', the other is 'warn'");
  });

  test('Verify integrity reports BOTH verdicts a real customer meets', () => {
    /* Every refusal was loud and every success was silent — so a valid seal,
       and a migrated contract (paper executed outside HaTi, which is the
       commonest sealed record there is), both said nothing. */
    const src = read('js/core.js');
    assert.match(src, /toast\(i18t\('co_seal_migrated',\{h:[\s\S]{0,60}?\}\),'ok'\)/);
    assert.match(src, /toast\(ok,'ok'\);/);
    assert.ok(!bare(src, 'ok'), 'the good verdict is not a bare call any more');
  });

  test('the document editor says "no changes made" before it closes', () => {
    const src = read('js/views/contract.js');
    assert.match(src, /toast\(i18t\('ct_no_changes_made'\),'warn'\)/);
  });

  test('every copy-to-clipboard confirms — the clipboard is invisible', () => {
    /* Nothing on screen changes when a copy succeeds, so this is exactly the
       case where a confirmation is owed, and all of them were bare. */
    const files = ['js/core.js', 'js/views/portal.js', 'js/views/advice.js',
      'js/views/adviceportal.js', 'js/views/templatebuilder.js', 'js/views/negotiation.js'];
    const silent = [];
    for (const f of files) {
      const lines = read(f).split('\n');
      lines.forEach((l, i) => {
        if (!/clipboard\.writeText|execCommand\('copy'\)/.test(l)) return;
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const m = lines[j].match(/toast\(([^;]*)\)\s*;/);
          if (!m) continue;
          if (!/'(ok|warn|err)'/.test(m[1])) silent.push(`${f}:${j + 1}`);
          break;
        }
      });
    }
    assert.deepEqual(silent, [], 'these copy and say nothing');
  });

  test('"Stop after current" and the migration confirmations speak', () => {
    /* Stop sets a flag; nothing on screen moves until the file in flight
       finishes, so a silent toast made the one control that stops a long
       import read as a dead press. */
    const src = read('js/views/migration.js');
    assert.match(src, /toast\(i18t\('mig_stopping'\),'warn'\)/);
    assert.match(src, /toast\(i18tn\('mig_review_pass_done',done,\{n:done\}\),'ok'\)/);
    assert.match(src, /toast\(i18t\('mig_nothing_waiting'\),'warn'\)/);
    assert.match(src, /migState\(\)\.aiDown \? 'warn' : 'ok'/);
  });

  test('the Copilot engine panel\'s four saves confirm', () => {
    /* A real Save on a panel whose fields do not visibly change. The ~250
       quiet confirmations elsewhere on that page stay quiet — those are
       panels that already wrote what changed and have no Save at all. */
    const src = read('js/views/settings.js');
    for (const k of ['set_key_saved', 'set_model_saved', 'set_key_removed', 'set_limits_saved'])
      assert.match(src, new RegExp(`toast\\(i18t\\('${k}'\\),'ok'\\)`), `${k} is silent`);
  });
});

describe('f242 · the phone talks, because touch has no hover', () => {
  test('the three dimmed rows keep their tap and explain themselves', () => {
    const src = read('js/mobile-contract.js');
    assert.match(src, /toast\(M_DESK_MSG,'warn'\)/);
    assert.match(src, /toast\(i18t\('mc_sealed_no_edit'\),'warn'\)/);
    assert.match(src, /toast\(i18t\('mc_never_renumber'\),'warn'\)/);
    /* 'warn' rather than 'err': nothing failed and nothing was refused
       unexpectedly — this is a rule, stated. */
    assert.ok(!/toast\(M_DESK_MSG\)/.test(src));
  });

  test('and the phone still files no changes of its own', () => {
    /* The standing rule, re-checked because this batch touched these files. */
    const src = read('js/mobile-contract.js') + read('js/mobile-screens.js') + read('js/mobile.js');
    assert.ok(!/changes\.push\(|negoFileChange\(/.test(src));
  });
});

describe('f242 · every new reason exists in both languages', () => {
  test('a grey button whose tooltip is a key name is worse than no tooltip', () => {
    const i18n = read('js/i18n.js');
    const m = i18n.match(/const STRINGS = \{[\s\S]*?\n\};/);
    const g = {};
    // eslint-disable-next-line no-new-func
    new Function('x', m[0].replace('const STRINGS =', 'x.S =') + ';')(g);
    const keys = ['ng_bulk_none_pending', 'ng_bulk_none_clear_one', 'ng_bulk_none_clear_other',
      'ng_bulk_none_theirs', 'ng_renumber_no_gaps', 'ng_pb_all_aligned',
      'ng_pb_nothing_proposable', 'ai_scan_clean', 'ai_scan_found_one', 'ai_scan_found_other',
      'co_seal_valid_file', 'co_seal_valid_text', 'co_seal_migrated',
      'mig_review_pass_done_one', 'mig_review_pass_done_other',
      'mig_rerun_stopped', 'mig_rerun_done_one', 'mig_rerun_done_other', 'adv_track_copied'];
    for (const lang of Object.keys(g.S)) {
      const gaps = keys.filter(k => g.S[lang][k] == null);
      assert.deepEqual(gaps, [], `${lang} would print the key name on a tooltip`);
    }
  });
});
