// HaTi — Template Builder (Phase B of the Template Library).
//
// Edits exactly one DRAFT version of a library template: blocks (headings,
// fixed wording, field groups, signature blocks, a branding header) and the
// typed fields the wording refers to as {{placeholders}}. The server refuses
// edits to anything but a draft, so this screen can never touch a published
// version no matter what it sends.
//
// The AI upload route (Phase D) lands its output HERE — this builder is the
// one place template content is shaped, whichever door it came in through.

let _tb = null; // { tid, vid, template, versionNumber, blocks[], fields[], dirty }

const TB_BLOCK_META = {
  heading:         { get label(){ return i18t('tb_heading'); },          tip: 'A section title — never editable by contract creators' },
  fixed_text:      { get label(){ return i18t('tb_fixed_wording'); },    tip: 'Clauses and boilerplate — read-only on every contract' },
  field_group:     { get label(){ return i18t('tb_wording_blanks'); }, tip: 'Text with {{field}} placeholders users fill per deal' },
  signature_block: { get label(){ return i18t('tb_signature_block'); },  tip: 'Name + title + signature, wired into the signing flow' },
  branding:        { get label(){ return i18t('tb_branding_header'); },  tip: 'Logo and company details from the org profile' },
};

/* ═══════ THE DRAFT IS KEPT WHEN YOU PRESS ANYTHING ELSE (17 Sep 2026) ═══════
   The build plan's upgrade 1. This screen was the one place in HaTi where an
   hour's work could vanish on a single press. A draft version lived only in
   what had been typed until somebody pressed Save draft, and EVERY OTHER WAY
   OUT threw it away: Back asked and then discarded, and a press on any sidebar
   door did not even ask — the builder is not a view, so setView replaces
   #content underneath it and viewLayersClosed (js/app.js) knows only about the
   clause editor.

   SO THE FIX IS THE KEEPING, NOT A SECOND WARNING. A guard on every navigation
   would be an interruption on a page that is now safe, and it could not cover
   a refresh or a closed tab anyway. The work being there when you come back
   answers "anything else"; a question cannot.

   IT IS THIS BROWSER'S, AND THE SCREEN SAYS SO. A kept draft never reaches the
   server and never follows anybody to another machine, so the strip prints
   "Draft kept", never "Saved". Save draft is still the one thing that writes a
   version, and Publish still goes through the Design step. A KEPT DRAFT IS NOT
   A SAVED VERSION.

   AND IT NEVER SPEAKS OVER SOMEBODY ELSE'S SAVE. Each draft records `base`, a
   fingerprint of exactly what the server served when it was taken. Where the
   stored draft version has moved since — a colleague pressed Save — the
   restore is ASKED rather than made: putting stale wording silently back over
   a saved version is the fault class this change exists to close, not one to
   introduce at the other end.
   ========================================================================= */
const TB_DRAFT_KEY = 'hati.v1.tbDrafts';
const TB_DRAFT_MAX = 6;    /* how many template versions may hold a kept draft at once */
const TB_DRAFT_MS = 800;   /* the debounce — well under the time one sentence takes to type */
const tbDraftId = (tid, vid) => `${tid}:${vid}`;
/* ---- A BLOCK AS THE BUILDER HOLDS IT, AND AS IT TRAVELS (24 Sep 2026) ----
   `format: 'rich'` rides with a block copied from a document — its content is
   the document's own markup (see TPLFORM_RICH in js/templateform.js). It is
   carried ONLY where it says something, so a plain block is the same three
   keys it always was, on the way in, on the way out and in the kept draft. */
const tbBlockCopy = (b, k) => ({ blockType: b.blockType, content: b.content,
  ...(b.format === 'rich' ? { format: 'rich' } : {}), ...(k != null ? { _k: k } : {}) });
const tbBlockOut = (b, i) => ({ ...(i != null ? { orderIndex: i } : {}), blockType: b.blockType, content: b.content,
  ...(b.format === 'rich' ? { format: 'rich' } : {}) });
const tbRich = b => !!b && b.format === 'rich';
/* The words of a block — what Copilot, the playbook count and every list on
   the rail read. The shared projection where it is on the stage. */
