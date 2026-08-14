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

function dirRowHtml(u){
  const me=(typeof currentUser==='function'?currentUser():null)||{};
  const ini=String(u.name||u.email||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const mail=String(u.email||'').trim();
  return `<div class="dir-row" data-dir-row="${esc(u.id||'')}">
    <span class="dir-av">${esc(ini)}</span>
    <span class="dir-main">
      <span class="dir-name">${esc(u.name||mail||'—')}${
        u.id&&u.id===me.id?` <span class="dir-you">${i18t('set_you')}</span>`:''}</span>
      <span class="dir-title">${u.title?esc(u.title):`<span class="dir-none">${i18t('dir_no_title')}</span>`}</span>
    </span>
    <span class="dir-role">${esc((typeof roleName==='function')?roleName(u.role):(u.role||''))}</span>
    ${''/* THE ADDRESS IS A LINK, because a directory you cannot act on is a
           list. mailto is the one press on this page and it leaves the app
           rather than changing anything in it. */}
    <span class="dir-mail">${mail
      ? `<a href="mailto:${esc(mail)}">${esc(mail)}</a>`
      : `<span class="dir-none">${i18t('dir_no_email')}</span>`}</span>
  </div>`;
}

function renderDirectory(){
  const host=document.getElementById('content'); if(!host) return;
  const people=dirPeople();
  const admin=(typeof isAdmin==='function')&&isAdmin();
  host.innerHTML=`
  <div id="dir-page" class="view-enter" style="max-width:860px">
    <section class="dir-card">
      <div class="dir-head">
        <span class="dir-head-n">${i18tn('dir_count',people.length,{n:people.length})}</span>
        ${''/* AN ADMIN IS TOLD WHERE THE EDITING IS. Two screens listing the
               same people, one of which edits them, is exactly the confusion
               worth one sentence. Non-admins are told nothing, because there
               is nowhere for them to go. */}
        ${admin?`<button id="dir-manage" class="ui-btn" style="margin-left:auto;font-size:11.5px;padding:4px 12px">${
          i18t('dir_manage')}</button>`:''}
      </div>
      <div class="dir-rows">${people.map(dirRowHtml).join('')||`<p class="dir-empty">${i18t('dir_empty')}</p>`}</div>
      <p class="dir-note">${esc(i18t('dir_note'))}</p>
    </section>
  </div>`;
  document.getElementById('dir-manage')?.addEventListener('click',()=>{
    if(typeof openSettingsAt==='function') openSettingsAt('people');
  });
}

Object.assign(window,{renderDirectory,dirPeople,dirRowHtml});
