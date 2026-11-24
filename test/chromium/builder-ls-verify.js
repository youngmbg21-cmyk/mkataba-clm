/* Chromium verification: THE BUILDER, LEGORA + STRIPE (owner: "Build as drawn", 23 Nov 2026).
   ============================================================
   Pressed with a real mouse: the paper lies on the Dossier's desk with the paper's zoom; Jambo's tabs carry their
   counts; More ▾ stands before Save draft and holds Delete draft, which asks once, deletes on the SERVER and lands on
   Our paper; Publish is one pop-up in three steps (Check · How it looks · On the shelf), Back returns to the check.
   Every wait asks for a state, bounded; a missing part reports, never times out.

   Run: node test/chromium/builder-ls-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`); };
const until = async (page, fn, arg, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await new Promise(r => setTimeout(r, 120)); } return null; };

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => typeof window.openTemplateBuilder === 'function' && !!window.REMOTE && !!window.REMOTE.me, null, 10000);
    const mk = name => page.evaluate(async n => {
      const d = await api('templates', 'POST', { name: n, category: 'procurement', folder: '', description: '' });
      const t = await api('templates/' + d.template.id); const vid = t.versions[0].id;
      await api(`templates/${d.template.id}/versions/${vid}`, 'PUT', { blocks: [{ orderIndex: 1, blockType: 'heading', content: 'Parties' }, { orderIndex: 2, blockType: 'fixed_text', content: 'The Landlord lets the house to the Tenant.' }, { orderIndex: 3, blockType: 'heading', content: 'Term' }], fields: [] }).catch(() => null);
      return { tid: d.template.id, vid };
    }, name);

    /* 1 · THE DESK AND THE ZOOM */
    const A = await mk('Residential House Lease Agreement');
    await page.evaluate(i => openTemplateBuilder(i.tid, i.vid), A);
    const up = await until(page, () => !!document.getElementById('tb-paper'));
    const D = up && await page.evaluate(() => ({ desk: getComputedStyle(document.getElementById('tb-scroll')).backgroundColor,
      want: (() => { const x = document.createElement('i'); x.style.color = 'var(--desk-ground)'; document.body.appendChild(x); const c = getComputedStyle(x).color; x.remove(); return c; })(),
      edge: getComputedStyle(document.getElementById('tb-paper')).borderTopColor, zc: !!document.querySelector('#tb-scroll .paper-zc [data-rl-type]') }));
    check('1a the paper lies on the Dossier\'s desk (--desk-ground), without an outline', !!D && D.desk === D.want && /rgba\(0, 0, 0, 0\)|transparent/.test(D.edge), D);
    check('1b the paper carries the zoom every paper carries', !!D && D.zc, D);
    if (D && D.zc) {
      const z0 = await page.evaluate(() => document.getElementById('tb-paperslot').style.zoom || '1');
      await page.click('#tb-scroll .paper-zc [data-rl-type="1"]');
      const z1 = await until(page, z => { const v = document.getElementById('tb-paperslot').style.zoom; return v && v !== z ? v : null; }, z0);
      check('1c + makes the paper bigger', !!z1 && Number(z1) > Number(z0), { z0, z1 });
      await page.evaluate(() => rlSetDocZoom(100));
    }

    /* 2 · TABS WITH THEIR COUNTS */
    const T = await page.evaluate(() => [...document.querySelectorAll('#tb-rail [data-tb-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()));
    check('2 the tabs carry their counts: Outline n · Playbook n of m', T.some(t => /^Outline ?\d+$/.test(t)) && T.some(t => /^Playbook ?(\d+ of \d+)?$/.test(t)), T);

    /* 3 · PUBLISH IS ONE POP-UP IN THREE STEPS */
    await page.click('#tb-publish');
    const P1 = await until(page, () => { const f = document.querySelector('#modal-root #tb-pub'); return f ? { steps: (f.querySelector('.lgp-steps') || {}).textContent || '', amber: f.querySelectorAll('[data-tb-pq]').length, go: !!f.querySelector('#tb-pq-go') } : null; });
    check('3a Publish opens one pop-up on its Check step, open things with their own way forward', !!P1 && /Check · How it looks · On the shelf/.test(P1.steps) && P1.amber >= 1 && P1.go, P1);
    if (P1) {
      await page.click('#tb-pq-go');
      const P2 = await until(page, () => { const f = document.querySelector('#modal-root #tb-pub'); const b = f && f.querySelector('.lgp-steps b'); return b && /How it looks/.test(b.textContent) ? { back: !!f.querySelector('#tb-look-back'), forms: document.querySelectorAll('#modal-root form.lgp').length } : null; }, null, 8000);
      check('3b Publish anyway moves the same pop-up to How it looks, with Back', !!P2 && P2.back && P2.forms === 1, P2);
      if (P2) {
        await page.click('#tb-look-back');
        const P3 = await until(page, () => { const b = document.querySelector('#modal-root #tb-pub .lgp-steps b'); return b && /Check/.test(b.textContent); });
        check('3c Back returns to the Check', !!P3);
      }
      await page.keyboard.press('Escape'); await until(page, () => !document.querySelector('#modal-root #tb-pub'));
    }

    /* 4 · MORE ▾ BEFORE SAVE DRAFT, DELETE DRAFT */
    const M = await page.evaluate(() => { const m = document.getElementById('tb-more'), s = document.getElementById('tb-save'); return m && s ? { before: m.getBoundingClientRect().right <= s.getBoundingClientRect().left, words: m.textContent.trim() } : null; });
    check('4a More stands before Save draft', !!M && M.before && /^More/.test(M.words), M);
    if (M) {
      await page.click('#tb-more');
      const menu = await until(page, () => { const r = document.querySelector('#tb-more-pop [data-tb-more="delete"]'); return r ? { off: r.disabled, words: r.textContent.replace(/\s+/g, ' ').trim() } : null; });
      check('4b its dropdown holds Delete draft, live for an admin', !!menu && !menu.off && /^Delete draft/.test(menu.words), menu);
      await page.click('#tb-more');
      const shut = await until(page, () => !document.getElementById('tb-more-pop'));
      check('4c pressed again, it closes', !!shut);
      await page.click('#tb-more'); await until(page, () => !!document.getElementById('tb-more-pop'));
      await page.click('#tb-more-pop [data-tb-more="delete"]');
      const Q = await until(page, () => { const f = document.querySelector('#modal-root #tb-del'); return f ? { lines: f.querySelectorAll('.tb-del-l').length, red: getComputedStyle(f.querySelector('#tb-del-go')).backgroundColor } : null; });
      check('4d it asks once, saying what goes, Delete draft in red', !!Q && Q.lines >= 2, Q);
      if (Q) {
        await page.click('#tb-del-go');
        const gone = await until(page, async tid => { try { await api('templates/' + tid); return null; } catch (_) { return true; } }, A.tid, 8000);
        const where = await until(page, () => !document.getElementById('tb-page') && state.view === 'templates' ? true : null);
        check('4e the template is gone on the server, and you are on Our paper', !!gone && !!where, { gone, where });
      }
    }

    /* 5 · ONE DOOR: Our paper's Create a template opens the New agreement sheet on its tab */
    await page.evaluate(() => { try { closeModal(); } catch (_) {} setView('templates'); });
    const btn = await until(page, () => !!document.querySelector('[data-tpln-new]'));
    if (btn) await page.click('[data-tpln-new]');
    const S = await until(page, () => { const t = document.querySelector('[data-na-newpaper]'); return t && t.getAttribute('aria-selected') === 'true' ? { pop: !!document.getElementById('ns-form'), lit: [...document.querySelectorAll('.na-ptab[aria-selected="true"]')].map(x => x.textContent.trim()) } : null; }, null, 8000);
    check('5 Our paper\'s Create a template opens the sheet on its tab, no pop-up, one tab lit', !!S && !S.pop && S.lit.join() === 'Create a template', S);

    /* 6 · CLAUSE N ⇄ CONTRACT (owner, 24 Nov 2026): the tag names the clause; pressed, Contract; he asks first, drafts
       every empty section as a card shown on the paper, writes nothing until Apply all. The model is stood in for. */
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    await page.route('**/api/ai/section', r => { const b = JSON.parse(r.request().postData() || '{}');
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b.ask ? { questions: [{ question: 'How is the rent paid?', options: ['Monthly, in advance', 'Quarterly'], usual: 0 }] } : { text: 'The ' + b.heading + ' wording.', note: '' }) }); });
    const C = await mk('Office Lease');
    await page.evaluate(i => { window.copilotAvailable = () => true; openTemplateBuilder(i.tid, i.vid); }, C);
    const tagUp = await until(page, () => { const b = document.querySelector('[data-tb-scope]'); return b ? b.textContent.trim() : null; });
    check('6a the tag in Jambo\'s box is a switch naming the clause in hand', !!tagUp && /⇄/.test(tagUp), tagUp);
    if (tagUp) {
      await page.click('[data-tb-scope]');
      const all = await until(page, () => { const b = document.querySelector('[data-tb-scope]'); return b && b.getAttribute('aria-pressed') === 'true' ? b.textContent.trim() : null; });
      check('6b pressed, it says Contract', !!all && /^Contract/.test(all), all);
      await page.fill('#tb-ask', 'Write the whole lease.'); await page.click('[data-tb-send]');
      const q = await until(page, () => { const x = document.querySelector('.tb-wq-q'); return x ? x.textContent : null; });
      check('6c he asks first, one question at a time', !!q, q);
      if (q) {
        for (let i = 0; i < 3; i++) { const more = await page.evaluate(() => !!document.querySelector('[data-tb-wopt="0"]')); if (!more) break; await page.click('[data-tb-wopt="0"]'); await page.waitForTimeout(150); }
        const ready = await until(page, () => document.querySelector('[data-tb-wall]') ? { props: document.querySelectorAll('.tb-wprop').length, paper: document.getElementById('tb-paper').textContent } : null, null, 10000);
        check('6d every empty section drafted, shown on the paper, nothing written', !!ready && ready.props >= 1, ready && { props: ready.props });
        if (ready) {
          await page.click('[data-tb-wall]');
          const put = await until(page, () => !document.querySelector('.tb-wprop') && /Term wording/.test(document.getElementById('tb-paper').textContent) ? true : null, null, 8000);
          check('6e Apply all puts them on the paper', !!put);
        }
      }
    }

    check('no page errors', errors.length === 0, errors.slice(0, 3));
  } catch (e) { check('ran to the end', false, String(e && e.message || e).slice(0, 300)); }
  await browser.close(); await h.stop();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})();
