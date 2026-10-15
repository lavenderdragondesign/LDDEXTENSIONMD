/* LDD Mockup Profiles — passively capture profiles from MyDesigns' own traffic (no direct API calls) */
(function(){
if(window.__lddMpLoaded)return;window.__lddMpLoaded=true;
const KEY="lddMockupProfiles";

/* Page-world sniffer runs as a registered Manifest V3 main-world content script
   (see manifest.json), so no script injection is needed here. It posts
   LDD_MP_PROFILES messages to window, which we receive below. */

async function load(){try{const d=await chrome.storage.local.get(KEY);return Array.isArray(d[KEY])?d[KEY]:[];}catch(_){return[];}}
async function save(p){try{await chrome.storage.local.set({[KEY]:p});}catch(_){}}

async function onProfiles(data){
  const profiles=Array.isArray(data)?data:(data.profiles||data.data||[]);
  if(!profiles.length)return;
  let existing=await load();
  const seen=new Set(existing.map(e=>e.data&&e.data.id));
  let added=0;
  for(const pr of profiles){
    if(pr&&pr.id&&!seen.has(pr.id)){
      existing.unshift({id:"mp"+Date.now().toString(36)+added,ts:Date.now(),url:"(captured)",data:pr});
      seen.add(pr.id);
      added++;
    }
  }
  if(added){
    // dedupe by server id — captures arriving from multiple frames can race
    const ids=new Set();const deduped=[];
    for(const e of existing){const sid=(e.data&&e.data.id)||e.id;if(ids.has(sid))continue;ids.add(sid);deduped.push(e);}
    existing=deduped;
    await save(existing.slice(0,100));
    try{window.lddMpOnCapture&&window.lddMpOnCapture();}catch(_){}
  }
}

window.addEventListener("message",e=>{
  if(!e.data||e.data.type!=="LDD_MP_PROFILES")return;
  // own frame's sniffer (source===window) or a forward bubbled up from a child frame
  if(e.source!==window&&!e.data.fwd)return;
  onProfiles(e.data.data);
  // bubble iframe captures up so the top frame (where the tool UI lives) stores them
  if(window!==window.top){
    try{window.top.postMessage({type:"LDD_MP_PROFILES",fwd:true,data:e.data.data},"*");}catch(_){}
  }
});

window.lddMpGet=load;
window.lddMpClear=async()=>{await save([]);};
window.lddMpDelete=async(id)=>{const p=await load();await save(p.filter(x=>x.id!==id));};
window.lddMpSaveSnapshot=async(data)=>{
  const profiles=await load();
  profiles.unshift({id:"mp"+Date.now().toString(36),ts:Date.now(),url:"(manual)",data:data});
  await save(profiles.slice(0,100));
};
// Import: ask the page-world sniffer (main-world content script) to POST with
// the user's own MyDesigns session, then relay the result back here
window.lddMpImport=async(json)=>{
  const raw=typeof json==="string"?JSON.parse(json):json;
  const src=raw.data||raw;
  const payload={name:src.name||("imported-"+Date.now().toString(36)),
    profile:src.profile||{payloads:[]},isPublic:false};
  return new Promise((resolve,reject)=>{
    const id="mpimp"+Date.now().toString(36);
    function handler(e){
      if(e.source!==window||!e.data||e.data.type!=="LDD_MP_IMPORT_RES"||e.data.id!==id)return;
      window.removeEventListener("message",handler);
      clearTimeout(timer);
      if(e.data.ok)resolve(e.data.data);else reject(new Error(e.data.error||"import failed"));
    }
    window.addEventListener("message",handler);
    const timer=setTimeout(()=>{window.removeEventListener("message",handler);reject(new Error("import timed out"));},15000);
    window.postMessage({type:"LDD_MP_DO_IMPORT",id:id,payload:payload},"*");
  });
};

})();
