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
/* IN THE READER'S LANGUAGE (the owner's list, 27 Sep 2026), read at the
   moment each is shown — per-key getters, never a literal frozen at load
   (THE GETTER TRAP). The KEYS stay English: they are the stored setting. */
const INDUSTRY_LABEL={ get services(){ return i18t('wz_lob_services'); }, get manufacturing(){ return i18t('wz_lob_manufacturing'); },
  get distribution(){ return i18t('wz_lob_distribution'); }, get retail(){ return i18t('wz_lob_retail'); } };
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
  if(!canEdit()){ if(typeof draftWallToast==='function') draftWallToast(); else toast(i18t('wz_viewers_no_create'),'err'); return; }
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
      const EYE='display:block;font-family:var(--font-mono);font-size:var(--t-micro);color:var(--color-neutral-500);margin:0 0 6px;';
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
        <span style="display:flex;align-items:center;gap:var(--s-2);"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:var(--radius);background:${r.std?'var(--color-accent)':'var(--color-accent-100)'};color:${r.std?'#fff':'var(--accent-ink)'};flex:none;">${icon(r.ic,'w-3.5 h-3.5')}</span>
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
            <select id="wz-industry" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;color:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
              <option value="">${i18t('wz_not_set')}</option>
              ${Object.keys(INDUSTRY_TEMPLATES).map(k=>`<option value="${k}" ${industry===k?'selected':''}>${INDUSTRY_LABEL[k]}</option>`).join('')}
            </select></label>`:''}
          ${''/* SEARCH STAYS ON THE FRONT SCREEN and looks across every stream:
                 browsing is for when you do not know the name, and searching is
                 for when you do. Making the search obey the open folder would
                 make the faster of the two routes the narrower one. */}
          <input id="wz-search" type="search" placeholder="${i18t('wz_search_all')}" autocomplete="off"
            style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:var(--radius);font:inherit;color:inherit;outline:none;margin-bottom:10px;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)"/>
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
          <button data-dlg-cancel id="wz-pick-cancel" class="ui-btn">${i18t('act_cancel')}</button>
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
      <button id="wz-back" type="button" class="ui-link" style="margin-bottom:var(--s-2)">${(typeof icon==='function')?icon('chevL','w-3.5 h-3.5'):''}templates</button>
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;color:var(--color-text);margin:0 0 3px;">${t.kind}</h3>
      <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-4);line-height:1.5;">${t.blurb||''}</p>
      <div id="wz-cols" style="display:grid;grid-template-columns:${_pv?'minmax(0,1fr) minmax(0,1fr)':'minmax(0,1fr)'};gap:var(--s-4);align-items:start">
      <div class="field-grid" style="${(typeof FIELD_GRID_CSS==='string'?FIELD_GRID_CSS:'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s-3)')};">${vars.map(input).join('')}
        ${wzEmailHtml()}
      </div>
      ${_pv?fillPreviewPaneHtml(vars.filter(v=>!String(v.def||'').trim()).length):''}
      </div>
      ${WZ_ERR_HTML}
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-top:20px;">
        <button data-dlg-cancel id="wz-cancel" class="ui-btn">${i18t('act_cancel')}</button>
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
/* The line a refusal is printed on, under the boxes — dressed as the
   essentials form's #ce-err, with the list's own line breaks kept. */
const WZ_ERR_HTML=`<div id="wz-err" role="alert" style="font-size:var(--t-label);color:var(--st-ruby-fg);min-height:15px;margin-top:var(--s-2);white-space:pre-line"></div>`;
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
  /* SAID WHERE THE BOXES ARE (9 Oct 2026): a toast sat on top of the
     dialog's own buttons. The answer step and the New agreement card both
     carry #wz-err under the boxes — the essentials form's #ce-err, the same
     line — and the toast stays only for a caller with no such line. */
  const errLine=document.getElementById('wz-err');
  if(errs.length){
    const msg=errs.length===1?errs[0]:`${errs.length} things need fixing:\n• ${errs.join('\n• ')}`;
    if(errLine){ errLine.textContent=msg; try{ errLine.scrollIntoView({ block:'nearest' }); }catch(_){} }
    else toast(msg,'err');
    return;
  }
  if(errLine) errLine.textContent='';
  const cp=values.counterparty||'';
  /* THE NAME THEY TYPED IS THE COUNTERPARTY, not just a word in the title.
     This wrote `counterparty:''` and folded `cp` into the display name only,
     so a contract drafted for Kabras was titled "…— Kabras" while the field
     the register filters on, the reports total by, and the signing readiness
     check reads ("Complete: counterparty name") stayed empty. The operator
     then re-typed, in the workspace, a fact they had already given the wizard.
     Uploads have always recorded it (js/views/contract.js); the two
     template-born paths now agree with them. */
  const c={ id:nextId(), name:t.name+(cp?' — '+cp:''),   /* no "(Draft)" in a name: the stage says it, and a name outlives the stage (the owner's list, 27 Sep 2026) */ counterparty:cp,
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
  /* THEIR ADDRESS GOES INTO THE ADDRESS BOOK through its one writer
     (js/participants.js), which keeps the record's copy in step. */
  if(cpEmail){ if(window.contactSet) contactSet(c,{ main:true, email:cpEmail }); else c.counterpartyEmail=cpEmail; }
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
  /* SAVED FIRST, THEN READ (26 Sep 2026, the overnight clean-up): the
     reading's first step is flushSaves(), which can only save what persist()
     has queued — called after contractArrived, the queue was still empty, the
     brief reached the server before the contract did, and every draft made
     here was stamped "No brief — Contract not found" (never retried). */
  persist(c);
  if(window.contractArrived) contractArrived(c);
  closeModal();
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
const WZ_ST='width:100%;height:var(--field-h,28px);border:1px solid var(--color-divider);background:var(--need-bg,var(--color-surface));border-radius:var(--radius);padding:0 var(--field-pad-x,10px);font-size:var(--t-body);font-family:var(--font-body);color:var(--color-text);outline:none;';
function wzFieldHtml(v){
  const id='wz-'+String(v.key).replace(/[:]/g,'_');
  const lbl=`<span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1);font-family:var(--font-heading);letter-spacing:.02em;">${v.label}${v.required?' <span style="color:var(--st-ruby-fg)">*</span>':''}${wzMapNote(v)}</span>`;
  /* A value stream is drawn by the product's own list (18 Sep 2026):
     folderOptionsHtml carries the "+ New value stream" sentinel and
     bindFolderSelect answers it — bound by the caller once the markup is in
     the page. */
  if(v.type==='stream') return `<label style="display:block;">${lbl}
    <select id="${id}" style="${WZ_ST}">${(typeof folderOptionsHtml==='function') ? folderOptionsHtml(v.def||null, false, { reach:true }) : ''}</select></label>`;
  /* WHO PAYS WHOM: the side of the money as three presses, its meaning said under them (payWhoHtml) */
  if(v.key==='side' && v.maps==='category' && typeof payWhoHtml==='function') return `<div class="pw-field">${lbl}${payWhoHtml(id, v.def)}</div>`;
  if(v.type==='select') return `<label style="display:block;">${lbl}
    <select id="${id}" style="${WZ_ST}"${(typeof needAttrs==='function'?needAttrs(v,v.def||((v.opts||[])[0]!=null&&typeof fieldOpt==='function'?fieldOpt(v.opts[0]).v:'')):'')}>
      ${(v.opts||[]).map(o=>(typeof fieldOpt==='function')?fieldOpt(o):{v:String(o),l:String(o)}).map(o=>
        `<option value="${String(o.v).replace(/"/g,'&quot;')}" ${String(v.def||'')===o.v?'selected':''}>${o.l}</option>`).join('')}</select></label>`;
  const it=v.type==='date'?'date':(v.type==='num'?'number':'text');
  /* THE OTHER COMPANY, in a first-timer's words, with where its name is found (round 3 of the first-timer rounds) */
  const cp=v.key==='counterparty'&&v.maps==='counterparty';
  const lab=cp?lbl.replace(v.label, String(i18t('tf_cp_company')).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))):lbl;
  return `<label style="display:block;">${lab}
    <input id="${id}" type="${it}"${(typeof needAttrs==='function'?needAttrs(v,v.def):'')} value="${String(v.def||'').replace(/"/g,'&quot;')}" placeholder="${v.ph||''}" style="${WZ_ST}"/>${cp?`<span class="wz-help">${i18t('tf_cp_company_help')}</span>`:''}</label>`;
}
/* ASKED HERE, WHERE YOU ARE ALREADY NAMING THEM, AND NOWHERE ELSE. The
   templates carry the counterparty's NAME; nothing carried the address, so it
   was collected later — by a strip in the negotiation room, and again by the
   share dialog when you pressed Send. Three times for one fact, in one
   sitting. Once it is on the contract the strip never appears and the send
   goes straight out. */
