/* ============================================================
   THE FROZEN COPY'S TEXT, ONE READING ON BOTH HOSTS (Young, 9 Oct 2026:
   "teach the server to build the final copy of the sealed contract itself,
   without needing a browser")
   ============================================================
   A copy the SERVER draws is fingerprinted with hashMode 'plain': the hash
   input is sealPlainText(html), a pure string reading with no page behind
   it. The server seals with it (srvDrawSealPrep, server/server.js) and the
   browser's Verify asks the same function (execHashInput, js/core.js), so the
   two can never read the same copy two ways. Every copy sealed before keeps
   its own mode ('text' or 'rich') and verifies exactly as it always did.

   WHAT IT READS: the words, in order. Comments go; a tag goes, and a tag
   that starts or ends a block (or a line break) leaves one space so two
   paragraphs never run into one word; the common character references are
   read; all white space is one space; the ends are trimmed. */
const SEAL_HASH_PLAIN = 'plain';
const _ST_BLOCK = /^(?:p|div|h[1-6]|li|ul|ol|table|thead|tbody|tfoot|tr|td|th|blockquote|pre|section|article|header|footer|br|hr)$/i;
const _ST_NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function sealPlainText(html) {
  const s = String(html == null ? '' : html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*>/g, (m, tag) => (_ST_BLOCK.test(tag) ? ' ' : ''))
    .replace(/&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]{2,8});/g, (m, ref) => {
      if (ref[0] === '#') {
        const n = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
        return (Number.isFinite(n) && n > 0 && n <= 0x10FFFF) ? String.fromCodePoint(n) : m;
      }
      return Object.prototype.hasOwnProperty.call(_ST_NAMED, ref) ? _ST_NAMED[ref] : m;
    });
  return s.replace(/\s+/g, ' ').trim();
}
const SEALTEXT_API = { SEAL_HASH_PLAIN, sealPlainText };
if (typeof window !== 'undefined') Object.assign(window, SEALTEXT_API);
if (typeof module !== 'undefined' && module.exports) module.exports = SEALTEXT_API;
