/* LDD Mockup Profiles — page-world sniffer (registered as a Manifest V3
   main-world content script, so MyDesigns' CSP can't block it).
   Passively watches MyDesigns' own traffic for mockup-profile API responses
   (both fetch and XHR — the app may use either) and relays them to the
   isolated-world bridge via window.postMessage.
   Also logs profile WRITE requests (method + URL + body shape) to the console
   so the real save endpoint can be identified. */
(function(){
  if(window.__lddMpSniff)return;window.__lddMpSniff=true;

  var PROFILE_PATH="/integrations/mockups/profiles";

  function isProfilesUrl(u){return typeof u==="string"&&u.indexOf(PROFILE_PATH)>=0;}

  function urlOf(u){
    if(typeof u==="string")return u;
    if(u&&typeof u.url==="string")return u.url;    /* Request object */
    if(u&&typeof u.href==="string")return u.href;  /* URL object */
    return "";
  }

  function emitProfiles(data,via){
    try{
      var arr=Array.isArray(data)?data:(data&&(data.profiles||data.data)||[]);
      console.log("[LDD] mockup profiles captured ("+via+"):"+(Array.isArray(arr)?arr.length:"?"));
      window.postMessage({type:"LDD_MP_PROFILES",data:data},"*");
    }catch(_){}
  }

  function bodyShape(b){
    try{
      var s=typeof b==="string"?b:"";
      if(!s)return "";
      return s.slice(0,1200);
    }catch(_){return "";}
  }

  /* ---- fetch hook ---- */
  function watchFetch(url,promise,method,body){
    try{
      if(!isProfilesUrl(url))return;
      var m=String(method||"GET").toUpperCase();
      if(m!=="GET"){
        try{console.log("[LDD] profile write:",m,url,bodyShape(body));}catch(_){}
        return;
      }
      if(promise&&promise.then){
        promise.then(function(res){
          return res.clone().json().then(function(data){emitProfiles(data,"fetch");});
        }).catch(function(){});
      }
    }catch(_){}
  }
  try{
    var of=window.fetch;
    window.fetch=function(u,opts){
      var p=of.apply(this,arguments);
      watchFetch(urlOf(u),p,opts&&opts.method,opts&&opts.body);
      return p;
    };
  }catch(_){}

  /* ---- XHR hook (axios and friends use XHR in browsers) ---- */
  try{
    var xOpen=XMLHttpRequest.prototype.open;
    var xSend=XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open=function(method,url){
      try{
        this.__lddMpUrl=String(url==null?"":url);
        this.__lddMpMethod=String(method||"GET").toUpperCase();
      }catch(_){}
      return xOpen.apply(this,arguments);
    };
    XMLHttpRequest.prototype.send=function(body){
      try{
        var xhr=this;
        if(isProfilesUrl(xhr.__lddMpUrl||"")){
          if(xhr.__lddMpMethod!=="GET"){
            try{console.log("[LDD] profile write (xhr):",xhr.__lddMpMethod,xhr.__lddMpUrl,bodyShape(body));}catch(_){}
          }else{
            xhr.addEventListener("load",function(){
              try{
                if(xhr.status>=200&&xhr.status<300&&xhr.responseText){
                  emitProfiles(JSON.parse(xhr.responseText),"xhr");
                }
              }catch(_){}
            });
          }
        }
      }catch(_){}
      return xSend.apply(this,arguments);
    };
  }catch(_){}

  // Import: do the POST from page context when asked (uses the page's own session)
  window.addEventListener("message",function(e){
    if(e.source!==window||!e.data||e.data.type!=="LDD_MP_DO_IMPORT")return;
    var payload=e.data.payload,id=e.data.id;
    fetch("https://api.mydesigns.io/integrations/mockups/profiles",{
      method:"POST",credentials:"include",
      headers:{"accept":"application/json","content-type":"application/json"},
      body:JSON.stringify(payload)
    })
    .then(function(r){return r.json().then(function(d){return{ok:r.ok,status:r.status,data:d};}).catch(function(){return{ok:r.ok,status:r.status,data:null};});})
    .then(function(res){window.postMessage({type:"LDD_MP_IMPORT_RES",id:id,ok:res.ok,data:res.data,error:res.ok?"":"HTTP "+res.status},"*");})
    .catch(function(err){window.postMessage({type:"LDD_MP_IMPORT_RES",id:id,ok:false,error:String(err)},"*");});
  });
})();
