
const $=id=>document.getElementById(id), selected=new Map();
let busy=false,start=0;
const formats=[['2x3',12,18],['3x4',12,16],['4x5',8,10],['1x1',12,12],['11x14',11,14],['ISO_A4',8.27,11.69]];
const supported=/\.(png|jpe?g|webp|bmp)$/i;
function addFiles(files){let added=0;for(const file of files){if(!file||!supported.test(file.name))continue;const key=[file.webkitRelativePath||file.name,file.size,file.lastModified].join('|');if(!selected.has(key)){selected.set(key,file);added++}}$('count').textContent=selected.size?`${selected.size} image(s) ready (${added} newly added)`:'No supported images found';if(added>0)toast(`✓ ${added} image${added>1?'s':''} added`);$('export').disabled=!selected.size||busy;$('status').textContent=selected.size?'Ready to export.':'Select images to begin.'}
$('drop').onclick=()=>$('images').click();
$('drop').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('images').click()}};
$('folderpick').onclick=e=>{e.stopPropagation();e.preventDefault();$('folders').click()};
for(const id of ['images','folders'])$(id).onchange=e=>{addFiles(e.target.files);e.target.value=''};
for(const ev of ['dragover','dragenter'])document.addEventListener(ev,e=>{e.preventDefault();$('drop').classList.add('over')});
for(const ev of ['drop','dragleave'])document.addEventListener(ev,e=>{e.preventDefault();$('drop').classList.remove('over')});
function readEntries(reader){return new Promise((resolve,reject)=>{const out=[];function step(){reader.readEntries(entries=>{if(!entries.length)resolve(out);else{out.push(...entries);step()}},reject)}step()})}
async function walk(entry){if(entry.isFile)return [await new Promise((resolve,reject)=>entry.file(resolve,reject))];if(!entry.isDirectory)return [];const children=await readEntries(entry.createReader());const files=[];for(const c of children)files.push(...await walk(c));return files}
document.addEventListener('drop',async e=>{try{const items=[...e.dataTransfer.items];const entries=items.map(i=>i.webkitGetAsEntry?.()).filter(Boolean);if(entries.length){const files=[];for(const entry of entries)files.push(...await walk(entry));addFiles(files)}else addFiles(e.dataTransfer.files)}catch(err){$('status').textContent='Drop error: '+err.message}});
function progress(done,total,phase){$('progress').hidden=false;$('fill').style.width=Math.round(100*done/total)+'%';$('pct').textContent=Math.round(100*done/total)+'%';$('phase').textContent=phase;const sec=(performance.now()-start)/1000;const eta=done?Math.ceil(sec*(total-done)/done):null;$('eta').textContent=eta===null?'Estimating…':`~${eta}s remaining`;$('spinner').style.display=done===total?'none':'block'}
const tick=()=>new Promise(r=>setTimeout(r,0));
let toastTimer=null;
function toast(msg){const t=$('ldd-wa-toast');if(!t)return;t.textContent=msg;t.hidden=false;requestAnimationFrame(()=>t.classList.add('show'));clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.classList.remove('show');setTimeout(()=>{t.hidden=true},350)},3200)}
$('export').onclick=()=>{
if(busy||!selected.size)return;busy=true;$('export').disabled=true;$('clear').disabled=true;start=performance.now();
const files=[...selected.values()];
let worker;
try{worker=new Worker('export-worker.js')}catch(err){$('status').textContent='Error: '+err.message;busy=false;$('export').disabled=false;$('clear').disabled=false;return}
worker.onmessage=e=>{const m=e.data||{};
if(m.type==='progress'){progress(m.done,m.total,m.phase);return}
if(m.type==='done'){const url=URL.createObjectURL(m.blob),a=document.createElement('a');a.href=url;a.download='LDD_Wall_Art_Exports.zip';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);progress(m.total,m.total,'ZIP download started!');$('status').textContent=`✓ ${m.count*m.ratios} JPG exports + size guide. Check your Downloads folder.`;toast('Done — ZIP downloaded ✓');worker.terminate();busy=false;$('export').disabled=false;$('clear').disabled=false;return}
if(m.type==='error'){console.error(m.message);$('status').textContent='Error: '+m.message;worker.terminate();busy=false;$('export').disabled=!selected.size;$('clear').disabled=false}};
worker.onerror=e=>{$('status').textContent='Error: '+(e.message||'export worker failed');try{worker.terminate()}catch(_){}busy=false;$('export').disabled=!selected.size;$('clear').disabled=false};
const mode=(document.querySelector('input[name="wa-mode"]:checked')||{}).value||'fit';
worker.postMessage({files,formats,mode});
};

$('clear').onclick=()=>{
 if(busy)return;
 selected.clear();
 $('images').value='';$('folders').value='';
 $('count').textContent='No images added yet';
 $('status').textContent='Images cleared. Add files or folders to begin.';
 $('progress').hidden=true;
 $('export').disabled=true;
};

/* Upscale reminder popup on tool load — "don't show again" persists. */
(function(){
if(localStorage.getItem('lddWallArtUpscaleHide')==='1')return;
const ov=document.createElement('div');ov.id='ldd-upscale-note';
ov.innerHTML='<div class="ldd-upscale-card"><div class="ldd-upscale-title">\uD83D\uDC09 Quick tip</div><p>Please upscale image first for best results.</p><label class="ldd-upscale-row"><input type="checkbox" id="ldd-upscale-never"> Don\'t show this again</label><button id="ldd-upscale-ok" type="button">GOT IT</button></div>';
document.body.appendChild(ov);
ov.addEventListener('click',e=>{if(e.target===ov)ov.remove()});
ov.querySelector('#ldd-upscale-ok').onclick=()=>{if(ov.querySelector('#ldd-upscale-never').checked)localStorage.setItem('lddWallArtUpscaleHide','1');ov.remove()};
})();