const tbBlockText = b => (typeof tplFormBlockText === 'function' ? tplFormBlockText(b)
  : tbRich(b) ? String((b && b.content) || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : String((b && b.content) || ''));
/* THE FINGERPRINT IS OVER EXACTLY THE TWO SHAPES tbSave WRITES, in tbSave's
   own order, so "has the server moved" is asked of the same bytes the server
   was given. It is a cheap equality and nothing else — not a seal, not a
   version, and never shown to anybody. */
function tbDraftBase(blocks, fields) {
  try {
    /* `format` joins only where it says something, so every plain template's
       fingerprint — and every draft kept before rich blocks existed — is
       byte-identical to what it was. */
    return JSON.stringify([
      (blocks || []).map(b => (b.format === 'rich' ? [b.blockType, b.content, 'rich'] : [b.blockType, b.content])),
      (fields || []).map(f => [f.fieldKey, f.label, f.fieldType, f.control, !!f.required,
        f.defaultValue || '', (f.options || []).join('')]),
    ]);
  } catch (_) { return ''; }
}
function tbDraftAll() {
  try {
    const m = JSON.parse(localStorage.getItem(TB_DRAFT_KEY));
    return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
  } catch (_) { return {}; }
}
function tbDraftRead(tid, vid) {
  const d = tbDraftAll()[tbDraftId(tid, vid)];
  return (d && Array.isArray(d.blocks) && Array.isArray(d.fields)) ? d : null;
}
function tbDraftDrop(tid, vid) {
  try {
    const m = tbDraftAll(); delete m[tbDraftId(tid, vid)];
    localStorage.setItem(TB_DRAFT_KEY, JSON.stringify(m));
  } catch (_) {}
}
/* TRUE ONLY WHERE IT REALLY LANDED. A private window, blocked site data or a
   full quota all refuse, and that refusal is a FACT the strip has to carry:
   for a draft nobody could keep, the old "Unsaved changes" warning is the
   honest sentence and the old blocking guard is the honest guard. So this
   answers whether it wrote, and nothing above it guesses. */
function tbDraftKeep() {
  if (!_tb) return false;
  try {
    const m = tbDraftAll();
    m[tbDraftId(_tb.tid, _tb.vid)] = {
      tid: _tb.tid, vid: _tb.vid, versionNumber: _tb.versionNumber,
      /* The client key `_k` is left behind deliberately: it is this sitting's
         own and tbAdopt mints it again, exactly as tbSave strips it. */
      blocks: _tb.blocks.map(b => tbBlockOut(b)),
      fields: _tb.fields.map(f => ({ ...f })),
      base: _tb.base || '', at: new Date().toISOString(),
    };
    /* BOUNDED, OLDEST OUT FIRST. A store that only ever grows is a quota
       failure waiting for the longest-serving browser in the workspace — and
       the one it would refuse is whichever draft is being typed that day. */
    const ks = Object.keys(m).sort((a, b) => String((m[a] || {}).at).localeCompare(String((m[b] || {}).at)));
    while (ks.length > TB_DRAFT_MAX) delete m[ks.shift()];
    localStorage.setItem(TB_DRAFT_KEY, JSON.stringify(m));
    return true;
  } catch (_) { return false; }
}
const tbDraftWhen = iso => {
  try {
    return new Date(iso).toLocaleTimeString(typeof langLocale === 'function' ? langLocale() : undefined,
      { hour: '2-digit', minute: '2-digit' });
  } catch (_) { return ''; }
};
/* Putting a kept draft in place of what the server served. `_k` is minted
   again here rather than carried: it is an index into THIS sitting and `seq`
   counts from it, so a key from another sitting would collide with the next
   block anybody adds. */
function tbAdopt(d) {
  _tb.blocks = (d.blocks || []).map((b, i) => tbBlockCopy(b, i + 1));
  _tb.fields = (d.fields || []).map(f => ({ ...f }));
  _tb.seq = _tb.blocks.length;
  _tb.dirty = true; _tb.kept = true; _tb.restoredAt = tbDraftWhen(d.at);
}

/* ---- ONE FUNNEL: NOTHING MARKS THIS PAGE DIRTY WITHOUT KEEPING IT ----
   Nine presses used to write `_tb.dirty = true` on their own. They all come
   here now, so a tenth cannot be added that moves the wording and forgets the
   draft — which is the shape this fault had in the first place. The FIRST
   touch of a sitting writes synchronously, so the strip the caller is about to
   repaint is already true; every one after it is debounced. */
let _tbKeepTimer = null;
function tbKeepCancel() { if (_tbKeepTimer) { clearTimeout(_tbKeepTimer); _tbKeepTimer = null; } }
function tbKeepNow() { tbKeepCancel(); if (!_tb) return false; _tb.kept = tbDraftKeep(); return _tb.kept; }
function tbTouch() {
  if (!_tb) return;
  const first = !_tb.dirty;
  _tb.dirty = true;
  _tb.restoredAt = null;   /* typing over a restored draft makes it this sitting's */
  if (first) return void tbKeepNow();
  tbKeepCancel();
  _tbKeepTimer = setTimeout(() => { _tbKeepTimer = null; if (!_tb) return; tbKeepNow(); tbPatchDirty(); }, TB_DRAFT_MS);
}
/* The record is on the server now, so a restore would put stale wording back
   over a version somebody has saved. One caller: tbSave, both branches. */
function tbDraftSettled() {
  tbKeepCancel();
  tbDraftDrop(_tb.tid, _tb.vid);
  _tb.dirty = false; _tb.kept = false; _tb.restoredAt = null;
  _tb.base = tbDraftBase(_tb.blocks, _tb.fields);
}

async function openTemplateBuilder(tid, vid, opts = {}) {
  if (window.tplLibCancelPending) tplLibCancelPending(); // a stale library list must not paint over the builder
  tbKeepCancel();   /* a timer still holding the LAST template must not fire under this one */
  let t, v;
  try {
    t = await api('templates/' + tid);
    v = await api(`templates/${tid}/versions/${vid}`);
  } catch (e) { toast(e.message, 'err'); return; }
  if (v.version.status !== 'draft') { toast(`v${v.version.versionNumber} is ${v.version.status} — only a draft can be edited`, 'err'); return; }
  _tb = {
    tid, vid, template: t.template, versionNumber: v.version.versionNumber,
    /* `_k` IS A CLIENT KEY AND NEVER TRAVELS. A section's ask box, its answer
       and its busy state are held against the HEADING BLOCK it belongs to, and
       an index moves the moment somebody presses an arrow. tbSave maps every
       block to {orderIndex, blockType, content}, so this cannot reach the
       server however long it lives here. */
    blocks: v.blocks.map((b, i) => tbBlockCopy(b, i + 1)),
    fields: v.fields.map(f => ({
      fieldKey: f.field_key, label: f.label, section: f.section || '', fieldType: f.field_type,
      control: f.control, options: f.options || [], required: f.required,
      defaultValue: f.default_value || '', helpText: f.help_text || '',
      detectionConfidence: f.detection_confidence, humanReviewed: f.human_reviewed,
    })),
    dirty: false,
    /* Prompt & Build, per sitting and in memory: what was typed into each
       section's ask box, the answer waiting on each one, the outline proposal
       not yet added, and what Copilot has been asked for on this template. */
    seq: v.blocks.length, ask: {}, outline: null, said: '', reads: 0,
    /* The paper and the rail (13 Sep 2026): the thread each section keeps, the
       outline's line of intent per heading, the sections tagged as context,
       the section in hand, the rail's tab, and whether Copilot is walking the
       template section by section. All per sitting, none of it travels. */
    thread: {}, intent: {}, ctx: [], focus: null, tab: 'build', walk: false, refine: null, lastReceipt: null, busy: null,
    /* What the server just served, what this browser is keeping, and whether a
       kept draft was put back on the way in. */
    base: '', kept: false, restoredAt: null,
  };
  _tb.base = tbDraftBase(_tb.blocks, _tb.fields);

  /* ---- AND THE DRAFT COMES BACK ----
     Four answers, and only one of them asks. A draft that says nothing the
     server does not already hold is dropped rather than announced: telling
     somebody their work was restored when it was already saved teaches them to
     stop believing the line. */
  const kept = tbDraftRead(tid, vid);
  const moved = kept && kept.base !== _tb.base;                        /* somebody else saved under it */
  const same = kept && tbDraftBase(kept.blocks, kept.fields) === _tb.base;
  if (kept && same) tbDraftDrop(tid, vid);
  else if (kept && !moved) tbAdopt(kept);

  /* The section in hand at open is the first one still to write, else the
     first — so the rail has something to say before anything is pressed. */
  const secs = tbSections(); const first = secs.find(x => tbSectionOwes(x)) || secs[0];
  /* ARRIVING FROM THE ONE DOOR (24 Sep 2026): the start says what Copilot's
     first move is, and that move LEADS the rail — so no section is in hand
     yet. This stays the open's ONE write of the section in hand (tbFocus is
     the only other), which is why the start does not write it itself. */
  _tb.focus = first && !opts.start ? first.k : null;
  if (opts.start) tbStartWith(opts.start);
  /* A fresh open is a NAVIGATION and lands at the top of the paper — the place
     tbPaint holds is a repaint's, never another template's. */
  tbPaint({ fresh: true });
  if (_tb.start && _tb.start.kind === 'template') tbBlanksFirst();
  /* THE CONFLICT IS ASKED OVER THE SERVER'S OWN WORDING, never before it: the
     reader is being asked whether to put their draft back over what is on the
     screen, so what is on the screen has to be the version. */
  if (kept && moved && !same) tbAskRestore(kept);
}

/* The one conflict door. Cancel keeps the draft where it is — untouched and
   still there next time — because a reader who is not sure is not the person
   to throw an hour away. */
function tbAskRestore(d) {
  if (typeof confirmDialog !== 'function') return;
  confirmDialog({
    title: i18t('tb_kept_moved_title'),
    message: i18t('tb_kept_moved_msg', { at: tbDraftWhen(d.at) }),
    confirmLabel: i18t('tb_kept_moved_go'), cancelLabel: i18t('tb_kept_moved_stay'),
  }).then(ok => {
    if (!ok || !_tb || _tb.vid !== d.vid) return;
    tbAdopt(d); tbPaint();
  }).catch(() => {});
}

/* ═══════════════════════════ PROMPT & BUILD ═══════════════════════════
   An ask box on every section: say what the section should do, and Copilot
   writes it — out of this workspace's own clause library first, its playbook
   second, and its own drafting last, saying every time which.

   THE BLOCK LIST IS UNCHANGED. A section is a HEADING block plus the wording
   blocks that follow it until the next heading — a reading over the flat list
   the server already stores, never a new shape. Nothing here moves a block,
   and tbSave writes exactly what it always wrote.

   NOTHING ARRIVES UNSEEN. Every answer lands in a CARD above the section with
   Use this / Try again / Write it myself under it; the wording only becomes
   the block's content when a person presses. The plain textarea is untouched
   and still the first thing on the row.
   ===================================================================== */

/* ---- ONE READING OF WHAT A SECTION IS ---- */
function tbSections(blocks) {
  const out = []; let cur = null;
  (blocks || (_tb && _tb.blocks) || []).forEach((b, i) => {
    if (b.blockType === 'heading') { cur = { k: b._k, head: tbRich(b) ? tbBlockText(b).replace(/\s+/g, ' ').trim() : (b.content || ''), headIndex: i, body: [] }; out.push(cur); return; }
    if (cur && (b.blockType === 'fixed_text' || b.blockType === 'field_group')) cur.body.push(i);
  });
  return out;
}
const tbSectionAt = k => tbSections().find(s => s.k === k) || null;
const tbSectionText = (sec, blocks) => { const bs = blocks || (_tb && _tb.blocks) || [];
  return sec ? sec.body.map(i => (bs[i] ? tbBlockText(bs[i]) : '')).join('\n\n').trim() : ''; };
/* ---- A COPIED HEADING OWES NO WORDING (24 Sep 2026) ----
   A section is still to write where its heading was written HERE and nothing
   stands under it. A heading copied from a document is that document's own
   structure — "43 Termination Management Plan" over 43.1, a "Clause 2" line
   over its title, an annex label — and the copy promised that no word
   changed, so nothing is missing under it. Measured on the owner's SaaS
   agreement: 18 of its 118 copied headings stand over nothing, and every one
   was offered a "write this section" prompt and counted as unwritten. ONE
   reading, asked by the paper's prompt, the rail's count, its walk, the
   section in hand at open, and the question Publish asks. */
function tbSectionOwes(sec, blocks) {
  if (!sec || tbSectionText(sec, blocks)) return false;
  const bs = blocks || (_tb && _tb.blocks) || [];
  return !tbRich(bs[sec.headIndex]);
}

/* ---- YOUR OWN PAPER, BEFORE ANY SPEND ----
   CLAUSE_KINDS (js/clausemodel.js) is the product's own heading vocabulary and
   the clause library is keyed on the same categories, so a heading reading
   "Confidentiality" finds the workspace's own mutual-confidentiality wording
   with no model in the room. Read through `window` with a guard: a stage that
   carries the builder but not the clause model offers nothing rather than
   throwing. */
function tbKindOf(head) {
  const KINDS = (typeof window !== 'undefined' && window.CLAUSE_KINDS) || null;
  const h = String(head || '').trim();
  if (!KINDS || !h) return null;
  for (const t of KINDS) if ((t.head && t.head.test(h)) || t.re.test(h)) return t;
  return null;
}
function tbLibraryFor(head) {
  const t = tbKindOf(head); if (!t) return null;
  const lib = (typeof window.clauseLibrary === 'function') ? (clauseLibrary() || []) : [];
  /* `preferred` is a getter on the built-ins (it names the market's own law and
     currency), so it is read here and never spread — the getter trap THE MAP
     names four times over. */
  const e = lib.find(c => c && c.category === t.category);
  const pref = e ? String(e.preferred || '') : '';
  return pref ? { entry: e, kind: t, name: String(e.name || t.category), preferred: pref } : null;
}

/* ---- WHICH BOOK THIS TEMPLATE IS COUNTED AGAINST ----
   playbookKeyFor() reads a CONTRACT — its type and its stream — and a template
   in the builder is neither. Only the two categories that map to a book without
   guessing are mapped; everything else counts against the baseline, and the
   card prints the book's own label so the reader is never left guessing which
   one answered. */
const TB_ASK_MAX = 400;
const TB_PB_KEY = { nda: 'nda', procurement: 'supply' };
const tbPbKey = category => TB_PB_KEY[category != null ? category : ((_tb && _tb.template && _tb.template.category) || '')] || '_default';

/* ---- WHAT THE PLAYBOOK ASKS OF THIS TEMPLATE — arithmetic, not a call ----
   Recomputed on every paint. A position with no section is a DOOR; a range a
   section breaks is a DEVIATION, recorded and never blocking (the owner's
   ruling, 12 Sep 2026). pbRangeRead is the same reader the contract review
   uses, so a template and the contracts drawn from it cannot disagree about
   what "45 days" means. */
function tbCoverage(blocks, category) {
  if (typeof window.resolvePlaybook !== 'function') return null;
  const R = resolvePlaybook(tbPbKey(category));
  const bs = blocks || (_tb && _tb.blocks) || [];
  const secs = tbSections(bs).map(s => ({ s, t: tbKindOf(s.head), text: tbSectionText(s, bs) }));
  const find = category => secs.find(x => x.t && x.t.category === category && x.text) || null;
  const rows = [];
  (R.positions || []).forEach(p => {
    const hit = find(p.category);
    rows.push({ category: p.category, note: p.note || '', escalate: !!p.escalate,
                state: hit ? 'hit' : 'open', where: hit ? hit.s : null });
  });
  (R.ranges || []).forEach(r => {
    const t = (window.CLAUSE_KINDS || []).find(k => k.category === r.label
      || (r.key === 'paymentDays' && k.key === 'payment')
      || (r.key === 'liabilityMonths' && k.key === 'liability'));
    const hit = t ? find(t.category) : null;
    if (!hit) { rows.push({ category: r.label, note: r.note || '', escalate: !!r.escalate, state: 'open', where: null }); return; }
    const m = (typeof window.pbRangeRead === 'function') ? pbRangeRead(r.key, hit.text) : null;
    if (!m) { rows.push({ category: r.label, note: r.note || '', escalate: !!r.escalate, state: 'hit', where: hit.s }); return; }
    const n = Number(m[1]);
    const ok = r.op === '<=' ? n <= r.value : n >= r.value;
    rows.push({ category: r.label, note: r.note || '', escalate: !!r.escalate,
                state: ok ? 'hit' : 'dev', where: hit.s, figure: n, want: r.value, op: r.op });
  });
  const covered = rows.filter(x => x.state !== 'open').length;
  return { label: R.label || '', rows, covered, total: rows.length,
           deviations: rows.filter(x => x.state === 'dev').length };
}
/* THE CLAUSES OUR STANDARDS EXPECT AND THIS TEMPLATE DOES NOT HAVE — each
   ONCE, less any the reader chose to leave out. A book can hold a position
   AND a range on one category (the supply book's liability cap): two
   standards, one missing clause. Measured, the contract card listed
   "Liability cap" twice. One reading for the card and for the publish
   question, so the two cannot count one gap differently. */
function tbMissingStandards(cov) {
  const left = ((_tb && _tb.decided) || {}).left || [];
  const out = [];
  (cov ? cov.rows : []).forEach(r => {
    if (r.state === 'open' && !left.includes(r.category) && !out.some(x => x.category === r.category)) out.push(r);
  });
  return out;
}

/* The position a section is judged against, as one sentence for the prompt and
   for the card — null where the playbook says nothing about this category, so
   an answer never claims a standard that was not written down. */
function tbStandardFor(head, category) {
  const t = tbKindOf(head); if (!t || typeof window.resolvePlaybook !== 'function') return null;
  const R = resolvePlaybook(tbPbKey(category));
  const p = (R.positions || []).find(x => x.category === t.category);
  const r = (R.ranges || []).find(x => x.label === t.category
    || (x.key === 'paymentDays' && t.key === 'payment') || (x.key === 'liabilityMonths' && t.key === 'liability'));
  const bits = [];
  if (p) bits.push(`${p.category}: ${p.pos}${p.note ? ' — ' + p.note : ''}${p.escalate ? ' (Legal signs it off)' : ''}`);
  if (r) bits.push(`${r.label} ${r.op} ${r.value}${r.note ? ' — ' + r.note : ''}`);
  return bits.length ? bits.join('. ') : null;
}

/* WHAT THIS WORKSPACE HAS ACTUALLY AGREED — a FIGURE, never wording.
   precedentMine counts settled rounds; it carries numbers, not clauses, so it
   is offered to the model as a fact and named on the card as one. Absent is
   the honest answer where nothing has been settled on this point. */
function tbPrecedentFor(head) {
  const t = tbKindOf(head); if (!t || typeof window.precedentMine !== 'function') return null;
  let mined = null; try { mined = precedentMine(); } catch (_) { return null; }
  const row = mined && Object.values(mined).find(x => x && x.category === t.category);
  const nums = row && row.numbers ? (row.numbers.oursAccepted || []) : [];
  if (!nums.length) return null;
  const counts = {};
  nums.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const n = Number(best);
  if (!isFinite(n) || (counts[best] || 0) < 2) return null;
  return `${t.category}: ${n}${row.unit ? ' ' + row.unit : ''} has been settled ${counts[best]} times on this book.`;
}

/* ---- ONE DOOR ONTO ADDING A BLOCK ----
   The + Add block button and the outline's "Add N sections" press the SAME
   act. A second push into _tb.blocks is how two paths come to disagree about
   what a new block looks like. */
function tbAddBlock(type, content) {
  if (type === 'branding' && _tb.blocks.some(b => b.blockType === 'branding')) { toast(i18t('tb_already_header'), 'err'); return null; }
  const b = { blockType: type, content: content != null ? content : (type === 'signature_block' ? 'Company' : ''), _k: ++_tb.seq };
  _tb.blocks.push(b);
  tbTouch();
  return b;
}

/* Where a section's wording lives — and where it goes when there is none yet.
   A heading with nothing under it gets ONE wording block, inserted straight
   after it through the same shape tbAddBlock makes, never appended to the end
   of the template where nobody would find it. */
function tbWordingBlock(sec) {
  if (sec.body.length) return sec.body[0];
  const b = { blockType: 'field_group', content: '', _k: ++_tb.seq };
  _tb.blocks.splice(sec.headIndex + 1, 0, b);
  tbTouch();
  return sec.headIndex + 1;
}

/* ---- APPLY ANSWERS THE WHOLE SECTION, NOT ITS FIRST PARAGRAPH (18 Sep 2026) ----
   REPORTED as the second of the seven repairs. The model is shown the section
   through tbSectionText, which joins EVERY body block with a blank line
   between — so it answers the whole section. Apply then wrote sec.body[0] and
   left the rest standing, and a two-paragraph section came out as the new
   wording followed by the old one.

   The accepted text IS the section's wording, so the blocks it replaced go.
   REMOVAL ONLY: tbAddBlock is still the one push into _tb.blocks, and the
   three writers of block CONTENT are unchanged. Highest index first, or each
   splice would move the ones still to come. */
function tbDropExtraBody(sec, keep){
  const extra = ((sec && sec.body) || []).filter(i => i !== keep).sort((a, b) => b - a);
  for (const i of extra) _tb.blocks.splice(i, 1);
  return extra.length;
}

/* ---- WHAT A FAILURE SAYS, ON THE SECTION BEING LOOKED AT ----
   No key, a ceiling, a provider refusal: each has its own sentence and each
   leaves the ordinary textarea one press away. Never a toast that flashes and
   goes — the row keeps the reason until it is answered. */
function tbSay(e) {
  const kind = (e && e.kind) || '';
  if (kind === 'noKey' || (e && e.needsKey)) return i18t('tb_pb_nokey');
  if (kind === 'spendCap' || (e && (e.spendLimit || e.dailyLimit))) return i18t('tb_pb_ceiling');
  if (kind === 'rateLimit') return i18t('tb_pb_busy');
  return i18t('tb_pb_failed', { why: (e && e.message) || '' });
}

/* ═══════════════════════ THE PAPER AND THE RAIL (13 Sep 2026) ═══════════════════════
   Round two of Prompt & Build, built to the owner's word off the "Tag, Talk,
   Apply" vision. The first build put an ask box and a filled button under
   every heading — a form, not a place to write. Now the template is drawn as
   the DOCUMENT it will become (the paper, on the left) and Copilot sits down
   the right in the clause editor's own clothes (the rail). You TAG a section
   and it is the one in hand; you TALK in a thread the section keeps; when you
   like what is on the table you press APPLY and it lands on the paper — the
   same block content a keystroke writes, and nothing else. Then the next.

   WHAT DID NOT MOVE: the block list on the server, tbSave, tbPublish, the
   fields, the blanks reader, the playbook count, the outline route. A section
   is still a heading block and the wording blocks under it (tbSections).

   ONE READING OF "IN HAND": tbFocus is the only writer of _tb.focus, and five
   doors arrive at it — the ✦ in the paper's margin, ◀ ▶ on the focus card,
   the @ picker, Next after an Apply, and "Draft this" on the Playbook tab.
   Copilot never writes into a section it was not tagged for.
   ══════════════════════════════════════════════════════════════════════ */

/* ---- THE OUTLINE: headings only, and nothing is created until you press ----
   On an EMPTY template the rail's first question is the one the sentence box
   used to ask (the owner's ruling, 12 Sep 2026: an empty template only). The
   answer is a list you can untick; Add presses tbAddBlock, the one door. */
async function tbOutlineRun(said) {
  said = String(said == null ? ((document.getElementById('tb-ask') || {}).value || '') : said).trim().slice(0, TB_ASK_MAX);
  if (!said) { toast(i18t('tb_pb_say_first'), 'err'); return; }
  _tb.outline = { busy: true, said }; _tb.ask._ = ''; tbPaintRail();
  /* The playbook's own required categories go out as "do not propose these" and
     come back added by HaTi, marked. "Your playbook requires this" is a fact
     read off the stored book, never a claim the model makes. */
  const cov = tbCoverage();
  const required = cov ? cov.rows.map(r => r.category) : [];
  try {
    const d = await api('ai/outline', 'POST', { sentence: said, kind: (_tb.template && _tb.template.category) || '', required });
    _tb.reads++;
    _tb.outline = tbOutlineFrom(d, said);
    _tb.said = said;
  } catch (e) { _tb.outline = { said, error: tbSay(e) }; }
  tbPaintRail();
}
/* ---- WHERE EACH PROPOSED SECTION'S WORDS WILL COME FROM (one door, 24 Sep
   2026) ---- The owner's rule for a new standard: your clause library FIRST,
   then Our standards, and Copilot drafts only what neither has — and every
   section says which. A reading, asked of the same two functions the rail
   already asks: the library has wording for this heading (lib), the playbook
   holds a position on it but no wording (std), or neither (ai). */
function tbSourceOf(head) { return tbLibraryFor(head) ? 'lib' : tbStandardFor(head) ? 'std' : 'ai'; }
/* ONE READING OF AN OUTLINE, for the rail's own ask and the scratch start:
   the model's headings, then the playbook's open positions it did not name,
   each proposed ONCE. An optional section (an escrow) arrives unticked. */
function tbOutlineFrom(d, said) {
  const cov = tbCoverage();
  /* A SECTION IS PROPOSED ONCE. The playbook's rows come from positions AND
     ranges, which can share a category, and a model that ignored "do not
     propose these" would name one again — so the playbook's additions are
     folded against what is already on the list, and against each other. */
  const fold = h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  const proposed = ((d && d.sections) || []).map(x => ({ heading: x.heading, intent: x.intent || '', on: !x.optional, optional: !!x.optional }));
  /* A NAME IS NOT THE ONLY WAY TWO SECTIONS ARE ONE. Measured: the model's
     "Limitation of liability" and the playbook's "Liability cap" both went on
     the list, both drew the library's liability clause, and the paper carried
     it twice. Each heading is folded under the KIND the playbook reads it as
     (tbKindOf — the reading the coverage and the library already ask) as well
     as under its own words. */
  const kindOf = h => { const t = tbKindOf(h); return t ? fold(t.category) : null; };
  const seen = new Set();
  proposed.forEach(x => { seen.add(fold(x.heading)); const k = kindOf(x.heading); if (k) seen.add(k); });
  const mine = [];
  (cov ? cov.rows : []).filter(r => r.state === 'open').forEach(r => {
    const k = kindOf(r.category);
    if (seen.has(fold(r.category)) || (k && seen.has(k))) return;
    seen.add(fold(r.category)); if (k) seen.add(k);
    mine.push({ heading: r.category, intent: r.note || '', playbook: true, on: true });
  });
  return { said, note: (d && d.note) || '', sections: proposed.concat(mine).map(x => ({ ...x, src: tbSourceOf(x.heading) })) };
}
/* Add the ticked sections; then WALK ME THROUGH IT is on by default (the
   owner's decision 2, 13 Sep 2026) — the first empty section is put in hand
   with its question. `walk:false` is the "I'll write them myself" chip.
   A section from YOUR LIBRARY arrives written (24 Sep 2026): the list said
   "Your library" beside it before the press, and the words are the
   workspace's own approved clause — so the press that adds the section is the
   press that fills it, through tbAddBlock, the one push. Everything else
   arrives empty, for the walk. */
function tbOutlineAdd(opts = {}) {
  const list = (_tb.outline && _tb.outline.sections || []).filter(x => x.on);
  if (!list.length) { toast(i18t('tb_pb_none_ticked'), 'err'); return; }
  list.forEach(x => {
    const h = tbAddBlock('heading', x.heading);
    const lib = (x.src || tbSourceOf(x.heading)) === 'lib' ? tbLibraryFor(x.heading) : null;
    tbAddBlock('field_group', lib ? lib.preferred : '');
    if (h) _tb.intent[h._k] = x.intent || '';
  });
  _tb.outline = null;
  _tb.walk = opts.walk !== false;
  toast(i18tn('tb_pb_added', list.length, { n: list.length }));
  tbPaint();
  const first = tbSections().find(s => tbSectionOwes(s)) || tbSections()[0];
  if (first) tbFocus(first.k, { scroll: true });
}

/* ═══════════════ COPILOT'S FIRST MOVE, ONE PER START (24 Sep 2026) ═══════════════
   Young's go on "One Door to Standards": every start ends in THIS builder,
   and only Copilot's first move differs —
     from scratch              → the list of sections (tbOutlineFrom), each
                                 saying where its words will come from
     from a template you have  → the list of likely blanks, UNTICKED
                                 (decision 3), and what is NOT a blank
     from one of our contracts → what was taken out, and the check against
                                 Our standards, plus what the other side
                                 changed in negotiation
   All of it is held per sitting (_tb.start and what it carries) and none of
   it travels: a save writes blocks and fields exactly as before. */
function tbStartWith(st) {
  _tb.start = st || null;
  if (!st) return;
  if (st.kind === 'scratch') {
    _tb.said = st.said || '';
    _tb.outline = st.outline ? tbOutlineFrom(st.outline, st.said || '') : null;
    /* The outline the start asked for is a read spent in this sitting, and
       the card's cost line counts reads — measured, it said "read 0" under
       an answer that had just been paid for. A REFUSED outline keeps the
       sentence in the box it is asked from again: the start promised it
       would be kept, and it was not drawn anywhere. */
    if (st.outline) _tb.reads++;
    else if (st.said) _tb.ask._ = st.said;
    _tb.tab = 'build'; _tb.walk = true;
  } else if (st.kind === 'template') {
    _tb.tab = 'blanks';
    _tb.cands = { busy: true, rows: [], notes: [], leave: [], all: false };
  } else if (st.kind === 'contract') {
    _tb.tab = 'build';
    _tb.taken = (st.taken || []).map(t => ({ ...t }));
    _tb.negotiated = (st.negotiated || []).slice();
    _tb.decided = { kept: [], left: [], neg: [] };
  }
}

/* ---- WHAT LOOKS LIKE A BLANK IN A COPIED DOCUMENT ----
   HaTi finds the CANDIDATES itself, and Copilot only labels them — small
   questions, asked in pieces, so a long document never hits a limit. Two
   kinds of candidate:
     · what the document marks as a gap itself — a bracket, a ruled line, a
       Word fill-in field — read by THE SAME matcher that finds the blanks in
       paper the other side sent us (js/uploadblanks.js), never a second one;
     · a FACT a deal usually sets — a company's name, an amount, a date —
       offered only where Copilot can say whether it is one. Without Copilot
       these are not offered at all, and the card says so. */
const TB_CAND_MAX = 60;       /* the most suggestions one copied document offers */
const TB_CAND_CHUNK = 30;     /* asked of Copilot this many at a time — the route's own BLANK_LABEL_MAX */
const TB_CAND_SHOWN = 8;      /* drawn before "… and N more" */
const TB_CO_RE = /\b((?:[A-Z][\w&.'’-]*|[a-z]+[A-Z][\w&.'’-]*)(?:\s+(?:[A-Z][\w&.'’-]*|of|and|&)){0,5}\s+(?:A\/S|ApS|AB|Ltd\.?|Limited|PLC|plc|LLC|Inc\.?|GmbH|AG|S\.A\.|B\.V\.|N\.V\.|Pty\s+Ltd|Oy|ASA|SARL|S\.p\.A\.|Srl|Corp\.?|Corporation))(?![\w])/g;
const TB_MONEY_RE = /(?:[€$£]\s?|\b(?:USD|EUR|GBP|SEK|KES|DKK|NOK|CHF|ZAR|UGX|TZS)\s?)\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{1,2})?(?![\d])|\b\d{1,3}(?:[,.\s]\d{3})+(?:[.,]\d{1,2})?\s?(?:USD|EUR|GBP|SEK|KES|DKK|NOK|CHF)\b/g;
const TB_DATE_RE = /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/g;
const tbTextBlocks = () => _tb.blocks.map((b, i) => i).filter(i => ['heading', 'fixed_text', 'field_group'].includes(_tb.blocks[i].blockType));
/* How many places a set of words would change — measured by DOING it on a
   copy, longest first, so "nShift Group A/S" and "nShift" are not counted
   twice where one sits inside the other. */
function tbPlaces(needles) {
  const list = Array.from(new Set((needles || []).filter(Boolean))).sort((a, b) => b.length - a.length);
  let n = 0;
  for (const i of tbTextBlocks()) {
    let b = { ..._tb.blocks[i] };
    for (const x of list) {
      const r = typeof tplFormBlockReplace === 'function' ? tplFormBlockReplace(b, x, '\u0000') : { content: b.content, n: 0 };
      n += r.n; b = { ...b, content: r.content };
    }
  }
  return n;
}
function tbOurName() {
  return String((window.ORG_BRANDING && ORG_BRANDING.companyName) || (typeof FIRST_PARTY === 'string' ? FIRST_PARTY : '') || '').trim();
}
function tbBlankCandidates() {
  const blocks = tbTextBlocks().map(i => _tb.blocks[i]);
  const text = blocks.map(b => tbBlockText(b)).join('\n');
  const ours = tbOurName().toLowerCase();
  const out = []; const seen = new Set();
  const ctx = t => { const at = text.indexOf(t); if (at < 0) return ''; return text.slice(Math.max(0, at - 90), at + t.length + 90).replace(/\s+/g, ' ').trim(); };
  const add = (t, kind, label) => {
    const k = String(t || '').trim(); if (!k || k.length < 3 || seen.has(k) || out.length >= TB_CAND_MAX) return;
    if (ours && k.toLowerCase() === ours) return;
    seen.add(k); out.push({ id: 'c' + (out.length + 1), text: k, kind, label: label || '', context: ctx(k) });
  };
  /* 1. What the document marks itself — the received-paper matcher, walked
        over every block's own markup (or its words, for a plain block). */
  if (typeof upWalk === 'function' && typeof upNodesFrom === 'function') {
    for (const b of blocks) {
      const html = tbRich(b) ? b.content : (typeof esc === 'function' ? esc(b.content) : String(b.content || ''));
      upWalk(upNodesFrom(html, true), ({ hit, node }) => {
        if (hit.kind === 'rule') {
          /* A RULED LINE IS KEYED ON THE WORDS IN FRONT OF IT — the same
             string of underscores elsewhere is a different question — so the
             needle is the line WITH those words, exactly as written. */
          const from = Math.max(0, hit.s - 30);
          const pre = String(node.text || '').slice(from, hit.s).replace(/^\S*\s/, '');
          if (!pre.trim()) return;
          add(pre + hit.raw, 'line', typeof upLabel === 'function' ? upLabel(typeof upLead === 'function' ? upLead(pre) : pre) : pre.trim());
          return;
        }
        /* A {{marker}} IS ALREADY A BLANK HERE — it is the builder's own
           syntax, and the received-paper matcher reads it as one of its three
           shapes. Offered back, it asked the reader to make a blank of a blank
           (measured: all seven of a HaTi template's, "tick the ones to make
           blanks"). */
        if (/^\{\{[\s\S]*\}\}$/.test(hit.raw)) return;
        const inner = /^\[(.*)\]$/.exec(hit.raw);
        add(hit.raw, 'mark', typeof upLabel === 'function' ? upLabel((inner ? inner[1] : hit.name).replace(/^(?:insert|please add|add|enter|type)\s+/i, '')) : hit.name);
      });
    }
  }
  /* 2. Facts a deal usually sets — only where Copilot will say which they are. */
  if (typeof copilotAvailable === 'function' && copilotAvailable()) {
    for (const re of [TB_CO_RE, TB_MONEY_RE, TB_DATE_RE]) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(text))) { if (m.index === re.lastIndex) re.lastIndex++; add((m[1] || m[0]).trim(), re === TB_CO_RE ? 'party' : re === TB_MONEY_RE ? 'money' : 'date'); }
    }
  }
  return out.map(c => ({ ...c, places: tbPlaces([c.text]) })).filter(c => c.places > 0);
}
/* A variant is kept only where it is really in the document, is not one of
   the document's own DEFINED TERMS ("the Supplier") and is not our own name. */
function tbVariantsOk(vs) {
  const text = tbTextBlocks().map(i => tbBlockText(_tb.blocks[i])).join('\n');
  const ours = tbOurName().toLowerCase();
  return (vs || []).filter(v => {
    const x = String(v || '').trim();
    if (x.length < 3 || (ours && x.toLowerCase() === ours) || !text.includes(x)) return false;
    return !new RegExp(`[“"‘']\\s*${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[”"’']`).test(text);
  });
}
async function tbBlanksFirst() {
  const C = _tb.cands; if (!C) return;
  const cands = tbBlankCandidates();
  const ai = typeof copilotAvailable === 'function' && copilotAvailable();
  const answered = new Map();
  let category = null;
  if (ai && cands.length) {
    try {
      for (let i = 0; i < cands.length; i += TB_CAND_CHUNK) {
        const chunk = cands.slice(i, i + TB_CAND_CHUNK);
        const d = await api('ai/blanks', 'POST', { candidates: chunk.map(c => ({ id: c.id, text: c.text, context: c.context })),
          title: (_tb.template && _tb.template.name) || '', company: tbOurName() }, { quiet: true });
        _tb.reads++;
        (d.items || []).forEach(it => answered.set(it.id, it));
        if (!category && d.category) category = d.category;
      }
    } catch (e) { C.error = tbSay(e); }
  }
  const rows = [], notes = [], leave = [];
  let dropped = 0;
  for (const c of cands) {
    const it = answered.get(c.id);
    if (it && it.kind === 'note') { notes.push({ id: c.id, text: c.text, why: it.why || '', places: c.places }); continue; }
    if (it && it.kind === 'leave') { leave.push({ id: c.id, text: c.text, why: it.why || '' }); continue; }
    /* UNANSWERED, a fact is not offered — HaTi cannot tell a party's name from
       wording that must stand — and a gap the document marks itself is, with
       HaTi's own label. What was left out is COUNTED and said (a cap is a
       fact, never a silent trim): measured, an answer that labelled nothing
       made every name, amount and date vanish without a word. */
    if (!it && !['mark', 'line'].includes(c.kind)) { dropped++; continue; }
    const variants = it ? tbVariantsOk(it.variants) : [];
    rows.push({ id: c.id, text: c.text, label: (it && it.label) || c.label || c.text, type: (it && it.type) || (c.kind === 'money' ? 'num' : c.kind === 'date' ? 'date' : c.kind === 'party' ? 'party' : 'text'),
      variants, places: tbPlaces([c.text, ...variants]), on: false });
  }
  if (!_tb || _tb.cands !== C) return;          /* the reader left, or started again */
  Object.assign(C, { busy: false, rows, notes, leave, nokey: !ai, asked: cands.length, dropped });
  /* THE CATEGORY IS COPILOT'S READING OF THE KIND OF AGREEMENT, filled in
     only where nobody has chosen one yet — and it lands on the head's chip,
     one press from being changed (decision 5). */
  if (category && category !== 'other' && _tb.template && (_tb.template.category || 'other') === 'other') {
    /* The answer lands on THIS template only: the reader may have opened
       another while the PATCH was out, and its head must not take this one's. */
    const tid = _tb.tid;
    try { const r = await api('templates/' + tid, 'PATCH', { category }, { quiet: true }); if (r && r.template && _tb && _tb.tid === tid) _tb.template = r.template; }
    catch (_) { /* the reading stays a reading; the chip still says Other */ }
    if (!_tb || _tb.tid !== tid) return;
  }
  /* THE PAPER IS NOT REPAINTED: nothing on it moved, and the reader may be
     typing in it while Copilot answered. The rail and the head are. */
  tbPaintRail();
  if (typeof tbPaintHead === 'function') tbPaintHead();
}
/* ---- MAKE N BLANKS — the count follows the ticks ----
   Every ticked suggestion becomes one field, and every place its words stand
   — and any variant Copilot named — becomes that field's marker, through the
   ONE word-replacing act. Longest words first, so a short trading name never
   bites into the long one. Markers land BEFORE the fields exist (the kept
   blank's own order): a field with nothing pointing at it is the bug. */
function tbMakeBlanks() {
  const C = _tb.cands; if (!C) return;
  const on = C.rows.filter(r => r.on); if (!on.length) return;
  const keys = new Set(_tb.fields.map(f => f.fieldKey));
  const mint = label => {
    const base = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^([0-9])/, 'f$1').slice(0, 60) || 'field';
    let k = base, n = 2; while (keys.has(k)) k = base + '_' + (n++); keys.add(k); return k;
  };
  on.forEach(r => { r.key = mint(r.label); });
  const jobs = [];
  on.forEach(r => [r.text, ...(r.variants || [])].forEach(x => jobs.push({ x, key: r.key })));
  jobs.sort((a, b) => b.x.length - a.x.length);
  const landed = new Map();
  for (const j of jobs) {
    const n = tbReplaceWords(tbTextBlocks(), j.x, '{{' + j.key + '}}');
    if (n) landed.set(j.key, (landed.get(j.key) || 0) + n);
  }
  let places = 0;
  on.forEach(r => {
    const n = landed.get(r.key) || 0; if (!n) return;
    places += n;
    _tb.fields.push({ fieldKey: r.key, label: r.label, section: '', fieldType: TB_BLANK_TYPE[r.type] || 'short_text',
      control: 'free', options: [], required: false, defaultValue: '', helpText: '', detectionConfidence: 'manual', humanReviewed: true });
  });
  C.rows = C.rows.filter(r => !r.on);
  tbTouch();
  toast(i18tn('tb_c_made', landed.size, { n: landed.size, p: places }), 'ok');
  tbPaint();
}
/* A NOTE TO WHOEVER DRAFTS is not wording anybody signs: take it out, or keep
   it where it is. Taking it out is the same one act as every other word
   replacement. */
function tbCandNote(id, remove) {
  const C = _tb.cands; if (!C) return;
  const n = C.notes.find(x => x.id === id); if (!n) return;
  if (remove) { const k = tbReplaceWords(tbTextBlocks(), n.text, ''); if (k) { tbTouch(); toast(i18tn('tb_c_removed', k, { n: k }), 'ok'); } }
  C.notes = C.notes.filter(x => x.id !== id);
  tbPaint();
}

/* ---- FROM ONE OF OUR CONTRACTS: put a deal detail back ----
   The route said which words each blank replaced; putting one back is the
   same one act in reverse, and the field goes with its last marker. */
function tbPutBack(key) {
  const t = (_tb.taken || []).find(x => x.key === key && !x.back); if (!t || !t.value) return;
  const n = tbReplaceWords(tbTextBlocks(), '{{' + key + '}}', t.value, true);
  t.back = true;
  if (!tbPlaceholderUse(key)) _tb.fields = _tb.fields.filter(f => f.fieldKey !== key);
  tbTouch();
  toast(i18tn('tb_k_put_back', n, { n, what: t.value }), 'ok');
  tbPaint();
}
/* A clause the other side moved, found on this template by its heading — the
   label the record kept, folded, against each section's own heading. */
