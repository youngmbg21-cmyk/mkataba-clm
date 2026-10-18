/* f664 — THREE DOORS ON EVERY LIST (owner, 12 Oct 2026). The right-hand panel
   on Contracts, Negotiations, Approvals & signing, Obligations and Requests
   draws Document · Negotiation · Workspace from one builder (insDoorActs);
   SINCE 15 OCT 2026 TWO (owner: "we have 2 buttons to the same page so
   document will simply need to be deleted"): Negotiation · Workspace;
   the words drop "Open"; the page's own door is filled, or none where the
   page has a filled verb of its own; Negotiation greys with its reason where
   nothing is being negotiated; every door acts on ITS contract. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('every list panel draws its doors from the one builder', () => {
  assert.match(strip(R('js/views/register.js')), /return insDoorActs\(c, \{ lead: neg \? 'nego' : 'ws' \}\);/);
  /* RE-POINTED 18 Oct 2026 (round 15 as drawn, owner's "build all the
     gaps" — the picked drawing over this rule for the one panel it draws):
     an Approval's panel draws none; a signature's keeps both */
  assert.match(strip(R('js/views/approvalsview.js')), /const open=tab==='approvals'\?\[\]:insDoorActs\(r\.c\);/);
  /* RE-POINTED 15 Oct 2026: no Document door, so no page hands one a landing */
  assert.match(strip(R('js/obligations.js')), /acts\.push\(\.\.\.insDoorActs\(c\)\);/);
  assert.match(strip(R('js/views/intake.js')), /insDoorActs\(doorC,\{ lead:'ws' \}\)/);
});

test('the panel\'s ⋯ no longer repeats Workspace; the row menu keeps it', () => {
  const reg = strip(R('js/views/register.js'));
  /* RE-POINTED 18 Oct 2026 (round 14 as drawn): no ⋯ in the Negotiation
     panel at all; the Contracts seat keeps its row menu, less Workspace */
  assert.match(reg, /if\(c&&seat!=='negotiations'\)\{ try\{ menu=regRowActsHtml\(c,\['open'\]\); \}/);
  assert.match(reg, /\{k:'open',\s*ic:'folderOpen'/);
});

test('the words: Document, Negotiation, Workspace — in both books', () => {
  const i18n = R('js/i18n.js');
  for (const [k, en, sv] of [['ins_door_nego', 'Negotiation', 'Förhandling'], ['ins_door_ws', 'Workspace', 'Arbetsyta']]){
    assert.ok(i18n.includes(`${k}: '${en}'`), k + ' in English');
    assert.ok(i18n.includes(`${k}: '${sv}'`), k + ' in Swedish');
  }
  assert.ok(i18n.includes("reg_open_workspace: 'Workspace'") && i18n.includes("int_open_workspace: 'Workspace'"), 'the other Workspace doors say it too');
});

test('the builder: three doors, the lead filled, Negotiation greyed with its reason, each on its own contract', () => {
  const ins = strip(R('js/views/inspector.js'));
  const body = ins.slice(ins.indexOf('function insDoorActs'), ins.indexOf('function insActsHtml'));
  assert.doesNotMatch(body, /ins_door_doc|door-doc/, 'no Document door (owner, 15 Oct 2026)');
  assert.match(body, /const order = o\.lead === 'ws' \? \['ws', 'nego'\] : \['nego', 'ws'\];/, 'the lead first, two doors');
  /* RE-POINTED 18 Oct 2026 (rounds 14 and 19 as drawn, owner's "build all
     the gaps"): the doors wear their words only, no mark before them */
  assert.match(body, /\{ k: 'door-nego', door: true, label: i18t\('ins_door_nego'\),/);
  assert.match(body, /\{ k: 'door-ws', door: true, label: i18t\('ins_door_ws'\),/);
  assert.doesNotMatch(body, /icon: '/, 'no icon on a door');
  assert.match(body, /disabled: !ns\.ok, title: ns\.ok \? '' : ns\.why/);
  /* RE-POINTED 14 Oct 2026 (the overnight work order, step 2; was the room,
     on Details while owed, 12 Oct): the Workspace door opens Home through the
     one landing every Workspace door shares — Fill in while owed, else the
     paper on Jambo — and the room only where Home has no paper (the phone) */
  const ws = body.slice(body.indexOf("k: 'door-ws'"), body.indexOf('const all ='));
  assert.match(ws, /run: \(\) => \{ if \(typeof roomHomeLand === 'function' && roomHomeLand\(c\.id\)\) return;\s*openWorkspace\(c\.id\);/, 'Home first, the room only as the fallback');
  assert.match(body, /roomGoTab\(live, left \? 'details' : 'terms'\)/, 'the phone\'s fallback keeps Details while owed, else the Overview');
  assert.doesNotMatch(body, /x\.id/, 'a door never reads the id of what the panel hands it');
  assert.match(ins, /<div class="ins-acts ins-doors">\$\{doors\}\$\{more\}<\/div>/, 'the doors stand in a row of their own, the ⋯ at its end');
});
