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

async function openTemplateBuilder(tid, vid) {
  if (window.tplLibCancelPending) tplLibCancelPending(); // a stale library list must not paint over the builder
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
    blocks: v.blocks.map((b, i) => ({ blockType: b.blockType, content: b.content, _k: i + 1 })),
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
  };
  /* The section in hand at open is the first one still to write, else the
     first — so the rail has something to say before anything is pressed. */
  const secs = tbSections(); const first = secs.find(x => !tbSectionText(x)) || secs[0];
  _tb.focus = first ? first.k : null;
  tbPaint();
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
    if (b.blockType === 'heading') { cur = { k: b._k, head: b.content || '', headIndex: i, body: [] }; out.push(cur); return; }
    if (cur && (b.blockType === 'fixed_text' || b.blockType === 'field_group')) cur.body.push(i);
  });
  return out;
}
const tbSectionAt = k => tbSections().find(s => s.k === k) || null;
const tbSectionText = (sec, blocks) => { const bs = blocks || (_tb && _tb.blocks) || [];
  return sec ? sec.body.map(i => (bs[i] && bs[i].content) || '').join('\n\n').trim() : ''; };

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
  _tb.dirty = true;
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
  _tb.dirty = true;
  return sec.headIndex + 1;
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
    /* A SECTION IS PROPOSED ONCE. The playbook's rows come from positions AND
       ranges, which can share a category, and a model that ignored "do not
       propose these" would name one again — so the playbook's additions are
       folded against what is already on the list, and against each other. */
    const fold = h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
    const proposed = (d.sections || []).map(x => ({ heading: x.heading, intent: x.intent || '', on: true }));
    const seen = new Set(proposed.map(x => fold(x.heading)));
    const mine = [];
    (cov ? cov.rows : []).filter(r => r.state === 'open').forEach(r => {
      if (seen.has(fold(r.category))) return;
      seen.add(fold(r.category));
      mine.push({ heading: r.category, intent: r.note || '', playbook: true, on: true });
    });
    _tb.outline = { said, note: d.note || '', sections: proposed.concat(mine) };
    _tb.said = said;
  } catch (e) { _tb.outline = { said, error: tbSay(e) }; }
  tbPaintRail();
}
/* Add the ticked sections; then WALK ME THROUGH IT is on by default (the
   owner's decision 2, 13 Sep 2026) — the first empty section is put in hand
   with its question. `walk:false` is the "I'll write them myself" chip. */