function tbSectionForClause(label, heading) {
  const fold = x => String(x || '').toLowerCase().replace(/\b(?:clause|section|article)\b/g, ' ').replace(/[^a-z]+/g, ' ').trim();
  const want = [fold(heading), fold(label)].filter(x => x.length >= 4);
  if (!want.length) return null;
  return tbSections().find(s => { const h = fold(s.head); return h.length >= 4 && want.some(w => w === h || w.includes(h) || h.includes(w)); }) || null;
}
/* Our first draft of that clause, on the section's own card: Apply is "go back
   to your first draft", and it is the ONE writer Apply always was. */
function tbCompareFirst(clauseId) {
  const x = (_tb.negotiated || []).find(n => n.clauseId === clauseId); if (!x) return;
  const sec = tbSectionForClause(x.clause, x.heading); if (!sec) return;
  tbFocus(sec.k, { scroll: true });
  tbTurn(sec.k, { who: 'ai', text: i18t('tb_k_first_says', { cp: (_tb.start && _tb.start.counterparty) || i18t('tb_k_they') }),
    card: { src: i18t('tb_k_first_src'), tone: 'lib', free: true, text: x.first, before: tbSectionText(sec), rests: '' } });
  tbPaintRail();
}
/* "Add our clause" puts the heading and the library's own wording where the
   agreement's clauses are — before the signatures, never after them. The two
   blocks are made by tbAddBlock (the one push) and then MOVED, not pushed. */
function tbAddStandard(category) {
  const lib = tbLibraryFor(category);
  const h = tbAddBlock('heading', category); const w = tbAddBlock('field_group', lib ? lib.preferred : '');
  const sig = _tb.blocks.findIndex(b => b.blockType === 'signature_block');
  if (h && w && sig >= 0 && sig < _tb.blocks.indexOf(h)) {
    _tb.blocks = _tb.blocks.filter(b => b !== h && b !== w);
    _tb.blocks.splice(sig, 0, h, w);
  }
  tbPaint(); if (h) tbFocus(h._k, { scroll: true });
}

/* ---- THE ONE READING OF WHICH SECTION IS IN HAND ---- */
const TB_RAIL_MIN = 1024;
/* Below 1024 the rail is not drawn — the clause editor's own rule (decision 3):
   two columns stop making sense, and the paper still types. A stage with no
   window (the node harness) draws it. */
const tbRailFits = () => typeof window === 'undefined' || !window.innerWidth || window.innerWidth >= TB_RAIL_MIN;
const tbSectionNo = sec => { const i = tbSections().findIndex(s => s.k === sec.k); return i < 0 ? 0 : i + 1; };
const tbThread = k => (_tb.thread[k] = _tb.thread[k] || []);
const tbTurn = (k, t) => { tbThread(k).push(t); return t; };
function tbNextEmpty(fromK) {
  const secs = tbSections(); if (!secs.length) return null;
  const i = secs.findIndex(s => s.k === fromK);
  for (let n = 1; n <= secs.length; n++) { const s = secs[(i + n + secs.length) % secs.length]; if (tbSectionOwes(s) && s.k !== fromK) return s; }
  return null;
}
function tbFocus(k, opts = {}) {
  const sec = k == null ? null : tbSectionAt(k);
  _tb.focus = sec ? sec.k : null;
  _tb.refine = null;
  if (sec) _tb.tab = 'build';
  tbPaintRail();
  tbPaintFocusFrame();
  if (sec && opts.scroll) { const el = document.querySelector(`[data-tb-sec="${sec.k}"]`); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }
  if (opts.ask) { const box = document.getElementById('tb-ask'); if (box) { if (opts.prefill != null) box.value = String(opts.prefill); box.focus(); } }
  return sec;
}
function tbStep(d) {
  const secs = tbSections(); if (!secs.length) return;
  const i = secs.findIndex(s => s.k === _tb.focus);
  tbFocus(secs[((i < 0 ? 0 : i) + d + secs.length) % secs.length].k, { scroll: true });
}
function tbSetTab(tab) { _tb.tab = tab; tbPaintRail(); }
function tbSetWalk(on) { _tb.walk = !!on; tbPaintRail(); }

/* ---- WHAT A QUESTION SOUNDS LIKE — HaTi's own, no read ----
   Walk me through it asks one plain question per section, composed from the
   outline's line of intent and the figure the playbook cares about. The draft
   is the one read; the question costs nothing. */
function tbQuestionFor(sec) {
  const intent = (_tb.intent && _tb.intent[sec.k]) || '';
  const std = tbStandardFor(sec.head);
  const parts = [i18t('tb_walk_q', { n: tbSectionNo(sec), head: sec.head || i18t('tb_untitled') })];
  if (intent) parts.push(intent);
  parts.push(std ? i18t('tb_walk_std', { std: std.replace(/\.\s*$/, '') }) : i18t('tb_walk_nostd'));
  return parts.join(' ');
}
/* What a card rests on, composed from what HaTi actually showed the model —
   never a claim the model makes about itself. */
function tbRestsLine(sec, lib) {
  const bits = [];
  const std = tbStandardFor(sec.head); const pre = tbPrecedentFor(sec.head);
  bits.push(`${i18t('tb_rest_pb')} · ${std || i18t('tb_rest_none')}`);
  if (pre) bits.push(`${i18t('tb_rest_pre')} · ${pre}`);
  bits.push(`${i18t('tb_rest_lib')} · ${lib ? lib.name : i18t('tb_rest_none')}`);
  return i18t('tb_pb_rests', { on: bits.join(' · ') });
}
/* The sections tagged with @ ride along as context: read, never rewritten. */
function tbContextText() {
  return (_tb.ctx || []).map(k => tbSectionAt(k)).filter(s => s && tbSectionText(s))
    .map(s => `${tbSectionNo(s)}. ${s.head}\n${tbSectionText(s)}`).join('\n\n');
}

/* ---- YOUR OWN WORDING, AT NO COST ----
   Pressed from the library chip. No route is called and nothing is spent: the
   card is built from the workspace's own clause library and says so. */
/* THE ONE READING of whether the library has anything to say about this
   section: it has wording, and that wording is not already what the section
   says. Asked at the DRAW (the chip stands down) and at the PRESS (the act
   refuses), so the sign and the wall cannot disagree. Compared on words, not
   bytes — trailing spaces and a line break are not a proposal. */
