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
    seq: v.blocks.length, ask: {}, ans: {}, outline: null, said: '', reads: 0,
  };
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

/* ---- THE OUTLINE: headings only, and nothing is created until you press ---- */
async function tbOutlineRun() {
  const box = document.getElementById('tb-brief-in');
  const said = box ? box.value.trim() : '';
  if (!said) { toast(i18t('tb_pb_say_first'), 'err'); return; }
  _tb.outline = { busy: true }; tbPaint();
  /* The playbook's own required categories go out as "do not propose these" and
     come back added by HaTi, marked. "Your playbook requires this" is a fact
     read off the stored book, never a claim the model makes. */
  const cov = tbCoverage();
  const required = cov ? cov.rows.map(r => r.category) : [];
  try {
    const d = await api('ai/outline', 'POST', { sentence: said, kind: (_tb.template && _tb.template.category) || '', required });
    _tb.reads++;
    const mine = (cov ? cov.rows : []).filter(r => r.state === 'open')
      .map(r => ({ heading: r.category, intent: r.note || '', playbook: true, on: true }));
    _tb.outline = { said, note: d.note || '',
      sections: (d.sections || []).map(x => ({ heading: x.heading, intent: x.intent || '', on: true })).concat(mine) };
    _tb.said = said;
  } catch (e) { _tb.outline = { said, error: tbSay(e) }; }
  tbPaint();
}
function tbOutlineAdd() {
  const list = (_tb.outline && _tb.outline.sections || []).filter(x => x.on);
  if (!list.length) { toast(i18t('tb_pb_none_ticked'), 'err'); return; }
  list.forEach(x => { tbAddBlock('heading', x.heading); tbAddBlock('field_group', ''); });
  _tb.outline = null;
  toast(i18tn('tb_pb_added', list.length, { n: list.length }));
  tbPaint();
}

/* ---- YOUR OWN WORDING, AT NO COST ----
   Pressed from the library chip. No route is called and nothing is spent: the
   card is built from the workspace's own clause library and says so. */
function tbUseLibrary(k) {
  const sec = tbSectionAt(k); if (!sec) return;
  const lib = tbLibraryFor(sec.head); if (!lib) return;
  _tb.ans[k] = { src: i18t('tb_pb_src_lib'), tone: 'steel', free: true, text: lib.preferred,
    rests: i18t('tb_pb_rests_lib', { name: lib.name }), asked: '' };
  tbPaint();
}

/* ---- COPILOT DRAFTS THIS SECTION ----
   Through copilotPropose in template mode — the product's own drafting call.
   It is shown the workspace's own wording, its playbook position and any figure
   it has actually settled, and asked to say which it kept. */
async function tbDraft(k) {
  const sec = tbSectionAt(k); if (!sec) return;
  const box = document.getElementById('tb-ask-' + k);
  const said = box ? box.value.trim().slice(0, TB_ASK_MAX) : '';
  if (!said) { toast(i18t('tb_pb_say_first'), 'err'); return; }
  if (!window.copilotPropose) { _tb.ans[k] = { error: i18t('tb_pb_nokey') }; tbPaint(); return; }
  _tb.ask[k] = said;
  _tb.ans[k] = { busy: true }; tbPaint();
  const lib = tbLibraryFor(sec.head);
  try {
    const made = await copilotPropose({
      template: true, heading: sec.head, instruction: said,
      kind: (_tb.template && _tb.template.category) || '',
      party: (window.ORG_BRANDING && ORG_BRANDING.companyName) || '',
      passage: tbSectionText(sec),
      library: lib ? lib.preferred : '',
      standard: tbStandardFor(sec.head) || '',
      precedent: tbPrecedentFor(sec.head) || '',
    });
    _tb.reads++;
    if (!made) { _tb.ans[k] = { error: i18t('tb_pb_unreadable'), asked: said }; tbPaint(); return; }
    if (!String(made.proposedText || '').trim()) {
      /* AN ANSWER IS NOT WORDING. AI_PROPOSAL_FORMAT asks for an empty
         proposedText where the model cannot draft from what it was shown, so
         this branch is the honest one, not an error: what it said is printed
         and nothing is filed. */
      _tb.ans[k] = { answered: String(made.advice || '').trim() || i18t('tb_pb_no_wording'), asked: said };
      tbPaint(); return;
    }
    _tb.ans[k] = { src: lib ? i18t('tb_pb_src_lib') : i18t('tb_pb_src_ai'), tone: lib ? 'steel' : '',
      text: String(made.proposedText).trim(), asked: said,
      rests: String(made.advice || '').trim(), read: _tb.reads };
  } catch (e) { _tb.ans[k] = { error: tbSay(e), asked: said }; }
  tbPaint();
}

