/* f327 — COPILOT READS IT AT CREATION, AND FILLS WHAT IT CAN
   ============================================================
   Young, 17 September 2026, over three screenshots: *"I have asked multiple
   times that anytime you create a agreement, including using the door in image
   1, copilot has to read the agreement before it lands in overview. When it
   lands in overview the open fields have to be pre-filled by copilot ... All
   contracts should have the possibility to fill in from the right hand side
   panel like in image 4."*

   MEASURED BEFORE ANY OF IT WAS BUILT. The 17 Sep change before this one
   hooked the arrival reading to contractLeavesDrafting — the moment a contract
   is SENT — so every contract in the product still landed on its Overview tab
   reporting five readings as "Not read yet", which is the screenshot that came
   back. And the right-hand form was drawn only for contracts carrying a
   declared field list, which is one of the three shapes a drafted contract
   comes in.

   THREE THINGS THIS FILE PINS, and one it deliberately does not:
     · the reading runs at CREATION, at every door, and again only when the
       wording has MOVED — never on a send that changed nothing
     · the blanks are filled from the RECORD first and a model second, and
       neither may touch the fields other screens compute from
     · the panel is a second DOOR onto one ACT, and one function chooses
       which of the two panels draws

   WHAT IS MEASURED IN A BROWSER INSTEAD (blanks-panel-verify): that the panel
   really draws beside the paper, that typing in one moves the other, and that
   the contract does not move a pixel. jsdom resolves no layout, so no claim
   here could tell a drawn panel from an undrawn one.

   Run: node --test test/f327-copilot-reads-and-fills-on-arrival.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

/* A MISSING FILE IS A FAILED CLAIM, NEVER A CRASH AT LOAD. Run against the
   commit before this work, js/blanks.js does not exist — and a top-level
   readFileSync would take the whole file down with one line of stack, which
   tells nobody WHICH of the claims below are new. Empty instead, so every
   claim reports its own failure. This is the browser files' own guard rule,
   applied to a node test for the same reason. */
const read = f => { try{ return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); }
  catch(_){ return ''; } };
/* THE SWEEPS READ CODE, NOT PROSE. Every file below explains in its own
   comments the doors it must never use, so an un-stripped grep finds the
   warning and reports it as the fault. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const BLANKS = read('js/blanks.js');
const BLANKS_CODE = strip(BLANKS);
const TRI = read('js/triage.js');
const TRI_CODE = strip(TRI);
const CONTRACT = read('js/views/contract.js');
const CONTRACT_CODE = strip(CONTRACT);
const AI_SRC = read('js/ai.js');
const SERVER = read('server/server.js');
const I18N = read('js/i18n.js');

/* A function's own body, matched BY NAME and never by parameter list: a net a
   signature can silence says nothing about the behaviour it was written for
   (the f255 lesson, paid again by f178 the same week). */
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

/* ---- THE PAPER, IN THE PRODUCT'S OWN MARKUP ----
   Copied from js/views/contract.js's own builders — `clause(n,title,body)`
   emits `<div data-anchor="cN"><h4>N. Title</h4><p>…</p></div>` and its fText
   / fNum / CP / VAL helpers emit exactly these inputs — because a stand-in
   whose shape is prettier than the product's turns every claim below into a
   description of a document HaTi does not draw. The browser file drives the
   real docBody over a real contract; this is the same shape off-line. */
