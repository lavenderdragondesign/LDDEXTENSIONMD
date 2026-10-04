

/* v1.5.6 — toast service pinned to globalThis; every consumer calls the same runtime object. */
globalThis.lddToast110 = function(msg,force=false,type="info"){
 try{
  const render=(o={toastNotifications:true})=>{
   if(!force&&o.toastNotifications===false)return;
   let wrap=document.getElementById("ldd-toast-stack");
   if(!wrap){wrap=document.createElement("div");wrap.id="ldd-toast-stack";(document.body||document.documentElement).appendChild(wrap);}
   const t=document.createElement("div");t.className=`ldd-toast-item ldd-toast-${type}`;
   const icon=type==="error"?"!":type==="success"?"✓":"◆";
   t.innerHTML=`<span class="ldd-toast-icon">${icon}</span><span class="ldd-toast-copy"></span>`;
   t.querySelector(".ldd-toast-copy").textContent=String(msg||"");wrap.appendChild(t);
   requestAnimationFrame(()=>t.classList.add("show"));
   setTimeout(()=>{t.classList.remove("show");setTimeout(()=>t.remove(),220)},2600);
  };
  if(typeof lddSafeGet==="function")lddSafeGet({toastNotifications:true},render);else render();
 }catch(e){console.warn("[LDD Toast]",msg,e);}
};

/* ===== v0.8.6 extension context safety ===== */
function lddContextAlive(){
  try{return !!chrome?.runtime?.id}catch(_){return false}
}

let lddFontPersistTimer=0;
function lddApplySavedFontDirect(o){
  if(!o)return;
  const family=String(o.appFontFamily||o.lddAppFontFamily||o.selectedAppFont||"").replace(/["'<>]/g,"").trim();
  if(!family)return;

  // Built-in fonts only. A saved selection always wins over the fresh-install default.
  if(family!=="Inter" && family!=="MyDesigns Default"){
    try{lddLoadGoogleFont(family);}catch(_){}
  }

  let st=document.getElementById("ldd-app-font-persist-style");
  if(!st){
    st=document.createElement("style");
    st.id="ldd-app-font-persist-style";
    (document.head||document.documentElement).appendChild(st);
  }
  st.textContent=(family==="Inter"||family==="MyDesigns Default")
    ? ""
    : `html body,html body *:not(svg):not(path):not(g):not(use){font-family:"${family}",sans-serif!important}`;
}
function lddReapplySavedAppFont(){
  try{
    chrome.storage.local.get(null,function(o){ lddApplySavedFontDirect(o||{}); });
  }catch(_){}
}
function lddScheduleFontReapply(){
  clearTimeout(lddFontPersistTimer);
  lddFontPersistTimer=setTimeout(lddReapplySavedAppFont,80);
}
function lddSafeGet(defaults,cb){
  if(!lddContextAlive())return;
  try{chrome.storage.local.get(defaults,r=>{if(lddContextAlive()&&!chrome.runtime.lastError)cb?.(r)})}catch(_){}
}
function lddSafeSet(obj,cb){
  if(!lddContextAlive())return;
  try{chrome.storage.local.set(obj,()=>{if(lddContextAlive()&&!chrome.runtime.lastError)cb?.()})}catch(_){}
}
function lddSafeOnChanged(fn){
  if(!lddContextAlive())return;
  try{
    chrome.storage.onChanged.addListener((changes,area)=>{
      if(!lddContextAlive())return;
      try{fn(changes,area)}catch(_){}
    });
  }catch(_){}
}


const LDD_DEFAULTS = {
  lddMasterEnabled:true,
  lddPerformanceDontAskAgain:false,
  lddSetupMode:"power",
  hotkeysEnabled:true,
  hotkeyHudEnabled:false,
  toastNotifications:true,
  hotkeyMap:{
    upscale:"Alt+1", removeBg:"Alt+2", imageMockups:"Alt+3", videoMockups:"Alt+4",
    canvas:"Alt+5", visionAI:"Alt+6", vectorize:"Alt+7", colorOverlay:"Alt+8", patternOverlay:"Alt+9", imageEffect:"Alt+0",
    resizeImage:"Alt+Shift+1", edit:"Alt+Shift+2", duplicate:"Alt+Shift+3", swapFiles:"Alt+Shift+4", deleteFiles:"Alt+Shift+5",
    bulkTags:"Alt+Shift+6", bulkSyncPublications:"Alt+Shift+7", checkTrademarks:"Alt+Shift+8", searchTrademarks:"Alt+Shift+9", translate:"Alt+Shift+0", deleteAction:"Ctrl+Alt+1"
  },
  hotkeyHudVisible:{upscale:true,removeBg:true,imageMockups:true,videoMockups:true,canvas:true,visionAI:true,vectorize:true},
  warningSuppressed:{},
  customInstructionPresets:[],
  customInstructionClipboard:[],
  themePreset:"native",
  themeBg:"#0b0d10", themePanel:"#12161c", themeText:"#f5f7fa", themeMuted:"#9aa4b2", themeBorder:"#29313d",
  themeHover:"#1b2430", themeSelected:"#20352a", themeSuccess:"#39ff14", themeWarning:"#ffb020", themeError:"#ff5d5d",
  themeDensity:"comfortable", themeUiScale:100,
  showDesignsSearch:true,
  showCompositionGallery:true,
  performanceWarningAccepted:false,
  maxLength:true,
  productPresets:true,
  credits:true,
  hoverPreview:true,
  hoverPreviewSize:"small",
  hoverPreviewDelay:180,
  hoverPreviewSwatches:true,
  hoverPreviewCloseMouseout:true,
  dragUpload:true,
  customProductPresets:[],
  appFont:true,
  appFontFamily:"MyDesigns Default",
  appFontFavorites:[],
  appFontRecent:[],
  themeTweaker:false,
  carouselRenamer:true,
  themeEnabled:false,
  themeColor:"#39ff14",
  themeAccent2:"#00eaff", themeAccent3:"#ff2bd6", themeAccent4:"#9d4dff", themeAccent5:"#ffe600",
  themeGlow:false,
  themeRadius:12,
  themeCards:false,
  headerStore:true,
  headerSearch:true,
  headerNotifications:true,
  headerJobs:true,
  headerIssues:true,
  headerSupport:true,
  headerAccount:true,
  homeGreeting:true, homeRevenue:true, homeTopProducts:true, homeTutorials:true,
  analyticsDescription:true, analyticsDateControls:true, analyticsTabs:true, analyticsMetrics:true, analyticsCharts:true, analyticsTables:true,
  navHome:true,
  navDesigns:true,
  navProducts:true,
  navScoutAI:true,
  scoutAIEnabled:true,
  autoPromptQueueEnabled:false,
  navCanvas:true,
  navDreamAI:true,
  navMockups:true,
  navStores:true,
  navOrders:true,
  navAnalytics:true,
  navAffiliates:true,
  navMDSettings:true,
  designFolders:true,
  productFolders:true,
  perfEnabled:false,
  perfAnimations:true,
  perfBlur:true,
  perfShadows:false,
  perfLightNeon:false,
  perfCompactFolders:false,
  perfPauseHidden:true,
  perfContentVisibility:true,
  perfLazyImages:true,
  perfNoSmoothScroll:true,
  perfHideSupportWidgets:false,
  perfDisableHoverPreview:false,
  perfTinyMD:false,
  perfFreezeOffscreenMedia:true,
  perfReduceObservers:true,
  perfStripDecorations:true,
  perfCompactModals:false,
  perfHideTips:false,
  designMoreButtons:true,
  productMoreButtons:true,
  showCreateWithAI:true,
  perfDeepDebloat:false,
  perfHideToasts:false,
  perfHideAnnouncements:true,
  perfReduceMotionMedia:true,
  perfSuspendHiddenVideos:true,
  perfTrimCardEffects:true,
  perfDenseMenus:false,
  perfDisableTooltips:false,
  wideScrollbars:true,
  scrollbarWidth:20,
  highContrastScrollbars:false,
  visionTitleBox:true,
  visionTitleRows:3
};

if (location.origin !== "https://mydesigns.io" || !(location.pathname === "/app" || location.pathname.startsWith("/app/"))) {
  console.debug("[LDD Tools] Disabled outside https://mydesigns.io/app");
} else {

(() => {
  let cfg={...LDD_DEFAULTS}, hoverTimer=null, dragDepth=0, uploadBusy=false;

  const nativeValue=(el,val)=>{
    const p=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    const s=Object.getOwnPropertyDescriptor(p,"value")?.set;
    s?s.call(el,val):el.value=val;
    el.dispatchEvent(new Event("input",{bubbles:true}));
    el.dispatchEvent(new Event("change",{bubbles:true}));
  };
  const visible=el=>!!(el && (el.offsetWidth||el.offsetHeight||el.getClientRects().length));
  const text=el=>(el?.innerText||el?.textContent||"").trim();

  function unlock(root=document){
    if(!cfg.maxLength)return;
    root.querySelectorAll?.("input[maxlength],textarea[maxlength]").forEach(el=>{
      if(el.maxLength!==100000){el.maxLength=100000;el.setAttribute("maxlength","100000")}
    });
  }

  function creditButton(){
    return document.querySelector('svg g#Credit')?.closest("button")||null;
  }
  function credits(){
    const b=creditButton(); if(b)b.style.display=cfg.credits?"":"none";
  }

  function productSection(){
    return [...document.querySelectorAll("div")].find(d=>{
      const kids=[...d.children];
      return kids.some(k=>text(k)==="Product type") && d.querySelector('input[placeholder="Search option"]');
    });
  }
  function otherInput(){
    const sec=productSection();
    const search=sec?.querySelector('input[placeholder="Search option"]');
    const candidates=[...document.querySelectorAll('input:not([placeholder="Search option"]),textarea')]
      .filter(i=>visible(i) && i.id!=="ldd-custom-color");
    if(search){
      const sr=search.getBoundingClientRect();
      const nearby=candidates.map(i=>{
        const r=i.getBoundingClientRect();
        const dy=Math.abs(r.top-sr.bottom), dx=Math.abs(r.left-sr.left);
        return {i,score:dy+(dx*.25)};
      }).filter(x=>x.i.getBoundingClientRect().top>=sr.top-10 && x.score<500)
        .sort((a,b)=>a.score-b.score);
      if(nearby[0]) return nearby[0].i;
    }
    return candidates.find(i=>/other|please specify/i.test(text(i.closest('.relative.flex.flex-col')||i.parentElement)))||null;
  }


  function addPresetDialog(){
    document.getElementById("ldd-preset-dialog")?.remove();
    const wrap=document.createElement("div");wrap.id="ldd-preset-dialog";
    wrap.innerHTML='<div class="box"><h3>Add Product Type Preset</h3><input maxlength="100000" placeholder="e.g. STICKER SHEET"><div class="actions"><button class="cancel">Cancel</button><button class="save">Add Preset</button></div></div>';
    document.body.appendChild(wrap);
    const input=wrap.querySelector("input");
    const close=()=>wrap.remove();
    wrap.querySelector(".cancel").onclick=close;
    wrap.addEventListener("click",e=>{if(e.target===wrap)close()});
    const save=()=>{
      const val=input.value.trim();
      if(!val)return;
      const current=Array.isArray(cfg.customProductPresets)?cfg.customProductPresets:[];
      if(!current.some(x=>x.toLowerCase()===val.toLowerCase())){
        lddSafeSet({customProductPresets:[...current,val]});
      }
      close();
    };
    wrap.querySelector(".save").onclick=save;
    input.addEventListener("keydown",e=>{if(e.key==="Enter")save();if(e.key==="Escape")close()});
    input.focus();
  }

  function presets(){
    document.getElementById("ldd-presets")?.remove();
    if(!cfg.productPresets)return;
    const input=otherInput(); if(!input)return;
    const box=document.createElement("div"); box.id="ldd-presets";
    const builtins=["PNG","SVG","TUMBLER WRAP","CUSTOM","MUG WRAP","PHONE CASE"];
    const fill=value=>{
      const live=otherInput();if(!live)return;
      nativeValue(live,value);
      try{live.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertText",data:value}))}catch(_){}
      live.focus();
    };
    builtins.forEach(label=>{
      const b=document.createElement("button"); b.type="button"; b.textContent=label;
      b.onclick=()=>fill(label==="CUSTOM"?"":label);
      box.appendChild(b);
    });
    (Array.isArray(cfg.customProductPresets)?cfg.customProductPresets:[]).forEach(label=>{
      const w=document.createElement("span");w.className="ldd-custom-wrap";
      const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=()=>fill(label);
      const x=document.createElement("button");x.type="button";x.className="ldd-delete-preset";x.textContent="×";x.title="Delete preset";
      x.onclick=()=>lddSafeSet({customProductPresets:cfg.customProductPresets.filter(v=>v!==label)});
      w.append(b,x);box.appendChild(w);
    });
    const add=document.createElement("button");add.type="button";add.textContent="+ ADD PRESET";add.onclick=addPresetDialog;box.appendChild(add);
    input.insertAdjacentElement("afterend",box);
  }

  function ensurePreview(){
    let p=document.getElementById("ldd-hover-preview");
    if(p)return p;
    p=document.createElement("div");p.id="ldd-hover-preview";
    p.innerHTML='<div class="ldd-stage"><img></div><div class="ldd-swatches"></div>';
    p.dataset.size=cfg.hoverPreviewSize||"small";
    const colors=[
      ["checkerboard","transparent"],["white","#ffffff"],["black","#000000"],["gray","#808080"],
      ["red","#ef4444"],["orange","#f97316"],["yellow","#facc15"],["green","#22c55e"],
      ["blue","#3b82f6"],["purple","#a855f7"],["pink","#ec4899"]
    ];
    const sw=p.querySelector(".ldd-swatches"),stage=p.querySelector(".ldd-stage");
    sw.style.display=cfg.hoverPreviewSwatches===false?"none":"flex";
    colors.forEach(([name,c])=>{
      const b=document.createElement("button");
      b.className="ldd-swatch ldd-preview-swatch";
      b.dataset.bg=name;
      b.title=name==="checkerboard"?"Transparent / Checkerboard":name[0].toUpperCase()+name.slice(1);
      if(name==="checkerboard"){
        b.style.setProperty("background-color","#fff","important");
        b.style.setProperty("background-image","repeating-conic-gradient(#ddd 0 25%,#888 0 50%)","important");
        b.style.setProperty("background-size","10px 10px","important");
      }else{
        b.style.setProperty("background-image","none","important");
        b.style.setProperty("background-color",c,"important");
      }
      b.onmouseenter=()=>{
        if(name==="checkerboard"){stage.style.backgroundColor="#eee";stage.style.backgroundImage=""}
        else{stage.style.background=c;stage.style.backgroundImage="none"}
      };
      sw.appendChild(b);
    });
    p.addEventListener("mouseleave",()=>hidePreview());
    document.body.appendChild(p);return p;
  }
  function showPreview(card,img,e){
    if(!cfg.hoverPreview)return;
    const p=ensurePreview(), pi=p.querySelector("img");
    pi.src=img.currentSrc||img.src;
    p.dataset.size=cfg.hoverPreviewSize||"small";
    const widths={small:300,medium:360,large:420};
    const requested=widths[cfg.hoverPreviewSize]||300;
    const w=Math.max(220,Math.min(requested,innerWidth-24));
    const swatchH=cfg.hoverPreviewSwatches===false?0:38;
    const stageH=Math.max(190,Math.min(w,innerHeight-swatchH-24));
    p.style.setProperty("width",w+"px","important");
    p.style.setProperty("height",(stageH+swatchH)+"px","important");
    p.style.setProperty("max-width",w+"px","important");
    p.style.setProperty("max-height",(stageH+swatchH)+"px","important");
    p.style.display="block";
    const left=(e.clientX+w+28<innerWidth)?e.clientX+18:Math.max(8,e.clientX-w-18);
    const top=Math.max(8,Math.min(innerHeight-(stageH+swatchH)-8,e.clientY-Math.round(stageH*.32)));
    p.style.left=left+"px";p.style.top=top+"px";
  }
  function hidePreview(){const p=document.getElementById("ldd-hover-preview");if(p)p.style.display="none"}
  document.addEventListener("keydown",e=>{if(e.key==="Escape")hidePreview()},true);
  document.addEventListener("mouseover",e=>{
    if(!cfg.hoverPreview)return;
    const card=e.target.closest?.('[data-testid="design-card"]'); if(!card)return;
    const img=card.querySelector("img");if(!img)return;
    clearTimeout(hoverTimer);const ev={clientX:e.clientX,clientY:e.clientY};
    hoverTimer=setTimeout(()=>showPreview(card,img,ev),Math.max(50,Number(cfg.hoverPreviewDelay)||180));
  },true);
  document.addEventListener("mouseout",e=>{
    const card=e.target.closest?.('[data-testid="design-card"]');
    if(cfg.hoverPreviewCloseMouseout!==false && card && !card.contains(e.relatedTarget)){clearTimeout(hoverTimer);setTimeout(()=>{
      const p=document.getElementById("ldd-hover-preview");
      if(p && !p.matches(":hover"))hidePreview();
    },140)}
  },true);

  function overlay(){
 let o=document.getElementById("ldd-drop-overlay");
 if(o)return o;
 o=document.createElement("div");o.id="ldd-drop-overlay";
 let dragon="";
 try{
   if(typeof chrome!=="undefined"&&chrome.runtime&&chrome.runtime.id)dragon=chrome.runtime.getURL("assets/dragon-drop.png");
 }catch(_){}
 o.innerHTML=`<div class="ldd-drop-card">${dragon?`<img class="ldd-drop-dragon" src="${dragon}">`:""}<div class="ldd-drop-title">Drop files to upload</div><div class="ldd-drop-sub">Release to send them to MyDesigns</div><div class="ldd-drop-tip"><b>TIP:</b> Drag &amp; Drop uploads always go to your <b>default first slot</b>.</div><div class="ldd-drop-warning"><b>IMPORTANT:</b> If you are adding multiple designs to a <b>single listing</b>, use the <b>default MyDesigns Upload system</b> — do not use LDD Drag &amp; Drop.</div></div>`;
 document.body.appendChild(o);
 return o;
}
function killOverlay(){dragDepth=0;document.getElementById("ldd-drop-overlay")?.remove()}
  function hasFiles(e){return [...(e.dataTransfer?.types||[])].includes("Files")}
  document.addEventListener("dragenter",e=>{
    if(cfg.lddMasterEnabled===false||!cfg.dragUpload||!hasFiles(e))return;e.preventDefault();dragDepth++;overlay().style.display="flex";
  },true);
  document.addEventListener("dragover",e=>{if(cfg.lddMasterEnabled!==false&&cfg.dragUpload&&hasFiles(e)){e.preventDefault();e.dataTransfer.dropEffect="copy"}},true);
  document.addEventListener("dragleave",e=>{if(cfg.lddMasterEnabled===false||!cfg.dragUpload)return;if(--dragDepth<=0)killOverlay()},true);
  document.addEventListener("drop",async e=>{
    if(cfg.lddMasterEnabled===false||!cfg.dragUpload||!hasFiles(e)||uploadBusy)return;
    e.preventDefault();e.stopPropagation();killOverlay();
    const files=[...e.dataTransfer.files];if(!files.length)return;
    lddSnapshotCardsBeforeUpload();
    uploadBusy=true;
    try{
      let dialog=document.querySelector('[role="dialog"][aria-label="Upload Designs"]');
      if(!dialog){
        let upload=null;
        for(let i=0;i<50 && !upload;i++){
          upload=document.querySelector('button[data-pointer-key="onboarding.create-design"]')
            || [...document.querySelectorAll("button")].find(b=>{
              const t=(b.innerText||b.textContent||"").replace(/\\s+/g," ").trim();
              return t==="Upload" || t.startsWith("Upload ");
            });
          if(!upload) await new Promise(r=>setTimeout(r,100));
        }
        if(!upload)throw new Error("Upload button not found after 5 seconds");
        upload.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,cancelable:true,view:window}));
        upload.dispatchEvent(new MouseEvent("mouseup",{bubbles:true,cancelable:true,view:window}));
        upload.click();
        for(let i=0;i<60&&!dialog;i++){
          await new Promise(r=>setTimeout(r,100));
          dialog=document.querySelector('[role="dialog"][aria-label="Upload Designs"]')
            || [...document.querySelectorAll('[role="dialog"]')].find(d=>/Upload Designs/i.test(d.getAttribute("aria-label")||text(d)));
        }
      }
      if(!dialog)throw new Error("Upload dialog not found");
      // LDD_DND_BUILD_182: native Upload Designs drop-zone path; no file-input dependency.
      // MyDesigns exposes a native drag/drop target in the Upload Designs dialog.
      // Do not require an <input type="file">; some accounts/builds do not expose one.
      let dropZone=null;
      for(let i=0;i<40 && !dropZone;i++){
        dialog=document.querySelector('[role="dialog"][aria-label="Upload Designs"]')
          || [...document.querySelectorAll('[role="dialog"]')].find(d=>/Upload Designs/i.test(d.getAttribute("aria-label")||text(d)))
          || dialog;
        const dragText=[...dialog.querySelectorAll("div")].find(el=>text(el)==="Drag and drop files");
        const dropGroup=dragText?.closest(".group") || dragText?.parentElement?.parentElement || null;
        dropZone=dropGroup?.querySelector(".absolute.top-0.size-full.cursor-pointer")
          || dropGroup?.querySelector(".absolute.top-0.size-full")
          || dropGroup
          || null;
        if(!dropZone)await new Promise(r=>setTimeout(r,100));
      }
      if(!dropZone)throw new Error("MyDesigns upload drop zone not found");
      const dt=new DataTransfer();files.forEach(f=>dt.items.add(f));
      killOverlay();
      const fireDropEvent=(type)=>{
        let ev;
        try{ev=new DragEvent(type,{bubbles:true,cancelable:true,composed:true,dataTransfer:dt})}
        catch(_){ev=new Event(type,{bubbles:true,cancelable:true,composed:true});Object.defineProperty(ev,"dataTransfer",{value:dt})}
        dropZone.dispatchEvent(ev);
      };
      fireDropEvent("dragenter");
      fireDropEvent("dragover");
      fireDropEvent("drop");
      let start=null;
      const uploadDeadline=Date.now()+15000;
      while(Date.now()<uploadDeadline){
        // Vue can replace the entire dialog/button after files are accepted, so never trust a stale reference.
        dialog=document.querySelector('[role="dialog"][aria-label="Upload Designs"]')
          || [...document.querySelectorAll('[role="dialog"]')].find(d=>/Upload Designs/i.test(d.getAttribute("aria-label")||text(d)))
          || dialog;
        start=[...dialog.querySelectorAll("button")].find(b=>text(b)==="Start Uploading" && visible(b));
        const blocked=!start || start.disabled || start.getAttribute("aria-disabled")==="true" || start.classList.contains("pointer-events-none");
        if(!blocked)break;
        start=null;
        await new Promise(r=>setTimeout(r,100));
      }
      if(start){
        killOverlay();
        start.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,cancelable:true,view:window}));
        start.dispatchEvent(new MouseEvent("mouseup",{bubbles:true,cancelable:true,view:window}));
        start.click();
        globalThis.lddToast110("Drag & Drop upload started");
      }else{
        console.warn("[LDD] Files added, Start Uploading never enabled.");
        globalThis.lddToast110("Files added, but MyDesigns did not enable Start Uploading",true);
      }
    }catch(err){
      console.error("[LDD Drag Upload]",err);
      try{globalThis.lddToast110(`Drag & Drop failed: ${err?.message||"MyDesigns upload unavailable"}`,true,"error")}catch(_){}
    }
    finally{setTimeout(()=>uploadBusy=false,1200)}
  },true);

  window.addEventListener("blur",killOverlay);
  document.addEventListener("dragend",killOverlay,true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")killOverlay()},true);

  function apply(){
    document.documentElement.classList.toggle("ldd-master-disabled",cfg.lddMasterEnabled===false);
    if(cfg.lddMasterEnabled===false){hidePreview();killOverlay();document.getElementById("ldd-app-page")?.remove();return;}
    unlock();credits();presets();
    if(!cfg.hoverPreview)hidePreview();
  }
  lddSafeGet(LDD_DEFAULTS,d=>{cfg={...LDD_DEFAULTS,...d};apply()});
  lddSafeOnChanged(changes=>{
    for(const [k,v] of Object.entries(changes))if(k in cfg)cfg[k]=v.newValue;
    apply();
  });

  let queued=false;
  new MutationObserver(muts=>{
    if(cfg.maxLength){
      muts.forEach(m=>{
        if(m.type==="attributes" && m.target.matches?.("input[maxlength],textarea[maxlength]") && m.target.maxLength!==100000){
          m.target.maxLength=100000;m.target.setAttribute("maxlength","100000");
        }
        m.addedNodes.forEach(n=>{if(n.nodeType===1)unlock(n)});
      });
    }
    if(!queued){queued=true;setTimeout(()=>{queued=false;apply()},120)}
  }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["maxlength"]});



/* App Font persistence: installed after all LDD functions exist. */
lddReapplySavedAppFont();
lddScheduleFontReapply();
// v1.1.2: lightweight staged restores cover Vue/MyDesigns startup without a
// full-document MutationObserver. This also reasserts the saved font after SPA mount.
[250,700,1500].forEach(ms=>setTimeout(lddReapplySavedAppFont,ms));
window.addEventListener("pageshow",lddScheduleFontReapply,{passive:true});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)lddScheduleFontReapply()},{passive:true});
// v1.1.0: removed full-document font persistence observer; storage/pageshow/route hooks restore authoritative state.
try{
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area==="local" && (changes.appFont||changes.appFontFamily||changes.lddAppFontFamily||changes.selectedAppFont)){
      lddScheduleFontReapply();
    }
  });
}catch(_){}


function lddInstallHardFontCap(){
 const root=document.querySelector("#ldd-inline-font-browser");
 if(!root)return false;
 lddCapFontResults20();
 if(!root.dataset.lddHard20){
   root.dataset.lddHard20="1";
   new MutationObserver(()=>lddCapFontResults20()).observe(root,{childList:true,subtree:true,attributes:false});
   root.addEventListener("input",()=>setTimeout(lddCapFontResults20,0),true);
   root.addEventListener("click",()=>setTimeout(lddCapFontResults20,0),true);
 }
 return true;
}
lddInstallHardFontCap();

})();


/* ===== LDD MD STORES APP FONT TWEAKER ===== */
const LDD_FONT_META_URL="https://fonts.google.com/metadata/fonts";
let lddFontPanel=null, lddFontFab=null, lddFontFamilies=[], lddFontSearch="", lddFontFilter="all";

