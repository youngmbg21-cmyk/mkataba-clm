/* THE BOARD'S TEST WORLD, shared by the board-answers-right tests (f511–f521):
   Home's board in jsdom over the precision book's own contracts. */
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { bookContracts, mon } = require('./board-precision');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HB_SRC = read('js/views/homeboard.js');
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const J = v => (v == null ? v : JSON.parse(JSON.stringify(v)));

function boardWorld(opts){
  const o = opts || {};
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: o.contracts || bookContracts(), settings: o.settings || {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
  w.paySide = c => ({ supplier: 'supplier', customer: 'customer' })[(c.metadata && c.metadata.category) || ''] || null;
  w.contractExpired = c => c.status === 'Signed' && !!c.expiry && c.expiry < mon(0, 1);
  w.isMonetary = () => true;
  w.currentUser = () => o.user || ({ id: 'u_test', name: 'Test User', role: 'legal' });
  if (o.before) o.before(w);
  w.eval(HB_SRC);
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; s.digBig = false;
  return w;
}
const openKey = w => (w.hbS().path || []).slice(-1)[0];
const openPlan = w => { const s = w.hbS(); const key = openKey(w); const D = key ? w.hbDigData(key, s.lens) : null; return { key, D, P: D ? J(w.hbPlan(D)) : null }; };
const text = h => String(h || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').trim();

module.exports = { ROOT, read, strip, J, boardWorld, openKey, openPlan, text, HB_SRC };
