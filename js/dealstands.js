/* ============================================================
   WHERE THE DEAL STANDS — one reading, drawn on three surfaces
   (Young picked idea 15 on 3 Oct 2026; built 4 Oct)
   ============================================================
   *"On idea 15, show me a full page render of how the page would look like
   compared to today. Also, where will this be on the owner side?"* — and then
   "Build all your recommendations."

   THE PAGE IS THE OVERLAP, NOT THE SUM. This is the one rule the whole idea
   stands on. Every other feature in the product adds something to a screen one
   side owns; this is a single page with no owner, read by people who are
   negotiating against each other. So a fact goes on it only if it can be shown
   to EVERY party. If it cannot be shown to one of them it is not on the page
   at all — not hidden for that reader, not greyed, not there. Anything else
   would need the page to know who is reading, and the whole value is that it
   does not.

   WHAT THAT RULES OUT, BY NAME, and each of these is a wall somewhere else in
   this product that a careless line here would walk straight through:
     · the internal review — the counterparty never learns one happened;
     · who on our side was asked to do what — notes handed to a colleague, the
       desk's seats, who is holding the pen; none of it travels today;
     · any party's notes or private room — the 3 Oct wall put each note in one
       named party's room, and a shared page carrying notes would undo it;
     · PEOPLE. Not even our own negotiator's name. A change's author travels to
       the counterparty today, but a third party who only signs has never been
       told who argues on our side, and this page is read by all of them. So
       "Lately" says the SIDE and the act, never the person;
     · money that has not been put to every party;
     · anything that reads as advice — no score, no risk grade, no "unusual".
       Those are readings made for one side, and this page has no side.

   WHAT IS LEFT IS STILL THE VALUABLE PART: the journey, whose move it is and
   since when, the round, how many points are settled and which are not, and
   what happened lately. Every one of those is a fact about the DEAL rather
   than about a party.

   READING MUST NOT WRITE. negoChanges, negoAllChanges, negoRound and
   negoProgress all run negoInit, which CREATES a negotiation on a contract
   that has none — and this reading is asked for every contract that has a
   status link, including signed paper that was imported and never negotiated.
   So everything here reads c.changes and c.negotiation RAW, exactly as every
   count over the book does.

   IT SPENDS NOTHING. No model writes a word of this page. Every sentence is
   worked out, which is what lets it be served to a stranger at a public link
   without a key, a budget or a wait.

   THE SERVER HAS ITS OWN COPY (srvDealStands) because the public page is
   served outside the application. The two are pinned alike by f451, the way
   copilotNegotiation and negoCopilotRecord are pinned alike by f47: two
   surfaces may DRAW differently, the reading may never differ. */

/* The four steps every deal walks, in order. Shared, so the browser and the
   server cannot disagree about which one is lit. */
const DEAL_STEPS = ['shared', 'negotiating', 'agreed', 'signed'];
/* How many of the latest events the page carries. A cap is a fact: the page
   says it is showing the latest few, it does not pretend they are all. */
const DEAL_LATELY_MAX = 5;
/* And how many open points it names before it stops naming them. */
const DEAL_POINTS_MAX = 8;

/* ---- THE RAW READS ----
   Each one answers from the record as stored and starts nothing. */
function dsChanges(c){ return Array.isArray(c && c.changes) ? c.changes.filter(Boolean) : []; }
function dsRounds(c){ const n = c && c.negotiation; return Array.isArray(n && n.rounds) ? n.rounds : []; }
function dsRound(c){ const n = c && c.negotiation; return Math.max(1, Number((n && n.round) || dsRounds(c).length + 1) || 1); }
function dsSignatures(c){ return Array.isArray(c && c.signatures) ? c.signatures.filter(Boolean) : []; }
/* HAS IT BEEN SIGNED — negoExecuted's own three stores, asked through window
   because that reading lives in js/negotiation.js and this file is loaded
   before it on one of the stages. The fallback is the same arithmetic rather
   than a guess, so a stage without the module reads the record, never a
   nearby approximation. */
