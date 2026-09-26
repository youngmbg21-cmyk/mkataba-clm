/* ============================================================
   THE BLANKS IN A DOCUMENT SOMEBODY SENT US (Young ruled 20 Sep 2026)
   ============================================================
   *"build it"* — item 9 of the seven-off-four-screenshots order, whose own
   sentence was: make uploaded contracts' blanks fillable too.

   MEASURED FIRST. A contract drafted from a built-in template carries its
   blanks as real `<input data-field>` boxes and has had a right-hand panel
   since 17 Sep. A contract somebody SENT us carries its blanks as WORDS —
   `[Insert Company Name]`, `{{effective_date}}`, a ruled `________` — and the
   product could not see them at all: `contractHasBlanks` refuses every upload
   by name, so the panel never drew, the arrival reading answered "nothing to
   fill", and the only way to answer a placeholder in received paper was to
   negotiate a change to it.

   THE PAPER IS THE ANSWER, exactly as it is for a drafted contract — the
   Plain English edition's own rule, THE WALK IS THE SHEET'S OWN. Nothing
   declares what blanks a received document has and nothing could: it is the
   other side's drafting.

   ── FOUR THINGS THIS FILE REFUSES TO DO, and each is the whole design ──

   1. IT NEVER REWRITES THE WORDING. An upload is the other side's paper
      (THE UPLOAD IS ITS OWN PAPER, C-7). `c.redlineText` and the extracted
      text are left byte-identical, so `rereadUploadText` still returns the
      same document, the fingerprints still verify, and a negotiation opened
      tomorrow is measured against the words that actually arrived.

   2. THE MARKS ARE PAINTED ONTO THE CANVAS, NOT BUILT INTO docBody. This is
      signSpotsPaint's and docDutyPaperPaint's own precedent and it is here
      for the reason those two record: docBody FEEDS the counterparty's page,
      the PDF export and the phone, so anything written into it TRAVELS — the
      C-7 header block did, and was proved doing it on two real links.
      Nothing serialises a painted canvas, so a mark painted after the paint
      cannot reach the payload, an export, their seat or the record. Our
      answers are a working note on our own screen and stay one.

   3. IT GUESSES NOTHING. The blanks carry `kind:'upload'`, which is what
      keeps them out of `fillBlanksFromRecord` (it filters `kind === 'field'`)
      — we do not know whose side `[Company Name]` names in a document we did
      not draft, and a reading that filled it with OUR entity would be this
      product inventing a fact and then reporting it. A person types these.

   4. IT STOPS THE MOMENT THE WORDING BECOMES OURS. `uploadWordingEdited` is
      the one reading of "somebody has edited this upload" and it is already
      what the re-read control and the provenance caption refuse on. Past that
      line the words on screen are the workspace's, the redline's own marks
      are on them, and a second set of marks over the same characters would be
      two claims about one word.

   ── ONE MATCHER, TWO WALKS, AND WHY THAT IS SAFE ──
   The READ walks the wording SOURCE (so it answers in Node, at creation,
   before anything is mounted — which is what the arrival reading and the
   panel's count both need). The PAINT walks the PAINTED canvas. They agree
   because the renderer moves no character: "not one word moves" is this
   codebase's own promise for the upload readers (f257), and `docBodyHtml`
   hands `c.redlineText` straight to `renderDocHtml`. Pinned as a WALL rather
   than assumed — the browser file reads the source, counts the painted spans,
   and requires the two key SETS to be equal.

   NO ROUTE, NO STORE, NO NEW FIELD. Every answer lives on `c.fields`, written
   by `contractBlankSet` — the ONE writer the panel and the paper already
   share. This file adds a reading and a mark and nothing else.
   ============================================================ */

/* ---- WHAT A PLACEHOLDER LOOKS LIKE ----
   Three shapes, and the refusals in each are what stop the other side's
   drafting being turned into a form by accident. A false positive here is
   worse than a missed blank: it invites somebody to "answer" a word that was
   never a question. */

/* `[Insert Company Name]`, `[DATE]`, `[•]`. Bounded 2–60 characters because a
   longer bracket is a drafting note, not a box. No `<`, `>` or `&` and no
   newline: this runs over text nodes, so a match carrying markup means the
   walk crossed an element boundary, which is redlineHangHtml's own rule. */
