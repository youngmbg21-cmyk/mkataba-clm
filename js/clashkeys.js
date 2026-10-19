/* ============================================================
   CLASHES IN WHO MAY DO WHAT — THE ONE READING, BOTH HOSTS
   (owner picked "Rows in Needs your attention — the SAP way", 17 Oct 2026;
   the day each is FIRST SEEN, owner's answer 12, 18 Oct 2026; moved here so
   the server finds them itself, the gaps' third pass, 19 Oct 2026)
   ============================================================
   Four clashes, read from the gates' own answers and never a second rule:
     cap    a signer who may sign more than the person who says yes first
            (only while signing limits bind; an unanswered limit is the
            limits row's, not a clash)
     each   two people who give each other the yes before signing
     self   a rule's named approver who can raise the very contracts it
            catches (an admin holds every right by rank and is not singled
            out; a viewer raises nothing)
     nobody where the rules are kept stream by stream, a stream with
            contracts still to sign that no rule names
   PURE. Every input is handed in by its host — the browser's own readings
   (signCapOf, saRuleOf, approvalRules, canAccessFolder, its book) and the
   server's (the users table, srvApprovalRules, folderScopeFor, the contracts
   table) — so the two can never read a clash two ways. It reads, never
   writes, and says no words: the page writes them (stClashes), the server
   keeps only each key's first day (clashSeenRefresh). */
/* a limit's three states: nobody has said, said "no limit", a figure —
   signCapOf's own reading, for a host that has none */
function clashCapRead(raw) {
  if (raw === undefined || raw === null || raw === '') return { answered: false, limit: null };
  if (raw === 'none') return { answered: true, limit: null };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return { answered: false, limit: null };
  return { answered: true, limit: n };
}
/* o: { users, capOn, ruleOf(u), capOf(u)?, rules, canOpen(fid,u)?,
        openStreams (Set|Array of stream ids with contracts still to sign),
        isStream(fid)? } → [{ key, kind, red, who, appr, cap, acap, rule, stream }] */
function clashFind(o) {
  o = o || {};
  const users = Array.isArray(o.users) ? o.users.filter(Boolean) : [];
  const ruleOf = typeof o.ruleOf === 'function' ? o.ruleOf : () => ({ on: false });
  const capOf = typeof o.capOf === 'function' ? o.capOf : (u => clashCapRead(u && u.signCap));
  const rule = u => { try { return ruleOf(u) || { on: false }; } catch (_) { return { on: false }; } };
  const cap = u => { try { return capOf(u) || { answered: false, limit: null }; } catch (_) { return { answered: false, limit: null }; } };
  const byId = id => users.find(u => String(u.id) === String(id)) || null;
  const out = [];
  /* 1 · cap */
  if (o.capOn) users.forEach(p => {
    if (p.role === 'admin' || p.role === 'viewer') return;
    const r = rule(p); if (!r.on || !r.approverId) return;
    const a = byId(r.approverId); if (!a || a.role === 'admin') return;
    const pc = cap(p), ac = cap(a);
    if (!pc.answered || !ac.answered || ac.limit == null) return;
    if (pc.limit != null && !(Number(pc.limit) > Number(ac.limit))) return;
    out.push({ key: 'clash:cap:' + p.id, kind: 'cap', red: true, who: p, appr: a, cap: pc.limit, acap: ac.limit });
  });
  /* 2 · each */
  const pairs = new Set();
  users.forEach(p => {
    const r = rule(p); if (!r.on || !r.approverId) return;
    const a = byId(r.approverId); if (!a) return;
    const ra = rule(a); if (!ra.on || String(ra.approverId) !== String(p.id)) return;
    const k = [String(p.id), String(a.id)].sort().join('|'); if (pairs.has(k)) return; pairs.add(k);
    out.push({ key: 'clash:each:' + k, kind: 'each', who: p, appr: a });
  });
  /* 3 · self — the rule's member by id, else by an exact name */
  const rules = Array.isArray(o.rules) ? o.rules : [];
  const memberOf = a => ((a.id != null && a.id !== '') ? byId(a.id) : null) || users.find(u => u.name === a.name) || null;
  rules.forEach(r => {
    const a = r && r.approver; if (!a || a.kind !== 'member') return;
    const m = memberOf(a); if (!m || m.role === 'viewer' || m.role === 'admin') return;
    const stream = r.cond && r.cond.type === 'folder' ? r.cond.value : null;
    if (stream && typeof o.canOpen === 'function' && !o.canOpen(stream, m)) return;
    out.push({ key: 'clash:self:' + (r.id || '') + ':' + m.id, kind: 'self', who: m, rule: r, stream });
  });
  /* 4 · nobody */
  if (rules.length && rules.every(r => r && r.cond && r.cond.type === 'folder')) {
    const named = new Set(rules.map(r => String(r.cond.value)));
    const open = new Set([...(o.openStreams || [])].map(String));
    const isStream = typeof o.isStream === 'function' ? o.isStream : () => true;
    [...open].filter(f => f && !named.has(f) && isStream(f)).sort()
      .forEach(f => out.push({ key: 'clash:nobody:' + f, kind: 'nobody', stream: f }));
  }
  /* the one that undoes a control outright leads */
  return out.sort((x, y) => (x.red ? 0 : 1) - (y.red ? 0 : 1));
}
/* which streams have contracts still to sign, read off a book: not
   archived, not filed under another, not signed or declined */
const clashOpenStreams = book => new Set((book || []).filter(c => c && !c.archived && !c.parentId && c.folder
  && c.status !== 'Signed' && c.status !== 'Declined').map(c => String(c.folder)));
const CLASH_API = { clashCapRead, clashFind, clashOpenStreams };
if (typeof window !== 'undefined') Object.assign(window, CLASH_API);
if (typeof module !== 'undefined' && module.exports) module.exports = CLASH_API;
