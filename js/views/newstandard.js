// HaTi — ONE DOOR TO A STANDARD CONTRACT (Young's go on "One Door to
// Standards", 24 Sep 2026, every decision as recommended).
//
// "+ New standard contract" on the Templates page asks ONE question — how do
// you want to start? — and has three answers. Every answer ends in the same
// builder (js/views/templatebuilder.js), with Copilot's first move waiting:
//   From scratch              → the list of sections, each saying where its
//                               words will come from
//   From a template you have  → the list of likely blanks, unticked
//   From one of our contracts → the check against Our standards
//
// FOUR DOORS USED TO DO THIS, and each copied the words its own way: "Convert
// a document" had Copilot re-type the whole file (a long one ran out of room —
// the owner's SaaS agreement failed there), "Save as template" in a contract's
// menu left every table behind, pasted wording was filed as the OTHER side's
// paper, and "Make it ours" filed a copy under "Other". They are one door now.
//
// NOTHING HERE WRITES WORDING OF ITS OWN. A document is read by the readers
// every uploaded contract already goes through (js/docx.js, the PDF reader,
// the OCR path) and cut into blocks by the one copier (tplFormCopyBlocks,
// js/templateform.js) — every heading, number and table, word for word. A
// contract is copied by its own route. A blank page is an empty template.
//
// THE NAME, CATEGORY AND VALUE STREAM ARE NOT ASKED HERE (decision 5): HaTi
// fills them in from what it already knows, and the builder's head shows them,
// each one press from the Template details box that already exists.

const NS_SAY_MAX = 600;
/* The three answers, in the order the drawing gives them. `k` is stable
   English — it is what a door names when it opens one start directly. */
const NS_STARTS = [
  { k: 'scratch',  ic: 'sparkle', get t(){ return i18t('ns_scratch'); },  get d(){ return i18t('ns_scratch_sub'); } },
  { k: 'template', ic: 'upload',  get t(){ return i18t('ns_template'); }, get d(){ return i18t('ns_template_sub'); } },
  { k: 'contract', ic: 'file',    get t(){ return i18t('ns_contract'); }, get d(){ return i18t('ns_contract_sub'); } },
];
const NS_TABS = ['upload', 'paste', 'hati'];
const nsEsc = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
const nsW = k => ((typeof DLG_W === 'object' && DLG_W) ? DLG_W[k] : null) || ({ s: '400px', m: '520px', l: '640px', xl: '760px' })[k];
const nsApi = () => typeof API_MODE === 'function' && API_MODE();
/* WHO MAY START. Writing a company standard from nothing or from a document is
   new paper (mayMakeNewPaper, 18 Sep 2026). Starting from one of our contracts
   is the route "Save as template" always was, and it keeps its own gate — the
   template manager's — rather than borrowing a narrower one. */
const nsNewPaperOff = () => typeof newPaperBlocked === 'function' && newPaperBlocked();
const NS_GATED = ['scratch', 'template'];

const NS_TITLE = 'font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section);margin:0 0 var(--s-1)';
const NS_LEAD = 'margin:0 0 16px;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.55';
const NS_FLD = 'width:100%;box-sizing:border-box;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:8px 10px;font:inherit;font-size:var(--t-body);outline:none';

