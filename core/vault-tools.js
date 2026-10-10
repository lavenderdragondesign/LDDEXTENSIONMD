/* ============================================================
   LDD Vault Tools — native rebuild (v1.8.152)
   Prompt Vault and Image Vault rebuilt from the
   ground up as native extension pages. They use the extension's
   own theme variables (--ldd-*), so every One-Click Theme
   skins them automatically.
   Loaded after core/content.js (same content-script world).
   ============================================================ */

/* ---------- shared helpers ---------- */
function lddVtEsc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function lddVtUid(p){return (p||"id")+"_"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function lddVtToast(msg,isErr){try{globalThis.lddToast110(msg,!!isErr);}catch(_){}}
function lddVtStoreGet(key){return new Promise(res=>{try{chrome.storage.local.get(key,r=>res(r&&r[key]));}catch(_){res(undefined);}});}
function lddVtStoreSet(key,val){return new Promise(res=>{try{chrome.storage.local.set({[key]:val},()=>res());}catch(_){res();}});}
function lddVtRoot(){return document.getElementById("ldd-app-page");}
function lddVtInjectCss(){
  if(document.getElementById("ldd-vt-css"))return;
  const st=document.createElement("style");
  st.id="ldd-vt-css";
  st.textContent=`
  .ldd-vt-wrap{color:var(--ldd-text)}
  .ldd-vt-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 16px}
  .ldd-vt-toolbar .ldd-vt-search{flex:1 1 220px;min-width:180px}
  .ldd-vt-input,.ldd-vt-select,.ldd-vt-textarea{background:var(--ldd-bg);border:1px solid var(--ldd-border);color:var(--ldd-text);border-radius:calc(var(--ldd-radius) - 2px);padding:.6rem .8rem;font-size:.88rem;outline:none;width:100%;box-sizing:border-box}
  .ldd-vt-input:focus,.ldd-vt-select:focus,.ldd-vt-textarea:focus{border-color:var(--ldd-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ldd-accent) 25%,transparent)}
  .ldd-vt-input::placeholder,.ldd-vt-textarea::placeholder{color:var(--ldd-muted);opacity:.7}
  .ldd-vt-btn{display:inline-flex;align-items:center;gap:.5rem;border-radius:var(--ldd-radius);border:1px solid transparent;padding:.62rem .95rem;font-size:.85rem;font-weight:800;cursor:pointer;transition:.15s ease;white-space:nowrap}
  .ldd-vt-btn.primary{background:linear-gradient(135deg,var(--ldd-accent),var(--ldd-accent-3));color:#fff;border-color:rgba(255,255,255,.15);box-shadow:0 8px 22px color-mix(in srgb,var(--ldd-accent) 35%,transparent)}
  .ldd-vt-btn.primary:hover{transform:translateY(-1px);filter:brightness(1.08)}
  .ldd-vt-btn.ghost{background:var(--ldd-panel);border-color:var(--ldd-border);color:var(--ldd-text)}
  .ldd-vt-btn.ghost:hover{border-color:var(--ldd-accent);background:var(--ldd-hover)}
  .ldd-vt-btn.danger{background:rgba(244,63,94,.12);border-color:rgba(244,63,94,.4);color:#fda4af}
  .ldd-vt-btn.danger:hover{background:rgba(244,63,94,.22)}
  .ldd-vt-btn.sm{padding:.42rem .7rem;font-size:.78rem}
  .ldd-vt-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
  .ldd-vt-layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:16px;align-items:start}
  @media(max-width:900px){.ldd-vt-layout{grid-template-columns:1fr}}
  .ldd-vt-side{background:var(--ldd-panel);border:1px solid var(--ldd-border);border-radius:var(--ldd-radius);padding:12px;display:flex;flex-direction:column;gap:4px;position:sticky;top:12px;max-height:calc(100vh - 120px);overflow:auto}
  .ldd-vt-side h4{margin:2px 4px 8px;font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;color:var(--ldd-muted)}
  .ldd-vt-fbtn{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;background:transparent;border:1px solid transparent;color:var(--ldd-muted);border-radius:calc(var(--ldd-radius) - 4px);padding:.55rem .7rem;font-size:.86rem;font-weight:650;cursor:pointer}
  .ldd-vt-fbtn:hover{background:var(--ldd-hover);color:var(--ldd-text)}
  .ldd-vt-fbtn.active{background:var(--ldd-selected);color:var(--ldd-text);border-color:var(--ldd-accent)}
  .ldd-vt-fbtn .cnt{font-size:.72rem;opacity:.75;background:var(--ldd-hover);border-radius:99px;padding:.1rem .5rem}
  .ldd-vt-fbtn.active .cnt{background:var(--ldd-accent);color:#fff;opacity:1}
  .ldd-vt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
  .ldd-vt-card{background:var(--ldd-panel);border:1px solid var(--ldd-border);border-radius:var(--ldd-radius);padding:14px;display:flex;flex-direction:column;gap:8px;transition:.15s ease;min-width:0;position:relative}
  .ldd-pv-selcb{position:absolute;top:10px;right:10px;width:20px;height:20px;accent-color:var(--ldd-accent);cursor:pointer;z-index:2;margin:0}
  .ldd-vt-card:has(.ldd-pv-selcb) h3{padding-right:30px}
  .ldd-vt-card:hover{transform:translateY(-2px);border-color:var(--ldd-accent);box-shadow:0 14px 34px rgba(0,0,0,.35)}
  .ldd-vt-card h3{margin:0;font-size:.95rem;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .ldd-vt-card .prev{font-size:.8rem;color:var(--ldd-muted);line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;white-space:pre-wrap}
  .ldd-vt-card .meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  .ldd-vt-tag{font-size:.68rem;font-weight:700;background:var(--ldd-selected);border:1px solid var(--ldd-accent);color:var(--ldd-text);border-radius:99px;padding:.16rem .55rem}
  .ldd-vt-card .actions{display:flex;gap:6px;margin-top:auto;padding-top:6px;border-top:1px solid var(--ldd-border)}
  .ldd-vt-iconbtn{border:1px solid var(--ldd-border);background:var(--ldd-hover);color:var(--ldd-text);border-radius:8px;min-width:30px;height:30px;cursor:pointer;font-size:.85rem;display:inline-flex;align-items:center;justify-content:center;padding:0 8px}
  .ldd-vt-iconbtn:hover{border-color:var(--ldd-accent)}
  .ldd-vt-iconbtn.on{background:var(--ldd-accent);border-color:var(--ldd-accent);color:#fff}
  .ldd-vt-empty{border:1px dashed var(--ldd-border);border-radius:var(--ldd-radius);padding:38px 20px;text-align:center;color:var(--ldd-muted);grid-column:1/-1}
  .ldd-vt-empty h3{color:var(--ldd-text);margin:0 0 8px}
  .ldd-vt-modal-ov{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(6px)}
  .ldd-vt-modal{width:min(640px,100%);max-height:88vh;overflow:auto;background:var(--ldd-panel,#12161c);border:1px solid var(--ldd-accent,#39ff14);border-radius:calc(var(--ldd-radius,12px) + 6px);box-shadow:0 30px 90px rgba(0,0,0,.6);padding:20px;resize:both;min-width:min(340px,90vw);min-height:240px}
  .ldd-vt-modal.wide{width:min(1180px,96%)}
  .ldd-vt-modal{max-height:94vh}
  .ldd-vt-modal h2{margin:0 0 14px;font-size:1.15rem}
  .ldd-vt-modal .frow{display:grid;gap:6px;margin-bottom:12px}
  .ldd-vt-modal .frow label{font-size:.78rem;font-weight:700;color:var(--ldd-muted)}
  .ldd-vt-modal .mrow{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
  .ldd-vt-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:640px){.ldd-vt-2col{grid-template-columns:1fr}}
  .ldd-vt-imggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  .ldd-vt-imgcard{background:var(--ldd-panel);border:1px solid var(--ldd-border);border-radius:var(--ldd-radius);overflow:hidden;transition:.15s ease;position:relative}
  .ldd-vt-imgcard:hover{border-color:var(--ldd-accent);transform:translateY(-2px)}
  .ldd-vt-imgcard.sel{border-color:var(--ldd-accent);box-shadow:0 0 0 2px var(--ldd-accent)}
  .ldd-vt-thumb{aspect-ratio:1/1;background:repeating-conic-gradient(rgba(255,255,255,.06) 0 25%,transparent 0 50%) 0 0/18px 18px,rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer}
  .ldd-vt-thumb img{width:100%;height:100%;object-fit:contain}
  .ldd-vt-imgcard .ibody{padding:8px 10px;display:grid;gap:6px}
  .ldd-vt-imgcard .iname{font-size:.76rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ldd-vt-imgcard .imeta{font-size:.68rem;color:var(--ldd-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ldd-vt-check{position:absolute;top:8px;left:8px;width:20px;height:20px;accent-color:var(--ldd-accent);cursor:pointer;z-index:2}
  .ldd-vt-fav{position:absolute;top:6px;right:6px;z-index:2}
  .ldd-vt-stats{font-size:.76rem;color:var(--ldd-muted);margin-bottom:10px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
  `;
  document.head.appendChild(st);
}
function lddPvSeedData(){
 const F=["T-Shirt Prompts","Sticker Prompts","Mockup Prompts","Graduation Prompts","Christian Designs","Funny Shirts","Photo Transformations","Negative Prompts","JSON Prompts","Converted JSON"];
 const folders=F.map((n,i)=>({id:"pvf_"+i,name:n,order:i,createdAt:Date.now()}));
 const S={};
 S["T-Shirt Prompts"]={"title": "T-Shirt Sample: Retro Camping Club", "body": "Create a generic print-ready t-shirt graphic about retro camping club. Use bold readable typography, balanced supporting illustration, centered composition, transparent background, clean vector-style edges, safe margins, and a creator-friendly POD layout. Sample prompt 01.", "negative": "mockup, shirt photo, fabric texture, watermark, blurry text, misspelled words, duplicate text, cropped edges, low resolution, messy outlines", "tags": ["shirt", "pod", "print-ready"], "category": "T-Shirt"};
 S["Sticker Prompts"]={"title": "Sticker Sample: Sleepy Dragon", "body": "Create a generic die-cut sticker illustration featuring a sleepy dragon. Use a thick clean white border, simple charming shapes, expressive face, bold outline, transparent background outside the sticker border, centered placement, and print-ready detail. Sample prompt 01.", "negative": "photorealistic, complex background, thin lines, no sticker border, watermark, blurry edges, cropped sticker, low resolution", "tags": ["sticker", "die-cut", "cute"], "category": "Sticker"};
 S["Mockup Prompts"]={"title": "Mockup Sample: White Sweatshirt Flat Lay", "body": "Create a clean generic product mockup scene for a white sweatshirt flat lay. Use soft natural lighting, uncluttered composition, realistic product placement, room for artwork preview, warm neutral styling, Etsy listing polish, and no branded props. Sample prompt 01.", "negative": "watermark, brand logo, busy background, warped product, unreadable design, harsh shadows, low resolution, cropped product", "tags": ["mockup", "product", "etsy"], "category": "Mockup"};
 S["Graduation Prompts"]={"title": "Graduation Sample: Classic Senior Poster", "body": "Create a generic graduation design concept for a classic senior poster. Use celebratory energy, cap and gown details, bold year placement, polished poster composition, optional confetti and glow effects, safe margins, and editable name/year areas. Sample prompt 01.", "negative": "misspelled name, wrong year, distorted face, extra fingers, messy typography, low detail, cropped head, watermark", "tags": ["graduation", "senior", "poster"], "category": "Graduation"};
 S["Christian Designs"]={"title": "Christian Design Sample: Minimal Cross Floral", "body": "Create a respectful generic Christian faith-based design about minimal cross floral. Use elegant readable lettering, warm boutique colors, tasteful supporting elements, centered transparent-background layout, clean print-ready edges, and no denominational branding. Sample prompt 01.", "negative": "mockup, shirt photo, unreadable scripture, misspelled text, extra words, watermark, harsh distress, cropped design", "tags": ["faith", "christian", "shirt"], "category": "Christian Design"};
 S["Funny Shirts"]={"title": "Funny Shirt Sample: Tired But Trying", "body": "Create a generic funny t-shirt design about tired but trying. Use big readable humor typography, playful supporting icon, strong contrast, transparent background, centered POD composition, and clean vector-style print edges. Sample prompt 01.", "negative": "offensive slurs, copyrighted characters, watermark, misspelled text, duplicate words, blurry typography, cropped design, fabric texture", "tags": ["funny", "shirt", "humor"], "category": "Funny Shirt"};
 S["Photo Transformations"]={"title": "Photo Transformation Sample: Storybook Portrait", "body": "Transform an uploaded reference photo into a generic storybook portrait. Preserve recognizable likeness, keep the subject centered, use a polished stylized finish, safe cropping margins, cohesive background, and clean high-resolution detail. Sample prompt 01.", "negative": "identity change, distorted face, extra fingers, cropped limbs, blurry details, harsh artifacts, watermark, low resolution", "tags": ["photo", "transformation", "portrait"], "category": "Photo Transformation"};
 S["Negative Prompts"]={"title": "Negative Prompt Sample: Typography Cleanup", "body": "Reusable negative prompt pack for typography cleanup. Paste this into the negative prompt field to reduce common generation problems for print-ready creative assets. Sample prompt 01.", "negative": "no watermark, no extra text, no duplicate text, no misspelled text, no garbled letters, no distorted typography, no blurry edges, no messy outlines, no cropped design, no low resolution, no background artifacts", "tags": ["negative", "quality", "cleanup"], "category": "Negative Prompt"};
 S["JSON Prompts"]={"title": "JSON Prompt Sample: Simple T-Shirt Json", "body": "Create a structured LDD-style JSON prompt object for a generic simple t-shirt json. Include selected style, subject, niche fit, keywords, exact_text when needed, prompt, negative_prompt, common failure risks, fix instructions, and variant suggestions. Sample prompt 01.", "negative": "invalid json, missing fields, markdown fences, extra commentary, duplicate keys, empty required fields, vague prompt, weak negative prompt", "tags": ["json", "schema", "image-prompt"], "category": "JSON Prompt"};
 S["Converted JSON"]={"title": "Converted JSON Sample: Converted T-Shirt Prompt", "body": "Converted JSON sample for a generic converted t-shirt prompt. Use this folder for JSON objects that have already been converted into usable combined prompts or saved from the converter tools. Sample prompt 01.", "negative": "broken formatting, missing negative prompt, invalid json structure, copied markdown, extra text outside json, low detail, unclear subject", "tags": ["converted", "json", "prompt"], "category": "Converted JSON"};
 const prompts=folders.slice(0,10).map((f,i)=>{const s=S[f.name]||{title:f.name+" Sample",body:"",negative:"",tags:[],category:"General"};
  return{id:"pvp_"+i,title:s.title,body:s.body,negative:s.negative||"",tags:s.tags,category:s.category,folderId:f.id,isFavorite:i===0,createdAt:Date.now()-i*1000,updatedAt:Date.now()-i*1000};});
 return{folders,prompts,trashed:[],settings:{ownerName:""}};}
/* ================= PROMPT VAULT ================= */
const LDD_PV_KEY="lddPromptVaultV1";
let lddPv={folders:[],prompts:[],trashed:[],settings:{ownerName:""}};
let lddPvUI={folder:"all",query:"",sort:"newest",page:1,perPage:24,selectMode:false,selected:new Set()};
async function lddPvLoad(){
  const d=await lddVtStoreGet(LDD_PV_KEY);
  if(d&&Array.isArray(d.folders)){lddPv=d;lddPv.trashed=d.trashed||[];lddPv.settings=d.settings||{ownerName:""};return;}
  lddPv=lddPvSeedData();
  await lddVtStoreSet(LDD_PV_KEY,lddPv);
  lddVtToast("Prompt Vault ready — 10 starter folders, 1 sample each");
}
function lddPvSave(){return lddVtStoreSet(LDD_PV_KEY,lddPv);}
function lddPvFolderName(id){const f=lddPv.folders.find(x=>x.id===id);return f?f.name:"";}
function lddPvVisible(){
  let list=lddPv.prompts.slice();
  const f=lddPvUI.folder;
  if(f==="favorites")list=list.filter(p=>p.isFavorite);
  else if(f!=="all")list=list.filter(p=>p.folderId===f);
  const q=lddPvUI.query.trim().toLowerCase();
  if(q)list=list.filter(p=>(p.title+" "+p.body+" "+(p.tags||[]).join(" ")+" "+(p.category||"")).toLowerCase().includes(q));
  const s=lddPvUI.sort;
  list.sort((a,b)=>s==="oldest"?a.createdAt-b.createdAt:s==="name"?String(a.title).localeCompare(String(b.title)):b.createdAt-a.createdAt);
  return list;
}
function lddRenderPromptVaultPage(o){
  lddVtInjectCss();
  const name=(lddPv.settings&&lddPv.settings.ownerName)||"";
  return `<div class="ldd-page-title"><h2>📁 Prompt Vault</h2><p>${lddVtEsc(name?name+"'s prompt library":"Your prompt library — folders, favorites, JSON import/export")}.</p></div>
  <div class="ldd-vt-wrap"><div class="ldd-vt-toolbar">
    <input class="ldd-vt-input ldd-vt-search" id="ldd-pv-q" placeholder="Search title, body, tags…" value="${lddVtEsc(lddPvUI.query)}">
    <select class="ldd-vt-select" id="ldd-pv-sort" style="width:auto">
      <option value="newest"${lddPvUI.sort==="newest"?" selected":""}>Newest</option>
      <option value="oldest"${lddPvUI.sort==="oldest"?" selected":""}>Oldest</option>
      <option value="name"${lddPvUI.sort==="name"?" selected":""}>Name A–Z</option>
    </select>
    <button class="ldd-vt-btn primary" id="ldd-pv-new">+ New Prompt</button>
    <button class="ldd-vt-btn ghost" id="ldd-pv-selmode">☐ Select</button>
    <button class="ldd-vt-btn ghost" id="ldd-pv-export" title="Export your vault as JSON to share with other LDD Tools users">Export</button>
    <button class="ldd-vt-btn ghost" id="ldd-pv-import" title="Import a JSON backup or a prompt-pack PDF — the PDF becomes its own folder">Import PDF / JSON</button>
    <input type="file" id="ldd-pv-importfile" accept=".json,.pdf,application/json,application/pdf" style="display:none">
  </div>
  <div class="ldd-vt-layout">
    <aside class="ldd-vt-side"><h4>Library</h4><div id="ldd-pv-folders"></div>
      <h4 style="margin-top:10px">Folders</h4><div id="ldd-pv-folderlist"></div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <input class="ldd-vt-input" id="ldd-pv-newfolder" placeholder="New folder" style="font-size:.8rem">
        <button class="ldd-vt-iconbtn" id="ldd-pv-addfolder" title="Add folder">+</button>
      </div>
    </aside>
    <div><div class="ldd-vt-stats"><span id="ldd-pv-count"></span></div><div class="ldd-vt-grid" id="ldd-pv-grid"></div></div>
  </div></div>`;
}
function lddPvRefresh(){lddPvRenderLists();lddPvRenderGrid();}
function lddPvExitSelect(){
  lddPvUI.selected.clear();lddPvUI.selectMode=false;
  const b=(lddVtRoot()||document).querySelector("#ldd-pv-selmode");
  if(b){b.innerHTML="☐ Select";b.classList.remove("primary");b.classList.add("ghost");}
  lddPvRefresh();
}
function lddPvRenderLists(){
  const root=lddVtRoot()||document;
  const libEl=root.querySelector("#ldd-pv-folders"),flEl=root.querySelector("#ldd-pv-folderlist");
  if(!libEl)return;
  const favN=lddPv.prompts.filter(p=>p.isFavorite).length;
  const lib=[["all","🗂 All Prompts",lddPv.prompts.length],["favorites","♡ Favorites",favN],["trash","🗑 Trash",lddPv.trashed.length]];
  libEl.innerHTML=lib.map(([id,label,n])=>`<button class="ldd-vt-fbtn${lddPvUI.folder===id?" active":""}" data-pv-folder="${id}"><span>${label}</span><span class="cnt">${n}</span></button>`).join("");
  flEl.innerHTML=lddPv.folders.slice().sort((a,b)=>a.order-b.order).map(f=>{
    const n=lddPv.prompts.filter(p=>p.folderId===f.id).length;
    return `<div style="display:flex;gap:4px;align-items:center"><button class="ldd-vt-fbtn${lddPvUI.folder===f.id?" active":""}" data-pv-folder="${f.id}" style="flex:1"><span>📁 ${lddVtEsc(f.name)}</span><span class="cnt">${n}</span></button><button class="ldd-vt-iconbtn" data-pv-delfolder="${f.id}" title="Delete folder" style="min-width:26px;height:26px">×</button></div>`;
  }).join("")||`<div style="font-size:.78rem;color:var(--ldd-muted);padding:4px">No folders yet.</div>`;
  libEl.querySelectorAll("[data-pv-folder]").forEach(b=>b.onclick=()=>{lddPvUI.folder=b.dataset.pvFolder;lddPvUI.page=1;lddPvUI.selected.clear();lddPvRefresh();});
  flEl.querySelectorAll("[data-pv-folder]").forEach(b=>b.onclick=()=>{lddPvUI.folder=b.dataset.pvFolder;lddPvUI.page=1;lddPvUI.selected.clear();lddPvRefresh();});
  flEl.querySelectorAll("[data-pv-delfolder]").forEach(b=>b.onclick=async e=>{e.stopPropagation();
    const id=b.dataset.pvDelfolder,f=lddPv.folders.find(x=>x.id===id);
    if(!f)return;
    const n=lddPv.prompts.filter(p=>p.folderId===id).length;
    if(!confirm(n?`Delete folder "${f.name}"? Its ${n} prompt${n===1?"":"s"} move to Trash.`:`Delete folder "${f.name}"?`))return;
    lddPv.folders=lddPv.folders.filter(x=>x.id!==id);
    const doomed=lddPv.prompts.filter(p=>p.folderId===id);
    lddPv.prompts=lddPv.prompts.filter(p=>p.folderId!==id);
    lddPv.trashed.push(...doomed);
    if(lddPvUI.folder===id)lddPvUI.folder="all";
    await lddPvSave();lddPvRefresh();
  });
}
function lddPvPagerHTML(pages){
  const per=lddPvUI.perPage||24;
  if(pages<=1)return "";
  return `<div style="display:flex;gap:10px;align-items:center;justify-content:center;margin-top:14px;flex-wrap:wrap">
    <button class="ldd-vt-btn ghost sm" id="ldd-pv-prev"${lddPvUI.page<=1?" disabled":""}>« Prev</button>
    <span style="font-size:.82rem;color:var(--ldd-muted)">Page ${lddPvUI.page} of ${pages}</span>
    <button class="ldd-vt-btn ghost sm" id="ldd-pv-next"${lddPvUI.page>=pages?" disabled":""}>Next »</button>
    <select id="ldd-pv-perpage" class="ldd-vt-select" style="width:auto;padding:.3rem .5rem;font-size:.78rem">${[12,24,48,96].map(n=>`<option value="${n}"${per===n?" selected":""}>${n}/page</option>`).join("")}</select></div>`;
}
function lddPvBindPager(grid){
  lddPvBindPager(grid);
}
function lddPvRenderGrid(){
  const root=lddVtRoot()||document;
  const grid=root.querySelector("#ldd-pv-grid"),cnt=root.querySelector("#ldd-pv-count");
  if(!grid)return;
  if(lddPvUI.folder==="trash"){
    let tlist=lddPv.trashed.slice();
    const tq=lddPvUI.query.trim().toLowerCase();
    if(tq)tlist=tlist.filter(p=>((p.title||"")+" "+(p.body||"")+" "+(p.tags||[]).join(" ")).toLowerCase().includes(tq));
    const per=lddPvUI.perPage||24,pages=Math.max(1,Math.ceil(tlist.length/per));
    if(lddPvUI.page>pages)lddPvUI.page=pages;
    if(lddPvUI.page<1)lddPvUI.page=1;
    const shown=tlist.slice((lddPvUI.page-1)*per,lddPvUI.page*per);
    cnt.textContent=`${tlist.length} in trash${pages>1?` — page ${lddPvUI.page}/${pages}`:""}`;
    const tsel=lddPvUI.selectMode;
    let tselbar="";
    if(tsel)tselbar=`<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
      <button class="ldd-vt-btn ghost sm" id="ldd-pv-tselpage">Select page</button>
      <button class="ldd-vt-btn ghost sm" id="ldd-pv-tselall">Select all ${tlist.length}</button>
      <span style="display:flex;gap:4px;align-items:center;font-size:.78rem;color:var(--ldd-muted)"><input id="ldd-pv-trfrom" type="number" min="1" max="${tlist.length}" placeholder="#" class="ldd-vt-input" style="width:64px;padding:.3rem .5rem;font-size:.78rem"> to <input id="ldd-pv-trto" type="number" min="1" max="${tlist.length}" placeholder="#" class="ldd-vt-input" style="width:64px;padding:.3rem .5rem;font-size:.78rem"> <button class="ldd-vt-btn ghost sm" id="ldd-pv-trgo">Select</button></span>
      <button class="ldd-vt-btn danger sm" id="ldd-pv-tseldel"${lddPvUI.selected.size?"":" disabled"}>Delete forever (${lddPvUI.selected.size})</button>
      <button class="ldd-vt-btn ghost sm" id="ldd-pv-tselcancel">Cancel</button></div>`;
    grid.innerHTML=tselbar+(tlist.length?shown.map(p=>`
      <div class="ldd-vt-card">
      ${tsel?`<input type="checkbox" class="ldd-pv-selcb" data-pv-tsel="${p.id}"${lddPvUI.selected.has(p.id)?" checked":""} title="Select">`:""}
      <h3>${lddVtEsc(p.title)}</h3><div class="prev">${lddVtEsc(String(p.body||"").slice(0,140))}</div>
      <div class="actions"><button class="ldd-vt-iconbtn" data-pv-restore="${p.id}" title="Restore">↩ Restore</button><button class="ldd-vt-iconbtn" data-pv-delperm="${p.id}" title="Delete forever" style="color:#fda4af">Delete</button></div></div>`).join("")
      :`<div class="ldd-vt-empty"><h3>Trash is empty</h3><p>Deleted prompts land here.</p></div>`)+lddPvPagerHTML(pages);
    grid.querySelectorAll("[data-pv-restore]").forEach(b=>b.onclick=async()=>{const i=lddPv.trashed.findIndex(x=>x.id===b.dataset.pvRestore);if(i<0)return;const[p]=lddPv.trashed.splice(i,1);lddPv.prompts.push(p);await lddPvSave();lddPvRefresh();});
    grid.querySelectorAll("[data-pv-delperm]").forEach(b=>b.onclick=async()=>{if(!confirm("Delete forever?"))return;lddPv.trashed=lddPv.trashed.filter(x=>x.id!==b.dataset.pvDelperm);await lddPvSave();lddPvRefresh();});
    grid.querySelectorAll("[data-pv-tsel]").forEach(cb=>cb.onchange=()=>{
      if(cb.checked)lddPvUI.selected.add(cb.dataset.pvTsel);else lddPvUI.selected.delete(cb.dataset.pvTsel);
      const del=grid.querySelector("#ldd-pv-tseldel");
      if(del){del.textContent=`Delete forever (${lddPvUI.selected.size})`;del.disabled=!lddPvUI.selected.size;}
    });
    const tSelPage=grid.querySelector("#ldd-pv-tselpage");
    if(tSelPage)tSelPage.onclick=()=>{shown.forEach(p=>lddPvUI.selected.add(p.id));lddPvRenderGrid();};
    const tSelAll=grid.querySelector("#ldd-pv-tselall");
    if(tSelAll)tSelAll.onclick=()=>{tlist.forEach(p=>lddPvUI.selected.add(p.id));lddPvRenderGrid();};
    const tRGo=grid.querySelector("#ldd-pv-trgo");
    if(tRGo)tRGo.onclick=()=>{
      let a=+grid.querySelector("#ldd-pv-trfrom").value||0,b=+grid.querySelector("#ldd-pv-trto").value||0;
      if(!a&&!b)return;if(!a)a=b;if(!b)b=a;if(a>b)[a,b]=[b,a];
      a=Math.max(1,Math.min(a,tlist.length));b=Math.max(1,Math.min(b,tlist.length));
      for(let i=a-1;i<b;i++)lddPvUI.selected.add(tlist[i].id);
      lddPvRenderGrid();lddVtToast(`Selected ${b-a+1}`);
    };
    const tSelDel=grid.querySelector("#ldd-pv-tseldel");
    if(tSelDel)tSelDel.onclick=async()=>{
      if(!lddPvUI.selected.size)return;
      if(!confirm(`Delete ${lddPvUI.selected.size} prompt${lddPvUI.selected.size===1?"":"s"} FOREVER? This cannot be undone.`))return;
      const ids=lddPvUI.selected;
      lddPv.trashed=lddPv.trashed.filter(p=>!ids.has(p.id));
      await lddPvSave();lddPvExitSelect();lddVtToast("Deleted forever");
    };
    const tSelCancel=grid.querySelector("#ldd-pv-tselcancel");
    if(tSelCancel)tSelCancel.onclick=()=>lddPvExitSelect();
    lddPvBindPager(grid);
    return;
  }
  const list=lddPvVisible();
  const per=lddPvUI.perPage||24,pages=Math.max(1,Math.ceil(list.length/per));
  if(lddPvUI.page>pages)lddPvUI.page=pages;
  if(lddPvUI.page<1)lddPvUI.page=1;
  const shown=list.slice((lddPvUI.page-1)*per,lddPvUI.page*per);
  cnt.textContent=`${list.length} prompt${list.length===1?"":"s"}${pages>1?` — page ${lddPvUI.page}/${pages}`:""}`;
  const sel=lddPvUI.selectMode;
  let selbar="";
  if(sel)selbar=`<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
    <button class="ldd-vt-btn ghost sm" id="ldd-pv-selpage">Select page</button>
    <button class="ldd-vt-btn ghost sm" id="ldd-pv-selall">Select all ${list.length}</button>
    <span style="display:flex;gap:4px;align-items:center;font-size:.78rem;color:var(--ldd-muted)"><input id="ldd-pv-rfrom" type="number" min="1" max="${list.length}" placeholder="#" class="ldd-vt-input" style="width:64px;padding:.3rem .5rem;font-size:.78rem"> to <input id="ldd-pv-rto" type="number" min="1" max="${list.length}" placeholder="#" class="ldd-vt-input" style="width:64px;padding:.3rem .5rem;font-size:.78rem"> <button class="ldd-vt-btn ghost sm" id="ldd-pv-rgo">Select</button></span>
    <button class="ldd-vt-btn danger sm" id="ldd-pv-seldel"${lddPvUI.selected.size?"":" disabled"}>Delete (${lddPvUI.selected.size})</button>
    <button class="ldd-vt-btn ghost sm" id="ldd-pv-selcancel">Cancel</button></div>`;
  let pager=lddPvPagerHTML(pages);
  grid.innerHTML=selbar+(shown.length?shown.map(p=>`
    <div class="ldd-vt-card">
      ${sel?`<input type="checkbox" class="ldd-pv-selcb" data-pv-sel="${p.id}"${lddPvUI.selected.has(p.id)?" checked":""} title="Select">`:""}
      <h3>${lddVtEsc(p.title)}</h3>
      <div class="prev">${lddVtEsc(String(p.body||"").slice(0,160))}</div>
      <div class="meta">${p.isFavorite?`<span class="ldd-vt-tag">★ fav</span>`:""}${p.category?`<span class="ldd-vt-tag">${lddVtEsc(p.category)}</span>`:""}${p.folderId?`<span class="ldd-vt-tag">📁 ${lddVtEsc(lddPvFolderName(p.folderId))}</span>`:""}${(p.tags||[]).slice(0,3).map(t=>`<span class="ldd-vt-tag">${lddVtEsc(t)}</span>`).join("")}</div>
      <div class="actions">
        <button class="ldd-vt-iconbtn ${p.isFavorite?"on":""}" data-pv-fav="${p.id}" title="Favorite">★</button>
        <button class="ldd-vt-iconbtn" data-pv-view="${p.id}" title="View">👁</button>
        <button class="ldd-vt-iconbtn" data-pv-edit="${p.id}" title="Edit">✎</button>
        <button class="ldd-vt-iconbtn" data-pv-copy="${p.id}" title="Copy prompt">⧉</button>
        <button class="ldd-vt-iconbtn" data-pv-trash="${p.id}" title="Trash" style="margin-left:auto;color:#fda4af">🗑</button>
      </div>
    </div>`).join("")
    :`<div class="ldd-vt-empty"><h3>No prompts here yet</h3><p>Create one with + New Prompt, or import JSON.</p></div>`)+pager;
  const q=s=>grid.querySelectorAll(s);
  q("[data-pv-sel]").forEach(cb=>cb.onchange=()=>{
    if(cb.checked)lddPvUI.selected.add(cb.dataset.pvSel);else lddPvUI.selected.delete(cb.dataset.pvSel);
    const del=grid.querySelector("#ldd-pv-seldel");
    if(del){del.textContent=`Delete (${lddPvUI.selected.size})`;del.disabled=!lddPvUI.selected.size;}
  });
  const rGo=grid.querySelector("#ldd-pv-rgo");
  if(rGo)rGo.onclick=()=>{
    let a=+grid.querySelector("#ldd-pv-rfrom").value||0,b=+grid.querySelector("#ldd-pv-rto").value||0;
    if(!a&&!b)return;
    if(!a)a=b;if(!b)b=a;
    if(a>b)[a,b]=[b,a];
    a=Math.max(1,Math.min(a,list.length));b=Math.max(1,Math.min(b,list.length));
    for(let i=a-1;i<b;i++)lddPvUI.selected.add(list[i].id);
    lddPvRenderGrid();lddVtToast(`Selected ${b-a+1}`);
  };
  const selPage=grid.querySelector("#ldd-pv-selpage");
  if(selPage)selPage.onclick=()=>{shown.forEach(p=>lddPvUI.selected.add(p.id));lddPvRenderGrid();};
  const selAll=grid.querySelector("#ldd-pv-selall");
  if(selAll)selAll.onclick=()=>{list.forEach(p=>lddPvUI.selected.add(p.id));lddPvRenderGrid();};
  const selCancel=grid.querySelector("#ldd-pv-selcancel");
  if(selCancel)selCancel.onclick=()=>lddPvExitSelect();
  const selDel=grid.querySelector("#ldd-pv-seldel");
  if(selDel)selDel.onclick=async()=>{
    if(!lddPvUI.selected.size)return;
    if(!confirm(`Move ${lddPvUI.selected.size} prompt${lddPvUI.selected.size===1?"":"s"} to Trash?`))return;
    const ids=lddPvUI.selected;
    const doomed=lddPv.prompts.filter(p=>ids.has(p.id));
    lddPv.prompts=lddPv.prompts.filter(p=>!ids.has(p.id));
    lddPv.trashed.push(...doomed);
    await lddPvSave();lddPvExitSelect();lddVtToast(`Moved ${doomed.length} to trash`);
  };
  const prev=grid.querySelector("#ldd-pv-prev");
  if(prev)prev.onclick=()=>{if(lddPvUI.page>1){lddPvUI.page--;lddPvRenderGrid();window.scrollTo({top:0,behavior:"smooth"});}};
  const next=grid.querySelector("#ldd-pv-next");
  if(next)next.onclick=()=>{lddPvUI.page++;lddPvRenderGrid();window.scrollTo({top:0,behavior:"smooth"});};
  const pp=grid.querySelector("#ldd-pv-perpage");
  if(pp)pp.onchange=()=>{lddPvUI.perPage=+pp.value;lddPvUI.page=1;lddPvRenderGrid();};
  q("[data-pv-fav]").forEach(b=>b.onclick=async()=>{const p=lddPv.prompts.find(x=>x.id===b.dataset.pvFav);if(p){p.isFavorite=!p.isFavorite;p.updatedAt=Date.now();await lddPvSave();lddPvRefresh();}});
  q("[data-pv-view]").forEach(b=>b.onclick=()=>lddPvViewModal(b.dataset.pvView));
  q("[data-pv-edit]").forEach(b=>b.onclick=()=>lddPvEditModal(b.dataset.pvEdit));
  q("[data-pv-copy]").forEach(b=>b.onclick=()=>{const p=lddPv.prompts.find(x=>x.id===b.dataset.pvCopy);if(p)lddPvCopyText(lddPvFullText(p),"Prompt copied");});
  q("[data-pv-trash]").forEach(b=>b.onclick=async()=>{const i=lddPv.prompts.findIndex(x=>x.id===b.dataset.pvTrash);if(i<0)return;const[p]=lddPv.prompts.splice(i,1);lddPv.trashed.push(p);await lddPvSave();lddPvRefresh();lddVtToast("Moved to trash");});
}
function lddPvFullText(p){return [p.body,p.negativePrompt?("NEGATIVE PROMPT:\n"+p.negativePrompt):""].filter(Boolean).join("\n\n");}
function lddPvCopyText(t,msg){
  const done=()=>lddVtToast(msg||"Copied");
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done).catch(()=>lddPvCopyFallback(t,done));
  else lddPvCopyFallback(t,done);
}
function lddPvCopyFallback(t,done){const ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done();}catch(_){lddVtToast("Copy failed",true);}ta.remove();}
function lddPvModal(html,wide){
  document.querySelector(".ldd-vt-modal-ov")?.remove();
  const ov=document.createElement("div");
  ov.className="ldd-vt-modal-ov";
  try{
    const src=document.getElementById("ldd-app-page")||document.documentElement;
    const cs=getComputedStyle(src);
    ["--ldd-panel","--ldd-bg","--ldd-text","--ldd-muted","--ldd-accent","--ldd-accent-3","--ldd-border","--ldd-hover","--ldd-selected","--ldd-radius"].forEach(v=>{const val=cs.getPropertyValue(v);if(val&&val.trim())ov.style.setProperty(v,val.trim());});
  }catch(_){}
  ov.innerHTML=`<div class="ldd-vt-modal${wide?" wide":""}">${html}</div>`;
  ov.addEventListener("mousedown",e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
  return ov;
}
function lddPvEditModal(id){
  const p=id?lddPv.prompts.find(x=>x.id===id):{id:lddVtUid("pvp"),title:"",body:"",negative:"",tags:[],category:"",folderId:lddPvUI.folder!=="all"&&lddPvUI.folder!=="favorites"?lddPvUI.folder:"",isFavorite:false,createdAt:Date.now(),updatedAt:Date.now()};
  if(!p)return;
  const cats=["T-Shirt","Sticker","Mockup","Graduation","Christian Design","Funny Shirt","Photo Transformation","Negative Prompt","JSON Prompt","Converted JSON","Other"];
  const ov=lddPvModal(`
    <h2>${id?"Edit Prompt":"New Prompt"}</h2>
    <div class="frow"><label>Title</label><input class="ldd-vt-input" id="ldd-pv-f-title" value="${lddVtEsc(p.title)}"></div>
    <div class="ldd-vt-2col">
      <div class="frow"><label>Category</label><select class="ldd-vt-select" id="ldd-pv-f-cat">${cats.map(c=>`<option${(p.category||"")==c?" selected":""}>${c}</option>`).join("")}</select></div>
      <div class="frow"><label>Folder</label><select class="ldd-vt-select" id="ldd-pv-f-folder"><option value="">— No folder —</option>${lddPv.folders.map(f=>`<option value="${f.id}"${p.folderId===f.id?" selected":""}>${lddVtEsc(f.name)}</option>`).join("")}</select></div>
    </div>
    <div class="frow"><label>Prompt body</label><textarea class="ldd-vt-textarea" id="ldd-pv-f-body" rows="12">${lddVtEsc(p.body)}</textarea></div>
    <div class="frow"><label>Negative prompt (optional)</label><textarea class="ldd-vt-textarea" id="ldd-pv-f-neg" rows="3">${lddVtEsc(p.negative||"")}</textarea></div>
    <div class="frow"><label>Tags (comma separated)</label><input class="ldd-vt-input" id="ldd-pv-f-tags" value="${lddVtEsc((p.tags||[]).join(", "))}"></div>
    <div class="mrow"><button class="ldd-vt-btn ghost" id="ldd-pv-f-cancel">Cancel</button><button class="ldd-vt-btn primary" id="ldd-pv-f-save">Save Prompt</button></div>`,true);
  ov.querySelector("#ldd-pv-f-cancel").onclick=()=>ov.remove();
  ov.querySelector("#ldd-pv-f-save").onclick=async()=>{
    p.title=ov.querySelector("#ldd-pv-f-title").value.trim()||"Untitled prompt";
    p.body=ov.querySelector("#ldd-pv-f-body").value;
    p.negative=ov.querySelector("#ldd-pv-f-neg").value;
    p.tags=ov.querySelector("#ldd-pv-f-tags").value.split(",").map(t=>t.trim()).filter(Boolean).slice(0,12);
    p.category=ov.querySelector("#ldd-pv-f-cat").value;
    p.folderId=ov.querySelector("#ldd-pv-f-folder").value;
    p.updatedAt=Date.now();
    if(!lddPv.prompts.find(x=>x.id===p.id))lddPv.prompts.push(p);
    await lddPvSave();ov.remove();lddPvRefresh();lddVtToast("Prompt saved");
  };
}
function lddPvViewModal(id){
  const p=lddPv.prompts.find(x=>x.id===id);if(!p)return;
  const ov=lddPvModal(`
    <h2>${lddVtEsc(p.title)}</h2>
    <div class="meta" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${p.isFavorite?`<span class="ldd-vt-tag">★ Favorite</span>`:""}${p.category?`<span class="ldd-vt-tag">${lddVtEsc(p.category)}</span>`:""}${p.folderId?`<span class="ldd-vt-tag">📁 ${lddVtEsc(lddPvFolderName(p.folderId))}</span>`:""}${(p.tags||[]).map(t=>`<span class="ldd-vt-tag">${lddVtEsc(t)}</span>`).join("")}</div>
    <div class="frow"><label>Prompt</label><div style="white-space:pre-wrap;font-size:.88rem;line-height:1.65;background:var(--ldd-bg);border:1px solid var(--ldd-border);border-radius:8px;padding:12px;max-height:300px;overflow:auto">${lddVtEsc(p.body)||'<span style="color:var(--ldd-muted)">(empty)</span>'}</div></div>
    ${p.negative?`<div class="frow"><label>Negative prompt</label><div style="white-space:pre-wrap;font-size:.85rem;line-height:1.6;background:var(--ldd-bg);border:1px solid var(--ldd-border);border-radius:8px;padding:12px">${lddVtEsc(p.negative)}</div></div>`:""}
    <div class="mrow"><button class="ldd-vt-btn ghost" id="ldd-pv-v-close">Close</button><button class="ldd-vt-btn ghost" id="ldd-pv-v-edit">Edit</button><button class="ldd-vt-btn primary" id="ldd-pv-v-copy">Copy Prompt</button></div>`,true);
  ov.querySelector("#ldd-pv-v-close").onclick=()=>ov.remove();
  ov.querySelector("#ldd-pv-v-edit").onclick=()=>{ov.remove();lddPvEditModal(id);};
  ov.querySelector("#ldd-pv-v-copy").onclick=()=>lddPvCopyText(lddPvFullText(p),"Prompt copied");
}
function lddBindPromptVaultPage(o){
  lddPvRenderLists();lddPvRenderGrid();
  const root=lddVtRoot();
  const q=root.querySelector("#ldd-pv-q");
  q.addEventListener("input",()=>{lddPvUI.query=q.value;lddPvUI.page=1;lddPvRenderGrid();});
  root.querySelector("#ldd-pv-sort").onchange=e=>{lddPvUI.sort=e.target.value;lddPvUI.page=1;lddPvRenderGrid();};
  root.querySelector("#ldd-pv-new").onclick=()=>lddPvEditModal(null);
  const selModeBtn=root.querySelector("#ldd-pv-selmode");
  if(selModeBtn)selModeBtn.onclick=()=>{
    lddPvUI.selectMode=!lddPvUI.selectMode;
    if(!lddPvUI.selectMode)lddPvUI.selected.clear();
    lddPvUI.page=1;
    selModeBtn.innerHTML=lddPvUI.selectMode?"☑ Selecting":"☐ Select";
    selModeBtn.classList.toggle("primary",lddPvUI.selectMode);
    selModeBtn.classList.toggle("ghost",!lddPvUI.selectMode);
    lddPvRefresh();
  };
  root.querySelector("#ldd-pv-addfolder").onclick=async()=>{
    const inp=root.querySelector("#ldd-pv-newfolder"),nm=inp.value.trim();
    if(!nm)return;
    lddPv.folders.push({id:lddVtUid("pvf"),name:nm.slice(0,60),order:lddPv.folders.length,createdAt:Date.now()});
    await lddPvSave();lddPvRefresh();lddVtToast("Folder added");
  };
  root.querySelector("#ldd-pv-export").onclick=async()=>{
    const data=JSON.stringify({app:"ldd-prompt-vault",version:1,exportedAt:new Date().toISOString(),folders:lddPv.folders,prompts:lddPv.prompts},null,2);
    const blob=new Blob([data],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="prompt-vault.json";a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    lddVtToast("Vault exported");
  };
  const imp=root.querySelector("#ldd-pv-importfile");
  root.querySelector("#ldd-pv-import").onclick=()=>imp.click();
  imp.onchange=()=>{
    const f=imp.files[0];imp.value="";if(!f)return;
    if(/\.pdf$/i.test(f.name)){lddPvImportPdf(f);return;}
    const r=new FileReader();
    r.onload=async()=>{
      try{
        const d=JSON.parse(r.result);
        const folders=Array.isArray(d.folders)?d.folders:[],prompts=Array.isArray(d.prompts)?d.prompts:[];
        if(!folders.length&&!prompts.length)throw new Error("nothing to import");
        const idMap={};
        folders.forEach(f=>{const nid=lddVtUid("pvf");idMap[f.id]=nid;lddPv.folders.push({id:nid,name:String(f.name||"Imported").slice(0,60),order:lddPv.folders.length,createdAt:Date.now()});});
        prompts.forEach(p=>{lddPv.prompts.push({id:lddVtUid("pvp"),title:String(p.title||"Untitled").slice(0,140),body:String(p.body||p.combinedPrompt||""),negative:String(p.negative||p.negativePrompt||""),tags:Array.isArray(p.tags)?p.tags.slice(0,12):String(p.tags||"").split(",").map(t=>t.trim()).filter(Boolean).slice(0,12),category:String(p.category||""),folderId:idMap[p.folderId]||"",isFavorite:!!p.isFavorite,createdAt:Date.now(),updatedAt:Date.now()});});
        await lddPvSave();lddPvRefresh();lddVtToast(`Imported ${folders.length} folders, ${prompts.length} prompts`);
      }catch(err){lddVtToast("Import failed: "+err.message,true);}
    };
    r.readAsText(f);
  };
}

/* ================= IMAGE VAULT ================= */
const LDD_IV_DB="ldd-prompt-vault-image-db",LDD_IV_VER=1;
let lddIv={db:null,images:[],folders:[],folder:"all",query:"",sort:"newest",selected:new Set(),previewId:null,urls:new Map()};
function lddIvTx(store,mode){return lddIv.db.transaction(store,mode||"readonly").objectStore(store);}
function lddIvAll(store){return new Promise((res,rej)=>{const r=lddIvTx(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
function lddIvPut(store,v){return new Promise((res,rej)=>{const r=lddIvTx(store,"readwrite").put(v);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function lddIvDel(store,id){return new Promise((res,rej)=>{const r=lddIvTx(store,"readwrite").delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
async function lddIvOpenDb(){
  if(lddIv.db)return;
  lddIv.db=await new Promise((res,rej)=>{
    const rq=indexedDB.open(LDD_IV_DB,LDD_IV_VER);
    rq.onupgradeneeded=()=>{const db=rq.result;
      if(!db.objectStoreNames.contains("images")){const s=db.createObjectStore("images",{keyPath:"id"});s.createIndex("folderId","folderId",{unique:false});s.createIndex("createdAt","createdAt",{unique:false});}
      if(!db.objectStoreNames.contains("imageFolders"))db.createObjectStore("imageFolders",{keyPath:"id"});};
    rq.onsuccess=()=>res(rq.result);rq.onerror=()=>rej(rq.error);
  });
}
async function lddIvRefresh(){
  try{
    await lddIvOpenDb();
    lddIv.images=await lddIvAll("images");
    lddIv.folders=await lddIvAll("imageFolders");
  }catch(err){lddVtToast("Image Vault storage unavailable",true);}
}
function lddIvFmt(n){if(!n)return"0 B";const u=["B","KB","MB","GB"];const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),3);return (n/Math.pow(1024,i)).toFixed(i?1:0)+" "+u[i];}
function lddIvUrl(img){
  if(!lddIv.urls.has(img.id)){
    const blob=img.thumb?new Blob([img.thumb],{type:img.thumbType||"image/png"}):new Blob([img.data],{type:img.type||"image/png"});
    lddIv.urls.set(img.id,URL.createObjectURL(blob));
  }
  return lddIv.urls.get(img.id);
}
function lddIvVisible(){
  let list=lddIv.images.slice();
  if(lddIv.folder==="favorites")list=list.filter(x=>x.favorite);
  else if(lddIv.folder!=="all")list=list.filter(x=>x.folderId===lddIv.folder);
  const q=lddIv.query.trim().toLowerCase();
  if(q)list=list.filter(x=>(x.name+" "+(x.tags||[]).join(" ")+" "+(x.notes||"")).toLowerCase().includes(q));
  const s=lddIv.sort;
  list.sort((a,b)=>s==="oldest"?a.createdAt-b.createdAt:s==="name"?String(a.name).localeCompare(String(b.name)):s==="largest"?b.size-a.size:b.createdAt-a.createdAt);
  return list;
}
function lddRenderImageVaultPage(o){
  lddVtInjectCss();
  return `<div class="ldd-page-title"><h2>🖼 Image Vault</h2><p>Local image library — folders, tags, ZIP backup. Stored in your browser.</p></div>
  <div class="ldd-vt-wrap"><div class="ldd-vt-toolbar">
    <label class="ldd-vt-btn primary" style="cursor:pointer">+ Add Images<input type="file" id="ldd-iv-files" accept="image/*" multiple style="display:none"></label>
    <input class="ldd-vt-input ldd-vt-search" id="ldd-iv-q" placeholder="Search name, tag, notes…" value="${lddVtEsc(lddIv.query)}">
    <select class="ldd-vt-select" id="ldd-iv-sort" style="width:auto">
      <option value="newest"${lddIv.sort==="newest"?" selected":""}>Newest</option>
      <option value="oldest"${lddIv.sort==="oldest"?" selected":""}>Oldest</option>
      <option value="name"${lddIv.sort==="name"?" selected":""}>Name A–Z</option>
      <option value="largest"${lddIv.sort==="largest"?" selected":""}>Largest</option>
    </select>
    <button class="ldd-vt-btn ghost sm" id="ldd-iv-selall">Select visible</button>
    <button class="ldd-vt-btn ghost sm" id="ldd-iv-zip">Download ZIP</button>
    <button class="ldd-vt-btn danger sm" id="ldd-iv-delsel">Delete selected</button>
  </div>
  <div class="ldd-vt-layout">
    <aside class="ldd-vt-side"><h4>Library</h4><div id="ldd-iv-lib"></div>
      <h4 style="margin-top:10px">Folders</h4><div id="ldd-iv-folders"></div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <input class="ldd-vt-input" id="ldd-iv-newfolder" placeholder="New folder" style="font-size:.8rem">
        <button class="ldd-vt-iconbtn" id="ldd-iv-addfolder" title="Add folder">+</button>
      </div>
    </aside>
    <div><div class="ldd-vt-stats"><span id="ldd-iv-count"></span><span id="ldd-iv-selcount"></span></div><div class="ldd-vt-imggrid" id="ldd-iv-grid"></div></div>
  </div></div>`;
}
function lddIvRefreshUI(){lddIvRenderSide();lddIvRenderGrid();}
function lddIvRenderSide(){
  const root=lddVtRoot();if(!root||!root.querySelector("#ldd-iv-lib"))return;
  const favN=lddIv.images.filter(x=>x.favorite).length;
  root.querySelector("#ldd-iv-lib").innerHTML=[["all","🗂 All",lddIv.images.length],["favorites","★ Favorites",favN]]
    .map(([id,l,n])=>`<button class="ldd-vt-fbtn${lddIv.folder===id?" active":""}" data-iv-f="${id}"><span>${l}</span><span class="cnt">${n}</span></button>`).join("");
  root.querySelector("#ldd-iv-folders").innerHTML=lddIv.folders.map(f=>{
    const n=lddIv.images.filter(x=>x.folderId===f.id).length;
    return `<div style="display:flex;gap:4px;align-items:center"><button class="ldd-vt-fbtn${lddIv.folder===f.id?" active":""}" data-iv-f="${f.id}" style="flex:1"><span>📁 ${lddVtEsc(f.name)}</span><span class="cnt">${n}</span></button><button class="ldd-vt-iconbtn" data-iv-df="${f.id}" title="Delete folder" style="min-width:26px;height:26px">×</button></div>`;
  }).join("")||`<div style="font-size:.78rem;color:var(--ldd-muted);padding:4px">No folders yet.</div>`;
  root.querySelectorAll("[data-iv-f]").forEach(b=>b.onclick=()=>{lddIv.folder=b.dataset.ivF;lddIvRefreshUI();});
  root.querySelectorAll("[data-iv-df]").forEach(b=>b.onclick=async e=>{e.stopPropagation();
    if(!confirm("Delete this folder? Images move to All."))return;
    const id=b.dataset.ivDf;
    lddIv.folders=lddIv.folders.filter(f=>f.id!==id);
    for(const im of lddIv.images.filter(x=>x.folderId===id)){im.folderId="";await lddIvPut("images",im);}
    await lddIvDel("imageFolders",id);
    if(lddIv.folder===id)lddIv.folder="all";
    await lddIvRefresh();lddIvRefreshUI();
  });
}
function lddIvRenderGrid(){
  const root=lddVtRoot();const grid=root&&root.querySelector("#ldd-iv-grid");if(!grid)return;
  const list=lddIvVisible();
  const total=lddIv.images.reduce((a,x)=>a+(x.size||0),0);
  root.querySelector("#ldd-iv-count").textContent=`${list.length} image${list.length===1?"":"s"} · ${lddIvFmt(total)} total`;
  const updSel=()=>{root.querySelector("#ldd-iv-selcount").textContent=lddIv.selected.size?`${lddIv.selected.size} selected`:"";};
  updSel();
  grid.innerHTML=list.length?list.map(x=>`
    <div class="ldd-vt-imgcard${lddIv.selected.has(x.id)?" sel":""}">
      <input type="checkbox" class="ldd-vt-check" data-iv-sel="${x.id}"${lddIv.selected.has(x.id)?" checked":""} title="Select">
      <button class="ldd-vt-iconbtn ldd-vt-fav${x.favorite?" on":""}" data-iv-fav="${x.id}" title="Favorite">★</button>
      <div class="ldd-vt-thumb" data-iv-view="${x.id}"><img loading="lazy" src="${lddIvUrl(x)}" alt=""></div>
      <div class="ibody"><div class="iname" title="${lddVtEsc(x.name)}">${lddVtEsc(x.name)}</div>
      <div class="imeta">${lddIvFmt(x.size)}${x.width?` · ${x.width}×${x.height}`:""}</div></div>
    </div>`).join("")
    :`<div class="ldd-vt-empty"><h3>No images yet</h3><p>Add images to start your local library.</p></div>`;
  grid.querySelectorAll("[data-iv-sel]").forEach(c=>c.onchange=()=>{c.checked?lddIv.selected.add(c.dataset.ivSel):lddIv.selected.delete(c.dataset.ivSel);c.closest(".ldd-vt-imgcard").classList.toggle("sel",c.checked);updSel();});
  grid.querySelectorAll("[data-iv-fav]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const x=lddIv.images.find(i=>i.id===b.dataset.ivFav);if(!x)return;x.favorite=!x.favorite;await lddIvPut("images",x);await lddIvRefresh();lddIvRefreshUI();});
  grid.querySelectorAll("[data-iv-view]").forEach(t=>t.onclick=()=>lddIvViewModal(t.dataset.ivView));
}
function lddIvViewModal(id){
  const x=lddIv.images.find(i=>i.id===id);if(!x)return;
  const fullUrl=URL.createObjectURL(new Blob([x.data],{type:x.type||"image/png"}));
  const ov=lddPvModal(`
    <h2 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lddVtEsc(x.name)}</h2>
    <div style="text-align:center;margin-bottom:14px;background:rgba(0,0,0,.3);border-radius:10px;padding:10px"><img src="${fullUrl}" style="max-width:100%;max-height:46vh;border-radius:8px" alt=""></div>
    <div class="frow"><label>Name</label><input class="ldd-vt-input" id="ldd-iv-e-name" value="${lddVtEsc(x.name)}"></div>
    <div class="ldd-vt-2col">
      <div class="frow"><label>Folder</label><select class="ldd-vt-select" id="ldd-iv-e-folder"><option value="">— No folder —</option>${lddIv.folders.map(f=>`<option value="${f.id}"${x.folderId===f.id?" selected":""}>${lddVtEsc(f.name)}</option>`).join("")}</select></div>
      <div class="frow"><label>Tags (comma separated)</label><input class="ldd-vt-input" id="ldd-iv-e-tags" value="${lddVtEsc((x.tags||[]).join(", "))}"></div>
    </div>
    <div class="frow"><label>Notes</label><textarea class="ldd-vt-textarea" id="ldd-iv-e-notes" rows="3">${lddVtEsc(x.notes||"")}</textarea></div>
    <div class="mrow">
      <button class="ldd-vt-btn danger" id="ldd-iv-e-del">Delete</button>
      <span style="flex:1"></span>
      <button class="ldd-vt-btn ghost" id="ldd-iv-e-close">Close</button>
      <button class="ldd-vt-btn ghost" id="ldd-iv-e-dl">Download</button>
      <button class="ldd-vt-btn primary" id="ldd-iv-e-save">Save</button>
    </div>`,true);
  ov.querySelector("#ldd-iv-e-close").onclick=()=>{URL.revokeObjectURL(fullUrl);ov.remove();};
  ov.querySelector("#ldd-iv-e-save").onclick=async()=>{
    x.name=ov.querySelector("#ldd-iv-e-name").value.trim()||x.name;
    x.folderId=ov.querySelector("#ldd-iv-e-folder").value;
    x.tags=ov.querySelector("#ldd-iv-e-tags").value.split(",").map(t=>t.trim()).filter(Boolean).slice(0,12);
    x.notes=ov.querySelector("#ldd-iv-e-notes").value.slice(0,2000);
    await lddIvPut("images",x);await lddIvRefresh();URL.revokeObjectURL(fullUrl);ov.remove();lddIvRefreshUI();lddVtToast("Saved");
  };
  ov.querySelector("#ldd-iv-e-del").onclick=async()=>{
    if(!confirm("Delete this image?"))return;
    await lddIvDel("images",x.id);lddIv.urls.delete(x.id);lddIv.selected.delete(x.id);
    await lddIvRefresh();URL.revokeObjectURL(fullUrl);ov.remove();lddIvRefreshUI();lddVtToast("Deleted");
  };
  ov.querySelector("#ldd-iv-e-dl").onclick=()=>{
    const a=document.createElement("a");a.href=fullUrl;a.download=x.name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(fullUrl),4000);
  };
}
function lddIvMakeThumb(dataUrl){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      const max=420,sc=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      c.toBlob(b=>b?b.arrayBuffer().then(ab=>res({thumb:ab,width:img.width,height:img.height})):res(null),"image/png");
    };
    img.onerror=()=>res(null);img.src=dataUrl;
  });
}
async function lddBindImageVaultPage(o){
  await lddIvRefresh();
  lddIvRenderSide();lddIvRenderGrid();
  const root=lddVtRoot();
  const fi=root.querySelector("#ldd-iv-files");
  fi.onchange=async()=>{
    const files=[...fi.files];fi.value="";if(!files.length)return;
    lddVtToast(`Adding ${files.length} image${files.length===1?"":"s"}…`);
    let n=0;
    for(const f of files){
      try{
        if(!f.type.startsWith("image/"))continue;
        const buf=await f.arrayBuffer();
        const dataUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(new Blob([buf],{type:f.type}));});
        const th=await lddIvMakeThumb(dataUrl);
        await lddIvPut("images",{id:lddVtUid("iv"),name:f.name,type:f.type,size:f.size||buf.byteLength,data:buf,thumb:th?th.thumb:null,thumbType:"image/png",width:th?th.width:0,height:th?th.height:0,folderId:lddIv.folder!=="all"&&lddIv.folder!=="favorites"?lddIv.folder:"",tags:[],notes:"",favorite:false,createdAt:Date.now()});
        n++;
      }catch(err){console.warn("iv add failed",err);}
    }
    await lddIvRefresh();lddIvRefreshUI();lddVtToast(`Added ${n} image${n===1?"":"s"}`);
  };
  const q=root.querySelector("#ldd-iv-q");
  q.addEventListener("input",()=>{lddIv.query=q.value;lddIvRenderGrid();});
  root.querySelector("#ldd-iv-sort").onchange=e=>{lddIv.sort=e.target.value;lddIvRenderGrid();};
  root.querySelector("#ldd-iv-addfolder").onclick=async()=>{
    const inp=root.querySelector("#ldd-iv-newfolder"),nm=inp.value.trim();if(!nm)return;
    await lddIvPut("imageFolders",{id:lddVtUid("ivf"),name:nm.slice(0,60),createdAt:Date.now()});
    await lddIvRefresh();lddIvRefreshUI();lddVtToast("Folder added");
  };
  root.querySelector("#ldd-iv-selall").onclick=()=>{lddIvVisible().forEach(x=>lddIv.selected.add(x.id));lddIvRenderGrid();};
  root.querySelector("#ldd-iv-delsel").onclick=async()=>{
    if(!lddIv.selected.size){lddVtToast("Nothing selected",true);return;}
    if(!confirm(`Delete ${lddIv.selected.size} selected image${lddIv.selected.size===1?"":"s"}?`))return;
    for(const id of lddIv.selected){await lddIvDel("images",id);lddIv.urls.delete(id);}
    lddIv.selected.clear();await lddIvRefresh();lddIvRefreshUI();lddVtToast("Deleted");
  };
  root.querySelector("#ldd-iv-zip").onclick=async()=>{
    const list=lddIvVisible().filter(x=>lddIv.selected.size?lddIv.selected.has(x.id):true);
    if(!list.length){lddVtToast("Nothing to download",true);return;}
    lddVtToast("Building ZIP…");
    try{
      const files=list.map(x=>({name:x.name,data:new Uint8Array(x.data)}));
      const zip=typeof lddZipStore1875==="function"?lddZipStore1875(files):null;
      if(!zip)throw new Error("zip engine missing");
      const blob=new Blob([zip],{type:"application/zip"});
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="image-vault.zip";document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href),4000);
      lddVtToast(`Downloaded ${files.length} image${files.length===1?"":"s"}`);
    }catch(err){lddVtToast("ZIP failed: "+err.message,true);}
  };
}

/* ---------- Prompt Vault: PDF import ----------
   A prompt PDF becomes its own folder (collection): one prompt
   per numbered entry, tagged from the PDF's section headers. */
function lddPvPdfFolderName(fileName){
  let n=String(fileName||"PDF Import").replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim();
  n=n.replace(/\b\d+\s*(illustration\s*)?prompts?$/i,"").trim();
  n=n.replace(/\s{2,}/g," ");
  return n.slice(0,60)||"PDF Import";
}
function lddPvParsePdfPrompts(pages){
  const prompts=[];
  const fullText=pages.join("\n");
  /* Format B: "001\\nTITLE IN CAPS" — 3-digit number on its own line, caps title next.
     (Format A "1. Title" is handled below.) */
  const fmtBRe=/^[ \t]*(\d{3})[ \t]*\n[ \t]*([A-Z0-9][A-Z0-9 '&!.,\-–—]{2,80})[ \t]*$/gm;
  const bHits=[...fullText.matchAll(fmtBRe)];
  if(bHits.length>=5){
    const promptTitleIdx=new Set(bHits.map(h=>h.index));
    const secRe=/^[ \t]*([A-Z][A-Z &'’-]{2,40})[ \t]*$/gm;
    const secs=[];
    let sm;
    while((sm=secRe.exec(fullText))){
      if(promptTitleIdx.has(sm.index))continue;
      const txt=sm[1].trim();
      if(/^(CONCEPT|PALETTE|TEXT|TYPOGRAPHY|STYLE|FINISH)$/i.test(txt))continue;
      secs.push({idx:sm.index,name:txt});
    }
    bHits.forEach((h,hi)=>{
      const title=h[2].trim();
      const start=h.index, end=hi+1<bHits.length?bHits[hi+1].index:fullText.length;
      let body=fullText.slice(start,end).trim().replace(/\n{3,}/g,"\n\n");
      body=body.replace(/^[ \t]*\d{3}[ \t]*\n[ \t]*[^\n]+\n/,"").trim();
      if(body.length<20)return;
      let section="";
      for(let si=secs.length-1;si>=0;si--){if(secs[si].idx<start){section=secs[si].name;break;}}
      const secTag=section?section.toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g,""):"";
      prompts.push({title,body,tags:["pdf-import",secTag].filter(Boolean),category:"Other",section});
    });
    return prompts;
  }
  /* Format A: "1. Title" — the (?<![#\dA-Fa-f]) guard stops hex color codes
     like #443229 from matching as "229." */
  const headerRe=/(?<![#\dA-Fa-f])(\d{1,3})\.(?!\d)\s+([^\n—–-]{3,90}?)(?:\s*[—–-]\s*([^\n]{0,140}))?(?=\n|$)/;
  const secReA=/^([A-Z][A-Z &']{2,40}?)\s*[—–-]\s*\d+\s*PROMPTS/im;
  let section="";
  pages.forEach((pageText)=>{
    if(!pageText)return;
    const secHit=pageText.match(secReA);
    if(secHit)section=secHit[1].trim();
    const heads=[];
    const re=new RegExp(headerRe.source,"g");
    let m;
    while((m=re.exec(pageText))){heads.push({idx:m.index,num:m[1],title:m[2].trim(),sub:(m[3]||"").trim(),head:m[0]});}
    const secTag=section?section.toLowerCase().split(/\s+/)[0]:"";
    heads.forEach((h,hi)=>{
      const start=h.idx,end=hi+1<heads.length?heads[hi+1].idx:pageText.length;
      let body=pageText.slice(start,end).trim().replace(/\n{3,}/g,"\n\n");
      if(body.length<20)return;
      prompts.push({title:h.title,body,tags:["pdf-import",secTag].filter(Boolean),category:"Other",section});
    });
  });
  /* Format C (fallback): unnumbered — one prompt per paragraph block.
     Only used when no numbered entries were found at all. */
  if(!prompts.length){
    const blocks=fullText.split(/\n\s*\n/).map(b=>b.replace(/^[•\-*▪◦–—\s]+/,"").trim())
      .filter(b=>b.length>=30&&b.length<=2000&&!/^LDD\s*\//i.test(b)&&!/^\d+$/.test(b));
    if(blocks.length>=5){
      blocks.forEach(b=>{
        const lines=b.split("\n").map(x=>x.trim()).filter(Boolean);
        let title=lines[0]||"";
        if(lines.length===1&&title.length>90){
          const sent=title.match(/^(.{25,90}?[.!?])(\s|$)/);
          title=sent?sent[1]:title.slice(0,90).replace(/\s+\S*$/,"")+"…";
        }else if(title.length>110){
          const sent=title.match(/^(.{25,110}?[.!?])(\s|$)/);
          title=sent?sent[1]:title.slice(0,110).replace(/\s+\S*$/,"");
        }
        if(!title)title=b.slice(0,80);
        prompts.push({title:title.slice(0,140),body:b.slice(0,12000),tags:["pdf-import"],category:"Other",section:""});
      });
    }
  }
  return prompts;
}
let lddPvPdfJsReady=null;
function lddPvEnsurePdfJs(){
  if(lddPvPdfJsReady)return lddPvPdfJsReady;
  lddPvPdfJsReady=(async()=>{
    if(!globalThis.pdfjsLib)throw new Error("PDF engine did not load — reload the extension");
    try{pdfjsLib.GlobalWorkerOptions.workerSrc=chrome.runtime.getURL("core/pdf-lib/pdf.worker.min.js");}catch(_){}
    return true;
  })();
  return lddPvPdfJsReady;
}
async function lddPvExtractPdfText(buf){
  await lddPvEnsurePdfJs();
  const doc=await pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;
  const pages=[];
  try{
    for(let i=1;i<=doc.numPages;i++){
      const pg=await doc.getPage(i);
      const tc=await pg.getTextContent();
      let t="";
      for(const it of tc.items){t+=it.str||"";t+=it.hasEOL?"\n":" ";}
      pages.push(t.replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim());
    }
  }finally{try{await doc.destroy();}catch(_){}}
  return pages;
}
async function lddPvImportPdf(file){
  lddVtToast("Reading PDF…");
  try{
    const buf=await file.arrayBuffer();
    const pages=await lddPvExtractPdfText(buf);
    const found=lddPvParsePdfPrompts(pages);
    if(!found.length)throw new Error("No prompts found in this PDF");
    const folderName=lddPvPdfFolderName(file.name);
    const folder={id:lddVtUid("pvf"),name:folderName,order:lddPv.folders.length,createdAt:Date.now()};
    lddPv.folders.push(folder);
    const now=Date.now();
    found.forEach((p,i)=>lddPv.prompts.push({id:lddVtUid("pvp"),title:p.title.slice(0,140),body:p.body.slice(0,12000),negative:"",tags:p.tags.slice(0,8),category:p.category,folderId:folder.id,isFavorite:false,createdAt:now-i,updatedAt:now-i}));
    await lddPvSave();
    lddPvUI.folder=folder.id;lddPvUI.query="";
    {const _q=(lddVtRoot()||document).querySelector("#ldd-pv-q");if(_q)_q.value="";}
    lddPvRefresh();
    lddVtToast(`Imported ${found.length} prompts → “${folderName}”`);
  }catch(err){lddVtToast("PDF import failed: "+err.message,true);}
}

/* ============================================================
   Favorites manager (v1.8.167)
   Native home for preset + product favorites — the same
   lddPresetFavs / lddCatalogFavs stores the ☆ stars write to.
   Grouped by category, with open/remove. Uses the extension's
   own theme variables (--ldd-*), like the vaults.
   ============================================================ */
async function lddFavMgrGet(){
  const presets=(await lddVtStoreGet("lddPresetFavs"))||{};
  const catalog=(await lddVtStoreGet("lddCatalogFavs"))||{};
  return {presets,catalog};
}
function lddRenderFavoritesPage(o){
  lddVtInjectCss();
  return `<div class="ldd-vt-wrap">`
    +`<div class="ldd-vt-toolbar"><h2 style="margin:0">★ Favorites</h2>`
    +`<input id="ldd-favmgr-q" class="ldd-vt-input ldd-vt-search" placeholder="Search favorites…"></div>`
    +`<div class="ldd-vt-stats"><span id="ldd-favmgr-counts"></span></div>`
    +`<div id="ldd-favmgr-list"></div></div>`;
}
async function lddBindFavoritesPage(o){
  const root=lddVtRoot(); if(!root)return;
  const list=root.querySelector("#ldd-favmgr-list");
  const counts=root.querySelector("#ldd-favmgr-counts");
  const q=root.querySelector("#ldd-favmgr-q");
  let query="";
  if(q)q.oninput=()=>{query=q.value.trim().toLowerCase();render();};
  async function remove(kind,name){
    const data=await lddFavMgrGet();
    const key=kind==="preset"?"lddPresetFavs":"lddCatalogFavs";
    const store=kind==="preset"?data.presets:data.catalog;
    delete store[name];
    await lddVtStoreSet(key,store);
    lddVtToast("Removed from favorites");
    render();
  }
  async function render(){
    const {presets,catalog}=await lddFavMgrGet();
    const pNames=Object.keys(presets), cNames=Object.keys(catalog);
    if(counts)counts.textContent=pNames.length+" preset favorite"+(pNames.length===1?"":"s")+" • "+cNames.length+" product favorite"+(cNames.length===1?"":"s");
    const sections=[
      {title:"Preset favorites",kind:"preset",items:pNames.map(n=>({name:n,cat:(presets[n]&&presets[n].cat)||"Uncategorized",url:null}))},
      {title:"Product favorites",kind:"catalog",items:cNames.map(n=>({name:n,cat:(catalog[n]&&catalog[n].cat)||"Uncategorized",url:(catalog[n]&&catalog[n].url)||null}))}
    ];
    let html="";
    for(const sec of sections){
      let items=sec.items;
      if(query)items=items.filter(i=>i.name.toLowerCase().indexOf(query)>-1||i.cat.toLowerCase().indexOf(query)>-1);
      html+='<h3 style="margin:18px 0 8px">'+lddVtEsc(sec.title)+' <span style="color:var(--ldd-muted);font-weight:400;font-size:.8rem">('+items.length+")</span></h3>";
      if(!items.length){html+='<div class="ldd-vt-empty">No favorites yet — click ☆ on any preset card or product.</div>';continue;}
      const cats={};
      items.forEach(i=>{(cats[i.cat]=cats[i.cat]||[]).push(i);});
      for(const cat of Object.keys(cats).sort()){
        html+='<div class="ldd-vt-card" style="margin-bottom:10px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:2px"><span class="ldd-vt-tag">'+lddVtEsc(cat)+"</span></div>";
        const sorted=cats[cat].slice().sort((a,b)=>a.name.localeCompare(b.name));
        for(const it of sorted){
          html+='<div style="display:flex;align-items:center;gap:10px;padding:7px 4px;border-top:1px solid var(--ldd-border)">'
            +'<span style="color:var(--ldd-accent)">★</span>'
            +'<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+lddVtEsc(it.name)+'">'+lddVtEsc(it.name)+"</span>"
            +(it.url?'<a class="ldd-vt-btn ghost sm" href="'+lddVtEsc(it.url)+'" target="_blank" rel="noopener">Open</a>':"")
            +'<button class="ldd-vt-btn danger sm" data-favmgr-rm="'+sec.kind+'" data-favmgr-name="'+lddVtEsc(it.name)+'">Remove</button></div>';
        }
        html+="</div>";
      }
    }
    list.innerHTML=html;
    list.querySelectorAll("[data-favmgr-rm]").forEach(b=>b.onclick=()=>remove(b.getAttribute("data-favmgr-rm"),b.getAttribute("data-favmgr-name")));
  }
  await render();
}