function dsExecuted(c){
  if (typeof window !== 'undefined' && window.negoExecuted) { try { return !!negoExecuted(c); } catch (_){} }
  return !!(c && (c.status === 'Signed' || c.hash || (c.execution && c.execution.at)));
}
/* A change still on the table. Superseded and parked asks are answered
   THROUGH the proposal that replaced them — counting them again would say
   two points are open where a reader can see one. */
function dsLive(c){ return dsChanges(c).filter(x => x.status !== 'superseded' && x.status !== 'countered' && !x.withdrawn); }
function dsOpen(c){ return dsLive(c).filter(x => x.status === 'pending'); }

/* ---- WHOSE MOVE, SAID AS A PARTY RATHER THAN AS A SEAT ----
   negWhoseMove answers 'you' or 'them', which are words only a seat can read.
   This page has no seat, so the answer is a NAME — and the name comes from
   the parties list, which is the same list the page's own header prints. */
function dsPartyNames(c){
  let ps = [];
  try { ps = (typeof window !== 'undefined' && window.contractParties) ? contractParties(c) : []; } catch (_){ ps = []; }
  if (!ps.length) ps = [{ name: (c && c.party) || '', side: 'ours', involvement: 'negotiate' },
    { name: (c && c.counterparty) || '', side: 'theirs', involvement: 'negotiate' }];
  return ps.filter(p => p && p.name).map(p => ({
    name: String(p.name), ours: p.side === 'ours',
    negotiates: p.side === 'ours' || p.involvement === 'negotiate' || p.involvement === 'both',
    signs: p.side === 'ours' || p.involvement === 'sign' || p.involvement === 'both' || !p.involvement }));
}
/* The day the last thing happened on a side, so "since Tuesday" is a fact
   rather than a feeling. Null where nothing has happened yet, and an absence
   is STATED rather than guessed at. */
function dsSinceDays(c, side){
  const at = dsChanges(c).filter(x => x.authorSide === side)
    .map(x => x.createdAt || x.at || '').filter(Boolean).sort().slice(-1)[0];
  if (!at) return null;
  const t = Date.parse(at);
  if (!isFinite(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 864e5));
}

/* ---- THE ONE READING ---- */
function dealStands(c){
  if (!c) return null;
  const parties = dsPartyNames(c);
  const us = parties.find(p => p.ours) || null;
  const them = parties.find(p => !p.ours) || null;
  const live = dsLive(c), open = dsOpen(c);
  const settled = live.length - open.length;
  const executed = dsExecuted(c);
  const started = dsSignatures(c).length > 0;
  /* AGREED means every point on the table has an answer AND something was
     actually negotiated — the same read negoReadyToSign makes, written here
     off the raw changes so it starts nothing. */
  const agreed = executed || started || (live.length > 0 && open.length === 0);

  /* WHOSE MOVE. An open ask belongs to the side that did NOT write it, which
     is the only form of the question that means the same thing to everybody
     reading. With nothing open the deal is with nobody, and that is said. */
  let move = null;
  if (executed) move = null;
  else if (open.length){
    const theirs = open.filter(x => x.authorSide === 'owner').length;   /* we asked; they answer */
    const ours = open.length - theirs;
    const side = theirs >= ours ? 'theirs' : 'ours';
    const who = side === 'theirs' ? them : us;
    move = { party: (who && who.name) || '', n: open.length,
      days: dsSinceDays(c, side === 'theirs' ? 'owner' : 'counterparty') };
  }

  const steps = DEAL_STEPS.map(k => ({
    key: k,
    done: k === 'shared' ? true : k === 'negotiating' ? agreed : k === 'agreed' ? agreed : executed,
  }));
  const nowAt = steps.findIndex(s => !s.done);
  if (nowAt >= 0) steps[nowAt].now = true;

  return {
    ref: (typeof window !== 'undefined' && window.contractRef) ? contractRef(c) : (c.contractNo || c.id),
    name: String(c.name || ''),
    parties, steps, move, agreed, executed,
    round: dsRound(c),
    total: live.length, settled, open: open.length,
    points: dsPoints(c, open, parties),
    settledPoints: dsSettled(c, parties),
    lately: dsLately(c, parties),
    updatedAt: dsUpdatedAt(c),
  };
}

