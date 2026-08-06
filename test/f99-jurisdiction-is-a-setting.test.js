/* ============================================================
   F99 — the market is a setting, not a sentence
   ============================================================
   The product asserted Kenya in about ninety places and none of them was a
   configuration: the Copilot was told "you are helping negotiate a contract
   governed by Kenyan law" on every rewrite, money formatted as KES, the
   executed copy and the evidence pack cited the Business Laws (Amendment) Act
   2020, the scanner asked whether a lease had been stamped under Cap 480, and
   the playbook's governing-law position was "Kenyan law & forum".

   A pilot outside Kenya would have been advised to negotiate for Kenyan courts,
   shown shillings, and told its signatures rested on a Kenyan Act — every one
   of those wrong in the same way, and none of them saying so. There was even a
   Jurisdiction switcher in the header already, which set a data attribute and
   raised a toast claiming the workspace had moved while nothing behind it did.

   What this file pins:

     · NOTHING MOVED FOR AN EXISTING WORKSPACE. Kenya is still the default, so a
       workspace that never touches the setting behaves exactly as it did. That
       is the whole reason the default was not changed in the same breath.

     · SWITCHING MOVES ALL OF IT TOGETHER — money, the law named to the model,
       the statute on the executed copy, the playbook position. A setting that
       moves half the app is the switcher that was already there.

     · "FOREIGN" IS RELATIVE. It used to mean "not Kenya" and now means "not
       home", so Kenyan law is foreign paper to a Stockholm workspace and
       Swedish law is foreign paper to a Nairobi one. This is the subtle half:
       it is the same code path reading a different pack.

     · A PACK WITH NOTHING TO SAY SAYS NOTHING. Sweden levies no stamp duty on
       an ordinary commercial lease, so that check does not run — rather than
       running with the statute name blanked out, which would read as advice
       nobody wrote.

     · AND THE SERVER READS THE SAME TABLE. server/server.js briefs the same
       model from its own process; a second copy of the market's name, money and
       statutes would drift the first time either moved. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* js/jurisdiction.js with a real little store behind it, so jxSet actually
   sticks and the reads that follow are reading what was written. */
function loadJx(){
  const store = {};
  const sandbox = { console, JSON, Object, String, Number, Array, Boolean, Math, Error,
    lsGet: k => (k in store ? store[k] : null), lsSet: (k, v) => { store[k] = v; },
    getOrg: () => null };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('js/jurisdiction.js'), sandbox, { filename: 'jurisdiction.js' });
  return sandbox;
}
/* ai.js on the same stage as the pack, the order js/app.js loads them. */
function loadAi(){
  const store = {};
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; },
    querySelector(){ return null; }, innerHTML: '', value: '', style: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    focus(){}, setSelectionRange(){}, getBoundingClientRect(){ return { width: 430 }; } });
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null,
      querySelectorAll: () => [], addEventListener(){}, createElement: () => el(),
      body: { classList: { toggle(){} } } },
    state: { contracts: [], view: '' }, icon: () => '', esc: s => String(s),
    toast(){}, getContract(){ return null; }, currentUser(){ return { name: 'You' }; },
    API_MODE(){ return false; }, innerWidth: 1400, addEventListener(){},
    lsGet: k => (k in store ? store[k] : null), lsSet: (k, v) => { store[k] = v; },
    getOrg: () => null,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ['js/jurisdiction.js', 'js/ai.js'])
    vm.runInContext(read(f), sandbox, { filename: f });
  return sandbox;
}

/* ============================================================ */
describe('F99a — an existing workspace does not move', () => {
  test('the default is Kenya, so nothing switches under anybody', () => {
    const j = loadJx();
    assert.equal(j.jxId(), 'kenya');
    assert.equal(j.jxCurrency(), 'KES');
    assert.equal(j.jxLaw(), 'Kenyan law');
    assert.match(j.jxEsignature(), /Business Laws \(Amendment\) Act 2020/);
  });

  test('money reads exactly as it did', () => {
    const j = loadJx();
    assert.equal(j.fmtMoney(48000000), 'KES ' + (48000000).toLocaleString('en-KE'));
    assert.equal(j.fmtMoneyShort(48000000), 'KES 48M');
    assert.equal(j.fmtMoneyShort(4800), 'KES 5K');
  });

  test('an unknown id falls back rather than blanking the market out', () => {
    /* A stored value from a pack that was removed, or a typo in a seed script,
       must not leave the app formatting money as "undefined 5,000". */
    const j = loadJx();
    assert.equal(j.jxPack('atlantis').id, 'kenya');
    assert.equal(j.jxSet('atlantis'), false, 'and it is not accepted in the first place');
    assert.equal(j.jxId(), 'kenya');
  });
});

