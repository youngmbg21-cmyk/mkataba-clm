// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: FOLDER (filtered register + local search)
   ============================================================ */
const FOLDER_PAGE=50;
/* A member without can_view_values never receives a value from the server, so
   offering them "Value (high → low)" would be an option that silently sorts
   every row as zero. Drop it from the menu rather than leave it there broken —
   and fall the current sort back to the default if they were already on it. */
function visibleSorts(list){
  if(typeof canViewValues!=='function' || canViewValues()) return list;
  return list.filter(s=>s.k!=='value');
}
const FOLDER_SORTS=[
  {k:'updated',get label(){ return i18t('reg_sort_recent'); }},
  {k:'value',get label(){ return i18t('reg_sort_value'); }},
  {k:'expiry',get label(){ return i18t('reg_sort_expiring'); }},
  {k:'name',get label(){ return i18t('reg_sort_name'); }},
  {k:'signed',get label(){ return i18t('reg_sort_signed'); }},
];
// The filtered + sorted contracts for the current folder (shared by the full
// render and the search/keystroke body re-render).
function folderFiltered(){
  const f=FOLDERS[state.folderId]; if(!f) return [];
  const q=(state.folderQuery||'').trim().toLowerCase();
  // the stream drawer is a daily list, so the shelf stays off it (WO-5);
  // the Archived view on the Contracts page is the one way back in
  let cs=folderContracts(f.id).filter(c=>!c.archived);
  /* ---- A SEARCH MATCHES ANY PARTY'S NAME (22 Sep 2026) ----
     Without this a three-party contract disappears from a search for the
     company that GUARANTEES it, which is exactly the company a reader looking
     for an exposure searches by. `partiesMatch` derives the pair where nothing
     is stored, so on every contract on file it answers what the counterparty
     test answered and the result set does not move. */
  if(q) cs=cs.filter(c=>((c.name||'')+' '+(c.counterparty||'')+' '+(c.id||'')+' '+(c.contractNo||'')).toLowerCase().includes(q)
    || (typeof partiesMatch==='function' && partiesMatch(c,q)));
  let sort=state.folderSort||'updated';
  // a stored "sort by value" preference is meaningless without the right
  if(sort==='value' && typeof canViewValues==='function' && !canViewValues()) sort='updated';
  const upd=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:t; };
  if(sort==='updated') cs.sort((a,b)=>upd(b)-upd(a));
  else if(sort==='value') cs.sort((a,b)=>{ const A=regSortValue(a), B=regSortValue(b); return A==null||B==null ? (A==null)-(B==null) : B-A; });
  else if(sort==='name') cs.sort((a,b)=>a.name.localeCompare(b.name));
  else if(sort==='expiry') cs.sort((a,b)=>{ const ea=effectiveExpiry(a), eb=effectiveExpiry(b); const da=ea?daysUntil(ea):1e9, db=eb?daysUntil(eb):1e9; return da-db; });
  return cs;
}
function renderFolder(){
  const f=FOLDERS[state.folderId];
  if(!f){ setView('dashboard'); return; }
  state.folderShown=FOLDER_PAGE; state.folderSel={};   // fresh selection on entry
  const cs=folderFiltered();
  const val=cs.filter(c=>c.status!=='Declined').reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0);
  const sortOpts=visibleSorts(FOLDER_SORTS).map(s=>`<option value="${s.k}" ${(state.folderSort||'updated')===s.k?'selected':''}>${s.label}</option>`).join('');

  /* A select left on `appearance:auto` is drawn by the platform, and the
     platform draws it with a hard dark edge and a square corner whatever the
     border says. Turning the appearance off hands the closed control back to
     us — soft grey edge, the same 8px corner the rest of the page uses, and
     our own chevron in place of the native arrow.

     The OPEN list is still the browser's own popup and cannot be styled from
     a page in any engine; only the closed control is ours to dress. */
  /* BASE64, NOT A RAW SVG. These styles are written into a style="" attribute,
     and a plain data URI carries the quotes the SVG's own attributes need —
     the first one closes the attribute and the whole rule is dropped, which is
     exactly what happened: the arrow vanished entirely. Base64 has no quotes
     in it, so it survives the trip into the attribute. */
  const selChevron='url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9zdmc+)';
  const selStyle='font:inherit;font-size:var(--t-meta);border:1px solid var(--field-line);background-color:var(--color-surface);border-radius:var(--radius);padding:5px 26px 5px 9px;color:inherit;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:'+selChevron+';background-repeat:no-repeat;background-position:right 8px center;background-size:12px';
  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:var(--page-pad)">
    <style>
      .fold-table{width:100%;border-collapse:collapse;font-size:var(--t-body)}
      .fold-table th{text-align:left;font-size:var(--t-label);color:color-mix(in srgb,var(--color-text) 60%,transparent);padding:6.8px;border-bottom:1px solid var(--color-divider);white-space:nowrap;background:var(--color-neutral-100)}
      .fold-table td{padding:6.8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);vertical-align:middle}
      .fold-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
    </style>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button id="back-dash" style="width:28px;height:28px;flex:none;display:inline-grid;place-items:center;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);color:var(--accent-ink-700);cursor:pointer" title="${i18t('reg_back_to_portfolio')}">${icon('arrowLeft','w-4 h-4')}</button>
        <span style="width:28px;height:28px;flex:none;display:grid;place-items:center;background:var(--color-accent-800);color:#fff;border-radius:var(--radius)">${icon(f.ic,'w-4 h-4')}</span>
        <div style="min-width:0">
          <div style="font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-section);color:var(--color-text);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
          <div style="font-size:var(--t-label);color:var(--color-neutral-600)"><span id="fold-count">${cs.length}</span> contracts${(typeof canViewValues==='function'&&!canViewValues())?'':` · ${fmtMoneyShort(val)} active value`}</div>
        </div>
        <span style="flex:1"></span>
        <label style="display:flex;align-items:center;gap:6px;font-size:var(--t-label);color:var(--color-neutral-700)">${i18t('reg_sort')}
          <select id="folder-sort" style="${selStyle}">${sortOpts}</select>
        </label>
        <div style="position:relative">
          <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--color-neutral-500);display:inline-flex">${icon('search','w-3.5 h-3.5')}</span>
          <input id="folder-search" value="${(state.folderQuery||'').replace(/"/g,'&quot;')}" type="text" placeholder="${i18t('reg_search_folder')}" style="width:230px;max-width:60vw;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;outline:none;color:inherit;height:var(--field-h);padding:0 var(--field-pad-x) 0 30px;font-size:var(--field-size)">
        </div>
      </div>

      <div id="fold-selbar" class="flex hidden items-center justify-between" style="gap:var(--s-3);border:1px solid var(--color-accent-800);background:var(--color-accent-800);color:#fff;border-radius:var(--radius);padding:var(--s-2) var(--s-3)">
        <span id="fold-sel-count" style="font-size:var(--t-meta);font-weight:var(--w-strong)">${i18t('reg_n_selected',{n:0})}</span>
        <div style="display:flex;align-items:center;gap:var(--s-2)">
          <button id="fold-export" type="button" style="display:inline-flex;align-items:center;gap:var(--btn-gap);border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:var(--radius);min-height:var(--ctl-h);padding:0 var(--pad-ctl-x);font:inherit;font-family:var(--font-heading);font-size:var(--t-body);font-weight:var(--w-label);cursor:pointer">${icon('download','w-3.5 h-3.5')} Export CSV</button>
          <button id="fold-clear" type="button" style="display:inline-flex;align-items:center;border:0;background:none;color:rgba(255,255,255,.72);border-radius:var(--radius);min-height:var(--ctl-h);padding:0 var(--pad-ctl-x);font:inherit;font-family:var(--font-heading);font-size:var(--t-body);font-weight:var(--w-label);cursor:pointer">${i18t('reg_clear')}</button>
        </div>
      </div>

      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm)">
        
        <div class="table-scroll">
          <table class="fold-table">
            <thead>
              <tr>
                <th style="width:26px;padding-left:var(--s-3)"><input id="fold-selall" type="checkbox" style="accent-color:var(--color-accent)"></th>
                <th>${i18t('reg_col_contract')}</th>
                <th>${i18t('reg_col_type')}</th>
                <th style="text-align:right">${i18t('reg_col_value')}</th>
                <th>${i18t('reg_col_expires')}</th>
                <th>${i18t('reg_col_updated')}</th>
                <th style="width:58px;text-align:center" title="${i18t('reg_link_title')}">${i18t('reg_col_link')}</th>
                <th style="text-align:right;padding-right:var(--s-3)">${i18t('reg_col_status')}</th>
              </tr>
            </thead>
            <tbody id="fold-tbody">${folderRowsHtml(cs)}</tbody>
          </table>
        </div>
        ${''/* The legend belongs WITH the table it explains, so this page grew
               a footer strip to hold it — the register already had one. A
               column of coloured marks and no key is the thing that prompted
               all of this. */}
        <div style="border-top:1px solid var(--color-divider);padding:6px var(--s-3)">
          ${window.shareLegendHtml?shareLegendHtml({style:'font-size:var(--t-label)'}):''}
        </div>
      </section>
    </div>
  </div>`;

  document.getElementById('back-dash').addEventListener('click',()=>setView('dashboard'));
  const si=document.getElementById('folder-search');
  si.addEventListener('input',()=>{ state.folderQuery=si.value; state.folderShown=FOLDER_PAGE; renderFolderListOnly(); });
  si.focus(); si.setSelectionRange(si.value.length,si.value.length);
  document.getElementById('folder-sort').addEventListener('change',e=>{ state.folderSort=e.target.value; state.folderShown=FOLDER_PAGE; renderFolderListOnly(); });
  // controls that live OUTSIDE the tbody — bound once (the tbody re-renders on
  // search/sort, so binding these here avoids stacking duplicate listeners).
  document.getElementById('fold-selall').addEventListener('change',e=>{ const on=e.target.checked; const cs=folderFiltered();
    cs.slice(0,Math.min(cs.length,state.folderShown||FOLDER_PAGE)).forEach(c=>{ state.folderSel=state.folderSel||{}; if(on) state.folderSel[c.id]=true; else delete state.folderSel[c.id]; });
    renderFolderListOnly(); });
  document.getElementById('fold-export').addEventListener('click',folderExportSelectedCsv);
  document.getElementById('fold-clear').addEventListener('click',()=>{ state.folderSel={}; renderFolderListOnly(); });
  wireFolderRows();
  renderFolderSelBar();
  setActiveNav('folder');
}
// Expiry cell: the date, plus a coloured "in Nd" / "Nd ago" hint when it's
// close or past (only for live contracts).
/* ---- THE EXPIRY DATE IS NUMERIC, DOTTED (owner-approved mockup, 20 Aug
   2026: "25.08.2026 · 7 d") ---- one fixed shape on every table that prints
   a term end. Digits, not month words, so the months-follow-the-language
   rule has nothing to translate here and both languages read one format. */
/* ---- ONE DAY PRINTER, AND IT IS THE ARTIFACT'S SHAPE (Young ruled 21 Sep
   2026: "ensure the dates match ... like for like") ----
   MEASURED side by side against prototype/hati-redesign-reference.html: the
   artifact prints `30 Jun 2027` in the figure face and HaTi printed
   `30.06.2027` in the body face. Both of the register's date columns already
   went through this ONE function, so both move together and no screen can end
   up with two spellings of a day.

   THE MONTH FOLLOWS THE LANGUAGE, never jxLocale and never a hand-written
   English name: `langLocale()` carries the person's language with the
   workspace's region, so a Swedish reader gets a Swedish month out of the same
   call. The artifact hard-codes en-GB because it is a drawing, not a product.

   AND IT REFUSES RATHER THAN PRINTING NaN. A DAY IS A DAY (f328, 17 Sep): the
   same NaN was reported twice because four call sites printed a day and only
   one was guarded. This is the one printer now, so the guard belongs here. */
function regDotDate(iso){
  const d=new Date(String(iso||'')+'T00:00:00');
  if(isNaN(d.getTime())) return String(iso||'');
  const loc=(typeof langLocale==='function')?langLocale():'en-GB';
  return d.toLocaleDateString(loc,{day:'2-digit',month:'short',year:'numeric'});
}
/* ---- WHEN A TERM ENDS, SAID PLAINLY (26 Sep 2026, the list options' floor) ----
   The column printed "· 186 d" after every date — shorthand a reader had to
   decode, on rows where the number said nothing (an end six months off is not
   news). The drawing the owner chose says it: "a date shows how many days are
   left only when the end is within 90 days". So the day, then — inside the
   renewal window only — "in 45 days" in words; "ended" once it has passed;
   and nothing beside a far date. `far` carries "months away" for the one home
   with room to say it (the list inspector's panel).
   ONE READING, TWO READERS: this column and the panel, so a term's end is
   never worded two ways on one screen. Tone: ruby for ended or under 30 days,
   amber inside the window — the colours this cell already used. */
const REG_SOON_DAYS = 90;
function regEndsSay(iso){
  const s=String(iso||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const day=regDotDate(s);
  const d=(typeof daysUntil==='function')?daysUntil(s):null;
  if(d==null||!isFinite(d)) return { day, sub:'', tone:'' };
  if(d<0)  return { day, sub:i18t('reg_ended'), tone:'ruby' };
  if(d===0) return { day, sub:i18t('reg_ends_today'), tone:'ruby' };
  if(d<=REG_SOON_DAYS) return { day, sub:i18tn('reg_ends_in',d,{n:d}), tone:d<30?'ruby':'amber' };
  const m=Math.max(1,Math.round(d/30.4));
  return { day, sub:'', tone:'', far:i18tn('reg_ends_months',m,{n:m}) };
}
/* ---- WHEN A CONTRACT WAS SIGNED, ON THE PAGE YOU SCAN (J-5.1) ----
   Owner-asked 31 Aug 2026: *"If I am in 2029 and i want to find a contract
   that was signed in 2021, how would i find it?"* — and, measured, there was
   no way to ask. The stage filter gives you every contract ever signed with no
   year and no range; the six sorts hold no signed date; the box on this bar
   reads title, counterparty and reference only; the full-text index does not
   carry the date at all; the calendar marks no signature; and Copilot is never
   given one. A repair that makes the date trustworthy and stops there leaves a
   correct figure nobody can look up.

   ONE READING, FOUR SURFACES. The column, the sort, the filter and the
   Contracts-signed chart all ask contractSignedAt and none of them works a
   signed date out for itself. Read through `window` (the ES-module rule) and
   falling back to NULL, never to c.signedAt — which is the broken arithmetic
   this repair exists to remove. */
const regSignedOn = c => (typeof window.contractSignedAt==='function' ? contractSignedAt(c) : null) || null;
/* THE YEARS THIS WORKSPACE ACTUALLY SIGNED SOMETHING IN, newest first — never
   an empty year, never an alphabet of them. The FX picker's own rule: the list
   is built from this book's facts and grows by use, with nothing for an admin
   to maintain. Counted over the WHOLE book rather than the filtered set, or
   choosing a year would empty the list that offered it. */
/* "This year" and "Last year" lead the list because they are what people ask
   for most, and neither should cost the reader a moment's arithmetic. They
   resolve against the clock at the moment of asking rather than being frozen
   into the option, or a page left open over New Year would narrow to the wrong
   twelve months without a word. */
function regSignedYear(v){
  const now=new Date().getFullYear();
  if(v==='this') return String(now);
  if(v==='last') return String(now-1);
  return String(v||'');
}
function regSignedYears(){
  const seen=new Set();
  for(const c of (state.contracts||[])){
    const d=regSignedOn(c);
    if(d) seen.add(d.slice(0,4));
  }
  return [...seen].sort().reverse();
}
/* The cell. The SAME dotted builder the Expiry cell beside it uses, so two
   dates on one row can never be written differently — and NO countdown,
   because a signature has no deadline. An em-dash where nothing is signed, and
   the column draws on every row: one that came and went with the filter would
   be a table changing shape under the reader. */
function regSignedCell(c){
  const d=regSignedOn(c);
  return d
    ? `<span class="reg-day">${regDotDate(d)}</span>`
    : `<span class="reg-dash">—</span>`;
}
function folderExpiryCell(c){
  // the family-aware term: a master agreement shows the date its latest
  // amendment set, with a note naming the amendment it came from
  const eff=effectiveExpiry(c);
  if(!eff) return '<span style="color:var(--color-neutral-400)">—</span>';
  const from=window.expirySource?expirySource(c):null;
  const dt=regDotDate(eff);
  let col='var(--color-neutral-700)', hint='', weight=400;
  const fromRef=from?(window.contractRef?contractRef(from):from.id):'';
  if(from) hint=i18t('reg_from_id',{id:fromRef});
  if(c.status!=='Declined'){ const d=daysUntil(eff);
    if(d<0){ col='var(--st-ruby-fg)'; weight=600; hint=`${i18t('reg_days_ago',{n:-d})}${from?' · '+i18t('reg_from_id',{id:fromRef}):''}`; }
    else if(d<30){ col='var(--st-ruby-fg)'; weight=600; hint=`${i18t('reg_in_days',{n:d})}${from?' · from '+fromRef:''}`; }
    else if(d<=90){ col='var(--st-amber-fg)'; hint=`${i18t('reg_in_days',{n:d})}${from?' · from '+fromRef:''}`; }
  }
  return `<span style="color:${col};font-weight:${weight};font-variant-numeric:tabular-nums">${dt}</span>${hint?`<span style="display:block;font-size:var(--t-label);color:${col}">${hint}</span>`:''}`;
}
// Render up to state.folderShown rows as a table body, with a "Show more" pager.
function folderRowsHtml(cs){
  if(!cs.length) return `<tr><td colspan="8" style="padding:44px 20px;text-align:center">
      <div style="font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text)">${(state.folderQuery||'').trim()?i18t('reg_stream_none_match',{q:state.folderQuery}):i18t('reg_stream_none_yet')}</div>
      <div style="font-size:var(--t-meta);color:var(--color-neutral-600);margin-top:var(--s-1)">${(state.folderQuery||'').trim()?i18t('reg_stream_widen'):i18t('reg_stream_create_hint')}</div>
    </td></tr>`;
  const shown=Math.min(cs.length, state.folderShown||FOLDER_PAGE);
  const sel=state.folderSel||{};
  return cs.slice(0,shown).map((c,i)=>{
    const o=(window.openFindings?openFindings(c):[])||[];
    const scan=o.length?`<span class="badge" style="margin-left:6px;background:var(--st-ruby-bg);color:var(--st-ruby-fg)" title="${i18t('reg_open_findings')}">${icon('readpaper','w-2.5 h-2.5')}${o.length}</span>`:'';
    return `
    <tr data-open="${c.id}" style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">
      <td style="padding-left:var(--s-3)" onclick="event.stopPropagation()"><input type="checkbox" data-fsel="${c.id}" ${sel[c.id]?'checked':''} style="accent-color:var(--color-accent)"></td>
      <td style="max-width:260px"><div style="display:flex;align-items:center;gap:9px;min-width:0">
        <span style="width:26px;height:26px;flex:none;display:grid;place-items:center;border-radius:var(--radius);border:1px solid var(--color-divider);background:${isUpload(c)?'var(--color-accent-200)':'var(--color-bg)'};color:${isUpload(c)?'var(--color-accent-800)':'var(--color-neutral-600)'}" ${isUpload(c)?`title="${i18t('reg_uploaded_from_cp')}"`:''}>${icon(cIcon(c),'w-3.5 h-3.5')}</span>
        <span style="min-width:0">
          <span style="display:block;font-weight:var(--w-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</span>
          <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="font-family:var(--font-ref)">${esc((window.contractRef?contractRef(c):c.id))}</span> · ${esc(c.counterparty||'No counterparty yet')}</span>
        </span>
      </div></td>
      <td style="font-size:var(--t-meta);color:var(--color-neutral-700);white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px">${icon(cIcon(c),'w-4 h-4')}${cKind(c)}</span>${scan}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:var(--w-body);white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}" ${!isMonetary(c)?`title="${i18t('reg_non_monetary')}"`:''}>${!isMonetary(c)?'n/m':(()=>{ /* AS AMENDED (O-16): a signed amendment's value, never the stored one rewritten */
        const cv=window.effectiveValueView?effectiveValueView(c):c; return cv.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(cv):fmtMoneyShort(cv.value)):'—'; })()}</td>
      <td style="font-size:var(--t-meta);font-variant-numeric:tabular-nums;white-space:nowrap">${folderExpiryCell(c)}</td>
      <td style="font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap">${c.lastAction||'—'}</td>
      ${''/* Same split as the register: the link mark to its own column, the
             question pill left with the stage it qualifies. */}
      <td style="text-align:center;white-space:nowrap">${window.shareLinkCell?shareLinkCell(c.id):''}</td>
      <td style="text-align:right;padding-right:var(--s-3);white-space:nowrap">${window.questionDot?questionDot(c.id):''}${window.contractStatusChip?contractStatusChip(c):statusChip(c.status)}</td>
    </tr>`; }).join('') + (cs.length>shown
      ? `<tr><td colspan="8" style="padding:0"><button id="folder-more" type="button" class="ui-link" style="display:flex;width:100%;justify-content:center;margin:0;min-height:40px;border-radius:0;border-top:1px solid var(--color-divider)">Show ${Math.min(FOLDER_PAGE,cs.length-shown)} more · ${cs.length-shown} remaining</button></td></tr>`
      : '');
}
function folderSelCount(){ const s=state.folderSel||{}; return Object.keys(s).filter(k=>s[k]).length; }
function renderFolderSelBar(){
  const bar=document.getElementById('fold-selbar'); if(!bar) return; const n=folderSelCount();
  bar.classList.toggle('hidden',n===0);
  const lbl=document.getElementById('fold-sel-count'); if(lbl) lbl.textContent=i18t('reg_n_selected',{n});
}
// per-body wiring — safe to call on every tbody re-render (row checkboxes,
// the row "open" handler and the pager all live inside #fold-tbody).
function wireFolderRows(){
  wireOpens(document.getElementById('fold-tbody')||document);
  document.querySelectorAll('#fold-tbody [data-fsel]').forEach(el=>el.addEventListener('change',()=>{
    state.folderSel=state.folderSel||{}; const id=el.getAttribute('data-fsel');
    if(el.checked) state.folderSel[id]=true; else delete state.folderSel[id];
    renderFolderSelBar(); }));
  document.getElementById('folder-more')?.addEventListener('click',()=>{ state.folderShown=(state.folderShown||FOLDER_PAGE)+FOLDER_PAGE; renderFolderListOnly(); });
}
function folderExportSelectedCsv(){
  const sel=state.folderSel||{}; const ids=Object.keys(sel).filter(k=>sel[k]);
  const rows=folderContracts(state.folderId).filter(c=>ids.includes(c.id));
  if(!rows.length){ toast(i18t('reg_nothing_selected'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Type','Value stream',`Value (${jxCurrency()})`,'Status','Last action','Expiry'];
  const body=rows.map(c=>[(window.contractRef?contractRef(c):c.id),c.name,c.counterparty||'',cKind(c),FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`hati-${FOLDERS[state.folderId]?.id||'folder'}-selection.csv`; a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} contract${rows.length===1?'':'s'} to CSV`);
}
// re-render only the table body + header count on keystroke/sort/selection
// (keeps the search input focused)
function renderFolderListOnly(){
  const f=FOLDERS[state.folderId]; if(!f) return;
  const cs=folderFiltered();
  const tb=document.getElementById('fold-tbody'); if(!tb) return;
  /* Same as renderRegisterBody: the intro played when the page arrived. */
  tb.innerHTML=folderRowsHtml(cs);
  const cnt=document.getElementById('fold-count'); if(cnt) cnt.textContent=cs.length;
  const all=document.getElementById('fold-selall'); if(all){ const shownIds=cs.slice(0,Math.min(cs.length,state.folderShown||FOLDER_PAGE)); all.checked=shownIds.length>0 && shownIds.every(c=>state.folderSel&&state.folderSel[c.id]); }
  wireFolderRows(); renderFolderSelBar();
}

Object.assign(window,{FOLDER_PAGE,FOLDER_SORTS,folderFiltered,folderRowsHtml,folderExpiryCell,renderFolder,renderFolderListOnly,renderFolderSelBar,wireFolderRows,folderExportSelectedCsv});
/* ============================================================
   VIEW: REGISTER (global filterable / sortable table + bulk select)
   Client-side over the loaded working set, consistent with the folder
   view. Filters: search, lifecycle stage, contract type (folder), sort.
   ============================================================ */
const REG_PAGE=40;
const REG_STAGES=[
  {k:'all',get label(){ return i18t('reg_all_stages'); }},
  {k:'awaiting',get label(){ return i18t('reg_awaiting_cp'); }},
  {k:'Draft',label:'Drafting'},
  {k:'Under Review',label:'In Review'},
  {k:'Signed',label:'Executed'},
  {k:'Declined',label:'Closed'},
];
// Derived from FOLDERS so custom (user-created) streams appear automatically.
function regTypes(){
  const acc=(typeof userFolderAccess==='function')?userFolderAccess():'*';
  const folders=Object.values(FOLDERS).filter(f=>acc==='*'||folderAccessAllows(acc,f.id));
  return [{k:'all',get label(){ return i18t('reg_all_streams'); }}].concat(
    folders.map(f=>({ k:f.id, label:(typeof STREAM_SHORT!=='undefined'&&STREAM_SHORT[f.id])||f.name }))
  );
}
/* ---- THE DROPDOWN AND THE COLUMN HEADS ARE ONE LIST ----
   A <select> whose value matches no option falls back to its FIRST, so a sort
   the dropdown does not offer left this control reading "Recently updated"
   over a table sorted by something else. That was already true of Status and
   Signed before the owner asked for the other three (10 Sep 2026), and adding
   heads without adding options would have made five of eight lie.

   It is the Signed FILTER's own recorded trap one control along — "the select
   would then show Any while the list was still narrowed" — and the answer is
   the same: whatever is in force is on the list. So every key in REG_CMP is
   here, and f281 fails on a comparator or a default direction added without
   its option. `risk` is the one that carries no column, which is fine: a
   dropdown may offer more than the heads, never less. */
const REG_SORTS=[
  {k:'updated',get label(){ return i18t('reg_sort_recent'); }},
  {k:'value',get label(){ return i18t('reg_sort_value'); }},
  {k:'risk',get label(){ return i18t('reg_sort_risk'); }},
  {k:'expiry',get label(){ return i18t('reg_sort_expiring'); }},
  {k:'name',get label(){ return i18t('reg_sort_name'); }},
  {k:'ref',get label(){ return i18t('reg_sort_ref'); }},
  {k:'party',get label(){ return i18t('reg_sort_party'); }},
  {k:'stream',get label(){ return i18t('reg_sort_stream'); }},
  {k:'standards',get label(){ return i18t('reg_sort_standards'); }},
  {k:'stage',get label(){ return i18t('reg_sort_stage'); }},
  {k:'signed',get label(){ return i18t('reg_sort_signed'); }},
  /* THE TWO COLUMNS THE REFERENCE ADDED (second pass, 21 Sep 2026) sort too —
     every column sorts except the last, the page's own rule. */
  {k:'move',get label(){ return i18t('reg_sort_move'); }},
  {k:'owner',get label(){ return i18t('reg_sort_owner'); }},
  /* The Negotiations seat's Type column sorts, so its key is offered here too
     — the dropdown and the heads are ONE list. */
  {k:'kind',get label(){ return i18t('reg_sort_kind'); }},
];
/* ---- THREE EXPIRY WINDOWS WERE ONE QUESTION ASKED THREE TIMES (Young ruled
   21 Sep 2026: "remove expiring in 30 and 60 days") ----
   90 stays, because it is the renewal window this product actually holds
   (RENEWAL_WINDOW_DAYS), and the two inside it were the same cut drawn twice
   more. THE FILTERS THEMSELVES STAY IN regFiltered, deliberately: the optional
   Home tiles `expiring30` and `expiring60` are doors onto exactly those two
   cuts, and taking the branches out would leave a tile that narrows nothing.
   Off the row, nothing is lit when one of them is in force and the Clear
   control says the list is narrowed, so the row never claims a cut it is not
   showing. */
const REG_VIEWS=[
  {k:'expiring90', get label(){ return i18t('reg_exp_90'); }},
  {k:'expired',    get label(){ return i18t('reg_term_ended'); }},
  {k:'autosoon',   get label(){ return i18t('reg_auto_renew'); }},
  /* IN NEGOTIATION (owner, 16 Oct 2026): the contracts being argued over
     right now — negoIsLive, the very reading the Negotiations list is made
     of, so the count here is the count there. */
  {k:'nego',       get label(){ return i18t('reg_view_nego'); }},
  {k:'overdueob',  get label(){ return i18t('reg_overdue_obligations'); }},
  {k:'archived',   get label(){ return i18t('reg_view_archived'); }},
  /* DETAILS TO FILL (owner, 12 Oct 2026): contracts with boxes still empty
     on their Details tab — detailsOf, the tab's own count, printed beside
     each row's stage while this view is on. Opening a row lands on Details. */
  {k:'details',    get label(){ return i18t('det_quick'); }},
  /* NEEDS YOU AND DRAFTS (Part 8, the owner's pick "The Legora way", 21 Oct
     2026: "All · Needs you · In negotiation · Ending in 90 days · Drafts").
     NEEDS YOU is the contracts Home's Needs you list names — hbNeedsList, the
     ONE reading the Counter, the bell and the checklist share (needsYouOf) —
     counted as contracts, never as the items on them (its hover says so).
     DRAFTS is the Drafting stage as a view; Stage stays a filter of its own. */
  {k:'needs',      get label(){ return i18t('reg_view_needs'); }, get title(){ return i18t('reg_view_needs_title'); }},
  {k:'drafts',     get label(){ return i18t('reg_view_drafts'); }, get title(){ return i18t('reg_view_drafts_title'); }},
];
/* SIGNED (the new look's list, round 6, as drawn: All · Needs you · Signed): the new look's own view, kept off the
   phone's and today's list (REG_VIEWS) */
const REG_VIEW_SIGNED={k:'signed', get label(){ return i18t('reg_view_signed'); }};
/* ---- WHICH PAGE THIS TABLE IS ON (added 2026-08-12) ----
   The register's machinery — its filters, its row builder, its body renderer,
   its wiring — now draws TWO pages: Contracts, and Negotiations. The owner
   asked for the second one to BE the first one, grouped by whose move it is
   (see renderNegotiationsList in js/views/negotiation.js, which is the door).

   IT IS A PROPERTY OF THE PAGE, ABOVE THE FILTERS, and that is the whole
   reason it is not regShowOnly. `only` is a set somebody handed the register
   and it is deliberately CLEARABLE — by its own ✕, by both Clear-all handlers
   and by the phone's. Reused as-is here, the reader would press Clear on the
   Negotiations page and be looking at all 145 contracts under a heading that
   says Negotiations. The scope is asked FIRST in regFiltered, no control
   offers to remove it, and Clear still clears everything the reader chose.

   TWO FILTER STATES, NOT ONE. state.reg is Contracts'; state.regNego is this
   page's. A stage filter set while looking at negotiations is not an opinion
   about the register, and carrying it across would be one page silently
   answering for the other. */
let REG_SCOPE = null;
/* ═══ ROW DENSITY — three heights on one axis (25 Aug 2026) ═══════════════
   SAP Fiori ships cozy / compact / condensed because the same table is read
   two different ways: a contract register is SCANNED and an approval queue is
   read one row at a time. HaTi shipped one 36px row, typed once as
   --reg-row-h with a single consumer.

   THE MIDDLE RUNG IS 36 AND IT IS THE DEFAULT, so nobody's book moves on the
   morning this ships. Fiori's own verified ladder is 48/32/24 against a
   different base; 36 is the value already tuned against THIS product's type,
   and the bracket is built around it rather than replacing it.

   THREE THINGS TRAVEL TOGETHER, not just the height: the padding and the line
   box move with it, because a 30px row with 12px of side padding reads as a
   squeezed 36 rather than as a condensed row.

   IT CANNOT REACH THE PHONE, and that is by construction rather than by a
   guard: below 768px the desktop shell hides entirely and the phone draws its
   own cards — `.reg-table` is never rendered there. Fiori states plainly that
   compact and condensed "cannot be interacted with via touch", so the phone
   keeping its own touch sizes is the rule, not an omission. */
/* ═══ WHICH FILTERS SIT ON THE BAR — "Adapt filters" (25 Aug 2026) ════════
   SAP Fiori's filter bar shows a user-chosen SUBSET of the available filters
   and keeps the rest behind an "Adapt filters" link. That is the answer to the
   problem this bar actually had: it would not fit on one line, and WO-15
   solved that on 24 Aug by DELETING the Renewal filter outright.

   THIS DOES NOT REVERSE THAT RULING, AND THE DEFAULT IS WHY. The bar's default
   set is exactly what ships today — stage, stream, quick filter, category — and
   Renewal is NOT on it. The owner asked twice for it to be off their bar and
   it stays off. What changes is that a reader who wants it can now put it
   there, on their own browser, instead of the filter being unreachable.
   Its READING never went anywhere: regFiltered has known how to narrow by
   renewal type all along (line ~525), so this restores a door to a room that
   was still standing.

   THE SAFETY PROPERTY, and it is the whole reason this is not dangerous: a
   filter that is NARROWING THE LIST is drawn on the bar whether or not it was
   chosen. A hidden control that is quietly cutting the book is exactly the
   fault the owner's own removal note was guarding against — "so the filter can
   never be quietly on". It still cannot be. */
const REG_BAR_KEY = 'hati.v1.regBarFilters';
const REG_BAR_FILTERS = [
  { k:'stage',    fixed:true,  get label(){ return i18t('reg_lifecycle_stage'); } },
  { k:'type',     fixed:true,  get label(){ return i18t('reg_value_stream'); } },
  { k:'view',     fixed:false, get label(){ return i18t('reg_quick_filters'); } },
  { k:'category', fixed:false, get label(){ return i18t('me_category'); } },
  { k:'renewal',  fixed:false, get label(){ return i18t('reg_renewal'); } },
  /* DELIBERATELY NOT ONE OF THE DEFAULT FOUR (J-5.1). This row already fits on
     one line and keeping it there was the owner's own ruling (WO-15), so the
     control lives behind `Adapt filters` until somebody wants it — and it
     draws on its own the moment it is narrowing, which is the safety property
     this catalogue already carries. */
  { k:'signed',   fixed:false, get label(){ return i18t('reg_signed'); } },
  /* PAYMENT TERMS (owner-ruled 2 Sep 2026). The Insights tab answers "what is
     this costing us"; a filter answers "which contracts", which is the other
     half and the one that fixes the data gap — "not recorded" is the worklist
     that gets the rest of the book read. NOT one of the default four, for the
     same reason as Signed: the bar fits on one line today and keeping it there
     was the owner's own ruling. */
  { k:'payterms', fixed:false, get label(){ return i18t('reg_payterms'); } },
  /* ---- A REQUIRED DOCUMENT (S8, 16 Sep 2026) ----
     The sixth, and behind `Adapt filters` like the two above it — the bar fits
     on one line today and keeping it there is the owner's own standing ruling.
     It reads `contractDocuments` / `obligationDocState`, the SAME reading the
     contract Overview's "Documents they must hold" section draws, so the list
     and the section can never disagree about whether a certificate has lapsed.
     It draws itself on the bar the moment it is narrowing, which is this
     catalogue's own safety property. */
  { k:'docs',     fixed:false, get label(){ return i18t('reg_docs'); } },
  /* ---- ON HOLD (upgrade 8, 18 Sep 2026) ----
     A held contract is deliberately still on every list, so this is not how you
     find it — the ruby chip on its own row is. It is here so a lawyer can pull
     the disputes together in one press, and it draws on its own the moment it
     is narrowing, like every other optional filter. */
  { k:'hold',     fixed:false, get label(){ return i18t('reg_f_hold'); } },
];
/* Stage and stream are `fixed` — they are the two questions this register is
   always asked, and a bar with neither is not a filter bar. */
const REG_BAR_DEFAULT = ['stage','type','view','category'];
function regBarChosen(){
  try{
    const raw = localStorage.getItem(REG_BAR_KEY);
    if(!raw) return REG_BAR_DEFAULT.slice();
    const want = JSON.parse(raw);
    if(!Array.isArray(want)) return REG_BAR_DEFAULT.slice();
    const ok = REG_BAR_FILTERS.filter(f=>f.fixed||want.includes(f.k)).map(f=>f.k);
    return ok.length ? ok : REG_BAR_DEFAULT.slice();
  }catch(_){ return REG_BAR_DEFAULT.slice(); }
}
function regBarSetChosen(keys){
  try{ localStorage.setItem(REG_BAR_KEY, JSON.stringify(
    REG_BAR_FILTERS.filter(f=>f.fixed||keys.includes(f.k)).map(f=>f.k))); }catch(_){}
}
/* IS THIS FILTER ACTUALLY NARROWING ANYTHING RIGHT NOW — the predicate the
   safety property above rests on. */
function regFilterActive(k, R){
  R = R || regState();
  if(k==='stage')    return R.stage!=='all';
  if(k==='type')     return R.type!=='all';
  if(k==='view')     return !!R.view;
  if(k==='category') return !!R.category && R.category!=='all';
  if(k==='renewal')  return !!R.renewal && R.renewal!=='all';
  if(k==='signed')   return !!R.signed && R.signed!=='all';
  if(k==='payterms') return !!R.payterms && R.payterms!=='all';
  if(k==='docs')     return !!R.docs && R.docs!=='all';
  if(k==='hold')     return !!R.hold && R.hold!=='all';
  return false;
}
/* Chosen, PLUS anything currently narrowing the list. */
function regBarShown(R){
  const chosen = regBarChosen();
  return REG_BAR_FILTERS.filter(f=>chosen.includes(f.k)||regFilterActive(f.k,R)).map(f=>f.k);
}

/* ---- THE COLUMNS ARE DRAGGABLE, LIKE A SPREADSHEET (owner-asked 31 Aug 2026)
   ----
   *"in the contracts and negotiations columns you can adjust the width of the
   columns like in excel sheets."*

   THE WIDTHS STAY PERCENTAGES AND STILL SUM TO 100, which is not a detail: it
   is what makes the table exactly its pane at every width, on every page, and
   what closed the reported sideways scroll of 24 Aug. So a drag is a TRADE
   between the column being resized and the one to its right — which is also
   what a spreadsheet does when you take hold of the boundary between two
   columns. Nothing else on the row moves, and the total cannot drift.

   THE DEFAULTS LIVE HERE ONCE. They used to be typed into the head row as nine
   literals, so the head, a reset and a stored array would each have had their
   own opinion of what "the default" is. One list, read by all three.

   THE LAST COLUMN CARRIES NO GRIP — it has nothing to its right to trade with,
   and a control whose only outcome is a refusal is furniture. */
/* ---- THE REFERENCE'S ORDER ON CONTRACTS (second pass, 21 Sep 2026) ----
   Stage moves up beside the stream, and two columns join it: MOVE (whose move,
   the Negotiations seat's own one-word reading, an em-dash where no
   negotiation has started) and OWN (the owner's initials, the name on the
   hover). The Negotiations seat keeps its own order; the SIX columns both
   share are still cut identically (contracts-page-verify 11d pairs by KEY).
   The row builder emits its cells in the seat's own key order, so a column
   moved here moves on every row. */
/* ---- NO VALUE STREAM COLUMN ON EITHER SEAT (Young ruled 24 Sep 2026: "Remove
   the value stream column from both pages as well but not from the filter") ----
   The Stream FILTER chip stays, and so does sorting by stream — in the sort
   dropdown, which already offers sorts with no column of their own (risk,
   title). CELL.stream and its colour tick are deleted, not stubbed. */
const REG_COL_KEYS      = ['mk','counterparty','stage','move','value','signed','expiry','owner','acts'];
const REG_COL_KEYS_NEGO = ['mk','counterparty','kind','value','expiry','stage','move'];
/* THE SIX COLUMNS BOTH SEATS SHARE ARE CUT IDENTICALLY, AND THE COUNTERPARTY
   IS THE COLUMN WITH THE GIVE — the register's own rule since the two lists
   became one renderer, and the reason a reader moving between Contracts and
   Negotiations sees the same columns in the same places. A FIRST PASS ONCE
   PAID FOR A NEW COLUMN OUT OF FIVE OF THEM and the two pages stopped lining
   up; contracts-page-verify 11d is the net and reported it as 201/228,
   174/201, 121/174, 161/148. So a new column is paid for by the GIVE COLUMN
   alone, and mk · counterparty · stream · value · expiry · status stay
   byte-identical across the two seats.

   THE GIVE MOVED WITH THE FACT (21 Sep 2026). It was the title's, because the
   title was what people scanned; the counterparty leads now, carries the title
   under it, and takes the two shares folded together — 26, where party and
   title were 13 and 17. THE FOUR POINTS THAT DID NOT FOLD went where they were
   measured short: value stream 11 → 13 ("Procurement & Raw Materials" was
   cut) and expiry 11 → 13 (at 13px the dotted date plus its day count read
   "30 Jun 2027 · 28…", which is the one thing that column exists to say).
   Both lists still sum to 100, which is what makes each table exactly its pane
   at every width. */
/* ---- THE COUNTERPARTY LEADS, AND THE TITLE SITS UNDER IT (Young ruled it
   21 Sep 2026, off two renders he approved) ----
   *"the contract title column is deleted, the title of the contract goes below
   the name of the counterparty ... the name of the counter party is on black
   bold letters and the name of the contract is smaller and in grey"*, and of
   the Negotiations seat: *"do not delete any column but once again put the
   name of the contract below the counter party name and bring the words
   currently below the contract names as a new column on the right of the
   counterparty name."*

   SO THE TWO SEATS ANSWER THE SAME ASK DIFFERENTLY, ON PURPOSE. Contracts
   loses a column (ten, was eleven) because he asked for the width back.
   Negotiations keeps its count (eight) because the words that were the title's
   second line — the kind of paper and the round — become a column of their
   own there: A ROUND IS WHAT THAT PAGE IS ABOUT, and it is the one page where
   that number is worth a column of its own. On Contracts those same words ride
   the cell's own hover, where the kind already rode since 24 Aug.

   `.reg-title` AND `.reg-sub` KEEP THEIR NAMES AND THEIR DRESS, and that is
   what makes this small: they were never "the contract's name" and "the kind"
   — they are the row's IDENTITY LINE and its sub-line, which is exactly the
   re-pointing white-band-and-tabs 5d/5e already took on 21 Sep. The leading
   line is the page ink at the label weight and the second is a size down in
   the quiet grey, unchanged; only WHICH FACT each one carries has moved. */
/* THE STREAM COLUMN'S 13 POINTS WENT TO THE GIVE COLUMN ON BOTH SEATS (24 Sep
   2026) — the rule above, run backwards: a column leaving is paid back to the
   counterparty alone, so the five columns both seats share (mk · counterparty
   · value · expiry · status) stay cut identically. 26 → 39. A width array
   stored before this has one entry too many and is ignored (regColWidths), so
   nobody's table shifts a column left. */
const REG_COL_W         = [6,39,11,7,9,7,13,5,3];
const REG_COL_W_NEGO    = [6,39,14,9,13,11,8];
/* ═══ THE INSPECTOR'S LIST (Young picked it by name, 26 Sep 2026, off the
   "Contract List Options" page — see js/views/inspector.js) ═══════════════
   Beside the panel the list carries FOUR columns: the reference, the
   counterparty over the agreement, where it stands, and what it is worth.
   Owner, signed, ends and the row's menu move into the panel, one contract at
   a time — the narrower list is the design's own named cost. On Negotiations
   the third column is whose move, with the fact behind it ("Yours · 3
   changes", "Theirs · 5 days").
   BELOW INS_MIN_W, IN BOARD MODE, AND ON A STAGE WITH NO INSPECTOR the seat's
   full table is drawn exactly as the two lists above say.
   THE WIDTHS ARE PIXELS HERE, NOT SHARES, and there are no grips: three short
   columns hold their size and the counterparty takes whatever is left, which
   is what "the column with the give" has always meant on this table.
   THE THIRD COLUMN IS ONE WIDTH ON BOTH SEATS (26 Sep 2026), so the three
   columns the two pages share — the reference, the counterparty, the value —
   are cut identically in pixels, the full tables' own relation since 21 Sep
   ("balance is key": a reader moving between the pages sees the same
   edges). Whose move is shorter than a stage and simply has more air. */
const REG_COL_KEYS_INS      = ['mk','counterparty','stage','value'];
/* THE DRAWING'S COLUMNS ON NEGOTIATIONS (SAP benchmark, owner-approved 9 Oct
   2026): the round, what the changes ask of whom, and how long it has waited
   — whose move is the band and the panel's pill, so it is not a column too. */
/* WHOSE MOVE (round 14 of the redesign: the owner picked "Whose move" and said
   yes to a Lead column, 17 Oct 2026): who leads each deal, so a deal a
   colleague leads does not read as the reader's own move. */
/* THE LIST LANGUAGE (owner, 27 Oct 2026: "keep" the Clauses in play): the mark says whose move; the
   reference, the round and the lead move to the grey line, Round and Lead one press away under Columns
   (LC_PAGES.negotiations hide), and the clauses with open redlines stand as chips, the value after */
const REG_COL_KEYS_NEGO_INS = ['counterparty','clauses','changes','waiting','value','round','lead'];
/* round + changes + waiting = stage + value (340), so the reference and the
   counterparty stay cut identically on both seats (inspector-verify 2e). */
/* the Lead column (round 14) is the counterparty's to give: its words and
   the other three's stay whole (the old pairing with stage + value, 340, was
   retired with inspector-verify 2e on 15 Oct 2026) */
const REG_INS_COL_PX = { mk:84, stage:216, move:216, value:124, round:64, changes:176, waiting:132, lead:84, clauses:196 };
/* THE CONTRACTS PLACE ON HOME HAS NO INSPECTOR (the overnight work order,
   step 7): a row press opens the contract on the paper, and its six columns
   are the drawing's — the reference, the counterparty over the agreement,
   the stage, the owner, when it ends and what it is worth — and the row's
   own ⋯ stays at the end, as on today's full table: with the panel gone it is
   the one place a row's acts live (Decline · close has no other door).
   Its cell is 6 parts, not the full table's 3: Home's paper is narrower than
   the page was, and at 1024 three parts cut the ⋯ square (button-consistency 1c). */
/* THE LEGORA WAY (Part 8, the owner's pick, 21 Oct 2026): the agreement
   leads — the initials, the party, "kind · ref" under it — so the Ref column
   of its own goes on this seat (every other seat keeps its mk: a ref is never
   printed twice), and the drawing's columns follow: Stage · Ends · Value.
   Owner stays a column, hidden until the reader shows it under Columns
   (LC_PAGES.contracts hide:['owner']); the row's ⋯ ends every row. */
/* THE LIST LANGUAGE (owner, 27 Oct 2026: "keep contracts … as designed"): the stage leaves its column
   for the grey line under the agreement, a mark leading the row; Stream and Our standards stand in
   its place (docs/MAP-HISTORY.md "THE LIST LANGUAGE"). */
const REG_COL_KEYS_HOME = ['counterparty','stream','standards','expiry','value','owner','acts'];
/* Value is 14, not 10 (the checkers of step 7): at 10 parts of a 900px column
   "KES 2.20M" was cut to "KES 2.20…", hiding whether it was thousands or
   millions; the four parts come out of the counterparty, whose names end in an
   ellipsis with the whole on the hover. */
/* by position over REG_COL_KEYS_HOME; a column the reader hid gives its
   share to the agreement (regHomeColW), so the drawn ones still sum to 100 */
const REG_COL_W_HOME    = [29,14,18,12,11,10,6];
/* THE PLACE'S LIST FITS ITS COLUMN: Home's paper column can be narrow (an
   820 tablet, a 1024 window, the split dragged toward the paper), so below
   REG_HOME_NARROW_W of PLACE — measured, the host's own width — the List
   draws its four loudest columns (the reference, the counterparty, the
   stage, the ⋯); owner, ends and value stay in the filters, the sort and on
   the paper. It carries no floor (.is-home) and a width crossing the line
   repaints it (regHomeWatch). */
const REG_COL_KEYS_HOME_NARROW = ['counterparty','stage','acts'];
const REG_COL_W_HOME_NARROW    = [62,28,10];
const REG_HOME_NARROW_W = 600;
/* ROOM TO SPREAD (owner, 28 Oct 2026: the grey line under a list's name is columns of their own where
   the list has the room, "big screen gets the extra columns, small screen keeps today's look"): at
   REG_HOME_WIDE_W of PLACE or more, the agreement's grey line — the party, the reference, the stage —
   stands in three columns of its own (REG_HOME_SPREAD, right after the agreement, never moved or hidden
   under Columns) and the agreement stands alone; the shares are REG_COL_W_HOME_WIDE, by position over
   REG_COL_KEYS_HOME_WIDE. Not while Ask a column's answers stand (their own shape). */
const REG_HOME_SPREAD = ['party','mk','stage'];
const REG_COL_KEYS_HOME_WIDE = ['counterparty','party','mk','stage','stream','standards','expiry','value','owner','acts'];
const REG_COL_W_HOME_WIDE    = [20,12,7,11,10,12,9,10,6,3];
const REG_HOME_WIDE_W = 1240;
/* ONE READING PER PAINT (22 Oct 2026, the Board → Paper switch): the width is read once, before the
   paint writes the table, and kept for the rest of that paint — read again after the write, it made
   the browser lay the whole page out in the middle of drawing it */
let _regNarrowPaint=null;
function regHomeNarrow(){
  if(!regHome() || regScope()==='negotiations' || typeof document==='undefined') return false;
  if(_regNarrowPaint!=null) return _regNarrowPaint;
  const el=document.getElementById((_regOpts&&_regOpts.hostId)||'');
  const w=el?el.clientWidth:0;
  return w>0 && w<REG_HOME_NARROW_W;
}
let _regWidePaint=null;
function regHomeWide(){
  if(!regHome() || regScope()==='negotiations' || typeof document==='undefined') return false;
  if(regNl()) return false;
  if(_regWidePaint!=null) return _regWidePaint;
  if(typeof window.askColKeys==='function' && askColKeys().length) return false;
  const el=document.getElementById((_regOpts&&_regOpts.hostId)||'');
  const w=el?el.clientWidth:0;
  return w>=REG_HOME_WIDE_W;
}
/* bound once per host: a width that crosses the line repaints the List */
function regHomeWatch(host){
  if(!host || host.dataset.regWatch || typeof ResizeObserver!=='function') return;
  host.dataset.regWatch='1';
  let queued=false;
  new ResizeObserver(()=>{ if(queued) return; queued=true;
    (typeof requestAnimationFrame==='function'?requestAnimationFrame:(f=>setTimeout(f,16)))(()=>{ queued=false;
      const t=host.querySelector('.reg-table');
      if(!t || !regHome() || !regPlaceUp()) return;
      if(regHomeNarrow()!==t.classList.contains('is-hnarrow') || regHomeWide()!==t.classList.contains('is-hwide')) regRepaint(); });
  }).observe(host);
}
/* THE NEW LOOK'S CONTRACTS LIST (round 6, as drawn): the place's table on the new look — one Standing column, the kept
   questions, Our standards, Ends, Value; no spread, no row menu */
function regNl(){ return regHome() && regScope()!=='negotiations' && typeof window.newLookOn==='function' && newLookOn(); }
function regInspecting(){ return !regHome() && regMode()!=='board' && typeof insFits==='function' && insFits(); }
/* THE ONE READING OF WHICH COLUMNS THIS PAINT DRAWS — the head, the rows, an
   empty row's span and a band's span all ask it, so a column can never sit
   under the wrong heading whichever shape the page is in. */
function regColKeys(){
  /* NEGOTIATIONS: the seat's shape, then the reader's own Columns (Part 8 —
     Ref and the counterparty always lead, the rest in the reader's order) */
  const keys=regColKeysSeat();
  if(regScope()!=='negotiations') return keys;
  const shown=regNegoColsShown(keys);
  /* THE LIST'S COLUMNS beside the panel (owner, 28 Oct 2026, regNegoFit) */
  const fit=regNegoFit(shown);
  return fit?fit.keys.map(k=>k==='name'?'counterparty':k):shown;
}
/* THE LIST'S COLUMNS ON NEGOTIATIONS BESIDE ITS PANEL (owner, 28 Oct 2026, listCols): the deal and What is
   open always stand; where the room is short Clauses in play steps aside first, then Value, Waiting; Round and
   Lead, when the reader chose them under Columns, step aside last — the reader's own choice wins; the grey line's reference, round and lead are columns only where there is
   room for them too; a reader's own widths are kept. Asked once per paint (_regNegoFitPaint). */
const REG_NEGO_RANK={ clauses:1, value:2, waiting:3, round:4, lead:4 };
let _regNegoFitPaint=null;
function regNegoFit(shown){
  if(regScope()!=='negotiations'||!regInspecting()||typeof listCols!=='function') return null;
  if(_regNegoFitPaint) return _regNegoFitPaint;
  const ks=(shown||regNegoColsShown(regColKeysSeat())).filter(k=>k!=='counterparty');
  const defs=[{ k:'name' }, { k:'mk', w:REG_INS_COL_PX.mk, spread:1 },
    ...ks.map(k=>({ k, w:REG_INS_COL_PX[k]||100, rank:REG_NEGO_RANK[k] })),
    ...['round','lead'].filter(k=>!ks.includes(k)).map(k=>({ k, w:REG_INS_COL_PX[k], spread:1 }))];
  const fit=listCols(REG_NEGO_SEAT,defs,()=>regRepaint());
  fit.w=Object.fromEntries(fit.cols.map(c=>[c.k==='name'?'counterparty':c.k,c.w]));
  _regNegoFitPaint=fit;
  if(typeof queueMicrotask==='function') queueMicrotask(()=>{ _regNegoFitPaint=null; }); else _regNegoFitPaint=null;
  return fit;
}
/* the grey line under the deal stands down where its facts are columns */
function regNegoSpread(){ const f=regNegoFit(); return !!(f&&f.spread); }
/* the seat's own columns for this paint's shape, before the reader's choice */
/* the answer columns standing on the Contracts List (none on its narrow shape) */
function regCtAskKeys(){ return (!regHomeNarrow()&&typeof window.askColKeys==='function')?askColKeys():[]; }
function regColKeysSeat(){
  const neg=regScope()==='negotiations', ins=regInspecting();
  if(!neg && regHome()){
    /* THE READER'S OWN COLUMNS (Columns, Part 8): the agreement first, then
       the shape's own columns in the reader's order (Owner hidden at rest),
       then any answers, then the ⋯ */
    const narrow=regHomeNarrow();
    const mid=(narrow?REG_COL_KEYS_HOME_NARROW:REG_COL_KEYS_HOME).filter(k=>k!=='counterparty'&&k!=='acts');
    let shown=(typeof window.lcShown==='function'&&window.LC_PAGES&&LC_PAGES.contracts)?lcShown('contracts', mid):mid.filter(k=>k!=='owner');
    /* ASK A COLUMN (20 Oct 2026): the answers stand before the ⋯, and Owner
       steps aside for them, as drawn (it stays in the filters and the sort) */
    const ask=regCtAskKeys();
    if(ask.length) shown=shown.filter(k=>k!=='owner'&&k!=='stream');
    /* inside one folder the stream is the same on every row: it steps out (the new look's folder list, as drawn) */
    { const R0=regState(); if(typeof window.newLookOn==='function'&&newLookOn()&&R0.type&&R0.type!=='all') shown=shown.filter(k=>k!=='stream'); }
    if(!narrow&&regNl()) return ['counterparty','standing'].concat(ask, shown);
    return ['counterparty'].concat(!narrow&&regHomeWide()?REG_HOME_SPREAD:[], shown, ask, ['acts']);
  }
  if(!ins && regNarrowTable()) return neg ? REG_COL_KEYS_NEGO_NARROW : REG_COL_KEYS_NARROW;
  return neg ? (ins?REG_COL_KEYS_NEGO_INS:REG_COL_KEYS_NEGO) : (ins?REG_COL_KEYS_INS:REG_COL_KEYS);
}
/* ---- A TABLET'S TABLE FITS ITS PAGE (9 Oct 2026) ----
   At an 820px tablet the full table kept its 760px floor inside a 722px
   page, so it panned sideways and its last heads were cut. Where the page is
   narrower than REG_NARROW_W (MEASURED, the page's own width) the full table
   gives up its two quietest columns — signed and owner (type on
   Negotiations) — rather than a floor; both stay in the filters, the sort and
   the contract itself. Widths still sum to 100, and a drag here is kept apart
   from the wide table's (regColStoreKey). */
const REG_COL_KEYS_NARROW      = ['mk','counterparty','stage','move','value','expiry','acts'];
const REG_COL_KEYS_NEGO_NARROW = ['mk','counterparty','value','expiry','stage','move'];
const REG_COL_W_NARROW         = [7,43,13,8,11,14,4];
const REG_COL_W_NEGO_NARROW    = [7,45,11,14,13,10];
const REG_NARROW_W = 800;
function regNarrowTable(){
  if(regMode()==='board' || (regHome() && regScope()!=='negotiations')) return false;
  const el=document.getElementById('content-scroll');
  const w=el ? el.clientWidth : 0;
  return w>0 && w<REG_NARROW_W;
}
/* A column may not be dragged to nothing. A PIXEL floor rather than a percent
   one, because 4% is 51px on a laptop and 77px on a wide monitor — the same
   reasoning that made the divider's own limits pixels. Converted against the
   table's live width at the moment of the drag. */
const REG_COL_MIN_PX = 54;
const REG_COL_KEY = 'hati.v1.regCols';
const regColDefaults = () => (regScope()==='negotiations'
  ? (regNarrowTable() && !regInspecting() ? REG_COL_W_NEGO_NARROW : REG_COL_W_NEGO)
  : regHome() ? regHomeColW(regColKeys())
  : (regNarrowTable() && !regInspecting() ? REG_COL_W_NARROW : REG_COL_W)).slice();
/* ON THE PLACE A DRAG IS KEPT FOR THE COLUMNS IT WAS MADE ON, IN THEIR ORDER
   (Part 8, the critic's 4.10): a stored array is read by position, so the
   key names the columns drawn — a set the reader hid or moved under Columns
   reads its own widths, never another order's */
const regColStoreKey = () => REG_COL_KEY + (regScope()==='negotiations' ? '.nego' : regHome() ? '.home.' + regColKeys().map(k=>String(k).startsWith('ask:')?'ask':k).join(',') : '') + ((regNarrowTable() && !regInspecting()) || regHomeNarrow() ? '.narrow' : '');
/* THE STORED ARRAY IS READ, NEVER TRUSTED. A length that does not match the
   seat's own column count is IGNORED rather than applied — which is the whole
   migration story for the Signed column: a browser that stored eight widths
   before it existed falls back to the defaults instead of shifting every
   column one place left. Same for a total that has drifted off 100, which
   would put the table back into sideways scroll. */
function regColWidths(){
  /* NEGOTIATIONS' OWN COLUMNS (Part 8): where the reader hid or moved one,
     each column keeps its width BY KEY off the seat's widths (theirs or the
     defaults), and a hidden one's room goes to the counterparty */
  if(regScope()==='negotiations' && !regInspecting()){
    const keys=regColKeys();
    if(regNegoColsChosen(keys)) return regNegoColWidths(keys, regColWidthsOwn());
  }
  return regColWidthsOwn();
}
function regColWidthsOwn(){
  const def = regColDefaults();
  try{
    const raw = localStorage.getItem(regColStoreKey());
    if(!raw) return def;
    const w = JSON.parse(raw);
    if(!Array.isArray(w) || w.length !== def.length) return def;
    if(!w.every(n => typeof n === 'number' && isFinite(n) && n > 0)) return def;
    if(Math.abs(w.reduce((a,b)=>a+b,0) - 100) > 0.5) return def;
    return w;
  }catch(_){ return def; }
}
function regColSetWidths(w){
  try{ localStorage.setItem(regColStoreKey(), JSON.stringify(w)); }catch(_){}
}
function regColReset(){
  try{ localStorage.removeItem(regColStoreKey()); }catch(_){}
}

/* ---- THE DRAG ITSELF ----
   MEASURED FROM WHERE THE POINTER IS, never from how far it has travelled.
   That is the rule the negotiation page's divider and Key terms' both state in
   their own words, and the reason is recorded: distance-travelled is what made
   the other handle fall behind the cursor and gave it a dead band.

   The boundary between column i and i+1 is put where the pointer is, and the
   two columns TRADE the difference. Everything left of i is untouched, so the
   arithmetic is local and the total is 100 by construction rather than by
   correction afterwards.

   IT WRITES THE HEADS DIRECTLY AND DOES NOT REPAINT. table-layout:fixed reads
   its widths off the head row, so setting them live is what makes the drag
   follow the hand; a repaint per pointermove would rebuild the tbody on every
   pixel and drop the row handlers with it. */
function regColApply(w, ths){
  for(let i=0;i<ths.length && i<w.length;i++) ths[i].style.width = w[i] + '%';
}
function regColTrade(w, i, wantPct, minPct){
  const out = w.slice();
  const pair = out[i] + out[i+1];
  let a = Math.max(minPct, Math.min(pair - minPct, wantPct));
  /* A pair too narrow to hold two floors cannot be traded at all — splitting it
     would push BOTH columns under the floor, which is the state the floor
     exists to prevent. Left alone rather than fudged. */
  if(pair < minPct * 2) return out;
  out[i] = a; out[i+1] = pair - a;
  return out;
}
function regColHeads(){
  const t = document.querySelector('.reg-table');
  return t ? [t, [...t.querySelectorAll('thead th')]] : [null, []];
}
/* ONE DELEGATED LISTENER, ARMED ONCE ON THE DOCUMENT. The register rebuilds its
   head on every full render, so a listener bound to the elements would be
   re-bound per paint and stack; and one armed inside a renderer belongs to
   whichever page rendered first — the lesson of 15 Aug, paid once already. */
function regWireColResize(){
  if(document._regColWired) return;
  document._regColWired = true;
  let drag = null;
  const down = e => {
    const g = e.target && e.target.closest && e.target.closest('[data-reg-grip]');
    if(!g) return;
    /* A PRESS ON THE GRIP IS A DRAG, NEVER A SORT. The head around it is
       itself a control, so without this every resize would also re-order the
       book underneath the reader. */
    e.preventDefault(); e.stopPropagation();
    const [table, ths] = regColHeads();
    if(!table || !ths.length) return;
    const i = Number(g.getAttribute('data-reg-grip'));
    if(!(i >= 0 && i < ths.length - 1)) return;
    const rect = table.getBoundingClientRect();
    if(!(rect.width > 0)) return;            // a hidden table has no width to divide
    drag = { i, rect, ths, start: regColWidths(), min: (REG_COL_MIN_PX / rect.width) * 100 };
    g.classList.add('is-drag');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    try{ g.setPointerCapture && g.setPointerCapture(e.pointerId); }catch(_){}
  };
  const move = e => {
    if(!drag) return;
    /* WHERE THE POINTER IS, as a percentage of the table — then minus every
       column left of the pair, which is what turns "the boundary is here" into
       "this column is this wide". */
    const pct = ((e.clientX - drag.rect.left) / drag.rect.width) * 100;
    let left = 0; for(let k = 0; k < drag.i; k++) left += drag.start[k];
    const next = regColTrade(drag.start, drag.i, pct - left, drag.min);
    regColApply(next, drag.ths);
    drag.now = next;
  };
  const up = () => {
    if(!drag) return;
    if(drag.now) regColSetWidths(drag.now);
    document.querySelectorAll('.reg-grip.is-drag').forEach(el => el.classList.remove('is-drag'));
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    drag = null;
  };
  /* A CLICK IS A SEPARATE EVENT FROM A POINTERDOWN, and the sort is wired on
     the click. Stopping the pointerdown does nothing to it — measured, the
     drag was refused AND the book re-sorted under the reader. Captured, so it
     is stopped before the head's own delegated handler ever sees it. */
  document.addEventListener('click', e => {
    const g = e.target && e.target.closest && e.target.closest('[data-reg-grip]');
    if(!g) return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  document.addEventListener('pointerdown', down);
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
  /* DOUBLE-CLICK PUTS IT BACK — the divider's own rule, and reset has to mean
     the same thing as "nobody has chosen": the stored value is REMOVED rather
     than rewritten with today's defaults, or a later change to those defaults
     would never reach a reader who had once double-clicked. */
  document.addEventListener('dblclick', e => {
    const g = e.target && e.target.closest && e.target.closest('[data-reg-grip]');
    if(!g) return;
    e.preventDefault(); e.stopPropagation();
    regColReset();
    const [, ths] = regColHeads();
    regColApply(regColDefaults(), ths);
  });
  /* AND IT TAKES THE KEYBOARD. The column heads gained Enter and Space for
     sorting on 25 Aug precisely because a control reachable only by mouse is
     not reachable; a grip is the same control in a smaller costume. One
     percentage point a press, which is about 12px on a laptop. */
  document.addEventListener('keydown', e => {
    const g = e.target && e.target.closest && e.target.closest('[data-reg-grip]');
    if(!g) return;
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); e.stopPropagation(); return; }
    const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if(!step && e.key !== 'Home') return;
    e.preventDefault(); e.stopPropagation();
    const [table, ths] = regColHeads();
    if(!table) return;
    const rect = table.getBoundingClientRect();
    if(!(rect.width > 0)) return;
    if(e.key === 'Home'){ regColReset(); regColApply(regColDefaults(), ths); return; }
    const i = Number(g.getAttribute('data-reg-grip'));
    const w = regColWidths();
    const next = regColTrade(w, i, w[i] + step, (REG_COL_MIN_PX / rect.width) * 100);
    regColApply(next, ths); regColSetWidths(next);
  });
}

const REG_DENSITY = {
  comfortable:{ h:44, padX:16, line:20 },
  compact:    { h:36, padX:12, line:20 },   /* today's row — the default */
};
/* ---- CONDENSED IS GONE (Young ruled 21 Sep 2026: "Delete condensed") ----
   It was the one rung that took the kind and the round off the title (see
   the row builder below), so it drew a DIFFERENT row rather than the same row
   closer together. An unknown stored value already falls back to compact, so
   a browser that remembers 'condensed' needs no migration and reads compact.
   `reg_density_condensed` is STALE and inert in both books. */
const REG_DENSITY_KEY = 'hati.v1.regDensity';
/* ABSENT MEANS COMPACT — the historic behaviour — so there is no migration
   and an unknown stored value falls back rather than drawing a broken row. */
function regDensity(){
  try{ const v = localStorage.getItem(REG_DENSITY_KEY); return REG_DENSITY[v] ? v : 'compact'; }
  catch(_){ return 'compact'; }
}
function regSetDensity(k){
  if(!REG_DENSITY[k]) return false;
  try{ localStorage.setItem(REG_DENSITY_KEY, k); }catch(_){}
  return true;
}
/* The three custom properties the table's own rules already read. Written as
   a style attribute on .reg-table so one element carries the whole mode. */
function regDensityVars(k){
  const d = REG_DENSITY[REG_DENSITY[k] ? k : 'compact'];
  return `--reg-row-h:${d.h}px;--reg-row-px:${d.padX}px;--reg-row-line:${d.line}px`;
}

function regScope(){ return REG_SCOPE; }
/* ═══ TABLE OR BOARD (20 Sep 2026, the redesign order's step 3) ══════════
   The board is today's My Queue — pipeBoardHtml in js/views/queue.js, the
   same cards with every fact they carried — drawn INSIDE the Contracts page
   over the FILTERED list, so the tabs, the chips and the search narrow both
   shapes alike. Per sitting and in memory: a stored shape would put two
   people's screens in disagreement about what "Contracts" shows. Never on
   the Negotiations seat, which groups by whose move and has no columns of
   stage to lay out. My Queue stays routable on its own (renderPipeline). */
let _regMode='table';
function regMode(){ return (regScope()==='negotiations')?'table':(_regMode==='board'?'board':'table'); }
function regSetMode(k){ _regMode=(k==='board')?'board':'table'; }
/* ---- IS ANYTHING THE READER CHOSE NARROWING THIS LIST? ----
   ONE READING, because it was written THREE times and all three disagreed:
   the empty state's copy left out signed and payterms, the filter bar's left
   out the query, and the Negotiations head counted a query that narrowed
   nothing. Two answers to one question is how a Clear button comes to offer
   itself over a list nothing had filtered — and how a page comes to say it is
   narrowed while the reading behind it says otherwise.

   THE SCOPE IS NOT A FILTER. Live-negotiations-only is a property of the page,
   applied above every filter and untouched by Clear, so it is deliberately not
   counted here.

   AND THE QUERY COUNTS ONLY WHERE IT NARROWS (regQueryOf, the one answer):
   a head that called a query nobody can see a filter would be the control
   saying one thing and the table another. */
/* ---- THE WAY BACK IS PAINTED, NOT ONLY BUILT ----
   The shell bar's search repaints the BODY on every keystroke (a full render
   per letter would rebuild the page under the reader), so a Clear button
   interpolated into the filter bar's markup only ever appeared on a full
   render — a page narrowed by the search with nothing on it to press, which is
   the very fault the retirement was reasoning about. It is a slot and a
   painter, the shape #ws-tabrow-end and the footer count already use.

   ONE BUILDER AND ONE WIRING, so the two callers cannot draw or arm it
   differently. */
function regClearHtml(){
  return regNarrowed() ? `<button id="reg-clear-filters" type="button" class="ui-link">${i18t('reg_clear')}</button>` : '';
}
function regPaintClear(){
  const slot=document.getElementById('reg-clear-slot'); if(!slot) return;
  slot.innerHTML=regClearHtml();
  wireRegClear();
}
function wireRegClear(){
  /* CLEAR CLEARS THE QUERY AND THE BOX THAT HOLDS IT. Emptying the state alone
     would leave the shell bar still reading "lease" over a list it was no
     longer narrowing — the control saying one thing and the table another. */
  /* AND IT CLEARS EXACTLY WHAT A DOOR FROM ANOTHER PAGE CLEARS (27 Sep 2026):
     regFiltersAtRest is the one reading of "nothing is narrowing", read off
     the filter catalogue — this used to be its own list of eleven. */
  document.getElementById('reg-clear-filters')?.addEventListener('click',()=>{
    regFiltersAtRest(regState());
    regSearchBoxClear();
    regRepaint();
  });
}
/* ---- WHERE THE WORDS NARROW (Part 8, the owner's pick "The Legora way", 21
   Oct 2026) ---- a query narrows where a box says what it is set to, and
   nowhere else (M-5's own rule, kept): on Contracts, the top bar's box; on
   Negotiations, the list head's box — on a computer. The phone's Negotiations
   screen draws no box (mNegotiationsHtml reads regFiltered over the same
   state), so there the words narrow nothing, as M-5 ruled for both shells.
   This REVERSES M-5 on the computer only: the page now has a box of its own. */
function regQueryOf(R){
  if(regScope()==='negotiations' && typeof window.mPhone==='function' && window.mPhone()) return '';
  return String((R&&R.query)||'');
}
function regNarrowed(R){
  const st = R || regState();
  const q = regQueryOf(st).trim();
  /* EVERY BAR FILTER, ASKED THROUGH ITS OWN PREDICATE (the owner's list, 27
     Sep 2026): this listed the filters by hand and On hold was missed, so a
     list narrowed by it alone drew no Clear and no "Do this to these". One
     predicate per filter (regFilterActive) means a filter added to the bar is
     a narrowing here the day it is added. */
  return !!(q || REG_BAR_FILTERS.some(f=>regFilterActive(f.k, st)) || st.only);
}

function regSetScope(k){ REG_SCOPE = (k === 'negotiations') ? 'negotiations' : null; }
/* `show` is HOW the Contracts place draws the one list (the overnight work
   order, step 7): 'wall' (the wall of papers) or 'list' (this table). It is a
   way of LOOKING, like sort and density, so a door's fresh filters keep it.
   LIST FIRST (owner, 21 Oct 2026): the switch reads List | Wall, the default first. */
const REG_SHOWS = ['list','wall'];
const REG_STATE_DEF = () => ({query:'',stage:'all',type:'all',category:'all',signed:'all',payterms:'all',docs:'all',sort:'updated',dir:-1,page:1,sel:{},view:null,only:null,show:'list',ask:[]});
/* A REFRESH LANDS WHERE YOU WERE (Young, 28 Sep 2026): what this page keeps
   across a reload, read by placeSave and put back by placeResume (js/app.js)
   BEFORE the first paint. Home's Contracts place keeps the same pair, inside
   Home's own (hbPlace → igWallPlace). A set kept by an earlier sitting comes
   back as it was, or not at all; an unknown way of looking is the List
   (owner, 20 Oct 2026: "make the contracts landing page be on list as opposed
   to paper" — the place lands on the List until the reader picks Wall). */
function regPlace(){ return { scope:regScope(), st:{ ...regState() } }; }
function regPlacePut(p){
  if(!p) return;
  regSetScope(p.scope);
  const s={ ...REG_STATE_DEF(), ...(p.st||{}) };
  const o=s.only;
  s.only=(o&&Array.isArray(o.ids)&&o.ids.length&&o.ids.every(x=>typeof x==='string'))
    ? { ids:o.ids.slice(), label:String(o.label||'').slice(0,200), ...(o.party===true?{ party:true }:{}) } : null;
  if(!REG_SHOWS.includes(s.show)) s.show='list';
  if(regScope()==='negotiations') state.regNego=s; else state.reg=s;
}
/* ---- THE CONTRACTS PLACE ON HOME (the overnight work order, step 7; owner's
   "Go", 14 Oct 2026) ----
   Every door that opened the Contracts page lands on Home's Document face with
   no paper chosen, and this builder draws the place there: ONE head (the name,
   the facts line, the filters, the stage tabs, Wall | List) over the wall of
   papers or this table — the same rows, tabs and filters either way (state.reg,
   the one home of every narrowing). regPlaceSet writes the Contracts seat from
   outside the page (Jambo's "list", "wall", "contracts"); regPlaceUp says
   whether the place is on screen, so a box that narrows it repaints it rather
   than opening it again. */
function regPlaceSet(patch){
  regSetScope(null);
  const R=regState();
  if(patch) Object.assign(R, patch);
  if(!REG_SHOWS.includes(R.show)) R.show='list';
  return R;
}
function regPlaceUp(){ return typeof document!=='undefined' && !!document.querySelector('[data-reg-home]'); }
function regHome(){ return !!(_regOpts&&_regOpts.home); }
/* THE PLACE FOLLOWS THE BOOK: Home repaints only its head when the book
   changes under a face that is not the Board (a repaint is not a navigation),
   so the place keeps the book it was drawn from and is drawn again only when
   that book moved (the first load after signing in, a contract added, saved or
   gone) — never on a beat that changed nothing, which would throw away the
   reader's scroll. */
let _regHomeSig='';
function regBookSig(){
  const cs=(state&&state.contracts)||[];
  let t=0; for(const c of cs){ const v=Date.parse(c&&(c.updatedAt||c.updated_at||c.lastAction)||'')||0; if(v>t) t=v; }
  return cs.length+':'+t;
}
function regHomeStale(){ return regPlaceUp() && regBookSig()!==_regHomeSig; }
/* THE ARCHIVE HAS ITS OWN BUTTON (round 13 of the redesign: the owner picked
   "Wall of papers" and said yes to the archive leaving the Quick filters box,
   17 Oct 2026): beside Wall | List, with its own count — the press's own
   reading (regViewCount), so the number on the door is the shelf behind it.
   It is the archive view (R.view 'archived'); pressed again, the live book. */
function regArchiveBtnHtml(R){
  const on=R.view==='archived';
  let n=null; try{ n=regViewCount('archived'); }catch(_){ n=null; }
  return `<button type="button" class="ui-btn ct-arch" data-ct-archive aria-pressed="${on?'true':'false'}" title="${esc(i18t(on?'ct_arch_back':'ct_arch_title'))}">${typeof icon==='function'?icon('archive','w-4 h-4'):''}<span>${esc(i18t('ct_archive'))}</span>${n?`<span class="ct-arch-n">${esc(String(n))}</span>`:''}</button>`;
}
/* THE PLACE'S ONE HEAD (Part 8, the owner's pick "The Legora way", 21 Oct
   2026): ONE white card, the list head's own (lhHtml, frame 'card'). Its
   title row is the place's as before — the name and the facts line, the
   Archive button and List | Wall — and under its line the shared rows: the
   box to search or ask in, the views as tabs, then "+ Filter" and its chips
   with Sort, Display, "Do this to these N", "✦ Ask a column" and Columns at
   the row's end (regCtHeadReg says what each reads). This REVERSES 16 Oct's
   "the filter boxes on the row under it, just above the card" (Stage ·
   Stream · Category · Quick filters, Clear, Adapt filters) and 9 Oct's one
   white band edge to edge on the place: the drawing's head is a card on the
   ground, like every list page's. */
function regHomeHeadHtml(R){
  const show=R.show==='list'?'list':'wall';
  const ic=k=>typeof icon==='function'?icon(k==='wall'?'grid':'list','w-4 h-4'):'';
  const nlF=typeof window.newLookOn==='function'&&newLookOn();
  const fName=nlF&&R.type&&R.type!=='all'&&FOLDERS[R.type]?FOLDERS[R.type].name:(nlF&&R.view==='archived'?i18t('ctf_ended'):'');
  const top=`<div class="reg-tabbar ct-top ph-top">
        <div class="ct-name">${nlF?`<button type="button" class="ctf-back" data-ctf-back>‹ ${esc(i18t('ctf_tab_folders'))}</button>${fName?'<span class="ctf-crumb">›</span>':''}`:''}<h2 class="ct-h">${esc(fName||i18t('nav_contracts'))}</h2><div id="reg-head-facts" class="ct-facts"></div></div>
        ${regArchiveBtnHtml(R)}
        <div class="reg-seg ct-seg" role="group" aria-label="${esc(i18t('ct_show_as'))}">${REG_SHOWS.map(k=>
          `<button type="button" data-ct-show="${k}" aria-pressed="${show===k?'true':'false'}">${ic(k)}<span>${esc(i18t('ct_'+k))}</span></button>`).join('')}</div>
        ${nlF&&((typeof canEdit!=='function')||canEdit())?`<button type="button" class="ui-btn ui-btn-primary ctf-new" data-ctf-draft>${typeof icon==='function'?icon('plus','w-3.5 h-3.5'):'+'}${esc(i18t('ctf_new_agreement'))}</button>`:''}
      </div>`;
  if(typeof window.lhHtml!=='function'||!(window.LH_PAGES&&LH_PAGES[REG_CT_SEAT])) return `<div class="reg-band sap-band ph-card ct-head">${top}</div>`;
  const head=lhHtml(REG_CT_SEAT, { frame:'card', top, cls:'reg-band ct-head' });
  /* the Wall as drawn: "upload a document" closes the tabs' line (the one drop door, pdDropDoor) */
  return nlF&&show==='wall'&&typeof window.pdDropDoor==='function'?head.replace(/<\/div>\s*$/,`<button type="button" class="ctf-up" data-ctf-upload>${esc(i18t('ctf_upload'))}</button></div>`):head;
}
/* THE WALL UNDER THE SAME HEAD: the papers igWallBodyHtml draws, of the very
   rows the list holds (regFiltered), its count line carrying the list's own
   Sort; a press is igAnalyze (igPickWire, bound on Home's paper). */
function regHomeWallHtml(cs, tools){
  const R=regState();
  let base=[]; try{ base=regRestBase(); }catch(_){ base=cs; }
  const body=(typeof igWallBodyHtml==='function') ? igWallBodyHtml(cs,{ tools, only:R.only, base }) : '';
  return `<div class="ig-wall ct-wall" id="ig-wall">${body}</div>`;
}
/* What the place counts its wall against: every filter at rest but the set a
   door sent, flat — the book the count line's "of n" names. */
function regRestBase(){
  const keep=state.reg||REG_STATE_DEF(), was=REG_SCOPE;
  REG_SCOPE=null;
  state.reg={ ...keep }; regFiltersAtRest(state.reg); state.reg.only=keep.only; state.reg.flat=true;
  /* THE ARCHIVE SHELF IS ITS OWN BOOK (the checkers of step 7): at rest the
     filters hide the archived, so "1 of 8" counted the shelf against a book
     that held none of it; on the shelf, "of n" is the shelf. */
  if(keep.view==='archived') state.reg.view='archived';
  try{ return regFiltered(); } finally { state.reg=keep; REG_SCOPE=was; }
}
function regState(){
  if(regScope()==='negotiations'){ if(!state.regNego) state.regNego=REG_STATE_DEF(); return state.regNego; }
  if(!state.reg) state.reg=REG_STATE_DEF(); return state.reg;
}
/* ---- THE THREE GROUPS, IN THIS ORDER, ON EVERY SHELL ----
   Waiting on you first: it is the reason to open the page at all. The keys are
   what negWhoseMove answers with (js/views/negotiation.js), the tone is the
   app's existing amber / neutral / green state colour and nothing new, and the
   NAME and the COUNT ride beside the colour so the page reads in grey-scale.
   The phone renders its own row shape from this same list — one order, two
   shells, the way Contracts already works. */
const NEGO_BANDS=[
  {k:'you',  tone:'amber',  get label(){ return i18t('ngl_band_you'); }},
  {k:'them', tone:'gray',   get label(){ return i18t('ngl_band_them'); }},
  /* WITH THEM FOR SIGNATURE (26 Sep 2026): the agreed words were handed over
     and the signed copy has not come back. Its own group, because nothing in
     it is an answer to wait for — it is a signature and a file to expect. */
  {k:'out',  tone:'steel',  get label(){ return i18t('ngl_band_out'); }},
  {k:'clear',tone:'green',  get label(){ return i18t('ngl_band_clear'); }},
];
const NEGO_BAND_DOT={amber:'var(--st-amber-dot)',gray:'var(--color-neutral-400)',steel:'var(--st-steel-dot)',green:'var(--st-green-dot)'};
/* Partition, never re-sort inside a group: whatever order the register's own
   sort produced is preserved within each band, which is what makes "Sort" mean
   something on this page. Stamped on the record the way regGroupFamilies
   stamps _famKids, so the renderer does not have to ask twice. */
function negoGroupByMove(cs){
  const buckets={you:[],them:[],out:[],clear:[]};
  for(const c of cs){
    const m=(typeof window.negWhoseMove==='function')?window.negWhoseMove(c):{k:'clear',n:0};
    c._ngBand=m.why==='handover'?'out':m.k; c._ngN=m.n;
    (buckets[m.k]||buckets.clear).push(c);
  }
  return NEGO_BANDS.reduce((out,b)=>out.concat(buckets[b.k]||[]),[]);
}
/* How many rows each band holds IN THE SET ON SCREEN. The bands count the
   filtered view — see the note the page prints when a filter is on. */
function negoBandCounts(cs){
  const n={you:0,them:0,out:0,clear:0};
  /* one key, read and written: a contract never stamped by negoGroupByMove counts as "neither", added to the
     rest (bug log, 26 Oct 2026: it read n[undefined] and reset "neither" to 1) */
  cs.forEach(c=>{ const k=c._ngBand===undefined?'clear':c._ngBand; n[k]=(n[k]||0)+1; });
  return n;
}
/* ---- A NAMED SET, SENT HERE FROM SOMEWHERE ELSE (added 2026-08-11) ----
   Asked for against the calendar: a day carrying more than one contract should
   open the register on those contracts, so the reader can see them side by side
   and pick. There was no way to say that — every filter here is a QUESTION
   (which stage, which stream, which category), and "these two, because that is
   what was on the 31st" is an ANSWER somebody else worked out.

   So `only` is a set of ids with a label saying where it came from. Two rules
   make it safe, and they are the same two the origin filter on the negotiation
   column has to obey: it SAYS on screen what it is narrowed to, and the way
   back is on the same chip. A list silently showing two of a hundred and
   thirty-nine contracts is indistinguishable from a broken register.

   It is an ordinary filter in every other respect ON THE PAGE — the stage,
   stream and category dropdowns still narrow further inside it, Clear clears it
   with the rest, and it survives navigation exactly as they do. What it no
   longer does is ARRIVE on top of filters left from an earlier visit: see the
   door below. */
/* ---- A DOOR FROM ANOTHER PAGE LANDS ON THE LIST IT NAMED, AND NOTHING ELSE
   (Young ruled 27 Sep 2026) ----
   *"When you have chosen a new filter from outside the page and you are landed
   to the results, the previous filters should not be there."* His journey:
   Home's stage bar opened Contracts on Stage · Drafting; back on Home, "See all"
   on Needs your decision opened its named set INSIDE that stage, so the list
   showed the drafts on it and hid the rest — a door that said one number
   landing on a smaller one, the fault the Map's own note forbids.

   EVERY DOOR HAD WRITTEN ITS OWN SHORT LIST OF WHAT TO CLEAR, and each list was
   short of the next filter somebody added: this one cleared nothing but the
   named set, the Map's stage door five filters, the phone's tiles three, the
   shell search none. So there is ONE reading of "nothing is narrowing", and it
   is DERIVED FROM THE FILTER CATALOGUE (REG_BAR_FILTERS) — a filter added
   tomorrow is cleared by every door, and by Clear, without anybody remembering
   to list it. The query, the named set and the page go with them. SORT,
   DIRECTION, DENSITY AND THE AMENDMENT FOLD ARE KEPT: they are how the reader
   LOOKS at a list, not what is on it.

   The rest value is 'all' for every filter but the quick-filter tab, whose rest
   is "no tab lit" (null) — the two Clear buttons have always written exactly
   that, and they ask this now, so a door and Clear cannot disagree about what
   "no filter" means.

   A FILTER CHOSEN ON THE PAGE STILL NARROWS FURTHER. The rule is about
   ARRIVING: the chips, the tabs and the search box typed while the list is on
   screen keep everything else, exactly as before. */
const REG_FILTER_REST = { view: null };
function regFiltersAtRest(R){
  R = R || regState();
  REG_BAR_FILTERS.forEach(f=>{
    R[f.k] = Object.prototype.hasOwnProperty.call(REG_FILTER_REST, f.k) ? REG_FILTER_REST[f.k] : 'all';
  });
  R.query=''; R.only=null; R.page=1;
  return R;
}
/* The shell bar's box lives above every page and no page repaints it, so a
   query taken off the state has to be taken out of the box by hand — Clear's
   own rule: the control may not say one thing and the table another. */
function regSearchBoxClear(){
  const b=document.getElementById('cmd-search'); if(b) b.value='';
  /* and the list head's box on the page (Part 8, Q1 "keep both boxes": two
     boxes never disagree about one query), a question standing there too */
  if(typeof window.lhBoxSet==='function') lhBoxSet(regScope()==='negotiations'?REG_NEGO_SEAT:REG_CT_SEAT, '');
}
/* THE ONE DOOR, obwGoFiltered's twin on the Obligations page (which learned
   the same lesson on 31 Aug: "a named door could land a reader on whatever
   narrowing they had left behind an hour earlier with nothing saying why").
   The seat goes back to Contracts FIRST, before the state is read — a door
   pressed from the Negotiations page would otherwise write its answer into
   that page's filters and open a register that had never heard of it.
   `open:false` is for a caller that opens the page itself (the phone). */
function regGoFiltered(patch, opts){
  /* THE NEGOTIATIONS SEAT TOO (19 Oct 2026, "go to negotiations and show me
     the drafts"): a door may name it (opts.scope); its own filters, at rest,
     then the narrowing, then its own door (openNegotiations) */
  regSetScope(null);
  const nego=!!(opts&&opts.scope==='negotiations'); if(nego) regSetScope('negotiations');
  const R=regFiltersAtRest(regState());
  if(patch) Object.assign(R, patch);
  regSearchBoxClear();
  /* the list head's box shows the fresh words, and a question standing in
     it goes (its one writer, js/views/listhead.js) — Negotiations' box, or
     the Contracts place's */
  if(typeof window.lhBoxSet==='function') lhBoxSet(nego?REG_NEGO_SEAT:REG_CT_SEAT, String(R.query||''));
  if(nego){ regSetScope(null); if(opts.open===false) return R;
    if(typeof window.openNegotiations==='function') window.openNegotiations({ list:true }); return R; }
  if(opts && opts.open===false) return R;
  if(typeof setView==='function') setView('register'); else renderRegister();
  return R;
}
/* `opts.party`: the set is a party's shelf (Parties' Open party), counted the
   way that row counts it — agreements, the amendments said beside them — so
   the Wall's count line reads the row's number; every other set is counted
   whole, the number on the door that sent it (the checkers of step 7). */
function regShowOnly(ids, label, opts){
  const list=Array.from(new Set((ids||[]).filter(Boolean)));
  const only=list.length ? { ids:list, label:String(label||'') } : null;
  if(only && opts && opts.party) only.party=true;
  regGoFiltered({ only });
}
/* The category list has ONE source: the metadata field that records it. Add
   a category there and it reaches this filter and the phone's chips without
   either of them being edited. */
const regCategories = () => ((typeof META_FIELDS!=='undefined'?META_FIELDS:[]).find(f=>f.k==='category')||{opts:[]}).opts||[];
const regCatLabel = k => (typeof metaOptLabel==='function' ? metaOptLabel(k) : k);
/* 'none' is not a category — it is the pile that has none recorded yet, which
   is the worklist for getting a portfolio countable. Without it those
   contracts vanish under every category and there is no way back to them. */
function regCatMatch(c, want){
  const has=(c.metadata&&c.metadata.category)||'';
  return want==='none' ? !has : has===want;
}
// Ascending-natural comparators; regFiltered() multiplies each by R.dir (1 = asc, -1 = desc)
// so a column header click can toggle direction. STAGE follows lifecycle order.
const REG_STAGE_ORDER={ 'Draft':0, 'Under Review':1, 'Signed':2, 'Declined':3 };
/* ---- AN EMPTY CELL SORTS LAST IN BOTH DIRECTIONS ----
   A SENTINEL CANNOT DO THIS, and that is the whole reason this is a function
   rather than a magic value: regFiltered sorts with `dir*cmp`, so a value that
   puts the blanks last ascending puts them FIRST descending — and a column
   opening on a screen of em-dashes is the one thing a sort must never do.
   The comparator has to ASK which way it is being read and return a value that
   survives the multiplication.

   The signed column has done exactly this since J-5.1 and wrote the trick out
   inside itself; three more columns can be blank (counterparty, value stream,
   and signed itself), so it is named once here rather than copied — where two
   surfaces must answer alike, the question becomes one function.

   Returns null when BOTH cells carry something, which is the caller saying
   "nothing to see here, order them yourself". */
function regBlanksLast(A, B){
  if(A && B) return null;
  if(!A && !B) return 0;
  const d=(regState().dir===1?1:-1);
  return A ? -d : d;
}
/* ---- THE STREAM'S OWN WORD, READ ONCE ----
   The column prints the stream's FULL name, so the sort has to order by that
   same word: ordering by the folder id would put the column in a sequence the
   reader cannot see, and core's streamLabel answers with the SHORT name, which
   is a third word again. The cell and the comparator ask this one reading so
   neither can drift. Guarded, because a stage without FOLDERS must draw the
   table rather than take the page down. */
function regStreamName(c){
  return (window.FOLDERS && FOLDERS[c&&c.folder] && FOLDERS[c.folder].name) || '';
}
/* ---- A REFERENCE IS A NUMBER WITH A PREFIX, NOT A STRING ----
   Compared as text MK-10 sorts before MK-2 and the column reads as shuffled,
   which is the commonest fault a reference column has. The PREFIX is compared
   first and the number second, so a migrated book carrying MK-P1 beside MK-2
   keeps each family in its own run rather than interleaving the two. */
const REG_REF_RE=/^(.*?)(\d+)\s*$/;
function regRefParts(id){
  const s=String(id||'').trim();
  const m=REG_REF_RE.exec(s);
  return m ? [m[1].toLowerCase(), Number(m[2])] : [s.toLowerCase(), -1];
}
/* the value a sort ranks by: a salary is not deal value, so it ranks with the dashes (fxIsPay); a value in
   another currency ranks by what it is worth here (fxHome, the one converter), and one with no rate is a
   blank — never a figure guessed, so it sorts last both ways (bug log, 26 Oct 2026: USD 100k ranked
   under KES 1M) */
const regSortValue=c=>{
  if(typeof fxIsPay==='function'&&fxIsPay(c)) return 0;
  if(typeof fxHome!=='function') return Number(c.value||0);
  const h=fxHome(c); return h.missing ? null : h.v;
};
const REG_CMP={
  updated:(a,b)=>((Date.parse(a.lastAction)||0)-(Date.parse(b.lastAction)||0)),
  value:(a,b)=>{ const A=regSortValue(a), B=regSortValue(b);
    const e=regBlanksLast(A!=null, B!=null); if(e!==null) return e;
    return A-B; },
  risk:(a,b)=>contractRisk(a)-contractRisk(b),
  /* worst first: the most missing, then the most that differ; a contract not checked sorts last both ways */
  standards:(a,b)=>{
    const r=c=>(typeof stdRowReading==='function')?stdRowReading(c):null;
    const A=r(a), B=r(b); const e=regBlanksLast(!!(A&&A.total), !!(B&&B.total)); if(e!==null) return e;
    return (B.miss-A.miss)||(B.off-A.off); },
  name:(a,b)=>(a.name||'').localeCompare(b.name||''),
  expiry:(a,b)=>{ const ea=effectiveExpiry(a), eb=effectiveExpiry(b); const da=ea?daysUntil(ea):1e9, db=eb?daysUntil(eb):1e9; return da-db; },
  stage:(a,b)=>((REG_STAGE_ORDER[a.status]??9)-(REG_STAGE_ORDER[b.status]??9)),
  /* A CONTRACT WITH NO SIGNATURE SORTS LAST IN BOTH DIRECTIONS, which is the
     guard the expiry comparator above already carries: '' sorts before every
     real date ascending and after none descending, so an unsigned draft would
     lead the list one way round. The sentinel is compared as a STRING because
     an ISO day already sorts correctly as one. The direction-aware half is
     regBlanksLast, which this column wrote and three more now inherit. */
  signed:(a,b)=>{
    const A=regSignedOn(a), B=regSignedOn(b);
    const e=regBlanksLast(A,B); if(e!==null) return e;
    return A<B?-1:A>B?1:0; },
  /* Whose move: mine, then theirs, then nothing to do; a contract with no
     negotiation sorts last both ways. READING MUST NOT WRITE — regMoveWord
     asks negoMoveSay only where a negotiation already exists. */
  move:(a,b)=>{
    const rank=c=>{ const m=regMoveWord(c); return m?({mine:'1',theirs:'2'}[m.k]||'3'):''; };
    const A=rank(a), B=rank(b);
    const e=regBlanksLast(A,B); if(e!==null) return e;
    return A<B?-1:A>B?1:0; },
  owner:(a,b)=>{
    const A=(window.contractOwnerName&&contractOwnerName(a))||'', B=(window.contractOwnerName&&contractOwnerName(b))||'';
    const e=regBlanksLast(A,B); if(e!==null) return e;
    return A.localeCompare(B); },
  /* ---- THE FOUR COLUMNS THAT COULD NOT BE ORDERED (owner-asked 10 Sep 2026:
     "I should be able to sort on each column like in the signed column") ----
     Reference, counterparty and value stream. The ninth column is deliberately
     not one: on Contracts it holds the row's ⋯ and carries no heading, so
     there is nothing to press; on Negotiations it is whose move, which is the
     very thing the bands above it already group by. */
  ref:(a,b)=>{
    /* sorted by the reference a person reads: a working file that took its
       contract number sorts among the contracts */
    const A=regRefParts(window.contractRef?contractRef(a):a.id), B=regRefParts(window.contractRef?contractRef(b):b.id);
    if(A[0]!==B[0]) return A[0]<B[0]?-1:1;
    return A[1]-B[1]; },
  party:(a,b)=>{
    /* ON THE CONTRACTS PLACE THE COLUMN LEADS WITH THE AGREEMENT (Round 2), so its sort reads what it says */
    const byName=typeof regHome==='function'&&regHome()&&!(typeof regScope==='function'&&regScope()==='negotiations');
    const A=String(byName?regShortTitle(a):(a.counterparty||'')).trim(), B=String(byName?regShortTitle(b):(b.counterparty||'')).trim();
    const e=regBlanksLast(A,B); if(e!==null) return e;
    return A.localeCompare(B); },
  stream:(a,b)=>{
    const A=regStreamName(a), B=regStreamName(b);
    const e=regBlanksLast(A,B); if(e!==null) return e;
    return A.localeCompare(B); },
  /* The Negotiations seat's own column (21 Sep 2026). It orders by the KIND
     and then by the round inside it, which is what the cell prints: a reader
     sorting this column is grouping the paper, not ranking the rounds. */
  kind:(a,b)=>{
    const A=String(cKind(a)||''), B=String(cKind(b)||'');
    const e=regBlanksLast(A,B); if(e!==null) return e;
    if(A!==B) return A.localeCompare(B);
    const rd=c=>(c.negotiation&&typeof c.negotiation.round==='number')?c.negotiation.round:0;
    return rd(a)-rd(b); },
};
// direction applied on a column's FIRST header click (1 = ascending, -1 = descending)
const REG_SORT_DEFDIR={ updated:-1, value:-1, risk:-1, name:1, expiry:1, stage:1, signed:-1,
  ref:1, party:1, stream:1, standards:1, move:1, owner:1, kind:1 };
/* ---- THIS LIST DOES NOT PAGE, AND THAT IS THE ANSWER TO THE BAND BREAK ----
   Contracts pages at 40 because a register holds every agreement a company has
   ever had. Live negotiations are the handful being argued over right now — a
   workspace with 145 contracts had one — so paging them buys nothing and costs
   the one thing the grouping exists for: a band header stranded at the foot of
   a page, or repeated at the top of the next one with a count that is either
   the group's or the page's and misleading whichever it is. One page, every
   group whole. The footer still counts CONTRACT ROWS (a band is not a row), so
   "showing 1–8 of 8" is the truth and the pager draws nothing. */
function regPageSize(){ return regScope()==='negotiations' ? 1e6 : REG_PAGE; }
// total pages for the current filtered set (min 1)
function regPageCount(cs){ return Math.max(1, Math.ceil(cs.length/regPageSize())); }
// clamp + return the current 1-based page
function regCurPage(cs){ const R=regState(); const n=regPageCount(cs); R.page=Math.min(Math.max(1, R.page||1), n); return R.page; }
// numbered pager (‹ Prev · 1 … windowed … N · Next ›), shown only when >1 page
function regPager(cs){
  const n=regPageCount(cs); if(n<=1) return '';
  const p=regCurPage(cs);
  const btn=(label,to,disabled,active)=>`<button ${disabled?'disabled':''} data-reg-page="${to}" style="min-width:32px;padding:5px 10px;font:inherit;font-size:var(--t-meta);font-weight:${active?700:500};border:1px solid ${active?'var(--accent-fill)':'var(--color-divider)'};background:${active?'var(--accent-fill)':'var(--color-surface)'};color:${active?'#fff':(disabled?'var(--color-neutral-400)':'var(--accent-ink-700)')};border-radius:var(--radius);cursor:${disabled?'default':'pointer'}">${label}</button>`;
  const nums=[]; const lo=Math.max(1,p-2), hi=Math.min(n,p+2);
  if(lo>1){ nums.push(btn('1',1,false,p===1)); if(lo>2) nums.push('<span style="padding:0 3px;color:var(--color-neutral-500)">…</span>'); }
  for(let i=lo;i<=hi;i++) nums.push(btn(String(i),i,false,i===p));
  if(hi<n){ if(hi<n-1) nums.push('<span style="padding:0 3px;color:var(--color-neutral-500)">…</span>'); nums.push(btn(String(n),n,false,p===n)); }
  return `<div style="display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap">${btn('‹ Prev',p-1,p<=1,false)}${nums.join('')}${btn('Next ›',p+1,p>=n,false)}</div>`;
}
// footer text: "Showing 1–40 of 55 · page 1 of 2 · aggregate KES …"
/* ═══ THE VIEW TABS ARE THE QUICK FILTERS (20 Sep 2026, the redesign order) ═══
   "All" plus REG_VIEWS, drawn as a tab row above the filter bar in place of
   the Quick filters dropdown. SAME KEY — R.view — same reading (regFiltered
   asks nothing new), same place in `Adapt filters` (the row is drawn while
   'view' is on the bar, so the chooser still puts it away). No counts on the
   tabs: in server mode the browser holds one page of the book, and a count
   over that page would be a number about the wrong population. */
/* ---- THE TABS COUNT, WHERE THE COUNT IS TRUE (second pass, 21 Sep 2026) ----
   Each tab says how many rows pressing it would show — the SAME reading the
   press runs (regFiltered with only the view swapped), never a second tally.
   Only where the loaded list is the whole book: on a paged server list the
   browser holds a slice, and a count over a slice is a number about the
   slice wearing the book's name. Null means "do not print one". */
function regViewCount(k){
  const R=regState();
  const whole=!(typeof API_MODE==='function'&&API_MODE()) || !(state.serverStats&&state.serverStats.total!=null)
    || Number(state.serverStats.total)<=state.contracts.length;
  if(!whole) return null;
  const was=R.view; R.view=k||null;
  let n=0; try{ n=regFiltered().length; }catch(_){ n=null; } finally{ R.view=was; }
  return n;
}
/* ---- SAVED VIEWS (the reference's "Save view", 21 Sep 2026) ----
   A saved view is the bar's filters and sort, kept in THIS BROWSER under one
   key, drawn as a tab after the built-in ones. It never travels: the KPI
   tile selection's own precedent. A saved tab is lit when the bar currently
   matches it — no second state to fall out of step. */
const REG_SAVED_KEY='hati.v1.regSavedViews';
/* `ask`: the answer columns standing beside the list (Ask a column, 20 Oct 2026) — a saved view carries them */
const REG_SAVED_FIELDS=['stage','type','view','category','renewal','signed','payterms','docs','hold','sort','dir','ask'];
function regSavedViews(){
  try{ const v=JSON.parse(localStorage.getItem(REG_SAVED_KEY)||'[]'); return Array.isArray(v)?v.filter(x=>x&&x.name&&x.set):[]; }
  catch(_){ return []; }
}
function regSavedSnapshot(R){ const o={}; REG_SAVED_FIELDS.forEach(k=>{ o[k]=R[k]==null?null:R[k]; }); return o; }
function regSavedMatches(v,R){ const now=regSavedSnapshot(R); return REG_SAVED_FIELDS.every(k=>String(now[k]==null?'all':now[k])===String(v.set[k]==null?'all':v.set[k])); }
function regSaveView(name){
  const n=String(name||'').trim().slice(0,40); if(!n) return false;
  const list=regSavedViews().filter(v=>v.name!==n);
  list.push({ name:n, set:regSavedSnapshot(regState()) });
  try{ localStorage.setItem(REG_SAVED_KEY, JSON.stringify(list.slice(-12))); }catch(_){ return false; }
  return true;
}
function regForgetView(name){
  try{ localStorage.setItem(REG_SAVED_KEY, JSON.stringify(regSavedViews().filter(v=>v.name!==name))); }catch(_){}
}
function regApplySaved(name){
  const v=regSavedViews().find(x=>x.name===name); if(!v) return false;
  const R=regState(); REG_SAVED_FIELDS.forEach(k=>{ R[k]=v.set[k]==null?(k==='view'?null:(k==='dir'?R.dir:(k==='sort'?R.sort:(k==='ask'?[]:'all')))):(k==='ask'&&Array.isArray(v.set[k])?v.set[k].slice():v.set[k]); });
  R.page=1; return true;
}
/* ---- THE NEGOTIATIONS TABS: ALL · YOUR MOVE · THEIR MOVE · NEITHER (SAP
   benchmark, owner-approved 9 Oct 2026) ----
   The bands the list already groups by, as tabs in the band's own dress
   (.reg-views/.reg-vtab); "With them to sign" draws only while it holds one.
   Counts are the whole live book's, so a tab's number is the list behind it. */
function regNegoBase(){
  const R=regState(), keep=R.band; R.band=null;
  try{ return regFiltered(); } finally { R.band=keep; }
}
/* ---- THE WHOSE-MOVE TABS ARE THE PAGE'S GROUPS NOW (Part 8, the owner's pick
   "The Legora way", 21 Oct 2026; Q2 answered "A — tabs only") ----
   ONE READING for the list head's tab row: All, then Our move, Their move,
   For signature and Neither, each counted with the rows its press shows
   (negoBandCounts over the book with every other cut held, the very partition
   regFiltered narrows the band by). A tab with nothing in it is left out by
   the one tab builder (insViewTabsHtml) unless the reader stands on it — this
   REVERSES round 14's greyed Our move and Their move at zero, the shared
   rule's own. The bands that used to head each group under the table are
   gone (one plain table, "waiting on us" first under All), and their words
   ride each tab's hover ("Waiting on our side"). */
function negoBandViews(R, book){
  const n=negoBandCounts(book||[]);
  const said=k=>{ const b=NEGO_BANDS.find(x=>x.k===k); return b?b.label:''; };
  return [{ k:'', label:i18t('reg_tab_all'), n:(book||[]).length, keep:true },
    { k:'you', label:i18t('reg_pill_your_move'), n:n.you, title:said('you') },
    { k:'them', label:i18t('reg_pill_their_move'), n:n.them, title:said('them') },
    { k:'out', label:i18t('ngl_tab_sign'), n:n.out, title:said('out') },
    { k:'clear', label:i18t('ngl_tab_neither'), n:n.clear, title:said('clear') }];
}
/* ═══ THE NEGOTIATIONS LIST HEAD, THE LEGORA WAY (Part 8, 21 Oct 2026) ═══════
   The page names itself (negoListHeadHtml: the title, its facts, Start a
   negotiation), then the shared head's rows (js/views/listhead.js): the box
   to search or ask in, the whose-move tabs, "+ Filter" and its chips, Sort
   and Display at the right end, and Columns. EVERY READING AND KEPT VALUE IS
   THIS PAGE'S OWN: state.regNego (rlPlace keeps it across a refresh),
   regFiltered the one reading of the rows, of every tab's number and of every
   choice's count. The labelled boxes, Adapt filters, Clear and the list's own
   card head ("Negotiations 7") are retired on this seat. */
const REG_NEGO_SEAT='negotiations';
/* The filters "+ Filter" offers here — REG_BAR_FILTERS less the two this seat
   never draws (Signed: a live negotiation carries none; Quick filters: they
   are questions about the book, not about a deal). */
const REG_NEGO_FILTERS=['stage','type','category','renewal','payterms','docs','hold'];
function regNegoState(){ if(!state.regNego) state.regNego=REG_STATE_DEF(); return state.regNego; }
/* the seat's own reading, whatever seat the register was last asked for: the
   top bar's search turns the register to Contracts before it asks every head
   for its own words (lhBoxSet), and this page's box must never show
   Contracts' query nor count Contracts' filters */
function regOnNego(fn){
  const was=REG_SCOPE; REG_SCOPE='negotiations';
  try{ return fn(regNegoState()); } finally { REG_SCOPE=was; }
}
/* IS THE LOADED LIST THE WHOLE BOOK — a count over a slice is a number about
   the slice wearing the book's name (regViewCount's own rule) */
function regBookWhole(){
  return !(typeof API_MODE==='function'&&API_MODE()) || !(state.serverStats&&state.serverStats.total!=null)
    || Number(state.serverStats.total)<=state.contracts.length;
}
/* how many rows one choice would leave, every other cut held (the lit tab and
   the typed words too): the press's own reading — regFiltered with that one
   value swapped — never a second tally; null where it cannot be counted */
function regNegoOptN(R, k, v){
  if(!regBookWhole()) return null;
  const was=R[k]; R[k]=v;
  try{ return regFiltered().length; }catch(_){ return null; } finally { R[k]=was; }
}
function regNegoFilters(){
  return regOnNego(R=>{
    const opts=(k,list)=>list.map(([v,l])=>[v,l,regNegoOptN(R,k,v)]);
    const pay=(typeof PAY_BUCKETS!=='undefined'&&Array.isArray(PAY_BUCKETS))?PAY_BUCKETS.map(b=>b.k):[];
    const f=(k,label,title,list)=>({ k, label, title, cur:(R[k]==null||R[k]==='')?'all':String(R[k]), def:'all', opts:opts(k,list) });
    return [
      f('stage',i18t('reg_chip_stage'),i18t('reg_lifecycle_stage'),REG_STAGE_TABS.filter(k=>k!=='all').map(k=>[k,regStageWord(k)])),
      f('type',i18t('reg_chip_stream'),i18t('reg_value_stream'),regTypes().filter(t=>t.k!=='all').map(t=>[t.k,t.label])),
      f('category',i18t('me_category'),i18t('me_category'),regCategories().map(k=>[k,regCatLabel(k)]).concat([['none',i18t('reg_uncategorised')]])),
      f('renewal',i18t('reg_renewal'),i18t('reg_renewal'),[['auto-renew',i18t('reg_renew_auto')],['fixed',i18t('reg_fixed')],['evergreen',i18t('reg_evergreen')]]),
      f('payterms',i18t('reg_payterms'),i18t('reg_payterms_title'),pay.map(b=>[b,`${b} ${i18t('pt_days')}`]).concat([['none',i18t('reg_payterms_none')]])),
      f('docs',i18t('reg_docs'),i18t('reg_docs_title'),[['lapsed',i18t('reg_docs_lapsed')],['missing',i18t('reg_docs_missing')],['soon',i18t('reg_docs_soon')],['none',i18t('reg_docs_none')]]),
      f('hold',i18t('reg_f_hold'),i18t('reg_f_hold_title'),[['on',i18t('reg_f_hold_on')],['off',i18t('reg_f_hold_off')]]),
    ];
  });
}
/* a press in the head repaints the page it is on, and the place a refresh
   comes back to is written at once */
function regNegoRepaint(){
  regSetScope('negotiations');
  if(_regOpts&&_regOpts.scope==='negotiations') regRepaint();
  if(typeof window.placeSave==='function'){ try{ placeSave(); }catch(_){ /* the place is a convenience */ } }
}
/* Sort and Display at the chip row's right end, in the dress they wore on the
   list's own card head (a .reg-filterbar holds them, so the chip's own
   select overlay and caret rules still reach them). ONE BUILDER for both
   seats that draw them there (Negotiations, and the Contracts place, Part 8) */
function regToolsHtml(R, neg){
  return `<span class="reg-filterbar ngl-tools">${regSortIconHtml(regSortOptsHtml(R,!!neg))}${regDisplayHtml(!!neg)}</span>`;
}
function regNegoToolsHtml(R){ return regToolsHtml(R, true); }
/* REGISTERED AT THE PAGE'S OWN RENDER (the shared head counts nothing and
   keeps nothing of its own). The columns the reader may hide or order are the
   ones after who the row is (Ref and the counterparty always lead). */
function regNegoHeadReg(){
  if(typeof window.LC_PAGES==='object'&&window.LC_PAGES&&!LC_PAGES[REG_NEGO_SEAT])
    LC_PAGES[REG_NEGO_SEAT]={ cols:()=>regNegoColDefs(), repaint:()=>regNegoRepaint(), hide:['round','lead'] };
  if(typeof window.lhRegister!=='function') return null;
  return lhRegister(REG_NEGO_SEAT, {
    noun:'negotiations', boxId:'ngl-q',
    total:()=>(typeof window.negoLiveList==='function')?negoLiveList().length:null,
    q:()=>String((state.regNego&&state.regNego.query)||''),
    /* the rows only — never the box, so the caret stays; the head recounts
       itself once the typing pauses (renderRegisterBody asks it too) */
    setQuery:words=>{ const R=regNegoState(); R.query=String(words==null?'':words); R.page=1;
      regSetScope('negotiations'); renderRegisterBody();
      if(typeof window.placeSave==='function'){ try{ placeSave(); }catch(_){ /* a convenience */ } } },
    tabAttr:'data-reg-band', tabsLabel:i18t('ngl_tabs_label'),
    tabs:()=>regOnNego(R=>negoBandViews(R, regNegoBase())),
    tabNow:()=>String((state.regNego&&state.regNego.band)||''),
    tab:k=>{ const R=regNegoState(); R.band=k||null; R.page=1; regNegoRepaint(); },
    lead:()=>regOnNego(R=>regOnlyChipHtml(R)),
    filters:()=>regNegoFilters(),
    apply:patch=>{ const R=regNegoState();
      Object.keys(patch||{}).forEach(k=>{ if(REG_NEGO_FILTERS.includes(k)) R[k]=String(patch[k]==null?'all':patch[k]); });
      R.page=1; regNegoRepaint(); },
    right:()=>regOnNego(R=>regNegoToolsHtml(R)),
    /* A PART OF THE PAGE'S OWN DRAWN AFRESH BY A RECOUNT is bound by the
       page's own full paint, which binds every one of its controls per
       element (renderRegister). Never while typing: the named set, Sort and
       Display change only through presses that repaint the page already, so
       their html is the same at every recount and the head leaves them
       standing, listeners and focus kept. */
    wire:()=>regNegoRepaint(),
  });
}
function regNegoHeadHtml(top){
  if(!regNegoHeadReg()||typeof window.lhHtml!=='function') return `<div class="reg-band sap-band ph-card">${top}</div>`;
  return lhHtml(REG_NEGO_SEAT, { frame:'card', top, cls:'reg-band' });
}
/* the foot: "1–7 of 7" — this list draws every row, so it offers no Show
   more; the register's own id stays on it (#reg-showing, the live region) */
function regNegoFootHtml(cs){
  const n=(cs||[]).length;
  if(typeof window.lhFootHtml!=='function') return '';
  return lhFootHtml(REG_NEGO_SEAT, n, n, 0, { id:'reg-showing' });
}
/* COLUMNS (the drawing's right end): the columns after who the row is, in the
   shape this paint draws — beside the panel Round · What is open · Waiting ·
   Lead; the full table its own. A hidden column's room goes to the
   counterparty, the column with the give. */
const REG_NEGO_FIXED=['mk','counterparty'];
const REG_NEGO_COL_WORD={ kind:'reg_col_type_round', value:'reg_col_value', expiry:'reg_col_ends', stage:'reg_col_stage', move:'ngl_col_move',
  round:'ngl_col_round', changes:'ngl_col_changes', waiting:'ngl_col_waiting', lead:'ngl_col_lead', clauses:'ngl_col_clauses' };
function regNegoShapeKeys(){ return regOnNego(()=>regColKeysSeat()); }
function regNegoColDefs(){
  return regNegoShapeKeys().filter(k=>!REG_NEGO_FIXED.includes(k)).map(k=>({ k, label:i18t(REG_NEGO_COL_WORD[k]||k) }));
}
function regNegoColsShown(keys){
  if(typeof window.lcShown!=='function'||!(window.LC_PAGES&&window.LC_PAGES[REG_NEGO_SEAT])) return keys;
  return keys.filter(k=>REG_NEGO_FIXED.includes(k)).concat(lcShown(REG_NEGO_SEAT, keys.filter(k=>!REG_NEGO_FIXED.includes(k))));
}
/* whether the reader has hidden or moved a column on this seat's full table:
   its drag widths are kept for the seat's own order only (regColWidths reads
   a stored array by position), so a chosen set is cut from the defaults by
   KEY and draws no grips */
function regNegoColsChosen(keys){
  const def=regNegoShapeKeys();
  return keys.length!==def.length || keys.some((k,i)=>k!==def[i]);
}
function regNegoColWidths(keys, own){
  const def=regNegoShapeKeys(), w=(Array.isArray(own)&&own.length===def.length)?own:regColDefaults();
  const at=k=>{ const i=def.indexOf(k); return i>=0&&typeof w[i]==='number'?w[i]:0; };
  const spare=def.filter(k=>!keys.includes(k)).reduce((s,k)=>s+at(k),0);
  return keys.map(k=>at(k)+(k==='counterparty'?spare:0));
}
/* ═══ THE CONTRACTS LIST HEAD, THE LEGORA WAY (Part 8, the owner's pick, 21
   Oct 2026) ═══════════════════════════════════════════════════════════════
   The Contracts place on Home names itself as before — the title, its facts,
   the Archive button (owner: keep it) and List | Wall — in the shared head's
   card (js/views/listhead.js), over its rows: the box to search or ask in,
   the views as tabs (All · Needs you · In negotiation · Ending in 90 days ·
   Drafts, then the reader's saved views and "+ Save this view"), "+ Filter"
   and its chips (the old Quick filters one of them), and at the chip row's
   end Sort, Display, "Do this to these N", "✦ Ask a column" and Columns (the
   last two on the List only). EVERY READING AND KEPT VALUE IS THIS PAGE'S
   OWN: state.reg (hbPlace keeps it across a refresh); regFiltered the one
   reading of the rows, of every tab's number and of every choice's count
   (one pass per filter, regCutCount). The labelled boxes, Adapt filters,
   Clear and the list's own card head ("Contracts (56)") are not drawn on the
   place any more; the full table renderRegister draws where Home is not
   (the phone's hidden desktop shell) keeps them. */
const REG_CT_SEAT='contracts';
/* the views in the drawing's order, EXACTLY THE FIVE DRAWN TABS (owner, 22
   Oct 2026, question 2 "B": "Move those four under + Filter — exactly the
   five drawn tabs. The four views are still one press away under + Filter";
   reverses 21 Oct's four more tabs while they held rows, which wrapped the
   row onto a second line); the archive is its own button beside List | Wall */
const REG_CT_VIEWS=['needs','nego','expiring90','drafts'];
/* THE OLD QUICK FILTERS, ONE FILTER UNDER "+ Filter" (the same answer):
   Term already ended · Auto-renewing soon · Overdue obligations · Details to
   fill. ONE FACT, ONE WRITER: it reads and writes R.view, the very key the
   tabs write — so choosing one puts the tab row's view back to All (lit),
   its chip stands, and its × returns R.view to rest (REG_FILTER_REST: null).
   No new kept key: hbPlace keeps R.view as it always has. */
const REG_CT_QUICK=['expired','autosoon','overdueob','details'];
const regCtQuickOf=R=>{ const v=R&&R.view!=null?String(R.view):''; return REG_CT_QUICK.includes(v)?v:null; };
/* the filters "+ Filter" offers: every one the bar knew, Quick filters (the
   four above, 'view') where the bar drew it — after Category */
const REG_CT_FILTERS=['stage','type','category','view','renewal','signed','payterms','docs','hold'];
/* the Contracts seat's own reading, whatever seat the register was last asked for */
function regOnCt(fn){
  const was=REG_SCOPE; REG_SCOPE=null;
  try{ return fn(regState()); } finally { REG_SCOPE=was; }
}
/* the contracts Home's Needs you list names (hbNeedsList: the Counter's,
   the bell's and the checklist's one reading, kept for the one task) */
function regNeedsIds(){
  let L=[]; try{ L=(typeof window.hbNeedsList==='function')?(hbNeedsList()||[]):[]; }catch(_){ L=[]; }
  return new Set(L.map(x=>(x&&x.c&&x.c.id!=null)?String(x.c.id):'').filter(Boolean));
}
/* HOW MANY ROWS A SET DRAWS: the amendments folded the way regGroupFamilies
   folds them (a collapsed family shows its agreement alone), nothing stamped */
function regRowsCount(cs, R){
  const st=R||regState();
  if(st.flat||regScope()==='negotiations') return cs.length;
  const inSet=new Set(cs.map(c=>c.id)), kids=new Map();
  for(const c of cs) if(c.parentId&&inSet.has(c.parentId)) kids.set(c.parentId,(kids.get(c.parentId)||0)+1);
  let n=0;
  for(const c of cs){ if(c.parentId&&inSet.has(c.parentId)) continue; n++;
    const k=kids.get(c.id)||0; if(k&&!(st.collapsed&&st.collapsed[c.id])) n+=k; }
  return n;
}
/* EACH CHOICE OF FILTER k, COUNTED: the rows its press would show, every
   other cut held (the lit tab, the words, a named set) — one pass for the
   base, then filter k's own cut over it per choice (regFiltered's own code,
   never a second tally). Null where the loaded list is not the whole book:
   a count over a slice is a number about the slice wearing the book's name. */
function regCutCount(k, values){
  if(!regBookWhole()) return null;
  const R=regState(), was=R[k], out=new Map();
  let base=[]; try{ base=regFiltered({ skip:k, flat:true }); }catch(_){ return null; }
  try{
    for(const v of values){ R[k]=v; out.set(String(v==null?'':v), regRowsCount(regFiltered({ only:k, src:base, flat:true }), R)); }
  }catch(_){ return null; }
  finally{ R[k]=was; }
  return out;
}
/* THE TABS: All, then the views, each counted with the rows its press shows.
   While one of the Quick filters stands, All is the lit tab and its press
   keeps that chip (a lit tab pressed changes nothing), so All counts the
   rows on screen; a view's press replaces it (one fact), so it counts its own. */
function regCtViews(){
  return regOnCt(R=>{
    const q=regCtQuickOf(R);
    const VS=regNl()?['needs','signed']:REG_CT_VIEWS;
    const by=regCutCount('view',[q].concat(VS));
    const n=k=>by?(by.get(k)||0):null;
    return [{ k:'', label:i18t('reg_tab_all'), n:n(q||''), keep:true }].concat(VS.map(k=>{
      const v=REG_VIEWS.concat([REG_VIEW_SIGNED]).find(x=>x.k===k)||{};
      return { k, label:v.label||k, n:n(k), title:v.title||'' }; }));
  });
}
/* EVERY FILTER'S CHOICES, in the words the boxes said them: never a rest
   value (choosing "All" changes nothing); the listhead leaves out a choice
   with no rows. A Signed year no longer on the book stays on the list while
   it is the one chosen, labelled with its year (the box's own rule). */
function regCtFilterLists(R){
  const now=new Date().getFullYear(), nowY=String(now), lastY=String(now-1), years=regSignedYears();
  const pay=(typeof PAY_BUCKETS!=='undefined'&&Array.isArray(PAY_BUCKETS))?PAY_BUCKETS.map(b=>b.k):[];
  const signed=(years.includes(nowY)?[['this',i18t('reg_signed_this_year')]]:[])
    .concat(years.includes(lastY)?[['last',i18t('reg_signed_last_year')]]:[])
    .concat(years.filter(y=>y!==nowY&&y!==lastY).map(y=>[y,y]));
  const curS=R.signed||'all';
  if(curS!=='all'&&!signed.some(([k])=>k===curS)) signed.push([curS, regSignedYear(curS)]);
  return {
    stage:[i18t('reg_chip_stage'),i18t('reg_lifecycle_stage'),REG_STAGE_TABS.filter(k=>k!=='all').map(k=>[k,regStageWord(k)])],
    type:[i18t('reg_chip_stream'),i18t('reg_value_stream'),regTypes().filter(t=>t.k!=='all').map(t=>[t.k,t.label])],
    category:[i18t('me_category'),i18t('me_category'),regCategories().map(k=>[k,regCatLabel(k)]).concat([['none',i18t('reg_uncategorised')]])],
    view:[i18t('reg_quick_filters'),i18t('reg_quick_filters'),REG_CT_QUICK.map(k=>[k,(REG_VIEWS.find(x=>x.k===k)||{}).label||k])],
    renewal:[i18t('reg_renewal'),i18t('reg_renewal'),[['auto-renew',i18t('reg_renew_auto')],['fixed',i18t('reg_fixed')],['evergreen',i18t('reg_evergreen')]]],
    signed:[i18t('reg_signed'),i18t('reg_signed_title'),signed],
    payterms:[i18t('reg_payterms'),i18t('reg_payterms_title'),pay.map(b=>[b,`${b} ${i18t('pt_days')}`]).concat([['none',i18t('reg_payterms_none')]])],
    docs:[i18t('reg_docs'),i18t('reg_docs_title'),[['lapsed',i18t('reg_docs_lapsed')],['missing',i18t('reg_docs_missing')],['soon',i18t('reg_docs_soon')],['none',i18t('reg_docs_none')]]],
    hold:[i18t('reg_f_hold'),i18t('reg_f_hold_title'),[['on',i18t('reg_f_hold_on')],['off',i18t('reg_f_hold_off')]]],
  };
}
function regCtFilters(){
  return regOnCt(R=>{
    const L=regCtFilterLists(R);
    return REG_CT_FILTERS.map(k=>{
      const [label,title,list]=L[k];
      const by=regCutCount(k, list.map(x=>x[0]));
      const cur=k==='view'?(regCtQuickOf(R)||'all'):(R[k]==null||R[k]==='')?'all':String(R[k]);
      return { k, label, title, cur, def:'all',
        opts:list.map(([v,l])=>[v,l,by?(by.get(String(v))||0):null]) };
    });
  });
}
/* a press in the head repaints the place, and the spot a refresh comes back
   to is written by the place's own paint (renderRegister, home) */
function regCtRepaint(){
  regSetScope(null);
  if(_regOpts&&_regOpts.home) regRepaint();
  else if(regPlaceUp()&&typeof window.igPlacePaint==='function') igPlacePaint();
}
/* THE CHIP ROW'S RIGHT END (the drawing's, and the list card head's tools):
   Sort and Display as the two small icons they were, "Do this to these N"
   while the list is narrowed (cohortButtonHtml decides), then "✦ Ask a
   column" (it draws only on the List, askColOn). The Wall keeps its Sort in
   its own count line, so only "Do this to these N" stands here on it. */
function regCtToolsHtml(R){
  let cohort=''; try{ cohort=(typeof cohortButtonHtml==='function')?cohortButtonHtml():''; }catch(_){ cohort=''; }
  const slot=`<span id="reg-cohort-slot" class="ct-cohort">${cohort}</span>`;
  if(R.show!=='list') return slot;
  return `${regToolsHtml(R,false)}${slot}${typeof window.askColBtnHtml==='function'?askColBtnHtml():''}`;
}
/* COLUMNS (the drawing's right end, the List only): the columns after the
   agreement, in the shape this paint draws; Owner hidden until the reader
   shows it (the drawing draws Agreement · Stage · Ends · Value). The
   agreement leads and the row's ⋯ ends every row, whatever is chosen. */
const REG_CT_FIXED=['counterparty','acts'];
const REG_CT_COL_WORD={ stage:'reg_col_stage', stream:'reg_col_stream', standards:'reg_col_standards', expiry:'reg_col_ends', value:'reg_col_value', owner:'reg_col_owner_word' };
function regCtShapeKeys(){ return regOnCt(()=>regHomeNarrow()?REG_COL_KEYS_HOME_NARROW:REG_COL_KEYS_HOME); }
function regCtColDefs(){
  return regCtShapeKeys().filter(k=>!REG_CT_FIXED.includes(k)).map(k=>({ k, label:i18t(REG_CT_COL_WORD[k]||k) }));
}
/* REGISTERED AT THE PAGE'S OWN RENDER (the shared head counts nothing and
   keeps nothing of its own) */
function regCtHeadReg(){
  if(typeof window.LC_PAGES==='object'&&window.LC_PAGES&&!LC_PAGES[REG_CT_SEAT])
    LC_PAGES[REG_CT_SEAT]={ cols:()=>regCtColDefs(), repaint:()=>regCtRepaint(), hide:['owner'],
      /* Owner steps aside for Jambo's answers (regColKeysSeat): its tick is greyed with why, never live and dead */
      off:()=>regOnCt(()=>regCtAskKeys().length?{ owner:i18t('reg_col_owner_aside') }:{}) };
  /* the Wall carries no Columns: its seat names a page Columns does not know */
  if(typeof window.lhRegister==='function') lhRegister('wall', { more:()=>{ if(typeof window.igWallShowMore==='function') igWallShowMore(); } });
  if(typeof window.lhRegister!=='function') return null;
  const onList=regOnCt(R=>R.show==='list');
  return lhRegister(REG_CT_SEAT, {
    noun:'contracts', boxId:'ct-q',
    total:()=>regOnCt(()=>{ try{ return regRestBase().length; }catch(_){ return null; } }),
    q:()=>String((state.reg&&state.reg.query)||''),
    /* the rows only — never the box, so the caret stays; the head recounts
       itself once the typing pauses (renderRegisterBody asks it), and the
       top bar's box shows the same words (Q1, "keep both boxes") */
    setQuery:words=>{ const w=String(words==null?'':words);
      regOnCt(R=>{ R.query=w; R.page=1; });
      regSetScope(null); renderRegisterBody();
      const bar=document.getElementById('cmd-search'); if(bar&&bar.value!==w) bar.value=w;
      if(typeof window.placeSave==='function'){ try{ placeSave(); }catch(_){ /* a convenience */ } } },
    /* the tab row is the views ("Views"); "Quick filters" is the + Filter group now */
    tabAttr:'data-reg-view', tabsLabel:i18t('reg_qf_acts'),
    tabs:()=>regCtViews(),
    /* a Quick filter in force lights All (its chip says which) */
    tabNow:()=>regOnCt(R=>regCtQuickOf(R)?'':String(R.view||'')),
    tab:k=>{ regOnCt(R=>{ if(!k&&regCtQuickOf(R)) return; R.view=k||null; R.page=1; }); regCtRepaint(); },
    saved:()=>regOnCt(R=>regSavedViews().map(v=>({ id:v.name, label:v.name, on:regSavedMatches(v,R) }))),
    useSaved:id=>{ if(regOnCt(()=>regApplySaved(id))) regCtRepaint(); },
    unsave:id=>regForgetViewAsk(id).then(ok=>{ if(ok) regCtRepaint(); }),
    save:()=>{ regSetScope(null); return regSaveViewAsk().then(ok=>{ if(ok) regCtRepaint(); }); },
    lead:()=>regOnCt(R=>regOnlyChipHtml(R)),
    filters:()=>regCtFilters(),
    apply:patch=>{ regOnCt(R=>{
      Object.keys(patch||{}).forEach(k=>{ if(!REG_CT_FILTERS.includes(k)) return; const v=patch[k];
        /* Quick filters write the tabs' own key: one of the four, else its rest */
        if(k==='view'){ R.view=REG_CT_QUICK.includes(String(v))?String(v):REG_FILTER_REST.view; return; }
        R[k]=(v==null||v==='')?'all':String(v); });
      R.page=1; }); regCtRepaint(); },
    right:()=>regOnCt(R=>regCtToolsHtml(R)),
    lcSeat:onList?REG_CT_SEAT:'contracts-wall',
    /* Show 40 more: the next forty of the same list, the rest of the page kept */
    more:()=>{ regOnCt(R=>{ R.page=(R.page||1)+1; }); regSetScope(null); renderRegisterBody();
      if(typeof window.placeSave==='function'){ try{ placeSave(); }catch(_){ /* a convenience */ } } },
    /* a part of the page's own drawn afresh by a recount (the count on "Do
       this to these N" moved, Ask a column opened): its controls are bound
       again, each once (regToolsWire) */
    wire:()=>{ regToolsWire(); },
  });
}
/* THE FOOT: "1–40 of 189 · Show 40 more" (lhFootHtml), the register's own id
   on it (#reg-showing, the live region), and the words the old foot carried
   after the count kept: "(of N total)" while the list is narrowed, and
   "N agreements · M documents" where amendments are in it */
/* the standards' missing ones by name, under the lights (as drawn: "missing: insurance, liability cap") */
function regStdMissHtml(c){
  const vs=(c&&c.playbook&&Array.isArray(c.playbook.verdicts))?c.playbook.verdicts:[];
  const miss=vs.filter(v=>v&&v.status==='missing').map(v=>String(v.category||v.name||'').toLowerCase()).filter(Boolean);
  return miss.length?`<span class="reg-std-miss" title="${esc(miss.join(', '))}">${esc(i18t('reg_std_missing',{ list:miss.slice(0,2).join(', ') }))}</span>`:'';
}
/* ---- A FOLDER'S PANEL, AS DRAWN (round 6): what Jambo reads of the folder in front, all from what is kept, no call ----
   one sentence (how many are checked against your standards, and whether one answer stands out), UNUSUAL FOR YOU
   (a kept question's answer one contract alone gives, against at least three others that agree — the precedent floor),
   the KEPT QUESTION on the list (its bar, its counts, one quote, the press that reads the rest) and ASK (the other kept
   questions and the packs, each with its cost in calls). A chosen cell, the ask form or a read in flight keeps the
   question's own card. */
const RFP_ODD_MIN = 3;
const _rfpLoading = new Set();
function regFolderPanelOn(){
  if(!regNl() || !regPlaceUp()) return false;
  const R=regState(), A=window.AC;
  return R.show!=='wall' && !!R.type && R.type!=='all' && !R.only && !!A && !A.form && !A.busy && !A.chosen;
}
function regFolderAns(askId, cs){
  const A=window.AC; if(!A) return null;
  const got=A.ans&&A.ans[askId];
  if(!got){ if(!_rfpLoading.has(askId)&&typeof window.askColLoad==='function'){ _rfpLoading.add(askId);
      Promise.resolve(askColLoad(askId, cs.map(c=>String(c.id)))).catch(()=>{}).then(()=>{
        /* the column on the list shows these same answers: it is drawn again with them, not left saying "not read" */
        const up=typeof window.askColKeys==='function'&&askColKeys().includes('ask:'+askId);
        if(up&&regPlaceUp()) regRepaint(); else ctfDockAgain(); }); }
    return null; }
  return got;
}
/* the one answer that stands apart: a number below or above every other, or a yes/no alone against the rest */
function regFolderOdd(cs){
  const A=window.AC; if(!A||!Array.isArray(A.summary)) return null;
  for(const q of A.summary.filter(a=>a&&a.kept)){
    const got=regFolderAns(q.id, cs); if(!got) continue;
    const rows=cs.map(c=>({ c, a:got[String(c.id)] })).filter(r=>r.a&&r.a.found);
    if(rows.length<RFP_ODD_MIN+1) continue;
    const num=rows.map(r=>{ const m=/(\d+(?:\.\d+)?)/.exec(String(r.a.answer||'')); return m?Number(m[1]):null; });
    if(num.every(x=>x!=null)){
      for(const i of [num.indexOf(Math.min(...num)), num.indexOf(Math.max(...num))]){
        const rest=num.filter((_,j)=>j!==i);
        if(num[i]<Math.min(...rest)||num[i]>Math.max(...rest)){ const lo=Math.min(...rest), hi=Math.max(...rest);
          return { r:rows[i], q, others:rest.length, said:lo===hi?String(lo):i18t('reg_fp_range',{ lo, hi }) }; }
      }
      continue;
    }
    if(rows.every(r=>typeof r.a.yes==='boolean')){
      const yes=rows.filter(r=>r.a.yes), no=rows.filter(r=>!r.a.yes);
      const lone=yes.length===1&&no.length>=RFP_ODD_MIN?yes[0]:no.length===1&&yes.length>=RFP_ODD_MIN?no[0]:null;
      if(lone) return { r:lone, q, others:rows.length-1, said:i18t(lone.a.yes?'reg_fp_say_no':'reg_fp_say_yes') };
    }
  }
  return null;
}
function regFolderPanelHtml(){
  let cs=[]; try{ cs=regFiltered(); }catch(_){ cs=[]; }
  const A=window.AC||{}, n=cs.length;
  const checked=cs.filter(c=>c&&c.playbook&&Array.isArray(c.playbook.verdicts)&&c.playbook.verdicts.length).length;
  const odd=regFolderOdd(cs);
  const head=(checked===n?i18t('reg_fp_head_all',{ n }):i18t('reg_fp_head',{ k:checked, n, left:n-checked }))+(odd?' '+i18t('reg_fp_odd_single'):'');
  const cap=t=>`<div class="rfp-cap">${esc(t)}</div>`;
  const title=c=>typeof regShortTitle==='function'?regShortTitle(c):(c.name||'');
  const oddHtml=odd?`${cap(i18t('reg_fp_odd_h'))}<p class="rfp-p"><b>${esc(i18t('reg_fp_odd_line',{ name:title(odd.r.c), ans:String(odd.r.a.answer||'').toLowerCase(), n:odd.others, said:odd.said }))}</b> ${esc(i18t('reg_fp_odd_src',{ q:odd.q.name||odd.q.question||'' }))} <button type="button" class="rfp-a" data-rfp-open="${esc(odd.r.c.id)}" data-rfp-quote="${esc(odd.r.a.quote||'')}">${esc(i18t('reg_fp_open_clause'))}</button></p>`:'';
  /* the kept question on the list (the first up), else none */
  const up=typeof window.askColKeys==='function'?askColKeys().map(k=>String(k).slice(4)):[];
  const askId=up[0]||null;
  let kept='';
  if(askId){
    const q=(A.asks||{})[askId]||{}, got=(A.ans||{})[askId]||{};
    const rows=cs.map(c=>({ c, a:got[String(c.id)] }));
    const yes=rows.filter(r=>r.a&&r.a.found&&r.a.yes===true).length, no=rows.filter(r=>r.a&&(r.a.yes===false||!r.a.found)).length;
    const other=rows.filter(r=>r.a&&r.a.found&&typeof r.a.yes!=='boolean').length, unread=rows.filter(r=>!r.a).length;
    const w=x=>(x/Math.max(1,n)*100).toFixed(2)+'%';
    const bar=`<div class="rfp-bar" aria-hidden="true"><i class="is-yes" style="width:${w(yes)}"></i><i class="is-no" style="width:${w(no+other)}"></i></div>`;
    const counts=[yes||no?i18t('reg_fp_yes_n',{ n:yes }):'', yes||no?i18t('reg_fp_no_n',{ n:no }):'', other?i18tn('reg_fp_other_n',other,{ n:other }):'', unread?i18t('reg_fp_unread_n',{ n:unread }):''].filter(Boolean).join(' · ');
    const pick=rows.find(r=>r.a&&r.a.found&&r.a.yes===true&&r.a.quote)||rows.find(r=>r.a&&r.a.found&&r.a.quote);
    const clauseNo=a=>{ const m=/^\s*(\d+)/.exec(String(a.clause||'')); return m?' § '+m[1]:''; };
    const quote=pick?`<div class="rfp-q"><b>${esc(title(pick.c))} —</b><p><i>“${esc(String(pick.a.quote).slice(0,140))}${String(pick.a.quote).length>140?'…':''}”</i><span>${esc(clauseNo(pick.a))}</span></p></div>`:'';
    let next='';
    try{ const p=askColPlan({ askId }); if(p.unread&&typeof askColNextWords==='function'){ const nw=askColNextWords(p.unread, typeof acSize==='function'?acSize():50);
      next=`<div class="rfp-next"><button type="button" class="rfp-pill" data-ac-next="${esc(askId)}" data-ac-n="${nw.n}">${esc(i18tn('reg_fp_read_n',nw.n,{ n:nw.n }))}</button><span>${esc(i18tn('reg_fp_calls',nw.n,{ n:nw.n }))}</span></div>`; } }catch(_){ next=''; }
    kept=`${cap(i18t('reg_fp_kept_h'))}<p class="rfp-qq">${esc(q.question||q.name||'')}</p>${bar}<div class="rfp-counts">${esc(counts)}</div>${quote}${next}`;
  }
  /* ASK: the other kept questions, then the packs, each with what it costs over this folder */
  const unreadOf=id=>{ const got=(A.ans||{})[id]; return got?cs.filter(c=>!got[String(c.id)]).length:n; };
  const asks=(Array.isArray(A.summary)?A.summary:[]).filter(a=>a&&a.kept&&a.id!==askId).slice(0,3)
    .map(a=>`<div class="rfp-ask"><button type="button" class="rfp-a" data-ac-bring="${esc(a.id)}">${esc(a.question||a.name||'')}</button><span>${esc(i18tn('reg_fp_calls',unreadOf(a.id),{ n:unreadOf(a.id) }))}</span></div>`);
  const packs=(Array.isArray(A.packs)?A.packs:[]).slice(0,2)
    .map(p=>`<div class="rfp-ask"><button type="button" class="rfp-a" data-ac-pack="${esc(p.id)}">${esc(i18t('reg_fp_pack',{ name:p.name, n:(p.questions||[]).length }))}</button><span>${esc(i18tn('reg_fp_calls',n,{ n }))}</span></div>`);
  const ask=asks.length||packs.length?`${cap(i18t('reg_fp_ask_h'))}${asks.join('')}${packs.join('')}`:'';
  return `<div class="rfp-panel"><p class="rfp-head">${esc(head)}</p>${oddHtml}${kept}${ask}</div>`;
}
if(typeof document!=='undefined'&&!document._rfpWired){ document._rfpWired=true;
  document.addEventListener('click',e=>{
    const b=e.target&&e.target.closest?e.target.closest('[data-rfp-open]'):null; if(!b) return;
    e.preventDefault(); const id=b.getAttribute('data-rfp-open'), qt=b.getAttribute('data-rfp-quote')||'';
    if(typeof window.askColLandOn==='function') askColLandOn(id, qt); else regOpenContract(id);
  });
}
/* THE NEW LOOK'S FOOT, AS DRAWN: how many in this folder · Show all N, and on the right what the columns are */
function regNlFootHtml(cs){
  const R=regState(), n=(cs||[]).length, inF=R.type&&R.type!=='all';
  let all=0; try{ all=regRestBase().length; }catch(_){ all=0; }
  const left=inF?i18tn('reg_nl_foot_folder',n,{ n }):i18tn('reg_foot_n',n,{ n:n.toLocaleString(jxLocale()) });
  const more=inF&&all>n?` · <button type="button" class="reg-nl-all" data-ctf-tab="all">${esc(i18t('reg_nl_show_all',{ n:all }))}</button>`:'';
  const ask=typeof window.askColKeys==='function'&&askColKeys().length;
  const right=[ask?i18t('reg_nl_foot_ask'):'', i18t('reg_nl_foot_std')].filter(Boolean).join(' \u00b7 ');
  return `<span id="reg-nl-showing" class="reg-nl-foot-l" role="status" aria-live="polite">${esc(left)}${more}</span><span class="reg-nl-foot-r">${esc(right)}</span>`;
}
function regCtFootHtml(cs){
  if(regNl()) return regNlFootHtml(cs);
  const list=cs||[], n=list.length;
  /* the board shape draws every card: its foot says so */
  const shown=regMode()==='board'?n:Math.min(n, regCurPage(list)*REG_PAGE);
  if(typeof window.lhFootHtml!=='function') return '';
  const countAll=(state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:state.contracts.length;
  const B=x=>`<b>${x}</b>`;
  /* ONE COUNT, SAID PLAINLY (Round 2, owner's yes 24 Oct 2026): the whole list says "31 contracts · 30 live"
     (live = the head's own reading); "(of N total)" only while the list is narrowed */
  const total=n!==Number(countAll)&&regNarrowed()?` <span class="lh-extra">${i18t('reg_of_total',{n:Number(countAll).toLocaleString(jxLocale())})}</span>`:'';
  const live=list.filter(c=>!c.archived&&c.status!=='Declined'&&!c.parentId).length;
  const say=esc(i18tn('reg_foot_n',n,{n:n.toLocaleString(jxLocale())}))+(live!==n&&!regNarrowed()?' · '+esc(i18tn('ngl_n_live',live,{n:live.toLocaleString(jxLocale())})):'');
  const fam=familyCounts(list);
  const famNote=fam.amendments?`<span class="lh-extra"> · ${i18tn('reg_agreements',fam.agreements,{n:B(fam.agreements.toLocaleString(jxLocale()))})} · ${i18t('reg_documents',{n:B(fam.documents.toLocaleString(jxLocale()))})}</span>`:'';
  return lhFootHtml(REG_CT_SEAT, shown, n, REG_PAGE, { id:'reg-showing', extra:total+famNote+(typeof window.askColLegendHtml==='function'?askColLegendHtml():''), say });
}
/* THE PLACE'S WIDTHS, BY KEY (Part 8): the seat's own shares — the place's
   full set, its narrow set, or the answers' shape while Ask a column stands
   — and a column the reader hid pays its share to the agreement, the
   column with the give, so the widths still sum to 100 */
const REG_COL_W_NL={ standing:12, stream:11, standards:19, expiry:12, value:11, owner:10 };
function regHomeColW(keys){
  const ask=keys.filter(k=>String(k).startsWith('ask:'));
  if(regNl()&&!regHomeNarrow()){
    const o=keys.map(k=>String(k).startsWith('ask:')?24:k==='counterparty'?0:(REG_COL_W_NL[k]||10));
    let rest=o.reduce((a,b)=>a+b,0); const i=keys.indexOf('counterparty');
    if(rest>78){ const f=78/rest; for(let j=0;j<o.length;j++) o[j]=Math.round(o[j]*f*100)/100; rest=o.reduce((a,b)=>a+b,0); }
    if(i>=0) o[i]=Math.round((100-rest)*100)/100;
    return o;
  }
  const narrow=regHomeNarrow(), wide=!narrow&&!ask.length&&regHomeWide();
  const shape=narrow?REG_COL_KEYS_HOME_NARROW:ask.length?['counterparty','standards','expiry','value'].concat(ask,['acts']):wide?REG_COL_KEYS_HOME_WIDE:REG_COL_KEYS_HOME;
  const w=narrow?REG_COL_W_HOME_NARROW:ask.length&&typeof window.askColWidths==='function'?askColWidths(ask.length):wide?REG_COL_W_HOME_WIDE:REG_COL_W_HOME;
  const at=k=>{ const i=shape.indexOf(k); return i>=0&&typeof w[i]==='number'?w[i]:0; };
  const out=keys.map(at);
  const spare=100-out.reduce((a,b)=>a+b,0);
  const i=keys.indexOf('counterparty'); if(i>=0) out[i]=Math.round((out[i]+spare)*100)/100;
  return out;
}
/* ---- THE CONTRACTS TABS ARE THE STAGES (owner-asked 9 Oct 2026: "contracts
   page needs to resemble the negotiations page so add tabs in contracts that
   navigate through the stages") ----
   The Negotiations seat's tab row, in the same dress, writing the one fact the
   Stage box used to write (R.stage) — so the Stage box is not drawn on this
   seat: one door per fact. Counts are the list with every OTHER filter
   applied, so a tab's number is the list behind it. A stage with nothing in it
   stays quiet, as the Negotiations tabs do. */
function regStageBase(){
  const R=regState(), keep=R.stage; R.stage='all';
  try{ return regFiltered(); } finally { R.stage=keep; }
}
const REG_STAGE_TABS=['all','Draft','Under Review','awaiting','Signed','Declined'];
/* ONE READING FOR THE TABS AND THE BOX: each stage's count is the list with
   every OTHER filter applied (a part of the book is never counted as the
   whole: regViewCount's own rule), and each stage says its own word in the
   reader's language (statusLabel, both books; "Awaiting counterparty" is the
   list's own). */
function regStageCounter(){
  let base=[]; try{ base=regStageBase(); }catch(_){ base=[]; }
  const shares=state.shareByContract||{};
  const whole=!(typeof API_MODE==='function'&&API_MODE()) || !(state.serverStats&&state.serverStats.total!=null)
    || Number(state.serverStats.total)<=state.contracts.length;
  const count=k=>!whole?0:k==='all'?base.length
    : k==='awaiting'?base.filter(c=>{ const s=shares[c.id]; return !!s&&(s.state==='sent'||s.state==='opened'); }).length
    : base.filter(c=>c.status===k).length;
  return { whole, count };
}
function regStageWord(k){
  const st=REG_STAGES.find(x=>x.k===k); if(k==='all') return i18t('reg_tab_all');
  if(k!=='awaiting'&&typeof statusLabel==='function'&&typeof STATUS_META!=='undefined'&&STATUS_META[k]) return statusLabel(k);
  return st?st.label:k;
}
function regStageTabsHtml(R){
  const { whole, count }=regStageCounter();
  return `<div class="reg-views reg-stage-tabs" role="tablist" aria-label="${esc(i18t('reg_chip_stage'))}">${REG_STAGE_TABS.map(k=>{
    const on=(R.stage||'all')===k, n=count(k);
    return `<button type="button" role="tab" class="reg-vtab${on?' on':''}${whole&&!n&&!on?' is-zero':''}" data-reg-stage="${esc(k)}" aria-selected="${on?'true':'false'}">${esc(regStageWord(k))}${n?`<span class="n">${n}</span>`:''}</button>`;
  }).join('')}</div>`;
}
/* ---- ON THE CONTRACTS PLACE THE STAGES ARE A BOX (owner, 16 Oct 2026:
   "take the status choices and put them in a dropdown as well. You will then
   have 4 dropdown filters above the card"; reverses 9 Oct's tab row there).
   The tabs' six, in their order and words, each with its count printed the
   way the Quick filters box prints one ("Drafting (91)"). A stage that holds
   nothing is not offered unless it is the one chosen — a filter's choice that
   cannot give results is not listed (owner, 10 Oct 2026). */
function regStageOptsHtml(R){
  const { whole, count }=regStageCounter(), cur=R.stage||'all';
  return REG_STAGE_TABS.filter(k=>k==='all'||k===cur||!whole||count(k)>0).map(k=>{
    const n=k==='all'?0:count(k);
    return `<option value="${esc(k)}"${cur===k?' selected':''}>${esc(regStageWord(k)+(n?` (${n})`:''))}</option>`;
  }).join('');
}
/* ---- THE QUICK FILTERS ARE A BOX NOW (owner's pick, 9 Oct 2026) ----
   The stage tabs took the tab row, so the shortcuts and the reader's saved
   views became one labelled box on the bar — SAP's own variant box: the
   shortcuts, then "Saved views", then the two acts (save the bar as a view;
   forget the one in force). The fact is still R.view; a saved view still
   lights when the bar matches it. On the Contracts place the views are the
   list head's tabs (Part 8, regCtViews); this box stays on the full table
   renderRegister draws where Home is not. */
function regViewOptsHtml(R, o={}){
  const cur=(()=>{ const m=regSavedViews().find(v=>regSavedMatches(v,R)); return m?('saved:'+m.name):(R.view||''); })();
  const opt=(v,l)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l)}</option>`;
  const cnt=k=>{ const n=regViewCount(k); return n?` (${n})`:''; };
  const saved=regSavedViews();
  const lit=saved.find(v=>regSavedMatches(v,R));
  /* on the Contracts place the archive is its own button (round 13) */
  return opt('',i18t('reg_tab_all'))+REG_VIEWS.filter(v=>!(o.home&&v.k==='archived')).map(v=>opt(v.k,v.label+cnt(v.k))).join('')
    +(saved.length?`<optgroup label="${esc(i18t('reg_qf_saved'))}">${saved.map(v=>opt('saved:'+v.name,v.name)).join('')}</optgroup>`:'')
    +`<optgroup label="${esc(i18t('reg_qf_acts'))}">${opt('act:save',i18t('reg_qf_save'))}${lit?opt('act:forget:'+lit.name,i18t('reg_qf_forget',{name:lit.name})):''}</optgroup>`;
}
/* regViewTabsHtml IS RETIRED (Part 8, 21 Oct 2026): built 20 Sep, without a
   caller since 9 Oct; the views are the list head's tab row on the Contracts
   place now (regCtViews over the one tab builder, insViewTabsHtml, where a
   view with nothing in it is left out rather than drawn quiet). */
/* The facts line under the page name: the whole book's count and what is on
   paper, converted through fxHome with what has no rate LEFT OUT and said.
   Money only where the reader may see it. Contracts seat only — the
   Negotiations page has its own head. */
function regHeadFactsHtml(){
  /* the new look's folder list says its own folder: how many, the money on paper, how many signed (as drawn) */
  { const R0=regState(); if(typeof window.newLookOn==='function'&&newLookOn()&&R0.view!=='archived'&&typeof regFolderRead==='function'){
    const inF=R0.type&&R0.type!=='all';
    const r=regFolderRead(state.contracts.filter(c=>c&&!c.archived&&c.status!=='Declined'&&!c.parentId&&(!inF||c.folder===R0.type)&&!c._codeNamed));
    return [String(r.n), r.val?i18t('ctf_on_paper',{ v:fmtMoneyShort(r.val) }):'', r.signed?i18t('ctf_n_signed',{ n:r.signed }):''].filter(Boolean).map(esc).join(' · '); } }
  const book=state.contracts.filter(c=>!c.archived&&c.status!=='Declined'&&!c.parentId);
  const n=(state.serverStats&&state.serverStats.total!=null&&Number(state.serverStats.total)>state.contracts.length)
    ? Number(state.serverStats.total) : book.length;
  /* "29 LIVE", NOT "29 AGREEMENTS" (26 Sep 2026, the list options' floor).
     The head said agreements while the All tab under it said 30, and both
     were right about different things with nothing saying which: this counts
     the live book (no declined, no archived, an amendment counted with its
     agreement) and All counts every row the list holds. The word now says
     what is counted — the Negotiations head's own word for it. */
  const parts=[i18tn('ngl_n_live',n,{n:n.toLocaleString(jxLocale())})];
  if(typeof canViewValues!=='function'||canViewValues()){
    const v=regAggregate(book);
    const miss=(window.fxMissing?fxMissing(book):[]);
    parts.push(i18t('reg_on_paper',{v:fmtMoneyShort(v)}));
    if(miss&&miss.length) parts.push(i18t('reg_fx_left_out',{n:miss.length}));
  }
  return parts.map(esc).join(' · ');
}
function regPaintHeadFacts(){
  const el=document.getElementById('reg-head-facts'); if(!el) return;
  el.innerHTML=regScope()==='negotiations'?'':regHeadFactsHtml();
}
/* THE VIEW TABS' COUNTS, REPAINTED IN PLACE (26 Sep 2026, the overnight
   clean-up). A delete repaints only the body so the reader keeps their page —
   and left "All 30" over a list of 29 (measured). The tabs are wired where the
   page is built, so their buttons stay and only the count inside each moves;
   the count is the press's own reading (regViewCount), as when it was drawn. */
function regStageTabsWire(){
  document.querySelectorAll('button[data-reg-stage]').forEach(b=>{
    if(b.dataset.wired) return; b.dataset.wired='1';
    b.addEventListener('click',()=>{ const R=regState(); R.stage=b.getAttribute('data-reg-stage')||'all'; R.page=1; regRepaint(); });
  });
}
/* The two acts on saved views, shared by the box and the retired tabs. */
async function regSaveViewAsk(){
  const name=window.promptDialog?await promptDialog({title:i18t('reg_save_view'),label:i18t('reg_save_view_label'),help:i18t('reg_save_view_msg'),placeholder:i18t('reg_save_view_ph'),confirmLabel:i18t('reg_save_view')}):prompt(i18t('reg_save_view_ask'));
  if(name==null||!String(name).trim()) return false;
  if(regSaveView(name)){ if(window.toast) toast(i18t('reg_view_saved',{name:String(name).trim()}),'ok'); return true; }
  if(window.toast) toast(i18t('reg_view_not_saved'),'warn');
  return false;
}
/* ---- FORGET IS DONE AT ONCE, WITH UNDO (SAP pop-ups, owner's go 10 Oct
   2026) ----
   SAP asks "are you sure?" only before what cannot be undone. A saved view is
   a reader's own shortcut in this browser, so forgetting it asked a question
   it did not need: it goes at once, and the toast carries Undo, which puts the
   view back exactly where it stood in the list. */
async function regForgetViewAsk(name){
  const before=regSavedViews();
  if(!before.some(v=>v.name===name)) return false;
  regForgetView(name);
  if(window.toast) toast(i18t('reg_view_forgotten',{name}),'ok',{ action:{ label:i18t('act_undo'), onClick:()=>{
    try{ localStorage.setItem(REG_SAVED_KEY, JSON.stringify(before)); }catch(_){}
    if(typeof regRepaint==='function') regRepaint();
  } } });
  return true;
}
function regPaintViewCounts(){
  /* ON THE CONTRACTS PLACE THE TABS ARE THE LIST HEAD'S (Part 8): its own
     recount redraws the tab row and the chips — a tab that rose above nothing
     is drawn again, one that fell to nothing is left out — the caret kept */
  if(regHome()&&regScope()!=='negotiations'&&typeof window.lhHeadSync==='function'&&lhHeadSync(REG_CT_SEAT)) return;
  const R=regState();
  /* the place's Stage box: its options' counts, and the face reads the chosen one */
  const ss=regHome()&&regScope()!=='negotiations'?document.getElementById('reg-stage-sel'):null;
  if(ss){ const html=regStageOptsHtml(R); if(ss.innerHTML!==html){ ss.innerHTML=html; ss.value=R.stage||'all';
    const lab=ss.closest('.reg-f'), txt=ss.selectedOptions&&ss.selectedOptions[0]?ss.selectedOptions[0].textContent:'';
    if(lab&&txt){ const v=lab.querySelector('.reg-f-v'); if(v) v.textContent=txt; const b=lab.querySelector('.reg-f-l b'); if(b) b.textContent=txt; } } }
  const st=document.querySelector('.reg-stage-tabs');
  if(st){ const w=document.createElement('div'); w.innerHTML=regStageTabsHtml(R); const nu=w.firstElementChild;
    if(nu&&nu.innerHTML!==st.innerHTML){ st.replaceWith(nu); regStageTabsWire(); } }
  document.querySelectorAll('.reg-views button[data-reg-view]').forEach(b=>{
    const k=b.getAttribute('data-reg-view')||'';
    const n=regViewCount(k), on=(R.view||'')===k;
    let span=b.querySelector('.n');
    if(n==null||n===0){ if(span) span.remove(); }
    else { if(!span){ span=document.createElement('span'); span.className='n'; b.appendChild(span); } span.textContent=String(n); }
    b.classList.toggle('is-zero', n===0&&!on);
  });
}
/* Whose move, for the Contracts row — null where no negotiation has started.
   READING MUST NOT WRITE: negoMoveSay runs negWhoseMove, which is safe over
   c.changes, but this asks the raw record first so a page of a hundred
   contracts never initialises one. */
function regMoveWord(c){
  const started=!!(c&&c.negotiation&&Array.isArray(c.changes));
  if(!started) return null;
  try{ return negoMoveSay(c); }catch(_){ return null; }
}
function regOwnerCell(c, o){
  const name=(window.contractOwnerName&&contractOwnerName(c))||'';
  if(!name) return '<span class="reg-dash">—</span>';
  /* the Contracts place on Home writes the name out (its drawing's Owner
     column); the full table keeps the initials, the name on the hover */
  if(o&&o.name) return `<span class="reg-own-name" title="${esc(name)}">${esc(name)}</span>`;
  const ini=name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return `<span class="reg-own" title="${esc(name)}">${esc(ini)}</span>`;
}
/* A SEGMENTED CONTROL, one builder for the two the bar draws (Table · Board,
   and the three row densities). Every option is a real button carrying the
   value; the live one is aria-pressed. */
function regSegHtml(attr, opts, live, title){
  return `<span class="reg-seg" role="group" ${title?`title="${esc(title)}"`:''}>${opts.map(([k,l])=>
    `<button type="button" ${attr}="${k}" aria-pressed="${live===k?'true':'false'}" class="${live===k?'on':''}">${esc(l)}</button>`).join('')}</span>`;
}
function regFooterText(cs, opts){
  const board=!!(opts&&opts.all);
  const n=board?1:regPageCount(cs), p=board?1:regCurPage(cs);
  const size=board?Math.max(1,cs.length):regPageSize();
  const start=cs.length?(p-1)*size+1:0, end=Math.min(cs.length,p*size);
  /* WHAT THE FOOTER IS COUNTING AGAINST. On Contracts it is the whole book —
     "of 145". On Negotiations that number would be a lie about a page that
     never shows anything but live negotiations, so the total is the live book:
     the same list the heading counts. */
  const countAll=regScope()==='negotiations'
    ? ((typeof window.negoLiveList==='function')?negoLiveList().length:cs.length)
    : ((state.serverStats&&state.serverStats.total!=null)?state.serverStats.total:state.contracts.length);
  const totalNote=cs.length!==Number(countAll)?` <span style="color:var(--color-neutral-500)">${i18t('reg_of_total',{n:Number(countAll).toLocaleString(jxLocale())})}</span>`:'';
  // agreements vs documents — a master plus its amendments is ONE agreement
  const fam=familyCounts(cs);
  const B=x=>`<b style="color:var(--color-text)">${x}</b>`;
  const famNote=fam.amendments?` · ${i18tn('reg_agreements',fam.agreements,{n:B(fam.agreements.toLocaleString(jxLocale()))})} · ${i18t('reg_documents',{n:B(fam.documents.toLocaleString(jxLocale()))})}`:'';
  /* Neither the amendment fold nor the page counter belongs on a list that
     never pages and groups by something else entirely. */
  const neg=regScope()==='negotiations';
  /* THE AMENDMENT FOLD LEFT THE FOOT FOR THE DISPLAY MENU (26 Sep 2026, the
     Inspector drawing): it changes how the list is drawn, which is what that
     menu holds, and the foot is the count and the pager. Same flag (R.flat),
     same repaint; `reg_group_amendments` and `reg_show_flat` are STALE as
     visible text, inert in both books. */
  const flatBtn='';
  const pageNote=(neg||board)?'':` · ${i18t('reg_page_of',{p,n})}`;
  /* NO MONEY TOTAL IN THE FOOT (owner-approved SAP benchmark, 9 Oct 2026): the
     page head already carries the book's value (regHeadFactsHtml), and a second
     total at the foot said the same fact twice. `reg_aggregate` is inert in both
     books; regAggregate stays, the head still reads it. */
  return `${i18t('reg_showing',{start:B(start.toLocaleString(jxLocale())),end:B(end.toLocaleString(jxLocale())),n:B(cs.length.toLocaleString(jxLocale()))})}${totalNote}${neg?'':famNote}${pageNote}${flatBtn}`;
}
// pinned-footer pager wiring — jump page + scroll the table body back to top
function wireRegPager(){
  document.querySelectorAll('#reg-pager [data-reg-page]').forEach(b=>b.addEventListener('click',()=>{
    const R=regState(); const cs=regFiltered(); const to=Number(b.getAttribute('data-reg-page'));
    R.page=Math.min(Math.max(1,to), regPageCount(cs)); renderRegisterBody();
    const sc=document.getElementById('reg-scroll'); if(sc) sc.scrollTop=0;
  }));
}
/* ---- ONE READING, ASKED ONE CUT AT A TIME (Part 8, the list head's counts;
   the critic's 4.7: "count in ONE pass per filter, never one full pass per
   choice") ----
   regFiltered is the one reading of the rows, and every number the head
   prints is that reading's own: a tab's number, and each choice "+ Filter"
   offers. To count without walking the book once per choice it can be asked
   in two narrower ways, the cuts' own code unchanged:
     { skip:k }       every cut but filter k's — the BASE a filter's choices
                      are counted over (one pass per filter)
     { only:k, src }  filter k's own cut alone, over that base (each choice)
     { flat:true }    no order and no families — a count needs neither
   `use(k)` is the one gate; the scope, a named set, the words, the working
   files and the streams the reader may open belong to the base. */
function regFiltered(o){
  const R=regState();
  const onlyK=o&&o.only, skipK=o&&o.skip;
  const use=k=>onlyK?k===onlyK:k!==skipK;
  let cs=(o&&Array.isArray(o.src))?o.src.slice():state.contracts.slice();
  /* ---- THE PAGE'S OWN NARROWING, ABOVE EVERY QUESTION AND ABOVE `only` ----
     See regSetScope. Nothing below can widen this and no control offers to.
     A stage without the negotiation module answers with NOTHING rather than
     with everything: a page that says "Live negotiations" and lists all 145
     contracts is worse than a page that lists none. */
  if(!onlyK&&regScope()==='negotiations')
    cs=(typeof window.negoIsLive==='function') ? cs.filter(c=>negoIsLive(c)) : [];
  /* Then, because it is not a question about a contract but a set somebody
     else chose — everything below narrows WITHIN it. */
  if(!onlyK&&R.only&&Array.isArray(R.only.ids)){ const keep=new Set(R.only.ids); cs=cs.filter(c=>keep.has(c.id)); }
  /* ---- THE ARCHIVE SHELF (WO-5): filed away, not deleted ----
     Archived contracts leave every default list and come back under exactly
     ONE view, where they are all that shows. It lives with the views because
     "show me the shelf" is a way of looking, not a stage — an archived
     Signed contract is still Signed. Search (FTS and the palette) still
     finds them, which is the difference between filing and deleting. */
  if(use('view')){
  if(R.view==='archived') cs=cs.filter(c=>!!c.archived);
  else cs=cs.filter(c=>!c.archived);
  }
  // 'awaiting' is a virtual stage = contracts out with a counterparty and not yet
  // signed (a live share in 'sent' or 'opened'), matching the dashboard KPI. It
  // reads the dispatch state, not the status column. Real status pills fall
  // through to the exact-match filter.
  if(use('stage')){
  if(R.stage==='awaiting') cs=cs.filter(c=>{ const s=state.shareByContract&&state.shareByContract[c.id]; return !!s&&(s.state==='sent'||s.state==='opened'); });
  else if(R.stage!=='all') cs=cs.filter(c=>c.status===R.stage);
  }
  if(use('type')&&R.type!=='all') cs=cs.filter(c=>c.folder===R.type);
  if(use('renewal')&&R.renewal&&R.renewal!=='all') cs=cs.filter(c=>(c.metadata&&c.metadata.renewalType)===R.renewal);
  if(use('category')&&R.category&&R.category!=='all') cs=cs.filter(c=>regCatMatch(c,R.category));
  /* SIGNED IN A GIVEN YEAR (J-5.1). Asked of the ONE reading, so this list and
     the Signed column above it can never disagree about which year a contract
     belongs to. A contract with no signature is in no year and is narrowed out
     of every one of them, which is the honest answer rather than a bucket. */
  if(use('signed')){
  if(R.signed&&R.signed!=='all'){
    const y=regSignedYear(R.signed);
    cs=cs.filter(c=>{ const d=regSignedOn(c); return !!d && d.slice(0,4)===y; });
  }
  }
  /* HOW LONG THE PAYMENT TERMS RUN (owner-ruled 2 Sep 2026). Asked of the ONE
     reading, so this list and the payment terms tab can never sort a contract
     into two different bands; `none` is the contracts nobody has read the
     terms off, which is the actionable cut on this subject rather than an
     absence to be folded away. Read through a typeof guard, the ES-module
     rule: on a stage that does not carry js/payterms.js the filter narrows
     nothing rather than emptying the register. */
  if(use('payterms')&&R.payterms&&R.payterms!=='all'&&typeof payDays==='function'){
    cs=cs.filter(c=>{
      const dd=payDays(c);
      if(R.payterms==='none') return dd==null;
      return dd!=null && typeof payBucketOf==='function' && payBucketOf(dd)===R.payterms;
    });
  }
  /* WHETHER THE OTHER SIDE IS HOLDING THE PAPER THEY PROMISED (S8). Asked of
     `contractDocuments` and `obligationDocState`, the ONE reading — the same
     pair the contract Overview's own section draws — so a certificate cannot
     read "lapsed" on one screen and "in date" on the other. `none` is the
     contracts that require no document at all, which is the honest fourth
     answer rather than a fold. Behind a typeof guard, the ES-module rule: on a
     stage without js/obligations.js this narrows nothing rather than emptying
     the register. */
  /* ════ AND THE FILTER FILTERS (Young reported it 19 Sep 2026) ═══════════
     "The on hold filter has a bug." TWO FAULTS UNDER ONE REPORT, and this is
     the second: the list this function narrows is `cs`, and this block was
     written against a `rows` that exists nowhere in it. Every press threw a
     ReferenceError inside regFiltered, which is a READING — so nothing was
     narrowed and the page went on drawing the whole book.
     THE LINT SWEEP HAD IT ALL ALONG (`'rows' is not defined`, the only two
     errors in js/) and it was read as pre-existing noise. It is the one check
     that asks "is every name being called a name that exists", and it was
     right. Driving the control is what turned two warnings into a defect. */
  if(use('hold')&&R.hold&&R.hold!=='all'&&typeof contractOnHold==='function'){
    const want=R.hold==='on';
    cs=cs.filter(c=>contractOnHold(c)===want);
  }
  if(use('docs')&&R.docs&&R.docs!=='all'&&typeof contractDocuments==='function'){
    cs=cs.filter(c=>{
      const ds=contractDocuments(c)||[];
      if(R.docs==='none') return !ds.length;
      if(typeof obligationDocState!=='function') return false;
      return ds.some(o=>obligationDocState(o)===R.docs);
    });
  }
  // E3-T5 quick filters (presets over metadata/obligations; "Saved views"
  // until 9 Sep 2026 — the name promised a feature nothing here ever built)
  // family-aware: expiry views work on AGREEMENTS and on the term the latest
  // amendment actually set, not on whatever was typed on the master
  const expWithin=n=>c=>{ if(c.parentId||c.status!=='Signed') return false;   /* signed only (owner, 16 Oct 2026) */ const e=effectiveExpiry(c); return !!e&&daysUntil(e)>=0&&daysUntil(e)<=n; };
  if(use('view')){
  if(R.view==='expiring90') cs=cs.filter(expWithin(90));
  else if(R.view==='expiring60') cs=cs.filter(expWithin(60));
  else if(R.view==='expiring30') cs=cs.filter(expWithin(30));
  /* Executed contracts whose term has run out. They match none of the three
     buckets above — each is `days >= 0` — so before this there was no filter
     anywhere in the product that would list them. */
  else if(R.view==='expired') cs=cs.filter(c=>!c.parentId&&!!(window.contractExpired&&contractExpired(c)));
  /* A QUICK FILTER IS A WORKLIST — "auto-renewals I still have to decide about"
     — so a recorded answer takes the row off it (16 Sep 2026). renewalDecided
     is the ONE predicate; the register keeps no copy of the rule. */
  else if(R.view==='autosoon') cs=cs.filter(c=>{
    if(typeof renewalDecided==='function'&&renewalDecided(c)) return false;
    const dd=renewalDecisionDate(c); return (c.metadata&&c.metadata.renewalType==='auto-renew')&&dd&&daysUntil(dd)>=0&&daysUntil(dd)<=60; });
  else if(R.view==='overdueob') cs=cs.filter(c=>(c.obligations||[]).some(o=>obState(o)==='overdue'));
  else if(R.view==='nego') cs=cs.filter(c=>typeof window.negoIsLive==='function'&&negoIsLive(c));
  else if(R.view==='details') cs=cs.filter(c=>{ try{ return !!(window.detailsOf&&detailsOf(c).left); }catch(_){ return false; } });
  /* NEEDS YOU (Part 8): the contracts Home's Needs you list names — its own
     reading (hbNeedsList, kept for the one task), never a second tally */
  else if(R.view==='needs'){ const ids=regNeedsIds(); cs=cs.filter(c=>ids.has(String(c.id))); }
  /* DRAFTS (Part 8): the Drafting stage, as a view */
  else if(R.view==='drafts') cs=cs.filter(c=>c.status==='Draft');
  else if(R.view==='signed') cs=cs.filter(c=>c.status==='Signed');
  }
  /* ---- THE TEXT FILTER, ON THE SEAT THAT HAS A BOX FOR IT ----
     (owner-reported 10 Sep 2026: *"the search feature is not working."*
     MEASURED before it was touched: four rows, type "lease", four rows.)

     M-5 (Negotiations) and then N-3 (Contracts), 31 Aug 2026, retired the
     register's OWN search box — the owner asked for both, because the shell
     bar carries one directly above — and N-3 took this filter out with it,
     reasoning that "a page narrowed by a control nobody can see" is the worse
     fault. THAT REASONING IS RIGHT ABOUT THE BOX THAT WENT AND WRONG ABOUT THE
     ONE THAT REMAINS: the shell bar's box is on screen, it says "Search
     contracts, clauses, counterparties…", it writes regState().query and then
     opens Contracts — and nothing had read that field since.

     SO THE RULE IS UNCHANGED AND ONLY ITS SUBJECT MOVED: a query narrows where
     a box says what it is set to, and nowhere else. On Contracts that box is
     the shell bar's, and clearing it widens the list again; on Negotiations it
     is the list head's own box on a computer (Part 8, 21 Oct 2026), and the
     phone, which draws none, is never narrowed by it — regQueryOf, which
     regNarrowed asks the same way, so no head can call this page filtered
     when it is not. */
  const q=regQueryOf(R).trim().toLowerCase();
  /* ---- A SEARCH MATCHES ANY PARTY'S NAME (22 Sep 2026) ----
     Without this a three-party contract disappears from a search for the
     company that GUARANTEES it, which is exactly the company a reader looking
     for an exposure searches by. `partiesMatch` derives the pair where nothing
     is stored, so on every contract on file it answers what the counterparty
     test answered and the result set does not move. */
  if(!onlyK&&q) cs=cs.filter(c=>((c.name||'')+' '+(c.counterparty||'')+' '+(c.id||'')+' '+(c.contractNo||'')).toLowerCase().includes(q)
    || (typeof partiesMatch==='function' && partiesMatch(c,q)));
  /* ---- A WORKING FILE LIVES ON NEGOTIATIONS (26 Sep 2026) ----
     Until its signed copy is filed it is not a contract yet, so it is off this
     list — except where a person SEARCHED for it, or another page sent a named
     set that holds it: then it is found, and its row says where it lives
     (CELL.stage). The Negotiations page lists it from the day it is opened. */
  if(!onlyK && regScope()!=='negotiations' && !q && !(R.only&&Array.isArray(R.only.ids)) && window.contractIsWorkingFile)
    cs=cs.filter(c=>!contractIsWorkingFile(c));
  // Per-member folder/stream access: a restricted member only ever sees the
  // streams an admin granted them (admins are always unrestricted).
  const acc=(typeof userFolderAccess==='function')?userFolderAccess():'*';
  if(!onlyK&&acc!=='*') cs=cs.filter(c=>folderAccessAllows(acc,c.folder));
  /* a count needs neither the order nor the families (regCutCount) */
  if(o&&o.flat) return cs;
  const sortKey=(R.sort==='value' && typeof canViewValues==='function' && !canViewValues()) ? 'updated' : R.sort;
  const cmp=REG_CMP[sortKey]||(String(sortKey||'').startsWith('ask:')&&typeof window.askColCmp==='function'?askColCmp(sortKey.slice(4)):null)||REG_CMP.updated;
  const dir=(R.dir===1||R.dir===-1)?R.dir:(REG_SORT_DEFDIR[sortKey]||-1);
  cs.sort((a,b)=>{ const r=dir*cmp(a,b); return r!==0?r:((Date.parse(b.lastAction)||0)-(Date.parse(a.lastAction)||0)); });
  /* GROUPED BY WHOSE MOVE IT IS, not by family. An amendment carries its own
     negotiation, so nesting one under its parent here would put two separate
     arguments on one row; and the group order is the whole design of this page.
     The register's sort survives — it decides the order INSIDE each band. */
  if(regScope()==='negotiations'){
    const g=negoGroupByMove(cs);
    /* THE WHOSE-MOVE TAB (SAP benchmark, 9 Oct 2026) keeps one band. */
    return R.band ? g.filter(c=>c._ngBand===R.band) : g;
  }
  // FAMILY GROUPING (default). Amendments sit under their parent instead of
  // floating as separate rows — a master agreement plus six addenda reads as
  // one agreement with six documents, which is what it is. `flat` shows every
  // document as its own row, which is what an auditor wants.
  return R.flat ? cs : regGroupFamilies(cs);
}
/* Order the filtered set so each child follows its parent, and tag the rows the
   renderer needs to indent / collapse. Children whose parent is not in the
   filtered set stay where they are (they are still real results). */
function regGroupFamilies(cs){
  const R=regState();
  const inSet=new Set(cs.map(c=>c.id));
  const kidsBy=new Map();
  for(const c of cs){ if(c.parentId&&inSet.has(c.parentId)){
    if(!kidsBy.has(c.parentId)) kidsBy.set(c.parentId,[]); kidsBy.get(c.parentId).push(c); } }
  const out=[];
  for(const c of cs){
    if(c.parentId&&inSet.has(c.parentId)) continue;      // emitted under its parent
    c._famKids=(kidsBy.get(c.id)||[]).length;
    c._famChild=false;
    out.push(c);
    const expanded = c._famKids && !(R.collapsed && R.collapsed[c.id]);
    if(expanded) for(const k of kidsBy.get(c.id)){ k._famChild=true; k._famKids=0; out.push(k); }
  }
  return out;
}
function regOwnerInitials(){ const u=currentUser(); const n=(u&&u.name)||FIRST_PARTY||'HaTi'; return n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
// Row ⋯ actions — label + which real handler runs. All close the menu first.
/* ---- A SYMBOL PER ROW, AND THE SYMBOLS CARRY THE COLOUR ----
   This was six lines of plain text at one weight, so opening a contract,
   exporting it and deleting it all looked the same and the only way to find
   the row you wanted was to read all six. Each verb has a mark now, coloured
   with the accent — the label stays black, so the colour is a way in rather
   than six shouting lines. The two destructive rows keep ruby on BOTH the mark
   and the label: they are the one distinction a menu must never blur. */
const REG_ROW_ACTIONS=[
  {k:'open',   ic:'folderOpen',get label(){ return i18t('reg_open_workspace'); }},
  {k:'share',  ic:'share',     get label(){ return i18t('reg_share_with_cp'); }},
  {k:'scan',   ic:'sparkle',   get label(){ return i18t('reg_run_scan'); }},
  {k:'pdf',    ic:'printer',   get label(){ return i18t('reg_export_pdf'); }},
  /* ════ END OR PAUSE — ONE DOOR (owner picked "One question" by name, 15 Oct
     2026) ════ Decline, Archive and Hold were three rows here and a fourth
     and fifth on the paper's ⋯; nothing said how they differ beyond a hover.
     REVERSES the 19 Sep reasoning (a chooser puts Hold one press further
     away): the door asks "What is happening with this deal?" and each answer
     is the existing act (endOrPauseOpen, js/core.js). Drawn where at least
     one answer can be given; the way back keeps its own row. */
  {k:'end',    ic:'ban',       get label(){ return i18t('end_door'); },
   get says(){ return i18t('end_door_says'); },
   when:c=>!!(window.endOrPauseOffered&&endOrPauseOffered(c))},
  /* AND BACK AGAIN (B14): the owner or an admin, with a reason. */
  {k:'reopen', ic:'history',   get label(){ return i18t('end_reopen'); },
   get says(){ return i18t('end_reopen_says'); },
   when:c=>!!(window.contractMayReopen&&contractMayReopen(c))},
  {k:'restore', ic:'history', get label(){ return i18t('reg_restore'); }, when:c=>!!c.archived&&(typeof canEdit!=='function'||canEdit())},
  {k:'release', ic:'history', get label(){ return i18t('hd_release'); },
   when:c=>!!contractOnHold(c)&&(typeof mayHoldContract!=='function'||mayHoldContract())},
  // permanent delete — only offered while a contract is still a draft or in review
  {k:'delete', ic:'trash',     get label(){ return i18t('reg_delete_permanently'); }, ruby:true, when:c=>(window.contractDeletable?contractDeletable(c):(c.status==='Draft'||c.status==='Under Review'))},
];
/* Reopening asks its reason the same way (B14). */
function regReopenAsk(c, after){
  if(!c || !window.contractReopen || !window.promptDialog) return;
  Promise.resolve(promptDialog({ title:i18t('end_reopen_q'), message:i18t('end_reopen_says'),
    label:i18t('end_reopen_why'), placeholder:i18t('end_reopen_ph'), confirmLabel:i18t('end_reopen'), multiline:true }))
    .then(why=>{ if(why==null) return;
      contractReopen(c, why).then(ok=>{ if(ok) (after||regRepaint)(); }); });
}
/* ---- THE ROW'S MENU, AS MARKUP — ONE BUILDER, TWO HOMES (26 Sep 2026) ----
   The full table's ⋯ and the list inspector's panel draw the same rows, so a
   verb added tomorrow reaches both and neither can drift. THE SENTENCE RIDES
   THE HOVER, which is this product's own answer for a fact about the
   machinery: End or pause and Reopen carry one line each saying what they
   do. A `when` that asks a reading the stage does not carry answers
   "not offered" rather than throwing through the page. */
/* `skip` leaves verbs out: the panel's ⋯ drops Workspace, which its doors
   row already carries (one door per act, owner 12 Oct 2026). */
function regRowActsHtml(c, skip){
  return REG_ROW_ACTIONS.filter(a=>{ if(skip&&skip.includes(a.k)) return false; try{ return !a.when||a.when(c); }catch(_){ return false; } }).map(a=>`<button data-act="${a.k}" data-id="${c.id}"${a.says?` title="${esc(a.says)}"`:''} class="reg-act${a.ruby?' danger':''}" style="display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;font:inherit;font-size:var(--t-meta);text-align:left;padding:6px 9px;border-radius:var(--radius);cursor:pointer;color:${a.ruby?'var(--st-ruby-fg)':'inherit'}">${window.icon?icon(a.ic,'w-3.5 h-3.5'):''}${a.label}</button>`).join('');
}
/* ---- WHAT EACH ROW-MENU VERB PRESSES — one dispatcher, two homes ----
   Lifted out of the table's wiring so the panel's ⋯ presses exactly what the
   row's ⋯ presses. Nothing here is new; every branch is the one the row menu
   always ran. */
function regRunRowAct(act, id){
  const c=getContract(id); if(!c) return;
  /* "Workspace" is the panel's third door's word, and its landing (step 2,
     14 Oct 2026): Home, never the room, where Home has its paper */
  if(act==='open'){ if(!(window.roomHomeLand&&roomHomeLand(id))) openWorkspace(id); }
  else if(act==='share') openShareModal(c);
  else if(act==='scan') runScanFor(c);
  else if(act==='restore'){
    if(window.contractSetArchived) contractSetArchived(c,false).then(ok=>{ if(ok) regRepaint(); });
  }
  /* END OR PAUSE — the one door (15 Oct 2026): decline, archive or hold */
  else if(act==='end'){ if(window.endOrPauseOpen) endOrPauseOpen(c).then(ok=>{ if(ok) regRepaint(); }); }
  else if(act==='reopen') regReopenAsk(c);
  /* Release needs no reason; putting a hold on is an answer in End or pause */
  else if(act==='release'){ if(window.contractSetHold) contractSetHold(c,false,'').then(ok=>{ if(ok) regRepaint(); }); }
  else if(act==='delete') deleteContract(id).then(ok=>{ if(ok){
    /* The reader was three pages down when they pressed Delete; the row goes,
       the place stays. renderRegister() rebuilds the whole view and hard-resets
       R.page to 1, and the table scrolls inside #reg-scroll (not the outer
       #content-scroll) — so repaint only the body, which keeps the current page
       (clamping just if this page emptied), and put #reg-scroll back where it was. */
    const sc=document.getElementById('reg-scroll'); const top=sc?sc.scrollTop:0;
    renderRegisterBody();
    /* …and the two counts above the list, which a body repaint does not
       reach: the head's "N live" and the view tabs (see regPaintViewCounts). */
    regPaintHeadFacts(); regPaintViewCounts();
    const sc2=document.getElementById('reg-scroll');
    if(sc2){ sc2.scrollTop=top;
      if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ sc2.scrollTop=top; }); }
  } });
  /* Export PDF is finished from the paper's ⋯ (its PDF row), so the press
     lands on Home's paper — the room it once opened retired at step 8, and
     the strip it would land on carries no export */
  else if(!(act==='pdf'&&window.pdOpenOnHome&&pdOpenOnHome(id,'copilot'))) openWorkspace(id);
}
/* ---- WHAT OPENING A ROW MEANS — one answer for the row press, Enter, a
   double-click and the panel's own button ----
   On the Negotiations page a row opens the NEGOTIATION; everywhere else the
   CONTRACT. A row that cannot open the negotiation (sealed or archived paper,
   per negoMayStart) opens the contract instead — the row landing somewhere
   true rather than pressing a wall. */
function regOpenRow(id, negoRow){
  const cRow=(typeof getContract==='function')?getContract(id):null;
  const mayNego=!cRow||!window.negoMayStart||negoMayStart(cRow).ok;
  if(negoRow&&mayNego&&window.openRedlineWorkbench) openRedlineWorkbench(id);
  else regOpenContract(id);
}
/* ---- OPEN CONTRACT LANDS ON HOME'S DOCUMENT, ON COPILOT (owner, 11 Oct
   2026: "when you ... click open contract, it will then take you to the home
   page under document ... you should land in that tab") ----
   The one door the list's Open contract, Enter and the second press share.
   pdOpenOnHome is the product's own way onto a contract on Home; below 768px
   it opens the contract's own page, which the phone draws instead. */
function regOpenContract(id){
  if(typeof codeNameStop==='function'&&codeNameStop(getContract(id))) return;
  /* FROM "DETAILS TO FILL" A ROW OPENS WHERE DETAILS ARE FILLED IN: beside
     the paper, Jambo's panel on Fill in (the one-page Home plan, stage 2;
     owner, 14 Oct 2026; was the room's Details tab, 12 Oct). */
  if(regScope()!=='negotiations'&&regState().view==='details'&&typeof window.pdFillOpen==='function'){
    const c=(typeof getContract==='function')?getContract(id):null;
    if(c&&pdFillOpen(id)) return;
  }
  if(regScope()!=='negotiations'&&regState().view==='details'&&typeof openWorkspace==='function'){
    const c=(typeof getContract==='function')?getContract(id):null;
    if(c){ openWorkspace(id); if(typeof roomGoTab==='function') try{ roomGoTab(getContract(id)||c,'details'); }catch(_){} return; }
  }
  /* the reader's own "A contract opens on" (pdOpenTabOf) */
  if(typeof pdOpenOnHome==='function'&&pdOpenOnHome(id,'open')) return;
  selectContract(id);
}
/* THE ROW'S PRIMARY VERB.
   Not one generic "Open" down the column — each row offers the thing that
   stage actually calls for: a contract in review is opened to be argued over,
   an executed one is opened to be read. The destination is the engine's own
   workspace either way, so nothing here routes anywhere the ⋯ menu could not
   — which is also why the labels must not name surfaces ("Vault", "Doc Lab")
   that the platform no longer has. */
/* THE TITLE COLUMN IS THE TITLE, not the party.
   Everywhere else in HaTi a contract is headed by the OTHER SIDE — cPrimary
   returns the counterparty and falls back to the name (see js/core.js): on a
   card or a board tile, "Naivas Ltd" is what a reader is scanning for. The
   reference's register is built the other way, with Contract Title and
   Counterparty as two separate columns, so reusing cPrimary here printed the
   same company twice on every row. cPrimary is left alone — the Queue board,
   the calendar and the cards are all still party-led and correct. */
/* THE AGREEMENT LEADS ON THE CONTRACTS PLACE (Round 2, owner's yes 24 Oct 2026): its own name, without a
   trailing " — <the other side>" (bsShortName's reading); the party and the number go under it */
function regShortTitle(c){
  try { if (typeof window.bsShortName === 'function'){ const n = String(window.bsShortName(c) || '').trim(); if (n) return n; } } catch (_){}
  return String((c && c.name && c.name.trim()) || cParty(c) || i18t('reg_untitled'));
}
function regTitleOf(c){
  return esc((c && c.name && c.name.trim()) || cParty(c) || i18t('reg_untitled'));
}
function regPrimaryAction(c){
  const s = String((c && c.status) || 'Draft');
  if (s === 'Signed')       return i18t('reg_act_view');
  if (s === 'Under Review') return i18t('reg_act_review');
  if (s === 'Declined')     return i18t('reg_act_record');
  return i18t('reg_act_draft');
}
/* ---- WHOSE MOVE, AS ONE WORD ----
   The same readings the list has always drawn, in the same three classes, so
   the colours and the grey-scale fallback are one definition. Built here
   because BOTH shells want it: the desktop's last column and the phone's card.

   IT IS ONE WORD SINCE 25 Aug 2026 (owner-asked, off a screenshot with this
   column ringed: "change the highlighted area to simply Mine, theirs, etc.")
   — and that REVERSES the note that stood here, which argued the counterparty
   should be NAMED because "With Saw Sawa Ltd" answers what a reader scanning
   the page is deciding. TWO THINGS WERE WRONG WITH IT. The name is already on
   the row, two columns to the left, so the cell was repeating a cell you can
   see; and at the width this column gets it was being CUT — the screenshot
   reads "With Saw Sa…", "With Juno Li…", "1 change not…" — so the detail it
   was defending was not on screen anyway.

   NOTHING IS LOST ON THE DESKTOP: the sentence each cell used to print is the
   cell's own hover, which is the treatment the status chip beside it already
   takes ("a table cell has no room for a sentence"). THE PHONE HAS NO HOVER
   and therefore does drop the count — said out loud rather than absorbed; its
   card already prints the counterparty on a line of its own, so only the
   number goes.

   THE THIRD STATE IS ONE WORD TOO, and that was not the first answer. It was
   left as "Nothing outstanding" on the reasoning that it is not an answer to
   *whose* but the absence of one — and photographing the column killed that:
   at the width this column gets it drew "Nothing outst…", so the one cell
   still being CUT was the one exempted from the fix. "Neither" is the honest
   one-word answer to "whose move" when nobody owes one, and the sentence it
   replaced is its hover like the other two. */
/* ---- WHOSE MOVE, IN WORDS — ONE READING, TWO READERS (9 Sep 2026) ----
   This was the pill's own five sentences, written out inside the markup
   builder. The negotiation memo has to say the same thing in prose, and a
   second copy of five sentences is how the row on the Negotiations page and
   the memo about that same contract come to disagree about whose turn it is.

   So the SENTENCE is decided here and the pill merely dresses it — the
   codebase's own rule: where two surfaces must answer alike, the question
   becomes one function and the drawing stays each surface's own.

   Returns {k, why, n, word, say}: `word` is the one word the table cell
   prints, `say` the sentence that rides its hover and that the memo prints in
   full. `say === word` on the clear state, which is what tells the pill it has
   no title worth drawing. */
function negoMoveSay(c){
  const m=(typeof window.negWhoseMove==='function')?window.negWhoseMove(c):{k:'clear',n:0};
  const MINE=i18t('ngl_move_mine');
  const out=(k,word,say)=>({ k, why:m.why||null, n:m.n||0, word, say });
  /* ---- WAITING ON US, BUT NOT TO DECIDE ANYTHING (13 Aug 2026) ----
     negWhoseMove bands an agreement whose counterparty holds no live copy
     under "Waiting on you", because sending them one is the move. Counting
     decisions here would be wrong twice over — there are none to make, and
     the number would send the reader to a column with nothing in it. The
     sentence says what the move IS instead. See negWhoseMove for the rule. */
  if(m.why==='nocopy') return out('you',MINE,i18t('ng_no_live_copy'));
  /* ---- AND THE SAME FOR WORK WE HAVE NOT SENT (14 Aug 2026) ----
     Same reasoning one step earlier: these are our own asks, still on our desk,
     so there is nothing for this reader to DECIDE and "N needs you" would send
     them to a column of their own drafting. See negWhoseMove. */
  if(m.why==='unsent') return out('you',MINE,i18tn('ng_not_sent_yet',m.n,{n:m.n}));
  /* our answers to their asks, decided and not yet sent back (8 Oct 2026) */
  if(m.why==='decided') return out('you',MINE,i18tn('ng_decided_not_sent',m.n,{n:m.n,who:c.counterparty||i18t('ng_door_them')}));
  if(m.k==='you') return out('you',MINE,i18tn('ng_needs_you',m.n,{n:m.n}));
  if(m.why==='handover') return out('them',i18t('ngl_move_theirs'),
    i18t('ho_move_say',{who:c.counterparty||i18t('ng_door_them'),wait:window.handoverWaitWords?handoverWaitWords(c):''}));
  if(m.k==='them') return out('them',i18t('ngl_move_theirs'),
    i18t('ng_door_with',{who:c.counterparty||i18t('ng_door_them')}));
  const none=i18t('ngl_move_none');
  return out('clear',none,i18t('ng_door_clear'));
}
function negoMovePillHtml(c){
  const m=negoMoveSay(c);
  /* One word, one class, and the sentence it replaced on the hover. A title
     identical to its own word is noise, so the clear state carries none. */
  const pill=(cls,word,full)=>`<span class="ngl-w ${cls}"${
    full&&full!==word?` title="${esc(full)}"`:''}>${esc(word)}</span>`;
  return pill('ngl-w-'+(m.k==='clear'?'clear':m.k), m.word, m.say);
}
/* ---- NO BAND BETWEEN THE ROWS (Part 8, the owner's pick "The Legora way",
   21 Oct 2026; Q2 answered "A — tabs only") ---- the list is ONE plain table:
   the whose-move tabs above it do the groups' job, each counted with the rows
   its press shows, and under All the rows waiting on us come first
   (negoGroupByMove's fixed order, the sort deciding the order inside each).
   This REVERSES 12 Aug's "the group order is the whole design of this page"
   and the full-width group headings it drew ("Waiting on our side 2" …);
   negoBandRowHtml and its rules are deleted, not stubbed. The groups' words
   ride the tabs' hovers (negoBandViews), and NEGO_BANDS stays the one list of
   them — the phone still heads its own sections with it. */
function regRowsHtml(cs){
  const R=regState();
  const neg=regScope()==='negotiations';
  if(!cs.length){
    /* ---- WHAT COUNTS AS NARROWED MUST BE WHAT ACTUALLY NARROWS ----
       Asked of regNarrowed, the ONE reading, rather than worked out again
       here. This copy had already drifted: it left out the Signed and payment
       filters, so an empty page they had narrowed offered no way back. */
    const filtered = regNarrowed(R);
    const line = filtered ? i18t('reg_none_match') : i18t('reg_none_yet');
    const sub  = filtered ? i18t('reg_widen') : i18t('reg_create_from_template');
    const btn  = filtered
      ? `<button id="reg-empty-clear" class="ui-btn">${i18t('reg_clear_all_filters')}</button>`
      /* The same act as the header's, so the same button — see pageActionHtml. */
      : `<button id="reg-empty-new" class="hm-primary">${
          icon('plus','w-3.5 h-3.5',2)} ${i18t('home_draft_new')}</button>`;
    /* THIS SHAPE IS NOW THE PRODUCT'S — it was the one screen that had a
       designed empty state, and emptyStateHtml is it, extracted so the other
       six can be it too. Read through window: this is a module. */
    return `<tr><td colspan="${regColKeys().length}" style="padding:var(--s-12) var(--s-3);text-align:center">${
      typeof window.emptyStateHtml==='function'
        ? window.emptyStateHtml({ icon:'list', title:line, sub, action:btn })
        : `<div style="max-width:340px;margin:0 auto"><div style="font-size:var(--t-card);font-weight:var(--w-strong)">${line}</div>`
          + `<div style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:var(--s-1) 0 14px">${sub}</div>${btn}</div>`
      }</td></tr>`;
  }
  const p=regCurPage(cs); const size=regPageSize();
  /* ON THE CONTRACTS PLACE THE PAGE IS HOW FAR "Show 40 more" HAS GONE (Part
     8): the first forty, then eighty… — the rows above stay where they are;
     the full table keeps its numbered pages */
  const placeRows=regHome()&&!neg;
  const start=placeRows?0:(p-1)*size;
  const pageRows=cs.slice(start, p*size);
  const actBtns=regRowActsHtml;
  return pageRows.map((c,i)=>{
    const eff=effectiveExpiry(c);
    /* ---- THE END OF THE TERM, IN WORDS, AND ONLY WHEN IT IS NEAR (26 Sep
       2026) ---- regEndsSay is the one reading (the panel asks it too): the
       day, then "in 45 days" inside the renewal window, "ended" once passed,
       and nothing beside a far date. ONE COLOUR PER CELL still holds (the
       black ink, 24 Aug 2026): ruby and amber mean what they always meant, and
       an ordinary date reads in the cell's own ink. */
    const ends=eff?regEndsSay(eff):null;
    const renDate=ends?ends.day:(eff?regDotDate(eff):'—');
    const renIn=ends?ends.sub:'';
    const renDateColor=ends&&ends.tone==='ruby'?'var(--st-ruby-fg)':ends&&ends.tone==='amber'?'var(--st-amber-fg)':'var(--color-neutral-700)';
    const renColor=renDateColor;
    /* "NON-MONETARY", NOT "n/m" (26 Sep 2026, the list options' floor):
       shorthand a reader had to decode, on the one cell whose whole job is to
       be read at a glance. The word is the book's own (reg_non_monetary_word). */
    const val=!isMonetary(c)?esc(i18t('reg_non_monetary_word')):(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'—');
    /* ---- THE CELLS ARE BUILT BY KEY AND EMITTED IN THE SEAT'S ORDER (second
       pass, 21 Sep 2026) ---- the head does the same off the same list, so a
       column can never sit under the wrong heading. THE TITLE IS TWO LINES
       AGAIN — the kind and the round under the name, as the reference draws
       it; this REVERSES 24 Aug's "one line per contract" on the owner's later
       drawing. THE STREAM'S COLOUR BAR moved from beside the title to the
       stream's own cell.

       THE SECOND LINE IS UNCONDITIONAL SINCE 21 SEP 2026. It used to stand
       down on the condensed density, which is the density the owner deleted;
       with that rung gone the old `regDensity()!=='condensed'` would be A
       GUARD THAT IS ALWAYS TRUE, which is the same fault class as one that is
       always false — it reads like a live rule and nothing can ever exercise
       it. */
    const round=(c.negotiation&&typeof c.negotiation.round==='number'&&c.negotiation.round>0)?c.negotiation.round:null;
    /* ONE READING OF THE TWO WORDS, whichever shape carries them: a column on
       the Negotiations seat, the identity cell's hover on Contracts. Written
       once so the two seats can never spell them differently. */
    const kindRound=`${cKind(c)}${round?` · ${i18t('ct_round_n',{n:round})}`:''}`;
    const cpName=c.counterparty||'—';
    /* ---- AND HOW MANY MORE PARTIES THERE ARE (22 Sep 2026) ----
       The cell keeps ONE name — the widest column on the table is still not
       wide enough for three company names — and says how many others there
       are. `partiesLead` derives the pair where nothing is stored, so `more`
       is 0 on every contract on file and this draws exactly nothing there.
       The count opens nothing: the list is on the hover and on the Overview. */
    let pyMore=0, pyAll='';
    try{ if(typeof partiesLead==='function'){ const L=partiesLead(c);
      pyMore=L.more||0; if(pyMore) pyAll=L.all.join(' \u00b7 '); } }catch(_){}
    const pyTag=pyMore?`<span class="reg-py-n" title="${esc(pyAll)}">+${pyMore}</span>`:'';
    /* THE DEMO SHOWS THE PRODUCT WORKING (round 16, "The Legora way", owner's overnight build of 28 Oct 2026): a sample
       contract (stamped `seeded` when the sample portfolio was made — origin, never name) wears a quiet "Sample" tag
       beside its name, never cut by it; Settings' Demo & sample data removes them all */
    const sampleTag=c.seeded===true&&typeof listChipHtml==='function'?`<span class="reg-sample" style="flex:none">${listChipHtml('gray',i18t('reg_sample_tag'))}</span>`:'';
    const mv=regMoveWord(c);
    const CELL={};
    CELL.mk=`<td class="reg-mk">${esc((window.contractRef?contractRef(c):c.id))}</td>`;
    /* IN THE INSPECTOR'S LIST WHOSE MOVE RIDES THE STAGE — "In review · your
       move" — because the Move column is not drawn there. The one-word
       reading is the same (regMoveWord); only where it is printed moves. */
    const insOn=regInspecting();
    const stageMove=(!neg&&insOn&&mv&&mv.k!=='clear')
      ? `<span class="ins-mv is-${mv.k}" title="${esc(i18t(mv.k==='you'?'ins_your_move':'ins_their_move'))}">· ${esc(i18t(mv.k==='you'?'ins_your_move':'ins_their_move'))}</span>` : '';
    /* A WORKING FILE FOUND BY A SEARCH HERE SAYS WHERE IT LIVES (26 Sep 2026). */
    const lives=((!neg&&window.contractIsWorkingFile&&contractIsWorkingFile(c))
      ? `<span class="ins-mv" style="color:var(--color-neutral-600)">· ${esc(i18t('ho_lives_nego'))}</span>` : '')
      + ((!neg&&R.view==='details'&&window.detailsOf)?(()=>{ let n=0; try{ n=detailsOf(c).left; }catch(_){ n=0; }
        return n?`<span class="ins-mv reg-det-n" data-reg-det-n="${n}" style="color:var(--st-amber-fg)">· ${esc(i18tn('det_to_fill',n,{n}))}</span>`:''; })():'');
    CELL.stage=`<td style="white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%">${window.questionDot?questionDot(c.id):''}<span class="reg-stg-slot">${window.contractStatusDotHtml?contractStatusDotHtml(c):(window.contractStatusChip?contractStatusChip(c):statusChip(c.status))}</span>${stageMove}${lives}</span></td>`;
    CELL.move=neg ? (insOn&&typeof insMoveCellHtml==='function'
        ? `<td style="white-space:nowrap">${insMoveCellHtml(c)}</td>`
        : `<td style="text-align:right;white-space:nowrap">${negoMovePillHtml(c)}</td>`)
      : `<td style="white-space:nowrap">${mv?negoMovePillHtml(c):'<span class="reg-dash">—</span>'}</td>`;
    CELL.owner=`<td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${regOwnerCell(c,{ name:regHome()&&!neg })}</td>`;
    /* ---- THE ROW'S IDENTITY IS TWO LINES, AND THE COUNTERPARTY LEADS ----
          ONE CELL, BOTH SEATS, so the two pages cannot disagree about what a
          row calls itself. The family indent, the ↳ arrow and the +N toggle
          came here WITH the title — they are marks about which row this is,
          and leaving them on a column that no longer exists would have taken a
          real control (`data-fam-toggle`) off the page.
          THE HOVER CARRIES WHAT THE CELL CANNOT: the counterparty, the whole
          title, the kind and the round, in that order — which is what keeps
          contracts-page-verify 1e true on the seat that draws no kind
          column. */
    /* regTitleOf ALREADY ESCAPES — it is the published markup reading — so
       it is interpolated as it comes. Escaping it again printed "&amp;" on the
       page wherever a title held an ampersand (26 Sep 2026, the list options'
       floor: "names print &, never &amp;"). */
    /* THE AGREEMENT, AS DRAWN, ON THE CONTRACTS PLACE (Part 8, the owner's
       pick "The Legora way"): the party over "kind · ref" — the reference in
       its one dress (refHtml) — and the title on the hover, first. The Ref
       column of its own is not drawn on this seat, so the ref is printed
       once; every other seat keeps the title under the party and its mk. */
    const refLine=typeof window.refHtml==='function'?refHtml(c):esc(window.contractRef?contractRef(c):c.id);
    /* A DEAL KEPT TO ITS LIST (a code name): no party reaches this reader, so
       the line a party leads is the code name it is known by, and under it the
       Wall's own words for why the party is missing ("Kept to its list") */
    const coded=placeRows&&!!c._codeNamed;
    /* ROOM TO SPREAD (regHomeWide): the party, the reference and the stage are columns of their own */
    const spreadOn=placeRows&&regHomeWide();
    CELL.party=`<td class="reg-party" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(coded?i18t('igw_kept_list'):(pyAll||cpName))}">${coded?esc(i18t('igw_kept_list')):esc(cpName)}</td>`;
    CELL.counterparty=`<td class="reg-cell-title" style="${c._famChild?'padding-left:30px':''}" title="${placeRows?`${regTitleOf(c)} · ${esc(pyAll||cpName)}`:`${esc(pyAll||cpName)} · ${regTitleOf(c)}`} · ${esc(kindRound)}">
        <span class="reg-id">${placeRows?regStageMarkHtml(c):(neg&&insOn)?regNegoMarkHtml(c):regAvatarHtml(cpName)}<span class="reg-id-txt">
        <span style="display:flex;align-items:center;gap:9px;min-width:0">
        <span class="reg-title" style="min-width:0;${sampleTag?'flex:0 1 auto':'flex:1'};display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"${coded?' data-reg-coded':''}>${c._famChild?`<span style="color:var(--color-neutral-400);font-family:var(--font-mono);font-size:var(--t-body);font-weight:var(--w-body)" title="${esc(RELATION_LABEL[c.relation]||'Amendment')} of ${esc((()=>{ const pc=c.parentId&&getContract(c.parentId); return pc&&window.contractRef?contractRef(pc):c.parentId; })())}">↳ </span>`:''}${coded?regTitleOf(c):placeRows?esc(regShortTitle(c)):(neg&&insOn)?`${esc(cpName)}<span class="reg-t-dot"> · </span>${esc(regShortTitle(c))}`:esc(cpName)}${pyTag}${c._famKids?`<button type="button" data-fam-toggle="${c.id}" title="${R.collapsed&&R.collapsed[c.id]?'Show':'Hide'} the ${c._famKids} linked document${c._famKids===1?'':'s'}" style="margin-left:6px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:0;font:inherit;font-weight:var(--w-body);font-size:var(--t-body);font-family:var(--font-mono);padding:1px 7px;cursor:pointer;color:var(--color-neutral-700)">${R.collapsed&&R.collapsed[c.id]?'+':'−'}${c._famKids}</button>`:''}</span>${sampleTag}
        </span>${placeRows&&spreadOn?'':`<span class="reg-sub">${placeRows?`${coded?esc(i18t('igw_kept_list')):esc(cpName)} · ${refLine}${regStageLineHtml(c)}${stageMove}${lives}`:(neg&&insOn)?(regNegoSpread()?'':regNegoLineHtml(c,refLine)):`${regTitleOf(c)}`}</span>`}
        </span></span>
      </td>`;
    /* THE KIND AND THE ROUND ARE A COLUMN ON THE NEGOTIATIONS SEAT ALONE,
          built only where it is drawn (the `acts` column's own rule): a round
          is what that page is about. On Contracts the same words are on the
          cell's hover above. */
    CELL.kind=neg?`<td class="reg-typecell">${esc(kindRound)}</td>`:'';
    if(neg&&insOn){ const nc=regNegoCols(c);
      CELL.round=`<td class="reg-num">${esc(nc.round)}</td>`;
      /* WHAT IS OPEN, IN WORDS (the list language): ours to answer amber, sent and waiting steel, settled green */
      const chTone=c._ngBand==='you'?'amber':c._ngBand==='them'?'steel':'green';
      /* its grey line, as drawn: where the asks are ("in payment and liability"), or what follows a settled word */
      const chParts=String(nc.changes).split(' · '), chNames=c._ngBand==='you'?regNegoClauseNames(c).slice(0,2).map(n=>n.toLowerCase()):[];
      const chSub=chParts.length>1?chParts.slice(1).join(' · '):chNames.length?i18t('ngl_ch_in',{ list:chNames.join(i18t('ngl_ch_and')) }):'';
      CELL.changes=`<td class="reg-ch" title="${esc(nc.say)}">${window.listWordHtml?listWordHtml(chTone,chParts[0],chSub):esc(nc.changes)}</td>`;
      CELL.clauses=`<td class="reg-cl">${regNegoClauseChips(c)}</td>`;
      const ld=regNegoLeadOf(c);
      CELL.lead=`<td class="reg-lead" title="${esc(ld.name)}">${esc(ld.short)}</td>`;
      /* AMBER WHERE IT WAITS ON THE READER (round 14, "Whose move" as drawn):
         our move, on a deal the reader leads — the one wait that is theirs */
      const onMe=ld.mine&&c._ngBand==='you'&&nc.waiting!=='\u2014';
      const wSub=nc.waiting==='\u2014'?'':i18t(c._ngBand==='you'?'ngl_wait_ours':'ngl_wait_theirs');
      CELL.waiting=`<td class="reg-wait${onMe?' is-mine':''}" style="white-space:nowrap"><span class="reg-wait-d">${esc(nc.waiting)}</span>${wSub?`<span class="reg-wait-s">${esc(wSub)}</span>`:''}</td>`; }
    /* ---- THE `stream` CELL IS GONE FROM BOTH SEATS (24 Sep 2026) ----
          Owner-ruled with the filter kept. DELETED RATHER THAN STUBBED, for
          the `name` column's reason below. regStreamName stays: the sort by
          stream (in the dropdown) still reads it, and the CSV export keeps
          its own Folder column. */
    CELL.value=`<td style="text-align:right;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-weight:var(--w-body);white-space:nowrap;${isMonetary(c)?'':'font-family:inherit;color:var(--color-neutral-600)'}"${isMonetary(c)?'':` title="${esc(i18t('reg_non_monetary'))}"`}>${val}</td>`;
    CELL.signed=`<td style="white-space:nowrap">${regSignedCell(c)}</td>`;
    /* THE LIST LANGUAGE (27 Oct 2026): the stream a soft chip, the standards in words (stdRowWordsHtml) */
    CELL.stream=`<td style="white-space:nowrap;overflow:hidden">${(()=>{ const n=regStreamName(c); if(!n||!window.listChipHtml) return '<span class="reg-dash">—</span>';
      /* the stream's short word where the house has one (STREAM_SHORT), its whole name on the hover */
      const short=(window.STREAM_SHORT&&STREAM_SHORT[c.folder])||n;
      return listChipHtml(listStreamTone(c.folder),short).replace(/ title="[^"]*"/,` title="${esc(n)}"`); })()}</td>`;
    CELL.standards=`<td style="overflow:hidden">${window.stdRowWordsHtml?stdRowWordsHtml(c):''}${regNl()?regStdMissHtml(c):''}</td>`;
    if(regNl()){ const st=regStageTone(c); CELL.standing=`<td class="reg-standing" style="white-space:nowrap;color:var(--st-${st.tone}-fg)">${esc((st.m&&st.m.label)||'')}</td>`; }
    /* ON THE CONTRACTS PLACE the words go UNDER the day (the checkers of step
       7: in Home's narrower column "· in 25 days" was cut on every screen) —
       the row is two lines already, so it costs no height; the hover says
       both. The full tables keep them beside it. */
    CELL.expiry=(regHome()&&!neg)
      ? `<td style="white-space:nowrap"${renIn?` title="${esc(renDate+' · '+renIn)}"`:''}><span class="reg-day" style="color:${renDateColor}">${renDate}</span>${renIn?`<span class="reg-sub" style="color:${renColor}">${renIn}</span>`:''}</td>`
      : `<td style="white-space:nowrap"><span class="reg-day" style="color:${renDateColor}">${renDate}</span>${renIn?` <span class="reg-day" style="color:${renColor}">· ${renIn}</span>`:''}</td>`;
    /* Built only on the seat that draws it: the Negotiations seat has no ⋯
       column, and actBtns asks readings (contractOnHold) that a stage drawing
       only that seat need not carry — f184 caught the unconditional build. */
    CELL.acts=neg?'':`<td class="reg-cell-menu" style="position:relative;text-align:right;white-space:nowrap" onclick="event.stopPropagation()">
        ${''/* THE ROW MENU IS A SMALL ICON SQUARE (the Compact ladder, 26 Sep
               2026): a typed "⋯" at text size was 22 × 20 pressable, under
               the 24 × 24 floor. The small rung is 22 drawn and 24 pressable,
               quiet (no edge until pointed at), its name on the hover. */}
        <button data-menu="${c.id}" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon reg-row-more" title="${i18t('reg_more_actions')}" aria-label="${i18t('reg_more_actions')}">${icon('more')}</button>
        <div data-menu-pop="${c.id}" style="display:none;position:absolute;right:8px;top:34px;z-index:30;width:180px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:var(--radius);padding:var(--s-1);flex-direction:column;text-align:left">${actBtns(c)}</div>
      </td>`;
    /* ---- THE `name` COLUMN IS GONE FROM BOTH SEATS (21 Sep 2026) ----
          Everything it drew is in CELL.counterparty above: the title on the
          second line, the family indent, the arrow and the toggle. DELETED
          RATHER THAN STUBBED — nothing outside this function ever read it,
          and a builder with no key in REG_COL_KEYS is a builder nothing can
          call. `reg_col_title` stays LIVE: it is the sort dropdown's own
          label, and sorting by title is still offered there. */
    /* ASK A COLUMN (20 Oct 2026): each answer column's cell, drawn by its own builder */
    if(typeof window.askColTdHtml==='function') regColKeys().forEach(k=>{ if(k.startsWith('ask:')) CELL[k]=askColTdHtml(c,k.slice(4)); });
    return `
    <tr data-row="${c.id}"${neg?' data-nego-row="1"':''} tabindex="${i===0?0:-1}"
      style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">${regColKeys().map(k=>CELL[k]||'').join('')}
    </tr>`;
  }).join('');
}
// W2-1: converted to the workspace currency, so one column total is one currency
/* THE LIST'S TITLE WITH ITS COUNT (owner-approved SAP benchmark, 9 Oct 2026):
   SAP's table toolbar names the list and counts what it shows — "Contracts
   (14)". The count is the list as filtered, the same rows the table draws; the
   foot keeps the paging. One builder, repainted with the rows. */
/* NOT ON NEGOTIATIONS ANY MORE (Part 8, the owner's pick "The Legora way",
   21 Oct 2026): that page draws no card head over its list — its All tab and
   its foot say the count — so round 14's "Negotiations 7" pill went with it. */
function regListTitle(cs){
  const name=i18t('nav_contracts');
  const n=(Array.isArray(cs)?cs.length:0).toLocaleString(jxLocale());
  return `${esc(name)} <span class="reg-tt-n">(${n})</span>`;
}
function regAggregate(cs){ return cs.filter(c=>c.status!=='Declined'&&!c.archived&&isMonetary(c)).reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0); }
/* ---- THE COUNTERPARTY'S INITIALS (Young, 7 Oct 2026, off the HaTi Platform
   mockup) ---- a small soft square beside the name, so a scanned column has a
   shape per company. THE COLOUR IS THE NAME'S, NOT THE ROW'S: a hash of the
   name picks one of five washes, so "Juno" wears the same colour on every
   page, sort and filter. Decoration only — the name beside it says it all. */
const REG_AV_TONES = 5;
const regInitials = name => {
  const words = String(name || '').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase() || '·';
};
const regAvatarTone = name => {
  let h = 0;
  for (const ch of String(name || '').trim().toLowerCase()) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h % REG_AV_TONES;
};
const regAvatarHtml = name => `<span class="reg-av av-${regAvatarTone(name)}" aria-hidden="true">${esc(regInitials(name))}</span>`;
/* ---- THE ROW'S MARK AND ITS LINE (the list language, owner, 27 Oct 2026) ----
   ONE reading of the stage (contractStatusMeta) in two dresses: the mark that leads the row — a
   ticked circle once signed, a dashed one for a draft, a triangle for what ended or was declined, a
   half circle for everything in between — and the stage's word in its own tone in the grey line,
   then when the contract last moved (the trail's last day, carried by the light list). */
function regStageTone(c){
  let m=null; try{ m=contractStatusMeta(c); }catch(_){ m=null; }
  const t=m&&/--st-([a-z]+)-/.exec(String(m.dot||''));
  return { tone:t?t[1]:'gray', m };
}
function regStageMarkHtml(c){
  const { tone, m }=regStageTone(c);
  const kind=tone==='green'?'done':tone==='ruby'?'late':(c&&c.status==='Draft')?'todo':tone==='gray'?'todo':'part';
  return window.listMarkHtml?listMarkHtml(tone,kind,m&&m.label):'';
}
/* THE NEGOTIATIONS ROW (the list language): whose move as the mark — ours a half circle in amber, theirs
   a clock in steel, settled a ticked circle — and the grey line "ref · Round 2 · Lead: You" */
function regNegoMarkHtml(c){
  if(!window.listMarkHtml) return '';
  const b=c&&c._ngBand;
  return b==='you'?listMarkHtml('amber','part',i18t('reg_pill_your_move')):b==='them'?listMarkHtml('steel','wait',i18t('reg_pill_their_move')):listMarkHtml('green','done');
}
function regNegoLineHtml(c,refLine){
  const nc=regNegoCols(c), ld=regNegoLeadOf(c);
  return `${refLine} · ${esc(i18t('ngl_round_lead',{ n:nc.round, who:ld.short }))}`;
}
/* THE CLAUSES IN PLAY: the clauses with a change still open, as the paper names them (clauseNameShown,
   its number left off), three at most and the count of the rest; RAW over c.changes */
function regNegoClauseNames(c){
  const ch=Array.isArray(c&&c.changes)?c.changes:[];
  const seen=new Set(), names=[];
  for(const x of ch){
    if(!x||(x.status&&x.status!=='pending')||x.superseded) continue;
    const raw=String(x.clauseLabel||'').trim(); if(!raw) continue;
    const shown=(typeof clauseNameShown==='function'?clauseNameShown(raw):raw).replace(/^[\dIVXLCivxlc.()§]+\s+/,'').trim()||raw;
    const k=shown.toLowerCase(); if(seen.has(k)) continue; seen.add(k); names.push(shown);
  }
  return names;
}
function regNegoClauseChips(c){
  const names=regNegoClauseNames(c);
  if(!names.length) return '<span class="reg-dash">\u2014</span>';
  const chips=names.slice(0,3).map(n=>window.listChipHtml?listChipHtml('gray',n):esc(n)).join(' ');
  return chips+(names.length>3?` <span class="reg-cl-more">+${names.length-3}</span>`:'');
}
function regStageLineHtml(c){
  /* the new look's list says the stage in its own Standing column (round 6), not on the grey line */
  if(regNl()) return '';
  const { m }=regStageTone(c); if(!m) return '';
  const at=c&&(c._lastAuditAt||c.updatedAt||c.lastAction);
  const ago=at&&typeof window.rlAgoWords==='function'?rlAgoWords(at):'';
  /* the SHORT word, as the stage column's dot printed it (contractStatusDotHtml) */
  const W=window, short=(W.READY_META&&m===W.READY_META&&W.READY_META_SHORT)||(W.HANDOVER_META&&m===W.HANDOVER_META&&W.HANDOVER_META_SHORT)
    ||(W.HANDOVER_SIGNED_META&&m===W.HANDOVER_SIGNED_META&&W.HANDOVER_SIGNED_META_SHORT)||m;
  return ` · <span class="reg-stg-w" style="color:${m.tx}" title="${esc(m.label)}">${esc(short.label)}</span>${ago?` · ${esc(ago)}`:''}`;
}

/* THE FOOT IS WRITTEN IN PLACE, so its live region is heard when the count
   moves (js/views/listhead.js lhFootPut; main wrote #reg-showing's words in
   place too); a page without the list head's writer draws it afresh */
function regFootPut(sh, html){ if(!(typeof window.lhFootPut==='function'&&lhFootPut(sh,html))) sh.outerHTML=html; }
function renderRegisterBody(){
  /* the wall on Home's Contracts place is drawn whole: its count line and
     every paper follow the narrowing together — the wall alone, never the
     head above it, so a word typed in the list head's box keeps its caret
     (Part 8, the critic's 3.5); the head counts again once the typing pauses */
  if(regHome()&&regScope()!=='negotiations'&&regState().show!=='list'){ regWallRepaint(); return; }
  const cs=regFiltered();
  /* The stagger intro belongs to arriving at the page; this body re-renders on
     every search keystroke, sort and pager press, and rows that replay their
     fade-in per keystroke read as a flickering table. One intro, then still. */
  const tb=document.getElementById('reg-tbody'); if(tb){ tb.innerHTML=regRowsHtml(cs); wireRegRows(); }
  /* The fold's control is in the Display menu, which a body repaint does not
     rebuild — so it is wired once, by the full render, never here. */
  /* Negotiations' foot is the list head's ("1–7 of 7", regNegoFootHtml),
     drawn whole; and the head's own numbers follow the rows once the typing
     pauses (Part 8) — a body repaint from any door keeps the tabs true */
  const negSeat=regScope()==='negotiations';
  /* …and the Contracts place's ("1–40 of 189 · Show 40 more", regCtFootHtml),
     the same way (Part 8) */
  const ctSeat=!negSeat&&regHome();
  /* the new look's foot is two halves in its own row: the row is written again whole */
  const nlf=regNl()&&document.getElementById('reg-nl-showing'); if(nlf&&nlf.parentElement) nlf.parentElement.innerHTML=regNlFootHtml(cs);
  const sh=document.getElementById('reg-showing'); if(sh){ if(negSeat) regFootPut(sh,regNegoFootHtml(cs)); else if(ctSeat) regFootPut(sh,regCtFootHtml(cs)); else sh.innerHTML=regFooterText(cs); }
  if((negSeat||ctSeat)&&typeof window.lhHeadSyncSoon==='function') lhHeadSyncSoon(negSeat?REG_NEGO_SEAT:REG_CT_SEAT);
  const tt=document.getElementById('reg-tt'); if(tt){ tt.innerHTML=regListTitle(cs); }
  const pgr=document.getElementById('reg-pager'); if(pgr){ pgr.innerHTML=regPager(cs); wireRegPager(); }
  /* The search narrows from the shell bar, which repaints only this body — so
     the way back has to follow it here rather than waiting for a full render. */
  regPaintClear();
  /* A body repaint can take the chosen contract off the page (a search, a page
     turn): the panel follows the list, never the other way round. */
  regInsPaint();
}
/* THE WALL ALONE, DRAWN AGAIN (Part 8): its count line, its papers and its
   foot from the rows as narrowed — never the head above it */
function regWallRepaint(){
  const wall=document.getElementById('ig-wall');
  if(!wall){ if(regPlaceUp()) regRepaint(); ctfDockAgain(); return; }
  const tmp=document.createElement('div');
  tmp.innerHTML=regHomeWallHtml(regFiltered(), regSortIconHtml(regSortOptsHtml(regState(),false)));
  const fresh=tmp.firstElementChild; if(fresh) wall.replaceWith(fresh);
  regToolsWire();
  if(typeof window.lhHeadSyncSoon==='function') lhHeadSyncSoon(REG_CT_SEAT);
}
/* ═══ THE LIST INSPECTOR ON THIS PAGE (26 Sep 2026) ═══════════════════════
   The seat's own verbs, handed to the one panel builder (js/views/inspector.js).
   OPEN IS NOT A NEW DOOR: "Open contract" is the row press the full table
   makes (selectContract), "Open negotiation" is the Negotiations row's own
   (regOpenRow), and the ⋯ is the row menu (regRowActsHtml / regRunRowAct).
   One filled button per page — Draft new agreement, in the head — so the
   panel's lead act wears the accent INK on the white face, the ladder's own
   answer for a main act that is not the page's one. */
/* Whose move as the panel's pill, in the stage pill's own dress (.reg-stg):
   amber when it is ours, grey when it is theirs, the stage where neither. */
function regMovePillHtml(c, o){
  const m=(typeof insMove==='function')?insMove(c):null;
  if(!m||m.k==='clear') return null;
  const tone=m.k==='you'?'amber':'gray';
  /* the wait beside the word in Jambo's panel (round 14: "Our move · 4 days") */
  let wait=''; if(o&&o.days){ try{ const w=regNegoCols(c).waiting; if(w&&w!=='\u2014') wait=w; }catch(_){ wait=''; } }
  const word=i18t(m.k==='you'?'reg_pill_your_move':'reg_pill_their_move')+(wait?' \u00b7 '+wait:'');
  return `<span class="reg-stg" style="color:var(--st-${tone}-fg)" title="${esc(m.word||'')}"><i style="background:var(--st-${tone}-dot)"></i>${esc(word)}</span>`;
}
/* The drawing's three Negotiations columns, read off the record RAW (no
   negoInit): the round number, what the changes on the table ask of whom,
   and the days since the move came to whoever holds it. */
function regNegoCols(c){
  const m=(typeof negoMoveSay==='function')?negoMoveSay(c):{k:'clear',n:0,say:''};
  const n=(c&&c.negotiation)||{};
  const round=String(Number(n.round)||1);
  const ch=Array.isArray(c&&c.changes)?c.changes:[];
  const ours=ch.filter(x=>x&&x.authorSide!=='counterparty'&&(x.status==='pending'||!x.status)).length;
  let changes;
  /* the drawing's words (round 14): "2 redlines to answer", "2 answers
     decided, not sent", "1 sent, no answer yet", "All agreed · out to sign" */
  if(m.k==='you'&&!m.why) changes=i18tn('ngl_ch_to_answer',m.n||0,{n:m.n||0});
  else if(m.why==='decided') changes=i18tn('ngl_ch_decided',m.n||0,{n:m.n||0});
  else if(m.why==='handover') changes=i18t('ngl_ch_out');
  else if(m.k==='them') changes=i18tn('ngl_ch_sent',ours,{n:ours});
  else if(m.k==='clear') changes=ch.length?i18t('ngl_ch_settled'):i18t('ngl_ch_none');
  else changes=m.say||'';
  const at=Date.parse(n.turnAt||c.lastAction||'');
  const d=Number.isFinite(at)?Math.max(0,Math.floor((Date.now()-at)/86400000)):null;
  const waiting=m.k==='clear'||d==null?'—':(d===0?i18t('home_today'):i18tn('ap_pg_days',d,{n:d}));
  return { round, changes, waiting, say:m.say||'' };
}
/* WHO LEADS IT, ONE READING (round 14): the desk's lead, else the contract's
   owner — the panel's Lead fact and the list's Lead column. The column says
   "You" where it is the reader, else the first name (the whole on the hover). */
function regNegoLeadOf(c){
  let name='', id='';
  try{ const l=(typeof deskLead==='function')?deskLead(c):null;
    if(l&&l.name){ name=l.name; id=String(l.id||''); }
    else { name=((typeof contractOwnerName==='function')?contractOwnerName(c):'')||''; id=String((c&&c.owner&&c.owner.id)||''); } }catch(_){ name=''; }
  const me=(typeof currentUser==='function'&&currentUser())||{};
  const mine=!!name&&((id&&me.id&&id===String(me.id))||(!id&&name===me.name));
  return { name, mine, short: !name ? '\u2014' : mine ? i18t('ngl_lead_you') : String(name).split(/\s+/)[0] };
}
/* The Negotiations panel's four facts, as the drawing names them: Value,
   Lead, their changes (open · agreed) and when we last sent a round. */
function regNegoFacts(c){
  const f=(typeof insFacts==='function')?insFacts(c):[];
  const val=f.find(x=>x.k==='value');
  /* "You" for the reader's own deal, as the column and the drawing say it */
  const ld=regNegoLeadOf(c), lead=ld.mine?ld.short:ld.name;
  const theirs=(Array.isArray(c.changes)?c.changes:[]).filter(x=>x&&x.authorSide==='counterparty');
  const open=theirs.filter(x=>x.status==='pending'||!x.status).length, agreed=theirs.filter(x=>x.status==='accepted').length;
  const rounds=(c.negotiation&&Array.isArray(c.negotiation.rounds))?c.negotiation.rounds:[];
  const lastR=rounds.length?rounds[rounds.length-1]:null;
  const last=lastR?lastR.at:'';
  const d0=last?(typeof regDotDate==='function'?regDotDate(last):String(last).slice(0,10)):'';
  /* "9 Oct · round 1" (round 14): the day, and the round that went */
  const day=d0?i18t('jl_sent_round',{day:d0,n:Number(lastR.n)||rounds.length}):'';
  return [
    ...(val?[{ k:'value', label:val.label, v:val.v?esc(val.v):'' }]:[]),
    { k:'lead', label:i18t('ins_f_lead'), v:esc(lead) },
    { k:'theirs', label:i18t('ins_f_their_changes'), v:theirs.length?esc(i18t('ins_f_open_agreed',{open,agreed})):'' },
    { k:'sent', label:i18t('ins_f_last_sent'), v:esc(day) },
  ];
}
/* THE PAGE IN JAMBO'S WORDS (round 14), counted from the page's own book
   (regNegoBase: every filter but the tab, the tabs' own numbers) — no AI.
   The chips are the page's own doors: the Our move tab, Start a negotiation. */
function regNegoSay(){
  let book=[]; try{ book=regNegoBase(); }catch(_){ book=[]; }
  const n=negoBandCounts(book), all=book.length;
  if(!all) return { lines:[esc(i18t('jl_ng_none'))], chips:typeof ngStartPickerOpen==='function'?[{ label:i18t('jl_ng_chip_start'), run:()=>ngStartPickerOpen() }]:[] };
  const parts=[n.you?i18tn('jl_ng_ours',n.you,{n:n.you}):'', n.them?i18tn('jl_ng_theirs',n.them,{n:n.them}):'', n.out?i18tn('jl_ng_out',n.out,{n:n.out}):''].filter(Boolean);
  const list=parts.length>1?parts.slice(0,-1).join(', ')+i18t('jl_and')+parts[parts.length-1]:(parts[0]||'');
  const lines=[`<b>${esc(i18tn('jl_ng_live',all,{n:all}))}</b>${list?esc(': '+list):''}.`];
  /* the longest wait on our side, by its own reading (regNegoCols) */
  const ours=book.filter(c=>c._ngBand==='you').map(c=>({ c, at:Date.parse((c.negotiation&&c.negotiation.turnAt)||c.lastAction||'') }))
    .filter(x=>Number.isFinite(x.at)).sort((a,b)=>a.at-b.at);
  if(ours.length){ const c=ours[0].c; let w=''; try{ w=regNegoCols(c).waiting; }catch(_){ w=''; }
    if(w&&w!=='\u2014') lines.push(esc(i18t('jl_ng_oldest',{ref:(window.contractRef?contractRef(c):c.id),party:c.counterparty||'\u2014',wait:w}))); }
  const R=regState(), chips=[];
  if(n.you&&(R.band||'')!=='you') chips.push({ label:i18t('jl_ng_chip_ours'), verb:i18t('jov_ask_open_v'), rest:i18t('jov_ask_ng_ours_r'), run:()=>{ R.band='you'; R.page=1; regRepaint(); if(typeof jlLand==='function') jlLand('first'); } });
  if(typeof ngStartPickerOpen==='function') chips.push({ label:i18t('jl_ng_chip_start'), run:()=>ngStartPickerOpen() });
  /* THE OVERVIEW'S FACTS (The Legora Way, owner 26 Oct 2026): the bands this page already counts (negoBandCounts)
     and their asks read RAW off c.changes; each link the band's own tab. "Settled this quarter" has no reading */
  const band=k=>()=>{ R.band=k; R.page=1; regRepaint(); if(typeof jlLand==='function') jlLand('first'); };
  const names=k=>book.filter(c=>c._ngBand===k).slice(0,2).map(c=>c.counterparty||(window.contractRef?contractRef(c):c.id)).join(', ');
  const facts=[];
  if(n.you) facts.push({ k:i18t('jov_ng_you'), v:i18tn('jov_n_then',n.you,{n:n.you,list:names('you')}), link:i18t('jov_ln_open'), run:band('you') });
  if(n.them) facts.push({ k:i18t('jov_ng_them'), v:i18tn('jov_n_then',n.them,{n:n.them,list:names('them')}), link:i18t('jov_ln_show'), run:band('them') });
  if(n.out) facts.push({ k:i18t('jov_ng_out'), v:i18tn('jov_n_then',n.out,{n:n.out,list:names('out')}), link:i18t('jov_ln_show'), run:band('out') });
  let asks=0; book.forEach(c=>{ asks+=(Array.isArray(c.changes)?c.changes:[]).filter(x=>x&&x.status==='pending'&&!x.withdrawn&&x.authorSide==='counterparty').length; });
  if(asks) facts.push({ k:i18t('jov_ng_asks'), v:i18tn('jov_ng_asks_v',asks,{n:asks}), need:true });
  if(lines[1]) facts.push({ html:lines[1] });
  return { lines, chips, head:{ html:lines[0] }, facts };
}
/* A CLAUSE SAID THE WAY THE DRAWING SAYS IT (round 14): "Clause 7 Liability
   cap", the next "clause 11 Payment terms" — the heading's own number and its
   name in the ONE presenting reading (clauseNameShown via negoClauseName),
   never a number invented: a heading without one is said by its name. */
function regClauseSaid(raw, lower){
  const shown=(typeof negoClauseName==='function')?negoClauseName(raw):String(raw||'');
  let p=null; try{ p=(typeof clauseParseHeading==='function')?clauseParseHeading(String(shown||'')):null; }catch(_){ p=null; }
  const num=p&&String(p.num||'').trim().replace(/[.)]+$/,''), title=p&&String(p.title||'').trim();
  if(!num||!title) return String(shown||'');
  return i18t(lower?'jl_need_clause_lc':'jl_need_clause',{n:num,name:title});
}
/* NEEDS YOU, FIRST ROW (round 14: "Answer 2 redlines · Clause 7 Liability cap ·
   clause 11 Payment terms · Answer"): their asks still standing, read RAW, the
   clauses named as the asks table names them; only while the move is ours.
   It says what the checklist's quiet-ask row would, so that row steps aside. */
function regNegoNeedRows(c){
  if(!c||!c.negotiation||!Array.isArray(c.changes)) return [];
  const m=(typeof insMove==='function')?insMove(c):null; if(!m||m.k!=='you') return [];
  /* past the desk's standard the checklist's own row says it, in ruby, with
     the wait and the standard (needsYouOf 'quiet'); this row is the drawing's
     for the ordinary case */
  let late=false; try{ late=(typeof needsYouOf==='function'?(needsYouOf(c)||[]):[]).some(x=>x&&x.kind==='quiet'); }catch(_){ late=false; }
  if(late) return [];
  const pend=c.changes.filter(x=>x&&x.status==='pending'&&!x.withdrawn&&x.authorSide==='counterparty');
  if(!pend.length) return [];
  const names=[...new Set(pend.map(ch=>ch.clauseLabel||ch.headingText||ch.clauseId||'').filter(Boolean))].map((raw,i)=>regClauseSaid(raw,i>0));
  const shown=names.slice(0,3), more=names.length-shown.length;
  const sub=esc(shown.join(' \u00b7 '))+(more?' \u00b7 '+esc(i18tn('ins_more_asks',more,{n:more})):'');
  const ok=typeof insNegoDoorState==='function'?insNegoDoorState(c).ok:true;
  return [{ k:'answer', title:i18tn('jl_need_answer',pend.length,{n:pend.length}), sub, plain:names.join(' \u00b7 '),
    verb:i18t('home_verb_answer'), go:i18t('ins_need_go_nego'),
    run:()=>{ if(ok&&typeof openRedlineWorkbench==='function'){ openRedlineWorkbench(c.id,{ face:true }); if(typeof jlLand==='function') jlLand('redlines'); } } }];
}
function regInsSeat(){ return regScope()==='negotiations' ? 'negotiations' : 'contracts'; }
function regInsActs(c){
  if(!c) return [];
  /* THE DOORS ON BOTH SEATS (owner, 12 Oct 2026; the Document door went 15
     Oct 2026): Negotiation · Workspace, from the one builder (insDoorActs).
     Each seat fills its own door — the Contracts seat its Workspace, the
     Negotiations page its Negotiation (SAP benchmark, 9 Oct 2026). A press on
     the row itself still opens the negotiation on that seat (regOpenRow). */
  const neg=regScope()==='negotiations';
  return insDoorActs(c, { lead: neg ? 'nego' : 'ws' });
}
/* ---- "YOUR MOVE" STANDS IN ONE STRAIGHT LINE (Young, 7 Oct 2026) ----
   The stage pills are different widths ("Drafting", "In Review", and longer
   in Swedish), and the move words followed each pill, so they zig-zagged down
   the page. Every pill now sits in a slot as wide as the WIDEST pill drawn on
   this page, measured after the paint (so the reader's language is measured,
   never guessed), and the move words start after the slot. */
/* THE STAGE COLUMN'S WIDTH, MEASURED ONCE PER WORD (22 Oct 2026, the Board → Paper switch): a
   pill's width is its word's, so each word is measured once (in this language, at this size) and
   kept; a paint whose words are all known sets the width without asking the browser to lay the
   page out, and only a new word is measured — after the frame, never in the middle of drawing */
const _regStgW=new Map();
const regStgKey=p=>(document.documentElement.lang||'')+'|'+(document.documentElement.style.fontSize||'')+'|'+p.textContent;
function regAfterPaint(fn){
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>setTimeout(fn,0)); else fn();
}
function regStageSlotFit(){
  const tb=document.getElementById('reg-tbody'); if(!tb) return;
  const table=tb.closest('table'); if(!table) return;
  const pills=[...tb.querySelectorAll('.reg-stg-slot > .reg-stg')];
  const set=()=>{ let w=0; for(const p of pills){ const k=regStgKey(p); if(_regStgW.has(k)) w=Math.max(w,_regStgW.get(k)); }
    if(w>0) table.style.setProperty('--reg-stg-w',w+'px'); else table.style.removeProperty('--reg-stg-w'); };
  const unknown=pills.filter(p=>!_regStgW.has(regStgKey(p)));
  set();
  if(!unknown.length) return;
  regAfterPaint(()=>{ if(!table.isConnected) return;
    for(const p of unknown){ if(!p.isConnected) continue; const r=p.getBoundingClientRect(); if(r.width>0) _regStgW.set(regStgKey(p),Math.ceil(r.width)); }
    set(); });
}
function regInsPaint(){
  regStageSlotFit();
  const tb=document.getElementById('reg-tbody'); if(!tb) return;
  if(!regInspecting()||typeof insPaintPanel!=='function'){ if(typeof insListOff==='function') insListOff(tb); return; }
  const seat=regInsSeat();
  const idOf=r=>r.getAttribute('data-row');
  const id=insPick(seat,[...tb.querySelectorAll('[data-row]')].map(idOf));
  insMarkRow(tb,'[data-row]',idOf,id);
  const paint=pid=>{
    const c=pid?getContract(pid):null;
    /* ONLY THE DOORS ON NEGOTIATIONS (round 14 as drawn, owner's "build all
       the gaps", 18 Oct 2026): no ⋯ in Jambo's panel there — share, scan,
       PDF, end or pause and delete are the paper's Menu tab's, one press
       through Workspace; the Contracts seat keeps its row menu */
    let menu=''; if(c&&seat!=='negotiations'){ try{ menu=regRowActsHtml(c,['open']); }catch(_){ menu=''; } }
    insPaintPanel({ seat, c, acts:regInsActs(c), menuHtml:menu,
      onMenu:(act,cid)=>regRunRowAct(act,cid),
      moveSuffix:true,
      /* The stage — on Negotiations, whose move — beside the name (SAP benchmark). */
      statusBeside:true,
      statusHtml:(seat==='negotiations'&&c)?regMovePillHtml(c,{days:true}):null,
      /* On Negotiations what is on the table leads — it is what that page is
         for; on Contracts the facts lead. The drawing's own order. */
      /* THE DRAWING'S PANEL (SAP benchmark, owner: "hati has more information
         which makes it seem to have clutter"): four facts, then What Copilot
         read — the round's detail and the trail stay on the contract. */
      order:['facts','reads'],
      factKeys:['value','owner','stream','ends'],
      facts:(seat==='negotiations'&&c)?regNegoFacts(c):null,
      empty:i18t('ins_none_rows'),
      /* JAMBO'S PANEL (round 14, "Whose move" as drawn): "Negotiation", the
         page in his words with nothing chosen, "Answer N redlines" first */
      jlWord:i18t(seat==='negotiations'?'jl_w_negotiation':'jl_w_contract'),
      jlHome:i18t(seat==='negotiations'?'nav_negotiations':'nav_contracts'),
      jlPh:i18t('jl_ph_list'),
      jlSay:seat==='negotiations'?regNegoSay:null,
      jlNeedRows:seat==='negotiations'?regNegoNeedRows:null });
  };
  paint(id);
  insListWire(tb,{ rowSel:'[data-row]', idOf,
    onSelect:pid=>{ insSelect(seat,pid); insMarkRow(tb,'[data-row]',idOf,pid); paint(pid); },
    onOpen:(pid,row)=>regOpenRow(pid,!!(row&&row.getAttribute('data-nego-row'))) });
}
/* ═══ DISPLAY (26 Sep 2026, the Inspector drawing) ═════════════════════════
   One menu for what changes how the list is DRAWN and nothing about what is in
   it: Table · Board, the row density, and whether amendments sit under their
   agreement. They were two segments on the bar and a link in the foot; beside
   the panel the bar has room for neither, and the foot is the count. Every
   control inside is the one it replaced — same attribute, same store, same
   repaint. The button opens and closes it; Escape and a press outside close
   it. Table · Board and the fold are never drawn on the Negotiations seat, for
   the reasons regMode and the foot give. */
/* SORT AS A SMALL ICON ON THE LIST'S HEAD (SAP benchmark, 9 Oct 2026): the
   same select, the same id and listener; only its face is the ⇅ mark, with
   its name on the hover and for a screen reader. */
function regSortIconHtml(opts, id){
  const t=i18t('reg_sort');
  /* one sort control for every list that draws one (Approvals' too, round 15) */
  return `<label class="reg-f reg-chip reg-ico" title="${esc(t)}"><span class="reg-f-l">${typeof icon==='function'?icon('sort','w-4 h-4'):''}<span class="sr-only">${esc(t)}</span></span><select id="${esc(id||'reg-sort')}" class="reg-chip-sel" title="${esc(t)}" aria-label="${esc(t)}">${opts}</select></label>`;
}
function regDisplayHtml(neg){
  const R=regState();
  const board=regMode()==='board';
  const parts=[];
  if(!neg) parts.push(`<div class="reg-dp-h">${esc(i18t('reg_display_show_as'))}</div>${
    regSegHtml('data-reg-mode',[['table',i18t('reg_mode_table')],['board',i18t('reg_mode_board')]],regMode(),i18t('reg_mode_title'))}`);
  if(!board) parts.push(`<div class="reg-dp-h">${esc(i18t('reg_density'))}</div>${
    regSegHtml('data-reg-density',Object.keys(REG_DENSITY).map(k=>[k,i18t('reg_density_'+k)]),regDensity(),i18t('reg_density_title'))}`);
  if(!neg&&!board){
    const on=!R.flat;
    parts.push(`<button type="button" id="reg-flat" class="reg-dp-row" aria-pressed="${on?'true':'false'}"><span class="reg-dp-ck${on?' on':''}" aria-hidden="true">${
      on&&typeof icon==='function'?icon('check2','',2.4):''}</span><span>${esc(i18t('reg_nest_amendments'))}</span></button>`);
  }
  return `<span class="reg-display">
    <button type="button" id="reg-display" class="reg-chip reg-chip-btn reg-ico" aria-haspopup="true" aria-expanded="false" aria-controls="reg-display-pop" title="${esc(i18t('reg_display_title'))}">${
      typeof icon==='function'?icon('cog','w-4 h-4'):''}<span class="sr-only">${esc(i18t('reg_display'))}</span></button>
    <div id="reg-display-pop" class="reg-display-pop" role="group" aria-label="${esc(i18t('reg_display'))}" hidden>${parts.join('')}</div>
  </span>`;
}
function regCloseDisplay(){
  const pop=document.getElementById('reg-display-pop'); if(pop&&!pop.hidden) pop.hidden=true;
  const b=document.getElementById('reg-display'); if(b) b.setAttribute('aria-expanded','false');
}
function regCloseMenus(){ document.querySelectorAll('#reg-tbody [data-menu-pop]').forEach(m=>m.style.display='none'); }
/* ---- A ROW'S ⋯ OPENS WHERE IT CAN BE READ (the checkers of step 7, 15 Oct
   2026) ---- The menu hangs under its row inside the list's own scroller, so
   on the last rows it ran past the scroller's foot and the window, every item
   hidden. Measured after it is shown: where the room below (the scroller and
   the window, whichever ends first) cannot hold it and the room above holds
   more, it opens UPWARD from the button; otherwise it keeps its place. One
   builder, so every table that draws the ⋯ (the Contracts place's List, the
   full table) is served. */
function regMenuFit(pop, btn){
  if(!pop||!btn||typeof pop.getBoundingClientRect!=='function') return;
  pop.style.top='34px'; pop.style.bottom='auto';
  const sc=pop.closest('#reg-scroll'), vh=window.innerHeight||0;
  const box=sc?sc.getBoundingClientRect():{ top:0, bottom:vh };
  const lo=Math.min(box.bottom, vh||box.bottom), hi=Math.max(box.top, 0);
  const b=btn.getBoundingClientRect(), h=pop.offsetHeight||pop.getBoundingClientRect().height||0;
  const below=lo-b.bottom, above=b.top-hi;
  if(h>below-4 && above>below){
    /* bottom is measured from the cell (the menu's positioned parent) */
    const cell=pop.offsetParent, foot=cell?cell.getBoundingClientRect().bottom:b.bottom;
    pop.style.top='auto'; pop.style.bottom=Math.round(foot-b.top+4)+'px';
  }
}
function wireRegRows(){
  /* ASK A COLUMN: the answers for the rows now in front of the reader, and the chosen one lit */
  if(typeof window.askColSync==='function'){ askColMarkRows(); askColSync(); }
  /* Whole-row click opens the contract's workspace — EXCEPT on the Negotiations
     page, where a row opens the NEGOTIATION. Same table, same builder, one
     different destination, decided off the row's own attribute rather than off
     the scope flag so a row can never disagree with the page that drew it. */
  /* WHAT OPENING MEANS IS regOpenRow — one answer for the row press, Enter,
     a double-click and the list inspector's own button. A row that cannot
     open the negotiation opens the contract; see regOpenRow. */
  const openRow=el=>regOpenRow(el.getAttribute('data-row'), !!el.getAttribute('data-nego-row'));
  /* IN THE INSPECTOR'S SHAPE A PRESS SELECTS, and the list's own hands are
     insListWire's (regInsPaint arms them); the row press that opens is bound
     only where the page draws its full table. */
  if(!regInspecting()) document.querySelectorAll('#reg-tbody [data-row]').forEach(el=>el.addEventListener('click',()=>openRow(el)));

  /* ═══ ARROW KEYS THROUGH THE LIST — the single biggest "this feels fast"
     signal, and the one every benchmark has and HaTi did not ═══════════════
     MEASURED before this: js/views/register.js contained zero ArrowDown
     handling, and on the Negotiations page the row press was the SOLE route
     in — that list was mouse-only outright.

     ROVING TABINDEX, NOT role="grid". One row is in the tab order at a time
     and the arrows move which; the table stays a table. Declaring role="grid"
     would change how the whole thing is announced and how every cell is
     addressed, which is a much larger claim than "the arrows work" and would
     reach every existing reading of this table.

     THE BAND HEADINGS ARE SKIPPED BY CONSTRUCTION: they carry no data-row —
     they are role="presentation" grouping rows with no tab stop — so the
     query below simply never sees them and Down steps from the last row of
     one band to the first of the next.

     ONE DELEGATED LISTENER on the tbody, not one per row: this body repaints
     on every filter, sort and page change, and a listener per row would stack
     one set per repaint. */
  const tbody=document.getElementById('reg-tbody');
  if(tbody && !tbody.dataset.regKeysBound){
    tbody.dataset.regKeysBound='1';
    tbody.addEventListener('keydown',e=>{
      /* The inspector's own keys answer in its shape (insListWire): a press
         is answered once, never by both. */
      if(tbody.getAttribute('data-ins-on')==='1') return;
      const row=e.target.closest && e.target.closest('[data-row]');
      if(!row) return;
      /* A control INSIDE the row owns its own keys — the ⋯ menu button and
         the family toggle are real buttons and Enter must press them, not
         open the contract behind them. */
      if(e.target!==row && /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      const rows=[...tbody.querySelectorAll('[data-row]')];
      const i=rows.indexOf(row);
      let to=-1;
      if(e.key==='ArrowDown') to=Math.min(i+1,rows.length-1);
      else if(e.key==='ArrowUp') to=Math.max(i-1,0);
      else if(e.key==='Home') to=0;
      else if(e.key==='End') to=rows.length-1;
      else if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openRow(row); return; }
      else return;
      e.preventDefault();
      const next=rows[to]; if(!next||next===row) return;
      row.setAttribute('tabindex','-1');
      next.setAttribute('tabindex','0');
      next.focus({preventScroll:true});
      next.scrollIntoView({block:'nearest'});
    });
  }
  // expand / collapse an agreement's linked documents
  document.querySelectorAll('#reg-tbody [data-fam-toggle]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation(); const R=regState(); const id=b.getAttribute('data-fam-toggle');
    R.collapsed=R.collapsed||{}; if(R.collapsed[id]) delete R.collapsed[id]; else R.collapsed[id]=true;
    renderRegisterBody();
  }));
  // ⋯ popover: toggle one open at a time
  document.querySelectorAll('#reg-tbody [data-menu]').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); const id=btn.getAttribute('data-menu'); const pop=document.querySelector('#reg-tbody [data-menu-pop="'+id+'"]'); const open=pop&&pop.style.display==='flex'; regCloseMenus(); if(pop&&!open){ pop.style.display='flex'; regMenuFit(pop, btn); } }));
  document.querySelectorAll('#reg-tbody [data-act]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); regCloseMenus();
    regRunRowAct(b.getAttribute('data-act'), b.getAttribute('data-id'));
  }));
  // empty-state actions
  /* The empty state's Clear asks the same one reading as the bar's. */
  document.getElementById('reg-empty-clear')?.addEventListener('click',()=>{ regFiltersAtRest(regState()); regSearchBoxClear(); regRepaint(); });
  document.getElementById('reg-empty-new')?.addEventListener('click',e=>{ e.stopPropagation(); const nb=document.getElementById('cmd-new'); if(window.openNewMenu){ openNewMenu(e.currentTarget); } else if(nb){ nb.click(); } });
}
/* Exports what the register is showing — every row the current filters, search
   and stage/stream pills resolve to, not just the page on screen. The old body
   read a tick-box selection; with the reference's seven columns there is no
   tick box, so that version could only ever have said "Nothing selected". */
function regExportCsv(){
  const rows=regFiltered();
  if(!rows.length){ toast(i18t('reg_nothing_to_export'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','Name','Counterparty','Type','Category','Folder',`Value (${jxCurrency()})`,'Status','Last action','Expiry'];
  const body=rows.map(c=>[(window.contractRef?contractRef(c):c.id),c.name,c.counterparty||'',cKind(c),(c.metadata&&c.metadata.category)||'',FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
  const csv=[head.map(esc).join(','),...body].join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='hati-register.csv'; a.click(); URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} contract${rows.length===1?'':'s'} to CSV`);
}
/* ---- ONE TABLE, TWO PAGES ----
   opts.scope switches this between Contracts (nothing passed) and Negotiations
   ('negotiations'); opts.head is the page's own heading block above the filter
   bar; opts.nav is which sidebar door lights. Everything else — the filters,
   the row builder, the body renderer, the wiring, the footer — is shared, on
   purpose and as the whole point: two tables of contracts built by two
   functions eventually disagree about what a row says, and disagreeing is
   exactly what the Negotiations page was written as a twenty-line signpost to
   avoid. Reuse is now what keeps that promise. */
/* THE CHIP IS THE NARROWING AND THE WAY OUT OF IT, in one object — see
   regShowOnly. It leads the bar because it is the widest statement on it:
   every dropdown beside it narrows within this set. ONE BUILDER for the
   Contracts bar and the Negotiations list head's chip row (Part 8). */
function regOnlyChipHtml(R){
  const onlyChip=R.only?`<span id="reg-only-chip" title="${esc(i18t('reg_only_title'))}"
      style="display:inline-flex;align-items:center;gap:7px;font-size:var(--t-meta);font-weight:var(--w-strong);border-radius:var(--radius);padding:5px 6px 5px 10px;
        background:var(--st-steel-bg);border:1px solid var(--st-steel-line);color:var(--st-steel-fg);max-width:320px;min-width:0">
      ${''/* A WIDTH LIMIT, THE WHOLE LABEL ON THE HOVER (the owner's list, 27 Sep
             2026): a long label pushed the filters onto a second line. */}
      <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(R.only.label||i18t('reg_only_fallback'))}">${esc(R.only.label||i18t('reg_only_fallback'))}</span>
      <button id="reg-only-clear" title="${esc(i18t('reg_only_clear'))}" aria-label="${esc(i18t('reg_only_clear'))}"
        style="border:0;background:none;font:inherit;line-height:1;color:inherit;cursor:pointer;padding:0 3px;opacity:.7;display:inline-grid;place-items:center">${icon('x','w-3.5 h-3.5')}</button>
    </span>`:'';
  return onlyChip;
}
/* NEVER SIGNED ON THE NEGOTIATIONS SEAT, for the reason its own filter gives:
   that page holds live negotiations and has no Signed column, so ordering by a
   date none of them carries is a control whose one outcome is a list of
   em-dashes. ONE BUILDER for both seats' Sort (Part 8). */
function regSortOptsHtml(R, neg){
  return visibleSorts(REG_SORTS).filter(s=>!(neg&&s.k==='signed'))
    .map(s=>`<option value="${s.k}" ${R.sort===s.k?'selected':''}>${s.label}</option>`).join('');
}
let _regOpts={};
/* Repaint the page that is actually on screen. Every filter control inside this
   file used to call renderRegister() bare, which with two pages sharing the
   renderer would have turned Negotiations into Contracts on the first press of
   a dropdown — the scope reset to null by the argument nobody passed. */
function regRepaint(){ renderRegister(_regOpts); if(typeof regFolderPanelOn==='function'&&regFolderPanelOn()) ctfDockAgain(); }
/* ---- CONTRACTS BY FOLDER, AS DRAWN (the new look, round 6) ----
   The place opens on the company's own folders (streams): a card each says how many, the money on paper and how many
   are signed or in review, and what in it needs you, in words (needsYouOf, the one checklist), amber; a green dot where
   it is live. The archived and ended stand together in their own card ("Still searched"); "+ New folder" is the
   streams' own door in Settings. A card opens that folder's list (the register's own stream filter, R.type); the tab
   row Folders · All · Needs you is the page's views. Reads only. */
let _ctFolders = true;
/* Jambo's panel follows the page's face (the folders' reading, or the list's) */
function ctfDockAgain(){ if (typeof window.renderIntelDock === 'function') setTimeout(() => { try { renderIntelDock(); } catch (_){} }, 0); }
const CTF_WORDS = { sign:'ctf_n_sign', approval:'ctf_n_approval', details:'ctf_n_details', review:'ctf_n_review', note:'ctf_n_note', suggest:'ctf_n_suggest', look:'ctf_n_look', refused:'ctf_n_refused', quiet:'ctf_n_quiet', join:'ctf_n_join' };
function regFoldersOn(R){ return regHome() && typeof window.newLookOn === 'function' && newLookOn() && _ctFolders && (!R.type || R.type === 'all') && !R.only && R.view !== 'archived' && !String((state.reg && state.reg.query) || '').trim(); }
function regFolderRead(cs){
  const money = !(typeof canViewValues === 'function' && !canViewValues());
  const val = cs.reduce((s, c) => { try { const h = (typeof fxHome === 'function') ? fxHome(c) : { v: Number(c.value) || 0 }; return s + ((typeof fxIsPay === 'function' && fxIsPay(c)) || h.missing ? 0 : (Number(h.v) || 0)); } catch (_){ return s; } }, 0);
  const signed = cs.filter(c => typeof negoExecuted === 'function' ? negoExecuted(c) : c.status === 'Signed').length;
  const review = cs.filter(c => c.status === 'Under Review').length;
  const needs = {}; let needN = 0;
  cs.forEach(c => { let n = []; try { n = (typeof needsYouOf === 'function') ? needsYouOf(c) : []; } catch (_){ n = []; } if (n.length) needN++; n.forEach(x => { needs[x.kind] = (needs[x.kind] || 0) + (x.n || 1); }); });
  return { n: cs.length, val: money ? val : null, signed, review, needN, needs };
}
function regFolderNeedWords(r){
  const parts = Object.entries(r.needs).map(([k, n]) => CTF_WORDS[k] ? i18tn(CTF_WORDS[k], n, { n }) : '').filter(Boolean);
  return parts.slice(0, 2).join(', ');
}
function regFoldersHtml(){
  const live = (state.contracts || []).filter(c => c && !c._codeNamed);
  const fids = Object.keys(FOLDERS || {}).filter(f => (typeof canAccessFolder !== 'function' || canAccessFolder(f)));
  const ended = live.filter(c => c.archived || c.status === 'Declined' || (c.status === 'Signed' && c.expiry && typeof todayISO === 'function' && String(c.expiry).slice(0, 10) < todayISO()));
  const endIds = new Set(ended.map(c => c.id));
  const money = v => v == null ? '' : (typeof fmtMoneyShort === 'function' ? fmtMoneyShort(v) : String(v));
  const cards = fids.map(fid => {
    const cs = live.filter(c => c.folder === fid && !endIds.has(c.id)); if (!cs.length) return '';
    const r = regFolderRead(cs);
    const facts = [i18tn('ctf_n_contracts', r.n, { n: r.n }), r.val ? money(r.val) : '', [r.signed ? i18t('ctf_signed', { n: r.signed }) : '', r.review ? i18t('ctf_review', { n: r.review }) : ''].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
    const need = r.needN ? `<span class="ctf-need">${esc(i18tn('ctf_need_n', r.needN, { n: r.needN }))}${regFolderNeedWords(r) ? ' · ' + esc(regFolderNeedWords(r)) : ''}</span>` : `<span class="ctf-quiet">${esc(i18t('ctf_nothing'))}</span>`;
    const dots = (r.needN ? '<i class="ctf-dot is-need"></i>' : '') + ((cs.length - r.signed) > 0 || r.signed ? '<i class="ctf-dot is-live"></i>' : '');
    return `<button type="button" class="ctf-card" data-ctf-folder="${esc(fid)}"><span class="ctf-tab" aria-hidden="true"></span><span class="ctf-dots">${dots}</span>
      <b class="ctf-name">${esc(FOLDERS[fid].name || fid)}</b><span class="ctf-facts">${esc(facts)}</span>${need}</button>`;
  }).join('');
  const yrs = ended.map(c => String(c.signedAt || c.expiry || '').slice(0, 4)).filter(Boolean).sort();
  const endR = regFolderRead(ended);
  const endCard = ended.length ? `<button type="button" class="ctf-card" data-ctf-ended><span class="ctf-tab" aria-hidden="true"></span>
      <b class="ctf-name">${esc(i18t('ctf_ended'))}</b><span class="ctf-facts">${esc([i18tn('ctf_n_contracts', ended.length, { n: ended.length }), endR.val ? money(endR.val) : '', yrs.length ? (yrs[0] === yrs[yrs.length - 1] ? yrs[0] : i18t('ctf_years', { a: yrs[0], b: yrs[yrs.length - 1] })) : ''].filter(Boolean).join(' · '))}</span>
      <span class="ctf-quiet">${esc(i18t('ctf_ended_s'))}</span></button>` : '';
  const isAdmin = (typeof currentUser === 'function' && (currentUser() || {}).role === 'admin');
  const newCard = isAdmin ? `<button type="button" class="ctf-card is-new" data-ctf-new><b class="ctf-name">+ ${esc(i18t('ctf_new'))}</b><span class="ctf-facts">${esc(i18t('ctf_new_s'))}</span></button>` : '';
  const n = (cards.match(/data-ctf-folder/g) || []).length + (endCard ? 1 : 0);
  return `<div class="ctf-grid">${cards}${endCard}${newCard}</div><div class="ctf-foot">${esc(i18tn('ctf_foot', n, { n }))}</div>`;
}
if (typeof document !== 'undefined' && !document._ctfWired){ document._ctfWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const f = t.closest('[data-ctf-folder]');
    if (f){ e.preventDefault(); const R = regState(); R.type = f.getAttribute('data-ctf-folder'); _ctFolders = false; regRepaint(); ctfDockAgain(); return; }
    if (t.closest('[data-ctf-ended]')){ e.preventDefault(); const R = regState(); R.view = 'archived'; _ctFolders = false; regRepaint(); ctfDockAgain(); return; }
    if (t.closest('[data-ctf-new]')){ e.preventDefault(); if (typeof openSettingsAt === 'function') openSettingsAt('company'); return; }
    const tab = t.closest('[data-ctf-tab]');
    if (tab){ e.preventDefault(); const k = tab.getAttribute('data-ctf-tab'), R = regState();
      if (k === 'folders'){ _ctFolders = true; R.type = 'all'; if (R.view === 'archived') R.view = null; }
      else { _ctFolders = false; R.type = 'all'; R.view = k === 'needs' ? 'needs' : null; }
      regRepaint(); ctfDockAgain(); return; }
    if (t.closest('[data-ctf-back]')){ e.preventDefault(); const R = regState(); _ctFolders = true; R.type = 'all'; if (R.view === 'archived') R.view = null; regRepaint(); ctfDockAgain(); return; }
  });
}
function regFoldersHeadHtml(){
  const live = (state.contracts || []).filter(c => c && !c._codeNamed && !c.archived);
  const r = regFolderRead(live);
  const facts = [String(r.n), r.val ? i18t('ctf_on_paper', { v: typeof fmtMoneyShort === 'function' ? fmtMoneyShort(r.val) : String(r.val) }) : '', r.signed ? i18t('ctf_n_signed', { n: r.signed }) : ''].filter(Boolean).join(' · ');
  const may = (typeof canEdit !== 'function') || canEdit();
  return `<div class="ctf-head"><h2 class="ctf-h">${esc(i18t('nav_contracts'))}</h2><span class="ctf-hf">${esc(facts)}</span><span class="ctf-sp"></span>
      <button type="button" class="ctf-pill" data-ctf-show="list">${esc(i18t('ct_list'))}</button><button type="button" class="ctf-pill" data-ctf-show="wall">${esc(i18t('ct_wall'))}</button>
      ${may ? `<button type="button" class="ui-btn ui-btn-primary ctf-new" data-ctf-draft>${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5') : '+'}${esc(i18t('ctf_new_agreement'))}</button>` : ''}</div>
    <div class="apn-bar ctf-bar"><label class="apn-box">${typeof icon === 'function' ? icon('search', 'w-3.5 h-3.5') : ''}<input id="ctf-q" type="search" autocomplete="off" placeholder="${esc(i18t('lh_filter_ph'))}"></label><span class="apn-sp"></span>
      <button type="button" class="apn-tab is-on" data-ctf-tab="folders">${esc(i18t('ctf_tab_folders'))}</button><button type="button" class="apn-tab" data-ctf-tab="all">${esc(i18t('ctf_tab_all'))} <span>${r.n}</span></button>${r.needN ? `<button type="button" class="apn-tab" data-ctf-tab="needs">${esc(i18t('ctf_tab_needs'))} <span>${r.needN}</span></button>` : ''}
      <span class="ctf-hint">${esc(i18t('ctf_hint'))}</span></div>`;
}
if (typeof document !== 'undefined' && !document._ctfWired2){ document._ctfWired2 = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const s = t.closest('[data-ctf-show]');
    if (s){ e.preventDefault(); const R = regState(); _ctFolders = false; R.show = s.getAttribute('data-ctf-show') === 'wall' ? 'wall' : 'list'; regRepaint(); ctfDockAgain(); return; }
    if (t.closest('[data-ctf-draft]')){ e.preventDefault(); if (typeof openNewAgreement === 'function') openNewAgreement(); return; }
    if (t.closest('[data-ctf-upload]')){ e.preventDefault(); if (typeof pdDropDoor === 'function') pdDropDoor(); return; }
  });
  /* words typed in the box leave the folders for the list, the words carried (the register's own query) */
  document.addEventListener('input', e => {
    const q = e.target && e.target.id === 'ctf-q' ? e.target : null; if (!q) return;
    state.reg = state.reg || {}; state.reg.query = q.value; _ctFolders = false; regRepaint();
    setTimeout(() => { const b = document.getElementById('ct-q'); if (b){ b.focus(); try { b.setSelectionRange(b.value.length, b.value.length); } catch (_){} } }, 0);
  });
}
/* THE FOLDERS' PANEL, AS DRAWN: which folder holds the most work and which the most money (one sentence), each folder
   read across in one line, two doors (the busiest folder, everything in one list), and his remark where a party you
   deal with has no NDA on file (cuNdaMap, the Parties page's own reading) — all counted, no call */
function regFoldersUp(){ return typeof regFoldersOn === 'function' && regPlaceUp() && regFoldersOn(regState()); }
function regFoldersPanelHtml(){
  const live = (state.contracts || []).filter(c => c && !c._codeNamed && !c.archived);
  const rows = Object.keys(FOLDERS || {}).filter(f => (typeof canAccessFolder !== 'function' || canAccessFolder(f)))
    .map(fid => ({ fid, name: FOLDERS[fid].name || fid, cs: live.filter(c => c.folder === fid) })).filter(x => x.cs.length)
    .map(x => Object.assign(x, { r: regFolderRead(x.cs) }));
  const short = n => String(n).split(/\s+[&—-]\s+|\s+/)[0];
  const work = rows.slice().sort((a, b) => b.r.needN - a.r.needN)[0], rich = rows.slice().sort((a, b) => (b.r.val || 0) - (a.r.val || 0))[0];
  const head = work && work.r.needN ? i18t(rich && rich.fid !== work.fid && rich.r.val ? 'ctfp_head' : 'ctfp_head_single', { work: short(work.name), what: regFolderNeedWords(work.r) || i18tn('ctf_need_n', work.r.needN, { n: work.r.needN }), rich: rich ? short(rich.name) : '' }) : i18t('ctfp_quiet');
  const money = v => v == null ? '' : (typeof fmtMoneyShort === 'function' ? fmtMoneyShort(v) : String(v));
  const line = x => [String(x.r.n), x.r.val ? money(x.r.val) : '', x.r.needN ? i18tn('ctf_need_n', x.r.needN, { n: x.r.needN }) : (x.r.signed === x.r.n ? i18t('ctfp_all_signed') : '')].filter(Boolean).join(' · ');
  let gaps = [];
  try {
    const nda = typeof cuNdaMap === 'function' ? cuNdaMap() : new Map();
    const seen = new Set();
    live.forEach(c => { const n = String(c.counterparty || '').trim(); const k = typeof cuKeyOf === 'function' ? cuKeyOf(n) : n.toLowerCase();
      if (n && !seen.has(k) && !nda.has(k) && !(typeof ndaIs === 'function' && ndaIs(c))){ seen.add(k); gaps.push(n); } });
  } catch (_){ gaps = []; }
  const remark = gaps.length ? `<div class="apn-pj"><span class="apn-pdot" aria-hidden="true"></span><div><div class="apn-pcap">Jambo</div><p>${esc(i18tn('ctfp_nda', gaps.length, { n: gaps.length, list: gaps.slice(0, 2).join(' and '), first: String(gaps[0]).split(/\s+/)[0] }))}</p></div></div>` : '';
  return `<div class="apn-panel ctfp"><p class="apn-pl">${esc(head)}</p>
    <div class="apn-pcap">${esc(i18t('ctfp_across'))}</div>${rows.map(x => `<div class="apn-pr"><b>${esc(short(x.name))}</b><span>${esc(line(x))}</span><i></i></div>`).join('')}
    <div class="apn-pcap" style="margin-top:16px">${esc(i18t('ctfp_doors'))}</div>
    ${work ? `<p class="ctfp-door"><button type="button" class="pd2-link" data-ctf-folder="${esc(work.fid)}">${esc(i18t('ctfp_open', { name: short(work.name) }))}</button> <span>${esc(i18t('ctfp_free'))}</span></p>` : ''}
    <p class="ctfp-door"><button type="button" class="pd2-link" data-ctf-tab="all">${esc(i18t('ctfp_all'))}</button> <span>${esc(i18t('ctfp_free'))}</span></p>
    ${remark}</div>`;
}
function renderRegister(opts){
  const o=opts||{};
  /* a repaint of the page on screen (regRepaint hands its own options back)
     or an arrival (a door, Home drawing the place afresh) */
  const again=!!opts&&opts===_regOpts;
  _regOpts={ scope:o.scope||null, head:o.head||null, nav:o.nav||'register', hostId:o.hostId||'content', home:!!o.home&&!o.scope };
  regSetScope(o.scope);
  _regNarrowPaint=null; _regNarrowPaint=regHomeNarrow();
  _regWidePaint=null; _regWidePaint=regHomeWide();
  if(typeof queueMicrotask==='function') queueMicrotask(()=>{ _regNarrowPaint=null; _regWidePaint=null; }); else { _regNarrowPaint=null; _regWidePaint=null; }
  const HOME=regHome();
  const neg=regScope()==='negotiations';
  const R=regState();
  /* ON THE CONTRACTS PLACE R.page IS HOW FAR "Show 40 more" HAS GONE (Part
     8): a repaint of the place that is not a new narrowing (an answer column
     filled in, List | Wall) keeps the rows the reader opened, and every press
     that narrows sets it back to the first forty itself; an arrival starts at
     the first forty, as every paint of the other seats does */
  if(!(HOME&&again)) R.page=1;
  /* NEGOTIATIONS' LIST HEAD (Part 8) says what it reads before anything is
     drawn — its Columns decide which columns this paint draws; and so does
     the Contracts place's */
  if(neg) regNegoHeadReg();
  if(HOME) regCtHeadReg();
  /* the new look opens Contracts on its folders (round 6, as drawn) */
  if(regFoldersOn(R)){ const hostF=document.getElementById(_regOpts.hostId); if(!hostF) return;
    hostF.innerHTML=`<div class="sap-page ct-page ctf-page" data-reg-home="1">${regFoldersHeadHtml()}${regFoldersHtml()}</div>`;
    if(typeof window.renderIntelDock==='function') try{ renderIntelDock(); }catch(_){ }
    return; }
  const cs=regFiltered();
  /* WHICH SHAPE THIS PAINT DRAWS — the list inspector's, or the full table —
     asked ONCE and recorded on the page (data-ins), so a width that crosses
     the line repaints it (insWatchWidth) and nothing in one paint disagrees. */
  const INS=regInspecting();
  /* The page's own title row (Negotiations': negoListHeadHtml, which counts
     the whole live book itself, never the one tab on screen). */
  const headHtml=typeof o.head==='function' ? o.head(cs) : (o.head||'');
  /* A select left on `appearance:auto` is drawn by the platform, and the
     platform draws it with a hard dark edge and a square corner whatever the
     border says. Turning the appearance off hands the closed control back to
     us — soft grey edge, the same 8px corner the rest of the page uses, and
     our own chevron in place of the native arrow.

     The OPEN list is still the browser's own popup and cannot be styled from
     a page in any engine; only the closed control is ours to dress. */
  /* BASE64, NOT A RAW SVG. These styles are written into a style="" attribute,
     and a plain data URI carries the quotes the SVG's own attributes need —
     the first one closes the attribute and the whole rule is dropped, which is
     exactly what happened: the arrow vanished entirely. Base64 has no quotes
     in it, so it survives the trip into the attribute. */
  const selChevron='url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9zdmc+)';
  const selStyle='font:inherit;font-size:var(--t-meta);border:1px solid var(--field-line);background-color:var(--color-surface);border-radius:var(--radius);padding:5px 26px 5px 9px;color:inherit;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:'+selChevron+';background-repeat:no-repeat;background-position:right 8px center;background-size:12px';
  /* ---- ONE FILTER BAR, NOT THREE TIERS OF PILLS ----
     Stages, streams and quick filters used to be three full-width rows of pills
     (plus a legend band and an export band) stacked above the table — the
     register's own data started below the fold. Each filter is now a compact
     dropdown on a single row; an active one carries the accent border so a
     narrowed set is still visible at a glance, and Clear puts everything back. */
  /* ---- A FILTER SAYS WHAT IT FILTERS (owner-approved render, 24 Aug 2026) ----
     These were five bare dropdowns whose only label was a title attribute, so
     two of them reading "Any" sat side by side meaning different things and the
     only way to tell was to hover. The label is drawn above the control, which
     is the design's own arrangement; the SELECT keeps its id, its options and
     its title, so every handler and every test that reaches for it is
     untouched. The row aligns on flex-end, so a labelled control and a bare one
     (the clear button, the sort) still sit on one baseline. */
  /* ---- THE ACTIVE FILTER IS THE ONE CARRIER NOW, SO IT HAS TO BE READABLE ----
     The resting edge went neutral on 25 Aug (the reference's own treatment), so
     "this filter is narrowing your list" is carried by the accent border, the
     600 weight and the accent ink alone. The INK was `--color-accent-800`, and
     dark does not redefine the accent ramp — MEASURED, 2.35:1 on the night
     panel, where AA wants 4.5. `--accent-ink` is the same accent ink WITH a
     dark answer and measures 9.59:1; the button beside it has read it since
     23 Aug and this control simply never did. The BORDER is fine either way
     (4.77:1) and is untouched. */
  /* A FILTER IS A CHIP (second pass, 21 Sep 2026 — the reference frame). The
     label sits INSIDE the pill beside the control rather than above it, which
     REVERSES 24 Aug's "a label above every filter" on the owner's later
     drawing; the word and the box are still one <label>, the ids are
     untouched, and a narrowing filter lights the whole chip. */
  /* AT REST THE CHIP SAYS ITS NAME AND NOTHING ELSE (the reference's own
     shape: "▽ Stage"); its value shows once it narrows, or on the Sort chip,
     which always has one to say (`show`). This is what keeps the bar ONE LINE
     — the owner's standing ruling — at a laptop width. */
  /* ════ THE WHOLE CHIP IS THE CONTROL (Young reported it 21 Sep 2026:
     *"the highlighted filters do not work properly and have not been pipped
     properly as they do not work at all"*) ════
     MEASURED in a browser: the chip drew 93x30 and the <select> inside it drew
     22x28 in rgba(0,0,0,0) — an invisible sliver against the right wall — and
     the centre of the chip hit-tested to SPAN.reg-f-l. A press on a <label>
     does not open a native select's menu, so four of the five filters on this
     bar could only be opened by finding an unmarked 22px strip. The fault was a
     rule that shrank a resting chip's select to 22px so the chip would read as
     a word rather than a dropdown; it hid the control along with the value.

     THE SELECT COVERS THE CHIP AND IS INVISIBLE, and the WORD carries what is
     chosen. One reading — `selChosen` — so the face and the control can never
     disagree about what is in force, which is what the old rule made possible.
     Same id, same options, same change handler: nothing about the wiring moved.

     IT NO LONGER CARRIES `selStyle`. That inline block is a whole dropdown's
     dress — border, chevron, padding, its own font — and the old chip rules had
     to shout `!important` at every one of them to take it back off, which is
     how a rule shrinking the control to 22px came to look reasonable. An
     invisible overlay needs none of it, so the chip's own stylesheet wins by
     being the only thing talking. */
  const selChosen=o=>{ const m=/<option[^>]*\bselected\b[^>]*>([\s\S]*?)<\/option>/i.exec(String(o||''));
    return m?m[1].replace(/<[^>]*>/g,'').trim():''; };
  const selFilter=(id,opts,active,title,label,show)=>{
    const word=esc(label||title), pick=esc(selChosen(opts));
    /* The value is printed beside the word where it is NARROWING (the accent
       state) and where the caller asks for it always (Sort). At rest the chip
       is the word alone — the reference's own shape. */
    const face=((active||show)&&pick)?`${word} <b>${pick}</b>`:word;
    /* THE WORD AND ITS CARET, NO FUNNEL (26 Sep 2026, the Inspector drawing:
       "Stage ⌄"). The bar sits on the list's own card now, beside the panel,
       and the funnel on every chip cost the row the width it no longer has;
       the caret (drawn by the sheet) already says the chip opens. */
    return `<label class="reg-f reg-chip${active?' on':''}${show?' reg-chip-show':''}" title="${esc(title)}"><span class="reg-f-l">${face}</span><span class="reg-f-v">${pick||word}</span><select id="${id}" class="reg-chip-sel" title="${esc(title)}">${opts}</select></label>`;
  };
  const stageOpts=REG_STAGES.map(s=>`<option value="${s.k}" ${R.stage===s.k?'selected':''}>${s.label}</option>`).join('');
  const typeOpts=regTypes().map(t=>`<option value="${t.k}" ${R.type===t.k?'selected':''}>${t.label}</option>`).join('');
  /* ---- RENEWAL IS BACK, AND IT IS OFF THE BAR BY DEFAULT ----
     Recovered unchanged from before WO-15 removed it, except that it now goes
     through selFilter like the other six rather than carrying its own copy of
     the markup — one builder is what stops them drifting. Every key it needs
     was still in both dictionaries. */
  const renewalActive=!!R.renewal&&R.renewal!=='all';
  const renewalOpts=[['all',i18t('reg_any')],['auto-renew',i18t('reg_renew_auto')],
                     ['fixed',i18t('reg_fixed')],['evergreen',i18t('reg_evergreen')]]
    .map(([k,l])=>`<option value="${k}" ${(R.renewal||'all')===k?'selected':''}>${l}</option>`).join('');
  /* THE BANDS ARE THE PAYMENT TERMS TAB'S OWN (PAY_BUCKETS), never a second
     ladder typed out here — the graph lens already borrows them for the same
     reason. A fixed ladder, so unlike the Signed years there is nothing to
     strand: every option this control can hold is always on its list. */
  const holdActive=!!R.hold&&R.hold!=='all';
  /* ════ AND IT HAS TO BE OPTIONS, NOT A LIST (Young reported it 19 Sep 2026)
     "The on hold filter has a bug and also pops up as a tiny drop down filter
     with no width." ONE FAULT, BOTH HALVES. Every other filter on this bar
     ends with the .map that turns its pairs into <option> markup; this one was
     pasted in without it, so the raw array was interpolated into the <select>
     as bare text, the browser discarded it, and the control drew with ZERO
     options — which renders at its minimum width and can never be switched on.
     Nothing errors: an empty select is legal markup. */
  const holdOpts=[['all',i18t('reg_any')],['on',i18t('reg_f_hold_on')],['off',i18t('reg_f_hold_off')]]
    .map(([k,l])=>`<option value="${k}" ${(R.hold||'all')===k?'selected':''}>${esc(String(l))}</option>`).join('');
  /* FOUR STATES AND "NONE", read off obligationDocState's own answers so the
     control cannot offer a state the reading does not give. (Moved back over
     the code it describes: the hold pair was pasted in BETWEEN this note and
     its own lines, which is how that pair came to lose its .map unnoticed.) */
  const docsActive=!!R.docs&&R.docs!=='all';
  const docsOpts=[['all',i18t('reg_any')],['lapsed',i18t('reg_docs_lapsed')],
                  ['missing',i18t('reg_docs_missing')],['soon',i18t('reg_docs_soon')],
                  ['none',i18t('reg_docs_none')]]
    .map(([k,l])=>`<option value="${k}" ${(R.docs||'all')===k?'selected':''}>${esc(String(l))}</option>`).join('');
  const ptActive=!!R.payterms&&R.payterms!=='all';
  const ptOpts=(()=>{
    const bands=(typeof PAY_BUCKETS!=='undefined'&&Array.isArray(PAY_BUCKETS))?PAY_BUCKETS.map(b=>b.k):[];
    const cur=R.payterms||'all';
    return [['all',i18t('reg_any')]]
      .concat(bands.map(k=>[k,`${k} ${i18t('pt_days')}`]))
      .concat([['none',i18t('reg_payterms_none')]])
      .map(([k,l])=>`<option value="${k}" ${cur===k?'selected':''}>${esc(String(l))}</option>`).join('');
  })();
  const BAR=regBarShown(R);
  /* the named set's chip (regOnlyChipHtml, one builder for both seats) */
  const onlyChip=regOnlyChipHtml(R);
  /* ---- AND THE LOCKED ONE, WHICH SAYS WHAT THE PAGE IS ----
     It wears the accent like the chip above it and carries a padlock, and it
     has no ✕ because there is nothing to remove: it is not a filter the reader
     chose. It leads the bar so everything to its right is plainly a narrowing
     WITHIN live negotiations. */
  /* ---- NO LOCKED CHIP (owner-asked 24 Aug 2026: "delete the highlighted
     filters so that there is enough space for all the filters to be on one
     line") ----
     It was never a filter — a padlock with no way to clear it, saying what the
     page IS. THE BETTER REASON TO REMOVE IT IS NOT THE SPACE: the heading
     directly above already reads "Negotiations" with a live count beside it,
     and the sentence under that says the same thing again, so the chip was a
     third statement of one fact. The SCOPE is untouched — it belongs to the
     page, not to the chip, and regFiltered applies it first whatever the bar
     draws. `lockChip` and `#reg-lock-chip` are retired — flag any mention. */
  const lockChip='';
  /* never Signed on the Negotiations seat (regSortOptsHtml says why) */
  const sortOpts=regSortOptsHtml(R,neg);
  // Clickable, sortable column header: shows a dim ↕ when inactive and a solid
  // ▲/▼ for the active sort direction. Clicking toggles asc/desc (see wiring below).
  /* A SORT ARROW ONLY ON THE COLUMN THE LIST IS SORTED BY (26 Sep 2026, the
     list options' floor). A dim ↕ on every other head was eight marks saying
     "this can be sorted", which the pointer and the hover already say; one
     arrow now answers the only question worth a mark — which way is it
     sorted. The heads still sort on a press, by keyboard too. */
  const sortCaret=key=>R.sort===key
    ? `<span style="margin-left:var(--s-1);font-size:var(--t-figure);color:var(--accent-ink-700)">${R.dir===1?'▲':'▼'}</span>`
    : '';
  /* ---- A COLUMN HEAD IS A CONTROL, SO IT TAKES THE KEYBOARD ---- (25 Aug 2026)
     It carried a click, a pointer cursor and aria-sort — everything except a
     way to press it without a mouse. role="button" and a tab stop are what
     make the existing handler reachable; Enter and Space are wired beside the
     click rather than in it, because a <th> is not a <button> and fires
     neither by itself. */
  /* ---- THE WIDTHS COME OFF ONE LIST AND THE GRIP RIDES THE HEAD ----
     `colAt` hands each head its own width and its own grip, so a column can
     never be given a width in one place and a grip in another. The grip is a
     SEPARATE control inside the head: the head itself sorts, and a press on
     the grip must never sort, which is what its own handler's stopPropagation
     buys. The last column gets none — it has nothing to its right. */
  /* THE READER'S OWN COLUMNS ON NEGOTIATIONS (Columns, Part 8): a set they
     chose is cut by key (regColWidths) and draws no grips — a stored drag is
     by position, the seat's own order only */
  const negChosen=neg&&!INS&&regNegoColsChosen(regColKeys());
  const COLW=regColWidths();
  let _colN=0;
  /* IN THE INSPECTOR'S SHAPE the three short columns hold a width in pixels
     and the counterparty takes the rest — and there are no grips: four
     columns, one of them the give, have nothing worth dragging. */
  const gripFor=i=>(INS||i>=COLW.length-1) ? '' : negChosen ? '' :
    `<span class="reg-grip" data-reg-grip="${i}" role="separator" aria-orientation="vertical" tabindex="0"
       title="${esc(i18t('reg_col_drag'))}" aria-label="${esc(i18t('reg_col_drag'))}"></span>`;
  const colAt=(extra='',k)=>{ const i=_colN++;
    if(INS){ const fw=neg&&regNegoFit()?regNegoFit().w[k]:null; const px=fw||REG_INS_COL_PX[k]; return `${px?`width:${Math.round(px)}px;`:''}${extra}`; }
    return `width:${COLW[i]}%;${extra}`; };
  const sortableTh=(key,label,extra='',k)=>{ const i=_colN;
    return `<th class="reg-th-sort${R.sort===key?' active':''}" data-reg-sort="${key}" role="button" tabindex="0" title="${i18t('reg_sort_by',{col:label})}" aria-sort="${R.sort===key?(R.dir===1?'ascending':'descending'):'none'}" style="cursor:pointer;user-select:none;${colAt(extra,k)}">${label}${sortCaret(key)}${gripFor(i)}</th>`; };
  const catActive=!!(R.category&&R.category!=='all');
  /* ---- THE SIGNED FILTER'S OWN OPTIONS (J-5.1) ----
     "This year" and "Last year" lead, then the years this book was actually
     signed in, newest first. Never an empty year: the list comes off
     regSignedYears, which reads the whole book. A year already covered by one
     of the two leading options is not offered twice. */
  const signedActive=!!(R.signed&&R.signed!=='all');
  const signedYears=regSignedYears();
  const nowY=String(new Date().getFullYear()), lastY=String(new Date().getFullYear()-1);
  const signedOpts=(()=>{
    const opts=[['all',i18t('reg_any')]]
      .concat(signedYears.includes(nowY)?[['this',i18t('reg_signed_this_year')]]:[])
      .concat(signedYears.includes(lastY)?[['last',i18t('reg_signed_last_year')]]:[])
      .concat(signedYears.filter(y=>y!==nowY&&y!==lastY).map(y=>[y,y]));
    /* ---- THE CUT IN FORCE IS ALWAYS ON THE LIST ----
       The stream picker's own rule, in this file's own words: "a picker keeps a
       record's CURRENT stream even when out of reach, or reopening silently
       re-files it." Here the same shape strands the READER rather than the
       record. The years come off the book, so a cut can leave the list under a
       reader who has chosen it — the last contract signed in 2021 is deleted,
       or a page is left open over New Year and "This year" resolves to a year
       nothing is signed in yet. The select would then show "Any" while the list
       was still narrowed and empty: the control saying one thing and the table
       another, which is the fault the WHOSE ASKS label was built to prevent.
       So the chosen value is appended when nothing else offers it, and it is
       LABELLED WITH ITS YEAR rather than "This year" — the year is the fact,
       and the phrase would be describing a window it no longer names. */
    const cur=R.signed||'all';
    if(cur!=='all' && !opts.some(([k])=>k===cur)) opts.push([cur, regSignedYear(cur)]);
    return opts
      .map(([k,l])=>`<option value="${k}" ${cur===k?'selected':''}>${esc(String(l))}</option>`).join('');
  })();
  const catOpts=[['all',i18t('reg_any')]].concat(regCategories().map(k=>[k,regCatLabel(k)]))
    .concat([['none',i18t('reg_uncategorised')]]);
  /* These two already carried a visible label, inline to the left of the
     control. They take the same stacked label as the three above so the bar
     reads as one row of filters rather than two conventions. */
  /* ---- AND IT GOES THROUGH selFilter LIKE THE OTHER SEVEN (21 Sep 2026) ----
     It was a hand-written second copy of the chip's markup, and that is exactly
     what THE CLOTHES FOLLOW THE BUILDER warns about: the day the chip's control
     was made reachable end to end, seven chips were fixed and this one was not —
     MEASURED, a press on the left third of this chip still landed on a span and
     opened nothing. One builder, or they drift again. */
  const categorySel=selFilter('reg-category',
    catOpts.map(([k,l])=>`<option value="${k}" ${(R.category||'all')===k?'selected':''}>${esc(String(l))}</option>`).join(''),
    catActive, i18t('me_category'));
  /* ---- NO RENEWAL FILTER (owner-asked 24 Aug 2026, twice: "delete ... the
     filter i have highlighted", and again for the Negotiations seat) ----
     THE CONTROL GOES AND THE READING STAYS. regFiltered still knows how to
     narrow by renewal type, which costs nothing and keeps the shape two other
     files read; what is gone is the only thing that ever SET it, so the filter
     can never be quietly on. `renewalSel` is retired — flag any mention.
     DIVERGES FROM THE DESIGN REFERENCE, which draws Renewal type as one of its
     five filter chips and shows it in its active state. The owner's ruling. */
  // Server-mode full-text search + semantic ask live in a secondary strip (the
  // command bar owns the primary search); kept here so FTS wiring stays intact.
  /* ---- SEARCH IS THE FIRST FILTER, NOT A STRIP OF ITS OWN (owner-asked
     24 Aug 2026, off the design's own filter bar) ----
     It sat on a second row under the five dropdowns, which made a reader scan
     two lines to find out how the list was narrowed and left the box looking
     like a leftover. It is a labelled control in the same row now, FIRST,
     which is where the design puts it. The dropdown it opens (#reg-fts) is
     absolutely positioned against this wrapper, so the wrapper keeps
     position:relative and the whole suggestion list follows it unchanged. */
  /* ---- ONE SEARCH BOX, AND IT IS THE SHELL'S ----
     Owner-reported off a screenshot with both ringed (M-5, Negotiations), and
     then of the Contracts page in the same words (N-3, 31 Aug 2026): *"remove
     the search open text field in the contracts page."* The shell bar's box
     says "Search contracts, clauses, counterparties…" and this one said
     "Full-text: names, parties & clauses…" — two controls answering almost the
     same question, one directly above the other.

     THIS REVERSES M-5's OWN "CONTRACTS KEEPS ITS BOX" IN PLACE. That line was
     right about the ASK — the owner named Negotiations and only Negotiations —
     and it is the owner who has now named the other seat. Neither draws one.

     SO IT IS NOT A SCOPE QUESTION ANY MORE and the guard goes rather than
     flipping: one renderer draws both pages, neither wants the box, and a
     condition that is false on every seat is a condition the next reader has to
     rule out. THE FTS WIRING IS NOT DELETED — every handler already guards on
     the element existing (`if(si)`, `if(!box) return`, `if(rs&&…)`), so there
     is no second code path to keep in step and the full-text search behind the
     shell's own box is untouched.

     `reg_search` and `reg_search_ph` are STALE as visible text on both seats.
     Left INERT in BOTH dictionaries, because a key removed from one and not the
     other is how a screen ends up half-English. */
  const ftsBlock='';

  /* THE FILTER BOXES, ONE MARKUP FOR BOTH HEADS: the page's band, and the
     Contracts place's head on Home (the overnight work order, step 7). */
  const fbBoxes=`
        ${onlyChip}
        ${ftsBlock}
        ${''/* ---- ONLY THE CHOSEN FILTERS DRAW, PLUS ANY THAT ARE NARROWING ----
               regBarShown() is the union: what this reader put on their bar,
               and anything currently cutting the list whether they chose it or
               not. The second half is the safety property — a hidden control
               quietly shortening the book is the exact fault WO-15's removal
               note was guarding against. */}
        ${''/* STAGE: a box on the Negotiations seat and on the Contracts place
               (its tabs' six, counted, regStageOptsHtml); the full Contracts
               table keeps its tab row instead. */}
        ${(neg&&BAR.includes('stage'))?selFilter('reg-stage-sel',stageOpts,R.stage!=='all',i18t('reg_lifecycle_stage'),i18t('reg_chip_stage')):''}
        ${(!neg&&HOME&&BAR.includes('stage'))?selFilter('reg-stage-sel',regStageOptsHtml(R),R.stage!=='all',i18t('reg_lifecycle_stage'),i18t('reg_chip_stage')):''}
        ${BAR.includes('type')?selFilter('reg-type-sel',typeOpts,R.type!=='all',i18t('reg_value_stream'),i18t('reg_chip_stream')):''}
        ${BAR.includes('category')?categorySel:''}
        ${BAR.includes('renewal')?selFilter('reg-renewal',renewalOpts,renewalActive,i18t('reg_renewal')):''}
        ${''/* NEVER ON THE NEGOTIATIONS SEAT: that page holds live negotiations,
               and narrowing them by the year they were signed would be a
               control whose only outcome is an empty page. */}
        ${(!neg&&BAR.includes('signed'))?selFilter('reg-signed',signedOpts,signedActive,i18t('reg_signed_title'),i18t('reg_signed')):''}
        ${BAR.includes('payterms')?selFilter('reg-payterms',ptOpts,ptActive,i18t('reg_payterms_title'),i18t('reg_payterms')):''}
        ${BAR.includes('docs')?selFilter('reg-docs',docsOpts,docsActive,i18t('reg_docs_title'),i18t('reg_docs')):''}
        ${BAR.includes('hold')?selFilter('reg-hold',holdOpts,holdActive,i18t('reg_f_hold_title'),i18t('reg_f_hold')):''}
        ${''/* QUICK FILTERS LAST (owner, 16 Oct 2026). The long sentence is the
               TOOLTIP, not the label — used as a label it ran to 460px and
               pushed the whole bar off the row. */}
        ${(!neg&&BAR.includes('view'))?selFilter('reg-view-sel',regViewOptsHtml(R,{ home:HOME }),(!!R.view&&!(HOME&&R.view==='archived'))||regSavedViews().some(v=>regSavedMatches(v,R)),i18t('reg_quick_filters_title'),i18t('reg_quick_filters')):''}
`;
  const adaptBtn=`
        ${''/* THE DOOR TO THE REST. A link rather than a button, because it
               opens a chooser rather than acting on the list — the same
               weight Fiori gives it. */}
        <button id="reg-adapt" type="button" class="reg-chip reg-chip-btn reg-chip-add" title="${esc(i18t('reg_adapt_title'))}">${icon('plus','w-3.5 h-3.5')}${esc(i18t('reg_adapt'))}</button>
`;
  const clearSlot=`<span id="reg-clear-slot">${regClearHtml()}</span>`;
  /* THE PLACE ON HOME NEVER FALLS BACK TO THE PAGE AREA: a repaint asked
     after the reader left Home draws nothing rather than a list over it */
  const hostEl=document.getElementById(_regOpts.hostId)||(HOME?null:document.getElementById('content'));
  if(!hostEl) return;
  hostEl.innerHTML=`
  ${''/* ---- THE WRAPPER READS THE SAME TOKENS THE BAND CANCELS (25 Aug 2026)
         ----
         Owner-reported, off a screenshot of Contracts on a laptop: "there is
         still a grey gap in the card that needs to be eliminated." The band
         bleeds to the view's edge by pulling the view's own padding back —
         `margin:calc(var(--page-pad-t) * -1) calc(var(--page-pad-x) * -1)` —
         and this wrapper TYPED 14px and 16px. The two only cancelled by luck,
         at the one window height where --page-pad-t happens to be 16.
         THE DAY --page-pad-t STARTED TIGHTENING WITH THE WINDOW, THE LUCK RAN
         OUT: on a laptop it is 10, so the band began 14 - 10 = 4px BELOW the
         head's bottom edge and the page ground showed through as a strip
         across the card. At the very short step it is 6px. MEASURED at 800:
         a 4px grey band the full width of the page.
         The bottom stays a typed 14 — it is the gap above the table, not a
         join with anything. */}
  ${HOME?`<div class="sap-page ct-page" data-reg-home="1" data-ct-show="${esc(R.show==='list'?'list':'wall')}">`
  :`<div class="view-enter sap-page${neg?' ngl-page':''}" data-ins-page="register" data-ins="${INS?'1':'0'}" style="height:var(--view-h);box-sizing:border-box;padding:var(--page-pad-t) var(--page-pad-x) var(--ngl-pb,14px);display:flex;flex-direction:column">`}
    <style>
      /* ---- THE PROTOTYPE'S TABLE ----
         The reference is a rounded card with an uppercase 10px header band, p-4
         cells, hairline dividers between rows and a hover tint. Written in the
         design's tokens rather than its raw slate classes so the same rules
         carry the dark theme — the header band used to be a hardcoded var(--color-neutral-100),
         which is a light-mode value sitting on a dark surface. */
      /* ---- THE LINE DESIGN (owner-approved mockup, 20 Aug 2026) ----
         Measured off the owner's own HTML: a flat white table ruled by
         hairlines, an uppercase 10.5/700 header on the surface itself (no
         grey band), teal tracking numbers, regular-weight titles with the
         document KIND on a quiet second line, the stream tick beside the
         title rather than on the row's edge, and a tighter row. */
      /* ---- THE ROWS COME DOWN ONE RUNG (owner-asked 24 Aug 2026: "reduce
         the font by a size in the contracts page list of contracts and the
         negotiations page list of contracts", ruled yes when told the cost) ----
         14px to 13. EVERY CELL DROPS TOGETHER — the 23 Aug ruling flattened
         this row to one size and one weight and flat-rows-and-alerts-verify
         pins exactly that, so a partial drop would fail it honestly. Five of
         those cells are INLINE styles and had to move in the markup; a class
         rule cannot reach them. The document kind stays SMALLER than the row,
         which is that check's other half.
         DIVERGES FROM THE DESIGN REFERENCE, whose type scale puts table row
         text at 14px. Recorded as the owner's ruling.
         ---- AND THE RUNG WAS LOST IN THE TOKEN RE-RAMP (Young ruled 21 Sep
         2026: "contracts need to look exactly like the artifact") ----
         That ruling was 14 to THIRTEEN, written as the meta token, which was
         13px on the day. The redesign's ladder made that token 12, so the row
         quietly went one rung further than anybody ruled and MEASURED 12px
         against the reference's 13. It reads the body token now, which is the
         reference's own body rung and the owner's own number, and cannot
         drift again. NO BACKTICK MAY BE WRITTEN IN THIS BLOCK — it is emitted
         from a template literal and a balanced pair evaluates what is
         between them. */
      .reg-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:var(--t-body)}
      .reg-table thead th{position:sticky;top:0;z-index:3}
      /* ---- THE GRIP (owner-asked 31 Aug 2026) ----
         It hangs on the head's RIGHT EDGE and overhangs it by 3px, so the
         hit area straddles the rule between two columns exactly as a
         spreadsheet's does. The sticky rule above already makes the head a
         positioned element, so this anchors to it without the head needing a
         relative position of its own — which would have broken the sticky
         heading. NO BACKTICKS IN A COMMENT HERE: this stylesheet is returned
         from a JS template literal and one ends the string.
         AT REST IT DRAWS NOTHING. The hairline between the columns is already
         there and a second mark for it would be the same fact twice; what
         appears on hover is the ACCENT, which is how this product says "this
         is a control". */
      ${''/* IT SITS WHOLLY INSIDE THE HEAD, and that is not a preference.
             MEASURED: hung over the edge at right:-3px its centre landed on
             the clipped side of the head's own overflow:hidden (the "a cut
             cell says so" rule, three hundred lines down), elementFromPoint
             returned the TH, and the grip could not be taken hold of at all —
             a control that looks perfectly correct in the source and is
             unreachable with a mouse. Never give it a negative offset. */}
      .reg-grip{position:absolute;top:0;right:0;width:10px;height:100%;
        cursor:col-resize;z-index:4;background:none;border:0;padding:0;display:block}
      .reg-grip::after{content:'';position:absolute;right:2px;top:22%;height:56%;width:1px;
        background:transparent;transition:background var(--dur-1)}
      .reg-grip:hover::after,.reg-grip:focus-visible::after,.reg-grip.is-drag::after{
        background:var(--accent-ink)}
      .reg-grip:focus-visible{outline:none}
      /* While a drag is running the whole page takes the resize cursor, so it
         does not flicker back to a pointer the moment the hand leaves the 7px
         strip — which at speed is most of the drag. */
      .reg-grip.is-drag::after{width:2px;right:1px}
      /* ---- THE COLUMN HEADS ARE NOT SHOUTED (owner-asked 24 Aug 2026: "the
         headers highlighted should not be in capital letters apart from the
         first letters of the words", then ruled: only the first) ----
         The capitals were never typed — this rule forced them. The tracking
         goes with them: letter-spacing exists to make capitals readable and
         reads loose on ordinary words.
         SENTENCE CASE IS THE SIMPLER RULING, and it costs Swedish nothing:
         Swedish already writes these heads with one capital, so it does not
         move at all, and only two English heads change. One rule, both
         languages, nothing to keep in step.
         DIVERGES FROM THE DESIGN REFERENCE, which states uppercase column
         headers twice — in its type scale and again in its letter-spacing
         rule. The owner has seen both and ruled. Recorded, not drift.
         ---- REVERSED BY THE REDESIGN, AND SAID OUT LOUD HERE (21 Sep 2026)
         ---- the redesign wrote a second rule for this same head in HaTi's own sheet
         that states uppercase and .06em, at the same weight and later in the
         page, so the capitals came back in August and this note went on
         describing a screen that no longer existed. The owner has now ruled
         for the artifact, which is uppercase. ONE RULE STATES IT — the
         two halves are folded together here, so no reader has to work out
         which sheet won. The size is the reference's own micro rung; the
         ink stays HaTi's secondary rather than the reference's third,
         because the owner asked for less faint grey, not more. */
      ${''/* ---- AND SENTENCE CASE AGAIN (Young picked the Inspector drawing,
             26 Sep 2026) ---- the list options' floor: "plain column names,
             and a sort arrow only on the column the list is sorted by". The
             drawing's heads are ordinary words at the label size and weight
             in the secondary ink, so the capitals and their tracking go —
             this REVERSES 21 Sep's uppercase on the owner's later word, as
             that ruling reversed 24 Aug's. The heads stay the heads by being
             the one row set apart by a rule, not by shouting. */}
      .reg-table th{text-align:left;font-size:var(--t-label);font-weight:var(--w-label);
        text-transform:none;letter-spacing:0;
        color:var(--color-neutral-600);padding:var(--s-2) var(--pad-row-x);
        border-bottom:1px solid var(--color-divider);white-space:nowrap;
        background:var(--color-surface)}
      /* ---- THE ROW IS THE DENSITY LEVER ----
         MEASURED at 55.39px against every enterprise grid in circulation
         (Fluent 44, AG Grid / Atlassian 40-42, Material compact / Salesforce
         32-36), which put 11.6 rows of a 40-row page on a 1440x900 laptop and
         8.2 on a 1366x768 one. The height is 4 + 20 + 16 + 4 + 1 = 45px, and
         it is DECLARED rather than emergent: the two line boxes below are what
         make the arithmetic hold, because with no line-height the two lines
         inherited 1.5 and the padding could not reach the number on its own. */
      ${''/* overflow:hidden is what makes a stated width bite. Several cells
             carry nowrap content, and in a fixed layout a child wider than its
             column spills over the one beside it rather than widening the
             table — so the clip is not decoration, it is the other half of the
             rule above. */}
      .reg-table td{padding:var(--pad-row);border-bottom:1px solid var(--rule);vertical-align:middle;
        overflow:hidden}
      .reg-table tbody tr:last-child td{border-bottom:0}
      .reg-table tbody tr{transition:background var(--dur-1)}
      .reg-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
      /* ---- THE KEYBOARD'S OWN ROW, AND WHY IT IS NOT AN OUTLINE ----
         With border-collapse:collapse a <tr> paints no box of its own, so an
         outline or a border on the row draws nothing at all — the cells own
         the edges. Two inset shadows on every cell give one continuous rule
         across the whole row instead of a box per cell, which is what an
         outline would have looked like if it had worked.
         :focus-visible, so a mouse press never draws it — the arrows and Tab
         do. --focus-color, so it follows the theme like every other ring
         (and it now has a dark answer, 25 Aug). */
      .reg-table tbody tr[data-row]:focus{outline:none}
      .reg-table tbody tr[data-row]:focus-visible td{
        background:color-mix(in srgb,var(--color-text) 6%,transparent);
        box-shadow:inset 0 2px 0 var(--focus-color),inset 0 -2px 0 var(--focus-color)}
      /* The tracking number leads the row, so it is set in the figure face and
         never wraps — an id that breaks across two lines stops being an id.
         Teal, like the mockup: the id is the row's own link-coloured handle. */
      /* ---- ONE SIZE, ONE WEIGHT, EVERY COLOUR KEPT (owner-asked 23 Aug 2026,
         off a render: "apart from the headers, the letters and numbers in the
         rows are all not bold and the same font size but the font colour
         differences are still intact") ----
         SEVEN things in a row were set larger or bolder than their neighbours
         and every one of them is 14px regular now: this reference, the status
         word, the urgent expiry date, the "· 7 d" countdown, the row's verb,
         the ⋯ and — on Negotiations — the whose-move words. NOT ONE COLOUR
         MOVED: the teal reference, the three status washes, the ruby and amber
         countdowns, the three whose-move inks and the stream tick are all
         exactly what they were.
         THE HEADERS ARE THE EXCEPTION AND THAT IS THE POINT — the column heads
         and the three group headings on Negotiations keep their 700 and their
         letter-spacing, because with every row reading at one weight they are
         the only thing left telling a heading from a row.
         THE DOCUMENT KIND STAYS AT 12px (owner-chosen off the render, having
         been shown it at 14): it is a second line under the title, and at the
         title's own size it competes with the title and costs every row four
         pixels of height. It is the one place in a row where a size difference
         is carrying something. */
      .reg-table{--reg-row-h:36px}   /* the fallback; regDensityVars overrides it per render */
      ${''/* THE REFERENCE IS NOT A LINK (26 Sep 2026, the list options' floor:
             "the reference stops being link-blue; the whole row is the way
             in"). It was the accent ink on every row, which read as a column
             of links that each did the same thing as the row around them. The
             row's own quiet ink now, and the accent only on the SELECTED row,
             where it marks which contract the panel is describing. */}
      ${''/* one size smaller, at 500, as the second mockup draws it (Young, 7 Oct 2026) */}
      .reg-mk{font-family:var(--font-ref);font-size:var(--t-label);font-weight:var(--w-label);
        color:var(--color-neutral-600);white-space:nowrap;font-variant-numeric:tabular-nums}
      /* The status chip, flattened HERE and not at .badge — that class dresses
         every card, list and panel in the product, and this is a decision about
         a table row. The wash and the ink are untouched. */
      .reg-table .badge{font-size:var(--t-body);font-weight:var(--w-body)}
      /* THE CONTRACT'S NAME IS THE ROW'S SUBJECT (21 Sep 2026): the
         reference's own title cell is 13/500, one step up from the cells
         beside it, so the eye runs down the names. The 23 Aug one-size,
         one-weight ruling was about SIZE — every cell is still 13px. */
      .reg-title{font-weight:var(--w-strong);color:var(--color-text);line-height:var(--row-line-1)}
      /* HOW MANY MORE PARTIES. A figure, so it is in the figure face, and it
         takes no press — the list is on the cell's own hover. */
      .reg-py-n{font-family:var(--font-mono);font-size:var(--t-label);font-weight:var(--w-body);
        color:var(--color-neutral-600);border:1px solid var(--color-divider);border-radius:var(--radius);
        padding:0 4px;margin-left:5px;flex:none}
      /* ---- THE ROW IS ONE LINE AND 36px (owner-ruled 24 Aug 2026) ----
         The cell padding is what sets it: 8px above and below a 20px line box
         is 36, which is the design's own --row-h. It was 4px above and below
         TWO line boxes (20 + 16) and measured 45. THE NUMBER IS NOT TYPED ON
         THE ROW — it falls out of the padding and the line, so a type change
         moves the row with it instead of clipping inside a fixed height.
         .reg-kind is RETIRED with the second line — flag any mention as stale. */
      /* THE HEIGHT IS STATED, AND ON A TABLE CELL THAT IS A FLOOR RATHER THAN A
         CAP — a td grows past its own height when its content needs to, which
         is what makes this safe where it would not be on a div. It is stated
         because the arithmetic alone does not land: with 8px of padding above
         and below a 20px line the row still measured 38.2, because an
         inline-flex child sits on the BASELINE and the strut adds its descender
         space underneath. Measured at each step rather than assumed. This is
         also the design's own rule (--row-h). */
      /* ---- A CUT CELL SAYS SO (WO-9, 24 Aug 2026) ----
         The sideways scroll is gone — table-layout:fixed above bounds the
         table to its container, measured at 0 overflow at 1152/1280/1366/1440/
         1920 in both languages. WHAT WAS LEFT IS THE OTHER HALF OF THE OWNER'S
         REPORT: "words disappear to the right of the tables". A fixed layout
         cuts a cell whose content is too wide, and with no text-overflow the
         words simply STOP — measured, 8 to 16 cells a page at laptop widths,
         which is exactly the cut-off WHOSE MOVE column in the screenshot.
         THE REFERENCE'S OWN RULE, TYPOGRAPHY.md section 6: "Every table cell
         that holds a name, a title or free text: min-width:0; white-space:
         nowrap; overflow:hidden; text-overflow:ellipsis on the cell", and
         "Column header cells: same three properties, so a header label can
         never overlap its neighbour when tracks compress." So this is a
         correction toward the design, not a workaround.
         NOTHING IS LOST SILENTLY: every cell that can be cut already carries
         its full text on hover, and the ellipsis is what says there is more. */
      /* PADDING AND LEADING MOVE WITH THE HEIGHT — see REG_DENSITY. The
         fallbacks are the historic values, so a table rendered before the
         mode existed (or by a caller that does not set it) draws exactly as
         it always did. */
      .reg-table td{height:var(--reg-row-h);padding:0 var(--reg-row-px,var(--pad-row-x));
        line-height:var(--reg-row-line,var(--row-line-1));
        overflow:hidden;text-overflow:ellipsis}
      .reg-table th{overflow:hidden;text-overflow:ellipsis}
      /* ---- EXCEPT THE CELL THAT HOSTS THE ROW MENU (owner-reported 25 Aug
         2026: "the 3 dots at the end were a filter where I had options to
         archive delete and so forth. What has happened to that feature?") ----
         The row menu is a position:absolute pop-up INSIDE its cell, which is
         position:relative so the menu hangs off it. overflow:hidden clips
         an absolutely-positioned child to its clipping ancestor, so the rule
         above cropped a 180x234 menu down to the 35x36 cell — MEASURED, 27x2
         pixels of it survived. The button still worked and all seven rows were
         still in the DOM; the menu was simply invisible.
         THE REFERENCE'S OWN RULE IS WHAT EXEMPTS IT, so this is not a special
         case bolted on: TYPOGRAPHY.md section 6 asks for the clip on "every
         table cell that holds a NAME, A TITLE OR FREE TEXT". This cell holds a
         button and a menu, is white-space:nowrap with one glyph in it, and
         can never need an ellipsis.
         NAMED IN THE MARKUP rather than matched with :has(), because which cell
         hosts a pop-up is a fact about the row builder and belongs there — a
         selector that has to guess will guess wrong the day a second pop-up is
         added. */
      .reg-table td.reg-cell-menu{overflow:visible;text-overflow:clip;padding:0 2px}
      ${''/* ---- AND IT TAKES LESS SIDE PADDING THAN A TEXT CELL (26 Sep 2026, the
             button work order's first item) ----
             Its column is 3% of the table, which is 28px at a 1024 window, and
             the ordinary cell padding round a 22px square came to 35 — the
             square was cut. A cell that holds one icon button has no words to
             keep off its neighbour, so 2px a side is enough and the square fits
             at every width the page draws at. The column keeps its percentage,
             so the widths still sum to 100 and the table never scrolls sideways. */}
      .reg-table td > span{vertical-align:middle}
      /* The stage, as a dot and a word. The dot is the shape a scanned column
         needs; the word is what stops the colour being the only carrier. BOTH
         come from contractStatusDotHtml, which shares its branch with the chip
         and the head's sentence — the dot takes the tone's brighter dot shade
         and the word its darker text shade, which is what every chip in this product
         already does and what keeps a 14px word readable while an 8px circle
         still catches the eye. currentColor here is only the fallback for a
         stage that somehow draws without its inline tone. */
      /* ---- THE WHOLE FILTER AREA IS ONE WHITE BAND (owner-asked 24 Aug 2026,
         off the design's own bar) ----
         The title, the filters and the search sat on the PAGE ground while the
         table below them was a white card, so the controls read as loose
         furniture floating above the thing they govern. The design draws them
         on --surf with a hairline under, and the contract room's head already
         does exactly this (.room-band) — one treatment, two pages, rather than
         a second convention here.
         IT IS A WRAPPER, NOT A BACKGROUND ON EACH PART: painting them
         separately leaves the flex gap between them grey and gives two bars
         where the design has one band. The negative margin cancels the view's
         own padding so the white runs to the shell's edge, and the padding
         puts it back inside so nothing it contains moves by a pixel — the
         room band's own trick, and asserted rather than assumed. */
      ${''/* IT STAYS --color-surface, AND THAT IS AN OWNER RULING, NOT AN
             OVERSIGHT. The 25 Aug surface ladder gave this strip --surface-2 on
             the reasoning that a filter bar is a raised layer on the card — and
             it is, everywhere else in this product. HERE it is not allowed to
             be: the owner reported the head and this band reading as two cards
             with a strip between them ("make it one card"), and the fix was to
             make them one white object running to the screen's edge. A tone
             here puts that seam straight back — MEASURED, contracts-page 8a and
             15 both failed on it within the hour.
             --surface-2 draws on menus and drawers instead, where "a layer
             above the page" is the whole reading and no ruling covers it. */}
      ${''/* ---- THE BAND IS ON THE PAGE GROUND NOW (Young picked the
             Inspector drawing, 26 Sep 2026) ---- it held the head, the views
             and the filters on one white ground bleeding to the screen's edge
             (24–25 Aug, "make it one card"). The drawing puts the name and the
             views on the page and the filters on the list's own card, which is
             that ruling's point in the new shape: the filters and the rows
             they narrow are one card. The class stays for what is still in
             it, and so does #page-head's own ground — this sheet no longer
             paints it white. */}
      .reg-band{display:flex;flex-direction:column;gap:var(--s-2)}
      ${''/* THE BODY: the list's card alone, or the card with the panel beside
             it (the inspector's shape). Both columns scroll inside
             themselves, so the page itself never does. */}
      .reg-body{flex:1;min-height:0;display:flex;flex-direction:column}
      .reg-body.is-ins{display:grid;grid-template-columns:minmax(0,1fr) var(--ins-panel-w,380px);gap:14px}
      .reg-card{background:var(--color-surface);box-shadow:var(--shadow-sm);flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
      .reg-card > .reg-filterbar{flex:none;padding:10px 12px;border-bottom:1px solid var(--color-divider)}
      .reg-filterbar .reg-tt{margin:0 var(--s-1) 0 0;font-size:var(--t-card);font-weight:var(--w-strong);line-height:var(--lh-tight);color:var(--color-text);white-space:nowrap;flex:none}
      .reg-filterbar .reg-tt-n{font-weight:var(--w-body);color:var(--color-neutral-600);font-variant-numeric:tabular-nums}
      ${''/* ONE LINE BESIDE THE PANEL, TOO (the owner's standing ruling for this
             bar). The list's card is narrower there, so the one chip with a
             long value — Sort, which always says what it sorts by — gives way
             first: it starts from a short basis, grows back to its own width
             where there is room, and cuts its value with an ellipsis where
             there is not (the whole value is on its hover). Only then would
             the row wrap. */}
      .reg-body.is-ins .reg-filterbar .reg-chip-show{flex:1 1 128px;max-width:max-content;min-width:0}
      .reg-body.is-ins .reg-filterbar .reg-chip-show .reg-f-l{min-width:0;flex:0 1 auto}
      ${''/* THE SELECTED ROW (the inspector's shape): the accent's own wash and
             a 2px accent edge at the row's start — the drawing's own mark — so
             the reader can always tell which contract the panel describes.
             color-mix, not a light-only tint, so it has a night answer. */}
      .reg-table tbody tr.is-sel td{background:color-mix(in srgb,var(--color-accent) 8%,transparent)}
      .reg-table tbody tr.is-sel td:first-child{box-shadow:inset 2px 0 0 var(--accent-solid)}
      .reg-table tbody tr.is-sel .reg-mk{color:var(--accent-ink)}
      ${''/* THE DISPLAY MENU: a card that hangs under its button at the bar's
             right, the platform's own dropdown dress (the corner, the hairline,
             the shadow), above the table's sticky head. */}
      .reg-display{position:relative;flex:none}
      .reg-display-pop{position:absolute;right:0;top:calc(100% + 6px);z-index:40;min-width:250px;
        background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);
        box-shadow:0 10px 28px color-mix(in srgb,var(--color-text) 16%,transparent);
        padding:10px 12px 8px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
      .reg-display-pop[hidden]{display:none}
      .reg-dp-h{font-size:var(--t-micro);color:var(--color-quiet);margin-top:2px}
      .reg-display-pop .reg-seg{align-self:flex-start}
      .reg-dp-row{display:flex;align-items:center;gap:8px;border:0;background:none;font:inherit;font-size:var(--t-body);
        color:var(--color-text);padding:6px 0 2px;cursor:pointer;text-align:left;min-height:var(--tap-min);white-space:nowrap}
      .reg-dp-ck{width:14px;height:14px;border:1px solid var(--rule-strong);border-radius:var(--radius);display:inline-grid;place-items:center;flex:none;color:#fff}
      .reg-dp-ck.on{background:var(--accent-fill);border-color:var(--accent-fill)}
      .reg-dp-ck svg{width:10px;height:10px}
      .reg-dp-row:focus-visible{outline:2px solid var(--accent-solid);outline-offset:2px;border-radius:var(--radius)}
      /* HISTORY SINCE 26 SEP 2026 — the band paints no ground any more (see
         .reg-band above). What still stands of the note below is the gutter:
         this view owns its height, so VIEW_OWNS_HEIGHT still takes the
         scrollbar channel off it.
         ---- AND THE BAND REACHES THE SCREEN'S EDGE (owner-reported 25 Aug
         2026, off two screenshots: "remove the separation strip in the top two
         cards and make it one card just like in the negotiations page", and
         "the top white cards should cover all the way to the end of the
         screen") ----
         ONE CAUSE, BOTH REPORTS. The shell's scroller reserves a scrollbar
         gutter permanently (scrollbar-gutter:stable in index.html, so moving
         between a scrolling page and a fixed one cannot shift content
         sideways). #page-head sits OUTSIDE that scroller and the band sits
         inside it, so the two white boxes had different right edges — MEASURED
         at 1440: the head ran to 1440 and the band stopped at 1430. That 10px
         step is what read as two cards with a strip between them, and the
         grey showing beside the band is what the second screenshot ringed.
         THE GUTTER IS DEAD SPACE ON THIS PAGE: this view is exactly --view-h
         tall and the TABLE does its own scrolling, so the page scroller can
         never scroll and has no scrollbar to reserve room for.
         THE RULE HAS MOVED OUT OF THIS SHEET (25 Aug 2026, second report — the
         same strip was reported on four more pages). It is VIEW_OWNS_HEIGHT in
         js/app.js and #content-scroll.view-fixed in index.html now: five views
         share the one rule rather than each carrying a copy, and 'register' is
         simply on that list. Nothing about this page's behaviour changed.
         BLEEDING THE BAND INTO THE GUTTER WAS TRIED FIRST AND REJECTED: a
         negative margin does paint into it, and it leaves the scroller with
         10px of horizontal overflow that only overflow-x:hidden can swallow.
         A page that has to hide an overflow to look right is one pixel from
         scrolling sideways. */
      .reg-f{display:flex;flex-direction:column;min-width:0}
      .reg-f-l{font-size:var(--t-label);color:var(--color-neutral-600);margin-bottom:3px;white-space:nowrap}
      .reg-stg{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-weight:var(--w-label);vertical-align:middle}
      .reg-stg-slot{display:inline-flex;flex:none;min-width:var(--reg-stg-w,0)}
      td > span > .ins-mv{min-width:0;overflow:hidden;text-overflow:ellipsis}
      .reg-stg i{width:8px;height:8px;border-radius:50%;flex:none;background:currentColor}
      /* THE REASON, IN THE ROW'S OWN SECONDARY INK (19 Sep 2026). It rides the
         stage rather than taking a column, so it costs the table no width; the
         cell already ellipsises, and holdWhyShort cuts it with the whole
         reason on the hover. Not amber, not ruby: the stage word beside it is
         already ruby and saying "stop" twice in one cell is shouting. */
      .reg-stg-why{color:var(--color-neutral-600);font-weight:var(--w-body);min-width:0;overflow:hidden;text-overflow:ellipsis}
      .reg-th-sort:hover{color:var(--accent-ink-700)!important}
      .reg-th-sort:hover .reg-sort-idle{color:var(--accent-ink-700)}
      .reg-th-sort.active{color:var(--accent-ink)!important}
    </style>
    <div style="display:flex;flex-direction:column;gap:var(--s-3);flex:1;min-height:0">
      ${''/* ---- THE PAGE'S NAME AND ITS VIEWS SIT ON THE PAGE, AND THE FILTERS
             SIT ON THE LIST (Young picked the Inspector drawing, 26 Sep 2026)
             ---- The drawing puts the title, its facts line and the view tabs
             on the page ground, and the filter bar INSIDE the list's own card
             as its top row — the tools that narrow a table sit on that table.
             This REVERSES the white band of 24–25 Aug ("make it one card");
             that ruling's point survives in the new shape — the filters and
             the rows they narrow are one card — and the band's class stays
             for the two things still in it. THE VIEWS ARE NEVER DRAWN ON THE
             NEGOTIATIONS SEAT: "Ending in 90 days" and "Archived" are
             questions about the book, not about a live negotiation. */}
      ${''/* NEGOTIATIONS, THE LEGORA WAY (Part 8, the owner's pick, 21 Oct
             2026): its own title row over the shared list head — the box,
             the whose-move tabs, "+ Filter" and its chips, Sort, Display and
             Columns at the right end. No labelled boxes, no Adapt filters,
             no Clear, no card head over the list (regNegoHeadHtml). */}
      ${''/* THE CONTRACTS PLACE, THE LEGORA WAY (Part 8): its title row in the
             list head's card — the box, the views as tabs, "+ Filter" and
             its chips, the tools at the right end (regHomeHeadHtml) */}
      ${HOME?regHomeHeadHtml(R):neg?regNegoHeadHtml(headHtml):`<div class="reg-band sap-band ph-card">
      ${headHtml}
      <!-- THE FILTERS SIT BESIDE THE TABS (owner, 10 Oct 2026: "move the
           highlighted filters to the empty side on the right ... to optimize
           space for the cards at the bottom"; reverses 9 Oct's own row of
           labelled boxes). One row: the tabs on the left, the filters at its
           right end, each box saying its label inside ("Stream: All
           streams"). When they do not fit, the row wraps and the filters
           take one short line under the tabs. -->
      <div class="reg-tabbar">
      ${regStageTabsHtml(R)}
      <div class="reg-filterbar reg-fb">
        ${lockChip}
        ${fbBoxes}
        ${adaptBtn}
        ${clearSlot}
      </div>
      </div>
      </div>`}
      ${HOME&&R.show!=='list'?regHomeWallHtml(cs,regSortIconHtml(sortOpts)):`<div class="reg-body${INS?' is-ins':''}">
      <section class="blueprint bp-round reg-card${regMode()==='board'?' reg-board-wrap':''}">
      <!-- THE LIST'S OWN HEAD (SAP benchmark, owner-approved 9 Oct 2026): its
           name and count, then Sort and Display as two small icons. The
           filters went up into the white band with the page's name. -->
      ${''/* NOT ON NEGOTIATIONS (Part 8): the list head above says the count
             (the All tab) and carries Sort and Display at its chip row's end */}
      ${''/* NOR ON THE CONTRACTS PLACE (Part 8): its All tab and its foot say
             the count, and Sort, Display and Ask a column stand at the list
             head's chip row's end */}
      ${(neg||HOME)?'':`<div class="reg-cardhead reg-filterbar">
        <h2 id="reg-tt" class="reg-tt">${regListTitle(cs)}</h2>
        <span style="flex:1;min-width:8px"></span>
        ${typeof window.askColBtnHtml==='function'?askColBtnHtml():''}
        ${regSortIconHtml(sortOpts)}
        ${regDisplayHtml(neg)}
      </div>`}

      ${regMode()==='board'?`
        <div id="reg-scroll" style="flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;padding:var(--s-3)">
          ${(typeof pipeBoardHtml==='function')?pipeBoardHtml(cs,{legend:false}):''}
        </div>
        <div style="flex:none;border-top:1px solid var(--color-divider);display:flex;align-items:center;justify-content:space-between;gap:10px var(--s-4);flex-wrap:wrap;padding:5px var(--s-3);font-size:var(--t-label);color:var(--color-neutral-600)">
          ${HOME?regCtFootHtml(cs):`<span id="reg-showing" role="status" aria-live="polite" aria-atomic="true">${regFooterText(cs,{all:true})}</span>`}
          ${''/* ---- NO VALUE STREAMS KEY ON THIS PAGE, BOARD OR TABLE (Young
                 ruled 24 Sep 2026: "delete this from both the contracts and
                 negotiations pages") ----
                 The board is the same page in a second shape, so its key above
                 the columns went with the table's. Every card names its stream
                 beside its colour bar, which is the fact the key explained.
                 My Queue — a separate page drawing the same board, and not
                 named — keeps its key: `legend:false` is asked only here. */}
        </div>`:`
        <div id="reg-scroll" style="flex:1;min-height:0;overflow:auto">
          <!-- The whole density mode rides on ONE element as three custom
               properties, so nothing below has to know which mode is on. -->
          <table data-list-seat="${neg&&INS?REG_NEGO_SEAT:''}" class="reg-table${INS?' is-ins':''}${!INS&&regNarrowTable()?' is-narrow':''}${HOME?' is-home':''}${HOME&&regHomeNarrow()?' is-hnarrow':''}${HOME&&regHomeWide()?' is-hwide':''}" data-reg-density="${regDensity()}" style="${regDensityVars(regDensity())}">
            <thead>
              <!-- THE PROTOTYPE'S SEVEN, with the tracking number added in front.
                   Sorting is kept on the four columns that carried it before —
                   the reference has no sort affordance, but losing the ability
                   to order a register by value or renewal date would be losing
                   a tool, not a decoration. -->
              ${''/* ---- THE COLUMNS DO NOT MOVE WHEN YOU TURN THE PAGE
                     (owner-reported 24 Aug 2026: "when you click through the
                     pages, the columns move which is not how i want it … there
                     should be no scrolling from left to right") ----
                     An AUTO table sizes each column to the content of the rows
                     it is currently showing, so a page of long names widened the
                     title and every column beside it moved. MEASURED on a
                     150-contract book: the title column was 217px on page 1 and
                     306px on page 3, and all seven others shifted with it.
                     table-layout:fixed reads the widths off THIS row and holds
                     them, whatever the page shows — the same fix, and the same
                     lesson, as the calendar's obligation table.
                     EVERY WIDTH IS A PERCENTAGE AND THEY SUM TO 100, which is
                     what makes "no left-right scrolling" a guarantee rather than
                     something that happens to hold at today's window: the table
                     is exactly its pane, at every width, on every page.
                     SIX OF THE EIGHT ARE THE SAME ON BOTH PAGES. Only the title
                     and the last column differ, because the last one holds a ⋯
                     on Contracts and a sentence about whose move it is on
                     Negotiations, and the title is the column with the give. */}
              <tr>
                ${''/* ---- A NINTH COLUMN ON CONTRACTS, AND THE WIDTHS STILL SUM
                       TO 100 (J-5.1) ---- that sum is what makes the table
                       exactly its pane at every width, on every page, and it is
                       not negotiable. The nine come out of five columns that
                       can each spare a point or two; the SIGNED column sits
                       immediately before Expiry, so the two dates read as a
                       term — start and end.
                       NEVER ON THE NEGOTIATIONS SEAT. One renderer draws both
                       and two of these columns already differ by seat; a Signed
                       column on a page of live negotiations is an em-dash on
                       every row. */}
                ${''/* ---- EVERY COLUMN THAT CAN BE ORDERED ORDERS ITSELF
                       (owner-asked 10 Sep 2026: "I should be able to sort on
                       each column like in the signed column") ----
                       Reference, counterparty and value stream joined the four
                       that already sorted. THE LAST COLUMN DELIBERATELY DOES
                       NOT: on Contracts it holds the row's ⋯ and carries no
                       heading at all, so there is nothing to press; on
                       Negotiations it is whose move, which is the very thing
                       the bands above it already group by. */}
                ${''/* THE HEAD IS EMITTED IN THE SEAT'S OWN KEY ORDER (second
                       pass, 21 Sep 2026), exactly as the row is, so the two
                       cannot disagree about which column is which. */}
                ${''/* ---- PLAIN COLUMN NAMES (26 Sep 2026, the list options' floor)
                       ---- "Ref" not "MK", "Stage" not "Status", "Owner" not
                       "Own", "Ends" not "Expiry date", and the head that
                       holds two lines names both. In sentence case — see the
                       head's own rule in the style above. */}
                ${regColKeys().map(k=>{
                  if(k==='mk') return sortableTh('ref',i18t('reg_col_ref'),'',k);
                  /* the drawing's word on the Contracts place: the cell is the agreement (Part 8) */
                  if(k==='counterparty') return sortableTh('party',i18t(HOME?'reg_col_agreement':'reg_col_party'),'',k);
                  /* the spread's party column (regHomeWide) sorts as the agreement's head does: by the party */
                  if(k==='party') return sortableTh('party',i18t('cu_col_customer'),'',k);
                  /* The head names the LEADING line, and the press sorts by
                         it: the counterparty is what a reader scans down this
                         column. Sorting by title is still offered — in the
                         sort dropdown, which has carried a sort with no column
                         of its own (`risk`) since it was built. */
                  if(k==='kind') return sortableTh('kind',i18t('reg_col_type_round'),'',k);
                  if(k==='value') return sortableTh('value',i18t('reg_col_value'),'text-align:right',k);
                  if(k==='signed') return sortableTh('signed',i18t('reg_col_signed'),'',k);
                  if(k==='expiry') return sortableTh('expiry',i18t('reg_col_ends'),'',k);
                  if(k==='stage') return sortableTh('stage',i18t('reg_col_stage'),'',k);
                  if(k==='standing') return sortableTh('stage',i18t('reg_col_standing'),'',k);
                  if(k==='stream') return sortableTh('stream',i18t('reg_col_stream'),'',k);
                  if(k==='standards') return regNl()?sortableTh('standards',i18t('reg_col_standards'),'',k).replace(/<\/th>\s*$/,`<span class="reg-th-sub">${esc(i18t('reg_nl_std_sub'))}</span></th>`):sortableTh('standards',i18t('reg_col_standards'),'',k);
                  if(k==='move') return neg ? (()=>{ const i=_colN; return `<th style="${INS?'':'text-align:right;'}${colAt('',k)}">${i18t('ngl_col_move')}${gripFor(i)}</th>`; })()
                    : sortableTh('move',i18t('ngl_col_move'),'',k);
                  if(k==='owner') return sortableTh('owner',i18t('reg_col_owner_word'),'',k);
                  if(k==='round'||k==='changes'||k==='waiting'||k==='lead'||k==='clauses'){ const i=_colN; return `<th style="${colAt('',k)}">${esc(i18t('ngl_col_'+k))}${gripFor(i)}</th>`; }
                  if(k.startsWith('ask:')&&typeof window.askColThHtml==='function'){ const i=_colN; return askColThHtml(k.slice(4),colAt('',k),gripFor(i),R.sort===k?sortCaret(k):''); }
                  return (()=>{ const i=_colN; return `<th style="text-align:right;${colAt('',k)}">${gripFor(i)}</th>`; })();
                }).map((h,i,a)=>neg&&INS&&typeof listGripHtml==='function'?h.replace(/<\/th>\s*$/, listGripHtml(REG_NEGO_SEAT, (k=>k==='counterparty'?'name':k)(regColKeys()[i]))+'</th>'):h).join('')}
              </tr>
            </thead>
            <tbody id="reg-tbody">${regRowsHtml(cs)}</tbody>
          </table>
        </div>
        <div style="flex:none;border-top:1px solid var(--color-divider);display:flex;align-items:center;justify-content:space-between;gap:10px var(--s-4);flex-wrap:wrap;padding:5px var(--s-3);font-size:var(--t-label);color:var(--color-neutral-600)">
          ${neg?regNegoFootHtml(cs):HOME?regCtFootHtml(cs):`<span id="reg-showing" role="status" aria-live="polite" aria-atomic="true">${regFooterText(cs)}</span>
          <div id="reg-pager" style="display:flex;align-items:center;gap:6px">${regPager(cs)}</div>`}
          ${''/* ---- THE FOOT IS THE COUNT AND THE PAGER, AND NOTHING ELSE
                 (Young ruled 24 Sep 2026, over a screenshot of this strip:
                 "delete this from both the contracts and negotiations pages";
                 asked about Negotiations' own note in that spot: "remove it
                 too") ----
                 The VALUE STREAMS key and the page-size note — "40 per page" on
                 Contracts, `ngl_no_paging` on Negotiations — are gone from both
                 seats. THIS REVERSES "the value streams key stays because the
                 stripe down the left edge of every row is the thing on this page
                 with no other explanation": that stripe moved INTO the stream
                 cell on 21 Sep 2026, beside the stream's own name, so the key had
                 become a fact printed twice, and on a workspace with eleven
                 streams the strip wrapped into three lines. The page size is
                 still said where it matters — "Showing 1–40 of 50 · page 1 of 2".
                 The link-state key left this strip earlier for its own reason
                 (the column explains itself on hover); the folder page keeps it.
                 `reg_per_page` and `ngl_no_paging` are STALE, inert in both
                 books. The Board view's key went the same day (the Board branch
                 above), and later that day the stream COLUMN itself went too
                 (see REG_COL_KEYS) — the Stream filter stays. */}
        </div>`}
      </section>
      ${''/* THE PANEL — js/views/inspector.js paints it (regInsPaint), and it is
             drawn only in the inspector's shape. */}
      ${INS?`<aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ins_panel_label'))}"></aside>`:''}
      </div>`}
    </div>
  </div>`;

  wireRegRows();
  wireRegPager();
  regInsPaint();
  if(typeof insWatchWidth==='function') insWatchWidth();
  /* Sort, Display (its pop, density, table | board, the amendment fold) and
     the named set's ×: bound once each, the way a list head's recount binds
     them again when it draws them afresh (regToolsWire) */
  regToolsWire();
  const si=document.getElementById('reg-search');
  if(si){
    si.addEventListener('input',()=>{ R.query=si.value; R.page=1; renderRegisterBody(); if(API_MODE()) ftsSearch(si.value); });
  }
  /* ---- OUTSIDE CLICK: ARMED ONCE ON THE DOCUMENT, NOT PER PAINT ----
     This closes the search dropdown and any open row ⋯ menu, and it was bound
     inside the wiring — which runs on EVERY filter press, every sort, every
     page. So a reader who used the filters twenty times had twenty copies of
     it, all firing on every click for the life of the sitting.

     The house pattern: a flag on `document`, and the live element resolved AT
     PRESS TIME rather than captured. The search box is looked up by id inside
     the handler for exactly that reason — the `si` this paint closed over is
     replaced by the next one, and a listener holding the old node would stop
     recognising the box the reader is typing in. */
  if(!document._regOutsideWired){
    document._regOutsideWired=true;
    document.addEventListener('click',e=>{
      const box=document.getElementById('reg-fts');
      const live=document.getElementById('reg-search');
      if(box&&!box.contains(e.target)&&e.target!==live) box.classList.add('hidden');
      if(!e.target.closest('[data-menu-pop]')&&!e.target.closest('[data-menu]')) regCloseMenus();
      if(!e.target.closest('.reg-display')) regCloseDisplay();
    });
  }
  /* ---- "ADAPT FILTERS" ----
     It goes through openModal, which this product already gets right: role,
     aria-modal, a name, focus in, Tab cycling and focus back to the opener.
     A second hand-rolled panel would be a second implementation of all of
     that, and this file's own rule is one builder per job. */
  document.getElementById('reg-adapt')?.addEventListener('click',()=>{
    const chosen=regBarChosen();
    /* On the full Contracts table the stage is the tab row, not a box, so it
       is not offered there; on the place (and on Negotiations) it is a box. */
    const rows=REG_BAR_FILTERS.filter(f=>!(f.k==='stage'&&regScope()!=='negotiations'&&!regHome())).map(f=>{
      const on=chosen.includes(f.k);
      /* A FIXED FILTER IS SHOWN TICKED AND DISABLED rather than hidden: a
         chooser that silently omits two of the six leaves the reader counting
         and wondering where they went. It says what it is instead. */
      return `<label style="display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid var(--color-divider);${f.fixed?'opacity:.6':'cursor:pointer'}">
        <input type="checkbox" data-adapt="${f.k}" ${on?'checked':''} ${f.fixed?'disabled':''} style="width:15px;height:15px;flex:none;accent-color:var(--accent-solid)"/>
        <span style="flex:1;font-size:var(--t-body)">${esc(f.label)}</span>
        ${f.fixed?`<span style="font-size:var(--t-micro);color:var(--color-neutral-500)">${esc(i18t('reg_adapt_always'))}</span>`:''}
      </label>`;
    }).join('');
    openModal(`
      <div style="padding:var(--s-4) 18px 10px;border-bottom:1px solid var(--color-divider)">
        <h3 style="margin:0;font-size:var(--t-section);font-weight:var(--w-title)">${esc(i18t('reg_adapt_title'))}</h3>
        <p style="margin:var(--s-1) 0 0;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5">${esc(i18t('reg_adapt_sub'))}</p>
      </div>
      <div style="padding:var(--s-1) 18px var(--s-2)">${rows}</div>
      <div style="padding:var(--s-3) 18px var(--s-4);display:flex;gap:var(--s-2);align-items:center">
        <button id="reg-adapt-reset" class="ui-btn ui-btn-plain">${esc(i18t('reg_adapt_reset'))}</button>
        <span style="flex:1"></span>
        <button id="reg-adapt-done" class="ui-btn ui-btn-primary">${esc(i18t('act_done'))}</button>
      </div>`,{label:i18t('reg_adapt_title'),maxWidth:'440px'});
    const read=()=>[...document.querySelectorAll('[data-adapt]:checked')].map(b=>b.getAttribute('data-adapt'));
    document.getElementById('reg-adapt-reset')?.addEventListener('click',()=>{
      regBarSetChosen(REG_BAR_DEFAULT.slice()); closeModal(); regRepaint();
    });
    document.getElementById('reg-adapt-done')?.addEventListener('click',()=>{
      regBarSetChosen(read()); closeModal(); regRepaint();
    });
  });

  /* A DENSITY CHANGE IS A REPAINT, NOT A NAVIGATION: the page, the filters and
     the reader's place are all untouched — only the rows' rhythm moves. */
  /* BUTTON, BY TAG — the table itself carries data-reg-density (its density
     mode, read by the row rules), so a bare attribute selector bound this
     listener on the TABLE too and every row press repainted the register over
     the page the row had just opened (the negotiate page drew, then the list
     came back over it — negotiations-door-verify caught it, 21 Sep 2026). */
  /* (bound in regToolsWire, above) */
  /* A SHAPE CHANGE IS A REPAINT, NOT A NAVIGATION, like the density: filters
     and place untouched. In board mode the queue's own wiring arms the cards
     (a press opens the workspace) and the per-column "N more" doors. */
  if(regMode()==='board'&&typeof wirePipeline==='function') wirePipeline();
  // Column-header sorting: click a header to sort by it; click the active header
  // again to flip ascending/descending. First click uses the column's natural
  // direction (e.g. renewal nearest-first, value high-first).
  document.querySelectorAll('[data-reg-sort]').forEach(el=>el.addEventListener('keydown',e=>{
    if(e.key!=='Enter' && e.key!==' ' && e.key!=='Spacebar') return;
    e.preventDefault(); el.click();
  }));
  document.querySelectorAll('[data-reg-sort]').forEach(el=>el.addEventListener('click',()=>{
    const key=el.getAttribute('data-reg-sort');
    if(R.sort===key) R.dir=-R.dir; else { R.sort=key; R.dir=REG_SORT_DEFDIR[key]||-1; }
    R.page=1; regRepaint();
  }));
  document.getElementById('reg-renewal')?.addEventListener('change',e=>{ R.renewal=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-category')?.addEventListener('change',e=>{ R.category=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-signed')?.addEventListener('change',e=>{ R.signed=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-payterms')?.addEventListener('change',e=>{ R.payterms=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-docs')?.addEventListener('change',e=>{ R.docs=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-hold')?.addEventListener('change',e=>{ R.hold=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-stage-sel')?.addEventListener('change',e=>{ R.stage=e.target.value; R.page=1; regRepaint(); });
  document.getElementById('reg-type-sel')?.addEventListener('change',e=>{ R.type=e.target.value; R.page=1; regRepaint(); });
  /* the views are the Contracts place's list head tabs (Part 8): pressed
     through its one delegated listener (js/views/listhead.js) ending in the
     page's own tab(k); their per-element binding here is deleted, so a press
     fires once */
  regStageTabsWire();
  document.getElementById('reg-view-sel')?.addEventListener('change',async e=>{
    const v=e.target.value||'';
    if(v==='act:save'){ await regSaveViewAsk(); regRepaint(); ctfDockAgain(); return; }
    if(v.startsWith('act:forget:')){ await regForgetViewAsk(v.slice(11)); regRepaint(); ctfDockAgain(); return; }
    if(v.startsWith('saved:')){ if(regApplySaved(v.slice(6))) regRepaint(); ctfDockAgain(); return; }
    R.view=v||null; R.page=1; regRepaint(); });
  /* the whose-move tabs are the list head's (js/views/listhead.js: one press,
     delegated, ending in the page's own tab(k)); their per-element binding
     here is deleted, so a press fires once (Part 8) */
  /* …and so are the saved views and "+ Save this view" (data-lh-saved,
     data-lh-save): the retired tab row's [data-reg-saved] buttons and
     #reg-save-view are drawn nowhere, so their bindings went with it */
  regPaintHeadFacts();
  wireRegClear();
  /* ---- THE FILTER CHIPS DROP HaTi's OWN LIST (Young ruled 21 Sep 2026) ----
     One delegated press on the bar rather than one per chip, so a repaint that
     rebuilds the chips cannot leave a listener behind; the helper binds once
     per element by its own dataset flag. The `<select>`s are untouched — see
     selectMenuWire for what this does and does not take over. */
  /* ---- THE FILTER BAR'S OWN CALL IS RETIRED (21 Sep 2026) ----
     The sweep is on the document's body now and is DELEGATED, so this bar is
     already covered — and a second root over the same control would answer one
     press twice and open the menu twice. ONE ROOT, ONE LISTENER. */

  /* WALL | LIST (the Contracts place on Home): a way of looking, like the
     density — a repaint; the tabs, filters and set stay, and so does the
     place a refresh comes back to */
  /* THE ARCHIVE'S OWN BUTTON (round 13): the shelf, and pressed again the
     live book — one press each way */
  document.querySelectorAll('[data-reg-home] [data-ct-archive]').forEach(b=>b.addEventListener('click',()=>{
    R.view=R.view==='archived'?null:'archived'; R.page=1; regRepaint(); }));
  document.querySelectorAll('[data-reg-home] [data-ct-show]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.getAttribute('data-ct-show'); if(!REG_SHOWS.includes(k)||R.show===k) return;
    R.show=k; regRepaint(); }));

  regWireColResize();
  regPaintCohort();
  setActiveNav(_regOpts.nav);
  /* the place is saved once the list is on screen: read straight after the write, the scrollers'
     positions made the browser lay the page out mid-paint (22 Oct 2026) */
  if(HOME){ _regHomeSig=regBookSig(); regHomeWatch(hostEl); regAfterPaint(()=>{ if(typeof placeSave==='function'){ try{ placeSave(); }catch(_){ /* the place is a convenience */ } } });
    /* ONE QUERY, TWO BOXES SAYING IT (Q1 "keep both boxes", 21 Oct 2026):
       the top bar's box shows the words the place is narrowed by — after a
       refresh too, where the query came back with the place and nothing put
       it in the bar — unless the reader is typing in it */
    const bar=document.getElementById('cmd-search'), w=String(R.query||'');
    if(bar&&document.activeElement!==bar&&bar.value!==w) bar.value=w; }
}

/* ---- THE TOOLS BESIDE A LIST, BOUND ONCE EACH (Part 8) ----
   Sort (#reg-sort), Display (#reg-display, its pop, the density and table |
   board segments, the amendment fold #reg-flat) and the named set's ×
   (#reg-only-clear). They stand at a list head's chip row's end, where a
   recount leaves them in place while their markup is unchanged and draws
   them afresh when it moved; so every one is bound here once per element
   (a dataset flag), by the full paint and by the head's wire, and each reads
   the page's state at the moment it is pressed. */
function regToolsWire(){
  if(typeof document==='undefined') return;
  const once=(el,type,fn)=>{ if(!el||el.dataset.regToolWired) return; el.dataset.regToolWired='1'; el.addEventListener(type,fn); };
  once(document.getElementById('reg-display'),'click',e=>{ e.stopPropagation();
    const dBtn=document.getElementById('reg-display'), dPop=document.getElementById('reg-display-pop'); if(!dPop||!dBtn) return;
    const open=dPop.hidden; dPop.hidden=!open; dBtn.setAttribute('aria-expanded',open?'true':'false');
    if(open){ const f=dPop.querySelector('button'); if(f) f.focus({preventScroll:true}); } });
  once(document.getElementById('reg-display-pop'),'keydown',e=>{ if(e.key!=='Escape') return; e.stopPropagation(); regCloseDisplay();
    const dBtn=document.getElementById('reg-display'); if(dBtn) dBtn.focus({preventScroll:true}); });
  once(document.getElementById('reg-flat'),'click',()=>{ const R=regState(); R.flat=!R.flat; regRepaint(); });
  /* A DENSITY CHANGE IS A REPAINT, NOT A NAVIGATION: the page, the filters and
     the reader's place are all untouched — only the rows' rhythm moves.
     BUTTON, BY TAG — the table itself carries data-reg-density (its density
     mode, read by the row rules), so a bare attribute selector bound this
     listener on the TABLE too and every row press repainted the register over
     the page the row had just opened (the negotiate page drew, then the list
     came back over it — negotiations-door-verify caught it, 21 Sep 2026). */
  document.querySelectorAll('button[data-reg-density]').forEach(b=>once(b,'click',()=>{
    if(regSetDensity(b.getAttribute('data-reg-density'))) regRepaint();
  }));
  document.querySelectorAll('button[data-reg-mode]').forEach(b=>once(b,'click',()=>{
    regSetMode(b.getAttribute('data-reg-mode')); regRepaint();
  }));
  once(document.getElementById('reg-sort'),'change',e=>{ const R=regState(); R.sort=e.target.value; R.dir=REG_SORT_DEFDIR[R.sort]||-1; R.page=1; regRepaint(); });
  once(document.getElementById('reg-only-clear'),'click',()=>{ const R=regState(); R.only=null; R.page=1; regRepaint(); });
}
/* ---- "DO THIS TO THESE N" LIVES IN A SLOT THE PAGE HEADER LEAVES (S13/S14) ----
   The shared page header is built ONCE per view change, and this control has to
   appear the moment a filter narrows the table and vanish the moment it is
   cleared — which happens on a repaint, with no view change at all. So the
   header draws an empty span and the register fills it on every paint, which is
   the contract room's own rule for anything that changes underneath a head
   built once: a SLOT and a paint, never a rebuild.

   THE BUTTON'S OWN CONDITION IS IN cohortButtonHtml, NOT HERE, so there is one
   answer to "should this be drawn" rather than two that can drift. Guarded by
   typeof: js/cohort.js is not on every stage, and a missing module leaves an
   empty slot rather than throwing through the register's render. */
function regPaintCohort(){
  const slot=document.getElementById('reg-cohort-slot'); if(!slot) return;
  /* a list head draws its own (the Contracts place's chip row, Part 8):
     counted at its paint and at every recount, never twice */
  if(slot.closest&&slot.closest('[data-lh-seat]')) return;
  let html='';
  try{ html = (typeof cohortButtonHtml==='function') ? cohortButtonHtml() : ''; }catch(_){ html=''; }
  slot.innerHTML = html;
}

/* ---- WHERE A BAND PINNED (retired 21 Oct 2026, Part 8) ----
   regFitBandOffset measured the column header and wrote --reg-head-h, so the
   Negotiations list's group headings could pin flush under it (owner, 22 Aug
   2026: "when you scroll … it breaks"). The headings are gone — the
   whose-move tabs in the list head say the groups (the owner's pick "The
   Legora way", Q2 "A — tabs only") — and nothing read the measure any more,
   so the function, its ResizeObserver and the property are deleted, not
   stubbed. The column header itself is still sticky (.reg-table thead th). */

/* ---- E6-T1 full-text search dropdown (server mode) ---- */
let ftsTimer=null;
function ftsSearch(q){
  const box=document.getElementById('reg-fts'); if(!box) return;
  q=(q||'').trim();
  clearTimeout(ftsTimer);
  if(q.length<2){ box.classList.add('hidden'); return; }
  ftsTimer=setTimeout(async()=>{
    try{
      const r=await api('search?q='+encodeURIComponent(q)+'&limit=12');
      if(!r.hits||!r.hits.length){ box.innerHTML=`<div style="padding:10px var(--s-3);font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('reg_no_fulltext')}</div>`; box.classList.remove('hidden'); return; }
      box.innerHTML=r.hits.map(h=>`<button data-fts-open="${h.id}" style="display:block;width:100%;text-align:left;padding:var(--s-2) var(--s-3);border:0;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer;font:inherit">
        <div style="font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(h.name||h.id)} <span class="hati-ref" style="font-size:var(--t-label);color:var(--color-neutral-500)">${esc(h.contractNo||h.id)}</span></div>
        ${h.snippet?`<div style="font-size:var(--t-label);color:var(--color-neutral-600);margin-top:2px">${h.snippet.replace(/</g,'&lt;').replace(/\[/g,'<mark style="background:var(--st-amber-bg);border-radius:var(--radius);padding:0 2px">').replace(/\]/g,'</mark>')}</div>`:(h.counterparty?`<div style="font-size:var(--t-label);color:var(--color-neutral-500)">${h.counterparty}</div>`:'')}
      </button>`).join('');
      box.classList.remove('hidden');
      box.querySelectorAll('[data-fts-open]').forEach(b=>b.addEventListener('click',()=>{ box.classList.add('hidden'); openWorkspace(b.getAttribute('data-fts-open')); }));
    }catch(e){ box.classList.add('hidden'); }
  },220);
}
Object.assign(window,{regFolderPanelOn,regFolderPanelHtml,regFolderOdd,RFP_ODD_MIN,regNl,regStdMissHtml,regNlFootHtml,REG_COL_W_NL,regFoldersUp,regFoldersPanelHtml,regFoldersOn,regFoldersHtml,regFolderRead,regOpenContract,regPlace,regPlacePut,regSignedOn,regSignedYear,regSignedYears,regSignedCell,
  REG_COL_KEYS,REG_COL_KEYS_NEGO,REG_COL_W,REG_COL_W_NEGO,REG_COL_KEYS_NARROW,REG_COL_KEYS_NEGO_NARROW,REG_COL_W_NARROW,REG_COL_W_NEGO_NARROW,REG_NARROW_W,regNarrowTable,REG_COL_MIN_PX,regReopenAsk,
  /* the list inspector (26 Sep 2026) */
  REG_COL_KEYS_INS,REG_COL_KEYS_NEGO_INS,REG_INS_COL_PX,regInspecting,regColKeys,regColKeysSeat,regInsSeat,regInsActs,regInsPaint,
  regRowActsHtml,regRunRowAct,regOpenRow,regDisplayHtml,regCloseDisplay,REG_SOON_DAYS,regEndsSay,
  regColWidths,regColWidthsOwn,regColSetWidths,regColReset,regColDefaults,regColTrade,regColApply,regWireColResize,
  REG_CMP,REG_SORT_DEFDIR,regBlanksLast,regStreamName,regRefParts,regNarrowed,regClearHtml,regPaintClear,
  REG_BAR_FILTERS,REG_BAR_DEFAULT,regListTitle,regSortIconHtml,regMovePillHtml,regNegoCols,regNegoBase,regNegoSay,regNegoNeedRows,regAvatarHtml,regAvatarTone,regBarChosen,regBarSetChosen,regBarShown,regFilterActive,regViewCount,REG_SAVED_KEY,REG_SAVED_FIELDS,regSavedViews,regSaveView,regForgetView,regApplySaved,regSavedMatches,regHeadFactsHtml,regPaintHeadFacts,regPaintViewCounts,regMoveWord,regOwnerCell,REG_DENSITY,regDensity,regSetDensity,regDensityVars,regMode,regSetMode,regStageTabsHtml,regStageBase,regStageTabsWire,REG_STAGE_TABS,regViewOptsHtml,regSaveViewAsk,regForgetViewAsk,regSegHtml,regDotDate,REG_PAGE,REG_SORTS,REG_STAGES,regTypes,REG_VIEWS,REG_ROW_ACTIONS,ftsSearch,regAggregate,regCloseMenus,regMenuFit,regExportCsv,regFiltered,regCategories,regCatMatch,regCatLabel,regOwnerInitials,regPrimaryAction,regTitleOf,regRowsHtml,regState,negoMoveSay,regShowOnly,REG_FILTER_REST,regFiltersAtRest,regSearchBoxClear,regGoFiltered,regPaintCohort,renderRegister,renderRegisterBody,wireRegRows,
  regScope,regSetScope,regRepaint,regPageSize,NEGO_BANDS,NEGO_BAND_DOT,negoGroupByMove,negoBandCounts,negoMovePillHtml,
  /* the Negotiations list head, the Legora way (Part 8, 21 Oct 2026) */
  negoBandViews,REG_NEGO_SEAT,REG_NEGO_FILTERS,regNegoState,regOnNego,regBookWhole,regNegoOptN,regNegoFilters,regNegoHeadReg,regNegoHeadHtml,regNegoFootHtml,regNegoToolsHtml,regNegoRepaint,
  REG_NEGO_FIXED,regNegoShapeKeys,regNegoColDefs,regNegoColsShown,regNegoColsChosen,regNegoColWidths,regQueryOf,regOnlyChipHtml,regSortOptsHtml,
  /* the Contracts place's list head, the Legora way (Part 8, 21 Oct 2026) */
  REG_CT_SEAT,REG_CT_VIEWS,REG_CT_QUICK,regCtQuickOf,REG_CT_FILTERS,regOnCt,regNeedsIds,regRowsCount,regCutCount,regCtViews,regCtFilterLists,regCtFilters,regCtRepaint,regCtToolsHtml,
  REG_CT_FIXED,REG_CT_COL_WORD,regCtShapeKeys,regCtColDefs,regCtHeadReg,regCtFootHtml,regHomeColW,regToolsWire,regToolsHtml,regWallRepaint,
  /* the Contracts place on Home (the overnight work order, step 7) */
  REG_SHOWS,REG_COL_KEYS_HOME,REG_COL_W_HOME,regStageTone,regStageMarkHtml,regStageLineHtml,regNegoMarkHtml,regNegoLineHtml,regNegoClauseChips, regNegoClauseNames,REG_COL_KEYS_HOME_NARROW,REG_COL_W_HOME_NARROW,REG_HOME_NARROW_W,regHomeNarrow,REG_HOME_SPREAD,REG_COL_KEYS_HOME_WIDE,REG_COL_W_HOME_WIDE,REG_HOME_WIDE_W,regHomeWide,regHomeWatch,regPlaceSet,regPlaceUp,regHome,regRestBase,regHomeHeadHtml,regHomeWallHtml,regBookSig,regHomeStale});
