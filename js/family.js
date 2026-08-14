// HaTi — contract families: a master agreement and its amendments.
//
// Globals are window-attached on purpose (single global scope; see core.js).
//
// A real portfolio is one master agreement plus six addenda. Treated as seven
// standalone contracts, HaTi counts seven agreements and pulls the expiry from
// whichever document happened to be filed rather than from the amendment that
// actually changed the term — so both the portfolio count and the renewal
// reminders come out wrong.
//
// Data model, deliberately flat:
//   c.parentId      the agreement this document amends (null for a parent)
//   c.relation      amendment | addendum | variation | renewal | sow | annex | side-letter
//   c.relationNote  free text — what the link is, in a human's words
//
// Maximum depth is ONE. Children cannot have children, and cycles are rejected.
// This is a deliberate simplification: a tree would be more general and much
// harder to reason about in the register, the reminders and the KPIs.

const CONTRACT_RELATIONS = [
  { k:'amendment',   get label(){ return i18t('fa_amendment'); },   get blurb(){ return i18t('fa_amendment_desc'); } },
  { k:'addendum',    get label(){ return i18t('fa_addendum'); },    get blurb(){ return i18t('fa_addendum_desc'); } },
  { k:'variation',   get label(){ return i18t('fa_variation'); },   get blurb(){ return i18t('fa_variation_desc'); } },
  { k:'renewal',     get label(){ return i18t('fa_renewal'); },     get blurb(){ return i18t('fa_renewal_desc'); } },
  { k:'sow',         get label(){ return i18t('fa_sow'); }, get blurb(){ return i18t('fa_sow_desc'); } },
  { k:'annex',       get label(){ return i18t('fa_annex'); },  get blurb(){ return i18t('fa_annex_desc'); } },
  { k:'side-letter', get label(){ return i18t('fa_side_letter'); }, get blurb(){ return i18t('fa_side_letter_desc'); } },
];
const RELATION_LABEL = Object.fromEntries(CONTRACT_RELATIONS.map(r=>[r.k,r.label]));
const isRelation = r => CONTRACT_RELATIONS.some(x=>x.k===r);
/* "a addendum" / "a annex" — the audit line below reads the relation's own
   label, and four of the seven begin with a vowel. A record is read by people. */
const _famAn = w => (/^[aeiou]/i.test(String(w||'').trim()) ? 'an' : 'a');
/* Relations that can move the end of the term. A parent's effective expiry is
   taken from the most recent of these that actually states one. */
const TERM_CHANGING = new Set(['amendment','variation','renewal','addendum']);

const isChild  = c => !!(c && c.parentId);
const isParent = c => !!(c && !c.parentId && familyChildren(c.id).length);
const familyChildren = id => state.contracts.filter(c=>c.parentId===id);
const familyParent = c => (c && c.parentId) ? getContract(c.parentId) : null;
/* The whole family, parent first. A standalone contract is a family of one. */
function familyOf(c){
  if(!c) return [];
  const head = c.parentId ? (getContract(c.parentId)||c) : c;
  return [head, ...familyChildren(head.id)];
}

/* ---------- linking rules ----------
   Returns an error string, or null when the link is allowed. */
function linkError(child, parentId){
  if(!child) return 'No contract to link.';
  if(!parentId) return 'Choose a parent agreement.';
  if(parentId===child.id) return 'A contract cannot be its own parent.';
  const parent=getContract(parentId);
  if(!parent) return 'That parent agreement no longer exists.';
  if(parent.parentId) return `${parent.id} is itself an amendment of ${parent.parentId}. Link to the master agreement instead — HaTi keeps families one level deep on purpose.`;
  if(familyChildren(child.id).length) return `${child.id} already has ${familyChildren(child.id).length} amendment(s) of its own, so it is a master agreement. Move those first if it should become an amendment.`;
  return null;
}
/* Apply the link to a contract object (does NOT persist — callers do, so this
   works both on a contract being built during import and on a saved one). */
function applyParentLink(c, parentId, relation, note, actor){
  c.parentId = parentId;
  c.relation = isRelation(relation) ? relation : 'amendment';
  if(note!=null) c.relationNote = String(note);
  const who = (actor && actor.name) || currentUser()?.name || 'System';
  c.audit = c.audit || [];
  const word=RELATION_LABEL[c.relation].toLowerCase();
  c.audit.push({ at:nowISO(), user:who, action:'Linked',
    detail:`Filed as ${_famAn(word)} ${word} of ${parentId}${note?` — ${note}`:''}` });
  return c;
}
/* Undo a link. */
function clearParentLink(c, actor){
  const was=c.parentId;
  delete c.parentId; delete c.relation; delete c.relationNote;
  c.audit=c.audit||[];
  c.audit.push({ at:nowISO(), user:(actor&&actor.name)||currentUser()?.name||'System', action:'Unlinked',
    detail:`No longer filed as an amendment of ${was} — recorded as a standalone agreement` });
  return c;
}

/* ---------- family-aware term resolution ----------
   THE point of the whole task. A master agreement's real end date is whatever
   the most recent amendment that changed the term says it is — not whatever was
   typed on the master. Every consumer of an expiry date must go through here:
   the renewal reminders, contractRisk, the Home attention snapshot, the
   Register, the Calendar and Reports. A partial rollout leaves the reminders
   wrong, which is the defect this exists to fix. */
