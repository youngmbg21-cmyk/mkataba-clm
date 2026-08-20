// HaTi — where this workspace operates. Globals window-attached.
/* ============================================================
   THE WORKSPACE'S OWN JURISDICTION
   ============================================================
   This product was written for one market and said so in about ninety places:
   the Copilot was told "you are helping negotiate a contract governed by Kenyan
   law" on every rewrite, money formatted as KES, the executed copy cited the
   Business Laws (Amendment) Act 2020, the scanner asked whether a lease had
   been stamped under Cap 480, and the playbook's governing-law position was
   "Kenyan law & forum". None of those were settings. They were sentences.

   That is fine right up to the first workspace that is not in Kenya, and then
   every one of them is wrong in the same way and none of them says so. A
   Swedish pilot would have been advised to negotiate for Kenyan courts, in
   shillings, and told its signatures rested on a Kenyan Act.

   So the market is a VALUE now, and this module is where it lives. Everything
   that used to assert Kenya reads from the active pack instead.

   WHAT A PACK IS, AND WHAT IT IS NOT. A pack holds what the app has to know to
   describe a jurisdiction honestly to its user: what the law is called, what
   money looks like, which statute a signature rests on, and which of the
   scanner's jurisdiction-specific checks apply. It does NOT hold legal advice
   invented for a market nobody here has practised in. Where a pack has nothing
   to say — Sweden has no lease stamp duty, so there is no Cap 480 equivalent to
   name — the field is null and the check that depends on it does not run. A
   check that stays quiet is honest; a check that fires with a made-up statute
   name in it is not, and it would be read as advice.

   KENYA IS STILL THE DEFAULT, deliberately. Making the market configurable and
   changing it in the same breath would be two changes wearing one coat: every
   existing workspace's money, playbook and scan would move under it without
   anybody asking. A workspace that never touches the setting behaves exactly as
   it did. Switching is one control in Settings.

   THE FOREIGN-LAW TEST IS RELATIVE NOW, which is the subtle half of this. It
   used to mean "not Kenya" and now means "not home" — so a contract under
   Kenyan law is a FOREIGN-law contract to a Stockholm workspace, and correctly
   flagged as one. `markers` is how a pack recognises itself in a document;
   every other pack's markers, plus the standing list of common seats, are what
   it recognises as somewhere else. */

const JX_LS = 'hati.v1.jurisdiction';

/* Common contract seats that belong to no pack. Any of these in a governing-law
   sentence is foreign to every workspace here — they are listed once rather
   than repeated in each pack, because "is London foreign to us?" has the same
   answer everywhere until somebody ships a London pack. */
const JX_OTHER_SEATS = ['switzerland', 'geneva', 'england', 'wales', 'united kingdom',
  'london', 'delaware', 'new york', 'singapore', 'dubai', 'u.a.e', 'uae', 'netherlands',
  'paris', 'france', 'mauritius', 'india', 'hong kong', 'ireland', 'germany', 'luxembourg'];

