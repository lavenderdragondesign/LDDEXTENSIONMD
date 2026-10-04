const POWER_DEFAULTS={
 lddSetupComplete:true,lddSetupMode:"power",
 dragUpload:true,dragDropUpload:true,carouselRenamer:true,maxLength:true,
 productPresets:true,credits:true,hoverPreview:true,appFont:false,
 visionTitle:true,visionTitleBox:true,canvasQuickMenu:true,
 wideScrollbars:true,highContrastScrollbars:true,
 hideSupportChat:true,reduceAnimations:true,disableBlur:true,reduceShadows:true,
 lazyCardImages:true,pauseBackgroundLDD:true
};
async function initialize(){
 const existing=await chrome.storage.local.get(["lddSetupComplete","lddSetupMode"]);
 if(!existing.lddSetupComplete){await chrome.storage.local.set(POWER_DEFAULTS);}
 else if(!existing.lddSetupMode){await chrome.storage.local.set({lddSetupMode:"power"});}
}
document.getElementById("continue").addEventListener("click",async()=>{
 await initialize();
 chrome.tabs.create({url:"https://mydesigns.io/app"});
});
initialize();
