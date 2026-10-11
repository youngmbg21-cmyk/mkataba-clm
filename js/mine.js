// HaTi — My items: a person's own calendar events and private notes.
/* ============================================================================
   MINE — WHAT BELONGS TO ONE PERSON (Young, 10 Oct 2026, the "HaTi
   Proposals" artifact, Parts 3 and 4)
   ----------------------------------------------------------------------------
   Two kinds, one store: EVENTS on the person's own calendar (theirs, or a
   block Copilot proposed that they added) and NOTES in their private ledger
   (a contract and words in it optional, a "review by" day optional). Plus one
   PREF row: what Copilot may do in their calendar ("Ask me first", the start,
   or "Just do it") and their working hours.

   PRIVATE: on a server every read and write goes through /api/me/items, which
   is scoped to the signed-in person — no colleague, admin list, share or
   contract history ever sees them. Without a server (the static demo) they
   live in this browser only.

   ONE STORE, TWO PAGES: the Calendar (js/views/calendar.js) and My notes
   (js/views/mynotes.js) both read here, and a note's review day shows on the
   calendar and in the bell. Nothing here sends anything.
   ========================================================================== */
const MINE_LS = 'hati.v1.mine';
const MINE_PREF_DEFAULT = { copilotLevel: 'ask', dayStart: 8, dayEnd: 17 };
let _mine = { event: [], note: [], pref: null, loaded: false, loading: null };

const mineServer = () => typeof API_MODE === 'function' && API_MODE();
function mineLocalRead(){
  try{ const j = JSON.parse(localStorage.getItem(MINE_LS) || 'null'); return j && typeof j === 'object' ? j : null; }catch(_){ return null; }
}
function mineLocalWrite(){
  try{ localStorage.setItem(MINE_LS, JSON.stringify({ event: _mine.event, note: _mine.note, pref: _mine.pref })); }catch(_){}
}
/* Loaded once per sitting; a page that needs it awaits it and repaints. */
function mineLoad(force){
  if (_mine.loaded && !force) return Promise.resolve(_mine);
  if (_mine.loading && !force) return _mine.loading;
  _mine.loading = (async () => {
    try{
      if (mineServer()){
        const r = await api('me/items');
        const items = (r && Array.isArray(r.items)) ? r.items : [];
        _mine.event = items.filter(x => x.kind === 'event');
        _mine.note = items.filter(x => x.kind === 'note');
        _mine.pref = items.find(x => x.kind === 'pref') || null;
      } else {
        const j = mineLocalRead() || {};
        _mine.event = Array.isArray(j.event) ? j.event : [];
        _mine.note = Array.isArray(j.note) ? j.note : [];
        _mine.pref = j.pref || null;
      }
      _mine.loaded = true;
    }catch(_){ _mine.loaded = false; }
    _mine.loading = null;
    return _mine;
  })();
  return _mine.loading;
}
const mineList = kind => (_mine[kind] || []).slice();
const mineLoaded = () => !!_mine.loaded;
const minePref = () => ({ ...MINE_PREF_DEFAULT, ...(_mine.pref || {}) });
const mineGet = id => [..._mine.event, ..._mine.note].find(x => String(x.id) === String(id)) || null;

/* THE ONE WRITER. Returns the stored item, or throws with the server's words. */
async function mineSave(kind, item, id){
  let out;
  if (mineServer()){
    const r = id ? await api('me/items/' + encodeURIComponent(id), 'PUT', { item })
      : await api('me/items', 'POST', { kind, item });
    out = r && r.item;
  } else {
    const prev = id ? mineGet(id) : null;
    out = { ...(prev || {}), ...item, kind, id: id || (kind === 'pref' ? 'pref:local' : (kind === 'event' ? 'ev_' : 'nt_') + Math.random().toString(36).slice(2, 10)),
      updatedAt: new Date().toISOString(), createdAt: (prev && prev.createdAt) || new Date().toISOString() };
  }
  if (!out) throw new Error('Not saved');
  if (kind === 'pref') _mine.pref = out;
  else { const list = _mine[kind] || (_mine[kind] = []); const i = list.findIndex(x => String(x.id) === String(out.id));
    if (i >= 0) list[i] = out; else list.unshift(out); }
  if (!mineServer()) mineLocalWrite();
  mineChanged();
  return out;
}
async function mineDelete(id){
  if (mineServer()) await api('me/items/' + encodeURIComponent(id), 'DELETE');
  ['event', 'note'].forEach(k => { _mine[k] = (_mine[k] || []).filter(x => String(x.id) !== String(id)); });
  if (!mineServer()) mineLocalWrite();
  mineChanged();
}
/* NOTES DUE: a review day on or before today, not yet reviewed. The ONE
   reading the rail's count, the bell and the ledger's "Due" filter ask. */
function mineNotesDue(){
  const t = typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0, 10);
  return (_mine.note || []).filter(n => n.reviewBy && !n.reviewedAt && n.reviewBy <= t);
}
/* What changed is repainted where it shows: the page on screen and the
   rail's count. */
function mineChanged(){
  try{ if (typeof paintMyNotesCount === 'function') paintMyNotesCount(); }catch(_){}
  try{
    const v = typeof state === 'object' && state ? state.view : '';
    if (v === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
    if (v === 'mynotes' && typeof renderMyNotes === 'function') renderMyNotes();
  }catch(_){}
}

Object.assign(window, { mineLoad, mineList, mineLoaded, minePref, mineGet, mineSave, mineDelete, mineNotesDue,
  mineChanged, MINE_PREF_DEFAULT });
