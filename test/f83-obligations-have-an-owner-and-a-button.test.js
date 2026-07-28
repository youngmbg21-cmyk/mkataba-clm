/* ============================================================
   F83 — an obligation says whose it is, and can be ticked off where you see it
   ============================================================
   Three faults in the same corner of the product, and together they made the
   obligation tracker a place you file things rather than a place you work.

   ONE — THERE WAS NO WAY TO SAY IT WAS THEIRS. A contract's obligations are
   almost never all one side's: we pay within thirty days, they deliver monthly
   and keep insurance current. The record had one field for this, `assignee`,
   and the form offered a list of people in THIS workspace. So every count in
   the product counted both kinds together, and "six due this month" could not
   be read — six jobs for our team, or six things to chase them about? Those are
   different mornings.

   TWO — THEY COULD ONLY BE HANDLED FROM INSIDE A CONTRACT. Ticking one off
   meant opening the contract, scrolling to its Obligations panel and pressing
   there. The calendar — the screen somebody opens to ask "what is due this
   month" — drew them and offered no verb at all, because the whole agenda row
   was a single <button> and there is nowhere to put a second control inside
   one. The dashboard did not mention obligations anywhere.

   THREE — AND THEY WENT READ-ONLY THE MOMENT THE DEAL WAS SIGNED. The panel
   read `canEdit() && c.status !== 'Signed'`, so every control vanished on
   exactly the contracts whose obligations are live. The quarterly report is due
   in the quarter AFTER signature. The 'Signed' guard belongs to the document —
   sealed wording does not move — and nothing in this panel touches the wording.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews } = require('./dom');

const day = n => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ob = (over = {}) => ({ id: 'ob_1', desc: 'Quarterly volume report', due: day(10),
  recurring: 'quarterly', assignee: 'Wanjiku Kamau', status: 'open', quote: '', ...over });

function contract(over = {}) {
  return { id: 'MK-1', name: 'Raw Material Supply', counterparty: 'Kabras Sugar',
    folder: 'proc', status: 'Under Review', value: 4800000, valueType: 'standard',
    template: 'RM', expiry: day(300), fields: {}, metadata: {}, audit: [], comments: [],
    signatures: [], obligations: [ob()], rounds: [], versions: [], ...over };
}

function world(files, over = {}) {
  const audit = [], toasts = [];
  const contracts = over.contracts || [contract()];
  const sb = loadViews(['js/obligations.js'].concat(files || []), {
    state: { contracts, settings: {}, view: over.view || 'dashboard' },
    getContract: id => contracts.find(c => c.id === id),
    canEdit: () => over.canEdit !== false,
    currentUser: () => ({ id: 'u1', name: 'Amina Otieno', role: 'admin' }),
    getUsers: () => [{ name: 'Wanjiku Kamau' }, { name: 'Amina Otieno' }],
    daysUntil: iso => Math.ceil((new Date(iso + 'T00:00:00') - Date.now()) / 86400000),
    effectiveExpiry: c => c.expiry || null,
    renewalDecisionDate: () => null,
    persist() {}, closeModal() {}, openModal() {}, nowISO: () => '2026-07-28T09:00:00.000Z',
    logAudit: (_c, action, detail) => audit.push({ action, detail }),
    toast: m => toasts.push(String(m)),
    selectContract() {}, setView() {}, setActiveNav() {},
    _audit: audit, _toasts: toasts,
    ...(over.globals || {}),
  });
  return sb;
}

describe('F83 — an obligation knows which side owes it', () => {
  test('one filed before this existed reads as ours', () => {
    const w = world();
    assert.equal(w.obligationParty(ob()), 'ours',
      'every historical obligation was flipped to the counterparty by the upgrade');
    assert.equal(w.obligationIsTheirs(ob()), false);
  });

  test('and one marked theirs reads as theirs', () => {
    const w = world();
    assert.equal(w.obligationIsTheirs(ob({ party: 'theirs' })), true);
  });

  test('the owner is a colleague on our side and the company on theirs', () => {
    const w = world(), c = contract();
    assert.equal(w.obligationOwner(ob(), c), 'Wanjiku Kamau');
    assert.equal(w.obligationOwner(ob({ party: 'theirs' }), c), 'Kabras Sugar');
  });

  test('and says "unassigned" rather than nothing when nobody has it', () => {
    const w = world();
    assert.equal(w.obligationOwner(ob({ assignee: '' }), contract()), 'unassigned');
  });

  test('the two sides can be counted apart', () => {
    const w = world();
    const list = [ob({ id: 'a' }), ob({ id: 'b', party: 'theirs' }), ob({ id: 'c' })];
    assert.equal(w.obligationsOurs(list).length, 2);
    assert.equal(w.obligationsTheirs(list).length, 1);
  });
});

describe('F83 — the workspace panel', () => {
  const render = over => {
    const w = world([], over);
    w.document.getElementById('obligations-section');
    w.renderObligationsSection((over && over.contracts ? over.contracts[0] : null) || w.state.contracts[0]);
    return w.document.getElementById('obligations-section').innerHTML;
  };

  test('a signed contract keeps its obligation controls', () => {
    const html = render({ contracts: [contract({ status: 'Signed' })] });
    assert.match(html, /Add obligation/,
      'obligations went read-only on exactly the contracts whose obligations are live');
    assert.match(html, /data-ob-toggle/, 'nothing could be ticked off after signature');
  });

  test('a viewer still cannot change anything', () => {
    const html = render({ canEdit: false });
    assert.ok(!/data-ob-toggle/.test(html));
    assert.ok(!/Add obligation/.test(html));
  });

  test('each row says whose it is', () => {
    const html = render({ contracts: [contract({ obligations: [ob({ party: 'theirs' })] })] });
    assert.match(html, /theirs/i);
    assert.match(html, /Kabras Sugar/, 'a "theirs" row named nobody at all');
  });

  test('and an ours row names the colleague, not the counterparty', () => {
    const html = render();
    assert.match(html, /Wanjiku Kamau/);
  });
});

describe('F83 — completing one is a verb, not an inline handler', () => {
  test('it can be done by id from anywhere', () => {
    const w = world();
    const o = w.toggleObligationById('MK-1', 'ob_1', { from: 'calendar' });
    assert.ok(o, 'the shared verb could not find the obligation');
    assert.equal(o.status, 'done');
    assert.ok(w._audit.some(a => /Completed/.test(a.detail)), 'nothing was written to the trail');
    assert.ok(w._audit.some(a => /from the calendar/.test(a.detail)),
      'the trail should say where it was pressed');
  });

  test('pressing again reopens it', () => {
    const w = world();
    w.toggleObligationById('MK-1', 'ob_1');
    assert.equal(w.toggleObligationById('MK-1', 'ob_1').status, 'open');
  });

  test('a viewer cannot', () => {
    const w = world([], { canEdit: false });
    assert.equal(w.toggleObligationById('MK-1', 'ob_1'), null);
    assert.equal(w.state.contracts[0].obligations[0].status, 'open');
  });

  test('an obligation that has since been removed is refused, not guessed at', () => {
    const w = world();
    assert.equal(w.toggleObligationById('MK-1', 'ob_gone'), null);
    assert.match(w._toasts.join(' '), /no longer on the contract/i);
  });

  test('the trail records the side that owed it', () => {
    const w = world([], { contracts: [contract({ obligations: [ob({ party: 'theirs' })] })] });
    w.toggleObligationById('MK-1', 'ob_1');
    assert.match(w._audit.map(a => a.detail).join(' '), /Kabras Sugar/);
  });
});

describe('F83 — the calendar can act on what it draws', () => {
  const agenda = over => {
    const w = world(['js/views/calendar.js'], over);
    w.renderCalendar();
    const html = w.document.getElementById('content').innerHTML;
    return { w, rows: html.slice(html.indexOf('Next 60 days')) };
  };

  test('an obligation row carries a Done button', () => {
    const { rows } = agenda();
    assert.match(rows, /data-ob-done="ob_1"/,
      'the calendar drew the obligation and offered no way to act on it');
    assert.match(rows, /data-ob-cid="MK-1"/);
  });

  test('an expiry row does not — a date is not a task', () => {
    const { rows } = agenda({ contracts: [contract({ obligations: [], expiry: day(20) })] });
    assert.ok(!/data-ob-done/.test(rows));
  });

  test('a theirs row is marked as something to chase', () => {
    const { rows } = agenda({ contracts: [contract({ obligations: [ob({ party: 'theirs' })] })] });
    assert.match(rows, /theirs/i);
    assert.match(rows, /Kabras Sugar/);
  });

  test('a viewer gets no button', () => {
    const { rows } = agenda({ canEdit: false });
    assert.ok(!/data-ob-done/.test(rows));
  });

  test('the row is no longer one big button, so the two controls can coexist', () => {
    // the Done control has to sit OUTSIDE the row's own button: a button nested
    // inside a button is not something any browser will honour, and it is why
    // this screen could never carry a second control
    const { rows } = agenda();
    const open = rows.indexOf('data-sel="MK-1"');
    assert.ok(open > -1, 'the row lost its link into the contract');
    const inner = rows.slice(open, rows.indexOf('</button>', open));
    assert.ok(!inner.includes('<button'), 'the Done control is nested inside the row button');
  });
});

describe('F83 — the dashboard shows what the parties owe each other', () => {
  const dash = over => {
    const w = world(['js/views/home.js'], { view: 'dashboard', ...over,
      globals: { agreementsIn: cs => cs.filter(c => !c.parentId),
        contractRisk: () => 20, openFindings: () => [], deviationSummary: () => null,
        cKind: () => 'Contract', approvalState: () => ({ required: false, ok: true, chain: [] }),
        contractExpired: () => false, lsGet: () => null, lsSet() {},
        ...((over && over.globals) || {}) } });
    w.renderDashboard();
    const html = w.document.getElementById('content').innerHTML;
    return { w, panel: html.slice(html.indexOf('Obligations · next 45 days')) };
  };

  test('there is an obligations panel at all', () => {
    const { w } = dash();
    assert.match(w.document.getElementById('content').innerHTML, /Obligations · next 45 days/,
      'the dashboard never mentioned obligations anywhere');
  });

  test('ours and theirs are counted apart', () => {
    const { panel } = dash({ contracts: [contract({ obligations: [
      ob({ id: 'a', desc: 'Pay the invoice' }),
      ob({ id: 'b', desc: 'Deliver the tonnage', party: 'theirs' }) ] })] });
    const ours = panel.indexOf('Ours to do'), theirs = panel.indexOf('Theirs to chase');
    assert.ok(ours > -1 && theirs > ours, 'the two jobs are not the same job');
    assert.match(panel.slice(ours, theirs), /Pay the invoice/);
    assert.match(panel.slice(theirs), /Deliver the tonnage/);
  });

  test('overdue is called out', () => {
    const { panel } = dash({ contracts: [contract({ obligations: [ob({ due: day(-5) })] })] });
    assert.match(panel, /1 overdue/);
  });

  test('nothing overdue says so plainly', () => {
    const { panel } = dash();
    assert.match(panel, /nothing overdue/i);
  });

  test('each row can be ticked off from here too', () => {
    const { panel } = dash();
    assert.match(panel, /data-ob-done="ob_1"/);
  });

  test('a completed obligation drops out of the panel', () => {
    const { panel } = dash({ contracts: [contract({ obligations: [ob({ status: 'done' })] })] });
    assert.ok(!/Quarterly volume report/.test(panel), 'finished work is not a to-do list');
  });

  test('a declined contract owes nothing', () => {
    const { panel } = dash({ contracts: [contract({ status: 'Declined' })] });
    assert.ok(!/Quarterly volume report/.test(panel));
  });
});
