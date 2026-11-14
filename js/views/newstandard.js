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
const NS_FLD = 'width:100%;box-sizing:border-box;height:var(--field-h);border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:0 var(--field-pad-x);font:inherit;font-size:var(--field-size);outline:none';

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
  .ns-tabs button{flex:1;height:var(--ctl-h);border:0;border-left:1px solid var(--color-divider);background:var(--color-surface);font:inherit;font-size:var(--t-body);font-weight:var(--w-label);color:var(--color-text);cursor:pointer}
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
/* where a start's Back and Cancel return: the New agreement page's From scratch tab when it opened us (opts.back) */
let _nsFrom = null;
/* A START OPENS IN THE PAGE THAT ASKED FOR IT (owner, 14 Nov 2026: "this pop up is appearing in the board page as opposed
   to staying in the new agreement page"): pressed from New agreement's From scratch tab, each start's form is drawn INTO
   that tab (opts.host = #na-np), never a pop-up that takes the page away and lands over the Board. Back puts the four
   starts back in the same place; the press that opens the Builder still closes the page. Anywhere else, the pop-up as
   before (nsMount falls back to openModal). */
let _nsHost = null, _nsHostWas = '';
function nsHostSet(el) { _nsHost = el && el.isConnected ? el : null; _nsHostWas = _nsHost ? _nsHost.innerHTML : ''; }
function nsHostOn() { return !!(_nsHost && _nsHost.isConnected); }
function nsMount(html, opts) {
  if (!nsHostOn()) { openModal(html, opts); return; }
  _nsHost.innerHTML = `<div class="na-np-start">${html}</div>`;
  _nsHost.classList.add('is-start');
  /* the pop-up's own frame padding is the page's to give here: the form sits on the tab's edge like the starts did */
  const f = _nsHost.querySelector('.na-np-start > div'); if (f) f.style.padding = '0';
  /* the page's own Cancel and Escape belong to the page: a start's Cancel here is its Back */
  _nsHost.querySelectorAll('[data-dlg-cancel]').forEach(b => b.removeAttribute('data-dlg-cancel'));
  /* drawn where the four starts stood: the page does not move, so the tabs above stay in sight */
}
function nsHostBack() {
  if (!nsHostOn()) return false;
  _nsHost._nsl = null;   /* the start's own presses end with it */
  _nsHost.innerHTML = _nsHostWas;
  _nsHost.classList.remove('is-start');
  _nsHost = null;   /* the starts are back; the next Continue names the place again */
  return true;
}
function openNewStandard(opts = {}) {
  _nsFrom = typeof opts.back === 'function' ? opts.back : null;
  nsHostSet(opts.host || null);
  if (opts.start && NS_STARTS.some(s => s.k === opts.start)) return nsGo(opts.start, opts);
  nsStyle();
  const off = nsNewPaperOff();
  const why = off ? i18t('np_refused_ask') : '';
  /* AS DRAWN (SAP pop-ups, 10 Oct 2026): "How do you want to start?" over
     ONE list of choices — the three starts and the other side's paper as
     the fourth — the first chosen, and Continue on the foot. A start this
     person may not use is greyed with the reason in its line. */
  const rows = NS_STARTS.map(sc => ({ k: sc.k, t: sc.t, d: sc.d, dead: off && NS_GATED.includes(sc.k) }))
    .concat([{ k: 'cp', t: i18t('ns_cp_t'), d: i18t('ns_cp_d'), dead: false }]);
  const first = (rows.find(r => !r.dead) || rows[0]).k;
  const row = ({ k, t, d, dead }) => `<label class="sap-li" style="align-items:flex-start${dead ? ';opacity:.55;cursor:not-allowed' : ''}">
      <input type="radio" name="ns-start" ${k === 'cp' ? 'id="ns-cp"' : `data-ns-start="${k}"`} value="${k}"${k === first ? ' checked' : ''}${dead ? ` disabled title="${nsEsc(why)}"` : ''} style="margin-top:3px;accent-color:var(--accent-fill)"/>
      <span><span style="display:block;font-weight:var(--w-label)">${nsEsc(t)}</span><span class="sap-m">${nsEsc(dead ? why : d)}</span></span></label>`;
  openModal(`<div style="padding:16px 18px">
    <h3>${nsEsc(i18t('ns_title'))}</h3>
    <div class="sap-body">
      <div class="sap-f"><span class="sap-lbl">${nsEsc(i18t('ns_lead'))}</span>
        <div class="sap-list">${rows.map(row).join('')}</div></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
      <button type="button" id="ns-continue" class="ui-btn ui-btn-primary">${nsEsc(i18t('act_continue'))}</button>
      <button data-dlg-cancel type="button" id="ns-close" class="ui-btn">${nsEsc(i18t('act_cancel'))}</button></div>
  </div>`, { maxWidth: nsW('m'), label: i18t('ns_title') });
  /* opened from the New agreement page's From scratch tab, Cancel goes back to that page (opts.back) */
  document.getElementById('ns-close')?.addEventListener('click', () => { if (typeof opts.back === 'function') opts.back(); else closeModal(); });
  document.getElementById('ns-continue')?.addEventListener('click', () => {
    const k = (document.querySelector('input[name="ns-start"]:checked') || {}).value;
    if (!k) return;
    closeModal();
    /* THE OTHER SIDE'S PAPER presses the door that has always filed it. */
    if (k === 'cp') { if (typeof openCreateTemplateModal === 'function') openCreateTemplateModal('paste'); return; }
    nsGo(k, opts);
  });
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
const nsBack = () => { /* back in the standing frame, not a pop-up arriving again (the flash survey); to the tab that opened it, where one did */ if (nsHostBack()) return; if (typeof _nsFrom === 'function') return _nsFrom(); openNewStandard(); };
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
  if (first && first.length <= 60) return first.charAt(0).toUpperCase() + first.slice(1);
  /* A LONG SENTENCE STILL NAMES ITS PAPER (owner, 14 Nov 2026: the paper is named from your words, not "New standard
     contract"): what is leased is read off "leasing us …"/"lease of …", else the kind the free draft reader names;
     nothing read, nothing named (the caller falls back to Untitled) — never a guess */
  const cap = t => t.replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
  const lease = String(said || '').match(/\b(?:leas(?:e|es|ing)(?:\s+(?:us|to\s+us|of))?)\s+(?:the\s+|some\s+|our\s+)?([a-z][a-z-]*(?:\s+[a-z][a-z-]*)?)\b/i);
  if (lease && !/^(?:a|an|it|them|for|to|from|with)$/i.test(lease[1])) return cap(lease[1].replace(/\s+(?:for|to|from|with)$/i, '')) + ' Lease Agreement';
  const kind = (typeof window.caDraftKindOf === 'function') ? String(window.caDraftKindOf(said) || '').trim() : '';
  return kind && kind.length <= 48 ? kind.charAt(0).toUpperCase() + kind.slice(1) : '';
}
function nsOpenScratch(o = {}) {
  if (nsLgOn()) return nsLgScratch(o);
  nsStyle();
  let ai = typeof copilotAvailable === 'function' && copilotAvailable();
  nsMount(`<div style="padding:24px">
    <h3 style="${NS_TITLE}">${nsEsc(i18t('ns_scratch'))}</h3>
    <label style="display:block;margin:10px 0 0"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${nsEsc(i18t('ns_what_for'))}</span>
      <textarea id="ns-say-box" rows="4" maxlength="${NS_SAY_MAX}" placeholder="${nsEsc(i18t('ns_what_for_ph'))}" style="${NS_FLD};height:auto;padding:var(--field-pad-y) var(--field-pad-x);resize:vertical;min-height:96px">${nsEsc(o.said || '')}</textarea></label>
    ${ai ? `<p class="ns-next" style="margin:var(--s-2) 0 0;font-size:var(--t-label);color:var(--color-quiet)">${nsEsc(i18t('ns_what_next'))}</p>` : ''}
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
  if (nsLgOn()) return nsLgTemplate(o);
  nsStyle();
  let tab = NS_TABS.includes(o.tab) ? o.tab : (o.pick ? 'hati' : 'upload');
  let got = null;       /* the copy from the file tab: { blocks, html, same, facts, name, kind } */
  let pasted = null;    /* the paste tab's copy, refreshed on each paste */
  let pick = o.pick || null;
  let editor = null;
  const builtins = (typeof TEMPLATES === 'object' ? Object.values(TEMPLATES) : [])
    .filter(t => typeof templateAllowedForRole !== 'function' || templateAllowedForRole(t.id, (typeof currentUser === 'function' && currentUser() || {}).role || 'viewer'));
  const tabBtn = k => `<button type="button" data-ns-tab="${k}" class="${tab === k ? 'on' : ''}" aria-pressed="${tab === k}">${nsEsc(i18t('ns_tab_' + k))}</button>`;
  nsMount(`<div style="padding:24px">
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
      return await nsTplMake(tab, { pick, got, copy: tab === 'paste' ? (editor ? nsCopy(editor.get(), null, '') : pasted) : got });
    } catch (e) { go.disabled = false; go.textContent = was; nsSayOn(e.message || String(e), true); }
  });
}
/* ONE WAY TO MAKE A STANDARD FROM A TEMPLATE YOU HAVE, for the pop-up and the start drawn in New agreement's tab
   (the Legora way, 14 Nov 2026): HaTi's own paper by its id, else a copy read from a file or pasted. */