/* NORMALISED HERE, because here is where everything reads it.

   The header above says every consumer must come through this funnel, and they
   do — and the funnel was handing out whatever was typed. A migration that
   filed "30 September 2026" therefore reached the Register as `new Date(…)`
   Invalid, and the expiry column on an otherwise ordinary row printed the words
   "Invalid Date". Everywhere the value met `daysUntil` it became NaN instead,
   and NaN compares false against everything: the contract fell out of Home's
   expiring-in-30/60/90 buckets, out of the twelve-month renewal pipeline in
   Reports, and sorted behind contracts with no expiry at all.

   dateOnly() is the same normaliser the renewal decision and the calendar grid
   already use, so all of them are now working on one value. Null — "we do not
   know when this ends" — is a real answer that every caller here handles. */
const ownExpiry = c => (window.dateOnly
  ? dateOnly(c && ((c.metadata&&c.metadata.expiryDate) || c.expiry))
  : ((c && ((c.metadata&&c.metadata.expiryDate) || c.expiry)) || null));
/* When an amendment took effect — used to order them. Falls back through the
   dates a migrated document actually tends to carry. */
const amendmentDate = c => (c&&((c.metadata&&c.metadata.effectiveDate) || (c.fields&&c.fields.effDate) ||
  (c.signedAt&&String(c.signedAt).slice(0,10)) || (c.migration&&c.migration.importedAt&&String(c.migration.importedAt).slice(0,10)))) || '';
function effectiveExpiry(c){
  if(!c) return null;
  if(c.parentId) return ownExpiry(c);          // a child speaks only for itself
  const kids=familyChildren(c.id)
    .filter(k=>k.status!=='Declined' && TERM_CHANGING.has(k.relation) && ownExpiry(k));
  if(!kids.length) return ownExpiry(c);
  // most recent amendment that actually states a term wins
  kids.sort((a,b)=> String(amendmentDate(a)).localeCompare(String(amendmentDate(b))) ||
                    String(ownExpiry(a)).localeCompare(String(ownExpiry(b))));
  return ownExpiry(kids[kids.length-1]);
}
/* Which contract supplied the effective expiry — so the UI can say "expiry from
   MK-123 (Amendment No. 2)" instead of quietly showing a different date. */
function expirySource(c){
  if(!c || c.parentId) return null;
  const eff=effectiveExpiry(c);
  if(!eff || eff===ownExpiry(c)) return null;
  return familyChildren(c.id).find(k=>ownExpiry(k)===eff) || null;
}

/* ---------- family-aware counting ----------
   KPIs count AGREEMENTS (parents + standalones), not files. Both numbers are
   shown, because "312 agreements · 418 documents" is the honest statement and
   either number alone is misleading. */
const isAgreement = c => !c.parentId;
const agreementsIn = list => (list||state.contracts).filter(isAgreement);
function familyCounts(list){
  const cs=list||state.contracts;
  const documents=cs.length;
  const agreements=cs.filter(isAgreement).length;
  return { agreements, documents, amendments: documents-agreements };
}
const familyCountLabel = list => { const k=familyCounts(list);
  return k.amendments
    ? `${k.agreements.toLocaleString(jxLocale())} agreement${k.agreements===1?'':'s'} · ${k.documents.toLocaleString(jxLocale())} documents`
    : `${k.documents.toLocaleString(jxLocale())} contract${k.documents===1?'':'s'}`; };

/* ---------- suggest, never auto-link ----------
   At import we PROPOSE a parent when the filename or the opening text reads
   like an amendment AND the normalised counterparty matches an existing
   contract. A human confirms on the review screen; the suggestion and the
   decision are logged separately, so the audit trail never claims a person
   confirmed something the machine guessed. */
const AMENDMENT_RE = /amendment|addendum|variation|annex|schedule \d|side letter|renewal of|supplemental/i;
function looksLikeAmendment(fileName, text){
  const head=String(text||'').slice(0,4000);
  return AMENDMENT_RE.test(String(fileName||'')) || AMENDMENT_RE.test(head);
}
/* Which relation the wording suggests. Defaults to 'amendment'. */
function guessRelation(fileName, text){
  const s=(String(fileName||'')+' '+String(text||'').slice(0,2000)).toLowerCase();
  if(/side letter/.test(s)) return 'side-letter';
  if(/statement of work|\bsow\b/.test(s)) return 'sow';
  if(/renewal of|renewal agreement/.test(s)) return 'renewal';
  if(/variation/.test(s)) return 'variation';
  if(/annex|schedule \d/.test(s)) return 'annex';
  if(/addendum|supplemental/.test(s)) return 'addendum';
  return 'amendment';
}
/* Rank candidate parents. Signals, in order of weight:
     - the opening recitals name the parent's agreement name or a date it carries
     - SimHash similarity to the candidate parent (reuses Task 5's signal)
     - the parent is the more established record (earlier, executed)
   Returns [{ id, score, why }], best first, or [] when nothing matches. */
