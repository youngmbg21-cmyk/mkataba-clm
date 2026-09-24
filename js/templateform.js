// HaTi — template-form rendering and validation. ONE module for both sides
// of the wire (window global in the browser, CommonJS on the server), because
// the contract's document IS the rendering of its form: whichever side
// regenerates it must produce the same wording, or the two screens drift.
//
// A contract created from a library template carries `c.templateForm`:
//   { templateId, templateVersionId, templateName, templateOrigin, versionNumber,
//     blocks: [{orderIndex, blockType, content}],
//     fields: [{fieldKey, label, section, fieldType, control, options,
//               required, defaultValue, helpText}],
//     values: { fieldKey: string } }
// This is a COPY — the parent template can change forever after without
// touching it. The renderer below turns blocks + values into the rich-format
// HTML the rest of the product already knows how to share, sign and export.

const TPLFORM_ESC = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* An unfilled blank renders as the field's label inside the product's one
   allowlisted span class (hati-field, see js/richdoc.js), carrying the field
   key as data-field-key so the document can route a click to the right input
   — visible as a blank to both parties, gone the moment a value lands. */
function tplFormSlot(field, value) {
  const v = value == null ? '' : String(value).trim();
  const key = field && /^[a-z][a-z0-9_]{0,63}$/.test(String(field.fieldKey || '')) ? ` data-field-key="${field.fieldKey}"` : '';
  /* ---- AN ANSWERED TERM STILL KNOWS WHICH QUESTION IT ANSWERS (Young
     reported it 20 Sep 2026: "whenever I click on any entry field, whether
     filled in or not, it should take me to the section in the contract ... That
     is not currently happening") ----
     This printed a filled field as PLAIN ESCAPED TEXT, so the paper carried a
     key for every EMPTY blank and nothing at all for an answered one. The
     form's own cursor-follows-you link then pointed at half its boxes and was
     silent on the rest — and silent is how it read, because a key nothing
     matches is not an error anywhere in that machinery.

     `hati-field-done` CARRIES NO RULE, so the term is painted exactly as it
     was: part of its sentence, never a grey gap. And it is deliberately NOT
     `hati-field`, which would give an answered term the blank's own dressing,
     its pointer, its hover AND its click-to-type — three screens' behaviour
     changed to fix a fourth. What it carries is the key, and nothing else. */
  if (v) return key ? `<span class="hati-field-done"${key}>${TPLFORM_ESC(v)}</span>` : TPLFORM_ESC(v);
  return `<span class="hati-field"${key}>${TPLFORM_ESC((field && field.label) || 'to be completed')}</span>`;
}

/* The blank an ORPHANED marker leaves behind. Raw {{syntax}} never reaches a
   document: a marker whose field no longer exists renders as a plain visible
   blank — the last line of defence behind delete-time cleanup and the
   publish-time consistency check. */
const TPLFORM_ORPHAN_BLANK = '———';
function templateFormStripMarker(content, fieldKey) {
  if (!fieldKey) return String(content == null ? '' : content);
  return String(content == null ? '' : content).split(`{{${fieldKey}}}`).join(TPLFORM_ORPHAN_BLANK);
}

function tplFormSubstitute(content, fields, values) {
  return String(content || '').replace(/\{\{([a-z0-9_.]+)\}\}/gi, (m, key) => {
    const f = fields.find(x => x.fieldKey === key);
    if (!f) return `<span class="hati-field">${TPLFORM_ORPHAN_BLANK}</span>`;
    return tplFormSlot(f, values[key]);
  });
}