const JURISDICTIONS = {
  kenya: {
    id: 'kenya',
    name: 'Kenya',
    adjective: 'Kenyan',
    /* How a governing-law clause names this place, lower-case. The first entry
       is what the app proposes; the rest are how a document may already read. */
    markers: ['kenya', 'kenyan', 'nairobi'],
    currency: 'KES',
    locale: 'en-KE',
    forum: 'the courts of Kenya',
    arbitration: 'arbitration seated in Nairobi under the Nairobi Centre for International Arbitration',
    /* The statute a signature taken in this app rests on. Shown on the executed
       copy and in the evidence pack, so it is a claim and has to be true. */
    esignature: 'Electronic signature under the Business Laws (Amendment) Act 2020 (Kenya).',
    esignatureShort: 'Electronic signatures under the Business Laws (Amendment) Act 2020 (Kenya).',
    dataProtection: 'the Data Protection Act 2019',
    dataProtectionRegulator: 'ODPC',
    /* Null in a pack that has no equivalent, and the check is skipped rather
       than run with a blank in it. */
    stampDuty: { statute: 'Stamp Duty Act, Cap 480',
      consequence: 'An unstamped lease is inadmissible in evidence in Kenya until duty and penalties are paid (Stamp Duty Act, Cap 480).',
      action: 'Ensure stamp duty is assessed and paid via iTax within 30 days of execution.' },
    standardsBody: 'KEBS',
    playbookLabel: 'Kenyan-practice',
    sampleLabel: 'Kenyan FMCG',
    /* ---- what the built-in templates need to say a market's name for ----
       Same discipline as the fields above: a pack states what is true where it
       operates, and where a market has no equivalent the field is null and the
       sentence around it drops that half rather than naming something invented.
       Every one of these used to be a hard-coded Kenyan noun inside a template
       clause, which is how a Swedish workspace ended up with KRA in its lease. */
    incorporatedIn: 'the Republic of Kenya',
    taxAuthority: 'KRA',
    /* The regulator whose licence a food producer holds. Named where the market
       has one name for it; null where the answer is "several bodies, depending",
       and the clause then asks for the licences without naming an issuer. */
    foodSafetyRegulator: 'Public Health',
    /* Bodies whose rules bind a regulated professional adviser. */
    professionalBodies: 'ICPAK / LSK',
    /* Land is the most jurisdiction-bound of these, so both halves are optional:
       the statute a commercial lease sits under, and the court that hears a
       dispute about one. Null in a market where a lease dispute goes to the
       ordinary courts, and the clause then points at the general forum. */
    landStatute: 'the Land Act (2012)',
    landForum: 'the Environment and Land Court at Nairobi',
    /* Placeholder examples shown greyed inside empty template blanks. Not law —
       just the difference between "e.g. Nyanza" reading as helpful or as foreign. */
    egTerritory: 'e.g. Nyanza',
    egRegion: 'e.g. Nairobi to Coast',
    /* The richer form the freight scanner suggests, which names two lanes. */
    egLanes: '“Nairobi – Mombasa primary + coastal secondary”',
    egSite: 'e.g. Industrial Area, Nairobi',
    egPremises: 'e.g. Westlands, Nairobi',
    /* Placeholder shapes in the field catalogue. A Swedish user typing into a
       box hinted "name@company.co.ke" is being shown someone else's country. */
    egEmail: 'name@company.co.ke',
    egPhone: '+254 700 000000',
    egAddress: 'Street, town, county',
    /* The counterparty's address, and a warehouse site: the same placeholder is
       drawn by the wizard, the template form and the library dialog. */
    egTheirEmail: 'them@company.co.ke',
    egWarehouse: 'e.g. Nairobi DC',
    /* Who the DEMO portfolio is signed and commented by. Sample data only —
       a real workspace replaces both the moment it has its own people. */
    egSignatory: 'A. Otieno, Director',
    egReviewer: 'Wanjiku Kamau',
    /* Which entry in the field catalogue asks for this market's company tax
       number. Both types exist in FIELD_LIB; this names the one that belongs. */
    taxIdField: 'kenya_tax_id',
  },
  sweden: {
    id: 'sweden',
    name: 'Sweden',
    adjective: 'Swedish',
    markers: ['sweden', 'swedish', 'sverige', 'stockholm'],
    currency: 'SEK',
    locale: 'sv-SE',
    forum: 'the courts of Sweden',
    arbitration: 'arbitration seated in Stockholm under the Arbitration Institute of the Stockholm Chamber of Commerce',
    /* eIDAS is an EU Regulation and directly applicable in Sweden, so this is a
       statement of what applies rather than a Swedish provision invented here. */
    esignature: 'Electronic signature under Regulation (EU) No 910/2014 (eIDAS), directly applicable in Sweden.',
    esignatureShort: 'Electronic signatures under Regulation (EU) No 910/2014 (eIDAS).',
    dataProtection: 'the GDPR (Regulation (EU) 2016/679)',
    dataProtectionRegulator: 'IMY',
    /* Sweden levies no stamp duty on an ordinary commercial lease, so there is
       nothing here to check and the scanner does not manufacture a finding. */
    stampDuty: null,
    standardsBody: null,
    playbookLabel: 'Swedish-practice',
    sampleLabel: 'Swedish FMCG',
    incorporatedIn: 'Sweden',
    taxAuthority: 'Skatteverket',
    /* Food licensing here is split between the national agency and the municipal
       food-control office, so there is no single name the clause could use the
       way "Public Health" works in Kenya. Null, and the clause asks for the
       licences without naming who issues them — true in both markets. */
    foodSafetyRegulator: null,
    professionalBodies: 'FAR / the Swedish Bar Association',
    /* Deliberately null, both halves. Sweden does have a land code and does have
       land-and-environment courts, but an ordinary commercial lease dispute goes
       to the general courts, so naming either here would put a real statute in
       the wrong clause — the failure this pack exists to prevent. The lease
       clause falls back to the general governing-law sentence. */
    landStatute: null,
    landForum: null,
    egTerritory: 'e.g. Skåne',
    egRegion: 'e.g. Stockholm to Malmö',
    egLanes: '“Stockholm – Malmö primary + southern secondary”',
    egSite: 'e.g. Årsta, Stockholm',
    egPremises: 'e.g. Södermalm, Stockholm',
    egEmail: 'namn@foretag.se',
    egPhone: '+46 70 000 00 00',
    egAddress: 'Street, postcode, town',
    egTheirEmail: 'dem@foretag.se',
    egWarehouse: 'e.g. Stockholm DC',
    egSignatory: 'A. Lindqvist, Director',
    egReviewer: 'Anna Lindqvist',
    taxIdField: 'sweden_tax_id',
  },
};
const JX_DEFAULT = 'kenya';

