// HaTi — E2 versioning + in-document redlining. Globals window-attached
// (see components.js). Layers on top of the existing negotiation rounds and
// leaves the signing seal untouched: an accepted redline just becomes the
// text that freezeContractHtml seals, hashed exactly as before.

/* HTML → structured plain text: preserves the document's shape (headings,
   clauses, paragraphs on their own lines) instead of collapsing to one blob.
   normText stays as-is for seal hashing — this is only the WORKING copy. */
function htmlToStructuredText(html){
  const d=document.createElement('div'); d.innerHTML=html||'';
  d.querySelectorAll('script,style').forEach(n=>n.remove());
  const BLOCK=new Set(['P','DIV','H1','H2','H3','H4','H5','H6','LI','TR','TABLE','UL','OL','SECTION','ARTICLE','HEADER','FOOTER','BLOCKQUOTE','ADDRESS']);
  let out='';
  (function walk(node){
    node.childNodes.forEach(ch=>{
      if(ch.nodeType===3){ out+=ch.nodeValue.replace(/\s+/g,' '); return; }
      if(ch.nodeType!==1) return;
      if(ch.tagName==='BR'){ out+='\n'; return; }
      // a filled-in blank reads as a contract writes it, not as the field stores
      // it — see fieldDisplayValue in js/core.js
      if(ch.tagName==='INPUT'){ out+=(window.fieldDisplayValue?fieldDisplayValue(ch):(ch.value||ch.getAttribute('value')||'')); return; }
      const isBlock=BLOCK.has(ch.tagName);
      const anchored=ch.hasAttribute&&ch.hasAttribute('data-anchor');
      if(isBlock&&out&&!out.endsWith('\n')) out+='\n';
      walk(ch);
      if(isBlock&&!out.endsWith('\n')) out+='\n';
      if(anchored) out+='\n';   // blank line between document sections/clauses
    });
  })(d);
  return out.split('\n').map(l=>l.replace(/\s+/g,' ').trim()).join('\n')
    .replace(/\n{3,}/g,'\n\n').trim();
}

/* Plain text of a contract's current body — the unit versions/diffs work on,
   and the unit every Copilot feature reads. For a RICH body this is the text
   projection, which reconstructs ordered-list numbering, so clause numbers
   reach the diff, the model and search rather than vanishing with the markup. */
function docPlainText(c){
  if(c.redlineText){                                      // edited/adopted working text is the live text
    return (window.isRich&&isRich(c.format)) ? richToText(c.redlineText) : c.redlineText;
  }
  if(isUpload(c)) return (c.upload&&c.upload.extractedText)||'';
  try{ return htmlToStructuredText(freezeContractHtml(c)); }catch(e){ return ''; }
}
/* The canonical form of a contract's current body — identical wording in a
   different shape gives a different string, which is how a formatting-only
   edit is detected instead of being silently swallowed as "no changes". */
function docCanonical(c){
  if(c.redlineText && window.canonicalDocString) return canonicalDocString(c.redlineText, c.format);
  return docPlainText(c).replace(/\s+/g,' ').trim();
}

/* Re-flow working text that was flattened by an older/lossy conversion (headings
   glued to bodies, e.g. "…TerritoryThe Principal…"), restoring paragraph and
   section breaks for display/editing. Non-destructive: already-structured text
   (which has real line breaks) is returned unchanged. Relies on the fact that in
   flattened text, normal in-sentence words keep their spaces, so the only glued
   lowercase→UPPERCASE junctions — and a clause number right after a word/period —
   are exactly the block boundaries that were lost. */
function reflowWorkingText(t){
  t=String(t||''); if(!t.trim()) return t;
  if(t.split('\n').filter(l=>l.trim()).length>=4) return t;   // already structured
  return t
    .replace(/([^\n])\s*(\d{1,2}\.\s+[A-Z])/g,'$1\n\n$2')      // "…consent.2. Targets" → new paragraph before each clause
    .replace(/([a-z])([A-Z])/g,'$1\n$2')                        // restore glued block joins ("Territory|The") — normal words keep their space, so only lost boundaries glue
    .replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}

/* ---- version records (E2-T1) ---- */
/* ---- taking a version ----
   TWO KINDS, ONE STORE, AND ONLY ONE OF THEM IS A VERSION.

   This used to fire on anything that touched the wording — a share going out, a
   turn handed over, each individual change accepted — and every one of those
   landed in the version list named after the EVENT that triggered it rather
   than after what changed. So the list read "#CHG-001 accepted — Clause 4",
   "Shared for review", "Round 1 — sent to Juno Limited": bookkeeping presented
   as document history, and none of it anything a person would choose to compare
   against.

   A version is now something a PERSON took and NAMED. Everything else the
   system still needs is kept as an `auto` copy: unlisted, still readable, still
   there for the machinery that depends on it.

   `auto` copies are NOT an optimisation and must not be removed. Two things
   depend on them:
     · the copy taken before a first edit is the only record of the original
       wording — delete it and the original is gone for good;
     · reviewing a returned redline diffs against the most recent copy when the
       response does not carry its own base text.

   `listed` is what the version list reads. Undefined means listed, so every
   version stored before this existed keeps appearing — a change to how versions
   are taken must not retire the ones already taken. */
/* The versions a person is offered — named snapshots, plus the few automatic
   copies that record a real milestone (the original, a round's outcome, the
   signature). The rest are kept and not shown. */
/* TAKING A SNAPSHOT IS A DELIBERATE, NAMED ACT.

   It used to be one click that filed "Manual snapshot" — a label that says
   nothing, on a list where every other entry was named after the event that
   happened to trigger it. A version list is only useful if you can tell, six
   weeks later, which one you want; "Manual snapshot" three times over tells you
   nothing at all.

   So the name is asked for, and it is required. An unnamed snapshot is not
   saved — better no version than one nobody can identify. And a snapshot of
   wording that has not moved since the last one is refused with a plain reason
   rather than filed as a duplicate. */