/* ---- THE CLAUSE NUMBER THE DOCUMENT PRINTS (18 Sep 2026) ----
   REPORTED as the third of the seven repairs: *"the section numbers on the
   paper are drawn by the screen, not stored in the template — so a contract
   published from it has unnumbered headings."*  Storing the number in the
   heading's own text was the other answer and is the worse one: re-opening the
   builder would then draw its own number over the stored one, and a heading is
   re-typed far more often than a template is published.

   So the number is DERIVED, here, in the one renderer the server and the
   browser share — and the builder's paper asks the same two readings, so what
   an author sees while writing is what gets published.

   THE FIRST HEADING IS THE DOCUMENT'S TITLE (the rule right below this, and
   older than this note), and a title carries no clause number. The rest number
   from 1.

   A HEADING CARRYING ITS OWN NUMBER KEEPS IT, which is `clauseNameShown`'s own
   rule: that punctuation is a QUOTATION of the drafter's. Conservative on
   purpose — a bare leading year ("2019 Data Protection Act") is a TITLE, not a
   number, so it is numbered like any other. */
const tplFormHeadingNumbered = h => {
  const t = String(h == null ? '' : h).trim();
  if (/^(?:article|section|clause|schedule|annexe?|annexure|part|appendix)\s+[\dIVXLivxl]+\b/i.test(t)) return true;
  const m = /^(\()?(\d+(?:\.\d+)*)(\))?\s*([.):\u2013\u2014-])?/.exec(t);
  return !!m && (!!m[3] || !!m[4] || m[2].includes('.'));
};

/* ---- WHICH LINE IS THE DOCUMENT'S TITLE (Young asked 24 Sep 2026: "A
   template written from scratch shows its first section heading, such as
   'Parties', as the published contract's title.") ----
   The rule above — the first heading is the title — is the rule of a COPIED
   document: a file, a contract or HaTi's own paper opens with its own name,
   and the clauses under it are numbered. A template WRITTEN IN HaTi opens with
   its first section ("Parties"), and its title is the name it was given. The
   builder's paper has always drawn that name above the sections, so the author
   read one document and the published contract printed another: "Parties" as
   the title, and every section one number low.

   ONE READING, asked by the renderer below and by the builder's paper, so what
   an author sees is what prints. It decides nothing about wording — only which
   line is the title and the number each heading prints.

   THE ORIGIN IS THE FACT IT RESTS ON. `upload` and `saved_from_contract` are
   documents and keep the rule above. `built_in_hati` is what the create route
   records for paper written in HaTi — from scratch, by hand, or one of HaTi's
   own made ours — and only HaTi's own opens with a title of its own. That one
   is told apart by what it carries, never by a guess at its words: its first
   heading reads the template's own name, or carries no number while most of
   the headings under it do (HaTi's paper numbers every clause, "1.
   Definitions") — which still holds after the template is renamed. A form
   with NO origin — every contract minted before this — keeps the rule above,
   so no contract's wording moves when it is drawn again. A copied document
   (any rich block) carries its own title and its own numbers. */
