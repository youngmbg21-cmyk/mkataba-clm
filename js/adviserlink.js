/* ============================================================
   ASK YOUR OWN LAWYER ABOUT TWO CLAUSES (upgrade 9, 18 Sep 2026)
   ============================================================
   The owner with no lawyer on staff wants his own advocate to rule on the
   liability cap and the data-protection wording — two clauses out of forty
   pages — without paying for a seat and without that advocate being able to
   touch anything else. The in-house lawyer wants the mirror of it: hand
   routine NDAs to the commercial team without handing over the redlining
   hands. It is the same missing role, asked for from two directions.

   IT IS A NARROWING OF MACHINERY THAT EXISTS, not a new subsystem. HaTi
   already has link purposes, a payload built by ALLOW-LIST rather than copied,
   a notes system with rooms, and a server that serves exactly what the row's
   purpose allows. A fifth purpose is one word on three lists and one guard.

   IT IS THE FIFTH SEGMENT ON THE SEND SCREEN'S OWN PURPOSE ROW, built to the
   drawing (18 Sep 2026). A first pass gave it a dialog of its own on the More
   menu, reasoning that every other answer on that row goes to the
   counterparty — which was a second door onto one act, "make a link for
   somebody", and two doors drift. The More-menu row SURVIVES and is a PROXY:
   it presses openShareModal with the purpose already chosen, so there is one
   screen, one validation and one send. What the adviser purpose adds to that
   screen is the one question the others do not ask — which clauses — and the
   two facts under it (how long the link lives, that no seat is used).

   THE NARROWING IS IN THE PAYLOAD, never on their page: shareAdviceBody
   (js/core.js) emits the chosen clauses and the full wording is dropped in the
   same breath, so what an adviser is never sent is what they can never read.
   The server refuses a signature, a proposal and a template answer on this
   purpose (refuseIfAdvice); notes are the one thing it lets through, because a
   note is the whole product of the link.
   ============================================================ */

/* The clauses this contract can be asked about. clauseSegment is the product's
   ONE splitter — no second reading of what a clause is. */
function adviserClauses(c){
  if(typeof clauseSegment!=='function') return [];
  let body='';
  try{ body=(typeof docBody==='function'?docBody(c):'')||c.redlineText||''; }catch(_){ body=c.redlineText||''; }
  if(!body) return [];
  try{ return (clauseSegment(body)||[]); }catch(_){ return []; }
}
/* ---- THE HANDLE, AND WHY IT IS NOT ALWAYS A STORED ID ----
   clauseSegment's clauses carry `clauseId` only once negoStampContract has
   written ids into the stored body — which a contract nobody has negotiated
   has not had done to it. Filtering on an id therefore offered NOTHING on
   exactly the ordinary contract this feature is for (measured: every seeded
   contract answered zero clauses).
   READING MUST NOT WRITE, so this does not stamp. It uses the stored id where
   there is one and the clause's POSITION where there is not, and
   shareAdviceBody resolves by the same rule over the same body in the same
   breath — the payload is built once, from docBody, at the moment the link is
   minted, so a position is a sound handle for exactly as long as it is needed.
   ONE READING, TWO CALLERS, so the picker and the payload cannot disagree. */
function adviserClauseKey(cl, i){
  const id=cl && (cl.clauseId || cl.id);
  return id ? String(id) : ('#'+i);
}
const ADVISER_MAX = 12;     /* a few clauses is the feature; the whole contract is the other link */

function adviserClauseRowHtml(cl, i){
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  /* clauseNameShown takes the heading's TEXT, not the clause object — it is the
     ONE presenting reading and every screen asks it that way. A clause with no
     heading at all (the wall-of-paragraphs fallback) is named by position,
     which is the only honest name it has. */
  const head=String((cl&&cl.headingText)||'').trim();
  const name=head
    ? ((typeof clauseNameShown==='function')?clauseNameShown(head):head)
    : i18t('asl_clause_n',{n:i+1});
  return `<label style="display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--color-divider)">
    <input type="checkbox" class="asl-cl" value="${esc(adviserClauseKey(cl,i))}" style="margin-top:3px"/>
    <span style="font-size:var(--t-meta);line-height:1.45">${esc(name)}</span></label>`;
}

/* THE PROXY. One act, two doors: this presses the send screen with the fifth
   purpose already chosen. It refuses first where there is nothing to point at,
   because the send screen would otherwise open on a question with no answers.
   openShareModal reads `opts.purpose` through SHARE_PURPOSE, which knows
   'advise'. */
function openAdviserLink(c){
  if(!c) return;
  if(!adviserClauses(c).length){ toast(i18t('asl_no_clauses'),'warn'); return; }
  if(typeof openShareModal!=='function') return;
  openShareModal(c, { purpose:'advise' });
}

Object.assign(window,{ adviserClauses, adviserClauseKey, adviserClauseRowHtml, openAdviserLink, ADVISER_MAX });
