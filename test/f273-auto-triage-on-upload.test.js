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
    test('it joins decisionItems rather than adding a section to Home', () => {
      assert.match(HOME, /kind:'triage'/, 'a sixth source for the same list');
      assert.ok(HOME.indexOf("kind:'triage'") < HOME.indexOf('...myJoinAsks'),
        'and it leads, because it is the only row carrying something unseen');
      assert.ok(!/home_triage_section|<section[^>]*triage/i.test(HOME_CODE),
        'no new section');
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
    test('the title is chosen by the same reading the tag and the edge use', () => {
      assert.match(HOME, /triageReadAnything\(c\)\)\?'tri_row':'tri_row_unread'/,
        'one reading decides the headline, the tag and the colour — never three');
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
    test('the run is started after the contract is on screen, and not awaited', () => {
      const w = CONTRACT.slice(CONTRACT.indexOf('if(wantTriage && window.triageRun)'),
        CONTRACT.indexOf('if(wantTriage && window.triageRun)') + 700);
      assert.ok(!/await\s+triageRun/.test(w),
        'nobody waits a minute to see their own contract');
      assert.match(w, /catch\(e\)/, 'and a failed reading cannot take the upload down with it');
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
