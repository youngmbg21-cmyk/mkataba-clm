/* ---- READING AN IMPORTED CONTRACT: THE RULES BOTH HOSTS USE (27 Sep 2026) ----
   Archive import's reading moved to the server so it carries on when the tab
   is closed (runImportQueue, server/server.js). What the READING decides — does
   a person have to check this one, and which value stream does its type
   belong in — was written in js/views/migration.js, which the server cannot
   load. It lives here now, once, so the browser's import and the server's
   cannot come to disagree about which contracts need a human.
   Like js/graphwhere.js: globals in the browser, a require on the server. */
/* The fields a contract cannot be worked without. */
const MIG_CRITICAL = ['counterparty', 'contractType', 'effectiveDate', 'expiryDate', 'value'];
/* DOES THIS READING NEED A HUMAN? Any critical field missing or low
   confidence — and a machine-read scan ALWAYS, once (see migNeedsReview's
   note in js/views/migration.js for the measurement behind that). `valueNone`
   is the contract's own word that no money passes; `ocr` whether its text was
   machine-read from a scan. */
function migReadNeedsReview(meta, opts){
  const o = opts || {};
  if (o.ocr) return true;
  const conf = (meta && meta.confidence) || {};
  return MIG_CRITICAL.some(k => {
    const v = meta ? meta[k] : null;
    if (k === 'value' && o.valueNone) return false;
    if (v == null || v === '' || (k === 'value' && !(Number(v) > 0))) return true;
    return conf[k] === 'low';
  });
}
/* Route a contract-type phrase to a value-stream folder (order matters:
   "equipment lease" must land in mfg before the generic "lease" → corp). */
function folderFromType(typeStr){
  const t = String(typeStr || '').toLowerCase();
  if (!t) return null;
  if (/equipment|machin|plant\s*lease|forklift/.test(t)) return 'mfg';
  if (/co-?pack|toll|manufactur|production/.test(t)) return 'mfg';
  if (/raw material|ingredient|commodity|packag|bottle|carton|supply agreement|procure/.test(t)) return 'proc';
  if (/warehous|cold[\s-]?chain|3pl|freight|logistic|transport|distribution(?!\s*agreement)|haul/.test(t)) return 'dist';
  if (/distributor|retail|listing|route.to.market|e-?commerce|sales/.test(t)) return 'sales';
  if (/marketing|media|agency|advertis|sponsor|activation|brand|influencer/.test(t)) return 'mktg';
  if (/nda|non.disclosure|confidential|lease|tenanc|audit|legal|professional|consult|advisory|insurance|software|licen[cs]e|saas|it\s|employment/.test(t)) return 'corp';
  return null;
}
const MR_API = { MIG_CRITICAL, migReadNeedsReview, folderFromType };
if (typeof window !== 'undefined') Object.assign(window, MR_API);
if (typeof module !== 'undefined' && module.exports) module.exports = MR_API;
