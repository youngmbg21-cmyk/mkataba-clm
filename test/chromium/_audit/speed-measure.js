/* ============================================================
   THE SPEED MEASURE — a measuring instrument, not a test
   (owner, 11 Nov 2026: "time it on GitHub first, then fix Accept and Reject")
   ============================================================
   It asserts nothing and always exits 0. It prints, for each act a person
   presses on a LONG contract, what that one press cost:
     sync      ms the press held the page before it returned
     painted   ms from the press to two drawn frames
     long      browser freezes of 50 ms or more that followed
     papers    how many times the whole paper was built
     panel     how many times Jambo's panel was written whole
     notes     how many times the notes beside the paper were laid out
     track     how many times the track of dots was written
     patch     what the paper's last refresh did: blocks put back of how many (null = drawn whole)
     top       the functions the time went to (a CPU profile)
   and, on the list pages with a big book, what ONE small change costs the
   browser with the page-wide ":has" style rules in place and with them gone.

   Run by .github/workflows/measure.yml (when this file changes, or by hand):
     node test/chromium/_audit/speed-measure.js
     HATI_SM_SECTIONS=40 HATI_SM_BOOK=1500 node test/chromium/_audit/speed-measure.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../../helpers');
const W = require('../../notes-world');

const SECTIONS = +process.env.HATI_SM_SECTIONS || 40;
const BOOK = +process.env.HATI_SM_BOOK || 1500;
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
const say = (...a) => console.log(...a);

/* ---- THE LONG CONTRACT: 40 sections, two blanks, a clause review of ten points ---- */
const lorem = 'The Customer shall pay all rates and charges specified in the applicable rate schedules and appendices to this Agreement, and where no agreed rate exists the provider shall provide a written quotation before performing the requested service. ';
let HTML = '<h1>WAREHOUSING AND TRANSPORTATION SERVICES</h1><p>This Agreement is made on [DATE] between Ventura Capital and Highland Corporate Ltd for the storage of [GOODS].</p>';
for (let i = 1; i <= SECTIONS; i++) HTML += `<h2>${i}. Section number ${i}</h2>` + [1, 2, 3, 4].map(k => `<p>${i}.${k} ${lorem}${k === 1 ? 'Marker' + i + ' solely for the stated purpose.' : lorem}</p>`).join('');
const pts = []; for (let i = 2; i <= SECTIONS; i += 4) pts.push({ clause: String(i), region: 1, status: i % 8 ? 'look' : 'need', missing: false, title: 'Point ' + i, stake: 'Stake ' + i, quote: 'Marker' + i + ' solely for the stated purpose', links: [] });
const BD = { head: 'x', sub: '', links: [], regions: [{ name: 'Money', status: 'look', kind: 'pay', headline: '', items: [{ ref: '2', title: 'x' }], quotes: [] }], points: pts };
function longOne(id){
  const c = fixtureContract(id, 'Warehousing Services ' + id, 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, upload: { name: 'W.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  return c;
}
function book(){
  const out = [];
  const st = ['Under Review', 'Signed', 'Signed', 'Under Review', 'Draft'];
  for (let i = 0; out.length < BOOK; i++){
    const f = JSON.parse(JSON.stringify(FIXTURES[i % FIXTURES.length]));
    f.id = 'MK-S' + String(1000 + i); f.name = f.name + ' ' + (i + 1);
    f.counterparty = ['Kabras Sugar', 'Nandi Dairy', 'Naivas Supermarkets', 'Bidco Africa', 'Safaricom PLC', 'Twiga Foods', 'Kenya Power'][i % 7] + (i % 3 ? '' : ' Ltd');
    f.status = st[i % st.length];
    f.value = 1000000 * (1 + (i * 13) % 90); if (f.metadata) f.metadata.value = f.value; if (f.fields) f.fields.value = String(f.value);
    if (f.status === 'Signed' && i % 2 === 0){
      /* days from today, so the answer does not depend on the day it runs */
      const due = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
      f.obligations = [{ id: 'ob-' + f.id + '-1', desc: 'Send the monthly supply report', due: due((i % 40) - 10), party: 'ours', status: 'open' }];
    }
    out.push(f);
  }
  return out;
}

async function signIn(b, h, w, hh){
  const p = await b.newPage({ viewport: { width: w, height: hh } });
  p.on('pageerror', e => say('PAGE ERROR', String(e).slice(0, 200)));
  await p.goto(h.base + '/', { waitUntil: 'networkidle' });
  await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
  await until(p, () => typeof caGo === 'function' && !!currentUser(), null, 60000);
  return p;
}

/* ONE ACT, MEASURED. `act` runs in the page and returns false where its button or door is not there. */
async function measure(p, cdp, label, act, arg){
  await p.evaluate(() => {
    const M = window.__sm = { papers: 0, panel: 0, notes: 0, track: 0, lt: [] };
    if (window.__smMo) window.__smMo.disconnect();
    if (window.__smPo) window.__smPo.disconnect();
    const mo = window.__smMo = new MutationObserver(recs => recs.forEach(r => { const t = r.target; if (!t || t.nodeType !== 1) return; const add = [...r.addedNodes].filter(x => x.nodeType === 1);
      if (t.id === 'ig-paper' && add.some(x => x.classList.contains('ig-paper-wrap'))) M.papers++;
      if (t.id === 'ig-dock' && add.length) M.panel++;
      if (t.id === 'pd2-notes' && add.some(x => x.classList.contains('pd2-mn'))) M.notes++;
      if (t.id === 'ig-spine' && add.length) M.track++; }));
    mo.observe(document.body, { childList: true, subtree: true });
    try { const po = window.__smPo = new window.PerformanceObserver(l => l.getEntries().forEach(e => M.lt.push(Math.round(e.duration)))); po.observe({ entryTypes: ['longtask'] }); } catch (_){}
  });
  let prof = null;
  try { await cdp.send('Profiler.start'); } catch (_){}
  let r;
  try {
    r = await p.evaluate(async ({ src, arg }) => {
      const fn = (0, eval)('(' + src + ')');
      const t0 = performance.now(); let ok;
      try { ok = await fn(arg); } catch (e) { return { err: String(e && e.message || e).slice(0, 160) }; }
      const sync = performance.now() - t0;
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      const painted = performance.now() - t0;
      await new Promise(res => setTimeout(res, 700));
      const M = window.__sm;
      /* `patch`: what the paper's last refresh did (blocks put back of how many), null where it was drawn whole */
      let patch; try { patch = typeof igPaperLastPatch === 'function' ? igPaperLastPatch() : undefined; } catch (_) { patch = undefined; }
      return { ok: ok !== false, sync: Math.round(sync), painted: Math.round(painted), long: M.lt.slice(), papers: M.papers, panel: M.panel, notes: M.notes, track: M.track, patch };
    }, { src: act.toString(), arg: arg === undefined ? null : arg });
  } catch (e) { r = { err: String(e && e.message || e).slice(0, 160) }; }
  try { prof = (await cdp.send('Profiler.stop')).profile; } catch (_){}
  let top = [];
  if (prof && r && !r.err){
    const byId = new Map(prof.nodes.map(n => [n.id, n])); const self = new Map(); const parent = new Map();
    prof.nodes.forEach(n => (n.children || []).forEach(ch => parent.set(ch, n.id)));
    prof.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (prof.timeDeltas[i] || 0)));
    const incl = new Map();
    for (const [id, us] of self){ const seen = new Set();
      for (let x = id; x; x = parent.get(x)){ const f = byId.get(x).callFrame; const nm = f.functionName || ''; if (!nm || /^\((root|program|idle|garbage collector)\)$/.test(nm) || seen.has(nm)) continue; seen.add(nm); incl.set(nm, (incl.get(nm) || 0) + us); } }
    top = [...incl].sort((a, z) => z[1] - a[1]).filter(x => x[1] >= 4000 && x[0] !== 'measure' && x[0] !== 'fn').slice(0, 14).map(([k, v]) => `${k} ${Math.round(v / 1000)}`);
  }
  say(`ACT | ${label} | ${JSON.stringify(r)}`);
  if (top.length) say(`    top(ms): ${top.join(' · ')}`);
  return r;
}

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: [longOne('MK-110'), longOne('MK-111')].concat(book()), approvalRules: [] });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  say(`THE SPEED MEASURE · ${SECTIONS} sections (${HTML.length} characters) · a book of ${BOOK + 2} · 1440x780 · new look`);

  /* ================= PART ONE: THE LONG CONTRACT ================= */
  try {
    const p = await signIn(b, h, 1440, 780);
    await until(p, () => !!getContract('MK-110'), null, 40000);
    await p.evaluate(W.IN_PAGE, BD);
    await until(p, () => !!(getContract('MK-110').breakdown || {}).ok, null, 30000);
    const filed = await p.evaluate(async () => { const c = getContract('MK-110'); if (window.ensureFull) await ensureFull(c);
      const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front'); let n = 0;
      for (const k of [3, 9, 15, 22, 30, 36]) { const cl = cls[k]; if (!cl) continue; const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
        try { await negoEditClause(c, cl.clauseId, body.replace('shall pay', 'shall promptly pay'), { side: 'counterparty', author: 'Ventura' }); n++; } catch (e) { return 'ERR ' + e.message; } }
      await persist(c); return n; });
    say(`their changes filed: ${filed}`);
    await p.evaluate(() => { pdOpenOnHome('MK-110', 'copilot'); });
    await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper') && !!document.querySelector('#ig-strip [data-ig-red]'), null, 20000);
    await p.waitForTimeout(1500);
    const cdp = await p.context().newCDPSession(p);
    try { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 }); } catch (_){}
    const click = sel => { const el = document.querySelector(sel); if (!el) return false; el.click(); return true; };

    say('\n-- the switch (after the 11 Nov fix; the yardstick) --');
    await measure(p, cdp, 'switch: Clean -> Redline', click, '#ig-strip [data-ig-red="1"]');
    await measure(p, cdp, 'switch: Redline -> Clean', click, '#ig-strip [data-ig-red="0"]');

    say('\n-- decisions in the Redlines panel --');
    await measure(p, cdp, 'open the Redlines panel', id => { if (typeof pdRedOpen !== 'function') return false; pdRedOpen(id); }, 'MK-110');
    await until(p, () => !!document.querySelector('#pd-redface [data-nego-accept]'), null, 15000);
    const nAcc = await p.evaluate(() => document.querySelectorAll('#pd-redface [data-nego-accept]').length);
    say(`accept buttons drawn: ${nAcc}`);
    await measure(p, cdp, 'Accept (1st change)', click, '#pd-redface [data-nego-accept]');
    await measure(p, cdp, 'Accept (2nd change)', click, '#pd-redface [data-nego-accept]');
    await measure(p, cdp, 'Reject (3rd change)', click, '#pd-redface [data-nego-reject]');
    /* a reject may ask why: answer it the quiet way, and say whether it asked */
    const asked = await p.evaluate(() => { const m = document.querySelector('#modal-root .modal-in'); if (!m) return false; const ok = m.querySelector('[data-dlg-ok], .ui-btn-primary'); if (ok) ok.click(); return true; });
    say(`reject asked a question first: ${asked}`);
    await p.waitForTimeout(800);
    /* the same three acts with no panel or paper to draw: what the DECISION itself costs */
    await measure(p, cdp, 'Accept, the record only (negoResolve, nothing drawn)', id => { const c = getContract(id); const ch = (c.changes || []).find(x => x.status === 'pending'); if (!ch) return false; return !!negoResolve(c, ch.id, 'accepted', { side: 'owner', quiet: true }); }, 'MK-110');
    await measure(p, cdp, 'the panel\'s repaint alone (pdRedRepaint)', () => { if (typeof pdRedRepaint !== 'function') return false; pdRedRepaint(); });
    await measure(p, cdp, 'the paper\'s rebuild alone (igPaperRefresh)', () => { if (typeof igPaperRefresh !== 'function') return false; igPaperRefresh(); });
    await measure(p, cdp, 'Jambo\'s panel alone (renderIntelDock)', () => { if (typeof renderIntelDock !== 'function') return false; renderIntelDock(); });

    say('\n-- filling in, the read, sending --');
    await measure(p, cdp, 'close the Redlines panel', () => { if (typeof pdRedClose !== 'function') return false; pdRedClose(); });
    await measure(p, cdp, 'open Fill in', id => { if (typeof pdFillOpen !== 'function') return false; pdFillOpen(id); }, 'MK-110');
    await measure(p, cdp, 'fill one blank', () => { const i = document.querySelector('#pd-fillface input:not([type=hidden]), #pd-og input:not([type=hidden]), #pd-fill input:not([type=hidden])'); if (!i) return false; i.focus(); i.value = '1 January 2027'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); i.blur(); });
    await measure(p, cdp, 'close Fill in', () => { if (typeof pdFillClose !== 'function') return false; pdFillClose(); });
    await measure(p, cdp, 'open Watch the read', id => { if (typeof pd2WalkOpen !== 'function') return false; pd2WalkOpen(id); }, 'MK-110');
    await measure(p, cdp, 'close Watch the read', () => { if (typeof pd2WalkClose !== 'function') return false; pd2WalkClose(); });
    await measure(p, cdp, 'open the Send screen', id => { if (typeof pdSendOpen !== 'function') return false; pdSendOpen(id); }, 'MK-110');
    await measure(p, cdp, 'close the Send screen', () => { if (typeof pdSendClose !== 'function') return false; pdSendClose(); });

    say('\n-- moving between contracts and faces --');
    await measure(p, cdp, 'open another long contract', id => { if (typeof pdOpenOnHome !== 'function') return false; pdOpenOnHome(id, 'copilot'); }, 'MK-111');
    await measure(p, cdp, 'back to the first', id => { pdOpenOnHome(id, 'copilot'); }, 'MK-110');
    await measure(p, cdp, 'Clauses tab', click, '#ig-dock [data-pd-tab="doc"]');
    await measure(p, cdp, 'Dossier tab', click, '#ig-dock [data-pd-tab="copilot"]');
    await measure(p, cdp, 'fold Jambo\'s panel', click, '#igd-collapse');
    await measure(p, cdp, 'open Jambo\'s panel', click, '#igd-expand');
    await measure(p, cdp, 'to the Board', () => { if (typeof setView !== 'function') return false; setView('counter'); });
    await p.close();
  } catch (e) { say('PART ONE STOPPED', String(e && e.stack || e).slice(0, 600)); }

  /* ================= PART TWO: ONE SMALL CHANGE ON EACH PAGE ================= */
  try {
    const p = await signIn(b, h, 1440, 780);
    await until(p, () => !!getContract('MK-110'), null, 40000);
    await p.evaluate(async () => { try { await stPrefSet('newLook', true); newLookApply(); } catch (_){} });
    const PAGES = ['counter', 'register', 'approvals', 'obligations', 'directory', 'customers', 'intake', 'reads', 'mynotes', 'templates', 'playbook', 'team', 'settings', 'calendar', 'pulse', 'migration'];
    const micro = () => p.evaluate(() => { const host = document.querySelector('#content') || document.body; const probe = document.createElement('i'); host.appendChild(probe); host.offsetHeight;
      const best = w => { let m = 1e9; for (let k = 0; k < 5; k++){ const t = performance.now(); w(); host.offsetHeight; document.body.getBoundingClientRect(); m = Math.min(m, performance.now() - t); } return Math.round(m * 10) / 10; };
      const out = { els: document.getElementsByTagName('*').length, cls: best(() => probe.classList.toggle('zz-sm')), add: best(() => probe.appendChild(document.createElement('b'))), attr: best(() => probe.setAttribute('data-zz', String(Math.random()))) };
      probe.remove(); return out; });
    const go = async v => { await p.evaluate(v => { try { setView(v); } catch (_){} }, v); await p.waitForTimeout(1200); };
    const withRules = {};
    for (const v of PAGES){ await go(v); withRules[v] = await micro(); }
    const removed = await p.evaluate(() => { let n = 0; const strip = (rules, owner) => { for (let i = rules.length - 1; i >= 0; i--){ const r = rules[i]; if (r.cssRules && r.cssRules.length && !r.selectorText){ strip(r.cssRules, r); continue; } if (r.selectorText && r.selectorText.includes(':has(')){ try { owner.deleteRule(i); n++; } catch (_){} } } };
      for (const sh of document.styleSheets){ try { strip(sh.cssRules, sh); } catch (_){} } return n; });
    say(`\n-- one small change, with the ":has" rules and with all ${removed} of them gone (ms; els = elements on the page) --`);
    for (const v of PAGES){ await go(v); const a = withRules[v], z = await micro();
      say(`PAGE | ${v} | els ${a.els} | a class: ${a.cls} -> ${z.cls} | an added element: ${a.add} -> ${z.add} | an attribute: ${a.attr} -> ${z.attr}`); }
    await p.close();
  } catch (e) { say('PART TWO STOPPED', String(e && e.stack || e).slice(0, 600)); }

  await b.close(); await h.stop();
  say('\nTHE SPEED MEASURE IS DONE');
  process.exit(0);
})().catch(e => { console.error('THE SPEED MEASURE DIED', e); process.exit(0); });
