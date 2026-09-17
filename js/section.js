// HaTi — extracted module. Globals are window-attached on purpose: the app is
// written against a single global scope (inline onclick handlers, cross-module
// calls); modules give file isolation for editing, not scope isolation.
/* ============================================================
   THE SECTION GRAMMAR (owner-approved 16 Sep 2026, "Six Screens,
   One Grammar")

   One way of grouping things on a screen, shared by the contract
   Overview, Home, Contracts, Requests and Insights. Taken from SAP
   Fiori's object page (sections rather than a scatter of cards) and
   Icertis's agreement details page (attributes under collapsible
   headings, uppercase label above the value, two dashes where nothing
   is recorded), with Ironclad's rule about what opens: hide what is
   not typically acted on.

   FIVE RULES, and they are the whole thing:
     1. Name the group. Not "card" or "panel" — The deal, Overdue,
        Prepared for you.
     2. A SHUT GROUP STILL ANSWERS. The head carries a summary, so most
        of the time nobody opens it. A shut section that only repeats
        its own name has failed, and `sectionHtml` will not draw the
        chevron unless there is something to open.
     3. Open what is being acted on; reference opens shut.
     4. Label above value, EM-DASH FOR SILENCE — never a blank, never a
        guess. `sectionFieldHtml` writes the dash itself so no caller
        has to remember.
     5. Controls state themselves: a row of filters becomes one
        sentence, which is `sectionStatementHtml`.

   GOVERNED BY HaTi's OWN `empty:hidden`: a group with nothing to say
   is not drawn at all. That rule lives with the CALLER — this file
   never decides whether a section exists, only how it looks.

   THE OPEN/SHUT STATE IS PER SITTING AND IN MEMORY. It is a reading
   preference, not a fact about the record: nothing here is persisted,
   nothing travels, and a refresh returns every section to the default
   its caller asked for. That is deliberate — a stored fold would make
   two people's screens disagree about what HaTi says.
   ============================================================ */

const _secOpen = Object.create(null);     // key -> true | false, this sitting only

/* Is this section open? `dflt` is what the CALLER wants on arrival, and
   is honoured until somebody presses the head. */
function sectionOpen(key, dflt){
  if (!key) return dflt !== false;
  return Object.prototype.hasOwnProperty.call(_secOpen, key) ? !!_secOpen[key] : dflt !== false;
}
function sectionSetOpen(key, on){ if (key) _secOpen[key] = !!on; return !!on; }
function sectionToggle(key, dflt){ return sectionSetOpen(key, !sectionOpen(key, dflt)); }
/* Forget a scope — used when a view changes the object it is looking at, so
   section 'kt.deal' on one contract does not carry its fold to the next. */
function sectionForget(prefix){
  if (!prefix) return;
  Object.keys(_secOpen).forEach(k => { if (k.indexOf(prefix) === 0) delete _secOpen[k]; });
}

const _secEsc = s => String(s == null ? '' : s)
  .replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));

/* The chevron. Down when open, right when shut — the product's own
   #i-right sprite is a different shape, so this is drawn inline rather
   than borrowed, and it is decorative (the head carries the label). */
function sectionChevronHtml(open){
  return `<svg class="sec-chev${open ? ' is-open' : ''}" width="16" height="16" viewBox="0 0 16 16"
    fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>`;
}

/* ONE FIELD: uppercase label, value beneath, and an em-dash where the
   record says nothing. `cite` is the small mono pill that says where a
   value was read from — a clause number on a contract, a date on a
   reading. `tone` is a status colour for the value (ruby for lapsed). */
function sectionFieldHtml(label, value, cite, tone){
  const blank = value == null || value === '';
  const v = blank ? '&mdash;' : (typeof value === 'string' ? value : String(value));
  return `<div class="sec-f">
    <span class="sec-f-l">${_secEsc(label)}</span>
    <span class="sec-f-v${blank ? ' is-none' : ''}"${tone ? ` style="color:var(--st-${tone}-fg)"` : ''}>${v}${
      cite ? `<i class="sec-f-c">${_secEsc(cite)}</i>` : ''}</span>
  </div>`;
}
/* A grid of them. Four to a row on a wide screen, one on a phone — the
   caller never states a column count. */
function sectionFieldsHtml(fields){
  const rows = (fields || []).filter(Boolean).map(f => Array.isArray(f)
    ? sectionFieldHtml(f[0], f[1], f[2], f[3]) : String(f)).join('');
  return rows ? `<div class="sec-fields">${rows}</div>` : '';
}

