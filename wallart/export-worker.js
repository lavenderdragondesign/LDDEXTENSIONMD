/* LDD Wall Art Exporter — background worker.
   Runs the whole export (decode → resize → JPEG encode → DPI stamp → ZIP)
   off the main thread so the page stays responsive. Encodes up to 2 ratios
   at a time for speed without blowing up memory on huge canvases. */
const SIZE_GUIDE_URL='https://raw.githubusercontent.com/lavenderdragondesign/LDDEXTENSIONMD/main/extension-assets/size-guide.png';
const CONCURRENCY=2;

function stampDPI(a){if(a[0]!==255||a[1]!==216)throw Error('Invalid JPEG');let o=2;while(o<a.length-16){if(a[o]!==255)break;const marker=a[o+1],len=(a[o+2]<<8)|a[o+3];if(marker===224&&String.fromCharCode(...a.slice(o+4,o+9))==='JFIF\0'){a[o+11]=1;a[o+12]=1;a[o+13]=44;a[o+14]=1;a[o+15]=44;return a}o+=2+len}throw Error('Cannot set JPEG DPI metadata')}
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(data){let c=0xffffffff;for(let i=0;i<data.length;i++)c=crcTable[(c^data[i])&255]^(c>>>8);return(c^0xffffffff)>>>0}
function zip(entries){const enc=new TextEncoder(),locals=[],central=[];let offset=0;const u16=(v,n,x)=>{v[n]=x&255;v[n+1]=(x>>>8)&255},u32=(v,n,x)=>{u16(v,n,x);u16(v,n+2,x>>>16)};for(const {name,data} of entries){const nb=enc.encode(name),crc=crc32(data),lh=new Uint8Array(30),ch=new Uint8Array(46);u32(lh,0,0x04034b50);u16(lh,4,20);u16(lh,6,0x800);u32(lh,14,crc);u32(lh,18,data.length);u32(lh,22,data.length);u16(lh,26,nb.length);locals.push(lh,nb,data);u32(ch,0,0x02014b50);u16(ch,4,20);u16(ch,6,20);u16(ch,8,0x800);u32(ch,16,crc);u32(ch,20,data.length);u32(ch,24,data.length);u16(ch,28,nb.length);u32(ch,42,offset);central.push(ch,nb);offset+=lh.length+nb.length+data.length}const centralSize=central.reduce((s,x)=>s+x.length,0),end=new Uint8Array(22);u32(end,0,0x06054b50);u16(end,8,entries.length);u16(end,10,entries.length);u32(end,12,centralSize);u32(end,16,offset);return new Blob([...locals,...central,end],{type:'application/zip'})}

async function jpgFromBitmap(bmp,w,h,mode){
  const c=new OffscreenCanvas(w,h);
  const x=c.getContext('2d',{alpha:false});
  x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
  if(mode==='crop'){
    const scale=Math.max(w/bmp.width,h/bmp.height),sw=w/scale,sh=h/scale;
    x.drawImage(bmp,(bmp.width-sw)/2,(bmp.height-sh)/2,sw,sh,0,0,w,h);
  }else{
    const scale=Math.min(w/bmp.width,h/bmp.height),dw=bmp.width*scale,dh=bmp.height*scale;
    x.fillStyle='#ffffff';x.fillRect(0,0,w,h);
    x.drawImage(bmp,(w-dw)/2,(h-dh)/2,dw,dh);
  }
  const b=await c.convertToBlob({type:'image/jpeg',quality:.92});
  if(!b)throw new Error('JPEG encoding failed');
  return stampDPI(new Uint8Array(await b.arrayBuffer()));
}

async function pool(items,limit,fn){
  const ret=[];let i=0;
  const workers=Array.from({length:Math.min(limit,items.length)},async()=>{
    while(i<items.length){const idx=i++;ret[idx]=await fn(items[idx],idx)}
  });
  await Promise.all(workers);
  return ret;
}

onmessage=async e=>{
  const {files,formats}=e.data;
  const mode=e.data.mode==='crop'?'crop':'fit';
  try{
    const total=files.length*(formats.length+1)+2;
    let done=0;const entries=[],seen=new Map(),madeDirs=new Set();
    const post=phase=>postMessage({type:'progress',done,total,phase});
    const ensureDirs=folder=>{ /* only create orientation folders that actually get images */
      if(madeDirs.has(folder))return;madeDirs.add(folder);
      entries.push({name:`ORIGINAL_IMAGES/${folder}/`,data:new Uint8Array()});
      entries.push({name:folder+'/',data:new Uint8Array()});
      for(const [ratio] of formats)entries.push({name:`${folder}/${ratio}/`,data:new Uint8Array()});
    };
    post('Preparing…');
    entries.push({name:'ORIGINAL_IMAGES/',data:new Uint8Array()});
    for(let i=0;i<files.length;i++){
      const file=files[i];
      const bmp=await createImageBitmap(file);
      const portrait=bmp.height>=bmp.width,folder=portrait?'VERTICAL':'HORIZONTAL';
      ensureDirs(folder);
      const base=file.name.replace(/\.[^.]+$/,'').replace(/[^a-z0-9 _-]/gi,'_');
      let n=(seen.get(folder+'/'+base)||0)+1;seen.set(folder+'/'+base,n);
      const ext=(file.name.match(/\.([a-z0-9]+)$/i)||[])[1]||'png';
      entries.push({name:`ORIGINAL_IMAGES/${folder}/${base}${n>1?'-'+n:''}.${ext}`,data:new Uint8Array(await file.arrayBuffer())});
      done++;post(`Original ${i+1}/${files.length} saved`);
      await pool(formats,CONCURRENCY,async([ratio,w,h])=>{
        const pw=Math.round((portrait?w:h)*300),ph=Math.round((portrait?h:w)*300);
        const data=await jpgFromBitmap(bmp,pw,ph,mode);
        entries.push({name:`${folder}/${ratio}/${base}${n>1?'-'+n:''}_${ratio}_${pw}x${ph}_300DPI.jpg`,data});
        done++;post(`Image ${i+1}/${files.length} · ${ratio}`);
      });
      bmp.close();
    }
    post('Adding size guide…');
    const guide=new Uint8Array(await(await fetch(SIZE_GUIDE_URL)).arrayBuffer());
    entries.push({name:'LDD_Wall_Art_Size_Guide.png',data:guide});
    done++;post('Packaging ZIP…');
    const blob=zip(entries);
    done=total;post('ZIP download started!');
    postMessage({type:'done',blob,total,count:files.length,ratios:formats.length});
  }catch(err){postMessage({type:'error',message:String((err&&err.message)||err)})}
};
