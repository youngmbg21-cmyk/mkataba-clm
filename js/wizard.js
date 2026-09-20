// HaTi — E6 template variables + guided creation wizard. Globals window-attached.

/* ---- template variables (E6-T3) ----
   Each template exposes a small set of named variables with Kenyan-sensible
   defaults. `field` maps to a docBody field id (c.fields[id]); the special
   keys counterparty/value/effDate/expiry write to the contract directly. */
const TEMPLATE_PRIMARY = {
  RM:{field:'material', label:'Material supplied', ph:'e.g. refined sugar', def:''},
  PK:{field:'packType', label:'Packaging type', ph:'e.g. PET bottles & preforms', def:''},
  CM:{field:'product', label:'Product manufactured', ph:'e.g. powdered beverages', def:''},
  EQ:{field:'equipment', label:'Equipment', ph:'e.g. filling line', def:''},
  WH:{field:'site', label:'Warehouse / site', get ph(){ return (typeof jxEg==='function'&&jxEg('warehouse'))||'e.g. Nairobi DC'; }, def:''},
  FF:{field:'region', label:'Distribution region', ph:'e.g. a named region or county', def:''},
  DA:{field:'territory', label:'Distributor territory', ph:'e.g. Coast region', def:''},
  RL:{field:'channel', label:'Retail channel', ph:'e.g. modern trade', def:''},
  MK:{field:'services', label:'Services', ph:'e.g. media & activation', def:''},
  ND:{field:null, label:null},
  LE:{field:'premises', label:'Premises', ph:'e.g. Industrial Area depot', def:''},
  PS:{field:'services', label:'Services', ph:'e.g. audit & advisory', def:''},
};
/* The wizard now reads the SAME field schema custom templates use
   (templateFields → js/templatefields.js), so one shape drives the wizard, the
   preview and bulk creation. Kept as templateVars() because callers use it. */
function templateVars(tid){
  const t=TEMPLATES[tid]; if(!t) return [];
  return templateFields(t).map(f=>({ ...f,
    def: f.key==='effDate' && !f.def ? new Date().toISOString().slice(0,10) : (f.def||'') }));
}

/* ---- role gating (E6-T4): which templates each role may self-serve ---- */
function templateRoles(){ return (state.settings&&state.settings.templateRoles)||{}; }
function templateAllowedForRole(tid, role){
  if(role==='viewer') return false;               // viewers never create
  if(role==='admin') return true;
  const cfg=templateRoles()[tid];
  if(!cfg) return true;                            // default: open to legal too
  return cfg.includes(role);
}
function myCreatableTemplates(){
  const role=currentUser()?.role||'viewer';
  return Object.values(TEMPLATES).filter(t=>templateAllowedForRole(t.id, role));
}

/* ---- WO N6: the curated doorway ----
   The picker used to open on the full flat grid — twelve cards tuned to the
   original FMCG demo, nothing recommended, at the exact moment of highest
   intent. Now a "For you" row of at most four leads, chosen in this order:
   what this workspace has actually drafted from (heaviest first, demo seeds
   excluded), then its named line of business, then four universal starters
   any SME signs — an NDA, a services agreement, a lease, a marketing
   engagement. Everything else waits behind a search box and an
   "All templates" fold. The wizard itself is untouched — the doorway was
   the problem, not the room. */
const TEMPLATE_STARTERS=['ND','PS','LE','MK'];
const INDUSTRY_TEMPLATES={
  services:     ['PS','ND','MK','LE'],
  manufacturing:['RM','PK','CM','EQ'],
  distribution: ['WH','FF','DA','ND'],
  retail:       ['RL','DA','LE','ND'],
};
const INDUSTRY_LABEL={ services:'Services & professional', manufacturing:'Manufacturing & production',
  distribution:'Distribution & logistics', retail:'Retail & consumer trade' };
/* Validated on read: a stored value the table no longer knows is no industry
   at all, not a crash in the picker. */
function workspaceIndustry(){ const v=state.settings&&state.settings.industry; return INDUSTRY_TEMPLATES[v]?v:null; }
/* ---- ONE READING, TWO CALLERS ----
   The Templates overview needs the CONTRACTS drafted from a built-in (to ask
   how many were checked against the playbook, and how many are recent), and
   this counted them without ever handing them over. A second filter written
   beside it is how two screens come to disagree about which contracts came
   from one template — so the ROWS are the reading and the count is its
   length. The seeded portfolio is excluded exactly as before. */