function lddFontSafeName(v){return String(v||"").replace(/["'<>]/g,"").trim()}
function lddLoadGoogleFont(family){
  family=lddFontSafeName(family); if(!family||family==="Inter") return;
  const id="ldd-gfont-"+family.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  if(document.getElementById(id))return;
  const link=document.createElement("link"); link.id=id; link.rel="stylesheet";
  link.href="https://fonts.googleapis.com/css2?family="+encodeURIComponent(family).replace(/%20/g,"+")+":wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}
function lddApplyAppFont(family){
 try{chrome.storage.local.set({appFont:true,appFontFamily:family})}catch(_){}

  family=lddFontSafeName(family)||"Inter";
  let st=document.getElementById("ldd-app-font-style");
  if(!st){st=document.createElement("style");st.id="ldd-app-font-style";}
  if(family==="Inter"){
    st.textContent="";
  }else{
    lddLoadGoogleFont(family);
    st.textContent=`html body *:not(svg):not(path):not(g):not(use){font-family:"${family}",sans-serif!important}`;
  }
  document.head.appendChild(st);
  const current=document.querySelector("#ldd-font-current");
  if(current)current.textContent=family;
  lddSafeGet(LDD_DEFAULTS,o=>{
 lddEnforceThemeMasterOff(o);
    const recent=[family,...(o.appFontRecent||[]).filter(x=>x!==family)].slice(0,20);
    lddSafeSet({appFontFamily:family,appFont:true,appFontRecent:recent});
  });
}
function lddResetAppFont(){lddApplyChosenAppFont("MyDesigns Default")}

/* v0.8.6 bundled catalog: works even when fonts.google.com metadata fetch is blocked */
let LDD_BUNDLED_FONT_FAMILIES=[];
LDD_BUNDLED_FONT_FAMILIES=["Roboto", "Open Sans", "Montserrat", "Poppins", "Lato", "Oswald", "Raleway", "Nunito", "Playfair Display", "Merriweather", "Bebas Neue", "Pacifico", "Lobster", "Inter", "DM Sans", "Work Sans", "Source Sans 3", "Source Serif 4", "Source Code Pro", "Roboto Slab", "Roboto Mono", "Roboto Condensed", "Roboto Serif", "Archivo", "Archivo Black", "Archivo Narrow", "Barlow", "Barlow Condensed", "Barlow Semi Condensed", "Manrope", "Mulish", "Karla", "Rubik", "Quicksand", "Comfortaa", "Josefin Sans", "Josefin Slab", "Libre Baskerville", "Libre Franklin", "PT Sans", "PT Serif", "Ubuntu", "Ubuntu Mono", "Fira Sans", "Fira Code", "Cabin", "Dosis", "Exo 2", "Titillium Web", "Anton", "Arvo", "Bitter", "Crimson Text", "Crimson Pro", "Domine", "Lora", "Noto Sans", "Noto Serif", "IBM Plex Sans", "IBM Plex Serif", "IBM Plex Mono", "Space Grotesk", "Space Mono", "Lexend", "Urbanist", "Outfit", "Sora", "Jost", "Kanit", "Prompt", "Figtree", "Onest", "Geologica", "Instrument Sans", "Instrument Serif", "Schibsted Grotesk", "Hanken Grotesk", "Plus Jakarta Sans", "Public Sans", "Red Hat Display", "Red Hat Text", "League Spartan", "League Gothic", "Alegreya", "Alegreya Sans", "Cormorant Garamond", "EB Garamond", "Cardo", "Spectral", "Vollkorn", "Bodoni Moda", "Fraunces", "Libre Bodoni", "Prata", "Cinzel", "Cinzel Decorative", "Cormorant", "Cormorant SC", "DM Serif Display", "DM Serif Text", "Abril Fatface", "Alfa Slab One", "Rokkitt", "Zilla Slab", "Bree Serif", "Patua One", "Roboto Flex", "Montserrat Alternates", "Permanent Marker", "Caveat", "Dancing Script", "Great Vibes", "Satisfy", "Kaushan Script", "Sacramento", "Allura", "Alex Brush", "Parisienne", "Shadows Into Light", "Indie Flower", "Amatic SC", "Patrick Hand", "Handlee", "Gloria Hallelujah", "Rock Salt", "Architects Daughter", "Gochi Hand", "Luckiest Guy", "Bangers", "Fredoka", "Baloo 2", "Chewy", "Bubblegum Sans", "Concert One", "Righteous", "Russo One", "Staatliches", "Black Ops One", "Press Start 2P", "Orbitron", "Audiowide", "Monoton", "Bungee", "Bungee Shade", "Bungee Inline", "Silkscreen", "VT323", "Pixelify Sans", "Teko", "Rajdhani", "Chakra Petch", "Oxanium", "Share Tech Mono", "JetBrains Mono", "Inconsolata", "Anonymous Pro", "Courier Prime", "Azeret Mono", "Nanum Gothic", "Nanum Myeongjo", "Noto Sans JP", "Noto Serif JP", "Noto Sans KR", "Noto Serif KR", "Noto Sans Arabic", "Noto Naskh Arabic", "Cairo", "Tajawal", "Almarai", "Amiri", "Vazirmatn", "Noto Sans Devanagari", "Noto Serif Devanagari", "Hind", "Mukta", "Kalam", "Tiro Devanagari Hindi", "Be Vietnam Pro", "Noto Sans Thai", "Sarabun", "K2D", "Athiti", "Mitr", "Noto Sans Bengali", "Noto Serif Bengali", "Noto Sans Tamil", "Noto Serif Tamil", "Noto Sans Telugu", "Noto Serif Telugu", "Noto Sans Malayalam", "Noto Serif Malayalam", "Noto Sans Kannada", "Noto Serif Kannada", "Noto Sans Hebrew", "Noto Serif Hebrew", "Assistant", "Alef", "Frank Ruhl Libre", "Secular One", "Heebo", "ABeeZee", "Abel", "Abhaya", "Libre", "Aboreto", "Abril", "Fatface", "Abyssinica", "SIL", "Aclonica", "Acme", "Actor", "Adamina", "Advent", "Pro", "Aguafina", "Script", "Akaya", "Kanadaka", "Telivigala", "Akronim", "Aladin", "Alata", "Alatsi", "Aldrich", "Sans", "Aleo", "Alex", "Brush", "Alfa", "Slab", "One", "Alice", "Alike", "Angular", "Allan", "Allerta", "Stencil", "Allison", "Almendra", "Display", "Alumni", "Collegiate", "Inline", "Pinstripe", "Amarante", "Amaranth", "Amatic", "Amethysta", "Amiko", "Amita", "Anaheim", "Andada", "Andika", "Angkor", "Annie", "Use", "Your", "Telescope", "Anonymous", "Antic", "Didone", "Antonio", "Anybody", "Aoboshi", "Arapey", "Arbutus", "Architects", "Daughter", "Black", "Narrow", "Are", "You", "Serious", "Aref", "Ruqaa", "Ink", "Arima", "Arimo", "Arizonia", "Armata", "Arsenal", "Artifika", "Arya", "Asap", "Condensed", "Asar", "Asset", "Astloch", "Asul", "Atkinson", "Hyperlegible", "Atma", "Atomic", "Age", "Aubrey", "Autour", "Average", "Averia", "Gruesa", "Serif", "Azeret", "Mono", "B612", "BIZ", "UDGothic", "UDMincho", "UDPGothic", "UDPMincho", "Babylonica", "Bad", "Bagel", "Fat", "Bahiana", "Bahianita", "Bai", "Jamjuree", "Bakbak", "Ballet", "Baloo", "Bhai", "Bhaijaan", "Bhaina", "Chettan", "Paaji", "Tamma", "Tammudu", "Thambi", "Balsamiq", "Balthazar", "Semi", "Barriecito", "Barrio", "Basic", "Baskervville", "Battambang", "Baumans", "Bayon", "Vietnam", "Beau", "Rivage", "Bebas", "Neue", "Belanosima", "Belgrano", "Bellefair", "Belleza", "Bellota", "Text", "BenchNine", "Benne", "Bentham", "Berkshire", "Swash", "Besley", "Beth", "Ellen", "Bevan", "BhuTuka", "Expanded", "Big", "Shoulders", "Bigelow", "Rules", "Bigshot", "Bilbo", "Caps", "BioRhyme", "Birthstone", "Bounce", "Biryani", "And", "White", "Picture", "Han", "Ops", "Blaka", "Hollow", "Blinker", "Bodoni", "Moda", "Bokor", "Bona", "Nova", "Bonbon", "Bonheur", "Royale", "Boogaloo", "Bowlby", "Braah", "Brawler", "Bree", "Brygada", "Bubblegum", "Bubbler", "Buda", "Buenard", "Hairline", "Outline", "Shade", "Spice", "Butcherman", "Butterfly", "Kids", "Sketch", "Caesar", "Dressing", "Cagliostro", "Caladea", "Calistoga", "Calligraffitti", "Cambay", "Cambo", "Candal", "Cantarell", "Cantata", "Cantora", "Capriola", "Caramel", "Carattere", "Carlito", "Carme", "Carrois", "Gothic", "Carter", "Castoro", "Catamaran", "Caudex", "Cedarville", "Cursive", "Ceviche", "Chakra", "Petch", "Changa", "Chango", "Charis", "Charm", "Charmonman", "Chathura", "Chau", "Philomene", "Chela", "Chelsea", "Market", "Chenla", "Cherish", "Cherry", "Bomb", "Cream", "Soda", "Chicle", "Chilanka", "Chivo", "Chonburi", "Decorative", "Clicker", "Climate", "Crisis", "Coda", "Caption", "Codystar", "Coiny", "Combo", "Comforter", "Comic", "Coming", "Soon", "Commissioner", "Concert", "Condiment", "Content", "Contrail", "Convergence", "Cookie", "Copse", "Corben", "Corinthia", "Garamond", "Infant", "Unicase", "Upright", "Courgette", "Courier", "Prime", "Cousine", "Coustard", "Covered", "Grace", "Crafty", "Girls", "Creepster", "Crete", "Round", "Crimson", "Croissant", "Crushed", "Cuprum", "Cute", "Font", "Cutive", "Dancing", "Dangrek", "Darker", "Grotesque", "David", "Dawning", "New", "Day", "Days", "Dekko", "Dela", "Delicious", "Handrawn", "Delius", "Della", "Respira", "Denk", "Devonshire", "Dhurjati", "Didact", "Diplomata", "Hyeon", "Dokdo", "Donegal", "Dongle", "Doppio", "Dorsa", "DotGothic16", "Sugiyama", "Duru", "Dynalight", "Eagle", "Lake", "East", "Sea", "Eater", "Economica", "Eczar", "Edu", "NSW", "ACT", "Foundation", "QLD", "Beginner", "TAS", "VIC", "Messiri", "Electrolize", "Elsie", "Emblema", "Emilys", "Candy", "Encode", "Engagement", "Englebert", "Enriqueta", "Ephesis", "Epilogue", "Erica", "Esteban", "Estonia", "Euphoria", "Ewert", "Exo", "Expletus", "Explora", "Fahkwang", "Familjen", "Grotesk", "Fanwood", "Farro", "Farsan", "Fascinate", "Faster", "Fasthand", "Fauna", "Faustina", "Federant", "Federo", "Felipa", "Fenix", "Festive", "Finger", "Paint", "Finlandica", "Fjalla", "Fjord", "Flamenco", "Flavors", "Fleur", "Leah", "Flow", "Block", "Circular", "Rounded", "Fondamento", "Fontdiner", "Swanky", "Forum", "Fragment", "Francois", "Frank", "Ruhl", "Freckle", "Face", "Fredericka", "Great", "Freehand", "Fresca", "Frijole", "Fruktur", "Fugaz", "Fuzzy", "Bubbles", "GFS", "Didot", "Neohellenic", "Gabriela", "Gaegu", "Gafata", "Galada", "Galdeano", "Galindo", "Gamja", "Flower", "Gantari", "Gayathri", "Gelasio", "Gemunu", "Genos", "Gentium", "Book", "Plus", "Geo", "Georama", "Geostar", "Fill", "Germania", "Gideon", "Roman", "Gidugu", "Gilda", "Girassol", "Give", "Glory", "Glass", "Antiqua", "Glegoo", "Gloria", "Hallelujah", "Gluten", "Goblin", "Gochi", "Hand", "Goldman", "Gorditas", "Gotu", "Goudy", "Bookletter", "Gowun", "Batang", "Dodum", "Graduate", "Grand", "Hotel", "Grandstander", "Grape", "Nuts", "Gravitas", "Vibes", "Grechen", "Fuemen", "Grenze", "Gotisch", "Grey", "Griffy", "Gruppo", "Gudea", "Gugi", "Gulzar", "Gupter", "Gurajada", "Gwendolyn", "Habibi", "Hachi", "Maru", "Pop", "Hahmlet", "Halant", "Hammersmith", "Hanalei", "Hanken", "Hanuman", "Happy", "Monkey", "Harmattan", "Headland", "Henny", "Penny", "Hepta", "Herr", "Von", "Muellerhoff", "Melody", "Hina", "Mincho", "Guntur", "Madurai", "Siliguri", "Vadodara", "Holtwood", "Homemade", "Apple", "Homenaje", "Hubballi", "Hurricane", "IBM", "Plex", "Arabic", "Devanagari", "Hebrew", "Thai", "Looped", "Fell", "Pica", "Double", "English", "French", "Canon", "Primer", "Ibarra", "Real", "Iceberg", "Iceland", "Imbue", "Imperial", "Imprima", "Inder", "Indie", "Ingrid", "Darling", "Inika", "Inknut", "Inria", "Inspiration", "Instrument", "Tight", "Irish", "Grover", "Island", "Moments", "Istok", "Web", "Italiana", "Jaini", "Purva", "Jaldi", "JetBrains", "Jim", "Nightshade", "Joan", "Jockey", "Jolly", "Lodger", "Jomhuria", "Jomolhari", "Josefin", "Joti", "Jua", "Judson", "Julee", "Julius", "Junge", "Jura", "Just", "Another", "Again", "Down", "Here", "Kadwa", "Kaisei", "Decol", "HarunoUmi", "Opti", "Tokumin", "Kameron", "Kantumruy", "Karantina", "Karma", "Katibeh", "Kaushan", "Kavivanar", "Kavoon", "Kdam", "Thmor", "Keania", "Kelly", "Kenia", "Khand", "Khmer", "Khula", "Kings", "Kirang", "Haerang", "Kite", "Kiwi", "Klee", "Knewave", "KoHo", "Kodchasan", "Koh", "Santepheap", "Kolker", "Kosugi", "Kotta", "Koulen", "Kranky", "Kreon", "Kristi", "Krona", "Krub", "Kufam", "Kulim", "Park", "Kumbh", "Kurale", "Belle", "Aurore", "Labrada", "Lacquer", "Laila", "Lakki", "Reddy", "Lalezar", "Lancelot", "Langar", "Lateef", "Lavishly", "Yours", "League", "Spartan", "Leckerli", "Ledger", "Lekton", "Lemon", "Lemonada", "Deca", "Exa", "Giga", "Mega", "Peta", "Tera", "Zetta", "Barcode", "Extended", "EAN13", "Baskerville", "Caslon", "Franklin", "Licorice", "Life", "Savers", "Lilita", "Lily", "Limelight", "Linden", "Hill", "Literata", "Liu", "Jian", "Mao", "Cao", "Livvic", "Two", "Londrina", "Shadow", "Solid", "Long", "Cang", "Love", "Light", "Like", "Sister", "Loved", "King", "Lovers", "Quarrel", "Luckiest", "Guy", "Lusitana", "Lustria", "Luxurious", "PLUS", "Code", "Latin", "Shan", "Zheng", "Macondo", "Mada", "Magra", "Maiden", "Orange", "Maitree", "Major", "Mako", "Mali", "Mallanna", "Mandali", "Manjari", "Mansalva", "Manuale", "Marcellus", "Marck", "Margarine", "Markazi", "Marko", "Marmelad", "Martel", "Marvel", "Mate", "Maven", "McLaren", "Mea", "Culpa", "Meddon", "MedievalSharp", "Medula", "Meera", "Inimai", "Megrim", "Meie", "Meow", "Merienda", "Metal", "Mania", "Metamorphous", "Metrophobic", "Michroma", "Milonga", "Miltonian", "Tattoo", "Mina", "Mingzat", "Miniver", "Miriam", "Mirza", "Miss", "Fajardose", "Mochiy", "Modak", "Modern", "Mogra", "Mohave", "Molengo", "Molle", "Monda", "Monofett", "Monsieur", "Doulaise", "Montaga", "Montagu", "MonteCarlo", "Montez", "Alternates", "Subrayada", "Moo", "Lah", "Moon", "Dance", "Moul", "Moula", "Mouse", "Memoirs", "Bedfort", "Dafoe", "Haviland", "Mrs", "Saint", "Delafield", "Sheppards", "Madi", "Mahee", "Malar", "Vaani", "Murecho", "MuseoModerno", "Soul", "Mynerve", "Mystery", "Quest", "NTR", "Nabla", "Nanum", "Coding", "Myeongjo", "Pen", "Neonderthaw", "Nerko", "Neucha", "Neuton", "Rocker", "Tegomin", "News", "Cycle", "Newsreader", "Niconne", "Niramit", "Nixie", "Nobile", "Nokora", "Norican", "Nosifer", "Notable", "Nothing", "Could", "Noticia", "Noto", "Color", "Emoji", "Kufi", "Music", "Naskh", "Nastaliq", "Urdu", "Rashi", "Adlam", "Unjoined", "Anatolian", "Hieroglyphs", "Armenian", "Avestan", "Balinese", "Bamum", "Bassa", "Vah", "Batak", "Bengali", "Bhaiksuki", "Brahmi", "Buginese", "Buhid", "Canadian", "Aboriginal", "Carian", "Caucasian", "Albanian", "Chakma", "Cham", "Cherokee", "Coptic", "Cuneiform", "Cypriot", "Deseret", "Duployan", "Egyptian", "Elbasan", "Elymaic", "Ethiopic", "Georgian", "Glagolitic", "Grantha", "Gujarati", "Gunjala", "Gondi", "Gurmukhi", "Hanifi", "Rohingya", "Hanunoo", "Hatran", "Aramaic", "Indic", "Siyaq", "Numbers", "Inscriptional", "Pahlavi", "Parthian", "Javanese", "Kaithi", "Kannada", "Kayah", "Kharoshthi", "Khojki", "Khudawadi", "Lao", "Lepcha", "Limbu", "Linear", "Lisu", "Lycian", "Lydian", "Mahajani", "Malayalam", "Mandaic", "Manichaean", "Marchen", "Masaram", "Math", "Mayan", "Numerals", "Medefaidrin", "Meetei", "Mayek", "Mende", "Kikakui", "Meroitic", "Miao", "Modi", "Mongolian", "Mro", "Multani", "Myanmar", "NKo", "Nabataean", "Tai", "Lue", "Newa", "Nushu", "Ogham", "Chiki", "Old", "Hungarian", "Italic", "North", "Arabian", "Permic", "Persian", "Sogdian", "South", "Turkic", "Oriya", "Osage", "Osmanya", "Pahawh", "Hmong", "Palmyrene", "Pau", "Cin", "Hau", "Phags", "Phoenician", "Psalter", "Rejang", "Runic", "Samaritan", "Saurashtra", "Sharada", "Shavian", "Siddham", "Sinhala", "Sompeng", "Soyombo", "Sundanese", "Syloti", "Nagri", "Symbols", "Syriac", "Tagalog", "Tagbanwa", "Tham", "Viet", "Takri", "Tamil", "Supplement", "Telugu", "Thaana", "Tifinagh", "Tirhuta", "Ugaritic", "Vai", "Wancho", "Warang", "Citi", "Zanabazar", "Square", "Ahom", "Dogra", "Uyghur", "Tangut", "Tibetan", "Toto", "Vithkuqi", "Yezidi", "Traditional", "Cut", "Flat", "Oval", "Slim", "Numans", "Nuosu", "Odibee", "Odor", "Mean", "Chey", "Offside", "Standard", "Ole", "Oleo", "Oooh", "Baby", "Open", "Oranienbaum", "Oregano", "Orelega", "Orienta", "Original", "Surfer", "Over", "Rainbow", "Overlock", "Ovo", "Oxygen", "Padauk", "Pale", "Blue", "Dot", "Palanquin", "Dark", "Palette", "Mosaic", "Pangolin", "Paprika", "Passero", "Passion", "Passions", "Conflict", "Pathway", "Extreme", "Patrick", "Pattaya", "Patua", "Pavanam", "Paytone", "Peddana", "Peralta", "Permanent", "Marker", "Petemoss", "Philosopher", "Phudu", "Piazzolla", "Piedra", "Pinyon", "Pirata", "Plaster", "Play", "Playball", "Playfair", "Jakarta", "Podkova", "Poiret", "Poller", "Poltawski", "Nowy", "Poly", "Pompiere", "Pontano", "Poor", "Story", "Port", "Lligat", "Potta", "Pragati", "Praise", "Preahvihear", "Press", "Start", "Pridi", "Princess", "Sofia", "Prociono", "Prosto", "Proza", "Public", "Qahiri", "Quando", "Quantico", "Quattrocento", "Questrial", "Quintessential", "Qwigley", "Qwitcher", "Grypen", "Racing", "Radio", "Canada", "Radley", "Rakkas", "Dots", "Ramabhadra", "Ramaraja", "Rambla", "Rammetto", "Rampart", "Ranchers", "Rancho", "Ranga", "Rasa", "Rationale", "Ravi", "Prakash", "Readex", "Recursive", "Red", "Hat", "Rose", "Redacted", "Redressed", "Reem", "Fun", "Reenie", "Beanie", "Reggae", "Revalia", "Rhodium", "Ribeye", "Marrow", "Risque", "Road", "Rage", "Flex", "Rochester", "Rock", "Salt", "RocknRoll", "Romanesco", "Ropa", "Rosario", "Rosarivo", "Rouge", "Rowdies", "Rozha", "Fade", "Beastly", "Burned", "Dirt", "Distressed", "Gemstones", "Glitch", "Iso", "Hatch", "Maze", "Microbe", "Moonrocks", "Pixels", "Puddles", "Spray", "Storm", "Vinyl", "Wet", "Ruda", "Rufina", "Ruge", "Boogie", "Ruluko", "Rum", "Raisin", "Ruslan", "Russo", "Ruthie", "Rye", "STIX", "Sahitya", "Sail", "Salsa", "Sanchez", "Sancreek", "Sansita", "Swashed", "Sarala", "Sarina", "Sarpanch", "Sassy", "Frass", "Sawarabi", "Scada", "Scheherazade", "Schibsted", "Schoolbell", "Scope", "Seaweed", "Secular", "Sedgwick", "Ave", "Sen", "Send", "Flowers", "Sevillana", "Seymour", "Shadows", "Into", "Shalimar", "Shantell", "Shanti", "Share", "Tech", "Shippori", "Antique", "Shizuru", "Shojumaru", "Short", "Stack", "Siemreap", "Sigmar", "Signika", "Negative", "Simonetta", "Single", "Sintony", "Sirin", "Six", "Skranji", "Slabo", "Slackey", "Smokum", "Smythe", "Sniglet", "Snippet", "Snowburst", "Sofadi", "Extra", "Solitreo", "Solway", "Song", "Myung", "Sono", "Sonsie", "Sorts", "Mill", "Source", "Space", "Special", "Elite", "Spicy", "Rice", "Spinnaker", "Spirax", "Splash", "Spline", "Squada", "Peg", "Sree", "Krushnadevaraya", "Sriracha", "Srisakdi", "Stalemate", "Stalinist", "Stardos", "Stick", "Bills", "Stint", "Ultra", "Stoke", "Strait", "Style", "Stylish", "Sue", "Francisco", "Sulphur", "Point", "Sumana", "Sunflower", "Sunshiney", "Supermercado", "Sura", "Suranna", "Suravaram", "Suwannaphum", "Syncopate", "Syne", "Tactile", "Heritage", "Tangerine", "Tapestry", "Taprom", "Tauri", "Taviraj", "Tektur", "Telex", "Tenali", "Ramakrishna", "Tenor", "Texturina", "Thasadith", "The", "Girl", "Next", "Door", "Nautigal", "Tienne", "Tillana", "Tilt", "Neon", "Prism", "Warp", "Timmana", "Tinos", "Tiro", "Bangla", "Hindi", "Marathi", "Sanskrit", "Titan", "Titillium", "Tomorrow", "Tourney", "Trade", "Winds", "Train", "Trirong", "Trispace", "Trocchi", "Trochut", "Truculenta", "Trykker", "Tsukimi", "Tulpen", "Turret", "Twinkle", "Star", "Uchen", "Unbounded", "Uncial", "Underdog", "Unica", "UnifrakturCook", "UnifrakturMaguntia", "Unkempt", "Unlock", "Unna", "Updock", "Vampiro", "Varela", "Varta", "Vast", "Vesper", "Viaoda", "Vibur", "Vidaloka", "Viga", "Voces", "Volkhov", "Voltaire", "Vujahday", "Waiting", "Sunrise", "Wallpoet", "Walter", "Turncoat", "Warnes", "Water", "Waterfall", "Wellfleet", "Wendy", "Whisper", "WindSong", "Wire", "Wix", "Madefor", "Work", "Xanh", "Yaldevi", "Yanone", "Kaffeesatz", "Yantramanav", "Yatra", "Yellowtail", "Yeon", "Sung", "Yeseva", "Yesteryear", "Yomogi", "Yrsa", "Ysabeau", "Office", "Yuji", "Boku", "Hentaigana", "Akari", "Akebono", "Mai", "Syuku", "Yusei", "Magic", "ZCOOL", "KuaiLe", "QingKe", "HuangYou", "XiaoWei", "Zen", "Soft", "Kaku", "Kurenaido", "Loop", "Tokyo", "Zoo", "Zeyada", "Zhi", "Mang", "Xing", "Zilla", "Highlight"];
async function lddGetFontFamilies(){
  if(!window.__LDD_GOOGLE_FONT_FAMILIES_1900?.length)
    window.__LDD_GOOGLE_FONT_FAMILIES_1900=LDD_BUNDLED_FONT_FAMILIES;
  if(Array.isArray(window.__LDD_GOOGLE_FONT_FAMILIES_1900) && window.__LDD_GOOGLE_FONT_FAMILIES_1900.length){
    lddFontFamilies=window.__LDD_GOOGLE_FONT_FAMILIES_1900.map(f=>({family:f,category:""}));
    return lddFontFamilies;
  }
  try{
    const names=await lddFetchGoogleFontFamilies();
    if(names&&names.length){
      window.__LDD_GOOGLE_FONT_FAMILIES_1900=names;
      lddFontFamilies=names.map(f=>({family:f,category:""}));
      return lddFontFamilies;
    }
  }catch(_){}
  return lddFontFamilies;
}
function lddRenderFontList(){
  const list=document.querySelector("#ldd-font-list"); if(!list)return;
  lddSafeGet(LDD_DEFAULTS,async o=>{
    const all=await lddGetFontFamilies();
    const fav=new Set(o.appFontFavorites||[]);
    const q=lddFontSearch.toLowerCase();
    let rows=all.filter(x=>!q||x.family.toLowerCase().includes(q));
    if(lddFontFilter==="favorites")rows=rows.filter(x=>fav.has(x.family));
    if(lddFontFilter==="recent"){
      const map=new Map(all.map(x=>[x.family,x]));
      rows=(o.appFontRecent||[]).map(x=>map.get(x)).filter(Boolean);
    }
    rows=rows; // virtual-ish safety; search narrows the full catalog
    list.innerHTML="";
    const frag=document.createDocumentFragment();
    rows.forEach(x=>{
      const row=document.createElement("button");row.className="ldd-font-row";row.type="button";
      const name=document.createElement("span");name.className="ldd-font-name";name.textContent=x.family;
      name.dataset.previewFamily=x.family;
      name.style.setProperty("font-family",`"${x.family}",sans-serif`,"important");
      const heart=document.createElement("span");heart.className="ldd-font-heart";heart.textContent=fav.has(x.family)?"♥":"♡";
      heart.title="Favorite";
      heart.addEventListener("click",ev=>{
        ev.stopPropagation();
        lddSafeGet(LDD_DEFAULTS,d=>{
          const set=new Set(d.appFontFavorites||[]);
          set.has(x.family)?set.delete(x.family):set.add(x.family);
          lddSafeSet({appFontFavorites:[...set]},lddRenderFontList);
        });
      });
      row.append(name,heart);
      row.addEventListener("mouseenter",()=>lddLoadGoogleFont(x.family));
      row.addEventListener("click",()=>lddApplyAppFont(x.family));
      frag.appendChild(row);
    });
    list.appendChild(frag);
    const io=new IntersectionObserver(entries=>{
      entries.forEach(en=>{
        if(!en.isIntersecting)return;
        const n=en.target.querySelector(".ldd-font-name");
        if(n?.dataset.previewFamily)lddLoadGoogleFont(n.dataset.previewFamily);
        io.unobserve(en.target);
      });
    },{root:list,rootMargin:"200px 0px"});
    list.querySelectorAll(".ldd-font-row").forEach(row=>io.observe(row));
    const count=document.querySelector("#ldd-font-count"); if(count)count.textContent=`${all.length.toLocaleString()} fonts`;
  });
}
function lddCloseFontPanel(){lddFontPanel?.classList.remove("open")}
function lddOpenFontPanel(){lddFontPanel?.classList.add("open");lddRenderFontList()}
function lddMountFontUI(){
  if(document.getElementById("ldd-font-fab"))return;
  lddFontFab=document.createElement("button");lddFontFab.id="ldd-font-fab";lddFontFab.type="button";lddFontFab.textContent="Aa";
  lddFontFab.title="LDD App Font";lddFontFab.addEventListener("click",lddOpenFontPanel);
  document.body.appendChild(lddFontFab);
  lddFontPanel=document.createElement("aside");lddFontPanel.id="ldd-font-panel";
  lddFontPanel.innerHTML=`
    <div class="ldd-font-head"><div><b>🐉 LDD APP FONT EDITOR</b><small id="ldd-font-count">Google Fonts</small></div><button id="ldd-font-close">×</button></div>
    <div class="ldd-font-current">Current: <b id="ldd-font-current">Inter</b><button id="ldd-font-reset">Reset to Inter</button></div>
    <input id="ldd-font-search" type="search" placeholder="Search Google Fonts…">
    <div class="ldd-font-tabs"><button data-font-tab="all" class="active">All</button><button data-font-tab="favorites">♥ Favorites</button><button data-font-tab="recent">Recent</button></div>
    <div id="ldd-font-list"></div>`;
  document.body.appendChild(lddFontPanel);
  lddFontPanel.querySelector("#ldd-font-close").onclick=lddCloseFontPanel;
  lddFontPanel.querySelector("#ldd-font-reset").onclick=lddResetAppFont;
  lddFontPanel.querySelector("#ldd-font-search").addEventListener("input",e=>{lddFontSearch=e.target.value;lddRenderFontList()});
  lddFontPanel.querySelectorAll("[data-font-tab]").forEach(b=>b.onclick=()=>{
    lddFontFilter=b.dataset.fontTab;
    lddFontPanel.querySelectorAll("[data-font-tab]").forEach(x=>x.classList.toggle("active",x===b));
    lddRenderFontList();
  });
  lddSafeGet(LDD_DEFAULTS,o=>{
    const current=document.querySelector("#ldd-font-current"); if(current) current.textContent=o.appFontFamily||"Inter";
    if(document.getElementById("ldd-font-panel") && o.appFont && o.appFontFamily && o.appFontFamily!=="Inter") lddApplyAppFont(o.appFontFamily);
  });
}
function lddUnmountFontUI(){
  lddFontFab?.remove();lddFontPanel?.remove();lddFontFab=null;lddFontPanel=null;
  document.getElementById("ldd-app-font-style")?.remove();
}

function lddSyncInlineFontPage(enabled){
 if(!enabled)document.getElementById("ldd-app-font-style")?.remove();
 try{lddShowTab?.("fonts")}catch(e){console.warn("[LDD] App Font refresh",e)}
}
function lddSyncAppFont(enabled){
  // v1.0.6: Font Browser lives only inside the LDD Fonts page.
  // Remove legacy floating Aa button/panel if an older render left one behind.
  lddFontFab?.remove(); lddFontPanel?.remove(); lddFontFab=null; lddFontPanel=null;
  if(!enabled) document.getElementById("ldd-app-font-style")?.remove();
}

// v0.8.6: do not eagerly mount the legacy floating font UI at page load.
lddSafeOnChanged((changes,area)=>{
  if(area==="local" && changes.appFont && changes.appFont.newValue===false) lddUnmountFontUI();
});


/* ===== LDD THEME TWEAKER + CAROUSEL RENAMER v0.4.0 ===== */
const LDD_NEONS=[
  ["Green","#39ff14"],["Cyan","#00f5ff"],["Blue","#348cff"],["Purple","#a855f7"],
  ["Pink","#ff3bd4"],["Red","#ff365d"],["Orange","#ff7a18"],["Yellow","#f8ff3d"]
];
let lddThemePanel=null,lddThemeFab=null,lddRenamePanel=null,lddRenameFab=null;
let lddRenameItems=[],lddRenameIndex=0;

function lddHexToRgb(hex){
  const h=String(hex||"#39ff14").replace("#","");
  const n=parseInt(h.length===3?h.split("").map(x=>x+x).join(""):h,16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}
function lddHardDisableTheme(){
  const root=document.documentElement;
  document.getElementById("ldd-theme-style")?.remove();
  document.getElementById("ldd-theme-style-110")?.remove();
  root.classList.add("ldd-theme-master-off");
  root.classList.remove("ldd-theme-master-on","ldd-theme-on","ldd-neon-on","ldd-md-neon","ldd-full-neon",
    "ldd-shape-circle","ldd-shape-rounded","ldd-glow-on","ldd-glow-off","ldd-mode-black","ldd-mode-white");
  ["--ldd-neon","--ldd-neon-rgb","--ldd-radius","--ldd-logo-filter"].forEach(v=>root.style.removeProperty(v));
  document.dispatchEvent(new CustomEvent("ldd-neon-command",{detail:{action:"master",value:false}}));
}

function lddEnforceThemeMasterOff(o){
 if(o?.themeTweaker===true && o?.themeEnabled===true)return false;
 try{lddHardDisableTheme?.()}catch(_){}
 document.documentElement.classList.remove("ldd-theme-on","ldd-neon-on","ldd-md-neon","ldd-full-neon");
 document.body?.classList.remove("ldd-theme-on","ldd-neon-on","ldd-md-neon","ldd-full-neon");
 ["ldd-theme-style","ldd-neon-style","ldd-md-neon-style","ldd-full-neon-style","ldd-theme-dynamic-style"].forEach(id=>document.getElementById(id)?.remove());
 return true;
}

function lddApplyTheme(o){
  lddApplyTheme110(o);
}

function lddThemeSave(patch){lddSafeSet(patch,()=>lddSafeGet(LDD_DEFAULTS,lddApplyTheme))}
function lddRenderThemePanel(){
  if(!lddThemePanel)return;
  lddSafeGet(LDD_DEFAULTS,o=>{
    const panel=lddThemePanel;
    if(!panel || !panel.isConnected) return;
    const master=panel.querySelector("#ldd-theme-master");
    const glow=panel.querySelector("#ldd-theme-glow");
    const cards=panel.querySelector("#ldd-theme-cards");
    const color=panel.querySelector("#ldd-theme-color");
    const radius=panel.querySelector("#ldd-theme-radius");
    const radiusValue=panel.querySelector("#ldd-theme-radius-value");
    if(master) master.checked=!!o.themeEnabled;
    if(glow) glow.checked=!!o.themeGlow;
    if(cards) cards.checked=!!o.themeCards;
    if(color) color.value=o.themeColor||"#39ff14";
    if(radius) radius.value=o.themeRadius??12;
    if(radiusValue) radiusValue.textContent=`${o.themeRadius??12}px`;
    panel.querySelectorAll("[data-neon]").forEach(b=>b.classList.toggle("active",b.dataset.neon.toLowerCase()===(o.themeColor||"").toLowerCase()));
  });
}
function lddMountThemeUI(){
  if(document.getElementById("ldd-theme-fab"))return;
  lddThemeFab=document.createElement("button");lddThemeFab.id="ldd-theme-fab";lddThemeFab.className="ldd-tool-fab";lddThemeFab.textContent="◈";lddThemeFab.title="LDD Theme Tweaker";
  document.body.appendChild(lddThemeFab);
  lddThemePanel=document.createElement("aside");lddThemePanel.id="ldd-theme-panel";lddThemePanel.className="ldd-side-panel";
  lddThemePanel.innerHTML=`
    <div class="ldd-panel-head"><div><b>🐉 LDD THEME TWEAKER</b><small>Live MyDesigns app styling</small></div><button class="ldd-x">×</button></div>
    <div class="ldd-panel-body">
      <label class="ldd-switch-row"><span>Theme</span><input id="ldd-theme-master" type="checkbox"></label>
      <div class="ldd-label">NEON COLOR</div>
      <div class="ldd-neon-grid">${LDD_NEONS.map(([n,c])=>`<button data-neon="${c}" title="${n}" style="--sw:${c}"></button>`).join("")}</div>
      <label class="ldd-color-row"><span>Custom</span><input id="ldd-theme-color" type="color"></label>
      <div class="ldd-label">CARD SHAPE <span id="ldd-theme-radius-value">12px</span></div>
      <input id="ldd-theme-radius" type="range" min="0" max="32" step="1">
      <div class="ldd-shape-presets"><button data-rad="0">Square</button><button data-rad="8">Soft</button><button data-rad="16">Round</button><button data-rad="28">Extra</button></div>
      <label class="ldd-switch-row"><span>Change card shapes</span><input id="ldd-theme-cards" type="checkbox"></label>
      <label class="ldd-switch-row"><span>Neon glow</span><input id="ldd-theme-glow" type="checkbox"></label>
      <button id="ldd-theme-reset" class="ldd-secondary">Reset to MD Default</button>
    </div>`;
  document.body.appendChild(lddThemePanel);
  lddThemeFab.onclick=()=>{lddThemePanel.classList.add("open");lddRenderThemePanel()};
  lddThemePanel.querySelector(".ldd-x").onclick=()=>lddThemePanel.classList.remove("open");
  lddThemePanel.querySelector("#ldd-theme-master").onchange=e=>lddThemeSave({themeEnabled:e.target.checked});
  lddThemePanel.querySelector("#ldd-theme-glow").onchange=e=>lddThemeSave({themeGlow:e.target.checked});
  lddThemePanel.querySelector("#ldd-theme-cards").onchange=e=>lddThemeSave({themeCards:e.target.checked});
  lddThemePanel.querySelector("#ldd-theme-color").oninput=e=>lddThemeSave({themeColor:e.target.value});
  lddThemePanel.querySelector("#ldd-theme-radius").oninput=e=>{lddThemePanel.querySelector("#ldd-theme-radius-value").textContent=e.target.value+"px";lddThemeSave({themeRadius:+e.target.value})};
  lddThemePanel.querySelectorAll("[data-neon]").forEach(b=>b.onclick=()=>lddThemeSave({themeColor:b.dataset.neon}));
  lddThemePanel.querySelectorAll("[data-rad]").forEach(b=>b.onclick=()=>lddThemeSave({themeRadius:+b.dataset.rad}));
  lddThemePanel.querySelector("#ldd-theme-reset").onclick=()=>lddThemeSave({themeEnabled:false,themeColor:"#39ff14",themeGlow:false,themeRadius:12,themeCards:false});
  lddRenderThemePanel();
}
function lddUnmountThemeUI(){lddThemeFab?.remove();lddThemePanel?.remove();lddThemeFab=lddThemePanel=null;document.getElementById("ldd-theme-style")?.remove()}

function lddCardCheckbox(card){
  if(!card)return null;
  const boxes=[...card.querySelectorAll('[role="checkbox"],input[type="checkbox"]')];
  return boxes.find(cb=>{
    const aria=cb.getAttribute?.("aria-checked");
    return aria==="true" || cb.checked===true;
  }) || boxes[0] || null;
}
function lddCheckedCards(){
  // Read MyDesigns' live checkbox state when OPEN is clicked. Building the
  // list from checked controls avoids stale card state after Vue rerenders.
  const checkedControls=[...document.querySelectorAll(
    '[data-testid="design-card"] [role="checkbox"][aria-checked="true"],'+
    '[data-testid="design-card"] input[type="checkbox"]:checked'
  )];
  const cards=[];
  const seen=new Set();
  for(const cb of checkedControls){
    const card=cb.closest('[data-testid="design-card"]');
    if(!card || seen.has(card))continue;
    seen.add(card);cards.push(card);
  }
  // Preserve the visual left-to-right/top-to-bottom order MyDesigns shows.
  cards.sort((a,b)=>{
    const A=a.getBoundingClientRect(), B=b.getBoundingClientRect();
    if(Math.abs(A.top-B.top)>8)return A.top-B.top;
    return A.left-B.left;
  });
  return cards;
}
function lddCardImage(card){return card?.querySelector("img.content-image-light, img[src*='/design/preview/'], img")}
function lddCardName(card){
  const img=lddCardImage(card), alt=img?.getAttribute("alt");
  if(alt&&alt.trim())return alt.trim();
  const candidates=[...card.querySelectorAll("span,p,div")].map(x=>x.textContent?.trim()).filter(x=>x&&x.length<180);
  return candidates.find(x=>/\.(png|jpe?g|svg|pdf|webp)$/i.test(x))||candidates.find(x=>x.length>2)||"Design";
}

/* ===== v0.8.6 MD SHOW/HIDE HELPERS ===== */
function lddHorizontalMoreButton(card){
  if(!card)return null;
  const g=[...card.querySelectorAll("svg g[id]")].find(x=>(x.id||"").trim()==="more/horizontal");
  return g?.closest("button")||null;
}

function lddFindCreateWithAIButtons(){
  return [...document.querySelectorAll('button[type="submit"]')]
    .filter(b=>(b.textContent||"").trim()==="Create with AI");
}
function lddApplyCreateWithAIVisibility(o){
  const show=o.showCreateWithAI!==false;
  lddFindCreateWithAIButtons().forEach(btn=>{
    if(show) btn.style.removeProperty("display");
    else btn.style.setProperty("display","none","important");
  });
}
function lddRefreshCreateWithAI(){
  lddSafeGet(LDD_DEFAULTS,lddApplyCreateWithAIVisibility);
}
setTimeout(lddRefreshCreateWithAI,250);

let lddCreateAIRefreshTimer;
new MutationObserver(()=>{
  clearTimeout(lddCreateAIRefreshTimer);
  lddCreateAIRefreshTimer=setTimeout(lddRefreshCreateWithAI,120);
}).observe(document.documentElement,{childList:true,subtree:true});

lddSafeOnChanged((changes,area)=>{
  if(area==="local"&&changes.showCreateWithAI)lddRefreshCreateWithAI();
});

function lddFindMenuButton(card){
  const exact=lddHorizontalMoreButton(card);
  if(exact)return exact;
  const btns=[...card.querySelectorAll("button")];
  return btns.find(b=>/more|menu|action|option/i.test(b.getAttribute("aria-label")||b.title||""))||null;
}
async function lddSleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function lddOpenCardMenu(card){
  card.scrollIntoView({block:"center",behavior:"instant"});
  const b=lddFindMenuButton(card); if(!b)throw new Error("Card action menu not found");
  b.click(); await lddSleep(140);
}
function lddVisibleAction(text){
  return [...document.querySelectorAll("button")].find(b=>b.offsetParent!==null&&b.textContent.trim()===text);
}
function lddSetVueInput(input,value){
  const proto=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;
  setter?setter.call(input,value):input.value=value;
  input.dispatchEvent(new Event("input",{bubbles:true}));
  input.dispatchEvent(new Event("change",{bubbles:true}));
}
async function lddNativeRename(card,newName){
  await lddOpenCardMenu(card);
  const rename=lddVisibleAction("Rename file"); if(!rename)throw new Error("Rename file action not found");
  rename.click();
  let dialog=null;
  for(let i=0;i<40&&!dialog;i++){await lddSleep(75);dialog=document.querySelector('[role="dialog"][aria-label="Edit File Name"]')}
  if(!dialog)throw new Error("Edit File Name dialog not found");
  const input=dialog.querySelector("input"); if(!input)throw new Error("Rename input not found");
  lddSetVueInput(input,newName);
  const update=[...dialog.querySelectorAll('button[type="submit"]')].find(b=>b.textContent.trim()==="Update File Name");
  if(!update)throw new Error("Update File Name button not found");
  update.click();
  for(let i=0;i<50;i++){
    await lddSleep(80);
    if(!document.querySelector('[role="dialog"][aria-label="Edit File Name"]'))break;
  }
  if(document.querySelector('[role="dialog"][aria-label="Edit File Name"]'))throw new Error("Rename did not finish");
}
async function lddNativeDownload(card){
  await lddOpenCardMenu(card);
  const dl=lddVisibleAction("Download file"); if(!dl)throw new Error("Download file action not found");
  dl.click(); await lddSleep(180);
}
function lddRenameSettings(){
  const q=id=>lddRenamePanel?.querySelector(id);
  return {
    prefix:q("#ldd-r-prefix")?.value||"",
    middle:q("#ldd-r-name")?.value||"",
    suffix:q("#ldd-r-suffix")?.value||"",
    numbering:q("#ldd-r-number")?.checked,
    digits:+(q("#ldd-r-digits")?.value||2),
    start:+(q("#ldd-r-start")?.value||1),
    pos:q("#ldd-r-pos")?.value||"suffix"
  };
}
function lddBuildRename(i){
  const x=lddRenameSettings();
  const num=String(x.start+i).padStart(x.digits,"0");
  let bits=[x.prefix,x.middle,x.suffix].filter(Boolean);
  if(x.numbering){x.pos==="prefix"?bits.unshift(num):bits.push(num)}
  return bits.join(" ").replace(/\s+/g," ").trim();
}
function lddRefreshRename(){
  if(!lddRenamePanel||!lddRenameItems.length)return;
  lddRenameIndex=Math.max(0,Math.min(lddRenameIndex,lddRenameItems.length-1));
  const card=lddRenameItems[lddRenameIndex], img=lddCardImage(card);
  const src=img?.currentSrc||img?.src||"";
  lddRenamePanel.querySelector("#ldd-r-img").src=src;
  lddRenamePanel.querySelector("#ldd-r-count").textContent=`${lddRenameIndex+1} / ${lddRenameItems.length}`;
  lddRenamePanel.querySelector("#ldd-r-original").textContent=lddCardName(card);
  lddRenamePanel.querySelector("#ldd-r-preview").textContent=lddBuildRename(lddRenameIndex)||"Type a name…";
}
function lddSetRenameBusy(v,msg=""){
  lddRenamePanel?.classList.toggle("busy",v);
  const el=lddRenamePanel?.querySelector("#ldd-r-status");if(el)el.textContent=msg;
}
async function lddRenameCurrent(download=false){
  if(!lddRenameItems.length)return;
  const card=lddRenameItems[lddRenameIndex], name=lddBuildRename(lddRenameIndex);
  if(!name){lddRenamePanel.querySelector("#ldd-r-name").focus();return}
  try{
    lddSetRenameBusy(true,"Renaming…");
    await lddNativeRename(card,name);
    if(download){lddSetRenameBusy(true,"Downloading…");await lddNativeDownload(card)}
    if(lddRenameIndex<lddRenameItems.length-1){lddRenameIndex++;lddRefreshRename();lddRenamePanel.querySelector("#ldd-r-name").select()}
    else lddSetRenameBusy(false,"Batch complete ✓");
  }catch(e){console.error("[LDD Renamer]",e);lddSetRenameBusy(false,e.message)}
  finally{if(lddRenameIndex<lddRenameItems.length)lddRenamePanel?.classList.remove("busy")}
}
function lddCloseRenamer(){
  lddRenamePanel?.remove();lddRenamePanel=null;
  document.getElementById("ldd-workflow-backdrop")?.remove();
}
function lddOpenRenamer(auto=false){
  lddRenameItems=auto ? (lddUploadBatchCards||[]).filter(c=>c&&c.isConnected) : lddCheckedCards();
  if(!lddRenameItems.length){
    if(!auto)alert("LDD Carousel Renamer: no checked designs found.");
    return;
  }
  lddRenameIndex=0;
  if(!document.getElementById("ldd-workflow-backdrop")){
    const bg=document.createElement("div");bg.id="ldd-workflow-backdrop";document.body.appendChild(bg);
  }
  lddRenamePanel?.remove();
  lddRenamePanel=document.createElement("section");lddRenamePanel.id="ldd-carousel-renamer";
  lddRenamePanel.innerHTML=`
    <div class="ldd-r-head"><div><b>🐉 CAROUSEL RENAMER</b><small>Checked designs • left → right</small></div><button id="ldd-r-close">×</button></div>
    <div class="ldd-r-nav"><button id="ldd-r-prev">‹</button><b id="ldd-r-count">1 / 1</b><button id="ldd-r-next">›</button></div>
    <div class="ldd-r-image-wrap"><img id="ldd-r-img"><div id="ldd-r-original"></div></div>
    <div class="ldd-r-fields">
      <label>Prefix<input id="ldd-r-prefix" placeholder="Optional"></label>
      <label class="wide">Name<input id="ldd-r-name" placeholder="Type unique name"></label>
      <label>Suffix<input id="ldd-r-suffix" placeholder="Optional"></label>
    </div>
    <div class="ldd-r-options">
      <label><input id="ldd-r-number" type="checkbox"> Auto #</label>
      <select id="ldd-r-digits"><option value="1">1</option><option value="2" selected>01</option><option value="3">001</option></select>
      <span>Start</span><input id="ldd-r-start" type="number" value="1" min="0">
      <select id="ldd-r-pos"><option value="suffix">Number after</option><option value="prefix">Number before</option></select>
    </div>
    <div class="ldd-r-live">LIVE NAME <b id="ldd-r-preview"></b></div>
    <div id="ldd-r-status"></div>
    <div class="ldd-r-actions">
      <button id="ldd-r-skip" class="ldd-secondary">Skip</button>
      <button id="ldd-r-download" class="ldd-secondary">Rename + Download + Next</button>
      <button id="ldd-r-save" class="ldd-primary">Rename + Next ↵</button>
      <button id="ldd-r-finish" class="ldd-secondary">Finish</button>
    </div>`;
  document.body.appendChild(lddRenamePanel);
  const q=id=>lddRenamePanel.querySelector(id);
  q("#ldd-r-close").onclick=lddCloseRenamer;q("#ldd-r-finish").onclick=lddCloseRenamer;
  q("#ldd-r-prev").onclick=()=>{if(lddRenameIndex>0){lddRenameIndex--;lddRefreshRename()}};
  q("#ldd-r-next").onclick=()=>{if(lddRenameIndex<lddRenameItems.length-1){lddRenameIndex++;lddRefreshRename()}};
  q("#ldd-r-skip").onclick=()=>{if(lddRenameIndex<lddRenameItems.length-1){lddRenameIndex++;lddRefreshRename();q("#ldd-r-name").select()}};
  q("#ldd-r-save").onclick=()=>lddRenameCurrent(false);
  q("#ldd-r-download").onclick=()=>lddRenameCurrent(true);
  ["#ldd-r-prefix","#ldd-r-name","#ldd-r-suffix","#ldd-r-number","#ldd-r-digits","#ldd-r-start","#ldd-r-pos"].forEach(id=>{
    q(id).addEventListener("input",lddRefreshRename);q(id).addEventListener("change",lddRefreshRename);
  });
  q("#ldd-r-name").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();lddRenameCurrent(false)}});
  lddRefreshRename();setTimeout(()=>q("#ldd-r-name").focus(),60);
}
function lddMountRenameFab(){
  if(document.getElementById("ldd-rename-fab"))return;
  lddRenameFab=document.createElement("button");lddRenameFab.id="ldd-rename-fab";lddRenameFab.className="ldd-tool-fab";lddRenameFab.textContent="✎";lddRenameFab.title="Carousel Renamer";
  document.body.appendChild(lddRenameFab);lddRenameFab.onclick=()=>lddOpenRenamer(false);
}
function lddUnmountRenameFab(){lddRenameFab?.remove();lddRenameFab=null;lddCloseRenamer()}

/* Watch for the DnD/upload flow completing: after the Upload Designs dialog closes,
   wait briefly for MD to render/check the new cards, then open the renamer. */
let lddUploadDialogSeen=false,lddAutoRenameTimer=null;
const lddUploadWatch=new MutationObserver(()=>{
  const dlg=document.querySelector('[role="dialog"][aria-label="Upload Designs"]');
  if(dlg){lddUploadDialogSeen=true;return}
  if(lddUploadDialogSeen){
    lddUploadDialogSeen=false;
    clearTimeout(lddAutoRenameTimer);
    lddAutoRenameTimer=setTimeout(()=>{
      lddSafeGet(LDD_DEFAULTS,o=>{
        if(o.carouselRenamer&&o.dragUpload)lddWaitForUploadedCards().then(cards=>{if(cards.length)lddOpenRenamer(true);});
      });
    },1100);
  }
});
lddUploadWatch.observe(document.documentElement,{childList:true,subtree:true});

lddSafeGet(LDD_DEFAULTS,o=>{
  if(o.themeTweaker){lddMountThemeUI();lddApplyTheme(o)}
  if(o.carouselRenamer)lddMountRenameFab();
});
lddSafeOnChanged((ch,area)=>{
  if(area!=="local")return;
  if(ch.themeTweaker)ch.themeTweaker.newValue?lddMountThemeUI():lddUnmountThemeUI();
  if(ch.carouselRenamer)ch.carouselRenamer.newValue?lddMountRenameFab():lddUnmountRenameFab();
  if(["themeTweaker","themeEnabled","themeColor","themeGlow","themeRadius","themeCards"].some(k=>ch[k])) lddSafeGet(LDD_DEFAULTS,lddApplyTheme);
});


/* ===== v0.4.5 visible launcher rail ===== */
function lddMountLauncherRail(){
  if(document.getElementById("ldd-launcher-rail")) return;
  const rail=document.createElement("div");
  rail.id="ldd-launcher-rail";
  rail.innerHTML=`
    <button id="ldd-launch-theme" title="Theme Tweaker">◈<span>Theme</span></button>
    <button id="ldd-launch-fonts" title="App Font">Aa<span>Fonts</span></button>
    <button id="ldd-launch-rename" title="Carousel Renamer">✎<span>Rename</span></button>`;
  document.body.appendChild(rail);

  rail.querySelector("#ldd-launch-theme").onclick=()=>{
    lddSafeGet(LDD_DEFAULTS,o=>{
      if(!o.themeTweaker) return;
      lddMountThemeUI();
      lddThemePanel?.classList.add("open");
      lddRenderThemePanel();
    });
  };
  rail.querySelector("#ldd-launch-fonts").onclick=()=>{
    lddSafeGet(LDD_DEFAULTS,o=>{
      if(!o.appFont) return;
      lddMountFontUI();
      const panel=document.getElementById("ldd-font-panel");
      if(panel) panel.classList.add("open");
    });
  };
  rail.querySelector("#ldd-launch-rename").onclick=()=>{
    lddSafeGet(LDD_DEFAULTS,o=>{
      if(o.carouselRenamer) lddOpenRenamer(false);
    });
  };

  const sync=()=>lddSafeGet(LDD_DEFAULTS,o=>{
    const t=rail.querySelector("#ldd-launch-theme"),f=rail.querySelector("#ldd-launch-fonts"),r=rail.querySelector("#ldd-launch-rename");
    if(t)t.style.display=o.themeTweaker?"flex":"none";
    if(f)f.style.display=o.appFont?"flex":"none";
    if(r)r.style.display=o.carouselRenamer?"flex":"none";
  });
  sync();
  lddSafeOnChanged((changes,area)=>{
    if(area==="local" && (changes.themeTweaker||changes.appFont||changes.carouselRenamer)) sync();
  });
}
/* v0.8.6: floating rail retired; LDD Tools now lives in the MD sidebar. */


/* ===== LDD TOOLS NATIVE-STYLE APP PAGE v0.8.6 ===== */
let lddAppOpen=false, lddSavedMainNodes=[], lddAppRoot=null;

function lddStorageSet(key,val){ lddSafeSet({[key]:val}); }

function lddFindMdSidebar(){
  const designs=[...document.querySelectorAll("a")].find(a=>{
    const label=[...a.querySelectorAll("div")].find(d=>d.textContent.trim()==="Designs");
    return !!label;
  });
  if(!designs) return null;
  let n=designs.parentElement;
  while(n && n!==document.body){
    const labels=[...n.querySelectorAll(":scope > a")].map(a=>a.textContent.trim());
    if(labels.includes("Designs") && (labels.includes("Home") || labels.includes("Products"))) return n;
    n=n.parentElement;
  }
  return designs.parentElement;
}
function lddSidebarLabelAnchor(label){
  return [...document.querySelectorAll("a")].find(a=>a.textContent.trim()===label);
}
function lddMountSidebarEntry(){
  // Anchor to the live native Mockups row every time. MyDesigns/Vue can rebuild
  // the sidebar, so an existing LDD row may need to be moved/rebuilt.
  const mockupIcon=document.querySelector('svg g#mockup');
  const mockups=mockupIcon?.closest("a") || lddSidebarLabelAnchor("Mockups");
  if(!mockups || !mockups.parentElement) return false;

  let a=document.getElementById("ldd-sidebar-entry");
  if(a && a.parentElement!==mockups.parentElement){ a.remove(); a=null; }

  if(!a){
    // Clone the real Mockups row so LDD inherits MD's exact row height,
    // alignment, spacing, hover behavior and collapsed/expanded layout.
    a=mockups.cloneNode(true);
    a.id="ldd-sidebar-entry";
    a.dataset.lddToolsLauncher="1";
    a.href="#ldd-tools";
    a.removeAttribute("aria-current");

    // Replace the native label without changing the native layout wrappers.
    const walker=document.createTreeWalker(a,NodeFilter.SHOW_TEXT);
    const textNodes=[];
    while(walker.nextNode()) textNodes.push(walker.currentNode);
    const labelNode=textNodes.find(n=>n.nodeValue && n.nodeValue.trim()==="Mockups");
    if(labelNode) labelNode.nodeValue=labelNode.nodeValue.replace("Mockups","LDD Tools");

    // Keep the native icon box, but replace only its SVG artwork.
    const svg=a.querySelector("svg");
    if(svg){
      svg.setAttribute("viewBox","0 0 24 24");
      svg.removeAttribute("aria-label");
      svg.innerHTML='<path fill="currentColor" d="M12 2.1c1.1 1.4 1.8 2.6 2.1 3.7 1.6-.7 3.2-.8 4.8-.3-.7.8-1.3 1.7-1.7 2.7 1.6.7 2.8 1.8 3.7 3.2-1.1.1-2.1.4-3 .9.2 3.8-2.2 7.2-5.9 8.6-3.7-1.4-6.1-4.8-5.9-8.6-.9-.5-1.9-.8-3-.9.9-1.4 2.1-2.5 3.7-3.2-.4-1-1-1.9-1.7-2.7 1.6-.5 3.2-.4 4.8.3.3-1.1 1-2.3 2.1-3.7Zm-3.7 9.3c.4 1.2 1.2 2.1 2.2 2.7-.1-1.2.4-2.2 1.5-3.1 1.1.9 1.6 1.9 1.5 3.1 1-.6 1.8-1.5 2.2-2.7-.9-.5-1.8-.7-2.7-.5l-1 .9-1-.9c-.9-.2-1.8 0-2.7.5Zm1.2 5.1c.8 1.1 1.6 1.8 2.5 2.2.9-.4 1.7-1.1 2.5-2.2-.8.2-1.7.2-2.5-.1-.8.3-1.7.3-2.5.1Z"/><circle cx="9.2" cy="9.3" r="1" fill="currentColor"/><circle cx="14.8" cy="9.3" r="1" fill="currentColor"/>';
      svg.classList.add("ldd-dragon-svg");
    }

    a.addEventListener("click",async e=>{
      e.preventDefault();
      e.stopPropagation();
      try{ await lddOpenAppPageWithUpdateGate(); }
      catch(err){ console.error("LDD Tools open failed",err); lddOpenAppPage(); }
    });
  }

  // Exact permanent position: Mockups -> LDD Tools -> next native section/item.
  if(mockups.nextElementSibling!==a) mockups.insertAdjacentElement("afterend",a);
  return true;
}
function lddFindContentHost(){
  const sidebar=lddFindMdSidebar();
  if(!sidebar) return null;
  // The sidebar's parent is the app layout; choose its largest visible sibling.
  let layout=sidebar.parentElement;
  if(!layout) return null;
  let sibs=[...layout.children].filter(x=>x!==sidebar && x.offsetWidth>300);
  return sibs.sort((a,b)=>(b.offsetWidth*b.offsetHeight)-(a.offsetWidth*a.offsetHeight))[0] || null;
}
function lddToggleCard(key,title,desc,on){
  return `<div class="ldd-setting-card">
    <div><b>${title}</b><span>${desc}</span></div>
    <label class="ldd-page-switch"><input data-setting="${key}" type="checkbox" ${on?"checked":""}><i></i></label>
  </div>`;
}
function lddRenderDashboard(o){
  const enabled=Object.values(o).filter(v=>v===true).length;
  const mode=(o.mode||o.appMode||"Power User");
  const theme=o.themeEnabled ? (o.themePreset||o.themeName||"Custom") : "Native MyDesigns";
  return `
  <div class="ldd-page-hero ldd-info-hero">
    <div><div class="ldd-kicker">LAVENDER DRAGON DESIGN</div><h1><span class="ldd-hero-logo">${lddIconTag(34)}</span> LDD Tools</h1>
    <p>Extra workflow tools, customization, and speed controls built for MyDesigns creators.</p></div>
    <div class="ldd-version">v${chrome.runtime.getManifest().version}</div>
  </div>
  <div class="ldd-section ldd-dashboard-info">
    <div class="ldd-sidebar-expanded-banner"><div class="ldd-sidebar-expanded-banner-title">⚠ LDD TOOLS WORKS BEST WITH THE MYDESIGNS SIDEBAR EXPANDED</div><div class="ldd-sidebar-expanded-banner-body">For the cleanest layout, native sidebar spacing, and easiest access to LDD Tools, keep the MyDesigns sidebar expanded while using LDD Tools.</div></div>
    <div class="ldd-control-card"><h2>Welcome to LDD Tools</h2><span>LDD Tools adds optional creator-focused utilities on top of MyDesigns. Use the pages in the left menu to customize the interface, speed up repetitive work, and turn individual tools on or off whenever you want.</span></div>
    <div class="ldd-control-card"><h2>What's New • v${chrome.runtime.getManifest().version}</h2><span><b>Dashboard refresh:</b> Dashboard is now a clean information page instead of another control panel.</span><span><b>Listing Title Rows:</b> choose a roomier 1–5 row title editor from UI Tweaks, with 3 rows as the default.</span><span><b>Theme consistency:</b> LDD Settings follows the active LDD theme instead of using fixed neon-green accents.</span></div>
    <div class="ldd-control-card"><h2>Included Tools</h2><span><b>Tools:</b> Drag & Drop Upload, Carousel Renamer, Scout AI Style Creator & Autofiller, and ChatGPT Prompt Queue.</span><span><b>Customization:</b> LDD themes, app fonts, hotkeys, UI tweaks, show/hide controls, and listing-title sizing.</span><span><b>Performance:</b> selectable performance modes plus TinyMD for aggressive speed-focused UI reduction.</span></div>
    <div class="ldd-control-card"><h2>Current Setup</h2><span><b>Mode:</b> ${mode} &nbsp; • &nbsp; <b>Theme:</b> ${theme} &nbsp; • &nbsp; <b>Enabled settings:</b> ${enabled}</span><span>This page is informational only. Change features from Tools, Performance, Theme, Fonts, Hotkeys, or Settings.</span></div>
    <div class="ldd-control-card"><h2>Quick Guide</h2><span><b>Tools</b> handles workflow helpers. <b>Theme & Fonts</b> change the look of MyDesigns locally. <b>Hotkeys</b> speeds up common actions. <b>Performance</b> controls speed tweaks. <b>Settings</b> contains visibility, interface, and extension options.</span></div>
    <div class="ldd-dashboard-corner" aria-label="Lavender Dragon Design links"><span>Made with ❤️ by Andrea</span><a href="https://buymeacoffee.com/lavenderdragondesign" target="_blank" rel="noopener noreferrer">☕ Buy Me a Coffee</a><a href="https://www.etsy.com/shop/LavenderDragonDesign" target="_blank" rel="noopener noreferrer">🛍 Etsy</a><button type="button" id="ldd-suggest-feature">💡 Suggest a Feature</button></div>
  </div>`;
}
function lddOpenSuggestionCard(){
  if(document.getElementById("ldd-suggestion-card")) return;
  const ov=document.createElement("div");
  ov.id="ldd-suggestion-card";
  ov.innerHTML=`<div class="ldd-suggestion-white-card" role="dialog" aria-modal="true" aria-label="Suggest a Feature">
    <button type="button" class="ldd-suggestion-x" aria-label="Close">×</button>
    <div class="ldd-suggestion-kicker">LDD TOOLS</div>
    <h2>💡 Suggest a Feature</h2>
    <p>Got an idea that would make LDD Tools better? Send it over.</p>
    <label>Suggestion title<input id="ldd-suggestion-title" maxlength="120" placeholder="What should LDD Tools add?"></label>
    <label>Details<textarea id="ldd-suggestion-details" maxlength="4000" rows="7" placeholder="Tell me what you want it to do, where it should live, or what problem it would solve."></textarea></label>
    <div class="ldd-suggestion-actions"><button type="button" data-cancel>Cancel</button><button type="button" data-submit>Submit Suggestion</button></div>
    <div class="ldd-suggestion-note">Submission opens the official LDD Tools suggestion form on GitHub with your idea pre-filled.</div>
  </div>`;
  const close=()=>ov.remove();
  ov.querySelector(".ldd-suggestion-x").onclick=close;
  ov.querySelector("[data-cancel]").onclick=close;
  ov.addEventListener("click",e=>{if(e.target===ov)close()});
  ov.querySelector("[data-submit]").onclick=()=>{
    const title=(ov.querySelector("#ldd-suggestion-title").value||"").trim();
    const details=(ov.querySelector("#ldd-suggestion-details").value||"").trim();
    if(!title){ ov.querySelector("#ldd-suggestion-title").focus(); return; }
    const body=`### Suggestion\n${details||title}\n\n---\nSubmitted from LDD Tools v${chrome.runtime.getManifest().version}`;
    const url=`https://github.com/lavenderdragondesign/LDDEXTENSIONMD/issues/new?title=${encodeURIComponent("Suggestion: "+title)}&body=${encodeURIComponent(body)}`;
    window.open(url,"_blank","noopener,noreferrer");
    close();
  };
  document.body.appendChild(ov);
  setTimeout(()=>ov.querySelector("#ldd-suggestion-title")?.focus(),0);
}
function lddRenderThemePage(o){
 return `<div class="ldd-page-title"><h2>◈ Theme</h2><p>Customize the MyDesigns app locally.</p></div>
 <div class="ldd-section">
 ${lddToggleCard("themeTweaker","Theme Tweaker","Enable app theme customization.",o.themeTweaker)}
 ${lddToggleCard("themeEnabled","Apply Theme","Turn your selected theme on/off.",o.themeEnabled)}
 <div class="ldd-control-card"><b>Neon color</b><span>Choose a preset or any custom color.</span>
 <div class="ldd-page-neons">${LDD_NEONS.map(([n,c])=>`<button data-page-neon="${c}" title="${n}" style="--sw:${c}"></button>`).join("")}<input id="ldd-page-color" type="color" value="${o.themeColor||"#39ff14"}"></div></div>
 <div class="ldd-control-card"><b>Card shape</b><span id="ldd-page-radius-val">${o.themeRadius??12}px radius</span>
 <input id="ldd-page-radius" type="range" min="0" max="32" value="${o.themeRadius??12}">
 <div class="ldd-page-shapes"><button data-page-rad="0">Square</button><button data-page-rad="8">Soft</button><button data-page-rad="16">Round</button><button data-page-rad="28">Extra Round</button></div></div>
 ${lddToggleCard("themeCards","Change Card Shapes","Apply the selected radius to MD cards.",o.themeCards)}
 ${lddToggleCard("themeGlow","Neon Glow","Add a soft neon glow to active controls.",o.themeGlow)}
 <div class="ldd-control-card">
   <b>Full MD Neon Engine</b>
   <span>Merged from LDD MD Neon Theme v2.15.1 — recolors the deeper MyDesigns UI, previews and charts.</span>
   <div class="ldd-page-inline ldd-engine-colors">
     <button data-engine-color="green">Green</button>
     <button data-engine-color="cyan">Cyan</button>
     <button data-engine-color="pink">Pink</button>
     <button data-engine-color="purple">Purple</button>
     <button data-engine-color="orange">Orange</button>
   </div>
   <div class="ldd-page-inline">
     <button data-engine-mode="black">Pitch Black</button>
     <button data-engine-mode="white">Pitch White</button>
     <button data-engine-shape="circle">Circle Previews</button>
     <button data-engine-shape="rounded">Rounded Previews</button>
   </div>
 </div>
 <button id="ldd-page-theme-reset" class="ldd-page-secondary">Reset to MD Default</button>
 </div>`;
}
function lddRenderFontsPage(o){
 const current=String(o.appFontFamily||"MyDesigns Default").replace(/</g,"&lt;");
 return `<div class="ldd-page-title ldd-font-page-title"><h2>Aa Fonts</h2><p>Choose the font used by the MyDesigns interface in this browser.</p></div>
 <div class="ldd-font-redesign">
  <div class="ldd-font-current-card">
   <div><div class="ldd-font-kicker">CURRENT FONT</div><strong id="ldd-font-current-page">${current}</strong><span>Applies to the MyDesigns interface only — never to text inside your artwork.</span></div>
   <div class="ldd-page-inline"><button id="ldd-reset-font" class="ldd-page-secondary">Reset to MyDesigns</button></div>
  </div>
  ${lddToggleCard("appFont","App Font","Enable or disable your saved interface font without losing the selection.",o.appFont)}
  <div class="ldd-font-library-card">
   <div class="ldd-font-library-head"><div><h2>Font Library</h2><span>20 hand-picked fonts. ★ favorites stay first.</span></div><input id="ldd-font-search20" type="search" placeholder="Search the 20 fonts…"></div>
   <div id="ldd-inline-font-browser" class="ldd-inline-font-browser"></div>
  </div>
  <div class="ldd-font-warning"><b>Font note:</b> Some fonts are naturally wider than MyDesigns' default and may make text tighter when the sidebar is collapsed. Expand the sidebar or reset to MyDesigns if needed.</div>
 </div>`;
}
function lddRenderDesignPage(o){
 return `<div class="ldd-page-title"><h2>✦ Design Tools</h2><p>Small utilities that make everyday MD work faster.</p></div>
 <div class="ldd-section">
 ${lddToggleCard("hoverPreview","Preview Pro","Lightweight hover preview for design cards.",o.hoverPreview)}
 <div class="ldd-control-card ldd-preview-controls"><b>Preview Pro Controls</b><span>Smaller and faster by default. Esc always closes the preview.</span>
  <div class="ldd-page-inline"><button type="button" data-preview-size="small" class="${(o.hoverPreviewSize||"small")==="small"?"active":""}">Small</button><button type="button" data-preview-size="medium" class="${o.hoverPreviewSize==="medium"?"active":""}">Medium</button><button type="button" data-preview-size="large" class="${o.hoverPreviewSize==="large"?"active":""}">Large</button></div>
  <label>Hover delay <input id="ldd-preview-delay" type="range" min="50" max="600" step="50" value="${Number(o.hoverPreviewDelay)||180}"><b id="ldd-preview-delay-val">${Number(o.hoverPreviewDelay)||180}ms</b></label>
  ${lddToggleCard("hoverPreviewSwatches","Color Strip","Show background color swatches under the preview.",o.hoverPreviewSwatches!==false)}
  ${lddToggleCard("hoverPreviewCloseMouseout","Close on Mouse-Out","Close quickly when leaving the design card.",o.hoverPreviewCloseMouseout!==false)}
 </div>
 <div class="ldd-control-card"><b>Custom Instructions</b><span>Save reusable MyDesigns instruction presets and paste them into the native Custom instructions field.</span><textarea id="ldd-ci-editor" rows="6" maxlength="100000" placeholder="e.g. Include emojis in description"></textarea><input id="ldd-ci-name" maxlength="80" placeholder="Preset name"><div class="ldd-page-inline"><button type="button" id="ldd-ci-save">Save Preset</button><button type="button" id="ldd-ci-apply">Apply to MyDesigns</button><button type="button" id="ldd-ci-copy">Copy</button></div><div id="ldd-ci-presets" class="ldd-ci-presets">${(o.customInstructionPresets||[]).map((x,i)=>`<button type="button" data-ci-preset="${i}">${String(x.name||`Preset ${i+1}`).replace(/</g,"&lt;")}</button>`).join("")}</div></div>
  ${lddToggleCard("showCompositionGallery","Composition Gallery","Show or hide the MyDesigns composition/template thumbnail gallery.",o.showCompositionGallery)}
  ${lddToggleCard("showDesignsSearch","Designs Search Bar","Show or hide the Designs search box.",o.showDesignsSearch)}
 ${lddToggleCard("productPresets","Product Type Buttons","PNG, SVG, tumbler wrap and your custom presets.",o.productPresets)}
 ${lddToggleCard("maxLength","Max Length Unlocker","Raise local input and textarea maxlength to 100,000.",o.maxLength)}
 ${lddToggleCard("credits","Credits","Show or hide the MD credits counter.",o.credits)}
 </div>`;
}
function lddRenderWorkflowPage(o){
 return `<div class="ldd-page-title"><h2>⇧ Upload & Rename</h2><p>Explorer → MyDesigns → rename the checked upload batch.</p></div>
 <div class="ldd-section">
  <div class="ldd-feature-info"><h3>Drag & Drop Upload</h3><p><b>What it does:</b> Drag image files straight from Windows Explorer onto the MyDesigns Designs page. LDD hands them to MyDesigns' native upload flow so you can skip opening the upload picker first.</p></div>
  <div class="ldd-enable-disable" data-two-button-setting="dragUpload"><button type="button" data-setting-value="true" class="${o.dragUpload!==false?'active':''}">ENABLE</button><button type="button" data-setting-value="false" class="${o.dragUpload===false?'active':''}">DISABLE</button></div>
  <div class="ldd-feature-info"><h3>Carousel Renamer</h3><p><b>What it does:</b> Opens the LDD renaming workflow for the designs you intentionally choose. Enable and Disable only control availability; only Open launches the renamer.</p></div>
  <div class="ldd-enable-disable" data-two-button-setting="carouselRenamer"><button type="button" data-setting-value="true" class="${o.carouselRenamer!==false?'active':''}">ENABLE</button><button type="button" data-setting-value="false" class="${o.carouselRenamer===false?'active':''}">DISABLE</button><button type="button" id="ldd-page-open-renamer" class="ldd-page-secondary" ${o.carouselRenamer===false?'disabled':''}>OPEN</button></div>
  <div class="ldd-feature-info"><h3>Scout AI Style Creator &amp; Autofiller</h3><p><b>What it does:</b> Adds the reusable Scout AI style library, Auto Fill, Create Style With AI, import/export, categories, and Dragon Pong.</p></div>
  <div class="ldd-enable-disable" data-two-button-setting="scoutAIEnabled"><button type="button" data-setting-value="true" class="${o.scoutAIEnabled!==false?'active':''}">ENABLE</button><button type="button" data-setting-value="false" class="${o.scoutAIEnabled===false?'active':''}">DISABLE</button><button type="button" id="ldd-page-open-scout" class="ldd-page-secondary" ${o.scoutAIEnabled===false?'disabled':''}>OPEN</button></div>
  <div class="ldd-feature-info"><h3>ChatGPT Prompt Queue</h3><p><b>What it does:</b> Queues prompts in ChatGPT and runs them one at a time with pause, resume, skip, stop, delay, progress, and completion tracking.</p></div>
  <div class="ldd-enable-disable" data-two-button-setting="autoPromptQueueEnabled"><button type="button" data-setting-value="true" class="${o.autoPromptQueueEnabled===true?'active':''}">ENABLE</button><button type="button" data-setting-value="false" class="${o.autoPromptQueueEnabled!==true?'active':''}">DISABLE</button><button type="button" id="ldd-open-prompt-queue" class="ldd-page-secondary" ${o.autoPromptQueueEnabled!==true?'disabled':''}>OPEN</button></div>
 </div>`;
}

const LDD_PERF_TIPS={
perfEnabled:"Master switch for LDD performance changes.",
perfAnimations:"Reduces interface animations. Low risk and useful on slower systems.",
perfBlur:"Removes expensive blur effects. The UI may look flatter.",
perfShadows:"Reduces large shadows and glow paint work.",
perfLightNeon:"Keeps simpler LDD effects instead of heavier visual effects.",
perfCompactFolders:"Uses a denser folder layout. Mostly a visual change.",
perfPauseHidden:"Reduces LDD work while this browser tab is hidden.",
perfContentVisibility:"Lets Chrome skip rendering some off-screen content until needed.",
perfLazyImages:"Defers card image loading/decoding until closer to view.",
perfNoSmoothScroll:"Disables animated scrolling so jumps happen immediately.",
perfDisableHoverPreview:"Turns off LDD hover previews to reduce image/event work.",
perfHideSupportWidgets:"Hides support/chat widgets. Re-enable before using them.",
perfTinyMD:"Broad LDD debloat preset affecting visuals and background work.",
perfDeepDebloat:"Aggressive cleanup for slower systems. May simplify nonessential UI.",
perfHideAnnouncements:"Hides detected promotional and announcement UI.",
perfReduceMotionMedia:"Reduces animation-heavy media where possible.",
perfSuspendHiddenVideos:"Pauses hidden video elements where possible.",
perfTrimCardEffects:"Removes some card transitions, shadows and decorations.",
perfDenseMenus:"Makes supported menus more compact.",
perfDisableTooltips:"Suppresses many built-in hover tips. Avoid if you rely on MD hints.",
perfHideToasts:"Suppresses some noncritical notices. You may miss minor feedback.",
perfFreezeOffscreenMedia:"Aggressively reduces work from media outside the visible area.",
perfReduceObservers:"Reduces LDD page watching. Some LDD enhancements may react more slowly.",
perfStripDecorations:"Removes decorative effects that do not affect core workflow.",
perfCompactModals:"Reduces spacing in supported MyDesigns dialogs.",
perfHideTips:"Hides detected onboarding and tip UI."
};
function lddCompactToggle(key,label,on){
 const tip=LDD_PERF_TIPS[key]||"Advanced performance setting.";
 return `<label class="ldd-perf-mini ldd-perf-help" data-tip="${tip.replace(/"/g,"&quot;")}"><span>${label}</span><span class="ldd-page-switch"><input type="checkbox" data-setting="${key}" ${on?"checked":""}><i></i></span></label>`;
}
function lddRenderPerformancePage(o){
 return `<div class="ldd-performance-page">
 <div class="ldd-perf-head"><div><h2>⚡ Performance</h2><p>Hover any setting for a plain-English explanation.</p></div>${lddCompactToggle("perfEnabled","MASTER",o.perfEnabled)}</div>
 <div class="ldd-perf-presets">
 <button class="ldd-perf-preset safe ldd-perf-help" data-perf-preset="safe" data-tip="Safe — light optimizations with minimal changes to normal MyDesigns behavior.">🟢 Safe</button>
 <button class="ldd-perf-preset medium ldd-perf-help" data-perf-preset="medium" data-tip="Medium — stronger optimizations while keeping the normal workflow.">🟡 Medium</button>
 <button class="ldd-perf-preset extreme ldd-perf-help" data-perf-preset="extreme" data-tip="Extreme — aggressive debloat, rendering and media reductions.">🟠 Extreme</button>
 <button class="ldd-perf-preset power ldd-perf-help" data-perf-preset="power" data-tip="Power User — maximum performance settings and the largest behavior changes.">🔴 Power User</button>
 </div>
 <button type="button" class="ldd-tinymd-entry ldd-tinymd-top-launcher" data-tab="tinymd"><span><b>⚠ TinyMD</b><small>Maximum-speed, intentionally aggressive MyDesigns debloat</small></span><strong>OPEN →</strong></button>
 <div class="ldd-perf-grid">
 ${lddCompactToggle("perfAnimations","Reduce animations",o.perfAnimations)}
 ${lddCompactToggle("perfBlur","Disable blur",o.perfBlur)}
 ${lddCompactToggle("perfShadows","Reduce shadows",o.perfShadows)}
 ${lddCompactToggle("perfLightNeon","Lightweight effects",o.perfLightNeon)}
 ${lddCompactToggle("perfCompactFolders","Compact folders",o.perfCompactFolders)}
 ${lddCompactToggle("perfPauseHidden","Pause background LDD",o.perfPauseHidden)}
 ${lddCompactToggle("perfContentVisibility","Viewport rendering",o.perfContentVisibility)}
 ${lddCompactToggle("perfLazyImages","Lazy card images",o.perfLazyImages)}
 ${lddCompactToggle("perfNoSmoothScroll","No smooth scroll",o.perfNoSmoothScroll)}
 ${lddCompactToggle("perfDisableHoverPreview","Disable hover preview",o.perfDisableHoverPreview)}
 ${lddCompactToggle("perfHideSupportWidgets","Hide support/chat",o.perfHideSupportWidgets)}
 ${lddCompactToggle("perfDeepDebloat","Deep debloat",o.perfDeepDebloat)}
 ${lddCompactToggle("perfHideAnnouncements","Hide promos",o.perfHideAnnouncements)}
 ${lddCompactToggle("perfReduceMotionMedia","Reduce animated media",o.perfReduceMotionMedia)}
 ${lddCompactToggle("perfSuspendHiddenVideos","Suspend hidden video",o.perfSuspendHiddenVideos)}
 ${lddCompactToggle("perfTrimCardEffects","Trim card effects",o.perfTrimCardEffects)}
 ${lddCompactToggle("perfDenseMenus","Dense menus",o.perfDenseMenus)}
 ${lddCompactToggle("perfDisableTooltips","Disable tooltips",o.perfDisableTooltips)}
 ${lddCompactToggle("perfHideToasts","Hide noncritical toasts",o.perfHideToasts)}
 ${lddCompactToggle("perfFreezeOffscreenMedia","Freeze offscreen media",o.perfFreezeOffscreenMedia)}
 ${lddCompactToggle("perfReduceObservers","Reduce LDD watchers",o.perfReduceObservers)}
 ${lddCompactToggle("perfStripDecorations","Strip decorations",o.perfStripDecorations)}
 ${lddCompactToggle("perfCompactModals","Compact MD modals",o.perfCompactModals)}
 ${lddCompactToggle("perfHideTips","Hide tips/onboarding",o.perfHideTips)}
 </div><div class="ldd-perf-foot">Core uploads, Designs, Products, Stores, Vue and API calls are not intentionally disabled.</div></div>`;
}
function lddRenderTinyMDPage(o){
 const on=o.perfEnabled===true&&o.perfTinyMD===true;
 return `<div class="ldd-page ldd-tinymd-page">
  <button type="button" class="ldd-tinymd-back" data-tab="performance">← Back to Performance</button>
  <div class="ldd-tinymd-warning">
   <div class="ldd-tinymd-warning-title">⚠ TINYMD — MAXIMUM PERFORMANCE MODE</div>
   <p><b>TinyMD is intentionally aggressive.</b> It prioritizes lightning-fast MyDesigns performance over visual polish and nonessential interface behavior.</p>
   <p>Animations, previews, hover effects, shadows, blur, tips, background visual work, media and some nonessential UI may be reduced, hidden, paused or behave differently. <b>Parts of the MyDesigns interface may look broken while TinyMD is enabled. That is expected.</b></p>
   <p><b>TinyMD is not designed to be dangerous.</b> It does not intentionally delete designs, products, uploads, listings, files, stores or account data. Core LDD/MD workflow functions are intentionally protected where possible.</p>
   <p><b>USE AT YOUR OWN RISK.</b> Lavender Dragon Design / LDD Tools is not liable for unexpected behavior, interrupted workflows, lost unsaved work, MyDesigns changes, or other issues resulting from TinyMD. Save important work before enabling it.</p>
  </div>
  <div class="ldd-feature-info"><h3>What TinyMD does</h3><p>Uses the strongest LDD performance reductions: minimal motion and effects, off-screen rendering/media reductions, compact UI, reduced background watchers, disabled hover preview, support/promotional cleanup, and deep visual debloat.</p></div>
  <div class="ldd-tinymd-status ${on?'on':'off'}">TinyMD is <b>${on?'ENABLED':'DISABLED'}</b></div>
  <div class="ldd-enable-disable ldd-tinymd-actions"><button type="button" id="ldd-enable-tinymd" class="${on?'active':''}">ENABLE TINYMD</button><button type="button" id="ldd-disable-tinymd" class="${!on?'active':''}">DISABLE TINYMD</button></div>
 </div>`;
}
function lddTinyMDConfirm(){
 return new Promise(resolve=>{
  document.getElementById('ldd-tinymd-confirm')?.remove();
  const ov=document.createElement('div'); ov.id='ldd-tinymd-confirm';
  ov.innerHTML=`<div class="ldd-tinymd-confirm-card"><h2>⚠ ENABLE TINYMD?</h2><p>TinyMD may intentionally break or reduce parts of the MyDesigns UI to maximize speed. It is not intended to delete your MyDesigns data, but unsaved work can still be affected by unexpected app behavior.</p><label><input type="checkbox" id="ldd-tinymd-understand"> <b>I UNDERSTAND</b> TinyMD may break or reduce parts of the MyDesigns interface and I am choosing to enable it at my own risk.</label><div><button type="button" data-cancel>Cancel</button><button type="button" data-enable disabled>ENABLE TINYMD</button></div></div>`;
  document.body.appendChild(ov);
  const check=ov.querySelector('#ldd-tinymd-understand'), enable=ov.querySelector('[data-enable]');
  check.onchange=()=>enable.disabled=!check.checked;
  ov.querySelector('[data-cancel]').onclick=()=>{ov.remove();resolve(false)};
  enable.onclick=()=>{ov.remove();resolve(true)};
 });
}
const LDD_TINYMD_SETTINGS={perfEnabled:true,perfAnimations:true,perfBlur:true,perfShadows:true,perfLightNeon:true,perfCompactFolders:true,perfPauseHidden:true,perfContentVisibility:true,perfLazyImages:true,perfNoSmoothScroll:true,perfDisableHoverPreview:true,perfHideSupportWidgets:true,perfTinyMD:true,perfDeepDebloat:true,perfHideAnnouncements:true,perfReduceMotionMedia:true,perfSuspendHiddenVideos:true,perfTrimCardEffects:true,perfDenseMenus:true,perfDisableTooltips:true,perfHideToasts:true,perfFreezeOffscreenMedia:true,perfReduceObservers:true,perfStripDecorations:true,perfCompactModals:true,perfHideTips:true};

function lddRenderSettingsPage(o){
 return `<div class="ldd-page-title"><h2>⚙ Settings</h2><p>Choose exactly which parts of MyDesigns stay visible.</p></div>
 <div id="ldd-settings-tabs-152">
   <button class="active" data-settings-pane="sidebar">Sidebar</button>
   <button data-settings-pane="panels">Panels & Menus</button>
   <button data-settings-pane="header">Top Header</button>
   <button data-settings-pane="home">Home</button>
   <button data-settings-pane="analytics">Analytics</button>
   <button data-settings-pane="ui">UI Tweaks</button>
   <button data-settings-pane="extension">Extension</button>
 </div>
 <div class="ldd-section ldd-settings-pane-152 active" data-settings-pane-body="sidebar">
   <div class="ldd-control-card"><b>Main Sidebar</b><span>Show or hide native MyDesigns sidebar pages. LDD Tools always stays available.</span></div>
   <div class="ldd-header-toggle-grid">
    ${lddToggleCard("navHome","Home","Show Home.",o.navHome)}
    ${lddToggleCard("navDesigns","Designs","Show Designs.",o.navDesigns)}
    ${lddToggleCard("navProducts","Products","Show Products.",o.navProducts)}
    ${lddToggleCard("navScoutAI","Scout AI","Show Scout AI.",o.navScoutAI)}
    ${lddToggleCard("navCanvas","Canvas","Show Canvas.",o.navCanvas)}
    ${lddToggleCard("navDreamAI","Dream AI","Show Dream AI.",o.navDreamAI)}
    ${lddToggleCard("navMockups","Mockups","Show Mockups.",o.navMockups)}
    ${lddToggleCard("navStores","Stores","Show Stores.",o.navStores)}
    ${lddToggleCard("navOrders","Orders","Show Orders.",o.navOrders)}
    ${lddToggleCard("navAnalytics","Analytics","Show Analytics.",o.navAnalytics)}
    ${lddToggleCard("navAffiliates","Affiliates","Show Affiliates.",o.navAffiliates)}
    ${lddToggleCard("navMDSettings","MD Settings","Show native MyDesigns Settings.",o.navMDSettings)}
   </div>
 </div>
 <div class="ldd-section ldd-settings-pane-152" data-settings-pane-body="panels">
   <div class="ldd-control-card"><b>Folder Panels</b><span>Hide the folder browser without touching your folders.</span></div>
   <div class="ldd-header-toggle-grid">
    ${lddToggleCard("designFolders","Designs Folders","Show the Folders panel on Designs.",o.designFolders)}
    ${lddToggleCard("productFolders","Products Folders","Show the Folders panel on Products.",o.productFolders)}
   </div>
   <div class="ldd-control-card"><b>Card Action Menus</b><span>Show or hide card and creation controls.</span></div>
   <div class="ldd-header-toggle-grid">
    ${lddToggleCard("designMoreButtons","Designs ••• More","Show the More action button on Design cards.",o.designMoreButtons)}
    ${lddToggleCard("productMoreButtons","Products ••• More","Show the More action button on Product cards.",o.productMoreButtons)}
    ${lddToggleCard("showCreateWithAI","Create with AI","Show or hide the MyDesigns Create with AI button.",o.showCreateWithAI)}
    ${lddToggleCard("showDesignsSearch","Designs Search Bar","Show or hide the Designs search box.",o.showDesignsSearch)}
    ${lddToggleCard("showCompositionGallery","Composition Gallery","Show or hide the composition/template gallery.",o.showCompositionGallery)}
   </div>
 </div>
 <div class="ldd-section ldd-settings-pane-152" data-settings-pane-body="header">
   <div class="ldd-control-card"><b>Top Header</b><span>Show or hide MyDesigns header controls.</span></div>
   <div class="ldd-header-toggle-grid">
    ${lddToggleCard("headerStore","Store Picker","Show store selector.",o.headerStore)}
    ${lddToggleCard("headerSearch","Search","Show design/product search.",o.headerSearch)}
    ${lddToggleCard("headerNotifications","Notifications","Show Notifications.",o.headerNotifications)}
    ${lddToggleCard("headerJobs","Jobs","Show Jobs.",o.headerJobs)}
    ${lddToggleCard("headerIssues","Issue Tracker","Show Issue Tracker.",o.headerIssues)}
    ${lddToggleCard("headerSupport","Support","Show Support.",o.headerSupport)}
    ${lddToggleCard("headerAccount","Account","Show Account menu.",o.headerAccount)}
   </div>
 </div>
 <div class="ldd-section ldd-settings-pane-152" data-settings-pane-body="home">
   <div class="ldd-cosmetic-tip"><b>👁 COSMETIC ONLY</b><span>These controls only change what you see in MyDesigns. They do not delete, disable, or modify designs, products, files, listings, folders, stores, orders, or account data.</span></div>
   <div class="ldd-header-toggle-grid">
    ${lddToggleCard("homeGreeting","Greeting / Business Summary","Show the greeting and business summary at the top of Home.",o.homeGreeting)}
    ${lddToggleCard("homeRevenue","Revenue Graph","Show the Home Revenue · Last 7 days graph.",o.homeRevenue)}
    ${lddToggleCard("homeTopProducts","Top Products","Show the Top Products panel on Home.",o.homeTopProducts)}
    ${lddToggleCard("homeTutorials","Tutorials / Community Content","Show the tutorial and community content area on Home.",o.homeTutorials)}
   </div>
 </div>
 <div class="ldd-section ldd-settings-pane-152" data-settings-pane-body="analytics">
   <div class="ldd-cosmetic-tip"><b>👁 COSMETIC ONLY</b><span>Hide Analytics interface pieces without changing any sales, traffic, store, or account data. Turn a switch back on at any time.</span></div>
   <div class="ldd-header-toggle-grid">
    ${lddToggleCard("analyticsDescription","Page Description","Show the Analytics description under the title.",o.analyticsDescription)}
    ${lddToggleCard("analyticsDateControls","Date Controls","Show 7/30/90 day and Custom date controls.",o.analyticsDateControls)}
    ${lddToggleCard("analyticsTabs","Sales / Traffic Tabs","Show the Sales and Traffic tabs.",o.analyticsTabs)}
    ${lddToggleCard("analyticsMetrics","Metric Cards","Show Revenue, Profit, Fees, Orders, Items Sold, AOV and other metric cards.",o.analyticsMetrics)}
    ${lddToggleCard("analyticsCharts","Graphs","Show Analytics graphs.",o.analyticsCharts)}
    ${lddToggleCard("analyticsTables","Tables / Detail Panels","Show Analytics tables and detail panels.",o.analyticsTables)}
   </div>
 </div>
 <div class="ldd-section ldd-settings-pane-152" data-settings-pane-body="ui">
   <div class="ldd-control-card"><b>Accessibility / UI Tweaks</b><span>Extra MyDesigns usability controls.</span></div>
   <div class="ldd-header-toggle-grid">
    ${lddToggleCard("wideScrollbars","Wide Scrollbars","Make native MyDesigns scrollbars easier to grab.",o.wideScrollbars)}
    ${lddToggleCard("highContrastScrollbars","High Contrast Scrollbars","Increase scrollbar thumb/track contrast.",o.highContrastScrollbars)}
    ${lddToggleCard("visionTitleBox","Multi-Line Listing Title","Show the native MyDesigns Listing Title as a taller multi-line field while preserving MD's original input and behavior.",o.visionTitleBox)}
    <div class="ldd-control-card"><b>Listing Title Rows</b><span>Choose the visible height of the Listing Title field. Default is 3 rows.</span><div class="ldd-title-row-picker" data-title-row-picker>${[1,2,3,4,5].map(n=>`<button type="button" data-title-rows="${n}" class="${Number(o.visionTitleRows||3)===n?'active':''}">${n}</button>`).join("")}</div></div>
   </div>
 </div>
 <div class="ldd-section ldd-settings-pane-152" data-settings-pane-body="extension">
   <div class="ldd-control-card"><b>Master LDD Tools</b><span>Turn all LDD Tools enhancements on or off. Your individual settings stay saved.</span>
    <div class="ldd-enable-disable" data-two-button-setting="lddMasterEnabled"><button type="button" data-setting-value="true" class="${o.lddMasterEnabled!==false?'active':''}">ENABLE</button><button type="button" data-setting-value="false" class="${o.lddMasterEnabled===false?'active':''}">DISABLE</button></div>
   </div>
   <div class="ldd-control-card"><b>LDD Mode</b><span>Switch anytime. The MyDesigns sidebar always stays <b>LDD Tools</b>.</span>
    <div class="ldd-mode-switch">
      <button type="button" data-ldd-mode="lite" class="${o.lddSetupMode==="lite"?"active":""}">Lite</button>
      <button type="button" data-ldd-mode="power" class="${o.lddSetupMode!=="lite"?"active":""}">Power User</button>
    </div>
   </div>
   <div class="ldd-control-card"><b>Toast Notifications</b><span>Show LDD feedback for settings, tools, themes, modes, imports, saves, and errors.</span>
    <div class="ldd-enable-disable" data-two-button-setting="toastNotifications"><button type="button" data-setting-value="true" class="${o.toastNotifications!==false?'active':''}">ON</button><button type="button" data-setting-value="false" class="${o.toastNotifications===false?'active':''}">OFF</button></div>
    <button type="button" id="ldd-test-toast" class="ldd-page-secondary">TEST TOAST</button>
   </div>
   <div class="ldd-control-card"><b>Extension</b><span>LDD Tools 1.8.9 • MyDesigns /app only</span></div>
   <button type="button" class="ldd-page-secondary" data-tab="about">About</button>
   <button id="ldd-page-reset-settings" class="ldd-page-secondary">Reset LDD Settings</button>
 </div>`;
}
function lddRenderExtraFeaturesPage(o){
 return `<div class="ldd-page ldd-extra-features-page">
  <div class="ldd-page-head"><div><h1>✦ Extra Features</h1><p>Optional add-ons that extend LDD Tools beyond MyDesigns.</p></div></div>
  <div class="ldd-section">
   <div class="ldd-control-card"><div><b>ChatGPT Prompt Queue</b><span>Queue prompts in ChatGPT and run them one at a time automatically. Off by default.</span></div></div>
   <label class="ldd-hotkeys-master-110"><span><b>Enable ChatGPT Prompt Queue</b><small>When off, no Prompt Queue UI is injected into ChatGPT.</small></span><input type="checkbox" data-setting="autoPromptQueueEnabled" ${o.autoPromptQueueEnabled===true?'checked':''}></label>
   <div class="ldd-control-card"><b>Smart Queue</b><span>Detects numbered prompts, Prompt 1:, #1, separators, blank blocks, and common Create/Generate/Design prompt starts.</span></div>
   <div class="ldd-control-card"><b>Queue Controls</b><span>Start, pause/resume, skip, stop, adjustable delay, live progress, and completed/failed tracking.</span></div>
   <button type="button" id="ldd-open-prompt-queue" class="ldd-page-secondary" ${o.autoPromptQueueEnabled!==true?'disabled':''}>Open ChatGPT</button>
  </div>
 </div>`;
}
function lddRenderScoutPage(o){
 return `<div class="ldd-page ldd-scout-settings-page">
  <div class="ldd-page-head"><div><h1>Scout AI Style Creator &amp; Autofiller</h1><p>Create, organize and autofill reusable Scout AI styles directly from LDD Tools.</p></div></div>
  <div class="ldd-section">
   <div class="ldd-scout-launch-tip">
    <h2>OPEN SCOUT AI, THEN CLICK THE WHITE “MD SCOUT AI STYLE LIBRARY &amp; AUTO FILLER” BUTTON</h2>
    <div class="ldd-scout-button-demo" aria-label="MD Scout AI Style Library & Auto Filler">MD Scout AI Style Library &amp; Auto Filler</div>
   </div>
   <div class="ldd-feature-info"><h3>What this does</h3><p>Gives Scout AI a reusable style library with 664 built-in styles, categories, import/export, Auto Fill, Create Style With AI, and Dragon Pong. When enabled, open Scout AI and use the white button shown above to launch it.</p></div>
   <div class="ldd-enable-disable" data-two-button-setting="scoutAIEnabled"><button type="button" data-setting-value="true" class="${o.scoutAIEnabled!==false?'active':''}">ENABLE</button><button type="button" data-setting-value="false" class="${o.scoutAIEnabled===false?'active':''}">DISABLE</button></div>
  </div>
 </div>`;
}


function lddRenderAboutPage(){
 return `<div class="ldd-page-title"><h1>About LDD Tools</h1><p>A year of ideas, rebuilds, workflow experiments, and tools made for creators.</p></div>
 <div class="ldd-section ldd-about-page">
  <div class="ldd-control-card ldd-about-story"><h2>Why I Built This</h2><span>I genuinely think <b>MyDesigns is an amazing platform</b>. It has become a huge part of my workflow and gives creators an incredible amount of power in one place.</span><span><b>LDD Tools started about a year ago.</b> It began as a handful of little tools and tweaks I built for myself—things that could save a few clicks, speed up repetitive jobs, or make the way I personally use MyDesigns a little smoother.</span><span>Since then, I've <b>rebuilt this thing more times than I care to admit.</b> 😂 Features have been added, removed, completely rewritten, broken, fixed, rebuilt again, and occasionally turned into something totally different from what I originally planned.</span><span>But the idea behind it has stayed the same: <b>make creating easier and save time.</b></span><span>Eventually I realized these tools could help other MyDesigns users too—especially creators working with hundreds or thousands of designs, products, uploads, and repetitive tasks.</span><span>LDD Tools isn't meant to replace MyDesigns or change what makes it great. It's a collection of <b>optional power-user tools built on top of a platform I already love</b>.</span><span>If LDD Tools saves another creator a bunch of clicks, makes a huge upload session less painful, or simply gives them more time to actually create, then all those rebuilds were worth it.</span></div>
  <div class="ldd-control-card"><h2>Use at Your Own Risk</h2><span>LDD Tools changes and automates parts of the MyDesigns interface. MyDesigns can change without notice, so a feature may stop working, behave unexpectedly, or require an update. Save important work before using automation or aggressive performance features.</span></div>
  <div class="ldd-control-card"><h2>Safety &amp; TinyMD</h2><span>LDD Tools is not designed to damage your computer or intentionally delete your designs, products, listings, files, or MyDesigns data. TinyMD and other aggressive performance options may intentionally reduce or disable nonessential interface behavior for speed.</span></div>
  <div class="ldd-control-card"><h2>Disclaimer &amp; Liability</h2><span>LDD Tools is provided as-is without guarantees of compatibility or uninterrupted operation. Lavender Dragon Design and Andrea are not liable for lost work, interrupted workflows, data loss, account issues, site changes, or other damages arising from use of the extension. You remain responsible for reviewing actions before publishing or making permanent changes.</span></div>
  <div class="ldd-control-card"><h2>Independent Tool</h2><span>LDD Tools is an independent utility and is not affiliated with, endorsed by, or sponsored by MyDesigns.</span></div>
  <div class="ldd-control-card ldd-support-card"><h2>Support &amp; More Tools</h2><b>Made with ❤️ by Andrea</b><span><a href="https://www.etsy.com/shop/LavenderDragonDesign" target="_blank" rel="noopener noreferrer">Etsy Shop</a> · <a href="https://buymeacoffee.com/lavenderdragondesign" target="_blank" rel="noopener noreferrer">Buy Me a Coffee</a> · <a href="https://lddtools.lol" target="_blank" rel="noopener noreferrer">More Tools — LDDTools.lol</a></span></div>
 </div>`;
}


function lddPageBody(tab,o){
 if(tab==="fonts")return lddRenderFontsPage(o);
 if(tab==="workflow")return lddRenderWorkflowPage(o);
 if(tab==="theme")return lddRenderThemePage110(o);
 if(tab==="hotkeys")return lddRenderHotkeysPage110(o);
 if(tab==="scout")return lddRenderScoutPage(o);
 if(tab==="extras")return lddRenderExtraFeaturesPage(o);
 if(tab==="performance")return lddRenderPerformancePage(o);
 if(tab==="tinymd")return lddRenderTinyMDPage(o);
 if(tab==="settings")return lddRenderSettingsPage(o);
 if(tab==="about"||tab==="disclaimer")return lddRenderAboutPage(o);
 return lddRenderDashboard(o);
}

function lddConfirmBox({title,message,confirmText="Continue",danger=false}){
 return new Promise(resolve=>{
   document.getElementById("ldd-confirm-overlay")?.remove();
   const ov=document.createElement("div");
   ov.id="ldd-confirm-overlay";
   ov.innerHTML=`<div class="ldd-confirm-box">
     <div class="ldd-confirm-title">${title}</div>
     <div class="ldd-confirm-message">${message}</div>
     <div class="ldd-confirm-actions">
       <button type="button" data-no>Cancel</button>
       <button type="button" data-yes class="${danger?"danger":"primary"}">${confirmText}</button>
     </div>
   </div>`;
   document.body.appendChild(ov);
   const done=v=>{
     if(v) document._lddDontAskMode=!!ov.querySelector("#ldd-confirm-dontask")?.checked;
     ov.remove();resolve(v)
   };
   ov.querySelector("[data-no]").onclick=()=>done(false);
   ov.querySelector("[data-yes]").onclick=()=>done(true);
   ov.onclick=e=>{if(e.target===ov)done(false)};
   const esc=e=>{if(e.key==="Escape"){document.removeEventListener("keydown",esc);done(false)}};
   document.addEventListener("keydown",esc,{once:true});
 });
}

const LDD_MODE_PRESETS={
 standard:{lddSetupComplete:true,lddSetupMode:"standard",dragUpload:true,carouselRenamer:true,maxLength:true,productPresets:true,credits:true,hoverPreview:true,perfEnabled:false},
 power:{lddSetupComplete:true,lddSetupMode:"power",dragUpload:true,carouselRenamer:true,maxLength:true,productPresets:true,credits:true,hoverPreview:true,visionTitleBox:true,highContrastScrollbars:true},
 performance:{lddSetupComplete:true,lddSetupMode:"performance",dragUpload:true,carouselRenamer:true,maxLength:true,productPresets:true,credits:true,hoverPreview:false,perfEnabled:true,perfAnimations:true,perfBlur:true,perfShadows:true,perfLazyImages:true,perfPauseHidden:true,perfReduceObservers:true}
};
function lddApplyMode(mode,done){
 const preset=LDD_MODE_PRESETS[mode]||LDD_MODE_PRESETS.standard;
 lddSafeSet(preset,()=>{lddSafeGet(LDD_DEFAULTS,x=>{try{lddApplyUIEnhancements(x)}catch(_){};done?.()})});
}


function lddEnforceModeUI(o){
  if(!lddAppRoot)return;
  const lite=o.lddSetupMode==="lite";
  lddAppRoot.classList.toggle("ldd-lite-mode",lite);
  lddAppRoot.setAttribute("data-ldd-mode-label",lite?"Lite":"Power User");
  lddAppRoot.querySelectorAll("[data-ldd-mode-display]").forEach(el=>el.textContent=lite?"Lite":"Power User");

  // Lite = Dashboard + Rename & Upload + Settings only.
  lddAppRoot.querySelectorAll("[data-tab]").forEach(el=>{
    const key=(el.dataset.tab||"").toLowerCase();
    const powerOnly=key==="fonts" || key==="performance" || key==="theme";
    if(powerOnly){
      el.dataset.lddPowerOnly="1";
      el.style.setProperty("display",lite?"none":"","important");
    }
  });

  // Backstop for nav markup whose key is missing/changed.
  lddAppRoot.querySelectorAll("button,a,.ldd-nav-item").forEach(el=>{
    const t=(el.textContent||"").trim().toLowerCase();
    if(t==="app font" || t==="performance"){
      el.dataset.lddPowerOnly="1";
      el.style.setProperty("display",lite?"none":"","important");
    }
  });
}

function lddIconTag(size=18){
 let u="";try{u=chrome.runtime.getURL("assets/icons/icon32.png")}catch(_){}
 return u?`<img class="ldd-inline-icon" src="${u}" alt="" width="${size}" height="${size}" onerror="this.style.display='none'">`:"";
}


function lddPerformanceWarning(o){
  if(o?.lddPerformanceDontAskAgain)return Promise.resolve(true);
  return new Promise(resolve=>{
    document.getElementById("ldd-performance-warning-overlay")?.remove();
    const ov=document.createElement("div");
    ov.id="ldd-performance-warning-overlay";
    ov.innerHTML=`<div class="ldd-performance-warning-modal">
      <div class="ldd-performance-warning-title">⚠ Performance Controls</div>
      <div class="ldd-performance-warning-copy">These settings can change how MyDesigns renders, animates, loads cards, shows menus, notifications and background content. Aggressive settings may make parts of MyDesigns look or behave differently.</div>
      <label><input type="checkbox" id="ldd-perf-understand"> <span>I understand</span></label>
      <label><input type="checkbox" id="ldd-perf-dontask"> <span>Don't ask again</span></label>
      <div class="ldd-performance-warning-actions">
        <button type="button" id="ldd-perf-cancel">Cancel</button>
        <button type="button" id="ldd-perf-unlock" disabled>Open Performance</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const understand=ov.querySelector("#ldd-perf-understand");
    const dont=ov.querySelector("#ldd-perf-dontask");
    const unlock=ov.querySelector("#ldd-perf-unlock");
    understand.onchange=()=>unlock.disabled=!understand.checked;
    const done=v=>{ov.remove();resolve(v)};
    ov.querySelector("#ldd-perf-cancel").onclick=()=>done(false);
    unlock.onclick=()=>{
      if(!understand.checked)return;
      if(dont.checked)lddSafeSet({lddPerformanceDontAskAgain:true});
      done(true);
    };
    ov.onclick=e=>{if(e.target===ov)done(false)};
  });
}

function lddBindAppPage(tab,o){
 try{lddEnforceModeUI(o)}catch(_){}

 if(!lddAppRoot)return;
 if(tab==="theme"){
   lddAppRoot.querySelectorAll("[data-theme-preset]").forEach(btn=>btn.onclick=()=>{
     const p=btn.dataset.themePreset;
     const common={themePreset:p,themeEnabled:true,themeTweaker:true,themeBg:"#000000",themePanel:"#090b0d",themeText:"#ffffff",themeMuted:"#9aa4b2",themeBorder:"#29313d",themeHover:"#141a22",themeSelected:"#16241d",themeGlow:true,themeRadius:14,themeUiScale:100};
     const map={
       native:{themePreset:"native",themeEnabled:false,themeTweaker:false,themeGlow:false},
       "neon-rainbow":{...common,themeColor:"#39ff14",themeAccent2:"#00eaff",themeAccent3:"#ff2bd6",themeAccent4:"#9d4dff",themeAccent5:"#ffe600"},
       matrix:{...common,themeColor:"#39ff14",themeAccent2:"#00ff88",themeAccent3:"#b6ff00",themeAccent4:"#00c853",themeAccent5:"#d7ff00"},
       cyberpunk:{...common,themeColor:"#00f5ff",themeAccent2:"#ff2bd6",themeAccent3:"#9d4dff",themeAccent4:"#ffe600",themeAccent5:"#39ff14"},
       "electric-blue":{...common,themeColor:"#2684ff",themeAccent2:"#00eaff",themeAccent3:"#7df9ff",themeAccent4:"#8aa4ff",themeAccent5:"#4dffea"},
       "hot-pink":{...common,themeColor:"#ff2bd6",themeAccent2:"#ff4fa3",themeAccent3:"#c43cff",themeAccent4:"#7c3cff",themeAccent5:"#ff7ad9"},
       "purple-haze":{...common,themeColor:"#9d4dff",themeAccent2:"#7c3cff",themeAccent3:"#c084fc",themeAccent4:"#e879f9",themeAccent5:"#a78bfa"},
       fire:{...common,themeColor:"#ff5a1f",themeAccent2:"#ff1744",themeAccent3:"#ff9f0a",themeAccent4:"#ffe600",themeAccent5:"#ff3d00"},
       ice:{...common,themeColor:"#00eaff",themeAccent2:"#7df9ff",themeAccent3:"#00b8ff",themeAccent4:"#6ee7ff",themeAccent5:"#4dffea"},
       midnight:{...common,themeColor:"#5b7cff",themeAccent2:"#7c3cff",themeAccent3:"#00d9ff",themeAccent4:"#a78bfa",themeAccent5:"#39ffcc"}
     };
     lddSafeSet(map[p]||map["neon-rainbow"],()=>lddSafeGet(LDD_DEFAULTS,x=>{lddApplyTheme110(x);try{lddApplyTheme(x)}catch(_){}globalThis.lddToast110(p==="native"?"Native MyDesigns restored":"Theme applied");lddShowTab("theme")}));
   });
 }
 if(tab==="hotkeys"){
   const saveMap=(map)=>lddSafeSet({hotkeyMap:map},()=>lddShowTab("hotkeys"));
   lddAppRoot.querySelectorAll("[data-hotkey-change]").forEach(btn=>btn.onclick=()=>{
     const id=btn.dataset.hotkeyChange; btn.textContent="Press keys…"; btn.classList.add("listening");
     const capture=e=>{
       e.preventDefault();e.stopPropagation();
       if(["Control","Alt","Shift","Meta"].includes(e.key))return;
       document.removeEventListener("keydown",capture,true);
       const parts=[];if(e.ctrlKey)parts.push("Ctrl");if(e.altKey)parts.push("Alt");if(e.shiftKey)parts.push("Shift");if(e.metaKey)parts.push("Meta");
       const k=e.key.length===1?e.key.toUpperCase():e.key;parts.push(k);
       const combo=parts.join("+");
       lddSafeGet(LDD_DEFAULTS,x=>{const map=Object.assign({},LDD_DEFAULTS.hotkeyMap,x.hotkeyMap||{});
         const clash=Object.entries(map).find(([other,v])=>other!==id&&v&&v.toLowerCase()===combo.toLowerCase());
         if(clash){globalThis.lddToast110(`Shortcut already used by ${clash[0]}`);lddShowTab("hotkeys");return;}
         map[id]=combo;saveMap(map);
       });
     };
     document.addEventListener("keydown",capture,true);
   });
   lddAppRoot.querySelectorAll("[data-hotkey-clear]").forEach(btn=>btn.onclick=()=>lddSafeGet(LDD_DEFAULTS,x=>{const map=Object.assign({},LDD_DEFAULTS.hotkeyMap,x.hotkeyMap||{});map[btn.dataset.hotkeyClear]="";saveMap(map);}));
   lddAppRoot.querySelectorAll("[data-hotkey-hud-show]").forEach(cb=>cb.onchange=()=>lddSafeGet(LDD_DEFAULTS,x=>{const vis=Object.assign({},LDD_DEFAULTS.hotkeyHudVisible,x.hotkeyHudVisible||{});vis[cb.dataset.hotkeyHudShow]=cb.checked;lddSafeSet({hotkeyHudVisible:vis},()=>{document.getElementById('ldd-hotkey-hud-113')?.remove();lddHotkeyHud113();});}));
 }
 if(tab==="design"){
   lddAppRoot.querySelectorAll("[data-preview-size]").forEach(btn=>btn.onclick=()=>lddSafeSet({hoverPreviewSize:btn.dataset.previewSize},()=>{document.getElementById("ldd-hover-preview")?.remove();globalThis.lddToast110(`Preview size: ${btn.dataset.previewSize}`);lddShowTab("design")}));
   const delay=lddAppRoot.querySelector("#ldd-preview-delay"); if(delay)delay.oninput=()=>{const v=+delay.value;const out=lddAppRoot.querySelector("#ldd-preview-delay-val");if(out)out.textContent=v+"ms";lddSafeSet({hoverPreviewDelay:v})};
   const ed=lddAppRoot.querySelector("#ldd-ci-editor"), nm=lddAppRoot.querySelector("#ldd-ci-name");
   lddAppRoot.querySelectorAll("[data-ci-preset]").forEach(btn=>btn.onclick=()=>{const x=(o.customInstructionPresets||[])[+btn.dataset.ciPreset];if(x&&ed){ed.value=x.text||"";if(nm)nm.value=x.name||""}});
   const applyCI=()=>{const text=ed?.value||"";const cb=document.querySelector('[role="checkbox"][aria-label="Custom instructions"]');if(cb&&cb.getAttribute("aria-checked")!=="true")cb.click();setTimeout(()=>{const ta=[...document.querySelectorAll('textarea[maxlength="100000"]')].find(x=>(x.placeholder||"").includes("Include emojis")||(x.placeholder||"").includes("Write text in German"));if(!ta){globalThis.lddToast110("Custom instructions field not found");return;}const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")?.set;set?set.call(ta,text):(ta.value=text);ta.rows=6;ta.dispatchEvent(new Event("input",{bubbles:true}));ta.dispatchEvent(new Event("change",{bubbles:true}));globalThis.lddToast110("Custom instructions applied")},80)};
   const ap=lddAppRoot.querySelector("#ldd-ci-apply");if(ap)ap.onclick=applyCI;
   const sv=lddAppRoot.querySelector("#ldd-ci-save");if(sv)sv.onclick=()=>{const text=ed?.value.trim()||"",name=nm?.value.trim()||`Preset ${(o.customInstructionPresets||[]).length+1}`;if(!text){globalThis.lddToast110("Enter custom instructions first");return;}const arr=[...(o.customInstructionPresets||[]),{name,text}];lddSafeSet({customInstructionPresets:arr},()=>{globalThis.lddToast110("Instruction preset saved");lddShowTab("design")})};
   const cp=lddAppRoot.querySelector("#ldd-ci-copy");if(cp)cp.onclick=async()=>{const text=ed?.value||"";try{await navigator.clipboard.writeText(text);const arr=[text,...(o.customInstructionClipboard||[]).filter(x=>x!==text)].slice(0,10);lddSafeSet({customInstructionClipboard:arr});globalThis.lddToast110("Instructions copied")}catch(_){globalThis.lddToast110("Clipboard unavailable")}};
 }
 if(tab==="settings"){
   const liteMode=o.lddSetupMode==="lite";
   lddAppRoot.classList.toggle("ldd-lite-mode",liteMode);
   lddAppRoot.querySelectorAll("[data-power-only], [data-settings-tab='panels'], [data-settings-tab='top'], [data-settings-tab='ui']").forEach(el=>{
     if(liteMode) el.setAttribute("data-ldd-hidden-power","1"); else el.removeAttribute("data-ldd-hidden-power");
   });
   lddAppRoot.querySelectorAll("[data-ldd-mode]").forEach(btn=>btn.onclick=async()=>{
     const mode=btn.dataset.lddMode;
     if(mode===o.lddSetupMode)return;
     const name=mode==="lite"?"Lite":"Power User";
     let ok=true;
     if(!o.lddModeSwitchDontAskAgain){
       ok=await lddConfirmBox({
         title:`Switch to ${name}?`,
         message:(mode==="lite"
           ?"Lite hides Power User tools and turns off advanced features. Your saved settings are not deleted."
           :"Power User exposes advanced tools and performance controls. Some options can change how MyDesigns behaves.")
           + `<label class="ldd-confirm-dontask"><input type="checkbox" id="ldd-confirm-dontask"> Don't ask again</label>`,
         confirmText:`Switch to ${name}`,
         danger:mode==="power"
       });
       if(ok && document._lddDontAskMode) lddSafeSet({lddModeSwitchDontAskAgain:true});
     }
     if(!ok)return;
     lddApplyMode(mode,()=>{lddSafeGet(LDD_DEFAULTS,x=>{
       try{lddEnforceModeUI(x)}catch(_){}
       try{lddRenderAppPage(x);lddShowTab("settings")}catch(err){console.error("LDD mode refresh failed",err)}
     })});
   });
   const tabs=lddAppRoot.querySelector("#ldd-settings-tabs-152");
   const panes=[...lddAppRoot.querySelectorAll(".ldd-settings-pane-152")];
   const activateSettingsPane=id=>{
     tabs?.querySelectorAll("button[data-settings-pane]").forEach(btn=>{
       btn.classList.toggle("active",btn.dataset.settingsPane===id);
     });
     panes.forEach(pane=>{
       const active=pane.dataset.settingsPaneBody===id;
       pane.classList.toggle("active",active);
       pane.hidden=!active;
       pane.style.setProperty("display",active?"block":"none","important");
     });
   };
   tabs?.querySelectorAll("button[data-settings-pane]").forEach(btn=>{
     btn.onclick=e=>{
       e.preventDefault();
       e.stopPropagation();
       activateSettingsPane(btn.dataset.settingsPane);
     };
   });
   activateSettingsPane("sidebar");
 }
 lddAppRoot.querySelectorAll("[data-tab]").forEach(b=>{
   b.onclick=(event)=>{
     try{
       event?.preventDefault?.();
       event?.stopPropagation?.();
       const tab=b.dataset.tab;
       if(!tab)return;
       if(tab!=="performance"){
         lddShowTab(tab);
         return;
       }
       lddSafeGet(LDD_DEFAULTS,(latest)=>{
         Promise.resolve(lddPerformanceWarning(latest)).then(ok=>{
           if(ok)lddShowTab(tab);
         }).catch(err=>{
           console.error("[LDD Navigation] Performance warning failed",err);
           try{lddShowTab(tab)}catch(navErr){console.error("[LDD Navigation]",navErr)}
         });
       });
     }catch(err){
       console.error("[LDD Navigation]",err);
     }
   };
 });
 lddAppRoot.querySelectorAll("input[data-setting]").forEach(el=>{
   el.onchange=()=>{
     const key=el.dataset.setting, value=el.checked;
     lddStorageSet(key,value);
     const nice=(el.closest("label")?.querySelector("b")?.textContent||el.closest(".ldd-control-card")?.querySelector("b")?.textContent||key).trim();
     globalThis.lddToast110(`${nice} ${value?"Enabled":"Disabled"}`);
     if(key==="themeGlow")document.dispatchEvent(new CustomEvent("ldd-neon-command",{detail:{action:"glow",value}}));
     if(key==="themeTweaker"||key==="themeEnabled")setTimeout(()=>lddSafeGet(LDD_DEFAULTS,lddApplyTheme),0);
     if(key==="scoutAIEnabled")setTimeout(()=>lddShowTab("scout"),40);
     if(key==="autoPromptQueueEnabled")setTimeout(()=>lddShowTab("promptqueue"),40);
   };
 });
 lddAppRoot.querySelectorAll("[data-two-button-setting]").forEach(group=>{
   group.querySelectorAll("button[data-setting-value]").forEach(btn=>btn.onclick=()=>{
     const key=group.dataset.twoButtonSetting;
     const value=btn.dataset.settingValue==="true";
     lddStorageSet(key,value);
     const labels={lddMasterEnabled:"LDD Tools",scoutAIEnabled:"Scout AI Style Creator & Autofiller",dragUpload:"Drag & Drop Upload",carouselRenamer:"Carousel Renamer",toastNotifications:"Toast Notifications"};
     if(key!=="toastNotifications" || value) globalThis.lddToast110(`${labels[key]||key} ${value?"Enabled":"Disabled"}`);
     if(key==="scoutAIEnabled"||key==="autoPromptQueueEnabled"||key==="dragUpload"||key==="carouselRenamer")setTimeout(()=>lddShowTab("workflow"),40);
     else if(key==="toastNotifications")setTimeout(()=>lddShowTab("settings"),40);
   });
 });
 lddAppRoot.querySelectorAll("[data-title-row-picker] button[data-title-rows]").forEach(btn=>btn.onclick=()=>{
   const rows=Math.min(5,Math.max(1,Number(btn.dataset.titleRows)||3));
   lddStorageSet("visionTitleRows",rows); cfg.visionTitleRows=rows;
   lddAppRoot.querySelectorAll("[data-title-row-picker] button").forEach(b=>b.classList.toggle("active",b===btn));
   document.querySelectorAll('textarea.ldd-vision-title-area[data-ldd-title-textarea="1"]').forEach(ta=>lddApplyTitleRows(ta,rows));
   globalThis.lddToast110(`Listing Title set to ${rows} row${rows===1?'':'s'}`);
 });
 const lddVersionCompare=(a,b)=>{const A=String(a||'0').replace(/^v/i,'').split('.').map(n=>parseInt(n,10)||0),B=String(b||'0').replace(/^v/i,'').split('.').map(n=>parseInt(n,10)||0);for(let i=0;i<Math.max(A.length,B.length);i++){const d=(A[i]||0)-(B[i]||0);if(d)return d}return 0};
 const lddCheckGithubUpdate=async(statusEl,downloadBtn,notesEl)=>{
   const repo='lavenderdragondesign/LDDEXTENSIONMD';
   if(statusEl)statusEl.textContent='Checking GitHub Releases…';
   const result=await new Promise(resolve=>chrome.runtime.sendMessage({type:'LDD_CHECK_GITHUB_UPDATE',repo},r=>resolve(r||{ok:false,error:chrome.runtime.lastError?.message||'No response'})));
   if(!result.ok){if(statusEl)statusEl.textContent='Update check failed: '+(result.error||'Unknown error');return null}
   const current=chrome.runtime.getManifest().version, latest=String(result.release?.version||'').replace(/^v/i,'');
   if(lddVersionCompare(latest,current)>0){if(statusEl)statusEl.textContent=`🔥 Update available: v${latest} (installed v${current})`;if(notesEl)notesEl.textContent=result.release?.name||'';if(downloadBtn){downloadBtn.hidden=false;downloadBtn.dataset.url=result.release?.assetUrl||'';downloadBtn.dataset.version=latest}globalThis.lddToast110(`LDD Tools v${latest} update found`,true,'success')}
   else {if(statusEl)statusEl.textContent=`✓ You're up to date — v${current}`;if(downloadBtn)downloadBtn.hidden=true}
   return result;
 }; if(settingsCheck)settingsCheck.onclick=()=>lddCheckGithubUpdate(lddAppRoot.querySelector('#ldd-settings-update-status'),null,null);
 const testToast=lddAppRoot.querySelector("#ldd-test-toast"); if(testToast)testToast.onclick=()=>globalThis.lddToast110("LDD Toasts are working ✓",true,"success");
 const pqOpen=lddAppRoot.querySelector("#ldd-open-prompt-queue"); if(pqOpen)pqOpen.onclick=()=>window.open("https://chatgpt.com/","_blank","noopener");
 const scoutOpen=lddAppRoot.querySelector("#ldd-page-open-scout"); if(scoutOpen)scoutOpen.onclick=()=>{
   const candidates=[...document.querySelectorAll("a,button")];
   const target=candidates.find(el=>String(el.textContent||"").trim()==="Scout AI");
   if(target){ target.click(); globalThis.lddToast110("Opening Scout AI"); } else { globalThis.lddToast110("Scout AI link was not found",true); }
 };
 lddAppRoot.querySelectorAll("[data-page-neon]").forEach(b=>b.onclick=()=>lddThemeSave({themeColor:b.dataset.pageNeon,themeEnabled:false,themeTweaker:false}));
 const color=lddAppRoot.querySelector("#ldd-page-color"); if(color)color.oninput=e=>lddThemeSave({themeColor:e.target.value,themeEnabled:false,themeTweaker:false});
 const rad=lddAppRoot.querySelector("#ldd-page-radius"); if(rad)rad.oninput=e=>{lddThemeSave({themeRadius:+e.target.value});const x=lddAppRoot.querySelector("#ldd-page-radius-val");if(x)x.textContent=e.target.value+"px radius"};
 lddAppRoot.querySelectorAll("[data-page-rad]").forEach(b=>b.onclick=()=>{lddThemeSave({themeRadius:+b.dataset.pageRad});lddShowTab("theme")});
 const neonCommand=(action,value)=>document.dispatchEvent(new CustomEvent("ldd-neon-command",{detail:{action,value}}));
 lddAppRoot.querySelectorAll("[data-engine-color]").forEach(b=>b.onclick=()=>neonCommand("color",b.dataset.engineColor));
 lddAppRoot.querySelectorAll("[data-engine-mode]").forEach(b=>b.onclick=()=>neonCommand("mode",b.dataset.engineMode));
 lddAppRoot.querySelectorAll("[data-engine-shape]").forEach(b=>b.onclick=()=>neonCommand("shape",b.dataset.engineShape));
 const tr=lddAppRoot.querySelector("#ldd-page-theme-reset"); if(tr)tr.onclick=()=>{lddThemeSave({themeEnabled:false,themeColor:"#39ff14",themeGlow:false,themeRadius:12,themeCards:false});neonCommand("color","green");neonCommand("mode","black");neonCommand("shape","rounded");neonCommand("glow",true);lddShowTab("theme")};
 const rf=lddAppRoot.querySelector("#ldd-reset-font"); if(rf)rf.onclick=()=>{lddSafeSet({appFont:true,appFontFamily:"MyDesigns Default"});document.getElementById("ldd-app-font-style")?.remove();lddShowTab("fonts")};
 if(tab==="tinymd"){
   const en=lddAppRoot.querySelector("#ldd-enable-tinymd");
   const dis=lddAppRoot.querySelector("#ldd-disable-tinymd");
   if(en)en.onclick=async()=>{if(!(await lddTinyMDConfirm()))return;lddSafeSet(LDD_TINYMD_SETTINGS,()=>lddShowTab("tinymd"));};
   if(dis)dis.onclick=()=>lddSafeSet({perfTinyMD:false},()=>lddShowTab("tinymd"));
 }
 if(tab==="performance"){
   const presets={
    safe:{perfEnabled:true,perfAnimations:true,perfBlur:true,perfShadows:false,perfLightNeon:true,perfCompactFolders:false,perfPauseHidden:true,perfContentVisibility:true,perfLazyImages:true,perfNoSmoothScroll:false,perfDisableHoverPreview:false,perfHideSupportWidgets:false,perfTinyMD:false,perfDeepDebloat:false},
    medium:{perfEnabled:true,perfAnimations:true,perfBlur:true,perfShadows:true,perfLightNeon:true,perfCompactFolders:true,perfPauseHidden:true,perfContentVisibility:true,perfLazyImages:true,perfNoSmoothScroll:true,perfDisableHoverPreview:true,perfHideSupportWidgets:false,perfTinyMD:false,perfDeepDebloat:false,perfTrimCardEffects:true,perfReduceMotionMedia:true},
    extreme:{perfEnabled:true,perfAnimations:true,perfBlur:true,perfShadows:true,perfLightNeon:true,perfCompactFolders:true,perfPauseHidden:true,perfContentVisibility:true,perfLazyImages:true,perfNoSmoothScroll:true,perfDisableHoverPreview:true,perfHideSupportWidgets:true,perfTinyMD:true,perfDeepDebloat:true,perfHideAnnouncements:true,perfReduceMotionMedia:true,perfSuspendHiddenVideos:true,perfTrimCardEffects:true,perfDenseMenus:true,perfFreezeOffscreenMedia:true,perfReduceObservers:true,perfStripDecorations:true,perfCompactModals:true,perfHideTips:true,perfDisableTooltips:false,perfHideToasts:false},
    power:{perfEnabled:true,perfAnimations:true,perfBlur:true,perfShadows:true,perfLightNeon:true,perfCompactFolders:true,perfPauseHidden:true,perfContentVisibility:true,perfLazyImages:true,perfNoSmoothScroll:true,perfDisableHoverPreview:true,perfHideSupportWidgets:true,perfTinyMD:true,perfDeepDebloat:true,perfHideAnnouncements:true,perfReduceMotionMedia:true,perfSuspendHiddenVideos:true,perfTrimCardEffects:true,perfDenseMenus:true,perfDisableTooltips:true,perfHideToasts:true,perfFreezeOffscreenMedia:true,perfReduceObservers:true,perfStripDecorations:true,perfCompactModals:true,perfHideTips:true}
   };
   lddAppRoot.querySelectorAll("[data-perf-preset]").forEach(btn=>btn.onclick=()=>{
    const name=btn.dataset.perfPreset;
    if((name==="extreme"||name==="power")&&!confirm(`${name==="power"?"Power User":"Extreme"} uses aggressive performance settings. Apply it?`))return;
    lddSafeSet(presets[name],()=>lddShowTab("performance"));
   });
   lddWirePerfTips();
 }
 const rn=lddAppRoot.querySelector("#ldd-page-open-renamer"); if(rn)rn.onclick=()=>{if(!lddContextAlive())return;lddOpenRenamer(false)};
 const sbw=lddAppRoot.querySelector("#ldd-scrollbar-width");
 if(sbw){ sbw.oninput=()=>{ const v=Number(sbw.value); lddAppRoot.querySelector("#ldd-scrollbar-width-label").textContent=v+"px"; lddSafeSet({scrollbarWidth:v},()=>lddSafeGet(LDD_DEFAULTS,lddApplyUIEnhancements)); }; }
 const rs=lddAppRoot.querySelector("#ldd-page-reset-settings"); if(rs)rs.onclick=()=>lddSafeSet(LDD_DEFAULTS,()=>lddShowTab("settings"));
}