async function takeNamedSnapshot(c, after){
  if(typeof canEdit==='function' && !canEdit()){ toast('Viewers cannot take snapshots','err'); return null; }
  const before=(c.versions||[]).length;
  let name='';
  if(typeof window.promptDialog==='function'){
    name=await window.promptDialog({ title:'Name this version',
      message:'You are saving the wording exactly as it reads now. The name is how you will recognise it later.',
      label:'Version name', placeholder:'e.g. Before sending to Juno · liability cap agreed',
      confirmLabel:'Save version' });
    if(name==null) return null;                       // cancelled
    name=String(name).trim();
    if(!name){ toast('Give the version a name so you can find it again','err'); return null; }
  }
  const v=captureVersion(c, name.slice(0,120) || 'Saved version');
  if(!v || (c.versions||[]).length===before){
    toast('Nothing has changed since the last version — there is nothing new to save','err');
    return null;
  }
  if(typeof persist==='function') persist(c);
  toast(`Saved as v${v.n} — “${v.label}”`);
  if(typeof after==='function') after();
  return v;
}

function listedVersions(c){
  return ((c && Array.isArray(c.versions)) ? c.versions : [])
    .filter(v => v && v.listed !== false);
}

/* The round a snapshot is taken in. The caller may name it — negoAdvanceRound
   does, because by the time it saves "Round 1 closed" the counter has already
   moved to 2 and the snapshot belongs to the round that just ended, not the one
   just started. Everything else is simply the round in flight. */
function roundStamp(c, o){
  if(o && o.roundN!=null) return o.roundN;
  const r=c && c.negotiation && c.negotiation.round;
  return (typeof r==='number' && r>0) ? r : null;
}

function captureVersion(c, label, by, opts){
  const text=docPlainText(c); if(!text) return null;
  const canon=docCanonical(c);
  c.versions=c.versions||[];
  const o=opts||{};
  const last=c.versions[c.versions.length-1];
  // No material change — don't spam versions. "Material" now includes the
  // SHAPE: a version whose wording is identical but whose headings, emphasis
  // or clause numbering changed is a real change and gets its own record.
  if(last && last.text===text && (last.canon||last.text)===canon){
    /* PROMOTION, and without it milestones disappear.

       The wording is unchanged, so no new record — but the reason for asking
       may be better than the reason the existing record carries. A round closes
       moments after the last change in it was accepted: same text, and the copy
       already stored is the unlisted per-change one. Returning it untouched
       would let an internal baseline swallow the milestone, and "Round 1
       closed" would never appear in the list at all.

       So a listed request promotes an unlisted record, and takes its name with
       it. A named snapshot promotes an automatic one for the same reason: the
       person asked for this wording to be findable, and it now is. */
    const wantListed=!o.auto || o.listed;
    if(wantListed && last.listed===false){
      last.listed=true;
      last.kind=o.auto?'auto':'named';
      if(label) last.label=label;
      if(!o.auto) last.by=by||currentUser()?.name||last.by;
    }
    if(last.roundN==null) last.roundN=roundStamp(c,o);
    return last;
  }
  const v={ n:c.versions.length+1, at:nowISO(), by:by||currentUser()?.name||'System',
    label:label||'Saved', text, canon,
    /* WHICH ROUND THIS SNAPSHOT BELONGS TO.
       The number `n` counts every snapshot the contract has ever taken and says
       nothing about when in the negotiation it was taken — so the pane selector
       could not group a round's snapshots under that round without guessing
       from timestamps. It is stamped once, here, and never recomputed. */
    roundN:roundStamp(c,o),
    /* Who asked for it, and whether it belongs in the list a person reads. */
    kind:o.auto?'auto':'named',
    listed:o.auto?!!o.listed:true,
    // the raw body and its format, so a rich version can be shown or restored
    // as the document it was rather than as its text shadow
    format:(window.docFormat?docFormat(c.format):'text'),
    body:(c.redlineText!=null?c.redlineText:null) };
  c.versions.push(v);
  return v;
}

/* ---- going back to an earlier version ----
   Versions were for reading and comparing and nothing else. You could look at
   what the contract said three rounds ago, put it side by side with now, and
   then retype it — which is exactly the manual work this product exists to
   remove, at the exact moment somebody has realised they have talked themselves
   into a worse position.

   WHAT THIS IS NOT: it is not an undo, and it does not erase anything. Restoring
   takes a snapshot of the wording as it stands FIRST, then writes the old
   wording in as a new version on top. The history only ever grows, so "we went
   back to Tuesday's draft" is itself on the record — which is the only version
   of this that is safe to give somebody negotiating a contract.

   REFUSED WHILE A NEGOTIATION IS LIVE. Every pending change is anchored to a
   clause id in the body it was proposed against. Swapping that body underneath
   them would leave fingerprints pointing at wording nobody had seen — so the
   changes have to be settled first, and the refusal says so. */
function restoreBlockedWhy(c){
  if(!canEdit()) return 'Viewers cannot change documents.';
  if(c.status==='Signed') return 'This contract is executed and sealed — its wording is fixed. Record an amendment instead.';
  const pending=(Array.isArray(c.changes)?c.changes:[]).filter(x=>x&&x.status==='pending').length;
  if(pending) return `${pending} proposed change${pending===1?' is':'s are'} still open in the negotiation. `
    +'Every one of them is anchored to this wording, so settle them first — accept, reject or withdraw — and the version list will still be here.';
  const open=(c.rounds||[]).filter(r=>r&&r.status==='open').length;
  if(open) return `${open} returned round${open===1?' is':'s are'} still awaiting your decision. Resolve ${open===1?'it':'them'} first.`;
  return '';
}
async function restoreVersion(c, n, after){
  const why=restoreBlockedWhy(c);
  if(why){ toast(why,'err'); return null; }
  const v=(c.versions||[]).find(x=>x.n===n);
  if(!v){ toast('That version is no longer on this contract','err'); return null; }
  const now=docPlainText(c);
  if(normText(v.text||'')===normText(now||'')){
    toast('The contract already reads exactly like that version — nothing to restore'); return null; }
  const label=(v.label||'').trim();
  if(window.confirmDialog){
    const ok=await confirmDialog({
      title:`Go back to v${v.n}?`,
      message:`The contract will read as it did on ${fmtDT(v.at)}${label?` — “${label}”`:''}. `
        +'The wording as it stands right now is saved first, as its own version, so nothing is lost and you can come straight back.',
      confirmLabel:`Restore v${v.n}` });
    if(!ok) return null;
  }
  const u=currentUser();
  /* The current wording, kept before it is replaced. Listed, because somebody
     will want to find it again — that is the whole point of taking it. */
  captureVersion(c, `Before going back to v${v.n}`, u?.name);
  /* The body, not its text shadow, where the version kept one — a rich version
     restored from `text` alone would come back as flat prose. */
  if(v.body!=null){ c.redlineText=v.body; if(v.format&&window.docFormat) c.format=v.format; }
  else { c.redlineText=v.text||''; if(window.TEXT_FORMAT) c.format=TEXT_FORMAT; }
  const nv=captureVersion(c, `Restored from v${v.n}${label?` — ${label}`:''}`, u?.name);
  logAudit(c,'Edited',`Wording restored to v${v.n}${label?` (“${label}”)`:''} of ${fmtDT(v.at)}`
    +`${nv?` — captured as v${nv.n}`:''}. The wording it replaced was kept as its own version first.`);
  c.lastAction=todayStr();
  persist(c);
  toast(`Back to v${v.n}${label?` — ${label}`:''}. The wording you had is saved as a version of its own.`);
  if(typeof after==='function') after();
  else if(window.renderWorkspace) renderWorkspace();
  return nv;
}

