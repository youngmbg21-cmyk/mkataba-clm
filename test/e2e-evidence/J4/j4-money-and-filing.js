/* J4 — KEY TERMS, MONEY IN ITS OWN CURRENCY, AND FILING.
   The load-bearing claim: a contract's OWN page prints its OWN currency, and
   every figure that ADDS contracts up converts — and where no rate is on file
   the figure SAYS what it left out rather than silently trimming. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = path.join(__dirname, 'shots');
const results = [];
const check = (n, p, d) => { results.push({ name: n, pass: !!p, detail: d }); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const A = W.admin, ED = W.unrestricted;
  let browser;
  const mk = (id, over) => A.json('/api/contracts/' + id, { method: 'PUT', body: { contract: Object.assign({
    id, name: 'Money probe ' + id, counterparty: 'Kabras Sugar', folder: 'proc',
    value: 40000, valueType: 'standard', status: 'Under Review', template: 'RM', expiry: '2028-01-31',
    metadata: { value: 40000, currency: 'KES' }, redlineText: '<p>Clause 1.</p>', format: 'rich',
    fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
    audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe' }],
  }, over) } });

  try {
    await mk('MK-USD', { name: 'USD contract', value: 40000, metadata: { value: 40000, currency: 'USD' } });
    await mk('MK-EUR', { name: 'EUR contract', value: 30000, metadata: { value: 30000, currency: 'EUR' } });
    await mk('MK-KES', { name: 'KES contract', value: 5000000, metadata: { value: 5000000, currency: 'KES' } });

    /* SET A RATE FOR USD ONLY, so EUR is the "no rate on file" case */
    const rate = await A.raw('/api/settings/fx-rates', { method: 'PUT', body: { rates: { USD: { rate: 130, at: new Date().toISOString().slice(0, 10) } } } });
    check('an admin can set a rate through the FX route', rate.status < 400, `HTTP ${rate.status} ${String(rate.text).slice(0, 160)}`);
    const edRate = await ED.raw('/api/settings/fx-rates', { method: 'PUT', body: { rates: { EUR: { rate: 150, at: '2026-08-01' } } } });
    check('an EDITOR is refused the FX rates route', edRate.status >= 400, `HTTP ${edRate.status} ${String(edRate.text).slice(0, 140)}`);

    const stats = await A.json('/api/stats');
    fs.writeFileSync(path.join(__dirname, 'stats.json'), JSON.stringify(stats, null, 2));
    check('the aggregate reports what it could NOT convert, rather than trimming silently',
      stats.fxMissing && Object.keys(stats.fxMissing).length > 0, `fxMissing = ${JSON.stringify(stats.fxMissing)}`);
    check('…and it names EUR specifically (the currency with no rate on file)',
      !!(stats.fxMissing || {}).EUR, JSON.stringify(stats.fxMissing));
    check('…and it does NOT name USD, which has a rate', !(stats.fxMissing || {}).USD, JSON.stringify(stats.fxMissing));
    const an = await A.json('/api/analytics').catch(e => ({ err: e.message }));
    check('the analytics route reports the same omission', !!(an.fxMissing && an.fxMissing.EUR), `fxMissing = ${JSON.stringify(an.fxMissing)}`);

    browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForTimeout(2800);

    const own = await page.evaluate(() => ({
      usd: window.fmtMoneyOf ? fmtMoneyOf(getContract('MK-USD')) : null,
      eur: window.fmtMoneyOf ? fmtMoneyOf(getContract('MK-EUR')) : null,
      kes: window.fmtMoneyOf ? fmtMoneyOf(getContract('MK-KES')) : null,
      usdShort: window.fmtMoneyShortOf ? fmtMoneyShortOf(getContract('MK-USD')) : null,
      eurShort: window.fmtMoneyShortOf ? fmtMoneyShortOf(getContract('MK-EUR')) : null,
      home: { usd: fxHome(getContract('MK-USD')), eur: fxHome(getContract('MK-EUR')) },
    }));
    check('a USD contract prints in USD on its own page', /USD/.test(own.usd || ''), own.usd);
    check('a EUR contract prints in EUR on its own page', /EUR/.test(own.eur || ''), own.eur);
    check('a workspace-currency contract still prints in KES', /KES/.test(own.kes || ''), own.kes);
    check('the COMPACT print follows the contract\'s own currency too (the register row)',
      /USD/.test(own.usdShort || '') && /EUR/.test(own.eurShort || ''), `${own.usdShort} · ${own.eurShort}`);
    check('a converted figure says it converted', own.home.usd && own.home.usd.converted === true && !own.home.usd.missing, JSON.stringify(own.home.usd));
    check('an unconvertible figure says MISSING rather than guessing a rate',
      own.home.eur && own.home.eur.missing === true, JSON.stringify(own.home.eur));

    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1400);
    const rows = await page.evaluate(() => {
      const out = {};
      ['MK-USD', 'MK-EUR', 'MK-KES'].forEach(id => {
        const r = [...document.querySelectorAll('tr')].find(t => t.textContent.includes(id));
        out[id] = r ? r.innerText.replace(/\s+/g, ' ').trim() : null;
      });
      return out;
    });
    await page.screenshot({ path: path.join(SHOTS, 'j4-register-currencies.png') });
    check('the REGISTER row prints each contract in its own currency, not the workspace one',
      /USD/.test(rows['MK-USD'] || '') && /EUR/.test(rows['MK-EUR'] || ''),
      `USD row: ${rows['MK-USD']} || EUR row: ${rows['MK-EUR']}`);

    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(1800);
    const dashText = await page.evaluate(() => (document.querySelector('#view-dashboard') || document.body).innerText.replace(/\s+/g, ' ').trim());
    await page.screenshot({ path: path.join(SHOTS, 'j4-dashboard-fx.png') });
    check('the DASHBOARD says what it left out of the converted headline',
      /left out|EUR/i.test(dashText), (/(.{0,140}(left out|EUR).{0,80})/i.exec(dashText) || ['not found'])[0]);

    /* KEY TERMS ROWS, DRAFT vs SIGNED */
    await mk('MK-SIGNED', { name: 'Signed probe', status: 'Signed', signedAt: new Date().toISOString(), hash: 'abc' });
    const ktRows = async id => {
      await page.evaluate(cid => { state.activeId = cid; state.selId = cid; setView('workspace'); }, id);
      await page.waitForTimeout(1600);
      await page.click('[data-ws-tab="terms"]').catch(() => {});
      await page.waitForTimeout(1400);
      return page.evaluate(() => [...document.querySelectorAll('[data-kt-row]')].map(r => {
        const ctl = r.querySelector('input,select,textarea,[contenteditable="true"]');
        return { key: r.getAttribute('data-kt-row'), hasControl: !!ctl,
          disabled: ctl ? (ctl.disabled === true || ctl.getAttribute('aria-disabled') === 'true') : null };
      }));
    };
    const draftRows = await ktRows('MK-KES');
    await page.screenshot({ path: path.join(SHOTS, 'j4-keyterms-draft.png') });
    const signedRows = await ktRows('MK-SIGNED');
    await page.screenshot({ path: path.join(SHOTS, 'j4-keyterms-signed.png') });
    const liveOnDraft = draftRows.filter(r => r.hasControl && !r.disabled).map(r => r.key);
    const liveOnSigned = signedRows.filter(r => r.hasControl && !r.disabled).map(r => r.key);
    check('most Key terms rows stand down on a SIGNED contract', liveOnSigned.length < liveOnDraft.length,
      `live on draft (${liveOnDraft.length}): ${liveOnDraft.join(',')} || live on signed (${liveOnSigned.length}): ${liveOnSigned.join(',')}`);
    const streamLiveSigned = signedRows.some(r => /folder|stream/i.test(r.key || '') && r.hasControl && !r.disabled);
    check('…but the STREAM picker deliberately stays live on a signed contract', streamLiveSigned,
      `signed rows: ${JSON.stringify(signedRows)}`);

    /* RE-FILING IS AN ADMIN'S ACT */
    const edMove = await (async () => {
      const f = await ED.json('/api/contracts/MK-KES'); const bv = f._v; delete f._v; f.folder = 'sales';
      return ED.raw('/api/contracts/MK-KES', { method: 'PUT', body: { contract: f, baseVersion: bv } });
    })();
    check('an EDITOR is refused a stream move at the server', edMove.status >= 400, `HTTP ${edMove.status} ${String(edMove.text).slice(0, 180)}`);
    const adMove = await (async () => {
      const f = await A.json('/api/contracts/MK-KES'); const bv = f._v; delete f._v; f.folder = 'sales';
      return A.raw('/api/contracts/MK-KES', { method: 'PUT', body: { contract: f, baseVersion: bv } });
    })();
    check('an ADMIN may re-file it', adMove.status < 400, `HTTP ${adMove.status}`);
    const moved = await A.json('/api/contracts/MK-KES');
    check('…and the move is written to the record', moved.folder === 'sales', `folder=${moved.folder}`);

    check('no page errors across the money walk', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e) {
    check('J4 walk completed without throwing', false, e.message + '\n' + e.stack);
  } finally {
    const pass = results.filter(r => r.pass).length;
    console.log(`\n${pass}/${results.length} checks passed`);
    fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
    if (browser) await browser.close(); await h.stop(); process.exit(0);
  }
})();