function suggestParents(cand, opts={}){
  const cp=normParty(cand.counterparty);
  if(!cp) return [];
  const head=String(cand.text||'').slice(0,4000).toLowerCase();
  const out=[];
  for(const c of state.contracts){
    if(c.id===cand.excludeId) continue;
    if(c.parentId) continue;                       // depth one — never a child
    if(normParty(c.counterparty)!==cp) continue;
    let score=0; const why=[];
    const d=hamming64(cand.simhash, (c.upload&&c.upload.simhash)||null);
    if(d<=SIMHASH_RELATED){ score += (SIMHASH_RELATED-d)*4; why.push(`closely related text (distance ${d})`); }
    const nm=String(c.name||'').toLowerCase().replace(/\s*\(draft\)\s*$/,'').trim();
    if(nm.length>8 && head.includes(nm)){ score+=40; why.push('the recitals name this agreement'); }
    for(const dt of [c.expiry, (c.metadata&&c.metadata.effectiveDate), (c.fields&&c.fields.effDate)]){
      if(dt && head.includes(String(dt))){ score+=25; why.push(`the recitals cite ${dt}`); break; }
    }
    if(c.status==='Signed'){ score+=6; why.push('executed'); }
    if(!score) score=1, why.push('same counterparty');
    out.push({ id:c.id, name:c.name, score, why:why.join(' · ') });
  }
  out.sort((a,b)=>b.score-a.score);
  return out.slice(0, opts.max||4);
}
/* Record that the machine proposed a link — separately from a human accepting
   or rejecting it. */
function logLinkSuggestion(c, suggestions){
  if(!suggestions||!suggestions.length) return;
  c.audit=c.audit||[];
  c.audit.push({ at:nowISO(), user:'System', action:'Link suggested',
    detail:`Reads like an amendment; proposed parent${suggestions.length===1?'':'s'}: `+
      suggestions.map(s=>`${s.id} (${s.why})`).join('; ')+'. Not linked — awaiting a human decision.' });
  c.linkSuggestions=suggestions.map(s=>({ id:s.id, why:s.why }));
}
function logLinkDecision(c, accepted, parentId){
  c.audit=c.audit||[];
  c.audit.push({ at:nowISO(), user:currentUser()?.name||'System', action:'Link decision',
    detail: accepted ? `Confirmed as an amendment of ${parentId}` : 'Confirmed as a standalone agreement — the suggested link was rejected' });
  c.linkConfirmed=true;
  if(!accepted) c.linkSuggestions=null;
}

/* ---------- manual linking ----------
   "Link to a parent agreement" from any contract workspace, and the reverse
   ("Add an amendment") from a parent. One modal serves both directions. */