/* THE SECTION.
     key      the fold's name this sitting ('kt.deal'); omit for a section
              that cannot be shut
     title    the group's name, already translated
     summary  WHAT A SHUT SECTION ANSWERS WITH. Markup is allowed; it is the
              caller's to escape. DRAWN ONLY WHILE A FOLDABLE SECTION IS SHUT:
              open, the body says it, and a head repeating a figure printed
              twelve pixels below it is one fact printed twice. A section that
              CANNOT be shut always draws it — there is nowhere else for it to
              go, and hiding it there loses the sentence altogether.
     chip     {text, tone} — a status word at the right of the head
     open     the default on arrival (rule 3). Absent means open.
     body     the section's contents, already built
     acts     a row of buttons under the body
     foot     one quiet line under the acts
     accent   'amber' | 'ruby' | … a 3px left bar, for a section carrying
              a decision. Home's rows already use this vocabulary.
     flat     true where the section is a row and draws no card of its own */
function sectionHtml(o){
  const s = o || {};
  const canShut = !!(s.key && (s.body || s.acts));
  const open = canShut ? sectionOpen(s.key, s.open) : true;
  const chip = s.chip && s.chip.text
    ? `<span class="sec-chip sec-chip-${s.chip.tone || 'gray'}">${_secEsc(s.chip.text)}</span>` : '';
  const head = `<div class="sec-head${open && (s.body || s.acts) ? ' is-open' : ''}"${
      canShut ? ` role="button" tabindex="0" aria-expanded="${open}" data-sec-toggle="${_secEsc(s.key)}"` : ''}>
    <h3 class="sec-t">${_secEsc(s.title)}</h3>
    <span class="sec-sum">${open && canShut ? '' : (s.summary || '')}</span>${
      chip}${canShut ? sectionChevronHtml(open) : ''}
  </div>`;
  const body = open
    ? `${s.body || ''}${s.acts ? `<div class="sec-acts">${s.acts}</div>` : ''}${
        s.foot ? `<p class="sec-foot">${s.foot}</p>` : ''}`
    : '';
  return `<section class="sec-box${s.flat ? ' is-flat' : ''}${s.accent ? ' has-accent' : ''}"${
    s.accent ? ` style="border-left-color:var(--st-${s.accent}-dot)"` : ''}${
    s.id ? ` id="${_secEsc(s.id)}"` : ''}>${head}${body}</section>`;
}

/* RULE 5, as a builder. A row of controls becomes one sentence saying what
   is in force, and the controls go behind the act that changes them.
     lead   the bold half — "14 executed agreements"
     rest   the quiet half — "of 22 · every stream"
     acts   the buttons, already built */
function sectionStatementHtml(o){
  const s = o || {};
  return `<div class="sec-say"${s.id ? ` id="${_secEsc(s.id)}"` : ''}>
    <h3 class="sec-t">${_secEsc(s.title || '')}</h3>
    <span class="sec-say-lead">${s.lead || ''}</span>
    <span class="sec-say-rest">${s.rest || ''}</span>
    ${s.acts ? `<span class="sec-say-acts">${s.acts}</span>` : ''}
  </div>`;
}

/* ONE LISTENER PER MOUNT, bound once per element. The caller passes the
   repaint for its own screen, because only it knows what to redraw — this
   file will not guess at a view's painter. Keyboard reaches it too: a head
   is a button, so Enter and Space open it. */
function sectionWire(root, repaint){
  const host = root || document;
  if (!host || host.dataset && host.dataset.secBound) return;
  if (host.dataset) host.dataset.secBound = '1';
  const hit = e => {
    const h = e.target && e.target.closest && e.target.closest('[data-sec-toggle]');
    if (!h || !host.contains(h)) return null;
    return h;
  };
  /* ---- THE PRESS REVERSES WHAT IS ON SCREEN, NOT WHAT THIS FILE GUESSES ----
     `sectionToggle(key)` with no default assumes OPEN (that is what absent
     means everywhere else here), so the first press on a section drawn shut
     computed !open === shut and did nothing at all — measured in a real
     browser: the head's aria-expanded never moved. The HEAD knows: it was
     drawn with the state it is in. Reading it back is exact by construction
     and cannot drift from the default its caller asked for. */
  const flip = h => {
    const key = h.getAttribute('data-sec-toggle');
    sectionSetOpen(key, h.getAttribute('aria-expanded') !== 'true');
    if (typeof repaint === 'function') repaint(key);
  };
  host.addEventListener('click', e => {
    if (e.target && e.target.closest && e.target.closest('button,a,select,input,[data-sec-keep]')) return;
    const h = hit(e); if (!h) return;
    flip(h);
  });
  host.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const h = hit(e); if (!h) return;
    e.preventDefault();
    flip(h);
  });
}

if (typeof window !== 'undefined') Object.assign(window, {
  sectionOpen, sectionSetOpen, sectionToggle, sectionForget,
  sectionHtml, sectionFieldHtml, sectionFieldsHtml, sectionStatementHtml,
  sectionChevronHtml, sectionWire
});
