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
  if(q) cs=cs.filter(c=>((c.name||'')+' '+(c.counterparty||'')+' '+(c.id||'')).toLowerCase().includes(q)
    || (typeof partiesMatch==='function' && partiesMatch(c,q)));
  let sort=state.folderSort||'updated';
  // a stored "sort by value" preference is meaningless without the right
  if(sort==='value' && typeof canViewValues==='function' && !canViewValues()) sort='updated';
  const upd=c=>{ const t=Date.parse(c.lastAction); return isNaN(t)?0:t; };
  if(sort==='updated') cs.sort((a,b)=>upd(b)-upd(a));
  else if(sort==='value') cs.sort((a,b)=>Number(b.value||0)-Number(a.value||0));
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
          <input id="folder-search" value="${(state.folderQuery||'').replace(/"/g,'&quot;')}" type="text" placeholder="${i18t('reg_search_folder')}" style="width:230px;max-width:60vw;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:6px 9px 6px 30px;font:inherit;font-size:var(--t-meta);outline:none;color:inherit">
        </div>
      </div>

      <div id="fold-selbar" class="flex hidden items-center justify-between" style="gap:var(--s-3);border:1px solid var(--color-accent-800);background:var(--color-accent-800);color:#fff;border-radius:var(--radius);padding:var(--s-2) var(--s-3)">
        <span id="fold-sel-count" style="font-size:var(--t-meta);font-weight:var(--w-strong)">${i18t('reg_n_selected',{n:0})}</span>
        <div style="display:flex;align-items:center;gap:var(--s-2)">
          <button id="fold-export" style="display:inline-flex;align-items:center;gap:6px;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:var(--radius);padding:5px 10px;font:inherit;font-size:var(--t-meta);font-weight:var(--w-strong);cursor:pointer">${icon('download','w-3.5 h-3.5')} Export CSV</button>
          <button id="fold-clear" style="border:0;background:none;color:rgba(255,255,255,.72);padding:5px var(--s-2);font:inherit;font-size:var(--t-meta);font-weight:var(--w-strong);cursor:pointer">${i18t('reg_clear')}</button>
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
  if(from) hint=i18t('reg_from_id',{id:from.id});
  if(c.status!=='Declined'){ const d=daysUntil(eff);
    if(d<0){ col='var(--st-ruby-fg)'; weight=600; hint=`${i18t('reg_days_ago',{n:-d})}${from?' · '+i18t('reg_from_id',{id:from.id}):''}`; }
    else if(d<30){ col='var(--st-ruby-fg)'; weight=600; hint=`${i18t('reg_in_days',{n:d})}${from?' · from '+from.id:''}`; }
    else if(d<=90){ col='var(--st-amber-fg)'; hint=`${i18t('reg_in_days',{n:d})}${from?' · from '+from.id:''}`; }
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
          <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="font-family:var(--font-mono)">${esc(c.id)}</span> · ${esc(c.counterparty||'No counterparty yet')}</span>
        </span>
      </div></td>
      <td style="font-size:var(--t-meta);color:var(--color-neutral-700);white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px">${icon(cIcon(c),'w-4 h-4')}${cKind(c)}</span>${scan}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:var(--w-body);white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}" ${!isMonetary(c)?`title="${i18t('reg_non_monetary')}"`:''}>${!isMonetary(c)?'n/m':(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'—')}</td>
      <td style="font-size:var(--t-meta);font-variant-numeric:tabular-nums;white-space:nowrap">${folderExpiryCell(c)}</td>
      <td style="font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap">${c.lastAction||'—'}</td>
      ${''/* Same split as the register: the link mark to its own column, the
             question pill left with the stage it qualifies. */}
      <td style="text-align:center;white-space:nowrap">${window.shareLinkCell?shareLinkCell(c.id):''}</td>
      <td style="text-align:right;padding-right:var(--s-3);white-space:nowrap">${window.questionDot?questionDot(c.id):''}${window.contractStatusChip?contractStatusChip(c):statusChip(c.status)}</td>
    </tr>`; }).join('') + (cs.length>shown
      ? `<tr><td colspan="8" style="padding:0"><button id="folder-more" style="width:100%;padding:11px;font-size:var(--t-body);font-weight:var(--w-strong);color:var(--accent-ink-700);background:none;border:0;border-top:1px solid var(--color-divider);cursor:pointer">Show ${Math.min(FOLDER_PAGE,cs.length-shown)} more · ${cs.length-shown} remaining</button></td></tr>`
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
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',cKind(c),FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
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
  const folders=Object.values(FOLDERS).filter(f=>acc==='*'||acc.includes(f.id));
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
  {k:'overdueob',  get label(){ return i18t('reg_overdue_obligations'); }},
  {k:'archived',   get label(){ return i18t('reg_view_archived'); }},
];
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
/* A column may not be dragged to nothing. A PIXEL floor rather than a percent
   one, because 4% is 51px on a laptop and 77px on a wide monitor — the same
   reasoning that made the divider's own limits pixels. Converted against the
   table's live width at the moment of the drag. */
const REG_COL_MIN_PX = 54;
const REG_COL_KEY = 'hati.v1.regCols';
const regColDefaults = () => (regScope()==='negotiations' ? REG_COL_W_NEGO : REG_COL_W).slice();
/* THE STORED ARRAY IS READ, NEVER TRUSTED. A length that does not match the
   seat's own column count is IGNORED rather than applied — which is the whole
   migration story for the Signed column: a browser that stored eight widths
   before it existed falls back to the defaults instead of shifting every
   column one place left. Same for a total that has drifted off 100, which
   would put the table back into sideways scroll. */
function regColWidths(){
  const def = regColDefaults();
  try{
    const raw = localStorage.getItem(REG_COL_KEY + (regScope()==='negotiations' ? '.nego' : ''));
    if(!raw) return def;
    const w = JSON.parse(raw);
    if(!Array.isArray(w) || w.length !== def.length) return def;
    if(!w.every(n => typeof n === 'number' && isFinite(n) && n > 0)) return def;
    if(Math.abs(w.reduce((a,b)=>a+b,0) - 100) > 0.5) return def;
    return w;
  }catch(_){ return def; }
}
function regColSetWidths(w){
  try{ localStorage.setItem(REG_COL_KEY + (regScope()==='negotiations' ? '.nego' : ''), JSON.stringify(w)); }catch(_){}
}
function regColReset(){
  try{ localStorage.removeItem(REG_COL_KEY + (regScope()==='negotiations' ? '.nego' : '')); }catch(_){}
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

   AND THE QUERY COUNTS ONLY WHERE IT NARROWS. The Negotiations seat draws no
   search box on either shell, so regFiltered ignores a stale query there; a
   head that called it a filter would be the control saying one thing and the
   table another. */
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
  return regNarrowed() ? `<button id="reg-clear-filters" style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--accent-ink-700);background:none;border:0;cursor:pointer;padding:2px var(--s-1)">${i18t('reg_clear')}</button>` : '';
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
  document.getElementById('reg-clear-filters')?.addEventListener('click',()=>{
    const R=regState();
    R.query=''; R.stage='all'; R.type='all'; R.view=null; R.renewal='all';
    R.category='all'; R.signed='all'; R.payterms='all'; R.docs='all'; R.hold='all'; R.only=null; R.page=1;
    const cs=document.getElementById('cmd-search'); if(cs) cs.value='';
    regRepaint();
  });
}
function regNarrowed(R){
  const st = R || regState();
  const q = (regScope()==='negotiations') ? '' : String(st.query||'').trim();
  return !!(q || st.stage!=='all' || st.type!=='all' || st.view
    || (st.renewal && st.renewal!=='all') || (st.category && st.category!=='all')
    || (st.signed && st.signed!=='all') || (st.payterms && st.payterms!=='all')
    || (st.docs && st.docs!=='all')
    || st.only);
}

function regSetScope(k){ REG_SCOPE = (k === 'negotiations') ? 'negotiations' : null; }
const REG_STATE_DEF = () => ({query:'',stage:'all',type:'all',category:'all',signed:'all',payterms:'all',docs:'all',sort:'updated',dir:-1,page:1,sel:{},view:null,only:null});
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
  {k:'clear',tone:'green',  get label(){ return i18t('ngl_band_clear'); }},
];
const NEGO_BAND_DOT={amber:'var(--st-amber-dot)',gray:'var(--color-neutral-400)',green:'var(--st-green-dot)'};
/* Partition, never re-sort inside a group: whatever order the register's own
   sort produced is preserved within each band, which is what makes "Sort" mean
   something on this page. Stamped on the record the way regGroupFamilies
   stamps _famKids, so the renderer does not have to ask twice. */
