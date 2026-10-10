/* ============================================================
   LDD Tools — PDF Library
   Pete's prompt PDFs, hosted on GitHub (NOT bundled in the ZIP).
   Anyone with the extension can read them live or download them.
   ============================================================ */
const LDD_PL_KEY="lddPdfLibSettings";
const LDD_LUCIDE_DL='<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>';
const LDD_LUCIDE_DB='<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>';
let lddPlSettings=null;
let lddPlCache={files:[],at:0};

async function lddPlLoadSettings(){
  try{
    const d=await chrome.storage.local.get(LDD_PL_KEY);
    lddPlSettings=Object.assign({owner:"lavenderdragondesign",repo:"LDDEXTENSIONMD",path:"prompt-packs",branch:"main"},d[LDD_PL_KEY]||{});
  }catch(_){lddPlSettings={owner:"lavenderdragondesign",repo:"LDDEXTENSIONMD",path:"prompt-packs",branch:"main"};}
}
function lddPlSaveSettings(){return chrome.storage.local.set({[LDD_PL_KEY]:lddPlSettings}).catch(()=>{});}
function lddPlConfigured(){return !!(lddPlSettings&&lddPlSettings.owner&&lddPlSettings.repo);}
function lddPlApiUrl(){
  const s=lddPlSettings;
  const p=(s.path||"").replace(/^\/+|\/+$/g,"");
  return `https://api.github.com/repos/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.repo)}/contents/${p?encodeURIComponent(p)+"/":""}?ref=${encodeURIComponent(s.branch||"main")}`;
}
function lddPlFmtSize(n){
  if(!n&&n!==0)return "";
  const u=["B","KB","MB","GB"];let i=0;let v=n;
  while(v>=1024&&i<3){v/=1024;i++;}
  return v.toFixed(i?1:0)+" "+u[i];
}
async function lddPlFetchList(force){
  if(!lddPlConfigured())throw new Error("not-configured");
  if(!force&&lddPlCache.files.length)return lddPlCache.files;
  const r=await fetch(lddPlApiUrl(),{headers:{"Accept":"application/vnd.github+json"},cache:"no-store"});
  if(r.status===404)throw new Error("Repo or folder not found — check the settings");
  if(r.status===403)throw new Error("GitHub rate limit hit — try again in a minute");
  if(!r.ok)throw new Error("GitHub error "+r.status);
  const items=await r.json();
  if(!Array.isArray(items))throw new Error("That path isn't a folder");
  const files=items.filter(x=>x.type==="file"&&/\.pdf$/i.test(x.name||""))
    .map(x=>({name:(x.name||"").replace(/\.pdf$/i,"").replace(/[_-]+/g," ").trim()||x.name,
              file:x.name,size:x.size||0,url:x.download_url||"",sha:x.sha||x.name}))
    .sort((a,b)=>a.name.localeCompare(b.name));
  lddPlCache={files,at:Date.now()};
  return files;
}

