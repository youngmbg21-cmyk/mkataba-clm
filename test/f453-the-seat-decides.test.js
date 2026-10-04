/* ============================================================
   F453 — The seat decides
   ============================================================
   Young picked this by name from three in the decision pack of 4 October 2026.
   Not a mode switch beside the text size, and not a per-person setting — THE
   SEAT DECIDES.

   THE GAP, and it is not the one the desk already closed. js/desk.js has said
   since its first day that a contributor's work "does not travel", and that
   was true of SENDING only: what a contributor typed went straight into our
   draft. So the lead opened the contract on Monday to wording they had never
   agreed to, with nothing on the page to tell them which of forty clauses a
   colleague had moved. The wall was in the right place and the lead still had
   no way to see what they were being asked to stand behind.

   SO A CONTRIBUTOR PROPOSES AND THE LEAD ADOPTS. One stamp, written in the one
   funnel every authoring path converges on, by a question the desk was already
   asking there: which seat is this person in. A suggestion is kept out of
   every send by the arithmetic that keeps a held change back, and the lead has
   two acts on it — adopt it, or hand it back with a reason.

   OFF WHEREVER THE DESK IS OFF, which is everywhere by default. There is no
   second setting, because a rule about seats that could be on while seats were
   off would be a rule about nothing.

   IT NEVER THROWS WORK AWAY. Handing a suggestion back keeps every word and
   adds the reason — the desk's own oldest rule, written at deskContributors:
   you take somebody off a deal and you do not lose four clauses of redlining
   with them. There is no Discard on this strip.

   AND NOBODY RULES ON THEIR OWN. A contributor made the lead on Tuesday still
   cannot wave Monday's own wording through. The room's rule, kept at reviewMark
   and at the approval chain, kept here too.

   WHAT THIS FILE WATCHES is the five ways the idea could rot: the stamp written
   at a door instead of the funnel, a suggestion reaching the counterparty, the
   wall living only in the browser, the author adopting their own, and the two
   waiting-lists adding up to more than there are. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const DESK = read('js/desk.js');
const NEGO = read('js/negotiation.js');
const VIEW = read('js/views/negotiation.js');
const CORE = read('js/core.js');
const SRV = read('server/server.js');
const HOME = read('js/views/home.js');
const INS = read('js/views/inspector.js');
const I18N = read('js/i18n.js');

/* COMMENTS ARE NOT CODE — the rulebook's own rule, and this build broke two
   other tests by forgetting it in both directions on one night. */
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

const MODEL = bare(DESK.slice(DESK.indexOf('function deskSuggestion(ch)'),
  DESK.indexOf("if (typeof document !== 'undefined') deskWireChip();")));
const SRVMODEL = bare(SRV.slice(SRV.indexOf('const dkSuggestion ='),
  SRV.indexOf('/* Did this save add, remove or reword one of OUR changes?')));

describe('f453 (1) — the stamp is written in the FUNNEL', () => {
  test('negoFileChange stamps it, and nothing else does', () => {
    assert.match(bare(NEGO), /deskStampOnFile\(c, side, ch\)/,
      'the clause editor, the clause library, Copilot\'s shortcut, both playbook '
      + 'entrances and the Word round-trip all arrive here; a stamp written at '
      + 'any one of those is a stamp the other five never make');
    /* Counted as CALLS rather than as mentions: the one call site reads it
       through window first (the ES-module rule), so the name appears twice on
       that line and neither is a second door. */
    const calls = [...bare(NEGO + VIEW + CORE).matchAll(/deskStampOnFile\(/g)].length;
    assert.equal(calls, 1, 'one caller, or it is not a funnel');
    assert.ok(!/\.suggested\s*=/.test(bare(NEGO + VIEW + CORE)),
      'and nothing writes the field by hand around it');
  });

  test('it is stamped BEFORE the change is on the record', () => {
    const fn = bare(NEGO);
    const stamp = fn.indexOf('deskStampOnFile(');
    const push = fn.indexOf('c.changes.push(ch)');
    assert.ok(stamp > 0 && push > 0 && stamp < push,
      'deskSuggestedIds reads c.changes, so a payload built in the instant '
      + 'between the push and the stamp would carry wording the lead never saw');
  });

  test('and it refuses nothing and says nothing', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskStampOnFile'),
      MODEL.indexOf('function deskMayRuleSuggestion'));
    /* RE-POINTED 4 Oct 2026 (f487, one ask record): the stamp is written by
       the ONE ASK WRITER — the question on c.asks and ch.suggested, its
       mirror, in one breath — so the act is the writer's call here and the
       field's line is the writer's suggest mirror in js/asks.js. */
    assert.match(fn, /askOpen\(c, \{ kind: 'suggest'/, 'a not-doing proves nothing over an empty slice');
    assert.match(read('js/asks.js'), /ch\.suggested = \{ by:/, 'and the writer stamps the change itself');
    assert.ok(!/toast\(|_dkSay\(/.test(fn),
      'filing a redline is the act the person meant to perform; deskClaimOnFile '
      + 'beside it is quiet for the same reason');
  });

  test('only a contributor is stamped — never the lead, never a stranger', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskStampOnFile'),
      MODEL.indexOf('function deskMayRuleSuggestion'));
    assert.match(fn, /side !== 'owner'\) return null/, 'their wording is not our colleague\'s suggestion');
    assert.match(fn, /!deskEnforced\(\) \|\| !deskIsOpen\(c\)\) return null/,
      'off by default, and the back catalogue has no desk');
    assert.match(fn, /deskIsLead\(c, me\)\) return null/, 'the lead proposes nothing to themselves');
    assert.match(fn, /!deskHasSeat\(c, me\)\) return null/,
      'and a reader with no seat could not have filed at all');
  });
});

