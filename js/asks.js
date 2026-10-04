/* ============================================================
   ONE ASK RECORD — who was asked, the answer, when, and for what
   (the process review's last storage gap, 4 Oct 2026; the owner's go-ahead)
   ============================================================
   Four kinds of "a colleague must say yes" grew up in four places:
     · rule     — an approval RULE's step     (c.approvalChain, js/approvals.js)
     · named    — a named person's yes        (c.signApprovals, js/signapproval.js)
     · review   — an internal review          (c.review.requests + ch.review)
     · suggest  — a contributor's suggestion  (ch.suggested, js/desk.js)
   The rules for reasons, reminders and the "cleared" notice were made one on
   4 Oct; the STORAGE was not, so "who was asked, what did they answer, when,
   and about what" had four different answers in four different shapes.

   THIS FILE IS THE ONE RECORD: `c.asks`, a list, one row per question —
     { id, kind, of, by, to, at, due, state, answeredAt, answeredBy, why,
       note, stamp, parts? }
     · of     the step / need / change ids the question is about
     · by     {id,name} who asked; NULL for a rule step, which the RULE asks
     · to     {id,name} the person asked, or {role} where a role is
     · state  open · yes · no · lapsed · returned · withdrawn
     · stamp  what the question (named) or the yes (rule) was given for
     · parts  a review's verdicts, one per change it covered
   ONE WRITER (askOpen · askAnswer · askLapse) used by all four flows, ONE
   reading (asksOf · askById · askOpenFor · asksLatestFor), loaded by BOTH
   hosts: js/app.js imports it, server/server.js requires it.

   THE OLD FIELDS ARE MIRRORS, kept in step by the writer — the address
   book's pattern (js/participants.js contactSet). Hundreds of readings and
   every signing and sending wall read them, so they stay exactly as they
   were and the writer writes them in the same breath as the list: the
   MIRROR FIRST, so whatever holds a signature or a send is on the record
   before the list says anything about it.

   A RECORD ON FILE THAT NEVER HAD A LIST is READ as if it had (asksOf
   derives the rows from the mirrors — reading never writes), and adopted
   the first time something is written through here (asksAdopt). Nothing is
   rewritten destructively: adoption only adds rows and brings a row's state
   up to what its mirror says.

   ONE LAPSE RULE (askLapsed): an open question or a yes lapses when what it
   was given for has moved — each kind measured by its OWN stamp — or when a
   yes nobody used is older than the kind's own limit. Each kind calls it with
   its own measure; the behaviour of each kind is what it was.

   It spends nothing, calls no route and paints nothing. */

const ASK_KINDS = ['rule', 'named', 'review', 'suggest'];
const ASK_STATES = ['open', 'yes', 'no', 'lapsed', 'returned', 'withdrawn'];
const ASK_KEEP = 300;          // rows kept on one record; an open one is never the one dropped
const ASK_WHY_MAX = 600;       // a reason travels by email, so it is kept to a paragraph

const _akStr = v => String(v == null ? '' : v);
const _akNow = () => {
  try { if (typeof window !== 'undefined' && typeof window.nowISO === 'function') return window.nowISO(); } catch (_) {}
  return new Date().toISOString();
};
/* A person, as the list keeps them: an id where there is one, and a name. */
function _akWho(u){
  if (!u) return null;
  if (typeof u === 'string') return { id: '', name: u };
  return { id: u.id != null ? _akStr(u.id) : '', name: _akStr(u.name) };
}
/* Id first, name second — the match js/review.js and the server make. */
function askSamePerson(a, b){
  if (!a || !b) return false;
  const ai = _akStr(a.id), bi = _akStr(b.id);
  if (ai && bi) return ai === bi;
  return !!_akStr(a.name) && _akStr(a.name) === _akStr(b.name);
}
function _akTo(to){
  if (!to) return null;
  if (to.role) return { role: _akStr(to.role) };
  return { id: to.id != null ? _akStr(to.id) : '', name: _akStr(to.name) };
}
const _akClone = a => JSON.parse(JSON.stringify(a));
/* Every change on the record, RAW — the live list and the closed rounds.
   negoAllChanges would start a negotiation (READING MUST NOT WRITE). */
