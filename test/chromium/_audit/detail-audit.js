/* THE DETAIL AUDIT — attention to detail, measured on the painted page
   (owner, 24 Oct 2026: "review the entire platform for these issues that need
   attention to detail including where cards are not on the same level, words
   are too close to the edge etc."). A measuring instrument: it asserts
   nothing, it photographs and lists. The tidy sweep (test/chromium/
   tidy-sweep-verify.js) stays the required check for spill / cut / squeeze /
   text overlap; this looks for the next seven kinds:

     PILL      a pill whose height is off the theme's (22 · 28 · 30 · 32 · 44),
               or one taller or rounder than the pills beside it
     SCROLL    a scroll bar thicker than the theme's thin one
     EDGE      words closer than 8px to the side of their card (3px top/bottom)
     LEVEL     cards side by side whose tops (or, in a grid, bottoms) differ
     OVERLAP   a card painted over another card, or poking out of its holder
     DOOR      a row you can press with nothing on it saying so (no ›, no Open)
     TRUNC     a button's, tab's or chip's own words cut short with "…"

   Every place the tidy sweep visits, at the owner's three screens, the first
   screenful and then down the page's main scroller. Each screenful with
   findings gets a picture with them outlined and numbered.

   Run: npm run audit:detail
        HATI_DETAIL_ONLY=board,paper npm run audit:detail
   Then: node test/chromium/_audit/detail-report.js  (builds the HTML page) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, '..', 'shots'), 'detail-audit');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [
  { k: 'laptop-a', w: 1440, h: 780 },
  { k: 'laptop-b', w: 1536, h: 730 },
  { k: 'ipad', w: 1366, h: 950 },
];

/* ONE LIST OF PLACES: the tidy sweep's own, read from its file so a place
   added there is audited here too. */
const PLACES = (() => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'tidy-sweep-verify.js'), 'utf8');
  const m = /\nconst PLACES = (\[[\s\S]*?\n\]);/.exec(src);
  if (!m) throw new Error('the tidy sweep\'s PLACES list was not found — has it moved?');
  return new Function('return ' + m[1])();
})();

