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
function dsPartyNames(c, seat){
  let ps = [];
  try { ps = (typeof window !== 'undefined' && window.contractParties) ? contractParties(c) : []; } catch (_){ ps = []; }
  if (!ps.length) ps = [{ name: (c && c.party) || '', side: 'ours', involvement: 'negotiate' },
    { name: (c && c.counterparty) || '', side: 'theirs', involvement: 'negotiate' }];
  /* `seat` (their page only, owner's D2 8 Oct 2026): the outside party this
     link belongs to, so a multi-party sheet names the READER as "them". */
  const seatId = seat ? String(seat) : '';
  return ps.filter(p => p && p.name).map(p => ({
    name: String(p.name), ours: p.side === 'ours',
    ...(seatId && p.id != null && String(p.id) === seatId && p.side !== 'ours' ? { seat: true } : {}),
    negotiates: p.side === 'ours' || p.involvement === 'negotiate' || p.involvement === 'both',
    /* A NEGOTIATING PARTY SIGNS TOO (js/parties.js: "both involvements sign;
       only none does not") — the sheet said "Juno · negotiates" and the line
       under it asked Juno to say it was ready to sign (8 Oct 2026). */
    signs: p.side === 'ours' || p.involvement !== 'none' }));
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

/* THE OTHER SIDE OF A CHANGE: the reader's own party on their seat, else the
   first outside party — what every two-party contract has always read. */
function dsThem(parties){ return parties.find(p => p.seat) || parties.find(p => !p.ours) || null; }
/* ---- THE ONE READING ---- */
function dealStands(c, o){
  if (!c) return null;
  const parties = dsPartyNames(c, o && o.seat);
  const us = parties.find(p => p.ours) || null;
  const them = dsThem(parties);
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
    waiting: dsWaiting(open, parties),
    lately: dsLately(c, parties),
    updatedAt: dsUpdatedAt(c),
  };
}

/* ---- THE OPEN POINTS, named by their clause and by who holds them ----
   The clause's NAME, never the change's id: CHG-4 means nothing to anybody
   who is not inside the negotiation, and a reference the reader cannot look
   up is furniture. */
function dsPoints(c, open, parties){
  const us = parties.find(p => p.ours), them = dsThem(parties);
  const seen = new Set();
  const out = [];
  for (const ch of open){
    const key = String(ch.clauseId || ch.id || '');
    if (seen.has(key)) continue;
    seen.add(key);
    let clause = dsClauseOf(ch);
    try { if (clause && typeof window !== 'undefined' && window.negoClauseName) clause = negoClauseName(clause) || clause; } catch (_){}
    const holder = ch.authorSide === 'owner' ? them : us;
    out.push({ clause, with: (holder && holder.name) || '', kind: ch.changeType || ch.kind || '' });
    if (out.length >= DEAL_POINTS_MAX) break;
  }
  return out;
}

/* ---- WHAT WAITS ON EACH PARTY (the shared sheet, Young 4 Oct 2026) ----
   One figure per party that negotiates: the open points it holds, counted by
   CLAUSE as the list names them, never capped. It replaces "Whose move — X
   for 0 days", which named one side and said a number nobody could act on. */
function dsWaiting(open, parties){
  const us = parties.find(p => p.ours), them = dsThem(parties);
  const byName = new Map(parties.filter(p => p.negotiates).map(p => [p.name, 0]));
  const seen = new Set();
  for (const ch of open){
    const key = String(ch.clauseId || ch.id || '');
    if (seen.has(key)) continue;
    seen.add(key);
    const holder = ch.authorSide === 'owner' ? them : us;
    if (holder && holder.name) byName.set(holder.name, (byName.get(holder.name) || 0) + 1);
  }
  return parties.filter(p => byName.has(p.name)).map(p => ({ party: p.name, ours: p.ours, n: byName.get(p.name) || 0 }));
}
/* A CLAUSE IS NAMED BY ITS LABEL, never by an inside id. Where the change
   carries no label the reading says nothing ('') and the drawing writes "a
   clause" — an id like cl_7f or CHG-4 means nothing outside the negotiation. */
