/* f1193 · THE OLD PANEL NEVER STAYS BESIDE THE LIST (owner, 23 Nov 2026, on two photos: "image one is an older version
   … once in a while image one pops up", then: "the numbers on the panel reflect a whole platform number of contracts
   which is different from what you see in the main page"). The panel picks the drawn one only once the list is on
   screen; painted a moment before, it fell through to the whole book's summary (pdWallOverview, .pd-wall) and nothing
   drew it again. The list, once painted, mends it (regLsDockMend). Fails at the parent. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const RG = strip(fs.readFileSync(path.join(__dirname, '..', 'js/views/register.js'), 'utf8'));
const fnBody = (src, name) => { const at = src.search(new RegExp('\\nfunction ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\nfunction /); return src.slice(at, nx > 0 ? at + 10 + nx : src.length); };

test('f1193 (1) the mend redraws the panel only when the list is up and the old summary stands beside it', () => {
  const M = fnBody(RG, 'regLsDockMend');
  assert.match(M, /regLsListUp\(\)\|\|regFoldersUp\(\)/);
  assert.match(M, /document\.querySelector\('#ig-dock \.pd-wall'\)/);
  assert.match(M, /ctfDockAgain\(\); return true;/);
});

test('f1193 (2) both list painters mend once they have painted', () => {
  assert.match(fnBody(RG, 'renderRegisterBody'), /regInsPaint\(\);\s*regLsDockMend\(\);\s*\}\s*$/);
  assert.match(fnBody(RG, 'renderRegister'), /regLsDockMend\(\); \}\s*\}\s*$/);
  assert.match(RG, /regLsDockMend,regLsSigned/);
});