function tbLibraryOffers(sec, lib) {
  const l = lib || tbLibraryFor(sec && sec.head); if (!l) return false;
  const fold = x => String(x || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const w = fold(l.preferred); if (!w) return false;
  return w !== fold(tbSectionText(sec));
}
function tbUseLibrary(k) {
  const sec = tbSectionAt(k); if (!sec) return;
  const lib = tbLibraryFor(sec.head); if (!lib) return;
  if (!tbLibraryOffers(sec, lib)) { toast(i18t('tb_pb_lib_same'), 'warn'); return; }
  tbTurn(k, { who: 'ai', text: i18t('tb_pb_rests_lib', { name: lib.name }),
    card: { src: i18t('tb_pb_src_lib'), tone: 'lib', free: true, text: lib.preferred, before: tbSectionText(sec), rests: tbRestsLine(sec, lib) } });
  tbPaintRail();
}

/* ---- COPILOT DRAFTS THIS SECTION ----
   Through copilotPropose in template mode — the product's own drafting call.
   It is shown the workspace's own wording, its playbook position and any figure
   it has actually settled, and asked to say which it kept. A refinement is the
   same call with the card's own text as the passage. */
async function tbDraft(k, said, o = {}) {
  const sec = tbSectionAt(k); if (!sec) return;
  said = String(said == null ? ((document.getElementById('tb-ask') || {}).value || '') : said).trim().slice(0, TB_ASK_MAX);
  if (!said) { toast(i18t('tb_pb_say_first'), 'err'); return; }
  if (!window.copilotPropose || !(typeof copilotAvailable === 'function' && copilotAvailable())) {
    tbTurn(k, { who: 'you', text: said }); tbTurn(k, { who: 'ai', text: i18t('tb_pb_nokey'), tone: 'amber' }); tbPaintRail(); return;
  }
  const refine = o.refine || _tb.refine || null;
  tbTurn(k, { who: 'you', text: said });
  _tb.ask[k] = ''; _tb.busy = k; tbPaintRail();
  const lib = tbLibraryFor(sec.head);
  const before = refine ? refine.text : tbSectionText(sec);
  try {
    const made = await copilotPropose({
      template: true, heading: sec.head, instruction: said,
      kind: (_tb.template && _tb.template.category) || '',
      party: (window.ORG_BRANDING && ORG_BRANDING.companyName) || '',
      passage: before,
      library: lib ? lib.preferred : '',
      standard: tbStandardFor(sec.head) || '',
      precedent: tbPrecedentFor(sec.head) || '',
      others: tbContextText(),
    });
    _tb.reads++;
    if (!made) tbTurn(k, { who: 'ai', text: i18t('tb_pb_unreadable'), tone: 'amber' });
    else if (!String(made.proposedText || '').trim()) {
      /* AN ANSWER IS NOT WORDING. AI_PROPOSAL_FORMAT asks for an empty
         proposedText where the model cannot draft from what it was shown, so
         this branch is the honest one, not an error: what it said is printed
         and nothing is filed. */
      tbTurn(k, { who: 'ai', answered: String(made.advice || '').trim() || i18t('tb_pb_no_wording') });
    } else {
      tbTurn(k, { who: 'ai', text: String(made.advice || '').trim(),
        card: { src: lib ? i18t('tb_pb_src_lib') : i18t('tb_pb_src_ai'), tone: lib ? 'lib' : 'ai',
          text: String(made.proposedText).trim(), asked: said, read: _tb.reads, before, rests: tbRestsLine(sec, lib) } });
    }
  } catch (e) { tbTurn(k, { who: 'ai', text: tbSay(e), tone: 'amber' }); }
  _tb.busy = null; _tb.refine = null; _tb.ctx = [];
  tbPaintRail();
}

/* ---- IS THIS CARD CARRYING WORDING, OR A REMARK ABOUT THE JOB? ----
   (Young reported it 17 Sep 2026, over a screenshot of section 3 of a
   Transportation Management template reading "Without seeing HaTi's own
   standard wording … I risk drafting something that …")

   THE CAUSE IS FIXED ONE LEVEL UP — aiLooksConversational's verb list is
   inverted now, so a refusal comes back as `advice` with an empty
   proposedText and tbSend's `answered` branch prints it with no card at all.
   THIS IS THE SECOND WALL, and it exists because the first one is a
   JUDGEMENT about sentences: the guard has been extended three times and the
   model found a new phrasing each time. Asked again HERE, at the one press
   that writes into the template, so a sentence that slips the reading still
   cannot become a clause.

   ONE READING, TWO ASKERS — the card and the press — so a card that offers
   Apply and a press that refuses it can never be the same card. Where the
   module that answers is not on this stage the answer is "wording", which is
   exactly how this page behaved before the wall existed. */
function tbCardWording(a){
  const t = String((a && a.text) || '').trim();
  if (!t) return false;
  try{ if (typeof aiLooksConversational === 'function' && aiLooksConversational(t)) return false; }catch(_){ }
  return true;
}

/* ---- APPLY: the one press that moves wording into the record ----
   It writes the SAME block content a keystroke writes — no second writer — and
   then asks the blanks reader what should be a blank. Walk me through it moves
   the section in hand on to the next empty one; the paper is not scrolled, so
   the words that just landed stay in view. */
async function tbAccept(k, idx) {
  const sec = tbSectionAt(k); const turn = tbThread(k)[idx]; const a = turn && turn.card;
  if (!sec || !a || !a.text || a.applied) return;
  /* THE SECOND WALL, asked at the press — see tbCardWording. The card does not
     draw Apply for one of these, so this is reached only by a door that got
     round the drawing; it refuses in words rather than silently. */
  if (!tbCardWording(a)){
    tbTurn(k, { who: 'ai', text: i18t('tb_not_wording'), tone: 'amber' });
    tbPaintRail();
    return;
  }
  const bi = tbWordingBlock(sec);
  _tb.blocks[bi].content = a.text;
  /* Copilot's wording is plain text, so the block is plain from here on: the
     card showed the section's whole text against it before the press. */
  delete _tb.blocks[bi].format;
  tbDropExtraBody(sec, bi);
  tbTouch();
  a.applied = true;
  const receipt = i18t('tb_pb_applied', { n: tbSectionNo(sec), head: sec.head || i18t('tb_untitled') });
  tbTurn(k, { who: 'ai', receipt });
  tbPaintPaper(); tbPatchDirty();
  tbBlanksRun(k, a.text);
  const nx = _tb.walk ? tbNextEmpty(k) : null;
  if (nx) { _tb.lastReceipt = { k: nx.k, text: receipt }; tbFocus(nx.k); return; }
  tbPaintRail();
}

/* ---- THE BLANKS PROPOSE THEMSELVES ----
   The same reader that turns an uploaded Word file into a template with
   fields, pointed at one section. HELD OUTSIDE _tb.fields until kept, so a
   proposal can never ride a save: tbSave writes _tb.fields and nothing else. */
const TB_BLANK_TYPE = { text: 'short_text', party: 'short_text', num: 'number', date: 'date', select: 'select' };
async function tbBlanksRun(k, text) {
  if (!String(text || '').trim() || !(typeof copilotAvailable === 'function' && copilotAvailable())) return;
  try {
    const d = await api('ai/blanks', 'POST', { text }, { quiet: true });
    /* IT IS A READ LIKE THE OTHER TWO (a repair off the 18 Sep list). Every
       Apply fires this second call; it is metered on the server, so leaving it
       out of the count made the card's "read N" a number that did not match
       the bill. Counted where the other two count it: after the answer is
       back. */
    _tb.reads++;
    const have = _tb.fields.map(f => f.fieldKey);
    const rows = (d.fields || [])
      .filter(f => f && f.find && String(text).includes(f.find) && !have.includes(f.key))
      .map(f => ({ k, key: String(f.key || '').slice(0, 64), label: String(f.label || f.key || ''),
                   type: TB_BLANK_TYPE[f.type] || 'short_text', opts: Array.isArray(f.opts) ? f.opts : [],
                   required: !!f.required, maps: String(f.maps || ''), find: String(f.find) }));
    if (rows.length) { _tb.proposed = (_tb.proposed || []).concat(rows); tbPaint(); }
  } catch (e) {
    /* AN EMPTY ANSWER IS ORDINARY; A REFUSAL IS A FACT (the same repair). A
       blank nobody proposed is the ordinary case and is still silent — that is
       the branch above, which simply adds no rows. This one is the call not
       coming back at all: no key, the daily ceiling, a provider refusal. It
       was swallowed whole, so a builder that had quietly stopped proposing
       blanks looked identical to one with nothing to propose. tbSay gives each
       its own sentence and it lands on the section being looked at. */
    tbTurn(k, { who: 'ai', text: tbSay(e), tone: 'amber' });
    tbPaintRail();
  }
}
/* ---- A WORD IN THE WORDING BECOMES SOMETHING ELSE — ONE ACT (24 Sep 2026) ----
   Keeping a suggested blank, making several blanks at once, putting a deal
   detail back, taking out a note to the drafter: four presses, ONE move —
   every occurrence of some words, in the given blocks, replaced — so they share
   this one writer, and what may write a block is still three things (f306
   (7)): Apply, typing, and this. In a copied document only the TEXT between
   tags is touched, never a tag (tplFormBlockReplace). Returns how many places
   changed, which is what every caller reports. */
/* `asText` says the replacement is WORDS rather than a marker, so a copied
   document gets them escaped as its text is ("Smith & Co" → "Smith &amp; Co"). */
const tbEscText = x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function tbReplaceWords(indices, find, repl, asText) {
  let n = 0;
  for (const bi of indices || []) {
    const b = _tb.blocks[bi]; if (!b || !find) continue;
    const put = asText && tbRich(b) ? tbEscText(repl) : repl;
    const r = typeof tplFormBlockReplace === 'function' ? tplFormBlockReplace(b, find, put)
      : { content: String(b.content || '').split(String(find)).join(put), n: String(b.content || '').split(String(find)).length - 1 };
    if (!r.n) continue;
    _tb.blocks[bi].content = r.content;
    n += r.n;
  }
  return n;
}
function tbKeepBlank(i) {
  const p = (_tb.proposed || [])[i]; if (!p) return;
  const sec = tbSectionAt(p.k);
  /* The marker is placed where the wording actually is — by literal
     replacement, the same move the upload path makes — so a field can never
     exist with nothing pointing at it. */
  if (sec) tbReplaceWords(sec.body, p.find, '{{' + p.key + '}}');
  _tb.fields.push({ fieldKey: p.key, label: p.label, section: '', fieldType: p.type,
    control: p.opts.length ? 'guided' : 'free', options: p.opts, required: p.required,
    defaultValue: '', helpText: '', detectionConfidence: 'manual', humanReviewed: true });
  _tb.proposed.splice(i, 1);
  tbTouch(); tbPaint();
}
function tbDropBlank(i) { (_tb.proposed || []).splice(i, 1); tbPaint(); }


/* ---- WHAT THE SCREEN DRAWS. Counting is not drawing: every figure below is
   read by one of the functions above and this half computes nothing. ---- */
const TB_TAG = (t, tone) => {
  const c = { steel: ['var(--st-steel-bg)', 'var(--st-steel-fg)', 'var(--st-steel-line)'],
              amber: ['var(--st-amber-bg)', 'var(--st-amber-fg)', 'var(--st-amber-line)'],
              ruby: ['var(--st-ruby-bg)', 'var(--st-ruby-fg)', 'var(--st-ruby-line)'] }[tone]
          || ['var(--surface-2)', 'var(--color-neutral-600)', 'var(--color-divider)'];
  return `<span style="display:inline-flex;align-items:center;font-size:var(--t-micro);font-weight:var(--w-strong);padding:2px 7px;border-radius:var(--radius);white-space:nowrap;background:${c[0]};color:${c[1]};border:1px solid ${c[2]}">${t}</span>`;
};
/* The four refinement chips are presets on the same drafting call; the
   instruction is English because the prompt is. */
const TB_CHIP_ASK = {
  shorter: 'Shorten this section. Keep every obligation and every figure.',
  firmer: 'Make this section firmer in our favour, keeping its structure and every figure.',
  mutual: 'Make the obligations in this section mutual where they are one-sided.',
  plain: 'Rewrite this section in plain English, keeping every obligation and every figure.',
};

/* ---- THE PAPER'S OWN SHEET ----
   Emitted with the page and scoped to .tb-page. The paper borrows the document
   sheet's width and feel; the rail borrows the clause editor's clothes value
   for value (one stylesheet per builder — THE CLOTHES FOLLOW THE BUILDER). */
function tbStyleHtml() {
  return `<style id="tb-style">
  /* THE PAGE OWNS ITS HEIGHT (Young asked 14 Sep 2026: "a scrolling feature
     for the contract being created on the left just like in the editor page …
     the right hand side … should stay intact and not move"). The grid is
     exactly --view-h tall — the shell's own measured room, the way the
     register, the calendar and the contract room size themselves — so the PAGE
     never scrolls: the strip stays put, the paper scrolls inside its own column
     (.tb-scroll) and the rail fills the row and cannot move. The rail used to
     be position:sticky inside a slot exactly its own height — a sticky element
     with nowhere to go, which is why it travelled with the page. */
  .tb-page{display:grid;grid-template-columns:minmax(0,1fr) 380px;grid-template-rows:minmax(0,1fr);gap:16px;align-items:stretch;position:relative;height:var(--view-h);box-sizing:border-box;min-height:0}
  .tb-page.no-rail{grid-template-columns:minmax(0,1fr)}
  .tb-page.no-rail > #tb-railslot{display:none}
  /* THE DIVIDER (14 Sep 2026) — the clause editor's handle, value for value,
     in this page's own sheet (the negotiation sheet that declares .rl-resizer
     is not on every page this one is). It straddles the gap track. */
  .tb-resizer{position:absolute;top:0;bottom:0;width:14px;z-index:6;transform:translateX(-50%);
    cursor:col-resize;display:flex;align-items:center;justify-content:center;touch-action:none}
  .tb-resizer span{width:4px;height:72px;border-radius:var(--radius);background:var(--color-neutral-300);transition:background var(--dur-1)}
  .tb-resizer[data-rl-at-limit] span{background:var(--st-amber-dot)}
  .tb-resizer:hover span,.tb-resizer[data-drag] span{background:var(--color-accent)}
  .tb-page.no-rail > .tb-resizer{display:none}
  .tb-left{min-width:0;min-height:0;display:flex;flex-direction:column}
  .tb-left > .tb-strip{flex:none}
  /* THE PAPER'S OWN SCROLLER. No padding above the paper, so the first line of
     the wording sits exactly where the flowing page put it (refusal 3 — the
     contract's pixels); the shell's thin scrollbar (.scroll-thin on the
     element); a wheel at the end goes nowhere else. */
  .tb-scroll{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 2px 28px}
  .tb-strip{display:flex;align-items:center;gap:10px;flex-wrap:nowrap;margin-bottom:14px;min-width:0}
  /* ════ THE HEAD: the name, the draft chip, the category and the stream (24 Sep 2026) ════
     ONE LINE, and it is the WORDS that give: the two acts and the back square
     never shrink and never wrap inside themselves (the spine's measured fault
     above tbRailHtml), while the name and each chip's value elide — the whole
     of each is on its hover. The chips are pills, which is not a corner. */
  .tb-strip .tb-back{flex:none;width:30px;padding:0}
  .tb-strip .tb-act{flex:none;white-space:nowrap}
  .tb-head{display:flex;align-items:center;gap:8px;min-width:0;flex:0 1 auto}
  .tb-tname{display:inline-flex;align-items:center;gap:6px;min-width:0;flex:0 1 auto;background:none;border:0;border-bottom:1px dashed var(--color-neutral-300);border-radius:0;padding:0 0 1px;cursor:pointer;
    font:inherit;font-size:14px;font-weight:var(--w-title);color:var(--color-text)}
  .tb-tname .v{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
  .tb-tname-i{width:12px;height:12px;flex:none;color:var(--color-neutral-500)}
  .tb-tname:hover{border-bottom-color:var(--accent-ink)}
  .tb-chipv{flex:none;white-space:nowrap;font-family:var(--font-mono);font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--st-steel-fg);border:1px solid var(--st-steel-line);background:var(--st-steel-bg);border-radius:var(--radius);padding:1px 7px}
  .tb-fchip{display:inline-flex;align-items:center;gap:6px;height:var(--ctl-h);padding:0 var(--pad-ctl-x);min-width:0;flex:0 1 auto;white-space:nowrap;cursor:pointer;
    border:1px solid var(--btn-edge,var(--color-divider));border-radius:999px;background:var(--color-surface);font:inherit;font-size:var(--t-body);color:var(--color-text)}
  .tb-fchip .k{flex:none;color:var(--color-neutral-600)}
  .tb-fchip .v{min-width:0;overflow:hidden;text-overflow:ellipsis}
  .tb-fchip .sw{width:8px;height:8px;border-radius:2px;flex:none}
  .tb-fchip-c{width:10px;height:10px;flex:none;color:var(--color-neutral-500)}
  .tb-fchip:hover{border-color:var(--accent-ink)}
  .tb-fchip.empty{border-style:dashed;border-color:var(--st-amber-dot);background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .tb-fchip.empty .k,.tb-fchip.empty .tb-fchip-c{color:var(--st-amber-fg)}
  .tb-tname:focus-visible,.tb-fchip:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}
  /* WHO GIVES FIRST. Measured at 1440 with a long stream: shrinking in
     proportion cut "Other" to "Ot…" while forty characters of name stood
     whole. The name gives first (its whole is on the hover and on the Template
     details box), the stream next, the category last — a category is one or two
     words and a cut one names nothing. */
  .tb-head .tb-tname{flex-shrink:4;min-width:6em}
  .tb-head .tb-fchip[data-tb-meta="stream"]{flex-shrink:2}
  .tb-head .tb-fchip[data-tb-meta="category"]{flex-shrink:.3}
  /* THE STRIP'S LADDER, asked of the strip's own width (the divider moves it
     as much as the window does). Measured at 1366 with a restored draft, the
     name was 83px while "Category" and "Stream" stood whole beside it; so the
     two chip keys go first (the whole of each chip is on its hover), then the
     draft chip (Publish says the version twelve pixels away), then Save
     draft's word (its tick stays, the word is on its hover — the review
     buttons' own -tight rung). The name keeps
     six letters' width at every rung — it is the one thing on the strip the
     reader came here to name. Discard never gives: squeezed, its word wrapped
     and the strip grew to 35px (refusal 3). */
  .tb-strip{container-type:inline-size}
  .tb-strip #tb-drop{flex:none;white-space:nowrap}
  @container (max-width:900px){ .tb-fchip .k{display:none} }
  @container (max-width:640px){ .tb-head .tb-chipv{display:none} }
  @container (max-width:620px){ .tb-strip #tb-save .w{display:none} }
  /* THE QUESTION PUBLISH ASKS — drawn in the modal root, dressed here because
     this sheet is on the page for as long as the builder is. */
  .tb-pq{border:1px solid var(--color-divider);border-radius:var(--radius)}
  .tb-pq-o{display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--color-divider);font-size:var(--t-body);line-height:1.45}
  .tb-pq-o:last-child{border-bottom:0}
  .tb-pq-t{flex:1;min-width:0}
  .tb-pq-dot{width:8px;height:8px;border-radius:50%;flex:none}
  .tb-pq-dot.amb{background:var(--st-amber-dot)}
  .tb-pq-dot.gry{background:var(--color-neutral-400)}
  .tb-pq-o .ui-btn{flex:none;font-size:var(--t-meta);padding:0 var(--pad-ctl-x-sm);min-height:var(--ctl-h-sm)}
  /* ════ THE THREE STEPS, IN THE STRIP THAT ALREADY EXISTS (18 Sep 2026) ═════
     The builder never said what the job WAS: you arrived on a document with a
     Copilot beside it and had to work out for yourself that marking the blanks
     and publishing were still to come. The spine says it in three words and is
     a real door — each step presses something that already worked.

     IT COSTS THE PAPER NOTHING. It sits INSIDE the strip's existing row, and
     it is the first thing dropped when the row runs out of width, so it can
     never wrap and push the wording down — refusal 3, and the reason the
     breakpoint is here rather than a nudge on the paper. */
  .tb-paper{background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:0;
    max-width:var(--doc-sheet-max,780px);margin:0 auto;padding:34px 48px 36px 62px;font-size:14px;line-height:1.7;color:var(--color-text)}
  @media (max-width:700px){ .tb-paper{padding:22px 18px 24px 46px} }
  .tb-title{font-family:var(--font-heading);font-size:16px;font-weight:var(--w-strong);text-align:center;margin:0 0 20px;letter-spacing:.01em}
  .tb-brand{font-size:var(--t-micro);letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-600);border-bottom:1px solid var(--color-divider);padding-bottom:8px;margin-bottom:18px}
  .tb-row{position:relative}
  .tb-g{position:absolute;left:-48px;top:1px;display:flex;flex-direction:column;gap:3px;opacity:0;transition:opacity var(--dur-1)}
  .tb-row:hover>.tb-g,.tb-row:focus-within>.tb-g,.tb-sec.is-on>.tb-row-h>.tb-g{opacity:1}
  .tb-g button{width:var(--ctl-h-sm);height:var(--ctl-h-sm);display:grid;place-items:center;border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:var(--radius);font:inherit;font-size:var(--t-meta);color:var(--color-neutral-600);padding:0;cursor:pointer;line-height:1}
  .tb-g button svg{width:var(--btn-ic);height:var(--btn-ic)}
  .tb-g button:hover{border-color:var(--accent-solid);color:var(--color-text)}
  .tb-g button[data-tb-tag]{color:#5B21B6;border-color:#DDD6FE;background:#F5F3FF;font-size:var(--t-meta)}
  .tb-g button[disabled]{opacity:.35;cursor:default}
  .tb-sec{position:relative;padding:6px 10px 6px 12px;margin:0 -10px 2px -12px;border-radius:0}
  .tb-sec.is-on{outline:1px dashed color-mix(in srgb,var(--color-text) 34%,transparent);outline-offset:1px}
  .tb-dot{position:absolute;left:-14px;top:14px;width:7px;height:7px;border-radius:50%;background:var(--color-divider)}
  .tb-sec.is-written>.tb-row-h>.tb-dot{background:var(--accent-solid)}
  .tb-sec.is-dev>.tb-row-h>.tb-dot{background:var(--st-ruby-fg)}
  .tb-sec.is-esc>.tb-row-h>.tb-dot{background:var(--st-amber-fg)}
  .tb-h{display:flex;gap:6px;align-items:baseline;font-size:14px;font-weight:var(--w-strong);margin:0 0 2px;font-family:inherit;line-height:1.5}
  .tb-n{flex:none}
  .tb-ed{outline:none;min-height:1.4em;white-space:pre-wrap;overflow-wrap:anywhere;min-width:2ch}
  .tb-ed:empty::before{content:attr(data-ph);color:var(--color-neutral-500);font-style:italic;font-weight:var(--w-body)}
  .tb-p{margin:0 0 6px;padding:2px 0}
  .tb-ph{color:var(--color-neutral-500);font-style:italic;cursor:text}
  /* A COPIED DOCUMENT'S OWN MARKUP (24 Sep 2026). Its paragraphs, steps,
     contents rows and tables are dressed by the document's own sheet
     (.hati-doc, index.html) so the paper reads as it will print; these lines
     only settle it into this paper — the paper's face and size, and whitespace
     read as HTML reads it (a tab in "3.4<tab>Scope" is a gap, as on the
     contract). The title rule is the sheet's for ONE document; here every
     block is its own wrapper, so a heading kept in a body is not a title. */
  .tb-paper .tb-rich.hati-doc{font-size:14px;line-height:1.7;font-family:inherit;white-space:normal}
  .tb-paper .tb-rich.hati-doc > h1:first-child{text-align:inherit;font-size:1.15em}
  .tb-rh .tb-ed{white-space:normal}
  .tb-rh.lv-1,.tb-rh.lv-2{font-size:16px}
  .tb-rh.lv-3{font-size:15px}
  .tb-rh.lv-4{font-size:14px}
  .tb-bl{display:inline-flex;align-items:center;padding:0 6px;background:var(--st-steel-bg);border:1px solid var(--st-steel-line);color:var(--st-steel-fg);
    border-radius:var(--radius);font-size:12px;font-weight:var(--w-title);line-height:1.55;white-space:nowrap;vertical-align:baseline;cursor:pointer;font-style:normal}
  .tb-bl.is-new{background:var(--st-amber-bg);border-color:var(--st-amber-line);color:var(--st-amber-fg)}
  .tb-sigs{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:26px;margin-top:22px;padding-top:14px;border-top:1px solid var(--color-divider)}
  .tb-sig .tb-sigwho{font-weight:var(--w-strong);font-size:13px}
  .tb-sig .tb-sigline{display:block;border-bottom:1px solid var(--color-neutral-500);height:26px;margin:14px 0 4px}
  .tb-sig small{color:var(--color-neutral-600);font-size:11px}
  .tb-add{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:26px;padding-top:12px;border-top:1px dashed var(--color-divider)}
  #tb-railslot{min-width:0;min-height:0;display:flex;flex-direction:column}
  /* THE RAIL IS THE ROW'S HEIGHT, never the window's: it fills its slot and
     its lane scrolls inside it (.tb-lane), exactly as the clause editor's. */
  .tb-rail{flex:1;min-height:0;display:flex;flex-direction:column;min-width:0;
    background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius);
    font-size:var(--t-meta);color:var(--color-text)}
  .tb-ah{flex:none;display:flex;align-items:center;gap:18px;padding:0 14px;border-bottom:1px solid var(--color-divider)}
  .tb-ah .sp{display:inline-flex;align-items:center;gap:7px;font-size:var(--t-meta);font-weight:var(--w-title);color:var(--accent-ink);padding:var(--s-3) 0;white-space:nowrap}
  .tb-tabs{display:flex;gap:16px;margin-left:auto;min-width:0}
  .tb-tabs button{background:none;border:0;padding:var(--s-3) 1px;font:inherit;font-size:var(--t-meta);color:var(--color-text);border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap}
  .tb-tabs button.is-on{font-weight:var(--w-title);color:var(--accent-ink);border-bottom-color:var(--accent-solid)}
  .tb-tabs .n{font-size:var(--t-micro);font-weight:var(--w-title);margin-left:5px;padding:1px 5px;background:var(--st-steel-bg);color:var(--st-steel-fg)}
  .tb-tabs .n.r{background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
  .tb-disc{flex:none;display:flex;align-items:center;gap:var(--s-2);padding:var(--s-2) 14px;border-bottom:1px solid var(--color-divider);font-size:var(--t-label);color:var(--color-neutral-600)}
  .tb-disc b{color:var(--accent-ink);font-weight:var(--w-title);flex:none}
  .tb-lane{flex:1;min-height:0;overflow:auto;padding:14px}
  .tb-you{display:flex;justify-content:flex-end;margin:0 0 var(--s-3)}
  .tb-you span{max-width:88%;background:var(--color-neutral-100);padding:8px 11px;font-size:var(--t-meta);line-height:1.5;white-space:pre-wrap}
  .tb-ai{margin:0 0 var(--s-4);padding-left:11px;border-left:2px solid var(--st-steel-line)}
  .tb-ai.amber{border-left-color:var(--st-amber-line)} .tb-ai.ruby{border-left-color:var(--st-ruby-line)}
  .tb-ai .t{font-size:var(--t-meta);line-height:1.55;color:var(--color-text);margin:0}
  .tb-card{background:var(--color-neutral-100);color:var(--color-text);border:1px solid var(--color-divider);padding:10px 11px;margin-top:8px}
  .tb-card .n{display:flex;align-items:center;gap:var(--s-2);font-size:var(--t-body);font-weight:var(--w-title)}
  .tb-card .n .g{flex:1;min-width:4px}
  .tb-card .chip{flex:none;font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.06em;text-transform:uppercase;padding:2px 6px}
  .tb-card .chip.lib{background:var(--st-steel-bg);color:var(--st-steel-fg)} .tb-card .chip.ai{background:#EDE9FE;color:#5B21B6} .tb-card .chip.dev{background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
  .tb-card .r{display:block;margin-top:6px;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.45}
  .tb-card .pv{display:block;margin-top:var(--s-2);padding:var(--s-2) 10px;background:var(--color-surface);border:1px solid var(--color-divider);font-size:var(--t-meta);line-height:1.65;max-height:220px;overflow:auto;white-space:pre-wrap}
  .tb-card .pv ins{color:var(--st-green-fg);text-decoration:none;font-weight:var(--w-strong)} .tb-card .pv del{color:var(--st-ruby-fg);text-decoration:line-through}
  .tb-card .av{display:flex;gap:var(--s-2);margin-top:9px;flex-wrap:wrap;align-items:center}
  .tb-card .av button{height:var(--ctl-h-sm);padding:0 var(--pad-ctl-x-sm);font:inherit;font-size:var(--t-meta);font-weight:var(--w-label);background:var(--color-surface);color:var(--accent-ink);border:1px solid var(--color-divider);cursor:pointer}
  .tb-card .av button.p{background:var(--color-accent-700);border-color:var(--accent-ink-700);color:#fff}
  .tb-card .av button:hover{border-color:var(--accent-solid)} .tb-card .av button[disabled]{opacity:.45;cursor:default}
  .tb-card .av .cost{margin-left:auto;font-size:var(--t-micro);color:var(--color-neutral-500)}
  .tb-card.rcpt{background:var(--color-surface)} .tb-card.rcpt .n{font-size:var(--t-meta);color:var(--st-green-fg)}
  .tb-list{margin:6px 0 0;padding:0;list-style:none} .tb-list li{padding:6px 0;border-top:1px solid var(--color-divider);font-size:var(--t-meta)} .tb-list li:first-child{border-top:0}
  .tb-list label{display:flex;gap:8px;align-items:flex-start;cursor:pointer} .tb-list label>span{min-width:0;flex:1}
  .tb-list .fr{font-size:var(--t-micro);color:var(--st-steel-fg);background:var(--st-steel-bg);padding:0 5px;margin-left:6px;white-space:nowrap}
  .tb-list .it{display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.45}
  /* Where a proposed section's words will come from (24 Sep 2026): the three
     sources in the three tones the builder already uses for them — the
     library steel, the playbook green, Copilot's own violet. */
  .tb-list .src{font-size:var(--t-micro);font-weight:var(--w-strong);padding:0 5px;margin-left:6px;white-space:nowrap}
  .tb-list .src.lib{background:var(--st-steel-bg);color:var(--st-steel-fg)}
  .tb-list .src.std{background:var(--st-green-bg);color:var(--st-green-fg)}
  .tb-list .src.ai{background:#EDE9FE;color:#5B21B6}
  .tb-list .opt{font-weight:var(--w-body);color:var(--color-neutral-500)}
  .tb-cands .w,.tb-first .w{font-family:var(--font-doc,inherit);color:var(--color-text);overflow-wrap:anywhere}
  .tb-more{border:0;background:none;padding:6px 0 0;font:inherit;font-size:var(--t-label);color:var(--accent-ink);cursor:pointer}
  .tb-first .n{font-size:var(--t-meta)}
  .tb-rows{margin:0;padding:0;list-style:none} .tb-rows li{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--color-divider);font-size:var(--t-meta);flex-wrap:wrap}
  .tb-rows li:first-child{border-top:0} .tb-rows .g{flex:1;min-width:0} .tb-rows .st{font-size:var(--t-label);white-space:nowrap;color:var(--color-neutral-600)}
  .tb-rows .st.ok{color:var(--st-green-fg)} .tb-rows .st.dev{color:var(--st-ruby-fg)} .tb-rows .st.open{color:var(--st-amber-fg)}
  .tb-rows button{display:inline-flex;align-items:center;gap:4px;font:inherit;font-size:var(--t-meta);font-weight:var(--w-label);color:var(--accent-ink);border:1px solid var(--color-divider);background:var(--color-surface);min-height:var(--ctl-h-sm);padding:0 var(--pad-ctl-x-sm);white-space:nowrap;cursor:pointer}
  .tb-rows button.x{color:var(--st-ruby-fg);border-color:var(--st-ruby-line)}
  .tb-rows i.d{width:7px;height:7px;border-radius:50%;background:var(--color-divider);flex:none;display:block} .tb-rows i.d.ok{background:var(--accent-solid)} .tb-rows i.d.dev{background:var(--st-ruby-fg)}
  .tb-rows .sub{display:block;width:100%;font-size:var(--t-label);color:var(--color-neutral-600);font-family:var(--font-mono);line-height:1.4}
  .tb-scope{flex:none;margin:0 13px 9px;padding:8px 10px;background:var(--color-neutral-100);border:1px solid var(--color-divider)}
  .tb-scope .eb{display:flex;align-items:center;gap:6px;font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--accent-ink)}
  .tb-scope .eb b{font-weight:var(--w-title);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tb-scope .eb .g{flex:1;min-width:4px}
  .tb-scope .x{flex:none;width:var(--ctl-h-sm);height:var(--ctl-h-sm);display:inline-grid;place-items:center;padding:0;font:inherit;font-size:var(--t-label);background:none;border:0;color:var(--color-neutral-600);cursor:pointer;letter-spacing:0}
  .tb-scope .x:hover{color:var(--color-text)}
  .tb-scope q{display:block;margin-top:5px;padding-left:8px;quotes:none;border-left:2px solid var(--accent-solid);font-size:var(--t-label);line-height:1.55;color:var(--color-text)}
  .tb-scope q.e{color:var(--color-neutral-500);font-style:italic}
  .tb-scope .ctx{display:inline-flex;align-items:center;gap:5px;margin:7px 6px 0 0;font-size:var(--t-micro);color:var(--color-neutral-600);background:var(--color-surface);border:1px solid var(--color-divider);padding:1px 7px}
  .tb-scope .ctx button{border:0;background:none;font:inherit;cursor:pointer;color:inherit;padding:0}
  .tb-chips{flex:none;display:flex;gap:7px;flex-wrap:nowrap;overflow-x:auto;padding:0 14px 9px;scrollbar-width:thin;
    -webkit-mask-image:linear-gradient(to right,#000 calc(100% - 34px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 34px),transparent)}
  .tb-chips:empty{padding:0}
  .tb-chips button{flex:none;height:var(--ctl-h-sm);padding:0 var(--pad-ctl-x-sm);font:inherit;font-size:var(--t-meta);font-weight:var(--w-label);white-space:nowrap;background:var(--color-surface);color:var(--color-neutral-600);border:1px solid var(--color-divider);cursor:pointer}
  .tb-chips button:hover{color:var(--color-text);border-color:var(--accent-solid)} .tb-chips button.next{border-color:var(--accent-solid);color:var(--accent-ink)}
  .tb-ask{flex:none;display:flex;gap:var(--s-2);padding:10px 14px;border-top:1px solid var(--color-divider);align-items:flex-end;position:relative}
  .tb-ask textarea{flex:1;min-width:0;height:74px;min-height:74px;max-height:200px;padding:9px 11px;font:inherit;font-size:var(--t-meta);line-height:1.5;resize:none;
    white-space:pre-wrap;overflow-wrap:break-word;background:var(--color-surface);border:1px solid var(--color-divider);color:var(--color-text);outline:none}
  .tb-ask textarea:focus{box-shadow:var(--focus)} .tb-ask textarea[disabled]{background:var(--color-neutral-100)}
  .tb-ask button{flex:none;display:inline-grid;place-items:center;width:var(--ctl-h);height:var(--ctl-h);padding:0;background:var(--color-accent-700);border:1px solid var(--color-accent-700);color:#fff;cursor:pointer}
  .tb-ask button svg{width:var(--btn-ic);height:var(--btn-ic)}
  .tb-ask button:hover{background:var(--accent-ink);border-color:var(--accent-ink)} .tb-ask button[disabled]{opacity:.45;cursor:default}
  .tb-pick{position:absolute;left:14px;bottom:92px;width:min(280px,calc(100% - 28px));background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);padding:4px 0;z-index:5;max-height:220px;overflow:auto}
  .tb-pick button{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:5px 10px;border:0;background:none;font:inherit;font-size:var(--t-label);cursor:pointer;color:var(--color-text)}
  .tb-pick button:hover{background:var(--color-neutral-100)} .tb-pick small{margin-left:auto;color:var(--color-neutral-500)}
  .tb-pick i.d{width:7px;height:7px;border-radius:50%;background:var(--color-divider);flex:none;display:block} .tb-pick i.d.ok{background:var(--accent-solid)}
  .tb-railfoot{flex:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 14px;border-top:1px solid var(--color-divider);font-size:var(--t-label);color:var(--color-neutral-600)}
  .tb-railfoot b{color:var(--color-text);font-variant-numeric:tabular-nums} .tb-railfoot .sp{flex:1}
  .tb-walk{background:none;border:0;font:inherit;font-size:var(--t-micro);color:var(--color-neutral-500);cursor:pointer;padding:0} .tb-walk.is-on{color:var(--accent-ink)}
  .tb-quiet{font-size:var(--t-label);color:var(--color-neutral-600);margin:0 0 10px;line-height:1.5}
  </style>`;
}

/* ---- A BLANK IS A CHIP ---- "Effective date" rather than {{effective_date}};
   the key on the hover. A marker with no field behind it is drawn amber so
   the person sees it wants declaring; reading the block back turns every chip
   into its marker again, so the record never learns the chips exist. */
function tbChipHtml(key) {
  const f = _tb.fields.find(x => x.fieldKey === key);
  const label = f ? (f.label || key) : key;
  return `<span class="tb-bl${f ? '' : ' is-new'}" contenteditable="false" data-tb-blank="${esc(key)}" title="${f ? esc('{{' + key + '}} · ' + i18t('tb_bl_edit')) : esc(i18t('tb_bl_new'))}">${esc(label)}</span>`;
}
function tbChipsHtml(text) {
  return esc(String(text || '')).replace(/\{\{([a-z0-9_]+)\}\}/gi, (m, key) => tbChipHtml(key));
}
/* ---- A COPIED DOCUMENT IS DRAWN AS THE DOCUMENT (24 Sep 2026) ----
   A rich block's markup goes through the product's own sanitiser on the way
   onto the screen — storage is never trusted at render time — and its blanks
   become the same chips, in the TEXT between tags only. Reading it back is
   the reverse: every chip becomes its marker again and the whole block goes
   through the sanitiser, so what is stored is always the allowlist's shape
   and never the builder's own furniture (a chip, a contenteditable). */
function tbRichChipsHtml(html) {
  const safe = typeof sanitizeRich === 'function' ? sanitizeRich(String(html || '')) : String(html || '');
  return safe.split(/(<[^>]*>)/).map(seg => (!seg || seg[0] === '<') ? seg
    : seg.replace(/\{\{([a-z0-9_]+)\}\}/gi, (m, key) => tbChipHtml(key))).join('');
}
const tbRichTag = html => { const m = /^\s*<(h[1-4])\b/i.exec(String(html || '')); return m ? m[1].toLowerCase() : 'h2'; };
const tbRichInner = html => String(html || '').replace(/^\s*<h[1-4]\b[^>]*>/i, '').replace(/<\/h[1-4]>\s*$/i, '');
function tbReadRich(el, tag) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('[data-tb-blank]').forEach(x => x.replaceWith(document.createTextNode('{{' + x.getAttribute('data-tb-blank') + '}}')));
  let html = clone.innerHTML;
  if (tag) html = `<${tag}>${html}</${tag}>`;
  if (typeof sanitizeRich === 'function') html = sanitizeRich(html);
  /* A template is not a contract: it carries no clause identity (the server's
     allowlist drops it too, so the kept draft and the save agree). */
  return String(html).replace(/\sdata-clause-id="[^"]*"/g, '');
}
function tbReadEditable(el) {
  let out = '';
  const walk = node => {
    (node.childNodes || []).forEach(ch => {
      if (ch.nodeType === 3) { out += ch.nodeValue; return; }
      if (ch.nodeType !== 1) return;
      const key = ch.getAttribute && ch.getAttribute('data-tb-blank');
      if (key) { out += '{{' + key + '}}'; return; }
      if (ch.tagName === 'BR') { out += '\n'; return; }
      if (/^(DIV|P)$/.test(ch.tagName) && out && !out.endsWith('\n')) out += '\n';
      walk(ch);
    });
  };
  walk(el);
  return out.replace(/ /g, ' ');
}
/* Marked against what stands, through the product's own engine where it is on
   the stage; a section written for the first time is one insertion. */