function wzEmailHtml(val){
  return `<label style="display:block;">
    <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1);font-family:var(--font-heading);letter-spacing:.02em;">${i18t('wz_their_email')}</span>
    <input id="wz-cpemail" type="email" value="${String(val||'').replace(/[&"<>]/g,ch=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[ch]))}" placeholder="${(typeof jxEg==='function'&&jxEg('theirEmail'))||'them@company.co.ke'}" style="${WZ_ST}"/></label>`;
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
  o.host.innerHTML=`<div class="field-grid" style="${(typeof FIELD_GRID_CSS==='string'?FIELD_GRID_CSS:'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s-3)')};">${vars.map(wzFieldHtml).join('')}${wzEmailHtml(prefill&&prefill.cpemail)}</div>${WZ_ERR_HTML}`;
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

   THE PAPER IS GONE FROM THIS SCREEN, AND THE ASK TAKES THE TOP LINE (Young
   ruled it 22-23 Sep 2026: "remove paper from the pop up entirely and in any
   type of computer", then, off four renders of the screen without it, "the
   describe what you need maybe takes the whole top line" — option 1, "ask on
   top, then list and questions side by side").
   THIS REVERSES TWO RULINGS OF THE DAY BEFORE, and their reasoning is kept
   here because it is what makes this safe rather than a swing back:
   · proposal C: the agreement drawn beside the questions from 1280, because
     at the old line of 1600 it was not on the owner's screen at all;
   · D: under 1280 the agreement stacked UNDER the questions, the two sides
     scrolling apart, because every iPad but a 12.9" fell below 1280.
   MEASURED the next morning on the owner's own iPad Pro 12.9" (1366 wide):
   it drew the laptop's three columns, exactly what the line said. The answer
   was not a better line; it was no paper on this screen on any device. A
   draft opens on the contract page, where the whole wording is the first
   thing on screen — one press away, not lost.
   THE OTHER CREATION SCREENS ARE UNTOUCHED, BY CONSTRUCTION. This card mounts
   the chosen door's own form, and all three forms draw a paper ONLY where
   they are handed a host for it — wizardFormMount, openContractEssentials
   and openTemplateFillModal each ask `paperHost` first — and this screen
   hands them none. Their own dialogs still draw the agreement beside the
   questions from fillPreviewFits()'s 1000; whether it goes from those too is
   the owner's open question, not this change's.

   TWO NUMBERS, SAID OUT LOUD AND READ BY BOTH HOSTS: the rail (here, and in
   index.html through --na-rail-w) and the frame, which is one width at every
   window now. The wide and stacked gates, and the four numbers that fed them
   (NA_PAPER_MIN_W, NA_PAPER_W, NA_FRAME_W, NA_STACK_MIN_W), had no reader
   left and are GONE rather than kept dormant: a branch that can never fire
   again is a guard that is always false. */
const NA_RAIL_W = 260;
/* the choices' card: never shorter than this; it ends level with the card
   beside it, or — stacked under the rail — this far above the window's foot */
const NA_ROWS_MIN_H = 200;
const NA_ROWS_FOOT = 24;           /* the picker's own column, rows not cards */
const NA_FRAME_NARROW_W = 900;   /* rail + questions — the frame, at every window */
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
/* ---- TWO DOORS BEHIND ONE BUTTON (Young ruled 23 Sep 2026: "i need upload
   to be inside draft new agreement. When you click on draft new agreement you
   should have a door to drafting from contracts in hati or door to uploading")
   ----
   The Contracts page carried a separate Upload button beside Draft new
   agreement; upload also sat as a quiet link at the foot of the drafting
   screen, where it was easy to miss. A PERSON pressing the button — called
   with no options — now meets the two doors first. Every caller that already
   knows it is drafting (a picked template, a sentence, a prefill, the wizard's
   way back) passes options and goes straight to the drafting screen, so no
   internal path grows a question.
   ONE ACT EACH, NEVER A SECOND ONE: the drafting door is this function, the
   upload door is openUploadModal — the one dialog every upload already uses. */
function openNewDoors(){
  if(typeof canEdit==='function' && !canEdit()){ if(typeof draftWallToast==='function') draftWallToast(); else toast(i18t('wz_viewers_no_create'),'err'); return; }
  /* ONE DOOR (owner picked the Legora way, 24 Oct 2026): on a computer the drop-down is gone —
     the one sheet's own two tabs, Our paper · Their paper, are the choice. The phone keeps it. */
  if(!(typeof mPhone==='function'&&mPhone())) return openNewAgreement({ door:true });
  const esc=x=>String(x==null?'':x).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const ic=(n)=>(typeof icon==='function')?icon(n,'w-4 h-4'):'';
  const go=k=>{
    if(k==='draft') openNewAgreement({ door:true });
    else if(k==='upload'){ if(typeof pdDropDoor==='function' && pdDropDoor()) return; if(typeof openUploadModal==='function') openUploadModal(); }
  };
  /* ---- TWO DOORS ARE A MENU, NOT A POP-UP (SAP pop-ups, owner's go 10 Oct
     2026) ----
     SAP's menu button: a choice of doors drops down under the button that
     was pressed, so the reader's eye stays where it was and nothing dims the
     page. The doors, their words and what each one opens are unchanged.
     The button pressed is the anchor; with none on screen (a call from code,
     the phone) the doors fall back to the dialog they always were. */
  const anchor=document.activeElement;
  const ar=anchor && anchor!==document.body && anchor.tagName==='BUTTON' && anchor.getClientRects().length
    ? anchor.getBoundingClientRect() : null;
  if(ar && !(typeof selectMenuStandsDown==='function' && selectMenuStandsDown())){
    document.getElementById('nd-menu')?.remove();
    const m=document.createElement('div');
    m.id='nd-menu'; m.className='nd-menu'; m.setAttribute('role','menu'); m.setAttribute('aria-label',i18t('na_doors_title'));
    m.setAttribute('data-top-overlay','1');
    const item=(k,ico,t,d)=>`<button type="button" role="menuitem" class="nd-item" data-nd-door="${k}">
        <span class="nd-ic">${ic(ico)}</span><span class="nd-tx"><span class="nd-t">${esc(t)}</span><span class="nd-d">${esc(d)}</span></span></button>`;
    m.innerHTML=item('draft','file',i18t('na_door_draft'),i18t('na_door_draft_sub'))+item('upload','upload',i18t('na_door_upload'),i18t('na_door_upload_sub'));
    document.body.appendChild(m);
    const w=m.offsetWidth;
    m.style.top=Math.round(ar.bottom+4)+'px';
    m.style.left=Math.round(Math.max(8,Math.min(ar.right-w,window.innerWidth-w-8)))+'px';
    anchor.setAttribute('aria-expanded','true');
    const items=[...m.querySelectorAll('[data-nd-door]')];
    const close=back=>{ m.remove(); anchor.setAttribute('aria-expanded','false');
      document.removeEventListener('pointerdown',away,true); document.removeEventListener('keydown',key,true);
      if(back && anchor.isConnected) anchor.focus(); };
    const away=ev=>{ if(!m.contains(ev.target) && ev.target!==anchor && !anchor.contains(ev.target)) close(false); };
    const key=ev=>{
      if(ev.key==='Escape'){ ev.preventDefault(); ev.stopImmediatePropagation(); close(true); return; }
      if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ ev.preventDefault();
        const i=items.indexOf(document.activeElement); items[(i+(ev.key==='ArrowDown'?1:items.length-1))%items.length].focus(); }
      if(ev.key==='Tab'){ close(false); }
    };
    items.forEach(b=>b.addEventListener('click',()=>{ const k=b.getAttribute('data-nd-door'); close(false); go(k); }));
    document.addEventListener('pointerdown',away,true);
    document.addEventListener('keydown',key,true);
    items[0].focus();
    return;
  }
  const door=(k,ico,t,d)=>`<button type="button" class="tn-tile" data-nd-door="${k}"
      style="display:flex;flex-direction:column;gap:10px;width:100%;text-align:left;padding:16px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;color:var(--color-text);cursor:pointer">
      <span style="width:32px;height:32px;border-radius:var(--radius);display:grid;place-items:center;background:var(--st-steel-bg);color:var(--st-steel-fg)">${ic(ico)}</span>
      <span style="display:block;font-size:var(--t-card);font-weight:var(--w-title)">${esc(t)}</span>
      <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5">${esc(d)}</span></button>`;
  openModal(`<div style="padding:24px">
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;color:var(--color-text);margin:0 0 14px">${esc(i18t('na_doors_title'))}</h3>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
        ${door('draft','file',i18t('na_door_draft'),i18t('na_door_draft_sub'))}
        ${door('upload','upload',i18t('na_door_upload'),i18t('na_door_upload_sub'))}
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <button data-dlg-cancel type="button" class="ui-btn" data-nd-door="cancel">${esc(i18t('act_cancel'))}</button></div>
    </div>`, { maxWidth: (typeof DLG_W!=='undefined'&&DLG_W.m)||520 });
  document.querySelectorAll('[data-nd-door]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.getAttribute('data-nd-door');
    closeModal();
    if(k==='draft') openNewAgreement({ door:true });
    else if(k==='upload'){ if(typeof pdDropDoor==='function' && pdDropDoor()) return; if(typeof openUploadModal==='function') openUploadModal(); }
  }));
}
function openNewAgreement(o){
  if(o===undefined) return openNewDoors();
  o=o||{};
  if(typeof canEdit==='function' && !canEdit()){ if(typeof draftWallToast==='function') draftWallToast(); else toast(i18t('wz_viewers_no_create'),'err'); return; }
  const esc=x=>String(x==null?'':x).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const tmpls=(typeof myCreatableTemplates==='function')?myCreatableTemplates():[];
  const mayEdit=(typeof canEdit!=='function')||canEdit();
  const libOf=()=>(mayEdit && typeof tplLibPublished==='function')?tplLibPublished():[];
  const mineOf=()=>(mayEdit && typeof customTemplates==='function')?customTemplates():[];
  if(!tmpls.length && !libOf().length && !mineOf().length){ toast(i18t('wz_no_templates_role'),'err'); return; }
  /* the page it was started on names the crumb, read before the form goes Home */
  const fromView=(typeof state==='object'&&state)?state.view:'';
  const naFrom=naHomeFirst();
  const ready=(typeof draftAiReady==='function')&&draftAiReady();
  const sName=k=>(k&&typeof FOLDERS==='object'&&FOLDERS[k]&&FOLDERS[k].name)||'';
  const verOf=t=>'v'+((typeof templateVersionNo==='function')?templateVersionNo(t):1);
  const rows=()=>[
    ...libOf().map(t=>({ kind:'lib', id:t.id, name:t.name, sub:t.description||'', stream:sName(t.folder), cat:t.category,
      go:'v'+(t.publishedVersion||1) })),
    ...mineOf().map(t=>({ kind:'mine', id:t.id, name:t.name, sub:t.description||t.blurb||'', stream:sName(t.folder), cat:t.category,
      go:verOf(t) })),
    ...forYouPick(tmpls).list.concat(tmpls.filter(t=>!forYouPick(tmpls).list.includes(t)))
      .map(t=>({ kind:'tid', id:t.id, name:t.kind, sub:t.blurb||'', stream:sName(t.folder), cat:t.category })),
  ];
  let sel=null, api=null;
  /* ---- ONE SHEET (owner picked "One sheet" by name, round 4 of the
     redesign, 17 Oct 2026) ----
     Opened from a sentence (Jambo's draft ask, o.closest), the form is one
     sheet read top to bottom: FROM YOUR WORDS (what was read, without AI; the
     form's own Find as "Let Jambo fill the form", its cost on it), then 1 START
     FROM (the closest of our paper, the best marked, NOTHING picked; the whole
     search list one press away; "Ask Legal with a request"), 2 the paper's
     questions, 3 FILE IT IN (the stream as buttons — a mirror of the form's own
     stream box, the one writer). Every other door keeps the form as it was. */
  /* ---- ONE DOOR, THE LEGORA WAY (owner picked it by name, 24 Oct 2026: "When i
     want a contract i get 2 different doors"; "go with the Legora way") ----
     EVERY DOOR ON A COMPUTER OPENS THIS ONE SHEET — a sentence to Jambo, "new
     agreement", the + button, a template's "Use this", a request's "Start the
     draft", a customer's "New contract". Your words sit at the top in one ask
     box, Our paper · Their paper are its two tabs, the closest papers (or, with
     no words yet, the most used) are one quiet list, what was read from the
     words is shown with the words it came from, and the paper's questions are
     answered in their rows. The older form (template list on the left, "Or
     describe what you need", Skip the questions) is drawn only on the phone. */
  const one=!(typeof mPhone==='function'&&mPhone());
  const asked=String(o.asked||'').slice(0,(typeof DRAFT_SENTENCE_MAX==='number')?DRAFT_SENTENCE_MAX:2000);
  /* OUR PAPER OR THEIRS, on the sheet's own two tabs (never a card or a menu before it) */
  let paper=(o.paper==='theirs')?'theirs':'ours', theirFile=null;
  /* what the free reader found in the words (draftWordsRead), each with the words it came from */
  const facts=(o.words&&Array.isArray(o.words.facts))?o.words.facts:[];
  /* The answers typed in this sitting, by the box's key — see pick. */
  const kept={};
  /* ---- NOTHING TYPED IS LOST WITHOUT A QUESTION (9 Oct 2026) ----
     Cancel, the ✕, Escape and the scrim all closed the pop-up and threw away
     every answer typed into the card and the sentence above it. Each way out
     asks first while anything holds text; nothing typed, nothing asked. */
  const naTyped=formOnly=>{
    const say=document.getElementById('dr-say');
    if(!formOnly && say && String(say.value||'').trim() && String(say.value||'').trim()!==asked.trim()) return true;
    const host=document.getElementById('na-form');
    return !!host && Object.keys(naCarryRead(host, {})).length>0;
  };
  /* formOnly: the sheet's own re-read keeps the new words, so only the form's answers are asked about */
  const naAskLeave=async formOnly=>{
    if(!naTyped(formOnly===true)) return true;
    return !!(await confirmDialog({ title:i18t('na_leave_q'), message:i18t('na_leave_body'),
      confirmLabel:i18t('na_leave_go'), cancelLabel:i18t('na_leave_stay'), danger:true, leave:true }));
  };
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
  /* ONE ROW BUILDER, two dresses: the list's row, or the sheet's card (card===true:
     a radio, and the shelf's own facts — the gaps, round 4, 18 Oct 2026) */
  const pickRow=(r,best,card)=>{ const on=!!(sel&&sel.kind===r.kind&&String(sel.id)===String(r.id)), hint=naCardTitle(r);
    const used=card===true?usedOf(r):0;
    /* WHAT IT SHARES WITH YOUR WORDS, in your spelling (round 2 of the first-timer rounds) */
    const shares=(card===true&&asked&&typeof caDraftMatched==='function')?caDraftMatched(asked,{ name:r.name, blurb:r.sub||'' }):[];
    const meta=(card===true?(r.kind==='tid'?[shelfOf(r)]:[shelfOf(r), r.go||'', r.stream||'']).concat(used?[i18tn('na_used_n',used,{n:used})]:[])
      .concat(shares.length?[i18t('na_shares',{ w:shares.slice(0,2).map(w=>'“'+w+'”').join(', ') })]:[])
      :[r.go||'', r.stream||'']).filter(Boolean).join(' · ');
    /* WHEN TO USE IT, one everyday line: HaTi's own papers carry theirs (tpl_use_*), ours their description */
    const use=card===true?naUseWhen(r):'';
    /* THE LEGORA WAY'S ROW (24 Oct 2026): the name, then one line — what it matched in your words
       and when to use it (else its shelf) — and how often it was used at the right */
    const why=card===true?[shares.length?i18t('na_matched',{ w:shares.slice(0,2).map(w=>'“'+w+'”').join(', ') }):'', use||[shelfOf(r), r.kind==='tid'?'':(r.go||'')].filter(Boolean).join(' · ')].filter(Boolean).join(' · '):'';
    const inner=card===true
      ? `<span class="na-radio" aria-hidden="true"></span><span class="na-lr-t"><span class="na-lr-top"><span class="na-pick-n">${esc(r.name)}</span>${best===true?`<span class="na-best">${esc(i18t('na_best'))}</span>`:''}</span>${why?`<span class="na-pick-m">${esc(why)}</span>`:''}</span><span class="na-lr-used">${used?esc(i18tn('na_used_n',used,{n:used})):''}</span>`
      : `<span class="na-pick-n">${esc(r.name)}</span>${best===true?`<span class="na-best">${esc(i18t('na_best'))}</span>`:''}${meta?`<span class="na-pick-m">${esc(meta)}</span>`:''}${use?`<span class="na-use">${esc(use)}</span>`:''}`;
    return `<button type="button" class="na-pick${card===true?' na-close':''}${on?' on':''}"${card===true?` role="radio" aria-checked="${on}"`:''} data-wz-${r.kind}="${esc(r.id)}"${hint?` title="${esc(hint)}"`:''}>${inner}</button>`; };
  /* ONE SHEET'S FIRST STEP: the closest rows, in the reading's order — drawn as
     cards (the gaps, round 4, 18 Oct 2026): a radio, the name, the best marked,
     and the shelf's own facts — "Company standard · v3 · Sales · used 14 times",
     a HaTi template its shelf alone — read off each shelf's own count of use
     (contractsCreated, templateUsage, builtinUsageCount) */
  const shelfOf=r=>i18t(r.kind==='lib'?'na_shelf_lib':r.kind==='mine'?'na_shelf_mine':'na_shelf_tid');
  const usedOf=r=>{ let n=0; try{ n=r.kind==='lib'?(Number((libOf().find(t=>t.id===r.id)||{}).contractsCreated)||0)
    :r.kind==='mine'?(Number((typeof templateUsage==='function'?templateUsage(r.id):{}).count)||0)
    :(typeof builtinUsageCount==='function'?builtinUsageCount(r.id):0); }catch(_){ n=0; } return n; };
  /* ONE QUESTION DECIDES (owner picked "One question", 22 Oct 2026): where two
     papers easily confused both stand among the closest (caDraftPairOf), the
     answer moves its paper first and marks it the closest. Nothing is picked:
     the reader still presses the card. */
  let dqAns='';
  const dqPair=()=>(one&&typeof caDraftPairOf==='function')?caDraftPairOf(closestBase()):null;
  const closestBase=()=>{ const all=rows();
    if(Array.isArray(o.closest)&&o.closest.length) return o.closest.map(k=>all.find(r=>r.kind===k.kind&&String(r.id)===String(k.id))).filter(Boolean);
    /* NO WORDS YET: the three of our paper used most (each shelf's own count) */
    return all.map((r,i)=>({ r, i, n:usedOf(r) })).sort((a,b)=>b.n-a.n||a.i-b.i).slice(0,3).map(x=>x.r); };
  const naMost=!(Array.isArray(o.closest)&&o.closest.length);
  const dqId=()=>{ const P=dqPair(); const a=P&&dqAns?P.a.find(x=>x[0]===dqAns):null; return a?a[1]:''; };
  const closestRows=()=>{ const L=closestBase(), id=dqId(); if(!id) return L;
    const at=L.findIndex(r=>r.kind==='tid'&&String(r.id)===id); return at>0?[L[at]].concat(L.slice(0,at),L.slice(at+1)):L; };
  const closestHtml=()=>{ const id=dqId(); const b=id?{ kind:'tid', id }:o.best;
    return closestRows().map(r=>pickRow(r, !!(b&&b.kind===r.kind&&String(b.id)===String(r.id)), true)).join(''); };
  /* the question's row, and "No paper is called …" where none is (the words as asked) */
  const dqHtml=()=>{ const P=dqPair(); if(!P) return '';
    const party=String((o.words&&o.words.who)||'').trim();
    return `<div class="na-dq" id="na-dq"><span class="na-dq-q">${esc(i18t(P.q+(party?'':'_none'),{ party }))}</span><span class="na-seg" role="group">${P.a.map(([k])=>
      `<button type="button" class="na-seg-b" data-na-dq="${esc(k)}" aria-pressed="${dqAns===k}">${esc(i18t('na_dq_'+k))}</button>`).join('')}</span></div>`; };
  const naNoneCalled=()=>{ const w=String((o.words&&o.words.what)||'').replace(/^(?:an?|the|en|ett)\s+/i,'').replace(/\s+(?:agreement|contract|avtal|avtalet|kontrakt)$/i,'').trim(); if(!w) return '';
    const lw=w.toLowerCase(); return rows().some(r=>String(r.name||'').toLowerCase().includes(lw))?'':w; };
  /* FROM YOUR WORDS: the sentence, what was read from it without AI (What is
     the closest paper's own title, With the party it names — amber where
     Parties has none of that name yet), Change the ask, and the form's own Find
     as Jambo's one spend on this screen, its cost on the button. #dr-say keeps
     the sentence, hidden, so that press reads it as Find always has. */
  /* WHAT THE PRESSES COST, said in Jambo calls (owner, 18 Oct 2026: costs stay
     in calls, never money, no price per call) */
  /* ---- FROM SCRATCH (the new look, round 6; the owner's pick: the new-paper grant only, admins included) ----
     A paper nobody has yet, built in front of the reader: the parties and the term from the words (free), the
     company's own clause library as "your standard" (free, its preferred wording), and what neither covers —
     proposed by Jambo (one call, the outline) and each section written by him on Draft the paper (one call each,
     said first). Every line can be unticked. Nothing is created until Create, which hands the assembled paper to the
     one creator a dropped file goes through (pdDropTake), filed in the stream chosen. */
  const naScratchOk=one&&typeof newLookOn==='function'&&newLookOn()&&(typeof mayMakeNewPaper!=='function'||mayMakeNewPaper());
  const scr={ secs:null, busy:'', drafted:false, err:'', proposed:false };
  const naScratchSecs=()=>{ if(scr.secs) return scr.secs;
    const w=o.words||{}, who=String(w.who||'').trim(), ours=(typeof window.FIRST_PARTY==='string'&&window.FIRST_PARTY)||'';
    const L=[{ k:'parties', h:i18t('nsc_h_parties'), src:'said', text:who?i18t('nsc_parties',{ a:ours, b:who }):'', sub:who?i18t('nsc_sub_parties',{ a:ours.split(/\s+/)[0], b:who }):i18t('nsc_sub_who'), on:true }];
    const lib=(typeof clauseLibrary==='function')?(clauseLibrary()||[]):[];
    lib.filter(c=>c&&c.category&&String(c.preferred||'').trim()).forEach(c=>L.push({ k:'lib:'+c.id, h:String(c.category), src:'std', text:String(c.preferred), sub:String(c.name||'').toLowerCase()+' \u00b7 '+i18t('nsc_your_std'), on:true }));
    const term=facts.find(f=>f.k==='term'&&f.months);
    if(term) L.push({ k:'term', h:i18t('nsc_h_term'), src:'said', text:i18t('nsc_term',{ n:term.months }), sub:String(term.say||'')+' \u00b7 '+i18t('nsc_from_said'), on:true });
    scr.secs=L; return L; };
  const naScratchTitle=()=>{ const w=String((o.words&&o.words.what)||'').replace(/^(?:an?|the|en|ett)\s+/i,'').trim(); return w?naCap(w):i18t('nsc_untitled'); };
  const naScratchAi=()=>naScratchSecs().filter(x=>x.on&&x.src==='ai'&&!x.text);
  const naScratchListHtml=()=>{ const L=naScratchSecs(), std=L.filter(x=>x.src==='std').length, ai=L.filter(x=>x.src==='ai').length, said=L.filter(x=>x.src==='said').length;
    const pill=x=>x.src==='ai'?(x.text?`<span class="nsc-pill is-ai">${esc(i18t('nsc_pill_ai_done'))}</span>`:`<span class="nsc-pill is-ai">${esc(i18t('nsc_pill_ai'))}</span>`)
      :x.src==='std'?`<span class="nsc-pill is-std">${esc(i18t('nsc_pill_std'))}</span>`:`<span class="nsc-pill">${esc(i18t('nsc_pill_said'))}</span>`;
    return `<div class="nsc-cap">${esc(i18t('nsc_goes_in'))}</div><div class="nsc-sum">${esc(i18tn('nsc_sum',L.length,{ n:L.length, s:std, a:ai, w:said }))}</div>
      ${L.map((x,i)=>`<label class="nsc-row"><input type="checkbox" data-nsc-on="${i}"${x.on?' checked':''}><span class="nsc-t"><b>${esc(x.h)}</b><span>${esc(x.err||x.sub||x.intent||'')}</span></span>${pill(x)}</label>`).join('')}
      ${scr.proposed?'':`<div class="nsc-more"><button type="button" class="ui-link" data-nsc-propose${scr.busy?' disabled':''}>${esc(i18t('nsc_propose'))}</button> <span>${esc(i18t('nsc_one_call'))}</span></div>`}`; };
  const naScratchPaperHtml=()=>{ const who=String((o.words&&o.words.who)||'').trim(), ours=(typeof window.FIRST_PARTY==='string'&&window.FIRST_PARTY)||'';
    const kicker=[typeof jxName==='function'?jxName():'', naScratchTitle()].filter(Boolean).join(' \u00b7 ').toUpperCase();
    const head=`<div class="nsc-kick">${esc(kicker)}</div><h3 class="nsc-title">${esc(naScratchTitle())}</h3><div class="nsc-between">${esc(who?i18t('nsc_between',{ a:ours, b:who }):ours)}</div>`;
    if(!scr.drafted) return `<div class="nsc-sheet">${head}<div class="nsc-empty">${scr.busy?(typeof busyHtml==='function'?busyHtml(scr.busy):esc(scr.busy)):esc(i18t('nsc_empty'))}</div></div>`;
    const L=naScratchSecs().filter(x=>x.on);
    return `<div class="nsc-sheet">${head}${L.map((x,i)=>`<div class="nsc-sec"><b>${i+1}. ${esc(x.h)}</b> <span class="nsc-from">${esc(x.src==='ai'?i18t('nsc_from_ai'):x.src==='std'?i18t('nsc_from_std'):i18t('nsc_from_said'))}</span><p>${x.text?esc(x.text):`<span class="nsc-owed">${esc(x.err||i18t('nsc_not_written'))}</span>`}</p></div>`).join('')}</div>`; };
  const naScratchHtml=()=>naScratchOk?`<section class="na-field na-scratch" id="na-scratch"><div class="nsc-left" id="nsc-left"></div><div class="nsc-right" id="nsc-right"></div></section>`:'';
  const naScratchPaint=()=>{ const l=document.getElementById('nsc-left'), r=document.getElementById('nsc-right'); if(!l||!r) return;
    l.innerHTML=naScratchListHtml(); r.innerHTML=naScratchPaperHtml();
    if(typeof renderIntelDock==='function') try{ renderIntelDock(); }catch(_){ } };
  const naScratchStds=()=>{ let pb={}; try{ pb=(typeof playbook==='function'&&playbook())||{}; }catch(_){ pb={}; }
    const d=pb._default||{}; return (d.ranges||[]).map(r=>({ category:r.label, rule:String(r.note||'') })).concat((d.positions||[]).map(p=>({ category:p.category, rule:String(p.note||'') }))); };
  const naScratchPropose=async()=>{ if(scr.busy||scr.proposed) return;
    scr.busy=i18t('nsc_busy_propose'); naScratchPaint();
    try{ const d=await window.api('ai/outline','POST',{ sentence:asked||naScratchTitle(), kind:'', required:naScratchSecs().map(x=>x.h) });
      const have=new Set(naScratchSecs().map(x=>x.h.toLowerCase()));
      (d&&d.sections||[]).filter(x=>x&&x.heading&&!have.has(String(x.heading).toLowerCase())).forEach(x=>scr.secs.push({ k:'ai:'+x.heading, h:x.heading, src:'ai', text:'', intent:x.intent||'', sub:x.intent||'', on:!x.optional }));
      scr.proposed=true; scr.err='';
    }catch(e){ scr.err=String((e&&e.message)||e); if(typeof toast==='function') toast(scr.err,'err'); }
    scr.busy=''; naScratchPaint(); light(); };
  const naScratchDraft=async()=>{ if(scr.busy) return;
    const todo=naScratchAi(); const stds=naScratchStds();
    for(let i=0;i<todo.length;i++){ const x=todo[i]; scr.busy=i18t('nsc_busy_draft',{ k:i+1, n:todo.length, h:x.h }); naScratchPaint();
      try{ const d=await window.api('ai/section','POST',{ sentence:asked||naScratchTitle(), heading:x.h, intent:x.intent||'', standards:stds }); x.text=String((d&&d.text)||''); x.err=''; }
      catch(e){ x.err=i18t('nsc_not_written_why',{ why:String((e&&e.message)||e) }); } }
    scr.busy=''; scr.drafted=true; naScratchPaint(); light(); };
  /* what the panel beside says while From scratch is up (paperdesk's sheet face) */
  const naScratchSays=()=>{ const L=naScratchSecs(), std=L.filter(x=>x.on&&x.src==='std').length, said=L.filter(x=>x.on&&x.src==='said').length, ai=naScratchAi().length, aiAll=L.filter(x=>x.on&&x.src==='ai').length;
    const w=o.words||{};
    return { scratch:true, std, said, ai, aiAll, drafted:scr.drafted, busy:!!scr.busy, proposed:scr.proposed, stream:streamPicked&&typeof FOLDERS==='object'&&FOLDERS[streamPicked]?FOLDERS[streamPicked].name:'',
      who:String(w.who||'').trim(), what:naScratchTitle(), facts:facts.map(f=>({ k:f.k, say:f.say })) }; };
  const naFillCost=()=>i18t('na_words_cost');
  const naReadCost=()=>i18t('na_file_read');
  const naCap=t=>{ const x=String(t||'').trim(); return x?x.charAt(0).toUpperCase()+x.slice(1):''; };
  /* THE ASK BOX AND ITS TWO TABS (the Legora way): the words as said, editable; the
     arrow (or Enter) reads them again, still without AI (naReask); the tabs are
     whose paper it is */
  const naAskHtml=()=>`<section class="na-field na-ask" id="na-words">
      <div class="na-ask-top"><div class="na-ptabs" role="tablist" aria-label="${esc(i18t('na_ptabs'))}">${['ours','theirs'].concat(naScratchOk?['scratch']:[]).map(k=>
        `<button type="button" role="tab" class="na-ptab" data-na-paper="${k}" aria-selected="${paper===k}">${esc(i18t('na_tab_'+k))}</button>`).join('')}</div>
        <span class="na-ask-r"><span class="na-hint">${esc(i18t('na_ask_noai'))}</span><button type="button" id="dr-read" class="ui-link na-fill"${ready?'':` disabled title="${esc(i18t('dr_no_ai'))}"`}>${icon('sparkle','w-3.5 h-3.5')} ${esc(i18t(asked?'na_words_fill_rest':'na_words_fill'))} <em id="na-w-cost">· ${esc(naFillCost())}</em></button></span></div>
      <div class="na-askbox"><textarea id="dr-say" class="na-say" rows="1" maxlength="${(typeof DRAFT_SENTENCE_MAX==='number')?DRAFT_SENTENCE_MAX:2000}" placeholder="${esc(i18t('na_say_ph'))}" autocomplete="off" aria-label="${esc(i18t('na_say_ph'))}">${esc(asked)}</textarea>
        ${typeof jamboSendHtml==='function'?jamboSendHtml('id="na-reask"', i18t('na_ask_go')):`<button type="button" id="na-reask" class="ui-btn ui-btn-sm">${esc(i18t('na_ask_go'))}</button>`}</div></section>`;
  /* WHAT I READ FROM YOUR WORDS: each fact, what it says and the words it came from
     (the Legora way: every fact shows where it was read). With, the kind and what it
     is for are the old readings (caDraftWith, caDraftKindOf, caDraftForOf); the rest
     the free reader's (draftWordsRead). Jambo's fill stays one press, its cost on it. */
  const naQuoteOf=v=>{ const t=String(v||'').trim(); if(!t||!asked) return ''; const at=asked.toLowerCase().indexOf(t.toLowerCase()); return at<0?'':asked.slice(at, at+t.length); };
  const naReadRows=()=>{ const w=o.words||{}, L=[];
    const who=String(w.who||'').trim(), what=String(w.what||'').trim(), purpose=String(w.purpose||'').trim();
    if(who) L.push({ k:'with', t:i18t('na_rd_k_with'), say:who, quote:naQuoteOf(who), owed:!w.known });
    /* the kind as asked, without its article ("A two-year supply agreement" → "Two-year supply agreement") */
    if(what){ const bare=what.replace(/^(?:an?|the|en|ett)\s+/i,''); L.push({ k:'kind', t:i18t('na_rd_k_kind'), say:naCap(bare), quote:naQuoteOf(bare)||naQuoteOf(bare.split(/\s+/).slice(-2).join(' ')) }); }
    facts.forEach(f=>L.push({ k:f.k, t:i18t('na_rd_k_'+f.k), say:f.say, quote:f.quote }));
    if(purpose) L.push({ k:'for', t:i18t('na_rd_k_for'), say:naCap(purpose), quote:naQuoteOf(purpose) });
    return L; };
  const naQuoteHtml=q=>q?`<span class="na-q1">“<mark>${esc(q)}</mark>”</span>`:`<span class="na-src-m">${esc(i18t('na_rd_from_words'))}</span>`;
  const naReadHtml=()=>{ const L=naReadRows(); if(!L.length) return '';
    return `<section class="na-field na-read" id="na-read"><div class="na-read-h"><b>${esc(i18t('na_rd_head'))}</b></div>
      <div class="na-kt" role="table"><div class="na-kt-h" role="row"><span role="columnheader">${esc(i18t('na_kt_term'))}</span><span role="columnheader">${esc(i18t('na_kt_says'))}</span><span role="columnheader">${esc(i18t('na_kt_where_words'))}</span></div>
      ${L.map(x=>`<div class="na-kt-r" role="row" data-na-rd="${esc(x.k)}"><span>${esc(x.t)}</span><span>${x.owed?`${esc(x.say)} <small class="na-new">${esc(i18t('na_words_new_party'))}</small>`:esc(x.say)}</span><span>${naQuoteHtml(x.quote)}</span></div>`).join('')}</div></section>`; };
  /* THEIR PAPER: the drop zone, read by the drop's own reader (pdDropTake → uploadFromDrop) at Create */
  const naTheirsHtml=()=>`<section class="na-field na-theirs" id="na-theirs" hidden>
      <div class="na-drop" id="na-drop" data-na-drop><span class="na-drop-ic" aria-hidden="true">${icon('import','w-5 h-5')}</span>
        <b>${esc(i18t('na_theirs_drop'))} <button type="button" class="ui-link" id="na-theirs-pick">${esc(i18t('na_theirs_choose'))}</button></b>
        <span class="na-hint">${esc(i18t('na_theirs_sub'))}</span><span class="na-theirs-file" id="na-theirs-file" hidden></span></div>
      <input type="file" id="na-theirs-input" hidden tabindex="-1" aria-hidden="true" accept="${esc((typeof PD_DROP_ACCEPT==='string'&&PD_DROP_ACCEPT)||'.docx,.pdf,.doc,.txt')}"></section>`;
  /* ---- THE SEARCH LIST (the owner picked it by name, 12 Oct 2026, from One
     field · Search list · Shelf first · The SAP way) ----
     The rail has its OWN search, which reads template NAMES only — the
     sentence above is Jambo's and filters nothing (typing "agreement" there
     used to match every standard and narrow nothing). Three tabs, one per
     shelf, each with its count; a shelf with nothing on it is not drawn. One
     scroll: the page's. The line of business moved to Settings → Company,
     and "Import many at once" left — import has its own door. */
  const NA_TABS=[['lib','na_tab_company'],['mine','na_tab_saved'],['tid','na_tab_hati']];
  let tab=null;
  const tabNow=()=>{ const all=rows(); const has=k=>all.some(r=>r.kind===k);
    if(!tab||!has(tab)) tab=(sel&&has(sel.kind)&&sel.kind)||(NA_TABS.find(([k])=>has(k))||['lib'])[0];
    return tab; };
  const listsHtml=q=>{
    const all=rows(), t=tabNow(), qq=String(q||'').trim().toLowerCase();
    const tabs=NA_TABS.filter(([k])=>all.some(r=>r.kind===k));
    const shown=all.filter(r=>r.kind===t && (!qq || String(r.name||'').toLowerCase().includes(qq)));
    return `${tabs.length>1?`<div class="na-tabs" role="tablist" aria-label="${esc(i18t('na_tabs'))}">${tabs.map(([k,w])=>
        `<button type="button" role="tab" class="na-tab" data-na-tab="${k}" aria-selected="${k===t}">${esc(i18t(w))} (${all.filter(r=>r.kind===k).length})</button>`).join('')}</div>`:''}
      <div class="na-rows">${shown.map(r=>pickRow(r)).join('')||`<p class="na-none">${esc(i18t('na_no_name'))}</p>`}</div>`;
  };
  /* THE QUESTIONS CARD — one string, placed once, beside the rail. */
  const naCard=`<div class="na-card" id="na-card">
        <div class="na-card-h"><h3 id="na-card-name"></h3><span class="na-card-sub" id="na-card-sub"></span>${one?`<button type="button" class="ui-link" id="na-change-paper">${esc(i18t('na_change_paper'))}</button><span class="na-grow"></span><span class="na-card-count" id="na-card-count"></span>`:''}</div>
        <div class="na-card-b"><div id="na-form"><div class="na-empty"><b>${esc(i18t('na_pick_hint'))}</b>${esc(i18t('na_pick_hint_sub'))}</div></div>
          ${one?'':`<div class="na-note">${i18t('na_note')}</div>`}
          ${/* ---- WHO ELSE IS ON THIS AGREEMENT (Young ruled 21 Sep 2026) ----
               SHUT BY DEFAULT and under the questions, because it is an offer
               and not a question: a draft is made without it every day. The
               rows are the Overview's own builder, so the two doors cannot
               disagree about what a role means, and nobody is emailed by
               anything on this screen — an invitation goes with the first
               send, which is the door that has always carried a link. */''}
          <details id="na-people" class="na-people">
            <summary>${i18t('ppl_title')}${one?`<span class="na-hint na-people-sub"> · ${esc(i18t('ppl_sub_short'))}</span>`:''}<span class="na-people-n" id="na-people-n"></span></summary>
            <p class="na-people-s">${i18t('ppl_sub')}</p>
            <div id="na-people-list"></div>
          </details></div>
      </div>`;
  openModal(`<div id="na-root" class="na-root${one?' na-one':''}">
    <div class="na-head"><div><h3>${i18t('na_title')}${one?` <small class="na-not-yet">${esc(i18t('na_not_yet_inline'))}</small>`:''}</h3>${one?'':`<div class="na-sub">`}${
      /* WHERE THE ANSWERS CAME FROM (step 3): opened from Jambo's New
         agreement card, the line under the title says what was asked */
      one?'':o.asked?esc(i18t('na_sub_asked',{ask:String(o.asked).slice(0,(typeof DRAFT_SENTENCE_MAX==='number')?DRAFT_SENTENCE_MAX:2000)}))
      /* FROM A PARTY (round 19's "Draft an agreement with Nordvik"): the party it carries is said */
      :(o.prefill&&String(o.prefill.counterparty||'').trim())?esc(i18t('na_sub_with',{party:String(o.prefill.counterparty).trim()})):i18t('na_sub')}${one?'':'</div>'}</div>
      <button type="button" id="na-x" class="na-x" aria-label="${esc(i18t('act_cancel'))}" title="${esc(i18t('act_cancel'))}">${icon('x','w-4 h-4')}</button></div>
    <div id="na-body" class="na-body">
      ${''/* THE ASK TAKES THE WHOLE TOP LINE (Young, 22-23 Sep 2026: "the
             describe what you need maybe takes the whole top line"). It was
             the first thing in a 260px rail, where the box was 182px wide —
             about five words a line — and Find was pushed underneath it. Out
             of the rail it spans both columns, so a sentence sits on one line
             with Find beside it, and it is the first thing on the screen,
             which is what it is: the one door that needs no browsing. The
             rail's own "Find drops under the box" rules stop applying by
             construction, because they are scoped to .na-rail. Every handler
             finds these by id, so nothing was rewired. */}
      ${one?naAskHtml():`<div class="na-field"><label for="dr-say">${i18t('na_describe')}</label>
        <div class="na-row">${''/* A TEXTAREA, BECAUSE THE ASK IS A SENTENCE (Young ruled 21 Sep 2026:
           "Describe what you need area should be able to wrap text"). A
           single-line input scrolls sideways and shows a reader the last
           eight words of what they typed. It keeps its id, its cap, its
           placeholder and its Enter (Enter presses Find; Shift+Enter is a
           newline), so nothing that reads #dr-say changed. */}
          <textarea id="dr-say" class="na-inp na-say" rows="2" maxlength="${(typeof DRAFT_SENTENCE_MAX==='number')?DRAFT_SENTENCE_MAX:2000}" placeholder="${esc(i18t('dr_ph'))}" autocomplete="off"></textarea>
          <button type="button" id="dr-read" class="ui-btn"${ready?'':` disabled title="${esc(i18t('dr_no_ai'))}"`}>${icon('sparkle','w-3.5 h-3.5')} ${i18t('na_find')}</button></div>
        <span class="na-hint">${ready?i18t('na_find_hint'):i18t('dr_no_ai')}</span></div>`}
      <div id="dr-out"></div>
      <div id="wz-pick" class="na-left na-rail">
        ${''/* THE LIST SCROLLS INSIDE THE RAIL, so a workspace with forty
               standards on the shelf does not drive the height of the whole
               pop-up. MEASURED at the parent: the frame was already at its
               own ceiling (88vh) and opening the people panel pushed the body
               into scrolling at every window height tried. */}
        ${one?`<div class="na-step"><b>${esc(i18t(naMost?'na_most_h':'na_close_h'))}</b>${(dqPair()&&naNoneCalled())?`<span class="na-hint">${esc(i18t('na_dq_none_called',{ w:naNoneCalled() }))}</span>`:''}
          <span class="na-more na-one-more"><button type="button" class="ui-link" id="na-all" aria-expanded="false">${esc(i18t('na_all_paper',{n:rows().length}))}</button><span>· ${esc(i18t('na_none_fits'))}</span>${typeof openIntakeForm==='function'?`<button type="button" class="ui-link" id="na-legal">${esc(i18t(naNoTeam()?'na_ask_admin_choose':'na_ask_legal'))}</button>`:''}</span></div>
        ${dqHtml()}<div class="na-closest" id="na-closest" role="radiogroup" aria-label="${esc(i18t('na_start'))}">${closestHtml()}</div>
        <div id="na-search" hidden>`:''}
        <input id="na-q" class="na-inp na-q" type="search" autocomplete="off" placeholder="${esc(i18t('na_q_ph'))}" aria-label="${esc(i18t('na_q_ph'))}">
        <div id="na-lists" class="na-picks">${listsHtml('')}</div>${one?'</div>':''}
        ${''/* THE BACK-CATALOGUE'S WAY IN, kept. "Upload it" and its lead
               "Received a contract instead?" are GONE (Young ruled 23 Sep 2026:
               "remove the Upload it link") — upload is its own door in front of
               this screen now (openNewDoors), and a second way to one dialog is
               two doors. na_upload / na_received are inert in both books. */}
      </div>
      ${one?naReadHtml()+naTheirsHtml()+naScratchHtml():''}
      ${naCard}
      ${one?`<section class="na-field na-file" id="na-file">
        <div class="na-file-b"><span class="na-file-l">${esc(i18t('na_filed_in'))}</span><div class="na-seg" id="na-file-seg" role="group" aria-label="${esc(i18t('na_filed_in'))}"></div><span class="na-need" id="na-file-need">${esc(i18t('na_file_need'))}</span></div>
        <p class="na-hint na-file-cost" id="na-file-cost">${esc(ready?naReadCost():i18t('na_file_read_noai'))}</p></section>`:''}
    </div>
    ${''/* ONE FOOTER ORDER (the Compact ladder, 26 Sep 2026 — rule 8 of the
           button review): the buttons sit together at the right, Cancel
           first and the main act last, as in every other dialog. Cancel was
           a bare word alone at the far left. */}
    <div class="na-foot">
      <span class="na-grow"></span>
      ${one?`<span class="na-why" id="na-why" aria-live="polite"></span>`:''}
      <button data-dlg-cancel type="button" id="wz-pick-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      ${''/* ONE SHEET, AS DRAWN (the gaps, round 4, 18 Oct 2026): Create draft and Cancel
             only — the questions are the sheet's own step 2, so "Skip the questions"
             is not offered there; every other door keeps it */}
      ${one?'':`<button type="button" id="na-skip" class="ui-btn" disabled title="${esc(i18t('na_pick_first'))}" data-title-on="${esc(i18t('lib_create_now_fill_later'))}">${i18t('na_skip')}</button>`}
      <button type="button" id="na-create" class="ui-btn ui-btn-primary" disabled title="${esc(i18t('na_pick_first'))}">${i18t('tl_create_draft')}</button>
    </div></div>`, { maxWidth: NA_FRAME_NARROW_W+'px', label: i18t('na_title'),
      /* A PAGE, NOT A POP-UP (SAP pop-ups, owner's go 10 Oct 2026): the
         picker, the ask and the template's questions fill the work area,
         Create draft, Skip and Cancel at the top. See dlgPageAdopt. The
         crumb names where it was opened from: Our paper's "Draft from it"
         reads "Our paper › New agreement" (round 21; check #2, 19 Oct 2026),
         and a page that hands its name (Requests' "Start the draft", round 20)
         is the crumb's way back, "‹ Requests". The one sheet is opened from
         Jambo's words on Home only, so its crumb stays Contracts. */
      page:one?{ acts:['na-why','na-create','wz-pick-cancel'],
          /* ON THE DESK, BESIDE JAMBO (the gaps, round 4): THE WAY BACK IS THE APP'S
             (the SAP bar, 18 Oct 2026: "‹ · HA · the page's name", no row between the
             bar and the page) — the bar names this sheet "New agreement" and its ‹
             takes the reader back to the page they asked from, asking first as Cancel
             does (deskPageName, deskGoBack → naSheetBack); the sheet draws no crumb of
             its own. Without the desk's bar the crumb stays words. */
          ...((typeof deskShellOn==='function'&&deskShellOn())
            ? {}
            : { crumb:`${i18t('nav_contracts')} › ${i18t('na_title')}` }),
          beside:'#ig-dock' }
        /* EVERY DOOR STANDS BESIDE JAMBO TOO (owner, 19 Oct 2026: the form opened
           from a button had no Jambo panel, unlike the drawn sheet): where his
           panel is up at the right edge the page ends at it; elsewhere nothing moves */
        : { acts:['na-create','na-skip','wz-pick-cancel'], crumb:`${i18t((fromView==='templates'||fromView==='playbook')?'nav_tpl_std':'nav_contracts')} › ${i18t('na_title')}`, back:o.backLabel||'', beside:'#ig-dock' },
      /* ESCAPE AND THE SCRIM ASK TOO (9 Oct 2026) — see naAskLeave below. */
      onBeforeClose: ()=>naAskLeave() });
  /* A STAGE WITHOUT REAL ELEMENTS (a sandbox that only records the markup)
     stops here: the markup is the whole of what it can read. */
  const root=document.getElementById('na-root');
  if(!root || typeof root.querySelector!=='function') return;
  const lists=()=>document.getElementById('na-lists');
  /* ---- THE CHOICES SIT IN A CARD THAT SCROLLS (owner, 13 Oct 2026: "the
     choices need to be in a scrolling card and not bare") ----
     The rows are a white card under the tabs; the card ends just above the
     window's foot, measured from where it starts, so the whole list is one
     card the reader scrolls inside and the page itself does not run on. */
  /* ---- AS TALL AS THE CARD BESIDE IT (owner, 13 Oct 2026: "the card
     highlighted should be the same height as the card on the right") ----
     Where the questions' card stands beside the rail, the choices' card ends
     level with its foot and scrolls inside; where it does not (the rail
     stacked above it), the card ends above the window's foot as before. */
  const fitRows=()=>{ const l=lists(); const r=l&&l.lastElementChild; if(!r||!r.getBoundingClientRect) return;
    const rr=r.getBoundingClientRect(), top=rr.top;
    const card=document.getElementById('na-card'), cr=card&&card.getBoundingClientRect?card.getBoundingClientRect():null;
    if(cr && cr.height && cr.left>=rr.right-1){
      r.style.maxHeight='none';
      r.style.height=Math.max(NA_ROWS_MIN_H, Math.round(cr.bottom-top))+'px';
      return; }
    r.style.height='';
    r.style.maxHeight=Math.max(NA_ROWS_MIN_H, Math.round((window.innerHeight||800)-top-NA_ROWS_FOOT))+'px'; };
  const paintLists=()=>{ const l=lists(); if(!l) return;
    const q=(document.getElementById('na-q')||{}).value||'';
    l.innerHTML=listsHtml(q);
    fitRows();
  };
  fitRows();
  /* a stage with no real window (a sandbox) has nothing to listen to */
  if(typeof window.addEventListener==='function'){
    const onResize=()=>{ if(!root.isConnected){ window.removeEventListener('resize',onResize); return; } fitRows(); };
    window.addEventListener('resize',onResize);
  }
  /* the questions' card grows with the template picked: the choices follow */
  try{ const card=document.getElementById('na-card');
    if(card && typeof ResizeObserver==='function'){ const ro=new ResizeObserver(()=>{ if(!root.isConnected){ ro.disconnect(); return; } fitRows(); }); ro.observe(card); } }catch(_){}
  const light=()=>{ root.querySelectorAll('.na-pick.on').forEach(b=>b.classList.remove('on'));
    if(sel) root.querySelectorAll(`[data-wz-${sel.kind}="${String(sel.id).replace(/["\\]/g,'\\$&')}"]`).forEach(b=>b.classList.add('on'));
    root.querySelectorAll('.na-close').forEach(b=>b.setAttribute('aria-checked', String(b.classList.contains('on'))));
    if(one) naFilePaint();
    /* THE ACTS WAKE ON A PICK: Create draft and Skip stay grey, saying why,
       until a template is chosen (they may have moved to the page head). */
    /* AND A STREAM (the overnight work order, step 3: "Create greyed with its
       reason until a template and a stream are chosen"): the form's own
       stream box — the one select that carries folderOptionsHtml's "new
       stream" choice — must hold a stream. It starts on the template's own
       stream, so a pick usually brings one; a box left on nothing greys
       Create and says so. (The new-stream choice is not "nothing": its own
       prompt puts the new stream in the box, or the last one back, without
       a change event — counting it as empty would leave Create grey.) */
    const sb=api?naStreamBox(document.getElementById('na-form')):null;
    /* the new-stream choice is not a stream until its prompt puts one in the
       box (naStreamAsk watches the prompt go, then asks this again) */
    const noStream=!!sb&&(!sb.value||sb.value==='__new__');
    /* OWED HERE, SO AMBER HERE (owner, 20 Oct 2026: "value stream is
       mandatory but it does not come shaded"): Create waits on this box, so
       it wears the owed boxes' amber and star while it holds no stream —
       this form only; elsewhere the stream stays NEED_NEVER */
    if(sb){ sb.setAttribute('data-need','1'); sb.classList.toggle('need-empty', noStream);
      const lab=sb.closest('label'), cap=lab&&lab.querySelector('span');
      if(cap&&!cap.querySelector('[data-na-req]')) cap.insertAdjacentHTML('beforeend',' <span data-na-req style="color:var(--st-ruby-fg)">*</span>'); }
    let on=!!api&&!noStream;
    let why=!api?i18t('na_pick_first'):i18t('na_stream_first');
    /* THEIR PAPER: Create needs their file and a stream (the drop's own two) */
    if(one&&paper==='theirs'){ on=!!theirFile&&!!streamPicked; why=!theirFile?i18t('na_theirs_need'):i18t('na_stream_first'); }
    if(one&&paper==='scratch'){ on=scr.drafted&&!scr.busy&&!!streamPicked; why=!scr.drafted?i18t('nsc_draft_first'):i18t('na_stream_first'); }
    if(one){ root.setAttribute('data-paper',paper); root.querySelectorAll('[data-na-paper]').forEach(b=>b.setAttribute('aria-selected',String(b.getAttribute('data-na-paper')===paper)));
      const th=document.getElementById('na-theirs'); if(th) th.hidden=paper!=='theirs'; }
    ['na-create','na-skip'].forEach(id=>{ const b=document.getElementById(id); if(!b) return;
      b.disabled=!on; b.title=on?(b.getAttribute('data-title-on')||''):why; });
    /* their paper is created as theirs, not drafted (as drawn: "Create") — never while the press turns */
    if(one){ const cb=document.getElementById('na-create'); if(cb&&!cb.querySelector('.ob-spin')) cb.textContent=i18t(paper==='theirs'||paper==='scratch'?'act_create':'tl_create_draft'); }
    /* as drawn, the reason is said beside Create, not only on its hover */
    const wy=document.getElementById('na-why'); if(wy) wy.textContent=on?'':String(why).replace(/\.\s*$/,'');
    naForPaint(); };
  /* WHAT IT IS FOR, mirrored from the paper's own question while it is answered (never read without AI) */
  const naForPaint=()=>{ const el=document.getElementById('na-w-for'); if(!el) return;
    const host=document.getElementById('na-form');
    const box=host?[...host.querySelectorAll(NA_CARRY_SEL)].find(x=>naCarryKey(x.id)==='purpose'):null;
    const v=(box?String(box.value||'').trim():'')||String((o.words&&o.words.purpose)||'').trim();
    el.textContent=v?naCap(v):i18t('na_words_unread'); el.classList.toggle('is-said', !!v); };
  /* THE CARD IS THE CHOSEN DOOR'S OWN FORM. Every branch returns the acts the
     foot presses; the head prints the version where there is one and how
     many boxes were drawn. */
  /* THE CARD'S LABELS ARE THE ARTIFACT'S FIELD LABELS — 12px, label weight,
     the quiet ink — and carry no "→ where it is filed" arrow (the pop-up diet
     of 13 Sep names those arrows stale; the box was 380px wide when this
     was written and the arrow made every label two lines). The three host forms draw their
     labels through HATI_LBL-style inline declarations, which is the product's
     rule for a field label, so the card RE-DRESSES them after the mount
     rather than growing a fourth label renderer: one renderer per door, one
     dress per frame. The arrow's words survive on the label's hover. */
  const dress=host=>{
    /* the who-pays field is a group, not a label (its three presses are buttons): its head is dressed the same */
    host.querySelectorAll('label > span:first-child, .pw-field > span:first-child').forEach(sp=>{
      const arrow=sp.querySelector('span'); const star=sp.querySelector('span[style*="ruby"]');
      if(arrow && arrow!==star){ const t=arrow.textContent.replace(/^\s*→\s*/,'').trim(); if(t && !sp.title) sp.title=t; arrow.remove(); }
      sp.style.cssText='display:block;font-size:var(--t-label);font-weight:var(--w-label);color:var(--color-neutral-600);margin-bottom:4px;font-family:var(--font-body);letter-spacing:0;text-transform:none';
    });
  };
  /* ---- THE STREAM IS ASKED, NOT TAKEN, WHEN JAMBO OPENS THE FORM (the fix
     round, 15 Oct 2026; the work order's step 3 and its demo: "Create greyed
     with its reason until a template and a stream are chosen") ----
     Opened from Jambo's cards (o.streamAsk), the stream box starts on none —
     a "Choose a stream" line no press can choose — so Create stays grey with
     "Choose a stream first." until the person picks one; a stream they chose
     goes with them to the next template they try. The other doors keep the
     template's own stream, as before. bindFolderSelect remembers the box's
     last value for a cancelled "+ New value stream", so the box is told of
     its new value the way a press tells it (a change event). */
  let streamPicked='';
  const naStreamAsk=host=>{
    if(!o.streamAsk) return;
    const sb=naStreamBox(host); if(!sb) return;
    const has=v=>[...sb.options].some(x=>x.value===v);
    if(!(streamPicked && has(streamPicked))){
      if(!sb.querySelector('option[data-na-ask]')){
        const ph=document.createElement('option'); ph.value=''; ph.disabled=true; ph.setAttribute('data-na-ask','');
        ph.textContent=i18t('na_stream_choose'); sb.insertBefore(ph, sb.firstChild); }
    }
    sb.value=(streamPicked && has(streamPicked))?streamPicked:'';
    try{ sb.dispatchEvent(new Event('change',{ bubbles:true })); }catch(_){}
  };
  /* STEP 3 ON THE SHEET: the stream as buttons — a MIRROR of the form's own
     stream box (naStreamBox, the one writer at Create): its options drawn as
     buttons, a press puts the box on that stream the way a person's choice
     does (a change event); before a paper is picked the choice waits and the
     box takes it when the form comes (streamPicked, naStreamAsk). A private
     stream wears its lock. The box itself is not drawn a second time. */
  const naFilePaint=()=>{
    const seg=document.getElementById('na-file-seg'); if(!seg) return;
    const sb=(api&&paper!=='theirs')?naStreamBox(document.getElementById('na-form')):null;
    /* the field's own inline display would win over a hidden attribute */
    if(sb){ const f=sb.closest('label')||sb.parentElement; if(f){ f.hidden=true; f.style.display='none'; } }
    const opts=sb?[...sb.options].filter(x=>x.value&&x.value!=='__new__'&&!x.disabled).map(x=>({ id:x.value, name:x.textContent.trim() }))
      :((typeof visibleFolders==='function'?visibleFolders():[])||[]).map(f=>({ id:f.id, name:f.name }));
    const now=sb?((sb.value&&sb.value!=='__new__')?sb.value:''):streamPicked;
    const lock=id=>(typeof streamIsPrivate==='function'&&streamIsPrivate(id))?icon('lock','na-lock'):'';
    /* AS DRAWN, THE STREAMS ALONE (the gaps, round 4: "Sales · Procurement · HR · Board"):
       a new stream is made where streams are kept (Settings · Contract streams), not here */
    seg.innerHTML=opts.map(x=>`<button type="button" class="na-seg-b" data-na-stream="${esc(x.id)}" aria-pressed="${x.id===now}">${lock(x.id)}${esc(x.name)}</button>`).join('');
    const need=document.getElementById('na-file-need'); if(need) need.hidden=!!now;
  };
  const pick=(kind,id,prefill)=>{
    const host=document.getElementById('na-form'); if(!host) return;
    /* WHAT WAS TYPED GOES WITH THE READER TO THE NEXT ROW (9 Oct 2026): the
       three doors' forms name their boxes by the same keys (counterparty,
       cpemail, value, the dates …), so an answer typed on one row lands in the
       same box on the next instead of being thrown away with the card. */
    naCarryRead(host, kept);
    /* NO PAPER HOST, SO NO PAPER. All three forms ask for one before they
       draw an agreement, so handing them null is the one line that takes it
       off this screen and leaves their own dialogs exactly as they were. */
    const hostOpts={ host, paperHost:null, root:document.getElementById('na-body') };
    sel={kind,id}; api=null; let name='', ver='', follow=0;
    if(tab!==kind){ tab=kind; paintLists(); }
    if(kind==='tid'){ api=wizardFormMount(hostOpts, id, prefill); const t=TEMPLATES[id]; name=t?t.kind:id; }
    else if(kind==='lib'){ const t=libOf().find(x=>x.id===id); name=t?t.name:id; ver='v'+((t&&t.publishedVersion)||1);
      follow=Number(t&&t.questionCount)||0;
      api=(typeof tplLibNewContract==='function')?tplLibNewContract(id, prefill, hostOpts):null; }
    else { const t=mineOf().find(x=>x.id===id); name=t?t.name:id; ver=t?verOf(t):'';
      api=(typeof createFromCustomTemplate==='function')?createFromCustomTemplate(id, prefill, hostOpts):null; }
    const nAll=api?api.count:0;
    dress(host);
    naCarryWrite(host, kept);
    naStreamAsk(host);
    const nm=document.getElementById('na-card-name'), sb=document.getElementById('na-card-sub');
    if(nm) nm.textContent=name;
    /* A COMPANY STANDARD'S BOXES HERE ARE THE ESSENTIALS, and its own
       questions follow on the Document tab — so the card says both rather
       than calling the essentials "questions" (9 Oct 2026). */
    /* AS DRAWN ON THE SHEET (the gaps, round 4): "6 questions · only Counterparty
       is needed now" — the boxes the form itself marks required, by their labels */
    const needed=one?naNeeded(host):[];
    /* the sheet asks the stream at step 3, so step 2 neither draws nor counts it */
    const n=(one&&naStreamBox(host))?Math.max(0,nAll-1):nAll;
    if(one){ naRowsLay(host); if(root.classList) root.classList.add('is-picked'); }
    if(one&&sb){ sb.textContent=[i18t(kind==='lib'?'na_shelf_lib':kind==='mine'?'na_shelf_mine':'na_shelf_tid'), ver].filter(Boolean).join(' · ');
      naCountPaint(host); }
    else if(sb) sb.textContent=`${ver&&!one?ver+' · ':''}${kind==='lib'
      ? i18tn('na_details', n, {n})+(follow?' · '+i18tn('na_tpl_q_follow', follow, {n:follow}):'')
      : i18tn('na_questions', n, {n})}${needed.length?' · '+i18tn('na_only_needed', needed.length, { names:needed.join(i18t('sa_and')) }):''}`;
    /* the Legora way says where a value came from in its own column, so the label carries no mark */
    if(!one) naFromWordsMark(host);
    light();
  };
  /* STEP 2 AS DRAWN (the gaps, round 4, 18 Oct 2026): three columns, who we are ·
     the counterparty · their email first, the rest in the paper's own order, and
     nothing standing alone on a row — the form's own boxes, moved, never redrawn
     (each keeps its id, so the form's acts read them as before). The grid's
     columns are the form's inline declaration, so they are written on it. */
  const naQuestionsLay=host=>{
    const grid=host.querySelector('.field-grid'); if(!grid) return;
    grid.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
    const lab=k=>{ const el=[...grid.querySelectorAll(NA_CARRY_SEL+',select[id]')].find(x=>naCarryKey(x.id)===k); return el?el.closest('label'):null; };
    const party=lab('party'), cp=lab('counterparty'), mail=lab('cpemail');
    [party, cp, mail].filter(Boolean).reverse().forEach(l=>{ if(l.parentElement===grid) grid.insertBefore(l, grid.firstChild); });
    grid.classList.add('na-three'); };
  /* ---- THE PAPER'S QUESTIONS AS ROWS (the Legora way, 24 Oct 2026) ----
     Term · What it says · Where it came from: the form's own boxes, MOVED into
     rows and never redrawn (each keeps its id, so the forms' acts read them as
     before), the term its label, the third column what filled the box — the
     words of your sentence quoted, "You typed it", the paper's own default, or
     amber "Not said yet" where a needed box is empty. */
  const NA_FACT_OF={ counterparty:'with', payDays:'pay', paymentDays:'pay', creditDays:'pay', noticeDays:'notice', value:'value', effDate:'start', expiry:'term', purpose:'for' };
  const naFactFor=k=>{ const fk=NA_FACT_OF[k]; if(!fk) return null;
    if(fk==='with'){ const who=String((o.words&&o.words.who)||'').trim(); return who?{ val:who, quote:naQuoteOf(who) }:null; }
    if(fk==='for'){ const p=String((o.words&&o.words.purpose)||'').trim(); return p?{ val:p, quote:naQuoteOf(p) }:null; }
    if(fk==='term'&&naExpiryAuto&&naTerm) return { val:naExpiryAuto, quote:naTerm.quote };
    const f=facts.find(x=>x.k===fk); return (f&&f.put&&f.put[k]!=null)?{ val:String(f.put[k]), quote:f.quote }:null; };
  /* HOW LONG IT RUNS, READ FROM THE WORDS, ENDS IT: the end date is the start the form holds plus the
     term, less a day, written only while the end box is empty or still holds that same reading */
  const naTerm=facts.find(f=>f.k==='term'&&f.months)||null;
  let naExpiryAuto='';
  const naTermFill=host=>{ if(!naTerm||!host) return;
    const box=k=>[...host.querySelectorAll(NA_CARRY_SEL)].find(x=>naCarryKey(x.id)===k);
    const st=box('effDate'), ex=box('expiry'); if(!st||!ex||!/^\d{4}-\d{2}-\d{2}$/.test(String(st.value||''))) return;
    if(ex.value&&ex.value!==naExpiryAuto) return;
    const d=new Date(st.value+'T00:00:00Z'); if(isNaN(d)) return;
    d.setUTCMonth(d.getUTCMonth()+naTerm.months); d.setUTCDate(d.getUTCDate()-1);
    naExpiryAuto=d.toISOString().slice(0,10); ex.value=naExpiryAuto; };
  const naRowsLay=host=>{
    const grid=host.querySelector('.field-grid'); if(!grid) return;
    naQuestionsLay(host);
    grid.classList.remove('na-three'); grid.classList.add('na-kt-grid');
    grid.style.removeProperty('display'); grid.style.removeProperty('grid-template-columns'); grid.style.removeProperty('gap');
    if(!grid.querySelector(':scope > .na-kt-h')) grid.insertAdjacentHTML('afterbegin', `<div class="na-kt-h" role="row"><span>${esc(i18t('na_kt_term'))}</span><span>${esc(i18t('na_kt_says'))}</span><span>${esc(i18t('na_kt_from'))}</span></div>`);
    [...grid.children].forEach(el=>{ if(el.classList.contains('na-kt-h')) return;
      el.classList.add('na-kt-r');
      const box=el.querySelector('input[id],select[id],textarea[id]');
      if(box&&!box.hasAttribute('data-na-drawn')) box.setAttribute('data-na-drawn', String(box.value||''));
      if(el.style.display==='block') el.style.removeProperty('display');
      const term=el.querySelector(':scope > span:first-child'); if(term) term.style.marginBottom='0';
      if(!el.querySelector(':scope > .na-src')) el.insertAdjacentHTML('beforeend','<span class="na-src" data-na-src></span>'); });
    naTermFill(host); naSrcPaint(host); };
  const naSrcPaint=host=>{
    (host||document).querySelectorAll('.na-kt-r').forEach(el=>{
      const src=el.querySelector(':scope > .na-src'); if(!src) return;
      const box=el.querySelector('input[id],select[id],textarea[id]');
      const pw=el.classList.contains('pw-field');
      const k=box?naCarryKey(box.id):'', v=box?String(box.value||'').trim():'', drawn=box?String(box.getAttribute('data-na-drawn')||'').trim():'';
      /* needed to Create (the label's star) is owed and counted; owed later (data-need, the details) is said, not counted */
      const need=!!el.querySelector('span[style*="ruby"]'), later=!!(box&&box.hasAttribute('data-need'));
      const f=naFactFor(k);
      let html='', owed=false;
      if(f&&v&&v===String(f.val).trim()) html=naQuoteHtml(f.quote);
      else if(v&&v!==drawn) html=`<span class="na-src-m">${esc(i18t(box&&box.tagName==='SELECT'?'na_src_picked':'na_src_typed'))}</span>`;
      else if(v||pw) html=`<span class="na-src-m">${esc(i18t('na_src_paper'))}</span>`;
      else if(need||later){ html=`<span class="na-src-need">${esc(i18t('na_src_not_said'))}</span>`; owed=true; }
      else html=`<span class="na-src-m">${esc(i18t('na_src_later'))}</span>`;
      if(src.innerHTML!==html) src.innerHTML=html;
      el.classList.toggle('is-owed', owed); }); };
  /* "7 details · all answered", or how many still to answer (the needed boxes still empty) */
  const naCountPaint=host=>{ const el=document.getElementById('na-card-count'); if(!el||!host) return;
    const rowsN=[...host.querySelectorAll('.na-kt-r')].filter(r=>!r.hidden&&r.style.display!=='none');
    const owed=rowsN.filter(r=>r.classList.contains('is-owed')).length;
    el.textContent=i18tn('na_details', rowsN.length, { n:rowsN.length })+' · '+(owed?i18tn('na_to_answer', owed, { n:owed }):i18t('na_all_answered')); };
  /* the boxes the paper's form marks required (the star its label carries, the one the dress keeps) */
  const naNeeded=host=>[...host.querySelectorAll('label > span:first-child')].filter(sp=>sp.querySelector('span[style*="ruby"]'))
    .map(sp=>{ const t=sp.cloneNode(true); t.querySelectorAll('span').forEach(x=>x.remove()); return t.textContent.replace(/\s*\*\s*$/,'').trim(); }).filter(Boolean);
  /* "✦ from your words": the counterparty box the sentence filled says so, until the reader changes it */
  const naFromWordsMark=host=>{ const who=String((o.words&&o.words.who)||'').trim(); if(!who) return;
    host.querySelectorAll(NA_CARRY_SEL).forEach(el=>{ if(naCarryKey(el.id)!=='counterparty') return;
      const sp=el.closest('label')&&el.closest('label').querySelector(':scope > span:first-child'); if(!sp) return;
      const mark=sp.querySelector('.na-from-words'), same=String(el.value||'').trim()===who;
      if(same&&!mark) sp.insertAdjacentHTML('beforeend', ` <span class="na-from-words">✦ ${esc(i18t('na_from_words'))}</span>`);
      else if(!same&&mark) mark.remove(); }); };
  root._naPick=pick;
  /* the stream box is the form's; a change to it wakes or greys Create (light) */
  document.getElementById('na-form')?.addEventListener('change',e=>{
    const sb=naStreamBox(document.getElementById('na-form')); if(!e.target||e.target!==sb) return;
    if(sb.value && sb.value!=='__new__') streamPicked=sb.value;
    /* "+ New value stream" asks its name in a prompt of its own, which puts
       the new stream (or the box's last value) back WITHOUT a change event:
       when that prompt goes, the box is asked again */
    if(sb.value==='__new__' && typeof MutationObserver==='function'){
      const ob=new MutationObserver(()=>{ if(document.getElementById('newfolder-overlay')) return; ob.disconnect();
        setTimeout(()=>{ const b=naStreamBox(document.getElementById('na-form')); if(b && b.value && b.value!=='__new__') streamPicked=b.value; light(); },0); });
      ob.observe(document.body,{ childList:true });
    }
    light(); });
  root.querySelector('#wz-pick')?.addEventListener('click',e=>{
    const q=e.target.closest('[data-na-dq]');
    if(q&&root.contains(q)){ dqAns=q.getAttribute('data-na-dq');
      root.querySelectorAll('[data-na-dq]').forEach(x=>x.setAttribute('aria-pressed', String(x===q)));
      const box=document.getElementById('na-closest'); if(box){ box.innerHTML=closestHtml(); light(); }
      return; }
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
        ob.disconnect();
        /* left without a draft (Cancel, the crumb's ‹, ✕, Esc): back to the page it was started on */
        if(!_naClaimed && naFrom) try{ naBackFrom(naFrom); }catch(_){ }
        dropHeld();
      });
      ob.observe(mr,{childList:true,subtree:true});
    }
  }catch(_){}
  const leave=async()=>{ if(!(await naAskLeave())) return; dropHeld(); closeModal(); };
  document.getElementById('wz-pick-cancel')?.addEventListener('click', leave);
  document.getElementById('na-x')?.addEventListener('click', leave);
  /* CREATING IS THE ONE WAY OUT THAT KEEPS THEM: the record is minted in the
     same breath and contractArrived claims them off the hold. */
  /* ---- A CREATE THAT WAS REFUSED KEEPS NOTHING (26 Sep 2026, the overnight
     clean-up) ---- The flag was raised before the act ran and never lowered, so
     a Create refused for a missing answer left the people held after Cancel,
     ✕, Escape or the scrim — and the next contract made through ANY door
     claimed them. Asked after the act: a screen still standing means nothing
     was minted, and the hold is this screen's again. */
  /* WHILE THE SERVER MAKES IT, THE BUTTON SAYS SO (13 Oct 2026): the page
     now stays up until "Complete the details" replaces it, so a second press
     must not make a second contract — the pressed button turns, the pair greys. */
  let _naBusy=false;
  const goCreate=fn=>async ev=>{ if(!api){ toast(i18t('na_pick_first'),'err'); return; }
    if(_naBusy) return;
    const btn=ev&&ev.currentTarget, was=btn?btn.innerHTML:'';
    const acts=['na-create','na-skip'].map(id=>document.getElementById(id)).filter(Boolean);
    _naClaimed=true; _naBusy=true;
    acts.forEach(b=>{ b.disabled=true; });
    if(btn&&typeof busySet==='function') busySet(btn,i18t('na_creating'));
    /* made from the one sheet, it lands on its Dossier (pdLandOnDossier) */
    if(one&&typeof pdLandOnDossier==='function') pdLandOnDossier(true);
    try{ await fn(); }catch(_){ /* the act says its own refusal */ }
    _naBusy=false;
    if(document.getElementById('na-root')){ _naClaimed=false; if(one&&typeof pdLandOnDossier==='function') pdLandOnDossier(false);
      if(btn) btn.innerHTML=was; acts.forEach(b=>{ b.disabled=false; }); light(); } };
  const createOurs=goCreate(()=>api.create());
  /* From scratch's Create (round 6): its own listener, before the sheet's one (which stays the one door to create) */
  document.getElementById('na-create')?.addEventListener('click', ev=>{
    if(one&&paper==='scratch'){ ev.stopImmediatePropagation(); if(!scr.drafted||!streamPicked) return;
      const who=String((o.words&&o.words.who)||'').trim(), ours=(typeof window.FIRST_PARTY==='string'&&window.FIRST_PARTY)||'';
      const L=naScratchSecs().filter(x=>x.on&&x.text);
      const txt=[naScratchTitle(), who?i18t('nsc_between',{ a:ours, b:who }):'', ''].concat(L.map((x,i)=>`${i+1}. ${x.h}\n${x.text}\n`)).join('\n');
      const f=new File([txt], naScratchTitle().replace(/[\\/:*?"<>|]+/g,' ').trim()+'.txt', { type:'text/plain' });
      _naClaimed=true; closeModal();
      if(typeof pdDropTake==='function') pdDropTake(f, { folder:streamPicked, counterparty:who });
      else if(typeof uploadFromDrop==='function') uploadFromDrop(f, { folder:streamPicked, counterparty:who });
      }
  });
  document.getElementById('na-create')?.addEventListener('click', ev=>{
    if(!(one&&paper==='theirs')) return createOurs(ev);
    if(!theirFile||!streamPicked) return;
    /* your words, if any, still name the other company (as drawn, 24 Oct 2026) */
    const f=theirFile, who=String((o.words&&o.words.who)||'').trim(); _naClaimed=true; closeModal();
    if(typeof pdDropTake==='function') pdDropTake(f, { folder:streamPicked, counterparty:who });
    else if(typeof uploadFromDrop==='function') uploadFromDrop(f, { folder:streamPicked, counterparty:who }); });
  document.getElementById('na-skip')?.addEventListener('click', goCreate(()=>api.skip()));
  root.querySelector('#wz-pick')?.addEventListener('click',e=>{
    const tb=e.target.closest('[data-na-tab]'); if(!tb||!root.contains(tb)) return;
    tab=tb.getAttribute('data-na-tab'); paintLists(); light();
  });
  if(one){
    /* THE DESK'S WAY BACK, in the sheet's head (asked first, as Cancel asks) */
    /* THE PANEL BESIDE IT SAYS WHAT IT HOLDS (the gaps, round 4: "Jambo · New agreement"
       in its head, its box asking "Ask for a number, a list or a contract…"): pdHeadHtml
       and igAskPlaceholder read the sheet being up, so the panel is drawn again when it
       comes and when it goes (the modal root losing #na-root, by any way out) */
    if(typeof renderIntelDock==='function') setTimeout(()=>{ try{ renderIntelDock(); }catch(_){ } },0);
    const mroot=document.getElementById('modal-root');
    if(mroot&&typeof MutationObserver==='function'){
      const mo=new MutationObserver(()=>{ if(document.getElementById('na-root')) return; mo.disconnect(); _naBack=null; _naScr=null; _naOurs=null;
        if(typeof renderIntelDock==='function') try{ renderIntelDock(); }catch(_){ }
        /* the bar names the page in front again */
        if(typeof deskBarPaint==='function') try{ deskBarPaint(); }catch(_){ } });
      mo.observe(mroot,{ childList:true, subtree:true }); }
    /* THE BAR'S ‹ WHILE THE SHEET IS UP: asked first, as Cancel asks; then the
       page the reader asked from (deskSheetFrom, noted as the sheet opened) */
    const from=(typeof deskSheetFrom==='function')?deskSheetFrom():null;
    _naBack=async()=>{ if(!(await naAskLeave())) return false; dropHeld(); closeModal();
      if(typeof deskSheetBackTo==='function') deskSheetBackTo(from); return true; };
    if(typeof deskBarPaint==='function') try{ deskBarPaint(); }catch(_){ }
    /* NOTHING ARRIVES WEARING A RING (the gaps, round 4, the second check): the
       dialog's trap readies its first button (Cancel, here), and a sheet opened
       from a box by Enter drew it ringed; the sheet's title takes the focus
       instead, so Tab starts at its top and no button is lit */
    setTimeout(()=>{ const t=document.querySelector('[data-dlg-page] .dlg-pg-title'); if(!t||!naSheetUp()) return;
      t.setAttribute('tabindex','-1'); try{ t.focus({ preventScroll:true }); }catch(_){ } },0);
    /* what it is for, and the counterparty's mark, follow the reader's typing */
    document.getElementById('na-form')?.addEventListener('input',e=>{ const k=naCarryKey(e.target&&e.target.id);
      if(k==='purpose') naForPaint(); if(k==='counterparty') naFromWordsMark(document.getElementById('na-form'));
      const h=document.getElementById('na-form'); naSrcPaint(h); naCountPaint(h); });
    document.getElementById('na-form')?.addEventListener('change',()=>{ const h=document.getElementById('na-form'); naTermFill(h); naSrcPaint(h); naCountPaint(h); });
    /* CHANGE PAPER: the list again, the answers kept for the next paper (naCarryRead at the next pick) */
    document.getElementById('na-change-paper')?.addEventListener('click',()=>{ root.classList.remove('is-picked');
      const l=document.getElementById('na-closest'); if(l) try{ l.scrollIntoView({ block:'nearest' }); }catch(_){} });
    /* OUR PAPER · THEIR PAPER: the tab is whose paper it is */
    root.querySelector('.na-ptabs')?.addEventListener('click',e=>{ const b=e.target.closest('[data-na-paper]'); if(!b) return;
      paper=b.getAttribute('data-na-paper'); light(); naFilePaint(); if(paper==='scratch') naScratchPaint(); else if(typeof renderIntelDock==='function') try{ renderIntelDock(); }catch(_){ }
      if(paper==='theirs'){ const d=document.getElementById('na-drop'); if(d) try{ d.scrollIntoView({ block:'nearest' }); }catch(_){} } });
    /* FROM SCRATCH's own presses: a section ticked or not, Propose the rest (1 call); the panel's Draft the paper */
    if(naScratchOk){
      root.addEventListener('change',e=>{ const c=e.target&&e.target.closest?e.target.closest('[data-nsc-on]'):null; if(!c) return;
        const x=naScratchSecs()[Number(c.getAttribute('data-nsc-on'))]; if(x) x.on=!!c.checked; naScratchPaint(); light(); });
      root.addEventListener('click',e=>{ if(e.target&&e.target.closest&&e.target.closest('[data-nsc-propose]')){ e.preventDefault(); naScratchPropose(); } });
      _naScr={ up:()=>paper==='scratch'&&naSheetUp(), says:naScratchSays, draft:naScratchDraft, propose:naScratchPropose };
    }
    /* Our paper's own words for the panel (the new look): the closest papers, the one chosen, the lines filled from the words */
    _naOurs={ up:()=>paper==='ours'&&naSheetUp(), closest:()=>closestRows().map(r=>r.name), chosen:()=>{ const r=sel?rows().find(x=>x.kind===sel.kind&&String(x.id)===String(sel.id)):null; return r?r.name:''; },
      read:()=>naReadRows().length, asked:()=>!!asked };
    /* THEIR FILE: chosen or dropped, one at a time, read only at Create */
    const tIn=document.getElementById('na-theirs-input');
    const tSet=f=>{ theirFile=f||null; const el=document.getElementById('na-theirs-file');
      if(el){ el.hidden=!theirFile; el.textContent=theirFile?i18t('na_theirs_file',{ name:theirFile.name }):''; } light(); };
    document.getElementById('na-theirs-pick')?.addEventListener('click',()=>{ if(tIn) tIn.click(); });
    tIn?.addEventListener('change',()=>{ const f=tIn.files&&tIn.files[0]; tIn.value=''; if(f) tSet(f); });
    const dz=document.getElementById('na-drop');
    if(dz){ dz.addEventListener('dragover',e=>{ e.preventDefault(); dz.classList.add('is-over'); });
      dz.addEventListener('dragleave',()=>dz.classList.remove('is-over'));
      dz.addEventListener('drop',e=>{ e.preventDefault(); dz.classList.remove('is-over'); const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]; if(f) tSet(f); }); }
    root._naTheirSet=tSet;
    /* READ MY WORDS AGAIN (the arrow, or Enter): the sentence is read afresh, still without AI */
    const reask=async()=>{ const sayEl=document.getElementById('dr-say'); const t=String((sayEl&&sayEl.value)||'').trim();
      if(!t){ if(sayEl) try{ sayEl.focus(); }catch(_){} return; }
      if(!(await naAskLeave(true))) return;
      dropHeld(); _naClaimed=true; closeModal();
      setTimeout(()=>{ if(typeof caDraftAgain==='function') caDraftAgain(t, { paper }); else openNewAgreement({ asked:t, streamAsk:true, paper }); },0); };
    document.getElementById('na-reask')?.addEventListener('click', reask);
    root._naReask=reask;
    /* the whole search list, one press away (pressed again it folds) */
    document.getElementById('na-all')?.addEventListener('click',e=>{ const box=document.getElementById('na-search'); if(!box) return;
      box.hidden=!box.hidden; e.currentTarget.setAttribute('aria-expanded',String(!box.hidden));
      if(!box.hidden){ paintLists(); light(); const q=document.getElementById('na-q'); if(q) try{ q.focus({ preventScroll:true }); }catch(_){} } });
    /* NONE FITS: the sentence goes to Legal as a request, its own record */
    document.getElementById('na-legal')?.addEventListener('click',async()=>{ if(!(await naAskLeave())) return; dropHeld(); closeModal();
      if(typeof openIntakeForm==='function') openIntakeForm({ need:asked, title:(typeof intakeTitleFrom==='function')?intakeTitleFrom(asked):'' }); });
    /* CHANGE THE ASK: the sentence goes back into Jambo's box, to be said again */
    document.getElementById('na-ask-again')?.addEventListener('click',async()=>{ if(!(await naAskLeave())) return; dropHeld(); closeModal();
      const inp=document.getElementById('igd-input'); if(!inp) return;
      /* the sentence in the box, the caret at its end, ready to be said again */
      const put=el=>{ if(!el) return; if(el.value!==asked){ el.value=asked; if(typeof chatFieldGrow==='function') chatFieldGrow(el); }
        try{ el.focus({ preventScroll:true }); el.setSelectionRange(el.value.length, el.value.length); }catch(_){} };
      put(inp);
      /* LAND ON IT (owner, 18 Oct 2026): on Jambo's box, lit by the one lander —
         by its name, since the panel draws its box again once the sheet goes */
      if(typeof landOn==='function') landOn('#igd-input',{ focus:false }).then(put); });
    document.getElementById('na-file')?.addEventListener('click',e=>{ const b=e.target.closest('[data-na-stream]'); if(!b) return;
      const v=b.getAttribute('data-na-stream'), sb=api?naStreamBox(document.getElementById('na-form')):null;
      if(v!=='__new__') streamPicked=v;
      if(sb){ sb.value=v; try{ sb.dispatchEvent(new Event('change',{ bubbles:true })); }catch(_){} }
      light(); });
  }
  let _q=null;
  document.getElementById('na-q')?.addEventListener('input',()=>{ clearTimeout(_q); _q=setTimeout(()=>{ paintLists(); light(); }, 80); });
  const say=document.getElementById('dr-say'), read=document.getElementById('dr-read');
  say?.addEventListener('input',()=>naSayFit(say));
  /* ENTER STILL PRESSES FIND, and Shift+Enter is a newline — the box wraps
     now, so a reader who wants a second line has a way to ask for one. */
  say?.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault();
    if(one&&typeof root._naReask==='function'){ root._naReask(); return; }
    if(read&&!read.disabled) read.click(); } });
  if(read && ready) read.addEventListener('click',()=>{ if(typeof draftRead==='function') draftRead(); });
  paintLists();
  /* NOTHING IS CHOSEN FOR THE READER (the Search list, 12 Oct 2026; this
     reverses "the first door is lit on arrival"): the card waits, and Create
     draft with it, unless the caller named a template. */
  const want=o.pick&&rows().find(r=>r.kind===o.pick.kind&&String(r.id)===String(o.pick.id));
  if(want) pick(want.kind, want.id, o.prefill); else light();
  if(one&&o.file&&typeof root._naTheirSet==='function') root._naTheirSet(o.file);
  if(one) naFilePaint();
  naSayFit(say);
  if(o.say && say) say.focus();
  /* The company standards may still be in flight (the same race the draft
     dialog closes): repaint the LISTS when they land, never the card. */
  if(typeof tplLibReady==='function' && typeof tplLibPublished==='function'){
    const before=libOf().length;
    tplLibReady().then(()=>{ if(document.getElementById('na-root')===root && libOf().length!==before) paintLists(); }).catch(()=>{});
  }
}
/* ---- THE CARD'S TYPED ANSWERS, BY KEY (9 Oct 2026) ----
   The three doors' forms prefix their boxes wz- / ce- / tf- and then use the
   same key for the same fact. Read: every text box whose value differs from
   what it was drawn with (a default or a Copilot prefill is not "typed").
   Write: only into a box of the same key that is still at its drawn value —
   what the reader typed outranks a drawn default. Selects are left alone:
   their first option is a real answer, not an empty box. */