function _akChanges(c){
  const out = [];
  (Array.isArray(c && c.changes) ? c.changes : []).forEach(x => { if (x && x.id != null) out.push(x); });
  const n = c && c.negotiation;
  (n && Array.isArray(n.rounds) ? n.rounds : []).forEach(r =>
    (Array.isArray(r && r.changes) ? r.changes : []).forEach(x => { if (x && x.id != null) out.push(x); }));
  return out;
}
const _akChangeById = (c, id) => _akChanges(c).find(x => _akStr(x.id) === _akStr(id)) || null;

/* ════ THE ONE LAPSE RULE ═══════════════════════════════════════════════
   a: { state, answeredAt }   o: { drift, unusedDays, nowMs, started }
   · `drift` is the kind's own measure of what moved since the stamp — a
     function or a list of keys (empty: nothing moved). It is asked of an
     open question and of a yes; a refusal stands whatever moves.
   · `unusedDays`: a yes nobody used within that many days lapses too.
   · `started`: once signing has started the question has done its work and
     nothing lapses (the named yes's rule, and the only kind that asks it).
   Returns { lapsed, drift, expired }. */
function askLapsed(a, o){
  const opts = o || {};
  const none = { lapsed: false, drift: [], expired: false };
  const st = a && a.state;
  if (!a || opts.started || !(st === 'open' || st === 'yes')) return none;
  const d = typeof opts.drift === 'function' ? opts.drift() : opts.drift;
  const drift = Array.isArray(d) ? d.slice() : [];
  if (drift.length) return { lapsed: true, drift, expired: false };
  if (st === 'yes' && Number(opts.unusedDays) > 0){
    const at = Date.parse(a.answeredAt || '');
    const now = Number.isFinite(opts.nowMs) ? opts.nowMs : Date.now();
    if (Number.isFinite(at) && now - at > Number(opts.unusedDays) * 86400000)
      return { lapsed: true, drift: [], expired: true };
  }
  return none;
}

/* ════ THE MIRRORS — one per kind, written ONLY from here ════════════════
   open(c, a, spec) · answer(c, a, ans, at) · part(c, a, p, ans)
   `spec.mirror` / `ans.mirror` carry what only the old shape holds (a named
   request's people and what it shows, a review's reviewer address, the raw
   ids the old walls compare byte for byte) — facts, never state. */
