/* THE SEND LEADS WHEN SENDING IS THE NEXT STEP (13 Oct 2026, phase 1 item 5
   of the best-in-class plan; the owner's pick: fill Share, outline Draft new
   agreement). shareLeadsHead is the ONE reading both shells ask: the room's
   head (roomHeadHtml, and roomHeadRefresh's class flip) and the phone's
   action bar. It is true only where the ladder (wsNextAction) says the
   contract is waiting to go out, and false everywhere else, so a head still
   carries one filled act. What a person sees is driven by
   test/chromium/send-leads-verify.js.

   Run: node --test --test-reporter=dot test/send-leads.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
const MOB = fs.readFileSync(path.join(__dirname, '..', 'js', 'mobile-contract.js'), 'utf8');

describe('the reading: which rungs mean "send it"', () => {
  const w = buildWorld({ contractView: true });
  const { win } = w;
  const c = s => ({ id: 'X', status: s });
  test('a draft waiting on its readings, or on "move it into review", leads with the send', () => {
    assert.equal(win.shareLeadsHead(c('Draft'), { kind: 'checks', noButton: true }), true);
    assert.equal(win.shareLeadsHead(c('Draft'), { kind: 'review' }), true);
  });
  test('a contract in review whose approval is still open leads with the send', () => {
    assert.equal(win.shareLeadsHead(c('Under Review'), { kind: 'share', noButton: true }), true);
  });
  test('every other rung keeps its own act: details owed, a round to answer, signers, a signature, the evidence pack', () => {
    for (const kind of ['terms', 'review-changes', 'add-signers', 'sign', 'issue-signing', 'evidence', 'sign-approval', 'ho-hand', 'ho-file'])
      assert.equal(win.shareLeadsHead(c('Draft'), { kind }), false, kind);
  });
  test('a signed or declined contract never leads with the send, whatever the rung', () => {
    assert.equal(win.shareLeadsHead(c('Signed'), { kind: 'review' }), false);
    assert.equal(win.shareLeadsHead(c('Declined'), { kind: 'checks' }), false);
  });
  test('no rung, no lead', () => {
    assert.equal(win.shareLeadsHead(c('Draft'), null), false);
    assert.equal(win.shareLeadsHead(null, { kind: 'checks' }), false);
  });
});

describe('both shells draw it from that one reading', () => {
  test('the room head fills Share from it, and the next act steps down to an outline beside it', () => {
    assert.match(SRC, /sendLeads=!locked&&may&&c\.status!=='Declined'&&shareLeadsHead\(c,na\);/);
    assert.match(SRC, /<button id="ws-share" class="ui-btn\$\{sendLeads\?' ui-btn-primary':''\}"/);
    assert.match(SRC, /<button id="ws-next-action" data-na="\$\{na\.kind\}" class="ui-btn\$\{sendLeads\?'':' ui-btn-primary'\}">/);
  });
  test('only a head that owns its primary carries the marker the refresh flips', () => {
    assert.match(SRC, /\$\{opts\.primary===undefined\?` data-send-lead="\$\{sendLeads\?1:0\}"`:''\}/);
    assert.match(SRC, /const sh=head\.querySelector\('#ws-share\[data-send-lead\]'\);/);
  });
  test('the phone asks the same function, and its one button is the send', () => {
    assert.match(MOB, /const sendLeads = !viewer && typeof window\.shareLeadsHead==='function' && shareLeadsHead\(c, na\);/);
    assert.match(MOB, /data-m-na="share">\$\{mEsc\(i18t\('ct_share'\)\)\}<\/button>/);
    assert.match(MOB, /if\(kind==='share'\)\{ mOpenShareSheet\(\); return; \}/, 'and the phone already answers that kind');
  });
});