const PAPER = `
  <p>This Packaging Supply Agreement is made on <input type="date" value="" data-field="effDate" class="field field-date"/>
     between <strong>HaTi</strong> and <input type="text" value="" placeholder="Counterparty name" data-sync="counterparty" class="field"/>
     for the supply of <input type="text" value="" placeholder="e.g. PET bottles &amp; preforms" data-field="packType" class="field"/>.</p>
  <div class="mb-5" data-anchor="c2"><div><h4>2. Price &amp; Contract Value</h4></div>
    <p>The estimated annual contract value is KES <input type="number" value="" placeholder="0" data-sync="value" data-money="1" class="field field-num"/>,
       payable within <input type="number" value="30" data-field="payDays" class="field field-num"/> days.</p></div>
  <div class="mb-5" data-anchor="c3"><div><h4>3. Forecast, Lead Time &amp; Stock</h4></div>
    <p>The Buyer issues a <input type="number" value="" data-field="forecastWeeks" class="field field-num"/>-week rolling forecast;
       the Supplier holds <input type="number" value="14" data-field="safetyDays" class="field field-num"/> days of safety stock.</p></div>`;

function stage(over, opts){
  const { win, log } = buildWorld(Object.assign({ blanks: true, templates: true }, opts || {}));
  const c = Object.assign({
    id: 'MK-500', name: 'Packaging Supply Agreement', template: 'PK', status: 'Draft',
    counterparty: '', value: 0, fields: {}, audit: [], metadata: {},
  }, over || {});
  win.state = win.state || { contracts: [], settings: {} };
  win.state.contracts = [c];
  /* THE ONE STAND-IN, and it stands in for the VIEW rather than for the
     reading: js/views/contract.js wires the page at load and cannot be loaded
     here, so docBody is handed the markup above. contractBlanks itself is the
     product's own function running over the product's own shape. */
  win.docBody = () => PAPER;
  win.canEdit = () => true;
  return { win, log, c };
}

/* ============================================================ */
describe('f327 (1) the blanks are read off the paper, never off a list', () => {
  test('every input on the page is a blank, with its clause and its label', () => {
    const { win, c } = stage();
    const bs = win.contractBlanks(c);
    /* Compared as a STRING: the list is built in the world's own realm, so a
       deep-equal against a local array fails on the prototype rather than on
       the value — f273's own lesson, one file along. */
    assert.equal(bs.map(b => b.key).join(','),
      'effDate,counterparty,packType,value,payDays,forecastWeeks,safetyDays',
      'in the order the page draws them');
    /* THE WHOLE REASON IT IS READ OFF THE PAPER: `forecastWeeks` and
       `safetyDays` are written by hand in that template's drafting and are on
       NO declared field list. A panel built from the list would have shown
       five of the seven and called it the contract form. */
    const undeclared = bs.filter(b => !b.declared).map(b => b.key);
    assert.ok(undeclared.includes('forecastWeeks') && undeclared.includes('safetyDays'),
      'two of these blanks are declared nowhere — only the page knows about them');
  });
  test('a blank carries the clause it sits in, and the recital carries none', () => {
    const { win, c } = stage();
    const by = Object.fromEntries(win.contractBlanks(c).map(b => [b.key, b.section]));
    assert.match(by.payDays, /Price/, 'the clause heading the page prints');
    assert.match(by.forecastWeeks, /Forecast/);
    assert.equal(by.packType, '', 'a blank in the recital is in no clause, exactly as the page has it');
  });
  test('the declared list supplies LABELS and decides nothing else', () => {
    const { win, c } = stage();
    const by = Object.fromEntries(win.contractBlanks(c).map(b => [b.key, b.label]));
    assert.equal(by.payDays, 'Payment terms (days)',
      'the label the wizard asked in, so one box has one word');
    assert.equal(by.effDate, 'Start date');
    /* An undeclared key is turned into words rather than given an invented
       sentence — honest, and this file does not guess. Sentence case, because
       every declared label beside it is written that way. */
    assert.equal(by.forecastWeeks, 'Forecast weeks');
    assert.equal(by.safetyDays, 'Safety days');
  });
  test('OPEN is the ones with nothing in them, drafting defaults included', () => {
    const { win, c } = stage();
    const open = win.contractBlanksOpen(c).map(b => b.key).join(',');
    assert.equal(open, 'effDate,counterparty,packType,value,forecastWeeks',
      'a blank the drafting already answers is not open — the page states a figure');
    assert.ok(!open.includes('payDays') && !open.includes('safetyDays'));
  });
  test('the three shapes, and only one of them has blanks', () => {
    const { win, c } = stage();
    assert.equal(win.contractHasBlanks(c), true, 'a built-in template');
    assert.equal(win.contractHasBlanks(Object.assign({}, c, { templateForm: { fields: [] } })), false,
      'a library template has its own panel — the two may never both draw');
    assert.equal(win.contractHasBlanks(Object.assign({}, c, { redlineText: '<p>x</p>' })), false,
      'stored wording is the negotiation’s, and a blank is not how it changes');
    assert.equal(win.contractHasBlanks({ id: 'x' }), false, 'and a record with no template has none');
  });
  test('reading must not write', () => {
    const { win, c } = stage();
    const before = JSON.stringify(c);
    win.contractBlanks(c); win.contractBlanksOpen(c); win.contractBlankUsual(c, 'payDays');
    assert.equal(JSON.stringify(c), before, 'not one of the three touches the record');
  });
});

