// HaTi — THE HANDBOOK'S PAGE: the book (js/handbook.js) drawn, one part at a time.
/* ============================================================================
   THE HANDBOOK (owner, 26 Oct 2026; docs/PLAN-the-handbook.md)
   ----------------------------------------------------------------------------
   A page like the list pages: the seven parts down the left (contents), the
   part in front in the middle — its "Which one do I need?" table, a row of
   chips, then every chapter of the part in the Discover guide's exact format
   (eyebrow · title · what · When to use it · Where to find it · How ·
   Reading it · tip · pictures · cost) — and Jambo's panel on the right with
   his box at the foot. Nothing here writes a record.

   THE DOORS ARE LIVE: a {door:key} chip takes you there through Jambo's one
   mover (caGo), the way the Guide's rows do; a door the reader may not use
   (a contract's face with no contract open, an admin's page) is greyed with
   why, never dead. A {ui:key} is the screen's own label, read from the
   dictionary at paint time, so a renamed button follows.

   PICTURES are files under handbook/img/<chapter>-<n>.png (2–3 close-ups a chapter), taken by
   test/chromium/handbook-verify.js (HANDBOOK_SHOTS=1) in test/handbook-world.js;
   one that is not there yet shows "Picture to come" in its frame, and a
   chapter with no picture by design says why (noShot).

   A REFRESH LANDS AT THE SAME SPOT: the part and the chapter (PLACE_PARTS).
   Opened by its Guide row, by the word "handbook", and by a "how do I …"
   question (navReadHandbook) that lands on the chapter.
   ========================================================================== */
let _hbk = { part: 'around', chapter: null, zoom: null };
const HBK_SEAT = 'handbook';
const _hbkE = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _hbkT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _hbkLang = () => { try { return _hbkT('hbk_lang') === 'sv' ? 'sv' : 'en'; } catch (_){ return 'en'; } };
/* a chapter's text in the reader's language (English where the Swedish is missing, never the key) */
const _hbkW = v => { if (v == null) return ''; if (typeof v === 'string') return v; const l = _hbkLang(); return String(v[l] != null ? v[l] : (v.en || '')); };

function hbkPlace(){ return { part: _hbk.part, chapter: _hbk.chapter }; }
function hbkPlacePut(p){
  if (!p || typeof p !== 'object') return;
  if (p.part && hbkPartOf(p.part)) _hbk.part = p.part;
  _hbk.chapter = (p.chapter && hbkChapterOf(p.chapter)) ? String(p.chapter) : null;
}
const _hbkKeep = () => { if (typeof placeSave === 'function'){ try { placeSave(); } catch (_){ /* a convenience */ } } };

/* ---- LABELS: a button as the screen prints it; a plural key reads its "other" form with N ---- */
function hbkLabel(key){
  const has = k => { try { return _hbkT(k) !== k; } catch (_){ return false; } };
  const k = has(key) ? key : (has(key + '_other') ? key + '_other' : null);
  if (!k) return key;
  return String(_hbkT(k, { n: 'N', calls: '…', q: 'N', name: '…' })).replace(/\{[a-z]+\}/g, '…').replace(/&amp;/g, '&');
}
/* ---- DOORS: a place word, a place inside one, or this book ---- */
function hbkDoorInfo(key){
  const k = String(key || '');
  if (k === 'handbook') return { k, word: _hbkT('gd_p_handbook'), here: true };
  const place = (typeof CA_PLACES !== 'undefined' && Array.isArray(CA_PLACES)) ? CA_PLACES.find(p => p.k === k) : null;
  if (place){
    const gd = _hbkT('gd_p_' + k); const caw = _hbkT('ca_w_' + k);
    const word = gd !== 'gd_p_' + k ? gd : (caw !== 'ca_w_' + k ? caw.charAt(0).toUpperCase() + caw.slice(1) : k);
    let open = null; try { open = (typeof pdContract === 'function') ? pdContract() : null; } catch (_){ open = null; }
    const needOne = place.need === 'one' && !open && !(typeof state !== 'undefined' && state && state.activeId);
    const mayAdd = k !== 'import' || (typeof caMayAdd !== 'function') || caMayAdd();
    return { k, word, why: needOne ? _hbkT('hbk_open_first') : (!mayAdd ? _hbkT('hbk_no_right') : ''), go: () => caGo({ kind: 'go', place: k }) };
  }
  const nav = (typeof NAV_PLACES !== 'undefined' && Array.isArray(NAV_PLACES)) ? NAV_PLACES.find(p => p[0] === k) : null;
  if (nav){
    const admin = (typeof NAV_PLACES_ADMIN !== 'undefined' && NAV_PLACES_ADMIN.has(k)) && !(typeof navIsAdmin === 'function' && navIsAdmin());
    const word = _hbkT('hbk_d_' + k);
    return { k, word: word === 'hbk_d_' + k ? k : word, why: admin ? _hbkT('hbk_admin_only') : '',
      go: () => { let a = null; try { a = (typeof navReadPlace === 'function') ? navReadPlace(k, ' ' + k + ' ') : null; } catch (_){ a = null; }
        return caGo(a && a.kind === 'go' ? a : { kind: 'go', place: 'nav', nav: { k: 'place', key: k } }); } };
  }
  return { k, word: k, why: _hbkT('hbk_no_door') };
}
function hbkDoorChip(key){
  const d = hbkDoorInfo(key);
  if (d.here) return `<span class="hbk-chip is-here">${_hbkE(d.word)}</span>`;
  return `<button type="button" class="hbk-chip is-door" data-hbk-door="${_hbkE(d.k)}"${d.why ? ` disabled aria-disabled="true" title="${_hbkE(d.why)}"` : ` title="${_hbkE(_hbkT('hbk_go'))}"`}>${_hbkE(d.word)}<span class="hbk-chip-go" aria-hidden="true">›</span></button>`;
}
function hbkGoDoor(key){
  const d = hbkDoorInfo(key);
  if (d.here || d.why || typeof d.go !== 'function') return false;
  if (typeof caUseBump === 'function'){ try { caUseBump('handbook'); } catch (_){} }
  let ok = false; try { ok = d.go(); } catch (e){ if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); return false; }
  return ok !== false;
}
/* a chapter's sentence: markers resolved, the rest escaped */
function hbkText(v){
  const s = _hbkW(v);
  let out = '', last = 0;
  for (const m of s.matchAll(HBK_MARK_RE)){
    out += _hbkE(s.slice(last, m.index));
    out += m[1] === 'ui' ? `<span class="hbk-ui">${_hbkE(hbkLabel(m[2]))}</span>` : hbkDoorChip(m[2]);
    last = m.index + m[0].length;
  }
  return out + _hbkE(s.slice(last));
}
const hbkCostHtml = c => { const w = _hbkW(c.cost); const free = /^(free|gratis)$/i.test(w.trim());
  return `<span class="hbk-cost${free ? ' is-free' : ''}">${_hbkE(w)}</span>`; };

