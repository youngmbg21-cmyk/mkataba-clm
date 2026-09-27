/* ---- THE BRAIN'S MAP: ONE CATALOGUE, READ AGAINST THE CODE (Young ruled
   27 Sep 2026: "Now go build and merge to main. Put it as a page before home")
   The Brain page draws HaTi as a network of neurons. Its named parts, the
   areas they sit in and the six flows are written HERE, once; what the parts
   ARE — whether each is still in the code, the file and line it lives on,
   which parts hand work to which, and what the code publishes that the
   catalogue does not name yet — is READ from the code, so the picture cannot
   fall behind the platform. The server reads its own files (js/ and server/)
   on the first request after it starts, which is every deploy, and keeps the
   difference from the last reading (brainDiff) as a "code update".
   THE WORDS ARE NOT HERE: every name, description and flow step is a key in
   js/i18n.js (brn_p_<id>, brn_pd_<id>, brn_step_<flow>_<n>…), so the page is
   in both languages and the server carries no prose.
   Like js/graphwhere.js: globals in the browser, a require on the server. */

/* The nine areas, in the order the legend and the Wiring view walk them. */
const BRAIN_REGIONS = ['see', 'in', 'read', 'ai', 'nego', 'sign', 'wall', 'time', 'out'];
/* The four floors, top to bottom: what you see, the browser's work, the
   server (the wall), outside HaTi. */
const BRAIN_FLOORS = 4;

/* [id, code name, area, floor, how to find it]. The code name is what the
   code calls the part; "how to find it" is given only where the name alone
   cannot be looked up (a table, a route with a method in front). */
const BRAIN_PARTS = [
  ['home', 'hmDecisionItems', 'see', 0],
  ['bell', 'buildAlerts', 'see', 0],
  ['contracts', 'renderRegister', 'see', 0],
  ['overview', 'ktOverviewTermsHtml', 'see', 0],
  ['negpage', 'renderRedline', 'see', 0],
  ['signtab', 'renderSignButton', 'see', 0],
  ['explorer', 'intelGraphApply', 'see', 0],
  ['upload', 'submitUpload', 'in', 0],
  ['newagr', 'openNewAgreement', 'in', 0],
  ['mailroom', 'POST /api/mailroom', 'in', 2],
  ['intake', 'intake_requests', 'in', 2, { def: 'CREATE TABLE IF NOT EXISTS intake_requests', men: '\\bintake_requests\\b' }],
  ['docx', 'docxExtractRich', 'read', 1],
  ['pdf', 'extractPdfRich', 'read', 1],
  ['clauses', 'clauseSegment', 'read', 1],
  ['blanks', 'contractBlanks', 'read', 1],
  ['ladder', 'ladderRungs', 'nego', 1],
  ['triage', 'triageRun', 'ai', 1],
  ['brief', 'POST /api/ai/brief', 'ai', 2],
  ['playbook', 'runPlaybookReview', 'ai', 1],
  ['oblscan', 'POST /api/ai/obligations', 'ai', 2],
  ['risk', 'runScan', 'ai', 1],
  ['model', 'anthropicMessages', 'ai', 3],
  ['quote', 'normalizeDeliver', 'ai', 2],
  ['editor', 'ceFile', 'nego', 0],
  ['funnel', 'negoFileChange', 'nego', 1],
  ['desk', 'deskClaimOnFile', 'nego', 1],
  ['review', 'reviewSendBlock', 'nego', 1],
  ['payload', 'buildSharePayload', 'nego', 1],
  ['apply', 'applyNegoProposals', 'nego', 1],
  ['whosemove', 'negWhoseMove', 'nego', 1],
  ['readiness', 'signReadiness', 'sign', 1],
  ['approvals', 'buildApprovalChain', 'sign', 1],
  ['namedyes', 'saNeeds', 'sign', 1],
  ['pad', 'openSignaturePad', 'sign', 0],
  ['seal', 'sealWhen', 'sign', 2],
  ['putguard', 'PUT /api/contracts/:id', 'wall', 2],
  ['shares', 'POST /api/shares', 'wall', 2],
  ['respond', 'POST /api/shares/:token/respond', 'wall', 2],
  ['db', 'contracts table', 'wall', 2, { def: 'CREATE TABLE IF NOT EXISTS contracts', men: '\\b(?:FROM|INTO|UPDATE)\\s+contracts\\b' }],
  ['audit', 'logAudit', 'wall', 1],
  ['frozen', 'EXECUTED_IMMUTABLE', 'wall', 2],
  ['reminders', 'runReminders', 'time', 2],
  ['renewprep', 'runRenewalPrep', 'time', 2],
  ['obligations', 'obligationBand', 'time', 1],
  ['calendar', 'calPeriod', 'time', 0],
  ['renewal', 'renewalWindow', 'time', 1],
  ['desknight', 'deskShown', 'time', 1],
  ['email', 'mailReport', 'out', 3],
  ['cplink', 'renderShareViewer', 'out', 3],
  ['webhook', 'WEBHOOK_EVENTS', 'out', 3],
  ['wordfile', 'docxExportTracked', 'out', 3],
  ['theirsign', 'shareSignerPickHtml', 'out', 3]
].map((a, i) => ({ id: a[0], code: a[1], reg: a[2], floor: a[3], def: (a[4] || {}).def || '', men: (a[4] || {}).men || '', i }));

