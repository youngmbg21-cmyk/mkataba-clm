// HaTi — extracted module. Globals are window-attached on purpose: the app is
// written against a single global scope (inline onclick handlers, cross-module
// calls); modules give file isolation for editing, not scope isolation.
/* ============================================================
   COPILOT'S AGENTS — THE ENGINE ROOM'S DOOR (27 Sep 2026: "implement all the
   fixes", over the agents review)
   ============================================================
   Copilot's work (js/views/agents.js) is a READING of the book and talks to
   no route itself (f399, f413 7d). What the agents DO happens on the server
   (runAgent and the six runners, server/server.js); this file is the one
   door between the two:
     · agentsStatus / agentsStatusLoad — how each agent is: on or off, when it
       last ran and what it did, skipped and why, when it runs next, and (to
       an admin) what it cost and its settings;
     · agentRunNow / agentSaveCfg / agentSendBack — an admin's Run now, an
       agent's settings, and "Send back with a note";
     · shareKeepOpen — the press that keeps a link that is about to run out
       working;
     · importQueueRead — Archive import handing its files' text to the server;
     · THE PAGE UPDATES ITSELF (agentsWatch): while Copilot's work is on
       screen it asks the server every half minute whether anything moved
       (the status's `stamp`), and only then fetches the rows that changed —
       and every five minutes whether the other side can still answer on
       each live deal, because a link runs out with nothing written anywhere.
       A row being edited here (a save on its way) is never overwritten. */
let _arStatus = null;
let _arSince = '';
let _arTimer = null;
let _arBusy = false;
let _arReachAt = 0;
const AR_BEAT_MS = 30000;
const AR_REACH_MS = 5 * 60000;
function agentsStatus(){ return _arStatus; }
async function agentsStatusLoad(){
  if (!(typeof API_MODE === 'function' && API_MODE())) return null;
  try {
    const s = await api('agents/status', 'GET', undefined, { quiet: true });
    if (s && s.agents){ _arStatus = s; if (!_arSince) _arSince = s.at || ''; }
    return s;
  } catch (_){ return null; }
}
async function agentRunNow(k){
  const r = await api('agents/' + encodeURIComponent(k) + '/run', 'POST', {});
  await agentsStatusLoad();
  return r;
}
async function agentSaveCfg(k, patch){
  const r = await api('agents/' + encodeURIComponent(k) + '/settings', 'PUT', patch || {});
  await agentsStatusLoad();
  return r;
}
async function agentSendBack(k, body){
  const r = await api('agents/' + encodeURIComponent(k) + '/sendback', 'POST', body || {});
  await agentsStatusLoad();
  return r;
}
async function shareKeepOpen(c, token){
  const r = await api('shares/' + encodeURIComponent(token) + '/extend', 'POST', {});
  if (c && typeof reachTake === 'function') reachTake(c, r);
  return r;
}
async function importQueueRead(items){ return api('import/read', 'POST', { items: items || [] }); }

/* ONE ROW FROM THE SERVER, TAKEN INTO THE BOOK — the list's own shape.
   Returns true where something on screen may have moved. */
const AR_KEEP = new Set(['_v', '_light', '_loaded']);
async function contractsTakeRow(row){
  if (!row || !row.id || !state || !Array.isArray(state.contracts)) return false;
  const cur = (typeof getContract === 'function') ? getContract(row.id) : null;
  if (!cur){
    const c = (typeof migrateContract === 'function') ? migrateContract(row) : row;
    c._light = true; c._loaded = false; c._v = row._v;
    state.contracts.unshift(c);
    return true;
  }
  /* AN EDIT ON ITS WAY WINS — the save will meet the newer version itself and
     ask ("changed on the server"), which is the product's own rule. */
  if (typeof contractSavePending === 'function' && contractSavePending(cur)) return false;
  if (Number(cur._v) === Number(row._v)){
    /* The same record — but the server's own readings ride beside it and may
       have moved without a save: a link that ran out, answers prepared. */
    let moved = false;
    for (const k of Object.keys(row)){
      if (k.charAt(0) !== '_' || AR_KEEP.has(k)) continue;
      if (JSON.stringify(cur[k]) !== JSON.stringify(row[k])){ cur[k] = row[k]; moved = true; }
    }
    for (const k of ['_roundPrep']) if (cur[k] !== undefined && row[k] === undefined){ delete cur[k]; moved = true; }
    return moved;
  }
  if (Number(row._v) < Number(cur._v)) return false;
  if (cur._loaded){
    /* A whole record is held here: read it whole again, never shrink it to a
       list row. */
    try {
      const full = await api('contracts/' + encodeURIComponent(row.id), 'GET', undefined, { quiet: true });
      if (full && !contractSavePending(cur)){ Object.assign(cur, full); cur._v = full._v; cur._loaded = true; cur._light = false; }
    } catch (_){ return false; }
    return true;
  }
  const next = (typeof migrateContract === 'function') ? migrateContract(row) : row;
  Object.keys(cur).forEach(k => { if (!(k in next)) delete cur[k]; });
  Object.assign(cur, next);
  cur._light = true; cur._loaded = false; cur._v = row._v;
  return true;
}
/* WHAT MOVED SINCE THE PAGE LAST LOOKED. */
async function contractsTakeChanged(opts){
  const o = opts || {};
  const q = 'contracts/changed?since=' + encodeURIComponent(_arSince || '') + (o.reach ? '&reach=1' : '');
  let r = null;
  try { r = await api(q, 'GET', undefined, { quiet: true }); } catch (_){ return false; }
  if (!r) return false;
  let moved = false;
  for (const row of (Array.isArray(r.rows) ? r.rows : [])) if (await contractsTakeRow(row)) moved = true;
  if (r.at) _arSince = r.at;
  if (r.reach && typeof r.reach === 'object'){
    _arReachAt = Date.now();
    for (const [id, x] of Object.entries(r.reach)){
      const c = getContract(id);
      if (c && JSON.stringify(c._reach) !== JSON.stringify(x) && typeof reachTake === 'function' && reachTake(c, { reach: x })) moved = true;
    }
  }
  return moved;
}
/* THE BEAT. Asked by the page when it paints, and every AR_BEAT_MS while it
   is on screen and the window is in view; it stops itself on any other page. */
async function agentsBeat(force){
  if (!(typeof API_MODE === 'function' && API_MODE())) return false;
  if (_arBusy) return false;
  if (!force && typeof document !== 'undefined' && document.hidden) return false;
  _arBusy = true;
  try {
    const before = _arStatus && _arStatus.stamp;
    const s = await agentsStatusLoad();
    const stampMoved = !!(s && s.stamp !== before);
    const reachDue = Date.now() - _arReachAt > AR_REACH_MS;
    let moved = false;
    if (stampMoved || reachDue || force) moved = await contractsTakeChanged({ reach: reachDue || !!force });
    if ((stampMoved || moved) && state && state.view === 'agents' && typeof agRepaint === 'function') agRepaint();
    return stampMoved || moved;
  } finally { _arBusy = false; }
}
function agentsWatch(){
  if (_arTimer || typeof setInterval !== 'function') return;
  _arTimer = setInterval(() => {
    if (!state || state.view !== 'agents'){ clearInterval(_arTimer); _arTimer = null; return; }
    agentsBeat(false).catch(() => {});
  }, AR_BEAT_MS);
}

Object.assign(window, { agentsStatus, agentsStatusLoad, agentRunNow, agentSaveCfg, agentSendBack, shareKeepOpen,
  importQueueRead, contractsTakeRow, contractsTakeChanged, agentsBeat, agentsWatch, AR_BEAT_MS, AR_REACH_MS });