function _akRuleStep(c, ruleId){
  return (Array.isArray(c && c.approvalChain) ? c.approvalChain : [])
    .find(s => s && !s.sa && _akStr(s.ruleId) === _akStr(ruleId)) || null;
}
const AK_MIRROR = {
  rule: {
    /* A step asked again: the old answer comes off the step (it stays on its
       own row of the list) — resubmitApproval's own reset, field for field.
       `keepStep`: the question opens with the step as it stands — it is about
       to be answered in the same breath, or it fell due and the chain computes
       the step (the server's own opening never rewrites a stored step). */
    open(c, a, spec){
      if (spec && spec.keepStep) return;
      const s = _akRuleStep(c, a.of[0]);
      if (s && s.status !== 'pending')
        Object.assign(s, { status: 'pending', by: null, at: null, comment: null, stamp: null, drift: undefined });
    },
    answer(c, a, ans, at){
      let s = _akRuleStep(c, a.of[0]);
      if (!s){
        if (!Array.isArray(c.approvalChain)) c.approvalChain = [];
        s = Object.assign({ ruleId: a.of[0] }, (ans && ans.step) || {});
        c.approvalChain.push(s);
      }
      const name = a.answeredBy ? a.answeredBy.name : null;
      if (a.state === 'yes'){
        Object.assign(s, { status: 'approved', by: name, at, comment: a.why || null, stamp: a.stamp || null, drift: undefined });
      } else if (a.state === 'no'){
        Object.assign(s, { status: 'rejected', by: name, at, comment: a.why || s.comment || null });
      } else if (a.state === 'withdrawn'){
        Object.assign(s, { status: 'pending', by: null, at: null, comment: null, stamp: null },
          (ans && ans.mirror) || {});
      }
    },
    part(){},
  },
  named: {
    open(c, a, spec){
      const m = (spec && spec.mirror) || {};
      const row = { id: a.id, key: _akStr(m.key != null ? m.key : a.of[0]),
        approverId: m.approverId || '', approverName: m.approverName || '',
        backupId: m.backupId || '', backupName: m.backupName || '',
        people: Array.isArray(m.people) ? m.people : [],
        status: 'pending', askedBy: a.by ? { id: a.by.id, name: a.by.name } : null, askedAt: a.at,
        note: m.note != null ? m.note : (a.note || ''), stamp: a.stamp, shows: m.shows || null,
        decidedBy: null, decidedAt: null, as: null, decision: null, notice: null, reminded: [] };
      c.signApprovals = (Array.isArray(c.signApprovals) ? c.signApprovals : []).concat([row]);
    },
    answer(c, a, ans, at){
      const row = (Array.isArray(c.signApprovals) ? c.signApprovals : []).find(x => x && _akStr(x.id) === a.id);
      if (!row) return;
      if (a.state === 'yes' || a.state === 'no'){
        row.status = a.state === 'yes' ? 'approved' : 'refused';
        row.decidedBy = { id: a.answeredBy ? a.answeredBy.id : '', name: a.answeredBy ? a.answeredBy.name : '',
          role: _akStr(ans && ans.role) };
        row.decidedAt = at; row.as = (ans && ans.as) || null; row.decision = a.why || null;
      } else if (a.state === 'withdrawn'){
        row.status = 'withdrawn';
        if (ans && ans.mirror) Object.assign(row, ans.mirror);
      }
    },
    part(){},
  },
  review: {
    open(c, a, spec){
      const m = (spec && spec.mirror) || {};
      if (!c.review || typeof c.review !== 'object' || Array.isArray(c.review)) c.review = { requests: [] };
      if (!Array.isArray(c.review.requests)) c.review.requests = [];
      c.review.requests.push({
        id: a.id, at: a.at,
        by: m.by != null ? m.by : (a.by ? a.by.name : 'System'),
        byId: m.byId !== undefined ? m.byId : (a.by && a.by.id ? a.by.id : null),
        reviewer: m.reviewer || { id: (a.to && a.to.id) || null, name: (a.to && a.to.name) || '', email: null },
        note: a.note || null, due: a.due || null, changeIds: (m.changeIds || a.of).slice(),
        status: 'open', returnedAt: null, returnedBy: null, returnedNote: null });
    },
    answer(c, a, ans, at){
      const rv = (c.review && Array.isArray(c.review.requests) ? c.review.requests : []).find(r => r && _akStr(r.id) === a.id);
      if (!rv) return;
      if (a.state === 'returned'){
        rv.status = 'returned'; rv.returnedAt = at;
        rv.returnedBy = a.answeredBy ? a.answeredBy.name : 'System';
        rv.returnedNote = a.why || null;
      } else if (a.state === 'withdrawn'){
        rv.status = 'cancelled'; rv.returnedAt = at;
      }
      if (ans && ans.mirror) Object.assign(rv, ans.mirror);
    },
    /* One verdict on one change — written onto the LIVE change (a copy
       negoAllChanges hands back is a verdict nobody reads again). */
    part(c, a, p, ans){
      const live = (ans && ans.target) || _akChangeById(c, p.of);
      if (!live) return;
      const m = (ans && ans.mirror) || {};
      live.review = { verdict: p.answer, note: p.why || null,
        by: m.by != null ? m.by : (p.by ? p.by.name : 'System') || 'System',
        byId: m.byId !== undefined ? m.byId : (p.by && p.by.id ? p.by.id : null),
        at: p.at, hash: p.stamp || null, reviewId: a.id };
    },
  },
  suggest: {
    open(c, a, spec){
      const ch = (spec && spec.target) || _akChangeById(c, a.of[0]);
      if (!ch) return;
      const m = (spec && spec.mirror) || {};
      ch.suggested = { by: a.by ? a.by.name : '', byId: m.byId !== undefined ? m.byId : (a.by ? a.by.id : ''), at: a.at };
    },
    answer(c, a, ans, at){
      const ch = (ans && ans.target) || _akChangeById(c, a.of[0]);
      const g = ch && ch.suggested;
      if (!g || typeof g !== 'object') return;
      const name = a.answeredBy ? a.answeredBy.name : '';
      if (a.state === 'yes'){
        g.adoptedAt = at; g.adoptedBy = name; g.why = null; g.returnedAt = null;
      } else if (a.state === 'returned'){
        g.why = a.why || null; g.returnedAt = at; g.returnedBy = name;
      }
    },
    part(){},
  },
};