/* The dialog's own few rules, emitted once. Every value is a token. */
function nsStyle() {
  if (document.getElementById('ns-style')) return;
  const st = document.createElement('style'); st.id = 'ns-style';
  st.textContent = `
  .ns-tile{display:flex;gap:12px;width:100%;text-align:left;padding:13px 14px;border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:var(--radius);font:inherit;color:var(--color-text);cursor:pointer;margin-bottom:8px}
  .ns-tile:hover,.ns-tile:focus-visible{border-color:var(--accent-solid);box-shadow:inset 0 0 0 1px var(--accent-solid)}
  .ns-tile[disabled]{cursor:not-allowed;opacity:.55;box-shadow:none;border-color:var(--color-divider)}
  .ns-tile .ic{flex:none;width:30px;height:30px;border-radius:var(--radius);display:grid;place-items:center;background:var(--st-steel-bg);color:var(--st-steel-fg)}
  .ns-tile .t{display:block;font-size:var(--t-body);font-weight:var(--w-title)}
  .ns-tile .d{display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5}
  .ns-foot{display:flex;align-items:center;gap:8px;margin-top:16px;flex-wrap:wrap}
  .ns-foot .q{font-size:var(--t-label);color:var(--color-neutral-600)}
  .ns-foot .sp{flex:1}
  .ns-link{border:0;background:none;padding:0;font:inherit;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--accent-ink);cursor:pointer;text-decoration:underline;text-underline-offset:2px}
  .ns-tabs{display:flex;gap:0;border:1px solid var(--color-divider);border-radius:var(--radius);overflow:hidden;margin-bottom:14px}
  .ns-tabs button{flex:1;height:32px;border:0;border-left:1px solid var(--color-divider);background:var(--color-surface);font:inherit;font-size:var(--t-meta);color:var(--color-text);cursor:pointer}
  .ns-tabs button:first-child{border-left:0}
  .ns-tabs button.on{background:var(--accent-fill);color:#fff;font-weight:var(--w-strong)}
  .ns-pane[hidden]{display:none}
  .ns-drop{display:block;border:1px dashed var(--color-neutral-400);border-radius:var(--radius);padding:18px;text-align:center;font-size:var(--t-meta);color:var(--color-neutral-600);cursor:pointer}
  .ns-drop input{display:block;margin:10px auto 0;font-size:var(--t-label)}
  .ns-got{margin-top:12px;border:1px solid var(--color-divider);border-radius:var(--radius);padding:10px 12px;font-size:var(--t-meta);background:var(--color-surface)}
  .ns-got b{font-weight:var(--w-title)}
  .ns-got .ok{color:var(--st-green-fg);font-weight:var(--w-strong);margin-left:6px}
  .ns-got .facts{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
  .ns-got .facts span{font-size:var(--t-label);background:var(--st-steel-bg);color:var(--st-steel-fg);padding:1px 7px;border-radius:var(--radius)}
  .ns-say{min-height:18px;margin-top:8px;font-size:var(--t-label);line-height:1.5;color:var(--color-neutral-600)}
  .ns-say.err{color:var(--st-ruby-fg)}
  .ns-list{max-height:300px;overflow:auto;border:1px solid var(--color-divider);border-radius:var(--radius)}
  .ns-row{display:block;width:100%;text-align:left;padding:9px 12px;border:0;border-top:1px solid var(--color-divider);background:var(--color-surface);font:inherit;color:inherit;cursor:pointer}
  .ns-row:first-child{border-top:0}
  .ns-row:hover{background:var(--color-neutral-100)}
  .ns-row.on{background:var(--st-steel-bg);box-shadow:inset 3px 0 0 var(--accent-solid)}
  .ns-row .n{display:block;font-size:var(--t-body);font-weight:var(--w-strong)}
  .ns-row .s{display:block;font-size:var(--t-label);color:var(--color-neutral-600)}
  .ns-note{margin:10px 0 0;font-size:var(--t-label);color:var(--color-neutral-600)}
  .ns-paste{height:220px;overflow:auto;border:1px solid var(--color-divider);border-radius:0;padding:12px 14px;font-size:var(--t-body);background:var(--color-surface)}`;
  document.head.appendChild(st);
}