const _famEsc = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
const _famAttr = s => String(s==null?'':s).replace(/"/g,'&quot;');
function openLinkModal(c, onDone, opts={}){
  if(!canEdit()){ toast(i18t('fa_viewers_no_change'),'err'); return; }
  // `mode` is 'child' (pick a parent for c) or 'parent' (pick a child to attach to c)
  const mode = opts.mode || (c.parentId ? 'child' : 'child');
  const suggested = (c.linkSuggestions||[]).map(s=>({ ...s, c:getContract(s.id) })).filter(x=>x.c);
  const relSel = `<select id="lk-rel" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 8px;font:inherit;font-size:13px">
      ${CONTRACT_RELATIONS.map(r=>`<option value="${r.k}" ${(c.relationGuess||c.relation||'amendment')===r.k?'selected':''}>${r.label} — ${r.blurb}</option>`).join('')}</select>`;
  const candidates = state.contracts.filter(x=>x.id!==c.id && (mode==='child' ? !x.parentId : (!x.parentId||x.parentId===c.id)));
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('link','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${mode==='child'?i18t('fa_link_parent'):i18t('fa_link_existing')}</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.55">${mode==='child'
        ? `File <b>${_famEsc(c.id)}</b> as part of an existing agreement. The parent's renewal date, risk and KPI count then reflect the family — a master agreement plus its amendments is <b>one</b> agreement, not several.`
        : `Attach an existing document to <b>${_famEsc(c.id)}</b> as an amendment. Families are one level deep: an amendment cannot itself have amendments.`}</p>
      ${suggested.length?`<div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:5px;padding:9px 11px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:600;color:var(--color-accent-800);margin-bottom:5px">${i18t('fa_hati_suggests')}</div>
        ${suggested.map(x=>`<label style="display:flex;align-items:flex-start;gap:8px;font-size:11.5px;padding:3px 0;cursor:pointer">
          <input type="radio" name="lk-sug" value="${_famAttr(x.id)}" style="margin-top:3px;accent-color:var(--color-accent)"/>
          <span><b style="font-family:var(--font-mono)">${_famEsc(x.id)}</b> ${_famEsc(x.c.name)}
          <span style="display:block;color:var(--color-neutral-600)">${_famEsc(x.why||'')}</span></span></label>`).join('')}
      </div>`:''}
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${mode==='child'?'Parent agreement':'Document to attach'}</span>
        <input id="lk-search" placeholder="${i18t('fa_search_register')}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/>
        <div id="lk-results" class="scroll-thin" style="max-height:180px;overflow-y:auto;border:1px solid var(--color-divider);border-top:0;border-radius:0 0 4px 4px"></div></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('fa_relationship')}</span>${relSel}</label>
      <label style="display:block;margin-bottom:14px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('fa_note_optional')}</span>
        <input id="lk-note" placeholder="${_famEsc(i18t('fa_ph_link_note'))}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/></label>
      <div id="lk-err" style="font-size:11px;color:var(--st-ruby-fg);min-height:15px;margin-bottom:8px"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        ${(mode==='child'&&suggested.length)?`<button id="lk-standalone" class="ui-btn">${i18t('fa_standalone')}</button>`:''}
        <button id="lk-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <button id="lk-save" class="ui-btn ui-btn-primary">${mode==='child'?'Link':'Attach'}</button>
      </div>
    </div>`, {maxWidth:'560px'});

  let picked=null;
  const results=document.getElementById('lk-results');
  const draw=(q)=>{
    const t=String(q||'').toLowerCase();
    const list=candidates.filter(x=>!t || (x.name+' '+(x.counterparty||'')+' '+x.id).toLowerCase().includes(t)).slice(0,40);
    results.innerHTML=list.length?list.map(x=>`<button type="button" data-lk-pick="${_famAttr(x.id)}" style="display:flex;width:100%;gap:8px;align-items:baseline;text-align:left;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);background:${picked===x.id?'var(--color-accent-100)':'none'};padding:6px 9px;cursor:pointer;font:inherit;font-size:11.5px">
        <b style="font-family:var(--font-mono);flex:none">${_famEsc(x.id)}</b>
        <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_famEsc(x.name)}</span>
        <span style="flex:none;color:var(--color-neutral-600)">${_famEsc(x.counterparty||'')}</span></button>`).join('')
      :`<div style="padding:8px 9px;font-size:11.5px;color:var(--color-neutral-600)">${i18t('fa_no_matching')}</div>`;
    results.querySelectorAll('[data-lk-pick]').forEach(b=>b.addEventListener('click',()=>{ picked=b.getAttribute('data-lk-pick'); draw(document.getElementById('lk-search').value); }));
  };
  draw('');
  document.getElementById('lk-search').addEventListener('input',e=>draw(e.target.value));
  document.querySelectorAll('input[name="lk-sug"]').forEach(r=>r.addEventListener('change',()=>{ picked=r.value; draw(document.getElementById('lk-search').value); }));
  document.getElementById('lk-cancel').addEventListener('click',closeModal);
  document.getElementById('lk-standalone')?.addEventListener('click',()=>{
    logLinkDecision(c, false); persist(c); closeModal();
    toast(`${c.id} confirmed as a standalone agreement`); if(onDone) onDone();
  });
  document.getElementById('lk-save').addEventListener('click',()=>{
    const err=document.getElementById('lk-err');
    if(!picked){ err.textContent='Pick a contract first.'; return; }
    const child = mode==='child' ? c : getContract(picked);
    const parentId = mode==='child' ? picked : c.id;
    const problem=linkError(child, parentId);
    if(problem){ err.textContent=problem; return; }
    applyParentLink(child, parentId, document.getElementById('lk-rel').value, document.getElementById('lk-note').value.trim());
    logLinkDecision(child, true, parentId);
    persist(child);
    const parent=getContract(parentId); if(parent) persist(parent);
    closeModal();
    const w=RELATION_LABEL[child.relation].toLowerCase();
    toast(`${child.id} filed as ${_famAn(w)} ${w} of ${parentId}`);
    if(onDone) onDone(); else if(typeof setView==='function') setView(state.view||'workspace');
  });
}
/* ---------- the family panel on a contract workspace ----------
   Shows where this document sits, which amendment set the live term, and both
   directions of the manual link. */
function renderFamilySection(c){
  const host=document.getElementById('family-section'); if(!host) return;
  if(!c){ host.innerHTML=''; return; }
  const kids=familyChildren(c.id), parent=familyParent(c);
  const suggested=(c.linkSuggestions||[]).filter(s=>getContract(s.id));
  const eff=effectiveExpiry(c), from=expirySource(c);
  const btn='font:inherit;font-size:11.5px;font-weight:600;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:5px 11px;cursor:pointer';
  const row=(x,note)=>`<button type="button" data-fam-open="${_famAttr(x.id)}" style="display:flex;width:100%;gap:8px;align-items:baseline;text-align:left;border:0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);background:none;padding:6px 0;cursor:pointer;font:inherit;font-size:12px;color:inherit">
      <b style="font-family:var(--font-mono);font-size:11px;color:var(--color-accent-700);flex:none">${_famEsc(x.id)}</b>
      <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_famEsc(x.name)}</span>
      <span style="flex:none;font-size:10.5px;color:var(--color-neutral-600)">${_famEsc(note||'')}</span></button>`;
  /* ---- THE BUTTONS ARE A ROW OF THEIR OWN, UNDER THE HEAD ----
     They were in the head beside the title, which was room enough for two. A
     standalone agreement now offers three acts — write one, attach one, file
     this under a master — and the primary among them has to be able to say
     "Create an amendment" without being folded to a stub.

     WHICH THREE, AND WHY THE SET DIFFERS. Create and Link-an-existing are
     offered wherever a document can HAVE children: a parent or a standalone.
     "Link to a parent agreement" is offered on a STANDALONE only — linkError
     already refuses it for a master ("it already has N amendments of its own"),
     and a control whose only outcome is a refusal is furniture. A child gets
     neither: families are one level deep, so the only act on it is Unlink. */
  const acts=[];
  if(canEdit() && !parent){
    acts.push(`<button id="fam-create" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:5px 11px">${icon('file-plus','w-3 h-3')} ${i18t('fa_create_amendment')}</button>`);
    acts.push(`<button id="fam-add" style="${btn}">${i18t('fa_link_existing')}</button>`);
    if(!kids.length) acts.push(`<button id="fam-link" style="${btn}">${i18t('fa_link_parent')}</button>`);
  }
  host.innerHTML=`
    <div style="padding:16px 18px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="color:var(--color-accent)">${icon('link','w-4 h-4')}</span>
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0">${i18t('fa_agreement_family')}</h4>
        <span style="flex:1"></span>
        ${(canEdit()&&parent)
          ? `<button id="fam-unlink" style="${btn};border-color:var(--st-ruby-line);color:var(--st-ruby-fg)">${i18t('fa_unlink')}</button>`:''}
      </div>
      ${acts.length?`<div class="fam-acts">${acts.join('')}</div>`:''}
      ${parent
        /* The label is NOT lowercased here any more, and the sentence lost its
           indefinite article with it: English wants a/an by the following word
           ("a addendum", "a annex") and Swedish en/ett by the noun's own
           gender, and the seven relations split both ways. Read as a filing
           designation — "filed as Addendum of MK-1042" — neither needs one. */
        ? `<p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.55">${i18t('fa_filed_as')} <b>${_famEsc(RELATION_LABEL[c.relation]||'Amendment')}</b> of <b>${_famEsc(parent.id)}</b>${c.relationNote?` — ${_famEsc(c.relationNote)}`:''}. It does not count as a separate agreement in the KPIs, and its renewal reminder fires on the parent.</p>
           <div class="fam-list">${row(parent,'parent agreement')}</div>`
        : kids.length
        ? `<p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.55">${i18t('fa_this_is_a')} ${i18tn('fa_master_with',kids.length,{n:kids.length})} The family counts as <b>one agreement · ${kids.length+1} documents</b>.${from?` The live expiry <b>${_famEsc(eff)}</b> comes from <b>${_famEsc(from.id)}</b>, not from this document's own date${ownExpiry(c)?` of ${_famEsc(ownExpiry(c))}`:''}.`:''}</p>
           <div class="fam-list">${kids.map(k=>row(k, `${RELATION_LABEL[k.relation]||'Amendment'}${ownExpiry(k)?' · term to '+ownExpiry(k):''}`)).join('')}</div>`
        : `<p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.55">${i18t('fa_standalone_desc')}</p>`}
      ${(suggested.length&&!c.parentId&&!c.linkConfirmed)?`
        <div style="margin-top:10px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:5px;padding:9px 11px">
          <div style="font-size:11px;font-weight:600;color:var(--st-amber-fg);margin-bottom:3px">${i18t('fa_reads_like_amendment')}</div>
          <div style="font-size:11.5px;color:var(--st-amber-fg);line-height:1.5">${i18t('fa_hati_proposed',{ids:suggested.map(s=>`<b>${_famEsc(s.id)}</b>`).join(', ')})} <b>${i18t('fa_nothing_linked')}</b>${i18t('fa_confirm_or_standalone')}</div>
          ${canEdit()?`<div style="display:flex;gap:6px;margin-top:8px"><button id="fam-confirm" style="${btn};border-color:var(--color-accent);color:var(--color-accent-800)">${i18t('fa_review_suggestion')}</button>
            <button id="fam-standalone" style="${btn}">${i18t('fa_its_standalone')}</button></div>`:''}
        </div>`:''}
    </div>`;
  const again=()=>{ renderFamilySection(getContract(c.id)); if(typeof renderAuditSection==='function') renderAuditSection(getContract(c.id)); };
  host.querySelectorAll('[data-fam-open]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-fam-open'))));
  document.getElementById('fam-link')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'child'}));
  document.getElementById('fam-confirm')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'child'}));
  document.getElementById('fam-add')?.addEventListener('click',()=>openLinkModal(c, again, {mode:'parent'}));
  document.getElementById('fam-create')?.addEventListener('click',()=>openCreateAmendmentModal(c));
  document.getElementById('fam-unlink')?.addEventListener('click',()=>unlinkContract(c, again));
  document.getElementById('fam-standalone')?.addEventListener('click',()=>{
    logLinkDecision(c,false); persist(c); toast(`${c.id} confirmed as a standalone agreement`); again();
    if(typeof updateSidebarCounts==='function') updateSidebarCounts();
  });
}

/* ============================================================
   WRITING AN AMENDMENT FROM BLANK PAPER
   ============================================================
   Until now the only way to get an amendment into HaTi was to write it
   somewhere else and attach the file. "Link an existing document" is that act
   and it is unchanged. This is the other half: a NEW draft, on our letterhead,
   filed against its parent from the moment it exists, negotiated and signed
   like any other contract.

   THE POINT OF THE WHOLE THING IS THAT NOTHING AFTER THIS IS NEW. A document
   made entirely of inserted clauses is a document the negotiation page has
   always known how to write. So this function's job ends the moment a valid
   draft is on the record — no second editor, no amendment mode, no special
   round. What it must get right is the START: the link, the parties, the
   letterhead, and a body the rest of the product can read.

   AND IT DOES NOT REGISTER roomOpenOnTerms. That rule exists because a new
   draft's document is a template full of blanks fed from the terms, so landing
   on the document shows somebody the output of a form they have not filled in.
   Neither half is true here: every term this document inherits is already
   filled in from the parent, and the document is the empty thing the reader
   pressed the button to go and write. See wsTabDefaults, and f170, which names
   this file as the one creation site that lands on the document and asserts it
   rather than leaving the exception to be discovered. */

/* The word the DOCUMENT uses for each relation, in English. Deliberately not
   RELATION_LABEL: that is the SCREEN's word, it is built from getters at load
   time, and it follows the reader's language. This one is stamped into the
   contract's name, which is a record — it goes on the paper, into the register
   and into every list, and a record keeps English (the rulebook's own rule,
   the same one ROLE_LABEL follows). */
const RELATION_DOC_WORD = { amendment:'Amendment', addendum:'Addendum', variation:'Variation',
  renewal:'Renewal', sow:'Statement of Work', annex:'Annex', 'side-letter':'Side Letter' };
/* Which number this one is: how many of the SAME kind already hang off this
   parent, plus one. Counted per relation rather than across the family, because
   "Amendment No. 2" is wrong on a document that follows one amendment and three
   annexes. Declined documents still count — No. 2 was issued even if it died,
   and reusing its number is how two documents come to share a name. */
function amendmentOrdinal(parent, relation){
  const rel = isRelation(relation) ? relation : 'amendment';
  return familyChildren(parent.id).filter(k=>(k.relation||'amendment')===rel).length + 1;
}
function amendmentDefaultName(parent, relation){
  const rel = isRelation(relation) ? relation : 'amendment';
  const word = RELATION_DOC_WORD[rel] || 'Amendment';
  const base = String((parent&&parent.name)||'').replace(/\s*\(draft\)\s*$/i,'').trim();
  return `${word} No. ${amendmentOrdinal(parent, rel)}${base?` to ${base}`:''}`;
}
/* A body of one empty line. NOT an empty string and NOT '<p></p>': the first
   sends docBody down the built-in-template branch (which drafts a whole NDA and
   then reads a `kind` off a template that is not there), and the second is
   dropped by the sanitiser, which lands back on the first. One <br> survives
   sanitising, renders as blank paper, and gives the negotiation a body to
   stamp clause ids into. */
const FAMILY_BLANK_BODY = '<p><br></p>';
/* The four lines an amendment conventionally opens and closes with.

   IN ENGLISH, ALWAYS, and that is not an oversight: all twelve built-in
   templates draft their paper in English whatever language the reader has
   chosen (docBody's BUILD), and the document's own title is built from
   RELATION_DOC_WORD above for the same reason. A skeleton that followed the
   reader would put a Swedish body under an English title on a page the
   counterparty reads. Every word is editable the moment it is drawn.

   THEY ARE NOT DECORATION. The opening recitals are how a reader on the other
   side knows which agreement is being changed, and they are what HaTi itself
   reads later — see looksLikeAmendment and suggestParents, which match on
   exactly this shape when the same document comes back through an import. */
function amendmentSkeletonBody(parent, opts={}){
  const rel = isRelation(opts.relation) ? opts.relation : 'amendment';
  const word = RELATION_DOC_WORD[rel] || 'Amendment';
  const ord = opts.ordinal || 1;
  /* Our own entity ON THIS PAPER, which is contractParty's answer written out
     rather than borrowed: the child copies parent.party, so both documents in
     the family name the same signatory, and this reads it from the same place
     with no dependency on a module that may not be on the floor. */
  const us = _famEsc(String((parent&&parent.party) || window.FIRST_PARTY || '').trim());
  const them = _famEsc(String((parent&&parent.counterparty)||'').trim());
  const pname = _famEsc(String((parent&&parent.name)||'').replace(/\s*\(draft\)\s*$/i,'').trim());
  const eff = (parent&&((parent.metadata&&parent.metadata.effectiveDate)||(parent.fields&&parent.fields.effDate)||parent.signedAt))||'';
  /* Written the way the paper writes a date — "31 July 2026", never the date
     input's 2026-07-31. fmtDocDate is the one formatter for this and it reads
     a fixed month list, so the recital does not change wording with the
     reader's language. Null when it is not a date we can print, in which case
     the sentence simply names the agreement and no date. */
  const effDoc = eff && window.fmtDocDate ? fmtDocDate(String(eff).slice(0,10)) : null;
  const dated = effDoc ? ` dated ${_famEsc(effDoc)}` : '';
  const between = (us&&them) ? ` between <strong>${us}</strong> and <strong>${them}</strong>` : '';
  return [
    `<p>This ${word} No. ${ord} is made on ____________${between}.</p>`,
    `<p>The parties entered into the ${pname?`<strong>${pname}</strong>`:'agreement'}${dated} (the &ldquo;Agreement&rdquo;). The parties now wish to amend it.</p>`,
    `<p>The parties agree that the Agreement is amended as follows:</p>`,
    `<p>Except as amended above, all other terms of the Agreement remain in full force and effect.</p>`,
  ].join('');
}

/* Mint the draft. No UI, no navigation — returns the contract so the dialog can
   open it and a test can read it. Throws nothing: a refusal comes back as a
   string on `.error` rather than as an exception, because both callers want to
   print it rather than crash. */
function createAmendment(parent, opts={}){
  if(!parent) return { error:'No parent agreement.' };
  if(parent.parentId) return { error:i18t('fa_child_cannot_amend') };
  const rel = isRelation(opts.relation) ? opts.relation : 'amendment';
  const ord = amendmentOrdinal(parent, rel);
  const name = String(opts.name||'').trim() || amendmentDefaultName(parent, rel);
  const u = (typeof currentUser==='function' && currentUser()) || null;
  const who = u?.name || 'System';
  const c = {
    id: nextId(), name,
    /* CARRIED OVER — the facts that are the same agreement's facts. The other
       side and the address we have for them, our own legal entity on this
       paper (contractParty, not the workspace), the value stream it is filed
       under, and the letterhead. The MARKET is not copied because it is not on
       the record: law, currency and the statute checks are the workspace's own
       setting, so a new document is already in the right one. */
    counterparty: (parent.counterparty||''),
    party: parent.party || undefined,
    folder: parent.folder,
    branding: parent.branding || undefined,
    /* LEFT BLANK, DELIBERATELY. The wording, because blank paper is the point.
       The money, because an amendment either restates the figure or changes it
       and a copied one would be a guess wearing a fact's clothes — but WHETHER
       money passes is inherited, since an amendment to an NDA is no more likely
       to carry a figure than the NDA was (see isMonetary: the record wins, and
       this is the record saying something). The effective date, because this
       document starts when it starts. The obligations, because they belong to
       the document that created them. And who signs, because a signature is
       given to one arrangement and last year's signatory may have left. */
    value: 0, valueType: parent.valueType || 'estimated',
    status: 'Draft', template: null, source: 'amendment',
    lastAction: (typeof todayStr==='function'?todayStr():''), hash: null, signedAt: null,
    signatory: who, compliance: {},
    expiry: opts.expiry || null,
    fields: {}, scan: null, comments: [], signatures: [],
    format: 'rich',
    audit: [{ at:nowISO(), user:who, action:'Created',
      detail:`New ${(RELATION_DOC_WORD[rel]||'Amendment').toLowerCase()} written from blank paper against ${parent.id}`
        + (opts.expiry?` — states a term to ${opts.expiry}`:'')
        + (opts.skeleton===false?' — blank page':'') }],
  };
  if(parent.counterpartyEmail) c.counterpartyEmail = parent.counterpartyEmail;
  c.redlineText = (opts.skeleton===false)
    ? FAMILY_BLANK_BODY
    : amendmentSkeletonBody(parent, { relation:rel, ordinal:ord });
  /* FILED AGAINST THE PARENT IN THE SAME BREATH — there is no second step and
     no window in which this exists as a loose contract. applyParentLink writes
     its own audit line under the Created one above. */
  applyParentLink(c, parent.id, rel, opts.note||'', u);
  /* A person just made this on purpose, so there is nothing for HaTi to
     propose and nothing for anyone to confirm — the amber "this reads like an
     amendment" band is for documents that arrived, not for one written here. */
  c.linkConfirmed = true;
  c._loaded=true; c._light=false; c._v=0;
  /* WHO RAISED IT. The eighth creation site, and it owes this the same as the
     other seven — an amendment with no owner falls out of the dashboard's
     Decisions-due card and both of Reports' timing figures, which is the exact
     hole c.owner was added to close. See contractOwnerStamp (js/core.js): it
     stamps once and never overwrites. */
  if(window.contractOwnerStamp) contractOwnerStamp(c);
  state.contracts.unshift(c);
  persist(c);
  const p=getContract(parent.id); if(p) persist(p);
  return { contract:c };
}

/* The form. Everything answered already except the one question that cannot be
   guessed — whether this document moves the end of the term. */
function openCreateAmendmentModal(parent, onDone){
  if(!canEdit()){ toast(i18t('fa_viewers_no_change'),'err'); return; }
  if(!parent) return;
  if(parent.parentId){ toast(i18t('fa_child_cannot_amend'),'err'); return; }
  const FLD='width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none';
  const SEL='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 8px;font:inherit;font-size:13px';
  const LBL='display:block;font-size:11px;font-weight:600;margin-bottom:4px';
  const HINT='display:block;font-size:10.5px;font-weight:400;color:var(--color-neutral-600);margin-top:4px;line-height:1.45';
  const kids=familyChildren(parent.id).length;
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('filenew','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${i18t('fa_create_amendment')}</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;line-height:1.55">${i18t('fa_create_sub',{ref:`<b>${_famEsc(parent.id)} ${_famEsc(parent.name||'')}</b>`})}</p>

      <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('fa_kind_q')}</span>
        <select id="am-rel" style="${SEL}">${CONTRACT_RELATIONS.map(r=>
          `<option value="${r.k}" ${r.k==='amendment'?'selected':''}>${r.label} — ${r.blurb}</option>`).join('')}</select></label>

      <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('fa_name')}</span>
        <input id="am-name" value="${_famAttr(amendmentDefaultName(parent,'amendment'))}" style="${FLD}"/>
        ${kids?`<span style="${HINT}" id="am-name-hint">${i18tn('fa_name_hint',kids,{n:kids})}</span>`:''}</label>

      <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('fa_end_q')}</span>
        <input id="am-expiry" type="date" placeholder="${_famAttr(i18t('fa_end_unchanged'))}" style="${FLD}"/>
        <span style="${HINT}">${i18t('fa_end_unchanged')}. ${i18t('fa_end_hint')}</span></label>

      <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('fa_note_optional')}</span>
        <input id="am-note" placeholder="${_famAttr(i18t('fa_note_ph'))}" style="${FLD}"/></label>

      ${''/* THE ONE DECISION THAT WAS LEFT OPEN, PUT ON THE FORM RATHER THAN
             BAKED IN. Blank paper was asked for; the four-line skeleton is what
             a real amendment opens with and what HaTi reads to recognise one.
             Both are one press, the skeleton leads because it is the safer
             default, and unticking gives exactly the blank page. */}
      <label style="display:flex;align-items:flex-start;gap:8px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:5px;padding:9px 11px;margin-bottom:14px;cursor:pointer">
        <input type="checkbox" id="am-skeleton" checked style="margin-top:2px;flex:none;accent-color:var(--color-accent)"/>
        <span style="font-size:11.5px"><b>${i18t('fa_skeleton')}</b>
          <span style="display:block;color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${i18t('fa_skeleton_hint')}</span></span>
      </label>

      <div id="am-err" style="font-size:11px;color:var(--st-ruby-fg);min-height:15px;margin-bottom:8px"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button id="am-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <button id="am-go" class="ui-btn ui-btn-primary">${i18t('fa_create_open')}</button>
      </div>
    </div>`, {maxWidth:'520px'});

  const $=id=>document.getElementById(id);
  /* The name follows the kind until somebody types over it — an "Annex No. 1"
     called "Amendment No. 3" is a worse default than no default. Once the field
     has been edited by hand it is theirs and the kind stops rewriting it. */
  let nameTouched=false;
  $('am-name')?.addEventListener('input',()=>{ nameTouched=true; });
  $('am-rel')?.addEventListener('change',()=>{
    if(nameTouched) return;
    $('am-name').value = amendmentDefaultName(parent, $('am-rel').value);
  });
  $('am-cancel')?.addEventListener('click',closeModal);
  $('am-go')?.addEventListener('click',()=>{
    const err=$('am-err');
    const name=String($('am-name').value||'').trim();
    if(!name){ err.textContent=i18t('fa_needs_name'); return; }
    const expiry=String($('am-expiry').value||'').trim();
    if(expiry && !(window.dateOnly?dateOnly(expiry):/^\d{4}-\d{2}-\d{2}$/.test(expiry))){
      err.textContent=i18t('fa_bad_date'); return; }
    const made=createAmendment(parent,{
      relation:$('am-rel').value, name, expiry:expiry||null,
      note:String($('am-note').value||'').trim(),
      skeleton: !!$('am-skeleton').checked });
    if(made.error){ err.textContent=made.error; return; }
    closeModal();
    toast(i18t('fa_created',{ id:made.contract.id, pid:parent.id,
      rel:(RELATION_LABEL[made.contract.relation]||'Amendment').toLowerCase() }));
    if(typeof updateSidebarCounts==='function') updateSidebarCounts();
    if(onDone) onDone(made.contract);
    else if(typeof openWorkspace==='function') openWorkspace(made.contract.id);
  });
}