/* ============================================================ */
describe('f327 (2) one writer, however many doors', () => {
  test('contractBlankSet is the one act and the paper presses it', () => {
    const b = fnBody(CONTRACT, 'wireDocumentSync');
    assert.ok(b, 'the page’s own wiring is there');
    assert.match(b, /contractBlankSet\(c,\s*key,\s*inp\.value\)/,
      'the paper’s blank handler presses the shared act rather than writing c.fields itself');
  });
  test('it refuses the two keys that ARE the record', () => {
    const { win, c } = stage();
    assert.equal(win.contractBlankSet(c, 'counterparty', 'Juno LLC'), false);
    assert.equal(win.contractBlankSet(c, 'value', '250000'), false);
    assert.equal(c.fields.counterparty, undefined, 'nothing reached c.fields');
    assert.equal(c.counterparty, '', 'and nothing reached the record');
    /* Those two have a writer already — with a repaint, a status check and an
       audit line. A second one here is the fault this function prevents. */
    assert.equal(win.contractBlankSet(c, 'packType', 'PET preforms'), true, 'an ordinary blank writes');
    assert.equal(c.fields.packType, 'PET preforms');
  });
  test('nothing changed is not an edit', () => {
    const { win, c } = stage();
    win.contractBlankSet(c, 'packType', 'PET');
    const n = c.audit.length;
    assert.equal(win.contractBlankSet(c, 'packType', 'PET'), false, 'the same value again writes nothing');
    assert.equal(c.audit.length, n, 'and leaves no line');
  });
  test('a person’s keystroke is audited and a reading’s fill is not', () => {
    const { win, c } = stage();
    win.contractBlankSet(c, 'packType', 'PET');
    assert.ok(c.audit.some(a => a.action === 'Edited'), 'a person typing leaves a line');
    const n = c.audit.length;
    win.contractBlankSet(c, 'forecastWeeks', '8', { quiet: true });
    assert.equal(c.audit.length, n,
      'a reading’s own fills are audited once, by the reading, naming all of them');
  });
});