/* The six flows: which parts each step lands on. The sentences are
   brn_step_<flow>_<n> in the dictionary. A flow is a STORY a person wrote;
   the reading only checks that every part it names is still in the code. */
const BRAIN_FLOWS = [
  { id: 'upload', steps: [['upload'], ['docx'], ['clauses'], ['putguard', 'db'], ['triage'], ['brief', 'playbook', 'oblscan', 'risk'], ['model'], ['blanks'], ['overview', 'bell']] },
  { id: 'redline', steps: [['negpage'], ['editor'], ['funnel'], ['desk'], ['ladder'], ['review'], ['payload'], ['shares'], ['email', 'cplink'], ['whosemove', 'bell']] },
  { id: 'round', steps: [['cplink'], ['respond'], ['audit'], ['apply'], ['ladder'], ['whosemove'], ['bell', 'home', 'negpage'], ['webhook']] },
  { id: 'sign', steps: [['signtab'], ['readiness'], ['brief', 'playbook', 'blanks'], ['approvals', 'namedyes'], ['pad'], ['putguard'], ['seal', 'frozen'], ['obligations', 'renewal', 'calendar'], ['email']] },
  { id: 'night', steps: [['reminders'], ['renewal'], ['renewprep'], ['model'], ['db'], ['obligations'], ['email'], ['desknight', 'home']] },
  { id: 'ask', steps: [['explorer'], ['db'], ['model'], ['quote'], ['contracts'], ['explorer']] }
];

/* Where a part the catalogue does not name yet sits: the area by the file it
   lives in, the floor by where that file runs. First match wins. */
