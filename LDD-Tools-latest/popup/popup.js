const defaults={lddMasterEnabled:true,dragUpload:true,credits:true};
function paint(o){document.querySelectorAll("[data-setting]").forEach(b=>{const v=b.dataset.value==="true";b.classList.toggle("active",o[b.dataset.setting]===v)});}
chrome.storage.local.get(defaults,paint);
document.querySelectorAll("[data-setting]").forEach(b=>b.addEventListener("click",()=>{const key=b.dataset.setting,value=b.dataset.value==="true";chrome.storage.local.set({[key]:value},()=>chrome.storage.local.get(defaults,paint));}));
chrome.storage.onChanged.addListener((c,a)=>{if(a==="local")chrome.storage.local.get(defaults,paint)});