const UP_BRACKET_RE = /\[([^\[\]<>&\n\r]{1,60})\]/g;
/* HaTi's own template syntax, which received paper sometimes carries too. */
const UP_BRACE_RE = /\{\{([^{}<>&\n\r]{1,60})\}\}/g;
/* A ruled line to write on. THREE is the floor and the lookarounds are what
   keep `snake_case`, a file name and a URL out of it — a run flanked by word
   characters is part of a word, never a blank. */
const UP_RULE_RE = /(?<![A-Za-z0-9])_{3,}(?![A-Za-z0-9])/g;

/* A bracket holding ONLY a number, a single letter or a roman numeral is a
   list marker or a citation — `[1]`, `[a]`, `[iv]` — and naming it a blank
   would put a box beside every footnote in the document. */
const UP_MARKER_RE = /^(?:\d{1,3}|[A-Za-z]|[ivxlcdm]{1,7}|[IVXLCDM]{1,7})$/;
/* And a bracket with no letter in it at all names nothing: `[ ]`, `[--]`. */
const UP_HAS_LETTER_RE = /[A-Za-z]/;

/* Bounds. Both are guards against pathological input rather than product
   limits — a real agreement comes nowhere near either — and each is counted
   and said where it bites rather than trimmed in silence (A CAP IS A FACT). */
const UP_BLANK_MAX = 60;
const UP_KEY_MAX = 48;
/* Text this walk does not read. The signature block's own ruled lines are the
   reason it exists: a foot drawn with `________` over "Name" is furniture, not
   a blank in the agreement, and it is drawn OUTSIDE the wording container this
   scopes to — the skip list is the second wall, for a contents row or a
   control that ends up inside one. */
const UP_SKIP_SEL = 'input,textarea,select,button,script,style,.hati-toc,.sig-spot,[contenteditable="true"]';
const UP_MARK_CLASS = 'up-blank';
/* ---- THE FOURTH SHAPE: A WORD FILL-IN FIELD (20 Sep 2026) ----
   The grey shaded box a drafter leaves for an answer. It is not a pattern in
   the text — `Enter buyer name` is indistinguishable from wording — so the
   FILE is what states it, and js/docx.js marks it on the way in (see
   DOCX_WFIELD_CLASS). Read through `window` so the reader and the writer of
   this class cannot drift; the literal is the fallback for a stage that has
   not loaded js/richdoc.js. */
const upFieldClass = () => (typeof RICH_WFIELD_CLASS === 'string' && RICH_WFIELD_CLASS) || 'hati-wfield';
const upFieldSel = () => 'span.' + upFieldClass();
/* The painter's own spans are told from the paper's by this, because the two
   are cleared in opposite ways: one is unwrapped, the other is the drafter's
   own element and only gives up what the paint put on it. */
const UP_MADE_ATTR = 'data-upmade';
/* The drafter's own name for the gap, where the file carried one — see
   RICH_WFIELD_NAME_ATTR. Read through `window` for the same reason the class
   is. */
const upFieldNameAttr = () => (typeof RICH_WFIELD_NAME_ATTR === 'string' && RICH_WFIELD_NAME_ATTR) || 'data-wfield';
/* WORD'S OWN PROMPTS ARE UI CHROME, NOT NAMES. A content control with no alias
   shows one of these, so taken as a name every gap in a real Word form would
   be labelled identically and share ONE key — one box answering all of them.
   Folded and compared whole, never by substring: a clause that happens to
   contain these words is not a prompt. */
const UP_WORD_STOCK = new Set([
  'click or tap here to enter text.', 'click here to enter text.',
  'click or tap here to enter text', 'click here to enter text',
  'choose an item.', 'choose an item', 'select an item.', 'select an item',
  'click or tap to enter a date.', 'click here to enter a date.',
  'enter text here', 'type here', 'text',
]);
const upStockPrompt = t => UP_WORD_STOCK.has(String(t == null ? '' : t).replace(/[\s\u00a0]+/g, ' ').trim().toLowerCase());

/* Words folded into a key. Lowercase, one underscore per run of anything
   else, bounded — so `[Insert Company Name]` and `[insert company name]` are
   one question with one answer, which is what a reader filling a twelve-page
   document wants. */
function upFold(s){
  return String(s == null ? '' : s).toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, UP_KEY_MAX)
    .replace(/_+$/, '');
}