function tbOutlineAdd(opts = {}) {
  const list = (_tb.outline && _tb.outline.sections || []).filter(x => x.on);
  if (!list.length) { toast(i18t('tb_pb_none_ticked'), 'err'); return; }
  let first = null;
  list.forEach(x => {
    const h = tbAddBlock('heading', x.heading); tbAddBlock('field_group', '');
    if (h) { _tb.intent[h._k] = x.intent || ''; if (!first) first = h; }
  });
  _tb.outline = null;
  _tb.walk = opts.walk !== false;
  toast(i18tn('tb_pb_added', list.length, { n: list.length }));
  tbPaint();
  if (first) tbFocus(first._k, { scroll: true });
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
  for (let n = 1; n <= secs.length; n++) { const s = secs[(i + n + secs.length) % secs.length]; if (!tbSectionText(s) && s.k !== fromK) return s; }
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
function tbUseLibrary(k) {
  const sec = tbSectionAt(k); if (!sec) return;
  const lib = tbLibraryFor(sec.head); if (!lib) return;
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

/* ---- APPLY: the one press that moves wording into the record ----
   It writes the SAME block content a keystroke writes — no second writer — and
   then asks the blanks reader what should be a blank. Walk me through it moves
   the section in hand on to the next empty one; the paper is not scrolled, so
   the words that just landed stay in view. */
async function tbAccept(k, idx) {
  const sec = tbSectionAt(k); const turn = tbThread(k)[idx]; const a = turn && turn.card;
  if (!sec || !a || !a.text || a.applied) return;
  const bi = tbWordingBlock(sec);
  _tb.blocks[bi].content = a.text;
  _tb.dirty = true;
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
    const have = _tb.fields.map(f => f.fieldKey);
    const rows = (d.fields || [])
      .filter(f => f && f.find && String(text).includes(f.find) && !have.includes(f.key))
      .map(f => ({ k, key: String(f.key || '').slice(0, 64), label: String(f.label || f.key || ''),
                   type: TB_BLANK_TYPE[f.type] || 'short_text', opts: Array.isArray(f.opts) ? f.opts : [],
                   required: !!f.required, maps: String(f.maps || ''), find: String(f.find) }));
    if (rows.length) { _tb.proposed = (_tb.proposed || []).concat(rows); tbPaint(); }
  } catch (_) { /* a blank nobody proposed is the ordinary case, not a failure to report */ }
}
function tbKeepBlank(i) {
  const p = (_tb.proposed || [])[i]; if (!p) return;
  const sec = tbSectionAt(p.k);
  /* The marker is placed where the wording actually is — by literal
     replacement, the same move the upload path makes — so a field can never
     exist with nothing pointing at it. */
  if (sec) sec.body.forEach(bi => {
    if (_tb.blocks[bi].content.includes(p.find))
      _tb.blocks[bi].content = _tb.blocks[bi].content.split(p.find).join('{{' + p.key + '}}');
  });
  _tb.fields.push({ fieldKey: p.key, label: p.label, section: '', fieldType: p.type,
    control: p.opts.length ? 'guided' : 'free', options: p.opts, required: p.required,
    defaultValue: '', helpText: '', detectionConfidence: 'manual', humanReviewed: true });
  _tb.proposed.splice(i, 1);
  _tb.dirty = true; tbPaint();
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
  .tb-page{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:16px;align-items:start}
  .tb-page.no-rail{grid-template-columns:minmax(0,1fr)}
  .tb-left{min-width:0}
  .tb-strip{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
  .tb-strip-foot{justify-content:flex-end;margin:14px 0 0}
  .tb-paper{background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:0;
    max-width:var(--doc-sheet-max,780px);margin:0 auto;padding:34px 48px 36px 62px;font-size:14px;line-height:1.7;color:var(--color-text)}
  @media (max-width:700px){ .tb-paper{padding:22px 18px 24px 46px} }
  .tb-title{font-family:var(--font-heading);font-size:16px;font-weight:var(--w-strong);text-align:center;margin:0 0 20px;letter-spacing:.01em}
  .tb-brand{font-size:var(--t-micro);letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-600);border-bottom:1px solid var(--color-divider);padding-bottom:8px;margin-bottom:18px}
  .tb-row{position:relative}
  .tb-g{position:absolute;left:-48px;top:1px;display:flex;flex-direction:column;gap:3px;opacity:0;transition:opacity var(--dur-1,120ms)}
  .tb-row:hover>.tb-g,.tb-row:focus-within>.tb-g,.tb-sec.is-on>.tb-row-h>.tb-g{opacity:1}
  .tb-g button{width:22px;height:22px;display:grid;place-items:center;border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:var(--radius);font:inherit;font-size:11px;color:var(--color-neutral-600);padding:0;cursor:pointer;line-height:1}
  .tb-g button:hover{border-color:var(--accent-solid);color:var(--color-text)}
  .tb-g button[data-tb-tag]{color:#5B21B6;border-color:#DDD6FE;background:#F5F3FF;font-size:12px}
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
  .tb-bl{display:inline-flex;align-items:center;padding:0 6px;background:var(--st-steel-bg);border:1px solid var(--st-steel-line);color:var(--st-steel-fg);
    border-radius:var(--radius);font-size:12px;font-weight:var(--w-title);line-height:1.55;white-space:nowrap;vertical-align:baseline;cursor:pointer;font-style:normal}
  .tb-bl.is-new{background:var(--st-amber-bg);border-color:var(--st-amber-line);color:var(--st-amber-fg)}
  .tb-sigs{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:26px;margin-top:22px;padding-top:14px;border-top:1px solid var(--color-divider)}
  .tb-sig .tb-sigwho{font-weight:var(--w-strong);font-size:13px}
  .tb-sig .tb-sigline{display:block;border-bottom:1px solid var(--color-neutral-500);height:26px;margin:14px 0 4px}
  .tb-sig small{color:var(--color-neutral-600);font-size:11px}
  .tb-add{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:26px;padding-top:12px;border-top:1px dashed var(--color-divider)}
  .tb-rail{position:sticky;top:0;align-self:start;display:flex;flex-direction:column;min-width:0;min-height:420px;
    background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius);
    height:calc(100vh - var(--shell-head-h,44px) - 32px);font-size:var(--t-meta);color:var(--color-text)}
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
  .tb-card .av button{height:26px;padding:0 11px;font:inherit;font-size:var(--t-label);font-weight:var(--w-strong);background:var(--color-surface);color:var(--accent-ink);border:1px solid var(--color-divider);cursor:pointer}
  .tb-card .av button.p{background:var(--color-accent-700);border-color:var(--accent-ink-700);color:#fff}
  .tb-card .av button:hover{border-color:var(--accent-solid)} .tb-card .av button[disabled]{opacity:.45;cursor:default}
  .tb-card .av .cost{margin-left:auto;font-size:var(--t-micro);color:var(--color-neutral-500)}
  .tb-card.rcpt{background:var(--color-surface)} .tb-card.rcpt .n{font-size:var(--t-meta);color:var(--st-green-fg)}
  .tb-list{margin:6px 0 0;padding:0;list-style:none} .tb-list li{padding:6px 0;border-top:1px solid var(--color-divider);font-size:var(--t-meta)} .tb-list li:first-child{border-top:0}
  .tb-list label{display:flex;gap:8px;align-items:flex-start;cursor:pointer} .tb-list label>span{min-width:0;flex:1}
  .tb-list .fr{font-size:var(--t-micro);color:var(--st-steel-fg);background:var(--st-steel-bg);padding:0 5px;margin-left:6px;white-space:nowrap}
  .tb-list .it{display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.45}
  .tb-rows{margin:0;padding:0;list-style:none} .tb-rows li{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--color-divider);font-size:var(--t-meta);flex-wrap:wrap}
  .tb-rows li:first-child{border-top:0} .tb-rows .g{flex:1;min-width:0} .tb-rows .st{font-size:var(--t-label);white-space:nowrap;color:var(--color-neutral-600)}
  .tb-rows .st.ok{color:var(--st-green-fg)} .tb-rows .st.dev{color:var(--st-ruby-fg)} .tb-rows .st.open{color:var(--st-amber-fg)}
  .tb-rows button{font:inherit;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--accent-ink);border:1px solid var(--color-divider);background:var(--color-surface);padding:1px 8px;white-space:nowrap;cursor:pointer}
  .tb-rows button.x{color:var(--st-ruby-fg);border-color:var(--st-ruby-line)}
  .tb-rows i.d{width:7px;height:7px;border-radius:50%;background:var(--color-divider);flex:none;display:block} .tb-rows i.d.ok{background:var(--accent-solid)} .tb-rows i.d.dev{background:var(--st-ruby-fg)}
  .tb-rows .sub{display:block;width:100%;font-size:var(--t-label);color:var(--color-neutral-600);font-family:var(--font-mono);line-height:1.4}
  .tb-scope{flex:none;margin:0 13px 9px;padding:8px 10px;background:var(--color-neutral-100);border:1px solid var(--color-divider)}
  .tb-scope .eb{display:flex;align-items:center;gap:6px;font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--accent-ink)}
  .tb-scope .eb b{font-weight:var(--w-title);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tb-scope .eb .g{flex:1;min-width:4px}
  .tb-scope .x{flex:none;width:20px;height:20px;display:inline-grid;place-items:center;padding:0;font:inherit;font-size:var(--t-label);background:none;border:0;color:var(--color-neutral-600);cursor:pointer;letter-spacing:0}
  .tb-scope .x:hover{color:var(--color-text)}
  .tb-scope q{display:block;margin-top:5px;padding-left:8px;quotes:none;border-left:2px solid var(--accent-solid);font-size:var(--t-label);line-height:1.55;color:var(--color-text)}
  .tb-scope q.e{color:var(--color-neutral-500);font-style:italic}
  .tb-scope .ctx{display:inline-flex;align-items:center;gap:5px;margin:7px 6px 0 0;font-size:var(--t-micro);color:var(--color-neutral-600);background:var(--color-surface);border:1px solid var(--color-divider);padding:1px 7px}
  .tb-scope .ctx button{border:0;background:none;font:inherit;cursor:pointer;color:inherit;padding:0}
  .tb-chips{flex:none;display:flex;gap:7px;flex-wrap:nowrap;overflow-x:auto;padding:0 14px 9px;scrollbar-width:thin;
    -webkit-mask-image:linear-gradient(to right,#000 calc(100% - 34px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 34px),transparent)}
  .tb-chips:empty{padding:0}
  .tb-chips button{flex:none;height:25px;padding:0 9px;font:inherit;font-size:var(--t-label);white-space:nowrap;background:var(--color-surface);color:var(--color-neutral-600);border:1px solid var(--color-divider);cursor:pointer}
  .tb-chips button:hover{color:var(--color-text);border-color:var(--accent-solid)} .tb-chips button.next{border-color:var(--accent-solid);color:var(--accent-ink);font-weight:var(--w-title)}
  .tb-ask{flex:none;display:flex;gap:var(--s-2);padding:10px 14px;border-top:1px solid var(--color-divider);align-items:flex-end;position:relative}
  .tb-ask textarea{flex:1;min-width:0;height:74px;min-height:74px;max-height:200px;padding:9px 11px;font:inherit;font-size:var(--t-meta);line-height:1.5;resize:none;
    white-space:pre-wrap;overflow-wrap:break-word;background:var(--color-surface);border:1px solid var(--color-divider);color:var(--color-text);outline:none}
  .tb-ask textarea:focus{box-shadow:var(--focus)} .tb-ask textarea[disabled]{background:var(--color-neutral-100)}
  .tb-ask button{flex:none;display:inline-grid;place-items:center;width:32px;height:32px;padding:0;background:var(--color-accent-700);border:1px solid var(--color-accent-700);color:#fff;font-size:14px;cursor:pointer}
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
function tbChipsHtml(text) {
  return esc(String(text || '')).replace(/\{\{([a-z0-9_]+)\}\}/gi, (m, key) => {
    const f = _tb.fields.find(x => x.fieldKey === key);
    const label = f ? (f.label || key) : key;
    return `<span class="tb-bl${f ? '' : ' is-new'}" contenteditable="false" data-tb-blank="${esc(key)}" title="${f ? esc('{{' + key + '}} · ' + i18t('tb_bl_edit')) : esc(i18t('tb_bl_new'))}">${esc(label)}</span>`;
  });
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
  else bs[bi].content = text;
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
      <button type="button" data-tb-up="${i}" ${i === 0 ? 'disabled' : ''} title="${i18t('tb_move_up')}">↑</button>
      <button type="button" data-tb-down="${i}" ${i === _tb.blocks.length - 1 ? 'disabled' : ''} title="${i18t('tb_move_down')}">↓</button>
      <button type="button" data-tb-del="${i}" title="${i18t('tb_remove_block')}">✕</button></span>`;
  let html = ''; let open = false; let n = 0; let sigs = false; let titled = false;
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
      n++; const sec = bySec.get(i); const st = sec ? tbSecState(sec, cov) : '';
      html += `<div class="tb-sec${sec && sec.k === _tb.focus ? ' is-on' : ''}${st ? ' is-' + st : ''}${sec && !tbSectionText(sec) ? ' is-empty' : ''}" data-tb-sec="${b._k}">
        <div class="tb-row tb-row-h" data-tb-row="${i}"><span class="tb-dot"></span>${G(i, fits ? `<button type="button" data-tb-tag="${b._k}" title="${i18t('tb_ask_label')}">✦</button>` : '')}
          <h3 class="tb-h"><span class="tb-n">${n}.</span><span class="tb-ed tb-hed" contenteditable="true" spellcheck="false" data-tb-content="${i}" data-tb-kind="heading" data-ph="${i18t('tb_ph_heading')}">${esc(b.content)}</span></h3></div>
        ${sec && !sec.body.length ? `<p class="tb-p tb-ph" data-tb-ph="${b._k}">${i18t('tb_ph_empty')}</p>` : ''}`;
      open = true; return;
    }
    if (b.blockType === 'fixed_text' || b.blockType === 'field_group') {
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
      <select id="tb-addtype" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:var(--s-1) var(--s-2);font:inherit;font-size:var(--t-meta)">
        ${Object.entries(TB_BLOCK_META).map(([k, m]) => `<option value="${k}" title="${esc(m.tip)}">${m.label}</option>`).join('')}
      </select>
      <button type="button" id="tb-addblock" class="ui-btn" style="font-size:var(--t-meta);padding:var(--s-1) 10px">${icon('plus', 'w-3 h-3')} ${i18t('tb_add_block')}</button>
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
  const rows = o.sections.map((x, n) => `<li><label><input type="checkbox" data-tb-out="${n}" ${x.on ? 'checked' : ''} style="margin-top:3px"><span><b>${esc(x.heading)}</b>${x.playbook ? `<span class="fr">${i18t('tb_pb_from_playbook')}</span>` : ''}${x.intent ? `<span class="it">${esc(x.intent)}</span>` : ''}</span></label></li>`).join('');
  const n = o.sections.filter(x => x.on).length;
  return html + `<div class="tb-ai"><p class="t">${i18tn('tb_pb_proposed_n', o.sections.length, { n: o.sections.length })}${o.note ? ' ' + esc(o.note) : ''}</p>
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
    if (!sec) return (_tb.said ? `<p class="tb-quiet">${i18t('tb_pb_building')} <i style="font-style:normal;color:var(--color-text)">“${esc(_tb.said)}”</i></p>` : '')
      + tbAiHtml(i18t('tb_pick_lead')) + (secs.length ? tbSectionListHtml(secs) : '');
    let html = '';
    if (_tb.lastReceipt && _tb.lastReceipt.k === sec.k) html += tbReceiptHtml(_tb.lastReceipt.text);
    const th = tbThread(sec.k);
    if (!th.length) html += tbAiHtml(esc(_tb.walk && !tbSectionText(sec) ? tbQuestionFor(sec) : i18t('tb_greet', { head: sec.head || i18t('tb_untitled') })));
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
                   : `<button type="button" data-tb-cover-add="${esc(r.category)}">${i18t('tb_pb_add_section')}</button>`;
    }
    const st = r.state === 'dev' ? `${i18t('tb_pb_reads_fig', { n: r.figure })} · ${r.op} ${r.want}` : r.state === 'hit' ? i18t('tb_met') : i18t('tb_not_yet_written');
    return `<li><i class="d ${r.state === 'hit' ? 'ok' : r.state}"></i><span class="g">${esc(r.category)}${r.escalate ? ` · ${i18t('tb_pb_legal')}` : ''}</span><span class="st ${r.state === 'hit' ? 'ok' : r.state}">${st}</span>${door}
      ${why ? `<span class="sub" style="font-family:inherit">${esc(why)}</span>` : ''}</li>`;
  }).join('');
  return `<div class="tb-card" style="margin-top:0"><div class="n">${i18t('tb_pb_cover_head')}<span class="g"></span><span class="chip ${cov.deviations ? 'dev' : 'lib'}">${i18t('tb_pb_covered', { n: cov.covered, m: cov.total })}</span></div>
    <span class="r">${esc(cov.label)}</span><ul class="tb-rows" style="margin-top:6px">${rows}</ul>
    <span class="r">${i18t('tb_pb_dev_rides')}</span></div>`;
}
function tbBlanksLaneHtml() {
  const proposed = tbProposedRowHtml(null);
  const rows = _tb.fields.map((f, i) => {
    const lib = (window.FIELD_LIB || {})[f.fieldType] || { label: f.fieldType };
    const uses = tbPlaceholderUse(f.fieldKey);
    /* A field the converter detected and nobody has looked at keeps its flag
       (the fields card carried it since Phase D; the Blanks tab carries it now). */
    const conf = f.detectionConfidence !== 'manual' && !f.humanReviewed
      ? `<span class="st" style="color:${f.detectionConfidence === 'low' ? 'var(--st-ruby-fg)' : 'var(--st-amber-fg)'}" title="${i18t('tb_detected_unreviewed')}">${esc(f.detectionConfidence)} confidence</span>` : '';
    return `<li><span class="tb-bl">${esc(f.label || f.fieldKey)}</span>${f.required ? '<span class="st" style="color:var(--st-ruby-fg)" title="Required">*</span>' : ''}${conf}<span class="g"></span>
      <button type="button" data-tb-fcopy="${i}" title="${i18t('tb_copy_placeholder')}">⧉</button><button type="button" data-tb-fedit="${i}">${i18t('act_edit')}</button><button type="button" class="x" data-tb-fdel="${i}">✕</button>
      <span class="sub">{{${esc(f.fieldKey)}}} · ${esc(lib.label)}${f.control === 'guided' ? ` · guided (${f.options.length})` : ''}${f.defaultValue ? ' · default set' : ''} · ${uses ? i18tn('tb_in_blocks', uses, { n: uses }) : `<span style="color:var(--st-amber-fg)">${i18t('tb_unplaced')}</span>`}</span></li>`;
  }).join('');
  return `${proposed}${rows ? `<ul class="tb-rows">${rows}</ul>` : (proposed ? '' : tbAiHtml(i18t('tb_no_fields')))}
    <div style="margin-top:12px"><button type="button" id="tb-addfield" class="ui-btn" style="font-size:var(--t-meta);padding:var(--s-1) 10px">${icon('plus', 'w-3 h-3')} ${i18t('tl_add_field')}</button></div>`;
}
function tbScopeHtml() {
  const sec = _tb.focus != null ? tbSectionAt(_tb.focus) : null;
  if (!sec || !_tb.blocks.length || _tb.outline) return '<div id="tb-scope"></div>';
  const txt = tbSectionText(sec);
  const ctx = (_tb.ctx || []).map(k => tbSectionAt(k)).filter(Boolean);
  return `<div id="tb-scope"><div class="tb-scope"><div class="eb"><b>✎ ${i18t('tb_scope', { n: tbSectionNo(sec), head: esc(sec.head) || i18t('tb_untitled') })}</b><span class="g"></span>
      <button type="button" class="x" data-tb-step="-1" title="${i18t('tb_prev')}">◀</button><button type="button" class="x" data-tb-step="1" title="${i18t('tb_next')}">▶</button><button type="button" class="x" data-tb-untag title="${i18t('tb_untag')}">✕</button></div>
    <q class="${txt ? '' : 'e'}">${esc(txt ? txt.slice(0, 160) + (txt.length > 160 ? '…' : '') : i18t('tb_not_written'))}</q>
    ${ctx.map(c => `<span class="ctx">@ ${tbSectionNo(c)} · ${esc(c.head)} — ${i18t('tb_for_context')} <button type="button" data-tb-unctx="${c.k}" title="${i18t('tb_untag')}">✕</button></span>`).join('')}</div></div>`;
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
      if (lib && !txt) chips.push([`data-tb-lib="${sec.k}" title="${esc(i18t('tb_pb_no_read'))}"`, i18t('tb_pb_use_ours', { name: esc(lib.name) })]);
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
    <button type="button" data-tb-send title="${on ? i18t('tb_pb_one_read') : esc(i18t('tb_pb_nokey'))}" aria-label="${i18t('tb_send')}" ${on ? '' : 'disabled'}>➤</button>
    <div class="tb-pick" id="tb-pick" hidden></div></div>`;
}
function tbFootHtml() {
  const secs = tbSections();
  if (!secs.length) return `<span>${i18t('tb_foot_none')}</span>`;
  const written = secs.filter(s => tbSectionText(s)).length;
  const cov = tbCoverage(); const dev = cov ? cov.deviations : 0;
  const nx = tbNextEmpty(_tb.focus);
  return `<span><b>${i18t('tb_pb_covered', { n: written, m: secs.length })}</b> ${i18t('tb_foot_written')}${dev ? ` · <b>${dev}</b> ${i18tn('tb_foot_dev', dev, { n: dev })}` : ''}</span><span class="sp"></span>
    <button type="button" class="tb-walk${_tb.walk ? ' is-on' : ''}" data-tb-walk title="${esc(i18t('tb_walk_title'))}">${i18t('tb_walk')} · ${_tb.walk ? i18t('tb_on') : i18t('tb_off')}</button>
    <button type="button" class="ui-btn tb-nextbtn" data-tb-next="${nx ? nx.k : ''}" ${nx ? '' : 'disabled'} style="font-size:var(--t-label);padding:2px 9px">${i18t('tb_next_section')} →</button>`;
}
function tbRailHtml() {
  const tab = _tb.tab || 'build';
  const cov = tbCoverage(); const dev = cov ? cov.deviations : 0; const nb = _tb.fields.length + (_tb.proposed || []).length;
  const T = (id, label, n, cls) => `<button type="button" role="tab" data-tb-tab="${id}" aria-selected="${tab === id}" class="${tab === id ? 'is-on' : ''}">${label}${n ? `<span class="n${cls ? ' ' + cls : ''}">${n}</span>` : ''}</button>`;
  return `<aside class="tb-rail" id="tb-rail" aria-label="${i18t('tb_copilot')}">
    <div class="tb-ah"><span class="sp">✦ ${i18t('tb_copilot')}</span><span class="tb-tabs" role="tablist">${T('build', i18t('tb_tab_build'))}${T('playbook', i18t('tb_pb_playbook'), dev, 'r')}${T('blanks', i18t('tb_tab_blanks'), nb)}</span></div>
    <div class="tb-disc"><b>✦</b><span>${i18t(tab === 'playbook' ? 'tb_pb_cover_foot' : 'tb_disc')}</span></div>
    <div class="tb-lane" id="tb-lane">${tab === 'build' ? tbBuildLaneHtml() : tab === 'playbook' ? tbPlaybookLaneHtml(cov) : tbBlanksLaneHtml()}</div>
    ${tab === 'build' ? tbScopeHtml() + tbChipsRowHtml() + tbAskHtml() : ''}
    <div class="tb-railfoot" id="tb-railfoot">${tbFootHtml()}</div>
  </aside>`;
}

/* ---- PAINTING. The page once; the paper and the rail into their own slots,
   so a repaint of one never rebuilds the other (the 30 Aug lesson: nothing is
   rebuilt while a caret is in it). ---- */
function tbPaint() {
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius)';
  const t = _tb.template;
  document.getElementById('content').innerHTML = `${tbStyleHtml()}
  <div class="view-enter tb-page${tbRailFits() ? '' : ' no-rail'}" id="tb-page" style="padding:var(--page-pad)">
    <div class="tb-left">
      <div class="tb-strip">
        <button id="tb-back" class="ui-btn" style="font-size:var(--t-meta);padding:var(--s-1) 10px">${icon('arrowLeft', 'w-3.5 h-3.5')} ${esc(t.name)}</button>
        <span style="font-family:var(--font-mono);font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--st-steel-fg);border:1px solid var(--st-steel-line);background:var(--st-steel-bg);border-radius:var(--radius);padding:1px 7px">${i18t('tb_v_draft', { n: _tb.versionNumber })}</span>
        <span id="tb-dirty" style="font-size:var(--t-label);color:var(--color-neutral-500)">${_tb.dirty ? 'Unsaved changes' : ''}</span>
        <span style="flex:1"></span>
        <button id="tb-save" class="ui-btn" style="font-size:var(--t-meta);padding:5px 13px">${icon('check2', 'w-3.5 h-3.5')} ${i18t('tb_save_draft')}</button>
        <button id="tb-publish" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:5px 13px">Publish v${_tb.versionNumber}</button>
      </div>
      <div id="tb-paperslot"></div>
      <section style="${CARD};padding:14px var(--s-4);margin-top:14px" id="tb-branding"></section>
      <!-- The same two verbs again at the foot: on a long template the top bar
           is screens away by the time the last block is written, and a save
           that requires scrolling back up is a save that gets skipped. -->
      <div class="tb-strip tb-strip-foot">
        <span id="tb-dirty-bottom" style="font-size:var(--t-label);color:var(--color-neutral-500)">${_tb.dirty ? 'Unsaved changes' : ''}</span>
        <button id="tb-save-bottom" class="ui-btn" style="font-size:var(--t-meta);padding:5px 13px">${icon('check2', 'w-3.5 h-3.5')} ${i18t('tb_save_draft')}</button>
        <button id="tb-publish-bottom" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:5px 13px">Publish v${_tb.versionNumber}</button>
      </div>
    </div>
    <div id="tb-railslot"></div>
  </div>`;
  tbPaintPaper(); tbPaintRail(); tbWire(); tbPaintBranding();
}
function tbPaintPaper() { const s = document.getElementById('tb-paperslot'); if (s) s.innerHTML = tbPaperHtml(); }
function tbPaintRail() { const s = document.getElementById('tb-railslot'); if (s) s.innerHTML = tbRailFits() ? tbRailHtml() : ''; }
function tbPaintScope() { const s = document.getElementById('tb-scope'); if (s) s.outerHTML = tbScopeHtml(); }
function tbPaintFocusFrame() {
  document.querySelectorAll('[data-tb-sec]').forEach(el => el.classList.toggle('is-on', String(el.getAttribute('data-tb-sec')) === String(_tb.focus)));
}
function tbPatchDirty() {
  ['tb-dirty', 'tb-dirty-bottom'].forEach(id => { const d = document.getElementById(id); if (d) d.textContent = _tb.dirty ? 'Unsaved changes' : ''; });
  const f = document.getElementById('tb-railfoot'); if (f) f.innerHTML = tbFootHtml();
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
  document.getElementById('tb-save-bottom')?.addEventListener('click', () => tbSave());
  document.getElementById('tb-publish-bottom')?.addEventListener('click', () => tbPublish());
  if (!_tbResizeBound && typeof window !== 'undefined' && typeof window.addEventListener === 'function') { _tbResizeBound = true; window.addEventListener('resize', tbOnResize); }
  _tb._fits = tbRailFits();

  /* ---- THE PAPER ---- */
  const paper = document.getElementById('tb-paperslot');
  paper?.addEventListener('click', e => {
    const el = e.target.closest ? e.target : null; if (!el) return;
    const hit = sel => el.closest(sel);
    let b;
    if ((b = hit('[data-tb-tag]'))) { tbFocus(Number(b.getAttribute('data-tb-tag')), { ask: true }); return; }
    if ((b = hit('[data-tb-up]'))) { tbMove(Number(b.getAttribute('data-tb-up')), -1); return; }
    if ((b = hit('[data-tb-down]'))) { tbMove(Number(b.getAttribute('data-tb-down')), +1); return; }
    if ((b = hit('[data-tb-del]'))) { _tb.blocks.splice(Number(b.getAttribute('data-tb-del')), 1); _tb.dirty = true; tbPaint(); return; }
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
  });
  paper?.addEventListener('input', e => {
    const i = tbBlockOf(e.target); if (i < 0) return;
    const el = e.target.closest('[data-tb-content]');
    _tb.blocks[i].content = tbReadEditable(el);
    _tb.dirty = true;
    tbPatchDirty();
    const sec = el.closest('[data-tb-sec]');
    if (sec) { const s = tbSectionAt(Number(sec.getAttribute('data-tb-sec'))); if (s) sec.classList.toggle('is-empty', !tbSectionText(s)); }
    if (el.getAttribute('data-tb-kind') === 'heading') tbPaintScope();
  });
  paper?.addEventListener('focusout', e => {
    const i = tbBlockOf(e.target); if (i < 0) return;
    const el = e.target.closest('[data-tb-content]');
    /* Leaving a block draws its chips again; the caret has gone, so nothing
       is lost by rebuilding the words. Chips flip the paper's state dot too. */
    if (el.getAttribute('data-tb-kind') === 'text') el.innerHTML = tbChipsHtml(_tb.blocks[i].content);
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
      _tb.fields.splice(i, 1); _tb.dirty = true; tbPaint(); return;
    }
    if (hit('#tb-addfield')) { tbFieldModal(null); }
  });
  rail?.addEventListener('change', e => {
    const b = e.target.closest ? e.target.closest('[data-tb-out]') : null;
    if (b) { const x = _tb.outline && _tb.outline.sections[Number(b.getAttribute('data-tb-out'))]; if (x) { x.on = b.checked; tbPaintRail(); } }
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
  _tb.dirty = true; tbPaint();
}

function tbLeave() {
  const go = () => openTemplateLibDetail(_tb.tid);
  if (!_tb.dirty) return go();
  (typeof confirmDialog === 'function'
    ? confirmDialog({ get title(){ return i18t('tb_leave_without_saving'); }, message: 'The edits since your last save will be lost.', confirmLabel: 'Leave', danger: true })
    : Promise.resolve(true)).then(ok => { if (ok) go(); });
}

async function tbSave(quiet) {
  try {
    await api(`templates/${_tb.tid}/versions/${_tb.vid}`, 'PUT', {
      blocks: _tb.blocks.map((b, i) => ({ orderIndex: i, blockType: b.blockType, content: b.content })),
      fields: _tb.fields.map((f, i) => ({ ...f, orderIndex: i, humanReviewed: true })),
    });
    _tb.dirty = false;
    if (!quiet) { toast(i18t('tb_draft_saved')); const d = document.getElementById('tb-dirty'); if (d) d.textContent = ''; }
    return true;
  } catch (e) { toast(e.message, 'err'); return false; }
}

/* Publish goes THROUGH the Design step — never around it (decision 2 in
   DESIGN-contract-designer.md). The step carries the change-note field and
   the publish call; with a company default already saved it opens
   pre-dressed and Publish is one click. */
async function tbPublish() {
  if (!await tbSave(true)) return;
  openDesignStep({
    mode: 'publish',
    tid: _tb.tid, vid: _tb.vid, versionNumber: _tb.versionNumber,
    templateName: _tb.template.name,
    form: {
      blocks: _tb.blocks.map((b, i) => ({ orderIndex: i, blockType: b.blockType, content: b.content })),
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
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 10px;font:inherit;font-size:var(--t-body);outline:none';
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
        <textarea id="tbf-options" style="${INP};min-height:64px">${esc(f.options.join('\n'))}</textarea></label>
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
    _tb.dirty = true; closeModal(); tbPaint();
  });
}

/* ---------- branding panel (org-level, rendered on every template) ---------- */
async function tbPaintBranding() {
  const host = document.getElementById('tb-branding');
  if (!host) return;
  let b = null;
  try { b = (await api('org/branding')).branding; } catch (_) {}
  b = b || { logoUrl: null, companyName: '', registrationNumber: '', address: '', defaultFooterText: '' };
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 10px;font:inherit;font-size:var(--t-body);outline:none';
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
        <button id="tb-logo-btn" class="ui-btn" style="font-size:var(--t-label);padding:3px 9px">${icon('upload', 'w-3 h-3')} ${b.logoUrl ? 'Replace logo' : 'Upload logo'}</button>
      </div>
      <div style="min-width:260px;flex:1;display:grid;grid-template-columns:1fr 1fr;gap:var(--s-2)">
        <input id="tb-b-name" style="${INP}" placeholder="${i18t('tb_company_name')}" value="${esc(b.companyName)}">
        <input id="tb-b-reg" style="${INP}" placeholder="${i18t('tb_reg_number')}" value="${esc(b.registrationNumber)}">
        <input id="tb-b-addr" style="${INP};grid-column:1/-1" placeholder="${i18t('tb_reg_address')}" value="${esc(b.address)}">
        <input id="tb-b-footer" style="${INP};grid-column:1/-1" placeholder="Footer text (e.g. Registered in ${jxName()} · C.123456)" value="${esc(b.defaultFooterText)}">
        <div style="grid-column:1/-1;display:flex;justify-content:flex-end">
          <button id="tb-b-save" class="ui-btn" style="font-size:var(--t-label);padding:var(--s-1) 11px">${i18t('tb_save_branding')}</button>
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
Object.assign(window, { openTemplateBuilder, TB_BLOCK_META, TB_PB_KEY, TB_ASK_MAX, TB_BLANK_TYPE, TB_RAIL_MIN, TB_CHIP_ASK,
  tbSections, tbSectionText, tbKindOf, tbLibraryFor, tbCoverage, tbPbKey, tbStandardFor, tbPrecedentFor,
  tbFocus, tbSetTab, tbRailFits, tbNextEmpty, tbQuestionFor, tbChipsHtml, tbReadEditable, tbPaint, tbPaintRail, tbSend, tbAccept, tbOutlineAdd, tbTurn, tbSetWalk });