/* ===== v1.1.0 cohesive Theme + Hotkeys pages ===== */
function lddRenderThemePage110(o){
 const themes=[
  {id:"native",name:"Native MyDesigns",desc:"Original MyDesigns colors",colors:["#3b82f6","#ffffff","#111827"]},
  {id:"neon-rainbow",name:"Neon Rainbow",desc:"Green · cyan · pink · purple · yellow",colors:["#39ff14","#00eaff","#ff2bd6","#9d4dff","#ffe600"]},
  {id:"matrix",name:"Matrix",desc:"Black + electric greens",colors:["#39ff14","#00ff88","#b6ff00","#00c853"]},
  {id:"cyberpunk",name:"Cyberpunk",desc:"Cyan · hot pink · violet",colors:["#00f5ff","#ff2bd6","#9d4dff","#ffe600"]},
  {id:"electric-blue",name:"Electric Blue",desc:"Blue · cyan · ice",colors:["#2684ff","#00eaff","#7df9ff","#8aa4ff"]},
  {id:"hot-pink",name:"Hot Pink",desc:"Pink · magenta · violet",colors:["#ff2bd6","#ff4fa3","#c43cff","#7c3cff"]},
  {id:"purple-haze",name:"Purple Haze",desc:"Purple · violet · lavender",colors:["#9d4dff","#7c3cff","#c084fc","#e879f9"]},
  {id:"fire",name:"Neon Fire",desc:"Orange · red · yellow",colors:["#ff5a1f","#ff1744","#ff9f0a","#ffe600"]},
  {id:"ice",name:"Neon Ice",desc:"Cyan · aqua · cool blue",colors:["#00eaff","#7df9ff","#00b8ff","#6ee7ff"]},
  {id:"midnight",name:"Midnight",desc:"Deep blue · violet · cyan",colors:["#5b7cff","#7c3cff","#00d9ff","#a78bfa"]}
 ];
 const active=o.themeEnabled&&o.themeTweaker?(o.themePreset||"neon-rainbow"):"native";
 return `<div class="ldd-page ldd-theme-page-120"><div class="ldd-page-head"><div><h1>One-Click Themes</h1><p>Click a theme. That's it — it applies instantly and stays after refresh.</p></div></div>
 <div class="ldd-theme-gallery-120">${themes.map(t=>`<button type="button" class="ldd-theme-card-120 ${active===t.id?'active':''}" data-theme-preset="${t.id}"><div class="ldd-theme-swatch-120">${t.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</div><b>${t.name}</b><span>${t.desc}</span>${active===t.id?'<em>ACTIVE</em>':''}</button>`).join('')}</div>
 <div class="ldd-theme-help-120"><b>One click = applied + saved.</b><span>Choose Native MyDesigns anytime to remove every LDD theme override.</span></div></div>`;
}
function lddRenderHotkeysPage110(o){
 const defs=[
  ["upscale","Upscale Image","Upscale image","Alt+1"],
  ["removeBg","Remove Background","Remove background","Alt+2"],
  ["imageMockups","Image Mockups","Image mockups","Alt+3"],
  ["videoMockups","Video Mockups","Video mockups","Alt+4"],
  ["canvas","Canvas","Canvas","Alt+5"],
  ["visionAI","Vision AI","Vision AI","Alt+6"],
  ["vectorize","Vectorize Image","Vectorize image","Alt+7"],
  ["colorOverlay","Color Overlay","Color overlay","Alt+8"],
  ["patternOverlay","Pattern Overlay","Pattern overlay","Alt+9"],
  ["imageEffect","Image Effect","Image effect","Alt+0"],
  ["resizeImage","Resize Image","Resize image","Alt+Shift+1"],
  ["edit","Edit","Edit","Alt+Shift+2"],
  ["duplicate","Duplicate","Duplicate","Alt+Shift+3"],
  ["swapFiles","Swap Files","Swap files","Alt+Shift+4"],
  ["deleteFiles","Delete Files","Delete files","Alt+Shift+5"],
  ["bulkTags","Bulk Tags","Bulk tags","Alt+Shift+6"],
  ["bulkSyncPublications","Bulk Sync Publications","Bulk sync publications","Alt+Shift+7"],
  ["checkTrademarks","Check Trademarks","Check trademarks","Alt+Shift+8"],
  ["searchTrademarks","Search Trademarks","Search trademarks","Alt+Shift+9"],
  ["translate","Translate","Translate","Alt+Shift+0"],
  ["deleteAction","Delete","Delete","Ctrl+Alt+1"]
 ];
 const map=Object.assign({},LDD_DEFAULTS.hotkeyMap,o.hotkeyMap||{});
 const hud=Object.assign({},LDD_DEFAULTS.hotkeyHudVisible,o.hotkeyHudVisible||{});
 const esc=x=>String(x||"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[c]));
 return `<div class="ldd-page ldd-hotkeys-page-110"><div class="ldd-page-head"><div><h1>Hotkeys</h1><p>Every supported action is mapped out of the box. Alt+1–0 first, then Alt+Shift combinations. Chrome Ctrl+1–9 tab switching is left untouched.</p></div></div>
 <label class="ldd-hotkeys-master-110"><span><b>Enable LDD Hotkeys</b><small>Ignored while typing in inputs, textareas, selects, and editors.</small></span><input type="checkbox" data-setting="hotkeysEnabled" ${o.hotkeysEnabled!==false?'checked':''}></label>
 <label class="ldd-hotkeys-master-110"><span><b>Hotkey Tips HUD</b><small>HUD is off by default. When enabled, only rows checked below are shown.</small></span><input type="checkbox" data-setting="hotkeyHudEnabled" ${o.hotkeyHudEnabled===true?'checked':''}></label>
 <div class="ldd-hotkey-list-110">${defs.map(([id,name,label,fallback],i)=>{const combo=map[id]??fallback;return `<div class="ldd-hotkey-row-110" data-hotkey-row="${id}" data-action-label="${esc(label)}"><div class="ldd-hotkey-name-110"><b>${String(i+1).padStart(2,'0')} · ${name}</b><span>${label}</span></div><label title="Show ${name} on Hotkey Tips HUD" style="display:flex;align-items:center;gap:6px;white-space:nowrap;font-size:12px"><input type="checkbox" data-hotkey-hud-show="${id}" ${hud[id]===true?'checked':''}> HUD</label><kbd data-hotkey-value="${id}">${esc(combo)||'Not set'}</kbd><button type="button" data-hotkey-change="${id}" title="Press a new keyboard shortcut for ${name}">Change</button><button type="button" class="ldd-hotkey-clear-110" data-hotkey-clear="${id}" title="Disable the shortcut for ${name}">×</button></div>`}).join('')}</div>
 <div class="ldd-hotkey-note-110"><b>HUD defaults:</b> only actions 01–07 are checked. All mapped actions still work whether or not they are shown on the HUD.</div></div>`;
}

function lddApplyTheme110(o){
 const root=document.documentElement;
 const active=!!(o.themeEnabled&&o.themeTweaker);
 let st=document.getElementById('ldd-theme-style-110');
 if(!active){
   st?.remove();
   root.classList.remove('ldd-theme-master-on');
   root.classList.add('ldd-theme-master-off');
   ['--ldd-bg','--ldd-panel','--ldd-text','--ldd-muted','--ldd-accent','--ldd-border','--ldd-hover','--ldd-selected','--ldd-radius','--ldd-ui-scale','--color-base-background','--color-base-bg','--color-base-subtle','--color-base-surface','--color-base-field','--color-base-raised','--color-base-elevated','--color-base-text','--color-base-text-muted','--color-base-border','--color-base-border-strong','--color-base-hover','--color-base-selected','--color-brand-primary','--color-brand-text','--color-brand-bg','--color-focus','--color-warning','--color-error'].forEach(v=>root.style.removeProperty(v));
   window.dispatchEvent(new CustomEvent('ldd-theme-chart',{detail:{active:false}}));
   return;
 }
 const bg=o.themeBg||'#0b0d10', panel=o.themePanel||'#12161c', text=o.themeText||'#f5f7fa', muted=o.themeMuted||'#9aa4b2';
 const accent=o.themeColor||'#39ff14', accent2=o.themeAccent2||accent, accent3=o.themeAccent3||accent, accent4=o.themeAccent4||accent, accent5=o.themeAccent5||accent, border=o.themeBorder||'#29313d', hover=o.themeHover||'#1b2430', selected=o.themeSelected||'#20352a';
 const warning=o.themeWarning||'#ffb020', error=o.themeError||'#ff5d5d', radius=Number(o.themeRadius??12), scale=(Number(o.themeUiScale)||100)/100;
 const rgb=lddHexToRgb(accent);
 const contrast=(hex)=>{
   const h=String(hex||'').replace('#','');
   if(!/^[0-9a-fA-F]{6}$/.test(h))return '#ffffff';
   const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
   const lin=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)};
   const L=.2126*lin(r)+.7152*lin(g)+.0722*lin(b);
   return L>.42?'#000000':'#ffffff';
 };
 const accentText=contrast(accent), accent2Text=contrast(accent2), accent3Text=contrast(accent3), accent4Text=contrast(accent4), accent5Text=contrast(accent5);
 root.classList.remove('ldd-theme-master-off'); root.classList.add('ldd-theme-master-on');
 const vars={'--ldd-bg':bg,'--ldd-panel':panel,'--ldd-text':text,'--ldd-muted':muted,'--ldd-accent':accent,'--ldd-accent-2':accent2,'--ldd-accent-3':accent3,'--ldd-accent-4':accent4,'--ldd-accent-5':accent5,'--ldd-border':border,'--ldd-hover':hover,'--ldd-selected':selected,'--ldd-radius':radius+'px','--ldd-ui-scale':scale,'--ldd-neon':accent,'--ldd-neon-rgb':`${rgb.r},${rgb.g},${rgb.b}`};
 Object.entries(vars).forEach(([k,v])=>root.style.setProperty(k,v));
 window.dispatchEvent(new CustomEvent('ldd-theme-chart',{detail:{active:true,accent:accent,a2:accent2,a3:accent3,a4:accent4,a5:accent5,text:text,muted:muted,border:border,panel:panel}}));
 // Bridge LDD theme values into the semantic color tokens used by current MyDesigns/Tailwind builds.
 // Keep the utility-class CSS below as a fallback for builds that inline/alias these tokens differently.
 const tokenVars={
   '--color-base-background':bg,'--color-base-bg':bg,'--color-base-subtle':bg,
   '--color-base-surface':panel,'--color-base-field':panel,'--color-base-raised':panel,'--color-base-elevated':panel,
   '--color-base-text':text,'--color-base-text-muted':muted,
   '--color-base-border':border,'--color-base-border-strong':border,
   '--color-base-hover':hover,'--color-base-selected':selected,
   '--color-brand-primary':accent,'--color-brand-text':accent,
   '--color-brand-bg':`rgba(${rgb.r},${rgb.g},${rgb.b},.12)`,
   '--color-focus':accent,'--color-warning':warning,'--color-error':error
 };
 Object.entries(tokenVars).forEach(([k,v])=>root.style.setProperty(k,v));
 if(!st){st=document.createElement('style');st.id='ldd-theme-style-110';(document.head||document.documentElement).appendChild(st)}
 st.textContent=`
 html.ldd-theme-master-on,html.ldd-theme-master-on body{background:${bg}!important;color:${text}!important}
 html.ldd-theme-master-on body,html.ldd-theme-master-on #app,html.ldd-theme-master-on #__nuxt{background:${bg}!important;color:${text}!important}
 html.ldd-theme-master-on .bg-base-background,html.ldd-theme-master-on .bg-base-bg,html.ldd-theme-master-on .bg-base-subtle{background-color:${bg}!important}
 html.ldd-theme-master-on .bg-base-surface,html.ldd-theme-master-on .bg-base-field,html.ldd-theme-master-on .bg-base-raised,html.ldd-theme-master-on .bg-base-elevated{background-color:${panel}!important}\n html.ldd-theme-master-on .even\\:bg-base-subtle\\/50:nth-child(even){background-color:color-mix(in srgb, ${bg} 50%, transparent)!important}
 html.ldd-theme-master-on .text-base-text{color:${text}!important}
 html.ldd-theme-master-on .text-base-text-muted{color:${muted}!important}
 html.ldd-theme-master-on .border-base-border{border-color:${border}!important}
 html.ldd-theme-master-on .border-base-border-strong{border-color:${border}!important}
 html.ldd-theme-master-on .hover\\:bg-base-hover:hover,html.ldd-theme-master-on .bg-base-hover{background-color:${hover}!important}
 html.ldd-theme-master-on .bg-base-selected{background-color:${selected}!important}
 html.ldd-theme-master-on .bg-brand-primary{background-color:${accent}!important;color:${accentText}!important}
 html.ldd-theme-master-on .bg-brand-primary *,html.ldd-theme-master-on button.bg-brand-primary *,html.ldd-theme-master-on [class*="bg-brand-primary"]>svg{color:${accentText}!important;fill:currentColor!important}
 html.ldd-theme-master-on button[class*="bg-brand-primary"],html.ldd-theme-master-on [role="button"][class*="bg-brand-primary"]{color:${accentText}!important}
 html.ldd-theme-master-on .bg-brand-bg,html.ldd-theme-master-on .hover\\:bg-brand-bg:hover{background-color:rgba(${rgb.r},${rgb.g},${rgb.b},.12)!important}
 html.ldd-theme-master-on .text-brand-primary,html.ldd-theme-master-on .text-brand-text{color:${accent}!important}
 html.ldd-theme-master-on .border-brand-primary{border-color:${accent}!important}
 html.ldd-theme-master-on a:not([class*="text-base-"]){color:${accent2}!important}
 html.ldd-theme-master-on .text-brand-text{color:${accent2}!important}
 html.ldd-theme-master-on [class*="border-brand-primary"]{border-color:${accent3}!important}
 html.ldd-theme-master-on [aria-selected="true"],html.ldd-theme-master-on [data-state="active"]{--ldd-local-accent:${accent3}}
 html.ldd-theme-master-on [role="tab"][aria-selected="true"]{color:${accent3}!important;border-color:${accent3}!important}
 html.ldd-theme-master-on ::selection{background:${accent4};color:${accent4Text}}
 html.ldd-theme-master-on *{scrollbar-color:${accent4} ${panel}}
 html.ldd-theme-master-on ::-webkit-scrollbar-thumb{background:${accent4}!important;border-radius:999px}
 html.ldd-theme-master-on progress,html.ldd-theme-master-on meter{accent-color:${accent5}}
 html.ldd-theme-master-on input[type="checkbox"],html.ldd-theme-master-on input[type="radio"],html.ldd-theme-master-on input[type="range"]{accent-color:${accent5}}
 html.ldd-theme-master-on input,html.ldd-theme-master-on textarea,html.ldd-theme-master-on select{color:${text};caret-color:${accent}}
 html.ldd-theme-master-on input::placeholder,html.ldd-theme-master-on textarea::placeholder{color:${muted}!important}
 html.ldd-theme-master-on [class*="shadow"],html.ldd-theme-master-on [class*="drop-shadow"]{--tw-shadow-color:${border}}
 html.ldd-theme-master-on .text-warning,html.ldd-theme-master-on .text-status-warning{color:${warning}!important}
 html.ldd-theme-master-on .text-error,html.ldd-theme-master-on .text-status-error{color:${error}!important}
 /* Stable MyDesigns home/logo hook: never depend on Vue data-v attrs or hashed asset filenames. */
 html.ldd-theme-master-on a[href="/app/dashboard"]>img[alt="MyDesigns Logo"]{
   filter:drop-shadow(0 0 5px ${accent}) drop-shadow(0 0 10px ${accent2}) saturate(1.35) brightness(1.12)!important;
   transition:filter .18s ease,transform .18s ease!important;
 }
 html.ldd-theme-master-on a[href="/app/dashboard"]:hover>img[alt="MyDesigns Logo"]{
   filter:drop-shadow(0 0 6px ${accent2}) drop-shadow(0 0 14px ${accent3}) saturate(1.55) brightness(1.22)!important;
   transform:scale(1.045);
 }
 ${o.themeCards?`html.ldd-theme-master-on .rounded-md,html.ldd-theme-master-on .rounded-lg,html.ldd-theme-master-on .rounded-xl{border-radius:${radius}px!important}`:''}
 ${o.themeGlow?`html.ldd-theme-master-on .bg-brand-primary{box-shadow:0 0 14px rgba(${rgb.r},${rgb.g},${rgb.b},.34)!important}`:''}
 `;
}


