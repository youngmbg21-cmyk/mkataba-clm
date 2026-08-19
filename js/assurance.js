/* ============================================================
   THE SIGNATURE ASSURANCE LADDER (W3-3, WORKORDER-gap-map.md)
   ============================================================
   Every signature this product takes is not the same strength, and until
   now the record did not say which was which. A counterparty who typed a
   name into a link, a counterparty who proved an emailed code first, and a
   colleague signing on a two-step account are three different claims about
   who signed — and in a dispute the difference is the whole question.

   THE LADDER NAMES THE RUNGS AND THE RECORD STATES WHICH ONE WAS USED. It
   does not change what HaTi accepts: today's signing is still the default,
   nothing is refused that was accepted yesterday, and no rung is presented
   as more than it is. What changes is that the evidence pack can say
   plainly what was proved, instead of leaving a reader to infer it from
   scattered fields.

   STAMPED WHEN THE SIGNATURE IS TAKEN, NEVER DERIVED AFTERWARDS. Whether
   the signer's account had two-step on is a fact about the MOMENT of
   signing, and accounts change: somebody turning two-step off next year
   must not quietly downgrade a signature taken today, and somebody turning
   it on must not silently upgrade one. Old signatures carry no stamp, so
   they are read conservatively and REPORTED AS DERIVED — an inference is
   never dressed up as a record.

   THE BANKID RUNG IS DECLARED AND NOT AVAILABLE. It sits in the ladder with
   `available:false` so every screen and the evidence pack already speak of
   it correctly; the day a broker account exists, the rung is implemented
   and nothing above it has to move. */

const SIGNATURE_ASSURANCE = [
  { key:'paper', rank:0, available:true,
    get label(){ return i18t('as_paper'); },
    get basis(){ return i18t('as_paper_basis'); } },
  { key:'typed', rank:1, available:true,
    get label(){ return i18t('as_typed'); },
    get basis(){ return i18t('as_typed_basis'); } },
  { key:'email-code', rank:2, available:true,
    get label(){ return i18t('as_code'); },
    get basis(){ return i18t('as_code_basis'); } },
  { key:'account', rank:3, available:true,
    get label(){ return i18t('as_account'); },
    get basis(){ return i18t('as_account_basis'); } },
  { key:'account-2fa', rank:4, available:true,
    get label(){ return i18t('as_account_2fa'); },
    get basis(){ return i18t('as_account_2fa_basis'); } },
  /* Declared, not offered. Naming it here is what lets the product say "not
     this one" honestly rather than saying nothing at all. */
  { key:'national-eid', rank:5, available:false,
    get label(){ return i18t('as_eid'); },
    get basis(){ return i18t('as_eid_basis'); } },
];
const assuranceRung = key => SIGNATURE_ASSURANCE.find(r=>r.key===key)||null;
const assuranceAvailable = () => SIGNATURE_ASSURANCE.filter(r=>r.available);

/* WHICH RUNG THIS SIGNATURE IS BEING TAKEN AT — called at the moment of
   signing, with what is true then. `twoStep` is the signer's own account
   state and is read by the caller, because only the signing screen knows
   whose account it is. */
function assuranceAtSigning({ method, verify, twoStep, external }={}){
  if(external) return 'paper';
  if(method==='session-authenticated') return twoStep?'account-2fa':'account';
  if(verify) return 'email-code';
  return 'typed';
}
/* WHAT A STORED SIGNATURE SAYS IT WAS. A stamp is a record and is returned
   as one; anything older is inferred from the fields that do exist and
   comes back marked `derived`, so no screen can print an inference as
   though the record had said it.

   The conservative direction matters: a signature with no stamp on a
   session-authenticated method reads as 'account' and NEVER as
   'account-2fa', because nothing on the record proves the second step was
   in force at the time. */
function signatureAssurance(sig, c){
  if(!sig) return null;
  if(sig.assurance && assuranceRung(sig.assurance))
    return { key:sig.assurance, rung:assuranceRung(sig.assurance), derived:false };
  const external=(typeof isExternallyExecuted==='function')?isExternallyExecuted(c):false;
  const key=assuranceAtSigning({ method:sig.method, verify:sig.verify, twoStep:false, external });
  return { key, rung:assuranceRung(key), derived:true };
}
/* THE WEAKEST LINK IS THE CLAIM. An agreement is only as well proved as its
   least-proved signature, so the contract-level statement takes the minimum
   rather than the best — the flattering reading is the one a dispute
   destroys. Null where nothing is signed yet. */
function contractAssurance(c){
  const sigs=(c&&Array.isArray(c.signatures))?c.signatures:[];
  if(!sigs.length) return null;
  let worst=null, anyDerived=false;
  for(const s of sigs){
    const a=signatureAssurance(s,c); if(!a||!a.rung) continue;
    if(a.derived) anyDerived=true;
    if(!worst||a.rung.rank<worst.rung.rank) worst=a;
  }
  return worst?{ ...worst, derived:anyDerived }:null;
}
const assuranceLine = a => !a ? '' : (a.derived
  ? i18t('as_line_derived',{label:a.rung.label})
  : i18t('as_line',{label:a.rung.label}));

if(typeof window!=='undefined') Object.assign(window,{SIGNATURE_ASSURANCE,assuranceRung,
  assuranceAvailable,assuranceAtSigning,signatureAssurance,contractAssurance,assuranceLine});
if(typeof module!=='undefined'&&module.exports) module.exports={SIGNATURE_ASSURANCE,assuranceRung,
  assuranceAvailable,assuranceAtSigning,signatureAssurance,contractAssurance};