/* THE LABEL IS THE PLACEHOLDER'S OWN WORDS. An ALL-CAPS name is lowered first
   — `[DATE]` asking "DATE" reads as shouting in a form, and every label beside
   it is sentence case — but a name the drafter capitalised in part is theirs
   and is kept as written. CONTRACT TEXT IS NEVER TRANSLATED, and this is
   contract text. */
function upLabel(name){
  /* `{{effective_date}}` is a KEY the drafter typed, not a phrase, so the
     underscores become spaces — a box labelled "Effective_date" beside one
     labelled "Registered address" reads as two lists. */
  const s = String(name == null ? '' : name).replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if(!s) return '';
  const t = /[a-z]/.test(s) ? s : s.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/* The last few words in front of a ruled line, which is the only name an
   unnamed blank has: "Delivery address: ________" asks for a delivery
   address. Punctuation is dropped, a leading fragment of a longer sentence is
   cut to the last UP_LEAD_WORDS so the label is a phrase rather than a
   paragraph. */
const UP_LEAD_WORDS = 5;
function upLead(before){
  let s = String(before == null ? '' : before).replace(/[\s\u00a0]+/g, ' ');
  /* A NEIGHBOURING PLACEHOLDER IS NOT A NAME. "[1] year. Delivery address:"
     would otherwise fold a list marker into this blank's key. */
  s = s.replace(/\[[^\]]*\]|\{\{[^}]*\}\}|_{3,}/g, ' ');
  /* AND THE LEAD IS THE PHRASE IN FRONT OF THE LINE, NOT THE SENTENCE BEFORE
     IT: cut at the last sentence end, so "…for one year. Delivery address:
     ______" is asking for a delivery address rather than for a year. */
  const cut = s.search(/[^.;!?]*$/);
  if(cut > 0) s = s.slice(cut);
  const words = s.replace(/[:;,.\-–—(]+\s*$/, ' ').trim().split(' ').filter(Boolean);
  return words.slice(-UP_LEAD_WORDS).join(' ');
}

/* ---- THE MATCHER ----
   Every placeholder in one run of text, in the order it is written, each with
   where it starts and ends so a walk can splice round it. Three patterns over
   one string rather than one pattern with three branches: the refusals differ
   per shape and an alternation would have had to carry all of them at once.

   THE `lastIndex` RESET AND THE ZERO-WIDTH GUARD are the standard pair for a
   /g walk over caller-supplied text — none of these three can match empty,
   but the lists above are edited by hand and an emptied one would hang the
   page rather than draw nothing. docDutyPaperPaint records the same guard. */
function upHits(text){
  const t = String(text == null ? '' : text);
  if(!t || t.length < 3) return [];
  const out = [];
  const scan = (re, kind) => {
    re.lastIndex = 0;
    let m;
    while((m = re.exec(t))){
      if(m.index === re.lastIndex) re.lastIndex++;
      const raw = m[0];
      const name = String(m[1] == null ? '' : m[1]).trim();
      if(kind !== 'rule'){
        if(!name) continue;
        if(!UP_HAS_LETTER_RE.test(name)) continue;    // `[ ]`, `[--]` name nothing
        if(UP_MARKER_RE.test(name)) continue;         // `[1]`, `[a]`, `[iv]` are markers
      }
      out.push({ s: m.index, e: m.index + raw.length, raw, name, kind });
    }
  };
  scan(UP_BRACKET_RE, 'named');
  scan(UP_BRACE_RE, 'named');
  scan(UP_RULE_RE, 'rule');
  out.sort((a, b) => a.s - b.s || a.e - b.e);
  /* An overlap cannot happen between these three shapes, but sorting two
     patterns' hits together and splicing them blind is how a walk comes to
     wrap a fragment of its neighbour. Dropped rather than merged: a shape
     nobody can name is not a question. */
  const clean = [];
  for(const h of out) if(!clean.length || h.s >= clean[clean.length - 1].e) clean.push(h);
  return clean;
}

/* ---- WHAT ONE RUN ASKS ----
   THE ONE READING both walks use, so the read and the paint can never disagree
   about what a run carries. A field is ONE hit covering the whole run: the
   file has already said where it begins and ends, and re-deciding that from
   its characters is the guess this shape exists to avoid.

   A field whose prompt carries LETTERS is named by it, exactly as a bracket
   is. One that carries none — Word pads an empty box with spaces — has no
   name of its own and takes a ruled line's rule instead, keyed on the words in
   front of it. Two existing branches, no third key space. */
