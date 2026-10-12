/* f664 — THREE DOORS ON EVERY LIST (owner, 12 Oct 2026). The right-hand panel
   on Contracts, Negotiations, Approvals & signing, Obligations and Requests
   draws Document · Negotiation · Workspace from one builder (insDoorActs);
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
  assert.match(strip(R('js/views/register.js')), /return insDoorActs\(c, \{ lead: neg \? 'nego' : 'doc'/);
  assert.match(strip(R('js/views/approvalsview.js')), /const open=insDoorActs\(r\.c\);/);
  assert.match(strip(R('js/obligations.js')), /insDoorActs\(c, \{ doc: \(\) => obOpenContract\(c\.id\) \}\)/);
  assert.match(strip(R('js/views/intake.js')), /insDoorActs\(doorC,\{ lead:'doc' \}\)/);
});

test('the panel\'s ⋯ no longer repeats Workspace; the row menu keeps it', () => {
  const reg = strip(R('js/views/register.js'));
  assert.match(reg, /menu=regRowActsHtml\(c,\['open'\]\)/);
  assert.match(reg, /\{k:'open',\s*ic:'folderOpen'/);
});

test('the words: Document, Negotiation, Workspace — in both books', () => {
  const i18n = R('js/i18n.js');
  for (const [k, en, sv] of [['ins_door_doc', 'Document', 'Dokument'], ['ins_door_nego', 'Negotiation', 'Förhandling'], ['ins_door_ws', 'Workspace', 'Arbetsyta']]){
    assert.ok(i18n.includes(`${k}: '${en}'`), k + ' in English');
    assert.ok(i18n.includes(`${k}: '${sv}'`), k + ' in Swedish');
  }
  assert.ok(i18n.includes("reg_open_workspace: 'Workspace'") && i18n.includes("int_open_workspace: 'Workspace'"), 'the other Workspace doors say it too');
});

test('the builder: three doors, the lead filled, Negotiation greyed with its reason, each on its own contract', () => {
  const ins = strip(R('js/views/inspector.js'));
  const body = ins.slice(ins.indexOf('function insDoorActs'), ins.indexOf('function insActsHtml'));
  assert.match(body, /icon: 'file', label: i18t\('ins_door_doc'\)/);
  assert.match(body, /icon: 'msg', label: i18t\('ins_door_nego'\)/);
  assert.match(body, /icon: 'folderOpen', label: i18t\('ins_door_ws'\)/);
  assert.match(body, /disabled: !ns\.ok, title: ns\.ok \? '' : ns\.why/);
  /* RE-POINTED 12 Oct 2026: the Workspace door lands on Details while
     anything is left to fill in, on the Overview otherwise (owner) */
  assert.match(body, /roomGoTab\(live, left \? 'details' : 'terms'\)/, 'Workspace lands on Details while owed, else the Overview');
  assert.doesNotMatch(body, /x\.id/, 'a door never reads the id of what the panel hands it');
  assert.match(ins, /<div class="ins-acts ins-doors">\$\{doors\}\$\{more\}<\/div>/, 'the doors stand in a row of their own, the ⋯ at its end');
});
