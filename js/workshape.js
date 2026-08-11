/* ============================================================================
   HaTi — WHAT SHAPE THE WORK IS, AND WHAT THIS BUSINESS CALLS IT.

   Two company settings, and they exist because analytics do not vary by
   INDUSTRY — they vary by the SHAPE of the agreement. A roofing job and a law
   firm's matter are the same shape: they start, they run, they finish, and
   they leave a tail behind them. A supply agreement and a hotel's rate card
   are the same shape: they run on until somebody stops them. Two businesses in
   completely different trades want the same panels; two businesses in the same
   trade may not.

   SHAPE decides WHICH panels appear beside the universal six.
   THE WORD decides what those panels are called. A roofer reads "job", a
   designer "project", a printer "order", a law firm "matter". Same panel, same
   code, different noun — and the noun is not decoration: a screen that calls a
   roofer's work a "matter" is a screen he does not believe.

   Both are the COMPANY's, like the market and unlike the language: every
   member of a workspace sees the same answer, and only an admin changes it.
   Stored the same way the market is — the org record, the browser as fallback,
   and the server so anything built without a browser present agrees.
   ========================================================================= */

const WS_SHAPES = ['standing', 'project'];
/* The nouns a business might use for one piece of work. Deliberately short:
   a list of thirty is a list nobody reads to the end of, and "other" here
   would just mean the screen says nothing useful. */
const WS_WORDS = ['job', 'project', 'order', 'matter', 'engagement', 'case'];
const WS_LS = 'hati.v1.workshape';
const WS_DEFAULT = { shapes: ['standing'], word: 'project' };

function wsCfg(){
  let out = null;
  try{
    const org = (typeof getOrg === 'function' && getOrg()) || null;
    if (org && org.workShape) out = org.workShape;
  }catch(e){}
  if (!out) { try{ out = (typeof lsGet === 'function' && lsGet(WS_LS)) || null; }catch(e){} }
  const shapes = (out && Array.isArray(out.shapes) ? out.shapes : WS_DEFAULT.shapes)
    .filter(s => WS_SHAPES.indexOf(s) >= 0);
  const word = (out && WS_WORDS.indexOf(out.word) >= 0) ? out.word : WS_DEFAULT.word;
  /* A workspace with no shape at all would show only the universal six and
     never explain why, so an empty list falls back rather than sticking. */
  return { shapes: shapes.length ? shapes : WS_DEFAULT.shapes, word };
}
const wsShapes = () => wsCfg().shapes;
const wsHas = s => wsShapes().indexOf(s) >= 0;
const wsWord = () => wsCfg().word;
/* Three forms, because a heading, a sentence and a count need different ones
   and building "job"+"s" in code is how a Swedish screen ends up half English. */
const wsOne   = () => i18t('ww_' + wsWord());
const wsMany  = () => i18t('ww_' + wsWord() + '_pl');
const wsTitle = () => i18t('ww_' + wsWord() + '_title');
const wsCount = n => (typeof i18tn === 'function')
  ? i18tn('ww_n_' + wsWord(), n, { n }) : n + ' ' + (n === 1 ? wsOne() : wsMany());

function wsSet(shapes, word){
  const cfg = {
    shapes: (Array.isArray(shapes) ? shapes : []).filter(s => WS_SHAPES.indexOf(s) >= 0),
    word: WS_WORDS.indexOf(word) >= 0 ? word : WS_DEFAULT.word,
  };
  if (!cfg.shapes.length) cfg.shapes = WS_DEFAULT.shapes.slice();
  try{ if (typeof lsSet === 'function') lsSet(WS_LS, cfg); }catch(e){}
  try{
    const org = (typeof getOrg === 'function' && getOrg()) || null;
    if (org){ org.workShape = cfg;
      if (typeof REMOTE !== 'undefined' && REMOTE && REMOTE.org) REMOTE.org.workShape = cfg;
      else if (typeof lsSet === 'function' && typeof LS === 'object') lsSet(LS.org, org); }
  }catch(e){}
  /* And the server, for the same reason the market goes there: anything built
     without a browser in front of it must agree with what the screens say. */
  try{
    if (typeof window !== 'undefined' && typeof window.API_MODE === 'function' && window.API_MODE()
        && typeof window.api === 'function')
      window.api('org/workshape', 'PUT', cfg).catch(() => {});
  }catch(e){}
  return cfg;
}

/* ---- what the book itself looks like ----
   An admin should not have to guess. A contract with a start AND an end and a
   term under about eighteen months reads as a piece of work; one that runs on,
   auto-renews, or has no end date at all reads as standing. This SUGGESTS —
   it never sets anything, because a business knows what it does and a
   heuristic does not. */
const WS_PROJECT_MAX_DAYS = 550;
const wsStartOf = c => (c.metadata && c.metadata.effectiveDate) || (c.fields && c.fields.effDate)
  || (c.signedAt ? String(c.signedAt).slice(0, 10) : null) || null;
const wsEndOf = c => (typeof effectiveExpiry === 'function' ? effectiveExpiry(c) : null)
  || (c.metadata && c.metadata.expiryDate) || c.expiry || null;

/* ONE RULE, read by three callers: the suggestion on the Settings card, the
   panels that draw work, and the counts underneath them. Split across those
   three it would say "we can see 12 jobs" and then draw 3, which is the kind
   of disagreement that costs a customer's trust in every other figure too. */
function wsIsProject(c){
  const m = c.metadata || {};
  /* Retention and a defects period only exist on work that gets handed over.
     Either one settles it however the dates read. */
  if (Number(m.retentionPct) > 0 || Number(m.warrantyMonths) > 0) return true;
  if (m.renewalType === 'auto-renew' || m.renewalType === 'evergreen') return false;
  const start = wsStartOf(c), end = wsEndOf(c);
  if (!start || !end) return false;
  const days = (Date.parse(end + 'T00:00:00') - Date.parse(start + 'T00:00:00')) / 864e5;
  return isFinite(days) && days > 0 && days <= WS_PROJECT_MAX_DAYS;
}
/* Told apart, or honestly not told apart at all. A contract with no start date
   is not standing — it is unknown, and saying so is what stops the suggestion
   reading as a measurement. */
function wsClassify(c){
  const m = c.metadata || {};
  if (Number(m.retentionPct) > 0 || Number(m.warrantyMonths) > 0) return 'project';
  if (m.renewalType === 'auto-renew' || m.renewalType === 'evergreen') return 'standing';
  const end = wsEndOf(c);
  if (!end) return 'standing';
  if (!wsStartOf(c)) return 'unknown';
  return wsIsProject(c) ? 'project' : 'standing';
}
function wsDetect(){
  const cs = (typeof state === 'object' && state.contracts) ? state.contracts.filter(c => c.status !== 'Declined') : [];
  let project = 0, standing = 0, unknown = 0;
  cs.forEach(c => { const k = wsClassify(c);
    if (k === 'project') project++; else if (k === 'standing') standing++; else unknown++; });
  return { project, standing, unknown, total: cs.length,
    suggests: (project && standing) ? ['standing', 'project'] : project ? ['project'] : ['standing'] };
}

Object.assign(window,{WS_SHAPES,WS_WORDS,WS_DEFAULT,WS_PROJECT_MAX_DAYS,
  wsCfg,wsShapes,wsHas,wsWord,wsOne,wsMany,wsTitle,wsCount,wsSet,wsDetect,wsIsProject,wsClassify,wsStartOf,wsEndOf});