function tbMarkedHtml(before, after) {
  const b = String(before || '').trim(), a = String(after || '').trim();
  if (!b) return `<ins>${tbChipsHtml(a)}</ins>`;
  try {
    if (typeof window.redlineOps === 'function' && typeof window.redlineOpsBlocksHtml === 'function') return redlineOpsBlocksHtml(redlineOps(b, a));
  } catch (_) { /* fall through to the plain wording */ }
  return tbChipsHtml(a);
}
/* Would this wording deviate from the playbook? Asked of the coverage reading
   over a copy of the blocks with the card's text in the section's place — the
   same arithmetic the Playbook tab prints, never a second judgement. */
function tbCardDeviates(sec, text) {
  const bs = _tb.blocks.map(b => ({ ...b }));
  const bi = sec.body.length ? sec.body[0] : -1;
  if (bi < 0) bs.splice(sec.headIndex + 1, 0, { blockType: 'field_group', content: text, _k: -1 });
  else { bs[bi].content = text; delete bs[bi].format; }
  const c = tbCoverage(bs); if (!c) return false;
  const k = bi < 0 ? -1 : bs[bi]._k;
  return c.rows.some(r => r.state === 'dev' && r.where && (r.where.k === sec.k || (k === -1 && r.where.head === sec.head)));
}
const tbSecState = (sec, cov) => {
  const row = cov && cov.rows.find(r => r.where && r.where.k === sec.k);
  if (row && row.state === 'dev') return 'dev';
  if (tbSectionText(sec)) return 'written';
  const t = tbKindOf(sec.head);
  const pos = t && cov && cov.rows.find(r => r.category === t.category && r.escalate);
  return pos ? 'esc' : '';
};

/* ---- THE PAPER ----
   The blocks drawn in order as the document they will become. A heading opens
   a section that holds the wording blocks after it (tbSections' own reading);
   every block keeps its own gutter — move, remove, and on a heading the ✦
   that tags the section. Nothing here changes what a block IS. */
function tbPaperHtml() {
  const t = _tb.template; const cov = tbCoverage();
  const secs = tbSections(); const bySec = new Map(secs.map(s => [s.headIndex, s]));
  const fits = tbRailFits();
  const G = (i, extra) => `<span class="tb-g">${extra || ''}
      <button type="button" data-tb-up="${i}" ${i === 0 ? 'disabled' : ''} title="${i18t('tb_move_up')}" aria-label="${i18t('tb_move_up')}">${icon('chevU')}</button>
      <button type="button" data-tb-down="${i}" ${i === _tb.blocks.length - 1 ? 'disabled' : ''} title="${i18t('tb_move_down')}" aria-label="${i18t('tb_move_down')}">${icon('chevD')}</button>
      <button type="button" data-tb-del="${i}" title="${i18t('tb_remove_block')}" aria-label="${i18t('tb_remove_block')}">${icon('x')}</button></span>`;
  let html = ''; let open = false; let n = 0; let sigs = false;
  /* A COPIED DOCUMENT CARRIES ITS OWN TITLE AND ITS OWN NUMBERS. Where any
     block is the document's markup the paper draws no name above it and adds
     no number to any heading — templateFormDocHtml's own two readings, asked
     here so the paper and the published contract cannot disagree. */
  const richDoc = _tb.blocks.some(tbRich);
  const ownNos = richDoc && typeof tplFormNumbersOff === 'function' ? tplFormNumbersOff(_tb.blocks) : false;
  let titled = richDoc;
  const closeSigs = () => { if (sigs) { html += '</div>'; sigs = false; } };
  const title = () => { if (!titled) { html += `<h2 class="tb-title">${esc(t.name)}</h2>`; titled = true; } };
  _tb.blocks.forEach((b, i) => {
    if (b.blockType !== 'signature_block') closeSigs();
    if (b.blockType === 'branding') {
      html += `<div class="tb-row" data-tb-row="${i}">${G(i)}<div class="tb-brand">${i18t('tb_logo_renders')}</div></div>`;
      return;
    }
    title();
    if (b.blockType === 'heading') {
      if (open) html += '</div>';
      /* THE NUMBER THIS HEADING WILL PRINT AS, not its position in the list
         (18 Sep 2026, the third repair). templateFormDocHtml promotes the
         FIRST heading to the document's title, and a title carries no clause
         number; the rest number from 1, and one already carrying its own
         keeps it. Both readings are that renderer's, asked through window so
         the paper and the published contract cannot drift. */
      n++; const own = ownNos || ((typeof tplFormHeadingNumbered === 'function') && tplFormHeadingNumbered(b.content));
      const clauseNo = (n === 1 || own || tbRich(b)) ? '' : String(n - 1) + '.';
      const sec = bySec.get(i); const st = sec ? tbSecState(sec, cov) : '';
      /* A copied heading keeps the level the file gave it; its words are
         edited in place and written back into the same element. */
      const lv = tbRich(b) ? tbRichTag(b.content) : '';
      const head = lv
        ? `<${lv} class="tb-h tb-rh lv-${lv.slice(1)}"><span class="tb-ed tb-hed" contenteditable="true" spellcheck="false" data-tb-content="${i}" data-tb-kind="rheading" data-tb-lv="${lv}" data-ph="${i18t('tb_ph_heading')}">${tbRichChipsHtml(tbRichInner(b.content))}</span></${lv}>`
        : `<h3 class="tb-h">${clauseNo ? `<span class="tb-n">${clauseNo}</span>` : ''}<span class="tb-ed tb-hed" contenteditable="true" spellcheck="false" data-tb-content="${i}" data-tb-kind="heading" data-ph="${i18t('tb_ph_heading')}">${esc(b.content)}</span></h3>`;
      html += `<div class="tb-sec${sec && sec.k === _tb.focus ? ' is-on' : ''}${st ? ' is-' + st : ''}${sec && !tbSectionText(sec) ? ' is-empty' : ''}" data-tb-sec="${b._k}">
        <div class="tb-row tb-row-h" data-tb-row="${i}"><span class="tb-dot"></span>${G(i, fits ? `<button type="button" data-tb-tag="${b._k}" title="${i18t('tb_ask_label')}">✦</button>` : '')}
          ${head}</div>
        ${sec && !sec.body.length && tbSectionOwes(sec) ? `<p class="tb-p tb-ph" data-tb-ph="${b._k}">${i18t('tb_ph_empty')}</p>` : ''}`;
      open = true; return;
    }
    if (b.blockType === 'fixed_text' || b.blockType === 'field_group') {
      /* The document's own paragraphs, lists and tables, dressed by the
         document's own sheet (.hati-doc) so the paper reads as it will print. */
      if (tbRich(b)) {
        html += `<div class="tb-row" data-tb-row="${i}">${G(i)}<div class="tb-p tb-ed tb-rich hati-doc" contenteditable="true" data-tb-content="${i}" data-tb-kind="rich" data-ph="${i18t('tb_ph_wording')}">${tbRichChipsHtml(b.content)}</div></div>`;
        return;
      }
      html += `<div class="tb-row" data-tb-row="${i}">${G(i)}<div class="tb-p tb-ed" contenteditable="true" data-tb-content="${i}" data-tb-kind="text" data-ph="${i18t('tb_ph_wording')}">${tbChipsHtml(b.content)}</div></div>`;
      return;
    }
    if (b.blockType === 'signature_block') {
      if (open) { html += '</div>'; open = false; }
      if (!sigs) { html += '<div class="tb-sigs">'; sigs = true; }
      html += `<div class="tb-row tb-sig" data-tb-row="${i}">${G(i)}<span class="tb-ed tb-sigwho" contenteditable="true" data-tb-content="${i}" data-tb-kind="sig" data-ph="${i18t('tb_who_signs')}">${esc(b.content)}</span><span class="tb-sigline"></span><small>${i18t('tb_sig_meta')}</small></div>`;
    }
  });
  closeSigs();
  if (open) html += '</div>';
  title();
  html += `<div class="tb-add">
      <select id="tb-addtype" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
        ${Object.entries(TB_BLOCK_META).map(([k, m]) => `<option value="${k}" title="${esc(m.tip)}">${m.label}</option>`).join('')}
      </select>
      <button type="button" id="tb-addblock" class="ui-btn ui-btn-sm">${icon('plus', 'w-3 h-3')} ${i18t('tb_add_block')}</button>
    </div>`;
  return `<article class="tb-paper" id="tb-paper">${html}</article>`;
}

/* ---- THE RAIL ---- */
const tbYouHtml = text => `<div class="tb-you"><span>${esc(text)}</span></div>`;
const tbAiHtml = (html, tone) => `<div class="tb-ai${tone ? ' ' + tone : ''}"><p class="t">${html}</p></div>`;
const tbReceiptHtml = text => `<div class="tb-card rcpt"><div class="n">✓ ${esc(text)}</div></div>`;
function tbTurnHtml(t, i, sec) {
  if (t.who === 'you') return tbYouHtml(t.text);
  if (t.receipt) return tbReceiptHtml(t.receipt) + tbProposedRowHtml(sec.k);
  if (t.answered) return tbAiHtml(`<b>${i18t('tb_pb_no_wording')}</b> ${esc(t.answered)}`);
  if (!t.card) return tbAiHtml(esc(t.text || ''), t.tone);
  const a = t.card;
  const draftNo = tbThread(sec.k).slice(0, i + 1).filter(x => x.card).length;
  const dev = !a.applied && tbCardDeviates(sec, a.text);
  /* A REMARK ABOUT THE JOB IS NOT A DRAFT, so it is printed as what it is and
     offered nothing to press — no Apply, no Refine, no redline against the
     section it is not wording for. See tbCardWording. */
  if (!tbCardWording(a))
    return tbAiHtml(`<b>${i18t('tb_pb_no_wording')}</b> ${esc(a.text)}`);
  return `<div class="tb-ai">${t.text ? `<p class="t">${esc(t.text)}</p>` : ''}
    <div class="tb-card" data-tb-card="${i}">
      <div class="n">${esc(sec.head || i18t('tb_untitled'))} — ${draftNo}<span class="g"></span><span class="chip ${a.tone || 'ai'}">${esc(a.src)}</span>${dev ? `<span class="chip dev">${i18t('tb_ask_first_dev')}</span>` : ''}</div>
      ${a.rests ? `<span class="r">${esc(a.rests)}</span>` : ''}
      <div class="pv">${tbMarkedHtml(a.before, a.text)}</div>
      ${a.applied ? '' : `<div class="av">
        <button type="button" class="p" data-tb-use="${sec.k}:${i}">${i18t('tb_pb_apply')}</button>
        <button type="button" data-tb-refine="${sec.k}:${i}">${i18t('tb_pb_refine')}</button>
        <span class="cost">${a.free ? i18t('tb_pb_no_read_short') : i18t('tb_pb_read_n', { n: a.read || _tb.reads })}</span></div>`}
    </div></div>`;
}
/* Proposed blanks sit under the receipt they came from and on the Blanks tab,
   held outside _tb.fields until kept, so nothing a person has not kept can
   ride a save. */
function tbProposedRowHtml(k) {
  const list = (_tb.proposed || []).map((p, i) => ({ p, i })).filter(x => k == null || x.p.k === k);
  if (!list.length) return '';
  return `<ul class="tb-rows" style="margin:0 0 12px">${list.map(({ p, i }) => `<li>
      <span class="tb-bl">${esc(p.label)}</span><span class="st">{{${esc(p.key)}}} · ${esc((window.FIELD_LIB && FIELD_LIB[p.type] && FIELD_LIB[p.type].label) || p.type)}</span><span class="g"></span>
      <button type="button" data-tb-keep="${i}">${i18t('tb_pb_keep')}</button><button type="button" class="x" data-tb-drop="${i}">${i18t('tb_pb_not_blank')}</button></li>`).join('')}</ul>`;
}
function tbSectionListHtml(secs) {
  const cov = tbCoverage();
  return `<ul class="tb-rows">${secs.map(s => { const st = tbSecState(s, cov);
    return `<li><i class="d ${st === 'written' ? 'ok' : st}"></i><span class="g">${tbSectionNo(s)} · ${esc(s.head || i18t('tb_untitled'))}</span>
      <span class="st ${st === 'dev' ? 'dev' : ''}">${st === 'dev' ? i18t('tb_ask_first_dev') : tbSectionText(s) ? i18t('tb_written') : i18t('tb_empty')}</span>
      <button type="button" data-tb-next="${s.k}">${i18t('tb_open_sec')}</button></li>`; }).join('')}</ul>`;
}
function tbOutlineLaneHtml() {
  const o = _tb.outline;
  if (!o) return tbAiHtml(i18t('tb_pb_first_q'));
  let html = o.said ? tbYouHtml(o.said) : '';
  if (o.busy) return html + tbAiHtml(i18t('tb_pb_thinking'));
  if (o.error) return html + tbAiHtml(esc(o.error), 'amber') + `<div class="tb-card"><div class="av" style="margin-top:0"><button type="button" data-tb-brief-again>${i18t('tb_pb_try_again')}</button></div></div>`;
  /* EVERY SECTION SAYS WHERE ITS WORDS WILL COME FROM (24 Sep 2026): your
     clause library, Our standards, or Copilot's own draft — tbSourceOf, asked
     when the list was made. The sentence above the list COUNTS them; HaTi
     composes it, never the model. */
  const SRC = { lib: 'tb_src_lib', std: 'tb_src_std', ai: 'tb_src_ai' };
  const rows = o.sections.map((x, n) => `<li><label><input type="checkbox" data-tb-out="${n}" ${x.on ? 'checked' : ''} style="margin-top:3px"><span><b>${esc(x.heading)}</b>${x.optional ? `<span class="opt"> · ${i18t('tb_src_optional')}</span>` : ''}${x.src ? `<span class="src ${x.src}">${i18t(SRC[x.src])}</span>` : ''}${x.playbook ? `<span class="fr">${i18t('tb_pb_from_playbook')}</span>` : ''}${x.intent ? `<span class="it">${esc(x.intent)}</span>` : ''}</span></label></li>`).join('');
  const n = o.sections.filter(x => x.on).length;
  const cnt = k => o.sections.filter(x => x.src === k).length;
  const lead = o.sections.some(x => x.src)
    ? i18t('tb_out_lead', { n: o.sections.length, lib: cnt('lib'), std: cnt('std'), ai: cnt('ai') })
    : i18tn('tb_pb_proposed_n', o.sections.length, { n: o.sections.length });
  return html + `<div class="tb-ai"><p class="t">${lead}${o.note ? ' ' + esc(o.note) : ''}</p>
    <div class="tb-card"><ul class="tb-list">${rows}</ul><span class="r">${i18t('tb_pb_headings_only')}</span>
      <div class="av"><button type="button" class="p" data-tb-out-add ${n ? '' : 'disabled'}>${i18tn('tb_pb_add_n', n, { n })}</button>
        <button type="button" data-tb-brief-again>${i18t('tb_pb_start_again')}</button><span class="cost">${i18t('tb_pb_read_n', { n: _tb.reads })}</span></div></div></div>`;
}
function tbBuildLaneHtml() {
  const secs = tbSections();
  const on = typeof copilotAvailable === 'function' && copilotAvailable();
  if (!on) return tbAiHtml(i18t('tb_pb_nokey'), 'amber') + (secs.length ? tbSectionListHtml(secs) : '');
  /* THE OPENING ASK IS FOR AN EMPTY TEMPLATE ONLY (the owner's ruling, 12 Sep
     2026): once the paper carries blocks, the rail is about the section in hand. */
  if (_tb.blocks.length && !_tb.outline) {
    const sec = _tb.focus != null ? tbSectionAt(_tb.focus) : null;
    /* FROM ONE OF OUR CONTRACTS, the first move is the check — drawn whenever
       no section is in hand, so ✕ on a section brings it back. */
    if (!sec && _tb.start && _tb.start.kind === 'contract') return tbContractCardHtml() + (secs.length ? tbSectionListHtml(secs) : '');
    if (!sec) return (_tb.said ? `<p class="tb-quiet">${i18t('tb_pb_building')} <i style="font-style:normal;color:var(--color-text)">“${esc(_tb.said)}”</i></p>` : '')
      + tbAiHtml(i18t('tb_pick_lead')) + (secs.length ? tbSectionListHtml(secs) : '');
    let html = '';
    if (_tb.lastReceipt && _tb.lastReceipt.k === sec.k) html += tbReceiptHtml(_tb.lastReceipt.text);
    const th = tbThread(sec.k);
    /* THREE OPENINGS, NOT TWO. The walk question is for an empty section under
       "walk me through it"; `tb_greet` asks what the section SHOULD say, which
       is the wrong question to put to wording that already exists. A written
       section is told what can be done TO it instead. */
    if (!th.length) html += tbAiHtml(esc(
      _tb.walk && !tbSectionText(sec) ? tbQuestionFor(sec)
      : i18t(tbSectionText(sec) ? 'tb_greet_written' : 'tb_greet', { head: sec.head || i18t('tb_untitled') })));
    th.forEach((t, i) => { html += tbTurnHtml(t, i, sec); });
    if (_tb.busy === sec.k) html += tbAiHtml(i18t('tb_pb_thinking'));
    return html;
  }
  return tbOutlineLaneHtml();
}
function tbPlaybookLaneHtml(cov) {
  if (!cov || !cov.total) return tbAiHtml(i18t('tb_pb_no_book'));
  const secs = tbSections();
  const rows = cov.rows.map(r => {
    const why = r.state === 'dev' ? i18t('tb_pb_dev_note', { n: r.figure, want: r.want, note: r.note || '' }) : (r.note || '');
    let door = '';
    if (r.where) door = `<button type="button" data-tb-show="${r.where.k}">${i18t('tb_show_me')}</button>`;
    else {
      const empty = secs.find(s => { const t = tbKindOf(s.head); return t && t.category === r.category; });
      door = empty ? `<button type="button" data-tb-cover-draft="${empty.k}" data-tb-note="${esc(r.note || '')}">${i18t('tb_draft_this')}</button>`
                   : `<button type="button" data-tb-cover-add="${esc(r.category)}">${plusLed(i18t('tb_pb_add_section'))}</button>`;
    }
    const st = r.state === 'dev' ? `${i18t('tb_pb_reads_fig', { n: r.figure })} · ${r.op} ${r.want}` : r.state === 'hit' ? i18t('tb_met') : i18t('tb_not_yet_written');
    return `<li><i class="d ${r.state === 'hit' ? 'ok' : r.state}"></i><span class="g">${esc(r.category)}${r.escalate ? ` · ${i18t('tb_pb_legal')}` : ''}</span><span class="st ${r.state === 'hit' ? 'ok' : r.state}">${st}</span>${door}
      ${why ? `<span class="sub" style="font-family:inherit">${esc(why)}</span>` : ''}</li>`;
  }).join('');
  return `<div class="tb-card" style="margin-top:0"><div class="n">${i18t('tb_pb_cover_head')}<span class="g"></span><span class="chip ${cov.deviations ? 'dev' : 'lib'}">${i18t('tb_pb_covered', { n: cov.covered, m: cov.total })}</span></div>
    <span class="r">${esc(cov.label)}</span><ul class="tb-rows" style="margin-top:6px">${rows}</ul>
    <span class="r">${i18t('tb_pb_dev_rides')}</span></div>`;
}
/* ---- THE LIKELY BLANKS, as Copilot's first move on a copied document ----
   Every row arrives UNTICKED (decision 3): nothing becomes a blank until a
   person ticks it, and the button's count follows the ticks. Below them, what
   is NOT a blank and why — a note to whoever drafts (take it out, or keep
   it), and words left as they are. */
function tbCandsCardHtml() {
  const C = _tb.cands; if (!C) return '';
  if (C.busy) return tbAiHtml(i18t('tb_c_reading'));
  const st = _tb.start || {}; const f = st.facts || null;
  const bits = [];
  if (st.from === 'hati') bits.push(i18t('tb_c_copied_hati'));
  else if (f) bits.push(i18t(st.same ? 'tb_c_copied_same' : 'tb_c_copied', {
    h: i18tn('ns_f_heads', f.heads, { n: f.heads }), n: i18tn('ns_f_numbers', f.numbers, { n: f.numbers }), t: i18tn('ns_f_tables', f.tables, { n: f.tables }) }));
  if (st.scanned) bits.push(i18t('tb_c_scanned'));
  bits.push(C.rows.length ? i18tn('tb_c_found', C.rows.length, { n: C.rows.length }) : i18t('tb_c_found_none'));
  if (C.nokey) bits.push(i18t('tb_c_nokey'));
  else if (C.dropped) bits.push(i18tn('tb_c_unanswered', C.dropped, { n: C.dropped }));
  let html = `<div class="tb-ai"><p class="t">${esc(bits.join(' '))}</p>${C.error ? `<p class="t" style="color:var(--st-amber-fg);margin-top:6px">${esc(C.error)}</p>` : ''}`;
  if (C.rows.length) {
    const shown = C.all ? C.rows : C.rows.slice(0, TB_CAND_SHOWN);
    html += `<div class="tb-card tb-cands"><ul class="tb-list">${shown.map(r => `<li><label><input type="checkbox" data-tb-cand="${esc(r.id)}" ${r.on ? 'checked' : ''} style="margin-top:3px"><span>
      <span class="w">${esc(r.text)}</span>${(r.variants || []).length ? `<span class="w"> · ${esc(r.variants.join(' · '))}</span>` : ''} → <span class="tb-bl">${esc(r.label)}</span>
      <span class="it">${i18tn('tb_c_places', r.places, { n: r.places })}</span></span></label></li>`).join('')}</ul>
      ${!C.all && C.rows.length > TB_CAND_SHOWN ? `<button type="button" class="tb-more" data-tb-cand-all>${i18tn('tb_c_more', C.rows.length - TB_CAND_SHOWN, { n: C.rows.length - TB_CAND_SHOWN })}</button>` : ''}`;
    const n = C.rows.filter(r => r.on).length;
    html += `<div class="av"><button type="button" class="p" data-tb-cand-make ${n ? '' : 'disabled'}>${n ? i18tn('tb_c_make', n, { n }) : i18t('tb_c_tick')}</button>
      <span class="cost">${i18t('tb_c_follows')}</span></div></div>`;
  }
  if (C.notes.length || C.leave.length) {
    html += `<div class="tb-card tb-cands"><div class="n">${i18t('tb_c_not_blanks')}</div><ul class="tb-rows" style="margin-top:4px">`
      + C.notes.map(x => `<li><span class="g"><span class="w">${esc(x.text)}</span><span class="sub" style="font-family:inherit">${esc(x.why || i18t('tb_c_note_why'))}</span></span>
          <button type="button" class="x" data-tb-note-rm="${esc(x.id)}">${i18t('tb_c_remove')}</button><button type="button" data-tb-note-keep="${esc(x.id)}">${i18t('tb_c_keep')}</button></li>`).join('')
      + C.leave.map(x => `<li><span class="g"><span class="w">${esc(x.text)}</span><span class="sub" style="font-family:inherit">${esc(i18t('tb_c_left', { why: x.why || '' }).replace(/\s+—\s*$/, ''))}</span></span></li>`).join('')
      + `</ul></div>`;
  }
  return html + '</div>';
}
/* ---- FROM ONE OF OUR CONTRACTS: the check ----
   Composed by HaTi from three readings it already had — what the route took
   out, the playbook count this builder has always made (tbCoverage), and the
   clauses the other side changed. No model is asked for any of it. */