/* ---- word-level diff (E2-T2): LCS over whitespace tokens ---- */
function tokenize(s){ return String(s||'').split(/(\s+)/).filter(x=>x!==''); }
function wordDiff(aStr, bStr){
  const a=tokenize(aStr), b=tokenize(bStr);
  const n=a.length, m=b.length;
  // LCS length table (rolling would save memory; documents here are bounded)
  const dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--)
    dp[i][j]= a[i]===b[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const out=[]; let i=0,j=0;
  const push=(t,txt)=>{ const p=out[out.length-1]; if(p&&p.t===t) p.text+=txt; else out.push({t,text:txt}); };
  while(i<n && j<m){
    if(a[i]===b[j]){ push('eq',a[i]); i++; j++; }
    else if(dp[i+1][j]>=dp[i][j+1]){ push('del',a[i]); i++; }
    else { push('add',b[j]); j++; }
  }
  while(i<n){ push('del',a[i]); i++; }
  while(j<m){ push('add',b[j]); j++; }
  return out;
}
function diffHtml(aStr, bStr){
  const esc=s=>s.replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  // clear diff convention: additions emerald, deletions ruby (struck through)
  return wordDiff(aStr,bStr).map(p=>
    p.t==='eq' ? esc(p.text)
    : p.t==='add' ? `<ins style="background:#d9eae0;color:#1e6b4d;text-decoration:none;border-radius:2px;padding:0 1px">${esc(p.text)}</ins>`
    : `<del style="background:#f1dcd8;color:#8f322b;border-radius:2px;padding:0 1px">${esc(p.text)}</del>`).join('');
}
function diffStats(aStr,bStr){ let add=0,del=0; wordDiff(aStr,bStr).forEach(p=>{ const w=p.text.trim()?p.text.trim().split(/\s+/).length:0; if(p.t==='add') add+=w; else if(p.t==='del') del+=w; }); return {add,del}; }

/* ---- change blocks (E2-T6): a redline is not one decision ----
   Accepting or rejecting a whole round is not how negotiation works. A round
   typically carries three or four separate asks, and the answer to them is
   rarely the same answer. Until now the only way to take one and refuse
   another was to accept everything and hand-edit the unwanted part back out,
   in a plain-text box, on a legal document — the single worst moment in the
   product.

   A BLOCK is one contiguous divergence between the two texts: the words that
   would go (`before`) and the words that would arrive (`after`). The eq runs
   between them are context and belong to neither side. Because the blocks are
   derived from the same diff the reviewer is reading, a decision per block is
   a decision per highlighted passage — there is nothing to line up by hand. */
/* The segmentation both of the functions below run on. They MUST agree on
   where a block starts and ends — one builds the controls, the other builds the
   document from what those controls say — so the boundary rule lives here once.

   Rule: consecutive divergences separated only by WHITESPACE are one block.
   Word-level diffing splits "fourteen (14) days" → "twenty-one (21) days" into
   two changes, because the space between them is unchanged; presented as two
   independent decisions, a reviewer could accept "twenty-one" while rejecting
   "(21)" and produce "twenty-one (14) days" — a clause that neither party ever
   proposed. The shared whitespace is unchanged text, so it belongs to both
   sides of the merged block and reconstruction stays exact. */
function _diffSegments(aStr, bStr){
  const parts=wordDiff(aStr,bStr);
  const segs=[];
  let before='', after='', open=false, pendingWs='';
  const flush=()=>{
    if(!open) return;
    segs.push({ type:'change', before, after });
    before=''; after=''; open=false;
  };
  for(const p of parts){
    if(p.t==='eq'){
      if(open && !p.text.trim()){ pendingWs+=p.text; continue; }   // hold: may bridge two changes
      flush();
      if(pendingWs){ segs.push({ type:'eq', text:pendingWs }); pendingWs=''; }
      segs.push({ type:'eq', text:p.text });
      continue;
    }
    if(pendingWs){ before+=pendingWs; after+=pendingWs; pendingWs=''; }  // the bridge joins the block
    open=true;
    if(p.t==='del') before+=p.text; else after+=p.text;
  }
  flush();
  if(pendingWs) segs.push({ type:'eq', text:pendingWs });
  return segs;
}
/* A BLOCK is one contiguous divergence: the words that would go (`before`) and
   the words that would arrive (`after`), with the unchanged text around them as
   context. Blocks are numbered in document order and that number is their id. */
function diffBlocks(aStr, bStr){
  const segs=_diffSegments(aStr,bStr);
  const blocks=[];
  let ctx='';
  for(const sg of segs){
    if(sg.type==='eq'){ ctx+=sg.text; continue; }
    if(!(sg.before.trim()||sg.after.trim())) continue;   // whitespace-only: nobody means this
    blocks.push({ id:'b'+blocks.length, index:blocks.length,
      before:sg.before, after:sg.after, context:ctx.replace(/\s+/g,' ').slice(-90).trim() });
  }
  return blocks;
}
/* Build the adopted text from a decision per block. Anything not named is
   REJECTED: silence must not adopt a change, because the failure mode of the
   other default — a block nobody looked at quietly entering a contract — is
   unrecoverable once the document is signed. */
