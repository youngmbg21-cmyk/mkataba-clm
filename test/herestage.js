/* A stage for Jambo's one rule, ANSWER WHERE YOU STAND (js/copilotacts.js
   caHereRead): the rule and the map's REAL word readers (igConditions,
   igLeftover, from js/views/intelligence.js), run as the page runs them, on a
   screen the test sets. Used by f736 and f737. Read once per file; a missing
   piece reports where it is missed (the stage's `read` is then absent). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const CA = fs.readFileSync(path.join(ROOT, 'js', 'copilotacts.js'), 'utf8');
const IG = fs.readFileSync(path.join(ROOT, 'js', 'views', 'intelligence.js'), 'utf8');
const fnOf = (src, head) => { const at = src.indexOf(head); if (at < 0) return ''; const open = src.indexOf('{', src.indexOf(')', at)); let d = 0;
  for (let i = open; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && !--d) return src.slice(at, i + 1); } return ''; };
const lineOf = (src, head) => { const at = src.indexOf(head); return at < 0 ? '' : src.slice(at, src.indexOf('\n', at)); };
const blockOf = (src, head, end) => { const at = src.indexOf(head); return at < 0 ? '' : src.slice(at, src.indexOf(end, at) + end.length); };

function hereStage(){
  const ctx = { state: { view: 'dashboard', contracts: [] }, face: 'explorer', document: { getElementById: () => ({}) },
    i18t: k => k, igbStatusWord: s => s,
    /* the reader asks these only to know the words exist; the predicates never run here */
    paySide: () => '', currentUser: () => ({ id: 'u1' }), contractOwnedBy: () => false };
  ctx.window = ctx; ctx.hbFace = () => ctx.face; ctx.igPaperUp = () => false;
  const map = [lineOf(IG, 'const _igNorm='), blockOf(IG, 'const IG_STATUS_WORDS=[', '];'), lineOf(IG, 'const IG_UNIT_DAYS='),
    fnOf(IG, 'function igMoneyOf('), lineOf(IG, 'const IG_CP_STOP='), fnOf(IG, 'function igConditions('),
    lineOf(IG, 'const IG_FILLER='), fnOf(IG, 'function igLeftover(')].join('\n');
  /* Jambo's place words, read as the page reads them, with nothing chosen and no paper up */
  const places = ['const _caChosen = new Map();', 'function caContracts(){ return []; }', 'function caOpenContract(){ return null; }', fnOf(CA, 'function caRef('),
    blockOf(CA, 'const CA_PLACES = [', '\n];'), lineOf(CA, 'const CA_PLACE_LEAD ='), lineOf(CA, 'const CA_PLACE_MAX ='),
    fnOf(CA, 'function caPlaceOf('), fnOf(CA, 'function caOnBoard('), fnOf(CA, 'function caReadPlace(')].join('\n');
  const a = CA.indexOf('const CA_HERE_FACTS = ['), z = CA.indexOf('function caHereOnList(');
  try { vm.createContext(ctx); vm.runInContext(map + '\n' + places + '\n' + CA.slice(a, z) + '\nthis.read = caHereRead; this.fact = caHereFact; this.CA_HERE_FACTS = CA_HERE_FACTS; this.CA_HERE_LIST = CA_HERE_LIST; this.place = caReadPlace;', ctx); } catch (_){}
  return ctx;
}
module.exports = { hereStage, CA, IG, fnOf };
