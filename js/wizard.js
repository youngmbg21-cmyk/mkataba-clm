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
  /* ---- NO TEMPLATE NAMED MEANS THE NEW AGREEMENT POP-UP (Young, 21 Sep
     2026: "you have not implemented pop ups like this") ----
     The picker this function used to draw — streams first, a search box, FOR
     YOU, your own paper — is the LEFT HALF of that pop-up now, and two
     pickers onto one act is the drift this codebase pays for most. The
     branch below is kept whole and DORMANT (the Templates overview's own
     precedent: a reading deleted outright is one somebody rebuilds worse),
     and openWizard(tid) — the Templates page's "Use this", the draft
     hand-off — still draws the answer step exactly as it did. */
  if(!tid && typeof openNewAgreement==='function') return openNewAgreement({ prefill });
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
    /* The boxes are drawn by wzFieldHtml, ONE renderer this step shares with
       the New agreement pop-up's right-hand card (21 Sep 2026). */
    const input=wzFieldHtml;
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
        ${wzEmailHtml()}
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
    /* THE WAY BACK IS THE POP-UP (21 Sep 2026), with this template still
       lit — the picker branch above is dormant, see openWizard's head. */
    document.getElementById('wz-back').addEventListener('click',()=>{ closeModal(); openNewAgreement({ pick:{ kind:'tid', id:tid }, prefill }); });
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


/* ---- ONE RENDERER FOR A TEMPLATE'S QUESTION BOX ----
   Lifted out of the answer step on 21 Sep 2026 so the New agreement pop-up's
   card and the answer step draw the same box from the same code. The arrow
   says where the answer is filed, and says nothing when the two names are the
   same word ("Counterparty * → Counterparty" has always been noise). */
function wzMapNote(v){
  if(!v.maps) return '';
  const m=(typeof tplMapLabel==='function')?tplMapLabel(v.maps):'';
  if(!m || String(m).trim().toLowerCase()===String(v.label||'').trim().toLowerCase()) return '';
  return `<span style="font-weight:var(--w-body);color:var(--color-neutral-500);text-transform:none;letter-spacing:0"> → ${m}</span>`;
}
const WZ_ST='width:100%;min-height:var(--field-h,36px);border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 11px;font-size:var(--t-body);font-family:var(--font-body);color:var(--color-text);outline:none;';
function wzFieldHtml(v){
  const id='wz-'+String(v.key).replace(/[:]/g,'_');
  const lbl=`<span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1);font-family:var(--font-heading);letter-spacing:.02em;">${v.label}${v.required?' <span style="color:var(--st-ruby-fg)">*</span>':''}${wzMapNote(v)}</span>`;
  /* A value stream is drawn by the product's own list (18 Sep 2026):
     folderOptionsHtml carries the "+ New value stream" sentinel and
     bindFolderSelect answers it — bound by the caller once the markup is in
     the page. */
  if(v.type==='stream') return `<label style="display:block;">${lbl}
    <select id="${id}" style="${WZ_ST}">${(typeof folderOptionsHtml==='function') ? folderOptionsHtml(v.def||null, false) : ''}</select></label>`;
  if(v.type==='select') return `<label style="display:block;">${lbl}
    <select id="${id}" style="${WZ_ST}">
      ${(v.opts||[]).map(o=>(typeof fieldOpt==='function')?fieldOpt(o):{v:String(o),l:String(o)}).map(o=>
        `<option value="${String(o.v).replace(/"/g,'&quot;')}" ${String(v.def||'')===o.v?'selected':''}>${o.l}</option>`).join('')}</select></label>`;
  const it=v.type==='date'?'date':(v.type==='num'?'number':'text');
  return `<label style="display:block;">${lbl}
    <input id="${id}" type="${it}" value="${String(v.def||'').replace(/"/g,'&quot;')}" placeholder="${v.ph||''}" style="${WZ_ST}"/></label>`;
}
/* ASKED HERE, WHERE YOU ARE ALREADY NAMING THEM, AND NOWHERE ELSE. The
   templates carry the counterparty's NAME; nothing carried the address, so it
   was collected later — by a strip in the negotiation room, and again by the
   share dialog when you pressed Send. Three times for one fact, in one
   sitting. Once it is on the contract the strip never appears and the send
   goes straight out. */