/* ---- THE PARTS' WORDS: the Guide's own for the six stages (one fact, one home) ---- */
function hbkPartWords(p){
  if (p.gd) return { w: _hbkT('gd_s_' + p.gd), sub: _hbkT('gd_s_' + p.gd + '_w') };
  return { w: _hbkT(p.w), sub: _hbkT(p.sub) };
}
function hbkPartIndex(k){ return Math.max(0, HANDBOOK_PARTS.findIndex(p => p.k === k)); }

/* ---- THE PAGE ---- */
function hbkContentsHtml(){
  return `<nav class="hbk-toc" aria-label="${_hbkE(_hbkT('hbk_contents'))}"><ol>${HANDBOOK_PARTS.map((p, i) => { const w = hbkPartWords(p); const on = p.k === _hbk.part; const n = hbkChaptersOf(p.k).length;
    return `<li><button type="button" class="hbk-toc-row${on ? ' is-on' : ''}" data-hbk-part="${p.k}"${on ? ' aria-current="true"' : ''}><span class="hbk-toc-n">${i}</span><span class="hbk-toc-w"><b>${_hbkE(w.w)}</b><small>${_hbkE(w.sub)}</small></span><span class="hbk-toc-c">${n}</span></button></li>`; }).join('')}</ol>
    <p class="hbk-checked">${_hbkE(_hbkT('hbk_checked', { d: HANDBOOK_CHECKED }))}</p></nav>`;
}
function hbkPickTableHtml(chs){
  return `<div class="hbk-pick"><h2>${_hbkE(_hbkT('hbk_pick_h'))}</h2><div class="hbk-tbl"><table><thead><tr><th>${_hbkE(_hbkT('hbk_th_want'))}</th><th>${_hbkE(_hbkT('hbk_th_use'))}</th><th>${_hbkE(_hbkT('hbk_th_where'))}</th><th>${_hbkE(_hbkT('hbk_th_cost'))}</th></tr></thead><tbody>${
    chs.map(c => `<tr><td>${hbkText(c.when && c.when[0])}</td><td><a href="#" data-hbk-jump="${c.k}">${_hbkE(_hbkW(c.title))}</a></td><td>${_hbkE(_hbkW(c.eyebrow))}</td><td>${hbkCostHtml(c)}</td></tr>`).join('')
  }</tbody></table></div></div>`;
}
/* A CHAPTER'S PICTURES (owner, 26 Oct 2026: "close-ups, 2–3 per chapter where useful, each in the right state, with
   no shared pictures"): `shots` — each its own file handbook/img/<k>-<n>.png, a close-up of the place the steps
   name, its red numbers the steps' own numbers (hbkShotsOf reads an older single `shot` as one) */