const jxList = () => Object.keys(JURISDICTIONS).map(k => JURISDICTIONS[k]);
/* The pure form: give it an id, get the pack. The browser resolves the id from
   storage below; server/server.js holds the org record and passes it straight
   in. Both then read ONE table — this file — rather than the server keeping a
   second copy of the market's name, money and statutes that could drift from
   this one without anything noticing. */
const jxPack = id => JURISDICTIONS[id] || JURISDICTIONS[JX_DEFAULT];
/* Reads through the org record first, so a hosted workspace carries its market
   with it rather than per browser; the local key is the static-page fallback
   and the only store a signed-out page has. */
function jxId(){
  try{
    const org = (typeof getOrg === 'function' && getOrg()) || null;
    if (org && org.jurisdiction && JURISDICTIONS[org.jurisdiction]) return org.jurisdiction;
  }catch(e){}
  try{
    const v = (typeof lsGet === 'function' && lsGet(JX_LS)) || null;
    if (v && JURISDICTIONS[v]) return v;
  }catch(e){}
  return JX_DEFAULT;
}
const jx = () => JURISDICTIONS[jxId()] || JURISDICTIONS[JX_DEFAULT];
const jxIs = id => jxId() === id;
function jxSet(id){
  if (!JURISDICTIONS[id]) return false;
  try{ if (typeof lsSet === 'function') lsSet(JX_LS, id); }catch(e){}
  /* Kept on the org too, where there is one, so every member of a workspace
     sees the same market rather than whichever they last set on their laptop. */
  try{
    const org = (typeof getOrg === 'function' && getOrg()) || null;
    if (org){ org.jurisdiction = id;
      if (typeof REMOTE !== 'undefined' && REMOTE && REMOTE.org) REMOTE.org.jurisdiction = id;
      else if (typeof lsSet === 'function' && typeof LS === 'object') lsSet(LS.org, org); }
  }catch(e){}
  /* AND ON THE SERVER, which is the half that was missing: the choice lived
     only in this browser, so every server-built artefact — the executed PDF's
     statute line, the Copilot's market, the playbook's law — fell back to the
     default while the screens said otherwise. Fire-and-forget: the local
     setting above already took effect, and bootstrap serves the stored value
     back to every browser from now on. */
  try{
    if (typeof window !== 'undefined' && typeof window.API_MODE === 'function' && window.API_MODE()
        && typeof window.api === 'function')
      window.api('org/jurisdiction', 'PUT', { jurisdiction: id }).catch(() => {});
  }catch(e){}
  return true;
}