function tbContractCardHtml() {
  const st = _tb.start || {}; const D = _tb.decided || { kept: [], left: [], neg: [] };
  const cov = tbCoverage();
  const taken = (_tb.taken || []).filter(t => !t.back);
  const dev = cov ? cov.rows.filter(r => r.state === 'dev') : [];
  const open = tbMissingStandards(cov);
  const hit = cov ? cov.rows.filter(r => r.state === 'hit').length : 0;
  const neg = (_tb.negotiated || []).filter(x => !D.neg.includes(x.clauseId));
  const grp = (label, n) => `<div class="n" style="margin-top:10px">${label}<span class="g"></span><span class="chip lib">${n}</span></div>`;
  let html = `<div class="tb-ai"><p class="t">${esc(i18t('tb_k_lead', { id: st.contractId || '' }))}</p><div class="tb-card tb-first">`;
  html += grp(i18t('tb_k_taken'), taken.length);
  html += taken.length ? `<ul class="tb-rows">${taken.map(t => `<li><span class="g"><span class="w">${esc(t.value)}</span> → <span class="tb-bl">${esc(t.label)}</span>
      <span class="sub" style="font-family:inherit">${i18tn('tb_c_places', t.places, { n: t.places })}</span></span>
      <button type="button" data-tb-putback="${esc(t.key)}">${i18t('tb_k_put_back_btn')}</button></li>`).join('')}</ul>`
    : `<span class="r">${i18t('tb_k_taken_none')}</span>`;
  if (dev.length) {
    html += grp(i18t('tb_k_differs'), dev.length) + `<ul class="tb-rows">${dev.map(r => {
      const kept = D.kept.includes(r.category); const lib = r.where && tbLibraryFor(r.where.head);
      return `<li><span class="g"><b>${esc(r.where ? r.where.head : r.category)}</b><span class="sub" style="font-family:inherit">${esc(i18t('tb_pb_dev_note', { n: r.figure, want: r.want, note: '' }).trim())}</span></span>
        ${kept ? `<span class="st">${i18t('tb_k_kept')}</span>` : `${r.where && lib ? `<button type="button" data-tb-k-use="${r.where.k}">${i18t('tb_k_use_ours')}</button>` : r.where ? `<button type="button" data-tb-show="${r.where.k}">${i18t('tb_show_me')}</button>` : ''}
        <button type="button" data-tb-k-keep="${esc(r.category)}">${i18t('tb_c_keep')}</button>`}</li>`; }).join('')}</ul>`;
  }
  if (open.length) {
    html += grp(i18t('tb_k_missing'), open.length) + `<ul class="tb-rows">${open.map(r => `<li><span class="g"><b>${esc(r.category)}</b><span class="sub" style="font-family:inherit">${i18t('tb_k_expected')}</span></span>
        <button type="button" data-tb-k-add="${esc(r.category)}">${i18t('tb_k_add_ours')}</button><button type="button" data-tb-k-left="${esc(r.category)}">${i18t('tb_k_leave_out')}</button></li>`).join('')}</ul>`;
  }
  if (neg.length) {
    html += grp(i18t('tb_k_negotiated'), neg.length) + `<ul class="tb-rows">${neg.map(x => {
      const sec = tbSectionForClause(x.clause, x.heading);
      return `<li><span class="g"><b>${esc(x.clause)}</b><span class="sub" style="font-family:inherit">${esc(i18t(x.deleted ? 'tb_k_neg_deleted' : 'tb_k_neg_asked', { cp: st.counterparty || i18t('tb_k_they') }))}</span></span>
        ${sec && x.first && !x.deleted ? `<button type="button" data-tb-k-neg="${esc(x.clauseId)}">${i18t('tb_k_compare')}</button>` : ''}
        <button type="button" data-tb-k-negkeep="${esc(x.clauseId)}">${i18t('tb_k_keep_agreed')}</button></li>`; }).join('')}</ul>`;
  }
  html += grp(i18t('tb_k_matches'), hit);
  return html + '</div></div>';
}
function tbBlanksLaneHtml() {
  const first = tbCandsCardHtml();
  const proposed = tbProposedRowHtml(null);
  const rows = _tb.fields.map((f, i) => {
    const lib = (window.FIELD_LIB || {})[f.fieldType] || { label: f.fieldType };
    const uses = tbPlaceholderUse(f.fieldKey);
    /* A field the converter detected and nobody has looked at keeps its flag
       (the fields card carried it since Phase D; the Blanks tab carries it now). */
    const conf = f.detectionConfidence !== 'manual' && !f.humanReviewed
      ? `<span class="st" style="color:${f.detectionConfidence === 'low' ? 'var(--st-ruby-fg)' : 'var(--st-amber-fg)'}" title="${i18t('tb_detected_unreviewed')}">${esc(f.detectionConfidence)} confidence</span>` : '';
    return `<li><span class="tb-bl">${esc(f.label || f.fieldKey)}</span>${f.required ? '<span class="st" style="color:var(--st-ruby-fg)" title="Required">*</span>' : ''}${conf}<span class="g"></span>
      <button type="button" data-tb-fcopy="${i}" title="${i18t('tb_copy_placeholder')}" aria-label="${i18t('tb_copy_placeholder')}">${icon('copy','w-3.5 h-3.5')}</button><button type="button" data-tb-fedit="${i}">${i18t('act_edit')}</button><button type="button" class="x" data-tb-fdel="${i}" title="${i18t('act_remove')}" aria-label="${i18t('act_remove')}">${icon('x','w-3.5 h-3.5')}</button>
      <span class="sub">{{${esc(f.fieldKey)}}} · ${esc(lib.label)}${f.control === 'guided' ? ` · guided (${f.options.length})` : ''}${f.defaultValue ? ' · default set' : ''} · ${uses ? i18tn('tb_in_blocks', uses, { n: uses }) : `<span style="color:var(--st-amber-fg)">${i18t('tb_unplaced')}</span>`}</span></li>`;
  }).join('');
  return `${first}${proposed}${rows ? `<ul class="tb-rows">${rows}</ul>` : (proposed || first ? '' : tbAiHtml(i18t('tb_no_fields')))}
    <div style="margin-top:12px"><button type="button" id="tb-addfield" class="ui-btn ui-btn-sm">${icon('plus', 'w-3 h-3')} ${i18t('tl_add_field')}</button></div>`;
}
function tbScopeHtml() {
  const sec = _tb.focus != null ? tbSectionAt(_tb.focus) : null;
  if (!sec || !_tb.blocks.length || _tb.outline) return '<div id="tb-scope"></div>';
  const txt = tbSectionText(sec);
  const ctx = (_tb.ctx || []).map(k => tbSectionAt(k)).filter(Boolean);
  return `<div id="tb-scope"><div class="tb-scope"><div class="eb"><b>✎ ${i18t('tb_scope', { n: tbSectionNo(sec), head: esc(sec.head) || i18t('tb_untitled') })}</b><span class="g"></span>
      <button type="button" class="x" data-tb-step="-1" title="${i18t('tb_prev')}" aria-label="${i18t('tb_prev')}">${icon('chevL','w-3.5 h-3.5')}</button><button type="button" class="x" data-tb-step="1" title="${i18t('tb_next')}" aria-label="${i18t('tb_next')}">${icon('chevR','w-3.5 h-3.5')}</button><button type="button" class="x" data-tb-untag title="${i18t('tb_untag')}" aria-label="${i18t('tb_untag')}">${icon('x','w-3.5 h-3.5')}</button></div>
    <q class="${txt ? '' : 'e'}">${esc(txt ? txt.slice(0, 160) + (txt.length > 160 ? '…' : '') : i18t('tb_not_written'))}</q>
    ${ctx.map(c => `<span class="ctx">@ ${tbSectionNo(c)} · ${esc(c.head)} — ${i18t('tb_for_context')} <button type="button" data-tb-unctx="${c.k}" title="${i18t('tb_untag')}" aria-label="${i18t('tb_untag')}" style="display:inline-flex;vertical-align:middle">${icon('x','w-3 h-3')}</button></span>`).join('')}</div></div>`;
}
function tbChipsRowHtml() {
  const chips = [];
  if (!_tb.blocks.length || _tb.outline) { if (_tb.outline && _tb.outline.sections) chips.push(['data-tb-out-mine', i18t('tb_walk_mine')]); }
  else {
    const sec = _tb.focus != null ? tbSectionAt(_tb.focus) : null;
    if (sec) {
      const txt = tbSectionText(sec); const lib = tbLibraryFor(sec.head);
      const th = tbThread(sec.k); const last = th[th.length - 1];
      if (last && last.receipt) { const nx = tbNextEmpty(sec.k); if (nx) chips.push([`data-tb-next="${nx.k}"`, i18t('tb_next_sec', { n: tbSectionNo(nx), head: esc(nx.head) }), 'next']); }
      /* ---- YOUR OWN WORDING, ON A SECTION THAT IS ALREADY WRITTEN
             (the build plan's upgrade 3, 18 Sep 2026) ----
         The `!txt` guard was the whole of the gap: Copilot would fill an empty
         section from the clause library and would not offer the same wording
         over one somebody had drafted freehand, which is the more useful half
         and the more common one. Everything the swap needs was already here —
         tbUseLibrary passes the section's own text as `before`, tbMarkedHtml
         draws the two against each other, and Apply is the one writer.
         IT IS STILL NEVER ONE PRESS. On a written section the card arrives as
         a marked-up proposal like every other, and the hover says so rather
         than the label changing: one act, one word for it.
         AND A VERB THAT CANNOT WORK IS NOT DRAWN — where the library's wording
         is already what the section says, there is nothing to propose. */
      if (lib && tbLibraryOffers(sec, lib))
        chips.push([`data-tb-lib="${sec.k}" title="${esc(i18t(txt ? 'tb_pb_lib_over' : 'tb_pb_no_read'))}"`,
          i18t('tb_pb_use_ours', { name: esc(lib.name) })]);
      if (txt) ['shorter', 'firmer', 'mutual', 'plain'].forEach(c => chips.push([`data-tb-chip="${c}" title="${i18t('tb_pb_one_read')}"`, i18t('tb_chip_' + c)]));
      if (_tb.walk && !txt && tbNextEmpty(sec.k)) chips.push(['data-tb-skip', i18t('tb_skip_sec')]);
    }
  }
  return `<div class="tb-chips" id="tb-chips">${chips.map(([attr, label, cls]) => `<button type="button" ${attr}${cls ? ` class="${cls}"` : ''}>${label}</button>`).join('')}</div>`;
}
function tbAskHtml() {
  const sec = _tb.focus != null ? tbSectionAt(_tb.focus) : null;
  const on = typeof copilotAvailable === 'function' && copilotAvailable();
  const opening = !_tb.blocks.length || !!_tb.outline;
  const ph = opening ? i18t('tb_pb_ph_brief') : !sec ? i18t('tb_ph_pick') : _tb.refine ? i18t('tb_ph_refine')
    : tbSectionText(sec) ? i18t('tb_ph_change') : _tb.walk ? i18t('tb_ph_answer') : i18t('tb_pb_ask_ph');
  const draft = sec ? (_tb.ask[sec.k] || '') : (_tb.ask._ || '');
  return `<div class="tb-ask" id="tb-askrow"><textarea id="tb-ask" rows="1" maxlength="${TB_ASK_MAX}" placeholder="${esc(ph)}" aria-label="${i18t('tb_ask_label')}" ${on ? '' : 'disabled'}>${esc(draft)}</textarea>
    <button type="button" data-tb-send title="${on ? i18t('tb_pb_one_read') : esc(i18t('tb_pb_nokey'))}" aria-label="${i18t('tb_send')}" ${on ? '' : 'disabled'}>${icon('send')}</button>
    <div class="tb-pick" id="tb-pick" hidden></div></div>`;
}
function tbFootHtml() {
  const secs = tbSections();
  if (!secs.length) return `<span>${i18t('tb_foot_none')}</span>`;
  const written = secs.filter(s => !tbSectionOwes(s)).length;
  const cov = tbCoverage(); const dev = cov ? cov.deviations : 0;
  const nx = tbNextEmpty(_tb.focus);
  return `<span><b>${i18t('tb_pb_covered', { n: written, m: secs.length })}</b> ${i18t('tb_foot_written')}${dev ? ` · <b>${dev}</b> ${i18tn('tb_foot_dev', dev, { n: dev })}` : ''}</span><span class="sp"></span>
    <button type="button" class="tb-walk${_tb.walk ? ' is-on' : ''}" data-tb-walk title="${esc(i18t('tb_walk_title'))}">${i18t('tb_walk')} · ${_tb.walk ? i18t('tb_on') : i18t('tb_off')}</button>
    <button type="button" class="ui-btn ui-btn-sm tb-nextbtn" data-tb-next="${nx ? nx.k : ''}" ${nx ? '' : 'disabled'}>${i18t('tb_next_section')}${icon('chevR')}</button>`;
}
/* ════ THE THREE-STEP SPINE WAS BUILT, MEASURED AND TAKEN OUT (18 Sep 2026)
   ═══ It was in the approved plan and the plan was wrong, which is what
   measuring is for. The builder never says what the job IS — wording, then
   blanks, then publish — and a strip of three steps would have said it. It
   cost the contract pixels instead:

     · drawn in the strip, the row wrapped and the first line of the wording
       fell from 184px to 222px;
     · pinned to one line with `flex-wrap:nowrap`, the row stopped wrapping
       and SAVE AND PUBLISH wrapped internally instead — 28px tall each
       became 43px — and the wording still sat at 199px.

   REFUSAL 3 says a change may not grow the distance from the top of the
   window to the first line of the agreement, and there is no width in that
   row to take it from: the strip already carries the back button, the draft
   chip, the dirty line, Save and Publish. Two further facts settle it —
   the rail's own tabs already carry Build / Playbook / BLANKS, and Publish is
   already a button twelve pixels away, so the spine was also a second door
   onto two acts that have one (refusal 5).

   IF IT COMES BACK it belongs in the RAIL, which has vertical room and
   already owns the tab that is step two. That is the owner's call, not a
   thing to force into a row that cannot hold it. The three keys
   tb_step_wording / tb_step_blanks / tb_step_publish are NOT left behind:
   they never shipped, so there is nothing to retire. */
function tbRailHtml() {
  const tab = _tb.tab || 'build';
  const cov = tbCoverage(); const dev = cov ? cov.deviations : 0;
  const nb = _tb.fields.length + (_tb.proposed || []).length + ((_tb.cands && _tb.cands.rows) || []).length;
  const T = (id, label, n, cls) => `<button type="button" role="tab" data-tb-tab="${id}" aria-selected="${tab === id}" class="${tab === id ? 'is-on' : ''}">${label}${n ? `<span class="n${cls ? ' ' + cls : ''}">${n}</span>` : ''}</button>`;
  return `<aside class="tb-rail" id="tb-rail" aria-label="${i18t('tb_copilot')}">
    <div class="tb-ah"><span class="sp">✦ ${i18t('tb_copilot')}</span><span class="tb-tabs" role="tablist">${T('build', i18t('tb_tab_build'))}${T('playbook', i18t('tb_pb_playbook'), dev, 'r')}${T('blanks', i18t('tb_tab_blanks'), nb)}</span></div>
    <div class="tb-disc"><b>✦</b><span>${i18t(tab === 'playbook' ? 'tb_pb_cover_foot' : 'tb_disc')}</span></div>
    <div class="tb-lane" id="tb-lane">${tab === 'build' ? tbBuildLaneHtml() : tab === 'playbook' ? tbPlaybookLaneHtml(cov) : tbBlanksLaneHtml()}</div>
    ${tab === 'build' ? tbScopeHtml() + tbChipsRowHtml() + tbAskHtml() : ''}
    <div class="tb-railfoot" id="tb-railfoot">${tbFootHtml()}</div>
  </aside>`;
}

/* ════════ THE NAME, THE CATEGORY AND THE STREAM, AT THE TOP (24 Sep 2026) ════════
   Young's decision 5 on "One Door to Standards": whichever door a template
   came through, what it is called and where it is filed sit at the top of the
   builder — filled in from what HaTi already knows, changeable at any time.
   Every chip is a door onto the Template details box the template's own page
   already opens (tplLibMetaModal), with the caret on the field pressed: ONE
   box, two ways in, so the name, the category and the stream keep one writer.

   A STREAM NOBODY CHOSE IS SAID, NEVER GUESSED: the chip draws "choose" on a
   dashed amber edge — work owed, which is what amber means on this page — and
   the question Publish asks names it with its own door.

   THE ROW MAY NOT GROW (the 18 Sep spine note above tbRailHtml is the measurement): a
   strip that wraps pushes the wording down, and so does a button that wraps
   inside itself. So the strip is ONE line, the two acts never wrap, and what
   gives is WORDS — the name and each chip's value elide, the whole of each on
   its hover. */
function tbHeadFacts() {
  const t = (_tb && _tb.template) || {};
  const category = t.category || 'other';
  const f = t.folder && typeof FOLDERS !== 'undefined' ? FOLDERS[t.folder] : null;
  return {
    name: t.name || '', category,
    categoryName: (typeof tplCategoryName === 'function' ? tplCategoryName(category) : '') || category,
    folder: t.folder || '', streamName: t.folder ? ((f && f.name) || t.folder) : '', color: (f && f.color) || '',
  };
}
function tbHeadHtml() {
  const h = tbHeadFacts();
  const caret = icon('chevD', 'tb-fchip-c');
  const chip = (what, key, val, sw) => `<button type="button" class="tb-fchip${val ? '' : ' empty'}" data-tb-meta="${what}"
      title="${esc(val ? i18t('tb_h_chip_title', { k: key, v: val }) : i18t('tb_h_stream_none'))}"><span class="k">${esc(key)}</span>${sw || ''}<span class="v">${esc(val || i18t('tb_h_choose'))}</span>${caret}</button>`;
  return `<button type="button" class="tb-tname" data-tb-meta="name" title="${esc(i18t('tb_h_rename', { name: h.name }))}"><span class="v">${esc(h.name)}</span>${icon('pencil', 'tb-tname-i')}</button>`
    + `<span class="tb-chipv">${i18t('tb_v_draft', { n: _tb.versionNumber })}</span>`
    + chip('category', i18t('tb_h_category'), h.categoryName)
    + chip('stream', i18t('tb_h_stream'), h.streamName, h.color ? `<span class="sw" style="background:${esc(h.color)}"></span>` : '');
}
function tbPaintHead() { const el = document.getElementById('tb-head'); if (el && _tb) el.innerHTML = tbHeadHtml(); }
/* THE DOOR. The box saves through the template's own PATCH; what comes back
   is the template, so the head repaints from the SERVER'S answer — never from
   what was typed. The paper's title is the name too, so a rename repaints it. */
function tbMetaOpen(focus) {
  if (!_tb || typeof tplLibMetaModal !== 'function') return;
  const tid = _tb.tid;
  tplLibMetaModal(_tb.template, {
    focus,
    onSaved: t => {
      if (!_tb || _tb.tid !== tid || !t) return;
      const renamed = t.name !== (_tb.template && _tb.template.name);
      _tb.template = t;
      tbPaintHead();
      if (renamed) tbPaintPaper();
    },
  });
}

/* ════════ PUBLISH ASKS ONCE, AND NAMES WHAT IS STILL OPEN (24 Sep 2026) ════════
   Decision 2 of "One Door to Standards": publishing while something is open
   ASKS once — the way the builder already treats a difference from Our
   standards, recorded and never blocking — and every item it names is a door
   straight to it. Nothing open, no question: Publish goes on as it always did.

   tbOpenItems is the ONE reading of "what is still open". It spends nothing,
   writes nothing and borrows every figure from a reading the rail already
   draws — tbSections, tbCoverage, the suggestions held for this sitting — so
   the question cannot disagree with the tab twelve pixels away. The order is
   the work's: where it is filed, what is unwritten, the blanks Copilot
   suggested, then the standards. A difference somebody chose to KEEP is still
   said, as a fact (grey), because publishing is where it stops being a draft. */
function tbOpenItems() {
  if (!_tb) return [];
  const out = [];
  if (!(_tb.template && _tb.template.folder)) out.push({ kind: 'stream', tone: 'amb' });
  const empty = tbSections().filter(s => tbSectionOwes(s));
  if (empty.length) out.push({ kind: 'empty', tone: 'amb', n: empty.length, k: empty[0].k, head: empty[0].head || '' });
  const C = _tb.cands;
  if (C && !C.busy && C.rows.length) out.push({ kind: 'cands', tone: 'amb', n: C.rows.length });
  const cov = tbCoverage();
  if (cov) {
    const D = _tb.decided || {};
    cov.rows.filter(r => r.state === 'dev' && r.where).forEach(r => {
      const kept = (D.kept || []).includes(r.category);
      out.push({ kind: 'dev', tone: kept ? 'gry' : 'amb', kept, k: r.where.k, head: r.where.head || r.category });
    });
    const miss = tbMissingStandards(cov).map(r => r.category);
    if (miss.length) out.push({ kind: 'missing', tone: 'amb', n: miss.length, list: miss });
  }
  return out;
}
const TB_PQ_NAMED = 3;   /* missing clauses named in the row before "…" — the rest are on the Playbook tab */
function tbOpenItemLine(it) {
  if (it.kind === 'stream') return i18t('tb_pq_stream');
  if (it.kind === 'empty') return it.n === 1 ? i18t('tb_pq_empty_one', { head: it.head || i18t('tb_untitled') }) : i18t('tb_pq_empty_other', { n: it.n, head: it.head || i18t('tb_untitled') });
  if (it.kind === 'cands') return i18tn('tb_pq_cands', it.n, { n: it.n });
  if (it.kind === 'dev') return i18t(it.kept ? 'tb_pq_dev_kept' : 'tb_pq_dev', { head: it.head });
  if (it.kind === 'missing') return i18tn('tb_pq_missing', it.n, { n: it.n, list: it.list.slice(0, TB_PQ_NAMED).join(', ') + (it.n > TB_PQ_NAMED ? '…' : '') });
  return '';
}
function tbPublishAskHtml(items) {
  const h = tbHeadFacts();
  const rows = items.map((it, i) => `<div class="tb-pq-o"><span class="tb-pq-dot ${it.tone}"></span><span class="tb-pq-t">${esc(tbOpenItemLine(it))}</span>
      <button type="button" class="ui-btn" data-tb-pq="${i}">${i18t(it.kind === 'stream' ? 'tb_pq_choose' : 'tb_pq_show')}</button></div>`).join('');
  return `<div style="padding:24px">
    <h3 style="margin:0 0 6px;font-family:var(--font-heading);font-size:16px;font-weight:var(--w-title)">${esc(i18t('tb_pq_title', { name: h.name, n: _tb.versionNumber }))}</h3>
    <p style="margin:0 0 12px;font-size:var(--t-body);color:var(--color-neutral-600)">${esc(i18tn('tb_pq_lead', items.length, { n: items.length }))}</p>
    <div class="tb-pq">${rows}</div>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:var(--s-4)">
      <button type="button" class="ui-btn" id="tb-pq-keep">${i18t('tb_pq_keep')}</button>
      <button type="button" class="ui-btn ui-btn-primary" id="tb-pq-go">${i18t('tb_pq_go')}</button>
    </div></div>`;
}
/* Each door closes the question FIRST and then acts, so the reader lands on
   the thing it named rather than behind a dialog. Keep writing changes
   nothing — the draft is exactly as it was before Publish was pressed. */