/* ═══════════════════════════ THE ONE QUESTION ═══════════════════════════ */
function openNewStandard(opts = {}) {
  if (opts.start && NS_STARTS.some(s => s.k === opts.start)) return nsGo(opts.start, opts);
  nsStyle();
  const off = nsNewPaperOff();
  const why = off ? i18t('np_refused_ask') : '';
  const tile = sc => {
    const dead = off && NS_GATED.includes(sc.k);
    return `<button type="button" class="ns-tile" data-ns-start="${sc.k}"${dead ? ` disabled title="${nsEsc(why)}"` : ''}>
      <span class="ic">${typeof icon === 'function' ? icon(sc.ic, 'w-4 h-4') : ''}</span>
      <span style="flex:1;min-width:0"><span class="t">${nsEsc(sc.t)}</span><span class="d">${nsEsc(dead ? why : sc.d)}</span></span></button>`;
  };
  openModal(`<div style="padding:24px">
    <h3 style="${NS_TITLE}">${nsEsc(i18t('ns_title'))}</h3>
    <p style="${NS_LEAD}">${nsEsc(i18t('ns_lead'))}</p>
    ${NS_STARTS.map(tile).join('')}
    ${''/* THE OTHER SIDE'S PAPER IS A DIFFERENT ACT — it is not a standard of
           ours — so it keeps a quiet link at the foot rather than a fourth
           tile. It presses the door that has always filed their paper. */}
    <div class="ns-foot"><span class="q">${nsEsc(i18t('ns_cp_q'))}</span>
      <button type="button" id="ns-cp" class="ns-link">${nsEsc(i18t('ns_cp_add'))}</button>
      <span class="sp"></span><button type="button" id="ns-close" class="ui-btn">${nsEsc(i18t('act_cancel'))}</button></div>
  </div>`, { maxWidth: nsW('m'), label: i18t('ns_title') });
  document.getElementById('ns-close')?.addEventListener('click', () => closeModal());
  document.getElementById('ns-cp')?.addEventListener('click', () => { closeModal(); if (typeof openCreateTemplateModal === 'function') openCreateTemplateModal('paste'); });
  document.querySelectorAll('[data-ns-start]').forEach(b => b.addEventListener('click', () => {
    if (b.disabled) return;
    closeModal(); nsGo(b.getAttribute('data-ns-start'), opts);
  }));
}
function nsGo(k, opts = {}) {
  /* WHERE THERE IS NO SERVER there is no company library, so each start
     presses the door the local product has always had for it — nothing that
     worked in the local demo stops working. */
  if (!nsApi()) {
    if (k === 'contract') return nsOpenContract(opts);
    if (typeof openCreateTemplateModal === 'function') return openCreateTemplateModal(k === 'template' && opts.tab === 'upload' ? 'upload' : 'paste');
    return toast(i18t('tl_needs_server'), 'warn');
  }
  if (NS_GATED.includes(k) && typeof newPaperBlock === 'function' && newPaperBlock()) return;
  if (k === 'scratch') return nsOpenScratch(opts);
  if (k === 'template') return nsOpenTemplate(opts);
  if (k === 'contract') return nsOpenContract(opts);
}
const nsBack = () => { closeModal(); openNewStandard(); };
function nsFootHtml(goLabel, goTitle) {
  return `<div class="ns-foot"><button type="button" id="ns-back" class="ui-btn">${nsEsc(i18t('act_back'))}</button><span class="sp"></span>
    <button type="button" id="ns-go" class="ui-btn ui-btn-primary"${goTitle ? ` title="${nsEsc(goTitle)}"` : ''}>${nsEsc(goLabel)}</button></div>`;
}
const nsSayOn = (msg, err) => { const el = document.getElementById('ns-say'); if (!el) return; el.textContent = msg || ''; el.classList.toggle('err', !!err); };
/* What a failure says — the builder's own sentences, so a start and the rail
   cannot word one refusal two ways. */
function nsWhy(e) {
  const kind = (e && e.kind) || '';
  if (kind === 'noKey' || (e && e.needsKey)) return i18t('tb_pb_nokey');
  if (kind === 'spendCap' || (e && (e.spendLimit || e.dailyLimit))) return i18t('tb_pb_ceiling');
  if (kind === 'rateLimit') return i18t('tb_pb_busy');
  return i18t('tb_pb_failed', { why: (e && e.message) || '' });
}

/* ONE ACT: a draft template, its v1, opened in the builder with its first
   move. Every start ends here, so none of them can open the builder a
   different way. */
async function nsCreate(t) {
  const d = await api('templates', 'POST', { name: t.name, category: t.category || 'other', folder: t.folder || null,
    origin: t.origin || 'built_in_hati', description: t.description || '', ...(t.sourceType ? { sourceType: t.sourceType } : {}) });
  const det = await api('templates/' + d.template.id);
  const draft = (det.versions || []).find(v => v.status === 'draft');
  if (!draft) throw new Error(i18t('tl_edit_failed'));
  return { tid: d.template.id, vid: draft.id, template: d.template };
}
/* A COPY THAT DID NOT LAND LEAVES NOTHING BEHIND. The draft template is made
   first — the route that writes its wording needs its id — so a refused write
   (a document past the server's ceiling of 500 blocks a version, a dropped
   connection) takes the empty draft back out rather than leaving it in the
   library under the document's name. The refusal itself is still said. */
async function nsFill(made, body) {
  try { await api(`templates/${made.tid}/versions/${made.vid}`, 'PUT', body); }
  catch (e) { try { await api('templates/' + made.tid, 'DELETE', undefined, { quiet: true }); } catch (_) { /* said below */ } throw e; }
}
function nsOpen(tid, vid, start) {
  if (typeof tplLibRefresh === 'function') tplLibRefresh().catch(() => {});
  if (typeof state === 'object' && state && state.view !== 'templates' && typeof setView === 'function') setView('templates');
  return openTemplateBuilder(tid, vid, { start });
}

