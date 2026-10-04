chrome.runtime.onInstalled.addListener(details=>{if(details.reason==="install")chrome.tabs.create({url:chrome.runtime.getURL("setup/setup.html")});});

/* ===== MD Scout AI merged worker ===== */
// Owns the one temporary provider tab and serializes all one-shot job transitions.
const jobs = new Map();
const providerUrls = {chatgpt:'https://chatgpt.com/', claude:'https://claude.ai/new'};
const terminal = new Set(['imported','manual-ready','fallback','failed']);
const restore=async id=>{if(jobs.has(id))return jobs.get(id);const saved=(await chrome.storage.session.get('lddAiOwners')).lddAiOwners||{};if(saved[id]){jobs.set(id,{...saved[id],locks:new Set(saved[id].locks||[])});return jobs.get(id)}return null};
const persist=async()=>{const data={};for(const [id,owner] of jobs)data[id]={...owner,locks:[...owner.locks]};await chrome.storage.session.set({lddAiOwners:data})};
chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
  (async()=>{
    const id=msg?.jobId, tabId=sender.tab?.id;
    if(msg?.type==='LDD_AI_CHECK'){
      const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
      if(!job||job.id!==id||terminal.has(job.status))return {ok:false};
      const owner=await restore(id);
      let worker=null;
      try{if(job.tabId)worker=await chrome.tabs.get(job.tabId)}catch{}
      const expected=providerUrls[job.provider];
      const sameWorker=!!(worker&&expected&&worker.url?.startsWith(expected.split('/').slice(0,3).join('/'))&&(!owner||owner.tabId===worker.id));
      const stale=!sameWorker||!job.createdAt||Date.now()-job.createdAt>10*60*1000;
      if(stale){
        // Close only the tab recorded for this job, after checking its provider URL.
        jobs.delete(id);await persist();
        await chrome.storage.local.set({lddAiJob:{...job,status:'failed',error:'Previous AI job stopped or timed out. Starting a new one.'}});
        if(sameWorker)try{await chrome.tabs.remove(worker.id)}catch{}
        return {ok:false,stale:true};
      }
      return {ok:true,status:job.status,createdAt:job.createdAt};
    }
    if(msg?.type==='LDD_AI_CANCEL'){
      const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
      if(!job||job.id!==id||tabId!==job.scoutTabId&&tabId!==(await restore(id))?.scoutTabId)return {ok:false,error:'Not the Scout job'};
      const owner=await restore(id);
      let worker=null;try{if(job.tabId)worker=await chrome.tabs.get(job.tabId)}catch{}
      const expected=providerUrls[job.provider]?.split('/').slice(0,3).join('/');
      jobs.delete(id);await persist();
      await chrome.storage.local.set({lddAiJob:{...job,status:'failed',error:'Cancelled from Scout'}});
      if(worker&&expected&&worker.url?.startsWith(expected)&&(!owner||owner.tabId===worker.id))try{await chrome.tabs.remove(worker.id)}catch{}
      return {ok:true};
    }
    if(msg?.type==='LDD_AI_OPEN'){
      const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
      if(!job||job.id!==id||!providerUrls[job.provider])throw Error('Job or provider is invalid');
      const existing=await restore(id);if(existing)return {ok:true,tabId:existing.tabId};
      // An inactive tab can pause uploads. Keep the AI tab active in its own unfocused
      // worker window, then restore Scout's window to the front.
      const scout=await chrome.tabs.get(tabId);
      const worker=await chrome.windows.create({url:providerUrls[job.provider],focused:false,type:'normal'});
      const tab=worker.tabs?.[0];
      if(!tab?.id)throw Error('AI worker window did not create a tab');
      if(scout?.windowId)try{await chrome.windows.update(scout.windowId,{focused:true})}catch{}
      jobs.set(id,{tabId:tab.id,scoutTabId:tabId,workerWindowId:worker.id,provider:job.provider,locks:new Set()});await persist();
      await chrome.storage.local.set({lddAiJob:{...job,tabId:tab.id,scoutTabId:tabId,status:'opening'}});
      return {ok:true,tabId:tab.id};
    }
    const owner=await restore(id);
    if(!owner)return {ok:false,error:'Job is no longer active'};
    if(msg.type==='LDD_AI_CLAIM'){
      if(tabId!==owner.tabId||owner.provider!==msg.provider)return {ok:false,error:'Wrong worker tab'};
      if(owner.locks.has('claimed'))return {ok:false,error:'Job already claimed'};
      owner.locks.add('claimed');await persist();return {ok:true};
    }
    if(msg.type==='LDD_AI_LOCK'){
      if(tabId!==owner.tabId||!owner.locks.has('claimed')||owner.locks.has(msg.step))return {ok:false};
      owner.locks.add(msg.step);await persist();return {ok:true};
    }
    if(msg.type==='LDD_AI_STATUS'){
      if(tabId!==owner.tabId&&tabId!==owner.scoutTabId)return {ok:false};
      const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
      if(!job||job.id!==id||terminal.has(job.status))return {ok:false};
      await chrome.storage.local.set({lddAiJob:{...job,status:msg.status,error:msg.error||'',downloadedFile:msg.filename||job.downloadedFile}});
      return {ok:true};
    }
    if(msg.type==='LDD_AI_DOWNLOAD_JSON'){
      if(tabId!==owner.tabId||!owner.locks.has('download')||owner.locks.has('downloadRequested'))return {ok:false,error:'Download already requested'};
      const data=msg.data;
      if(data?.format!=='md-scout-ai-style'||!data.style?.name)return {ok:false,error:'Generated Style File is invalid'};
      owner.locks.add('downloadRequested');await persist();
      const basename=String(msg.filename||data.style.name).replace(/[^a-z0-9_-]+/gi,'_').slice(0,90)||'Scout_Style';
      const payload='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2));
      const downloadId=await chrome.downloads.download({url:payload,filename:basename+'.mdscout.json',saveAs:false,conflictAction:'uniquify'});
      if(!downloadId)throw Error('Chrome did not start the Style File download');
      const finished=await new Promise(resolve=>{
        const timer=setTimeout(()=>{chrome.downloads.onChanged.removeListener(watch);resolve('timeout')},90000);
        const watch=delta=>{if(delta.id!==downloadId||!delta.state)return;clearTimeout(timer);chrome.downloads.onChanged.removeListener(watch);resolve(delta.state.current)};
        chrome.downloads.onChanged.addListener(watch);
        chrome.downloads.search({id:downloadId}).then(rows=>{if(rows[0]?.state==='complete'){clearTimeout(timer);chrome.downloads.onChanged.removeListener(watch);resolve('complete')}}).catch(()=>{});
      });
      if(finished!=='complete')throw Error('Chrome download '+finished);
      return {ok:true,downloadId};
    }
    if(msg.type==='LDD_AI_RESULT'){
      if(tabId!==owner.tabId||!owner.locks.has('download'))return {ok:false};
      if(owner.locks.has('result'))return {ok:false};
      owner.locks.add('result');await persist();
      await chrome.storage.local.set({lddAiResult:{jobId:id,data:msg.data,consumed:false},lddAiJob:{...(await chrome.storage.local.get('lddAiJob')).lddAiJob,status:'importing'}});
      return {ok:true};
    }
    if(msg.type==='LDD_AI_FINISH'){
      if(tabId!==owner.tabId&&tabId!==owner.scoutTabId)return {ok:false};
      const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
      if(job?.id===id)await chrome.storage.local.set({lddAiJob:{...job,status:msg.status,error:msg.error||job.error||''}});
      // Manual Claude needs its tab open so the user can wait for and download the file.
      if(!(job?.provider==='claude'&&msg.status==='manual-ready')){
        try{await chrome.tabs.remove(owner.tabId)}catch{}
      }
      jobs.delete(id);await persist();
      return {ok:true};
    }
    return {ok:false};
  })().then(respond,e=>respond({ok:false,error:String(e?.message||e)}));
  return true;
});
chrome.tabs.onRemoved.addListener(async tabId=>{
  for(const [id,owner] of jobs){
    if(owner.tabId!==tabId)continue;
    jobs.delete(id);await persist();
    const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
    if(job?.id===id&&!terminal.has(job.status)&&job.status!=='importing')await chrome.storage.local.set({lddAiJob:{...job,status:'failed',error:'AI worker tab was closed'}});
  }
});
// A service-worker restart cannot safely repeat uploads or sends. Stop the orphaned job.
chrome.runtime.onStartup.addListener(async()=>{
  const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
  if(job&&!terminal.has(job.status))await chrome.storage.local.set({lddAiJob:{...job,status:'failed',error:'Browser restarted during creation. Start a new job.'}});
});

