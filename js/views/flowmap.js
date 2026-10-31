// HaTi — THE FLOW MAP'S PAGE: every page on the contract's life, and how a person leaves each one.
/* ============================================================================
   THE FLOW MAP (owner, 31 Oct 2026; docs/PLAN-the-legora-way.md, round 0)
   ----------------------------------------------------------------------------
   The table is js/flowmap.js (FLOW_MAP). This page draws it the way the design
   review room drew it: the stages across the top (arrive · read & fill ·
   negotiate · approve & sign · live, then the book and the house), every place
   under its stage, the faint spine every contract walks. A press on a place
   lights how a person leaves it — black for the step that moves them with no
   press, green for the doors above Jambo's box, dashed indigo for what Jambo
   predicts — and Jambo's panel says it in words, with Open as the one way there
   (caGo). A second press lets it go. Nothing here reads or writes a record.
   A REFRESH LANDS AT THE SAME SPOT: the place chosen (PLACE_PARTS).
   ========================================================================== */
let _fm = { on: null };
const FM_SEAT = 'flowmap';
const _fmE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _fmT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _fmLang = () => { try { return _fmT('hbk_lang') === 'sv' ? 'sv' : 'en'; } catch (_){ return 'en'; } };
const _fmW = v => { if (v == null) return ''; if (typeof v === 'string') return v; const l = _fmLang(); return String(v[l] != null ? v[l] : (v.en || '')); };
/* a place's name: the Guide's row name where it has one, else the "/" word, else its first word in CA_PLACES —
   never a dictionary key (a key that is missing comes back as itself) */
const fmName = k => {
  for (const key of ['gd_p_' + k, 'ca_w_' + k]){ const w = String(_fmT(key)); if (w && w !== key) return w.charAt(0).toUpperCase() + w.slice(1); }
  const P = (typeof CA_PLACES !== 'undefined' && Array.isArray(CA_PLACES)) ? CA_PLACES.find(x => x.k === k) : null;
  const w = String((P && P.w && P.w[0]) || k); return w.charAt(0).toUpperCase() + w.slice(1);
};
const _fmKeep = () => { if (typeof placeSave === 'function'){ try { placeSave(); } catch (_){ /* a convenience */ } } };

function fmPlace(){ return { on: _fm.on }; }
function fmPlacePut(p){ _fm.on = (p && p.on && flowMapRow(p.on)) ? String(p.on) : null; }

