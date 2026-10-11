/* LDD Sticky Notes — floating sticky notes on MyDesigns pages */
(function(){
if(window.__lddStickyLoaded)return;window.__lddStickyLoaded=true;
const KEY="lddStickyNotes";
const COLORS=["#fff0af","#ffcbdc","#c9e5ff","#d7edc3","#e1d3ff","#ffd7b0","#fafafa"];
let notes=[],root=null,visible=true,zTop=2147483000;
const uid=()=>"sn"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
async function load(){try{const d=await chrome.storage.local.get(KEY);notes=Array.isArray(d[KEY])?d[KEY]:[];}catch(_){notes=[];}}
async function save(){try{await chrome.storage.local.set({[KEY]:notes});}catch(_){}}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
const _snStyle=document.createElement("style");
_snStyle.textContent=`[data-t][data-empty="1"]:empty:before{content:attr(data-ph);opacity:.4;pointer-events:none;}`;
document.head.appendChild(_snStyle);
function ensureRoot(){
  if(root)return root;
  root=document.createElement("div");root.id="ldd-sticky-root";
  root.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:2147483000;";
  document.documentElement.appendChild(root);
  // launcher button
  const btn=document.createElement("button");btn.id="ldd-sticky-launcher";
  btn.title="StickyDragon";btn.innerHTML="📝";
  btn.style.cssText="position:fixed;right:14px;bottom:14px;width:44px;height:44px;border-radius:50%;border:1px solid var(--ldd-border,#333);background:var(--ldd-panel,#1a1d24);color:var(--ldd-text,#fff);font-size:20px;cursor:pointer;pointer-events:auto;z-index:2147483647;box-shadow:0 4px 16px rgba(0,0,0,.4);";
  btn.onclick=e=>{e.stopPropagation();toggleMenu(btn);};
  document.documentElement.appendChild(btn);
  return root;
}
function toggleMenu(btn){
  document.querySelector("#ldd-sticky-menu")?.remove();
  const m=document.createElement("div");m.id="ldd-sticky-menu";
  m.style.cssText="position:fixed;right:66px;bottom:14px;background:var(--ldd-panel,#1a1d24);border:1px solid var(--ldd-border,#333);border-radius:10px;padding:8px;z-index:2147483647;pointer-events:auto;display:flex;flex-direction:column;gap:4px;min-width:150px;";
  const hidden=notes.filter(n=>n.hidden);
  m.innerHTML=`<button data-act="new" style="padding:8px;border:0;background:transparent;color:inherit;cursor:pointer;text-align:left;border-radius:6px;">➕ New note</button>
  <button data-act="toggle" style="padding:8px;border:0;background:transparent;color:inherit;cursor:pointer;text-align:left;border-radius:6px;">${visible?"🙈 Hide all":"👁 Show all"}</button>
  ${hidden.length?`<div style="border-top:1px solid var(--ldd-border,#333);margin-top:4px;padding-top:6px;font-size:11px;opacity:.7;padding-left:8px;">Hidden notes</div>`:""}
  ${hidden.map(n=>`<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;font-size:12px;">
    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(n.text||"Empty note").slice(0,24)}</span>
    <button data-restore="${n.id}" style="border:0;background:transparent;color:inherit;cursor:pointer;" title="Show">👁</button>
    <button data-delperm="${n.id}" style="border:0;background:transparent;color:inherit;cursor:pointer;" title="Delete forever">🗑</button>
  </div>`).join("")}`;
  m.querySelectorAll("button").forEach(b=>b.onmouseenter=()=>b.style.background="rgba(128,128,128,.15)");
  m.querySelectorAll("button").forEach(b=>b.onmouseleave=()=>b.style.background="transparent");
  m.querySelector('[data-act="new"]').onclick=()=>{m.remove();createNote();};
  m.querySelector('[data-act="toggle"]').onclick=()=>{m.remove();visible=!visible;render();};
  m.querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>{const nn=notes.find(x=>x.id===b.dataset.restore);if(nn){nn.hidden=false;save();render();}m.remove();});
  m.querySelectorAll("[data-delperm]").forEach(b=>b.onclick=()=>{if(confirm("Delete forever?")){notes=notes.filter(x=>x.id!==b.dataset.delperm);save();render();m.remove();}});
  document.documentElement.appendChild(m);
  setTimeout(()=>document.addEventListener("mousedown",function h(e){if(!m.contains(e.target)&&e.target!==btn){m.remove();document.removeEventListener("mousedown",h);}}),10);
}
function createNote(){
  const n={id:uid(),x:Math.round(120+Math.random()*200),y:Math.round(120+Math.random()*150),w:220,h:200,color:COLORS[Math.floor(Math.random()*COLORS.length)],text:"",min:false,z:++zTop,fs:13};
  notes.push(n);save();render();visible=true;
}
function render(){
  ensureRoot();
  root.querySelectorAll(".ldd-sticky").forEach(e=>e.remove());
  if(!visible)return;
  notes.forEach(n=>{
    if(n.hidden)return;
    n.x=Math.max(0,Math.min(n.x||0,window.innerWidth-60));
    n.y=Math.max(0,Math.min(n.y||0,window.innerHeight-40));
    const el=document.createElement("div");
    el.className="ldd-sticky";el.dataset.id=n.id;
    el.style.cssText=`position:absolute;left:${n.x}px;top:${n.y}px;width:${n.w}px;${n.min?"":`height:${n.h}px;`}background:${n.color};border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:auto;display:flex;flex-direction:column;overflow:hidden;z-index:${n.z||2147483000};color:#333;`;
    el.innerHTML=`
      <div class="ldd-stick-head" style="display:flex;align-items:center;gap:4px;padding:5px 6px;cursor:move;background:rgba(0,0,0,.06);user-select:none;position:relative;">
        <span style="position:absolute;left:50%;top:-10px;transform:translateX(-50%);font-size:16px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3));">📌</span>
        <span style="font-size:11px;opacity:.6">⠿</span>
        <span style="flex:1"></span>
        <button data-a="fsm" title="Smaller text" style="border:0;background:transparent;cursor:pointer;font-size:11px;padding:2px 4px;">A-</button>
        <button data-a="fsp" title="Larger text" style="border:0;background:transparent;cursor:pointer;font-size:13px;padding:2px 4px;">A+</button>
        <button data-a="bold" title="Bold" style="border:0;background:transparent;cursor:pointer;font-size:12px;padding:2px 4px;font-weight:700;">B</button>
        <button data-a="ital" title="Italic" style="border:0;background:transparent;cursor:pointer;font-size:12px;padding:2px 4px;font-style:italic;">I</button>
        <button data-a="und" title="Underline" style="border:0;background:transparent;cursor:pointer;font-size:12px;padding:2px 4px;text-decoration:underline;">U</button>
        <button data-a="draw" title="Scribble" style="border:0;background:transparent;cursor:pointer;font-size:13px;padding:2px 4px;">✏️</button>
        <button data-a="min" title="${n.min?"Expand":"Minimize"}" style="border:0;background:transparent;cursor:pointer;font-size:12px;padding:2px 5px;">${n.min?"+":"–"}</button>
        <button data-a="col" title="Color" style="border:0;background:transparent;cursor:pointer;font-size:12px;padding:2px 5px;">🎨</button>
        <button data-a="del" title="Hide note" style="border:0;background:transparent;cursor:pointer;font-size:12px;padding:2px 5px;">✕</button>
      </div>
      ${n.min?"":`<div data-t contenteditable="true" data-ph="Type here…" style="flex:1;border:0;background:transparent;outline:none;padding:8px;font:${n.fs||13}px/1.5 inherit;color:#333;overflow:auto;">${n.html||esc(n.text)}</div>
      <div data-c style="display:none;padding:6px;gap:4px;flex-wrap:wrap;background:rgba(255,255,255,.5)">${COLORS.map(c=>`<button data-cc="${c}" style="width:20px;height:20px;border-radius:50%;border:2px solid ${c===n.color?"#333":"transparent"};background:${c};cursor:pointer;padding:0;"></button>`).join("")}</div>
      <div data-rz title="Resize" style="position:absolute;right:2px;bottom:2px;width:16px;height:16px;cursor:nwse-resize;font-size:12px;line-height:16px;text-align:center;opacity:.4;">↘</div>
      <canvas data-cv style="position:absolute;inset:0;width:100%;height:100%;display:none;cursor:crosshair;touch-action:none;"></canvas>
      <div data-dt style="position:absolute;top:34px;right:6px;display:none;gap:4px;background:rgba(255,255,255,.9);border-radius:8px;padding:5px;box-shadow:0 2px 8px rgba(0,0,0,.2);">
        <button data-dc="#333333" style="width:18px;height:18px;border-radius:50%;background:#333333;border:2px solid #999;cursor:pointer;padding:0;"></button>
        <button data-dc="#c0392b" style="width:18px;height:18px;border-radius:50%;background:#c0392b;border:2px solid #999;cursor:pointer;padding:0;"></button>
        <button data-dc="#2471a3" style="width:18px;height:18px;border-radius:50%;background:#2471a3;border:2px solid #999;cursor:pointer;padding:0;"></button>
        <button data-dc="#1e8449" style="width:18px;height:18px;border-radius:50%;background:#1e8449;border:2px solid #999;cursor:pointer;padding:0;"></button>
        <button data-dclear title="Clear drawing" style="border:0;background:transparent;cursor:pointer;font-size:12px;">🗑</button>
        <button data-dx title="Done" style="border:0;background:transparent;cursor:pointer;font-size:12px;">✓</button>
      </div>`}
    `;
    // drag
    const head=el.querySelector(".ldd-stick-head");
    head.addEventListener("mousedown",e=>{
      if(e.target.closest("button"))return;
      n.z=++zTop;el.style.zIndex=n.z;
      const sx=e.clientX-n.x,sy=e.clientY-n.y;
      const mv=ev=>{n.x=Math.max(0,Math.min(ev.clientX-sx,window.innerWidth-60));n.y=Math.max(0,Math.min(ev.clientY-sy,window.innerHeight-40));el.style.left=n.x+"px";el.style.top=n.y+"px";};
      const up=()=>{document.removeEventListener("mousemove",mv);document.removeEventListener("mouseup",up);save();};
      document.addEventListener("mousemove",mv);document.addEventListener("mouseup",up);
      e.preventDefault();
    });
    // resize via ResizeObserver on textarea parent
    if(!n.min){
      const ta=el.querySelector("[data-t]");
      let t=null;
      // placeholder
      const updPh=()=>{ta.dataset.empty=ta.textContent.trim()?"":"1";};
      updPh();
      if(!ta.textContent.trim()){ta.innerHTML="";}
      ta.addEventListener("input",()=>{n.html=ta.innerHTML;n.text=ta.textContent;updPh();clearTimeout(t);t=setTimeout(save,400);});
      ta.addEventListener("blur",()=>{n.html=ta.innerHTML;n.text=ta.textContent;save();});
      const fmt=(cmd)=>{ta.focus();document.execCommand(cmd,false,null);n.html=ta.innerHTML;n.text=ta.textContent;save();};
      const bb=el.querySelector('[data-a="bold"]'),ii=el.querySelector('[data-a="ital"]'),uu=el.querySelector('[data-a="und"]');
      if(bb)bb.onmousedown=e=>{e.preventDefault();fmt("bold");};
      if(ii)ii.onmousedown=e=>{e.preventDefault();fmt("italic");};
      if(uu)uu.onmousedown=e=>{e.preventDefault();fmt("underline");};
      // size tracked by custom resize handle
el.style.minWidth="150px";el.style.minHeight="120px";el.style.overflow="hidden";
    }
    el.querySelector('[data-a="min"]').onclick=()=>{n.min=!n.min;save();render();};
    const fsm=el.querySelector('[data-a="fsm"]'),fsp=el.querySelector('[data-a="fsp"]');
    if(fsm)fsm.onclick=()=>{n.fs=Math.max(9,(n.fs||13)-1);save();const ta=el.querySelector("[data-t]");if(ta)ta.style.fontSize=n.fs+"px";};
    if(fsp)fsp.onclick=()=>{n.fs=Math.min(28,(n.fs||13)+1);save();const ta=el.querySelector("[data-t]");if(ta)ta.style.fontSize=n.fs+"px";};
    el.querySelector('[data-a="del"]').onclick=()=>{n.hidden=true;save();render();};
    const colBtn=el.querySelector('[data-a="col"]');
    if(colBtn)colBtn.onclick=()=>{
      const c=el.querySelector("[data-c]");
      c.style.display=c.style.display==="none"?"flex":"none";
      c.querySelectorAll("[data-cc]").forEach(b=>b.onclick=()=>{n.color=b.dataset.cc;save();render();});
    };
    const rz=el.querySelector("[data-rz]");
    if(rz)rz.addEventListener("mousedown",e=>{
      e.stopPropagation();e.preventDefault();
      const sw=n.w,sh=n.h,sx=e.clientX,sy=e.clientY;
      const mv=ev=>{n.w=Math.max(150,sw+ev.clientX-sx);n.h=Math.max(120,sh+ev.clientY-sy);el.style.width=n.w+"px";el.style.height=n.h+"px";};
      const up=()=>{document.removeEventListener("mousemove",mv);document.removeEventListener("mouseup",up);save();};
      document.addEventListener("mousemove",mv);document.addEventListener("mouseup",up);
    });
    const cv=el.querySelector("[data-cv]"),dt=el.querySelector("[data-dt]");
    let drawing=false,penColor="#333333",ctx=null;
    const setupCanvas=()=>{
      const r=el.getBoundingClientRect();
      cv.width=r.width;cv.height=r.height;
      ctx=cv.getContext("2d");ctx.lineWidth=2.5;ctx.lineCap="round";ctx.strokeStyle=penColor;
      if(n.drawing){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0);img.src=n.drawing;}
    };
    const drawBtn=el.querySelector('[data-a="draw"]');
    if(drawBtn)drawBtn.onclick=()=>{
      const on=cv.style.display!=="none";
      if(on){ // save and hide
        try{n.drawing=cv.toDataURL("image/png");}catch(_){}
        save();cv.style.display="none";dt.style.display="none";
      }else{
        setupCanvas();cv.style.display="block";dt.style.display="flex";
      }
    };
    if(dt){
      dt.querySelectorAll("[data-dc]").forEach(b=>b.onclick=()=>{penColor=b.dataset.dc;if(ctx)ctx.strokeStyle=penColor;});
      const clr=dt.querySelector("[data-dclear]");
      if(clr)clr.onclick=()=>{if(ctx){ctx.clearRect(0,0,cv.width,cv.height);}n.drawing="";save();};
      const dx=dt.querySelector("[data-dx]");
      if(dx)dx.onclick=()=>{try{n.drawing=cv.toDataURL("image/png");}catch(_){}save();cv.style.display="none";dt.style.display="none";};
    }
    if(cv){
      const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*(cv.width/r.width),(e.clientY-r.top)*(cv.height/r.height)];};
      cv.addEventListener("mousedown",e=>{drawing=true;const[x,y]=pos(e);ctx.beginPath();ctx.moveTo(x,y);e.stopPropagation();});
      cv.addEventListener("mousemove",e=>{if(!drawing)return;const[x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke();});
      const stop=()=>{if(drawing){drawing=false;try{n.drawing=cv.toDataURL("image/png");}catch(_){}save();}};
      cv.addEventListener("mouseup",stop);cv.addEventListener("mouseleave",stop);
    }
    // restore drawing on render (as background image under text)
    if(n.drawing&&!n.min){
      const bg=document.createElement("div");
      bg.style.cssText=`position:absolute;inset:0;pointer-events:none;background:url(${n.drawing}) no-repeat;background-size:100% 100%;opacity:.9;`;
      bg.className="ldd-stick-bg";
      el.insertBefore(bg,el.querySelector("[data-t]"));
    }
    el.addEventListener("mousedown",()=>{n.z=++zTop;el.style.zIndex=n.z;});
    root.appendChild(el);
  });
}
async function init(){
  await load();
  ensureRoot();render();
  // re-render on storage change (multi-tab sync)
  try{chrome.storage.onChanged.addListener((c,a)=>{
    if(a!=="local"||!c[KEY])return;
    // don't rebuild while typing — it steals focus
    const ae=document.activeElement;
    if(ae&&ae.closest&&ae.closest(".ldd-sticky")){notes=c[KEY].newValue||[];return;}
    notes=c[KEY].newValue||[];render();
  });}catch(_){}
}
// wait for MyDesigns SPA to settle before showing notes
function initWhenReady(){
  let tries=0;
  const tick=()=>{
    tries++;
    // MyDesigns app root or body has content
    const ready=document.querySelector("#app, #root, main, [data-app]")||document.body.children.length>2;
    if(ready||tries>20){init();return;}
    setTimeout(tick,250);
  };
  tick();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initWhenReady);else initWhenReady();
window.lddStickyNew=()=>{visible=true;createNote();};
})();