/* ════ ADOPTION — the list brought up to what its mirrors say ════════════
   asksReconcile(list, c) returns the list with every fact a mirror holds and
   the list does not: a row the list never had is added, and a row whose
   state its mirror contradicts takes the mirror's state and answer — the
   mirror is what the walls read, so where the two disagree the mirror is the
   one that holds. Rows only a list holds (a rule step that fell due, a
   suggestion whose change was discarded) are kept as they are. Pure on its
   arguments: it works on the list it is given. */
const AK_NAMED_STATE = { pending: 'open', approved: 'yes', refused: 'no', withdrawn: 'withdrawn' };
const AK_NAMED_FITS = { pending: ['open', 'lapsed'], approved: ['yes', 'lapsed'], refused: ['no'], withdrawn: ['withdrawn'] };
const AK_REVIEW_STATE = { open: 'open', returned: 'returned', cancelled: 'withdrawn' };
function _akRuleTo(ap){
  const a = ap || {};
  return a.kind === 'member' ? { id: a.id != null ? _akStr(a.id) : '', name: _akStr(a.name) }
    : { role: _akStr(a.role || 'admin') };
}
function _akNextRuleId(list, ruleId){
  const taken = new Set(list.map(x => x && x.id));
  let n = list.filter(x => x && x.kind === 'rule' && _akStr(x.of && x.of[0]) === _akStr(ruleId)).length + 1;
  while (taken.has(`ar:${ruleId}:${n}`)) n++;
  return `ar:${ruleId}:${n}`;
}
const _akRow = (o) => Object.assign({ id: '', kind: '', of: [], by: null, to: null, at: null, due: null,
  state: 'open', answeredAt: null, answeredBy: null, why: null, note: null, stamp: null }, o);

