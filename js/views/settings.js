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
  const fRow=f=>`<label style="display:flex;align-items:center;gap:9px;padding:7px 9px;border:1px solid var(--color-divider);border-radius:0;cursor:pointer;font-size:14px">
      <input type="checkbox" data-fa-folder="${f.id}" ${set.has(f.id)?'checked':''} style="width:15px;height:15px;accent-color:var(--color-accent);flex:none"/>
      <span style="width:9px;height:9px;border-radius:0;background:${f.color};flex:none"></span>
      <span style="flex:1;min-width:0">${esc(f.name)}</span></label>`;
  openModal(`<div class="p-6" style="max-width:460px">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('set_folder_access_for',{who:(u.name||u.email).replace(/</g,'&lt;')})}</h3>
    <p class="text-xs text-ink/60 mb-3">${i18t('set_grant_streams')}</p>
    <label style="display:flex;align-items:center;gap:9px;padding:9px;border:1px solid var(--color-divider);border-radius:0;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:10px">
      <input type="checkbox" id="fa-all" ${isAll?'checked':''} style="width:16px;height:16px;accent-color:var(--color-accent)"/> ${i18t('set_all_streams')}</label>
    <div id="fa-list" style="display:${isAll?'none':'grid'};grid-template-columns:1fr;gap:6px;max-height:300px;overflow:auto;margin-bottom:14px">${folders.map(fRow).join('')}</div>
    <div class="flex justify-end gap-2">
      <button id="fa-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
      <button id="fa-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('set_save_access')}</button></div>
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
  const bar=`<div style="height:6px;background:var(--color-neutral-200);border-radius:0;overflow:hidden;margin-top:5px">
    <div style="width:${pct}%;height:100%;background:${a.exhausted?'var(--st-ruby-fg)':pct>=80?'var(--st-amber-dot)':'var(--st-green-dot)'};transition:width .3s"></div></div>`;
  host.innerHTML=`<div>
    <span style="font-weight:600;color:${a.exhausted?'var(--st-ruby-fg)':'var(--st-green-fg)'}">${a.exhausted?'Used up':'Open'}</span>
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
  const inp='width:74px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:3px 6px;font:inherit;font-family:var(--font-mono);font-size:12px;text-align:right;outline:none';
  host.innerHTML=models.map(m=>`
    <div data-rate-model="${PB_ATTR(m)}" style="display:flex;align-items:center;gap:8px;padding:3px 2px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
      <span style="flex:1;min-width:0;font-size:12px;font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis${m==='default'?';color:var(--color-neutral-500);font-style:italic':''}">${PB_ESC(m)}</span>
      <label style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_rate_in')} <input data-rate="in" type="number" min="0" step="0.01" value="${Number(rates[m].in)}" style="${inp}"/></label>
      <label style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_rate_out')} <input data-rate="out" type="number" min="0" step="0.01" value="${Number(rates[m].out)}" style="${inp}"/></label>
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
const ST_CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:0;padding:16px';
const ST_H4='font-family:var(--font-mono);font-weight:600;font-size:15px;margin:0 0 6px;color:var(--color-text)';
const ST_INPUT='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:6px 9px;font:inherit;font-size:14px;color:inherit;outline:none';
const ST_MONO='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:5px 8px;font-family:var(--font-mono);font-size:12px;color:inherit;outline:none';
const ST_BTN='font-family:var(--font-mono);font-weight:600;font-size:14px;padding:6px 14px;background:var(--color-accent);color:#fff;border:1px solid var(--color-accent);border-radius:0;cursor:pointer;white-space:nowrap';
const ST_BTN_SM='font-family:var(--font-mono);font-weight:600;font-size:13px;padding:5px 12px;background:var(--color-accent);color:#fff;border:1px solid var(--color-accent);border-radius:0;cursor:pointer';
const ST_BTN2='display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-weight:600;font-size:13px;padding:5px 11px;background:var(--color-surface);color:var(--color-accent-800);border:1px solid var(--color-divider);border-radius:0;cursor:pointer';
const ST_BTN_DANGER='display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-weight:600;font-size:13px;padding:5px 11px;background:var(--color-surface);color:var(--st-ruby-dot);border:1px solid var(--st-ruby-line);border-radius:0;cursor:pointer';
const ST_TAG='display:inline-flex;align-items:center;font-size:12px;font-weight:600;letter-spacing:.04em;padding:3px 10px;border-radius:0;background:var(--color-accent-200);color:var(--color-accent-800)';
const ST_AV='width:24px;height:24px;border-radius:50%;background:var(--color-accent-200);color:var(--color-accent-800);display:inline-grid;place-items:center;font-size:10px;font-weight:700;flex:none;font-family:var(--font-mono)';
const stRoleTag=r=>{ const map={admin:['var(--st-steel-bg)','var(--st-steel-fg)'],legal:['var(--st-amber-bg)','var(--st-amber-fg)'],viewer:['var(--st-gray-bg)','var(--st-gray-fg)']};
  const [bg,fg]=map[r]||map.viewer;
  return `display:inline-flex;align-items:center;font-size:12px;font-weight:600;letter-spacing:.04em;padding:3px 10px;border-radius:0;background:${bg};color:${fg}`; };
const stLimitField=(id,label,sub,min)=>`<label style="display:block">
    <span style="display:block;font-size:12px;color:var(--color-neutral-600);line-height:1.4">${label}<br><span style="color:var(--color-neutral-400)">${sub}</span></span>
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
];

/* WHICH TAB IS UP is a working posture, not a setting: per sitting, in memory,
   and it starts on People. A stored tab would mean an admin who came here to
   change one thing last week lands somewhere unrelated today. */
const ST_TABS=['people','platform','build','you'];
let _stTab='people';
/* A door may ask for a specific panel — the go-live checklist's rows do, and so
   does the email banner's "Set it up". Consumed by the very next paint, exactly
   like the negotiation door's _rlDoorAsked. */
let _stWantPanel=null;
function settingsTab(){ return ST_TABS.includes(_stTab)?_stTab:'people'; }
function settingsGoTab(k){ if(!ST_TABS.includes(k)) return; _stTab=k; renderTeam(); }
/* THE ONE NAMED DOOR IN. Everything that wants to land somewhere specific on
   this page goes through it, so there is one place that knows the page is
   admin-only and one place that knows how a tab and a panel are asked for. */
function openSettingsAt(tab, panel){
  if(typeof isAdmin==='function' && !isAdmin()){ openMyAccount(); return; }
  if(ST_TABS.includes(tab)) _stTab=tab;
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
     through it is a navigation. The frame is asked twice for the reason setView
     asks twice — the rebuild's shorter intermediate paint clamps the scroll,
     and the value has to be put back once the new frame has its height. */
  const sc=(typeof document!=='undefined')&&document.getElementById('content-scroll');
  if(sc){ sc.scrollTop=0;
    if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ sc.scrollTop=0; }); }
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
  const scrim=document.createElement('div');
  scrim.id='st-scrim'; scrim.className='st-scrim'; scrim.setAttribute('hidden','');
  const el=document.createElement('aside');
  el.id='st-drawer'; el.className='st-drawer'; el.setAttribute('hidden','');
  el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.setAttribute('aria-labelledby','st-drawer-title');
  el.innerHTML=`<div class="st-dhead" id="st-dhead"></div>
    <div class="st-dbody" id="st-dbody"></div>
    <div class="st-dfoot" id="st-dfoot"></div>`;
  document.body.appendChild(scrim); document.body.appendChild(el);
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
    const row=t.closest('[data-st-panel]');
    if(row){ stDrawerOpen(row.getAttribute('data-st-panel')); return; }
    const tab=t.closest('[data-st-tab]');
    if(tab){ settingsGoTab(tab.getAttribute('data-st-tab')); return; }
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && _stOpen) stDrawerClose(); });
}
function stDrawerClose(){
  _stOpen=null;
  const d=document.getElementById('st-drawer'), s=document.getElementById('st-scrim');
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
  const el=stDrawerHost(), scrim=document.getElementById('st-scrim');
  const glyph=d.glyph||'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>';
  const head=(typeof reviewDialogHeadHtml==='function')
    ? reviewDialogHeadHtml(glyph, d.title, d.sub||'')
    : `<h2 class="rvd-title" id="st-drawer-title">${esc(d.title)}</h2>${d.sub?`<p class="rvd-sub">${esc(d.sub)}</p>`:''}`;
  document.getElementById('st-dhead').innerHTML=
    `${head}<button class="st-dx" data-st-dclose title="${esc(i18t('st_close_drawer'))}" aria-label="${esc(i18t('st_close_drawer'))}">✕</button>`;
  const ttl=el.querySelector('.rvd-title'); if(ttl && !ttl.id) ttl.id='st-drawer-title';
  document.getElementById('st-dbody').innerHTML=d.body||'';
  /* THE REFUSAL SITS IN THE FOOT, NOT AT THE TOP OF THE BODY, and that is a
     measured decision rather than a layout preference. Put above the fields it
     pushed everything under it down by 46px the moment it appeared and pulled
     it back up when it cleared — which is the exact fault the settings page was
     rebuilt to stop (settings-holds-still-verify). In the foot it is pinned, so
     it cannot be scrolled away from either, and the control the reader just
     pressed does not move under their hand. */
  document.getElementById('st-dfoot').innerHTML =
    `<div id="st-drawer-refusal" class="st-refusal" hidden></div>
     <div class="st-dfoot-acts">${d.foot==='save'
      ? `<button class="ui-btn" data-st-dclose>${i18t('act_cancel')}</button>
         <button class="ui-btn ui-btn-primary" id="st-dsave">${i18t('st_save_close')}</button>`
      : `<button class="ui-btn ui-btn-primary" data-st-dclose>${i18t('st_done')}</button>`}</div>`;
  el.removeAttribute('hidden'); if(scrim) scrim.removeAttribute('hidden');
  /* The class flip is what animates; it has to land on a frame after the
     element stops being hidden or the transition has nothing to run from. */
  const show=()=>{ el.classList.add('open'); if(scrim) scrim.classList.add('open'); };
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(show); else show();
  if(typeof d.wire==='function') d.wire();
  if(d.foot==='save' && typeof d.save==='function')
    document.getElementById('st-dsave')?.addEventListener('click',()=>d.save());
  try{ el.focus&&el.focus(); }catch(_){}
}
/* A REFUSAL IS SHOWN IN THE DRAWER, in words, beside the thing it refuses —
   never as a toast that appears over the page behind it and never silently. */
function stDrawerRefuse(msg){
  const r=document.getElementById('st-drawer-refusal');
  if(!r){ if(window.toast) toast(msg,'err'); return; }
  r.textContent=msg; r.removeAttribute('hidden');
}
function stDrawerClearRefusal(){ document.getElementById('st-drawer-refusal')?.setAttribute('hidden',''); }
function stDrawerOpen(key){
  if(key==='account'){ openMyAccount(); return; }
  if(String(key||'').indexOf('person:')===0){ settingsPersonDrawer(String(key).slice(7)); return; }
  const p=SET_PANELS[key]; if(!p) return;
  _stOpen=key;
  stDrawerPaint({ title:p.title(), sub:p.sub?p.sub():'', foot:p.foot||'done', glyph:p.glyph,
    body:p.body(), wire:p.wire, save:p.save });
}

/* ---------------- ROWS ----------------
   A row states what the setting IS right now. Status dot, name, one line of
   current state, whether it has to be answered, and a chip. */
const ST_DOT={ ok:'var(--st-green-dot)', warn:'var(--st-amber-dot)', off:'var(--color-neutral-400)' };
function stRowHtml(key){
  const p=SET_PANELS[key]; if(!p) return '';
  const st=p.state?p.state():{dot:'off',text:''};
  const chip=p.chip?p.chip():'';
  return `<button class="st-row" data-st-panel="${key}">
    <span class="st-dot" style="background:${ST_DOT[st.dot]||ST_DOT.off}"></span>
    <span class="st-row-main">
      <span class="st-row-name">${esc(p.title())}</span>
      <span class="st-row-state">${st.text||''}</span>
    </span>
    ${chip?`<span class="st-row-chip">${chip}</span>`:''}
    <span class="st-row-tag"${p.mandatory?' data-req="1"':''}>${p.mandatory?i18t('st_mandatory'):i18t('st_optional')}</span>
    <span class="st-row-go" aria-hidden="true">›</span>
  </button>`;
}
function stRowsHtml(tab){
  const keys=Object.keys(SET_PANELS).filter(k=>SET_PANELS[k].tab===tab && (!SET_PANELS[k].show || SET_PANELS[k].show()));
  return `<div class="st-rows">${keys.map(stRowHtml).join('')}</div>`;
}
/* ONE ROW, REPAINTED WHERE IT STANDS. A row states what the setting IS right
   now, so a panel that has just written something has to refresh the row behind
   the drawer — and it must not do that with renderTeam(), which rebuilds the
   whole screen and empties seven server-filled panels (THE SETTINGS PAGE HOLDS
   STILL). Nothing else on the page moves: the replacement is the same markup
   from the same builder, in the same box. */
function stRepaintRow(key){
  const el=document.querySelector(`.st-row[data-st-panel="${key}"]`);
  if(!el || !SET_PANELS[key]) return;
  const d=document.createElement('div'); d.innerHTML=stRowHtml(key);
  const next=d.firstElementChild; if(next) el.replaceWith(next);
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
  if(u.role==='admin') return { all:true, get text(){ return i18t('set_all_streams_short'); } };
  const v=(((state.settings||{}).folderAccess)||{})[u.id];
  if(v==null||v==='*'||(Array.isArray(v)&&!v.length))
    return { all:true, get text(){ return i18t('set_all_streams_short'); } };
  return { all:false, n:v.length, get text(){ return i18t('set_streams_of',{n:v.length,total:Object.keys(FOLDERS).length}); } };
}
/* Value visibility is a server-side right (users.can_view_values); admins
   always have it, and a member created before the permission existed defaults
   to having it, so this deploy changes nothing until an admin turns it off. */