function builtinUsageRows(tid){ return (state.contracts||[]).filter(c=>c.template===tid && !c.seeded); }
function builtinUsageCount(tid){ return builtinUsageRows(tid).length; }
/* ---- THE LINE OF BUSINESS KEEPS SEATS (Young reported it 20 Sep 2026:
   *"What is the purpose of the line of business filter and does it work? It
   does not seem to be doing anything"*) ----

   IT WORKED ON A NEW WORKSPACE AND COULD NOT WORK ON A USED ONE. The order
   was usage, then the line of business, then the starters, capped at four —
   so the moment a workspace had drafted from four built-ins, usage filled
   every seat and the line of business was never reached. MEASURED on the
   owner's own case (five templates used): all four cards identical under all
   four lines of business, while the heading above them named one.

   THE CONTROL SAYS "tunes this list", SO IT TUNES THE LIST. Usage still
   leads — what you actually draft is the better signal — but it may take at
   most `FOR_YOU_MAX - FOR_YOU_LOB_MIN` seats while a line of business is
   named, and it takes back whatever the line of business leaves. Where NO
   line of business is set the old order is byte-identical: usage takes all
   four, exactly as before. */
const FOR_YOU_MAX = 4;
const FOR_YOU_LOB_MIN = 2;

/* ONE READING, so the row and the heading above it cannot disagree about
   which cards these are or why. `forYouTemplates` is the list alone, kept
   under its old name so no caller changed. */
function forYouPick(tmpls){
  const list=tmpls||[];
  const byId={}; list.forEach(t=>{ byId[t.id]=t; });
  const picked=[];
  const take=id=>{ if(byId[id] && !picked.includes(id) && picked.length<FOR_YOU_MAX) picked.push(id); };
  const used=list.map(t=>({ id:t.id, n:builtinUsageCount(t.id) })).filter(x=>x.n>0)
    .sort((a,b)=>b.n-a.n).map(x=>x.id);
  const lob=workspaceIndustry();
  const lobIds=INDUSTRY_TEMPLATES[lob]||[];
  used.slice(0, lobIds.length ? Math.max(0, FOR_YOU_MAX-FOR_YOU_LOB_MIN) : FOR_YOU_MAX).forEach(take);
  lobIds.forEach(take);
  /* Whatever the line of business left — a list of four that only had one
     card this role may create must not cost the row a seat. */
  used.forEach(take);
  TEMPLATE_STARTERS.forEach(take);
  /* TRUE BY MEASUREMENT, NEVER BY PROVENANCE: a card usage picked that this
     line of business also wants IS one of its own, and the heading may say
     so. It says nothing where not one of the four is on that list. */
  return { list:picked.map(id=>byId[id]), lob, lobIds,
    lobShown: !!lob && picked.some(id=>lobIds.includes(id)) };
}
function forYouTemplates(tmpls){ return forYouPick(tmpls).list; }

/* ---- guided creation wizard ---- */
/* `prefill` is an optional {fieldKey: value} map — what "draft from a
   sentence" read out of the reader's own words (js/draft.js). It moves each
   value onto that field's DEFAULT, so the answer step draws exactly the boxes
   it always drew with some of them already filled in, and createFromWizard
   reads them back off the form like any other answer: same validation, same
   creation, same audit line. A key this template does not ask for is dropped
   by draftApplyPrefill rather than carried. */
