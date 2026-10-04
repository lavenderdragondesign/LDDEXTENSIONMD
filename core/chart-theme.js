(()=>{
'use strict';
const STATE={active:false,accent:'#39ff14',a2:'#00eaff',a3:'#ff2bd6',a4:'#9d4dff',a5:'#ffe600',text:'#ffffff',muted:'#9aa4b2',border:'#29313d',panel:'#090b0d'};
const gradients=new WeakSet();
const isChartCanvas=c=>{try{if(!c||c.tagName!=='CANVAS')return false;const p=location.pathname.toLowerCase();if(p.includes('/analytics')||p==='/app'||p==='/app/'||p.includes('/dashboard'))return true;let n=c;for(let i=0;i<5&&n;i++,n=n.parentElement){const s=(n.textContent||'').slice(0,700).toLowerCase();if(s.includes('sales over time')||s.includes('revenue · last 7 days')||s.includes('revenue')&&s.includes('profit'))return true}return false}catch(_){return false}};
const rgb=v=>{if(typeof v!=='string')return null;let m=v.match(/^#([0-9a-f]{6})$/i);if(m){const n=parseInt(m[1],16);return[(n>>16)&255,(n>>8)&255,n&255]}m=v.match(/rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)/i);return m?[+m[1],+m[2],+m[3]]:null};
const alpha=v=>{const m=typeof v==='string'&&v.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/i);return m?Math.max(0,Math.min(1,+m[1])):1};
const rgba=(hex,a)=>{const c=rgb(hex);return c?`rgba(${c[0]},${c[1]},${c[2]},${a})`:hex};
const palette=()=>[STATE.accent,STATE.a2,STATE.a3,STATE.a4,STATE.a5];
const themed=(ctx,v,kind)=>{if(!STATE.active||!isChartCanvas(ctx?.canvas)||typeof v!=='string')return v;const c=rgb(v);if(!c)return v;const [r,g,b]=c,max=Math.max(r,g,b),min=Math.min(r,g,b),spread=max-min,lum=.2126*r+.7152*g+.0722*b,a=alpha(v);
 if(spread<32){if(kind==='shadow')return rgba(STATE.accent,Math.min(.45,a));if(lum>190)return rgba(STATE.text,a);if(lum>105)return rgba(STATE.muted,a);return rgba(STATE.border,Math.min(a,.7))}
 return rgba(STATE.accent,a)};
function patchProp(proto,key,kind){const d=Object.getOwnPropertyDescriptor(proto,key);if(!d?.set||!d?.get)return;Object.defineProperty(proto,key,{configurable:d.configurable,enumerable:d.enumerable,get:d.get,set:function(v){return d.set.call(this,themed(this,v,kind))}})}
try{
 patchProp(CanvasRenderingContext2D.prototype,'strokeStyle','stroke');
 patchProp(CanvasRenderingContext2D.prototype,'fillStyle','fill');
 patchProp(CanvasRenderingContext2D.prototype,'shadowColor','shadow');
 const lg=CanvasRenderingContext2D.prototype.createLinearGradient, rg=CanvasRenderingContext2D.prototype.createRadialGradient;
 CanvasRenderingContext2D.prototype.createLinearGradient=function(...a){const g=lg.apply(this,a);if(isChartCanvas(this.canvas))gradients.add(g);return g};
 CanvasRenderingContext2D.prototype.createRadialGradient=function(...a){const g=rg.apply(this,a);if(isChartCanvas(this.canvas))gradients.add(g);return g};
 const acs=CanvasGradient.prototype.addColorStop;
 CanvasGradient.prototype.addColorStop=function(off,color){if(STATE.active&&gradients.has(this)){const c=rgb(color);if(c){color=rgba(STATE.accent,alpha(color))}}return acs.call(this,off,color)};

 // MyDesigns creates the revenue area gradient before LDD can receive the selected theme.
 // Once a CanvasGradient already contains its native green stops, those stops cannot be edited.
 // Intercept the actual paint operation for known chart canvases and replace gradient fills at draw time.
 const nativeFill=CanvasRenderingContext2D.prototype.fill;
 CanvasRenderingContext2D.prototype.fill=function(...args){
   if(STATE.active&&isChartCanvas(this.canvas)){
     let current=null;
     try{current=this.fillStyle}catch(_){ }
     if(current&&typeof current==='object'&&typeof CanvasGradient!=='undefined'&&current instanceof CanvasGradient){
       try{
         this.fillStyle=rgba(STATE.accent,.20);
         const out=nativeFill.apply(this,args);
         // Restore without recoloring; this gradient may be reused by MyDesigns internally.
         const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'fillStyle');
         if(d&&d.set)d.set.call(this,current);
         return out;
       }catch(_){
         try{const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'fillStyle');if(d&&d.set)d.set.call(this,current)}catch(__){}
       }
     }
   }
   return nativeFill.apply(this,args);
 };
}catch(_){ }
function themeChartInstance(c){
 try{
  if(!STATE.active||!isChartCanvas(c))return;
  const Chart=globalThis.Chart;
  const chart=Chart&&typeof Chart.getChart==='function'?Chart.getChart(c):null;
  if(!chart)return;
  const sets=chart.data?.datasets||[];
  sets.forEach((ds,i)=>{
   const col=palette()[i%palette().length]||STATE.accent;
   ds.borderColor=col;
   ds.backgroundColor=rgba(col,.20);
   ds.pointBackgroundColor=col;
   ds.pointBorderColor=col;
   ds.pointHoverBackgroundColor=STATE.text;
   ds.pointHoverBorderColor=col;
   ds.hoverBorderColor=col;
   ds.hoverBackgroundColor=rgba(col,.30);
  });
  const o=chart.options||(chart.options={});
  if(o.scales) Object.values(o.scales).forEach(sc=>{
   sc.grid={...(sc.grid||{}),color:rgba(STATE.border,.55),borderColor:STATE.border,tickColor:STATE.border};
   sc.ticks={...(sc.ticks||{}),color:STATE.muted};
   sc.title={...(sc.title||{}),color:STATE.text};
  });
  o.plugins=o.plugins||{};
  o.plugins.legend={...(o.plugins.legend||{}),labels:{...(o.plugins.legend?.labels||{}),color:STATE.text}};
  o.plugins.tooltip={...(o.plugins.tooltip||{}),backgroundColor:STATE.panel,titleColor:STATE.text,bodyColor:STATE.text,borderColor:STATE.accent,borderWidth:1};
  chart.update('none');
 }catch(_){ }
}
function themeAllChartInstances(){document.querySelectorAll('canvas').forEach(themeChartInstance)}
function forceRedraw(){themeAllChartInstances();document.querySelectorAll('canvas').forEach(c=>{if(isChartCanvas(c)){themeChartInstance(c);const w=c.style.width;c.style.width='calc(100% - 0.01px)';requestAnimationFrame(()=>c.style.width=w)}});window.dispatchEvent(new Event('resize'));setTimeout(()=>{themeAllChartInstances();window.dispatchEvent(new Event('resize'))},160);setTimeout(themeAllChartInstances,500)}
window.addEventListener('ldd-theme-chart',e=>{Object.assign(STATE,e.detail||{});forceRedraw()});
new MutationObserver(()=>{if(STATE.active)requestAnimationFrame(forceRedraw)}).observe(document.documentElement,{childList:true,subtree:true});
})();