const TPLFORM_WRITTEN_HERE = 'built_in_hati';
const tplFormFold = s => String(s == null ? '' : s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function tplFormNameIsTitle(blocks, name, origin) {
  if (origin !== TPLFORM_WRITTEN_HERE || !String(name == null ? '' : name).trim()) return false;
  const list = (blocks || []).filter(b => b && b.blockType !== 'branding');
  if (list.some(tplFormRich)) return false;
  const lead = list[0];
  if (lead && lead.blockType === 'heading') {
    if (tplFormFold(lead.content) === tplFormFold(name)) return false;
    const later = list.slice(1).filter(b => b.blockType === 'heading');
    const own = later.filter(b => tplFormHeadingNumbered(b.content)).length;
    if (!tplFormHeadingNumbered(lead.content) && own * 2 > later.length) return false;
  }
  return true;
}
/* The plan both drawers follow, in the order they are given: `title` is the
   line printed ABOVE every block (the template's name) or null, and `marks[i]`
   says of each plain heading whether it is the title and the number it
   prints. The walk is the renderer's own, step for step — a branding block is
   not part of the body, and anything else before the first heading means the
   document opens with wording and has no heading for a title. */
function tplFormHeads(blocks, name, origin) {
  const list = blocks || [];
  const byName = tplFormNameIsTitle(list, name, origin);
  const own = tplFormNumbersOff(list);
  const marks = []; let first = true; let clause = 0;
  list.forEach((b, i) => {
    marks[i] = null;
    if (!b || b.blockType === 'branding') return;
    if (tplFormRich(b) && b.blockType !== 'signature_block') { first = false; return; }
    if (b.blockType === 'heading') {
      if (first && !byName) { marks[i] = { title: true, no: '' }; first = false; return; }
      first = false; clause++;
      marks[i] = { title: false, no: (own || tplFormHeadingNumbered(b.content)) ? '' : clause + '.' };
      return;
    }
    first = false;
  });
  return { title: byName ? String(name).trim() : null, marks };
}

/* ═══════ A TEMPLATE KEEPS THE DOCUMENT IT WAS COPIED FROM (Young's go on "One
   Door to Standards", 24 Sep 2026) ═══════
   A template block used to be PLAIN TEXT, and nothing else could be stored:
   a heading was a line, wording was paragraphs of characters. So every door
   that turned a real document into a standard had to throw its shape away —
   "Save as template" dropped all 47 tables of the SaaS agreement, and the
   Copilot conversion re-typed a 100-page file and ran out of room.

   A BLOCK MAY NOW BE `format: 'rich'`: its content is the document's own
   markup — a heading element as the file set it, or the paragraphs, lists
   and tables under it — through the SAME allowlist every contract body goes
   through (js/richdoc.js). Plain blocks are untouched and still the default:
   absent means plain, on every template stored before this.

   TWO RULES CARRY IT.
     · IT IS RENDERED VERBATIM, then the blanks. A copied document numbers
       itself — the numbers are part of its wording — so where a template holds
       a rich heading HaTi adds no number to ANY heading (tplFormNumbersOff),
       or a copied "3.4" would print as "7. 3.4".
     · THE ALLOWLIST RUNS HERE, on both hosts. The server's PUT route asks it
       before anything is stored and this renderer asks it again on the way
       out — storage is never trusted at render time. It is a REBUILD, not a
       filter: a tag off the list is dropped whole, and every attribute is
       re-derived from a value this code checked. It carries no data-clause-id:
       a template is not a contract, and each contract mints its own. */
const TPLFORM_RICH = 'rich';
const tplFormRich = b => !!b && b.format === TPLFORM_RICH;
/* A block's own ceiling for rich markup. Wider than the plain one because
   markup is longer than its words; a copied table larger than this is split by
   rows before it gets here (tplFormCopyBlocks), never cut. */
const TPLFORM_RICH_MAX = 120000;
/* THE SAME LIST AS js/richdoc.js's RICH_TAGS / RICH_SHAPE_CLASSES / the span
   classes, lower-cased. The server cannot load that file (it needs a DOM), so
   the list is written twice — and f375 compares the two SETS, so they cannot
   drift without a red check. */
const TPLFORM_RICH_TAGS = new Set(['p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'pre', 'span']);
const TPLFORM_SHAPES = new Set(['hati-lv-1', 'hati-lv-2', 'hati-lv-3', 'hati-tight', 'hati-pb', 'hati-toc']);
const TPLFORM_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;
const tplFormSpanClassOk = v => v === 'hati-field' || v === 'hati-toc-n' || v === 'hati-wfield' || v === 'hati-field-done'
  || /^hati-ink-(?:blue|violet|plum|ochre|grey)$/.test(v) || /^hati-hl-(?:yellow|blue|violet|grey)$/.test(v)
  || /^hati-fs-(?:9|10|11|12|14|16|18|20|24|28)$/.test(v);
function tplFormAttrs(tag) {
  const out = {};
  const inner = String(tag).replace(/^<\s*[a-zA-Z][a-zA-Z0-9]*/, '').replace(/\/?\s*>?$/, '');
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(inner))) {
    const k = m[1].toLowerCase();
    if (!(k in out)) out[k] = m[2] != null ? m[2] : m[3] != null ? m[3] : (m[4] || '');
  }
  return out;
}
function tplFormRichSafe(html) {
  const src = String(html == null ? '' : html).slice(0, TPLFORM_RICH_MAX)
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    /* What these carry is code, never wording — dropped WITH their contents. */
    .replace(/<(script|style|template|iframe|object|embed|svg|math|noscript|textarea|title|head|select|button)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, '');
  return src.replace(/<[^>]*>?/g, tag => {
    const m = /^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)/.exec(tag);
    if (!m) return '';
    const name = m[2].toLowerCase();
    if (!TPLFORM_RICH_TAGS.has(name)) return '';
    if (name === 'br') return m[1] ? '' : '<br>';
    if (m[1]) return `</${name}>`;
    const a = tplFormAttrs(tag); let keep = '';
    if (name === 'p') {
      const cls = Array.from(new Set(String(a.class || '').split(/\s+/).filter(x => TPLFORM_SHAPES.has(x))));
      if (cls.length) keep = ` class="${cls.join(' ')}"`;
    } else if (name === 'ol') {
      if (/^\d{1,4}$/.test(a.start || '')) keep += ` start="${a.start}"`;
      if (/^[1aAiI]$/.test(a.type || '')) keep += ` type="${a.type}"`;
    } else if (name === 'span') {
      const cls = String(a.class || '').trim();
      if (tplFormSpanClassOk(cls)) {
        keep = ` class="${cls}"`;
        if ((cls === 'hati-field' || cls === 'hati-field-done') && TPLFORM_KEY_RE.test(a['data-field-key'] || ''))
          keep += ` data-field-key="${a['data-field-key']}"`;
        if (cls === 'hati-wfield' && TPLFORM_KEY_RE.test(a['data-wfield'] || ''))
          keep += ` data-wfield="${a['data-wfield']}"`;
      }
    }
    return `<${name}${keep}>`;
  });
}
/* Where any heading is the document's own, every number is the document's
   own: HaTi derives none. */