/* ============================================================ */
describe('F99b — switching moves all of it at once', () => {
  test('money, law, e-signature and playbook label follow the setting', () => {
    const j = loadJx();
    assert.equal(j.jxSet('sweden'), true);
    assert.equal(j.jxId(), 'sweden');
    assert.equal(j.jxCurrency(), 'SEK');
    assert.equal(j.fmtMoneyShort(48000000), 'SEK 48M');
    assert.equal(j.jxLaw(), 'Swedish law');
    assert.equal(j.jxName(), 'Sweden');
    assert.match(j.jxEsignature(), /910\/2014/, 'eIDAS, not a Kenyan Act');
    assert.doesNotMatch(j.jxEsignature(), /Kenya/);
    assert.equal(j.jxPlaybookLabel(), 'Swedish-practice');
  });

  test('the preferred governing-law wording is drafted for the market', () => {
    const j = loadJx();
    j.jxSet('sweden');
    assert.match(j.jxPreferredLaw(), /laws of Sweden/);
    assert.match(j.jxPreferredLaw(), /Stockholm Chamber of Commerce/);
    assert.doesNotMatch(j.jxPreferredLaw(), /Nairobi/);
  });

  test('and it survives a reload, because it is stored not remembered', () => {
    /* Written through lsSet; a fresh read of the same store must find it. */
    const j = loadJx();
    j.jxSet('sweden');
    assert.equal(j.lsGet(j.JX_LS), 'sweden');
  });
});

/* ============================================================ */
describe('F99c — "foreign" means "not here"', () => {
  test('Kenyan law is foreign paper to a Swedish workspace', () => {
    const j = loadJx();
    j.jxSet('sweden');
    assert.ok(j.jxForeignMarkers().includes('kenya'));
    assert.ok(!j.jxForeignMarkers().includes('sweden'), 'and home never is');
    assert.equal(j.jxNamesHome('governed by the laws of Sweden'), true);
    assert.equal(j.jxNamesHome('governed by the laws of Kenya'), false);
  });

  test('and the mirror holds — Swedish law is foreign to a Kenyan workspace', () => {
    const j = loadJx();
    assert.ok(j.jxForeignMarkers().includes('sweden'));
    assert.ok(!j.jxForeignMarkers().includes('kenya'));
    assert.equal(j.jxNamesHome('the exclusive jurisdiction of the courts at Nairobi'), true);
  });

  test('the standing seats are foreign to everybody', () => {
    const j = loadJx();
    for (const id of ['kenya', 'sweden']){
      j.jxSet(id);
      const m = j.jxForeignMarkers();
      for (const seat of ['london', 'delaware', 'singapore', 'dubai'])
        assert.ok(m.includes(seat), `${seat} is foreign to ${id}`);
    }
  });

  test('no marker is listed twice, or a finding would report the same seat twice', () => {
    const j = loadJx();
    const m = j.jxForeignMarkers();
    assert.equal(new Set(m).size, m.length);
  });
});