/* Remote Scout style-library updater. Restrict fetches to the official LDD Scout repository. */
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg?.type !== 'LDD_FETCH_STYLE_LIBRARY') return;
  (async () => {
    try {
      const u = new URL(String(msg.url || ''));
      const allowed = u.origin === 'https://raw.githubusercontent.com' &&
        u.pathname === '/lavenderdragondesign/lddscoutaistyles/main/styles.json';
      if (!allowed) throw new Error('Style library URL is not allowed');
      const r = await fetch(u.href, { cache: 'no-store' });
      if (!r.ok) throw new Error(`Style library HTTP ${r.status}`);
      const data = await r.json();
      respond({ ok: true, data });
    } catch (e) {
      respond({ ok: false, error: String(e?.message || e) });
    }
  })();
  return true;
});


/* ===== LDD Tools GitHub Release update checker =====
   For unpacked installs we can detect + download, but Chrome intentionally does not
   expose a normal extension API for overwriting this extension's source directory. */
chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
  if(msg?.type!=='LDD_CHECK_GITHUB_UPDATE' && msg?.type!=='LDD_DOWNLOAD_GITHUB_UPDATE') return;
  (async()=>{
    if(msg.type==='LDD_CHECK_GITHUB_UPDATE'){
      const repo=String(msg.repo||'').trim();
      if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Invalid GitHub repository');
      const r=await fetch(`https://api.github.com/repos/${repo}/releases/latest`,{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
      if(!r.ok) throw new Error(`GitHub HTTP ${r.status}`);
      const rel=await r.json();
      const assets=Array.isArray(rel.assets)?rel.assets:[];
      const zip=assets.find(a=>/LDD[-_ ]?Tools.*\.zip$/i.test(a.name||''))||assets.find(a=>/\.zip$/i.test(a.name||''));
      return {ok:true,release:{version:String(rel.tag_name||rel.name||'').replace(/^v/i,''),name:rel.name||rel.tag_name||'',body:rel.body||'',htmlUrl:rel.html_url||'',assetUrl:zip?.browser_download_url||''}};
    }
    const u=new URL(String(msg.url||''));
    if(!['github.com','objects.githubusercontent.com'].includes(u.hostname) && !u.hostname.endsWith('.githubusercontent.com')) throw new Error('Update URL is not a GitHub download');
    if(!/\.zip(?:$|\?)/i.test(u.href)) throw new Error('Update asset must be a ZIP');
    const version=String(msg.version||'update').replace(/[^0-9A-Za-z._-]/g,'');
    const id=await chrome.downloads.download({url:u.href,filename:`LDD-Tools-UPDATE-v${version}.zip`,saveAs:true,conflictAction:'uniquify'});
    return {ok:!!id,downloadId:id};
  })().then(respond,e=>respond({ok:false,error:String(e?.message||e)}));
  return true;
});
