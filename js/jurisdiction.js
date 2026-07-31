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
    sampleLabel: 'sample',
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
const fmtMoneyShort = n => { n = Number(n || 0); const c = jxCurrency();
  if (n >= 1e6) return `${c} ` + (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  if (n >= 1e3) return `${c} ` + (n / 1e3).toFixed(0) + 'K';
  return `${c} ` + n; };

const JX_API = { JURISDICTIONS, JX_DEFAULT, JX_LS, JX_OTHER_SEATS,
  jx, jxId, jxIs, jxSet, jxList, jxPack, jxLaw, jxAdjective, jxName, jxCurrency, jxLocale,
  jxEsignature, jxEsignatureShort, jxStampDuty, jxDataProtection, jxStandardsBody,
  jxPlaybookLabel, jxPreferredLaw, jxFallbackLaw, jxForeignMarkers, jxNamesHome,
  fmtMoney, fmtMoneyShort };
/* Two hosts, one table. The browser gets globals like every other module here;
   server/server.js is a plain Node process with no window, and requires it. */
if (typeof window !== 'undefined') Object.assign(window, JX_API);
if (typeof module !== 'undefined' && module.exports) module.exports = JX_API;
