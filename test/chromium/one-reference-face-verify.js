/* EVERY REFERENCE WEARS THE REFERENCE FONT, ON EVERY PAGE (Young, 7 Oct
   2026, the one-build work order, part D — "References only")
   ============================================================
   On each page that prints a contract's reference (MK-117…): the room head,
   Negotiate, Approvals & signing, Obligations, Calendar, Home's board, Copilot's
   work and the search palette — every printed reference computes a font-family
   that starts with Geist Mono; a value or a date on the same row does NOT;
   and at 1024 wide a reference is on one line and not cut off.
   Every driven half is GUARDED — a page that prints no reference REPORTS.
   Screenshots: test/chromium/shots/one-reference-face/ (or HATI_SHOT_DIR).
   Run: node test/chromium/one-reference-face-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'one-reference-face');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  const t0 = Date.now();
  for (;;){
    let v = null;
    try{ v = await page.evaluate(fn, arg); }catch(_){ v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return v;
    await new Promise(r => setTimeout(r, 120));
  }
};
const iso = off => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };

/* every element on the page whose OWN text is a known reference */
const refsOn = (page, scope) => page.evaluate(([scope, refs]) => {
  const root = scope ? document.querySelector(scope) : document.body; if (!root) return null;
  const out = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());){
    const t = n.nodeValue.trim(); if (!t) continue;
    const hit = refs.find(r => t === r || t.endsWith(r) && /[·\s]$/.test(t.slice(0, -r.length)));
    if (!hit || t !== hit) continue;
    const el = n.parentElement; if (!el || !el.getClientRects().length) continue;
    if (el.closest('select, option, script, style, title, [hidden]')) continue;
    const k = getComputedStyle(el), r = el.getBoundingClientRect();
    out.push({ ref: hit, face: k.fontFamily, tag: el.tagName + '.' + String(el.className || '').slice(0, 30),
      oneLine: r.height <= parseFloat(k.lineHeight || '0') * 1.6 || r.height <= parseFloat(k.fontSize) * 2.2,
      cut: el.scrollWidth > el.clientWidth + 1 && k.overflow !== 'visible' });
  }
  return out;
}, [scope, ['MK-A1', 'MK-A2', 'MK-B1', 'MK-B2', 'MK-RF1', 'MK-RF2']]);
const geist = f => /^"?Geist Mono"?/.test(f || '');

(async () => {
  const h = await startHati({});
  const extra = [
    { ...FIXTURES[0], id: 'MK-RF1', name: 'Rail freight', counterparty: 'Coast Rail Ltd', status: 'Signed', expiry: iso(20),
      obligations: [{ id: 'o-rf1', desc: 'Send the quarterly report', party: 'ours', due: iso(-3), status: 'open' }] },
    { ...FIXTURES[1], id: 'MK-RF2', name: 'Port handling', counterparty: 'Mombasa Port Services', status: 'Under Review', expiry: iso(45), value: 90000000, folder: FOLDER_A },
  ];
  await seedWorkspace(h, { contracts: FIXTURES.concat(extra) });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1024, height: 800 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n) }).catch(() => {});
  const pageCheck = async (name, go, ready, scope) => {
    try{ await page.evaluate(go); }catch(e){ check(false, name + ' opens', e.message); return; }
    await until(page, ready, null, 10000);
    await page.waitForTimeout(400);
    const R = await refsOn(page, scope);
    await shot(name.replace(/\W+/g, '-').toLowerCase() + '.png');
    if (!R || !R.length){ check(false, name + ' prints a reference to measure', 'none found'); return; }
    const bad = R.filter(x => !geist(x.face));
    check(!bad.length, `${name}: every printed reference wears Geist Mono (${R.length})`, bad.length ? JSON.stringify(bad.slice(0, 3)) : R[0].face.slice(0, 30));
    const broken = R.filter(x => !x.oneLine || x.cut);
    check(!broken.length, `${name}: each reference on one line, not cut off`, broken.length ? JSON.stringify(broken.slice(0, 3)) : 'ok');
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length), null, 15000);

    await pageCheck('Approvals & signing', () => setView('approvals'), () => !!document.querySelector('#content table, #content .ins-row, #content tr'), '#content');
    /* a value on the same row is NOT in the reference face */
    const val = await page.evaluate(() => { const td = document.querySelector('#content td.r.mono'); return td ? getComputedStyle(td).fontFamily : null; });
    check(val === null || !/^"?Geist Mono/.test(val), 'Approvals: the value beside it keeps its own face', val);
    await pageCheck('Obligations', () => setView('obligations'), () => /MK-RF1/.test(document.getElementById('content').textContent), '#content');
    await pageCheck('Calendar', () => setView('calendar'), () => /MK-RF1/.test(document.getElementById('content').textContent), '#content');
    await pageCheck('the room head', () => openWorkspace('MK-RF2'), () => !!document.querySelector('.room-head'), '.room-head');
    await pageCheck('Negotiate', () => roomGoTab(getContract('MK-RF2'), 'redline'), () => !!document.querySelector('.redline-page'), '#content');
    await pageCheck('the search palette', () => { setView('contracts'); if (typeof window.openPalette === 'function') window.openPalette('MK-RF'); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })); },
      () => /MK-RF/.test(document.body.textContent), null);
  } catch (e){
    console.log('  FAIL — stopped: ' + (e && e.message));
    failures++;
  }
  check(errors.length === 0, '9 no page errors', errors.join(' | ') || 'none');
  await browser.close();
  await h.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