/* ---- THE OPEN POINTS, named by their clause and by who holds them ----
   The clause's NAME, never the change's id: CHG-4 means nothing to anybody
   who is not inside the negotiation, and a reference the reader cannot look
   up is furniture. */
function dsPoints(c, open, parties){
  const us = parties.find(p => p.ours), them = parties.find(p => !p.ours);
  const seen = new Set();
  const out = [];
  for (const ch of open){
    const key = String(ch.clauseId || ch.id || '');
    if (seen.has(key)) continue;
    seen.add(key);
    let clause = String(ch.clauseLabel || ch.clauseId || '');
    try { if (typeof window !== 'undefined' && window.negoClauseName) clause = negoClauseName(clause) || clause; } catch (_){}
    const holder = ch.authorSide === 'owner' ? them : us;
    out.push({ clause, with: (holder && holder.name) || '', kind: ch.changeType || ch.kind || '' });
    if (out.length >= DEAL_POINTS_MAX) break;
  }
  return out;
}

/* ---- AND WHAT IS AGREED, named the same way ----
   A count alone ("8 points are settled") tells a reader the deal is moving
   and nothing about what it now says. The clause NAMES are what a finance
   director opening this link actually wants, and they are already public to
   every party: a settled point IS the paper. Capped like the open list, and
   the cap is stated rather than trimmed in silence. */
function dsSettled(c, parties){
  const seen = new Set(), out = [];
  for (const ch of dsLive(c)){
    if (ch.status === 'pending') continue;
    const key = String(ch.clauseId || ch.id || '');
    if (seen.has(key)) continue;
    seen.add(key);
    let clause = String(ch.clauseLabel || ch.clauseId || '');
    try { if (typeof window !== 'undefined' && window.negoClauseName) clause = negoClauseName(clause) || clause; } catch (_){}
    out.push({ clause, settled: ch.status === 'accepted' });
    if (out.length >= DEAL_POINTS_MAX) break;
  }
  return out;
}

/* ---- LATELY, SAID WITHOUT NAMING A PERSON ----
   negoTimeline prints "Elin Carlsson accepted #CHG-3", which is right on a
   page one side owns. Here the actor is the PARTY. A third party that only
   signs has never been told who argues on our side, and this page is read by
   all of them at one address. */
function dsLately(c, parties){
  const us = parties.find(p => p.ours), them = parties.find(p => !p.ours);
  const nameOf = side => ((side === 'owner' ? us : them) || {}).name || '';
  const ev = [];
  for (const ch of dsChanges(c)){
    if (ch.status === 'superseded') continue;
    let clause = String(ch.clauseLabel || ch.clauseId || '');
    try { if (typeof window !== 'undefined' && window.negoClauseName) clause = negoClauseName(clause) || clause; } catch (_){}
    const at = ch.createdAt || ch.at || '';
    if (at) ev.push({ at, kind: 'asked', party: nameOf(ch.authorSide), clause });
    if ((ch.status === 'accepted' || ch.status === 'rejected') && (ch.resolvedAt || at))
      ev.push({ at: ch.resolvedAt || at, kind: ch.status === 'accepted' ? 'settled' : 'declined',
        party: nameOf(ch.authorSide === 'owner' ? 'counterparty' : 'owner'), clause });
  }
  for (const r of dsRounds(c)) if (r && r.at) ev.push({ at: r.at, kind: 'round', party: '', round: r.n });
  for (const s of dsSignatures(c)) if (s && s.at) ev.push({ at: s.at, kind: 'signed', party: s.party || s.name || '' });
  return ev.filter(x => x.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, DEAL_LATELY_MAX);
}

