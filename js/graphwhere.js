/* ---- ONE FILTER, TWO HOSTS (Copilot audit phase 4, 11 Sep 2026) ----
   The graph's structured `where` — fourteen keys the model names and HaTi
   applies itself over its own cards — was written once, in
   js/views/intelligence.js, for the graph route. list_portfolio in the chat
   loop offered four filters of its own. Copilot's reach is now the graph's
   vocabulary on BOTH hosts, and the PREDICATE is written here once: the
   browser applies it over graphCopilotCard, the server over its own reading
   of the same record (copilotCardOf). Neither host carries a second copy of
   the matching rules. The key LIST stays where each host declares it
   (GRAPH_WHERE_KEYS — f299 pins the two as a SET); this file takes it as an
   argument so it publishes no name another module declares.
   Like js/jurisdiction.js: globals in the browser, a require on the server. */
function graphWhereNarrow(where, keys){
  if (!where || typeof where !== 'object' || Array.isArray(where)) return null;
  const w = {};
  (keys || []).forEach(k => { const v = where[k]; if (v == null || v === '' || (Array.isArray(v) && !v.length)) return; w[k] = v; });
  return Object.keys(w).length ? w : null;
}
/* Does one CARD pass the narrowed filter. `reads.daysUntil(iso)` is the host's
   own day arithmetic; `reads.folderIdOf(name)` answers the id for a folder
   NAME where the host knows names (the browser), '' where it does not. A card
   carrying no value never matches a money cut — an absence is stated, not
   guessed. */
function graphWhereHit(k, w, reads){
  const r = reads || {};
  const daysUntil = typeof r.daysUntil === 'function' ? r.daysUntil : (() => NaN);
  const folderIdOf = typeof r.folderIdOf === 'function' ? r.folderIdOf : (() => '');
  const fold = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const list = v => (Array.isArray(v) ? v : [v]).map(fold).filter(Boolean);
  if (w.status != null && !list(w.status).includes(fold(k.status))) return false;
  if (w.folder != null){ const want = list(w.folder); const f = fold(k.folder); const id = fold(folderIdOf(k.folder)); if (!want.some(x => x === f || (id && x === id) || f.includes(x))) return false; }
  if (w.kind != null && !list(w.kind).some(x => fold(k.kind).includes(x))) return false;
  if (w.counterparty != null && !list(w.counterparty).some(x => fold(k.counterparty).includes(x))) return false;
  if (w.valueAbove != null){ if (typeof k.value !== 'number' || !(k.value >= Number(w.valueAbove))) return false; }
  if (w.valueBelow != null){ if (typeof k.value !== 'number' || !(k.value <= Number(w.valueBelow))) return false; }
  if (w.expiringWithinDays != null){ if (!k.expiry) return false; const d = daysUntil(k.expiry); if (d == null || isNaN(d) || d < 0 || d > Number(w.expiringWithinDays)) return false; }
  if (w.signedFrom != null){ if (!k.signedAt || k.signedAt < String(w.signedFrom).slice(0, 10)) return false; }
  if (w.signedTo != null){ if (!k.signedAt || k.signedAt > String(w.signedTo).slice(0, 10)) return false; }
  if (w.overdueObligations != null){ if (!!w.overdueObligations !== (k.overdue > 0)) return false; }
  if (w.offStandard != null){ if (!!w.offStandard !== (k.offStandard > 0)) return false; }
  if (w.notRead != null){ if (!!w.notRead !== (k.read === false)) return false; }
  if (w.move != null){ const want = fold(w.move); const mv = want === 'mine' || want === 'you' || want === 'us' ? 'you' : want === 'theirs' || want === 'them' ? 'them' : want; if (k.move !== mv) return false; }
  if (w.archived != null){ if (!!w.archived !== !!k.archived) return false; }
  return true;
}
const GW_API = { graphWhereNarrow, graphWhereHit };
if (typeof window !== 'undefined') Object.assign(window, GW_API);
if (typeof module !== 'undefined' && module.exports) module.exports = GW_API;
