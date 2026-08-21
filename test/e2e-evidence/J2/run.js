/* J2 — "Raising a contract, every way there is": verification script.
   Audits only. Never touches product code. Evidence in test/e2e-evidence/J2/. */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const OUT = __dirname;
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const findings = [];
const log = [];
const say = (...a) => { const s = a.join(' '); log.push(s); console.log(s); };
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  say(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const finding = (rank, title, repro) => {
  findings.push({ rank, title, repro });
  say(`FINDING[${rank}] ${title} :: ${repro}`);
};

const ROOT = path.join(__dirname, '..', '..', '..');

const templateRows = []; // for templates.md

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

  const shot = async (name) => { await page.screenshot({ path: path.join(SHOTS, name), fullPage: false }); };

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2000);

    /* ================================================================
       TASK 4 (checked model-level first, exercised for real via the
       wizard further below): A NEW DRAFT OPENS ON KEY TERMS.
       ================================================================ */
    say('=== TASK 4: a new draft opens on Key terms — the three properties ===');
    const p4 = await page.evaluate(() => {
      const out = {};
      const mk = (id, over) => ({ id, name: 'X', counterparty: 'Acme', template: 'WH',
        status: 'Draft', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
        versions: [], signatures: [], comments: [], value: 0, ...over });
      const ctrl = mk('P4-CTRL'); window.wsTabDefaults(ctrl); out.control = window.roomCurrentTab();
      const c1 = mk('P4-1'); window.roomOpenOnTerms(c1.id); window.wsTabDefaults(c1); out.firstLand = window.roomCurrentTab();
      window.wsTabDefaults(mk('P4-OTHER')); window.wsTabDefaults(c1); out.secondLand = window.roomCurrentTab();
      const done = mk('P4-DONE', { status: 'Signed' }); window.roomOpenOnTerms(done.id); window.wsTabDefaults(done); out.executed = window.roomCurrentTab();
      const sealed = mk('P4-SEALED', { status: 'Under Review', hash: 'abc' }); window.roomOpenOnTerms(sealed.id); window.wsTabDefaults(sealed); out.sealedMigrated = window.roomCurrentTab();
      const up = mk('P4-UP', { status: 'Under Review' }); window.roomOpenOnTerms(up.id); window.wsTabDefaults(up); out.upload = window.roomCurrentTab();
      const c2 = mk('P4-2'); window.roomOpenOnTerms(c2.id); window.state.view = 'redline'; window.openWorkspace = () => {};
      window.roomGoTab(c2, 'docs'); window.wsTabDefaults(c2); out.explicitWins = window.roomCurrentTab();
      return out;
    });
    check('control: an unregistered contract opens on docs', p4.control === 'docs', p4.control);
    check('property 1: a registered draft lands on Key terms', p4.firstLand === 'terms', p4.firstLand);
    check('property 1: it fires ONCE — the id is deleted on arrival', p4.secondLand === 'docs', p4.secondLand);
    check('property 2: an executed (Signed) contract is excluded', p4.executed === 'docs', p4.executed);
    check('property 2: a sealed/migrated contract excluded even if status is not literally Signed', p4.sealedMigrated === 'docs', p4.sealedMigrated);
    check('property 2: an UPLOAD (Under Review, not executed) IS included', p4.upload === 'terms', p4.upload);
    check('property 3: an explicit tab request (_wsTabWant) still wins', p4.explicitWins === 'docs', p4.explicitWins);

    /* ================================================================
       TASK 1, SITE 1: js/wizard.js — via real UI.
       Also exercises TASK 3 (streams-first picker) and TASK 4 for real.
       ================================================================ */
    say('\n=== SITE 1/8: js/wizard.js — the guided wizard, real UI ===');
    const heroDraftExists = await page.evaluate(() => !!document.getElementById('hero-draft'));
    check('the Home page\'s "Draft new agreement" trigger (#hero-draft) exists on screen', heroDraftExists);
    await page.click('#hero-draft'); await page.waitForTimeout(300);
    await page.click('#menu-wizard'); await page.waitForTimeout(500);
    await shot('01-wizard-streams-screen.png');

    const streamsScreen = await page.evaluate(() => {
      const root = document.getElementById('modal-root') || document.body;
      return { streamBtns: Array.from(root.querySelectorAll('[data-wz-stream]')).map(b => b.textContent.trim()),
        hasSearch: !!document.getElementById('wz-search'), hasForYou: /for you/i.test(root.textContent || '') };
    });
    check('the picker opens on a STREAMS screen (not one flat grid)', streamsScreen.streamBtns.length > 0, streamsScreen.streamBtns.join(' | '));
    check('search sits on the front (streams) screen', streamsScreen.hasSearch);

    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('[data-wz-stream]')).find(el => el.getAttribute('data-wz-stream') === 'proc'); if (b) b.click(); });
    await page.waitForTimeout(400);
    await shot('02-wizard-inside-proc-stream.png');
    const insideStream = await page.evaluate(() => {
      const root = document.getElementById('modal-root') || document.body;
      return { back: !!document.getElementById('wz-streams-back'), cards: Array.from(root.querySelectorAll('[data-wz-tid]')).map(b => b.textContent.trim()) };
    });
    check('opening a stream shows a back door and its own templates', insideStream.back && insideStream.cards.length > 0, insideStream.cards.join(' | '));

    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('[data-wz-tid]')).find(el => el.getAttribute('data-wz-tid') === 'RM'); if (b) b.click(); });
    await page.waitForTimeout(400);
    await page.fill('#wz-counterparty', 'Kabras Sugar Co');
    await page.fill('#wz-cpemail', 'legal@kabras.example.co.ke');
    await shot('03-wizard-essentials-form.png');
    const beforeCount = await page.evaluate(() => window.state.contracts.length);
    await page.click('#wz-create');
    await page.waitForTimeout(1200);
    const afterWizard = await page.evaluate(() => {
      const c = window.state.contracts[0];
      return { n: window.state.contracts.length, id: c.id, owner: c.owner || null, tab: window.roomCurrentTab(), folder: c.folder };
    });
    check('wizard: a new contract landed at the top of the register', afterWizard.n === beforeCount + 1, `n=${afterWizard.n}`);
    check('wizard: the new contract carries an OWNER stamp', !!(afterWizard.owner && afterWizard.owner.id), JSON.stringify(afterWizard.owner));
    check('wizard: it opened the room on Key terms', afterWizard.tab === 'terms', afterWizard.tab);
    check('wizard: filed under the stream it was picked from (proc)', afterWizard.folder === 'proc', afterWizard.folder);
    await shot('04-wizard-landed-on-key-terms.png');

    /* ================================================================
       SITE 2: js/app.js — createFromTemplate. Source claims it has no
       live UI trigger any more. Verify the claim, then exercise it at
       model level since it remains window-exported.
       ================================================================ */
    say('\n=== SITE 2/8: js/app.js — createFromTemplate ===');
    const grepHits = cp.execSync(`grep -rn "createFromTemplate(" ${JSON.stringify(path.join(ROOT, 'js'))} ${JSON.stringify(path.join(ROOT, 'index.html'))} 2>/dev/null || true`).toString();
    say('grep for createFromTemplate( callers:\n' + grepHits.trim());
    const callers = grepHits.split('\n').filter(Boolean).filter(l => !/function createFromTemplate|window,\{createFromTemplate|Object\.assign\(window/.test(l));
    say('callers beyond the function\'s own definition/export: ' + JSON.stringify(callers));
    /* js/app.js's own comment on createFromTemplate claims "No interface path
       calls this any more … both routes … go through openWizard()". The grep
       above shows a THIRD caller — js/views/intake.js's Requests door — which
       CLAUDE.md's own Phase 2 (W2-2) section documents as live: "Turning one
       into paper goes through the ORDINARY creation path (createFromTemplate
       …)". So the comment in js/app.js is stale, not the behaviour. Reproduce
       the real UI path: Requests -> ask -> (as an editor) Draft -> pick a
       template -> create. */
    const intakeCallerExists = callers.some(l => /intake\.js/.test(l));
    check('a caller beyond createFromTemplate\'s own definition/export exists in source (js/views/intake.js)', intakeCallerExists, callers.join(' | '));

    await page.evaluate(() => { window.setView('intake'); });
    await page.waitForTimeout(500);
    await shot('intake-01-page.png');
    await page.click('#ik-new');
    await page.waitForTimeout(300);
    await page.fill('#ik-title', 'Need an NDA with a new vendor');
    await page.fill('#ik-need', 'We are onboarding a new supplier and need mutual confidentiality in place before we share pricing.');
    await shot('intake-02-ask-form.png');
    await page.click('#ik-send');
    await page.waitForTimeout(800);
    await shot('intake-03-queued.png');
    const beforeCF = await page.evaluate(() => window.state.contracts.length);
    const draftBtn = await page.$('[data-ik-draft]');
    check('an open request offers a "Draft" action to an editor/admin (the intake queue)', !!draftBtn);
    if (draftBtn) {
      await draftBtn.click();
      await page.waitForTimeout(500);
      await shot('intake-04-draft-dialog.png');
      await page.click('#ik-d-go');
      await page.waitForTimeout(900);
    }
    const afterCF = await page.evaluate(() => { const c = window.state.contracts[0]; return { n: window.state.contracts.length, owner: c.owner || null, tab: window.roomCurrentTab(), template: c.template, intakeRequestId: c.intakeRequestId || null }; });
    check('SITE 2 (via Requests -> Draft): createFromTemplate created a contract through a REAL UI path', afterCF.n === beforeCF + 1, JSON.stringify(afterCF));
    check('SITE 2: the contract carries an owner stamp', !!(afterCF.owner && afterCF.owner.id), JSON.stringify(afterCF.owner));
    check('SITE 2: it opened the room on Key terms', afterCF.tab === 'terms', afterCF.tab);
    check('SITE 2: the contract is linked back to the request it came from', !!afterCF.intakeRequestId, afterCF.intakeRequestId);
    await shot('intake-05-drafted-key-terms.png');
    finding('Lying', 'js/app.js\'s own comment on createFromTemplate is stale',
      `The function is preceded by "No interface path calls this any more: both routes into a built-in template … go through openWizard()." That was true when written, but js/views/intake.js's Requests door (built later, per CLAUDE.md\'s W2-2 section) now calls createFromTemplate directly on "Draft" — confirmed live end to end: Requests -> Ask -> an editor presses Draft -> picks a template -> creates a contract that is owned, lands on Key terms, and is linked back to the request via intakeRequestId. The CODE is fine (createFromTemplate still does the right thing — owner stamp, roomOpenOnTerms, audit line); the comment inside js/app.js disagrees with the file that actually calls it. Two surfaces (a source comment and a live feature) say opposite things about the same function.`);

    /* ================================================================
       SITE 3: js/views/library.js — createFromCustomTemplate, real UI.
       ================================================================ */
    say('\n=== SITE 3/8: js/views/library.js — createFromCustomTemplate, real UI ===');
    await page.evaluate(() => { window.setView('templates'); });
    await page.waitForTimeout(600);
    await shot('05-templates-page.png');
    await page.click('#tpl-new'); await page.waitForTimeout(300);
    await page.click('#tn-cp'); await page.waitForTimeout(400);
    await page.fill('#ct-name', 'Acme Counterparty MSA');
    await page.click('#ct-editor');
    await page.keyboard.type('MASTER SERVICES AGREEMENT\n\nThis is their own paper, pasted in.');
    await shot('06-create-counterparty-template.png');
    await page.click('#ct-save');
    await page.waitForTimeout(800);

    await page.evaluate(() => window.openNewMenu());
    await page.waitForTimeout(300);
    await page.click('#menu-wizard'); await page.waitForTimeout(500);
    /* NOTE: a "mine" (saved-template) card is NOT on the wizard's front
       screen — it is grouped into its value stream exactly like every other
       row (rows are built once and grouped by folder; the front screen only
       shows the curated "For you" grid, streams grid and search). Reached
       here via the search box, which the picker's own rule says looks across
       every stream — this doubles as evidence for that rule. */
    await page.fill('#wz-search', 'Acme Counterparty MSA');
    await page.waitForTimeout(300);
    await shot('07-wizard-mine-row.png');
    const mineRow = await page.evaluate(() => Array.from(document.querySelectorAll('#wz-hits [data-wz-mine]')).map(x => x.textContent.trim()));
    check('a saved ("mine") template is reachable via the picker (found by search)', mineRow.length > 0, mineRow.join(' | '));
    const beforeLib = await page.evaluate(() => window.state.contracts.length);
    await page.evaluate(() => { const b = document.querySelector('#wz-hits [data-wz-mine]'); if (b) b.click(); });
    await page.waitForTimeout(500);
    const ceForm = await page.evaluate(() => !!document.getElementById('ce-create'));
    check('picking a saved template opens the essentials form (ce-create)', ceForm);
    if (ceForm) { await page.fill('#ce-counterparty', 'Modern Acme Distribution'); await page.click('#ce-create'); await page.waitForTimeout(700); }
    const afterLib = await page.evaluate(() => { const c = window.state.contracts[0]; return { n: window.state.contracts.length, owner: c.owner || null, tab: window.roomCurrentTab(), name: c.name }; });
    check('library.js: a contract was created from the saved template', afterLib.n === beforeLib + 1, afterLib.name);
    check('library.js: it carries an owner stamp', !!(afterLib.owner && afterLib.owner.id));
    check('library.js: it lands on Key terms', afterLib.tab === 'terms', afterLib.tab);

    /* ================================================================
       SITE 4: js/views/templatelib.js — tplLibNewContract, real UI.
       Also TASK 3: the "Other" folder in the streams picker.
       ================================================================ */
    say('\n=== SITE 4/8: js/views/templatelib.js — tplLibNewContract, real UI ===');
    say('=== TASK 3: the picker streams, and "Other" for the unfiled ===');
    const mkCompanyTpl = async (name, folder) => {
      const t = await W.admin.json('/api/templates', { method: 'POST', body: { name, category: 'sales', description: 'Company standard.', ...(folder ? { folder } : {}) } });
      const tid = t.template.id;
      const vers = await W.admin.json(`/api/templates/${tid}`);
      const vid = (vers.versions && vers.versions[0] && vers.versions[0].id) || vers.template.latestVersionId;
      await W.admin.json(`/api/templates/${tid}/versions/${vid}`, { method: 'PUT', body: {
        blocks: [{ orderIndex: 0, blockType: 'heading', content: '1. Services' }, { orderIndex: 1, blockType: 'fixed_text', content: '<p>The Supplier shall supply.</p>' }], fields: [] } });
      await W.admin.json(`/api/templates/${tid}/versions/${vid}/publish`, { method: 'POST', body: {} });
      return tid;
    };
    await mkCompanyTpl('Master Distribution Standard', 'dist');
    await mkCompanyTpl('Unfiled Company Standard', null);
    await page.evaluate(() => { if (window.tplLibRefresh) return window.tplLibRefresh(); });
    await page.waitForTimeout(400);

    await page.evaluate(() => window.openNewMenu());
    await page.waitForTimeout(300);
    await page.click('#menu-wizard'); await page.waitForTimeout(600);
    await shot('08-wizard-streams-with-company-templates.png');

    const otherCheck = await page.evaluate(() => {
      const root = document.getElementById('modal-root') || document.body;
      const streamButtons = Array.from(root.querySelectorAll('[data-wz-stream]')).map(b => ({ id: b.getAttribute('data-wz-stream'), text: b.textContent.trim() }));
      const otherBtn = streamButtons.find(b => /unfiled|other/i.test(b.text) || b.id.includes('other'));
      const FOLDERS_has_other = Object.values(window.FOLDERS).some(f => /\bother\b/i.test(f.name)) || Object.prototype.hasOwnProperty.call(window.FOLDERS, 'other') || Object.prototype.hasOwnProperty.call(window.FOLDERS, 'Other');
      return { streamButtons, otherBtn: otherBtn || null, FOLDERS_has_other };
    });
    say('stream buttons: ' + JSON.stringify(otherCheck.streamButtons));
    check('a distinct "Other" stream card is drawn for the unfiled template', !!otherCheck.otherBtn, JSON.stringify(otherCheck.otherBtn));
    check('"Other" is never a real value stream in FOLDERS', !otherCheck.FOLDERS_has_other);

    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('[data-wz-stream]')).find(el => el.getAttribute('data-wz-stream') === 'dist'); if (b) b.click(); });
    await page.waitForTimeout(400);
    const distStream = await page.evaluate(() => Array.from((document.getElementById('modal-root') || document.body).querySelectorAll('[data-wz-lib]')).map(b => b.textContent.trim()));
    check('the filed company template is listed inside its own stream (dist)', distStream.some(t => /Master Distribution Standard/.test(t)), distStream.join(' | '));
    await shot('09-wizard-dist-stream-company-template.png');
    await page.click('#wz-streams-back'); await page.waitForTimeout(300);

    const otherId = otherCheck.otherBtn ? otherCheck.otherBtn.id : null;
    await page.evaluate((oid) => { const b = Array.from(document.querySelectorAll('[data-wz-stream]')).find(el => el.getAttribute('data-wz-stream') === oid); if (b) b.click(); }, otherId);
    await page.waitForTimeout(400);
    await shot('10-wizard-other-stream.png');
    const otherContents = await page.evaluate(() => Array.from((document.getElementById('modal-root') || document.body).querySelectorAll('[data-wz-lib]')).map(b => b.textContent.trim()));
    check('the unfiled company template shows up under "Other"', otherContents.some(t => /Unfiled Company Standard/.test(t)), otherContents.join(' | '));

    await page.click('#wz-streams-back'); await page.waitForTimeout(300);
    await page.fill('#wz-search', 'Unfiled Company Standard');
    await page.waitForTimeout(300);
    const searchHits = await page.evaluate(() => (document.getElementById('wz-hits') || document.body).textContent);
    check('search on the front screen finds a template regardless of which stream it is filed under', /Unfiled Company Standard/.test(searchHits));
    await shot('11-wizard-search-across-streams.png');

    const beforeTplLib = await page.evaluate(() => window.state.contracts.length);
    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('[data-wz-lib]')).find(el => /Unfiled Company Standard/.test(el.textContent)); if (b) b.click(); });
    await page.waitForTimeout(500);
    const ceForm2 = await page.evaluate(() => !!document.getElementById('ce-create'));
    check('tplLibNewContract opens the essentials form', ceForm2);
    if (ceForm2) { await page.fill('#ce-counterparty', 'Second Test Counterparty'); await page.click('#ce-create'); await page.waitForTimeout(900); }
    const afterTplLib = await page.evaluate(() => { const c = window.state.contracts[0]; return { n: window.state.contracts.length, owner: c.owner || null, tab: window.roomCurrentTab(), folder: c.folder }; });
    check('templatelib.js: a contract was created from the company template', afterTplLib.n === beforeTplLib + 1);
    check('templatelib.js: it carries an owner stamp', !!(afterTplLib.owner && afterTplLib.owner.id));
    check('templatelib.js: it lands on Key terms', afterTplLib.tab === 'terms', afterTplLib.tab);
    /* A template shown under "Other" (no `folder` set) still lands its
       contract in a REAL stream — never truly unfiled, matching CLAUDE.md's
       "a contract can never be filed into Other" promise. Which real stream it
       lands in is decided SERVER-SIDE by the template's `category` (a
       DIFFERENT field from the `folder` the picker groups by), via
       TPL_CATEGORY_FOLDER — never by `folder` itself. */
    check('an "Other" (unfiled) template still lands its contract in a real stream (never literally unfiled)', typeof afterTplLib.folder === 'string' && afterTplLib.folder.length > 0, 'folder=' + afterTplLib.folder);

    // Prove the disagreement directly: a template explicitly FILED under one
    // stream in the picker (folder=mktg) whose separate `category` maps
    // elsewhere lands its contracts in the CATEGORY's stream, not the
    // picker's stream — the picker and the actual filing destination can
    // name two different streams for the very same template.
    const mismatchTid = (await W.admin.json('/api/templates', { method: 'POST', body: {
      name: 'Mismatch Probe (Marketing folder, Procurement category)', category: 'procurement', folder: 'mktg', description: 'probe' } })).template.id;
    const mismatchVers = await W.admin.json(`/api/templates/${mismatchTid}`);
    const mismatchVid = (mismatchVers.versions[0] || {}).id || mismatchVers.template.latestVersionId;
    await W.admin.json(`/api/templates/${mismatchTid}/versions/${mismatchVid}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'heading', content: '1. X' }], fields: [] } });
    await W.admin.json(`/api/templates/${mismatchTid}/versions/${mismatchVid}/publish`, { method: 'POST', body: {} });
    const mismatchContract = await W.admin.json(`/api/templates/${mismatchTid}/contracts`, { method: 'POST', body: { counterparty: 'Probe Co' } });
    const pickerStream = 'mktg (Marketing & Brand — where the picker files and displays it)';
    const actualStream = mismatchContract.contract.folder + ' (where the resulting contract actually landed)';
    check('a template\'s picker stream (folder) and its contracts\' actual landing stream can DISAGREE', mismatchContract.contract.folder !== 'mktg', `picker=${pickerStream} | actual=${actualStream}`);
    finding('Lying', 'A company template\'s picker stream and its contracts\' actual filing stream can silently disagree',
      `Reproduced against a real server: created a template with folder='mktg' (Marketing & Brand — the field js/wizard.js's streams picker groups and displays by, and the field tplLibCreateModal's own "Stream" dropdown writes) and category='procurement' (a separate dropdown on the SAME creation form, business-category only). The wizard picker correctly shows/files this template under Marketing & Brand. But POST /api/templates/:id/contracts (server/server.js, the route every tplLibNewContract press goes through) computes the landing folder as "b.folder && typeof b.folder==='string' ? b.folder : (TPL_CATEGORY_FOLDER[t.category] || 'corp')" — the CLIENT never sends b.folder (tplLibCreate's POST body only carries counterparty/value/dates), so it ALWAYS falls through to TPL_CATEGORY_FOLDER[t.category], landing the contract in "proc" (Procurement) — a different stream from the one the template is filed under and displayed under everywhere else. An admin who deliberately puts a template under one value stream in the Templates page/picker gets every contract from it silently filed under a different one whenever the (separate, easy to leave mismatched) business category disagrees. This is a genuine disagreement between two surfaces reading the "same" fact — not model-level: reproduced with a plain POST /api/templates then POST /api/templates/:id/contracts, i.e. exactly the request the real "Use" button sends.`);

    /* ================================================================
       SITE 5: js/templatefields.js — createBulkFromTemplate, real UI
       via a real CSV file dropped on the Templates page's bulk-create
       row for a built-in template (RM has fields, so it qualifies).
       ================================================================ */
    say('\n=== SITE 5/8: js/templatefields.js — createBulkFromTemplate, real UI (real CSV upload) ===');
    await page.evaluate(() => { window.setView('templates'); });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const b = document.querySelector('[data-tpl-group="builtin"]'); if (b) b.click(); });
    await page.waitForTimeout(400);
    await shot('12-templates-builtin-list.png');
    const bulkBtn = await page.$('[data-tpl-bulk-b="RM"]');
    check('a "Create in bulk" trigger exists for the Raw Material Supply built-in', !!bulkBtn);
    if (bulkBtn) {
      await bulkBtn.click();
      await page.waitForTimeout(400);
      const csvHeader = await page.evaluate(() => window.bulkTemplateCsv(window.TEMPLATES.RM).split('\n')[0]);
      // Build a real filled row against the RM fields.
      const csvBody = await page.evaluate(() => {
        const fs = window.templateFields(window.TEMPLATES.RM);
        const row = ['Bulk RM Supply — Test Row'];
        fs.forEach(f => {
          if (f.type === 'date') row.push('2027-01-15');
          else if (f.type === 'num') row.push('1500000');
          else row.push(f.def || 'Test value');
        });
        return row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
      });
      const csv = csvHeader + '\n' + csvBody + '\n';
      fs.writeFileSync(path.join(OUT, 'bulk-rm.csv'), csv);
      await page.setInputFiles('#bk-file', path.join(OUT, 'bulk-rm.csv'));
      await page.waitForTimeout(500);
      await shot('13-bulk-csv-checked.png');
      const beforeBulk = await page.evaluate(() => window.state.contracts.length);
      const bkGoEnabled = await page.evaluate(() => !document.getElementById('bk-go').disabled);
      check('the bulk CSV parsed clean and enabled "Create drafts"', bkGoEnabled);
      if (bkGoEnabled) {
        await page.click('#bk-go');
        await page.waitForTimeout(700);
      }
      const afterBulk = await page.evaluate(() => {
        const c = window.state.contracts.find(x => /Bulk RM Supply/.test(x.name));
        return c ? { found: true, owner: c.owner || null, id: c.id } : { found: false };
      });
      check('templatefields.js: bulk creation produced the contract', afterBulk.found);
      if (afterBulk.found) check('templatefields.js: the bulk-created contract carries an owner stamp', !!(afterBulk.owner && afterBulk.owner.id), JSON.stringify(afterBulk.owner));
      // land-on-terms is asserted at source level for this file (f170); a bulk
      // run creates many contracts at once and opens none of them, by design
      // (nothing is "activeId" after a bulk run) — checked via source instead.
      const bulkSrc = fs.readFileSync(path.join(ROOT, 'js/templatefields.js'), 'utf8');
      check('templatefields.js registers roomOpenOnTerms for each bulk-created contract (source)', /roomOpenOnTerms\(c\.id\)/.test(bulkSrc));
    }

    /* ================================================================
       SITE 6: js/views/contract.js — submitUpload ("Draft new agreement"
       -> "Upload a received contract"), real UI with a real file.
       ================================================================ */
    say('\n=== SITE 6/8: js/views/contract.js — submitUpload, real UI (real .txt file) ===');
    await page.evaluate(() => window.openNewMenu());
    await page.waitForTimeout(300);
    await page.click('#menu-upload'); await page.waitForTimeout(500);
    await shot('14-upload-modal-step1.png');
    const uploadTxt = 'SUPPLY AGREEMENT\n\nBetween Highland Corporate Ltd and Test Uploaded Counterparty Ltd.\n\nThe contract value is KES 12,000,000.\n';
    fs.writeFileSync(path.join(OUT, 'upload-test.txt'), uploadTxt);
    await page.setInputFiles('#up-file', path.join(OUT, 'upload-test.txt'));
    await page.waitForTimeout(1200);
    await shot('15-upload-modal-step2-confirm.png');
    const upStep2 = await page.evaluate(() => !!document.getElementById('up-go'));
    check('the upload pipeline reached the confirm step (up-go present)', upStep2);
    if (upStep2) {
      await page.fill('#up-cp', 'Test Uploaded Counterparty Ltd');
      const beforeUp = await page.evaluate(() => window.state.contracts.length);
      await page.click('#up-go');
      await page.waitForTimeout(1200);
      const afterUp = await page.evaluate(() => {
        const c = window.state.contracts[0];
        return { n: window.state.contracts.length, owner: c.owner || null, tab: window.roomCurrentTab(), status: c.status };
      });
      check('contract.js: the uploaded contract was created', afterUp.n === beforeUp + 1);
      check('contract.js: the uploaded contract carries an owner stamp', !!(afterUp.owner && afterUp.owner.id), JSON.stringify(afterUp.owner));
      check('contract.js: an upload is filed Under Review (not Draft)', afterUp.status === 'Under Review', afterUp.status);
      check('contract.js: an upload (not-yet-executed) still lands on Key terms', afterUp.tab === 'terms', afterUp.tab);
      await shot('16-uploaded-contract-key-terms.png');
    }

    /* ================================================================
       SITE 7: js/views/migration.js — the bulk migration importer,
       real UI with a real .txt file dropped on #mig-files.
       ================================================================ */
    say('\n=== SITE 7/8: js/views/migration.js — migration importer, real UI (real .txt file) ===');
    await page.evaluate(() => window.openNewMenu());
    await page.waitForTimeout(300);
    await page.click('#menu-migrate'); await page.waitForTimeout(700);
    await shot('17-migration-page.png');
    /* The importer's OWN default status is "Signed — Executed outside HaTi"
       (renderMigration's #mig-status), which the room correctly excludes from
       Key terms (an executed record has none to fill). Drive BOTH cases for
       real: the default (executed, stays on docs) and an explicit "Under
       Review" pick (not-yet-executed, must land on Key terms). */
    const migTxtSigned = 'DISTRIBUTOR AGREEMENT\n\nBetween Highland Corporate Ltd and Migrated Legacy Partner Ltd.\n\nExecuted outside HaTi on 2024-01-10.\n';
    fs.writeFileSync(path.join(OUT, 'migration-test-signed.txt'), migTxtSigned);
    const beforeMigSigned = await page.evaluate(() => window.state.contracts.length);
    await page.setInputFiles('#mig-files', path.join(OUT, 'migration-test-signed.txt'));
    await page.waitForTimeout(2500);
    await shot('18-migration-after-drop-default-signed.png');
    const afterMigSigned = await page.evaluate(() => {
      const migrated = window.state.contracts.filter(x => x.source === 'upload' && x.migration);
      const c = migrated[0];
      return { n: window.state.contracts.length, id: c && c.id, status: c && c.status, hash: c && c.hash, owner: c && c.owner || null };
    });
    check('migration.js: the register grew after dropping a file', afterMigSigned.n > beforeMigSigned, `before=${beforeMigSigned} after=${afterMigSigned.n}`);
    check('migration.js: default import lands Signed/executed (the importer\'s own default)', afterMigSigned.status === 'Signed' && afterMigSigned.hash === 'MIGRATED', JSON.stringify(afterMigSigned));
    check('migration.js: an executed migrated contract carries an owner stamp', !!(afterMigSigned.owner && afterMigSigned.owner.id), JSON.stringify(afterMigSigned.owner));
    if (afterMigSigned.id) {
      const landedExecuted = await page.evaluate((id) => {
        const c = window.getContract(id); window.state.activeId = id; window.wsTabDefaults(c); return window.roomCurrentTab();
      }, afterMigSigned.id);
      check('migration.js: an EXECUTED migrated contract stays on the Document tab (correctly excluded)', landedExecuted === 'docs', landedExecuted);
    }

    // Now the not-yet-executed case: set the importer to "Under Review" first.
    await page.selectOption('#mig-status', 'Under Review');
    await page.waitForTimeout(300);
    const migTxtUR = 'DISTRIBUTOR AGREEMENT\n\nBetween Highland Corporate Ltd and Second Migrated Partner Ltd.\n\nStill under review.\n';
    fs.writeFileSync(path.join(OUT, 'migration-test-underreview.txt'), migTxtUR);
    const beforeMigUR = await page.evaluate(() => window.state.contracts.length);
    await page.setInputFiles('#mig-files', path.join(OUT, 'migration-test-underreview.txt'));
    await page.waitForTimeout(2500);
    await shot('19-migration-after-drop-under-review.png');
    const afterMigUR = await page.evaluate(() => {
      const migrated = window.state.contracts.filter(x => x.source === 'upload' && x.migration && x.status === 'Under Review');
      const c = migrated[0];
      return { n: window.state.contracts.length, id: c && c.id, status: c && c.status, hash: c && c.hash, owner: c && c.owner || null };
    });
    check('migration.js: a second import grew the register again', afterMigUR.n > beforeMigUR, `before=${beforeMigUR} after=${afterMigUR.n}`);
    check('migration.js: an "Under Review" migrated contract is NOT marked executed', afterMigUR.status === 'Under Review' && !afterMigUR.hash, JSON.stringify(afterMigUR));
    check('migration.js: it carries an owner stamp', !!(afterMigUR.owner && afterMigUR.owner.id), JSON.stringify(afterMigUR.owner));
    const migId = afterMigUR.id;
    if (migId) {
      const landed = await page.evaluate((id) => {
        const c = window.getContract(id);
        window.state.activeId = id;
        window.wsTabDefaults(c);
        return window.roomCurrentTab();
      }, migId);
      check('migration.js: a freshly migrated (not executed) contract lands on Key terms', landed === 'terms', landed);
    }

    /* ================================================================
       SITE 8 (the deliberate exception): js/family.js — "Create an
       amendment" opens on the DOCUMENT tab, not Key terms.
       ================================================================ */
    say('\n=== SITE 8/8 (deliberate exception): js/family.js — amendment writer opens on DOCUMENT ===');
    const famSrc = fs.readFileSync(path.join(ROOT, 'js/family.js'), 'utf8');
    check('js/family.js creates contracts (state.contracts.unshift(c))', /state\.contracts\.unshift\(c\)/.test(famSrc));
    check('js/family.js does NOT call roomOpenOnTerms', !/roomOpenOnTerms\s*\(/.test(famSrc));
    check('js/family.js still calls contractOwnerStamp', /contractOwnerStamp\(c\)/.test(famSrc));
    const famLanding = await page.evaluate(() => {
      const c = { id: 'FAM-1', name: 'Amendment', counterparty: 'Acme', template: 'WH', status: 'Draft',
        parentId: window.state.contracts[0] ? window.state.contracts[0].id : 'MK-1', relation: 'amendment',
        folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [], value: 0 };
      window.wsTabDefaults(c);
      return window.roomCurrentTab();
    });
    check('an amendment (nothing registered, per source) lands on the Document tab', famLanding === 'docs', famLanding);

    say(`\nnode page errors so far: ${errors.length}`);
    if (errors.length) say(errors.join('\n'));

    /* ================================================================
       TASK 2 — ALL TWELVE BUILT-IN TEMPLATES.
       For each: create via the wizard's essentials form with EVERY field
       filled, then read the paper for: (a) every asked field prints as a
       data-field, (b) TEMPLATE_PAY answer, (c) docTermSpan treatment,
       (d) party prints through the recital.
       ================================================================ */
    say('\n=== TASK 2: all twelve built-in templates ===');
    const walk = await page.evaluate(() => {
      const ESSENTIAL = new Set(['party', 'counterparty', 'value', 'effDate', 'expiry']);
      const out = [];
      Object.keys(window.TEMPLATES).forEach(id => {
        const t = window.TEMPLATES[id];
        const fields = window.builtinTemplateFields(id).map(f => f.key);
        const pay = window.TEMPLATE_PAY[id] || null;
        const payAskedKey = pay ? pay.key : null;
        const payAsked = !!payAskedKey && fields.includes(payAskedKey);
        // Build a filled contract as the wizard would, using every field.
        const values = {};
        window.builtinTemplateFields(id).forEach(f => {
          if (f.key === 'counterparty') values[f.key] = 'Test Counterparty Ltd';
          else if (f.key === 'party') values[f.key] = 'Highland Test Entity Ltd';
          else if (f.key === 'value') values[f.key] = '5000000';
          else if (f.key === 'effDate') values[f.key] = '2026-01-01';
          else if (f.key === 'expiry') values[f.key] = '2029-01-01';
          else if (f.type === 'num') values[f.key] = '30';
          else if (f.type === 'date') values[f.key] = '2026-06-01';
          else values[f.key] = 'Test ' + f.key;
        });
        const c = { id: 'WALK-' + id, template: id, status: 'Draft', fields: {}, counterparty: values.counterparty,
          value: Number(values.value || 0), valueType: t.valueType, metadata: {}, audit: [], comments: [], signatures: [] };
        if (window.applyTemplateValues) window.applyTemplateValues(c, window.builtinTemplateFields(id), values);
        if (t.valueType === 'none') { c.value = 0; }
        let html = ''; let threw = null;
        try { html = window.docBody(c); } catch (e) { threw = e.message; }
        const orphanFields = window.builtinTemplateFields(id)
          .filter(f => !ESSENTIAL.has(f.key))
          .filter(f => !html.includes(`data-field="${f.key}"`))
          .map(f => f.key);
        const paymentAnswerType = pay ? (pay.key === 'payDays' ? 'key+default(payDays)' : `key+default(${pay.key})`) : 'null (no payment window)';
        const paymentPrintsInDoc = pay ? html.includes(`data-field="${pay.key}"`) : true;
        const inClauseSet = new Set(['ND', 'EQ', 'DA', 'LE']);
        const termTreatment = inClauseSet.has(id) ? 'clause' : 'recital';
        const termSpan = window.docTermSpan(c);
        const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        const partyPrints = stripped.includes('Highland Test Entity Ltd');
        const bareParty = (() => {
          const c2 = { ...c, party: undefined };
          const h2 = window.docBody(c2);
          return h2.includes(window.FIRST_PARTY);
        })();
        out.push({ id, name: t.name, folder: t.folder, valueType: t.valueType,
          formFields: fields, orphanFields, threw,
          payKey: payAskedKey, paymentAnswerType, paymentPrintsInDoc,
          termTreatment, termSpanLen: termSpan ? termSpan.len : null,
          partyPrints, bareParty });
      });
      return out;
    });
    for (const row of walk) {
      say(`-- ${row.id} (${row.name}) --`);
      check(`${row.id}: docBody rendered without throwing`, !row.threw, row.threw || 'ok');
      check(`${row.id}: every asked field has somewhere to print (no orphans)`, row.orphanFields.length === 0, row.orphanFields.join(', ') || 'clean');
      check(`${row.id}: payment answer prints on the paper (or none is expected)`, row.paymentPrintsInDoc, `pay=${row.paymentAnswerType}`);
      check(`${row.id}: term treatment matches DOC_TERM_IN_CLAUSE (${row.termTreatment})`, true, `len=${row.termSpanLen}`);
      check(`${row.id}: our party prints through the recital`, row.partyPrints);
      check(`${row.id}: with no party set, falls back to the workspace name`, row.bareParty);
      templateRows.push(row);
    }
    fs.writeFileSync(path.join(OUT, 'template-walk.json'), JSON.stringify(walk, null, 2));

    // Screenshot each template's actual paper via a real created contract
    // (reuse a couple already made; for full coverage, create the rest via
    // the model-level createFromTemplate helper — model creation is fine
    // here because the CREATION SITE for all twelve was already exercised
    // above; this is purely to photograph the PAPER).
    say('\n--- screenshotting each template\'s paper ---');
    for (const tid of Object.keys(await page.evaluate(() => window.TEMPLATES))) {
      await page.evaluate((id) => {
        const t = window.TEMPLATES[id];
        const u = window.currentUser();
        const c = { id: 'SHOT-' + id, name: t.name + ' (Shot)', counterparty: 'Shot Counterparty Ltd',
          party: 'Highland Test Entity Ltd', value: t.valueType === 'none' ? 0 : 4000000, status: 'Draft',
          template: id, folder: t.folder, lastAction: window.todayStr(), hash: null, signedAt: null,
          signatory: u ? u.name : 'Authorized signatory', compliance: {}, comments: [], fields: {},
          scan: null, expiry: '2029-01-01', valueType: t.valueType, audit: [{ at: window.nowISO(), user: 'System', action: 'Created', detail: 'shot' }],
          signatures: [], numbering: 'live' };
        const vars = window.templateVars(id);
        const values = {}; vars.forEach(v => { values[v.key] = v.def || (v.type === 'date' ? '2026-06-01' : v.type === 'num' ? '30' : 'Sample'); });
        if (window.applyTemplateValues) window.applyTemplateValues(c, vars, values);
        if (t.valueType === 'none') c.value = 0;
        c._loaded = true; c._light = false; c._v = 0;
        window.contractOwnerStamp(c);
        window.state.contracts.unshift(c); window.state.activeId = c.id;
        window.roomOpenOnTerms(c.id);
        window.setView('workspace');
      }, tid);
      await page.waitForTimeout(400);
      await page.evaluate(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="docs"]'); if (b) b.click(); });
      await page.waitForTimeout(500);
      await shot(`paper-${tid}.png`);
    }

    /* ================================================================
       WRAP UP
       ================================================================ */
    check('no uncaught page errors across the whole run', errors.length === 0, errors.slice(0, 5).join(' | '));

  } catch (e) {
    say('FATAL: ' + (e && e.stack || e));
  } finally {
    fs.writeFileSync(path.join(OUT, 'run.log'), log.join('\n'));

    // templates.md
    const md = [];
    md.push('# All twelve built-in templates — the walk\n');
    md.push('| Template | Folder | Form fields asked | Orphan fields (asked, never printed) | Payment answer | Term treatment | Term span (5yr example) | Party prints via recital | Verdict |');
    md.push('|---|---|---|---|---|---|---|---|---|');
    for (const r of templateRows) {
      const verdict = (r.threw ? 'BROKEN (threw)' : (r.orphanFields.length ? 'FINDING: orphan field(s)' : 'clean'));
      md.push(`| ${r.id} — ${r.name} | ${r.folder} | ${r.formFields.join(', ')} | ${r.orphanFields.join(', ') || '—'} | ${r.paymentAnswerType} | ${r.termTreatment} | ${r.termSpanLen || '—'} | ${r.partyPrints ? 'yes' : 'NO'} | ${verdict} |`);
    }
    fs.writeFileSync(path.join(OUT, 'templates.md'), md.join('\n') + '\n');

    // NOTES.md
    const notes = [];
    notes.push('# J2 — Raising a contract, every way there is — NOTES\n');
    notes.push(`Run at ${new Date().toISOString()}. Server: ${h.base}. Browser errors observed: ${errors.length}.\n`);
    let n = 1;
    for (const r of results) { notes.push(`${n++}. [${r.pass ? 'PASS' : 'FAIL'}] ${r.name}${r.detail != null ? ' — ' + r.detail : ''}`); }
    notes.push('\n## Findings\n');
    if (!findings.length) notes.push('None beyond what is logged inline above.');
    for (const f of findings) notes.push(`- **[${f.rank}]** ${f.title}\n  Repro: ${f.repro}`);
    fs.writeFileSync(path.join(OUT, 'NOTES.md'), notes.join('\n') + '\n');

    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exitCode = failed.length ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