const BRAIN_FILE_REGION = [
  [/^server\/.*$/, 'wall'],
  [/^js\/(negotiation|desk|review|ladder|clauselock|redlineplan)\.js$|^js\/views\/(negotiation|negotiation-css|clauseeditor)\.js$/, 'nego'],
  [/^js\/(ai|aimd|aitrace|triage|playbook|metadata|metaclean|precedent|standards|draft)\.js$/, 'ai'],
  [/^js\/(docx|pdf|pdfrich|ocr|clausemodel|blanks|uploadblanks|richdoc|redline|templateform)\.js$/, 'read'],
  [/^js\/(signcheck|signapproval|approvals|signature|assurance|outside)\.js$|^js\/views\/(handover|approvalsview)\.js$/, 'sign'],
  [/^js\/(obligations|desknight|notice|payterms|runway)\.js$|^js\/views\/calendar\.js$/, 'time'],
  [/^js\/(wizard|intake|cohort)\.js$|^js\/views\/(intake|newstandard|templatebuilder|templatelib|migration|library)\.js$/, 'in'],
  [/^js\/(adviserlink)\.js$|^js\/views\/(portal|adviceportal)\.js$/, 'out']
];
function brainRegionOfFile(file){
  const f = String(file || '');
  for (const [re, r] of BRAIN_FILE_REGION) if (re.test(f)) return r;
  return /^js\/views\//.test(f) ? 'see' : 'wall';
}
function brainFloorOfFile(file){
  const f = String(file || '');
  if (/^server\//.test(f)) return 2;
  return /^js\/views\//.test(f) ? 0 : 1;
}

const _BR_ROUTE = /^(GET|POST|PUT|PATCH|DELETE) (\/\S+)$/;
const _brEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* What text marks the part's DEFINITION. */
function brainDefs(p){
  if (p.def) return [p.def];
  const r = _BR_ROUTE.exec(p.code);
  if (r) return ["app." + r[1].toLowerCase() + "('" + r[2] + "'"];
  const n = p.code;
  return ['async function ' + n + '(', 'function ' + n + '(', 'const ' + n + ' =', 'const ' + n + '=', 'let ' + n + ' =', 'let ' + n + '='];
}
/* What text in ANOTHER part's body means it hands work to this one. A route
   with a parameter in its path has no single spelling at its callers, so it
   is found and drawn but gets no incoming link rather than a guessed one. */
function brainMention(p){
  if (p.men) return new RegExp(p.men);
  const r = _BR_ROUTE.exec(p.code);
  if (r) return r[2].includes(':') ? null : new RegExp("['\"`]" + _brEsc(r[2]) + "['\"`?]");
  return new RegExp('\\b' + _brEsc(p.code) + '\\b');
}
/* The body that follows a definition: brace matching from the first brace
   (for a route, the handler's own), capped. A naive count — a brace inside a
   string can end it early, which costs a link, never invents one. */
const BRAIN_BODY_MAX = 60000;
function brainBody(text, at, isRoute){
  let open = -1;
  if (isRoute){ const a = text.indexOf('=> {', at); if (a >= 0 && a - at < 400) open = a + 3; }
  if (open < 0){ open = text.indexOf('{', at); if (open < 0 || open - at > 400) return text.slice(at, text.indexOf('\n', at) + 1 || at + 200); }
  let d = 0;
  const end = Math.min(text.length, open + BRAIN_BODY_MAX);
  for (let i = open; i < end; i++){
    const ch = text[i];
    if (ch === '{') d++;
    else if (ch === '}'){ d--; if (d === 0) return text.slice(at, i + 1); }
  }
  return text.slice(at, end);
}

/* ONE READING OF THE CODE. `files` is { 'js/core.js': text, … } — the host
   decides which files; this decides nothing about the disk. Returns plain
   data: where each named part is, the links between named parts, every name
   the code publishes, and any flow step whose part is gone. */
function brainRead(files){
  const names = Object.keys(files || {}).sort();
  const parts = {};
  const bodies = {};
  for (const p of BRAIN_PARTS){
    const defs = brainDefs(p);
    let hit = null;
    for (const f of names){
      const t = files[f];
      let k = -1;
      for (const d of defs){ const at = t.indexOf(d); if (at >= 0 && (k < 0 || at < k)) k = at; }
      if (k >= 0){ hit = { f, k }; break; }
    }
    if (!hit){ parts[p.id] = { found: false }; continue; }
    const t = files[hit.f];
    parts[p.id] = { found: true, file: hit.f, line: t.slice(0, hit.k).split('\n').length };
    /* A link is what the CODE does, never what a note beside it says: this
       codebase explains itself at length, so comments come off first. */
    bodies[p.id] = brainBody(t, hit.k, _BR_ROUTE.test(p.code)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  }
  const edges = [];
  for (const a of BRAIN_PARTS){
    const body = bodies[a.id]; if (!body) continue;
    for (const b of BRAIN_PARTS){
      if (a === b || !parts[b.id].found) continue;
      const re = brainMention(b);
      if (re && re.test(body)) edges.push([a.id, b.id]);
    }
  }
  const published = [];
  const seen = new Set();
  for (const f of names){
    const t = files[f];
    if (/^js\//.test(f)){
      const re = /Object\.assign\(\s*window\s*,\s*\{([\s\S]*?)\}\s*\)/g;
      let m;
      while ((m = re.exec(t))){
        for (const raw of m[1].split(',')){
          const n = raw.split(':')[0].replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').trim();
          if (/^[A-Za-z_$][\w$]*$/.test(n) && !seen.has(n)){ seen.add(n); published.push({ name: n, file: f }); }
        }
      }
    } else {
      const re = /\bapp\.(get|post|put|patch|delete)\(\s*'([^']+)'/g;
      let m;
      while ((m = re.exec(t))){
        const n = m[1].toUpperCase() + ' ' + m[2];
        if (!seen.has(n)){ seen.add(n); published.push({ name: n, file: f }); }
      }
    }
  }
  const flowGaps = [];
  BRAIN_FLOWS.forEach(fl => fl.steps.forEach((s, i) => s.forEach(id => {
    if (!parts[id] || !parts[id].found) flowGaps.push({ flow: fl.id, step: i + 1, part: id });
  })));
  return { parts, edges, published, flowGaps };
}

/* A fingerprint of the reading: it moves only when the shape of the code
   moved (a part found or lost, a link made or cut, a name published or
   retired), never because a file was touched without changing any of that. */
function brainKey(map){
  const s = JSON.stringify([
    Object.keys(map.parts || {}).sort().map(k => k + ':' + (map.parts[k].found ? 1 : 0)),
    (map.edges || []).map(e => e.join('>')).sort(),
    (map.published || []).map(p => p.name).sort()
  ]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36) + '.' + s.length.toString(36);
}

/* What changed between two readings. `prev` null means this is the first
   reading on this server: a baseline, nothing is "new". Lists are capped and
   what was left out is counted. */
const BRAIN_DIFF_MAX = 40;
function brainDiff(prev, next){
  if (!prev) return { first: true, born: [], bornMore: 0, retired: [], retiredMore: 0, edgesAdded: [], edgesCut: 0, lost: [], found: [] };
  const pn = new Set((prev.published || []).map(p => p.name));
  const nn = new Set((next.published || []).map(p => p.name));
  const bornAll = (next.published || []).filter(p => !pn.has(p.name));
  const retiredAll = (prev.published || []).filter(p => !nn.has(p.name)).map(p => p.name);
  const pe = new Set((prev.edges || []).map(e => e.join('>')));
  const ne = new Set((next.edges || []).map(e => e.join('>')));
  const edgesAdded = (next.edges || []).filter(e => !pe.has(e.join('>')));
  const edgesCut = (prev.edges || []).filter(e => !ne.has(e.join('>'))).length;
  const pf = id => !!(prev.parts && prev.parts[id] && prev.parts[id].found);
  const nf = id => !!(next.parts && next.parts[id] && next.parts[id].found);
  const lost = BRAIN_PARTS.filter(p => pf(p.id) && !nf(p.id)).map(p => p.id);
  const found = BRAIN_PARTS.filter(p => !pf(p.id) && nf(p.id)).map(p => p.id);
  return {
    first: false,
    born: bornAll.slice(0, BRAIN_DIFF_MAX).map(p => ({ name: p.name, file: p.file, reg: brainRegionOfFile(p.file), floor: brainFloorOfFile(p.file) })),
    bornMore: Math.max(0, bornAll.length - BRAIN_DIFF_MAX),
    retired: retiredAll.slice(0, BRAIN_DIFF_MAX), retiredMore: Math.max(0, retiredAll.length - BRAIN_DIFF_MAX),
    edgesAdded: edgesAdded.slice(0, BRAIN_DIFF_MAX), edgesCut, lost, found
  };
}

const BRAIN_API = { BRAIN_REGIONS, BRAIN_FLOORS, BRAIN_PARTS, BRAIN_FLOWS, BRAIN_FILE_REGION, BRAIN_BODY_MAX, BRAIN_DIFF_MAX,
  brainRegionOfFile, brainFloorOfFile, brainDefs, brainMention, brainBody, brainRead, brainKey, brainDiff };
if (typeof window !== 'undefined') Object.assign(window, BRAIN_API);
if (typeof module !== 'undefined' && module.exports) module.exports = BRAIN_API;