/* ============================================================ */
describe('F99d — what the Copilot is told', () => {
  const sent = async (ai, opts) => {
    let seen = '';
    ai.window.copilotAsk = async msgs => { seen = msgs[0].content; return '{"advice":"a","proposedText":"b"}'; };
    await ai.copilotPropose(Object.assign({ ask: 'Rewrite.', passage: 'x' }, opts || {}));
    return seen;
  };

  test('THE FIX: the governing law in the prompt follows the workspace', async () => {
    const ai = loadAi();
    assert.match(await sent(ai), /governed by Kenyan law/);
    ai.jxSet('sweden');
    const s = await sent(ai);
    assert.match(s, /governed by Swedish law/);
    assert.doesNotMatch(s, /Kenyan/, 'a Swedish pilot is not drafting under Kenyan law');
  });

  test('a caller that knows the contract\'s own law still overrides it', () => {
    /* The `law` option was always there and nothing ever passed it. It still
       wins where it is passed — a contract governed by somewhere else is not
       redrafted under the workspace's market. */
    const ai = loadAi();
    return sent(ai, { law: 'English law' }).then(s => {
      assert.match(s, /governed by English law/);
    });
  });

  test('the ground rules name the market, and are re-read rather than frozen', () => {
    const ai = loadAi();
    assert.equal(typeof ai.AI_GROUND_RULES, 'function',
      'THE FIX: a const string would keep saying Kenya for the rest of the session');
    assert.match(ai.AI_GROUND_RULES(), /operates in Kenya/);
    assert.match(ai.AI_GROUND_RULES(), /contracts are in KES/);
    ai.jxSet('sweden');
    assert.match(ai.AI_GROUND_RULES(), /operates in Sweden/);
    assert.match(ai.AI_GROUND_RULES(), /contracts are in SEK/);
  });

  test('no prompt path still hard-codes the market', () => {
    /* A source-level guard, because this is the failure that reappears: the
       next prompt somebody writes is the one that says "Kenyan law" again.

       js/views/contract.js is deliberately NOT in this list — it holds the
       twelve built-in template papers, whose CLAUSE BODIES are Kenyan by
       agreement. That is content a Swedish workspace ignores or replaces, not
       configuration; a guard over it would fail on the one thing here that is
       supposed to name a market. */
    for (const f of ['js/ai.js', 'js/views/negotiation.js',
      'js/playbook.js', 'js/core.js', 'js/views/portal.js', 'server/server.js']){
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      assert.doesNotMatch(src, /Kenyan law/, `${f} still names a market in code`);
      assert.doesNotMatch(src, /Kenyan Shillings/, `${f} still names a currency in code`);
      /* Statutes are the same failure wearing a citation. These are the ones
         that were live in the product's own copy, as opposed to a template. */
      assert.doesNotMatch(src, /Business Laws \(Amendment\)/,
        `${f} still cites an e-signature statute in code`);
      assert.doesNotMatch(src, /Cap 480/, `${f} still cites a stamp-duty statute in code`);
    }
  });
});

/* ============================================================ */
describe('F99g — a claim a market cannot support is not made', () => {
  /* The statute citations reached the user through three more doors than the
     scanner: the signing consent box, the intent-to-sign finding, and the
     playbook's own lease position. Each asserted a Kenyan Act to whoever was
     reading, whatever market they were in. */
  const loadPlaybook = (jurisdiction) => {
    const store = {};
    const sandbox = { console, JSON, Object, String, Number, Array, Boolean, Math, Error, RegExp, Set, Map,
      document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
      lsGet: k => (k in store ? store[k] : null), lsSet: (k, v) => { store[k] = v; },
      getOrg: () => ({ name: 'Pilot', jurisdiction }), state: { contracts: [] },
      esc: x => String(x), icon: () => '', toast(){}, saveSettings(){}, currentUser: () => ({ name: 'You' }) };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    for (const f of ['js/jurisdiction.js', 'js/playbook.js'])
      vm.runInContext(read(f), sandbox, { filename: f });
    return sandbox;
  };

  test('the lease playbook drops the stamp-duty position where there is no such duty', () => {
    const ke = loadPlaybook('kenya');
    const kePos = ke.DEFAULT_PLAYBOOK.lease.positions;
    assert.equal(kePos.length, 1);
    assert.match(kePos[0].note, /Cap 480/, 'Kenya still gets the citation it always had');

    const se = loadPlaybook('sweden');
    assert.equal(se.DEFAULT_PLAYBOOK.lease.positions.length, 0,
      'THE FIX: no position beats one citing a statute that does not apply');
  });

  test('the governing-law position and its wording follow the market', () => {
    const se = loadPlaybook('sweden');
    const cl = se.DEFAULT_CLAUSE_LIBRARY.find(x => x.id === 'cl-law');
    assert.match(cl.name, /^Swedish governing law/);
    assert.match(cl.preferred, /laws of Sweden/);
    assert.doesNotMatch(cl.guidance, /Kenya/);
  });

  test('the quality position names a standards body only where the pack has one', () => {
    assert.match(loadPlaybook('kenya').DEFAULT_PLAYBOOK.supply.positions[0].note, /KEBS/);
    assert.doesNotMatch(loadPlaybook('sweden').DEFAULT_PLAYBOOK.supply.positions[0].note, /KEBS/);
  });

  test('the signing consent box cites the market\'s own e-signature basis', () => {
    /* Read from source: this is one line of markup deep inside the workspace
       screen, and what matters is that it interpolates rather than asserts. */
    const src = read('js/views/contract.js');
    /* The LABEL is a dictionary key now (the signer reads it in their own
       language); the statute beside it still has to be interpolated from the
       market pack rather than asserted. */
    assert.match(src, /ct_intend_to_sign[\s\S]{0,220}\$\{jxEsignature\(\)\}/,
      'the consent a signer gives must name the law they are giving it under');
  });
});

