(()=>{
  if(window.__LDD_CHATGPT_BRIDGE__)return; window.__LDD_CHATGPT_BRIDGE__=true;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let running=false;
  const message=(job,type,extra={})=>chrome.runtime.sendMessage({type,jobId:job.id,...extra});
  const progress=(job,status,error)=>message(job,'LDD_AI_STATUS',{status,error});
  const lock=async(job,step)=>(await message(job,'LDD_AI_LOCK',{step}))?.ok;
  async function waitFor(fn,ms=30000,step=300){const end=Date.now()+ms;while(Date.now()<end){try{const v=fn();if(v)return v}catch{}await sleep(step)}return null}
  const visible=e=>!!(e&&(e.offsetWidth||e.offsetHeight||e.getClientRects().length));
  function norm(s){return (s||'').replace(/\s+/g,' ').trim().toLowerCase()}
  function buttons(){return [...document.querySelectorAll('button,[role="button"],[role="menuitem"]')].filter(visible)}
  function findControl(words){return buttons().find(el=>{const s=norm([el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-testid'),el.textContent].filter(Boolean).join(' '));return words.some(w=>s.includes(w))})}
  async function dataUrlToFile(x){const res=await fetch(x.data);const blob=await res.blob();return new File([blob],x.name||'attachment',{type:x.type||blob.type||'application/octet-stream'})}
  function setComposer(el,text){
    el.focus();
    try{
      if(el.tagName==='TEXTAREA'){
        const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
        setter?setter.call(el,text):el.value=text;
        el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
      }else{
        // ChatGPT currently uses ProseMirror. Let its editor process the native edit;
        // replacing its DOM children directly leaves its internal document empty.
        const selection=window.getSelection(),range=document.createRange();
        range.selectNodeContents(el);selection.removeAllRanges();selection.addRange(range);
        if(!document.execCommand('insertText',false,text))return false;
        el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
      }
      return (el.value||el.innerText||el.textContent||'').includes(text);
    }catch{return false}
  }

  async function sendWhenReady(composer){
    // ChatGPT can keep Send disabled while attached files finish uploading. Watch only
    // the composer form and click the instant Send becomes enabled.
    const root=composerRoot(composer);
    const findSend=()=>{
      const candidates=[
        document.querySelector('[data-testid="send-button"]'),
        document.querySelector('[data-testid="composer-submit-button"]'),
        root?.querySelector('button[aria-label*="send" i]'),
        root?.querySelector('button[data-testid*="send" i]'),
        findControl(['send prompt','send message','send'])
      ].filter(Boolean);
      return candidates.find(el=>visible(el)&&!el.disabled&&el.getAttribute('aria-disabled')!=='true');
    };
    const immediate=findSend(); if(immediate){immediate.click();return true}
    const send=await new Promise(resolve=>{
      let done=false; const finish=v=>{if(done)return;done=true;obs.disconnect();clearInterval(tick);clearTimeout(timer);resolve(v)};
      const trySend=()=>{const b=findSend();if(b){b.click();finish(true)}};
      const obs=new MutationObserver(trySend); try{obs.observe(root||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','aria-disabled','data-testid']})}catch{}
      const tick=setInterval(trySend,200);
      const timer=setTimeout(()=>finish(false),90000);
      trySend();
    });
    return send;
  }
  function parseResult(text){let m=text.match(/```json\s*([\s\S]*?)```/i)||text.match(/```\s*([\s\S]*?)```/);let raw=m?m[1]:text;let a=raw.indexOf('{'),b=raw.lastIndexOf('}'),aa=raw.indexOf('['),bb=raw.lastIndexOf(']');if(aa>=0&&(a<0||aa<a)&&bb>aa)raw=raw.slice(aa,bb+1);else if(a>=0&&b>a)raw=raw.slice(a,b+1);return JSON.parse(raw)}

  async function getComposer(){return waitFor(()=>document.querySelector('#prompt-textarea')||document.querySelector('[contenteditable="true"][data-lexical-editor="true"]')||[...document.querySelectorAll('[contenteditable="true"]')].find(visible)||[...document.querySelectorAll('textarea')].find(visible),25000)}
  async function revealFileInputs(){
    const add=findControl(['add files and more','attach','composer menu']);
    if(add){add.click();await sleep(350)}
    return [...document.querySelectorAll('input[type="file"]')].filter(i=>!i.disabled);
  }
  function composerRoot(composer){return composer?.closest('form')||composer?.parentElement?.parentElement||document.body}
  function attachmentConfirmed(root,attachments){
    // File chips and image thumbnails can be siblings of the form, and images often
    // expose only a blob preview. Count the Builder and image independently.
    const scopes=[root,root.parentElement,document.body].filter(Boolean);
    const builderName=(attachments[0]?.name||'').toLowerCase();
    const imageName=(attachments[1]?.name||'').toLowerCase();
    return scopes.some(scope=>{
      const text=(scope.innerText||scope.textContent||'').toLowerCase();
      const nodes=[...scope.querySelectorAll('img,[aria-label],[title],[data-testid]')].filter(visible);
      const meta=nodes.map(el=>[el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('alt'),el.getAttribute('data-testid')].filter(Boolean).join(' ').toLowerCase());
      const builder=text.includes(builderName)||meta.some(t=>t.includes(builderName));
      const image=text.includes(imageName)||meta.some(t=>t.includes(imageName))||nodes.some(el=>el.tagName==='IMG'&&/^(blob:|data:image)/.test(el.currentSrc||el.src||''));
      return builder&&image;
    });
  }
  async function confirmAttachments(root,attachments,ms=180000){return !!(await waitFor(()=>attachmentConfirmed(root,attachments),ms,500))}

  async function attach(job,composer){
    const attachments=[...(job.files||[]),...(job.images||[])]; if(!attachments.length)return false;
    if(!await lock(job,'attachments'))return false;
    await progress(job,'attachingBuilder');

    // ONE-SHOT attachment path. Never retry by feeding another input/drop/paste,
    // because ChatGPT may still be uploading the first set and retries create duplicates.
    const realFiles=await Promise.all(attachments.map(dataUrlToFile));
    const root=composerRoot(composer);
    const inputs=await revealFileInputs();
    const input=inputs.find(i=>!i.accept||/json|application\/|text\//i.test(i.accept));
    if(!input)throw Error('ChatGPT did not expose a file input accepting the Style Builder');

    const dt=new DataTransfer(); realFiles.forEach(f=>dt.items.add(f));
    try{input.files=dt.files}catch{try{Object.defineProperty(input,'files',{configurable:true,value:dt.files})}catch{return false}}
    input.dispatchEvent(new Event('input',{bubbles:true,composed:true}));
    input.dispatchEvent(new Event('change',{bubbles:true,composed:true}));
    await progress(job,'attachingImage');

    // Wait for this single attachment operation to finish. Do not attach again on timeout.
    return await confirmAttachments(root,attachments,180000);
  }

  function validStyleFile(j){return !!(j&&j.format==='md-scout-ai-style'&&j.style&&j.style.name)}
  function findMdScoutResource(){
    for(const open of document.querySelectorAll('button[aria-label^="Open preview of "]')){
      const name=(open.getAttribute('aria-label')||'').replace(/^Open preview of /i,'').trim();
      if(!/^[^\/\\]{1,180}\.mdscout(\.json)?$/i.test(name))continue;
      let row=open.parentElement;
      for(let i=0;row&&i<5;i++,row=row.parentElement){
        const download=[...row.querySelectorAll('button[aria-label="Download file"]')].find(visible);
        if(download)return {row,open,download,filename:name};
      }
    }
    // Fallback: find the .mdscout.json filename as visible text, then locate a
    // download control nearby. Resilient to ChatGPT renaming aria-labels.
    try{
      if(!(document.body?.textContent||'').toLowerCase().match(/\.mdscout(\.json)?/))return null;
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let node;const seen=new Set();
      while(node=walker.nextNode()){
        const t=node.textContent||'';
        if(!/\.mdscout(\.json)?/i.test(t))continue;
        const m=t.match(/([\p{L}\p{N}\-_. ]{1,180}\.mdscout(\.json)?)/iu);
        const filename=(m&&m[1].trim())||'style.mdscout';
        let row=node.parentElement;
        for(let i=0;row&&i<10&&!seen.has(row);i++,row=row.parentElement){
          seen.add(row);
          const download=[...row.querySelectorAll('button,[role="button"]')].find(b=>{
            if(!visible(b))return false;
            const s=[b.getAttribute('aria-label'),b.getAttribute('title'),b.textContent].filter(Boolean).join(' ').toLowerCase();
            return s.includes('download');
          });
          if(download){
            const openBtn=[...row.querySelectorAll('button,[role="button"],a[href]')].find(b=>b!==download&&visible(b)&&/preview|open|\.mdscout(\.json)?/i.test([b.getAttribute('aria-label'),b.getAttribute('title'),b.textContent,b.getAttribute('href')].filter(Boolean).join(' ')));
            return {row,open:openBtn||null,download,filename};
          }
        }
      }
    }catch{}
    return null;
  }
  function parseStyleFromText(text){
    try{const j=parseResult(text||'');return validStyleFile(j)?j:null}catch{return null}
  }
  function findVisibleStyleJson(){return globalThis.LDDStyleJson?.read()||null}
  async function readResourceLink(resource){
    for(const a of resource?.row?.querySelectorAll('a[href]')||[]){
      const label=[a.getAttribute('download'),a.getAttribute('title'),a.textContent,a.getAttribute('href')].join(' ').toLowerCase();
      if(!label.includes(resource.filename.toLowerCase()))continue;
      try{
        const url=new URL(a.href,location.href);
        if(url.protocol!=='blob:'&&url.origin!==location.origin)continue;
        const response=await fetch(url.href,{credentials:'same-origin'});
        if(!response.ok)continue;
        const data=JSON.parse(await response.text());
        if(validStyleFile(data))return data;
      }catch{}
    }
    return null;
  }
  async function finish(job,status,error){await message(job,'LDD_AI_FINISH',{status,error})}
  async function run(){
    if(running)return;
    const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
    if(!job||job.provider!=='chatgpt'||job.status!=='opening')return;
    const claim=await message(job,'LDD_AI_CLAIM',{provider:'chatgpt'});
    if(!claim?.ok)return;
    running=true;
    try{
      await progress(job,'preparing');
      const composer=await getComposer();if(!composer)throw Error('ChatGPT composer did not load');
      if(!await attach(job,composer))throw Error('Could not confirm both attachments after three minutes. Open the worker window to inspect the upload.');
      const readyComposer=await getComposer();
      if(!readyComposer||!readyComposer.isConnected)throw Error('ChatGPT composer disappeared after attachments');
      if(!await lock(job,'prompt'))throw Error('Prompt was already started');
      if(!setComposer(readyComposer,job.prompt))throw Error('Could not fill ChatGPT composer');
      await progress(job,'sending');
      if(!await lock(job,'send'))throw Error('Send was already started');
      if(!await sendWhenReady(readyComposer))throw Error('AI send button did not become available');
      await progress(job,'generating');
      const resource=await waitFor(findMdScoutResource,600000,900);
      if(!resource)throw Error('Could not find a generated .mdscout file within 10 minutes');
      await progress(job,'found');
      if(!await lock(job,'download'))throw Error('Download already started');
      await progress(job,'reading');
      // Open the generated file and read its actual JSON before requesting a
      // canonical download. A click on ChatGPT's Download control is not proof
      // that Chrome saved anything.
      let data=findVisibleStyleJson()||await readResourceLink(findMdScoutResource());
      if(!data){
        const preview=await waitFor(()=>findMdScoutResource()?.open,20000,350);
        if(preview){if(!await lock(job,'preview'))throw Error('Preview already opened');preview.click();data=await waitFor(findVisibleStyleJson,45000,700)}
        if(!data)data=await readResourceLink(findMdScoutResource());
      }
      if(!data){
        resource.download.click();
        throw Error('Could not read the generated file. Check Downloads, or download it from ChatGPT and drag it into Import Style.');
      }
      await progress(job,'downloading');
      const saved=await message(job,'LDD_AI_DOWNLOAD_JSON',{data,filename:resource.filename.replace(/\.mdscout(\.json)?$/i,'')});
      if(!saved?.ok)throw Error(saved?.error||'Could not download the generated Style File');
      if(job.importMode==='manual'){await finish(job,'manual-ready');return}
      if(!(await message(job,'LDD_AI_RESULT',{data}))?.ok)throw Error('Style downloaded, but Auto Import handoff failed');
      // Scout completes the canonical import, then closes precisely this worker tab.
    }catch(e){
      const state=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
      await finish(job,['downloading','found','reading'].includes(state?.status)?'fallback':'failed',String(e?.message||e));
    }finally{running=false}
  }
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area==='local'&&changes.lddAiJob?.newValue?.status==='opening')setTimeout(run,300);
  });
  setTimeout(run,800);
})();