/* ---- USE THIS: the one press that moves wording into the record ----
   It writes the SAME block content a keystroke writes — no second writer — and
   then asks the blanks reader what should be a blank. */
async function tbAccept(k) {
  const sec = tbSectionAt(k); const a = _tb.ans[k];
  if (!sec || !a || !a.text) return;
  const bi = tbWordingBlock(sec);
  _tb.blocks[bi].content = a.text;
  _tb.dirty = true;
  delete _tb.ans[k]; delete _tb.ask[k];
  tbPaint();
  tbBlanksRun(k, a.text);
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
const TB_ASKBOX = 'width:100%;border:0;background:transparent;font:inherit;font-size:var(--t-meta);line-height:1.5;padding:8px 10px;resize:none;outline:none;color:var(--color-text)';

/* THE OPENING ASK — drawn on an EMPTY template only (the owner's ruling,
   12 Sep 2026), and folded to one quiet line the moment it is answered. */
function tbBriefHtml() {
  if (_tb.blocks.length && !_tb.outline) {
    return _tb.said ? `<div style="display:flex;gap:9px;align-items:flex-start;padding:10px 14px;border-bottom:1px solid var(--color-divider);background:var(--surface-2)">
      <span style="font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5">${i18t('tb_pb_building')} <i style="font-style:normal;color:var(--color-text)">“${esc(_tb.said)}”</i></span></div>` : '';
  }
  const o = _tb.outline;
  if (o && o.busy) return `<div style="padding:14px;border-bottom:1px solid var(--color-divider);background:var(--surface-2);font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('tb_pb_thinking')}</div>`;
  if (o && o.error) return `<div style="padding:12px 14px;border-bottom:1px solid var(--color-divider);background:var(--st-amber-bg);color:var(--st-amber-fg);font-size:var(--t-meta);line-height:1.5">${esc(o.error)}
    <button data-tb-brief-again class="ui-btn" style="margin-left:8px;font-size:var(--t-label);padding:2px 9px">${i18t('tb_pb_try_again')}</button></div>`;
  if (o && o.sections) {
    const rows = o.sections.map((x, n) => `
      <label style="display:flex;gap:10px;padding:8px 14px;border-bottom:1px solid var(--color-divider);align-items:flex-start;cursor:pointer">
        <input type="checkbox" data-tb-out="${n}" ${x.on ? 'checked' : ''} style="margin-top:3px">
        <span style="min-width:0;flex:1">
          <span style="display:flex;align-items:center;gap:7px;flex-wrap:wrap"><b style="font-size:var(--t-meta)">${esc(x.heading)}</b>${x.playbook ? TB_TAG(i18t('tb_pb_from_playbook'), 'steel') : ''}</span>
          ${x.intent ? `<span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.45">${esc(x.intent)}</span>` : ''}
        </span></label>`).join('');
    const n = o.sections.filter(x => x.on).length;
    return `<div style="border-bottom:1px solid var(--color-divider)">
      <div style="padding:11px 14px;background:var(--surface-2)">
        <b style="font-size:var(--t-meta)">${i18tn('tb_pb_proposed_n', o.sections.length, { n: o.sections.length })}</b>
        <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${esc(o.note || '')}</span></div>
      ${rows}
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface-2);flex-wrap:wrap">
        <button data-tb-out-add class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:4px 12px" ${n ? '' : 'disabled'}>${i18tn('tb_pb_add_n', n, { n })}</button>
        <button data-tb-brief-again class="ui-btn" style="font-size:var(--t-meta);padding:4px 11px">${i18t('tb_pb_start_again')}</button>
        <span style="flex:1"></span>
        <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('tb_pb_headings_only')}</span></div></div>`;
  }
  return `<div style="display:flex;gap:11px;padding:13px 14px;border-bottom:1px solid var(--color-divider);background:var(--surface-2);align-items:flex-start">
    <span style="flex:1;min-width:0">
      <b style="display:block;font-size:var(--t-body);margin-bottom:7px">${i18t('tb_pb_describe')}</b>
      <span style="display:flex;align-items:center;gap:8px;border:1px solid var(--color-accent);box-shadow:0 0 0 2px var(--st-steel-bg);border-radius:var(--radius);background:var(--color-surface)">
        <textarea id="tb-brief-in" rows="1" maxlength="${TB_ASK_MAX}" placeholder="${i18t('tb_pb_ph_brief')}" style="${TB_ASKBOX};height:34px"></textarea>
        <button data-tb-brief class="ui-btn ui-btn-primary" style="flex:none;margin-right:6px;font-size:var(--t-meta);padding:4px 12px">${i18t('tb_pb_propose')}</button></span>
      <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5;margin-top:7px">${i18t('tb_pb_no_wording_yet')}</span>
    </span></div>`;
}

/* THE ASK BOX, ON THE SECTION IT BELONGS TO. Drawn under a heading block's own
   editor, so the flat block list above it is untouched. */
function tbSectionHtml(b, i) {
  const k = b._k, sec = tbSections().find(x => x.k === k);
  if (!sec) return '';
  const a = _tb.ans[k];
  if (a && a.busy) return `<div style="margin-top:8px;font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('tb_pb_thinking')}</div>`;
  if (a && a.error) return `<div style="margin-top:8px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);color:var(--st-amber-fg);border-radius:var(--radius);padding:7px 10px;font-size:var(--t-label);line-height:1.5">${esc(a.error)}</div>`;
  if (a && a.answered) return `<div style="margin-top:8px;border:1px solid var(--color-divider);background:var(--surface-2);border-radius:var(--radius);padding:8px 10px;font-size:var(--t-label);line-height:1.55;color:var(--color-neutral-600)">
    <b style="color:var(--color-text)">${i18t('tb_pb_no_wording')}</b> ${esc(a.answered)}
    <span style="display:block;margin-top:6px"><button data-tb-clear="${k}" class="ui-btn" style="font-size:var(--t-label);padding:2px 9px">${i18t('tb_pb_try_again')}</button></span></div>`;
  if (a && a.text) {
    const dev = a.verdict && a.verdict.tone === 'amber';
    return `<div style="margin-top:8px;border:1px solid ${dev ? 'var(--st-amber-line)' : 'var(--st-steel-line)'};border-left:3px solid ${dev ? 'var(--st-amber-fg)' : 'var(--color-accent)'};background:var(--color-surface);border-radius:var(--radius);padding:9px 11px">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:7px">${TB_TAG(a.src, a.tone)}
        <span style="flex:1"></span>${TB_TAG(a.free ? i18t('tb_pb_no_read_short') : i18t('tb_pb_read_n', { n: a.read || _tb.reads }), '')}</div>
      ${a.asked ? `<div style="font-size:var(--t-label);color:var(--color-neutral-500);font-style:italic;margin-bottom:7px">${i18t('tb_pb_asked', { q: esc(a.asked) })}</div>` : ''}
      <div style="font-size:var(--t-meta);line-height:1.7;white-space:pre-wrap">${esc(a.text)}</div>
      ${a.rests ? `<div style="margin-top:8px;padding-top:7px;border-top:1px solid var(--color-divider);font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.55">${esc(a.rests)}</div>` : ''}
      <div style="display:flex;gap:15px;align-items:center;margin-top:9px;padding-top:8px;border-top:1px solid var(--color-divider)">
        <button data-tb-use="${k}" style="background:none;border:0;padding:0;font:inherit;font-size:var(--t-meta);font-weight:var(--w-title);color:var(--accent-ink);cursor:pointer">${i18t('tb_pb_use')}</button>
        <button data-tb-ask="${k}" style="background:none;border:0;padding:0;font:inherit;font-size:var(--t-meta);color:var(--color-neutral-600);cursor:pointer">${i18t('tb_pb_try_again')}</button>
        <button data-tb-clear="${k}" style="background:none;border:0;padding:0;font:inherit;font-size:var(--t-meta);color:var(--color-neutral-600);cursor:pointer">${i18t('tb_pb_mine')}</button>
      </div></div>`;
  }
  /* Nothing waiting. A section that already carries wording says what it rests
     on and stops; an empty one gets the box. */
  if (tbSectionText(sec)) return '';
  if (!(typeof copilotAvailable === 'function' && copilotAvailable()))
    return `<div style="margin-top:8px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);color:var(--st-amber-fg);border-radius:var(--radius);padding:7px 10px;font-size:var(--t-label);line-height:1.5">${i18t(sec.body.length ? 'tb_pb_nokey' : 'tb_pb_nokey_empty')}</div>`;
  const lib = tbLibraryFor(sec.head);
  return `<div style="margin-top:8px;border:1px solid var(--field-line);border-radius:var(--radius);background:var(--surface-2)">
    <div style="display:flex;align-items:center;gap:8px">
      <textarea id="tb-ask-${k}" data-tb-ask-in="${k}" rows="1" maxlength="${TB_ASK_MAX}" placeholder="${i18t('tb_pb_ask_ph')}" style="${TB_ASKBOX};height:34px">${esc(_tb.ask[k] || '')}</textarea>
      <button data-tb-ask="${k}" class="ui-btn ui-btn-primary" style="flex:none;margin-right:6px;font-size:var(--t-label);padding:3px 10px">${i18t('tb_pb_draft')}</button></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:0 10px 8px">
      ${lib ? `<button data-tb-lib="${k}" class="ui-btn" style="font-size:var(--t-label);padding:2px 9px;font-weight:var(--w-body)">${i18t('tb_pb_use_ours', { name: esc(lib.name) })}</button>` : ''}
      <span style="flex:1"></span>
      <span style="font-size:var(--t-micro);color:var(--color-neutral-500)">${lib ? i18t('tb_pb_no_read') : i18t('tb_pb_one_read')}</span></div></div>`;
}

/* AGAINST YOUR PLAYBOOK — a count in the card head and a card of its own.
   No band, no strip: the fact lives where the work is (the Six Questions, Q2). */
function tbCoverPill() {
  const c = tbCoverage(); if (!c || !c.total) return '';
  const pips = c.rows.map(r => `<i style="width:9px;height:4px;display:block;background:${r.state === 'dev' ? 'var(--st-amber-dot)' : r.state === 'hit' ? 'var(--color-accent)' : 'var(--color-divider)'}"></i>`).join('');
  return `<span style="display:inline-flex;align-items:center;gap:8px;font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('tb_pb_playbook')}
    <b style="color:var(--color-text);font-weight:var(--w-strong)">${i18t('tb_pb_covered', { n: c.covered, m: c.total })}</b>
    <span style="display:inline-flex;gap:2px;align-items:center">${pips}</span></span>`;
}
function tbCoverageHtml() {
  const c = tbCoverage(); if (!c || !c.total) return '';
  const rows = c.rows.map(r => {
    const mark = r.state === 'dev' ? '!' : r.state === 'hit' ? '✓' : '○';
    const ink = r.state === 'dev' ? 'var(--st-amber-fg)' : r.state === 'hit' ? 'var(--color-accent)' : 'var(--color-neutral-500)';
    const right = r.state === 'open'
      ? `<button data-tb-cover-add="${esc(r.category)}" style="background:none;border:0;padding:0;font:inherit;font-size:var(--t-label);font-weight:var(--w-title);color:var(--accent-ink);cursor:pointer;white-space:nowrap">${i18t('tb_pb_add_section')}</button>`
      : `<span style="font-size:var(--t-label);color:${r.state === 'dev' ? 'var(--st-amber-fg)' : 'var(--color-neutral-500)'};white-space:nowrap">${esc(r.where && r.where.head ? r.where.head : '')}</span>`;
    const why = r.state === 'dev'
      ? i18t('tb_pb_dev_note', { n: r.figure, want: r.want, note: r.note || '' })
      : (r.note || '');
    return `<div style="display:flex;gap:9px;align-items:flex-start;padding:8px 14px;border-bottom:1px solid var(--color-divider)">
      <span style="flex:none;width:14px;text-align:center;font-size:var(--t-meta);color:${ink}">${mark}</span>
      <span style="flex:1;min-width:0">
        <b style="display:block;font-size:var(--t-label);color:${r.state === 'dev' ? 'var(--st-amber-fg)' : 'var(--color-text)'}">${esc(r.category)}${r.escalate ? ' · ' + i18t('tb_pb_legal') : ''}</b>
        ${why ? `<span style="display:block;font-size:var(--t-micro);color:var(--color-neutral-600);line-height:1.45">${esc(why)}</span>` : ''}</span>
      ${right}</div>`;
  }).join('');
  return `<section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius)">
    <div style="display:flex;align-items:center;gap:10px;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--color-divider)">
      <h4 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-card);margin:0">${i18t('tb_pb_cover_head')}</h4>
      <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${esc(c.label)}</span>
      <span style="flex:1"></span>
      <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('tb_pb_covered', { n: c.covered, m: c.total })}</span></div>
    ${rows}
    <div style="padding:10px 14px;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5">${i18t('tb_pb_cover_foot')}${_tb.reads ? ' · ' + i18tn('tb_pb_reads', _tb.reads, { n: _tb.reads }) : ''}</div>
  </section>`;
}

/* Proposed blanks sit ABOVE the kept ones and are held outside _tb.fields, so
   nothing a person has not kept can ride a save. */
function tbProposedHtml() {
  const list = _tb.proposed || []; if (!list.length) return '';
  return list.map((p, i) => `
    <div style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-2) 14px;border-bottom:1px solid var(--color-divider);background:var(--surface-2)">
      <span style="min-width:0;flex:1">
        <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><b style="font-size:var(--t-meta)">${esc(p.label)}</b>${TB_TAG(i18t('tb_pb_proposed'), 'steel')}</span>
        <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);font-family:var(--font-mono)">{{${esc(p.key)}}} · ${esc((window.FIELD_LIB && FIELD_LIB[p.type] && FIELD_LIB[p.type].label) || p.type)}${p.maps ? ' · → ' + esc(p.maps) : ''}</span>
      </span>
      <button data-tb-keep="${i}" class="ui-btn" style="font-size:var(--t-label);padding:2px var(--s-2)">${i18t('tb_pb_keep')}</button>
      <button data-tb-drop="${i}" class="ui-btn" style="font-size:var(--t-label);padding:2px 7px;border-color:var(--st-ruby-line);color:var(--st-ruby-fg)">${i18t('tb_pb_not_blank')}</button>
    </div>`).join('');
}

function tbKeyFromLabel(label) {
  const base = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^([0-9])/, 'f$1').slice(0, 64) || 'field';
  let key = base, n = 2;
  while (_tb.fields.some(f => f.fieldKey === key)) key = base + '_' + (n++);
  return key;
}
const tbPlaceholderUse = key => _tb.blocks.filter(b => b.content.includes(`{{${key}}}`)).length;

