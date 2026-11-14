/* ============================================================
   THE REBUILD MEASURE — a measuring instrument, not a test
   (owner, 13 Nov 2026, the flash survey: "when I pick 'A Where we are page' on the Send screen, the screen flashes
   and is replaced by a new one, and I can no longer go back … a press that should only change the words rebuilds
   the whole page instead")
   ============================================================
   It asserts nothing and always exits 0. It PRESSES every door it can find on every page (and the doors a press
   uncovers: a list that opens, a pop-up, a menu), and for each press it says three things:
     rebuilt   was a part of the screen thrown away and built again (every piece in it is a new piece, although the
               reader stayed on the same page), or was a pop-up closed and opened again
     flash     frames in which the page stood blank or pale, and how far things on screen jumped
     lost      what the reader had before the press and no longer has: words typed in a box, where a list had been
               scrolled to, and the choice they had (pressing the old choice again does not bring it back)
   How it knows a piece is new: before each press every piece on screen is marked; a piece that carries no mark
   afterwards was built by the press. A press that takes the reader to another page is a move, not a rebuild, and
   is only listed (the flash measure films moves).

   WHAT IT LEAVES ALONE, AND SAYS SO: buttons that finish something (send, sign, delete, approve, pay …) are counted
   and not pressed; words are not typed before a save-like button; a page's time is capped and what was not reached
   is counted, never hidden.

   Run by .github/workflows/rebuild-measure.yml (when this file changes, or by hand):
     node test/chromium/_audit/rebuild-measure.js
     HATI_RB_ONLY=send,approvals HATI_RB_PAGE_MS=240000 node test/chromium/_audit/rebuild-measure.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../../helpers');

const BOOK = +process.env.HATI_RB_BOOK || 40;
const PAGE_MS = +process.env.HATI_RB_PAGE_MS || 100000;      /* the time one page may take */
const FILM_MS = +process.env.HATI_RB_FILM_MS || 350;         /* how long each press is filmed */
const DEPTH = +process.env.HATI_RB_DEPTH || 3;               /* a door, the doors it uncovers, and theirs */
const TOP_DOORS = +process.env.HATI_RB_DOORS || 45, DEEP_DOORS = 20;
const ONLY = String(process.env.HATI_RB_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
const say = (...a) => console.log(...a);
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
/* buttons that finish something: counted, never pressed */
const FINAL = /\b(delete|remove|sign out|log out|logout|send|discard|archive|sign|approve|reject|accept|decline|publish|pay|import|upload|rebuild|reset|restore|terminate|withdraw|revoke|hand over|file it|chase|remind|download|export|print|svenska|english|swedish|engelska|språk|language)\b/i;   /* and the language: a press that turned the app to Swedish made the first run's later rows Swedish */
/* buttons that keep what was typed: pressed, but nothing is typed first */
const SAVEISH = /\b(save|create|add|post|ok|done|confirm|apply|next|continue|start|run|ask|go|submit|draft|write)\b/i;

const HTML = '<h1>SERVICES AGREEMENT</h1><p>This Agreement is made between Young and Ventura Capital.</p>'
  + ['Services', 'Fees', 'Term', 'Liability', 'Confidentiality', 'Governing law', 'Notices', 'Assignment', 'Termination', 'Data protection'].map((t, i) => `<h2>${i + 1}. ${t}</h2><p>${t} are as set out in this clause ${i + 1}, and each party shall keep to them in good faith and without delay. ${'The parties agree to act reasonably. '.repeat(6)}</p>`).join('');
function book(){
  const out = []; const st = ['Under Review', 'Signed', 'Signed', 'Under Review', 'Draft'];
  for (let i = 0; out.length < BOOK; i++){
    const f = JSON.parse(JSON.stringify(FIXTURES[i % FIXTURES.length]));
    f.id = 'MK-R' + String(1000 + i); f.name = f.name + ' ' + (i + 1); f.status = st[i % st.length];
    if (f.status === 'Signed' && i % 2 === 0){
      const due = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
      f.obligations = [{ id: 'ob-' + f.id + '-1', desc: 'Send the monthly report', due: due((i % 40) - 10), party: 'ours', status: 'open' }];
    }
    out.push(f);
  }
  const c = fixtureContract('MK-110', 'Services Agreement', 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, upload: { name: 'S.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  out.push(c);
  return out;
}

/* ---------------- in the page ---------------- */
const INIT = () => {
  if (window.__rb) return;
  const PARTS = [['modal-root', 'the pop-up'], ['ig-dock', "Jambo's panel"], ['ig-paper', 'the paper'], ['ins-panel', 'the panel beside the list'], ['hb-board', 'the Board'],
    ['ct-place', 'the Contracts place'], ['st-side', "Settings' side panel"], ['panel-body', 'the side panel'], ['page-head', "the page's head"], ['content', 'the page']];
  const PROBE = 'zq typed here';
  const LIT = '[aria-selected="true"],[aria-current="true"],[aria-checked="true"],[aria-pressed="true"]';
  const PRESSABLE = 'button, [role="tab"], [role="button"], [role="menuitem"], [role="menuitemradio"], [role="radio"], [role="option"], summary, tbody tr';
  let gen = 0, cur = null;
  const txt = el => String((el && (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title'))) || '').replace(/\s+/g, ' ').trim();
  const label = el => txt(el).slice(0, 44) || ('<' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '>');
  const vis = el => { try { const r = el.getBoundingClientRect(); if (!(r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth)) return false;
    return getComputedStyle(el).visibility !== 'hidden'; } catch (_){ return false; } };
  const partOf = el => { for (const [id] of PARTS){ const p = document.getElementById(id); if (p && p.contains(el)) return id; } return 'top'; };
  const dlgNow = () => { const d = document.querySelector('#modal-root [role="dialog"]'); return d && vis(d) ? d : null; };
  const scope = () => dlgNow() ? document.getElementById('modal-root') : document.body;
  const dataOf = el => [...el.attributes].filter(a => /^data-/.test(a.name) && a.value.length <= 40 && !/^data-(rb|pz|land)/.test(a.name)).map(a => a.name + '=' + a.value).sort().join(',');
  const baseKey = el => [partOf(el), el.tagName.toLowerCase(), el.id || '', el.getAttribute('role') || '', dataOf(el), txt(el).slice(0, 30)].join('|');
  /* every door a person could press now, each with a key it can be found by again */
  const doorEls = () => { const sc = scope(), out = [], seen = {}, shapes = {};
    for (const el of sc.querySelectorAll(PRESSABLE)){
      if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('#toast-root') || !vis(el)) continue;
      if (el.tagName === 'TR' && (el.querySelector('th') || el.previousElementSibling && el.previousElementSibling.previousElementSibling)) continue;   /* a list's first two rows stand for the rest */
      const shape = [partOf(el), el.tagName, el.getAttribute('role') || '', [...el.attributes].filter(a => /^data-/.test(a.name)).map(a => a.name).sort().join(','), [...el.classList].slice(0, 2).join('.')].join('|');
      const row = el.closest('tr, li, [role="row"]');
      if (row && row !== el){ shapes[shape] = (shapes[shape] || 0) + 1; if (shapes[shape] > 2) continue; }       /* the same button on every row is pressed on two */
      const b = baseKey(el); seen[b] = (seen[b] || 0) + 1;
      out.push([b + '#' + seen[b], el]); }
    return out; };
  const find = key => { const hit = doorEls().find(([k]) => k === key); return hit ? hit[1] : null; };
  const sig = () => { const d = dlgNow(), sc = d || document.body;
    let face = ''; try { face = typeof hbFace === 'function' ? String(hbFace() || '') : ''; } catch (_){ face = ''; }
    const st = window.state || {};
    return { view: String(st.view || ''), face, active: String(st.activeId || ''), dlg: !!d,
      dlgName: d ? (d.getAttribute('aria-label') || txt(d.querySelector('h1,h2,h3,.dlg-title')) || '').slice(0, 50) : '',
      lit: [...sc.querySelectorAll(LIT)].slice(0, 30).map(label), words: [...sc.querySelectorAll('[aria-expanded]')].filter(vis).slice(0, 20).map(label) }; };
  const wordsIn = part => { const out = []; if (!part) return out; const w = document.createTreeWalker(part, NodeFilter.SHOW_ELEMENT); let n = w.currentNode, i = 0;
    while (n && i < 6000){ i++; if (n !== part){ let has = false; for (const c of n.childNodes) if (c.nodeType === 3 && c.nodeValue.trim()){ has = true; break; } if (has && vis(n)) out.push(n); } n = w.nextNode(); }
    return out; };
  const fieldKey = (el, i) => partOf(el) + '|' + (el.id || el.name || el.getAttribute('placeholder') || el.getAttribute('aria-label') || 'box') + '|' + i;
  const fieldsNow = () => [...scope().querySelectorAll('textarea, input[type="text"], input:not([type])')].filter(el => !el.disabled && !el.readOnly && vis(el)
    && !el.hasAttribute('data-lh-q') && !/search|filter|find|sök/i.test((el.getAttribute('placeholder') || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + el.id));
  const scrollKey = el => el.id ? '#' + el.id : partOf(el) + '|' + [...el.classList].slice(0, 3).join('.');
  const scrollersNow = () => [...scope().querySelectorAll('*')].filter(el => { if (el.scrollHeight <= el.clientHeight + 60 || el.clientHeight < 80) return false; const o = getComputedStyle(el).overflowY; return (o === 'auto' || o === 'scroll') && vis(el); })
    .sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth).slice(0, 4);

  window.__rb = {
    doors(){ return doorEls().map(([key, el]) => ({ key, label: label(el), part: partOf(el) })); },
    click(key){ const el = find(key); if (!el) return false; try { el.click(); } catch (_){ } return true; },
    sig,
    /* before a press: type, scroll, remember, then mark every piece on screen */
    async prep({ key, type }){
      const el = find(key); if (!el) return { missing: true };
      const fields = [];
      fieldsNow().slice(0, 3).forEach((f, i) => { try {
        if (type && !f.value){ const proto = f.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, 'value').set.call(f, PROBE); f.dispatchEvent(new Event('input', { bubbles: true })); }
        /* a press that USES the words (Ask, Send to Jambo, Save) empties the box on purpose: nothing is remembered
           for it, so it is never counted as a loss (the first run counted those) */
        if (type && f.value) fields.push({ key: fieldKey(f, i), val: f.value, name: (f.getAttribute('placeholder') || f.getAttribute('aria-label') || f.id || 'a box').slice(0, 40) }); } catch (_){ } });
      const scrolls = [];
      for (const s of scrollersNow()){ try { if (s.scrollTop < 40) s.scrollTop = Math.min(160, s.scrollHeight - s.clientHeight); if (s.scrollTop >= 40) scrolls.push({ key: scrollKey(s), top: s.scrollTop }); } catch (_){ } }
      await new Promise(r => setTimeout(r, 180));                         /* what typing and scrolling drew is not the press's */
      const again = find(key); if (!again) return { missing: true };
      gen++; const parts = {};
      for (const n of document.body.querySelectorAll('*')) n.__rb = gen;
      for (const [id] of PARTS){ const p = document.getElementById(id); parts[id] = p ? wordsIn(p).length : 0; }
      /* the choice the reader has now, if this door is one of several choices */
      let choice = null;
      if (again.matches('[role="menuitemradio"],[role="radio"],[role="tab"],[role="option"],[aria-pressed],[aria-checked],[aria-selected],[aria-current]')){
        const grp = again.closest('[role="menu"],[role="tablist"],[role="radiogroup"],[role="listbox"]') || again.parentElement;
        const was = grp && [...grp.querySelectorAll(LIT)].find(x => x !== again && !x.contains(again));
        if (was){ const hit = doorEls().find(([, e]) => e === was); choice = { key: hit ? hit[0] : null, base: baseKey(was), label: label(was) }; } }
      cur = { gen, parts, fields, scrolls, sig: sig(), keys: doorEls().map(([k]) => k), dlg: dlgNow() };
      return { sig: cur.sig, choice, typed: fields.length, scrolled: scrolls.length };
    },
    /* the press, filmed */
    async press({ key, ms }){
      const el = find(key); if (!el) return { missing: true };
      let dlgGone = false, jump = 0, po = null, err = null;
      const mr = document.getElementById('modal-root'), d0 = cur && cur.dlg;
      const mo = new MutationObserver(recs => { for (const r of recs) for (const n of r.removedNodes) if (d0 && (n === d0 || (n.contains && n.contains(d0)))) dlgGone = true; });
      if (mr) mo.observe(mr, { childList: true, subtree: true });
      try { po = new window.PerformanceObserver(l => { for (const e of l.getEntries()) jump += e.value; }); po.observe({ type: 'layout-shift', buffered: false }); } catch (_){ po = null; }
      const t0 = performance.now();
      try { el.click(); } catch (e){ err = String(e && e.message || e).slice(0, 100); }
      let frames = 0, blank = 0, paleFrames = 0; const pale = new Set();
      while (performance.now() - t0 < ms){ await new Promise(r => requestAnimationFrame(() => r())); frames++;
        const main = document.querySelector('#ig-page:not([hidden])') || document.querySelector('#content .view-enter') || document.getElementById('content');
        if ((main && !main.firstElementChild) || (d0 && mr && !mr.firstElementChild && dlgGone)) blank++;
        let p = 0; for (const [id, nm] of PARTS){ const h = document.getElementById(id); if (!h) continue; for (const k of h.children){ const r = k.getBoundingClientRect();
          if (r.width >= 160 && r.height >= 60 && r.bottom > 0 && r.top < innerHeight && +getComputedStyle(k).opacity < 1){ p++; pale.add(nm); } } }
        if (p) paleFrames++; }
      mo.disconnect(); if (po) po.disconnect();
      return { err, frames, blank, paleFrames, pale: [...pale], jump: +jump.toFixed(3), dlgGone };
    },
    /* after the press: which pieces are new, and what the reader no longer has */
    after(){
      if (!cur) return null;
      const s = sig(), parts = [], d = dlgNow();
      for (const [id, name] of PARTS){ const p = document.getElementById(id); if (!p) continue; const ws = wordsIn(p); if (!ws.length || !cur.parts[id]) continue;
        const fresh = ws.filter(n => n.__rb !== cur.gen).length;
        const kid = [...p.children].find(vis);
        parts.push({ id, name, n: ws.length, fresh, pct: Math.round(100 * fresh / ws.length), whole: !!(kid && kid.__rb !== cur.gen && fresh === ws.length) }); }
      const fNow = fieldsNow(), typed = [];
      for (const f of cur.fields){ const el = fNow.find((x, i) => fieldKey(x, i) === f.key); typed.push({ name: f.name, there: !!el, kept: !!(el && el.value === f.val) }); }
      const sNow = scrollersNow(), scrolls = [];
      for (const sc of cur.scrolls){ const el = sNow.find(x => scrollKey(x) === sc.key) || (sc.key[0] === '#' ? document.querySelector(sc.key) : null);
        scrolls.push({ key: sc.key, there: !!el, was: sc.top, now: el ? el.scrollTop : null, room: el ? el.scrollHeight - el.clientHeight : 0 }); }
      const had = new Set(cur.keys);
      const fresh = doorEls().filter(([k]) => !had.has(k)).map(([key, el]) => ({ key, label: label(el) }));
      return { sig: s, parts, typed, scrolls, dlgKept: !!(d && cur.dlg && d === cur.dlg), fresh,
        opened: [...document.querySelectorAll('[aria-expanded="true"]')].filter(vis).length };
    },
  };
};

/* ---------------- on the runner ---------------- */
const PLACES = ['contracts', 'negotiations', 'approvals', 'oblig', 'requests', 'parties', 'people', 'ourpaper', 'import', 'mynotes', 'reads', 'pulse', 'calendar', 'explorer', 'handbook', 'house', 'settings'];
const BASES = [
  { k: 'send', name: 'The Send screen', go: "pdOpenOnHome('MK-110','copilot'); setTimeout(()=>{ try{ openShareModal(getContract('MK-110')); }catch(_){ } }, 500)", wait: 2200 },
  { k: 'dossier', name: 'A paper: the Dossier', go: "pdOpenOnHome('MK-110','copilot')", wait: 1200 },
  { k: 'clauses', name: 'A paper: Clauses', go: "pdOpenOnHome('MK-110','copilot'); setTimeout(()=>{ const b=document.querySelector('#ig-dock [data-pd-tab=\"doc\"]'); if(b) b.click(); }, 500)", wait: 1800 },
  { k: 'redlines', name: 'A paper: Redlines', go: "pdOpenOnHome('MK-110','copilot'); setTimeout(()=>{ const b=document.querySelector('#ig-dock [data-pd-tab=\"red\"]'); if(b) b.click(); }, 500)", wait: 1800 },
  { k: 'board', name: 'The Board', go: "caGo({kind:'go',place:'board'})", wait: 900 },
  ...PLACES.map(k => ({ k, name: 'Page: ' + k, go: `caGo({kind:'go',place:'${k}'})`, wait: 900 })),
].filter(b => !ONLY.length || ONLY.includes(b.k));

const short = s => String(s || '').replace(/\|/g, '/').slice(0, 44);
const sameList = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);

function judge(pre, film, post){
  const a = pre.sig, b = post.sig;
  const moved = a.view !== b.view || a.face !== b.face || a.active !== b.active;
  const what = [], lost = [], flash = [], away = [];
  const reopened = a.dlg && b.dlg && !post.dlgKept;
  if (reopened) what.push('the pop-up is closed and a new one opened' + (a.dlgName !== b.dlgName ? ` ("${a.dlgName}" became "${b.dlgName}")` : ''));
  if (!moved) for (const p of post.parts){
    if (p.id === 'modal-root' && (reopened || a.dlg !== b.dlg)) continue;              /* a pop-up opening or closing is its own line */
    if (p.whole) what.push(`${p.name} is thrown away and built again (${p.n} pieces)`);
    else if (p.pct >= 50) what.push(`most of ${p.name} is written again (${p.pct}%)`); }
  const stay = !moved && a.dlg === b.dlg;                                               /* the reader is where they were */
  if (stay || reopened){
    /* ONLY WORDS THAT ARE REALLY GONE: a box that is still on screen and no longer holds them. A box the press PUT
       AWAY with its panel (Collapse, Close, Minimize) is not a loss by itself — its words are held outside it and
       come back with it (jambo-box-keeps-what-you-typed-verify proves that); the second run counted every such
       press as a loss, which is why its total did not move. Those are listed, not scored. */
    for (const t of post.typed){ if (t.kept) continue;
      if (t.there) lost.push(`what was typed in "${t.name}"`); else away.push(t.name); }
    for (const s of post.scrolls) if (!s.there || (s.now < s.was - 30 && s.room >= s.was)) lost.push('where it was scrolled to');
  }
  if (film.blank) flash.push(`blank ${film.blank}/${film.frames} frames`);
  if (film.paleFrames) flash.push(`pale ${film.paleFrames}/${film.frames} frames (${film.pale.join(', ')})`);
  if (film.jump >= 0.05) flash.push('jumps ' + film.jump);
  return { moved, reopened, what, lost: [...new Set(lost)], flash, away: [...new Set(away)] };
}

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: book() });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 780 } });
  p.on('pageerror', e => say('PAGE ERROR', String(e).slice(0, 200)));
  p.on('dialog', d => { d.dismiss().catch(() => {}); });
  p.on('popup', pp => { pp.close().catch(() => {}); });
  p.on('download', d => { d.cancel().catch(() => {}); });
  await p.addInitScript(() => { try { window.open = () => null; window.print = () => {}; } catch (_){ } });
  await p.addInitScript(INIT);
  const signIn = async () => {
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await p.$('#li-email')){ await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go'); }
    const ok = await until(p, () => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-110') && !!window.__rb, null, 40000);
    await p.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } }).catch(() => {});
    await p.waitForTimeout(1200);
    return ok;
  };
  if (!await signIn()){ say('COULD NOT SIGN IN — nothing measured.'); await b.close(); await h.stop(); process.exit(0); }

  /* back to a page's starting point, then the presses that lead to where we are measuring */
  const reach = async (base, path) => {
    for (let go = 0; go < 2; go++){
      try {
        if (go) await signIn();
        await p.evaluate(() => { try { closeModal(); } catch (_){ } try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (_){ } });
        await p.evaluate(src => { try { (0, eval)(src); } catch (e){ return String(e); } return ''; }, base.go);
        await p.waitForTimeout(base.wait);
        let ok = true;
        for (const k of path){ if (!await p.evaluate(key => window.__rb.click(key), k)){ ok = false; break; } await p.waitForTimeout(380); }
        if (ok) return true;
      } catch (_){ /* the page went away: sign in again and try once more */ }
    }
    return false;
  };

  const rows = []; const tally = {};
  say(`THE REBUILD MEASURE · 1440x780 · ${BOOK + 1} contracts · ${Math.round(PAGE_MS / 1000)}s a page · ${DEPTH} presses deep\n`);
  for (const base of BASES){
    const t0 = Date.now(), over = () => Date.now() - t0 > PAGE_MS;
    const T = tally[base.name] = { pressed: 0, left: 0, gone: 0, cut: 0, rebuilt: 0, lost: 0, flash: 0, moved: 0 };
    say(`\n================ ${base.name} ================`);
    const queue = [{ path: [], names: [], only: null }];
    while (queue.length){
      const lvl = queue.shift();
      if (over()){ T.cut += (lvl.only ? lvl.only.length : 1); continue; }
      if (!await reach(base, lvl.path)){ say(`  could not get to: ${lvl.names.join(' > ') || 'the page itself'}`); T.gone++; continue; }
      let doors = []; try { doors = await p.evaluate(() => window.__rb.doors()); } catch (_){ doors = []; }
      if (lvl.only) doors = doors.filter(d => lvl.only.includes(d.key));
      const cap = lvl.path.length ? DEEP_DOORS : TOP_DOORS;
      if (doors.length > cap){ T.cut += doors.length - cap; doors = doors.slice(0, cap); }
      let dirty = false;
      for (let i = 0; i < doors.length; i++){
        const d = doors[i];
        if (over()){ T.cut += doors.length - i; break; }
        if (FINAL.test(d.label)){ T.left++; continue; }
        try {
          if (dirty){ if (!await reach(base, lvl.path)){ T.gone += doors.length - i; break; } dirty = false; }
          const pre = await p.evaluate(a => window.__rb.prep(a), { key: d.key, type: !SAVEISH.test(d.label) });
          if (!pre || pre.missing){ T.gone++; continue; }
          const film = await p.evaluate(a => window.__rb.press(a), { key: d.key, ms: FILM_MS });
          if (!film || film.missing){ T.gone++; dirty = true; continue; }
          await p.waitForTimeout(260);
          const post = await p.evaluate(() => window.__rb.after());
          if (!post){ T.gone++; dirty = true; continue; }
          const j = judge(pre, film, post);
          /* the choice the reader had: press it again and see whether it comes back */
          if (pre.choice && !j.moved && (j.reopened || j.what.length)){
            let back = await p.evaluate(c => { const k = c.key && window.__rb.click(c.key); if (k) return true; const hit = window.__rb.doors().find(x => x.key.split('#')[0] === c.base); return hit ? window.__rb.click(hit.key) : false; }, pre.choice);
            if (!back && lvl.path.length){ await p.evaluate(key => window.__rb.click(key), lvl.path[lvl.path.length - 1]); await p.waitForTimeout(380);
              back = await p.evaluate(c => { const hit = window.__rb.doors().find(x => x.key.split('#')[0] === c.base || x.label === c.label); return hit ? window.__rb.click(hit.key) : false; }, pre.choice); }
            if (!back) j.lost.push(`the way back: "${pre.choice.label}" is no longer offered`);
            else { await p.waitForTimeout(600); const s2 = await p.evaluate(() => window.__rb.sig());
              if (s2.dlgName !== pre.sig.dlgName || !sameList(s2.words, pre.sig.words)) j.lost.push(`the way back: pressing "${pre.choice.label}" again does not bring it back`); }
          }
          T.pressed++; if (j.moved) T.moved++; if (j.reopened || j.what.length) T.rebuilt++; if (j.lost.length) T.lost++; if (j.flash.length) T.flash++;
          const where = [...lvl.names, d.label].map(short).join(' > ');
          const bits = [];
          if (film.err) bits.push('ERR ' + film.err);
          if (j.moved) bits.push('moves to another page');
          if (j.what.length) bits.push(j.what.join('; '));
          if (j.flash.length) bits.push('flash: ' + j.flash.join(', '));
          if (j.lost.length) bits.push('LOST: ' + j.lost.join('; '));
          if (j.away && j.away.length){ T.away = (T.away || 0) + 1; bits.push('box put away with its panel: ' + j.away.join(', ')); }
          say(`  ${where.padEnd(64)} ${bits.length ? bits.join(' · ') : 'clean'}`);
          if (!j.moved && (j.reopened || j.what.length || j.lost.length || j.flash.length))
            rows.push({ page: base.name, press: where, what: j.what.join('; ') || '—', lost: j.lost.join('; ') || '—', flash: j.flash.join(', ') || '—',
              score: j.lost.length * 3 + (j.reopened ? 3 : 0) + (j.what.some(w => /thrown away/.test(w)) ? 2 : j.what.length ? 1 : 0) + (j.flash.length ? 1 : 0) });
          const changed = j.moved || j.reopened || post.parts.some(x => x.fresh) || pre.sig.dlg !== post.sig.dlg || !sameList(pre.sig.lit, post.sig.lit) || !sameList(pre.sig.words, post.sig.words) || pre.typed || pre.scrolled;
          if (changed) dirty = true;
          /* what the press uncovered (a list, a menu, a pop-up) is pressed next */
          const fresh = (post.fresh || []).filter(x => !FINAL.test(x.label));
          if (!j.moved && fresh.length && lvl.path.length < DEPTH - 1) queue.push({ path: [...lvl.path, d.key], names: [...lvl.names, d.label], only: fresh.slice(0, DEEP_DOORS).map(x => x.key) });
          else if (!j.moved && fresh.length) T.cut += fresh.length;
        } catch (e){ say(`  ${short(d.label).padEnd(64)} COULD NOT MEASURE — ${String(e).slice(0, 110)}`); T.gone++; dirty = true; }
      }
    }
    say(`  -- ${T.pressed} pressed · ${T.rebuilt} rebuilt something · ${T.lost} lost something · ${T.flash} flashed · ${T.moved} moved to another page · ${T.left} left alone (they finish something) · ${T.gone} could not be found again · ${T.cut} not reached in the time`);
  }

  rows.sort((x, y) => y.score - x.score);
  say(`\n================ WORST FIRST (${rows.length} presses that rebuilt, flashed or lost something) ================`);
  for (const r of rows.slice(0, 80)) say(`  [${r.page}] ${r.press}\n      today: ${r.what}\n      lost:  ${r.lost}\n      flash: ${r.flash}`);
  say(`\nBoxes put away with their panel (not scored as a loss): ${Object.values(tally).reduce((n, T) => n + (T.away || 0), 0)} presses.`);
  say('\n================ BY PAGE ================');
  for (const [name, T] of Object.entries(tally)) say(`  ${name.padEnd(28)} pressed ${String(T.pressed).padStart(3)} · rebuilt ${String(T.rebuilt).padStart(3)} · lost ${String(T.lost).padStart(3)} · flashed ${String(T.flash).padStart(3)} · left alone ${T.left} · not found ${T.gone} · not reached ${T.cut}`);
  /* the same table where GitHub shows it on the run's own page */
  if (process.env.GITHUB_STEP_SUMMARY){ try {
    const cell = s => String(s).replace(/\|/g, '/').replace(/\n/g, ' ');
    const md = ['## The rebuild measure', '', `${rows.length} presses rebuilt, flashed or lost something. Worst first.`, '', '| Page | Press | What happens today | What is lost | Flash |', '|---|---|---|---|---|',
      ...rows.slice(0, 120).map(r => `| ${cell(r.page)} | ${cell(r.press)} | ${cell(r.what)} | ${cell(r.lost)} | ${cell(r.flash)} |`), '',
      '| Page | Pressed | Rebuilt | Lost | Flashed | Left alone | Not found again | Not reached |', '|---|---|---|---|---|---|---|---|',
      ...Object.entries(tally).map(([n, T]) => `| ${cell(n)} | ${T.pressed} | ${T.rebuilt} | ${T.lost} | ${T.flash} | ${T.left} | ${T.gone} | ${T.cut} |`)].join('\n');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n'); } catch (_){ } }
  await b.close(); await h.stop(); process.exit(0);
})().catch(e => { console.error(e); process.exit(0); });
