// HaTi — signature capture pad (Layer 2: the visible mark).
// DocuSign-style: each signer freely chooses Draw / Type / Upload. The result
// is a PNG data URL + metadata; its hash is folded into the SHA-256 seal
// (see sealString/finalizeExecution) so the mark is as tamper-evident as the
// text. Identity (login / email OTP) is handled elsewhere — this is only the
// mark. Globals are window-attached to match the app's single-scope model.

const SIG_W = 520, SIG_H = 170;               // captured mark canvas size (px)
const SIG_LS_KEY = 'hati_saved_sig';          // adopt-and-reuse store (both modes)

// A few handwriting styles for the Type tab. Web-safe cursive stacks — the
// rendered PNG bakes whatever the browser has, so no webfont download needed.
const SIG_FONTS = [
  { id:'flow',    label:'Flowing',   css:"'Segoe Script','Bradley Hand','Snell Roundhand','Apple Chancery',cursive" },
  { id:'brush',   label:'Brush',     css:"'Brush Script MT','Segoe Script',cursive" },
  { id:'formal',  label:'Formal',    css:"'Snell Roundhand','Apple Chancery','Segoe Script',cursive" },
];

function getSavedSignature(){ try{ return JSON.parse(localStorage.getItem(SIG_LS_KEY)||'null'); }catch(e){ return null; } }
function setSavedSignature(sig){ try{ if(sig) localStorage.setItem(SIG_LS_KEY, JSON.stringify(sig)); else localStorage.removeItem(SIG_LS_KEY); }catch(e){} }

// Render typed text onto a transparent canvas in the chosen style → PNG.
function renderTypedSignature(name, fontCss){
  const cv=document.createElement('canvas'); cv.width=SIG_W; cv.height=SIG_H;
  const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,SIG_W,SIG_H);
  ctx.fillStyle='#15324a'; ctx.textAlign='center'; ctx.textBaseline='middle';
  // shrink to fit width
  let size=64;
  do { ctx.font=`${size}px ${fontCss}`; if(ctx.measureText(name).width<=SIG_W-40) break; size-=2; } while(size>20);
  ctx.fillText(name||'', SIG_W/2, SIG_H/2+4);
  return cv.toDataURL('image/png');
}

// Downscale an uploaded image to fit the mark box, transparent-padded → PNG.
function normaliseUploadedSignature(file){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      const cv=document.createElement('canvas'); cv.width=SIG_W; cv.height=SIG_H;
      const ctx=cv.getContext('2d');
      const scale=Math.min((SIG_W-16)/img.width,(SIG_H-16)/img.height,1);
      const w=img.width*scale, h=img.height*scale;
      ctx.drawImage(img,(SIG_W-w)/2,(SIG_H-h)/2,w,h);
      resolve(cv.toDataURL('image/png'));
    };
    img.onerror=()=>reject(new Error('Could not read that image'));
    const rd=new FileReader(); rd.onload=()=>{ img.src=rd.result; }; rd.onerror=()=>reject(new Error('Could not read that file')); rd.readAsDataURL(file);
  });
}

/* Open the pad. Resolves to { form, image, imageHash, typedName, font } or null
   if cancelled. `opts.name` pre-fills the Type tab; `opts.saved` (default true)
   offers the adopted signature if one exists. */