function tbPaint() {
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius)';
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 10px;font:inherit;font-size:var(--t-body);outline:none';
  const t = _tb.template;

  const blockRows = _tb.blocks.map((b, i) => {
    const meta = TB_BLOCK_META[b.blockType] || TB_BLOCK_META.fixed_text;
    const editor = b.blockType === 'branding'
      ? `<div style="font-size:var(--t-label);color:var(--color-neutral-600);padding:6px 0">${i18t('tb_logo_renders')}</div>`
      : b.blockType === 'signature_block'
        ? `<input data-tb-content="${i}" value="${esc(b.content)}" placeholder="${i18t('tb_who_signs')}" style="${INP}">`
        : `<textarea data-tb-content="${i}" style="${INP};min-height:${b.blockType === 'heading' ? 34 : 64}px;resize:vertical" placeholder="${b.blockType === 'heading' ? 'Section title' : 'Wording — use {{field_key}} where a blank sits'}">${esc(b.content)}</textarea>`;
    return `
    <div style="display:flex;gap:var(--s-2);padding:10px 14px;border-bottom:1px solid var(--color-divider);align-items:flex-start" data-tb-row="${i}">
      <div style="flex:none;display:flex;flex-direction:column;gap:2px;padding-top:2px">
        <button data-tb-up="${i}" class="ui-btn" style="padding:1px 6px;font-size:var(--t-label)" ${i === 0 ? 'disabled' : ''} title="${i18t('tb_move_up')}">↑</button>
        <button data-tb-down="${i}" class="ui-btn" style="padding:1px 6px;font-size:var(--t-label)" ${i === _tb.blocks.length - 1 ? 'disabled' : ''} title="${i18t('tb_move_down')}">↓</button>
      </div>
      <div style="min-width:0;flex:1">
        <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:5px">
          <span class="badge" style="background:var(--color-neutral-100);color:var(--color-neutral-600)" title="${esc(meta.tip)}">${meta.label}</span>
          ${b.blockType === 'field_group' && !/\{\{[a-z0-9_]+\}\}/.test(b.content) ? `<span style="font-size:var(--t-label);color:var(--st-amber-fg)">no {{placeholder}} yet</span>` : ''}
          <span style="flex:1"></span>
          <button data-tb-del="${i}" class="ui-btn" style="padding:2px 7px;font-size:var(--t-label);border-color:var(--st-ruby-line);color:var(--st-ruby-fg)" title="${i18t('tb_remove_block')}">${icon('x', 'w-3 h-3')}</button>
        </div>
        ${editor}${b.blockType === 'heading' ? tbSectionHtml(b, i) : ''}
      </div>
    </div>`;
  }).join('');

  const fieldRows = _tb.fields.map((f, i) => {
    const lib = (window.FIELD_LIB || {})[f.fieldType] || { label: f.fieldType };
    const uses = tbPlaceholderUse(f.fieldKey);
    const conf = f.detectionConfidence !== 'manual' && !f.humanReviewed
      ? `<span class="badge" style="background:${f.detectionConfidence === 'low' ? '#fbeaea' : '#fdf3e2'};color:${f.detectionConfidence === 'low' ? 'var(--st-ruby-fg)' : 'var(--st-amber-fg)'}" title="${i18t('tb_detected_unreviewed')}">${f.detectionConfidence} confidence</span>` : '';
    return `
    <div style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-2) 14px;border-bottom:1px solid var(--color-divider)">
      <span style="min-width:0;flex:1">
        <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <b style="font-size:var(--t-meta)">${esc(f.label || f.fieldKey)}</b>
          ${f.required ? '<span style="color:var(--st-ruby-fg);font-size:var(--t-label)" title="Required">*</span>' : ''}
          ${conf}
        </span>
        <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);font-family:var(--font-mono)">{{${esc(f.fieldKey)}}} · ${esc(lib.label)}${f.control === 'guided' ? ` · guided (${f.options.length})` : ''}${f.defaultValue ? ' · default set' : ''} · ${uses ? `in ${uses} block${uses === 1 ? '' : 's'}` : '<span style="color:var(--st-amber-fg)">unplaced</span>'}</span>
      </span>
      <button data-tb-fcopy="${i}" class="ui-btn" style="font-size:var(--t-label);padding:2px var(--s-2)" title="${i18t('tb_copy_placeholder')}">${icon('copy', 'w-3 h-3')}</button>
      <button data-tb-fedit="${i}" class="ui-btn" style="font-size:var(--t-label);padding:2px var(--s-2)">${i18t('act_edit')}</button>
      <button data-tb-fdel="${i}" class="ui-btn" style="font-size:var(--t-label);padding:2px 7px;border-color:var(--st-ruby-line);color:var(--st-ruby-fg)">${icon('x', 'w-3 h-3')}</button>
    </div>`;
  }).join('');

  const proposedRows = tbProposedHtml();
  document.getElementById('content').innerHTML = `
  <div class="view-enter" style="padding:var(--page-pad);display:flex;flex-direction:column;gap:14px;max-width:980px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <button id="tb-back" class="ui-btn" style="font-size:var(--t-meta);padding:var(--s-1) 10px">${icon('arrowLeft', 'w-3.5 h-3.5')} ${esc(t.name)}</button>
      <span style="font-family:var(--font-mono);font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--st-steel-fg);border:1px solid var(--st-steel-line);background:var(--st-steel-bg);border-radius:var(--radius);padding:1px 7px">${i18t('tb_v_draft',{n:_tb.versionNumber})}</span>
      <span id="tb-dirty" style="font-size:var(--t-label);color:var(--color-neutral-500)">${_tb.dirty ? 'Unsaved changes' : ''}</span>
      <span style="flex:1"></span>
      <button id="tb-save" class="ui-btn" style="font-size:var(--t-meta);padding:5px 13px">${icon('check2', 'w-3.5 h-3.5')} ${i18t('tb_save_draft')}</button>
      <button id="tb-publish" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:5px 13px">Publish v${_tb.versionNumber}</button>
    </div>

    <section style="${CARD}">
      <div style="display:flex;align-items:center;gap:10px;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-card);margin:0">${i18t('tb_document_blocks')}</h4>
        <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${i18t('tb_in_order')}</span>
        <span style="flex:1"></span>
        ${tbCoverPill()}
        <select id="tb-addtype" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:var(--s-1) var(--s-2);font:inherit;font-size:var(--t-meta)">
          ${Object.entries(TB_BLOCK_META).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('')}
        </select>
        <button id="tb-addblock" class="ui-btn" style="font-size:var(--t-meta);padding:var(--s-1) 10px">${icon('plus', 'w-3 h-3')} ${i18t('tb_add_block')}</button>
      </div>
      ${tbBriefHtml()}
      ${blockRows || `<div style="padding:26px;text-align:center;color:var(--color-neutral-500);font-size:var(--t-meta)">${i18t('tb_no_blocks')}</div>`}
    </section>

    <section style="${CARD}">
      <div style="display:flex;align-items:center;gap:10px;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-card);margin:0">${i18t('tb_fields')}</h4>
        <span style="font-size:var(--t-label);color:var(--color-neutral-600)">the blanks a contract creator fills — place them in wording as {{field_key}}</span>
        <span style="flex:1"></span>
        <button id="tb-addfield" class="ui-btn" style="font-size:var(--t-meta);padding:var(--s-1) 10px">${icon('plus', 'w-3 h-3')} ${i18t('tl_add_field')}</button>
      </div>
      ${proposedRows}
      ${(proposedRows || fieldRows) ? fieldRows : `<div style="padding:26px;text-align:center;color:var(--color-neutral-500);font-size:var(--t-meta)">${i18t('tb_no_fields')}</div>`}
    </section>

    ${tbCoverageHtml()}

    <section style="${CARD};padding:14px var(--s-4)" id="tb-branding"></section>

    <!-- The same two verbs again at the foot: on a long template the top bar
         is screens away by the time the last block is written, and a save
         that requires scrolling back up is a save that gets skipped. -->
    <div style="display:flex;align-items:center;gap:10px;justify-content:flex-end;padding-top:2px">
      <span id="tb-dirty-bottom" style="font-size:var(--t-label);color:var(--color-neutral-500)">${_tb.dirty ? 'Unsaved changes' : ''}</span>
      <button id="tb-save-bottom" class="ui-btn" style="font-size:var(--t-meta);padding:5px 13px">${icon('check2', 'w-3.5 h-3.5')} ${i18t('tb_save_draft')}</button>
      <button id="tb-publish-bottom" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:5px 13px">Publish v${_tb.versionNumber}</button>
    </div>
  </div>`;

  document.getElementById('tb-back')?.addEventListener('click', () => tbLeave());
  document.getElementById('tb-save')?.addEventListener('click', () => tbSave());
  document.getElementById('tb-publish')?.addEventListener('click', () => tbPublish());
  document.getElementById('tb-save-bottom')?.addEventListener('click', () => tbSave());
  document.getElementById('tb-publish-bottom')?.addEventListener('click', () => tbPublish());
  document.getElementById('tb-addblock')?.addEventListener('click', () => {
    if (tbAddBlock(document.getElementById('tb-addtype').value)) tbPaint();
  });
  document.getElementById('tb-addfield')?.addEventListener('click', () => tbFieldModal(null));
  document.querySelectorAll('[data-tb-content]').forEach(el => el.addEventListener('input', () => {
    _tb.blocks[Number(el.getAttribute('data-tb-content'))].content = el.value;
    _tb.dirty = true;
    const d = document.getElementById('tb-dirty'); if (d) d.textContent = 'Unsaved changes';
  }));
  document.querySelectorAll('[data-tb-up]').forEach(el => el.addEventListener('click', () => tbMove(Number(el.getAttribute('data-tb-up')), -1)));
  document.querySelectorAll('[data-tb-down]').forEach(el => el.addEventListener('click', () => tbMove(Number(el.getAttribute('data-tb-down')), +1)));
  document.querySelectorAll('[data-tb-del]').forEach(el => el.addEventListener('click', () => {
    _tb.blocks.splice(Number(el.getAttribute('data-tb-del')), 1); _tb.dirty = true; tbPaint();
  }));
  document.querySelectorAll('[data-tb-fedit]').forEach(el => el.addEventListener('click', () => tbFieldModal(Number(el.getAttribute('data-tb-fedit')))));
  document.querySelectorAll('[data-tb-fcopy]').forEach(el => el.addEventListener('click', () => {
    const f = _tb.fields[Number(el.getAttribute('data-tb-fcopy'))];
    const ph = `{{${f.fieldKey}}}`;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ph);
    toast(`${ph} copied — paste it into a wording block`,'ok');
  }));
  document.querySelectorAll('[data-tb-fdel]').forEach(el => el.addEventListener('click', async () => {
    const i = Number(el.getAttribute('data-tb-fdel'));
    const f = _tb.fields[i];
    const uses = tbPlaceholderUse(f.fieldKey);
    if (uses) {
      const ok = typeof confirmDialog === 'function'
        ? await confirmDialog({ title: `Remove “${f.label || f.fieldKey}”?`, message: `Its marker sits in ${uses} block${uses === 1 ? '' : 's'} of wording — deleting the field replaces the marker with a plain blank there.`, confirmLabel: 'Remove field', danger: true })
        : true;
      if (!ok) return;
      // the marker goes with the field — orphaned {{code}} never reaches a contract
      if (window.templateFormStripMarker)
        _tb.blocks = _tb.blocks.map(b => ({ ...b, content: templateFormStripMarker(b.content, f.fieldKey) }));
    }
    _tb.fields.splice(i, 1); _tb.dirty = true; tbPaint();
  }));
  tbWirePromptBuild();
  tbPaintBranding();
}