function upNodeHits(node){
  if(!node) return [];
  const t = String(node.text == null ? '' : node.text);
  if(!node.field) return upHits(t);
  /* A field with NO characters at all is still a gap where the file named it:
     the name is what makes it answerable, and a span the drafter put there is
     never noise. With neither text nor name there is nothing to key it on. */
  if(!t && !String(node.name || '')) return [];
  /* THREE ANSWERS IN ORDER OF CERTAINTY: the name the drafter gave the gap,
     then the prompt they wrote in it, then nothing — and nothing falls to the
     ruled line's own rule, the words in front of it. Word's stock prompt is
     not a name and is refused at the second rung. */
  const name = String(node.name || '')
    || (UP_HAS_LETTER_RE.test(t) && !upStockPrompt(t) ? t.trim() : '');
  return [{ s: 0, e: t.length, raw: t, name,
    kind: name ? 'named' : 'rule', field: true }];
}

/* ---- THE KEY ----
   A NAMED placeholder is keyed on its NAME, so every `[Company Name]` in a
   twelve-page document is one question answered once — which is the whole
   point of a placeholder repeated through a draft.

   A RULED LINE has no name, so it is keyed on the words in front of it, and a
   second line following the same words is its own question with its own
   ordinal. Both are stable for as long as the wording is: this feature turns
   itself off the moment anybody edits the upload, so no blank can ever shift
   under an answer already given.

   IT IS ITS OWN NAMESPACE. `up_` cannot collide with a template's own field
   keys (`payDays`, `effDate`, `party`) and — more to the point — it can never
   be `counterparty` or `value`, which contractBlankSet refuses by name. */
function upKeyMint(hit, lead, state){
  if(hit.kind === 'named'){
    const k = upFold(hit.name);
    return k ? 'up_' + k : '';
  }
  const base = 'up_b_' + (upFold(lead) || String(state.rules + 1));
  let key = base, n = 1;
  while(state.keys.has(key)) key = base + '_' + (++n);
  return key;
}

/* ---- THE ONE WALK ----
   Both readings run through here: `onHit` is called for every placeholder in
   document order with its key already minted, and whatever it returns is
   ignored. The caller keeps the state it wants.

   `nodes` is a list of `{text, lead}` — one per run of readable text, with
   whatever came before it on the same line — so the walk is identical whether
   the runs came from a detached parse of the stored wording or from the text
   nodes of a painted canvas. That is what makes the two walks agree without
   either knowing about the other. */
function upWalk(nodes, onHit){
  const state = { keys: new Set(), skipped: new Set(), seq: [], rules: 0 };
  for(const node of nodes || []){
    const hits = upNodeHits(node);
    if(!hits.length) continue;
    for(const h of hits){
      const lead = h.kind === 'rule'
        ? (upLead(node.text.slice(0, h.s)) || upLead(node.lead || ''))
        : '';
      const key = upKeyMint(h, lead, state);
      if(!key) continue;
      const fresh = !state.keys.has(key);
      /* THE CAP IS ON QUESTIONS, NOT ON OCCURRENCES — `[Company Name]` said
         forty times is one box. A guard against pathological input; what it
         leaves out is counted and said (A CAP IS A FACT). */
      if(fresh && state.keys.size >= UP_BLANK_MAX){ state.skipped.add(key); continue; }
      state.keys.add(key);
      if(h.kind === 'rule') state.rules++;
      state.seq.push({ key, raw: h.raw });
      if(typeof onHit === 'function') onHit({ key, hit: h, node, lead, fresh });
    }
  }
  return state;
}

/* Turn a run of markup into the `{text, lead}` runs the walk reads. With a
   DOM this is the real thing — headings recorded on the way so a blank can
   say which clause it sits in — and without one it falls back to the text
   between the tags, which is what a Node stage gets and is enough to answer
   the keys and the count. */