/* ═══════════════════════════ FROM SCRATCH ═══════════════════════════════
   What is it for? — then Copilot proposes the SECTIONS, headings only, and
   the builder opens with the list waiting (tbOutlineFrom). The same outline
   route the builder's rail has always asked; the answer now also carries a
   suggested NAME and CATEGORY, which fill the builder's head. */
function nsNameFromSentence(said) {
  const first = String(said || '').split(/[:.;\n]/)[0].trim();
  if (!first || first.length > 60) return '';
  return first.charAt(0).toUpperCase() + first.slice(1);
}
function nsOpenScratch(o = {}) {
  nsStyle();
  let ai = typeof copilotAvailable === 'function' && copilotAvailable();
  openModal(`<div style="padding:24px">
    <h3 style="${NS_TITLE}">${nsEsc(i18t('ns_scratch'))}</h3>
    <label style="display:block;margin:10px 0 0"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${nsEsc(i18t('ns_what_for'))}</span>
      <textarea id="ns-say-box" rows="4" maxlength="${NS_SAY_MAX}" placeholder="${nsEsc(i18t('ns_what_for_ph'))}" style="${NS_FLD};resize:vertical;min-height:96px">${nsEsc(o.said || '')}</textarea></label>
    <div id="ns-say" class="ns-say"></div>
    ${nsFootHtml(ai ? i18t('ns_propose') : i18t('ns_open_builder'), ai ? '' : i18t('tb_pb_nokey'))}
  </div>`, { maxWidth: nsW('l'), label: i18t('ns_scratch') });
  const box = document.getElementById('ns-say-box'); if (box) setTimeout(() => box.focus(), 40);
  document.getElementById('ns-back')?.addEventListener('click', nsBack);
  const go = document.getElementById('ns-go');
  go?.addEventListener('click', async () => {
    const said = String((box && box.value) || '').trim().slice(0, NS_SAY_MAX);
    if (ai && !said) { nsSayOn(i18t('tb_pb_say_first'), true); return; }
    go.disabled = true; const was = go.textContent; go.textContent = i18t(ai ? 'ns_proposing' : 'ns_opening'); nsSayOn('');
    let d = null;
    if (ai) {
      try { d = await api('ai/outline', 'POST', { sentence: said, kind: '', required: [], title: true }, { quiet: true }); }
      catch (e) {
        /* A REFUSAL CARRIES ITS WAY FORWARD ON THE SAME SCREEN: the reason is
           said, and the button becomes the one press still open — an empty
           builder with the sentence kept beside it. */
        nsSayOn(nsWhy(e), true); ai = false; go.disabled = false; go.textContent = i18t('ns_open_builder'); go.title = ''; return;
      }
    }
    try {
      const cats = typeof templateCategories === 'function' ? templateCategories().map(c => c.id) : ['sales', 'procurement', 'employment', 'nda', 'other'];
      const made = await nsCreate({ name: (d && d.title) || nsNameFromSentence(said) || i18t('ns_untitled'),
        category: d && cats.includes(d.category) ? d.category : 'other', origin: 'built_in_hati' });
      closeModal();
      nsOpen(made.tid, made.vid, { kind: 'scratch', said, outline: d ? { sections: d.sections || [], note: d.note || '' } : null });
    } catch (e) { go.disabled = false; go.textContent = was; nsSayOn(e.message || String(e), true); }
  });
}

/* ═══════════════════════ FROM A TEMPLATE YOU HAVE ═══════════════════════
   A Word file, a PDF, pasted wording or one of HaTi's — COPIED EXACTLY, then
   Copilot answers small questions about which words look like blanks. */
/* Read a file the way every uploaded contract is read: the Word reader with
   its structure, the PDF reader with its structure, OCR for a scan. What comes
   back is markup the copier can cut, and the KIND of file it was. */