function applyBlockDecisions(aStr, bStr, decisions){
  const d=decisions||{};
  let out='', i=0;
  for(const sg of _diffSegments(aStr,bStr)){
    if(sg.type==='eq'){ out+=sg.text; continue; }
    if(!(sg.before.trim()||sg.after.trim())){ out+=sg.before; continue; }
    const id='b'+(i++);
    out += (d[id]==='accept') ? sg.after : sg.before;
  }
  return out;
}
/* Which of the counterparty's per-clause reasons explains THIS change.
   They wrote a reason against a whole clause; the review screen decides
   fragments of one ("thirty (30)" → "sixty (60)"). A note matches a block when
   the block's new wording appears in the line the note was written against —
   which is true by construction, since the block came from that very edit. */
function noteForBlock(block, notes){
  if(!block || !Array.isArray(notes) || !notes.length) return null;
  const a=String(block.after||'').trim(), b=String(block.before||'').trim();
  for(const n of notes){
    const after=String(n.after||''), before=String(n.before||'');
    if(a && after.includes(a)) return n.note||null;
    if(!a && b && before.includes(b)) return n.note||null;   // a pure deletion
  }
  return null;
}

/* Points the counterparty raised that were NOT adopted, and are therefore
   still live between the parties.

   A point stops being open in two ways, and both matter — a list that keeps
   showing settled items is a list people learn to ignore, which would make it
   worse than no list at all:

     · the wording they asked for is in the document anyway. It may have
       arrived by another route; either way they got it.
     · the wording it was measured AGAINST is gone. The clause has been
       renegotiated since, so neither side's original text stands and the old
       ask is about a passage that no longer exists. (Erik asks for Net-60,
       is refused, and the parties later settle on Net-45: he did not get
       what he asked for, but the point is spent, not outstanding.) */
function openPointsFor(c){
  const live=(window.docPlainText?docPlainText(c):'').replace(/\s+/g,' ');
  const out=[];
  for(const r of (c.rounds||[])){
    for(const b of (r.blockDecisions||[])){
      if(b.decision!=='reject') continue;
      const want=String(b.after||'').replace(/\s+/g,' ').trim();
      const had=String(b.before||'').replace(/\s+/g,' ').trim();
      if(want && live.includes(want)) continue;      // they got it in the end
      if(had && !live.includes(had)) continue;       // the clause has moved on since
      out.push({ id:`r${r.n}.${b.id}`, round:r.n, by:r.by,
        before:String(b.before||'').trim(), after:String(b.after||'').trim(),
        // their reason for asking, and ours for saying no — the reply given
        // against THIS change wins over the one given for the whole round
        ask:b.note||null,
        reason:b.reply||(r.resolution&&r.resolution.comment)||null });
    }
  }
  return out;
}

/* ---- version history panel in the workspace ---- */
function renderVersionsSection(c){
  const host=document.getElementById('versions-section'); if(!host) return;
  const vs=listedVersions(c);
  const canSnap=canEdit()&&c.status!=='Signed';
  const H6='margin:0;font-size:10px;font-weight:600;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:.1em';
  host.innerHTML=`
    <div style="padding:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="color:var(--color-accent)">${icon('history','w-3.5 h-3.5')}</span>
        <h6 style="${H6};flex:1">Versions &amp; changes</h6>
        <span style="font-family:var(--font-mono);font-size:10px;color:var(--color-neutral-500)">${vs.length} version${vs.length===1?'':'s'}</span>
      </div>
      ${vs.length?`<div style="display:flex;flex-direction:column;gap:5px">${vs.slice().reverse().map(v=>`
        <div style="display:flex;align-items:center;gap:8px;border:1px solid var(--color-divider);border-radius:4px;background:var(--color-surface);padding:6px 9px;font-size:11px">
          <span style="font-family:var(--font-mono);font-weight:600;color:var(--color-accent-700)">v${v.n}</span>
          <span style="color:var(--color-neutral-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0">${(v.label||'').replace(/</g,'&lt;')}</span>
          <span style="margin-left:auto;color:var(--color-neutral-500);font-family:var(--font-mono);flex:none">${fmtDT(v.at)}</span>
          ${v.n>1?`<button data-ver-diff="${v.n}" style="flex:none;border:0;background:none;cursor:pointer;color:var(--color-accent);font:inherit;font-size:11px;font-weight:600;padding:0" title="Compare with previous version">diff</button>`:''}
          ${canSnap?`<button data-ver-restore="${v.n}" style="flex:none;border:0;background:none;cursor:pointer;color:var(--color-accent);font:inherit;font-size:11px;font-weight:600;padding:0" title="Make the contract read as it did in this version — the wording you have now is saved first">restore</button>`:''}
        </div>`).join('')}</div>`
      :`<p style="font-size:11px;color:var(--color-neutral-600);line-height:1.5;margin:0">No versions captured yet. Snapshots are taken automatically when a counterparty redline is accepted and at signing — or capture one now to start tracking changes.</p>`}
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
        <button id="ver-compare" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:5px 11px">${icon('history','w-3.5 h-3.5')} Compare versions</button>
        ${canSnap?`<button id="ver-snap" class="ui-btn" style="font-size:11.5px;padding:5px 11px">${icon('plus','w-3 h-3')} Snapshot now</button>`:''}
      </div>
    </div>`;
  host.querySelectorAll('[data-ver-diff]').forEach(b=>b.addEventListener('click',()=>{ const n=Number(b.getAttribute('data-ver-diff'));
    const cur=vs.find(v=>v.n===n), prev=vs.find(v=>v.n===n-1); if(cur&&prev) openDiffModal(prev.text,cur.text,`v${prev.n}`,`v${cur.n}`); }));
  host.querySelectorAll('[data-ver-restore]').forEach(b=>b.addEventListener('click',()=>
    restoreVersion(c, Number(b.getAttribute('data-ver-restore')))));
  document.getElementById('ver-snap')?.addEventListener('click',()=>takeNamedSnapshot(c,()=>renderVersionsSection(c)));
  document.getElementById('ver-compare')?.addEventListener('click',()=>openCompareModal(c));
}

const _diffLegend = `<span style="display:inline-flex;align-items:center;gap:8px"><ins style="background:#d9eae0;color:#1e6b4d;text-decoration:none;border-radius:2px;padding:0 4px">added</ins><del style="background:#f1dcd8;color:#8f322b;border-radius:2px;padding:0 4px">removed</del></span>`;
const _diffBox = (a,b)=>`<div class="scroll-thin" style="border:1px solid var(--color-divider);border-radius:5px;background:var(--color-surface);padding:14px 16px;font-size:12.5px;line-height:1.85;color:var(--color-doc-text);max-height:56vh;overflow-y:auto;white-space:pre-wrap;font-family:var(--font-body)">${diffHtml(a,b)}</div>`;
const _statLine = (st)=>`<span style="font-weight:600;color:#1e6b4d">+${st.add}</span> added · <span style="font-weight:600;color:#8f322b">−${st.del}</span> removed`;