function openWizard(preTid, prefill){
  if(!canEdit()){ toast(i18t('wz_viewers_no_create'),'err'); return; }
  const tmpls=myCreatableTemplates();
  if(!tmpls.length){ toast(i18t('wz_no_templates_role'),'err'); return; }
  let tid=preTid&&tmpls.some(t=>t.id===preTid)?preTid:null;
  /* Which stream folder is open, per sitting and in memory: a browse position
     is not a setting, and landing somebody back inside a folder a week later is
     not what they asked for. */
  let wzStream=null;
  const renderStep=()=>{
    if(!tid){
      const card=t=>`<button data-wz-tid="${t.id}" style="text-align:left;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:var(--s-3);cursor:pointer;transition:border-color var(--dur-1),box-shadow var(--dur-1);" onmouseover="this.style.borderColor='var(--color-accent)';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.borderColor='var(--color-divider)';this.style.boxShadow='none'">
            <span style="display:flex;align-items:center;gap:var(--s-2);"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:var(--radius);background:var(--st-steel-bg);color:var(--color-accent);flex:none;">${icon(t.ic||'file','w-3.5 h-3.5')}</span>
            <span style="font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text);font-family:var(--font-mono);">${t.kind}</span></span>
            <span style="display:block;margin-top:5px;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.4;">${t.blurb||''}</span></button>`;
      const GRID='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--s-2);';
      const EYE='display:block;font-family:var(--font-mono);font-size:var(--t-micro);letter-spacing:.09em;color:var(--color-neutral-500);text-transform:uppercase;margin:0 0 6px;';
      const fy=forYouPick(tmpls);
      const forYou=fy.list;
      const curated=forYou.length>0;
      /* Company standard templates stay pinned on top — the whole point of
         publishing one is that it becomes the team's one-click default. */
      const lib=(typeof tplLibPublished==='function'&&canEdit())?tplLibPublished():[];
      /* ---- AND THE WORKSPACE'S OWN SAVED TEMPLATES, WHICH WERE NOT HERE ----
         "Save as template" on a contract writes to customTemplates(), and the
         only two doors to those were the Templates page and a row in the
         new-contract menu. That menu's template list is gone (Young, 09 Aug
         2026: they already sit under the draft-from-template option) — which is
         true of the company standards and the built-in papers, and was not true
         of these. Now it is. */
      const mine=(typeof customTemplates==='function'&&canEdit())?customTemplates():[];
      const industry=workspaceIndustry();
      const admin=(typeof isAdmin==='function')&&isAdmin();
      /* ============================================================
         THE STREAMS COME FIRST (15 Aug 2026, OI-11)
         ============================================================
         This opened on one flat grid of every template, each card wearing the
         identical sub-line "v1 · pre-filled & branded". Reported with three
         templates called "Momo Beach" on it and nothing to tell them apart, and
         nothing to browse BY — only a search box, which needs you to know the
         name already.

         Owner-ruled: the value streams appear first, and anything with no stream
         assigned goes to a folder called OTHER.

         "OTHER" IS A FOLDER IN THIS PICKER AND NOT A SEVENTH VALUE STREAM. It
         is never added to FOLDERS and a contract can never be filed into it: it
         is the ABSENCE of an answer, and a stream you can file into is an
         answer. It draws only while something is in it.

         AND THE SECOND HALF SHIPS WITH IT. A browse step alone would have opened
         on six empty folders and one full one, because no company-standard
         template carried a stream — so the Templates page gained a stream field
         on the same day. See tplStreamOpts in js/views/templatelib.js. */
      const WZ_OTHER='__wz_other__';
      const rows=[
        ...lib.map(t=>({ pick:'lib', id:t.id, name:t.name, folder:t.folder||null,
          sub:`v${t.publishedVersion} · ${i18t('wz_prefilled_branded')}`, ic:'copy', std:true })),
        ...mine.map(t=>({ pick:'mine', id:t.id, name:t.name, folder:t.folder||null,
          sub:i18t('wz_saved_here'), ic:'copy' })),
        ...tmpls.map(t=>({ pick:'tid', id:t.id, name:t.kind, folder:t.folder||null,
          sub:t.blurb||'', ic:t.ic||'file' })),
      ];
      const esc2=x=>String(x==null?'':x).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
      const rowCard=r=>`<button data-wz-${r.pick}="${esc2(r.id)}" style="text-align:left;border:${r.std?'1.5px solid var(--color-accent)':'1px solid var(--color-divider)'};background:${r.std?'var(--color-accent-100)':'var(--color-surface)'};border-radius:var(--radius);padding:var(--s-3);cursor:pointer;">
        <span style="display:flex;align-items:center;gap:var(--s-2);"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:var(--radius);background:${r.std?'var(--color-accent)':'var(--color-accent-100)'};color:${r.std?'#fff':'var(--color-accent)'};flex:none;">${icon(r.ic,'w-3.5 h-3.5')}</span>
        <span style="font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text);">${esc2(r.name)}</span></span>
        <span style="display:block;margin-top:5px;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.4;">${esc2(r.sub)}</span></button>`;
      /* Grouped once, and the ORDER is visibleFolders' — the same order every
         other stream list in the product uses, so this screen cannot present
         the streams differently from the register or the settings panel. */
      const byStream=new Map();
      for(const r of rows){
        const k=r.folder&&typeof FOLDERS==='object'&&FOLDERS[r.folder]?r.folder:WZ_OTHER;
        if(!byStream.has(k)) byStream.set(k,[]);
        byStream.get(k).push(r);
      }
      const fList=(typeof visibleFolders==='function')?visibleFolders():Object.values(FOLDERS||{});
      const order=[...fList.map(f=>f.id).filter(id=>byStream.has(id)),
        ...(byStream.has(WZ_OTHER)?[WZ_OTHER]:[])];
      const fName=k=>k===WZ_OTHER?i18t('wz_stream_unfiled'):((FOLDERS[k]||{}).name||k);
      const fDesc=k=>k===WZ_OTHER?i18t('wz_stream_unfiled_sub'):((FOLDERS[k]||{}).desc||'');
      const fColor=k=>k===WZ_OTHER?'var(--color-neutral-400)':((FOLDERS[k]||{}).color||'var(--color-accent)');
      const fIcon=k=>k===WZ_OTHER?'folder':((FOLDERS[k]||{}).ic||'folder');
      const streamCard=k=>{
        const n=(byStream.get(k)||[]).length;
        return `<button data-wz-stream="${esc2(k)}" style="text-align:left;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:var(--s-3);cursor:pointer;border-left:3px solid ${fColor(k)};">
          <span style="display:flex;align-items:center;gap:var(--s-2);"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:var(--radius);background:color-mix(in srgb,${fColor(k)} 15%,transparent);color:${fColor(k)};flex:none;">${icon(fIcon(k),'w-3.5 h-3.5')}</span>
          <span style="font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text);flex:1;min-width:0;">${esc2(fName(k))}</span>
          <span style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-neutral-500);flex:none;">${n}</span></span>
          <span style="display:block;margin-top:5px;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.4;">${esc2(fDesc(k))}</span></button>`;
      };
      /* ---- YOUR OWN PAPER IS ON THE FRONT SCREEN (Young ruled it 20 Sep
         2026, reviewing this pop-up) ----
         The note above `lib` says company standards "stay pinned on top —
         the whole point of publishing one is that it becomes the team's
         one-click default". MEASURED, they were not drawn on this screen at
         all: `lib` and `mine` reached only `rows`, which feeds the stream
         folders and the search box, so the only paper a reader could SEE was
         the four HaTi built-ins under FOR YOU. To reach your own company
         standard you had to know which value stream it was filed in, or know
         its name well enough to type it — on the screen whose whole job is to
         show you what you have.
         ONE SECTION, NOT TWO. Standards first, then saved templates, in one
         group under one eyebrow: this screen already carries FOR YOU, a line
         of business, a search box and six folders, and the ask was to make it
         LESS confusing. Drawn only when there is something in it. */
      const ours=[...rows.filter(r=>r.pick==='lib'), ...rows.filter(r=>r.pick==='mine')];
      const inStream=wzStream&&byStream.has(wzStream)?byStream.get(wzStream):null;
      openModal(`<div style="padding:22px var(--s-6);">
        ${inStream?`<button id="wz-streams-back" style="font-size:var(--t-label);color:var(--accent-ink-700);font-weight:var(--w-strong);font-family:var(--font-mono);background:none;border:0;cursor:pointer;margin-bottom:var(--s-2);padding:0;">← ${i18t('wz_all_streams')}</button>`:''}
        <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;color:var(--color-text);margin:0 0 3px;">${inStream?esc2(fName(wzStream)):i18t('wz_new_from_template')}</h3>
        <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 14px;line-height:1.5;">${inStream?i18tn('wz_n_in_stream',inStream.length,{n:inStream.length}):i18t('wz_pick_stream')}</p>
        <div id="wz-pick" class="scroll-thin" style="max-height:62vh;overflow-y:auto;">
          ${inStream?`<div style="${GRID}">${inStream.map(rowCard).join('')}</div>`:`
          ${ours.length?`<div style="margin-bottom:14px">
            <span style="${EYE}">${i18t('wz_your_own_paper')}</span>
            <div style="${GRID}">${ours.map(rowCard).join('')}</div>
          </div>`:''}
          ${curated?`<div style="margin-bottom:14px">
            ${''/* The heading names the line of business only where one of these
                   four really is on its list — it read `industry` before, so
                   it went on claiming a reason that had chosen nothing. */}
            <span style="${EYE}">${i18t('wz_for_you')}${fy.lobShown?` · ${INDUSTRY_LABEL[fy.lob]}`:''}</span>
            <div style="${GRID}">${forYou.map(card).join('')}</div>
          </div>`:''}
          ${admin?`<label style="display:flex;align-items:center;gap:var(--s-2);margin:0 0 var(--s-3);font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('wz_line_of_business')}
            <select id="wz-industry" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:var(--s-1) var(--s-2);font:inherit;font-size:var(--t-meta);color:inherit">
              <option value="">${i18t('wz_not_set')}</option>
              ${Object.keys(INDUSTRY_TEMPLATES).map(k=>`<option value="${k}" ${industry===k?'selected':''}>${INDUSTRY_LABEL[k]}</option>`).join('')}
            </select></label>`:''}
          ${''/* SEARCH STAYS ON THE FRONT SCREEN and looks across every stream:
                 browsing is for when you do not know the name, and searching is
                 for when you do. Making the search obey the open folder would
                 make the faster of the two routes the narrower one. */}
          <input id="wz-search" type="search" placeholder="${i18t('wz_search_all')}" autocomplete="off"
            style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);padding:var(--s-2) var(--s-3);font:inherit;font-size:var(--t-body);color:inherit;outline:none;margin-bottom:10px"/>
          <div id="wz-hits" style="${GRID};margin-bottom:10px"></div>
          <span style="${EYE}">${i18t('wz_streams_head')}</span>
          <div style="${GRID}">${order.map(streamCard).join('')}</div>`}
        </div>
        ${''/* ---- AND A VISIBLE WAY OUT (Young, same review) ----
               MEASURED: this dialog drew no Cancel and no ✕. Escape and the
               scrim closed it, both of which a reader has to already know.
               Every other dialog on the way to a contract — the essentials,
               both fill screens, draft from a sentence — offers Cancel in
               this exact place, so this is the shape they all share rather
               than a new control. */}
        <div style="display:flex;align-items:center;gap:var(--s-2);margin-top:var(--s-4)">
          <button id="wz-pick-cancel" class="ui-btn">${i18t('act_cancel')}</button>
          <span style="flex:1"></span>
        </div></div>`);
      document.getElementById('wz-pick-cancel')?.addEventListener('click', closeModal);
      /* One delegated listener: the search box re-renders cards into #wz-hits,
         and per-card wiring would quietly miss whichever render came second. */
      const pick=document.getElementById('wz-pick');
      document.getElementById('wz-streams-back')?.addEventListener('click',()=>{ wzStream=null; renderStep(); });
      pick.addEventListener('click',e=>{
        const st=e.target.closest('[data-wz-stream]');
        if(st){ wzStream=st.getAttribute('data-wz-stream'); renderStep(); return; }
        /* THE PREFILL REACHES ALL THREE DOORS. `openWizard(preTid, prefill)`
           carries what was read out of a reader's own sentence, and these two
           branches dropped it on the floor: pick a company standard or a
           saved template from this screen and every answer Copilot had
           already read was silently lost. Both doors have always taken it —
           draft.js hands it to them directly — so this is the picker
           catching up with them. */
        const lb=e.target.closest('[data-wz-lib]');
        if(lb){ closeModal(); if(window.tplLibNewContract) tplLibNewContract(lb.getAttribute('data-wz-lib'), prefill); return; }
        const mn=e.target.closest('[data-wz-mine]');
        if(mn){ closeModal(); if(window.createFromCustomTemplate) createFromCustomTemplate(mn.getAttribute('data-wz-mine'), prefill); return; }
        const b=e.target.closest('[data-wz-tid]');
        if(b){ tid=b.getAttribute('data-wz-tid'); renderStep(); }
      });
      /* GUARDED, because there are two screens now. Search belongs to the
         streams screen — inside a folder the list is already the answer — so
         these two elements are absent on the second one, and reaching for them
         unconditionally threw where the wiring should simply have nothing to
         do. */
      const search=document.getElementById('wz-search'), hits=document.getElementById('wz-hits');
      if(search&&hits) search.addEventListener('input',()=>{
        const q=search.value.trim().toLowerCase();
        /* Across every stream and all three kinds of template — see the note
           at the search box. `rows` is the normalised list the folders are
           built from, so a hit and a folder card cannot disagree. */
        const found=q?rows.filter(r=>`${r.name} ${r.sub}`.toLowerCase().includes(q)):[];
        hits.innerHTML=q?(found.length?found.map(rowCard).join('')
          :`<div style="grid-column:1/-1;font-size:var(--t-meta);color:var(--color-neutral-600);padding:6px 2px">${i18t('wz_nothing_matches_q',{q:q.replace(/</g,'&lt;')})}</div>`):'';

      });
      /* The one settings question, asked where its answer is used. Admin-only
         because PUT /api/settings is admin-only — a select that fails to save
         for everyone else would teach people to distrust the dialog. */
      document.getElementById('wz-industry')?.addEventListener('change',e=>{
        state.settings=state.settings||{};
        state.settings.industry=e.target.value||undefined;
        if(typeof saveSettings==='function') saveSettings();
        renderStep();
      });
      return;
    }
    const t=TEMPLATES[tid];
    const vars=(prefill && typeof draftApplyPrefill==='function')
      ? draftApplyPrefill(templateVars(tid), prefill) : templateVars(tid);
    /* THE ARROW SAYS WHERE THE ANSWER IS FILED, and says nothing when the two
       names are the same word. "Counterparty * → Counterparty" has always been
       noise; adding "Our party → Our party" beside it made a pattern of it.
       Compared case-insensitively, because the map labels are translated and
       the two languages capitalise differently. */
    const mapNote=v=>{ if(!v.maps) return '';
      const m=tplMapLabel(v.maps);
      if(!m || String(m).trim().toLowerCase()===String(v.label||'').trim().toLowerCase()) return '';
      return `<span style="font-weight:var(--w-body);color:var(--color-neutral-500);text-transform:none;letter-spacing:0"> → ${m}</span>`; };
    const input=v=>{ const id='wz-'+String(v.key).replace(/[:]/g,'_');
      const lbl=`<span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1);font-family:var(--font-mono);letter-spacing:.02em;">${v.label}${v.required?' <span style="color:var(--st-ruby-fg)">*</span>':''}${mapNote(v)}</span>`;
      /* ---- A VALUE STREAM IS DRAWN BY THE PRODUCT'S OWN LIST (18 Sep 2026)
         ---- folderOptionsHtml carries the "+ New value stream" sentinel and
         bindFolderSelect answers it, so this door offers what every other
         filing door offers and none of them can drift. Bound after the modal
         is in the page, below. */
      if(v.type==='stream') return `<label style="display:block;">${lbl}
        <select id="${id}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font-size:var(--t-body);color:var(--color-text);outline:none;">${
          (typeof folderOptionsHtml==='function') ? folderOptionsHtml(v.def||null, false) : ''}</select></label>`;
      if(v.type==='select') return `<label style="display:block;">${lbl}
        <select id="${id}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font-size:var(--t-body);color:var(--color-text);outline:none;">
          ${(v.opts||[]).map(o=>(typeof fieldOpt==='function')?fieldOpt(o):{v:String(o),l:String(o)}).map(o=>
            `<option value="${String(o.v).replace(/"/g,'&quot;')}" ${String(v.def||'')===o.v?'selected':''}>${o.l}</option>`).join('')}</select></label>`;
      const it=v.type==='date'?'date':(v.type==='num'?'number':'text');
      return `<label style="display:block;">${lbl}
        <input id="${id}" type="${it}" value="${String(v.def||'').replace(/"/g,'&quot;')}" placeholder="${v.ph||''}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font-size:var(--t-body);font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>`; };
    /* ---- THE PAPER BESIDE THE QUESTIONS (upgrade 2, 18 Sep 2026) ----
       The wizard's answer step and the saved-template fill screen stay two
       screens; this is ONE layout used by both, and one preview builder, so
       neither can draw a different contract from the same answers. */
    const _pv = (typeof fillPreviewFits==='function') && fillPreviewFits();
    openModal(`<div style="padding:22px var(--s-6);">
      <button id="wz-back" style="font-size:var(--t-label);color:var(--accent-ink-700);font-weight:var(--w-strong);font-family:var(--font-mono);background:none;border:0;cursor:pointer;margin-bottom:var(--s-2);padding:0;">← templates</button>
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;color:var(--color-text);margin:0 0 3px;">${t.kind}</h3>
      <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-4);line-height:1.5;">${t.blurb||''}</p>
      <div id="wz-cols" style="display:grid;grid-template-columns:${_pv?'minmax(0,1fr) minmax(0,1fr)':'minmax(0,1fr)'};gap:var(--s-4);align-items:start">
      <div class="field-grid" style="${(typeof FIELD_GRID_CSS==='string'?FIELD_GRID_CSS:'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s-3)')};">${vars.map(input).join('')}
        ${''/* ASKED HERE, WHERE YOU ARE ALREADY NAMING THEM, AND NOWHERE ELSE.
               The templates carry the counterparty's NAME; nothing carried the
               address, so it was collected later — by a strip in the
               negotiation room, and again by the share dialog when you pressed
               Send. Three times for one fact, in one sitting. Once it is on the
               contract the strip never appears and the send goes straight out. */}
        <label style="display:block;">
          <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1);font-family:var(--font-mono);letter-spacing:.02em;">${i18t('wz_their_email')}</span>
          <input id="wz-cpemail" type="email" placeholder="${(typeof jxEg==='function'&&jxEg('theirEmail'))||'them@company.co.ke'}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font-size:var(--t-body);font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>
      </div>
      ${_pv?fillPreviewPaneHtml(vars.filter(v=>!String(v.def||'').trim()).length):''}
      </div>
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-top:20px;">
        <button id="wz-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <span style="flex:1"></span>
        <button id="wz-skip" class="ui-btn" title="${i18t('wz_create_and_fill')}">${i18t('wz_skip_for_now')}</button>
        <button id="wz-create" class="ui-btn ui-btn-primary">${i18t('tl_create_draft')}</button>
      </div></div>`, _pv?{maxWidth:'1040px'}:undefined);
    /* The answers as they stand, read the way createFromWizard reads them. */
    if(_pv && typeof fillPreviewWire==='function'){
      const readNow=()=>{ const values={};
        for(const f of vars){ const el=document.getElementById('wz-'+String(f.key).replace(/[:]/g,'_'));
          if(el) values[f.key]=String(el.value||'').trim(); }
        return { tid, vars, values }; };
      fillPreviewWire(document.getElementById('wz-cols'), 'builtin', readNow);
    }
    /* The stream selects, bound once the markup is in the page — the sentinel
       is a dead option until bindFolderSelect has seen the element. */
    if(typeof bindFolderSelect==='function')
      vars.filter(v=>v.type==='stream').forEach(v=>{
        const el=document.getElementById('wz-'+String(v.key).replace(/[:]/g,'_'));
        if(el) bindFolderSelect(el);
      });
    document.getElementById('wz-back').addEventListener('click',()=>{ tid=null; renderStep(); });
    document.getElementById('wz-cancel').addEventListener('click',closeModal);
    document.getElementById('wz-create').addEventListener('click',()=>createFromWizard(tid, vars));
    /* SKIP CREATES THE SAME DRAFT, UNFILLED. The blanks it leaves are already
       a designed state — an unfilled placeholder renders as the dotted "blank
       on a paper form" chip and can be clicked and filled in the document
       itself. Skipping is therefore not a half-made contract, it is the same
       contract with its blanks still blank. */
    document.getElementById('wz-skip').addEventListener('click',()=>createFromWizard(tid, vars, {skip:true}));
  };
  renderStep();
  /* ---- THE SAME RACE AS THE DRAFT DIALOG (Young, 20 Sep 2026) ----
     The company standards are fetched when the "+ Draft new agreement" menu
     opens and that fetch is not awaited, so this screen could draw its
     "Your own paper" section before they arrived. Re-draw the PICK step when
     they land — never the answer step, which a reader may already be typing
     in, which is what `!tid` asks. */
  if(typeof tplLibReady==='function' && typeof tplLibPublished==='function'){
    const before=tplLibPublished().length;
    tplLibReady().then(()=>{ if(!tid && tplLibPublished().length!==before) renderStep(); })
      .catch(()=>{});
  }
}
function createFromWizard(tid, vars, opts){
  const t=TEMPLATES[tid], u=currentUser();
  const skip=!!(opts&&opts.skip);
  // Skip answers every question with a blank, so validation has nothing to
  // object to and the draft is created with its placeholders intact.
  const val=k=>{ if(skip) return ''; const el=document.getElementById('wz-'+String(k).replace(/[:]/g,'_')); return el?el.value.trim():''; };
  // validate before creating anything — the same rules bulk creation uses
  const values={}; const errs=[];
  /* Skipping answers every question with a blank, so there is nothing to
     validate — required-field checks would otherwise refuse the very thing
     Skip is for and the button would silently do nothing. */
  for(const f of vars){
    const raw=val(f.key);
    if(skip){ values[f.key]=''; continue; }
    const e=validateField(f, raw); if(e) errs.push(e); else values[f.key]=raw;
  }
  // A contract whose term runs backwards is a typo, not an agreement: it lands
  // in the register already expired, distorts "expiring < 90 days" and the
  // Calendar, and schedules its renewal reminder in the past.
  const dEff=values.effDate||values.effectiveDate||values.start;
  const dExp=values.expiry||values.expiryDate||values.end;
  if(dEff && dExp && String(dExp) < String(dEff))
    errs.push(`The expiry date (${dExp}) is before the effective date (${dEff}) — check the term.`);
  // A counterparty name is a party to an agreement, not a paragraph. It also
  // becomes the contract name, which every list truncates.
  if((values.counterparty||'').length>120)
    errs.push('The counterparty name is longer than 120 characters — use the registered name.');
  /* Optional, and checked only if given: somebody drafting for their own file
     may not know the address yet, and refusing to create the contract over it
     would be worse than asking again later. */
  const cpEmail=val('cpemail');
  if(cpEmail && !/.+@.+\..+/.test(cpEmail))
    errs.push(`"${cpEmail}" is not an email address — leave it blank if you do not have it yet.`);
  /* U-10: show ALL the problems at once, not just the first. The full list is
     already collected here; toasting errs[0] alone forced a fix-resubmit-discover
     loop through fields the user could have corrected in one pass. */
  if(errs.length){ toast(errs.length===1?errs[0]:`${errs.length} things need fixing:\n• ${errs.join('\n• ')}`,'err'); return; }
  const cp=values.counterparty||'';
  /* THE NAME THEY TYPED IS THE COUNTERPARTY, not just a word in the title.
     This wrote `counterparty:''` and folded `cp` into the display name only,
     so a contract drafted for Kabras was titled "…— Kabras" while the field
     the register filters on, the reports total by, and the signing readiness
     check reads ("Complete: counterparty name") stayed empty. The operator
     then re-typed, in the workspace, a fact they had already given the wizard.
     Uploads have always recorded it (js/views/contract.js); the two
     template-born paths now agree with them. */
  const c={ id:nextId(), name:t.name+(cp?' — '+cp:' (Draft)'), counterparty:cp,
    value: 0, status:'Draft', template:tid, folder:t.folder,
    lastAction:todayStr(), hash:null, signedAt:null, signatory:u?.name||'Authorized signatory', compliance:{iprs:false,pki:false},
    comments:[{author:'System',role:'Automation',side:'internal',text:`Drafted via the guided wizard from Template ${tid} (${t.kind}). What you typed is filed as contract data — the register, filters and reports pick it up without re-keying.`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null, expiry:null, valueType:t.valueType,
    audit:[{at:nowISO(),user:u?.name||'System',action:'Created',detail:`Guided creation from Template ${tid} (${t.kind})`}],
    signatures:[],
    /* N3-T1: born from a template, so this contract NUMBERS LIVE — a deleted
       clause closes the run up automatically at the next round boundary
       (negoAdvanceRound → negoRenumberApply). Set only here and at the custom
       template path; absence means literal numbering, so every existing
       contract and every upload is excluded by construction. */
    numbering:'live' };
  // the blanks ARE the database: every value lands on the contract AND in
  // c.metadata, with no separate data-entry step
  if(cpEmail) c.counterpartyEmail=cpEmail;
  applyTemplateValues(c, vars, values);
  if(t.valueType==='none'){ c.value=0; c.valueType='none'; }
  c._loaded=true; c._light=false; c._v=0;
  if(window.contractOwnerStamp) contractOwnerStamp(c);
  state.contracts.unshift(c); state.activeId=c.id;
  /* A NEW DRAFT OPENS ON KEY TERMS, not on its document — see wsTabDefaults. */
  if(window.roomOpenOnTerms) roomOpenOnTerms(c.id);
  /* AND COPILOT READS IT (Young ruled 17 Sep 2026) — registered at every
     creation site beside roomOpenOnTerms, because there is no single funnel
     for creating a contract. See contractArrived. */
  if(window.contractArrived) contractArrived(c);
  persist(c); closeModal();
  toast(`Draft created — ${t.kind}`);
  setView('workspace'); renderSideFolders&&renderSideFolders();
}

Object.assign(window,{TEMPLATE_PRIMARY,TEMPLATE_STARTERS,INDUSTRY_TEMPLATES,INDUSTRY_LABEL,FOR_YOU_MAX,FOR_YOU_LOB_MIN,forYouPick,workspaceIndustry,builtinUsageCount,builtinUsageRows,forYouTemplates,templateVars,templateRoles,templateAllowedForRole,myCreatableTemplates,openWizard,createFromWizard});
