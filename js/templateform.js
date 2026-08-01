// HaTi — template-form rendering and validation. ONE module for both sides
// of the wire (window global in the browser, CommonJS on the server), because
// the contract's document IS the rendering of its form: whichever side
// regenerates it must produce the same wording, or the two screens drift.
//
// A contract created from a library template carries `c.templateForm`:
//   { templateId, templateVersionId, templateName, versionNumber,
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
  if (v) return TPLFORM_ESC(v);
  const key = field && /^[a-z][a-z0-9_]{0,63}$/.test(String(field.fieldKey || '')) ? ` data-field-key="${field.fieldKey}"` : '';
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
  let first = true;
  for (const b of blocks) {
    if (b.blockType === 'branding') continue; // the header renders from org_branding, outside the body
    if (b.blockType === 'heading') {
      const h = tplFormSubstitute(TPLFORM_ESC(b.content), fields, values);
      out.push(first ? `<h1>${h}</h1>` : `<h2>${h}</h2>`);
      first = false;
      continue;
    }
    first = false;
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
  return `<div style="display:flex;align-items:center;gap:14px;padding:0 0 16px;margin-bottom:18px;border-bottom:2px solid var(--color-doc-rule,#d8d5cd)">
    ${logoOk ? `<img src="${b.logoUrl}" alt="" style="max-height:52px;max-width:160px;flex:none">` : ''}
    <div style="min-width:0;flex:1">
      ${b.companyName ? `<div style="font-family:var(--font-heading,inherit);font-weight:700;font-size:15px">${TPLFORM_ESC(b.companyName)}</div>` : ''}
      ${b.registrationNumber || b.address ? `<div style="font-size:10.5px;color:#6b6f76;line-height:1.45">${[b.registrationNumber, b.address].filter(Boolean).map(TPLFORM_ESC).join(' · ')}</div>` : ''}
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
  return `<div style="margin-top:22px;padding-top:10px;border-top:1px solid var(--color-doc-rule,#d8d5cd);font-size:9.5px;color:#6b6f76;text-align:center">${TPLFORM_ESC(b.footerText)}</div>`;
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = { templateFormDocHtml, templateFormResolveDefaults, templateFormProblems, templateFormStripMarker };
if (typeof window !== 'undefined')
  Object.assign(window, { templateFormDocHtml, templateFormResolveDefaults, templateFormProblems,
    templateFormStripMarker, templateBrandingHeaderHtml, templateBrandingFooterHtml });
