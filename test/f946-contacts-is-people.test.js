/* f946 — "CONTACTS" IS PEOPLE, NEVER CONTRACTS (owner, 27 Oct 2026: "when i type contacts in the jambo or take me to
   contacts, it instead takes me to contracts")

   Two readers took the word the wrong way:
     1 · the free readers (the Overview tab): "take me to contacts" asked the contract-name search first, and its
         forgiving match found a contract whose title says "Contracts" — a page's own word is now never part of a name
     2 · the AI (the Jambo tab): its list of places named People by its key alone, so "contacts" read as a slip for
         "contracts" — every place now carries the map's own everyday words (JM_TASKS), and the rule says a word on a
         place's list is that place, never a misspelling of another
   At the parent both fail.

   Run: node --test test/f946-contacts-is-people.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function stage(){
  const contracts = [{ id: 'MK-7', contractNo: 'MK-7', name: 'Master Contracts Framework', status: 'Under Review', counterparty: 'Juno Logistics' },
    { id: 'MK-8', contractNo: 'MK-8', name: 'Cold Chain Haulage', status: 'Signed', counterparty: 'Kabras Sugar' }];
  const ctx = { intel: { paper: null, history: [] } };
  Object.assign(ctx, {
    getContract: id => contracts.find(c => c.id === id) || null, contractRef: c => c.contractNo || c.id,
    getUsers: () => [], currentUser: () => ({ id: 'u1', name: 'Amina' }), isAdmin: () => true,
    state: { contracts, view: 'dashboard', settings: {} },
    i18t: k => k, setTimeout: () => 0, localStorage: { getItem: () => null, setItem: () => {} },
    needsYouOf: () => [], igHomePaperFace: () => false, igPaperUp: () => false,
    hbParse: () => null, hbS: () => ({ face: 'board' }), hbFace: () => 'board',
    FOLDERS: {}, STREAM_SHORT: {}, api: () => Promise.resolve({}), fetch: () => Promise.resolve({}),
  });
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(R('vendor/minisearch-7.2.0.umd.js'), ctx);
  vm.runInContext(R('js/copilotacts.js'), ctx);
  vm.runInContext(R('js/jambomap.js'), ctx);
  return ctx;
}

describe('f946 (1) the free readers: a page\'s own word is never part of a contract\'s name', () => {
  const C = stage();
  test('"take me to contacts" opens People, not a contract whose title says Contracts', () => {
    assert.equal(C.caContractOf('take me to contacts'), null);
    const u = C.caUnderstand('take me to contacts', { box: 'home' });
    assert.ok(u && u.kind === 'go' && u.place === 'people', JSON.stringify(u));
  });
  test('a page word is dropped from the name search; a real name still finds its contract', () => {
    assert.ok(!C.caFindTerms('take me to contacts').includes('contacts'));
    const hit = C.caContractOf('open the cold chain haulage');
    assert.ok(hit && hit.c && hit.c.id === 'MK-8', JSON.stringify(hit && hit.c));
  });
});

describe('f946 (2) the AI: each place with the words people use for it', () => {
  const SRV = R('server/server.js');
  const say = (() => {
    const i = SRV.indexOf('const JM_TASKS_SRC'), j = SRV.indexOf('const aiNavigateOn');
    const k = SRV.indexOf('const JM_TASK_NOTE'), e = SRV.indexOf('\n', SRV.indexOf('const JM_TASK_SAYS'));
    assert.ok(i > 0 && j > i && k > 0 && e > k, 'the place list is built on the server');
    const code = (SRV.slice(i, j) + SRV.slice(k, e)).replace(/^const /gm, 'var ');
    return new Function('fs', 'path', '__dirname', code + ';return { says: JM_TASK_SAYS, keys: JM_TASK_KEYS }')(fs, path, path.join(ROOT, 'server'));
  })();
  test('People is listed with "contacts", Contracts with its own words, every key once', () => {
    assert.match(say.says, /(^|; )people \(colleagues, contacts,/);
    assert.match(say.says, /(^|; )contracts \(contracts, agreements/);
    assert.equal(say.says.split('; ').length, say.keys.length);
    assert.ok(!/\(\s*,|,\s*,|, \)/.test(say.says), 'no empty word in the list');
  });
  test('the task\'s description carries the list and the rule against reading a word as a slip', () => {
    assert.ok(SRV.includes("never a misspelling of another place\\'s word (\"contacts\" is people, not contracts): ' + JM_TASK_SAYS"));
  });
});