/* When the page last had anything to say. Not "now": a page that says it was
   refreshed a second ago when nothing has moved for a week is telling the
   reader something untrue about the deal. */
function dsUpdatedAt(c){
  const days = dsLately(c, dsPartyNames(c));
  return (days[0] && days[0].at) || c.updatedAt || c.lastAction || null;
}

if (typeof window !== 'undefined') Object.assign(window, {
  dealStands, DEAL_STEPS, DEAL_LATELY_MAX, DEAL_POINTS_MAX,
  dsChanges, dsRounds, dsRound, dsLive, dsOpen, dsPartyNames, dsPoints, dsSettled, dsLately, dsUpdatedAt, dsSinceDays,
});

/* ============================================================
   AND THE DRAWING — the in-app one, for the two surfaces inside HaTi
   ============================================================
   The owner's Where we are tab and the counterparty's page draw THIS. The
   public link is served by the server, outside the application's stylesheet,
   so it builds its own standalone copy in literal values — the rule every
   standalone document in this product follows (healthreport.js, weekly.js, the
   exports, the emails). Two surfaces may DRAW differently; what f451 pins is
   that the two READINGS cannot differ.

   NOTHING HERE IS A SECOND READING. Every number and every name comes from
   dealStands above, which is itself built out of the record's raw fields. */