/* ---------- the sentences that used to be hard-coded ---------- */
const jxLaw = () => `${jx().adjective} law`;
const jxAdjective = () => jx().adjective;
const jxName = () => jx().name;
const jxCurrency = () => jx().currency;
const jxLocale = () => jx().locale;
const jxEsignature = () => jx().esignature;
const jxEsignatureShort = () => jx().esignatureShort;
const jxStampDuty = () => jx().stampDuty;
const jxDataProtection = () => jx().dataProtection;
const jxStandardsBody = () => jx().standardsBody;
const jxPlaybookLabel = () => jx().playbookLabel;
const jxPreferredLaw = () => `This Agreement is governed by the laws of ${jx().name} and the parties `
  + `submit to the exclusive jurisdiction of ${jx().forum} (or ${jx().arbitration}).`;
const jxFallbackLaw = () => `This Agreement is governed by the laws of ${jx().name}; disputes may be `
  + `referred to ${jx().arbitration}.`;

/* ---------- what the built-in templates ask the pack for ----------
   Plain readers, so a template clause reads as a sentence with a hole in it
   rather than as a lookup. Each returns null where the pack has nothing to say,
   and it is the CALLER's job to drop that half of the sentence — see the lease
   and food-safety clauses in the template builder for the two shapes of that. */
const jxIncorporatedIn = () => jx().incorporatedIn || jx().name;
const jxTaxAuthority = () => jx().taxAuthority || null;
const jxFoodSafetyRegulator = () => jx().foodSafetyRegulator || null;
const jxProfessionalBodies = () => jx().professionalBodies || null;
const jxLandStatute = () => jx().landStatute || null;
const jxLandForum = () => jx().landForum || null;
/* Placeholder example for an empty template blank, by field name. Falls back to
   an empty string so a pack that has not named one shows a plain blank rather
   than another market's town. */
const jxEg = key => jx()['eg' + key.charAt(0).toUpperCase() + key.slice(1)] || '';
/* Which FIELD_LIB entry asks for this market's company tax number. */
const jxTaxIdField = () => jx().taxIdField || null;

/* The short governing-law sentence a template clause ends on. Kept separate from
   jxPreferredLaw (which is the PLAYBOOK's position, and states a preference)
   because a template is drafting the clause, not arguing for it. */
const jxGovernedBy = () => `This Agreement is governed by the laws of ${jx().name}.`;
const jxGovernedByArb = () => `This Agreement is governed by the laws of ${jx().name}, `
  + `with disputes referred to ${jx().arbitration}.`;
/* A lease sits under a named statute and a named court in some markets and under
   neither in others, so this assembles whichever halves the pack actually has. */
const jxLeaseLaw = () => {
  const statute = jxLandStatute(), forum = jxLandForum();
  return `This Lease is governed by the laws of ${jx().name}`
    + (statute ? `, including ${statute}` : '')
    + `, with disputes referred to ${forum || jx().forum}.`;
};

/* Every place-name that means SOMEWHERE ELSE from where this workspace sits.
   The home pack's own markers are excluded, which is the whole point: switch
   the setting and "laws of Kenya" moves from expected to foreign without a
   single call site changing. */
function jxForeignMarkers(){
  const home = jx().markers.map(s => s.toLowerCase());
  const others = jxList().filter(p => p.id !== jx().id)
    .reduce((acc, p) => acc.concat(p.markers), []);
  return JX_OTHER_SEATS.concat(others)
    .map(s => s.toLowerCase())
    .filter(s => !home.includes(s))
    /* A pack's markers can overlap another's list; one pass to unique keeps the
       scanner from reporting the same seat twice. */
    .filter((s, i, a) => a.indexOf(s) === i);
}
/* Does this text name the home jurisdiction? Used by the scanner and the
   playbook to tell "governed by our law" from "governed by somebody else's". */
const jxNamesHome = s => {
  const t = String(s == null ? '' : s).toLowerCase();
  return jx().markers.some(m => t.includes(m));
};

/* ---------- money ----------
   One formatter, reading the pack. Both shapes kept because the short one is
   what fits in a KPI tile and the long one is what belongs in a sentence. */