/* ===== v0.8.6 THEME TOGGLES — authoritative wiring ===== */
function lddWireThemeControls(root,o){
  if(!root)return;
  const bind=(id,key,after)=>{
    const el=root.querySelector("#"+id);
    if(!el)return;
    el.checked=o[key]===true;
    el.onchange=()=>{
      if(!lddContextAlive())return;
      const value=!!el.checked;
      lddSafeSet({[key]:value},()=>{
        if(after)after(value);
      });
    };
  };
  bind("ldd-page-themeTweaker","themeTweaker",on=>{
    if(!on){
      lddHardDisableTheme();
      document.getElementById("ldd-theme-panel")?.remove();
    }else{
      lddSafeGet(LDD_DEFAULTS,n=>lddApplyTheme(n));
    }
  });
  bind("ldd-page-themeEnabled","themeEnabled",on=>{
    if(!on)lddHardDisableTheme();
    else lddSafeGet(LDD_DEFAULTS,n=>lddApplyTheme(n));
  });
  bind("ldd-page-themeCards","themeCards",()=>lddSafeGet(LDD_DEFAULTS,n=>lddApplyTheme(n)));
  bind("ldd-page-themeGlow","themeGlow",()=>lddSafeGet(LDD_DEFAULTS,n=>lddApplyTheme(n)));
}

