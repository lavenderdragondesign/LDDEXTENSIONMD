/* LDD preset capture — runs in page MAIN world, document_start.
   Watches network traffic for preset payloads and stashes them in a hidden
   DOM node (#ldd-preset-capture) so the isolated content script can read them. */
(function(){
  if(window._lddPresetCap)return; window._lddPresetCap=true;
  const stash=[];
  function stashNode(){
    let n=document.getElementById('ldd-preset-capture');
    if(n)return n;
    const root=document.documentElement;
    if(!root)return null;
    n=document.createElement('div');
    n.id='ldd-preset-capture';
    n.style.display='none';
    n.setAttribute('aria-hidden','true');
    root.appendChild(n);
    return n;
  }
  function flush(){
    try{
      const n=stashNode();
      if(!n)return;
      let s=JSON.stringify(stash);
      if(s.length>400000){stash.splice(0,Math.max(1,stash.length-5));s=JSON.stringify(stash);}
      n.textContent=s;
    }catch(e){}
  }
  function maybeCapture(url,text){
    try{
      if(!url||!/preset/i.test(url))return;
      if(!text||text.length>2000000)return;
      const t=text.trim();
      if(t[0]!=='{'&&t[0]!=='[')return;
      if(stash.length>20)stash.shift();
      stash.push({url:String(url).slice(0,220),at:Date.now(),data:JSON.parse(t)});
      flush();
    }catch(e){}
  }
  try{
    const origFetch=window.fetch;
    window.fetch=function(u,opts){
      let p;
      try{p=origFetch.apply(this,arguments);}catch(e){throw e;}
      try{
        const url=(typeof u==='string')?u:(u&&u.url)||'';
        if(url&&/preset/i.test(url)){
          p.then(resp=>{
            try{resp.clone().text().then(t=>maybeCapture(url,t)).catch(()=>{});}catch(e){}
            return resp;
          }).catch(()=>{});
        }
      }catch(e){}
      return p;
    };
  }catch(e){}
  try{
    const origOpen=XMLHttpRequest.prototype.open, origSend=XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open=function(m,u){try{this._lddUrl=u;}catch(e){}return origOpen.apply(this,arguments);};
    XMLHttpRequest.prototype.send=function(){
      try{
        this.addEventListener('load',function(){
          try{maybeCapture(this._lddUrl,this.responseText);}catch(e){}
        });
      }catch(e){}
      return origSend.apply(this,arguments);
    };
  }catch(e){}
  document.addEventListener('DOMContentLoaded',flush);
})();