/* ============================================================ */
describe('F99e — the scanner reads the pack', () => {
  const LEASE = 'This Lease is made between the parties. The Landlord shall give the Tenant quiet '
    + 'enjoyment. This Agreement is governed by the laws of Kenya and the parties submit to the '
    + 'exclusive jurisdiction of the courts of Kenya. The Tenant shall pay rent within 30 days.';

  const scan = (jurisdiction, text) => {
    const w = loadViews(['js/views/contract.js'], {
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      getOrg: () => ({ name: 'Test', jurisdiction }),
    });
    return w.findingsFromText({ id: 'MK-1', folder: 'proc', template: 'RM' }, text);
  };
  const byId = (f, id) => f.find(x => x.id === id);

  test('a Kenyan-law lease is unremarkable in a Kenyan workspace', () => {
    const law = byId(scan('kenya', LEASE), 't-law');
    assert.match(law.title, /Governing law: Kenya/);
    assert.equal(law.sev, 'low');
  });

  test('THE FIX: the same lease is foreign paper in a Swedish workspace', () => {
    const law = byId(scan('sweden', LEASE), 't-law');
    assert.match(law.title, /Foreign governing law/);
    assert.equal(law.sev, 'high');
    assert.match(law.fix, /Swedish governing law/,
      'and it advises negotiating toward home, whichever home that is');
  });

  test('the stamp-duty check runs where there is a stamp duty', () => {
    const f = byId(scan('kenya', LEASE), 't-stamp');
    assert.ok(f, 'a Kenyan lease with no stamping provision is still flagged');
    assert.match(f.why, /Cap 480/);
  });

  test('and stays silent where there is none, rather than firing with a blank in it', () => {
    assert.equal(byId(scan('sweden', LEASE), 't-stamp'), undefined,
      'Sweden levies none on a commercial lease — an empty statute name reads as advice');
  });

  test('the data-protection finding names the regime the workspace is under', () => {
    const corp = c => {
      const w = loadViews(['js/views/contract.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
        getOrg: () => ({ name: 'Test', jurisdiction: c }) });
      return w.findingsFromText({ id: 'MK-2', folder: 'corp', template: 'RM' },
        'This Agreement is governed by the laws of Sweden. Services are provided as ordered.');
    };
    assert.match(byId(corp('kenya'), 't-dp').why, /Data Protection Act 2019/);
    assert.match(byId(corp('sweden'), 't-dp').why, /GDPR/);
  });
});

/* ============================================================ */
describe('F99f — one table, two hosts', () => {
  test('the server requires the same module rather than keeping a copy', () => {
    const src = read('server/server.js');
    assert.match(src, /require\('\.\.\/js\/jurisdiction\.js'\)/,
      'THE FIX: a second table drifts from this one the first time either moves');
  });

  test('and it loads in a plain Node process, window or no window', () => {
    const mod = require('../js/jurisdiction.js');
    assert.equal(typeof mod.jxPack, 'function');
    assert.equal(mod.jxPack('sweden').currency, 'SEK');
    assert.equal(mod.jxPack('kenya').currency, 'KES');
  });

  test('every pack answers every question the app asks of it', () => {
    /* A pack missing a field does not fail loudly; it renders "undefined" into
       a contract screen. The optional two are optional by design — null means
       "this market has no such thing" and the caller skips the check. */
    const mod = require('../js/jurisdiction.js');
    const required = ['id', 'name', 'adjective', 'markers', 'currency', 'locale', 'forum',
      'arbitration', 'esignature', 'esignatureShort', 'dataProtection',
      'dataProtectionRegulator', 'playbookLabel', 'sampleLabel'];
    for (const pack of Object.values(mod.JURISDICTIONS)){
      for (const k of required)
        assert.ok(pack[k] != null && pack[k] !== '', `${pack.id} is missing ${k}`);
      assert.ok(Array.isArray(pack.markers) && pack.markers.length, `${pack.id} names itself`);
      assert.ok('stampDuty' in pack && 'standardsBody' in pack,
        `${pack.id} answers the optional two explicitly, even if the answer is null`);
    }
  });

  test('the header switcher is wired to the record, not to a data attribute', () => {
    /* It existed and did nothing but raise a toast claiming the workspace had
       moved. A control that reports a change it did not make is worse than no
       control, because the reader believes it. */
    const src = read('js/app.js');
    assert.match(src, /jxSet\(REGIONS\[code\]\.id\)/);
    assert.match(src, /regionCodeFor\(window\.jxId/,
      'and it opens on the stored jurisdiction rather than this browser\'s last key');
  });
});