function wzEmailHtml(){
  return `<label style="display:block;">
    <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1);font-family:var(--font-heading);letter-spacing:.02em;">${i18t('wz_their_email')}</span>
    <input id="wz-cpemail" type="email" placeholder="${(typeof jxEg==='function'&&jxEg('theirEmail'))||'them@company.co.ke'}" style="${WZ_ST}"/></label>`;
}
/* THE ANSWER STEP, MOUNTED IN SOMEBODY ELSE'S FRAME. The New agreement
   pop-up hosts a built-in template's questions in its right-hand card; the
   boxes, the folder binding, the paper beside them and the two acts are the
   answer step's own — createFromWizard reads the same ids back, validates the
   same way and writes the same audit line. Returns the two acts the host's
   foot presses, and how many boxes were drawn (the card's sub-line). */
function wizardFormMount(o, tid, prefill){
  const t=TEMPLATES[tid]; if(!t || !o || !o.host) return null;
  const vars=(prefill && typeof draftApplyPrefill==='function')
    ? draftApplyPrefill(templateVars(tid), prefill) : templateVars(tid);
  o.host.innerHTML=`<div class="field-grid" style="${(typeof FIELD_GRID_CSS==='string'?FIELD_GRID_CSS:'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s-3)')};">${vars.map(wzFieldHtml).join('')}${wzEmailHtml()}</div>`;
  if(typeof bindFolderSelect==='function')
    vars.filter(v=>v.type==='stream').forEach(v=>{
      const el=document.getElementById('wz-'+String(v.key).replace(/[:]/g,'_'));
      if(el) bindFolderSelect(el);
    });
  if(o.paperHost && typeof fillPreviewPaneHtml==='function' && typeof fillPreviewWire==='function'){
    o.paperHost.innerHTML=fillPreviewPaneHtml(vars.filter(v=>!String(v.def||'').trim()).length);
    const readNow=()=>{ const values={};
      for(const f of vars){ const el=document.getElementById('wz-'+String(f.key).replace(/[:]/g,'_'));
        if(el) values[f.key]=String(el.value||'').trim(); }
      return { tid, vars, values }; };
    fillPreviewWire(o.root||o.host, 'builtin', readNow);
  }
  return { create:()=>createFromWizard(tid, vars), skip:()=>createFromWizard(tid, vars, {skip:true}), count:vars.length+1, vars };
}

/* ============================================================
   NEW AGREEMENT — ONE POP-UP, EVERY DOOR (Young, 21 Sep 2026: "you have not
   implemented pop ups like this", over the artifact's own New agreement
   pop-up; built to prototype/hati-redesign-reference.html, `kind==='draft'`)
   ============================================================
   What the + New agreement button opened before this was a four-row MENU —
   template, sentence, upload, import — and behind the first row a picker,
   and behind the picker a form: three screens to reach one Create button. The
   artifact draws ONE screen: the paper you already have on the left (your
   company standards as doors, HaTi's as chips), a sentence box above them for
   Copilot, and the chosen template's own questions in a card on the right,
   with Create in the foot.

   NOTHING A PERSON COULD PRESS DISAPPEARED — the redesign's one rule:
   · the four menu rows: template → the doors and chips; describe → the box;
     upload and import → the quiet pair at the foot of the left pane (Upload
     also sits beside New agreement on Contracts; Import is a rail door);
   · the picker's search → the sentence box FILTERS the lists by word as you
     type, over name, description and value stream (so "sales" still finds
     everything filed in Sales — the stream folders' browse, by another
     route); Find asks Copilot the same words;
   · the admin's line-of-business setting → the select on the HaTi row;
   · FOR YOU's order → the chips are ordered by forYouPick, its own reading.

   IT MINTS NOTHING OF ITS OWN. The right-hand card is the existing door's
   own form mounted in this frame: wizardFormMount for a built-in,
   tplLibNewContract for a company standard, createFromCustomTemplate for a
   saved template, each returning the acts its own dialog would have bound to
   its own buttons. Create and Skip here press exactly those, so validation,
   creation, the audit line and Copilot's arrival read are untouched (f270's
   rule). The draft-from-a-sentence hand-off lands here through
   naPickFromDraft instead of opening a second dialog.

   THE PAPER BESIDE THE QUESTIONS (18 Sep 2026) is kept, and since 22 Sep it
   is drawn on the screen the owner actually uses. THE LINE WAS 1600 because
   the artifact of 21 Sep was drawn at 1440 with no paper; that reasoning is
   kept here because it is what made the number safe, and it is what the
   owner reversed. MEASURED before a line moved: at 1440 the contract was not
   on this screen at all, and at 1600 it arrived at 389x293 while the picker
   dropped 518 -> 389px and ALL FOUR company-standard names were cut off.
   Proposal C, which the owner chose: the picker becomes a RAIL of rows, so
   the questions and the agreement both get room, and the paper arrives at
   1280 rather than 1600.

   FOUR NUMBERS, SAID OUT LOUD AND READ BY BOTH HOSTS (the frame here, the
   grid in index.html through --na-rail-w / --na-paper-w). 1180 fits a 1280
   window: openModal's backdrop spends var(--s-4) a side, so 1248 is what a
   frame may take there. */