function upNodesFrom(html, rich){
  const src = String(html == null ? '' : html);
  if(!src.trim()) return [];
  if(!rich){
    /* PLAIN TEXT IS ALREADY THE RUNS. One per line, and the line before it is
       the lead — a ruled line on its own row takes its name from the row
       above, which is how forms are typed. */
    const lines = src.split(/\r?\n/);
    return lines.map((t, i) => ({ text: t, lead: i ? lines[i - 1] : '', head: '' }));
  }
  if(typeof document === 'undefined'){
    /* NO DOM — unreachable in the product (every stage that loads this file
       carries one) and kept honest anyway: a field is cut out FIRST as its own
       unit, then what is left is split on tags rather than stripped, so a
       placeholder cannot be assembled across two elements that never touched. */
    const out = [];
    const re = new RegExp('<span class="' + upFieldClass() + '"([^>]*)>([\\s\\S]*?)<\\/span>', 'g');
    let at = 0, m;
    const plain = chunk => { for(const t of String(chunk).split(/<[^>]*>/)){
      const v = upEntities(t); if(v && v.trim()) out.push({ text: v, lead: '', head: '' }); } };
    while((m = re.exec(src))){
      plain(src.slice(at, m.index));
      out.push({ text: upEntities(String(m[2]).replace(/<[^>]*>/g, '')), lead: '', head: '', field: true,
        name: (String(m[1]).match(new RegExp(upFieldNameAttr() + '="([^"]*)"')) || [])[1] || '' });
      at = m.index + m[0].length;
    }
    plain(src.slice(at));
    return out;
  }
  let host;
  try{ host = document.createElement('div'); host.innerHTML = src; }catch(_){ return []; }
  return upNodesOf(host);
}

/* The five entities a stored body can carry, resolved for the no-DOM path
   only — with a DOM the parse does it. Nothing here re-enters markup: these
   go one way, into text the matcher reads and nobody prints. */