function hbkShotsOf(c){ return Array.isArray(c && c.shots) ? c.shots : (c && c.shot ? [c.shot] : []); }
function hbkPicFile(c, i){ return `handbook/img/${c.k}-${i + 1}.png`; }
function hbkPicHtml(c){
  const shots = hbkShotsOf(c);
  if (!shots.length) return `<figure class="hbk-fig"><div class="hbk-ph">${_hbkE(_hbkT('hbk_no_pic', { why: _hbkW(c.noShot) }))}</div></figure>`;
  return shots.map((sh, i) => { const cap = sh.cap ? _hbkW(sh.cap) : '';
    return `<figure class="hbk-fig"><div class="hbk-pic-wrap"><img class="hbk-pic" src="${_hbkE(hbkPicFile(c, i))}" alt="${_hbkE(cap)}" loading="lazy" data-hbk-pic="${_hbkE(c.k)}-${i + 1}" tabindex="0"><div class="hbk-ph" hidden>${_hbkE(_hbkT('hbk_pic_soon'))}</div></div>${cap ? `<figcaption>${_hbkE(cap)}</figcaption>` : ''}</figure>`; }).join('');
}
const HBK_TONES = { ok: 'is-ok', warn: 'is-warn', risk: 'is-risk', none: 'is-none', no: 'is-no', fact: 'is-fact' };
function hbkChapterHtml(c){
  const blk = (h, inner) => `<div class="hbk-blk"><h3>${_hbkE(_hbkT(h))}</h3>${inner}</div>`;
  const path = (c.path || []).map(p => typeof p === 'string' && p.startsWith('door:') ? hbkDoorChip(p.slice(5)) : `<span class="hbk-chip">${hbkText(p)}</span>`).join('<i>›</i>');
  const read = c.read ? blk('hbk_sec_read', `${c.read.key ? `<div class="hbk-key">${c.read.key.map(k => `<span><i class="hbk-dot ${HBK_TONES[k.tone] || ''}"></i>${_hbkE(_hbkW(k))}</span>`).join('')}</div>` : ''}${c.read.en ? `<p>${hbkText(c.read)}</p>` : ''}`) : '';
  return `<section class="hbk-ch" id="hbk-${_hbkE(c.k)}" data-hbk-ch="${_hbkE(c.k)}"${c.k === _hbk.chapter ? ' aria-current="true"' : ''}>
    <div class="hbk-txt">
      <div class="hbk-eyebrow"><span class="hbk-num">${_hbkE(c.k)}</span>${hbkText(c.eyebrow)}</div>
      <h2>${_hbkE(_hbkW(c.title))}</h2>
      <p class="hbk-what">${hbkText(c.what)}</p>
      ${blk('hbk_sec_when', `<ul class="hbk-bullets">${(c.when || []).map(w => `<li>${hbkText(w)}</li>`).join('')}</ul>`)}
      ${blk('hbk_sec_where', `<div class="hbk-path">${path}</div>`)}
      ${blk('hbk_sec_how', `<ol class="hbk-steps">${(c.how || []).map((h, i) => `<li><span class="hbk-step-n" aria-hidden="true">${i + 1}</span><span class="hbk-step-w">${hbkText(h)}</span></li>`).join('')}</ol>`)}
      ${read}
      ${c.tip ? `<div class="hbk-tip">${hbkText(c.tip)}</div>` : ''}
      <div class="hbk-foot"><span class="hbk-foot-l">${_hbkE(_hbkT('hbk_th_cost'))}</span>${hbkCostHtml(c)}</div>
    </div>
    <div class="hbk-pics">${hbkPicHtml(c)}</div>
  </section>`;
}
function hbkPartHtml(){
  const p = hbkPartOf(_hbk.part) || HANDBOOK_PARTS[0]; const w = hbkPartWords(p); const chs = hbkChaptersOf(p.k);
  return `<div class="hbk-part" data-hbk-part-body="${p.k}">
    <header class="hbk-part-h"><div class="hbk-eyebrow">${_hbkE(_hbkT('hbk_part_n', { n: hbkPartIndex(p.k) }))}</div><h1>${_hbkE(w.w)}</h1><p>${_hbkE(w.sub)}</p></header>
    ${hbkPickTableHtml(chs)}
    <nav class="hbk-chips" aria-label="${_hbkE(_hbkT('hbk_contents'))}">${chs.map(c => `<a href="#" class="hbk-chip is-link" data-hbk-jump="${c.k}">${_hbkE(c.k)} ${_hbkE(_hbkW(c.title))}</a>`).join('')}</nav>
    ${chs.map(hbkChapterHtml).join('')}
  </div>`;
}
function hbkHeadHtml(){
  const n = HANDBOOK_CHAPTERS.length;
  return `<div class="hbk-head ph-card"><div class="ph-top"><div class="hbk-hl"><h1 class="hbk-t1">${_hbkE(_hbkT('nav_handbook'))}</h1><span class="hbk-hn">${n}</span><span class="hbk-hs">${_hbkE(_hbkT('hbk_head_sub'))}</span></div></div></div>`;
}
function hbkCss(){
  return `
  #hbk-page.hbk-page{ --hbk-rule:var(--color-divider); }
  #hbk-page .hbk-head .ph-top{ display:flex; align-items:center; gap:12px; }
  #hbk-page .hbk-hl{ display:flex; align-items:baseline; gap:10px; min-width:0; flex-wrap:wrap; }
  #hbk-page .hbk-t1{ font-size:20px; font-weight:var(--w-title); margin:0; }
  #hbk-page .hbk-hn{ font-variant-numeric:tabular-nums; color:var(--color-neutral-600); }
  #hbk-page .hbk-hs{ color:var(--color-neutral-600); font-size:13px; }
  /* THE CONTENTS ARE READ WHOLE (owner, 26 Oct 2026: "make it so that everything is visible"): the column is as wide as
     it needs (up to 320px), its words wrap rather than being cut, and it never scrolls sideways; the middle narrows */
  #hbk-page .hbk-card{ display:grid; grid-template-columns:minmax(248px,320px) minmax(0,1fr); min-height:0; }
  #hbk-page.is-narrow .hbk-card{ grid-template-columns:minmax(0,1fr); }
  #hbk-page .hbk-toc{ border-right:1px solid var(--hbk-rule); padding:16px; overflow-y:auto; overflow-x:hidden; min-height:0; min-width:0; }
  #hbk-page.is-narrow .hbk-toc{ border-right:0; border-bottom:1px solid var(--hbk-rule); }
  #hbk-page .hbk-toc ol{ list-style:none; margin:0; padding:0; display:grid; gap:4px; }
  #hbk-page .hbk-toc-row{ display:flex; align-items:flex-start; gap:10px; width:100%; padding:8px 10px; border:0; background:none; border-radius:var(--radius); font:inherit; color:inherit; text-align:left; cursor:pointer; min-width:0; }
  #hbk-page .hbk-toc-row:hover{ background:color-mix(in srgb,var(--color-text) 5%,transparent); }
  #hbk-page .hbk-toc-row.is-on{ background:var(--color-accent-50); }
  #hbk-page .hbk-toc-n{ font-variant-numeric:tabular-nums; font-size:12px; color:var(--color-neutral-600); width:16px; flex:0 0 auto; }
  #hbk-page .hbk-toc-w{ display:flex; flex-direction:column; min-width:0; flex:1; }
  #hbk-page .hbk-toc-w b{ font-weight:var(--w-label); overflow-wrap:anywhere; }
  #hbk-page .hbk-toc-w small{ color:var(--color-neutral-600); font-size:12px; line-height:1.35; overflow-wrap:anywhere; }
  #hbk-page .hbk-toc-c{ font-size:11px; font-variant-numeric:tabular-nums; color:var(--color-quiet); border:1px solid var(--hbk-rule); border-radius:999px; padding:0 7px; flex:0 0 auto; }
  #hbk-page .hbk-checked{ margin:16px 0 0; font-size:12px; color:var(--color-neutral-600); }
  /* LINKS SNAP, NOTHING GLIDES (owner, 26 Oct 2026: "it jumps from top to bottom when you press anything") */
  #hbk-page .hbk-body{ overflow:auto; min-height:0; padding:24px 28px 48px; scroll-behavior:auto; }
  #hbk-page .hbk-part{ display:grid; gap:24px; max-width:1180px; }
  #hbk-page .hbk-part-h h1{ font-family:var(--font-doc); font-size:30px; font-weight:600; line-height:1.15; margin:4px 0 0; text-wrap:balance; }
  #hbk-page .hbk-part-h p{ margin:6px 0 0; color:var(--color-neutral-600); max-width:66ch; }
  #hbk-page .hbk-eyebrow{ font-size:12px; font-weight:var(--w-label); letter-spacing:.06em; text-transform:uppercase; color:var(--accent-ink); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  #hbk-page .hbk-num{ font-variant-numeric:tabular-nums; color:var(--color-neutral-600); }
  #hbk-page .hbk-pick{ background:var(--color-surface); border:1px solid var(--hbk-rule); border-radius:var(--radius-lg); padding:16px 20px 8px; }
  #hbk-page .hbk-pick h2{ font-family:var(--font-doc); font-size:20px; font-weight:600; margin:0 0 8px; }
  #hbk-page .hbk-tbl{ overflow-x:auto; }
  #hbk-page .hbk-tbl table{ border-collapse:collapse; width:100%; min-width:560px; font-size:13px; }
  #hbk-page .hbk-tbl th{ text-align:left; font-weight:var(--w-label); font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:var(--color-quiet); padding:8px 10px; border-bottom:1px solid var(--hbk-rule); }
  #hbk-page .hbk-tbl td{ padding:9px 10px; border-bottom:1px solid var(--hbk-rule); vertical-align:top; }
  #hbk-page .hbk-tbl tr:last-child td{ border-bottom:0; }
  #hbk-page .hbk-tbl td a{ font-weight:var(--w-label); color:var(--accent-ink); text-decoration:none; }
  #hbk-page .hbk-chips{ display:flex; flex-wrap:wrap; gap:8px; }
  #hbk-page .hbk-chip{ display:inline-flex; align-items:center; gap:4px; font:inherit; font-size:12px; line-height:1.3; padding:3px 10px; border-radius:999px; background:var(--color-surface); color:var(--color-text); border:1px solid var(--hbk-rule); text-decoration:none; white-space:nowrap; max-width:100%; }
  #hbk-page .hbk-chip.is-link{ cursor:pointer; white-space:normal; }
  #hbk-page .hbk-chip.is-link:hover, #hbk-page .hbk-chip.is-door:not([disabled]):hover{ border-color:var(--accent-ink); color:var(--accent-ink); }
  #hbk-page .hbk-chip.is-door{ cursor:pointer; border-color:var(--accent-ink); color:var(--accent-ink); font-weight:var(--w-label); }
  #hbk-page .hbk-chip.is-door[disabled]{ cursor:not-allowed; border-color:var(--hbk-rule); color:var(--color-neutral-600); font-weight:400; }
  #hbk-page .hbk-chip.is-here{ background:var(--color-accent-50); border-color:transparent; }
  #hbk-page .hbk-chip-go{ color:inherit; opacity:.7; }
  #hbk-page .hbk-ch{ display:grid; grid-template-columns:minmax(0,5fr) minmax(0,7fr); gap:28px; align-items:start; background:var(--color-surface); border:1px solid var(--hbk-rule); border-radius:var(--radius-lg); padding:24px; scroll-margin-top:16px; box-shadow:var(--shadow-sm); }
  #hbk-page .hbk-ch[aria-current="true"]{ border-color:var(--accent-ink); }
  @media (max-width:1180px){ #hbk-page .hbk-ch{ grid-template-columns:minmax(0,1fr); } }
  #hbk-page .hbk-txt{ min-width:0; display:flex; flex-direction:column; gap:14px; }
  #hbk-page .hbk-ch h2{ font-family:var(--font-doc); font-size:24px; font-weight:600; line-height:1.2; margin:0; text-wrap:balance; }
  #hbk-page .hbk-what{ margin:0; font-size:15px; line-height:1.5; }
  #hbk-page .hbk-blk h3{ font-size:12px; font-weight:var(--w-label); letter-spacing:.04em; text-transform:uppercase; color:var(--color-neutral-600); margin:0 0 4px; }
  #hbk-page .hbk-blk p, #hbk-page .hbk-blk ul, #hbk-page .hbk-blk ol{ margin:0; font-size:13px; line-height:1.5; }
  /* THE STEPS ARE NUMBERED AND THE BULLETS SHOW (owner, 26 Oct 2026): a flex list drew neither (its items stopped
     being list items); the steps wear the pictures' own red numbers, so step 2 is the box marked 2 */
  #hbk-page .hbk-blk ul.hbk-bullets{ display:block; list-style:disc outside; padding-left:20px; }
  #hbk-page .hbk-blk ul.hbk-bullets li{ display:list-item; margin:0 0 4px; }
  #hbk-page .hbk-blk ol.hbk-steps{ display:block; list-style:none; padding:0; }
  #hbk-page .hbk-blk ol.hbk-steps li{ display:flex; align-items:flex-start; gap:10px; margin:0 0 8px; }
  #hbk-page .hbk-step-n{ flex:0 0 auto; width:20px; height:20px; border-radius:50%; background:#C0392B; color:#fff; font-size:12px; font-weight:600; line-height:20px; text-align:center; margin-top:1px; font-variant-numeric:tabular-nums; }
  #hbk-page .hbk-step-w{ min-width:0; }
  #hbk-page .hbk-path{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-size:13px; }
  #hbk-page .hbk-path i{ font-style:normal; color:var(--color-neutral-600); }
  #hbk-page .hbk-ui{ font-weight:var(--w-label); white-space:nowrap; }
  #hbk-page .hbk-key{ display:flex; flex-wrap:wrap; gap:12px; font-size:13px; margin-bottom:6px; }
  #hbk-page .hbk-key span{ display:inline-flex; align-items:center; gap:6px; }
  #hbk-page .hbk-dot{ width:9px; height:9px; border-radius:50%; display:inline-block; background:var(--color-neutral-400); }
  #hbk-page .hbk-dot.is-ok{ background:var(--st-green-dot, #2E8B57); } #hbk-page .hbk-dot.is-warn{ background:var(--st-amber-dot, #B7791F); } #hbk-page .hbk-dot.is-risk{ background:var(--st-red-dot, #C0392B); } #hbk-page .hbk-dot.is-none{ background:transparent; box-shadow:inset 0 0 0 1.8px var(--st-steel-dot, #6F86BF); } #hbk-page .hbk-dot.is-no{ background:var(--st-steel-dot, #6F86BF); } #hbk-page .hbk-dot.is-fact{ background:var(--st-violet-dot, #7A44B8); }
  #hbk-page .hbk-tip{ background:var(--color-accent-50); border-radius:var(--radius); padding:12px 14px; font-size:13px; line-height:1.5; }
  #hbk-page .hbk-foot{ display:flex; align-items:center; gap:8px; font-size:12px; color:var(--color-neutral-600); }
  #hbk-page .hbk-cost{ display:inline-block; font-size:12px; font-weight:var(--w-label); padding:1px 8px; border-radius:999px; background:var(--color-neutral-100); color:var(--color-neutral-700); border:1px solid var(--hbk-rule); white-space:nowrap; }
  #hbk-page .hbk-cost.is-free{ background:var(--color-accent-50); color:var(--accent-ink); border-color:transparent; }
  #hbk-page .hbk-pics{ display:flex; flex-direction:column; gap:18px; min-width:0; }
  #hbk-page .hbk-fig{ margin:0; display:flex; flex-direction:column; gap:8px; }
  /* A FRAME THAT NEVER CHANGES SIZE: a picture arriving late moves nothing under the reader (the jump) */
  #hbk-page .hbk-pic-wrap{ position:relative; min-width:0; aspect-ratio:16/10; border-radius:var(--radius); border:1px solid var(--hbk-rule); background:#fff; overflow:hidden; }
  #hbk-page .hbk-pic{ width:100%; height:100%; object-fit:contain; display:block; background:#fff; cursor:zoom-in; }
  #hbk-page .hbk-pic[hidden], #hbk-page .hbk-ph[hidden]{ display:none; }
  #hbk-page .hbk-pic-wrap > .hbk-ph{ position:absolute; inset:0; aspect-ratio:auto; border:0; }
  #hbk-page .hbk-ph{ aspect-ratio:16/10; width:100%; border-radius:var(--radius); border:1px dashed var(--hbk-rule); background:var(--color-neutral-50); display:flex; align-items:center; justify-content:center; color:var(--color-neutral-600); font-size:13px; text-align:center; padding:16px; box-sizing:border-box; }
  #hbk-page .hbk-fig figcaption{ font-size:13px; color:var(--color-neutral-600); }
  #hbk-page .hbk-zoom{ position:fixed; inset:0; background:rgba(0,0,0,.82); display:flex; align-items:center; justify-content:center; padding:24px; z-index:79; cursor:zoom-out; }
  #hbk-page .hbk-zoom img{ max-width:100%; max-height:100%; border-radius:8px; }
  `;
}
function renderHandbook(){
  const host = document.getElementById('content'); if (!host) return;
  const wide = typeof window.insFits === 'function' && insFits() && typeof window.insPaintPanel === 'function';
  if (wide && typeof window.newLookOn === 'function' && newLookOn()){ hbknRender(host); return; }
  const scroller = document.querySelector('#hbk-page .hbk-body'); const keepScroll = scroller ? scroller.scrollTop : null;
  host.innerHTML = `<div class="view-enter sap-page ins-page hbk-page${wide ? '' : ' is-narrow'}" id="hbk-page" data-ins-page="${HBK_SEAT}" data-ins="${wide ? 1 : 0}"><style>${hbkCss()}</style>
    ${hbkHeadHtml()}
    <div class="ins-body"><section class="ins-card hbk-card" aria-label="${_hbkE(_hbkT('nav_handbook'))}">${hbkContentsHtml()}<div class="hbk-body scroll-thin" id="hbk-body">${hbkPartHtml()}</div></section>${wide ? `<aside id="ins-panel" class="ins-panel" aria-label="${_hbkE(_hbkT('hbk_panel_label'))}"></aside>` : ''}</div></div>`;
  if (wide) hbkPanelPaint();
  hbkWire(host);
  if (_hbk.chapter) hbkScrollTo(_hbk.chapter); else if (keepScroll != null){ const sc = document.getElementById('hbk-body'); if (sc) sc.scrollTop = keepScroll; }
  if (typeof setActiveNav === 'function') setActiveNav('handbook');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* Jambo's panel: the book in his words, his box at the foot (ONE WINDOW: nothing chosen, only his words) */
function hbkJlSay(){
  const lines = [_hbkE(_hbkT('hbk_jl_say', { n: HANDBOOK_CHAPTERS.length, p: HANDBOOK_PARTS.length })), _hbkE(_hbkT('hbk_jl_say2'))];
  return { lines, src: false };
}
function hbkPanelPaint(){
  if (typeof insPaintPanel !== 'function') return;
  insPaintPanel({ seat: HBK_SEAT, jlSay: hbkJlSay, jlWord: _hbkT('nav_handbook'), jlHome: _hbkT('nav_handbook'), empty: _hbkT('hbk_jl_say2') });
}
/* A CHAPTER SNAPS INTO PLACE (owner, 26 Oct 2026: "it jumps from top to bottom when you press anything"): only the
   book's own scroller moves, at once, to the chapter's top — never the page, never a glide, never a repaint */
function hbkScrollTo(k){
  const el = document.getElementById('hbk-' + k), sc = document.getElementById('hbk-body'); if (!el || !sc) return false;
  sc.scrollTop = Math.max(0, sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 16);
  return true;
}
function hbkMarkChapter(){
  const page = document.getElementById('hbk-page'); if (!page) return;
  page.querySelectorAll('.hbk-ch[aria-current]').forEach(x => x.removeAttribute('aria-current'));
  const el = _hbk.chapter && document.getElementById('hbk-' + _hbk.chapter); if (el) el.setAttribute('aria-current', 'true');
}
/* A PART OPENS AT ITS TOP: the middle alone is drawn again, the contents' lit row moved, Jambo's panel untouched */
function hbkShowPart(){
  /* the new look draws one chapter at a time: the page is drawn again on the part's first chapter */
  if (document.querySelector('.hbkn-page')){ renderHandbook(); return true; }
  const sc = document.getElementById('hbk-body'); if (!sc) return false;
  sc.innerHTML = hbkPartHtml(); sc.scrollTop = 0;
  document.querySelectorAll('#hbk-page .hbk-toc-row').forEach(r => { const on = r.getAttribute('data-hbk-part') === _hbk.part;
    r.classList.toggle('is-on', on); if (on) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current'); });
  return true;
}
/* THE ONE DOOR INTO A CHAPTER: the Guide's row, the word, a "how do I …" question, a chip */
function hbkOpen(chapter, opts = {}){
  const c = chapter ? hbkChapterOf(chapter) : null;
  const was = _hbk.part;
  if (c){ _hbk.part = c.part; _hbk.chapter = c.k; }
  else if (opts.part && hbkPartOf(opts.part)){ _hbk.part = opts.part; _hbk.chapter = null; }
  if (typeof state !== 'undefined' && state && state.view === 'handbook' && document.getElementById('hbk-body')){
    if (document.querySelector('.hbkn-page')){ renderHandbook(); _hbkKeep(); return true; }
    if (_hbk.part !== was || !(c && document.getElementById('hbk-' + c.k))) hbkShowPart();
    if (_hbk.chapter) hbkScrollTo(_hbk.chapter);
    hbkMarkChapter();
  }
  else if (typeof setView === 'function') setView('handbook');
  _hbkKeep();
  return true;
}
function hbkWire(host){
  const page = host.querySelector('#hbk-page'); if (!page || page.dataset.hbkBound) return;
  page.dataset.hbkBound = '1';
  page.addEventListener('click', e => {
    const part = e.target.closest && e.target.closest('[data-hbk-part]');
    if (part){ _hbk.part = part.getAttribute('data-hbk-part'); _hbk.chapter = null; hbkShowPart(); _hbkKeep(); return; }
    const jump = e.target.closest && e.target.closest('[data-hbk-jump]');
    if (jump){ e.preventDefault(); _hbk.chapter = jump.getAttribute('data-hbk-jump'); hbkScrollTo(_hbk.chapter); hbkMarkChapter(); _hbkKeep(); return; }
    const door = e.target.closest && e.target.closest('[data-hbk-door]');
    if (door){ if (door.disabled) return; hbkGoDoor(door.getAttribute('data-hbk-door')); return; }
    const pic = e.target.closest && e.target.closest('img.hbk-pic');
    if (pic){ hbkZoom(pic.getAttribute('src'), pic.getAttribute('alt')); return; }
    const zoom = e.target.closest && e.target.closest('.hbk-zoom');
    if (zoom){ zoom.remove(); return; }
  });
  page.addEventListener('keydown', e => {
    if (e.key === 'Escape'){ const z = page.querySelector('.hbk-zoom'); if (z){ z.remove(); e.stopPropagation(); } return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('img.hbk-pic')){ e.preventDefault(); hbkZoom(e.target.getAttribute('src'), e.target.getAttribute('alt')); }
  });
  /* a picture not taken yet: its frame says so (an img's error does not bubble, so it is caught on the way down) */
  page.addEventListener('error', e => { const im = e.target; if (!(im && im.matches && im.matches('img.hbk-pic'))) return; im.hidden = true; const ph = im.parentElement && im.parentElement.querySelector('.hbk-ph'); if (ph) ph.hidden = false; }, true);
}
function hbkZoom(src, alt){
  const page = document.getElementById('hbk-page'); if (!page || !src) return;
  const old = page.querySelector('.hbk-zoom'); if (old) old.remove();
  const z = document.createElement('div'); z.className = 'hbk-zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', alt || '');
  z.innerHTML = `<img src="${_hbkE(src)}" alt="${_hbkE(alt || '')}">`;
  page.appendChild(z);
}

/* ═══ THE HANDBOOK, THE NEW LOOK (round 7, second half, as drawn; behind the admin's "Try the new look") ═══
   One chapter at a time: the parts down the left with the open part's chapters under it, the chapter in the middle
   (its number and where, its title, what it is, the steps numbered, its pictures two by two with their captions, the
   tip and its cost; when to use it and where it is follow, so nothing the book says is lost), Svenska and Print at
   the top. Jambo's panel: he answers from this book (no call) and the chapters people ask about most, each a door. */
function hbknChapter(){
  const chs = hbkChaptersOf(_hbk.part);
  return (_hbk.chapter && hbkChapterOf(_hbk.chapter)) || chs[0] || HANDBOOK_CHAPTERS[0];
}
function hbknNavHtml(){
  const cur = hbknChapter();
  return `<nav class="hbkn-nav" aria-label="${_hbkE(_hbkT('hbk_contents'))}">${HANDBOOK_PARTS.map((p, i) => { const w = hbkPartWords(p), on = p.k === _hbk.part;
    return `<button type="button" class="hbkn-part${on ? ' is-on' : ''}" data-hbk-part="${p.k}">${_hbkE(i + ' \u00b7 ' + w.w)}</button>`
      + (on ? hbkChaptersOf(p.k).map(c => `<button type="button" class="hbkn-ch${c.k === cur.k ? ' is-on' : ''}" data-hbkn-ch="${_hbkE(c.k)}"${c.k === cur.k ? ' aria-current="true"' : ''}>${_hbkE(_hbkW(c.title))}</button>`).join('') : ''); }).join('')}</nav>`;
}
function hbknChapterHtml(c){
  const shots = hbkShotsOf(c);
  const pics = shots.length ? `<div class="hbkn-pics">${shots.map((sh, i) => { const cap = sh.cap ? _hbkW(sh.cap) : '';
    return `<figure class="hbk-fig"><div class="hbk-pic-wrap"><img class="hbk-pic" src="${_hbkE(hbkPicFile(c, i))}" alt="${_hbkE(cap)}" loading="lazy" data-hbk-pic="${_hbkE(c.k)}-${i + 1}" tabindex="0"><div class="hbk-ph" hidden>${_hbkE(_hbkT('hbk_pic_soon'))}</div></div>${cap ? `<figcaption>${_hbkE(cap)}</figcaption>` : ''}</figure>`; }).join('')}</div>` : '';
  const path = (c.path || []).map(p => typeof p === 'string' && p.startsWith('door:') ? hbkDoorChip(p.slice(5)) : `<span class="hbk-chip">${hbkText(p)}</span>`).join('<i>›</i>');
  return `<article class="hbkn-chapter" id="hbk-${_hbkE(c.k)}" data-hbk-ch="${_hbkE(c.k)}">
    <div class="hbkn-eye">${_hbkE(c.k)} \u00b7 ${hbkText(c.eyebrow)}</div><h2 class="hbkn-t">${_hbkE(_hbkW(c.title))}</h2>
    <p class="hbkn-what">${hbkText(c.what)}</p>
    <ol class="hbkn-steps">${(c.how || []).map(h => `<li>${hbkText(h)}</li>`).join('')}</ol>
    ${pics}
    <p class="hbkn-tip">${c.tip ? hbkText(c.tip) + ' ' : ''}${_hbkE(_hbkT('hbkn_cost'))} ${hbkCostHtml(c)}</p>
    ${(c.when || []).length ? `<div class="hbkn-more"><h3>${_hbkE(_hbkT('hbk_sec_when'))}</h3><ul>${c.when.map(w => `<li>${hbkText(w)}</li>`).join('')}</ul></div>` : ''}
    ${path ? `<div class="hbkn-more"><h3>${_hbkE(_hbkT('hbk_sec_where'))}</h3><div class="hbk-path">${path}</div></div>` : ''}
  </article>`;
}
/* the chapters people ask about most, as doors (no call): one per later part, its own title */
function hbknOftenAsked(){
  return ['negotiate', 'sign', 'keep', 'settings'].map(k => (HANDBOOK_PARTS.find(p => p.k === k) ? hbkChaptersOf(k)[0] : null)).filter(Boolean).slice(0, 3);
}
function hbknPanelHtml(){
  const E = _hbkE;
  const rows = hbknOftenAsked().map(c => `<div class="pd2-ch-door"><button type="button" class="rfp-a" data-hbkn-ch="${E(c.k)}">${E(_hbkW(c.title))}</button><span>${E(_hbkT('hbkn_free_ch', { k: c.k }))}</span></div>`).join('');
  return `<div class="pd2-chosen cun-panel hbkn-panel"><p class="pd2-ch-head">${E(_hbkT('hbkn_p_head'))}</p>${rows ? `<div class="pd2-ch-cap">${E(_hbkT('hbkn_p_often'))}</div>${rows}` : ''}`
    + `<div class="pd2-turn"><i class="pd2-jface" aria-hidden="true"></i><div><b>${E(_hbkT('cn2_jambo'))}</b><p>${E(_hbkT('hbkn_p_turn'))}</p></div></div></div>`;
}
function hbknRender(host){
  const c = hbknChapter(); _hbk.part = c.part || _hbk.part;
  const sv = _hbkLang() === 'sv';
  host.innerHTML = `<div class="view-enter sap-page ap-page is-ins apn-page hbkn-page" id="hbk-page" data-ins-page="${HBK_SEAT}" data-ins="1"><style>${hbkCss()}</style>
    <div class="ap-body is-ins"><section class="ap-card apn-card hbkn-card" aria-label="${_hbkE(_hbkT('nav_handbook'))}">
      <div class="cun-head"><h2 class="ctf-h">${_hbkE(_hbkT('nav_handbook'))}</h2><span class="ctf-hf">${_hbkE(_hbkT('hbkn_checked', { d: (typeof regDotDate === 'function' ? regDotDate(HANDBOOK_CHECKED) : HANDBOOK_CHECKED) }))}</span><span class="ctf-sp"></span>
        <button type="button" class="ui-btn hbkn-pill" data-hbkn-lang="${sv ? 'en' : 'sv'}">${_hbkE(sv ? 'English' : 'Svenska')}</button><button type="button" class="ui-btn hbkn-pill" data-hbkn-print>${_hbkE(_hbkT('hbkn_print'))}</button></div>
      <div class="hbkn-cols">${hbknNavHtml()}<div class="hbkn-body hbk-body scroll-thin" id="hbk-body">${hbknChapterHtml(c)}</div></div>
    </section><aside id="ins-panel" class="ins-panel" aria-label="${_hbkE(_hbkT('hbk_panel_label'))}"></aside></div></div>`;
  insPaintPanel({ seat: HBK_SEAT, jlWord: _hbkT('nav_handbook'), item: { id: 'handbook' }, head: false, tabCount: 0, body: hbknPanelHtml() });
  hbkWire(host);
  const page = document.getElementById('hbk-page');
  if (page && !page.dataset.hbknBound){ page.dataset.hbknBound = '1';
    page.addEventListener('click', e => { const t = e.target && e.target.closest ? e.target : null; if (!t) return; let el;
      if ((el = t.closest('[data-hbkn-lang]'))){ if (typeof langSet === 'function') langSet(el.getAttribute('data-hbkn-lang')); return; }
      if (t.closest('[data-hbkn-print]')){ if (typeof window.print === 'function') window.print(); } }); }
  if (typeof setActiveNav === 'function') setActiveNav('handbook');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
/* a chapter pressed in the list or the panel: the middle shows it, at its top (the panel lives outside the page) */
if (typeof document !== 'undefined' && !document._hbknWired){ document._hbknWired = true;
  document.addEventListener('click', e => { const el = e.target && e.target.closest && e.target.closest('[data-hbkn-ch]'); if (!el || typeof state === 'undefined' || state.view !== 'handbook') return;
    e.preventDefault(); const c = hbkChapterOf(el.getAttribute('data-hbkn-ch')); if (!c) return; _hbk.part = c.part; _hbk.chapter = c.k; _hbkKeep(); renderHandbook(); });
}
Object.assign(window, { hbknRender, hbknChapter, hbknChapterHtml, hbknPanelHtml, hbknOftenAsked });
Object.assign(window, { hbkShotsOf, hbkPicFile, hbkShowPart, hbkMarkChapter, hbkPlace, hbkPlacePut, renderHandbook, hbkOpen, hbkGoDoor, hbkDoorInfo, hbkLabel, hbkText, hbkChapterHtml, hbkPanelPaint, hbkJlSay });