describe('f453 (2) — a suggestion does not travel', () => {
  test('the payload subtracts it, unconditionally', () => {
    const fn = bare(CORE.slice(CORE.indexOf('function buildSharePayload'),
      CORE.indexOf('const shareChanges =')));
    assert.match(fn, /deskSuggestedIds\(c\)\) heldBack\.add\(id\)/,
      'not behind an opts flag: reshareToLastRecipient — the round-send every '
      + 'negotiation after the first travels on — passes no options at all');
  });

  test('and the ROUTE subtracts it too, because an allow-list holds only until somebody adds a field', () => {
    assert.match(bare(SRV), /for \(const id of dkSuggestedIds\(rvStored\)\) withheld\.add\(id\)/,
      'added to the one set the route already strips, so the count the sender '
      + 'is told is the whole of what stayed behind');
  });

  test('both readings measure "unsent" the same way', () => {
    assert.match(MODEL, /negotiation && c\.negotiation\.turnAt/,
      'wording the counterparty already holds cannot be recalled, and a payload '
      + 'that quietly dropped it would read to them as us rewriting history');
    assert.match(SRVMODEL, /rvUnsentOurs\(c\)/,
      'the server asks the arithmetic it already had, so the two cannot disagree '
      + 'about what is still ours to hold');
  });

  test('and the counting never starts a negotiation', () => {
    assert.ok(!/negoChanges\(|negoUnsentAsks\(|negoInit\(|negoRound\(/.test(MODEL),
      'READING MUST NOT WRITE: those run negoInit, and a payload being built is '
      + 'the last place that may create a negotiation');
    assert.match(MODEL, /Array\.isArray\(c && c\.changes\) \? c\.changes : \[\]/,
      'read raw');
  });
});

describe('f453 (3) — the server is the wall', () => {
  test('the stamp is guarded as a DIFFERENCE against the stored record', () => {
    assert.match(bare(SRV), /const sgWhy = dkSuggestionRefusal\(prev, c, req\.user\)/,
      'without it the whole feature is one request wide: delete the stamp, then send');
    assert.match(SRVMODEL, /function dkSuggestionRefusal/);
    assert.match(SRVMODEL, /before\[id\] === after\[id\]\) continue/,
      'every save that moves no stamp passes untouched, so it costs nothing on '
      + 'the ordinary write');
  });

  test('it reads the rule from the STORED settings, never from the request', () => {
    assert.match(SRVMODEL, /!deskRuleOn\(\) \|\| !deskIsClaimed\(prev\)\) return null/,
      'deskRuleOn is the server\'s own reading of appSettings — the browser\'s '
      + 'copy of a rule is cosmetics');
    assert.ok(!/req\.(body|query)[\s\S]{0,40}suggest/i.test(SRVMODEL));
  });

  test('a settled suggestion cannot be rewritten, by anybody', () => {
    assert.match(SRVMODEL, /!dkSuggestionOpen\(ch\)\) \{[\s\S]*?already been settled cannot be changed/,
      'a lead who could un-adopt could take their own name off the decision');
  });

  test('and the two refusals are different mistakes, said differently', () => {
    assert.match(SRVMODEL, /not yours to adopt/);
    assert.match(SRVMODEL, /can adopt a colleague/);
    assert.ok(SRVMODEL.indexOf('not yours to adopt') !== SRVMODEL.indexOf('can adopt a colleague'),
      '"that is not yours" and "that is your own" are the two things a caller '
      + 'can get wrong here, and telling them apart is what makes a refusal useful');
  });
});

describe('f453 (4) — nobody rules on their own suggestion', () => {
  test('the author is refused in the model, on both hosts', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskMayRuleSuggestion'),
      MODEL.indexOf('const _dkChange ='));
    assert.match(fn, /_dkSamePerson\(\{ id: g\.byId, name: g\.by \}, me\)\) return false/,
      'a contributor made the lead on Tuesday must not be able to wave Monday\'s '
      + 'own wording through');
    assert.match(SRVMODEL, /String\(g\.byId\) === String\(user\.id\)\) return false/,
      'and the browser is not where that is decided');
  });

  test('an admin can act, and the lead can, and nobody else', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskMayRuleSuggestion'),
      MODEL.indexOf('const _dkChange ='));
    assert.match(fn, /_dkIsAdmin\(me\) \|\| deskIsLead\(c, me\)/,
      'deskMayManage\'s own two names: adopting a colleague\'s wording into the '
      + 'round we will send is the lead\'s act in the way naming a contributor is');
  });

  test('both acts ask it, and refuse out loud', () => {
    for (const name of ['deskAdoptSuggestion', 'deskReturnSuggestion']){
      const fn = MODEL.slice(MODEL.indexOf('function ' + name), MODEL.indexOf('function ' + name) + 1400);
      assert.match(fn, /!deskMayRuleSuggestion\(c, ch, me\)/, name + ' does not ask who is pressing');
      assert.match(fn, /dk_sg_not_your_own[\s\S]{0,60}dk_sg_lead_only/,
        name + ' must say WHICH refusal it is');
    }
  });
});