function openDiffModal(aText, bText, labelA, labelB){
  const st=diffStats(aText,bText);
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Compare ${labelA} → ${labelB}</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">${_statLine(st)} · ${_diffLegend}</p>
      ${_diffBox(aText,bText)}
      <div style="display:flex;justify-content:flex-end;margin-top:14px"><button id="dm-close" class="ui-btn ui-btn-primary">Close</button></div>
    </div>`, {maxWidth:'860px'});
  document.getElementById('dm-close').addEventListener('click',closeModal);
}

// Compare any two comparables. Comparables = every captured version PLUS the
// live document text (so a diff is always available once the doc has changed),
// which fixes the old silent no-op when fewer than two versions existed.
function openCompareModal(c){
  const vs=listedVersions(c);
  const live=docPlainText(c);
  const liveCanon=docCanonical(c);
  const items=vs.map(v=>({label:`v${v.n} · ${(v.label||'').replace(/"/g,'')}`, short:`v${v.n}`, text:v.text, canon:v.canon||v.text}));
  const lastV=vs.length?vs[vs.length-1]:null;
  // the live document is a comparable whenever it differs in WORDING or in SHAPE
  if(!lastV || live!==lastV.text || liveCanon!==(lastV.canon||lastV.text))
    items.push({label:'Current (live document)', short:'Current', text:live, canon:liveCanon});
  const canSnap=canEdit()&&c.status!=='Signed';

  if(items.length<2){
    openModal(`
      <div style="padding:20px 22px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Compare versions</h3></div>
        <p style="font-size:12.5px;color:var(--color-neutral-700);line-height:1.6;margin:0">There's only one version of this contract so far, so there's nothing to compare yet. New versions are captured automatically when a <b>counterparty redline is accepted</b> and at <b>signing</b>. ${canSnap?'Capture a snapshot now, make your edits, then compare to see exactly what changed.':''}</p>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
          ${canSnap?`<button id="cmp-snap" class="ui-btn ui-btn-primary">${icon('plus','w-3 h-3')} Snapshot current version</button>`:''}
          <button id="cmp-close" class="ui-btn">Close</button>
        </div>
      </div>`);
    document.getElementById('cmp-close').addEventListener('click',closeModal);
    document.getElementById('cmp-snap')?.addEventListener('click',()=>
      takeNamedSnapshot(c,()=>{ closeModal(); renderVersionsSection(c); }));
    return;
  }

  const opts=items.map((it,i)=>`<option value="${i}">${it.label}</option>`).join('');
  const selStyle='font:inherit;font-size:12.5px;border:1px solid var(--color-divider);background:var(--color-surface);padding:6px 8px;border-radius:4px;color:inherit;min-width:0;flex:1';
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0;flex:1">Compare versions</h3>
        <button id="cmp-x" title="Close" class="ui-btn" style="flex:none;width:30px;height:30px;padding:0">${icon('close','w-3.5 h-3.5')}</button></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <select id="cmp-a" style="${selStyle}">${opts}</select>
        <span style="color:var(--color-neutral-500);flex:none">→</span>
        <select id="cmp-b" style="${selStyle}">${opts}</select>
        <button id="cmp-go" class="ui-btn ui-btn-primary" style="flex:none">Compare</button>
      </div>
      <div id="cmp-legend" style="font-size:11.5px;color:var(--color-neutral-600);margin-bottom:10px"></div>
      <div id="cmp-out" style="font-size:12px;color:var(--color-neutral-500)">Pick two versions and press <b>Compare</b> to see the changes.</div>
      <div style="display:flex;justify-content:flex-end;margin-top:14px"><button id="cmp-done" class="ui-btn ui-btn-primary">Close</button></div>
    </div>`, {maxWidth:'860px'});
  document.getElementById('cmp-x').addEventListener('click',closeModal);
  document.getElementById('cmp-done').addEventListener('click',closeModal);
  document.getElementById('cmp-a').value=String(items.length-2);
  document.getElementById('cmp-b').value=String(items.length-1);
  const run=()=>{
    const a=items[Number(document.getElementById('cmp-a').value)], b=items[Number(document.getElementById('cmp-b').value)];
    if(!a||!b) return;
    if(a.text===b.text){
      document.getElementById('cmp-legend').innerHTML='';
      // Same words, different shape. A word diff has nothing to show, but the
      // document DID change — headings, emphasis, clause numbering or table
      // structure moved. Reporting "no changes" here would be a lie.
      const fmtOnly=(a.canon||a.text)!==(b.canon||b.text);
      document.getElementById('cmp-out').innerHTML=fmtOnly
        ? `<div style="font-size:12px;line-height:1.6;color:var(--color-neutral-700);border:1px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:4px;padding:10px 12px"><b>Formatting changed.</b> The wording of <b>${a.short}</b> and <b>${b.short}</b> is word-for-word identical, but the document's structure is not — headings, emphasis, clause numbering, indentation or table layout differ. Word-level comparison has nothing to highlight; open the two versions to see the difference.</div>`
        : `<div style="font-size:12px;color:var(--color-neutral-500)">These two versions are identical — no changes between <b>${a.short}</b> and <b>${b.short}</b>.</div>`;
      return; }
    const st=diffStats(a.text,b.text);
    document.getElementById('cmp-legend').innerHTML=`${_statLine(st)} · ${_diffLegend}`;
    document.getElementById('cmp-out').innerHTML=_diffBox(a.text,b.text);
  };
  document.getElementById('cmp-go').addEventListener('click',run);
  run();   // show the default (previous → latest) comparison immediately
}

