/* f669 — A MARK ON THE PAPER IS NOT WORDING (bug log, 5 Oct 2026; fixed 13 Oct)

   A template clause the scan flagged is drawn with a tag beside its heading
   ("Deviation", "Check", "High"). The working copy is read off that drawing,
   so the tag was read in as wording: Negotiate, the editor's Selected card
   and what Jambo was sent all read "3. Quality & Rejection / Deviation / …".
   The tag carries `data-not-wording`; the one text reader drops it.
   Run: node --test test/f669-a-mark-on-the-paper-is-not-wording.test.js */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const W = buildWorld();
const { htmlToStructuredText } = W.win;
const CONTRACT = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');

test('the reader drops a mark drawn on the paper, and keeps the clause', () => {
  const html = '<div data-anchor="c3"><div><h4>3. Quality &amp; Rejection</h4>'
    + '<span data-not-wording>Deviation</span></div><p>Consignments may be rejected.</p></div>';
  const t = htmlToStructuredText(html);
  assert.ok(!/Deviation/.test(t), 'the tag is not read: ' + JSON.stringify(t));
  assert.match(t, /3\. Quality & Rejection/);
  assert.match(t, /Consignments may be rejected\./);
});

test('the scan flag tag beside a clause heading carries the mark', () => {
  const at = CONTRACT.indexOf('const clause=(n,title,body,key)=>{');
  assert.ok(at > 0, 'the clause builder is where it says it is');
  const body = CONTRACT.slice(at, CONTRACT.indexOf('const f=c.fields;', at));
  assert.match(body, /const tag=p\?`<span data-not-wording /);
});