const NA_PAPER_MIN_W = 1280;
const NA_RAIL_W = 260;           /* the picker's own column, rows not cards */
const NA_PAPER_W = 400;          /* the agreement's column, at 1280 and up */
const NA_FRAME_W = 1180;         /* rail + questions + paper */
const NA_FRAME_NARROW_W = 900;   /* rail + questions */
/* AND UNDER 1280 THE AGREEMENT IS STACKED, NOT DROPPED (Young ruled it
   22 Sep 2026 off four renders: "Build D for iPads but the right hand side
   should scroll separately"). MEASURED before the ruling: an iPad Pro 11" in
   landscape reports 1194 and an iPad Air 1180, so on every iPad but a 12.9"
   in landscape the pop-up fell to two columns and the agreement was not in
   the document at all.
   768 is where the phone shell takes over and this pop-up stops being drawn,
   so the floor covers every iPad, landscape and portrait. It is deliberately
   NOT fillPreviewFits()'s 1000: that floor is about a preview BESIDE the
   questions, and one stacked under them needs no width of its own. */
const NA_STACK_MIN_W = 768;
function naUsageCount(kind, id){
  try{
    if(kind==='tid') return builtinUsageCount(id);
    return (typeof templateUsage==='function') ? (templateUsage(id).count||0) : 0;
  }catch(_){ return 0; }
}
/* The word filter: every word of three letters or more, any one of which in
   the name, the description or the stream's name is a hit. A sentence meant
   for Copilot ("a two-year NDA with a Swedish packaging supplier") narrows the
   lists to the NDA and the packaging paper rather than to nothing. */
function naHit(r, q){
  const words=String(q||'').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>=3);
  if(!words.length) return true;
  const hay=`${r.name} ${r.sub} ${r.stream}`.toLowerCase();
  return words.some(w=>hay.includes(w));
}
/* ---- THE ASK GROWS WITH THE SENTENCE (Young, 22 Sep 2026: "the describe
   what you need should be able to wrap text") ----
   It has WRAPPED since 21 Sep — a textarea, never an input — and MEASURED in
   the new rail that was not enough: at 236px a plain sentence is five lines,
   the box stood at two, and the reader got a scrollbar inside a 54px box.
   That is the same fault as a line scrolling sideways wearing other clothes.
   The box takes its own content's height, bounded at NA_SAY_MAX_LINES so a
   pasted paragraph cannot push the shelf off the screen; past that it scrolls,
   which is honest. Asked of the element, never of the character count. */
const NA_SAY_MAX_LINES = 7;
function naSayFit(el){
  if(!el || !el.style) return;
  try{
    const cs=(typeof getComputedStyle==='function')?getComputedStyle(el):null;
    const line=(cs && parseFloat(cs.lineHeight)) || 19;
    const edge=cs?((parseFloat(cs.borderTopWidth)||0)+(parseFloat(cs.borderBottomWidth)||0)):2;
    const pad=cs?((parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0)):0;
    el.style.height='auto';
    el.style.height=Math.min(el.scrollHeight+edge, Math.round(line*NA_SAY_MAX_LINES+pad+edge))+'px';
  }catch(_){}
}
function naHasWords(q){ return String(q||'').toLowerCase().split(/[^\p{L}\p{N}]+/u).some(w=>w.length>=3); }
/* ---- WHAT A CARD SAYS UNDER ITS NAME (Young ruled 21 Sep 2026: "the
   highlighted cards have nonsensical words in them") ----
   MEASURED on the owner's own screen: every converted company standard read
   *"Converted from Sales_Distribution_Agreement.docx (original stored:
   f_d5bf1d72535657e62e6f)"*. That is PROVENANCE — a filename and a storage id
   — written into the `description` column, which is the one field every card,
   picker and list prints as the thing's description. Four cards of file hashes.

   TWO HALVES, and the route's is the real fix: POST /api/templates/upload
   stops writing provenance into a description field (it is `origin`,
   `source_type` and templateProvenanceHtml's job, and always was), and this
   reading refuses the shape for every row already on file. NOTHING IS LOST —
   the provenance rides the card's own hover, where machinery belongs.

   THE FALLBACK IS A FACT, NEVER A GUESS: the category, worded as the short
   sentence the owner asked for. HaTi does not invent a summary of a document
   nobody has described. */
