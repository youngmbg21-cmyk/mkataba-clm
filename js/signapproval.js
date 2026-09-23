/* ============================================================
   APPROVAL BEFORE SIGNING — the one reading, for both hosts
   (Young ruled 23 Sep 2026: "Implement scenario 2")
   ============================================================
   An admin marks a person whose contracts may not be signed until a named
   colleague approves them, whatever the value. The person's own drawer holds
   the rule (js/views/settings.js, section 6); this file is the reading of it,
   and it is loaded by the BROWSER and the SERVER alike — the screen and the
   wall ask the same questions of the same record, so they cannot disagree
   about whether a contract may be signed. It spends nothing, writes nothing
   and calls no route: every write is somebody else's (js/approvals.js on the
   screen, the PUT guard on the server).

   THE RULE LIVES ON THE PERSON, NEVER ON THE READER. Four fields on a member:
     · overseerId        — who approves (the field "Overseen by" already had)
     · overseerOn        — 'always' | 'off'; ABSENT reads the old workspace
                           switch, so the morning after the deploy every
                           workspace behaves exactly as it did the night before
     · overseerBackupId  — who steps in, never the person or the approver
     · overseerWhen      — 'lead', 'sign' or both; ABSENT is both
   and it bites when the marked person LEADS the contract (they are its owner)
   or is NAMED TO SIGN it (a row of ours on the signing route).

   AN APPROVAL IS OF SOMETHING. Each request records a stamp of exactly what
   was put in front of the approver — the wording as TEXT (so a change of
   formatting alone moves nothing), the value, the currency, the dates, the
   parties and the signers — and an approval whose stamp no longer matches
   the contract has LAPSED. So has one nobody used within SA_UNUSED_DAYS.
   Once the first signature is on the record the approval has done its work:
   it governs whether signing may START, and the freezes that follow the first
   signature govern the rest. Nothing here ever refuses a route in progress.

   THE COUNTERPARTY NEVER LEARNS ANY OF THIS: nothing here is on the share
   payload, and the wall that refuses their signature says only that the
   contract is not ready to be signed yet. */

const SA_UNUSED_DAYS = 30;          // an approval not used within this many days lapses
const SA_REMIND_WORKDAYS = 2;       // the approver is reminded after this many working days
const SA_ESCALATE_WORKDAYS = 5;     // the backup and the admins are told after this many
const SA_NOTE_MAX = 600;            // a note travels by email, so it is kept to a paragraph
const SA_KEEP = 20;                 // requests kept on one record, oldest out first
const SA_WHEN = ['lead', 'sign'];

const _saFold = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();

/* ---- WHAT THE RULE ON ONE PERSON SAYS ----
   `answered` separates "an admin decided" from "nobody has said", which the
   drawer needs to know and the legacy switch reads. Nobody approves their own
   contracts: an approver who IS the person switches the rule off rather than
   inventing an approval that approves nothing. A backup who is the person or
   the approver is no backup at all and reads as none. */
function saWhenOf(raw){
  if (raw == null || raw === '') return { lead: true, sign: true };
  const parts = String(raw).split(',').map(x => x.trim()).filter(Boolean);
  const lead = parts.includes('lead'), sign = parts.includes('sign');
  /* A stored value naming neither is a record somebody wrote by hand; it
     reads as the default rather than as "applies to nothing", because an
     approval rule that silently never bites is the fault class this whole
     file exists to avoid. */
  if (!lead && !sign) return { lead: true, sign: true };
  return { lead, sign };
}
function saRuleOf(u, legacyOn){
  const none = { on: false, answered: false, approverId: '', backupId: '', lead: true, sign: true };
  if (!u) return none;
  const self = String(u.id == null ? '' : u.id);
  const approverId = u.overseerId ? String(u.overseerId) : '';
  const raw = u.overseerOn == null ? '' : String(u.overseerOn);
  const answered = raw === 'always' || raw === 'off';
  let on = raw === 'always' ? true : raw === 'off' ? false : (!!legacyOn && !!approverId);
  if (!approverId || approverId === self) on = false;
  const b = u.overseerBackupId ? String(u.overseerBackupId) : '';
  const backupId = (b && b !== self && b !== approverId) ? b : '';
  const w = saWhenOf(u.overseerWhen);
  return { on, answered, approverId, backupId, lead: w.lead, sign: w.sign };
}