/* THE ONE SHEET IS ON THE DESK (round 4): read by the panel beside it, which
   says what it holds and asks as drawn while it is up */
/* EVERY DOOR OPENS BESIDE JAMBO (owner, 22 Oct 2026: started from Settings the form covered the whole
   window with no Jambo — "Always open beside Jambo"): on a computer, where his panel is not on screen,
   the form goes to Home first and stands beside it; the page it came from (deskSheetFrom) is where a
   way out without a draft lands again (naBackFrom). The phone keeps its own screens. Returns that page, or null. */
/* From scratch's hand to the panel beside it (paperdesk): while that tab is up, what it holds and its presses */
let _naScr=null, _naOurs=null;
function naOursNow(){ try { return _naOurs && _naOurs.up() ? _naOurs : null; } catch (_){ return null; } }
if (typeof document !== 'undefined' && !document._nscWired){ document._nscWired = true;
  document.addEventListener('click', e => { const b = e.target && e.target.closest ? e.target.closest('[data-nsc-draft],[data-nsc-propose-p]') : null; if (!b) return;
    const S = naScratchNow(); if (!S) return; e.preventDefault(); if (b.hasAttribute('data-nsc-draft')) S.draft(); else S.propose(); });
}
function naScratchNow(){ try { return _naScr && _naScr.up() ? _naScr : null; } catch (_){ return null; } }
function naHomeFirst(){
  if(typeof document==='undefined'||typeof setView!=='function') return null;
  if(typeof mPhone==='function'&&mPhone()) return null;
  const dock=document.getElementById('ig-dock');
  /* his panel on screen (or a stand-in that cannot say): the form stays where it is */
  if(dock&&(typeof dock.getClientRects!=='function'||dock.getClientRects().length)) return null;
  /* the view it stands on, and the desk's own key for the page */
  const from={ key:(typeof deskSheetFrom==='function')?deskSheetFrom():null, view:(typeof state==='object'&&state)?state.view:'' };
  try{ setView('dashboard'); }catch(_){ return null; }
  return from;
}
/* a way out without a draft lands on the page the form was started on */
function naBackFrom(from){
  if(!from) return;
  /* the view it stood on is exact; the desk's key only for a place on Home (its trail keeps a page once settled) */
  if(from.view&&from.view!=='dashboard'&&typeof setView==='function'){ setView(from.view); return; }
  if(from.key&&typeof deskSheetBackTo==='function') deskSheetBackTo(from.key);
}
function naSheetUp(){ return typeof document!=='undefined' && !!document.querySelector('#na-root.na-one'); }
/* the bar's ‹ while the one sheet is up: its own way out (asks, then goes back), set as it opens */
let _naBack=null;
function naSheetBack(){ return (naSheetUp()&&typeof _naBack==='function')?_naBack():Promise.resolve(false); }
const NA_CARRY_SEL='input[id]:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]),textarea[id]';
const naCarryKey=id=>{ const m=/^(?:wz|ce|tf)-(.+)$/.exec(String(id||'')); return m?m[1]:null; };
function naCarryRead(host, into){
  const out=into||{};
  if(!host||typeof host.querySelectorAll!=='function') return out;
  host.querySelectorAll(NA_CARRY_SEL).forEach(el=>{
    const k=naCarryKey(el.id); if(!k) return;
    const v=String(el.value||'');
    if(v.trim() && v!==String(el.defaultValue||'')) out[k]=v;
    else if(into && Object.prototype.hasOwnProperty.call(out,k) && !v.trim()) delete out[k];
  });
  return out;
}
function naCarryWrite(host, kept){
  if(!host||!kept||typeof host.querySelectorAll!=='function') return 0;
  let n=0;
  host.querySelectorAll(NA_CARRY_SEL).forEach(el=>{
    const k=naCarryKey(el.id); if(!k || !Object.prototype.hasOwnProperty.call(kept,k)) return;
    if(String(el.value||'')!==String(el.defaultValue||'')) return;
    el.value=kept[k]; n++;
    try{ el.dispatchEvent(new Event('input',{ bubbles:true })); }catch(_){}
  });
  return n;
}
/* THE FORM'S STREAM BOX: the one select drawn by folderOptionsHtml, which
   alone carries the "new stream" choice (__new__) — whichever of the three
   forms (wz- / ce- / tf-) is mounted */
