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
function builtinUsageCount(tid){ return (state.contracts||[]).filter(c=>c.template===tid && !c.seeded).length; }
function forYouTemplates(tmpls){
  const byId={}; tmpls.forEach(t=>{ byId[t.id]=t; });
  const picked=[];
  const take=id=>{ if(byId[id] && !picked.includes(id)) picked.push(id); };
  tmpls.map(t=>({ id:t.id, n:builtinUsageCount(t.id) })).filter(x=>x.n>0)
    .sort((a,b)=>b.n-a.n).forEach(x=>take(x.id));
  (INDUSTRY_TEMPLATES[workspaceIndustry()]||[]).forEach(take);
  TEMPLATE_STARTERS.forEach(take);
  return picked.slice(0,4).map(id=>byId[id]);
}

/* ---- guided creation wizard ---- */
function openWizard(preTid){
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
      const card=t=>`<button data-wz-tid="${t.id}" style="text-align:left;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:12px;cursor:pointer;transition:border-color .15s,box-shadow .15s;" onmouseover="this.style.borderColor='var(--color-accent)';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.borderColor='var(--color-divider)';this.style.boxShadow='none'">
            <span style="display:flex;align-items:center;gap:8px;"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:4px;background:var(--color-accent-100);color:var(--color-accent);flex:none;">${icon(t.ic||'file','w-3.5 h-3.5')}</span>
            <span style="font-size:13px;font-weight:600;color:var(--color-text);font-family:var(--font-mono);">${t.kind}</span></span>
            <span style="display:block;margin-top:5px;font-size:11px;color:var(--color-neutral-600);line-height:1.4;">${t.blurb||''}</span></button>`;
      const GRID='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;';
      const EYE='display:block;font-family:var(--font-mono);font-size:9.5px;letter-spacing:.1em;color:var(--color-neutral-500);text-transform:uppercase;margin:0 0 6px;';
      const forYou=forYouTemplates(tmpls);
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
      const rowCard=r=>`<button data-wz-${r.pick}="${esc2(r.id)}" style="text-align:left;border:${r.std?'1.5px solid var(--color-accent)':'1px solid var(--color-divider)'};background:${r.std?'var(--color-accent-100)':'var(--color-surface)'};border-radius:6px;padding:12px;cursor:pointer;">
        <span style="display:flex;align-items:center;gap:8px;"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:4px;background:${r.std?'var(--color-accent)':'var(--color-accent-100)'};color:${r.std?'#fff':'var(--color-accent)'};flex:none;">${icon(r.ic,'w-3.5 h-3.5')}</span>
        <span style="font-size:13px;font-weight:600;color:var(--color-text);">${esc2(r.name)}</span></span>
        <span style="display:block;margin-top:5px;font-size:11px;color:var(--color-neutral-600);line-height:1.4;">${esc2(r.sub)}</span></button>`;
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
        return `<button data-wz-stream="${esc2(k)}" style="text-align:left;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:12px;cursor:pointer;border-left:3px solid ${fColor(k)};">
          <span style="display:flex;align-items:center;gap:8px;"><span style="width:28px;height:28px;display:grid;place-items:center;border-radius:4px;background:color-mix(in srgb,${fColor(k)} 15%,transparent);color:${fColor(k)};flex:none;">${icon(fIcon(k),'w-3.5 h-3.5')}</span>
          <span style="font-size:13px;font-weight:600;color:var(--color-text);flex:1;min-width:0;">${esc2(fName(k))}</span>
          <span style="font-size:11.5px;font-weight:600;color:var(--color-neutral-500);flex:none;">${n}</span></span>
          <span style="display:block;margin-top:5px;font-size:11px;color:var(--color-neutral-600);line-height:1.4;">${esc2(fDesc(k))}</span></button>`;
      };
      const inStream=wzStream&&byStream.has(wzStream)?byStream.get(wzStream):null;
      openModal(`<div style="padding:22px 24px;">
        ${inStream?`<button id="wz-streams-back" style="font-size:11px;color:var(--color-accent-700);font-weight:600;font-family:var(--font-mono);background:none;border:0;cursor:pointer;margin-bottom:8px;padding:0;">← ${i18t('wz_all_streams')}</button>`:''}
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:18px;color:var(--color-text);margin:0 0 3px;">${inStream?esc2(fName(wzStream)):i18t('wz_new_from_template')}</h3>
        <p style="font-size:12px;color:var(--color-neutral-600);margin:0 0 14px;line-height:1.5;">${inStream?i18tn('wz_n_in_stream',inStream.length,{n:inStream.length}):i18t('wz_pick_stream')}</p>
        <div id="wz-pick" class="scroll-thin" style="max-height:62vh;overflow-y:auto;">
          ${inStream?`<div style="${GRID}">${inStream.map(rowCard).join('')}</div>`:`
          ${curated?`<div style="margin-bottom:14px">
            <span style="${EYE}">${i18t('wz_for_you')}${industry?` · ${INDUSTRY_LABEL[industry]}`:''}</span>
            <div style="${GRID}">${forYou.map(card).join('')}</div>
          </div>`:''}
          ${admin?`<label style="display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:11px;color:var(--color-neutral-600)">${i18t('wz_line_of_business')}
            <select id="wz-industry" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:4px 8px;font:inherit;font-size:11.5px;color:inherit">
              <option value="">${i18t('wz_not_set')}</option>
              ${Object.keys(INDUSTRY_TEMPLATES).map(k=>`<option value="${k}" ${industry===k?'selected':''}>${INDUSTRY_LABEL[k]}</option>`).join('')}
            </select></label>`:''}
          ${''/* SEARCH STAYS ON THE FRONT SCREEN and looks across every stream:
                 browsing is for when you do not know the name, and searching is
                 for when you do. Making the search obey the open folder would
                 make the faster of the two routes the narrower one. */}
          <input id="wz-search" type="search" placeholder="${i18t('wz_search_all')}" autocomplete="off"
            style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:6px;padding:8px 12px;font:inherit;font-size:12.5px;color:inherit;outline:none;margin-bottom:10px"/>
          <div id="wz-hits" style="${GRID};margin-bottom:10px"></div>
          <span style="${EYE}">${i18t('wz_streams_head')}</span>
          <div style="${GRID}">${order.map(streamCard).join('')}</div>`}
        </div></div>`);
      /* One delegated listener: the search box re-renders cards into #wz-hits,
         and per-card wiring would quietly miss whichever render came second. */
      const pick=document.getElementById('wz-pick');
      document.getElementById('wz-streams-back')?.addEventListener('click',()=>{ wzStream=null; renderStep(); });
      pick.addEventListener('click',e=>{
        const st=e.target.closest('[data-wz-stream]');
        if(st){ wzStream=st.getAttribute('data-wz-stream'); renderStep(); return; }
        const lb=e.target.closest('[data-wz-lib]');
        if(lb){ closeModal(); if(window.tplLibNewContract) tplLibNewContract(lb.getAttribute('data-wz-lib')); return; }
        const mn=e.target.closest('[data-wz-mine]');
        if(mn){ closeModal(); if(window.createFromCustomTemplate) createFromCustomTemplate(mn.getAttribute('data-wz-mine')); return; }
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
          :`<div style="grid-column:1/-1;font-size:11.5px;color:var(--color-neutral-600);padding:6px 2px">${i18t('wz_nothing_matches_q',{q:q.replace(/</g,'&lt;')})}</div>`):'';

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
    const t=TEMPLATES[tid], vars=templateVars(tid);
    /* THE ARROW SAYS WHERE THE ANSWER IS FILED, and says nothing when the two
       names are the same word. "Counterparty * → Counterparty" has always been
       noise; adding "Our party → Our party" beside it made a pattern of it.
       Compared case-insensitively, because the map labels are translated and
       the two languages capitalise differently. */
    const mapNote=v=>{ if(!v.maps) return '';
      const m=tplMapLabel(v.maps);
      if(!m || String(m).trim().toLowerCase()===String(v.label||'').trim().toLowerCase()) return '';
      return `<span style="font-weight:400;color:var(--color-neutral-500);text-transform:none;letter-spacing:0"> → ${m}</span>`; };
    const input=v=>{ const id='wz-'+String(v.key).replace(/[:]/g,'_');
      const lbl=`<span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">${v.label}${v.required?' <span style="color:var(--st-ruby-fg)">*</span>':''}${mapNote(v)}</span>`;
      if(v.type==='select') return `<label style="display:block;">${lbl}
        <select id="${id}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;color:var(--color-text);outline:none;">
          ${(v.opts||[]).map(o=>`<option value="${String(o).replace(/"/g,'&quot;')}" ${v.def===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
      const it=v.type==='date'?'date':(v.type==='num'?'number':'text');
      return `<label style="display:block;">${lbl}
        <input id="${id}" type="${it}" value="${String(v.def||'').replace(/"/g,'&quot;')}" placeholder="${v.ph||''}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>`; };
    openModal(`<div style="padding:22px 24px;">
      <button id="wz-back" style="font-size:11px;color:var(--color-accent-700);font-weight:600;font-family:var(--font-mono);background:none;border:0;cursor:pointer;margin-bottom:8px;padding:0;">← templates</button>
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:18px;color:var(--color-text);margin:0 0 3px;">${t.kind}</h3>
      <p style="font-size:12px;color:var(--color-neutral-600);margin:0 0 16px;line-height:1.5;">${t.blurb||''}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">${vars.map(input).join('')}
        ${''/* ASKED HERE, WHERE YOU ARE ALREADY NAMING THEM, AND NOWHERE ELSE.
               The templates carry the counterparty's NAME; nothing carried the
               address, so it was collected later — by a strip in the
               negotiation room, and again by the share dialog when you pressed
               Send. Three times for one fact, in one sitting. Once it is on the
               contract the strip never appears and the send goes straight out. */}
        <label style="display:block;">
          <span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">${i18t('wz_their_email')}<span style="font-weight:400;color:var(--color-neutral-500);text-transform:none;letter-spacing:0"> → so you can send it to them</span></span>
          <input id="wz-cpemail" type="email" placeholder="${(typeof jxEg==='function'&&jxEg('theirEmail'))||'them@company.co.ke'}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:20px;">
        <button id="wz-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <span style="flex:1"></span>
        <button id="wz-skip" class="ui-btn" title="${i18t('wz_create_and_fill')}">${i18t('wz_skip_for_now')}</button>
        <button id="wz-create" class="ui-btn ui-btn-primary">${i18t('tl_create_draft')}</button>
      </div></div>`);
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
  persist(c); closeModal();
  toast(`Draft created — ${t.kind}`);
  setView('workspace'); renderSideFolders&&renderSideFolders();
}

Object.assign(window,{TEMPLATE_PRIMARY,TEMPLATE_STARTERS,INDUSTRY_TEMPLATES,INDUSTRY_LABEL,workspaceIndustry,builtinUsageCount,forYouTemplates,templateVars,templateRoles,templateAllowedForRole,myCreatableTemplates,openWizard,createFromWizard});
