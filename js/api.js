// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
const API_MODE=()=>!!REMOTE;
async function api(path, method='GET', body){
  const res=await fetch('api/'+path,{ method,
    headers:body?{'Content-Type':'application/json'}:undefined,
    body:body?JSON.stringify(body):undefined, credentials:'same-origin' });
  let data=null; try{ data=await res.json(); }catch(e){}
  // Rate-limit / daily-ceiling responses (429) carry a friendly message —
  // surface it centrally so every caller shows it, even ones that otherwise
  // fall back silently to a heuristic.
  /* ---- THE SERVER'S SENTENCE, IN THE READER'S LANGUAGE ----
     The server answers in English — a message answers a REQUEST, and a share
     link carries no account for it to read a language off. This is the ONE
     place a server sentence becomes an Error, so one lookup here reaches all
     ~200 callers and there is no second place it could be done differently.
     srvMsg passes an unknown sentence through untouched, so adding a message
     on the server can never break this. Read through window: js/api.js loads
     before js/i18n.js on some stages, and a bare cross-module read throws. */
  const _sm = m => (typeof window!=='undefined' && typeof window.srvMsg==='function') ? srvMsg(m) : m;
  if(res.status===429&&data&&data.error&&typeof toast==='function') toast(_sm(data.error),'err');
  if(!res.ok){
    // Carry the structured flags onto the Error so callers can tell "wait a
    // few minutes" (rate limit) from "an admin has to raise a budget"
    // (spendLimit / allowanceExhausted) and degrade accordingly.
    const err=new Error(_sm(data?.error)||('Request failed ('+res.status+')'));
    err.status=res.status; err.data=data||null;
    if(data){ err.spendLimit=!!data.spendLimit; err.dailyLimit=!!data.dailyLimit; err.allowanceExhausted=!!data.allowanceExhausted; err.needsKey=!!data.needsKey; }
    throw err;
  }
  // The server folds a `notice` into an Copilot response when the input was
  // shortened or the configured model was rejected — surface it to the user.
  if(data&&data.notice&&typeof toast==='function') toast(data.notice,'err');
  return data;
}
/* SSE POST for the streaming Copilot chat. Deliberately its OWN helper: api()
   above is JSON-only and every caller relies on that; bending it to also
   speak event-streams would put stream parsing in every JSON call's path.
   Calls onEvent({type:'progress'|'token', ...}) as events arrive and resolves
   with the `final` payload — the same shape api('ai/chat') returns. ANY
   failure (route missing, non-stream response, parse error, network cut
   mid-stream, server error event) throws, and the caller falls back to the
   plain endpoint transparently. */
async function apiStream(path, body, onEvent){
  const res=await fetch('api/'+path,{ method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body), credentials:'same-origin' });
  if(!res.ok||!res.body||!/text\/event-stream/.test(res.headers.get('content-type')||''))
    throw new Error('stream unavailable ('+res.status+')');
  const reader=res.body.getReader(); const dec=new TextDecoder();
  let buf='', final=null;
  const handle=(name,data)=>{
    if(name==='final'){ final=data; return; }
    if(name==='error') throw new Error((data&&data.message)||'stream error');
    if(onEvent) onEvent({type:name,...(data||{})});
  };
  for(;;){
    const {done,value}=await reader.read();
    if(done) break;
    buf+=dec.decode(value,{stream:true});
    let i;
    while((i=buf.indexOf('\n\n'))>=0){
      const frame=buf.slice(0,i); buf=buf.slice(i+2);
      let name='message', data='';
      for(const line of frame.split('\n')){
        if(line.startsWith('event:')) name=line.slice(6).trim();
        else if(line.startsWith('data:')) data+=line.slice(5).trim();
      }
      if(data) handle(name,JSON.parse(data));
    }
  }
  if(!final) throw new Error('stream ended without a final answer');
  // same notice surfacing as api() — the two paths must feel identical
  if(final.notice&&typeof toast==='function') toast(final.notice,'err');
  return final;
}
async function loadBootstrap(){
  const b=await api('bootstrap');
  REMOTE={ org:b.org, me:b.me, users:b.users };
  uid=b.uid||uid; state.settings=b.settings||{}; state.totalCount=b.count||0; state.aiConfigured=!!b.aiConfigured;
  // known at sign-in, so the app can warn before a send fails rather than after
  state.emailConfigured=b.emailConfigured!==false;
  // Load contract SUMMARIES (heavy fields stripped) in pages — full bodies load
  // on open. Capped so a very large portfolio can't blow up the initial load.
  state.contracts=[]; let offset=0; const limit=200; let total=Infinity;
  while(offset<total && state.contracts.length<5000){
    const pg=await api('contracts?limit='+limit+'&offset='+offset);
    total=pg.total;
    pg.rows.forEach(r=>{ const c=migrateContract(r); c._light=true; c._loaded=false; c._v=r._v; state.contracts.push(c); });
    if(!pg.rows.length) break;
    offset+=pg.rows.length;
  }
  state.truncated = total>state.contracts.length;
  // screen position is per-device, not shared with teammates
  const ui=lsGet(LS.ui)||{};
  state.view=ui.view||'dashboard';
  state.activeId=(ui.activeId&&state.contracts.some(c=>c.id===ui.activeId))?ui.activeId:null;
  state.folderId=ui.folderId||null;
  if(state.view==='workspace'&&!state.activeId) state.view='dashboard';
}
Object.assign(window,{API_MODE,api,apiStream,loadBootstrap});