describe('f453 (5) — handing it back keeps the work, and needs a reason', () => {
  test('a reason is required', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskReturnSuggestion'),
      MODEL.indexOf('function deskSuggestionsFor'));
    assert.match(fn, /if \(!reason\) \{[\s\S]*?dk_sg_why_needed/,
      'a suggestion handed back without one is a colleague staring at a clause '
      + 'with no idea what to do next');
    assert.match(fn, /_dkClamp\(why, DK_WHY_MAX\)/,
      'and it is a sentence, not an essay — the cap the desk already keeps');
  });

  test('nothing is deleted, withdrawn or superseded', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskReturnSuggestion'),
      MODEL.indexOf('function deskSuggestionsFor'));
    /* RE-POINTED 4 Oct 2026 (f487): the hand-back is written through the one
       ask writer; the field's line is its suggest mirror. */
    assert.match(fn, /askAnswer\(c, 'sg:' \+ ch\.id, \{ state: 'returned', at: _dkNow\(\)/, 'the act is here to be read, or this claim is about nothing');
    assert.match(read('js/asks.js'), /g\.why = a\.why \|\| null; g\.returnedAt = at; g\.returnedBy = name;/);
    assert.ok(!/withdrawn|status\s*=|splice|delete ch|bodyHtml/.test(fn),
      'the desk\'s oldest rule, at deskContributors: you take somebody off a '
      + 'deal and you do not lose four clauses of redlining with them');
    assert.ok(!/dk_sg_discard|Discard/.test(MODEL), 'and there is no Discard on this strip');
  });

  test('an adopted suggestion keeps its stamp', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskAdoptSuggestion'),
      MODEL.indexOf('function deskReturnSuggestion'));
    /* RE-POINTED 4 Oct 2026 (f487): adopted through the one ask writer. */
    assert.match(fn, /askAnswer\(c, 'sg:' \+ ch\.id, \{ state: 'yes', at: _dkNow\(\)/);
    assert.match(read('js/asks.js'), /g\.adoptedAt = at; g\.adoptedBy = name;/);
    assert.ok(!/delete ch\.suggested|ch\.suggested = null/.test(fn),
      '"whose idea was this clause" is a question the trail should answer a year '
      + 'on; a field that erased itself would make every adopted suggestion look '
      + 'like the lead\'s own work');
  });

  test('and both acts write an audit line', () => {
    assert.match(MODEL, /_dkAudit\(c, 'Suggestion adopted'/);
    assert.match(MODEL, /_dkAudit\(c, 'Suggestion handed back'/);
  });
});

describe('f453 (6) — a suggestion waits on exactly one of two people', () => {
  test('the lead\'s list drops the ones already handed back', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskSuggestionsFor'),
      MODEL.indexOf('function deskSuggestionsBackTo'));
    assert.match(fn, /!x\.suggested\.returnedAt/,
      'they have already answered it; the turn is the author\'s, and it comes '
      + 'back when the author files again');
  });

  test('the author\'s list holds exactly those', () => {
    const fn = MODEL.slice(MODEL.indexOf('function deskSuggestionsBackTo'),
      MODEL.indexOf('function deskSuggestionSay'));
    assert.match(fn, /g\.returnedAt/);
    assert.match(fn, /_dkSamePerson\(\{ id: g\.byId, name: g\.by \}, me\)/);
  });

  test('neither list is drawn where the rule is off', () => {
    for (const name of ['deskSuggestionsFor', 'deskSuggestionsBackTo']){
      const fn = MODEL.slice(MODEL.indexOf('function ' + name), MODEL.indexOf('function ' + name) + 700);
      assert.match(fn, /!deskEnforced\(\) \|\| !deskIsOpen\(c\)\) return \[\]/, name);
    }
  });
});

