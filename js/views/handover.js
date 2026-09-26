/* ============================================================
   REDLINE HERE, SIGN THERE — the screens (26 Sep 2026)
   ============================================================
   Young's go on "Redline Here, Sign There", every decision as recommended.
   js/outside.js is the reading, shared with the server; this file is what a
   person sees and presses on the Signing tab of a file THEY sign:

     · who runs the signing — the route, changeable until the handover
     · Hand over for signing, in the place of the Sign button, holding on the
       same one list (signBlockers / signReadiness) the Sign button holds on
     · the handover window: how they agreed, who signs for us, how the Word
       file leaves — and the words lock
     · the waiting card: the stage and the days, Send again, Chase them,
       Check before we sign, the still-live question, Reopen
     · filing the signed copy: the word check, who signed, the dates, how it
       was signed, and File as signed — the contract takes its number

   NOTHING HERE WRITES A HANDOVER. Every act on one goes to
   POST /api/contracts/:id/handover, which writes it on the STORED record, and
   the browser adopts what comes back. The filing itself is the ordinary save,
   guarded as a difference by the server. */

const HO_FILE_ACCEPT = '.pdf,.docx,.txt,.png,.jpg,.jpeg';
const HO_VIA_KEYS = { docusign: 'ho_via_docusign', esign: 'ho_via_esign', own: 'ho_via_own', paper: 'ho_via_paper', other: 'ho_via_else' };
const _hoEsc = s => (typeof esc === 'function') ? esc(String(s == null ? '' : s))
  : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _hoDay = iso => { const d = String(iso || '').slice(0, 10);
  return (d && typeof fmtDocDate === 'function') ? (fmtDocDate(d) || d) : d; };
const _hoMe = () => (typeof currentUser === 'function' && currentUser()) || null;

/* ============================================================
   THE AGREED WORDING — what goes out, and what comes back is checked against
   ============================================================
   The negotiation's own resolved body where there is one (every accepted
   change built in), else the stored working text, else the words read out of
   the uploaded file. READING MUST NOT WRITE: negoResolvedBody calls negoInit,
   which creates a negotiation — so it is asked only where one already exists
   and its change list is already an array. */
function outsideAgreedHtml(c){
  if (!c) return '';
  try {
    if (c.negotiation && Array.isArray(c.changes) && typeof negoResolvedBody === 'function'){
      const b = negoResolvedBody(c);
      if (b) return String(b);
    }
    if (c.negotiation && c.negotiation.baselineBody) return String(c.negotiation.baselineBody);
  } catch (_) {}
  if (c.redlineText){
    const rich = typeof isRich === 'function' ? isRich(c.format) : c.format === 'rich';
    return rich ? String(c.redlineText) : _hoTextToHtml(c.redlineText);
  }
  if (c.upload && c.upload.extractedText) return _hoTextToHtml(c.upload.extractedText);
  return '';
}
function _hoTextToHtml(text){
  return String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    .map(l => `<p>${_hoEsc(l)}</p>`).join('');
}
/* The agreed wording as the paragraphs the word check compares — each block
   of the document one paragraph, carrying the clause it sits under so a
   difference can be named the way a person names it ("14.2 · Notice"). */
function outsideAgreedParas(c){
  const html = outsideAgreedHtml(c);
  if (!html) return [];
  if (typeof document === 'undefined'){
    return String(html).replace(/<\/(p|h[1-6]|li|tr)>/gi, '\n').replace(/<[^>]+>/g, '')
      .split('\n').map(t => ({ text: t.trim() })).filter(x => x.text);
  }
  const d = document.createElement('div');
  d.innerHTML = html;
  const out = [];
  let head = '', group = 0;
  d.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,tr').forEach(el => {
    if (el.closest('li') && el.tagName !== 'LI' && el.closest('li') !== el) return;
    if (el.tagName === 'P' && el.closest('li,td,th')) return;
    const text = (el.tagName === 'TR'
      ? Array.from(el.children).map(td => td.textContent.trim()).filter(Boolean).join(' \t ')
      : el.textContent).replace(/\s+/g, ' ').trim();
    if (!text) return;
    const own = (typeof ohStripMarker === 'function') ? ohStripMarker(text).marker : '';
    /* THE DOCUMENT'S NAME: the first block, carrying no clause number, short,
       and set as a title — an h1, capitals, or the contract's own name. Their
       template may put their company beside it (outsideCompare). */
    const title = !out.length && !own && text.split(/\s+/).length <= 12
      && (el.tagName === 'H1' || (/[A-Z]/.test(text) && text === text.toUpperCase())
        || text.toLowerCase() === String(c.name || '').trim().toLowerCase());
    if (/^H[1-6]$/.test(el.tagName)){ head = text.slice(0, 80); group += 1; }
    out.push({ text, title, group: String(group), label: [own, /^H[1-6]$/.test(el.tagName) ? '' : head].filter(Boolean).join(' · ') || head });
  });
  return out;
}
function outsideAgreedPlain(c){ return outsideAgreedParas(c).map(p => p.text).join('\n'); }
/* The fingerprint the handover records, and the word count beside it. */
async function outsideAgreedStamp(c){
  const text = outsideAgreedPlain(c);
  const norm = (typeof ohNorm === 'function' ? ohNorm(text) : text.toLowerCase()).replace(/\s+/g, ' ').trim();
  const hash = (typeof sha256 === 'function') ? await sha256(norm) : '';
  return { hash, words: norm ? norm.split(' ').length : 0 };
}

/* ---- A BLANK STILL IN THE AGREED WORDS ----
   The pattern is js/outside.js's (outsideBlanksIn), shared with the server,
   which reads the very Word file handed over and refuses one carrying a blank:
   one reading, two hosts. */
/* Read off the agreed html with its tags struck, not through the paragraph
   walk: this is asked by the one list on every paint of the Signing tab, and a
   blank is a run of characters — it needs no structure and no DOM. */