function lddShowTab(tab="dashboard"){
 lddSafeGet(LDD_DEFAULTS,_mode=>{
   // Standard keeps pages available; advanced controls are contextual rather than hidden wholesale.
 });
 lddSafeGet(LDD_DEFAULTS,o=>{
   if(!lddAppRoot)return;
   lddAppRoot.querySelectorAll(".ldd-app-nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
   const body=lddAppRoot.querySelector(".ldd-app-body");
   body.innerHTML=lddPageBody(tab,o);
   lddBindAppPage(tab,o);
 });  if(tab==="theme")lddSafeGet(LDD_DEFAULTS,o=>lddWireThemeControls(lddAppRoot,o));
}


function lddVisibleNativeNavRow(md){
 const labels=["Home","Designs","Products","Scout AI","Canvas","Dream AI","Mockups","Stores","Orders","Storage"];
 for(const label of labels){
   const candidates=[...md.querySelectorAll("a,button,[role='button']")];
   const row=candidates.find(el=>{
     const t=(el.textContent||"").replace(/\s+/g," ").trim();
     if(t!==label)return false;
     const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
     return r.width>80&&r.height>20&&cs.display!=="none"&&cs.visibility!=="hidden";
   });
   if(row)return row;
 }
 return null;
}
function lddAlignSidebarEntry(){
 const entry=document.getElementById("ldd-sidebar-entry"); if(!entry)return;
 const md=lddFindMdSidebar?.(); if(!md)return;
 const nativeRow=lddVisibleNativeNavRow(md);
 const expanded=!!nativeRow;

 entry.classList.toggle("ldd-md-sidebar-expanded",expanded);
 entry.classList.toggle("ldd-md-sidebar-collapsed",!expanded);

 if(expanded){
   const rr=nativeRow.getBoundingClientRect();
   const cs=getComputedStyle(nativeRow);
   entry.style.setProperty("--ldd-native-row-height",Math.round(rr.height)+"px");
   entry.style.setProperty("--ldd-native-row-padding-left",cs.paddingLeft||"16px");
   entry.style.setProperty("--ldd-native-row-gap",cs.gap&&cs.gap!=="normal"?cs.gap:"12px");
   entry.style.setProperty("--ldd-native-row-radius",cs.borderRadius||"8px");
 }else{
   entry.style.removeProperty("--ldd-native-row-height");
   entry.style.removeProperty("--ldd-native-row-padding-left");
   entry.style.removeProperty("--ldd-native-row-gap");
   entry.style.removeProperty("--ldd-native-row-radius");
 }
}
function lddPositionAppBesideMdSidebar(){
  lddAlignSidebarEntry();
  if(!lddAppRoot)return;
  const sidebar=lddFindMdSidebar();
  let left=0;
  if(sidebar){
    const r=sidebar.getBoundingClientRect();
    left=Math.max(0,Math.round(r.right));
  }
  // Fallback to the visible native rail width, never a guessed 96px overlay.
  if(!left){
    const entry=document.getElementById("ldd-sidebar-entry");
    const rail=entry?.parentElement;
    if(rail)left=Math.max(0,Math.round(rail.getBoundingClientRect().right));
  }
  lddAppRoot.style.left=(left||80)+"px";
}

const LDD_OFFICIAL_UPDATE_REPO="lavenderdragondesign/LDDEXTENSIONMD";
function lddCompareVersions(a,b){
  const A=String(a||"0").replace(/^v/i,"").split(".").map(n=>parseInt(n,10)||0);
  const B=String(b||"0").replace(/^v/i,"").split(".").map(n=>parseInt(n,10)||0);
  for(let i=0;i<Math.max(A.length,B.length);i++){const d=(A[i]||0)-(B[i]||0);if(d)return d}
  return 0;
}
async function lddCheckOfficialUpdate(){
  // Ask the service worker first. If it is asleep/unavailable, fall back to a
  // direct GitHub API request from the MyDesigns content script. This keeps the
  // sidebar update gate reliable instead of silently opening LDD on failure.
  try{
    const viaWorker=await new Promise(resolve=>{
      let settled=false;
      const timer=setTimeout(()=>{if(!settled){settled=true;resolve(null)}},3500);
      try{
        chrome.runtime.sendMessage({type:"LDD_CHECK_GITHUB_UPDATE"},r=>{
          if(settled)return;
          settled=true;clearTimeout(timer);
          if(chrome.runtime.lastError) resolve(null); else resolve(r||null);
        });
      }catch(_){clearTimeout(timer);settled=true;resolve(null)}
    });
    if(viaWorker?.ok && viaWorker.release?.version) return viaWorker;
  }catch(_){}
  try{
    const r=await fetch("https://api.github.com/repos/lavenderdragondesign/LDDEXTENSIONMD/releases/latest",{
      cache:"no-store",headers:{Accept:"application/vnd.github+json"}
    });
    if(!r.ok) throw new Error(`GitHub HTTP ${r.status}`);
    const rel=await r.json();
    const assets=Array.isArray(rel.assets)?rel.assets:[];
    const zip=assets.find(a=>/LDD[-_ ]?Tools.*\.zip$/i.test(a.name||""))||assets.find(a=>/\.zip$/i.test(a.name||""));
    return {ok:true,release:{
      version:String(rel.tag_name||rel.name||"").replace(/^v/i,""),
      name:rel.name||rel.tag_name||"",body:rel.body||"",htmlUrl:rel.html_url||"",
      assetUrl:zip?.browser_download_url||""
    }};
  }catch(e){return {ok:false,error:String(e?.message||e)}}
}
function lddShowUpdateGate(release){
  return new Promise(resolve=>{
    document.getElementById("ldd-update-gate")?.remove();
    const current=chrome.runtime.getManifest().version;
    const latest=String(release?.version||"").replace(/^v/i,"");
    const notes=String(release?.body||release?.name||"").trim();
    const ov=document.createElement("div");
    ov.id="ldd-update-gate";
    ov.innerHTML=`<div class="ldd-update-gate-card" role="dialog" aria-modal="true" aria-label="LDD Tools Update Available">
      <button type="button" class="ldd-update-gate-x" aria-label="Close">×</button>
      <div class="ldd-update-gate-kicker">LDD TOOLS UPDATE</div>
      <h2>🔥 Update Available — v${latest}</h2>
      <p class="ldd-update-gate-version">Installed <b>v${current}</b> &nbsp;→&nbsp; Latest <b>v${latest}</b></p>
      ${notes?`<div class="ldd-update-gate-notes"><b>What’s new</b><p>${notes.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])).replace(/\n/g,"<br>")}</p></div>`:""}
      <div class="ldd-update-gate-steps"><h3>How to update</h3><ol>
        <li>Click <b>Download Update</b> below.</li>
        <li>Close MyDesigns / LDD Tools.</li>
        <li>Open the downloaded ZIP and extract <b>all files and folders</b> into your existing LDD Tools extension folder.</li>
        <li>When Windows asks, choose <b>Replace the files in the destination</b> / overwrite the existing files.</li>
        <li>Open <b>chrome://extensions</b>, find LDD Tools, and click <b>Reload</b>.</li>
        <li>Refresh MyDesigns.</li>
      </ol></div>
      <div class="ldd-update-gate-warning"><b>Do not remove LDD Tools from Chrome and do not extract into a different folder.</b> Overwrite the files in the same extension folder so Chrome keeps loading the same unpacked extension.</div>
      <p class="ldd-update-gate-storage">Your LDD settings are stored by Chrome and should remain intact when the extension files are overwritten.</p>
      <div class="ldd-update-gate-actions"><button type="button" data-download>⬇ DOWNLOAD UPDATE</button><button type="button" data-open>OPEN LDD TOOLS ANYWAY</button></div>
    </div>`;
    document.body.appendChild(ov);
    const finish=open=>{ov.remove();resolve(open)};
    ov.querySelector("[data-open]").onclick=()=>finish(true);
    ov.querySelector(".ldd-update-gate-x").onclick=()=>finish(true);
    ov.addEventListener("click",e=>{if(e.target===ov)finish(true)});
    const downloadBtn=ov.querySelector("[data-download]");
    downloadBtn.onclick=()=>{
      const url=release?.assetUrl;
      if(!url){
        downloadBtn.textContent="DOWNLOAD UNAVAILABLE";
        downloadBtn.disabled=true;
        return;
      }
      downloadBtn.disabled=true;
      downloadBtn.textContent="DOWNLOADING…";
      chrome.runtime.sendMessage({type:"LDD_DOWNLOAD_GITHUB_UPDATE",url,version:latest},r=>{
        if(r?.ok){
          downloadBtn.textContent="✓ DOWNLOADED";
          const steps=ov.querySelector(".ldd-update-gate-steps");
          steps?.classList.add("ldd-download-ready");
          steps?.scrollIntoView({behavior:"smooth",block:"nearest"});
        }else{
          downloadBtn.disabled=false;
          downloadBtn.textContent="↻ TRY DOWNLOAD AGAIN";
          const warning=ov.querySelector(".ldd-update-gate-warning");
          if(warning) warning.insertAdjacentHTML("beforebegin",`<div class="ldd-update-gate-error">Download failed: ${String(r?.error||"Unknown error").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}</div>`);
        }
      });
    };
  });
}
async function lddOpenAppPageWithUpdateGate(){
  // Only gate the normal MyDesigns sidebar launch. If GitHub is unavailable,
  // never block LDD Tools from opening.
  const result=await lddCheckOfficialUpdate();
  const current=chrome.runtime.getManifest().version;
  const latest=String(result?.release?.version||"").replace(/^v/i,"");
  if(result?.ok && latest && lddCompareVersions(latest,current)>0){
    const open=await lddShowUpdateGate(result.release);
    if(!open)return;
  }
  lddOpenAppPage();
}