function negoGroupByMove(cs){
  const buckets={you:[],them:[],clear:[]};
  for(const c of cs){
    const m=(typeof window.negWhoseMove==='function')?window.negWhoseMove(c):{k:'clear',n:0};
    c._ngBand=m.k; c._ngN=m.n;
    (buckets[m.k]||buckets.clear).push(c);
  }
  return NEGO_BANDS.reduce((out,b)=>out.concat(buckets[b.k]||[]),[]);
}
/* How many rows each band holds IN THE SET ON SCREEN. The bands count the
   filtered view — see the note the page prints when a filter is on. */
function negoBandCounts(cs){
  const n={you:0,them:0,clear:0};
  cs.forEach(c=>{ n[c._ngBand===undefined?'clear':c._ngBand]=(n[c._ngBand]||0)+1; });
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

   It is an ordinary filter in every other respect — the stage, stream and
   category dropdowns still narrow further inside it, Clear clears it with the
   rest, and it survives navigation exactly as they do. */
function regShowOnly(ids, label){
  const list=Array.from(new Set((ids||[]).filter(Boolean)));
  /* A named set is always sent to CONTRACTS. The scope is cleared before the
     state is read, or a calendar day pressed while the reader happened to be on
     the Negotiations page would write its answer into that page's filters and
     then open a register that had never heard of it. */
  regSetScope(null);
  const R=regState();
  R.only=list.length?{ ids:list, label:String(label||'') }:null;
  R.page=1;
  if(typeof setView==='function') setView('register'); else renderRegister();
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
const REG_CMP={
  updated:(a,b)=>((Date.parse(a.lastAction)||0)-(Date.parse(b.lastAction)||0)),
  value:(a,b)=>Number(a.value||0)-Number(b.value||0),
  risk:(a,b)=>contractRisk(a)-contractRisk(b),
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
    const A=regRefParts(a.id), B=regRefParts(b.id);
    if(A[0]!==B[0]) return A[0]<B[0]?-1:1;
    return A[1]-B[1]; },
  party:(a,b)=>{
    const A=String(a.counterparty||'').trim(), B=String(b.counterparty||'').trim();
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
  ref:1, party:1, stream:1, move:1, owner:1, kind:1 };
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
const REG_SAVED_FIELDS=['stage','type','view','category','renewal','signed','payterms','docs','hold','sort','dir'];
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
  const R=regState(); REG_SAVED_FIELDS.forEach(k=>{ R[k]=v.set[k]==null?(k==='view'?null:(k==='dir'?R.dir:(k==='sort'?R.sort:'all'))):v.set[k]; });
  R.page=1; return true;
}
function regViewTabsHtml(R){
  const neg=regScope()==='negotiations';
  const count=k=>{ const n=regViewCount(k); return n==null?'':`<span class="n">${n}</span>`; };
  const tab=(k,label)=>{ const on=(R.view||'')===(k||'');
    return `<button type="button" role="tab" class="reg-vtab${on?' on':''}" data-reg-view="${k}" aria-selected="${on?'true':'false'}">${esc(label)}${count(k)}</button>`; };
  const saved=neg?'':regSavedViews().map(v=>{ const on=regSavedMatches(v,R);
    return `<span class="reg-vtab reg-vtab-saved${on?' on':''}" role="tab" aria-selected="${on?'true':'false'}"><button type="button" data-reg-saved="${esc(v.name)}" title="${esc(i18t('reg_saved_view_title'))}">${esc(v.name)}</button><button type="button" class="x" data-reg-saved-x="${esc(v.name)}" title="${esc(i18t('reg_forget_view_title'))}" aria-label="${esc(i18t('reg_forget_view_title'))}">×</button></span>`; }).join('');
  const save=neg?'':`<span class="reg-views-end"><button type="button" id="reg-save-view" class="reg-vtab-act" title="${esc(i18t('reg_save_view_msg'))}">${esc(i18t('reg_save_view'))}</button></span>`;
  return `<div class="reg-views" role="tablist" aria-label="${esc(i18t('reg_quick_filters'))}" title="${esc(i18t('reg_quick_filters_title'))}">${
    tab('',i18t('reg_tab_all'))}${REG_VIEWS.map(v=>tab(v.k,v.label)).join('')}${saved}${save}</div>`;
}
/* The facts line under the page name: the whole book's count and what is on
   paper, converted through fxHome with what has no rate LEFT OUT and said.
   Money only where the reader may see it. Contracts seat only — the
   Negotiations page has its own head. */
function regHeadFactsHtml(){
  const book=state.contracts.filter(c=>!c.archived&&c.status!=='Declined'&&!c.parentId);
  const n=(state.serverStats&&state.serverStats.total!=null&&Number(state.serverStats.total)>state.contracts.length)
    ? Number(state.serverStats.total) : book.length;
  const parts=[i18tn('reg_agreements',n,{n:n.toLocaleString(jxLocale())})];
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
/* Whose move, for the Contracts row — null where no negotiation has started.
   READING MUST NOT WRITE: negoMoveSay runs negWhoseMove, which is safe over
   c.changes, but this asks the raw record first so a page of a hundred
   contracts never initialises one. */
function regMoveWord(c){
  const started=!!(c&&c.negotiation&&Array.isArray(c.changes));
  if(!started) return null;
  try{ return negoMoveSay(c); }catch(_){ return null; }
}
function regOwnerCell(c){
  const name=(window.contractOwnerName&&contractOwnerName(c))||'';
  if(!name) return '<span class="reg-dash">—</span>';
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
  const R=regState();
  /* Neither the amendment fold nor the page counter belongs on a list that
     never pages and groups by something else entirely. */
  const neg=regScope()==='negotiations';
  const flatBtn=neg?'':` · <button type="button" id="reg-flat" style="border:0;background:none;font:inherit;font-size:inherit;color:var(--accent-ink-700);text-decoration:underline;cursor:pointer;padding:0">${R.flat?i18t('reg_group_amendments'):i18t('reg_show_flat')}</button>`;
  const pageNote=(neg||board)?'':` · ${i18t('reg_page_of',{p,n})}`;
  return `${i18t('reg_showing',{start:B(start.toLocaleString(jxLocale())),end:B(end.toLocaleString(jxLocale())),n:B(cs.length.toLocaleString(jxLocale()))})}${totalNote}${neg?'':famNote}${pageNote}${(typeof canViewValues==='function'&&!canViewValues())?'':` · ${i18t('reg_aggregate')} ${B(fmtMoneyShort(regAggregate(cs)))}`}${flatBtn}`;
}
// pinned-footer pager wiring — jump page + scroll the table body back to top
function wireRegPager(){
  document.querySelectorAll('#reg-pager [data-reg-page]').forEach(b=>b.addEventListener('click',()=>{
    const R=regState(); const cs=regFiltered(); const to=Number(b.getAttribute('data-reg-page'));
    R.page=Math.min(Math.max(1,to), regPageCount(cs)); renderRegisterBody();
    const sc=document.getElementById('reg-scroll'); if(sc) sc.scrollTop=0;
  }));
}
function regFiltered(){
  const R=regState(); let cs=state.contracts.slice();
  /* ---- THE PAGE'S OWN NARROWING, ABOVE EVERY QUESTION AND ABOVE `only` ----
     See regSetScope. Nothing below can widen this and no control offers to.
     A stage without the negotiation module answers with NOTHING rather than
     with everything: a page that says "Live negotiations" and lists all 145
     contracts is worse than a page that lists none. */
  if(regScope()==='negotiations')
    cs=(typeof window.negoIsLive==='function') ? cs.filter(c=>negoIsLive(c)) : [];
  /* Then, because it is not a question about a contract but a set somebody
     else chose — everything below narrows WITHIN it. */
  if(R.only&&Array.isArray(R.only.ids)){ const keep=new Set(R.only.ids); cs=cs.filter(c=>keep.has(c.id)); }
  /* ---- THE ARCHIVE SHELF (WO-5): filed away, not deleted ----
     Archived contracts leave every default list and come back under exactly
     ONE view, where they are all that shows. It lives with the views because
     "show me the shelf" is a way of looking, not a stage — an archived
     Signed contract is still Signed. Search (FTS and the palette) still
     finds them, which is the difference between filing and deleting. */
  if(R.view==='archived') cs=cs.filter(c=>!!c.archived);
  else cs=cs.filter(c=>!c.archived);
  // 'awaiting' is a virtual stage = contracts out with a counterparty and not yet
  // signed (a live share in 'sent' or 'opened'), matching the dashboard KPI. It
  // reads the dispatch state, not the status column. Real status pills fall
  // through to the exact-match filter.
  if(R.stage==='awaiting') cs=cs.filter(c=>{ const s=state.shareByContract&&state.shareByContract[c.id]; return !!s&&(s.state==='sent'||s.state==='opened'); });
  else if(R.stage!=='all') cs=cs.filter(c=>c.status===R.stage);
  if(R.type!=='all') cs=cs.filter(c=>c.folder===R.type);
  if(R.renewal&&R.renewal!=='all') cs=cs.filter(c=>(c.metadata&&c.metadata.renewalType)===R.renewal);
  if(R.category&&R.category!=='all') cs=cs.filter(c=>regCatMatch(c,R.category));
  /* SIGNED IN A GIVEN YEAR (J-5.1). Asked of the ONE reading, so this list and
     the Signed column above it can never disagree about which year a contract
     belongs to. A contract with no signature is in no year and is narrowed out
     of every one of them, which is the honest answer rather than a bucket. */
  if(R.signed&&R.signed!=='all'){
    const y=regSignedYear(R.signed);
    cs=cs.filter(c=>{ const d=regSignedOn(c); return !!d && d.slice(0,4)===y; });
  }
  /* HOW LONG THE PAYMENT TERMS RUN (owner-ruled 2 Sep 2026). Asked of the ONE
     reading, so this list and the payment terms tab can never sort a contract
     into two different bands; `none` is the contracts nobody has read the
     terms off, which is the actionable cut on this subject rather than an
     absence to be folded away. Read through a typeof guard, the ES-module
     rule: on a stage that does not carry js/payterms.js the filter narrows
     nothing rather than emptying the register. */
  if(R.payterms&&R.payterms!=='all'&&typeof payDays==='function'){
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
  if(R.hold&&R.hold!=='all'&&typeof contractOnHold==='function'){
    const want=R.hold==='on';
    cs=cs.filter(c=>contractOnHold(c)===want);
  }
  if(R.docs&&R.docs!=='all'&&typeof contractDocuments==='function'){
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
  const expWithin=n=>c=>{ if(c.parentId||c.status==='Declined') return false; const e=effectiveExpiry(c); return !!e&&daysUntil(e)>=0&&daysUntil(e)<=n; };
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
     the shell bar's, and clearing it widens the list again; the Negotiations
     seat draws none on either shell, so a stale value there narrows nothing —
     which is M-5's own rule, kept. regNarrowed asks the same question the same
     way, so no head can call this page filtered when it is not. */
  const q=(regScope()==='negotiations'?'':String(R.query||'')).trim().toLowerCase();
  /* ---- A SEARCH MATCHES ANY PARTY'S NAME (22 Sep 2026) ----
     Without this a three-party contract disappears from a search for the
     company that GUARANTEES it, which is exactly the company a reader looking
     for an exposure searches by. `partiesMatch` derives the pair where nothing
     is stored, so on every contract on file it answers what the counterparty
     test answered and the result set does not move. */
  if(q) cs=cs.filter(c=>((c.name||'')+' '+(c.counterparty||'')+' '+(c.id||'')).toLowerCase().includes(q)
    || (typeof partiesMatch==='function' && partiesMatch(c,q)));
  // Per-member folder/stream access: a restricted member only ever sees the
  // streams an admin granted them (admins are always unrestricted).
  const acc=(typeof userFolderAccess==='function')?userFolderAccess():'*';
  if(acc!=='*') cs=cs.filter(c=>acc.includes(c.folder));
  const sortKey=(R.sort==='value' && typeof canViewValues==='function' && !canViewValues()) ? 'updated' : R.sort;
  const cmp=REG_CMP[sortKey]||REG_CMP.updated;
  const dir=(R.dir===1||R.dir===-1)?R.dir:(REG_SORT_DEFDIR[sortKey]||-1);
  cs.sort((a,b)=>{ const r=dir*cmp(a,b); return r!==0?r:((Date.parse(b.lastAction)||0)-(Date.parse(a.lastAction)||0)); });
  /* GROUPED BY WHOSE MOVE IT IS, not by family. An amendment carries its own
     negotiation, so nesting one under its parent here would put two separate
     arguments on one row; and the group order is the whole design of this page.
     The register's sort survives — it decides the order INSIDE each band. */
  if(regScope()==='negotiations') return negoGroupByMove(cs);
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
  /* ════ AND THE WORDS THAT TELL THE THREE APART (21 Sep 2026, the process
     review's sixth item) ══════════════════════════════════════════════════
     Decline, Archive and Hold are three different things and nothing anywhere
     said how they differ — a reader deciding what to do with a dead
     negotiation had to already know that archive hides it, decline closes it
     and hold freezes it. `END_STATES` is now the ONE place those three
     sentences live, and each row carries its own on the hover.
     THE REVIEW ASKED FOR ONE DOOR INSTEAD OF THREE and that is NOT built,
     deliberately: the owner ruled Hold onto this very row by name on 19 Sep,
     over a drawing, because reaching it meant opening the contract first —
     and a chooser would put it one press further away again. The words were
     the half that was missing; the rows were not. */
  {k:'decline',ic:'ban',       get label(){ return i18t('reg_decline_close'); },
   get says(){ return i18t('end_decline_says'); }, ruby:true},
  /* the archive shelf (WO-5): reversible filing, editor-and-up — the same
     level as re-filing between streams, and audited the same way */
  {k:'archive', ic:'folder',  get label(){ return i18t('reg_archive'); },
   get says(){ return i18t('end_archive_says'); },
   when:c=>!c.archived&&(typeof canEdit!=='function'||canEdit())},
  {k:'restore', ic:'history', get label(){ return i18t('reg_restore'); }, when:c=>!!c.archived&&(typeof canEdit!=='function'||canEdit())},
  /* ════ AND THE HOLD, BESIDE ARCHIVE (Young reported it 19 Sep 2026) ═══════
     "Image 2 shows there is still no option for putting a hold or freezing a
     contract like it shows in the artifact image." He is right and the
     drawing is unambiguous: the act belongs on THIS menu — the row you are
     looking at when you hear about a dispute. It was built on the contract's
     own ⋯ instead, which means opening the contract first.
     THE TWO ARE OPPOSITES AND BELONG BESIDE EACH OTHER: one takes a contract
     off every list, the other freezes it and leaves it on all of them.
     Same act shape as Archive, and NOT a second door — `contractSetHold` is
     the one act, pressed from here and from the contract's own menu, exactly
     as `contractSetArchived` already is.
     DRAWN ONLY WHERE IT WOULD WORK, which is this catalogue's own rule: the
     per-person grant decides, the server's mayHoldRow is the wall. */
  {k:'hold',    ic:'shield',  get label(){ return i18t('hd_hold'); },
   get says(){ return i18t('end_hold_says'); },
   when:c=>!contractOnHold(c)&&(typeof mayHoldContract!=='function'||mayHoldContract())},
  {k:'release', ic:'history', get label(){ return i18t('hd_release'); },
   when:c=>!!contractOnHold(c)&&(typeof mayHoldContract!=='function'||mayHoldContract())},
  // permanent delete — only offered while a contract is still a draft or in review
  {k:'delete', ic:'trash',     get label(){ return i18t('reg_delete_permanently'); }, ruby:true, when:c=>c.status==='Draft'||c.status==='Under Review'},
];
/* WHAT EACH OF THE THREE ACTUALLY PRESSES. One place, so the chooser and the
   rows that survive cannot drift about what an act means. Decline still
   finishes inside the contract, exactly as the row did: closing a negotiation
   is a decision with paper attached, not a menu press. */
function regEndAct(c, k){
  if(!c) return;
  if(k === 'archive'){
    if(window.contractSetArchived) contractSetArchived(c, true).then(ok=>{ if(ok) regRepaint(); });
    return;
  }
  if(k === 'hold'){
    if(!window.contractSetHold || !window.promptDialog) return;
    Promise.resolve(promptDialog({ title:i18t('hd_ask_title'), message:i18t('hd_ask_msg'),
      placeholder:i18t('hd_ask_ph'), confirmLabel:i18t('hd_hold'), multiline:true }))
      .then(why=>{ if(why==null) return;
        contractSetHold(c, true, why).then(ok=>{ if(ok) regRepaint(); }); });
    return;
  }
  openWorkspace(c.id);   /* decline — completed inside the contract, as before */
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
  if(m.k==='you') return out('you',MINE,i18tn('ng_needs_you',m.n,{n:m.n}));
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
/* ---- A BAND IS NOT A ROW ----
   It is a full-width heading that happens to live between rows: a coloured dot,
   the name in small caps, the count. Everything about the markup says so —
   role="presentation" on the <tr> and the <td> so no screen reader announces a
   table row, a real heading inside for the ones that do announce, no data-row
   (which is what wireRegRows binds the whole-row click to), no tab stop, and it
   is generated during render rather than being a member of the filtered set, so
   the footer's "showing 1–8 of 8" can never count one. */
function negoBandRowHtml(band, n){
  /* THE SEAT'S OWN COUNT, NEVER A LITERAL: a band only ever draws on the
     Negotiations seat, so it spans REG_COL_KEYS_NEGO. It read a literal 8, and
     when the stream column left that seat (24 Sep 2026) the band would have
     spanned one column more than the table draws. */
  /* ---- THE COUNT IS PART OF THE HEADING (21 Sep 2026, Young: the four pages
     must look exactly like the artifact) ---- the reference writes
     "WAITING ON YOU · 3" as one line; HaTi boxed the number in a pill beside
     it, which is a second shape for a fact the words are already carrying.
     Same reading, same element, same class, no box. */
  return `<tr class="ngl-band" role="presentation"><td role="presentation" colspan="${REG_COL_KEYS_NEGO.length}">
    <div class="ngl-band-in" role="heading" aria-level="3">
      <span class="ngl-band-dot" style="background:${NEGO_BAND_DOT[band.tone]}" aria-hidden="true"></span>
      <span class="ngl-band-k">${esc(band.label)}</span>
      <span class="ngl-band-n">· ${n}</span>
    </div></td></tr>`;
}
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
      ? `<button id="reg-empty-clear" class="ui-btn" style="font-size:var(--t-meta);padding:6px 14px">${i18t('reg_clear_all_filters')}</button>`
      /* The same act as the header's, so the same button — see pageActionHtml. */
      : `<button id="reg-empty-new" class="hm-primary">${
          icon('plus','w-3.5 h-3.5',2)} ${i18t('home_draft_new')}</button>`;
    /* THIS SHAPE IS NOW THE PRODUCT'S — it was the one screen that had a
       designed empty state, and emptyStateHtml is it, extracted so the other
       six can be it too. Read through window: this is a module. */
    return `<tr><td colspan="${(neg?REG_COL_KEYS_NEGO:REG_COL_KEYS).length}" style="padding:var(--s-12) var(--s-3);text-align:center">${
      typeof window.emptyStateHtml==='function'
        ? window.emptyStateHtml({ icon:'list', title:line, sub, action:btn })
        : `<div style="max-width:340px;margin:0 auto"><div style="font-size:var(--t-card);font-weight:var(--w-strong)">${line}</div>`
          + `<div style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:var(--s-1) 0 14px">${sub}</div>${btn}</div>`
      }</td></tr>`;
  }
  const p=regCurPage(cs); const size=regPageSize(); const start=(p-1)*size;
  const pageRows=cs.slice(start, start+size);
  /* THREE BANDS, IN FIXED ORDER, EACH WITH ITS OWN COUNT — and an empty one is
     information ("Waiting on you · 0" is worth reading), which is why they are
     drawn off the fixed list rather than off the rows that happen to exist.
     Three bands over NOTHING is not information, and that case never reaches
     here: with no live negotiation at all the page draws its empty state
     instead of a table (see renderNegotiationsList). */
  const bandN=neg?negoBandCounts(pageRows):null;
  let bandAt=neg?0:-1;
  const bandsBefore=k=>{
    if(!neg) return '';
    let out='';
    while(bandAt<NEGO_BANDS.length && NEGO_BANDS[bandAt].k!==k){
      out+=negoBandRowHtml(NEGO_BANDS[bandAt],bandN[NEGO_BANDS[bandAt].k]||0); bandAt++;
    }
    if(bandAt<NEGO_BANDS.length){ out+=negoBandRowHtml(NEGO_BANDS[bandAt],bandN[k]||0); bandAt++; }
    return out;
  };
  const bandsAfter=()=>{
    let out='';
    while(neg && bandAt<NEGO_BANDS.length){
      out+=negoBandRowHtml(NEGO_BANDS[bandAt],bandN[NEGO_BANDS[bandAt].k]||0); bandAt++;
    }
    return out;
  };
  let lastBand=null;
  /* THE SENTENCE RIDES THE HOVER, which is this product's own answer for a
     fact about the machinery: the three that end a contract carry one line
     each saying what they do, from END_STATES, so the menu and any other home
     cannot word them differently. */
  const actBtns=c=>REG_ROW_ACTIONS.filter(a=>!a.when||a.when(c)).map(a=>`<button data-act="${a.k}" data-id="${c.id}"${a.says?` title="${esc(a.says)}"`:''} class="reg-act${a.ruby?' danger':''}" style="display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;font:inherit;font-size:var(--t-meta);text-align:left;padding:6px 9px;border-radius:var(--radius);cursor:pointer;color:${a.ruby?'var(--st-ruby-fg)':'inherit'}">${window.icon?icon(a.ic,'w-3.5 h-3.5'):''}${a.label}</button>`).join('');
  return pageRows.map((c,i)=>{
    const eff=effectiveExpiry(c);
    const din=eff?daysUntil(eff):null;
    const renDate=eff?regDotDate(eff):'—';   // the artifact's "30 Jun 2027" shape
    const renIn=din==null?'':(din<0?i18t('reg_days_over',{n:Math.abs(din)}):i18t('reg_in_days',{n:din}));
    // urgency colour: red under 30 days (and overdue), gold under 90, else neutral
    const renUrgent=din!=null&&din<30, renSoon=din!=null&&din>=30&&din<=90;
    /* ---- ONE COLOUR PER EXPIRY CELL (the black ink, 24 Aug 2026) ----
       The date and its "· N d" suffix are one fact read as one glance, and
       the design draws the whole cell in one colour. HaTi drew the date in the
       primary ink and the suffix in the LABEL ink, so an ordinary row carried
       two greys inside a single cell — and the suffix was 14px text sitting on
       the secondary shade, which this product's own four-shades rule reserves
       for 11–13px. Urgent and soon already agreed (both halves ruby, both
       amber); only the ordinary branch disagreed, and it now matches the date
       beside it. THE URGENCY TONES ARE UNTOUCHED — the whole point of the cell
       is that ruby and amber still mean what they mean. */
    const renColor=din==null?'transparent':(renUrgent?'var(--st-ruby-fg)':renSoon?'var(--st-amber-fg)':'var(--color-neutral-700)');
    const renDateColor=renUrgent?'var(--st-ruby-fg)':renSoon?'var(--st-amber-fg)':'var(--color-neutral-700)';
    const val=!isMonetary(c)?'n/m':(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'—');
    /* The band header for the group this row opens, drawn once, ahead of it. */
    let band='';
    if(neg && c._ngBand!==lastBand){ band=bandsBefore(c._ngBand); lastBand=c._ngBand; }
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
    const mv=regMoveWord(c);
    const CELL={};
    CELL.mk=`<td class="reg-mk">${c.id}</td>`;
    CELL.stage=`<td style="white-space:nowrap"><span style="display:inline-flex;align-items:center;gap:6px">${window.questionDot?questionDot(c.id):''}${window.contractStatusDotHtml?contractStatusDotHtml(c):(window.contractStatusChip?contractStatusChip(c):statusChip(c.status))}</span></td>`;
    CELL.move=neg ? `<td style="text-align:right;white-space:nowrap">${negoMovePillHtml(c)}</td>`
      : `<td style="white-space:nowrap">${mv?negoMovePillHtml(c):'<span class="reg-dash">—</span>'}</td>`;
    CELL.owner=`<td style="white-space:nowrap">${regOwnerCell(c)}</td>`;
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
    CELL.counterparty=`<td class="reg-cell-title" style="${c._famChild?'padding-left:30px':''}" title="${esc(pyAll||cpName)} · ${esc(regTitleOf(c))} · ${esc(kindRound)}">
        <span style="display:flex;align-items:center;gap:9px;min-width:0">
        <span class="reg-title" style="min-width:0;flex:1;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c._famChild?`<span style="color:var(--color-neutral-400);font-family:var(--font-mono);font-size:var(--t-body);font-weight:var(--w-body)" title="${esc(RELATION_LABEL[c.relation]||'Amendment')} of ${esc(c.parentId)}">↳ </span>`:''}${esc(cpName)}${pyTag}${c._famKids?`<button type="button" data-fam-toggle="${c.id}" title="${R.collapsed&&R.collapsed[c.id]?'Show':'Hide'} the ${c._famKids} linked document${c._famKids===1?'':'s'}" style="margin-left:6px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:0;font:inherit;font-weight:var(--w-body);font-size:var(--t-body);font-family:var(--font-mono);padding:1px 7px;cursor:pointer;color:var(--color-neutral-700)">${R.collapsed&&R.collapsed[c.id]?'+':'−'}${c._famKids}</button>`:''}</span>
        </span><span class="reg-sub">${esc(regTitleOf(c))}</span>
      </td>`;
    /* THE KIND AND THE ROUND ARE A COLUMN ON THE NEGOTIATIONS SEAT ALONE,
          built only where it is drawn (the `acts` column's own rule): a round
          is what that page is about. On Contracts the same words are on the
          cell's hover above. */
    CELL.kind=neg?`<td class="reg-typecell">${esc(kindRound)}</td>`:'';
    /* ---- THE `stream` CELL IS GONE FROM BOTH SEATS (24 Sep 2026) ----
          Owner-ruled with the filter kept. DELETED RATHER THAN STUBBED, for
          the `name` column's reason below. regStreamName stays: the sort by
          stream (in the dropdown) still reads it, and the CSV export keeps
          its own Folder column. */
    CELL.value=`<td style="text-align:right;font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-weight:var(--w-body);white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}">${val}</td>`;
    CELL.signed=`<td style="white-space:nowrap">${regSignedCell(c)}</td>`;
    CELL.expiry=`<td style="white-space:nowrap"><span class="reg-day" style="color:${renDateColor}">${renDate}</span>${renIn?` <span class="reg-day" style="color:${renColor}">· ${renIn}</span>`:''}</td>`;
    /* Built only on the seat that draws it: the Negotiations seat has no ⋯
       column, and actBtns asks readings (contractOnHold) that a stage drawing
       only that seat need not carry — f184 caught the unconditional build. */
    CELL.acts=neg?'':`<td class="reg-cell-menu" style="position:relative;text-align:right;white-space:nowrap" onclick="event.stopPropagation()">
        <button data-menu="${c.id}" style="border:0;background:none;cursor:pointer;padding:0 var(--s-1);line-height:var(--row-line-1);color:var(--color-neutral-600);font-size:var(--t-body);letter-spacing:1px;vertical-align:middle" title="${i18t('reg_more_actions')}">⋯</button>
        <div data-menu-pop="${c.id}" style="display:none;position:absolute;right:8px;top:34px;z-index:30;width:180px;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);border-radius:var(--radius);padding:var(--s-1);flex-direction:column;text-align:left">${actBtns(c)}</div>
      </td>`;
    /* ---- THE `name` COLUMN IS GONE FROM BOTH SEATS (21 Sep 2026) ----
          Everything it drew is in CELL.counterparty above: the title on the
          second line, the family indent, the arrow and the toggle. DELETED
          RATHER THAN STUBBED — nothing outside this function ever read it,
          and a builder with no key in REG_COL_KEYS is a builder nothing can
          call. `reg_col_title` stays LIVE: it is the sort dropdown's own
          label, and sorting by title is still offered there. */
    return band + `
    <tr data-row="${c.id}"${neg?' data-nego-row="1"':''} tabindex="${i===0?0:-1}"
      style="cursor:pointer;animation-delay:${Math.min(i,14)*22}ms">${(neg?REG_COL_KEYS_NEGO:REG_COL_KEYS).map(k=>CELL[k]||'').join('')}
    </tr>`;
  }).join('')
    /* Any band with no rows under it still gets its header and its zero — and
       the trailing ones are only reachable here, after the last row. */
    + bandsAfter();
}
// W2-1: converted to the workspace currency, so one column total is one currency
function regAggregate(cs){ return cs.filter(c=>c.status!=='Declined'&&!c.archived&&isMonetary(c)).reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0); }
function renderRegisterBody(){
  const cs=regFiltered();
  /* The stagger intro belongs to arriving at the page; this body re-renders on
     every search keystroke, sort and pager press, and rows that replay their
     fade-in per keystroke read as a flickering table. One intro, then still. */
  const tb=document.getElementById('reg-tbody'); if(tb){ tb.innerHTML=regRowsHtml(cs); wireRegRows(); }
  const sh=document.getElementById('reg-showing'); if(sh){ sh.innerHTML=regFooterText(cs);
    document.getElementById('reg-flat')?.addEventListener('click',()=>{ const R=regState(); R.flat=!R.flat; renderRegisterBody(); }); }
  const pgr=document.getElementById('reg-pager'); if(pgr){ pgr.innerHTML=regPager(cs); wireRegPager(); }
  /* The search narrows from the shell bar, which repaints only this body — so
     the way back has to follow it here rather than waiting for a full render. */
  regPaintClear();
}
function regCloseMenus(){ document.querySelectorAll('#reg-tbody [data-menu-pop]').forEach(m=>m.style.display='none'); }
function wireRegRows(){
  /* Whole-row click opens the contract's workspace — EXCEPT on the Negotiations
     page, where a row opens the NEGOTIATION. Same table, same builder, one
     different destination, decided off the row's own attribute rather than off
     the scope flag so a row can never disagree with the page that drew it. */
  const openRow=el=>{
    const id=el.getAttribute('data-row');
    /* A ROW IS NOT GREYED — a table row that cannot open the negotiation
       (sealed or archived paper, per negoMayStart) opens the CONTRACT instead,
       which is where that row lands on the Contracts page; the negotiation's
       record is on its History tab. The funnel would refuse anyway; this is
       the row landing somewhere true rather than pressing a wall. */
    const cRow=(typeof getContract==='function')?getContract(id):null;
    const mayNego=!cRow||!window.negoMayStart||negoMayStart(cRow).ok;
    if(el.getAttribute('data-nego-row')&&mayNego&&window.openRedlineWorkbench) openRedlineWorkbench(id);
    else selectContract(id);
  };
  document.querySelectorAll('#reg-tbody [data-row]').forEach(el=>el.addEventListener('click',()=>openRow(el)));

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
  document.querySelectorAll('#reg-tbody [data-menu]').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); const id=btn.getAttribute('data-menu'); const pop=document.querySelector('#reg-tbody [data-menu-pop="'+id+'"]'); const open=pop&&pop.style.display==='flex'; regCloseMenus(); if(pop&&!open) pop.style.display='flex'; }));
  document.querySelectorAll('#reg-tbody [data-act]').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); regCloseMenus();
    const id=b.getAttribute('data-id'), act=b.getAttribute('data-act'), c=getContract(id); if(!c) return;
    if(act==='open') openWorkspace(id);
    else if(act==='share') openShareModal(c);
    else if(act==='scan') runScanFor(c);

    else if(act==='archive'||act==='restore'){
      if(window.contractSetArchived) contractSetArchived(c,act==='archive').then(ok=>{ if(ok) regRepaint(); });
    }
    /* THE REASON IS COMPULSORY, so the press asks for it before anything is
       written — `contractSetHold` refuses an empty one, and a dialog is the
       only honest way to collect it. Releasing needs none. Both go through the
       one act; nothing here writes to the record. */
    else if(act==='hold'||act==='release'){
      if(!window.contractSetHold) return;
      if(act==='release'){ contractSetHold(c,false,'').then(ok=>{ if(ok) regRepaint(); }); return; }
      if(!window.promptDialog) return;
      Promise.resolve(promptDialog({ title:i18t('hd_ask_title'), message:i18t('hd_ask_msg'),
        placeholder:i18t('hd_ask_ph'), confirmLabel:i18t('hd_hold'), multiline:true }))
        .then(why=>{ if(why==null) return;
          contractSetHold(c,true,why).then(ok=>{ if(ok) regRepaint(); }); });
    }
    else if(act==='delete') deleteContract(id).then(ok=>{ if(ok){
      /* The reader was three pages down when they pressed Delete; the row goes,
         the place stays. renderRegister() rebuilds the whole view and hard-resets
         R.page to 1, and the table scrolls inside #reg-scroll (not the outer
         #content-scroll) — so repaint only the body, which keeps the current page
         (clamping just if this page emptied), and put #reg-scroll back where it was. */
      const sc=document.getElementById('reg-scroll'); const top=sc?sc.scrollTop:0;
      renderRegisterBody();
      const sc2=document.getElementById('reg-scroll');
      if(sc2){ sc2.scrollTop=top;
        if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ sc2.scrollTop=top; }); }
    } });
    else openWorkspace(id); // Export PDF / Decline & close are completed inside the workspace
  }));
  // empty-state actions
  document.getElementById('reg-empty-clear')?.addEventListener('click',()=>{ const R=regState(); R.query=''; R.stage='all'; R.type='all'; R.view=null; R.renewal='all'; R.category='all'; R.signed='all'; R.payterms='all'; R.docs='all'; R.hold='all'; R.only=null; R.page=1; const cs=document.getElementById('cmd-search'); if(cs) cs.value=''; regRepaint(); });
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
  const body=rows.map(c=>[c.id,c.name,c.counterparty||'',cKind(c),(c.metadata&&c.metadata.category)||'',FOLDERS[c.folder]?.name||'',csvValueCell(c),statusLabel(c.status),c.lastAction||'',c.expiry||''].map(esc).join(','));
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
let _regOpts={};
/* Repaint the page that is actually on screen. Every filter control inside this
   file used to call renderRegister() bare, which with two pages sharing the
   renderer would have turned Negotiations into Contracts on the first press of
   a dropdown — the scope reset to null by the argument nobody passed. */
function regRepaint(){ renderRegister(_regOpts); }
function renderRegister(opts){
  const o=opts||{};
  _regOpts={ scope:o.scope||null, head:o.head||null, nav:o.nav||'register', hostId:o.hostId||'content' };
  regSetScope(o.scope);
  const neg=regScope()==='negotiations';
  const R=regState(); R.page=1;
  const cs=regFiltered();
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
    return `<label class="reg-f reg-chip${active?' on':''}${show?' reg-chip-show':''}" title="${esc(title)}">${icon('filter','w-3 h-3')}<span class="reg-f-l">${face}</span><select id="${id}" class="reg-chip-sel" title="${esc(title)}">${opts}</select></label>`;
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
  /* THE CHIP IS THE NARROWING AND THE WAY OUT OF IT, in one object — see
     regShowOnly. It leads the bar because it is the widest statement on it:
     every dropdown beside it narrows within this set. */
  const onlyChip=R.only?`<span id="reg-only-chip" title="${esc(i18t('reg_only_title'))}"
      style="display:inline-flex;align-items:center;gap:7px;font-size:var(--t-meta);font-weight:var(--w-strong);border-radius:var(--radius);padding:5px 6px 5px 10px;
        background:var(--st-steel-bg);border:1px solid var(--st-steel-line);color:var(--st-steel-fg)">
      <span>${esc(R.only.label||i18t('reg_only_fallback'))}</span>
      <button id="reg-only-clear" title="${esc(i18t('reg_only_clear'))}" aria-label="${esc(i18t('reg_only_clear'))}"
        style="border:0;background:none;font:inherit;font-size:var(--t-body);line-height:1;color:inherit;cursor:pointer;padding:0 3px;opacity:.7">&times;</button>
    </span>`:'';
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
  /* NEVER SIGNED ON THE NEGOTIATIONS SEAT, for the reason its own filter gives
     twenty lines down: that page holds live negotiations and has no Signed
     column, so ordering by a date none of them carries is a control whose one
     outcome is a list of em-dashes. */
  const sortOpts=visibleSorts(REG_SORTS).filter(s=>!(neg&&s.k==='signed'))
    .map(s=>`<option value="${s.k}" ${R.sort===s.k?'selected':''}>${s.label}</option>`).join('');
  // Clickable, sortable column header: shows a dim ↕ when inactive and a solid
  // ▲/▼ for the active sort direction. Clicking toggles asc/desc (see wiring below).
  const sortCaret=key=>R.sort===key
    ? `<span style="margin-left:var(--s-1);font-size:var(--t-figure);color:var(--accent-ink-700)">${R.dir===1?'▲':'▼'}</span>`
    : `<span class="reg-sort-idle" style="margin-left:var(--s-1);font-size:var(--t-figure);color:var(--color-neutral-400)">↕</span>`;
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
  const COLW=regColWidths();
  let _colN=0;
  const gripFor=i=>(i>=COLW.length-1) ? '' :
    `<span class="reg-grip" data-reg-grip="${i}" role="separator" aria-orientation="vertical" tabindex="0"
       title="${esc(i18t('reg_col_drag'))}" aria-label="${esc(i18t('reg_col_drag'))}"></span>`;
  const colAt=(extra='')=>{ const i=_colN++; return `width:${COLW[i]}%;${extra}`; };
  const sortableTh=(key,label,extra='')=>{ const i=_colN;
    return `<th class="reg-th-sort${R.sort===key?' active':''}" data-reg-sort="${key}" role="button" tabindex="0" title="${i18t('reg_sort_by',{col:label})}" aria-sort="${R.sort===key?(R.dir===1?'ascending':'descending'):'none'}" style="cursor:pointer;user-select:none;${colAt(extra)}">${label}${sortCaret(key)}${gripFor(i)}</th>`; };
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

  const hostEl=document.getElementById(_regOpts.hostId)||document.getElementById('content');
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
  <div class="view-enter${neg?' ngl-page':''}" style="height:var(--view-h);box-sizing:border-box;padding:var(--page-pad-t) var(--page-pad-x) 14px;display:flex;flex-direction:column">
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
      .reg-table th{text-align:left;font-size:var(--t-micro);font-weight:var(--w-title);
        text-transform:uppercase;letter-spacing:.06em;
        color:var(--color-neutral-500);padding:var(--s-2) var(--pad-row-x);
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
      .reg-mk{font-family:var(--font-mono);font-size:var(--t-body);font-weight:var(--w-body);
        color:var(--accent-ink-700);white-space:nowrap;font-variant-numeric:tabular-nums}
      /* The status chip, flattened HERE and not at .badge — that class dresses
         every card, list and panel in the product, and this is a decision about
         a table row. The wash and the ink are untouched. */
      .reg-table .badge{font-size:var(--t-body);font-weight:var(--w-body)}
      /* THE CONTRACT'S NAME IS THE ROW'S SUBJECT (21 Sep 2026): the
         reference's own title cell is 13/500, one step up from the cells
         beside it, so the eye runs down the names. The 23 Aug one-size,
         one-weight ruling was about SIZE — every cell is still 13px. */
      .reg-title{font-weight:var(--w-label);color:var(--color-text);line-height:var(--row-line-1)}
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
      .reg-table td.reg-cell-menu{overflow:visible;text-overflow:clip}
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
      .reg-band{background:var(--color-surface);border-bottom:1px solid var(--color-divider);
        margin:calc(var(--page-pad-t) * -1) calc(var(--page-pad-x) * -1) 0;
        padding:var(--page-pad-t) var(--page-pad-x) 10px;
        display:flex;flex-direction:column;gap:var(--s-2)}
      /* AND THE PAGE'S NAME IS ON THE BAND WITH IT. The title, its sentence and
         the one act are drawn by the SHELL into #page-head, which is a sibling
         ABOVE #content and cannot be wrapped from in here — so it is painted
         rather than moved. This rule lives in the register's own <style>, which
         is injected with the register's markup and goes with it, so no other
         view ever sees it: the page after this one gets its grey back with
         nothing to remember. The two boxes butt exactly (the head's bottom IS
         the content's top, measured), and the head runs 10px wider because it
         sits outside the scroller — that 10px is the scrollbar gutter. */
      #page-head{background:var(--color-surface)}
      /* ---- AND THE BAND REACHES THE SCREEN'S EDGE (owner-reported 25 Aug
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
      .reg-stg{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;font-weight:var(--w-body);vertical-align:middle}
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
    <div style="display:flex;flex-direction:column;gap:var(--s-2);flex:1;min-height:0">
      ${''/* THE BAND — the page's own name, its filters and its search on one
             white ground, with the table's card below it on the page grey. */}
      <div class="reg-band">
      ${headHtml}
      ${BAR.includes('view')?regViewTabsHtml(R):''}
      <!-- THE ONE FILTER BAR: stage · stream · quick filter · category · renewal ·
           clear,
           then sort, full-text search (server mode) and the export — a single
           compact strip where three tiers of pills used to stack, so the table
           itself starts above the fold. -->
      <div class="reg-filterbar" style="display:flex;flex-wrap:wrap;gap:var(--s-2) 10px;align-items:flex-end">
        ${lockChip}
        ${onlyChip}
        ${ftsBlock}
        ${''/* ---- ONLY THE CHOSEN FILTERS DRAW, PLUS ANY THAT ARE NARROWING ----
               regBarShown() is the union: what this reader put on their bar,
               and anything currently cutting the list whether they chose it or
               not. The second half is the safety property — a hidden control
               quietly shortening the book is the exact fault WO-15's removal
               note was guarding against. */}
        ${BAR.includes('stage')?selFilter('reg-stage-sel',stageOpts,R.stage!=='all',i18t('reg_lifecycle_stage'),i18t('reg_chip_stage')):''}
        ${BAR.includes('type')?selFilter('reg-type-sel',typeOpts,R.type!=='all',i18t('reg_value_stream'),i18t('reg_chip_stream')):''}
        ${''/* The long sentence is the TOOLTIP, not the label — used as a label it
                    ran to 460px and pushed the whole bar off the row. */}
        ${BAR.includes('category')?categorySel:''}
        ${BAR.includes('renewal')?selFilter('reg-renewal',renewalOpts,renewalActive,i18t('reg_renewal')):''}
        ${''/* NEVER ON THE NEGOTIATIONS SEAT: that page holds live negotiations,
               and narrowing them by the year they were signed would be a
               control whose only outcome is an empty page. */}
        ${(!neg&&BAR.includes('signed'))?selFilter('reg-signed',signedOpts,signedActive,i18t('reg_signed_title'),i18t('reg_signed')):''}
        ${BAR.includes('payterms')?selFilter('reg-payterms',ptOpts,ptActive,i18t('reg_payterms_title'),i18t('reg_payterms')):''}
        ${BAR.includes('docs')?selFilter('reg-docs',docsOpts,docsActive,i18t('reg_docs_title'),i18t('reg_docs')):''}
        ${BAR.includes('hold')?selFilter('reg-hold',holdOpts,holdActive,i18t('reg_f_hold_title'),i18t('reg_f_hold')):''}
        ${''/* THE DOOR TO THE REST. A link rather than a button, because it
               opens a chooser rather than acting on the list — the same
               weight Fiori gives it. */}
        <button id="reg-adapt" type="button" class="reg-chip reg-chip-btn" title="${esc(i18t('reg_adapt_title'))}">+ ${esc(i18t('reg_adapt'))}</button>
        <span id="reg-clear-slot">${regClearHtml()}</span>
        <span style="flex:1;min-width:8px"></span>
        ${''/* ---- SORT IS STACKED LIKE THE OTHER FIVE (owner-asked 25 Aug 2026:
               "stack Sort's label like the other five") ----
               It carried its word BESIDE the box while the other five carry
               theirs ABOVE it, which is a wider shape for the same control —
               MEASURED, it was the widest item on the row and therefore the
               first to drop to a second line when Swedish's longer words or an
               active filter's 600 weight pushed the row over.
               IT GOES THROUGH selFilter, THE SAME BUILDER, rather than being
               restyled to match: one builder for all six is what stops them
               drifting apart again, and it is what let this one drift in the
               first place.
               `active` IS ALWAYS FALSE, deliberately. On the other five that
               flag means "this is narrowing your list", and sorting narrows
               nothing — a sort control wearing the accent would claim the list
               was filtered when it is not. */}
        ${''/* ---- DENSITY SITS BESIDE SORT, AFTER THE SPACER, AND FOR THE SAME
               REASON (25 Aug 2026) ----
               Everything LEFT of the spacer narrows the list; these two change
               how it is DRAWN. `active` is false for the same reason it is
               false on Sort: on the five filters that flag means "this is
               narrowing your list", and a density wearing the accent would
               claim the book had been filtered when it has not.
               It goes through selFilter — the same builder as the other six —
               because one builder is what stops them drifting apart. */}
        ${selFilter('reg-sort',sortOpts,false,i18t('reg_sort'),undefined,true)}
        ${''/* ---- TABLE · BOARD, THEN THE THREE DENSITIES, AS SEGMENTS (20 Sep
               2026, the redesign order) ----
               The density was a labelled dropdown through selFilter; the
               reference draws both of these as segmented controls at the
               row's right, and a segment says every option at once where a
               dropdown says one. Same three densities (regSetDensity), same
               store, same repaint. Table · Board is never drawn on the
               Negotiations seat — see regMode. */}
        ${neg?'':regSegHtml('data-reg-mode',[['table',i18t('reg_mode_table')],['board',i18t('reg_mode_board')]],regMode(),i18t('reg_mode_title'))}
        ${regMode()==='board'?'':regSegHtml('data-reg-density',Object.keys(REG_DENSITY).map(k=>[k,i18t('reg_density_'+k)]),regDensity(),i18t('reg_density_title'))}
        ${''/* ---- AND NO NOTE UNDER THE SORT (M-5) ----
               Owner-reported in the same breath: *"remove the 'sorts within
               each group' writing."* It said that sorting on this page runs
               inside a band rather than over the whole list — true, and a
               sentence the page can carry only once the reader has already
               seen the bands it is about. `ngl_sort_note` and `#reg-sort-note`
               are STALE; the key is left inert in both dictionaries, because a
               key removed from one and not the other is how a screen ends up
               half-English. */}
      </div>
      </div>

      ${regMode()==='board'?`
      <section class="blueprint bp-round reg-board-wrap" style="background:var(--color-surface);box-shadow:var(--shadow-sm);flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden">
        <div id="reg-scroll" style="flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;padding:var(--s-3)">
          ${(typeof pipeBoardHtml==='function')?pipeBoardHtml(cs,{legend:false}):''}
        </div>
        <div style="flex:none;border-top:1px solid var(--color-divider);display:flex;align-items:center;justify-content:space-between;gap:10px var(--s-4);flex-wrap:wrap;padding:5px var(--s-3);font-size:var(--t-label);color:var(--color-neutral-600)">
          <span id="reg-showing" role="status" aria-live="polite" aria-atomic="true">${regFooterText(cs,{all:true})}</span>
          ${''/* ---- NO VALUE STREAMS KEY ON THIS PAGE, BOARD OR TABLE (Young
                 ruled 24 Sep 2026: "delete this from both the contracts and
                 negotiations pages") ----
                 The board is the same page in a second shape, so its key above
                 the columns went with the table's. Every card names its stream
                 beside its colour bar, which is the fact the key explained.
                 My Queue — a separate page drawing the same board, and not
                 named — keeps its key: `legend:false` is asked only here. */}
        </div>
      </section>`:`
      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm);flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden">

        <div id="reg-scroll" style="flex:1;min-height:0;overflow:auto">
          <!-- The whole density mode rides on ONE element as three custom
               properties, so nothing below has to know which mode is on. -->
          <table class="reg-table" data-reg-density="${regDensity()}" style="${regDensityVars(regDensity())}">
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
                ${(neg?REG_COL_KEYS_NEGO:REG_COL_KEYS).map(k=>{
                  if(k==='mk') return sortableTh('ref','MK');
                  if(k==='counterparty') return sortableTh('party',i18t('reg_col_counterparty'));
                  /* The head names the LEADING line, and the press sorts by
                         it: the counterparty is what a reader scans down this
                         column. Sorting by title is still offered — in the
                         sort dropdown, which has carried a sort with no column
                         of its own (`risk`) since it was built. */
                  if(k==='kind') return sortableTh('kind',i18t('reg_col_type_round'));
                  if(k==='value') return sortableTh('value',i18t('reg_col_value'),'text-align:right');
                  if(k==='signed') return sortableTh('signed',i18t('reg_col_signed'));
                  if(k==='expiry') return sortableTh('expiry',i18t('reg_col_expiry'));
                  if(k==='stage') return sortableTh('stage',i18t('reg_col_status'));
                  if(k==='move') return neg ? (()=>{ const i=_colN; return `<th style="text-align:right;${colAt()}">${i18t('ngl_col_move')}${gripFor(i)}</th>`; })()
                    : sortableTh('move',i18t('reg_col_move'));
                  if(k==='owner') return sortableTh('owner',i18t('reg_col_owner'));
                  return (()=>{ const i=_colN; return `<th style="text-align:right;${colAt()}">${gripFor(i)}</th>`; })();
                }).join('')}
              </tr>
            </thead>
            <tbody id="reg-tbody">${regRowsHtml(cs)}</tbody>
          </table>
        </div>
        <div style="flex:none;border-top:1px solid var(--color-divider);display:flex;align-items:center;justify-content:space-between;gap:10px var(--s-4);flex-wrap:wrap;padding:5px var(--s-3);font-size:var(--t-label);color:var(--color-neutral-600)">
          <span id="reg-showing" role="status" aria-live="polite" aria-atomic="true">${regFooterText(cs)}</span>
          <div id="reg-pager" style="display:flex;align-items:center;gap:6px">${regPager(cs)}</div>
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
        </div>
      </section>`}
    </div>
  </div>`;

  wireRegRows();
  wireRegPager();
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
    });
  }
  /* ---- "ADAPT FILTERS" ----
     It goes through openModal, which this product already gets right: role,
     aria-modal, a name, focus in, Tab cycling and focus back to the opener.
     A second hand-rolled panel would be a second implementation of all of
     that, and this file's own rule is one builder per job. */
  document.getElementById('reg-adapt')?.addEventListener('click',()=>{
    const chosen=regBarChosen();
    const rows=REG_BAR_FILTERS.map(f=>{
      const on=chosen.includes(f.k);
      /* A FIXED FILTER IS SHOWN TICKED AND DISABLED rather than hidden: a
         chooser that silently omits two of the six leaves the reader counting
         and wondering where they went. It says what it is instead. */
      return `<label style="display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid var(--color-divider);${f.fixed?'opacity:.6':'cursor:pointer'}">
        <input type="checkbox" data-adapt="${f.k}" ${on?'checked':''} ${f.fixed?'disabled':''} style="width:15px;height:15px;flex:none;accent-color:var(--accent-solid)"/>
        <span style="flex:1;font-size:var(--t-body)">${esc(f.label)}</span>
        ${f.fixed?`<span style="font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)">${esc(i18t('reg_adapt_always'))}</span>`:''}
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
  document.querySelectorAll('button[data-reg-density]').forEach(b=>b.addEventListener('click',()=>{
    if(regSetDensity(b.getAttribute('data-reg-density'))) regRepaint();
  }));
  /* A SHAPE CHANGE IS A REPAINT, NOT A NAVIGATION, like the density: filters
     and place untouched. In board mode the queue's own wiring arms the cards
     (a press opens the workspace) and the per-column "N more" doors. */
  document.querySelectorAll('button[data-reg-mode]').forEach(b=>b.addEventListener('click',()=>{
    regSetMode(b.getAttribute('data-reg-mode')); regRepaint();
  }));
  if(regMode()==='board'&&typeof wirePipeline==='function') wirePipeline();
  document.getElementById('reg-sort')?.addEventListener('change',e=>{ R.sort=e.target.value; R.dir=REG_SORT_DEFDIR[R.sort]||-1; R.page=1; regRepaint(); });
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
  document.querySelectorAll('button[data-reg-view]').forEach(b=>b.addEventListener('click',()=>{ R.view=b.getAttribute('data-reg-view')||null; R.page=1; regRepaint(); }));
  document.querySelectorAll('button[data-reg-saved]').forEach(b=>b.addEventListener('click',()=>{ if(regApplySaved(b.getAttribute('data-reg-saved'))) regRepaint(); }));
  document.querySelectorAll('button[data-reg-saved-x]').forEach(b=>b.addEventListener('click',async e=>{ e.stopPropagation();
    const name=b.getAttribute('data-reg-saved-x');
    const ok=window.confirmDialog?await confirmDialog({title:i18t('reg_forget_view_title'),message:i18t('reg_forget_view',{name}),confirmLabel:i18t('reg_forget_view_go')}):confirm(i18t('reg_forget_view',{name}));
    if(!ok) return; regForgetView(name); regRepaint(); }));
  document.getElementById('reg-save-view')?.addEventListener('click',async()=>{
    const name=window.promptDialog?await promptDialog({title:i18t('reg_save_view_ask'),message:i18t('reg_save_view_msg'),placeholder:i18t('reg_save_view_ph'),confirmLabel:i18t('reg_save_view')}):prompt(i18t('reg_save_view_ask'));
    if(name==null||!String(name).trim()) return;
    if(regSaveView(name)){ if(window.toast) toast(i18t('reg_view_saved',{name:String(name).trim()}),'ok'); regRepaint(); }
    else if(window.toast) toast(i18t('reg_view_not_saved'),'warn');
  });
  regPaintHeadFacts();
  document.getElementById('reg-only-clear')?.addEventListener('click',()=>{ R.only=null; R.page=1; regRepaint(); });
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

  regWireColResize();
  regFitBandOffset();
  regPaintCohort();
  setActiveNav(_regOpts.nav);
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
  let html='';
  try{ html = (typeof cohortButtonHtml==='function') ? cohortButtonHtml() : ''; }catch(_){ html=''; }
  slot.innerHTML = html;
}

/* ---- WHERE A BAND PINS IS THE HEADER'S HEIGHT, ASKED OF THE HEADER ----
   The Negotiations list draws full-width bands between its rows and both they
   and the column header are position:sticky inside #reg-scroll. The band's
   offset was typed as 38px against a header that renders 35, so a 3px slot sat
   between them and every row scrolled visibly through it — reported as the list
   breaking on scroll (owner, 22 Aug 2026). The number is read off the header
   now and written as --reg-head-h for the rule in index.html.
   TWO PROPERTIES, each of which this codebase has learned once already:
   A HEIGHT OF ZERO IS NOT A HEIGHT — the pane can be display:none when a
   sitting starts, and writing 0 there would pin every band to the top of the
   scroller — so a zero is refused and today's value stands.
   AND IT IS OBSERVED, NOT MEASURED ONCE: the header's height follows the
   reader's type and the window's width, so a ResizeObserver re-reads it. Bound
   once per element (dataset.regHeadObserved), because this function is called
   from the full render AND from every body repaint. */
function regFitBandOffset(){
  const sc=document.getElementById('reg-scroll'); if(!sc) return;
  const hd=sc.querySelector('.reg-table thead tr'); if(!hd) return;
  const apply=()=>{
    const h=Math.round(hd.getBoundingClientRect().height);
    if(h>0) sc.style.setProperty('--reg-head-h',h+'px');
  };
  apply();
  if(!hd.dataset.regHeadObserved && typeof ResizeObserver==='function'){
    hd.dataset.regHeadObserved='1';
    try{ new ResizeObserver(apply).observe(hd); }catch(e){}
  }
}

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
        <div style="font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(h.name||h.id)} <span style="font-family:var(--font-mono);font-size:var(--t-label);color:var(--color-neutral-500)">${h.id}</span></div>
        ${h.snippet?`<div style="font-size:var(--t-label);color:var(--color-neutral-600);margin-top:2px">${h.snippet.replace(/</g,'&lt;').replace(/\[/g,'<mark style="background:var(--st-amber-bg);border-radius:var(--radius);padding:0 2px">').replace(/\]/g,'</mark>')}</div>`:(h.counterparty?`<div style="font-size:var(--t-label);color:var(--color-neutral-500)">${h.counterparty}</div>`:'')}
      </button>`).join('');
      box.classList.remove('hidden');
      box.querySelectorAll('[data-fts-open]').forEach(b=>b.addEventListener('click',()=>{ box.classList.add('hidden'); openWorkspace(b.getAttribute('data-fts-open')); }));
    }catch(e){ box.classList.add('hidden'); }
  },220);
}
Object.assign(window,{regSignedOn,regSignedYear,regSignedYears,regSignedCell,
  REG_COL_KEYS,REG_COL_KEYS_NEGO,REG_COL_W,REG_COL_W_NEGO,REG_COL_MIN_PX,
  regColWidths,regColSetWidths,regColReset,regColDefaults,regColTrade,regColApply,regWireColResize,
  REG_CMP,REG_SORT_DEFDIR,regBlanksLast,regStreamName,regRefParts,regNarrowed,regClearHtml,regPaintClear,
  REG_BAR_FILTERS,REG_BAR_DEFAULT,regBarChosen,regBarSetChosen,regBarShown,regFilterActive,regViewCount,REG_SAVED_KEY,REG_SAVED_FIELDS,regSavedViews,regSaveView,regForgetView,regApplySaved,regSavedMatches,regHeadFactsHtml,regPaintHeadFacts,regMoveWord,regOwnerCell,REG_DENSITY,regDensity,regSetDensity,regDensityVars,regMode,regSetMode,regViewTabsHtml,regSegHtml,regDotDate,REG_PAGE,REG_SORTS,REG_STAGES,regTypes,REG_VIEWS,REG_ROW_ACTIONS,regEndAct,ftsSearch,regAggregate,regCloseMenus,regExportCsv,regFiltered,regCategories,regCatMatch,regCatLabel,regOwnerInitials,regPrimaryAction,regTitleOf,regRowsHtml,regState,negoMoveSay,regShowOnly,regPaintCohort,renderRegister,renderRegisterBody,wireRegRows,
  regScope,regSetScope,regRepaint,regPageSize,regFitBandOffset,NEGO_BANDS,NEGO_BAND_DOT,negoGroupByMove,negoBandCounts,negoMovePillHtml,negoBandRowHtml});
