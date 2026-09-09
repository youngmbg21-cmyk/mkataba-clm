/* ============================================================
   F273 — Auto-triage on upload
   ============================================================
   Owner-approved design, 9 Sep 2026, after four rulings and one correction:
   the card goes on Home in the list that already exists, the tick-box on the
   upload screen is how it is asked for, the signing-route tile is held back,
   and obligations are proposed rather than filed.

   THE CONTROL COMES FIRST. Two of the four readings live in js/ai.js, which
   this world cannot load, so they are stood in for — and a stand-in kinder
   than the thing it replaces turns every claim below into a description. The
   other two are the PRODUCT'S OWN functions running their own off-line
   heuristics, and section 1 proves they really answer before anything else is
   asserted. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
/* THE SWEEPS BELOW READ CODE, NOT PROSE. This file's own comments name the
   doors it must never use — "runFindObligations is deliberately NOT the door
   used here" — so a grep over the raw source finds the warning and reports it
   as the fault. Stripped, the claim is about what the file DOES. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const TRI = read('js/triage.js');
const TRI_CODE = strip(TRI);
const HOME_CODE = strip(read('js/views/home.js'));
const HOME = read('js/views/home.js');
const CONTRACT = read('js/views/contract.js');
const I18N = read('js/i18n.js');
const NEGO = read('js/negotiation.js');
const API = read('js/api.js');
const AI_SRC = read('js/ai.js');
const OB_SRC = read('js/obligations.js');
const PB_SRC = read('js/playbook.js');

const TEXT = 'The Buyer shall pay each undisputed invoice within sixty (60) days of receipt. '
  + 'The Supplier shall submit a quarterly volume forecast within 10 days of each quarter end. '
  + 'The Supplier shall maintain insurance for the term. '
  + 'This Agreement is governed by the laws of California. ';

function stage(over){
  const { win, log } = buildWorld({ triage: true });
  win.FOLDERS = { proc: { name: 'Supply & Logistics' } };
  const c = Object.assign({
    id: 'MK-407', name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB',
    status: 'Under Review', source: 'upload', folder: 'proc',
    owner: { id: 'u1', name: 'Wanjiru Kamau' },
    audit: [], obligations: [], comments: [],
    upload: { name: 'Supply_Agreement_v3.docx', extractedText: TEXT },
  }, over || {});
  win.state.contracts = [c];
  return { win, log, c };
}

describe('F273 — auto-triage on upload', () => {

  /* --------------------------------------------------------------- */
  describe('1 · the stage answers before anything else is asserted', () => {
    test('the two real readings really run — a null below means null', async () => {
      const { win, c } = stage();
      const pb = await win.runPlaybookReview(c, { quiet: true });
      assert.ok(pb && Array.isArray(pb.verdicts) && pb.verdicts.length,
        'the playbook engine answers on this stage');
      const ob = await win.extractObligations(c, { quiet: true });
      assert.ok(Array.isArray(ob) && ob.length, 'and the obligations reader finds something');
    });
    test('and the two stand-ins can FAIL the way the real ones fail', async () => {
      const { win } = stage();
      assert.equal(typeof win._ai, 'object', 'they are scriptable');
      win._ai.briefThrows = true;
      await assert.rejects(() => win.runContractBrief({}, { quiet: true }));
    });
  });

  /* --------------------------------------------------------------- */
  describe('2 · what it runs, and what it refuses to run on', () => {
    test('only a received document is triaged', () => {
      const { win } = stage();
      assert.equal(win.triageApplies({ source: 'upload' }), true);
      assert.equal(win.triageApplies({ source: null }), false,
        'a contract HaTi drafted was written here — there is nothing to discover in it');
      assert.equal(win.triageApplies(null), false);
    });
    test('four readings, and the free one goes first', () => {
      const { win } = stage();
      /* Compared as a STRING: the list is built in the world's own realm, so a
         deep-equal against a local array fails on the prototype rather than on
         the value. */
      assert.equal(win.TRIAGE_STEPS.join(','), 'risk,brief,playbook,oblig');
      /* Asserted off the CALLS rather than off a comment: risk is
         deterministic and instant, so the card has something on it before the
         paid readings come back. */
      const at = n => TRI_CODE.indexOf(n);
      assert.ok(at('runScan(c)') < at('runContractBrief'), 'risk before the brief');
      assert.ok(at('runContractBrief') < at('runPlaybookReview'), 'brief before the standards');
      assert.ok(at('runPlaybookReview') < at('extractObligations'), 'standards before obligations');
    });
    test('all four land, and each records what it found', async () => {
      const { win, c } = stage();
      const t = await win.triageRun(c);
      for (const k of win.TRIAGE_STEPS)
        assert.equal(t.steps[k].ok, true, k + ' ran');
      assert.ok(t.at, 'stamped when');
      assert.equal(t.seenAt, null, 'and nobody has acknowledged it yet');
    });
  });

  /* --------------------------------------------------------------- */
  describe('3 · obligations are PROPOSED, never filed', () => {
    test('the list is held on the triage record and the contract gains none', async () => {
      const { win, c } = stage();
      const t = await win.triageRun(c);
      assert.ok(t.steps.oblig.found.length >= 1, 'the scan found something');
      assert.equal(c.obligations.length, 0,
        'and NOT ONE of them reached the record — a person still ticks');
    });
    test('and it never opens the review dialog', () => {
      assert.ok(!/runFindObligations|openObligationsReview/.test(TRI_CODE),
        'the dialog is right for somebody who pressed a button and wrong for a file landing');
    });
  });

  /* --------------------------------------------------------------- */
  describe('4 · it presses the product\'s own readings and owns none', () => {
    test('no route, no fetch, no second reading', () => {
      for (const bad of ['api(', 'fetch(', 'ai/', 'anthropic'])
        assert.ok(!TRI_CODE.includes(bad), 'triage must never call out on its own: ' + bad);
    });
    test('the playbook result is stored exactly where the Checks card stores it', async () => {
      const { win, c } = stage();
      await win.triageRun(c);
      assert.ok(c.playbook && Array.isArray(c.playbook.verdicts),
        'c.playbook, the same field the manual press writes');
      assert.ok((c.audit || []).some(a => a.action === 'Playbook'),
        'with the same audit line, so the two paths leave one record shape');
    });
    test('and it writes one line of its own, about what was READ', async () => {
      const { win, c } = stage();
      await win.triageRun(c);
      const line = (c.audit || []).find(a => a.action === 'Read');
      assert.ok(line, 'a line saying the contract was read');
      assert.match(line.detail, /4 of 4/, 'and how much of it landed');
    });
  });

  /* --------------------------------------------------------------- */
  describe('5 · it fails quietly, and says so on the card', () => {
    test('three readings failing raises NO toast', async () => {
      const { win, log, c } = stage({ upload: { name: 's.pdf', extractedText: '' } });
      win._ai.briefThrows = true;
      const before = log.toasts.length;
      await win.triageRun(c);
      assert.equal(log.toasts.length, before,
        'four red boxes for one upload is the fault this product was rung about');
    });
    /* AND THE ONE TOAST IT COULD NOT REACH (owner-reported 9 Sep 2026, off an
       upload: a red box saying the Copilot answer was cut short, "Try again, or
       narrow what you asked for"). Each reading suppresses its OWN toast, and
       none of them could suppress api()'s — which surfaces the server's
       `notice` centrally for all ~200 callers. So the promise held for every
       refusal and broke on the one the server volunteers.
       THE SWEEP IS THE CLAIM: all three readings hand `quiet` down, so a fourth
       one added later fails here rather than shouting over somebody's upload. */
    test('a quiet reading also silences the central notice toast', () => {
      assert.match(API, /if\(data&&data\.notice&&!\(opts&&opts\.quiet\)/,
        'api() honours it');
      for (const [name, src] of [['brief', AI_SRC], ['obligations', OB_SRC], ['playbook', PB_SRC]])
        assert.match(src, /quiet:!!opts\.quiet/, name + ' passes it down');
    });
    test('but the cap itself is handed back, never swallowed', () => {
      /* Suppressing the box without carrying the fact turns a badly-worded
         warning into a silent trim, which is worse. `opts` is already each
         reading's out-param for a refusal, so the cap rides the same way. */
      for (const [name, src] of [['brief', AI_SRC], ['obligations', OB_SRC], ['playbook', PB_SRC]])
        assert.match(src, /if\(r&&r\.notice\) opts\.notice=r\.notice;/, name + ' hands it back');
      assert.match(TRI, /cut: o\.notice \|\| ''/, 'and triage records it on the step');
    });
    test('and every failure is recorded with its reason', async () => {
      const { win, c } = stage({ upload: { name: 's.pdf', extractedText: '' } });
      win._ai.briefThrows = true; win._ai.scanThrows = true;
      const t = await win.triageRun(c);
      for (const k of win.TRIAGE_STEPS){
        assert.equal(t.steps[k].ok, false, k + ' could not run');
        assert.ok(t.steps[k].why, k + ' says why');
      }
      assert.equal(win.triageReadAnything(c), false,
        'so the card can draw amber rather than pretending it read the contract');
    });
    test('QUIET SUPPRESSES THE TOAST AND NOTHING ELSE', () => {
      /* Written the other way round, quiet took the FALLBACK with the toast:
         where the AI leg throws, a loud caller falls through to the heuristic
         — a real reading — and the quiet one returned "unavailable". So the
         card would have reported nothing found on a contract a person pressing
         the same button would have got answers for. A quiet caller may never
         be quieter AND worse. */
      const OB = strip(fs.readFileSync('js/obligations.js', 'utf8'));
      const PB = strip(fs.readFileSync('js/playbook.js', 'utf8'));
      assert.match(OB, /catch\(e\)\{ if\(!opts\.quiet\) toast\(i18t\('ob_scan_unavailable'\),'err'\); \}/,
        'the obligations scan still falls through to the heuristic');
      assert.match(PB, /catch\(e\)\{ if\(!opts\.quiet\) toast\(i18t\('pb_review_unavailable'\),'err'\); \}/,
        'and so does the standards check');
      for (const [f, src] of [['obligations', OB], ['playbook', PB]])
        assert.ok(!/quiet\)\s*return \{ error:i18t\('(ob_scan|pb_review)_unavailable'\)/.test(src),
          f + ': a quiet caller must not lose the fallback a loud one keeps');
      /* WHERE THERE IS GENUINELY NO ANSWER the reason IS handed back, because
         the caller has to print it where the reader is looking. */
      assert.match(OB, /if\(opts\.quiet\)\{ opts\.error=i18t\('ob_no_readable'\); return \[\]; \}/);
      assert.match(PB, /if\(opts\.quiet\) return \{ error:i18t\('pb_no_readable_clause'\) \};/);
    });
    test('a document with no text is read by NOTHING, and pays for nothing', async () => {
      /* The commonest shape this feature meets: a photographed lease whose
         text never came out of the file. The risk scan is rule-matching over a
         string, so on an empty one it "succeeds" by finding nothing in nothing
         — and the card would then report a contract as read and clean when not
         one word of it had been seen. */
      const { win, c } = stage({ upload: { name: 'scan.pdf', extractedText: '   ' } });
      let calls = 0;
      const real = win.runContractBrief;
      win.runContractBrief = async (...a) => { calls++; return real(...a); };
      const t = await win.triageRun(c);
      assert.equal(calls, 0, 'nothing was asked, so nothing was paid for');
      for (const k of win.TRIAGE_STEPS)
        assert.equal(t.steps[k].ok, false, k + ' could not run on nothing');
      assert.equal(win.triageReadAnything(c), false);
      assert.ok(t.error, 'and the card is told why');
    });
    test('but the readability floor is named once and read by all three', () => {
      /* THE RELATION, NEVER THE NUMBER. The floor belongs to the obligations
         reader; the reader refuses a document under it, the read-stamp is
         withheld for one, and this file asks it by NAME. Three readers, one
         number — pin that, and moving the number costs no test edit. */
      const OB = strip(fs.readFileSync('js/obligations.js', 'utf8'));
      assert.match(OB, /const OBLIG_TEXT_MIN\s*=\s*\d+/, 'the floor is declared once');
      assert.ok(/OBLIG_TEXT_MIN[,}]/.test(OB), 'and published, or nothing else can read it');
      assert.equal((OB.match(/OBLIG_TEXT_MIN/g) || []).length, 4,
        'declared, published, and read by the reader and the stamp — no fourth copy');
      assert.ok(/length\s*<\s*OBLIG_TEXT_MIN/.test(OB), 'the reader reads the name');
      assert.ok(/length\s*>=\s*OBLIG_TEXT_MIN/.test(OB), 'the stamp reads the name');

      assert.ok(/OBLIG_TEXT_MIN/.test(TRI_CODE), 'and auto-triage reads it too');
      assert.ok(!/\b120\b/.test(TRI_CODE.slice(0, TRI_CODE.indexOf('function triageBriefLine'))),
        'the runner types no floor of its own — the only 120 left is the tile\'s text clamp');

      /* AND WHERE THE NAME CANNOT BE REACHED THE STAMP IS WITHHELD, never
         guessed: a stamp claims a reading happened, so the quiet direction is
         to claim nothing. */
      assert.ok(/typeof OBLIG_TEXT_MIN === 'number'\)\s*\?\s*OBLIG_TEXT_MIN\s*:\s*Infinity/.test(TRI_CODE),
        'an unreachable floor withholds the stamp rather than lowering it');
    });
    test('a reading that is not on this stage says so rather than vanishing', async () => {
      const { win, c } = stage();
      delete win.runContractBrief;
      const t = await win.triageRun(c);
      assert.equal(t.steps.brief.ok, false);
      assert.ok(t.steps.brief.why, 'an absent module is a stated absence, not a missing tile');
    });
    test('the quiet flag suppresses the toast and hands the reason back', async () => {
      const { win, log, c } = stage({ upload: { name: 's.pdf', extractedText: '' } });
      const before = log.toasts.length;
      const r = await win.runPlaybookReview(c, { quiet: true });
      assert.ok(r && r.error, 'the caller is told');
      assert.equal(log.toasts.length, before, 'and the page is not');
      const loud = await win.runPlaybookReview(c);
      assert.equal(loud, null, 'while an ordinary caller behaves exactly as it did');
      assert.ok(log.toasts.length > before, 'and still gets its toast');
    });
  });

  /* --------------------------------------------------------------- */
  describe('6 · the card, and when it clears', () => {
    test('it draws for a contract read and not yet acknowledged', async () => {
      const { win, c } = stage();
      assert.equal(win.triageCards().length, 0, 'nothing before triage runs');
      await win.triageRun(c);
      assert.equal(win.triageCards().length, 1);
    });
    test('acknowledging is an ACT — reading the card never writes', async () => {
      const { win, c } = stage();
      await win.triageRun(c);
      win.triageCards(); win.triageTiles(c); win.triageLine(c);
      assert.equal(win.triageSeen(c), false, 'four readings later it is still unseen');
      assert.equal(win.triageAck(c), true, 'and one press clears it');
      assert.equal(win.triageCards().length, 0);
      assert.equal(win.triageAck(c), false, 'twice is a no-op');
    });
    test('archived and declined contracts carry no card', async () => {
      const { win, c } = stage();
      await win.triageRun(c);
      c.archived = { at: 'x' };
      assert.equal(win.triageCards().length, 0);
      delete c.archived; c.status = 'Declined';
      assert.equal(win.triageCards().length, 0);
    });
    test('counting is not drawing — the reading emits no markup', () => {
      for (const bad of ['<div', '<span', 'innerHTML', 'document.'])
        assert.ok(!TRI_CODE.includes(bad), 'js/triage.js draws nothing: ' + bad);
    });
    test('the tiles read the steps and count nothing of their own', async () => {
      const { win, c } = stage();
      const t = await win.triageRun(c);
      const tiles = win.triageTiles(c);
      assert.equal(tiles.length, 4, 'four tiles');
      const std = tiles.find(x => x.key === 'playbook');
      assert.equal(std.count, (t.steps.playbook.dev || 0) + (t.steps.playbook.miss || 0),
        'the tile prints the step record, never a second count');
      const ob = tiles.find(x => x.key === 'oblig');
      assert.equal(ob.count, t.steps.oblig.found.length);
    });
    test('the FILED tile reports and proposes nothing', async () => {
      const { win, c } = stage();
      await win.triageRun(c);
      const filed = win.triageTiles(c).find(x => x.key === 'filed');
      assert.match(filed.detail, /Supply & Logistics/, 'the stream somebody picked');
      assert.match(filed.detail, /Wanjiru Kamau/, 'and the owner HaTi stamped');
    });
    test('and the SIGNING ROUTE tile is deliberately absent', () => {
      const { win, c } = stage();
      assert.ok(!win.triageTiles(Object.assign(c, { triage: { steps: {} } }))
        .some(x => /sign/i.test(x.key)), 'no tile claims to know who signs');
      assert.ok(!/tri_t_route|signing route/i.test(TRI_CODE + HOME_CODE),
        'HaTi has no reading for it, so nothing here promises one');
    });
  });

  /* --------------------------------------------------------------- */
  describe('7 · the card is a row in a list that already exists', () => {
    /* REVERSED IN PLACE 9 Sep 2026 — owner-ruled: *"delete the 4 cards from the
       home page and simply land in the key terms page when you upload with the
       boxes attached."* The tiles are on the contract's own Key terms tab, and
       the same four in two places is the duplication this rulebook opens by
       warning about. THE HALF THAT WAS ALWAYS LOAD-BEARING SURVIVES and is
       still asserted: no section was ever added to Home for this, and none may
       be added now on the way to putting the row back. */
    test('it is off Home entirely, and never grew a section of its own', () => {
      assert.ok(!/kind:'triage'/.test(HOME_CODE),
        'the decisions list no longer sources a triage row');
      assert.ok(!/home_triage_section|<section[^>]*triage/i.test(HOME_CODE),
        'and no section, which was true before and stays true');
    });
    test('the three acts are the product\'s own doors', () => {
      assert.match(HOME, /openRedlineWorkbench/, 'the negotiation');
      assert.match(HOME, /openCheckPanel\(c,'brief'\)/, 'and the brief panel');
      assert.ok(!/Change the route|tri_a_route/.test(HOME_CODE),
        'and no act that waits on a reading HaTi does not have');
    });
    test('declining asks first and is an act on the record', () => {
      const w = HOME.slice(HOME.indexOf("if(act==='decline')"), HOME.indexOf("if(window.triageAck) triageAck(c);\n    /*"));
      assert.match(w, /confirmDialog/, 'it asks');
      assert.match(w, /c\.status='Declined'/, 'sets a status this product already understands');
      assert.match(w, /logAudit\(c,'Declined'/, 'and leaves a line');
    });
    test('the fold is per sitting and in memory', () => {
      assert.match(HOME, /const _hmTriageFold=new Set\(\)/);
      assert.ok(!/lsSet\([^)]*[Tt]riage|localStorage[^\n]*triage/.test(HOME_CODE),
        'a card folded on Monday is open again on Tuesday');
    });
  });

  /* --------------------------------------------------------------- */
  describe('6b · every tile names what it found, in the product\'s own field', () => {
    test('the obligations tile prints the obligations, not an empty count', async () => {
      /* Written as `x.text` it printed "2" with nothing under it: the field is
         `desc` — the server's schema requires it, the heuristic writes it, and
         every obligation surface in the product reads it. A count the reader
         cannot act on is worse than no tile. */
      const { win, c } = stage();
      await win.triageRun(c);
      const tiles = win.triageTiles(c);
      const ob = tiles.find(t => t.key === 'oblig');
      assert.ok(ob, 'the tile is drawn');
      assert.ok(ob.count > 0, 'and this fixture really carries obligations');
      assert.ok(ob.detail && ob.detail.length > 3,
        'a count with nothing under it is a number nobody can act on');
      const found = win.triageOf(c).steps.oblig.found;
      assert.ok(ob.detail.includes(found[0].desc.slice(0, 12)),
        'and the words are the obligation\'s own');
    });
    /* THE BRIEF TILE READS THE BRIEF'S OWN SHAPE (owner-reported 9 Sep 2026 —
       it drew its tick with nothing under it). The route answers
       { v, at, by, inputHash, truncated, data } and everything a reader sees is
       under `data`; this was written against a `summary` and a `headline` that
       no brief has ever carried, so it returned '' on every contract.
       THE SIBLING OF THE `text`/`desc` FAULT ONE TEST UP, and it failed the
       same silent way: an empty line, never an error. */
    test('the brief tile reads data.overview, not a field no brief carries', () => {
      const { win } = stage();
      const b = { v: 1, at: '2026-09-09T00:00:00.000Z', truncated: false,
        data: { overview: 'This is a supply agreement between Acme Trading Ltd and '
          + 'Nordkust Industri AB for packaging materials. It runs for 24 months.',
          watchouts: [] } };
      const line = win.triageBriefLine(b);
      assert.ok(line && line.length > 20, 'the tile has something to say');
      assert.match(line, /supply agreement/, 'and the words are the brief\'s own');
      assert.ok(!/24 months/.test(line), 'one sentence, because a tile holds one line');
    });
    test('and the shape it used to read yields nothing, which is what shipped', () => {
      const { win } = stage();
      assert.equal(win.triageBriefLine({ summary: 'x', headline: 'y' }), '',
        'neither field exists on a real brief — reading them was the defect');
      assert.equal(win.triageBriefLine(null), '');
      assert.equal(win.triageBriefLine({ data: {} }), '');
    });
    test('a very short opener falls back to the whole overview', () => {
      const { win } = stage();
      const line = win.triageBriefLine({ data: { overview:
        'A supply deal. It runs 24 months and renews unless stopped.' } });
      assert.match(line, /24 months/, 'one clause tells nobody anything');
    });

    /* A CAP IS SAID ON THE TILE IT HAPPENED TO (owner-reported the same day: a
       red box over the whole page reading "Try again, or narrow what you asked
       for" — nobody asked, so there was nothing to narrow). api() no longer
       toasts it for a quiet caller, so the fact has to arrive here instead: the
       suppression and the saying are ONE change, or a badly-worded warning
       becomes a silent trim. */
    test('a reading that was cut short says so on its own tile', () => {
      const { win, c } = stage();
      c.triage = { at: '2026-09-09T00:00:00.000Z', steps: {
        brief: { ok: true, line: 'A supply agreement.', cut: 'the answer was cut short' },
        playbook: { ok: true, dev: 0, miss: 0, cats: [] },
        oblig: { ok: true, found: [] } }, seenAt: null };
      const t = win.triageTiles(c).find(x => x.key === 'brief');
      assert.match(t.detail, /A supply agreement/, 'what WAS read is still worth reading');
      assert.match(t.detail, /cut short/i, 'and the cap is not swallowed');
      const p = win.triageTiles(c).find(x => x.key === 'playbook');
      assert.ok(!/cut short/i.test(p.detail), 'said only where it happened');
    });
    test('the filed tile reports the stream and the owner', async () => {
      const { win, c } = stage();
      await win.triageRun(c);
      const f = win.triageTiles(c).find(t => t.key === 'filed');
      assert.ok(f && f.detail.includes('Wanjiru'), 'the owner already on the record');
    });
  });

  describe('7b · the headline says what actually happened', () => {
    /* FOUND BY LOOKING AT THE RENDERED CARD, not by any check: on a scanned
       lease whose words never came out of the file, the tag read "Not read"
       and the sub-line read "No text came out of the file" — under a TITLE
       reading "read and ready for you". The card contradicting itself, and
       the wrong half was the one set biggest. */
    const HOME = strip(fs.readFileSync('js/views/home.js', 'utf8'));
    /* RE-POINTED 9 Sep 2026: the row is no longer sourced onto Home, but its
       BUILDER survives with no caller — this file's convention — so the claim
       moves to where the reading now lives. The strip on the contract makes the
       identical choice from the identical function, which is the whole point of
       there being one reading. */
    test('the title is chosen by the same reading the tag and the edge use', () => {
      assert.match(CONTRACT, /triageReadAnything\(c\):true/,
        'the strip asks it');
      assert.match(CONTRACT, /busy\?'tri_kt_head_busy':\(read\?'tri_kt_head':'tri_kt_head_no'\)/,
        'one reading decides the headline — never three');
    });
    test('and the two headlines cannot both be true', () => {
      const en = I18N.slice(I18N.indexOf('tri_row:'));
      const line = en.slice(0, en.indexOf('\n'));
      assert.match(line, /read and ready/, 'the read one says it was read');
      const un = I18N.slice(I18N.indexOf('tri_row_unread:'));
      assert.match(un.slice(0, un.indexOf('\n')), /could not be read/,
        'and the other says it was not');
    });
  });

  /* --------------------------------------------------------------- */
  /* Owner-ruled 9 Sep 2026, off three drawn options: *"it still lands in the
     key terms page and I then have to go back to the home page which is not
     ideal"* — and the answer chosen was to bring the CARD to the contract
     rather than move where an upload lands. Their own 20 Aug ruling therefore
     stands untouched. */
  describe('7c · what HaTi read, on the contract itself', () => {
    test('it borrows Home\'s reading and counts nothing of its own', () => {
      const b = CONTRACT.slice(CONTRACT.indexOf('function ktTriageStripHtml'),
        CONTRACT.indexOf('function renderKeyTerms'));
      assert.match(b, /triageTiles\(c\)/, 'the one reading, so the two surfaces agree');
      for (const w of ['runScan(', 'runContractBrief(', 'extractObligations(',
                       'runPlaybookReview(', 'triageRun('])
        assert.ok(!b.includes(w), 'it draws a reading, it does not make one: ' + w);
    });
    /* ITS OWN STAGE: js/views/contract.js is loaded only on request, and the
       rest of this file has no need of it — pulling it into stage() would make
       every other test here pay for a view they never touch. */
    test('it draws only where there IS a reading, and only until it is seen', () => {
      const { win } = buildWorld({ triage: true, contractView: true });
      win.FOLDERS = { proc: { name: 'Supply & Logistics' } };
      const c = { id: 'MK-407', name: 'N', counterparty: 'Nordkust', status: 'Under Review',
        source: 'upload', folder: 'proc', owner: { id: 'u1', name: 'Wanjiru Kamau' },
        audit: [], obligations: [], comments: [],
        upload: { name: 's.docx', extractedText: TEXT } };
      win.state.contracts = [c];
      assert.equal(win.ktTriageStripHtml(c), '', 'nothing before anything was read');
      c.triage = { at: '2026-09-09T00:00:00.000Z', seenAt: null,
        steps: { brief: { ok: true, line: 'A supply agreement.' },
          playbook: { ok: true, dev: 0, miss: 0, cats: [] },
          oblig: { ok: true, found: [] } } };
      assert.match(win.ktTriageStripHtml(c), /kt-tri-tile/, 'drawn once there is');
      c.triage.seenAt = '2026-09-09T01:00:00.000Z';
      assert.equal(win.ktTriageStripHtml(c), '',
        'and gone once acknowledged — an always-there strip is furniture');
    });
    /* THE SIX QUESTIONS' ONE ABSOLUTE REFUSAL: a strip above the tab content
       pushes what is under it down, and on the Document tab that is the
       agreement. It is mounted inside the TERMS pane, so the refusal holds by
       construction rather than by care. Measured as pixels in
       auto-triage-verify; here it is the structure that makes it possible. */
    test('its slot is inside the Key terms pane and nowhere else', () => {
      assert.equal((CONTRACT.match(/id="kt-triage-slot"/g) || []).length, 1,
        'exactly one mount');
      const terms = CONTRACT.indexOf('data-ws-pane="terms"');
      const slot = CONTRACT.indexOf('id="kt-triage-slot"');
      const grid = CONTRACT.indexOf('class="terms-grid"', terms);
      assert.ok(terms > 0 && slot > terms && slot < grid,
        'between the pane opening and its grid');
    });
    test('the strip is drawn and wired in ONE place', () => {
      /* A second painter is how the strip and its dismiss come to disagree
         about which contract they are about. */
      assert.equal((CONTRACT.match(/function paintKtTriage\(/g) || []).length, 1);
      assert.match(CONTRACT, /kt-tri-done'\);[\s\S]{0,80}addEventListener/,
        'the press is bound where the markup was just written');
    });
    test('acknowledging is an ACT, and it is Home\'s own stamp', () => {
      const b = CONTRACT.slice(CONTRACT.indexOf('function paintKtTriage'),
        CONTRACT.indexOf('function paintKtTriage') + 900);
      assert.match(b, /triageAck\(c\)/,
        'one fact, one state — dismissing it in either place dismisses it in both');
    });
    test('no acts beyond putting it away', () => {
      /* Home's three all exist to get you TO the contract, and you are on it;
         a second door onto an act that already has one is the drift this
         rulebook opens by warning about. */
      const b = CONTRACT.slice(CONTRACT.indexOf('function ktTriageStripHtml'),
        CONTRACT.indexOf('function renderKeyTerms'));
      assert.ok(!/data-tri-act/.test(b), 'Home\'s act buttons are not copied here');
    });
    test('and its words exist in both languages', () => {
      /* This file reads the dictionary as SOURCE and counts the key twice —
         once per book — which is what catches a key added to one and not the
         other, the way a screen ends up half-English. */
      for (const k of ['tri_kt_head', 'tri_kt_head_no', 'tri_kt_done', 'tri_kt_done_title'])
        assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    });
  });

  /* --------------------------------------------------------------- */
  /* Owner-reported 9 Sep 2026, off a strip caught mid-run: "No brief ·
     Standards not checked · Obligations not read" on a contract whose brief
     arrived a minute later — *"If it is still loading, i should see an action
     of still loading for each card."* */
  describe('7d · a reading still in flight is neither done nor failed', () => {
    const world = () => {
      const { win } = buildWorld({ triage: true });
      win.FOLDERS = { proc: { name: 'Supply & Logistics' } };
      const c = { id: 'MK-407', counterparty: 'N', status: 'Under Review', source: 'upload',
        folder: 'proc', owner: { id: 'u1', name: 'Wanjiru Kamau' }, audit: [], obligations: [],
        upload: { name: 's.docx', extractedText: TEXT },
        triage: { at: '2026-09-09T00:00:00.000Z', seenAt: null, steps: { risk: { ok: true, open: 0 } } } };
      win.state.contracts = [c];
      return { win, c };
    };
    test('a step that has not been attempted reads as WORKING, not as failed', () => {
      const { win, c } = world();
      c._triaging = true;
      const t = win.triageTiles(c);
      for (const k of ['brief', 'playbook', 'oblig']){
        const tile = t.find(x => x.key === k);
        assert.equal(tile.working, true, k + ' is still being read');
        assert.match(tile.headKey, /_ing$/, k + ' says so in its own words');
        assert.equal(tile.detail, '', 'a step that has not run has no reason to give');
        assert.equal(tile.count, null, 'and nothing to count yet');
      }
    });
    test('and the SAME absence once the run is over is a real gap', () => {
      const { win, c } = world();
      const t = win.triageTiles(c);
      for (const k of ['brief', 'playbook', 'oblig']){
        const tile = t.find(x => x.key === k);
        assert.equal(tile.working, false, k + ' is not still being read');
        assert.equal(tile.ok, false);
      }
    });
    test('a step that HAS landed keeps its answer while the others work', () => {
      const { win, c } = world();
      c._triaging = true;
      c.triage.steps.oblig = { ok: true, found: [{ desc: 'Quarterly volume forecast' }] };
      const t = win.triageTiles(c);
      const ob = t.find(x => x.key === 'oblig');
      assert.equal(ob.working, false, 'done is done');
      assert.equal(ob.count, 1);
      assert.equal(t.find(x => x.key === 'brief').working, true, 'the others are not');
      assert.equal(t.find(x => x.key === 'filed').working, false, 'and filed never works');
    });
    test('three heads per reading, named in ONE table', () => {
      const { win } = world();
      for (const k of ['brief', 'playbook', 'oblig', 'filed'])
        for (const st of ['ok', 'no', 'ing'])
          assert.ok(win.TRIAGE_HEADS[k] && win.TRIAGE_HEADS[k][st], k + '.' + st);
      assert.equal((TRI_CODE.match(/headKey:/g) || []).length, 1,
        'one place decides the head, so the third state cannot be forgotten');
    });
    test('and the words are in both books', () => {
      for (const k of ['tri_kt_head_busy', 'tri_t_brief_ing', 'tri_t_std_ing', 'tri_t_oblig_ing'])
        assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    });
  });

  /* --------------------------------------------------------------- */
  describe('7e · the card is off Home, and the repaints actually land', () => {
    test('Home no longer sources a triage row', () => {
      /* Owner-ruled: *"delete the 4 cards from the home page and simply land in
         the key terms page when you upload with the boxes attached."* The
         BUILDER survives with no caller — this file's own convention, so it is
         one line to put back — but the decisions list must not read from it. */
      assert.ok(!/\.\.\.\(\(typeof triageCards==='function'\?triageCards\(\):\[\]\)/.test(HOME_CODE),
        'the decisions list no longer spreads triage cards into itself');
      assert.match(HOME, /function triageRowHtml/, 'the builder is kept, not deleted');
    });
    test('every repaint the reading needs is called BARE, never through window', () => {
      /* ONE OF THE THREE IS UNPUBLISHED AND TWO ARE, which is the whole reason
         to stop asking. `renderKeyTermsSide` is not on this file's export list,
         so a `window.` guard would have been false for exactly the one being
         added — silently, this codebase's most repeated defect. All three live
         in js/views/contract.js, so a bare call cannot be wrong.
         A FIRST WRITING OF THIS CLAIMED ALL THREE WERE UNPUBLISHED AND THE
         CALLBACK HAD NEVER RUN. It was read off the export's FIRST LINE, and
         that list spans several — the check below reads the whole statement. */
      const i = CONTRACT.indexOf('if(wantTriage && window.triageRun)');
      const w = CONTRACT.slice(i, CONTRACT.indexOf('\n}\n', i));
      for (const f of ['renderChecksCard', 'renderKeyTerms', 'renderKeyTermsSide'])
        assert.ok(!new RegExp('window\\.' + f).test(w),
          f + ' is not reached through window — it is not published');
      assert.match(w, /if\(document\.getElementById\('kt-side'\)\) renderKeyTermsSide\(x\);/,
        'the side column, which holds the brief card, is repainted too');
      const exp = CONTRACT.slice(CONTRACT.indexOf('Object.assign(window,{'));
      const names = exp.slice(0, exp.indexOf('});')).split(',').map(x => x.trim());
      assert.ok(!names.includes('renderKeyTermsSide'),
        'the one being added is unpublished — reaching it through window is silence');
    });
  });

  /* --------------------------------------------------------------- */
  /* Owner-reported 9 Sep 2026: *"although it ran the obligations in image 1,
     there are not there in image 2 meaning I have to run obligations again.
     Fix this so that the obligations are not ran twice."* The strip said "20
     obligations found" and the Checks row beside it said "Run →", because
     triage PROPOSES and files none — the owner's own fourth ruling. Both were
     telling the truth and the pair read as a product that had lost its own
     answer, and pressing Run paid for the same reading a second time. */
  describe('7f · a reading already made is offered, never made twice', () => {
    const held = () => {
      const { win, c } = stage();
      c.triage = { at: '2026-09-09T00:00:00.000Z', seenAt: null, steps: {
        oblig: { ok: true, found: [
          { desc: 'Quarterly volume forecast' },
          { desc: 'Maintain product liability insurance' }] } } };
      return { win, c };
    };
    test('it is what triage proposed, less anything now on the contract', () => {
      const { win, c } = held();
      assert.equal(win.triageHeldObligations(c).length, 2, 'both are waiting');
      c.obligations = [{ id: 'ob_a', desc: 'quarterly   VOLUME forecast' }];
      assert.equal(win.triageHeldObligations(c).length, 1,
        'and it empties itself as they are ticked — the product\'s own dedupe');
      c.obligations.push({ id: 'ob_b', desc: 'Maintain product liability insurance' });
      assert.equal(win.triageHeldObligations(c).length, 0);
    });
    test('nothing to offer where triage never ran, or found nothing', () => {
      const { win, c } = stage();
      /* LENGTH, not deepEqual: the array comes back from the jsdom window's own
         realm, so its prototype is not node's and a strict deep-equal fails on
         two empty arrays. */
      assert.equal(win.triageHeldObligations(c).length, 0, 'no triage at all');
      c.triage = { steps: { oblig: { ok: false, why: 'x' } } };
      assert.equal(win.triageHeldObligations(c).length, 0,
        'a reading that failed proposes nothing');
    });
    test('and it FILES nothing — ruling 4 is untouched', () => {
      const b = TRI_CODE.slice(TRI_CODE.indexOf('function triageHeldObligations'),
        TRI_CODE.indexOf('function triageHeldObligations') + 500);
      for (const w of ['obligations.push', 'persist(', 'logAudit'])
        assert.ok(!b.includes(w), 'a reading, not a write: ' + w);
    });
    test('the FUNNEL offers them, so both doors inherit it', () => {
      /* The Checks card and the Obligations tab press one function, and so will
         the next door; teaching each separately is how they come to disagree
         about whether a scan is owed. */
      const f = OB_SRC.slice(OB_SRC.indexOf('async function runFindObligations'),
        OB_SRC.indexOf('async function runFindObligations') + 1600);
      assert.match(f, /triageHeldObligations\(c\)/, 'it asks');
      assert.match(f, /if\(held\.length\)\{ openObligationsReview\(c, held\); return; \}/,
        'and returns BEFORE the scan, which is what stops the second spend');
      assert.ok(f.indexOf('openObligationsReview(c, held)') < f.indexOf('extractObligations'),
        'the offer comes first');
      assert.match(f, /window\.triageHeldObligations==='function'/,
        'read through window — a stage without js/triage.js scans exactly as before');
    });
    test('the row says a reading is waiting, rather than "Run"', () => {
      const { win, c } = held();
      const v = win.checkVerdict ? win.checkVerdict(c, 'oblig') : null;
      /* checkVerdict lives in the contract view, which this stage does not
         load; the claim is asserted on the SOURCE where it is not reachable. */
      if (v){
        assert.equal(v.tone, 'steel', 'nothing is late and nothing is wrong');
        assert.equal(v.held, 2);
      } else {
        assert.match(CONTRACT, /tone:'steel',held:held\.length/, 'the verdict is drawn');
        assert.match(CONTRACT, /ob_proposed_n/, 'and named');
      }
    });
    test('and BOTH presses treat a held reading as a list to tick', () => {
      /* The panel shows what is ON the contract, and nothing is yet — so a
         verdict saying "20 proposed" must press the funnel. Written in one
         place and not the other, one row behaves two ways. */
      assert.equal((CONTRACT.match(/if\(ran && !ran\.held\) return openCheckPanel/g) || []).length, 2,
        'the Checks card and the room header both ask');
      assert.ok(!/const ran=!!checkVerdict/.test(CONTRACT),
        'the verdict is kept as an object — coerced, a held reading is '
        + 'indistinguishable from findings already on the record');
    });
    test('and the steel tone is drawn, not left to fall through to green', () => {
      assert.match(CONTRACT, /v&&v\.tone==='steel'\?'background:var\(--st-steel-bg\)/,
        'without it the row says this contract is clear when nobody has looked');
    });
    test('its words are in both books, with both plural forms', () => {
      for (const k of ['ob_proposed_n_one', 'ob_proposed_n_other'])
        assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    });
  });

  describe('8 · the tick-box', () => {
    test('it is on the confirm screen and ticked by default', () => {
      assert.match(CONTRACT, /id="up-triage" checked/, 'ticked, so the ordinary case is one press');
      assert.match(CONTRACT, /function triageOptInHtml\(ext\)\{\s*\n\s*if\(!ext\) return '';/,
        'and not drawn where there is no document to read');
    });
    test('no box means no reading, never a silent yes', () => {
      /* The promise this feature makes is that the cost is NAMED. A box that
         did not draw is a question nobody was asked, so the fallback is not to
         spend — unreachable today, and the direction is what matters: money
         spent unasked is a broken promise the reader cannot see, where a
         reading that did not happen is a card they notice is missing. */
      assert.match(CONTRACT, /const wantTriage=!!\(triageBox&&triageBox\.checked\)/,
        'absent element is a no, not a yes');
    });
    test('it is read BEFORE the dialog closes', () => {
      const i = CONTRACT.indexOf("const wantTriage=");
      const j = CONTRACT.indexOf('closeModal();', i);
      assert.ok(i > 0 && j > i, 'the element is gone by the time closeModal has run');
    });
    /* THE BLOCK, NOT A NUMBER OF CHARACTERS. This read 700 characters from the
       marker and went red the day the block gained a comment — the claim is
       about what the block DOES, so it is sliced to the end of the function
       that holds it and costs nothing the next time somebody writes there. */
    test('the run is started after the contract is on screen, and not awaited', () => {
      const i = CONTRACT.indexOf('if(wantTriage && window.triageRun)');
      const w = CONTRACT.slice(i, CONTRACT.indexOf('\n}\n', i));
      assert.ok(i > 0 && w.length > 0, 'the block is where it says it is');
      assert.ok(!/await\s+triageRun/.test(w),
        'nobody waits a minute to see their own contract');
      assert.match(w, /catch\(e\)/, 'and a failed reading cannot take the upload down with it');
    });
    /* THE RECORD IS ON THE SERVER BEFORE IT IS READ (owner-reported 9 Sep 2026,
       on their own upload: the box was ticked and the Contract brief card still
       read "Not written yet"). persist() in API mode is DEBOUNCED by 400ms and
       returns nothing to wait on, so the readings fired before the contract had
       been created and POST /api/ai/brief — which looks the row up before it
       reads a word — answered 404 "Contract not found", every time, on every
       real upload. flushSaves() is this product's own move for that moment.
       THE PAIR IS THE CLAIM: the save is waited for and the READINGS still are
       not, because awaiting them would make somebody watch a spinner before
       their own contract appeared. */
    test('the save is waited for, and the readings still are not', () => {
      const w = CONTRACT.slice(CONTRACT.indexOf('if(wantTriage && window.triageRun)'),
        CONTRACT.indexOf('if(wantTriage && window.triageRun)') + 1600);
      assert.match(w, /API_MODE\(\) && window\.flushSaves\) \? flushSaves\(\)/,
        'the pending save is flushed rather than left on its 400ms timer');
      assert.match(w, /\.then\(\(\) *=> *\{[\s\S]*triageRun\(c/,
        'and the reading starts after it');
      assert.ok(!/await\s+triageRun/.test(w), 'the reading itself is still not awaited');
    });
    test('the sentence names what it costs, and names THREE', () => {
      assert.match(I18N, /ct_triage_optin_sub: 'Writes the brief[^']*three Copilot calls/,
        'the risk scan is deterministic and free — overstating a cost is as dishonest as hiding it');
    });
  });

  /* --------------------------------------------------------------- */
  describe('8b · the decline dialog does not escape twice', () => {
    /* confirmDialog draws its message in a <p> and ESCAPES it, so a name
       escaped here as well shows "Smith & Co" as "Smith &amp; Co" in the one
       dialog that asks somebody to decline a contract. Every other caller in
       the product passes the name raw. */
    const HOME = strip(fs.readFileSync('js/views/home.js', 'utf8'));
    test('the name goes in raw', () => {
      assert.match(HOME, /message:i18t\('tri_decline_msg',\{name:c\.name\|\|c\.id\}\)/);
      assert.ok(!/tri_decline_msg',\{name:esc\(/.test(HOME), 'never escaped twice');
    });
    test('and confirmDialog is still the thing that escapes it', () => {
      const CORE = strip(fs.readFileSync('js/core.js', 'utf8'));
      const d = CORE.slice(CORE.indexOf('function confirmDialog'));
      assert.match(d.slice(0, 2600), /\$\{esc\(message\)\}/,
        'if this ever stops escaping, the caller above has to start');
    });
  });

  describe('9 · nothing about it travels, and there is no route', () => {
    test('the share payload never carries it', () => {
      const b = NEGO.slice(NEGO.indexOf('function buildSharePayload'),
        NEGO.indexOf('function buildSharePayload') + 9000);
      assert.ok(!/triage/i.test(b), 'the payload is an allow-list and this is not on it');
    });
    test('and the server knows nothing about it', () => {
      assert.ok(!/triage/i.test(read('server/server.js')),
        'what a workspace has read is that workspace\'s own business');
    });
    test('it will not run twice at once', () => {
      assert.match(TRI, /if \(c\._triaging\) return null;/,
        'a second press would pay for every reading again');
    });
  });

  /* --------------------------------------------------------------- */
  describe('10 · the words exist in both languages', () => {
    test('every key the card and the tick-box print', () => {
      const keys = ['ct_triage_optin', 'ct_triage_optin_sub', 'tri_row', 'tri_row_unread', 'tri_tag_arrived',
        'tri_tag_unread', 'tri_by', 'tri_fold', 'tri_unfold', 'tri_no_answer',
        'tri_not_available', 'tri_no_text', 'tri_t_brief', 'tri_t_brief_no', 'tri_t_std', 'tri_t_std_no',
        'tri_t_oblig', 'tri_t_oblig_no', 'tri_t_filed', 'tri_n_clean',
        'tri_a_redline', 'tri_a_brief', 'tri_a_decline', 'tri_decline_q', 'tri_decline_msg',
        'tri_declined'];
      for (const k of keys)
        assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    });
    test('and every plural carries both forms in both books', () => {
      for (const k of ['tri_n_look', 'tri_n_oblig'])
        for (const f of ['_one', '_other'])
          assert.equal((I18N.match(new RegExp('\\b' + k + f + ':', 'g')) || []).length, 2, k + f);
    });
    test('the line uses the Checks card\'s own phrase for that number', async () => {
      const { win, c } = stage();
      await win.triageRun(c);
      assert.match(win.triageLine(c), /to look at/,
        'a standard the contract is silent about is absent, not deviated from');
    });
  });
});
