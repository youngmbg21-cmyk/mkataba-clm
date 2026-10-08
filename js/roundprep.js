/* ---- THEIR ROUND CAME BACK: ONE KEY FOR AN ASK, TWO HOSTS (27 Sep 2026) ----
   Copilot prepares an answer to each ask of theirs when their round arrives
   (runRoundPrep, server/server.js), and the negotiation page draws it beside
   the ask. The two meet on a KEY — the clause the ask is on and the words it
   proposes — because the server may prepare an answer from their response
   BEFORE anybody's browser has filed it as a change, and a change id does not
   exist yet then. Written once, here, so the two hosts cannot come to key the
   same ask differently.
   Like js/graphwhere.js: globals in the browser, a require on the server. */
/* 'reject' (8 Oct 2026): their change is refused and our wording stands — the
   answer the owner can now ask Copilot for ("simply said reject"). */
const ROUND_PREP_VERDICTS = ['accept', 'counter', 'reject', 'escalate'];
/* FNV-1a over the clause id and the proposed words with their whitespace
   folded — the ask, not its layout. Short and stable; nothing secret rides
   on it (the table it keys is walled per contract). */
function roundPrepKey(clauseId, newText){
  const s = String(clauseId || '') + '\u0001' + String(newText == null ? '' : newText).replace(/\s+/g, ' ').trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return String(clauseId || '') + ':' + h.toString(36);
}
/* The prepared answer for one change, off the transport the server attached
   (`c._roundPrep`, a map key → answer). null where there is none. */
function roundPrepOf(c, ch){
  const m = c && c._roundPrep;
  if (!m || typeof m !== 'object' || !ch) return null;
  const a = m[roundPrepKey(ch.clauseId, ch.newText)];
  return a && ROUND_PREP_VERDICTS.includes(a.verdict) ? a : null;
}
const RP_API = { ROUND_PREP_VERDICTS, roundPrepKey, roundPrepOf };
if (typeof window !== 'undefined') Object.assign(window, RP_API);
if (typeof module !== 'undefined' && module.exports) module.exports = RP_API;