/* WHEN TO USE A PAPER, in one everyday line (round 2 of the first-timer rounds,
   the owner's twelve lines, 22 Oct 2026): HaTi's own papers by their key, ours
   by the description their owner wrote; none, nothing said */
function naUseWhen(r){
  if(!r) return '';
  if(r.kind==='tid'){ const k='tpl_use_'+r.id; const t=i18t(k); return t&&t!==k?t:''; }
  return String(r.sub||'').trim();
}
/* NO CONTRACTS TEAM: everyone else who could take a request is an admin, so
   "Ask Legal" would name a team that does not exist (a request reaches every
   non-viewer colleague; intakeRaisedRecipients) */
function naNoTeam(){
  try{ const me=(typeof currentUser==='function'&&currentUser())||{};
    const others=((typeof getUsers==='function'&&getUsers())||[]).filter(u=>u&&u.id!==me.id&&u.role!=='viewer');
    return others.length>0 && others.every(u=>u.role==='admin');
  }catch(_){ return false; }
}
function naStreamBox(host){
  if(!host||typeof host.querySelectorAll!=='function') return null;
  for(const sel of host.querySelectorAll('select')) if(sel.querySelector('option[value="__new__"]')) return sel;
  return null;
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

Object.assign(window,{naScratchNow,naOursNow,naUseWhen,naNoTeam,openNewDoors,TEMPLATE_PRIMARY,TEMPLATE_STARTERS,INDUSTRY_TEMPLATES,INDUSTRY_LABEL,FOR_YOU_MAX,FOR_YOU_LOB_MIN,forYouPick,workspaceIndustry,builtinUsageCount,builtinUsageRows,forYouTemplates,templateVars,templateRoles,templateAllowedForRole,myCreatableTemplates,openWizard,createFromWizard,wzFieldHtml,wzEmailHtml,wizardFormMount,openNewAgreement,naPickFromDraft,naStreamBox,naSheetUp,naSheetBack,naHomeFirst,naBackFrom,naCarryRead,naCarryWrite,naHit,naCardSub,naCardHint,naCardTitle,naSayFit,NA_SAY_MAX_LINES,NA_RAIL_W,NA_ROWS_MIN_H,NA_ROWS_FOOT,NA_FRAME_NARROW_W});