function _akReconcileNamed(list, c){
  const byId = new Map(list.map(a => [a.id, a]));
  for (const r of (Array.isArray(c.signApprovals) ? c.signApprovals : [])){
    if (!r || !r.id) continue;
    const want = AK_NAMED_STATE[r.status] || 'open';
    /* Decided: the decision. Withdrawn: when (a reopen stamps it), never
       an earlier decision's name — a withdrawn yes is not somebody's answer. */
    const decided = r.status === 'approved' || r.status === 'refused';
    const ans = decided
      ? { answeredAt: r.decidedAt || null, answeredBy: r.decidedBy ? _akWho(r.decidedBy) : null, why: r.decision || null }
      : { answeredAt: (r.status === 'withdrawn' && r.withdrawnAt) || null, answeredBy: null, why: null };
    let a = byId.get(_akStr(r.id));
    if (!a){
      a = _akRow({ id: _akStr(r.id), kind: 'named', of: [_akStr(r.key)], by: r.askedBy ? _akWho(r.askedBy) : null,
        to: r.approverId ? { id: _akStr(r.approverId), name: _akStr(r.approverName) } : { role: 'admin' },
        at: r.askedAt || null, state: want, note: r.note || null, stamp: r.stamp || null, ...ans });
      list.push(a); byId.set(a.id, a);
      continue;
    }
    const fits = (AK_NAMED_FITS[r.status] || ['open']).includes(a.state);
    if (!fits) Object.assign(a, { state: want }, ans);
    else if (decided && r.decidedAt && _akStr(a.answeredAt) !== _akStr(r.decidedAt)) Object.assign(a, ans);
    if (r.stamp && !a.stamp) a.stamp = r.stamp;
  }
}
function _akReconcileRule(list, c){
  const chain = (Array.isArray(c.approvalChain) ? c.approvalChain : []).filter(s => s && !s.sa && s.ruleId != null);
  const seen = new Set();
  for (const s of chain){
    const ruleId = _akStr(s.ruleId);
    seen.add(ruleId);
    const mine = list.filter(a => a.kind === 'rule' && _akStr(a.of && a.of[0]) === ruleId);
    const last = mine[mine.length - 1] || null;
    const fromStep = st => ({ answeredAt: s.at || null, answeredBy: s.by ? { id: '', name: _akStr(s.by) } : null,
      why: s.comment || null, ...(st === 'yes' ? { stamp: s.stamp || null } : {}) });
    if (s.status === 'pending' || !s.status){
      /* Nobody asked yet (a step stored only because another was decided):
         the chain computes it, the list has nothing to say. A settled row and
         a step waiting again: it was sent back — a new question. */
      if (!last || last.state === 'open') continue;
      if (last.state === 'yes') last.state = 'lapsed';
      list.push(_akRow({ id: _akNextRuleId(list, ruleId), kind: 'rule', of: [ruleId], to: _akRuleTo(s.approver) }));
      continue;
    }
    const want = s.status === 'rejected' ? 'no' : 'yes';
    const fits = want === 'no' ? ['no'] : ['yes', 'lapsed'];
    /* AN ANSWER CANNOT PREDATE ITS QUESTION: a yes given before this question
       was opened (the step that fell due because the contract moved under an
       old yes) is not its answer — the question stays open. */
    if (last && last.state === 'open'){
      if (s.at && last.at && _akStr(s.at) < _akStr(last.at)) continue;
      Object.assign(last, { state: want }, fromStep(want));
      continue;
    }
    if (last && fits.includes(last.state)){
      if (s.at && _akStr(last.answeredAt) !== _akStr(s.at)) Object.assign(last, fromStep(want));
      continue;
    }
    if (last && last.state === 'yes') last.state = 'lapsed';
    list.push(_akRow({ id: _akNextRuleId(list, ruleId), kind: 'rule', of: [ruleId], to: _akRuleTo(s.approver),
      state: want, ...fromStep(want) }));
  }
  /* A yes whose step the chain no longer holds was voided (a new value
     voids the chain, js/versioning.js): it has lapsed. An open question with
     no step is a step that fell due and nobody has answered — it stays. */
  const lastByRule = new Map();
  list.forEach(a => { if (a.kind === 'rule') lastByRule.set(_akStr(a.of && a.of[0]), a); });
  for (const [ruleId, a] of lastByRule) if (!seen.has(ruleId) && a.state === 'yes') a.state = 'lapsed';
}
function _akReviewParts(c, rvId){
  return _akChanges(c).filter(x => x.review && x.review.verdict && _akStr(x.review.reviewId) === _akStr(rvId))
    .map(x => ({ of: _akStr(x.id), answer: _akStr(x.review.verdict),
      by: { id: x.review.byId != null ? _akStr(x.review.byId) : '', name: _akStr(x.review.by) },
      at: x.review.at || null, why: x.review.note || null, stamp: x.review.hash || null }));
}
function _akReconcileReview(list, c){
  const byId = new Map(list.map(a => [a.id, a]));
  for (const rv of (c.review && Array.isArray(c.review.requests) ? c.review.requests : [])){
    if (!rv || !rv.id) continue;
    const want = AK_REVIEW_STATE[rv.status] || 'open';
    const ans = want === 'open' ? { answeredAt: null, answeredBy: null, why: null }
      : { answeredAt: rv.returnedAt || null,
          answeredBy: want === 'returned' && rv.returnedBy ? { id: '', name: _akStr(rv.returnedBy) } : null,
          why: want === 'returned' ? (rv.returnedNote || null) : null };
    let a = byId.get(_akStr(rv.id));
    if (!a){
      const r = rv.reviewer || {};
      a = _akRow({ id: _akStr(rv.id), kind: 'review', of: (rv.changeIds || []).map(_akStr),
        by: { id: rv.byId != null ? _akStr(rv.byId) : '', name: _akStr(rv.by) },
        to: { id: r.id != null ? _akStr(r.id) : '', name: _akStr(r.name) },
        at: rv.at || null, due: rv.due || null, note: rv.note || null, state: want, ...ans, parts: [] });
      list.push(a); byId.set(a.id, a);
    } else if (a.state !== want){
      Object.assign(a, { state: want }, ans);
      if (want !== 'open' && a.answeredBy == null && ans.answeredBy) a.answeredBy = ans.answeredBy;
    }
    /* The verdicts: the change carries the one that stands; the list keeps
       every change's latest, including a change no longer on the table. */
    const parts = Array.isArray(a.parts) ? a.parts : [];
    for (const p of _akReviewParts(c, rv.id)){
      const i = parts.findIndex(x => x && x.of === p.of);
      if (i < 0) parts.push(p);
      else if (parts[i].answer !== p.answer || _akStr(parts[i].at) !== _akStr(p.at) || _akStr(parts[i].stamp) !== _akStr(p.stamp)) parts[i] = p;
    }
    a.parts = parts;
  }
}
function _akReconcileSuggest(list, c){
  const byId = new Map(list.map(a => [a.id, a]));
  for (const ch of _akChanges(c)){
    const g = ch.suggested;
    if (!g || typeof g !== 'object' || Array.isArray(g)) continue;
    const id = 'sg:' + _akStr(ch.id);
    const want = g.adoptedAt ? 'yes' : g.returnedAt ? 'returned' : 'open';
    const ans = want === 'open' ? { answeredAt: null, answeredBy: null, why: null }
      : { answeredAt: (want === 'yes' ? g.adoptedAt : g.returnedAt) || null,
          answeredBy: { id: '', name: _akStr(want === 'yes' ? g.adoptedBy : g.returnedBy) },
          why: want === 'returned' ? (g.why || null) : null };
    let a = byId.get(id);
    if (!a){
      a = _akRow({ id, kind: 'suggest', of: [_akStr(ch.id)], by: { id: g.byId != null ? _akStr(g.byId) : '', name: _akStr(g.by) },
        to: { role: 'lead' }, at: g.at || null, state: want, ...ans, stamp: ch.hash || null });
      list.push(a); byId.set(id, a);
      continue;
    }
    if (a.state !== want || _akStr(a.answeredAt) !== _akStr(ans.answeredAt)){
      const keepBy = a.answeredBy && ans.answeredBy && a.answeredBy.name === ans.answeredBy.name ? a.answeredBy : ans.answeredBy;
      Object.assign(a, { state: want }, ans, { answeredBy: keepBy });
    }
  }
}
function asksReconcile(list, c){
  const out = (Array.isArray(list) ? list : []).filter(a => a && a.id && ASK_KINDS.includes(a.kind));
  if (!c) return out;
  _akReconcileRule(out, c);
  _akReconcileNamed(out, c);
  _akReconcileReview(out, c);
  _akReconcileSuggest(out, c);
  return out;
}
/* THE READING'S BASE: the stored list (copied) brought up to its mirrors.
   Nothing on `c` is touched — a screen that reads asks writes nothing. */
