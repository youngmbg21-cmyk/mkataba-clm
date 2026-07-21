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
  if(!res.ok) throw new Error(data?.error||('Request failed ('+res.status+')'));
  return data;
}
async function loadBootstrap(){
  const b=await api('bootstrap');
  REMOTE={ org:b.org, me:b.me, users:b.users };
  uid=b.uid||uid; state.settings=b.settings||{}; state.totalCount=b.count||0; state.aiConfigured=!!b.aiConfigured;
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
Object.assign(window,{API_MODE,api,loadBootstrap});