const fmtMoney = n => `${jxCurrency()} ` + Number(n || 0).toLocaleString(jxLocale());
const fmtMoneyShortIn = (n, code) => { n = Number(n || 0); const c = code || jxCurrency();
  if (n >= 1e6) return `${c} ` + (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  if (n >= 1e3) return `${c} ` + (n / 1e3).toFixed(0) + 'K';
  return `${c} ` + n; };
const fmtMoneyShort = n => fmtMoneyShortIn(n, jxCurrency());

/* ---- MONEY IN ITS OWN CURRENCY (W2-1, WORKORDER-gap-map.md) ----
   Owner-ruled 19 Aug 2026: REPORTING converts to the workspace currency so
   dashboards and reports carry one figure; a contract's own page still
   states its own currency beside its amount. THE ARITHMETIC LIVES HERE ONCE
   and both hosts run it — the browser reads rates off the bootstrap
   settings, the server injects its own readers at boot (fxSetRatesReader /
   fxSetHomeReader) — because a client/server twin of a money formula is the
   recorded defect class. Stored values are NEVER rewritten. A currency with
   NO RATE ON FILE is never guessed: its contracts are LEFT OUT of converted
   figures and the leaving-out is said beside the number (fxMissing is what
   the surfaces print — a silent trim is the fault the insights panels were
   rebuilt to stop). */
let FX_RATES_READ = () => { try { return (state && state.settings && state.settings.fxRates) || {}; } catch (_) { return {}; } };
let FX_HOME_READ = () => jxCurrency();
const fxSetRatesReader = fn => { if (typeof fn === 'function') FX_RATES_READ = fn; };
const fxSetHomeReader = fn => { if (typeof fn === 'function') FX_HOME_READ = fn; };
const fxHomeCode = () => { try { return FX_HOME_READ() || jxCurrency(); } catch (_) { return jxCurrency(); } };
/* The record wins where it said something readable; anything else — blank,
   prose, a typo — falls back to the workspace currency, which is exactly
   yesterday's behaviour, so no existing book moves. */
const contractCurrency = c => {
  const raw = String((c && c.metadata && c.metadata.currency) || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : fxHomeCode();
};
const fxIsForeign = c => contractCurrency(c) !== fxHomeCode();
const fxRateFor = code => {
  const r = (FX_RATES_READ() || {})[String(code || '').toUpperCase()];
  const n = r && Number(r.rate);
  return n > 0 ? { rate: n, at: r.at || null } : null;
};
/* THE ONE CONVERSION — a contract's value in the workspace currency.
   missing:true means a foreign currency with no rate on file: the caller
   leaves it out and says so, never guesses. */
function fxHome(c) {
  const v = Number((c && c.value) || 0);
  const code = contractCurrency(c);
  if (code === fxHomeCode()) return { v, code, converted: false, missing: false };
  const r = fxRateFor(code);
  if (!r) return { v: 0, code, converted: false, missing: true };
  return { v: Math.round(v * r.rate), code, converted: true, missing: false, rate: r.rate, at: r.at };
}
/* ---- THE CURRENCIES A PICKER CAN OFFER (owner-asked 19 Aug 2026: "there
   should be a search for currency where options are available") ----
   A LIST TO CHOOSE FROM, NEVER A LIST THAT REFUSES. The rate route and the
   panel both still accept ANY three-letter code — this is what a reader can
   search rather than what they are allowed to say, because a workspace whose
   counterparty invoices in a currency nobody thought to list must still be
   able to set a rate for it. Names are English: they are chosen from, not
   printed on paper, and the code beside each one is the thing that is stored.

   ENGLISH NAMES BESIDE THE CODE, because "USD" and "AUD" and "SGD" all read
   as dollars to somebody hunting for the right one. */
const FX_CURRENCIES = {
  AED: 'UAE dirham', AUD: 'Australian dollar', BWP: 'Botswana pula',
  CAD: 'Canadian dollar', CHF: 'Swiss franc', CNY: 'Chinese yuan',
  DKK: 'Danish krone', EGP: 'Egyptian pound', ETB: 'Ethiopian birr',
  EUR: 'Euro', GBP: 'Pound sterling', GHS: 'Ghanaian cedi',
  INR: 'Indian rupee', JPY: 'Japanese yen', KES: 'Kenyan shilling',
  MAD: 'Moroccan dirham', MUR: 'Mauritian rupee', MWK: 'Malawian kwacha',
  NGN: 'Nigerian naira', NOK: 'Norwegian krone', NZD: 'New Zealand dollar',
  QAR: 'Qatari riyal', RWF: 'Rwandan franc', SAR: 'Saudi riyal',
  SEK: 'Swedish krona', SGD: 'Singapore dollar', TZS: 'Tanzanian shilling',
  UGX: 'Ugandan shilling', USD: 'US dollar', XAF: 'Central African CFA franc',
  XOF: 'West African CFA franc', ZAR: 'South African rand', ZMW: 'Zambian kwacha',
};
const fxCurrencyName = code => FX_CURRENCIES[String(code || '').toUpperCase()] || '';
/* What the picker offers, in the order that answers the reader's actual
   question. THE CURRENCIES THIS BOOK IS ACTUALLY WRITTEN IN COME FIRST, and
   they come from fxMissing — the same reading every surface uses to say what
   was left out of a converted figure — so "in case you have contracts from
   other currencies" is answered with this workspace's own facts rather than
   with a longer alphabet. Then the list above, minus the home currency and
   anything already on file. */
function fxPickerCodes(opts = {}){
  const home = fxHomeCode();
  const have = Object.keys(opts.rates || (FX_RATES_READ() || {}));
  const missing = Object.keys(opts.missing || fxMissing(opts.contracts));
  const seen = new Set([home, ...have]);
  const out = [];
  for (const code of missing) if (!seen.has(code)){ seen.add(code); out.push(code); }
  for (const code of Object.keys(FX_CURRENCIES).sort())
    if (!seen.has(code)){ seen.add(code); out.push(code); }
  return out;
}
const fxHomeValue = c => fxHome(c).v;
/* What the converted figures LEFT OUT — {code: count} over valued, live,
   unarchived contracts. */
function fxMissing(list) {
  let cs = list;
  if (!cs) { try { cs = (state && state.contracts) || []; } catch (_) { cs = []; } }
  const out = {};
  for (const c of cs) {
    if (!c || c.status === 'Declined' || c.archived || !(Number(c.value || 0) > 0)) continue;
    const h = fxHome(c);
    if (h.missing) out[h.code] = (out[h.code] || 0) + 1;
  }
  return out;
}
const fxMissingLine = list => {
  const m = fxMissing(list);
  return Object.keys(m).sort().map(k => `${m[k]} × ${k}`).join(' · ');
};
// the per-contract print: the amount in the contract's OWN currency
const fmtMoneyOf = c => `${contractCurrency(c)} ` + Number((c && c.value) || 0).toLocaleString(jxLocale());
/* THE SAME ANSWER IN THE COMPACT FORM a table cell holds. The long print got
   the rule on the day W2-1 shipped and every SHORT print was left stating the
   workspace currency over a foreign amount — so a register row read
   "KES 420K" over a contract written in euros, which is the exact untruth
   W2-1 exists to stop. The row states what the paper says; the aggregate
   under it still converts. */
const fmtMoneyShortOf = c => fmtMoneyShortIn(Number((c && c.value) || 0), contractCurrency(c));

const JX_API = { JURISDICTIONS, JX_DEFAULT, JX_LS, JX_OTHER_SEATS,
  jx, jxId, jxIs, jxSet, jxList, jxPack, jxLaw, jxAdjective, jxName, jxCurrency, jxLocale,
  jxEsignature, jxEsignatureShort, jxStampDuty, jxDataProtection, jxStandardsBody,
  jxPlaybookLabel, jxPreferredLaw, jxFallbackLaw, jxForeignMarkers, jxNamesHome,
  jxIncorporatedIn, jxTaxAuthority, jxFoodSafetyRegulator, jxProfessionalBodies,
  jxLandStatute, jxLandForum, jxEg, jxTaxIdField, jxGovernedBy, jxGovernedByArb, jxLeaseLaw,
  fmtMoney, fmtMoneyShort, fmtMoneyShortIn,
  fxSetRatesReader, fxSetHomeReader, fxHomeCode, contractCurrency, fxIsForeign,
  fxRateFor, fxHome, fxHomeValue, fxMissing, fxMissingLine, fmtMoneyOf, fmtMoneyShortOf,
  FX_CURRENCIES, fxCurrencyName, fxPickerCodes };
/* Two hosts, one table. The browser gets globals like every other module here;
   server/server.js is a plain Node process with no window, and requires it. */
if (typeof window !== 'undefined') Object.assign(window, JX_API);
if (typeof module !== 'undefined' && module.exports) module.exports = JX_API;
