// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: SETTINGS & RULES — FOUR TABS AND ONE DRAWER
   ============================================================
   This was one long scrolling page with sixteen cards on it. It is now four
   tabs — People, Platform settings, Build & launch, You — where every row
   opens the SAME drawer on the right-hand side.

   THE PAGE IS ADMIN-ONLY, AND THAT MEANT CLOSING EVERY DOOR, not just the one
   in the sidebar. There were five: the nav item, the avatar in the top bar,
   the Copilot-usage box in the sidebar foot, the session-restore whitelist,
   and a dead `setView('settings')` on the email banner that opened the
   workspace instead. renderTeam() itself is now the gate — a non-admin who
   arrives here by ANY of those roads is drawn their own account page rather
   than a blank or a refusal.

   WHAT A NON-ADMIN COULD DO HERE HAS A NEW HOME, NOT A SILENT LOSS. Their own
   job title, their sidebar preference, their own sessions, their own backup
   export and the honest read-only statement of what HaTi emails them all moved
   to "Your account" (openMyAccount) — reachable from the avatar on a laptop and
   from the account sheet on a phone. An Editor's Company-design door moved
   there too, labelled as the workspace setting it is. What genuinely closed:
   a non-admin can no longer READ the roster, the approval rules or the state
   of the two gates. That is deliberate.

   THE PANELS WERE RE-HOUSED, NOT REWRITTEN. Every element id on this page is
   the id it had before, so every existing handler, test and helper still finds
   what it is looking for. In particular the settings-page traps stand:
     · the two company cards still PATCH IN PLACE and never renderTeam()
     · the market's language-follow redraw still holds panel heights
     · the gates still write ON CHANGE and have no Save button — a gate armed
       only if you remember to press Save is a gate that is off when it matters
   Which is why the drawer has TWO feet: `save` (a real form — the person
   drawer) and `done` (a panel that has already written what you changed).
   ============================================================ */

/* Parse an imported directory CSV into [{name,email,title}].
   Detects a header row (Name/Email/Title in any order); without one it assumes
   the columns are Name, Email, Title. Handles quoted fields and doubled quotes. */
function parseDirectoryCsv(text){
  const lines=String(text||'').replace(/\r\n?/g,'\n').split('\n').filter(l=>l.trim()!=='');
  if(!lines.length) return [];
  const parseLine=l=>{ const out=[]; let cur='',q=false;
    for(let i=0;i<l.length;i++){ const ch=l[i];
      if(q){ if(ch==='"'){ if(l[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=ch; }
      else { if(ch==='"') q=true; else if(ch===','){ out.push(cur); cur=''; } else cur+=ch; } }
    out.push(cur); return out.map(s=>s.trim()); };
  const rows=lines.map(parseLine);
  const head=rows[0].map(h=>h.toLowerCase());
  let ni=0, ei=1, ti=2, dataStart=0;
  if(head.some(h=>/name|email|mail|title/.test(h))){
    ni=head.findIndex(h=>h.includes('name'));
    ei=head.findIndex(h=>h.includes('mail'));
    ti=head.findIndex(h=>h.includes('title'));
    dataStart=1;
  }
  const out=[];
  for(let i=dataStart;i<rows.length;i++){ const r=rows[i];
    const name=ni>=0?(r[ni]||''):'', email=ei>=0?(r[ei]||''):'', title=ti>=0?(r[ti]||''):'';
    if(!name && !email) continue;
    out.push({ name, email:email.toLowerCase(), title });
  }
  return out;
}
/* Admin-only editor: grant a member every stream, or a specific subset. Stored
   in state.settings.folderAccess and persisted through saveSettings() (both modes).
   THE PERSON DRAWER IS THE DOOR NOW — this stays because it is the one WRITER
   the product has for this map, and it is what the drawer's Folders section
   calls (settingsWriteFolderAccess below shares its refusals). */
function openFolderAccessEditor(userId){
  const u=getUsers().find(x=>x.id===userId); if(!u) return;
  const cur=(((state.settings||{}).folderAccess)||{})[userId];
  const isAll=(cur==null||cur==='*'||(Array.isArray(cur)&&!cur.length));
  const set=new Set(Array.isArray(cur)?cur:[]);
  const folders=Object.values(FOLDERS);
  const fRow=f=>`<label style="display:flex;align-items:center;gap:9px;padding:7px 9px;border:1px solid var(--color-divider);border-radius:var(--radius);cursor:pointer;font-size:var(--t-body)">
      <input type="checkbox" data-fa-folder="${f.id}" ${set.has(f.id)?'checked':''} style="width:15px;height:15px;accent-color:var(--color-accent);flex:none"/>
      <span style="width:9px;height:9px;border-radius:var(--radius);background:${f.color};flex:none"></span>
      <span style="flex:1;min-width:0">${esc(f.name)}</span></label>`;
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('set_folder_access_for',{who:(u.name||u.email).replace(/</g,'&lt;')})}</h3>
    <p class="text-xs text-ink/60 mb-3">${i18t('set_grant_streams')}</p>
    <label style="display:flex;align-items:center;gap:9px;padding:9px;border:1px solid var(--color-divider);border-radius:var(--radius);cursor:pointer;font-size:var(--t-body);font-weight:var(--w-strong);margin-bottom:10px">
      <input type="checkbox" id="fa-all" ${isAll?'checked':''} style="width:16px;height:16px;accent-color:var(--color-accent)"/> ${i18t('set_all_streams')}</label>
    <div id="fa-list" style="display:${isAll?'none':'grid'};grid-template-columns:1fr;gap:6px;max-height:300px;overflow:auto;margin-bottom:14px">${folders.map(fRow).join('')}</div>
    <div class="flex justify-end gap-2">
      <button data-dlg-cancel id="fa-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="fa-save" class="ui-btn ui-btn-primary">${i18t('set_save_access')}</button></div>
  </div>`);
  const allBox=document.getElementById('fa-all'), list=document.getElementById('fa-list');
  allBox.addEventListener('change',()=>{ list.style.display=allBox.checked?'none':'grid'; });
  document.getElementById('fa-cancel').addEventListener('click',closeModal);
  document.getElementById('fa-save').addEventListener('click',async()=>{
    let folders=null;
    if(!allBox.checked){
      const ids=[...document.querySelectorAll('[data-fa-folder]')].filter(cb=>cb.checked).map(cb=>cb.getAttribute('data-fa-folder'));
      if(!ids.length){ toast(i18t('set_pick_one_stream'),'err'); return; }
      folders=ids;
    }
    try{ await settingsWriteFolderAccess(userId, folders); }
    catch(e){ toast(i18t('set_could_not_save_access')+e.message,'err'); return; }
    closeModal(); toast(i18t('set_t_access_updated',{who:u.name||u.email})); renderTeam();
  });
}
/* THE ONE WRITER for per-member stream access, and the one place the payload's
   shape is decided. `null` means every stream and DELETES the key; an empty
   array is never sent — the browser's map reads it as "nothing said" and the
   server reads it as "deny all", and two stores disagreeing about one value is
   how a restriction becomes a grant. H-3: in server mode it goes through the
   dedicated atomic route rather than the whole settings blob, so a concurrent
   unrelated settings save cannot revert a restriction. */
async function settingsWriteFolderAccess(userId, folders){
  if(Array.isArray(folders) && !folders.length) throw new Error(i18t('set_pick_one_stream'));
  state.settings=state.settings||{}; state.settings.folderAccess=state.settings.folderAccess||{};
  if(folders==null) delete state.settings.folderAccess[userId];
  else state.settings.folderAccess[userId]=folders;
  if(window.API_MODE && window.API_MODE()) await api('settings/folder-access','PUT',{ userId, folders });
  else await saveSettings();
}
/* ---- onboarding allowance panel ----
   Shows the burn-down in the same shape the Migration screen shows it, so an
   admin and the person running the batch are reading the same numbers. */
function renderAllowancePanel(a){
  const host=document.getElementById('ai-allowance-state'); if(!host) return;
  const money=n=>'$'+Number(n||0).toFixed(2);
  if(!a || !a.open){
    host.innerHTML=`<span style="color:var(--color-neutral-600)">${i18t('set_no_allowance')}</span>`;
    return;
  }
  const moneyPct=a.budget>0?Math.min(100,Math.round(a.spent/a.budget*100)):0;
  const docsPct=a.docs>0?Math.min(100,Math.round(a.docsUsed/a.docs*100)):0;
  const pct=Math.max(moneyPct,docsPct);
  const bar=`<div style="height:6px;background:var(--color-neutral-200);border-radius:var(--radius);overflow:hidden;margin-top:5px">
    <div style="width:${pct}%;height:100%;background:${a.exhausted?'var(--st-ruby-fg)':pct>=80?'var(--st-amber-dot)':'var(--st-green-dot)'};transition:width var(--dur-3)"></div></div>`;
  host.innerHTML=`<div>
    <span style="font-weight:var(--w-strong);color:${a.exhausted?'var(--st-ruby-fg)':'var(--st-green-fg)'}">${a.exhausted?'Used up':'Open'}</span>
    ${a.budget>0?` · <b>${money(a.spent)}</b> of <b>${money(a.budget)}</b>`:' · no money cap'}
    ${a.docs>0?` · <b>${a.docsUsed}</b> of <b>${a.docs}</b> documents`:''}
    ${a.openedBy?`<span style="color:var(--color-neutral-500)"> · opened by ${PB_ESC(a.openedBy)}</span>`:''}
    ${bar}
  </div>`;
  // pre-fill the top-up boxes with the current caps
  const fill=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n&&!n.value) n.value=v; };
  fill('ai-allow-budget',a.budget||''); fill('ai-allow-docs',a.docs||'');
}

/* ---- editable per-model rate table ---- */
function renderRateTable(rates, meta){
  const host=document.getElementById('ai-rates-table'); if(!host) return;
  const models=Object.keys(rates||{}).sort((a,b)=>a==='default'?1:b==='default'?-1:a.localeCompare(b));
  const inp='width:74px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:3px 6px;font:inherit;font-family:var(--font-mono);font-size:var(--t-label);text-align:right;outline:none';
  host.innerHTML=models.map(m=>`
    <div data-rate-model="${PB_ATTR(m)}" style="display:flex;align-items:center;gap:var(--s-2);padding:3px 2px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
      <span style="flex:1;min-width:0;font-size:var(--t-label);font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis${m==='default'?';color:var(--color-neutral-500);font-style:italic':''}">${PB_ESC(m)}</span>
      <label style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_rate_in')} <input data-rate="in" type="number" min="0" step="0.01" value="${Number(rates[m].in)}" style="${inp}"/></label>
      <label style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_rate_out')} <input data-rate="out" type="number" min="0" step="0.01" value="${Number(rates[m].out)}" style="${inp}"/></label>
    </div>`).join('');
  const metaEl=document.getElementById('ai-rates-meta');
  if(metaEl) metaEl.textContent = meta && meta.verifiedOn
    ? (meta.edited ? `edited by an admin · shipped prices verified ${meta.verifiedOn}` : `verified ${meta.verifiedOn}`)
    : '';
}

/* ---- THE TWO COMPANY CARDS PATCH THEMSELVES, THEY DO NOT RE-RENDER THE PAGE ----
   Reported as "when I make selections, the page glitches", against the market
   dropdown and the work-shape tick boxes. Both handlers answered a change by
   calling renderTeam(), which rebuilds the WHOLE settings screen — and half of
   that screen is filled from the server after the fact: the sessions list, the
   Copilot key and its usage, the per-model rate table, the monthly report and
   its outbox. Rebuilt, every one of them comes back empty and refills over the
   next few hundred milliseconds.

   Measured before the fix, on one tick of a box: the page lost 703px of height
   in the same frame and the card being read jumped 260px UP the screen, then
   walked back down as each answer landed. The scroll offset never moved, which
   is why this reads as the page lurching rather than as a scroll — and it is
   also why setView's scroll-keeping does not help. The content above the reader
   shrank; nothing was going to hold their place through that.

   THE RULE SURVIVED THE MOVE INTO A DRAWER, and it had to: a drawer is a
   shorter column than the page was, so a rebuild there throws the reader
   further, not less far. Each card still repaints only what its own answer
   changed. */
const WS_BOX_ON  = { line:'var(--color-accent)', fill:'color-mix(in srgb,var(--color-accent) 7%,transparent)' };
const WS_BOX_OFF = { line:'var(--color-divider)', fill:'var(--color-surface)' };
/* The three facts under the market dropdown. Built here rather than inline
   because the dropdown has to rewrite them the moment it is changed, and two
   copies of this line are two lines that can disagree about the currency. */
function settingsMarketFactsHtml(){
  return `<div>${i18t('set_market_currency')}: <b>${jxCurrency()}</b> · ${i18t('set_market_law')}: <b>${esc(jxLaw())}</b></div>
    <div>${i18t('set_market_esig')}: ${esc(jxEsignatureShort())}</div>`;
}
/* AND WHERE THIS PAGE REALLY DOES HAVE TO BE REBUILT, THE PANELS KEEP THEIR
   HEIGHT WHILE THEY REFILL.
   Changing the market can change the LANGUAGE — not because the two are the
   same thing (they are emphatically not; see the note in js/i18n.js) but
   because a person who has never chosen one falls back to the language that
   goes with the workspace's market. Every word on the screen changes, so the
   screen genuinely is redrawn, and the redraw hits the collapse described
   above. Measured: seven panels come back empty and between them the page
   loses 703px — the outbox, the rate table, the activation funnel, the
   sessions list, the report status and two spend lines.

   A floor under #content would only pad the bottom; the panels that empty are
   ABOVE the reader, so their card still jumps. The floor goes on the panels
   themselves. Nothing is enumerated: every element with an id is measured
   before the rebuild and any that comes back SHORTER is held at what it had,
   so a panel added later is covered without anyone remembering this. Each
   floor is released the moment its panel is filled — a mutation, not a
   guess — with a timer only as the backstop for an answer that never lands. */
const SET_HOLD_MS = 4000;
function settingsHeightsBefore(){
  /* Only when this page is being REBUILT. Arriving from another view, the
     heights in front of us belong to that view. */
  const page=document.getElementById('set-page'); if(!page) return null;
  const was={};
  page.querySelectorAll('[id]').forEach(el=>{ was[el.id]=el.offsetHeight; });
  return was;
}
function settingsHoldHeights(was){
  if(!was) return;
  const page=document.getElementById('set-page'); if(!page) return;
  page.querySelectorAll('[id]').forEach(el=>{
    const h=was[el.id];
    if(!h || el.offsetHeight>=h) return;
    el.style.minHeight=h+'px';
    let ob=null, tm=null;
    const done=()=>{ el.style.minHeight=''; if(ob) ob.disconnect(); if(tm) clearTimeout(tm); };
    if(typeof MutationObserver==='function'){
      ob=new MutationObserver(()=>{
        if(typeof requestAnimationFrame==='function') requestAnimationFrame(done); else done();
      });
      ob.observe(el,{childList:true,subtree:true,characterData:true});
    }
    tm=setTimeout(done,SET_HOLD_MS);
  });
}
/* The tick boxes carry their state in a border and a tint. Painted from the
   boxes themselves, so the label follows the tick in the same frame the reader
   clicked it — and the checkbox keeps focus, which a rebuild would take away. */
const settingsShapeBoxes = () => [...document.querySelectorAll('[data-ws-shape]')];
function settingsPaintShapeBoxes(){
  settingsShapeBoxes().forEach(b=>{
    const lab=b.closest('[data-ws-box]'); if(!lab) return;
    const on=b.checked?WS_BOX_ON:WS_BOX_OFF;
    lab.style.borderColor=on.line; lab.style.background=on.fill;
  });
}

/* ============================================================
   THE PAGE'S OWN FURNITURE
   ============================================================ */
/* Shared inline tokens. They were declared inside renderTeam(), which meant
   every drawer body that wanted a field had to restate them; one copy is one
   place a control's clothes are decided. */
const ST_INPUT='width:100%;height:var(--field-h);border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:0 var(--field-pad-x);font:inherit;font-size:var(--field-size);color:inherit;outline:none';
const ST_MONO='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:5px var(--s-2);font-family:var(--font-mono);font-size:var(--t-label);color:inherit;outline:none';
const ST_BTN='font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-body);padding:6px 14px;background:var(--color-accent);color:#fff;border:1px solid var(--color-accent);border-radius:var(--radius);cursor:pointer;white-space:nowrap';
const ST_BTN_SM='font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-meta);padding:5px var(--s-3);background:var(--color-accent);color:#fff;border:1px solid var(--color-accent);border-radius:var(--radius);cursor:pointer';
const ST_BTN2='display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-meta);padding:5px 11px;background:var(--color-surface);color:var(--accent-ink);border:1px solid var(--color-divider);border-radius:var(--radius);cursor:pointer';
const ST_BTN_DANGER='display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-meta);padding:5px 11px;background:var(--color-surface);color:var(--st-ruby-dot);border:1px solid var(--st-ruby-line);border-radius:var(--radius);cursor:pointer';
const ST_TAG='display:inline-flex;align-items:center;font-size:var(--t-label);font-weight:var(--w-strong);letter-spacing:.04em;padding:3px 10px;border-radius:var(--radius);background:var(--st-steel-bg);color:var(--st-steel-fg)';
const stLimitField=(id,label,sub,min)=>`<label style="display:block">
    <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.4">${label}<br><span style="color:var(--color-neutral-400)">${sub}</span></span>
    <input id="${id}" type="number" min="${min}" style="margin-top:3px;${ST_MONO}"/></label>`;

/* ---- WHAT A NON-ADMIN LOST, SAID OUT LOUD ----
   Closing this page to non-admins took two things away that had no new home
   and were not going to get one: it is a list rather than a silence, because a
   capability that disappears with nobody writing it down is a capability
   somebody rediscovers as a bug six months later. Everything else a non-admin
   could DO here moved to "Your account" (openMyAccount) and is proved to have
   arrived there by the parity test; these two are READ access, and read access
   to who-may-do-what is exactly what an admin-only page is for. */
const SET_CLOSURES=[
  { key:'roster', what:'A non-admin can no longer read the member list — who is in the workspace, what role each of them holds, which folders they may see, and whether contract values are hidden from them.' },
  { key:'rules',  what:'A non-admin can no longer read the workspace rules — the approval rules, whether internal review is on and on what condition, and whether the redlining desk is enforced. They still meet all three where they apply, in words, on the contract itself.' },
  /* 14 Aug 2026, with the legal identity's move onto Company & market. An
     Editor could change the registered name because it shared a route with the
     document design; it does not share a screen with it any more, and this is
     the name that appears on executed paper. The DESIGN is untouched — the
     logo, the accent colour and the layout are what that permission was for. */
  { key:'legal-identity', what:'An Editor can no longer change the company\'s registered name, registration number or address. Those moved to Settings → Platform settings → Company & market, which is admin-only, and the server refuses them for anybody else. The company design — logo, accent colour, layout — is unchanged and still theirs.' },
  /* 18 Oct 2026, the owner's yes to round 24's open question. */
  { key:'sidebar', what:'Nobody sets the left sidebar from a computer\'s Settings any more: a computer draws no left sidebar since the Counter and the desk tabs, so the switch had nothing to act on. The phone keeps its own switch in its menu.' },
];

/* WHERE EACH PANEL LIVES. Since the Control Room these are no longer tabs on
   screen but the HOMES the panels are filed under — the search, the drawer's
   crumb and the tests read them; the page draws two faces (ST_FACES). */
const ST_TABS=['people','platform','build','you'];
/* ---- THE CONTROL ROOM: TWO TABS, LIKE HOME'S (owner picked it by name, 16
   Oct 2026: "first one is for the individual and second for the admin. If you
   are not admin, this tab is invisible.") ----
   You is first and is where the page opens, as Home opens on its first tab;
   Company is the admin board. A non-admin is drawn You with no tab row at all.
   The server's wall is unchanged: hiding the tab is the screen agreeing with
   it. WHICH FACE IS UP is a working posture, per sitting, never stored. */
const ST_FACES=['you','company'];
let _stTab='you';
/* the old four names still arrive from doors and a refresh's stored place */
const stFaceOf=t=>(t==='you'||t==='company')?t:(ST_TABS.includes(t)?'company':'');
/* A door may ask for a specific panel — the go-live checklist's rows do, and so
   does the email banner's "Set it up". Consumed by the very next paint, exactly
   like the negotiation door's _rlDoorAsked. */
let _stWantPanel=null;
function settingsTab(){
  if(typeof isAdmin==='function' && !isAdmin()) return 'you';
  return ST_FACES.includes(_stTab)?_stTab:'you';
}
/* CHANGING TAB CLEARS THE SEARCH. The box searches every tab, so a query left
   standing would draw the same cross-tab result list under a tab the reader
   just chose — the tab press would look broken. */
/* AND IT LANDS AT THE TOP OF THE TAB IT OPENED. Until 18 Sep 2026 that came
   for free: the row scrolled with the page, so reaching a tab meant already
   being at the top. The row is pinned now (.st-page > .st-tabs, index.html —
   scoped, because Templates and Our standards wear the base row too), so a
   tab can be pressed from the bottom of seventeen panels — and a press that
   NAVIGATES may land at the top, which this one does: it is four different
   pages of settings and it already clears the search. */
/* A REFRESH LANDS WHERE YOU WERE (Young, 28 Sep 2026): what this page keeps
   across a reload, read by placeSave and put back by placeResume (js/app.js)
   BEFORE the first paint. */
function settingsPlace(){ return { tab:_stTab, side:_stSide, page:_stPage||null, stream:(_stPage==='streams'&&_stSwPick)||null, dock:(_stPage==='panel'&&_stDock)||null, fold:!!_stSideFold }; }
function settingsPlacePut(p){ const f=p&&stFaceOf(p.tab); if(f) _stTab=f;
  if(p && (p.side==='jambo'||p.side==='menu')) _stSide=p.side;
  /* a page inside the board (Team, Who holds what) comes back too */
  _stPage=(p && ST_PAGES.includes(p.page))?p.page:null;
  /* and the stream shown beside Contract streams, and a folded panel (round 26) */
  _stSwPick=(p && _stPage==='streams' && p.stream)?String(p.stream):null;
  /* …and a card's door opened as its page (the gaps' third pass) */
  _stDock=(p && _stPage==='panel' && p.dock)?String(p.dock):null;
  if(_stPage==='panel' && !_stDock) _stPage=null;
  _stSideFold=!!(p && p.fold); }
function settingsGoTab(k){
  const f=stFaceOf(k); if(!f) return;
  stDockLeave();
  /* a tab press lands on the board; the old People tab's name lands on Team */
  _stPage=(k==='people')?'team':null; _stSwPick=null;
  _stTab=f; _stQuery=''; renderTeam(); stLandTop();
}
/* THE ONE NAMED DOOR IN. Everything that wants to land somewhere specific on
   this page goes through it, so there is one place that knows the page is
   admin-only and one place that knows how a tab and a panel are asked for. */
function openSettingsAt(tab, panel){
  if(typeof isAdmin==='function' && !isAdmin()){ openMyAccount(); return; }
  /* a company panel's named door is its page, as a card's door is
     (stDockable, the gaps' fourth pass) */
  if(panel && stDockable(panel)){ stDockOpen(panel, null); return; }
  const f=stFaceOf(tab); if(f) _stTab=f;
  /* People is a page inside the board now (Team); any other door lands on
     the board itself */
  _stPage=(tab==='people')?'team':null;
  _stWantPanel=panel||null;
  if(typeof setView==='function') setView('team'); else renderTeam();
  /* ---- A NAMED DOOR LANDS AT THE TOP OF WHAT IT OPENS ----
     (owner-reported 19 Aug 2026: "when I click on the settings and rules
     button, the landing page it takes me to I land at the bottom of the page
     and have to scroll up to see what is on the page.")

     setView keeps the reader's scroll when the view it is asked for is the one
     already on screen — deliberately, and rightly: a save, a delete or a
     background response that repaints must not throw somebody back to the top.
     But this is not a repaint. It is a door with a name on it, pressed from the
     account drawer (which opens over any page, this one included), so "you are
     already here" is exactly the case that lands the reader at the bottom of a
     page they have just asked to be shown.

     Written here rather than in setView, because setView cannot tell a
     navigation from a repaint and this function can: everything that arrives
     through it is a navigation. */
  stLandTop();
}
/* ONE READING OF "put the reader at the top of this page", with two callers:
   the named door above and a tab press. The frame is asked twice for the reason
   setView asks twice — the rebuild's shorter intermediate paint clamps the
   scroll, and the value has to be put back once the new frame has its height. */
function stLandTop(){
  const sc=(typeof document!=='undefined')&&document.getElementById('content-scroll');
  if(!sc) return;
  sc.scrollTop=0;
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ sc.scrollTop=0; });
}

/* ---------------- THE DRAWER ----------------
   It hangs off document.body, not off #content, for two reasons that are the
   same reason: it must survive a repaint of the page underneath it (the market
   card's language redraw rebuilds #content), and "Your account" opens the same
   drawer from views that are not this page at all.

   ONE VALUE, not a map: which panel is open, or none. */
let _stOpen=null;          // panel key, 'person:<id>', 'person:new', or 'account'
let _stDrawerWired=false;
function stDrawerHost(){
  let d=document.getElementById('st-drawer');
  if(d) return d;
  /* a docked drawer that went with its page leaves its scrim behind: one */
  let scrim=document.getElementById('st-scrim');
  if(!scrim){ scrim=document.createElement('div');
    scrim.id='st-scrim'; scrim.className='st-scrim'; scrim.setAttribute('hidden','');
    document.body.appendChild(scrim); }
  const el=document.createElement('aside');
  el.id='st-drawer'; el.className='st-drawer'; el.setAttribute('hidden','');
  el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.setAttribute('aria-labelledby','st-drawer-title');
  el.innerHTML=`<div class="st-dhead" id="st-dhead"></div>
    <div class="st-dbody" id="st-dbody"></div>
    <div class="st-dfoot" id="st-dfoot"></div>`;
  document.body.appendChild(el);
  return el;
}
/* ONE delegated set, armed once on document. The drawer's insides are rebuilt
   on every open, so a listener bound to an element inside it would die with the
   element — and one bound per open would stack one per press. */
function stWireDrawerOnce(){
  if(_stDrawerWired) return; _stDrawerWired=true;
  document.addEventListener('click',e=>{
    const t=e.target;
    if(!t||!t.closest) return;
    if(t.closest('#st-scrim')){ stDrawerClose(); return; }
    if(t.closest('[data-st-dclose]')){ stDrawerClose(); return; }
    /* THE CONTROL ROOM'S DOORS (16 Oct 2026) — each one opens, shows or
       readies; none of them writes */
    const stage=t.closest('[data-st-stage]');
    if(stage){ const [id,amt]=String(stage.getAttribute('data-st-stage')||'').split('|'); stJbStage(id, Number(amt)); return; }
    const ask=t.closest('[data-st-jb-ask]');
    if(ask){ stSideSet('jambo'); stJbAsk(ask.getAttribute('data-st-jb-ask')); return; }
    const askA=t.closest('[data-st-ask-admin]');
    if(askA){ stAskSend(askA.getAttribute('data-st-ask-admin'), askA.getAttribute('data-st-ask-panel')||''); return; }
    const ansA=t.closest('[data-st-ask-answer]');
    if(ansA){ stAskAnswer(ansA.getAttribute('data-st-ask-answer'), ansA.getAttribute('data-st-ask-to')); return; }
    const askf=t.closest('[data-st-jb-askfor]');
    if(askf){ const qt=stJbLog().find(x=>String(x.id)===askf.getAttribute('data-st-jb-q-id')); stAskFrom(askf.getAttribute('data-st-jb-askfor'), qt?qt.q:''); return; }
    const why=t.closest('[data-st-jb-why]');
    if(why){ stJbWhyRun(why.getAttribute('data-st-jb-why')); return; }
    const drop=t.closest('[data-st-jb-drop]');
    if(drop){ stJbDrop(drop.getAttribute('data-st-jb-drop')); return; }
    const side=t.closest('[data-st-side]');
    if(side){ stSideSet(side.getAttribute('data-st-side')); return; }
    /* the side panel folds to the edge; his face brings him back (as drawn) */
    if(t.closest('[data-st-side-fold]')){ stSideFoldSet(!_stSideFold); return; }
    if(t.closest('[data-st-talk]')){ if(stTalkShows()) stTalkBack(); else stTalkReopen(); return; }
    if(t.closest('[data-st-overview]')&&stTalkShows()){ stTalkBack(); return; }
    /* Data & backup's chips (round 26 as drawn): the PDF readied — the box
       says PDF and the Download button is lit; the press stays the reader's */
    if(t.closest('[data-st-tr-pdf]')){ stTrailReadyPdf(); return; }
    const say=t.closest('[data-st-jb-say]');
    if(say){ stJbSayFixed(say.getAttribute('data-st-jb-say'), say.textContent); return; }
    const you=t.closest('[data-st-you]');
    if(you){ stYouGo(you.getAttribute('data-st-you'), you.getAttribute('data-st-you-focus')||''); return; }
    const jump=t.closest('[data-st-jump]');
    if(jump){ const k=jump.getAttribute('data-st-jump'); settingsGoPage(k==='people'?'team':k); return; }
    /* THE COMPANY BOARD'S DOORS (16 Oct 2026, the full build): a page inside
       the board, a send, the rest of Needs you, the sheet as a file */
    const pg=t.closest('[data-st-page]');
    if(pg){ settingsGoPage(pg.getAttribute('data-st-page')); stPageLand(pg.getAttribute('data-st-land')); return; }
    /* a door to another page of HaTi (Jambo's agents: his house) */
    const vw=t.closest('[data-st-view]');
    if(vw){ if(typeof setView==='function') setView(vw.getAttribute('data-st-view')); return; }
    const rs=t.closest('[data-st-resend]');
    if(rs){ stResendInvite(rs.getAttribute('data-st-resend'), rs); return; }
    if(t.closest('[data-st-needs-all]')){ _stNeedsAll=!_stNeedsAll;
      const host=document.getElementById('st-att'); if(host){ const d=document.createElement('div'); d.innerHTML=stNeedsHtml(); if(d.firstElementChild) host.replaceWith(d.firstElementChild); }
      return; }
    if(t.closest('[data-st-sheet-csv]')){ stSheetCsv(); return; }
    if(t.closest('[data-st-backup]')){ settingsExportBackup(); return; }
    if(t.closest('[data-st-away-end]')){ stAwayEnd(); return; }
    /* ROUND 24 AS DRAWN (the gaps, 18 Oct 2026): a form opens in its row,
       your own copy is taken (and recorded), Ask an admin from the head or a
       row, and the stand-in's "Open it" — the worklist they answer */
    const rf=t.closest('[data-st-rform]');
    if(rf){ stRowFormOpen(rf.getAttribute('data-st-rform')); return; }
    if(t.closest('[data-st-rform-close]')){ stRowFormClose(); return; }
    const mc=t.closest('[data-st-mycopy]');
    if(mc){ stMyCopyDownload(mc); return; }
    const ah=t.closest('[data-st-ask-head]');
    if(ah){ stAskGeneral(ah.getAttribute('data-st-ask-head')||''); return; }
    /* the stand-in's Open it: the worklist, ON the approval that waits (LAND ON IT) */
    const ao=t.closest('[data-st-away-open]');
    if(ao){ const id=ao.getAttribute('data-st-away-open')||'';
      if(id){ if(typeof apSetTab==='function') try{ apSetTab('approvals'); }catch(_){} if(typeof apShowRow==='function') try{ apShowRow(id); }catch(_){} if(typeof insSelect==='function') insSelect('approvals', id); }
      if(typeof setView==='function') setView('approvals');
      if(id && typeof landOn==='function') landOn(`[data-ap-row="${String(id).replace(/["\\]/g,'')}"][data-ap-kind="approval"]`,{ block:'nearest' });
      return; }
    const row=t.closest('[data-st-panel]');
    if(row){ const k=row.getAttribute('data-st-panel');
      /* a card's door (and its facts, and the ladder's) opens the panel as
         its page; Needs your attention and the sheet keep the drawer */
      if(row.hasAttribute('data-st-dock') && k!=='trail' && k!=='backup' && stIsAdmin()){
        const card=row.closest('[data-st-card]'), kind=['st-door','st-fact','st-gov-g'].find(c=>row.classList.contains(c))||'';
        stDockOpen(k, card?{ card:card.getAttribute('data-st-card'), kind }:null); stDrawerFocus(row.getAttribute('data-st-focus')); return; }
      /* the Menu's rows and Jambo's Open are doors too: the panel is its
         page, and the way back lands on the row or the card that was pressed */
      const turn=row.closest('[data-st-jb-turn]');
      if((row.classList.contains('st-mrow') || turn) && stDockable(k)){
        const sel=turn?`[data-st-jb-turn="${PB_ATTR(turn.getAttribute('data-st-jb-turn'))}"] [data-st-panel="${PB_ATTR(k)}"]`:`#set-page .st-mrow[data-st-panel="${PB_ATTR(k)}"]`;
        stDockOpen(k, { sel }); stDrawerFocus(row.getAttribute('data-st-focus')); return; }
      stDrawerOpen(k); stDrawerFocus(row.getAttribute('data-st-focus')); return; }
    const tab=t.closest('[data-st-tab]');
    if(tab){ settingsGoTab(tab.getAttribute('data-st-tab')); return; }
  });
  /* "/" IN JAMBO'S BOX IS EVERY BOX'S "/" (JAMBO, THE SAME ON EVERY PAGE,
     main's rule of 18 Oct 2026): data-ca-slash lists the places (caSlRead),
     as on Home. The lane's own "/" → the Menu (18 Oct) gave way to it in the
     gaps' third pass; the whole list of settings is the bar's finder (⌘K,
     stFind) and Jambo's "Open the Menu" where he finds nothing. */
  /* Jambo's box: Enter or Ask. A form so the keyboard's own Go works on an
     iPad; nothing leaves the page. */
  document.addEventListener('submit',e=>{
    const f=e.target;
    if(!f || f.id!=='st-jb-form') return;
    e.preventDefault();
    const box=document.getElementById('st-jb-q');
    const q=(box&&box.value||'').trim(); if(!q) return;
    box.value='';
    stJbBoxAsk(q,{ typed:true });
  });
  /* A dialog opened from inside the drawer owns Escape while it is up: one
     key closes the top layer only, never the drawer underneath as well. */
  /* Escape closes the drawer — and on a card's page goes back to Settings,
     landing on its door, as ‹ Settings does */
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && _stOpen
    && !document.querySelector('#modal-root [role="dialog"],[data-top-overlay]')) stDrawerClose(); });
  document.addEventListener('keydown',e=>{ if(e.key!=='Escape' || !_stRow || _stOpen) return;
    const host=document.getElementById('st-rform');
    if(host && e.target && host.contains(e.target) && !document.querySelector('#modal-root [role="dialog"]')){ const k=_stRow.key; stRowFormClose();
      document.querySelector(`#set-page [data-st-rform="${k}"]`)?.focus(); } });
}
/* The keyboard's way out of the drawer, held so the close can hand it back.
   One value, because only one drawer is ever open. */
let _stTrap=null;
function stDrawerClose(){
  /* A FORM OPEN IN ITS ROW is closed by the same word its save already says
     (round 24 as drawn: the saves that close the drawer close the row) */
  if(_stRow && !_stOpen){ stRowFormClose(); return; }
  /* a docked drawer is a page: its Done, Cancel or Save go back to Settings */
  if(stDrawerDocked()){ stDockBack(); return; }
  _stOpen=null;
  const d=document.getElementById('st-drawer'), s=document.getElementById('st-scrim');
  /* RELEASE FIRST, WHILE THE DRAWER IS STILL THERE. The trap puts focus back
     on the row that opened it, and this drawer is dismissed by hiding rather
     than by tearing out — so releasing after the hide would move focus into an
     element the browser has just stopped drawing. */
  if(_stTrap){ try{ _stTrap(); }catch(e){} _stTrap=null; }
  if(d){ d.classList.remove('open'); d.setAttribute('hidden',''); }
  if(s){ s.classList.remove('open'); s.setAttribute('hidden',''); }
}
/* Build the drawer from a descriptor. `foot` is the honest half of this:
   'save' draws Save & close + Cancel and the panel writes nothing until the
   press; 'done' draws one Done, because that panel has already written every
   answer as it was given — which is a rule this product keeps deliberately for
   its gates and must not be papered over with a button that does nothing. */
function stDrawerPaint(d){
  stWireDrawerOnce();
  /* one form at a time: a drawer opening closes a form open in its row */
  if(_stRow) stRowFormClose();
  const el=stDrawerHost(), scrim=document.getElementById('st-scrim');
  const glyph=d.glyph||'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>';
  /* A PERSON'S DRAWER WEARS THEIR INITIALS (SAP pop-ups, 10 Oct 2026, the
     drawing): the same badge the People table draws, beside the name. */
  const head=d.avatar
    ? `<div class="rvd-head"><span class="st-dav" aria-hidden="true">${esc(d.avatar)}</span><span class="rvd-htxt"><h2 class="rvd-title">${esc(d.title)}</h2>${d.sub?`<p class="rvd-sub">${esc(d.sub)}</p>`:''}</span></div>`
    : (typeof reviewDialogHeadHtml==='function')
    ? reviewDialogHeadHtml(glyph, d.title, d.sub||'')
    : `<h2 class="rvd-title" id="st-drawer-title">${esc(d.title)}</h2>${d.sub?`<p class="rvd-sub">${esc(d.sub)}</p>`:''}`;
  /* ---- THE DRAWER SAYS WHERE YOU ARE ---- (owner-approved 18 Sep 2026)
     Every one of the two dozen panels opens this same drawer, and it opened
     with a title and nothing else: no way of telling which part of the product
     the panel governs, and no sense that setting a workspace up is a path
     rather than two dozen round trips through one list. The group's name and
     the position in it are both readings this page already has. Additive: the
     person drawer and the account drawer pass no place and are byte-identical. */
  const place=d.place;
  /* A PAGE INSIDE A PANEL SAYS WHICH PANEL IT CAME FROM, and the name is the
     way back (a stream's page → ‹ Contract folders, 17 Oct 2026) */
  const crumb=d.back
    ? `<div class="st-dcrumb">
         <button type="button" class="st-dback" ${d.back.close?'data-st-dclose':`data-st-panel="${PB_ATTR(d.back.key)}"`}>‹ ${esc(d.back.label)}</button>
         ${d.back.group?`<span class="st-dcrumb-sep" aria-hidden="true">·</span><span class="st-dcrumb-g">${esc(d.back.group)}</span>`:''}
       </div>`
    : place
    ? `<div class="st-dcrumb">
         <span class="st-dcrumb-g">${esc(i18t('st_grp_'+place.group))}</span>
         <span class="st-dcrumb-sep" aria-hidden="true">›</span>
         <span class="st-dcrumb-n">${esc(i18t('st_panel_pos',{n:place.n,total:place.total}))}</span>
       </div>` : '';
  document.getElementById('st-dhead').innerHTML=
    `${crumb}${head}<button class="st-dx" data-st-dclose title="${esc(i18t('st_close_drawer'))}" aria-label="${esc(i18t('st_close_drawer'))}">${icon('x')}</button>`;
  const ttl=el.querySelector('.rvd-title'); if(ttl && !ttl.id) ttl.id='st-drawer-title';
  if(ttl && d.badge) ttl.insertAdjacentHTML('beforeend', d.badge);
  document.getElementById('st-dbody').innerHTML=d.body||'';
  /* THE REFUSAL SITS IN THE FOOT, NOT AT THE TOP OF THE BODY, and that is a
     measured decision rather than a layout preference. Put above the fields it
     pushed everything under it down by 46px the moment it appeared and pulled
     it back up when it cleared — which is the exact fault the settings page was
     rebuilt to stop (settings-holds-still-verify). In the foot it is pinned, so
     it cannot be scrolled away from either, and the control the reader just
     pressed does not move under their hand. */
  /* ---- AND IT OFFERS THE NEXT DOOR ---- (owner-approved 18 Sep 2026)
     The panel after this one in the same group, so an admin working through a
     group does not close, hunt and open four times. It carries data-st-panel,
     which is the door every row already presses, so there is ONE way a panel
     is opened and this cannot drift from the list.
     NOT DRAWN ON A PANEL THAT SAVES ON A PRESS. Twenty-three of the two dozen
     write as the reader changes them and their foot is a Done; exactly one
     holds typed edits until Save, and a link that quietly threw those away
     because it sat beside the button is not a convenience. */
  const nextKey=(d.foot!=='save' && place && place.next && SET_PANELS[place.next]) ? place.next : '';
  const nextBtn=nextKey
    ? `<button class="st-dnext" data-st-panel="${nextKey}">${esc(i18t('st_next',{name:SET_PANELS[nextKey].title()}))}</button>`
    : '';
  document.getElementById('st-dfoot').innerHTML =
    `<div id="st-drawer-refusal" class="st-refusal" hidden></div>
     <div class="st-dfoot-acts">${nextBtn}${d.foot==='save'
      ? `<button class="ui-btn ui-btn-primary" id="st-dsave">${i18t('act_save')}</button>${d.footExtra||''}
         <button data-dlg-cancel class="ui-btn" data-st-dclose>${i18t('act_cancel')}</button>`
      : `<button class="ui-btn ui-btn-primary" data-st-dclose>${i18t('st_done')}</button>`}</div>`;
  /* DOCKED, IT IS A PAGE (round 25 as drawn, the gaps' third pass): placed
     in the page's main column, no scrim, no trap — the reader may go on to
     Jambo beside it; the panel it shows is the page's (_stDock) */
  const dock=stDockHost();
  if(dock){
    _stDock=_stOpen||_stDock;
    if(_stTrap){ try{ _stTrap(); }catch(_){ /* nothing held */ } _stTrap=null; }
    el.classList.add('is-docked','open'); el.setAttribute('role','region'); el.removeAttribute('aria-modal');
    dock.appendChild(el); el.removeAttribute('hidden');
    if(scrim){ scrim.classList.remove('open'); scrim.setAttribute('hidden',''); }
    const pg=document.querySelector('#set-page [data-st-pg="panel"]'); if(pg) pg.setAttribute('data-st-dock-key', _stDock||'');
    const w=document.getElementById('st-side-word'); if(w) w.textContent=stSideWord();
  } else {
  if(el.classList.contains('is-docked')){ el.classList.remove('is-docked','open'); el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); document.body.appendChild(el); }
  el.removeAttribute('hidden'); if(scrim) scrim.removeAttribute('hidden');
  /* The class flip is what animates; it has to land on a frame after the
     element stops being hidden or the transition has nothing to run from. */
  const show=()=>{ el.classList.add('open'); if(scrim) scrim.classList.add('open'); };
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(show); else show();
  }
  /* ---- THE KEYBOARD STAYS IN THE DRAWER ---- (25 Aug 2026)
     Measured before this: the drawer opened over a dimmed page and Tab walked
     straight out of it into the settings rows behind — which a sighted reader
     watches happen with nothing visibly moving, and a screen-reader user
     cannot follow at all. One shared trap, published from core.js; read
     through window because this is a module and a bare cross-module read
     throws rather than falling through. */
  if(!dock){
    if(_stTrap){ try{ _stTrap(); }catch(e){} _stTrap=null; }
    if(typeof window.trapFocus==='function') _stTrap=window.trapFocus(el);
  }
  if(typeof d.wire==='function') d.wire();
  if(typeof window.popupControlsDress==='function') popupControlsDress(el);   /* SAP pop-ups: HaTi's dropdowns and dates */
  if(d.foot==='save' && typeof d.save==='function')
    document.getElementById('st-dsave')?.addEventListener('click',()=>d.save());
  if(!dock) try{ el.focus&&el.focus(); }catch(_){}
}
/* A REFUSAL IS SHOWN IN THE DRAWER, in words, beside the thing it refuses —
   never as a toast that appears over the page behind it and never silently. */
function stDrawerRefuse(msg){
  /* the refusal goes where the form is: the drawer, or the row it opened in */
  const r=document.getElementById((_stRow&&!_stOpen)?'st-rform-refusal':'st-drawer-refusal');
  if(!r){ if(window.toast) toast(msg,'err'); return; }
  /* ---- AND IT IS SPOKEN, NOT ONLY DRAWN ---- (25 Aug 2026)
     MEASURED by the UI audit: ZERO aria-live regions in the whole product. A
     refusal that appears silently in the foot of a drawer is a refusal a
     screen-reader user never learns about — they press Save, nothing happens,
     and there is nothing to go and read. 'assertive' rather than 'polite'
     because this is the answer to a press the reader has just made and is
     waiting on. Set on the ELEMENT rather than in the markup so it cannot be
     lost the next time this foot is rebuilt. */
  r.setAttribute('role','alert');
  r.setAttribute('aria-live','assertive');
  r.textContent=msg; r.removeAttribute('hidden');
}
function stDrawerClearRefusal(){ document.getElementById((_stRow&&!_stOpen)?'st-rform-refusal':'st-drawer-refusal')?.setAttribute('hidden',''); }
function stDrawerOpen(key){
  if(key==='account'){ openMyAccount(); return; }
  if(String(key||'').indexOf('person:')===0){ settingsPersonDrawer(String(key).slice(7)); return; }
  /* A BUSINESS ROLE'S OWN DRAWER (piece 6) */
  if(String(key||'').indexOf('role:')===0){ const d=stBzRoleDrawer(String(key).slice(5)); if(d){ _stOpen=key; stDrawerPaint(d); } return; }
  /* THE BOARD'S OWN DRAWERS (16 Oct 2026, the full build): everyone's
     signing limits at once, the rules still off, a colleague's ask, and each
     of the reader's own settings (the You cards' doors) */
  /* DATA & BACKUP IS A PAGE (round 26, "The SAP way", 17 Oct 2026): every
     door that named the drawer lands on the page, on the tab it asked for */
  /* ONE NAME, ONE LANDING (the gaps' third pass): every door that says
     "Data & backup" — the card's, the Menu's, ⌘K's — opens the page on its
     first tab, The trail; a door that says "The trail" lands there too */
  if(key==='trail'){ _stBkWant='trail'; key='backup'; }
  if(key==='backup'){ settingsGoPage('data'); return; }
  if(key==='limits'){ _stOpen=key; stDrawerPaint(stLimitsDrawer()); return; }
  if(key==='gates'){ _stOpen=key; stDrawerPaint(stGatesDrawer()); return; }
  if(String(key||'').indexOf('ask:')===0 && typeof stAskDrawer==='function'){ const d=stAskDrawer(String(key).slice(4)); if(d){ _stOpen=key; stDrawerPaint(d); } return; }
  if(String(key||'').indexOf('me:')===0 && typeof stMeDrawer==='function'){ const d=stMeDrawer(String(key).slice(3)); if(d){ _stOpen=key; stDrawerPaint(d); } return; }
  /* A STREAM'S OWN PAGE (17 Oct 2026): who may open it */
  /* stream:<fid>, or stream:<fid>@<tab> to open it on a tab (Keeping, from Needs you) */
  if(String(key||'').indexOf('stream:')===0){ const [fid,tab]=String(key).slice(7).split('@'); const d=stStreamDrawer(fid,tab); if(d){ _stOpen=key; stDrawerPaint(d); } return; }
  const p=SET_PANELS[key]; if(!p) return;
  _stOpen=key;
  stDrawerPaint({ title:p.title(), sub:p.sub?p.sub():'', foot:p.foot||'done', glyph:p.glyph,
    body:p.body(), wire:p.wire, save:p.save, place:stPanelPlace(key) });
}

/* ---------------- ROWS, GROUPS, SEARCH ----------------
   A row states what the setting IS right now: a status dot, the name, one line
   of current state, a chip, and — only where it is still owed — that it is
   required.

   SEVENTEEN EQUAL ROWS READ AS NONE (owner-approved 18 Sep 2026 off the
   "HaTi — Design Direction" canvas). This tab drew every platform panel at one
   height in one box, each ending in the same chevron and the same
   Mandatory / Optional tag, with no search and no order, so an admin looking
   for "who may sign" had no way in but reading all seventeen. Three answers,
   none of them a new screen: the panels are GROUPED under names, ONE BOX
   searches every panel on every tab, and the TAG gives way to the dot and the
   state line.

   THE TAG WAS ANSWERING THE WRONG QUESTION. Mandatory / Optional is a fact
   about the SETTING; the dot and the state line are facts about THIS
   WORKSPACE, which is what an admin came here to learn. So the tag is not
   deleted, it is NARROWED: "Required" prints on a mandatory panel nobody has
   answered and nowhere else, which is the only time that fact is worth a
   reader's attention. st_optional is left INERT in both books rather than
   removed, the way this codebase retires a sentence. */
const ST_DOT={ ok:'var(--st-green-dot)', warn:'var(--st-amber-dot)', off:'var(--color-neutral-400)', red:'var(--st-ruby-dot)' };
/* THE ORDER HERE IS THE ORDER ON SCREEN and the keys are STABLE ENGLISH, so a
   rename in either dictionary cannot move a panel. Panels inside a group keep
   SET_PANELS' own order. `sub` marks the two groups whose name does not say
   enough alone; the other five stay silent on purpose, because a caption under
   every heading is the wall of words this page already had. */
const ST_GROUPS=[
  { key:'agreement', tab:'platform', sub:true },
  /* ---- BEFORE ANYONE SIGNS (4 Oct 2026, the process review) ----
     The signing limit and the folder rule were two switches folded inside the
     approval rules' drawer, and the default signing route sat inside the
     check before signing — three rules nobody could find by their own name.
     Each is its own row now, and the four that decide HOW a contract gets to
     signed sit together; "The agreement" keeps the rules page and the three
     rules about who must say yes. Four and four: no group is a wall. */
  { key:'signing',   tab:'platform', sub:true },
  /* ---- LINKS YOU SEND (4 Oct 2026) ----
     Added for the named guest's code, and measured before it was: dropping
     that row into "The agreement" made a group of five, and settings-groups
     3.1c holds every group to four because a list you have to read twice is
     the wall the groups replaced. It is also the truer home. The three rules
     above it decide WHO MUST SAY YES before a step; this one decides WHO MAY
     OPEN what has already left the building — the other end of the same act,
     and where the rest of the sharing rules will go. */
  { key:'links',     tab:'platform', sub:true },
  { key:'standards', tab:'platform' },
  { key:'intake',    tab:'platform', sub:true },
  { key:'copilot',   tab:'platform' },
  /* THE COMPANY'S FACTS (Discover stage 4, 25 Oct 2026): their own group under Jambo's, so neither holds more than four */
  { key:'facts',     tab:'platform', sub:true },
  { key:'house',     tab:'platform' },
  { key:'launch',    tab:'build' },
  { key:'plumbing',  tab:'build' }
];
/* How many rows the attention block draws before it counts instead. A block
   that can grow to seventeen is the wall it was built to replace. */
const ST_ATTENTION_MAX=4;
let _stQuery='';

/* EVERY PANEL THAT IS DRAWN AT ALL. show() is the panel's own answer and is
   asked HERE, once, so the groups, the search and the attention block cannot
   disagree about which panels exist. A null tab means every tab. */
function stPanelKeys(tab){
  return Object.keys(SET_PANELS).filter(k=>{
    const p=SET_PANELS[k];
    if(tab && p.tab!==tab) return false;
    return !p.show || p.show();
  });
}
function stGroupsFor(tab){ return ST_GROUPS.filter(g=>g.tab===tab); }
/* NOTHING IS EVER DROPPED. A panel added tomorrow with no group, or with one
   that is not on its own tab, lands in the LAST group of its tab rather than
   vanishing off the page — the fault f170 exists to catch on the contract
   room's tabs, in this page's costume. */
function stGroupKeyOf(key, tab){
  const p=SET_PANELS[key]; if(!p) return '';
  const gs=stGroupsFor(tab||p.tab); if(!gs.length) return '';
  return gs.some(g=>g.key===p.group) ? p.group : gs[gs.length-1].key;
}
function stPanelsInGroup(tab, gkey){
  return stPanelKeys(tab).filter(k=>stGroupKeyOf(k,tab)===gkey);
}
/* WHERE A PANEL SITS IN ITS GROUP. The drawer prints it, so setting the
   workspace up reads as a path rather than as seventeen round trips. */
function stPanelPlace(key){
  const p=SET_PANELS[key]; if(!p||!p.tab) return null;
  const gkey=stGroupKeyOf(key); if(!gkey) return null;
  const keys=stPanelsInGroup(p.tab,gkey);
  const i=keys.indexOf(key); if(i<0) return null;
  return { group:gkey, n:i+1, total:keys.length, next:keys[i+1]||null };
}
/* A PANEL'S OWN READING, ASKED SAFELY. The attention block and the search ask
   panels on tabs that are not open, whose server-filled data may not have
   landed; a throw there would blank the whole page, so it is caught and the
   panel simply is not counted. The row builder below is deliberately NOT
   guarded — that is today's behaviour on the open tab and not this change's
   business. READING MUST NOT WRITE: every state() in SET_PANELS is a reader. */
function stStateOf(key){
  const p=SET_PANELS[key]; if(!p||!p.state) return null;
  try{ return p.state()||null; }catch(e){ return null; }
}
/* WHAT WANTS A DECISION, ACROSS EVERY TAB — a panel asking for something (its
   own reading says 'warn'), or one that must be answered and has not been. It
   reads every tab on purpose: the panel that stops mail leaving the building
   lives under Build & launch, and an admin standing on Platform settings had
   no way of learning that from this screen. */
function stAttentionKeys(){
  return stPanelKeys(null).filter(k=>{
    const st=stStateOf(k); if(!st) return false;
    if(st.dot==='warn') return true;
    return !!SET_PANELS[k].mandatory && st.dot!=='ok';
  });
}
/* THE EXACT-WORDS BOX (stSearchHits) WENT WITH ONE SEARCH IN PLAIN WORDS
   (16 Oct 2026): every box asks stFind now, which also finds a setting by
   the words people use for it. */
function stRowHtml(key, opts){
  const p=SET_PANELS[key]; if(!p) return '';
  const st=p.state?p.state():{dot:'off',text:''};
  const chip=p.chip?p.chip():'';
  /* NOT ESCAPED, AND NEVER HAS BEEN: several panels build this line out of
     already-escaped parts joined with ' · '. */
  const stateLine=st.text||'';
  const need=!!p.mandatory && st.dot!=='ok';
  /* WHERE IT LIVES is the CARD it sits on in the Control Room — its group —
     since the tabs it used to name became one board (16 Oct 2026). */
  const gk=(opts&&opts.where)?stGroupKeyOf(key):'';
  const where=(opts&&opts.where)
    ? `<span class="st-row-where">${esc(gk?i18t('st_grp_'+gk):i18t('st_tab_'+p.tab))}</span>` : '';
  return `<button class="st-row" data-st-panel="${key}">
    <span class="st-dot" style="background:${ST_DOT[st.dot]||ST_DOT.off}"></span>
    <span class="st-row-main">
      <span class="st-row-name">${esc(p.title())}</span>
      <span class="st-row-state">${stateLine}</span>
    </span>
    ${where}
    ${chip?`<span class="st-row-chip">${chip}</span>`:''}
    ${need?`<span class="st-row-tag" data-req="1">${esc(i18t('st_required'))}</span>`:''}
    <span class="st-row-go" aria-hidden="true">›</span>
  </button>`;
}
/* THE GROUP LIST, THE ATTENTION ROWS AND THE DOT LEGEND WENT WITH THE
   BOARD AS DRAWN (16 Oct 2026): a group is a card (stGroupCardHtml), what is
   owed is Needs you (stNeedsHtml, still id st-att), and the dots are read on
   the facts they sit beside. st_legend_* stay INERT in both books. */
/* THE MENU'S LIST (the Control Room's side panel, 16 Oct 2026): every setting
   the reader may reach, in the board's own order — You first, then People and
   each group — or, while the box holds words, what they find across all of
   it. A row is a door: a panel opens its drawer, a You row shows its card, a
   person opens their drawer. A non-admin is offered their own settings only. */
function stListHtml(){
  const q=_stQuery.trim();
  if(q){
    const hits=stMenuHits(q);
    if(!hits.length) return `<p class="st-none">${esc(i18t('st_search_none',{q:q}))}</p>`;
    return `<p class="st-found">${esc(i18tn('st_search_found',hits.length,{n:hits.length}))}</p>
      <div class="st-mrows">${hits.map(h=>stMenuItemHtml(h,true)).join('')}</div>`;
  }
  const grp=(name,items)=>items.length?`<section class="st-mgrp"><h3 class="st-mgrp-h">${esc(name)}</h3>
    <div class="st-mrows">${items.map(h=>stMenuItemHtml(h,false)).join('')}</div></section>`:'';
  const out=[grp(i18t('st_face_you'), stYouItems().map(it=>({you:it.key})))];
  if(stIsAdmin()){
    out.push(grp(i18t('st_cr_people'), [{jump:'team'},{jump:'sheet'}]));
    stCompanyGroups().forEach(g=>out.push(grp(i18t('st_grp_'+g.key),
      stPanelsInGroup(g.tab,g.key).map(k=>({panel:k})))));
  }
  return out.join('');
}
/* How many settings the box searches — the reader's own, plus every panel
   and the People table for an admin. */
function stMenuCount(){
  return stYouItems().length + (stIsAdmin()?stPanelKeys(null).length+1:0);
}
function stRowsHtml(){
  return `<div class="st-search st-menu-search">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
      <label class="sr-only" for="st-q">${esc(i18t('st_search_label'))}</label>
      <input id="st-q" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(i18t('st_find_menu_ph',{n:stMenuCount()}))}" value="${esc(_stQuery)}">
    </div>
    <div id="st-list" class="st-menu">${stListHtml()}</div>`;
}
/* THE PAGE HOLDS STILL. Only the list is rebuilt — never renderTeam(), which
   empties seven server-filled panels and would take the caret out of the box
   on every keystroke. Bound once per element, because the box survives a list
   repaint and a rebound listener would fire twice per key. */
function stPaintList(){
  const host=document.getElementById('st-list');
  if(host) host.innerHTML=stListHtml();
}
function stWireList(){
  const box=document.getElementById('st-q');
  if(!box || box.dataset.stQBound) return;
  box.dataset.stQBound='1';
  box.addEventListener('input',()=>{ _stQuery=box.value||''; stPaintList(); });
}
/* ONE ROW, REPAINTED WHERE IT STANDS. A row states what the setting IS right
   now, so a panel that has just written something has to refresh the row behind
   the drawer — and it must not do that with renderTeam(), which rebuilds the
   whole screen and empties seven server-filled panels (THE SETTINGS PAGE HOLDS
   STILL). Nothing else on the page moves: the replacement is the same markup
   from the same builder, in the same box. */
/* THE OPEN DRAWER'S BODY, REPAINTED IN PLACE, for a panel whose body is a
   LIST somebody is adding rows to. stDrawerOpen would work, but it rebuilds
   the head and the foot too and moves the focus — and THE SETTINGS PAGE HOLDS
   STILL is the standing rule: patch what changed, never redraw around it. */
function stRepaintPanel(key){
  const p=SET_PANELS[key]; if(!p) return;
  const host=document.getElementById('st-dbody'); if(!host) return;
  host.innerHTML=p.body();
  if(typeof p.wire==='function') p.wire();
}
/* EVERY INSTANCE OF THE ROW, not the first one. Since the attention block a
   panel can be drawn TWICE — once at the top and once in its own group — and
   querySelector answers in document order, so repainting only the first left
   the group's copy showing what the setting used to be. The attention copy
   names its tab and the group copy does not, so each is rebuilt in its own
   shape, read off where it actually sits. */
function stRepaintRow(key){
  if(!SET_PANELS[key]) return;
  const rows=[...document.querySelectorAll(`.st-row[data-st-panel="${key}"]`)];
  rows.forEach(el=>{
    const where=!!el.closest('.st-att');
    const d=document.createElement('div'); d.innerHTML=stRowHtml(key,{where});
    const next=d.firstElementChild; if(next) el.replaceWith(next);
  });
  /* the Menu's copy of the row, in its own shape */
  document.querySelectorAll(`.st-mrow[data-st-panel="${key}"]`).forEach(el=>{
    const d=document.createElement('div'); d.innerHTML=stMenuItemHtml({panel:key}, !!el.querySelector('.st-mrow-g'));
    const next=d.firstElementChild; if(next) el.replaceWith(next);
  });
  stSyncAttention();
}
/* A ROW THAT HAS BEEN SETTLED LEAVES THE BLOCK. Without this the heading goes
   on saying a panel wants a decision while the row under it draws a green dot
   saying it does not — one screen disagreeing with itself, which is this
   codebase's most expensive fault class. Only rows are taken OUT, never added,
   so nothing appears under the reader's hand; the full membership is worked
   out again on the next paint of the page. */
function stSyncAttention(){
  stCrSync();
  const host=document.getElementById('st-att'); if(!host) return;
  const rows=stNeedsAll(), keep=new Set(rows.map(r=>r.key));
  [...host.querySelectorAll('.st-need[data-st-need]')].forEach(el=>{
    if(!keep.has(el.getAttribute('data-st-need'))) el.remove();
  });
  const n=host.querySelector('.st-needs-n'); if(n) n.textContent=String(rows.length);
  /* THE NUMBER ON A DOOR IS THE LIST BEHIND IT (the gaps of 18 Oct 2026):
     "N more" counts the rows the list holds and does not draw, never the
     rows it held when the page was painted */
  const drawn=host.querySelectorAll('.st-need[data-st-need]').length, more=host.querySelector('.st-need-more');
  if(more){ const rest=rows.length-drawn;
    if(_stNeedsAll) { if(rows.length<=ST_ATTENTION_MAX) more.remove(); }
    else if(rest>0) more.textContent=i18tn('st_needs_more',rest,{n:rest});
    else more.remove(); }
  if(!drawn) host.remove();
  stJbHelloSync();
  if(typeof setTimeout==='function') setTimeout(stClashSeenSync,0);
}
/* JAMBO SAYS THE SAME LIST (round 25 as drawn: "Three things need you
   here: …" beside "Needs your attention 3"): his first words and his first
   chip are read again whenever the list loses a row */
function stJbHelloSync(){
  if(typeof document==='undefined') return;
  if(!(stIsAdmin()&&settingsTab()==='company'&&!_stPage)) return;
  /* the Overview's head sentence (The Legora Way, 26 Oct 2026), dressed again by the one builder */
  const head=document.querySelector('#st-jb-feed [data-st-jb-hello]');
  if(head&&typeof jamboOverviewHtml==='function'){ const d=document.createElement('div');
    d.innerHTML=jamboOverviewHtml({ head:{ html:esc(stJbCompanyWords()) }, headAttr:'data-st-jb-hello' },'st-h');
    const p=d.querySelector('[data-st-jb-hello]'); if(p&&head.textContent!==p.textContent) head.innerHTML=p.innerHTML; }
  const chip=document.querySelector('#st-jb-feed [data-st-jb-first]');
  if(chip){ const d=document.createElement('div'); d.innerHTML=stJbFirstChipHtml().replace('class="st-jb-chip"','class="st-jb-chip jov-lnk is-ask"');
    const next=d.firstElementChild; if(next) chip.replaceWith(next); else chip.remove(); }
}

/* ============================================================
   THE CONTROL ROOM (owner picked it by name off "Settings, Three Ways",
   16 Oct 2026, then asked for You and Company as two tabs like Home's)
   ============================================================
   Settings is a board, as Home is. Company: what needs you first, then every
   group of settings as a card whose rows ARE the rows (stRowHtml — one
   builder, dressed by where it sits), the People & access card, the
   governance ladder read off the gates' own dots, and the People table. You:
   the reader's own settings as cards, the controls on them. Beside both, one
   panel with two faces — Jambo, who finds a setting or a person and opens it,
   and the Menu, the whole list behind one search box.
   NOTHING HERE WRITES. Every change is still made in the one drawer (or the
   one control on a You card) by the person who presses it; Jambo reads the
   same readings the rows read, spends nothing and saves nothing. */
const stIsAdmin=()=>!(typeof isAdmin==='function' && !isAdmin());
/* the Company board's groups, in ST_GROUPS' order: platform, then build */
const stCompanyGroups=()=>ST_GROUPS.filter(g=>g.tab==='platform'||g.tab==='build');

/* ---- THE TWO TABS, HOME'S SLIDING PILL ----
   One track, one width per tab (each button reserves every language's word,
   as Home's do, so switching language moves nothing), the white pill under
   the chosen one. Company carries the Needs-you count in amber — the number on
   the door is the length of the list behind it. */
function stFaceWordsHtml(f){
  const key='st_face_'+f, now=i18t(key);
  const all=(typeof LANGUAGES!=='undefined' && typeof STRINGS!=='undefined')
    ? LANGUAGES.map(l=>(STRINGS[l.id]||{})[key]).filter(Boolean) : [];
  const others=[...new Set(all)].filter(w=>w!==now);
  return `<span class="st-face-w"${others[0]?` data-w1="${esc(others[0])}"`:''}${others[1]?` data-w2="${esc(others[1])}"`:''}><span>${esc(now)}</span></span>`;
}
/* THE PAGE'S HEAD, AS DRAWN (rounds 24 and 25, the gaps of 18 Oct 2026):
   an admin reads "Settings · <the company>", the You · Company tabs under it;
   anybody else "Your settings · yours alone — nobody else sees them" with Ask
   an admin beside it (the tracked ask, as every ask).
   THE HEAD IS A CARD BESIDE JAMBO (the gaps' third pass, 19 Oct 2026, as
   drawn): it sits in the page's left column, over the board, and Jambo's
   panel is the whole right column from under the bar — so the window's own
   head steps aside on Settings (index.html, by scope) and this card says the
   page's name. ONE builder, painted with the page; stPaintHead only empties
   the window head's two slots so no second Ask an admin hides there. */
function stHeadCardHtml(admin, face){
  const org=(typeof getOrg==='function'&&getOrg())||{};
  const title=admin?i18t('pg_team'):i18t('st_you_head');
  const sub=admin?(org.name||''):i18t('st_you_head_sub');
  const ask=(!admin && typeof API_MODE==='function' && API_MODE())
    ?`<button type="button" class="ui-btn ui-btn-sm" data-st-ask-head="">${esc(i18t('st_ask_go'))}</button>`:'';
  return `<header class="st-headcard ph-card" id="st-headcard">
    <div class="st-hc-top ph-top"><h1 class="st-hc-t">${esc(title)}</h1>${sub?`<span class="st-head-sub" data-st-head-sub>${esc(sub)}</span>`:''}<span class="st-hc-sp"></span>${ask}</div>
    ${admin?stFacesHtml(face):''}
  </header>`;
}
function stPaintHead(){
  if(typeof document==='undefined') return;
  const facts=document.getElementById('page-head-facts'), acts=document.getElementById('page-head-acts');
  if(facts) facts.innerHTML=''; if(acts) acts.innerHTML='';
}
function stFacesHtml(face){
  const n=stNeedsAll().length;
  const btn=f=>`<button type="button" role="tab" class="st-face" data-st-tab="${f}" aria-selected="${f===face}">${stFaceWordsHtml(f)}${
    f==='company'?`<span class="st-face-n"${n?' data-tone="amber"':''}${n?` title="${esc(i18tn('st_face_company_n',n,{n}))}"`:''}>${n||''}</span>`:''}</button>`;
  return `<div class="st-facebar">
    <div class="st-faces" role="tablist" aria-label="${esc(i18t('st_faces_label'))}" style="--st-fi:${Math.max(0,ST_FACES.indexOf(face))};--st-fn:${ST_FACES.length}"><span class="st-thumb" aria-hidden="true"></span>${ST_FACES.map(btn).join('')}</div>
  </div>`;
}

/* ============================================================
   THE COMPANY BOARD, AS DRAWN (owner, 16 Oct 2026: "build" — every feature
   of "Settings — the Control Room, built in full", with the four decisions
   taken on Claude's advice)
   ============================================================
   Needs you first, each row carrying the button that settles it; then one
   short card per area — two facts that are doors, and the rest of the area's
   settings as doors under them; the governance ladder as a card; the access
   sheet. Two of the doors are PAGES inside the board (Team, Who holds what),
   with ‹ Settings to come back; everything else opens the one drawer.
   EVERY READING HERE IS BORROWED: a panel's own state(), signCapOf,
   saRuleOf, the member list — nothing is worked out a second way. */
const stUsers=()=>{ try{ return (typeof getUsers==='function'&&getUsers())||[]; }catch(_){ return []; } };
const stNameOf=u=>String((u&&(u.name||u.email))||'');
/* who signs and can be capped: everyone but a viewer (never signs) and an
   admin (never capped) — signCapBlocker's own two exceptions */
const stSigners=()=>stUsers().filter(u=>u.role!=='viewer'&&u.role!=='admin');
const stCapOn=()=>(typeof signCapEnforced==='function')&&!!signCapEnforced();
function stRuleOf(u){
  try{ return (typeof saRuleOf==='function')
    ? saRuleOf(u,(typeof signApprovalLegacyOn==='function')?signApprovalLegacyOn():false) : { on:false };
  }catch(_){ return { on:false }; }
}
/* WHO CAN SIGN ANY AMOUNT: the rule is on and nobody has answered for them —
   signCapBlocker refuses nothing for an unanswered limit, so this is a real
   gap, not a missing nicety. With the rule off nobody is capped and nobody
   is singled out. */
const stCapUnset=()=>stCapOn()?stSigners().filter(u=>{ try{ return !signCapOf(u).answered; }catch(_){ return false; } }):[];
/* an approval rule that is on with nobody to stand in (saNeeds then falls to
   the admins the day the approver is away) */
const stNoBackup=()=>stUsers().filter(u=>{ const r=stRuleOf(u); return !!r.on && !r.backupId; });
/* NOT SIGNED IN YET: an admin-made account keeps mustChangePassword until its
   owner replaces the temporary password — the server's own mark, cleared by
   POST /api/password/change and nothing else */
const stInvited=()=>{ const me=(typeof currentUser==='function'&&currentUser())||{};
  return stUsers().filter(u=>u&&u.id!==me.id&&u.prefs&&u.prefs.mustChangePassword); };
/* names said as people say them: three, then how many more */
function stNamesSaid(list){
  const names=list.map(stNameOf).filter(Boolean);
  return names.length>3 ? i18t('st_names_more',{names:names.slice(0,3).join(', '),n:names.length-3}) : names.join(', ');
}
const stDay=iso=>{ const t=Date.parse(iso||''); if(!t) return '';
  try{ return new Date(t).toLocaleDateString((typeof langLocale==='function')?langLocale():undefined,{ day:'numeric', month:'short' }); }catch(_){ return String(iso).slice(0,10); } };
/* A STATE LINE, SHORT: the first clause of what the panel says about itself
   (its dot carries the rest), whole in the title */
function stShortState(text){
  const plain=String(text||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
  /* most panels say "what the rule does — on/off/Advise": the short word at
     the end is the state; otherwise the first clause is */
  const parts=plain.replace(/^[●•]\s*/,'').split(' — ');
  let cut=(parts.length>1 && parts[parts.length-1].length<=14) ? parts[parts.length-1] : parts[0];
  cut=cut.split(/ · |\. |: /)[0].trim();
  cut=cut.charAt(0).toUpperCase()+cut.slice(1);
  return cut.length>34 ? cut.slice(0,33).replace(/\s+\S*$/,'')+'…' : cut;
}

/* ---- NEEDS YOU: everything that wants a decision, one list ----
   Each row: what is owed, in words; and the ONE button that settles it — a
   drawer, a person, a page, or a send. The number on the Company tab and on
   this card is the length of this list. */
let _stNeedsAll=false;
/* ---- CLASHES IN WHO MAY DO WHAT (owner picked "Rows in Needs your
   attention — the SAP way", 17 Oct 2026; piece 7 of the sensitive contracts
   and governance plan) ----
   Some combinations of rights quietly undo a control. Each is a row in Needs
   your attention, one plain sentence naming who, with the door to the person
   or the rule; the red dot marks the one that undoes a control outright.
   READ FROM THE SAME RULES THE GATES USE (signCapOf, the person's approval
   rule saRuleOf, approvalRules, canAccessFolder) and worked out afresh on
   every paint, so a clash goes away by itself when the rights change. They
   warn; nothing is blocked. Admins only, like the list they sit in. */
function stClashes(){
  const users=stUsers();
  const money=v=>(typeof fmtMoneyShortIn==='function')?fmtMoneyShortIn(Number(v),(typeof jxCurrency==='function')?jxCurrency():undefined):String(v);
  /* WHICH CLASHES THERE ARE is ONE reading, shared with the server (js/
     clashkeys.js, clashFind), fed this page's own readings — the server finds
     the same keys itself and keeps the day each was first seen; this page
     only says them in words, with their doors */
  const rules=(typeof approvalRules==='function')?approvalRules():[];
  const found=(typeof clashFind==='function')?clashFind({ users, capOn:stCapOn(), ruleOf:stRuleOf,
    capOf:u=>{ try{ return signCapOf(u); }catch(_){ return { answered:false, limit:null }; } },
    rules, canOpen:(f,u)=>(typeof canAccessFolder!=='function')||canAccessFolder(f,u),
    openStreams:(typeof clashOpenStreams==='function')?clashOpenStreams((typeof state!=='undefined'&&state.contracts)||[]):[],
    isStream:f=>!!FOLDERS[f] }):[];
  return found.map(x=>{
    if(x.kind==='cap'){ const p=x.who, a=x.appr;
      /* "Open Lina Ek" opens her drawer with the limit that clashes lit
         (round 25 as drawn) — the person's whole name, as the row says it */
      return { key:x.key, dot:'red', who:p, appr:a, cap:x.cap, acap:x.acap,
        text:x.cap==null?i18t('st_clash_cap_any',{who:stNameOf(p),appr:stNameOf(a),acap:money(x.acap)})
          :i18t('st_clash_cap',{who:stNameOf(p),cap:money(x.cap),appr:stNameOf(a),acap:money(x.acap)}),
        btn:`data-st-panel="person:${PB_ATTR(p.id)}" data-st-focus="${x.cap==null?'#tm-cap-none':'#tm-cap'}"`, verb:i18t('st_clash_open',{name:stNameOf(p)}) }; }
    if(x.kind==='each') return { key:x.key, dot:'warn', text:i18t('st_clash_each',{a:stNameOf(x.who),b:stNameOf(x.appr)}),
      btn:`data-st-panel="person:${PB_ATTR(x.who.id)}"`, verb:i18t('st_clash_open',{name:stNameOf(x.who)}) };
    if(x.kind==='self') return { key:x.key, dot:'warn',
      text:x.stream?i18t('st_clash_self_stream',{who:stNameOf(x.who),stream:(FOLDERS[x.stream]||{}).name||x.stream})
        :i18t('st_clash_self_rule',{who:stNameOf(x.who),rule:condLabel((x.rule&&x.rule.cond)||{})}),
      btn:'data-st-panel="approvals"', verb:i18t('st_clash_rule') };
    return { key:x.key, dot:'warn', text:i18t('st_clash_nobody',{stream:(FOLDERS[x.stream]||{}).name||x.stream}), btn:'data-st-panel="approvals"', verb:i18t('st_clash_rule') };
  });
}
/* ---- THE DAY A CLASH WAS FIRST SEEN (owner's answer 12, 18 Oct 2026) ----
   The server keeps it (state.clashSeen from the bootstrap) and FINDS THE
   CLASHES ITSELF (the gaps' third pass): after any change that could make or
   end one — a person, a rule, a stream, a contract — it reads them with the
   same clashFind and stamps a new one with its own day, so a clash made while
   no admin looks still says the day it began. This page only asks it to look
   again (POST /api/clashes/seen, nothing sent) when a clash it shows has no
   day yet. Reading the list never writes. */
const stClashSeenDay=key=>{
  const iso=String(((state&&state.clashSeen)||{})[key]||''); const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if(!m) return '';
  try{ return new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString((typeof langLocale==='function')?langLocale():undefined,{ day:'numeric', month:'short' }); }catch(_){ return iso; } };
let _stClashTelling=false, _stClashAsked='';
function stClashSeenSync(){
  if(_stClashTelling||!stIsAdmin()||!(typeof API_MODE==='function'&&API_MODE())) return;
  const held=state&&state.clashSeen; if(!held||typeof held!=='object') return;
  const missing=stClashes().map(r=>r.key).filter(k=>!held[k]).sort().join('\n');
  /* asked once per set: a key the server does not find is not asked about again */
  if(!missing||missing===_stClashAsked) return;
  _stClashAsked=missing; _stClashTelling=true;
  Promise.resolve(api('clashes/seen','POST',{})).then(r=>{
    if(r&&r.seen&&typeof r.seen==='object') state.clashSeen=r.seen;
    stClashRowsRepaint();
  },()=>{ /* not told: the rows say what they are, without a day */ }).then(()=>{ _stClashTelling=false; });
}
/* the clash rows drawn again where they stand, now that their day is known */
function stClashRowsRepaint(){
  if(typeof document==='undefined') return;
  const rows=stNeedsAll();
  document.querySelectorAll('#st-att .st-need[data-st-need^="clash:"]').forEach(el=>{
    const r=rows.find(x=>x.key===el.getAttribute('data-st-need')); if(!r) return;
    const d=document.createElement('div'); d.innerHTML=stNeedRowHtml(r);
    if(d.firstElementChild) el.replaceWith(d.firstElementChild); });
}
function stNeedsAll(){
  const out=[];
  if(!stIsAdmin()) return out;
  /* a colleague's ask, answered here (Ask an admin, js below) */
  if(typeof stAsksOpen==='function') stAsksOpen().forEach(a=>out.push({ key:'ask:'+a.id, dot:'warn',
    text:i18t('st_need_ask',{who:a.byName||'',what:a.what}), sub:stDay(a.createdAt),
    btn:`data-st-panel="ask:${PB_ATTR(a.id)}"`, verb:i18t('st_need_answer') }));
  /* the clashes in who may do what (piece 7), the red one first */
  /* each row says on its second line what kind of thing it is (the
     "Control room", round 25, 17 Oct 2026) */
  /* …and since the day HaTi first saw it (owner's answer 12, 18 Oct 2026:
     "since 14 Oct"), kept on the server by stClashSeenSync */
  stClashes().forEach(r=>{ const seen=stClashSeenDay(r.key);
    out.push((r.sub||r.subHtml)?r:{ ...r, sub:seen?i18t('st_need_kind_clash_since',{ day:seen }):i18t('st_need_kind_clash') }); });
  /* the quarter's access review, until it is done (piece 8) */
  const arRow=stArNeedRow(); if(arRow) out.push(arRow);
  /* contracts past their keeping period, waiting for an admin's yes (piece 10) */
  stKpNeedRows().forEach(r=>out.push(r));
  const unset=stCapUnset();
  if(unset.length) out.push({ key:'limits', dot:'warn',
    text:i18tn('st_need_limits',unset.length,{n:unset.length,names:stNamesSaid(unset)}), sub:i18t('st_need_limits_sub'),
    btn:`data-st-panel="limits" data-st-focus="#st-lim-${PB_ATTR(unset[0].id)}"`, verb:i18t('st_need_limits_go') });
  const nob=stNoBackup();
  if(nob.length===1) out.push({ key:'backup', dot:'warn',
    text:i18t('st_need_backup_single',{name:stNameOf(nob[0]).split(' ')[0]}),
    sub:i18t('st_need_backup_sub',{approver:stNameOf((typeof userById==='function'&&userById(stRuleOf(nob[0]).approverId))||{}).split(' ')[0]}),
    btn:`data-st-panel="person:${PB_ATTR(nob[0].id)}" data-st-focus="#tm-sa-backup"`, verb:i18t('st_need_backup_go') });
  else if(nob.length) out.push({ key:'backup', dot:'warn',
    text:i18t('st_need_backup_n',{n:nob.length,names:stNamesSaid(nob)}), sub:'',
    btn:'data-st-page="sheet" data-st-land="backup"', verb:i18t('st_need_backup_go_n') });
  stAttentionKeys().forEach(k=>{ const p=SET_PANELS[k]; const st=stStateOf(k)||{};
    out.push({ key:'panel:'+k, dot:'warn', text:p.title(), subHtml:st.text?stShortState(st.text):'',
      btn:`data-st-panel="${k}"`, verb:(p.fixVerb&&p.fixVerb())||i18t('st_need_open') }); });
  const inv=stInvited();
  if(inv.length===1) out.push({ key:'invite', dot:'quiet',
    text:i18t('st_need_invite_single',{name:stNameOf(inv[0])}),
    sub:(inv[0].prefs&&inv[0].prefs.invitedAgainAt)?i18t('st_need_invite_again',{day:stDay(inv[0].prefs.invitedAgainAt)}):i18t('st_need_invite_sent',{day:stDay(inv[0].createdAt)}),
    btn:`data-st-resend="${PB_ATTR(inv[0].id)}"`, verb:i18t('st_resend') });
  else if(inv.length) out.push({ key:'invite', dot:'quiet',
    text:i18t('st_need_invite_n',{n:inv.length,names:stNamesSaid(inv)}), sub:'',
    btn:'data-st-page="team" data-st-land="invite"', verb:i18t('st_need_invite_see') });
  return out;
}
/* TWO LINES A ROW (round 25, "Control room", owner picked it 17 Oct 2026):
   what it is, then what kind of thing and since when, the row's own button
   on the right */
function stNeedRowHtml(r){
  const dot=r.dot==='quiet'?'var(--st-gray-dot,var(--color-neutral-400))':r.dot==='red'?ST_DOT.red:ST_DOT.warn;
  const sub=r.subHtml?`<span class="st-need-s">${r.subHtml}</span>`:(r.sub?`<span class="st-need-s">${esc(r.sub)}</span>`:'');
  return `<div class="st-need" data-st-need="${PB_ATTR(r.key)}">
    <span class="st-dot" style="background:${dot}"></span>
    <span class="st-need-w"><span class="st-need-t">${esc(r.text)}</span>${sub?' '+sub:''}</span>
    <button type="button" class="ui-btn ui-btn-sm st-need-go" ${r.btn}>${esc(r.verb)}</button>
  </div>`;
}
/* IT DRAWS NOTHING WHEN THERE IS NOTHING — the attention block's own rule.
   Past four it counts; the count opens the rest in place, and pressed again
   folds it back (PRESS IT AGAIN AND IT CLOSES). */
function stNeedsHtml(){
  const rows=stNeedsAll(); if(!rows.length) return '';
  const shown=_stNeedsAll?rows:rows.slice(0,ST_ATTENTION_MAX), rest=rows.length-Math.min(rows.length,ST_ATTENTION_MAX);
  return `<section class="st-needs" id="st-att" aria-labelledby="st-needs-h">
    <h3 class="st-needs-h" id="st-needs-h">${esc(i18t('st_attention'))} <span class="st-needs-n st-pill-n is-amber">${rows.length}</span><span class="st-needs-sub">${esc(i18t('st_needs_sub'))}</span></h3>
    ${shown.map(stNeedRowHtml).join('')}
    ${rest>0?`<button type="button" class="st-need st-need-more" data-st-needs-all aria-expanded="${_stNeedsAll}">${esc(_stNeedsAll?i18t('st_needs_fewer'):i18tn('st_needs_more',rest,{n:rest}))}</button>`:''}
  </section>`;
}

/* ---- THE AREA CARDS ----
   Two facts, then doors. A fact is the panel's own dot, name and the first
   clause of its own state — warn first, then a required one still owed, then
   the group's order — and pressing it opens that panel. Every other panel of
   the area is a door under them, so the whole area is still one press away
   and nothing the page held before has gone. */
/* NINE EVEN CARDS, THE LADDER BELOW THEM (round 25, "Control room"): People
   & access is one card like the rest, and the ladder is drawn across the page
   after the nine (stCompanyHtml) — its entry stays here so stCrSync knows it */
/* EACH CARD AS DRAWN (round 25, the gaps of 18 Oct 2026): its two facts and
   its doors are the drawing's, named here — no longer "the rest of the
   group". A panel with no door on its card is still one press away: the
   finder (⌘K and the Menu) lists every panel, and one that wants a decision
   comes up in Needs your attention with its button. */
const ST_CARDS=[
  { key:'people' },
  { key:'signing', groups:['signing'], facts:['signcheck','signcap'],
    doors:()=>[{ panel:'limits', label:i18t('st_card_limits') }, { panel:'signfolder' }] },
  { key:'agreement', groups:['agreement'], facts:['approvals','review'],
    doors:()=>(stGatesOff().length?[{ panel:'gates', label:i18t('st_card_gates') }]:[]).concat([{ panel:'desk' }]) },
  /* the one link rule there is, and its door (owner's answer 11: no "Named
     guests only" — the card shows only rules that exist) */
  { key:'links', groups:['links'], facts:['linkcode'], doors:()=>[{ panel:'linkcode', label:i18t('st_card_links') }] },
  /* the streams' own page, a door of its own (round 26) */
  { key:'standards', groups:['standards'], facts:['company','folders'],
    doors:()=>[{ page:'streams', label:i18t('st_sw_title') }, { panel:'paydays' }, { panel:'design' }] },
  { key:'intake', groups:['intake'], facts:['mailroom','lanes'], doors:()=>[{ panel:'renewals' }, { panel:'webhooks' }] },
  /* "Jambo's agents ›" opens their page with ‹ Settings (round 25 as drawn,
     the gaps' third pass: every card door is a page on the desk) — the
     agents' own panel, how far each may go; his house stays its own place */
  { key:'copilot', groups:['copilot','facts'], facts:['copilot','agents'], doors:()=>[{ panel:'agents' }, { panel:'boardwords' }, { panel:'facts' }, { panel:'lessons' }] },
  /* Housekeeping says how the book is kept and when the record last left
     (round 25 as drawn); Data & backup opens on The trail (round 26) */
  { key:'house', groups:['house'], own:()=>stHouseFacts(),
    doors:()=>(stTrailOn()?[{ panel:'trail', label:i18t('st_card_trail') }]:[]).concat([{ page:'data', label:i18t('st_p_backup') }, { panel:'report', label:i18t('st_card_report') }]) },
  { key:'live', groups:['launch','plumbing'], facts:['golive','mail'],
    doors:()=>[{ panel:'mail', label:i18t('st_card_mail') }, { panel:'integrity' }] },
  { key:'ladder', span:2 },
];
const stCardTitle=c=>c.key==='live'?i18t('st_card_live'):c.key==='people'?i18t('st_cr_people'):c.key==='ladder'?i18t('st_gov_h'):i18t('st_grp_'+c.key);
function stCardKeys(card){
  const out=[];
  (card.groups||[]).forEach(g=>{ const G=ST_GROUPS.find(x=>x.key===g); if(G) stPanelsInGroup(G.tab,g).forEach(k=>out.push(k)); });
  return out;
}
function stCardFacts(keys){
  const rank=k=>{ const st=stStateOf(k)||{}; if(st.dot==='warn') return 0; if(SET_PANELS[k].mandatory && st.dot!=='ok') return 1; return 2; };
  return keys.map((k,i)=>({k,i,r:rank(k)})).sort((a,b)=>a.r-b.r||a.i-b.i).slice(0,2).map(x=>x.k);
}
function stFactHtml(k){
  const p=SET_PANELS[k]; if(!p) return '';
  const st=stStateOf(k)||{ dot:'off', text:'' };
  const full=String(st.text||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  /* A PANEL MAY SAY ITS OWN FACT (round 25 as drawn: "Highland Corporate Ltd
     · Kenya · KES", "6 streams · 1 private", "Jambo · On · $5 a day at most",
     "Jambo's agents · 7 of 7 on, all Ask me first") — a reading of its own */
  let f=null; if(typeof p.fact==='function') try{ f=p.fact(); }catch(_){ f=null; }
  if(f) return `<button type="button" class="st-fact${f.bare?' st-fact-plain':''}" data-st-panel="${k}" data-st-dock${full?` title="${esc(full)}"`:''}>
    <span class="st-dot" style="background:${ST_DOT[f.dot||st.dot]||ST_DOT.off}"></span>
    ${f.bare?`<span class="st-fact-n">${esc(f.s)}</span>`:`<span class="st-fact-n">${esc(f.n||p.title())}</span><span class="st-fact-s">${esc(f.s)}</span>`}</button>`;
  return `<button type="button" class="st-fact" data-st-panel="${k}" data-st-dock${full?` title="${esc(full)}"`:''}>
    <span class="st-dot" style="background:${ST_DOT[st.dot]||ST_DOT.off}"></span>
    <span class="st-fact-n">${esc(p.title())}</span><span class="st-fact-s">${esc(stShortState(st.text))}</span></button>`;
}
/* HOUSEKEEPING'S TWO FACTS (round 25 as drawn): how many streams keep their
   contracts for a set time — a door to Contract streams — and when the trail
   last left, and by whom — a door to it. Null where neither can be read. */
function stHouseFacts(){
  if(!stKpOn()) return null;
  const rules=((_stKp.data&&_stKp.data.rules)||(state.keeping&&state.keeping.rules)||{});
  const all=Object.values(FOLDERS||{}).filter(f=>f&&f.id), kept=all.filter(f=>rules[f.id]).length;
  const me=String(((typeof currentUser==='function'&&currentUser())||{}).name||'');
  const last=(_stTr.list||[])[0];
  const lastSaid=_stTr.list==null?i18t('st_cf_trail_reading'):last?i18t('st_cf_trail_last',{ day:stDay(last.at), who:last.who&&last.who===me?i18t('st_cf_by_you'):(last.who||'') }):i18t('st_cf_trail_never');
  const fact=(attrs,dot,n,sv)=>`<button type="button" class="st-fact" ${attrs}><span class="st-dot" style="background:${dot}"></span><span class="st-fact-n">${esc(n)}</span><span class="st-fact-s">${esc(sv)}</span></button>`;
  return [fact('data-st-page="streams"', kept?ST_DOT.ok:ST_DOT.off, i18t('st_cf_keeping'), i18t('st_cf_keeping_n',{ n:kept, of:all.length })),
    fact('data-st-panel="trail"', last?ST_DOT.ok:ST_DOT.off, i18t('st_cf_trail'), lastSaid)];
}
const stDoorHtml=(attrs,label)=>`<button type="button" class="st-door" ${attrs}>${esc(label)}<span aria-hidden="true"> ›</span></button>`;
function stGroupCardHtml(card){
  const keys=stCardKeys(card); if(!keys.length) return '';
  /* only what is on this workspace: a panel not shown here is neither a fact
     nor a door (stPanelKeys, the list every row reads) */
  const shown=new Set(stPanelKeys(null));
  const own=card.own?card.own():null;
  const facts=own?[]:(card.facts?card.facts.filter(k=>SET_PANELS[k]&&shown.has(k)):stCardFacts(keys));
  /* a door to a page, or to one of the drawers that are not panels (limits,
     gates, the trail), always stands; a panel's door only where it is shown */
  const doors=(card.doors?card.doors():[]).filter(x=>x.page||x.view||!SET_PANELS[x.panel]||shown.has(x.panel));
  return `<section class="st-grp st-card" data-st-card="${card.key}">
    <h3 class="st-card-h">${esc(stCardTitle(card))}</h3>
    <div class="st-card-facts">${own?own.join(''):facts.map(stFactHtml).join('')}</div>
    <div class="st-card-doors">${doors.map(x=>stDoorHtml(x.page?`data-st-page="${x.page}"`:x.view?`data-st-view="${x.view}"`:`data-st-panel="${x.panel}"${(x.panel==='trail'||x.panel==='backup')?'':' data-st-dock'}`,x.label||SET_PANELS[x.panel].title())).join('')}</div>
  </section>`;
}
/* PEOPLE & ACCESS, AS DRAWN (round 25, the gaps of 18 Oct 2026): two facts
   like every card's — how many people, admins and roles, and who has not
   taken up their invitation — each a door; the signing limits are Before
   anyone signs' fact and the approvals are on the access sheet */
function stPeopleCardHtml(){
  const users=stUsers();
  const admins=users.filter(u=>u.role==='admin').length;
  const roles=stBzOn()?stBzBook().roles.length:0;
  const inv=stInvited();
  const fact=(attrs,dot,html)=>`<button type="button" class="st-fact st-fact-plain" ${attrs}><span class="st-dot" style="background:${dot}"></span><span class="st-fact-n">${html}</span></button>`;
  const who=[i18tn('st_pc_people',users.length,{n:esc(String(users.length))}), i18tn('st_pc_admins',admins,{n:esc(String(admins))}), roles?i18tn('st_pc_roles',roles,{n:esc(String(roles))}):''].filter(Boolean).join(' · ');
  return `<section class="st-grp st-card st-grp-people" data-st-card="people">
    <h3 class="st-card-h">${esc(i18t('st_cr_people'))}</h3>
    <div class="st-card-facts">
      ${fact('data-st-page="team"', ST_DOT.ok, who)}
      ${inv.length?fact('data-st-page="team"', ST_DOT.warn, esc(inv.length===1?i18t('st_pc_inv_one',{ name:stNameOf(inv[0]) }):i18tn('st_pc_inv_n',inv.length,{ n:inv.length, names:stNamesSaid(inv) })))
        :fact('data-st-page="team"', ST_DOT.ok, esc(i18t('st_pc_all_in')))}
    </div>
    <div class="st-card-doors">${stDoorHtml('data-st-page="team"',i18t('st_pg_team'))}${stDoorHtml('data-st-page="sheet"',i18t('st_pg_sheet'))}${stBzOn()?stDoorHtml('data-st-page="roles"',i18t('st_pg_roles')):''}${stDoorHtml('data-st-panel="person:new" data-st-dock',i18t('st_add_person'))}</div>
  </section>`;
}

/* ---- THE GOVERNANCE LADDER ----
   Three rungs, each a set of gates this page already has, read off each
   gate's OWN dot ('ok' is on). Nothing is computed that a row does not
   already say; the ladder only puts the gates in the order a company needs
   them — walls from day one, gates when real money flows, the formal rules
   when deals get crowded — and offers the ones still off as one drawer. */
const ST_GOV_LADDER=[
  { key:'walls',  gates:['company','approvals','signcap'] },
  { key:'gates',  gates:['signcheck','signfolder','review'] },
  { key:'formal', gates:['desk','linkcode'] },
];
function stGovRungs(){
  const shown=new Set(stPanelKeys(null));
  return ST_GOV_LADDER.map(r=>{
    const gates=r.gates.filter(k=>shown.has(k)).map(k=>({ key:k, on:(stStateOf(k)||{}).dot==='ok' }));
    return { key:r.key, gates, on:gates.filter(g=>g.on).length };
  });
}
function stGovNext(){
  for(const r of stGovRungs()) for(const g of r.gates) if(!g.on) return g.key;
  return null;
}
/* the ladder's gates still off, in the ladder's order — the "Turn a gate on" drawer */
const stGatesOff=()=>stGovRungs().reduce((a,r)=>a.concat(r.gates.filter(g=>!g.on).map(g=>g.key)),[]);
/* THE LADDER, AS DRAWN (round 25, the gaps of 18 Oct 2026): one rung a
   line — its bar, its name and how far on, then its gates in one line, the
   next one to turn on marked "(next)"; what comes next said in the head, the
   door to it at the head's right */
function stGovLadderHtml(){
  const rungs=stGovRungs(), next=stGovNext();
  const sub=i18t('st_gov_sub')+(next?' · '+i18t('st_gov_sub_next',{ name:SET_PANELS[next].title() }):'');
  return `<section class="st-grp st-card st-card-ladder st-gov" id="st-gov" data-st-card="ladder" aria-labelledby="st-gov-h">
    <h3 class="st-card-h" id="st-gov-h"><span class="st-card-ht">${esc(i18t('st_gov_h'))}<span class="st-card-sub st-card-sub-l">${esc(sub)}</span></span>${next?stDoorHtml('data-st-panel="gates" data-st-dock',i18t('st_gov_go')):`<span class="st-card-sub">${esc(i18t('st_gov_all_on'))}</span>`}</h3>
    <ol class="st-gov-rungs">${rungs.map((r,i)=>{
      const pct=r.gates.length?Math.round(100*r.on/r.gates.length):0;
      const said=r.on===r.gates.length?i18t('st_gov_done'):r.on?i18t('st_gov_n',{n:r.on,of:r.gates.length}):i18t('st_gov_off');
      return `<li class="st-gov-rung">
        <span class="st-gov-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
        <span class="st-gov-line"><span class="st-gov-name">${esc(i18t('st_gov_'+r.key,{n:i+1}))}</span> · <span class="st-gov-n">${esc(said)}</span>
          <span class="st-gov-gates">${r.gates.map(g=>`<button type="button" class="st-gov-g${g.key===next?' is-next':''}" data-st-panel="${g.key}" data-st-dock>${esc(SET_PANELS[g.key].title())}${g.key===next?` <span class="st-gov-nx">${esc(i18t('st_gov_next_mark'))}</span>`:''}<span class="sr-only"> — ${esc(g.on?stOn():stOff())}</span></button>`).join('<span class="st-gov-sep" aria-hidden="true">·</span>')}</span></span>
      </li>`; }).join('')}</ol>
  </section>`;
}
/* AFTER A DRAWER WRITES: the ladder, the cards' facts and the Company tab's
   count are readings of the same dots, so they are redrawn where they stand
   with the rows — the page itself never moves (THE SETTINGS PAGE HOLDS STILL). */
function stCrSync(){
  if(typeof document==='undefined') return;
  const swap=(el,html)=>{ if(!el) return; const d=document.createElement('div'); d.innerHTML=html; if(d.firstElementChild) el.replaceWith(d.firstElementChild); };
  swap(document.getElementById('st-gov'), stGovLadderHtml());
  document.querySelectorAll('#set-page [data-st-card]').forEach(el=>{
    const k=el.getAttribute('data-st-card'); if(k==='ladder') return;
    const card=ST_CARDS.find(c=>c.key===k); if(!card) return;
    swap(el, k==='people'?stPeopleCardHtml():stGroupCardHtml(card)); });
  const sheet=document.getElementById('st-sheet-card'); if(sheet) swap(sheet, stSheetCardHtml());
  const n=document.querySelector('#set-page .st-face[data-st-tab="company"] .st-face-n');
  if(n){ const k=stNeedsAll().length; n.textContent=k?String(k):'';
    if(k){ n.setAttribute('data-tone','amber'); n.setAttribute('title',i18tn('st_face_company_n',k,{n:k})); }
    else { n.removeAttribute('data-tone'); n.removeAttribute('title'); } }
}

/* ---- WHO HOLDS WHAT — the access sheet ----
   Read-only: every cell is what a person's drawer says, and a row opens that
   drawer. An amber cell is a gap that owes an answer and opens what fills it.
   The card shows the people with gaps first; the page shows everyone. */
function stSheetCells(u){
  const admin=u.role==='admin', viewer=u.role==='viewer';
  let cap='—';
  /* AS DRAWN (round 25, the gaps of 18 Oct 2026): "any amount · admins are
     never capped"; a limit above what the person's business role gives is
     red and says what the role gives */
  if(admin) cap=`${esc(i18t('st_sh_any_amount'))}<span class="st-sh-sub">${esc(i18t('st_sh_admins_never'))}</span>`;
  else if(!viewer){
    const c=(()=>{ try{ return signCapOf(u); }catch(_){ return { answered:false, limit:null }; } })();
    if(!c.answered) cap=stCapOn()?`<button type="button" class="st-amber st-amber-btn" data-st-panel="limits">${esc(i18t('st_sh_any'))}</button>`:esc(i18t('st_sh_unset'));
    else {
      /* short money, the one shortener (round 25 as drawn: "SEK 10 M · role
         gives 5 M"), as the clash row on the same page says it */
      const money=v=>(typeof fmtMoneyShortIn==='function')?fmtMoneyShortIn(Number(v),(typeof jxCurrency==='function')?jxCurrency():undefined):String(v);
      const bz=(typeof stBzOf==='function'&&stBzOn())?stBzOf(u):null;
      const over=bz&&typeof bz.cap==='number'&&(c.limit==null||Number(c.limit)>bz.cap);
      cap=esc(c.limit==null?i18t('sc_no_limit'):money(c.limit));
      if(over) cap=`<span class="st-sh-over">${cap}</span> <span class="st-sh-sub-i">· ${esc(i18t('st_sh_role_gives',{ cap:money(bz.cap) }))}</span>`;
    }
  }
  const r=stRuleOf(u);
  const appr=r.on?stNameOf((typeof userById==='function'&&userById(r.approverId))||{}):'';
  const yes=r.on?`${esc(appr||i18t('sa_admins'))}${r.backupId?'':` <button type="button" class="st-amber st-amber-btn" data-st-panel="person:${PB_ATTR(u.id)}" data-st-focus="#tm-sa-backup">${esc(i18t('st_sh_nobackup'))}</button>`}`:'—';
  const gate=!!((typeof reviewGateCfg==='function')?reviewGateCfg():{}).on;
  const checked=viewer?'—':(gate&&(typeof reviewChecked==='function')&&reviewChecked(u))?esc(i18t('st_sh_yes')):'—';
  const acc=stAccessOf(u);
  /* the private streams that do not name them, by name (round 25 as drawn:
     "3 of 4 · not named on Board") — names this page already shows an admin */
  const shut=Object.values(FOLDERS||{}).filter(f=>{ if(!f||!f.id) return false; const p=stPsSaved(f.id); return !!(p&&p.on)&&!stPsIds(p).includes(String(u.id)); }).map(f=>f.name);
  const total=Object.keys(FOLDERS||{}).length;
  const streams=(acc.all&&!acc.but)?esc(i18t('st_sh_streams_all',{ n:total }))
    :`${esc(i18t('st_sh_n_of',{ n:acc.n||0, of:total }))}${shut.length?`<span class="st-sh-sub">${esc(i18t('st_sh_not_named',{ names:stListJoin(shut) }))}</span>`:''}`;
  return { cap, yes, checked, streams,
    refile:stReFileOn(u)?esc(i18t('st_sh_yes')):'—', paper:stNewPaperOn(u)?esc(i18t('st_sh_yes')):'—', hold:stHoldOn(u)?esc(i18t('st_sh_yes')):'—',
    gap:(!admin&&!viewer&&stCapOn()&&!(()=>{ try{ return signCapOf(u).answered; }catch(_){ return true; } })())||(r.on&&!r.backupId) };
}
function stSheetRow(u, full){
  const c=stSheetCells(u);
  const ar=full&&stArOn(), rev=ar&&stArDue();
  /* away, and who answers (round 25 as drawn: "away until Fri · Maria answers") */
  const aw=((state.away||{}).everyone||[]).find(r=>r&&String(r.userId)===String(u.id)&&r.from<=((state.away||{}).today||todayISO()));
  /* the role column says the business role, or the job title, or the access role (as drawn) */
  const bz=(typeof stBzOf==='function'&&stBzOn())?stBzOf(u):null;
  return `<tr class="st-sh-row" data-st-panel="person:${PB_ATTR(u.id)}">
    <td class="st-sh-who">${esc(stNameOf(u))}${aw?`<span class="st-sh-away">${esc(i18t('st_sh_away',{ day:stAwayDay(aw.to), who:String(aw.deputyName||'').split(' ')[0] }))}</span>`:''}</td>
    <td>${esc((bz&&bz.name)||u.title||roleName(u.role))}${(u.prefs&&u.prefs.mustChangePassword)?` · <span class="st-sh-inv">${esc(i18t('st_sh_invited'))}</span>`:''}</td>
    <td>${c.cap}</td><td>${c.yes}</td><td>${c.checked}</td>
    ${full?`<td>${c.refile}</td><td>${c.paper}</td><td>${c.hold}</td>`:''}
    <td>${c.streams}</td>${ar?`<td class="st-ar-cell" data-st-ar-used="${PB_ATTR(u.id)}">${stArUsedHtml(u)}</td>`:''}${rev?`<td class="st-ar-rev" data-st-ar-row="${PB_ATTR(u.id)}">${stArReviewHtml(u)}</td>`:''}</tr>`;
}
function stSheetHead(full){
  const th=k=>`<th>${esc(i18t(k))}</th>`;
  const ar=full&&stArOn();
  return `<tr>${th('st_sh_person')}${th('st_sh_role')}${th('st_sh_cap')}${th('st_sh_yes_from')}${th('st_sh_checked')}${full?th('st_sh_refile')+th('st_sh_paper')+th('st_sh_hold'):''}${th('st_sh_streams')}${ar?th('st_ar_used'):''}${ar&&stArDue()?th('st_ar_review'):''}</tr>`;
}
/* THE ACCESS SHEET ON THE BOARD, AS DRAWN (round 25, the gaps of 18 Oct
   2026): everyone in the workspace's order, admins too, six at most; its
   count and "See all N people" in its head */
const ST_SHEET_CARD_ROWS=6;
function stSheetCardHtml(){
  const users=stUsers();
  const rows=users.slice(0,ST_SHEET_CARD_ROWS);
  return `<section class="st-grp st-card st-sheet-card" id="st-sheet-card" data-st-card="sheet">
    <h3 class="st-card-h"><span class="st-card-ht">${esc(i18t('st_pg_sheet'))} <span class="st-pill-n">${users.length}</span><span class="st-card-sub st-card-sub-l">${esc(i18t('st_sh_sub2'))}</span></span>${stDoorHtml('data-st-page="sheet"',i18tn('st_sh_all_n',users.length,{n:users.length}))}</h3>
    <table class="st-sh-table">${stSheetHead(false)}${rows.map(u=>stSheetRow(u,false)).join('')}</table>
  </section>`;
}

/* ---- THE TWO PAGES INSIDE THE BOARD ----
   Team (the People table, with Resend where somebody has not signed in) and
   Who holds what (every grant, read-only, with Download). Each says where it
   is and carries ‹ Settings back; a refresh comes back to it (settingsPlace). */
let _stPage=null;
const ST_PAGES=['team','sheet','roles','streams','data','panel'];
/* ---- A CARD'S DOOR OPENS ITS PAGE (round 25 as drawn, the gaps' third
   pass, 19 Oct 2026: every door on the Company board's cards and the ladder
   "opens its page on the desk, with ‹ Settings to come back") ----
   THE ONE DRAWER, DOCKED: the panel the door names is painted by the same
   stDrawerOpen/stDrawerPaint into the page's main column instead of over a
   dimmed page — the same body, foot, writers and refusals, no second copy of
   any panel. One value says which (_stDock); the page is 'panel'. Done,
   Cancel, Save and ‹ Settings go back to the board and land on the door that
   was pressed (landOn). Needs your attention's own buttons and the access
   sheet's rows still open the drawer, as drawn ("Opens Lina Ek's drawer"). */
let _stDock=null, _stDockFrom=null;
const stDockHost=()=>(typeof document!=='undefined'&&_stPage==='panel')?document.getElementById('st-dock'):null;
const stDrawerDocked=()=>{ const d=(typeof document!=='undefined')&&document.getElementById('st-drawer'); return !!(d&&d.classList.contains('is-docked')); };
/* EVERY DOOR TO A COMPANY PANEL IS ITS PAGE (the gaps' fourth pass, 19 Oct
   2026, finishing round 25's "every door opens a page with ‹ Settings"): the
   Menu's rows, Jambo's Open, ⌘K's rows and a door from another page
   (openSettingsAt) dock the panel as a card's door does — a panel with no
   door on any card too. A person, a business role, a colleague's ask, a
   stream's page and your own drawers keep the drawer, and so do Needs your
   attention's own buttons and the access sheet's rows, as drawn; the trail
   and the backup are Data & backup's page; the phone keeps its own. */
function stDockable(k){
  k=String(k||'');
  if(!k || k==='trail' || k==='backup' || !stIsAdmin()) return false;
  if(typeof window!=='undefined' && typeof window.deskShellOn==='function' && !window.deskShellOn()) return false;
  return !!SET_PANELS[k] || k==='limits' || k==='gates';
}
function stDockPageHtml(){
  return `<div class="st-pg st-pg-dock" data-st-pg="panel" data-st-dock-key="${PB_ATTR(_stDock||'')}">
    ${stPageHeadHtml('', '', '')}
    <div class="st-dock" id="st-dock"></div>
  </div>`;
}
function stDockOpen(key, from){
  if(!key) return;
  /* an overlay drawer up gives way: one drawer, one place */
  if(_stOpen && !stDrawerDocked()) stDrawerClose();
  _stDock=String(key); _stDockFrom=from||null;
  _stPage='panel'; _stSwPick=null; _stTab='company';
  if(typeof setView==='function' && typeof state!=='undefined' && state.view!=='team'){ setView('team'); }
  else renderTeam();
  stLandTop();
}
/* painted with the page: the drawer moves into the page — kept as it is when
   it is already the docked one (what was typed survives a repaint) */
function stDockPaint(){
  const host=stDockHost(); if(!host||!_stDock) return;
  const d=document.getElementById('st-drawer');
  if(d && _stOpen===_stDock && d.classList.contains('is-docked')){ host.appendChild(d); return; }
  stDrawerOpen(_stDock);
}
/* leaving the page puts the drawer back on the body, shut; the way back
   lands on the door that opened it (LAND ON IT) */
function stDockLeave(){
  if(_stPage!=='panel' && !stDrawerDocked()) return null;
  const from=_stDockFrom, key=_stDock;
  const d=(typeof document!=='undefined')&&document.getElementById('st-drawer');
  if(d && d.classList.contains('is-docked')){
    if(_stTrap){ try{ _stTrap(); }catch(_){ /* nothing held */ } _stTrap=null; }
    d.classList.remove('is-docked','open'); d.setAttribute('hidden','');
    d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true');
    document.body.appendChild(d);
  }
  _stOpen=null; _stDock=null; _stDockFrom=null;
  if(_stPage==='panel') _stPage=null;
  return from&&key?{ from, key }:null;
}
function stDockBack(){
  const was=stDockLeave();
  renderTeam(); stLandTop();
  if(was && typeof landOn==='function'){
    /* a Menu row or Jambo's Open: back on the very one (it may have scrolled
       away with the Menu's search, then the page's top is the landing) */
    if(was.from.sel){ landOn(()=>document.querySelector(was.from.sel),{ block:'nearest', delay:60 }); return; }
    const card=`#set-page [data-st-card="${was.from.card}"]`;
    landOn(()=>document.querySelector(`${card} ${was.from.kind?'.'+was.from.kind:''}[data-st-panel="${was.key}"]`)
      ||document.querySelector(`${card} [data-st-panel="${was.key}"]`)||document.querySelector(card),{ block:'center', delay:60 });
  }
}
function stPageHeadHtml(title, sub, acts){
  return `<div class="st-pg-head">
    <button type="button" class="st-pg-back" data-st-page="">‹ ${esc(i18t('pg_team'))}</button>
    ${title?`<h2 class="st-pg-t">${esc(title)}${sub?` <span class="st-pg-n">${esc(sub)}</span>`:''}</h2>`:''}
    <span class="st-pg-sp"></span>${acts||''}
  </div>`;
}
function stTeamPageHtml(){
  return `<div class="st-pg" data-st-pg="team">
    ${stPageHeadHtml('', '', '')}
    <div id="st-people-sec" class="st-people-sec">${stPeopleHtml({ title:'st_pg_team' })}</div>
  </div>`;
}
function stSheetPageHtml(){
  /* the trail is read when the sheet opens (piece 8) */
  if(stArOn()&&!_stAr.use&&!_stAr.busy) setTimeout(()=>stArLoadUse(),0);
  return `<div class="st-pg${stArDue()?' is-reviewing':''}" data-st-pg="sheet">
    ${stPageHeadHtml(i18t('st_pg_sheet'), stArHeadSub(), `<button type="button" class="ui-btn" data-st-sheet-csv>${icon('download','w-3.5 h-3.5')} ${esc(i18t('st_sh_download'))}</button>`)}
    <section class="st-card st-sheet-full"><table class="st-sh-table">${stSheetHead(true)}${stUsers().map(u=>stSheetRow(u,true)).join('')}</table></section>
    ${stArFootHtml()}
    <p class="st-note st-pg-foot">${esc(i18t(stArOn()?'st_ar_foot':'st_sh_foot'))}</p>
  </div>`;
}
/* ---- ROUND 26, "THE SAP WAY" (owner picked it by name, 17 Oct 2026):
   CONTRACT STREAMS AND DATA & BACKUP ARE PAGES ----
   Contract streams: labelled filters, then a table of the streams — who may
   open, contracts, kept after they end, due now, on hold — read from the
   stream's own readings (stPsSaved, stPsCount, folderSeerCount, the keeping
   book); a row opens the stream's own page in the drawer (stream:<fid>), the
   one door. Adding, renaming and categories stay in the Contract folders
   drawer (+ New stream). Data & backup: The trail · Backup as the page's
   tabs; the trail's asks are labelled boxes in one row, its downloads a
   table under them. Nothing here writes. */
let _stSw={ who:'any', keep:'any', q:'' };
/* THE STREAM SHOWN BESIDE THE LIST (round 26 "The SAP way" as drawn, the
   gaps of 18 Oct 2026): a row press shows the stream in the side panel;
   pressed again, or Close, lets it go and Jambo's words come back. Per
   sitting; nothing is filed. */
let _stSwPick=null;
function stSwRows(){
  const me=String(((typeof currentUser==='function'&&currentUser())||{}).id||'');
  const kp=(_stKp.data&&_stKp.data.streams)||{}, kpRead=!!(_stKp.data&&_stKp.data.streams);
  return Object.values(FOLDERS).filter(f=>f&&f.id).map(f=>{
    const p=stPsSaved(f.id), priv=!!(p&&p.on), ids=priv?stPsIds(p):[];
    const k=kp[f.id]||null, rule=stKpSaved(f.id);
    /* THE WALL HOLDS FOR THE ADMIN (round 26's check): a private stream that
       does not name this admin is neither shown nor counted for them */
    const shut=priv&&!ids.includes(me);
    return { id:f.id, name:f.name, color:f.color, priv, named:ids.length, mine:ids.includes(me), shut,
      seers:priv?ids.length:folderSeerCount(f.id).n, contracts:shut?null:stPsCount(f.id),
      years:rule?rule.years:null, then:rule?rule.then:null, due:shut?null:(k&&rule?k.due.length:null), held:shut?null:(k?k.held.length:(kpRead?0:null)) };
  });
}
function stSwShown(rows){
  const q=String(_stSw.q||'').trim().toLowerCase();
  return rows.filter(r=>(_stSw.who==='any'||(_stSw.who==='named')===r.priv)
    &&(_stSw.keep==='any'||(_stSw.keep==='set')===(r.years!=null))
    &&(!q||String(r.name).toLowerCase().includes(q)));
}
function stSwTableHtml(){
  const all=stSwRows(), rows=stSwShown(all), kpRead=!!(_stKp.data&&_stKp.data.streams);
  const dash='<span class="st-note">—</span>', num=v=>v==null?dash:esc(String(v));
  const who=r=>r.priv?`${esc(i18t('st_sw_named',{ n:r.named }))}${r.mine?'':` <span class="st-note">· ${esc(i18t('st_sw_not_you'))}</span>`}`
    :esc(i18tn('st_sw_everyone',r.seers,{n:r.seers}));
  const body=rows.length?rows.map(r=>`<tr class="st-sw-row${_stSwPick===r.id?' is-picked':''}" data-st-sw-pick="${PB_ATTR(r.id)}" tabindex="0" aria-selected="${_stSwPick===r.id}">
      <td><b>${esc(r.name)}</b>${r.priv?` <span class="st-ps-badge">${STPS_LOCK}${esc(i18t('st_ps_private'))}</span>`:''}</td>
      <td>${who(r)}</td><td class="r">${r.shut?`<span class="st-note">${esc(i18t('st_sw_not_counted'))}</span>`:num(r.contracts)}</td>
      <td>${r.years!=null?esc(stKpYearsWord(r.years)):esc(i18t('st_sw_no_period'))}</td>
      <td class="r">${r.due?`<span class="st-sw-due">${r.due}</span>`:dash}</td><td class="r">${kpRead&&!r.shut?num(r.held):dash}</td></tr>`).join('')
    :`<tr><td colspan="6" class="st-note">${esc(i18t('st_sw_none'))}</td></tr>`;
  return `<table class="st-sh-table st-sw-tb"><thead><tr><th>${esc(i18t('st_sw_c_stream'))}</th><th>${esc(i18t('st_sw_c_who'))}</th><th class="r">${esc(i18t('st_sw_c_contracts'))}</th>
    <th>${esc(i18t('st_sw_c_kept'))}</th><th class="r">${esc(i18t('st_sw_c_due'))}</th><th class="r">${esc(i18t('st_sw_c_onhold'))}</th></tr></thead><tbody>${body}</tbody></table>`;
}
function stStreamsPageHtml(){
  const n=Object.values(FOLDERS).filter(f=>f&&f.id).length;
  const sel=(k,opts)=>`<label class="st-sw-f"><span>${esc(i18t('st_sw_f_'+k))}</span><select data-st-sw-f="${k}">${opts.map(([v,t])=>`<option value="${v}"${_stSw[k]===v?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  const shown=stSwShown(stSwRows()).length;
  return `<div class="st-pg" data-st-pg="streams">
    <section class="st-pg-card">
    ${stPageHeadHtml(i18t('st_sw_title'), String(n), `<button type="button" class="ui-btn" data-st-panel="stream:new" data-st-focus="#st-stream-name">+ ${esc(i18t('st_sw_new'))}</button>`)}
    <div class="st-sw-band">
      ${sel('who',[['any',i18t('st_sw_any')],['all',i18t('st_sw_who_all')],['named',i18t('st_sw_who_named')]])}
      ${sel('keep',[['any',i18t('st_sw_any')],['set',i18t('st_sw_keep_set')],['none',i18t('st_kp_none')]])}
      <label class="st-sw-f st-sw-find"><span>${esc(i18t('st_sw_f_find'))}</span><input type="search" id="st-sw-q" value="${PB_ATTR(_stSw.q)}" placeholder="${PB_ATTR(i18t('st_sw_find_ph'))}"/></label>
    </div>
    </section>
    <section class="st-card st-sheet-full st-sw-card">
      <h3 class="st-card-h st-sw-h"><span class="st-card-ht">${esc(i18t('st_sw_list'))} <span class="st-pill-n" id="st-sw-n">${shown}</span><span class="st-card-sub st-card-sub-l">${esc(i18t('st_sw_list_press'))}</span></span></h3>
      <div id="st-sw-tb">${stSwTableHtml()}</div>
    </section>
  </div>`;
}
function stSwRepaint(){
  const tb=document.getElementById('st-sw-tb'); if(!tb) return;
  tb.innerHTML=stSwTableHtml();
  const n=document.getElementById('st-sw-n'); if(n) n.textContent=String(stSwShown(stSwRows()).length);
  /* the panel beside it says the same readings */
  if(_stSwPick || (_stPage==='streams'&&settingsTab()==='company')) stJbFeedRepaint();
}
/* the server's counts and the keeping book, read once the page is up */
function stSwLoad(){
  if(!_stPs.counts) Promise.resolve(stPsLoad()).then(stSwRepaint,()=>{});
  if(!_stKp.data&&stKpOn()) Promise.resolve(stKpLoad()).then(stSwRepaint,()=>{});
}
/* CHOOSE A STREAM: the side panel shows it; the same row again lets it go */
function stSwPickSet(fid){
  _stSwPick=fid&&FOLDERS[fid]?String(fid):null;
  if(_stSwPick&&_stSideFold) stSideFoldSet(false);
  if(_stSwPick&&_stSide!=='jambo') stSideSet('jambo');
  document.querySelectorAll('#set-page .st-sw-row').forEach(tr=>{ const on=tr.getAttribute('data-st-sw-pick')===_stSwPick; tr.classList.toggle('is-picked',on); tr.setAttribute('aria-selected',String(on)); });
  stJbFeedRepaint();
  if(_stSwPick&&stKpOn()&&!_stKp.data&&!_stKp.busy) Promise.resolve(stKpLoad()).then(()=>{ if(_stSwPick) stJbFeedRepaint(); },()=>{});
}
/* THE STREAM IN THE SIDE PANEL, AS DRAWN: its facts, what is due now (a
   family counted with the agreement it hangs on), what is on legal hold —
   never deleted or archived while held — and its acts: Delete these N (the
   keeping run's own route, asked once more), Change keeping (its page, on
   Keeping), Close. Read off the keeping book the server keeps (kpBook) and
   the stream's own readings; a stream the wall shuts says only what this
   admin may know of it. */
function stSwPanelHtml(fid){
  const f=FOLDERS[fid]; if(!f) return '';
  const r=stSwRows().find(x=>x.id===fid)||{};
  const d=_stKp.data, s=(d&&d.streams&&d.streams[fid])||null, saved=stKpSaved(fid);
  const dash='—';
  const row=(k,v,cls)=>`<div class="st-swp-f"><dt>${esc(i18t(k))}</dt><dd${cls?` class="${cls}"`:''}>${v}</dd></div>`;
  const who=r.priv?`${esc(i18t('st_sw_named',{ n:r.named }))}${r.mine?'':` · ${esc(i18t('st_sw_not_you'))}`}`:esc(i18tn('st_sw_everyone',r.seers,{ n:r.seers }));
  const kept=saved?esc(i18t(saved.then==='archive'?'st_swp_kept_archive':'st_swp_kept_delete',{ period:stKpYearsWord(saved.years) })):esc(i18t('st_sw_no_period'));
  let facts=row('st_sw_c_who',who)
    +row('st_sw_c_contracts',r.shut?esc(i18t('st_sw_not_counted')):esc(String(r.contracts==null?dash:r.contracts)))
    +row('st_sw_c_kept',kept);
  let body='';
  const loading=stKpOn()&&!d;
  if(r.shut){
    facts+=row('st_sw_c_due',dash)+row('st_swp_hold',dash);
    body=`<p class="st-note st-swp-shut">${esc(i18t('st_swp_shut'))}</p>`;
  } else if(loading){
    body=`<p class="st-note">${(typeof busyHtml==='function')?busyHtml(i18t('st_kp_reading')):esc(i18t('st_kp_reading'))}</p>`;
  } else {
    const due=(s&&saved)?s.due:[], held=s?s.held:[], heldDue=(s&&s.heldDue)||0;
    facts+=row('st_sw_c_due',due.length?`<span class="st-amber">${esc(i18tn('st_swp_due_n',due.length,{ n:due.length }))}</span> · ${esc(i18t('st_swp_ended_before',{ day:stAwayDay(s.cutoff) }))}`:dash)
      +row('st_swp_hold',held.length?`${held.length}${heldDue?` · ${esc(i18t('st_swp_held_back'))}`:''}`:'0');
    if(due.length) body+=`<h4 class="st-swp-h4">${esc(i18t('st_sw_c_due'))}</h4>
      <table class="st-swp-tb"><thead><tr><th>${esc(i18t('st_kp_th_contract'))}</th><th>${esc(i18t('st_kp_th_party'))}</th><th>${esc(i18t('st_kp_th_ended'))}</th></tr></thead>
      <tbody>${due.map(x=>`<tr><td><span class="st-swp-ref">${esc(x.ref)}</span> <b>${esc(x.name||'')}</b>${x.family&&x.family.length?` <span class="st-note">· ${esc(i18tn('st_kp_family',x.family.length,{ n:x.family.length }))}</span>`:''}</td>
        <td>${esc(x.counterparty||'')}</td><td class="st-swp-day">${esc(stAwayDay(x.ended))}</td></tr>`).join('')}</tbody></table>`;
    if(held.length) body+=`<h4 class="st-swp-h4">${esc(i18t('st_swp_hold'))}</h4>
      ${held.map(x=>`<div class="st-swp-held">${STPS_LOCK}<div class="st-swp-hw"><b>${esc(x.ref)} ${esc(x.name||'')}${x.counterparty?` · ${esc(x.counterparty)}`:''}</b>
        <span class="st-note">${esc([x.ended?i18t('st_swp_held_ended',{ day:stAwayDay(x.ended) }):'', i18t('st_swp_held_since',{ day:stAwayDay(x.since) }), x.by||'', i18t('st_kp_held_sub')].filter(Boolean).join(' · '))}</span></div>
        <button type="button" class="ui-btn ui-btn-sm" data-st-swp-open="${PB_ATTR(x.id)}">${esc(i18t('st_swp_open'))}</button></div>`).join('')}`;
  }
  const n=(!r.shut&&s&&saved)?s.due.length:0, del=saved&&saved.then!=='archive';
  const acts=`<div class="st-swp-acts">
    ${n?`<button type="button" class="ui-btn ${del?'ui-btn-danger is-filled':'ui-btn-primary'}" data-st-swp-run="${PB_ATTR(fid)}">${esc(i18tn(del?'st_kp_delete_n':'st_kp_archive_n',n,{ n }))}</button>`:''}
    <button type="button" class="ui-btn" data-st-panel="stream:${PB_ATTR(fid)}@keeping">${esc(i18t('st_swp_change'))}</button>
    <span class="st-swp-sp"></span>
    <button type="button" class="ui-btn" data-st-swp-close>${esc(i18t('st_swp_close'))}</button></div>`;
  return `<div class="st-swp" data-st-swp="${PB_ATTR(fid)}">
    <h3 class="st-swp-name">${esc(f.name)}${r.priv?` <span class="st-ps-badge">${STPS_LOCK}${esc(i18t('st_ps_private'))}</span>`:''}</h3>
    <dl class="st-swp-facts">${facts}</dl>${body}${acts}</div>`;
}
/* the keeping run from the side panel: the same writer the Keeping tab uses */
async function stSwRun(fid){
  if(!fid) return;
  const ok=await stKpRun(fid);
  if(ok!==false){ stSwRepaint(); stSyncAttention(); }
}
if(typeof document!=='undefined' && !window._stSwWired){
  window._stSwWired=true;
  document.addEventListener('change',e=>{ const t=e.target; const k=t&&t.getAttribute&&t.getAttribute('data-st-sw-f'); if(!k||!t.closest('[data-st-pg="streams"]')) return;
    _stSw[k]=t.value||'any'; stSwRepaint(); });
  document.addEventListener('input',e=>{ const t=e.target; if(!t||t.id!=='st-sw-q') return; _stSw.q=t.value||''; stSwRepaint(); });
  /* a press CHOOSES; the same row again lets it go (PRESS IT AGAIN AND IT
     CLOSES); Enter or a double press opens the stream's own page — the one
     door it always had */
  document.addEventListener('click',e=>{ const t=e.target&&e.target.closest?e.target:null; if(!t) return;
    const row=t.closest('#set-page .st-sw-row[data-st-sw-pick]');
    if(row){ const fid=row.getAttribute('data-st-sw-pick'); stSwPickSet(_stSwPick===fid?null:fid); return; }
    if(t.closest('[data-st-swp-close]')){ stSwPickSet(null); return; }
    const run=t.closest('[data-st-swp-run]'); if(run){ stSwRun(run.getAttribute('data-st-swp-run')); return; }
    const op=t.closest('[data-st-swp-open]'); if(op){ stHeldOpen(op.getAttribute('data-st-swp-open')); return; }
  });
  document.addEventListener('dblclick',e=>{ const row=e.target&&e.target.closest&&e.target.closest('#set-page .st-sw-row[data-st-sw-pick]'); if(!row) return;
    stDrawerOpen('stream:'+row.getAttribute('data-st-sw-pick')); });
  document.addEventListener('keydown',e=>{ const t=e.target; if(!t||!t.classList) return;
    if(e.key==='Enter'&&t.classList.contains('st-sw-row')){ e.preventDefault(); stDrawerOpen('stream:'+t.getAttribute('data-st-sw-pick')); return; }
    if(e.key===' '&&t.classList.contains('st-sw-row')){ e.preventDefault(); t.click(); return; }
    if(e.key==='Escape'&&_stSwPick&&!_stOpen&&!_stRow&&document.querySelector('[data-st-pg="streams"]')&&!document.querySelector('#modal-root [role="dialog"]')) stSwPickSet(null); });
}
/* A HELD CONTRACT'S OPEN LANDS WHERE ITS HOLD IS PLACED AND RELEASED (round
   26 as drawn: "Opens the contract's details, where its hold is placed and
   released"; the gaps' third pass): in HaTi that is the contract's Menu
   beside its paper — End or pause puts a hold on, Release hold takes it off
   (#ws-hold, roomMoreMenuHtml's own row). The paper opens with Jambo's Menu
   tab, the row's group opened, and the reader lands ON Release hold, lit; it
   presses nothing and readies nothing (a hold is never released by a stray
   Enter). Where the row cannot be shown (no right to hold) it says so. */
function stHeldOpen(id){
  if(!id) return;
  /* the Dossier's All acts fold (the Menu tab folded into it, 20 Oct 2026), in Jambo's panel */
  const sel=`#ig-dock .pd-nx[data-pd-menu="${String(id).replace(/["\\]/g,'')}"] .pd-mn-rows #ws-hold`;
  if(typeof pdOpenOnHome==='function' && pdOpenOnHome(id,'copilot')!==false){
    if(typeof landOn==='function') landOn(()=>{ const r=document.querySelector(sel); if(r){ const d=r.closest('details'); if(d&&!d.open) d.open=true; } return r; },
      { focus:false, block:'center', missing:i18t('st_swp_hold_missing') });
    return; }
  if(typeof hbStripBring==='function'&&hbStripBring(id,'ov')) return;
  if(typeof regOpenContract==='function') regOpenContract(id); else if(typeof openWorkspace==='function') openWorkspace(id);
}
function stDataTabsHtml(){
  if(!stTrailOn()) return '';
  const tab=(k,label)=>`<button type="button" role="tab" class="st-dp-tab${_stBkTab===k?' is-on':''}" data-st-bk-tab="${k}" aria-selected="${_stBkTab===k}">${esc(label)}</button>`;
  return `<div class="st-dp-tabs" role="tablist">${tab('trail',i18t('st_bk_tab_trail'))}${tab('backup',i18t('st_bk_tab_backup'))}</div>`;
}
function stDataPageHtml(){
  const trail=stTrailOn();
  if(trail&&!_stTr.from) Object.assign(_stTr,stTrailDefault());
  const tabs=stDataTabsHtml();
  if(!trail) _stBkTab='backup';
  /* the head is one white card with the trail's asks in it (round 26 as
     drawn): the page's name and its tabs, a rule, the boxes */
  return `<div class="st-pg" data-st-pg="data">
    <div id="st-bk-pane">${_stBkTab==='trail'?stTrailBandHtml(tabs):`<section class="st-pg-card">${stPageHeadHtml(i18t('st_p_backup'), '', tabs)}</section><section class="st-card st-sheet-full st-dp-card">${stBackupBodyHtml()}</section>`}</div>
  </div>`;
}
/* THE TRAIL'S ASKS AS LABELLED BOXES IN ONE ROW, the count under them, the
   downloads a table — the same ids and the same wiring as the drawer's */
function stTrailBandHtml(tabs){
  const d=_stTr, streams=stTrailStreams();
  const lbl=t=>`<span>${esc(t)}</span>`;
  return `<section class="st-pg-card">${stPageHeadHtml(i18t('st_p_backup'), '', tabs||stDataTabsHtml())}<div class="st-sw-band st-tr-band">
      <label class="st-sw-f">${lbl(i18t('st_tr_from'))}<input type="date" id="st-tr-from" value="${esc(d.from)}"/></label>
      <label class="st-sw-f">${lbl(i18t('st_tr_to'))}<input type="date" id="st-tr-to" value="${esc(d.to)}"/></label>
      <label class="st-sw-f">${lbl(i18t('st_tr_streams'))}<select id="st-tr-stream">
        <option value="all"${d.stream==='all'?' selected':''}>${esc(i18t('st_tr_all'))}</option>
        ${streams.map(f=>`<option value="${esc(f.id)}"${d.stream===f.id?' selected':''}>${esc(f.name)}</option>`).join('')}</select></label>
      <label class="st-sw-f">${lbl(i18t('st_tr_as'))}<select id="st-tr-as-sel">
        <option value="csv"${d.as!=='pdf'?' selected':''}>${esc(i18t('st_tr_csv'))}</option>
        <option value="pdf"${d.as==='pdf'?' selected':''}>${esc(i18t('st_tr_pdf'))}</option></select></label>
      <div class="st-tr-go st-tr-go-band" id="st-tr-go">${stTrailGoHtml()}</div>
    </div></section>
    <section class="st-card st-sheet-full st-dp-card"><div class="st-tr-past" id="st-tr-past">${stTrailPastHtml()}</div></section>`;
}
/* ---- THE QUARTERLY ACCESS REVIEW (owner picked "Review the sheet — the SAP
   way", 17 Oct 2026; piece 8 of the sensitive contracts and governance plan) ----
   Needs your attention (and the bell) asks for the quarter's review until it
   is done; Who holds what is the review: a column, Used in the last 90 days,
   read from the trail by the server (unused rights in amber), Keep · Change on
   every row while the quarter is open, and Mark the review done once every
   person is kept or changed — stamped by the server, an act in the trail.
   On the server only. */
const _stAr={ use:null, busy:false, at:0, changing:null };
const stArOn=()=>stApiOnly()&&stIsAdmin();
const stAr=()=>(typeof state!=='undefined'&&state.accessReview)||null;
const stArLabel=q=>{ const m=/^(\d{4})-Q(\d)$/.exec(String(q||'')); return m?i18t('st_tr_quarter',{q:m[2],y:m[1]}):String(q||''); };
const stArDue=()=>{ const a=stAr(); return !!(stArOn()&&a&&!a.done&&Array.isArray(a.people)&&a.people.length); };
const stArCount=()=>{ const a=stAr(); if(!a) return { done:0, total:0 }; const ids=a.people||[]; return { done:ids.filter(id=>a.marks&&a.marks[id]).length, total:ids.length }; };
function stArNeedRow(){
  if(!stArDue()) return null;
  const a=stAr(), n=stArCount();
  return { key:'review', dot:'warn', text:i18t('st_ar_need',{q:stArLabel(a.quarter)}), sub:i18t('st_ar_need_sub',{n:n.done,total:n.total}),
    btn:'data-st-page="sheet" data-st-land="ar"', verb:i18t(n.done?'st_ar_continue':'st_ar_start') };
}
/* the trail, read once per sitting (and again after the review moves) */
async function stArLoadUse(force){
  if(!stArOn()||_stAr.busy||(_stAr.use&&!force)) return;
  _stAr.busy=true;
  try{ const r=await api('access-review'); _stAr.use=r.use||{}; _stAr.idle=r.idleDays||90; _stAr.now=r.now||'';
    state.accessReview={ quarter:r.quarter, people:r.people, marks:r.marks, done:r.done, last:r.last }; }
  catch(_){ _stAr.use=_stAr.use||{}; }
  _stAr.busy=false;
  stArRepaint();
}
function stArRepaint(){ if(_stPage==='sheet'&&document.querySelector('[data-st-pg="sheet"]')) renderTeam(); }
const stArDays=t=>{ const ms=Date.parse(t||''); return Number.isFinite(ms)?Math.floor((Date.now()-ms)/864e5):null; };
/* one line per person: what of theirs went unused for 90 days, or when they
   last used HaTi — never a guess: where nothing is on record it says so */
function stArUsedHtml(u){
  const me=(typeof currentUser==='function'&&currentUser())||{};
  if(u.id===me.id) return '<span class="st-ar-used">—</span>';
  if(!_stAr.use) return `<span class="st-ar-used">${(typeof busyHtml==='function')?busyHtml(''):'…'}</span>`;
  const x=_stAr.use[u.id]; if(!x) return '<span class="st-ar-used">—</span>';
  const idle=_stAr.idle||90, member=stArDays(x.since), old=member==null||member>=idle;
  const amber=t=>`<span class="st-ar-used st-amber" data-st-ar-idle="1">${esc(t)}</span>`;
  const seen=stArDays(x.seen);
  if(old&&(seen==null||seen>=idle)) return amber(seen==null?i18t('st_ar_no_signin'):i18t('st_ar_signin_old',{n:seen}));
  const cap=(()=>{ try{ return signCapOf(u); }catch(_){ return { answered:false, limit:null }; } })();
  if(old&&u.role==='legal'&&cap.answered){ const s=stArDays(x.sign); if(s==null||s>=idle) return amber(s==null?i18t('st_ar_sign_never'):i18t('st_ar_sign_old',{n:s})); }
  const fa=(((state.settings||{}).folderAccess)||{})[u.id];
  if(old&&u.role!=='admin'&&Array.isArray(fa)&&fa.length){
    const stale=fa.filter(f=>{ const d=stArDays((x.streams||{})[f]); return d==null||d>=idle; });
    if(stale.length){ const f=stale[0], d=stArDays((x.streams||{})[f]), nm=(FOLDERS[f]||{}).name||f;
      return amber((d==null?i18t('st_ar_stream_never',{stream:nm}):i18t('st_ar_stream_old',{stream:nm,n:d}))+(stale.length>1?' '+i18t('st_ar_more',{n:stale.length-1}):'')); }
  }
  const last=[x.seen,x.act].filter(Boolean).sort().pop(), d=stArDays(last);
  return `<span class="st-ar-used">${esc(d==null?i18t('st_ar_none'):d<7?i18t('st_ar_week'):d<31?i18t('st_ar_month'):i18t('st_ar_90'))}</span>`;
}
function stArReviewHtml(u){
  const me=(typeof currentUser==='function'&&currentUser())||{};
  if(u.id===me.id) return `<span class="st-ar-you">${esc(i18t('st_ar_not_you'))}</span>`;
  const a=stAr(), m=a&&a.marks&&a.marks[u.id];
  const b=(k,label,on)=>`<button type="button" class="st-ar-btn${on?' is-on':''}" data-st-ar="${k}" data-st-ar-who="${PB_ATTR(u.id)}" aria-pressed="${on?'true':'false'}">${esc(label)}</button>`;
  return `<span class="st-ar-acts">${b('keep',m&&m.v==='keep'?i18t('st_ar_kept'):i18t('st_ar_keep'),m&&m.v==='keep')}${b('change',m&&m.v==='change'?i18t('st_ar_changed'):i18t('st_ar_change'),m&&m.v==='change')}</span>`;
}
async function stArMark(uid,verdict){
  try{ const r=await api('access-review/mark','POST',{ userId:uid, verdict }); state.accessReview=r; }
  catch(e){ toast(e.message,'err'); return false; }
  stArRepaint(); return true;
}
async function stArDone(){
  const btn=document.getElementById('st-ar-done'); if(btn){ btn.disabled=true; if(window.busySet) busySet(btn,i18t('st_ar_stamping')); }
  try{ const r=await api('access-review/done','POST',{}); state.accessReview=r;
    toast(i18t('st_ar_done_ok',{q:stArLabel(r.quarter)}),'ok'); }
  catch(e){ toast(e.message,'err'); }
  stArRepaint();
}
/* the press on a row's Keep or Change: Keep is the record; Change opens the
   person, and only their saved drawer marks them changed */
function stArPress(el){
  const uid=el.getAttribute('data-st-ar-who'), k=el.getAttribute('data-st-ar');
  if(k==='keep'){ stArMark(uid,'keep'); return; }
  _stAr.changing=uid; stDrawerOpen('person:'+uid);
}
async function stArAfterSave(uid){
  if(!stArDue()||String(_stAr.changing||'')!==String(uid||'')) return;
  _stAr.changing=null; await stArMark(uid,'change');
}
function stArHeadSub(){
  const a=stAr(); if(!stArOn()||!a) return i18t('st_sh_page_sub');
  if(a.done) return i18t('st_ar_head_done',{q:stArLabel(a.quarter),day:stDay(a.done.at),who:a.done.by});
  const n=stArCount(); return i18t('st_ar_head',{q:stArLabel(a.quarter),n:n.done,total:n.total});
}
function stArFootHtml(){
  if(!stArDue()) return '';
  const n=stArCount(), left=n.total-n.done;
  return `<div class="st-ar-foot"><span class="st-note">${esc(left?i18tn('st_ar_left',left,{n:left}):i18t('st_ar_all_in'))}</span>
    <button type="button" class="ui-btn ui-btn-primary" id="st-ar-done"${left?` disabled aria-disabled="true" title="${esc(i18tn('st_ar_left',left,{n:left}))}"`:''}>${esc(i18t('st_ar_mark_done'))}</button></div>`;
}
if(typeof document!=='undefined') document.addEventListener('click',e=>{
  const t=e.target; if(!t||!t.closest) return;
  const b=t.closest('[data-st-ar]');
  if(b){ e.stopPropagation(); e.preventDefault(); stArPress(b); return; }
  if(t.closest('#st-ar-done')){ e.stopPropagation(); stArDone(); }
},true);

/* THE SHEET, AS A FILE: the same cells, words only, for the quarterly look */
function stSheetCsv(){
  const users=stUsers(), q=v=>`"${String(v==null?'':v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().replace(/"/g,'""')}"`;
  const head=['st_sh_person','st_sh_role','st_sh_cap','st_sh_yes_from','st_sh_checked','st_sh_refile','st_sh_paper','st_sh_hold','st_sh_streams'].map(k=>q(i18t(k))).join(',');
  const lines=users.map(u=>{ const c=stSheetCells(u); return [stNameOf(u),roleName(u.role),c.cap,c.yes,c.checked,c.refile,c.paper,c.hold,c.streams].map(q).join(','); });
  const name=`who-holds-what-${(typeof todayISO==='function')?todayISO():''}.csv`;
  if(typeof downloadFile==='function') downloadFile(name, [head].concat(lines).join('\n'), 'text/csv');
}
/* A NEEDS ROW THAT OPENS A PAGE NAMES WHAT ON IT (LAND ON IT, owner, 18 Oct
   2026; the gaps' third pass): the access review's first person still to
   decide, the first approver with no backup, the first invitation to send
   again — lit, nothing pressed, nothing readied */
const ST_PAGE_LAND={
  ar:()=>{ const c=[...document.querySelectorAll('#set-page [data-st-ar-row]')].find(x=>!x.querySelector('.st-ar-btn.is-on'));
    return c?(c.closest('tr')||c):document.querySelector('#set-page [data-st-pg="sheet"]'); },
  backup:'#set-page .st-amber-btn[data-st-focus="#tm-sa-backup"]',
  invite:'#set-page [data-st-resend]',
};
function stPageLand(k){
  const t=k&&ST_PAGE_LAND[k];
  /* after stLandTop's frame, which puts the page at its top first */
  if(t && typeof landOn==='function') landOn(t,{ block:'center', focus:false, delay:60 });
}
function settingsGoPage(k){
  /* the page's own door into Data & backup lands on The trail, its first tab
     (round 26 as drawn: Housekeeping's "Data & backup ›"); a door that named a
     tab — the drawer keys "trail" and "backup" — lands on that one */
  if(k==='data'&&(_stPage!=='data'||_stBkWant)) _stBkTab=_stBkWant||(stTrailOn()?'trail':'backup');
  _stBkWant=null;
  /* leaving a card's page: the drawer goes back, shut; ‹ Settings lands on the
     door that opened it */
  if(_stPage==='panel' && k!=='panel' && !k){ if(settingsTab()!=='company') _stTab='company'; stDockBack(); return; }
  if(_stPage==='panel' && k!=='panel') stDockLeave();
  _stPage=(ST_PAGES.includes(k)&&k!=='panel')?k:null;
  if(_stPage!=='streams') _stSwPick=null;
  if(settingsTab()!=='company') _stTab='company';
  renderTeam(); stLandTop();
}

/* ---- EVERYONE'S SIGNING LIMITS, ONE DRAWER ----
   The same three answers the person drawer holds (a figure, "No limit", or
   nobody has said), one row each, written through the same route
   (PATCH /api/users/:id signCap) — this is a second view of one fact, never a
   second writer. Viewers never sign and admins are never capped, so neither
   is listed. With the rule off the limits are kept and stop nobody, and the
   drawer says so with the rule's own door. */
function stLimitsDrawer(){
  const on=stCapOn(), cur=(typeof jxCurrency==='function')?jxCurrency():'';
  const rows=stSigners();
  const row=u=>{ const c=(()=>{ try{ return signCapOf(u); }catch(_){ return { answered:false, limit:null }; } })();
    const none=c.answered&&c.limit==null, owed=on&&!c.answered;
    const need=(owed&&typeof needAttrs==='function')?needAttrs({ key:'signCap', type:'num' },''):'';
    return `<div class="st-lim-row" data-st-lim-row="${PB_ATTR(u.id)}">
      <label class="st-lim-n" for="st-lim-${PB_ATTR(u.id)}">${esc(stNameOf(u))} <span class="st-lim-r">${esc(roleName(u.role))}</span></label>
      <input id="st-lim-${PB_ATTR(u.id)}" type="number" min="0" step="1000" data-st-lim="${PB_ATTR(u.id)}" value="${c.limit==null?'':String(c.limit)}" placeholder="${esc(i18t('st_lim_ph',{cur}))}" style="${window.RV_FLD||ST_INPUT}"${none?' disabled':''} ${need}/>
      <label class="st-lim-none"><input type="checkbox" data-st-lim-none="${PB_ATTR(u.id)}"${none?' checked':''}/> ${esc(i18t('sc_no_limit'))}</label>
    </div>`; };
  return { title:i18t('st_lim_title'), sub:i18t('st_lim_sub'), foot:'save',
    body:`${on?'':`<div class="st-lim-off"><span>${esc(i18t('st_lim_off'))}</span><button type="button" class="ui-btn ui-btn-sm" data-st-panel="signcap">${esc(i18t('st_lim_turn_on'))}</button></div>`}
      ${rows.length?`<div class="st-lim-list">${rows.map(row).join('')}</div>`:`<p class="st-note">${esc(i18t('st_lim_nobody'))}</p>`}
      <p class="st-note">${esc(i18t('st_lim_who'))}</p>`,
    wire(){ document.querySelectorAll('#st-dbody [data-st-lim-none]').forEach(cb=>cb.addEventListener('change',()=>{
      const box=document.querySelector(`#st-dbody [data-st-lim="${cb.getAttribute('data-st-lim-none')}"]`);
      if(box){ box.disabled=cb.checked; if(cb.checked) box.value='';
        /* "No limit" is an answer: the box is no longer owed */
        if(box.hasAttribute('data-need')) box.classList.toggle('need-empty', !cb.checked && !String(box.value||'').trim()); } })); },
    save:()=>stLimitsSave() };
}
async function stLimitsSave(){
  stDrawerClearRefusal();
  const want=[];
  for(const u of stSigners()){
    const box=document.querySelector(`#st-dbody [data-st-lim="${u.id}"]`), none=document.querySelector(`#st-dbody [data-st-lim-none="${u.id}"]`);
    if(!box&&!none) continue;
    let v=null;
    if(none&&none.checked) v='none';
    else { const raw=String((box&&box.value)||'').trim();
      if(raw!==''){ const n=Number(raw); if(!Number.isFinite(n)||n<0){ stDrawerRefuse(i18t('st_lim_bad',{name:stNameOf(u)})); return; } v=n; } }
    const c=signCapOf(u), was=c.answered?(c.limit==null?'none':c.limit):null;
    if(v!==was) want.push({ u, v });
  }
  for(const w of want){
    if(typeof API_MODE==='function'&&API_MODE()){
      try{ const r=await api('users/'+w.u.id,'PATCH',{ signCap:w.v }); if(r&&r.user) Object.assign(w.u,r.user); else w.u.signCap=w.v; }
      catch(e){ stDrawerRefuse(i18t('st_lim_failed',{name:stNameOf(w.u)})+' '+e.message); return; }
    } else w.u.signCap=w.v;
  }
  if(want.length && !(typeof API_MODE==='function'&&API_MODE()) && typeof saveUsers==='function') saveUsers(stUsers());
  toast(want.length?i18tn('st_lim_saved',want.length,{n:want.length}):i18t('st_lim_same'),'ok');
  stDrawerClose(); renderTeam();
}
/* ---- TURN A GATE ON ----
   The ladder's rules that are still off, in its order, each with what it
   costs the team and the door to its OWN drawer — the rule is switched there,
   by its one writer, so this drawer lists and opens and never writes. */
function stGatesDrawer(){
  const off=stGatesOff();
  return { title:i18t('st_gates_title'), sub:i18t('st_gates_sub'), foot:'done',
    body:off.length?`<div class="st-gates">${off.map(k=>{ const p=SET_PANELS[k]; const st=stStateOf(k)||{};
      return `<div class="st-gate-row"><span class="st-gate-t"><span class="st-gate-n">${esc(p.title())}</span>${p.sub?`<span class="st-note">${esc(p.sub())}</span>`:''}${st.text?`<span class="st-gate-s">${esc(stShortState(st.text))}</span>`:''}</span>
        <button type="button" class="ui-btn ui-btn-sm" data-st-panel="${k}">${esc(i18t('st_gates_open'))}</button></div>`; }).join('')}</div>`
      :`<p class="st-note">${esc(i18t('st_gov_all_on'))}</p>` };
}
/* A DOOR THAT NAMES THE BOX: the drawer opens and the reader's hand lands on
   that one control, lit once. A select is never focused (on an iPad a
   focused select IS the system picker) — fieldFocus decides. */
function stDrawerFocus(sel){
  if(!sel || typeof document==='undefined') return;
  /* LAND ON IT (owner, 18 Oct 2026): the one lander lights it the one way
     every arrival is lit and readies it (a select through fieldFocus) */
  if(typeof landOn==='function'){ landOn('#st-dbody '+sel,{ block:'center' }); return; }
  const go=()=>{ const el=document.querySelector('#st-dbody '+sel); if(!el) return;
    try{ el.scrollIntoView({block:'center'}); }catch(_){}
    if(el.tagName==='SELECT'){ if(typeof fieldFocus==='function') fieldFocus(el); }
    else try{ el.focus({preventScroll:true}); }catch(_){} };
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(go); else go();
}
/* ---- SEND THE WELCOME AGAIN (piece 8) ----
   The same email the account was made with, to the member's own stored
   address, while they have not yet signed in (the server refuses otherwise).
   "Sent" means sent: the toast says sent, queued or refused-and-why. */
async function stResendInvite(id, btn){
  const u=(typeof userById==='function')?userById(id):null; if(!u) return;
  if(!(typeof API_MODE==='function'&&API_MODE())){ toast(i18t('st_needs_server'),'warn'); return; }
  const was=btn?btn.textContent:''; if(btn){ btn.disabled=true; if(window.busySet) busySet(btn,i18t('co_sending')); }
  try{
    const r=await api('users/'+u.id+'/invite','POST',{});
    if(r&&r.user) Object.assign(u,r.user);
    if(r&&r.emailSent) toast(i18t('st_resend_sent',{name:stNameOf(u)}),'ok');
    else if(r&&(r.outbox||r.emailConfigured===false)) toast(i18t('st_resend_outbox',{name:stNameOf(u)}),'warn');
    else toast(i18t('st_resend_refused',{why:(r&&r.emailError)||''}),'err');
    stSyncAttention();
  }catch(e){ toast(e.message,'err'); }
  finally{ if(btn&&btn.isConnected){ btn.disabled=false; btn.textContent=was; } }
}

/* ---- THE TWO BOARDS ---- */
function stCompanyHtml(){
  if(_stPage==='panel') return stDockPageHtml();
  if(_stPage==='team') return stTeamPageHtml();
  if(_stPage==='sheet') return stSheetPageHtml();
  if(_stPage==='roles') return stRolesPageHtml();
  if(_stPage==='streams') return stStreamsPageHtml();
  if(_stPage==='data') return stDataPageHtml();
  return `<div class="st-board" id="st-board">
    ${stNeedsHtml()}
    <div class="st-cards">${ST_CARDS.filter(c=>c.key!=='ladder').map(c=>c.key==='people'?stPeopleCardHtml():stGroupCardHtml(c)).join('')}</div>
    ${stGovLadderHtml()}
    ${stSheetCardHtml()}
  </div>`;
}

/* ============================================================
   THE YOU BOARD, AS DRAWN (16 Oct 2026, the full build)
   ============================================================
   One short card per part of the person's own settings — two facts and the
   doors behind them — and each door opens the one drawer with that part of
   the account builder in it (stMeDrawer), so the controls live in one place.
   Two facts are the server's and are read once per sitting: how many devices
   are signed in, and how many recovery codes are left. */
let _stYouFacts={ devices:null, codes:null, sessions:null }, _stYouAsking=false;
async function stYouLoad(){
  if(_stYouAsking || !(typeof API_MODE==='function'&&API_MODE())) return;
  _stYouAsking=true;
  try{
    const [ss,ts]=await Promise.all([
      api('sessions').catch(()=>null),
      api('me/totp').catch(()=>null)]);
    if(ss&&Array.isArray(ss.sessions)){ _stYouFacts.devices=ss.sessions.length; _stYouFacts.sessions=ss.sessions; }
    if(ts&&typeof ts.recoveryLeft==='number') _stYouFacts.codes=ts.recoveryLeft;
    _stYouFacts.loaded=true;
    /* the section redrawn where it stands — a form open in one of its rows
       stays open (stYouCardRepaint keeps it) */
    stYouCardRepaint('safety');
    const left=document.getElementById('ts-codes-left'); if(left) left.textContent=stCodesLeftText();
  }finally{ _stYouAsking=false; }
}
function stCodesLeftText(){
  const n=_stYouFacts.codes;
  return n==null?i18t('st_you_codes_unknown'):i18tn('st_you_codes_left',n,{n});
}
const stLangName=()=>{ const id=(typeof langId==='function')?langId():''; const L=(typeof LANGUAGES!=='undefined'?LANGUAGES:[]).find(l=>l.id===id); return (L&&(L.name||L.label))||id; };
const stOpensWord=()=>i18t('st_opens_'+((typeof contractOpensOn==='function')?contractOpensOn():'jambo'));
/* WHAT "YOU" HOLDS, BY NAME — the cards, the Menu's You group and what Jambo
   can find for anyone. `door` is what the card's main door opens. The old
   names still arrive from earlier doors (stYouItem's ST_YOU_WAS). */
function stYouItems(){
  const u=(typeof currentUser==='function'&&currentUser())||{};
  const api=(typeof API_MODE==='function')&&API_MODE();
  return [
    { key:'who', t:'st_you_who', w:['st_f_name','st_f_email','st_acct_job','st_acct_job_sub','st_f_title','st_you_name_row','st_you_email_row'], door:'me:name',
      state:()=>(typeof roleName==='function')?roleName(u.role):'' },
    api && { key:'safety', t:'st_you_signin', w:['st_you_safety','ts_title','ts_sub','st_acct_sessions','set_sessions_sub','st_you_codes_words'], door:'me:twostep',
      state:()=>i18t(u.twoStep?'st_you_ts_on':'st_you_ts_off') },
    api && { key:'password', t:'st_you_password', w:['st_you_password_sub','st_you_password_words'], door:'me:password' },
    { key:'lang', t:'st_you_lang', w:['st_acct_lang_note','st_you_lang_words'], focus:'#st-you-lang .st-yseg', state:stLangName },
    /* told and work change IN THEIR ROWS on the sheet (round 24): no drawer
       door; their drawers stay for the avatar's account drawer */
    api && { key:'told', t:'st_you_told', w:['st_acct_email','set_brief_how_often','set_brief_daily','set_brief_weekly','set_brief_off','st_you_told_words','st_you_push_row','push_find_words'], focus:'[data-st-brief]',
      state:()=>i18t('st_you_brief_'+briefCadenceOf(u)) },
    { key:'work', t:'st_you_work', w:['st_you_chips','st_you_opens','st_you_work_words'], focus:'[data-st-sw="chips"]',
      state:stOpensWord },
    { key:'data', t:'st_you_data', w:['st_acct_backup','set_export_backup','st_you_data_words'] },
    (u.role==='legal') && { key:'design', t:'st_acct_design', w:['set_edit_design','st_acct_design_note','st_you_design_words'], door:'me:design' },
    (api && typeof agPointsTableHtml==='function') && { key:'points', t:'jh_pt_h_mine', toc:'st_you_toc_points', w:['st_you_points_words'], door:'me:points' },
    api && { key:'away', t:'st_you_away', w:['st_aw_who','st_aw_never_sign','st_you_away_words'], door:'me:away', state:stAwayState },
  ].filter(Boolean);
}
/* names the You cards had before the full build, still asked by older doors */
const ST_YOU_WAS={ job:'who', sidebar:'work', email:'told', twostep:'safety', sessions:'safety', backup:'data' };
const stYouItem=k=>stYouItems().find(it=>it.key===(ST_YOU_WAS[k]||k))||null;
/* every word a You row can be found by, tags out */
const stYouHay=it=>[it.t].concat(it.w).map(k=>i18t(k)).join(' ').replace(/<[^>]*>/g,' ').toLowerCase();
/* ONE SHEET (round 24 of the redesign: the owner picked "One sheet" by name,
   17 Oct 2026): You is one page of plain rows under its headings, with a
   contents list beside it. A switch or a choice changes right in its row,
   through the same writer its drawer uses, with a passing confirmation; the
   forms that need several boxes (job title, password, two-step, away, the
   points table, the design) keep their one door, the drawer. Each heading's
   section still answers to data-st-you-card="<key>", so every door, Jambo's
   finder and a repaint reach it by the same name. Away comes first. */
/* EIGHT HEADINGS, AS DRAWN (round 24, the gaps of 18 Oct 2026): Company
   design is a workspace setting an editor may change, not theirs alone — it
   is off the sheet and still found by its name (the Menu, ⌘K, Jambo), where
   it opens in its drawer (stYouGo: no row, the drawer) */
const ST_YOU_SHEET=['away','who','safety','lang','told','work','points','data'];
const ST_YOU_OFF_SHEET=['password','design'];
/* a row: label · value · act. `row` names the form that opens UNDER it (round
   24 as drawn: "Opens in place") — data-st-row, the anchor stRowFormOpen uses */
const stSrHtml=(label,value,act,cls,row)=>`<div class="st-sr${cls?' '+cls:''}"${row?` data-st-row="${row}"`:''}><div class="st-sl">${label}</div><div class="st-sv">${value}</div><div class="st-sa">${act||''}</div></div>`;
/* ALERTS ON THIS DEVICE (round 4 of Jambo's journey): one row under What you're told. The browser is
   asked where this device stands (pushState, js/push.js) and the row redrawn when it answers; a switch
   is drawn only where it can be used, otherwise the words say why and what to do. */
let _stPush=null;
function stPushHtml(){
  const st=_stPush;
  if(!st) return `<span data-st-push>${(typeof busyHtml==='function')?busyHtml(i18t('push_checking')):esc(i18t('push_checking'))}</span>`;
  const sw=(st==='on'||st==='off')?stSwHtml('push',st==='on',i18t('st_you_push_row')):'';
  return `<span data-st-push class="st-push">${sw}<span class="st-you-sub">${esc(typeof pushStateSaid==='function'?pushStateSaid(st):st)}</span></span>`;
}
function stPushPaint(){ document.querySelectorAll('#set-page [data-st-push]').forEach(el=>{ el.outerHTML=stPushHtml(); }); }
function stPushRefresh(){
  if(typeof pushState!=='function') return;
  pushState().then(st=>{ if(st!==_stPush){ _stPush=st; stPushPaint(); } }).catch(()=>{});
}
const stSwHtml=(key,on,label)=>`<button type="button" role="switch" class="st-swt${on?' on':''}" aria-checked="${on?'true':'false'}" aria-label="${esc(label)}" data-st-sw="${key}"><i aria-hidden="true"></i></button>`;
/* THE DEVICES ROW IN WORDS (round 24: "2 signed in — this laptop and an
   iPad"), read off each session's own browser line; the session this page
   runs in is "this …". Never a guess beyond what the line says. */
const stDeviceKind=ua=>{ const s=String(ua||'');
  return /iPad/i.test(s)||(/Macintosh/i.test(s)&&/Mobile/i.test(s))?'ipad':/iPhone|Android.*Mobile|Mobile/i.test(s)?'phone':/Android/i.test(s)?'tablet':'computer'; };
function stDeviceWord(ua, current){
  return i18t((current?'st_dev_this_':'st_dev_a_')+stDeviceKind(ua));
}
/* DEVICES SAID ONCE, WITH THEIR COUNT (round 24 as drawn: "2 signed in —
   this laptop and an iPad"; the gaps' third pass): this one first, then each
   other kind once — "this computer and 9 other computers", "this computer
   and an iPad" — never the same word ten times */
function stDevicesSaid(list){
  const ss=(Array.isArray(list)?list:[]).slice().sort((a,b)=>(b.current?1:0)-(a.current?1:0));
  const cur=ss.find(x=>x.current), curKind=cur?stDeviceKind(cur.ua):'';
  const kinds=[]; const n={};
  ss.filter(x=>x!==cur).forEach(x=>{ const k=stDeviceKind(x.ua); if(!n[k]){ n[k]=0; kinds.push(k); } n[k]++; });
  const words=(cur?[stDeviceWord(cur.ua,true)]:[]).concat(kinds.map(k=>k===curKind
    ?i18tn('st_dev_other_'+k,n[k],{ n:n[k] })
    :(n[k]===1?i18t('st_dev_a_'+k):i18tn('st_dev_n_'+k,n[k],{ n:n[k] }))));
  let joined=words.join(', ');
  try{ if(typeof Intl!=='undefined'&&Intl.ListFormat) joined=new Intl.ListFormat((typeof langLocale==='function')?langLocale():undefined,{ type:'conjunction' }).format(words); }catch(_){}
  return i18tn('st_you_devices_on',ss.length,{ n:ss.length, list:joined });
}
/* "Dates and money": the market's own name and money, said */
function stMarketSaid(){
  const name=(typeof jxName==='function')?jxName():'', cur=(typeof jxCurrency==='function')?jxCurrency():'';
  return (name||cur)?i18t('st_you_lang_market',{ market:[name,cur].filter(Boolean).join(', ') }):i18t('st_you_lang_sub');
}
/* one person, as the drawing draws whom you stand in for */
const ST_PERSON_SVG='<svg class="st-aw-ic" viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.8-2.6 2.7-3.8 5-3.8s4.2 1.2 5 3.8"/></svg>';
/* WHOM THIS PERSON ANSWERS FOR, AND WHAT OF THEIRS WAITS NOW (round 24 as
   drawn: "1 waits now: Helio Energy's approval"): the approvals on the
   worklist that ask this reader BECAUSE they stand in — read off the
   worklist's own rows, never a second reading of who approves */
function stAwayWaiting(r){
  if(!r||typeof apApprovalRows!=='function') return [];
  const who=String(r.userName||'').trim(); if(!who) return [];
  try{ return apApprovalRows().filter(x=>x&&x.mine&&String(x.waitsOn||'').trim()===who); }catch(_){ return []; }
}
function stYouCardHtml(it){
  if(!it) return '';
  const u=(typeof currentUser==='function'&&currentUser())||{};
  const apiOn=(typeof API_MODE==='function')&&API_MODE();
  const sub=html=>`<span class="st-you-sub">${html}</span>`;
  const door=(attrs,label)=>`<button type="button" class="ui-link st-sr-door" ${attrs}>${esc(label)}</button>`;
  /* a door that opens its form IN ITS ROW; pressed again it closes */
  const rdoor=(key,label)=>`<button type="button" class="ui-link st-sr-door" data-st-rform="${key}" aria-expanded="${_stRow&&_stRow.key===key?'true':'false'}">${esc(label)}</button>`;
  const d=k=>`data-st-panel="${k}"`;
  let rows='', chip='';
  if(it.key==='who'){
    const admin=u.role==='admin';
    const role=[u.bizRole||u.title, (typeof roleName==='function')?roleName(u.role):''].filter(Boolean).join(' · ');
    /* "— set by Sara" (round 24 as drawn): the admin's first name */
    const by=u.roleBy?i18t('st_you_role_by',{ who:String(u.roleBy).trim().split(/\s+/)[0] }):(admin?'':i18t('st_you_role_by_admin'));
    rows=stSrHtml(esc(i18t('st_you_name_row')), esc(u.name||u.email||''), rdoor('me:name',i18t('st_you_change')), '', 'me:name')
      +stSrHtml(esc(i18t('st_you_role')), `${esc(role)}${by?` ${sub(esc(by))}`:''}`, admin?'':`<button type="button" class="ui-link st-sr-door" data-st-ask-head="role">${esc(i18t('st_ask_go'))}</button>`)
      +stSrHtml(esc(i18t('st_you_email_row')), esc(u.email||''), apiOn?rdoor('me:email',i18t('st_you_change')):'', '', 'me:email');
  } else if(it.key==='safety'){
    const ss=_stYouFacts.sessions;
    const pw=u.pwAt?esc(i18t('st_you_pw_changed',{ day:stAwayDay(u.pwAt) })):sub(esc(i18t('st_you_pw_unknown')));
    rows=stSrHtml(esc(i18t('st_you_password_row')), pw, rdoor('me:password',i18t('st_you_change')), '', 'me:password')
      +stSrHtml(esc(i18t('ts_title')), `<span class="chip ${u.twoStep?'st-chip-on':'st-chip-off'}">${esc(i18t(u.twoStep?'st_sh_on':'st_sh_off'))}</span>${u.twoStep?' '+sub(esc(stCodesLeftText())):''}`, rdoor('me:twostep',i18t('st_you_manage')), '', 'me:twostep')
      +stSrHtml(esc(i18t('st_you_devices_row')), ss?esc(stDevicesSaid(ss)):sub(esc(i18t('st_you_devices_unknown'))), rdoor('me:sessions',i18t('st_you_see_them')), '', 'me:sessions');
  } else if(it.key==='lang'){
    const now=(typeof langId==='function')?langId():'';
    const L=(typeof LANGUAGES!=='undefined'?LANGUAGES:[]);
    rows=stSrHtml(esc(i18t('st_you_lang')), `<span class="st-yseg" role="group" aria-label="${esc(i18t('st_you_lang'))}">${L.map(l=>`<button type="button" data-st-lang="${esc(l.id)}" aria-pressed="${l.id===now?'true':'false'}">${esc(l.name||l.id)}</button>`).join('')}</span>`, '', 'is-lang')
      +stSrHtml(esc(i18t('st_you_lang_money')), sub(esc(stMarketSaid())), '');
  } else if(it.key==='told'){
    const cad=briefCadenceOf(u);
    setTimeout(stPushRefresh,0);   /* the browser answers where this device stands; the row follows */
    rows=stSrHtml(esc(i18t('st_you_brief_row')), `<select data-st-brief aria-label="${esc(i18t('st_you_brief_row'))}">${['daily','weekly','off'].map(v=>`<option value="${v}"${v===cad?' selected':''}>${esc(i18t('set_brief_'+v))}</option>`).join('')}</select>`, '')
      +stSrHtml(esc(i18t('st_you_push_row')), stPushHtml(), '', 'is-sw', 'push')
      +stSrHtml(esc(i18t('st_you_bell_only')), sub(esc(i18t('st_you_bell_says'))), '')
      +stSrHtml(esc(i18t('st_you_email_told')), sub(esc(i18t('st_you_email_says'))), '');
  } else if(it.key==='work'){
    /* THE SIDEBAR SWITCH WENT (owner's yes, 18 Oct 2026, round 24's open
       question): a computer draws no left sidebar any more (the Counter and
       the desk tabs), so the switch had nothing to act on. The phone keeps its
       own (js/mobile.js), where the menu still earns its items. */
    const chips=(typeof jamboChipsOn!=='function')||jamboChipsOn();
    const opens=(typeof contractOpensOn==='function')?contractOpensOn():'jambo';
    rows=stSrHtml(esc(i18t('st_you_chips')), `${stSwHtml('chips',chips,i18t('st_you_chips'))}${sub(esc(i18t('st_you_chips_box')))}`, '', 'is-sw')
      +stSrHtml(esc(i18t('st_you_opens')), `<select data-st-opens aria-label="${esc(i18t('st_you_opens'))}">${((typeof OPENS_ON!=='undefined')?OPENS_ON:['jambo']).map(v=>`<option value="${v}"${v===opens?' selected':''}>${esc(i18t('st_opens_'+v))}</option>`).join('')}</select>`, '')
      /* THE NEW LOOK (owner, 31 Oct 2026): an admin's own preview of the Legora way while it is built page by page */
      +((typeof isAdmin==='function'&&isAdmin())?stSrHtml(esc(i18t('st_you_newlook')), `${stSwHtml('newlook',(typeof newLookOn==='function')&&newLookOn(),i18t('st_you_newlook'))}${sub(esc(i18t('st_you_newlook_sub')))}`, '', 'is-sw'):'');
  } else if(it.key==='data'){
    rows=stSrHtml(esc(i18t('st_you_data_line')), sub(esc(i18t(apiOn?'st_you_data_kept':'st_you_data_sub'))), `<button type="button" class="ui-btn ui-btn-sm" data-st-mycopy>${icon('download','w-3.5 h-3.5')} ${esc(i18t('st_you_download'))}</button>`);
  } else if(it.key==='design'){
    rows=stSrHtml(esc(i18t('st_acct_design')), sub(esc(i18t('st_acct_design_note'))), door(d('me:design'),i18t('set_edit_design')));
  } else if(it.key==='points'){
    const keys=(typeof agPointsKeys==='function')?agPointsKeys():[];
    const own=keys.filter(k=>{ try{ return !!agPointsMine(k); }catch(_){ return false; } }).length;
    rows=stSrHtml(esc(i18t('st_you_points_row')), `${esc(i18tn('st_you_points_of',own,{ n:own, of:keys.length }))} ${sub(esc(i18t('st_you_points_rest')))}`, rdoor('me:points',i18t('st_you_points_door')), '', 'me:points');
  } else if(it.key==='away'){
    const a=state.away||{}, m=a.mine, me=stFirstOf(u.name)||u.email||'';
    if(m){
      chip=` <span class="chip st-chip-on st-aw-chip">${esc(stAwayState())}</span>`;
      /* the stand-in named whole once, then by first name, as drawn ("Each
         thing Maria answers says 'for Jonas'") */
      rows=stSrHtml(esc(i18t('st_aw_who')), `<b>${i18t('st_aw_line',{who:`<b>${esc(m.deputyName)}</b>`,from:`<b>${esc(stAwayWeekDay(m.from))}</b>`,to:`<b>${esc(stAwayWeekDay(m.to))}</b>`})}</b>${sub(esc(i18t('st_aw_sub',{who:stFirstOf(m.deputyName)||m.deputyName,me})))}`,
        rdoor('me:away',i18t('st_aw_change'))+door('data-st-away-end',i18t('st_aw_end')), '', 'me:away');
    } else {
      rows=stSrHtml(esc(i18t('st_aw_who')), `<b>${esc(i18t('st_aw_none'))}</b>${sub(esc(i18t('st_aw_none_sub')))}`,
        `<button type="button" class="ui-btn ui-btn-sm" data-st-rform="me:away" aria-expanded="${_stRow&&_stRow.key==='me:away'?'true':'false'}">${esc(i18t('st_aw_set'))}</button>`, '', 'me:away');
    }
    /* whom this person answers for, said where they keep their own — and
       what of theirs waits now, with the door to it (round 24 as drawn) */
    rows+=(Array.isArray(a.covering)?a.covering:[]).map(r=>{
      const on=r.from<=(a.today||todayISO());
      const w=on?stAwayWaiting(r):[];
      const first=w[0]&&w[0].c;
      const waits=w.length?' '+i18tn('st_aw_waits',w.length,{ n:w.length, what:i18t('st_aw_waits_what',{ party:(first&&(first.counterparty||first.name))||'' }) }):'';
      return `<div class="st-sr is-full"><div class="st-aw-cover">${ST_PERSON_SVG}<div class="st-aw-cw"><b class="st-aw-for">${esc(i18t(on?'st_aw_covering':'st_aw_covering_later',{who:r.userName,from:stAwayWeekDay(r.from),to:stAwayWeekDay(r.to)}))}</b>
        <span class="st-you-sub">${esc(i18t('st_aw_cover_what'))}${esc(waits)}</span></div>
        ${on?`<button type="button" class="ui-btn ui-btn-sm" data-st-away-open="${PB_ATTR((first&&first.id)||'')}">${esc(i18t('st_aw_open_it'))}</button>`:''}</div></div>`; }).join('');
  } else if(it.key==='password') return '';
  return `<section class="st-grp st-ssec st-you-card" data-st-you-card="${it.key}" id="st-you-${it.key}">
    <h3 class="st-ssec-h">${esc(i18t(it.t))}${chip}</h3>
    <div class="st-srows">${rows}</div>
  </section>`;
}
/* the sheet's sections, away first, each drawn once */
function stYouSheetItems(){
  const all=stYouItems().filter(it=>!ST_YOU_OFF_SHEET.includes(it.key));
  return ST_YOU_SHEET.map(k=>all.find(it=>it.key===k)).filter(Boolean).concat(all.filter(it=>!ST_YOU_SHEET.includes(it.key)));
}
function stYouHtml(){
  const its=stYouSheetItems();
  return `<div class="st-board st-youb" id="st-board">
    <div class="st-sheet">
      <nav class="st-toc" aria-label="${esc(i18t('st_you_toc'))}">${its.map((it,i)=>`<button type="button" data-st-toc="${it.key}"${i===0?' aria-current="true"':''}>${esc(i18t(it.toc||it.t))}</button>`).join('')}</nav>
      <div class="st-cards st-you-board">${its.map(stYouCardHtml).join('')}</div>
    </div>
  </div>`;
}
/* THE IN-PLACE WRITERS — each the one its drawer uses too, each confirming
   with a passing toast, each putting the screen back if the save fails */
async function stChipsSet(on){
  if(await stPrefSet('jamboChips', on)){ toast(i18t(on?'st_you_chips_saved_on':'st_you_chips_saved_off'),'ok'); stYouCardRepaint('work');
    /* the chips beside this page follow at once */
    stJbFeedRepaint();
    return true; }
  stYouCardRepaint('work'); return false;
}
async function stNewLookSet(on){
  if(await stPrefSet('newLook', on)){ if(typeof newLookApply==='function') newLookApply();
    /* the frame's own measures (the panels' widths, the slider) read the page again */
    try{ globalThis.dispatchEvent(new Event('resize')); }catch(_){}
    /* the doors above Jambo's box and Home's new parts follow at once */
    if(typeof jamboWaysSync==='function') try{ jamboWaysSync(); }catch(_){}
    if(typeof counterRepaint==='function') try{ counterRepaint(); }catch(_){}
    toast(i18t(on?'st_you_newlook_on':'st_you_newlook_off'),'ok'); stYouCardRepaint('work'); return true; }
  stYouCardRepaint('work'); return false;
}
async function stOpensSet(v){
  if(await stPrefSet('opensOn', v)){ toast(i18t('st_you_opens_saved',{where:i18t('st_opens_'+v)}),'ok'); stYouCardRepaint('work'); return true; }
  stYouCardRepaint('work'); return false;
}
async function stBriefSet(v){
  const was=briefCadenceOf(currentUser());
  try{
    const r=await api('me/prefs','PUT',{ briefEvery:v });
    const u=currentUser(); if(u) u.prefs=(r&&r.prefs)||{ ...(u.prefs||{}), briefEvery:v };
    briefPaintCadence(v);          // every copy of the control says the same thing
    toast(i18t('set_brief_saved_'+v),'ok');
    return true;
  }catch(err){
    /* THE SCREEN MUST NOT CLAIM A SAVE THAT FAILED — put the previous
       answer back rather than leaving the new one lit. */
    briefPaintCadence(was);
    toast(i18t('set_daily_brief_fail')+(err&&err.message||''),'err');
    return false;
  }
}
/* THE CONTENTS LIST MARKS WHERE YOU ARE (round 24's Compare, as drawn): the
   heading whose section holds the reading line — a third of the way down the
   page's scroller — is lit as the sheet scrolls; at the foot of the page, the
   last. One listener, on the document, bound once. */
let _stTocHold=0, _stTocAsk=0;
function stTocLight(k){
  document.querySelectorAll('#set-page [data-st-toc]').forEach(b=>{ if(b.getAttribute('data-st-toc')===k) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current'); });
}
function stTocSpy(){
  _stTocAsk=0;
  if(Date.now()<_stTocHold||!document.querySelector('#set-page .st-toc')) return;
  const sc=document.getElementById('content-scroll'); if(!sc) return;
  const secs=[...document.querySelectorAll('#set-page .st-you-board [data-st-you-card]')]; if(!secs.length) return;
  const box=sc.getBoundingClientRect(), line=box.top+Math.max(96,box.height/3);
  let at=secs[0];
  /* AT THE VERY TOP THE FIRST HEADING IS THE ONE BEING READ (round 24 as
     drawn: "When you're away" lit at the top of the sheet; the gaps' third
     pass) — the reading line would pass a short first section */
  if(sc.scrollTop<=2) at=secs[0];
  else if(sc.scrollTop+sc.clientHeight>=sc.scrollHeight-2) at=secs[secs.length-1];
  else secs.forEach(s=>{ if(s.getBoundingClientRect().top<=line) at=s; });
  stTocLight(at.getAttribute('data-st-you-card'));
}
if(typeof document!=='undefined' && !window._stTocWired){
  window._stTocWired=true;
  document.addEventListener('scroll',e=>{
    if(!e.target||e.target.id!=='content-scroll'||_stTocAsk) return;
    _stTocAsk=(typeof requestAnimationFrame==='function')?requestAnimationFrame(stTocSpy):(stTocSpy(),0);
  },{ capture:true, passive:true });
}
/* the sheet's presses, delegated once: the contents list jumps, a language
   button switches through langSet (the bar's own writer), a switch or a
   choice writes in place */
if(typeof document!=='undefined' && !window._stSheetWired){
  window._stSheetWired=true;
  document.addEventListener('click',e=>{
    const t=e.target&&e.target.closest?e.target:null; if(!t||!t.closest('#set-page')) return;
    let el;
    if((el=t.closest('[data-st-toc]'))){
      const k=el.getAttribute('data-st-toc'), sec=document.getElementById('st-you-'+k);
      stTocLight(k);
      /* the press wins while its own scroll runs; the list follows the
         reader's scrolling again after it */
      _stTocHold=Date.now()+900;
      if(sec){ if(typeof landOn==='function') landOn(sec,{ block:'start', focus:false });
        else try{ sec.scrollIntoView({block:'start'}); }catch(_){ /* nothing to scroll */ } }
      return; }
    if((el=t.closest('[data-st-lang]'))){ const id=el.getAttribute('data-st-lang');
      if(id && id!==((typeof langId==='function')?langId():'') && typeof langSet==='function'){ langSet(id); toast(i18t('st_you_lang_saved',{name:el.textContent.trim()}),'ok'); }
      return; }
    if((el=t.closest('[data-st-sw]'))){ const k=el.getAttribute('data-st-sw'), on=el.getAttribute('aria-checked')!=='true';
      el.setAttribute('aria-checked',String(on)); el.classList.toggle('on',on);
      if(k==='chips') stChipsSet(on);
      if(k==='newlook') stNewLookSet(on);
      if(k==='push' && typeof pushToggle==='function'){ el.disabled=true;
        pushToggle(on).then(r=>{ _stPush=r.state; stPushPaint(); }); }
      return; }
  });
  document.addEventListener('change',e=>{
    const t=e.target; if(!t||!t.closest||!t.closest('#set-page')) return;
    if(t.hasAttribute('data-st-brief')){ stBriefSet(t.value); return; }
    if(t.hasAttribute('data-st-opens')){ stOpensSet(t.value); return; }
  });
}
/* SHOW ME: the You tab, that card, lit, and its form open with the reader's
   hand on the control — the control is still theirs to use. On the sheet a
   form opens IN ITS ROW (round 24 as drawn); off it, the drawer.
   Language lights the one switch at the top of the window instead. */
function stYouGo(key, focusSel){
  const it=stYouItem(key); if(!it) return;
  if(settingsTab()!=='you' || _stPage){ _stTab='you'; _stPage=null; renderTeam(); }
  const card=document.querySelector(`#set-page [data-st-you-card="${it.key}"]`);
  /* LAND ON IT (owner, 18 Oct 2026): a form that opens in its row lands on
     its box; otherwise on the card, its control readied (the one lander) */
  if(it.door){
    if(document.querySelector(`#set-page [data-st-row="${it.door}"]`)){ if(!(_stRow&&_stRow.key===it.door)) stRowFormOpen(it.door); stRowFormFocus(focusSel||it.focus||''); }
    else { stDrawerOpen(it.door); stDrawerFocus(focusSel||it.focus||''); }
    if(!(focusSel||it.focus) && card && typeof landOn==='function') landOn(card,{ block:'nearest', focus:false });
    return; }
  const sel=focusSel||it.focus;
  const f=sel?document.querySelector(sel):null;
  const ctl=f&&f.matches&&f.matches('button,input,a')?null:'button:not([aria-pressed="true"]),button,input';
  if(card && typeof landOn==='function') landOn(card,{ block:'nearest', focus:ctl||false });
  if(f && !ctl) try{ f.focus({preventScroll:true}); }catch(_){}
}
/* a You card redrawn where it stands after its form wrote (THE SETTINGS PAGE
   HOLDS STILL); a form open in one of its rows is drawn open again */
function stYouCardRepaint(key){
  const card=document.querySelector(`#set-page [data-st-you-card="${key}"]`); if(!card) return;
  /* the open form is carried across, as it stands — what the hand typed and
     what its wiring listens to stay where they were */
  const host=card.querySelector('#st-rform'), open=host&&_stRow?_stRow.key:null;
  if(host) host.remove();
  const d=document.createElement('div'); d.innerHTML=stYouCardHtml(stYouItem(key)); const fresh=d.firstElementChild; if(!fresh) return;
  card.replaceWith(fresh);
  stDressPage();
  if(!open) return;
  const row=fresh.querySelector(`[data-st-row="${open}"]`);
  if(!row){ _stRow=null; return; }
  row.after(host); row.classList.add('is-open');
  fresh.querySelectorAll(`[data-st-rform="${open}"]`).forEach(b=>b.setAttribute('aria-expanded','true'));
}
/* EACH YOU DOOR'S FORM: the account builder's named sections, and the
   person's own name and email (round 24 as drawn) */
function stMeDrawer(key){
  const u=(typeof currentUser==='function'&&currentUser())||{};
  const sections={ who:['job'], safety:['twostep','sessions'], twostep:['twostep'], sessions:['sessions'], told:['email'], work:['work'], design:['design'], points:['points'] };
  if(key==='password') return stPasswordDrawer();
  if(key==='away') return stAwayDrawer();
  if(key==='name') return stNameForm();
  if(key==='email') return stEmailForm();
  if(!sections[key]) return null;
  const it=stYouItem(key==='twostep'||key==='sessions'?'safety':key);
  const head=key==='who'?`<div class="st-me-who"><span class="st-me-n">${esc(u.name||u.email||'')}</span><span class="st-note">${esc([u.email,(typeof roleName==='function')?roleName(u.role):''].filter(Boolean).join(' · '))}</span></div>`:'';
  return { title:i18t(key==='twostep'?'ts_title':key==='sessions'?'st_acct_sessions':(it?it.t:'st_acct_menu')), foot:'done',
    body:head+stAccountBodyHtml({ only:sections[key] }),
    wire:()=>{ stAccountWire(); if((key==='safety'||key==='twostep') && !_stYouFacts.loaded) stYouLoad(); } };
}
/* ---- A FORM OPENS IN ITS ROW (round 24 "One sheet" as drawn, the gaps of
   18 Oct 2026: "Two-step sign-in and When you're away open inside their row";
   every Change on the sheet says "Opens in place") ----
   ONE FORM, TWO HOSTS: the same descriptor the drawer paints (stMeDrawer —
   its body, its wiring, its Save) is painted under the row that asked for
   it, Save first and Cancel last, its refusal in its own foot. The writers
   are untouched: each still says stDrawerRefuse / stDrawerClose, and those
   reach the row while it is open. One form at a time, the drawer included;
   the door pressed again closes it (PRESS IT AGAIN AND IT CLOSES); Esc
   closes it while the hand is in it. */
let _stRow=null;
function stRowFormOpen(key){
  if(_stRow && _stRow.key===key){ stRowFormClose(); return; }
  if(_stRow) stRowFormClose();
  if(_stOpen) stDrawerClose();
  const row=document.querySelector(`#set-page [data-st-row="${key}"]`);
  const d=String(key||'').indexOf('me:')===0?stMeDrawer(String(key).slice(3)):null;
  if(!d) return;
  if(!row){ stDrawerOpen(key); return; }
  /* the drawer's last body is emptied: its ids must not answer for the row's */
  const dbody=document.getElementById('st-dbody'); if(dbody) dbody.innerHTML='';
  const host=document.createElement('div');
  host.className='st-rform'; host.id='st-rform'; host.setAttribute('data-st-rform-of',key);
  host.setAttribute('role','group'); host.setAttribute('aria-label',d.title||'');
  host.innerHTML=`${d.sub?`<p class="st-note st-rform-sub">${esc(d.sub)}</p>`:''}<div class="st-rform-body">${d.body||''}</div>
    <div class="st-rform-foot"><div id="st-rform-refusal" class="st-refusal" hidden></div>
      <div class="st-rform-acts">${d.foot==='save'
        ?`<button type="button" class="ui-btn ui-btn-primary" id="st-rform-save">${esc(i18t('act_save'))}</button><button type="button" class="ui-btn" data-st-rform-close data-dlg-cancel>${esc(i18t('act_cancel'))}</button>`
        :`<button type="button" class="ui-btn" data-st-rform-close>${esc(i18t('st_done'))}</button>`}</div></div>`;
  row.insertAdjacentElement('afterend', host);
  row.classList.add('is-open');
  document.querySelectorAll(`#set-page [data-st-rform="${key}"]`).forEach(b=>b.setAttribute('aria-expanded','true'));
  _stRow={ key, d };
  if(typeof d.wire==='function') try{ d.wire(); }catch(_){}
  if(typeof window.popupControlsDress==='function') try{ popupControlsDress(host); }catch(_){}
  if(typeof datePickDress==='function') try{ datePickDress(host); }catch(_){}
  if(d.foot==='save' && typeof d.save==='function') host.querySelector('#st-rform-save')?.addEventListener('click',()=>d.save());
  /* A SAVE THAT CANNOT ACT IS GREY, WITH ITS REASON BESIDE IT (round 24's
     check: "Away's Save is grey until she chooses a colleague and the days,
     and says so") — asked again as the boxes change */
  if(typeof d.ready==='function'){
    const sync=()=>{ const b=host.querySelector('#st-rform-save'); if(!b) return;
      let why=''; try{ why=d.ready()||''; }catch(_){ why=''; }
      b.disabled=!!why; if(why){ b.setAttribute('aria-disabled','true'); b.title=why; } else { b.removeAttribute('aria-disabled'); b.removeAttribute('title'); }
      const w=host.querySelector('.st-rform-why'); if(w) w.textContent=why; };
    host.querySelector('.st-rform-acts')?.insertAdjacentHTML('beforeend','<span class="st-note st-rform-why" aria-live="polite"></span>');
    host.addEventListener('change',sync); host.addEventListener('input',sync); sync();
  }
  const first=host.querySelector('input:not([type="hidden"]):not([disabled]),textarea');
  if(first) try{ first.focus({preventScroll:true}); }catch(_){}
  try{ host.scrollIntoView({block:'nearest'}); }catch(_){}
}
function stRowFormClose(){
  const was=_stRow; _stRow=null;
  const host=document.getElementById('st-rform'); if(host) host.remove();
  if(was){
    document.querySelectorAll(`#set-page [data-st-row="${was.key}"]`).forEach(r=>r.classList.remove('is-open'));
    document.querySelectorAll(`#set-page [data-st-rform="${was.key}"]`).forEach(b=>b.setAttribute('aria-expanded','false'));
  }
}
function stRowFormFocus(sel){
  if(!sel) return;
  if(typeof landOn==='function'){ landOn('#st-rform '+sel,{ block:'nearest' }); return; }
  const el=document.querySelector('#st-rform '+sel); if(!el) return;
  if(el.tagName==='SELECT'){ if(typeof fieldFocus==='function') fieldFocus(el); }
  else try{ el.focus({preventScroll:true}); }catch(_){}
}
/* ---- YOUR NAME AND JOB TITLE, CHANGED BY YOU (round 24 as drawn: "Name ·
   Change"; owner's yes to the gaps, 18 Oct 2026) ----
   The same route an admin's change takes (PATCH /api/users/:id): a name stays
   unique, and the server records the change in the trail. The job title
   rides the same form, as it always was the person's own. */
function stNameForm(){
  const u=(typeof currentUser==='function'&&currentUser())||{};
  const lbl=t=>`<span class="st-ps-l">${esc(t)}</span>`;
  return { title:i18t('st_you_name_h'), foot:'save',
    body:`<div class="st-tr-grid">
      <label class="st-tr-f">${lbl(i18t('st_you_name_row'))}<input id="st-me-name" type="text" maxlength="120" autocomplete="name" value="${PB_ATTR(u.name||'')}" style="${ST_INPUT}"/></label>
      <label class="st-tr-f">${lbl(i18t('st_f_title'))}<input id="st-me-title" type="text" maxlength="120" autocomplete="organization-title" value="${PB_ATTR(u.title||'')}" style="${ST_INPUT}"/></label>
    </div><p class="st-note">${esc(i18t('st_you_name_note'))}</p>`,
    save:()=>stNameSave() };
}
async function stNameSave(){
  stDrawerClearRefusal();
  const u=(typeof currentUser==='function'&&currentUser()); if(!u) return;
  const name=String((document.getElementById('st-me-name')||{}).value||'').trim();
  const title=String((document.getElementById('st-me-title')||{}).value||'').trim();
  if(!name) return stDrawerRefuse(i18t('st_you_name_need'));
  const body={};
  if(name!==(u.name||'')) body.name=name;
  if(title!==(u.title||'')) body.title=title;
  if(!Object.keys(body).length){ stDrawerClose(); return; }
  if(typeof API_MODE==='function'&&API_MODE()){
    try{ const r=await api('users/'+u.id,'PATCH',body); const keep={ bizRole:u.bizRole, roleBy:u.roleBy };
      if(r&&r.user){ Object.assign(u,r.user); if(!u.roleBy&&keep.roleBy) u.roleBy=keep.roleBy; if(keep.bizRole) u.bizRole=keep.bizRole; } else Object.assign(u,body); }
    catch(e){ return stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
  } else { Object.assign(u,body); if(typeof saveUsers==='function'&&typeof getUsers==='function') saveUsers(getUsers()); }
  if(typeof settingsMirrorDirectory==='function') try{ settingsMirrorDirectory(u.name,u.email,u.title||''); }catch(_){}
  toast(i18t('st_you_name_saved'),'ok');
  stDrawerClose(); stYouCardRepaint('who');
}
/* ---- YOUR EMAIL, CHANGED BY YOU, WITH YOUR CURRENT PASSWORD (round 24 as
   drawn: "Email · Change") ----
   POST /api/me/email: the server looks the person up by their session, checks
   the password (a wrong one counts as a wrong guess), refuses an address
   another member uses, and records the change in the trail. On the server
   only — a browser-only workspace has no sign-in to move. */
function stEmailForm(){
  const u=(typeof currentUser==='function'&&currentUser())||{};
  const lbl=t=>`<span class="st-ps-l">${esc(t)}</span>`;
  return { title:i18t('st_you_email_h'), foot:'save',
    body:`<div class="st-tr-grid">
      <label class="st-tr-f">${lbl(i18t('st_you_email_new'))}<input id="st-me-email" type="email" maxlength="160" autocomplete="email" placeholder="${PB_ATTR(u.email||'')}" style="${ST_INPUT}"/></label>
      <label class="st-tr-f">${lbl(i18t('st_pw_current'))}<input id="st-me-email-pw" type="password" autocomplete="current-password" style="${ST_INPUT}"/></label>
    </div><p class="st-note">${esc(i18t('st_you_email_note'))}</p>`,
    save:()=>stEmailSave() };
}
async function stEmailSave(){
  stDrawerClearRefusal();
  const u=(typeof currentUser==='function'&&currentUser()); if(!u) return;
  const email=String((document.getElementById('st-me-email')||{}).value||'').trim().toLowerCase();
  const current=String((document.getElementById('st-me-email-pw')||{}).value||'');
  if(!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) return stDrawerRefuse(i18t('st_you_email_bad'));
  if(!current) return stDrawerRefuse(i18t('st_you_email_need_pw'));
  if(!(typeof API_MODE==='function'&&API_MODE())) return stDrawerRefuse(i18t('st_needs_server'));
  let r=null;
  try{ r=await api('me/email','POST',{ email, current }); }
  catch(e){ return stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
  if(r&&r.user){ const keep={ bizRole:u.bizRole, roleBy:u.roleBy }; Object.assign(u,r.user); if(!u.roleBy&&keep.roleBy) u.roleBy=keep.roleBy; if(keep.bizRole) u.bizRole=keep.bizRole; } else u.email=email;
  if(typeof settingsMirrorDirectory==='function') try{ settingsMirrorDirectory(u.name,u.email,u.title||''); }catch(_){}
  toast(i18t('st_you_email_saved',{ email:u.email }),'ok');
  stDrawerClose(); stYouCardRepaint('who');
}
/* ---- YOUR DATA: A COPY OF EVERYTHING YOU CAN SEE, RECORDED (round 24 as
   drawn: "One file, to keep. The download is recorded.") ----
   On the server: GET /api/me/copy builds the file inside the reader's own
   walls and writes the download into the trail before it leaves. With no
   server, the browser's own copy, as before (nothing to record it in). */
async function stMyCopyDownload(btn){
  if(!(typeof API_MODE==='function'&&API_MODE())){ settingsExportBackup(); return; }
  const was=btn?btn.innerHTML:'';
  if(btn){ btn.disabled=true; if(typeof busySet==='function') busySet(btn,i18t('st_you_copy_busy')); }
  try{
    const res=await fetch('api/me/copy',{ credentials:'same-origin' });
    if(!res.ok){ let why=res.statusText; try{ why=(await res.json()).error||why; }catch(_){ } throw new Error(why); }
    const blob=await res.blob();
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`hati-my-copy-${(typeof todayISO==='function')?todayISO():new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    toast(i18t('st_you_copy_done'),'ok');
  }catch(e){ toast(i18t('st_you_copy_failed',{ why:(e&&e.message)||'' }),'err'); }
  finally{ if(btn&&btn.isConnected){ btn.disabled=false; btn.innerHTML=was; } }
}
/* ---- CHANGE YOUR PASSWORD, ANY TIME (piece 12) ----
   The route was always there (POST /api/password/change); only the first
   sign-in had a screen. The server checks the current password, refuses the
   same one again, and signs out every OTHER device — said before the press. */
function stPasswordDrawer(){
  const f=(id,label,ph)=>`<label style="display:block;margin-bottom:var(--s-3)"><span style="${window.RV_LBL||''}">${esc(label)}</span>
    <input id="${id}" type="password" autocomplete="${id==='pw-cur'?'current-password':'new-password'}" placeholder="${esc(ph||'')}" style="${window.RV_FLD||ST_INPUT}"/></label>`;
  return { title:i18t('st_you_password'), sub:i18t('st_you_password_sub'), foot:'save',
    body:`${f('pw-cur',i18t('st_pw_current'))}${f('pw-new',i18t('st_pw_new'))}${f('pw-again',i18t('st_pw_again'))}
      <p class="st-note">${esc(i18t('st_pw_others_out'))}</p>`,
    save:()=>stPasswordSave() };
}
async function stPasswordSave(){
  stDrawerClearRefusal();
  const v=id=>(document.getElementById(id)||{}).value||'';
  const cur=v('pw-cur'), nw=v('pw-new'), again=v('pw-again');
  if(nw.length<8) return stDrawerRefuse(i18t('co_password_too_short'));
  if(nw!==again) return stDrawerRefuse(i18t('co_passwords_differ'));
  try{ await api('password/change','POST',{ current:cur, password:nw }); }
  catch(e){ return stDrawerRefuse((e&&e.message)||i18t('st_pw_failed')); }
  /* the day the Signing in row says, now (the server stamped the same) */
  const me=(typeof currentUser==='function')&&currentUser(); if(me) me.pwAt=new Date().toISOString();
  toast(i18t('st_pw_done'),'ok'); stDrawerClose();
  _stYouFacts.devices=null; _stYouFacts.sessions=null; _stYouFacts.loaded=false; stYouCardRepaint('safety'); stYouLoad();
}
/* ---- WHEN YOU'RE AWAY (owner picked "An Away card on You — the SAP way",
   17 Oct 2026; piece 9 of the sensitive contracts and governance plan) ----
   SAP's substitution rule, on your own settings: who answers for you, from a
   day to a day, and what — your approvals and internal reviews, never your
   signing. It ends on its own. The server keeps the rule (/api/me/away) and
   is the wall: its awayCovers lets the stand-in answer only what the person
   would, only on contracts the stand-in could already open, and every answer
   says whom it was for. state.away is the bootstrap's copy for this person. */
let _stAw=null;
const stAwayDay=iso=>{ const t=Date.parse(iso||''); if(!t) return '';
  try{ return new Date(t).toLocaleDateString((typeof langLocale==='function')?langLocale():undefined,{ day:'numeric', month:'short', year:'numeric' }); }catch(_){ return String(iso).slice(0,10); } };
/* AN AWAY DAY AS DRAWN (round 24: "from Mon 12 Oct to Fri 23 Oct"; the gaps'
   third pass): its weekday, day and month — the year only where it is not
   this one. A bare day is read as that day wherever the reader is. */
const stAwayWeekDay=iso=>{ const t=Date.parse(iso||''); if(!t) return '';
  const bare=/^\d{4}-\d{2}-\d{2}$/.test(String(iso));
  const thisYear=String((typeof todayISO==='function')?todayISO():new Date().toISOString()).slice(0,4)===String(iso).slice(0,4);
  /* its parts joined by a space, as drawn ("Fri 23 Oct", never "Fri, 23 Oct");
     a month's own full stop ("okt.") is left to the sentence's */
  try{ return new Intl.DateTimeFormat((typeof langLocale==='function')?langLocale():undefined,
    Object.assign({ weekday:'short', day:'numeric', month:'short' }, thisYear?{}:{ year:'numeric' }, bare?{ timeZone:'UTC' }:{}))
    .formatToParts(new Date(t)).filter(p=>p.type!=='literal').map(p=>p.value).join(' ').replace(/\.$/,''); }
  catch(_){ return String(iso).slice(0,10); } };
/* a person's first name, as the drawings say a colleague in a sentence */
const stFirstOf=name=>String(name||'').trim().split(/\s+/)[0]||'';
/* the card's short state: running, coming, or not set */
function stAwayState(){
  const a=state.away||{}, m=a.mine;
  if(!m) return i18t('st_aw_state_off');
  return (m.from<=(a.today||todayISO())) ? i18t('st_aw_state_on',{to:stDay(m.to)}) : i18t('st_aw_state_set',{from:stDay(m.from),to:stDay(m.to)});
}
/* who may answer for you: a colleague who is not a Viewer, never yourself */
function stAwayPeople(){
  const me=(typeof currentUser==='function'&&currentUser())||{};
  return stUsers().filter(x=>x&&x.id&&String(x.id)!==String(me.id)&&x.role!=='viewer')
    .sort((x,y)=>String(x.name||x.email||'').localeCompare(String(y.name||y.email||'')));
}
const stAwayAddDays=(iso,n)=>{ const d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()+n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
function stAwayDrawer(){
  const m=(state.away||{}).mine, t=todayISO();
  _stAw={ from:m?m.from:t, to:m?m.to:stAwayAddDays(t,6), deputyId:m?String(m.deputyId):'', cannot:null };
  const lbl=x=>`<span class="st-ps-l">${esc(x)}</span>`;
  const ppl=stAwayPeople();
  return { title:i18t('st_you_away'), sub:i18t('st_aw_drawer_sub'), foot:'save',
    body:`<div class="st-tr-grid">
      <label class="st-tr-f">${lbl(i18t('st_aw_from'))}<input type="date" id="st-aw-from" value="${esc(_stAw.from)}" min="${esc(t)}" style="${ST_INPUT}"/></label>
      <label class="st-tr-f">${lbl(i18t('st_aw_until'))}<input type="date" id="st-aw-to" value="${esc(_stAw.to)}" min="${esc(t)}" style="${ST_INPUT}"/></label>
    </div>
    <label class="st-tr-f">${lbl(i18t('st_aw_who'))}<select id="st-aw-who" style="${ST_INPUT}">
      <option value=""${_stAw.deputyId?'':' selected'}>${esc(i18t('st_aw_pick'))}</option>
      ${ppl.map(x=>`<option value="${esc(x.id)}"${String(x.id)===_stAw.deputyId?' selected':''}>${esc(x.name||x.email)}</option>`).join('')}</select></label>
    <div class="st-aw-what">${lbl(i18t('st_aw_what'))}
      <p class="st-aw-yes">${esc(i18t('st_aw_what_yes'))}</p>
      <p class="st-note">${esc(i18t('st_aw_never_sign'))}</p></div>
    <p class="st-note st-aw-reach" id="st-aw-reach" aria-live="polite"></p>`,
    wire:()=>{
      const on=(id,fn)=>{ const el=document.getElementById(id); if(el) el.addEventListener('change',fn); };
      on('st-aw-from',e=>{ _stAw.from=e.target.value; });
      on('st-aw-to',e=>{ _stAw.to=e.target.value; });
      on('st-aw-who',e=>{ _stAw.deputyId=e.target.value||''; stAwayReach(); });
      if(typeof datePickDress==='function') try{ datePickDress(document.getElementById('st-drawer')); }catch(_){}
      stAwayReach();
    },
    ready:()=>{ const d=_stAw||{}; return !d.deputyId?i18t('st_aw_need_who'):(!d.from||!d.to)?i18t('st_aw_need_days'):d.to<d.from?i18t('st_aw_backwards'):''; },
    save:()=>stAwaySave() };
}
/* A STAND-IN NEVER WIDENS ANYONE'S REACH, said before Save: the streams you
   may open that they may not stay with you (the server reads both scopes) */
async function stAwayReach(){
  const host=document.getElementById('st-aw-reach'); if(!host||!_stAw) return;
  const id=_stAw.deputyId;
  if(!id){ host.textContent=''; return; }
  const who=((stUsers().find(x=>String(x.id)===String(id))||{}).name)||'';
  const all=(typeof stTrailStreams==='function')?stTrailStreams():[];
  host.innerHTML=(typeof busyHtml==='function')?busyHtml(i18t('st_aw_reach_busy')):esc(i18t('st_aw_reach_busy'));
  let r=null;
  try{ r=await api('me/away/reach?'+new URLSearchParams({ deputyId:id, streams:all.map(f=>f.id).join(',') }).toString()); }catch(_){ r=null; }
  if(!_stAw||_stAw.deputyId!==id||!document.getElementById('st-aw-reach')) return;
  if(!r||!Array.isArray(r.cannot)){ host.textContent=i18t('st_aw_reach_unknown',{who}); return; }
  const names=r.cannot.map(f=>(all.find(x=>x.id===f)||{}).name||f);
  host.textContent=names.length ? i18t('st_aw_reach_not',{who,streams:names.join(', ')}) : i18t('st_aw_reach_all',{who});
}
async function stAwaySave(){
  stDrawerClearRefusal();
  const d=_stAw||{};
  if(!d.deputyId) return stDrawerRefuse(i18t('st_aw_need_who'));
  if(!d.from||!d.to) return stDrawerRefuse(i18t('st_aw_need_days'));
  if(d.to<d.from) return stDrawerRefuse(i18t('st_aw_backwards'));
  let r=null;
  try{ r=await api('me/away','PUT',{ deputyId:d.deputyId, from:d.from, to:d.to }); }
  catch(e){ return stDrawerRefuse((e&&e.message)||i18t('st_aw_failed')); }
  state.away=r||state.away;
  const m=(state.away||{}).mine;
  toast(i18t('st_aw_saved',{who:(m&&m.deputyName)||'',from:stDay(d.from),to:stAwayDay(d.to)}),'ok');
  stDrawerClose(); stYouCardRepaint('away');
}
/* END IT NOW: your approvals and reviews are yours again at once */
async function stAwayEnd(){
  let r=null;
  try{ r=await api('me/away','DELETE'); }
  catch(e){ toast((e&&e.message)||i18t('st_aw_failed'),'err'); return; }
  state.away=r||state.away;
  toast(i18t('st_aw_ended'),'ok');
  stYouCardRepaint('away');
}
/* ---- A FRESH SET OF RECOVERY CODES (piece 11) ----
   Costs a current code (or an unused recovery code), exactly as turning
   two-step off does: an open session alone must not mint a second key. The
   ten new codes are shown once; the server keeps their hashes. */
async function stCodesNew(){
  const code=await promptDialog({ title:i18t('st_you_codes_new'), message:i18t('st_you_codes_new_msg'),
    placeholder:'123456', confirmLabel:i18t('st_you_codes_new_go'), cancelLabel:i18t('act_cancel') });
  if(code==null) return;
  let r=null;
  try{ r=await api('me/totp/recovery','POST',{ code:String(code).trim() }); }
  catch(e){ toast((e&&e.message)||i18t('ts_failed'),'err'); return; }
  _stYouFacts.codes=(r&&Array.isArray(r.recovery))?r.recovery.length:null;
  openModal(`<div style="padding:24px">
    <h3 style="margin:0 0 6px;font-size:var(--t-card);font-weight:var(--w-title);font-family:var(--font-heading)">${esc(i18t('ts_recovery_title'))}</h3>
    <p class="st-note" style="margin:0 0 10px">${esc(i18t('ts_recovery_msg'))}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-family:var(--font-mono);font-size:var(--t-body);letter-spacing:.08em;user-select:all">
      ${((r&&r.recovery)||[]).map(cd=>`<span style="background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius);padding:6px 10px;text-align:center">${esc(cd)}</span>`).join('')}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:14px"><button id="ts-done" class="ui-btn ui-btn-primary">${i18t('ts_done')}</button></div>
  </div>`,{ maxWidth: DLG_W.m });
  document.getElementById('ts-done')?.addEventListener('click',()=>{ closeModal(); toast(i18t('st_you_codes_done'),'ok'); });
  const left=document.getElementById('ts-codes-left'); if(left) left.textContent=stCodesLeftText();
}
/* ONE WRITER FOR A PERSON'S OWN FLAG: the server where there is one, the
   member record in this browser where there is not; the screen never claims
   a save that failed. */
async function stPrefSet(key, value){
  const u=(typeof currentUser==='function'&&currentUser()); if(!u) return false;
  const was=(u.prefs||{})[key];
  if(typeof API_MODE==='function'&&API_MODE()){
    try{ const r=await api('me/prefs','PUT',{ [key]:value }); u.prefs=(r&&r.prefs)||{ ...(u.prefs||{}), [key]:value }; }
    catch(e){ toast(i18t('st_pref_failed')+' '+((e&&e.message)||''),'err'); u.prefs={ ...(u.prefs||{}), [key]:was }; return false; }
  } else { u.prefs={ ...(u.prefs||{}), [key]:value }; if(typeof saveUsers==='function') saveUsers(getUsers()); }
  return true;
}

/* ============================================================
   ONE SEARCH, IN PLAIN WORDS (owner, 16 Oct 2026, decision 3: "one search,
   three places to type" — the Menu's box, the ⌘K palette, and the bar's box
   on Settings, which IS the ⌘K box opened here)
   ============================================================
   stFind is the ONE finder. The words that carry no meaning are dropped
   (Jambo's stop list), each word left finds a setting by its name, by the
   plain words people use for it (st_syn_<key>, both books — "salary" finds
   signing limits and the streams, "logo" the design), by its group or by
   what it says about itself; a name finds that colleague; two pages are
   findable by name. Nothing is spent and nothing is written. A non-admin
   finds their own settings only. */
const stSynOf=k=>{ const w=i18t('st_syn_'+k); return w==='st_syn_'+k?'':String(w).toLowerCase(); };
function stFind(q){
  const toks=[...new Set(stJbTokens(q))];
  if(!toks.length) return [];
  const out=[];
  /* score one candidate: 3 a word of its name, 2 a plain word for it, 1
     anything else it says; and how many of the asked words it answered */
  const score=(name,syn,rest)=>{
    let s=0, m=0, via='';
    for(const t of toks){
      if(stJbHit(t,name)){ s+=3; m++; }
      /* a plain word that is the setting's FIRST word is what it most means
         ("salary" is a signing limit before it is a stream) */
      else if(syn&&stJbHit(t,syn)){ s+=(stJbHit(t,syn.split(' ')[0])?2.5:2); m++; via=via||t; }
      else if(rest&&stJbHit(t,rest)){ s+=1; m++; }
    }
    return { s, m, via };
  };
  const enough=m=>toks.length<=2?m===toks.length:m>=toks.length-1;
  const push=(hit,sc)=>{ if(sc.s && enough(sc.m)) out.push({ ...hit, s:sc.s, why:sc.via?i18t('st_find_why',{w:sc.via}):'' }); };
  stYouItems().forEach(it=>{
    const name=i18t(it.t).toLowerCase();
    push({ you:it.key }, score(name, stYouHay(it), ''));
  });
  if(stIsAdmin()){
    stPanelKeys(null).forEach(k=>{ const p=SET_PANELS[k]; const st=stStateOf(k);
      const name=p.title().toLowerCase();
      const rest=[p.sub?p.sub():'', i18t('st_grp_'+stGroupKeyOf(k)), p.find?[].concat(p.find()).join(' '):'', st&&st.text?String(st.text).replace(/<[^>]*>/g,' '):''].join(' ').toLowerCase();
      push({ panel:k }, score(name, stSynOf(k), rest)); });
    [['team','st_pg_team','st_syn_team'],['sheet','st_pg_sheet','st_syn_sheet'],...(stBzOn()?[['roles','st_pg_roles','st_syn_roles']]:[])].forEach(([k,t,w])=>
      push({ page:k }, score(i18t(t).toLowerCase(), String(i18t(w)).toLowerCase(), '')));
    stUsers().forEach(u=>{
      const name=[u.name,String(u.email||'').split('@')[0].replace(/[._-]+/g,' ')].filter(Boolean).join(' ').toLowerCase();
      push({ person:u.id }, score(name, '', [u.title,roleName(u.role)].filter(Boolean).join(' ').toLowerCase())); });
  }
  return out.sort((a,b)=>b.s-a.s);
}
/* THE SAME ANSWERS AS ROWS, for the ⌘K palette: one id each, a title, where
   it lives, and why it was found when it was by a plain word */
function stFindRows(q){
  return stFind(q).map(h=>{
    if(h.panel){ const p=SET_PANELS[h.panel]; return { id:'panel:'+h.panel, title:p.title(), sub:i18t('st_grp_'+stGroupKeyOf(h.panel)), why:h.why }; }
    if(h.you){ const it=stYouItem(h.you); return it?{ id:'you:'+h.you, title:i18t(it.t), sub:i18t('st_face_you'), why:h.why }:null; }
    if(h.page) return { id:'page:'+h.page, title:i18t('st_pg_'+h.page), sub:i18t('st_cr_people'), why:h.why };
    if(h.person){ const u=(typeof userById==='function')?userById(h.person):null; return u?{ id:'person:'+u.id, title:stNameOf(u), sub:roleName(u.role), why:'' }:null; }
    return null;
  }).filter(Boolean);
}
/* A ROW PRESSED, from anywhere: Settings, on the face it lives on, with its
   drawer open (the one named door, openSettingsAt) */
function stFindGo(id){
  const [kind,...rest]=String(id||'').split(':'); const k=rest.join(':');
  if(kind==='you'){ if(typeof setView==='function' && (typeof state==='undefined'||state.view!=='team')) setView('team'); stYouGo(k); return; }
  /* a page lands ON that page: openSettingsAt lands on the company board, so the page is gone to after it
     (it was set before, and openSettingsAt put it back to the board — "add a user" stopped one step short) */
  if(kind==='page'){ openSettingsAt('company'); if(ST_PAGES.includes(k)&&k!=='panel'&&!(typeof isAdmin==='function'&&!isAdmin())) settingsGoPage(k); return; }
  if(kind==='panel') { openSettingsAt('company', k); return; }
  if(kind==='person') { openSettingsAt('company', 'person:'+k); return; }
}

/* ---- THE MENU'S ROWS ---- */
function stMenuItemHtml(h, withGroup){
  if(h.panel){
    const p=SET_PANELS[h.panel]; if(!p) return '';
    const st=stStateOf(h.panel)||{dot:'off'};
    const gk=withGroup?stGroupKeyOf(h.panel):'';
    /* A SHORT STATE ON EVERY ROW (piece 10): the first clause of what the
       panel says about itself, the whole of it in the title */
    const short=stShortState(st.text);
    return `<button type="button" class="st-mrow" data-st-panel="${h.panel}"><span class="st-dot" style="background:${ST_DOT[st.dot]||ST_DOT.off}"></span>
      <span class="st-mrow-n">${esc(p.title())}${gk?`<span class="st-mrow-g">${esc(i18t('st_grp_'+gk))}</span>`:''}</span>${short?`<span class="st-mrow-s${st.dot==='warn'?' is-warn':''}">${esc(short)}</span>`:''}<span class="st-mrow-go" aria-hidden="true">›</span></button>`;
  }
  if(h.you){
    const it=stYouItem(h.you); if(!it) return '';
    const short=it.state?String(it.state()||''):'';
    return `<button type="button" class="st-mrow" data-st-you="${h.you}"><span class="st-dot st-dot-you" aria-hidden="true"></span>
      <span class="st-mrow-n">${esc(i18t(it.t))}${withGroup?`<span class="st-mrow-g">${esc(i18t('st_face_you'))}</span>`:''}</span>${short?`<span class="st-mrow-s">${esc(short)}</span>`:''}<span class="st-mrow-go" aria-hidden="true">›</span></button>`;
  }
  if(h.jump){
    const pg=h.jump==='people'?'team':h.jump;
    return `<button type="button" class="st-mrow" data-st-page="${pg}"><span class="st-dot st-dot-you" aria-hidden="true"></span>
      <span class="st-mrow-n">${esc(i18t(pg==='sheet'?'st_pg_sheet':'st_pg_team'))}${withGroup?`<span class="st-mrow-g">${esc(i18t('st_cr_people'))}</span>`:''}</span><span class="st-mrow-go" aria-hidden="true">›</span></button>`;
  }
  if(h.person){
    const u=(typeof userById==='function')?userById(h.person):null; if(!u) return '';
    return `<button type="button" class="st-mrow" data-st-panel="person:${PB_ATTR(u.id)}"><span class="st-dot st-dot-you" aria-hidden="true"></span>
      <span class="st-mrow-n">${esc(u.name||u.email)}<span class="st-mrow-g">${esc(roleName(u.role))}</span></span><span class="st-mrow-go" aria-hidden="true">›</span></button>`;
  }
  return '';
}
/* THE MENU'S BOX ASKS THE ONE FINDER (stFind), best first */
function stMenuHits(q){
  return stFind(q).map(h=>h.panel?{panel:h.panel}:h.you?{you:h.you}:h.person?{person:h.person}:h.page?{jump:h.page}:null).filter(Boolean);
}
function stMenuHtml(){ return stRowsHtml(); }

/* ============================================================
   JAMBO ON SETTINGS — HE FINDS, EXPLAINS AND READIES; YOU DECIDE
   ============================================================
   No model and no route: every answer is built from the readings the page
   already draws (a panel's own state, stPersonSays, signCapText, the streams'
   access, the ladder), so it costs nothing and cannot say what the screen
   does not. He never saves. The furthest he goes is to READY a change — open
   the drawer with the box filled in — and the person's Save is the act.
   He reaches only what the reader may reach: a non-admin's Jambo knows their
   own settings and nothing about colleagues or the company's rules.
   The conversation is this sitting's, in memory, and holds the QUESTIONS:
   each answer is read again whenever it is drawn, so it is never stale. */
let _stJbSeq=0;
const ST_JB_MAX=12;
/* ONE JAMBO CONVERSATION EVERYWHERE (owner, 21 Oct 2026): Settings' turns are
   kept in the one conversation (ai.history) as {role:'st', st}; the last
   ST_JB_MAX of them are kept, older ones leave it (a cap is a fact: it was
   the panel's own rule before) */
let _stJbLocal=[];
function stJbConvo(){ return (typeof jamboConvo==='function'&&window.ai&&Array.isArray(window.ai.history))?jamboConvo():_stJbLocal; }
function stJbLog(){ return stJbConvo().filter(m=>m&&m.role==='st'&&m.st).map(m=>m.st); }
function stJbPush(t){
  const H=stJbConvo(); H.push({ role:'st', host:'st', st:t });
  const mine=H.filter(m=>m&&m.role==='st');
  if(mine.length>ST_JB_MAX) mine.slice(0,mine.length-ST_JB_MAX).forEach(m=>{ const i=H.indexOf(m); if(i>=0) H.splice(i,1); });
}
function stJbForget(id){ const H=stJbConvo(); const i=H.findIndex(m=>m&&m.role==='st'&&m.st&&String(m.st.id)===String(id)); if(i>=0) H.splice(i,1); }
/* Words that carry no meaning for finding, in both books' languages. */
const ST_JB_STOP=new Set(('a an the and or of to for in on at by is are am be do does did can could may might must should would will i me my mine we our you your it its this that these those there here what which when where why how who whom whose about with from into please set make change show tell give get turn let see find open want need '+
  'och eller att för i på av till med om är vara jag mig min mitt mina vi vår vårt du din ditt dina den det de en ett som vad vilken vilka när var varför hur vem kan ska vill måste får göra gör ändra visa ge sätt slå öppna hitta').split(/\s+/));
const ST_JB_WHO=['who','whom','vem','vilka','people','person','personer'];
const ST_JB_SIGN=['sign','signs','signing','signer','signers','signera','signerar','undertecknar','underteckna','skriva','skriver'];
const ST_JB_CAP=['limit','limits','cap','caps','amount','much','gräns','gränsen','belopp','tak','mycket'];
const ST_JB_NEXT=['next','ladder','governance','rung','nästa','härnäst','stegen','stege','styrning','styrningsstegen'];
const ST_JB_CADENCE={ weekly:['weekly','week','vecka','veckan','veckovis'], daily:['daily','day','morning','dag','dagligen','morgon','varje'], off:['off','never','stop','none','aldrig','stäng','inga'] };
/* every word of the ask (the INTENT words — who, sign, next — are read here,
   since several are also filler), and the ones left to FIND things by */
const stJbWords=q=>String(q||'').toLowerCase().replace(/['’]s\b/g,'').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const stJbTokens=q=>stJbWords(q).filter(t=>!ST_JB_STOP.has(t));
/* a token finds a word when it IS the word or begins it (4 letters or more) */
/* …or shares its stem with it (jmStem, Jambo's map's own trim; 19 Oct 2026:
   "briefing" finds "brief") */
const stJbHit=(tok,hay)=>{ const ws=hay.split(/[^\p{L}\p{N}]+/u);
  const stem=(typeof window!=='undefined'&&typeof window.jmStem==='function')?window.jmStem:null, ts=stem&&tok.length>=5?stem(tok):null;
  return ws.some(w=>w===tok || (tok.length>=4 && w.startsWith(tok)) || (!!ts && w.length>=4 && (stem(w)===ts || w===ts))); };
/* AN AMOUNT, AS PEOPLE SAY THEM: 5M, 5 million, 5,000,000, 500k, KES 5.5M */
function stJbAmount(q){
  const m=String(q||'').match(/(\d[\d.,\s]*\d|\d)\s*(m|mn|million|millions|miljon|miljoner|k|thousand|tusen|b|bn|billion|miljard|miljarder)?\b/i);
  if(!m) return null;
  const unit=(m[2]||'').toLowerCase();
  let raw=m[1].replace(/\s/g,'');
  const mult=/^(m|mn|million|millions|miljon|miljoner)$/.test(unit)?1e6:/^(k|thousand|tusen)$/.test(unit)?1e3:/^(b|bn|billion|miljard|miljarder)$/.test(unit)?1e9:1;
  /* one separator followed by one or two digits is a decimal point (5.5M, 5,5 M) */
  if(mult>1 && /^\d+[.,]\d{1,2}$/.test(raw)) raw=raw.replace(',','.');
  else raw=raw.replace(/[.,]/g,'');
  const n=Number(raw)*mult;
  return (Number.isFinite(n) && n>0) ? Math.round(n) : null;
}
function stJbPeopleHit(toks){
  if(!stIsAdmin()) return [];
  let users=[]; try{ users=getUsers()||[]; }catch(_){ users=[]; }
  return users.filter(u=>{
    const parts=String(u.name||'').toLowerCase().split(/\s+/).filter(p=>p.length>=3)
      .concat(String(u.email||'').toLowerCase().split('@')[0].split(/[._-]+/).filter(p=>p.length>=3));
    return toks.some(t=>t.length>=3 && parts.some(p=>p===t || (t.length>=4 && p.startsWith(t))));
  });
}
function stJbStreamsHit(toks){
  if(!stIsAdmin() || typeof FOLDERS!=='object' || !FOLDERS) return [];
  return Object.values(FOLDERS).filter(f=>{
    const ws=String(f.name||'').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>=4).concat([String(f.id||'').toLowerCase()]);
    return toks.some(t=>t.length>=3 && ws.some(w=>w===t || (t.length>=4 && w.startsWith(t))));
  });
}
/* A "WHY" QUESTION — why can't, how come, what stops — is answered by
   reading the rules with AI (stJbWhyRun), its cost said before the press.
   Read off the raw words: "can't" is two tokens once split. */
const stJbIsWhy=q=>/(^|[^\p{L}])(why|how come|varför|hur kommer det sig)([^\p{L}]|$)|can['’]?t\b|cannot\b|won['’]?t\b|unable to|isn['’]?t allowed|kan inte|får inte/iu.test(String(q||''));
const ST_JB_MISSING=['missing','unset','none','without','everyone','all','saknas','saknade','utan','alla'];
/* GETTING ONE OF YOUR OWN SETTINGS READY (piece 18): what the words ask for,
   the control that holds it, and what it says now. Nothing is changed — the
   drawer opens with that control lit; the press is the reader's. */
function stJbYouStage(q, words){
  const has=list=>words.some(t=>list.includes(t));
  const u=(typeof currentUser==='function'&&currentUser())||{};
  const api=(typeof API_MODE==='function')&&API_MODE();
  const brief=Object.keys(ST_JB_CADENCE).find(v=>has(ST_JB_CADENCE[v]));
  if(api && brief && has(['brief','briefs','digest','email','emails','mejl','sammanfattning','sammanfattningen'])){
    const now=briefCadenceOf(u);
    return { key:'told', focus:'[data-st-brief]', want:i18t('st_you_brief_'+brief), now:i18t('st_you_brief_'+now), same:now===brief };
  }
  const L=(typeof langList==='function')?langList():[];
  const lang=L.find(l=>words.includes(String(l.name||'').toLowerCase())||words.includes(String(l.id||'').toLowerCase()));
  if(lang && has(['language','switch','språk','byt','change','to','till','in','på'])){
    const nowL=L.find(l=>l.id===((typeof langId==='function')?langId():''));
    return { key:'lang', focus:`[data-st-lang="${lang.id}"]`, want:lang.name, now:nowL?nowL.name:'', same:!!nowL&&nowL.id===lang.id };
  }
  const opens=(typeof OPENS_ON!=='undefined'?OPENS_ON:[]).find(v=>{ const w=String(i18t('st_opens_'+v)).toLowerCase().split(/[^\p{L}]+/u).filter(x=>x.length>=4); return w.some(x=>words.includes(x)); });
  if(opens && has(['open','opens','opened','land','start','öppna','öppnas','öppnar'])){
    const now=(typeof contractOpensOn==='function')?contractOpensOn():'jambo';
    return { key:'work', focus:'[data-st-opens]', want:i18t('st_opens_'+opens), now:i18t('st_opens_'+now), same:now===opens };
  }
  if(has(['suggestions','chips','förslag']) && has(['off','on','hide','show','stop','av','på','dölj','visa'])){
    const on=(typeof jamboChipsOn!=='function')||jamboChipsOn();
    const want=!has(['off','hide','stop','av','dölj']);
    return { key:'work', focus:'[data-st-sw="chips"]', want:i18t(want?'st_you_chips_on':'st_you_chips_off'), now:i18t(on?'st_you_chips_on':'st_you_chips_off'), same:on===want };
  }
  return null;
}
/* THE ANSWER, AS A LIST OF CARDS — each a reading and a door. */
function stJbAnswer(q){
  const admin=stIsAdmin();
  const toks=stJbTokens(q), words=stJbWords(q);
  const has=list=>words.some(t=>list.includes(t));
  const cards=[];
  /* a "why" goes to the rules, read with AI; the readings below still follow */
  const why=stJbIsWhy(q);
  if(why) cards.push({ k:'why' });
  /* a named colleague, and — with an amount and a limit word — their limit readied */
  const people=stJbPeopleHit(toks).slice(0,2);
  const amount=stJbAmount(q);
  if(people.length===1 && amount!=null && (has(ST_JB_CAP)||has(ST_JB_SIGN))) cards.push({ k:'stage', id:people[0].id, amount });
  people.forEach(u=>cards.push({ k:'person', id:u.id }));
  /* everyone's limits, where some are missing */
  if(admin && !people.length && has(ST_JB_CAP) && has(ST_JB_MISSING)) cards.push({ k:'limits' });
  /* who may see a stream */
  stJbStreamsHit(toks).slice(0,2).forEach(f=>cards.push({ k:'stream', fid:f.id }));
  /* who may sign, and for how much */
  if(admin && !people.length && !why && has(ST_JB_WHO) && has(ST_JB_SIGN)) cards.push({ k:'whosign' });
  /* the next rung */
  if(admin && has(ST_JB_NEXT)){ const nx=stGovNext(); cards.push(nx?{ k:'panel', key:nx, next:true }:{ k:'alldone' }); }
  /* one of your own settings, got ready */
  const st=stJbYouStage(q, words);
  if(st) cards.push({ k:'you', key:st.key, focus:st.focus, stage:st });
  /* A QUESTION ANSWERED IS ANSWERED: a reading above is the answer, and loose
     matches under it are noise */
  if(cards.length>(why?1:0)) return { say:i18t(why?'st_jb_why_say':'st_jb_found'), cards };
  /* the one finder (stFind), best first */
  stFind(q).slice(0, why?2:4).forEach(h=>cards.push(
    h.panel?{ k:'panel', key:h.panel, why:h.why }:h.you?{ k:'you', key:h.you }:h.page?{ k:'page', key:h.page }:{ k:'person', id:h.person }));
  if(cards.length) return { say:i18t(why?'st_jb_why_say':'st_jb_found'), cards };
  /* NOTHING OF THEIRS MATCHED. A non-admin whose words name a company rule is
     told it is an admin's — read off the panels' NAMES and plain words only,
     never their state — and offered to ask one (the tracked ask, piece 19). */
  if(!admin && toks.length){
    const rule=stPanelKeys(null).find(k=>{ const p=SET_PANELS[k];
      const hay=(p.title()+' '+(p.sub?p.sub():'')+' '+stSynOf(k)).toLowerCase(); return toks.some(t=>stJbHit(t,hay)); });
    /* the card says it all ("That is a company rule…"), as drawn — no
       second sentence above it saying the same */
    if(rule) return { say:'', cards:[{ k:'askadmin', panel:rule }] };
  }
  /* and anything else may still be asked of the AI, its cost said first */
  return { say:i18t('st_jb_none',{q:String(q||'').slice(0,80)}), cards:[{ k:'why', loose:true }], none:true };
}
function stJbSayHtml(words){
  const face=(typeof jamboFaceHtml==='function')?jamboFaceHtml('hello',28,'st-jb-av'):'';
  return `<div class="st-jb-msg">${face}<div class="st-jb-bub">${esc(words)}</div></div>`;
}
function stJbCardHtml(c, t){
  const turnId=t&&t.id;
  const btn=(attrs,label,primary)=>`<button type="button" class="ui-btn ui-btn-sm${primary?' ui-btn-primary':''}" ${attrs}>${esc(label)}</button>`;
  const card=(head,body,acts,fine)=>`<div class="st-jb-card"><div class="st-jb-ch">${head}</div>${body?`<div class="st-jb-cb">${body}</div>`:''}${acts?`<div class="st-jb-ca">${acts}</div>`:''}${fine?`<p class="st-jb-fine">${fine}</p>`:''}</div>`;
  const free=esc(i18t('st_jb_free_line'));
  if(c.k==='panel'){
    const p=SET_PANELS[c.key]; if(!p) return '';
    const st=stStateOf(c.key)||{dot:'off',text:''};
    return card(`<span class="st-dot" style="background:${ST_DOT[st.dot]||ST_DOT.off}"></span>${c.next?`<span class="st-jb-pre">${esc(i18t('st_jb_next_pre'))}</span> `:''}${esc(p.title())} <span class="st-jb-role">· ${esc(i18t('st_grp_'+stGroupKeyOf(c.key)))}</span>`,
      `${c.why?`<p>${esc(i18t('st_jb_found_by',{why:c.why,name:p.title()}))}</p>`:''}${p.sub?`<p>${esc(p.sub())}</p>`:''}${st.text?`<p class="st-jb-state">${st.text}</p>`:''}`,
      btn(`data-st-panel="${c.key}"`, i18t('st_jb_open'), true), free);
  }
  if(c.k==='you'){
    const it=stYouItem(c.key); if(!it) return '';
    const sg=c.stage;
    if(sg) return card(esc(i18t(it.t)),
      `<p>${esc(sg.same?i18t('st_jb_ready_same',{want:sg.want}):i18t('st_jb_ready',{want:sg.want,now:sg.now}))}</p>`,
      btn(`data-st-you="${c.key}"${c.focus?` data-st-you-focus="${esc(c.focus)}"`:''}`, i18t(sg.same?'st_jb_show':'st_jb_ready_go'), true)+(sg.same?'':btn(`data-st-jb-drop="${turnId}"`, i18t('st_jb_discard'), false)), free);
    return card(esc(i18t(it.t)), it.state?`<p class="st-jb-state">${esc(String(it.state()||''))}</p>`:'', btn(`data-st-you="${c.key}"${c.focus?` data-st-you-focus="${esc(c.focus)}"`:''}`, i18t(it.door?'st_jb_open':'st_jb_show'), true), free);
  }
  if(c.k==='page'){
    return card(esc(i18t(c.key==='sheet'?'st_pg_sheet':'st_pg_team')), '', btn(`data-st-page="${c.key}"`, i18t('st_jb_open'), true), free);
  }
  if(c.k==='limits'){
    const unset=stCapUnset();
    return card(esc(i18t('st_card_limits')),
      `<p>${esc(unset.length?i18tn('st_need_limits',unset.length,{n:unset.length,names:stNamesSaid(unset)}):i18t(stCapOn()?'st_jb_limits_all':'st_pc_caps_off'))}</p>`,
      btn('data-st-panel="limits"', i18t('st_jb_open'), true), free);
  }
  if(c.k==='why') return stJbWhyCardHtml(c, t);
  if(c.k==='askadmin') return (typeof stAskCardHtml==='function')?stAskCardHtml(c, t):'';
  if(c.k==='person'){
    const u=(typeof userById==='function')?userById(c.id):null; if(!u) return '';
    const says=stPersonSays(u);
    return card(`<span class="st-jb-ini">${esc((u.name||u.email||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase())}</span>${esc(u.name||u.email)} <span class="st-jb-role">${esc(roleName(u.role))}</span>`,
      says.length?`<ul>${says.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:'',
      btn(`data-st-panel="person:${PB_ATTR(u.id)}"`, i18t('st_jb_open_person',{name:String(u.name||u.email||'').split(' ')[0]}), true));
  }
  if(c.k==='stage'){
    const u=(typeof userById==='function')?userById(c.id):null; if(!u) return '';
    const first=String(u.name||u.email||'').split(' ')[0];
    const amt=(typeof fmtMoney==='function')?fmtMoney(c.amount):String(c.amount);
    if(u.role==='admin'||u.role==='viewer')
      return card(esc(i18t('st_jb_stage_h',{name:u.name||u.email})), `<p>${esc(i18t(u.role==='admin'?'st_jb_stage_admin':'st_jb_stage_viewer'))}</p>`, '');
    const now=(typeof signCapText==='function')?signCapText(u):'';
    return card(esc(i18t('st_jb_stage_h',{name:u.name||u.email})),
      `<p>${esc(i18t('st_jb_stage_b',{amount:amt}))}</p>${now?`<p class="st-jb-state">${esc(i18t('st_jb_stage_now',{now}))}</p>`:''}`,
      btn(`data-st-stage="${PB_ATTR(u.id)}|${c.amount}"`, i18t('st_jb_stage_go',{name:first}), true)+btn(`data-st-jb-drop="${turnId}"`, i18t('st_jb_discard'), false));
  }
  if(c.k==='stream'){
    const f=(typeof FOLDERS==='object'&&FOLDERS)?FOLDERS[c.fid]:null; if(!f) return '';
    let users=[]; try{ users=getUsers()||[]; }catch(_){ users=[]; }
    const can=users.filter(u=>(typeof canAccessFolder==='function')?canAccessFolder(c.fid,u):(stAccessOf(u).all));
    return card(esc(i18t('st_jb_stream_h',{name:f.name})),
      `<p>${esc(i18tn('st_jb_stream_n',can.length,{n:can.length}))}</p><div class="st-jb-names">${can.map(u=>`<button type="button" class="st-jb-name" data-st-panel="person:${PB_ATTR(u.id)}">${esc(u.name||u.email)}</button>`).join('')}</div>`, '');
  }
  if(c.k==='whosign'){
    let users=[]; try{ users=getUsers()||[]; }catch(_){ users=[]; }
    const signers=users.filter(u=>u.role!=='viewer');
    return card(esc(i18t('st_jb_whosign_h')),
      `<ul class="st-jb-list">${signers.map(u=>`<li><button type="button" class="st-jb-name" data-st-panel="person:${PB_ATTR(u.id)}">${esc(u.name||u.email)}</button><span>${esc((typeof signCapText==='function')?signCapText(u):'')}</span></li>`).join('')}</ul>`,
      btn('data-st-panel="signcap"', i18t('st_jb_open_rule'), false));
  }
  if(c.k==='alldone') return card(esc(i18t('st_gov_all_on')), '', '');
  return '';
}
function stJbTurnHtml(t){
  const a=t.force||stJbAnswer(t.q);
  /* an ask begun from a door has no words of the reader's yet: no bubble */
  return `<div class="st-jb-turn" data-st-jb-turn="${t.id}">
    ${t.q&&!(a.cards||[]).some(c=>c&&c.free)?`<div class="st-jb-me">${esc(t.q)}</div>`:''}
    ${a.say?stJbSayHtml(a.say):''}
    ${a.cards.map(c=>stJbCardHtml(c,t)).join('')}
    ${a.none?`<div class="st-jb-ca"><button type="button" class="ui-btn ui-btn-sm" data-st-side="menu">${esc(i18t('st_jb_to_menu'))}</button></div>`:''}
  </div>`;
}
/* ============================================================
   ASK AN ADMIN, ON THE PAGE (piece 19; the server record is
   /api/settings-asks — see server/server.js "ASK AN ADMIN")
   ============================================================
   The asks are read once a sitting and again whenever one is made or
   answered; the bell, Needs you and Jambo all read this one list. */
let _stAsks=null, _stAsksAsking=false;
async function stAsksLoad(){
  if(_stAsksAsking || !(typeof API_MODE==='function'&&API_MODE())) return;
  _stAsksAsking=true;
  try{ const r=await api('settings-asks'); _stAsks=(r&&Array.isArray(r.asks))?r.asks:[];
    if(typeof renderContextPanel==='function' && typeof state!=='undefined' && state.panelOpen) try{ renderContextPanel(); }catch(_){}
    if(typeof updateAlertBadge==='function') try{ updateAlertBadge(); }catch(_){}
    if(document.getElementById('set-page')) stSyncAttention();
  }catch(_){ /* the list stays as it was; nothing is claimed */ }
  finally{ _stAsksAsking=false; }
}
/* an admin's open asks (Needs you, the bell) */
const stAsksOpen=()=>stIsAdmin()?(_stAsks||[]).filter(a=>a.status==='open').map(a=>({ ...a, byName:(a.by&&a.by.name)||'' })):[];
/* the asker's own: answered and not yet seen (their bell), and still open */
const stAsksMine=()=>{ const me=(typeof currentUser==='function'&&currentUser())||{}; return (_stAsks||[]).filter(a=>a.by&&a.by.id===me.id); };
const stAsksAnswered=()=>stAsksMine().filter(a=>a.status!=='open'&&!a.seenAt);
const stAdminsSaid=()=>stNamesSaid(stUsers().filter(u=>u.role==='admin'));
/* FROM WHERE A RULE STOPPED SOMEBODY (piece 20): Settings opens with Jambo's
   ask card ready — the same card, the same tracked ask — its words naming
   what stopped them. Nothing is sent until they press Ask an admin. */
function stAskFrom(panel, words){
  const t={ id:++_stJbSeq, q:String(words||'').slice(0,200), force:{ say:'', cards:[{ k:'askadmin', panel }] } };
  stJbPush(t);
  _stSide='jambo';
  const feed=document.getElementById('st-jb-feed');
  if(feed && typeof state!=='undefined' && state.view==='team'){ stSideSet('jambo'); stJbTurnAdd(t); }
  else if(typeof setView==='function'){ setView('team'); stJbTurnAdd(t); }
  const go=()=>{ const f=document.getElementById('st-jb-feed'); stJbLand(f);
    const box=document.getElementById('st-ask-why-'+t.id); if(box) try{ box.focus({preventScroll:true}); }catch(_){} };
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(go); else go();
}
/* JAMBO'S CARD FOR A NON-ADMIN: the rule is a company one; an admin decides;
   Jambo asks for them, with their reason — and says where it will wait */
function stAskCardHtml(c, t){
  const p=SET_PANELS[c.panel];
  const sent=t&&t.ask;
  const card=(head,body,acts)=>`<div class="st-jb-card"><div class="st-jb-ch">${head}</div>${body?`<div class="st-jb-cb">${body}</div>`:''}${acts?`<div class="st-jb-ca">${acts}</div>`:''}</div>`;
  if(sent&&sent.state==='sent'){
    const a=sent.ask||{};
    return card(esc(i18t('st_ask_sent_h',{who:stAdminsSaid(),day:stDay(a.createdAt)})),
      `<p>${esc(i18t(sent.again?'st_ask_sent_again':'st_ask_sent_b',{n:3}))}</p>`, '');
  }
  if(!(typeof API_MODE==='function'&&API_MODE())) return card(esc(i18t('st_ask_h')), `<p>${esc(i18t('st_needs_server'))}</p>`, '');
  /* AN ASK BEGUN FROM A DOOR (round 24 as drawn: the head's and the Role
     row's "Ask an admin"): the question is the reader's to write */
  if(c.free) return card(esc(i18t('st_ask_free_h')),
    `<p>${esc(i18t(c.panel==='me:role'?'st_ask_role_b':'st_ask_free_b',{ who:stAdminsSaid() }))}</p>
     <label class="sr-only" for="st-ask-what-${t.id}">${esc(i18t('st_ask_free_ph'))}</label>
     <textarea id="st-ask-what-${t.id}" class="st-ask-why" rows="3" maxlength="200" placeholder="${esc(i18t('st_ask_free_ph'))}">${esc(t.q||'')}</textarea>
     ${sent&&sent.state==='err'?`<p class="st-jb-state">${esc(sent.error||'')}</p>`:''}`,
    `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-st-ask-admin="${t.id}" data-st-ask-panel="${esc(c.panel||'')}">${esc(i18t('st_ask_go'))}</button><button type="button" class="ui-btn ui-btn-sm" data-st-jb-drop="${t.id}">${esc(i18t('st_jb_not_now'))}</button>`);
  return card(esc(i18t('st_ask_h')),
    `<p>${esc(i18t('st_ask_b',{who:stAdminsSaid(),name:p?p.title():''}))}</p>
     <label class="sr-only" for="st-ask-why-${t.id}">${esc(i18t('st_ask_why'))}</label>
     <textarea id="st-ask-why-${t.id}" class="st-ask-why" rows="2" maxlength="600" placeholder="${esc(i18t('st_ask_why'))}"></textarea>
     ${sent&&sent.state==='err'?`<p class="st-jb-state">${esc(sent.error||'')}</p>`:''}`,
    `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-st-ask-admin="${t.id}" data-st-ask-panel="${esc(c.panel)}">${esc(i18t('st_ask_go'))}</button><button type="button" class="ui-btn ui-btn-sm" data-st-jb-drop="${t.id}">${esc(i18t('st_jb_not_now'))}</button>`);
}
async function stAskSend(turnId, panel){
  const t=stJbLog().find(x=>String(x.id)===String(turnId)); if(!t) return;
  const why=String((document.getElementById('st-ask-why-'+turnId)||{}).value||'').trim();
  /* a question the reader wrote themselves (an ask begun from a door) */
  const wbox=document.getElementById('st-ask-what-'+turnId);
  if(wbox){ const w=String(wbox.value||'').trim();
    if(!w){ t.ask={ state:'err', error:i18t('st_ask_free_need') }; stJbTurnRepaint(t); return; }
    t.q=w; }
  try{
    const r=await api('settings-asks','POST',{ what:t.q, why:wbox?'':why, panel });
    t.ask={ state:'sent', ask:(r&&r.ask)||{}, again:!!(r&&r.again) };
    toast(i18t('st_ask_toast',{who:stAdminsSaid()}),'ok');
    stAsksLoad();
  }catch(e){ t.ask={ state:'err', error:(e&&e.message)||'' }; }
  stJbTurnRepaint(t);
}
/* ONE ASK, SENT FROM THE PLACE THE RULE STOOD IN THE WAY — the SAME record
   by the same route as Jambo's card above (POST /api/settings-asks: Needs you,
   the bell, the reminder, as every ask; one open ask per person per panel, the
   server answering `again` for a second press), the same toast and the same
   list read again; only the place it is pressed differs, and the caller says
   what is asked. Two doors use it (joined at the integration, 19 Oct 2026):
   Fill in's stream row (round 8 "Owed first": "Moving a contract to another
   stream is an admin's act. · Ask an admin", panel 'refile:<id>') and the
   Board's Jambo's work card (round 23: "Ask an admin sends Sara your question
   as a request she answers; it waits in her Needs you until she does", panel
   'agents'). Resolves to the ask, or null where it could not be sent (said in
   a toast) — no second record and no second writer. */
async function stAskDirect(panel, what, why){
  const words = String(what || '').trim().slice(0, 200);
  if(!words || !(typeof API_MODE==='function'&&API_MODE())){ toast(i18t('st_needs_server'),'warn'); return null; }
  try{
    const r=await api('settings-asks','POST',{ what:words, why:String(why||'').slice(0,600), panel:String(panel||'') });
    if(r&&r.again) toast(i18t('st_ask_sent_again',{who:stAdminsSaid()}),'warn');
    else toast(i18t('st_ask_toast',{who:stAdminsSaid()}),'ok');
    await stAsksLoad();
    return (r&&r.ask)||null;
  }catch(e){ toast((e&&e.message)||i18t('st_needs_server'),'err'); return null; }
}
/* the reader's own ask on a panel that still waits for an answer, or null
   (what Fill in's row and the Board's card say they already asked) */
const stAskOpenOn=panel=>stAsksMine().find(a=>a&&a.status==='open'&&a.panel===panel)||null;
/* THE ADMIN'S ANSWER: the ask in their words, the rule as it stands with its
   own door, and the two answers — done, or no with a reason. The rule is
   changed in ITS drawer by its one writer; this records the answer. */
function stAskDrawer(id){
  const a=(_stAsks||[]).find(x=>String(x.id)===String(id)); if(!a) return null;
  const p=SET_PANELS[a.panel]; const st=p?(stStateOf(a.panel)||{}):null;
  const who=(a.by&&a.by.name)||'';
  return { title:i18t('st_ask_dr_title',{who}), sub:stDay(a.createdAt), foot:'done',
    body:`<div class="st-ask-q">“${esc(a.what)}”</div>
      ${a.why?`<p class="st-note">${esc(i18t('st_ask_dr_why',{why:a.why}))}</p>`:''}
      ${p?`<div class="st-gate-row"><span class="st-gate-t"><span class="st-gate-n">${esc(p.title())}</span>${st&&st.text?`<span class="st-gate-s">${esc(stShortState(st.text))}</span>`:''}</span>
        <button type="button" class="ui-btn ui-btn-sm" data-st-panel="${a.panel}">${esc(i18t('st_ask_dr_open'))}</button></div>`:''}
      ${!p&&a.by&&a.by.id&&(typeof userById==='function')&&userById(a.by.id)?`<div class="st-gate-row"><span class="st-gate-t"><span class="st-gate-n">${esc(a.panel==='me:role'?i18t('st_ask_dr_role'):i18t('st_ask_dr_person'))}</span></span>
        <button type="button" class="ui-btn ui-btn-sm" data-st-panel="person:${PB_ATTR(a.by.id)}">${esc(i18t('st_jb_open_person',{ name:String(who).split(' ')[0] }))}</button></div>`:''}
      ${a.status==='open'?`<div class="st-ask-acts">
        <button type="button" class="ui-btn ui-btn-primary" data-st-ask-answer="${esc(a.id)}" data-st-ask-to="done">${esc(i18t('st_ask_dr_done',{name:who.split(' ')[0]}))}</button>
        <button type="button" class="ui-btn" data-st-ask-answer="${esc(a.id)}" data-st-ask-to="declined">${esc(i18t('st_ask_dr_no'))}</button></div>`
        :`<p class="st-note">${esc(i18t(a.status==='done'?'st_ask_dr_was_done':'st_ask_dr_was_no',{who:a.answeredBy||'',note:a.note||''}))}</p>`}` };
}
async function stAskAnswer(id, to){
  let note='';
  if(to==='declined'){
    const r=await promptDialog({ title:i18t('st_ask_no_title'), message:i18t('st_ask_no_msg'), placeholder:i18t('st_ask_no_ph'), confirmLabel:i18t('st_ask_dr_no'), cancelLabel:i18t('act_cancel') });
    if(r==null) return; note=String(r).trim(); if(!note){ stDrawerRefuse(i18t('st_ask_no_need')); return; }
  }
  try{ await api('settings-asks/'+encodeURIComponent(id),'PATCH',{ status:to, note }); }
  catch(e){ stDrawerRefuse((e&&e.message)||''); return; }
  toast(i18t(to==='done'?'st_ask_done_toast':'st_ask_no_toast'),'ok');
  stDrawerClose(); await stAsksLoad();
}
/* the asker has read the answer (their bell row's press, or Jambo showing it) */
async function stAskSeen(id){
  const a=(_stAsks||[]).find(x=>String(x.id)===String(id)); if(!a||a.seenAt) return;
  a.seenAt=new Date().toISOString();
  try{ await api('settings-asks/'+encodeURIComponent(id),'PATCH',{ seen:true }); }catch(_){}
  if(typeof updateAlertBadge==='function') try{ updateAlertBadge(); }catch(_){}
}
/* JAMBO TELLS THE ASKER, ON SETTINGS: what is still waiting, and any answer */
/* the same asks as plain sentences, for the Overview's quiet lines (stJbLandHtml) */
function stAsksMineLines(){
  if(stIsAdmin()) return [];
  return stAsksMine().slice(0,3).map(a=>{
    if(a.status!=='open') setTimeout(()=>stAskSeen(a.id),0);
    return a.status==='open'?i18t('st_ask_mine_wait',{what:a.what,day:stDay(a.createdAt)})
      :i18t(a.status==='done'?'st_ask_mine_done':'st_ask_mine_no',{what:a.what,who:a.answeredBy||'',note:a.note||''}); });
}

/* ---- A "WHY" ANSWERED WITH AI (piece 17; owner, 16 Oct 2026: "yes") ----
   COPILOT'S PLACE: resting on something checkable (the rules and the
   contract the SERVER reads — POST /api/ai/settings-why), spending on a press
   with the cost said first, never silent: no engine, a refusal or a cut-short
   answer each says so on the card. It explains; it changes nothing, and its
   doors are the board's own. The answer belongs to this sitting's turn. */
const stJbAiOn=()=>(typeof API_MODE==='function')&&API_MODE()&&!!(typeof state!=='undefined'&&state.aiConfigured);
function stJbWhyCardHtml(c, t){
  const btn=(attrs,label,primary)=>`<button type="button" class="ui-btn ui-btn-sm${primary?' ui-btn-primary':''}" ${attrs}>${esc(label)}</button>`;
  const card=(head,body,acts,fine)=>`<div class="st-jb-card st-jb-ai"><div class="st-jb-ch">${head}</div>${body?`<div class="st-jb-cb">${body}</div>`:''}${acts?`<div class="st-jb-ca">${acts}</div>`:''}${fine?`<p class="st-jb-fine">${fine}</p>`:''}</div>`;
  const id=t&&t.id, w=t&&t.ai;
  if(!stJbAiOn()) return c.loose?'':card(esc(i18t('st_jb_why_h')), `<p>${esc(i18t('st_jb_why_noai'))}</p>`, '', '');
  if(!w) return card(esc(i18t('st_jb_why_h')), `<p>${esc(i18t(stIsAdmin()?'st_jb_why_b':'st_jb_why_b_you'))}</p>`,
    btn(`data-st-jb-why="${id}"`, i18t('st_jb_why_go'), true)+(c.loose?'':btn(`data-st-jb-drop="${id}"`, i18t('st_jb_not_now'), false)),
    esc(i18t('st_jb_why_cost')));
  if(w.state==='busy') return card(esc(i18t('st_jb_why_h')), `<p>${(typeof busyHtml==='function')?busyHtml(i18t('st_jb_why_busy')):esc(i18t('st_jb_why_busy'))}</p>`, '', '');
  if(w.state==='err') return card(esc(i18t('st_jb_why_h')), `<p>${esc(w.error||i18t('st_jb_why_failed'))}</p>`, btn(`data-st-jb-why="${id}"`, i18t('st_jb_why_again'), false), '');
  const a=w.answer||{};
  /* a member's way through the rule is the tracked ask, with their own question
     in it (the governance rule, 17 Oct 2026) */
  const doors=(a.doors||[]).map(d=>d.ask&&SET_PANELS[d.ask]?btn(`data-st-jb-askfor="${d.ask}" data-st-jb-q-id="${id}"`, i18t('sc_ask_admin'), true)
    : d.panel&&SET_PANELS[d.panel]?btn(`data-st-panel="${d.panel}"`, SET_PANELS[d.panel].title(), false)
    : d.person&&(typeof userById==='function')&&userById(d.person)?btn(`data-st-panel="person:${PB_ATTR(d.person)}"`, i18t('st_jb_open_person',{name:stNameOf(userById(d.person)).split(' ')[0]}), false):'').join('');
  return card(esc(a.title||i18t('st_jb_why_done_h')),
    `<p>${esc(a.say||'')}</p>${(a.points||[]).length?`<ul>${a.points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${a.notice?`<p class="st-jb-state">${esc(a.notice)}</p>`:''}`,
    doors, esc(i18t('st_jb_why_read',{what:(a.read||[]).join(', ')||i18t('st_jb_why_read_rules')})));
}
function stJbTurnRepaint(t){
  const el=document.querySelector(`[data-st-jb-turn="${t.id}"]`); if(!el) return;
  const d=document.createElement('div'); d.innerHTML=stJbTurnHtml(t); if(d.firstElementChild) el.replaceWith(d.firstElementChild);
}
async function stJbWhyRun(id){
  const t=stJbLog().find(x=>String(x.id)===String(id)); if(!t || (t.ai&&t.ai.state==='busy')) return;
  t.ai={ state:'busy' }; stJbTurnRepaint(t);
  try{
    const r=await api('ai/settings-why','POST',{ q:t.q });
    t.ai={ state:'done', answer:r||{} };
  }catch(e){ t.ai={ state:'err', error:(e&&e.message)||i18t('st_jb_why_failed') }; }
  stJbTurnRepaint(t);
}
/* THE CHIPS BEFORE ANYBODY TYPES are drawn with Jambo's words for the page
   in front (stJbFeedHtml, rounds 24–26 as drawn); stJbChips and
   stJbChipsHtml went with the old greeting. */
/* THE TWO-ROW CARD's one builder (components.js), read where it is drawn;
   a page loaded without it (a test's one-file world) draws the bare parts */
const _stJbCard = o => (typeof jamboCardHtml === 'function') ? jamboCardHtml(o) : `${o.field || ''}${o.ctx || ''}${o.send || ''}${o.tail || ''}`;
const _stJbSend = (a, l, o = {}) => (typeof jamboSendHtml === 'function') ? jamboSendHtml(a, l, o) : `<button type="${o.submit ? 'submit' : 'button'}" ${a || ''} aria-label="${l}" title="${o.title || l}"></button>`;

function stJamboHtml(){
  stTalkLand();
  const on=stTalkShows();
  return `<div class="st-jb">
    <div id="st-jb-trail" hidden></div>
    <div class="st-jb-feed${!on&&_stSwPick&&_stPage==='streams'?' is-stream':''}" id="st-jb-feed" aria-live="polite">${stJbFeedHtml()}</div>
    <form class="st-jb-ask" id="st-jb-form" autocomplete="off">
      <label class="sr-only" for="st-jb-q">${esc(i18t('st_jb_ph'))}</label>
      ${''/* the door back, and the bin, right above the box while the conversation shows (Door above the box) */}${typeof jamboDoorHtml==='function'?jamboDoorHtml({ on, back:'settings', to:i18t('pd_tab_overview'), bin:stBinHtml(on) }):''}${typeof jamboFwdHtml==='function'?jamboFwdHtml({ on:!on&&typeof jamboConvo==='function'&&jamboConvo().length>0, host:'settings' }):''}
      ${_stJbCard({ field: `<textarea id="st-jb-q" rows="1" maxlength="200" data-ca-slash data-jb-enter autocomplete="off" placeholder="${esc(i18t('st_jb_ph'))}"></textarea>`, send: _stJbSend('', i18t('st_jb_ask'), { submit: true }) })}
    </form>
  </div>`;
}
/* SETTINGS' BOX'S ONE READER (made a function 28 Oct 2026 so a chip-like ask reads as the box does; Enter and Ask pass
   {typed:true}) */
function stJbBoxAsk(q,opts){
  q=String(q||'').trim(); if(!q) return;
  /* JAMBO, THE SAME ON EVERY PAGE (owner, 18 Oct 2026): a page, a contract's
     number, a draft or a send is read as Home reads it (caAskAnywhere);
     finding a setting is this box's own job, for the rest */
  /* ONE READER FOR EVERY JAMBO BOX (owner, 19 Oct 2026): a place, a
     contract ("briefing for contracts mk 345"), a place with a narrowing
     leave Settings like any box; a Settings section asked here stays the
     finder's (box 'settings'); a number nobody can see is said here */
  /* JAMBO'S TAB READS WITH THE BRAIN FIRST (owner, 27 Oct 2026, the Board's rolled out): typed while his tab shows,
     the chat answers and takes them to the exact setting (goto); Overview's box keeps the finder and the readers */
  /* ONE PANEL, TWO FACES (owner, 28 Oct 2026, "Door above the box"): a page's one name moves you free; every other
     word typed is the brain's, on the landing too (it takes them to the exact setting through goto) */
  if(opts&&opts.typed&&typeof jamboPageGo==='function'&&jamboPageGo(q)) return;
  if(opts&&opts.typed&&typeof caAiFirst==='function'&&caAiFirst()&&typeof aiAskWords==='function'){ stJbAskJambo(q,{ controls:true }); return; }
  if(typeof caAskAnywhere==='function'&&caAskAnywhere(q,{ box:'settings', say:line=>stJbSayLine(q,line) })) return;
  /* AI FIRST (Jambo works like Copilot, stage 3): the finder sure of ONE setting goes there as it says so;
     words that are no setting at all ("what law governs the Kabras contract") are Jambo's to answer, here */
  let hits=[]; try{ hits=stFind(q); }catch(_){ hits=[]; }
  /* a question about the company's RULES ("why can't Legal sign…") keeps its cost-first press (stJbAsk's why) */
  const rules=/\b(why|can'?t|cannot|allowed|may|limits?|rules?|approv\w*|access|permission\w*|sign\w*|review\w*|varför|får|gräns\w*|regel\w*|godkän\w*|behörighet\w*)\b/i.test(q);
  /* words that name a contract ("…the overview of contact mk 382") or ask to be taken somewhere are no
     setting either (owner, 23 Oct 2026): Jambo's, never "I could not find a setting" */
  let named=false; try{ named=typeof caContractOf==='function'&&!!caContractOf(q); }catch(_){ named=false; }
  const asks=!rules&&(ST_JB_ASK_RE.test(q)||named||(!hits.length&&ST_JB_GO_RE.test(q))||/\b(contracts?|agreements?|deals?|leases?|avtal\w*|kontrakt\w*)\b/i.test(q));
  if(!hits.length&&asks&&typeof caAiFirst==='function'&&caAiFirst()&&typeof aiAskWords==='function'){ stJbAskJambo(q); return; }
  stJbAsk(q);
  /* …and goes there only when the words ask to be taken ("where do I set…", "take me to…"); a word typed
     to find a setting leaves the finder's rows to press (Settings lands, never presses) */
  if(hits.length===1&&ST_JB_GO_RE.test(q)){ const row=stFindRows(q)[0]; if(row&&row.id) stFindGo(row.id); }
}
/* AN ASK IS ADDED WHERE IT IS READ — appended to the feed, the box keeps the
   reader's hand; the page underneath does not move. */
const ST_JB_GO_RE=/^\s*(where (do|can|should) i|how (do|can) i|take me|go to|open|show me|var (kan|ställer|ändrar) jag|ta mig)\b/i;
/* a question (not a setting to find): Jambo answers it, with the whole of HaTi */
const ST_JB_ASK_RE=/^\s*(which|what|who|whom|whose|when|why|how (many|much|long|often|do|does|can)|does|do|did|is|are|can|could|should|vilk\w*|vad|vem|när|varför|hur)\b/i;
/* a question for Jambo asked in Settings: answered in the one conversation (aiAskWords), drawn in this panel's */
function stJbTalkNow(){
  const feed=document.getElementById('st-jb-feed'); if(!feed) return;
  stTalkLand();
  if(typeof jamboTalkOpen==='function') jamboTalkOpen(stTalkKey(), feed);
  stJbTalkRepaint(stJbTalkWrap(feed)); stJbTalkPaint(); stJbLand(feed);
}
async function stJbAskJambo(q,opts){
  const asked=aiAskWords(q,opts);
  stJbTalkNow();
  try{ await asked; }catch(_){}
  stJbTalkNow();
}
function stJbAsk(q){
  q=String(q||'').trim(); if(!q) return;
  /* the stream shown stays the landing, as left (19 Oct 2026; was round 26's
     "an ask brings Jambo's words back where a stream was shown"): the panel
     turns to the conversation */
  const t={ id:++_stJbSeq, q };
  stJbPush(t);
  const feed=document.getElementById('st-jb-feed'); if(!feed) return;
  [...feed.querySelectorAll('[data-st-jb-turn]')].forEach(el=>{
    if(!stJbLog().some(x=>String(x.id)===el.getAttribute('data-st-jb-turn'))) el.remove(); });
  stJbTurnAdd(t);
}
/* ---- JAMBO AS A TAB YOU FLIP TO, AND BACK — SETTINGS (owner, 19 Oct 2026:
   "you land on the page and if you want to chat with jambo it takes you to a
   new jambo tab but you can go back to the landing side panel") ----
   The panel lands on the page's own words (or the stream chosen); a turn
   added turns it to the conversation under the one trail line ("‹ Overview
   Overview / Jambo", jamboTrailHtml); the back, Esc and the bar's ‹ return to
   the landing as it was left. The page is the key (You, Company and its
   page): another begins fresh (turns after _stTalk.from). */
let _stTalk={ from:0 };
function stTalkKey(){ const co=stIsAdmin()&&settingsTab()==='company'; return 'settings:'+(co?'company':'you')+':'+(co?(_stPage||''):''); }
function stTalkLand(){ if(typeof jamboTalkLand==='function'&&jamboTalkLand(stTalkKey())){ _stTalk={ from:0 }; return true; } return false; }
function stTalkShows(){ return typeof jamboTalkShows==='function'&&jamboTalkShows(stTalkKey()); }
/* ONE WINDOW (owner, 24 Oct 2026: "settings has no information either"): the panel holds only his words — every
   page but a stream chosen on Streams, which shows that stream's facts — so the conversation is the panel: his
   greeting first, the turns under it, no Overview / Jambo tabs, no word beside them, no trail */
/* …BUT NOT WHERE THE LANDING CARRIES LINKS (owner, 26 Oct 2026, of every page:
   "if a link is on the first page and a user will need to access it, they
   should not scroll up the jambo to find this link"). Settings' landing is not
   only his words any more: it carries "N things need you here" with a link per
   row, and those were pushed out of reach as the conversation grew. So the
   test is what the landing actually HOLDS, not which page it is — nothing to
   press means his one window, anything to press means the two tabs this panel
   already draws (data-st-overview beside data-st-talk). */
function stLandHasLinks(){
  try {
    const land=_stSwPick&&_stPage==='streams'?stSwPanelHtml(_stSwPick):stJbLandHtml();
    return /<(?:a|button)\b/i.test(String(land||''));
  } catch(_){ return false; }
}
/* AN OVERVIEW TAB ON EVERY PAGE, THEN THE JAMBO TAB (owner, 26 Oct 2026: "we will have an overview tab side panel
   in each page followed by the jambo tab"): never his one window any more; kept as a name so its callers read alike */
function stSolo(){ return false; }
function stTalkTurns(){ return stJbLog(); }
/* the trail over the conversation and which of the two views is up */
function stJbTalkPaint(){
  stTalkLand();
  const solo=stSolo();
  if(solo&&stTalkShows()&&typeof jamboTalkClose==='function') jamboTalkClose();
  const on=!solo&&stTalkShows();
  const tr=document.getElementById('st-jb-trail');
  /* no trail over the conversation: its way back is the door above the box (Door above the box, 28 Oct 2026) */
  if(tr){ tr.innerHTML=''; tr.hidden=true; }
  const feed=document.getElementById('st-jb-feed');
  if(feed){ const L=feed.querySelector(':scope > [data-st-jb-land]'), T=feed.querySelector(':scope > [data-st-jb-talk]');
    if(L) L.hidden=on; if(T) T.hidden=!(on||solo);
    feed.classList.toggle('is-stream',!on&&!!_stSwPick&&_stPage==='streams'); }
  const side=document.getElementById('st-side'); if(side){ side.classList.toggle('is-talk',on); side.classList.toggle('is-solo',solo); }
  const sh=document.getElementById('st-side-head'); if(sh&&sh.getAttribute('data-solo')!==String(solo)){ sh.innerHTML=stSideHeadHtml(); sh.setAttribute('data-solo',String(solo)); }
  const ov=document.getElementById('st-side-tab-jambo'), tk=document.querySelector('#st-side [data-st-talk-label]');
  if(ov) ov.hidden=on;
  if(tk) tk.hidden=!on;
  { const f=document.getElementById('st-jb-form'); if(typeof jamboDoorSync==='function') jamboDoorSync(f,on); if(typeof jamboBinSync==='function') jamboBinSync(f,on||solo); }
  if(typeof deskBarPaint==='function') try{ deskBarPaint(); }catch(_){ }
}
/* the newest turn read from its first line (jamboFeedLand, owner 20 Oct 2026) */
function stJbLand(feed){
  if(!feed) return;
  if(typeof jamboFeedLand==='function') jamboFeedLand(feed, jamboFeedLast(feed,'[data-st-jb-turn]')); else feed.scrollTop=feed.scrollHeight;
}
/* a turn said in the panel: the conversation view comes up, the landing kept */
function stJbTurnAdd(t){
  stTalkLand();
  if(t&&Number(t.id)<=_stTalk.from) _stTalk.from=Number(t.id)-1;
  const feed=document.getElementById('st-jb-feed'); if(!feed) return;
  if(typeof jamboTalkOpen==='function') jamboTalkOpen(stTalkKey(), feed);
  const T=stJbTalkWrap(feed);
  stJbTalkRepaint(T);
  stJbTalkPaint();
  stJbLand(feed);
}
function stTalkReopen(){
  if(typeof jamboTalkOpen!=='function') return false;
  const feed0=document.getElementById('st-jb-feed');
  if(feed0) stJbTalkRepaint(stJbTalkWrap(feed0));
  jamboTalkOpen(stTalkKey(), feed0);
  stJbTalkPaint();
  stJbLand(document.getElementById('st-jb-feed'));
  return true;
}
function stTalkBack(){
  const keep=(typeof jamboTalkClose==='function')?jamboTalkClose():[];
  stJbTalkPaint();
  const feed=document.getElementById('st-jb-feed'); if(feed) feed.scrollTop=0;
  if(typeof jamboScrollPut==='function') jamboScrollPut(keep);
}
/* "Jambo ›" above the box on the landing opens the conversation as it was (owner's pick, 28 Oct 2026) */
if(typeof jamboTalkFwdHost==='function') jamboTalkFwdHost('settings', ()=>stTalkReopen());
if(typeof jamboTalkHost==='function') jamboTalkHost('settings', stTalkBack, k=>!stSolo()&&k===stTalkKey()&&typeof state!=='undefined'&&state.view==='team'&&!!document.getElementById('st-jb-feed'));
function stJbDrop(id){
  stJbForget(id);
  document.querySelector(`[data-st-jb-turn="${id}"]`)?.remove();
}
/* READY, NOT SAVED: the person's drawer, the limit typed into its box (and
   "No limit" taken off, which is what asking for a limit means). The live
   sentence under the box reads it back; Save is the person's, as ever. */
function stJbStage(id, amount){
  stDrawerOpen('person:'+id);
  const none=document.getElementById('tm-cap-none');
  if(none && none.checked){ none.checked=false; none.dispatchEvent(new Event('change',{bubbles:true})); }
  const box=document.getElementById('tm-cap'); if(!box) return;
  box.disabled=false; box.value=String(amount);
  box.dispatchEvent(new Event('input',{bubbles:true}));
  box.classList.add('st-staged');
  try{ box.scrollIntoView({block:'center'}); box.focus({preventScroll:true}); }catch(_){}
}
/* THE TOP BAR'S JAMBO COMES HERE while this panel is on screen (aiEmbeddedHere
   in js/ai.js): one Jambo on the screen, the one beside the settings. */
function stJamboFocus(prefill){
  stSideSet('jambo');
  const box=document.getElementById('st-jb-q'); if(!box) return false;
  if(prefill) box.value=String(prefill);
  try{ box.focus({preventScroll:true}); }catch(_){}
  return true;
}

/* ---- THE SIDE PANEL: JAMBO, AS DRAWN (rounds 24, 25 and 26, the gaps of 18 Oct
   2026): Jambo's face and name, a word for what the panel holds ("Your
   settings", "Company settings", "Sales · stream", "Data & backup") and a
   fold to the right edge; his words and chips for the page in front; the ask
   box at the foot. The Menu is no tab of its own any more: "/" in his box
   opens it (as the box's placeholder says), and his answer that finds nothing
   still offers it; its head carries "‹ Jambo" back. ---- */
let _stSide='jambo', _stSideFold=false;
function stSideWord(){
  if(stIsAdmin() && settingsTab()==='company' && _stPage){
    if(_stPage==='streams'){ const f=_stSwPick&&FOLDERS[_stSwPick]; return f?i18t('st_side_stream',{ name:f.name }):i18t('st_sw_title'); }
    if(_stPage==='data') return i18t('st_p_backup');
    if(_stPage==='sheet') return i18t('st_pg_sheet');
    if(_stPage==='roles') return i18t('st_pg_roles');
    if(_stPage==='panel'){ const p=SET_PANELS[_stDock]; if(p) return p.title();
      const t=document.querySelector('#st-dock .rvd-title'); return t?t.textContent.trim():i18t('st_side_company'); }
    return i18t('st_pg_team');
  }
  return i18t(stIsAdmin()&&settingsTab()==='company'?'st_side_company':'st_side_you');
}
/* THE BIN (owner, 27 Oct 2026: "in settings there is no trash button to clear history"): the one builder every
   Jambo tab carries (jamboBinHtml), shown with the conversation; stJbTalkPaint keeps it in step */
function stBinHtml(talk){ return (typeof jamboBinHtml==='function')?jamboBinHtml(!!talk&&typeof jamboConvo==='function'&&jamboConvo().length>0):''; }
function stSideHeadHtml(){
  /* Overview wears a plain mark; his face is the Jambo tab's (19 Oct 2026) */
  const face=`<span class="st-side-ic st-side-mark" aria-hidden="true">\u25A6\uFE0E</span>`;
  const jbFace=(typeof jamboFaceHtml==='function')?jamboFaceHtml('hello',22,'st-side-ic'):'';
  const fold=`<button type="button" class="st-side-fold" data-st-side-fold title="${esc(i18t('st_side_fold'))}" aria-label="${esc(i18t('st_side_fold'))}">›</button>`;
  if(_stSide==='menu') return `<button type="button" class="st-side-back" data-st-side="jambo">‹ ${esc(i18t('pd_tab_overview'))}</button><span class="st-side-word">${esc(i18t('st_side_menu'))}</span><span class="st-side-sp"></span>${fold}`;
  /* THE PANEL IS THE PAGE'S (owner, 19 Oct 2026): its tab is the landing,
     "Overview"; "Jambo" names only the conversation it flips to */
  /* THE WAY BACK TO THE CONVERSATION (owner picked "A Jambo tab", 19 Oct
     2026): once a turn was said on this page a "Jambo" tab stands beside
     Overview; pressed it opens the conversation, pressed again it goes back */
  /* ONE WINDOW (stSolo): nothing to flip between — his one tab "Jambo" (his sign and name), no Overview, no word */
  if(stSolo()){ const jb1=esc(i18t('pd_tab_copilot'));
    return `<span class="st-side-tab st-side-talk" aria-current="true" title="${jb1}">${jbFace}<span>${jb1}</span></span><span class="st-side-sp"></span>${stBinHtml(true)}${fold}`; }
  const talk=stTalkShows();
  const jb=esc(i18t('pd_tab_copilot'));
  /* ONE PANEL, TWO FACES (owner picked "Door above the box", 28 Oct 2026): no Jambo tab to press — the head is
     Overview on the landing and his name alone in the conversation (a label); the way back and the bin stand
     right above the box (stJamboHtml) */
  return `<span class="st-side-tab" id="st-side-tab-jambo" data-st-overview aria-current="true"${talk?' hidden':''}>${face}<span>${esc(i18t('pd_tab_overview'))}</span></span><span class="st-side-tab st-side-talk" data-st-talk-label aria-current="true" title="${jb}"${talk?'':' hidden'}>${jbFace}<span>${jb}</span></span><span class="st-side-sp"></span>${fold}`;
  /* NO PAGE NAME BESIDE THE TABS (owner, 26 Oct 2026: "on the side panel next to the Jambo tab you have the name of the page next to the Jambos which looks like an additional tab. These are to be deleted."): the page's word (stSideWord) is no longer drawn beside the tabs */
}
function stSideHtml(){
  const face=(typeof jamboFaceHtml==='function')?jamboFaceHtml('hello',26,'st-side-ic'):'';
  /* THE SLIDER's grip (splitHtml, the one builder every Jambo panel draws,
     19 Oct 2026), on the panel's side of the seam; stSplitFit wires and fits it */
  const grip=(typeof splitHtml==='function')?splitHtml({ id:'st-resizer', min:ST_SIDE_MIN, hidden:_stSideFold }):'';
  return `<aside class="st-side${_stSideFold?' is-folded':''}" id="st-side" aria-label="${esc(i18t('st_side_label'))}">
    ${grip}<div class="st-side-head" id="st-side-head">${stSideHeadHtml()}</div>
    <div class="st-side-body" id="st-side-jambo"${_stSide==='jambo'?'':' hidden'}>${stJamboHtml()}</div>
    <div class="st-side-body st-side-menu" id="st-side-menu"${_stSide==='menu'?'':' hidden'}>${stMenuHtml()}</div>
    <button type="button" class="st-side-unfold" data-st-side-fold title="${esc(i18t('st_side_unfold'))}" aria-label="${esc(i18t('st_side_unfold'))}">${face}</button>
  </aside>`;
}
function stSideSet(k){
  if(k!=='jambo' && k!=='menu') return;
  _stSide=k;
  if(_stSideFold) stSideFoldSet(false);
  ['jambo','menu'].forEach(x=>{ const el=document.getElementById('st-side-'+x); if(el) el.hidden=(x!==k); });
  stSideHeadPaint();
}
function stSideHeadPaint(){ const h=document.getElementById('st-side-head'); if(h) h.innerHTML=stSideHeadHtml(); }
/* FOLDED TO THE RIGHT EDGE, his face brings him back (as drawn). Per sitting. */
function stSideFoldSet(on){
  _stSideFold=!!on;
  const page=document.getElementById('set-page'), side=document.getElementById('st-side');
  if(page) page.classList.toggle('is-side-folded',_stSideFold);
  if(side) side.classList.toggle('is-folded',_stSideFold);
  /* folded, the divider stands down; opened, it is back at the seam */
  try{ stSplitFit(); }catch(_){}
  if(!_stSideFold) try{ stSideFit(); }catch(_){}
}
/* ---- THE SLIDER (owner, 19 Oct 2026: "all the new jambo panels do not have
   a slider like in the redline page. They should all have one.") ----
   Settings' Jambo panel is a client of the ONE divider (splitHtml ·
   splitWire · splitFit, js/components.js), Home's own. The width is the
   board's second grid track, --st-side-w on the page (index.html), resting
   where nobody has chosen at the track's own width — 380 from 1401px, 344
   from 981 to 1400 — so a reader who never drags sees the page unchanged.
   The floors: the panel keeps ST_SIDE_MIN (its cards and doors on one line,
   Home's panel's floor), the board beside it ST_BOARD_MIN — MEASURED: the
   narrowest board this stylesheet itself draws with the You sheet's contents
   list beside its rows and the Company cards three to a row (779px, at a
   1181px window; one pixel narrower and the window's own rules stack them).
   At 620 the cards' facts broke word by word. Below 981px the panel follows
   the board (stacked) and the divider stands down; folded, too. Settings
   keeps its own key. */
const ST_SIDE_MIN=340, ST_BOARD_MIN=780;
const ST_SPLIT_KEY='hati.v1.stSideW';
const stWide=()=>(typeof matchMedia!=='function')||matchMedia('(min-width:981px)').matches;
const ST_SPLIT={
  key:ST_SPLIT_KEY, min:ST_SIDE_MIN, restMin:ST_BOARD_MIN, foldedW:46,
  w0:()=>((typeof matchMedia==='function')&&matchMedia('(min-width:1401px)').matches)?384:344,   /* THE BRIEF: 384 (was 380) */
  folded:()=>_stSideFold||!document.getElementById('st-side'),
  off:()=>!stWide(),
  /* the room the board and the panel share: the grid's two tracks (its gap aside) */
  avail:()=>{ const cols=document.querySelector('#set-page .st-cr-cols'); if(!cols||typeof cols.getBoundingClientRect!=='function') return 0;
    let gap=0; try{ gap=parseFloat(getComputedStyle(cols).columnGap)||0; }catch(_){ gap=0; }
    return Math.max(0, Math.round(cols.getBoundingClientRect().width-gap)); },
  /* the track's right edge (the panel itself bleeds past it into the page's padding) */
  edge:()=>{ const cols=document.querySelector('#set-page .st-cr-cols'); return cols?cols.getBoundingClientRect().right:0; },
  /* the lists' mark is counted from the page's left edge (#content-scroll) to the panel's edge; the board starts
     inside the page's padding and the grid's gap stands between it and the panel, so the mark in the board's own
     room is that much less — the panel slides over at the same spot on the screen as on People */
  overAt:()=>{ const cols=document.querySelector('#set-page .st-cr-cols'), cs=document.getElementById('content-scroll');
    if(!cols||!cs) return SPLIT_OVER_AT;
    try{ const gap=parseFloat(getComputedStyle(cols).columnGap)||0;
      return SPLIT_OVER_AT-Math.max(0, Math.round(cols.getBoundingClientRect().left-cs.getBoundingClientRect().left+gap)); }catch(_){ return SPLIT_OVER_AT; } },
  /* THE ONE WRITER of the width: the track; folded, the stylesheet's 46 */
  /* past the mark the track stops narrowing the board and the panel lies over it by `over` (splitOver) */
  apply:(w,over)=>{ const page=document.getElementById('set-page'); if(!page||_stSideFold) return; page.style.setProperty('--st-side-w', Math.round(w-(over||0))+'px');
    const side=document.getElementById('st-side'); if(side){ side.style.width=over?Math.round(w)+'px':''; side.style.marginLeft=over?(-over)+'px':''; side.classList.toggle('is-split-over', !!over); } },
  /* the head card wraps to the new width: the panel's height is measured again */
  settle:()=>{ try{ stSideFit(); }catch(_){} },
  resize:()=>{ if(document.getElementById('st-side')) stSplitFit(); }
};
function stSplitFit(){
  if(typeof document==='undefined'||typeof splitWire!=='function') return;
  const rez=document.getElementById('st-resizer');
  if(!rez) return;
  splitWire(rez, ST_SPLIT);
}
/* chips are said as the drawings say them: a sentence's first word small */
const stChipWord=w=>{ const s=String(w||''); return s?s.charAt(0).toLocaleLowerCase(((typeof langLocale==='function')?langLocale():undefined))+s.slice(1):s; };
const stListJoin=words=>{ const w=words.filter(Boolean);
  try{ if(typeof Intl!=='undefined'&&Intl.ListFormat) return new Intl.ListFormat((typeof langLocale==='function')?langLocale():undefined,{ type:'conjunction' }).format(w); }catch(_){}
  return w.join(', '); };
/* a small count said as a word where a sentence starts with it */
const stNumWord=(n,lower)=>{ const w=(n>=1&&n<=10)?i18t('st_num_'+n):String(n); return lower?stChipWord(w):w; };
/* WHAT NEEDS YOU, IN A FEW WORDS EACH (round 25 as drawn: "a clash in who
   may sign what, the quarterly access review, and two contracts ready to
   delete in Sales") — read off Needs your attention's own rows */
function stJbNeedPhrase(r){
  const k=String(r&&r.key||'');
  if(k.indexOf('ask:')===0){ const a=(stAsksOpen()||[]).find(x=>'ask:'+x.id===k); return i18t('st_jb_np_ask',{ who:(a&&a.byName)||'' }); }
  if(k.indexOf('clash:cap:')===0) return i18t('st_jb_np_clash_sign');
  if(k.indexOf('clash:')===0) return i18t('st_jb_np_clash');
  if(k==='review') return i18t('st_jb_np_review');
  if(k.indexOf('keep-unseen:')===0) return i18t('st_jb_np_unseen',{ stream:(FOLDERS[k.slice(12)]||{}).name||'' });
  if(k.indexOf('keep:')===0){ const fid=k.slice(5), x=((state.keeping||{}).due||{})[fid]||{}, n=Number(x.n)||0;
    return i18tn(x.then==='archive'?'st_jb_np_keep_archive':'st_jb_np_keep',n,{ n:stNumWord(n,true), stream:(FOLDERS[fid]||{}).name||'' }); }
  if(k==='limits') return i18t('st_jb_np_limits');
  if(k==='backup') return i18t('st_jb_np_backup');
  if(k==='invite') return i18t('st_jb_np_invite');
  if(k.indexOf('panel:')===0){ const p=SET_PANELS[k.slice(6)]; return p?stChipWord(p.title()):''; }
  return stChipWord(r&&r.text||'');
}
function stJbCompanyWords(){
  const rows=stNeedsAll();
  if(!rows.length) return i18t('st_jb_co_none');
  /* rows of one kind said once, with their count ("three clashes in who may
     do what"), never the same words three times over */
  const groups=[], byWords={};
  rows.forEach(r=>{ const k=String(r&&r.key||''), kind=(k.indexOf('clash:')===0&&k.indexOf('clash:cap:')!==0)?'clash':k;
    if(byWords[kind]) byWords[kind].n++; else { byWords[kind]={ r, kind, n:1 }; groups.push(byWords[kind]); } });
  const shown=groups.slice(0,4);
  const said=shown.map(g=>g.kind==='clash'?i18tn('st_jb_np_clashes',g.n,{ n:stNumWord(g.n,true) }):stJbNeedPhrase(g.r)).filter(Boolean);
  const rest=rows.length-shown.reduce((a,g)=>a+g.n,0);
  if(rest>0) said.push(i18tn('st_jb_np_more',rest,{ n:rest }));
  /* his words are the drawing's, nothing after them (the gaps' third pass):
     the clash row itself says it warns ("a clash in who may do what"), so
     st_jb_clashes (17 Oct's "they warn, nothing is blocked") stays INERT in
     both books */
  return i18tn('st_jb_co_needs',rows.length,{ n:stNumWord(rows.length), list:stListJoin(said) });
}
/* THE STREAMS PAGE, said from its own table's readings (nothing chosen) */
function stJbStreamsWords(){
  const rows=stSwRows(), kept=rows.filter(r=>r.years!=null).length;
  const due=rows.filter(r=>r.due), n=due.reduce((a,r)=>a+r.due,0);
  return [i18tn('st_jb_sw_words',rows.length,{ n:rows.length, kept }),
    n?i18tn('st_jb_sw_due',n,{ n, list:stListJoin(due.map(r=>r.name)) }):'', i18t('st_jb_sw_press')].filter(Boolean).join(' ');
}
/* DATA & BACKUP, said from the trail's own count (round 26 as drawn): the
   period, its acts, the streams it covers; the private streams it leaves out
   by name — the ones this page already names on Contract streams — and that
   a code-named deal travels by its code name */
function stTrailLeftOut(){
  const me=String(((typeof currentUser==='function'&&currentUser())||{}).id||'');
  return Object.values(FOLDERS||{}).filter(f=>{ if(!f||!f.id) return false; const p=stPsSaved(f.id); return !!(p&&p.on)&&!stPsIds(p).includes(me); }).map(f=>f.name);
}
/* WHILE HE COUNTS, THE RING TURNS (WHEN SOMETHING LOADS, SOMETHING MOVES):
   html=true gives the words for the bubble, the counting sentence wearing
   busyHtml; a count that could not be read says so, never "counting" for ever */
function stJbDataWords(html){
  const d=_stTr, out=stTrailLeftOut();
  const period=(d.from&&d.to)?stTrailPeriodWords(d.from,d.to):'';
  const s=(d.sum&&d.sumKey===stTrailQuery())?d.sum:null;
  const counting=!s&&!d.sumErr;
  const first=(s&&!Number(s.acts))?i18t('st_jb_tr_none',{ period }):s?i18tn('st_jb_tr_words',s.acts,{ period, n:Number(s.acts).toLocaleString((typeof jxLocale==='function')?jxLocale():undefined), streams:i18tn('st_jb_tr_streams',s.streams,{ n:s.streams }) })
    :d.sumErr?i18t('st_jb_tr_failed',{ period }):i18t('st_jb_tr_counting',{ period });
  const parts=[first];
  if(out.length) parts.push(i18tn('st_jb_tr_out',out.length,{ names:stListJoin(out) }));
  if((state.contracts||[]).some(c=>c&&c._codeNamed)) parts.push(i18t('st_jb_tr_code'));
  if(!html) return parts.join(' ');
  return parts.map((w,i)=>(i===0&&counting&&typeof busyHtml==='function')?busyHtml(w):esc(w)).join(' ');
}
function stJbDataRepaint(){
  const el=document.querySelector('#st-jb-feed [data-st-jb-hello]');
  if(el && _stPage==='data') el.innerHTML=stJbDataWords(true);
}
function stJbChipBtn(label, attrs){ return `<button type="button" class="st-jb-chip" ${attrs}>${esc(stChipWord(label))}</button>`; }
/* HIS FIRST CHIP IS THE FIRST ROW'S BUTTON, IN PLAIN WORDS (round 25 as
   drawn: "open Lina Ek"): a button that names its thing is said as it
   stands; a one-word verb is followed by what it settles, with no colon */
function stJbFirstChipHtml(){
  const first=stNeedsAll()[0]; if(!first) return '';
  const verb=String(first.verb||'').trim();
  const said=verb.split(/\s+/).length>1?verb:i18t('st_jb_c_need',{ verb, what:stJbNeedPhrase(first) });
  return stJbChipBtn(said,first.btn).replace('class="st-jb-chip"','class="st-jb-chip" data-st-jb-first=""');
}
/* THE FEED'S TWO VIEWS (19 Oct 2026): the landing — the page in Jambo's words,
   or the stream chosen — and the conversation, one shown at a time */
function stJbFeedHtml(){
  stTalkLand();
  const on=stTalkShows();
  const land=_stSwPick&&_stPage==='streams'?stSwPanelHtml(_stSwPick):stJbLandHtml();
  /* landed and never turned: the page's words stand in the feed bare — no
     wrapper, no empty conversation (the colour census counts what is drawn);
     the two views are made the first time a turn is said (stJbTalkWrap) */
  if(stSolo()) return stJbLandWrapHtml((typeof jamboHelloHtml==='function'?jamboHelloHtml():'')+land,false)+stJbTalkWrapHtml(false);
  if(!on) return land;
  return stJbLandWrapHtml(land,true)+stJbTalkWrapHtml(false);
}
function stJbMenuDoorHtml(){
  const n=stMenuCount();
  return `<div class="st-jb-menu-door" data-st-jb-menu-door><button type="button" class="ui-btn ui-btn-sm" data-st-side="menu">${esc(i18t('st_jb_to_menu'))}</button><span class="st-jb-fine">${esc(i18tn('st_jb_menu_n',n,{n}))}</span></div>`;
}
function stJbLandWrapHtml(land, hide){ return `<div class="st-jb-land" data-st-jb-land data-jt-land${hide?' hidden':''}>${land}</div>`; }
function stJbTalkInnerHtml(){
  if(typeof jamboTurnHtml!=='function') return stTalkTurns().map(stJbTurnHtml).join('');
  if(typeof jamboReadStamp==='function') jamboReadStamp();
  if(window.aiConvoInWindow?aiConvoInWindow():(window.aiPopped&&aiPopped())){ if(typeof window.renderAIFeed==='function') try{ renderAIFeed(); }catch(_){ } return `<p class="igd-popped">${esc(i18t('jb_in_window'))} <button type="button" class="ui-link" data-jb-popback>${esc(i18t('jb_bring_back'))}</button></p>`; }
  const H=stJbConvo();
  /* GREETING FIRST EITHER WAY (26 Oct 2026). With the page's own tab beside
     his, nothing said yet left his tab blank — you pressed Jambo and got an
     empty panel. His greeting stands there until the first turn, the way
     Home's talk view falls back to its welcome line. */
  /* JAMBO IS THINKING (owner, 28 Oct 2026): while his answer is on its way the conversation says so, as every panel's does */
  const busy=!!(window.ai&&ai.busy)&&typeof jamboThinkingHtml==='function'?`<div class="ai-msg flex gap-2.5">${typeof jamboFaceHtml==='function'?jamboFaceHtml('think',28,'ai-face shrink-0 mt-0.5'):''}${jamboThinkingHtml()}</div>`:'';
  if(!H.length) return busy||((typeof jamboHelloHtml==='function')?jamboHelloHtml():`<p class="st-note">${esc(i18t('int_notebook_welcome'))}</p>`);
  return H.map((m,i)=>jamboTurnHtml(m,i,H,'st')).join('')+busy;
}
function stJbTalkWrapHtml(hide){ return `<div class="st-jb-talk" data-st-jb-talk data-jt-talk${hide?' hidden':''}>${stJbTalkInnerHtml()}</div>`; }
/* the whole conversation drawn again in the talk view, taken off the other hosts */
function stJbTalkRepaint(T){
  if(!T) return;
  T.innerHTML=stJbTalkInnerHtml();
  if(typeof jamboTurnsTake==='function') jamboTurnsTake(T);
  if(typeof jamboTurnsAfter==='function') jamboTurnsAfter(T);
}
/* the landing as left goes into its own view (nothing redrawn, so an open
   row and its scrolls stay), the conversation beside it */
function stJbTalkWrap(feed){
  let T=feed.querySelector(':scope > [data-st-jb-talk]'); if(T) return T;
  let L=feed.querySelector(':scope > [data-st-jb-land]');
  if(!L){ L=document.createElement('div'); L.className='st-jb-land'; L.setAttribute('data-st-jb-land',''); L.setAttribute('data-jt-land','');
    while(feed.firstChild) L.appendChild(feed.firstChild); feed.appendChild(L); }
  feed.insertAdjacentHTML('beforeend', stJbTalkWrapHtml(true));
  return feed.querySelector(':scope > [data-st-jb-talk]');
}
/* WHAT JAMBO SAYS FIRST, for the page in front */
/* THE OVERVIEW, THE LEGORA WAY (owner picked it, 26 Oct 2026; jamboOverviewHtml, the one builder): the Menu door
   first, then one head sentence, the named facts with their row's own door, and "Ask me" with the chips this page
   already offered — no face, no bubble. His greeting is the Jambo tab's (stJbTalkInnerHtml). */
function stJbLandHtml(){
  const admin=stIsAdmin(), face=admin?settingsTab():'you';
  const chipsOn=(typeof jamboChipsOn!=='function')||jamboChipsOn();
  const ask=q=>`data-st-jb-ask="${esc(q)}"`;
  const chip=(label,attr)=>({ label:stChipWord(label), attr });
  /* THE MENU DOOR, FRONT AND CENTRE (owner, 26 Oct 2026: "this menu button should be front and center in the
     overview page. Why is it hidden?"): the one door to the Menu face (data-st-side="menu", the same press as
     under a "nothing found" answer) stands first on every landing, with how many settings it lists. */
  const door=stJbMenuDoorHtml();
  const hello='data-st-jb-hello';
  let o;
  if(admin && face==='company' && _stPage==='data'){
    o={ head:{ html:stJbDataWords(true) }, headAttr:hello, asks:chipsOn?[chip(i18t('st_jb_c_tr_pdf',{ period:stTrailPeriodWords(_stTr.from||stTrailDefault().from,_stTr.to||stTrailDefault().to,true) }),'data-st-tr-pdf'),
      chip(i18t('st_jb_c_sealed'),'data-st-jb-say="sealed"')]:[] };
  } else if(admin && face==='company' && _stPage==='streams'){
    o={ head:{ html:esc(stJbStreamsWords()) }, headAttr:hello };
  } else if(admin && face==='company'){
    const priv=Object.values(FOLDERS||{}).find(f=>{ const p=f&&stPsSaved(f.id); return p&&p.on; })||Object.values(FOLDERS||{})[0];
    const first=chipsOn?stJbFirstChipHtml():'';
    o={ head:{ html:esc(stJbCompanyWords()) }, headAttr:hello,
      facts:[{ html:esc(i18t('st_jb_co_how')) }],
      asks:chipsOn?[chip(i18t('st_jb_c_next'),ask(i18t('st_jb_c_next'))), priv?chip(i18t('st_jb_c_stream',{ name:priv.name }),ask(i18t('st_jb_c_stream',{ name:priv.name }))):null].filter(Boolean):[],
      /* the first row's own button, said in plain words, stays first under "Ask me" (round 25 as drawn) */
      before:'', firstAsk:first };
  } else {
    const u=(typeof currentUser==='function'&&currentUser())||{};
    const m=(state.away||{}).mine;
    const apiOn=(typeof API_MODE==='function')&&API_MODE();
    const other=((typeof langList==='function')?langList():[]).find(l=>l.id!==((typeof langId==='function')?langId():''));
    const you=(k,focus)=>`data-st-you="${k}"${focus?` data-st-you-focus="${esc(focus)}"`:''}`;
    /* the facts are the You sheet's own readings (stYouItems' states, stDevicesSaid), each link its row's door */
    const facts=[{ k:i18t('st_you_lang'), v:[stLangName(), stMarketSaid()].filter(Boolean).join(' · '), link:i18t('jov_ln_change'), attr:you('lang') }];
    if(apiOn){ const cad=briefCadenceOf(u);
      facts.push({ k:i18t('st_you_brief_row'), v:i18t('st_you_brief_'+cad), need:cad==='off', link:i18t(cad==='off'?'jov_ln_set':'jov_ln_change'), attr:you('told') });
      facts.push({ k:i18t('st_you_away'), v:stAwayState(), link:i18t('jov_ln_change'), attr:you('away') });
      facts.push({ k:i18t('ts_title'), v:i18t(u.twoStep?'st_you_ts_on':'st_you_ts_off'), need:!u.twoStep, link:i18t('st_you_manage'), attr:you('safety') });
      const ss=_stYouFacts.sessions; if(ss) facts.push({ k:i18t('st_you_devices_row'), v:stDevicesSaid(ss), link:i18t('st_you_manage'), attr:you('safety') }); }
    /* the asks he is still waiting on an admin for, said as quiet lines of the list */
    stAsksMineLines().forEach(l=>facts.push({ html:esc(l) }));
    if(!admin && apiOn) facts.push({ html:esc(i18t('st_jb_rules_admin',{ who:stAdminFirstSaid(), to:stAdminFirstSaid(true) })) });
    o={ head:{ html:esc(i18t('st_jb_you_hello')+(m?' '+i18t('st_jb_away',{who:m.deputyName}):'')) }, headAttr:hello, facts,
      asks:chipsOn?[apiOn?chip(i18t('st_jb_c_brief'),ask(i18t('st_jb_c_brief'))):null,
        other?chip(i18t('st_jb_c_lang_to',{ name:other.name }),ask(i18t('st_jb_c_lang_to',{ name:other.name }))):null,
        chip(i18t('st_jb_c_chips_off'),ask(i18t('st_jb_c_chips_off'))),
        /* a company rule is an admin's: said, with the door to ask (as drawn) */
        (!admin && apiOn)?{ label:i18t('st_ask_go'), attr:'data-st-ask-head=""' }:null].filter(Boolean):[] };
  }
  let html=(typeof jamboOverviewHtml==='function')?jamboOverviewHtml(o,'st'):'';
  /* the company board's first row keeps its own button (its press is the row's own door), first under "Ask me" */
  if(o.firstAsk) html=html.includes('<div class="jov-asks">')?html.replace('<div class="jov-asks">','<div class="jov-asks">'+o.firstAsk.replace('class="st-jb-chip"','class="st-jb-chip jov-lnk is-ask"'))
    :html.replace(/<\/div>$/,`<p class="jov-eyebrow">${esc(i18t('jov_ask_me'))}</p><div class="jov-asks">${o.firstAsk.replace('class="st-jb-chip"','class="st-jb-chip jov-lnk is-ask"')}</div></div>`);
  return door+html;
}
/* THE TRAIL AS A PDF, READIED (round 26's chip "download Q3 as a PDF"): the
   page turns to The trail, its As box says PDF and the Download button is
   lit — the download is still the reader's press, recorded before it leaves */
function stTrailReadyPdf(){
  if(!(stIsAdmin()&&settingsTab()==='company'&&_stPage==='data')){ _stBkTab='trail'; settingsGoPage('data'); }
  else if(_stBkTab!=='trail'){ const b=document.querySelector('[data-st-bk-tab="trail"]'); if(b) b.click(); }
  _stTr.as='pdf';
  const sel=document.getElementById('st-tr-as-sel'); if(sel) sel.value='pdf';
  /* LAND ON IT: Download lit and ready, the one lander's way; it follows the
     button through the page's repaint (the count drawn again) */
  if(typeof landOn==='function') landOn('#st-tr-download',{ block:'nearest' });
  const t={ id:++_stJbSeq, q:stChipWord(i18t('st_jb_c_tr_pdf',{ period:stTrailPeriodWords(_stTr.from,_stTr.to,true) })), force:{ say:i18t('st_jb_tr_pdf_ready'), cards:[] } };
  stJbPush(t);
  stJbTurnAdd(t);
}
/* A QUESTION JAMBO ANSWERS FROM WHAT HaTi IS, spending nothing ("what is a
   sealed PDF?") */
/* A LINE THE ONE READER SAYS HERE ("There is no contract MK-999 that you
   can see"): a turn with the reader's words and Jambo's one line */
function stJbSayLine(q, line){
  const t={ id:++_stJbSeq, q:String(q||'').trim().slice(0,200), force:{ say:String(line||''), cards:[] } };
  stJbPush(t);
  stJbTurnAdd(t);
}
function stJbSayFixed(kind, label){
  const said={ sealed:'st_jb_sealed_say' }[String(kind||'')]; if(!said) return;
  const t={ id:++_stJbSeq, q:String(label||'').trim(), force:{ say:i18t(said), cards:[] } };
  stJbPush(t);
  stJbTurnAdd(t);
}
/* the admin a member would ask, by first name where there is one */
function stAdminFirstSaid(to){
  const a=stUsers().filter(u=>u.role==='admin');
  /* "I can send Sara your question" (round 24 as drawn): the admin by name —
     HaTi keeps no one's pronoun, so it never guesses one */
  return a.length===1?stNameOf(a[0]).split(' ')[0]:i18t(to?'st_jb_an_admin_to':'st_jb_an_admin');
}
/* the feed drawn again for the page in front (a page or face turned) */
function stJbFeedRepaint(){
  const feed=document.getElementById('st-jb-feed'); if(!feed) return;
  feed.innerHTML=stJbFeedHtml();
  stJbTalkPaint();
  stSideHeadPaint();
}
/* ASK AN ADMIN FROM THE HEAD OR A ROW (round 24 as drawn: "Ask an admin"
   beside "Your settings", and on the Role row): Jambo's ask card, the
   question theirs to write — the same tracked record (settings_asks) every
   ask is, waiting in an admin's Needs you, its answer in the asker's bell. */
function stAskGeneral(about){
  if(stIsAdmin()) return;
  const t={ id:++_stJbSeq, q:about==='role'?i18t('st_ask_role_words'):'', force:{ say:'', cards:[{ k:'askadmin', panel:about==='role'?'me:role':'', free:true }] } };
  stJbPush(t);
  stSideSet('jambo');
  stJbTurnAdd(t);
  const box=document.getElementById('st-ask-what-'+t.id);
  if(box) try{ box.focus({preventScroll:true}); box.setSelectionRange(box.value.length,box.value.length); }catch(_){}
}
/* THE PANEL FITS THE WINDOW. It is sticky inside the page's own scroller
   (THE TWO SCROLLS — no second scroller for the page), so its height is
   measured: from where it stands, or from under the pinned tab row once the
   page has scrolled, to the scroller's foot. Its own feed scrolls inside. */
let _stSideFitWired=false, _stSideFitAsk=0;
function stSideFit(){
  if(typeof document==='undefined') return;
  const side=document.getElementById('st-side'), sc=document.getElementById('content-scroll'), page=document.getElementById('set-page');
  if(!side||!sc||!page||typeof side.getBoundingClientRect!=='function') return;
  /* what is pinned at the top of the left column: the head card (it stays
     while the page scrolls), else an older pinned row */
  const band=page.querySelector('#st-headcard')||page.querySelector('.st-tabs-pin');
  const padT=(band&&band.id==='st-headcard'&&typeof getComputedStyle==='function')?(parseFloat(getComputedStyle(band).top)||0):0;
  const bandH=band?Math.round(band.getBoundingClientRect().height+padT):0;
  const top=bandH+12;
  const sb=sc.getBoundingClientRect(), r=side.getBoundingClientRect();
  if(!sb.height) return;
  const from=Math.max(r.top, sb.top+top);
  page.style.setProperty('--st-side-top', top+'px');
  page.style.setProperty('--st-band-h', bandH+'px');
  /* BESIDE THE PAGE, THE WHOLE WINDOW TALL (the gaps' third pass, as drawn):
     from 981px the panel is the right column from under the bar to the foot,
     stuck at the scroller's top — so it is the scroller's own height, and
     its ask box is never cut nor slid under anything (index.html) */
  const wide=(typeof matchMedia!=='function')||matchMedia('(min-width:981px)').matches;
  page.style.setProperty('--st-side-h', (wide?Math.max(360, Math.floor(sc.clientHeight)):Math.max(360, Math.floor(sb.bottom-from-16)))+'px');
}
function stSideFitWire(){
  /* a cut-down stage has a window without events */
  if(_stSideFitWired || typeof window==='undefined' || typeof window.addEventListener!=='function') return;
  _stSideFitWired=true;
  const ask=()=>{ if(_stSideFitAsk) return;
    const run=()=>{ _stSideFitAsk=0; if(document.getElementById('st-side')) stSideFit(); };
    _stSideFitAsk=1; if(typeof requestAnimationFrame==='function') requestAnimationFrame(run); else run(); };
  window.addEventListener('resize', ask);
  document.getElementById('content-scroll')?.addEventListener('scroll', ask, { passive:true });
}

/* ============================================================
   TAB 1 — PEOPLE
   ============================================================
   A member is FINISHED when the workspace can act on them without an admin
   having to come back: a name, a work email, the capacity they sign in, and an
   answer on which folders they may see. The chip counts exactly those, and the
   banner names the people who are short — an amber count with nobody's name on
   it is a number you cannot act on. */
function stAccessOf(u){
  /* PRIVATE FOLDERS COUNT AS THEY ARE (17 Oct 2026): "All" stays the answer
     only while no private folder shuts this person out; otherwise the line
     says how many of the folders they can open, read through canAccessFolder
     — an admin included. `all` keeps meaning "nobody narrowed their list". */
  const total=Object.keys(FOLDERS).length;
  const open=()=>(typeof canAccessFolder==='function')?Object.keys(FOLDERS).filter(fid=>canAccessFolder(fid,u)).length:total;
  const allOf=()=>{ const n=open();
    return n<total ? { all:true, but:true, n, get text(){ return i18t('set_streams_of',{n,total}); } }
      : { all:true, get text(){ return i18t('set_all_streams_short'); } }; };
  if(u.role==='admin') return allOf();
  const v=(((state.settings||{}).folderAccess)||{})[u.id];
  if(v==null||v==='*'||(Array.isArray(v)&&!v.length)) return allOf();
  const n=open();
  return { all:false, n, get text(){ return i18t('set_streams_of',{n,total}); } };
}
/* Value visibility is a server-side right (users.can_view_values); admins
   always have it, and a member created before the permission existed defaults
   to having it, so this deploy changes nothing until an admin turns it off. */
const stValuesOn=u=>u.role==='admin'||u.canViewValues!==false;
/* The new-paper grant, read through the product's ONE reading (js/core.js) so
   the drawer and every door it governs cannot disagree. Guarded because
   settings.js runs on stages that do not load core. */
const stNewPaperOn=u=>(typeof mayMakeNewPaper==='function')
  ? mayMakeNewPaper(u) : (u.role==='admin'||u.newPaper===true);
/* The re-filing grant, read the same way and for the same reason. */
const stReFileOn=u=>(typeof mayReFile==='function')
  ? mayReFile(u) : (u.role==='admin'||u.reFile===true);
/* THE EIGHTH GRANT'S READING, asked through the one predicate exactly as its
   two neighbours are, with the same literal fallback for a stage that has not
   loaded js/core.js. */
const stHoldOn=u=>(typeof mayHoldContract==='function')
  ? mayHoldContract(u) : (u.role==='admin'||u.holdContracts===true);
/* WHAT IS MISSING, AS A LIST OF WORDS — the same list the drawer refuses with
   and the same list the chip counts. One reading, three readers. */
/* ============================================================
   WHAT CAN THIS PERSON ACTUALLY DO? (21 Sep 2026, the process review's
   fifth item)

   A colleague can be given, one switch at a time: which value streams they
   see, how much they may sign for, whether their work is checked before it
   goes out, who checks it, who oversees them, whether they may re-file a
   contract, whether they may write new paper, and whether they may freeze
   one. Each is sensible on its own. Together, nobody could answer the
   question above without opening this drawer and reading eight rows.

   EVERY LINE IS BORROWED FROM THE SWITCH BELOW IT, so the summary and the
   control can never disagree — this states what the product already decides,
   it does not decide anything. It is READ-ONLY for the same reason: a second
   place to change a grant is a second place for two screens to drift.

   AN ADMIN IS SAID ONCE. Six of the eight are moot for an admin (they are
   never capped, never narrowed, always allowed), and printing six lines
   saying so is the fact printed six times. */
function stPersonSays(u){
  const out = [];
  const say = (k, o) => (typeof i18t === 'function') ? i18t(k, o || {}) : k;
  if(!u) return out;
  const admin = String(u.role||'') === 'admin';
  const viewer = String(u.role||'') === 'viewer';
  /* 1 — which streams */
  let acc = null; try{ acc = stAccessOf(u); }catch(_){ acc = null; }
  const all = Object.keys((typeof FOLDERS!=='undefined' && FOLDERS) || {}).length;
  if(acc && acc.all && !acc.but) out.push(say('st_sum_streams_all'));
  else {
    const n = (acc && acc.n) || 0;
    out.push(n ? say('st_sum_streams_some', { n, all }) : say('st_sum_streams_none'));
  }
  /* 0 — whether their contracts need a named approval before signing. Said
     for an ADMIN too, and before their one line: of all eight this is the one
     that is not moot for an admin, because it is a rule ABOUT the person, not
     a right they hold by rank (23 Sep 2026). */
  let saOn = false;
  try{ saOn = (typeof saRuleOf==='function') && saRuleOf(u, (typeof signApprovalLegacyOn==='function') ? signApprovalLegacyOn() : false).on; }catch(_){ saOn = false; }
  const over = (u.overseerId && typeof userById==='function') ? (userById(u.overseerId)||{}).name : '';
  if(saOn && over) out.push(say('sa_sum_on', { who: over }));
  if(admin){ out.push(say('st_sum_admin')); return out; }
  /* 2 — how much they may sign for. A limit is a FACT only while the
     workspace switch enforces it (4 Oct 2026, the process review): with the
     switch off it is a record, and "can sign up to X" read as a refusal that
     was not there. */
  let cap = null; try{ cap = (typeof signCapOf==='function') ? signCapOf(u) : null; }catch(_){ cap = null; }
  const capOn = (typeof signCapEnforced==='function') && signCapEnforced();
  if(viewer) out.push(say('st_sum_cannot_sign'));
  else if(cap && cap.answered && cap.limit != null)
    out.push(say(capOn ? 'st_sum_cap' : 'st_sum_cap_off', { amount: (typeof fmtMoneyShort==='function') ? fmtMoneyShort(cap.limit) : String(cap.limit) }));
  else out.push(say('st_sum_cap_none'));
  /* 2b — the value streams they may sign in, said only while that rule is
     on and only where it narrows them: "every stream" is the default. */
  if(!viewer && (typeof signFolderEnforced==='function') && signFolderEnforced()){
    let sf = '*'; try{ sf = (typeof signFolderAccess==='function') ? signFolderAccess(u) : '*'; }catch(_){ sf = '*'; }
    if(Array.isArray(sf)) out.push((typeof i18tn==='function') ? i18tn('st_sum_sign_folders', sf.length, { n: sf.length }) : 'st_sum_sign_folders');
  }
  /* 3 and 4 — is their work checked, and by whom: said only while the
     review gate is on, which is the only time it holds anything back. */
  const gateOn = !!((typeof reviewGateCfg==='function') ? reviewGateCfg() : {}).on;
  const checked = u.reviewChecked !== false;
  const by = (u.reviewerId && typeof userById==='function') ? (userById(u.reviewerId)||{}).name : '';
  if(gateOn){
    if(!checked) out.push(say('st_sum_unchecked'));
    else out.push(by ? say('st_sum_checked_by', { who: by }) : say('st_sum_checked'));
  }
  /* 5 — who oversees them: said above, as the approval it now is. */
  /* 6, 7, 8 — the three grants, said only where they are ON, because OFF is
     the default and a list of things somebody cannot do is not a summary */
  const grants = [];
  if(u.newPaper === true) grants.push(say('st_sum_g_paper'));
  if(u.reFile === true) grants.push(say('st_sum_g_refile'));
  if(u.holdContracts === true) grants.push(say('st_sum_g_hold'));
  out.push(grants.length ? say('st_sum_grants', { list: grants.join(', ') }) : say('st_sum_no_grants'));
  return out;
}
function stPersonSumHtml(u){
  const lines = stPersonSays(u);
  if(!lines.length) return '';
  /* AS DRAWN (SAP pop-ups, 10 Oct 2026): one information line, not a box
     with its own heading. */
  return `<div class="st-sum" role="note">${icon('info','w-4 h-4')}<p class="st-sum-p">${lines.map(l=>esc(l)).join(' ')}</p></div>`;
}
function stPersonMissing(u){
  const out=[];
  if(!String(u.name||'').trim()) out.push(i18t('st_f_name'));
  if(!String(u.email||'').trim()) out.push(i18t('st_f_email'));
  if(!String(u.title||'').trim()) out.push(i18t('st_f_title'));
  /* THE SIGNING LIMIT COUNTS ONLY WHILE THE RULE IS IN FORCE. With the switch
     off an unset limit stops nothing, so calling it "missing" would light the
     whole roster amber on the morning of a deploy over a decision nobody has
     been asked to make yet. Turn the rule on and it becomes a real gap. */
  if(typeof signCapEnforced==='function' && signCapEnforced()
     && u.role!=='viewer' && u.role!=='admin'
     && typeof signCapOf==='function' && !signCapOf(u).answered) out.push(i18t('sc_section'));
  return out;
}
/* ---- THE DRAWING'S TABLE (SAP benchmark, batch 2 — the owner's "go", 9 Oct
   2026) ---- Name, Role, Streams, Signing limit, Setup, one row per person,
   each row the door to that person's drawer. The yellow strip naming the
   unfinished went: the People TAB carries how many are unfinished, and each
   row's Setup cell says what is missing, in amber — the same list the drawer
   refuses with (stPersonMissing). Add member is the table's own act. */
function stUnfinishedCount(){
  try{ return (getUsers()||[]).filter(u=>stPersonMissing(u).length).length; }catch(_){ return 0; }
}
function stSetupHtml(miss){
  if(!miss.length) return `<span class="st-setup is-ok"><i aria-hidden="true"></i>${esc(i18t('st_complete'))}</span>`;
  const t=miss.length===1?i18t('st_setup_missing',{what:miss[0]}):i18tn('st_n_missing',miss.length,{n:miss.length});
  return `<span class="st-setup is-warn" title="${esc(miss.join(', '))}"><i aria-hidden="true"></i>${esc(t)}</span>`;
}
function stPeopleHtml(opts){
  const me=currentUser()||{};
  const users=getUsers()||[];
  const ic=n=>(typeof icon==='function')?icon(n,'w-3.5 h-3.5'):'';
  /* the business role, its own column where roles are kept (piece 6) */
  const bz=stBzOn();
  const rows=users.map(u=>{
    const ini=(u.name||u.email||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const miss=stPersonMissing(u);
    const acc=stAccessOf(u);
    const role=roleName(u.role);
    const hay=[u.name,u.email,u.title,role].filter(Boolean).join(' ').toLocaleLowerCase();
    const sa=stApprovalRowText(u);
    /* NOT SIGNED IN YET: said on the row, with the one act that helps */
    const invited=!!(u.prefs&&u.prefs.mustChangePassword)&&u.id!==me.id;
    return `<tr class="st-person" data-st-panel="person:${PB_ATTR(u.id)}" data-st-hay="${esc(hay)}">
      <td><button type="button" class="st-person-open" data-st-panel="person:${PB_ATTR(u.id)}"><span class="st-person-av">${esc(ini)}</span><span class="st-person-id"><span class="st-person-name">${esc(u.name||u.email)}${u.id===me.id?` <span class="st-person-you">${i18t('set_you')}</span>`:''}</span>${u.name&&u.email?`<span class="st-person-mail">${esc(u.email)}</span>`:''}</span></button></td>
      <td><span class="reg-stg ins-pill">${esc(role)}</span></td>
      ${bz?`<td class="st-bz-cell" data-st-bz="${PB_ATTR(u.id)}">${esc((stBzOf(u)||{}).name||'—')}</td>`:''}
      <td>${esc(acc.text)}</td>
      ${''/* HOW MUCH THEY MAY SIGN FOR, on the row: the fact an admin comes to
             this list to check. signCapText is the ONE reading; who approves
             before they sign rides under it where that rule is on. */}
      <td><span data-st-cap="${PB_ATTR(u.id)}">${esc((typeof signCapText==='function')?signCapText(u):'')}</span>${
        sa?`<span class="st-person-sub" data-st-sa="${PB_ATTR(u.id)}">${esc(sa)}</span>`:''}</td>
      <td>${u.twoStep===true?esc(i18t('st_sh_on')):u.twoStep===false?'<span class="st-person-off">'+esc(i18t('st_sh_off'))+'</span>':'—'}</td>
      <td>${invited?`<span class="st-setup is-warn"><i aria-hidden="true"></i>${esc(i18t('st_sh_not_in'))}</span> <button type="button" class="ui-btn ui-btn-sm st-person-resend" data-st-resend="${PB_ATTR(u.id)}">${esc(i18t('st_resend'))}</button>`:stSetupHtml(miss)}</td>
      <td class="st-person-go" aria-hidden="true">${ic('chevR')}</td>
    </tr>`;
  }).join('');
  return `<section class="st-people-card">
    <div class="ins-cardhead st-people-head">
      <h2 class="ins-cardhead-t">${esc(i18t((opts&&opts.title)||'st_tab_people'))} <span class="ins-cardhead-n">(${users.length})</span>${(()=>{ const n=users.filter(u=>stPersonMissing(u).length).length;
        /* the unfinished, counted where they are listed — each row says what */
        return n?` <span class="st-amber st-people-unf">${esc(i18tn('st_cr_unfinished_n',n,{n}))}</span>`:''; })()}</h2>
      <span style="flex:1"></span>
      <label class="ik-search">${ic('search')}<input type="search" id="st-people-q" placeholder="${esc(i18t('st_people_search'))}" aria-label="${esc(i18t('st_people_search'))}"></label>
      <button id="st-add-person" class="ui-btn ui-btn-primary" data-st-panel="person:new">${ic('plus')}${esc(i18t('st_add_person'))}</button>
    </div>
    <table class="st-people-table"><colgroup>${bz?'<col><col style="width:10%"><col style="width:11%"><col style="width:13%"><col style="width:14%"><col style="width:8%"><col style="width:19%"><col style="width:44px">'
      :'<col><col style="width:12%"><col style="width:14%"><col style="width:15%"><col style="width:9%"><col style="width:21%"><col style="width:44px">'}</colgroup>
      <thead><tr><th>${esc(i18t('dir_col_name'))}</th><th>${esc(i18t('dir_col_role'))}</th>${bz?`<th>${esc(i18t('bz_col_role'))}</th>`:''}<th>${esc(i18t('st_col_streams'))}</th><th>${esc(i18t('st_col_cap'))}</th><th>${esc(i18t('st_sh_twostep'))}</th><th>${esc(i18t('st_col_setup'))}</th><th><span class="sr-only">${esc(i18t('reg_more_actions'))}</span></th></tr></thead>
      <tbody class="st-people">${rows}</tbody></table>
  </section>`;
}
/* THE SEARCH NARROWS IN PLACE (rows hidden, never redrawn — THE SETTINGS PAGE
   HOLDS STILL), bound once per element. */
function stPeopleWire(){
  const box=document.getElementById('st-people-q');
  if(!box || box.dataset.stQBound) return;
  box.dataset.stQBound='1';
  box.addEventListener('input',()=>{
    const q=String(box.value||'').trim().toLocaleLowerCase();
    document.querySelectorAll('#set-page tr.st-person').forEach(tr=>{
      tr.hidden=!!q && !String(tr.getAttribute('data-st-hay')||'').includes(q); });
  });
}

/* ---- SECTION 4 — SIGNING ----
   Collapsed to a single sentence for a Viewer, who never signs at all: a
   control whose only outcome is "not applicable" is furniture. The live
   sentence at the foot reads back what is configured, including whether the
   rule is actually in force — a limit that is recorded and not enforced must
   not read as a limit that stops anybody. */
function stSigningSectionHtml(u, isNew){
  if(typeof signCapOf!=='function') return '';
  const cap=signCapOf(u);
  const enforced=(typeof signCapEnforced==='function')&&signCapEnforced();
  const cur=(typeof jxCurrency==='function')?jxCurrency():'';
  const sentence=(typeof signCapSentence==='function')?signCapSentence(u,cap,enforced):'';
  const body=(u.role==='viewer'||u.role==='admin')
    ? `<p class="st-note" id="tm-cap-says">${esc(sentence)}</p>`
    : `<label class="st-toggle" style="margin-bottom:var(--s-2)">
         <input id="tm-cap-none" type="checkbox"${(cap.answered&&cap.limit==null)?' checked':''}/>
         <span><span class="st-role-name">${esc(i18t('sc_no_limit'))}</span></span></label>
       <label style="display:block">
         <span style="${window.RV_LBL||''}">${esc(i18t('sc_cap_label',{cur}))}</span>
         <input id="tm-cap" type="number" min="0" step="1000" value="${cap.limit==null?'':String(cap.limit)}"
           style="${window.RV_FLD||ST_INPUT}"${(cap.answered&&cap.limit==null)?' disabled':''}/>
         <span class="st-note">${esc(i18t('sc_cap_hint'))}</span></label>
       <p class="st-note" id="tm-cap-says" style="margin-top:var(--s-2)">${esc(sentence)}</p>`;
  return `<section class="st-sec">
    <h3 class="st-sec-h"><span class="st-sec-n">4</span>${esc(i18t('sc_section'))}</h3>${body}${isNew?'':stClashSayHtml(u)}</section>`;
}
/* A REFUSAL CARRIES ITS WAY FORWARD (round 25's person drawer, as drawn: "A
   clash: Lina may sign more than the person who approves her. Lower her limit
   to her role's SEK 5 M, or name an approver who signs up to SEK 10 M"): the
   clash this person's limit makes, said under the limit with the two ways to
   settle it — read off stClashes, the list's own reading */
function stClashSayHtml(u){
  const r=(stClashes()||[]).find(x=>x.key==='clash:cap:'+String(u&&u.id)); if(!r) return '';
  const money=v=>(typeof fmtMoneyShortIn==='function')?fmtMoneyShortIn(Number(v),(typeof jxCurrency==='function')?jxCurrency():undefined):String(v);
  const bz=(typeof stBzOf==='function'&&stBzOn())?stBzOf(r.who):null;
  const roleCap=bz&&typeof bz.cap==='number'&&(r.cap==null||bz.cap<Number(r.cap))?bz.cap:null;
  const to=roleCap!=null?i18t('st_clash_to_role',{ v:money(roleCap) }):money(r.acap);
  const who=stNameOf(r.who).split(' ')[0], appr=stNameOf(r.appr);
  const said=r.cap==null?i18t('st_clash_dr_any',{ who, appr, to }):i18t('st_clash_dr',{ who, appr, to, cap:money(r.cap) });
  return `<p class="st-clash-say" role="note"><span class="st-dot" style="background:${ST_DOT.red}"></span><span>${esc(said)}</span></p>`;
}
/* Read the two controls back into the ONE three-state value the record holds.
   A ticked "No limit" is an ANSWER ('none'); an empty box with the tick off is
   nobody having decided (null). */
function stSigningRead(){
  const none=document.getElementById('tm-cap-none');
  const box=document.getElementById('tm-cap');
  if(!none&&!box) return undefined;              // section not drawn — change nothing
  if(none&&none.checked) return 'none';
  const v=(box&&box.value||'').trim();
  if(v==='') return null;
  const n=Number(v);
  return (Number.isFinite(n)&&n>=0) ? n : NaN;   // NaN = refuse, in words
}
function stSigningWire(u){
  const none=document.getElementById('tm-cap-none');
  const box=document.getElementById('tm-cap');
  const says=document.getElementById('tm-cap-says');
  if(!says) return;
  const paint=()=>{
    if(box&&none) box.disabled=!!none.checked;
    const raw=stSigningRead();
    const shown={ ...u, signCap: raw===undefined||Number.isNaN(raw) ? u.signCap : raw };
    if(typeof signCapSentence==='function')
      says.textContent=signCapSentence(shown, signCapOf(shown),
        (typeof signCapEnforced==='function')&&signCapEnforced());
  };
  none?.addEventListener('change',paint);
  box?.addEventListener('input',paint);
  paint();
}

/* ---- THE SECOND COLUMN: WHERE THEY MAY SIGN ----
   A SEPARATE list from what they may SEE, and the panel says which way it
   cuts: it only ever narrows. Somebody who cannot open a Marketing contract
   can never sign one, whatever is ticked here — so this can take a right away
   and never hand one out. Not drawn for an admin, who holds every folder. */
function stSignFolderHtml(u, isNew, folders){
  if(typeof signFolderAccess!=='function') return '';
  if(u.role==='admin') return '';
  const cur=isNew ? '*' : signFolderAccess(u);
  const set=new Set(Array.isArray(cur)?cur:[]);
  const all=cur==='*';
  return `<div class="st-sec" style="margin-top:14px">
    <h3 class="st-sec-h">${esc(i18t('sf_title'))}</h3>
    <select id="tm-sign-mode" style="${window.RV_FLD||ST_INPUT}">
      <option value="*"${all?' selected':''}>${esc(i18t('sf_every_they_see'))}</option>
      <option value="pick"${all?'':' selected'}>${esc(i18t('st_folders_pick'))}</option>
    </select>
    <div id="tm-sign-list" style="display:${all?'none':'grid'};grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-top:var(--s-2)">
      ${folders.map(f=>`<label style="display:flex;align-items:center;gap:7px;padding:6px var(--s-2);border:1px solid var(--color-divider);border-radius:var(--radius);cursor:pointer;font-size:var(--t-meta)">
        <input type="checkbox" data-tm-signfolder="${PB_ATTR(f.id)}"${set.has(f.id)?' checked':''} style="width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
        <span style="width:8px;height:8px;border-radius:var(--radius);background:${f.color};flex:none"></span>
        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</span></label>`).join('')}
    </div>
    <span class="st-note">${esc(i18t('sf_narrows'))}</span>
  </div>`;
}
function stSignFolderRead(){
  const sel=document.getElementById('tm-sign-mode');
  if(!sel) return undefined;                      // not drawn — change nothing
  if(sel.value==='*') return null;                // every folder they can see
  const ids=[...document.querySelectorAll('[data-tm-signfolder]')].filter(cb=>cb.checked)
    .map(cb=>cb.getAttribute('data-tm-signfolder'));
  return ids.length?ids:false;                    // false = refuse, in words
}

/* ---- SECTION 5 — WHO CHECKS THEIR WORK ----
   The workspace gate is the master switch and it lives on Platform settings;
   this is the per-person half. Drawn whether or not the gate is on, because an
   admin setting a workspace up decides who is checked before they turn the rule
   on — but it SAYS when nothing it holds is being held, so a tick here never
   reads as a change that has taken effect. A Viewer never redlines, so there is
   nothing of theirs to check. */
function stReviewSectionHtml(u, isNew){
  if(typeof reviewChecked!=='function') return '';
  if(u.role==='viewer') return '';
  const on=(typeof reviewGateCfg==='function')?reviewGateCfg().on:false;
  const checked=(u._bz&&u.reviewChecked!==undefined)?!!u.reviewChecked
    : isNew ? ((typeof reviewGateCfg==='function')?reviewGateCfg().newChecked:true) : reviewChecked(u);
  const cand=((typeof getUsers==='function'?getUsers():[])||[])
    .filter(x=>x&&x.id!==u.id&&x.role!=='viewer');
  return `<section class="st-sec">
    <h3 class="st-sec-h"><span class="st-sec-n">5</span>${esc(i18t('rv_who_checks'))}</h3>
    ${on?'':`<p class="st-note" style="margin-bottom:var(--s-2)">${esc(i18t('rv_person_gate_off'))}</p>`}
    <label class="st-toggle" style="margin-bottom:var(--s-2)">
      <input id="tm-rv-checked" type="checkbox"${checked?' checked':''}/>
      <span><span class="st-role-name">${esc(i18t('rv_person_checked'))}</span>
      <span class="st-note">${esc(i18t('rv_person_checked_sub'))}</span></span></label>
    <label style="display:block">
      <span style="${window.RV_LBL||''}">${esc(i18t('rv_person_reviewer'))}</span>
      <select id="tm-rv-reviewer" style="${window.RV_FLD||ST_INPUT}">
        <option value="">${esc(i18t('rv_person_nobody'))}</option>
        ${cand.map(x=>`<option value="${PB_ATTR(x.id)}"${String(u.reviewerId||'')===String(x.id)?' selected':''}>${esc(x.name||x.email)}</option>`).join('')}
      </select>
      <span class="st-note">${esc(i18t('rv_person_reviewer_sub'))}</span></label>
    <p class="st-note" id="tm-rv-says" style="margin-top:var(--s-2)"></p>
  </section>`;
}
/* The live sentence, read off the two controls rather than off the record — it
   has to describe what pressing Save would leave behind. */
function stReviewWire(u){
  const box=document.getElementById('tm-rv-checked');
  const sel=document.getElementById('tm-rv-reviewer');
  const says=document.getElementById('tm-rv-says');
  if(!says) return;
  const who=(u&&u.name)||i18t('sc_this_person');
  const paint=()=>{
    if(sel) sel.disabled=!(box&&box.checked);
    if(!box||!box.checked){ says.textContent=i18t('rv_person_off',{who}); return; }
    const pick=sel&&sel.value
      ? ((typeof getUsers==='function'?getUsers():[])||[]).find(x=>String(x.id)===String(sel.value))
      : null;
    says.textContent=pick ? i18t('rv_person_on_named',{who,reviewer:pick.name||pick.email})
                          : i18t('rv_person_on',{who});
  };
  box?.addEventListener('change',paint);
  sel?.addEventListener('change',paint);
  paint();
}
function stReviewRead(){
  const box=document.getElementById('tm-rv-checked');
  const sel=document.getElementById('tm-rv-reviewer');
  if(!box&&!sel) return undefined;                       // section not drawn
  return { reviewChecked: box?!!box.checked:undefined,
           reviewerId: sel?(sel.value||null):undefined };
}

/* ---- SECTION 6 — WHO SIGNS OFF THEIR CONTRACTS ----
   APPROVAL BEFORE SIGNING (Young ruled 23 Sep 2026: "Implement scenario 2").
   The admin sets it ONCE, on the person: Off or Always, who approves, who
   steps in when they are away, and whether it bites when this person LEADS a
   contract, is NAMED TO SIGN one, or both. Nothing they lead or sign is then
   signed until the approver says yes, whatever the value.

   IT REPLACES THE WORKSPACE SWITCH that used to sit on the approval rules
   panel. A person nobody has answered for yet reads that old switch, so the
   morning after the deploy every workspace is exactly as it was; the first
   Save here writes this person's own answer and the switch is never read for
   them again. js/signapproval.js is the reading, on both hosts. Never for a
   Viewer, who leads and signs nothing. */
function stApprovalRuleOf(u){
  try{ return saRuleOf(u, (typeof signApprovalLegacyOn==='function') ? signApprovalLegacyOn() : false); }
  catch(_){ return { on:false, approverId:'', backupId:'', lead:true, sign:true }; }
}
function stApprovalRowText(u){
  if(!u || u.role==='viewer' || typeof saRuleOf!=='function') return '';
  const r=stApprovalRuleOf(u);
  if(!r.on) return '';
  const who=(typeof userById==='function' && userById(r.approverId)||{}).name||'';
  return who ? i18t('sa_person_row',{who}) : '';
}
function stOverseerSectionHtml(u, isNew){
  if(typeof overseerCfg!=='function' || typeof saRuleOf!=='function') return '';
  if(u.role==='viewer') return '';
  const r=isNew ? { on:false, approverId:'', backupId:'', lead:true, sign:true } : stApprovalRuleOf(u);
  const cand=((typeof getUsers==='function'?getUsers():[])||[])
    .filter(x=>x&&x.id!==u.id&&x.role!=='viewer');
  const opts=(sel,none)=>`<option value="">${esc(none)}</option>`
    +cand.map(x=>`<option value="${PB_ATTR(x.id)}"${String(sel||'')===String(x.id)?' selected':''}>${esc(x.name||x.email)}</option>`).join('');
  return `<section class="st-sec">
    <h3 class="st-sec-h"><span class="st-sec-n">6</span>${esc(i18t('ov_section'))}</h3>
    <div class="sa-set-head"><span class="st-role-name">${esc(i18t('sa_rule_label'))}</span>
      <span class="sa-seg" role="group" aria-label="${PB_ATTR(i18t('sa_rule_label'))}">
        <button type="button" data-sa-set="off" aria-pressed="${r.on?'false':'true'}"${r.on?'':' class="on"'}>${esc(i18t('sa_off'))}</button>
        <button type="button" data-sa-set="always" aria-pressed="${r.on?'true':'false'}"${r.on?' class="on"':''}>${esc(i18t('sa_always'))}</button>
      </span></div>
    <div class="sa-set-grid">
      <label style="display:block"><span style="${window.RV_LBL||''}">${esc(i18t('sa_approver'))}</span>
        <select id="tm-overseer" style="${window.RV_FLD||ST_INPUT}">${opts(u.overseerId,i18t('ov_nobody'))}</select></label>
      <label style="display:block"><span style="${window.RV_LBL||''}">${esc(i18t('sa_backup'))}</span>
        <select id="tm-sa-backup" style="${window.RV_FLD||ST_INPUT}">${opts(r.backupId,i18t('sa_backup_none'))}</select></label>
    </div>
    <div style="margin-top:var(--s-2)"><span style="${window.RV_LBL||''}">${esc(i18t('sa_applies'))}</span>
      <label class="st-toggle" style="margin-bottom:var(--s-1)"><input id="tm-sa-lead" type="checkbox"${r.lead?' checked':''}/>
        <span><span class="st-role-name">${esc(i18t('sa_when_lead'))}</span></span></label>
      <label class="st-toggle"><input id="tm-sa-sign" type="checkbox"${r.sign?' checked':''}/>
        <span><span class="st-role-name">${esc(i18t('sa_when_sign'))}</span></span></label>
    </div>
    <p class="st-note" id="tm-ov-says" style="margin-top:var(--s-2)"></p>
  </section>`;
}
function stOverseerWire(u){
  const says=document.getElementById('tm-ov-says');
  if(!says) return;
  const who=(u&&u.name)||i18t('sc_this_person');
  const users=()=>((typeof getUsers==='function'?getUsers():[])||[]);
  const nameOf=id=>{ const x=users().find(p=>String(p.id)===String(id)); return x?(x.name||x.email):''; };
  const segs=[...document.querySelectorAll('[data-sa-set]')];
  const paint=()=>{
    const r=stOverseerRead()||{};
    const appr=nameOf(r.overseerId), back=nameOf(r.overseerBackupId);
    if(r.overseerOn!=='always'){ says.textContent=i18t('sa_says_off',{who}); return; }
    if(!appr){ says.textContent=i18t('sa_says_no_approver'); return; }
    const lead=/lead/.test(r.overseerWhen||''), sign=/sign/.test(r.overseerWhen||'');
    says.textContent=i18t(lead&&sign?'sa_says_on':lead?'sa_says_on_lead':'sa_says_on_sign',{who,approver:appr})
      +(back?' '+i18t('sa_says_backup',{backup:back,approver:appr}):'');
  };
  segs.forEach(b=>b.addEventListener('click',()=>{
    segs.forEach(x=>{ const on=x===b; x.classList.toggle('on',on); x.setAttribute('aria-pressed',on?'true':'false'); });
    paint(); }));
  ['tm-overseer','tm-sa-backup','tm-sa-lead','tm-sa-sign'].forEach(id=>document.getElementById(id)?.addEventListener('change',paint));
  paint();
}
/* Reads the section back into the four fields the record holds. Undefined
   where the section is not drawn, so an untouched drawer sends nothing. */
function stOverseerRead(){
  const sel=document.getElementById('tm-overseer');
  if(!sel) return undefined;
  const on=document.querySelector('[data-sa-set].on');
  const lead=!!(document.getElementById('tm-sa-lead')||{}).checked;
  const sign=!!(document.getElementById('tm-sa-sign')||{}).checked;
  return { overseerId: sel.value||null,
    overseerOn: on ? on.getAttribute('data-sa-set') : 'off',
    overseerBackupId: (document.getElementById('tm-sa-backup')||{}).value||null,
    overseerWhen: [lead?'lead':'', sign?'sign':''].filter(Boolean).join(',') };
}
/* What a Save would change, measured against what the person's rule READS
   today — so a drawer opened and saved without a touch sends nothing, and a
   person nobody has answered for keeps reading the old switch. Returns
   {patch} or {refuse}. */
function stOverseerPatch(target, read){
  if(!read) return { patch:{} };
  if(read.overseerOn==='always' && !read.overseerId) return { refuse:i18t('sa_need_approver') };
  if(read.overseerOn==='always' && !read.overseerWhen) return { refuse:i18t('sa_need_when') };
  if(read.overseerBackupId && read.overseerBackupId===read.overseerId) return { refuse:i18t('sa_backup_same') };
  const now=target ? stApprovalRuleOf(target) : { on:false, backupId:'', lead:true, sign:true };
  const patch={};
  if(String(read.overseerId||'')!==String((target&&target.overseerId)||'')) patch.overseerId=read.overseerId;
  if((read.overseerOn==='always')!==!!now.on || (target && target.overseerOn==null && patch.overseerId!==undefined))
    patch.overseerOn=read.overseerOn;
  if(String(read.overseerBackupId||'')!==String((target&&target.overseerBackupId)||'')) patch.overseerBackupId=read.overseerBackupId;
  const whenNow=[now.lead?'lead':'', now.sign?'sign':''].filter(Boolean).join(',');
  if(read.overseerWhen!==whenNow) patch.overseerWhen=read.overseerWhen;
  return { patch };
}

/* ---- ONE DRAWER, WHETHER YOU ARE ADDING OR EDITING ----
   Adding re-houses the EXISTING creation flow exactly — temp password,
   mustChangePassword on the server, an explicit folder answer whose first
   option carries no value, Viewer by default, POST /api/users. There is no
   invite-token flow in this product and this drawer does not invent one. */
/* ============================================================
   BUSINESS ROLES (owner picked "A role at the top of the drawer — the SAP
   way", 17 Oct 2026; piece 6 of the sensitive contracts and governance plan)
   ============================================================
   A role is a NAME FOR RIGHTS HATI ALREADY HAS (Editor or Viewer, sees values,
   a signing limit, the streams, checked before sending, new paper, re-file,
   hold). The person's drawer opens with it: choosing a role fills the drawer's
   own controls, the drawer says what the role brings and lists this person's
   extras on top, and the drawer's Save writes every right through the routes
   it always used — the server checks the right, never the role's name. The
   roles are kept on Company › People › Roles; a change there says who it
   reaches before it saves, then moves only the rights a holder had FROM the
   role (an extra stays an extra). Admins hold every right by rank and no role.
   On the server only. */
const BZ_ALL=['sys','values','cap','streams','checked','paper','refile','hold'];
const stBzKeysFor=sys=>sys==='legal'?BZ_ALL:['sys','values','streams'];
const stBzOn=()=>stApiOnly()&&stIsAdmin();
const stBzBook=()=>{ const b=state.bizRoles; return (b&&Array.isArray(b.roles))?{ roles:b.roles, of:b.of||{} }:{ roles:[], of:{} }; };
const stBzRole=id=>stBzBook().roles.find(r=>r.id===String(id||''))||null;
const stBzOf=u=>u?stBzRole(stBzBook().of[String(u.id)]):null;
const stBzHolders=id=>stUsers().filter(u=>u.role!=='admin'&&stBzBook().of[String(u.id)]===String(id));
/* a person's rights as the record holds them, in a role's shape */
function stBzRightsOf(u){
  const cap=(typeof signCapOf==='function')?signCapOf(u):{ answered:false, limit:null };
  const fa=(((state.settings||{}).folderAccess)||{})[u.id];
  return { sys:u.role==='legal'?'legal':'viewer', values:!!stValuesOn(u), cap:cap.answered?(cap.limit==null?'none':Number(cap.limit)):null,
    streams:Array.isArray(fa)&&fa.length?[...fa].map(String).sort():'all', checked:!!((typeof reviewChecked==='function')&&reviewChecked(u)),
    paper:!!stNewPaperOn(u), refile:!!stReFileOn(u), hold:!!stHoldOn(u) };
}
const stBzSame=(k,a,b)=>k==='streams'?JSON.stringify(a)===JSON.stringify(b):a===b;
/* more than the role gives (an extra) or less (held back) */
function stBzMore(k,mine,role){
  if(k==='sys') return mine==='legal';
  if(k==='streams') return mine==='all'||(role!=='all'&&mine.length>role.length);
  if(k==='cap') return mine==='none'||(role!=='none'&&role!=null&&mine!=null&&Number(mine)>Number(role));
  return mine===true;
}
const stBzStreamName=id=>(window.FOLDERS&&FOLDERS[id]&&FOLDERS[id].name)||id;
const stBzMoney=v=>(typeof fmtMoneyShortIn==='function')?fmtMoneyShortIn(Number(v),(typeof jxCurrency==='function')?jxCurrency():undefined):String(v);
function stBzFact(k,v){
  switch(k){
    case 'sys': return i18t(v==='legal'?'bz_f_editor':'bz_f_viewer');
    case 'values': return i18t(v?'bz_f_values':'bz_f_novalues');
    case 'cap': return v==null?i18t('bz_f_cap_unset'):v==='none'?i18t('bz_f_cap_none'):i18t('bz_f_cap',{v:stBzMoney(v)});
    case 'streams': return v==='all'?i18t('bz_f_streams_all'):i18t('bz_f_streams',{list:v.map(stBzStreamName).join(' · ')});
    case 'checked': return i18t(v?'bz_f_checked':'bz_f_unchecked');
    case 'paper': return i18t(v?'bz_f_paper':'bz_f_nopaper');
    case 'refile': return i18t(v?'bz_f_refile':'bz_f_norefile');
    case 'hold': return i18t(v?'bz_f_hold':'bz_f_nohold');
  }
  return '';
}
/* what a role brings, as a list: the four facts every role has, then the
   grants it gives (a grant it does not give is not listed) */
function stBzBrings(r){
  return stBzKeysFor(r.sys).filter(k=>!['checked','paper','refile','hold'].includes(k)||r[k]===true).map(k=>stBzFact(k,r[k]));
}
const stBzSummary=r=>stBzBrings(r).join(' · ');

/* ---- THE PERSON'S DRAWER: THE ROLE AT THE TOP ---- */
let _stBzDraft=null;
/* the person as the drawer should draw them once a role is chosen: the role's
   rights in place of theirs, what was typed kept; the record is untouched
   until Save */
function stBzDressed(u,d){
  const x={ ...u, _bz:true };
  ['name','title','email'].forEach(k=>{ if(d[k]!==undefined) x[k]=d[k]; });
  const r=d.rights; if(!r||u.role==='admin') return x;
  x.role=r.sys; x.canViewValues=r.values;
  if(r.sys==='legal'){ x.signCap=r.cap; x.reviewChecked=r.checked; x.newPaper=r.paper; x.reFile=r.refile; x.holdContracts=r.hold; }
  x._streams=r.streams;
  return x;
}
function stBzSectionHtml(u,isNew){
  if(!stBzOn()) return '';
  const book=stBzBook();
  const h=`<h3 class="st-sec-h">${esc(i18t('bz_h'))}</h3>`;
  const door=`<button type="button" class="st-ps-link" data-st-page="roles">${esc(i18t('bz_go_roles'))} ›</button>`;
  if(!isNew&&u.role==='admin') return `<section class="st-sec st-bz">${h}<p class="st-note">${esc(i18t('bz_admin'))}</p></section>`;
  if(!book.roles.length) return `<section class="st-sec st-bz">${h}<p class="st-note">${esc(i18t('bz_none_yet'))} ${door}</p></section>`;
  const cur=(u._bzRole!==undefined)?u._bzRole:(isNew?'':(book.of[String(u.id)]||''));
  const r=stBzRole(cur);
  return `<section class="st-sec st-bz">${h}
    <select id="tm-bz" style="${window.RV_FLD||ST_INPUT}" aria-label="${esc(i18t('bz_h'))}">
      <option value=""${cur?'':' selected'}>${esc(i18t('bz_none'))}</option>
      ${book.roles.map(x=>`<option value="${PB_ATTR(x.id)}"${x.id===cur?' selected':''}>${esc(x.name)}</option>`).join('')}
    </select>
    <span class="st-note st-bz-where">${esc(i18t('bz_where'))} ${door}</span>
    ${r?`<p class="st-ps-l">${esc(i18t('bz_brings',{role:r.name}))}</p><ul class="st-bz-brings">${stBzBrings(r).map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}
    <div id="tm-bz-extras" class="st-bz-extras"></div>
  </section>`;
}
/* the rights the drawer's controls hold right now, in a role's shape */
function stBzDrawerRights(u){
  const was=stBzRightsOf(u);
  const box=id=>document.getElementById(id);
  const sysV=(box('tm-role')||{}).value;
  const out={ ...was, sys:sysV==='legal'?'legal':sysV==='viewer'?'viewer':was.sys };
  if(stGrantBox('tm-values')) out.values=!!box('tm-values').checked;
  if(stGrantBox('tm-paper')) out.paper=!!box('tm-paper').checked;
  if(stGrantBox('tm-refile')) out.refile=!!box('tm-refile').checked;
  if(stGrantBox('tm-hold')) out.hold=!!box('tm-hold').checked;
  if(box('tm-rv-checked')) out.checked=!!box('tm-rv-checked').checked;
  const cap=(typeof stSigningRead==='function')?stSigningRead():undefined;
  if(cap!==undefined&&!(typeof cap==='number'&&Number.isNaN(cap))) out.cap=cap;
  const acc=box('tm-access');
  if(acc&&!acc.disabled&&acc.value){
    out.streams=acc.value==='*'?'all':[...document.querySelectorAll('[data-tm-folder]')].filter(c=>c.checked).map(c=>c.getAttribute('data-tm-folder')).sort();
    if(Array.isArray(out.streams)&&!out.streams.length) out.streams='all';
  }
  return out;
}
/* the extras, live: every right the drawer holds that the role does not bring
   (or brings and this person is held back from) */
function stBzExtrasPaint(u){
  const host=document.getElementById('tm-bz-extras'); if(!host) return;
  const sel=document.getElementById('tm-bz'), r=sel?stBzRole(sel.value):null;
  if(!r){ host.innerHTML=''; const back=document.getElementById('tm-bz-back'); if(back) back.hidden=true; return; }
  const mine=stBzDrawerRights(u), first=String(u.name||u.email||'').split(' ')[0]||i18t('sc_this_person');
  const keys=stBzKeysFor(mine.sys==='legal'||r.sys==='legal'?'legal':'viewer');
  const diff=keys.filter(k=>!stBzSame(k,mine[k],r[k]));
  const back=document.getElementById('tm-bz-back'); if(back) back.hidden=!diff.length;
  host.innerHTML=diff.length
    ? `<p class="st-ps-l">${esc(i18t('bz_extras',{who:first,role:r.name}))}</p><ul class="st-bz-list">${diff.map(k=>{
        const more=stBzMore(k,mine[k],r[k]);
        return `<li data-bz-extra="${k}"><span>${esc(stBzFact(k,mine[k]))}</span><span class="st-bz-tag${more?' is-more':''}">${esc(more?i18t('bz_extra'):i18t('bz_less',{role:r.name}))}</span></li>`; }).join('')}</ul>`
    : `<p class="st-note">${esc(i18t('bz_exact',{who:first,role:r.name}))}</p>`;
}
function stBzWire(u,isNew){
  const sel=document.getElementById('tm-bz'); if(!sel) return;
  const paint=()=>stBzExtrasPaint(u);
  /* a role chosen — or "Back to <name>'s role" pressed — the drawer is drawn
     again on the role's rights; the record moves only on Save */
  const toRole=()=>{
    const r=stBzRole(sel.value);
    const typed=k=>{ const el=document.getElementById(k); return el?el.value:undefined; };
    if(!r){ paint(); return; }
    _stBzDraft={ id:isNew?'new':u.id, roleId:r.id, rights:{ ...r },
      name:typed('tm-name'), title:typed('tm-title'), email:typed('tm-email'), pass:typed('tm-pass') };
    settingsPersonDrawer(isNew?'new':u.id);
  };
  sel.addEventListener('change',toRole);
  document.getElementById('tm-bz-back')?.addEventListener('click',toRole);
  document.querySelectorAll('#st-dbody input, #st-dbody select').forEach(el=>{ if(el!==sel){ el.addEventListener('change',paint); el.addEventListener('input',paint); } });
  paint();
}
/* the role's name on the person, after the rights were saved */
async function stBzSaveHolder(uid){
  const sel=document.getElementById('tm-bz'); if(!sel||!uid||!stBzOn()) return true;
  const want=sel.value||'', was=stBzBook().of[String(uid)]||'';
  if(want===was) return true;
  try{ state.bizRoles=await api('business-roles/holder','PUT',{ userId:uid, roleId:want||null }); return true; }
  catch(e){ stDrawerRefuse(e.message); return false; }
}
/* the grants a new person's form has no box for, from the role chosen */
function stBzNewGrants(){
  const sel=document.getElementById('tm-bz'), r=sel?stBzRole(sel.value):null;
  if(!r) return {};
  return r.sys==='legal' ? { canViewValues:r.values, newPaper:r.paper, reFile:r.refile, holdContracts:r.hold } : { canViewValues:r.values };
}

/* ---- A NEW PERSON'S GRANTS ON THE FORM (owner, 20 Oct 2026: "some of these
   access questions are not available until you add them which makes no
   sense") ----
   The same four rows the drawer draws for a member, drawn for a new person
   too. The role is chosen on this form, so each row says which roles it
   belongs to (data-tm-for) and stGrantRowsSync shows it as the role moves:
   values for anyone but an admin; new paper, re-filing and holds for an
   editor, an admin reading the sentence that holds them by rank. A hidden row
   is never read (stGrantBox), so a viewer is never sent a grant the server
   refuses. The ticks start on the product's own readings, which a business
   role chosen above has already dressed. */
function stNewGrantRowsHtml(u){
  const tick=(id,on,onK,offK,noteK)=>`<label class="st-toggle" style="margin-top:10px">
        <input id="${id}" type="checkbox" ${on?'checked':''}/>
        <span><span class="st-role-name">${esc(i18t(on?onK:offK))}</span>
        <span class="st-note">${esc(i18t(noteK))}</span></span>
      </label>`;
  const row=(forRoles,inner)=>`<div data-tm-for="${forRoles}"${forRoles.split(' ').includes(u.role)?'':' hidden'}>${inner}</div>`;
  const note=k=>`<p class="st-note" style="margin-top:10px">${esc(i18t(k))}</p>`;
  return row('viewer legal',tick('tm-values',stValuesOn(u),'st_values_on','st_values_off','st_values_note'))
    +row('legal',tick('tm-paper',stNewPaperOn(u),'st_paper_on','st_paper_off','st_paper_note'))
    +row('admin',note('st_paper_admin'))
    +row('legal',tick('tm-refile',stReFileOn(u),'st_refile_on','st_refile_off','st_refile_note'))
    +row('admin',note('st_refile_admin'))
    +row('legal',tick('tm-hold',stHoldOn(u),'st_hold_on','st_hold_off','st_hold_note'))
    +row('admin',note('st_hold_admin'));
}
function stGrantRowsSync(role){
  document.querySelectorAll('#st-dbody [data-tm-for]').forEach(el=>{
    el.hidden=!el.getAttribute('data-tm-for').split(' ').includes(role); });
}
/* a grant's box only where its row is shown */
function stGrantBox(id){
  const b=document.getElementById(id);
  return (b&&!b.closest('[hidden]'))?b:null;
}
/* A TICK SAYS WHICH WAY IT IS SET, AS IT IS PRESSED: the row's words were
   painted once, so "May not create new paper" stayed beside a ticked box */
const ST_GRANT_WORDS={ 'tm-values':['st_values_on','st_values_off'], 'tm-paper':['st_paper_on','st_paper_off'],
  'tm-refile':['st_refile_on','st_refile_off'], 'tm-hold':['st_hold_on','st_hold_off'] };
function stGrantWordsWire(){
  Object.keys(ST_GRANT_WORDS).forEach(id=>{
    const b=document.getElementById(id); if(!b) return;
    b.addEventListener('change',()=>{
      const nm=b.closest('label')?.querySelector('.st-role-name');
      if(nm) nm.textContent=i18t(ST_GRANT_WORDS[id][b.checked?0:1]);
    });
  });
}

/* ---- COMPANY › PEOPLE › ROLES ---- */
function stRolesPageHtml(){
  const book=stBzBook(), ic=n=>(typeof icon==='function')?icon(n,'w-3.5 h-3.5'):'';
  const rows=book.roles.map(r=>{ const n=stBzHolders(r.id).length;
    return `<tr class="st-person" data-st-panel="role:${PB_ATTR(r.id)}">
      <td><button type="button" class="st-person-open" data-st-panel="role:${PB_ATTR(r.id)}"><span class="st-person-id"><span class="st-person-name">${esc(r.name)}</span></span></button></td>
      <td class="st-bz-sum">${esc(stBzSummary(r))}</td>
      <td class="st-bz-n">${esc(i18tn('bz_people',n,{n}))}</td>
      <td class="st-person-go" aria-hidden="true">${ic('chevR')}</td></tr>`; }).join('');
  return `<div class="st-pg" data-st-pg="roles">
    ${stPageHeadHtml(i18t('st_pg_roles'), i18t('bz_page_sub'), `<button type="button" class="ui-btn ui-btn-primary" data-st-panel="role:new">${ic('plus')} ${esc(i18t('bz_new'))}</button>`)}
    <section class="st-people-card">${book.roles.length
      ? `<table class="st-people-table st-bz-table"><colgroup><col style="width:22%"><col><col style="width:14%"><col style="width:44px"></colgroup>
          <thead><tr><th>${esc(i18t('bz_col_role'))}</th><th>${esc(i18t('bz_col_brings'))}</th><th>${esc(i18t('bz_col_people'))}</th><th></th></tr></thead>
          <tbody class="st-people">${rows}</tbody></table>`
      : `<p class="st-note st-bz-empty">${esc(i18t('bz_page_empty'))}</p>`}</section>
    <p class="st-note st-pg-foot">${esc(i18t('bz_page_foot'))}</p>
  </div>`;
}
const BZ_BLANK={ id:'', name:'', sys:'legal', values:true, cap:null, streams:'all', checked:false, paper:false, refile:false, hold:false };
function stBzRoleDrawer(id){
  const isNew=id==='new';
  const r=isNew?{ ...BZ_BLANK }:stBzRole(id); if(!r) return null;
  const tick=(k,label,sub)=>`<label class="st-toggle st-bz-tick" data-bz-edit="${k!=='values'?'1':'0'}"><input type="checkbox" id="bz-${k}"${r[k]?' checked':''}/>
    <span><span class="st-role-name">${esc(label)}</span>${sub?`<span class="st-note">${esc(sub)}</span>`:''}</span></label>`;
  const radio=(k,label,sub)=>`<label class="st-ps-radio${r.sys===k?' is-on':''}"><input type="radio" name="bz-sys" value="${k}"${r.sys===k?' checked':''}/>
    <span><span class="st-role-name">${esc(label)}</span><span class="st-note">${esc(sub)}</span></span></label>`;
  const folders=Object.values(window.FOLDERS||{}).filter(f=>!(typeof streamIsPrivate==='function'&&streamIsPrivate(f.id)));
  const set=new Set(Array.isArray(r.streams)?r.streams:[]);
  const body=`<label class="st-tr-f"><span class="st-ps-l">${esc(i18t('bz_f_name'))}</span><input id="bz-name" type="text" value="${PB_ATTR(r.name)}" maxlength="60" style="${window.RV_FLD||ST_INPUT}" placeholder="${esc(i18t('bz_name_ph'))}"/></label>
    <p class="st-ps-l">${esc(i18t('bz_f_may'))}</p>
    ${radio('viewer',i18t('set_role_viewer'),i18t('st_role_viewer_desc'))}${radio('legal',i18t('set_role_legal'),i18t('st_role_legal_desc'))}
    ${tick('values',i18t('bz_f_values'),i18t('st_values_note'))}
    <div class="st-bz-edits">
      ${tick('checked',i18t('bz_f_checked'),'')}${tick('paper',i18t('bz_f_paper'),'')}${tick('refile',i18t('bz_f_refile'),'')}${tick('hold',i18t('bz_f_hold'),'')}
      <p class="st-ps-l">${esc(i18t('sc_section'))}</p>
      <label class="st-toggle"><input id="bz-cap-none" type="checkbox"${r.cap==='none'?' checked':''}/><span><span class="st-role-name">${esc(i18t('sc_no_limit'))}</span></span></label>
      <input id="bz-cap" type="number" min="0" step="1000" value="${r.cap!=null&&r.cap!=='none'?String(r.cap):''}" style="${window.RV_FLD||ST_INPUT}" aria-label="${esc(i18t('sc_section'))}"${r.cap==='none'?' disabled':''}/>
    </div>
    <p class="st-ps-l">${esc(i18t('st_sec_folders'))}</p>
    <select id="bz-streams" style="${window.RV_FLD||ST_INPUT}"><option value="*"${r.streams==='all'?' selected':''}>${esc(i18t('st_folders_all'))}</option><option value="pick"${r.streams==='all'?'':' selected'}>${esc(i18t('st_folders_pick'))}</option></select>
    <div id="bz-stream-list" class="st-bz-streams" style="display:${r.streams==='all'?'none':'grid'}">${folders.map(f=>`<label><input type="checkbox" data-bz-stream="${PB_ATTR(f.id)}"${set.has(f.id)?' checked':''}/> <span>${esc(f.name)}</span></label>`).join('')}</div>
    <div id="bz-who" class="st-bz-who"></div>
    ${isNew?'':`<div class="st-danger"><button type="button" id="bz-delete" style="${ST_BTN_DANGER}">${esc(i18t('bz_delete'))}</button></div>`}`;
  return { title:isNew?i18t('bz_new'):r.name, sub:i18t('bz_drawer_sub'), foot:'save', body,
    wire(){ stBzRoleWire(isNew?null:r); }, save:()=>stBzRoleSave(isNew?null:r) };
}
/* the role as the drawer's controls hold it now */
function stBzRoleRead(was){
  const box=id=>document.getElementById(id);
  const sys=((document.querySelector('input[name="bz-sys"]:checked')||{}).value)==='viewer'?'viewer':'legal';
  const capNone=box('bz-cap-none')&&box('bz-cap-none').checked, capRaw=String((box('bz-cap')||{}).value||'').trim();
  const pick=(box('bz-streams')||{}).value==='pick';
  const streams=pick?[...document.querySelectorAll('[data-bz-stream]')].filter(c=>c.checked).map(c=>c.getAttribute('data-bz-stream')).sort():'all';
  return { id:(was&&was.id)||'', name:String((box('bz-name')||{}).value||'').trim(), sys, values:!!(box('bz-values')&&box('bz-values').checked),
    cap:sys==='viewer'?null:capNone?'none':capRaw===''?null:Number(capRaw), streams:Array.isArray(streams)&&!streams.length?'all':streams,
    checked:sys==='legal'&&!!(box('bz-checked')&&box('bz-checked').checked), paper:sys==='legal'&&!!(box('bz-paper')&&box('bz-paper').checked),
    refile:sys==='legal'&&!!(box('bz-refile')&&box('bz-refile').checked), hold:sys==='legal'&&!!(box('bz-hold')&&box('bz-hold').checked) };
}
/* WHO A CHANGE REACHES, said before Save: each holder, and the rights of
   theirs that would move (only the ones they hold FROM the role) */
function stBzMoves(was,now,u){
  const mine=stBzRightsOf(u);
  return stBzKeysFor(now.sys).filter(k=>stBzSame(k,mine[k],(was||{})[k])&&!stBzSame(k,(was||{})[k],now[k]));
}
function stBzWhoPaint(was){
  const host=document.getElementById('bz-who'); if(!host) return;
  if(!was){ host.innerHTML=`<p class="st-note">${esc(i18t('bz_who_new'))}</p>`; return; }
  const now=stBzRoleRead(was), hs=stBzHolders(was.id);
  if(!hs.length){ host.innerHTML=`<p class="st-ps-l">${esc(i18t('bz_who_h'))}</p><p class="st-note">${esc(i18t('bz_who_none'))}</p>`; return; }
  const rows=hs.map(u=>{ const m=stBzMoves(was,now,u);
    return `<li data-bz-holder="${PB_ATTR(u.id)}"><span class="st-ps-who">${esc(stNameOf(u))}</span><span class="st-note">${esc(m.length?i18tn('bz_who_moves',m.length,{n:m.length}):i18t('bz_who_same'))}</span></li>`; }).join('');
  const reach=hs.filter(u=>stBzMoves(was,now,u).length).length;
  host.innerHTML=`<p class="st-ps-l">${esc(i18t('bz_who_h'))} <span class="st-ps-q">${esc(i18tn('bz_people',hs.length,{n:hs.length}))}</span></p>
    <ul class="st-bz-list">${rows}</ul>
    <p class="st-note${reach?' st-amber':''}" id="bz-who-says">${esc(reach?i18tn('bz_who_reach',reach,{n:reach}):i18t('bz_who_nochange'))}</p>`;
}
function stBzRoleWire(was){
  const sync=()=>{
    const sys=((document.querySelector('input[name="bz-sys"]:checked')||{}).value);
    document.querySelectorAll('input[name="bz-sys"]').forEach(x=>x.closest('.st-ps-radio')?.classList.toggle('is-on',x.checked));
    const edits=document.querySelector('.st-bz-edits'); if(edits) edits.hidden=sys==='viewer';
    const none=document.getElementById('bz-cap-none'), cap=document.getElementById('bz-cap'); if(none&&cap) cap.disabled=none.checked;
    const list=document.getElementById('bz-stream-list'); if(list) list.style.display=(document.getElementById('bz-streams')||{}).value==='pick'?'grid':'none';
    stBzWhoPaint(was);
  };
  document.querySelectorAll('#st-dbody input, #st-dbody select').forEach(el=>{ el.addEventListener('change',sync); el.addEventListener('input',sync); });
  document.getElementById('bz-delete')?.addEventListener('click',()=>stBzRoleDelete(was));
  sync();
}
async function stBzPut(roles){ state.bizRoles=await api('business-roles','PUT',{ roles }); }
async function stBzRoleSave(was){
  stDrawerClearRefusal();
  const now=stBzRoleRead(was);
  if(!now.name){ stDrawerRefuse(i18t('bz_name_needed')); return; }
  if(now.cap!=null&&now.cap!=='none'&&!(Number.isFinite(now.cap)&&now.cap>=0)){ stDrawerRefuse(i18t('sc_bad_number')); return; }
  if(Array.isArray(now.streams)&&!now.streams.length){ stDrawerRefuse(i18t('set_pick_one_stream')); return; }
  if(!now.id) now.id='bz'+Date.now().toString(36);
  const book=stBzBook();
  const roles=was?book.roles.map(r=>r.id===was.id?now:r):book.roles.concat([now]);
  /* the moves are counted on the role as it stood, before anything is saved */
  const plan=was?stBzHolders(was.id).map(u=>({ u, keys:stBzMoves(was,now,u) })).filter(p=>p.keys.length):[];
  try{ await stBzPut(roles); }catch(e){ stDrawerRefuse(e.message); return; }
  const failed=[];
  for(const p of plan){
    try{
      if(p.keys.includes('sys')){ const r=await api('users/'+p.u.id,'PATCH',{ role:now.sys }); if(r&&r.user) Object.assign(p.u,r.user); else p.u.role=now.sys; }
      const body={};
      for(const k of p.keys){
        if(k==='values') body.canViewValues=now.values;
        else if(k==='cap') body.signCap=now.cap;
        else if(k==='checked') body.reviewChecked=now.checked;
        else if(k==='paper') body.newPaper=now.paper;
        else if(k==='refile') body.reFile=now.refile;
        else if(k==='hold') body.holdContracts=now.hold;
      }
      if(Object.keys(body).length){ const r=await api('users/'+p.u.id,'PATCH',body); if(r&&r.user) Object.assign(p.u,r.user); }
      if(p.keys.includes('streams')) await settingsWriteFolderAccess(p.u.id, now.streams==='all'?null:now.streams);
    }catch(e){ failed.push(stNameOf(p.u)+': '+e.message); }
  }
  if(failed.length){ stDrawerRefuse(i18t('bz_apply_failed',{list:failed.join(' · ')})); renderTeam(); return; }
  toast(plan.length?i18tn('bz_saved_moved',plan.length,{role:now.name,n:plan.length}):i18t('bz_saved',{role:now.name}),'ok');
  stDrawerClose(); renderTeam();
}
async function stBzRoleDelete(was){
  if(!was) return;
  const n=stBzHolders(was.id).length;
  if(!await confirmDialog({ title:i18t('bz_delete_q',{role:was.name}), message:n?i18tn('bz_delete_msg',n,{n}):i18t('bz_delete_msg_none'),
    confirmLabel:i18t('bz_delete'), danger:true })) return;
  try{ await stBzPut(stBzBook().roles.filter(r=>r.id!==was.id)); }catch(e){ stDrawerRefuse(e.message); return; }
  toast(i18t('bz_deleted',{role:was.name}),'ok');
  stDrawerClose(); renderTeam();
}

function settingsPersonDrawer(idOrNew){
  const isNew = idOrNew==='new';
  const me=currentUser()||{};
  let u = isNew ? { id:null, name:'', email:'', title:'', role:'viewer' }
                  : (getUsers()||[]).find(x=>x.id===idOrNew);
  if(!u) return;
  /* A BUSINESS ROLE JUST CHOSEN (piece 6): the drawer drawn again on the
     role's rights, what was typed kept; the record moves only on Save */
  const bzDraft=(_stBzDraft&&_stBzDraft.id===(isNew?'new':u.id))?_stBzDraft:null; _stBzDraft=null;
  if(bzDraft){ u=stBzDressed(u,bzDraft); u._bzRole=bzDraft.roleId; }
  _stOpen='person:'+(isNew?'new':u.id);
  const isMe = !isNew && u.id===me.id;
  const acc = u._streams!==undefined ? { all:u._streams==='all' } : (isNew ? null : stAccessOf(u));
  const set = new Set(u._streams!==undefined ? (Array.isArray(u._streams)?u._streams:[]) : (!isNew && !acc.all ? (((state.settings||{}).folderAccess)||{})[u.id] : []));
  const folders=Object.values(FOLDERS);
  /* A PRIVATE FOLDER IS NOT TICKED HERE (17 Oct 2026): who may open it is set
     on its own page, and this drawer says whether it names them (stPsPersonHtml) */
  const tickFolders=folders.filter(f=>!(typeof streamIsPrivate==='function'&&streamIsPrivate(f.id)));
  /* SAFEST FIRST, AND THAT IS A SAFETY PROPERTY RATHER THAN A PREFERENCE. The
     old form opened on "Editor — edit & sign", so an admin who filled in a name
     and an email and never looked at the dropdown had handed over the right to
     redline and to SIGN (f149). The list therefore reads from least power to
     most, and the value the control carries when nobody has answered is the
     first one in it. */
  const ROLES=[['viewer',i18t('set_role_viewer'),i18t('st_role_viewer_desc')],
               ['legal',i18t('set_role_legal'),i18t('st_role_legal_desc')],
               ['admin',i18t('set_role_admin'),i18t('st_role_admin_desc')]];
  const sec=(n,label,inner)=>`<section class="st-sec">
    <h3 class="st-sec-h"><span class="st-sec-n">${n}</span>${esc(label)}</h3>${inner}</section>`;
  const fld=(id,label,note,type,value)=>`<label style="display:block;margin-bottom:10px">
      <span style="${window.RV_LBL||''}">${esc(label)}</span>
      <input id="${id}" type="${type||'text'}" value="${PB_ATTR(value||'')}" style="${window.RV_FLD||ST_INPUT}"/>
      ${note?`<span class="st-note">${esc(note)}</span>`:''}</label>`;
  const body=`
    ${isNew?'':stPersonSumHtml(u)}
    ${stBzSectionHtml(u,isNew)}
    ${sec(1,i18t('st_sec_who'),
      `<div class="st-row2">${fld('tm-name',i18t('st_f_name'),'','text',u.name)}${fld('tm-title',i18t('st_f_title'),'','text',u.title).replace('<input ','<input title="'+PB_ATTR(i18t('st_f_title_note'))+'" ')}</div>`
      +fld('tm-email',i18t('st_f_email'),'','email',u.email)
      +(isNew?`<label style="display:block;margin-bottom:var(--s-1)">
          <span style="${window.RV_LBL||''}">${esc(i18t('st_f_temp_pass'))}</span>
          <input id="tm-pass" type="password" style="${window.RV_FLD||ST_INPUT}"/>
          <span class="st-note">${esc(i18t('st_f_temp_pass_note'))}</span></label>`:'')
      +(''/* ---- THE LOST-PHONE RESCUE (W2-5a) ----
             The server grant has existed since WO-6 (PATCH clearTwoStep,
             refused on yourself); this is its button. A STATEMENT first —
             whether this person is protected — because an admin looking at a
             locked-out colleague needs to know that before anything else, and
             the button appears only where pressing it would do something.

             NEVER ON YOURSELF: your own lock comes off with a current code on
             your account page, not with admin rank. The server refuses it too;
             this is the sign, that is the wall. */)
      +((!isNew && isAdmin() && !isMe && API_MODE())?`
        <div style="display:flex;align-items:center;gap:10px;margin-top:var(--s-1)">
          <span class="st-note" style="flex:1;margin:0">${esc(u.twoStep?i18t('ts_person_on'):i18t('ts_person_off'))}</span>
          ${u.twoStep?`<button id="tm-clear-2fa" data-uid="${PB_ATTR(u.id)}" style="${ST_BTN_SM};flex:none">${esc(i18t('ts_clear_btn'))}</button>`:''}
        </div>`:''))}

    ${sec(2,i18t('st_sec_may'),`
      ${''/* KEPT AS A LIST, not the drawing's three-way switch (SAP pop-ups,
             10 Oct 2026): f149's ruling — each role is explained where it is
             chosen — outranks the drawing. */}
      <div class="st-roles">${ROLES.map(([k,label,desc])=>`
        <label class="st-role"${(isMe&&!isNew)?' data-locked="1"':''}>
          <input type="radio" name="tm-role-r" value="${k}" ${u.role===k?'checked':''}${(isMe&&!isNew)?' disabled':''}/>
          <span><span class="st-role-name">${esc(label)}</span><span class="st-note">${esc(desc)}</span></span>
        </label>`).join('')}</div>
      ${''/* THE ROLE IS ONE VALUE WITH TWO FACES. The radios are what a person
             reads — three keys with a line each saying what the key costs. The
             select is what the SAVE reads, and it is kept because the role a
             form opens on is a safety property this product has already been
             bitten by (f149: the form opened on Editor, so the quietest path
             through it handed over the right to redline and to sign). One
             stored value, one default, and the two faces write to each other —
             a radio press sets the select, and setting the select repaints the
             radios — so neither can be the one that is true. */}
      <select id="tm-role" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none" tabindex="-1" aria-hidden="true">
        ${ROLES.map(([k,label])=>`<option value="${k}"${u.role===k?' selected':''}>${esc(label)}</option>`).join('')}
      </select>
      ${(isMe&&!isNew)?`<div class="st-note">${esc(i18t('st_you_cannot_change_own_role'))}</div>`:''}
      ${(!isNew && isAdmin() && u.role!=='admin' && !isMe && API_MODE())?`
      <label class="st-toggle" style="margin-top:10px">
        <input id="tm-values" type="checkbox" ${stValuesOn(u)?'checked':''}/>
        <span><span class="st-role-name">${esc(stValuesOn(u)?i18t('st_values_on'):i18t('st_values_off'))}</span>
        <span class="st-note">${esc(i18t('st_values_note'))}</span></span>
      </label>`:''}
      ${''/* ---- WHO MAY MAKE NEW PAPER (Young ruled 18 Sep 2026) ----
             THE FIFTH PER-PERSON GRANT, drawn in the fourth one's clothes and
             under the same four conditions, because it is the same shape of
             fact: an admin's decision about somebody else, on a workspace that
             has a server to enforce it. A VIEWER is not offered it — a viewer
             may not edit at all, so a tick there would be a grant the product
             then ignores, and the server refuses it for the same reason.
             An ADMIN holds it by rank and the row says so rather than drawing
             a tick that cannot be untied. */}
      ${(!isNew && isAdmin() && !isMe && API_MODE() && u.role!=='viewer')?(
        u.role==='admin'
        ? `<p class="st-note" style="margin-top:10px">${esc(i18t('st_paper_admin'))}</p>`
        : `<label class="st-toggle" style="margin-top:10px">
        <input id="tm-paper" type="checkbox" ${stNewPaperOn(u)?'checked':''}/>
        <span><span class="st-role-name">${esc(stNewPaperOn(u)?i18t('st_paper_on'):i18t('st_paper_off'))}</span>
        <span class="st-note">${esc(i18t('st_paper_note'))}</span></span>
      </label>`):''}
      ${/* ---- AND WHO MAY MOVE A CONTRACT TO ANOTHER VALUE STREAM ----
             (the seventh repair, 18 Sep 2026.) The same shape, the same
             refusals and the same two roles that answer for themselves. Off by
             default, so the 14 Aug ruling stands until an admin gives it. */''}
      ${(!isNew && isAdmin() && !isMe && API_MODE() && u.role!=='viewer')?(
        u.role==='admin'
        ? `<p class="st-note" style="margin-top:10px">${esc(i18t('st_refile_admin'))}</p>`
        : `<label class="st-toggle" style="margin-top:10px">
        <input id="tm-refile" type="checkbox" ${stReFileOn(u)?'checked':''}/>
        <span><span class="st-role-name">${esc(stReFileOn(u)?i18t('st_refile_on'):i18t('st_refile_off'))}</span>
        <span class="st-note">${esc(i18t('st_refile_note'))}</span></span>
      </label>`):''}
      ${/* ---- AND WHO MAY FREEZE A CONTRACT FOR A DISPUTE (19 Sep 2026) ----
             The eighth grant and the third in this block. The owner asked for
             "Legal/Admin only" and was shown that HaTi's `legal` role IS the
             Editor — so that rule would have changed nothing — and chose the
             tick instead: a dispute is handled by one or two NAMED people. Off
             by default, so the deploy NARROWS the act. */''}
      ${(!isNew && isAdmin() && !isMe && API_MODE() && u.role!=='viewer')?(
        u.role==='admin'
        ? `<p class="st-note" style="margin-top:10px">${esc(i18t('st_hold_admin'))}</p>`
        : `<label class="st-toggle" style="margin-top:10px">
        <input id="tm-hold" type="checkbox" ${stHoldOn(u)?'checked':''}/>
        <span><span class="st-role-name">${esc(stHoldOn(u)?i18t('st_hold_on'):i18t('st_hold_off'))}</span>
        <span class="st-note">${esc(i18t('st_hold_note'))}</span></span>
      </label>`):''}
      ${(isNew && isAdmin() && API_MODE())?stNewGrantRowsHtml(u):''}`)}

    ${sec(3,i18t('st_sec_folders'),
      (u.role==='admin'&&!isNew)
      ? `<p class="st-note" id="tm-access-note">${esc(i18t(tickFolders.length<folders.length?'st_folders_all_locked_but':'st_folders_all_locked'))}</p>${stPsPersonHtml(u)}`
      : `<select id="tm-access" style="${window.RV_FLD||ST_INPUT}">
          ${isNew?`<option value="">${esc(i18t('set_choose_access'))}</option>`:''}
          <option value="*"${(acc&&acc.all)?' selected':''}>${esc(i18t('st_folders_all'))}</option>
          <option value="pick"${(acc&&!acc.all)?' selected':''}>${esc(i18t('st_folders_pick'))}</option>
        </select>
        <div id="tm-access-list" style="display:${(acc&&!acc.all)?'grid':'none'};grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-top:var(--s-2)">
          ${tickFolders.map(f=>`<label style="display:flex;align-items:center;gap:7px;padding:6px var(--s-2);border:1px solid var(--color-divider);border-radius:var(--radius);cursor:pointer;font-size:var(--t-meta)">
            <input type="checkbox" data-tm-folder="${PB_ATTR(f.id)}"${set.has(f.id)?' checked':''} style="width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
            <span style="width:8px;height:8px;border-radius:var(--radius);background:${f.color};flex:none"></span>
            <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</span></label>`).join('')}
        </div>
        <div id="tm-access-note" style="display:none" class="st-note">${esc(i18t('set_access_admin_note'))}</div>
        ${isNew?'':stPsPersonHtml(u)}
        ${stSignFolderHtml(u, isNew, folders)}`)}

    ${stSigningSectionHtml(u, isNew)}

    ${stReviewSectionHtml(u, isNew)}

    ${stOverseerSectionHtml(u, isNew)}

    ${(!isNew && isAdmin() && !isMe)?`<div class="st-danger">
      <button id="tm-remove" style="${ST_BTN_DANGER}">${icon('ban','w-3.5 h-3.5')} ${i18t('act_remove')}</button>
    </div>`:''}`;

  stDrawerPaint({
    title: isNew?i18t('st_add_person'):(u.name||u.email),
    sub: isNew?i18t('st_tab_people_sub'):[roleName(u.role), u.title].filter(Boolean).join(' \u00b7 '),
    avatar: isNew?'':(typeof deskInitials==='function'?deskInitials(u.name||u.email||''):String(u.name||u.email||'?').split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase()),
    glyph:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
    foot:'save', body,
    /* "Back to her role" beside Save (round 25's drawer, as drawn): the
       role's rights put back in the drawer, saved only on Save; shown while
       the drawer holds more or less than the role gives (stBzExtrasPaint) */
    footExtra:(!isNew&&u.role!=='admin'&&stBzOn()&&(u._bzRole!==undefined?u._bzRole:stBzBook().of[String(u.id)]))
      ?`<button type="button" class="ui-btn" id="tm-bz-back" hidden>${esc(i18t('bz_back_to_role',{ who:String(u.name||u.email||'').split(' ')[0]||i18t('sc_this_person') }))}</button>`:'',
    wire(){
      const roleSel=document.getElementById('tm-role');
      const syncAccess=()=>{
        const accSel=document.getElementById('tm-access');
        const list=document.getElementById('tm-access-list'), note=document.getElementById('tm-access-note');
        if(!roleSel||!accSel) return;
        stGrantRowsSync(roleSel.value);
        const adminRole=roleSel.value==='admin';
        accSel.disabled=adminRole; accSel.style.opacity=adminRole?'.55':'';
        if(note && note.tagName!=='P') note.style.display=adminRole?'block':'none';
        if(list) list.style.display=(!adminRole && accSel.value==='pick')?'grid':'none';
      };
      document.querySelectorAll('[name="tm-role-r"]').forEach(r=>r.addEventListener('change',()=>{
        if(roleSel) roleSel.value=r.value; syncAccess();
      }));
      roleSel?.addEventListener('change',()=>{
        document.querySelectorAll('[name="tm-role-r"]').forEach(r=>{ r.checked=(r.value===roleSel.value); });
        syncAccess();
      });
      document.getElementById('tm-access')?.addEventListener('change',syncAccess);
      syncAccess();
      const signSel=document.getElementById('tm-sign-mode');
      signSel?.addEventListener('change',()=>{
        const list=document.getElementById('tm-sign-list');
        if(list) list.style.display=signSel.value==='pick'?'grid':'none';
      });
      stGrantWordsWire();
      stSigningWire(u);
      stReviewWire(u);
      stOverseerWire(u);
      stBzWire(u,isNew);
      if(bzDraft&&bzDraft.pass){ const pw=document.getElementById('tm-pass'); if(pw) pw.value=bzDraft.pass; }
      document.getElementById('tm-remove')?.addEventListener('click',()=>settingsRemoveMember(u));
      /* W2-5a: the rescue. It COSTS this person their second step, so it asks
         first and says what it costs — they sign in on their password alone
         until they enrol again. Refusals land in the drawer's foot, never as
         a toast over the page behind (this page's own rule). */
      document.getElementById('tm-clear-2fa')?.addEventListener('click',async()=>{
        stDrawerClearRefusal();
        if(!await confirmDialog({ title:i18t('ts_clear_title',{name:u.name}),
          message:i18t('ts_clear_msg'), confirmLabel:i18t('ts_clear_btn') })) return;
        try{
          await api('users/'+u.id,'PATCH',{ clearTwoStep:true });
          u.twoStep=false;
          toast(i18t('ts_clear_done',{name:u.name}),'ok');
          stDrawerClose(); renderTeam();
        }catch(e){ stDrawerRefuse((e&&e.message)||i18t('ts_failed')); }
      });
    },
    save(){ stDrawerClearRefusal(); settingsSavePerson(isNew?null:u); },
  });
}
/* Save — one refusal sentence naming every missing field, shown in the drawer.
   The create half is the old form's handler moved across with nothing changed
   about what it sends or in what order. */
async function settingsSavePerson(existing){
  const isNew=!existing;
  const name=(document.getElementById('tm-name')?.value||'').trim();
  const email=(document.getElementById('tm-email')?.value||'').trim().toLowerCase();
  const title=(document.getElementById('tm-title')?.value||'').trim();
  const role=document.getElementById('tm-role')?.value||'viewer';
  const pass=document.getElementById('tm-pass')?.value||'';
  const cap=(typeof stSigningRead==='function')?stSigningRead():undefined;
  const rv=(typeof stReviewRead==='function')?stReviewRead():undefined;
  const ovr=(typeof stOverseerRead==='function')?stOverseerRead():undefined;
  const signFolders=(typeof stSignFolderRead==='function')?stSignFolderRead():undefined;
  const missing=[];
  if(!name) missing.push(i18t('st_f_name'));
  if(!validEmail(email)) missing.push(i18t('st_f_email'));
  if(isNew && pass.length<8) missing.push(i18t('st_f_temp_pass'));
  if(missing.length){ stDrawerRefuse(i18tn('st_missing',missing.length,{what:missing.join(', ')})); return; }
  if(typeof cap==='number' && Number.isNaN(cap)){ stDrawerRefuse(i18t('sc_bad_number')); return; }
  if(signFolders===false){ stDrawerRefuse(i18t('set_pick_one_stream')); return; }
  /* The approval section's own refusals, in the drawer's foot like every
     other: switched on with nobody to approve, applying to nothing, or a
     backup who is the approver. */
  const ovPatch=(typeof stOverseerPatch==='function')
    ? stOverseerPatch(isNew?null:(getUsers()||[]).find(x=>x.id===existing.id), ovr) : { patch:{} };
  if(ovPatch.refuse){ stDrawerRefuse(ovPatch.refuse); return; }
  if(isNew && (getUsers()||[]).some(x=>(x.email||'').toLowerCase()===email)){ stDrawerRefuse(i18t('set_member_exists')); return; }
  /* TWO MEMBERS MAY NOT SHARE A NAME (a named approver is matched by name where
     a rule has no id): the server refuses it on POST and PATCH /api/users; with
     no server this is the wall, asked only of a new or changed name. */
  if(!(typeof API_MODE==='function'&&API_MODE())){
    const nm=name.toLowerCase(), changed=isNew||String(existing.name||'').trim().toLowerCase()!==nm;
    if(changed&&(getUsers()||[]).some(x=>x&&(isNew||String(x.id)!==String(existing.id))&&String(x.name||'').trim().toLowerCase()===nm)){
      stDrawerRefuse(i18t('srv_member_name_taken')); return; }
  }

  /* Folder access is decided BEFORE the account exists. `null` means every
     stream — the same "no entry in the map" the editor writes — and it is
     reached only by picking it, never by saying nothing. */
  let folderIds=null, folderAnswered=true;
  const accSel=document.getElementById('tm-access');
  if(role!=='admin' && accSel && !accSel.disabled){
    const choice=accSel.value||'';
    if(!choice){ stDrawerRefuse(i18t('set_choose_access_err')); if(typeof fieldFocus==='function') fieldFocus(accSel); return; }
    if(choice==='pick'){
      folderIds=[...document.querySelectorAll('[data-tm-folder]')].filter(cb=>cb.checked).map(cb=>cb.getAttribute('data-tm-folder'));
      if(!folderIds.length){ stDrawerRefuse(i18t('set_pick_one_stream')); return; }
      /* A PRIVATE FOLDER IS NOT ON THE TICKS, so a save here must not drop it
         from their list: if it is ever opened again, they keep what they had */
      const had=(!isNew&&existing)?((((state.settings||{}).folderAccess)||{})[existing.id]):null;
      if(Array.isArray(had)) had.forEach(fid=>{ if(typeof streamIsPrivate==='function'&&streamIsPrivate(fid)&&!folderIds.includes(fid)) folderIds.push(fid); });
    }
  } else folderAnswered=(role==='admin');

  if(isNew){
    let newId=null, mailed=null;
    if(API_MODE()){
      try{ const r=await api('users','POST',{ name, email, role, title, password:pass });
        REMOTE.users=[...REMOTE.users, r.user]; newId=r.user&&r.user.id; mailed=r;
      }catch(e){ stDrawerRefuse(e.message); return; }
    } else {
      const salt=newSalt();
      newId='u'+(Date.now().toString(36));
      saveUsers([...getUsers(),{ id:newId, name, email, role, title, salt, hash:await hashPassword(pass,salt), createdAt:nowISO() }]);
    }
    if(folderIds && newId){
      try{ await settingsWriteFolderAccess(newId, folderIds); }
      catch(e){ toast(i18t('set_could_not_save_access')+e.message,'err'); }
    }
    /* The signing limit is stamped after the account exists, because it is a
       property of a member and there is no member until POST /api/users has
       answered. Only when somebody actually decided — an untouched section
       sends nothing, so a new account starts uncapped and blocks nothing. */
    const after={};
    if(cap!==undefined && !(typeof cap==='number' && Number.isNaN(cap))) after.signCap=cap;
    if(rv&&rv.reviewChecked!==undefined) after.reviewChecked=rv.reviewChecked;
    if(rv&&rv.reviewerId!==undefined) after.reviewerId=rv.reviewerId;
    Object.assign(after, ovPatch.patch||{});
    if(API_MODE()) Object.assign(after, stBzNewGrants());
    /* the grants ticked on the form win over the role's; only rows shown */
    const gv=stGrantBox('tm-values'), gp=stGrantBox('tm-paper'), gr=stGrantBox('tm-refile'), gh=stGrantBox('tm-hold');
    if(gv&&role!=='admin') after.canViewValues=!!gv.checked;
    if(role==='legal'){
      if(gp) after.newPaper=!!gp.checked;
      if(gr) after.reFile=!!gr.checked;
      if(gh) after.holdContracts=!!gh.checked;
    }
    if(newId && signFolders!==undefined && typeof saveSignFolders==='function'){
      try{ await saveSignFolders(newId, signFolders); }catch(e){ toast(e.message,'err'); }
    }
    if(newId && Object.keys(after).length){
      const u2=(getUsers()||[]).find(x=>x.id===newId);
      if(API_MODE()){
        try{ const r=await api('users/'+newId,'PATCH',after); if(r&&r.user&&u2) Object.assign(u2,r.user); }
        catch(e){ toast(e.message,'err'); }
      } else if(u2){ Object.assign(u2,after); saveUsers(getUsers()); }
    }
    if(newId) await stBzSaveHolder(newId);
    settingsMirrorDirectory(name,email,title);
    /* "SENT" MUST MEAN SENT (9 Oct 2026): this said "an invite email was
       queued" whatever the server did. It reads the server's mailReport now —
       sent, the outbox (no email set up) or refused — and where nothing went,
       says the one thing the admin has to do: hand over the temporary
       password they just typed themselves. */
    const inviteSaid = !API_MODE() ? 'set_t_share_password'
      : (mailed && mailed.emailSent) ? 'set_t_invite_sent'
      : (mailed && mailed.outbox) ? 'set_t_invite_outbox' : 'set_t_invite_failed';
    toast(i18t('set_t_added_as',{name,role:roleName(role)})+i18t(inviteSaid), inviteSaid==='set_t_invite_sent'?'ok':'warn');
    stDrawerClose(); renderTeam(); return;
  }

  /* ---- EDITING ----
     A RENAME CARRIES THE APPROVAL RULES WITH IT (9 Oct 2026). A rule names
     its approver by id now; an older rule that names them by their old name is
     repointed — by the server in a workspace (PATCH /api/users/:id does it in
     the same write), here on a single machine — so nothing is left pointing at
     nobody and there is nothing to ask. */
  const us=getUsers(); const target=us.find(x=>x.id===existing.id); if(!target) return;
  const me=currentUser()||{};
  const renamed = name && name!==target.name;
  const oldName = target.name;
  const repointRules = (save) => {
    if(!renamed || typeof approvalRules!=='function') return;
    const all=approvalRules().slice(); let moved=false;
    all.forEach(r=>{ const a=r&&r.approver;
      if(a&&a.kind==='member'&&(String(a.id||'')===String(target.id)||(!a.id&&a.name===oldName))){ r.approver={kind:'member',name,id:target.id}; moved=true; } });
    if(!moved) return;
    if(save) saveApprovalRules(all);
    else { state.settings=state.settings||{}; state.settings.approvalRules=all; }
  };
  const roleChanged = role!==target.role && existing.id!==me.id;
  const valuesBox=document.getElementById('tm-values');
  const valuesTo = valuesBox ? !!valuesBox.checked : null;
  const valuesChanged = valuesTo!==null && valuesTo!==stValuesOn(target);
  /* The new-paper grant, read the same way — absent box means the row was not
     drawn (a viewer, an admin, yourself), and a null answer changes nothing. */
  const paperBox=document.getElementById('tm-paper');
  const paperTo = paperBox ? !!paperBox.checked : null;
  const paperChanged = paperTo!==null && paperTo!==stNewPaperOn(target);
  const reFileBox=document.getElementById('tm-refile');
  const reFileTo = reFileBox ? !!reFileBox.checked : null;
  const reFileChanged = reFileTo!==null && reFileTo!==stReFileOn(target);
  const holdBox=document.getElementById('tm-hold');
  const holdTo = holdBox ? !!holdBox.checked : null;
  const holdChanged = holdTo!==null && holdTo!==stHoldOn(target);
  if(valuesChanged && valuesTo===false){
    const ok=await confirmDialog({ title:i18t('st_hide_values_q',{who:target.name}),
      message:i18t('st_hide_values_msg'),
      confirmLabel:i18t('st_hide_values_go') });
    if(!ok) return;
  }
  if(API_MODE()){
    const patch={};
    if(name!==target.name || title!==(target.title||'')) { patch.name=name; patch.title=title; }
    if(roleChanged) patch.role=role;
    if(valuesChanged) patch.canViewValues=valuesTo;
    if(paperChanged) patch.newPaper=paperTo;
    if(reFileChanged) patch.reFile=reFileTo;
    if(holdChanged) patch.holdContracts=holdTo;
    const capNow=(typeof signCapOf==='function')?signCapOf(target):{answered:false,limit:null};
    const capWas=capNow.answered?(capNow.limit==null?'none':capNow.limit):null;
    if(cap!==undefined && cap!==capWas) patch.signCap=cap;
    if(rv&&rv.reviewChecked!==undefined && rv.reviewChecked!==reviewChecked(target)) patch.reviewChecked=rv.reviewChecked;
    if(rv&&rv.reviewerId!==undefined && String(rv.reviewerId||'')!==String(target.reviewerId||'')) patch.reviewerId=rv.reviewerId;
    Object.assign(patch, ovPatch.patch||{});
    /* The server takes the name (an admin's act), the title, role and the
       grants; a rename the server refuses (another member has that name) is
       said in the drawer and nothing here moves. */
    const body={};
    if(renamed) body.name=name;
    if(patch.title!==undefined) body.title=patch.title;
    if(patch.role!==undefined) body.role=patch.role;
    if(patch.canViewValues!==undefined) body.canViewValues=patch.canViewValues;
    if(patch.newPaper!==undefined) body.newPaper=patch.newPaper;
    if(patch.reFile!==undefined) body.reFile=patch.reFile;
    if(patch.holdContracts!==undefined) body.holdContracts=patch.holdContracts;
    if(patch.signCap!==undefined) body.signCap=patch.signCap;
    if(patch.reviewChecked!==undefined) body.reviewChecked=patch.reviewChecked;
    if(patch.reviewerId!==undefined) body.reviewerId=patch.reviewerId;
    for(const k of ['overseerId','overseerOn','overseerBackupId','overseerWhen'])
      if(patch[k]!==undefined) body[k]=patch[k];
    if(Object.keys(body).length){
      try{ const r=await api('users/'+target.id,'PATCH',body); if(r&&r.user) Object.assign(target,r.user); }
      catch(e){ stDrawerRefuse(e.message); return; }
    }
    repointRules(false);
    if(name) target.name=name; target.title=title;
    if(roleChanged) target.role=role;
    if(valuesChanged) target.canViewValues=valuesTo;
    if(paperChanged) target.newPaper=paperTo;
    if(reFileChanged) target.reFile=reFileTo;
    if(holdChanged) target.holdContracts=holdTo;
    if(patch.signCap!==undefined) target.signCap=patch.signCap;
    if(patch.reviewChecked!==undefined) target.reviewChecked=patch.reviewChecked;
    if(patch.reviewerId!==undefined) target.reviewerId=patch.reviewerId;
    for(const k of ['overseerId','overseerOn','overseerBackupId','overseerWhen'])
      if(patch[k]!==undefined) target[k]=patch[k];
  } else {
    repointRules(true);
    target.name=name||target.name; target.title=title; if(roleChanged) target.role=role;
    const capNow=(typeof signCapOf==='function')?signCapOf(target):{answered:false,limit:null};
    const capWas=capNow.answered?(capNow.limit==null?'none':capNow.limit):null;
    if(cap!==undefined && cap!==capWas) target.signCap=cap;
    if(rv&&rv.reviewChecked!==undefined) target.reviewChecked=rv.reviewChecked;
    if(rv&&rv.reviewerId!==undefined) target.reviewerId=rv.reviewerId;
    Object.assign(target, ovPatch.patch||{});
    saveUsers(us);
  }
  if(target.role!=='admin'){
    try{ await settingsWriteFolderAccess(target.id, folderAnswered?folderIds:null); }
    catch(e){ stDrawerRefuse(i18t('set_could_not_save_access')+e.message); return; }
  }
  if(signFolders!==undefined && target.role!=='admin' && typeof saveSignFolders==='function'){
    try{ await saveSignFolders(target.id, signFolders); }
    catch(e){ stDrawerRefuse(e.message); return; }
  }
  if(!await stBzSaveHolder(target.id)) return;
  await stArAfterSave(target.id);
  settingsMirrorDirectory(target.name,email||target.email,title);
  toast(i18t('st_person_saved',{who:target.name}),'ok');
  stDrawerClose(); renderTeam();
}
/* Mirror a member into the people directory (with their title) so signer fields
   auto-fill. Lifted whole out of the old add handler — two copies of this was
   how a title could reach the roster and not the signer picker. */
function settingsMirrorDirectory(name,email,title){
  if(!email) return;
  state.settings=state.settings||{}; const dir=(state.settings.directory||[]).slice();
  const ex=dir.find(p=>(p.email||'').toLowerCase()===String(email).toLowerCase());
  if(ex){ if(name) ex.name=name; if(title!==undefined) ex.title=title; }
  else dir.push({ name:name||'', email, title:title||'' });
  state.settings.directory=dir; saveSettings();
}
/* ---- SOMEBODY LEAVING TAKES THEIR NEGOTIATIONS WITH THEM ----
   A desk whose lead has no account is a negotiation with no door out. Said
   BEFORE the removal, while there is still somebody to ask about it. It warns
   rather than refuses — an admin removing somebody who left on Friday must not
   be stuck, and the desks can be reassigned afterwards by any admin. */
async function settingsRemoveMember(u){
  const us=getUsers(); const t=us.find(x=>x.id===u.id); if(!t) return;
  /* ---- SOMEBODY WHO APPROVES FOR OTHERS TAKES THAT ROLE WITH THEM ----
     Said BEFORE the removal, beside the negotiation-lead warning and for the
     same reason: an admin needs to know to name somebody new. Since 23 Sep
     2026 nothing is stranded meanwhile — an approval whose approver has gone
     falls to the backup, else to the admins (saNeeds) — and the sentence says
     so. It WARNS rather than refusing — an admin removing somebody who left
     on Friday must not be stuck. */
  let oversees='';
  /* Only people whose rule is ON (23 Sep 2026): a person with an approver
     named and the rule switched off asks nobody anything. */
  const legacyOn=(typeof signApprovalLegacyOn==='function')?signApprovalLegacyOn():false;
  const watched=((getUsers()||[]).filter(x=>x&&String(x.overseerId||'')===String(t.id)
    && (typeof saRuleOf!=='function' || saRuleOf(x,legacyOn).on)));
  if(watched.length) oversees=`\n\n${i18tn('ov_leaver',watched.length,{who:t.name,n:watched.length})}`;
  let leads='';
  if(window.deskLedBy){
    const led=deskLedBy(state.contracts||[],t.id);
    if(led.length) leads=`\n\n${i18t('dk_leaver_title',{who:t.name,n:led.length})} — `
      +led.slice(0,5).map(c=>c.name).join(', ')+(led.length>5?`, +${led.length-5}`:'')
      +`\n${i18t('dk_leaver_sub')}`;
  }
  if(!await confirmDialog({title:i18t('st_remove_member_q',{who:t.name}), message:`${i18t('st_remove_member_msg',{who:t.name})}${oversees}${leads}`, confirmLabel:i18t('st_remove_member_go'), danger:true})) return;
  if(API_MODE()){
    try{ await api('users/'+t.id,'DELETE'); REMOTE.users=REMOTE.users.filter(x=>x.id!==t.id); }
    catch(e){ stDrawerRefuse(e.message); return; }
  } else saveUsers(us.filter(x=>x.id!==t.id));
  toast(i18t('set_t_removed',{name:t.name})); stDrawerClose(); renderTeam();
}

/* ============================================================
   YOUR ACCOUNT — the surface every non-admin was left without
   ============================================================
   It is the SAME drawer, opened from the avatar, and it is what tab 4 draws in
   the page for an admin. One builder, so the two cannot drift: an admin reading
   "You" and a viewer reading "Your account" are looking at the same rows. */
function stAccountBodyHtml(opts){
  const u=currentUser()||{};
  const mayDesign=u.role==='admin'||u.role==='legal';
  /* ONE BUILDER, ITS SECTIONS BY NAME (the Control Room built in full, 16 Oct
     2026): the avatar's "Your account" drawer draws them all, in this order;
     a You card's door draws only the ones it names (`only`), in the same
     drawer. The same rows from the same builder, so the two cannot drift. */
  const only=(opts&&opts.only)?[].concat(opts.only):null;
  /* a section's NAME, not a door: data-st-you is the press that opens a You
     drawer, and a press inside the drawer must never re-open it */
  const sec=k=>` data-st-sec="${k}"`;
  const api=API_MODE();
  const S={};
  S.job=`<section class="st-sec"${sec('job')}>
      <h3 class="st-sec-h">${esc(i18t('st_acct_job'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('st_acct_job_sub'))}</p>
      <div style="display:flex;gap:var(--s-2);align-items:flex-end">
        <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${esc(i18t('st_f_title'))}</span>
          <input id="acct-title" type="text" value="${PB_ATTR(u.title||'')}" style="${window.RV_FLD||ST_INPUT}"/></label>
        <button id="acct-title-save" style="${ST_BTN_SM}">${i18t('act_save')}</button>
      </div>
      <p class="st-note">${esc(i18t('st_f_title_note'))}</p>
    </section>`;
  /* HOW YOU LIKE TO WORK: the two flags the full build added — Jambo's
     next-step chips, and where a contract opens for you. Each is written the
     moment it changes, like everything in this drawer. The sidebar switch
     went (owner's yes, 18 Oct 2026): a computer draws no left sidebar. */
  const opens=(typeof contractOpensOn==='function')?contractOpensOn():'jambo';
  S.work=`<section class="st-sec"${sec('work')}>
      <h3 class="st-sec-h">${esc(i18t('st_you_work'))}</h3>
      <label class="st-toggle">
        <input id="pref-jb-chips" type="checkbox" ${(typeof jamboChipsOn!=='function'||jamboChipsOn())?'checked':''}/>
        <span><span class="st-role-name">${esc(i18t('st_you_chips'))}</span>
        <span class="st-note">${esc(i18t('st_you_chips_sub'))}</span></span>
      </label>
      <label style="display:block;margin-top:var(--s-3)"><span style="${window.RV_LBL||''}">${esc(i18t('st_you_opens'))}</span>
        <select id="pref-opens-on" style="${window.RV_FLD||ST_INPUT}">${((typeof OPENS_ON!=='undefined')?OPENS_ON:['jambo']).map(v=>`<option value="${v}"${v===opens?' selected':''}>${esc(i18t('st_opens_'+v))}</option>`).join('')}</select>
        <span class="st-note">${esc(i18t('st_you_opens_sub'))}</span></label>
    </section>`;
  if(api){
    S.sessions=`<section class="st-sec"${sec('sessions')}>
      <h3 class="st-sec-h">${esc(i18t('st_acct_sessions'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${i18t('set_sessions_sub')}</p>
      <div id="sessions-list" style="font-size:var(--t-meta);color:var(--color-neutral-700)">${window.busyHtml?busyHtml(i18t('set_loading')):i18t('set_loading')}</div>
    </section>`;
    /* THE HONEST READ-ONLY STATEMENT STAYS (which emails always come), with
       the one live choice beside it — the brief, three answers, written on
       change. The radio group's name is unique per rendering: two copies of
       this section may be on screen at once and must not fight. */
    S.email=`<section class="st-sec"${sec('email')}>
      <h3 class="st-sec-h">${esc(i18t('st_acct_email'))}</h3>
      <div class="st-quiet">
        <span style="font-weight:var(--w-strong);display:block;color:var(--color-text)">${i18t('set_still_emailed')}</span>
        ${i18t('set_three_events')}
      </div>
      <div class="st-sec-lead" style="margin-top:var(--s-3);font-weight:var(--w-strong);font-size:var(--t-body);color:var(--color-text)">${i18t('set_brief_how_often')}</div>
      ${(_briefGroup++, '')}${[['daily','set_brief_daily','set_brief_daily_sub'],
         ['weekly','set_brief_weekly','set_brief_weekly_sub'],
         ['off','set_brief_off','set_brief_off_sub']].map(([v,k,sub])=>`
        <label class="st-toggle" style="margin-top:var(--s-2)">
          <input type="radio" name="pref-brief-every-${_briefGroup}" data-pref-brief="${v}"${briefCadenceOf(u)===v?' checked':''}/>
          <span><span class="st-role-name">${i18t(k)}</span>
          <span class="st-note">${i18t(sub)}</span></span>
        </label>`).join('')}
    </section>`;
    /* TWO-STEP SIGN-IN (WO-6), self-service both ways; and, while it is on,
       how many recovery codes are left with the way to a fresh set (the full
       build) — both cost a current code, as turning it off does. */
    S.twostep=`<section class="st-sec"${sec('twostep')}>
      <h3 class="st-sec-h">${esc(i18t('ts_title'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('ts_sub'))}</p>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="st-quiet" style="flex:1">${u.twoStep?i18t('ts_on_line'):i18t('ts_off_line')}</span>
        <button id="ts-toggle" style="${ST_BTN2};flex:none">${u.twoStep?i18t('ts_turn_off'):i18t('ts_turn_on')}</button>
      </div>
      ${u.twoStep?`<div class="st-codes" id="ts-codes">
        <span class="st-quiet" style="flex:1" id="ts-codes-left">${esc(stCodesLeftText())}</span>
        <button id="ts-codes-new" style="${ST_BTN2};flex:none">${esc(i18t('st_you_codes_new'))}</button>
      </div>`:''}
    </section>`;
    S.password=`<section class="st-sec"${sec('password')}>
      <h3 class="st-sec-h">${esc(i18t('st_you_password'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('st_you_password_sub'))}</p>
      <button type="button" style="${ST_BTN2}" data-st-panel="me:password">${esc(i18t('st_you_password_go'))}</button>
    </section>`;
  }
  S.backup=`<section class="st-sec"${sec('backup')}>
      <h3 class="st-sec-h">${esc(i18t('st_acct_backup'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${api?i18t('set_backup_server'):i18t('set_backup_local')}</p>
      <button id="bk-export" style="${ST_BTN2}">${icon('download','w-3.5 h-3.5')} ${i18t('set_export_backup')}</button>
    </section>`;
  /* AN EDITOR'S COMPANY-DESIGN DOOR, kept on the personal surface (it is a
     workspace setting they are allowed to change, and says so) */
  if(mayDesign) S.design=`<section class="st-sec"${sec('design')}>
      <h3 class="st-sec-h">${esc(i18t('st_acct_design'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('st_acct_design_note'))}</p>
      <button id="brand-edit" style="${ST_BTN2}">${i18t('set_edit_design')}</button>
    </section>`;
  if(u.role==='admin') S.door=`<section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('st_acct_settings_door'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('st_acct_settings_sub'))}</p>
      <button id="acct-settings" style="${ST_BTN2}">${esc(i18t('st_acct_settings_door'))}</button>
    </section>`;
  /* JAMBO'S POINTS, JUST FOR YOU (12 Oct 2026): a person's own values per
     agent, which change only what they see */
  if(typeof agPointsTableHtml==='function'&&api) S.points=`<section class="st-sec st-sec-wide" id="ag-pts-mine" data-st-sec="points"><h3 class="st-sec-h">${esc(i18t('jh_pt_h_mine'))}</h3>${agPointsTableHtml('mine')}</section>`;
  /* LANGUAGE KEEPS ITS ONE CONTROL AND ITS ONE WRITER — the switch at the
     top of the window; the row says where it is */
  S.lang=`<p class="st-note">${esc(i18t('st_acct_lang_note'))}</p>`;
  const ORDER=['job','work','sessions','email','twostep','password','backup','design','door','points','lang'];
  return (only?only:ORDER).filter(k=>S[k]).map(k=>S[k]).join('\n');
}
function stAccountWire(){
  if(typeof agPointsWire==='function') agPointsWire(document.getElementById('ag-pts-mine'));
  document.getElementById('acct-title-save')?.addEventListener('click',async()=>{
    const u=currentUser(); if(!u) return;
    const title=(document.getElementById('acct-title')?.value||'').trim();
    if(API_MODE()){
      try{ const r=await api('users/'+u.id,'PATCH',{ title }); if(r&&r.user) Object.assign(u,r.user); else u.title=title; }
      catch(e){ stDrawerRefuse(i18t('set_could_not_save_title')+e.message); return; }
    } else { u.title=title; saveUsers(getUsers()); }
    settingsMirrorDirectory(u.name,u.email,title);
    toast(i18t('st_acct_saved'));
    if(state.view==='team' && isAdmin()) renderTeam();
  });
  /* each written through the ONE writer the sheet's rows use too (round 24) */
  document.querySelectorAll('[data-pref-brief]').forEach(el=>el.addEventListener('change',e=>stBriefSet(e.target.getAttribute('data-pref-brief'))));
  document.getElementById('ts-toggle')?.addEventListener('click',()=>stTwoStepToggle());
  document.getElementById('ts-codes-new')?.addEventListener('click',()=>stCodesNew());
  /* the two flags the full build added, each written as it changes */
  document.getElementById('pref-jb-chips')?.addEventListener('change',async e=>{
    const on=!!e.target.checked;
    if(!(await stChipsSet(on))) e.target.checked=!on;
  });
  document.getElementById('pref-opens-on')?.addEventListener('change',async e=>{
    const v=e.target.value, was=(typeof contractOpensOn==='function')?contractOpensOn():'jambo';
    if(!(await stOpensSet(v))) e.target.value=was;
  });
  document.getElementById('bk-export')?.addEventListener('click',()=>settingsExportBackup());
  document.getElementById('brand-edit')?.addEventListener('click',()=>{
    stDrawerClose(); openDesignStep({ mode:'settings', onBack:()=>{ if(isAdmin()) renderTeam(); else openMyAccount(); } });
  });
  document.getElementById('acct-settings')?.addEventListener('click',()=>{ stDrawerClose(); openSettingsAt('people'); });
  if(API_MODE()) loadSessions();
}
/* ---- EVENTS OUT (W2-3): the list, and adding one ---- */
async function stHooksLoad(){
  const host=document.getElementById('wh-list'); if(!host) return;
  try{
    const r=await api('webhooks');
    state.webhooks=(r&&r.webhooks)||[];
    if(r&&Array.isArray(r.events)) state.webhookEvents=r.events;
  }catch(_){ state.webhooks=[]; }
  const rows=state.webhooks||[];
  if(!rows.length){ host.innerHTML=`<p class="st-note" style="margin:0">${esc(i18t('st_hooks_none'))}</p>`; return; }
  host.innerHTML=rows.map(w=>{
    const tone=w.lastOk===false?'ruby':(w.lastOk?'green':'steel');
    const said=w.lastAt?`${w.lastOk?i18t('st_hooks_ok'):i18t('st_hooks_bad')} · ${esc(w.lastStatus||'')}`:i18t('st_hooks_never');
    return `<div style="display:flex;align-items:center;gap:9px;font-size:var(--t-meta)">
      <span class="pill-x" style="background:var(--st-${tone}-bg);color:var(--st-${tone}-fg);flex:none">${w.active?i18t('st_hooks_live'):i18t('st_hooks_off')}</span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(w.url)}
        <span class="st-note" style="margin:0">${esc(said)}</span></span>
      <button data-wh-del="${esc(w.id)}" style="${ST_BTN_SM};flex:none">${i18t('st_hooks_remove')}</button>
    </div>`;
  }).join('');
  host.querySelectorAll('[data-wh-del]').forEach(b=>b.addEventListener('click',async()=>{
    if(!await confirmDialog({ title:i18t('st_hooks_remove_q'), message:i18t('st_hooks_remove_msg'),
      confirmLabel:i18t('st_hooks_remove') })) return;
    try{ await api('webhooks/'+encodeURIComponent(b.getAttribute('data-wh-del')),'DELETE'); stHooksLoad(); stRepaintRow('webhooks'); }
    catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
  }));
}
async function stHooksAdd(){
  stDrawerClearRefusal();
  const url=(document.getElementById('wh-url')||{value:''}).value.trim();
  if(!url) return;
  const events=[...document.querySelectorAll('[data-wh-ev]')].filter(b=>b.checked).map(b=>b.getAttribute('data-wh-ev'));
  if(!events.length) return stDrawerRefuse(i18t('st_hooks_pick_event'));
  try{
    const r=await api('webhooks','POST',{ url, events });
    const box=document.getElementById('wh-url'); if(box) box.value='';
    await stHooksLoad(); stRepaintRow('webhooks');
    /* THE SECRET IS SHOWN ONCE. It is what proves a delivery came from HaTi;
       a screen that could re-read it would hand it to anybody who reaches the
       screen. Said plainly rather than left for somebody to discover. */
    openModal(`<div style="padding:24px">
      <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section);margin:0 0 6px">${i18t('st_hooks_secret_title')}</h3>
      <p class="st-note" style="margin:0 0 10px">${esc(i18t('st_hooks_secret_msg'))}</p>
      <div style="font-family:var(--font-mono);font-size:var(--t-body);background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius);padding:10px var(--s-3);word-break:break-all;user-select:all">${esc(r.secret)}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:var(--s-3)">
        <button id="wh-done" class="ui-btn ui-btn-primary">${i18t('ts_done')}</button>
      </div></div>`,{ maxWidth: DLG_W.m });
    document.getElementById('wh-done')?.addEventListener('click',()=>closeModal());
  }catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
}
/* ---- EXCHANGE RATES (W2-1) ----
   A LIST, then one add/replace row. Painted rather than re-rendered, because
   this page's own rule is that it holds still: a saved rate repaints the
   list and nothing else. Removing is setting the rate to nothing, which puts
   that currency back to "no rate on file" — left out and said, never
   guessed. */
/* The options the picker offers, and the sentence that says which of them this
   workspace actually needs. Painted rather than rendered with the panel: a
   saved rate changes both lists (the code leaves the picker and joins the ones
   on file) and this page's rule is that it holds still. */
function stFxPaintPicker(){
  const list=document.getElementById('st-fx-codes');
  if(list && typeof fxPickerCodes==='function'){
    list.innerHTML=fxPickerCodes().map(code=>{
      const name=(typeof fxCurrencyName==='function'&&fxCurrencyName(code))||'';
      /* label carries both, because "USD" and "AUD" and "SGD" all read as
         dollars to somebody hunting for the right one. */
      return `<option value="${esc(code)}"${name?` label="${esc(code+' — '+name)}"`:''}>${
        name?esc(code+' — '+name):''}</option>`;
    }).join('');
  }
  const need=document.getElementById('st-fx-need');
  if(need){
    const missing=(typeof fxMissing==='function')?fxMissing():{};
    const codes=Object.keys(missing).sort();
    /* NAMED, NEVER COUNTED: "3 currencies have no rate" is a number nobody can
       act on; the codes are what an admin goes and looks up. */
    need.innerHTML=codes.length
      ? `<p class="st-note" style="margin:0 0 var(--s-2);color:var(--st-amber-fg)">${
          esc(i18tn('st_fx_needed',codes.length,{n:codes.length,codes:codes.join(', ')}))}</p>`
      : '';
  }
}
function stFxPaint(){
  stFxPaintPicker();
  const host=document.getElementById('st-fx-list'); if(!host) return;
  const rates=(state.settings&&state.settings.fxRates)||{};
  const codes=Object.keys(rates).sort();
  if(!codes.length){ host.innerHTML=`<p class="st-note" style="margin:0">${esc(i18t('st_fx_none'))}</p>`; return; }
  host.innerHTML=codes.map(code=>{
    const r=rates[code]||{};
    return `<div style="display:flex;align-items:center;gap:10px;font-size:var(--t-meta)">
      <span style="font-family:var(--font-mono);font-weight:var(--w-strong);min-width:40px">${esc(code)}</span>
      <span style="flex:1;min-width:0">${esc(i18t('st_fx_line',{code,rate:Number(r.rate).toLocaleString(),cur:jxCurrency()}))}
        <span class="st-note" style="margin:0">${r.at?esc(i18t('st_fx_set_on',{date:r.at})):''}</span></span>
      <button data-fx-del="${esc(code)}" style="${ST_BTN_SM};flex:none">${i18t('st_fx_remove')}</button>
    </div>`;
  }).join('');
  host.querySelectorAll('[data-fx-del]').forEach(b=>b.addEventListener('click',()=>stFxSave(b.getAttribute('data-fx-del'),null)));
}
/* ---- READ THE WHOLE BOOK: the drawer ---- */
let _stBook=null;
async function stBookLoad(){
  try{ _stBook=await api('board/reading'); }catch(e){ _stBook=null; const h=document.getElementById('st-book'); if(h) h.textContent=(e&&e.message)||i18t('co_settings_save_failed'); return; }
  stBookPaint();
}
function stBookPaint(){
  const host=document.getElementById('st-book'); if(!host||!_stBook) return;
  const b=_stBook, r=b.run&&b.run.result;
  const fld=(id,label,val,min,max,step)=>`<label><span style="${window.RV_LBL||''}">${esc(label)}</span><input id="${id}" type="number" min="${min}" max="${max}" step="${step||1}" value="${esc(String(val))}" style="${window.RV_FLD||ST_INPUT}"/></label>`;
  const last=b.run?(b.run.error?i18t('st_book_last_err',{ at:String(b.run.at||'').slice(0,10), why:b.run.error })
    :i18t('st_book_last',{ at:String(b.run.at||'').slice(0,10), read:(r&&r.read)||0, checked:(r&&r.checked)||0 })+(r&&(r.ceiling||r.agentLimit)?' '+i18t('st_book_stopped'):r&&r.cap?' '+i18t('st_book_capped'):''))
    :i18t('st_book_never');
  host.innerHTML=`<label style="display:flex;align-items:center;gap:8px;font-size:var(--t-body)"><input id="st-book-on" type="checkbox"${b.on?' checked':''}/> ${esc(i18t('st_book_on'))}</label>
    <p class="st-note" style="margin:6px 0 10px">${esc(i18t('st_book_cost'))}${b.noKey?' '+esc(i18t('st_book_nokey')):''}</p>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${fld('st-book-at',i18t('st_book_at'),b.at,0,23)}${fld('st-book-max',i18t('st_book_max'),b.max,1,1000)}${fld('st-book-limit',i18t('st_book_limit'),b.limit,0,1000,0.5)}</div>
    <p class="st-note" style="margin:10px 0 4px">${esc(i18t('st_book_cover',{ read:b.read, checked:b.checked, total:b.total }))}</p>
    <p class="st-note" style="margin:0 0 10px">${esc(last)}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button id="st-book-save" style="${ST_BTN_SM}">${esc(i18t('st_book_save'))}</button><button id="st-book-run" style="${ST_BTN2}${b.on&&!b.noKey?'':';opacity:.5;cursor:default'}"${b.on&&!b.noKey?'':` disabled title="${esc(i18t(b.noKey?'st_book_nokey':'st_book_run_off'))}"`}>${esc(i18t('st_book_run'))}</button></div>`;
  document.getElementById('st-book-save')?.addEventListener('click',stBookSave);
  document.getElementById('st-book-run')?.addEventListener('click',stBookRun);
}
async function stBookSave(){
  stDrawerClearRefusal();
  const v=id=>{ const el=document.getElementById(id); return el?el.value:null; };
  try{ await api('board/reading','PUT',{ on:!!document.getElementById('st-book-on')?.checked, at:Number(v('st-book-at')), max:Number(v('st-book-max')), limit:Number(v('st-book-limit')) });
    toast(i18t('st_book_saved'),'ok'); await stBookLoad(); }
  catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
}
async function stBookRun(){
  stDrawerClearRefusal();
  const b=document.getElementById('st-book-run'); if(b) b.disabled=true;
  try{ const r=await api('board/reading/run','POST',{}); toast(i18t('st_book_ran',{ read:(r&&r.read)||0, checked:(r&&r.checked)||0 }),'ok'); await stBookLoad(); }
  catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); if(b) b.disabled=false; }
}
/* ---- COPILOT ACCURACY: the drawer's reading and its rows ---- */
let _stAcc=null;
async function stAccLoad(){
  try{ _stAcc=await api('board/accuracy'); }catch(e){ _stAcc=null; const sub=document.getElementById('st-acc-sub'); if(sub) sub.textContent=(e&&e.message)||i18t('co_settings_save_failed'); return; }
  stAccPaint(); if(typeof stRepaintRow==='function') stRepaintRow('boardaccuracy');
}
function stAccDay(){ const d=new Date(); const add=((_stAcc&&_stAcc.day!=null?_stAcc.day:1)-d.getDay()+7)%7||7; d.setDate(d.getDate()+add);
  try{ return d.toLocaleDateString(typeof langLocale==='function'?langLocale():undefined,{ weekday:'short', day:'numeric', month:'short' }); }catch(_){ return d.toDateString(); } }
function stAccPaint(){
  const host=document.getElementById('st-acc'), sub=document.getElementById('st-acc-sub'); if(!host||!_stAcc) return;
  const a=_stAcc, r=a.run&&a.run.result, f=a.free;
  const when=a.run&&a.run.at?String(a.run.at).slice(0,10):null;
  if(sub) sub.textContent=i18t('st_acc_sub_line',{ last:when||i18t('st_acc_never'), next:stAccDay() });
  const tile=(big,small,tone)=>`<div style="border:1px solid var(--color-divider);border-radius:var(--radius);padding:10px 12px;display:grid;gap:2px;min-width:0"><b style="font-size:20px;font-variant-numeric:tabular-nums;${tone?'color:'+tone:''}">${esc(big)}</b><span class="st-note" style="margin:0">${esc(small)}</span></div>`;
  const ok='var(--st-green-fg,#1f7a45)', amber='var(--st-amber-fg,#93600e)';
  const cop=r&&r.total?tile(Math.round(r.hits/Math.max(1,r.asked||r.total)*100)+'%',i18t('st_acc_cop',{ n:r.hits, of:r.asked||r.total }),r.hits/Math.max(1,r.asked||r.total)>=0.95?ok:amber)
    :tile(i18t(a.noKey?'st_acc_not_measured_short':'st_acc_not_run_short'),i18t(a.noKey?'st_acc_no_key':'st_acc_first_run',{ next:stAccDay() }),amber);
  const freeT=f?tile(`${f.total}`,i18t('st_acc_free',{ pm:f.passMark==null?'—':f.passMark }),ok):tile('—',i18t('st_acc_free_none'));
  const disc=tile(String(a.disconnects||0),i18t('st_acc_disc'),a.disconnects?amber:ok);
  const btn=(attr,label,quiet)=>`<button ${attr} style="${quiet?ST_BTN2:ST_BTN2};padding:3px 9px">${esc(label)}</button>`;
  const misses=(r&&Array.isArray(r.misses)?r.misses:[]).map(m=>`<div style="padding:9px 12px;border-bottom:1px solid var(--color-divider);display:grid;gap:4px;font-size:var(--t-meta)">
      <b>“${esc(m.q)}”${m.after?` <span class="st-note" style="margin:0">${esc(i18t('st_acc_after',{ q:m.after }))}</span>`:''}</b><span class="st-note" style="margin:0">${esc(stAccMissWords(m))}</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${btn('data-acc-word=""',i18t('st_acc_add_word'))}</div></div>`).join('');
  const rows=(a.rows||[]).map(x=>`<div style="padding:9px 12px;border-bottom:1px solid var(--color-divider);display:grid;gap:4px;font-size:var(--t-meta)">
      <b>“${esc(x.q)}” <span class="st-note" style="margin:0">· ${esc(x.by)} · ${esc(String(x.at||'').slice(0,10))}${x.kind==='fix'?' · '+esc(i18t('st_acc_fix')):''}</span></b>
      <span class="st-note" style="margin:0">${esc(x.recipe?i18t('st_acc_drew',{ how:stAccHow(x.recipe) }):i18t('st_acc_said',{ said:x.said||'' }))}</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${btn(`data-acc-keep="${esc(x.id)}"`,i18t('st_acc_keep'))}${btn(`data-acc-copy="${esc(x.id)}"`,i18t('st_acc_copy'))}${btn('data-acc-word=""',i18t('st_acc_add_word'))}${btn(`data-acc-dismiss="${esc(x.id)}"`,i18t('st_acc_dismiss'))}</div></div>`).join('');
  host.style.overflowWrap='anywhere'; host.style.minWidth='0';
  host.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${freeT}${cop}${disc}</div>
    ${r&&r.stopped?`<p class="st-note" style="margin:8px 0 0;color:${amber}">${esc(i18t('st_acc_stopped_'+(r.stopped==='ceiling'?'ceiling':'limit')))}</p>`:''}
    ${r&&r.numbers&&r.numbers.answers?`<p class="st-note" style="margin:8px 0 0${r.numbers.flagged?';color:'+amber:''}">${esc(i18tn('st_acc_numbers',r.numbers.answers,{ n:r.numbers.answers, k:r.numbers.flagged }))}${(r.numbers.examples||[]).slice(0,3).map(x=>`<br>“${esc(x.q)}”: ${esc(x.numbers.join(', '))}`).join('')}</p>`:''}
    <h3 class="st-sec-h" style="margin-top:14px">${esc(i18t('st_acc_misses'))}${r&&r.misses?` (${r.misses.length})`:''}</h3>
    ${misses?`<div style="border:1px solid var(--color-divider);border-radius:var(--radius)">${misses}</div>`:`<p class="st-note" style="margin:0">${esc(i18t(r&&r.total?'st_acc_no_misses':'st_acc_misses_none_yet'))}</p>`}
    <h3 class="st-sec-h" style="margin-top:14px">${esc(i18t('st_acc_marked'))} (${(a.rows||[]).length})</h3>
    ${rows?`<div style="border:1px solid var(--color-divider);border-radius:var(--radius)">${rows}</div>`:`<p class="st-note" style="margin:0">${esc(i18t('st_acc_marked_none'))}</p>`}
    ${a.kept?`<p class="st-note" style="margin:8px 0 0">${esc(i18tn('st_acc_kept_n',a.kept,{ n:a.kept }))}</p>`:''}`;
  host.querySelectorAll('[data-acc-keep]').forEach(b=>b.addEventListener('click',()=>stAccSettle(b.getAttribute('data-acc-keep'),'kept')));
  host.querySelectorAll('[data-acc-dismiss]').forEach(b=>b.addEventListener('click',()=>stAccSettle(b.getAttribute('data-acc-dismiss'),'dismissed')));
  host.querySelectorAll('[data-acc-word]').forEach(b=>b.addEventListener('click',()=>stDrawerOpen('boardwords')));
  host.querySelectorAll('[data-acc-copy]').forEach(b=>b.addEventListener('click',()=>stAccCopy(b.getAttribute('data-acc-copy'),b)));
}
/* a recipe in the reader's words, only the parts it holds (never code) */
function stAccHow(rc){
  const r=rc||{}, out=[];
  try{
    if(r.pic) out.push(window.hbPicWord?hbPicWord({ pic:r.pic, split:r.split }):r.pic);
    if(r.split&&r.split.by) out.push(window.hbSplitWord?hbSplitWord(r.split):r.split.by);
    if(r.split2&&r.split2.by) out.push(i18t('hb_then_by',{ b:window.hbSplitWord?hbSplitWord(r.split2):r.split2.by }));
    if(r.measure) out.push(i18t('hb_ms_'+r.measure).toLowerCase());
    if(r.top) out.push(i18t('hb_top_n',{ n:r.top }).toLowerCase());
  }catch(_){ /* the words are a courtesy */ }
  return out.join(' · ')||i18t('st_acc_any_chart');
}
/* a miss in plain words: what the book wanted, and what Copilot did */
function stAccMissWords(m){
  if(m.kept) return i18t(m.got&&m.got.do?'st_acc_kept_again':'st_acc_kept_none');
  const w=m.want||{}, g=m.got||{};
  if(g.error) return i18t('st_acc_no_answer');
  const doW=d=>d?i18t('st_acc_do_'+d):i18t('st_acc_do_none');
  if(w.cards) return i18t('st_acc_miss_cards',{ n:w.cards, got:g.cards||0 });
  const wanted=w.recipe?i18t('st_acc_wanted_chart',{ how:stAccHow(w.recipe), act:doW(w.do) }):doW(w.do);
  const got=g.recipe&&(g.do==='add_card'||g.do==='change_card')?i18t('st_acc_got_chart',{ how:stAccHow(g.recipe), act:doW(g.do) }):doW(g.do);
  return i18t('st_acc_miss',{ wanted, got });
}
async function stAccSettle(id,state){
  stDrawerClearRefusal();
  try{ await api('board/feedback/'+encodeURIComponent(id),'PATCH',{ state }); toast(i18t(state==='kept'?'st_acc_kept':'st_acc_dismissed'),'ok'); await stAccLoad(); }
  catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
}
/* "Copy as test": one line for the precision book; its want is a developer's to write */
function stAccCopy(id,btn){
  const x=((_stAcc&&_stAcc.rows)||[]).find(r=>r.id===id); if(!x) return;
  const line=JSON.stringify({ src:'review '+String(x.at||'').slice(0,10), road:'copilot', ...(x.after?{ after:x.after }:{}), q:x.q, drewWrong:x.recipe||null, want:{} });
  const done=()=>toast(i18t('st_acc_copied'),'ok');
  try{ navigator.clipboard.writeText(line).then(done,()=>stAccCopyFallback(line,btn)); }catch(_){ stAccCopyFallback(line,btn); }
}
function stAccCopyFallback(line,btn){ const t=document.createElement('textarea'); t.value=line; t.style.cssText='width:100%;margin-top:6px;font-family:var(--font-code);font-size:12px'; t.readOnly=true; (btn&&btn.parentElement||document.body).after(t); t.select(); }
/* ---- WHAT JAMBO COULD NOT PLACE: the table, Teach and Fine (round 8) ---- */
let _stLessons=null;          // { rows, total, week, more, days, taught:[{phrase,place,by,at}] }
let _stLessonOpen=null;       // the row whose Teach is open
/* the pages a phrase can mean: the ones a page's one name opens, named as the Guide names them */
function stLessonPlaces(){
  const ks=(window.JB_PAGE_PLACES||[]).filter(k=>k!=='upload');
  return ks.map(k=>({ k, label:i18t('gd_p_'+k) })).filter(x=>x.label&&x.label!=='gd_p_'+x.k);
}
function stLessonPlaceLabel(k){ const x=stLessonPlaces().find(p=>p.k===k); return x?x.label:k; }
function stLessonPageLabel(v){ try{ return (window.shellTitleFor&&shellTitleFor(v))||v||''; }catch(_){ return v||''; } }
async function stLessonsLoad(){
  try{
    const [u,l]=await Promise.all([api('jambo/unplaced'),api('jambo/lessons')]);
    _stLessons=Object.assign({},u||{},{ taught:(l&&l.list)||[] });
    if(window.jamboLessonsSet) jamboLessonsSet((l&&l.lessons)||{});
  }catch(e){ _stLessons={ rows:[], total:0, taught:[], err:(e&&e.message)||'' }; }
  stLessonsPaint(); if(typeof stRepaintRow==='function') stRepaintRow('lessons');
}
function stLessonsPaint(){
  const host=document.getElementById('st-lessons'), taught=document.getElementById('st-lessons-taught'); if(!host) return;
  const L=_stLessons||{ rows:[], taught:[] };
  if(L.err){ host.innerHTML=`<p class="st-note" style="margin:0">${esc(L.err)}</p>`; return; }
  const places=stLessonPlaces();
  const head=`<div class="st-ls-r st-ls-h"><span>${esc(i18t('st_lessons_col_said'))}</span><span>${esc(i18t('st_lessons_col_on'))}</span><span>${esc(i18t('st_lessons_col_next'))}</span><span></span></div>`;
  const row=r=>{
    const on=stLessonPageLabel(r.page)+(r.ref?' · '+r.ref:''), next=r.next?stLessonPageLabel(r.next):i18t('st_lessons_next_none');
    const open=_stLessonOpen===r.id;
    const guess=places.find(p=>p.label===stLessonPageLabel(r.next));
    const teach=open?`<div class="st-ls-teach"><label><span style="${window.RV_LBL||''}">${esc(i18t('st_lessons_means'))}</span><select data-ls-place="${esc(r.id)}" style="${window.RV_FLD||ST_INPUT}"><option value="">${esc(i18t('st_lessons_choose'))}</option>${places.map(p=>`<option value="${esc(p.k)}"${guess&&guess.k===p.k?' selected':''}>${esc(p.label)}</option>`).join('')}</select></label>
      <div style="display:flex;gap:8px;margin-top:8px"><button data-ls-save="${esc(r.id)}" style="${ST_BTN_SM}">${esc(i18t('st_lessons_save'))}</button><button data-ls-cancel style="${ST_BTN2}">${esc(i18t('act_cancel'))}</button></div></div>`:'';
    return `<div class="st-ls-r" data-ls-row="${esc(r.id)}"><b class="st-ls-said">“${esc(r.text)}”</b><span>${esc(on)}</span><span>${esc(next)}</span>
      <span class="st-ls-acts"><button data-ls-teach="${esc(r.id)}" style="${ST_BTN2}"${open?' aria-expanded="true"':''}>${esc(i18t('st_lessons_teach'))}</button><button data-ls-fine="${esc(r.id)}" style="${ST_BTN2}">${esc(i18t('st_lessons_fine'))}</button></span></div>${teach}`;
  };
  const rows=L.rows||[];
  host.innerHTML=rows.length
    ? `<p class="st-note" style="margin:0 0 8px">${esc(i18tn('st_lessons_week',L.week||0,{ n:L.week||0, days:L.days||90 }))}${L.more?' · '+esc(i18tn('st_lessons_more',L.more,{ n:L.more })):''}</p>${head}${rows.map(row).join('')}`
    : `<p class="st-note" style="margin:0">${esc(i18t('st_lessons_empty'))}</p>`;
  if(taught) taught.innerHTML=(L.taught||[]).length
    ? (L.taught||[]).map(t=>`<div class="st-ls-r st-ls-t"><b class="st-ls-said">“${esc(t.phrase)}”</b><span>${esc(i18t('st_lessons_goes',{ page:stLessonPlaceLabel(t.place) }))}</span><span class="st-note" style="margin:0">${esc(t.by||'')}</span><span class="st-ls-acts"><button data-ls-forget="${esc(t.phrase)}" style="${ST_BTN2}">${esc(i18t('st_words_remove'))}</button></span></div>`).join('')
    : `<p class="st-note" style="margin:0">${esc(i18t('st_lessons_taught_none'))}</p>`;
}
async function stLessonTeach(id){
  stDrawerClearRefusal();
  const r=((_stLessons&&_stLessons.rows)||[]).find(x=>x.id===id); if(!r) return;
  const place=(document.querySelector(`[data-ls-place="${CSS.escape(id)}"]`)||{}).value||'';
  if(!place) return stDrawerRefuse(i18t('st_lessons_pick'));
  try{ await api('jambo/lessons','PUT',{ phrase:r.text, place }); _stLessonOpen=null;
    toast(i18t('st_lessons_taught',{ words:r.text, page:stLessonPlaceLabel(place) }),'ok'); await stLessonsLoad(); }
  catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
}
async function stLessonFine(id){
  stDrawerClearRefusal();
  try{ await api('jambo/unplaced/'+encodeURIComponent(id),'DELETE'); toast(i18t('st_lessons_let_go'),'ok'); await stLessonsLoad(); }
  catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
}
async function stLessonForget(phrase){
  stDrawerClearRefusal();
  try{ await api('jambo/lessons','PUT',{ phrase, remove:true }); toast(i18t('st_lessons_forgot',{ words:phrase }),'ok'); await stLessonsLoad(); }
  catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
}
/* one listener, at load, for the panel's presses (the panel is drawn again on every load) */
if(typeof document!=='undefined') document.addEventListener('click',e=>{
  const t=e.target; if(!t||!t.closest||!t.closest('#st-lessons, #st-lessons-taught')) return;
  let b;
  if((b=t.closest('[data-ls-teach]'))){ const id=b.getAttribute('data-ls-teach'); _stLessonOpen=_stLessonOpen===id?null:id; stLessonsPaint(); return; }
  if((b=t.closest('[data-ls-cancel]'))){ _stLessonOpen=null; stLessonsPaint(); return; }
  if((b=t.closest('[data-ls-save]'))){ stLessonTeach(b.getAttribute('data-ls-save')); return; }
  if((b=t.closest('[data-ls-fine]'))){ stLessonFine(b.getAttribute('data-ls-fine')); return; }
  if((b=t.closest('[data-ls-forget]'))){ stLessonForget(b.getAttribute('data-ls-forget')); return; }
});
/* ---- THE BOARD'S WORD BOOK: the list, the value box, the save ---- */
function stWordMeansText(m){
  if(!m) return '';
  const k=i18t('st_words_k_'+m.kind);
  if(m.kind==='split') return k+': '+((window.hbSplitWord)?hbSplitWord({ by:m.value }):m.value);
  if(m.kind==='measure') return k+': '+i18t('hb_ms_'+m.value);
  if(m.kind==='stage') return k+': '+((typeof statusLabel==='function')?statusLabel(m.value):m.value);
  if(m.kind==='side') return k+': '+i18t(m.value==='supplier'?'hb_lens_suppliers':'hb_lens_customers');
  return k+': '+m.value;
}
function stWordsPaint(){
  const host=document.getElementById('st-words-list'); if(!host) return;
  const list=window.hbWords?hbWords():[];
  const row=(say,means,lang,by,act)=>`<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr) 34px auto;gap:10px;align-items:center;font-size:var(--t-meta)">
    <b style="min-width:0;overflow-wrap:anywhere">${esc(say)}</b><span style="min-width:0">${esc(means)}</span><span class="st-note" style="margin:0">${esc(lang)}</span>${act}</div>`;
  const mine=list.map(w=>row(w.say,stWordMeansText(w.means),String(w.lang||'').toUpperCase(),w.by,
    `<button data-w-del="${esc(w.say)}" data-w-lang="${esc(w.lang)}" style="${ST_BTN2};flex:none">${esc(i18t('st_words_remove'))}</button>`)).join('');
  const built=(window.hbWordsBuiltIn?hbWordsBuiltIn():[]).map(b=>row(b.words.slice(0,4).join(', '),stWordMeansText({ kind:'split', value:b.group }),'EN · SV','',
    `<span class="st-note" style="margin:0">${esc(i18t('st_words_builtin'))}</span>`)).join('');
  host.innerHTML=(mine||`<p class="st-note" style="margin:0">${esc(i18t('st_words_none'))}</p>`)
    +`<details style="margin-top:6px"><summary class="st-note" style="cursor:pointer;margin:0">${esc(i18t('st_words_builtin_h'))}</summary><div style="display:grid;gap:6px;margin-top:6px">${built}</div></details>`;
  host.querySelectorAll('[data-w-del]').forEach(b=>b.addEventListener('click',()=>stWordsSave({ say:b.getAttribute('data-w-del'), lang:b.getAttribute('data-w-lang'), remove:true })));
}
function stWordsValueSlot(){
  const slot=document.getElementById('st-w-value-slot'); if(!slot) return;
  const kind=(document.getElementById('st-w-kind')||{}).value||'set';
  const sel=opts=>`<select id="st-w-value" style="${window.RV_FLD||ST_INPUT}">${opts.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`;
  if(kind==='split') slot.innerHTML=sel(Object.keys(window.HB_WORD_SPLIT||{}).map(g=>[g,(window.hbSplitWord)?hbSplitWord({ by:g }):g]));
  else if(kind==='measure') slot.innerHTML=sel(Object.keys(window.HB_WORD_MEASURE||{}).map(m=>[m,i18t('hb_ms_'+m)]));
  else if(kind==='stage') slot.innerHTML=sel(Object.keys(window.HB_WORD_STAGE||{}).map(st=>[st,(typeof statusLabel==='function')?statusLabel(st):st]));
  else if(kind==='side') slot.innerHTML=sel([['supplier',i18t('hb_lens_suppliers')],['customer',i18t('hb_lens_customers')]]);
  else slot.innerHTML=`<input id="st-w-value" type="text" maxlength="80" placeholder="${esc(i18t(kind==='type'?'st_words_ph_type':'st_words_ph_set'))}" style="${window.RV_FLD||ST_INPUT}"/>`;
}
async function stWordsSave(given){
  stDrawerClearRefusal();
  let body=given;
  if(!body){
    const say=String((document.getElementById('st-w-say')||{value:''}).value).replace(/\s+/g,' ').trim();
    const lang=(document.getElementById('st-w-lang')||{}).value||'en';
    const kind=(document.getElementById('st-w-kind')||{}).value||'set';
    const value=String((document.getElementById('st-w-value')||{value:''}).value).trim();
    if(say.length<2) return stDrawerRefuse(i18t('st_words_bad_say'));
    if(!value) return stDrawerRefuse(i18t('st_words_bad_value'));
    /* a word the board already reads keeps its built-in meaning */
    if(window.hbWordClash&&hbWordClash(say)) return stDrawerRefuse(i18t('st_words_clash',{ word:say }));
    body={ say, lang, means:{ kind, value } };
  }
  try{
    const r=await api('settings/board-words','PUT',body);
    state.settings=state.settings||{}; state.settings.boardWords=(r&&r.boardWords)||[];
    const se=document.getElementById('st-w-say'), ve=document.getElementById('st-w-value');
    if(se) se.value=''; if(ve&&ve.tagName==='INPUT') ve.value='';
    stWordsPaint(); if(typeof stRepaintRow==='function') stRepaintRow('boardwords');
    toast(body.remove?i18t('st_words_removed',{ word:body.say }):i18t('st_words_saved',{ word:body.say }),'ok');
  }catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
}
async function stFxSave(codeIn,rateIn){
  /* A datalist hands back whatever is in the box, and a reader who picks
     "USD — US dollar" from the list gets exactly that string. The code is the
     first three letters of it; the name was only ever there to be searched. */
  const typed=String(codeIn!=null?codeIn:(document.getElementById('st-fx-code')||{value:''}).value).trim().toUpperCase();
  const code=(typed.match(/^[A-Z]{3}\b/)||[typed])[0];
  const raw=rateIn!==undefined&&codeIn!=null?rateIn:(document.getElementById('st-fx-rate')||{value:''}).value;
  const rate=(raw===null||String(raw).trim()==='')?null:Number(raw);
  stDrawerClearRefusal();
  if(!/^[A-Z]{3}$/.test(code)) return stDrawerRefuse(i18t('st_fx_bad_code'));
  if(rate!==null&&!(rate>0)) return stDrawerRefuse(i18t('st_fx_bad_rate'));
  try{
    const r=await api('settings/fx-rates','PUT',{ code, rate });
    state.settings=state.settings||{}; state.settings.fxRates=(r&&r.fxRates)||{};
    const ce=document.getElementById('st-fx-code'), re=document.getElementById('st-fx-rate');
    if(ce) ce.value=''; if(re) re.value='';
    /* The row closes behind a save so the LIST of what is set is what the panel
       reads as; "+ Add a currency" opens it again for the next one. */
    const row=document.getElementById('st-fx-row');
    if(row && rate!==null) row.hidden=true;
    stFxPaint();
    toast(rate===null?i18t('st_fx_removed',{code}):i18t('st_fx_saved',{code}),'ok');
    // every converted figure just moved — repaint whatever is behind the drawer
    if(window.refreshStats) refreshStats();
  }catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
}
/* ---- TWO-STEP SIGN-IN, self-service (WO-6) ---- */
/* AFTER TWO-STEP CHANGES: on the You tab the card and its drawer are redrawn
   where they stand; anywhere else the account drawer opens again, as before */
function stAfterTwoStep(){
  /* opened in its row on the sheet (round 24 as drawn): the section is drawn
     again and the row's form stays open on what is now true */
  if(document.getElementById('set-page') && _stRow && /^me:(twostep|safety)$/.test(_stRow.key)){
    const k=_stRow.key; stRowFormClose(); _stYouFacts.codes=null; _stYouFacts.loaded=false;
    stYouCardRepaint('safety'); stRowFormOpen(k); stYouLoad(); return; }
  if(document.getElementById('set-page') && (_stOpen==='me:safety'||_stOpen==='me:twostep')){
    const k=_stOpen; stYouCardRepaint('safety'); stDrawerOpen(k); return; }
  openMyAccount();
}
async function stTwoStepToggle(){
  const u=currentUser()||{};
  if(u.twoStep){
    const code=await promptDialog({ title:i18t('ts_off_title'), message:i18t('ts_off_msg'),
      placeholder:'123456', confirmLabel:i18t('ts_turn_off'), cancelLabel:i18t('act_cancel') });
    if(code==null) return;
    try{
      await api('me/totp/disable','POST',{ code:String(code).trim() });
      u.twoStep=false; toast(i18t('ts_off_done'),'ok'); stAfterTwoStep();
    }catch(e){ toast((e&&e.message)||i18t('ts_failed'),'err'); }
    return;
  }
  let start;
  try{ start=await api('me/totp/start','POST',{}); }
  catch(e){ toast((e&&e.message)||i18t('ts_failed'),'err'); return; }
  openModal(`<div style="padding:24px">
    <h3 style="margin:0 0 6px;font-size:var(--t-card);font-weight:var(--w-title);font-family:var(--font-heading)">${esc(i18t('ts_enrol_title'))}</h3>
    <p class="st-note" style="margin:0 0 var(--s-1)">${esc(i18t('ts_enrol_msg'))}</p>
    <div style="font-family:var(--font-mono);font-size:var(--t-card);letter-spacing:.14em;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius);padding:10px var(--s-3);margin:var(--s-2) 0;word-break:break-all;user-select:all">${esc(start.secret)}</div>
    <p class="st-note" style="margin:var(--s-2) 0 var(--s-1)">${esc(i18t('ts_enrol_code_msg'))}</p>
    <input id="ts-code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" style="${window.RV_FLD||ST_INPUT}"/>
    <p id="ts-err" class="st-note" style="color:var(--st-ruby-fg);min-height:16px;margin:6px 0 0"></p>
    <div style="display:flex;gap:var(--s-2);justify-content:flex-end;margin-top:var(--s-3)">
      <button data-dlg-cancel id="ts-cancel" style="${ST_BTN2}">${i18t('act_cancel')}</button>
      <button id="ts-confirm" class="ui-btn ui-btn-primary">${i18t('ts_confirm')}</button>
    </div>
  </div>`,{ maxWidth: DLG_W.m });
  document.getElementById('ts-cancel')?.addEventListener('click',()=>closeModal());
  document.getElementById('ts-confirm')?.addEventListener('click',async()=>{
    const code=(document.getElementById('ts-code')?.value||'').trim();
    const errEl=document.getElementById('ts-err');
    try{
      const r=await api('me/totp/verify','POST',{ code });
      const u2=currentUser(); if(u2) u2.twoStep=true;
      closeModal();
      // the ten one-time codes, shown exactly ONCE — the server keeps hashes
      openModal(`<div style="padding:24px">
        <h3 style="margin:0 0 6px;font-size:var(--t-card);font-weight:var(--w-title);font-family:var(--font-heading)">${esc(i18t('ts_recovery_title'))}</h3>
        <p class="st-note" style="margin:0 0 10px">${esc(i18t('ts_recovery_msg'))}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-family:var(--font-mono);font-size:var(--t-body);letter-spacing:.08em;user-select:all">
          ${(r.recovery||[]).map(cd=>`<span style="background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius);padding:6px 10px;text-align:center">${esc(cd)}</span>`).join('')}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:14px">
          <button id="ts-done" class="ui-btn ui-btn-primary">${i18t('ts_done')}</button>
        </div>
      </div>`,{ maxWidth: DLG_W.m });
      document.getElementById('ts-done')?.addEventListener('click',()=>{ closeModal(); toast(i18t('ts_on_done'),'ok'); stAfterTwoStep(); });
    }catch(e){ if(errEl) errEl.textContent=(e&&e.message)||i18t('ts_failed'); }
  });
}
/* HOW OFTEN THIS PERSON IS BRIEFED, read the way the server reads it
   (briefCadence in server/server.js): the stored answer where there is one,
   and otherwise the old tick-box — absent means every morning, and an
   account carrying dailyBrief:false still reads 'off'. One rule, two hosts,
   and nobody's setting moves. */
const BRIEF_EVERY_VALUES = ['daily','weekly','off'];
let _briefGroup = 0;
/* ONE ANSWER, HOWEVER MANY COPIES OF THE CONTROL ARE ON SCREEN. The section
   is drawn on the You tab and again in the drawer over it, so a save has to
   reach both — otherwise closing the drawer reveals a page still showing the
   answer the reader has just changed. */
function briefPaintCadence(v){
  document.querySelectorAll('[data-pref-brief]').forEach(el=>{
    el.checked = el.getAttribute('data-pref-brief')===v;
  });
  document.querySelectorAll('[data-st-brief]').forEach(el=>{ el.value=v; });
}
function briefCadenceOf(u){
  const p=(u&&u.prefs)||{};
  const v=String(p.briefEvery||'').toLowerCase();
  if(BRIEF_EVERY_VALUES.includes(v)) return v;
  return p.dailyBrief===false ? 'off' : 'daily';
}
function openMyAccount(){
  const u=currentUser()||{};
  _stOpen='account';
  stDrawerPaint({
    title:i18t('st_acct_menu'),
    sub:`${u.name||''}${u.email?' · '+u.email:''}`,
    glyph:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
    foot:'done', body:stAccountBodyHtml(), wire:stAccountWire });
}
/* The backup export is the caller's own scoped contracts and works for every
   role — which is why it is on the account surface and not behind the admin
   gate. One writer, two doors (the account drawer and the You tab). */
function settingsExportBackup(){
  downloadFile(`hati-backup-${new Date().toISOString().slice(0,10)}.json`,
    JSON.stringify({ kind:'hati-backup', v:1, exportedAt:nowISO(), org:getOrg(), users:getUsers(),
      data:{ uid, contracts:state.contracts } },null,2));
  try{ lsSet('hati.v1.lastBackup', nowISO()); }catch(e){}
  toast(i18t('set_t_backup_downloaded'));
}

/* ============================================================
   THE PANEL REGISTRY — tabs 2 and 3
   ============================================================
   One descriptor per setting. `state()` is what the row says without being
   opened, `body()` is the drawer, `wire()` is what the drawer's controls do.
   EVERY id inside a body is the id that panel had on the old page, so nothing
   that reaches for one has to learn a new name. */
const stOn=()=>i18t('st_b_on'), stOff=()=>i18t('st_b_off');
const stApiOnly=()=>typeof API_MODE==='function' && API_MODE();
const stLastBackup=()=>{ try{ return lsGet('hati.v1.lastBackup'); }catch(e){ return null; } };

/* THE MAILROOM'S BACKUP PERSON (owner, 22 Oct 2026: "Documents email should
   always have a person assigned to them directly"). A document belongs to the
   colleague who sent it; this names who has it when the sender is not on
   HaTi. Drawn like a lane's own "Its drafts belong to" box, and its default is
   the same one reading the server asks (intakeLaneOwner): the admin who saved
   the Mailroom, else the first admin — so the box always names somebody. */
function stMailroomOwnerSel(m){
  const users=((typeof getUsers==='function')?getUsers():[])||[];
  const me=(typeof currentUser==='function')?currentUser():null;
  /* asked of the stream it files under, unfiled included — the server's own
     test (mailroomOwnerFor): a person who cannot open it is never offered */
  const may=u=>typeof canAccessFolder!=='function' || canAccessFolder(m.folder||'',u);
  const def=(typeof intakeLaneOwner==='function')
    ? intakeLaneOwner({ savedById: m.savedById || (me&&me.id) }, users, may) : null;
  const defWord=def ? i18t(def.how==='saver'?'set_mailroom_owner_saver':'set_mailroom_owner_first',{ name:def.name }) : '\u2014';
  const people=users.filter(u=>u && u.role!=='viewer' && may(u));
  const cur=(m.ownerId && people.some(u=>String(u.id)===String(m.ownerId))) ? String(m.ownerId) : '';
  return `<select id="st-mr-owner" style="${window.RV_FLD||ST_INPUT}width:100%"><option value="">${esc(defWord)}</option>${
    people.map(u=>`<option value="${esc(u.id)}"${cur===String(u.id)?' selected':''}>${esc(u.name||u.email||'')}</option>`).join('')}</select>`;
}
const SET_PANELS={

  /* ---- WHERE THE WORKSPACE OPERATES ----
     The market lived in the top bar as a pair of flag buttons — a workspace-
     level, admin-only setting sitting in the one strip a person's eye crosses a
     hundred times a day. The legal name and registration number are the design
     step's own fields (PUT /api/org/branding); they are STATED here and edited
     where they have always been edited, rather than given a second writer. */
  company:{
    tab:'platform', group:'standards', mandatory:true,
    title:()=>i18t('st_p_company'),
    /* the card's fact is the company itself (round 25 as drawn) */
    fact(){ const ob=(typeof window!=='undefined'&&window.ORG_BRANDING)||null;
      const legal=(ob&&ob.companyName)||(getOrg()&&getOrg().name)||'—';
      return { bare:true, s:[legal, jxName?jxName():jxId(), jxCurrency()].filter(Boolean).join(' · ') }; },
    sub:()=>i18t('st_p_company_sub'),
    state(){
      const ob=(typeof window!=='undefined'&&window.ORG_BRANDING)||null;
      const legal=(ob&&ob.companyName)||'';
      return { dot: legal?'ok':'warn',
        text: `${esc(legal||(getOrg()&&getOrg().name)||'—')} · ${esc(jxName?jxName():jxId())} · ${esc(jxCurrency())}` };
    },
    body(){
      const ob=(typeof window!=='undefined'&&window.ORG_BRANDING)||null;
      return `
      <section class="st-sec">
        <h3 class="st-sec-h">${esc(i18t('set_market'))}</h3>
        <p class="st-note" style="margin-bottom:var(--s-2)">${i18t('set_market_sub')}</p>
        <div style="display:flex;align-items:center;gap:var(--s-3);flex-wrap:wrap">
          <select id="set-market" style="min-width:190px;${window.RV_FLD||ST_INPUT}width:auto">
            ${jxList().map(p=>`<option value="${p.id}"${p.id===jxId()?' selected':''}>${esc(p.name)}</option>`).join('')}
          </select>
          <div id="set-market-facts" style="font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.6">${settingsMarketFactsHtml()}</div>
        </div>
      </section>
      ${''/* ---- THE LINE OF BUSINESS LIVES HERE (12 Oct 2026, the Search list) ----
             It sat in the heading of New agreement's template list, an admin's
             company rule in a person's picker. One writer, the same key. */}
      ${typeof INDUSTRY_TEMPLATES==='object'?`<section class="st-sec">
        <h3 class="st-sec-h">${esc(i18t('set_lob'))}</h3>
        <p class="st-note" style="margin-bottom:var(--s-2)">${esc(i18t('set_lob_sub'))}</p>
        <select id="set-industry" style="min-width:190px;${window.RV_FLD||ST_INPUT}width:auto">
          <option value="">${esc(i18t('wz_not_set'))}</option>${Object.keys(INDUSTRY_TEMPLATES).map(k=>`<option value="${k}"${(typeof workspaceIndustry==='function'&&workspaceIndustry()===k)?' selected':''}>${esc(INDUSTRY_LABEL[k])}</option>`).join('')}
        </select>
      </section>`:''}
      ${''/* ---- THE LEGAL IDENTITY LIVES HERE NOW (C, 14 Aug 2026) ----
             It used to be four unlabelled boxes inside the COMPANY DESIGN step,
             under the logo upload and the accent-colour picker, and this panel
             merely STATED the facts over a button reading "Edit design" — so an
             admin looking for the registered name had no reason to press it and
             would reasonably conclude there was nowhere to enter one. (The
             button was renamed and signposted first, on 14 Aug: that was worth
             doing on its own and is what this replaces.)

             A legal name is not a design decision. It is the same kind of fact
             as the market and the currency — something true about the company
             which happens to get printed on paper — so it sits beside them.

             A MOVE, NOT A COPY: the boxes are GONE from the design step. Two
             places to type one fact is the fault this codebase is built to
             avoid. Same route, same stored record, same fields, no migration.

             THE FOOTER TEXT DID NOT COME. Unlike these three it genuinely is a
             design choice about what prints at the bottom of a page.

             THE SECTION CARRIES ITS OWN SAVE and the panel stays a 'done'
             panel. That is the established shape here — the Copilot engine
             panel and the account page both hold per-section Saves — and it is
             the honest one: the market writes the moment it is changed, these
             three write when you press Save, and one foot cannot promise both.

             NOTHING IS INVENTED FOR A WORKSPACE THAT NEVER FILLED THESE IN.
             The boxes come up empty and the read-outs say "Not set"; the org
             name typed at setup is a display fallback and is NOT promoted into
             the legal name field. */}
      <section class="st-sec">
        <h3 class="st-sec-h">${esc(i18t('st_p_company'))}</h3>
        <p class="st-note" style="margin-bottom:var(--s-2)">${esc(i18t('st_company_legal_sub'))}</p>
        <div style="display:grid;gap:9px">
          <label><span style="${window.RV_LBL||''}">${esc(i18t('st_company_name'))}</span>
            <input id="st-co-name" type="text" maxlength="200" style="${window.RV_FLD||ST_INPUT}"
              placeholder="${esc((getOrg()&&getOrg().name)||'')}" value="${PB_ATTR((ob&&ob.companyName)||'')}"/></label>
          <label><span style="${window.RV_LBL||''}">${esc(i18t('st_reg_number'))}</span>
            <input id="st-co-reg" type="text" maxlength="100" style="${window.RV_FLD||ST_INPUT}"
              value="${PB_ATTR((ob&&ob.registrationNumber)||'')}"/></label>
          <label><span style="${window.RV_LBL||''}">${esc(i18t('st_company_address'))}</span>
            <input id="st-co-addr" type="text" maxlength="500" style="${window.RV_FLD||ST_INPUT}"
              value="${PB_ATTR((ob&&ob.address)||'')}"/></label>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap">
          <button id="st-co-save" style="${ST_BTN_SM}">${i18t('act_save')}</button>
          <span class="st-note" style="margin:0">${esc(i18t('st_company_legal_note'))}</span>
        </div>
      </section>
      ${''/* ---- EXCHANGE RATES (W2-1, owner-ruled 19 Aug 2026) ----
             "I would want for the contract to be converted to local currency
             when it comes to reporting so the dashboards or reporting have
             one currency." So every reporting figure converts — and the rate
             is an ADMIN'S CLAIM WITH A DATE, never a live feed: a headline
             that moves by itself, from an outside service nobody in the
             workspace controls, is a number no admin can stand behind.

             A currency with no rate here is never guessed. Its contracts are
             LEFT OUT of the converted figures and every surface that shows
             one says so — the silent-trim rule the insights panels already
             hold. Sits beside the market because the market is what decides
             which currency is "home". */}
      <section class="st-sec">
        <h3 class="st-sec-h">${esc(i18t('st_fx'))}</h3>
        <p class="st-note" style="margin-bottom:var(--s-2)">${esc(i18t('st_fx_sub',{cur:jxCurrency()}))}</p>
        <div id="st-fx-need"></div>
        <div id="st-fx-list" style="display:grid;gap:6px;margin-bottom:9px"></div>
        ${''/* ---- A SEARCH WITH OPTIONS, AND A BUTTON THAT SAYS THERE CAN BE
               MORE THAN ONE (owner-asked 19 Aug 2026: "there should be a search
               for currency where options are available and you should have a
               button to add more currencies in case you have contracts from
               other currencies") ----

               THE BOX WAS A BARE THREE-LETTER FIELD, so setting a rate meant
               knowing the ISO code by heart, and one row with a Save on it gave
               no sign that a workspace can hold as many rates as it has
               currencies. Now: a list to SEARCH (code and English name, native
               datalist so typing filters it), and an explicit **Add a currency**
               button that opens the row — closed again after each save, so the
               list of what is set stays the thing you read.

               IT OFFERS, IT DOES NOT REFUSE. The field is still ordinary text
               and any three-letter code is still accepted by both this panel
               and the route: a counterparty who invoices in something nobody
               listed must still be payable. What the list changes is how easy
               the common case is, never what is possible.

               AND THE CURRENCIES YOUR OWN BOOK USES COME FIRST — fxPickerCodes
               leads with the ones fxMissing reports, which is the same reading
               every surface uses to say what was left out of a converted
               figure. That is the owner's "in case you have contracts from
               other currencies", answered with this workspace's own facts. */}
        <button id="st-fx-add" style="${ST_BTN2}">&#43; ${i18t('st_fx_add')}</button>
        <div id="st-fx-row" hidden style="display:flex;gap:var(--s-2);align-items:flex-end;flex-wrap:wrap;margin-top:9px">
          <label style="flex:1 1 210px;min-width:180px"><span style="${window.RV_LBL||''}">${esc(i18t('st_fx_code'))}</span>
            ${''/* THE VALUE IS UPPERCASED, THE PROMPT IS NOT. text-transform
                   catches the placeholder too, so the search hint rendered as
                   "SEARCH — USD, EURO, RAND…" — a shout where a prompt was
                   meant, and wide enough to be clipped besides. The pseudo-
                   element rule that exempts it lives in index.html, because an
                   inline style cannot reach a ::placeholder. */}
            <input id="st-fx-code" type="text" list="st-fx-codes" autocomplete="off"
              placeholder="${esc(i18t('st_fx_code_ph'))}" style="${window.RV_FLD||ST_INPUT}"/></label>
          <datalist id="st-fx-codes"></datalist>
          <label style="flex:1;min-width:150px"><span style="${window.RV_LBL||''}">${esc(i18t('st_fx_rate',{cur:jxCurrency()}))}</span>
            <input id="st-fx-rate" type="number" step="any" min="0" placeholder="129.50" style="${window.RV_FLD||ST_INPUT}"/></label>
          <button id="st-fx-save" style="${ST_BTN_SM};flex:none">${i18t('act_save')}</button>
        </div>
        <p class="st-note" style="margin-top:var(--s-2)">${esc(i18t('st_fx_note'))}</p>
      </section>
      <section class="st-sec">
        <h3 class="st-sec-h">${esc(i18t('st_p_design'))}</h3>
        <p class="st-note" style="margin-bottom:var(--s-2)">${esc(i18t('st_company_design_sub'))}</p>
        <button id="st-company-design" style="${ST_BTN2}">${i18t('st_company_design_btn')}</button>
      </section>`;
    },
    wire(){
      /* THE MARKET. jxSet writes the local key, the org record and the server.
         What it changes ON THIS PANEL is three lines under the dropdown; what it
         changes on the page behind is the approval rules (their thresholds are
         money) and the review gate (its box is labelled with the currency).
         Those, and nothing else — the page holds still. */
      document.getElementById('set-industry')?.addEventListener('change',e=>{
        state.settings=state.settings||{};
        state.settings.industry=e.target.value||undefined;
        if(typeof saveSettings==='function') saveSettings();
        toast(i18t('set_lob_saved'),'ok');
      });
      document.getElementById('set-market')?.addEventListener('change',e=>{
        const langWas=(typeof langId==='function'?langId():null);
        if(!window.jxSet || !jxSet(e.target.value)) return;
        if(window.setRegion && window.regionCodeFor) setRegion(regionCodeFor(jxId()),{silent:true});
        /* THE ONE CASE THAT IS NOT A PATCH. Since 9 Oct 2026 jxSet keeps the
           reader's own language when the market moves (the market is the
           company's, the language the person's), so this redraw is only for a
           language that moved some other way — patching three lines would
           leave a half-translated screen. */
        if((typeof langId==='function'?langId():null)!==langWas){
          toast(i18t('set_market_saved')); renderTeam(); stDrawerOpen('company'); return;
        }
        const facts=document.getElementById('set-market-facts');
        if(facts) facts.innerHTML=settingsMarketFactsHtml();
        if(typeof renderApprovalRules==='function') renderApprovalRules();
        if(typeof renderReviewGatePanel==='function') renderReviewGatePanel();
        toast(i18t('set_market_saved'));
      });
      /* ---- THE LEGAL IDENTITY, SAVED FROM ITS OWN SECTION ----
         THREE KEYS AND NOTHING ELSE. saveOrgBranding carries whatever it is
         given and the route leaves alone what it is not given, so a save from
         here cannot touch the logo, the accent colour or the layout — which the
         design step owns and which this panel has no business writing. A save
         that sent the whole record back would revert whatever the design step
         did last, and it would do it silently.

         REFUSALS GO IN THE DRAWER, in words, in the foot — never a toast over
         the page behind. The server refuses a non-admin here (an Editor keeps
         the design and loses the identity, deliberately: this is the name that
         appears on executed paper), and this panel is admin-only anyway, so
         that refusal is the wall rather than the sign. */
      document.getElementById('st-co-save')?.addEventListener('click',async()=>{
        const g=id=>(document.getElementById(id)||{value:''}).value.trim();
        const btn=document.getElementById('st-co-save');
        stDrawerClearRefusal();
        if(btn) btn.disabled=true;
        try{
          await saveOrgBranding({ companyName:g('st-co-name'), registrationNumber:g('st-co-reg'), address:g('st-co-addr') });
          toast(i18t('st_company_legal_saved'));
          /* The ROW behind the drawer states the legal name without being
             opened, so it has to be repainted — but the page holds still (this
             panel's own rule): repaint the ONE row, never the screen. */
          stRepaintRow('company');
        }catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
        finally{ if(btn) btn.disabled=false; }
      });
      document.getElementById('st-company-design')?.addEventListener('click',()=>{
        stDrawerClose(); openDesignStep({ mode:'settings', onBack:()=>renderTeam() });
      });
      stFxPaint();
      /* WITH NOTHING ON FILE THE ROW IS ALREADY OPEN: a panel whose only
         content is a button to reveal the only thing on it is a press that
         buys nothing. */
      const fxRow=document.getElementById('st-fx-row');
      const fxHas=Object.keys((state.settings&&state.settings.fxRates)||{}).length;
      if(fxRow && !fxHas) fxRow.hidden=false;
      document.getElementById('st-fx-add')?.addEventListener('click',()=>{
        if(!fxRow) return;
        fxRow.hidden=false;
        document.getElementById('st-fx-code')?.focus();
      });
      document.getElementById('st-fx-save')?.addEventListener('click',()=>stFxSave());
    },
  },

  /* ---- THE LIST HaTi FILES INTO ----
     Built-in folders are HaTi's own and are stated as such: they have no store
     to be renamed into (they are literals every screen reads), so offering a
     rename that would not survive a reload would be a control wired to nothing.
     Custom folders DO have a store and are renameable and removable — and a
     removal is refused while the folder still holds contracts, because the
     contracts would be filed under an id no picker offers. */
  folders:{
    tab:'platform', group:'standards', mandatory:false,
    title:()=>i18t('st_p_folders'),
    /* the card's fact: how many streams, how many private (round 25 as drawn) */
    fact(){ const all=Object.values(FOLDERS||{}).filter(f=>f&&f.id), priv=all.filter(f=>{ const p=stPsSaved(f.id); return p&&p.on; }).length;
      return { bare:true, dot:'ok', s:i18tn('st_cf_streams',all.length,{ n:all.length })+(priv?' · '+i18tn('st_cf_private',priv,{ n:priv }):'') }; },
    sub:()=>i18t('st_p_folders_sub'),
    state(){ const n=Object.keys(FOLDERS).length;
      return { dot:'ok', text:i18tn('st_p_folders_n',n,{n})+' · '+Object.values(FOLDERS).slice(0,3).map(f=>esc(f.name)).join(', ')+(n>3?'…':'') }; },
    body(){ return `<div id="st-folder-list"></div>
      <div style="display:flex;gap:var(--s-2);margin-top:10px;align-items:flex-end">
        <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${esc(i18t('st_p_folders_add'))}</span>
          <input id="st-folder-new" type="text" style="${window.RV_FLD||ST_INPUT}"/></label>
        <button id="st-folder-add" style="${ST_BTN_SM}">${i18t('set_add')}</button>
      </div>
      <p class="st-note" style="margin-top:10px">${esc(i18t('st_p_folders_body'))}</p>
      ${''/* ---- WHERE A FOLDER YOU MAKE ACTUALLY LIVES ----
           This note used to say the opposite, and it was right to: addCustomFolder
           wrote to this browser's own storage and no colleague ever learned of the
           stream. Since 17 Sep a stream is the company's (saveValueStreams →
           PUT /api/settings/filing), so the sentence is REPLACED rather than
           removed — a false line in a settings drawer is worse than a loud one.
           `st_p_folders_local` stays inert in both books; the row itself says
           which streams are still only in this browser, and offers the press. */}
      <p class="st-note" style="margin-top:6px">${esc(i18t('st_p_folders_shared_note'))}</p>

      ${''/* ---- AND CATEGORIES, ON THE SAME PANEL ----
           They are the other half of one question — how this company files its
           paper — and a reader looking for "where do I add a category" has
           exactly one place to look. Built-ins are stated and cannot be
           renamed or removed: they have no store to be renamed into. */}
      <div class="st-sec">
        <h3 class="st-sec-h">${esc(i18t('st_p_cats'))}</h3>
        <div id="st-cat-list"></div>
        <div style="display:flex;gap:var(--s-2);margin-top:10px;align-items:flex-end">
          <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${esc(i18t('st_p_cats_add'))}</span>
            <input id="st-cat-new" type="text" style="${window.RV_FLD||ST_INPUT}"/></label>
          <button id="st-cat-add" style="${ST_BTN_SM}">${i18t('set_add')}</button>
        </div>
        <p class="st-note" style="margin-top:10px">${esc(i18t('st_p_cats_body'))}</p>
      </div>`; },
    wire(){ stPaintFolders(); stPaintCategories(); stPsLoad(); },
  },

  /* ════ WHO MUST SAY YES BEFORE SIGNING — ONE RULES PAGE (4 Oct 2026, the
     process review) ════════════════════════════════════════════════════
     Nine rules stand between a contract and its signature, or beside it,
     and each lived in its own drawer, a person's drawer, or nowhere: nobody
     could read in one place what this workspace asks before anyone signs.
     This drawer READS them, in the order signBlockers asks them, and points
     at where each one is set. It writes nothing and decides nothing — every
     on/off is the rule's own reading (stRulesRows). A row, not a band. */
  rules:{
    tab:'platform', group:'agreement', mandatory:false,
    title:()=>i18t('st_p_rules'),
    sub:()=>i18t('st_p_rules_sub'),
    state(){ const rows=stRulesRows().filter(r=>r.holds);
      const on=rows.filter(r=>r.on).length;
      return { dot:'ok', text:esc(i18t('st_rules_state',{ n:on, of:rows.length })) }; },
    find:()=>stRulesRows().map(r=>r.name),
    body(){ return `<div id="st-rules-list"></div>`; },
    wire(){ stPaintRules(); },
  },

  approvals:{
    tab:'platform', group:'agreement', mandatory:true,
    title:()=>i18t('st_p_approvals'),
    sub:()=>i18t('st_p_approvals_sub'),
    state(){ const rules=(typeof approvalRules==='function'?approvalRules():[]).slice().sort((a,b)=>(a.order||99)-(b.order||99));
      return { dot:rules.length?'ok':'warn',
        text:rules.length?rules.map(r=>esc(condLabel(r.cond))).join(' · '):i18t('set_no_approval_rules') }; },
    chip(){ const n=(typeof approvalRules==='function'?approvalRules():[]).length; return n?String(n):''; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('set_rules_sub')}</p>
      <div id="approval-rules"></div>
      <button id="ar-add" style="margin-top:var(--s-2);${ST_BTN2};border-color:transparent;background:var(--surface-2);color:var(--color-text);border-radius:999px">${icon('plus','w-3.5 h-3.5')} ${i18t('set_add_rule_btn')}</button>
      ${''/* THE SIGNING LIMIT AND THE FOLDER RULE LEFT THIS DRAWER (4 Oct 2026,
             the process review) for rows of their own under "Before anyone
             signs" — see signcap and signfolder. THE OVERSEER SWITCH left it
             on 23 Sep: a named person's yes is set on each person, and a
             person nobody has answered for reads the old workspace switch as
             their DEFAULT — said on the rules page (stRulesRows). */}`; },
    wire(){
      renderApprovalRules();
      document.getElementById('ar-add')?.addEventListener('click',()=>openApprovalRuleEditor(-1));
    },
  },

  /* Availability only — a STATEMENT, not a switch, because there is no
     workspace on/off flag behind Copilot: it answers when there is a key and
     falls back to the built-in interpreter when there is not. A tick box wired
     to nothing is forbidden here, so the row says which of those is true and
     points at the one control that changes it. */
  copilot:{
    tab:'platform', group:'copilot', mandatory:false,
    title:()=>i18t('st_p_copilot'),
    /* "Jambo · On · 5,000 calls a day at most" (round 25 as drawn, said in
       CALLS — owner's answer (4): Jambo's costs are never money): the
       engine's own daily ceiling on calls, where one is set */
    fact(){ const on=(typeof copilotAvailable==='function')&&copilotAvailable();
      const cap=Math.floor(Number(((state.aiCfg||{}).limits||{}).dailyLimit||0));
      let n=String(cap); try{ n=cap.toLocaleString((typeof langLocale==='function')?langLocale():undefined); }catch(_){ /* plain digits */ }
      return { n:i18t('st_side_jambo'), s:i18t(on?'st_sh_on':'st_sh_off')+(on&&cap>0?' · '+i18tn('st_cf_day_calls',cap,{ n }):'') }; },
    sub:()=>i18t('st_p_copilot_sub'),
    state(){ const on=(typeof copilotAvailable==='function')&&copilotAvailable();
      return { dot:on?'ok':'off', text:`${i18t('st_p_copilot_on')} — ${on?stOn():stOff()}` }; },
    body(){ const on=(typeof copilotAvailable==='function')&&copilotAvailable();
      return `<div class="st-quiet"><b>${i18t('st_p_copilot_on')} — ${on?stOn():stOff()}</b><br>${i18t('set_engine_sub')}</div>
        <p class="st-note" style="margin-top:9px">${esc(i18t('st_p_copilot_engine_note'))}</p>
        <button id="st-copilot-engine" style="margin-top:6px;${ST_BTN2}">${esc(i18t('st_b_engine'))}</button>`; },
    wire(){ document.getElementById('st-copilot-engine')?.addEventListener('click',()=>{ settingsGoTab('build'); stDrawerOpen('engine'); }); },
  },

  /* ---- COPILOT'S AGENTS (27 Sep 2026: "implement all the fixes") ----
     One row per agent: on or off, the hour it runs, how much it may do in one
     run and spend in a day, and its own rule — No link to sign warns this many
     days before a link runs out, Late promises readies the firmer chase this
     many days after the first. RULES LIVE HERE, never on the agents' page
     (THE CHEAPEST CHANNEL). Read and written through js/agentruns.js; the
     server validates every value (PUT /api/agents/:k/settings). */
  agents:{
    tab:'platform', group:'copilot', mandatory:false,
    title:()=>i18t('st_p_agents'),
    /* "7 of 7 on, all Ask me first" (round 25 as drawn): how many work, and
       how far they may go, read off the agents' own status */
    fact(){ const s=(typeof agentsStatus==='function')?agentsStatus():null; if(!s||!s.agents) return null;
      const all=Object.values(s.agents), on=all.filter(a=>a&&a.on);
      const lv=[...new Set(on.map(a=>a.level||'ask'))];
      return { s:i18t('st_agents_on',{ n:on.length, of:all.length })+(on.length?', '+(lv.length===1?i18t('st_cf_agents_all',{ level:i18t('st_agents_lv_'+lv[0]) }):i18t('st_cf_agents_mixed')):'') }; },
    sub:()=>i18t('st_p_agents_sub'),
    state(){ const s=(typeof agentsStatus==='function')?agentsStatus():null;
      if(!s||!s.agents) return { dot:'off', text:i18t('st_p_agents_sub') };
      const all=Object.values(s.agents), on=all.filter(a=>a&&a.on).length;
      return { dot:on?'ok':'off', text:i18t('st_agents_on',{ n:on, of:all.length }) }; },
    find:()=>['round','link','renew','paper','late','import'].map(k=>i18t('ag_'+k)).concat([i18t('st_p_book'),i18t('st_book_terms'),i18t('jh_pt_h')]),
    /* READ THE WHOLE BOOK (Charts That Explain, rec 7, 5 Oct 2026): the
       overnight reading of every contract's key terms and its check against
       our standards is an overnight agent, so it sits with them — under the
       agents, its own section, ON by default (pilots, 6 Oct), its cost said beside the
       switch (GET/PUT /api/board/reading, Run now POST …/run). The Copilot
       group stays four rows (f467). */
    body(){ return `<div id="st-agents-panel"></div>
      <section class="st-sec" style="margin-top:var(--s-4)"><h3 class="st-sec-h">${esc(i18t('st_p_book'))}</h3>
      <p class="st-note" style="margin-bottom:10px">${esc(i18t('st_book_note'))}</p><div id="st-book">${esc(i18t('st_acc_loading'))}</div></section>`; },
    wire(){ stAgentsPaint(); stBookLoad(); },
  },

  /* ---- THE BOARD'S WORD BOOK (the board that answers right, Part 3, 5 Oct
     2026) ----
     The company's own words and what Home's board reads them as. Written only
     through PUT /api/settings/board-words; the built-in words are drawn
     read-only from the board's own reader (hbWordsBuiltIn), never a copy. A
     word the board already reads is refused here with the reason. */
  boardwords:{
    tab:'platform', group:'copilot', mandatory:false,
    title:()=>i18t('st_p_words'),
    sub:()=>i18t('st_p_words_sub'),
    state(){ const n=(window.hbWords?hbWords():[]).length;
      return { dot:n?'ok':'off', text:i18tn('st_words_n',n,{ n }) }; },
    find:()=>[i18t('st_words_say'),i18t('st_words_means')],
    body(){ return `<p class="st-note" style="margin-bottom:10px">${esc(i18t('st_words_note'))}</p>
      <div id="st-words-list" style="display:grid;gap:6px"></div>
      <section class="st-sec" style="margin-top:var(--s-3)">
        <h3 class="st-sec-h">${esc(i18t('st_words_add'))}</h3>
        <div style="display:grid;grid-template-columns:minmax(0,1.2fr) 72px;gap:8px">
          <label><span style="${window.RV_LBL||''}">${esc(i18t('st_words_say'))}</span><input id="st-w-say" type="text" maxlength="40" style="${window.RV_FLD||ST_INPUT}"/></label>
          <label><span style="${window.RV_LBL||''}">${esc(i18t('st_words_lang'))}</span><select id="st-w-lang" style="${window.RV_FLD||ST_INPUT}"><option value="en">EN</option><option value="sv">SV</option></select></label>
        </div>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:8px;margin-top:8px">
          <label><span style="${window.RV_LBL||''}">${esc(i18t('st_words_means'))}</span><select id="st-w-kind" style="${window.RV_FLD||ST_INPUT}">${(window.HB_WORD_KINDS||[]).map(k=>`<option value="${k}">${esc(i18t('st_words_k_'+k))}</option>`).join('')}</select></label>
          <label><span style="${window.RV_LBL||''}">${esc(i18t('st_words_value'))}</span><span id="st-w-value-slot"></span></label>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button id="st-w-add" style="${ST_BTN_SM}">${esc(i18t('st_words_add_btn'))}</button><button id="st-w-review" style="${ST_BTN2}">${esc(i18t('st_words_from_review'))}</button></div>
      </section>`; },
    wire(){ stWordsPaint(); stWordsValueSlot();
      document.getElementById('st-w-kind')?.addEventListener('change',stWordsValueSlot);
      document.getElementById('st-w-add')?.addEventListener('click',()=>stWordsSave());
      document.getElementById('st-w-review')?.addEventListener('click',()=>stDrawerOpen('boardaccuracy')); },
  },

  /* ---- WHAT JAMBO COULD NOT PLACE (round 8 "The SAP way", owner's yes 29 Oct 2026: no names, kept 90 days) ----
     A table of the sentences typed in a Jambo box that no free reader moved, after which the person went to another
     page themselves: the words, where they were typed, where the person went. No person is on a row (the server
     keeps none). Teach says which page the words mean (PUT /api/jambo/lessons) — every box then moves there free —
     and Fine lets a row go. Admins only, and only where there is a server. */
  lessons:{
    tab:'platform', group:'facts', mandatory:false, show:stApiOnly,
    title:()=>i18t('st_p_lessons'),
    sub:()=>i18t('st_lessons_sub'),
    state(){ const n=(_stLessons&&_stLessons.total)||0, t=(_stLessons&&_stLessons.taught||[]).length;
      return { dot:n||t?'ok':'off', text:n?i18tn('st_lessons_n',n,{ n }):(t?i18tn('st_lessons_taught_n',t,{ n:t }):i18t('st_lessons_none')) }; },
    find:()=>[i18t('st_lessons_find'),i18t('st_lessons_teach')],
    body(){ return `<p class="st-note" style="margin-bottom:10px">${esc(i18t('st_lessons_note'))}</p>
      <div id="st-lessons">${esc(i18t('st_acc_loading'))}</div>
      <section class="st-sec" style="margin-top:var(--s-3)"><h3 class="st-sec-h">${esc(i18t('st_lessons_taught_h'))}</h3><div id="st-lessons-taught"></div></section>`; },
    wire(){ stLessonsLoad(); },
  },

  /* ---- COPILOT ACCURACY (the board that answers right, Part 7, 5 Oct
     2026) ----
     The board's scorecard, for admins: the free reader's book and pass mark,
     Copilot's weekly score over the book's own contracts, the disconnects
     caught this week, Copilot's misses, and what people marked wrong — each
     with its next step. Read through GET /api/board/accuracy; a row is
     settled through PATCH /api/board/feedback/:id. Nothing here changes the
     board itself. */
  boardaccuracy:{
    tab:'platform', group:'copilot', mandatory:false,
    title:()=>i18t('st_p_acc'),
    sub:()=>i18t('st_p_acc_sub'),
    state(){ const a=_stAcc; if(!a) return { dot:'off', text:i18t('st_p_acc_sub') };
      const r=a.run&&a.run.result; if(a.noKey&&!(r&&r.total)) return { dot:'off', text:i18t('st_acc_not_measured') };
      return r&&r.total?{ dot:r.hits/r.total>=0.95?'ok':'warn', text:i18t('st_acc_state',{ pct:Math.round(r.hits/Math.max(1,r.asked||r.total)*100), n:(a.rows||[]).length }) }:{ dot:'off', text:i18t('st_acc_not_run') }; },
    find:()=>[i18t('st_acc_misses'),i18t('st_acc_marked')],
    body(){ return `<p class="st-note" style="margin-bottom:10px" id="st-acc-sub">${esc(i18t('st_acc_loading'))}</p><div id="st-acc"></div>`; },
    wire(){ stAccLoad(); },
  },

  review:{
    tab:'platform', group:'agreement', mandatory:false,
    title:()=>i18t('st_p_review'),
    sub:()=>i18t('rv_set_sub'),
    state(){ const c=(window.reviewGateCfg?reviewGateCfg():{on:false});
      return { dot:c.on?'ok':'off', text:`${i18t('rv_set_on')} — ${c.on?stOn():stOff()}` }; },
    /* round 25 as drawn: "Internal review · 2 people checked" — counted as
       the access sheet's "Checked before sending" column counts them */
    fact(){ const c=(window.reviewGateCfg?reviewGateCfg():{on:false}); if(!c.on) return null;
      const n=stUsers().filter(u=>u.role!=='viewer'&&(typeof reviewChecked==='function')&&reviewChecked(u)).length;
      return { s:i18tn('st_cf_review_n',n,{ n }) }; },
    body(){ return `<div id="rv-gate-panel"></div>`; },
    wire(){ renderReviewGatePanel(); },
  },

  /* ---- THE CHECK BEFORE SIGNING, BESIDE THE REVIEW GATE (13 Sep 2026) ----
     Three settings and OFF is the default: the card informs and blocks nothing
     until an admin says otherwise. It sits next to the review gate because it
     is the same kind of rule — a step the organisation may require before
     something leaves or is signed — and a reader looking for one will be
     looking in the same place for the other. */
  signcheck:{
    tab:'platform', group:'signing', mandatory:false,
    title:()=>i18t('sc_set_title'),
    sub:()=>i18t('sc_set_sub'),
    state(){ const g=(window.signCheckGate?signCheckGate():'off');
      return { dot:g==='off'?'off':'ok', text:`${i18t('sc_set_title')} — ${i18t('sc_set_'+g)}` }; },
    /* ---- AND WHO RUNS THE SIGNING ON AN UPLOAD (26 Sep 2026, decision 3) ----
       The answer ticked by default when somebody uploads the other side's
       contract: we sign it in HaTi, or they sign it their way and we file the
       signed copy. Two answers, and the factory one is what every upload did
       before the question existed, so nothing moves on the day of the deploy.
       IN THIS DRAWER, NOT A ROW OF ITS OWN: it is the same kind of rule — how a
       contract gets to signed — and a row of its own made this group five long,
       where the page's own rule is that no group is a wall (settings-groups 1c).
       `find` puts its words in the search, so it is found by what it says. */
    body(){ return `<div id="sc-gate-panel"></div>`; },
    wire(){ renderSignCheckGatePanel(); },
  },

  /* ---- HOW MUCH EACH PERSON MAY SIGN FOR — ITS OWN ROW (4 Oct 2026) ----
     It was a switch inside the approval rules' drawer. WARN BEFORE ENFORCE:
     off by default, and the ladder is a record until it is on. */
  signcap:{
    tab:'platform', group:'signing', mandatory:false,
    title:()=>i18t('sc_rule_title'),
    sub:()=>i18t('sc_rule_sub'),
    /* "Signing limits · On, 8 people capped" (round 25 as drawn): how many
       who sign have a figure set — signCapOf's own answer, never a count of
       its own; admins are never capped and viewers never sign (stSigners) */
    fact(){ const on=(typeof signCapEnforced==='function')&&signCapEnforced();
      if(!on) return null;
      const n=stSigners().filter(u=>{ try{ const c=signCapOf(u); return c.answered&&c.limit!=null; }catch(_){ return false; } }).length;
      return n?{ s:i18tn('st_cf_capped',n,{ n }) }:null; },
    state(){ const on=(typeof signCapEnforced==='function')&&signCapEnforced();
      return { dot:on?'ok':'off', text:`${esc(i18t('sc_rule_on'))} — ${on?stOn():stOff()}` }; },
    body(){ return `<label class="st-toggle" style="margin-bottom:var(--s-2)">
        <input id="sc-rule-on" type="checkbox"${((typeof signCapEnforced==='function')&&signCapEnforced())?' checked':''}/>
        <span><span class="st-role-name">${esc(i18t('sc_rule_on'))}</span></span></label>
      <div style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text);margin:10px 0 6px">${esc(i18t('sc_ladder'))}</div>
      <div id="sc-ladder"></div>`; },
    wire(){
      stPaintLadder();
      document.getElementById('sc-rule-on')?.addEventListener('change',e=>{
        if(typeof saveSignCapCfg!=='function') return;
        saveSignCapCfg({ on:e.target.checked });
        toast(i18t('sc_rule_saved'),'ok');
        /* The ladder's own sentences change with the switch (a limit that is
           recorded and a limit that refuses are different facts). */
        stPaintLadder(); stRepaintRow('signcap');
      });
    },
  },

  /* ---- WHICH VALUE STREAMS EACH PERSON MAY SIGN IN — ITS OWN ROW (4 Oct
     2026) ---- It was the second switch inside the approval rules' drawer.
     The narrowing itself is set on each person; this is the switch that
     makes it refuse, and the list of who is narrowed today. */
  signfolder:{
    tab:'platform', group:'signing', mandatory:false,
    title:()=>i18t('sf_rule_title'),
    sub:()=>i18t('sf_rule_sub'),
    state(){ const on=(typeof signFolderEnforced==='function')&&signFolderEnforced();
      return { dot:on?'ok':'off', text:`${esc(i18t('sf_rule_on'))} — ${on?stOn():stOff()}` }; },
    body(){ return `<label class="st-toggle" style="margin-bottom:var(--s-2)">
        <input id="sf-rule-on" type="checkbox"${((typeof signFolderEnforced==='function')&&signFolderEnforced())?' checked':''}/>
        <span><span class="st-role-name">${esc(i18t('sf_rule_on'))}</span></span></label>
      <div id="sf-people"></div>`; },
    wire(){
      stPaintSignFolders();
      document.getElementById('sf-rule-on')?.addEventListener('change',e=>{
        if(typeof saveSignFolderCfg!=='function') return;
        saveSignFolderCfg({ on:e.target.checked });
        toast(i18t('sf_rule_saved'),'ok');
        stPaintSignFolders(); stRepaintRow('signfolder');
      });
    },
  },

  /* ---- WHO RUNS THE SIGNING ON AN UPLOAD — ITS OWN ROW (4 Oct 2026) ----
     The answer ticked by default when somebody uploads the other side's
     contract: we sign it in HaTi, or they sign it their way and we file the
     signed copy. It lived inside the check before signing's drawer, found
     only by search; it is the same KIND of rule — how a contract gets to
     signed — so it sits in the same group, by its own name. */
  signroute:{
    tab:'platform', group:'signing', mandatory:false,
    title:()=>i18t('ho_set_title'),
    sub:()=>i18t('ho_set_sub'),
    state(){ const out=(state.settings&&state.settings.signRouteDefault)==='outside';
      return { dot:'ok', text:esc(i18t(out?'ho_route_out':'ho_route_in')) }; },
    body(){ return `<div id="ho-route-panel"></div>`; },
    wire(){ renderSignRouteDefaultPanel(); },
  },

  /* ---- NAMED GUESTS: A LINK MAY ASK WHO IS OPENING IT (idea 8, 4 Oct 2026)
     ---- The guest list was already built: participants.js holds several named
     people per outside party and the send screen mints one link each. This is
     the door — off by default, like every other wall in this product, so not
     one link behaves differently until an admin says so and no workspace needs
     a migration. The SERVER reads the stored rule and refuses the payload; the
     switch here is what an admin presses, not what decides. */
  linkcode:{
    tab:'platform', group:'links', mandatory:false,
    title:()=>i18t('set_link_code'),
    sub:()=>i18t('set_link_code_sub'),
    state(){ const c=(window.linkCodeCfg?linkCodeCfg():{on:false});
      return { dot:c.on?'ok':'off', text:`${i18t('set_link_code')} — ${c.on?stOn():stOff()}` }; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('set_link_code_sub')}</p><div id="lc-rule-panel"></div>`; },
    find:()=>[i18t('set_link_code'), i18t('set_link_code_sub')],
    wire(){ renderLinkCodePanel(); },
  },

  /* ---- THE COMPANY'S FACTS (Discover stage 4, owner 25 Oct 2026: "any admin")
     ---- Questions the company keeps asking of every contract: each one on is
     read for every contract that arrives, in one read, and stands in Key terms.
     The rules an answer is judged against are written here. The server holds
     both (PUT /api/columns/:id, admin only); this panel shows and presses. */
  facts:{
    tab:'platform', group:'facts', mandatory:false,
    title:()=>i18t('fa_title'),
    sub:()=>i18t('fa_sub'),
    state(){ return (typeof window.askColFactsState==='function') ? askColFactsState() : { dot:'off', text:i18t('fa_title') }; },
    find:()=>[i18t('fa_title'), i18t('fa_sub')],
    body(){ return `<div id="fa-panel"></div>`; },
    wire(){ if(typeof window.askColFactsPanelWire==='function') askColFactsPanelWire(); },
  },

  desk:{
    tab:'platform', group:'agreement', mandatory:false,
    title:()=>i18t('st_p_desk'),
    sub:()=>i18t('dk_set_sub'),
    state(){ const c=(window.deskCfg?deskCfg():{on:false});
      return { dot:c.on?'ok':'off', text:`${i18t('dk_set_on')} — ${c.on?stOn():stOff()}` }; },
    body(){ return `<div id="dk-rule-panel"></div>`; },
    wire(){ renderDeskRulePanel(); },
  },

  /* ---- THE MAILROOM (S1 of HaTi's Next Fifteen, 16 Sep 2026) ----
     *"Forwarded contracts land in the queue HaTi already has."* — no Mailroom
     page, no nav door, no new tile. This panel is the whole of its surface.

     ONE SHARED SECRET, AND AN ADMIN CAN ROTATE IT. HaTi does not poll anybody's
     inbox and holds nobody's mail password: an inbound-email provider is
     pointed at /api/mailroom and sends this key in a header. Rotating it is one
     press, and the old key stops working the moment it is saved.

     THE KEY IS SHOWN, DELIBERATELY. It has to be pasted into another system's
     settings, and a secret nobody can read is a secret nobody can install. It
     is admin-only, like every other row on this tab.

     TURNING IT OFF IS EMPTYING IT, and the route answers 404 rather than 401 —
     a workspace that has not set this up should not tell a caller that the
     feature exists. */
  mailroom:{
    tab:'platform', group:'intake', mandatory:false,
    title:()=>i18t('st_p_mailroom'),
    sub:()=>i18t('set_mailroom_sub'),
    state(){
      const m=(state.settings&&state.settings.mailroom)||{};
      return { dot:m.key?'ok':'off', text: m.key?i18t('set_mailroom_on'):i18t('set_mailroom_off') };
    },
    body(){
      const m=(state.settings&&state.settings.mailroom)||{};
      const streams=(typeof visibleFolders==='function')?visibleFolders():[];
      const url=(()=>{ try{ return location.origin+'/api/mailroom'; }catch(_){ return '/api/mailroom'; } })();
      return `<label style="display:block;margin-bottom:var(--s-3)"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600)">${esc(i18t('set_mailroom_url'))}</span>
        <input id="st-mr-url" type="text" readonly value="${esc(url)}" style="${window.RV_FLD||ST_INPUT}width:100%;font-family:var(--font-mono)"/></label>
      <label style="display:block;margin-bottom:var(--s-3)"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600)">${esc(i18t('set_mailroom_key'))}</span>
        <input id="st-mr-key" type="text" value="${esc(m.key||'')}" placeholder="${esc(i18t('set_mailroom_key_ph'))}" style="${window.RV_FLD||ST_INPUT}width:100%;font-family:var(--font-mono)"/></label>
      <label style="display:block;margin-bottom:var(--s-3)"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600)">${esc(i18t('set_mailroom_folder'))}</span>
        <select id="st-mr-folder" style="${window.RV_FLD||ST_INPUT}width:100%"><option value="">${esc(i18t('set_lane_any_stream'))}</option>${
          streams.map(f=>`<option value="${esc(f.id)}"${m.folder===f.id?' selected':''}>${esc(f.name)}</option>`).join('')}</select></label>
      <label style="display:block;margin-bottom:var(--s-3)" title="${esc(i18t('set_mailroom_owner_tip'))}"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600)">${esc(i18t('set_mailroom_owner'))}</span>
        ${stMailroomOwnerSel(m)}</label>
      <div style="display:flex;gap:var(--s-2)">
        <button id="st-mr-new" style="${ST_BTN_SM}">${esc(i18t('set_mailroom_rotate'))}</button>
        <button id="st-mr-save" style="${ST_BTN_SM}">${i18t('act_save')}</button>
      </div>
      <p class="st-note" style="margin-top:var(--s-3)">${i18t('set_mailroom_note')}</p>`;
    },
    wire(){
      document.getElementById('st-mr-new')?.addEventListener('click',()=>{
        /* CRYPTO, NEVER Math.random — this is the only thing standing between
           a stranger and this workspace's import queue. */
        let k='';
        try{ const a=new Uint8Array(24); crypto.getRandomValues(a);
          k=[...a].map(x=>x.toString(16).padStart(2,'0')).join(''); }
        catch(_){ k=''; }
        if(!k){ stDrawerRefuse(i18t('set_mailroom_no_random')); return; }
        const el=document.getElementById('st-mr-key'); if(el) el.value=k;
        stDrawerClearRefusal();
      });
      /* a different stream can change who may hold its documents */
      document.getElementById('st-mr-folder')?.addEventListener('change',e=>{
        const box=document.getElementById('st-mr-owner'); if(!box) return;
        const m=(state.settings&&state.settings.mailroom)||{};
        box.outerHTML=stMailroomOwnerSel({ ...m, folder:String(e.target.value||''), ownerId:box.value });
      });
      document.getElementById('st-mr-save')?.addEventListener('click',async()=>{
        const key=String(document.getElementById('st-mr-key')?.value||'').trim();
        const folder=String(document.getElementById('st-mr-folder')?.value||'');
        const ownerId=String(document.getElementById('st-mr-owner')?.value||'');
        /* A SHORT KEY IS REFUSED RATHER THAN SAVED. Stored, it would look like
           the feature was on while being guessable — the worst of both. */
        if(key && key.length<24){ stDrawerRefuse(i18t('set_mailroom_short')); return; }
        stDrawerClearRefusal();
        try{
          state.settings=state.settings||{};
          const was=state.settings.mailroom||{};
          state.settings.mailroom = key ? { key, folder, ...(ownerId ? { ownerId } : {}), ...(was.savedById ? { savedById:was.savedById } : {}) } : {};
          await saveSettings();
          toast(key?i18t('set_mailroom_saved'):i18t('set_mailroom_stopped'),'ok');
          stRepaintRow('mailroom');
        }catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
      });
    },
  },

  /* ---- CLEARANCE LANES (S3 of HaTi's Next Fifteen, 16 Sep 2026) ----
     *"A clearance lane is four conditions and a destination, written down and
     named on the record when it fires."* Four conditions and a destination is
     the whole model, and it is deliberately NOT a drag-and-drop workflow
     builder — the classic enterprise upsell, and the fastest way for a product
     to lose its opinions.

     THE RULE LIVES HERE, WHERE HaTi KEEPS ITS RULES. The Requests page only
     READS it (intakeLanes / intakeLaneFor in js/views/intake.js), so there is
     one writer and one reader and they cannot come to disagree about what a
     lane is.

     IT RIDES THE ORDINARY SETTINGS BLOB, like the payment targets and the
     review gate's own switch: a list of rules is not an access map, so the
     reasoning that gives folderAccess and signFolders.by their own atomic
     routes does not apply.

     A LANE CANNOT SIGN ANYTHING, and that is not a gap. Its destination is a
     draft on the ordinary creation path; every wall between a draft and a
     signature — the named signers, the approval chain, the pre-signature
     check, the signing cap — is untouched and still asked. */
  lanes:{
    tab:'platform', group:'intake', mandatory:false,
    title:()=>i18t('st_p_lanes'),
    sub:()=>i18t('set_lanes_sub'),
    state(){
      const L=(typeof intakeLanes==='function')?intakeLanes():[];
      const on=L.filter(x=>x&&x.on!==false).length;
      return { dot:on?'ok':'off', text: on?i18tn('set_lanes_n',on,{n:on}):i18t('set_lanes_none') };
    },
    body(){
      const L=(typeof intakeLanes==='function')?intakeLanes():[];
      const tpls=(typeof TEMPLATES!=='undefined')?Object.keys(TEMPLATES):[];
      const streams=(typeof visibleFolders==='function')?visibleFolders():[];
      /* ---- WHOSE ITS DRAFTS ARE (4 Oct 2026, the process review's last
         gaps) ----
         The members who may draft and can see the lane's stream; the empty
         choice is the default, and it SAYS WHO that is — the admin who saved
         the lane, else the first admin — by the one reading the server's
         mint asks (intakeLaneOwner, js/intakelanes.js). A lane not saved yet
         will be saved by the reader, so its default names them. */
      const users=((typeof getUsers==='function')?getUsers():[])||[];
      const me=(typeof currentUser==='function')?currentUser():null;
      const ownerSel=x=>{
        const may=u=>!x.folder || typeof canAccessFolder!=='function' || canAccessFolder(x.folder,u);
        const def=(typeof intakeLaneOwner==='function')
          ? intakeLaneOwner({ savedById: x.savedById || (x.id ? null : (me&&me.id)) }, users, may) : null;
        const defWord=def ? i18t(def.how==='saver'?'set_lane_owner_saver':'set_lane_owner_first',{ name:def.name }) : '\u2014';
        const people=users.filter(u=>u && u.role!=='viewer' && may(u));
        const cur=(x.ownerId && people.some(u=>String(u.id)===String(x.ownerId))) ? String(x.ownerId) : '';
        return `<select class="ln-owner" style="${window.RV_FLD||ST_INPUT}width:100%"><option value="">${esc(defWord)}</option>${
          people.map(u=>`<option value="${esc(u.id)}"${cur===String(u.id)?' selected':''}>${esc(u.name||u.email||'')}</option>`).join('')}</select>`;
      };
      /* A LANE'S VALUE LIMIT, READ BACK (the owner's yes, 27 Oct 2026): one quiet line where a lane has one
         (intakeLaneMatch clears a stated value at or under it); a lane without one draws nothing */
      const laneMaxHtml=x=>(x.maxValue==null||x.maxValue===''||!isFinite(Number(x.maxValue))) ? ''
        : `<div class="ln-max" title="${esc(i18t('set_lane_max_tip'))}" style="font-size:var(--t-meta);color:var(--color-neutral-600)">${esc(i18t('set_lane_max',{
            amount:(typeof fmtMoneyShort==='function')?fmtMoneyShort(Number(x.maxValue)):String(x.maxValue) }))}</div>`;
      const row=(x,i)=>`<div class="st-lane" data-lane-i="${i}"${x.id?` data-lane-id="${esc(x.id)}"`:''} style="border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-3);display:flex;flex-direction:column;gap:9px">
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
          <input class="ln-on" type="checkbox" ${x.on===false?'':'checked'} style="width:14px;height:14px;accent-color:var(--color-accent)"/>
          <input class="ln-name" type="text" value="${esc(x.name||'')}" placeholder="${esc(i18t('set_lane_name_ph'))}" style="${window.RV_FLD||ST_INPUT}flex:1;min-width:150px"/>
          <button class="ln-del" style="${ST_BTN_SM}">${esc(i18t('act_delete'))}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px">
          <label style="display:block"><span style="font-size:var(--t-label);color:var(--color-neutral-600)">${esc(i18t('set_lane_template'))}</span>
            <select class="ln-tpl" style="${window.RV_FLD||ST_INPUT}width:100%">${
              tpls.map(t=>`<option value="${esc(t)}"${x.template===t?' selected':''}>${esc(TEMPLATES[t].name)}</option>`).join('')}</select></label>
          <label style="display:block"><span style="font-size:var(--t-label);color:var(--color-neutral-600)">${esc(i18t('set_lane_stream'))}</span>
            <select class="ln-folder" style="${window.RV_FLD||ST_INPUT}width:100%"><option value="">${esc(i18t('set_lane_any_stream'))}</option>${
              streams.map(f=>`<option value="${esc(f.id)}"${x.folder===f.id?' selected':''}>${esc(f.name)}</option>`).join('')}</select></label>
          <label style="display:block"><span style="font-size:var(--t-label);color:var(--color-neutral-600)">${esc(i18t('set_lane_words'))}</span>
            <input class="ln-words" type="text" value="${esc(x.words||'')}" placeholder="${esc(i18t('set_lane_words_ph'))}" style="${window.RV_FLD||ST_INPUT}width:100%"/></label>
          <label style="display:block" title="${esc(i18t('set_lane_owner_tip'))}"><span style="font-size:var(--t-label);color:var(--color-neutral-600)">${esc(i18t('set_lane_owner'))}</span>
            ${ownerSel(x)}</label>
          <label style="display:flex;align-items:center;gap:7px;align-self:end;font-size:var(--t-meta)">
            <input class="ln-known" type="checkbox" ${x.knownOnly?'checked':''} style="width:14px;height:14px;accent-color:var(--color-accent)"/>
            <span>${esc(i18t('set_lane_known'))}</span></label>
        </div>${laneMaxHtml(x)}
      </div>`;
      return `<div id="st-lanes" style="display:flex;flex-direction:column;gap:var(--s-3)">${L.map(row).join('')}</div>
        <div style="display:flex;gap:var(--s-2);margin-top:var(--s-3)">
          <button id="st-lane-add" style="${ST_BTN_SM}">${esc(i18t('set_lane_add'))}</button>
          <button id="st-lane-save" style="${ST_BTN_SM}">${i18t('act_save')}</button>
        </div>
        <p class="st-note" style="margin-top:var(--s-3)">${i18t('set_lanes_note')}</p>`;
    },
    wire(){
      /* A LANE KEEPS ITS ID ACROSS SAVES (4 Oct 2026): the server knows an
         unchanged lane by it, so the admin who saved it stays its saver.
         `savedById` is the server's word and rides along only so the panel can
         go on naming the default; the server never believes it. */
      const was=id=>((typeof intakeLanes==='function')?intakeLanes():[]).find(l=>l&&id&&String(l.id)===String(id))||null;
      const read=()=>[...document.querySelectorAll('#st-lanes .st-lane')].map(el=>{
        const keep=el.getAttribute('data-lane-id')||'';
        const prev=was(keep);
        const ownerId=String(el.querySelector('.ln-owner')?.value||'');
        return {
          id: keep || ('lane_'+Math.abs(Date.now()+Math.floor(Math.random()*9973)).toString(36)),
          on: !!el.querySelector('.ln-on')?.checked,
          name: String(el.querySelector('.ln-name')?.value||'').trim().slice(0,80),
          template: String(el.querySelector('.ln-tpl')?.value||''),
          folder: String(el.querySelector('.ln-folder')?.value||''),
          words: String(el.querySelector('.ln-words')?.value||'').trim().slice(0,120),
          knownOnly: !!el.querySelector('.ln-known')?.checked,
          ...(ownerId ? { ownerId } : {}),
          ...(prev && prev.savedById ? { savedById: prev.savedById } : {}),
          /* the panel draws no box for a lane's value ceiling (intakeLanes reads it), so a save keeps the stored one */
          ...(prev && prev.maxValue != null && prev.maxValue !== '' ? { maxValue: prev.maxValue } : {}),
        };
      });
      document.getElementById('st-lane-add')?.addEventListener('click',()=>{
        state.settings=state.settings||{};
        state.settings.intakeLanes=read().concat([{ on:true, name:'', template:(typeof TEMPLATES!=='undefined'?Object.keys(TEMPLATES)[0]:''), folder:'', words:'', knownOnly:true }]);
        stRepaintPanel('lanes');
      });
      /* The people a lane's draft may belong to are the ones who can see its
         stream, so choosing a stream redraws the choice beside it. */
      document.querySelectorAll('#st-lanes .ln-folder').forEach(sel=>sel.addEventListener('change',()=>{
        state.settings=state.settings||{}; state.settings.intakeLanes=read();
        stRepaintPanel('lanes');
      }));
      document.querySelectorAll('#st-lanes .ln-del').forEach((b,i)=>b.addEventListener('click',()=>{
        const all=read(); all.splice(i,1);
        state.settings=state.settings||{}; state.settings.intakeLanes=all;
        stRepaintPanel('lanes');
      }));
      document.getElementById('st-lane-save')?.addEventListener('click',async()=>{
        const all=read();
        /* A LANE WITH NO NAME CANNOT BE WRITTEN ON A RECORD, and a lane with
           no template has no destination. Refused in words rather than saved
           as a rule that can never fire. A bad word pattern is refused for the
           same reason — it would silently match nothing. */
        if(all.some(x=>x.on&&(!x.name||!x.template))){ stDrawerRefuse(i18t('set_lane_need')); return; }
        for(const x of all){ if(x.words){ try{ new RegExp(x.words,'i'); }catch(_){ stDrawerRefuse(i18t('set_lane_bad_words')); return; } } }
        stDrawerClearRefusal();
        try{
          state.settings=state.settings||{}; state.settings.intakeLanes=all;
          await saveSettings();
          toast(i18t('set_lanes_saved'),'ok');
          stRepaintRow('lanes');
        }catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
      });
    },
  },

  renewals:{
    tab:'platform', group:'intake', mandatory:false,
    title:()=>i18t('st_p_renewals'),
    sub:()=>i18t('set_renewal_sub'),
    state(){ return { dot:'ok', text:[90,60,30].map(d=>i18t('set_days_out',{n:d})).join(' · ') }; },
    body(){ return `<div style="display:flex;gap:6px">${[90,60,30].map(d=>`<span style="${ST_TAG}">${i18t('set_days_out',{n:d})}</span>`).join('')}</div>
      <p class="st-note" style="margin-top:var(--s-2)">${i18t('set_delivered_resend')}</p>`; },
    wire(){},
  },

  /* ---- TWO PAYMENT TARGETS, ONE PER SIDE (owner-ruled 2 Sep 2026) ----
     "What if we want to pay under one payment term while we get paid under a
     different payment term?" The playbook's paymentDays is per contract TYPE
     and cannot answer that; this pair can, and it is the only new setting the
     payment terms page needed.

     BLANK IS AN ANSWER AND IT IS THE DEFAULT — the playbook standard for that
     contract type carries on answering, so nothing in a workspace already
     running moves until an admin types a number here. The reading lives in
     js/payterms.js (payTargets); this panel writes and nothing else, so the
     screen and the page cannot come to disagree about what a target is.

     IT RIDES THE ORDINARY SETTINGS BLOB, like the review gate's own switch: a
     pair of numbers is not an access map, so the H-3 reasoning that gives
     folderAccess and signFolders.by their own atomic routes does not apply. */
  paydays:{
    tab:'platform', group:'standards', mandatory:false,
    title:()=>i18t('st_p_paydays'),
    sub:()=>i18t('set_paydays_sub'),
    state(){
      const t=(typeof payTargets==='function')?payTargets():{customer:null,supplier:null};
      const dot=(t.customer!=null||t.supplier!=null)?'ok':'off';
      const text = t.customer!=null&&t.supplier!=null ? i18t('set_pay_row_both',{i:t.customer,o:t.supplier})
        : t.customer!=null ? i18t('set_pay_row_in',{n:t.customer})
        : t.supplier!=null ? i18t('set_pay_row_out',{n:t.supplier})
        : i18t('set_pay_row_none');
      return { dot, text };
    },
    body(){
      const t=(typeof payTargets==='function')?payTargets():{customer:null,supplier:null};
      const box=(id,label,val)=>`<label style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:var(--t-meta);font-weight:var(--w-strong)">
        <span style="min-width:170px">${esc(label)}</span>
        <input id="${id}" type="number" min="1" max="365" step="1" inputmode="numeric" value="${val==null?'':val}" placeholder="—"
          style="${window.RV_FLD||ST_INPUT}width:92px;font-family:var(--font-mono);text-align:right"/>
        <span style="font-size:var(--t-label);font-weight:var(--w-body);color:var(--color-neutral-600)">${esc(i18t('set_pay_days'))}</span></label>`;
      return `<div style="display:flex;flex-direction:column;gap:var(--s-3)">
        ${box('st-pay-in',i18t('set_pay_in'),t.customer)}
        ${box('st-pay-out',i18t('set_pay_out'),t.supplier)}
      </div>
      <p class="st-note" style="margin-top:var(--s-3)">${i18t('set_pay_note')}</p>
      <div style="margin-top:var(--s-3)"><button id="st-pay-save" style="${ST_BTN_SM}">${i18t('act_save')}</button></div>`;
    },
    wire(){
      document.getElementById('st-pay-save')?.addEventListener('click',async()=>{
        const btn=document.getElementById('st-pay-save');
        /* A BLANK BOX IS "FALL BACK TO THE PLAYBOOK" AND ANYTHING ELSE IS A
           REFUSAL. Storing a number outside 1-365 would read back as null on
           the page while sitting in the record looking answered — two readings
           of one setting, which is worse than refusing the save. */
        const read=id=>{
          const el=document.getElementById(id); const raw=String((el&&el.value)||'').trim();
          if(!raw) return { ok:true, v:null };
          const v=(typeof payTargetDays==='function')?payTargetDays(raw):null;
          return v==null?{ok:false}:{ok:true,v};
        };
        const a=read('st-pay-in'), b=read('st-pay-out');
        if(!a.ok||!b.ok){ stDrawerRefuse(i18t('set_pay_bad')); return; }
        stDrawerClearRefusal();
        if(btn) btn.disabled=true;
        try{
          state.settings=state.settings||{};
          state.settings.payTargets={ customer:a.v, supplier:b.v };
          await saveSettings();
          toast(i18t('set_pay_saved'),'ok');
          /* THE ROW STATES THE PAIR WITHOUT BEING OPENED, so it is repainted
             where it stands — never renderTeam(), which rebuilds the whole
             screen and empties every server-filled panel. */
          stRepaintRow('paydays');
        }catch(e){ stDrawerRefuse((e&&e.message)||i18t('co_settings_save_failed')); }
        finally{ if(btn) btn.disabled=false; }
      });
    },
  },

  workshape:{
    tab:'platform', group:'house', mandatory:false,
    title:()=>i18t('st_p_workshape'),
    sub:()=>i18t('set_workshape_sub'),
    state(){ const cfg=(typeof wsCfg==='function')?wsCfg():{shapes:[],word:''};
      return { dot:cfg.shapes.length?'ok':'warn',
        text:cfg.shapes.map(s=>esc(i18t('set_shape_'+s))).join(' · ')+(cfg.word?` · ${esc(i18t('ww_'+cfg.word+'_title'))}`:'') }; },
    body(){
      if(typeof wsCfg!=='function') return `<p class="st-note">${i18t('set_workshape_admin_only')}</p>`;
      const cfg=wsCfg(), det=wsDetect();
      const box=(k,title,sub)=>`<label data-ws-box="${k}" style="display:flex;gap:9px;align-items:flex-start;padding:9px 11px;border:1px solid ${cfg.shapes.includes(k)?WS_BOX_ON.line:WS_BOX_OFF.line};border-radius:var(--radius);cursor:pointer;background:${cfg.shapes.includes(k)?WS_BOX_ON.fill:WS_BOX_OFF.fill};flex:1 1 240px;min-width:0">
        <input type="checkbox" data-ws-shape="${k}" ${cfg.shapes.includes(k)?'checked':''} style="margin-top:2px;flex:none"/>
        <span style="min-width:0"><span style="display:block;font-size:var(--t-body);font-weight:var(--w-strong)">${title}</span>
        <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${sub}</span></span></label>`;
      return `<div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:var(--s-3)">
        ${box('standing',i18t('set_shape_standing'),i18t('set_shape_standing_sub'))}
        ${box('project',i18t('set_shape_project'),i18t('set_shape_project_sub'))}
      </div>
      <div style="display:flex;align-items:center;gap:var(--s-3);flex-wrap:wrap;margin-bottom:var(--s-3)">
        <label style="display:flex;align-items:center;gap:9px;font-size:var(--t-meta);font-weight:var(--w-strong)">${i18t('set_work_word')}
          <select id="set-work-word" style="min-width:150px;${window.RV_FLD||ST_INPUT}width:auto">
            ${WS_WORDS.map(w=>`<option value="${w}"${w===cfg.word?' selected':''}>${esc(i18t('ww_'+w+'_title'))}</option>`).join('')}
          </select></label>
        <span class="st-note">${i18t('set_work_word_sub')}</span>
      </div>
      <div class="st-quiet"><b>${i18t('set_workshape_detect')}.</b> ${det.total
        ? esc(i18t('set_workshape_seen',{p:det.project,s:det.standing,u:det.unknown}))
          +` <button id="ws-use-detected" style="border:0;background:none;padding:0;font:inherit;font-size:var(--t-label);font-weight:var(--w-title);color:var(--accent-ink-700);cursor:pointer;text-decoration:underline">${i18t('set_workshape_use')}</button>`
        : i18t('set_workshape_seen_none')}</div>`;
    },
    wire(){
      /* THE SHAPES AND THE WORD. The answer is written and the card repaints
         itself; a full re-render empties every server-filled panel and the
         screen jumps (see the note above settingsHeightsBefore). */
      const wsRead=()=>settingsShapeBoxes().filter(b=>b.checked).map(b=>b.getAttribute('data-ws-shape'));
      const wsSave=(shapes,word)=>{
        if(typeof wsSet!=='function') return;
        if(!shapes.length){
          /* A refusal has to put the boxes back the way the record has them.
             Leaving the refused answer ticked on screen reads as a save. */
          stDrawerRefuse(i18t('set_workshape_pick_shape'));
          const cur=(typeof wsCfg==='function'?wsCfg().shapes:[]);
          settingsShapeBoxes().forEach(b=>{ b.checked=cur.includes(b.getAttribute('data-ws-shape')); });
          settingsPaintShapeBoxes(); return;
        }
        stDrawerClearRefusal();
        wsSet(shapes,word); settingsPaintShapeBoxes(); toast(i18t('set_workshape_saved'));
      };
      settingsShapeBoxes().forEach(b=>b.addEventListener('change',()=>
        wsSave(wsRead(), document.getElementById('set-work-word')?.value || (typeof wsWord==='function'?wsWord():''))));
      document.getElementById('set-work-word')?.addEventListener('change',e=>
        wsSave(wsRead().length?wsRead():(typeof wsShapes==='function'?wsShapes():[]), e.target.value));
      document.getElementById('ws-use-detected')?.addEventListener('click',()=>{
        if(typeof wsDetect!=='function') return;
        const sug=wsDetect().suggests;
        settingsShapeBoxes().forEach(b=>{ b.checked=sug.includes(b.getAttribute('data-ws-shape')); });
        wsSave(sug, document.getElementById('set-work-word')?.value || wsWord()); });
    },
  },

  /* A REAL CONTACT LIST, not a bare count. The count was all this ever showed,
     which made it impossible to answer the question people actually bring to
     it — "is this contact doing anything?" — so each row now says how many
     contracts name them. */
  directory:{
    tab:'platform', group:'house', mandatory:false,
    title:()=>i18t('st_p_directory'),
    sub:()=>i18t('st_p_directory_sub'),
    state(){ const n=(((state.settings||{}).directory)||[]).length;
      return { dot:n?'ok':'off', text:n?i18tn('set_directory',n,{n}):i18t('st_p_directory_empty') }; },
    body(){ return `<p class="st-note" style="margin-bottom:var(--s-2)">${i18t('set_bulk_signers')} <b>${i18t('set_csv_columns')}</b>.</p>
      <div id="st-dir-list"></div>
      <div style="display:flex;gap:var(--s-2);margin-top:10px;flex-wrap:wrap">
        <label style="${ST_BTN2};cursor:pointer">${icon('upload','w-3.5 h-3.5')} ${i18t('set_import_csv')}<input id="dir-import" type="file" accept=".csv,text/csv" style="display:none"/></label>
        <button id="dir-clear" style="${ST_BTN_DANGER}">${i18t('set_clear_directory')}</button>
      </div>`; },
    wire(){ stPaintDirectory(); },
  },

  design:{
    tab:'platform', group:'standards', mandatory:false,
    title:()=>i18t('st_p_design'),
    sub:()=>i18t('set_design_sub'),
    state(){ const ob=(typeof window!=='undefined'&&window.ORG_BRANDING)||null;
      const d=ob&&ob.designId&&window.docDesignById?docDesignById(ob.designId):null;
      return { dot:d?'ok':'off', text:d?esc(d.name):i18t('set_no_design') }; },
    body(){
      const ob=(typeof window!=='undefined'&&window.ORG_BRANDING)||null;
      const d=ob&&ob.designId&&window.docDesignById?docDesignById(ob.designId):null;
      return `<div style="display:flex;align-items:center;gap:var(--s-3);flex-wrap:wrap">
        <div style="width:74px;height:42px;border:1px dashed var(--color-divider);border-radius:var(--radius);display:grid;place-items:center;overflow:hidden;background:var(--color-bg);flex:none">
          ${ob&&ob.logoUrl?`<img src="${ob.logoUrl}" alt="logo" style="max-width:100%;max-height:100%">`:`<span style="font-size:var(--t-figure);color:var(--color-neutral-500)">${i18t('set_no_logo')}</span>`}
        </div>
        <div style="flex:1;min-width:150px">
          ${d?`<div style="font-size:var(--t-body);font-weight:var(--w-title)">${esc(d.name)}</div>
            <div class="st-note">${i18t('set_logo_pos',{pos:esc({'top-left':i18t('set_pos_top_left'),'top-center':i18t('set_pos_top_center'),'top-right':i18t('set_pos_top_right'),footer:i18t('set_pos_footer')}[ob.logoPosition]||ob.logoPosition||'—')})}</div>`
          :`<div style="font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('set_no_design')}</div>`}
        </div>
        <button id="brand-edit" style="${ST_BTN2}">${d?i18t('set_edit_design'):i18t('set_choose_design')}</button>
      </div>`;
    },
    wire(){ document.getElementById('brand-edit')?.addEventListener('click',()=>{
      stDrawerClose(); openDesignStep({ mode:'settings', onBack:()=>renderTeam() }); }); },
  },

  report:{
    tab:'platform', group:'house', mandatory:false, show:stApiOnly,
    title:()=>i18t('st_p_report'),
    sub:()=>i18t('set_monthly_report_sub'),
    state(){ return { dot:'off', text:i18t('set_monthly_report_sub') }; },
    body(){ return `<div id="mr-status" style="font-size:var(--t-label);color:var(--color-neutral-700);margin-bottom:var(--s-2)">${window.busyHtml?busyHtml(i18t('set_checking')):i18t('set_checking')}</div>
      <label class="st-toggle" style="margin-bottom:var(--s-2)">
        <input id="mr-enabled" type="checkbox"/><span><span class="st-role-name">${i18t('set_monthly_report_on')}</span></span></label>
      <div style="display:flex;gap:var(--s-2);align-items:center;flex-wrap:wrap">
        <select id="mr-recipients" aria-label="${i18t('set_mr_recipients_aria')}" style="min-width:170px;${window.RV_FLD||ST_INPUT}width:auto">
          <option value="admins">${i18t('set_mr_admins')}</option>
          <option value="all">${i18t('set_mr_all')}</option>
        </select>
        <button id="mr-send-now" style="${ST_BTN2}">${icon('clock','w-3.5 h-3.5')} ${i18t('set_mr_send_now')}</button>
      </div>`; },
    wire(){ stWireMonthlyReport(); },
  },

  /* ---- EVENTS OUT (W2-3) ----
     Admin-only, server-mode-only, and deliberately plain: a list of where
     HaTi posts, what each one is told about, and whether the far end is
     actually answering. The secret is shown ONCE on creation — it is what
     proves a delivery came from here, and a secret a screen can re-read is
     one anybody with the screen can take. */
  webhooks:{
    tab:'platform', group:'intake', mandatory:false, show:stApiOnly,
    title:()=>i18t('st_p_hooks'),
    sub:()=>i18t('st_hooks_sub'),
    state(){
      const n=(state.webhooks||[]).length;
      const bad=(state.webhooks||[]).filter(w=>w.lastOk===false).length;
      return { dot: n?(bad?'warn':'ok'):'off',
        text: n? i18tn('st_hooks_count',n,{n})+(bad?` · ${i18t('st_hooks_failing',{n:bad})}`:'') : i18t('st_hooks_none') };
    },
    body(){ return `<div id="wh-list" style="display:flex;flex-direction:column;gap:7px;margin-bottom:10px"></div>
      <label style="display:block;margin-bottom:var(--s-2)"><span style="${window.RV_LBL||''}">${esc(i18t('st_hooks_url'))}</span>
        <input id="wh-url" type="url" placeholder="https://example.com/hooks/hati" style="${window.RV_FLD||ST_INPUT}"/></label>
      ${''/* AN ENDPOINT IS TOLD WHAT IT SUBSCRIBED TO. The server treats an
             empty list as NOTHING (fail closed), so this list is not a
             convenience — it is the subscription, and every box starts
             ticked because that is what somebody adding an address means. */}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:5px;margin-bottom:9px">
        ${(state.webhookEvents||['contract.signed','round.received','obligation.due','intake.requested']).map(ev=>
          `<label style="display:flex;align-items:center;gap:7px;font-size:var(--t-meta)">
            <input type="checkbox" data-wh-ev="${esc(ev)}" checked style="width:14px;height:14px;accent-color:var(--color-accent)"/>
            <span style="font-family:var(--font-mono);font-size:var(--t-label)">${esc(ev)}</span></label>`).join('')}
      </div>
      <div style="display:flex;justify-content:flex-end">
        <button id="wh-add" style="${ST_BTN_SM}">${i18t('st_hooks_add')}</button>
      </div>
      <p class="st-note" style="margin-top:9px">${i18t('st_hooks_note')}</p>`; },
    wire(){ stHooksLoad(); document.getElementById('wh-add')?.addEventListener('click',()=>stHooksAdd()); },
  },

  backup:{
    tab:'platform', group:'house', mandatory:false,
    title:()=>i18t('st_p_backup'),
    sub:()=>API_MODE()?i18t('set_backup_server'):i18t('set_backup_local'),
    state(){ const at=stLastBackup(); return { dot:at?'ok':'off', text:at?`${i18t('set_export_backup')} · ${fmtDT(at)}`:i18t('st_not_set') }; },
    find(){ return stTrailOn()?[i18t('st_bk_tab_trail'),i18t('st_tr_find')]:[]; },
    /* TWO TABS ON THE SERVER: Backup as it was, and The trail (piece 5).
       Since round 26 its door is a PAGE (stDataPageHtml); the drawer's body
       stays for anything that paints the panel by name. */
    page:'data',
    body(){ return stTrailOn()?stBkTabsHtml():stBackupBodyHtml(); },
    wire(){ if(stTrailOn()) stBkWire(); else stWireBackup(); },
  },

  /* ============================================================
     TAB 3 — BUILD & LAUNCH
     ============================================================ */
  golive:{
    tab:'build', group:'launch', mandatory:true,
    title:()=>i18t('st_b_golive'),
    sub:()=>i18t('st_b_golive_sub'),
    state(){ const l=stGoLive(); const done=l.filter(r=>r.ok).length;
      return { dot: done===l.length?'ok':'warn',
        text: done===l.length ? i18t('st_b_golive_done',{n:done,n2:l.length})
          : i18tn('st_b_golive_left', l.length-done, {n:done,n2:l.length,left:l.length-done}) }; },
    chip(){ const l=stGoLive(); return `${l.filter(r=>r.ok).length}/${l.length}`; },
    body(){ return `<div class="st-rows" id="st-golive">${stGoLive().map(r=>`
        <button class="st-row" ${r.go?`data-st-go="${r.go}"`:''}${r.go?'':' disabled'}>
          <span class="st-dot" style="background:${r.ok?ST_DOT.ok:ST_DOT.warn}"></span>
          <span class="st-row-main"><span class="st-row-name">${esc(r.label)}</span>
          <span class="st-row-state">${esc(r.detail||'')}</span></span>
          ${r.go?`<span class="st-row-go" aria-hidden="true">›</span>`:''}
        </button>`).join('')}</div>`; },
    wire(){
      document.querySelectorAll('#st-golive [data-st-go]').forEach(b=>b.addEventListener('click',()=>{
        const [tab,panel]=b.getAttribute('data-st-go').split(':');
        settingsGoTab(tab); if(panel) stDrawerOpen(panel);
      }));
    },
  },

  engine:{
    tab:'build', group:'plumbing', mandatory:false,
    title:()=>i18t('st_b_engine'),
    sub:()=>i18t('st_b_engine_sub'),
    state(){ const on=(typeof copilotAvailable==='function')&&copilotAvailable();
      const cap=Number(((state.aiCfg||{}).limits||{}).dailySpendLimit||0);
      return { dot:on?(cap>0?'ok':'warn'):'off',
        text:`${on?i18t('set_configured'):i18t('set_not_configured')}${cap>0?` · $${cap.toFixed(2)}/day`:''}` }; },
    body(){ return stEngineBodyHtml(); },
    wire(){ stWireEngine(); },
  },

  mail:{
    tab:'build', group:'plumbing', mandatory:true, show:stApiOnly,
    title:()=>i18t('st_b_mail'),
    sub:()=>i18t('st_b_mail_sub'),
    /* THREE STATES, NOT TWO. This row said "Email configured" off emailOff()
       alone, so a workspace whose provider was refusing every message read
       exactly like one delivering them. A configured-but-failing provider is
       the WORST of the three to draw green, because unlike "not configured" it
       gives the admin no reason to look. */
    state(){ const off=(typeof emailOff==='function')&&emailOff();
      if(off) return { dot:'warn', text:i18t('set_email_not_configured') };
      if((typeof emailFailing==='function')&&emailFailing())
        return { dot:'warn', text:i18tn('set_email_failing', emailFailedCount(), { n:emailFailedCount() }) };
      return { dot:'ok', text:i18t('set_email_configured') }; },
    /* round 25 as drawn: "Email delivery · working" — the same three states */
    fact(){ const off=(typeof emailOff==='function')&&emailOff(), failing=!off&&(typeof emailFailing==='function')&&emailFailing();
      return { n:i18t('st_cf_mail'), s:i18t(off?'st_cf_mail_off':failing?'st_cf_mail_failing':'st_cf_mail_ok') }; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('set_email_sub')}</p>
      ${stMailKeyHtml()}
      <div style="display:flex;flex-wrap:wrap;gap:var(--s-2);margin-bottom:10px">
        <button id="rem-run" style="${ST_BTN2}">${icon('clock','w-3.5 h-3.5')} ${i18t('set_check_renewals')}</button>
        <button id="ob-refresh" style="${ST_BTN2}">${icon('history','w-3.5 h-3.5')} ${i18t('set_refresh_outbox')}</button>
      </div>
      <div id="outbox-list" style="font-size:var(--t-meta);color:var(--color-neutral-700)">${i18t('set_loading_outbox')}</div>`; },
    wire(){ stWireOutbox(); },
  },

  pilot:{
    tab:'build', group:'plumbing', mandatory:false, show:stApiOnly,
    title:()=>i18t('st_b_pilot'),
    sub:()=>i18t('set_activation_sub'),
    state(){ return { dot:'off', text:i18t('set_activation_sub') }; },
    body(){ return `<div id="activation-funnel" style="font-size:var(--t-meta);color:var(--color-neutral-700)">${window.busyHtml?busyHtml(i18t('set_loading')):i18t('set_loading')}</div>`; },
    wire(){ stLoadActivation(); },
  },

  /* ---- DEMO & SAMPLE DATA ----
     ORIGIN, NEVER NAME. `seeded` is stamped on a contract at the moment the
     sample portfolio is created and survives the server's light-list
     projection, so "is this a sample?" is a fact on the record rather than a
     guess about its title. Nothing new and destructive was built on the server
     for this: each removal goes through the per-contract delete the product
     already has and already guards. */
  samples:{
    tab:'build', group:'launch', mandatory:false,
    title:()=>i18t('set_demo_samples'),
    sub:()=>i18t('set_demo_samples_sub'),
    state(){ const n=stSampleContracts().length;
      return { dot:n?'warn':'ok', text:n?i18tn('set_demo_still_here',n,{n}):i18t('set_demo_cleared') }; },
    chip(){ const n=stSampleContracts().length; return n?String(n):''; },
    body(){ const s=stSampleContracts();
      return `${s.length?`<div class="st-quiet"><b>${i18tn('set_demo_still_here',s.length,{n:s.length})}</b><br>
        ${s.slice(0,8).map(c=>esc(c.name)).join('<br>')}${s.length>8?`<br>+${s.length-8}`:''}</div>
        <div class="st-danger"><button id="st-samples-clear" style="${ST_BTN_DANGER}">${icon('ban','w-3.5 h-3.5')} ${i18t('set_demo_clear')}</button></div>`
        :`<div class="st-quiet">${i18t('set_demo_cleared')}</div>`}`; },
    wire(){ document.getElementById('st-samples-clear')?.addEventListener('click',()=>stClearSamples()); },
  },

  /* ---- HISTORY INTEGRITY, ACROSS THE WHOLE BOOK ----
     There is no workspace-wide check in this product and the server verifies no
     hashes at all; every verification is per contract and in the browser. This
     is that same verifier run over every contract in a read-only loop — it
     writes nothing, and it says so. Where the browser has no real digest (a
     plain-http page has no crypto.subtle) it says THAT first, because a
     "verified" taken over a weak digest is worth less than the sentence
     explaining why. */
  integrity:{
    tab:'build', group:'launch', mandatory:false,
    title:()=>i18t('set_integrity_title'),
    sub:()=>i18t('set_integrity_sub'),
    state(){ const r=_stIntegrity;
      return { dot: r? (r.faults? 'warn':'ok') : 'off',
        text: r? i18t('set_integrity_result',{checked:r.checked,clean:r.clean,faults:r.faults}) : i18t('set_integrity_never') }; },
    body(){ return `${(typeof sha256IsReal==='function'&&!sha256IsReal())?`<div class="st-refusal" style="display:block">${i18t('set_integrity_weak')}</div>`:''}
      <div id="st-integrity-out" class="st-quiet">${_stIntegrity?stIntegrityHtml(_stIntegrity):i18t('set_integrity_never')}</div>
      <button id="st-integrity-run" style="margin-top:10px;${ST_BTN_SM}">${i18t('set_integrity_run')}</button>`; },
    wire(){ document.getElementById('st-integrity-run')?.addEventListener('click',()=>stRunIntegrity()); },
  },

  env:{
    tab:'build', group:'plumbing', mandatory:false,
    title:()=>i18t('st_b_env'),
    sub:()=>i18t('st_b_env_sub'),
    state(){ return { dot:'ok', text:`${i18t('st_b_env_mode')}: ${API_MODE()?'Server · SQLite':'Local · browser'}` }; },
    body(){
      const on=(typeof copilotAvailable==='function')&&copilotAvailable();
      const mailOk=!((typeof emailOff==='function')&&emailOff());
      const row=(k,v)=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
      return `<div class="st-facts">
        ${row(i18t('st_b_env_mode'), API_MODE()?'Server · SQLite':'Local · browser')}
        ${row(i18t('st_b_env_server'), (typeof location!=='undefined'&&location.host)||'—')}
        <div><span>${esc(i18t('st_b_env_version'))}</span><b id="st-env-version">—</b></div>
        ${row(i18t('st_p_copilot'), on?stOn():stOff())}
        ${row(i18t('st_b_env_mail'), API_MODE()?(mailOk?stOn():stOff()):i18t('st_needs_server'))}
        ${row(i18t('st_b_env_contracts'), String((state.contracts||[]).length))}
        ${row(i18t('st_b_env_people'), String((getUsers()||[]).length))}
      </div>`;
    },
    /* The deployed build is the server's own answer and nothing else knows it,
       so it is fetched rather than guessed. /api/status is public and cheap. */
    wire(){
      const el=document.getElementById('st-env-version'); if(!el || !API_MODE()) return;
      (async()=>{ try{ const r=await api('status'); el.textContent=(r&&r.version)||'—'; }catch(e){ el.textContent='—'; } })();
    },
  },
};

/* ---------------- the pieces the panels lean on ---------------- */

/* Folders: paint, rename, add, remove. Re-painted in place so a rename does not
   throw the reader back to the top of a rebuilt drawer. */
function stPaintFolders(){
  const host=document.getElementById('st-folder-list'); if(!host) return;
  const users=getUsers()||[];
  /* ONE READING, TWO READERS. This panel used to carry its own copy of the
     access map's arithmetic; the re-filing confirm on Key terms needs the same
     sentence, and two copies of "who can see this drawer" is two answers to one
     question. folderSeerCount (js/core.js) is built on canAccessFolder, the
     map's own named predicate. */
  const seers=fid=>folderSeerCount(fid).n;
  /* ---- A LOCK AND "N NAMED" ON A PRIVATE STREAM'S ROW, AND ITS PAGE ONE
     PRESS AWAY (owner picked "Stream page — the SAP way", 17 Oct 2026) ----
     The name and its facts sit on two lines, so a long built-in name no longer
     folds into a stack beside the counts; the row's last word is the door to
     the stream's own page. The count is the SERVER's for a stream that does
     not name this admin: their own book holds none of its contracts. */
  host.innerHTML=Object.values(FOLDERS).map(f=>{
    const n=stPsCount(f.id);
    const p=stPsSaved(f.id), priv=!!(p&&p.on);
    const who=priv?`${STPS_LOCK}${esc(i18tn('st_ps_named',stPsIds(p).length,{n:stPsIds(p).length}))}`
      :(f.local?esc(i18t('st_p_folders_thisbrowser')):i18t('st_p_folders_seen',{n:seers(f.id),total:users.length}));
    return `<div class="st-frow st-frow2" data-st-folder="${PB_ATTR(f.id)}">
      <span class="st-fdot" style="background:${f.color}"></span>
      <span class="st-fstack">
        ${f.custom?`<input class="st-fname" data-st-frename="${PB_ATTR(f.id)}" value="${PB_ATTR(f.name)}"/>`
                  :`<span class="st-fname" data-st-fixed="1">${esc(f.name)}</span>`}
        <span class="st-fmeta${priv?' is-private':''}">${i18tn('st_p_folders_count',n,{n})} · ${who}${f.custom?'':` · <span class="st-fbuilt" title="${esc(i18t('st_p_folders_builtin'))}">${esc(i18t('st_ps_builtin'))}</span>`}</span>
      </span>
      ${f.custom&&f.local?`<button class="st-fshare" data-st-fshare="${PB_ATTR(f.id)}" title="${esc(i18t('st_p_folders_share_t'))}">${esc(i18t('st_p_folders_share'))}</button>`:''}
      ${f.custom&&!f.local?`<button class="st-fopen" data-st-panel="stream:${PB_ATTR(f.id)}" title="${esc(i18t('st_ps_door_t',{name:f.name}))}">${esc(i18t('st_ps_door'))} ›</button>`:''}
      ${!f.custom?`<button class="st-fopen" data-st-panel="stream:${PB_ATTR(f.id)}" title="${esc(i18t('st_ps_door_t',{name:f.name}))}">${esc(i18t('st_ps_door'))} ›</button>`:''}
      ${f.custom?`<button class="st-fdel" data-st-fdel="${PB_ATTR(f.id)}" title="${esc(i18t('act_remove'))}" aria-label="${esc(i18t('act_remove'))}">${icon('x','w-3.5 h-3.5')}</button>`:''}
    </div>`;
  }).join('');
  host.querySelectorAll('[data-st-frename]').forEach(inp=>inp.addEventListener('change',()=>{
    const id=inp.getAttribute('data-st-frename'), name=inp.value.trim();
    if(!name || !FOLDERS[id]) { stPaintFolders(); return; }
    if(typeof renameCustomFolder==='function') renameCustomFolder(id,name);
    toast(i18t('st_p_folders_renamed',{name})); stPaintFolders();
  }));
  host.querySelectorAll('[data-st-fdel]').forEach(b=>b.addEventListener('click',async()=>{
    const id=b.getAttribute('data-st-fdel'), f=FOLDERS[id]; if(!f) return;
    const n=stPsCount(id);   // the server's count where this admin cannot see them all
    if(n){ stDrawerRefuse(i18t('st_p_folders_holds',{n:i18tn('st_p_folders_count',n,{n})})); return; }
    if(!await confirmDialog({ title:`${i18t('act_remove')} — ${f.name}`, message:i18t('st_p_folders_body'), confirmLabel:i18t('act_remove'), danger:true })) return;
    if(typeof removeCustomFolder==='function') removeCustomFolder(id);
    stDrawerClearRefusal(); toast(i18t('st_p_folders_removed',{name:f.name})); stPaintFolders();
  }));
  /* ---- THE ONE PRESS THAT GIVES A STREAM TO THE TEAM ----
     Drawn only on a stream that is still this browser's own, so it is never a
     control that does nothing. Streams made from today are the company's
     already; this is what lets the ones made before catch up, by a person's
     press rather than by a silent migration nobody asked for. */
  host.querySelectorAll('[data-st-fshare]').forEach(b=>b.addEventListener('click',()=>{
    const id=b.getAttribute('data-st-fshare'), f=FOLDERS[id]; if(!f) return;
    if(typeof shareCustomFolder!=='function') return;
    shareCustomFolder(id);
    toast(i18t('st_p_folders_shared',{name:f.name}),'ok'); stPaintFolders();
  }));
  const add=()=>{
    const inp=document.getElementById('st-folder-new'); const name=(inp?.value||'').trim();
    if(!name){ stDrawerRefuse(i18t('st_p_folders_add')); return; }
    if(typeof addCustomFolder!=='function') return;
    const f=addCustomFolder(name); if(inp) inp.value='';
    stDrawerClearRefusal(); toast(i18t('st_p_folders_added',{name:(f&&f.name)||name})); stPaintFolders();
  };
  document.getElementById('st-folder-add')?.addEventListener('click',add);
}

/* ============================================================
   A STREAM'S OWN PAGE — WHO MAY OPEN IT
   ============================================================
   (Owner picked "Stream page — the SAP way", 17 Oct 2026: piece 2 of the
   sensitive-contracts plan.) SAP's object page inside the drawer: the stream's
   three facts first — how many contracts, who may open them, whether its money
   is counted — then its tabs. ACCESS decides who may open it: everyone given
   the folder, as every folder works today, or ONLY THE PEOPLE NAMED HERE, with
   the named list under the choice. PEOPLE answers the auditor's "who can see
   it today", read through canAccessFolder (the one reading), each row a door to
   that person's drawer. Opens — who looked — is the next design round; the
   server keeps that record from the day a stream turns private.

   NOTHING IS WRITTEN UNTIL SAVE: the choice and the list are a draft
   (_stPs.draft), and Save sends both to PUT /api/private-streams/:fid, the one
   writer. A private stream with nobody named is refused here and by the
   server. An admin is NOT named by default (decision 1): "Add yourself" is
   offered, and the server records it as its own act and tells the people
   already named. */
const STPS_LOCK='<svg class="st-ps-lock" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
let _stPs={ counts:null, draft:null };
const stPsSaved=fid=>{ const m=(typeof privateStreamsMap==='function')?privateStreamsMap():(((state.settings||{}).privateStreams)||{}); return m[String(fid||'')]||null; };
const stPsIds=p=>(typeof privateStreamIds==='function')?privateStreamIds(p):((p&&p.people)||[]).map(x=>String(x.id));
/* the server's count where it has been read, else this book's: an admin a
   stream does not name holds none of its contracts */
function stPsCount(fid){
  const own=(state.contracts||[]).filter(c=>c.folder===fid).length;
  const srv=_stPs.counts?Number(_stPs.counts[fid]):NaN;
  return Number.isFinite(srv)?Math.max(srv,own):own;
}
/* Read when the folder list opens; repaints whatever is showing when it lands. */
async function stPsLoad(){
  if(!(typeof API_MODE==='function'&&API_MODE()) || !stIsAdmin()) return;
  try{
    const r=await api('private-streams');
    _stPs.counts=(r&&r.counts)||{};
    if(r&&r.streams){ state.settings=state.settings||{}; state.settings.privateStreams=r.streams; }
  }catch(_){ return; }
  if(document.getElementById('st-folder-list')) stPaintFolders();
  if(document.getElementById('st-ps')) stPsPaint();
}
/* + NEW STREAM OPENS ITS FORM (round 26 as drawn): a name, and the stream
   is the company's at once — through the one writer the stream list uses
   (addCustomFolder) — then its own page opens, to say who may open it and
   how long its contracts are kept */
function stNewStreamDrawer(){
  return { title:i18t('st_sw_new'), sub:i18t('st_sw_new_sub'), foot:'save',
    back:_stPage==='streams'?{ close:true, label:i18t('st_sw_title') }:{ key:'folders', label:i18t('st_p_folders'), group:i18t('st_grp_standards') },
    body:`<label style="display:block"><span style="${window.RV_LBL||''}">${esc(i18t('st_sw_new_name'))}</span>
      <input id="st-stream-name" type="text" maxlength="60" style="${window.RV_FLD||ST_INPUT}" autocomplete="off"/></label>
      <p class="st-note" style="margin-top:10px">${esc(i18t('st_p_folders_shared_note'))}</p>`,
    wire(){ const inp=document.getElementById('st-stream-name'); if(!inp) return;
      inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); const b=document.getElementById('st-dsave'); if(b) b.click(); } });
      /* the hand lands in the name, after the drawer's own focus has settled */
      setTimeout(()=>{ try{ inp.focus({ preventScroll:true }); }catch(_){} },160); },
    save(){
      const inp=document.getElementById('st-stream-name'), name=String((inp&&inp.value)||'').trim();
      if(!name){ stDrawerRefuse(i18t('st_sw_new_say')); return; }
      if(typeof addCustomFolder!=='function') return;
      const had=Object.values(FOLDERS).find(f=>f&&String(f.name).toLowerCase()===name.toLowerCase());
      if(had){ stDrawerRefuse(i18t('st_sw_new_had',{ name:had.name })); return; }
      const f=addCustomFolder(name); if(!f) return;
      toast(i18t('st_p_folders_added',{ name:f.name }),'ok');
      stDrawerOpen('stream:'+f.id);
      if(_stPage==='streams') stSwRepaint();
    } };
}
function stStreamDrawer(fid, tab){
  if(fid==='new') return stNewStreamDrawer();
  const f=FOLDERS[fid]; if(!f) return null;
  const p=stPsSaved(fid);
  const was=_stPs.draft;
  _stPs.draft={ fid, on:!!(p&&p.on), ids:stPsIds(p), tab:(tab==='keeping'&&stKpOn())?'keeping':(was&&was.fid===fid&&was.tab)||'access', adding:false };
  stKpDraftFor(fid);
  /* A DOOR THAT ASKED FOR KEEPING SHOWS WHAT IS DUE (round 25 as drawn:
     "Opens the Sales stream on its Keeping tab, with the two contracts
     listed. Nothing is deleted without your yes"): the list is open, and the
     reader lands on it once it is read (LAND ON IT) */
  const showDue=tab==='keeping'&&stKpOn();
  if(showDue) _stKp.list=true;
  return { title:f.name, sub:f.desc||'', foot:'save',
    glyph:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${f.color||'currentColor'}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
    badge:(p&&p.on)?`<span class="st-ps-badge">${STPS_LOCK}${esc(i18t('st_ps_private'))}</span>`:'',
    /* the way back names where the reader came from: on Contract streams,
       the page (round 26 as drawn) */
    back:_stPage==='streams'?{ close:true, label:i18t('st_sw_title') }:{ key:'folders', label:i18t('st_p_folders'), group:i18t('st_grp_standards') },
    body:`<div id="st-ps" data-st-ps="${PB_ATTR(fid)}">${stPsBodyHtml()}</div>`,
    wire(){ stPsWire(); if(!_stPs.counts) stPsLoad();
      if(showDue && typeof landOn==='function') landOn('#st-dbody #st-kp-due',{ focus:false, block:'nearest' }); },
    save(){ stPsSave(); } };
}
function stPsPaint(){ const host=document.getElementById('st-ps'); if(host) host.innerHTML=stPsBodyHtml(); }
function stPsBodyHtml(){
  const d=_stPs.draft; if(!d) return '';
  const users=getUsers()||[];
  const p=stPsSaved(d.fid), priv=!!(p&&p.on), named=stPsIds(p).length;
  const can=users.filter(u=>canAccessFolder(d.fid,u));
  /* THE FACTS ARE THE STREAM AS IT STANDS, not the draft: the head says what
     is true until Save. */
  const facts=`<div class="st-ps-facts">
    <div><span>${esc(i18t('st_ps_f_contracts'))}</span><b>${stPsCount(d.fid)}</b></div>
    <div><span>${esc(i18t('st_ps_f_who'))}</span><b>${esc(priv?i18tn('st_ps_who_named',named,{n:named}):i18t('st_ps_who_open',{n:can.length,total:users.length}))}</b></div>
    <div><span>${esc(i18t('st_ps_f_money'))}</span><b>${esc(i18t(priv?'st_ps_money_out':'st_ps_money_in'))}</b></div>
  </div>`;
  const tab=(k,label,count)=>`<button type="button" role="tab" class="st-ps-tab${d.tab===k?' is-on':''}" data-st-ps-tab="${k}" aria-selected="${d.tab===k}">${esc(label)}${count!=null?` <span class="st-ps-q">${count}</span>`:''}</button>`;
  return `${facts}<div class="st-ps-tabs" role="tablist">${tab('access',i18t('st_ps_tab_access'))}${stKpOn()?tab('keeping',i18t('st_kp_tab')):''}${tab('people',i18t('st_ps_tab_people'),can.length)}</div>
    <div class="st-ps-pane">${d.tab==='people'?stPsPeopleHtml(users):d.tab==='keeping'&&stKpOn()?stKpHtml(d.fid):stPsAccessHtml(users)}</div>`;
}
function stPsAccessHtml(users){
  const d=_stPs.draft, me=(typeof currentUser==='function'&&currentUser())||{};
  const byId=new Map(users.map(u=>[String(u.id),u]));
  const p=stPsSaved(d.fid), was=new Map(((p&&Array.isArray(p.people))?p.people:[]).map(x=>[String(x.id),x]));
  const radio=(on,label,sub)=>`<label class="st-ps-radio${d.on===on?' is-on':''}"><input type="radio" name="st-ps-on" value="${on?'1':'0'}"${d.on===on?' checked':''}/>
    <span><span class="st-role-name">${esc(label)}</span><span class="st-note">${esc(sub)}</span></span></label>`;
  let html=`<p class="st-ps-l">${esc(i18t('st_ps_q'))}</p>
    ${radio(false,i18t('st_ps_everyone'),i18t('st_ps_everyone_sub'))}
    ${radio(true,i18t('st_ps_named_only'),i18t('st_ps_named_only_sub'))}`;
  if(!d.on) return html;
  const isMe=id=>String(id)===String(me.id);
  const you=`<span class="st-ps-you">${esc(i18t('st_ps_you'))}</span>`;
  const whenOf=x=>{
    if(!x) return i18t('st_ps_unsaved');
    const day=stDay(x.at);
    if(x.self) return i18t('st_ps_self',{date:day});
    return isMe(x.by&&x.by.id)?i18t('st_ps_by_you',{date:day}):i18t('st_ps_by',{who:(x.by&&x.by.name)||'',date:day});
  };
  const roleOf=u=>`${esc(roleName(u.role)||'')}${u.title?` · ${esc(u.title)}`:''}`;
  const row=id=>{ const u=byId.get(id)||{ id, name:(was.get(id)||{}).name||id, role:'' };
    return `<tr><td class="st-ps-who">${esc(stNameOf(u))}${isMe(id)?` ${you}`:''}</td><td>${roleOf(u)}</td>
      <td class="st-ps-when">${esc(whenOf(was.get(id)))}</td>
      <td class="st-ps-act"><button type="button" class="st-ps-link" data-st-ps-rm="${PB_ATTR(id)}">${esc(i18t('act_remove'))}</button></td></tr>`; };
  const meNamed=d.ids.includes(String(me.id));
  const meRow=(!meNamed&&me.id)?`<tr class="st-ps-ghost"><td class="st-ps-who">${esc(stNameOf(me))} ${you}</td><td>${roleOf(me)}</td>
      <td class="st-ps-when">${esc(i18t('st_ps_not_named'))}</td>
      <td class="st-ps-act"><button type="button" class="st-ps-link" data-st-ps-add="${PB_ATTR(me.id)}">${esc(i18t('st_ps_add_me'))}</button></td></tr>`:'';
  const rest=users.filter(u=>!d.ids.includes(String(u.id))&&!isMe(u.id));
  html+=`<p class="st-ps-l">${esc(i18t('st_ps_list'))}</p>
    <table class="st-ps-tb"><thead><tr><th>${esc(i18t('st_sh_person'))}</th><th>${esc(i18t('st_ps_th_role'))}</th><th>${esc(i18t('st_ps_th_named'))}</th><th><span class="sr-only">${esc(i18t('st_ps_th_act'))}</span></th></tr></thead>
    <tbody>${d.ids.map(row).join('')}${meRow}</tbody></table>
    ${d.ids.length?'':`<p class="st-ps-none">${esc(i18t('st_ps_none_yet'))}</p>`}
    <div class="st-ps-addbar"><button type="button" class="ui-btn ui-btn-sm" data-st-ps-adding aria-expanded="${!!d.adding}"${rest.length?'':` disabled title="${esc(i18t('st_ps_none_left'))}"`}>${esc(i18t('st_ps_add'))}</button></div>
    ${d.adding&&rest.length?`<div class="st-ps-pick">${rest.map(u=>`<div class="st-ps-pickrow"><span class="st-ps-who">${esc(stNameOf(u))} <span class="st-ps-role">· ${roleOf(u)}</span></span>
      <button type="button" class="st-ps-link" data-st-ps-add="${PB_ATTR(u.id)}">${esc(i18t('st_ps_add_btn'))}</button></div>`).join('')}</div>`:''}
    ${(!meNamed&&me.id)?`<p class="st-note st-ps-menote">${esc(i18t('st_ps_me_note'))}</p>`:''}`;
  return html;
}
/* WHO CAN OPEN ITS CONTRACTS TODAY — the saved rule, not the draft, read for
   every person through the one predicate the server mirrors. */
function stPsPeopleHtml(users){
  const d=_stPs.draft, p=stPsSaved(d.fid), priv=!!(p&&p.on);
  const rows=users.map(u=>({ u, ok:canAccessFolder(d.fid,u) })).sort((a,b)=>(b.ok-a.ok)||stNameOf(a.u).localeCompare(stNameOf(b.u)));
  const why=ok=>i18t(priv?(ok?'st_ps_yes_named':'st_ps_no_named'):(ok?'st_ps_yes_given':'st_ps_no_given'));
  return `<p class="st-ps-l">${esc(i18t('st_ps_people_q'))}</p>
    <table class="st-ps-tb"><thead><tr><th>${esc(i18t('st_sh_person'))}</th><th>${esc(i18t('st_ps_th_role'))}</th><th>${esc(i18t('st_ps_th_can'))}</th><th><span class="sr-only">${esc(i18t('st_ps_th_act'))}</span></th></tr></thead>
    <tbody>${rows.map(({u,ok})=>`<tr${ok?'':' class="st-ps-ghost"'}><td class="st-ps-who">${esc(stNameOf(u))}</td><td>${esc(roleName(u.role)||'')}</td>
      <td>${esc(why(ok))}</td><td class="st-ps-act"><button type="button" class="st-ps-link" data-st-panel="person:${PB_ATTR(u.id)}">${esc(i18t('st_ps_person'))} ›</button></td></tr>`).join('')}</tbody></table>`;
}
/* ONE LISTENER PER OPEN, on the page's own host (rebuilt with the drawer, so
   it cannot stack); a person's door rides the drawer's own data-st-panel. */
function stPsWire(){
  const host=document.getElementById('st-ps'); if(!host || host.dataset.wired) return;
  host.dataset.wired='1';
  host.addEventListener('change',e=>{
    if(stKpChange(e)) return;
    const r=e.target&&e.target.closest&&e.target.closest('input[name="st-ps-on"]'); if(!r||!_stPs.draft) return;
    _stPs.draft.on=(r.value==='1'); stDrawerClearRefusal(); stPsPaint();
  });
  host.addEventListener('click',e=>{
    const t=e.target, d=_stPs.draft; if(!t||!t.closest||!d) return;
    const tab=t.closest('[data-st-ps-tab]');
    if(tab){ d.tab=tab.getAttribute('data-st-ps-tab'); stPsPaint(); return; }
    if(stKpClick(t)) return;
    const rm=t.closest('[data-st-ps-rm]');
    if(rm){ d.ids=d.ids.filter(x=>x!==rm.getAttribute('data-st-ps-rm')); stPsPaint(); return; }
    const add=t.closest('[data-st-ps-add]');
    if(add){ const id=add.getAttribute('data-st-ps-add'); if(!d.ids.includes(id)) d.ids.push(id);
      stDrawerClearRefusal(); stPsPaint(); return; }
    /* PRESS IT AGAIN AND IT CLOSES */
    if(t.closest('[data-st-ps-adding]')){ d.adding=!d.adding; stPsPaint(); return; }
  });
}
async function stPsSave(){
  const d=_stPs.draft; if(!d) return;
  const f=FOLDERS[d.fid]||{ name:d.fid };
  if(d.on && !d.ids.length){ stDrawerRefuse(i18t('st_ps_need_someone')); return; }
  /* the Keeping tab's period rides the same Save (piece 10); where nothing
     about who may open it moved, the drawer stays on Keeping and shows what
     the period makes due */
  const kpMoved=stKpDirty(d.fid);
  if(!(await stKpSave(d.fid))) return;
  const ps=stPsSaved(d.fid), psSame=d.on===!!(ps&&ps.on) && stPsIds(ps).slice().sort().join('|')===d.ids.slice().sort().join('|');
  if(kpMoved && psSame){
    const r=stKpSaved(d.fid);
    toast(r?i18t('st_kp_saved',{name:f.name,period:stKpYearsWord(r.years)}):i18t('st_kp_saved_none',{name:f.name}),'ok');
    d.tab='keeping'; stPsPaint(); return;
  }
  const btn=document.getElementById('st-dsave'); if(btn) btn.disabled=true;
  let stream=null;
  try{
    if(typeof API_MODE==='function'&&API_MODE())
      stream=(await api('private-streams/'+encodeURIComponent(d.fid),'PUT',{ on:d.on, ids:d.ids })).stream;
    else stream=stPsLocalStream(d);
  }catch(e){ if(btn) btn.disabled=false; stDrawerRefuse(i18t('st_ps_save_failed',{err:e.message})); return; }
  state.settings=state.settings||{};
  state.settings.privateStreams={ ...(state.settings.privateStreams||{}), [d.fid]:stream };
  if(!(typeof API_MODE==='function'&&API_MODE()) && typeof saveSettings==='function') await saveSettings();
  toast(d.on?i18t('st_ps_saved_private',{name:f.name,named:i18tn('st_ps_who_named',d.ids.length,{n:d.ids.length})})
    :i18t('st_ps_saved_open',{name:f.name}),'ok');
  /* who may open what just moved — this admin's own book may have gained or
     lost the stream's contracts, and keeping's Needs rows with them (a stream
     that now names an admin leaves "No admin can see it") */
  await stPsReloadBook();
  if(stKpOn()){ _stKp.data=null; await stKpLoad(); stSyncAttention(); }
  stDrawerOpen('folders');
}
/* No server: the same record, kept in this browser like every other setting. */
function stPsLocalStream(d){
  const me=(typeof currentUser==='function'&&currentUser())||{};
  const prev=stPsSaved(d.fid)||{ people:[] };
  const had=new Map((prev.people||[]).map(x=>[String(x.id),x]));
  const by={ id:String(me.id||''), name:me.name||'' }, at=new Date().toISOString();
  const users=new Map((getUsers()||[]).map(u=>[String(u.id),u]));
  return { on:d.on, people:d.ids.map(id=>had.get(id)||{ id, name:(users.get(id)||{}).name||'', by, at, self:id===by.id }),
    log:prev.log||[], seen:prev.seen||{} };
}
/* The list again, keeping every record already in hand: a contract the admin
   still sees is not reloaded, one they gained arrives light, one they lost
   leaves. */
async function stPsReloadBook(){
  if(!(typeof API_MODE==='function'&&API_MODE())) return;
  try{
    const have=new Map((state.contracts||[]).map(c=>[c.id,c]));
    const next=[]; let offset=0, total=Infinity; const limit=200;
    while(offset<total && next.length<5000){
      const pg=await api('contracts?limit='+limit+'&offset='+offset);
      total=pg.total;
      (pg.rows||[]).forEach(r=>{ const old=have.get(r.id); if(old){ next.push(old); return; }
        const c=(typeof migrateContract==='function')?migrateContract(r):r; c._light=true; c._loaded=false; c._v=r._v; next.push(c); });
      if(!(pg.rows||[]).length) break;
      offset+=pg.rows.length;
    }
    state.contracts=next;
    if(typeof familyIndexDirty==='function') familyIndexDirty();
  }catch(_){}
}
/* ---- HOW LONG CONTRACTS ARE KEPT, AND LEGAL HOLD (owner picked "Keeping on
   each stream — the SAP way", 17 Oct 2026; piece 10 of the sensitive
   contracts and governance plan) ----
   The stream's Keeping tab: how many years its contracts are kept after they
   end (as amended), and what then — listed for an admin to delete, or kept
   archived. What is due now waits for the admin's yes ("Delete these 3",
   asked once more, or "Archive these 3"); what is on legal hold — the hold
   an admin can already put on a contract for a dispute — is listed and never
   touched. The server reads it all (GET /api/keeping, kpBook) and acts only
   on what is due when the yes arrives (POST /api/keeping/:fid/run). The
   period is a draft until Save, which the Access tab's Save carries. */
let _stKp={ data:null, busy:false, fid:null, years:null, then:'delete', list:false };
const stKpOn=()=>(typeof API_MODE==='function'&&API_MODE())&&stIsAdmin();
const stKpSaved=fid=>(((_stKp.data&&_stKp.data.rules)||(state.keeping&&state.keeping.rules)||{})[fid])||null;
function stKpDraftFor(fid){
  if(_stKp.fid===fid) return;
  const r=stKpSaved(fid);
  Object.assign(_stKp,{ fid, years:r?r.years:null, then:r?r.then:'delete', list:false });
}
const stKpDirty=fid=>{ const r=stKpSaved(fid); return _stKp.fid===fid && ((r?r.years:null)!==_stKp.years || (_stKp.years!=null && (r?r.then:'delete')!==_stKp.then)); };
async function stKpLoad(){
  if(!stKpOn()||_stKp.busy) return;
  _stKp.busy=true;
  try{ _stKp.data=await api('keeping'); }catch(_){ _stKp.data={ failed:true }; }
  _stKp.busy=false;
  /* the draft starts over from what is saved; an open list stays open (a
     door that asked for the due list is still answered once it is read) */
  if(_stKp.data&&_stKp.data.rules){ const fid=_stKp.fid, open=_stKp.list; _stKp.fid=null; if(fid){ stKpDraftFor(fid); _stKp.list=open; } }
  stKpSync();
  if(document.getElementById('st-ps')&&_stPs.draft&&_stPs.draft.tab==='keeping') stPsPaint();
}
/* what Needs you reads, brought up to the server's latest reading */
function stKpSync(){
  const d=_stKp.data; if(!d||!d.streams) return;
  const due={}; Object.entries(d.streams).forEach(([fid,s])=>{ if(s.rule&&s.due&&s.due.length) due[fid]={ n:s.due.length, then:s.rule.then }; });
  state.keeping={ rules:d.rules||{}, due, unseen:Array.isArray(d.unseen)?d.unseen:[] };
}
const stKpYearsWord=n=>i18tn('st_kp_years',n,{n});
function stKpHtml(fid){
  const d=_stKp.data;
  if(!d){ setTimeout(()=>stKpLoad(),0);
    return `<p class="st-note">${(typeof busyHtml==='function')?busyHtml(i18t('st_kp_reading')):esc(i18t('st_kp_reading'))}</p>`; }
  if(d.failed) return `<p class="st-note">${esc(i18t('st_kp_failed'))}</p>`;
  const s=(d.streams||{})[fid]||{ contracts:0, held:[], due:[] }, saved=stKpSaved(fid);
  const years=(d.years||[]);
  const radio=(k,label,sub)=>`<label class="st-ps-radio${_stKp.then===k?' is-on':''}"><input type="radio" name="st-kp-then" value="${k}"${_stKp.then===k?' checked':''}/>
    <span><span class="st-role-name">${esc(label)}</span><span class="st-note">${esc(sub)}</span></span></label>`;
  const facts=`<div class="st-kp-facts"><span>${esc(i18t('st_kp_f_kept'))} <b>${esc(saved?stKpYearsWord(saved.years):i18t('st_kp_none'))}</b></span>
    <span>${esc(i18t('st_kp_f_held'))} <b>${s.held.length}</b></span></div>`;
  let html=`${facts}
    <label class="st-tr-f"><span class="st-ps-l">${esc(i18t('st_kp_q'))}</span><select id="st-kp-years" style="${ST_INPUT}">
      <option value=""${_stKp.years==null?' selected':''}>${esc(i18t('st_kp_none'))}</option>
      ${years.map(n=>`<option value="${n}"${_stKp.years===n?' selected':''}>${esc(stKpYearsWord(n))}</option>`).join('')}</select></label>`;
  if(_stKp.years!=null) html+=`<p class="st-ps-l">${esc(i18t('st_kp_then'))}</p>
    ${radio('delete',i18t('st_kp_then_delete'),i18t('st_kp_then_delete_sub'))}
    ${radio('archive',i18t('st_kp_then_archive'),i18t('st_kp_then_archive_sub'))}`;
  /* what the SAVED period makes due now */
  if(saved){
    const n=s.due.length, held=s.heldDue||0, cut=stAwayDay(s.cutoff);
    const sub=[i18t('st_kp_ended_before',{day:cut}), held?i18tn('st_kp_held_back',held,{n:held}):i18t('st_kp_none_held')].join(' · ');
    const go=saved.then==='archive'?'st_kp_archive_n':'st_kp_delete_n';
    html+=`<div class="st-kp-due" id="st-kp-due">
      <div class="st-kp-due-h"><span class="st-kp-due-t"><b>${esc(n?i18tn('st_kp_due',n,{n}):i18t('st_kp_due_none'))}</b><span class="st-note">${esc(sub)}</span></span>
        ${n?`<button type="button" class="ui-btn ui-btn-sm" data-st-kp-list aria-expanded="${!!_stKp.list}">${esc(i18t('st_kp_review'))}</button>`:''}</div>
      ${n&&_stKp.list?`<table class="st-ps-tb st-kp-tb"><thead><tr><th>${esc(i18t('st_kp_th_contract'))}</th><th>${esc(i18t('st_kp_th_party'))}</th><th>${esc(i18t('st_kp_th_ended'))}</th></tr></thead>
        <tbody>${s.due.map(x=>`<tr data-st-kp-row="${PB_ATTR(x.id)}"><td><span class="st-ps-who">${esc(x.name||x.ref)}</span> <span class="st-note">${esc(x.ref)}${x.family&&x.family.length?' · '+esc(i18tn('st_kp_family',x.family.length,{n:x.family.length})):''}</span></td>
          <td>${esc(x.counterparty||'')}</td><td>${esc(stAwayDay(x.ended))}</td></tr>`).join('')}</tbody></table>
        <div class="st-kp-acts"><button type="button" class="ui-btn ${saved.then==='archive'?'ui-btn-primary':'ui-btn-danger is-filled'}" id="st-kp-go"${stKpDirty(fid)?` disabled aria-disabled="true" title="${esc(i18t('st_kp_save_first'))}"`:''}>${esc(i18tn(go,n,{n}))}</button>
          <span class="st-note">${esc(i18t(saved.then==='archive'?'st_kp_archive_note':'st_kp_delete_note'))}</span></div>`:''}
    </div>`;
  } else if(_stKp.years!=null) html+=`<p class="st-note st-kp-unsaved">${esc(i18t('st_kp_save_to_see'))}</p>`;
  html+=`<div class="st-kp-held"><p class="st-ps-l">${esc(i18t('st_kp_held_h'))} <span class="st-note">— ${esc(i18t('st_kp_held_sub'))}</span></p>
    ${s.held.length?s.held.map(x=>`<div class="st-kp-hrow"><span class="chip st-kp-chip">${esc(i18t('st_kp_legal_hold'))}</span>
      <span class="st-kp-hname">${esc(x.name||x.ref)}</span><span class="st-note">${esc(i18t('st_kp_since',{day:stDay(x.since),who:x.by||''}))}</span></div>`).join('')
      :`<p class="st-note">${esc(i18t('st_kp_held_none'))}</p>`}</div>`;
  return html;
}
function stKpChange(e){
  const t=e.target; if(!t||!t.closest) return false;
  if(t.id==='st-kp-years'){ _stKp.years=t.value?Number(t.value):null; stDrawerClearRefusal(); stPsPaint(); return true; }
  const r=t.closest('input[name="st-kp-then"]');
  if(r){ _stKp.then=r.value==='archive'?'archive':'delete'; stPsPaint(); return true; }
  return false;
}
function stKpClick(t){
  /* PRESS IT AGAIN AND IT CLOSES */
  if(t.closest('[data-st-kp-list]')){ _stKp.list=!_stKp.list; stPsPaint(); return true; }
  if(t.closest('#st-kp-go')){ stKpRun(); return true; }
  return false;
}
/* the period, saved with the drawer: true when there was nothing to save or it saved */
async function stKpSave(fid){
  if(!stKpOn()||!stKpDirty(fid)) return true;
  try{ const r=await api('keeping/'+encodeURIComponent(fid),'PUT',{ years:_stKp.years, then:_stKp.then });
    if(_stKp.data) _stKp.data.rules=(r&&r.rules)||{}; else _stKp.data=null;
    state.keeping=Object.assign({ due:{} },state.keeping||{},{ rules:(r&&r.rules)||{} });
  }catch(e){ stDrawerRefuse((e&&e.message)||i18t('st_kp_failed')); return false; }
  /* read again: the draft starts over from what is now saved (stKpLoad) */
  _stKp.data=null;
  stKpLoad();
  return true;
}
/* THE ADMIN'S YES: deleting is asked once more and cannot be undone; an
   archive is a shelf and can be restored */
/* fid: the stream's side panel names it (round 26 as drawn); the Keeping
   tab's own button reads it off the open page. False where nothing ran. */
async function stKpRun(fidArg){
  const fid=fidArg||(_stPs.draft&&_stPs.draft.fid), saved=stKpSaved(fid);
  const s=fid&&_stKp.data&&_stKp.data.streams&&_stKp.data.streams[fid];
  if(!saved||!s||!s.due.length||(_stKp.fid===fid&&stKpDirty(fid))) return false;
  const n=s.due.length, del=saved.then!=='archive';
  if(del && !(await confirmDialog({ title:i18tn('st_kp_confirm_t',n,{n}), message:i18t('st_kp_confirm_m',{name:(FOLDERS[fid]||{}).name||fid}),
    confirmLabel:i18tn('st_kp_delete_n',n,{n}), danger:true }))) return false;
  const btns=[document.getElementById('st-kp-go'), ...document.querySelectorAll('[data-st-swp-run]')].filter(Boolean);
  btns.forEach(b=>{ b.disabled=true; });
  let r=null;
  try{ r=await api('keeping/'+encodeURIComponent(fid)+'/run','POST',{ act:saved.then, ids:s.due.map(x=>x.id) }); }
  catch(e){ btns.forEach(b=>{ if(b.isConnected) b.disabled=false; }); toast((e&&e.message)||i18t('st_kp_failed'),'err'); return false; }
  const done=(r&&r.done)||[];
  _stKp.data={ rules:r.rules, years:(_stKp.data&&_stKp.data.years)||[], streams:r.streams }; _stKp.list=false;
  stKpSync();
  /* this book follows: a deleted contract leaves it, an archived one is reread */
  if(del){ const gone=new Set(done.concat(...s.due.filter(x=>done.includes(x.id)).map(x=>x.family||[])));
    state.contracts=(state.contracts||[]).filter(c=>!gone.has(c.id)); if(typeof familyIndexDirty==='function') familyIndexDirty(); }
  else (state.contracts||[]).forEach(c=>{ if(done.includes(c.id)) c.archived={ at:new Date().toISOString(), by:((currentUser()||{}).name)||'' }; });
  if(typeof updateSidebarCounts==='function') try{ updateSidebarCounts(); }catch(_){}
  toast(i18tn(del?'st_kp_deleted':'st_kp_archived',done.length,{n:done.length}),done.length?'ok':'warn');
  stPsPaint();
  return true;
}
/* NEEDS YOUR ATTENTION: a stream with contracts past their keeping period */
function stKpNeedRows(){
  const k=state.keeping; if(!stKpOn()||!k||!k.due) return [];
  return Object.entries(k.due).filter(([fid,x])=>x&&x.n>0&&FOLDERS[fid]).map(([fid,x])=>({ key:'keep:'+fid, dot:'warn',
    text:i18t(x.then==='archive'?'st_kp_need_archive':'st_kp_need_delete',{name:FOLDERS[fid].name}),
    sub:i18tn(x.then==='archive'?'st_kp_need_archive_sub':'st_kp_need_delete_sub',x.n,{n:x.n}),
    btn:`data-st-panel="stream:${PB_ATTR(fid)}@keeping"`, verb:i18t('st_kp_need_go') }))
  /* A PRIVATE STREAM NO ADMIN CAN SEE (owner's yes, 18 Oct 2026): it has
     contracts past their keeping time and names no admin, so nobody is asked.
     The row says only that — no count, no names — and its door is the
     stream's page, where an admin is named (themselves included). */
    .concat((Array.isArray(k.unseen)?k.unseen:[]).filter(fid=>FOLDERS[fid]).map(fid=>({ key:'keep-unseen:'+fid, dot:'warn',
      text:i18t('st_kp_need_unseen',{name:FOLDERS[fid].name}), sub:i18t('st_kp_need_unseen_sub'),
      btn:`data-st-panel="stream:${PB_ATTR(fid)}"`, verb:i18t('st_kp_need_unseen_go') })));
}
/* The person's drawer says which private streams name them, each a door back
   to its page — their access to a private stream is set THERE, nowhere else. */
function stPsPersonHtml(u){
  if(!u||!u.id) return '';
  const rows=Object.values(FOLDERS).filter(f=>{ const p=stPsSaved(f.id); return p&&p.on; });
  if(!rows.length) return '';
  return `<div class="st-ps-mine">${rows.map(f=>{ const on=stPsIds(stPsSaved(f.id)).includes(String(u.id));
    return `<div class="st-ps-mrow">${STPS_LOCK}<span>${esc(i18t(on?'st_ps_named_on':'st_ps_not_on',{name:f.name}))}</span>
      <button type="button" class="st-ps-link" data-st-panel="stream:${PB_ATTR(f.id)}">${esc(i18t('st_ps_door'))} ›</button></div>`; }).join('')}</div>`;
}

/* ---- THE CATEGORY LIST, BUILT LIKE THE STREAM LIST ABOVE IT ----
   Same row, same verbs, same refusal — a reader who has learned one has learned
   both, and two lists on one panel that behaved differently would be the worse
   answer. THE COUNT IS TEMPLATES, not contracts: a category is what a template
   is filed under, so that is the number a removal has to be refused against.
   It reads the library list the page already holds (tplLibAll) and asks for
   nothing; where that list has not loaded the count is honestly absent. */
function stPaintCategories(){
  const host=document.getElementById('st-cat-list'); if(!host) return;
  const lib=(typeof tplLibAll==='function')?tplLibAll():null;
  const rows=(typeof templateCategories==='function')?templateCategories():[];
  const uses=id=>(lib&&Array.isArray(lib.list))?lib.list.filter(t=>t&&t.category===id).length:null;
  host.innerHTML=rows.map(c=>{
    const n=uses(c.id);
    return `<div class="st-frow" data-st-cat="${PB_ATTR(c.id)}">
      ${c.custom?`<input class="st-fname" data-st-crename="${PB_ATTR(c.id)}" value="${PB_ATTR(c.name)}"/>`
                :`<span class="st-fname" data-st-fixed="1">${esc(c.name)}</span>`}
      <span class="st-fmeta">${n==null?'':esc(i18tn('st_p_cats_used',n,{n}))}</span>
      ${c.custom?`<button class="st-fdel" data-st-cdel="${PB_ATTR(c.id)}" title="${esc(i18t('act_remove'))}" aria-label="${esc(i18t('act_remove'))}">${icon('x','w-3.5 h-3.5')}</button>`
                :`<span class="st-fmeta" style="opacity:.7">${esc(i18t('st_p_folders_builtin'))}</span>`}
    </div>`;
  }).join('');
  host.querySelectorAll('[data-st-crename]').forEach(inp=>inp.addEventListener('change',()=>{
    const id=inp.getAttribute('data-st-crename'), name=inp.value.trim();
    if(!name||typeof renameTemplateCategory!=='function'){ stPaintCategories(); return; }
    renameTemplateCategory(id,name);
    toast(i18t('st_p_cats_renamed',{name})); stPaintCategories();
  }));
  host.querySelectorAll('[data-st-cdel]').forEach(b=>b.addEventListener('click',async()=>{
    const id=b.getAttribute('data-st-cdel');
    const row=rows.find(c=>c.id===id); if(!row) return;
    /* REFUSED WHILE IT IS IN USE, for the stream list's own reason: the
       templates would be filed under an id no picker offers. */
    const n=uses(id);
    if(n){ stDrawerRefuse(i18t('st_p_cats_holds',{n:i18tn('st_p_cats_used',n,{n})})); return; }
    if(!await confirmDialog({ title:`${i18t('act_remove')} — ${row.name}`,
      message:i18t('st_p_cats_body'), confirmLabel:i18t('act_remove'), danger:true })) return;
    if(typeof removeTemplateCategory==='function') removeTemplateCategory(id);
    stDrawerClearRefusal(); toast(i18t('st_p_cats_removed',{name:row.name})); stPaintCategories();
  }));
  const add=()=>{
    const inp=document.getElementById('st-cat-new'); const name=(inp?.value||'').trim();
    if(!name){ stDrawerRefuse(i18t('st_p_cats_add')); return; }
    if(typeof addTemplateCategory!=='function') return;
    const c=addTemplateCategory(name); if(inp) inp.value='';
    stDrawerClearRefusal(); toast(i18t('st_p_cats_added',{name:(c&&c.name)||name})); stPaintCategories();
  };
  document.getElementById('st-cat-add')?.addEventListener('click',add);
}

/* WHO CAN SIGN WHAT TODAY. Read-only, ordered by authority, and it says which
   people nobody has decided about — which is the state every member is in the
   day this ships. */
function stPaintLadder(){
  const host=document.getElementById('sc-ladder'); if(!host) return;
  const rows=(typeof signCapLadder==='function')?signCapLadder():[];
  const un=(typeof signCapUnanswered==='function')?signCapUnanswered():[];
  const enforced=(typeof signCapEnforced==='function')&&signCapEnforced();
  host.innerHTML=(rows.length?rows.map(r=>`<div class="st-frow">
      <span class="st-fname" data-st-fixed="1">${esc(r.name)}</span>
      <span class="st-fmeta">${esc(roleName(r.role))}</span>
      <span class="st-fmeta" style="color:${(!r.answered&&r.mayEverSign&&r.role!=='admin')?'var(--st-amber-fg)':'var(--color-neutral-600)'}">${esc(r.text)}</span>
      <span class="st-fmeta" style="opacity:.8">${esc((typeof signFolderText==='function')?signFolderText((getUsers()||[]).find(u=>u.id===r.id)||{}):'')}</span>
    </div>`).join(''):`<p class="st-note">${esc(i18t('sc_ladder_none'))}</p>`)
    +(un.length?`<p class="st-note" style="color:var(--st-amber-fg)">${esc(i18tn('sc_unanswered',un.length,{n:un.length}))}</p>`:'')
    +(enforced?'':`<p class="st-note">${esc(i18t('sc_not_enforced'))}</p>`);
}

/* WHO IS NARROWED TODAY — the folder rule's own drawer. Read-only; each
   person's narrowing is set in their own drawer (saveSignFolders). */
function stPaintSignFolders(){
  const host=document.getElementById('sf-people'); if(!host) return;
  const users=((typeof getUsers==='function'?getUsers():[])||[]).filter(u=>u&&u.role!=='viewer');
  const on=(typeof signFolderEnforced==='function')&&signFolderEnforced();
  host.innerHTML=users.map(u=>`<div class="st-frow">
      <span class="st-fname" data-st-fixed="1">${esc(u.name||u.email||'')}</span>
      <span class="st-fmeta">${esc(roleName(u.role))}</span>
      <span class="st-fmeta">${esc((typeof signFolderText==='function')?signFolderText(u):'')}</span>
    </div>`).join('')
    +(on?'':`<p class="st-note">${esc(i18t('sf_not_enforced'))}</p>`);
}
/* ════ THE RULES PAGE'S ROWS — one reading, in signBlockers' order ════════
   Every fact is borrowed from the rule's own reader; `holds` says whether it
   ever holds a SIGNATURE (review and the desk hold sending and redlining and
   are listed after, so nobody looks for them and finds nothing). `go` is
   where the rule is set: [tab, panel] for openSettingsAt. */
function stRulesRows(){
  const users=((typeof getUsers==='function'?getUsers():[])||[]).filter(Boolean);
  const legacy=(typeof signApprovalLegacyOn==='function')?signApprovalLegacyOn():false;
  let saPeople=0, saDefaulted=0;
  users.forEach(u=>{ if(u.role==='viewer'||typeof saRuleOf!=='function') return;
    let r=null; try{ r=saRuleOf(u, legacy); }catch(_){ r=null; }
    if(r&&r.on){ saPeople++; if(!r.answered) saDefaulted++; } });
  const rules=(typeof approvalRules==='function')?approvalRules():[];
  const gate=(typeof signCheckGate==='function')?signCheckGate():'off';
  const holders=users.filter(u=>u.role==='admin'||u.holdContracts===true).length;
  const capOn=(typeof signCapEnforced==='function')&&signCapEnforced();
  const sfOn=(typeof signFolderEnforced==='function')&&signFolderEnforced();
  const rv=!!((typeof reviewGateCfg==='function')?reviewGateCfg():{}).on;
  const dk=!!((typeof deskCfg==='function')?deskCfg():{}).on;
  return [
    { k:'hold', holds:true, on:true, name:i18t('st_rules_hold'), state:i18tn('st_rules_hold_state',holders,{n:holders}),
      says:i18t('st_rules_hold_says'), go:['people',null] },
    { k:'approval', holds:true, on:rules.length>0, name:i18t('st_p_approvals'),
      state:rules.length?i18tn('st_rules_n_rules',rules.length,{n:rules.length}):i18t('set_no_approval_rules'),
      says:i18t('st_rules_approval_says'), go:['platform','approvals'] },
    { k:'signapproval', holds:true, on:saPeople>0||legacy, name:i18t('st_rules_named'),
      state:i18tn('st_rules_named_state',saPeople,{n:saPeople}),
      says:i18t('st_rules_named_says'),
      /* THE OLD WORKSPACE SWITCH, SAID OUT LOUD: it has no screen of its own
         since 23 Sep and is read only for a person nobody has answered for. */
      extra:i18t(legacy?'st_rules_named_default_on':'st_rules_named_default_off')
        +(saDefaulted?' '+i18tn('st_rules_named_defaulted',saDefaulted,{n:saDefaulted}):''),
      go:['people',null] },
    { k:'signcap', holds:true, on:capOn, name:i18t('sc_rule_title'), state:capOn?stOn():stOff(),
      says:i18t('st_rules_cap_says'), go:['platform','signcap'] },
    { k:'signfolder', holds:true, on:sfOn, name:i18t('sf_rule_title'), state:sfOn?stOn():stOff(),
      says:i18t('st_rules_folder_says'), go:['platform','signfolder'] },
    { k:'signcheck', holds:true, on:gate!=='off', name:i18t('sc_set_title'), state:i18t('sc_set_'+gate),
      says:i18t('st_rules_check_says'), go:['platform','signcheck'] },
    { k:'brief', holds:true, on:gate!=='off', name:i18t('st_rules_brief'), state:gate!=='off'?stOn():stOff(),
      says:i18t('st_rules_brief_says'), go:['platform','signcheck'] },
    { k:'review', holds:false, on:rv, name:i18t('st_p_review'), state:rv?stOn():stOff(),
      says:i18t('st_rules_review_says'), go:['platform','review'] },
    { k:'desk', holds:false, on:dk, name:i18t('st_p_desk'), state:dk?stOn():stOff(),
      says:i18t('st_rules_desk_says'), go:['platform','desk'] },
  ];
}
function stPaintRules(){
  const host=document.getElementById('st-rules-list'); if(!host) return;
  const rows=stRulesRows();
  const row=r=>`<div class="st-rule-row" data-st-rule="${esc(r.k)}">
      <span class="st-dot" style="background:${r.on?ST_DOT.ok:ST_DOT.off}"></span>
      <span class="st-rule-main">
        <span class="st-rule-name">${esc(r.name)} <span class="st-rule-state">— ${esc(r.state)}</span></span>
        <span class="st-rule-says">${esc(r.says)}${r.extra?' '+esc(r.extra):''}</span>
      </span>
      <button type="button" class="ui-btn ui-btn-sm" data-st-rule-go="${esc(r.go[0])}:${esc(r.go[1]||'')}">${esc(i18t(r.go[0]==='people'?'st_rules_go_people':'st_rules_go'))}</button>
    </div>`;
  host.innerHTML=`<div class="st-rules">${rows.filter(r=>r.holds).map(row).join('')}</div>
    <h3 class="st-sec-h" style="margin-top:var(--s-4)">${esc(i18t('st_rules_not_signing'))}</h3>
    <div class="st-rules">${rows.filter(r=>!r.holds).map(row).join('')}</div>`;
  host.querySelectorAll('[data-st-rule-go]').forEach(b=>b.addEventListener('click',()=>{
    const [tab,panel]=String(b.getAttribute('data-st-rule-go')||'').split(':');
    try{ stDrawerClose(); }catch(_){}
    openSettingsAt(tab, panel||null);
  }));
}

/* The directory as a list, each row saying whether anything actually names it. */
function stPaintDirectory(){
  const host=document.getElementById('st-dir-list'); if(!host) return;
  const dir=(((state.settings||{}).directory)||[]);
  const uses=p=>{
    const nm=String(p.name||'').toLowerCase(), em=String(p.email||'').toLowerCase();
    return (state.contracts||[]).filter(c=>{
      const plan=(typeof signerPlan==='function')?signerPlan(c):(c.signerPlan||[]);
      return plan.some(r=>String(r.email||'').toLowerCase()===em || (nm&&String(r.name||'').toLowerCase()===nm))
        || (nm && String(c.signatory||'').toLowerCase().indexOf(nm)>=0);
    }).length;
  };
  host.innerHTML=dir.length?dir.map(p=>{ const n=uses(p);
    return `<div class="st-frow">
      <span class="st-fname" data-st-fixed="1">${esc(p.name||p.email)}</span>
      <span class="st-fmeta">${esc(p.title||'')}${p.title&&p.email?' · ':''}${esc(p.email||'')}</span>
      <span class="st-fmeta" style="opacity:.8">${n?i18tn('st_p_directory_used',n,{n}):i18t('st_p_directory_unused')}</span>
    </div>`; }).join('')
    :`<p class="st-note">${esc(i18t('st_p_directory_empty'))}</p>`;
  document.getElementById('dir-import')?.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=async()=>{
      const parsed=parseDirectoryCsv(rd.result);
      if(!parsed.length){ stDrawerRefuse(i18t('set_no_csv_rows')); return; }
      state.settings=state.settings||{}; const d=(state.settings.directory||[]).slice();
      const byEmail={}; d.forEach(p=>{ if(p.email) byEmail[p.email.toLowerCase()]=p; });
      let added=0, updated=0;
      parsed.forEach(r=>{ const k=(r.email||'').toLowerCase();
        if(k && byEmail[k]){ const p=byEmail[k]; if(r.name)p.name=r.name; if(r.title)p.title=r.title; updated++; }
        else { const p={ name:r.name||'', email:r.email||'', title:r.title||'' }; d.push(p); if(k)byEmail[k]=p; added++; } });
      state.settings.directory=d;
      try{ await saveSettings(); }catch(err){ toast(i18t('set_t_sync_failed',{err:err.message}),'err'); }
      stDrawerClearRefusal();
      toast(i18t('set_t_dir_import',{added})+(updated?i18t('set_t_dir_updated',{n:updated}):''));
      stPaintDirectory();
    };
    rd.readAsText(f); e.target.value='';
  });
  document.getElementById('dir-clear')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:i18t('st_dir_clear_q'), message:i18t('st_dir_clear_msg'), confirmLabel:i18t('st_dir_clear_go'), danger:true})) return;
    state.settings=state.settings||{}; state.settings.directory=[]; await saveSettings();
    toast(i18t('set_t_dir_cleared')); stPaintDirectory();
  });
}

/* ---- THE TRAIL, AS A FILE (owner picked "Export drawer — the SAP way",
   17 Oct 2026; piece 5 of the sensitive contracts and governance plan) ----
   Data & backup gets a second tab, The trail: a period, the streams, a
   spreadsheet or a PDF with HaTi's seal, the count before the press, and every
   download so far — each of them in the trail too. The server assembles the
   file inside the reader's stream wall and records the hand-over before the
   file leaves (GET /api/trail/summary, /exports, /export); this drawer only
   asks. On the server only: a browser-only workspace has no shared trail. */
/* Data & backup opens on The trail (round 26 as drawn); Backup is behind
   the second tab */
let _stBkTab='trail', _stBkWant=null;
const _stTr={ from:'', to:'', stream:'all', as:'csv', sum:null, sumKey:'', sumErr:'', list:null, busy:false, err:'' };
const stTrailOn=()=>stApiOnly() && stIsAdmin();
/* the last whole quarter: what an auditor asks for first */
function stTrailDefault(){
  const t=new Date(((typeof todayISO==='function')?todayISO():new Date().toISOString().slice(0,10))+'T00:00:00Z');
  const q=Math.floor(t.getUTCMonth()/3), y=q?t.getUTCFullYear():t.getUTCFullYear()-1, qq=q?q-1:3;
  return { from:new Date(Date.UTC(y,qq*3,1)).toISOString().slice(0,10), to:new Date(Date.UTC(y,qq*3+3,0)).toISOString().slice(0,10) };
}
/* "Q3 2026" where the period is a calendar quarter, else the two days; a
   chip says "Q3" alone where the quarter is this year's (round 26 as drawn:
   "download Q3 as a PDF") */
function stTrailPeriodWords(from,to,short){
  const f=new Date(from+'T00:00:00Z'), t=new Date(to+'T00:00:00Z');
  if(!isNaN(f)&&!isNaN(t)&&f.getUTCDate()===1&&f.getUTCMonth()%3===0&&f.getUTCFullYear()===t.getUTCFullYear()
    &&t.getUTCMonth()===f.getUTCMonth()+2&&new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth()+1,0)).getUTCDate()===t.getUTCDate()){
    const thisYear=String((typeof todayISO==='function')?todayISO():new Date().toISOString()).slice(0,4)===String(f.getUTCFullYear());
    return (short&&thisYear)?i18t('st_tr_quarter_short',{q:f.getUTCMonth()/3+1}):i18t('st_tr_quarter',{q:f.getUTCMonth()/3+1,y:f.getUTCFullYear()}); }
  return i18t('st_tr_span',{a:stDay(from),b:stDay(to)});
}
function stTrailStreams(){
  const ids=(typeof visibleFolders==='function')?visibleFolders():Object.keys(window.FOLDERS||{});
  return ids.map(f=>typeof f==='object'?f.id:f).filter(Boolean).map(id=>({ id:String(id), name:(window.FOLDERS&&FOLDERS[id]&&FOLDERS[id].name)||String(id) }));
}
function stTrailQuery(extra){
  const d=_stTr, all=stTrailStreams();
  const names={}; all.forEach(f=>{ names[f.id]=f.name; });
  /* encoded by hand: the same string every time for the same asks (the
     count's key), and no dependence on URLSearchParams being there */
  const q={ from:d.from, to:d.to, streams:d.stream==='all'?'':d.stream, names:JSON.stringify(names), ...(extra||{}) };
  return Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(q[k]==null?'':String(q[k]))).join('&');
}
const stTrailBad=()=>!_stTr.from||!_stTr.to||_stTr.to<_stTr.from;
function stBkTabsHtml(){
  if(!_stTr.from){ Object.assign(_stTr,stTrailDefault()); }
  const tab=(k,label)=>`<button type="button" role="tab" class="st-ps-tab${_stBkTab===k?' is-on':''}" data-st-bk-tab="${k}" aria-selected="${_stBkTab===k}">${esc(label)}</button>`;
  return `<div class="st-ps-tabs" role="tablist">${tab('backup',i18t('st_bk_tab_backup'))}${tab('trail',i18t('st_bk_tab_trail'))}</div>
    <div id="st-bk-pane">${stBkPaneHtml()}</div>`;
}
/* the pane for the tab in front: on the page the trail's asks are labelled
   boxes in one row (round 26), in the drawer the stacked form */
function stBkPaneHtml(){
  const onPage=_stPage==='data'&&!!document.querySelector('[data-st-pg="data"]');
  if(_stBkTab!=='trail') return onPage?`<section class="st-pg-card">${stPageHeadHtml(i18t('st_p_backup'), '', stDataTabsHtml())}</section><section class="st-card st-sheet-full st-dp-card">${stBackupBodyHtml()}</section>`:stBackupBodyHtml();
  return onPage?stTrailBandHtml():stTrailHtml();
}
function stTrailHtml(){
  const d=_stTr, streams=stTrailStreams();
  const lbl=t=>`<span class="st-ps-l">${esc(t)}</span>`;
  const radio=(k,t,sub)=>`<label class="st-ps-radio${d.as===k?' is-on':''}"><input type="radio" name="st-tr-as" value="${k}"${d.as===k?' checked':''}/>
    <span><span class="st-role-name">${esc(t)}</span><span class="st-note">${esc(sub)}</span></span></label>`;
  return `<p class="st-note st-tr-lead">${esc(i18t('st_tr_lead'))}</p>
    <div class="st-tr-grid">
      <label class="st-tr-f">${lbl(i18t('st_tr_from'))}<input type="date" id="st-tr-from" value="${esc(d.from)}" style="${ST_INPUT}"/></label>
      <label class="st-tr-f">${lbl(i18t('st_tr_to'))}<input type="date" id="st-tr-to" value="${esc(d.to)}" style="${ST_INPUT}"/></label>
    </div>
    <label class="st-tr-f">${lbl(i18t('st_tr_streams'))}<select id="st-tr-stream" style="${ST_INPUT}">
      <option value="all"${d.stream==='all'?' selected':''}>${esc(i18t('st_tr_all'))}</option>
      ${streams.map(f=>`<option value="${esc(f.id)}"${d.stream===f.id?' selected':''}>${esc(f.name)}</option>`).join('')}</select></label>
    <div class="st-tr-as">${lbl(i18t('st_tr_as'))}${radio('csv',i18t('st_tr_csv'),i18t('st_tr_csv_sub'))}${radio('pdf',i18t('st_tr_pdf'),i18t('st_tr_pdf_sub'))}</div>
    <div class="st-tr-go" id="st-tr-go">${stTrailGoHtml()}</div>
    <div class="st-tr-past" id="st-tr-past">${stTrailPastHtml()}</div>`;
}
/* the count, then the one act: Download the trail — grey with its reason */
function stTrailGoHtml(){
  const d=_stTr, bad=stTrailBad();
  const busyOf=w=>(typeof busyHtml==='function')?busyHtml(w):esc(w);
  let fig;
  if(bad) fig=`<span class="st-amber">${esc(i18t('st_tr_bad_period'))}</span>`;
  else if(d.sumErr) fig=`<span class="st-amber">${esc(d.sumErr)}</span>`;
  else if(!d.sum||d.sumKey!==stTrailQuery()) fig=busyOf(i18t('st_tr_counting'));
  else {
    const s=d.sum;
    fig=`<b class="st-tr-n">${esc(i18tn('st_tr_acts',s.acts,{n:Number(s.acts).toLocaleString(typeof jxLocale==='function'?jxLocale():undefined)}))}</b>`
      +` <span class="st-note">· ${esc([i18tn('st_tr_streams_n',s.streams,{n:s.streams}),i18tn('st_tr_people',s.people,{n:s.people}),stTrailPeriodWords(d.from,d.to)].join(' · '))}</span>`
      +(()=>{ /* the streams it leaves out, by the names Contract streams already shows
         this admin (round 26 as drawn: "Board left out: you are not named");
         the server counts them, never names them */
        const names=stTrailLeftOut();
        if(names.length) return ` <span class="st-note st-tr-out">· ${esc(i18tn('st_tr_left_out_named',names.length,{ names:stListJoin(names) }))}</span>`;
        return s.leftOut?`<span class="st-note st-tr-out">${esc(i18tn('st_tr_left_out',s.leftOut,{n:s.leftOut}))}</span>`:''; })();
  }
  const grey=bad||d.busy;
  return `<div class="st-tr-fig">${fig}</div>
    <button type="button" class="ui-btn ui-btn-primary" id="st-tr-download"${grey?' disabled aria-disabled="true"':''}${bad?` title="${esc(i18t('st_tr_bad_period'))}"`:''}>${
      d.busy?busyOf(i18t('st_tr_preparing')):`${icon('download','w-3.5 h-3.5')} ${esc(i18t('st_tr_download'))}`}</button>
    ${d.err?`<p class="st-note st-amber st-tr-err">${esc(d.err)}</p>`:''}`;
}
/* THE DOWNLOADS SO FAR, AS DRAWN (round 26): how many, what each is, and how
   many acts each carried — the server writes the count with the download
   (trail_exports.acts); a row without one says so with a dash */
function stTrailPastHtml(){
  const L=_stTr.list, total=_stTr.total!=null?_stTr.total:(L?L.length:null);
  const head=`<p class="st-ps-l st-tr-past-h">${esc(i18t('st_tr_past'))}${total!=null?` <span class="st-pill-n">${total}</span>`:''} <span class="st-ps-q">${esc(i18t('st_tr_past_sub2'))}</span></p>`;
  if(!L) return head+`<p class="st-ps-none">${(typeof busyHtml==='function')?busyHtml(i18t('st_tr_loading')):''}</p>`;
  if(!L.length) return head+`<p class="st-ps-none">${esc(i18t('st_tr_past_none'))}</p>`;
  const loc=(typeof jxLocale==='function')?jxLocale():undefined;
  return head+`<table class="st-ps-tb st-tr-tb"><thead><tr><th>${esc(i18t('st_tr_col_when'))}</th><th>${esc(i18t('st_tr_col_who'))}</th><th>${esc(i18t('st_tr_col_period'))}</th><th>${esc(i18t('st_tr_col_as'))}</th><th class="r">${esc(i18t('st_tr_col_acts'))}</th></tr></thead><tbody>${
    L.map(r=>`<tr><td class="st-ps-when">${esc(stAwayDay(r.at))}</td><td class="st-ps-who">${esc(r.who||'—')}</td><td>${esc(stTrailPeriodWords(r.from,r.to))}</td><td>${esc(i18t(String(r.as||'')==='pdf'?'st_tr_as_pdf':'st_tr_as_csv'))}</td>
      <td class="r st-tr-acts">${r.acts==null||r.acts===''?'—':esc(Number(r.acts).toLocaleString(loc))}</td></tr>`).join('')}</tbody></table>`;
}
function stTrailPaint(part){
  const go=document.getElementById('st-tr-go'), past=document.getElementById('st-tr-past');
  /* the button is drawn again with every count: a readied one stays lit and
     keeps the reader's focus (Jambo's "download … as a PDF") */
  const had=document.activeElement&&document.activeElement.id==='st-tr-download';
  if((!part||part==='go')&&go){ go.innerHTML=stTrailGoHtml();
    if(had){ const b=document.getElementById('st-tr-download'); if(b) try{ b.focus({preventScroll:true}); }catch(_){} } }
  if((!part||part==='past')&&past) past.innerHTML=stTrailPastHtml();
}
let _stTrSumT=0;
function stTrailCount(){
  const d=_stTr; clearTimeout(_stTrSumT);
  if(stTrailBad()){ stTrailPaint('go'); return; }
  const key=stTrailQuery(); d.sumErr=''; stTrailPaint('go');
  _stTrSumT=setTimeout(async()=>{
    try{ const s=await api('trail/summary?'+key); if(key!==stTrailQuery()) return; d.sum=s; d.sumKey=key; }
    catch(e){ if(key!==stTrailQuery()) return; d.sumErr=i18t('st_tr_count_failed'); }
    stTrailPaint('go');
    stJbDataRepaint();
  },250);
}
async function stTrailList(){
  try{ const r=await api('trail/exports'); _stTr.list=(r&&Array.isArray(r.exports))?r.exports:[]; _stTr.total=(r&&typeof r.total==='number')?r.total:null; }
  catch(_){ _stTr.list=[]; }
  stTrailPaint('past');
}
async function stTrailDownload(){
  const d=_stTr; if(stTrailBad()||d.busy) return;
  d.busy=true; d.err=''; stTrailPaint('go');
  try{
    const res=await fetch('api/trail/export?'+stTrailQuery({ as:d.as }),{ credentials:'same-origin' });
    if(!res.ok){ let why=res.statusText; try{ why=(await res.json()).error||why; }catch(_){ } throw new Error(why); }
    const blob=await res.blob();
    const name=`hati-trail-${d.from}-to-${d.to}.${d.as}`;
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    toast(i18t('st_tr_done'),'ok');
    stTrailList(); stTrailCount();
  }catch(e){ d.err=i18t('st_tr_failed',{why:(e&&e.message)||''}); }
  d.busy=false; stTrailPaint('go');
}
function stBkWire(){
  const host=document.getElementById('st-bk-pane'); if(!host) return;
  const turn=b=>{
    _stBkTab=b.getAttribute('data-st-bk-tab')==='trail'?'trail':'backup';
    document.querySelectorAll('[data-st-bk-tab]').forEach(x=>{ const on=x.getAttribute('data-st-bk-tab')===_stBkTab; x.classList.toggle('is-on',on); x.setAttribute('aria-selected',String(on)); });
    host.innerHTML=stBkPaneHtml();
    stBkWirePane();
    /* Jambo's words follow the tab in front (round 26 as drawn) */
    if(typeof stJbFeedRepaint==='function') stJbFeedRepaint();
  };
  /* ON THE PAGE the tabs sit inside the pane's head card (round 26 as drawn),
     so their press is delegated to the pane, armed once; in the drawer they
     sit above it, bound once each */
  if(!host.dataset.bkTabs){ host.dataset.bkTabs='1';
    host.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-st-bk-tab]'); if(b) turn(b); }); }
  document.querySelectorAll('[data-st-bk-tab]').forEach(b=>{ if(host.contains(b)||b.dataset.bkBound) return; b.dataset.bkBound='1'; b.addEventListener('click',()=>turn(b)); });
  stBkWirePane();
}
function stBkWirePane(){
  /* on Backup too, Jambo says the trail's count (round 26 as drawn): it is
     read whichever tab is in front */
  if(_stBkTab!=='trail'){ stWireBackup(); if(stTrailOn()&&!stTrailBad()&&!(_stTr.sum&&_stTr.sumKey===stTrailQuery())) stTrailCount(); return; }
  const d=_stTr;
  const on=(id,ev,fn)=>{ const el=document.getElementById(id); if(el) el.addEventListener(ev,fn); };
  on('st-tr-from','change',e=>{ d.from=e.target.value; stTrailCount(); });
  on('st-tr-to','change',e=>{ d.to=e.target.value; stTrailCount(); });
  on('st-tr-stream','change',e=>{ d.stream=e.target.value||'all'; stTrailCount(); });
  on('st-tr-as-sel','change',e=>{ d.as=e.target.value==='pdf'?'pdf':'csv'; });
  document.querySelectorAll('input[name="st-tr-as"]').forEach(r=>r.addEventListener('change',()=>{
    d.as=r.value==='pdf'?'pdf':'csv';
    document.querySelectorAll('.st-tr-as .st-ps-radio').forEach(l=>l.classList.toggle('is-on',!!l.querySelector('input:checked')));
  }));
  /* the button is drawn again with every count, so its press is asked of the live one */
  const go=document.getElementById('st-tr-go');
  if(go&&!go.dataset.wired){ go.dataset.wired='1'; go.addEventListener('click',e=>{ if(e.target.closest('#st-tr-download')) stTrailDownload(); }); }
  stDressPage();
  if(typeof window.popupControlsDress==='function') try{ popupControlsDress(document.getElementById('st-bk-pane')); }catch(_){}
  stTrailCount(); stTrailList();
}
/* the Backup tab: the drawer as it was before The trail came */
function stBackupBodyHtml(){ return `<div style="display:flex;flex-wrap:wrap;gap:var(--s-2)">
        <button id="bk-export" style="${ST_BTN2}">${icon('download','w-3.5 h-3.5')} ${i18t('set_export_backup')}</button>
        ${API_MODE()?`<a id="bk-zip" href="api/export/workspace.zip" style="${ST_BTN2};text-decoration:none">${icon('download','w-3.5 h-3.5')} ${i18t('set_full_workspace_zip')}</a>`:`
        <label style="${ST_BTN2};cursor:pointer">${icon('upload','w-3.5 h-3.5')} ${i18t('set_restore_backup')}<input id="bk-import" type="file" accept=".json,application/json" style="display:none"/></label>`}
      </div>
      ${!API_MODE()?`<div class="st-danger"><button id="bk-reset" style="${ST_BTN_DANGER}">${icon('ban','w-3.5 h-3.5')} ${i18t('set_reset_workspace')}</button></div>`:''}`; }
function stWireBackup(){
  document.getElementById('bk-export')?.addEventListener('click',()=>settingsExportBackup());
  document.getElementById('bk-import')?.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=async()=>{ let b;
      try{ b=JSON.parse(rd.result); if(b.kind!=='hati-backup'||!b.org||!b.users) throw new Error('bad'); }
      catch(err){ stDrawerRefuse(i18t('set_t_bad_backup')); return; }
      if(!await confirmDialog({title:i18t('st_restore_q'), message:i18t('st_restore_msg'), confirmLabel:i18t('st_restore_go'), danger:true})) return;
      lsSet(LS.org,b.org); saveUsers(b.users); if(b.data) lsSet(LS.data,b.data);
      localStorage.removeItem(LS.session); location.reload();
    };
    rd.readAsText(f);
  });
  document.getElementById('bk-reset')?.addEventListener('click',async()=>{
    if(await confirmDialog({title:i18t('st_erase_q'), message:i18t('st_erase_msg'), confirmLabel:i18t('st_erase_go'), danger:true})){
      Object.values(LS).forEach(k=>localStorage.removeItem(k)); location.reload();
    }
  });
}

/* ---- samples: origin, and a confirm that names exactly what goes ---- */
function stSampleContracts(){ return (state.contracts||[]).filter(c=>c&&c.seeded===true); }
async function stClearSamples(){
  const s=stSampleContracts(); if(!s.length) return;
  const ok=await confirmDialog({ title:i18t('set_demo_clear'),
    message:i18t('set_demo_clear_msg',{n:s.length})+'\n\n'+s.map(c=>c.name).join('\n'),
    confirmLabel:i18t('set_demo_clear'), danger:true });
  if(!ok) return;
  /* NOT the per-contract delete: that one refuses anything past Draft or Under
     Review, and half the samples are seeded as Signed — so driving this through
     it would have left the signed examples behind and reported success. The
     server decides by ORIGIN and answers with what actually went. */
  let gone=0;
  if(API_MODE()){
    try{ const r=await api('demo/clear','POST',{});
      const ids=new Set((r&&r.removed)||[]);
      state.contracts=(state.contracts||[]).filter(c=>!ids.has(c.id));
      gone=ids.size;
    }catch(e){ stDrawerRefuse(e.message); return; }
  } else {
    const ids=new Set(s.map(c=>c.id));
    state.contracts=(state.contracts||[]).filter(c=>!ids.has(c.id));
    gone=ids.size; persist();
  }
  if(state.activeId && !getContract(state.activeId)) state.activeId=null;
  if(window.updateSidebarCounts) updateSidebarCounts();
  toast(i18t('set_demo_cleared_n',{n:gone}));
  renderTeam(); stDrawerOpen('samples');
}

/* ---- workspace-wide integrity, read-only ---- */
let _stIntegrity=null;
function stIntegrityHtml(r){
  return `<b>${i18t('set_integrity_result',{checked:r.checked,clean:r.clean,faults:r.faults})}</b>`
    +(r.at?`<br><span style="color:var(--color-neutral-500)">${fmtDT(r.at)}</span>`:'')
    +(r.bad&&r.bad.length?`<br>${r.bad.slice(0,8).map(b=>`${esc(b.name)} — ${esc(b.why||'')}`).join('<br>')}${r.bad.length>8?`<br>+${r.bad.length-8}`:''}`:'');
}
async function stRunIntegrity(){
  const out=document.getElementById('st-integrity-out');
  if(out) out.innerHTML=window.busyHtml?busyHtml(i18t('set_integrity_running')):i18t('set_integrity_running');
  const list=(state.contracts||[]).slice();
  const bad=[]; let checked=0;
  for(const c of list){
    try{
      if(typeof ensureFull==='function') await ensureFull(c);
      if(typeof negoIntegrityReport!=='function') break;
      const r=await negoIntegrityReport(c);
      checked++;
      if(!r.ok) bad.push({ name:c.name, why:r.firstBroken||'' });
    }catch(e){ bad.push({ name:c.name, why:(e&&e.message)||'' }); checked++; }
  }
  _stIntegrity={ at:nowISO(), checked, clean:checked-bad.length, faults:bad.length, bad };
  if(out) out.innerHTML=stIntegrityHtml(_stIntegrity);
  if(document.getElementById('set-page')) renderTeam();
}

/* ---- the go-live checklist: every row read off the workspace ---- */
function stGoLive(){
  const ob=(typeof window!=='undefined'&&window.ORG_BRANDING)||null;
  const rows=[];
  rows.push({ key:'entity', label:i18t('st_b_go_entity'),
    ok: !!((ob&&ob.companyName)||(getOrg()&&getOrg().name)),
    detail:(ob&&ob.companyName)||(getOrg()&&getOrg().name)||i18t('st_not_set'), go:'platform:company' });
  /* THE GO-LIVE ROW IS CALLED "MAIL DELIVERING", so it has to mean delivering.
     It read emailOff() — configured or not — and ticked green over a provider
     refusing every message. A green tick that is wrong is worse than no row. */
  if(API_MODE()){
    const mailOff=(typeof emailOff==='function')&&emailOff();
    const mailFail=(typeof emailFailing==='function')&&emailFailing();
    rows.push({ key:'mail', label:i18t('st_b_go_mail'),
      ok: !mailOff && !mailFail,
      detail: mailOff ? i18t('set_email_not_configured')
        : mailFail ? i18tn('set_email_failing', emailFailedCount(), { n:emailFailedCount() })
        : i18t('set_email_configured'), go:'build:mail' });
  }
  const aiOn=(typeof copilotAvailable==='function')&&copilotAvailable();
  rows.push({ key:'key', label:i18t('st_b_go_key'), ok:aiOn,
    detail:aiOn?i18t('set_configured'):i18t('set_not_configured'), go:'build:engine' });
  const cap=Number(((state.aiCfg||{}).limits||{}).dailySpendLimit||0);
  rows.push({ key:'ceiling', label:i18t('st_b_go_ceiling'), ok:cap>0,
    detail:cap>0?`$${cap.toFixed(2)}`:i18t('st_not_set'), go:'build:engine' });
  const nRules=(typeof approvalRules==='function'?approvalRules():[]).length;
  rows.push({ key:'rule', label:i18t('st_b_go_rule'), ok:nRules>0,
    detail:nRules?String(nRules):i18t('set_no_approval_rules'), go:'platform:approvals' });
  const nS=stSampleContracts().length;
  rows.push({ key:'samples', label:i18t('st_b_go_samples'), ok:nS===0,
    detail:nS?i18tn('set_demo_still_here',nS,{n:nS}):i18t('set_demo_cleared'), go:'build:samples' });
  rows.push({ key:'integrity', label:i18t('set_integrity_title'),
    ok: !!(_stIntegrity && _stIntegrity.faults===0),
    detail: _stIntegrity? i18t('set_integrity_result',{checked:_stIntegrity.checked,clean:_stIntegrity.clean,faults:_stIntegrity.faults}) : i18t('set_integrity_never'),
    go:'build:integrity' });
  /* EVERYONE WHO MAY SIGN HAS BEEN THOUGHT ABOUT. The row is drawn whether or
     not the rule is in force — an admin going live wants to have decided —
     and its detail says which of those two worlds they are in, so a green tick
     never reads as "and it is being enforced" when it is not. */
  if(typeof signCapUnanswered==='function'){
    const un=signCapUnanswered();
    rows.push({ key:'caps', label:i18t('sc_go_capped'), ok:un.length===0,
      detail:(un.length?i18tn('sc_unanswered',un.length,{n:un.length}):i18t('sc_ladder'))
        +((typeof signCapEnforced==='function'&&signCapEnforced())?'':' · '+i18t('sc_not_enforced')),
      go:'platform:approvals' });
  }
  const bk=stLastBackup();
  rows.push({ key:'backup', label:i18t('st_b_go_backup'), ok:!!bk,
    detail:bk?fmtDT(bk):i18t('st_not_set'), go:'platform:backup' });
  if(API_MODE()) rows.push({ key:'firstsend', label:i18t('st_b_go_firstsend'),
    ok: _stActivation ? _stActivation.northStar && _stActivation.northStar.withinSevenDays===true : false,
    detail: _stActivation && _stActivation.northStar && _stActivation.northStar.firstSendDays!=null
      ? String(_stActivation.northStar.firstSendDays) : i18t('set_north_star_none'), go:'build:pilot' });
  return rows;
}

/* ---- COPILOT ENGINE — the existing panel, relocated whole ----
   Key status, fast/deep routing with the models actually in force, the global
   override, today's spend against the budget with the per-feature ledger, every
   ceiling field, the onboarding allowance and the editable rate table. USD,
   because the API bills in USD. */
/* ============================================================================
   WHAT BECAME OF COPILOT'S PROPOSALS (idea 23)
   ----------------------------------------------------------------------------
   The engine drawer already answers what Copilot COST. This answers what came
   of it, which is the question an admin actually has when they look at that
   figure: of the wording it proposed, how much went into agreements as
   written, how much was rewritten first, and how much nobody used.

   IT IS A READING AND IT ADDS NO ROUTE. Every figure is counted in the browser
   off `state.contracts` — the caller's own already-scoped bootstrap, exactly as
   the portfolio panels and the payment-terms tab are counted — so it is live on
   every draw and there is nothing to schedule, invalidate or fetch. The spend
   table above it comes from the server because only the server knows what
   Anthropic charged; this comes from the book because only the book knows what
   happened to the words.

   COUNTING IS NOT DRAWING: aiTraceStats returns plain data and draws nothing;
   this draws it and counts nothing of its own.

   ---- THE TABLE PRINTS COUNTS AND THE TILES PRINT SHARES ----
   A DEPARTURE FROM THE DRAWING, which put a percentage in every cell. A
   percentage per row hides its own sample size, and three rounded shares in one
   row regularly sum to 99 or 101 — a table that does not add up is a table
   nobody trusts. The counts are exact and the Proposals column beside them is
   the denominator, so a reader can still see the rate. In the TILES, where
   shares are the point, "not taken" takes the rounding residual: it errs
   towards showing a lower acceptance, which is the honest direction for a
   number this product has an interest in.

   ---- AND IT SAYS WHEN THE COUNTING STARTED ----
   A workspace with a year of Copilot behind it would otherwise read this as
   "3 proposals" and conclude nobody uses the thing. The recording began when it
   was built; nothing before it can ever be counted, and the note says so rather
   than leaving an admin to infer it from a number that looks wrong.
   ==========================================================================*/
function stAcceptanceHtml(){
  if (typeof window.aiTraceStats !== 'function') return '';
  let d = null;
  try{ d = aiTraceStats((typeof state !== 'undefined' && state.contracts) || []); }
  catch(_){ return ''; }
  const head = `<div style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text)">${
    esc(i18t('ai_tr_title'))}</div><p class="st-note">${esc(i18t('ai_tr_sub'))}</p>`;
  /* ---- WHAT THE BOOK ALREADY HOLDS (owner-asked 9 Sep 2026) ----
     The recording starts the day it ships, so without this the section opens
     empty on every workspace and stays that way for weeks — which the owner
     met and reported as the feature not being there at all. History can answer
     ONE question honestly (how much of Copilot's wording was actually filed)
     and cannot answer the other three, so it is a COUNT with its own limit
     written under it rather than a second table pretending to the same
     columns. See aiTraceHistory for why the playbook half is not countable. */
  let hist = { taken: 0, contracts: 0 };
  try{ if (typeof window.aiTraceHistory === 'function')
    hist = aiTraceHistory((typeof state !== 'undefined' && state.contracts) || []); }catch(_){ }
  const before = hist.taken
    ? `<div style="font-size:var(--t-label);color:var(--color-neutral-600);margin-top:6px">${
        esc(i18tn('ai_tr_before', hist.taken, { n: hist.taken }))}</div>
       <p class="st-note" style="margin-top:2px">${esc(i18t('ai_tr_before_why'))}</p>`
    : '';
  /* An empty state that only says "nothing here" leaves the reader to work out
     whether that is because nobody uses Copilot or because something is
     broken. It says which, and what will fill it. */
  if (!d.proposals && !d.readings) return `<div class="st-sec" id="ai-acceptance">${head}
    <div style="font-size:var(--t-label);color:var(--color-neutral-500);margin-top:6px">${
      esc(i18t(hist.taken ? 'ai_tr_since_none' : 'ai_tr_none'))}</div>
    ${hist.taken ? '' : `<p class="st-note" style="margin-top:4px">${esc(i18t('ai_tr_none_why'))}</p>`}
    ${before}</div>`;
  const sh = aiTraceShares(d);
  const tile = (n, w) => `<div style="border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-2)">
    <div style="font-size:var(--t-section);font-weight:var(--w-title);color:var(--color-text);line-height:var(--lh-tight)">${esc(String(n))}</div>
    <div style="font-size:var(--t-label);color:var(--color-neutral-600);margin-top:2px">${esc(w)}</div></div>`;
  const cell = (v, strong) => `<span style="flex:none;width:72px;text-align:right;font-family:var(--font-mono);font-size:var(--t-label)${
    strong ? ';font-weight:var(--w-strong)' : ';color:var(--color-neutral-600)'}">${esc(String(v))}</span>`;
  const rows = d.rows.map(r => `<div style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-1) var(--s-2);border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);font-size:var(--t-label)">
      <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(aiTraceFeatureLabel(r.feature))}</span>
      ${cell(r.proposals, true)}${cell(r.asIs)}${cell(r.edited)}${cell(r.refused + r.pending)}
    </div>`).join('');
  return `<div class="st-sec" id="ai-acceptance">${head}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:var(--s-2);margin:6px 0 var(--s-2)">
      ${tile(d.proposals, i18t('ai_tr_proposals'))}
      ${tile(sh.asIs + '%', i18t('ai_tr_as_is'))}
      ${tile(sh.edited + '%', i18t('ai_tr_edited'))}
      ${tile(sh.notTaken + '%', i18t('ai_tr_not_taken'))}
    </div>
    <div style="border:1px solid var(--color-divider);border-radius:var(--radius);overflow:hidden">
      <div style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-1) var(--s-2);border-bottom:1px solid var(--color-divider);font-size:var(--t-micro);font-weight:var(--w-title);color:var(--color-neutral-500)">
        <span style="flex:1;min-width:0">${esc(i18t('ai_tr_th_feature'))}</span>
        <span style="flex:none;width:72px;text-align:right;white-space:nowrap">${esc(i18t('ai_tr_th_proposals'))}</span>
        <span style="flex:none;width:72px;text-align:right;white-space:nowrap">${esc(i18t('ai_tr_th_as_is'))}</span>
        <span style="flex:none;width:72px;text-align:right;white-space:nowrap">${esc(i18t('ai_tr_th_edited'))}</span>
        <span style="flex:none;width:72px;text-align:right;white-space:nowrap">${esc(i18t('ai_tr_th_not_taken'))}</span>
      </div>${rows}</div>
    ${d.readings ? `<div style="font-size:var(--t-label);color:var(--color-neutral-500);margin-top:6px">${
      esc(i18tn('ai_tr_readings', d.readings, { n: d.readings }))}</div>` : ''}
    <p class="st-note" style="margin-top:6px">${esc(i18t('ai_tr_note'))} ${esc(i18t('ai_tr_untaken_note'))} ${esc(i18t('ai_tr_started'))}</p>
    ${before}
  </div>`;
}
/* ---- A VERB THAT CANNOT WORK IS GREYED, WITH THE REASON (owner-reported
   21 Sep 2026: "I can save but i cannot delete") ----
   MEASURED against a real server before a line moved: Remove key was never
   broken. It clears the key stored in this workspace exactly as it always
   did -- with a key ALSO set in the server's environment the read afterwards
   answers {configured:true, source:'env'}, which is correct. What was missing
   is that the SCREEN said nothing: the status line reads "Configured" before
   and after, so the only visible difference is four masked characters and a
   parenthetical, and once the key comes from the environment the press is a
   no-op that still shows a confirm and a toast. That is a dead button wearing
   a live one's clothes -- this codebase's own named fault class.

   THE APP CANNOT DELETE THE SERVER'S OWN KEY and must never pretend to: that
   one is removed where the environment is edited (on Render, the service's
   Environment settings). So the button says so instead.

   ONE READING, asked at every paint, so the sign and the wall cannot
   disagree. `undefined` is "not known yet" and is NOT "there is nothing to
   remove" -- a failed read must not claim an absence. */
/* A COPILOT KEY LOOKS LIKE ONE (the owner's list, 27 Sep 2026). The browser
   could fill a saved login password into this box, and Save stored it as the
   key. A key is one word that starts "sk-ant-"; anything else is refused in
   words, here and on the server (aiKeyShapeOk). */
function aiKeyLooksRight(k){ return /^sk-ant-\S{4,}$/.test(String(k||'').trim()); }
function stKeyRemovable(source){
  if(source==='settings') return { can:true, why:'' };
  if(source==='env') return { can:false, why:i18t('set_key_env_locked') };
  if(source===undefined) return { can:false, why:i18t('set_checking') };
  return { can:false, why:i18t('set_key_none_to_remove') };
}
/* ONE PAINTER, two homes (the local-mode panel and the server one), for the
   reason every shared control in this product has one: a rule written twice
   is a rule that drifts. The button carries inline styles, so the greying is
   written on the element rather than in a sheet that would lose to them. */
function stPaintKeyClear(source){
  const b=document.getElementById('ai-key-clear'); if(!b) return;
  const r=stKeyRemovable(source);
  b.disabled=!r.can;
  b.style.opacity=r.can?'':'.5';
  b.style.cursor=r.can?'pointer':'default';
  b.title=r.why;
  b.setAttribute('aria-disabled', r.can?'false':'true');
}
function stEngineBodyHtml(){
  if(!API_MODE()){
    return `<div id="ai-cfg-status" style="font-size:var(--t-label);color:var(--color-neutral-700);margin-bottom:var(--s-2)">${window.busyHtml?busyHtml(i18t('set_checking')):i18t('set_checking')}</div>
      <div style="display:flex;gap:var(--s-2);align-items:flex-end">
        <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${i18t('set_api_key')}</span>
          <input id="ai-key" type="password" autocomplete="new-password" data-lpignore="true" data-1p-ignore="true" spellcheck="false" placeholder="sk-ant-…" style="${window.RV_FLD||ST_INPUT}"/></label>
        <button id="ai-key-save" style="${ST_BTN}">${i18t('set_save_key')}</button>
      </div>
      <button id="ai-key-clear" type="button" disabled aria-disabled="true" class="ui-link ui-link-danger" style="margin-top:6px;cursor:default;opacity:.5">${i18t('set_remove_key')}</button>
      <p class="st-note" style="margin-top:var(--s-3)">${i18t('set_local_mode_note')}</p>
      ${''/* THE ACCEPTANCE READING IS DRAWN HERE TOO, and that is the one-builder
             rule rather than a convenience: it counts the book in the browser and
             needs no server at all, so a workspace running without one has exactly
             the same question and would otherwise lose the answer for no reason.
             The spend table above it is absent here because only a server knows
             what was charged; this one does not depend on that. */}
      ${stAcceptanceHtml()}`;
  }
  return `
    <div id="ai-cfg-status" style="font-size:var(--t-label);color:var(--color-neutral-700);margin-bottom:var(--s-2)">${window.busyHtml?busyHtml(i18t('set_checking')):i18t('set_checking')}</div>
    <div style="display:flex;gap:var(--s-2);align-items:flex-end">
      <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${i18t('set_api_key')}</span>
        <input id="ai-key" type="password" autocomplete="new-password" data-lpignore="true" data-1p-ignore="true" spellcheck="false" placeholder="sk-ant-…" style="${window.RV_FLD||ST_INPUT}"/></label>
      <button id="ai-key-save" style="${ST_BTN}">${i18t('set_save_key')}</button>
    </div>
    <button id="ai-key-clear" type="button" disabled aria-disabled="true" class="ui-link ui-link-danger" style="margin-top:6px;cursor:default;opacity:.5">${i18t('set_remove_key')}</button>

    <div class="st-sec st-sec-top">
      <div style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_spend_today')}</div>
      <div id="ai-usage" style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:6px 0 var(--s-1)">${i18t('set_today_dash')}</div>
      <div style="height:6px;background:var(--color-neutral-200);border-radius:var(--radius);overflow:hidden;margin-bottom:var(--s-2)"><div id="ai-usage-bar" style="width:0%;height:100%;background:var(--color-accent);transition:width var(--dur-3)"></div></div>
      <div id="ai-spend-breakdown" style="margin-bottom:10px"></div>
    </div>

    ${stAcceptanceHtml()}

    ${''/* ---- THE PANEL IS THE KEY, THE MONEY AND WHAT CAME OF IT (owner-asked
           9 Sep 2026) ----
           "delete anything unnecessary information in the panel ... The only
           thing i use currently is where i enter the anthropic key." Eight
           sections of number boxes stood between the key and everything a
           person actually reads, and the owner's own drawing of this panel has
           three: the key, the spend, and what became of its proposals.

           SO IT FOLDS RATHER THAN DELETES, which is this product's own answer
           to a panel with too much on it (the workspace-status foot, 20 Aug).
           Nothing here is decoration: the daily budget is the one real money
           wall, "Prepare renewal notes" is the switch on the ONE thing HaTi
           spends on unasked, and a stale rate table silently under-reports the
           bill. Deleting any of those would take a wall away rather than tidy
           a screen, so every one of them is still here and still one press
           away — which is what "stoppable from a screen" has always meant.

           IT IS SHUT BY DEFAULT and holds its own state for the sitting only:
           a drawer that remembered being open would put the wall of boxes back
           for the one reader who ever opened it. */}
    <details class="st-adv" id="ai-advanced">
      <summary class="st-adv-sum">${i18t('set_more_settings')}</summary>
      <p class="st-note" style="margin-top:2px">${i18t('set_more_settings_sub')}</p>

    <div class="st-sec">
      <div style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_model_routing')}</div>
      <p class="st-note">${i18t('set_override_blank')}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--s-2);margin-top:6px">
        <div style="border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-2)">
          <div style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_fast_tier')}</div>
          <div style="font-size:var(--t-label);color:var(--color-neutral-500);margin:2px 0 var(--s-1)">${i18t('set_fast_sub')}</div>
          <div style="font-size:var(--t-label);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${i18t('set_current')} <span id="ai-model-fast-cur" style="font-family:var(--font-mono)">—</span></div>
          <input id="ai-model-fast" type="text" placeholder="${esc(i18t('set_ph_default_rec'))}" style="${ST_MONO}"/>
        </div>
        <div style="border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-2)">
          <div style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_deep_tier')}</div>
          <div style="font-size:var(--t-label);color:var(--color-neutral-500);margin:2px 0 var(--s-1)">${i18t('set_deep_sub')}</div>
          <div style="font-size:var(--t-label);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${i18t('set_current')} <span id="ai-model-deep-cur" style="font-family:var(--font-mono)">—</span></div>
          <input id="ai-model-deep" type="text" placeholder="${esc(i18t('set_ph_default_rec'))}" style="${ST_MONO}"/>
        </div>
      </div>
      <details style="font-size:var(--t-label);margin-top:var(--s-2)">
        <summary style="cursor:pointer;color:var(--color-neutral-600)">${i18t('set_advanced_override')}</summary>
        <div style="margin-top:6px;display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2)">
          <input id="ai-model-global" type="text" placeholder="${esc(i18t('set_ph_none'))}" style="${ST_MONO};width:220px"/>
          <span style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_forces_one_model')}</span>
        </div>
      </details>
      <button id="ai-model-save" style="margin-top:var(--s-2);${ST_BTN_SM}">${i18t('set_save_model')}</button>
    </div>

    <div class="st-sec">
      <div style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_spend_controls')}</div>
      <p class="st-note">${i18t('set_spend_governed')} ${i18t('set_spend_money')}</p>
      ${''/* ---- AND THE SAME MONEY BY PERSON ----
             It is here, under the by-feature breakdown, because this is where
             the money already lives — and NOT on the People tab, where a
             per-person cost column would turn a list about permissions into a
             league table. That is a different product decision from showing an
             admin where the money went.

             NOTHING IS REFUSED BY IT. Phase 1 shows the numbers; a cap
             designed before anybody has seen them is a cap set to the wrong
             figure. The note says what the figure IS, because somebody will
             read it as a performance measure otherwise. */}
      <div id="ai-spend-people" style="margin-bottom:10px"></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--s-2)">
        ${stLimitField('ai-daily-spend',i18t('set_lim_daily_spend'),i18t('set_lim_daily_spend_sub'),0)}
        ${stLimitField('ai-estimate-confirm',i18t('set_lim_confirm'),i18t('set_lim_confirm_sub'),0)}
        ${stLimitField('ai-rate-light',i18t('set_lim_light'),i18t('set_lim_light_sub'),1)}
        ${stLimitField('ai-rate-deep',i18t('set_lim_deep'),i18t('set_lim_deep_sub'),1)}
        ${stLimitField('ai-rate-ocr',i18t('set_lim_ocr'),i18t('set_lim_ocr_sub'),1)}
        ${stLimitField('ai-daily',i18t('set_lim_daily_req'),i18t('set_lim_daily_req_sub'),0)}
        ${stLimitField('ai-ocr-pages',i18t('set_lim_ocr_pages'),i18t('set_lim_ocr_pages_sub'),1)}
        ${stLimitField('ai-maxchars',i18t('set_lim_chars'),i18t('set_lim_chars_sub'),1000)}
        ${stLimitField('ai-docchars',i18t('set_lim_doc'),i18t('set_lim_doc_sub'),1000)}
        ${stLimitField('ai-maxcontracts',i18t('set_lim_contracts'),i18t('set_lim_contracts_sub'),1)}
        ${stLimitField('ai-renewal-max',i18t('set_lim_renewal_max'),i18t('set_lim_renewal_max_sub'),1)}
      </div>
      <label style="display:flex;align-items:flex-start;gap:var(--s-2);margin-top:9px;font-size:var(--t-label);color:var(--color-neutral-700);line-height:1.45;cursor:pointer">
        <input id="ai-thorough" type="checkbox" style="margin-top:2px;width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
        <span><b>${i18t('set_thorough_extraction')}</b> ${i18t('set_thorough_body')}
        <span style="color:var(--st-amber-fg)">${i18t('set_thorough_warn')}</span> ${i18t('set_preflight')}</span></label>
      ${''/* THE ONE THING HaTi SPENDS ON WITHOUT BEING ASKED, so it has a
             switch. Every other Copilot charge in this product is set off by
             somebody pressing something; this one is booked to the contract's
             owner and happens while nobody is watching, and money spent unasked
             has to be stoppable from a screen. Absent means ON. */}
      <label style="display:flex;align-items:flex-start;gap:var(--s-2);margin-top:9px;font-size:var(--t-label);color:var(--color-neutral-700);line-height:1.45;cursor:pointer">
        <input id="ai-renewal-prep" type="checkbox" style="margin-top:2px;width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
        <span><b>${i18t('set_renewal_prep')}</b> ${i18t('set_renewal_prep_body')}</span></label>
      ${''/* JAMBO TAKES YOU THERE (owner, 22 Oct 2026: "a customer can choose to
             turn it off if cost is an issue"; on by default): what it adds is
             said in calls and words, never money (the owner's answer (4), 19 Oct) */}
      <label style="display:flex;align-items:flex-start;gap:var(--s-2);margin-top:9px;font-size:var(--t-label);color:var(--color-neutral-700);line-height:1.45;cursor:pointer">
        <input id="ai-navigate" type="checkbox" checked style="margin-top:2px;width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
        <span><b>${i18t('set_ai_navigate')}</b> ${i18t('set_ai_navigate_body')} ${i18t('set_ai_navigate_cost')}</span></label>
      <button id="ai-limits-save" style="margin-top:9px;${ST_BTN_SM}">${i18t('set_save_limits')}</button>
    </div>

    ${''/* WHAT IT COST is directly above; WHAT CAME OF IT is here, because those
           are the two halves of one question and an admin reading the first
           immediately has the second. It sits after the spend section rather
           than at the foot of the drawer for that reason, and everything below
           it — the allowance, the rate table, the backfill — is configuration
           rather than a reading. */}
    <div class="st-sec">
      <div style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_onboarding_allowance')}</div>
      <p class="st-note">${i18t('set_allowance_sub')}</p>
      <div id="ai-allowance-state" style="font-size:var(--t-meta);color:var(--color-neutral-700);margin:6px 0">—</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--s-2)">
        ${stLimitField('ai-allow-budget',i18t('set_lim_allow_budget'),i18t('set_lim_allow_budget_sub'),0)}
        ${stLimitField('ai-allow-docs',i18t('set_lim_allow_docs'),i18t('set_lim_allow_docs_sub'),0)}
      </div>
      <div style="display:flex;gap:var(--s-2);margin-top:var(--s-2);flex-wrap:wrap">
        <button id="ai-allow-open" style="${ST_BTN_SM}">${i18t('set_open_allowance')}</button>
        <button id="ai-allow-topup" style="${ST_BTN2};font-size:var(--t-meta);padding:5px 10px">${i18t('set_top_up')}</button>
        <button id="ai-allow-close" style="${ST_BTN2};font-size:var(--t-meta);padding:5px 10px">${i18t('act_close')}</button>
      </div>
    </div>

    <div class="st-sec">
      <div style="display:flex;align-items:baseline;gap:var(--s-2);flex-wrap:wrap">
        <div style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_rate_table')}</div>
        <span id="ai-rates-meta" style="font-size:var(--t-label);color:var(--color-neutral-500)"></span>
      </div>
      <p class="st-note">${i18t('set_usd_per')} ${i18t('set_per_million')}</p>
      <div id="ai-rates-table" style="max-height:220px;overflow-y:auto" class="scroll-thin"></div>
      <div style="display:flex;gap:var(--s-2);margin-top:var(--s-2);flex-wrap:wrap">
        <button id="ai-rates-save" style="${ST_BTN_SM}">${i18t('set_save_rates')}</button>
        <button id="ai-rates-reset" style="${ST_BTN2};font-size:var(--t-meta);padding:5px 10px">${i18t('set_reset_defaults')}</button>
      </div>
    </div>

    <div class="st-sec">
      <div style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text);margin-bottom:2px">${i18t('set_file_existing')}</div>
      <p class="st-note">${i18t('set_file_existing_sub')}</p>
      <button id="meta-backfill" style="margin-top:6px;${ST_BTN2}">${icon('sparkle','w-3.5 h-3.5')} <span id="meta-backfill-lbl">${i18t('set_extract_metadata')}</span></button>
    </div>
    </details>`;
}
function stWireEngine(){
  if(!API_MODE()){
    /* Local mode: no server to hold the key — persist it in this browser so the
       field is present and remembered; Copilot still uses the built-in
       interpreter. */
    const st=document.getElementById('ai-cfg-status');
    const refresh=()=>{ const k=lsGet('hati.v1.aikey');
      /* Painted BEFORE the early return: the status line and the verb are two
         readings of one fact, and a panel drawn without its status element
         must still not offer a press that would do nothing. */
      stPaintKeyClear(k?'settings':null);
      if(!st) return;
      st.innerHTML=k?`<span style="color:var(--st-green-fg);font-weight:var(--w-strong)">● Configured</span> · key ••••${String(k).slice(-4)} stored in this browser — Jambo is live.`
                    :`<span style="color:var(--st-amber-fg);font-weight:var(--w-strong)">● Not configured</span> — Jambo and Jambo features use the built-in interpreter.`; };
    refresh();
    const refreshAiIndicators=()=>{ if(typeof renderSideUser==='function') renderSideUser(); if(typeof updateAiBrainPill==='function') updateAiBrainPill(); };
    document.getElementById('ai-key-save')?.addEventListener('click',()=>{
      const inp=document.getElementById('ai-key'); const key=(inp?.value||'').trim();
      if(!key){ stDrawerRefuse(i18t('set_enter_key')); return; }
      if(!aiKeyLooksRight(key)){ stDrawerRefuse(i18t('set_key_not_a_key')); return; }
      lsSet('hati.v1.aikey', key); inp.value='';
      stDrawerClearRefusal();
      toast(i18t('set_t_key_saved',{last4:key.slice(-4)})); refresh(); refreshAiIndicators();
    });
    document.getElementById('ai-key-clear')?.addEventListener('click',async()=>{
      if(!await confirmDialog({title:'Remove the stored Jambo key?', message:i18t('set_key_remove_msg'), confirmLabel:'Remove key', danger:true})) return;
      localStorage.removeItem('hati.v1.aikey'); toast(i18t('set_key_removed')); refresh(); refreshAiIndicators();
    });
    return;
  }
  /* Does the SERVER's own environment hold a key, underneath whatever this
     workspace has stored? Only the read knows, and it decides which of two
     true sentences the confirm shows. Per sitting, never persisted. */
  let _aiEnvKey=false;
  const refreshAiCfg=async()=>{ const el=document.getElementById('ai-cfg-status'); if(!el) return;
    try{ const c=await api('ai/config'); state.aiConfigured=!!c.configured;
      /* The read is the only thing that knows WHERE the key lives, so it is
         what paints the verb and what the confirm's cost is taken from. */
      stPaintKeyClear(c.source);
      _aiEnvKey=!!c.envKey;
      const fast=c.tiers?.fast?.model||c.models?.fast||c.model||'', deep=c.tiers?.deep?.model||c.models?.deep||'';
      el.innerHTML=c.configured
        ?`<span class="text-brand-600">${i18t('set_configured')}</span> · ${i18t('set_key')} ${c.hint}${c.source==='env'?i18t('set_key_from_env'):''}`
        :`<span class="text-gold-600">${i18t('set_not_configured')}</span>${i18t('set_falls_back')}`;
      const set=(id,v)=>{ const n=document.getElementById(id); if(n) n.textContent=v||'—'; };
      set('ai-model-fast-cur',fast); set('ai-model-deep-cur',deep);
      const fill=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n) n.value=v||''; };
      fill('ai-model-fast',c.tiers?.fast?.override); fill('ai-model-deep',c.tiers?.deep?.override); fill('ai-model-global',c.globalOverride);
      const lim=c.limits||{}, spend=c.spend||{};
      state.aiCfg=c;   // migration's pre-flight estimate reads rates from here
      /* The engine row and the go-live ceiling read this reading — repainted
         where they stand after every save or removal (9 Oct 2026). */
      stRepaintRow('engine'); stRepaintRow('golive');
      const money=n=>'$'+Number(n||0).toFixed(2);
      const budget=Number(lim.dailySpendLimit||0);
      const spent=Number(spend.cost||0);
      const uEl=document.getElementById('ai-usage');
      if(uEl){
        const reqN=Number(spend.requests||0);
        uEl.innerHTML=budget>0
          ? `${i18tn('set_today_of',reqN,{spent:money(spent),budget:money(budget),n:reqN.toLocaleString(jxLocale())})} <span style="color:var(--color-neutral-500)">(${spend.date||''})</span>`
          : `${i18tn('set_today_free',reqN,{spent:money(spent),n:reqN.toLocaleString(jxLocale())})} <span style="color:var(--color-neutral-500)">(${spend.date||''})${i18t('set_no_daily_budget')}</span>`; }
      const uBar=document.getElementById('ai-usage-bar');
      if(uBar){ const pct=budget>0?Math.min(100,Math.round(spent/budget*100)):0;
        uBar.style.width=pct+'%'; uBar.style.background=pct>=90?'var(--st-ruby-fg)':pct>=70?'var(--st-amber-dot)':'var(--color-accent)'; }
      const bdHost=document.getElementById('ai-spend-breakdown');
      if(bdHost){
        const rows=Object.entries(spend.byFeature||{}).map(([k,v])=>({k,...v})).sort((a,b)=>b.cost-a.cost);
        bdHost.innerHTML=rows.length?`<div style="border:1px solid var(--color-divider);border-radius:var(--radius);overflow:hidden">
          ${rows.map(r=>`<div style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-1) var(--s-2);border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);font-size:var(--t-label)">
            <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${PB_ESC(r.label||r.k)}</span>
            <span style="color:var(--color-neutral-500);font-family:var(--font-mono);font-size:var(--t-label)">${Number(r.requests||0).toLocaleString(jxLocale())} req</span>
            <span style="font-family:var(--font-mono);font-weight:var(--w-strong);min-width:62px;text-align:right">${'$'+Number(r.cost||0).toFixed(4)}</span>
          </div>`).join('')}</div>`
          :`<div style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_no_spend')}</div>`;
      }
      const pHost=document.getElementById('ai-spend-people');
      if(pHost){
        const people=Array.isArray(spend.byPerson)?spend.byPerson:[];
        const un=Number(spend.unattributed||0);
        pHost.innerHTML=`
          <div style="font-size:var(--t-micro);font-weight:var(--w-title);color:var(--color-neutral-500);margin:0 0 var(--s-1)">${
            esc(i18t('set_spend_people'))}</div>
          ${people.length?`<div style="border:1px solid var(--color-divider);border-radius:var(--radius);overflow:hidden">
            ${people.map(p=>`<div style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-1) var(--s-2);border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);font-size:var(--t-label)">
              <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${PB_ESC(p.name||'—')}${
                p.gone?` <span style="color:var(--color-neutral-500);font-size:var(--t-label)">${esc(i18t('set_spend_left'))}</span>`:''}</span>
              <span style="color:var(--color-neutral-500);font-family:var(--font-mono);font-size:var(--t-label)">${Number(p.requests||0).toLocaleString(jxLocale())} req</span>
              <span style="font-family:var(--font-mono);font-weight:var(--w-strong);min-width:62px;text-align:right">${'$'+Number(p.cost||0).toFixed(4)}</span>
            </div>`).join('')}</div>`
          :`<div style="font-size:var(--t-label);color:var(--color-neutral-500)">${esc(i18t('set_spend_people_none'))}</div>`}
          ${''/* THE GAP IS A FIGURE, NOT A DISCOVERY. Anything running outside
                 a signed-in request counts toward the workspace total and
                 against nobody, so the two lists need not agree — and an admin
                 must not have to subtract to find that out. Drawn only when
                 there IS a gap; an always-on "$0.0000 not attributed" is
                 furniture. */}
          ${un>0.000001?`<div style="font-size:var(--t-label);color:var(--st-amber-fg);margin-top:var(--s-1)">${
            esc(i18t('set_spend_unattributed',{amount:'$'+un.toFixed(4)}))}</div>`:''}
          <div style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.5;margin-top:5px">${
            esc(i18t('set_spend_people_note'))}</div>`;
      }
      const fillN=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n&&v!==undefined) n.value=v; };
      fillN('ai-rate-light',lim.rateLight); fillN('ai-rate-deep',lim.rateDeep); fillN('ai-daily',lim.dailyLimit);
      fillN('ai-rate-ocr',lim.rateOcr); fillN('ai-ocr-pages',lim.ocrMaxPages);
      fillN('ai-daily-spend',lim.dailySpendLimit); fillN('ai-estimate-confirm',lim.estimateConfirmAt);
      fillN('ai-maxchars',lim.maxChars); fillN('ai-docchars',lim.docChars); fillN('ai-maxcontracts',lim.maxContracts);
      const th=document.getElementById('ai-thorough'); if(th&&document.activeElement!==th) th.checked=!!lim.thoroughExtract;
      fillN('ai-renewal-max',lim.renewalPrepMax);
      const rp=document.getElementById('ai-renewal-prep');
      if(rp&&document.activeElement!==rp) rp.checked=lim.renewalPrep!==false;
      const nv=document.getElementById('ai-navigate');
      if(nv&&document.activeElement!==nv) nv.checked=lim.navigate!==false;
      renderAllowancePanel(c.allowance||{});
      renderRateTable(c.rates||{}, c.ratesMeta||{});
    }catch(e){ el.textContent='Could not read Jambo config.'; stPaintKeyClear(undefined); } };
  refreshAiCfg();
  /* ---- THE COPILOT ENGINE PANEL'S FOUR SAVES SAY 'SAVED' ----
     Every refusal here goes into the drawer's foot and every SUCCESS was a
     bare toast, which prints nothing — so a real Save button on a panel
     whose fields do not visibly change answered a correct press with
     silence. This is a 'save' panel, not a 'done' one: it has a button
     that has to report. The ~250 quiet confirmations elsewhere on this
     page stay quiet — they are panels that already wrote what changed. */
  // basic shape check mirroring the server (blank = clear override)
  const okModel=(s)=>s===''||(!/\s/.test(s)&&/^claude-[a-z0-9][a-z0-9.\-]*$/i.test(s));
  document.getElementById('ai-key-save')?.addEventListener('click',async()=>{
    const key=document.getElementById('ai-key').value.trim();
    if(!key){ stDrawerRefuse(i18t('set_enter_key')); return; }
    if(!aiKeyLooksRight(key)){ stDrawerRefuse(i18t('set_key_not_a_key')); return; }
    try{ await api('ai/config','PUT',{ key }); document.getElementById('ai-key').value='';
      stDrawerClearRefusal(); toast(i18t('set_key_saved'),'ok'); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-model-save')?.addEventListener('click',async()=>{
    const modelFast=document.getElementById('ai-model-fast').value.trim();
    const modelDeep=document.getElementById('ai-model-deep').value.trim();
    const model=document.getElementById('ai-model-global').value.trim();
    for(const m of [modelFast,modelDeep,model]) if(!okModel(m)){ stDrawerRefuse(i18t('set_t_bad_model',{m})); return; }
    try{ await api('ai/config','PUT',{ modelFast, modelDeep, model }); stDrawerClearRefusal(); toast(i18t('set_model_saved'),'ok'); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-key-clear')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:i18t('st_key_remove_q'),
        message:_aiEnvKey?i18t('set_key_remove_to_env'):i18t('set_key_remove_msg'),
        confirmLabel:i18t('st_key_remove_go'), danger:true})) return;
    try{ await api('ai/config','PUT',{ clear:true }); toast(i18t('set_key_removed'),'ok'); refreshAiCfg(); }catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-limits-save')?.addEventListener('click',async()=>{
    const num=id=>{ const el=document.getElementById(id); if(!el) return undefined; const v=el.value.trim(); return v===''?undefined:Number(v); };
    const whole={ rateLight:num('ai-rate-light'), rateDeep:num('ai-rate-deep'), rateOcr:num('ai-rate-ocr'),
      dailyLimit:num('ai-daily'), maxChars:num('ai-maxchars'), docChars:num('ai-docchars'),
      maxContracts:num('ai-maxcontracts'), ocrMaxPages:num('ai-ocr-pages'),
      renewalPrepMax:num('ai-renewal-max') };
    for(const [k,v] of Object.entries(whole)) if(v!==undefined&&(!Number.isFinite(v)||v<0||Math.floor(v)!==v)){ stDrawerRefuse(i18t('set_t_whole_number',{k})); return; }
    const cash={ dailySpendLimit:num('ai-daily-spend'), estimateConfirmAt:num('ai-estimate-confirm') };
    for(const [k,v] of Object.entries(cash)) if(v!==undefined&&(!Number.isFinite(v)||v<0)){ stDrawerRefuse(i18t('set_t_non_negative',{k})); return; }
    const body={ ...whole, ...cash, thoroughExtract: !!document.getElementById('ai-thorough')?.checked,
      renewalPrep: !!document.getElementById('ai-renewal-prep')?.checked,
      navigate: !!document.getElementById('ai-navigate')?.checked };
    try{ await api('ai/config','PUT',body); stDrawerClearRefusal(); toast(i18t('set_limits_saved'),'ok'); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  const allowBody=()=>{
    const n=id=>{ const v=document.getElementById(id)?.value.trim(); return v===''||v==null?0:Number(v); };
    return { budget:n('ai-allow-budget'), docs:n('ai-allow-docs') };
  };
  document.getElementById('ai-allow-open')?.addEventListener('click',async()=>{
    const b=allowBody();
    if(!(b.budget>0)&&!(b.docs>0)){ stDrawerRefuse(i18t('set_set_budget')); return; }
    if(!await confirmDialog({title:i18t('st_allow_open_q'),
      message:i18t('st_allow_open_msg',{ what:(b.budget>0?'$'+b.budget.toFixed(2):i18t('st_allow_no_cap'))
        +(b.docs>0?i18t('st_allow_docs',{n:b.docs}):'') }),
      confirmLabel:i18t('st_allow_open_go')})) return;
    try{ await api('ai/allowance','PUT',{ open:true, ...b }); toast(i18t('set_allowance_opened')); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-allow-topup')?.addEventListener('click',async()=>{
    try{ await api('ai/allowance','PUT',allowBody()); toast(i18t('set_allowance_updated')); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-allow-close')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:i18t('st_allow_close_q'), message:i18t('st_allow_close_msg'), confirmLabel:i18t('st_allow_close_go'), danger:true})) return;
    try{ await api('ai/allowance','PUT',{ close:true }); toast(i18t('set_allowance_closed')); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-rates-save')?.addEventListener('click',async()=>{
    const rates={};
    document.querySelectorAll('[data-rate-model]').forEach(row=>{
      const m=row.getAttribute('data-rate-model');
      const i=Number(row.querySelector('[data-rate="in"]').value);
      const o=Number(row.querySelector('[data-rate="out"]').value);
      if(Number.isFinite(i)&&Number.isFinite(o)&&i>=0&&o>=0) rates[m]={in:i,out:o};
    });
    if(!Object.keys(rates).length){ stDrawerRefuse(i18t('set_nothing_to_save')); return; }
    try{ await api('ai/config','PUT',{ rates }); stDrawerClearRefusal(); toast(i18t('set_rate_saved')); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-rates-reset')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:i18t('st_rates_reset_q'), message:i18t('st_rates_reset_msg'), confirmLabel:i18t('st_rates_reset_go'), danger:true})) return;
    try{ await api('ai/config','PUT',{ rates:{} }); toast(i18t('set_rate_reset')); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('meta-backfill')?.addEventListener('click',()=>runMetaBackfill());
}

/* ---- email delivery & outbox ---- */
/* ---- IT REPORTS WHAT HAPPENED (owner-reported 19 Aug 2026) ----
   Returns {ok, n} so a caller that was PRESSED can say so, and says the failure
   out loud instead of swallowing it. The silent catch was half of why "Refresh
   outbox" read as a dead button: a request that failed left the last list on
   screen and no word anywhere. Callers that merely FILL the panel ignore the
   answer, exactly as before. */
function stLoadOutbox(){
  return (async()=>{
    try{ const r=await api('outbox');
      const host=document.getElementById('outbox-list'); if(!host) return { ok:true, n:(r.items||[]).length };
      /* The panel's own heading answers the same three states the row does, off
         the route's own health reading rather than a second copy of it — and
         it NAMES the provider's reason, which is the thing an admin can act on
         ("the domain is not verified" tells them exactly what to go and do). */
      stPaintMailCfg(r.mail);
      const hp=r.health||{}, failing=!!(r.emailConfigured&&hp.failing);
      host.innerHTML=`<div class="mb-2 text-[11px] ${r.emailConfigured&&!failing?'text-brand-600':'text-gold-600'}">${
          !r.emailConfigured ? i18t('set_email_not_configured')
          : failing ? i18tn('set_email_failing', hp.failed||0, { n:hp.failed||0 })
          : i18t('set_email_configured')}</div>`+
        (failing&&hp.lastError?`<div class="mb-2 text-[10.5px] text-gold-700 bg-gold-500/10 rounded px-2 py-1.5 leading-relaxed">${i18t('set_why_failed',{why:esc(hp.lastError)})}</div>`:'')+
        (r.items.length?`<div class="space-y-1.5 max-h-56 overflow-y-auto scroll-thin">${r.items.map(it=>`
          <div class="rounded-lg border border-brand-100 bg-white p-2.5">
            <div class="flex items-center gap-2"><span class="text-[11px] font-medium text-brand-900 truncate flex-1">${it.subject}</span><span class="text-[9px] ${it.sent?'text-brand-600':'text-gold-600'}">${it.sent?i18t('set_sent_lower'):it.provider}</span></div>
            <div class="text-[10px] font-mono text-brand-800/65 truncate">→ ${it.to_addr} · ${fmtDT(it.created_at)}</div>
            ${it.detail?`<div class="mt-1 text-[10px] text-gold-700 bg-gold-500/10 rounded px-1.5 py-1 leading-relaxed">${i18t('set_why_failed',{why:esc(it.detail)})}</div>`:''}
            ${it.dev_hint?`<div class="mt-1 text-[10px] font-mono text-gold-700 bg-gold-500/10 rounded px-1.5 py-0.5 inline-block">${it.dev_hint}</div>`:''}
          </div>`).join('')}</div>`:`<div class="text-[11px] text-brand-800/65">${i18t('set_no_messages')}</div>`);
      return { ok:true, n:(r.items||[]).length };
    }catch(e){
      const host=document.getElementById('outbox-list');
      const why=(e&&e.message)||String(e);
      if(host) host.innerHTML=`<div class="text-[11px] text-gold-700">${esc(i18t('set_outbox_unreadable',{why}))}</div>`;
      return { ok:false, why };
    }
  })();
}
/* ---- A PRESS THAT SAYS NOTHING IS A PRESS NOBODY BELIEVES IN ----
   (owner-reported 19 Aug 2026, off a screenshot with both buttons ringed: "the
   highlighted buttons are not working".)

   BOTH WERE WORKING. "Check renewals" really did run the sweep and queue the
   reminders; "Refresh outbox" really did re-read the list. What neither did was
   SAY SO. The renewal sweep's confirmation was a bare toast call — and a bare
   call is silent by design in this product (see toast in js/core.js: about 250
   ordinary confirmations would otherwise blink after every press) — while a
   refresh that finds the same three messages redraws pixel-for-pixel identical
   pixels. Two correct buttons, indistinguishable from two dead ones.

   So each one now: goes busy while it works, and answers with 'ok' when it is
   done. The refusal path is unchanged and still lands in the drawer's foot,
   which is where this page puts a refusal. */
/* ---- THE MAIL KEY, SAVED FROM THE SCREEN (9 Oct 2026) ----
   "Email delivery — REQUIRED" offered no way forward inside the product. The
   box works the way the Copilot key's does: the key goes to the server
   (PUT /api/mail/config), is never read back — only its last four characters
   — and a key set in the server's own environment cannot be removed from
   here (stKeyRemovable says so on the button). */
function stMailKeyHtml(){
  return `<div id="mail-cfg-status" style="font-size:var(--t-label);color:var(--color-neutral-700);margin-bottom:var(--s-2)">${window.busyHtml?busyHtml(i18t('set_checking')):i18t('set_checking')}</div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:var(--s-2);align-items:flex-end">
      <label style="min-width:0"><span style="${window.RV_LBL||''}">${i18t('set_mail_key')}</span>
        <input id="mail-key" type="password" autocomplete="new-password" data-lpignore="true" data-1p-ignore="true" spellcheck="false" placeholder="re_…" style="${window.RV_FLD||ST_INPUT}"/></label>
      <label style="min-width:0"><span style="${window.RV_LBL||''}">${i18t('set_mail_from')}</span>
        <input id="mail-from" type="text" autocomplete="off" spellcheck="false" placeholder="${esc(i18t('set_mail_from_ph'))}" style="${window.RV_FLD||ST_INPUT}"/></label>
      <button id="mail-key-save" style="${ST_BTN}">${i18t('set_mail_save')}</button>
    </div>
    <p class="st-note" style="margin:6px 0 0">${esc(i18t('set_mail_get_key'))}</p>
    <button id="mail-key-clear" type="button" disabled aria-disabled="true" class="ui-link ui-link-danger" style="margin:6px 0 12px;cursor:default;opacity:.5">${i18t('set_remove_key')}</button>`;
}
let _stMailCfg=null;
function stPaintMailCfg(m){
  if(!m) return;
  _stMailCfg=m;
  const el=document.getElementById('mail-cfg-status');
  if(el) el.innerHTML=m.configured
    ? `<span class="text-brand-600">${i18t('set_configured')}</span> · ${i18t('set_key')} ${esc(m.hint||'')}${m.source==='env'?i18t('set_key_from_env'):''}`
    : `<span class="text-gold-600">${i18t('set_not_configured')}</span>`;
  const f=document.getElementById('mail-from');
  if(f && document.activeElement!==f) f.value=m.fromSource==='default'?'':(m.from||'');
  if(f) f.disabled=m.fromSource==='env';
  const b=document.getElementById('mail-key-clear'); if(!b) return;
  const r=stKeyRemovable(m.source);
  b.disabled=!r.can; b.style.opacity=r.can?'':'.5'; b.style.cursor=r.can?'pointer':'default';
  b.title=r.why; b.setAttribute('aria-disabled', r.can?'false':'true');
}
/* After a save or a removal the whole page answers at once: the row, the
   go-live checklist and every "email is not set up" reading take the server's
   word (state.emailConfigured is what emailOff() reads). */
function stMailCfgSaved(m){
  if(m) state.emailConfigured=!!m.configured;
  stPaintMailCfg(m);
  stRepaintRow('mail'); stRepaintRow('golive');
  stLoadOutbox();
}
function stWireMailKey(){
  document.getElementById('mail-key-save')?.addEventListener('click',async()=>{
    const key=(document.getElementById('mail-key')?.value||'').trim();
    const fromEl=document.getElementById('mail-from');
    const from=fromEl&&!fromEl.disabled?fromEl.value.trim():undefined;
    const fromWas=_stMailCfg&&_stMailCfg.fromSource!=='default'?(_stMailCfg.from||''):'';
    const fromMoved=from!==undefined && from!==fromWas;
    if(!key && !fromMoved){ stDrawerRefuse(i18t('set_enter_key')); return; }
    if(key && !/^re_[A-Za-z0-9_-]{8,}$/.test(key)){ stDrawerRefuse(i18t('set_mail_not_a_key')); return; }
    const body={}; if(key) body.key=key; if(fromMoved) body.from=from;
    try{ const r=await api('mail/config','PUT',body);
      const k=document.getElementById('mail-key'); if(k) k.value='';
      stDrawerClearRefusal(); toast(i18t(key?'set_mail_saved':'set_mail_from_saved'),'ok'); stMailCfgSaved(r&&r.mail); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('mail-key-clear')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:i18t('set_mail_remove_q'),
        message:(_stMailCfg&&_stMailCfg.envKey)?i18t('set_mail_remove_to_env'):i18t('set_mail_remove_msg'),
        confirmLabel:i18t('st_key_remove_go'), danger:true})) return;
    try{ const r=await api('mail/config','PUT',{ clear:true }); toast(i18t('set_mail_removed'),'ok'); stMailCfgSaved(r&&r.mail); }
    catch(e){ stDrawerRefuse(e.message); }
  });
}
function stWireOutbox(){
  stLoadOutbox();
  stWireMailKey();
  const busy=(btn,word,fn)=>async()=>{
    const held=btn.innerHTML;
    btn.disabled=true; btn.innerHTML=window.busyHtml?busyHtml(i18t(word)):esc(i18t(word));
    try{ await fn(); } finally { btn.disabled=false; btn.innerHTML=held; }
  };
  const ob=document.getElementById('ob-refresh');
  ob?.addEventListener('click',busy(ob,'set_outbox_refreshing',async()=>{
    const r=await stLoadOutbox();
    if(!r||r.ok===false){ stDrawerRefuse(i18t('set_outbox_unreadable',{why:(r&&r.why)||''})); return; }
    toast(i18tn('set_outbox_refreshed',r.n,{n:r.n}),'ok');
  }));
  const rr=document.getElementById('rem-run');
  rr?.addEventListener('click',busy(rr,'set_reminders_checking',async()=>{
    try{ const r=await api('reminders/run','POST',{});
      toast(i18tn('set_checked_queued',r.queued,{checked:r.checked,n:r.queued}),'ok');
      await stLoadOutbox(); }
    catch(e){ stDrawerRefuse(e.message); }
  }));
}

/* ---- the monthly report card ----
   Status, the on/off switch and the audience, read from and written to the
   server's own setting — the sweep that sends the report runs there, so this
   panel is a remote control, not a second copy of the rule. */
function stWireMonthlyReport(){
  const loadMonthly=async()=>{
    const st=document.getElementById('mr-status'); if(!st) return;
    try{ const r=await api('reports/monthly');
      const h=r.health||{};
      st.innerHTML=[
        r.emailConfigured?'':`<span style="color:var(--st-amber-fg)">${i18t('set_email_not_configured')}</span>`,
        h.lastSentMonth?i18t('set_mr_last_sent',{month:h.lastSentMonth,n:h.lastSentTo||0}):i18t('set_mr_none_yet'),
        h.lastError?`<span style="color:var(--st-ruby-dot)">${i18t('set_mr_last_error',{err:esc(h.lastError)})}</span>`:'',
      ].filter(Boolean).join(' · ');
      const en=document.getElementById('mr-enabled'); if(en) en.checked=!!r.settings.enabled;
      const rec=document.getElementById('mr-recipients');
      if(rec&&typeof r.settings.recipients==='string') rec.value=r.settings.recipients;
    }catch(e){ st.textContent=e.message||'—'; }
  };
  loadMonthly();
  document.getElementById('mr-enabled')?.addEventListener('change',async e=>{
    try{ await api('reports/monthly/settings','PUT',{enabled:e.target.checked});
      toast(e.target.checked?i18t('set_mr_on'):i18t('set_mr_off')); }
    catch(err){ stDrawerRefuse(err.message); loadMonthly(); }
  });
  document.getElementById('mr-recipients')?.addEventListener('change',async e=>{
    try{ await api('reports/monthly/settings','PUT',{recipients:e.target.value}); toast(i18t('set_mr_saved')); }
    catch(err){ stDrawerRefuse(err.message); loadMonthly(); }
  });
  document.getElementById('mr-send-now')?.addEventListener('click',async()=>{
    try{ const r=await api('reports/monthly/run','POST',{});
      toast(r.sent?i18tn('set_mr_sent_n',r.sent,{n:r.sent,month:r.month}):i18t('set_mr_nothing_sent'));
      loadMonthly(); }
    catch(err){ stDrawerRefuse(err.message); }
  });
}

/* ---- pilot activation: four labelled steps and one north-star sentence ----
   Words, not colour: "not yet" is an answer, not an absence. Held on the module
   so the go-live checklist can read the same answer without asking twice. */
let _stActivation=null;
function stLoadActivation(){
  return (async()=>{
    const host=document.getElementById('activation-funnel'); if(!host) return;
    try{
      const r=await api('activation'); _stActivation=r;
      const STEP={ added:i18t('set_step_added'), scanned:i18t('set_step_scanned'), sent:i18t('set_step_sent'), signed:i18t('set_step_signed') };
      host.innerHTML=`
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--s-2);margin-bottom:10px">
          ${Object.entries(STEP).map(([k,label])=>{ const e=r.events&&r.events[k];
            return `<div style="border:1px solid var(--color-divider);border-radius:var(--radius);padding:9px 11px;background:${e?'var(--st-green-bg)':'var(--color-bg)'}">
              <div style="display:flex;align-items:center;gap:6px;font-size:var(--t-label);font-weight:var(--w-strong);color:${e?'var(--st-green-fg)':'var(--color-neutral-600)'}">${e?icon('check2','w-3 h-3'):''}${label}</div>
              <div style="font-size:var(--t-label);font-family:var(--font-mono);color:var(--color-neutral-600);margin-top:3px">${e?`${fmtDT(e.first)} · ${e.count}×`:i18t('set_not_yet')}</div>
            </div>`; }).join('')}
        </div>
        <div style="font-size:var(--t-meta);line-height:1.5;color:${r.northStar.withinSevenDays===true?'var(--st-green-fg)':r.northStar.withinSevenDays===false?'var(--st-amber-fg)':'var(--color-neutral-700)'}">
          ${r.northStar.firstSendDays==null
            ? i18t('set_north_star_none')
            : r.northStar.withinSevenDays
              ? `<b>${i18t('set_north_star')}</b> ${r.northStar.firstSendDays===0?i18t('set_first_send_dayone'):i18tn('set_first_send_after',r.northStar.firstSendDays,{n:r.northStar.firstSendDays})}`
              : i18t('set_first_send_late',{n:r.northStar.firstSendDays})}
        </div>`;
    }catch(e){ host.innerHTML=`<span style="color:var(--color-neutral-600)">${i18t('set_activation_failed',{err:esc(e.message)})}</span>`; }
  })();
}

/* ============================================================
   THE PAGE
   ============================================================ */
/* THE PAGE'S CLOSED DROPDOWNS (rounds 24 and 26 as drawn, the gaps' third
   pass): HaTi's own list on a press (popupControlsDress — one dropdown per
   press, on an iPad too), and on the page a QUIET face — a hairline edge
   (index.html) and a THIN chevron: two 1.5px strokes in the text's own ink,
   so no colour enters the census. The drawers keep the house chevron. */
const ST_QUIET_CHEVRON='linear-gradient(45deg,transparent calc(50% - .8px),currentColor calc(50% - .8px),currentColor calc(50% + .8px),transparent calc(50% + .8px)),'
  +'linear-gradient(135deg,transparent calc(50% - .8px),currentColor calc(50% - .8px),currentColor calc(50% + .8px),transparent calc(50% + .8px))';
function stDressPage(){
  const el=document.getElementById('set-page');
  if(el&&typeof window.popupControlsDress==='function') try{ popupControlsDress(el); }catch(_){}
  if(el&&el.querySelectorAll) el.querySelectorAll('select[data-sel-face="1"]').forEach(sel=>{
    if(sel.dataset.stQuiet==='1') return; sel.dataset.stQuiet='1';
    const st=sel.style; st.backgroundImage=ST_QUIET_CHEVRON;
    st.backgroundPosition='calc(100% - 16px) 55%,calc(100% - 10.5px) 55%'; st.backgroundSize='6px 6px,6px 6px'; st.backgroundRepeat='no-repeat'; });
}
function renderTeam(){
  /* THE GATE IS HERE, not on the nav item, because the nav item is one of five
     doors and the other four were the ones nobody remembered. Every road into
     'team' arrives at this function; a non-admin is drawn their own account
     page rather than a refusal or a blank. */
  if(typeof isAdmin==='function' && !isAdmin()){ renderMyAccountPage(); return; }
  stPagePaint(true);
}
/* THE ONE SHELL, TWO READERS. An admin is drawn the two tabs (You · Company)
   and the face that is up; anybody else the same page showing You, with no
   tab row — the Company side is not there to be seen (owner, 16 Oct 2026).
   `st-tabs-pin` is still the opt-in that keeps the row at the top of the
   scroller while the body passes behind it. */
let _stAgAsking=false;
function stPagePaint(admin){
  const _heldHeights=settingsHeightsBefore();
  const face=admin?settingsTab():'you';
  const body=face==='company'?stCompanyHtml():stYouHtml();
  /* A PAGE OPENED FROM SETTINGS STARTS AT ITS OWN NAME (round 26 as drawn:
     "Contract streams 4 + New stream", no Settings head above it): on Team,
     Who holds what, Roles, Contract streams and Data & backup the Settings
     head and the You · Company tabs step aside (data-st-sub, the head hidden
     by scope), and "‹ Settings" on the page is the way back */
  const sub=(admin&&face==='company'&&_stPage)?_stPage:'';
  /* THE NEW LOOK (round 7, as drawn): one list of sentences; the pages inside Settings (People & roles, Streams…) stay as they are */
  if(!_stPage && typeof stnOn==='function' && stnOn()){ stnPaint(admin); return; }
  /* a docked drawer lives in the page: it is lifted out before the page is
     drawn again, and put back after (stDockPaint) — nothing typed is lost */
  { const dr=document.getElementById('st-drawer');
    if(dr && dr.closest && dr.closest('#content')){ if(_stPage==='panel'&&face==='company') document.body.appendChild(dr); else stDockLeave(); } }
  document.getElementById('content').innerHTML=`
  <div id="set-page" class="view-enter st-page sap-page st-cr${_stSideFold?' is-side-folded':''}" data-st-face="${face}"${sub?` data-st-sub="${sub}"`:''}>
    <div class="st-cr-cols">
      <div class="st-cr-left">${sub?'':stHeadCardHtml(admin, face)}<div id="st-tabbody" class="st-cr-main">${body}</div></div>
      ${stSideHtml()}
    </div>
  </div>`;
  settingsHoldHeights(_heldHeights);
  stWireDrawerOnce();
  /* the Menu's box binds once per element, never once per render */
  stWireList();
  if(admin) stLoadAiCfgOnce();
  if(face==='company') stPeopleWire();
  /* round 26's two pages, wired once painted */
  if(face==='company'&&_stPage==='data') stBkWire();
  if(face==='company'&&_stPage==='streams') stSwLoad();
  /* the board's Housekeeping card says the last trail download (round 25 as
     drawn): the downloads are read once a sitting */
  if(face==='company'&&!_stPage&&stTrailOn()&&_stTr.list==null&&!_stTr.listAsking){ _stTr.listAsking=true;
    Promise.resolve(stTrailList()).then(()=>{ _stTr.listAsking=false; stCrSync(); },()=>{ _stTr.listAsking=false; }); }
  /* …and the Jambo card says how far his agents may go (agents' own status) */
  if(face==='company'&&!_stPage&&admin&&typeof agentsStatus==='function'&&!agentsStatus()&&typeof agentsStatusLoad==='function'&&!_stAgAsking){ _stAgAsking=true;
    Promise.resolve(agentsStatusLoad()).then(()=>{ _stAgAsking=false; stCrSync(); },()=>{ _stAgAsking=false; }); }
  if(face==='you') stYouLoad();
  /* the clashes this page sees are told to the server, which keeps the day
     each was first seen (owner's answer 12) */
  if(face==='company'&&admin&&typeof setTimeout==='function') setTimeout(stClashSeenSync,0);
  /* the page's head says what it holds (round 24/25 as drawn) */
  stPaintHead();
  /* the window's head stepped aside or came back: the page's height follows */
  if(typeof syncViewHeight==='function') try{ syncViewHeight(); }catch(_){}
  if(_stAsks===null) stAsksLoad();
  /* the divider first (the width the reader chose — the head card wraps to
     it), then the panel measured now, and again once the page's entrance has
     settled — the view-enter rise moves the panel while it runs */
  stSplitFit();
  stSideFitWire(); stSideFit();
  if(typeof setTimeout==='function') setTimeout(stSideFit, 420);
  /* THE PAGE'S CLOSED DROPDOWNS WEAR HaTi's CLOTHES (round 26 as drawn): a
     hairline box and a small chevron, as in the drawers — the same dress */
  stDressPage();
  /* A door may have asked for one panel. Consumed on arrival, exactly once, so
     a later repaint does not re-open something the reader closed. */
  if(admin && face==='company' && _stPage==='panel') stDockPaint();
  if(admin && _stWantPanel){ const want=_stWantPanel; _stWantPanel=null; stDrawerOpen(want); }
  setActiveNav('team');
}
/* THE ENGINE ROW AND THE GO-LIVE CEILING READ state.aiCfg, which only the
   engine drawer used to fill — so both read "not set" until that drawer had
   been opened once (9 Oct 2026). Read once when the page opens, in a
   workspace, for an admin; the rows are repainted where they stand. */
let _stAiCfgAsking=false;
async function stLoadAiCfgOnce(){
  if(state.aiCfg || _stAiCfgAsking || !(typeof API_MODE==='function' && API_MODE())) return;
  _stAiCfgAsking=true;
  try{ const c=await api('ai/config');
    if(c && typeof c==='object'){ state.aiCfg=c; state.aiConfigured=!!c.configured;
      stRepaintRow('engine'); stRepaintRow('golive'); } }
  catch(_){ /* the drawer's own read says why when it is opened */ }
  finally{ _stAiCfgAsking=false; }
}
/* A non-admin's whole settings page: their own settings as the You board,
   with Jambo and the Menu beside it — the admin's page without the Company
   tab. The note that used to say "Settings is for admins" went with the tab
   (owner, 16 Oct 2026: "If you are not admin, this tab is invisible");
   st_admin_only_page / st_admin_only_body stay INERT in both books. */
function renderMyAccountPage(){ stPagePaint(false); }
/* ---- E4 clause library editor + playbook viewer (Admin/Legal) ---- */
function saveClauseLibrary(lib){ state.settings=state.settings||{}; state.settings.clauseLibrary=lib; saveSettings(); }
/* ---- WHAT YOUR OWN HISTORY SAYS — A PLAYBOOK THAT LEARNS (idea 20) ----
   The suggestions sit WITH the clause library, because the thing they
   propose to change is a library position and a proposal belongs beside the
   thing it is about. Nothing here writes: an admin presses a button, and
   that press goes through saveClauseLibrary — or through the clause editor —
   exactly as hand-editing the clause would. A suggestion is evidence and a
   button, never a change.

   IT READS THE LAST QUARTER, NOT ALL TIME (owner's ruling 3, 9 Sep 2026).
   The panel it replaces mined every settled round this workspace had ever
   had, so a line the company moved off two years ago went on being proposed
   for ever and the card said the same thing every quarter until somebody
   adopted it. A standard is a live position, so what it should be measured
   against is what has actually been happening — STD_WINDOW_DAYS, stated on
   the card so nobody has to guess which rounds are in it.

   AND ONLY WHERE THERE ARE ENOUGH ROUNDS TO MEAN ANYTHING (the same ruling):
   stdHeld holds the PRECEDENT_MIN floor, so a subject argued once inside the
   window proposes nothing at all. Below it there is no pattern, only an
   anecdote, and a standards page that moves the company's line on one round
   is worse than one that says nothing.

   THIS REVERSES precedentSuggestions' OWN RULE, LOUDLY. That function's note
   says "THE ONLY SUGGESTION MADE IS ABOUT THE FALLBACK, never the preferred
   position. A preferred position is what the company wants; history cannot
   argue with an aspiration." The reasoning is right about ASPIRATION and
   wrong about SILENCE: a preferred position nobody has held in a quarter is
   not an aspiration any more, it is a number the playbook check flags on
   every contract and everybody has learned to wave through. So the card
   NAMES it — and adopting a preferred OPENS THE CLAUSE EDITOR rather than
   writing, so a human hand stays on the wording HaTi drafts with. A fallback
   is a line, and moving a line is a press; a preferred is wording, and
   wording is written by a person. precedentSuggestions ITSELF IS UNTOUCHED
   and still answers only about fallbacks — this is a second reading, not an
   edit to that one.

   IT SAYS NOTHING UNTIL THERE IS SOMETHING TO PROPOSE. Holding rows are
   drawn as context BESIDE a proposal — "we looked at four subjects, two need
   moving, two are being met" is what makes the two proposals trustworthy —
   and never on their own: a card that only ever says everything is fine is
   furniture, and the reader stops opening it before the quarter it matters. */
function renderPrecedentPanel(){
  const host=document.getElementById('precedent-panel'); if(!host) return;
  if(typeof stdLearned!=='function'){ host.innerHTML=''; return; }
  const learned=stdLearned();
  const sug=learned?learned.proposals:[];
  if(!sug.length){ host.innerHTML=''; return; }
  const mayAdopt=isAdmin()||currentUser()?.role==='legal';
  /* A MONTH IS A WORD, so it follows the READER'S LANGUAGE — langLocale, the
     one reading, exactly as todayStr and the signed-day label do. */
  const d=x=>{ try{ return x.toLocaleDateString(langLocale(),{day:'2-digit',month:'short',year:'numeric'}); }
    catch(_){ return x.toISOString().slice(0,10); } };
  const B='font-size:var(--t-label);padding:var(--s-1) 10px';
  host.innerHTML=`
    <div style="border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:var(--s-3) 14px">
      <h4 style="margin:0 0 3px;font-size:var(--t-body);font-weight:var(--w-title);font-family:var(--font-heading)">${esc(i18t('std_learn_title'))}</h4>
      <p class="st-note" style="margin:0 0 9px">${esc(i18t('std_learn_win',{
        from:d(learned.window.from), to:d(learned.window.to), n:learned.rounds }))}</p>
      ${sug.map(x=>`
        <div style="border-top:1px solid var(--color-divider);padding:9px 0 3px">
          <div style="font-size:var(--t-meta);line-height:1.55">${esc(i18t('std_learn_line',{
            category:x.category, figure:x.figure, unit:x.unit, seen:x.seen, settled:x.settled }))}</div>
          <div style="font-size:var(--t-label);color:var(--color-neutral-600);margin-top:3px">${
            [ x.preferredFigure!=null?esc(i18t('std_learn_pref_says',{figure:x.preferredFigure,unit:x.unit})):'',
              x.fallbackFigure!=null?esc(i18t('std_learn_fb_says',{figure:x.fallbackFigure,unit:x.unit})):'',
              (x.preferredFigure==null&&x.fallbackFigure==null)?esc(i18t('std_learn_no_fig')):''
            ].filter(Boolean).join(' ')}
            · ${esc(i18tn('pc_from_n',x.contracts.length,{n:x.contracts.length}))}</div>
          ${mayAdopt?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
            ${x.moves.includes('preferred')?`<button class="ui-btn" data-std-pref="${esc(x.key)}" style="${B}">${esc(i18t('std_learn_move_pref',{figure:x.figure,unit:x.unit}))}</button>`:''}
            ${x.moves.includes('fallback')?`<button class="ui-btn" data-std-fb="${esc(x.key)}" style="${B}">${esc(i18t('std_learn_move_fb',{figure:x.figure,unit:x.unit}))}</button>`:''}
          </div>`:''}
        </div>`).join('')}
      ${learned.holding.length?`<div style="border-top:1px solid var(--color-divider);padding:9px 0 0;margin-top:3px">
        <div style="font-size:var(--t-label);font-weight:var(--w-title);color:var(--color-neutral-600);margin-bottom:4px">${esc(i18t('std_learn_holding'))}</div>
        ${learned.holding.map(h=>`<div style="font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.55">${esc(h.category)} — ${esc(i18t('std_learn_hold_line',{figure:h.figure,unit:h.unit,seen:h.seen,settled:h.settled}))}</div>`).join('')}
      </div>`:''}
    </div>`;
  /* ONE ACT PER BUTTON AND EACH GOES WHERE ITS OWN KIND OF CHANGE BELONGS:
     the fallback presses the ordinary write, the preferred opens the editor. */
  const row=k=>(learned.proposals||[]).find(p=>p.key===k)||null;
  host.querySelectorAll('[data-std-fb]').forEach(b=>b.addEventListener('click',()=>{
    const x=row(b.getAttribute('data-std-fb')); if(!x) return;
    const cl=(typeof clauseById==='function')?clauseById(x.clause):null;
    precedentAdopt(x.key,{ ...x, current:cl?String(cl.fallback||'')||null:null });
  }));
  host.querySelectorAll('[data-std-pref]').forEach(b=>b.addEventListener('click',()=>{
    const x=row(b.getAttribute('data-std-pref')); if(x) stdOpenPreferred(x);
  }));
}
/* MOVING WHAT THE COMPANY ASKS FOR IS NOT A PRESS — see the reversal above.
   It asks, and then it opens the clause editor on that clause with the
   wording in front of the reader; nothing is written until they press Save
   there. So this function writes NOTHING itself, which is the whole point of
   it: the record only moves through the editor every hand-edit already uses. */
async function stdOpenPreferred(x,detail){
  const lib=clauseLibrary(); const i=lib.findIndex(cl=>cl.id===x.clause);
  if(i<0){ toast(i18t('pc_no_clause'),'err'); return; }
  if(!await confirmDialog({ title:i18t('std_learn_pref_q',{category:x.category}),
    message:(detail?detail+'\n\n':'')+i18t('std_learn_pref_msg'),
    confirmLabel:i18t('std_edit_wording') })) return;
  openClauseEditor(i);
  toast(i18t('std_learn_pref_opened'),'ok');
}
/* ADOPTING IS THE ADMIN'S ACT, and it asks first — a fallback is the line
   the company holds, and moving it moves what every future review calls a
   deviation. The write is the ordinary one; nothing about this bypasses the
   editor a person would otherwise have used.

   IT TAKES THE ROW IT IS ADOPTING (9 Sep 2026) rather than looking one up:
   there are TWO readings of history in this product now — the all-time one
   precedentSuggestions makes, and the windowed one the panel above reads —
   and a caller that only passed a key would silently adopt the other one's
   figure. Absent, it falls back to precedentSuggestions exactly as before,
   so every older caller is unchanged. */
async function precedentAdopt(key,row){
  const x=row||(precedentSuggestions()||[]).find(s=>s.key===key); if(!x) return;
  const t=(typeof precedentTopicByKey==='function')?precedentTopicByKey(key):null;
  const lib=clauseLibrary().slice();
  const i=lib.findIndex(cl=>cl.id===x.clause);
  if(i<0){ toast(i18t('pc_no_clause'),'err'); return; }
  const nextText=i18t('pc_fallback_text',{figure:x.figure,unit:x.unit,category:x.category});
  if(!await confirmDialog({ title:i18t('pc_adopt_q',{category:x.category}),
    message:i18t('pc_adopt_msg',{ current:x.current||i18t('pc_current_none'), next:nextText }),
    confirmLabel:i18t('pc_adopt') })) return;
  /* The library seeds are GETTERS on the default object (they read the
     market pack), so the row is copied field by field into a plain record
     before it is edited — assigning onto a getter-backed literal throws, and
     spreading it evaluates every getter once, which is what we want here. */
  lib[i]={ ...lib[i], fallback:nextText };
  saveClauseLibrary(lib);
  renderClauseLibrary();
  toast(i18t('pc_adopted',{category:x.category}),'ok');
}
/* ---- A FIRST PLAYBOOK, READ OFF WHAT WAS SIGNED (idea 21) ----------------
   The day-one state of this page is six standards HaTi wrote and three tabs
   nobody has touched, and what a new customer does with it decides whether
   they ever set standards at all. So where the workspace has saved neither a
   clause library nor a playbook, the page OFFERS to read the contracts they
   have already signed and say what they usually agree to.

   THE DESIGN SAID "NO STANDARDS YET" AND THAT STATE DOES NOT EXIST — said out
   loud because it changed what was built. clauseLibrary() and playbook() both
   fall back to HaTi's own defaults, so every workspace has six clauses from
   its first minute and a card headed "no standards yet" would be printed over
   six visible standards. What IS real is a workspace still on wording
   somebody else wrote (stdUsingDefaults), so the card is a COMPARISON — here
   is what your standard says, here is what you actually sign — rather than a
   blank page being filled in.

   IT PROPOSES ONLY WHERE THE TWO DISAGREE. A row where the standard already
   matches what gets signed is good news and offers nothing to press; a table
   where every row demands a decision is one nobody reads to the end.

   AND WHAT IT CANNOT READ IS NAMED. A confidentiality duration and a
   liability cap in months are not fields this record holds, so the card says
   which subjects stay the reader's to write rather than quietly leaving them
   out. A cap or an omission is a FACT — the standing rule — and inventing a
   standard is the one thing this must never do.

   ONE STATE, IN MEMORY, PER SITTING: has the reader asked to see the
   comparison. Stored, it would open a table over somebody's standards a week
   later with nothing on screen saying why. */
let _stdDraftOpen = false;
/* The Inspector's offer line asks for the comparison straight away (26 Sep
   2026): it draws it in a window of its own, so the card's own "Check them"
   step is the press that was already made. */
function stdDraftSetOpen(v){ _stdDraftOpen = !!v; }
function renderStandardsDraft(){
  const host=document.getElementById('standards-draft'); if(!host) return;
  if(typeof stdDraftWorthOffering!=='function'||!stdDraftWorthOffering()){ host.innerHTML=''; return; }
  const mayAdopt=isAdmin()||currentUser()?.role==='legal';
  const CARD='border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:var(--s-3) 14px';
  const B='font-size:var(--t-label);padding:var(--s-1) 10px';
  if(!_stdDraftOpen){
    /* THE OFFER. It states what a standard IS before it asks for anything —
       this is the one screen where a reader may not yet know that the
       playbook check and the Copilot review measure against these words. */
    const n=stdSignedBook().length;
    host.innerHTML=`
      <div style="${CARD}">
        <h4 style="margin:0 0 3px;font-size:var(--t-body);font-weight:var(--w-title);font-family:var(--font-heading)">${esc(i18t('std_draft_still_default'))}</h4>
        <p class="st-note" style="margin:0 0 9px">${esc(i18t('std_draft_still_default_sub'))}</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          <button class="ui-btn" data-std-draft-go style="${B}">${esc(i18tn('std_draft_go',n,{n}))}</button>
          <button class="ui-btn" data-std-draft-no style="${B}">${esc(i18t('std_draft_by_hand'))}</button>
        </div>
      </div>`;
    host.querySelector('[data-std-draft-go]')?.addEventListener('click',()=>{ _stdDraftOpen=true; renderStandardsDraft(); });
    /* "Leave them as they are" is not a store — it closes the card for this
       sitting, which is what a reader who has just answered the question
       wants, and it comes back on the next visit because the fact it states
       is still true. */
    host.querySelector('[data-std-draft-no]')?.addEventListener('click',()=>{ host.innerHTML=''; });
    return;
  }
  const d=stdDraftFromSigned();
  const cell='padding:5px 8px;font-size:var(--t-label);text-align:left;vertical-align:top';
  const grey=t=>`<span style="color:var(--color-neutral-600)">${esc(t)}</span>`;
  /* WHAT YOU USUALLY SIGN, AND ONLY WHERE THERE IS A USUAL VALUE. The column
     printed the commonest value whatever its share, so a book of ten one-off
     answers printed whichever sorted first alphabetically under a heading
     claiming it was habitual — owner-reported 9 Sep 2026, California, seen
     once in ten. Below the floor the honest cell is the absence, and with
     nothing on file at all it is the em-dash it always was. */
  const say=r=>{
    if(!r.have) return '—';
    if(!r.pattern) return grey(i18t('std_no_usual'));
    if(r.kind==='days'&&r.value!=null) return esc(String(r.value))+' '+esc(i18t('std_unit_days'));
    return esc(String(r.value==null?'—':r.value));
  };
  /* WHAT THE STANDARD SAYS: a figure carries its unit, a market carries its
     own name, and only a subject with nothing to line up against says so. */
  const cur=r=>r.current==null
    ?grey(i18t(r.kind==='days'?'std_standard_none':'std_no_figure_to_compare'))
    :esc(String(r.current))+(r.compare==='figure'?' '+esc(i18t('std_unit_days')):'');
  /* THE FINDING, IN THE ORDER A READER NEEDS IT. Nothing on file beats
     everything — "they do not agree" over an empty column was the card
     arguing with its own zero. Then the home comparison, the one row that can
     state a real departure from a standing position. Then, for a figure,
     whether there is a pattern AT ALL before whether the standard matches
     one: asked the other way round, a standard equal to a minority value
     reported "Already matches" off three contracts in seven. */
  const why=r=>{
    if(!r.have) return esc(i18t('std_none_carry'));
    if(r.compare==='home'&&r.current!=null)
      return r.differ?esc(i18tn('std_law_differ',r.differ,{n:r.differ})):esc(i18t('std_agrees'));
    if(!r.pattern) return esc(i18tn('std_disagree',r.have,{n:r.have}));
    if(r.agrees===true) return esc(i18t('std_agrees'));
    return '';
  };
  host.innerHTML=`
    <div style="${CARD}">
      <h4 style="margin:0 0 3px;font-size:var(--t-body);font-weight:var(--w-title);font-family:var(--font-heading)">${esc(i18tn('std_draft_title',d.signed,{n:d.signed}))}</h4>
      <p class="st-note" style="margin:0 0 9px">${esc(i18t('std_draft_note'))}</p>
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--color-divider)">
          <th style="${cell};font-weight:var(--w-title);color:var(--color-neutral-600)">${esc(i18t('std_th_position'))}</th>
          <th style="${cell};font-weight:var(--w-title);color:var(--color-neutral-600)">${esc(i18t('std_th_usually'))}</th>
          <th style="${cell};font-weight:var(--w-title);color:var(--color-neutral-600)">${esc(i18t('std_th_standard'))}</th>
          <th style="${cell};font-weight:var(--w-title);color:var(--color-neutral-600)">${esc(i18t('std_th_seen'))}</th>
          <th style="${cell}"></th>
        </tr></thead>
        <tbody>${d.rows.map(r=>`
          <tr style="border-bottom:1px solid var(--color-divider)" data-std-draft-row="${esc(r.key)}">
            <td style="${cell};font-weight:var(--w-title)">${esc(r.category)}</td>
            <td style="${cell}">${say(r)}</td>
            <td style="${cell}">${cur(r)}</td>
            <td style="${cell};color:var(--color-neutral-600);white-space:nowrap">${
              esc(i18t(r.compare==='home'&&r.current!=null?'std_seen_naming'
                :r.kind==='days'?'std_seen_of_carrying':'std_seen_of',{seen:r.seen,have:r.have}))}</td>
            <td style="${cell};white-space:nowrap">${
              r.proposed&&mayAdopt
                ? `<button class="ui-btn" data-std-adopt="${esc(r.key)}" style="${B}">${esc(i18t('std_learn_move_pref',{figure:r.value,unit:i18t('std_unit_days')}))}</button>`
                : `<span style="color:var(--color-neutral-600)">${why(r)||esc(i18t('std_not_proposed'))}</span>`}</td>
          </tr>`).join('')}</tbody>
      </table>
      </div>
      <p class="st-note" style="margin:9px 0 0">${esc(i18t('std_cannot_read',{list:d.unreadable.join(', ')}))}</p>
    </div>`;
  /* ONE DOOR FOR MOVING WHAT THE COMPANY ASKS FOR, and it is the learned
     card's — see the reversal above. Both cards propose the same kind of
     thing, so both hand it to the same person in the same way. */
  host.querySelectorAll('[data-std-adopt]').forEach(b=>b.addEventListener('click',()=>{
    const r=d.rows.find(x=>x.key===b.getAttribute('data-std-adopt')); if(!r) return;
    stdOpenPreferred({ category:r.category, clause:r.clause, figure:r.value,
      unit:i18t('std_unit_days') },
      i18t('std_draft_pref_detail',{ figure:r.value, unit:i18t('std_unit_days'),
        seen:r.seen, have:r.have }));
  }));
}
/* THE DRAFT CARD WRITES NOTHING EITHER, AND THAT IS A CORRECTION MADE
   BEFORE THIS SHIPPED. It first wrote the figure straight into the preferred
   as one flat sentence — and MEASURED in a browser, that replaced "The Buyer
   shall pay each undisputed invoice within thirty (30) days…" with "Payment
   terms at 60 days.", throwing away the drafted clause to move a number
   inside it. The reasoning written twenty lines above forbids exactly that:
   a fallback is a LINE and moving a line is a press; a preferred is WORDING
   and wording is written by a person. So it goes through stdOpenPreferred,
   the same door, with the figure named in the question.

   AND "ADOPT ALL" WENT WITH IT, said out loud rather than quietly dropped:
   it was drawn on the design and it cannot honestly exist once each move is a
   person reading a clause — four editors do not open at once. Substituting
   the figure into the existing prose was weighed and refused: this library
   writes "forty-five (45) days" and nothing in the product spells a number in
   words, so a substitution would leave a formal clause reading "60 days" in
   the middle of its own drafting. std_adopt, std_adopt_q, std_adopt_msg,
   std_adopted, std_adopt_none and std_draft_adopt_all_* are STALE and are
   left inert in both dictionaries. */

/* ---- THE CLAUSE ROW OPENS (owner-approved design, 9 Sep 2026) -------------
   The row showed the first 140 characters of the preferred wording and stopped
   — mid-word, every time — and never showed the fallback at all, though the
   card above it is headed "preferred & fallback wording". Three faults in one
   line: a cut counted in characters rather than fitted to the row, a whole
   half of the record invisible, and six rows of clipped prose that look
   identical to a reader scanning them.

   THE SAME MOVE THE CHANGE COLUMN MADE ON 2 Sep: the closed row carries what
   you SCAN for and everything you READ lives behind one press. It costs the
   page no width, which the two alternatives (a second column, a reading pane)
   both do — and it is one behaviour to learn rather than two.

   ONE ROW OPEN AT A TIME, in memory, per sitting. The clause panel's own rule
   and the change card's before it. */
let _stdOpenClause = null;
const stdOpenClauseId = () => _stdOpenClause;
function stdSetOpenClause(id){ _stdOpenClause = (id == null ? null : String(id)); }

/* TWO CHIPS, TWO CLASSES — .std-chip-pos and .std-chip-fb beside the shared
   .std-chip. They are two different FACTS (what the position is, and what the
   fallback says) and a rule written later for one of them would otherwise
   reach both; the row also draws the position chip only sometimes, so a bare
   .std-chip selector silently resolves to the fallback on those rows. Shared
   metrics, separate identities.

   The stance chip. OWNER'S RULING 1: the closed row states Required or
   Preferred, which today lives on the Negotiation playbook tab. It is READ
   from the playbook every time it is drawn and never stored twice, which was
   the whole condition — one fact stored in two places is the thing that
   drifts, and a reading cannot drift from its own source. */
function stdStanceChipHtml(cl){
  const st = (typeof stdStanceOf === 'function') ? stdStanceOf(cl) : null;
  if (!st) return '';
  const word = i18t(st.pos === 'required' ? 'std_required'
    : st.pos === 'forbidden' ? 'std_forbidden' : 'std_preferred');
  const names = (st.types || []).map(t => t.label).join(', ');
  const tip = st.scope === 'some'
    ? i18t('std_stance_some', { types: names })
    : (names ? i18t('std_stance_all') + ' ' + i18t('std_stance_stricter', { types: names })
             : i18t('std_stance_all'));
  const hard = st.pos === 'required' || st.pos === 'forbidden';
  /* PARTIAL IS DRAWN QUIETER, never louder: an outline rather than a fill
     where the position is true of some contract types and not all. The word
     alone would over-state, and silence would say nothing at all. */
  const dress = st.scope === 'some'
    ? `border:1px solid ${hard ? 'var(--st-ruby-fg)' : 'var(--color-divider)'};color:${hard ? 'var(--st-ruby-fg)' : 'var(--color-neutral-600)'}`
    : (hard ? 'background:var(--st-ruby-bg);color:var(--st-ruby-fg)'
            : 'background:var(--st-steel-bg);color:var(--st-steel-fg)');
  return `<span class="std-chip std-chip-pos" style="${dress}" title="${esc(tip)}">${esc(word)}</span>`;
}

/* What the fallback says, in the room a row has. A FIGURE where the wording
   carries one, because "Fallback 45 days" is the fact a person is deciding
   against; the word alone where it does not; and "No fallback" — quietly —
   where there is none, which is itself a real and useful answer. */
function stdFallbackChipHtml(cl){
  const fb = (typeof stdFallbackOf === 'function') ? stdFallbackOf(cl) : null;
  if (!fb) return `<span class="std-chip std-chip-fb std-chip-none">${esc(i18t('std_no_fallback'))}</span>`;
  const word = fb.figure != null
    ? i18t('std_fallback_n', { figure: fb.figure, unit: fb.unit })
    : i18t('std_fallback');
  return `<span class="std-chip std-chip-fb" style="background:var(--st-amber-bg);color:var(--st-amber-fg)"
    title="${esc(fb.text)}">${esc(word)}</span>`;
}

function renderClauseLibrary(){
  /* THE INSPECTOR DRAWS THIS PAGE WHERE THE WIDTH HOLDS IT (26 Sep 2026), and
     it has no #clause-lib: every save that ends here — the clause editor, an
     adopted fallback, a removal — repaints THAT page instead, so a change made
     from its panel is on screen the moment it is saved. */
  if(typeof pbInsMounted==='function'&&pbInsMounted()){ renderPlaybookPage(); return; }
  const host=document.getElementById('clause-lib'); if(!host) return;
  const canEditLib=isAdmin()||currentUser()?.role==='legal';
  const lib=clauseLibrary();
  const openId=stdOpenClauseId();
  host.innerHTML=lib.map((cl,i)=>{
    const on=openId!=null&&String(cl.id)===openId;
    const head=`<div class="std-head">
      <span class="std-cat">${esc(cl.category)}</span>
      <span class="std-name">${esc(cl.name)}</span>
      ${stdStanceChipHtml(cl)}
      <span style="flex:1"></span>
      ${stdFallbackChipHtml(cl)}
      <button class="std-open" data-std-open="${esc(String(cl.id))}" aria-expanded="${on?'true':'false'}"
        aria-controls="std-body-${esc(String(cl.id))}"
        aria-label="${esc((on?i18t('act_close'):i18t('std_open_clause'))+' — '+cl.name)}"
        >${esc(on?i18t('act_close'):i18t('std_open_clause'))}</button>
    </div>`;
    if(!on){
      /* OWNER'S RULING 2: one line of the wording, and it is clipped by WIDTH
         rather than by counting characters — so it ends where the row ends and
         reads as a sentence continuing, not as a broken product. */
      return `<div class="std-row" data-std-row="${esc(String(cl.id))}">${head}
        <p class="std-clip" title="${esc(String(cl.preferred||''))}">${esc(String(cl.preferred||''))}</p>
      </div>`;
    }
    const fb=(typeof stdFallbackOf==='function')?stdFallbackOf(cl):null;
    const h=(typeof stdHistoryFor==='function')?stdHistoryFor(cl):null;
    return `<div class="std-row is-open" data-std-row="${esc(String(cl.id))}">${head}
      <div class="std-body" id="std-body-${esc(String(cl.id))}">
        <div><p class="std-lab">${esc(i18t('std_ask_for'))}</p>
          <div class="std-quote">${esc(String(cl.preferred||''))}</div></div>
        <div><p class="std-lab">${esc(i18t('std_go_down_to'))}</p>
          ${fb?`<div class="std-quote">${esc(fb.text)}</div>`
              :`<p class="std-none">${esc(i18t('std_no_fallback_note'))}</p>`}</div>
        ${h?`<p class="std-hist"><b>${esc(i18t('std_your_history'))}</b> ${esc(
            i18t('std_hist_line',{figure:h.figure,unit:h.unit,seen:h.seen,settled:h.settled}))}</p>`:''}
        ${canEditLib?`<div class="std-acts">
          <button data-cl-edit="${i}">${esc(i18t('std_edit_wording'))}</button>
          <button data-std-pos="${i}">${esc(i18t('std_change_position'))}</button>
          <span style="flex:1"></span>
          <button data-cl-del="${i}" class="warn">${esc(i18t('set_remove_lower'))}</button>
        </div>`:''}
      </div>
    </div>`;
  }).join('')||`<p style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_no_clauses')}</p>`;

  /* THE PRESS IS A REPAINT OF THIS LIST AND NOTHING ELSE — the page holds a
     draft card and a proposals card either side of it and neither has moved. */
  host.querySelectorAll('[data-std-open]').forEach(b=>b.addEventListener('click',()=>{
    const id=b.getAttribute('data-std-open');
    stdSetOpenClause(stdOpenClauseId()===id?null:id);
    renderClauseLibrary();
  }));
  /* onto the standard's own row in its book's editor (stdPositionOpen) */
  host.querySelectorAll('[data-std-pos]').forEach(b=>b.addEventListener('click',()=>{
    const cl=clauseLibrary()[Number(b.getAttribute('data-std-pos'))]; if(cl) stdPositionOpen(cl.category); }));
  host.querySelectorAll('[data-cl-edit]').forEach(b=>b.addEventListener('click',()=>openClauseEditor(Number(b.getAttribute('data-cl-edit')))));
  /* ONE REMOVE, AND IT ASKS (the owner's list, 27 Sep 2026): this row deleted
     at once — with a bare toast that printed nothing — while the side panel's
     Remove asked first. Both press stdRemoveClause now. */
  host.querySelectorAll('[data-cl-del]').forEach(b=>b.addEventListener('click',()=>{ stdRemoveClause(Number(b.getAttribute('data-cl-del'))); }));
  document.getElementById('cl-add')?.addEventListener('click',()=>openClauseEditor(-1));
  renderPrecedentPanel();
  renderStandardsDraft();
  renderPlaybookView();
}
/* ---- playbook viewer + editor (Admin / Legal) ---- */
const PB_ESC = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
const PB_ATTR = s => String(s==null?'':s).replace(/"/g,'&quot;');
// position chip — red for required/forbidden, steel for preferred; ⚑ = escalate
function pbPosChip(pos){
  const hard=pos.pos==='required'||pos.pos==='forbidden';
  return `<span style="font-size:var(--t-label);font-family:var(--font-mono);border-radius:var(--radius);padding:2px 9px;${hard?'background:var(--st-ruby-bg);color:var(--st-ruby-fg)':'background:var(--st-steel-bg);color:var(--st-steel-fg)'}">${PB_ESC(pos.category)}${pos.escalate?' ⚑':''}</span>`;
}
const pbRangeChip = rg => `<span style="font-size:var(--t-label);font-family:var(--font-mono);border-radius:var(--radius);padding:2px 9px;${rg.hard?'background:var(--st-ruby-bg);color:var(--st-ruby-fg)':'background:var(--st-amber-bg);color:var(--st-amber-fg)'}">${PB_ESC(rg.label)} ${rg.op} ${rg.value}${rg.escalate?' ⚑':''}</span>`;
/* ---- ONE CHIP PER STANDARD (the owner's list, 27 Sep 2026) ----
   A book that holds a limit AND a position of the same name ("Liability cap"
   on the supply and services books) drew two chips of that name. The wide
   page says each standard once (stdBookLines); here the position folds into
   its limit's chip — the figure is the more exact fact — keeping the stance's
   tone where it is hard and the flag where either carries one. Names are
   matched as the wide page matches them: trimmed, case folded. */
function pbBookChipsHtml(positions, ranges){
  const norm = x => String(x == null ? '' : x).trim().toLowerCase();
  const byName = new Map();
  (positions || []).forEach(p => { if (p && p.category && !byName.has(norm(p.category))) byName.set(norm(p.category), p); });
  const limits = new Set((ranges || []).map(r => norm(r && r.label)));
  const posChips = (positions || []).filter(p => !(p && limits.has(norm(p.category)))).map(pbPosChip);
  const rangeChips = (ranges || []).map(r => {
    const p = r && byName.get(norm(r.label));
    return pbRangeChip(p ? { ...r, escalate: !!(r.escalate || p.escalate), hard: p.pos === 'required' || p.pos === 'forbidden' } : r);
  });
  return posChips.join('') + rangeChips.join('');
}
function renderPlaybookView(){
  if(typeof pbInsMounted==='function'&&pbInsMounted()){ renderPlaybookPage(); return; }
  const pv=document.getElementById('playbook-view'); if(!pv) return;
  const canEditPb=isAdmin()||currentUser()?.role==='legal';
  const pb=playbook();
  const base=pb._default||DEFAULT_PLAYBOOK._default;
  const card=(key,label,positions,ranges,removable,baseline)=>`
    <div style="margin-bottom:${baseline?'12px':'8px'};border:1px solid ${baseline?'var(--color-accent-300)':'var(--color-divider)'};border-left:3px solid ${baseline?'var(--color-accent)':'var(--color-divider)'};border-radius:var(--radius);background:${baseline?'var(--color-accent-100)':'var(--color-surface)'};padding:${baseline?'11px 13px':'10px 12px'}">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:${baseline?'2px':'6px'}">
        <span style="font-size:var(--t-meta);font-weight:${baseline?700:600};color:${baseline?'var(--color-accent-900)':'var(--color-text)'}">${PB_ESC(label)}</span>
        ${baseline?`<span style="font-size:var(--t-figure);font-family:var(--font-heading);font-weight:var(--w-title);color:#fff;background:var(--color-accent);border-radius:var(--radius);padding:2px var(--s-2)">${i18t('set_applies_all')}</span>`:''}
        ${canEditPb?`<span style="margin-left:auto;display:flex;gap:10px;font-size:var(--t-label);font-weight:var(--w-strong)">
          <button data-pb-edit="${key}" style="background:none;border:0;cursor:pointer;color:var(--accent-ink-700)">${i18t('set_edit_lower')}</button>
          ${removable?`<button data-pb-del="${key}" style="background:none;border:0;cursor:pointer;color:var(--st-ruby-dot)">${i18t('set_remove_lower')}</button>`:''}
        </span>`:''}
      </div>
      ${baseline?`<div style="font-size:var(--t-label);color:var(--accent-ink);margin-bottom:7px">${i18t('set_default_positions')}</div>`:''}
      <div style="display:flex;flex-wrap:wrap;gap:5px">${pbBookChipsHtml(positions,ranges)||(positions.length||ranges.length?'':`<span style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_no_positions')}</span>`)}</div>
    </div>`;
  const baseCard=card('_default',i18t('set_all_contracts_baseline'), base.positions||[], base.ranges||[], false, true);
  const typeCards=Object.keys(pb).filter(k=>k!=='_default').map(k=>{ const rp=resolvePlaybook(k); return card(k, pb[k].label||k, rp.positions, rp.ranges, true); }).join('');
  pv.innerHTML=`
    <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:var(--s-2)">
      <span style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_playbook_by_type')}</span>
      ${canEditPb?`<span style="margin-left:auto;display:flex;gap:var(--s-2)">
        <button id="pb-add" class="ui-btn ui-btn-sm ui-btn-primary">${icon('plus','w-3 h-3')} ${i18t('set_add_type')}</button>
        <button id="pb-reset" type="button" class="ui-link">${i18t('set_reset_defaults2')}</button>
      </span>`:''}
    </div>
    ${baseCard}${typeCards}
    <p style="font-size:var(--t-label);color:var(--color-neutral-500);margin-top:var(--s-1)">${i18t('set_flag_legend')}${canEditPb?i18t('set_flag_legend_more'):''}</p>`;
  if(!canEditPb) return;
  pv.querySelectorAll('[data-pb-edit]').forEach(b=>b.addEventListener('click',()=>openPlaybookEditor(b.getAttribute('data-pb-edit'))));
  pv.querySelectorAll('[data-pb-del]').forEach(b=>b.addEventListener('click',()=>pbRemoveType(b.getAttribute('data-pb-del'))));
  document.getElementById('pb-add')?.addEventListener('click',()=>openPlaybookEditor(null));
  document.getElementById('pb-reset')?.addEventListener('click',()=>pbResetPlaybook());
}
/* ---- THE TWO ACTS THAT THROW A BOOK AWAY, EACH WRITTEN ONCE (26 Sep 2026) ----
   Lifted out of the handlers above, word for word, because the Inspector's
   panel and head offer the same two acts: a press on either shape of the page
   is this one function, so the question they ask and what they write cannot
   drift apart. Both ask first. */
async function pbRemoveType(key){
  const cur=playbook();
  if(!key||key==='_default'||!cur[key]) return false;
  if(!await confirmDialog({title:i18t('set_remove_type_q',{label:cur[key]?.label||key}), message:i18t('set_remove_type_msg'), confirmLabel:i18t('set_remove_type_btn'), danger:true})) return false;
  const pb2=JSON.parse(JSON.stringify(cur)); delete pb2[key]; savePlaybook(pb2); renderPlaybookView(); toast(i18t('set_type_removed'));
  return true;
}
async function pbResetPlaybook(){
  if(!await confirmDialog({title:i18t('set_reset_pb_q'), message:i18t('set_reset_pb_msg',{pack:jxPlaybookLabel()}), confirmLabel:i18t('set_reset_pb_btn'), danger:true})) return false;
  state.settings=state.settings||{}; delete state.settings.playbook; if(typeof saveSettings==='function') saveSettings();
  renderPlaybookView(); toast(i18t('set_pb_reset_done'));
  return true;
}
/* REMOVING A STANDARD ASKS FIRST on the Inspector's panel (Young's yes to the
   drawing, 26 Sep 2026): it is the wording every future check measures
   against and the wording HaTi drafts with, so a slip of the ⋯ menu must not
   take it. The classic row's own Remove is left exactly as it was. */
async function stdRemoveClause(i){
  const lib=clauseLibrary(); const cl=lib[i]; if(!cl) return false;
  if(!await confirmDialog({ title:i18t('sd_remove_q',{name:cl.name||cl.category||''}), message:i18t('sd_remove_msg'),
    confirmLabel:i18t('sd_remove_go'), danger:true })) return false;
  const lib2=lib.slice(); lib2.splice(i,1); saveClauseLibrary(lib2); stdSetOpenClause(null); renderClauseLibrary();
  toast(i18t('set_t_clause_removed'),'ok');
  return true;
}
/* Modal editor for one playbook entry (key='_default' edits the baseline,
   null adds a new contract type). Positions and numeric limits are edited live
   on a working copy, then committed with Save. */
/* ---- "SET HOW FIRM WE ARE" LANDS ON THE STANDARD ITSELF (owner, 20 Oct
   2026: "make the button open straight onto the rule you clicked, ready to
   change, and make it work for every rule") ----
   One door from both drawings of a standard (the list's panel and the plain
   list): the editor of the book that holds the standard opens with its row
   lit and in view. A standard no book names yet gets a row in the baseline,
   ready to set — nothing is kept until Save, as every row in this editor. */
function stdPositionOpen(category){
  const cat=String(category||'').trim();
  const key=(typeof stdBookFor==='function')?stdBookFor(cat):'_default';
  return openPlaybookEditor(key, { focus:cat });
}
function openPlaybookEditor(key, opts={}){
  const pb=JSON.parse(JSON.stringify(playbook()));
  const isNew=!key, isBase=key==='_default';
  if(isNew){ key='t_'+Math.random().toString(36).slice(2,7); pb[key]={label:'',extends:'_default',positions:[],ranges:[],match:[]}; }
  const e=pb[key]; e.positions=e.positions||[]; e.ranges=e.ranges||[]; e.match=e.match||[];
  const inherited=(!isBase)?resolvePlaybook('_default'):null;
  const POS=[['required',i18t('set_pos_required')],['preferred',i18t('set_pos_preferred')],['forbidden',i18t('set_pos_forbidden')]];
  const inp='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:6px var(--s-2);font:inherit;font-size:var(--t-body);color:inherit;outline:none';
  openModal(`<div style="padding:20px 22px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;margin:0 0 var(--s-3)">${isNew?i18t('set_add_contract_type'):isBase?i18t('set_edit_baseline'):i18t('set_edit_playbook_for',{label:PB_ESC(e.label||key)})}</h3>
    <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text);margin-bottom:3px">${isBase?i18t('set_name'):i18t('set_type_name')}</span>
      <input id="pb-f-label" value="${PB_ATTR(e.label||'')}" placeholder="${isBase?esc(i18t('set_ph_baseline')):esc(i18t('set_ph_eg_distribution'))}" style="${inp}"></label>
    ${!isBase?`<label style="display:block;margin-bottom:10px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text);margin-bottom:3px">${i18t('set_applies_matching')} <span style="font-weight:var(--w-body);color:var(--color-neutral-500)">${i18t('set_comma_keywords')}</span></span>
      <input id="pb-f-match" value="${PB_ATTR(e.match.join(', '))}" placeholder="${esc(i18t('set_ph_eg_keywords'))}" style="${inp}"></label>
    <div style="font-size:var(--t-label);color:var(--color-neutral-600);background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius);padding:7px 9px;margin-bottom:var(--s-3)">${i18t('set_inherited_baseline')} <span style="display:inline-flex;flex-wrap:wrap;gap:var(--s-1);vertical-align:middle">${inherited.positions.map(pbPosChip).join('')}${inherited.ranges.map(pbRangeChip).join('')}</span></div>`:''}

    <div style="display:flex;align-items:center;margin:0 0 6px"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text)">${isBase?i18t('set_positions'):i18t('set_positions_for_type')}</span><button id="pb-add-pos" class="ui-link" style="margin-left:auto">${(typeof window!=='undefined'&&window.plusLed?window.plusLed(i18t('set_add_position')):i18t('set_add_position'))}</button></div>
    <div id="pb-pos-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px"></div>

    <div style="display:flex;align-items:center;margin:0 0 6px"><span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_numeric_limits')}</span><button id="pb-add-rng" class="ui-link" style="margin-left:auto">${(typeof window!=='undefined'&&window.plusLed?window.plusLed(i18t('set_add_limit')):i18t('set_add_limit'))}</button></div>
    <div id="pb-rng-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:var(--s-4)"></div>

    <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
      <button data-dlg-cancel id="pb-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="pb-save" class="ui-btn ui-btn-primary">${i18t('act_save')}</button>
    </div>
  </div>`, {maxWidth:'34rem'});

  const seg=(i)=>POS.map(([v,l])=>{ const on=e.positions[i].pos===v; const hard=v==='required'||v==='forbidden';
    return `<button data-pb-pos="${i}" data-v="${v}" style="font-size:var(--t-label);font-weight:var(--w-strong);border:1px solid ${on?(hard?'var(--st-ruby-line)':'var(--color-accent)'):'var(--color-divider)'};background:${on?(hard?'var(--st-ruby-bg)':'var(--color-accent-100)'):'var(--color-surface)'};color:${on?(hard?'var(--st-ruby-fg)':'var(--accent-ink)'):'var(--color-neutral-600)'};padding:var(--s-1) 9px;border-radius:var(--radius);cursor:pointer">${l}</button>`; }).join('');
  const paint=()=>{
    const pl=document.getElementById('pb-pos-list');
    pl.innerHTML=e.positions.length?e.positions.map((p,i)=>`
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;border:1px solid var(--color-divider);border-radius:var(--radius);padding:7px var(--s-2);background:var(--color-bg)">
        <input data-pb-cat="${i}" value="${PB_ATTR(p.category||'')}" placeholder="${esc(i18t('set_ph_category'))}" style="flex:1;min-width:150px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;outline:none;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
        <span style="display:inline-flex;gap:3px">${seg(i)}</span>
        <label style="display:inline-flex;align-items:center;gap:var(--s-1);font-size:var(--t-label);color:var(--color-neutral-700);white-space:nowrap"><input type="checkbox" data-pb-esc="${i}" ${p.escalate?'checked':''} style="accent-color:var(--color-accent)">${i18t('set_flag_legal')}</label>
        <button data-pb-rmpos="${i}" title="${i18t('act_remove')}" aria-label="${i18t('act_remove')}" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon">${icon('x')}</button>
      </div>`).join(''):`<p style="font-size:var(--t-label);color:var(--color-neutral-500);margin:0">${isBase?i18t('set_no_specific_positions'):i18t('set_no_specific_inherits')}</p>`;
    const rl=document.getElementById('pb-rng-list');
    rl.innerHTML=e.ranges.length?e.ranges.map((r,i)=>`
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;border:1px solid var(--color-divider);border-radius:var(--radius);padding:7px var(--s-2);background:var(--color-bg)">
        <input data-pb-rlabel="${i}" value="${PB_ATTR(r.label||'')}" placeholder="${esc(i18t('set_ph_label_payment'))}" style="flex:1;min-width:120px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;outline:none;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
        <select data-pb-rop="${i}" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;cursor:pointer;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)"><option value="<=" ${r.op==='<='?'selected':''}>≤</option><option value=">=" ${r.op==='>='?'selected':''}>≥</option></select>
        <input data-pb-rval="${i}" type="number" value="${r.value}" style="width:74px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;outline:none;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
        <label style="display:inline-flex;align-items:center;gap:var(--s-1);font-size:var(--t-label);color:var(--color-neutral-700);white-space:nowrap"><input type="checkbox" data-pb-resc="${i}" ${r.escalate?'checked':''} style="accent-color:var(--color-accent)">${i18t('set_flag_legal')}</label>
        <button data-pb-rmrng="${i}" title="${i18t('act_remove')}" aria-label="${i18t('act_remove')}" class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon">${icon('x')}</button>
      </div>`).join(''):`<p style="font-size:var(--t-label);color:var(--color-neutral-500);margin:0">${i18t('set_no_numeric_limits')}</p>`;
    // wire row inputs → live working copy
    pl.querySelectorAll('[data-pb-cat]').forEach(el=>el.addEventListener('input',()=>{ e.positions[+el.dataset.pbCat].category=el.value; }));
    pl.querySelectorAll('[data-pb-esc]').forEach(el=>el.addEventListener('change',()=>{ e.positions[+el.dataset.pbEsc].escalate=el.checked; }));
    pl.querySelectorAll('[data-pb-pos]').forEach(el=>el.addEventListener('click',()=>{ e.positions[+el.dataset.pbPos].pos=el.dataset.v; paint(); }));
    pl.querySelectorAll('[data-pb-rmpos]').forEach(el=>el.addEventListener('click',()=>{ e.positions.splice(+el.dataset.pbRmpos,1); paint(); }));
    rl.querySelectorAll('[data-pb-rlabel]').forEach(el=>el.addEventListener('input',()=>{ e.ranges[+el.dataset.pbRlabel].label=el.value; }));
    rl.querySelectorAll('[data-pb-rop]').forEach(el=>el.addEventListener('change',()=>{ e.ranges[+el.dataset.pbRop].op=el.value; }));
    rl.querySelectorAll('[data-pb-rval]').forEach(el=>el.addEventListener('input',()=>{ e.ranges[+el.dataset.pbRval].value=Number(el.value)||0; }));
    rl.querySelectorAll('[data-pb-resc]').forEach(el=>el.addEventListener('change',()=>{ e.ranges[+el.dataset.pbResc].escalate=el.checked; }));
    rl.querySelectorAll('[data-pb-rmrng]').forEach(el=>el.addEventListener('click',()=>{ e.ranges.splice(+el.dataset.pbRmrng,1); paint(); }));
  };
  /* the standard asked for: its own row lit (a position, or a numeric limit
     by its label); none in this book yet → a new row named for it */
  const focus=String(opts.focus||'').trim(), same=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();
  let at=null;
  if(focus){
    const pi=e.positions.findIndex(p=>p&&same(p.category,focus)), ri=e.ranges.findIndex(r=>r&&same(r.label,focus));
    if(pi>=0) at=`[data-pb-cat="${pi}"]`;
    else if(ri>=0) at=`[data-pb-rlabel="${ri}"]`;
    else { e.positions.push({ category:focus, pos:'preferred', escalate:false }); at=`[data-pb-cat="${e.positions.length-1}"]`; }
  }
  paint();
  if(at){ const row=()=>{ const el=document.querySelector('#pb-pos-list '+at+', #pb-rng-list '+at); return el?el.parentElement:null; };
    if(typeof landOn==='function') landOn(row, { block:'center' }); else { const r=row(); if(r) r.scrollIntoView({ block:'center' }); } }
  document.getElementById('pb-add-pos').addEventListener('click',()=>{ e.positions.push({category:'',pos:'preferred',escalate:false}); paint(); });
  document.getElementById('pb-add-rng').addEventListener('click',()=>{ e.ranges.push({key:'',label:'',op:'<=',value:30,escalate:true}); paint(); });
  document.getElementById('pb-cancel').addEventListener('click',closeModal);
  document.getElementById('pb-save').addEventListener('click',()=>{
    e.label=document.getElementById('pb-f-label').value.trim();
    if(!isBase){ const mv=document.getElementById('pb-f-match'); e.match=(mv?mv.value:'').split(',').map(s=>s.trim()).filter(Boolean); }
    if(!e.label){ toast(i18t('set_t_give_name'),'err'); return; }
    e.positions=e.positions.filter(p=>p.category&&p.category.trim());
    e.ranges=e.ranges.filter(r=>r.label&&r.label.trim());
    // help the review engine enforce the common numeric limits
    e.ranges.forEach(r=>{ if(/pay/i.test(r.label)) r.key='paymentDays'; else if(/liab/i.test(r.label)) r.key='liabilityMonths'; else if(!r.key) r.key=r.label.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,24)||'limit'; });
    if(!isBase) e.extends='_default';
    savePlaybook(pb); closeModal(); renderPlaybookView(); toast(i18t('set_t_playbook_saved'));
  });
}
function openClauseEditor(idx){
  const lib=clauseLibrary().slice();
  const cl=idx>=0?{...lib[idx]}:{ id:'cl_'+Math.random().toString(36).slice(2,7), category:'', name:'', preferred:'', fallback:'', guidance:'' };
  const fld=(k,label,ta)=>ta
    ? `<label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${label}</span><textarea id="ce-${k}" rows="2" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">${(cl[k]||'').replace(/</g,'&lt;')}</textarea></label>`
    : `<label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${label}</span><input id="ce-${k}" value="${(cl[k]||'').replace(/"/g,'&quot;')}" class="mt-1 w-full rounded-lg border border-inputln bg-white ui-fld outline-none focus:border-brand-500"/></label>`;
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-3">${idx>=0?'Edit':'Add'} clause</h3>
    ${fld('category','Category')}${fld('name','Name')}${fld('preferred','Preferred wording',true)}${fld('fallback','Fallback wording',true)}${fld('guidance','Guidance',true)}
    <div class="flex justify-end gap-2 mt-2"><button data-dlg-cancel id="ce-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="ce-save" class="ui-btn ui-btn-primary">${i18t('act_save')}</button></div>
  </div>`);
  document.getElementById('ce-cancel').addEventListener('click',closeModal);
  document.getElementById('ce-save').addEventListener('click',()=>{
    ['category','name','preferred','fallback','guidance'].forEach(k=>cl[k]=document.getElementById('ce-'+k).value.trim());
    if(!cl.name||!cl.category){ toast(i18t('set_t_cat_name_required'),'err'); return; }
    if(idx>=0) lib[idx]=cl; else lib.push(cl);
    saveClauseLibrary(lib); closeModal(); renderClauseLibrary(); toast(i18t('set_clause_saved'));
  });
}

/* ---- E5 approval rules builder (Admin) ---- */
const AR_CONDS=()=>[['value',i18t('set_cond_value',{cur:jxCurrency()})],['folder',i18t('set_cond_folder')],['kind',i18t('set_cond_kind')],['foreignLaw',i18t('set_cond_foreign')],['deviation',i18t('set_cond_deviation')]];
function condLabel(cond){
  switch(cond.type){
    case 'value': return i18t('set_cond_value_is',{op:cond.op||'>=',amount:fmtMoneyShort(cond.value)});
    case 'folder': return i18t('set_cond_folder_is',{name:(FOLDERS[cond.value]||{}).name||cond.value});
    case 'kind': return i18t('set_cond_kind_is',{value:cond.value});
    case 'foreignLaw': return i18t('set_cond_foreign');
    case 'deviation': return i18t('set_cond_deviation');
    default: return cond.type;
  }
}
function renderApprovalRules(){
  const host=document.getElementById('approval-rules'); if(!host) return;
  const rules=approvalRules().slice().sort((a,b)=>(a.order||99)-(b.order||99));
  host.innerHTML=rules.length?rules.map((r,i)=>`
    <div style="border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:10px var(--s-3);margin-bottom:var(--s-2)">
      <div style="display:flex;align-items:center;gap:var(--s-2)">
        <span style="width:22px;height:22px;display:inline-grid;place-items:center;border-radius:50%;background:var(--tile-steel-bg);font-size:var(--t-label);font-weight:var(--w-title);color:var(--tile-steel-fg);flex:none">${r.order||1}</span>
        <span style="font-size:var(--t-meta);color:var(--color-text)"><b>${i18t('set_if')}</b> ${condLabel(r.cond)} <b>${i18t('set_then')}</b> ${approverLabelOf(r.approver)}</span>
        ${isAdmin()?`<span style="margin-left:auto;display:flex;gap:10px;font-size:var(--t-label);font-weight:var(--w-strong)"><button data-ar-edit="${i}" style="background:none;border:0;cursor:pointer;color:var(--accent-ink-700)">${i18t('set_edit_lower')}</button><button data-ar-del="${i}" style="background:none;border:0;cursor:pointer;color:var(--st-ruby-dot)">${i18t('set_remove_lower')}</button></span>`:''}
      </div>
    </div>`).join(''):`<p style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_no_approval_rules')}</p>`;
  host.querySelectorAll('[data-ar-edit]').forEach(b=>b.addEventListener('click',()=>openApprovalRuleEditor(Number(b.getAttribute('data-ar-edit')))));
  host.querySelectorAll('[data-ar-del]').forEach(b=>b.addEventListener('click',()=>{ const rules2=approvalRules().slice(); rules2.splice(Number(b.getAttribute('data-ar-del')),1); saveApprovalRules(rules2); renderApprovalRules(); toast(i18t('set_rule_removed'),'ok'); }));
}
function openApprovalRuleEditor(idx){
  const rules=approvalRules().slice();
  const r=idx>=0?JSON.parse(JSON.stringify(rules[idx])):{ id:'r_'+Math.random().toString(36).slice(2,7), order:rules.length+1, cond:{type:'value',op:'>=',value:5000000}, approver:{kind:'role',role:'admin'} };
  const members=(getUsers()||[]);
  /* ---- A NAMED APPROVER WHO HAS LEFT IS NOT QUIETLY REPLACED ----
     The select lists the two roles and the CURRENT members. A rule naming
     somebody who has since been removed matched no option, so the browser
     selected the first one — "Any admin" — and pressing Save wrote that,
     silently widening who may approve contracts above a threshold, with
     nothing on screen saying it had happened.
     The name is kept and shown for what it is, and the save refuses until a
     person actually chooses. Naming the departed member is the point: an admin
     who can see WHO it used to be can pick the right replacement. */
  const isAp = m => r.approver && r.approver.kind==='member'
    && (r.approver.id ? String(m.id)===String(r.approver.id) : m.name===r.approver.name);
  const orphan = r.approver && r.approver.kind==='member'
    && !members.some(isAp) ? r.approver.name : null;
  /* AS DRAWN (SAP pop-ups, 10 Oct 2026): the rule in the order it is said —
     WHEN (the condition and its value side by side), WHO approves and in
     WHICH STEP (a list of steps, not a number box), then the rule read back
     in one line. Every id is kept: ar-order is now the step list. */
  const steps=Math.max(rules.length+(idx>=0?0:1), Number(r.order)||1, 1);
  const selCls='style="'+HATI_FLD+'"';
  openModal(`<div class="p-6">
    <h3>${idx>=0?i18t('set_edit_rule'):i18t('set_add_rule')}</h3>
    <div class="sap-body">
      <div class="sap-f"><span class="sap-lbl">${esc(i18t('ar_when'))}</span>
        <div class="sap-row">
          <select id="ar-cond" ${selCls} aria-label="${esc(i18t('set_condition'))}">${AR_CONDS().map(([k,l])=>`<option value="${k}" ${r.cond.type===k?'selected':''}>${l}</option>`).join('')}</select>
          <div id="ar-condval"></div>
        </div></div>
      <div class="sap-row">
        <div class="sap-f"><label for="ar-approver">${esc(i18t('ar_who'))}</label>
          <select id="ar-approver" ${selCls}>
            <option value="role:admin" ${r.approver.kind==='role'&&r.approver.role==='admin'?'selected':''}>${i18t('set_any_admin')}</option>
            <option value="role:legal" ${r.approver.kind==='role'&&r.approver.role==='legal'?'selected':''}>${i18t('set_any_legal')}</option>
            ${orphan?`<option value="orphan" selected>${esc(orphan)} — ${i18t('set_approver_gone')}</option>`:''}
            ${members.map(m=>`<option value="member:${esc(m.id)}" ${isAp(m)?'selected':''}>${esc(m.name)} (${roleName(m.role)})</option>`).join('')}
          </select></div>
        <div class="sap-f"><label for="ar-order">${esc(i18t('ar_step'))}</label>
          <select id="ar-order" ${selCls}>${Array.from({length:steps},(_,i)=>`<option value="${i+1}"${Number(r.order||1)===i+1?' selected':''}>${esc(i18t('ar_step_n',{n:i+1}))}</option>`).join('')}</select></div>
      </div>
      ${orphan?`<span style="display:block;font-size:var(--t-label);color:var(--st-amber-fg);background:var(--st-amber-bg);border:1px solid var(--st-amber-line);padding:6px 9px;border-radius:var(--radius)">${i18t('set_approver_gone_note',{name:esc(orphan)})}</span>`:''}
      ${''/* THE RULE READ BACK AS A SENTENCE (SAP pop-ups, owner's yes 10 Oct
             2026): painted on every change by arSays below. */}
      <div id="ar-says" role="status" style="display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border-radius:var(--radius);border:1px solid color-mix(in srgb, var(--accent-fill) 25%, transparent);background:color-mix(in srgb, var(--accent-fill) 8%, var(--color-surface));color:var(--accent-ink);font-size:var(--t-body);line-height:1.45"></div>
    </div>
    <div class="flex justify-end gap-2"><button data-dlg-cancel id="ar-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="ar-save" class="ui-btn ui-btn-primary">${i18t(idx>=0?'set_save_rule':'ar_add_go')}</button></div>
  </div>`,{maxWidth:'560px'});
  const arSays=()=>{
    const host=document.getElementById('ar-says'); if(!host) return;
    const t=document.getElementById('ar-cond').value, cv=document.getElementById('ar-cv');
    const cond={ type:t, op:'>=', value: t==='value' ? Number((cv&&cv.value)||0) : (cv&&cv.value) };
    const apSel=document.getElementById('ar-approver');
    const who=(apSel && apSel.selectedOptions[0]) ? apSel.selectedOptions[0].textContent.trim() : '';
    host.innerHTML=`${icon('info','w-4 h-4')}<span>${esc(i18t('ar_reads_k'))} <b>${esc(i18t('ar_reads_s',{ who, n:Math.max(1,Number(document.getElementById('ar-order').value||1)), cond:condLabel(cond) }))}</b></span>`;
  };
  const renderCondVal=()=>{ const t=document.getElementById('ar-cond').value; const h=document.getElementById('ar-condval');
    if(t==='value') h.innerHTML=`<span class="of-amt"><i>${esc(jxCurrency())}</i><input id="ar-cv" type="number" aria-label="${esc(i18t('set_threshold',{cur:jxCurrency()}))}" value="${r.cond.type==='value'?r.cond.value:5000000}"/></span>`;
    else if(t==='folder') h.innerHTML=`<select id="ar-cv" ${selCls} aria-label="${esc(i18t('set_value_stream'))}">${Object.values(FOLDERS).map(f=>`<option value="${esc(f.id)}" ${r.cond.value===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select>`;
    else if(t==='kind') h.innerHTML=`<input id="ar-cv" ${selCls} aria-label="${esc(i18t('set_type_contains'))}" value="${r.cond.type==='kind'?(r.cond.value||''):''}" placeholder="${esc(i18t('set_ph_eg_lease'))}"/>`;
    else h.innerHTML=`<p class="sap-help" style="padding-top:7px">${i18t('set_no_extra_value')}</p>`; };
  document.getElementById('ar-cond').addEventListener('change',()=>{ renderCondVal(); arSays(); }); renderCondVal();
  document.querySelector('#modal-root [role="dialog"]').addEventListener('input',arSays);
  document.querySelector('#modal-root [role="dialog"]').addEventListener('change',arSays);
  arSays();
  document.getElementById('ar-cancel').addEventListener('click',closeModal);
  document.getElementById('ar-save').addEventListener('click',()=>{
    const t=document.getElementById('ar-cond').value; const cv=document.getElementById('ar-cv');
    const cond={type:t}; if(t==='value'){ cond.op='>='; cond.value=Number(cv.value||0); } else if(t==='folder'||t==='kind'){ cond.value=cv.value.trim?cv.value.trim():cv.value; }
    const apRaw=document.getElementById('ar-approver').value;
    /* The refusal, rather than a silent widening. */
    if(apRaw==='orphan'){ toast(i18t('set_pick_approver'),'err'); return; }
    const ap=apRaw.split(':');
    r.order=Math.max(1,Number(document.getElementById('ar-order').value||1)); r.cond=cond;
    const apM = ap[0]==='member' ? members.find(m=>String(m.id)===ap.slice(1).join(':')) : null;
    r.approver = apM?{kind:'member',name:apM.name,id:apM.id}:{kind:'role',role:ap[1]};
    r.name = condLabel(cond);
    if(idx>=0) rules[idx]=r; else rules.push(r);
    saveApprovalRules(rules); closeModal(); renderApprovalRules(); toast(i18t('set_rule_saved'),'ok');
  });
}

/* ---- the internal-review gate (Admin) ----
   THREE CONTROLS AND NO SAVE BUTTON. Each one writes on change, because a gate
   that is armed only if you remember to press Save is a gate that is off when
   it matters. saveReviewGateCfg is the single writer (js/review.js); this panel
   never touches state.settings itself. */
/* ---- THE AGENTS' SETTINGS, DRAWN AND SAVED (see SET_PANELS.agents) ----
   Each row carries only the settings that agent has (the server's defaults
   say which), and its own Save — one agent's settings are one decision. */
const ST_AGENT_KEYS=['round','link','renew','paper','late','ours','import'];
async function stAgentsPaint(){
  const host=document.getElementById('st-agents-panel'); if(!host) return;
  /* JAMBO'S POINTS (12 Oct 2026, the agents page): the company's value per agent,
     its own section in this drawer under the agents — one row per agent in
     AG_KEYS, so a new agent's row is here the day it arrives
     (agPointsTableHtml, js/views/jambohouse.js); drawn and wired once. */
  if(typeof agPointsTableHtml==='function' && !document.getElementById('st-ag-points')){
    host.insertAdjacentHTML('afterend',`<section class="st-sec" style="margin-top:var(--s-4)" id="st-ag-points"><h3 class="st-sec-h">${esc(i18t('jh_pt_h'))}</h3>${agPointsTableHtml('company')}</section>`);
    if(typeof agPointsWire==='function') agPointsWire(document.getElementById('st-ag-points'));
  }
  if(typeof agentsStatusLoad!=='function'){ host.innerHTML=''; return; }
  host.innerHTML=`<p class="st-note">${esc(i18t('ct_loading_contract'))}</p>`;
  const s=await agentsStatusLoad();
  if(!document.getElementById('st-agents-panel')) return;
  if(!s||!s.agents||!s.money){ host.innerHTML=`<p class="st-note">${esc(i18t('st_agents_admin'))}</p>`; return; }
  const lab=t=>`<span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${esc(t)}</span>`;
  const num=(k,f,v,min,max,step)=>`<label style="display:block;min-width:0">${lab(i18t('st_agents_f_'+f))}<input type="number" data-st-ag-f="${f}" min="${min}" max="${max}" step="${step||1}" value="${v==null?'':esc(String(v))}" style="${ST_INPUT}"/></label>`;
  host.innerHTML=ST_AGENT_KEYS.map(k=>{
    const a=s.agents[k]; if(!a) return '';
    const cfg=a.cfg||{};
    const f=[];
    if('at' in cfg) f.push(`<label style="display:block;min-width:0">${lab(i18t('st_agents_f_at'))}<select data-st-ag-f="at" style="${ST_INPUT}">${
      Array.from({length:24},(_,h)=>`<option value="${h}"${Number(cfg.at)===h?' selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('')}</select></label>`);
    if('max' in cfg) f.push(num(k,'max',cfg.max,1,500));
    if('limit' in cfg) f.push(num(k,'limit',cfg.limit,0,1000,0.01));
    if('soonDays' in cfg) f.push(num(k,'soonDays',cfg.soonDays,1,30));
    /* HOW FAR IT MAY GO (the permission ladder, 7 Oct 2026). Just do it is
       offered only where the act stays inside and can be undone; elsewhere it
       is drawn grey with the reason on its hover. */
    if(a.level) f.push(`<label style="display:block;min-width:0">${lab(i18t('st_agents_f_level'))}<select data-st-ag-f="level" style="${ST_INPUT}" title="${esc(a.autoOk?'':i18t('st_agents_auto_no'))}">${
      ['auto','ask','mine'].map(v=>`<option value="${v}"${a.level===v?' selected':''}${v==='auto'&&!a.autoOk?' disabled':''}>${esc(i18t('st_agents_lv_'+v))}</option>`).join('')}</select></label>`);
    if('secondAfter' in cfg) f.push(num(k,'secondAfter',cfg.secondAfter,1,90));
    return `<section class="st-sec" data-st-agent="${k}" style="padding-top:12px;border-top:1px solid var(--color-divider);margin-top:12px">
      <label style="display:flex;gap:9px;align-items:center;font-size:var(--t-meta);cursor:pointer">
        <input type="checkbox" data-st-ag-f="on"${a.on?' checked':''}/>
        <span style="font-weight:var(--w-strong);color:var(--color-text)">${esc(i18t('ag_'+k))}</span></label>
      <p class="st-note" style="margin:4px 0 8px">${esc(i18t('ag_'+k+'_does'))}</p>
      ${f.length?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:9px">${f.join('')}</div>`:''}
      <div style="display:flex;align-items:center;gap:10px;margin-top:9px;flex-wrap:wrap">
        <button type="button" data-st-ag-save="${k}" style="${ST_BTN_SM}">${esc(i18t('act_save'))}</button>
        ${a.on?`<button type="button" data-st-ag-run="${k}" style="${ST_BTN_SM}"${a.running?' disabled aria-disabled="true"':''}>${a.running&&window.busyHtml?busyHtml(i18t('ag_running')):esc(i18t(a.running?'ag_running':'ag_runnow'))}</button>`:''}
        ${AG_MONEY_NOTE_KEYS.includes(k)?`<span class="st-note" style="margin:0">${esc(i18t('st_agents_money_note'))}</span>`:''}
      </div>
      ${''/* RUN NOW AND THE EARLIER RUNS MOVED HERE when Copilot's work moved onto
             the Board (Young, 7 Oct 2026): the work is done on the Board, and how
             an agent runs is a setting's business. The table is the page's own. */}
      ${typeof agRunsHtml==='function'?agRunsHtml(k):''}</section>`;
  }).join('');
  if(host.dataset.stAgWired) return;
  host.dataset.stAgWired='1';
  host.addEventListener('click',async ev=>{
    const run=ev.target&&ev.target.closest?ev.target.closest('[data-st-ag-run]'):null;
    if(run){
      if(typeof agRunNowPress==='function'){ await agRunNowPress(run.getAttribute('data-st-ag-run')); stAgentsPaint(); }
      return;
    }
    const b=ev.target&&ev.target.closest?ev.target.closest('[data-st-ag-save]'):null;
    if(!b) return;
    const k=b.getAttribute('data-st-ag-save');
    const row=host.querySelector(`[data-st-agent="${k}"]`); if(!row) return;
    const patch={};
    row.querySelectorAll('[data-st-ag-f]').forEach(el=>{
      const f=el.getAttribute('data-st-ag-f');
      patch[f]=el.type==='checkbox'?!!el.checked:el.value;
    });
    try{ await agentSaveCfg(k,patch); toast(i18t('st_agents_saved',{ name:i18t('ag_'+k) }),'ok'); }
    catch(e){ toast((e&&e.message)||String(e),'err'); }
    if(typeof stRepaintRow==='function') try{ stRepaintRow('agents'); }catch(_){}
  });
}
/* The agents whose work Copilot does — the ones that spend within today's budget. */
const AG_MONEY_NOTE_KEYS=['round','renew','paper','import'];
function renderReviewGatePanel(){
  const host=document.getElementById('rv-gate-panel'); if(!host) return;
  const admin=isAdmin();
  const cfg=(window.reviewGateCfg?reviewGateCfg():{on:false,when:'deviation',value:0});
  const dis=admin?'':' disabled';
  const money=(window.jxCurrency?jxCurrency():'');
  host.innerHTML=`
    <label style="display:flex;gap:9px;align-items:flex-start;font-size:var(--t-meta);line-height:1.5;cursor:${admin?'pointer':'not-allowed'};margin-bottom:10px">
      <input id="rv-gate-on" type="checkbox"${cfg.on?' checked':''}${dis} style="margin-top:2px"/>
      <span style="font-weight:var(--w-strong);color:var(--color-text)">${i18t('rv_set_on')}</span>
    </label>
    <div id="rv-gate-more"${cfg.on?'':' hidden'}>
      ${''/* ---- WHO IS CHECKED IS PER PERSON ----
             The switch above is the MASTER: it decides whether any of this
             happens at all. Under it, each person carries their own flag, set
             on their row under People, and the absence of one means checked —
             which is what keeps a workspace that already had this on behaving
             exactly as it did. The unchecked are NAMED here rather than
             counted, because an admin acts on names. */}
      <p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:0 0 9px;line-height:1.5">${i18t('rv_set_per_person')}
        ${(()=>{ const off=(typeof reviewUncheckedPeople==='function')?reviewUncheckedPeople():[];
          return off.length
            ? `<span style="color:var(--st-amber-fg)">${esc(i18tn('rv_set_unchecked',off.length,{n:off.length,who:off.map(u=>u.name||u.email).join(', ')}))}</span>`
            : esc(i18t('rv_set_all_checked')); })()}</p>
      <label style="display:flex;gap:9px;align-items:flex-start;font-size:var(--t-meta);line-height:1.5;cursor:${admin?'pointer':'not-allowed'};margin-bottom:10px">
        <input id="rv-gate-newchecked" type="checkbox"${cfg.newChecked?' checked':''}${dis} style="margin-top:2px"/>
        <span style="font-weight:var(--w-strong);color:var(--color-text)">${i18t('rv_set_new_checked')}</span>
      </label>
      <label style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${i18t('rv_set_when')}</label>
      <select id="rv-gate-when"${dis} style="${window.RV_FLD||''}margin-bottom:9px">
        <option value="always"${cfg.when==='always'?' selected':''}>${i18t('rv_set_when_always')}</option>
        <option value="deviation"${cfg.when==='deviation'?' selected':''}>${i18t('rv_set_when_deviation')}</option>
        <option value="value"${cfg.when==='value'?' selected':''}>${i18t('rv_set_when_value')}</option>
      </select>
      <div id="rv-gate-valwrap"${cfg.when==='value'?'':' hidden'}>
        <label style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${i18t('rv_set_value')}${money?` (${money})`:''}</label>
        <input id="rv-gate-value" type="number" min="0" step="1000"${dis} value="${Number(cfg.value||0)}" style="${window.RV_FLD||''}"/>
      </div>
    </div>`;
  if(!admin) return;
  const write=()=>{
    const on=!!document.getElementById('rv-gate-on').checked;
    const when=document.getElementById('rv-gate-when')?.value||'deviation';
    const value=Number(document.getElementById('rv-gate-value')?.value||0);
    const nc=document.getElementById('rv-gate-newchecked');
    saveReviewGateCfg({on,when,value,newChecked:nc?!!nc.checked:undefined});
    toast(i18t('rv_set_saved'));
    renderReviewGatePanel();
  };
  document.getElementById('rv-gate-on')?.addEventListener('change',write);
  document.getElementById('rv-gate-when')?.addEventListener('change',write);
  document.getElementById('rv-gate-value')?.addEventListener('change',write);
  document.getElementById('rv-gate-newchecked')?.addEventListener('change',write);
}

/* ---- who may redline a negotiation (Admin) ----
   ONE control, written on change, for the reason the review gate's panel gives
   directly above: a rule that is armed only if you remember to press Save is a
   rule that is off when it matters. saveDeskCfg is the single writer
   (js/desk.js); this panel never touches state.settings itself.

   The paragraph under the switch is not decoration. Switching this on changes
   what colleagues can do on contracts they could work on yesterday, and an
   admin should be able to read exactly what happens without leaving the row. */
/* THE GATE IS A SETTING AND WRITES ON CHANGE — gates have no Save (the
   rulebook's own line). Three answers, safest first, so the default is the one
   the eye lands on. A non-admin is shown the state and cannot move it. */
function renderSignCheckGatePanel(){
  const host=document.getElementById('sc-gate-panel'); if(!host) return;
  const admin=isAdmin();
  const now=(window.signCheckGate?signCheckGate():'off');
  const row=k=>`<label style="display:flex;gap:9px;align-items:flex-start;font-size:var(--t-meta);line-height:1.5;margin-bottom:9px;cursor:${admin?'pointer':'not-allowed'}">
    <input type="radio" name="sc-gate" value="${k}"${now===k?' checked':''}${admin?'':' disabled'} style="margin-top:2px"/>
    <span><span style="font-weight:var(--w-strong);color:var(--color-text)">${i18t('sc_set_'+k)}</span>
    <span style="display:block;color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${i18t('sc_set_'+k+'_d')}</span></span>
  </label>`;
  host.innerHTML=(window.SIGN_CHECK_GATES||['off','advise','require']).map(row).join('');
  if(!admin) return;
  host.querySelectorAll('input[name="sc-gate"]').forEach(r=>r.addEventListener('change',()=>{
    if(!r.checked) return;
    state.settings=state.settings||{};
    state.settings.signCheckGate=r.value;
    if(window.saveSettings) saveSettings();
    toast(i18t('sc_set_saved'));
    renderSignCheckGatePanel();
  }));
}
/* The default answer to the upload's "who runs the signing?" — two radios,
   written on change. A non-admin is shown the state and cannot move it. */
function renderSignRouteDefaultPanel(){
  const host=document.getElementById('ho-route-panel'); if(!host) return;
  const admin=isAdmin();
  const now=(state.settings&&state.settings.signRouteDefault)==='outside'?'outside':'inside';
  const row=k=>`<label style="display:flex;gap:9px;align-items:flex-start;font-size:var(--t-meta);line-height:1.5;margin-bottom:9px;cursor:${admin?'pointer':'not-allowed'}">
    <input type="radio" name="ho-route" value="${k}"${now===k?' checked':''}${admin?'':' disabled'} style="margin-top:2px"/>
    <span><span style="font-weight:var(--w-strong);color:var(--color-text)">${i18t(k==='outside'?'ho_route_out':'ho_route_in')}</span>
    <span style="display:block;color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${i18t(k==='outside'?'ho_route_out_d':'ho_set_in_d')}</span></span>
  </label>`;
  host.innerHTML=['inside','outside'].map(row).join('');
  if(!admin) return;
  host.querySelectorAll('input[name="ho-route"]').forEach(r=>r.addEventListener('change',()=>{
    if(!r.checked) return;
    state.settings=state.settings||{};
    state.settings.signRouteDefault=r.value==='outside'?'outside':'inside';
    if(window.saveSettings) saveSettings();
    toast(i18t('ho_set_saved'),'ok');
    renderSignRouteDefaultPanel();
    if(typeof stRepaintRow==='function') stRepaintRow('signroute');
  }));
}
/* The switch, and nothing else: there is no number to tune here. How long a
   code lives and how many wrong guesses it takes are the server's, because
   they are what stops guessing rather than what an admin has an opinion
   about. */
function renderLinkCodePanel(){
  const host=document.getElementById('lc-rule-panel'); if(!host) return;
  const admin=isAdmin();
  const cfg=(window.linkCodeCfg?linkCodeCfg():{on:false});
  /* NO EMAIL, NO CODE (8 Oct 2026): a guest asked for a code nobody can mail
     them is locked out, so the switch does not go ON while email is not set
     up — greyed with its reason and the way to the mail settings. A rule
     already on may still be switched off. The server refuses it too. */
  const noMail=!!(window.emailOff&&emailOff());
  const blocked=noMail&&!cfg.on;
  host.innerHTML=`
    <label style="display:flex;gap:9px;align-items:flex-start;font-size:var(--t-meta);line-height:1.5;cursor:${admin&&!blocked?'pointer':'not-allowed'}">
      <input id="lc-rule-on" type="checkbox"${cfg.on?' checked':''}${admin&&!blocked?'':' disabled'} style="margin-top:2px"/>
      <span style="font-weight:var(--w-strong);color:var(--color-text)">${i18t('set_link_code')}</span>
    </label>${noMail?`<p id="lc-rule-why" class="st-note" style="margin:6px 0 0 24px">${esc(i18t(cfg.on?'set_link_code_no_mail_on':'set_link_code_no_mail'))}${
      admin&&window.openSettingsAt?` <button type="button" class="ui-link" id="lc-rule-mail">${esc(i18t('set_link_code_set_mail'))}</button>`:''}</p>`:''}`;
  if(!admin) return;
  host.querySelector('#lc-rule-mail')?.addEventListener('click',()=>{ try{ openSettingsAt('build','mail'); }catch(_){} });
  host.querySelector('#lc-rule-on')?.addEventListener('change',e=>{
    if(e.target.checked && window.emailOff && emailOff()){ e.target.checked=false; toast(i18t('set_link_code_no_mail'),'err'); return; }
    if(window.saveLinkCodeCfg) saveLinkCodeCfg({ on:!!e.target.checked });
    stRepaintRow('linkcode');
    if(window.toast) toast(i18t(e.target.checked?'set_link_code_on':'set_link_code_off'),'ok');
  });
}
function renderDeskRulePanel(){
  const host=document.getElementById('dk-rule-panel'); if(!host) return;
  const admin=isAdmin();
  const cfg=(window.deskCfg?deskCfg():{on:false});
  host.innerHTML=`
    <label style="display:flex;gap:9px;align-items:flex-start;font-size:var(--t-meta);line-height:1.5;cursor:${admin?'pointer':'not-allowed'}">
      <input id="dk-rule-on" type="checkbox"${cfg.on?' checked':''}${admin?'':' disabled'} style="margin-top:2px"/>
      <span style="font-weight:var(--w-strong);color:var(--color-text)">${i18t('dk_set_on')}</span>
    </label>
    <p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:var(--s-2) 0 0;line-height:1.6">${i18t('dk_set_detail')}</p>
    ${''/* ---- THE PRICE OF ONE DOOR OUT, AND IT IS SET HERE ----
           Independent of the switch above on purpose: a deal going quiet
           because the lead is on leave is worth knowing about whether or not
           the rule is enforced, and the flag is ours alone — the counterparty
           is never told we noticed. Too short and it becomes noise people learn
           to scroll past; too long and it fires after they have already
           chased. Five working days is the default. */}
    <div style="margin-top:var(--s-3);border-top:1px solid var(--color-divider);padding-top:11px">
      <label for="dk-stale" style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1)">${i18t('dk_set_stale')}</label>
      <input id="dk-stale" type="number" min="1" max="60" step="1"${admin?'':' disabled'}
        value="${Number(cfg.staleDays||5)}" style="${window.RV_FLD||''}max-width:120px"/>
    </div>`;
  if(!admin) return;
  const write=()=>{
    saveDeskCfg({on:!!document.getElementById('dk-rule-on').checked,
      staleDays:Number(document.getElementById('dk-stale')?.value||5)});
    toast(i18t('dk_set_saved'));
    renderDeskRulePanel();
  };
  document.getElementById('dk-rule-on')?.addEventListener('change',write);
  document.getElementById('dk-stale')?.addEventListener('change',write);
}

/* ---- E8-T3 active sessions ---- */
async function loadSessions(){
  const host=document.getElementById('sessions-list'); if(!host) return;
  try{
    const r=await api('sessions'); const rows=r.sessions||[];
    host.innerHTML=rows.length?`<div style="display:flex;flex-direction:column;gap:6px">${rows.map(s=>{
      const ua=(s.ua||'').replace(/</g,'&lt;'); /* The BROWSER NAMES are proper nouns and stay as they are; only the two
         generic words are the platform's own. */
      const dev=/mobile/i.test(ua)?i18t('set_dev_mobile'):/chrome/i.test(ua)?'Chrome':/firefox/i.test(ua)?'Firefox':/safari/i.test(ua)?'Safari':i18t('set_dev_browser');
      return `<div style="display:flex;align-items:center;gap:var(--s-2);border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:7px 10px">
        <span style="min-width:0"><span style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text)">${dev}${s.current?` <span style="font-size:var(--t-figure);font-family:var(--font-mono);color:var(--accent-ink-700)">${i18t('set_this_device')}</span>`:''}</span>
        <span style="display:block;font-size:var(--t-label);font-family:var(--font-mono);color:var(--color-neutral-500)">${s.ip||'—'} · ${i18t('set_last_seen',{when:s.lastSeen?fmtDT(s.lastSeen):'—'})}</span></span>
        ${s.current?'':`<button data-sess-revoke="${s.id}" type="button" class="ui-link ui-link-danger" style="margin-left:auto">${i18t('set_revoke')}</button>`}
      </div>`; }).join('')}</div>`:`<p style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_no_active_sessions')}</p>`;
    host.querySelectorAll('[data-sess-revoke]').forEach(b=>b.addEventListener('click',async()=>{
      try{ await api('sessions/'+b.getAttribute('data-sess-revoke'),'DELETE'); toast(i18t('set_t_session_revoked')); loadSessions(); }
      catch(e){ toast(e.message,'err'); }
    }));
  }catch(e){ host.innerHTML=`<p style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('set_could_not_load_sessions')}</p>`; }
}

/* Exported because a cross-module call that is never exported silently takes
   the else branch and nobody catches it — the lesson rlPaperFootHtml taught
   this codebase for a year. openMyAccount and openSettingsAt are the two doors
   the shell calls; SET_PANELS and the readers beside it are what the tests read. */
Object.assign(window,{stClashes,stArDue,stArLabel,stArCount,renderTeam,settingsPlace,settingsPlacePut,stAgentsPaint,ST_AGENT_KEYS,AG_MONEY_NOTE_KEYS,stRepaintPanel,renderMyAccountPage,briefCadenceOf,BRIEF_EVERY_VALUES,renderPrecedentPanel,precedentAdopt,stdOpenPreferred,renderStandardsDraft,stdOpenClauseId,stdSetOpenClause,stdStanceChipHtml,stdFallbackChipHtml,renderAllowancePanel,renderRateTable,renderClauseLibrary,openClauseEditor,
  renderPlaybookView,openPlaybookEditor,stdPositionOpen,pbRemoveType,pbResetPlaybook,stdRemoveClause,stdDraftSetOpen,
  renderApprovalRules,openApprovalRuleEditor,renderReviewGatePanel,renderDeskRulePanel,condLabel,loadSessions,
  stRulesRows,stPaintRules,stPaintSignFolders,
  openMyAccount,openSettingsAt,settingsGoTab,stUnfinishedCount,stPeopleWire,settingsTab,stLandTop,SET_PANELS,ST_TABS,SET_CLOSURES,ST_GROUPS,ST_ATTENTION_MAX,
  ST_FACES,stPushHtml,stPushPaint,stPushRefresh,ST_GOV_LADDER,stGovRungs,stGovNext,stYouItems,stYouHtml,stYouCardHtml,stYouSheetItems,ST_YOU_SHEET,stChipsSet,stNewLookSet,stOpensSet,stBriefSet,stMenuHits,stFind,stFindRows,stFindGo,stNeedsAll,settingsGoPage,stYouGo,stPrefSet,stAsksLoad,stAsksOpen,stAsksAnswered,stAskSeen,stAskFrom,stAskDirect,stAskOpenOn,stAdminsSaid,stDay,stJbAnswer,stJbAmount,stJbAsk,stJbAskJambo,stJbTalkNow,stJamboFocus,stSideSet,stSideFit,ST_SIDE_MIN,ST_BOARD_MIN,ST_SPLIT_KEY,ST_SPLIT,stSplitFit,
  stDrawerOpen,stDrawerClose,stDrawerRefuse,settingsPersonDrawer,settingsSavePerson,settingsRemoveMember,
  settingsWriteFolderAccess,settingsExportBackup,stGoLive,stLoadAiCfgOnce,stSampleContracts,stClearSamples,stRunIntegrity,
  stPersonMissing,stPersonSays,stPersonSumHtml,stAccountBodyHtml,parseDirectoryCsv,openFolderAccessEditor,settingsMirrorDirectory,
  stSigningSectionHtml,stSigningRead,stPaintLadder,stReviewSectionHtml,stReviewRead,stSignFolderHtml,stSignFolderRead,
  stOverseerSectionHtml,stOverseerRead,
  settingsMarketFactsHtml,settingsPaintShapeBoxes,settingsHeightsBefore,settingsHoldHeights,
  stKeyRemovable,stPaintKeyClear,aiKeyLooksRight});
/* ROUNDS 24, 25 AND 26 AS DRAWN (the gaps, 18 Oct 2026): the head's painter
   (PAGE_HEAD_PAINT reads it off window), a form in its row, the stream beside
   the list, Jambo's words for the page in front, your own copy and name and
   email, and the readings the checks ask */
Object.assign(window,{stLessonsLoad,stLessonsPaint,stLessonTeach,stLessonFine,stLessonForget,stLessonPlaces,stJbBoxAsk,stLandHasLinks,stJbTurnHtml,stJbLog,stJbPush,stJbConvo,stJbTalkRepaint,stTalkKey,stTalkShows,stJbTalkPaint,stJbTurnAdd,stTalkBack,stTalkReopen,stJbLandHtml,stJbMenuDoorHtml,stMenuCount,stJbSayLine,stPaintHead,stRowFormOpen,stRowFormClose,stNameForm,stEmailForm,stMyCopyDownload,stAskGeneral,stDevicesSaid,
  stSwPickSet,stSwPanelHtml,stSwRows,stJbFeedHtml,stJbFeedRepaint,stJbCompanyWords,stJbDataWords,stJbStreamsWords,stJbNeedPhrase,stSideFoldSet,
  stTrailLeftOut,stHouseFacts,stTrailPastHtml,stYouCardRepaint,stGovLadderHtml,stSheetCardHtml});

/* ═══ SETTINGS & RULES, THE NEW LOOK (round 7, as drawn; behind the admin's "Try the new look") ═══
   One list of sentences: each setting says its state, who may change it and what it gates. You first; the company
   for admins. A menu down the left lands on a row (or opens People & roles, Streams, the trail and Jambo's lessons
   as today); every Change opens the drawer that changes it today. The panel: Needs an admin (stNeedsAll), Ask an
   admin (a record), Jambo's lessons (the phrases nobody could place). Nothing here writes but the existing doors. */
function stnOn(){ return typeof window.newLookOn==='function' && newLookOn() && typeof insFits==='function' && insFits() && typeof insPaintPanel==='function'; }
function stnRow(id, label, value, sub, act){
  return `<div class="stn-row" id="stn-${id}" data-stn-row="${id}"><div class="stn-l">${esc(label)}</div><div class="stn-v"><div class="stn-val">${value}</div>${sub?`<div class="stn-sub">${esc(sub)}</div>`:''}</div><div class="stn-a">${act||''}</div></div>`;
}
const stnDoor=(attr,w)=>`<button type="button" class="ui-link stn-go" ${attr}>${esc(w)}</button>`;
function stnStateText(k){ const st=stStateOf(k); return st&&st.text?esc(stShortState(st.text)):''; }
function stnAgentsSaid(){
  const keys=(typeof AG_KEYS!=='undefined'&&Array.isArray(AG_KEYS))?AG_KEYS:[];
  if(!keys.length||typeof agLevelOf!=='function') return '';
  const by={}; keys.forEach(k=>{ let v='ask'; try{ v=agLevelOf(k)||'ask'; }catch(_){ v='ask'; } by[v]=(by[v]||0)+1; });
  const lv=Object.keys(by);
  if(lv.length===1) return i18t('stn_ag_all',{ n:keys.length, level:i18t('st_agents_lv_'+lv[0]) });
  return lv.map(v=>i18t('stn_ag_n',{ n:by[v], level:i18t('st_agents_lv_'+v) })).join(' · ');
}
function stnRatesSaid(){
  const rates=(state.settings&&state.settings.fxRates)||{}, codes=Object.keys(rates).sort();
  if(!codes.length) return { v:esc(i18t('stn_fx_none')), stale:false };
  const cur=(typeof jxCurrency==='function')?jxCurrency():'';
  const r=rates[codes[0]]||{};
  const v=i18t('stn_fx_line',{ code:codes[0], rate:Number(r.rate).toLocaleString(undefined,{ maximumFractionDigits:2, minimumFractionDigits:2 }), cur, day:r.at?stDay(r.at):'' })+(codes.length>1?' · '+i18tn('stn_fx_more',codes.length-1,{ n:codes.length-1 }):'');
  return { v:esc(v), at:r.at||'' };
}
function stnApprovalsOpen(){
  let n=0; (state.contracts||[]).forEach(c=>{ try{ const s=window.approvalState?approvalState(c):null; if(s&&s.required&&!s.ok&&c.status!=='Signed') n++; }catch(_){ /* not counted */ } });
  return n;
}
function stnYouHtml(){
  const u=(typeof currentUser==='function'&&currentUser())||{};
  const api=(typeof API_MODE==='function')&&API_MODE();
  const name=[u.name||u.email||'', u.title||u.jobTitle||''].filter(Boolean).join(' · ');
  const L=(typeof LANGUAGES!=='undefined'?LANGUAGES:[]), now=(typeof langId==='function')?langId():'';
  const langName=(L.find(l=>l.id===now)||{}).name||now;
  const seg=`<span class="st-yseg stn-seg" role="group" aria-label="${esc(i18t('st_you_lang'))}">${L.map(l=>`<button type="button" data-st-lang="${esc(l.id)}" aria-pressed="${l.id===now?'true':'false'}">${esc(l.name||l.id)}</button>`).join('')}</span>`;
  const ps=_stPush;
  const push=ps?esc(ps==='on'?i18t('stn_push_on'):(typeof pushStateSaid==='function'?pushStateSaid(ps):ps)):'';
  if(!ps) setTimeout(()=>{ if(typeof pushState==='function') pushState().then(st=>{ if(st!==_stPush){ _stPush=st; if(document.querySelector('.stn-page')) stnPaint(stIsAdmin()); } }).catch(()=>{}); },0);
  let out=`<h3 class="stn-h" id="stn-sec-you">${esc(i18t('stn_about_you'))}</h3>`
    +stnRow('name', i18t('st_you_name_row'), esc(name), '', stnDoor('data-st-panel="me:name"', i18t('st_you_change')))
    +stnRow('lang', i18t('st_you_lang'), esc(langName), i18t('stn_lang_sub'), seg);
  if(api) out+=stnRow('twostep', i18t('ts_title'), esc(u.twoStep?i18t('stn_ts_on'):i18t('stn_ts_off')), u.twoStep?i18t('stn_ts_on_sub'):i18t('stn_ts_off_sub'), stnDoor('data-st-panel="me:twostep"', i18t('st_you_change')));
  if(api) out+=stnRow('push', i18t('stn_push'), push||esc(i18t('push_checking')), i18t('stn_push_sub'), (ps==='on'||ps==='off')?stSwHtml('push',ps==='on',i18t('stn_push')):'');
  const ag=stnAgentsSaid();
  if(ag) out+=stnRow('agents', i18t('stn_agents'), esc(ag), i18t('stn_agents_sub'), stnDoor('data-st-view="jambo"', i18t('stn_open')));
  return out;
}
function stnCompanyHtml(){
  const ap=stnApprovalsOpen(), fx=stnRatesSaid();
  return `<h3 class="stn-h" id="stn-sec-co">${esc(i18t('stn_company'))}</h3>`
    +stnRow('approvals', SET_PANELS.approvals.title(), stnStateText('approvals'), ap?i18tn('stn_ap_open',ap,{ n:ap }):'', stnDoor('data-st-panel="approvals"', i18t('stn_add_rule')))
    +stnRow('review', i18t('stn_review'), stnStateText('review'), i18t('stn_review_sub'), stnDoor('data-st-panel="review"', i18t('st_you_change')))
    +stnRow('signcap', i18t('stn_signcap'), stnStateText('signcap'), i18t('stn_signcap_sub'), stnDoor('data-st-panel="signcap"', i18t('st_you_change')))
    +stnRow('linkcode', i18t('stn_linkcode'), stnStateText('linkcode'), i18t('stn_linkcode_sub'), stnDoor('data-st-panel="linkcode"', i18t('st_you_change')))
    +stnRow('rates', i18t('stn_rates'), fx.v, i18t('stn_rates_sub'), stnDoor('data-st-panel="company" data-st-focus="#st-fx-row"', i18t('stn_update')))
    +stnRow('mail', i18t('stn_mail'), stnStateText('mail'), '', stnDoor('data-st-panel="mail"', i18t('stn_health')));
}
function stnMenuHtml(admin){
  const go=(attr,w)=>`<button type="button" class="stn-mi" ${attr}>${esc(w)}</button>`;
  const api=(typeof API_MODE==='function')&&API_MODE();
  let h=`<div class="stn-mh">${esc(i18t('stn_m_you'))}</div>`+go('data-stn-to="name"',i18t('stn_about_you_m'))
    +(api?go('data-stn-to="twostep"',i18t('stn_m_signin'))+go('data-stn-to="push"',i18t('stn_push')):'')+go('data-stn-to="agents"',i18t('stn_agents'));
  if(admin) h+=`<div class="stn-mh">${esc(i18t('stn_m_company'))}</div>`+go('data-st-page="team"',i18t('stn_m_people'))+go('data-st-page="streams"',i18t('stn_m_streams'))
    +go('data-stn-to="approvals"',SET_PANELS.approvals.title())+go('data-stn-to="review"',i18t('stn_m_review'))+go('data-stn-to="signcap"',i18t('stn_m_signing'))
    +go('data-stn-to="rates"',i18t('stn_m_rates'))+go('data-stn-to="mail"',i18t('stn_m_mail'))+go('data-st-panel="lessons"',i18t('stn_m_lessons'))
    +(typeof stTrailOn==='function'&&stTrailOn()?go('data-st-panel="trail"',i18t('stn_m_trail')):'');
  return h;
}
const STN_NEED_KIND={ ask:'stn_nk_ask', backup:'stn_nk_rule', limits:'stn_nk_caps', invite:'stn_nk_people', access:'stn_nk_access' };
function stnPanelHtml(admin){
  const E=esc;
  const row=(l,v,src,attr)=>`<div class="pd2-ch-r${attr?' stn-pr':''}"${attr?` ${attr} role="button" tabindex="0"`:''}><span>${E(l)}</span><b>${E(v)}</b><i>${E(src||'')}</i></div>`;
  let h=`<div class="pd2-chosen cun-panel stn-panel"><p class="pd2-ch-head">${E(i18t('stn_p_head'))}</p>`;
  const needs=admin&&typeof stNeedsAll==='function'?stNeedsAll():[];
  if(needs.length){ h+=`<div class="pd2-ch-cap">${E(i18tn('stn_p_needs',needs.length,{ n:needs.length }))}</div><div class="pd2-ch-tbl">`
    +needs.slice(0,4).map(r=>{ const k=String(r.key||'').split(':')[0]; const lab=k==='panel'&&SET_PANELS[String(r.key).slice(6)]?SET_PANELS[String(r.key).slice(6)].title():i18t(STN_NEED_KIND[k]||'stn_nk_setting');
      const sub=r.sub||(r.subHtml?String(r.subHtml).replace(/<[^>]*>/g,''):'');
      const what=k==='panel'?(sub?stShortState(sub):r.text):r.text, more=k==='panel'?'':sub;
      return `<div class="pd2-ch-r stn-nd stn-pr" ${r.btn||''} role="button" tabindex="0"><span>${E(lab)}</span><b>${E(what)}${more?`<small>${E(more)}</small>`:''}</b><i></i></div>`; }).join('')+`</div>`; }
  h+=`<div class="pd2-ch-cap">${E(i18t('stn_p_ask'))}</div><p class="stn-pp">${E(i18t('stn_p_ask_s'))}</p><div class="pd2-ch-door"><button type="button" class="rfp-a" data-st-ask-head="">${E(i18t('st_ask_go'))}</button><span>${E(i18t('stn_p_ask_cost'))}</span></div>`;
  if(admin){
    const L=_stLessons; const rows=(L&&L.rows)||[];
    if(L===null&&typeof stLessonsLoad==='function'&&!stnPanelHtml._asked){ stnPanelHtml._asked=true; Promise.resolve(stLessonsLoad()).then(()=>{ if(document.querySelector('.stn-page')) stnPanelPaint(); }).catch(()=>{}); }
    if(rows.length){ const shown=rows.slice(0,3).map(r=>'“'+String(r.text||'')+'”').join(', ');
      h+=`<div class="pd2-ch-cap">${E(i18t('stn_p_lessons'))}</div><p class="stn-pp">${E(i18tn('stn_p_lessons_s',rows.length,{ n:rows.length, list:shown }))}</p><div class="pd2-ch-door"><button type="button" class="rfp-a" data-st-panel="lessons">${E(i18tn('stn_p_teach',Math.min(rows.length,3),{ n:Math.min(rows.length,3) }))}</button><span>${E(i18t('pd2_ch_free'))}</span></div>`; }
  }
  return h+`</div>`;
}
function stnPanelPaint(){
  if(!document.getElementById('ins-panel')) return;
  insPaintPanel({ seat:'team', jlWord:i18t('stn_title'), item:{ id:'settings' }, head:false, tabCount:0, body:stnPanelHtml(stIsAdmin()) });
}
function stnPaint(admin){
  const host=document.getElementById('content'); if(!host) return;
  host.innerHTML=`<div id="set-page" class="view-enter sap-page ap-page is-ins apn-page stn-page" data-st-face="you" data-ins-page="team" data-ins="1">
    <div class="ap-body is-ins"><section class="ap-card apn-card stn-card">
      <h2 class="ctf-h stn-title">${esc(i18t('stn_title'))}</h2>
      <div class="stn-cols"><nav class="stn-menu" aria-label="${esc(i18t('stn_title'))}">${stnMenuHtml(admin)}</nav>
      <div class="stn-main scroll-thin" id="stn-main">${stnYouHtml()}${admin?stnCompanyHtml():''}</div></div>
    </section><aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ins_panel_label'))}"></aside></div></div>`;
  stWireDrawerOnce();
  stnPanelPaint();
  if(_stAsks===null&&typeof stAsksLoad==='function') stAsksLoad();
  if(typeof insWatchWidth==='function') insWatchWidth();
  if(typeof setActiveNav==='function') setActiveNav('team');
}
if(typeof document!=='undefined' && !document._stnWired){ document._stnWired=true;
  document.addEventListener('click',e=>{
    const t=e.target&&e.target.closest?e.target:null; if(!t||!t.closest('.stn-page')) return;
    const to=t.closest('[data-stn-to]'); if(!to) return;
    const el=document.getElementById('stn-'+to.getAttribute('data-stn-to')); if(!el) return;
    if(typeof landOn==='function') landOn(el,{ block:'start', focus:false }); else try{ el.scrollIntoView({ block:'start' }); }catch(_){ /* nothing to scroll */ }
  });
}
Object.assign(window,{stnOn,stnPaint,stnPanelPaint,stnPanelHtml,stnYouHtml,stnCompanyHtml,stnAgentsSaid});