const MEASURE = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const R = el => el.getBoundingClientRect();
  const CS = new Map(); const cs = el => { let c = CS.get(el); if (!c) { c = getComputedStyle(el); CS.set(el, c); } return c; };
  const gone = el => { const c = cs(el); return c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0; };
  const onScreen = r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  const hidden = el => { if (gone(el) || !onScreen(R(el))) return true; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (gone(p)) return true; return false; };
  const covered = el => { const r = R(el); const x = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(vh - 1, Math.max(0, r.top + Math.min(r.height / 2, 10)));
    const t = document.elementFromPoint(x, y); return !t || !(t === el || el.contains(t) || t.contains(el)); };
  const words = el => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
  const who = el => { const id = el.id ? '#' + el.id : ''; const cl = (typeof el.className === 'string' ? el.className : '').split(/\\s+/).filter(Boolean).slice(0, 2).map(c => '.' + c).join(''); return el.tagName.toLowerCase() + id + cl; };
  const where = el => { const out = []; for (let p = el.parentElement; p && p !== document.body && out.length < 3; p = p.parentElement) out.push(who(p)); return out.join(' < '); };
  const rr = r => ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
  const px = v => parseFloat(v) || 0;
  const scrolls = c => /(auto|scroll|hidden|clip)/.test(c.overflow + c.overflowX + c.overflowY);
  const all = [...document.body.querySelectorAll('*')].filter(el => !el.closest('script,style,svg,canvas,template,noscript,.sr-only,[aria-hidden="true"],.doc-sheet,.hb-dark'));
  const shown = all.filter(el => !hidden(el));
  const seen = shown.filter(el => !covered(el));
  const out = { pill: [], scroll: [], edge: [], level: [], overlap: [], door: [], trunc: [], pills: {}, seen: seen.length };

  /* A BOX: something drawn as a card — its own fill, an edge, or a lift */
  const alpha = c => { const m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return 0; const p = m[1].split(',').map(s => s.trim()); return p.length > 3 ? +p[3] : 1; };
  const fillOf = el => { for (let p = el; p; p = p.parentElement) { const b = cs(p).backgroundColor; if (alpha(b) > 0.05) return b; } return 'rgb(255, 255, 255)'; };
  const edged = c => ['Top', 'Right', 'Bottom', 'Left'].filter(s => px(c['border' + s + 'Width']) >= 1 && alpha(c['border' + s + 'Color']) > 0.05).length >= 3;
  const NOT_BOX = 'html,body,main,button,input,textarea,select,option,td,th,tr,thead,tbody,table,label,a,img,hr,iframe';
  const isBox = el => { if (el.matches(NOT_BOX)) return false; const c = cs(el); if (/^(inline|contents|table-cell|table-row)$/.test(c.display)) return false;
    const r = R(el); if (r.width < 120 || r.height < 40) return false;
    const own = alpha(c.backgroundColor) > 0.05 && c.backgroundColor !== fillOf(el.parentElement || document.body);
    return own || edged(c) || (c.boxShadow && c.boxShadow !== 'none'); };
  const boxes = seen.filter(isBox);
  const boxSet = new Set(boxes);
  const boxOf = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (boxSet.has(p)) return p; return null; };
  const stackOf = el => { for (let p = el; p && p !== document.body; p = p.parentElement) { const c = cs(p); if (c.position === 'fixed' || c.position === 'sticky' || (c.position !== 'static' && c.zIndex !== 'auto')) return p; } return document.body; };

  /* PILL — fully round controls, their heights, and their neighbours */
  const SCALE = [22, 28, 30, 32, 44];
  const pills = seen.filter(el => { const c = cs(el); if (/^(inline|contents)$/.test(c.display) && el.tagName !== 'BUTTON') return false;
    const r = R(el); if (r.height < 16 || r.height > 64 || r.width < r.height * 1.4) return false;
    if (!(el.matches('button,a,[role=tab],[role=button],select,input') || alpha(c.backgroundColor) > 0.05 || edged(c))) return false;
    return px(c.borderTopLeftRadius) >= r.height / 2 - 1 && words(el).length > 0 && words(el).length < 60; });
  for (const el of pills) { const h = Math.round(R(el).height); out.pills[h] = (out.pills[h] || 0) + 1; }
  for (const el of pills) {
    const h = R(el).height;
    if (h >= 18 && !SCALE.some(s => Math.abs(s - h) <= 1.5)) out.pill.push({ why: 'height ' + Math.round(h) + 'px — the theme\\'s pills are 22 · 28 · 30 · 32 · 44', who: who(el), in: where(el), text: words(el).slice(0, 40), r: rr(R(el)) });
  }
  /* side by side: a pill taller, or rounder, than the controls in its own row */
  const rowMates = el => [...(el.parentElement ? el.parentElement.children : [])].filter(s => s !== el && !hidden(s) && s.matches('button,a,[role=tab],select,input,.ui-btn,[class*="chip"],[class*="pill"]'));
  for (const el of pills) {
    const r = R(el), mates = rowMates(el).filter(s => { const q = R(s); return q.height >= 16 && q.height <= 64 && Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top) > 6; });
    if (mates.length < 1) continue;
    const taller = mates.filter(s => r.height - R(s).height > 2.5);
    const square = mates.filter(s => px(cs(s).borderTopLeftRadius) < R(s).height / 2 - 2);
    if (taller.length && taller.length === mates.length) out.pill.push({ why: Math.round(r.height) + 'px tall beside ' + Math.round(R(taller[0]).height) + 'px controls in the same row', who: who(el), in: where(el), text: words(el).slice(0, 40), r: rr(r) });
    else if (square.length && square.length === mates.length) out.pill.push({ why: 'fully round beside controls with soft corners (' + Math.round(px(cs(square[0]).borderTopLeftRadius)) + 'px)', who: who(el), in: where(el), text: words(el).slice(0, 40), r: rr(r) });
  }

  /* SCROLL — the bar's thickness against the theme's thin bar, measured on a probe */
  const probe = k => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:-500px;top:0;width:100px;height:100px;overflow:scroll;scrollbar-width:' + k; document.body.appendChild(d); const t = d.offsetWidth - d.clientWidth; d.remove(); return t; };
  const thin = probe('thin'), wide = probe('auto');
  out.thin = thin; out.wide = wide;
  for (const el of [document.scrollingElement, ...shown]) {
    if (!el) continue; const c = cs(el), r = R(el);
    const v = /(auto|scroll)/.test(c.overflowY) && el.scrollHeight > el.clientHeight + 1, hz = /(auto|scroll)/.test(c.overflowX) && el.scrollWidth > el.clientWidth + 1;
    if (!v && !hz && el !== document.scrollingElement) continue;
    const tv = el.offsetWidth - el.clientWidth - px(c.borderLeftWidth) - px(c.borderRightWidth);
    const th = el.offsetHeight - el.clientHeight - px(c.borderTopWidth) - px(c.borderBottomWidth);
    const t = Math.max(v ? tv : 0, hz ? th : 0);
    if (wide > thin ? t > thin + 0.5 : (c.scrollbarWidth === 'auto' && (v || hz)))
      out.scroll.push({ why: (wide > thin ? t + 'px thick — the theme\\'s thin bar is ' + thin + 'px' : 'uses the browser\\'s full-width bar'), who: who(el), in: where(el), text: words(el).slice(0, 40), r: rr(r) });
  }

  /* EDGE — words too near the side of their card */
  /* a filled or edged control is a box for its own words, sideways only */
  const ctlSet = new Set(seen.filter(el => el.matches('button,[role=tab],a,select') && R(el).height >= 16 && R(el).width >= 40 && (alpha(cs(el).backgroundColor) > 0.05 || edged(cs(el)))));
  const worst = new Map();
  for (const el of seen) {
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      let box = null; for (let p = el; p && p !== document.body; p = p.parentElement) if (boxSet.has(p) || ctlSet.has(p)) { box = p; break; } if (!box) continue;
      const ctl = ctlSet.has(box);
      const bc = cs(box), br = R(box);
      if (box.matches('[contenteditable], .ProseMirror')) continue;
      /* a scroller between the words and the card keeps them */
      let kept = false; for (let p = el; p && p !== box; p = p.parentElement) { const c = cs(p); if (/(auto|scroll)/.test(c.overflowX + c.overflowY) || c.textOverflow === 'ellipsis') { kept = true; break; } } if (kept) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      const L = br.left + px(bc.borderLeftWidth), Rt = br.right - px(bc.borderRightWidth), T = br.top + px(bc.borderTopWidth), B = br.bottom - px(bc.borderBottomWidth);
      for (const q of rg.getClientRects()) {
        if (q.width < 3 || q.height < 3) continue;
        const gx = Math.min(q.left - L, Rt - q.right), gy = Math.min(q.top - T, B - q.bottom);
        if (gx < -1 || gy < -1) continue; /* past the edge is a spill — the tidy sweep's */
        if (ctl ? gx < 6 : (gx < 8 || gy < 3)) { const k = box; const g = Math.min(gx, gy * 2.5); const w = worst.get(k); if (!w || g < w.g) worst.set(k, { g, ctl, gx: Math.round(gx), gy: Math.round(gy), text: n.textContent.trim().slice(0, 40), el }); }
      }
    }
  }
  for (const [box, w] of worst) out.edge.push({ why: w.ctl ? 'words ' + w.gx + 'px from the side of the button — the theme leaves room' : (w.gx < 8 ? w.gx + 'px from the side' : '') + (w.gx < 8 && w.gy < 3 ? ' · ' : '') + (w.gy < 3 ? w.gy + 'px from the ' + 'top or bottom' : ''), who: who(box), in: where(box), text: w.text, r: rr(R(box)) });

  /* LEVEL — cards side by side, not level */
  const parents = new Set(boxes.map(b => b.parentElement).filter(Boolean));
  for (const p of parents) {
    const c = cs(p); const flexRow = /flex/.test(c.display) && !/column/.test(c.flexDirection), grid = /grid/.test(c.display);
    if (!flexRow && !grid) continue;
    const kids = [...p.children].filter(k => boxSet.has(k) && R(k).height >= 60);
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      const a = R(kids[i]), b = R(kids[j]);
      const share = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (share < Math.min(a.height, b.height) * 0.5) continue;
      if (Math.abs(a.left - b.left) < 4) continue; /* one under the other */
      const dt = Math.abs(a.top - b.top), db = Math.abs(a.bottom - b.bottom);
      if (dt >= 2 && dt <= 40) out.level.push({ why: 'tops ' + Math.round(dt) + 'px apart', who: who(kids[i]) + ' · ' + who(kids[j]), in: who(p), text: words(kids[i]).slice(0, 24) + ' | ' + words(kids[j]).slice(0, 24), r: rr({ left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), width: Math.max(a.right, b.right) - Math.min(a.left, b.left), height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) }) });
      else if (grid && dt < 2 && db >= 2 && db <= 60) out.level.push({ why: 'same row, bottoms ' + Math.round(db) + 'px apart', who: who(kids[i]) + ' · ' + who(kids[j]), in: who(p), text: words(kids[i]).slice(0, 24) + ' | ' + words(kids[j]).slice(0, 24), r: rr({ left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), width: Math.max(a.right, b.right) - Math.min(a.left, b.left), height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) }) });
    }
  }

  /* OVERLAP — a card over a card, or a card out past its holder's sides */
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i], ar = R(a);
    const hold = boxOf(a);
    if (hold) { const hr = R(hold), hc = cs(hold);
      let clip = false; for (let p = a.parentElement; p && p !== hold.parentElement; p = p.parentElement) if (scrolls(cs(p))) { clip = true; break; }
      const by = Math.max(hr.left - ar.left, ar.right - hr.right);
      if (!clip && by > 2 && cs(a).position !== 'absolute' && cs(a).position !== 'fixed') out.overlap.push({ why: 'pokes ' + Math.round(by) + 'px out of the side of ' + who(hold), who: who(a), in: where(a), text: words(a).slice(0, 40), r: rr(ar) }); }
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j]; if (a.contains(b) || b.contains(a)) continue;
      const br = R(b), ox = Math.min(ar.right, br.right) - Math.max(ar.left, br.left), oy = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
      if (ox < 3 || oy < 3) continue;
      if (stackOf(a) !== stackOf(b)) continue; /* a pop-up over a page is by design */
      const t = document.elementFromPoint(Math.max(ar.left, br.left) + ox / 2, Math.max(ar.top, br.top) + oy / 2);
      if (!t || !(a.contains(t) || b.contains(t))) continue;
      out.overlap.push({ why: 'lies ' + Math.round(ox) + '×' + Math.round(oy) + 'px over ' + who(b), who: who(a), in: where(a), text: words(a).slice(0, 24) + ' | ' + words(b).slice(0, 24), r: rr({ left: Math.max(ar.left, br.left), top: Math.max(ar.top, br.top), width: ox, height: oy }) });
    }
  }

  /* TRUNC — a button's, tab's or chip's own words cut short with "…" */
  for (const el of seen) {
    if (!el.matches('button,[role=tab],.ui-btn,[class*="chip"],[class*="pill"],[class*="-btn"]')) continue;
    for (const q of [el, ...el.querySelectorAll('*')]) {
      const c = cs(q); if (c.textOverflow !== 'ellipsis' || q.scrollWidth <= q.clientWidth + 1) continue;
      out.trunc.push({ why: 'the button\\'s words are cut short with …', who: who(el), in: where(el), text: words(el).slice(0, 40), r: rr(R(el)) }); break;
    }
  }

  /* DOOR — a row that opens something, with nothing on it saying so */
  const SAYS = /(›|»|→|▸|▾|▶|›|\\bOpen\\b|\\bÖppna\\b|\\bView\\b|\\bVisa\\b|\\bEdit\\b|\\bÄndra\\b)/;
  for (const el of seen) {
    if (el.matches('button,a,input,select,textarea,label,summary,tr,td,th,option,[role=tab]') || el.closest('button,a,label,summary,tr,[role=tab]')) continue;
    const c = cs(el); if (c.cursor !== 'pointer') continue;
    if (el.parentElement && cs(el.parentElement).cursor === 'pointer') continue; /* report the outer door only */
    const r = R(el); if (r.width < 200 || r.height < 24 || r.height > 90) continue;
    const w = words(el); if (!w || SAYS.test(w)) continue;
    if (el.querySelector('svg, button, a, img, [class*="chev"], [class*="arrow"]')) continue;
    out.door.push({ why: 'opens on a press, but nothing on it says so', who: who(el), in: where(el), text: w.slice(0, 50), r: rr(r) });
  }

  /* one reading per thing: the same element is told once per kind */
  for (const k of ['pill', 'scroll', 'edge', 'level', 'overlap', 'door', 'trunc']) { const s = new Set(); out[k] = out[k].filter(f => { const key = f.who + '|' + f.text; if (s.has(key)) return false; s.add(key); return true; }); }
  return out;
})()`;

const OUTLINE = `(list => {
  const layer = document.createElement('div'); layer.id = 'detail-audit-layer';
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
  const TONE = { pill: '#d6336c', scroll: '#7048e8', edge: '#e8590c', level: '#1c7ed6', overlap: '#e03131', door: '#2b8a3e', trunc: '#5f3dc4' };
  for (const f of list) { const d = document.createElement('div'); const t = TONE[f.kind] || '#e03131';
    d.style.cssText = 'position:absolute;left:' + (f.r.x - 2) + 'px;top:' + (f.r.y - 2) + 'px;width:' + (f.r.w + 4) + 'px;height:' + (f.r.h + 4) + 'px;border:2px solid ' + t + ';border-radius:4px;box-sizing:border-box';
    const n = document.createElement('div'); n.textContent = f.n;
    n.style.cssText = 'position:absolute;left:-2px;top:-20px;background:' + t + ';color:#fff;font:600 12px/18px system-ui;padding:0 6px;border-radius:9px';
    if (f.r.y < 22) n.style.top = '2px';
    d.appendChild(n); layer.appendChild(d); }
  document.body.appendChild(layer);
})`;

/* THE SELF-CHECK: one of each fault planted on the page, so a kind that
   reports nothing is known to be looking (a probe that finds nothing because
   it is broken measures nothing). */
const PLANT = `(() => {
  const d = document.createElement('div'); d.id = 'detail-audit-plant';
  d.style.cssText = 'position:fixed;left:20px;top:80px;width:900px;z-index:99999;background:#fff;padding:20px;font:13px system-ui';
  d.innerHTML = '<div style="background:#eee;padding:2px;width:300px;height:60px">EDGE planted words</div>'
    + '<div style="display:flex;gap:16px;margin-top:10px"><div style="background:#eee;width:200px;height:80px;padding:12px">LEVEL a</div><div style="background:#eee;width:200px;height:80px;padding:12px;margin-top:14px">LEVEL b</div></div>'
    + '<div style="display:flex;gap:8px;margin-top:10px;align-items:center"><button style="height:28px;border-radius:14px;border:1px solid #999;padding:0 12px">Pill a</button><button style="height:28px;border-radius:14px;border:1px solid #999;padding:0 12px">Pill b</button><button style="height:38px;border-radius:19px;border:1px solid #999;padding:0 12px">PILL big</button></div>'
    + '<div style="background:#eee;width:300px;height:60px;padding:12px;margin-top:10px">OVERLAP under</div><div style="background:#ddd;width:300px;height:60px;padding:12px;margin-top:-30px;margin-left:40px">OVERLAP over</div>'
    + '<div style="cursor:pointer;width:300px;height:40px;margin-top:10px;padding:10px">DOOR a row with no sign</div>'
    + '<button style="width:90px;height:28px;border-radius:14px;border:1px solid #999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:10px">TRUNC words that do not fit</button>'
    + '<div style="overflow-y:auto;width:300px;height:50px;margin-top:10px;background:#f6f6f6;padding:10px">SCROLL<br>1<br>2<br>3<br>4<br>5</div>';
  document.body.appendChild(d);
})()`;

const only = (process.env.HATI_DETAIL_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
const KINDS = ['pill', 'scroll', 'edge', 'level', 'overlap', 'door', 'trunc'];
const STEPS = 4; /* screens down the page's main scroller */
/* one screen down the biggest scroller left of the side panel; false at its foot */
const SCROLL_ON = `(() => {
  const dock = document.getElementById('ig-dock');
  const list = [...document.querySelectorAll('*')].filter(el => { const c = getComputedStyle(el); if (!/(auto|scroll)/.test(c.overflowY)) return false;
    const r = el.getBoundingClientRect(); return r.height > 240 && r.width > 300 && el.scrollHeight > el.clientHeight + 40 && !(dock && dock.contains(el)) && c.visibility !== 'hidden'; });
  const sc = list.sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth)[0];
  if (!sc || sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) return false;
  sc.scrollTop += Math.round(sc.clientHeight * 0.85); return true;
})()`;
const CAP = 30; /* outlined per kind per picture — the rest are counted, never dropped */

const drive = async (page, fn, fallback) => { try { return await page.evaluate(fn); } catch (_) { return fallback; } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'], ignoreDefaultArgs: ['--hide-scrollbars'] }); /* Playwright hides scroll bars by default: the audit measures them */
  const rows = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 }, deviceScaleFactor: 1 });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd');
    await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-email', 'admin@example.co.ke');
    await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample');
    if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go');
    await page.waitForTimeout(3500);
    await page.keyboard.press('Escape').catch(() => {});
    {
      await drive(page, PLANT, null);
      const m = await drive(page, MEASURE, null);
      await drive(page, `document.getElementById('detail-audit-plant')?.remove()`, null);
      const hit = k => !!(m && m[k].some(f => /EDGE|LEVEL|PILL|OVERLAP|DOOR|SCROLL|TRUNC/.test(f.text)));
      const miss = KINDS.filter(k => !hit(k));
      console.log(miss.length ? 'SELF-CHECK: these kinds did not see their planted fault: ' + miss.join(', ') : 'SELF-CHECK: every kind saw its planted fault');
      if (miss.length && !process.env.HATI_DETAIL_ANYWAY) throw new Error('the instrument is blind to: ' + miss.join(', '));
    }
    for (const S of SCREENS) {
      await page.setViewportSize({ width: S.w, height: S.h });
      for (const P of PLACES) {
        if (only.length && !only.includes(P.k)) continue;
        await page.keyboard.press('Escape').catch(() => {});
        await page.keyboard.press('Escape').catch(() => {});
        await drive(page, `(() => { try { closeModal && closeModal(); } catch (_) {} try { const x = document.querySelector('.hb-sheet [data-hb-sheet-x]'); if (x) x.click(); } catch (_) {} try { if (typeof aiSideToggle === 'function' && document.querySelector('#ai-panel.is-in')) aiSideToggle(false); } catch (_) {} })()`, null);
        await drive(page, P.go, null);
        let there = true; try { await page.waitForFunction(P.wait, undefined, { timeout: 10000 }); } catch (_) { there = false; }
        await page.evaluate(() => document.fonts.ready).catch(() => {});
        await page.waitForTimeout(800);
        await page.mouse.move(2, S.h - 4).catch(() => {});
        /* every scroller back to its top: the walk below moved them, and the next screen starts clean */
        await drive(page, `document.querySelectorAll('*').forEach(el => { if (el.scrollTop) el.scrollTop = 0; })`, null);
        await page.waitForTimeout(200);
        /* THE FIRST SCREENFUL, THEN DOWN: the page's own biggest scroller is
           walked a screen at a time (up to STEPS), each step measured and,
           where it finds something new, photographed */
        const row = { screen: S.k, w: S.w, h: S.h, place: P.k, name: P.name, there, measured: false, found: [], counts: {}, pills: {} };
        const told = new Set(); let n = 0;
        for (let step = 0; step < STEPS; step++) {
          const m = await drive(page, MEASURE, null);
          if (!m) break;
          row.measured = true; row.thin = m.thin; row.wide = m.wide;
          for (const [hgt, k] of Object.entries(m.pills)) row.pills[hgt] = (row.pills[hgt] || 0) + k;
          const fresh = [];
          for (const k of KINDS) {
            const mine = m[k].filter(f => { const key = k + '|' + f.who + '|' + f.text; if (told.has(key)) return false; told.add(key); return true; });
            row.counts[k] = (row.counts[k] || 0) + mine.length;
            for (const f of mine.slice(0, CAP)) fresh.push(Object.assign({ kind: k, n: ++n, step }, f));
          }
          if (fresh.length) {
            const shot = `${S.k}-${P.k}${step ? '-' + step : ''}.jpg`;
            await drive(page, `(${OUTLINE})(${JSON.stringify(fresh)})`, null);
            await page.screenshot({ path: path.join(OUT, shot), type: 'jpeg', quality: 70 }).catch(() => {});
            await drive(page, `document.getElementById('detail-audit-layer')?.remove()`, null);
            for (const f of fresh) f.shot = shot;
            row.found.push(...fresh);
          }
          const moved = await drive(page, SCROLL_ON, false);
          if (!moved) break;
          await page.waitForTimeout(450);
        }
        rows.push(row);
        const c = row.counts;
        console.log(`${S.k.padEnd(8)} ${P.name.padEnd(54).slice(0, 54)} ${there ? '' : '(door did not land) '}${row.measured ? KINDS.map(k => k + ' ' + (c[k] || 0)).join(' · ') : 'not measured'}`);
      }
    }
  } finally {
    fs.writeFileSync(path.join(OUT, 'detail.json'), JSON.stringify(rows, null, 1));
    await browser.close(); await h.stop();
  }
  console.log(`\nwritten to ${path.join(OUT, 'detail.json')}`);
})().catch(e => { console.error(e); process.exit(2); });