function outsideBlanksOf(c){
  const text = String(outsideAgreedHtml(c) || '').replace(/<\/(p|h[1-6]|li|tr|td|th|div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return outsideBlanksIn(text);
}

/* ---- THE WORD FILE: the words and their structure, and no design ----
   The agreed body through the product's own Word writer — the same writer a
   round sent as Word uses — with no comments, no marks and none of HaTi's own
   paper around it: no title band, no ruled lines for the parties. They put
   it into their own contract design, so it carries headings, numbering and
   tables and nothing else. */
function wordAgreedFile(c){
  if (typeof docxExportTracked !== 'function') throw new Error(i18t('ct_word_writer_missing'));
  let html = outsideAgreedHtml(c);
  if (typeof sanitizeRich === 'function') html = sanitizeRich(html);
  const me = _hoMe();
  const out = docxExportTracked(html, { author: (me && me.name) || 'HaTi', comments: [] });
  const tr = out.tracked || {};
  if ((Number(tr.ins) || 0) + (Number(tr.del) || 0) > 0) throw new Error(i18t('ho_word_not_clean'));
  return { bytes: out.bytes, name: `${contractRef(c)}-agreed.docx` };
}
function _hoDownloadBytes(bytes, name, mime){
  try {
    const blob = new Blob([bytes], { type: mime || (window.DOCX_MIME || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch (_) { return false; }
}

/* ============================================================
   WHO RUNS THE SIGNING — the route, changeable until the handover
   ============================================================ */
function outsideMayChangeRoute(c){
  if (!c || (typeof canEdit === 'function' && !canEdit())) return false;
  if (typeof negoExecuted === 'function' ? negoExecuted(c) : c.status === 'Signed') return false;
  if (typeof handoverActive === 'function' && handoverActive(c)) return false;
  if (typeof negoAnySignature === 'function' && negoAnySignature(c)) return false;
  if (typeof contractOnHold === 'function' && contractOnHold(c)) return false;
  return true;
}
async function outsideSetRoute(c, route, after){
  const to = route === 'outside' ? 'outside' : 'inside';
  if (!outsideMayChangeRoute(c) || signRouteOf(c) === to) return false;
  const working = typeof contractIsWorkingFile === 'function' && contractIsWorkingFile(c);
  const ok = await confirmDialog({
    title: i18t(to === 'outside' ? 'ho_to_out_title' : 'ho_to_in_title'),
    message: i18t(to === 'outside' ? 'ho_to_out_msg' : (working ? 'ho_to_in_msg_working' : 'ho_to_in_msg')),
    confirmLabel: i18t(to === 'outside' ? 'ho_route_out' : 'ho_route_in') });
  if (!ok) return false;
  if (to === 'outside') c.signRoute = 'outside'; else delete c.signRoute;
  /* In local mode there is no server to give a working file its number, so
     the browser gives it from the same counter every MK id comes from. */
  if (to === 'inside' && working && typeof API_MODE === 'function' && !API_MODE() && typeof nextId === 'function')
    c.contractNo = nextId();
  if (typeof logAudit === 'function') logAudit(c, 'Signing route', to === 'outside'
    ? 'They run the signing: HaTi hands the agreed words over as a Word file, they sign it their way, and the signed copy is filed here'
    : 'HaTi runs the signing, with signing links' + (working ? ' — the working file takes its contract number' : ''));
  if (typeof persist === 'function') persist(c);
  if (typeof flushSaves === 'function'){ try { await flushSaves(); } catch (_) {} }
  if (typeof toast === 'function') toast(i18t(to === 'outside' ? 'ho_route_now_out' : 'ho_route_now_in', { no: contractRef(c) }), 'ok');
  if (typeof after === 'function') after(); else _hoRepaint(c);
  return true;
}
/* A route change or a handover act moves the STATUS WORD in the room's head,
   which is built once per render — so the room is drawn again where it is the
   page on screen (it keeps its tab: wsTabDefaults), and the Signing tab's own
   painters answer everywhere else. */
function _hoRepaint(c){
  const room = typeof state !== 'undefined' && state && state.view === 'workspace' && state.activeId === (c && c.id)
    && typeof renderWorkspace === 'function';
  if (room){ try { renderWorkspace(); return; } catch (_) {} }
  try { if (typeof renderSignButton === 'function') renderSignButton(c); } catch (_) {}
  try { if (typeof renderAuditSection === 'function') renderAuditSection(c); } catch (_) {}
}

/* The card that says who runs the signing, drawn where the signature block
   is on a contract HaTi signs. The design and the signing are theirs. */
function outsideRouteCardHtml(c){
  const ho = typeof handoverOf === 'function' ? handoverOf(c) : null;
  const may = outsideMayChangeRoute(c);
  return `<div class="ho-route" data-ho-route-card="1">
    <div class="ho-route-h"><span>${_hoEsc(i18t('ho_route_card'))}</span>${may
      ? `<button type="button" class="ui-link" data-ho-route="inside">${_hoEsc(i18t('ho_route_change_in'))}</button>` : ''}</div>
    <div class="ho-route-v">${_hoEsc(i18t('ho_route_out'))}</div>
    <p class="ho-route-say">${_hoEsc(i18t(ho ? 'ho_route_card_out' : 'ho_route_card_before'))}</p>
  </div>`;
}

/* ============================================================
   THE SIGNING TAB ON A FILE THEY SIGN
   ============================================================
   renderSignButton hands over to this for an unsigned contract on the
   outside route. The column above it (renderSignSide) draws the one list as
   "Before the handover", and — once handed over — the waiting card in its
   place. This paints the route card and the one filled button. */
function renderOutsideSign(c){
  const wrap = document.getElementById('sign-wrap');
  const block = document.getElementById('sign-block');
  if (block) block.innerHTML = outsideRouteCardHtml(c);
  if (!wrap) return;
  const ho = handoverOf(c);
  const editor = typeof canEdit === 'function' ? canEdit() : true;
  if (ho){
    /* OUT WITH THEM: the one filled button is the one act that ends the wait. */
    wrap.innerHTML = editor
      ? `<button id="ho-file" type="button" class="ui-btn ui-btn-lg ui-btn-primary" style="width:100%">${typeof icon === 'function' ? icon('upload', 'w-[18px] h-[18px]') : ''} ${_hoEsc(i18t('ho_file_btn'))}</button>
         <p class="mt-2 text-[11px] text-center" style="color:var(--color-neutral-600)">${_hoEsc(i18t('ho_file_line'))}</p>`
      : `<p class="text-center" style="font-size:var(--t-label);color:var(--color-neutral-600)">${_hoEsc(i18t('ct_viewer_no_signing'))}</p>`;
    wrap.querySelector('#ho-file')?.addEventListener('click', () => openOutsideFiling(c));
  } else if (!editor){
    wrap.innerHTML = `<p class="text-center" style="font-size:var(--t-label);color:var(--color-neutral-600)">${_hoEsc(i18t('ct_viewer_no_signing'))}</p>`;
  } else {
    /* BEFORE THE HANDOVER: the button IS the list, exactly as Sign is — while
       anything holds it reads "Hand over — N to settle" and lands on the first
       open row; where the personal approval is all that holds it says "Send
       for approval". */
    const rd = typeof signReadiness === 'function' ? signReadiness(c) : { holds: [], noted: [] };
    const holdsN = rd.holds.length, notedN = rd.noted.length;
    const saOnly = holdsN > 0 && rd.holds.every(r => r.kind === 'signapproval');
    const saAsk = saOnly && rd.holds.some(r => r.sa && r.sa.askable);
    const saWait = saOnly && !saAsk && rd.holds.every(r => r.sa && r.sa.status === 'pending');
    const saWho = saWait ? rd.holds.map(r => (r.sa.need && r.sa.need.approverName) || i18t('sa_admins')).join(i18t('sa_and')) : '';
    const ready = !holdsN;
    const label = saAsk ? i18t('sa_ask_btn') : saWait ? i18t('sa_btn_waiting', { who: saWho })
      : holdsN ? i18tn('ho_btn_to_settle', holdsN, { n: holdsN }) : i18t('ho_hand_btn');
    const title = holdsN ? rd.holds.map(r => (typeof signRowTitle === 'function' ? signRowTitle(c, r) : r.kind)).join(' · ')
      : notedN ? rd.noted.map(r => (typeof signRowTitle === 'function' ? signRowTitle(c, r) : r.kind)).join(' · ') : '';
    wrap.innerHTML = `
      <button id="ho-hand" type="button" data-sign-holds="${holdsN}" title="${_hoEsc(title)}" class="ui-btn ui-btn-lg ${ready || saAsk ? 'ui-btn-primary' : 'sign-held'}" style="width:100%">
        ${typeof icon === 'function' ? icon(saAsk ? 'share' : 'send', 'w-[18px] h-[18px]') : ''} ${_hoEsc(label)}
      </button>
      <p class="mt-2 text-[11px] text-center" style="color:var(--color-neutral-600)">${_hoEsc(i18t(ready ? 'ho_hand_line' : saAsk ? 'sa_btn_ask_line' : saWait ? 'sa_btn_wait_line' : 'sc_btn_held_line'))}</p>`;
    wrap.querySelector('#ho-hand')?.addEventListener('click', () => {
      if (ready) openHandoverWindow(c);
      else if (saAsk && typeof openSignApprovalDialog === 'function') openSignApprovalDialog(c);
      else if (typeof signLandOnList === 'function') signLandOnList(c);
    });
  }
  try { if (typeof signPaintHeadLabel === 'function') signPaintHeadLabel(c); } catch (_) {}
  try { if (typeof renderSignSide === 'function') renderSignSide(c); } catch (_) {}
  try { if (typeof wireApprovalPanel === 'function') wireApprovalPanel(c); } catch (_) {}
  _hoWireRoute(c, document.getElementById('sign-block'));
}
function _hoWireRoute(c, root){
  if (!root) return;
  root.querySelectorAll('[data-ho-route]').forEach(b => b.addEventListener('click', () =>
    outsideSetRoute(c, b.getAttribute('data-ho-route'))));
}

/* ============================================================
   AGREE AND HAND OVER — the window
   ============================================================
   Everything HaTi asks before a signature was asked by the button that
   opened this (it opens only when nothing holds). What the window asks is the
   three things only the lead knows: how they agreed, who signs for us, and
   how the Word file leaves. Nothing in it asks how or by whom they will sign:
   that is theirs to decide. */
async function openHandoverWindow(c){
  if (!c) return;
  if (typeof flushSaves === 'function'){ try { await flushSaves(); } catch (_) {} }
  const signal = typeof cpReadyToSign === 'function' && cpReadyToSign(c)
    ? (typeof negoReadySignal === 'function' ? negoReadySignal(c, 'counterparty') : null) : null;
  const who = typeof outsideSignatory === 'function' ? outsideSignatory(c) : null;
  const pre = typeof shareModalPrefill === 'function'
    ? shareModalPrefill((typeof cachedShares === 'function' ? cachedShares(c) : []) || [], c) : { name: '', email: '' };
  const prog = (c.negotiation && Array.isArray(c.changes) && typeof negoProgress === 'function') ? negoProgress(c) : { total: 0, done: 0 };
  const round = c.negotiation && c.negotiation.round;
  const roundOpen = prog.total > 0;
  const today = (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10);
  const vN = (Array.isArray(c.versions) ? c.versions.length : 0) + (roundOpen ? 2 : 1);
  const FLD = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)';
  const L = t => `<div class="ho-l">${_hoEsc(t)}</div>`;
  /* MORE THAN ONE PARTY NEGOTIATED (Phase 2): each one's agreement is said by
     name and day — one Ready to sign from one link cannot speak for the
     others — and the Word file goes to each of them. */
  const multi = typeof partiesNegotiating === 'function' ? partiesNegotiating(c) : [];
  const many = multi.length > 1;
  const howHtml = many
    ? `<div class="ho-how">${multi.map(p => `<label class="ho-radio"><span>${_hoEsc(i18t('ho_how_party', { who: p.name }))}</span>
        <input type="date" max="${today}" value="${today}" data-ho-party-day="${_hoEsc(p.id)}" style="${FLD};width:auto;height:28px;margin-left:6px"></label>`).join('')}
        <div class="ho-sub">${_hoEsc(i18t('ho_how_each'))}</div></div>`
    : '';
  const toRows = many
    ? multi.map((p, i) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" data-ho-to-party="${_hoEsc(p.id)}">
        <input type="text" data-ho-to-name placeholder="${_hoEsc(i18t('ho_to_name_ph'))}" value="${_hoEsc(i ? '' : (pre.name || ''))}" style="${FLD}" aria-label="${_hoEsc(p.name)}">
        <input type="email" data-ho-to-email placeholder="${_hoEsc(i18t('ho_to_email_ph_for', { who: p.name }))}" value="${_hoEsc(p.email || (i ? '' : (pre.email || '')))}" style="${FLD}" aria-label="${_hoEsc(p.name)}">
      </div>`).join('')
    : '';
  openModal(`<div class="ho-win" style="padding:22px var(--s-6)">
    <h2 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;margin:0 0 var(--s-3)">${_hoEsc(i18t('ho_win_title'))}</h2>
    <div class="ho-grid">
      ${L(i18t('ho_win_agreed'))}
      <div>${_hoEsc(roundOpen ? i18t('ho_win_agreed_open', { round: round || 1, n: prog.total }) : i18t('ho_win_agreed_v', { v: vN, round: Math.max(1, (round || 1) - 1) }))}</div>
      ${L(i18t('ho_win_how'))}
      ${many ? howHtml : `<div class="ho-how">
        ${signal ? `<label class="ho-radio"><input type="radio" name="ho-how" value="signal" checked> <span>${_hoEsc(i18t('ho_how_signal', { who: signal.name || c.counterparty || '', when: typeof fmtDT === 'function' ? fmtDT(signal.at) : _hoDay(signal.at) }))}</span></label>` : ''}
        <label class="ho-radio"><input type="radio" name="ho-how" value="email"${signal ? '' : ' checked'}> <span>${_hoEsc(i18t('ho_how_email'))}</span>
          <input id="ho-how-day" type="date" max="${today}" value="${signal ? '' : today}" style="${FLD};width:auto;height:28px;margin-left:6px"></label>
      </div>`}
      ${L(i18t('ho_win_signs'))}
      <div>${who
        ? `<span>${_hoEsc(who.name)}${who.role ? ' · ' + _hoEsc(who.role) : ''} · ${_hoEsc(i18t('ho_from_order'))}</span> <button type="button" class="ui-link" id="ho-sig-change">${_hoEsc(i18t('ho_change'))}</button>`
        : `<span style="color:var(--st-amber-fg)">${_hoEsc(i18t('ho_sig_row_none'))}</span> <button type="button" class="ui-link" id="ho-sig-change">${_hoEsc(i18t('ho_name_signatory'))}</button>
           <div class="ho-sub">${_hoEsc(i18t('ho_sig_cost'))}</div>`}
        <div class="ho-sub">${_hoEsc(i18t('ho_sig_internal'))}</div></div>
      ${L(i18t('ho_win_file'))}
      <div>
        <div class="doc-read-seg" role="group" aria-label="${_hoEsc(i18t('ho_win_file'))}" id="ho-ch">
          <button type="button" data-ho-ch="email" aria-pressed="true">${_hoEsc(i18t('ho_ch_email'))}</button>
          <button type="button" data-ho-ch="download" aria-pressed="false">${_hoEsc(i18t('ho_ch_download'))}</button>
        </div>
        <div id="ho-email-box" style="margin-top:8px;display:grid;gap:6px">
          ${many ? toRows : `<input id="ho-to-name" type="text" placeholder="${_hoEsc(i18t('ho_to_name_ph'))}" value="${_hoEsc(pre.name || '')}" style="${FLD}">
          <input id="ho-to-email" type="email" placeholder="${_hoEsc(i18t('ho_to_email_ph'))}" value="${_hoEsc(pre.email || c.counterpartyEmail || '')}" style="${FLD}">`}
          <textarea id="ho-note" rows="3" style="${FLD};height:auto;padding:6px var(--field-pad-x);resize:vertical">${_hoEsc(i18t('ho_note_default'))}</textarea>
        </div>
      </div>
    </div>
    <p class="ho-lock">${_hoEsc(i18t('ho_win_lock'))}</p>
    <div id="ho-err" class="ho-err" hidden></div>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:var(--s-4)">
      <button id="ho-cancel" type="button" class="ui-btn">${_hoEsc(i18t('act_cancel'))}</button>
      <button id="ho-go" type="button" class="ui-btn ui-btn-primary">${_hoEsc(i18t('ho_go'))}</button>
    </div>
  </div>`, { maxWidth: (window.DLG_W && DLG_W.l) || '640px', label: i18t('ho_win_title') });
  const root = document.getElementById('modal-root');
  let channel = 'email';
  root.querySelectorAll('[data-ho-ch]').forEach(b => b.addEventListener('click', () => {
    channel = b.getAttribute('data-ho-ch') === 'download' ? 'download' : 'email';
    root.querySelectorAll('[data-ho-ch]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const box = document.getElementById('ho-email-box'); if (box) box.style.display = channel === 'email' ? 'grid' : 'none';
  }));
  document.getElementById('ho-cancel')?.addEventListener('click', closeModal);
  document.getElementById('ho-sig-change')?.addEventListener('click', () => {
    closeModal(); if (typeof openSignerPlanEditor === 'function') openSignerPlanEditor(c);
  });
  document.getElementById('ho-go')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const err = m => { const el = document.getElementById('ho-err'); if (el){ el.textContent = m; el.hidden = false; } };
    let how, to, also = [];
    if (many){
      const parties = [...root.querySelectorAll('[data-ho-party-day]')].map(i => ({ id: i.getAttribute('data-ho-party-day'), at: i.value || '' }));
      if (parties.some(p => !/^\d{4}-\d{2}-\d{2}$/.test(p.at) || p.at > today)) return err(i18t('ho_how_need_each'));
      how = { kind: 'email', parties };
      const rows = [...root.querySelectorAll('[data-ho-to-party]')].map(r => ({ partyId: r.getAttribute('data-ho-to-party'),
        name: ((r.querySelector('[data-ho-to-name]') || {}).value || '').trim(), email: ((r.querySelector('[data-ho-to-email]') || {}).value || '').trim() }));
      if (channel === 'email' && rows.some(r => !/.+@.+\..+/.test(r.email))) return err(i18t('ho_need_email_each'));
      to = rows[0] || { name: '', email: '' }; also = rows.slice(1);
    } else {
      const howKind = (root.querySelector('input[name="ho-how"]:checked') || {}).value || 'email';
      const day = (document.getElementById('ho-how-day') || {}).value || '';
      if (howKind === 'email' && (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today)) return err(i18t('ho_how_need_day'));
      how = howKind === 'signal' ? { kind: 'signal' } : { kind: 'email', at: day };
      to = { name: ((document.getElementById('ho-to-name') || {}).value || '').trim(),
        email: ((document.getElementById('ho-to-email') || {}).value || '').trim() };
      if (channel === 'email' && !/.+@.+\..+/.test(to.email)) return err(i18t('ho_need_email'));
    }
    btn.disabled = true; btn.textContent = i18t('ho_handing');
    const out = await outsideHandOver(c, { how, channel, to, also,
      note: ((document.getElementById('ho-note') || {}).value || '').trim(), signatoryId: who && who.id });
    if (out && out.ok){ closeModal(); return; }
    btn.disabled = false; btn.textContent = i18t('ho_go');
    err((out && out.error) || i18t('ho_hand_failed'));
  });
}
/* ---- THE ACT ----
   1. the negotiation is settled and the round closed (the handover closes an
      open round whose every change is decided)
   2. the agreed wording is kept as a version, and its fingerprint taken
   3. the save lands, then the Word file is built from exactly that wording
   4. the route checks everything again on the STORED record and writes the
      handover; the browser adopts what it wrote */
async function outsideHandOver(c, o){
  try {
    if (typeof negoInit === 'function' && !c.negotiation) negoInit(c);
    const prog = (Array.isArray(c.changes) && typeof negoProgress === 'function') ? negoProgress(c) : { total: 0, pending: 0 };
    if (prog.pending) return { ok: false, error: i18t('ho_changes_open') };
    if (prog.total && typeof negoAdvanceRound === 'function'){
      const me = _hoMe();
      if (!negoAdvanceRound(c, { by: (me && me.name) || 'System' })) return { ok: false, error: i18t('ng_round_cannot_close') };
    }
    if (typeof captureVersion === 'function') captureVersion(c, 'Agreed and handed over', (_hoMe() || {}).name, { auto: true, listed: true });
    const stamp = await outsideAgreedStamp(c);
    if (typeof persist === 'function') persist(c);
    if (typeof flushSaves === 'function') await flushSaves();
    const f = wordAgreedFile(c);
    const b64 = typeof bytesToBase64 === 'function' ? bytesToBase64(f.bytes) : '';
    const r = await api(`contracts/${encodeURIComponent(c.id)}/handover`, 'POST', {
      act: 'hand', how: o.how, channel: o.channel, to: o.to, also: o.also || [], note: o.note, signatoryId: o.signatoryId || null,
      version: Array.isArray(c.versions) ? c.versions.length : null, agreedHash: stamp.hash, agreedWords: stamp.words,
      file: { filename: f.name, content: b64 } });
    outsideAdopt(c, r);
    if (o.channel === 'download') _hoDownloadBytes(f.bytes, f.name);
    /* Said per address: every send the route recorded, delivered or not. */
    const sends = ((r && r.handover && r.handover.sends) || []).filter(x => x && x.channel === 'email');
    const sent = o.channel === 'email' ? (sends.length ? sends.every(x => x.emailSent) : !!(r && r.emailSent)) : true;
    const toWords = sends.length ? sends.map(x => x.to && x.to.email).filter(Boolean).join(', ') : o.to.email;
    if (typeof toast === 'function') toast(o.channel === 'email'
      ? (sent ? i18t('ho_done_email', { to: toWords }) : i18t('ho_done_outbox', { to: toWords }))
      : i18t('ho_done_download'), sent ? 'ok' : 'warn');
    _hoAfterAct(c);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) };
  }
}
/* What a handover route answers is adopted as it was written: the handover,
   the history, the approvals it cancelled, and the very audit lines — so the
   append-only merge on the next save sees each line once. */
function outsideAdopt(c, r){
  if (!c || !r) return;
  if ('handover' in r){ if (r.handover) c.handover = r.handover; else delete c.handover; }
  if (r.handoverHistory) c.handoverHistory = r.handoverHistory;
  if (Array.isArray(r.signApprovals)) c.signApprovals = r.signApprovals;
  if (Array.isArray(r.approvalChain)) c.approvalChain = r.approvalChain;
  if (Array.isArray(r.audit) && r.audit.length){
    c.audit = Array.isArray(c.audit) ? c.audit : [];
    r.audit.forEach(l => c.audit.push(l));
  }
}
function _hoAfterAct(c){
  _hoRepaint(c);
  try { if (typeof updateAlertBadge === 'function') updateAlertBadge(); } catch (_) {}
}
async function outsideAct(c, act, body){
  if (typeof flushSaves === 'function'){ try { await flushSaves(); } catch (_) {} }
  const r = await api(`contracts/${encodeURIComponent(c.id)}/handover`, 'POST', { act, ...(body || {}) });
  outsideAdopt(c, r);
  return r;
}

/* ============================================================
   OUT WITH THEM — the waiting card
   ============================================================
   Drawn at the top of the signing column while the agreed words are out.
   The stage and the days, what went where, who signs for us and whether
   their copy was checked, and when HaTi next reminds anybody. Its acts are
   the ones the design names; File the signed copy is the filled button
   under the column. */
function outsideWaitCardHtml(c){
  const ho = handoverOf(c);
  if (!ho) return '';
  const stage = handoverStage(c) || 'with';
  const days = handoverDays(c);
  const editor = typeof canEdit === 'function' ? canEdit() : true;
  const lastSend = (Array.isArray(ho.sends) ? ho.sends : []).slice(-1)[0] || null;
  const sentWord = !lastSend ? '' : lastSend.channel === 'download' ? i18t('ho_sent_download')
    : lastSend.emailSent ? i18t('ho_sent_delivered', { to: (lastSend.to && lastSend.to.email) || '' })
    : i18t('ho_sent_outbox', { to: (lastSend.to && lastSend.to.email) || '' });
  const check = handoverLastCheck(c);
  const sig = ho.signatory;
  const sigWord = sig ? i18t('ho_sig_told', { who: sig.name })
    + ' · ' + (check ? i18t(check.same ? 'ho_checked_same' : 'ho_checked_diff', { when: _hoDay(check.at) }) : i18t('ho_not_checked'))
    : i18t('ho_sig_row_none');
  const next = handoverNextReminderAt(c);
  const nextWord = Number.isFinite(next) ? i18t('ho_next_reminder', { day: _hoDay(new Date(next).toISOString()) }) : '';
  const chip = stage === 'partial' ? i18t('status_they_signed_short') : i18t('status_with_them_short');
  const row = (k, v, act) => `<div class="ho-row"><div class="ho-k">${_hoEsc(k)}</div><div class="ho-v">${v}${act || ''}</div></div>`;
  const partial = ho.partial && ho.partial.at ? row(i18t('ho_partial_k'),
    _hoEsc(i18t('ho_partial_v', { who: (ho.partial.signedBy || []).join(', ') || c.counterparty || '', when: _hoDay(ho.partial.at) })),
    ho.partial.fileId ? ` <button type="button" class="ui-link" data-ho-open-file="${_hoEsc(ho.partial.fileId)}" data-ho-open-name="${_hoEsc(ho.partial.fileName || '')}">${_hoEsc(i18t('ho_open_copy'))}</button>` : '') : '';
  const stale = stage === 'stale' ? `<div class="ho-live">
      <div>${_hoEsc(i18t('ho_live_q', { days }))}</div>
      ${editor ? `<div class="ho-acts"><button type="button" class="ui-btn ui-btn-sm" data-ho-act="live">${_hoEsc(i18t('ho_keep_waiting'))}</button>
      <button type="button" class="ui-btn ui-btn-sm ui-btn-danger" data-ho-act="close">${_hoEsc(i18t('ho_close_deal'))}</button></div>` : ''}
    </div>` : '';
  /* The one list's own card, borrowed by class (.kt-tri, as the pre-signature
     check borrows it): the waiting card stands where that card stood, so it
     wears its clothes, and a retune of one is a retune of both. */
  return `<section id="ho-wait" class="kt-tri ho-card" data-ho-stage="${stage}">
    <div class="kt-tri-head"><span class="kt-tri-t">${_hoEsc(i18t('ho_wait_title'))}</span><span class="ho-chip${stage === 'with' ? '' : ' is-' + stage}">${_hoEsc(chip)} · ${_hoEsc(typeof handoverWaitWords === 'function' ? handoverWaitWords(c) : String(days))}</span></div>
    ${stale}
    ${row(i18t('ho_handed_k'), _hoEsc(i18t('ho_handed_v', { when: _hoDay(ho.at), who: (ho.by && ho.by.name) || '' })))}
    ${row(i18t('ho_agreed_k'), _hoEsc(i18t('ho_agreed_v', { v: ho.version || '—', round: ho.round ? Math.max(1, ho.round - 1) : '—' })))}
    ${row(i18t('ho_sent_k'), _hoEsc(sentWord), editor ? ` <button type="button" class="ui-link" data-ho-act="send">${_hoEsc(i18t('ho_send_again'))}</button>` : '')}
    ${row(i18t('ho_design_k'), _hoEsc(i18t('ho_design_v')))}
    ${row(i18t('ho_signs_k'), _hoEsc(sigWord))}
    ${partial}
    ${nextWord ? row(i18t('ho_next_k'), _hoEsc(nextWord)) : ''}
    ${editor ? `<div class="ho-acts">
      <button type="button" class="ui-btn ui-btn-sm" data-ho-act="check">${_hoEsc(i18t('ho_check_btn'))}</button>
      <button type="button" class="ui-btn ui-btn-sm" data-ho-act="chase">${_hoEsc(i18t('ho_chase_btn'))}</button>
      <span style="flex:1"></span>
      <button type="button" class="ui-link" data-ho-act="reopen">${_hoEsc(i18t('ho_reopen_btn'))}</button>
    </div>` : ''}
  </section>`;
}
/* Every act on the waiting card, bound once per paint of the column. */
function wireOutsideWait(c, host){
  if (!host) return;
  const again = () => _hoAfterAct(c);
  host.querySelectorAll('[data-ho-act]').forEach(b => b.addEventListener('click', async () => {
    const act = b.getAttribute('data-ho-act');
    if (act === 'check') return openOutsideCheck(c);
    if (act === 'send') return openOutsideSendAgain(c);
    if (act === 'chase') return outsideChase(c);
    if (act === 'reopen') return outsideReopen(c);
    if (act === 'live'){
      b.disabled = true;
      try { await outsideAct(c, 'live'); if (typeof toast === 'function') toast(i18t('ho_live_kept'), 'ok'); }
      catch (e) { if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); }
      return again();
    }
    if (act === 'close') return outsideCloseDeal(c);
  }));
  host.querySelectorAll('[data-ho-open-file]').forEach(b => b.addEventListener('click', () =>
    outsideOpenFile(b.getAttribute('data-ho-open-file'), b.getAttribute('data-ho-open-name'))));
}
async function outsideOpenFile(fileId, name){
  if (!fileId) return;
  try {
    const f = await api('files/' + encodeURIComponent(fileId));
    const url = f && (f.dataUrl || f.data);
    if (!url) throw new Error(i18t('ho_file_gone'));
    if (typeof openDocReader === 'function' && /pdf|image/.test(String(f.mime || url))) return openDocReader({ dataUrl: url, name: name || f.name });
    const w = window.open('', '_blank');
    if (w){ w.document.write(`<iframe src="${url}" style="border:0;width:100%;height:100vh"></iframe>`); return; }
    _hoDownloadBytes(typeof dataUrlBytes === 'function' ? dataUrlBytes(url) : new Uint8Array(), name || f.name || 'copy', f.mime);
  } catch (e) { if (typeof toast === 'function') toast((e && e.message) || i18t('ho_file_gone'), 'err'); }
}
async function outsideChase(c){
  const ho = handoverOf(c); if (!ho) return;
  const ok = await confirmDialog({ title: i18t('ho_chase_title'), message: i18t('ho_chase_msg', { them: c.counterparty || '' }),
    confirmLabel: i18t('ho_chase_btn') });
  if (!ok) return;
  try {
    const r = await outsideAct(c, 'chase');
    if (typeof toast === 'function') toast(r && r.emailSent ? i18t('ho_chased') : (r && r.emailError) || i18t('ho_chase_outbox'), r && r.emailSent ? 'ok' : 'warn');
  } catch (e) { if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); }
  _hoAfterAct(c);
}
function openOutsideSendAgain(c){
  const ho = handoverOf(c); if (!ho) return;
  const FLD = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)';
  openModal(`<div style="padding:22px var(--s-6)">
    <h2 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;margin:0 0 var(--s-2)">${_hoEsc(i18t('ho_send_again_title'))}</h2>
    <p style="margin:0 0 var(--s-3);font-size:var(--t-body);color:var(--color-neutral-700)">${_hoEsc(i18t('ho_send_again_msg'))}</p>
    <div style="display:grid;gap:6px">
      <input id="ho-sa-name" type="text" placeholder="${_hoEsc(i18t('ho_to_name_ph'))}" value="${_hoEsc((ho.to && ho.to.name) || '')}" style="${FLD}">
      <input id="ho-sa-email" type="email" placeholder="${_hoEsc(i18t('ho_to_email_ph'))}" value="${_hoEsc((ho.to && ho.to.email) || '')}" style="${FLD}">
    </div>
    <div id="ho-sa-err" class="ho-err" hidden></div>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:var(--s-4)">
      <button id="ho-sa-cancel" type="button" class="ui-btn">${_hoEsc(i18t('act_cancel'))}</button>
      <button id="ho-sa-go" type="button" class="ui-btn ui-btn-primary">${_hoEsc(i18t('ho_send_again'))}</button>
    </div></div>`, { maxWidth: (window.DLG_W && DLG_W.m) || '520px', label: i18t('ho_send_again_title') });
  document.getElementById('ho-sa-cancel')?.addEventListener('click', closeModal);
  document.getElementById('ho-sa-go')?.addEventListener('click', async e => {
    const to = { name: (document.getElementById('ho-sa-name').value || '').trim(), email: (document.getElementById('ho-sa-email').value || '').trim() };
    const errEl = document.getElementById('ho-sa-err');
    if (!/.+@.+\..+/.test(to.email)){ errEl.textContent = i18t('ho_need_email'); errEl.hidden = false; return; }
    e.currentTarget.disabled = true;
    try {
      const r = await outsideAct(c, 'send', { to });
      closeModal();
      if (typeof toast === 'function') toast(r && r.emailSent ? i18t('ho_done_email', { to: to.email }) : i18t('ho_done_outbox', { to: to.email }), r && r.emailSent ? 'ok' : 'warn');
      _hoAfterAct(c);
    } catch (err) { e.currentTarget.disabled = false; errEl.textContent = (err && err.message) || String(err); errEl.hidden = false; }
  });
}
async function outsideReopen(c){
  const why = typeof promptDialog === 'function' ? await promptDialog({ title: i18t('ho_reopen_title'),
    message: i18t('ho_reopen_msg'), placeholder: i18t('ho_reopen_ph'), confirmLabel: i18t('ho_reopen_btn'), multiline: true }) : '';
  if (why == null) return;
  try {
    await outsideAct(c, 'reopen', { why: String(why || '').trim() });
    if (typeof toast === 'function') toast(i18t('ho_reopened'), 'ok');
  } catch (e) { if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); }
  _hoAfterAct(c);
}
/* THE DEAL DIES: closed as today — Declined — and a working file that is
   never signed never takes a number. The handover is reopened first so the
   words are not left locked on a record nobody will sign. */
async function outsideCloseDeal(c){
  const ok = await confirmDialog({ title: i18t('ho_close_title'), message: i18t('ho_close_msg'), confirmLabel: i18t('ho_close_deal'), danger: true });
  if (!ok) return;
  try { await outsideAct(c, 'reopen', { why: 'The deal was closed — nothing came back.' }); } catch (e) {
    if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return; }
  c.status = 'Declined';
  if (typeof logAudit === 'function') logAudit(c, 'Closed', 'Closed after nothing came back — the deal is off. A working file that is never signed never takes a contract number.');
  if (typeof persist === 'function') persist(c);
  if (typeof toast === 'function') toast(i18t('ho_closed'), 'ok');
  _hoAfterAct(c);
}

/* ============================================================
   READING A COPY THAT CAME BACK
   ============================================================
   The upload's own readers, in the upload's own order: a Word file through
   the Word reader, a PDF through the structured reader with the plain one
   behind it, anything else through the text reader, and a scan through OCR.
   What comes back is the words and where they came from — the check needs
   nothing else. */
async function outsideReadFile(file, onStep){
  if (!file) throw new Error(i18t('ho_choose_file'));
  if (typeof uploadMax === 'function' && file.size > uploadMax()) throw new Error(typeof uploadTooBigMsg === 'function' ? uploadTooBigMsg(file) : 'Too large');
  const dataUrl = await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => rej(new Error('read failed')); rd.readAsDataURL(file); });
  const mime = file.type || 'application/octet-stream';
  const word = typeof detectWordFile === 'function' ? detectWordFile(dataUrl, mime, file.name) : null;
  if (word === 'doc') throw new Error(typeof WORD_REFUSAL === 'string' ? WORD_REFUSAL : 'Save it as .docx or PDF first.');
  const fileHash = typeof sha256 === 'function' ? await sha256(dataUrl) : '';
  let text = '', textSource = 'none';
  if (word === 'docx'){ const w = await extractWordText(dataUrl); text = w.text || ''; textSource = 'docx-text'; }
  else if (/pdf/.test(mime) && typeof readPdfStructured === 'function'){
    try { const r = await readPdfStructured(dataUrlBytes(dataUrl).buffer); text = String(r.text || ''); }
    catch (_) { text = typeof extractDocText === 'function' ? await extractDocText(dataUrl, mime) : ''; }
    textSource = 'pdf-text';
  } else if (typeof extractDocText === 'function'){ text = await extractDocText(dataUrl, mime); textSource = 'pdf-text'; }
  if (typeof looksLikeText === 'function' && !looksLikeText(text)) text = '';
  if (typeof ocrNeeded === 'function' && word !== 'docx' && ocrNeeded(mime, text) && typeof ocrDocument === 'function'){
    if (typeof onStep === 'function') onStep(i18t('ho_reading_scan'));
    const o = await ocrDocument(dataUrl, mime, { onProgress: (done, total) => { if (typeof onStep === 'function') onStep(i18t('ho_reading_page', { n: Math.min(done + 1, total), total })); } });
    if (o && o.text){ text = o.text; textSource = o.textSource || 'ocr'; }
    try { if (typeof ocrRelease === 'function') await ocrRelease(); } catch (_) {}
  }
  return { file, name: file.name, size: file.size, mime, dataUrl, fileHash, text, textSource, word };
}
function _hoCompare(c, read){
  const ocr = typeof isOcrText === 'function' ? isOcrText(read.textSource) : /ocr/.test(String(read.textSource || ''));
  return outsideCompare(outsideAgreedParas(c), read.text || '', { ocr });
}
/* The differences, clause by clause, both wordings: struck where the agreed
   words are not in their copy, marked where their copy has words the agreed
   version does not. Their design and numbering are not differences. */
function outsideDiffHtml(r){
  if (!r) return '';
  const chunk = (row, cls) => row.map(x => x.t === 'k' ? _hoEsc(x.s) : `<span class="${cls}">${_hoEsc(x.s)}</span>`).join(' ');
  const items = [];
  (r.renamed || []).forEach(x => items.push(`<div class="ho-diff-term">${_hoEsc(i18t('ho_renamed', { from: x.from, to: x.to, n: x.n }))}</div>`));
  (r.changed || []).forEach(x => items.push(`<div class="ho-diff">
    <div class="ho-diff-h">${_hoEsc(x.label || x.marker || i18t('ho_a_passage'))}${x.theirNo ? ` · <span class="ho-their">${_hoEsc(i18t('ho_their_no', { no: x.theirNo }))}</span>` : ''}</div>
    <div class="ho-diff-r"><span class="ho-diff-k">${_hoEsc(i18t('ho_agreed_word'))}</span><span>${chunk(x.a, 'ho-del')}</span></div>
    <div class="ho-diff-r"><span class="ho-diff-k">${_hoEsc(i18t('ho_signed_word'))}</span><span>${chunk(x.b, 'ho-ins')}</span></div>
  </div>`));
  (r.missing || []).forEach(x => items.push(`<div class="ho-diff">
    <div class="ho-diff-h">${_hoEsc(x.label || x.marker || i18t('ho_a_passage'))} · ${_hoEsc(i18t('ho_missing'))}</div>
    <div class="ho-diff-r"><span class="ho-diff-k">${_hoEsc(i18t('ho_agreed_word'))}</span><span class="ho-del">${_hoEsc(x.agreed)}</span></div>
  </div>`));
  (r.inserted || []).forEach(x => items.push(`<div class="ho-diff">
    <div class="ho-diff-h">${_hoEsc(i18t('ho_added_between'))}</div>
    <div class="ho-diff-r"><span class="ho-diff-k">${_hoEsc(i18t('ho_signed_word'))}</span><span class="ho-ins">${_hoEsc(x.text)}</span></div>
  </div>`));
  const more = Math.max(0, (r.changedCount || 0) - (r.changed || []).length) + Math.max(0, (r.missingCount || 0) - (r.missing || []).length);
  if (more) items.push(`<div class="ho-sub">${_hoEsc(i18t('ho_more_diffs', { n: more }))}</div>`);
  return items.join('');
}
/* The one line a check says, in the reader's language. */
function outsideCheckLine(r){
  if (!r) return '';
  if (r.unrelated) return i18t('ho_cmp_unrelated');
  if (r.same) return i18tn('ho_cmp_same', r.clauses, { n: r.clauses });
  const n = (r.changedCount || 0) + (r.missingCount || 0) + (r.inserted ? r.inserted.length : 0);
  return i18tn('ho_cmp_diff', n, { n });
}

/* ============================================================
   CHECK BEFORE WE SIGN — the real safeguard (decision 6)
   ============================================================
   Once both sides have signed there is no sending it back, so the moment a
   changed clause costs nothing to fix is before OUR signature. Offered to our
   signatory by name at the handover and recorded — never a gate, since the
   signing happens where HaTi cannot stop it. */
function openOutsideCheck(c){
  _hoFileDialog(c, {
    title: i18t('ho_check_title'), lead: i18t('ho_check_lead'),
    go: i18t('ho_check_btn'),
    onRead: async (read, r, ui) => {
      ui.result(r, read);
      try {
        await outsideAct(c, 'check', { fileName: read.name, sha256: read.fileHash,
          result: { same: r.same, unrelated: r.unrelated, changedCount: r.changedCount, missingCount: r.missingCount,
            inserted: (r.inserted || []).length, line: outsideCompareLine(r) } });
      } catch (e) { if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); }
      _hoAfterAct(c);
    },
  });
}
/* A file dialog that reads, compares and shows — the one shape the check
   and the first step of the filing share. */
function _hoFileDialog(c, o){
  openModal(`<div style="padding:22px var(--s-6)">
    <h2 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;margin:0 0 var(--s-2)">${_hoEsc(o.title)}</h2>
    <p style="margin:0 0 var(--s-3);font-size:var(--t-body);color:var(--color-neutral-700);line-height:1.55">${_hoEsc(o.lead)}</p>
    <input id="ho-fd-file" type="file" accept="${HO_FILE_ACCEPT}" style="width:100%;font-size:var(--t-body)">
    <div id="ho-fd-step" class="ho-sub" hidden></div>
    <div id="ho-fd-out"></div>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:var(--s-4)">
      <button id="ho-fd-cancel" type="button" class="ui-btn">${_hoEsc(i18t('act_close'))}</button>
      <button id="ho-fd-go" type="button" class="ui-btn ui-btn-primary">${_hoEsc(o.go)}</button>
    </div></div>`, { maxWidth: (window.DLG_W && DLG_W.xl) || '760px', label: o.title });
  const step = t => { const el = document.getElementById('ho-fd-step'); if (el){ el.textContent = t; el.hidden = !t; } };
  const ui = {
    result(r, read){
      const out = document.getElementById('ho-fd-out'); if (!out) return;
      out.innerHTML = `<div class="ho-res ${r.same ? 'is-same' : 'is-diff'}">
        <div class="ho-res-h">${r.same ? '&#10003;' : '!'} ${_hoEsc(outsideCheckLine(r))}</div>
        ${r.ocr ? `<div class="ho-sub">${_hoEsc(i18t('ho_cmp_ocr'))}</div>` : ''}
        ${r.same ? '' : `<div class="ho-diffs">${outsideDiffHtml(r)}</div>`}
        ${(r.around || []).length ? `<div class="ho-sub">${_hoEsc(i18tn('ho_around_words', r.aroundWords, { n: r.aroundWords }))}</div>` : ''}
      </div>`;
    },
  };
  document.getElementById('ho-fd-cancel')?.addEventListener('click', closeModal);
  document.getElementById('ho-fd-go')?.addEventListener('click', async e => {
    const inp = document.getElementById('ho-fd-file');
    const file = inp && inp.files && inp.files[0];
    if (!file){ step(i18t('ho_choose_file')); return; }
    const btn = e.currentTarget; btn.disabled = true;
    try {
      step(i18t('ho_reading'));
      const read = await outsideReadFile(file, step);
      if (!read.text){ step(i18t('ho_no_text')); btn.disabled = false; return; }
      step('');
      const r = _hoCompare(c, read);
      await o.onRead(read, r, ui);
    } catch (err) { step((err && err.message) || String(err)); }
    btn.disabled = false;
  });
}

/* ============================================================
   FILE THE SIGNED COPY — now it is a contract
   ============================================================
   HaTi reads, a person confirms, a person presses File. Five checks, one
   press: same words, everyone signed, the dates, not filed before, the
   approval stands — and how it was signed. Where the words differ the
   screen shows both wordings clause by clause and says who has signed so
   far: only they have, Send it back leads; both have, the approver or an
   admin files it with the difference recorded, or it is held and raised. */
function openOutsideFiling(c, pre){
  if (!handoverActive(c)){ if (typeof toast === 'function') toast(i18t('ho_not_out'), 'warn'); return; }
  if (pre && pre.read) return _hoFilingScreen(c, pre.read);
  _hoFileDialog(c, {
    title: i18t('ho_file_title'), lead: i18t('ho_file_lead'), go: i18t('ho_file_read'),
    onRead: async (read) => { closeModal(); _hoFilingScreen(c, read); },
  });
}
/* Has this very file been filed before — as a signed copy, an upload or a
   migrated record? Asked of the record the browser holds. */
function outsideFiledBefore(hash, selfId){
  if (!hash) return null;
  return ((typeof state !== 'undefined' && state && state.contracts) || []).find(x => x && x.id !== selfId && (
    (x.signedCopy && x.signedCopy.file && x.signedCopy.file.sha256 === hash)
    || (x.execution && x.execution.fileHash === hash)
    || (x.upload && x.upload.fileHash === hash && x.status === 'Signed'))) || null;
}
/* WHO IS EXPECTED TO HAVE SIGNED: every party that signs (Phase 2 — filing
   needs every signature), by the person named for it where there is one, else
   by the company beside a signature word, which a person then confirms; and
   our signatory. */
function _hoSignerExpect(c){
  const ho = handoverOf(c) || {};
  const ours = typeof outsideSignatory === 'function' ? outsideSignatory(c) : null;
  const plan = (Array.isArray(c.signerPlan) ? c.signerPlan : []).filter(s => s && s.party === 'counterparty' && s.name);
  const signing = (typeof partiesSigning === 'function' ? partiesSigning(c) : [])
    .filter(p => p && p.name);
  const list = [];
  if (signing.length > 1){
    signing.forEach(p => {
      const named = plan.filter(s => String(s.partyId || '') === p.id);
      if (named.length) named.forEach(s => list.push({ name: s.name, side: 'theirs', partyId: p.id }));
      else list.push({ name: p.name, side: 'theirs', party: true, partyId: p.id });
    });
  } else {
    const theirs = (ho.to && ho.to.name) || '';
    if (theirs) list.push({ name: theirs, side: 'theirs' });
    plan.forEach(s => { if (!list.some(x => x.name === s.name)) list.push({ name: s.name, side: 'theirs' }); });
    /* Nobody on their side is named on the file: their company is looked for
       beside a signature word instead, and a person confirms it. */
    if (!list.length && c.counterparty) list.push({ name: c.counterparty, side: 'theirs', party: true });
  }
  if (ours && ours.name) list.push({ name: ours.name, side: 'ours' });
  return list;
}
function _hoFilingScreen(c, read){
  const ho = handoverOf(c) || {};
  const r = _hoCompare(c, read);
  const expect = _hoSignerExpect(c);
  const said = outsideReadCopy(read.text, expect);
  const dup = outsideFiledBefore(read.fileHash, c.id);
  const me = _hoMe();
  const isAdminNow = !!(me && me.role === 'admin');
  const plain = outsideAgreedPlain(c);
  const startsOnSig = outsideStartsOnSignature(plain);
  const m = c.metadata || {}, f = c.fields || {};
  const signedOn = said.signedOn || '';
  const start = startsOnSig ? signedOn : (f.effDate || m.effectiveDate || '');
  const ends = c.expiry || m.expiryDate || '';
  const notice = m.noticePeriodDays != null ? m.noticePeriodDays : '';
  /* Every expected signature found — each party's, and ours. */
  const theirsFound = said.signers.some(s => s.side === 'theirs') && said.signers.filter(s => s.side === 'theirs').every(s => s.found);
  const oursFound = said.signers.some(s => s.side === 'ours') ? said.signers.filter(s => s.side === 'ours').every(s => s.found) : false;
  const FLD = 'border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)';
  const nextNo = (typeof contractIsWorkingFile === 'function' && contractIsWorkingFile(c)) ? i18t('ho_gets_number') : '';
  const approvals = Array.isArray(ho.approvals) ? ho.approvals : [];
  const preview = /pdf|image/.test(read.mime)
    ? `<iframe title="${_hoEsc(read.name)}" src="${read.dataUrl}" style="width:100%;height:100%;border:0;background:#fff"></iframe>`
    : `<div class="ho-copytext">${_hoEsc(read.text).replace(/\n/g, '<br>')}</div>`;
  const tick = ok => ok ? '<span class="ho-tick">&#10003;</span>' : '<span class="ho-tick is-warn">!</span>';
  const signerRows = said.signers.map((s, i) => `<label class="ho-signer">
      <input type="checkbox" data-ho-signed="${i}"${s.found ? ' checked' : ''}>
      <span>${_hoEsc(s.name)} <span class="ho-sub">${_hoEsc(i18t(s.side === 'ours' ? 'ho_side_ours' : 'ho_side_theirs'))}${s.on ? ' · ' + _hoEsc(_hoDay(s.on)) : ''}${s.unsure ? ' · ' + _hoEsc(i18t('ho_unsure')) : ''}</span></span></label>`).join('');
  openModal(`<div class="ho-file">
    <div class="ho-file-l">${preview}</div>
    <div class="ho-file-r">
      <h2 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:17px;margin:0 0 4px">${_hoEsc(i18t('ho_check_copy'))}</h2>
      <div class="ho-sub" style="margin-bottom:10px">${_hoEsc(read.name)}</div>
      <div class="ho-chk ${r.same ? '' : 'is-warn'}">${tick(r.same)}<div><b>${_hoEsc(outsideCheckLine(r))}</b>
        ${r.same ? `<div class="ho-sub">${_hoEsc(i18t('ho_design_fine'))}</div>` : ''}
        ${r.ocr ? `<div class="ho-sub">${_hoEsc(i18t('ho_cmp_ocr'))}</div>` : ''}
        ${(r.around || []).length ? `<div class="ho-sub">${_hoEsc(i18tn('ho_around_words', r.aroundWords, { n: r.aroundWords }))}</div>` : ''}</div></div>
      ${r.same ? '' : `<div class="ho-diffs">${outsideDiffHtml(r)}</div>`}
      <div class="ho-chk">${tick(theirsFound && oursFound)}<div><b>${_hoEsc(i18t('ho_who_signed'))}</b>
        <div class="ho-signers">${signerRows || `<div class="ho-sub">${_hoEsc(i18t('ho_no_names'))}</div>`}</div>
        <label class="ho-signer"><input type="checkbox" id="ho-both" ${theirsFound && oursFound ? 'checked' : ''}> <span>${_hoEsc(i18t('ho_both_signed'))}</span></label></div></div>
      <div class="ho-chk">${tick(!!signedOn)}<div><b>${_hoEsc(i18t('ho_dates'))}</b>
        <div class="ho-dates">
          <label><span>${_hoEsc(i18t('ho_d_signed'))}</span><input id="ho-d-signed" type="date" value="${_hoEsc(signedOn)}" style="${FLD}"></label>
          <label><span>${_hoEsc(i18t('ho_d_starts'))}</span><input id="ho-d-start" type="date" value="${_hoEsc(String(start).slice(0, 10))}" style="${FLD}"></label>
          <label><span>${_hoEsc(i18t('ho_d_ends'))}</span><input id="ho-d-ends" type="date" value="${_hoEsc(String(ends).slice(0, 10))}" style="${FLD}"></label>
          <label><span>${_hoEsc(i18t('ho_d_notice'))}</span><input id="ho-d-notice" type="number" min="0" value="${_hoEsc(notice)}" style="${FLD}"></label>
        </div>
        ${startsOnSig ? `<div class="ho-sub">${_hoEsc(i18t('ho_starts_on_sig'))}</div>` : ''}</div></div>
      <div class="ho-chk">${tick(!dup)}<div><b>${_hoEsc(i18t(dup ? 'ho_filed_before' : 'ho_not_filed_before', { ref: dup ? contractRef(dup) : '' }))}</b></div></div>
      <div class="ho-chk">${tick(!!approvals.length)}<div><b>${_hoEsc(i18t(approvals.length ? 'ho_approval_stands' : 'ho_approval_none'))}</b>
        ${approvals.length ? `<div class="ho-sub">${_hoEsc(i18t('ho_used_at', { when: _hoDay(ho.at) }))}</div>` : ''}</div></div>
      <label class="ho-via"><span>${_hoEsc(i18t('ho_how_signed'))}</span>
        <select id="ho-via" style="${FLD}">
          <option value="">${_hoEsc(i18t('ho_via_pick'))}</option>
          ${Object.keys(HO_VIA_KEYS).map(k => `<option value="${k}"${said.via === k ? ' selected' : ''}>${_hoEsc(i18t(HO_VIA_KEYS[k]))}</option>`).join('')}
        </select></label>
      <label class="ho-via"><span>${_hoEsc(i18t('ho_cert'))}</span><input id="ho-cert" type="file" accept="${HO_FILE_ACCEPT}" style="font-size:var(--t-label)"></label>
      ${_hoParentPicker(c)}
      <div id="ho-f-err" class="ho-err" hidden></div>
      <div class="ho-file-foot">
        <button id="ho-f-cancel" type="button" class="ui-btn">${_hoEsc(i18t('act_cancel'))}</button>
        <span style="flex:1"></span>
        <span id="ho-f-acts"></span>
      </div>
    </div>
  </div>`, { maxWidth: '1100px', height: '88vh', label: i18t('ho_check_copy') });
  const acts = document.getElementById('ho-f-acts');
  const both = () => !!(document.getElementById('ho-both') || {}).checked;
  /* THE BUTTONS FOLLOW WHO HAS SIGNED. Same words: File as signed, or — not
     everybody has signed — keep it as evidence and wait. Different words and
     not everybody has signed: Send it back leads, and accepting the difference
     (the approver's or an admin's, with a reason) keeps the copy waiting —
     nothing is filed until every party has signed. Different and everybody
     signed: there is nothing to send back — file it with the difference
     recorded, or hold and raise. */
  const paint = () => {
    const bs = both();
    const mayAccept = isAdminNow || _hoApprovedBy(c, me);
    let html = '';
    /* A COPY SOME HAVE NOT SIGNED IS NEVER FILED (filing needs every
       signature): it is kept on the waiting card — with the difference
       accepted, where the approver or an admin accepts it, so the copy ours
       signs next is not sent back for it. */
    if (r.same && bs) html = `<button type="button" class="ui-btn ui-btn-primary" data-ho-f="file">${_hoEsc(i18t('ho_file_as_signed'))}${nextNo ? ' · ' + _hoEsc(nextNo) : ''}</button>`;
    else if (r.same && !bs) html = `<button type="button" class="ui-btn ui-btn-primary" data-ho-f="partial">${_hoEsc(i18t('ho_keep_partial'))}</button>`;
    else if (!bs) html = `<button type="button" class="ui-btn ui-btn-primary" data-ho-f="sendback">${_hoEsc(i18t('ho_send_back'))}</button>`
      + (mayAccept ? ` <button type="button" class="ui-btn" data-ho-f="accept-partial">${_hoEsc(i18t('ho_accept_partial'))}</button>` : '');
    else html = (mayAccept ? `<button type="button" class="ui-btn ui-btn-primary" data-ho-f="accept">${_hoEsc(i18t('ho_file_with_diff'))}</button> ` : '')
      + `<button type="button" class="ui-btn" data-ho-f="hold">${_hoEsc(i18t('ho_hold_raise'))}</button>`;
    if (!r.same && !mayAccept) html += `<div class="ho-sub" style="margin-top:6px">${_hoEsc(i18t('ho_accept_who'))}</div>`;
    acts.innerHTML = html;
    acts.querySelectorAll('[data-ho-f]').forEach(b => b.addEventListener('click', () => go(b.getAttribute('data-ho-f'), b)));
  };
  document.getElementById('ho-both')?.addEventListener('change', paint);
  document.getElementById('ho-f-cancel')?.addEventListener('click', closeModal);
  const err = t => { const el = document.getElementById('ho-f-err'); if (el){ el.textContent = t; el.hidden = !t; } };
  const signers = () => said.signers.map((s, i) => ({ ...s, signed: !!(document.querySelector(`[data-ho-signed="${i}"]`) || {}).checked }));
  const go = async (what, btn) => {
    err('');
    if (dup && what === 'file'){ err(i18t('ho_dup_refuse', { ref: contractRef(dup) })); return; }
    btn.disabled = true;
    try {
      if (what === 'sendback' || what === 'hold') await outsideSendBack(c, r, { both: what === 'hold', read });
      else if (what === 'partial') await outsidePartial(c, read, signers());
      else if (what === 'accept-partial'){
        const why = await promptDialog({ title: i18t('ho_accept_title'), message: i18t('ho_accept_partial_msg'),
          placeholder: i18t('ho_accept_ph'), confirmLabel: i18t('ho_accept_partial'), multiline: true });
        if (!String(why || '').trim()){ btn.disabled = false; return; }
        await outsidePartial(c, read, signers(), { differs: { by: { id: me ? String(me.id) : '', name: (me && me.name) || '', role: (me && me.role) || '' },
          why: String(why).trim().slice(0, 600), line: outsideCompareLine(r) }, same: false });
      }
      else {
        let differs = null;
        if (what === 'accept'){
          const why = await promptDialog({ title: i18t('ho_accept_title'), message: i18t('ho_accept_msg'),
            placeholder: i18t('ho_accept_ph'), confirmLabel: i18t('ho_file_with_diff'), multiline: true });
          if (!String(why || '').trim()){ btn.disabled = false; return; }
          differs = { by: { id: me ? String(me.id) : '', name: (me && me.name) || '', role: (me && me.role) || '' }, why: String(why).trim().slice(0, 600), at: (typeof nowISO === 'function' ? nowISO() : new Date().toISOString()) };
        }
        const via = (document.getElementById('ho-via') || {}).value || '';
        if (!via){ err(i18t('ho_via_need')); btn.disabled = false; return; }
        const d = {
          signed: (document.getElementById('ho-d-signed') || {}).value || '',
          start: (document.getElementById('ho-d-start') || {}).value || '',
          ends: (document.getElementById('ho-d-ends') || {}).value || '',
          notice: (document.getElementById('ho-d-notice') || {}).value || '' };
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d.signed)){ err(i18t('ho_signed_need')); btn.disabled = false; return; }
        const cert = ((document.getElementById('ho-cert') || {}).files || [])[0] || null;
        const parentId = (document.getElementById('ho-parent') || {}).value || '';
        await outsideFile(c, { read, compare: r, differs, via, dates: d, signers: signers(), cert, parentId, everyone: both() });
      }
      closeModal();
    } catch (e2) { err((e2 && e2.message) || String(e2)); btn.disabled = false; }
  };
  paint();
}
/* Did this person approve this contract — the named approver who said yes,
   or somebody who approved a rule step? The server asks the same question. */
function _hoApprovedBy(c, u){
  if (!u) return false;
  const id = String(u.id);
  const ho = handoverOf(c) || {};
  return (Array.isArray(ho.approvals) ? ho.approvals : []).some(a => a && (String(a.byId || '') === id || (a.by && a.by === u.name)))
    || (Array.isArray(c.signApprovals) ? c.signApprovals : []).some(r => r && r.status === 'approved'
      && ((r.decidedBy && String(r.decidedBy.id) === id) || String(r.approverId || '') === id || String(r.backupId || '') === id));
}
/* An amendment of something already signed: offered, never assumed. Only a
   signed amendment moves the parent's dates, as today. */
function _hoParentPicker(c){
  if (c.parentId) return '';
  const cp = String(c.counterparty || '').trim().toLowerCase();
  if (!cp) return '';
  const cands = ((typeof state !== 'undefined' && state && state.contracts) || []).filter(x => x && x.id !== c.id && !x.parentId
    && String(x.counterparty || '').trim().toLowerCase() === cp && (x.status === 'Signed' || (x.execution && x.execution.at)));
  if (!cands.length) return '';
  return `<label class="ho-via"><span>${_hoEsc(i18t('ho_amends'))}</span>
    <select id="ho-parent" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
      <option value="">${_hoEsc(i18t('ho_amends_none'))}</option>
      ${cands.slice(0, 30).map(x => `<option value="${_hoEsc(x.id)}">${_hoEsc(contractRef(x))} · ${_hoEsc(x.name || '')}</option>`).join('')}
    </select></label>`;
}
async function _hoUploadFile(read){
  if (typeof API_MODE === 'function' && !API_MODE()) return { fileId: null, dataUrl: read.dataUrl };
  const r = await api('files', 'POST', { name: read.name, mime: read.mime || 'application/octet-stream', dataUrl: read.dataUrl });
  return { fileId: r && r.id };
}
/* ONLY THEY HAVE SIGNED: kept as evidence, and the file keeps waiting. */
async function outsidePartial(c, read, signers, o){
  const up = await _hoUploadFile(read);
  await outsideAct(c, 'partial', { fileId: up.fileId, fileName: read.name, sha256: read.fileHash,
    signedBy: signers.filter(s => s.signed && s.side === 'theirs').map(s => s.name),
    signedOn: (signers.find(s => s.signed && s.on) || {}).on || '',
    same: !(o && o.same === false), differs: (o && o.differs) || null });
  if (typeof toast === 'function') toast(i18t('ho_partial_kept'), 'ok');
  _hoAfterAct(c);
}
/* THE WORDS DIFFER: the differences go back to them, named. Nothing is filed
   and the file keeps waiting. Where both have signed, the copy is kept as the
   evidence of what was signed while it is raised with them. */
async function outsideSendBack(c, r, o){
  const lines = [];
  (r.renamed || []).forEach(x => lines.push(`Renamed term: “${x.from}” became “${x.to}”`));
  (r.changed || []).slice(0, 20).forEach(x => lines.push(`${x.label || x.marker || 'A passage'}${x.theirNo ? ` (your ${x.theirNo})` : ''}:\n  Agreed: ${x.a.map(y => y.s).join(' ')}\n  Signed: ${x.b.map(y => y.s).join(' ')}`));
  (r.missing || []).slice(0, 20).forEach(x => lines.push(`${x.label || x.marker || 'A passage'} is missing:\n  Agreed: ${x.agreed}`));
  (r.inserted || []).slice(0, 10).forEach(x => lines.push(`Added between clauses:\n  ${x.text}`));
  let heldFileId = null;
  if (o && o.both && o.read){ const up = await _hoUploadFile(o.read); heldFileId = up.fileId; }
  const out = await outsideAct(c, 'sendback', { lines: lines.slice(0, 40), both: !!(o && o.both),
    fileId: heldFileId, fileName: o && o.read ? o.read.name : '', sha256: o && o.read ? o.read.fileHash : '' });
  if (typeof toast === 'function') toast(out && out.emailSent ? i18t('ho_sent_back') : ((out && out.emailError) || i18t('ho_sent_back_outbox')), out && out.emailSent ? 'ok' : 'warn');
  _hoAfterAct(c);
}
/* ---- FILE AS SIGNED ----
   The signed copy becomes the document of record, with the agreed version
   and the whole negotiation beside it; the dates are counted into the
   renewal, notice and obligation reminders; the evidence pack gains the copy,
   the certificate, the comparison and the approval; and the contract takes
   its number — from the server, in the very save that files it. */
async function outsideFile(c, o){
  const me = _hoMe();
  const at = typeof nowISO === 'function' ? nowISO() : new Date().toISOString();
  const up = await _hoUploadFile(o.read);
  let cert = null;
  if (o.cert){
    const cr = await outsideReadFile(o.cert).catch(() => null);
    if (cr){ const cu = await _hoUploadFile(cr); cert = { name: cr.name, fileId: cu.fileId || null, sha256: cr.fileHash, dataUrl: cu.dataUrl || null }; }
  }
  const cmp = o.compare;
  c.signedCopy = {
    at, by: { id: me ? String(me.id) : '', name: (me && me.name) || '' },
    file: { name: o.read.name, fileId: up.fileId || null, sha256: o.read.fileHash, size: o.read.size, mime: o.read.mime,
      dataUrl: up.fileId ? null : (up.dataUrl || null), textSource: o.read.textSource },
    certificate: cert, via: o.via,
    signers: (o.signers || []).filter(s => s.signed).map(s => ({ name: s.name, side: s.side, on: s.on || '' })),
    signedOn: o.dates.signed,
    compare: { same: !!cmp.same, unrelated: !!cmp.unrelated, clauses: cmp.clauses, changed: cmp.changedCount,
      missing: cmp.missingCount, inserted: (cmp.inserted || []).length, renamed: cmp.renamed || [],
      line: outsideCompareLine(cmp), ocr: !!cmp.ocr, coverage: cmp.coverage },
    differs: o.differs || null,
    /* the person filing says the copy carries every party's signature — the
       server files nothing without it */
    everyone: o.everyone === true,
    approvalsUsed: ((handoverOf(c) || {}).approvals || []).slice(0, 10),
  };
  /* the dates, where a person confirmed them — a fill, never a guess */
  c.fields = c.fields || {};
  c.metadata = c.metadata || {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(o.dates.start)){ c.fields.effDate = o.dates.start; c.metadata.effectiveDate = o.dates.start; }
  if (/^\d{4}-\d{2}-\d{2}$/.test(o.dates.ends)){ c.expiry = o.dates.ends; c.metadata.expiryDate = o.dates.ends; }
  if (String(o.dates.notice).trim() !== '' && Number(o.dates.notice) >= 0) c.metadata.noticePeriodDays = Number(o.dates.notice);
  if (o.parentId && typeof applyParentLink === 'function'){ try { applyParentLink(c, o.parentId, 'amendment', null, me && me.name); } catch (_) {} }
  if (typeof captureVersion === 'function') captureVersion(c, 'Signed copy filed', (me && me.name) || 'System', { auto: true, listed: true });
  c.execution = { at, by: (me && me.name) || 'System', method: 'outside', offPlatform: true, via: o.via,
    fileName: o.read.name, fileHash: o.read.fileHash, fileId: up.fileId || null, signedOn: o.dates.signed,
    firstParty: (typeof contractParty === 'function' ? contractParty(c) : '') || (window.FIRST_PARTY || '') };
  c.signedAt = o.dates.signed;
  c.status = 'Signed';
  c.lastAction = typeof todayStr === 'function' ? todayStr() : '';
  /* In local mode nobody else gives the number. */
  if (typeof API_MODE === 'function' && !API_MODE() && typeof contractIsWorkingFile === 'function'
      && contractIsWorkingFile(c) && typeof nextId === 'function') c.contractNo = nextId();
  c.sealVersion = 3;
  c.hash = typeof sha256 === 'function' && typeof sealString === 'function' ? await sha256(sealString(c)) : c.hash;
  if (typeof logAudit === 'function') logAudit(c, 'Executed outside HaTi',
    `Signed copy filed by ${(me && me.name) || 'System'} — “${o.read.name}”, SHA-256 ${String(o.read.fileHash).slice(0, 16)}…`
    + ` · signed ${o.dates.signed} · ${(o.via && i18t(HO_VIA_KEYS[o.via] || 'ho_via_else')) || ''}`
    + ` · ${outsideCompareLine(cmp)}`
    + (o.differs ? ` Filed with the difference recorded by ${o.differs.by.name} (${o.differs.by.role}): “${o.differs.why}”.` : '')
    + (cert ? ` Certificate of completion kept (“${cert.name}”).` : '')
    + ' No electronic signature was taken in HaTi; the signatures are on the signed copy, which is the document of record. The agreed version and the negotiation above are how this wording was reached.');
  if (typeof persist === 'function') persist(c);
  if (typeof flushSaves === 'function') await flushSaves();
  try { const r = await outsideAct(c, 'filed'); void r; } catch (_) {}
  if (typeof toast === 'function') toast(i18t('ho_filed', { no: contractRef(c) }), 'ok');
  _hoAfterAct(c);
  /* The obligations Copilot found on the agreed wording, offered for ticking.
     runFindObligations returns into the review dialog with a reading already
     held — it pays for nothing twice. */
  try { if (typeof runFindObligations === 'function') setTimeout(() => runFindObligations(c, {}), 400); } catch (_) {}
}

/* ============================================================
   THE UPLOAD BUTTON KNOWS A SIGNED COPY WHEN IT SEES ONE (decision 9)
   ============================================================
   A signed copy comes back by email as often as by the Signing tab, and the
   natural thing to do with a file is to press Upload. So the upload, once it
   has read the file, compares it with every agreed version out for signature
   and — where one matches — asks whether this is that file's signed copy.
   Never assumed: "No, a new contract" carries on as an ordinary upload. And
   where nothing matches but something is out, the reader may still say which
   one it is. Their link is not a way in: the design and the signing are theirs
   and so is the file, which comes back to us, not through a form of ours. */
const HO_MATCH_MIN = 0.6;
/* A CAP, SAID: the upload compares its text with at most this many files out
   for signature — the likeliest first (their company named in the text, then
   the newest handover) — and the pick-list under it names EVERY file out, so a
   file past the cap is still one choice away rather than silently missing. */
const HO_MATCH_MAX = 20;
async function outsideMatchUpload(text, textSource){
  const cs = ((typeof state !== 'undefined' && state && state.contracts) || []).filter(c => {
    try { return handoverActive(c) && !c.archived; } catch (_) { return false; } });
  if (!cs.length || !String(text || '').trim()) return { best: null, outs: cs };
  const ocr = typeof isOcrText === 'function' ? isOcrText(textSource) : /ocr/.test(String(textSource || ''));
  const low = String(text).toLowerCase();
  const named = c => { const cp = String(c.counterparty || '').trim().toLowerCase(); return cp && low.includes(cp) ? 1 : 0; };
  const outAt = c => String((handoverOf(c) || {}).at || '');
  const order = cs.slice().sort((a, b) => (named(b) - named(a)) || outAt(b).localeCompare(outAt(a)));
  let best = null;
  for (const c of order.slice(0, HO_MATCH_MAX)){
    try {
      if (typeof ensureFull === 'function' && c._light && !c._loaded) await ensureFull(c);
      const r = outsideCompare(outsideAgreedParas(c), text, { ocr });
      if (r && !r.unrelated && r.coverage >= HO_MATCH_MIN && (!best || r.coverage > best.r.coverage)) best = { c, r };
    } catch (_) {}
  }
  return { best, outs: cs };
}
function outsideUploadOfferHtml(m){
  if (!m || (!m.best && !(m.outs && m.outs.length))) return '';
  if (m.best){
    const c = m.best.c;
    return `<div id="ho-up-match" class="ho-route" style="margin:0 0 12px;border-color:var(--st-steel-line);background:var(--st-steel-bg)">
      <div class="ho-route-v">${_hoEsc(i18t('ho_up_match_q', { ref: contractRef(c), name: c.name || '' }))}</div>
      <p class="ho-route-say">${_hoEsc(outsideCheckLine(m.best.r))}</p>
      <div class="ho-acts">
        <button type="button" class="ui-btn ui-btn-primary" data-ho-up-file="${_hoEsc(c.id)}">${_hoEsc(i18t('ho_up_file_it'))}</button>
        <button type="button" class="ui-btn" data-ho-up-new="1">${_hoEsc(i18t('ho_up_new'))}</button>
      </div></div>`;
  }
  return `<div id="ho-up-pick" style="margin:0 0 12px">
    <label class="ho-via"><span>${_hoEsc(i18t('ho_up_pick_q'))}</span>
      <select id="ho-up-which" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
        <option value="">${_hoEsc(i18t('ho_up_pick_none'))}</option>
        ${m.outs.map(c => `<option value="${_hoEsc(c.id)}">${_hoEsc(contractRef(c))} · ${_hoEsc(c.name || '')}${c.counterparty ? ' · ' + _hoEsc(c.counterparty) : ''}</option>`).join('')}
      </select></label>
    <button type="button" class="ui-btn" data-ho-up-pick="1" style="margin-top:6px" hidden>${_hoEsc(i18t('ho_up_file_it'))}</button>
  </div>`;
}
/* `read` is the upload's own reading of the file — the filing screen needs
   nothing more, and reads nothing twice. */
function wireOutsideUploadOffer(root, read){
  if (!root) return;
  const go = id => {
    const c = typeof getContract === 'function' ? getContract(id) : null;
    if (!c) return;
    if (typeof closeModal === 'function') closeModal();
    openOutsideFiling(c, { read });
  };
  root.querySelectorAll('[data-ho-up-file]').forEach(b => b.addEventListener('click', () => go(b.getAttribute('data-ho-up-file'))));
  root.querySelectorAll('[data-ho-up-new]').forEach(b => b.addEventListener('click', () => {
    const box = root.querySelector('#ho-up-match'); if (box) box.remove(); }));
  const sel = root.querySelector('#ho-up-which'), pick = root.querySelector('[data-ho-up-pick]');
  if (sel && pick){
    sel.addEventListener('change', () => { pick.hidden = !sel.value; });
    pick.addEventListener('click', () => { if (sel.value) go(sel.value); });
  }
}

/* ============================================================
   THE SIGNED COPY OF RECORD, ON A FILED CONTRACT
   ============================================================
   What today's paper filing got wrong, put right: the record shows the
   signed copy — not the file uploaded at the start — and a screen can open it
   again; the fingerprint is the signed copy's, and the evidence pack names it.
   Also drawn for a contract filed through the old paper door, which kept its
   file on `execution` and never showed it. */
function outsideExecutionBlock(c){
  const ex = c.execution || {};
  const sc = c.signedCopy || null;
  const file = sc ? sc.file || {} : { name: ex.fileName, fileId: ex.fileId, sha256: ex.fileHash };
  const cell = (k, v, sub) => `<div class="ho-ex-cell"><div class="ho-ex-k">${_hoEsc(k)}</div><div class="ho-ex-v">${v}</div>${sub ? `<div class="ho-sub">${sub}</div>` : ''}</div>`;
  const via = (sc && sc.via) || ex.via || (ex.method === 'paper' ? 'paper' : '');
  const signers = sc && Array.isArray(sc.signers) ? sc.signers.map(s => `${_hoEsc(s.name)}${s.on ? ' · ' + _hoEsc(_hoDay(s.on)) : ''}`).join('<br>') : '';
  return `<div class="seal-in ho-ex" data-anchor="sig">
    <div class="ho-ex-h"><span>${_hoEsc(i18t('ho_ex_title'))}</span>${typeof statusChip === 'function' ? statusChip('Signed') : ''}</div>
    <p class="ho-sub">${_hoEsc(i18t(ex.method === 'paper' ? 'ho_ex_paper_line' : 'ho_ex_line', { via: via ? i18t(HO_VIA_KEYS[via] || 'ho_via_else') : '' }))}</p>
    <div class="ho-ex-grid">
      ${cell(i18t('ho_ex_filed'), _hoEsc((sc && sc.by && sc.by.name) || ex.by || '—'), _hoEsc(typeof fmtDT === 'function' ? fmtDT((sc && sc.at) || ex.at) : ((sc && sc.at) || ex.at || '')))}
      ${cell(i18t('ho_ex_signed_on'), _hoEsc(_hoDay((sc && sc.signedOn) || ex.signedOn) || '—'), signers)}
      ${sc && sc.compare ? cell(i18t('ho_ex_words'), _hoEsc(sc.compare.same ? i18t('ho_ex_same') : i18t('ho_ex_differs')),
        sc.differs ? _hoEsc(i18t('ho_ex_differs_by', { who: sc.differs.by && sc.differs.by.name, why: sc.differs.why })) : '') : ''}
    </div>
    <div class="ho-ex-fp"><div class="ho-ex-k">${_hoEsc(i18t('ho_ex_fp'))}</div><code>${_hoEsc(file.sha256 || '—')}</code>
      <div class="ho-sub">${_hoEsc(file.name || '')} ${file.fileId ? `<button type="button" class="ui-link" data-ho-open-file="${_hoEsc(file.fileId)}" data-ho-open-name="${_hoEsc(file.name || '')}">${_hoEsc(i18t('ho_open_copy'))}</button>` : ''}</div></div>
  </div>`;
}
/* The open button inside the frozen block is drawn into the document canvas,
   which is repainted often; one delegated listener answers it wherever it is. */
if (typeof document !== 'undefined' && !document._hoOpenWired){
  document._hoOpenWired = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-ho-open-file]');
    if (!b || b.closest('#ho-wait')) return;
    e.preventDefault();
    outsideOpenFile(b.getAttribute('data-ho-open-file'), b.getAttribute('data-ho-open-name'));
  });
}

if (typeof window !== 'undefined') Object.assign(window, {
  outsideAgreedHtml, outsideAgreedParas, outsideAgreedPlain, outsideAgreedStamp, outsideBlanksOf,
  wordAgreedFile, outsideMayChangeRoute, outsideSetRoute, outsideRouteCardHtml, renderOutsideSign,
  openHandoverWindow, outsideHandOver, outsideAdopt, outsideAct, outsideWaitCardHtml, wireOutsideWait,
  outsideOpenFile, outsideChase, openOutsideSendAgain, outsideReopen, outsideCloseDeal, outsideReadFile,
  outsideDiffHtml, outsideCheckLine, openOutsideCheck, openOutsideFiling, outsideFiledBefore, outsidePartial,
  outsideSendBack, outsideFile, outsideExecutionBlock, HO_VIA_KEYS,
  outsideMatchUpload, outsideUploadOfferHtml, wireOutsideUploadOffer, HO_MATCH_MAX, HO_MATCH_MIN });