function fmHeadHtml(){
  return `<div class="fm-head ph-card"><div class="ph-top"><div class="fm-hl"><h1 class="fm-t1">${_fmE(_fmT('nav_flowmap'))}</h1><span class="fm-hn">${FLOW_MAP.length}</span><span class="fm-hs">${_fmE(_fmT('fm_head_sub'))}</span></div>
    <div class="fm-key"><span class="fm-k is-a"><i></i>${_fmE(_fmT('fm_key_step'))}</span><span class="fm-k is-d"><i></i>${_fmE(_fmT('fm_key_door'))}</span><span class="fm-k is-p"><i></i>${_fmE(_fmT('fm_key_pred'))}</span></div></div></div>`;
}
function fmGridHtml(){
  return FLOW_STAGES.map(s => {
    const rows = FLOW_MAP.filter(r => r.st === s.k);
    return `<div class="fm-col" data-fm-st="${s.k}"><div class="fm-h${s.spine ? ' is-spine' : ''}"><span>${_fmE(_fmW(s))}</span><span class="fm-n">${rows.length}</span></div>`
      + rows.map(r => `<button type="button" class="fm-node${r.hub ? ' is-hub' : ''}" data-fm="${r.k}" aria-pressed="false">${_fmE(fmName(r.k))}<span class="fm-s">${_fmE(_fmW(r.s))}</span></button>`).join('')
      + '</div>';
  }).join('');
}
function fmCss(){
  return `
  #fm-page .fm-head .ph-top{ display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
  #fm-page .fm-hl{ display:flex; align-items:baseline; gap:10px; min-width:0; flex-wrap:wrap; }
  #fm-page .fm-t1{ font-size:20px; font-weight:var(--w-title); margin:0; }
  #fm-page .fm-hn{ font-variant-numeric:tabular-nums; color:var(--color-neutral-600); }
  #fm-page .fm-hs{ color:var(--color-neutral-600); font-size:13px; }
  #fm-page .fm-key{ display:flex; gap:16px; margin-left:auto; flex-wrap:wrap; }
  #fm-page .fm-k{ display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--color-quiet); white-space:nowrap; }
  #fm-page .fm-k i{ display:inline-block; width:18px; height:0; border-top:2px solid var(--color-neutral-500); }
  #fm-page .fm-k.is-d i{ border-top-color:var(--accent-ink); }
  #fm-page .fm-k.is-p i{ border-top:2px dashed var(--st-violet-dot); }
  #fm-page .fm-body{ position:relative; flex:1; min-height:0; overflow:auto; padding:16px; }
  #fm-page .fm-svg{ position:absolute; left:0; top:0; pointer-events:none; overflow:visible; }
  #fm-page .fm-grid{ position:relative; z-index:1; display:grid; grid-template-columns:repeat(${FLOW_STAGES.length}, minmax(120px, 1fr)); gap:12px; align-items:start; }
  #fm-page .fm-col{ display:flex; flex-direction:column; gap:6px; min-width:0; }
  #fm-page .fm-h{ display:flex; justify-content:space-between; align-items:baseline; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--color-quiet); font-weight:var(--w-strong); padding:0 0 6px; border-bottom:1px solid var(--color-divider); margin-bottom:4px; }
  #fm-page .fm-h.is-spine{ color:var(--color-neutral-500); border-bottom-color:var(--color-neutral-500); }
  #fm-page .fm-n{ font-weight:400; letter-spacing:0; text-transform:none; }
  #fm-page .fm-node{ display:block; width:100%; text-align:left; border:1px solid var(--color-divider); border-radius:var(--radius); padding:6px 8px; background:var(--color-surface); font:inherit; font-size:12.5px; line-height:1.3; color:var(--color-neutral-500); cursor:pointer; transition:opacity var(--dur-2) var(--ease); }
  #fm-page .fm-node .fm-s{ display:block; font-size:11px; color:var(--color-quiet); margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  #fm-page .fm-node.is-hub{ border-color:var(--color-neutral-500); background:var(--jb-card-fill); }
  #fm-page .fm-node[aria-pressed="true"]{ background:var(--color-neutral-500); color:var(--color-surface); border-color:var(--color-neutral-500); }
  #fm-page .fm-node[aria-pressed="true"] .fm-s{ color:var(--rule-strong); }
  #fm-page .fm-node.is-to-a{ border-color:var(--color-neutral-500); border-width:2px; }
  #fm-page .fm-node.is-to-d{ border-color:var(--accent-ink); border-width:2px; }
  #fm-page .fm-node.is-to-p{ border-color:var(--st-violet-dot); border-style:dashed; border-width:2px; }
  #fm-page .fm-grid.is-dim .fm-node:not([aria-pressed="true"]):not(.is-to-a):not(.is-to-d):not(.is-to-p){ opacity:.4; }
  @media (hover:hover){ #fm-page .fm-node:hover{ border-color:var(--color-neutral-500); } }
  @media (prefers-reduced-motion:reduce){ #fm-page .fm-node{ transition:none; } }
  `;
}
function renderFlowMap(){
  const host = document.getElementById('content'); if (!host) return;
  const wide = typeof window.insFits === 'function' && insFits() && typeof window.insPaintPanel === 'function';
  host.innerHTML = `<div class="view-enter sap-page ins-page fm-page${wide ? '' : ' is-narrow'}" id="fm-page" data-ins-page="${FM_SEAT}" data-ins="${wide ? 1 : 0}"><style>${fmCss()}</style>
    ${fmHeadHtml()}
    <div class="ins-body"><section class="ins-card fm-card" aria-label="${_fmE(_fmT('nav_flowmap'))}"><div class="fm-body scroll-thin" id="fm-body"><svg class="fm-svg" id="fm-svg" aria-hidden="true"></svg><div class="fm-grid" id="fm-grid">${fmGridHtml()}</div></div></section>${wide ? `<aside id="ins-panel" class="ins-panel" aria-label="${_fmE(_fmT('fm_panel_label'))}"></aside>` : ''}</div></div>`;
  fmWire(host);
  fmSelect(_fm.on, { quiet: true });
  if (typeof setActiveNav === 'function') setActiveNav('flowmap');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* the three kinds of line from the chosen place; the spine alone when nothing is chosen */
function fmLinesOf(k){
  const r = k && flowMapRow(k); if (!r) return { a: [], d: [], p: [] };
  return { a: r.a.map(x => x[0]), d: r.d.slice(), p: r.p.map(x => x[0]) };
}
function fmDraw(){
  const svg = document.getElementById('fm-svg'), grid = document.getElementById('fm-grid'); if (!svg || !grid) return;
  const g = grid.getBoundingClientRect(); const W = grid.scrollWidth, H = grid.scrollHeight;
  svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.left = grid.offsetLeft + 'px'; svg.style.top = grid.offsetTop + 'px';
  const box = k => { const el = grid.querySelector(`[data-fm="${k}"]`); if (!el) return null; const r = el.getBoundingClientRect();
    return { l: r.left - g.left, r: r.right - g.left, cy: r.top - g.top + r.height / 2 }; };
  const path = (a, b) => { const p = box(a), q = box(b); if (!p || !q) return '';
    if (Math.abs(p.l - q.l) < 8){ const x = p.r, y1 = p.cy, y2 = q.cy; return `M${x} ${y1} C${x + 36} ${y1} ${x + 36} ${y2} ${x} ${y2}`; }
    const fwd = q.l > p.l; const x1 = fwd ? p.r : p.l, x2 = fwd ? q.l : q.r; const dx = Math.max(24, Math.abs(x2 - x1) * 0.45) * (fwd ? 1 : -1);
    return `M${x1} ${p.cy} C${x1 + dx} ${p.cy} ${x2 - dx} ${q.cy} ${x2} ${q.cy}`; };
  const mk = (id, col) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${col}"/></marker>`;
  const cs = getComputedStyle(document.documentElement);
  const ink = cs.getPropertyValue('--color-neutral-500').trim() || 'currentColor', door = cs.getPropertyValue('--accent-ink').trim() || ink, pred = cs.getPropertyValue('--st-violet-dot').trim() || ink;
  let out = `<defs>${mk('fm-ma', ink)}${mk('fm-md', door)}${mk('fm-mp', pred)}</defs>`;
  FLOW_SPINE.forEach(e => { out += `<path d="${path(e[0], e[1])}" fill="none" stroke="${ink}" stroke-width="1.2" opacity="${_fm.on ? 0.1 : 0.3}" marker-end="url(#fm-ma)"/>`; });
  if (_fm.on){ const L = fmLinesOf(_fm.on);
    L.a.forEach(t => { out += `<path d="${path(_fm.on, t)}" fill="none" stroke="${ink}" stroke-width="2" marker-end="url(#fm-ma)"/>`; });
    L.d.forEach(t => { out += `<path d="${path(_fm.on, t)}" fill="none" stroke="${door}" stroke-width="1.6" marker-end="url(#fm-md)"/>`; });
    L.p.forEach(t => { out += `<path d="${path(_fm.on, t)}" fill="none" stroke="${pred}" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#fm-mp)"/>`; }); }
  svg.innerHTML = out;
}
function fmSelect(k, opts = {}){
  _fm.on = (k && flowMapRow(k)) ? k : null;
  const grid = document.getElementById('fm-grid'); if (!grid) return;
  grid.classList.toggle('is-dim', !!_fm.on);
  grid.querySelectorAll('.fm-node').forEach(el => { el.setAttribute('aria-pressed', 'false'); el.classList.remove('is-to-a', 'is-to-d', 'is-to-p'); });
  if (_fm.on){ const L = fmLinesOf(_fm.on); const on = grid.querySelector(`[data-fm="${_fm.on}"]`); if (on) on.setAttribute('aria-pressed', 'true');
    const mark = (ks, c) => ks.forEach(t => { const el = grid.querySelector(`[data-fm="${t}"]`); if (el && t !== _fm.on) el.classList.add(c); });
    mark(L.d, 'is-to-d'); mark(L.p, 'is-to-p'); mark(L.a, 'is-to-a'); }
  fmDraw(); fmPanelPaint();
  if (!opts.quiet) _fmKeep();
}
/* Jambo's panel: the map in his words; a place chosen, how a person gets there and leaves it, and Open */
function fmPanelHtml(k){
  const r = flowMapRow(k); if (!r) return '';
  const row = (cls, l, v) => `<div class="fm-pr"><div class="fm-pl ${cls}">${_fmE(l)}</div><div class="fm-pv">${v}</div></div>`;
  const tgt = x => `<span class="fm-pi">${_fmE(fmName(x[0]))}${x[1] ? ` <span class="fm-pq">· ${_fmE(_fmW(x[1]))}</span>` : ''}</span>`;
  const none = `<span class="fm-pq">${_fmE(_fmT('fm_none'))}</span>`;
  const go = (k === 'back' || k === 'help') ? '' : `<button type="button" class="hb-link" data-fm-go="${k}">${_fmE(_fmT('fm_open', { p: fmName(k) }))}</button>`;
  return `<style>#ins-panel .fm-pw{padding:16px}#ins-panel .fm-pt{margin:0 0 8px;font-size:13.5px;line-height:1.45}#ins-panel .fm-pgo .hb-link{color:var(--accent-ink);text-decoration:underline;text-underline-offset:3px;background:none;border:0;padding:0;font:inherit;cursor:pointer}#ins-panel .fm-pr{display:grid;grid-template-columns:84px 1fr;gap:10px;padding:8px 0;border-top:1px solid var(--color-divider);font-size:13px;line-height:1.4}#ins-panel .fm-pl{font-weight:var(--w-strong)}#ins-panel .fm-pl.is-d{color:var(--accent-ink)}#ins-panel .fm-pl.is-p{color:var(--st-violet-dot)}#ins-panel .fm-pi{display:block}#ins-panel .fm-pq{color:var(--color-quiet);font-size:12px}#ins-panel .fm-pgo{padding-top:10px}</style>
    <div class="fm-pw"><p class="fm-pt"><b>${_fmE(fmName(k))}</b><br>${_fmE(_fmW(r.s).charAt(0).toUpperCase() + _fmW(r.s).slice(1))}.</p>
    ${row('is-a', _fmT('fm_row_step'), r.a.length ? r.a.map(tgt).join('') : none)}
    ${row('is-d', _fmT('fm_row_doors'), r.d.length ? _fmE(r.d.map(fmName).join(' · ')) : none)}
    ${row('is-p', _fmT('fm_row_pred'), r.p.length ? r.p.map(tgt).join('') : none)}
    <div class="fm-pgo">${go}</div></div>`;
}
function fmJlSay(){ return { lines: [_fmE(_fmT('fm_jl_say', { n: FLOW_MAP.length })), _fmE(_fmT('fm_jl_say2'))], src: false }; }
function fmPanelPaint(){
  if (typeof insPaintPanel !== 'function' || !document.getElementById('ins-panel')) return;
  if (_fm.on) insPaintPanel({ seat: FM_SEAT, item: { k: _fm.on }, solo: true, body: fmPanelHtml(_fm.on), jlWord: _fmT('nav_flowmap'), jlHome: _fmT('nav_flowmap') });
  else insPaintPanel({ seat: FM_SEAT, jlSay: fmJlSay, jlWord: _fmT('nav_flowmap'), jlHome: _fmT('nav_flowmap'), empty: _fmT('fm_jl_say2') });
}
function fmOpen(k){ fmPlacePut({ on: k }); if (typeof setView === 'function') setView('flowmap'); else renderFlowMap(); }
function fmWire(host){
  const page = host.querySelector('#fm-page'); if (!page || page.dataset.fmBound) return;
  page.dataset.fmBound = '1';
  page.addEventListener('click', e => {
    const n = e.target.closest && e.target.closest('[data-fm]');
    if (n){ const k = n.getAttribute('data-fm'); fmSelect(_fm.on === k ? null : k); return; }
  });
  page.addEventListener('keydown', e => { if (e.key === 'Escape' && _fm.on){ fmSelect(null); e.stopPropagation(); } });
  const body = page.querySelector('#fm-body'); if (body && typeof ResizeObserver === 'function'){ const ro = new ResizeObserver(() => fmDraw()); ro.observe(body); }
}
/* Open in Jambo's panel moves through the one mover (the panel sits outside #fm-page, so it is delegated once at load) */
if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-fm-go]'); if (!b) return;
  const k = b.getAttribute('data-fm-go'); if (typeof caGo === 'function') caGo({ kind: 'go', place: k, cid: null });
});

Object.assign(window, { renderFlowMap, fmOpen, fmPlace, fmPlacePut, fmSelect, fmPanelHtml, fmLinesOf });
