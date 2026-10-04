const PRESETS={
 safe:{perfSelectedMode:"safe",perfEnabled:true,perfUploadTurbo:true,perfSpaPreload:true,perfSpaPreloadLevel:"smart",perfSmartCache:true,perfAdaptiveGovernor:true,perfScrollBoost:true,perfAdaptiveThrottle:true,perfDomBatching:true,perfBackgroundSleep:true,perfTinyMD:false},
 medium:{perfSelectedMode:"medium",perfEnabled:true,perfUploadTurbo:true,perfSpaPreload:true,perfSpaPreloadLevel:"smart",perfSmartCache:true,perfAdaptiveGovernor:true,perfScrollBoost:true,perfAdaptiveThrottle:true,perfDomBatching:true,perfBackgroundSleep:true,perfTinyMD:false},
 extreme:{perfSelectedMode:"extreme",perfEnabled:true,perfUploadTurbo:true,perfSpaPreload:true,perfSpaPreloadLevel:"aggressive",perfSmartCache:true,perfAdaptiveGovernor:true,perfScrollBoost:true,perfAdaptiveThrottle:true,perfDomBatching:true,perfBackgroundSleep:true,perfTinyMD:false,perfDeepDebloat:true},
 power:{perfSelectedMode:"power",perfEnabled:true,perfUploadTurbo:true,perfSpaPreload:true,perfSpaPreloadLevel:"aggressive",perfSmartCache:true,perfAdaptiveGovernor:true,perfScrollBoost:true,perfAdaptiveThrottle:true,perfDomBatching:true,perfBackgroundSleep:true,perfTinyMD:false,perfDeepDebloat:true}
};
let selected="safe";
const continueBtn=document.getElementById("continue");
function paint(){document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("selected",b.dataset.mode===selected));continueBtn.textContent=`Use ${{safe:"Safe",medium:"Medium",extreme:"Extreme",power:"Power User"}[selected]} & Open MyDesigns →`;}
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.mode;paint();}));
continueBtn.addEventListener("click",async()=>{
  await chrome.storage.local.set({
    lddSetupComplete:true,
    lddSetupMode:selected,
    hotkeysEnabled:false,
    hotkeyHudEnabled:false,
    ...PRESETS[selected]
  });
  await chrome.tabs.create({url:"https://mydesigns.io/app"});
  const tab=await chrome.tabs.getCurrent();
  if(tab?.id) await chrome.tabs.remove(tab.id);
  else window.close();
});
paint();
