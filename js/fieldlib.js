// HaTi — the Template Library field catalogue. ONE registry, used by the
// browser (form rendering + immediate validation) and required directly by
// the server (the re-check that counts). Adding a future field type — a
// Swedish organisationsnummer, say — is a single entry here, nowhere else.
//
// Each entry: label (what the field-type picker shows), input (which control
// the form renders), hint (placeholder-grade guidance), validate(s) → null
// when acceptable, otherwise a human-readable problem with the value.
// validate() receives a trimmed, non-empty string — emptiness is a
// `required` question answered by the caller, not a type question.

/* A calendar-date check with no dependencies on either side of the wire:
   ISO first, then the shapes a person actually types. Outside those, "we do
   not know" — which is a refusal here, not a guess (see dateOnly in
   server.js for the reasoning this mirrors). */
function fieldLibDateOk(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return !isNaN(Date.parse(s + 'T00:00:00'));
  const shapes = [
    /^(\d{1,2})(?:st|nd|rd|th)?[ .\-]+([A-Za-z]{3,9})\.?,?[ .\-]+(\d{4})$/,
    /^([A-Za-z]{3,9})\.?[ .\-]+(\d{1,2})(?:st|nd|rd|th)?,?[ .\-]+(\d{4})$/,
    /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/,
  ];
  if (!shapes.some(re => re.test(s))) return false;
  return !isNaN(Date.parse(s));
}

const FIELD_LIB = {
  short_text: { label: 'Short text', input: 'text', hint: '',
    validate: s => s.length <= 300 ? null : 'Keep it under 300 characters' },
  long_text: { label: 'Long text', input: 'textarea', hint: '',
    validate: s => s.length <= 10000 ? null : 'Keep it under 10,000 characters' },
  /* The hints are getters for the same reason `currency`'s label is: they name
     a market, and the market is a setting. Read lazily so this file still loads
     where jurisdiction.js has not (the server requires it directly), falling
     back to the shape it always showed. */
  email: { label: 'Email', input: 'email',
    get hint(){ return (typeof jxEg==='function' && jxEg('email')) || 'name@company.co.ke'; },
    validate: s => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s) ? null : 'Enter a valid email address' },
  phone: { label: 'Phone', input: 'tel',
    get hint(){ return (typeof jxEg==='function' && jxEg('phone')) || '+254 700 000000'; },
    validate: s => /^\+?[0-9 ()\-]{7,20}$/.test(s) ? null : 'Enter a valid phone number' },
  date: { label: 'Date', input: 'date', hint: 'YYYY-MM-DD',
    validate: s => fieldLibDateOk(s) ? null : 'Enter a real calendar date' },
  number: { label: 'Number', input: 'text', hint: '',
    validate: s => Number.isFinite(Number(s.replace(/,/g, ''))) ? null : 'Enter a number' },
  currency: { get label(){ return `Amount (${jxCurrency()})`; }, input: 'text', hint: 'e.g. 2,500,000',
    validate: s => { const n = Number(s.replace(/[, ]/g, '')); return Number.isFinite(n) && n >= 0 ? null : 'Enter a non-negative amount'; } },
  address: { label: 'Address', input: 'textarea',
    get hint(){ return (typeof jxEg==='function' && jxEg('address')) || 'Street, town, county'; },
    validate: s => s.length >= 4 ? null : 'Enter an address' },
  national_id: { label: 'National ID', input: 'text', hint: 'e.g. 12345678',
    validate: s => /^[0-9]{6,10}$/.test(s) ? null : 'Enter a 6–10 digit ID number' },
  kenya_tax_id: { label: 'KRA PIN', input: 'text', hint: 'A123456789B',
    validate: s => /^[AP][0-9]{9}[A-Z]$/i.test(s) ? null : 'A KRA PIN looks like A123456789B' },
  /* The Swedish company number, added as its own type rather than by widening
     kenya_tax_id: a template that asks for a KRA PIN must keep rejecting an
     organisationsnummer and the other way round, or the check stops meaning
     anything. Shape only, like the KRA PIN above — the Luhn check digit is a
     stricter test than this catalogue makes anywhere else, and a registry
     lookup is the only thing that would actually prove the number is real. */
  sweden_tax_id: { label: 'Organisationsnummer', input: 'text', hint: '556016-0680',
    validate: s => /^\d{6}-?\d{4}$/.test(s.replace(/\s/g, '')) ? null
      : 'An organisationsnummer looks like 556016-0680' },
  company_reg_number: { label: 'Company reg. number', input: 'text', hint: 'e.g. PVT-ABC1234 or C.123456',
    validate: s => s.length >= 3 ? null : 'Enter the registration number' },
  select: { label: 'Choice', input: 'select', hint: '',
    validate: () => null }, // membership in the approved options is the caller's check
  file_attachment: { label: 'File attachment', input: 'file', hint: '',
    validate: s => /^data:[\w.+-]+\/[\w.+-]+;base64,/.test(s) ? null : 'Attach a file' },
  stamp_image: { label: 'Company stamp', input: 'image', hint: '',
    validate: s => /^data:image\/(png|jpe?g|webp);base64,/.test(s) ? null : 'Attach a stamp image (PNG or JPEG)' },
  signature_name_title: { label: 'Signature (name + title)', input: 'signature', hint: '',
    validate: () => null }, // captured by the signing flow, never typed
};

/* One answer for "is this value acceptable for this field?" — same code on
   both sides of the wire. `field` uses the template_fields shape:
   { label, field_key, field_type, control, options, required }. */
function fieldLibValidate(field, value) {
  const s = value == null ? '' : String(value).trim();
  if (!s) return field.required ? `${field.label || field.field_key} is required` : null;
  if (field.control === 'guided') {
    const opts = Array.isArray(field.options) ? field.options.map(String) : [];
    return opts.includes(s) ? null : 'Choose one of the approved options';
  }
  const t = FIELD_LIB[field.field_type];
  if (!t) return null; // an unknown type never traps the record
  return t.validate(s);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { FIELD_LIB, fieldLibValidate, fieldLibDateOk };
if (typeof window !== 'undefined') Object.assign(window, { FIELD_LIB, fieldLibValidate, fieldLibDateOk });