async function nsTplMake(tab, o) {
  if (tab === 'hati') {
    const pick = o.pick;
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
  const c = o.copy;
  if (!c || !c.blocks || !c.blocks.length) throw new Error(i18t('ns_file_unreadable'));
  const made = await nsCreate({ name: c.name || i18t('ns_untitled'), category: 'other', folder: null, origin: 'upload',
    sourceType: tab === 'upload' && ['docx', 'pdf_digital', 'pdf_scanned'].includes(c.kind) ? c.kind : null });
  await nsFill(made, { blocks: c.blocks.map((b, i) => ({ ...b, orderIndex: i })), fields: [] });
  closeModal();
  return nsOpen(made.tid, made.vid, { kind: 'template', from: tab, facts: c.facts, same: c.same, scanned: c.kind === 'pdf_scanned' });
}

/* ══════════════════════ FROM ONE OF OUR CONTRACTS ══════════════════════
   Any contract with wording — signed or still in negotiation, which is what
   the old door already accepted whatever its name said. The route copies it
   (keeping its tables), takes the deal details out and says which clauses the
   other side changed; the builder opens on the check. */
const nsHasWording = c => !!(c && (c.redlineText || (c.upload && (c.upload.extractedText || Number(c.upload.textChars) > 0))));
function nsOpenContract() {
  if (nsLgOn()) return nsLgContract();
  nsStyle();
  const all = ((typeof state === 'object' && state && state.contracts) || []).filter(nsHasWording)
    .slice().sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  if (!all.length) { toast(i18t('lib_pick_none'), 'warn'); return; }
  let pick = null; let q = '';
  const row = c => `<button type="button" class="ns-row${pick === c.id ? ' on' : ''}" data-ns-c="${nsEsc(c.id)}" aria-pressed="${pick === c.id}">
    <span class="n">${nsEsc(c.name || (window.contractRef ? contractRef(c) : c.id))}</span><span class="s">${[window.refHtml ? refHtml(c) : nsEsc(c.id), nsEsc(c.counterparty || ''), nsEsc(typeof statusLabel === 'function' ? statusLabel(c.status) : c.status)].filter(Boolean).join(' · ')}</span></button>`;
  const rows = () => {
    const f = q.toLowerCase();
    const hit = all.filter(c => !f || [c.name, c.id, c.contractNo, c.counterparty].some(x => String(x || '').toLowerCase().includes(f)));
    return hit.slice(0, 200).map(row).join('') || `<div style="padding:12px;font-size:var(--t-meta);color:var(--color-neutral-600)">${nsEsc(i18t('ns_c_none'))}</div>`;
  };
  nsMount(`<div style="padding:24px">
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
    try { return await nsCtrMake(c); } catch (e) { go.disabled = false; go.textContent = was; nsSayOn(e.message || String(e), true); }
  });
}
/* ONE WAY TO MAKE A STANDARD FROM ONE OF OUR CONTRACTS, for the pop-up and the start drawn in the tab */
async function nsCtrMake(c) {
  const r = await api(`contracts/${c.id}/save-as-template`, 'POST', {});
  closeModal();
  return nsOpen(r.templateId, r.versionId, { kind: 'contract', contractId: c.id, contractRef: (window.contractRef ? contractRef(c) : c.id), contractName: c.name || (window.contractRef ? contractRef(c) : c.id),
    counterparty: c.counterparty || '', taken: r.taken || [], negotiated: r.negotiated || [] });
}

/* ══════════ THE FOUR STARTS, DRAWN IN NEW AGREEMENT'S FROM SCRATCH TAB (owner's picks by name, 14 Nov 2026) ══════════
   From a template you have, From one of our contracts and The other side's paper: THE LEGORA WAY — nothing boxed, one
   ask box, the streams as chips, each paper's own first line quoted, and the act in the row you chose. From nothing:
   THE SHELF — your sentence beside a small paper that takes its name from your words, then Jambo's proposed sections on
   that paper to keep or untick, and the Builder opens already holding them. Drawn only in the tab (nsHostOn) in the
   new look; anywhere else each start is the pop-up it always was. Every act is the one these starts always had
   (nsTplMake, nsCtrMake, nsCreate + nsOpen, saveTemplateRecord). */
const nsLgOn = () => nsHostOn() && typeof newLookOn === 'function' && !!newLookOn();
const nsLgHost = () => (nsHostOn() ? _nsHost : null);
const nsLgTone = fid => (fid && typeof listStreamTone === 'function') ? listStreamTone(fid) : 'gray';
const nsLgInitials = s => String(s || '').split(/[\s&,()/-]+/).filter(w => /^[A-ZÅÄÖ0-9]/.test(w)).slice(0, 2).map(w => w.charAt(0)).join('') || String(s || '?').trim().charAt(0).toUpperCase();
const nsLgStreamName = fid => { const f = fid && typeof FOLDERS === 'object' ? FOLDERS[fid] : null; return f ? ((typeof STREAM_SHORT === 'object' && STREAM_SHORT && STREAM_SHORT[fid]) || f.name) : ''; };
/* the first sentence of a paper that reads as wording (over 24 letters), never guessed */
function nsLgFirstLine(html) {
  if (!html || typeof document === 'undefined') return '';
  const t = document.createElement('div'); t.innerHTML = String(html).replace(/<br\s*\/?>/gi, ' ');
  /* a sentence of wording (over 40 letters), its blanks shown as … rather than their keys */
  const p = [...t.querySelectorAll('p, li')].map(e => String(e.textContent || '').replace(/\{\{[^}]*\}\}/g, '…').replace(/\s+/g, ' ').trim()).find(x => x.length > 40);
  return p ? p.slice(0, 160) : '';
}
const nsLgQuote = q => q ? `§ 1 · “${q}${q.length >= 160 ? '…' : ''}”` : '';
function nsLgHead(title, sub) {
  return `<button type="button" class="nsl-back" data-nsl-back>‹ ${nsEsc(i18t('nsl_all_starts'))}</button><h3 class="nsl-t">${nsEsc(title)}</h3>${sub ? `<p class="nsl-sub">${nsEsc(sub)}</p>` : ''}`;
}
/* ONE ROW BUILDER for every list here: a round mark in the stream's tone, the name, a side word, the first line quoted,
   a word at the right; the chosen row opens in place with its sentence and its one black button */
function nsLgRowHtml(r) {
  return `<div class="nsl-r${r.on ? ' is-on' : ''}" role="button" tabindex="0" aria-pressed="${r.on ? 'true' : 'false'}" data-nsl-row="${nsEsc(r.key)}">
    <i class="nsl-mk" style="background:var(--st-${r.tone}-bg);color:var(--st-${r.tone}-fg)" aria-hidden="true">${nsEsc(r.mark)}</i>
    <span class="nsl-tx"><span class="nsl-l1"><b>${nsEsc(r.name)}</b>${r.side ? `<span class="nsl-side" style="color:var(--st-${r.tone}-fg)">${nsEsc(r.side)}</span>` : ''}</span>${r.quote ? `<span class="nsl-q">${nsEsc(r.quote)}</span>` : ''}${r.on ? `<span class="nsl-open"><span class="nsl-ss">${nsEsc(r.openWords || '')}</span><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-nsl-go="${nsEsc(r.key)}">${nsEsc(r.goLabel)}</button></span>` : ''}</span>
    <span class="nsl-n">${r.right || ''}</span></div>`;
}
/* THE STREAMS AS CHIPS ON ONE LINE: All, then the streams by how many, four shown and the rest behind More */
function nsLgChipsHtml(counts, on, more, total) {
  const ids = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const shown = more ? ids : ids.slice(0, 4);
  const chip = (id, label, n, tone) => `<button type="button" class="nsl-chip${on === id ? ' is-on' : ''}" data-nsl-chip="${nsEsc(id)}">${tone ? `<i class="nsl-dot" style="background:var(--st-${tone}-dot)"></i>` : ''}${nsEsc(label)} <em>${n}</em></button>`;
  return `<div class="nsl-chips">${chip('', i18t('nsl_all'), total, '')}${shown.map(id => chip(id, nsLgStreamName(id) || id, counts[id], nsLgTone(id))).join('')}${!more && ids.length > 4 ? `<button type="button" class="nsl-chip" data-nsl-more>${nsEsc(i18t('nsl_more'))}${typeof icon === 'function' ? icon('chevD', 'w-3 h-3') : ''}</button>` : ''}</div>`;
}
/* a need, not only a name (the same reading Our paper's ask box makes): small words left out, each word by its stem */
function nsLgMatches(text, q) {
  const stop = (typeof TPLN_STOP !== 'undefined' && TPLN_STOP) || new Set();
  const words = String(q || '').toLowerCase().split(/[^a-z0-9À-ɏ]+/).filter(w => w.length > 1 && !stop.has(w));
  if (!words.length) return true;
  const t = String(text || '').toLowerCase();
  return words.some(w => t.includes(w.length > 5 ? w.slice(0, 5) : w));
}
/* the back link and a row's press, delegated once on the tab itself (its insides are redrawn) */
function nsLgWire(host, on) {
  host._nsl = on;
  if (host.dataset.nslWired) return;
  host.dataset.nslWired = '1';
  host.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-nsl-back]')) { e.preventDefault(); nsBack(); return; }
    if (host._nsl && host._nsl.click) host._nsl.click(e, t);
  });
  host.addEventListener('keydown', e => { if (host._nsl && host._nsl.key) host._nsl.key(e); });
  host.addEventListener('input', e => { if (host._nsl && host._nsl.input) host._nsl.input(e); });
  host.addEventListener('change', e => { if (host._nsl && host._nsl.change) host._nsl.change(e); });
  ['dragover', 'dragleave', 'drop'].forEach(ev => host.addEventListener(ev, e => { if (host._nsl && host._nsl.drag) host._nsl.drag(ev, e); }));
}
const nsLgSay = (host, msg, err) => { const el = host && host.querySelector('[data-nsl-say]'); if (!el) return; el.textContent = msg || ''; el.classList.toggle('err', !!err); };

/* ---------------- FROM A TEMPLATE YOU HAVE — the Legora way ---------------- */
const _nsBuiltinMeta = {};
function nsLgBuiltinMeta(id) {
  if (_nsBuiltinMeta[id]) return _nsBuiltinMeta[id];
  let secs = [], q = '';
  try {
    const b = typeof tplBuiltinDraftBody === 'function' ? tplBuiltinDraftBody(id) : null;
    if (b) { secs = (b.blocks || []).filter(x => x.blockType === 'heading').map(x => String(x.content || '').replace(/<[^>]*>/g, '').replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim()).filter(Boolean); q = nsLgFirstLine(b.html); }
  } catch (_) { /* a paper that cannot be read shows its name alone */ }
  return (_nsBuiltinMeta[id] = { secs, q });
}
function nsLgTemplate() {
  nsStyle();
  const st = { q: '', ls: '', more: false, pick: null, got: null, paste: false, pasted: null, busy: false };
  let editor = null;
  const builtins = (typeof TEMPLATES === 'object' ? Object.values(TEMPLATES) : [])
    .filter(t => typeof templateAllowedForRole !== 'function' || templateAllowedForRole(t.id, (typeof currentUser === 'function' && currentUser() || {}).role || 'viewer'));
  const counts = {}; builtins.forEach(t => { if (t.folder) counts[t.folder] = (counts[t.folder] || 0) + 1; });
  const listHtml = () => {
    const rows = [];
    if (st.got) rows.push(nsLgRowHtml({ key: '__file', on: true, tone: 'green', mark: '✓', name: st.got.fileName || i18t('nsl_your_file'), side: i18t('nsl_your_file'),
      quote: nsLgQuote(nsLgFirstLine(st.got.html)), openWords: i18t('ns_copied'), goLabel: i18t('ns_open_builder') }));
    builtins.forEach(t => {
      const m = nsLgBuiltinMeta(t.id), stream = nsLgStreamName(t.folder);
      if (st.ls && t.folder !== st.ls) return;
      if (!nsLgMatches([t.name, stream, m.q, t.blurb].join(' '), st.q)) return;
      rows.push(nsLgRowHtml({ key: t.id, on: !st.got && st.pick === t.id, tone: nsLgTone(t.folder), mark: nsLgInitials(t.name), name: t.name, side: stream,
        quote: nsLgQuote(m.q), right: m.secs.length ? nsEsc(i18tn('nsl_secs_n', m.secs.length, { n: m.secs.length })) : '',
        openWords: m.secs.length ? i18t('nsl_open_secs', { n: m.secs.length, list: m.secs.join(' · ') }) : '', goLabel: i18t('ns_open_builder') }));
    });
    return rows.join('') || `<p class="nsl-none">${nsEsc(i18t('nsl_none'))}</p>`;
  };
  const paint = () => {
    const host = nsLgHost(); if (!host) return;
    nsMount(`<div class="nsl">${nsLgHead(i18t('ns_template'), i18t('nsl_tpl_sub'))}
      <div class="nsl-ask" data-nsl-drop><span class="nsl-ask-ic" aria-hidden="true">${typeof icon === 'function' ? icon('search', 'w-4 h-4') : ''}</span>
        <input type="search" id="nsl-q" value="${nsEsc(st.q)}" placeholder="${nsEsc(i18t('nsl_tpl_ph'))}" aria-label="${nsEsc(i18t('nsl_tpl_ph'))}" autocomplete="off">
        <label class="nsl-or">${nsEsc(i18t('nsl_choose_file'))}<input type="file" id="nsl-file" accept=".docx,.pdf,.txt,.md" hidden></label>
        <button type="button" class="nsl-or" data-nsl-paste>${nsEsc(i18t('nsl_or_paste'))}</button></div>
      ${st.paste ? `<div class="nsl-paste"><div id="nsl-paste-box" class="ns-paste scroll-thin doc-surface" data-placeholder="${nsEsc(i18t('lb_open_in_word'))}"></div>
        <div class="nsl-paste-f"><button type="button" class="ui-btn ui-btn-sm" data-nsl-paste-x>${nsEsc(i18t('act_cancel'))}</button><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-nsl-paste-go>${nsEsc(i18t('ns_open_builder'))}</button></div></div>` : ''}
      ${nsLgChipsHtml(counts, st.ls, st.more, builtins.length)}
      <div class="nsl-say" data-nsl-say></div>
      <div class="nsl-list" id="nsl-list">${listHtml()}</div></div>`);
    if (st.paste) { const box = document.getElementById('nsl-paste-box'); if (box && typeof richEditor === 'function') editor = richEditor(box, {}); }
  };
  const repaintList = () => { const el = document.getElementById('nsl-list'); if (el) el.innerHTML = listHtml(); };
  const go = async (btn, tab, data) => {
    if (st.busy) return; st.busy = true;
    const was = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = i18t('ns_opening'); }
    try { await nsTplMake(tab, data); }
    catch (e) { st.busy = false; if (btn) { btn.disabled = false; btn.textContent = was; } nsLgSay(nsLgHost(), e.message || String(e), true); }
  };
  const readFile = async file => {
    if (!file) return;
    nsLgSay(nsLgHost(), i18t('ns_reading'));
    try { const r = await nsReadFile(file, m => nsLgSay(nsLgHost(), m)); st.got = { ...nsCopy(r.html, r.report, r.fileName), kind: r.kind, fileName: r.fileName, html: r.html }; nsLgSay(nsLgHost(), ''); repaintList(); }
    catch (err) { st.got = null; nsLgSay(nsLgHost(), err.message || String(err), true); }
  };
  const host = nsLgHost(); if (!host) return;
  nsLgWire(host, {
    click: (e, t) => {
      const g = t.closest('[data-nsl-go]');
      if (g) { e.preventDefault(); e.stopPropagation(); const k = g.getAttribute('data-nsl-go');
        if (k === '__file') return go(g, 'upload', { copy: st.got });
        return go(g, 'hati', { pick: k }); }
      if (t.closest('[data-nsl-paste]')) { st.paste = true; paint(); setTimeout(() => editor && editor.focus && editor.focus(), 30); return; }
      if (t.closest('[data-nsl-paste-x]')) { st.paste = false; paint(); return; }
      if (t.closest('[data-nsl-paste-go]')) { const html = editor ? editor.get() : ''; return go(t.closest('[data-nsl-paste-go]'), 'paste', { copy: nsCopy(html, null, '') }); }
      if (t.closest('[data-nsl-more]')) { st.more = true; paint(); return; }
      const c = t.closest('[data-nsl-chip]'); if (c) { st.ls = c.getAttribute('data-nsl-chip'); paint(); return; }
      const r = t.closest('[data-nsl-row]'); if (r) { const k = r.getAttribute('data-nsl-row'); if (k === '__file') return; st.got = null; st.pick = st.pick === k ? null : k; repaintList(); }
    },
    key: e => { const r = e.target && e.target.closest && e.target.closest('[data-nsl-row]'); if (r && (e.key === 'Enter' || e.key === ' ') && e.target === r) { e.preventDefault(); r.click(); } },
    input: e => { if (e.target && e.target.id === 'nsl-q') { st.q = e.target.value || ''; repaintList(); } },
    change: e => { if (e.target && e.target.id === 'nsl-file') readFile(e.target.files && e.target.files[0]); },
    drag: (ev, e) => { const z = e.target && e.target.closest && e.target.closest('[data-nsl-drop]'); if (!z) return; e.preventDefault();
      z.classList.toggle('is-over', ev === 'dragover'); if (ev === 'drop') readFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); },
  });
  paint();
}

/* ---------------- FROM ONE OF OUR CONTRACTS — the Legora way ---------------- */
function nsLgContract() {
  nsStyle();
  const all = ((typeof state === 'object' && state && state.contracts) || []).filter(nsHasWording)
    .slice().sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  if (!all.length) { toast(i18t('lib_pick_none'), 'warn'); nsHostBack(); return; }
  const signed = c => typeof negoExecuted === 'function' && negoExecuted(c);
  const st = { q: '', f: '', pick: null, busy: false };
  const lineOf = c => nsLgFirstLine(c.redlineText ? (typeof textToRich === 'function' ? textToRich(c.redlineText) : '<p>' + nsEsc(c.redlineText).replace(/\n+/g, '</p><p>') + '</p>') : '<p>' + nsEsc(String((c.upload && c.upload.extractedText) || '')).replace(/\n+/g, '</p><p>') + '</p>');
  const nSigned = all.filter(signed).length;
  const listHtml = () => all.filter(c => (!st.f || (st.f === 'signed') === signed(c)) && nsLgMatches([c.name, c.counterparty, c.id, c.contractNo].join(' '), st.q)).slice(0, 200).map(c => {
    const ref = typeof contractRef === 'function' ? contractRef(c) : c.id, ok = signed(c), tone = ok ? 'green' : 'amber';
    return nsLgRowHtml({ key: c.id, on: st.pick === c.id, tone: nsLgTone(c.folder), mark: nsLgInitials(c.counterparty || c.name), name: c.name || ref,
      side: [c.counterparty, ref].filter(Boolean).join(' · '), quote: nsLgQuote(lineOf(c)),
      right: `<span class="nsl-st" style="color:var(--st-${tone}-fg)"><i class="nsl-dot" style="background:var(--st-${tone}-dot)"></i>${nsEsc(ok ? i18t('nsl_signed') : (typeof statusLabel === 'function' ? statusLabel(c.status) : c.status))}</span>`,
      openWords: i18t('nsl_ctr_open'), goLabel: i18t('nsl_ctr_go') });
  }).join('') || `<p class="nsl-none">${nsEsc(i18t('nsl_none'))}</p>`;
  const chip = (id, label, n) => `<button type="button" class="nsl-chip${st.f === id ? ' is-on' : ''}" data-nsl-f="${id}">${nsEsc(label)} <em>${n}</em></button>`;
  const paint = () => nsMount(`<div class="nsl">${nsLgHead(i18t('ns_contract'), i18t('nsl_ctr_sub'))}
    <div class="nsl-ask"><span class="nsl-ask-ic" aria-hidden="true">${typeof icon === 'function' ? icon('search', 'w-4 h-4') : ''}</span><input type="search" id="nsl-q" value="${nsEsc(st.q)}" placeholder="${nsEsc(i18t('nsl_ctr_ph'))}" aria-label="${nsEsc(i18t('nsl_ctr_ph'))}" autocomplete="off"></div>
    <div class="nsl-chips">${chip('', i18t('nsl_all'), all.length)}${nSigned ? chip('signed', i18t('nsl_signed'), nSigned) : ''}${all.length - nSigned ? chip('open', i18t('nsl_unsigned'), all.length - nSigned) : ''}</div>
    <div class="nsl-say" data-nsl-say></div><div class="nsl-list" id="nsl-list">${listHtml()}</div></div>`);
  const repaintList = () => { const el = document.getElementById('nsl-list'); if (el) el.innerHTML = listHtml(); };
  const host = nsLgHost(); if (!host) return;
  nsLgWire(host, {
    click: async (e, t) => {
      const g = t.closest('[data-nsl-go]');
      if (g) { e.preventDefault(); e.stopPropagation(); const c = all.find(x => x.id === g.getAttribute('data-nsl-go')); if (!c || st.busy) return;
        if (!nsApi()) { closeModal(); return typeof saveContractAsTemplate === 'function' ? saveContractAsTemplate(c) : null; }
        if (typeof newPaperBlock === 'function' && newPaperBlock()) return;
        st.busy = true; const was = g.textContent; g.disabled = true; g.textContent = i18t('ns_opening');
        try { await nsCtrMake(c); } catch (err) { st.busy = false; g.disabled = false; g.textContent = was; nsLgSay(nsLgHost(), err.message || String(err), true); }
        return; }
      const f = t.closest('[data-nsl-f]'); if (f) { st.f = f.getAttribute('data-nsl-f'); paint(); return; }
      const r = t.closest('[data-nsl-row]'); if (r) { const k = r.getAttribute('data-nsl-row'); st.pick = st.pick === k ? null : k; repaintList(); }
    },
    key: e => { const r = e.target && e.target.closest && e.target.closest('[data-nsl-row]'); if (r && (e.key === 'Enter' || e.key === ' ') && e.target === r) { e.preventDefault(); r.click(); } },
    input: e => { if (e.target && e.target.id === 'nsl-q') { st.q = e.target.value || ''; repaintList(); } },
  });
  paint();
}

/* ---------------- FROM NOTHING — the Shelf ---------------- */
function nsLgScratch(o = {}) {
  nsStyle();
  const ai = typeof copilotAvailable === 'function' && copilotAvailable();
  const st = { said: String(o.said || ''), step: 'say', d: null, list: null, busy: false, name: '' };
  const SRC = { lib: 'tb_src_lib', std: 'tb_src_std', ai: 'tb_src_ai' };
  const nameOf = () => st.name || nsNameFromSentence(st.said) || '';
  const paperHtml = () => {
    if (st.step === 'keep' && st.list) {
      return `<div class="nss-pg"><h4>${nsEsc(nameOf() || i18t('ns_untitled'))}</h4>${st.list.map((x, i) => `<label class="nss-sec${x.on ? '' : ' is-off'}"><input type="checkbox" data-nss-sec="${i}"${x.on ? ' checked' : ''}><span><b>${i + 1}. ${nsEsc(x.heading)}</b>${x.src ? `<span class="nss-w is-${x.src}">${nsEsc(i18t(SRC[x.src]))}</span>` : ''}${x.intent ? `<span class="nss-it">${nsEsc(x.intent)}</span>` : ''}</span></label>`).join('')}</div>
        <p class="nss-note">${nsEsc(i18t('nsl_keep_note'))}</p>`;
    }
    return `<div class="nss-pg"><h4 id="nss-name">${nsEsc(nameOf() || i18t('nsl_new_paper'))}</h4><div class="nss-bars" aria-hidden="true">${'<div><i></i><i></i><i class="s"></i></div>'.repeat(4)}</div></div>
      <p class="nss-note">${nsEsc(i18t('nsl_new_note'))}</p>`;
  };
  const kept = () => (st.list || []).filter(x => x.on).length;
  const leftHtml = () => {
    if (st.step === 'keep') {
      const n = kept();
      return `<label class="nss-fld"><span>${nsEsc(i18t('ns_what_for'))}</span><textarea id="nss-say" rows="3" maxlength="${NS_SAY_MAX}">${nsEsc(st.said)}</textarea></label>
        <div class="nss-foot"><button type="button" class="ui-btn" data-nsl-back>${nsEsc(i18t('act_back'))}</button><button type="button" class="ui-btn" data-nss-again>${nsEsc(i18t('tb_pb_start_again'))}</button><span class="sp"></span><button type="button" class="ui-btn" data-nss-mine>${nsEsc(i18t('tb_walk_mine'))}</button></div>
        <div class="nss-foot"><span class="sp"></span><button type="button" class="ui-btn ui-btn-primary" data-nss-open${n ? '' : ' disabled'}>${nsEsc(i18tn('nsl_open_n', n, { n }))}</button></div>`;
    }
    return `<label class="nss-fld"><span>${nsEsc(i18t('ns_what_for'))}</span><textarea id="nss-say" rows="5" maxlength="${NS_SAY_MAX}" placeholder="${nsEsc(i18t('ns_what_for_ph'))}">${nsEsc(st.said)}</textarea></label>
      <div class="nss-ex">${nsEsc(i18t('nsl_try'))} <button type="button" class="nsl-or" data-nss-ex="1">${nsEsc(i18t('nsl_ex1_t'))}</button><button type="button" class="nsl-or" data-nss-ex="2">${nsEsc(i18t('nsl_ex2_t'))}</button></div>
      <div class="nss-foot"><button type="button" class="ui-btn" data-nsl-back>${nsEsc(i18t('act_back'))}</button><span class="sp"></span><button type="button" class="ui-btn ui-btn-primary" data-nss-go${ai ? '' : ` title="${nsEsc(i18t('tb_pb_nokey'))}"`}>${nsEsc(ai ? i18t('ns_propose') : i18t('ns_open_builder'))}</button></div>`;
  };
  const sub = () => st.step === 'keep' && st.list
    ? i18t('tb_out_lead', { n: st.list.length, lib: st.list.filter(x => x.src === 'lib').length, std: st.list.filter(x => x.src === 'std').length, ai: st.list.filter(x => x.src === 'ai').length })
    : i18t('nsl_new_sub');
  const paint = () => nsMount(`<div class="nsl">${nsLgHead(i18t('ns_scratch'), sub())}<div class="nss-two"><div class="nss-l">${leftHtml()}<div class="nsl-say" data-nsl-say></div></div><div class="nss-r">${paperHtml()}</div></div></div>`);
  const open = async (btn, walk) => {
    if (st.busy) return; st.busy = true;
    const was = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = i18t('ns_opening'); }
    try {
      const cats = typeof templateCategories === 'function' ? templateCategories().map(c => c.id) : ['sales', 'procurement', 'employment', 'nda', 'other'];
      const d = st.d;
      const made = await nsCreate({ name: nameOf() || i18t('ns_untitled'), category: d && cats.includes(d.category) ? d.category : 'other', origin: 'built_in_hati' });
      closeModal();
      /* THE BUILDER OPENS ALREADY HOLDING THE SECTIONS KEPT HERE: the same outline, the unticked named, added at once */
      const off = (st.list || []).filter(x => !x.on).map(x => x.heading);
      nsOpen(made.tid, made.vid, { kind: 'scratch', said: st.said, outline: d ? { sections: d.sections || [], note: d.note || '' } : null, off, add: !!d, walk });
    } catch (e) { st.busy = false; if (btn) { btn.disabled = false; btn.textContent = was; } nsLgSay(nsLgHost(), e.message || String(e), true); }
  };
  const propose = async btn => {
    st.said = String(st.said || '').trim().slice(0, NS_SAY_MAX);
    if (!ai) return open(btn, true);
    if (!st.said) { nsLgSay(nsLgHost(), i18t('tb_pb_say_first'), true); return; }
    if (st.busy) return; st.busy = true; btn.disabled = true; btn.textContent = i18t('ns_proposing'); nsLgSay(nsLgHost(), '');
    try {
      const d = await api('ai/outline', 'POST', { sentence: st.said, kind: '', required: [], title: true }, { quiet: true });
      st.busy = false;
      st.d = d; st.name = (d && d.title) || nsNameFromSentence(st.said) || '';
      /* the same list the Builder would draw (tbOutlineFrom): the model's headings, then Our standards' open positions */
      st.list = typeof tbOutlineFrom === 'function' ? tbOutlineFrom(d, st.said).sections : ((d && d.sections) || []).map(x => ({ heading: x.heading, intent: x.intent || '', on: !x.optional }));
      st.step = 'keep'; paint();
    } catch (e) { st.busy = false; btn.disabled = false; btn.textContent = i18t('ns_propose'); nsLgSay(nsLgHost(), nsWhy(e), true); }
  };
  const host = nsLgHost(); if (!host) return;
  nsLgWire(host, {
    click: (e, t) => {
      const ex = t.closest('[data-nss-ex]'); if (ex) { st.said = i18t('nsl_ex' + ex.getAttribute('data-nss-ex')); paint(); return; }
      const g = t.closest('[data-nss-go]'); if (g) { propose(g); return; }
      if (t.closest('[data-nss-again]')) { st.step = 'say'; st.list = null; st.d = null; st.name = ''; paint(); return; }
      const m = t.closest('[data-nss-mine]'); if (m) { open(m, false); return; }
      const op = t.closest('[data-nss-open]'); if (op) { if (!kept()) { nsLgSay(nsLgHost(), i18t('tb_pb_none_ticked'), true); return; } open(op, true); }
    },
    input: e => {
      if (e.target && e.target.id === 'nss-say') { st.said = e.target.value || '';
        if (st.step === 'say') { const h = document.getElementById('nss-name'); if (h) h.textContent = nsNameFromSentence(st.said) || i18t('nsl_new_paper'); } }
    },
    change: e => {
      const b = e.target && e.target.closest && e.target.closest('[data-nss-sec]'); if (!b || !st.list) return;
      const x = st.list[Number(b.getAttribute('data-nss-sec'))]; if (x) { x.on = b.checked; paint(); }
    },
  });
  paint();
  const box = document.getElementById('nss-say'); if (box) setTimeout(() => { try { box.focus(); } catch (_) {} }, 40);
}

/* ---------------- THE OTHER SIDE'S PAPER — the Legora way, simple ----------------
   One line says what it is for, then one drop area. Once read: Name, Whose paper, Stream, Blanks, Save their paper, and
   the opening of their paper on HaTi's one paper width. Saved, it is kept as THEIR paper (theirs, party) and Draft on
   it now opens New agreement on Their paper with it chosen. WHOSE PAPER is read off their own words where a company
   name is written there (never guessed), else typed. */
function nsTheirParty(text) {
  const me = String((typeof FIRST_PARTY === 'object' && FIRST_PARTY && FIRST_PARTY.name) || (typeof FIRST_PARTY === 'string' ? FIRST_PARTY : '')).toLowerCase();
  const re = /\b([A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,4}\s+(?:Ltd|Limited|LLC|Inc|PLC|plc|AB|GmbH|S\.A\.|SA|LLP|Corp|Corporation|Company))\b\.?/g;
  const head = String(text || '').slice(0, 3000);
  let m; while ((m = re.exec(head))) { const n = m[1].trim(); if (!me || n.toLowerCase() !== me) return n; }
  return '';
}
function nsOpenTheirs() {
  nsStyle();
  const st = { m: 'drop', html: '', text: '', fileName: '', source: 'paste', name: '', party: '', folder: '', blanks: [], turn: true, saved: null, busy: false };
  let editor = null;
  const folders = (typeof visibleFolders === 'function' ? visibleFolders() : Object.values(typeof FOLDERS === 'object' ? FOLDERS : {})) || [];
  const purpose = `<p class="nso-purpose">${nsEsc(i18t('nsl_cp_purpose'))}</p>`;
  const head = nsLgHead(i18t('ns_cp_t'), '');
  const dropHtml = () => `<div class="nso-drop" data-nsl-drop><b>${nsEsc(i18t('nsl_cp_drop'))}</b>
    <span><label class="nsl-or">${nsEsc(i18t('nsl_choose_file'))}<input type="file" id="nso-file" accept=".docx,.pdf,.txt,.md" hidden></label> · <button type="button" class="nsl-or" data-nso-paste>${nsEsc(i18t('nsl_cp_paste'))}</button></span>
    <span class="nso-hint">${nsEsc(i18t('nsl_cp_kept'))}</span></div>`;
  const pasteHtml = () => `<div class="nsl-paste"><div id="nso-paste-box" class="ns-paste scroll-thin doc-surface" data-placeholder="${nsEsc(i18t('lb_open_in_word'))}"></div>
    <div class="nsl-paste-f"><button type="button" class="ui-btn ui-btn-sm" data-nso-paste-x>${nsEsc(i18t('act_cancel'))}</button><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-nso-read>${nsEsc(i18t('nsl_cp_read_go'))}</button></div></div>`;
  const secsN = () => { try { return (nsCopy(st.html, null, '').blocks || []).filter(b => b.blockType === 'heading').length; } catch (_) { return 0; } };
  const opening = () => {
    if (typeof document === 'undefined') return '';
    const t = document.createElement('div'); t.innerHTML = typeof sanitizeRich === 'function' ? sanitizeRich(st.html) : st.html;
    const kids = [...t.children]; let n = 0; const out = [];
    for (const k of kids) { out.push(k.outerHTML); n += String(k.textContent || '').length; if (n > 1200 || out.length >= 8) break; }
    return out.join('');
  };
  const lineHtml = (k, label, inner, change) => `<div class="nso-line"><span class="nso-lab">${nsEsc(label)}</span><span class="nso-val">${inner}</span>${change ? `<button type="button" class="nsl-or" data-nso-change="${k}">${nsEsc(i18t('nsl_cp_change'))}</button>` : ''}</div>`;
  const readHtml = () => {
    const n = secsN(), b = st.blanks.length;
    const streamSel = `<select id="nso-stream" aria-label="${nsEsc(i18t('nsl_cp_stream'))}"><option value="">${nsEsc(i18t('nsl_stream_pick'))}</option>${folders.map(f => `<option value="${nsEsc(f.id)}"${f.id === st.folder ? ' selected' : ''}>${nsEsc(f.name)}</option>`).join('')}</select>`;
    return (st.saved ? `<div class="nso-ok"><span>${nsEsc(i18t('nsl_cp_saved', { name: st.saved.name }))}</span><span class="sp"></span><button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-nso-draft>${nsEsc(i18t('nsl_cp_draft'))}</button><button type="button" class="ui-btn ui-btn-sm" data-nsl-back>${nsEsc(i18t('nsl_cp_back'))}</button></div>` : '')
      + lineHtml('name', i18t('nsl_cp_name'), `<input id="nso-name" value="${nsEsc(st.name)}" ${st.saved ? 'disabled' : ''}>`, !st.saved)
      + lineHtml('party', i18t('nsl_cp_whose'), `<input id="nso-party" value="${nsEsc(st.party)}" placeholder="${nsEsc(i18t('nsl_cp_whose_ph'))}" ${st.saved ? 'disabled' : ''}>`, !st.saved)
      + lineHtml('stream', i18t('nsl_cp_stream'), st.saved ? nsEsc(nsLgStreamName(st.folder) || '') : streamSel, false)
      + `<div class="nso-line"><span class="nso-lab">${nsEsc(i18t('nsl_cp_blanks'))}</span><span class="nso-val">${b ? `<label class="nso-tick"><input type="checkbox" id="nso-turn"${st.turn ? ' checked' : ''}${st.saved ? ' disabled' : ''}> ${nsEsc(i18tn('nsl_cp_blanks_n', b, { n: b }))}</label>` : nsEsc(i18t('nsl_cp_blanks_none'))}</span></div>`
      + (st.saved ? '' : `<div class="nso-save"><button type="button" class="ui-btn ui-btn-primary" data-nso-save>${nsEsc(i18t('nsl_cp_save'))}</button></div>`)
      + `<div class="nso-sheet"><div class="nso-mini doc-surface">${opening()}<div class="nso-pgno">${nsEsc(i18tn('nsl_cp_first', n, { n }))}</div></div></div>`;
  };
  const paint = () => {
    nsMount(`<div class="nsl nso">${head}${purpose}<div class="nsl-say" data-nsl-say></div>${st.m === 'drop' ? dropHtml() : st.m === 'paste' ? pasteHtml() : readHtml()}</div>`);
    if (st.m === 'paste') { const box = document.getElementById('nso-paste-box'); if (box && typeof richEditor === 'function') { editor = richEditor(box, {}); setTimeout(() => editor.focus && editor.focus(), 30); } }
  };
  const took = (html, text, fileName, source) => {
    st.html = html; st.text = text || (typeof richToText === 'function' ? richToText(html) : String(html).replace(/<[^>]*>/g, ' '));
    st.fileName = fileName || ''; st.source = source;
    st.name = (typeof nsDocTitle === 'function' ? nsDocTitle(html, fileName) : '') || String(fileName || '').replace(/\.[a-z0-9]+$/i, '') || '';
    st.party = nsTheirParty(st.text);
    st.blanks = typeof detectBlanks === 'function' ? detectBlanks(st.text) : [];
    st.m = 'read'; paint();
  };
  const readFile = async file => {
    if (!file) return;
    nsLgSay(nsLgHost(), i18t('nsl_cp_reading'));
    try { const r = await nsReadFile(file, m => nsLgSay(nsLgHost(), m)); took(r.html, r.text, r.fileName, 'upload'); }
    catch (err) { nsLgSay(nsLgHost(), err.message || String(err), true); }
  };
  const save = () => {
    if (st.busy) return;
    const name = String((document.getElementById('nso-name') || {}).value || st.name).trim();
    st.party = String((document.getElementById('nso-party') || {}).value || '').trim();
    st.folder = String((document.getElementById('nso-stream') || {}).value || st.folder || '');
    st.turn = !!(document.getElementById('nso-turn') || {}).checked;
    if (!name) { nsLgSay(nsLgHost(), i18t('lb_give_template_name'), true); return; }
    if (String(st.text || '').trim().length < 40) { nsLgSay(nsLgHost(), i18t('lib_too_short'), true); return; }
    st.busy = true;
    let extra = { format: typeof RICH_FORMAT === 'string' ? RICH_FORMAT : 'rich', chars: st.text.length, theirs: true, party: st.party };
    if (st.turn && st.blanks.length && typeof convertDetectedBlanks === 'function') {
      const r = convertDetectedBlanks(st.html, st.blanks.filter(d => st.html.includes(d.raw)));
      extra = { ...extra, fields: r.fields, body: r.body };
    }
    const rec = typeof saveTemplateRecord === 'function' ? saveTemplateRecord(name, st.folder || 'corp', st.html, st.source, extra) : null;
    st.busy = false;
    if (!rec) return;
    st.name = name; st.saved = rec; paint();
    if (typeof updateSidebarCounts === 'function') try { updateSidebarCounts(); } catch (_) {}
  };
  const host = nsLgHost(); if (!host) return;
  nsLgWire(host, {
    click: (e, t) => {
      if (t.closest('[data-nso-paste]')) { st.m = 'paste'; paint(); return; }
      if (t.closest('[data-nso-paste-x]')) { st.m = 'drop'; paint(); return; }
      if (t.closest('[data-nso-read]')) { const html = editor ? editor.get() : ''; if (!String(html).replace(/<[^>]*>/g, '').trim()) { nsLgSay(nsLgHost(), i18t('lib_paste_first'), true); return; } took(html, '', '', 'paste'); return; }
      const ch = t.closest('[data-nso-change]'); if (ch) { const el = document.getElementById('nso-' + ch.getAttribute('data-nso-change')); if (el && typeof fieldFocus === 'function') fieldFocus(el); else if (el) el.focus(); return; }
      if (t.closest('[data-nso-save]')) { save(); return; }
      if (t.closest('[data-nso-draft]') && st.saved) { const id = st.saved.id, party = st.saved.party || ''; closeModal(); if (typeof openNewAgreement === 'function') openNewAgreement({ paper: 'kept', kept: id, prefill: party ? { counterparty: party } : null }); }
    },
    change: e => { if (e.target && e.target.id === 'nso-file') readFile(e.target.files && e.target.files[0]); if (e.target && e.target.id === 'nso-stream') st.folder = e.target.value || ''; },
    input: e => { if (e.target && e.target.id === 'nso-name') st.name = e.target.value || ''; if (e.target && e.target.id === 'nso-party') st.party = e.target.value || ''; },
    drag: (ev, e) => { const z = e.target && e.target.closest && e.target.closest('[data-nsl-drop]'); if (!z) return; e.preventDefault();
      z.classList.toggle('is-over', ev === 'dragover'); if (ev === 'drop') readFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); },
  });
  paint();
}

Object.assign(window, { NS_STARTS, NS_TABS, NS_SAY_MAX, NS_GATED, openNewStandard, nsGo, nsOpenScratch, nsOpenTemplate, nsOpenContract,
  nsMount, nsHostSet, nsHostBack, nsHostOn, nsTplMake, nsCtrMake,
  nsLgOn, nsLgInitials, nsLgRowHtml, nsLgFirstLine, nsLgMatches, nsLgTemplate, nsLgContract, nsLgScratch, nsOpenTheirs, nsTheirParty,
  nsReadFile, nsCopy, nsDocTitle, nsNameFromSentence, nsBuiltinCategory, nsHasWording, nsCreate, nsFill });
