/* ============================================================================
   A READING'S ANSWER IS CHECKED BEFORE IT IS FILED (Young reported it
   23 Sep 2026, off the Overview's deal card: "we now have errors included in
   the fields")
   ============================================================================
   The metadata reading hands back one answer per field through a tool call.
   On a long contract Copilot sometimes wrote its own call syntax INTO a
   string: payment terms came back as

     Terms not specified in available text</paymentTerms><parameter name="value">0

   and governing law carried the disputes answer after the same seam. Nothing
   checked what came back, so the markup was filed on the record and printed
   on the card.

   THIS IS THE ONE READING, asked in three places: the server's /api/ai/extract
   route (the wall — nothing leaves it unchecked), the browser's applyMetadata
   (what is written to the record), and migrateContract (a record already
   carrying the fault is cleaned when it is opened, before it is drawn).

   WHAT IT DOES, AND WHAT IT REFUSES TO DO:
   - a field is cut at the first seam; what is before the seam is the answer
   - an answer the model put AFTER a seam under another field's name is moved
     to that field ONLY where that field is a KNOWN key and is empty — the
     model's own words, never a guess, and never over an answer it gave
   - anything else after a seam is dropped, never shown
   - a number field takes the number, or nothing
   - an answer that only says the contract is silent is filed as silence
   It invents nothing and reads no document. */
(function(root){
  /* THE SEAM. Closing tags and `<parameter`/`<invoke` openings are the tool
     syntax; a contract's own wording carries none of them. */
  const META_SEAM_RE = /<\/?(?:parameter|invoke|antml:[a-z_]+|function_calls)\b[^>]*>|<\/[A-Za-z_][A-Za-z0-9_]*>/;
  const META_PARAM_RE = /<parameter\s+name="([A-Za-z_][A-Za-z0-9_]*)"\s*>([\s\S]*?)(?=<\/?parameter\b|<\/[A-Za-z_][A-Za-z0-9_]*>|<\/?invoke\b|$)/g;
  /* The fields whose answer is a NUMBER — anything else is a string. */
  const META_NUMBER_KEYS = ['value', 'noticePeriodDays', 'retentionPct', 'retentionReleaseDays', 'warrantyMonths'];

  /* AN ABSENCE WRITTEN AS WORDS IS AN ABSENCE. The prompt asks for an empty
     field where the contract is silent; an answer that SAYS it is silent
     ("Terms not specified in available text") is filed as the empty answer,
     so the card prints its em-dash rather than a sentence about the reading. */
  const META_ABSENT_RE = /^(?:the\s+)?(?:terms?\s+|payment\s+terms?\s+)?(?:are\s+|is\s+)?(?:not\s+(?:specified|stated|found|provided|available|mentioned|given|set\s+out)|none\s+(?:stated|specified|given)|n\/a|unspecified)\b/i;
  const clip = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const hasSeam = v => typeof v === 'string' && META_SEAM_RE.test(v);
  const asNumber = v => {
    const m = String(v == null ? '' : v).replace(/[, ]/g, '').match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : 0;
  };
  const isEmpty = v => v == null || v === '' || (typeof v === 'number' && !v);

  /* metaUnleak(m, keys) → { meta, repaired } on a COPY; the input is never
     changed. `keys` is the list of field names this answer may carry — the
     route passes its own schema's; a caller with none passes nothing and only
     the cut is made. */
  function metaUnleak(m, keys){
    if(!m || typeof m !== 'object') return { meta: m, repaired: 0 };
    const known = new Set(Array.isArray(keys) ? keys : Object.keys(m));
    const out = Object.assign({}, m);
    const moved = {};
    let repaired = 0;
    for(const k of Object.keys(out)){
      const v = out[k];
      if(!hasSeam(v)) continue;
      const at = v.search(META_SEAM_RE);
      const tail = v.slice(at);
      out[k] = META_NUMBER_KEYS.includes(k) ? asNumber(v.slice(0, at)) : clip(v.slice(0, at));
      repaired++;
      let mm;
      META_PARAM_RE.lastIndex = 0;
      while((mm = META_PARAM_RE.exec(tail))){
        const name = mm[1], val = clip(mm[2]);
        if(!known.has(name) || name === k || !val) continue;
        if(!(name in moved)) moved[name] = val;
      }
    }
    for(const name of Object.keys(moved)){
      if(!isEmpty(out[name]) && !hasSeam(out[name])) continue;
      out[name] = META_NUMBER_KEYS.includes(name) ? asNumber(moved[name]) : moved[name];
    }
    /* THE SPANS ARE STRINGS TOO, and they are printed as the wording a value
       was read from — the same cut, and nothing moved. */
    if(out.sourceSpans && typeof out.sourceSpans === 'object'){
      const sp = Object.assign({}, out.sourceSpans);
      for(const k of Object.keys(sp)) if(hasSeam(sp[k])){ sp[k] = clip(sp[k].slice(0, sp[k].search(META_SEAM_RE))); repaired++; }
      out.sourceSpans = sp;
    }
    for(const k of Object.keys(out)){
      if(typeof out[k] === 'string' && META_ABSENT_RE.test(out[k].trim())){ out[k] = ''; repaired++; }
    }
    return { meta: out, repaired };
  }
  /* The one question a screen asks: does this value still carry a seam? */
  const metaHasSeam = hasSeam;

  const API = { META_SEAM_RE, META_ABSENT_RE, META_NUMBER_KEYS, metaUnleak, metaHasSeam };
  if(typeof module !== 'undefined' && module.exports) module.exports = API;
  if(typeof window !== 'undefined') Object.assign(window, API);
})(typeof globalThis !== 'undefined' ? globalThis : this);
