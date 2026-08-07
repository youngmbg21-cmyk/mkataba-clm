/* WHAT A SWEDISH READER STILL SEES IN ENGLISH.
   ============================================================
   Not a pass/fail test — a MEASURE. It walks every screen with the app in
   Swedish and lists the visible text that is still English, so the size of
   what is left is a number rather than an impression.

   It cannot be a test, because two things it reports are correct and always
   will be. CONTRACT WORDING IS THE CUSTOMER'S and is never translated — a
   Kenyan workspace read by a Swedish speaker shows Swedish buttons over
   English contracts, which is the whole design. And some platform words are
   the same in both languages (Status, Version, Team, Copilot), which reads as
   untranslated and is not.

   So it over-reports on purpose and a human reads the list. The detector is
   deliberately crude: one English function word is enough to flag a phrase,
   which also means Swedish phrases containing "in", "all" or "under" show up.
   Treat the number as a direction of travel, not a score.

   Run: node test/chromium/lang-coverage.js */
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const {startHati,seedWorkspace}=require('./../helpers');
const EXEC=process.env.CHROMIUM_BIN||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);

const VIEWS=['dashboard','register','calendar','intel','templates','team','advice','reports','queue','migration','playbook'];

const COLLECT=()=>{
  /* Skip anything inside the document itself, and anything a customer typed. */
  const SKIP_SEL='.doc-body,.rd-doc,.clause-body,#ws-doc,.m-doc,[contenteditable="true"],script,style,.cl-text,.nego-quote';
  const out=[];
  const seen=new Set();
  const root=document.querySelector('#app-shell')||document.body;
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let n;
  while((n=walk.nextNode())){
    const t=(n.nodeValue||'').replace(/\s+/g,' ').trim();
    if(t.length<2) return_:{ continue; }
    const p=n.parentElement;
    if(!p||p.closest(SKIP_SEL)) continue;
    const r=p.getBoundingClientRect();
    if(r.width<1||r.height<1) continue;
    const cs=getComputedStyle(p);
    if(cs.visibility==='hidden'||cs.display==='none') continue;
    const key=t+'|'+(p.className||'');
    if(seen.has(key)) continue; seen.add(key);
    out.push({t, cls:(typeof p.className==='string'?p.className:'').split(/\s+/)[0]||p.tagName.toLowerCase()});
  }
  /* readable attributes too */
  root.querySelectorAll('[title],[placeholder],[aria-label]').forEach(el=>{
    ['title','placeholder','aria-label'].forEach(a=>{
      const v=el.getAttribute(a); if(!v||v.length<2) return;
      if(el.closest(SKIP_SEL)) return;
      const key='@'+a+'|'+v; if(seen.has(key)) return; seen.add(key);
      out.push({t:v, cls:'@'+a});
    });
  });
  return out;
};

/* English function words that Swedish does not share. One is enough to call a
   phrase English; Swedish text simply does not contain them. */
const EN=new RegExp('\\b(the|and|of|to|for|with|this|that|your|you|are|was|were|from|have|has|had|not|all|any|but|its|it\'s|their|they|them|there|here|what|when|where|which|who|why|how|been|being|will|would|should|could|can|may|might|must|need|needs|needed|make|makes|made|take|takes|show|shows|shown|see|seen|add|added|new|now|yet|still|only|just|more|most|less|least|each|every|both|other|another|same|next|last|first|second|third|before|after|during|while|until|since|about|into|onto|over|under|between|through|against|without|within|per|via|then|than|also|because|so|if|else|no|yes|on|in|at|by|up|down|out|off|as|is|be|do|does|did|get|got|use|used|using|set|sets|due|left|right|open|opened|close|closed|send|sent|sign|signed|signing|draft|drafts|review|reviewed|waiting|pending|active|expired|terms|term|contract|contracts|customize|search|filter|export|download|upload|save|cancel|delete|edit|view|back|next|done|ready|start|started|end|ended|today|week|weeks|month|months|day|days|year|years|ago|idle|none|empty|nothing|everything|someone|anyone|team|people|person|owner|admin|user|users|name|names|status|action|actions|required|value|total|count|link|links|file|files|page|pages|note|notes|comment|comments|change|changes|version|versions|clause|clauses|party|parties|risk|risks|high|low|medium|good|bad|best|worst|live|copy|copied|paste|print|help|about|settings|profile|account|logout|login|password|email|emails|address|phone|company|companies|date|dates|time|times|amount|price|cost|currency|money|report|reports|summary|detail|details|list|lists|item|items|row|rows|column|columns|table|tables|chart|charts|graph|graphs)\\b','i');
/* A Swedish letter or a known Swedish word is proof enough it is translated. */
const SV=/[åäöÅÄÖ]|\b(och|eller|för|med|att|som|den|det|inte|är|var|har|kan|ska|till|från|på|av|en|ett|de|dem|deras|vi|ni|du|jag|här|där|när|hur|vad|vem|alla|inga|ingen|något|allt|nu|då|men|om|så|ju|via|per|dag|dagar|vecka|veckor|månad|år|avtal|villkor|ändring|ändringar|utkast|granskning|underteckna|undertecknat|signera)\b/i;

(async()=>{
  const h=await startHati(); await seedWorkspace(h);
  const b=await chromium.launch({executablePath:EXEC,args:['--no-sandbox']});
  const ctx=await b.newContext({viewport:{width:1440,height:900}});
  const p=await ctx.newPage();
  await p.goto(h.base+'/',{waitUntil:'networkidle'}); await p.waitForTimeout(600);
  await p.fill('#li-email','admin@example.co.ke'); await p.fill('#li-pass','adminpassword1');
  await p.click('#li-go'); await p.waitForTimeout(2400);
  await p.evaluate(()=>window.langSet('sv')); await p.waitForTimeout(800);

  const found={};
  const sweep=async(label)=>{
    const rows=await p.evaluate(COLLECT);
    rows.forEach(r=>{
      if(SV.test(r.t)) return;
      if(!EN.test(r.t)) return;
      (found[label] ||= []).push(r);
    });
  };
  for(const v of VIEWS){
    await p.evaluate(x=>window.setView(x),v); await p.waitForTimeout(500);
    await sweep(v);
  }
  await p.evaluate(()=>window.openWorkspace(window.state.contracts[0].id)); await p.waitForTimeout(900);
  await sweep('contract');
  for(const tab of ['keyterms','signing','history','negotiate']){
    const btn=await p.$(`#ws-tabs [data-room-tab="${tab}"]`);
    if(btn){ await btn.click(); await p.waitForTimeout(800); await sweep('room:'+tab); }
  }

  let total=0;
  Object.entries(found).forEach(([k,v])=>{ total+=v.length; });
  console.log('=== ENGLISH STILL SHOWING, BY SCREEN ===');
  Object.entries(found).sort((a,b)=>b[1].length-a[1].length).forEach(([k,v])=>{
    console.log(`\n--- ${k} (${v.length}) ---`);
    v.slice(0,200).forEach(r=>console.log('   ['+r.cls+'] '+r.t.slice(0,110)));
  });
  console.log('\nTOTAL still-English runs a Swedish reader sees:', total);
  fs.writeFileSync(__dirname+'/lang-coverage.json', JSON.stringify(found,null,1));
  await b.close(); await h.stop();
})().catch(e=>{console.error(e);process.exit(1);});
