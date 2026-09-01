/* ============================================================
   READING A CHANGE'S CARD, SINCE THE CARD OPENS (2 Sep 2026)
   ============================================================
   The owner's ruling: a redline card's face carries one control — Open — and
   every verb, strip and comment lives behind it. The column draws exactly ONE
   card open at a time, which is this page's own rule for everything else that
   opens in place.

   So a claim of the form "does this change offer Send / Accept / a verdict"
   can no longer be read off one render of the column: the answer is in the
   body, and only one body is drawn. This renders the column once per change
   with that change open and joins the results, which is the same question the
   old single render answered and the same markup those claims already read.

   IT IS A SUPERSET OF THE OLD READING, deliberately: every card's FACE appears
   in every render, so a claim that passed against the closed column passes
   here unchanged, and a claim about a verb finds it. Nothing is stubbed and no
   product behaviour is stood in for — this drives the real renderer through
   the real open state.

   WHAT IT IS NOT FOR: counting. Joining N renders draws each face N times, so
   a claim about how many cards or bands the column holds must read a single
   render. Those calls are deliberately left alone.
   ============================================================ */
function openedCards(win, c, opts = {}){
  const changes = (typeof win.negoChanges === 'function' ? win.negoChanges(c) : (c && c.changes)) || [];
  const ids = changes.map(x => x && x.id).filter(Boolean);
  if (!ids.length || typeof win.rlCardSetOpen !== 'function')
    return win.redlineChangeCardsHtml(c, opts);
  const was = typeof win.rlCardOpenId === 'function' ? win.rlCardOpenId() : null;
  let out = '';
  for (const id of ids){
    win.rlCardSetOpen(id);
    out += win.redlineChangeCardsHtml(c, opts);
  }
  win.rlCardSetOpen(was);
  return out;
}

/* ONE NAMED CARD, OPEN — for a claim that SLICES the column rather than
   parsing it. `openedCards` joins several renders, so a slice from the first
   occurrence of a card's marker lands on whichever pass had a DIFFERENT card
   open and reads its closed face. This renders the column exactly once with
   the named change open, so any slice or `querySelector` finds the body. */
function cardOpened(win, c, id, opts = {}){
  const was = typeof win.rlCardOpenId === 'function' ? win.rlCardOpenId() : null;
  if (typeof win.rlCardSetOpen === 'function') win.rlCardSetOpen(id);
  const out = win.redlineChangeCardsHtml(c, opts);
  if (typeof win.rlCardSetOpen === 'function') win.rlCardSetOpen(was);
  return out;
}
module.exports = { openedCards, cardOpened };