function tbPublishAsk(items) {
  openModal(tbPublishAskHtml(items), { maxWidth: (window.DLG_W && DLG_W.m) || '520px', label: i18t('tb_pq_title', { name: tbHeadFacts().name, n: _tb.versionNumber }) });
  const root = document.getElementById('modal-root');
  root?.querySelectorAll('[data-tb-pq]').forEach(b => b.addEventListener('click', () => {
    const it = items[Number(b.getAttribute('data-tb-pq'))]; closeModal(); if (!it) return;
    if (it.kind === 'stream') tbMetaOpen('stream');
    else if (it.kind === 'empty' || it.kind === 'dev') tbFocus(it.k, { scroll: true });
    else if (it.kind === 'cands') tbSetTab('blanks');
    else if (it.kind === 'missing') tbSetTab('playbook');
  }));
  document.getElementById('tb-pq-keep')?.addEventListener('click', () => closeModal());
  document.getElementById('tb-pq-go')?.addEventListener('click', () => { closeModal(); tbPublishGo(); });
}

/* ---- PAINTING. The page once; the paper and the rail into their own slots,
   so a repaint of one never rebuilds the other (the 30 Aug lesson: nothing is
   rebuilt while a caret is in it). ---- */
/* ---- THE READER'S PLACE SURVIVES A REPAINT (14 Sep 2026) ----
   The paper scrolls inside its own column now, and tbPaint rebuilds that
   column from scratch — a rebuilt scroller starts at the top. The place is
   held before the write and put back straight after it, synchronously and
   ONCE (dsHoldScroll's shape, deliberately not keepScroll's): keepScroll puts
   the old place back again on the next frame, which would undo the
   scrollIntoView an Add block does a tick later to land on its new heading. */
function tbHoldScroll() { const el = document.getElementById('tb-scroll'); return el ? el.scrollTop : null; }
function tbRestoreScroll(top) { if (top == null) return; const el = document.getElementById('tb-scroll'); if (el) el.scrollTop = top; }
/* ---- THE SHELL'S SCROLLBAR CHANNEL IS DEAD SPACE HERE ----
   VIEW_OWNS_HEIGHT (js/app.js) carries this fact for the five views whose root
   is --view-h tall, and renderPageHeader paints #content-scroll.view-fixed
   from it on every view change. This page is not a view — it is drawn under
   Templates — so it paints the class itself on the way in and takes it off on
   its own two ways out (Back, Publish); every other way out is a setView,
   whose renderPageHeader recomputes it from the view name. */
function tbGutter(on) { const sc = document.getElementById('content-scroll'); if (sc && sc.classList) sc.classList.toggle('view-fixed', !!on); }
/* ---- NO SECOND SAVE AND PUBLISH AT THE FOOT (Young ruled 14 Sep 2026) ----
   The pair under the paper was added when the top bar scrolled away on a long
   template. The strip holds still now, so they were the same two acts twice on
   one screen — and the second Publish broke "at most ONE filled button per
   page" besides. `.tb-strip-foot`, `tb-dirty-bottom`, `tb-save-bottom` and
   `tb-publish-bottom` are STALE. The note lives HERE rather than in the
   markup: a comment inside the emitted page would put those names back on it,
   which is what the net reads. */
function tbPaint(opts = {}) {
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius)';
  const held = opts.fresh ? null : tbHoldScroll();
  document.getElementById('content').innerHTML = `${tbStyleHtml()}
  <div class="view-enter tb-page${tbRailFits() ? '' : ' no-rail'}" id="tb-page" style="padding:var(--page-pad)">
    <div class="tb-left">
      <div class="tb-strip">
        <button id="tb-back" type="button" class="ui-btn tb-back" title="${esc(i18t('tb_h_back'))}" aria-label="${esc(i18t('tb_h_back'))}">${icon('arrowLeft', 'w-3.5 h-3.5')}</button>
        <span id="tb-head" class="tb-head">${tbHeadHtml()}</span>
        <span id="tb-dirtyslot" style="display:flex;align-items:center;gap:var(--s-2);min-width:0">${tbDirtyHtml()}</span>
        <span style="flex:1"></span>
        <button id="tb-save" class="ui-btn tb-act" title="${esc(i18t('tb_save_draft'))}" aria-label="${esc(i18t('tb_save_draft'))}">${icon('check2', 'w-3.5 h-3.5')}<span class="w"> ${i18t('tb_save_draft')}</span></button>
        <button id="tb-publish" class="ui-btn ui-btn-primary tb-act">Publish v${_tb.versionNumber}</button>
      </div>
      <!-- THE PAPER SCROLLS INSIDE ITS COLUMN (14 Sep 2026): everything under the
           strip lives in this one scroller, so the strip above and the rail
           beside it never move. -->
      <div class="tb-scroll scroll-thin" id="tb-scroll">
        <div id="tb-paperslot"></div>
        <section style="${CARD};padding:14px var(--s-4);margin-top:14px" id="tb-branding"></section>
      </div>
    </div>
    <div id="tb-railslot"></div>
    <div id="tb-resizer" class="tb-resizer" role="separator" aria-orientation="vertical" tabindex="0"
      aria-label="${esc(i18t('ng_drag_width'))}" title="${esc(i18t('ng_drag_width'))}"><span></span></div>
  </div>`;
  tbPaintPaper(); tbPaintRail(); tbWire(); tbPaintBranding();
  tbRestoreScroll(held);
  tbGutter(true);
}

/* ============================================================================
   THE DIVIDER (Young asked 14 Sep 2026: "make this page similar in
   functionality to the editor page … you can drag / pull a separator one side
   to be bigger than the other. Leave all else the same.")
   ----------------------------------------------------------------------------
   The clause editor's divider, ported again — ceWireSplit's own five
   properties (one geometry, the pointer's position never its travel, a grab
   offset, the grid observed, an unmeasured grid left alone). What differs is
   said: this grid has a 16px GAP track the handle straddles, so the available
   width is the grid's less the gap; and where NOTHING is stored the sheet's own
   columns hold (a 380px rail), exactly as the negotiation page's divider rests
   on its CSS until somebody moves it — a double-click or Home puts that back.
   The rail's floor is the editor's (340: it is the same rail in the same
   clothes); the paper's floor is the editor's paper floor too.
   ========================================================================== */
const TB_FMIN = 0.45, TB_FMAX = 0.80;
const TB_LEFT_MIN = 380, TB_RIGHT_MIN = 340, TB_GAP = 16;
const TB_SPLIT_KEY = 'hati.v1.tbLeftFrac';
function _tbLeftFrac() {
  try {
    const v = localStorage.getItem(TB_SPLIT_KEY);
    if (v == null || v === '') return null;
    const n = Number(v);
    return (n >= TB_FMIN - 0.001 && n <= TB_FMAX + 0.001) ? n : null;
  } catch (_) { return null; }
}
/* THE GRID CARRIES THE PAGE'S OWN PADDING (the editor's does not): the columns
   are laid out inside it, and an absolute handle is placed from the padding
   edge — so both readings take the padding off, or the handle sits a
   page-margin left of the seam (measured: 16px, 14 Sep 2026). */
const _tbPad = grid => { try { const cs = getComputedStyle(grid); return { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0 }; } catch (_) { return { l: 0, r: 0 }; } };
const _tbAvail = grid => { const pad = _tbPad(grid); return Math.max(0, grid.clientWidth - pad.l - pad.r - TB_GAP); };
/* COUNTING IS NOT DRAWING: the arithmetic answers on its own and is proved
   without a browser (f306). Both stops in both directions, as the editor's. */
function tbSplit(avail, frac) {
  const f = Math.max(TB_FMIN, Math.min(TB_FMAX, typeof frac === 'number' && isFinite(frac) ? frac : 2 / 3));
  let left = Math.round(f * avail);
  let limit = f <= TB_FMIN ? 'min' : f >= TB_FMAX ? 'max' : null;
  if (avail >= TB_LEFT_MIN + TB_RIGHT_MIN) {
    if (left <= TB_LEFT_MIN) { left = TB_LEFT_MIN; limit = 'min'; }
    else if (left >= avail - TB_RIGHT_MIN) { left = avail - TB_RIGHT_MIN; limit = 'max'; }
  }
  return { left, limit };
}
function tbFitSplit() {
  const grid = document.getElementById('tb-page');
  const rez = grid && grid.querySelector('#tb-resizer');
  if (!grid || !rez) return;
  const frac = _tbLeftFrac();
  /* The sheet's own layout, or no rail at all: nothing is written over it —
     an inline column would beat the stacked rule. The handle still sits on
     the seam the sheet drew. */
  if (grid.classList.contains('no-rail') || !tbRailFits() || frac == null) {
    grid.style.gridTemplateColumns = '';
    rez.removeAttribute('data-rl-at-limit');
    const leftEl = grid.querySelector('.tb-left');
    let w = 0;
    try { w = leftEl ? leftEl.getBoundingClientRect().width : 0; } catch (_) { w = 0; }
    rez.style.left = w ? (_tbPad(grid).l + w + TB_GAP / 2) + 'px' : '';
    return;
  }
  const avail = _tbAvail(grid);
  if (avail < 160) return;
  const { left, limit } = tbSplit(avail, frac);
  grid.style.gridTemplateColumns = left + 'px minmax(0,1fr)';
  rez.style.left = (_tbPad(grid).l + left + TB_GAP / 2) + 'px';
  if (limit) rez.setAttribute('data-rl-at-limit', limit); else rez.removeAttribute('data-rl-at-limit');
}
function tbWireSplit() {
  const grid = document.getElementById('tb-page');
  const rez = grid && grid.querySelector('#tb-resizer');
  if (!grid || !rez) return;
  tbFitSplit();
  if (rez.dataset.tbSplitBound) return;
  rez.dataset.tbSplitBound = '1';
  const clamp = f => Math.max(TB_FMIN, Math.min(TB_FMAX, f));
  const save = f => { try { localStorage.setItem(TB_SPLIT_KEY, String(f)); } catch (_) {} };
  const clear = () => { try { localStorage.removeItem(TB_SPLIT_KEY); } catch (_) {} };
  /* The fraction in force: stored, else the one the sheet is drawing. */
  const fracNow = () => {
    const f = _tbLeftFrac();
    if (f != null) return f;
    const leftEl = grid.querySelector('.tb-left');
    const avail = Math.max(1, _tbAvail(grid));
    try { return clamp((leftEl ? leftEl.getBoundingClientRect().width : avail * 2 / 3) / avail); } catch (_) { return 2 / 3; }
  };
  let grabDx = 0;
  const pointerFrac = x => {
    const r = grid.getBoundingClientRect();
    const avail = Math.max(1, _tbAvail(grid));
    return clamp(((x + grabDx) - r.left - _tbPad(grid).l - TB_GAP / 2) / avail);
  };
  const onMove = e => {
    const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    save(pointerFrac(x));
    tbFitSplit();
  };
  const onUp = () => {
    delete rez.dataset.drag;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };
  rez.addEventListener('pointerdown', e => {
    e.preventDefault();
    rez.dataset.drag = '1';
    const hb = rez.getBoundingClientRect();
    grabDx = (hb.left + hb.width / 2) - e.clientX;
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
  rez.addEventListener('keydown', e => {
    if (e.key === 'Home' || e.key === 'Enter') { e.preventDefault(); clear(); tbFitSplit(); return; }
    const step = e.key === 'ArrowLeft' ? -0.02 : e.key === 'ArrowRight' ? 0.02 : 0;
    if (!step) return;
    e.preventDefault();
    save(clamp(fracNow() + step));
    tbFitSplit();
  });
  rez.addEventListener('dblclick', () => { clear(); tbFitSplit(); });
  if (typeof ResizeObserver === 'function' && !grid._tbObs) {
    try { grid._tbObs = new ResizeObserver(() => tbFitSplit()); grid._tbObs.observe(grid); } catch (_) {}
  }
}
function tbPaintPaper() { const s = document.getElementById('tb-paperslot'); if (s) s.innerHTML = tbPaperHtml(); }
/* `keep` holds the lane's own place: a tick, a Keep or a Leave out changes one
   row of the list the reader is looking at, and must not throw them to its
   top (keepScroll's rule, for this page's own scroller). */
function tbPaintRail(o = {}) {
  const s = document.getElementById('tb-railslot'); if (!s) return;
  const lane = o.keep ? document.getElementById('tb-lane') : null; const top = lane ? lane.scrollTop : null;
  s.innerHTML = tbRailFits() ? tbRailHtml() : '';
  if (top != null) { const l2 = document.getElementById('tb-lane'); if (l2) l2.scrollTop = top; }
}
function tbPaintScope() { const s = document.getElementById('tb-scope'); if (s) s.outerHTML = tbScopeHtml(); }
function tbPaintFocusFrame() {
  document.querySelectorAll('[data-tb-sec]').forEach(el => el.classList.toggle('is-on', String(el.getAttribute('data-tb-sec')) === String(_tb.focus)));
}
/* ---- ONE READING OF WHAT THE STRIP'S ONE SLOT SAYS ----
   tbPaint and tbPatchDirty each carried their own copy of
   `dirty ? 'Unsaved changes' : ''`. There are three states now, so there is
   one reading: a draft this browser refused to keep still gets the old
   sentence, because for that draft it is the true one. NO NEW SLOT — the
   strip has printed a line in this place since the builder was written, and
   what changed is what it says. */
function tbDirtyLine() {
  if (!_tb || !_tb.dirty) return '';
  if (!_tb.kept) return i18t('tb_unsaved');
  return _tb.restoredAt ? i18t('tb_kept_restored', { at: _tb.restoredAt }) : i18t('tb_kept');
}
/* Discard is drawn only while a RESTORED draft is showing — beside the fact it
   acts on, and never as permanent furniture. Once the reader types, the words
   on screen are this sitting's and the way to throw them away is the way it
   always was: leave without saving. */
function tbDirtyHtml() {
  const line = tbDirtyLine();
  const drop = (_tb && _tb.restoredAt)
    ? `<button id="tb-drop" class="ui-btn ui-btn-sm">${esc(i18t('tb_kept_discard'))}</button>` : '';
  return `<span id="tb-dirty" style="font-size:var(--t-label);color:var(--color-neutral-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(line)}</span>${drop}`;
}
function tbPatchDirty() {
  const d = document.getElementById('tb-dirtyslot'); if (d) d.innerHTML = tbDirtyHtml();
  const f = document.getElementById('tb-railfoot'); if (f) f.innerHTML = tbFootHtml();
}
/* Throwing a restored draft away puts the SERVER'S version back on the screen,
   because a screen still showing the draft after "Discard" would be the
   product disagreeing with itself. openTemplateBuilder is that act — one door,
   already written — so this drops the store entry and presses it. */
function tbDropDraft() {
  if (!_tb || !_tb.restoredAt) return;
  const tid = _tb.tid, vid = _tb.vid;
  (typeof confirmDialog === 'function'
    ? confirmDialog({ title: i18t('tb_kept_drop_title'), message: i18t('tb_kept_drop_msg'),
        confirmLabel: i18t('tb_kept_discard'), danger: true })
    : Promise.resolve(true)).then(ok => {
      if (!ok) return;
      tbKeepCancel(); tbDraftDrop(tid, vid); openTemplateBuilder(tid, vid);
    }).catch(() => {});
}
/* Crossing the 1024 line repaints the page once: the rail arrives or leaves,
   the paper keeps its words either way. */
let _tbResizeBound = false; /* bound once for the page's life, never per paint */
function tbOnResize() {
  if (!_tb || !document.getElementById('tb-page')) return;
  const fits = tbRailFits();
  if (fits !== _tb._fits) { _tb._fits = fits; tbPaint(); }
}

/* ---- ONE PRESS AT A TIME — the doors, delegated once per page paint ----
   Both slots are repainted by innerHTML, so their listeners live on the slot,
   never on what is inside it: a partial repaint cannot orphan or double a
   handler. */
function tbSend() {
  const box = document.getElementById('tb-ask'); const said = box ? box.value.trim() : '';
  if (!_tb.blocks.length || _tb.outline) { tbOutlineRun(said); return; }
  if (_tb.focus == null) { toast(i18t('tb_ph_pick'), 'err'); return; }
  tbDraft(_tb.focus, said);
}
function tbBlockOf(el) { const row = el.closest ? el.closest('[data-tb-content]') : null; return row ? Number(row.getAttribute('data-tb-content')) : -1; }
function tbSecOf(el) { const s = el.closest ? el.closest('[data-tb-sec]') : null; return s ? Number(s.getAttribute('data-tb-sec')) : null; }
function tbPickHtml(q) {
  const secs = tbSections().filter(s => !q || String(s.head || '').toLowerCase().includes(q.toLowerCase()));
  if (!secs.length) return '';
  return secs.map(s => `<button type="button" data-tb-pick="${s.k}"><i class="d ${tbSectionText(s) ? 'ok' : ''}"></i>${tbSectionNo(s)} · ${esc(s.head || i18t('tb_untitled'))}<small>${tbSectionText(s) ? i18t('tb_written') : i18t('tb_empty')}</small></button>`).join('');
}
function tbWire() {
  document.getElementById('tb-back')?.addEventListener('click', () => tbLeave());
  document.getElementById('tb-save')?.addEventListener('click', () => tbSave());
  document.getElementById('tb-publish')?.addEventListener('click', () => tbPublish());
  /* DELEGATED, because #tb-dirtyslot is repainted by tbPatchDirty without a
     tbWire — a listener bound to the button inside it would be orphaned by the
     first keystroke. The strip itself is only ever rebuilt by tbPaint, which
     runs tbWire again, so this is one listener per paint and never two. */
  document.querySelector('.tb-strip')?.addEventListener('click', e => {
    if (!e.target.closest) return;
    if (e.target.closest('#tb-drop')) { tbDropDraft(); return; }
    /* The head is repainted by tbPaintHead without a tbWire, so its three
       doors are answered here, on the strip, for the same reason as Discard. */
    const m = e.target.closest('[data-tb-meta]');
    if (m) tbMetaOpen(m.getAttribute('data-tb-meta'));
  });
  if (!_tbResizeBound && typeof window !== 'undefined' && typeof window.addEventListener === 'function') { _tbResizeBound = true; window.addEventListener('resize', tbOnResize); }
  _tb._fits = tbRailFits();
  tbWireSplit();

  /* ---- THE PAPER ---- */
  const paper = document.getElementById('tb-paperslot');
  paper?.addEventListener('click', e => {
    const el = e.target.closest ? e.target : null; if (!el) return;
    const hit = sel => el.closest(sel);
    let b;
    if ((b = hit('[data-tb-tag]'))) { tbFocus(Number(b.getAttribute('data-tb-tag')), { ask: true }); return; }
    if ((b = hit('[data-tb-up]'))) { tbMove(Number(b.getAttribute('data-tb-up')), -1); return; }
    if ((b = hit('[data-tb-down]'))) { tbMove(Number(b.getAttribute('data-tb-down')), +1); return; }
    if ((b = hit('[data-tb-del]'))) { _tb.blocks.splice(Number(b.getAttribute('data-tb-del')), 1); tbTouch(); tbPaint(); return; }
    if ((b = hit('[data-tb-ph]'))) {
      /* The placeholder under an empty heading: one press makes the wording
         block (tbWordingBlock, the one splice) and puts the caret in it. */
      const sec = tbSectionAt(Number(b.getAttribute('data-tb-ph'))); if (!sec) return;
      const bi = tbWordingBlock(sec); tbPaintPaper();
      const ed = document.querySelector(`[data-tb-content="${bi}"]`); if (ed) ed.focus();
      return;
    }
    if ((b = hit('[data-tb-blank]'))) {
      const key = b.getAttribute('data-tb-blank'); const i = _tb.fields.findIndex(f => f.fieldKey === key);
      if (i >= 0) tbFieldModal(i); else { tbSetTab('blanks'); tbFieldModal(null, key); }
      return;
    }
    if (hit('#tb-addblock')) {
      const nb = tbAddBlock(document.getElementById('tb-addtype').value);
      if (nb) { tbPaint(); if (nb.blockType === 'heading') tbFocus(nb._k, { scroll: true }); }
    }
  });
  paper?.addEventListener('focusin', e => {
    const k = tbSecOf(e.target); if (k != null && k !== _tb.focus && tbBlockOf(e.target) >= 0) tbFocus(k);
    /* A new paragraph typed into the document's markup is a <p>, never a <div>. */
    const ed = e.target.closest ? e.target.closest('[data-tb-kind="rich"]') : null;
    if (ed) { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (_) {} }
  });
  paper?.addEventListener('input', e => {
    const i = tbBlockOf(e.target); if (i < 0) return;
    const el = e.target.closest('[data-tb-content]');
    const kind = el.getAttribute('data-tb-kind');
    _tb.blocks[i].content = kind === 'rich' ? tbReadRich(el)
      : kind === 'rheading' ? tbReadRich(el, el.getAttribute('data-tb-lv') || tbRichTag(_tb.blocks[i].content)) : tbReadEditable(el);
    tbTouch();
    tbPatchDirty();
    const sec = el.closest('[data-tb-sec]');
    if (sec) { const s = tbSectionAt(Number(sec.getAttribute('data-tb-sec'))); if (s) sec.classList.toggle('is-empty', !tbSectionText(s)); }
    if (kind === 'heading' || kind === 'rheading') tbPaintScope();
  });
  paper?.addEventListener('focusout', e => {
    const i = tbBlockOf(e.target); if (i < 0) return;
    const el = e.target.closest('[data-tb-content]');
    /* Leaving a block draws its chips again; the caret has gone, so nothing
       is lost by rebuilding the words. Chips flip the paper's state dot too. */
    const kind = el.getAttribute('data-tb-kind');
    if (kind === 'text') el.innerHTML = tbChipsHtml(_tb.blocks[i].content);
    else if (kind === 'rich') el.innerHTML = tbRichChipsHtml(_tb.blocks[i].content);
    else if (kind === 'rheading') el.innerHTML = tbRichChipsHtml(tbRichInner(_tb.blocks[i].content));
    const sec = el.closest('[data-tb-sec]');
    if (sec) { const s = tbSectionAt(Number(sec.getAttribute('data-tb-sec'))); const st = s ? tbSecState(s, tbCoverage()) : '';
      ['is-written', 'is-dev', 'is-esc'].forEach(c => sec.classList.remove(c)); if (st) sec.classList.add('is-' + st); }
    tbPaintScope();
  });
  paper?.addEventListener('keydown', e => {
    const i = tbBlockOf(e.target); if (i < 0) return;
    const kind = e.target.closest('[data-tb-content]').getAttribute('data-tb-kind');
    if (e.key === 'Escape') { e.target.blur(); return; }
    if (e.key !== 'Enter') return;
    /* In the document's own markup Enter is the browser's: a new paragraph,
       which the sanitiser keeps as a <p> on the way back. */
    if (kind === 'rich') return;
    e.preventDefault();
    if (kind === 'text' && !e.shiftKey) { try { document.execCommand('insertText', false, '\n'); } catch (_) {} return; }
    e.target.blur();
  });
  paper?.addEventListener('paste', e => {
    if (tbBlockOf(e.target) < 0) return;
    e.preventDefault();
    const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    try { document.execCommand('insertText', false, text); } catch (_) {}
  });

  /* ---- THE RAIL ---- */
  const rail = document.getElementById('tb-railslot');
  rail?.addEventListener('click', async e => {
    const el = e.target; const hit = sel => (el.closest ? el.closest(sel) : null);
    let b;
    if ((b = hit('[data-tb-tab]'))) { tbSetTab(b.getAttribute('data-tb-tab')); return; }
    if (hit('[data-tb-send]')) { tbSend(); return; }
    if ((b = hit('[data-tb-step]'))) { tbStep(Number(b.getAttribute('data-tb-step'))); return; }
    if (hit('[data-tb-untag]')) { tbFocus(null); return; }
    if ((b = hit('[data-tb-unctx]'))) { _tb.ctx = (_tb.ctx || []).filter(k => k !== Number(b.getAttribute('data-tb-unctx'))); tbPaintScope(); return; }
    if ((b = hit('[data-tb-pick]'))) {
      const k = Number(b.getAttribute('data-tb-pick')); const box = document.getElementById('tb-ask');
      if (box) { const v = box.value; const at = v.lastIndexOf('@'); const s = tbSectionAt(k);
        box.value = (at >= 0 ? v.slice(0, at) : v) + `@${tbSectionNo(s)} ${s.head} `; box.focus(); }
      if (k !== _tb.focus && !(_tb.ctx || []).includes(k)) { _tb.ctx = (_tb.ctx || []).concat(k); tbPaintScope(); }
      const pick = document.getElementById('tb-pick'); if (pick) pick.hidden = true;
      return;
    }
    if ((b = hit('[data-tb-lib]'))) { tbUseLibrary(Number(b.getAttribute('data-tb-lib'))); return; }
    if ((b = hit('[data-tb-chip]'))) { if (_tb.focus != null) tbDraft(_tb.focus, TB_CHIP_ASK[b.getAttribute('data-tb-chip')]); return; }
    if (hit('[data-tb-skip]')) { const nx = tbNextEmpty(_tb.focus); if (nx) tbFocus(nx.k, { scroll: true }); return; }
    if ((b = hit('[data-tb-next]'))) { const k = b.getAttribute('data-tb-next'); if (k !== '') { _tb.lastReceipt = null; tbFocus(Number(k), { scroll: true }); } return; }
    if ((b = hit('[data-tb-use]'))) { const [k, i] = b.getAttribute('data-tb-use').split(':').map(Number); tbAccept(k, i); return; }
    if ((b = hit('[data-tb-refine]'))) {
      const [k, i] = b.getAttribute('data-tb-refine').split(':').map(Number);
      _tb.refine = tbThread(k)[i].card; tbPaintRail();
      const box = document.getElementById('tb-ask'); if (box) box.focus();
      return;
    }
    if (hit('[data-tb-out-add]')) { tbOutlineAdd(); return; }
    if (hit('[data-tb-out-mine]')) { tbOutlineAdd({ walk: false }); return; }
    if (hit('[data-tb-brief-again]')) { _tb.outline = null; tbPaintRail(); return; }
    if (hit('[data-tb-walk]')) { _tb.walk = !_tb.walk; tbPaintRail(); return; }
    if ((b = hit('[data-tb-show]'))) { tbFocus(Number(b.getAttribute('data-tb-show')), { scroll: true }); return; }
    if ((b = hit('[data-tb-cover-draft]'))) { tbFocus(Number(b.getAttribute('data-tb-cover-draft')), { scroll: true, ask: true, prefill: b.getAttribute('data-tb-note') || '' }); return; }
    if ((b = hit('[data-tb-cover-add]'))) {
      /* The missing position is a DOOR, and it presses the same add act the
         button on the paper does — heading, then one wording block under it. */
      const name = b.getAttribute('data-tb-cover-add');
      const h = tbAddBlock('heading', name); tbAddBlock('field_group', '');
      tbPaint(); if (h) tbFocus(h._k, { scroll: true, ask: true });
      return;
    }
    if ((b = hit('[data-tb-keep]'))) { tbKeepBlank(Number(b.getAttribute('data-tb-keep'))); return; }
    /* ---- the one door's first moves (24 Sep 2026) ---- */
    if (hit('[data-tb-cand-all]')) { if (_tb.cands) { _tb.cands.all = true; tbPaintRail({ keep: true }); } return; }
    if (hit('[data-tb-cand-make]')) { tbMakeBlanks(); return; }
    if ((b = hit('[data-tb-note-rm]'))) { tbCandNote(b.getAttribute('data-tb-note-rm'), true); return; }
    if ((b = hit('[data-tb-note-keep]'))) { tbCandNote(b.getAttribute('data-tb-note-keep'), false); return; }
    if ((b = hit('[data-tb-putback]'))) { tbPutBack(b.getAttribute('data-tb-putback')); return; }
    if ((b = hit('[data-tb-k-use]'))) { const k = Number(b.getAttribute('data-tb-k-use')); tbFocus(k, { scroll: true }); tbUseLibrary(k); return; }
    if ((b = hit('[data-tb-k-keep]'))) { (_tb.decided = _tb.decided || { kept: [], left: [], neg: [] }).kept.push(b.getAttribute('data-tb-k-keep')); tbPaintRail({ keep: true }); return; }
    if ((b = hit('[data-tb-k-add]'))) { tbAddStandard(b.getAttribute('data-tb-k-add')); return; }
    if ((b = hit('[data-tb-k-left]'))) { (_tb.decided = _tb.decided || { kept: [], left: [], neg: [] }).left.push(b.getAttribute('data-tb-k-left')); tbPaintRail({ keep: true }); return; }
    if ((b = hit('[data-tb-k-neg]'))) { tbCompareFirst(b.getAttribute('data-tb-k-neg')); return; }
    if ((b = hit('[data-tb-k-negkeep]'))) { (_tb.decided = _tb.decided || { kept: [], left: [], neg: [] }).neg.push(b.getAttribute('data-tb-k-negkeep')); tbPaintRail({ keep: true }); return; }
    if ((b = hit('[data-tb-drop]'))) { tbDropBlank(Number(b.getAttribute('data-tb-drop'))); return; }
    if ((b = hit('[data-tb-fedit]'))) { tbFieldModal(Number(b.getAttribute('data-tb-fedit'))); return; }
    if ((b = hit('[data-tb-fcopy]'))) {
      const f = _tb.fields[Number(b.getAttribute('data-tb-fcopy'))]; const ph = `{{${f.fieldKey}}}`;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ph);
      toast(`${ph} copied — paste it into the wording`, 'ok'); return;
    }
    if ((b = hit('[data-tb-fdel]'))) {
      const i = Number(b.getAttribute('data-tb-fdel')); const f = _tb.fields[i];
      const uses = tbPlaceholderUse(f.fieldKey);
      if (uses) {
        const ok = typeof confirmDialog === 'function'
          ? await confirmDialog({ title: `Remove “${f.label || f.fieldKey}”?`, message: `Its marker sits in ${uses} block${uses === 1 ? '' : 's'} of wording — deleting the field replaces the marker with a plain blank there.`, confirmLabel: 'Remove field', danger: true })
          : true;
        if (!ok) return;
        // the marker goes with the field — orphaned {{code}} never reaches a contract
        if (window.templateFormStripMarker)
          _tb.blocks = _tb.blocks.map(x => ({ ...x, content: templateFormStripMarker(x.content, f.fieldKey) }));
      }
      _tb.fields.splice(i, 1); tbTouch(); tbPaint(); return;
    }
    if (hit('#tb-addfield')) { tbFieldModal(null); }
  });
  rail?.addEventListener('change', e => {
    const b = e.target.closest ? e.target.closest('[data-tb-out]') : null;
    if (b) { const x = _tb.outline && _tb.outline.sections[Number(b.getAttribute('data-tb-out'))]; if (x) { x.on = b.checked; tbPaintRail(); } }
    /* A tick on a suggested blank: the count on "Make N blanks" follows it. */
    const c = e.target.closest ? e.target.closest('[data-tb-cand]') : null;
    if (c && _tb.cands) { const r = _tb.cands.rows.find(x => x.id === c.getAttribute('data-tb-cand')); if (r) { r.on = c.checked; tbPaintRail({ keep: true }); } }
  });
  rail?.addEventListener('input', e => {
    if (e.target.id !== 'tb-ask') return;
    const box = e.target; const sec = _tb.focus != null ? tbSectionAt(_tb.focus) : null;
    _tb.ask[sec ? sec.k : '_'] = box.value;
    /* @ opens the section picker: the word after @ narrows it, a pick puts the
       section's name in the box and tags it as context. */
    const pick = document.getElementById('tb-pick'); if (!pick) return;
    const m = /@([^@\s]*)$/.exec(box.value.slice(0, box.selectionStart == null ? box.value.length : box.selectionStart));
    const html = m && _tb.blocks.length && !_tb.outline ? tbPickHtml(m[1]) : '';
    pick.innerHTML = html; pick.hidden = !html;
  });
  rail?.addEventListener('keydown', e => {
    if (e.target.id !== 'tb-ask') return;
    const pick = document.getElementById('tb-pick');
    if (e.key === 'Escape' && pick && !pick.hidden) { pick.hidden = true; e.preventDefault(); return; }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (pick && !pick.hidden) { const first = pick.querySelector('[data-tb-pick]'); if (first) { first.click(); return; } }
      tbSend();
    }
  });
}

