// Shared PDF prompt-pack parser (extracted from core/vault-tools.js).
// Loaded on chatgpt.com so the Prompt Queue can import prompt packs directly.
// Keep in sync with the vault copy when the parser changes.
if(typeof globalThis.lddPvParsePdfPrompts==="undefined"){
globalThis.lddPvParsePdfPrompts=function lddPvParsePdfPrompts(pages){
  const prompts=[];
  const fullText=pages.join("\n");
  /* Format B: "001\\nTITLE IN CAPS" — 3-digit number on its own line, caps title next.
     (Format A "1. Title" is handled below.) */
  const fmtBRe=/^[ \t]*(\d{3})[ \t]*\n[ \t]*([A-Z0-9][A-Z0-9 '&!.,\-–—]{2,80})[ \t]*$/gm;
  const bHits=[...fullText.matchAll(fmtBRe)];
  if(bHits.length>=5){
    const promptTitleIdx=new Set(bHits.map(h=>h.index));
    const secRe=/^[ \t]*([A-Z][A-Z &'’-]{2,40})[ \t]*$/gm;
    const secs=[];
    let sm;
    while((sm=secRe.exec(fullText))){
      if(promptTitleIdx.has(sm.index))continue;
      const txt=sm[1].trim();
      if(/^(CONCEPT|PALETTE|TEXT|TYPOGRAPHY|STYLE|FINISH)$/i.test(txt))continue;
      secs.push({idx:sm.index,name:txt});
    }
    bHits.forEach((h,hi)=>{
      const title=h[2].trim();
      const start=h.index, end=hi+1<bHits.length?bHits[hi+1].index:fullText.length;
      let body=fullText.slice(start,end).trim().replace(/\n{3,}/g,"\n\n");
      body=body.replace(/^[ \t]*\d{3}[ \t]*\n[ \t]*[^\n]+\n/,"").trim();
      if(body.length<150)return;
      if(/color\s*palette|#[0-9a-f]{6}\b/i.test(body.slice(0,300)))return;
      let section="";
      for(let si=secs.length-1;si>=0;si--){if(secs[si].idx<start){section=secs[si].name;break;}}
      const secTag=section?section.toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g,""):"";
      prompts.push({title,body,tags:["pdf-import",secTag].filter(Boolean),category:"Other",section});
    });
    return prompts;
  }
  /* Format A: "1. Title" — the (?<![#\dA-Fa-f]) guard stops hex color codes
     like #443229 from matching as "229." */
  const headerRe=/(?<![#\dA-Fa-f])(\d{1,3})\.(?!\d)\s+([^\n—–-]{3,90}?)(?:\s*[—–-]\s*([^\n]{0,140}))?(?=\n|$)/;
  const secReA=/^([A-Z][A-Z &']{2,40}?)\s*[—–-]\s*\d+\s*PROMPTS/im;
  const INTRO_RE=/color\s*palette|hex\s*codes?|\bhex\b.*#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i;
  // join pages first so prompts spanning page breaks stay intact
  const joined=pages.join("\n");
  let section="";
  const secHitAll=joined.match(secReA);
  if(secHitAll)section=secHitAll[1].trim();
  const heads=[];
  const reA=new RegExp(headerRe.source,"g");
  let mA;
  while((mA=reA.exec(joined))){heads.push({idx:mA.index,num:mA[1],title:mA[2].trim()});}
  // drop leading headers that sit inside intro/palette front matter:
  // find first header after which bodies look like real prompts
  let startHi=0;
  for(let hi=0;hi<heads.length;hi++){
    const h=heads[hi];
    const end=hi+1<heads.length?heads[hi+1].idx:joined.length;
    const probe=joined.slice(h.idx,end);
    if(probe.length>500&&!INTRO_RE.test(probe.slice(0,400))){startHi=hi;break;}
  }
  const secTag=section?section.toLowerCase().split(/\s+/)[0]:"";
  const INTRO_TITLE_RE=/^(UPLOAD|CHOOSE|KEEP|IF A MARKING|MULTI[ -]|MAKE IT|BUILD YOUR|CREATE STRONG|TELL BUYERS|OFFER EASY|COLLECT|GENERATE|SET CLEAR|CUSTOMER CHOOSES)/i;
  for(let hi=startHi;hi<heads.length;hi++){
    const h=heads[hi];
    // skip garbled TOC merges (title contains an embedded "123." number)
    if(/\d{1,3}\./.test(h.title))continue;
    if(INTRO_TITLE_RE.test(h.title))continue;
    const start=h.idx,end=hi+1<heads.length?heads[hi+1].idx:joined.length;
    let body=joined.slice(start,end).trim().replace(/\n{3,}/g,"\n\n");
    // strip page footers like "1950s CHRISTMAS • 50 ART PROMPTS   3"
    body=body.replace(/\n[ \t]*\d{1,3}\s*$/,"").trim();
    if(body.length<150)continue;
    if(hi>startHi&&INTRO_RE.test(body.slice(0,300)))continue;
    // skip TOC fragments: body is a dense list of "123. Name" entries, not prose
    const numCount=(body.match(/\b\d{1,3}\./g)||[]).length;
    if(numCount>=4&&body.length<2000)continue;
    prompts.push({title:h.title,body,tags:["pdf-import",secTag].filter(Boolean),category:"Other",section});
  }
  if(prompts.length)return prompts;
  /* Format D: "001 | Philippians 4:13" — 3-digit number, pipe, verse/title reference
     (e.g. the Gen Z Bible PDF). Title prefers the quoted headline when the body
     names one via must read "...". */
  const fmtDRe=/^[ \t]*(\d{3})[ \t]*\|[ \t]*([^\n]{2,120}?)[ \t]*$/gm;
  const dHits=[...fullText.matchAll(fmtDRe)];
  if(dHits.length>=5){
    const secDRe=/^[ \t]*([A-Z][A-Z &']{2,40})[ \t]*\/[ \t]*\d{3}[ \t]*-[ \t]*\d{3}[ \t]*$/gm;
    const dSecs=[];let dsm;while((dsm=secDRe.exec(fullText)))dSecs.push({idx:dsm.index,name:dsm[1].trim()});
    dHits.forEach((h,hi)=>{
      const num=h[1],ref=h[2].trim();
      const start=h.index,end=hi+1<dHits.length?dHits[hi+1].index:fullText.length;
      let body=fullText.slice(start,end).replace(/\n{3,}/g,"\n\n").trim();
      body=body.replace(/^[ \t]*\d{3}[ \t]*\|[ \t]*[^\n]*\n/,"").trim();
      if(body.length<150)return;
      let title="";
      const hq=body.match(/must read\s+"([^"]{3,120})"/i);
      if(hq)title=hq[1].replace(/\s+/g," ").trim();
      if(!title)title=(num+" | "+ref).slice(0,140);
      let section="";
      for(let si=dSecs.length-1;si>=0;si--){if(dSecs[si].idx<start){section=dSecs[si].name;break;}}
      const secTag=section?section.toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g,""):"";
      prompts.push({title:title.slice(0,140),body:body.slice(0,12000),tags:["pdf-import",secTag].filter(Boolean),category:"Other",section});
    });
    return prompts;
  }
  /* Format C (fallback): unnumbered — one prompt per paragraph block.
     Only used when no numbered entries were found at all. */
  if(!prompts.length){
    const blocks=fullText.split(/\n\s*\n/).map(b=>b.replace(/^[•\-*▪◦–—\s]+/,"").trim())
      .filter(b=>b.length>=30&&b.length<=2000&&!/^LDD\s*\//i.test(b)&&!/^\d+$/.test(b));
    if(blocks.length>=5){
      blocks.forEach(b=>{
        const lines=b.split("\n").map(x=>x.trim()).filter(Boolean);
        let title=lines[0]||"";
        if(lines.length===1&&title.length>90){
          const sent=title.match(/^(.{25,90}?[.!?])(\s|$)/);
          title=sent?sent[1]:title.slice(0,90).replace(/\s+\S*$/,"")+"…";
        }else if(title.length>110){
          const sent=title.match(/^(.{25,110}?[.!?])(\s|$)/);
          title=sent?sent[1]:title.slice(0,110).replace(/\s+\S*$/,"");
        }
        if(!title)title=b.slice(0,80);
        prompts.push({title:title.slice(0,140),body:b.slice(0,12000),tags:["pdf-import"],category:"Other",section:""});
      });
    }
  }
  return prompts;
};
}