/* ============================================================ */
describe('f327 (3) the record answers first, and for free', () => {
  test('it fills what the workspace knows about itself', () => {
    const { win, c } = stage();
    win.contractParty = () => 'HaTi Kenya Ltd';
    win.todayStr = () => '2026-09-17';
    const r = win.fillBlanksFromRecord(c);
    const by = Object.fromEntries(r.filled.map(f => [f.key, f.why]));
    assert.equal(c.fields.effDate, '2026-09-17', 'the day, which nobody has to be asked for');
    assert.equal(by.effDate, 'record');
  });
  test('and refuses, by name, every field other screens compute from', () => {
    const { win, c } = stage();
    assert.deepEqual([...win.BLANK_NEVER_FILLED].sort(), ['counterparty', 'termYears', 'value'].sort());
    win.fillBlanksFromRecord(c);
    assert.equal(c.counterparty, '', 'a counterparty is never invented');
    assert.equal(c.value, 0, 'nor an amount — every money reading runs off this');
    assert.equal(c.fields.termYears, undefined,
      'nor the term blank, whose own handler fills c.expiry from it');
  });
  test('what this workspace USUALLY writes, above the floor and not below', () => {
    const { win, c } = stage();
    const past = n => Array.from({ length: n }, (_, i) => ({
      id: 'MK-' + i, template: 'PK', fields: { forecastWeeks: '6' } }));
    win.builtinUsageRows = () => past(1);
    assert.equal(win.contractBlankUsual(c, 'forecastWeeks'), null,
      'one other contract is not a house position');
    win.builtinUsageRows = () => past(win.BLANK_USUAL_MIN);
    const u = win.contractBlankUsual(c, 'forecastWeeks');
    assert.equal(u.v, '6');
    assert.equal(u.n, win.BLANK_USUAL_MIN, 'and it says how many agreed');
    const r = win.fillBlanksFromRecord(c);
    assert.equal(c.fields.forecastWeeks, '6');
    assert.ok(r.filled.some(f => f.key === 'forecastWeeks' && f.why === 'usual'));
  });
  test('it never counts the contract it is filling', () => {
    const { win, c } = stage();
    c.fields.forecastWeeks = '99';
    win.builtinUsageRows = () => [c, c];
    assert.equal(win.contractBlankUsual(c, 'forecastWeeks'), null,
      'a contract is not evidence about itself');
  });
  test('it leaves what it cannot answer, and says which', () => {
    const { win, c } = stage();
    win.builtinUsageRows = () => [];
    const r = win.fillBlanksFromRecord(c);
    const left = r.left.map(b => b.key);
    assert.ok(left.includes('packType') && left.includes('forecastWeeks'),
      '"it filled these and left these" is the only shape a reader can check');
  });
  test('no route, no model, no second reading', () => {
    /* THE FILE FIRST, or this claim is vacuously true of a file that does not
       exist — which is exactly what it was against the parent until this line
       was added. An empty grep is not a passing net. */
    assert.ok(BLANKS_CODE.length > 200, 'js/blanks.js is there to be swept');
    for (const bad of ['api(', 'fetch(', 'anthropic', 'ai/'])
      assert.ok(!BLANKS_CODE.includes(bad), 'js/blanks.js answers off the record alone: ' + bad);
  });
});

