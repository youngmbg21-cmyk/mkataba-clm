/* ============================================================
   PEOPLE — a staff directory everybody can read
   ============================================================
   Settings & Rules became admin-only in August 2026, so a colleague can no
   longer sit and read the roster in one place. This gives that back.

   IT IS A SCREEN, NOT A PERMISSION CHANGE, and that distinction is the whole
   design. What the admin-only page took away was a PAGE, not the information:
   every signed-in member already receives the full roster at sign-in — name,
   email, role, job title — because the reviewer picker, the desk contributor
   picker and the approval rules all have to name colleagues. So this page adds
   NO route, asks the server nothing new, and reads exactly the list the
   browser is already holding.

   WHAT IS NOT ON IT, AND WHY IT CANNOT BE. Who can see which folders is
   deliberately absent from a non-admin's browser — stripped from the settings
   blob AND stripped from every colleague's user record, because handing the
   same map back one record at a time was the same disclosure more slowly (the
   M-3 fix, done in two halves). Signing limits, who checks whose work,
   per-folder signing rights and the approval rules are the same: admin-only,
   and they stay on Settings. This page cannot leak them by accident because
   the data is not here — but a future change that put it back would silently
   widen this page, so f202 asserts the ABSENCE rather than trusting it.

   NOTHING ON IT IS PRESSABLE. It is a list to read. Editing lives on Settings →
   People, which is unchanged, and an admin gets one line pointing there so the
   two screens are never confused for each other. */

/* The roster, in a stable order that a reader can scan: admins first (knowing
   who to ask is the main reason to open this), then everybody else by name.
   NOT by role generally — 'Editor' above 'Viewer' would be a hierarchy this
   product does not otherwise draw. */
function dirPeople(){
  const users=((typeof getUsers==='function'?getUsers():[])||[]).slice();
  const key=u=>String(u.name||u.email||'').toLocaleLowerCase();
  return users.sort((a,b)=>{
    const aa=a.role==='admin'?0:1, bb=b.role==='admin'?0:1;
    if(aa!==bb) return aa-bb;
    return key(a)<key(b)?-1:key(a)>key(b)?1:0;
  });
}

/* ---- THE DRAWING'S TABLE (SAP benchmark, batch 2 — the owner's "go", 9 Oct
   2026) ---- Name (initials beside it), Job title, Role as a pill, Email, in
   four columns under a card head carrying the count, a search box and, for
   an admin, "Manage in Settings ›". The sentence under the list went: the
   admin has the door, and the list says it is a list by being one. A missing
   job title is a dash, its words on the hover. */
function dirRowHtml(u){
  const me=(typeof currentUser==='function'?currentUser():null)||{};
  const ini=String(u.name||u.email||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const mail=String(u.email||'').trim();
  const role=(typeof roleName==='function')?roleName(u.role):(u.role||'');
  const hay=[u.name,mail,u.title,role].filter(Boolean).join(' ').toLocaleLowerCase();
  return `<tr class="dir-row" data-dir-row="${esc(u.id||'')}" data-dir-hay="${esc(hay)}">
    <td><span class="dir-who"><span class="dir-av">${esc(ini)}</span><span class="dir-name">${esc(u.name||mail||'—')}${
        u.id&&u.id===me.id?` <span class="dir-you">${i18t('set_you')}</span>`:''}</span></span></td>
    <td class="dir-title">${u.title?esc(u.title):`<span class="dir-none" title="${esc(i18t('dir_no_title'))}">—</span>`}</td>
    <td><span class="dir-role reg-stg ins-pill"><i aria-hidden="true"></i>${esc(role)}</span></td>
    ${''/* THE ADDRESS IS A LINK, because a directory you cannot act on is a
           list. mailto is the one press on this page and it leaves the app
           rather than changing anything in it. */}
    <td class="dir-mail">${mail
      ? `<a href="mailto:${esc(mail)}">${esc(mail)}</a>`
      : `<span class="dir-none">${i18t('dir_no_email')}</span>`}</td>
  </tr>`;
}

function renderDirectory(){
  const host=document.getElementById('content'); if(!host) return;
  const people=dirPeople();
  const admin=(typeof isAdmin==='function')&&isAdmin();
  const ic=n=>(typeof icon==='function')?icon(n,'w-3.5 h-3.5'):'';
  host.innerHTML=`
  <div id="dir-page" class="view-enter sap-page">
    <div class="sap-band dir-band" aria-hidden="true"></div>
    <section class="dir-card">
      <div class="ins-cardhead dir-head">
        <h2 class="ins-cardhead-t">${esc(i18t('nav_people'))} <span class="ins-cardhead-n">(${people.length})</span></h2>
        <span style="flex:1"></span>
        <label class="ik-search">${ic('search')}<input type="search" id="dir-q" placeholder="${esc(i18t('dir_search_ph'))}" aria-label="${esc(i18t('dir_search_ph'))}"></label>
        ${''/* AN ADMIN IS TOLD WHERE THE EDITING IS. Non-admins are told
               nothing, because there is nowhere for them to go. */}
        ${admin?`<button id="dir-manage" class="ui-link">${esc(i18t('dir_manage_settings'))}${ic('chevR')}</button>`:''}
      </div>
      ${people.length?`<table class="dir-table"><colgroup><col><col style="width:18%"><col style="width:16%"><col style="width:30%"></colgroup>
        <thead><tr><th>${esc(i18t('dir_col_name'))}</th><th>${esc(i18t('dir_col_title'))}</th><th>${esc(i18t('dir_col_role'))}</th><th>${esc(i18t('dir_col_email'))}</th></tr></thead>
        <tbody class="dir-rows">${people.map(dirRowHtml).join('')}</tbody></table>
        <p class="dir-empty" id="dir-none-match" hidden>${esc(i18t('dir_none_match'))}</p>`
      : (typeof window.emptyStateHtml==='function'
        ? window.emptyStateHtml({ icon:'users', title:i18t('dir_empty') })
        : `<p class="dir-empty">${i18t('dir_empty')}</p>`)}
    </section>
  </div>`;
  document.getElementById('dir-manage')?.addEventListener('click',()=>{
    if(typeof openSettingsAt==='function') openSettingsAt('people');
  });
  /* THE SEARCH NARROWS IN PLACE: rows are hidden, never redrawn, so the box
     keeps the caret and nothing else on the page moves. */
  document.getElementById('dir-q')?.addEventListener('input',e=>{
    const q=String(e.target.value||'').trim().toLocaleLowerCase();
    let shown=0;
    document.querySelectorAll('#dir-page [data-dir-row]').forEach(tr=>{
      const hit=!q||String(tr.getAttribute('data-dir-hay')||'').includes(q);
      tr.hidden=!hit; if(hit) shown++;
    });
    const none=document.getElementById('dir-none-match'); if(none) none.hidden=shown>0;
  });
}

Object.assign(window,{renderDirectory,dirPeople,dirRowHtml});