function lddOpenAppPage(){
  lddSafeGet(LDD_DEFAULTS,function(opts){
    if(opts.lddMasterEnabled===false){globalThis.lddToast110("LDD Tools is disabled",true);return;}
    try{ lddRenderAppPage(opts); }
    catch(err){ console.error("LDD Tools render failed",err); }
  });
}

function lddRenderAppPage(opts){
  const o=opts||LDD_DEFAULTS;
  lddAppOpen=true;
  document.getElementById("ldd-app-page")?.remove();
  lddAppRoot=document.createElement("div");
  lddAppRoot.id="ldd-app-page";
  lddAppRoot.innerHTML=`
 <aside class="ldd-app-nav">
   <div class="ldd-app-brand"><span>${lddIconTag(28)}</span><div><b>LDD Tools</b><small>${(o.lddSetupMode||"standard").replace(/^./,c=>c.toUpperCase())} mode</small></div></div>
   <button data-tab="dashboard" class="active">⌂ Home</button>
   <button data-tab="workflow">${lddIconTag()} Tools</button>
   <button data-tab="fonts">Aa Fonts</button>
   <button data-tab="theme">◈ Theme</button>
   <button data-tab="performance">⚡ Performance</button>
   <button data-tab="hotkeys">⌨ Hotkeys</button>
   <button data-tab="settings">⚙ Settings</button>
   <button data-tab="about">ⓘ About</button>
 </aside>
 <button type="button" id="ldd-app-close" class="ldd-app-close" title="Close LDD Tools" aria-label="Close LDD Tools">×</button>
 <main class="ldd-app-body"></main>`;

document.body.appendChild(lddAppRoot);
 lddPositionAppBesideMdSidebar();
 requestAnimationFrame(lddPositionAppBesideMdSidebar);
 // Bind the permanent left navigation immediately. Page-specific bind errors must
 // never make the main LDD pages unclickable.
 lddAppRoot.querySelectorAll(".ldd-app-nav button[data-tab]").forEach(btn=>{
   btn.onclick=async e=>{
     e.preventDefault();
     e.stopPropagation();
     const tab=btn.dataset.tab||"dashboard";
     if(tab==="performance"){
       const latest=await new Promise(r=>lddSafeGet(LDD_DEFAULTS,r));
       const ok=await lddPerformanceWarning(latest);
       if(!ok)return;
     }
     lddShowTab(tab);
   };
 });
 lddShowTab("dashboard");
 const closeBtn=lddAppRoot.querySelector("#ldd-app-close"); if(closeBtn)closeBtn.onclick=lddCloseAppPage;
 const suggestBtn=lddAppRoot.querySelector("#ldd-suggest-feature"); if(suggestBtn)suggestBtn.onclick=lddOpenSuggestionCard;
 const entry=document.getElementById("ldd-sidebar-entry");
 entry?.classList.add("ldd-active");

}

function lddCloseAppPage(){
 if(!lddAppRoot)return;
 lddAppRoot.remove();lddAppRoot=null;lddAppOpen=false;
 if(lddContextAlive())document.getElementById("ldd-sidebar-entry")?.classList.remove("ldd-active");
}
// Any real MD sidebar navigation closes the injected LDD page first.
document.addEventListener("click",e=>{
 const a=e.target.closest("a");
 if(lddAppOpen && a && a.id!=="ldd-sidebar-entry" && a.closest("div") && a.textContent.trim()) lddCloseAppPage();
},true);


/* ===== v0.8.6 Performance / Debloat ===== */
let lddPerfCfg={...LDD_DEFAULTS};
function lddPerfPaused(){return lddPerfCfg.perfEnabled===true&&lddPerfCfg.perfPauseHidden!==false&&document.hidden}
function lddApplyPerformance(o){
 lddPerfCfg={...lddPerfCfg,...o};
 const r=document.documentElement,on=o.perfEnabled===true;
 r.classList.toggle("ldd-perf-on",on);
 r.classList.toggle("ldd-perf-animations",on&&o.perfAnimations===true);
 r.classList.toggle("ldd-perf-blur",on&&o.perfBlur===true);
 r.classList.toggle("ldd-perf-shadows",on&&o.perfShadows===true);
 r.classList.toggle("ldd-perf-light-neon",on&&o.perfLightNeon===true);
 r.classList.toggle("ldd-perf-compact-folders",on&&o.perfCompactFolders===true);
 r.classList.toggle("ldd-perf-content-visibility",on&&o.perfContentVisibility===true);
 r.classList.toggle("ldd-perf-no-smooth",on&&o.perfNoSmoothScroll===true);
 r.classList.toggle("ldd-perf-hide-support",on&&o.perfHideSupportWidgets===true);
 r.classList.toggle("ldd-perf-tinymd",on&&o.perfTinyMD===true);
 r.classList.toggle("ldd-perf-deep",on&&o.perfDeepDebloat===true);
 r.classList.toggle("ldd-perf-hide-announcements",on&&o.perfHideAnnouncements===true);
 r.classList.toggle("ldd-perf-reduce-motion-media",on&&o.perfReduceMotionMedia===true);
 r.classList.toggle("ldd-perf-trim-card-effects",on&&o.perfTrimCardEffects===true);
 r.classList.toggle("ldd-perf-dense-menus",on&&o.perfDenseMenus===true);
 r.classList.toggle("ldd-perf-no-tooltips",on&&o.perfDisableTooltips===true);
 r.classList.toggle("ldd-perf-no-toasts",on&&o.perfHideToasts===true);
 if(on&&o.perfSuspendHiddenVideos===true){
   document.querySelectorAll("video").forEach(v=>{try{if(document.hidden||!v.matches(":hover"))v.pause()}catch(_){}});
 }
 r.classList.toggle("ldd-perf-strip-decor",on&&o.perfStripDecorations===true);
 r.classList.toggle("ldd-perf-compact-modals",on&&o.perfCompactModals===true);
 r.classList.toggle("ldd-perf-hide-tips",on&&o.perfHideTips===true);
 if(on&&o.perfFreezeOffscreenMedia===true){
   document.querySelectorAll("video").forEach(v=>{try{if(!v.matches(":hover"))v.pause()}catch(_){}});
   document.querySelectorAll("img").forEach(img=>{if(!img.closest("#ldd-app-page")){img.loading="lazy";img.decoding="async"}});
 }
 if(on&&o.perfLazyImages===true)document.querySelectorAll('[data-testid="design-card"] img,[data-testid="product-card"] img').forEach(img=>{img.loading="lazy";img.decoding="async"});
 if(on&&o.perfDisableHoverPreview===true)document.getElementById("ldd-hover-preview")?.remove();
}
function lddSyncPerformance(){lddSafeGet(LDD_DEFAULTS,lddApplyPerformance)}
lddSyncPerformance();
document.addEventListener("visibilitychange",()=>{if(!document.hidden){lddSyncPerformance();setTimeout(()=>{try{lddMountSidebarEntry();lddApplyHeaderNow();lddApplyNavAndFolders();lddProtectOwnGeometry()}catch(_){}},80)}});
lddSafeOnChanged((c,a)=>{if(a==="local"&&["perfEnabled","perfAnimations","perfBlur","perfShadows","perfLightNeon","perfCompactFolders","perfPauseHidden","perfContentVisibility","perfLazyImages","perfNoSmoothScroll","perfHideSupportWidgets","perfDisableHoverPreview","perfTinyMD","perfFreezeOffscreenMedia","perfReduceObservers","perfStripDecorations","perfCompactModals","perfHideTips","perfDeepDebloat","perfHideToasts","perfHideAnnouncements","perfReduceMotionMedia","perfSuspendHiddenVideos","perfTrimCardEffects","perfDenseMenus","perfDisableTooltips"].some(k=>c[k]))lddSyncPerformance()});

const lddSidebarObserver=new MutationObserver(()=>{if(!lddPerfPaused())lddMountSidebarEntry()});
lddSidebarObserver.observe(document.documentElement,{childList:true,subtree:true});
const lddSidebarTimer=setInterval(()=>{if(!lddPerfPaused() && !(lddPerfCfg.perfEnabled&&lddPerfCfg.perfReduceObservers&&document.hidden))lddMountSidebarEntry()},2500);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>lddMountSidebarEntry(),{once:true});
else lddMountSidebarEntry();

// v0.8.6 startup verification/retry
window.addEventListener("load",()=>{
  setTimeout(lddMountSidebarEntry,100);
  setTimeout(lddMountSidebarEntry,750);
  setTimeout(lddMountSidebarEntry,2000);
  console.info("[LDD Tools] v0.8.6 loaded", {
    sidebar: !!document.getElementById("ldd-sidebar-entry"),
    theme: typeof lddMountThemeUI==="function",
    fonts: typeof lddMountFontUI==="function",
    renamer: typeof lddOpenRenamer==="function"
  });
},{once:true});

function lddRemoveLegacyFloatingLaunchers(){
  [
    "#ldd-theme-fab",
    "#ldd-font-fab",
    "#ldd-renamer-fab",
    "#ldd-launcher-rail"
  ].forEach(sel=>document.querySelectorAll(sel).forEach(el=>el.remove()));
}
lddRemoveLegacyFloatingLaunchers();
const lddLegacyFabKiller=new MutationObserver(()=>{if(!lddPerfPaused())lddRemoveLegacyFloatingLaunchers()});
lddLegacyFabKiller.observe(document.documentElement,{childList:true,subtree:true});

function lddThemeOwnedUI(){
  [
    "#ldd-app-page","#ldd-font-panel","#ldd-theme-panel","#ldd-renamer-modal",
    "#ldd-renamer-backdrop","#ldd-drop-overlay","#ldd-product-presets",
    "#ldd-hover-preview"
  ].forEach(sel=>document.querySelectorAll(sel).forEach(el=>el.classList.add("ldd-themed-ui")));
}
const lddOwnedThemeObserver=new MutationObserver(()=>{if(!lddPerfPaused())lddThemeOwnedUI()});
lddOwnedThemeObserver.observe(document.documentElement,{childList:true,subtree:true});
lddThemeOwnedUI();

/* ===== v0.8.6 exact LDD geometry protection ===== */
function lddProtectOwnGeometry(){
  // Kill the REAL old rename FAB id.
  document.querySelectorAll("#ldd-rename-fab,#ldd-theme-fab,#ldd-font-fab,#ldd-launcher-rail")
    .forEach(el=>el.remove());

  const ren=document.getElementById("ldd-carousel-renamer");
  if(ren){
    ren.style.setProperty("border-radius","18px","important");
    ren.style.setProperty("clip-path","none","important");
    ren.querySelectorAll(".ldd-r-head,.ldd-r-image-wrap,.ldd-r-fields,.ldd-r-options,.ldd-r-live,.ldd-r-actions,#ldd-r-status")
      .forEach(el=>{
        el.style.setProperty("clip-path","none","important");
        if(el.classList.contains("ldd-r-image-wrap") || el.classList.contains("ldd-r-live"))
          el.style.setProperty("border-radius","10px","important");
        else
          el.style.setProperty("border-radius","0px","important");
      });
    ren.querySelectorAll("input,select,.ldd-secondary,.ldd-primary").forEach(el=>{
      el.style.setProperty("border-radius","8px","important");
      el.style.setProperty("clip-path","none","important");
    });
    ren.querySelectorAll("#ldd-r-prev,#ldd-r-next").forEach(el=>{
      el.style.setProperty("border-radius","50%","important");
    });
    const img=ren.querySelector("#ldd-r-img");
    if(img){img.style.setProperty("border-radius","8px","important");img.style.setProperty("clip-path","none","important");}
  }

  ["#ldd-app-page","#ldd-font-panel","#ldd-theme-panel","#ldd-product-presets","#ldd-hover-preview"].forEach(sel=>{
    document.querySelectorAll(sel).forEach(root=>{
      root.style.setProperty("border-radius","12px","important");
      root.style.setProperty("clip-path","none","important");
      root.querySelectorAll("*").forEach(el=>el.style.setProperty("clip-path","none","important"));
    });
  });
}
lddProtectOwnGeometry();
const lddGeometryGuard=new MutationObserver(()=>{if(!lddPerfPaused())lddProtectOwnGeometry()});
lddGeometryGuard.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});

/* ===== v1.5.3 Home + Analytics cosmetic visibility ===== */
function lddDisplay(el,show){if(!el)return;show?el.style.removeProperty("display"):el.style.setProperty("display","none","important")}
function lddClosestCardByText(text){return [...document.querySelectorAll("div")].find(x=>x.children.length<8&&(x.textContent||"").trim()===text)?.closest('.bg-base-surface.border-base-border')||null}
function lddApplyPageVisibility(o){
 const path=location.pathname;
 if(/\/app\/?$|\/app\/dashboard/.test(path)){
  const greeting=[...document.querySelectorAll('h1')].find(x=>(x.textContent||'').includes("business is doing")); lddDisplay(greeting?.parentElement,o.homeGreeting!==false);
  lddDisplay(lddClosestCardByText('Revenue · Last 7 days'),o.homeRevenue!==false);
  lddDisplay(lddClosestCardByText('Top products'),o.homeTopProducts!==false);
  const pod=[...document.querySelectorAll('li')].find(x=>(x.textContent||'').trim()==='Print on Demand'); lddDisplay(pod?.closest('.bg-base-surface.border-base-border'),o.homeTutorials!==false);
 }
 if(path.includes('/analytics')){
  const title=[...document.querySelectorAll('h1')].find(x=>(x.textContent||'').trim()==='Analytics');
  const head=title?.closest('.pt-6'); if(head){const desc=[...head.querySelectorAll('p')].find(x=>(x.textContent||'').includes('Track sales and traffic'));lddDisplay(desc,o.analyticsDescription!==false);const actions=head.querySelector('#app-page-title-actions');lddDisplay(actions,o.analyticsDateControls!==false)}
  const sales=[...document.querySelectorAll('li')].find(x=>(x.textContent||'').trim()==='Sales'); lddDisplay(sales?.parentElement?.parentElement,o.analyticsTabs!==false);
  const metric= [...document.querySelectorAll('div')].find(x=>(x.textContent||'').trim()==='Revenue')?.closest('.grid'); lddDisplay(metric,o.analyticsMetrics!==false);
  document.querySelectorAll('canvas').forEach(c=>lddDisplay(c.closest('.bg-base-surface.border-base-border')||c.parentElement,o.analyticsCharts!==false));
  document.querySelectorAll('table').forEach(t=>lddDisplay(t.closest('.bg-base-surface.border-base-border')||t.parentElement,o.analyticsTables!==false));
 }
}
function lddApplyPageVisibilityNow(){lddSafeGet(LDD_DEFAULTS,lddApplyPageVisibility)}
let lddPageVisTimer; new MutationObserver(()=>{clearTimeout(lddPageVisTimer);lddPageVisTimer=setTimeout(lddApplyPageVisibilityNow,120)}).observe(document.documentElement,{childList:true,subtree:true});
lddSafeOnChanged((c,a)=>{if(a==='local'&&Object.keys(c).some(k=>k.startsWith('home')||k.startsWith('analytics')))lddApplyPageVisibilityNow()});
setTimeout(lddApplyPageVisibilityNow,250);

/* ===== v0.8.6 MD header show/hide + dark lock ===== */
function lddHeaderHost(el){
  if(!el)return null;
  if(el.matches?.('a[href="/app/issues"]'))return el;
  return el.closest("a")||el.closest(".relative")||el;
}
function lddHeaderVisible(el,show){
  const host=lddHeaderHost(el); if(!host)return;
  show?host.style.removeProperty("display"):host.style.setProperty("display","none","important");
}
function lddSyncHeaderPrefs(o){
  lddHeaderVisible(document.querySelector('[aria-label="Filter by store"] button'),o.headerStore!==false);
  lddHeaderVisible(document.querySelector('button[aria-label="Search designs and products"]'),o.headerSearch!==false);
  lddHeaderVisible(document.querySelector('button[aria-label="Notifications"]'),o.headerNotifications!==false);
  lddHeaderVisible(document.querySelector('button[aria-label="Jobs"]'),o.headerJobs!==false);
  lddHeaderVisible(document.querySelector('a[href="/app/issues"]'),o.headerIssues!==false);
  lddHeaderVisible([...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Support"),o.headerSupport!==false);
  lddHeaderVisible(document.querySelector('button[aria-label="Account menu"]'),o.headerAccount!==false);

  let themeBtn=document.querySelector('button[aria-label="Switch theme"]');
  if(o.themeEnabled===false){
    if(themeBtn){themeBtn.disabled=false;themeBtn.removeAttribute("data-ldd-neon-disabled");themeBtn.style.removeProperty("display");}
    return;
  }
  // If MD is light, its button offers "Switch to dark theme". Click once, then lock it.
  if(themeBtn && /switch to dark theme/i.test(themeBtn.title||"")) themeBtn.click();
  themeBtn=document.querySelector('button[aria-label="Switch theme"]');
  if(themeBtn){
    themeBtn.disabled=true;
    themeBtn.setAttribute("data-ldd-neon-disabled","true");
    themeBtn.style.setProperty("display","none","important");
  }
  document.documentElement.classList.add("dark");
}
function lddApplyHeaderNow(){lddSafeGet(LDD_DEFAULTS,lddSyncHeaderPrefs)}
lddApplyHeaderNow();
let lddHeaderTimer;
new MutationObserver(()=>{clearTimeout(lddHeaderTimer);lddHeaderTimer=setTimeout(lddApplyHeaderNow,100)})
.observe(document.documentElement,{childList:true,subtree:true});
lddSafeOnChanged((c,a)=>{
 if(a==="local"&&["headerStore","headerSearch","headerNotifications","headerJobs","headerIssues","headerSupport","headerAccount","themeEnabled"].some(k=>c[k]))lddApplyHeaderNow();
});

/* ===== v0.8.6 native MD sidebar + folder panel visibility ===== */
const LDD_NAV_PREFS={
  "Home":"navHome","Designs":"navDesigns","Products":"navProducts","Scout AI":"navScoutAI",
  "Canvas":"navCanvas","Dream AI":"navDreamAI","Mockups":"navMockups","Stores":"navStores",
  "Orders":"navOrders","Analytics":"navAnalytics","Affiliates":"navAffiliates","Settings":"navMDSettings"
};
function lddNativeSidebarLinkByLabel(label){
  return [...document.querySelectorAll("a")].find(a=>{
    if(a.id==="ldd-sidebar-entry") return false;
    const texts=[...a.querySelectorAll("div")].map(x=>x.textContent.trim());
    return texts.includes(label);
  })||null;
}
function lddApplyNativeSidebarPrefs(o){
  Object.entries(LDD_NAV_PREFS).forEach(([label,key])=>{
    const a=lddNativeSidebarLinkByLabel(label);
    if(!a)return;
    a.style.setProperty("display",o[key]===false?"none":"","important");
    if(o[key]!==false)a.style.removeProperty("display");
  });
}
function lddFindFoldersAside(){
  return [...document.querySelectorAll("aside")].find(a=>{
    const heading=[...a.querySelectorAll("span")].find(x=>x.textContent.trim()==="Folders");
    return !!heading;
  })||null;
}
function lddApplyFolderPrefs(o){
  const aside=lddFindFoldersAside();
  if(!aside)return;
  const p=location.pathname.toLowerCase();
  let show=true;
  if(p.includes("/design")) show=o.designFolders!==false;
  else if(p.includes("/product")) show=o.productFolders!==false;
  aside.style.setProperty("display",show?"":"none","important");
  if(show)aside.style.removeProperty("display");
}
function lddApplyNavAndFolders(){
  lddSafeGet(LDD_DEFAULTS,o=>{
    lddApplyNativeSidebarPrefs(o);
    lddApplyFolderPrefs(o);
  });
}
lddApplyNavAndFolders();
let lddNavFolderTimer;
new MutationObserver(()=>{
  clearTimeout(lddNavFolderTimer);
  lddNavFolderTimer=setTimeout(lddApplyNavAndFolders,100);
}).observe(document.documentElement,{childList:true,subtree:true});
lddSafeOnChanged((c,a)=>{
  if(a!=="local")return;
  const keys=[...Object.values(LDD_NAV_PREFS),"designFolders","productFolders"];
  if(keys.some(k=>c[k]))lddApplyNavAndFolders();
});

/* ===== v0.8.6 ABSOLUTE LDD SHAPE ISOLATION =====
   MD shape settings may style MyDesigns, NEVER LDD-owned UI. */
function lddStripShapesFromOwnUI(){
  const roots=[
    "#ldd-app-page","#ldd-font-panel","#ldd-theme-panel","#ldd-carousel-renamer",
    "#ldd-product-presets","#ldd-hover-preview","#ldd-drop-overlay"
  ];
  roots.forEach(sel=>document.querySelectorAll(sel).forEach(root=>{
    root.style.setProperty("border-radius","0px","important");
    root.style.setProperty("clip-path","none","important");
    root.querySelectorAll("*").forEach(el=>{
      el.style.setProperty("clip-path","none","important");
      // Controls stay minimally rounded; no pill/circle geometry from MD theme.
      if(el.matches("button,input,select,textarea,.ldd-module-card,.ldd-control-card,.ldd-setting-card,.ldd-stat-row > div"))
        el.style.setProperty("border-radius","6px","important");
      else
        el.style.setProperty("border-radius","0px","important");
    });
    // Intentional tiny UI exceptions only.
    root.querySelectorAll(".ldd-page-neons button,.switch i,.switch i:before,#ldd-r-prev,#ldd-r-next").forEach(el=>{
      el.style.setProperty("border-radius","50%","important");
    });
  }));
}
lddStripShapesFromOwnUI();
let lddShapeSanitizeQueued=false;
const lddAbsoluteShapeGuard=new MutationObserver(()=>{
  if(lddPerfPaused())return;
  if(lddShapeSanitizeQueued)return;
  lddShapeSanitizeQueued=true;
  requestAnimationFrame(()=>{lddShapeSanitizeQueued=false;lddStripShapesFromOwnUI()});
});
lddAbsoluteShapeGuard.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});

/* ===== v0.8.6 upload batch isolation ===== */
let lddPreUploadChecked=new Set();
let lddUploadBatchCards=[];
function lddCardKey(card){
  if(!card)return "";
  return card.getAttribute("data-id")||
         card.getAttribute("data-design-id")||
         card.querySelector("img")?.src||
         card.textContent.trim().slice(0,160);
}
function lddSnapshotCheckedBeforeUpload(){
  lddPreUploadChecked=new Set(
    [...document.querySelectorAll('[data-testid="design-card"]')]
      .filter(c=>c.querySelector('[role="checkbox"][aria-checked="true"]'))
      .map(lddCardKey).filter(Boolean)
  );
  lddUploadBatchCards=[];
}
function lddCollectOnlyNewlyChecked(){
  const checked=[...document.querySelectorAll('[data-testid="design-card"]')]
    .filter(c=>c.querySelector('[role="checkbox"][aria-checked="true"]'));
  lddUploadBatchCards=checked.filter(c=>!lddPreUploadChecked.has(lddCardKey(c)));
  return lddUploadBatchCards;
}



/* ===== v0.8.6 theme OFF means OFF ===== */
function lddHardDisableTheme(){
  document.documentElement.classList.remove("ldd-theme-on","ldd-neon-on","ldd-md-neon","ldd-full-neon");
  document.getElementById("ldd-theme-style")?.remove();
  document.getElementById("ldd-app-theme-style")?.remove();
  document.querySelectorAll("[data-ldd-theme-owned]").forEach(el=>{
    el.style.removeProperty("border-color");
    el.style.removeProperty("box-shadow");
    el.style.removeProperty("text-shadow");
    el.style.removeProperty("background-color");
    el.style.removeProperty("color");
  });
  // Remove classes injected by the merged neon engine if present.
  [...document.documentElement.classList].filter(c=>/^ldd-(?:md-)?neon|^ldd-theme/i.test(c)).forEach(c=>document.documentElement.classList.remove(c));
}
lddSafeOnChanged((c,a)=>{
  if(a==="local" && c.themeEnabled && c.themeEnabled.newValue===false){
    lddHardDisableTheme();
  }
});
lddSafeGet(LDD_DEFAULTS,o=>{if(o.themeEnabled===false)lddHardDisableTheme()});

/* ===== v0.8.6 upload renamer = NEW CARDS, not checked cards ===== */
let lddPreUploadCardKeys=new Set();
let lddPendingUploadBatch=false;

function lddStableCardKey(card){
  if(!card)return "";
  const img=card.querySelector("img");
  return card.getAttribute("data-design-id")||
         card.getAttribute("data-id")||
         img?.getAttribute("src")||
         img?.getAttribute("alt")||
         card.textContent.trim().slice(0,180);
}
function lddSnapshotCardsBeforeUpload(){
  lddPreUploadCardKeys=new Set(
    [...document.querySelectorAll('[data-testid="design-card"]')]
      .map(lddStableCardKey).filter(Boolean)
  );
  lddPendingUploadBatch=true;
  lddUploadBatchCards=[];
}
function lddFindNewUploadCards(){
  const all=[...document.querySelectorAll('[data-testid="design-card"]')];
  return all.filter(c=>{
    const k=lddStableCardKey(c);
    return k && !lddPreUploadCardKeys.has(k);
  });
}
async function lddWaitForUploadedCards(){
  // Upload/render is asynchronous. Wait for the new-card set to stabilize.
  let last=-1, stable=0, best=[];
  for(let i=0;i<50;i++){
    await new Promise(r=>setTimeout(r,200));
    const now=lddFindNewUploadCards();
    if(now.length){
      best=now;
      if(now.length===last) stable++; else stable=0;
      last=now.length;
      if(stable>=4)break;
    }
  }
  lddUploadBatchCards=best;
  lddPendingUploadBatch=false;
  return best;
}

}

document.addEventListener("change",e=>{
  if(e.target?.dataset?.setting==="perfTinyMD" && e.target.checked){
    if(!(typeof lddConfirmTinyMD==="function"?lddConfirmTinyMD:((...a)=>true))()){e.preventDefault();e.stopImmediatePropagation();e.target.checked=false}
  }
/* ===== v0.8.6 CLEAR ALL SELECTED ===== */
function lddClearAllSelectedDesigns(){
  const checked=[...document.querySelectorAll('[data-testid="design-card"] [role="checkbox"][aria-checked="true"]')];
  checked.forEach(cb=>{
    try{cb.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window}))}
    catch(_){try{cb.click()}catch(__){}}
  });
}
function lddFindSelectAllButton(){
  return [...document.querySelectorAll("button[type='submit'],button[type='button']")]
    .find(b=>(b.textContent||"").replace(/\s+/g," ").trim().startsWith("Select all designs"));
}
function lddInjectClearAll(){
  const selectAll=lddFindSelectAllButton();
  if(!selectAll)return;
  const section=selectAll.parentElement;
  if(!section || section.querySelector("#ldd-clear-all-selected"))return;
  const btn=selectAll.cloneNode(true);
  btn.id="ldd-clear-all-selected";
  btn.type="button";
  btn.innerHTML='<span>Clear all selected</span><span class="text-base-text-muted" id="ldd-clear-all-count"></span>';
  btn.onclick=e=>{e.preventDefault();e.stopPropagation();lddClearAllSelectedDesigns();setTimeout(lddUpdateClearAllCount,100)};
  selectAll.insertAdjacentElement("afterend",btn);
  lddUpdateClearAllCount();
}
function lddUpdateClearAllCount(){
  const n=document.querySelectorAll('[data-testid="design-card"] [role="checkbox"][aria-checked="true"]').length;
  const el=document.getElementById("ldd-clear-all-count");
  if(el)el.textContent=String(n);
}
let lddClearAllTimer;
new MutationObserver(()=>{
  clearTimeout(lddClearAllTimer);
  lddClearAllTimer=setTimeout(()=>{lddInjectClearAll();lddUpdateClearAllCount()},80);
}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["aria-checked"]});
setTimeout(lddInjectClearAll,500);

