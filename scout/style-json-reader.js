// Shared reader for a provider's visible generated JSON preview.
// Runs only while a Create with AI worker is active.
(()=>{
  if(globalThis.LDDStyleJson)return;
  const valid=x=>x?.format==='md-scout-ai-style'&&typeof x.style?.name==='string'&&x.style.name.trim();
  function balanced(text,start){
    let depth=0,quoted=false,escape=false;
    for(let i=start;i<text.length;i++){
      const c=text[i];
      if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue}
      if(c==='"'){quoted=true;continue}
      if(c==='{')depth++;
      if(c==='}') {depth--;if(depth===0)return text.slice(start,i+1)}
    }
    return null;
  }
  function parseText(raw){
    if(!raw||!raw.includes('md-scout-ai-style'))return null;
    for(const t of [raw,raw.replace(/^\s*\d+\s+(?=[{\[\]}"A-Za-z])/gm,'')]){
      const marker=t.indexOf('md-scout-ai-style');
      let tried=0;
      for(let at=marker;at>=Math.max(0,marker-10000)&&tried<60;at--){
        if(t[at]!=='{')continue;tried++;
        const candidate=balanced(t,at);if(!candidate)continue;
        try{const data=JSON.parse(candidate);if(valid(data))return data}catch{}
      }
    }
    return null;
  }
  let extraRoots=[],lastExtraScan=0;
  function read(){
    const roots=[document];
    // Recheck nested preview roots at most once every two seconds.
    if(Date.now()-lastExtraScan>2000){
      extraRoots=[];lastExtraScan=Date.now();
      for(const frame of document.querySelectorAll('iframe')){try{if(frame.contentDocument?.body)extraRoots.push(frame.contentDocument)}catch{}}
      for(const el of document.querySelectorAll('*')){if(el.shadowRoot)extraRoots.push(el.shadowRoot);if(extraRoots.length>=12)break}
    }
    for(const root of [...roots,...extraRoots]){
      const body=root.body||root;
      const nodes=[...root.querySelectorAll('pre,code,[role="dialog"],[role="document"],article,section,[data-language="json"],textarea')];
      const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let node,seen=0;
      while((node=walker.nextNode())&&seen++<30000){
        if(!(node.textContent||'').includes('md-scout-ai-style'))continue;
        let el=node.parentElement;
        for(let j=0;el&&j<12;j++,el=el.parentElement)nodes.push(el);
        break;
      }
      nodes.push(body);
      const candidates=[...new Set(nodes)].filter(el=>{
        const raw=el.value||el.textContent||'';return raw.length<250000&&raw.includes('md-scout-ai-style');
      }).sort((a,b)=>(a.value||a.textContent||'').length-(b.value||b.textContent||'').length);
      for(const el of candidates){
        const data=parseText(el.value||el.textContent)||parseText(el.innerText);
        if(data)return data;
      }
    }
    return null;
  }
  globalThis.LDDStyleJson={read,parseText};
})();