async function nsReadFile(file, say) {
  if (!file) throw new Error(i18t('tl_choose_file_first'));
  if (!/\.(docx|pdf|txt|md)$/i.test(file.name || '')) throw new Error(i18t('ns_file_kinds'));
  if (typeof uploadMax === 'function' && file.size > uploadMax()) throw new Error(typeof uploadTooBigMsg === 'function' ? uploadTooBigMsg(file) : i18t('ns_file_kinds'));
  const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  const mime = file.type || '';
  const word = typeof detectWordFile === 'function' ? detectWordFile(dataUrl, mime, file.name) : (/\.docx$/i.test(file.name) ? 'docx' : null);
  if (word === 'doc') throw new Error(typeof WORD_REFUSAL === 'string' ? WORD_REFUSAL : i18t('ns_file_kinds'));
  let html = '', text = '', kind = 'text', report = null;
  if (word === 'docx') {
    const w = await extractWordText(dataUrl);
    html = w.html || ''; text = w.text || ''; report = w.report || null; kind = 'docx';
  } else if (/pdf/i.test(mime) || /\.pdf$/i.test(file.name)) {
    kind = 'pdf_digital';
    try {
      const r = await readPdfStructured(dataUrlBytes(dataUrl).buffer);
      html = r.html || ''; text = r.text || ''; report = r.report || null;
    } catch (_) { text = typeof extractDocText === 'function' ? await extractDocText(dataUrl, 'application/pdf') : ''; }
    if (typeof ocrNeeded === 'function' && ocrNeeded('application/pdf', text) && typeof ocrDocument === 'function') {
      say && say(i18t('ns_reading_scan'));
      const ocr = await ocrDocument(dataUrl, 'application/pdf', {
        onProgress: (d, t) => { say && say(i18t('ns_reading_page', { n: Math.min(d + 1, t), m: t })); } });
      try { await ocrRelease(); } catch (_) {}
      if (ocr && ocr.text) { text = ocr.text; html = ''; kind = 'pdf_scanned'; }
    }
  } else {
    text = new TextDecoder().decode(dataUrlBytes(dataUrl));
  }
  /* A file with no structure of its own is lifted the way the document tab
     lifts a working text — headings and lists read off the lines, never
     invented beyond them. */
  if (!html && text) html = typeof docRichFromText === 'function' ? docRichFromText(text) : textToRich(text);
  if (!String(text || '').trim() && !String(html || '').replace(/<[^>]*>/g, '').trim()) throw new Error(i18t('ns_file_unreadable'));
  return { html, text, kind, report, fileName: file.name };
}
/* The document's OWN title, never a guess: its first heading, else a short
   first line — cut after the kind of document where a party's name follows
   ("…Agreement for nShift's …" is the SaaS Agreement). A title set in
   capitals is written as a name is. Failing all of it, the file's name. */
