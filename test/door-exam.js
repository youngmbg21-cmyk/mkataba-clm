/* ============================================================
   THE DOOR EXAM — EVERY DOOR HaTi HAS, ASKED FOR IN EVERYDAY WORDS
   (owner, 23 Oct 2026: "stop taking short cuts and do what is necessary for
   jambo to get things right")
   ============================================================
   The navigation exam (test/nav-exam.js) is a list of sentences somebody
   remembered to write; a door nobody wrote a sentence for was never asked.
   This exam is the other way round: test/chromium/door-exam-verify.js reads
   HaTi's OWN lists of doors from the running app — every part of a contract
   (NAV_ACTS), every place (NAV_PLACES), every row of the paper's menu
   (CA_MENU), every place word (CA_PLACES), every Settings page and card
   (SET_PANELS, the You rows, the Company pages) — and FAILS when any door has
   no sentence here that lands on it. A new door therefore cannot ship
   without one. Settings pages need no line: their own titles are asked,
   read off the app.

   Each line: { door, q, spot } — door is '<list>:<key>', q what a person
   types (MK-… numbers of test/nav-world.js), spot where the app must then
   stand, in test/nav-read.js's words. A menu row and a place word are READ
   (the row or place Jambo reads them as), the rest are typed and landed. */

const ACT = [
  ['open', 'open MK-A2', { page: 'paper', cid: 'MK-A2' }],
  ['paper', 'the paper of MK-A2', { page: 'paper', cid: 'MK-A2' }],
  ['dossier', 'dossier of MK-A2', { page: 'paper', cid: 'MK-A2', pane: 'dossier' }],
  ['fill', 'fill in MK-A2', { page: 'paper', cid: 'MK-A2' }],
  ['send', 'send MK-A2 for review', { page: 'paper', cid: 'MK-A2', pane: 'send' }],
  ['clauses', 'plain english of MK-A1', { page: 'paper', cid: 'MK-A1', pane: 'clauses' }],
  ['amend', 'amend MK-B1', { page: 'paper', cid: 'MK-B1', pane: 'amend' }],
  ['oblig', 'obligations of MK-C1', { page: 'paper', cid: 'MK-C1', pane: 'oblig' }],
  ['hist', 'history of MK-A2', { page: 'paper', cid: 'MK-A2', pane: 'hist' }],
  ['terms', 'key terms of MK-A2', { kt: true }],
  ['value', 'value of MK-A2', { kt: true }],
  ['counterparty', 'who is the counterparty on MK-A2', { kt: true }],
  ['category', 'category of MK-A2', { kt: true }],
  ['stream', 'move MK-A2 to sales', { kt: true }],
  ['rename', 'rename MK-A2', { kt: true }],
  ['codename', 'code name for MK-A2', { dialog: 'codename' }],
  ['nda', 'nda details of MK-D1', { kt: true }],
  ['signers', 'who signs MK-A2', { dialog: 'signers' }],
  ['people', 'who else is on MK-A2', { dialog: 'people' }],
  ['family', 'amendments to MK-A2', { page: 'paper', cid: 'MK-A2', fold: 'family' }],
  ['renewal', 'renewal of MK-A1', { page: 'paper', cid: 'MK-A1', pane: 'oblig' }],
  ['where', 'where we are on MK-A2', { page: 'paper', cid: 'MK-A2', strip: 'where' }],
  ['notes', 'notes on MK-A2', { page: 'paper', cid: 'MK-A2', panel: 'notes' }],
  ['risks', 'risks in MK-A2', { page: 'paper', cid: 'MK-A2', landedDs: 'risks' }],
  ['ladder', 'ladder for MK-A2', { page: 'paper', cid: 'MK-A2', pane: 'redlines' }],
  ['opened', 'who opened MK-A2', { page: 'paper', cid: 'MK-A2', pane: 'hist' }],
];
const PLACE = [
  ['news', 'news', { panel: 'alerts' }],
  ['recent', 'recent', { recent: true }],
  ['present', 'present', { present: true }],
  ['health', 'health report', { popup: true }],
  ['weekly', 'weekly report', { popup: true }],
  ['findings', 'findings', { page: 'explorer', fdTab: true }],
  ['savedviews', 'saved views', { page: 'board' }],
  ['archived', 'archived contracts', { page: 'contracts', archived: true }],
  ['week', 'my week', { page: 'calendar' }],
  ['profile', 'my profile', { page: 'settings', settings: { tab: 'you' } }],
  ['company', 'company settings', { page: 'settings', settings: { tab: 'company' } }],
  ['access', 'access review', { page: 'settings', settings: { page: 'sheet' } }],
  ['keeping', 'retention', { page: 'settings', settings: { page: 'streams' } }],
  ['privstreams', 'private streams', { page: 'settings', settings: { page: 'streams' } }],
  ['budget', 'jambo budget', { page: 'settings', settings: { page: 'engine' } }],
  ['roles', 'business roles', { page: 'settings', settings: { page: 'roles' } }],
  ['webhooks', 'webhooks', { page: 'settings', settings: { page: 'webhooks' } }],
  ['watches', 'watches', { watchList: true }],
];
/* the paper's menu rows: READ as that row for the contract named (a press still opens it there) */
const MENU = [
  ['export', 'export MK-A2'], ['pdf', 'pdf of MK-A2'], ['wordx', 'download MK-A2 as word'], ['record', 'sealed record of MK-A1'],
  ['signed', 'add the signed copy of MK-A2'], ['adviser', 'adviser link for MK-A2'], ['import', 'import their word file for MK-A2'],
  ['compare', 'compare MK-A2'], ['filing', 'filing of MK-A2'], ['mynote', 'private note on MK-A2'], ['restore', 'restore MK-A2'],
  ['release', 'release MK-A2'], ['end', 'put MK-A2 on legal hold'], ['reopen', 'reopen MK-A2'], ['delete', 'delete MK-C2'],
  ['review', 'ask for review on MK-A2'], ['playbook', 'check MK-A2 against our standards'], ['prepare', 'prepare the redlines for MK-A2'],
  ['addclause', 'add a clause to MK-A2'], ['editclause', 'edit a clause in MK-A2'],
];

const DOOR_EXAM = [
  ...ACT.map(([k, q, spot]) => ({ door: 'act:' + k, q, spot })),
  ...PLACE.map(([k, q, spot]) => ({ door: 'place:' + k, q, spot })),
  ...MENU.map(([k, q]) => ({ door: 'menu:' + k, q, read: { kind: 'menu', menu: k } })),
];
/* the boxes each typed line is asked from: the Board, a list's panel, and Settings' own box (where a
   Settings page asked by name stays the finder's answer, so Settings' lines are not asked there) */
const DOOR_BOXES = ['board', 'list', 'settings'];

module.exports = { DOOR_EXAM, DOOR_BOXES };