/* ---------- Library tab ---------- */
function lddRenderPdfLibraryPage(o){
  lddVtInjectCss();
  return `<div class="ldd-page-title"><h2>📚 Prompt Pack PDF Library</h2><p>Read live or download.</p></div>
  <div class="ldd-vt-wrap">
    <div class="ldd-vt-toolbar" style="gap:8px">
      <input class="ldd-vt-input ldd-vt-search" id="ldd-pl-q" placeholder="Search PDFs…" style="max-width:280px">
      <button class="ldd-vt-btn ghost sm" id="ldd-pl-refresh" title="Reload the list from GitHub">↻</button>
      <span style="flex:1"></span>
      <button class="ldd-vt-btn ghost sm" id="ldd-pl-view" title="Toggle list/grid view">☰ List</button>
    </div>
    <div id="ldd-pl-folders" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center"></div>
    <div class="ldd-vt-stats"><span id="ldd-pl-count"></span></div>
    <div class="ldd-vt-grid" id="ldd-pl-grid" style="grid-template-columns:repeat(4,1fr);gap:10px"></div>
  </div>`;
}
let lddPlUI={query:"",view:"grid"};
const LDD_PL_FAV_KEY="lddPdfLibFavs";
const LDD_PL_VIEW_KEY="lddPdfLibView";
let lddPlFavs=[];
async function lddPlLoadFavs(){
  try{const d=await chrome.storage.local.get([LDD_PL_FAV_KEY,LDD_PL_VIEW_KEY]);
    lddPlFavs=d[LDD_PL_FAV_KEY]||[];
    if(d[LDD_PL_VIEW_KEY])lddPlUI.view=d[LDD_PL_VIEW_KEY];
  }catch(_){}
}
function lddPlSaveFavs(){return chrome.storage.local.set({[LDD_PL_FAV_KEY]:lddPlFavs}).catch(()=>{});}
function lddPlSaveView(){return chrome.storage.local.set({[LDD_PL_VIEW_KEY]:lddPlUI.view}).catch(()=>{});}
function lddPlToggleFav(sha){
  const i=lddPlFavs.indexOf(sha);
  if(i<0)lddPlFavs.push(sha);else lddPlFavs.splice(i,1);
  lddPlSaveFavs();
}
const LDD_PL_FOLDERS_KEY="lddPdfLibFolders";
const LDD_PL_FILEFOLDER_KEY="lddPdfLibFileFolder";
let lddPlFolders=[];
let lddPlFileFolder={};
let lddPlActiveFolder="all";
async function lddPlLoadFolders(){
  try{
    const d=await chrome.storage.local.get([LDD_PL_FOLDERS_KEY,LDD_PL_FILEFOLDER_KEY]);
    lddPlFolders=d[LDD_PL_FOLDERS_KEY]||[];
    lddPlFileFolder=d[LDD_PL_FILEFOLDER_KEY]||{};
  }catch(_){}
}
function lddPlSaveFolders(){return chrome.storage.local.set({[LDD_PL_FOLDERS_KEY]:lddPlFolders,[LDD_PL_FILEFOLDER_KEY]:lddPlFileFolder}).catch(()=>{});}
function lddPlRenderFolderPills(root,allFiles){
  const el=root.querySelector("#ldd-pl-folders");if(!el)return;
  const inFolder=sha=>lddPlFileFolder[sha];
  const counts={unfiled:0};
  lddPlFolders.forEach(fl=>counts[fl.id]=0);
  (allFiles||[]).forEach(f=>{const fid=inFolder(f.sha);if(fid&&counts[fid]!==undefined)counts[fid]++;else counts.unfiled++;});
  const pill=(id,label,count)=>`<button class="ldd-vt-btn ${lddPlActiveFolder===id?"primary":"ghost"} sm" data-pl-f="${id}">${label}${count!==undefined?` <span style="opacity:.65">${count}</span>`:""}</button>`;
  el.innerHTML=pill("all","📚 All",(allFiles||[]).length)
    +pill("unfiled","Unfiled",counts.unfiled)
    +lddPlFolders.map(fl=>`<span style="display:inline-flex;gap:2px;align-items:center">${pill(fl.id,"📁 "+lddVtEsc(fl.name),counts[fl.id])}<button class="ldd-vt-btn ghost sm" data-pl-fdel="${fl.id}" title="Delete folder" style="padding:2px 7px">×</button></span>`).join("")
    +`<button class="ldd-vt-btn ghost sm" data-pl-fnew>+ New folder</button>`;
  el.querySelectorAll("[data-pl-f]").forEach(b=>b.onclick=()=>{lddPlActiveFolder=b.dataset.plF;lddPlRenderGrid(false);});
  el.querySelectorAll("[data-pl-fdel]").forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const fid=b.dataset.plFdel;
    const fl=lddPlFolders.find(x=>x.id===fid);
    if(!confirm(`Delete folder "${fl?fl.name:fid}"? PDFs become Unfiled.`))return;
    lddPlFolders=lddPlFolders.filter(x=>x.id!==fid);
    Object.keys(lddPlFileFolder).forEach(sha=>{if(lddPlFileFolder[sha]===fid)delete lddPlFileFolder[sha];});
    if(lddPlActiveFolder===fid)lddPlActiveFolder="all";
    lddPlSaveFolders();lddPlRenderGrid(false);
  });
  const nb=el.querySelector("[data-pl-fnew]");
  if(nb)nb.onclick=()=>{
    const name=prompt("Folder name:");if(!name||!name.trim())return;
    const fl={id:"plf"+Date.now().toString(36),name:name.trim().slice(0,40)};
    lddPlFolders.push(fl);lddPlActiveFolder=fl.id;
    lddPlSaveFolders();lddPlRenderGrid(false);
  };
}
function lddPlFolderSelect(sha){
  const cur=lddPlFileFolder[sha]||"";
  return `<select data-pl-move="${sha}" class="ldd-vt-input" style="font-size:.72rem;padding:3px 6px;max-width:100%" title="Move to folder">
    <option value="">📁 Unfiled</option>
    ${lddPlFolders.map(fl=>`<option value="${fl.id}"${cur===fl.id?" selected":""}>📁 ${lddVtEsc(fl.name)}</option>`).join("")}
  </select>`;
}
const LDD_PL_SEEN_KEY="lddPdfLibSeen";
let lddPlSeen=null; // null = first run (baseline silently); else {sha: firstSeenTs}
async function lddPlLoadSeen(){
  try{
    const d=await chrome.storage.local.get(LDD_PL_SEEN_KEY);
    const v=d[LDD_PL_SEEN_KEY];
    if(v===undefined){lddPlSeen=null;return;}
    if(Array.isArray(v)){const o={};v.forEach(sha=>o[sha]=0);lddPlSeen=o;return;}
    lddPlSeen=v||{};
  }catch(_){lddPlSeen={};}
}
function lddPlSaveSeen(){return chrome.storage.local.set({[LDD_PL_SEEN_KEY]:lddPlSeen||{}}).catch(()=>{});}
function lddPlWhatsNew(files){
  const now=Date.now();
  if(lddPlSeen===null){lddPlSeen={};files.forEach(f=>lddPlSeen[f.sha]=0);lddPlSaveSeen();return;}
  const fresh=files.filter(f=>!(f.sha in lddPlSeen));
  fresh.forEach(f=>lddPlSeen[f.sha]=now);
  if(fresh.length){lddPlSaveSeen();lddPlShowWhatsNew(fresh);}
}
function lddPlShowWhatsNew(fresh){
  const ov=document.createElement("div");
  ov.className="ldd-vt-modal-ov";
  let body="";
  if(fresh.length===1){
    const f=fresh[0];
    body=`<canvas data-pl-newthumb="0" width="320" height="180" style="width:100%;height:auto;border-radius:8px;background:var(--ldd-bg);display:block"></canvas>
      <h3 style="font-size:.95rem;margin:10px 0 0">📄 ${lddVtEsc(f.name)}</h3>`;
  }else{
    body=`<div style="max-height:50vh;overflow:auto;display:flex;flex-direction:column;gap:6px">`+
      fresh.map(f=>`<div style="padding:8px 10px;border:1px solid var(--ldd-border);border-radius:8px;font-size:.85rem">📄 ${lddVtEsc(f.name)}</div>`).join("")+
      `</div>`;
  }
  ov.innerHTML=`<div class="ldd-vt-modal"><h2>🎉 New in the library</h2>
    <p style="font-size:.85rem;color:var(--ldd-muted);margin:0 0 12px">${fresh.length} new PDF${fresh.length===1?"":"s"} added:</p>
    ${body}
    <div class="mrow" style="margin-top:14px"><button class="ldd-vt-btn primary" id="ldd-pl-new-ok">Got it</button></div></div>`;
  ov.addEventListener("mousedown",e=>{if(e.target===ov)lddPlCloseWhatsNew(ov,fresh);});
  document.body.appendChild(ov);
  ov.querySelector("#ldd-pl-new-ok").onclick=()=>lddPlCloseWhatsNew(ov,fresh);
  // render thumbnail for single-item popup
  const cv=ov.querySelector("[data-pl-newthumb]");
  if(cv){
    const f=fresh[0];if(!f||!f.url)return;
    (async()=>{
      try{
        await lddPlEnsurePdfJs();
        const doc=await pdfjsLib.getDocument({url:f.url,rangeChunkSize:65536}).promise;
        const page=await doc.getPage(1);
        const vp=page.getViewport({scale:0.5});
        cv.width=vp.width;cv.height=vp.height;
        await page.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;
        try{await doc.destroy();}catch(_){}
      }catch(_){cv.style.display="none";}
    })();
  }
}
function lddPlCloseWhatsNew(ov,fresh){
  ov.remove();
}
let lddPlThumbObs=null;
const LDD_PL_THUMB_DB="lddPdfLibThumbs";
let lddPlThumbDb=null;
function lddPlThumbDbOpen(){
  return new Promise((res,rej)=>{
    if(lddPlThumbDb)return res(lddPlThumbDb);
    try{
      const rq=indexedDB.open(LDD_PL_THUMB_DB,1);
      rq.onupgradeneeded=()=>{try{rq.result.createObjectStore("thumbs");}catch(_){}};
      rq.onsuccess=()=>{lddPlThumbDb=rq.result;res(rq.result);};
      rq.onerror=()=>rej(rq.error||new Error("idb"));
    }catch(e){rej(e);}
  });
}
async function lddPlThumbGet(sha){
  try{
    const db=await lddPlThumbDbOpen();
    return await new Promise(res=>{
      try{
        const rq=db.transaction("thumbs","readonly").objectStore("thumbs").get(sha);
        rq.onsuccess=()=>res(rq.result||null);
        rq.onerror=()=>res(null);
      }catch(_){res(null);}
    });
  }catch(_){return null;}
}
function lddPlThumbSet(sha,dataUrl){
  lddPlThumbDbOpen().then(db=>{
    try{db.transaction("thumbs","readwrite").objectStore("thumbs").put(dataUrl,sha);}catch(_){}
  }).catch(()=>{});
}
// render queue: max 2 concurrent PDF parses
let lddPlThumbActive=0;
const lddPlThumbQueue=[];
function lddPlThumbPump(){
  while(lddPlThumbActive<2&&lddPlThumbQueue.length){
    const job=lddPlThumbQueue.shift();
    lddPlThumbActive++;
    job().finally(()=>{lddPlThumbActive--;lddPlThumbPump();});
  }
}
function lddPlRenderThumb(cv){
  const f=(lddPlUI.list||[])[+cv.dataset.plThumb];if(!f||!f.url||cv.dataset.plDone)return;
  cv.dataset.plDone="1";
  lddPlThumbQueue.push(async()=>{
    // 1. try cache
    try{
      const cached=await lddPlThumbGet(f.sha);
      if(cached){
        await new Promise(res=>{
          const img=new Image();
          img.onload=()=>{try{cv.width=img.width;cv.height=img.height;cv.getContext("2d").drawImage(img,0,0);}catch(_){}res();};
          img.onerror=()=>res();
          img.src=cached;
        });
        if(cv.width>10)return;
      }
    }catch(_){}
    // 2. render fresh
    try{
      await lddPlEnsurePdfJs();
      const doc=await pdfjsLib.getDocument({url:f.url,rangeChunkSize:65536}).promise;
      const page=await doc.getPage(1);
      const vp=page.getViewport({scale:0.35});
      cv.width=vp.width;cv.height=vp.height;
      await page.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;
      try{await doc.destroy();}catch(_){}
      try{lddPlThumbSet(f.sha,cv.toDataURL("image/jpeg",0.72));}catch(_){}
    }catch(_){cv.style.display="none";}
  });
  lddPlThumbPump();
}
async function lddPlRenderGrid(force){
  const root=lddVtRoot()||document;
  const grid=root.querySelector("#ldd-pl-grid"),cnt=root.querySelector("#ldd-pl-count");
  if(!grid)return;
  if(!lddPlConfigured()){
    cnt.textContent="";
    grid.innerHTML=`<div class="ldd-vt-empty"><h3>Not set up yet</h3><p>Enter the GitHub repo above and hit Save — drop your PDFs in that repo and they'll show up here.</p></div>`;
    return;
  }
  cnt.textContent="Loading…";
  grid.innerHTML="";
  try{
    let files=await lddPlFetchList(force);
    await lddPlLoadSeen();
    try{lddPlWhatsNew(files);}catch(_){}
    files.sort((a,b)=>{
      const fa=lddPlFavs.includes(a.sha)?1:0,fb=lddPlFavs.includes(b.sha)?1:0;
      if(fb!==fa)return fb-fa;
      return ((lddPlSeen&&lddPlSeen[b.sha])||0)-((lddPlSeen&&lddPlSeen[a.sha])||0);
    });
    // extension-level folder filter
    const af=lddPlActiveFolder;
    let folderFiles=files;
    if(af==="unfiled")folderFiles=files.filter(f=>!lddPlFileFolder[f.sha]);
    else if(af!=="all")folderFiles=files.filter(f=>lddPlFileFolder[f.sha]===af);
    const q=((lddPlUI.query)||"").trim().toLowerCase();
    if(q)folderFiles=folderFiles.filter(f=>(f.name+" "+f.file).toLowerCase().includes(q));
    lddPlUI.list=folderFiles;
    lddPlUI.allFiles=files;
    cnt.textContent=`${folderFiles.length} PDF${folderFiles.length===1?"":"s"} · ${lddVtEsc(lddPlSettings.owner+"/"+lddPlSettings.repo)}`;
    lddPlRenderFolderPills(root,files);
    if(lddPlThumbObs){try{lddPlThumbObs.disconnect();}catch(_){}}
    lddPlThumbObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){lddPlThumbObs.unobserve(e.target);lddPlRenderThumb(e.target);}});},{rootMargin:"300px"});
    const isList=lddPlUI.view==="list";
    grid.style.gridTemplateColumns=isList?"1fr":"repeat(4,1fr)";
    const starBtn=(f)=>`<button class="ldd-vt-iconbtn${lddPlFavs.includes(f.sha)?" on":""}" data-pl-fav="${f.sha}" title="Favorite" style="${isList?"":"position:absolute;top:8px;right:8px;z-index:2;background:rgba(0,0,0,.45);border-radius:8px;"}">★</button>`;
    grid.innerHTML=folderFiles.length?(isList
      ? `<div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1">`+files.map((f,i)=>`
        <div style="display:flex;gap:10px;align-items:center;padding:8px 12px;border:1px solid var(--ldd-border);border-radius:10px;background:var(--ldd-panel)">
          ${starBtn(f)}
          <span style="font-size:.88rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ${lddVtEsc(f.name)}</span>
          <span style="min-width:110px;max-width:150px">${lddPlFolderSelect(f.sha)}</span>
          ${f.size?`<span class="ldd-vt-tag">${lddPlFmtSize(f.size)}</span>`:""}
          <button class="ldd-vt-btn primary sm" data-pl-read="${i}">Read live</button>
          <button class="ldd-vt-btn ghost sm" data-pl-prompts="${i}">⧉ Prompts</button>
          <button class="ldd-vt-btn ghost sm" data-pl-save="${i}">${LDD_LUCIDE_DB}Save to Vault</button>
          <button class="ldd-vt-btn ghost sm" data-pl-dl="${i}">${LDD_LUCIDE_DL}Download</button>
        </div>`).join("")+`</div>`
      : files.map((f,i)=>`
      <div class="ldd-vt-card" style="position:relative;padding:10px">
        ${starBtn(f)}
        <canvas data-pl-thumb="${i}" width="320" height="180" style="width:100%;height:auto;border-radius:6px;background:var(--ldd-bg);display:block"></canvas>
        <h3 style="font-size:.82rem;margin:8px 0 4px;line-height:1.3">📄 ${lddVtEsc(f.name)}</h3>
        <div style="margin-bottom:6px">${lddPlFolderSelect(f.sha)}</div>
        ${f.size?`<div class="meta" style="margin-bottom:6px"><span class="ldd-vt-tag">${lddPlFmtSize(f.size)}</span></div>`:""}
        <div class="actions" style="gap:6px;flex-wrap:wrap">
          <button class="ldd-vt-btn primary sm" data-pl-read="${i}">Read live</button>
          <button class="ldd-vt-btn ghost sm" data-pl-prompts="${i}">⧉ Prompts</button>
          <button class="ldd-vt-btn ghost sm" data-pl-save="${i}">${LDD_LUCIDE_DB}Save to Vault</button>
          <button class="ldd-vt-btn ghost sm" data-pl-dl="${i}">${LDD_LUCIDE_DL}Download</button>
        </div>
      </div>`).join(""))
      :`<div class="ldd-vt-empty"><h3>No PDFs found</h3><p>${lddPlActiveFolder!=="all"?"Nothing in this folder yet.":`Drop .pdf files in the repo${lddPlSettings.path?" / "+lddVtEsc(lddPlSettings.path):""} and hit ↻.`}</p></div>`;
    const openLive=async f=>{
      if(!f||!f.url)return;
      const old=document.getElementById("ldd-pl-viewer-ov");
      if(old)old.remove();
      lddVtToast("Opening "+f.name+"…");
      try{
        const r=await fetch(f.url,{cache:"no-store"});
        if(!r.ok)throw new Error("fetch "+r.status);
        const blob=new Blob([await r.arrayBuffer()],{type:"application/pdf"});
        lddPlOpenViewer(f,URL.createObjectURL(blob));
      }catch(_){
        lddVtToast("Couldn't open "+f.name,true);
      }
    };
    grid.querySelectorAll("[data-pl-read]").forEach(b=>b.onclick=()=>{
      openLive((lddPlUI.list||[])[+b.dataset.plRead]);
    });
    grid.querySelectorAll("[data-pl-thumb]").forEach(cv=>{
      cv.style.cursor="pointer";cv.title="Open live";
      cv.onclick=()=>openLive((lddPlUI.list||[])[+cv.dataset.plThumb]);
    });
    grid.querySelectorAll("[data-pl-fav]").forEach(b=>b.onclick=e=>{e.stopPropagation();lddPlToggleFav(b.dataset.plFav);lddPlRenderGrid(false);});
    grid.querySelectorAll("[data-pl-move]").forEach(sel=>sel.onchange=()=>{
      const sha=sel.dataset.plMove;
      if(sel.value)lddPlFileFolder[sha]=sel.value;else delete lddPlFileFolder[sha];
      lddPlSaveFolders();lddPlRenderGrid(false);
    });
    grid.querySelectorAll("[data-pl-prompts]").forEach(b=>b.onclick=()=>{
      const f=(lddPlUI.list||[])[+b.dataset.plPrompts];if(!f)return;
      lddPlPromptPicker(f);
    });
    grid.querySelectorAll("[data-pl-save]").forEach(b=>b.onclick=()=>{
      const f=(lddPlUI.list||[])[+b.dataset.plSave];if(!f)return;
      lddPlSaveToVault(f);
    });
    grid.querySelectorAll("[data-pl-thumb]").forEach(cv=>{try{lddPlThumbObs.observe(cv);}catch(_){lddPlRenderThumb(cv);}});
    grid.querySelectorAll("[data-pl-dl]").forEach(b=>b.onclick=async()=>{
      const f=(lddPlUI.list||[])[+b.dataset.plDl];if(!f||!f.url)return;
      lddVtToast("Downloading "+f.file);
      try{
        if(chrome.downloads&&chrome.downloads.download){
          await chrome.downloads.download({url:f.url,filename:f.file});
          return;
        }
        throw new Error("no dl api");
      }catch(_){
        try{
          const r=await fetch(f.url,{cache:"no-store"});
          const blob=new Blob([await r.arrayBuffer()],{type:"application/pdf"});
          const bu=URL.createObjectURL(blob);
          const a=document.createElement("a");a.href=bu;a.download=f.file;
          document.body.appendChild(a);a.click();a.remove();
          setTimeout(()=>{try{URL.revokeObjectURL(bu);}catch(_){}},8000);
        }catch(_2){lddVtToast("Download failed",true);}
      }
    });
  }catch(err){
    cnt.textContent="";
    grid.innerHTML=`<div class="ldd-vt-empty"><h3>Couldn't load</h3><p>${lddVtEsc(err.message)}</p></div>`;
  }
}
async function lddPlPdfPrompts(f){
  await lddPlEnsurePdfJs();
  const doc=await pdfjsLib.getDocument({url:f.url,rangeChunkSize:65536}).promise;
  const pages=[];
  for(let pg=1;pg<=doc.numPages;pg++){
    const page=await doc.getPage(pg);
    const tc=await page.getTextContent();
    let t="";
    for(const it of tc.items){t+=it.str||"";t+=it.hasEOL?"\n":" ";}
    pages.push(t);
  }
  try{await doc.destroy();}catch(_){}
  return (typeof lddPvParsePdfPrompts==="function")?lddPvParsePdfPrompts(pages):[];
}
async function lddPlSaveToVault(f){
  lddVtToast("Reading "+f.name+"…");
  try{
    const prompts=await lddPlPdfPrompts(f);
    if(!prompts.length){lddVtToast("No prompts found in "+f.name,true);return 0;}
    if(typeof lddPvImportParsed!=="function"){lddVtToast("Prompt Vault not available",true);return 0;}
    await lddPvImportParsed(prompts,f.name);
    lddVtToast(`Saved ${prompts.length} prompts to Prompt Vault`);
    return prompts.length;
  }catch(_){
    lddVtToast("Couldn't save "+f.name,true);
    return 0;
  }
}
async function lddPlPromptPicker(f){
  const ov=document.createElement("div");
  ov.className="ldd-vt-modal-ov";
  ov.innerHTML=`<div class="ldd-vt-modal" style="max-width:660px"><h2>⧉ ${lddVtEsc(f.name)}</h2>
    <p style="font-size:.85rem;color:var(--ldd-muted)">Reading prompts…</p></div>`;
  ov.addEventListener("mousedown",e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
  const modal=ov.querySelector(".ldd-vt-modal");
  let prompts=[];
  try{
    lddVtToast("Reading "+f.name+"…");
    prompts=await lddPlPdfPrompts(f);
  }catch(_){modal.querySelector("p").textContent="Couldn't read this PDF.";return;}
  if(!prompts.length){modal.querySelector("p").textContent="No prompts found in this PDF.";return;}
  modal.innerHTML=`
    <h2>⧉ ${lddVtEsc(f.name)}</h2>
    <p style="font-size:.85rem;color:var(--ldd-muted);margin:0 0 10px">${prompts.length} prompts — click Copy on any row, or:</p>
    <div class="mrow" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <button class="ldd-vt-btn primary sm" id="ldd-pp-copyall">Copy all ${prompts.length}</button>
      <span style="display:flex;gap:6px;align-items:center">
        <input class="ldd-vt-input" id="ldd-pp-x" placeholder="X" style="width:52px" inputmode="numeric">
        <span style="color:var(--ldd-muted);font-size:.82rem">to</span>
        <input class="ldd-vt-input" id="ldd-pp-y" placeholder="Y" style="width:52px" inputmode="numeric">
        <button class="ldd-vt-btn sm" id="ldd-pp-copyrange">Copy</button>
      </span>
      <button class="ldd-vt-btn ghost sm" id="ldd-pp-save">💾 Save all to Prompt Vault</button>
    </div>
    <input class="ldd-vt-input" id="ldd-pp-q" placeholder="Filter prompts…" style="margin-bottom:8px">
    <div id="ldd-pp-list" style="display:flex;flex-direction:column;gap:6px;max-height:46vh;overflow:auto"></div>
    <div class="mrow" style="margin-top:10px"><button class="ldd-vt-btn ghost" id="ldd-pp-close">Close</button></div>`;
  const listEl=modal.querySelector("#ldd-pp-list");
  const fullText=p=>`${p.title}\n\n${p.body}`;
  const renderList=filter=>{
    const q=(filter||"").toLowerCase();
    const items=prompts.map((p,i)=>({p,i})).filter(({p})=>!q||(p.title+" "+p.body).toLowerCase().includes(q));
    listEl.innerHTML=items.map(({p,i})=>`
      <div style="display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid var(--ldd-border);border-radius:8px">
        <span style="color:var(--ldd-muted);font-size:.78rem;min-width:30px">${i+1}</span>
        <span style="flex:1;min-width:0"><strong style="font-size:.83rem">${lddVtEsc(p.title)}</strong>
        <div class="prev">${lddVtEsc(p.body.slice(0,110))}${p.body.length>110?"…":""}</div></span>
        <button class="ldd-vt-btn ghost sm" data-pp-copy="${i}">Copy</button>
      </div>`).join("")||`<div class="ldd-vt-empty">No matches</div>`;
    listEl.querySelectorAll("[data-pp-copy]").forEach(b=>b.onclick=()=>{
      const pr=prompts[+b.dataset.ppCopy];if(!pr)return;
      lddPvCopyText(fullText(pr),"Prompt copied");
    });
  };
  renderList("");
  modal.querySelector("#ldd-pp-q").addEventListener("input",e=>renderList(e.target.value));
  modal.querySelector("#ldd-pp-close").onclick=()=>ov.remove();
  modal.querySelector("#ldd-pp-copyall").onclick=()=>{
    lddPvCopyText(prompts.map(fullText).join("\n\n---\n\n"),`${prompts.length} prompts copied`);
  };
  modal.querySelector("#ldd-pp-copyrange").onclick=()=>{
    const x=parseInt(modal.querySelector("#ldd-pp-x").value,10),
          y=parseInt(modal.querySelector("#ldd-pp-y").value,10);
    if(!x||!y||x<1||y>prompts.length||x>y){lddVtToast(`Enter X to Y (1–${prompts.length})`,true);return;}
    lddPvCopyText(prompts.slice(x-1,y).map(fullText).join("\n\n---\n\n"),`Prompts ${x}–${y} copied`);
  };
  modal.querySelector("#ldd-pp-save").onclick=async()=>{
    ov.remove();
    lddPlSaveToVault(f);
  };
}
function lddPlOpenViewer(f,blobUrl){
  const host=document.getElementById("ldd-app-page")||document.body;
  const inApp=host.id==="ldd-app-page";
  const ov=document.createElement("div");
  ov.id="ldd-pl-viewer-ov";
  ov.style.cssText=(inApp?"position:absolute;":"position:fixed;")+"inset:0;z-index:999999;background:rgba(0,0,0,.88);display:flex;flex-direction:column";
  ov.innerHTML=`
    <div style="display:flex;gap:8px;align-items:center;padding:10px 14px;background:var(--ldd-panel);border-bottom:1px solid var(--ldd-border);flex-shrink:0">
      <strong style="flex:1;font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ${lddVtEsc(f.name)}</strong>
      <button class="ldd-vt-btn ghost sm" id="ldd-plv-prompts">⧉ Prompts</button>
      <button class="ldd-vt-btn ghost sm" id="ldd-plv-dl">⬇ Download</button>
      <button class="ldd-vt-btn sm" id="ldd-plv-close">✕ Close</button>
    </div>
    <iframe src="${blobUrl}" style="flex:1;border:0;background:#525659" title="${lddVtEsc(f.name)}"></iframe>`;
  host.appendChild(ov);
  const close=()=>{ov.remove();try{URL.revokeObjectURL(blobUrl);}catch(_){}};
  ov.querySelector("#ldd-plv-close").onclick=close;
  ov.querySelector("#ldd-plv-prompts").onclick=()=>lddPlPromptPicker(f);
  document.addEventListener("keydown",function esc(e){
    if(e.key==="Escape"&&document.getElementById("ldd-pl-viewer-ov")){close();document.removeEventListener("keydown",esc);}
  });
  ov.querySelector("#ldd-plv-dl").onclick=()=>{
    const a=document.createElement("a");
    a.href=blobUrl;a.download=f.file;
    document.body.appendChild(a);a.click();a.remove();
    lddVtToast("Downloading "+f.file);
  };
}
function lddBindPdfLibraryPage(o){
  Promise.all([lddPlLoadSettings(),lddPlLoadFavs(),lddPlLoadFolders()]).then(()=>{
    const root=lddVtRoot();
    const rf=root.querySelector("#ldd-pl-refresh");
    if(rf)rf.onclick=()=>lddPlRenderGrid(true);
    const viewBtn=root.querySelector("#ldd-pl-view");
    const syncViewBtn=()=>{if(viewBtn)viewBtn.textContent=lddPlUI.view==="list"?"▦ Grid":"☰ List";};
    syncViewBtn();
    if(viewBtn)viewBtn.onclick=()=>{lddPlUI.view=lddPlUI.view==="list"?"grid":"list";lddPlSaveView();syncViewBtn();lddPlRenderGrid(false);};
    const pq=root.querySelector("#ldd-pl-q");
    if(pq)pq.addEventListener("input",()=>{lddPlUI.query=pq.value;lddPlRenderGrid(false);});
    lddPlRenderGrid(true);
  });
}

/* ---------- Reader tab ---------- */

async function lddPlEnsurePdfJs(){
  if(!globalThis.pdfjsLib)throw new Error("PDF engine did not load — reload the extension");
  try{pdfjsLib.GlobalWorkerOptions.workerSrc=chrome.runtime.getURL("core/pdf-lib/pdf.worker.min.js");}catch(_){}
}