function asksDerive(c){
  if (!c) return [];
  return asksReconcile(Array.isArray(c.asks) ? _akClone(c.asks) : [], c);
}
/* THE ONE MOMENT ADOPTION WRITES: before the writer writes, and on the
   server before a guard compares. Additive; idempotent. */
function asksAdopt(c){
  if (!c) return [];
  c.asks = asksReconcile(Array.isArray(c.asks) ? c.asks : [], c);
  return c.asks;
}
/* Bounded like signApprovals is bounded: the oldest SETTLED rows go first,
   and a question still waiting — open, or a suggestion handed back — never. */
function asksBound(list, keep){
  const max = Number(keep) > 0 ? Number(keep) : ASK_KEEP;
  if (!Array.isArray(list) || list.length <= max) return list;
  let drop = list.length - max;
  return list.filter(a => (drop > 0 && a.state !== 'open' && a.state !== 'returned') ? (drop--, false) : true);
}

/* ════ THE READINGS ═════════════════════════════════════════════════════ */
function asksOf(c, kind){
  const all = asksDerive(c);
  return kind ? all.filter(a => a.kind === kind) : all;
}
function askById(c, id){ return asksDerive(c).find(a => a.id === _akStr(id)) || null; }
const _akAbout = (a, of) => of == null || (Array.isArray(a.of) && a.of.some(x => x === _akStr(of)));
/* The question still waiting about this step / need / change, or null. */
function askOpenFor(c, kind, of){
  const rows = asksOf(c, kind).filter(a => a.state === 'open' && _akAbout(a, of));
  return rows.length ? rows[rows.length - 1] : null;
}
/* The newest question about it, whatever became of it. */
function asksLatestFor(c, kind, of){
  const rows = asksOf(c, kind).filter(a => _akAbout(a, of));
  return rows.length ? rows[rows.length - 1] : null;
}
/* What waits on this person by name: open, and addressed to them. A
   question addressed to a ROLE is the caller's to read (who holds the role
   is the kind's own rule, never this file's). */