function upEntities(s){
  return String(s == null ? '' : s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

/* The readable text runs of a mounted or detached element, in document order,
   each carrying the nearest heading above it. The skip list is asked of the
   ANCESTOR chain, so a placeholder inside a control or a contents row is not
   a blank however it is nested. */
function upNodesOf(root){
  if(!root || typeof document === 'undefined') return [];
  const out = [];
  let head = '';
  const FIELD = upFieldSel();
  try{
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        if(n.nodeType === 1){
          if(n.closest && n.closest(UP_SKIP_SEL)) return NodeFilter.FILTER_REJECT;
          if(n.matches && n.matches(FIELD)) return NodeFilter.FILTER_ACCEPT;
          return /^h[1-6]$/i.test(n.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
        const p = n.parentElement;
        if(!p || (p.closest && p.closest(UP_SKIP_SEL))) return NodeFilter.FILTER_REJECT;
        /* A FIELD'S OWN WORDS ARE THE FIELD'S UNIT, never a run of their own:
           read both and the same gap is offered twice and painted twice. The
           element is accepted above and this drops what is under it. */
        if(p.closest && p.closest(FIELD)) return NodeFilter.FILTER_REJECT;
        return (n.data && n.data.length >= 3) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let n, prev = '';
    while((n = w.nextNode())){
      if(n.nodeType === 1){
        if(n.matches && n.matches(FIELD)){
          const t = n.textContent || '';
          out.push({ text: t, lead: prev, head, node: n, field: true,
            name: (n.getAttribute && n.getAttribute(upFieldNameAttr())) || '' });
          prev = t;
          continue;
        }
        head = (n.textContent || '').replace(/\s+/g, ' ').trim(); continue;
      }
      out.push({ text: n.data, lead: prev, head, node: n });
      prev = n.data;
    }
  }catch(_){ return out; }
  return out;
}

/* ---- A FILE THEY SIGN HAS NO BLANKS FOR US TO FILL (Young, 26 Sep 2026) ----
   "if the contract is being signed out of hati and the contract is simply
   being used to negotiate the clauses, these fields are irrelevant I would
   presume." That is right, for a reason the panel's own heading already says on
   its hover: an answer here is a WORKING NOTE on our screen and is never
   written into their document. On this route what they receive is the agreed
   WORDING as a Word file (outsideAgreedHtml — the negotiation's body, never
   these answers), and the blanks are filled in their own copy, in their own
   design, when they sign it. A form whose answers go nowhere is worse than no
   form: a reader who fills in twenty-nine boxes believes the file carries
   them.

   ONE READING. The gate below asks it, so the panel, the marks, the count and
   the arrival read stand down together; contractBlanksNone asks it so the
   arrival tile says WHY rather than "HaTi cannot read its blanks yet", which
   would be false — it can, and it does not ask. signRouteOf is js/outside.js's
   and that file is not on every stage, so the literal is the fallback, the
   reading signRouteOf itself makes.

   A READING, NEVER A DELETE: answers already typed stay on the record, and a
   contract switched back to HaTi's own signing finds them where it left them.
   AND NOT THE HANDOVER'S OWN CHECK: a placeholder written into the agreed
   words ("[insert amount]") still holds the handover (outsideBlanksOf),
   because whatever is in the file is what they sign. That is a question
   about the WORDING; this is a form beside it. */
function uploadBlanksTheirs(c){
  if(!c) return false;
  try{ if(!(typeof isUpload === 'function' && isUpload(c))) return false; }catch(_){ return false; }
  try{ return (typeof signRouteOf === 'function') ? signRouteOf(c) === 'outside' : c.signRoute === 'outside'; }
  catch(_){ return c.signRoute === 'outside'; }
}

/* ---- MAY THIS UPLOAD'S BLANKS BE FILLED NOW ----
   ONE READING, and the panel, the marks and contractHasBlanks all ask it, so
   none of them can draw when the others stand down.

   IT IS docFillable's COUNTERPART, NEVER ITS RIVAL: that reading refuses
   every upload by name and this one refuses everything that is not an upload,
   so the two can never both answer true for one contract. Asserted as a wall.

   The walls past `isUpload` are docFillable's own, for docFillable's own
   reasons: a sealed record takes no working note, a Viewer types nothing, and
   the counterparty's page is not where our blanks are answered. And since
   26 Sep 2026 a file THEY sign, which is uploadBlanksTheirs, above. */
function uploadBlanksLive(c){
  if(!c) return false;
  try{ if(!(typeof isUpload === 'function' && isUpload(c))) return false; }catch(_){ return false; }
  if(typeof PORTAL_MODE !== 'undefined' && PORTAL_MODE) return false;
  if(uploadBlanksTheirs(c)) return false;
  if(c.status === 'Signed') return false;
  try{ if(typeof canEdit === 'function' && !canEdit()) return false; }catch(_){ }
  try{ if(typeof uploadWordingEdited === 'function' && uploadWordingEdited(c)) return false; }catch(_){ }
  return true;
}

/* The wording this upload DRAWS, and the one place that question is answered.
   `c.redlineText` is what docBodyHtml renders for a structured upload; a
   .docx read as flat text has no stored body and draws its extracted text
   through documentTextHtml. Both branches mirror uploadDocBody exactly, which
   is what lets the read and the paint agree. */
function uploadWordingSource(c){
  if(!c) return null;
  const body = c.redlineText;
  if(body && String(body).trim()){
    let rich = false;
    try{ rich = !!(typeof isRich === 'function' && isRich(c.format)); }catch(_){ rich = /<[a-z][\s\S]*>/i.test(String(body)); }
    return { text: String(body), rich };
  }
  const t = (c.upload && c.upload.extractedText) || '';
  return String(t).trim() ? { text: String(t), rich: false } : null;
}

/* ---- THE READ ----
   Every placeholder in this upload, as the blank shape js/blanks.js speaks —
   so contractBlanks can hand them to the panel, the count and the arrival
   tile without any of the three learning a second vocabulary.

   READING MUST NOT WRITE: nothing here touches the record, the negotiation or
   the page. The detached parse is thrown away. */
function uploadBlanksRead(c){
  if(!uploadBlanksLive(c)) return [];
  const src = uploadWordingSource(c);
  if(!src) return [];
  const nodes = upNodesFrom(src.text, src.rich);
  const fields = (c && c.fields) || {};
  const out = [];
  const seen = new Set();
  upWalk(nodes, ({ key, hit, node, lead, fresh }) => {
    if(!fresh || seen.has(key)) return;               // one box per question; the first wins
    seen.add(key);
    out.push({
      key,
      /* WHERE THE ANSWER IS FILED, and why this one is its own word: a
         `field` blank is our own drafting and a `sync` blank IS the record.
         An `upload` blank is neither — it is a working answer to somebody
         else's placeholder, and fillBlanksFromRecord passes over it for
         exactly that reason. */
      kind: 'upload',
      type: 'text',
      money: false,
      label: (hit.kind === 'named' ? upLabel(hit.name) : upLabel(lead)) || '',
      ph: hit.raw,
      value: String(fields[key] == null ? '' : fields[key]),
      section: (node && node.head) || '',
      declared: false,
    });
  });
  return out;
}

/* How many questions were left out, so a cap is a FACT rather than a silent
   trim. Zero on every real agreement. */
function uploadBlanksOver(c){
  if(!uploadBlanksLive(c)) return 0;
  const src = uploadWordingSource(c);
  if(!src) return 0;
  return upWalk(upNodesFrom(src.text, src.rich)).skipped.size;
}

/* THE ORDERED LIST OF WHAT THE WORDING ASKS — one entry per OCCURRENCE, with
   the key and the exact characters it was read from. It is what makes the
   paint safe, and it is read off the SOURCE, which is the authority. */
function uploadBlankSeq(c){
  if(!uploadBlanksLive(c)) return [];
  const src = uploadWordingSource(c);
  if(!src) return [];
  return upWalk(upNodesFrom(src.text, src.rich)).seq;
}

/* ---- THE MARK ON THE PAPER ----
   Painted onto the canvas after the paint, for the reason at the top of this
   file: nothing serialises a painted canvas, so this cannot travel.

   SCOPED TO THE WORDING. `[data-upwording]` is the container uploadDocBody
   wraps the agreement in, and the scope is what makes the reading safe: a
   signature foot ruled with underscores, the file strip and the seal card all
   sit outside it, and a walk of the whole canvas would offer a box for
   "________ Name".

   IT NEVER MINTS A KEY OF ITS OWN. The keys come from uploadBlankSeq, read
   off the stored wording, and this only has to find the same placeholders in
   the same order on the page. A WALK THAT DISAGREES WITH THE READ BY ONE
   CHARACTER DRAWS NOTHING — ceMarksPaint's own rule, and the reason it is
   safe to say the panel's boxes and the paper's marks are one reading: if the
   renderer ever did move a word, the marks would go quiet rather than land on
   the wrong sentence.

   It takes the contract because the ANSWERS come off the record — the span
   prints what has been typed, so the paper reads back what the panel holds. */
function uploadBlanksClear(root){
  const host = root || (typeof document !== 'undefined' ? document.getElementById('doc-canvas') : null);
  if(!host || !host.querySelectorAll) return;
  for(const m of host.querySelectorAll('span.' + UP_MARK_CLASS)){
    const p = m.parentNode; if(!p) continue;
    const raw = m.getAttribute('data-upraw');
    /* TWO KINDS OF SPAN, CLEARED IN OPPOSITE WAYS. One the painter MADE, which
       goes away whole; one the PAPER OWNS — a Word fill-in field the file
       itself stated — which is the drafter's own element and only ever gives
       up what the paint put on it. Unwrapping that one would delete a fact the
       document carries. */
    if(!m.hasAttribute(UP_MADE_ATTR)){
      m.classList.remove(UP_MARK_CLASS, 'is-filled');
      m.removeAttribute('data-upblank');
      m.removeAttribute('data-upraw');
      if(raw != null && (m.textContent || '') !== raw) m.textContent = raw;
      continue;
    }
    /* PUT THE PLACEHOLDER BACK, NOT THE ANSWER. The span may be printing what
       somebody typed, and unwrapping that would write their working note into
       the other side's paper on the page — which is the one thing this file
       exists not to do. The characters it was made from ride on the element. */
    p.insertBefore(document.createTextNode(raw == null ? (m.textContent || '') : raw), m);
    p.removeChild(m);
    try{ p.normalize(); }catch(_){ }
  }
}

function uploadBlanksPaint(c){
  if(typeof document === 'undefined') return 0;
  const canvas = document.getElementById('doc-canvas');
  if(!canvas) return 0;
  uploadBlanksClear(canvas);
  if(!uploadBlanksLive(c)) return 0;
  const host = canvas.querySelector('[data-upwording]');
  if(!host) return 0;
  const seq = uploadBlankSeq(c);
  if(!seq.length) return 0;
  /* Collected first and mutated after: replacing a text node under a live
     TreeWalker is what makes a walk skip half the page. docDutyPaperPaint
     records the same lesson. */
  const found = [];
  for(const node of upNodesOf(host)){
    for(const h of upNodeHits(node)) found.push({ node: node.node, hit: h, field: !!node.field });
  }
  if(found.length !== seq.length) return 0;            // the wall — see above
  for(let i = 0; i < found.length; i++) if(found[i].hit.raw !== seq[i].raw) return 0;
  const fields = (c && c.fields) || {};
  const jobs = new Map();
  let marks = 0;
  for(let i = 0; i < found.length; i++){
    const { node, hit, field } = found[i];
    if(!node || !node.parentNode) return 0;
    /* A FIELD IS MARKED IN PLACE. The paper already carries an element for it,
       with its own identity and possibly its own bold or italic inside, so the
       paint hangs on that rather than splicing its characters — which is also
       what makes the clear above able to give it back untouched. */
    if(field){
      const key = seq[i].key;
      if(!node.hasAttribute('data-upraw')) node.setAttribute('data-upraw', node.textContent || '');
      const raw = node.getAttribute('data-upraw') || '';
      const v = String(fields[key] == null ? '' : fields[key]).trim();
      node.setAttribute('data-upblank', key);
      node.classList.add(UP_MARK_CLASS);
      node.classList.toggle('is-filled', !!v);
      if((node.textContent || '') !== (v || raw)) node.textContent = v || raw;
      marks++;
      continue;
    }
    let list = jobs.get(node);
    if(!list){ list = []; jobs.set(node, list); }
    list.push({ key: seq[i].key, hit });
  }
  for(const [textNode, list] of jobs){
    if(!textNode.parentNode) continue;
    const txt = textNode.data;
    const frag = document.createDocumentFragment();
    let at = 0;
    for(const { key, hit } of list){
      if(hit.s < at) continue;
      if(hit.s > at) frag.appendChild(document.createTextNode(txt.slice(at, hit.s)));
      const sp = document.createElement('span');
      sp.className = UP_MARK_CLASS;
      sp.setAttribute('data-upblank', key);
      sp.setAttribute('data-upraw', hit.raw);
      sp.setAttribute(UP_MADE_ATTR, '1');      // this one is ours to unwrap
      const v = String(fields[key] == null ? '' : fields[key]).trim();
      if(v) sp.classList.add('is-filled');
      /* NEVER innerHTML. The words being printed are the other side's, or the
         reader's own typing, and either becoming markup on the paper is the
         fault DOC_DUTY_PAPER's note names. */
      sp.textContent = v || hit.raw;
      frag.appendChild(sp); marks++;
      at = hit.e;
    }
    if(at < txt.length) frag.appendChild(document.createTextNode(txt.slice(at)));
    textNode.parentNode.replaceChild(frag, textNode);
  }
  return marks;
}

/* THE PAPER READS BACK WHAT THE PANEL HOLDS, in the same breath and without a
   repaint: the panel's box is under the reader's hand and rebuilding the page
   around it is the `keepView` lesson the clause editor paid for twice. Every
   span carrying this key is answered, because a named placeholder repeated
   through a document is ONE question. */
function uploadBlankPaint(key, value){
  if(typeof document === 'undefined' || !key) return 0;
  const canvas = document.getElementById('doc-canvas');
  if(!canvas) return 0;
  const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(String(key)) : String(key).replace(/["\\]/g, '\\$&');
  const v = String(value == null ? '' : value).trim();
  let n = 0;
  for(const sp of canvas.querySelectorAll(`span.${UP_MARK_CLASS}[data-upblank="${q}"]`)){
    const raw = sp.getAttribute('data-upraw') || '';
    /* Both kinds answer here — the painter's own span and the paper's own
       field — because both carry the key and both print the answer. */
    sp.textContent = v || raw;
    sp.classList.toggle('is-filled', !!v);
    n++;
  }
  return n;
}

if(typeof window !== 'undefined') Object.assign(window, {
  UP_BRACKET_RE, UP_BRACE_RE, UP_RULE_RE, UP_MARKER_RE,
  UP_BLANK_MAX, UP_KEY_MAX, UP_LEAD_WORDS, UP_SKIP_SEL, UP_MARK_CLASS, UP_MADE_ATTR,
  upFieldClass, upFieldSel, upFieldNameAttr, UP_WORD_STOCK, upStockPrompt,
  upFold, upLabel, upLead, upHits, upNodeHits, upKeyMint, upWalk, upNodesFrom, upNodesOf, upEntities,
  uploadBlanksTheirs, uploadBlanksLive, uploadWordingSource, uploadBlanksRead, uploadBlanksOver, uploadBlankSeq,
  uploadBlanksClear, uploadBlanksPaint, uploadBlankPaint,
});