const NA_PROVENANCE = /^\s*Converted from\b.*\(original stored:/i;
function naCardSub(r){
  const sub = String((r && r.sub) || '').trim();
  if (sub && !NA_PROVENANCE.test(sub)) return sub;
  const cat = (r && r.cat) || '';
  const word = (typeof tplCategoryName==='function' && cat) ? tplCategoryName(cat) : '';
  return word ? i18t('na_card_about', { kind: word }) : '';
}
/* The machinery a reader does not need on the face, but that must not vanish. */
function naCardHint(r){
  const sub = String((r && r.sub) || '').trim();
  return NA_PROVENANCE.test(sub) ? sub : '';
}
/* ---- THE WHOLE OF EVERY CUT LINE, ON ONE HOVER (Young, 21 Sep 2026) ----
   Each of the card's three lines is reserved at ONE line now so every card
   measures the same, so each of them can be cut. A cut is not a silent trim:
   the name, the sentence and the provenance all ride the card's own title,
   which is where this product puts what a face has no room for. Written once
   here rather than assembled at the button, so the two cannot drift. */
function naCardTitle(r){
  const sub = String((r && r.sub) || '').trim();
  const shown = naCardSub(r);
  return [String((r && r.name) || '').trim(),
    /* the sentence the face carries, and the raw one where it was refused */
    shown, (sub && sub !== shown) ? sub : ''].filter(Boolean).join('\n');
}
function openNewAgreement(o){
  o=o||{};
  if(typeof canEdit==='function' && !canEdit()){ toast(i18t('wz_viewers_no_create'),'err'); return; }
  const esc=x=>String(x==null?'':x).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const tmpls=(typeof myCreatableTemplates==='function')?myCreatableTemplates():[];
  const mayEdit=(typeof canEdit!=='function')||canEdit();
  const libOf=()=>(mayEdit && typeof tplLibPublished==='function')?tplLibPublished():[];
  const mineOf=()=>(mayEdit && typeof customTemplates==='function')?customTemplates():[];
  if(!tmpls.length && !libOf().length && !mineOf().length){ toast(i18t('wz_no_templates_role'),'err'); return; }
  const ready=(typeof draftAiReady==='function')&&draftAiReady();
  const winW=(typeof window!=='undefined')?(window.innerWidth||0):0;
  const wide=winW>=NA_PAPER_MIN_W
    && ((typeof fillPreviewFits!=='function') || fillPreviewFits());
  /* ONE HOST, ONE ID, ONE PAINTER. #na-paper is emitted by exactly one of
     these two branches and never by both, so the agreement keeps a single
     home whatever the width and hostOpts.paperHost finds it by the same id. */
  const stack=!wide && winW>=NA_STACK_MIN_W;
  const admin=(typeof isAdmin==='function')&&isAdmin();
  const sName=k=>(k&&typeof FOLDERS==='object'&&FOLDERS[k]&&FOLDERS[k].name)||'';
  const verOf=t=>'v'+((typeof templateVersionNo==='function')?templateVersionNo(t):1);
  const rows=()=>[
    ...libOf().map(t=>({ kind:'lib', id:t.id, name:t.name, sub:t.description||'', stream:sName(t.folder), cat:t.category,
      go:i18t('na_go',{ v:'v'+(t.publishedVersion||1), n:naUsageCount('lib',t.id) }) })),
    ...mineOf().map(t=>({ kind:'mine', id:t.id, name:t.name, sub:t.description||t.blurb||'', stream:sName(t.folder), cat:t.category,
      go:i18t('na_go',{ v:verOf(t), n:naUsageCount('mine',t.id) }) })),
    ...forYouPick(tmpls).list.concat(tmpls.filter(t=>!forYouPick(tmpls).list.includes(t)))
      .map(t=>({ kind:'tid', id:t.id, name:t.kind, sub:t.blurb||'', stream:sName(t.folder), cat:t.category })),
  ];
  let sel=null, api=null;
  /* ---- THE PAPER IS A LIST, NOT A WALL OF CARDS (Young chose proposal C,
     22 Sep 2026) ----
     ONE ROW BUILDER FOR ALL THREE SHELVES, where there were two — a card for
     a company standard or a saved template, a chip for HaTi's own. Two
     builders for one act is what drifts: the chip already carried a different
     hover from the card's, and only the card said which stream a thing was
     filed in. THE CLOTHES FOLLOW THE BUILDER.

     WHAT A ROW HAS ROOM FOR IS THE NAME AND ITS FIGURES, and the description
     is the STATED COST of this proposal. It is not lost: naCardTitle already
     builds name + sentence + provenance and that is the row's own hover,
     which is this product's idiom for a cut.

     THE CARD RULINGS OF 21 SEP ARE SPENT, not broken. "they should all be the
     same size" and "not big either" were about cards in a GRID, where a grid
     stretches every cell to the tallest and a long name made two rows measure
     121px against 103px. A list does not stretch its siblings, so a row with
     no figures is simply one line and the fault cannot come back. */
  const pickRow=r=>{ const meta=[r.go||'', r.stream||''].filter(Boolean).join(' · '), hint=naCardTitle(r);
    return `<button type="button" class="na-pick${sel&&sel.kind===r.kind&&sel.id===r.id?' on':''}" data-wz-${r.kind}="${esc(r.id)}"${hint?` title="${esc(hint)}"`:''}>
      <span class="na-pick-n">${esc(r.name)}</span>${meta?`<span class="na-pick-m">${esc(meta)}</span>`:''}</button>`; };
  const industry=()=>(typeof workspaceIndustry==='function')?workspaceIndustry():'';
  const lobHtml=()=>admin&&typeof INDUSTRY_TEMPLATES==='object'?`<label class="na-lob">${i18t('wz_line_of_business')}
        <select id="wz-industry"><option value="">${i18t('wz_not_set')}</option>${
          Object.keys(INDUSTRY_TEMPLATES).map(k=>`<option value="${k}" ${industry()===k?'selected':''}>${esc(INDUSTRY_LABEL[k])}</option>`).join('')}</select></label>`:'';
  const listsHtml=q=>{
    const all=rows(), hits=all.filter(r=>naHit(r,q));
    const none=naHasWords(q)&&!hits.length;
    const show=none?all:hits;
    const sec=(kind,title)=>{ const rs=show.filter(r=>r.kind===kind); if(!rs.length) return '';
      return `<div class="na-sec"><div class="na-sec-h"><span class="na-sec-label">${title}</span>${kind==='tid'?lobHtml():''}</div><div class="na-rows">${rs.map(pickRow).join('')}</div></div>`; };
    return `${none?`<p class="na-none">${i18t(ready?'na_no_match_find':'na_no_match')}</p>`:''}
      ${sec('lib', i18t('na_company'))}
      ${sec('mine', i18t('na_saved'))}
      ${sec('tid', i18t('na_hati'))}`;
  };
  /* THE QUESTIONS AND THE AGREEMENT ARE NAMED ONCE and placed twice, because
     where they SIT is the only thing that changes with the width: three
     columns from 1280, and under 1280 both inside one column that scrolls on
     its own. Emitted from one string each, so the two shapes cannot drift
     about what a question card or a paper host is. */
  const naCard=`<div class="na-card" id="na-card">
        <div class="na-card-h"><h3 id="na-card-name"></h3><span class="na-card-sub" id="na-card-sub"></span></div>
        <div class="na-card-b"><div id="na-form"></div>
          <div class="na-note">${i18t(wide?'na_note_wide':(stack?'na_note_stack':'na_note'))}</div>
          ${/* ---- WHO ELSE IS ON THIS AGREEMENT (Young ruled 21 Sep 2026) ----
               SHUT BY DEFAULT and under the questions, because it is an offer
               and not a question: a draft is made without it every day. The
               rows are the Overview's own builder, so the two doors cannot
               disagree about what a role means, and nobody is emailed by
               anything on this screen — an invitation goes with the first
               send, which is the door that has always carried a link. */''}
          <details id="na-people" class="na-people">
            <summary>${i18t('ppl_title')}<span class="na-people-n" id="na-people-n"></span></summary>
            <p class="na-people-s">${i18t('ppl_sub')}</p>
            <div id="na-people-list"></div>
          </details></div>
      </div>`;
  const naPaper=`<div id="na-paper" class="na-paper"></div>`;
  openModal(`<div id="na-root" class="na-root">
    <div class="na-head"><div><h3>${i18t('na_title')}</h3><div class="na-sub">${i18t('na_sub')}</div></div>
      <button type="button" id="na-x" class="na-x" aria-label="${esc(i18t('act_cancel'))}" title="${esc(i18t('act_cancel'))}">${icon('x','w-4 h-4')}</button></div>
    <div id="na-body" class="na-body${wide?' na-wide':''}${stack?' na-stack':''}">
      <div id="wz-pick" class="na-left na-rail">
        <div class="na-field"><label for="dr-say">${i18t('na_describe')}</label>
          <div class="na-row">${''/* A TEXTAREA, BECAUSE THE ASK IS A SENTENCE (Young ruled 21 Sep 2026:
             "Describe what you need area should be able to wrap text"). A
             single-line input scrolls sideways and shows a reader the last
             eight words of what they typed. It keeps its id, its cap, its
             placeholder and its Enter (Enter presses Find; Shift+Enter is a
             newline), so nothing that reads #dr-say changed. */}
            <textarea id="dr-say" class="na-inp na-say" rows="2" maxlength="${(typeof DRAFT_SENTENCE_MAX==='number')?DRAFT_SENTENCE_MAX:2000}" placeholder="${esc(i18t('dr_ph'))}" autocomplete="off"></textarea>
            <button type="button" id="dr-read" class="ui-btn"${ready?'':` disabled title="${esc(i18t('dr_no_ai'))}"`}>${icon('sparkle','w-3.5 h-3.5')} ${i18t('na_find')}</button></div>
          <span class="na-hint">${ready?i18t('na_find_hint'):i18t('dr_no_ai')}</span></div>
        <div id="dr-out"></div>
        ${''/* THE LIST SCROLLS INSIDE THE RAIL, so a workspace with forty
               standards on the shelf does not drive the height of the whole
               pop-up. MEASURED at the parent: the frame was already at its
               own ceiling (88vh) and opening the people panel pushed the body
               into scrolling at every window height tried. */}
        <div id="na-lists" class="na-picks">${listsHtml('')}</div>
        ${''/* THE OTHER TWO WAYS IN, kept: a received document is not drafted
               from a template, and neither is a back-catalogue. */}
        <div class="na-more"><span>${i18t('na_received')}</span>
          <button type="button" id="na-upload" class="ui-btn-plain">${i18t('na_upload')}</button>
          <span aria-hidden="true">·</span>
          <button type="button" id="na-import" class="ui-btn-plain">${i18t('na_import')}</button></div>
      </div>
      ${''/* THE AGREEMENT SITS ON THE FAR SIDE OF THE QUESTIONS, not between
             the picker and them: what you are answering about is the thing
             you just chose, and the answers should not have to be read across
             the paper to reach it. Under 1280 there is no far side, so it
             goes UNDER them inside #na-right, which scrolls on its own —
             the rail holds still while you move between the two, which is
             the half of the ruling that makes this shape work at all.
             The host form mounts into the paper BY ID, so the order here is
             presentation and nothing else. */}
      ${stack?`<div class="na-right" id="na-right">${naCard}${naPaper}</div>`:naCard}
      ${wide?naPaper:''}
    </div>
    <div class="na-foot">
      <button type="button" id="wz-pick-cancel" class="ui-btn-plain">${i18t('act_cancel')}</button>
      <span class="na-grow"></span>
      <button type="button" id="na-skip" class="ui-btn" title="${esc(i18t('lib_create_now_fill_later'))}">${i18t('na_skip')}</button>
      <button type="button" id="na-create" class="ui-btn ui-btn-primary">${i18t('tl_create_draft')}</button>
    </div></div>`, { maxWidth: (wide?NA_FRAME_W:NA_FRAME_NARROW_W)+'px', label: i18t('na_title') });
  /* A STAGE WITHOUT REAL ELEMENTS (a sandbox that only records the markup)
     stops here: the markup is the whole of what it can read. */
  const root=document.getElementById('na-root');
  if(!root || typeof root.querySelector!=='function') return;
  const lists=()=>document.getElementById('na-lists');
  const paintLists=()=>{ const l=lists(); if(!l) return;
    const q=(document.getElementById('dr-say')||{}).value||'';
    l.innerHTML=listsHtml(q);
    document.getElementById('wz-industry')?.addEventListener('change',e=>{
      state.settings=state.settings||{};
      state.settings.industry=e.target.value||undefined;
      if(typeof saveSettings==='function') saveSettings();
      paintLists();
    });
  };
  const light=()=>{ root.querySelectorAll('.na-pick.on').forEach(b=>b.classList.remove('on'));
    if(sel){ const b=root.querySelector(`[data-wz-${sel.kind}="${String(sel.id).replace(/["\\]/g,'\\$&')}"]`); if(b) b.classList.add('on'); } };
  /* THE CARD IS THE CHOSEN DOOR'S OWN FORM. Every branch returns the acts the
     foot presses; the head prints the version where there is one and how
     many boxes were drawn. */
  /* THE CARD'S LABELS ARE THE ARTIFACT'S FIELD LABELS — 12px, label weight,
     the quiet ink — and carry no "→ where it is filed" arrow (the pop-up diet
     of 13 Sep names those arrows stale; here the box is 380px wide and the
     arrow made every label two lines). The three host forms draw their
     labels through HATI_LBL-style inline declarations, which is the product's
     rule for a field label, so the card RE-DRESSES them after the mount
     rather than growing a fourth label renderer: one renderer per door, one
     dress per frame. The arrow's words survive on the label's hover. */
  const dress=host=>{
    host.querySelectorAll('label > span:first-child').forEach(sp=>{
      const arrow=sp.querySelector('span'); const star=sp.querySelector('span[style*="ruby"]');
      if(arrow && arrow!==star){ const t=arrow.textContent.replace(/^\s*→\s*/,'').trim(); if(t && !sp.title) sp.title=t; arrow.remove(); }
      sp.style.cssText='display:block;font-size:var(--t-label);font-weight:var(--w-label);color:var(--color-neutral-600);margin-bottom:4px;font-family:var(--font-body);letter-spacing:0;text-transform:none';
    });
  };
  const pick=(kind,id,prefill)=>{
    const host=document.getElementById('na-form'); if(!host) return;
    const hostOpts={ host, paperHost:document.getElementById('na-paper'), root:document.getElementById('na-body') };
    sel={kind,id}; api=null; let name='', ver='';
    if(kind==='tid'){ api=wizardFormMount(hostOpts, id, prefill); const t=TEMPLATES[id]; name=t?t.kind:id; }
    else if(kind==='lib'){ const t=libOf().find(x=>x.id===id); name=t?t.name:id; ver='v'+((t&&t.publishedVersion)||1);
      api=(typeof tplLibNewContract==='function')?tplLibNewContract(id, prefill, hostOpts):null; }
    else { const t=mineOf().find(x=>x.id===id); name=t?t.name:id; ver=t?verOf(t):'';
      api=(typeof createFromCustomTemplate==='function')?createFromCustomTemplate(id, prefill, hostOpts):null; }
    const n=api?api.count:0;
    dress(host);
    const nm=document.getElementById('na-card-name'), sb=document.getElementById('na-card-sub');
    if(nm) nm.textContent=name;
    if(sb) sb.textContent=`${ver?ver+' · ':''}${i18tn('na_questions', n, {n})}`;
    /* A DIFFERENT TEMPLATE PUTS YOU BACK AT ITS QUESTIONS. Stacked, the paper
       is below the fold, so a pick made while reading it would otherwise
       leave the reader looking at a new contract's paper with its questions
       off the screen. Nothing to do where the column does not exist. */
    const rcol=document.getElementById('na-right'); if(rcol) rcol.scrollTop=0;
    light();
  };
  root._naPick=pick;
  root.querySelector('#wz-pick')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-wz-lib],[data-wz-mine],[data-wz-tid]'); if(!b||!root.contains(b)) return;
    if(b.hasAttribute('data-wz-lib')) pick('lib', b.getAttribute('data-wz-lib'), o.prefill);
    else if(b.hasAttribute('data-wz-mine')) pick('mine', b.getAttribute('data-wz-mine'), o.prefill);
    else pick('tid', b.getAttribute('data-wz-tid'), o.prefill);
  });
  /* THE LIST IS HELD, NEVER WRITTEN HERE: there is no record yet. It rides
     participantsHold and is claimed by contractArrived, the one funnel every
     creation site already registers with — so all three creators on this
     screen get it without any of them learning about it. Cancelling drops it,
     which is why both ways out call participantsDrop. */
  const scratch={ participants:[], folder:'' };
  const peopleHost=document.getElementById('na-people-list');
  const paintPeople=()=>{
    if(!peopleHost||typeof participantsPanelHtml!=='function') return;
    peopleHost.innerHTML=participantsPanelHtml(scratch,{ editable:true, reach:false });
    const n=document.getElementById('na-people-n');
    if(n) n.textContent=scratch.participants.length?' \u00b7 '+i18tn('ppl_n',scratch.participants.length,{n:scratch.participants.length}):'';
    if(typeof participantsHold==='function') participantsHold(scratch.participants);
  };
  if(peopleHost&&typeof participantsWire==='function'){
    participantsWire(peopleHost,scratch,{ reach:false, repaint:paintPeople,
      onChange:()=>{ if(typeof participantsHold==='function') participantsHold(scratch.participants); } });
    paintPeople();
  }
  /* ---- THE HOLD BELONGS TO THIS SCREEN, SO IT GOES WHEN THE SCREEN DOES ----
     Cancel and the ✕ are two of five ways out — Escape and the scrim call
     closeModal directly, and Create tears the screen down itself — so hanging
     the drop off the two buttons would leave people held after an Escape, and
     the next contract minted anywhere in the product would claim them. The
     screen's own disappearance is the one signal every way out shares.
     THE CREATE PATH IS EXEMPT: it closes the screen and mints a record in the
     same breath, and the claim has to win that race, so it is spent by hand
     before the observer can fire. */
  let _naClaimed=false;
  const dropHeld=()=>{ if(!_naClaimed && typeof participantsDrop==='function') participantsDrop(); };
  try{
    const mr=document.getElementById('modal-root');
    if(mr && typeof MutationObserver==='function'){
      const ob=new MutationObserver(()=>{
        if(document.getElementById('na-root')) return;
        ob.disconnect(); dropHeld();
      });
      ob.observe(mr,{childList:true,subtree:true});
    }
  }catch(_){}
  const leave=()=>{ dropHeld(); closeModal(); };
  document.getElementById('wz-pick-cancel')?.addEventListener('click', leave);
  document.getElementById('na-x')?.addEventListener('click', leave);
  /* CREATING IS THE ONE WAY OUT THAT KEEPS THEM: the record is minted in the
     same breath and contractArrived claims them off the hold. */
  const goCreate=fn=>()=>{ if(!api){ toast(i18t('na_pick_first'),'err'); return; }
    _naClaimed=true; fn(); };
  document.getElementById('na-create')?.addEventListener('click', goCreate(()=>api.create()));
  document.getElementById('na-skip')?.addEventListener('click', goCreate(()=>api.skip()));
  document.getElementById('na-upload')?.addEventListener('click', ()=>{ closeModal(); if(typeof openUploadModal==='function') openUploadModal(); });
  document.getElementById('na-import')?.addEventListener('click', ()=>{ closeModal(); if(typeof setView==='function') setView('migration'); });
  const say=document.getElementById('dr-say'), read=document.getElementById('dr-read');
  let _t=null;
  say?.addEventListener('input',()=>{ naSayFit(say); clearTimeout(_t); _t=setTimeout(paintLists, 120); });
  /* ENTER STILL PRESSES FIND, and Shift+Enter is a newline — the box wraps
     now, so a reader who wants a second line has a way to ask for one. */
  say?.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(read&&!read.disabled) read.click(); } });
  if(read && ready) read.addEventListener('click',()=>{ if(typeof draftRead==='function') draftRead(); });
  paintLists();
  /* THE CARD IS NEVER EMPTY: the first door is lit on arrival, exactly as the
     artifact draws it, or the one the caller named. */
  const first=rows()[0];
  const want=o.pick&&rows().find(r=>r.kind===o.pick.kind&&String(r.id)===String(o.pick.id));
  if(want) pick(want.kind, want.id, o.prefill); else if(first) pick(first.kind, first.id, o.prefill);
  naSayFit(say);
  if(o.say && say) say.focus();
  /* The company standards may still be in flight (the same race the draft
     dialog closes): repaint the LISTS when they land, never the card. */
  if(typeof tplLibReady==='function' && typeof tplLibPublished==='function'){
    const before=libOf().length;
    tplLibReady().then(()=>{ if(document.getElementById('na-root')===root && libOf().length!==before) paintLists(); }).catch(()=>{});
  }
}
/* The draft-from-a-sentence hand-off lands in the open pop-up: the chosen
   paper lights and its questions arrive pre-filled in the card. Answers false
   where no pop-up is open, and draftHandOff then opens the door itself. */
function naPickFromDraft(pick, prefill){
  const root=document.getElementById('na-root');
  if(!root || typeof root._naPick!=='function' || !pick) return false;
  const kind=pick.kind==='builtin'?'tid':pick.kind;
  root._naPick(kind, pick.id, prefill);
  return true;
}

Object.assign(window,{TEMPLATE_PRIMARY,TEMPLATE_STARTERS,INDUSTRY_TEMPLATES,INDUSTRY_LABEL,FOR_YOU_MAX,FOR_YOU_LOB_MIN,forYouPick,workspaceIndustry,builtinUsageCount,builtinUsageRows,forYouTemplates,templateVars,templateRoles,templateAllowedForRole,myCreatableTemplates,openWizard,createFromWizard,wzFieldHtml,wzEmailHtml,wizardFormMount,openNewAgreement,naPickFromDraft,naHit,naCardSub,naCardHint,naCardTitle,naSayFit,NA_SAY_MAX_LINES,NA_PAPER_MIN_W,NA_STACK_MIN_W,NA_RAIL_W,NA_PAPER_W,NA_FRAME_W,NA_FRAME_NARROW_W});