/* ---- WHO ON THIS CONTRACT IS MARKED, AND WHO APPROVES FOR THEM ----
   Read off the RECORD: its owner (the lead) and our own rows on the signing
   route (named to sign). A route row with no member id is matched by an exact
   NAME, and only where exactly one member carries it — two people called the
   same thing is a question, not an answer.

   GROUPED BY APPROVER, because the approval is theirs to give: two marked
   people with one approver are one request, two approvers are two.

   AN APPROVER WHOSE ACCOUNT HAS GONE does not take the rule with them. The
   backup steps up where there is one; where there is not, the need names no
   approver and an admin decides it, in writing. Dropping the need instead
   would let a marked person sign freely the day their approver left. */
function saNeeds(c, users, legacyOn){
  if (!c) return [];
  const list = (Array.isArray(users) ? users : []).filter(u => u && u.id != null);
  const byId = new Map(list.map(u => [String(u.id), u]));
  const byName = name => {
    const n = _saFold(name); if (!n) return null;
    const hits = list.filter(u => _saFold(u.name) === n);
    return hits.length === 1 ? hits[0] : null;
  };
  const people = new Map();
  const add = (u, why) => {
    if (!u) return;
    const k = String(u.id);
    if (!people.has(k)) people.set(k, { u, why: new Set() });
    people.get(k).why.add(why);
  };
  const own = c.owner && c.owner.id != null ? byId.get(String(c.owner.id))
    : (c.owner && c.owner.name ? byName(c.owner.name) : null);
  if (own) add(own, 'lead');
  for (const s of (Array.isArray(c.signerPlan) ? c.signerPlan : [])){
    if (!s || s.party === 'counterparty') continue;
    add(s.memberId ? byId.get(String(s.memberId)) : byName(s.name), 'sign');
  }
  const needs = [];
  const byKey = new Map();
  for (const { u, why } of people.values()){
    const r = saRuleOf(u, legacyOn);
    if (!r.on) continue;
    if (!((why.has('lead') && r.lead) || (why.has('sign') && r.sign))) continue;
    let appr = byId.get(r.approverId) || null;
    let backup = r.backupId ? (byId.get(r.backupId) || null) : null;
    if (!appr && backup){ appr = backup; backup = null; }
    const key = appr ? String(appr.id) : 'admin';
    const person = { id: String(u.id), name: String(u.name || ''),
      why: SA_WHEN.filter(w => why.has(w)) };
    let n = byKey.get(key);
    if (!n){
      n = { key, approverId: appr ? String(appr.id) : '', approverName: appr ? String(appr.name || '') : '',
        backupId: backup ? String(backup.id) : '', backupName: backup ? String(backup.name || '') : '',
        people: [] };
      byKey.set(key, n); needs.push(n);
    }
    n.people.push(person);
  }
  return needs;
}

/* ---- WHAT AN APPROVAL IS OF ----
   Small on purpose: this is stamped on every request and compared on every
   paint. The wording is compared as TEXT — tags stripped, entities read,
   whitespace collapsed — so bold, indentation and list levels move nothing,
   which is the owner's rule ("formatting-only changes do not lapse it"), and
   the same hash on both hosts because both run this line. */