function asksWaitingOn(c, u){
  if (!u) return [];
  return asksOf(c).filter(a => a.state === 'open' && a.to && !a.to.role && askSamePerson(a.to, u));
}
/* What the server's answer to a save says the list is, taken as given — with
   anything written here since the save left kept on top. */
function asksTakeServer(local, server){
  if (!Array.isArray(server)) return Array.isArray(local) ? local : [];
  const ids = new Set(server.map(a => a && a.id));
  return server.concat((Array.isArray(local) ? local : []).filter(a => a && a.id && !ids.has(a.id)));
}

/* ════ THE ONE WRITER ═══════════════════════════════════════════════════ */
/* spec: { kind, id?, of, by, to, at?, due?, note?, stamp?, target?, mirror? }
   Returns the row, or null. An id already on the list returns that row:
   writing the same question twice is asking it once. */
function askOpen(c, spec){
  if (!c || !spec || !ASK_KINDS.includes(spec.kind)) return null;
  asksAdopt(c);
  const of = (Array.isArray(spec.of) ? spec.of : [spec.of]).filter(x => x != null).map(_akStr);
  const id = spec.id != null ? _akStr(spec.id)
    : spec.kind === 'suggest' ? 'sg:' + of[0]
    : spec.kind === 'rule' ? _akNextRuleId(c.asks, of[0])
    : spec.kind + ':' + Math.random().toString(36).slice(2, 10);
  const had = c.asks.find(a => a.id === id);
  if (had){
    /* FAIL CLOSED: a change handed in to be stamped is stamped, even where
       its question is already on the list — a suggestion must never travel
       because its row was written first. */
    if (spec.kind === 'suggest' && spec.target && !spec.target.suggested) AK_MIRROR.suggest.open(c, had, spec);
    return had;
  }
  const a = _akRow({ id, kind: spec.kind, of, by: spec.kind === 'rule' ? null : _akWho(spec.by), to: _akTo(spec.to),
    at: spec.at || _akNow(), due: spec.due || null, note: spec.note ? _akStr(spec.note) : null,
    stamp: spec.stamp != null ? spec.stamp : null });
  if (spec.kind === 'review') a.parts = [];
  AK_MIRROR[spec.kind].open(c, a, spec);
  c.asks.push(a);
  c.asks = asksBound(c.asks);
  return a;
}
/* ans: { state, by, why?, at?, stamp?, role?, as?, step?, mirror?, target? }
   — or { part, answer, by, why?, stamp?, target?, mirror? } for one of a
   review's verdicts. Validity is the FLOW's to judge (who may, whether a
   reason is required) and the server's to enforce; this writes. */