describe('f453 (7) — it is said where the reader is, by one builder', () => {
  test('both card renderers draw the SAME strip', () => {
    const hits = [...VIEW.matchAll(/deskCardSuggestHtml\(c, ch, opts\)/g)].length;
    assert.equal(hits, 2,
      'THE CLOTHES FOLLOW THE BUILDER: this is exactly the kind of feature that '
      + 'gets built in one renderer and forgotten in the other');
    assert.match(DESK, /function deskCardSuggestHtml/, 'and it is built in js/desk.js, once');
  });

  test('never on their seat, and nothing once it is adopted', () => {
    const fn = bare(DESK.slice(DESK.indexOf('function deskCardSuggestHtml'),
      DESK.indexOf('function deskSuggestionCountSay')));
    assert.match(fn, /!deskSeatShowsDesk\(opts\)\) return ''/,
      'a suggestion names a colleague and says our own side has not agreed with '
      + 'itself yet — the most internal fact on the card');
    assert.match(fn, /g\.adoptedAt\) return ''/, 'the wording is simply ours from then on');
  });

  test('the acts are on the strip, and only for whoever may press them', () => {
    const fn = bare(DESK.slice(DESK.indexOf('function deskCardSuggestHtml'),
      DESK.indexOf('function deskSuggestionCountSay')));
    assert.match(fn, /data-dk-adopt=/);
    assert.match(fn, /data-dk-return=/);
    assert.match(fn, /!opts\.readonly && deskMayRuleSuggestion\(c, ch, me\)/,
      'a dead button wearing a live one\'s clothes is a fault; and a sentence '
      + 'saying somebody must adopt this, with no way to adopt it, is the same '
      + 'fault one step quieter');
  });

  test('the presses are delegated, so they work on both surfaces', () => {
    const h = bare(VIEW.slice(VIEW.indexOf("const sgA = t.closest('[data-dk-adopt]')"),
      VIEW.indexOf("const lad = t.closest('[data-rl-ladder]')")));
    assert.match(h, /rlLadderContract\(\)/,
      'the contract is fetched at the press, never closed over — a listener '
      + 'armed at module load would act on whatever was open when the page drew');
    assert.match(h, /deskAdoptSuggestion\(cc, id\)/);
    assert.match(h, /deskReturnSuggestion\(cc, id, why\)/);
    assert.match(h, /promptDialog\(/, 'the reason is asked for, not assumed');
  });

  test('and it is a row on Home\'s one list and on the contract\'s checklist', () => {
    assert.match(bare(HOME), /kind:'suggest'/);
    assert.match(bare(HOME), /deskSuggestionsFor\(c, me\)/, 'one reading, two homes');
    assert.match(HOME, /const NEEDS_YOU_ORDER = \[[^\]]*'suggest'/,
      'or the row is drawn in an order that moves between paints');
    assert.match(INS, /suggest: 'home_verb_answer'/);
    assert.match(INS, /suggest: 'ins_need_go_nego'/, 'the door is where the strip is');
    assert.match(bare(INS), /it\.kind === 'suggest'/, 'and it has words of its own');
  });

  test('every sentence is in both books', () => {
    /* Swept over the WHOLE module, not the model slice: the strip builder and
       the count sentence sit further up the file, and a claim that read only
       part of it would pass over the keys most likely to be forgotten. */
    const keys = [...new Set([...bare(DESK).matchAll(/i18tn?\('(dk_sg_[a-z_]+)'/g)].map(m => m[1]))];
    assert.ok(keys.length >= 8, 'the model is written in the string book, not in the page');
    for (const k of keys){
      const want = /_(held|wait)$/.test(k) ? [k + '_one', k + '_other'] : [k];
      for (const kk of want)
        assert.ok(I18N.split(kk + ':').length - 1 >= 2, kk + ' is missing from one of the two books');
    }
  });
});

describe('f453 (8) — and there is no second setting', () => {
  test('the desk rule is the only switch', () => {
    assert.ok(!/suggestRule|suggestingMode|appSettings[\s\S]{0,30}suggest/i.test(bare(DESK + SRV + CORE)),
      'a rule about seats that could be on while seats were off would be a rule '
      + 'about nothing — and it would be a second thing for an admin to get wrong');
    assert.match(MODEL, /deskEnforced\(\)/, 'it asks the desk\'s own rule');
  });
});