const tplFormNumbersOff = blocks => (blocks || []).some(b => b && b.blockType === 'heading' && tplFormRich(b));
/* ---- ONE TEXT PROJECTION OF A BLOCK ----
   What the builder's Copilot, its playbook count and its section list read. A
   plain block IS its text; a rich one is its markup read as the words a person
   sees — a paragraph a line, a table cell a tab. */
const TPLFORM_ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&#160;': ' ' };
function tplFormRichText(html) {
  return String(html == null ? '' : html)
    .replace(/<\/(p|h[1-4]|li|tr|blockquote|pre)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '\t')
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp|#160);/g, m => TPLFORM_ENT[m])
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
const tplFormBlockText = b => (tplFormRich(b) ? tplFormRichText(b.content) : String((b && b.content) || ''));
/* ---- A WORD IN THE WORDING, NEVER IN THE MARKUP ----
   Turning "nShift Group A/S" into a blank is a literal replacement, and in a
   rich block it must only ever touch the TEXT between tags — never a class
   name or an attribute. The text is stored escaped, so the needle is escaped
   the same way. A phrase split across two inline tags is not found, and is not
   counted either: the count is what WILL be replaced, never more. */
function tplFormRichReplace(html, find, repl) {
  const f = TPLFORM_ESC(find);
  if (!f) return { html: String(html == null ? '' : html), n: 0 };
  let n = 0;
  const out = String(html == null ? '' : html).split(/(<[^>]*>)/).map(seg => {
    if (!seg || seg[0] === '<') return seg;
    const parts = seg.split(f); n += parts.length - 1;
    return repl == null ? seg : parts.join(repl);
  }).join('');
  return { html: out, n };
}
/* The same act over ANY block — plain or rich — so no caller asks which. */
function tplFormBlockReplace(b, find, repl) {
  if (!b || !find) return { content: (b && b.content) || '', n: 0 };
  if (tplFormRich(b)) { const r = tplFormRichReplace(b.content, find, repl); return { content: r.html, n: r.n }; }
  const parts = String(b.content || '').split(String(find));
  return { content: repl == null ? String(b.content || '') : parts.join(repl), n: parts.length - 1 };
}

/* ═══════ THE COPIER — a document becomes blocks, word for word ═══════
   Headings, numbers and tables are the file's; HaTi only decides where one
   SECTION ends and the next begins, which is at a heading. The text never
   moves: every piece of markup lands in exactly one block, in order, and the
   blocks joined back together are the document.

   A SECTION BODY IS BOUNDED, so a long clause becomes two blocks under one
   heading rather than one block the PUT route would have to cut. A table
   larger than a block is split between ROWS into two tables, never inside one.
   And a document with more headings than a version may hold keeps its minor
   headings inside the section body instead — still headings, still printed,
   just not each a section of its own. */
const TPLFORM_COPY_BODY_MAX = 40000;
const TPLFORM_COPY_MAX_BLOCKS = 480;
const TPLFORM_VOID = new Set(['br']);
function tplFormSplitRich(html) {
  const s = String(html == null ? '' : html); const out = [];
  let depth = 0, start = -1, top = null, last = 0;
  const loose = (a, b) => { const t = s.slice(a, b); if (t.trim()) out.push({ tag: 'p', html: `<p>${t.trim()}</p>` }); };
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g; let m;
  while ((m = re.exec(s))) {
    const name = m[1].toLowerCase(); const close = m[0][1] === '/';
    if (TPLFORM_VOID.has(name)) {
      if (depth === 0) { loose(last, m.index); out.push({ tag: 'br', html: '<br>' }); last = re.lastIndex; }
      continue;
    }
    if (!close) { if (depth === 0) { loose(last, m.index); start = m.index; top = name; } depth++; continue; }
    if (depth === 0) continue;               /* a stray closer at the top level carries nothing */
    depth--;
    if (depth === 0 && start >= 0) { out.push({ tag: top, html: s.slice(start, re.lastIndex) }); start = -1; top = null; last = re.lastIndex; }
  }
  if (start >= 0) out.push({ tag: top, html: s.slice(start) });
  else loose(last, s.length);
  return out;
}
/* A table too long for one block, cut between rows. The head row travels with
   every half, so each reads as the table it is part of. */
function tplFormSplitTable(html, max) {
  const rows = String(html).match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  if (rows.length < 2) return [html];
  const head = /<th\b/i.test(rows[0]) ? rows[0] : '';
  const body = head ? rows.slice(1) : rows;
  const out = []; let cur = [];
  const push = () => { if (cur.length) out.push(`<table><tbody>${head}${cur.join('')}</tbody></table>`); cur = []; };
  for (const r of body) { if (cur.length && (head.length + cur.join('').length + r.length) > max) push(); cur.push(r); }
  push();
  return out;
}
function tplFormCopyBlocks(html, opts = {}) {
  const max = opts.maxBlocks || TPLFORM_COPY_MAX_BLOCKS;
  const cap = opts.bodyMax || TPLFORM_COPY_BODY_MAX;
  const pieces = [];
  for (const p of tplFormSplitRich(html)) {
    if (p.tag === 'table' && p.html.length > cap) tplFormSplitTable(p.html, cap).forEach(t => pieces.push({ tag: 'table', html: t }));
    else pieces.push(p);
  }
  const levels = [['h1', 'h2', 'h3', 'h4'], ['h1', 'h2', 'h3'], ['h1', 'h2'], ['h1'], []];
  let blocks = [];
  for (const lv of levels) {
    blocks = []; let body = []; let size = 0;
    const flush = () => {
      if (!body.length) return;
      const content = body.join('');
      blocks.push({ blockType: /\{\{[a-z0-9_.]+\}\}/i.test(content) ? 'field_group' : 'fixed_text', format: TPLFORM_RICH, content });
      body = []; size = 0;
    };
    for (const p of pieces) {
      /* A heading with no words (Word's empty "Heading 2" line, kept for
         spacing) opens no section: it stays where it is, inside the body. */
      if (lv.includes(p.tag) && tplFormRichText(p.html)) {
        flush(); blocks.push({ blockType: 'heading', format: TPLFORM_RICH, content: p.html }); continue;
      }
      if (body.length && size + p.html.length > cap) flush();
      body.push(p.html); size += p.html.length;
    }
    flush();
    if (blocks.length <= max) break;
  }
  return blocks;
}

/* blocks + values → the contract's rich HTML body. Fixed wording arrives
   escaped (template content is plain text with placeholders); paragraph
   breaks inside one block become separate <p>s. */
function templateFormDocHtml(form) {
  const fields = (form && form.fields) || [];
  const values = (form && form.values) || {};
  const out = [];
  // escape first, substitute second — {{placeholders}} contain no markup
  // characters, so they survive the escaping pass for substitution to find
  const paras = text => String(text || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${tplFormSubstitute(TPLFORM_ESC(p), fields, values).replace(/\n/g, '<br>')}</p>`);
  const blocks = ((form && form.blocks) || []).slice().sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  /* Which line is the title and the number each heading prints — the one
     reading the builder's paper asks too (tplFormHeads, above). */
  const plan = tplFormHeads(blocks, form && form.templateName, form && form.templateOrigin);
  if (plan.title) out.push(`<h1>${TPLFORM_ESC(plan.title)}</h1>`);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.blockType === 'branding') continue; // the header renders from org_branding, outside the body
    /* THE DOCUMENT'S OWN MARKUP, verbatim through the allowlist, then the
       blanks — a copied heading keeps its level and its number, a copied table
       its rows. See TPLFORM_RICH above. */
    if (tplFormRich(b) && b.blockType !== 'signature_block') {
      out.push(tplFormSubstitute(tplFormRichSafe(b.content), fields, values));
      continue;
    }
    if (b.blockType === 'heading') {
      const h = tplFormSubstitute(TPLFORM_ESC(b.content), fields, values);
      const m = plan.marks[i] || { title: false, no: '' };
      out.push(m.title ? `<h1>${h}</h1>` : `<h2>${m.no ? m.no + ' ' : ''}${h}</h2>`);
      continue;
    }
    if (b.blockType === 'signature_block') {
      const party = TPLFORM_ESC(b.content || 'Signature');
      out.push(`<p><strong>Signed for ${party}</strong><br>Name: <span class="hati-field">full name</span><br>Title: <span class="hati-field">job title</span><br>Signature: <span class="hati-field">signature</span></p>`);
      continue;
    }
    // fixed_text and field_group — same rendering; field_group just has blanks
    out.push(...paras(b.content));
  }
  return out.join('');
}

/* Resolve default values for a fresh contract. `{{org.some_key}}` reads the
   org profile (org_profile_values with org_branding as the built-in base);
   anything else is a literal default. Unresolvable placeholders resolve to
   empty — an honest blank, never literal {{org.x}} syntax on a document. */
function templateFormResolveDefaults(fields, orgValues) {
  const values = {};
  for (const f of fields || []) {
    const d = f.defaultValue == null ? '' : String(f.defaultValue).trim();
    if (!d) continue;
    const resolved = d.replace(/\{\{org\.([a-z0-9_]+)\}\}/gi,
      (_, key) => (orgValues && orgValues[key] != null ? String(orgValues[key]) : ''));
    const v = resolved.trim();
    if (v) values[f.fieldKey] = v;
  }
  return values;
}

/* Validate a full form (fieldLibValidate is the shared single registry —
   js/fieldlib.js). Returns [{fieldKey, label, problem}]; empty = fine. */
function templateFormProblems(form, validate) {
  const v = validate
    || (typeof fieldLibValidate === 'function' ? fieldLibValidate
      : (typeof window !== 'undefined' && window.fieldLibValidate));
  const out = [];
  const values = (form && form.values) || {};
  for (const f of (form && form.fields) || []) {
    if (f.fieldType === 'signature_name_title') continue; // the signing flow captures these
    const problem = v({ label: f.label, field_key: f.fieldKey, field_type: f.fieldType,
      control: f.control, options: f.options, required: f.required }, values[f.fieldKey]);
    if (problem) out.push({ fieldKey: f.fieldKey, label: f.label || f.fieldKey, problem });
  }
  return out;
}

/* The branding letterhead, rendered as chrome ABOVE the document body rather
   than inside it — the rich format rightly drops <img>, so the logo can never
   live in redlineText. Reads the branding snapshot the contract carries
   (stamped at creation), so the portal shows the same letterhead with no
   session and no org routes. Browser-side only; the server never calls it.

   DESIGN-AWARE since the contract-designer feature: when a document design
   is resolvable (js/branding.js — the snapshot's own designId, or the
   company default), the chosen design renders instead, on ANY contract.
   Without one, the behaviour below is byte-for-byte what it always was —
   template contracts get the plain letterhead, everything else stays bare. */
function templateBrandingHeaderHtml(c, opts) {
  if (typeof window !== 'undefined' && window.resolveDocBranding) {
    const db = resolveDocBranding(c);
    if (db && db.designId) return docDesignHeaderHtml(db, c, opts || {});
  }
  const b = c && c.branding;
  if (!c || !c.templateForm || !b) return '';
  if (!b.logoUrl && !b.companyName) return '';
  const logoOk = b.logoUrl && /^data:image\/(png|jpe?g|webp|svg\+xml);base64,/.test(b.logoUrl);
  return `<div style="display:flex;align-items:center;gap:14px;padding:0 0 var(--s-4);margin-bottom:18px;border-bottom:2px solid var(--color-doc-rule,#d8d5cd)">
    ${logoOk ? `<img src="${b.logoUrl}" alt="" style="max-height:52px;max-width:160px;flex:none">` : ''}
    <div style="min-width:0;flex:1">
      ${b.companyName ? `<div style="font-family:var(--font-heading,inherit);font-weight:var(--w-title);font-size:var(--t-card)">${TPLFORM_ESC(b.companyName)}</div>` : ''}
      ${b.registrationNumber || b.address ? `<div style="font-size:var(--t-label);color:var(--color-doc-muted,#6b6f76);line-height:1.45">${[b.registrationNumber, b.address].filter(Boolean).map(TPLFORM_ESC).join(' · ')}</div>` : ''}
    </div>
  </div>`;
}
function templateBrandingFooterHtml(c) {
  if (typeof window !== 'undefined' && window.resolveDocBranding) {
    const db = resolveDocBranding(c);
    if (db && db.designId) return docDesignFooterHtml(db, c);
  }
  const b = c && c.branding;
  if (!c || !c.templateForm || !b || !b.footerText) return '';
  return `<div style="margin-top:22px;padding-top:10px;border-top:1px solid var(--color-doc-rule,#d8d5cd);font-size:var(--t-label);color:var(--color-doc-muted,#6b6f76);text-align:center">${TPLFORM_ESC(b.footerText)}</div>`;
}

/* The rich half is published on both hosts under one set of names: the server's
   PUT route and save-as-template ask the allowlist and the copier, the builder
   asks the projection and the replacement, and a check asks all of them. */
const TPLFORM_RICH_API = { TPLFORM_RICH, TPLFORM_RICH_MAX, TPLFORM_RICH_TAGS, TPLFORM_SHAPES, TPLFORM_COPY_BODY_MAX,
  TPLFORM_COPY_MAX_BLOCKS, tplFormRich, tplFormRichSafe, tplFormNumbersOff, tplFormRichText, tplFormBlockText,
  tplFormRichReplace, tplFormBlockReplace, tplFormSplitRich, tplFormSplitTable, tplFormCopyBlocks, tplFormSpanClassOk };
if (typeof module !== 'undefined' && module.exports)
  module.exports = { templateFormDocHtml, templateFormResolveDefaults, templateFormProblems, templateFormStripMarker, tplFormHeadingNumbered,
    tplFormHeads, tplFormNameIsTitle, ...TPLFORM_RICH_API };
if (typeof window !== 'undefined')
  Object.assign(window, { templateFormDocHtml, templateFormResolveDefaults, templateFormProblems, tplFormHeadingNumbered,
    tplFormHeads, tplFormNameIsTitle,
    templateFormStripMarker, templateBrandingHeaderHtml, templateBrandingFooterHtml, ...TPLFORM_RICH_API });