async function unlinkContract(c, onDone){
  if(!canEdit()){ toast(i18t('fa_viewers_no_change'),'err'); return; }
  if(!c.parentId) return;
  if(!await confirmDialog({ title:`Unlink ${c.id}?`,
    message:`It becomes a standalone agreement again. ${c.parentId}'s renewal date will go back to its own expiry.`,
    confirmLabel:'Unlink', danger:true })) return;
  const was=c.parentId;
  clearParentLink(c); persist(c);
  const p=getContract(was); if(p) persist(p);
  toast(`${c.id} unlinked`);
  if(onDone) onDone(); else if(typeof setView==='function') setView(state.view||'workspace');
}

Object.assign(window,{openLinkModal,unlinkContract,renderFamilySection,
  openCreateAmendmentModal,createAmendment,amendmentDefaultName,amendmentOrdinal,
  amendmentSkeletonBody,RELATION_DOC_WORD,FAMILY_BLANK_BODY,
  CONTRACT_RELATIONS,RELATION_LABEL,TERM_CHANGING,isRelation,
  isChild,isParent,familyChildren,familyParent,familyOf,linkError,applyParentLink,clearParentLink,
  ownExpiry,amendmentDate,effectiveExpiry,expirySource,isAgreement,agreementsIn,familyCounts,familyCountLabel,
  AMENDMENT_RE,looksLikeAmendment,guessRelation,suggestParents,logLinkSuggestion,logLinkDecision});