const NS_DOC_NOUN = /\b(agreement|contract|terms(?: and conditions)?|conditions|deed|addendum|order|policy|schedule|letter|memorandum|licen[cs]e|lease|charter|mandate|undertaking)\b/i;
function nsTitleCase(s) {
  const small = /^(a|an|and|as|at|by|for|in|of|on|or|the|to|with)$/i;
  return s.toLowerCase().split(/\s+/).map((w, i) => (i && small.test(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function nsDocTitle(html, fileName) {
  const text = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  /* The first short line near the top that NAMES a kind of document is the
     title — a cover page's "CONFIDENTIAL" or a first clause "1 SCOPE" is not. */
  const els = Array.from(String(html || '').matchAll(/<(p|h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/gi)).slice(0, 16).map(m => text(m[2])).filter(Boolean);
  let t = els.find(x => x.length <= 160 && NS_DOC_NOUN.test(x)) || '';
  if (t) {
    const cut = /^(.{6,}?\b(?:agreement|contract|terms(?: and conditions)?|conditions|deed|addendum|order|policy|licen[cs]e|lease))\s+(?:for|between|by and between|with|of|in respect of|relating to|dated)\b/i.exec(t);
    if (cut) t = cut[1];
    if (t === t.toUpperCase() && /[A-Z]/.test(t)) t = nsTitleCase(t);
    return t.slice(0, 120);
  }
  return String(fileName || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').trim().slice(0, 120);
}
/* THE COPY — through the product's own sanitiser, then the one copier. It is
   checked, not claimed: "no word changed" is said only where the blocks joined
   back together ARE the markup that was read. */
function nsCopy(html, report, fileName) {
  let safe = typeof sanitizeRich === 'function' ? sanitizeRich(String(html || '')) : String(html || '');
  safe = safe.replace(/\sdata-clause-id="[^"]*"/g, '');
  const blocks = tplFormCopyBlocks(safe);
  const same = blocks.map(b => b.content).join('') === safe;
  const heads = (safe.match(/<h[1-4]\b[^>]*>(?!\s*<\/h)/gi) || []).length;
  const tables = (safe.match(/<table\b/gi) || []).length;
  let numbers = report && Number(report.numbered) > 0 ? Number(report.numbered) : 0;
  if (!numbers) for (const m of safe.matchAll(/<(?:p|h[1-4]|li)\b[^>]*>([\s\S]*?)<\/(?:p|h[1-4]|li)>/gi))
    if (/^\s*(?:\d+(?:\.\d+)*[.)]?|\([a-z0-9]{1,4}\)|[a-z][.)])[\s\t]/i.test(m[1].replace(/<[^>]*>/g, ''))) numbers++;
  return { blocks, html: safe, same, facts: { heads, numbers, tables }, name: nsDocTitle(safe, fileName) };
}
function nsFactsHtml(c) {
  const f = c.facts;
  const bits = [i18tn('ns_f_heads', f.heads, { n: f.heads }), i18tn('ns_f_numbers', f.numbers, { n: f.numbers }),
    i18tn('ns_f_tables', f.tables, { n: f.tables })];
  if (c.same) bits.push(i18t('ns_f_same'));
  return `<div class="facts">${bits.map(b => `<span>${nsEsc(b)}</span>`).join('')}</div>`;
}
/* THE CATEGORY A HaTi TEMPLATE ALREADY STATES — its value stream says which
   side of the money it was drafted for, and the NDA is an NDA. The same two
   facts save-as-template reads off a contract; nothing here is guessed. */
const NS_BUILTIN_CATEGORY = { proc: 'procurement', sales: 'sales' };
const nsBuiltinCategory = t => (t && /\bNDA\b|non-disclosure/i.test(`${t.kind} ${t.name}`)) ? 'nda' : (NS_BUILTIN_CATEGORY[t && t.folder] || 'other');
function nsOpenTemplate(o = {}) {
  nsStyle();
  let tab = NS_TABS.includes(o.tab) ? o.tab : (o.pick ? 'hati' : 'upload');
  let got = null;       /* the copy from the file tab: { blocks, html, same, facts, name, kind } */
  let pasted = null;    /* the paste tab's copy, refreshed on each paste */
  let pick = o.pick || null;
  let editor = null;
  const builtins = (typeof TEMPLATES === 'object' ? Object.values(TEMPLATES) : [])
    .filter(t => typeof templateAllowedForRole !== 'function' || templateAllowedForRole(t.id, (typeof currentUser === 'function' && currentUser() || {}).role || 'viewer'));
  const tabBtn = k => `<button type="button" data-ns-tab="${k}" class="${tab === k ? 'on' : ''}" aria-pressed="${tab === k}">${nsEsc(i18t('ns_tab_' + k))}</button>`;
  openModal(`<div style="padding:24px">
    <h3 style="${NS_TITLE}">${nsEsc(i18t('ns_template'))}</h3>
    <div class="ns-tabs" role="group" style="margin-top:10px">${NS_TABS.map(tabBtn).join('')}</div>
    <div class="ns-pane" data-ns-pane="upload"${tab === 'upload' ? '' : ' hidden'}>
      <label class="ns-drop">${nsEsc(i18t('ns_file_choose'))}<input type="file" id="ns-file" accept=".docx,.pdf,.txt,.md"></label>
      <div id="ns-got"></div>
    </div>
    <div class="ns-pane" data-ns-pane="paste"${tab === 'paste' ? '' : ' hidden'}>
      <div id="ns-paste" class="ns-paste scroll-thin doc-surface" data-placeholder="${nsEsc(i18t('lb_open_in_word'))}"></div>
      <div id="ns-pasted"></div>
    </div>
    <div class="ns-pane" data-ns-pane="hati"${tab === 'hati' ? '' : ' hidden'}>
      <div class="ns-list">${builtins.map(t => `<button type="button" class="ns-row${pick === t.id ? ' on' : ''}" data-ns-hati="${nsEsc(t.id)}" aria-pressed="${pick === t.id}">
        <span class="n">${nsEsc(t.name)}</span><span class="s">${nsEsc(((typeof FOLDERS === 'object' && FOLDERS[t.folder]) || {}).name || '')}</span></button>`).join('')}</div>
    </div>
    <div id="ns-say" class="ns-say"></div>
    ${nsFootHtml(i18t('ns_open_builder'))}
  </div>`, { maxWidth: nsW('l'), label: i18t('ns_template') });
  const go = document.getElementById('ns-go');
  const ready = () => { if (go) go.disabled = !(tab === 'upload' ? !!got : tab === 'paste' ? !!pasted : !!pick); };
  const paintTab = () => {
    document.querySelectorAll('[data-ns-tab]').forEach(b => { const on = b.getAttribute('data-ns-tab') === tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    document.querySelectorAll('[data-ns-pane]').forEach(p => { p.hidden = p.getAttribute('data-ns-pane') !== tab; });
    nsSayOn(''); ready();
    if (tab === 'paste' && editor) setTimeout(() => editor.focus(), 30);
  };
  document.getElementById('ns-back')?.addEventListener('click', nsBack);
  document.querySelectorAll('[data-ns-tab]').forEach(b => b.addEventListener('click', () => { tab = b.getAttribute('data-ns-tab'); paintTab(); }));
  document.querySelectorAll('[data-ns-hati]').forEach(b => b.addEventListener('click', () => {
    pick = b.getAttribute('data-ns-hati');
    document.querySelectorAll('[data-ns-hati]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    ready();
  }));
  const gotHtml = (c, label) => `<div class="ns-got"><b>${nsEsc(label)}</b><span class="ok">✓ ${nsEsc(i18t('ns_copied'))}</span>${nsFactsHtml(c)}</div>`;
  document.getElementById('ns-file')?.addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0]; got = null; ready();
    const out = document.getElementById('ns-got'); if (out) out.innerHTML = '';
    if (!file) return;
    nsSayOn(i18t('ns_reading'));
    try {
      const r = await nsReadFile(file, m => nsSayOn(m));
      got = { ...nsCopy(r.html, r.report, r.fileName), kind: r.kind, fileName: r.fileName };
      nsSayOn(''); if (out) out.innerHTML = gotHtml(got, r.fileName);
    } catch (err) { got = null; nsSayOn(err.message || String(err), true); }
    ready();
  });
  /* THE PASTE SURFACE IS THE ONE THE OTHER SIDE'S PAPER HAS ALWAYS USED
     (richEditor, js/richpaste.js) — Word's formatting kept — and what it
     holds becomes OUR standard now, not a counterparty template. */
  const host = document.getElementById('ns-paste');
  if (host && typeof richEditor === 'function') {
    /* Copied on a PASTE (the facts card) and again at the press — never on
       every keystroke, which would re-cut a long document per letter. */
    const hasWords = () => !!String(editor.get() || '').replace(/<[^>]*>/g, '').trim();
    editor = richEditor(host, { onChange: () => { pasted = hasWords() ? (pasted || { pending: true }) : null; ready(); },
      onPaste: () => { const h = editor.get(); pasted = nsCopy(h, null, ''); const out = document.getElementById('ns-pasted'); if (out) out.innerHTML = gotHtml(pasted, pasted.name || i18t('ns_tab_paste')); ready(); } });
  }
  paintTab();
  go?.addEventListener('click', async () => {
    if (go.disabled) return;
    go.disabled = true; const was = go.textContent; go.textContent = i18t('ns_opening');
    try {
      if (tab === 'hati') {
        const t = (typeof TEMPLATES === 'object' && TEMPLATES[pick]) || null;
        const built = typeof tplBuiltinDraftBody === 'function' ? tplBuiltinDraftBody(pick) : null;
        if (!t || !built || built.blocks.length < 2) throw new Error(i18t('lb_could_not_convert'));
        const made = await nsCreate({ name: built.name, category: nsBuiltinCategory(t), folder: built.folder || null,
          origin: 'built_in_hati', description: i18t('lib_ours_desc', { name: built.name }) });
        await nsFill(made, {
          blocks: built.blocks.map((b, i) => ({ ...b, orderIndex: i })),
          fields: built.fields.map((f, i) => ({ fieldKey: f.key, label: f.label || f.key, orderIndex: i,
            fieldType: 'short_text', control: 'free', required: !!f.required })) });
        closeModal();
        return nsOpen(made.tid, made.vid, { kind: 'template', from: 'hati', builtin: pick });
      }
      const c = tab === 'paste' ? (editor ? nsCopy(editor.get(), null, '') : pasted) : got;
      if (!c || !c.blocks.length) throw new Error(i18t('ns_file_unreadable'));
      const made = await nsCreate({ name: c.name || i18t('ns_untitled'), category: 'other', folder: null, origin: 'upload',
        sourceType: tab === 'upload' && ['docx', 'pdf_digital', 'pdf_scanned'].includes(c.kind) ? c.kind : null });
      await nsFill(made, { blocks: c.blocks.map((b, i) => ({ ...b, orderIndex: i })), fields: [] });
      closeModal();
      return nsOpen(made.tid, made.vid, { kind: 'template', from: tab, facts: c.facts, same: c.same, scanned: c.kind === 'pdf_scanned' });
    } catch (e) { go.disabled = false; go.textContent = was; nsSayOn(e.message || String(e), true); }
  });
}

/* ══════════════════════ FROM ONE OF OUR CONTRACTS ══════════════════════
   Any contract with wording — signed or still in negotiation, which is what
   the old door already accepted whatever its name said. The route copies it
   (keeping its tables), takes the deal details out and says which clauses the
   other side changed; the builder opens on the check. */
const nsHasWording = c => !!(c && (c.redlineText || (c.upload && (c.upload.extractedText || Number(c.upload.textChars) > 0))));
function nsOpenContract() {
  nsStyle();
  const all = ((typeof state === 'object' && state && state.contracts) || []).filter(nsHasWording)
    .slice().sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  if (!all.length) { toast(i18t('lib_pick_none'), 'warn'); return; }
  let pick = null; let q = '';
  const row = c => `<button type="button" class="ns-row${pick === c.id ? ' on' : ''}" data-ns-c="${nsEsc(c.id)}" aria-pressed="${pick === c.id}">
    <span class="n">${nsEsc(c.name || c.id)}</span><span class="s">${nsEsc([c.id, c.counterparty, typeof statusLabel === 'function' ? statusLabel(c.status) : c.status].filter(Boolean).join(' · '))}</span></button>`;
  const rows = () => {
    const f = q.toLowerCase();
    const hit = all.filter(c => !f || [c.name, c.id, c.counterparty].some(x => String(x || '').toLowerCase().includes(f)));
    return hit.slice(0, 200).map(row).join('') || `<div style="padding:12px;font-size:var(--t-meta);color:var(--color-neutral-600)">${nsEsc(i18t('ns_c_none'))}</div>`;
  };
  openModal(`<div style="padding:24px">
    <h3 style="${NS_TITLE}">${nsEsc(i18t('ns_contract'))}</h3>
    <input id="ns-c-q" type="search" placeholder="${nsEsc(i18t('ns_c_search'))}" autocomplete="off" style="${NS_FLD};margin:10px 0 10px">
    <div class="ns-list" id="ns-c-list">${rows()}</div>
    <p class="ns-note">${nsEsc(i18t('lib_pick_contract_lead'))}</p>
    <div id="ns-say" class="ns-say"></div>
    ${nsFootHtml(i18t('ns_use_contract'))}
  </div>`, { maxWidth: nsW('l'), label: i18t('ns_contract') });
  const go = document.getElementById('ns-go'); if (go) go.disabled = true;
  const list = document.getElementById('ns-c-list');
  const wire = () => list.querySelectorAll('[data-ns-c]').forEach(b => b.addEventListener('click', () => {
    pick = b.getAttribute('data-ns-c');
    list.querySelectorAll('[data-ns-c]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    if (go) go.disabled = false;
  }));
  wire();
  document.getElementById('ns-c-q')?.addEventListener('input', e => { q = e.target.value || ''; list.innerHTML = rows(); wire(); });
  document.getElementById('ns-back')?.addEventListener('click', nsBack);
  go?.addEventListener('click', async () => {
    const c = all.find(x => x.id === pick); if (!c || go.disabled) return;
    if (!nsApi()) { closeModal(); return typeof saveContractAsTemplate === 'function' ? saveContractAsTemplate(c) : null; }
    /* THE BUILDER DOOR ASKS WHO MAY MAKE NEW PAPER, as "Save as template"
       always did before it opened the builder — asked BEFORE the draft is
       made now, so a refusal leaves no orphan template behind. The start is
       still drawn live: the route itself carries templateManager, not
       paperMaker (f331's wall). */
    if (typeof newPaperBlock === 'function' && newPaperBlock()) return;
    go.disabled = true; const was = go.textContent; go.textContent = i18t('ns_opening');
    try {
      const r = await api(`contracts/${c.id}/save-as-template`, 'POST', {});
      closeModal();
      return nsOpen(r.templateId, r.versionId, { kind: 'contract', contractId: c.id, contractName: c.name || c.id,
        counterparty: c.counterparty || '', taken: r.taken || [], negotiated: r.negotiated || [] });
    } catch (e) { go.disabled = false; go.textContent = was; nsSayOn(e.message || String(e), true); }
  });
}

Object.assign(window, { NS_STARTS, NS_TABS, NS_SAY_MAX, NS_GATED, openNewStandard, nsGo, nsOpenScratch, nsOpenTemplate, nsOpenContract,
  nsReadFile, nsCopy, nsDocTitle, nsNameFromSentence, nsBuiltinCategory, nsHasWording, nsCreate, nsFill });