/* ===== v0.8.6 LARGE GOOGLE FONTS CDN CATALOG ===== */
const LDD_GOOGLE_FONTS_META_URL="https://fonts.google.com/metadata/fonts";
async function lddFetchGoogleFontFamilies(){
  try{
    const r=await fetch(LDD_GOOGLE_FONTS_META_URL,{cache:"force-cache"});
    if(!r.ok)throw new Error("HTTP "+r.status);
    let txt=await r.text();
    txt=txt.replace(/^\)\]\}'\s*/,"");
    const data=JSON.parse(txt);
    const raw=data.familyMetadataList||data.familyMetadata||data.fonts||[];
    const names=raw.map(x=>x.family||x.name).filter(Boolean);
    if(names.length<1000)throw new Error("catalog too small");
    return [...new Set(names)].sort((a,b)=>a.localeCompare(b)).slice(0,1900);
  }catch(e){
    
    return null;
  }
}
function lddLoadFontPreviewFamily(family){
  if(!family)return;
  const id="ldd-gfont-"+family.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  if(document.getElementById(id))return;
  const link=document.createElement("link");
  link.id=id; link.rel="stylesheet";
  link.href="https://fonts.googleapis.com/css2?family="+encodeURIComponent(family).replace(/%20/g,"+")+"&display=swap";
  document.head.appendChild(link);
}
function lddIsolateFontPreviewRows(root=document){
  const rows=root.querySelectorAll("[data-ldd-font-family]");
  rows.forEach(row=>{
    const family=row.getAttribute("data-ldd-font-family");
    if(!family)return;
    lddLoadFontPreviewFamily(family);
    row.style.setProperty("font-family",`"${family}", sans-serif`,"important");
    row.querySelectorAll("*").forEach(el=>el.style.setProperty("font-family",`"${family}", sans-serif`,"important"));
  });
}

async function lddUpgradeFontEditorTo1900(){
  const page=document.querySelector("#ldd-app-page");
  if(!page || !(page.textContent||"").includes("Search Google Fonts"))return;
  if(page.dataset.ldd1900Fonts==="loading"||page.dataset.ldd1900Fonts==="done"){lddIsolateFontPreviewRows(page);return}
  page.dataset.ldd1900Fonts="loading";
  let names=window.__LDD_GOOGLE_FONT_FAMILIES_1900||LDD_BUNDLED_FONT_FAMILIES;
  if(!names?.length){page.dataset.ldd1900Fonts="fallback";return}
  window.__LDD_GOOGLE_FONT_FAMILIES_1900=names;
  page.dataset.ldd1900Fonts="done";

  // Find the existing font result list by the current fallback font rows.
  const search=[...page.querySelectorAll("input")].find(x=>(x.placeholder||"").includes("Search Google Fonts"));
  if(!search)return;
  const known=[...page.querySelectorAll("div")].find(el=>{
    const t=(el.textContent||"");
    return t.includes("Roboto")&&t.includes("Open Sans")&&t.includes("Montserrat")&&t.includes("Poppins")&&el.children.length>5;
  });
  if(!known)return;

  const list=[...known.children].find(c=>(c.textContent||"").includes("Roboto")) ? known : known.parentElement;
  if(!list)return;
  const template=[...list.children].find(c=>(c.textContent||"").trim().startsWith("Roboto"));
  if(!template)return;

  const render=(q="")=>{
    const needle=q.trim().toLowerCase();
    const shown=names.filter(f=>!needle||f.toLowerCase().includes(needle));
    list.innerHTML="";
    const frag=document.createDocumentFragment();
    shown.forEach(f=>{
      const row=template.cloneNode(true);
      row.setAttribute("data-ldd-font-family",f);
      // Replace visible font-name text while preserving favorite icon/button.
      const walker=document.createTreeWalker(row,NodeFilter.SHOW_TEXT);
      let node;
      while(node=walker.nextNode()){
        if(node.nodeValue.trim()==="Roboto"){node.nodeValue=f;break}
      }
      row.style.setProperty("font-family",`"${f}", sans-serif`,"important");
      row.addEventListener("mouseenter",()=>lddLoadFontPreviewFamily(f),{once:true});
      row.addEventListener("click",e=>{
        if(e.target.closest("button"))return;
        lddLoadFontPreviewFamily(f);
      });
      frag.appendChild(row);
    });
    list.appendChild(frag);
    // Load only visible first chunk instead of 1900 font files at once.
    [...list.querySelectorAll("[data-ldd-font-family]")].slice(0,20).forEach(r=>lddLoadFontPreviewFamily(r.dataset.lddFontFamily));
    lddIsolateFontPreviewRows(list);
  };
  render("");
  search.addEventListener("input",()=>render(search.value));
}
let lddFontUpgradeTimer;
new MutationObserver(()=>{
  clearTimeout(lddFontUpgradeTimer);
  lddFontUpgradeTimer=setTimeout(lddUpgradeFontEditorTo1900,180);
}).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(lddUpgradeFontEditorTo1900,800);


/* ===== v1.0.2 ACCESSIBILITY + CANVAS + VISION AI ===== */

function lddApplyScrollbarStyle(o){
 let st=document.getElementById("ldd-scrollbar-dynamic-style");
 if(!st){st=document.createElement("style");st.id="ldd-scrollbar-dynamic-style";document.head.appendChild(st)}
 if(o.wideScrollbars===false){st.textContent="";return}
 const w=14;
 const c=getComputedStyle(document.documentElement).getPropertyValue("--ldd-accent-4").trim() || getComputedStyle(document.documentElement).getPropertyValue("--ldd-neon").trim() || "#8b8b93";
 const track=o.highContrastScrollbars===true?"#050607":"#15171c";
 st.textContent=`
html,body{scrollbar-width:auto!important;scrollbar-color:${c} ${track}!important}
html::-webkit-scrollbar,body::-webkit-scrollbar,
.overflow-auto::-webkit-scrollbar,.overflow-y-auto::-webkit-scrollbar,.overflow-x-auto::-webkit-scrollbar,
[class*="overflow-auto"]::-webkit-scrollbar,[class*="overflow-y-auto"]::-webkit-scrollbar,[class*="overflow-x-auto"]::-webkit-scrollbar,
#ldd-app-page *::-webkit-scrollbar{width:${w}px!important;height:${w}px!important}
html::-webkit-scrollbar-track,body::-webkit-scrollbar-track,
.overflow-auto::-webkit-scrollbar-track,.overflow-y-auto::-webkit-scrollbar-track,.overflow-x-auto::-webkit-scrollbar-track,
[class*="overflow-auto"]::-webkit-scrollbar-track,[class*="overflow-y-auto"]::-webkit-scrollbar-track,[class*="overflow-x-auto"]::-webkit-scrollbar-track,
#ldd-app-page *::-webkit-scrollbar-track{background:${track}!important}
html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb,
.overflow-auto::-webkit-scrollbar-thumb,.overflow-y-auto::-webkit-scrollbar-thumb,.overflow-x-auto::-webkit-scrollbar-thumb,
[class*="overflow-auto"]::-webkit-scrollbar-thumb,[class*="overflow-y-auto"]::-webkit-scrollbar-thumb,[class*="overflow-x-auto"]::-webkit-scrollbar-thumb,
#ldd-app-page *::-webkit-scrollbar-thumb{background:${c}!important;border:0!important;border-radius:999px!important}
html::-webkit-scrollbar-corner,body::-webkit-scrollbar-corner,#ldd-app-page *::-webkit-scrollbar-corner{background:${track}!important}`;
}
function lddApplyUIEnhancements(o){
 lddApplyScrollbarStyle(o);
 const r=document.documentElement;
 r.classList.toggle('ldd-wide-scrollbars',o.wideScrollbars!==false);
 r.classList.toggle('ldd-scrollbar-contrast',o.highContrastScrollbars===true);


 if(o.visionTitleBox!==false)lddUpgradeVisionTitle(); else lddRestoreVisionTitles();
}
function lddVisionTitleInputs(){
 return [...document.querySelectorAll('input[placeholder="Title"]')].filter(i=>{
   if(i.closest('#ldd-app-page,#ldd-font-panel,#ldd-renamer-modal'))return false;
   if(i.type && !['text','search'].includes(String(i.type).toLowerCase()))return false;
   return true;
 });
}
function lddDispatchTitleValue(input,value){
 if(!input)return false;
 try{
   const proto=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
   const desc=Object.getOwnPropertyDescriptor(proto,'value');
   if(desc?.set) desc.set.call(input,value); else input.value=value;
   try{input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:null}));}
   catch(_){input.dispatchEvent(new Event('input',{bubbles:true}));}
   input.dispatchEvent(new Event('change',{bubbles:true}));
   return true;
 }catch(err){
   try{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return true;}catch(_){return false;}
 }
}
function lddApplyTitleRows(ta,rows){
 const n=Math.min(5,Math.max(1,Number(rows)||3));
 if(!ta)return;
 ta.rows=n;
 const h={1:36,2:60,3:84,4:108,5:132}[n];
 ta.style.setProperty('height',h+'px','important');
 ta.style.setProperty('min-height',h+'px','important');
 ta.dataset.lddRows=String(n);
}
function lddUpgradeVisionTitle(){
 lddVisionTitleInputs().forEach(input=>{
   let ta=input.nextElementSibling?.matches?.('textarea.ldd-vision-title-area[data-ldd-title-textarea="1"]')?input.nextElementSibling:null;
   if(!ta) ta=input.parentElement?.querySelector('textarea.ldd-vision-title-area[data-ldd-title-textarea="1"]');
   if(!ta){
     ta=document.createElement('textarea');
     ta.className='ldd-vision-title-area text-base-text placeholder:text-base-text-muted relative w-full border bg-transparent outline-hidden text-sm rounded-md border-base-border hover:border-base-border-strong focus:border-brand-primary';
     ta.placeholder='Title';
     ta.setAttribute('data-ldd-title-textarea','1');
     ta.setAttribute('aria-label',input.getAttribute('aria-label')||'Title');
     if(input.maxLength>0)ta.maxLength=input.maxLength;
     ta.value=input.value||'';
     input.insertAdjacentElement('afterend',ta);
     const sync=()=>lddDispatchTitleValue(input,ta.value);
     ta.addEventListener('input',sync);
     ta.addEventListener('change',sync);
     ta.addEventListener('blur',sync);
     input.addEventListener('input',()=>{if(document.activeElement!==ta && ta.value!==input.value)ta.value=input.value||''});
   }
   input.dataset.lddTitleUpgraded='1';
   input.style.setProperty('display','none','important');
   if(document.activeElement!==ta && ta.value!==input.value)ta.value=input.value||'';
   lddApplyTitleRows(ta,cfg.visionTitleRows);
 });
}
function lddRestoreVisionTitles(){
 document.querySelectorAll('textarea.ldd-vision-title-area[data-ldd-title-textarea="1"]').forEach(ta=>{
   const input=ta.previousElementSibling;
   if(input?.matches('input[placeholder="Title"]')){
     lddDispatchTitleValue(input,ta.value);
     input.style.removeProperty('display');
     delete input.dataset.lddTitleUpgraded;
   }
   ta.remove();
 });
 document.querySelectorAll('input[data-ldd-title-upgraded]').forEach(i=>{i.style.removeProperty('display');delete i.dataset.lddTitleUpgraded});
}

function lddNativeAction(label){
 const norm=x=>(x||'').replace(/\s+/g,' ').trim().toLowerCase(); const want=norm(label);
 const actionLabels=new Set(['image mockups','video mockups','color overlay','remove background','vision ai','canvas','upscale image','vectorize image']);
 if(actionLabels.has(want) && typeof lddRunNativeAction110==='function'){
   lddRunNativeAction110(label).catch(err=>{if(typeof globalThis.lddToast110==='function')globalThis.lddToast110(err.message||'MyDesigns action unavailable');});
   return true;
 }
 const isVisible=el=>{if(!el)return false;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return !!(r.width&&r.height&&cs.visibility!=='hidden'&&cs.display!=='none');};
 const candidates=[...document.querySelectorAll('button,[role="button"],[role="menuitem"]')].filter(isVisible);
 let b=candidates.find(x=>norm(x.textContent)===want)||candidates.find(x=>norm(x.textContent).includes(want));
 if(b){b.click();return true} return false;
}

let lddEnhanceTimer; new MutationObserver(()=>{clearTimeout(lddEnhanceTimer);lddEnhanceTimer=setTimeout(()=>lddSafeGet(LDD_DEFAULTS,lddApplyUIEnhancements),120)}).observe(document.documentElement,{childList:true,subtree:true});
lddSafeOnChanged((ch,area)=>{if(area==='local'&&['wideScrollbars','scrollbarWidth','highContrastScrollbars','visionTitleBox','visionTitleRows'].some(k=>ch[k]))lddSafeGet(LDD_DEFAULTS,lddApplyUIEnhancements)});
lddSafeGet(LDD_DEFAULTS,lddApplyUIEnhancements);

window.addEventListener("resize",()=>{if(typeof lddAppRoot!=="undefined"&&lddAppRoot)lddPositionAppBesideMdSidebar()},{passive:true});