/* ---- owner review of a counterparty's proposed edit (E2-T4) ---- */
function reviewProposedRound(c, n){
  const r=(c.rounds||[]).find(x=>x.n===n); if(!r||!r.proposedText) return;
  const base=r.baseText || (c.versions&&c.versions.length?c.versions[c.versions.length-1].text:docPlainText(c));
  const st=diffStats(base, r.proposedText);
  const blocks=diffBlocks(base, r.proposedText);
  /* Each change gets its own decision. Every real negotiation round carries
     several asks and the answer to them is rarely the same answer; until now
     the only way to take one and refuse another was to accept everything and
     then hand-edit the unwanted part back out, in a plain-text box, on a legal
     document. The blocks come from the same diff shown below, so a decision
     here is a decision about a passage the reviewer can see highlighted. */
  const decisions={};
  for(const b of blocks) decisions[b.id]='accept';
  const COL='width:100%;max-width:860px;margin-left:auto;margin-right:auto';
  const e=x=>String(x==null?'':x).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const blockRow=b=>{
    const ask=noteForBlock(b, r.clauseNotes);
    return `
    <div style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:7px;padding:11px 13px">
      ${b.context?`<div style="font-size:10.5px;color:var(--color-neutral-500);margin-bottom:6px">…${e(b.context)}</div>`:''}
      <div style="font-size:13px;line-height:1.7">
        ${b.before.trim()?`<del style="background:#f1dcd8;color:#8f322b;border-radius:2px;padding:0 2px">${e(b.before.trim())}</del> `:''}
        ${b.after.trim()?`<ins style="background:#d9eae0;color:#1e6b4d;text-decoration:none;border-radius:2px;padding:0 2px">${e(b.after.trim())}</ins>`:''}
      </div>
      ${ask?`<div style="margin-top:8px;border-left:2px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:0 4px 4px 0;padding:7px 10px">
        <span style="display:block;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-accent-800);margin-bottom:2px">Why they asked</span>
        <span style="font-size:12px;line-height:1.55;color:var(--color-neutral-800)">${e(ask)}</span></div>`:''}
      <div style="display:flex;gap:6px;margin-top:9px;align-items:center">
        <button data-dec="accept" data-for="${b.id}" class="ui-btn" style="font-size:11.5px;padding:5px 12px">Accept</button>
        <button data-dec="reject" data-for="${b.id}" class="ui-btn" style="font-size:11.5px;padding:5px 12px">Reject</button>
        <span data-state="${b.id}" style="margin-left:auto;font-size:11px;font-weight:600"></span>
      </div>
      <input data-reply="${b.id}" type="text" placeholder="Your reply on this point (optional) — they see it against this change" style="width:100%;margin-top:7px;border:1px solid var(--color-divider);border-radius:5px;padding:6px 9px;font:inherit;font-size:11.5px;background:var(--color-bg);outline:none"/>
    </div>`;};
  openModal(`
    <div style="height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="flex:none;padding:20px 26px 14px;border-bottom:1px solid var(--color-divider)">
        <div style="${COL}">
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
            <span style="color:#b8862b;display:inline-flex">${icon('history','w-4 h-4')}</span>
            <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Changes proposed by ${e(r.by||'the counterparty')}</h3>
            <span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:#fbf4e3;color:#7d5a14;border-radius:999px;padding:3px 9px">Round ${n} · open</span>
          </div>
          <p style="font-size:11.5px;color:var(--color-neutral-600);margin:7px 0 0;display:flex;flex-wrap:wrap;gap:10px;align-items:center">${fmtDT(r.at)} · ${_statLine(st)} · ${_diffLegend}</p>
        </div>
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:22px 26px;background:var(--color-bg)">
        <div style="${COL}">
          ${blocks.length?`
            <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:11px">
              <span style="font-size:12px;font-weight:600">${blocks.length} change${blocks.length===1?'':'s'} — decide each one</span>
              <span style="flex:1"></span>
              <button id="pr-all-acc" class="ui-btn" style="font-size:11.5px;padding:5px 11px">Accept all</button>
              <button id="pr-all-rej" class="ui-btn" style="font-size:11.5px;padding:5px 11px">Reject all</button>
            </div>
            <div id="pr-blocks" style="display:flex;flex-direction:column;gap:9px;margin-bottom:18px">${blocks.map(blockRow).join('')}</div>`:''}
          <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:7px">The document, with their changes marked</div>
          <div style="background:#fbfbfc;box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;font-size:14px;line-height:1.95;color:var(--color-doc-text);white-space:pre-wrap;font-family:var(--font-body)">${diffHtml(base, r.proposedText)}</div>
          ${r.comment?`<div style="margin-top:14px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:12px 16px">
            <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:5px">Their comment</div>
            <div style="font-size:12.5px;line-height:1.6;color:var(--color-neutral-800)">${e(r.comment)}</div></div>`:''}
          <label style="display:block;margin-top:14px">
            <span style="display:block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:5px">Your reply to ${e(r.by||'them')} — sent with your decision</span>
            <textarea id="pr-reply" rows="2" placeholder="e.g. Net-30 stands, or we can look at a 2% price increase." style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:9px 11px;font:inherit;font-size:12.5px;outline:none"></textarea>
          </label>
        </div>
      </div>
      <div style="flex:none;padding:14px 26px;border-top:1px solid var(--color-divider)">
        <div style="${COL};display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span id="pr-summary" style="font-size:11.5px;color:var(--color-neutral-600)"></span>
          <span style="flex:1"></span>
          <button id="pr-close" class="ui-btn">Decide later</button>
          <button id="pr-reject" class="ui-btn" style="border-color:#e6c9c1;color:#8f322b">Reject the round</button>
          <button id="pr-accept" class="ui-btn ui-btn-primary">Apply my decisions</button>
        </div>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});

  const paint=()=>{
    let acc=0;
    for(const b of blocks){
      const on=decisions[b.id]==='accept';
      if(on) acc++;
      const tag=document.querySelector(`[data-state="${b.id}"]`);
      if(tag){ tag.textContent=on?'Accepted':'Rejected'; tag.style.color=on?'#1e6b4d':'#8f322b'; }
      document.querySelectorAll(`[data-for="${b.id}"]`).forEach(btn=>{
        const active=(btn.getAttribute('data-dec')==='accept')===on;
        btn.style.background=active?(on?'#d9eae0':'#f1dcd8'):'';
        btn.style.borderColor=active?(on?'#2e8763':'#b0453c'):'';
        btn.style.fontWeight=active?'700':'';
      });
    }
    const sum=document.getElementById('pr-summary');
    if(sum) sum.textContent=blocks.length
      ? `${acc} of ${blocks.length} change${blocks.length===1?'':'s'} will be adopted`
      : 'This round proposes no wording changes.';
    const go=document.getElementById('pr-accept');
    if(go && blocks.length) go.textContent=acc===0?'Reject the round'
      :(acc===blocks.length?'Accept all changes':`Apply my decisions (${acc} of ${blocks.length})`);
  };
  document.querySelectorAll('[data-dec]').forEach(btn=>btn.addEventListener('click',()=>{
    decisions[btn.getAttribute('data-for')]=btn.getAttribute('data-dec'); paint(); }));
  document.getElementById('pr-all-acc')?.addEventListener('click',()=>{ for(const b of blocks) decisions[b.id]='accept'; paint(); });
  document.getElementById('pr-all-rej')?.addEventListener('click',()=>{ for(const b of blocks) decisions[b.id]='reject'; paint(); });
  paint();

  const reply=()=>{ const el=document.getElementById('pr-reply'); return el?el.value:''; };
  const perBlockReplies=()=>{
    const out={};
    document.querySelectorAll('[data-reply]').forEach(el=>{
      const v=String(el.value||'').trim();
      if(v) out[el.getAttribute('data-reply')]=v;
    });
    return out;
  };
  document.getElementById('pr-close').addEventListener('click',closeModal);
  document.getElementById('pr-accept').addEventListener('click',()=>{
    const d={...decisions}, note=reply(), replies=perBlockReplies();
    closeModal(); acceptProposedRound(c,n,{ decisions:d, comment:note, replies }); });
  document.getElementById('pr-reject').addEventListener('click',()=>{
    const note=reply(), replies=perBlockReplies();
    // a straight rejection still records what was said about each change
    if(blocks.length) r.blockDecisions=blocks.map(b=>({ id:b.id, decision:'reject',
      before:b.before, after:b.after, note:noteForBlock(b, r.clauseNotes)||null,
      reply:String(replies[b.id]||'').trim()||null }));
    closeModal(); resolveRound(c,n,false,{ comment:note }); });
}

function resolveRound(c, n, accept, opts={}){
  if(!canEdit()){ toast('Viewers cannot resolve negotiation rounds','err'); return; }
  const r=(c.rounds||[]).find(x=>x.n===n); if(!r||r.status!=='open') return;
  const u=currentUser();
  // The reply travels to the counterparty with the decision. A rejection with
  // no reason is the thing that pushes the conversation back into email.
  r.status='closed'; r.resolution={ decision:accept?'accepted':'rejected', by:u.name, at:nowISO(),
    comment:String(opts.comment||'').slice(0,2000)||null };
  if(accept && r.proposedValue!=null){
    c.value=Number(r.proposedValue);
    c.approval=null; c.approvalChain=null; // value changed — prior approvals are void, rebuild the chain
  }
  logAudit(c,'Negotiation',`Round ${n} ${accept?'accepted':'rejected'} by ${u.name}${accept&&r.proposedValue!=null?` — value set to ${fmtMoney(r.proposedValue)}`:''}`);
  persist(c); renderWorkspace();
  toast(`Round ${n} ${accept?'accepted':'rejected'}`);
}

/* Adopt a round. With no decisions given this takes the whole proposal, which
   is exactly what it always did. With decisions, the adopted text is BUILT from
   them: accepted blocks enter the document, rejected ones stay as they were and
   are recorded on the round so they can travel back as still-open points. */
function acceptProposedRound(c, n, opts={}){
  if(!canEdit()){ toast('Viewers cannot resolve rounds','err'); return; }
  const r=(c.rounds||[]).find(x=>x.n===n); if(!r||!r.proposedText) return;
  const u=currentUser();
  // ensure the pre-redline text is captured, then adopt the proposed text
  /* The only copy of the wording this redline was measured against. Unlisted:
     it is a base, not a version somebody took. */
  if(!c.versions||!c.versions.length) captureVersion(c,'Before redline','System',{auto:true});
  const wasRich=!!(window.isRich&&isRich(c.format));
  const base=r.baseText||docPlainText(c);
  const decisions=opts.decisions||null;
  const blocks=decisions?diffBlocks(base, r.proposedText):null;
  const adopted=decisions?applyBlockDecisions(base, r.proposedText, decisions):r.proposedText;
  const accepted=blocks?blocks.filter(b=>decisions[b.id]==='accept'):null;
  const rejected=blocks?blocks.filter(b=>decisions[b.id]!=='accept'):null;
  const replies=opts.replies||{};
  const record=()=>{ if(blocks) r.blockDecisions=blocks.map(b=>({ id:b.id,
    decision:decisions[b.id]==='accept'?'accept':'reject', before:b.before, after:b.after,
    note:noteForBlock(b, r.clauseNotes)||null,
    reply:String(replies[b.id]||'').trim().slice(0,2000)||null })); };
  /* Taking nothing is a rejection. Recording it as an "acceptance" that changed
     no wording would put a false decision on the record and tell the
     counterparty their round was adopted when it was refused outright. */
  if(blocks && blocks.length && accepted.length===0){
    record();
    resolveRound(c, n, false, { comment:opts.comment });
    return;
  }
  record();
  const partly=!!(rejected&&rejected.length);
  const tally=partly?` — ${accepted.length} of ${blocks.length} changes`:'';
  /* The counterparty edits in a plain-text box (and a Word return is plain
     text too), so what comes back is text. Putting it straight into the body
     used to flatten a formatted contract at the FIRST round of every
     negotiation — headings, clause numbering and tables gone for good.
     richFromTextEdit places the edited lines back into the document's own
     structure and verifies the result says exactly what was agreed; only if
     that verification fails do we fall back to plain text, and then the record
     says so rather than leaving a 'rich' marker on a body that is not one. */
  let flattened=false;
  if(wasRich && window.richFromTextEdit){
    const merged=richFromTextEdit(c.redlineText, adopted);
    if(merged) c.redlineText=merged;
    else { c.redlineText=adopted; c.format=TEXT_FORMAT; flattened=true; }
  } else {
    c.redlineText=adopted;
    if(wasRich){ c.format=TEXT_FORMAT; flattened=true; }
  }
  /* A round's outcome moved the wording, so it is listed — this is the "update
     to the contract" a reader means. */
  captureVersion(c, r.via==='word'
    ? `Round ${n} accepted${tally} (returned Word file${r.file?` “${r.file.fileName}”`:''})`
    : `Round ${n} accepted${tally} (redline from ${r.by||'counterparty'})`, u.name);
  r.status='closed';
  r.resolution={ decision:partly?'partly-accepted':'accepted', by:u.name, at:nowISO(),
    comment:String(opts.comment||'').slice(0,2000)||null };
  if(r.proposedValue!=null){ c.value=Number(r.proposedValue); c.approval=null; }
  // A Word round carries the returned .docx itself. Adoption files that file
  // as the contract's CURRENT version (v2, v3…) beside the untouched original,
  // makes its text the extracted text (so search, Copilot review and the reading
  // view all follow the adopted wording), and refreshes the clause scan so the
  // risk flags describe the document as it now reads — through the same
  // scanner the upload ran, Copilot or heuristic alike.
  /* A round that arrived as a returned Word file used to file that file as a
     new document version here. Nothing can produce `via:'word'` since the Word
     round trip was removed, so the block went with it. Rounds themselves are
     untouched: a redline from the counterparty's own page still adopts exactly
     as it did. */
  if(r.via==='word' && r.file){
    if(window.runScan && c.scan) runScan(c);   // stale findings would describe the OLD wording
  }
  // Name BOTH sides. The entry used to record only who decided, so a trail read
  // back later said a round was accepted without ever saying whose wording it
  // was — which is the same omission fix-7 exists to prevent.
  logAudit(c,'Redline',`Round ${n} proposed edits from ${r.by||'the counterparty'} ${partly
      ? `partly accepted by ${u.name} — ${accepted.length} of ${blocks.length} changes adopted, ${rejected.length} not adopted and left open`
      : `accepted by ${u.name}`} — adopted as v${c.versions.length}${r.via==='word'&&r.file?` · returned file “${r.file.fileName}” filed as document version v${(window.wordVersionList?wordVersionList(c):[]).length?(window.wordVersionList(c)[window.wordVersionList(c).length-1].n):2}`:''}${flattened?' · the edit could not be placed back into the formatted document, so it is now plain text':''}`);
  persist(c); renderWorkspace();
  toast(partly
    ? `Round ${n}: ${accepted.length} of ${blocks.length} changes adopted — the rest stay open`
    : `Round ${n} accepted — adopted as new version`);
}

/* ---- who made this change? ----
   Two ways new wording arrives at a contract, and they are not the same event.

   applyOwnerEdit      — we changed it. Recorded as ours, versioned immediately.
   fileCounterpartyEdit— THEY changed it, and it reached us outside HaTi (an
                         emailed Word file, a PDF, a phone call written up).
                         Recorded as a negotiation round in their name, still
                         open, so it goes through the same review and accept
                         step as a redline that came through the portal.

   Before this second path existed, the only way to get a counterparty's
   changes into a contract negotiated over email was to type them into the Edit
   box — which recorded the owner as the author of the other side's wording.
   For a product whose case rests on an honest record, that was the record
   lying, and it is the one thing here that cannot be allowed to stay wrong. */
function applyOwnerEdit(c, text, opts={}){
  if(!canEdit()){ toast('Viewers cannot edit documents','err'); return null; }
  if(c.status==='Signed'){ toast('Executed contracts are sealed and read-only','err'); return null; }
  const txt=String(text==null?'':text);
  if(!txt.trim()){ toast('The document text cannot be empty','err'); return null; }
  const u=currentUser();
  const wasRich=!!(window.isRich&&isRich(c.format)&&c.redlineText);
  /* THE ORIGINAL, and the one copy that can never be recreated. Automatic and
     LISTED: nobody has to remember to take it, and everybody needs it. */
  if(!(c.versions||[]).length) captureVersion(c, isUpload(c)?'As received':'Original text', 'System', {auto:true, listed:true});
  c.redlineText=txt;
  // the plain-text editor produces plain text; say so on the record rather than
  // leaving a 'rich' marker on a body that is no longer one
  if(wasRich && opts.plainText!==false && window.TEXT_FORMAT) c.format=TEXT_FORMAT;
  const v=captureVersion(c, opts.label||`Edited by ${u?.name||'user'}`, u?.name);
  logAudit(c,'Edited',`${opts.detail||'Document wording edited in the workspace'}${(wasRich&&opts.plainText!==false)?' using the plain-text editor — formatting was not retained':''}${v?` — captured as v${v.n}`:''}`);
  c.lastAction=todayStr();
  return v;
}
function fileCounterpartyEdit(c, text, opts={}){
  if(!canEdit()){ toast('Viewers cannot file changes','err'); return null; }
  if(c.status==='Signed'){ toast('Executed contracts are sealed and read-only','err'); return null; }
  const txt=String(text==null?'':text);
  if(!txt.trim()){ toast('The proposed wording cannot be empty','err'); return null; }
  const base=docPlainText(c);
  if(normText(txt)===normText(base)){ toast('That wording is identical to the current document — nothing to file'); return null; }
  const u=currentUser();
  const who=String(opts.by||c.counterparty||'The counterparty').trim();
  c.rounds=c.rounds||[];
  const n=c.rounds.length+1;
  const round={ n, at:opts.at||nowISO(), by:who, status:'open', via:'external',
    comment:opts.comment||`Changes received from ${who} outside HaTi.`,
    baseText:base, proposedText:txt,
    // WHO typed it in is not who wrote it; both belong on the record
    filedBy:u?.name||'System', filedAt:nowISO() };
  c.rounds.push(round);
  logAudit(c,'Changes received',
    `Wording from ${who} received outside HaTi and filed as negotiation round ${n} in their name, for review${opts.channel?` (${opts.channel})`:''} — entered by ${u?.name||'System'}`);
  c.lastAction=todayStr();
  return round;
}

/* Guard used by signDocument: any open round carrying proposed edits? */
function unresolvedRedlines(c){ return (c.rounds||[]).filter(r=>r.status==='open' && r.proposedText).length; }

Object.assign(window,{applyOwnerEdit,listedVersions,takeNamedSnapshot,restoreVersion,restoreBlockedWhy,fileCounterpartyEdit,resolveRound,noteForBlock,diffBlocks,applyBlockDecisions,openPointsFor,docPlainText,docCanonical,htmlToStructuredText,reflowWorkingText,captureVersion,wordDiff,diffHtml,diffStats,tokenize,renderVersionsSection,openDiffModal,openCompareModal,reviewProposedRound,acceptProposedRound,unresolvedRedlines});