function saText(html){
  return String(html == null ? '' : html)
    .replace(/<\/(p|h[1-6]|li|tr|div|blockquote|pre)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}
function saHash(s){
  const t = String(s == null ? '' : s);
  let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
function _saFieldsText(f){
  if (!f || typeof f !== 'object') return '';
  return Object.keys(f).sort().map(k => `${k}=${saText(f[k])}`).join('\u0001');
}
function _saDates(c){
  const f = (c && c.fields) || {}, m = (c && c.metadata) || {};
  return { start: String(f.effDate || m.effectiveDate || '').slice(0, 10),
    end: String((c && c.expiry) || f.expiry || m.expiryDate || '').slice(0, 10) };
}
function _saCurrency(c){
  const raw = String(((c && c.metadata) || {}).currency || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : '';
}
function _saPartyNames(c){
  const out = [];
  const push = n => { const v = String(n == null ? '' : n).trim(); if (v && !out.some(x => _saFold(x) === _saFold(v))) out.push(v); };
  push(c && c.party); push(c && c.counterparty);
  (Array.isArray(c && c.parties) ? c.parties : []).forEach(p => push(p && p.name));
  return out;
}
function _saSignerRows(c){
  return (Array.isArray(c && c.signerPlan) ? c.signerPlan : []).filter(Boolean).slice()
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}
function saStamp(c){
  if (!c) return null;
  const d = _saDates(c);
  /* `body` is the older field a contract's wording lived in (the server's
     SIGNED_WORDING_FROZEN names both); read where redlineText is empty. */
  const wording = saHash(saText(c.redlineText || c.body) + '\u0000' + _saFieldsText(c.fields)
    + '\u0000' + String((c.upload && c.upload.fileHash) || '') + '\u0000' + String(c.template || ''));
  return {
    v: 1, wording,
    value: String(c.valueType === 'none' ? 'none' : (Number(c.value || 0) || 0)),
    currency: _saCurrency(c), start: d.start, end: d.end,
    parties: saHash(_saPartyNames(c).map(_saFold).join('|')),
    signers: saHash(_saSignerRows(c).map(s => [s.party === 'counterparty' ? 't' : 'o',
      _saFold(s.name), _saFold(s.email), String(s.step || '')].join(':')).join('|')),
  };
}
/* What a request SHOWS its approver, in words and figures. The stamp is what
   is compared; this is what is printed, so the approver reads the thing they
   are approving rather than a hash of it. */
function saShows(c, round){
  const d = _saDates(c);
  return { round: Number(round) || null,
    value: c && c.valueType === 'none' ? null : (Number(c && c.value || 0) || 0),
    valueType: (c && c.valueType) || '', currency: _saCurrency(c),
    start: d.start, end: d.end, parties: _saPartyNames(c),
    signers: _saSignerRows(c).map(s => String(s.name || '')).filter(Boolean) };
}
/* WHAT MOVED since a stamp, as keys the screen words: wording · value ·
   currency · dates · parties · signers. Empty means nothing did. A request
   with no stamp cannot say, and reports nothing rather than everything. */
const SA_DRIFT_KEYS = ['wording', 'value', 'currency', 'dates', 'parties', 'signers'];
function saDrift(stamp, c){
  if (!stamp || !c) return [];
  const now = saStamp(c);
  const out = [];
  if (String(stamp.wording) !== now.wording) out.push('wording');
  if (String(stamp.value) !== now.value) out.push('value');
  if (String(stamp.currency || '') !== now.currency) out.push('currency');
  if (String(stamp.start || '') !== now.start || String(stamp.end || '') !== now.end) out.push('dates');
  if (String(stamp.parties) !== now.parties) out.push('parties');
  if (String(stamp.signers) !== now.signers) out.push('signers');
  return out;
}

/* ---- WORKING DAYS, which is how an office counts waiting ----
   Monday to Friday, counted from the day after the ask. Public holidays are
   not known here and are not guessed: a reminder a day early is a courtesy,
   a reminder invented from a calendar HaTi does not hold is not. */
function saWorkdays(fromIso, toMs){
  const from = Date.parse(fromIso || '');
  const to = Number.isFinite(toMs) ? toMs : Date.now();
  if (!Number.isFinite(from) || to <= from) return 0;
  const d = new Date(from); d.setHours(0, 0, 0, 0);
  const end = new Date(to); end.setHours(0, 0, 0, 0);
  let n = 0, guard = 0;
  while (d < end && guard++ < 400){
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}

/* Has signing started? Only a signature says so — a route row's own `signed`
   flag is a claim the save carries, and the server passes what it knows about
   a counterparty's signed response on top. */
function saStarted(c, extra){
  if (extra && extra.responded) return true;
  return Array.isArray(c && c.signatures) && c.signatures.length > 0;
}
/* The request that stands for one need: the LAST one filed for its approver.
   A withdrawn one leaves the need unasked — somebody took the question back. */
function saCurrentFor(c, key){
  const list = Array.isArray(c && c.signApprovals) ? c.signApprovals : [];
  for (let i = list.length - 1; i >= 0; i--){
    const r = list[i];
    if (!r || String(r.key) !== String(key)) continue;
    return r.status === 'withdrawn' ? null : r;
  }
  return null;
}

/* ---- WHERE EACH NEED STANDS ----
   unasked · pending · approved · refused · lapsed. A PENDING request whose
   contract has moved has lapsed too: the approver would be approving
   something nobody asked them about. `ok` is true where there is nothing to
   approve, where signing has already started, or where every need is
   approved and current. */
function saState(c, needs, opts){
  const o = opts || {};
  const now = Number.isFinite(o.nowMs) ? o.nowMs : Date.now();
  const started = saStarted(c, o);
  const rows = (Array.isArray(needs) ? needs : []).map(need => {
    const req = saCurrentFor(c, need.key);
    let status = 'unasked', drift = [], expired = false;
    if (req){
      status = req.status === 'approved' ? 'approved' : req.status === 'refused' ? 'refused'
        : req.status === 'pending' ? 'pending' : 'unasked';
      if (!started && (status === 'pending' || status === 'approved')){
        drift = saDrift(req.stamp, c);
        if (drift.length) status = 'lapsed';
        else if (status === 'approved'){
          const at = Date.parse(req.decidedAt || '');
          if (Number.isFinite(at) && now - at > SA_UNUSED_DAYS * 86400000){ status = 'lapsed'; expired = true; }
        }
      }
    }
    const waited = req && req.status === 'pending' ? saWorkdays(req.askedAt, now) : 0;
    return { need, req, status, drift, expired, waited,
      escalated: status === 'pending' && waited >= SA_ESCALATE_WORKDAYS };
  });
  const ok = !rows.length || started || rows.every(r => r.status === 'approved');
  return { rows, ok, started, open: started ? [] : rows.filter(r => r.status !== 'approved') };
}

/* ---- WHO MAY DECIDE ONE REQUEST ----
   The approver; the backup (the rule's own "if they are away"); or an admin,
   who must say why in writing because they are deciding in somebody else's
   place. NEVER the person who asked and NEVER a person the rule is about —
   an approval you grant yourself is not an approval. Returns the capacity
   the decision is taken in, or null. */
function saMayDecide(req, u){
  if (!req || !u || u.id == null) return null;
  const me = String(u.id);
  if (req.askedBy && String(req.askedBy.id) === me) return null;
  if ((Array.isArray(req.people) ? req.people : []).some(p => p && String(p.id) === me)) return null;
  if (req.approverId && String(req.approverId) === me) return 'approver';
  if (req.backupId && String(req.backupId) === me) return 'backup';
  if (String(u.role || '') === 'admin') return 'admin';
  return null;
}

const SA_API = { SA_UNUSED_DAYS, SA_REMIND_WORKDAYS, SA_ESCALATE_WORKDAYS, SA_NOTE_MAX, SA_KEEP, SA_WHEN,
  SA_DRIFT_KEYS, saWhenOf, saRuleOf, saNeeds, saText, saHash, saStamp, saShows, saDrift, saWorkdays,
  saStarted, saCurrentFor, saState, saMayDecide };
if (typeof window !== 'undefined') Object.assign(window, SA_API);
if (typeof module !== 'undefined' && module.exports) module.exports = SA_API;