function askAnswer(c, id, ans){
  if (!c || !ans) return null;
  asksAdopt(c);
  const a = c.asks.find(x => x.id === _akStr(id));
  if (!a) return null;
  const at = ans.at || _akNow();
  if (ans.part != null){
    const p = { of: _akStr(ans.part), answer: _akStr(ans.answer), by: _akWho(ans.by), at,
      why: ans.why != null && ans.why !== '' ? _akStr(ans.why) : null, stamp: ans.stamp != null ? ans.stamp : null };
    AK_MIRROR[a.kind].part(c, a, p, ans);
    a.parts = (Array.isArray(a.parts) ? a.parts : []).filter(x => x && x.of !== p.of).concat([p]);
    return a;
  }
  if (!ASK_STATES.includes(ans.state)) return null;
  const next = Object.assign({}, a, { state: ans.state, answeredAt: at, answeredBy: _akWho(ans.by),
    why: ans.why != null && ans.why !== '' ? _akStr(ans.why) : null },
    ans.stamp !== undefined ? { stamp: ans.stamp } : {});
  AK_MIRROR[a.kind].answer(c, next, ans, at);
  Object.assign(a, next);
  return a;
}
/* A question or a yes that no longer describes what it was given for. The
   row keeps when it was answered and by whom; `lapsedAt` says when it was
   seen to have moved. The mirrors compute their own lapse (that is what
   askLapsed is for), so nothing is written there. */
function askLapse(c, id, o){
  if (!c) return null;
  asksAdopt(c);
  const a = c.asks.find(x => x.id === _akStr(id));
  if (!a || !(a.state === 'open' || a.state === 'yes')) return a || null;
  a.state = 'lapsed';
  a.lapsedAt = (o && o.at) || _akNow();
  return a;
}
/* A rule step's question: the open one, or a new one — and a yes the step
   has outgrown (it went stale) is lapsed first, so the list keeps the old
   yes as history rather than answering it twice. */
function askRuleFor(c, ruleId, o){
  if (!c || ruleId == null) return null;
  asksAdopt(c);
  const mine = c.asks.filter(a => a.kind === 'rule' && _akStr(a.of && a.of[0]) === _akStr(ruleId));
  const last = mine[mine.length - 1] || null;
  if (last && last.state === 'open') return last;
  if (last && last.state === 'yes') askLapse(c, last.id);
  return askOpen(c, { kind: 'rule', of: [_akStr(ruleId)], to: o && o.approver ? _akRuleTo(o.approver) : null,
    keepStep: !!(o && o.keepStep), at: o && o.at });
}

const ASKS_API = { ASK_KINDS, ASK_STATES, ASK_KEEP, ASK_WHY_MAX, askLapsed, askSamePerson, askRuleTo: _akRuleTo,
  asksReconcile, asksDerive, asksAdopt, asksBound, asksOf, askById, askOpenFor, asksLatestFor,
  asksWaitingOn, asksTakeServer, askOpen, askAnswer, askLapse, askRuleFor };
if (typeof window !== 'undefined') Object.assign(window, ASKS_API);
if (typeof module !== 'undefined' && module.exports) module.exports = ASKS_API;