function dsEsc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x])); }
function dsT(k, v){ try { return (typeof i18t === 'function') ? i18t(k, v) : k; } catch (_){ return k; } }
function dsTn(k, n, v){ try { return (typeof i18tn === 'function') ? i18tn(k, n, v) : k; } catch (_){ return k; } }
function dsDay(iso){
  if (!iso) return '';
  try { if (typeof portalDayWords === 'function') return portalDayWords(iso); } catch (_){}
  const t = Date.parse(iso);
  if (!isFinite(t)) return String(iso).slice(0, 10);
  try { return new Date(t).toLocaleDateString((typeof langLocale === 'function') ? langLocale() : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_){ return String(iso).slice(0, 10); }
}
/* ONE SENTENCE PER EVENT, and the actor is always a PARTY. */
function dsEventText(e){
  if (e.kind === 'round') return dsT('ds_ev_round', { n: e.round });
  if (e.kind === 'signed') return dsT('ds_ev_signed', { who: e.party || '' });
  if (e.kind === 'settled') return dsT('ds_ev_settled', { clause: e.clause || '' });
  if (e.kind === 'declined') return dsT('ds_ev_declined', { clause: e.clause || '' });
  return dsT('ds_ev_asked', { who: e.party || '', clause: e.clause || '' });
}
function dsRoleWord(p){
  const bits = [];
  if (p.negotiates) bits.push(dsT('ds_role_negotiates'));
  if (p.signs) bits.push(dsT('ds_role_signs'));
  return bits.join(' · ');
}
/* The one builder both in-app surfaces call. `opts.head` adds the owner's own
   quiet line about the link; nobody else is ever given it. */
function standsHtml(c, opts = {}){
  const D = (opts.data) || dealStands(c);
  if (!D) return '';
  const steps = D.steps.map(s => `<li class="ds-st${s.done ? ' is-done' : ''}${s.now ? ' is-now' : ''}"${s.now ? ' aria-current="step"' : ''}>
    <span class="ds-dot" aria-hidden="true"></span><b>${dsEsc(dsT('ds_step_' + s.key))}</b>
    <span>${dsEsc(s.now && s.key === 'negotiating'
      ? dsT('ds_step_round', { n: D.round, k: D.settled, n2: D.total })
      : s.done ? '' : dsT('ds_step_not_yet'))}</span></li>`).join('');
  const facts = [
    [dsT('ds_whose'), D.executed ? dsT('ds_step_signed')
      : D.move ? (D.move.days == null ? D.move.party
        : dsTn('ds_move_days', D.move.days, { who: D.move.party, n: D.move.days }))
      : dsT('ds_move_nobody'), !!D.move],
    [dsT('ds_open_n'), `${D.open} / ${D.total}`, false],
    [dsT('ds_round'), String(D.round), false],
  ];
  const agreedList = (D.settledPoints && D.settledPoints.length)
    ? D.settledPoints.map(p => `<div class="ds-li"><span class="ds-tick" aria-hidden="true">\u2713</span><span><b>${dsEsc(p.clause)}</b></span></div>`).join('')
      + (D.settled > D.settledPoints.length
        ? `<div class="ds-li ds-quiet">${dsEsc(dsTn('ds_and_more', D.settled - D.settledPoints.length, { n: D.settled - D.settledPoints.length }))}</div>` : '')
    : `<div class="ds-li ds-quiet">${dsEsc(dsT('ds_settled_none'))}</div>`;
  const points = D.points.length
    ? D.points.map(p => `<div class="ds-li"><span class="ds-o" aria-hidden="true"></span><span><b>${dsEsc(p.clause)}</b>${
        p.with ? `<i>${dsEsc(dsT('ds_with', { who: p.with }))}</i>` : ''}</span></div>`).join('')
    : `<div class="ds-li ds-quiet">${dsEsc(dsT('ds_none_open'))}</div>`;
  const lately = D.lately.length
    ? D.lately.map(e => `<div class="ds-late"><span>${dsEsc(dsDay(e.at))}</span><div>${dsEsc(dsEventText(e))}</div></div>`).join('')
    : `<div class="ds-quiet">${dsEsc(dsT('ds_nothing_yet'))}</div>`;
  return `<section class="ds-sheet">
    <div class="ds-eyebrow">${dsEsc(dsT('ds_eyebrow'))}</div>
    <h2 class="ds-h1">${dsEsc(D.name)} &mdash; ${dsEsc(D.ref)}</h2>
    <div class="ds-parties">${D.parties.map(p => `<span class="ds-pch${p.ours ? ' is-ours' : ''}"><b>${dsEsc(p.name)}</b>${
      dsRoleWord(p) ? ' · ' + dsEsc(dsRoleWord(p)) : ''}</span>`).join('')}</div>
    <p class="ds-upd">${dsEsc(dsT('ds_built_from'))}${D.updatedAt ? ' · ' + dsEsc(dsT('ds_updated', { when: dsDay(D.updatedAt) })) : ''}</p>
    ${opts.head || ''}
    <ol class="ds-j">${steps}</ol>
    <div class="ds-move">${facts.map(([k, v, warn]) => `<span><b>${dsEsc(k)}</b><span${warn ? ' class="ds-warn"' : ''}>${dsEsc(v)}</span></span>`).join('')}</div>
    <div class="ds-cols">
      <div><div class="ds-h">${dsEsc(dsT('ds_agreed'))}</div>${agreedList}</div>
      <div><div class="ds-h">${dsEsc(dsT('ds_still_open'))}</div>${points}</div>
    </div>
    <div class="ds-h ds-h-late">${dsEsc(dsT('ds_lately'))}</div>${lately}
    <p class="ds-foot">${dsEsc(dsT('ds_never_shows'))}</p>
  </section>`;
}
/* The owner's tab. A SLOT painted on arrival, because what it says moves with
   every change filed or answered. */
function paintStandsPane(c){
  const host = (typeof document !== 'undefined') && document.getElementById('ws-stands-pane');
  if (!host || !c) return;
  /* NO OWNER'S LINE YET. The quiet line about who can see the page and how to
     copy or switch off its link belongs with the link itself, and the link is
     not built. A hook nothing fills is a guard that is always false — the
     exact fault f232 exists to catch — so it goes in the day there is
     something true to put in it. `opts.head` is the seam it goes through. */
  host.innerHTML = standsHtml(c);
}
if (typeof window !== 'undefined') Object.assign(window, {
  standsHtml, paintStandsPane, dsEventText, dsRoleWord, dsDay, dsEsc,
});