const DS_INSIDE_ID = /^(?:CHG-\d|cl[_-]|c[_-]\w|chg[_-])/i;
function dsClauseOf(ch){
  const raw = String((ch && (ch.clauseLabel || ch.clauseId)) || '');
  return (!ch || !ch.clauseLabel) && DS_INSIDE_ID.test(raw) ? '' : raw;
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
    let clause = dsClauseOf(ch);
    try { if (clause && typeof window !== 'undefined' && window.negoClauseName) clause = negoClauseName(clause) || clause; } catch (_){}
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
  const us = parties.find(p => p.ours), them = dsThem(parties);
  const nameOf = side => ((side === 'owner' ? us : them) || {}).name || '';
  const ev = [];
  for (const ch of dsChanges(c)){
    if (ch.status === 'superseded') continue;
    let clause = dsClauseOf(ch);
    try { if (clause && typeof window !== 'undefined' && window.negoClauseName) clause = negoClauseName(clause) || clause; } catch (_){}
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
  dsWaiting, dsClauseOf, DS_INSIDE_ID, dsThem,
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
function dsClauseWord(x){ return (x && x.clause) || dsT('ds_a_clause'); }
function dsEventText(e){
  if (e.kind === 'round') return dsT('ds_ev_round', { n: e.round });
  if (e.kind === 'signed') return dsT('ds_ev_signed', { who: e.party || '' });
  if (e.kind === 'settled') return dsT('ds_ev_settled', { clause: dsClauseWord(e) });
  if (e.kind === 'declined') return dsT('ds_ev_declined', { clause: dsClauseWord(e) });
  return dsT('ds_ev_asked', { who: e.party || '', clause: dsClauseWord(e) });
}
function dsRoleWord(p){
  const bits = [];
  if (p.negotiates) bits.push(dsT('ds_role_negotiates'));
  if (p.signs) bits.push(dsT('ds_role_signs'));
  return bits.join(' · ');
}
/* The one builder both in-app surfaces call.
   THE SHARED SHEET (Young picked it by name, 4 Oct 2026; "go with your
   recommendation" put the same sheet on all three places): ONE title, the
   parties, one line that belongs to the reader, ONE row of facts, ONE
   progress line, Agreed beside Still open, and a short line at the foot.
   What went: the eyebrow over a second title, the contract's name said again
   under the room's own, "Whose move — X for 0 days", and the disclaimer.
     opts.head  — the owner's own line about the link (ours only);
     opts.mine  — the reader's own line ("For you: answer 12. Governing Law");
     opts.you   — the reader's party, so its figure says "you" (a seat word,
                  and only where the surface knows who is reading);
     opts.stepSub — a step's own word the surface knows better (signing under
                  way on their link);
     opts.lately — false where Lately lives on another tab. */
function standsHtml(c, opts = {}){
  const D = (opts.data) || dealStands(c);
  if (!D) return '';
  const wantJourney = opts.journey !== false, wantLately = opts.lately !== false;
  const sub = opts.stepSub || {};
  const steps = D.steps.map(s => `<li class="ds-st${s.done ? ' is-done' : ''}${s.now ? ' is-now' : ''}"${s.now ? ' aria-current="step"' : ''}>
    <span class="ds-dot" aria-hidden="true"></span><b>${dsEsc(dsT('ds_step_' + s.key))}</b>
    <span>${dsEsc(sub[s.key] || (s.now && s.key === 'negotiating'
      ? dsT('ds_step_round_short', { n: D.round })
      : s.done ? '' : dsT('ds_step_not_yet')))}</span></li>`).join('');
  /* ONE ROW OF FACTS: the round, how much is settled, and what waits on each
     party that negotiates. The reader's own figure is amber when it is not 0. */
  const facts = [[dsT('ds_round'), String(D.round), ''], [dsT('ds_settled_fact'), dsT('ds_k_of_n', { k: D.settled, n: D.total }), '']];
  if (!D.executed) (D.waiting || []).forEach(w => {
    const mine = !!opts.you && w.party === opts.you;
    facts.push([mine ? dsT('ds_waiting_you') : dsT('ds_waiting_on', { who: w.party }), String(w.n), mine && w.n ? 'ds-warn' : '']);
  });
  const agreedList = (D.settledPoints && D.settledPoints.length)
    /* A REFUSED POINT IS SETTLED, NOT AGREED (8 Oct 2026): the list is headed
       "Settled" and each row carries its own mark — a tick where the change
       was taken, a cross and "not taken" where it was refused. */
    ? D.settledPoints.map(p => `<div class="ds-li${p.settled ? '' : ' is-refused'}"><span class="ds-tick" aria-hidden="true">${p.settled ? '\u2713' : '\u2715'}</span><span><b>${dsEsc(dsClauseWord(p))}</b>${
        p.settled ? '' : `<i>${dsEsc(dsT('ds_not_taken'))}</i>`}</span></div>`).join('')
      + (D.settled > D.settledPoints.length
        ? `<div class="ds-li ds-quiet">${dsEsc(dsTn('ds_and_more', D.settled - D.settledPoints.length, { n: D.settled - D.settledPoints.length }))}</div>` : '')
    : `<div class="ds-li ds-quiet">${dsEsc(dsT('ds_settled_none'))}</div>`;
  const points = D.points.length
    ? D.points.map(p => { const mine = !!opts.you && p.with === opts.you;
        return `<div class="ds-li"><span class="ds-o${mine ? ' is-mine' : ''}" aria-hidden="true"></span><span><b>${dsEsc(dsClauseWord(p))}</b>${
          p.with ? `<i>${dsEsc(mine ? dsT('ds_with_you') : dsT('ds_with', { who: p.with }))}</i>` : ''}</span></div>`; }).join('')
      + (D.open > D.points.length ? `<div class="ds-li ds-quiet">${dsEsc(dsTn('ds_and_more', D.open - D.points.length, { n: D.open - D.points.length }))}</div>` : '')
    : `<div class="ds-li ds-quiet">${dsEsc(dsT('ds_none_open'))}</div>`;
  const lately = D.lately.length
    ? D.lately.map(e => `<div class="ds-late"><span>${dsEsc(dsDay(e.at))}</span><div>${dsEsc(dsEventText(e))}</div></div>`).join('')
    : `<div class="ds-quiet">${dsEsc(dsT('ds_nothing_yet'))}</div>`;
  const foot = [dsT('ds_foot_same')].concat(D.updatedAt ? [dsT('ds_updated', { when: dsDay(D.updatedAt) })] : [])
    .concat(opts.foot === false ? [] : [opts.foot || dsT('ds_foot_tabs')]).join(' · ');
  return `<section class="ds-sheet">
    <div class="ds-top">
      <h2 class="ds-h1">${dsEsc(dsT('ds_eyebrow'))}</h2>
      <div class="ds-parties">${D.parties.map(p => `<span class="ds-pch${p.ours ? ' is-ours' : ''}"><b>${dsEsc(p.name)}</b>${
        dsRoleWord(p) ? ' · ' + dsEsc(dsRoleWord(p)) : ''}</span>`).join('')}</div>
      ${opts.head || ''}
      ${opts.mine || ''}
    </div>
    <div class="ds-facts">${facts.map(([k, v, cls]) => `<div><span>${dsEsc(k)}</span><b${cls ? ` class="${cls}"` : ''}>${dsEsc(v)}</b></div>`).join('')}</div>
    ${wantJourney ? `<ol class="ds-j">${steps}</ol>` : ''}
    <div class="ds-cols">
      <div><div class="ds-h">${dsEsc(dsT('ds_settled_n', { n: D.settled }))}</div>${agreedList}</div>
      <div><div class="ds-h">${dsEsc(dsT('ds_still_open_n', { n: D.open }))}</div>${points}</div>
    </div>
    ${wantLately ? `<div class="ds-h ds-h-late">${dsEsc(dsT('ds_lately'))}</div>${lately}` : ''}
    <p class="ds-foot">${dsEsc(foot)}</p>
  </section>`;
}
/* The owner's tab. A SLOT painted on arrival, because what it says moves with
   every change filed or answered. */
function paintStandsPane(c){
  const host = (typeof document !== 'undefined') && document.getElementById('ws-stands-pane');
  if (!host || !c) return;
  /* THE OWNER'S OWN LINE goes through opts.head. It is painted rather than
     built: whether a status page is on is the server's answer and arrives
     after the sheet, so the sheet draws at once and the line fills in behind
     it (dsLoadShares). A page that waited on a fetch before saying anything
     would say nothing at all on a slow morning. */
  /* NO SEAT WORD HERE: our tab is word for word what the other parties read,
     so every figure names its party (opts.you is the counterparty page's). */
  host.innerHTML = standsHtml(c, { head: standsOwnerHeadHtml(c), foot: dsT('ds_foot_tabs_ours') });
  dsWireOwner();
  dsLoadShares(c);
}
if (typeof window !== 'undefined') Object.assign(window, {
  standsHtml, paintStandsPane, dsEventText, dsRoleWord, dsDay, dsEsc, dsClauseWord,
});

/* ============================================================
   THE OWNER'S OWN LINE — who can see this page, and the two acts
   (idea 15, part two, 4 Oct 2026)
   ============================================================
   A LINE IN THE HEAD, NOT A STRIP ACROSS THE PAGE. It started as a strip in
   the drawing Young approved, and his own rule refuses a new band without
   being asked first — so it was redrawn as a quiet line under the title,
   which says the same thing for less attention and needs no permission. The
   SAP rule, applied to the smallest thing on the screen.

   IT IS THE ONLY THING ON THIS PAGE NOBODY ELSE IS GIVEN. Everything below it
   is word for word what the other parties read; this line is about the LINK
   rather than about the deal, so it belongs to whoever owns the link.

   IT IS PAINTED, NOT BUILT. Whether a status page is on is the server's
   answer, and it arrives after the sheet. So the sheet draws at once and the
   line fills in behind it — a page that waited on a fetch to say anything
   would be a page that says nothing on a slow morning. */
let _dsShares = Object.create(null);     /* per contract, this sitting only */
function dsStatusShare(shares){
  return (shares || []).find(s => s && s.purpose === 'status' && !s.revokedAt && !s.revoked_at) || null;
}
function dsStatusUrl(tok){
  try { return location.origin + '/deal/' + tok; } catch (_){ return '/deal/' + tok; }
}
/* The parties a status page is readable by: every outside party on the
   contract. It is one address, so naming them is naming the audience rather
   than naming a recipient. */
function dsAudience(c){
  const them = dsPartyNames(c).filter(p => !p.ours).map(p => p.name).filter(Boolean);
  return them.join(', ');
}
function standsOwnerHeadHtml(c){
  const st = _dsShares[c && c.id];
  if (st === undefined) return `<div class="ds-own" data-ds-own="loading"></div>`;
  const live = dsStatusShare(st);
  /* THE ONE LINK CHECK, ASKED BEFORE THE PRESS (linkRefusal, 4 Oct 2026):
     a status page reaches every outside party, so the hold, the desk and the
     reviewer's posture hold it. Greyed with the check's own sentence rather
     than opening a send screen that would refuse at its last step. */
  let no = null;
  if (!live && typeof window !== 'undefined' && typeof window.linkRefusal === 'function'){
    try { no = linkRefusal(c, { purpose: 'status' }); } catch (_){ no = null; }
  }
  if (!live) return `<div class="ds-own" data-ds-own="off">
    <span>${dsEsc(dsT('ds_link_off'))}</span><span class="sep" aria-hidden="true">·</span>
    <button type="button" class="ui-link" data-ds-share${no ? ` disabled aria-disabled="true" title="${dsEsc(no.why)}"` : ''}>${dsEsc(dsT('ds_link_share'))}</button></div>`;
  const who = dsAudience(c);
  return `<div class="ds-own" data-ds-own="on">
    <span>${dsEsc(dsT('ds_link_on'))} <b>${dsEsc(dsT('ds_link_on_word'))}</b>${who ? ' — ' + dsEsc(dsT('ds_link_seen_by', { who })) : ''}</span>
    <span class="sep" aria-hidden="true">·</span>
    <button type="button" class="ui-link" data-ds-copy="${dsEsc(dsStatusUrl(live.token))}">${dsEsc(dsT('ds_link_copy'))}</button>
    <span class="sep" aria-hidden="true">·</span>
    <button type="button" class="ui-link" data-ds-off="${dsEsc(live.token)}">${dsEsc(dsT('ds_link_off_act'))}</button></div>`;
}
/* Asked once per contract per sitting, and only while the tab is open. */
async function dsLoadShares(c){
  if (!c || _dsShares[c.id] !== undefined) return;
  _dsShares[c.id] = null;
  if (typeof window.contractShares !== 'function') return;
  try { _dsShares[c.id] = await contractShares(c); } catch (_){ _dsShares[c.id] = null; }
  const host = document.getElementById('ws-stands-pane');
  const slot = host && host.querySelector('[data-ds-own]');
  if (slot) slot.outerHTML = standsOwnerHeadHtml(c);
}
/* THE TWO ACTS, delegated once at module load so a repainted sheet keeps
   them. Copying a link is a convenience; switching the page off is a promise
   withdrawn, so it says so and then repaints. */
function dsWireOwner(){
  if (typeof document === 'undefined' || document._dsWired) return;
  document._dsWired = true;
  document.addEventListener('click', async e => {
    const cp = e.target.closest && e.target.closest('[data-ds-copy]');
    if (cp){
      e.preventDefault();
      const url = cp.getAttribute('data-ds-copy');
      try { await navigator.clipboard.writeText(url); if (window.toast) toast(dsT('ds_link_copied'), 'ok'); }
      catch (_){ if (window.toast) toast(url, 'warn'); }
      return;
    }
    const off = e.target.closest && e.target.closest('[data-ds-off]');
    if (off){
      e.preventDefault();
      const c = (window.getContract && window.state) ? getContract(state.activeId) : null;
      if (!c) return;
      /* A PROMISE WITHDRAWN IS A DECISION, so it is asked for rather than
         taken on one press — the parties are reading this page right now. */
      if (window.confirmDialog && !(await confirmDialog({ title: dsT('ds_off_title'),
        message: dsT('ds_off_ask'), confirmLabel: dsT('ds_link_off_act'), danger: true }))) return;
      try { await api('shares/' + off.getAttribute('data-ds-off') + '/revoke', 'POST', {}); }
      catch (err){ if (window.toast) toast((err && err.message) || dsT('ds_off_failed'), 'err'); return; }
      delete _dsShares[c.id];
      if (window.toast) toast(dsT('ds_off_done'), 'ok');
      paintStandsPane(c); dsLoadShares(c);
      return;
    }
    const sh = e.target.closest && e.target.closest('[data-ds-share]');
    if (sh){
      e.preventDefault();
      const c = (window.getContract && window.state) ? getContract(state.activeId) : null;
      if (c && window.openShareModal) openShareModal(c, { purpose: 'status' });
    }
  });
}
if (typeof window !== 'undefined') Object.assign(window, {
  standsOwnerHeadHtml, dsLoadShares, dsStatusShare, dsStatusUrl, dsAudience, dsWireOwner,
});