function openSignaturePad(opts={}){
  const wantSaved = opts.saved!==false;
  const saved = wantSaved ? getSavedSignature() : null;
  return new Promise(resolve=>{
    const ov=document.createElement('div');
    ov.id='sig-pad';
    ov.style.cssText='position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;padding:16px';
    const C='var(--color-divider)', ACC='var(--color-accent)', ACC8='var(--color-accent-800)', TXT='var(--color-text)', N6='var(--color-neutral-600)', N7='var(--color-neutral-700)';
    ov.innerHTML=`
      <div style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 45%,transparent)"></div>
      <div class="modal-in" style="position:relative;width:100%;max-width:560px;background:var(--color-surface);border:1px solid ${C};box-shadow:var(--shadow-lg);border-radius:8px;overflow:hidden">
        <div style="padding:16px 20px 0">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:${ACC};display:inline-flex">${icon('finger','w-4 h-4')}</span>
            <h2 style="font-family:var(--font-heading);font-weight:600;font-size:16px;color:${TXT};margin:0;">Adopt your signature</h2>
          </div>
          <p style="font-size:11.5px;color:${N6};margin:6px 0 12px;line-height:1.5;">Draw it, type your name, or upload a scan — your choice. This mark is sealed onto the document.</p>
          <div id="sig-tabs" style="display:flex;gap:4px;border-bottom:1px solid ${C};">
            ${['draw','type','upload'].map((k,i)=>`<button data-sig-tab="${k}" style="flex:0 0 auto;padding:8px 14px;font:inherit;font-size:12.5px;font-weight:600;font-family:var(--font-mono);letter-spacing:.02em;cursor:pointer;background:none;border:0;border-bottom:2px solid transparent;color:${N6};">${k==='draw'?'✎ Draw':k==='type'?'⌨ Type':'⭱ Upload'}</button>`).join('')}
            ${saved?`<button data-sig-tab="saved" style="margin-left:auto;padding:8px 14px;font:inherit;font-size:12.5px;font-weight:600;font-family:var(--font-mono);cursor:pointer;background:none;border:0;border-bottom:2px solid transparent;color:${N6};">★ Saved</button>`:''}
          </div>
        </div>
        <div style="padding:16px 20px 4px">
          <!-- DRAW -->
          <div data-sig-pane="draw">
            <canvas id="sig-canvas" width="${SIG_W}" height="${SIG_H}" style="width:100%;height:auto;border:1.5px dashed ${C};border-radius:10px;background:var(--color-bg);touch-action:none;cursor:crosshair;display:block"></canvas>
            <button id="sig-clear" style="margin-top:8px;font:inherit;font-size:11px;color:${N6};background:none;border:0;cursor:pointer;">Clear</button>
          </div>
          <!-- TYPE -->
          <div data-sig-pane="type" style="display:none">
            <input id="sig-typed" type="text" value="${String(opts.name||'').replace(/"/g,'&quot;')}" placeholder="Type your full name" style="width:100%;min-height:38px;border:1px solid ${C};background:var(--color-surface);border-radius:6px;padding:8px 12px;font-size:14px;color:${TXT};outline:none;margin-bottom:10px"/>
            <div id="sig-type-preview" style="height:${SIG_H*0.55}px;border:1.5px dashed ${C};border-radius:10px;background:var(--color-bg);display:grid;place-items:center;overflow:hidden"></div>
            <div id="sig-style-pick" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"></div>
          </div>
          <!-- UPLOAD -->
          <div data-sig-pane="upload" style="display:none">
            <label style="display:grid;place-items:center;height:${SIG_H}px;border:1.5px dashed ${C};border-radius:10px;background:var(--color-bg);cursor:pointer;text-align:center;padding:12px">
              <input id="sig-file" type="file" accept="image/*" style="display:none"/>
              <span id="sig-upload-label" style="font-size:12px;color:${N7};line-height:1.6">${icon('upload','w-5 h-5')}<br>Click to upload an image of your signature</span>
            </label>
          </div>
          <!-- SAVED -->
          ${saved?`<div data-sig-pane="saved" style="display:none">
            <div style="height:${SIG_H}px;border:1.5px solid ${C};border-radius:10px;background:var(--color-bg);display:grid;place-items:center;overflow:hidden"><img src="${saved.image}" alt="Saved signature" style="max-width:90%;max-height:80%"/></div>
            <div style="font-size:11px;color:${N6};margin-top:8px;font-family:var(--font-mono)">Your adopted signature (${saved.form})</div>
          </div>`:''}
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px 20px 18px;flex-wrap:wrap;border-top:1px solid ${C};margin-top:8px">
          <label style="display:flex;align-items:center;gap:7px;font-size:11.5px;color:${N7};cursor:pointer">
            <input id="sig-adopt" type="checkbox" ${saved?'checked':''} style="width:15px;height:15px;accent-color:${ACC}"/> Save my signature for next time
          </label>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button id="sig-cancel" class="ui-btn" style="padding:8px 16px;font-size:13px">Cancel</button>
            <button id="sig-adopt-go" class="ui-btn ui-btn-primary" style="padding:8px 18px;font-size:13px">${icon('finger','w-4 h-4')} Adopt &amp; sign</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);

    let tab='draw', fontId=SIG_FONTS[0].id;
    const q=s=>ov.querySelector(s);
    const done=val=>{ document.removeEventListener('keydown',onKey,true); ov.remove(); resolve(val); };
    function onKey(e){ if(e.key==='Escape'){ e.preventDefault(); done(null); } }
    document.addEventListener('keydown',onKey,true);
    ov.addEventListener('mousedown',e=>{ if(e.target===ov||e.target===ov.firstElementChild) done(null); });

    // ---- tabs ----
    const panes=['draw','type','upload','saved'];
    function showTab(k){
      tab=k;
      panes.forEach(p=>{ const el=ov.querySelector(`[data-sig-pane="${p}"]`); if(el) el.style.display = p===k?'':'none'; });
      ov.querySelectorAll('[data-sig-tab]').forEach(b=>{
        const on=b.getAttribute('data-sig-tab')===k;
        b.style.borderBottomColor=on?'var(--color-accent)':'transparent';
        b.style.color=on?'var(--color-accent-800)':'var(--color-neutral-600)';
      });
      if(k==='type') paintTypePreview();
    }
    ov.querySelectorAll('[data-sig-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.getAttribute('data-sig-tab'))));

    // ---- draw ----
    const canvas=q('#sig-canvas'), ctx=canvas.getContext('2d');
    ctx.lineWidth=2.6; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle='#15324a';
    let drawing=false, drawn=false, lastPt=null;
    const ptOf=e=>{ const r=canvas.getBoundingClientRect(); const sx=canvas.width/r.width, sy=canvas.height/r.height;
      const cx=(e.touches?e.touches[0].clientX:e.clientX)-r.left, cy=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
      return { x:cx*sx, y:cy*sy }; };
    const start=e=>{ e.preventDefault(); drawing=true; lastPt=ptOf(e); };
    const move=e=>{ if(!drawing) return; e.preventDefault(); const p=ptOf(e);
      ctx.beginPath(); ctx.moveTo(lastPt.x,lastPt.y); ctx.lineTo(p.x,p.y); ctx.stroke(); lastPt=p; drawn=true; };
    const end=()=>{ drawing=false; };
    canvas.addEventListener('pointerdown',start); canvas.addEventListener('pointermove',move);
    window.addEventListener('pointerup',end);
    q('#sig-clear').addEventListener('click',()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); drawn=false; });

    // ---- type ----
    const styleWrap=q('#sig-style-pick');
    if(styleWrap){
      styleWrap.innerHTML=SIG_FONTS.map(f=>`<button data-sig-font="${f.id}" style="border:1px solid var(--color-divider);border-radius:8px;padding:6px 14px;font-family:${f.css.replace(/"/g,'&quot;')};font-size:20px;color:var(--color-neutral-700);background:var(--color-surface);cursor:pointer">${String(opts.name||'Your Name').replace(/</g,'&lt;')}</button>`).join('');
      styleWrap.querySelectorAll('[data-sig-font]').forEach(b=>b.addEventListener('click',()=>{ fontId=b.getAttribute('data-sig-font'); paintTypePreview(); }));
    }
    function currentFont(){ return SIG_FONTS.find(f=>f.id===fontId)||SIG_FONTS[0]; }
    function paintTypePreview(){
      const name=q('#sig-typed').value||'';
      const prev=q('#sig-type-preview');
      styleWrap && styleWrap.querySelectorAll('[data-sig-font]').forEach(b=>{
        const on=b.getAttribute('data-sig-font')===fontId;
        b.style.borderColor=on?'var(--color-accent)':'var(--color-divider)';
        b.style.color=on?'var(--color-accent-800)':'var(--color-neutral-700)';
        b.style.boxShadow=on?'0 0 0 3px var(--color-accent-100)':'none';
      });
      prev.innerHTML=`<span style="font-family:${currentFont().css.replace(/"/g,'&quot;')};font-size:40px;color:var(--color-accent-800);line-height:1;padding:8px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${(name||'&nbsp;').replace(/</g,'&lt;')}</span>`;
    }
    q('#sig-typed')?.addEventListener('input',paintTypePreview);

    // ---- upload ----
    let uploadedDataUrl=null;
    q('#sig-file')?.addEventListener('change',async e=>{
      const f=e.target.files&&e.target.files[0]; if(!f) return;
      try{ uploadedDataUrl=await normaliseUploadedSignature(f);
        q('#sig-upload-label').innerHTML=`<img src="${uploadedDataUrl}" alt="signature" style="max-height:${SIG_H-30}px;max-width:100%"/>`;
      }catch(err){ toast(err.message||'Could not read that image','err'); }
    });

    showTab(saved?'saved':'draw');

    // ---- adopt ----
    q('#sig-cancel').addEventListener('click',()=>done(null));
    q('#sig-adopt-go').addEventListener('click',async()=>{
      let form=tab, image=null, typedName=null, font=null;
      if(tab==='saved' && saved){ form=saved.form; image=saved.image; typedName=saved.typedName||null; font=saved.font||null; }
      else if(tab==='draw'){ if(!drawn){ toast('Draw your signature first','err'); return; } image=canvas.toDataURL('image/png'); }
      else if(tab==='type'){ typedName=(q('#sig-typed').value||'').trim(); if(!typedName){ toast('Type your name first','err'); return; }
        font=fontId; image=renderTypedSignature(typedName,currentFont().css); }
      else if(tab==='upload'){ if(!uploadedDataUrl){ toast('Upload an image first','err'); return; } image=uploadedDataUrl; }
      if(!image){ toast('Add a signature first','err'); return; }
      const imageHash=await sha256(image);
      const out={ form, image, imageHash, typedName, font };
      if(q('#sig-adopt').checked) setSavedSignature(out); else if(saved && !q('#sig-adopt').checked) setSavedSignature(null);
      done(out);
    });
  });
}

Object.assign(window,{openSignaturePad,getSavedSignature,setSavedSignature,renderTypedSignature,SIG_FONTS});
