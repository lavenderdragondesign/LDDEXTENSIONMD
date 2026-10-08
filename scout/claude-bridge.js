(()=>{
  if(window.__LDD_CLAUDE_BRIDGE__)return;window.__LDD_CLAUDE_BRIDGE__=true;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const wait=async(fn,ms=30000)=>{const until=Date.now()+ms;while(Date.now()<until){const v=fn();if(v)return v;await sleep(350)}return null};
  const visible=e=>!!(e&&(e.offsetWidth||e.offsetHeight||e.getClientRects().length));
  const call=(job,type,extra={})=>chrome.runtime.sendMessage({type,jobId:job.id,...extra});
  const progress=(job,status)=>call(job,'LDD_AI_STATUS',{status});
  const lock=async(job,step)=>(await call(job,'LDD_AI_LOCK',{step}))?.ok;
  const controls=()=>[...document.querySelectorAll('button,[role="button"]')].filter(visible);
  const labeled=(terms)=>controls().find(el=>terms.some(t=>((el.getAttribute('aria-label')||'')+' '+(el.getAttribute('title')||'')+' '+(el.textContent||'')).toLowerCase().includes(t)));
  const composer=()=>[...document.querySelectorAll('[contenteditable="true"],[role="textbox"],textarea')].find(visible);
  const fileInput=()=>[...document.querySelectorAll('input[type="file"]')].find(e=>!e.disabled);
  const filename=/^[^/\\]{1,180}\.mdscout(?:\.json)?$/i;
  function generated(){
    const nodes=[...document.querySelectorAll('a[download],button[aria-label],button[title],span,[role="button"],[title]')];
    for(const el of nodes){
      const label=(el.getAttribute?.('download')||el.getAttribute?.('aria-label')||el.getAttribute?.('title')||el.textContent||'').trim();
      if(label.length>250)continue;
      const match=label.match(/[A-Za-z0-9_-][A-Za-z0-9_.-]{1,160}\.mdscout(?:\.json)?/i);
      if(!match||!filename.test(match[0]))continue;
      let scope=el;
      for(let i=0;scope&&i<14;i++,scope=scope.parentElement){
        if((scope.textContent||'').length>25000)break;
        const download=[...scope.querySelectorAll('button,a[download],[role="button"]')].find(b=>
          visible(b)&&(/^download$/i.test((b.innerText||'').trim())||/^download(?: file)?$/i.test((b.getAttribute('aria-label')||'').trim())));
        if(download)return {filename:match[0],download,open:el.closest('button,[role="button"],a')||el};
      }
      if(el.matches('a[download]'))return {filename:match[0],download:el,open:null};
      return {filename:match[0],download:null,open:el.closest('button,[role="button"],a')||el};
    }
    return null;
  }
  function styleJson(){return globalThis.LDDStyleJson?.read()||null}
  async function attach(job,files){
    if(!await lock(job,'attachments'))throw Error('Attachments already started');
    const input=await wait(()=>fileInput()||((labeled(['attach','add files','upload'])?.click()),fileInput()),30000);
    if(!input)throw Error('Could not find Claude file input');
    const real=[];
    for(const x of files){const blob=await(await fetch(x.data)).blob();real.push(new File([blob],x.name,{type:x.type||blob.type}));}
    await progress(job,'attachingBuilder');
    const dt=new DataTransfer();real.forEach(f=>dt.items.add(f));input.files=dt.files;
    input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
    await progress(job,'attachingImage');
    const ready=await wait(()=>{
      const root=composer()?.closest('form')||document.body;
      const text=(root.innerText||'').toLowerCase();
      return files.every(f=>text.includes(f.name.toLowerCase())) ||
        [...root.querySelectorAll('[aria-label],[title]')].filter(visible).filter(e=>files.some(f=>((e.getAttribute('aria-label')||'')+' '+(e.getAttribute('title')||'')).toLowerCase().includes(f.name.toLowerCase()))).length>=2;
    },90000);
    if(!ready)throw Error('Could not confirm both Claude attachments');
  }
  let running=false;
  async function run(){
    if(running)return;
    const job=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
    if(!job||job.provider!=='claude'||job.status!=='opening')return;
    if(!(await call(job,'LDD_AI_CLAIM',{provider:'claude'}))?.ok)return;
    running=true;
    try{
      await progress(job,'preparing');
      const edit=await wait(composer,30000);if(!edit)throw Error('Claude composer did not load; check sign-in or verification');
      await attach(job,[...(job.files||[]),...(job.images||[])]);
      if(!await lock(job,'prompt'))throw Error('Prompt already started');
      edit.focus();
      if(edit.tagName==='TEXTAREA'){
        const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(edit,job.prompt);
        edit.dispatchEvent(new InputEvent('input',{bubbles:true,data:job.prompt,inputType:'insertText'}));
      }else{
        if(!document.execCommand('insertText',false,job.prompt))throw Error('Claude composer rejected the instruction');
        edit.dispatchEvent(new InputEvent('input',{bubbles:true,data:job.prompt,inputType:'insertText'}));
      }
      await progress(job,'sending');
      const send=await wait(()=>controls().find(b=>/send/i.test((b.getAttribute('aria-label')||'')+' '+(b.getAttribute('title')||''))&&!b.disabled&&b.getAttribute('aria-disabled')!=='true'),90000);
      if(!send)throw Error('Claude send button did not become available');
      if(!await lock(job,'send'))throw Error('Send already started');send.click();
      await progress(job,'generating');
      if(job.importMode==='manual'){
        await call(job,'LDD_AI_FINISH',{status:'manual-ready'});
        return;
      }
      // Claude often opens the generated JSON preview automatically. A readable
      // Style File is enough to produce one canonical .mdscout.json download.
      let resource=generated(),data=styleJson();
      if(!resource&&!data){
        const found=await wait(()=>{const r=generated(),d=styleJson();return r||d?{resource:r,data:d}:null},600000);
        if(found){resource=found.resource||null;data=found.data||null}
      }
      if(!resource&&!data)throw Error('Claude did not provide a readable Scout Style File within 10 minutes');
      await progress(job,'found');
      if(!await lock(job,'download'))throw Error('Download already started');
      await progress(job,'reading');
      if(!data&&resource?.open){
        if(!await lock(job,'preview'))throw Error('Preview already opened');
        resource.open.click();data=await wait(styleJson,45000);
      }
      if(!data){
        resource?.download?.click();
        throw Error('Could not read the generated Claude file. Check Downloads, or download it from Claude and drag it into Import Style.');
      }
      const name=(resource?.filename||data.style.name||'Scout_Style').replace(/\.mdscout(?:\.json)?$/i,'');
      await progress(job,'downloading');
      const saved=await call(job,'LDD_AI_DOWNLOAD_JSON',{data,filename:name});
      if(!saved?.ok)throw Error(saved?.error||'Could not download the Claude Style File');
      if(job.importMode==='manual')return void await call(job,'LDD_AI_FINISH',{status:'manual-ready'});
      if(!(await call(job,'LDD_AI_RESULT',{data}))?.ok)throw Error('Style downloaded, but Auto Import handoff failed');
    }catch(e){
      const state=(await chrome.storage.local.get('lddAiJob')).lddAiJob;
      await call(job,'LDD_AI_FINISH',{status:['downloading','found','reading'].includes(state?.status)?'fallback':'failed',error:String(e?.message||e)});
    }finally{running=false}
  }
  chrome.storage.onChanged.addListener((c,a)=>{if(a==='local'&&c.lddAiJob?.newValue?.status==='opening')setTimeout(run,300)});
  setTimeout(run,800);
})();