function tbKeyFromLabel(label) {
  const base = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^([0-9])/, 'f$1').slice(0, 64) || 'field';
  let key = base, n = 2;
  while (_tb.fields.some(f => f.fieldKey === key)) key = base + '_' + (n++);
  return key;
}
const tbPlaceholderUse = key => _tb.blocks.filter(b => b.content.includes(`{{${key}}}`)).length;

function tbMove(i, d) {
  const j = i + d;
  if (j < 0 || j >= _tb.blocks.length) return;
  const [b] = _tb.blocks.splice(i, 1);
  _tb.blocks.splice(j, 0, b);
  tbTouch(); tbPaint();
}

/* ---- LEAVING, AND THE LADDER WALKED DOWN RATHER THAN UP (17 Sep 2026) ----
   With the draft kept, the old warning said something untrue: the edits since
   the last save are not lost. So the blocking dialog is spent only where it is
   still the honest answer — a draft this browser REFUSED to keep — and the
   ordinary way out takes the rung below it, a transient confirmation. Question
   2 of the six: the cheapest channel that carries the fact. */
function tbLeave() {
  const go = () => { tbGutter(false); openTemplateLibDetail(_tb.tid); };
  if (!_tb.dirty) return go();
  /* THE PENDING KEEP IS SPENT BEFORE ANYTHING ELSE. Leaving inside the
     debounce window must not be the one press that loses the sentence the
     timer was still holding. */
  if (tbKeepNow()) { toast(i18t('tb_kept_toast'), 'ok'); return go(); }
  (typeof confirmDialog === 'function'
    ? confirmDialog({ get title(){ return i18t('tb_leave_without_saving'); }, message: i18t('tb_leave_lost'), confirmLabel: i18t('tb_leave_go'), danger: true })
    : Promise.resolve(true)).then(ok => { if (ok) go(); });
}

async function tbSave(quiet) {
  try {
    await api(`templates/${_tb.tid}/versions/${_tb.vid}`, 'PUT', {
      blocks: _tb.blocks.map((b, i) => tbBlockOut(b, i)),
      fields: _tb.fields.map((f, i) => ({ ...f, orderIndex: i, humanReviewed: true })),
    });
    /* The version now holds exactly this, so the kept draft is spent: leaving
       it behind would put these same words back on the next open as though
       they were unsaved, and a later one over a colleague's save. */
    tbDraftSettled();
    if (!quiet) { toast(i18t('tb_draft_saved')); tbPatchDirty(); }
    return true;
  } catch (e) { toast(e.message, 'err'); return false; }
}

/* Publish goes THROUGH the Design step — never around it (decision 2 in
   DESIGN-contract-designer.md). The step carries the change-note field and
   the publish call; with a company default already saved it opens
   pre-dressed and Publish is one click. */
function tbPublish() {
  /* THE QUESTION COMES BEFORE THE SAVE (24 Sep 2026): "Keep writing" must
     leave the draft exactly as it was, strip line included. */
  const open = tbOpenItems();
  if (open.length) { tbPublishAsk(open); return; }
  return tbPublishGo();
}
async function tbPublishGo() {
  if (!await tbSave(true)) return;
  tbGutter(false);   /* the Design step is its own page; onBack repaints this one, which paints it on again */
  openDesignStep({
    mode: 'publish',
    tid: _tb.tid, vid: _tb.vid, versionNumber: _tb.versionNumber,
    templateName: _tb.template.name,
    form: {
      blocks: _tb.blocks.map((b, i) => tbBlockOut(b, i)),
      fields: _tb.fields, values: {},
    },
    onBack: () => tbPaint(),
  });
}

/* ---------- field editor modal ---------- */
function tbFieldModal(index, presetKey) {
  const f = index != null ? { ..._tb.fields[index] } : {
    fieldKey: '', label: presetKey ? String(presetKey).replace(/_/g, ' ') : '', section: '', fieldType: 'short_text', control: 'free',
    options: [], required: false, defaultValue: '', helpText: '',
    detectionConfidence: 'manual', humanReviewed: true,
  };
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);height:var(--field-h);padding:0 var(--field-pad-x);font:inherit;font-size:var(--field-size);outline:none';
  const types = Object.entries(window.FIELD_LIB || {}).map(([k, v]) =>
    `<option value="${k}"${f.fieldType === k ? ' selected' : ''}>${v.label}</option>`).join('');
  openModal(`
    <div style="padding:24px">
      <h3 style="margin:0 0 14px;font-family:var(--font-heading);font-size:16px;font-weight:var(--w-title)">${index != null ? 'Edit field' : 'Add field'}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <label><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('tb_label')}</span>
          <input id="tbf-label" style="${INP}" maxlength="200" value="${esc(f.label)}" placeholder="e.g. KRA PIN"></label>
        <label><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('tb_type')}</span>
          <select id="tbf-type" style="${INP}">${types}</select></label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        <label><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('tb_answers')}</span>
          <select id="tbf-control" style="${INP}">
            <option value="free"${f.control === 'free' ? ' selected' : ''}>${i18t('tb_free')}</option>
            <option value="guided"${f.control === 'guided' ? ' selected' : ''}>${i18t('tb_guided')}</option>
          </select></label>
        <label style="display:flex;align-items:flex-end;gap:7px;padding-bottom:var(--s-2)">
          <input type="checkbox" id="tbf-required" ${f.required ? 'checked' : ''}>
          <span style="font-size:var(--t-meta)">${i18t('tb_required')}</span></label>
      </div>
      <label id="tbf-optwrap" style="display:${f.control === 'guided' ? 'block' : 'none'};margin-top:10px">
        <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('tb_approved_options')} <span style="font-weight:var(--w-body);color:var(--color-neutral-500)">${i18t('tb_one_per_line')}</span></span>
        <textarea id="tbf-options" style="${INP};height:auto;padding:var(--field-pad-y) var(--field-pad-x);min-height:64px">${esc(f.options.join('\n'))}</textarea></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        <label><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('tb_default_value')} <span style="font-weight:var(--w-body);color:var(--color-neutral-500)">(supports {{org.…}})</span></span>
          <input id="tbf-default" style="${INP}" maxlength="2000" value="${esc(f.defaultValue)}" placeholder="e.g. {{org.company_name}}"></label>
        <label><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('tb_section')} <span style="font-weight:var(--w-body);color:var(--color-neutral-500)">${i18t('tb_groups_form')}</span></span>
          <input id="tbf-section" style="${INP}" maxlength="200" value="${esc(f.section)}" placeholder="e.g. Company information"></label>
      </div>
      <label style="display:block;margin-top:10px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('tb_help_text')}</span>
        <input id="tbf-help" style="${INP}" maxlength="1000" value="${esc(f.helpText)}" placeholder="${i18t('tb_shown_under_input')}"></label>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--s-4)">
        <span style="font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)" id="tbf-keyprev">${f.fieldKey ? `{{${esc(f.fieldKey)}}}` : ''}</span>
        <div style="display:flex;gap:var(--s-2)">
          <button class="ui-btn" onclick="closeModal()">${i18t('act_cancel')}</button>
          <button id="tbf-save" class="ui-btn ui-btn-primary">${index != null ? 'Save field' : 'Add field'}</button>
        </div>
      </div>
    </div>`);
  document.getElementById('tbf-control')?.addEventListener('change', e => {
    document.getElementById('tbf-optwrap').style.display = e.target.value === 'guided' ? 'block' : 'none';
  });
  document.getElementById('tbf-label')?.addEventListener('input', e => {
    if (index == null) document.getElementById('tbf-keyprev').textContent = '{{' + tbKeyFromLabel(e.target.value) + '}}';
  });
  document.getElementById('tbf-save')?.addEventListener('click', () => {
    const label = document.getElementById('tbf-label').value.trim();
    if (!label) { toast(i18t('tb_field_needs_label'), 'err'); return; }
    const control = document.getElementById('tbf-control').value;
    const options = document.getElementById('tbf-options').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (control === 'guided' && !options.length) { toast(i18t('tb_guided_needs_option'), 'err'); return; }
    const next = {
      ...f, label, control, options: control === 'guided' ? options : [],
      fieldType: document.getElementById('tbf-type').value,
      required: document.getElementById('tbf-required').checked,
      defaultValue: document.getElementById('tbf-default').value.trim(),
      section: document.getElementById('tbf-section').value.trim(),
      helpText: document.getElementById('tbf-help').value.trim(),
      humanReviewed: true,
    };
    if (index == null) next.fieldKey = tbKeyFromLabel(label);
    if (index != null) _tb.fields[index] = next; else _tb.fields.push(next);
    tbTouch(); closeModal(); tbPaint();
  });
}

/* ---------- branding panel (org-level, rendered on every template) ---------- */
async function tbPaintBranding() {
  const host = document.getElementById('tb-branding');
  if (!host) return;
  let b = null;
  try { b = (await api('org/branding')).branding; } catch (_) {}
  b = b || { logoUrl: null, companyName: '', registrationNumber: '', address: '', defaultFooterText: '' };
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);height:var(--field-h);padding:0 var(--field-pad-x);font:inherit;font-size:var(--field-size);outline:none';
  host.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <h4 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-card);margin:0">${i18t('tb_branding')}</h4>
      <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('tb_org_wide')}</span>
    </div>
    <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
      <div style="flex:none;display:flex;flex-direction:column;gap:6px;align-items:center">
        <div style="width:120px;height:64px;border:1px dashed var(--color-divider);border-radius:var(--radius);display:grid;place-items:center;overflow:hidden;background:var(--color-bg)">
          ${b.logoUrl ? `<img src="${b.logoUrl}" alt="logo" style="max-width:100%;max-height:100%">` : `<span style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('tb_no_logo')}</span>`}
        </div>
        <input type="file" id="tb-logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
        <button id="tb-logo-btn" class="ui-btn ui-btn-sm">${icon('upload', 'w-3 h-3')} ${b.logoUrl ? 'Replace logo' : 'Upload logo'}</button>
      </div>
      <div style="min-width:260px;flex:1;display:grid;grid-template-columns:1fr 1fr;gap:var(--s-2)">
        <input id="tb-b-name" style="${INP}" placeholder="${i18t('tb_company_name')}" value="${esc(b.companyName)}">
        <input id="tb-b-reg" style="${INP}" placeholder="${i18t('tb_reg_number')}" value="${esc(b.registrationNumber)}">
        <input id="tb-b-addr" style="${INP};grid-column:1/-1" placeholder="${i18t('tb_reg_address')}" value="${esc(b.address)}">
        <input id="tb-b-footer" style="${INP};grid-column:1/-1" placeholder="Footer text (e.g. Registered in ${jxName()} · C.123456)" value="${esc(b.defaultFooterText)}">
        <div style="grid-column:1/-1;display:flex;justify-content:flex-end">
          <button id="tb-b-save" class="ui-btn ui-btn-sm">${i18t('tb_save_branding')}</button>
        </div>
      </div>
    </div>`;
  const save = async (logoUrl) => {
    try {
      await api('org/branding', 'PUT', {
        logoUrl: logoUrl !== undefined ? logoUrl : b.logoUrl,
        companyName: document.getElementById('tb-b-name').value.trim(),
        registrationNumber: document.getElementById('tb-b-reg').value.trim(),
        address: document.getElementById('tb-b-addr').value.trim(),
        defaultFooterText: document.getElementById('tb-b-footer').value.trim(),
      });
      toast(i18t('tb_branding_saved')); tbPaintBranding();
    } catch (e) { toast(e.message, 'err'); }
  };
  document.getElementById('tb-b-save')?.addEventListener('click', () => save());
  document.getElementById('tb-logo-btn')?.addEventListener('click', () => document.getElementById('tb-logo-file').click());
  document.getElementById('tb-logo-file')?.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast(i18t('tb_logo_500kb'), 'err'); return; }
    const r = new FileReader();
    r.onload = () => save(String(r.result));
    r.readAsDataURL(file);
  });
}

/* The readings are published and the screen is not: a check drives tbSections
   and tbCoverage over a block list it wrote itself, with no builder open. */
Object.assign(window, { openTemplateBuilder, tbCardWording, TB_BLOCK_META, TB_PB_KEY, TB_ASK_MAX, TB_BLANK_TYPE, TB_RAIL_MIN, TB_CHIP_ASK,
  tbSplit, tbFitSplit, tbWireSplit, TB_SPLIT_KEY, TB_FMIN, TB_FMAX, TB_LEFT_MIN, TB_RIGHT_MIN, TB_GAP,
  tbSections, tbSectionText, tbDropExtraBody, tbKindOf, tbLibraryFor, tbLibraryOffers, tbCoverage, tbPbKey, tbStandardFor, tbPrecedentFor,
  tbFocus, tbSetTab, tbRailFits, tbNextEmpty, tbQuestionFor, tbChipsHtml, tbReadEditable, tbPaint, tbPaintRail, tbSend, tbAccept, tbOutlineAdd, tbTurn, tbSetWalk,
  /* The kept draft: the store, its one funnel and the one reading of what the
     strip says — published for the same reason as the rest of this line, so a
     check can drive them without a builder open. */
  TB_DRAFT_KEY, TB_DRAFT_MAX, TB_DRAFT_MS, tbDraftId, tbDraftBase, tbDraftRead, tbDraftKeep, tbDraftDrop,
  tbTouch, tbKeepNow, tbDirtyLine, tbDirtyHtml, tbAdopt, tbDropDraft, tbLeave, tbSave,
  /* A copied document on the paper (24 Sep 2026): the block's two shapes, its
     words, and the chips drawn into — and read back out of — its markup. */
  tbBlockCopy, tbBlockOut, tbBlockText, tbRichChipsHtml, tbReadRich, tbPaperHtml,
  /* One door to standards (24 Sep 2026): the start each door hands over,
     Copilot's first move for it, the one word-replacing act, the head's
     name / category / stream, and the question Publish asks. */
  tbStartWith, tbOutlineFrom, tbSourceOf, tbReplaceWords, tbPlaces, tbTextBlocks, tbBlankCandidates, tbVariantsOk, tbBlanksFirst, tbMakeBlanks,
  tbCandNote, tbPutBack, tbSectionForClause, tbCompareFirst, tbAddStandard, tbCandsCardHtml, tbContractCardHtml,
  TB_CAND_MAX, TB_CAND_CHUNK, TB_CAND_SHOWN,
  tbHeadFacts, tbHeadHtml, tbPaintHead, tbMetaOpen, tbOpenItems, tbOpenItemLine, tbPublishAskHtml, tbPublishAsk, tbPublish, tbPublishGo, TB_PQ_NAMED,
  tbSectionOwes, tbMissingStandards });