/* Bound per paint, beside every other control on this screen. The ask box's
   own Enter is a press: a section is one short sentence, not a paragraph. */
function tbWirePromptBuild() {
  document.querySelector('[data-tb-brief]')?.addEventListener('click', tbOutlineRun);
  document.getElementById('tb-brief-in')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tbOutlineRun(); }
  });
  document.querySelectorAll('[data-tb-brief-again]').forEach(el =>
    el.addEventListener('click', () => { _tb.outline = null; tbPaint(); }));
  document.querySelectorAll('[data-tb-out]').forEach(el => el.addEventListener('change', () => {
    const x = _tb.outline && _tb.outline.sections[Number(el.getAttribute('data-tb-out'))];
    if (x) { x.on = el.checked; tbPaint(); }
  }));
  document.querySelector('[data-tb-out-add]')?.addEventListener('click', tbOutlineAdd);
  document.querySelectorAll('[data-tb-ask]').forEach(el =>
    el.addEventListener('click', () => tbDraft(Number(el.getAttribute('data-tb-ask')))));
  document.querySelectorAll('[data-tb-lib]').forEach(el =>
    el.addEventListener('click', () => tbUseLibrary(Number(el.getAttribute('data-tb-lib')))));
  document.querySelectorAll('[data-tb-use]').forEach(el =>
    el.addEventListener('click', () => tbAccept(Number(el.getAttribute('data-tb-use')))));
  document.querySelectorAll('[data-tb-clear]').forEach(el => el.addEventListener('click', () => {
    /* Write it myself: the answer goes and the plain textarea is what is left,
       which is the box this screen has always had. */
    delete _tb.ans[Number(el.getAttribute('data-tb-clear'))]; tbPaint();
  }));
  document.querySelectorAll('[data-tb-ask-in]').forEach(el => el.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tbDraft(Number(el.getAttribute('data-tb-ask-in'))); }
  }));
  document.querySelectorAll('[data-tb-keep]').forEach(el =>
    el.addEventListener('click', () => tbKeepBlank(Number(el.getAttribute('data-tb-keep')))));
  document.querySelectorAll('[data-tb-drop]').forEach(el =>
    el.addEventListener('click', () => tbDropBlank(Number(el.getAttribute('data-tb-drop')))));
  document.querySelectorAll('[data-tb-cover-add]').forEach(el => el.addEventListener('click', () => {
    /* The missing position is a DOOR, and it presses the same add act the
       button above does — heading, then one wording block under it. */
    const name = el.getAttribute('data-tb-cover-add');
    tbAddBlock('heading', name); tbAddBlock('field_group', '');
    tbPaint();
  }));
}

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
function tbFieldModal(index) {
  const f = index != null ? { ..._tb.fields[index] } : {
    fieldKey: '', label: '', section: '', fieldType: 'short_text', control: 'free',
    options: [], required: false, defaultValue: '', helpText: '',
    detectionConfidence: 'manual', humanReviewed: true,
  };
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:7px 10px;font:inherit;font-size:var(--t-body);outline:none';
  const types = Object.entries(window.FIELD_LIB || {}).map(([k, v]) =>
    `<option value="${k}"${f.fieldType === k ? ' selected' : ''}>${v.label}</option>`).join('');
  openModal(`
    <div style="padding:20px 22px;max-width:520px">
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
Object.assign(window, { openTemplateBuilder, TB_BLOCK_META, TB_PB_KEY, TB_ASK_MAX, TB_BLANK_TYPE,
  tbSections, tbSectionText, tbKindOf, tbLibraryFor, tbCoverage, tbPbKey, tbStandardFor, tbPrecedentFor });