const LDD_INLINE_FONT_FAMILIES=["Bebas Neue", "Source Code Pro", "Rock Salt", "Rubik Spray Paint", "Anton", "Oswald", "Montserrat", "Poppins", "Archivo Black", "League Spartan", "Permanent Marker", "Bangers", "Luckiest Guy", "Righteous", "Black Ops One", "Pacifico", "Caveat", "Cinzel", "Playfair Display", "Inter"];
function lddInlineLoadFont(family){
 family=String(family||"").replace(/["'<>]/g,"").trim();
 if(!family||family==="Inter")return;
 const id="ldd-inline-gfont-"+family.toLowerCase().replace(/[^a-z0-9]+/g,"-");
 if(document.getElementById(id))return;
 const link=document.createElement("link");link.id=id;link.rel="stylesheet";
 link.href="https://fonts.googleapis.com/css2?family="+encodeURIComponent(family).replace(/%20/g,"+")+"&display=swap";
 document.head.appendChild(link);
}


function lddApplyInlineAppFont(family){
 family=String(family||"MyDesigns Default").replace(/["'<>]/g,"").trim()||"MyDesigns Default";
 if(family==="MyDesigns Default" || family==="Inter"){document.getElementById("ldd-app-font-style")?.remove();lddSafeSet({appFontFamily:"MyDesigns Default"});return;}
 lddInlineLoadFont(family);
 let st=document.getElementById("ldd-app-font-style");
 if(!st){st=document.createElement("style");st.id="ldd-app-font-style";document.head.appendChild(st)}
 st.textContent=family==="Inter"?"":`html body *:not(svg):not(path):not(g):not(use){font-family:"${family}",sans-serif!important}`;
 lddSafeSet({appFontFamily:family});
}

async function lddMountInlineFontBrowser(){
  const host=document.getElementById("ldd-inline-font-browser");
  const state=await new Promise(resolve=>lddSafeGet({appFont:true,appFontFamily:"MyDesigns Default",appFontFavorites:[]},resolve));
  if(!host)return;
  const fav=new Set(state.appFontFavorites||[]);
  const current=state.appFontFamily||"MyDesigns Default";
  const fonts=LDD_INLINE_FONT_FAMILIES.map(f=>({family:f})).sort((a,b)=>(fav.has(b.family)-fav.has(a.family))||a.family.localeCompare(b.family));
  host.innerHTML='<div id="ldd-inline-font-list" class="ldd-inline-font-list ldd-font-buttons-20"></div>';
  const list=host.querySelector("#ldd-inline-font-list");
  const draw=(query="")=>{
    list.innerHTML="";
    const q=String(query).trim().toLowerCase();
    fonts.filter(x=>!q||x.family.toLowerCase().includes(q)).forEach(x=>{
      lddInlineLoadFont(x.family);
      const card=document.createElement("div"); card.className="ldd-font-card20"; card.dataset.family=x.family;
      card.classList.toggle("active",x.family===current);
      const apply=document.createElement("button"); apply.type="button"; apply.className="ldd-font-apply20"; apply.dataset.family=x.family;
      apply.innerHTML=`<b>${x.family}</b><span>Aa Bb Cc 123</span>`;
      apply.style.setProperty("font-family",`"${x.family}",sans-serif`,"important");
      apply.onclick=()=>{lddApplyChosenAppFont(x.family);document.querySelectorAll('.ldd-font-card20').forEach(el=>el.classList.toggle('active',el===card));lddRefreshFontRedesign(x.family)};
      const star=document.createElement("button");star.type="button";star.className="ldd-font-star20";star.textContent=fav.has(x.family)?"★":"☆";star.title="Favorite";
      star.onclick=()=>{fav.has(x.family)?fav.delete(x.family):fav.add(x.family);lddSafeSet({appFontFavorites:[...fav]},()=>{host.dataset.mounted="";lddMountInlineFontBrowser()})};
      card.append(apply,star);list.appendChild(card);
    });
  };
  draw(document.getElementById("ldd-font-search20")?.value||"");
  const search=document.getElementById("ldd-font-search20"); if(search)search.oninput=()=>draw(search.value);
  lddWireFontRedesign();
}
function lddRefreshFontRedesign(family){
 const label=document.getElementById("ldd-font-current-page");if(label)label.textContent=family||"MyDesigns Default";
}
function lddWireFontRedesign(){}

let lddInlineFontMountTimer;
new MutationObserver(()=>{
 clearTimeout(lddInlineFontMountTimer);
 lddInlineFontMountTimer=setTimeout(()=>{
   const h=document.getElementById("ldd-inline-font-browser");
   if(h&&!h.dataset.mounted){h.dataset.mounted="1";lddMountInlineFontBrowser()}
 },80);
}).observe(document.documentElement,{childList:true,subtree:true});

function lddCleanFontPageLeaks(){
 const host=document.getElementById("ldd-inline-font-browser");
 if(!host)return;
 const page=host.closest("#ldd-app-page");
 if(!page)return;
 [...page.querySelectorAll("button")].forEach(b=>{
   const t=(b.textContent||"").trim().toUpperCase();
   if(["PNG","SVG","TUMBLER WRAP","CUSTOM","MUG WRAP","PHONE CASE","+ ADD PRESET"].includes(t)) b.remove();
 });
}

function lddWirePerfTips(){
 document.querySelectorAll("#ldd-app-page .ldd-perf-help").forEach(el=>{
  el.onmouseenter=()=>{
   let t=document.getElementById("ldd-perf-tip");if(!t){t=document.createElement("div");t.id="ldd-perf-tip";document.body.appendChild(t)}
   t.textContent=el.dataset.tip||"";t.hidden=false;
   const r=el.getBoundingClientRect();t.style.left=Math.max(8,Math.min(innerWidth-338,r.left+r.width/2-160))+"px";t.style.top=(r.top-8)+"px";t.style.transform="translateY(-100%)";
  };
  el.onmouseleave=()=>{const t=document.getElementById("ldd-perf-tip");if(t)t.hidden=true};
 });
}
function lddPerformanceWarning(){
 return new Promise(resolve=>{
  const ov=document.createElement("div");ov.id="ldd-perf-warning";
  ov.innerHTML=`<div class="ldd-perf-warning-card"><h2>⚠ Advanced Performance Features</h2><p>These settings change how MyDesigns and LDD render, animate, monitor and display parts of the app to improve performance.</p><p>Some options may hide interface elements, delay off-screen content, reduce visual effects, or change how parts of MyDesigns behave.</p><p><b>LDD Tools is not responsible for unexpected behavior caused by these advanced settings.</b></p><p>If you do not understand a setting, leave it alone. Hover over any setting before changing it.</p><div><button data-back>Go Back</button><button data-agree>I Understand & Agree</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector("[data-back]").onclick=()=>{ov.remove();resolve(false)};
  ov.querySelector("[data-agree]").onclick=()=>lddSafeSet({performanceWarningAccepted:false},()=>{ov.remove();resolve(true)});
 });
}


let lddSidebarAlignRAF=0;
new MutationObserver(()=>{
 cancelAnimationFrame(lddSidebarAlignRAF);
 lddSidebarAlignRAF=requestAnimationFrame(lddAlignSidebarEntry);
}).observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:["class","style","aria-expanded"]});
window.addEventListener("resize",lddAlignSidebarEntry,{passive:true});
setTimeout(lddAlignSidebarEntry,500);

function lddScheduleSidebarAlignment(){
 [0,60,150,300,600,1000,1600].forEach(ms=>setTimeout(lddAlignSidebarEntry,ms));
}
document.addEventListener("DOMContentLoaded",lddScheduleSidebarAlignment,{once:true});
window.addEventListener("load",lddScheduleSidebarAlignment,{once:true});
setTimeout(lddScheduleSidebarAlignment,50);





document.addEventListener("change",e=>{
 const el=e.target;
 if(!el?.matches?.('#ldd-app-page input[data-setting="appFont"]'))return;
 const enabled=!!el.checked;
 lddSafeSet({appFont:enabled,fontEnabled:false,appFontEnabled:false},()=>lddSyncInlineFontPage(enabled));
},true);

let lddNativeSidebarResizeObserver;
function lddWatchNativeSidebarSize(){
 const md=lddFindMdSidebar?.(); if(!md)return;
 try{lddNativeSidebarResizeObserver?.disconnect()}catch(_){}
 try{
   lddNativeSidebarResizeObserver=new ResizeObserver(()=>requestAnimationFrame(lddAlignSidebarEntry));
   lddNativeSidebarResizeObserver.observe(md);
 }catch(_){}
 lddAlignSidebarEntry();
}
[0,100,300,700,1400].forEach(ms=>setTimeout(lddWatchNativeSidebarSize,ms));

function lddPaintPreviewSwatches(root=document){
 const colors={
  transparent:"transparent",checkerboard:"transparent",white:"#fff",black:"#000",
  gray:"#808080",red:"#ef4444",orange:"#f97316",yellow:"#facc15",
  green:"#22c55e",blue:"#3b82f6",purple:"#a855f7",pink:"#ec4899"
 };
 root.querySelectorAll?.('#ldd-hover-preview [data-bg],.ldd-hover-preview [data-bg]').forEach(el=>{
  const k=(el.dataset.bg||"").toLowerCase();
  if(k==="transparent"||k==="checkerboard"){
   el.style.backgroundColor="#fff";
   el.style.backgroundImage="linear-gradient(45deg,#bbb 25%,transparent 25%),linear-gradient(-45deg,#bbb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#bbb 75%),linear-gradient(-45deg,transparent 75%,#bbb 75%)";
   el.style.backgroundSize="10px 10px";
   el.style.backgroundPosition="0 0,0 5px,5px -5px,-5px 0";
  }else if(colors[k]){
   el.style.backgroundImage="none";
   el.style.backgroundColor=colors[k];
  }
 });
}
new MutationObserver(ms=>{
 for(const m of ms)for(const n of m.addedNodes||[])if(n.nodeType===1&&(n.matches?.('#ldd-hover-preview,.ldd-hover-preview')||n.querySelector?.('#ldd-hover-preview,.ldd-hover-preview')))lddPaintPreviewSwatches(n.matches?.('#ldd-hover-preview,.ldd-hover-preview')?n:n);
}).observe(document.documentElement,{childList:true,subtree:true});

function lddRestoreSavedAppFont(){
 lddSafeGet(LDD_DEFAULTS,o=>{
   if(o.appFont===true && o.appFontFamily){
     lddApplyChosenAppFont(o.appFontFamily);
   }else{
     document.getElementById("ldd-app-font-style")?.remove();
   }
 });
}
if(document.readyState==="loading"){
 document.addEventListener("DOMContentLoaded",lddRestoreSavedAppFont,{once:true});
}else{
 lddRestoreSavedAppFont();
}
setTimeout(lddRestoreSavedAppFont,250);
setTimeout(lddRestoreSavedAppFont,900);

function lddApplyChosenAppFont(family){
 if(!family)return;
 if(family==="MyDesigns Default" || family==="Inter"){
   document.getElementById("ldd-app-font-style")?.remove();
   lddSafeSet({appFont:true,appFontFamily:"MyDesigns Default"});
   return;
 }
 try{lddInlineLoadFont?.(family)}catch(_){}
 let st=document.getElementById("ldd-app-font-style");
 if(!st){st=document.createElement("style");st.id="ldd-app-font-style";document.head.appendChild(st)}
 const q=String(family).replace(/["\\]/g,"");
 st.textContent=`
 html body,
 html body #app,
 html body [class*="font-"],
 html body button,
 html body input,
 html body textarea,
 html body select{
   font-family:"${q}",sans-serif!important;
 }`;
 lddSafeSet({appFont:true,appFontFamily:family});
}

document.addEventListener("click",e=>{
 const card=e.target?.closest?.('#ldd-inline-font-browser [data-family],#ldd-inline-font-browser [data-font-family]');
 if(!card)return;
 const family=card.dataset.family||card.dataset.fontFamily;
 if(family)lddApplyChosenAppFont(family);
},true);

function lddRestoreAppFontState(){
 lddSafeGet({appFont:true,appFontFamily:"MyDesigns Default"},o=>{
   if(o.appFont===true && o.appFontFamily){
     try{lddApplyChosenAppFont(o.appFontFamily)}catch(_){
       try{lddApplyInlineAppFont(o.appFontFamily)}catch(__){}
     }
   }else{
     document.getElementById("ldd-app-font-style")?.remove();
   }
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",lddRestoreAppFontState,{once:true});
else lddRestoreAppFontState();
setTimeout(lddRestoreAppFontState,500);


function lddSyncAppFontPageFromStorage(){
 lddSafeGet({appFont:true,appFontFamily:"MyDesigns Default"},o=>{
   const page=document.getElementById("ldd-app-page");
   if(!page)return;

   const toggle=page.querySelector('input[data-setting="appFont"]');
   if(toggle)toggle.checked=(o.appFont===true);

   // Current font value is the span in the Current font card.
   const cards=[...page.querySelectorAll(".ldd-control-card")];
   const currentCard=cards.find(c=>/Current font/i.test(c.textContent||""));
   if(currentCard){
     const spans=[...currentCard.querySelectorAll("span")];
     const value=spans.find(x=>!/Current font/i.test(x.textContent||""));
     if(value)value.textContent=o.appFontFamily||"Inter";
   }

   if(o.appFont===true && o.appFontFamily){
     try{lddApplyChosenAppFont(o.appFontFamily)}catch(_){
       try{lddApplyInlineAppFont(o.appFontFamily)}catch(__){}
     }
   }else{
     document.getElementById("ldd-app-font-style")?.remove();
   }
 });
}

document.addEventListener("click",e=>{
 const tab=e.target?.closest?.('[data-tab="fonts"]');
 if(!tab)return;
 setTimeout(lddSyncAppFontPageFromStorage,0);
 setTimeout(lddSyncAppFontPageFromStorage,80);
},true);

if(document.readyState==="loading"){
 document.addEventListener("DOMContentLoaded",()=>setTimeout(lddSyncAppFontPageFromStorage,100),{once:true});
}else{
 setTimeout(lddSyncAppFontPageFromStorage,100);
}

document.addEventListener("click",e=>{
 const card=e.target?.closest?.('#ldd-inline-font-browser [data-family],#ldd-inline-font-browser [data-font-family]');
 if(!card)return;
 setTimeout(lddSyncAppFontPageFromStorage,30);
},true);

const LDD_SETTINGS_TIPS={"Max Length Unlocker": "Raises MyDesigns text-field character limits locally so you can enter much longer text where MD normally caps the field.", "Product Type Buttons": "Adds quick preset buttons for Product Type after you choose Other (Please specify).", "Credits": "Shows or hides the MyDesigns credits button/bar.", "Hover Preview": "Shows a larger design preview when you hover over a design card.", "Drag & Drop Upload": "Lets you drag files from Explorer onto the Designs page and sends them through the native MyDesigns upload window.", "App Font": "Changes the MyDesigns interface font locally in your browser.", "Theme": "Enables LDD's MyDesigns appearance/theme customizations.", "Carousel Renamer": "Opens the LDD renaming workflow for selected or newly uploaded designs.", "Vision AI Multi-Line Title": "Replaces the small Vision AI listing-title field with a taller multi-line title box.", "": "Controls the width of the MyDesigns scrollbar.", "Designs \u2022\u2022\u2022 More": "Shows or hides the three-dot More menu on Design cards.", "Products \u2022\u2022\u2022 More": "Shows or hides the three-dot More menu on Product cards.", "Create with AI": "Shows or hides MyDesigns' Create with AI control.", "Canvas Quick Menu": "Adds LDD's extra right-click menu tools in the MyDesigns canvas."};
function lddInstallSettingsHoverTips(){
 const page=document.getElementById("ldd-app-page"); if(!page)return;
 const settingsTab=document.querySelector('#ldd-app-page [data-tab="settings"].active,#ldd-app-page [data-tab="settings"][aria-selected="true"]');
 const heading=[...page.querySelectorAll("h1,h2")].find(x=>/Settings/i.test(x.textContent||""));
 if(!settingsTab && !heading)return;
 const nodes=[...page.querySelectorAll(".ldd-control-card,.ldd-toggle-card,label")];
 for(const node of nodes){
   const txt=(node.textContent||"").replace(/\s+/g," ").trim();
   const key=Object.keys(LDD_SETTINGS_TIPS).find(k=>txt.includes(k));
   if(!key||node.dataset.lddSettingsTip)return;
   node.dataset.lddSettingsTip=LDD_SETTINGS_TIPS[key];
   node.classList.add("ldd-settings-tip-host");
 }
}
document.addEventListener("mouseover",e=>{
 const host=e.target?.closest?.(".ldd-settings-tip-host"); if(!host)return;
 let tip=document.getElementById("ldd-settings-hover-tip");
 if(!tip){tip=document.createElement("div");tip.id="ldd-settings-hover-tip";document.body.appendChild(tip)}
 tip.textContent=host.dataset.lddSettingsTip||"";
 tip.style.display="block";
 const r=host.getBoundingClientRect();
 let left=Math.min(window.innerWidth-tip.offsetWidth-14,r.right+10);
 if(left<10)left=10;
 let top=Math.min(window.innerHeight-tip.offsetHeight-14,Math.max(10,r.top));
 tip.style.left=left+"px";tip.style.top=top+"px";
},true);
document.addEventListener("mouseout",e=>{
 const host=e.target?.closest?.(".ldd-settings-tip-host"); if(!host)return;
 if(e.relatedTarget&&host.contains(e.relatedTarget))return;
 const tip=document.getElementById("ldd-settings-hover-tip"); if(tip)tip.style.display="none";
},true);
document.addEventListener("click",e=>{
 if(e.target?.closest?.('[data-tab="settings"]')){setTimeout(lddInstallSettingsHoverTips,20);setTimeout(lddInstallSettingsHoverTips,120)}
},true);
new MutationObserver(()=>lddInstallSettingsHoverTips()).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(lddInstallSettingsHoverTips,200);

/* v1.0.36 — SINGLE authoritative App Font controller */
const LDD_FONT_STATE_DEFAULT={appFont:true,appFontFamily:"MyDesigns Default"};

function lddFontLoad(family){
 if(!family||family==="Inter")return;
 const id="ldd-font-link-"+family.replace(/[^a-z0-9]/gi,"-").toLowerCase();
 if(document.getElementById(id))return;
 const link=document.createElement("link");
 link.id=id;link.rel="stylesheet";
 link.href="https://fonts.googleapis.com/css2?family="+encodeURIComponent(family).replace(/%20/g,"+")+":wght@300;400;500;600;700&display=swap";
 document.head.appendChild(link);
}
function lddFontApply(enabled,family){
 let st=document.getElementById("ldd-app-font-style");
 if(!enabled || !family || family==="MyDesigns Default" || family==="Inter"){
   st?.remove();
   return;
 }
 family=family||"MyDesigns Default";
 lddFontLoad(family);
 if(!st){st=document.createElement("style");st.id="ldd-app-font-style";document.head.appendChild(st)}
 const q=String(family).replace(/["\\]/g,"");
 st.textContent=`body,body button,body input,body textarea,body select,body [role="button"],body [role="menuitem"]{font-family:"${q}",sans-serif!important}`;
}
function lddFontSyncUI(state){
 const page=document.getElementById("ldd-app-page"); if(!page)return;
 const toggle=page.querySelector('input[data-setting="appFont"]');
 if(toggle)toggle.checked=state.appFont===true;
 const cards=[...page.querySelectorAll(".ldd-control-card")];
 const card=cards.find(x=>/Current font/i.test(x.textContent||""));
 if(card){
   const spans=[...card.querySelectorAll("span")];
   const out=spans[spans.length-1];
   if(out)out.textContent=state.appFontFamily||"Inter";
 }
}
function lddFontRestore(){
 lddSafeGet(LDD_FONT_STATE_DEFAULT,state=>{
   lddFontApply(state.appFont===true,state.appFontFamily);
   lddFontSyncUI(state);
 });
}
function lddFontSetEnabled(enabled){
 lddSafeGet(LDD_FONT_STATE_DEFAULT,state=>{
   state.appFont=!!enabled;
   lddSafeSet({appFont:state.appFont},()=>{
     lddFontApply(state.appFont,state.appFontFamily);
     lddFontSyncUI(state);
   });
 });
}
function lddFontChoose(family){
 if(!family)return;
 lddSafeGet(LDD_FONT_STATE_DEFAULT,state=>{
   lddSafeSet({appFontFamily:family},()=>{
     // Choosing a family never changes the toggle.
     lddFontApply(state.appFont===true,family);
     lddFontSyncUI({appFont:state.appFont,appFontFamily:family});
   });
 });
}

/* Capture the App Font toggle before generic/legacy handlers can fight it. */
document.addEventListener("change",e=>{
 const t=e.target;
 if(!t?.matches?.('#ldd-app-page input[data-setting="appFont"]'))return;
 e.stopImmediatePropagation();
 lddFontSetEnabled(t.checked);
},true);

/* Capture font choices and make saved family + displayed family identical immediately. */
document.addEventListener("click",e=>{
 const card=e.target?.closest?.('#ldd-inline-font-browser [data-family],#ldd-inline-font-browser [data-font-family]');
 if(!card)return;
 const family=card.dataset.family||card.dataset.fontFamily;
 if(family){
   e.stopImmediatePropagation();
   lddFontChoose(family);
 }
},true);

/* Restore once at startup and whenever the Fonts page is opened. */
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",lddFontRestore,{once:true});
else lddFontRestore();
window.addEventListener("pageshow",lddFontRestore);
document.addEventListener("click",e=>{
 if(e.target?.closest?.('[data-tab="fonts"]')){
   setTimeout(lddFontRestore,0);
   setTimeout(lddFontRestore,100);
 }
},true);

let lddFontPageRerendering=false;
function lddEnsureFontBrowserRendered(){
 if(lddFontPageRerendering)return;
 lddSafeGet({appFont:false},state=>{
   if(state.appFont!==true)return;
   const page=document.getElementById("ldd-app-page"); if(!page)return;
   const title=[...page.querySelectorAll("h1,h2")].find(x=>/App Font/i.test(x.textContent||""));
   if(!title)return;
   if(page.querySelector("#ldd-inline-font-browser"))return;
   lddFontPageRerendering=true;
   try{lddShowTab("fonts")}catch(e){console.warn("[LDD] Font page render",e)}
   setTimeout(()=>{lddFontPageRerendering=false},150);
 });
}
document.addEventListener("change",e=>{
 if(!e.target?.matches?.('#ldd-app-page input[data-setting="appFont"]'))return;
 if(e.target.checked)setTimeout(lddEnsureFontBrowserRendered,20);
},false);
[50,150,350].forEach(ms=>setTimeout(lddEnsureFontBrowserRendered,ms));
document.addEventListener("click",e=>{
 if(e.target?.closest?.('[data-tab="fonts"]'))setTimeout(lddEnsureFontBrowserRendered,60);
},false);

function lddCapFontResults20(){
  const root=document.querySelector("#ldd-inline-font-browser");
  if(!root)return;
  const candidates=[...root.querySelectorAll("[data-font-family],.ldd-font-item,.ldd-font-card,button")].filter(el=>{
    const t=(el.textContent||"").trim();
    return t && !["All","♥ Favorites","Favorites","Recent","Reset to Inter"].includes(t) && !el.closest(".ldd-font-tabs");
  });
  const unique=[];
  const seen=new Set();
  for(const el of candidates){
    const key=el.dataset?.fontFamily||(el.textContent||"").trim();
    if(!key||seen.has(key))continue;
    seen.add(key);unique.push(el);
  }
  unique.forEach((el,i)=>el.style.setProperty("display",i<20?"":"none","important"));
}
// v1.1.0: font results are capped by picker rendering/events, not a global document observer.
document.addEventListener("input",e=>{
 if(e.target?.closest?.("#ldd-inline-font-browser"))setTimeout(lddCapFontResults20,0);
},true);
document.addEventListener("click",e=>{
 if(e.target?.closest?.("#ldd-inline-font-browser"))setTimeout(lddCapFontResults20,0);
},true);
[100,300,700].forEach(ms=>setTimeout(lddCapFontResults20,ms));

function lddShowSettingsSafetyNotice(){
 if(document.getElementById("ldd-settings-safety-notice"))return;
 const wrap=document.createElement("div");
 wrap.id="ldd-settings-safety-notice";
 wrap.innerHTML=`<div class="ldd-settings-notice-box">
   <h3>Settings Notice</h3>
   <p><b>LDD Settings do not remove or delete anything from MyDesigns.</b></p>
   <p>These options only show, hide, resize, restyle, or locally change how parts of the MyDesigns interface appear in your browser. Turning a setting back off restores the normal MyDesigns interface for that option.</p>
   <p>Your designs, products, files, listings, folders, and MyDesigns account data are not deleted by these display settings.</p>
   <button type="button" id="ldd-settings-notice-ok">I Understand</button>
 </div>`;
 document.body.appendChild(wrap);
 wrap.querySelector("#ldd-settings-notice-ok").onclick=()=>{
   lddSafeSet({settingsNoticeAccepted:true});
   wrap.remove();
 };
}
function lddMaybeShowSettingsSafetyNotice(){
 lddSafeGet({settingsNoticeAccepted:false},o=>{if(!o.settingsNoticeAccepted)lddShowSettingsSafetyNotice()});
}
document.addEventListener("click",e=>{
 if(e.target?.closest?.('[data-tab="settings"]'))setTimeout(lddMaybeShowSettingsSafetyNotice,40);
},true);

function lddPerformanceWarningV140(){
 lddSafeGet({performanceWarningDontShow:false},o=>{
  if(o.performanceWarningDontShow===true)return;
  document.getElementById("ldd-performance-warning-v140")?.remove();
  const wrap=document.createElement("div");
  wrap.id="ldd-performance-warning-v140";
  wrap.innerHTML=`<div class="ldd-perf-warning-box">
    <h3>Advanced Performance Features</h3>
    <p>These settings can change how MyDesigns and LDD render, animate, monitor, and display parts of the interface. Some options may hide UI, delay offscreen content, or reduce visual effects.</p>
    <p><b>If you do not understand a setting, leave it disabled.</b></p>
    <label class="ldd-perf-dontshow"><input type="checkbox" id="ldd-perf-warning-dontshow"> Do not show this warning again</label>
    <div class="ldd-perf-warning-actions">
      <button type="button" id="ldd-perf-warning-back">Go Back</button>
      <button type="button" id="ldd-perf-warning-ok">I Understand & Agree</button>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  const saveChoice=()=> {
    const checked=!!wrap.querySelector("#ldd-perf-warning-dontshow")?.checked;
    if(checked)lddSafeSet({performanceWarningDontShow:true});
  };
  wrap.querySelector("#ldd-perf-warning-back").onclick=()=>{
    saveChoice();
    wrap.remove();
    try{lddShowTab("dashboard")}catch(_){
      document.querySelector('#ldd-app-page [data-tab="dashboard"]')?.click();
    }
  };
  wrap.querySelector("#ldd-perf-warning-ok").onclick=()=>{
    saveChoice();
    wrap.remove();
  };
 });
}

/* v1.0.41 — Show/Hide MyDesigns composition/template gallery. Visibility only. */
function lddFindCompositionGalleries(){
 const imgs=[...document.querySelectorAll('img[src*="/assets/"],img[src*="imagekit.io/uonadbo34e6/compositions/"]')];
 const grids=new Set();
 for(const img of imgs){
   let n=img.parentElement;
   for(let i=0;i<5&&n;i++,n=n.parentElement){
     if(n.classList?.contains("grid") && n.querySelectorAll("img").length>=4){grids.add(n);break}
   }
 }
 return [...grids];
}
function lddApplyCompositionGalleryVisibility(show){
 lddFindCompositionGalleries().forEach(grid=>{
   const scroller=grid.parentElement;
   const target=scroller?.classList?.contains("overflow-auto")?scroller:grid;
   if(show){
     target.style.removeProperty("display");
     target.removeAttribute("data-ldd-composition-hidden");
   }else{
     target.style.setProperty("display","none","important");
     target.setAttribute("data-ldd-composition-hidden","1");
   }
 });
}
function lddSyncCompositionGallery(){
 lddSafeGet({showCompositionGallery:true},o=>lddApplyCompositionGalleryVisibility(o.showCompositionGallery!==false));
}
document.addEventListener("change",e=>{
 const t=e.target;
 if(!t?.matches?.('#ldd-app-page input[data-setting="showCompositionGallery"]'))return;
 lddSafeSet({showCompositionGallery:!!t.checked},()=>lddApplyCompositionGalleryVisibility(!!t.checked));
},true);
new MutationObserver(()=>lddSyncCompositionGallery()).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(lddSyncCompositionGallery,100);
setTimeout(lddSyncCompositionGallery,600);

/* v1.0.42 — independent hover tips; survives failures in optional LDD helpers */
const LDD_V142_TIPS={"Reduce animations": "Reduces interface animations to make MyDesigns feel lighter and less busy.", "Disable blur": "Removes blur/backdrop effects that can use extra graphics resources.", "Reduce shadows": "Simplifies heavy shadows to reduce visual rendering work.", "Lightweight effects": "Uses simpler visual effects for a lighter interface.", "Compact folders": "Makes folder areas more compact to fit more on screen.", "Pause background LDD": "Reduces LDD background activity when it is not needed.", "Viewport rendering": "Prioritizes content currently visible on screen.", "Lazy card images": "Delays loading card images until they are closer to the visible area.", "No smooth scroll": "Disables smooth scrolling effects.", "Disable hover preview": "Turns off LDD's large design hover preview.", "Hide support/chat": "Hides support/chat interface elements. It does not remove your account data.", "TinyMD debloat": "Hides or simplifies nonessential MyDesigns interface elements for better performance.", "Deep debloat": "Applies stronger interface cleanup. Core designs, products, uploads and account data are not deleted.", "Hide promos": "Hides promotional interface elements only.", "Reduce animated media": "Reduces animation of media where possible.", "Suspend hidden video": "Pauses hidden/offscreen video to reduce resource use.", "Trim card effects": "Reduces visual effects on design/product cards.", "Dense menus": "Makes menus more compact.", "Disable tooltips": "Disables nonessential MyDesigns tooltips.", "Hide noncritical toasts": "Hides noncritical popup/toast messages.", "Freeze offscreen media": "Reduces activity for media outside the visible screen.", "Reduce LDD watchers": "Reduces some LDD background DOM monitoring.", "Strip decorations": "Hides nonessential decorative interface effects.", "Compact MD modals": "Makes MyDesigns modal windows more compact.", "Hide tips/onboarding": "Hides tips and onboarding UI only.", "Max Length Unlocker": "Raises local text-field character limits where MyDesigns normally caps them.", "Product Type Buttons": "Adds quick Product Type preset buttons after choosing Other.", "Credits": "Shows or hides the MyDesigns credits control.", "Hover Preview": "Shows or hides LDD's larger design preview on hover.", "Drag & Drop Upload": "Enables dragging files from Explorer directly onto the Designs page.", "App Font": "Changes the MyDesigns interface font locally in your browser.", "Vision AI Multi-Line Title": "Makes the Vision AI listing title field taller and multi-line.", "": "Changes the visible width of the MyDesigns scrollbar.", "Composition Gallery": "Shows or hides the composition/template gallery. Nothing is deleted."};
function lddV142TipTarget(el){
 let n=el?.closest?.(".ldd-control-card,.ldd-toggle-card,label,button,div");
 for(let i=0;n&&i<5;i++,n=n.parentElement){
   const txt=(n.textContent||"").replace(/\s+/g," ").trim();
   const key=Object.keys(LDD_V142_TIPS).find(k=>txt===k||txt.startsWith(k+" ")||txt.includes(k));
   if(key)return {node:n,text:LDD_V142_TIPS[key]};
 }
 return null;
}
function lddV142ShowTip(e){
 const hit=lddV142TipTarget(e.target);if(!hit)return;
 let tip=document.getElementById("ldd-v142-hover-tip");
 if(!tip){tip=document.createElement("div");tip.id="ldd-v142-hover-tip";document.body.appendChild(tip)}
 const host=hit.node;
 if(tip.dataset.hostId===String(host.__lddTipId||"") && tip.style.display==="block")return;
 if(!host.__lddTipId)host.__lddTipId="t"+Math.random().toString(36).slice(2);
 tip.dataset.hostId=host.__lddTipId;
 tip.textContent=hit.text;
 tip.style.visibility="hidden";tip.style.display="block";tip.style.left="0px";tip.style.top="0px";
 const r=host.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
 let left=r.left;
 let top=r.top-h-10;
 if(top<10)top=r.bottom+10;
 if(top+h>innerHeight-10)top=Math.max(10,innerHeight-h-10);
 if(left+w>innerWidth-10)left=Math.max(10,innerWidth-w-10);
 if(left<10)left=10;
 tip.style.left=Math.round(left)+"px";tip.style.top=Math.round(top)+"px";
 tip.style.visibility="visible";
}
document.addEventListener("ldd-disabled-mouseover",lddV142ShowTip,true);
// v1.0.45: tooltip is anchored once on mouseenter; no mousemove reposition loop.
document.addEventListener("mouseout",e=>{
 const hit=lddV142TipTarget(e.target);if(!hit)return;
 if(e.relatedTarget&&hit.node.contains(e.relatedTarget))return;
 const tip=document.getElementById("ldd-v142-hover-tip");if(tip){tip.style.display="none";tip.dataset.hostId=""}
},true);

function lddMarkSettingsLayout(){
 const page=document.getElementById("ldd-app-page");if(!page)return;
 const active=!!page.querySelector('[data-tab="settings"].active,[data-tab="settings"][aria-selected="true"]');
 page.classList.toggle("ldd-settings-active",active);
}
document.addEventListener("click",e=>{
 if(e.target?.closest?.("[data-tab]"))setTimeout(lddMarkSettingsLayout,20);
},true);
new MutationObserver(lddMarkSettingsLayout).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","aria-selected"]});
setTimeout(lddMarkSettingsLayout,100);

/* v1.0.46 — Performance ONLY tooltips */
const LDD_PERF_TIPS_146={"Reduce animations": "Reduces MyDesigns interface animations. Useful if transitions feel sluggish or distracting.", "Disable blur": "Removes blur and backdrop-filter effects to reduce GPU rendering work.", "Reduce shadows": "Simplifies heavy shadows to reduce visual rendering work.", "Lightweight effects": "Uses simpler visual effects to reduce interface rendering overhead.", "Compact folders": "Makes folder areas more compact so more content fits on screen.", "Pause background LDD": "Reduces LDD background activity when the page is idle.", "Viewport rendering": "Prioritizes elements currently visible in the viewport.", "Lazy card images": "Delays loading design/product card images until they are near the visible area.", "No smooth scroll": "Turns off smooth scrolling animations.", "Disable hover preview": "Disables LDD's large design-card hover preview.", "Hide support/chat": "Hides support/chat UI elements only. It does not delete anything.", "TinyMD debloat": "Hides or simplifies selected nonessential MyDesigns UI for a lighter interface.", "Deep debloat": "Applies stronger UI cleanup. It does not delete designs, products, files, or account data.", "Hide promos": "Hides promotional UI elements only.", "Reduce animated media": "Reduces animation of media where possible.", "Suspend hidden video": "Pauses hidden video when possible to reduce resource use.", "Trim card effects": "Reduces visual effects on design and product cards.", "Dense menus": "Makes supported menus more compact.", "Disable tooltips": "Disables nonessential native MyDesigns tooltips.", "Hide noncritical toasts": "Hides noncritical MyDesigns toast notifications.", "Freeze offscreen media": "Reduces activity for media that is outside the visible viewport.", "Reduce LDD watchers": "Reduces some LDD DOM/background monitoring.", "Strip decorations": "Hides nonessential decorative UI effects.", "Compact MD modals": "Makes supported MyDesigns modal windows more compact.", "Hide tips/onboarding": "Hides MyDesigns tips/onboarding UI only."};
function lddPerfPageActive146(){
 const page=document.getElementById("ldd-app-page");if(!page)return false;
 return !!page.querySelector('[data-tab="performance"].active,[data-tab="performance"][aria-selected="true"]')
   || /Performance/i.test([...page.querySelectorAll("h1,h2")].map(x=>x.textContent||"").join(" "));
}
function lddPerfTipHit146(target){
 if(!lddPerfPageActive146())return null;
 let n=target?.closest?.(".ldd-control-card,.ldd-toggle-card");
 if(!n)return null;
 const txt=(n.textContent||"").replace(/\s+/g," ").trim();
 const key=Object.keys(LDD_PERF_TIPS_146).find(k=>txt===k||txt.startsWith(k+" "));
 return key?{node:n,text:LDD_PERF_TIPS_146[key]}:null;
}
document.addEventListener("ldd-disabled-v146-over",e=>{
 const hit=lddPerfTipHit146(e.target);if(!hit)return;
 let tip=document.getElementById("ldd-perf-tip-146");
 if(!tip){tip=document.createElement("div");tip.id="ldd-perf-tip-146";document.body.appendChild(tip)}
 if(tip.dataset.host===hit.text&&tip.style.display==="block")return;
 tip.dataset.host=hit.text;tip.textContent=hit.text;
 tip.style.visibility="hidden";tip.style.display="block";
 const r=hit.node.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
 let left=Math.max(12,Math.min(r.left,innerWidth-w-12));
 let top=r.top-h-10;if(top<12)top=r.bottom+10;
 top=Math.max(12,Math.min(top,innerHeight-h-12));
 tip.style.left=Math.round(left)+"px";tip.style.top=Math.round(top)+"px";tip.style.visibility="visible";
},true);
document.addEventListener("ldd-disabled-v146-out",e=>{
 const hit=lddPerfTipHit146(e.target);if(!hit)return;
 if(e.relatedTarget&&hit.node.contains(e.relatedTarget))return;
 const tip=document.getElementById("ldd-perf-tip-146");if(tip){tip.style.display="none";tip.dataset.host=""}
},true);
document.addEventListener("click",e=>{
 if(e.target?.closest?.('[data-tab]:not([data-tab="performance"])'))document.getElementById("ldd-perf-tip-146")?.remove();
},true);

/* v1.0.47 — direct Performance tooltips.
   Performance controls already have .ldd-perf-help + data-tip generated from
   the real setting key. No label guessing and no cross-page matching. */
function lddPerfDirectHide147(){
 const tip=document.getElementById("ldd-perf-tip-147");
 if(tip){tip.style.display="none";tip.dataset.host="";}
}
function lddPerfDirectShow147(host){
 if(!host || !host.matches(".ldd-perf-help[data-tip]"))return;
 const page=host.closest(".ldd-performance-page");
 if(!page)return;
 const text=host.getAttribute("data-tip");
 if(!text)return;
 let tip=document.getElementById("ldd-perf-tip-147");
 if(!tip){tip=document.createElement("div");tip.id="ldd-perf-tip-147";document.body.appendChild(tip);}
 if(!host.dataset.lddTip147)host.dataset.lddTip147="p"+Math.random().toString(36).slice(2);
 if(tip.dataset.host===host.dataset.lddTip147 && tip.style.display==="block")return;
 tip.dataset.host=host.dataset.lddTip147;
 tip.textContent=text;
 tip.style.display="block";
 tip.style.visibility="hidden";
 tip.style.left="0px";tip.style.top="0px";
 const r=host.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
 let left=r.left;
 let top=r.top-h-10;
 if(top<10)top=r.bottom+10;
 if(left+w>innerWidth-10)left=innerWidth-w-10;
 if(left<10)left=10;
 if(top+h>innerHeight-10)top=Math.max(10,innerHeight-h-10);
 tip.style.left=Math.round(left)+"px";
 tip.style.top=Math.round(top)+"px";
 tip.style.visibility="visible";
}
document.addEventListener("mouseover",e=>{
 const host=e.target?.closest?.(".ldd-performance-page .ldd-perf-help[data-tip]");
 if(!host)return;
 lddPerfDirectShow147(host);
},true);
document.addEventListener("mouseout",e=>{
 const host=e.target?.closest?.(".ldd-performance-page .ldd-perf-help[data-tip]");
 if(!host)return;
 if(e.relatedTarget && host.contains(e.relatedTarget))return;
 lddPerfDirectHide147();
},true);
document.addEventListener("click",e=>{
 if(!e.target?.closest?.(".ldd-performance-page"))lddPerfDirectHide147();
},true);

/* v1.0.48 — Designs Search Bar show/hide. Visibility only. */
function lddApplyDesignsSearchVisibility(show){
 document.querySelectorAll('input[placeholder="Search by ID, title, description, tags..."]').forEach(input=>{
   // Hide the containing search control so the icon/background do not remain behind.
   let target=input;
   const parent=input.parentElement;
   if(parent && parent.querySelectorAll("input").length===1) target=parent;
   if(show){
     target.style.removeProperty("display");
     target.removeAttribute("data-ldd-designs-search-hidden");
   }else{
     target.style.setProperty("display","none","important");
     target.setAttribute("data-ldd-designs-search-hidden","1");
   }
 });
}
function lddSyncDesignsSearchVisibility(){
 lddSafeGet({showDesignsSearch:true},o=>lddApplyDesignsSearchVisibility(o.showDesignsSearch!==false));
}
document.addEventListener("change",e=>{
 const t=e.target;
 if(!t?.matches?.('#ldd-app-page input[data-setting="showDesignsSearch"]'))return;
 lddSafeSet({showDesignsSearch:!!t.checked},()=>lddApplyDesignsSearchVisibility(!!t.checked));
},true);
new MutationObserver(()=>lddSyncDesignsSearchVisibility()).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(lddSyncDesignsSearchVisibility,100);
setTimeout(lddSyncDesignsSearchVisibility,600);

/* v1.5.9 — persistent 1–5 row Listing Title height */
function lddRestoreTitleTextareaHeight(){
 lddSafeGet({visionTitleRows:3},o=>{
   const rows=Math.min(5,Math.max(1,Number(o.visionTitleRows)||3));
   cfg.visionTitleRows=rows;
   document.querySelectorAll('textarea.ldd-vision-title-area[data-ldd-title-textarea="1"]').forEach(ta=>lddApplyTitleRows(ta,rows));
 });
}
new MutationObserver(()=>lddRestoreTitleTextareaHeight()).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(lddRestoreTitleTextareaHeight,100);
setTimeout(lddRestoreTitleTextareaHeight,500);

/* v1.7.2 — fail-safe mirrored Title textarea maintenance.
   Keep this independent from the main Title Rows helper so a late SPA/Vue
   remount can never throw and stop the rest of LDD Tools from initializing. */
function lddKeepTitleTextarea172(){
 try{
   const rows=Math.min(5,Math.max(1,Number(cfg?.visionTitleRows)||3));
   const h={1:36,2:60,3:84,4:108,5:132}[rows];
   document.querySelectorAll('textarea.ldd-vision-title-area[data-ldd-title-textarea="1"]').forEach(ta=>{
     try{
       ta.rows=rows;
       ta.dataset.lddRows=String(rows);
       ta.style.setProperty("height",h+"px","important");
       ta.style.setProperty("min-height",h+"px","important");
       ta.style.setProperty("resize","vertical","important");
       ta.style.setProperty("overflow-y","auto","important");
       ta.style.setProperty("white-space","pre-wrap","important");
       ta.style.setProperty("overflow-wrap","anywhere","important");
     }catch(_){}
   });
 }catch(_){}
}
new MutationObserver(()=>{try{lddKeepTitleTextarea172()}catch(_){}}).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(lddKeepTitleTextarea172,50);
setTimeout(lddKeepTitleTextarea172,300);
setTimeout(lddKeepTitleTextarea172,1000);


/* v1.1.1 native Actions-menu mapper + configurable hotkeys. */
function lddTypingTarget110(t){return !!t?.closest?.('input,textarea,select,[contenteditable="true"],[contenteditable=""],.canvas-container textarea');}
function lddNormalizeAction110(v){return String(v||'').trim().replace(/\s+/g,' ').toLowerCase();}
function lddVisible110(el){if(!el)return false;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return !!(r.width&&r.height&&cs.visibility!=="hidden"&&cs.display!=="none");}
function lddActionsPopup110(){
 const input=[...document.querySelectorAll('input[placeholder="Search actions..."]')].find(lddVisible110);
 if(!input)return null;
 return input.closest('.z-menu')||input.closest('[class*="z-menu"]')||input.closest('div.border-base-border.bg-base-surface');
}
function lddFindActionsButton110(){return [...document.querySelectorAll('button')].find(b=>lddVisible110(b)&&lddNormalizeAction110(b.textContent)==='actions')||null;}
function lddFindNativeAction110(label){
 const popup=lddActionsPopup110();if(!popup)return null;const wanted=lddNormalizeAction110(label);
 return [...popup.querySelectorAll('button')].find(b=>{const span=b.querySelector('span.truncate');return span&&lddNormalizeAction110(span.textContent)===wanted;})||null;
}
async function lddRunNativeAction110(label){
 let action=lddFindNativeAction110(label);
 if(!action){
   const opener=lddFindActionsButton110();if(!opener)throw new Error('Actions button not found');opener.click();
   const end=Date.now()+1200;
   while(Date.now()<end && !(action=lddFindNativeAction110(label)))await new Promise(r=>setTimeout(r,50));
 }
 if(!action)throw new Error(`${label} is not available for the current selection`);
 if(action.disabled||action.getAttribute('aria-disabled')==='true')throw new Error(`${label} is currently disabled`);
 action.click();return true;
}
function lddCombo110(e){const p=[];if(e.ctrlKey)p.push('Ctrl');if(e.altKey)p.push('Alt');if(e.shiftKey)p.push('Shift');if(e.metaKey)p.push('Meta');const k=e.key.length===1?e.key.toUpperCase():e.key;if(!['Control','Alt','Shift','Meta'].includes(e.key))p.push(k);return p.join('+');}
/* v1.8.15 — hotkeys are a startup service, not a Hotkeys-page side effect.
   Keep a synchronous cache so preventDefault/stopPropagation happen during the key event. */
const LDD_HOTKEY_ACTIONS_1815={upscale:'Upscale image',removeBg:'Remove background',imageMockups:'Image mockups',videoMockups:'Video mockups',canvas:'Canvas',visionAI:'Vision AI',vectorize:'Vectorize image',colorOverlay:'Color overlay',patternOverlay:'Pattern overlay',imageEffect:'Image effect',resizeImage:'Resize image',edit:'Edit',duplicate:'Duplicate',swapFiles:'Swap files',deleteFiles:'Delete files',bulkTags:'Bulk tags',bulkSyncPublications:'Bulk sync publications',checkTrademarks:'Check trademarks',searchTrademarks:'Search trademarks',translate:'Translate',deleteAction:'Delete'};
let lddHotkeyState1815={enabled:true,map:Object.assign({},LDD_DEFAULTS.hotkeyMap)};
/* v1.8.16: migrate the old four Ctrl+Alt defaults / blank rows to the new complete numeric map once. Custom maps are preserved. */
lddSafeGet({hotkeyMap:null,hotkeyDefaults1816:false},o=>{
 if(o.hotkeyDefaults1816)return;
 const m=o.hotkeyMap||{};
 const legacy=(!m.canvas&&!m.visionAI&&!m.vectorize) && (!m.upscale||m.upscale==='Ctrl+Alt+U') && (!m.removeBg||m.removeBg==='Ctrl+Alt+B') && (!m.imageMockups||m.imageMockups==='Ctrl+Alt+I') && (!m.videoMockups||m.videoMockups==='Ctrl+Alt+V');
 if(legacy)lddSafeSet({hotkeyMap:Object.assign({},LDD_DEFAULTS.hotkeyMap),hotkeyDefaults1816:true});
 else lddSafeSet({hotkeyDefaults1816:true});
});
function lddLoadHotkeyState1815(){
 lddSafeGet({hotkeysEnabled:true,hotkeyMap:LDD_DEFAULTS.hotkeyMap},o=>{
  lddHotkeyState1815={enabled:o.hotkeysEnabled!==false,map:Object.assign({},LDD_DEFAULTS.hotkeyMap,o.hotkeyMap||{})};
 });
}
lddLoadHotkeyState1815();
lddSafeOnChanged((changes,area)=>{
 if(area!=='local'||(!changes.hotkeysEnabled&&!changes.hotkeyMap))return;
 if(changes.hotkeysEnabled)lddHotkeyState1815.enabled=changes.hotkeysEnabled.newValue!==false;
 if(changes.hotkeyMap)lddHotkeyState1815.map=Object.assign({},LDD_DEFAULTS.hotkeyMap,changes.hotkeyMap.newValue||{});
});
document.addEventListener('keydown',e=>{
 if(lddTypingTarget110(e.target)||e.repeat||!lddHotkeyState1815.enabled)return;
 const combo=lddCombo110(e);
 const map=lddHotkeyState1815.map||LDD_DEFAULTS.hotkeyMap;
 const hit=Object.keys(LDD_HOTKEY_ACTIONS_1815).find(id=>map[id]&&String(map[id]).toLowerCase()===combo.toLowerCase());
 if(!hit)return;
 e.preventDefault();e.stopImmediatePropagation();
 lddRunNativeAction110(LDD_HOTKEY_ACTIONS_1815[hit]).catch(err=>globalThis.lddToast110(err.message||'MyDesigns action unavailable',true,'error'));
},true);

lddSafeOnChanged((c,a)=>{if(a==='local' && ['themeEnabled','themeTweaker','themeBg','themePanel','themeText','themeMuted','themeColor','themeAccent2','themeAccent3','themeAccent4','themeAccent5','themeBorder','themeHover','themeSelected','themeWarning','themeError','themeRadius','themeUiScale','themeGlow','themeCards'].some(k=>c[k]))lddSafeGet(LDD_DEFAULTS,lddApplyTheme110)});
lddSafeGet(LDD_DEFAULTS,lddApplyTheme110);

/* v1.0.54 — old experimental Settings tab layers removed */

},true);
/* v1.0.24 runtime guard: old font-mount helper intentionally retired */
/* v1.1.3 draggable + collapsible Hotkey Tips HUD */
const LDD_HOTKEY_HUD_DEFS_113={upscale:'Upscale',removeBg:'Remove BG',imageMockups:'Image Mockups',videoMockups:'Video Mockups',canvas:'Canvas',visionAI:'Vision AI',vectorize:'Vectorize',colorOverlay:'Color Overlay',patternOverlay:'Pattern Overlay',imageEffect:'Image Effect',resizeImage:'Resize Image',edit:'Edit',duplicate:'Duplicate',swapFiles:'Swap Files',deleteFiles:'Delete Files',bulkTags:'Bulk Tags',bulkSyncPublications:'Bulk Sync',checkTrademarks:'Check Trademarks',searchTrademarks:'Search Trademarks',translate:'Translate',deleteAction:'Delete'};
function lddHotkeyHudOnDesigns113(){
 const p=location.pathname.replace(/\/+$/,'');
 return p==='/app/designs'||p==='/designs'||p.endsWith('/designs');
}
function lddHotkeyHud113(){
 if(!lddHotkeyHudOnDesigns113()){document.getElementById('ldd-hotkey-hud-113')?.remove();return;}
 if(document.getElementById('ldd-hotkey-hud-113'))return;
 lddSafeGet({hotkeysEnabled:true,hotkeyHudEnabled:false,
  toastNotifications:true,hotkeyMap:LDD_DEFAULTS.hotkeyMap,hotkeyHudVisible:LDD_DEFAULTS.hotkeyHudVisible,hotkeyHudCollapsed:true,hotkeyHudPosition:null,hotkeyHudDragHintSeen:false},o=>{
  if(document.getElementById('ldd-hotkey-hud-113'))return;
  if(o.hotkeyHudEnabled===false)return;
  const hud=document.createElement('div');hud.id='ldd-hotkey-hud-113';
  if(o.hotkeyHudCollapsed)hud.classList.add('collapsed');
  const map=Object.assign({},LDD_DEFAULTS.hotkeyMap,o.hotkeyMap||{});
  hud.innerHTML=`<div class="ldd-hotkey-hud-head-113" title="Drag to move"><span class="ldd-hotkey-hud-title-113"><span class="ldd-hotkey-hud-grip-113" aria-hidden="true">⠿</span><b>⌨ Hotkey Tips</b></span><button type="button" class="ldd-hotkey-hud-collapse-113" title="Collapse hotkey tips">${o.hotkeyHudCollapsed?'＋':'−'}</button></div><div class="ldd-hotkey-hud-body-113"></div>`;
  document.body.appendChild(hud);
  const pos=o.hotkeyHudPosition;
  const placeDefault=()=>{const search=document.querySelector('input[placeholder="Search designs and products..."]');if(!search)return;const r=search.getBoundingClientRect();const x=Math.min(innerWidth-hud.offsetWidth-8,r.right+20);const y=Math.max(8,r.top+(r.height-hud.offsetHeight)/2);hud.style.left=Math.max(8,x)+'px';hud.style.top=y+'px';hud.style.right='auto';};
  if(pos&&Number.isFinite(pos.x)&&Number.isFinite(pos.y)){hud.style.left=Math.max(8,Math.min(pos.x,innerWidth-hud.offsetWidth-8))+'px';hud.style.top=Math.max(8,Math.min(pos.y,innerHeight-hud.offsetHeight-8))+'px';hud.style.right='auto';}else{placeDefault();setTimeout(placeDefault,250);}
  if(!o.hotkeyHudDragHintSeen){const hint=document.createElement('div');hint.className='ldd-hotkey-drag-hint-113';hint.textContent='⠿ Drag me anywhere';hud.appendChild(hint);requestAnimationFrame(()=>hint.classList.add('show'));setTimeout(()=>{hint.classList.remove('show');setTimeout(()=>hint.remove(),250);},3200);lddSafeSet({hotkeyHudDragHintSeen:true});}
  const visible=Object.assign({},LDD_DEFAULTS.hotkeyHudVisible,o.hotkeyHudVisible||{});const render=()=>{const body=hud.querySelector('.ldd-hotkey-hud-body-113');body.innerHTML=Object.entries(LDD_HOTKEY_HUD_DEFS_113).map(([id,name])=>(map[id]&&visible[id]===true)?`<div><span>${name}</span><kbd>${map[id]}</kbd></div>`:'').join('')||'<small>No HUD shortcuts selected</small>';};render();
  const collapse=hud.querySelector('.ldd-hotkey-hud-collapse-113');collapse.onclick=e=>{e.stopPropagation();const v=!hud.classList.contains('collapsed');hud.classList.toggle('collapsed',v);collapse.textContent=v?'＋':'−';collapse.title=v?'Expand hotkey tips':'Collapse hotkey tips';lddSafeSet({hotkeyHudCollapsed:v});};
  const head=hud.querySelector('.ldd-hotkey-hud-head-113');let drag=null;
  head.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=hud.getBoundingClientRect();drag={dx:e.clientX-r.left,dy:e.clientY-r.top};head.setPointerCapture?.(e.pointerId);hud.classList.add('dragging');});
  head.addEventListener('pointermove',e=>{if(!drag)return;const x=Math.max(8,Math.min(e.clientX-drag.dx,innerWidth-hud.offsetWidth-8)),y=Math.max(8,Math.min(e.clientY-drag.dy,innerHeight-hud.offsetHeight-8));hud.style.left=x+'px';hud.style.top=y+'px';hud.style.right='auto';});
  const stop=e=>{if(!drag)return;drag=null;hud.classList.remove('dragging');const r=hud.getBoundingClientRect();lddSafeSet({hotkeyHudPosition:{x:Math.round(r.left),y:Math.round(r.top)}});};head.addEventListener('pointerup',stop);head.addEventListener('pointercancel',stop);
 });
}
setTimeout(lddHotkeyHud113,500);
let lddHudLastPath113=location.pathname;
setInterval(()=>{if(location.pathname!==lddHudLastPath113){lddHudLastPath113=location.pathname;document.getElementById('ldd-hotkey-hud-113')?.remove();lddHotkeyHud113();}},350);
window.addEventListener('popstate',()=>{document.getElementById('ldd-hotkey-hud-113')?.remove();lddHotkeyHud113();});
lddSafeOnChanged((c,a)=>{if(a!=='local')return;if(c.hotkeyMap||c.hotkeysEnabled||c.hotkeyHudEnabled||c.hotkeyHudVisible){document.getElementById('ldd-hotkey-hud-113')?.remove();lddHotkeyHud113();}});




/* ===== v1.6.5 APP FONT STARTUP KICK =====
   Fonts could be enabled in storage while the selected Google font face/style
   had not actually been installed yet. Manually toggling OFF -> ON worked
   because it reran the loader. Do the same loader work automatically without
   changing the user's enabled state. */
let lddFontStartupKickTimer=0;
function lddFontStartupKick(){
  document.getElementById("ldd-custom-font-face")?.remove();
  clearTimeout(lddFontStartupKickTimer);
  lddFontStartupKickTimer=setTimeout(()=>{
    lddSafeGet({appFont:true,appFontFamily:"MyDesigns Default"},o=>{
      if(o.appFont!==true){
        document.getElementById("ldd-app-font-style")?.remove();
        return;
      }
      const family=o.appFontFamily||"MyDesigns Default";
      // Force a clean re-install of the app-font rule, exactly like an enable
      // action, but never write appFont=false or alter the saved family.
      document.getElementById("ldd-app-font-style")?.remove();
      try{lddFontApply(true,family)}catch(_){}
      // Legacy loader remains as a fallback for older saved font states.
      if(family!=="MyDesigns Default" && family!=="Inter"){
        try{lddInlineLoadFont?.(family)}catch(_){}
      }
      lddFontSyncUI?.({appFont:true,appFontFamily:family});
    });
  },35);
}

// Initial MyDesigns/Vue mount can happen in stages, so reapply after each
// common mount window. This does not toggle or rewrite the setting.
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",lddFontStartupKick,{once:true});
}else lddFontStartupKick();
[180,600,1400,3000].forEach(ms=>setTimeout(lddFontStartupKick,ms));
window.addEventListener("pageshow",lddFontStartupKick);

// SPA navigation / Vue remount: debounce and reapply the already-saved font.
let lddFontMountObserver=new MutationObserver(()=>lddFontStartupKick());
lddFontMountObserver.observe(document.documentElement,{childList:true,subtree:true});

// Opening Fonts also guarantees the actual face is loaded, without OFF -> ON.
document.addEventListener("click",e=>{
  if(e.target?.closest?.('[data-tab="fonts"]')){
    setTimeout(lddFontStartupKick,0);
    setTimeout(lddFontStartupKick,120);
  }
},true);