const stValuesOn=u=>u.role==='admin'||u.canViewValues!==false;
/* WHAT IS MISSING, AS A LIST OF WORDS — the same list the drawer refuses with
   and the same list the chip counts. One reading, three readers. */
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
function stPeopleHtml(){
  const me=currentUser()||{};
  const users=getUsers()||[];
  const unfinished=users.filter(u=>stPersonMissing(u).length);
  const banner=unfinished.length?`
    <div class="st-banner" id="st-people-banner">
      <span class="st-banner-ic">${icon('alert','w-4 h-4')}</span>
      <span><b>${i18tn('st_unfinished',unfinished.length,{n:unfinished.length,who:esc(unfinished.map(u=>u.name||u.email).join(', '))})}</b>
      <span style="display:block;margin-top:2px">${i18t('st_unfinished_why')}</span></span>
    </div>`:'';
  const rows=users.map(u=>{
    const ini=(u.name||u.email||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const miss=stPersonMissing(u);
    const acc=stAccessOf(u);
    return `<button class="st-person" data-st-panel="person:${PB_ATTR(u.id)}">
      <span style="${ST_AV};width:30px;height:30px;font-size:12px">${esc(ini)}</span>
      <span class="st-person-main">
        <span class="st-person-name">${esc(u.name||u.email)}${u.id===me.id?` <span style="font-weight:400;color:var(--color-neutral-500);font-size:12px">${i18t('set_you')}</span>`:''}</span>
        <span class="st-person-sub">
          <span style="${stRoleTag(u.role)}">${esc(roleName(u.role))}</span>
          <span>${u.title?esc(u.title):`<span style="color:var(--st-amber-fg)">${i18t('set_no_job_title')}</span>`}</span>
          <span style="color:${acc.all?'var(--color-neutral-600)':'var(--st-amber-fg)'}">${esc(acc.text)}</span>
          ${''/* HOW MUCH THEY MAY SIGN FOR, on the row, because it is the fact
                 an admin comes to this list to check and it was invisible until
                 you opened somebody. signCapText is the ONE reading. */}
          <span data-st-cap="${PB_ATTR(u.id)}" style="color:${(typeof signCapOf==='function'&&!signCapOf(u).answered&&u.role!=='viewer'&&u.role!=='admin')?'var(--st-amber-fg)':'var(--color-neutral-600)'}">${esc((typeof signCapText==='function')?signCapText(u):'')}</span>
        </span>
      </span>
      <span class="st-chip" data-tone="${miss.length?'warn':'ok'}">${miss.length?i18tn('st_n_missing',miss.length,{n:miss.length}):i18t('st_complete')}</span>
      <span class="st-row-go" aria-hidden="true">›</span>
    </button>`;
  }).join('');
  return `${banner}
    <div class="st-people-head">
      <span class="st-people-count">${i18tn('st_people_count',users.length,{n:users.length})}</span>
      <button id="st-add-person" class="ui-btn ui-btn-primary" style="font-size:13px;padding:5px 12px" data-st-panel="person:new">${i18t('st_add_person')}</button>
    </div>
    <div class="st-people">${rows}</div>`;
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
    : `<label class="st-toggle" style="margin-bottom:8px">
         <input id="tm-cap-none" type="checkbox"${(cap.answered&&cap.limit==null)?' checked':''}/>
         <span><span class="st-role-name">${esc(i18t('sc_no_limit'))}</span></span></label>
       <label style="display:block">
         <span style="${window.RV_LBL||''}">${esc(i18t('sc_cap_label',{cur}))}</span>
         <input id="tm-cap" type="number" min="0" step="1000" value="${cap.limit==null?'':String(cap.limit)}"
           style="${window.RV_FLD||ST_INPUT}"${(cap.answered&&cap.limit==null)?' disabled':''}/>
         <span class="st-note">${esc(i18t('sc_cap_hint'))}</span></label>
       <p class="st-note" id="tm-cap-says" style="margin-top:8px">${esc(sentence)}</p>`;
  return `<section class="st-sec">
    <h3 class="st-sec-h"><span class="st-sec-n">4</span>${esc(i18t('sc_section'))}</h3>${body}</section>`;
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
    <div id="tm-sign-list" style="display:${all?'none':'grid'};grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-top:8px">
      ${folders.map(f=>`<label style="display:flex;align-items:center;gap:7px;padding:6px 8px;border:1px solid var(--color-divider);border-radius:0;cursor:pointer;font-size:13px">
        <input type="checkbox" data-tm-signfolder="${PB_ATTR(f.id)}"${set.has(f.id)?' checked':''} style="width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
        <span style="width:8px;height:8px;border-radius:0;background:${f.color};flex:none"></span>
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
  const checked=isNew ? ((typeof reviewGateCfg==='function')?reviewGateCfg().newChecked:true) : reviewChecked(u);
  const cand=((typeof getUsers==='function'?getUsers():[])||[])
    .filter(x=>x&&x.id!==u.id&&x.role!=='viewer');
  return `<section class="st-sec">
    <h3 class="st-sec-h"><span class="st-sec-n">5</span>${esc(i18t('rv_who_checks'))}</h3>
    ${on?'':`<p class="st-note" style="margin-bottom:8px">${esc(i18t('rv_person_gate_off'))}</p>`}
    <label class="st-toggle" style="margin-bottom:8px">
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
    <p class="st-note" id="tm-rv-says" style="margin-top:8px"></p>
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
   Hangs on the contract's OWNER, so it says nothing about contracts nobody
   raised — imported and uploaded paper keeps the ordinary rules, and the
   panel says so rather than leaving an admin to discover it. Never for a
   Viewer, who raises nothing. */
function stOverseerSectionHtml(u, isNew){
  if(typeof overseerCfg!=='function') return '';
  if(u.role==='viewer') return '';
  const on=overseerEnforced();
  const cand=((typeof getUsers==='function'?getUsers():[])||[])
    .filter(x=>x&&x.id!==u.id&&x.role!=='viewer');
  return `<section class="st-sec">
    <h3 class="st-sec-h"><span class="st-sec-n">6</span>${esc(i18t('ov_section'))}</h3>
    ${on?'':`<p class="st-note" style="margin-bottom:8px">${esc(i18t('ov_says_not_enforced'))}</p>`}
    <label style="display:block">
      <span style="${window.RV_LBL||''}">${esc(i18t('ov_person'))}</span>
      <select id="tm-overseer" style="${window.RV_FLD||ST_INPUT}">
        <option value="">${esc(i18t('ov_nobody'))}</option>
        ${cand.map(x=>`<option value="${PB_ATTR(x.id)}"${String(u.overseerId||'')===String(x.id)?' selected':''}>${esc(x.name||x.email)}</option>`).join('')}
      </select>
      <span class="st-note">${esc(i18t('ov_person_sub'))}</span></label>
    <p class="st-note" id="tm-ov-says" style="margin-top:8px"></p>
    <p class="st-note">${esc(i18t('ov_no_owner'))}</p>
  </section>`;
}
function stOverseerWire(u){
  const sel=document.getElementById('tm-overseer');
  const says=document.getElementById('tm-ov-says');
  if(!says) return;
  const who=(u&&u.name)||i18t('sc_this_person');
  const paint=()=>{
    const pick=sel&&sel.value
      ? ((typeof getUsers==='function'?getUsers():[])||[]).find(x=>String(x.id)===String(sel.value))
      : null;
    says.textContent=pick ? i18t('ov_says_on',{who,over:pick.name||pick.email})
                          : i18t('ov_says_off',{who});
  };
  sel?.addEventListener('change',paint);
  paint();
}
function stOverseerRead(){
  const sel=document.getElementById('tm-overseer');
  return sel ? (sel.value||null) : undefined;
}

/* ---- ONE DRAWER, WHETHER YOU ARE ADDING OR EDITING ----
   Adding re-houses the EXISTING creation flow exactly — temp password,
   mustChangePassword on the server, an explicit folder answer whose first
   option carries no value, Viewer by default, POST /api/users. There is no
   invite-token flow in this product and this drawer does not invent one. */
function settingsPersonDrawer(idOrNew){
  const isNew = idOrNew==='new';
  const me=currentUser()||{};
  const u = isNew ? { id:null, name:'', email:'', title:'', role:'viewer' }
                  : (getUsers()||[]).find(x=>x.id===idOrNew);
  if(!u) return;
  _stOpen='person:'+(isNew?'new':u.id);
  const isMe = !isNew && u.id===me.id;
  const acc = isNew ? null : stAccessOf(u);
  const set = new Set(!isNew && !acc.all ? (((state.settings||{}).folderAccess)||{})[u.id] : []);
  const folders=Object.values(FOLDERS);
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
    ${sec(1,i18t('st_sec_who'),
      fld('tm-name',i18t('st_f_name'),'','text',u.name)
      +fld('tm-email',i18t('st_f_email'),'','email',u.email)
      +fld('tm-title',i18t('st_f_title'),i18t('st_f_title_note'),'text',u.title)
      +(isNew?`<label style="display:block;margin-bottom:4px">
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
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
          <span class="st-note" style="flex:1;margin:0">${esc(u.twoStep?i18t('ts_person_on'):i18t('ts_person_off'))}</span>
          ${u.twoStep?`<button id="tm-clear-2fa" data-uid="${PB_ATTR(u.id)}" style="${ST_BTN_SM};flex:none">${esc(i18t('ts_clear_btn'))}</button>`:''}
        </div>`:''))}

    ${sec(2,i18t('st_sec_may'),`
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
      </label>`:''}`)}

    ${sec(3,i18t('st_sec_folders'),
      (u.role==='admin'&&!isNew)
      ? `<p class="st-note" id="tm-access-note">${esc(i18t('st_folders_all_locked'))}</p>`
      : `<select id="tm-access" style="${window.RV_FLD||ST_INPUT}">
          ${isNew?`<option value="">${esc(i18t('set_choose_access'))}</option>`:''}
          <option value="*"${(!isNew&&acc.all)?' selected':''}>${esc(i18t('st_folders_all'))}</option>
          <option value="pick"${(!isNew&&!acc.all)?' selected':''}>${esc(i18t('st_folders_pick'))}</option>
        </select>
        <div id="tm-access-list" style="display:${(!isNew&&!acc.all)?'grid':'none'};grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-top:8px">
          ${folders.map(f=>`<label style="display:flex;align-items:center;gap:7px;padding:6px 8px;border:1px solid var(--color-divider);border-radius:0;cursor:pointer;font-size:13px">
            <input type="checkbox" data-tm-folder="${PB_ATTR(f.id)}"${set.has(f.id)?' checked':''} style="width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
            <span style="width:8px;height:8px;border-radius:0;background:${f.color};flex:none"></span>
            <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</span></label>`).join('')}
        </div>
        <div id="tm-access-note" style="display:none" class="st-note">${esc(i18t('set_access_admin_note'))}</div>
        ${stSignFolderHtml(u, isNew, folders)}`)}

    ${stSigningSectionHtml(u, isNew)}

    ${stReviewSectionHtml(u, isNew)}

    ${stOverseerSectionHtml(u, isNew)}

    ${(!isNew && isAdmin() && !isMe)?`<div class="st-danger">
      <button id="tm-remove" style="${ST_BTN_DANGER}">${icon('ban','w-3.5 h-3.5')} ${i18t('act_remove')}</button>
    </div>`:''}`;

  stDrawerPaint({
    title: isNew?i18t('st_add_person'):(u.name||u.email),
    sub: isNew?i18t('st_tab_people_sub'):roleName(u.role),
    glyph:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
    foot:'save', body,
    wire(){
      const roleSel=document.getElementById('tm-role');
      const syncAccess=()=>{
        const accSel=document.getElementById('tm-access');
        const list=document.getElementById('tm-access-list'), note=document.getElementById('tm-access-note');
        if(!roleSel||!accSel) return;
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
      stSigningWire(u);
      stReviewWire(u);
      stOverseerWire(u);
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
  if(isNew && (getUsers()||[]).some(x=>(x.email||'').toLowerCase()===email)){ stDrawerRefuse(i18t('set_member_exists')); return; }

  /* Folder access is decided BEFORE the account exists. `null` means every
     stream — the same "no entry in the map" the editor writes — and it is
     reached only by picking it, never by saying nothing. */
  let folderIds=null, folderAnswered=true;
  const accSel=document.getElementById('tm-access');
  if(role!=='admin' && accSel && !accSel.disabled){
    const choice=accSel.value||'';
    if(!choice){ stDrawerRefuse(i18t('set_choose_access_err')); accSel.focus(); return; }
    if(choice==='pick'){
      folderIds=[...document.querySelectorAll('[data-tm-folder]')].filter(cb=>cb.checked).map(cb=>cb.getAttribute('data-tm-folder'));
      if(!folderIds.length){ stDrawerRefuse(i18t('set_pick_one_stream')); return; }
    }
  } else folderAnswered=(role==='admin');

  if(isNew){
    let newId=null;
    if(API_MODE()){
      try{ const r=await api('users','POST',{ name, email, role, title, password:pass });
        REMOTE.users=[...REMOTE.users, r.user]; newId=r.user&&r.user.id;
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
    if(ovr!==undefined) after.overseerId=ovr;
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
    settingsMirrorDirectory(name,email,title);
    toast(i18t('set_t_added_as',{name,role:roleName(role)})+(API_MODE()?i18t('set_t_invite_queued'):i18t('set_t_share_password')));
    stDrawerClose(); renderTeam(); return;
  }

  /* ---- EDITING ----
     A RENAME CAN ORPHAN AN APPROVAL RULE, because a named approver is bound by
     NAME and not by id. Said out loud before it happens, with the rules
     repointed for them rather than left pointing at nobody. */
  const us=getUsers(); const target=us.find(x=>x.id===existing.id); if(!target) return;
  const me=currentUser()||{};
  const renamed = name && name!==target.name;
  if(renamed){
    const bound=(typeof approvalRules==='function'?approvalRules():[]).filter(r=>r.approver&&r.approver.kind==='member'&&r.approver.name===target.name);
    if(bound.length){
      const ok=await confirmDialog({
        title:i18tn('st_rename_breaks_rule',bound.length,{n:bound.length,old:target.name}),
        message:i18t('st_rename_fix'),
        confirmLabel:i18t('st_rename_fix') });
      if(!ok) return;
      const all=approvalRules().slice();
      all.forEach(r=>{ if(r.approver&&r.approver.kind==='member'&&r.approver.name===target.name) r.approver={kind:'member',name}; });
      saveApprovalRules(all);
    }
  }
  const roleChanged = role!==target.role && existing.id!==me.id;
  const valuesBox=document.getElementById('tm-values');
  const valuesTo = valuesBox ? !!valuesBox.checked : null;
  const valuesChanged = valuesTo!==null && valuesTo!==stValuesOn(target);
  if(valuesChanged && valuesTo===false){
    const ok=await confirmDialog({ title:`Hide contract values from ${target.name}?`,
      message:'They will stop seeing amounts on the register, on a contract, in exports, in the dashboard metrics and in anything they ask the Copilot. They keep their folder access and everything else. You can turn this back on at any time.',
      confirmLabel:'Hide values' });
    if(!ok) return;
  }
  if(API_MODE()){
    const patch={};
    if(name!==target.name || title!==(target.title||'')) { patch.name=name; patch.title=title; }
    if(roleChanged) patch.role=role;
    if(valuesChanged) patch.canViewValues=valuesTo;
    const capNow=(typeof signCapOf==='function')?signCapOf(target):{answered:false,limit:null};
    const capWas=capNow.answered?(capNow.limit==null?'none':capNow.limit):null;
    if(cap!==undefined && cap!==capWas) patch.signCap=cap;
    if(rv&&rv.reviewChecked!==undefined && rv.reviewChecked!==reviewChecked(target)) patch.reviewChecked=rv.reviewChecked;
    if(rv&&rv.reviewerId!==undefined && String(rv.reviewerId||'')!==String(target.reviewerId||'')) patch.reviewerId=rv.reviewerId;
    if(ovr!==undefined && String(ovr||'')!==String(target.overseerId||'')) patch.overseerId=ovr;
    /* The server takes title (self or admin), role and canViewValues. It does
       NOT take a name today, so a rename is applied to the record we hold and
       the directory that feeds signer fields — said here rather than pretended
       about. */
    const body={};
    if(patch.title!==undefined) body.title=patch.title;
    if(patch.role!==undefined) body.role=patch.role;
    if(patch.canViewValues!==undefined) body.canViewValues=patch.canViewValues;
    if(patch.signCap!==undefined) body.signCap=patch.signCap;
    if(patch.reviewChecked!==undefined) body.reviewChecked=patch.reviewChecked;
    if(patch.reviewerId!==undefined) body.reviewerId=patch.reviewerId;
    if(patch.overseerId!==undefined) body.overseerId=patch.overseerId;
    if(Object.keys(body).length){
      try{ const r=await api('users/'+target.id,'PATCH',body); if(r&&r.user) Object.assign(target,r.user); }
      catch(e){ stDrawerRefuse(e.message); return; }
    }
    if(name) target.name=name; target.title=title;
    if(roleChanged) target.role=role;
    if(valuesChanged) target.canViewValues=valuesTo;
    if(patch.signCap!==undefined) target.signCap=patch.signCap;
    if(patch.reviewChecked!==undefined) target.reviewChecked=patch.reviewChecked;
    if(patch.reviewerId!==undefined) target.reviewerId=patch.reviewerId;
    if(patch.overseerId!==undefined) target.overseerId=patch.overseerId;
  } else {
    target.name=name||target.name; target.title=title; if(roleChanged) target.role=role;
    const capNow=(typeof signCapOf==='function')?signCapOf(target):{answered:false,limit:null};
    const capWas=capNow.answered?(capNow.limit==null?'none':capNow.limit):null;
    if(cap!==undefined && cap!==capWas) target.signCap=cap;
    if(rv&&rv.reviewChecked!==undefined) target.reviewChecked=rv.reviewChecked;
    if(rv&&rv.reviewerId!==undefined) target.reviewerId=rv.reviewerId;
    if(ovr!==undefined) target.overseerId=ovr;
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
  settingsMirrorDirectory(target.name,email||target.email,title);
  toast(i18t('st_person_saved',{who:target.name}));
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
  /* ---- SOMEBODY WHO OVERSEES OTHERS TAKES THAT STEP WITH THEM ----
     Said BEFORE the removal, beside the negotiation-lead warning and for the
     same reason: the approval step stays and names an account that no longer
     exists, and an admin needs to know to repoint it. It WARNS rather than
     refusing — an admin removing somebody who left on Friday must not be
     stuck. */
  let oversees='';
  const watched=((getUsers()||[]).filter(x=>x&&String(x.overseerId||'')===String(t.id)));
  if(watched.length) oversees=`\n\n${i18tn('ov_leaver',watched.length,{who:t.name,n:watched.length})}`;
  let leads='';
  if(window.deskLedBy){
    const led=deskLedBy(state.contracts||[],t.id);
    if(led.length) leads=`\n\n${i18t('dk_leaver_title',{who:t.name,n:led.length})} — `
      +led.slice(0,5).map(c=>c.name).join(', ')+(led.length>5?`, +${led.length-5}`:'')
      +`\n${i18t('dk_leaver_sub')}`;
  }
  if(!await confirmDialog({title:`Remove ${t.name}?`, message:`${t.name} will lose access to this workspace. You can re-invite them later.${oversees}${leads}`, confirmLabel:'Remove member', danger:true})) return;
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
function stAccountBodyHtml(){
  const u=currentUser()||{};
  const mayDesign=u.role==='admin'||u.role==='legal';
  return `
    <section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('st_acct_job'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('st_acct_job_sub'))}</p>
      <div style="display:flex;gap:8px;align-items:flex-end">
        <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${esc(i18t('st_f_title'))}</span>
          <input id="acct-title" type="text" value="${PB_ATTR(u.title||'')}" style="${window.RV_FLD||ST_INPUT}"/></label>
        <button id="acct-title-save" style="${ST_BTN_SM}">${i18t('act_save')}</button>
      </div>
      <p class="st-note">${esc(i18t('st_f_title_note'))}</p>
    </section>

    <section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('st_acct_sidebar'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${i18t('set_sidebar_sub')}</p>
      <label class="st-toggle">
        <input id="pref-nav-all" type="checkbox" ${(typeof navShowEverything==='function'&&navShowEverything())?'checked':''}/>
        <span><span class="st-role-name">${i18t('set_show_everything')}</span>
        <span class="st-note">${i18t('set_full_cockpit')}</span></span>
      </label>
    </section>

    ${API_MODE()?`
    <section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('st_acct_sessions'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${i18t('set_sessions_sub')}</p>
      <div id="sessions-list" style="font-size:13px;color:var(--color-neutral-700)">${i18t('set_loading')}</div>
    </section>

    ${''/* THE HONEST READ-ONLY STATEMENT STAYS. The checkboxes that used to be
           here were wired to nothing and were removed for that reason; what
           replaces them is the answer to the question somebody arrives with —
           "will HaTi email me about this contract?" — stated once, plainly.
           A dead switch is forbidden; this is what honest looks like. */}
    <section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('st_acct_email'))}</h3>
      <div class="st-quiet">
        <span style="font-weight:600;display:block;color:var(--color-text)">${i18t('set_still_emailed')}</span>
        ${i18t('set_three_events')}
      </div>
      ${''/* THE ONE LIVE CHOICE BESIDE THE HONEST STATEMENT (WO-3, widened
             19 Aug 2026 on the owner's ask). The brief is the single
             per-person email decision the server actually honours, and it now
             has THREE answers rather than a tick-box's two: every morning,
             once a week, or not at all. THREE OPTIONS, NOT THREE STATES —
             each says what it means and each is one press, which is the same
             rule the change column's own filter follows. Written on change,
             like every other setting in this drawer: a choice that only
             saves if you remember to press Save is a choice that is wrong
             when it matters. */}
      <div class="st-sec-lead" style="margin-top:12px;font-weight:600;font-size:14px;color:var(--color-text)">${i18t('set_brief_how_often')}</div>
      ${''/* THE GROUP NAME IS UNIQUE PER RENDERING, and that is not decoration:
             this section is drawn on the You tab AND again inside the drawer
             that opens over it, so a shared radio name would make the two
             copies fight — pressing one would silently clear the other's dot.
             The same fault the old tick-box had in its own way, with one id
             on two elements and the second one dead. */}
      ${(_briefGroup++, '')}${[['daily','set_brief_daily','set_brief_daily_sub'],
         ['weekly','set_brief_weekly','set_brief_weekly_sub'],
         ['off','set_brief_off','set_brief_off_sub']].map(([v,k,sub])=>`
        <label class="st-toggle" style="margin-top:8px">
          <input type="radio" name="pref-brief-every-${_briefGroup}" data-pref-brief="${v}"${briefCadenceOf(u)===v?' checked':''}/>
          <span><span class="st-role-name">${i18t(k)}</span>
          <span class="st-note">${i18t(sub)}</span></span>
        </label>`).join('')}
    </section>

    ${''/* TWO-STEP SIGN-IN (WO-6). Self-service both ways: enrolment holds
           the secret as pending until a first code proves the app has it, and
           turning it off costs a current code — an open session must not be
           able to quietly remove the lock it could not pick. The lost-phone
           RESCUE is the server's admin grant (PATCH clearTwoStep) — its
           People-page button is Phase 2 work, named in the gap-map order. */}
    <section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('ts_title'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('ts_sub'))}</p>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="st-quiet" style="flex:1">${u.twoStep?i18t('ts_on_line'):i18t('ts_off_line')}</span>
        <button id="ts-toggle" style="${ST_BTN2};flex:none">${u.twoStep?i18t('ts_turn_off'):i18t('ts_turn_on')}</button>
      </div>
    </section>`:''}

    <section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('st_acct_backup'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${API_MODE()?i18t('set_backup_server'):i18t('set_backup_local')}</p>
      <button id="bk-export" style="${ST_BTN2}">${icon('download','w-3.5 h-3.5')} ${i18t('set_export_backup')}</button>
    </section>

    ${mayDesign?`
    ${''/* AN EDITOR'S COMPANY-DESIGN DOOR CAME HERE RATHER THAN CLOSING.
           #brand-edit was gated admin-OR-legal on the old page, and the page is
           admin-only now, so an Editor would have lost it silently. It is a
           WORKSPACE setting sitting on a personal surface, which is unusual —
           so it says so on the row rather than pretending to be one of theirs. */}
    <section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('st_acct_design'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('st_acct_design_note'))}</p>
      <button id="brand-edit" style="${ST_BTN2}">${i18t('set_edit_design')}</button>
    </section>`:''}

    ${(u.role==='admin')?`
    <section class="st-sec">
      <h3 class="st-sec-h">${esc(i18t('st_acct_settings_door'))}</h3>
      <p class="st-note" style="margin-bottom:6px">${esc(i18t('st_acct_settings_sub'))}</p>
      <button id="acct-settings" style="${ST_BTN2}">${esc(i18t('st_acct_settings_door'))}</button>
    </section>`:''}

    ${''/* LANGUAGE KEEPS ITS ONE CONTROL AND ITS ONE WRITER. Drawing a second
           picker here would be a second writer for one fact; the row says where
           the control is instead. */}
    <p class="st-note">${esc(i18t('st_acct_lang_note'))}</p>`;
}
function stAccountWire(){
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
  document.getElementById('pref-nav-all')?.addEventListener('change',e=>{
    if(typeof navSetShowEverything==='function') navSetShowEverything(e.target.checked);
    toast(e.target.checked?i18t('set_sidebar_all_on'):i18t('set_sidebar_all_off'));
  });
  document.querySelectorAll('[data-pref-brief]').forEach(el=>el.addEventListener('change',async e=>{
    const v=e.target.getAttribute('data-pref-brief');
    const was=briefCadenceOf(currentUser());
    try{
      const r=await api('me/prefs','PUT',{ briefEvery:v });
      const u=currentUser(); if(u) u.prefs=(r&&r.prefs)||{ ...(u.prefs||{}), briefEvery:v };
      briefPaintCadence(v);          // every copy of the control says the same thing
      toast(i18t('set_brief_saved_'+v));
    }catch(err){
      /* THE SCREEN MUST NOT CLAIM A SAVE THAT FAILED — put the previous
         answer back rather than leaving the new one lit. */
      briefPaintCadence(was);
      toast(i18t('set_daily_brief_fail')+(err&&err.message||''),'err');
    }
  }));
  document.getElementById('ts-toggle')?.addEventListener('click',()=>stTwoStepToggle());
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
    return `<div style="display:flex;align-items:center;gap:9px;font-size:13px">
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
    openModal(`<div style="padding:20px 22px;max-width:470px">
      <h3 style="font-family:var(--font-heading);font-weight:600;font-size:17px;margin:0 0 6px">${i18t('st_hooks_secret_title')}</h3>
      <p class="st-note" style="margin:0 0 10px">${esc(i18t('st_hooks_secret_msg'))}</p>
      <div style="font-family:var(--font-mono);font-size:14px;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:0;padding:10px 12px;word-break:break-all;user-select:all">${esc(r.secret)}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <button id="wh-done" class="ui-btn ui-btn-primary" style="font-size:13px;padding:7px 14px">${i18t('ts_done')}</button>
      </div></div>`,{maxWidth:'490px'});
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
      ? `<p class="st-note" style="margin:0 0 8px;color:var(--st-amber-fg)">${
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
    return `<div style="display:flex;align-items:center;gap:10px;font-size:13px">
      <span style="font-family:var(--font-mono);font-weight:600;min-width:40px">${esc(code)}</span>
      <span style="flex:1;min-width:0">${esc(i18t('st_fx_line',{code,rate:Number(r.rate).toLocaleString(),cur:jxCurrency()}))}
        <span class="st-note" style="margin:0">${r.at?esc(i18t('st_fx_set_on',{date:r.at})):''}</span></span>
      <button data-fx-del="${esc(code)}" style="${ST_BTN_SM};flex:none">${i18t('st_fx_remove')}</button>
    </div>`;
  }).join('');
  host.querySelectorAll('[data-fx-del]').forEach(b=>b.addEventListener('click',()=>stFxSave(b.getAttribute('data-fx-del'),null)));
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
async function stTwoStepToggle(){
  const u=currentUser()||{};
  if(u.twoStep){
    const code=await promptDialog({ title:i18t('ts_off_title'), message:i18t('ts_off_msg'),
      placeholder:'123456', confirmLabel:i18t('ts_turn_off'), cancelLabel:i18t('act_cancel') });
    if(code==null) return;
    try{
      await api('me/totp/disable','POST',{ code:String(code).trim() });
      u.twoStep=false; toast(i18t('ts_off_done'),'ok'); openMyAccount();
    }catch(e){ toast((e&&e.message)||i18t('ts_failed'),'err'); }
    return;
  }
  let start;
  try{ start=await api('me/totp/start','POST',{}); }
  catch(e){ toast((e&&e.message)||i18t('ts_failed'),'err'); return; }
  openModal(`<div style="padding:22px;max-width:470px">
    <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;font-family:var(--font-heading)">${esc(i18t('ts_enrol_title'))}</h3>
    <p class="st-note" style="margin:0 0 4px">${esc(i18t('ts_enrol_msg'))}</p>
    <div style="font-family:var(--font-mono);font-size:15px;letter-spacing:.14em;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:0;padding:10px 12px;margin:8px 0;word-break:break-all;user-select:all">${esc(start.secret)}</div>
    <p class="st-note" style="margin:8px 0 4px">${esc(i18t('ts_enrol_code_msg'))}</p>
    <input id="ts-code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" style="${window.RV_FLD||ST_INPUT}"/>
    <p id="ts-err" class="st-note" style="color:var(--st-ruby-fg);min-height:16px;margin:6px 0 0"></p>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button id="ts-cancel" style="${ST_BTN2}">${i18t('act_cancel')}</button>
      <button id="ts-confirm" class="ui-btn ui-btn-primary" style="font-size:13px;padding:7px 14px">${i18t('ts_confirm')}</button>
    </div>
  </div>`,{maxWidth:'490px'});
  document.getElementById('ts-cancel')?.addEventListener('click',()=>closeModal());
  document.getElementById('ts-confirm')?.addEventListener('click',async()=>{
    const code=(document.getElementById('ts-code')?.value||'').trim();
    const errEl=document.getElementById('ts-err');
    try{
      const r=await api('me/totp/verify','POST',{ code });
      const u2=currentUser(); if(u2) u2.twoStep=true;
      closeModal();
      // the ten one-time codes, shown exactly ONCE — the server keeps hashes
      openModal(`<div style="padding:22px;max-width:470px">
        <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;font-family:var(--font-heading)">${esc(i18t('ts_recovery_title'))}</h3>
        <p class="st-note" style="margin:0 0 10px">${esc(i18t('ts_recovery_msg'))}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-family:var(--font-mono);font-size:14px;letter-spacing:.08em;user-select:all">
          ${(r.recovery||[]).map(cd=>`<span style="background:var(--color-bg);border:1px solid var(--color-divider);border-radius:0;padding:6px 10px;text-align:center">${esc(cd)}</span>`).join('')}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:14px">
          <button id="ts-done" class="ui-btn ui-btn-primary" style="font-size:13px;padding:7px 14px">${i18t('ts_done')}</button>
        </div>
      </div>`,{maxWidth:'490px'});
      document.getElementById('ts-done')?.addEventListener('click',()=>{ closeModal(); toast(i18t('ts_on_done'),'ok'); openMyAccount(); });
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

const SET_PANELS={

  /* ---- WHERE THE WORKSPACE OPERATES ----
     The market lived in the top bar as a pair of flag buttons — a workspace-
     level, admin-only setting sitting in the one strip a person's eye crosses a
     hundred times a day. The legal name and registration number are the design
     step's own fields (PUT /api/org/branding); they are STATED here and edited
     where they have always been edited, rather than given a second writer. */
  company:{
    tab:'platform', mandatory:true,
    title:()=>i18t('st_p_company'),
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
        <p class="st-note" style="margin-bottom:8px">${i18t('set_market_sub')}</p>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <select id="set-market" style="min-width:190px;${window.RV_FLD||ST_INPUT}width:auto">
            ${jxList().map(p=>`<option value="${p.id}"${p.id===jxId()?' selected':''}>${esc(p.name)}</option>`).join('')}
          </select>
          <div id="set-market-facts" style="font-size:12px;color:var(--color-neutral-600);line-height:1.6">${settingsMarketFactsHtml()}</div>
        </div>
      </section>
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
        <p class="st-note" style="margin-bottom:8px">${esc(i18t('st_company_legal_sub'))}</p>
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
        <p class="st-note" style="margin-bottom:8px">${esc(i18t('st_fx_sub',{cur:jxCurrency()}))}</p>
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
        <div id="st-fx-row" hidden style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-top:9px">
          <label style="flex:1 1 210px;min-width:180px"><span style="${window.RV_LBL||''}">${esc(i18t('st_fx_code'))}</span>
            ${''/* THE VALUE IS UPPERCASED, THE PROMPT IS NOT. text-transform
                   catches the placeholder too, so the search hint rendered as
                   "SEARCH — USD, EURO, RAND…" — a shout where a prompt was
                   meant, and wide enough to be clipped besides. The pseudo-
                   element rule that exempts it lives in index.html, because an
                   inline style cannot reach a ::placeholder. */}
            <input id="st-fx-code" type="text" list="st-fx-codes" autocomplete="off"
              placeholder="${esc(i18t('st_fx_code_ph'))}" style="${window.RV_FLD||ST_INPUT}text-transform:uppercase"/></label>
          <datalist id="st-fx-codes"></datalist>
          <label style="flex:1;min-width:150px"><span style="${window.RV_LBL||''}">${esc(i18t('st_fx_rate',{cur:jxCurrency()}))}</span>
            <input id="st-fx-rate" type="number" step="any" min="0" placeholder="129.50" style="${window.RV_FLD||ST_INPUT}"/></label>
          <button id="st-fx-save" style="${ST_BTN_SM};flex:none">${i18t('act_save')}</button>
        </div>
        <p class="st-note" style="margin-top:8px">${esc(i18t('st_fx_note'))}</p>
      </section>
      <section class="st-sec">
        <h3 class="st-sec-h">${esc(i18t('st_p_design'))}</h3>
        <p class="st-note" style="margin-bottom:8px">${esc(i18t('st_company_design_sub'))}</p>
        <button id="st-company-design" style="${ST_BTN2}">${i18t('st_company_design_btn')}</button>
      </section>`;
    },
    wire(){
      /* THE MARKET. jxSet writes the local key, the org record and the server.
         What it changes ON THIS PANEL is three lines under the dropdown; what it
         changes on the page behind is the approval rules (their thresholds are
         money) and the review gate (its box is labelled with the currency).
         Those, and nothing else — the page holds still. */
      document.getElementById('set-market')?.addEventListener('change',e=>{
        const langWas=(typeof langId==='function'?langId():null);
        if(!window.jxSet || !jxSet(e.target.value)) return;
        if(window.setRegion && window.regionCodeFor) setRegion(regionCodeFor(jxId()),{silent:true});
        /* THE ONE CASE THAT IS NOT A PATCH. A reader who has never chosen a
           language reads the one that goes with the market, so moving the
           market moves every word on the screen — patching three lines would
           leave a half-translated one. The page redraws (holding its panel
           heights) and the drawer is rebuilt in the new language on top of it. */
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
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_folders'),
    sub:()=>i18t('st_p_folders_sub'),
    state(){ const n=Object.keys(FOLDERS).length;
      return { dot:'ok', text:i18tn('st_p_folders_count',n,{n})+' · '+Object.values(FOLDERS).slice(0,3).map(f=>esc(f.name)).join(', ')+(n>3?'…':'') }; },
    body(){ return `<div id="st-folder-list"></div>
      <div style="display:flex;gap:8px;margin-top:10px;align-items:flex-end">
        <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${esc(i18t('st_p_folders_add'))}</span>
          <input id="st-folder-new" type="text" style="${window.RV_FLD||ST_INPUT}"/></label>
        <button id="st-folder-add" style="${ST_BTN_SM}">${i18t('set_add')}</button>
      </div>
      <p class="st-note" style="margin-top:10px">${esc(i18t('st_p_folders_body'))}</p>
      <!-- ---- WHERE A FOLDER YOU MAKE ACTUALLY LIVES ----
           A rename box and a delete button on this panel make the custom-folder
           list look like a company setting. It is not: addCustomFolder writes to
           this browser's own storage (saveCustomFolders → localStorage) and no
           colleague's browser ever learns of it. That is more confidence than
           the storage deserves, so the panel says so. No behaviour change — the
           smallest honest fix, until somebody actually needs one shared. -->
      <p class="st-note" style="margin-top:6px">${esc(i18t('st_p_folders_local'))}</p>`; },
    wire(){ stPaintFolders(); },
  },

  approvals:{
    tab:'platform', mandatory:true,
    title:()=>i18t('st_p_approvals'),
    sub:()=>i18t('st_p_approvals_sub'),
    state(){ const rules=(typeof approvalRules==='function'?approvalRules():[]).slice().sort((a,b)=>(a.order||99)-(b.order||99));
      return { dot:rules.length?'ok':'warn',
        text:rules.length?rules.map(r=>esc(condLabel(r.cond))).join(' · '):i18t('set_no_approval_rules') }; },
    chip(){ const n=(typeof approvalRules==='function'?approvalRules():[]).length; return n?String(n):''; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('set_rules_sub')}</p>
      <div id="approval-rules"></div>
      <button id="ar-add" style="margin-top:8px;${ST_BTN2}">${icon('plus','w-3.5 h-3.5')} ${i18t('set_add_rule_btn')}</button>
      ${''/* ---- THE OTHER HALF OF THE SAME QUESTION ----
             The rules above decide who must say YES before a contract is
             signed. This decides how much each person may sign FOR. They
             belong on one panel because an admin reading either one without
             the other has half the answer. WARN BEFORE ENFORCE: the switch is
             off by default and the ladder is a record until it is on. */}
      <div class="st-sec">
        <h3 class="st-sec-h">${esc(i18t('sc_rule_title'))}</h3>
        <label class="st-toggle" style="margin-bottom:8px">
          <input id="sc-rule-on" type="checkbox"${((typeof signCapEnforced==='function')&&signCapEnforced())?' checked':''}/>
          <span><span class="st-role-name">${esc(i18t('sc_rule_on'))}</span>
          <span class="st-note">${esc(i18t('sc_rule_sub'))}</span></span></label>
        <label class="st-toggle" style="margin-bottom:8px">
          <input id="ov-rule-on" type="checkbox"${((typeof overseerEnforced==='function')&&overseerEnforced())?' checked':''}/>
          <span><span class="st-role-name">${esc(i18t('ov_rule_on'))}</span>
          <span class="st-note">${esc(i18t('ov_rule_sub'))}</span></span></label>
        <label class="st-toggle" style="margin-bottom:8px">
          <input id="sf-rule-on" type="checkbox"${((typeof signFolderEnforced==='function')&&signFolderEnforced())?' checked':''}/>
          <span><span class="st-role-name">${esc(i18t('sf_rule_on'))}</span>
          <span class="st-note">${esc(i18t('sf_rule_sub'))}</span></span></label>
        <div style="font-size:12px;font-weight:600;color:var(--color-text);margin:10px 0 6px">${esc(i18t('sc_ladder'))}</div>
        <div id="sc-ladder"></div>
      </div>`; },
    wire(){
      renderApprovalRules();
      document.getElementById('ar-add')?.addEventListener('click',()=>openApprovalRuleEditor(-1));
      stPaintLadder();
      document.getElementById('sc-rule-on')?.addEventListener('change',e=>{
        if(typeof saveSignCapCfg!=='function') return;
        saveSignCapCfg({ on:e.target.checked });
        toast(i18t('sc_rule_saved'));
        /* The ladder's own sentences change with the switch (a limit that is
           recorded and a limit that refuses are different facts), so it
           repaints — the panel does not, and the page behind it does not. */
        stPaintLadder();
      });
      document.getElementById('ov-rule-on')?.addEventListener('change',e=>{
        if(typeof saveOverseerCfg!=='function') return;
        saveOverseerCfg({ on:e.target.checked });
        toast(i18t('ov_rule_saved'));
      });
      document.getElementById('sf-rule-on')?.addEventListener('change',e=>{
        if(typeof saveSignFolderCfg!=='function') return;
        saveSignFolderCfg({ on:e.target.checked });
        toast(i18t('sf_rule_saved'));
        stPaintLadder();
      });
    },
  },

  /* Availability only — a STATEMENT, not a switch, because there is no
     workspace on/off flag behind Copilot: it answers when there is a key and
     falls back to the built-in interpreter when there is not. A tick box wired
     to nothing is forbidden here, so the row says which of those is true and
     points at the one control that changes it. */
  copilot:{
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_copilot'),
    sub:()=>i18t('st_p_copilot_sub'),
    state(){ const on=(typeof copilotAvailable==='function')&&copilotAvailable();
      return { dot:on?'ok':'off', text:`${i18t('st_p_copilot_on')} — ${on?stOn():stOff()}` }; },
    body(){ const on=(typeof copilotAvailable==='function')&&copilotAvailable();
      return `<div class="st-quiet"><b>${i18t('st_p_copilot_on')} — ${on?stOn():stOff()}</b><br>${i18t('set_engine_sub')}</div>
        <p class="st-note" style="margin-top:9px">${esc(i18t('st_p_copilot_engine_note'))}</p>
        <button id="st-copilot-engine" style="margin-top:6px;${ST_BTN2}">${esc(i18t('st_b_engine'))}</button>`; },
    wire(){ document.getElementById('st-copilot-engine')?.addEventListener('click',()=>{ settingsGoTab('build'); stDrawerOpen('engine'); }); },
  },

  review:{
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_review'),
    sub:()=>i18t('rv_set_sub'),
    state(){ const c=(window.reviewGateCfg?reviewGateCfg():{on:false});
      return { dot:c.on?'ok':'off', text:`${i18t('rv_set_on')} — ${c.on?stOn():stOff()}` }; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('rv_set_sub')}</p><div id="rv-gate-panel"></div>`; },
    wire(){ renderReviewGatePanel(); },
  },

  desk:{
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_desk'),
    sub:()=>i18t('dk_set_sub'),
    state(){ const c=(window.deskCfg?deskCfg():{on:false});
      return { dot:c.on?'ok':'off', text:`${i18t('dk_set_on')} — ${c.on?stOn():stOff()}` }; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('dk_set_sub')}</p><div id="dk-rule-panel"></div>`; },
    wire(){ renderDeskRulePanel(); },
  },

  renewals:{
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_renewals'),
    sub:()=>i18t('set_renewal_sub'),
    state(){ return { dot:'ok', text:[90,60,30].map(d=>i18t('set_days_out',{n:d})).join(' · ') }; },
    body(){ return `<p class="st-note" style="margin-bottom:8px">${i18t('set_renewal_sub')}</p>
      <div style="display:flex;gap:6px">${[90,60,30].map(d=>`<span style="${ST_TAG}">${i18t('set_days_out',{n:d})}</span>`).join('')}</div>
      <p class="st-note" style="margin-top:8px">${i18t('set_delivered_resend')}</p>`; },
    wire(){},
  },

  workshape:{
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_workshape'),
    sub:()=>i18t('set_workshape_sub'),
    state(){ const cfg=(typeof wsCfg==='function')?wsCfg():{shapes:[],word:''};
      return { dot:cfg.shapes.length?'ok':'warn',
        text:cfg.shapes.map(s=>esc(i18t('set_shape_'+s))).join(' · ')+(cfg.word?` · ${esc(i18t('ww_'+cfg.word+'_title'))}`:'') }; },
    body(){
      if(typeof wsCfg!=='function') return `<p class="st-note">${i18t('set_workshape_admin_only')}</p>`;
      const cfg=wsCfg(), det=wsDetect();
      const box=(k,title,sub)=>`<label data-ws-box="${k}" style="display:flex;gap:9px;align-items:flex-start;padding:9px 11px;border:1px solid ${cfg.shapes.includes(k)?WS_BOX_ON.line:WS_BOX_OFF.line};border-radius:0;cursor:pointer;background:${cfg.shapes.includes(k)?WS_BOX_ON.fill:WS_BOX_OFF.fill};flex:1 1 240px;min-width:0">
        <input type="checkbox" data-ws-shape="${k}" ${cfg.shapes.includes(k)?'checked':''} style="margin-top:2px;flex:none"/>
        <span style="min-width:0"><span style="display:block;font-size:14px;font-weight:600">${title}</span>
        <span style="display:block;font-size:12px;color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${sub}</span></span></label>`;
      return `<p class="st-note" style="margin-bottom:10px">${i18t('set_workshape_sub')}</p>
      <div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:12px">
        ${box('standing',i18t('set_shape_standing'),i18t('set_shape_standing_sub'))}
        ${box('project',i18t('set_shape_project'),i18t('set_shape_project_sub'))}
      </div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <label style="display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600">${i18t('set_work_word')}
          <select id="set-work-word" style="min-width:150px;${window.RV_FLD||ST_INPUT}width:auto">
            ${WS_WORDS.map(w=>`<option value="${w}"${w===cfg.word?' selected':''}>${esc(i18t('ww_'+w+'_title'))}</option>`).join('')}
          </select></label>
        <span class="st-note">${i18t('set_work_word_sub')}</span>
      </div>
      <div class="st-quiet"><b>${i18t('set_workshape_detect')}.</b> ${det.total
        ? esc(i18t('set_workshape_seen',{p:det.project,s:det.standing,u:det.unknown}))
          +` <button id="ws-use-detected" style="border:0;background:none;padding:0;font:inherit;font-size:12px;font-weight:700;color:var(--color-accent-700);cursor:pointer;text-decoration:underline">${i18t('set_workshape_use')}</button>`
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
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_directory'),
    sub:()=>i18t('st_p_directory_sub'),
    state(){ const n=(((state.settings||{}).directory)||[]).length;
      return { dot:n?'ok':'off', text:n?i18tn('set_directory',n,{n}):i18t('st_p_directory_empty') }; },
    body(){ return `<p class="st-note" style="margin-bottom:8px">${i18t('set_bulk_signers')} <b>${i18t('set_csv_columns')}</b>.</p>
      <div id="st-dir-list"></div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <label style="${ST_BTN2};cursor:pointer">${icon('upload','w-3.5 h-3.5')} ${i18t('set_import_csv')}<input id="dir-import" type="file" accept=".csv,text/csv" style="display:none"/></label>
        <button id="dir-clear" style="${ST_BTN_DANGER}">${i18t('set_clear_directory')}</button>
      </div>`; },
    wire(){ stPaintDirectory(); },
  },

  design:{
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_design'),
    sub:()=>i18t('set_design_sub'),
    state(){ const ob=(typeof window!=='undefined'&&window.ORG_BRANDING)||null;
      const d=ob&&ob.designId&&window.docDesignById?docDesignById(ob.designId):null;
      return { dot:d?'ok':'off', text:d?esc(d.name):i18t('set_no_design') }; },
    body(){
      const ob=(typeof window!=='undefined'&&window.ORG_BRANDING)||null;
      const d=ob&&ob.designId&&window.docDesignById?docDesignById(ob.designId):null;
      return `<p class="st-note" style="margin-bottom:10px">${i18t('set_design_sub')}</p>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="width:74px;height:42px;border:1px dashed var(--color-divider);border-radius:0;display:grid;place-items:center;overflow:hidden;background:var(--color-bg);flex:none">
          ${ob&&ob.logoUrl?`<img src="${ob.logoUrl}" alt="logo" style="max-width:100%;max-height:100%">`:`<span style="font-size:10px;color:var(--color-neutral-500)">${i18t('set_no_logo')}</span>`}
        </div>
        <div style="flex:1;min-width:150px">
          ${d?`<div style="font-size:14px;font-weight:700">${esc(d.name)}</div>
            <div class="st-note">${i18t('set_logo_pos',{pos:esc({'top-left':i18t('set_pos_top_left'),'top-center':i18t('set_pos_top_center'),'top-right':i18t('set_pos_top_right'),footer:i18t('set_pos_footer')}[ob.logoPosition]||ob.logoPosition||'—')})}</div>`
          :`<div style="font-size:13px;color:var(--color-neutral-600)">${i18t('set_no_design')}</div>`}
        </div>
        <button id="brand-edit" style="${ST_BTN2}">${d?i18t('set_edit_design'):i18t('set_choose_design')}</button>
      </div>`;
    },
    wire(){ document.getElementById('brand-edit')?.addEventListener('click',()=>{
      stDrawerClose(); openDesignStep({ mode:'settings', onBack:()=>renderTeam() }); }); },
  },

  report:{
    tab:'platform', mandatory:false, show:stApiOnly,
    title:()=>i18t('st_p_report'),
    sub:()=>i18t('set_monthly_report_sub'),
    state(){ return { dot:'off', text:i18t('set_monthly_report_sub') }; },
    body(){ return `<p class="st-note" style="margin-bottom:8px">${i18t('set_monthly_report_sub')}</p>
      <div id="mr-status" style="font-size:12px;color:var(--color-neutral-700);margin-bottom:8px">${i18t('set_checking')}</div>
      <label class="st-toggle" style="margin-bottom:8px">
        <input id="mr-enabled" type="checkbox"/><span><span class="st-role-name">${i18t('set_monthly_report_on')}</span></span></label>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
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
    tab:'platform', mandatory:false, show:stApiOnly,
    title:()=>i18t('st_p_hooks'),
    sub:()=>i18t('st_hooks_sub'),
    state(){
      const n=(state.webhooks||[]).length;
      const bad=(state.webhooks||[]).filter(w=>w.lastOk===false).length;
      return { dot: n?(bad?'warn':'ok'):'off',
        text: n? i18tn('st_hooks_count',n,{n})+(bad?` · ${i18t('st_hooks_failing',{n:bad})}`:'') : i18t('st_hooks_none') };
    },
    body(){ return `<p class="st-note" style="margin-bottom:9px">${i18t('st_hooks_sub')}</p>
      <div id="wh-list" style="display:flex;flex-direction:column;gap:7px;margin-bottom:10px"></div>
      <label style="display:block;margin-bottom:8px"><span style="${window.RV_LBL||''}">${esc(i18t('st_hooks_url'))}</span>
        <input id="wh-url" type="url" placeholder="https://example.com/hooks/hati" style="${window.RV_FLD||ST_INPUT}"/></label>
      ${''/* AN ENDPOINT IS TOLD WHAT IT SUBSCRIBED TO. The server treats an
             empty list as NOTHING (fail closed), so this list is not a
             convenience — it is the subscription, and every box starts
             ticked because that is what somebody adding an address means. */}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:5px;margin-bottom:9px">
        ${(state.webhookEvents||['contract.signed','round.received','obligation.due','intake.requested']).map(ev=>
          `<label style="display:flex;align-items:center;gap:7px;font-size:13px">
            <input type="checkbox" data-wh-ev="${esc(ev)}" checked style="width:14px;height:14px;accent-color:var(--color-accent)"/>
            <span style="font-family:var(--font-mono);font-size:12px">${esc(ev)}</span></label>`).join('')}
      </div>
      <div style="display:flex;justify-content:flex-end">
        <button id="wh-add" style="${ST_BTN_SM}">${i18t('st_hooks_add')}</button>
      </div>
      <p class="st-note" style="margin-top:9px">${i18t('st_hooks_note')}</p>`; },
    wire(){ stHooksLoad(); document.getElementById('wh-add')?.addEventListener('click',()=>stHooksAdd()); },
  },

  backup:{
    tab:'platform', mandatory:false,
    title:()=>i18t('st_p_backup'),
    sub:()=>API_MODE()?i18t('set_backup_server'):i18t('set_backup_local'),
    state(){ const at=stLastBackup(); return { dot:at?'ok':'off', text:at?`${i18t('set_export_backup')} · ${fmtDT(at)}`:i18t('st_not_set') }; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${API_MODE()?i18t('set_backup_server'):i18t('set_backup_local')}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button id="bk-export" style="${ST_BTN2}">${icon('download','w-3.5 h-3.5')} ${i18t('set_export_backup')}</button>
        ${API_MODE()?`<a id="bk-zip" href="api/export/workspace.zip" style="${ST_BTN2};text-decoration:none">${icon('download','w-3.5 h-3.5')} ${i18t('set_full_workspace_zip')}</a>`:`
        <label style="${ST_BTN2};cursor:pointer">${icon('upload','w-3.5 h-3.5')} ${i18t('set_restore_backup')}<input id="bk-import" type="file" accept=".json,application/json" style="display:none"/></label>`}
      </div>
      ${!API_MODE()?`<div class="st-danger"><button id="bk-reset" style="${ST_BTN_DANGER}">${icon('ban','w-3.5 h-3.5')} ${i18t('set_reset_workspace')}</button></div>`:''}`; },
    wire(){ stWireBackup(); },
  },

  /* ============================================================
     TAB 3 — BUILD & LAUNCH
     ============================================================ */
  golive:{
    tab:'build', mandatory:true,
    title:()=>i18t('st_b_golive'),
    sub:()=>i18t('st_b_golive_sub'),
    state(){ const l=stGoLive(); const done=l.filter(r=>r.ok).length;
      return { dot: done===l.length?'ok':'warn',
        text: done===l.length ? i18t('st_b_golive_done',{n:done,n2:l.length})
          : i18tn('st_b_golive_left', l.length-done, {n:done,n2:l.length,left:l.length-done}) }; },
    chip(){ const l=stGoLive(); return `${l.filter(r=>r.ok).length}/${l.length}`; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('st_b_golive_sub')}</p>
      <div class="st-rows" id="st-golive">${stGoLive().map(r=>`
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
    tab:'build', mandatory:false,
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
    tab:'build', mandatory:true, show:stApiOnly,
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
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('set_email_sub')}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <button id="rem-run" style="${ST_BTN2}">${icon('clock','w-3.5 h-3.5')} ${i18t('set_check_renewals')}</button>
        <button id="ob-refresh" style="${ST_BTN2}">${icon('history','w-3.5 h-3.5')} ${i18t('set_refresh_outbox')}</button>
      </div>
      <div id="outbox-list" style="font-size:13px;color:var(--color-neutral-700)">${i18t('set_loading_outbox')}</div>`; },
    wire(){ stWireOutbox(); },
  },

  pilot:{
    tab:'build', mandatory:false, show:stApiOnly,
    title:()=>i18t('st_b_pilot'),
    sub:()=>i18t('set_activation_sub'),
    state(){ return { dot:'off', text:i18t('set_activation_sub') }; },
    body(){ return `<p class="st-note" style="margin-bottom:10px">${i18t('set_activation_sub')}</p>
      <div id="activation-funnel" style="font-size:13px;color:var(--color-neutral-700)">${i18t('set_loading')}</div>`; },
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
    tab:'build', mandatory:false,
    title:()=>i18t('set_demo_samples'),
    sub:()=>i18t('set_demo_samples_sub'),
    state(){ const n=stSampleContracts().length;
      return { dot:n?'warn':'ok', text:n?i18tn('set_demo_still_here',n,{n}):i18t('set_demo_cleared') }; },
    chip(){ const n=stSampleContracts().length; return n?String(n):''; },
    body(){ const s=stSampleContracts();
      return `<p class="st-note" style="margin-bottom:10px">${i18t('set_demo_samples_sub')}</p>
      ${s.length?`<div class="st-quiet"><b>${i18tn('set_demo_still_here',s.length,{n:s.length})}</b><br>
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
    tab:'build', mandatory:false,
    title:()=>i18t('set_integrity_title'),
    sub:()=>i18t('set_integrity_sub'),
    state(){ const r=_stIntegrity;
      return { dot: r? (r.faults? 'warn':'ok') : 'off',
        text: r? i18t('set_integrity_result',{checked:r.checked,clean:r.clean,faults:r.faults}) : i18t('set_integrity_never') }; },
    body(){ return `<p class="st-note" style="margin-bottom:8px">${i18t('set_integrity_sub')}</p>
      ${(typeof sha256IsReal==='function'&&!sha256IsReal())?`<div class="st-refusal" style="display:block">${i18t('set_integrity_weak')}</div>`:''}
      <div id="st-integrity-out" class="st-quiet">${_stIntegrity?stIntegrityHtml(_stIntegrity):i18t('set_integrity_never')}</div>
      <button id="st-integrity-run" style="margin-top:10px;${ST_BTN_SM}">${i18t('set_integrity_run')}</button>`; },
    wire(){ document.getElementById('st-integrity-run')?.addEventListener('click',()=>stRunIntegrity()); },
  },

  env:{
    tab:'build', mandatory:false,
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
  host.innerHTML=Object.values(FOLDERS).map(f=>{
    const n=(state.contracts||[]).filter(c=>c.folder===f.id).length;
    return `<div class="st-frow" data-st-folder="${PB_ATTR(f.id)}">
      <span class="st-fdot" style="background:${f.color}"></span>
      ${f.custom?`<input class="st-fname" data-st-frename="${PB_ATTR(f.id)}" value="${PB_ATTR(f.name)}"/>`
                :`<span class="st-fname" data-st-fixed="1">${esc(f.name)}</span>`}
      <span class="st-fmeta">${i18tn('st_p_folders_count',n,{n})} · ${i18t('st_p_folders_seen',{n:seers(f.id),total:users.length})}</span>
      ${f.custom?`<button class="st-fdel" data-st-fdel="${PB_ATTR(f.id)}" title="${esc(i18t('act_remove'))}">✕</button>`
                :`<span class="st-fmeta" style="opacity:.7">${esc(i18t('st_p_folders_builtin'))}</span>`}
    </div>`;
  }).join('');
  host.querySelectorAll('[data-st-frename]').forEach(inp=>inp.addEventListener('change',()=>{
    const id=inp.getAttribute('data-st-frename'), name=inp.value.trim();
    if(!name || !FOLDERS[id]) { stPaintFolders(); return; }
    FOLDERS[id].name=name; if(typeof saveCustomFolders==='function') saveCustomFolders();
    toast(i18t('st_p_folders_renamed',{name})); stPaintFolders();
  }));
  host.querySelectorAll('[data-st-fdel]').forEach(b=>b.addEventListener('click',async()=>{
    const id=b.getAttribute('data-st-fdel'), f=FOLDERS[id]; if(!f) return;
    const n=(state.contracts||[]).filter(c=>c.folder===id).length;
    if(n){ stDrawerRefuse(i18t('st_p_folders_holds',{n:i18tn('st_p_folders_count',n,{n})})); return; }
    if(!await confirmDialog({ title:`${i18t('act_remove')} — ${f.name}`, message:i18t('st_p_folders_body'), confirmLabel:i18t('act_remove'), danger:true })) return;
    delete FOLDERS[id]; if(typeof saveCustomFolders==='function') saveCustomFolders();
    stDrawerClearRefusal(); toast(i18t('st_p_folders_removed',{name:f.name})); stPaintFolders();
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
    if(!await confirmDialog({title:'Clear the directory?', message:'Removes all imported contacts. Team members are not affected.', confirmLabel:'Clear directory', danger:true})) return;
    state.settings=state.settings||{}; state.settings.directory=[]; await saveSettings();
    toast(i18t('set_t_dir_cleared')); stPaintDirectory();
  });
}

function stWireBackup(){
  document.getElementById('bk-export')?.addEventListener('click',()=>settingsExportBackup());
  document.getElementById('bk-import')?.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=async()=>{ let b;
      try{ b=JSON.parse(rd.result); if(b.kind!=='hati-backup'||!b.org||!b.users) throw new Error('bad'); }
      catch(err){ stDrawerRefuse(i18t('set_t_bad_backup')); return; }
      if(!await confirmDialog({title:'Restore from backup?', message:'Restoring replaces this workspace, its users and contracts with the backup. The current data will be overwritten.', confirmLabel:'Restore backup', danger:true})) return;
      lsSet(LS.org,b.org); saveUsers(b.users); if(b.data) lsSet(LS.data,b.data);
      localStorage.removeItem(LS.session); location.reload();
    };
    rd.readAsText(f);
  });
  document.getElementById('bk-reset')?.addEventListener('click',async()=>{
    if(await confirmDialog({title:'Erase this workspace?', message:'This permanently erases the workspace, all users and contracts stored in this browser. This cannot be undone.', confirmLabel:'Erase everything', danger:true})){
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
  if(out) out.innerHTML=i18t('set_integrity_running');
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
function stEngineBodyHtml(){
  if(!API_MODE()){
    return `<div id="ai-cfg-status" style="font-size:12px;color:var(--color-neutral-700);margin-bottom:8px">${i18t('set_checking')}</div>
      <div style="display:flex;gap:8px;align-items:flex-end">
        <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${i18t('set_api_key')}</span>
          <input id="ai-key" type="password" placeholder="sk-ant-…" style="${window.RV_FLD||ST_INPUT}"/></label>
        <button id="ai-key-save" style="${ST_BTN}">${i18t('set_save_key')}</button>
      </div>
      <button id="ai-key-clear" style="margin-top:6px;font-size:12px;font-weight:600;color:var(--st-ruby-dot);background:none;border:0;cursor:pointer;padding:0">${i18t('set_remove_key')}</button>
      <p class="st-note" style="margin-top:12px">${i18t('set_local_mode_note')}</p>`;
  }
  return `
    <div id="ai-cfg-status" style="font-size:12px;color:var(--color-neutral-700);margin-bottom:8px">${i18t('set_checking')}</div>
    <div style="display:flex;gap:8px;align-items:flex-end">
      <label style="flex:1;min-width:0"><span style="${window.RV_LBL||''}">${i18t('set_api_key')}</span>
        <input id="ai-key" type="password" placeholder="sk-ant-…" style="${window.RV_FLD||ST_INPUT}"/></label>
      <button id="ai-key-save" style="${ST_BTN}">${i18t('set_save_key')}</button>
    </div>
    <button id="ai-key-clear" style="margin-top:6px;font-size:12px;font-weight:600;color:var(--st-ruby-dot);background:none;border:0;cursor:pointer;padding:0">${i18t('set_remove_key')}</button>

    <div class="st-sec">
      <div style="font-size:13px;font-weight:600;color:var(--color-text)">${i18t('set_model_routing')}</div>
      <p class="st-note">${i18t('set_override_blank')}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:6px">
        <div style="border:1px solid var(--color-divider);border-radius:0;padding:8px">
          <div style="font-size:12px;font-weight:600;color:var(--color-text)">${i18t('set_fast_tier')}</div>
          <div style="font-size:12px;color:var(--color-neutral-500);margin:2px 0 4px">${i18t('set_fast_sub')}</div>
          <div style="font-size:12px;color:var(--color-neutral-700);margin-bottom:4px">${i18t('set_current')} <span id="ai-model-fast-cur" style="font-family:var(--font-mono)">—</span></div>
          <input id="ai-model-fast" type="text" placeholder="${esc(i18t('set_ph_default_rec'))}" style="${ST_MONO}"/>
        </div>
        <div style="border:1px solid var(--color-divider);border-radius:0;padding:8px">
          <div style="font-size:12px;font-weight:600;color:var(--color-text)">${i18t('set_deep_tier')}</div>
          <div style="font-size:12px;color:var(--color-neutral-500);margin:2px 0 4px">${i18t('set_deep_sub')}</div>
          <div style="font-size:12px;color:var(--color-neutral-700);margin-bottom:4px">${i18t('set_current')} <span id="ai-model-deep-cur" style="font-family:var(--font-mono)">—</span></div>
          <input id="ai-model-deep" type="text" placeholder="${esc(i18t('set_ph_default_rec'))}" style="${ST_MONO}"/>
        </div>
      </div>
      <details style="font-size:12px;margin-top:8px">
        <summary style="cursor:pointer;color:var(--color-neutral-600)">${i18t('set_advanced_override')}</summary>
        <div style="margin-top:6px;display:flex;flex-wrap:wrap;align-items:center;gap:8px">
          <input id="ai-model-global" type="text" placeholder="${esc(i18t('set_ph_none'))}" style="${ST_MONO};width:220px"/>
          <span style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_forces_one_model')}</span>
        </div>
      </details>
      <button id="ai-model-save" style="margin-top:8px;${ST_BTN_SM}">${i18t('set_save_model')}</button>
    </div>

    <div class="st-sec">
      <div style="font-size:13px;font-weight:600;color:var(--color-text)">${i18t('set_spend_controls')}</div>
      <p class="st-note">${i18t('set_spend_governed')} ${i18t('set_spend_money')}</p>
      <div id="ai-usage" style="font-size:13px;color:var(--color-neutral-700);margin:6px 0 4px">${i18t('set_today_dash')}</div>
      <div style="height:6px;background:var(--color-neutral-200);border-radius:0;overflow:hidden;margin-bottom:8px"><div id="ai-usage-bar" style="width:0%;height:100%;background:var(--color-accent);transition:width .3s"></div></div>
      <div id="ai-spend-breakdown" style="margin-bottom:10px"></div>
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
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
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
      </div>
      <label style="display:flex;align-items:flex-start;gap:8px;margin-top:9px;font-size:12px;color:var(--color-neutral-700);line-height:1.45;cursor:pointer">
        <input id="ai-thorough" type="checkbox" style="margin-top:2px;width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
        <span><b>${i18t('set_thorough_extraction')}</b> ${i18t('set_thorough_body')}
        <span style="color:var(--st-amber-fg)">${i18t('set_thorough_warn')}</span> ${i18t('set_preflight')}</span></label>
      <button id="ai-limits-save" style="margin-top:9px;${ST_BTN_SM}">${i18t('set_save_limits')}</button>
    </div>

    <div class="st-sec">
      <div style="font-size:13px;font-weight:600;color:var(--color-text)">${i18t('set_onboarding_allowance')}</div>
      <p class="st-note">${i18t('set_allowance_sub')}</p>
      <div id="ai-allowance-state" style="font-size:13px;color:var(--color-neutral-700);margin:6px 0">—</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
        ${stLimitField('ai-allow-budget',i18t('set_lim_allow_budget'),i18t('set_lim_allow_budget_sub'),0)}
        ${stLimitField('ai-allow-docs',i18t('set_lim_allow_docs'),i18t('set_lim_allow_docs_sub'),0)}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button id="ai-allow-open" style="${ST_BTN_SM}">${i18t('set_open_allowance')}</button>
        <button id="ai-allow-topup" style="${ST_BTN2};font-size:13px;padding:5px 10px">${i18t('set_top_up')}</button>
        <button id="ai-allow-close" style="${ST_BTN2};font-size:13px;padding:5px 10px">${i18t('act_close')}</button>
      </div>
    </div>

    <div class="st-sec">
      <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
        <div style="font-size:13px;font-weight:600;color:var(--color-text)">${i18t('set_rate_table')}</div>
        <span id="ai-rates-meta" style="font-size:12px;color:var(--color-neutral-500)"></span>
      </div>
      <p class="st-note">${i18t('set_usd_per')} ${i18t('set_per_million')}</p>
      <div id="ai-rates-table" style="max-height:220px;overflow-y:auto" class="scroll-thin"></div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button id="ai-rates-save" style="${ST_BTN_SM}">${i18t('set_save_rates')}</button>
        <button id="ai-rates-reset" style="${ST_BTN2};font-size:13px;padding:5px 10px">${i18t('set_reset_defaults')}</button>
      </div>
    </div>

    <div class="st-sec">
      <div style="font-size:13px;font-weight:600;color:var(--color-text);margin-bottom:2px">${i18t('set_file_existing')}</div>
      <p class="st-note">${i18t('set_file_existing_sub')}</p>
      <button id="meta-backfill" style="margin-top:6px;${ST_BTN2}">${icon('sparkle','w-3.5 h-3.5')} <span id="meta-backfill-lbl">${i18t('set_extract_metadata')}</span></button>
    </div>`;
}
function stWireEngine(){
  if(!API_MODE()){
    /* Local mode: no server to hold the key — persist it in this browser so the
       field is present and remembered; Copilot still uses the built-in
       interpreter. */
    const st=document.getElementById('ai-cfg-status');
    const refresh=()=>{ if(!st) return; const k=lsGet('hati.v1.aikey');
      st.innerHTML=k?`<span style="color:var(--st-green-fg);font-weight:600">● Configured</span> · key ••••${String(k).slice(-4)} stored in this browser — Copilot is live.`
                    :`<span style="color:var(--st-amber-fg);font-weight:600">● Not configured</span> — Copilot and Copilot features use the built-in interpreter.`; };
    refresh();
    const refreshAiIndicators=()=>{ if(typeof renderSideUser==='function') renderSideUser(); if(typeof updateAiBrainPill==='function') updateAiBrainPill(); };
    document.getElementById('ai-key-save')?.addEventListener('click',()=>{
      const inp=document.getElementById('ai-key'); const key=(inp?.value||'').trim();
      if(!key){ stDrawerRefuse(i18t('set_enter_key')); return; }
      lsSet('hati.v1.aikey', key); inp.value='';
      stDrawerClearRefusal();
      toast(i18t('set_t_key_saved',{last4:key.slice(-4)})); refresh(); refreshAiIndicators();
    });
    document.getElementById('ai-key-clear')?.addEventListener('click',async()=>{
      if(!await confirmDialog({title:'Remove the stored Copilot key?', message:'HaTi Copilot and Copilot features will fall back to the built-in interpreter.', confirmLabel:'Remove key', danger:true})) return;
      localStorage.removeItem('hati.v1.aikey'); toast(i18t('set_key_removed')); refresh(); refreshAiIndicators();
    });
    return;
  }
  const refreshAiCfg=async()=>{ const el=document.getElementById('ai-cfg-status'); if(!el) return;
    try{ const c=await api('ai/config'); state.aiConfigured=!!c.configured;
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
        bdHost.innerHTML=rows.length?`<div style="border:1px solid var(--color-divider);border-radius:0;overflow:hidden">
          ${rows.map(r=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);font-size:12px">
            <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${PB_ESC(r.label||r.k)}</span>
            <span style="color:var(--color-neutral-500);font-family:var(--font-mono);font-size:12px">${Number(r.requests||0).toLocaleString(jxLocale())} req</span>
            <span style="font-family:var(--font-mono);font-weight:600;min-width:62px;text-align:right">${'$'+Number(r.cost||0).toFixed(4)}</span>
          </div>`).join('')}</div>`
          :`<div style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_no_spend')}</div>`;
      }
      const pHost=document.getElementById('ai-spend-people');
      if(pHost){
        const people=Array.isArray(spend.byPerson)?spend.byPerson:[];
        const un=Number(spend.unattributed||0);
        pHost.innerHTML=`
          <div style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 4px">${
            esc(i18t('set_spend_people'))}</div>
          ${people.length?`<div style="border:1px solid var(--color-divider);border-radius:0;overflow:hidden">
            ${people.map(p=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);font-size:12px">
              <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${PB_ESC(p.name||'—')}${
                p.gone?` <span style="color:var(--color-neutral-500);font-size:12px">${esc(i18t('set_spend_left'))}</span>`:''}</span>
              <span style="color:var(--color-neutral-500);font-family:var(--font-mono);font-size:12px">${Number(p.requests||0).toLocaleString(jxLocale())} req</span>
              <span style="font-family:var(--font-mono);font-weight:600;min-width:62px;text-align:right">${'$'+Number(p.cost||0).toFixed(4)}</span>
            </div>`).join('')}</div>`
          :`<div style="font-size:12px;color:var(--color-neutral-500)">${esc(i18t('set_spend_people_none'))}</div>`}
          ${''/* THE GAP IS A FIGURE, NOT A DISCOVERY. Anything running outside
                 a signed-in request counts toward the workspace total and
                 against nobody, so the two lists need not agree — and an admin
                 must not have to subtract to find that out. Drawn only when
                 there IS a gap; an always-on "$0.0000 not attributed" is
                 furniture. */}
          ${un>0.000001?`<div style="font-size:12px;color:var(--st-amber-fg);margin-top:4px">${
            esc(i18t('set_spend_unattributed',{amount:'$'+un.toFixed(4)}))}</div>`:''}
          <div style="font-size:12px;color:var(--color-neutral-500);line-height:1.5;margin-top:5px">${
            esc(i18t('set_spend_people_note'))}</div>`;
      }
      const fillN=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n&&v!==undefined) n.value=v; };
      fillN('ai-rate-light',lim.rateLight); fillN('ai-rate-deep',lim.rateDeep); fillN('ai-daily',lim.dailyLimit);
      fillN('ai-rate-ocr',lim.rateOcr); fillN('ai-ocr-pages',lim.ocrMaxPages);
      fillN('ai-daily-spend',lim.dailySpendLimit); fillN('ai-estimate-confirm',lim.estimateConfirmAt);
      fillN('ai-maxchars',lim.maxChars); fillN('ai-docchars',lim.docChars); fillN('ai-maxcontracts',lim.maxContracts);
      const th=document.getElementById('ai-thorough'); if(th&&document.activeElement!==th) th.checked=!!lim.thoroughExtract;
      renderAllowancePanel(c.allowance||{});
      renderRateTable(c.rates||{}, c.ratesMeta||{});
    }catch(e){ el.textContent='Could not read Copilot config.'; } };
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
    if(!await confirmDialog({title:'Remove the stored Copilot key?', message:'Copilot features will fall back to the built-in interpreter until a new key is added.', confirmLabel:'Remove key', danger:true})) return;
    try{ await api('ai/config','PUT',{ clear:true }); toast(i18t('set_key_removed'),'ok'); refreshAiCfg(); }catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-limits-save')?.addEventListener('click',async()=>{
    const num=id=>{ const el=document.getElementById(id); if(!el) return undefined; const v=el.value.trim(); return v===''?undefined:Number(v); };
    const whole={ rateLight:num('ai-rate-light'), rateDeep:num('ai-rate-deep'), rateOcr:num('ai-rate-ocr'),
      dailyLimit:num('ai-daily'), maxChars:num('ai-maxchars'), docChars:num('ai-docchars'),
      maxContracts:num('ai-maxcontracts'), ocrMaxPages:num('ai-ocr-pages') };
    for(const [k,v] of Object.entries(whole)) if(v!==undefined&&(!Number.isFinite(v)||v<0||Math.floor(v)!==v)){ stDrawerRefuse(i18t('set_t_whole_number',{k})); return; }
    const cash={ dailySpendLimit:num('ai-daily-spend'), estimateConfirmAt:num('ai-estimate-confirm') };
    for(const [k,v] of Object.entries(cash)) if(v!==undefined&&(!Number.isFinite(v)||v<0)){ stDrawerRefuse(i18t('set_t_non_negative',{k})); return; }
    const body={ ...whole, ...cash, thoroughExtract: !!document.getElementById('ai-thorough')?.checked };
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
    if(!await confirmDialog({title:'Open an onboarding allowance?',
      message:`Bulk import and OCR will draw on ${b.budget>0?'$'+b.budget.toFixed(2):'no money cap'}${b.docs>0?` and ${b.docs} documents`:''} instead of the daily budget, until it runs out.`,
      confirmLabel:'Open allowance'})) return;
    try{ await api('ai/allowance','PUT',{ open:true, ...b }); toast(i18t('set_allowance_opened')); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-allow-topup')?.addEventListener('click',async()=>{
    try{ await api('ai/allowance','PUT',allowBody()); toast(i18t('set_allowance_updated')); refreshAiCfg(); }
    catch(e){ stDrawerRefuse(e.message); }
  });
  document.getElementById('ai-allow-close')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:'Close the onboarding allowance?', message:'Migration and OCR will go back to drawing on the daily budget.', confirmLabel:'Close allowance', danger:true})) return;
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
    if(!await confirmDialog({title:'Reset the rate table?', message:'Every model goes back to the prices HaTi ships with. Past spend already recorded is not re-priced.', confirmLabel:'Reset rates', danger:true})) return;
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
      const hp=r.health||{}, failing=!!(r.emailConfigured&&hp.failing);
      host.innerHTML=`<div class="mb-2 text-[11px] ${r.emailConfigured&&!failing?'text-brand-600':'text-gold-600'}">${
          !r.emailConfigured ? i18t('set_email_not_configured')
          : failing ? i18tn('set_email_failing', hp.failed||0, { n:hp.failed||0 })
          : i18t('set_email_configured')}</div>`+
        (failing&&hp.lastError?`<div class="mb-2 text-[10.5px] text-gold-700 bg-gold-500/10 rounded px-2 py-1.5 leading-relaxed">${i18t('set_why_failed',{why:esc(hp.lastError)})}</div>`:'')+
        (r.items.length?`<div class="space-y-1.5 max-h-56 overflow-y-auto scroll-thin">${r.items.map(it=>`
          <div class="rounded-lg border border-brand-100 bg-white p-2.5">
            <div class="flex items-center gap-2"><span class="text-[11px] font-medium text-brand-900 truncate flex-1">${it.subject}</span><span class="text-[9px] uppercase tracking-wider ${it.sent?'text-brand-600':'text-gold-600'}">${it.sent?i18t('set_sent_lower'):it.provider}</span></div>
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
function stWireOutbox(){
  stLoadOutbox();
  const busy=(btn,word,fn)=>async()=>{
    const held=btn.innerHTML;
    btn.disabled=true; btn.innerHTML=esc(i18t(word));
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
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:10px">
          ${Object.entries(STEP).map(([k,label])=>{ const e=r.events&&r.events[k];
            return `<div style="border:1px solid var(--color-divider);border-radius:0;padding:9px 11px;background:${e?'var(--st-green-bg)':'var(--color-bg)'}">
              <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:${e?'var(--st-green-fg)':'var(--color-neutral-600)'}">${e?icon('check2','w-3 h-3'):''}${label}</div>
              <div style="font-size:12px;font-family:var(--font-mono);color:var(--color-neutral-600);margin-top:3px">${e?`${fmtDT(e.first)} · ${e.count}×`:i18t('set_not_yet')}</div>
            </div>`; }).join('')}
        </div>
        <div style="font-size:13px;line-height:1.5;color:${r.northStar.withinSevenDays===true?'var(--st-green-fg)':r.northStar.withinSevenDays===false?'var(--st-amber-fg)':'var(--color-neutral-700)'}">
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
function renderTeam(){
  /* THE GATE IS HERE, not on the nav item, because the nav item is one of five
     doors and the other four were the ones nobody remembered. Every road into
     'team' arrives at this function; a non-admin is drawn their own account
     page rather than a refusal or a blank. */
  if(typeof isAdmin==='function' && !isAdmin()){ renderMyAccountPage(); return; }
  const _heldHeights=settingsHeightsBefore();
  const tab=settingsTab();
  const tabRow=`<div class="st-tabs" role="tablist">${ST_TABS.map(k=>
    `<button class="st-tab${k===tab?' on':''}" data-st-tab="${k}" role="tab" aria-selected="${k===tab?'true':'false'}">${esc(i18t('st_tab_'+k))}</button>`).join('')}</div>`;
  const body =
      tab==='people'   ? stPeopleHtml()
    : tab==='you'      ? `<div class="st-you">${stAccountBodyHtml()}<p class="st-note">${esc(i18t('st_you_elsewhere'))}</p></div>`
    : stRowsHtml(tab);
  document.getElementById('content').innerHTML=`
  <div id="set-page" class="view-enter st-page">
    ${tabRow}
    <p class="st-tabsub">${esc(i18t('st_tab_'+tab+'_sub'))}</p>
    <div id="st-tabbody">${body}</div>
  </div>`;
  settingsHoldHeights(_heldHeights);
  stWireDrawerOnce();
  if(tab==='you') stAccountWire();
  /* A door may have asked for one panel. Consumed on arrival, exactly once, so
     a later repaint does not re-open something the reader closed. */
  if(_stWantPanel){ const want=_stWantPanel; _stWantPanel=null; stDrawerOpen(want); }
  setActiveNav('team');
}
/* A non-admin's whole settings page: their own account, drawn in the page
   rather than in the drawer, because arriving at a view and being handed a
   floating panel over an empty page reads as an error. */
function renderMyAccountPage(){
  document.getElementById('content').innerHTML=`
  <div id="set-page" class="view-enter st-page">
    <div class="st-quiet" style="margin-bottom:14px">
      <b>${esc(i18t('st_admin_only_page'))}</b><br>${esc(i18t('st_admin_only_body'))}
    </div>
    <h2 class="st-tabsub" style="font-size:15px;font-weight:600;color:var(--color-text)">${esc(i18t('st_you_title'))}</h2>
    <div class="st-you">${stAccountBodyHtml()}</div>
  </div>`;
  stWireDrawerOnce();
  stAccountWire();
  setActiveNav('team');
}
/* ---- E4 clause library editor + playbook viewer (Admin/Legal) ---- */
function saveClauseLibrary(lib){ state.settings=state.settings||{}; state.settings.clauseLibrary=lib; saveSettings(); }
/* ---- WHAT YOUR OWN HISTORY SAYS (W3-2, precedent memory) ----
   The suggestions sit WITH the clause library, because the thing they
   propose to change is a library fallback and a proposal belongs beside the
   thing it is about. Nothing here writes: an admin presses Adopt, and that
   press goes through saveClauseLibrary exactly as hand-editing the clause
   would. A suggestion is evidence and a button, never a change.

   IT SAYS NOTHING UNTIL THERE IS SOMETHING TO SAY. With a thin book
   (PRECEDENT_MIN) the panel does not draw at all — an empty "no patterns
   yet" card on every workspace's settings page is furniture, and this
   feature has to earn its place by having read something real. */
function renderPrecedentPanel(){
  const host=document.getElementById('precedent-panel'); if(!host) return;
  if(typeof precedentSuggestions!=='function'){ host.innerHTML=''; return; }
  const sug=precedentSuggestions();
  if(!sug.length){ host.innerHTML=''; return; }
  const mayAdopt=isAdmin()||currentUser()?.role==='legal';
  host.innerHTML=`
    <div style="border:1px solid var(--color-divider);border-radius:0;background:var(--color-surface);padding:12px 14px">
      <h4 style="margin:0 0 3px;font-size:14px;font-weight:700;font-family:var(--font-heading)">${esc(i18t('pc_title'))}</h4>
      <p class="st-note" style="margin:0 0 9px">${esc(i18t('pc_sub'))}</p>
      ${sug.map(x=>`
        <div style="border-top:1px solid var(--color-divider);padding:9px 0 3px">
          <div style="font-size:13px;line-height:1.55">${esc(i18t('pc_line',{
            category:x.category, figure:x.figure, unit:x.unit, seen:x.seen, settled:x.settled }))}</div>
          <div style="font-size:12px;color:var(--color-neutral-600);margin-top:3px">${
            x.currentFigure!=null
              ? esc(i18t('pc_current',{figure:x.currentFigure,unit:x.unit}))
              : esc(i18t('pc_current_none'))}
            · ${esc(i18tn('pc_from_n',x.contracts.length,{n:x.contracts.length}))}</div>
          ${mayAdopt?`<button class="ui-btn" data-pc-adopt="${esc(x.key)}" style="font-size:12px;padding:4px 10px;margin-top:6px">${esc(i18t('pc_adopt'))}</button>`:''}
        </div>`).join('')}
    </div>`;
  host.querySelectorAll('[data-pc-adopt]').forEach(b=>b.addEventListener('click',()=>precedentAdopt(b.getAttribute('data-pc-adopt'))));
}
/* ADOPTING IS THE ADMIN'S ACT, and it asks first — a fallback is the line
   the company holds, and moving it moves what every future review calls a
   deviation. The write is the ordinary one; nothing about this bypasses the
   editor a person would otherwise have used. */
async function precedentAdopt(key){
  const x=(precedentSuggestions()||[]).find(s=>s.key===key); if(!x) return;
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
function renderClauseLibrary(){
  const host=document.getElementById('clause-lib'); if(!host) return;
  const canEditLib=isAdmin()||currentUser()?.role==='legal';
  const lib=clauseLibrary();
  host.innerHTML=lib.map((cl,i)=>`
    <div style="border:1px solid var(--color-divider);border-radius:0;background:var(--color-surface);padding:11px 13px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:11px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.09em;color:var(--color-neutral-500)">${cl.category}</span>
        <span style="font-size:14px;font-weight:600;color:var(--color-text)">${cl.name}</span>
        ${canEditLib?`<span style="margin-left:auto;display:flex;gap:10px;font-size:12px;font-weight:600">
          <button data-cl-edit="${i}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">${i18t('set_edit_lower')}</button>
          <button data-cl-del="${i}" style="background:none;border:0;cursor:pointer;color:var(--st-ruby-dot)">${i18t('set_remove_lower')}</button></span>`:''}
      </div>
      <div style="margin-top:4px;font-size:12px;color:var(--color-neutral-600)"><b>${i18t('set_preferred')}</b> ${(cl.preferred||'').slice(0,140).replace(/</g,'&lt;')}${(cl.preferred||'').length>140?'…':''}</div>
    </div>`).join('')||`<p style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_no_clauses')}</p>`;
  host.querySelectorAll('[data-cl-edit]').forEach(b=>b.addEventListener('click',()=>openClauseEditor(Number(b.getAttribute('data-cl-edit')))));
  host.querySelectorAll('[data-cl-del]').forEach(b=>b.addEventListener('click',()=>{ const i=Number(b.getAttribute('data-cl-del')); const lib2=clauseLibrary().slice(); lib2.splice(i,1); saveClauseLibrary(lib2); renderClauseLibrary(); toast(i18t('set_t_clause_removed')); }));
  document.getElementById('cl-add')?.addEventListener('click',()=>openClauseEditor(-1));
  renderPrecedentPanel();
  renderPlaybookView();
}
/* ---- playbook viewer + editor (Admin / Legal) ---- */
const PB_ESC = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
const PB_ATTR = s => String(s==null?'':s).replace(/"/g,'&quot;');
// position chip — red for required/forbidden, steel for preferred; ⚑ = escalate
function pbPosChip(pos){
  const hard=pos.pos==='required'||pos.pos==='forbidden';
  return `<span style="font-size:12px;font-family:var(--font-mono);border-radius:0;padding:2px 9px;${hard?'background:var(--st-ruby-bg);color:var(--st-ruby-fg)':'background:var(--st-steel-bg);color:var(--st-steel-fg)'}">${PB_ESC(pos.category)}${pos.escalate?' ⚑':''}</span>`;
}
const pbRangeChip = rg => `<span style="font-size:12px;font-family:var(--font-mono);border-radius:0;padding:2px 9px;background:var(--st-amber-bg);color:var(--st-amber-fg)">${PB_ESC(rg.label)} ${rg.op} ${rg.value}${rg.escalate?' ⚑':''}</span>`;
function renderPlaybookView(){
  const pv=document.getElementById('playbook-view'); if(!pv) return;
  const canEditPb=isAdmin()||currentUser()?.role==='legal';
  const pb=playbook();
  const base=pb._default||DEFAULT_PLAYBOOK._default;
  const card=(key,label,positions,ranges,removable,baseline)=>`
    <div style="margin-bottom:${baseline?'12px':'8px'};border:1px solid ${baseline?'var(--color-accent-300)':'var(--color-divider)'};border-left:3px solid ${baseline?'var(--color-accent)':'var(--color-divider)'};border-radius:0;background:${baseline?'var(--color-accent-100)':'var(--color-surface)'};padding:${baseline?'11px 13px':'10px 12px'}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:${baseline?'2px':'6px'}">
        <span style="font-size:13px;font-weight:${baseline?700:600};color:${baseline?'var(--color-accent-900)':'var(--color-text)'}">${PB_ESC(label)}</span>
        ${baseline?`<span style="font-size:10px;font-family:var(--font-mono);letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:#fff;background:var(--color-accent);border-radius:0;padding:2px 8px">${i18t('set_applies_all')}</span>`:''}
        ${canEditPb?`<span style="margin-left:auto;display:flex;gap:10px;font-size:12px;font-weight:600">
          <button data-pb-edit="${key}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">${i18t('set_edit_lower')}</button>
          ${removable?`<button data-pb-del="${key}" style="background:none;border:0;cursor:pointer;color:var(--st-ruby-dot)">${i18t('set_remove_lower')}</button>`:''}
        </span>`:''}
      </div>
      ${baseline?`<div style="font-size:12px;color:var(--color-accent-800);margin-bottom:7px">${i18t('set_default_positions')}</div>`:''}
      <div style="display:flex;flex-wrap:wrap;gap:5px">${positions.map(pbPosChip).join('')}${ranges.map(pbRangeChip).join('')||(positions.length?'':`<span style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_no_positions')}</span>`)}</div>
    </div>`;
  const baseCard=card('_default',i18t('set_all_contracts_baseline'), base.positions||[], base.ranges||[], false, true);
  const typeCards=Object.keys(pb).filter(k=>k!=='_default').map(k=>{ const rp=resolvePlaybook(k); return card(k, pb[k].label||k, rp.positions, rp.ranges, true); }).join('');
  pv.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:13px;font-weight:600;color:var(--color-text)">${i18t('set_playbook_by_type')}</span>
      ${canEditPb?`<span style="margin-left:auto;display:flex;gap:8px">
        <button id="pb-add" class="ui-btn ui-btn-primary" style="font-size:12px;padding:4px 10px">${icon('plus','w-3 h-3')} ${i18t('set_add_type')}</button>
        <button id="pb-reset" style="font-size:12px;font-weight:600;color:var(--color-neutral-600);background:none;border:0;cursor:pointer">${i18t('set_reset_defaults2')}</button>
      </span>`:''}
    </div>
    ${baseCard}${typeCards}
    <p style="font-size:12px;color:var(--color-neutral-500);margin-top:4px">${i18t('set_flag_legend')}${canEditPb?i18t('set_flag_legend_more'):''}</p>`;
  if(!canEditPb) return;
  pv.querySelectorAll('[data-pb-edit]').forEach(b=>b.addEventListener('click',()=>openPlaybookEditor(b.getAttribute('data-pb-edit'))));
  pv.querySelectorAll('[data-pb-del]').forEach(b=>b.addEventListener('click',async()=>{
    const key=b.getAttribute('data-pb-del'); const cur=playbook();
    if(!await confirmDialog({title:i18t('set_remove_type_q',{label:cur[key]?.label||key}), message:i18t('set_remove_type_msg'), confirmLabel:i18t('set_remove_type_btn'), danger:true})) return;
    const pb2=JSON.parse(JSON.stringify(cur)); delete pb2[key]; savePlaybook(pb2); renderPlaybookView(); toast(i18t('set_type_removed'));
  }));
  document.getElementById('pb-add')?.addEventListener('click',()=>openPlaybookEditor(null));
  document.getElementById('pb-reset')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:i18t('set_reset_pb_q'), message:i18t('set_reset_pb_msg',{pack:jxPlaybookLabel()}), confirmLabel:i18t('set_reset_pb_btn'), danger:true})) return;
    state.settings=state.settings||{}; delete state.settings.playbook; if(typeof saveSettings==='function') saveSettings();
    renderPlaybookView(); toast(i18t('set_pb_reset_done'));
  });
}
/* Modal editor for one playbook entry (key='_default' edits the baseline,
   null adds a new contract type). Positions and numeric limits are edited live
   on a working copy, then committed with Save. */
function openPlaybookEditor(key){
  const pb=JSON.parse(JSON.stringify(playbook()));
  const isNew=!key, isBase=key==='_default';
  if(isNew){ key='t_'+Math.random().toString(36).slice(2,7); pb[key]={label:'',extends:'_default',positions:[],ranges:[],match:[]}; }
  const e=pb[key]; e.positions=e.positions||[]; e.ranges=e.ranges||[]; e.match=e.match||[];
  const inherited=(!isBase)?resolvePlaybook('_default'):null;
  const POS=[['required',i18t('set_pos_required')],['preferred',i18t('set_pos_preferred')],['forbidden',i18t('set_pos_forbidden')]];
  const inp='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:6px 8px;font:inherit;font-size:14px;color:inherit;outline:none';
  openModal(`<div style="padding:20px 22px">
    <h3 style="font-family:var(--font-heading);font-weight:600;font-size:16px;margin:0 0 12px">${isNew?i18t('set_add_contract_type'):isBase?i18t('set_edit_baseline'):i18t('set_edit_playbook_for',{label:PB_ESC(e.label||key)})}</h3>
    <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:12px;font-weight:600;color:var(--color-text);margin-bottom:3px">${isBase?i18t('set_name'):i18t('set_type_name')}</span>
      <input id="pb-f-label" value="${PB_ATTR(e.label||'')}" placeholder="${isBase?esc(i18t('set_ph_baseline')):esc(i18t('set_ph_eg_distribution'))}" style="${inp}"></label>
    ${!isBase?`<label style="display:block;margin-bottom:10px"><span style="display:block;font-size:12px;font-weight:600;color:var(--color-text);margin-bottom:3px">${i18t('set_applies_matching')} <span style="font-weight:400;color:var(--color-neutral-500)">${i18t('set_comma_keywords')}</span></span>
      <input id="pb-f-match" value="${PB_ATTR(e.match.join(', '))}" placeholder="${esc(i18t('set_ph_eg_keywords'))}" style="${inp}"></label>
    <div style="font-size:12px;color:var(--color-neutral-600);background:var(--color-bg);border:1px solid var(--color-divider);border-radius:0;padding:7px 9px;margin-bottom:12px">${i18t('set_inherited_baseline')} <span style="display:inline-flex;flex-wrap:wrap;gap:4px;vertical-align:middle">${inherited.positions.map(pbPosChip).join('')}${inherited.ranges.map(pbRangeChip).join('')}</span></div>`:''}

    <div style="display:flex;align-items:center;margin:0 0 6px"><span style="font-size:12px;font-weight:600;color:var(--color-text)">${isBase?i18t('set_positions'):i18t('set_positions_for_type')}</span><button id="pb-add-pos" style="margin-left:auto;font-size:12px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer">${i18t('set_add_position')}</button></div>
    <div id="pb-pos-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px"></div>

    <div style="display:flex;align-items:center;margin:0 0 6px"><span style="font-size:12px;font-weight:600;color:var(--color-text)">${i18t('set_numeric_limits')}</span><button id="pb-add-rng" style="margin-left:auto;font-size:12px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer">${i18t('set_add_limit')}</button></div>
    <div id="pb-rng-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px"></div>

    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button id="pb-cancel" class="ui-btn" style="font-size:13px;padding:6px 14px">${i18t('act_cancel')}</button>
      <button id="pb-save" class="ui-btn ui-btn-primary" style="font-size:13px;padding:6px 16px">${i18t('act_save')}</button>
    </div>
  </div>`, {maxWidth:'34rem'});

  const seg=(i)=>POS.map(([v,l])=>{ const on=e.positions[i].pos===v; const hard=v==='required'||v==='forbidden';
    return `<button data-pb-pos="${i}" data-v="${v}" style="font-size:12px;font-weight:600;border:1px solid ${on?(hard?'var(--st-ruby-line)':'var(--color-accent)'):'var(--color-divider)'};background:${on?(hard?'var(--st-ruby-bg)':'var(--color-accent-100)'):'var(--color-surface)'};color:${on?(hard?'var(--st-ruby-fg)':'var(--color-accent-800)'):'var(--color-neutral-600)'};padding:4px 9px;border-radius:0;cursor:pointer">${l}</button>`; }).join('');
  const paint=()=>{
    const pl=document.getElementById('pb-pos-list');
    pl.innerHTML=e.positions.length?e.positions.map((p,i)=>`
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;border:1px solid var(--color-divider);border-radius:0;padding:7px 8px;background:var(--color-bg)">
        <input data-pb-cat="${i}" value="${PB_ATTR(p.category||'')}" placeholder="${esc(i18t('set_ph_category'))}" style="flex:1;min-width:150px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:5px 7px;font:inherit;font-size:13px;outline:none">
        <span style="display:inline-flex;gap:3px">${seg(i)}</span>
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--color-neutral-700);white-space:nowrap"><input type="checkbox" data-pb-esc="${i}" ${p.escalate?'checked':''} style="accent-color:var(--color-accent)">${i18t('set_flag_legal')}</label>
        <button data-pb-rmpos="${i}" title="${i18t('act_remove')}" style="background:none;border:0;cursor:pointer;color:var(--color-neutral-500);font-size:15px;line-height:1;padding:0 2px">×</button>
      </div>`).join(''):`<p style="font-size:12px;color:var(--color-neutral-500);margin:0">${isBase?i18t('set_no_specific_positions'):i18t('set_no_specific_inherits')}</p>`;
    const rl=document.getElementById('pb-rng-list');
    rl.innerHTML=e.ranges.length?e.ranges.map((r,i)=>`
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;border:1px solid var(--color-divider);border-radius:0;padding:7px 8px;background:var(--color-bg)">
        <input data-pb-rlabel="${i}" value="${PB_ATTR(r.label||'')}" placeholder="${esc(i18t('set_ph_label_payment'))}" style="flex:1;min-width:120px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:5px 7px;font:inherit;font-size:13px;outline:none">
        <select data-pb-rop="${i}" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:5px 6px;font:inherit;font-size:13px;cursor:pointer"><option value="<=" ${r.op==='<='?'selected':''}>≤</option><option value=">=" ${r.op==='>='?'selected':''}>≥</option></select>
        <input data-pb-rval="${i}" type="number" value="${r.value}" style="width:74px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:5px 7px;font:inherit;font-size:13px;outline:none">
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--color-neutral-700);white-space:nowrap"><input type="checkbox" data-pb-resc="${i}" ${r.escalate?'checked':''} style="accent-color:var(--color-accent)">${i18t('set_flag_legal')}</label>
        <button data-pb-rmrng="${i}" title="${i18t('act_remove')}" style="background:none;border:0;cursor:pointer;color:var(--color-neutral-500);font-size:15px;line-height:1;padding:0 2px">×</button>
      </div>`).join(''):`<p style="font-size:12px;color:var(--color-neutral-500);margin:0">${i18t('set_no_numeric_limits')}</p>`;
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
  paint();
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
    : `<label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${label}</span><input id="ce-${k}" value="${(cl[k]||'').replace(/"/g,'&quot;')}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>`;
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-3">${idx>=0?'Edit':'Add'} clause</h3>
    ${fld('category','Category')}${fld('name','Name')}${fld('preferred','Preferred wording',true)}${fld('fallback','Fallback wording',true)}${fld('guidance','Guidance',true)}
    <div class="flex justify-end gap-2 mt-2"><button id="ce-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
      <button id="ce-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('act_save')}</button></div>
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
    <div style="border:1px solid var(--color-divider);border-radius:0;background:var(--color-surface);padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:22px;height:22px;display:inline-grid;place-items:center;border-radius:50%;background:var(--tile-steel-bg);font-size:12px;font-weight:700;color:var(--tile-steel-fg);flex:none">${r.order||1}</span>
        <span style="font-size:13px;color:var(--color-text)"><b>${i18t('set_if')}</b> ${condLabel(r.cond)} <b>${i18t('set_then')}</b> ${approverLabelOf(r.approver)}</span>
        ${isAdmin()?`<span style="margin-left:auto;display:flex;gap:10px;font-size:12px;font-weight:600"><button data-ar-edit="${i}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">${i18t('set_edit_lower')}</button><button data-ar-del="${i}" style="background:none;border:0;cursor:pointer;color:var(--st-ruby-dot)">${i18t('set_remove_lower')}</button></span>`:''}
      </div>
    </div>`).join(''):`<p style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_no_approval_rules')}</p>`;
  host.querySelectorAll('[data-ar-edit]').forEach(b=>b.addEventListener('click',()=>openApprovalRuleEditor(Number(b.getAttribute('data-ar-edit')))));
  host.querySelectorAll('[data-ar-del]').forEach(b=>b.addEventListener('click',()=>{ const rules2=approvalRules().slice(); rules2.splice(Number(b.getAttribute('data-ar-del')),1); saveApprovalRules(rules2); renderApprovalRules(); toast(i18t('set_rule_removed')); }));
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
  const orphan = r.approver && r.approver.kind==='member'
    && !members.some(m=>m.name===r.approver.name) ? r.approver.name : null;
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-3">${idx>=0?i18t('set_edit_rule'):i18t('set_add_rule')}</h3>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('set_order_lower_first')}</span>
      <input id="ar-order" type="number" min="1" value="${r.order||1}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('set_condition')}</span>
      <select id="ar-cond" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">${AR_CONDS().map(([k,l])=>`<option value="${k}" ${r.cond.type===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <div id="ar-condval" class="mb-2.5"></div>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('set_approver')}</span>
      <select id="ar-approver" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">
        <option value="role:admin" ${r.approver.kind==='role'&&r.approver.role==='admin'?'selected':''}>${i18t('set_any_admin')}</option>
        <option value="role:legal" ${r.approver.kind==='role'&&r.approver.role==='legal'?'selected':''}>${i18t('set_any_legal')}</option>
        ${orphan?`<option value="orphan" selected>${esc(orphan)} — ${i18t('set_approver_gone')}</option>`:''}
        ${members.map(m=>`<option value="member:${m.name}" ${r.approver.kind==='member'&&r.approver.name===m.name?'selected':''}>${m.name} (${roleName(m.role)})</option>`).join('')}
      </select>
      ${orphan?`<span style="display:block;margin-top:6px;font-size:12px;color:var(--st-amber-fg);background:var(--st-amber-bg);border:1px solid var(--st-amber-line);padding:6px 9px">${i18t('set_approver_gone_note',{name:esc(orphan)})}</span>`:''}</label>
    <div class="flex justify-end gap-2 mt-2"><button id="ar-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
      <button id="ar-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('set_save_rule')}</button></div>
  </div>`);
  const renderCondVal=()=>{ const t=document.getElementById('ar-cond').value; const h=document.getElementById('ar-condval');
    if(t==='value') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('set_threshold',{cur:jxCurrency()})}</span><input id="ar-cv" type="number" value="${r.cond.type==='value'?r.cond.value:5000000}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>`;
    else if(t==='folder') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('set_value_stream')}</span><select id="ar-cv" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">${Object.values(FOLDERS).map(f=>`<option value="${esc(f.id)}" ${r.cond.value===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label>`;
    else if(t==='kind') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('set_type_contains')}</span><input id="ar-cv" value="${r.cond.type==='kind'?(r.cond.value||''):''}" placeholder="${esc(i18t('set_ph_eg_lease'))}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>`;
    else h.innerHTML=`<p class="text-[11px] text-ink/55">${i18t('set_no_extra_value')}</p>`; };
  document.getElementById('ar-cond').addEventListener('change',renderCondVal); renderCondVal();
  document.getElementById('ar-cancel').addEventListener('click',closeModal);
  document.getElementById('ar-save').addEventListener('click',()=>{
    const t=document.getElementById('ar-cond').value; const cv=document.getElementById('ar-cv');
    const cond={type:t}; if(t==='value'){ cond.op='>='; cond.value=Number(cv.value||0); } else if(t==='folder'||t==='kind'){ cond.value=cv.value.trim?cv.value.trim():cv.value; }
    const apRaw=document.getElementById('ar-approver').value;
    /* The refusal, rather than a silent widening. */
    if(apRaw==='orphan'){ toast(i18t('set_pick_approver'),'err'); return; }
    const ap=apRaw.split(':');
    r.order=Math.max(1,Number(document.getElementById('ar-order').value||1)); r.cond=cond;
    r.approver = ap[0]==='member'?{kind:'member',name:ap.slice(1).join(':')}:{kind:'role',role:ap[1]};
    r.name = condLabel(cond);
    if(idx>=0) rules[idx]=r; else rules.push(r);
    saveApprovalRules(rules); closeModal(); renderApprovalRules(); toast(i18t('set_rule_saved'));
  });
}

/* ---- the internal-review gate (Admin) ----
   THREE CONTROLS AND NO SAVE BUTTON. Each one writes on change, because a gate
   that is armed only if you remember to press Save is a gate that is off when
   it matters. saveReviewGateCfg is the single writer (js/review.js); this panel
   never touches state.settings itself. */
function renderReviewGatePanel(){
  const host=document.getElementById('rv-gate-panel'); if(!host) return;
  const admin=isAdmin();
  const cfg=(window.reviewGateCfg?reviewGateCfg():{on:false,when:'deviation',value:0});
  const dis=admin?'':' disabled';
  const money=(window.jxCurrency?jxCurrency():'');
  host.innerHTML=`
    <label style="display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.5;cursor:${admin?'pointer':'not-allowed'};margin-bottom:10px">
      <input id="rv-gate-on" type="checkbox"${cfg.on?' checked':''}${dis} style="margin-top:2px"/>
      <span style="font-weight:600;color:var(--color-text)">${i18t('rv_set_on')}</span>
    </label>
    <div id="rv-gate-more"${cfg.on?'':' hidden'}>
      ${''/* ---- WHO IS CHECKED IS PER PERSON ----
             The switch above is the MASTER: it decides whether any of this
             happens at all. Under it, each person carries their own flag, set
             on their row under People, and the absence of one means checked —
             which is what keeps a workspace that already had this on behaving
             exactly as it did. The unchecked are NAMED here rather than
             counted, because an admin acts on names. */}
      <p style="font-size:12px;color:var(--color-neutral-600);margin:0 0 9px;line-height:1.5">${i18t('rv_set_per_person')}
        ${(()=>{ const off=(typeof reviewUncheckedPeople==='function')?reviewUncheckedPeople():[];
          return off.length
            ? `<span style="color:var(--st-amber-fg)">${esc(i18tn('rv_set_unchecked',off.length,{n:off.length,who:off.map(u=>u.name||u.email).join(', ')}))}</span>`
            : esc(i18t('rv_set_all_checked')); })()}</p>
      <label style="display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.5;cursor:${admin?'pointer':'not-allowed'};margin-bottom:10px">
        <input id="rv-gate-newchecked" type="checkbox"${cfg.newChecked?' checked':''}${dis} style="margin-top:2px"/>
        <span style="font-weight:600;color:var(--color-text)">${i18t('rv_set_new_checked')}</span>
      </label>
      <label style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${i18t('rv_set_when')}</label>
      <select id="rv-gate-when"${dis} style="${window.RV_FLD||''}margin-bottom:9px">
        <option value="always"${cfg.when==='always'?' selected':''}>${i18t('rv_set_when_always')}</option>
        <option value="deviation"${cfg.when==='deviation'?' selected':''}>${i18t('rv_set_when_deviation')}</option>
        <option value="value"${cfg.when==='value'?' selected':''}>${i18t('rv_set_when_value')}</option>
      </select>
      <div id="rv-gate-valwrap"${cfg.when==='value'?'':' hidden'}>
        <label style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${i18t('rv_set_value')}${money?` (${money})`:''}</label>
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
function renderDeskRulePanel(){
  const host=document.getElementById('dk-rule-panel'); if(!host) return;
  const admin=isAdmin();
  const cfg=(window.deskCfg?deskCfg():{on:false});
  host.innerHTML=`
    <label style="display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.5;cursor:${admin?'pointer':'not-allowed'}">
      <input id="dk-rule-on" type="checkbox"${cfg.on?' checked':''}${admin?'':' disabled'} style="margin-top:2px"/>
      <span style="font-weight:600;color:var(--color-text)">${i18t('dk_set_on')}</span>
    </label>
    <p style="font-size:12px;color:var(--color-neutral-600);margin:8px 0 0;line-height:1.6">${i18t('dk_set_detail')}</p>
    ${''/* ---- THE PRICE OF ONE DOOR OUT, AND IT IS SET HERE ----
           Independent of the switch above on purpose: a deal going quiet
           because the lead is on leave is worth knowing about whether or not
           the rule is enforced, and the flag is ours alone — the counterparty
           is never told we noticed. Too short and it becomes noise people learn
           to scroll past; too long and it fires after they have already
           chased. Five working days is the default. */}
    <div style="margin-top:12px;border-top:1px solid var(--color-divider);padding-top:11px">
      <label for="dk-stale" style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px">${i18t('dk_set_stale')}</label>
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
      return `<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--color-divider);border-radius:0;background:var(--color-surface);padding:7px 10px">
        <span style="min-width:0"><span style="font-size:13px;font-weight:600;color:var(--color-text)">${dev}${s.current?` <span style="font-size:10px;font-family:var(--font-mono);color:var(--color-accent-700)">${i18t('set_this_device')}</span>`:''}</span>
        <span style="display:block;font-size:12px;font-family:var(--font-mono);color:var(--color-neutral-500)">${s.ip||'—'} · ${i18t('set_last_seen',{when:s.lastSeen?fmtDT(s.lastSeen):'—'})}</span></span>
        ${s.current?'':`<button data-sess-revoke="${s.id}" style="margin-left:auto;font-size:12px;font-weight:600;color:var(--st-ruby-dot);background:none;border:0;cursor:pointer">${i18t('set_revoke')}</button>`}
      </div>`; }).join('')}</div>`:`<p style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_no_active_sessions')}</p>`;
    host.querySelectorAll('[data-sess-revoke]').forEach(b=>b.addEventListener('click',async()=>{
      try{ await api('sessions/'+b.getAttribute('data-sess-revoke'),'DELETE'); toast(i18t('set_t_session_revoked')); loadSessions(); }
      catch(e){ toast(e.message,'err'); }
    }));
  }catch(e){ host.innerHTML=`<p style="font-size:12px;color:var(--color-neutral-500)">${i18t('set_could_not_load_sessions')}</p>`; }
}

/* Exported because a cross-module call that is never exported silently takes
   the else branch and nobody catches it — the lesson rlPaperFootHtml taught
   this codebase for a year. openMyAccount and openSettingsAt are the two doors
   the shell calls; SET_PANELS and the readers beside it are what the tests read. */
Object.assign(window,{renderTeam,renderMyAccountPage,briefCadenceOf,BRIEF_EVERY_VALUES,renderPrecedentPanel,precedentAdopt,renderAllowancePanel,renderRateTable,renderClauseLibrary,openClauseEditor,
  renderApprovalRules,openApprovalRuleEditor,renderReviewGatePanel,renderDeskRulePanel,condLabel,loadSessions,
  openMyAccount,openSettingsAt,settingsGoTab,settingsTab,SET_PANELS,ST_TABS,SET_CLOSURES,
  stDrawerOpen,stDrawerClose,stDrawerRefuse,settingsPersonDrawer,settingsSavePerson,settingsRemoveMember,
  settingsWriteFolderAccess,settingsExportBackup,stGoLive,stSampleContracts,stClearSamples,stRunIntegrity,
  stPersonMissing,stAccountBodyHtml,parseDirectoryCsv,openFolderAccessEditor,settingsMirrorDirectory,
  stSigningSectionHtml,stSigningRead,stPaintLadder,stReviewSectionHtml,stReviewRead,stSignFolderHtml,stSignFolderRead,
  stOverseerSectionHtml,stOverseerRead,
  settingsMarketFactsHtml,settingsPaintShapeBoxes,settingsHeightsBefore,settingsHoldHeights});