/* ============================================================ */
describe('f327 (4) the reading runs at creation, at every door', () => {
  /* THE DOORS, and the eighth is held to this the way f170 holds
     roomOpenOnTerms: registered at every creation site because there is no
     single funnel for creating a contract, and a test is what catches a door
     added tomorrow. */
  const DOORS = {
    'js/wizard.js': 'the guided wizard — the menu’s first row',
    'js/app.js': 'new from a built-in template',
    'js/views/library.js': 'a saved custom template',
    'js/views/templatelib.js': 'a published company standard',
    'js/templatefields.js': 'the bulk template maker',
    'js/views/migration.js': 'the back-catalogue importer',
  };
  for (const [file, what] of Object.entries(DOORS)) {
    test(`${what} reads on arrival`, () => {
      const src = strip(read(file));
      assert.match(src, /contractArrived\(c/, file + ' calls the arrival door');
    });
  }
  test('every site that opens a new draft also reads it', () => {
    /* THE RELATION, not a list: roomOpenOnTerms is registered at exactly the
       creation sites (f170 is its net), so a site that opens a new draft and
       does not read it is a door somebody forgot. */
    for (const file of Object.keys(DOORS)) {
      const src = strip(read(file));
      if (!/roomOpenOnTerms\(/.test(src)) continue;
      assert.match(src, /contractArrived\(/, file + ' opens a new draft, so it reads it');
    }
  });
  test('the bulk doors are refused by name, not by accident', () => {
    for (const file of ['js/templatefields.js', 'js/views/migration.js'])
      assert.match(strip(read(file)), /contractArrived\(c,\s*\{\s*bulk:\s*true\s*\}\)/,
        file + ' files many at once — three model calls apiece is a bill nobody pressed');
    const b = fnBody(TRI, 'contractArrived');
    assert.match(b, /o\.bulk/, 'and the door itself is what refuses them');
  });
  test('the upload door is exempt, and says why on the spot', () => {
    /* NO BOX MEANS NO READING is the owner's 9 Sep ruling and still governs
       that one door. It presses the same launcher, conditionally. */
    assert.ok(!/contractArrived/.test(strip(fnBody(CONTRACT, 'submitUpload') || '')),
      'submitUpload does not call the unconditional door');
    assert.match(CONTRACT, /THE ONE CREATION SITE THAT DOES NOT CALL contractArrived/,
      'and the exemption is written where somebody would look for it');
    assert.match(strip(fnBody(CONTRACT, 'submitUpload') || ''), /if\(wantTriage\) triageAndPaint\(c\)/,
      'it presses the same launcher behind the tick-box');
  });
  test('the send door still reads, so nothing that skipped creation is missed', () => {
    const b = fnBody(read('js/core.js'), 'contractLeavesDrafting');
    assert.match(b, /triageAndPaint\(c\)/,
      'every send door funnels through here — including the importer’s contracts');
  });
});

/* ============================================================ */
describe('f327 (5) once per wording, which replaced once ever', () => {
  const hashStage = () => {
    const { win, c } = stage({}, { triage: true });
    win.playbookHashOf = t => 'h:' + String(t).length;
    win.contractPlainText = x => (x._text || 'the wording as it stands');
    return { win, c };
  };
  test('a contract nobody has read is owed a reading', () => {
    const { win, c } = hashStage();
    assert.equal(win.triageNeedsRead(c), true);
  });
  test('a send that changed nothing is owed nothing', () => {
    const { win, c } = hashStage();
    c.triage = { at: 'then', steps: {}, hash: win.triageWordingHash(c) };
    assert.equal(win.triageNeedsRead(c), false,
      'four rounds that moved no word would otherwise be four readings');
  });
  test('and the send after the blanks were filled is owed another', () => {
    const { win, c } = hashStage();
    c.triage = { at: 'then', steps: {}, hash: win.triageWordingHash(c) };
    c._text = 'the wording as it stands, with every blank now answered';
    assert.equal(win.triageNeedsRead(c), true,
      'which is exactly the case the 17 Sep note called "a form with its blanks still in it"');
  });
  test('a hash we do not have is NOT a reason to spend', () => {
    const { win, c } = hashStage();
    c.triage = { at: 'then', steps: {} };                 // read before hashes were stamped
    assert.equal(win.triageNeedsRead(c), false);
    /* Overwritten rather than deleted: js/playbook.js is on this stage and
       `delete` would only take the override off and reveal the real one. */
    win.playbookHashOf = undefined;
    assert.equal(win.triageWordingHash(c), null, 'no hasher is "we do not know"');
  });
  test('it is the obligations scan’s own hasher, not a second one', () => {
    const b = fnBody(TRI, 'triageWordingHash');
    assert.match(b, /playbookHashOf/,
      'a second opinion about what "the same wording" means would disagree the first time either was tuned');
  });
  test('a failed run is stamped too, so it is not retried on every send', () => {
    assert.match(TRI_CODE, /t\.hash = triageWordingHash\(c\)/);
    const run = fnBody(TRI, 'triageRun');
    assert.ok(run.indexOf('t.steps.fill') < run.indexOf('t.hash = triageWordingHash(c)'),
      'stamped AFTER the fill step, so a blank this run answered is inside the wording it is recorded against');
  });
});

/* ============================================================ */
describe('f327 (6) filling is the fifth reading, and it is last', () => {
  test('the step list, and the order', () => {
    const { win } = stage({}, { triage: true });
    assert.equal(win.TRIAGE_STEPS.join(','), 'risk,brief,playbook,oblig,fill');
    assert.ok(TRI_CODE.indexOf('extractObligations') < TRI_CODE.indexOf('runFillBlanks'),
      'everything that READS the wording runs before the one that changes it');
  });
  test('it names what it filled and prints not one value', () => {
    const run = fnBody(TRI, 'triageRun');
    assert.match(run, /filled:\s*\(f\.filled \|\| \[\]\)\.map\(x => x\.label \|\| x\.key\)/,
      'labels, never values — the values are in boxes a reader can correct');
    const tiles = fnBody(TRI, 'triageTiles');
    assert.ok(!/fl\.filled.*\.value/.test(tiles), 'and the tile prints none either');
  });
  test('the free half runs whether or not there is a key', () => {
    const b = fnBody(AI_SRC, 'runFillBlanks');
    assert.ok(b.indexOf('fillBlanksFromRecord') < b.indexOf('state.aiConfigured'),
      'the record answers before any question of a key — no key is not a failure here');
    assert.match(b, /if\(!left\.length\) return done\(\)/,
      'and nothing is asked where nothing is left');
  });
  test('a refused route does not undo what the record answered', () => {
    const b = fnBody(AI_SRC, 'runFillBlanks');
    const cat = b.slice(b.indexOf('}catch(e){'));
    assert.match(cat, /done\(\)/,
      'reporting "nothing was filled" over boxes that were is the fault this catch prevents');
  });
});

/* ============================================================ */
describe('f327 (7) the wall is on both hosts', () => {
  const route = (() => {
    const i = SERVER.indexOf("app.post('/api/ai/fill'");
    return SERVER.slice(i, SERVER.indexOf("\n});", i));
  })();
  test('the route exists, is an editor’s, and is metered by name', () => {
    assert.ok(route.length > 0, 'POST /api/ai/fill');
    assert.match(route, /auth, editor,/, 'creating and changing a contract is an editor’s act');
    assert.match(route, /aiFeature\('fill'\)/);
    assert.match(route, /feature: 'fill'/);
    assert.match(SERVER, /fill: 'Filling open blanks'/,
      'an unnamed feature spends into the Other bucket, which is the one number an admin looks for');
  });
  test('a key must be one the caller listed — on the route', () => {
    assert.match(route, /byKey\.has\(f\.key\)/);
    assert.match(route, /const byKey = new Map\(asks\.map/);
  });
  test('and again in the browser, so neither host trusts the other', () => {
    const b = fnBody(AI_SRC, 'runFillBlanks');
    assert.match(b, /open\.get\(f\.key\)/, 'the browser drops a stray key too');
    assert.match(b, /contractBlankSet\(/,
      'and the third wall refuses a record field whatever either of them says');
  });
  test('an EXAMPLE may not come back as the answer', () => {
    assert.match(route, /\.example \|\| ''\)\.replace/,
      '"e.g. PET bottles" written into a contract reads as a term somebody agreed');
  });
  test('the prompt’s one job is not to guess', () => {
    assert.match(route, /LEAVE A BLANK OUT rather than guess/);
    assert.match(route, /Never invent a counterparty, an amount, a date or a term/);
  });
  test('it is not /api/ai/blanks, and the pair is named so nobody merges them', () => {
    assert.match(SERVER, /proposes where a TEMPLATE being built should have\s*\n\s*\*?\s*blanks at all, and \/api\/ai\/fill answers the blanks a CONTRACT already has/,
      'two different questions over two different populations');
  });
});

/* ============================================================ */
describe('f327 (8) one slot, two builders, one decision', () => {
  test('paintContractForm is the only thing that chooses', () => {
    const b = fnBody(CONTRACT, 'paintContractForm');
    assert.ok(b, 'the chooser is there');
    assert.match(b, /c\.templateForm/, 'a declared field list takes the library form');
    assert.match(b, /renderBlankFormSection\(c\)/, 'and everything else takes the blanks panel');
    /* WRITTEN AS TWO INDEPENDENT CALLS they would both write one element and
       whichever ran last would win silently. */
    const calls = (CONTRACT_CODE.match(/renderTemplateFormSection\(c\)/g) || []).length;
    assert.equal(calls, 1, 'the library form is called from exactly one place, and it is the chooser');
  });
  test('the panel owns no writer of its own', () => {
    const b = fnBody(CONTRACT, 'wireBlankForm');
    assert.match(b, /contractBlankSet\(c, key, el\.value\)/, 'a blank presses the one act');
    assert.match(b, /dispatchEvent\(new Event\('input'/,
      'and a record field presses THE PAPER’S OWN input, so its write, repaint and audit stay where they were');
    assert.ok(!/persist\(/.test(b), 'the panel persists nothing itself');
    assert.ok(!/logAudit\(/.test(b), 'and writes no line of its own');
  });
  test('it is not drawn once the paper stops being fillable', () => {
    const b = fnBody(CONTRACT, 'renderBlankFormSection');
    assert.match(b, /docFillable\(c\)/,
      'the panel and the page have to agree about when typing is over');
  });
  test('the count is the reading’s own arithmetic, asked again', () => {
    const b = fnBody(CONTRACT, 'paintBlankFormCount');
    assert.match(b, /contractBlanksOpen\(c\)/,
      'a second tally is how a panel comes to report a different number from the page beside it');
  });
  test('and it names what Copilot filled without printing a value', () => {
    const b = fnBody(CONTRACT, 'blankFormFilledLineHtml');
    assert.match(b, /f\.filled/, 'read off the reading’s own record');
    assert.ok(!/\.value/.test(b), 'names, never values');
    assert.match(b, /if\(!names\.length\) return ''/,
      'and a line saying "Copilot filled 0" is a band about nothing');
  });
});

/* ============================================================ */
describe('f327 (9) every name published, every key in both books', () => {
  test('js/blanks.js publishes everything another file reads', () => {
    const exp = BLANKS.slice(BLANKS.lastIndexOf('Object.assign(window'));
    for (const n of ['contractBlanks', 'contractBlanksOpen', 'contractHasBlanks',
      'contractBlankSet', 'contractBlankUsual', 'fillBlanksFromRecord', 'blanksAskPayload',
      'BLANK_NEVER_FILLED', 'BLANK_USUAL_MIN'])
      assert.ok(exp.includes(n), n + ' is published — a guard on an unpublished name is always false');
  });
  test('and so do the two files that gained a door', () => {
    assert.match(TRI, /triageWordingHash, triageNeedsRead, contractArrived/);
    assert.match(AI_SRC, /runContractBrief,runFillBlanks,/);
    const exp = CONTRACT.slice(CONTRACT.indexOf('Object.assign(window,{'));
    for (const n of ['paintContractForm', 'renderBlankFormSection', 'paintBlankForm'])
      assert.ok(exp.includes(n), n + ' is published');
  });
  test('it is on the module list, so the product actually loads it', () => {
    assert.match(read('js/app.js'), /import '\.\/blanks\.js'/);
    assert.match(read('test/world.js'), /const BLANKS = 'js\/blanks\.js'/);
  });
  test('a key removed from one book leaves a screen half-English', () => {
    const en = I18N.slice(I18N.indexOf('  en: {'), I18N.indexOf('  sv: {'));
    const sv = I18N.slice(I18N.indexOf('  sv: {'));
    for (const k of ['tri_t_fill', 'tri_t_fill_no', 'tri_t_fill_ing', 'tri_fill_left_one',
      'tri_fill_left_other', 'fb_not_available', 'fb_failed', 'bf_title', 'bf_from', 'bf_copilot_filled']) {
      assert.ok(en.includes(k + ':'), k + ' in English');
      assert.ok(sv.includes(k + ':'), k + ' in Swedish');
    }
  });
});
