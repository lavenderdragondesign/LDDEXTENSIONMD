(() => {
  if (window.__LDD_PROMPT_QUEUE_MODULE__) return;
  window.__LDD_PROMPT_QUEUE_MODULE__ = true;

  const ENABLE_KEY = 'autoPromptQueueEnabled';
  const STATE_KEY = 'lddPromptQueueState_v132';
  const PL_REPO = { owner: 'lavenderdragondesign', repo: 'LDDEXTENSIONMD', path: 'prompt-packs', branch: 'main' };
  const defaults = { raw:'', prompts:[], index:0, running:false, paused:false, delay:3, completed:[], failed:[], collapsed:false };
  let selected = new Set();
  let state = {...defaults};
  let workerToken = 0;
  let root = null;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function smartParse(raw){
    const s=String(raw||'').replace(/\r/g,'').trim(); if(!s) return [];
    let parts=s.split(/^\s*---+\s*$/m).map(x=>x.trim()).filter(Boolean); if(parts.length>1)return parts;
    const lines=s.split('\n'), starts=[];
    const marker=/^\s*(?:(?:\d{1,4})[.)]\s+|Prompt\s*\d+\s*[:.)-]\s*|#\s*\d+\s+)/i;
    lines.forEach((l,i)=>{if(marker.test(l))starts.push(i)});
    if(starts.length>1){starts.push(lines.length);return starts.slice(0,-1).map((a,j)=>lines.slice(a,starts[j+1]).join('\n').replace(marker,'').trim()).filter(Boolean)}
    const cmd=/^\s*(Create|Generate|Design|Make|Render|Illustrate|Produce)\b/i;
    lines.forEach((l,i)=>{if(cmd.test(l))starts.push(i)}); const uniq=[...new Set(starts)].sort((a,b)=>a-b);
    if(uniq.length>1){uniq.push(lines.length);return uniq.slice(0,-1).map((a,j)=>lines.slice(a,uniq[j+1]).join('\n').trim()).filter(Boolean)}
    const blanks=s.split(/\n\s*\n+/).map(x=>x.trim()).filter(Boolean); return blanks.length>1?blanks:[s];
  }
  const editor=()=>document.querySelector('#prompt-textarea')||document.querySelector('textarea[data-testid="prompt-textarea"]')||document.querySelector('div#prompt-textarea[contenteditable="true"]')||document.querySelector('div[contenteditable="true"][data-virtualkeyboard="true"]')||document.querySelector('div[contenteditable="true"][role="textbox"]');
  const sendBtn=()=>document.querySelector('button[data-testid="send-button"]')||document.querySelector('button[aria-label="Send prompt"]')||document.querySelector('button[aria-label="Send message"]')||document.querySelector('button[aria-label^="Send"]');
  const stopBtn=()=>document.querySelector('button[data-testid="stop-button"]')||document.querySelector('button[aria-label*="Stop"]')||document.querySelector('button[data-testid*="stop"]');
  async function putPrompt(text){const el=editor();if(!el)throw Error('Prompt box not found');el.focus();if(el.tagName==='TEXTAREA'){const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;set?set.call(el,text):el.value=text;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}else{el.replaceChildren();const p=document.createElement('p');p.textContent=text;el.appendChild(p);el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));el.dispatchEvent(new Event('change',{bubbles:true}));}await sleep(500);let b=sendBtn();for(let i=0;i<10&&(!b||b.disabled);i++){await sleep(150);b=sendBtn()}if(b&&!b.disabled){b.click();return}el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));el.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));}
  async function waitComplete(token){let saw=false,stable=0;for(let n=0;n<3600;n++){if(token!==workerToken||!state.running)throw Error('stopped');while(state.paused&&token===workerToken&&state.running)await sleep(300);const g=!!stopBtn();if(g){saw=true;stable=0}else if(saw){if(!stable)stable=Date.now();if(Date.now()-stable>1400)return}await sleep(500)}throw Error('Timed out waiting for completion')}
  function save(){chrome.storage.local.set({[STATE_KEY]:state});render()}
  function clearAll(){workerToken++;state={...defaults,delay:state.delay};selected=new Set();save()}
  async function run(onlyIdx){
    if(state.running)return;
    if(selPopupOpen())return;
    if(!state.prompts.length){state.prompts=smartParse(state.raw);state.index=0}
    if(!state.prompts.length)return save();
    let seq=null;
    if(Array.isArray(onlyIdx)&&onlyIdx.length){seq=[...onlyIdx].sort((a,b)=>a-b).filter(i=>i>=0&&i<state.prompts.length);if(!seq.length)return;}
    state.running=true;state.paused=false;const token=++workerToken;save();
    const next=()=>seq?seq.shift():state.index;
    const more=()=>seq?seq.length>0:state.index<state.prompts.length;
    while(state.running&&more()&&token===workerToken){
      while(state.paused&&state.running&&token===workerToken)await sleep(300);
      const i=next();
      try{await putPrompt(state.prompts[i]);await waitComplete(token);state.completed=[...new Set([...state.completed,i])];state.failed=state.failed.filter(x=>x!==i);state.index=i+1;save()}
      catch(e){if(e.message==='stopped')break;state.failed=[...new Set([...state.failed,i])];state.running=false;save();break}
      if(more())await sleep(Math.max(2,Math.min(10,Number(state.delay)||3))*1000);
    }
    if(token===workerToken){state.running=false;state.paused=false;save();}
  }


  /* ---- PDF file picker ---- */
  async function ensurePdfWorker(){
    if(ensurePdfWorker._u) return;
    const url = chrome.runtime.getURL('core/pdf-lib/pdf.worker.min.js');
    const blob = await (await fetch(url)).blob();
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
    ensurePdfWorker._u = true;
  }

  async function loadPdfFile(file){
    if(!file) return;
    try{
      if(!globalThis.pdfjsLib) throw new Error('PDF engine not ready — reload the extension');
      await ensurePdfWorker();
      const buf = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      const pages = [];
      for(let pg = 1; pg <= doc.numPages; pg++){
        const page = await doc.getPage(pg);
        const tc = await page.getTextContent();
        pages.push(tc.items.map(it => it.str).join('\n'));
        try{ page.cleanup(); }catch(_){}
      }
      try{ await doc.destroy(); }catch(_){}
      const found = (globalThis.lddPvParsePdfPrompts || (() => []))(pages);
      if(!found.length) throw new Error('No prompts found in this PDF');
      state.raw = '';
      state.prompts = found.map(f => f.body);
      state.index = 0; state.completed = []; state.failed = [];
      state.packName = file.name;
      selectMode=false; selected=new Set();
      save();
    }catch(e){
      alert('Could not read PDF: ' + (e.message || e));
    }
  }

  function openViewer(i){
    closeViewer();
    const ov=document.createElement('div');
    ov.id='lddPQViewer';
    ov.innerHTML=`<div class="lddPQViewerBox"><div class="lddPQViewerHead"><strong>Prompt ${i+1} of ${state.prompts.length}</strong><button id="lddPQViewerX" title="Close">×</button></div><div class="lddPQViewerText">${esc(state.prompts[i]||'')}</div><div class="lddPQViewerFoot"><button id="lddPQViewerRun" title="Run the queue starting from this prompt">▶ Run from here</button><button id="lddPQViewerDel" class="danger" title="Delete this prompt from the queue">Delete</button><button id="lddPQViewerCopy">Copy prompt</button></div></div>`;
    root.appendChild(ov);
    ov.querySelector('#lddPQViewerX').onclick=closeViewer;
    ov.onclick=e=>{if(e.target===ov)closeViewer()};
    ov.querySelector('#lddPQViewerCopy').onclick=async e=>{try{await navigator.clipboard.writeText(state.prompts[i]||'');e.target.textContent='Copied!';setTimeout(()=>e.target.textContent='Copy prompt',1200)}catch(_){e.target.textContent='Copy failed'}};
    ov.querySelector('#lddPQViewerRun').onclick=()=>{ if(state.running||selPopupOpen()) return; state.index=i; state.paused=false; closeViewer(); run(); };
    ov.querySelector('#lddPQViewerDel').onclick=()=>{
      if(state.running) return;
      const mapOld={}; state.prompts.forEach((_,o)=>{ if(o<i) mapOld[o]=o; else if(o>i) mapOld[o]=o-1; });
      state.completed=state.completed.filter(x=>x!==i).map(x=>mapOld[x]);
      state.failed=state.failed.filter(x=>x!==i).map(x=>mapOld[x]);
      if(state.index>i) state.index--;
      state.index=Math.min(state.index, state.prompts.length-1);
      state.prompts=state.prompts.filter((_,x)=>x!==i);
      selected.delete(i);
      const ns=new Set(); selected.forEach(x=>{ if(x<i) ns.add(x); else if(x>i) ns.add(x-1); }); selected=ns;
      closeViewer(); save();
    };
  }
  const selPopupOpen=()=>{ const p=root?.querySelector('#lddPQSelPopup'); return !!p && !p.hidden; };
  function closeViewer(){root?.querySelector('#lddPQViewer')?.remove()}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeViewer()});
  function mount(){
    if(root) return;
    root = document.createElement('div');
    root.id = 'lddPQRoot';
    root.innerHTML = `
      <button id="lddPQLaunch" title="LDD Prompt Queue"><span class="lddPQBolt">⚡</span><b>Prompt Queue</b><i id="lddPQCount">0</i></button>
      <section id="lddPQPanel">
        <header>
          <div class="lddPQHeadTitle"><strong>Prompt Queue</strong><small>LDD Tools</small></div>
          <div class="lddPQHeadRight"><span id="lddPQPill">READY</span>
            <button id="lddPQCollapse" title="Collapse">−</button>
            <button id="lddPQClose" title="Close">×</button>
          </div>
        </header>
        <div class="lddPQBody">
          <div class="lddPQSection">
            <div class="lddPQSecLabel">Prompts</div>
            <textarea id="lddPQInput" placeholder="Paste your prompts here — or load a PDF pack below…"></textarea>
            <div class="lddPQActionRow">
              <button id="lddPQParse">Detect Prompts</button>
              <button id="lddPQPdf">📄 PDF Pack</button>
              <button id="lddPQClear" class="danger-ghost">Clear</button>
            </div>
            <input type="file" id="lddPQFile" accept="application/pdf,.pdf" hidden>
            <div id="lddPQPackTag" class="lddPQPackTag" hidden></div>
          </div>
          <div class="lddPQSection">
            <div class="lddPQSecLabel">Run</div>
            <div class="lddPQRunRow">
              <label class="lddPQDelay">Delay <input id="lddPQDelay" type="number" min="2" max="10" value="3"><span>sec</span></label>
              <div class="lddPQProgress"><div class="bar"><i id="lddPQBar"></i></div><small id="lddPQCounts">0 / 0</small></div>
            </div>
            <div class="lddPQControls">
              <button id="lddPQStart" class="primary">Start</button>
              <button id="lddPQPause">Pause</button>
              <button id="lddPQSkip">Skip</button>
              <button id="lddPQStop" class="danger">Stop</button>
            </div>
          </div>
          <div class="lddPQSection">
            <div class="lddPQSecLabel lddPQQueueHead">Queue <span id="lddPQListCount"></span><button id="lddPQSelOpen">☑ Select</button></div>
      <div id="lddPQSelPopup" hidden><div class="lddPQSelPopBox">
        <div class="lddPQSelPopHead"><strong>Select prompts</strong><button id="lddPQSelPopX" title="Close">×</button></div>
        <div class="lddPQSelPopRow"><span>Range</span><input id="lddPQRangeFrom" type="number" min="1" placeholder="1"><em>–</em><input id="lddPQRangeTo" type="number" min="1" placeholder="5"><button id="lddPQRangeGo">Select range</button></div>
        <div class="lddPQSelPopRow"><button id="lddPQSelAll">Select all</button><button id="lddPQSelCancel">Clear selection</button></div>
        <div id="lddPQSelCount" class="lddPQSelCount"></div>
        <div class="lddPQSelPopRow"><button id="lddPQSelPopRun" class="primary">▶ Run selected</button><button id="lddPQSelDel" class="danger">Delete selected</button></div>
      </div></div>
            <div id="lddPQList"></div>
          </div>
        </div>
      </section>`;
    document.documentElement.appendChild(root);
    const $ = id => root.querySelector('#' + id);
    const panel = $('lddPQPanel');
    $('lddPQLaunch').onclick = () => panel.classList.toggle('open');
    $('lddPQClose').onclick = () => panel.classList.remove('open');
    $('lddPQCollapse').onclick = () => { state.collapsed = !state.collapsed; save(); };
    $('lddPQInput').oninput = e => { state.raw = e.target.value; state.packName = ''; chrome.storage.local.set({ [STATE_KEY]: state }); };
    $('lddPQDelay').onchange = e => { state.delay = Math.max(2, Math.min(10, +e.target.value || 3)); save(); };
    $('lddPQParse').onclick = () => { state.raw = $('lddPQInput').value; state.prompts = smartParse(state.raw); state.index = 0; state.completed = []; state.failed = []; state.packName = ''; selectMode=false; selected=new Set(); save(); };
    $('lddPQClear').onclick = () => { if(state.running) return; clearAll(); };
    $('lddPQPdf').onclick = () => $('lddPQFile').click();
    $('lddPQFile').onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value=''; loadPdfFile(f); };
    $('lddPQStart').onclick = () => {
      if(state.paused){ state.paused = false; save(); return; }
      if(selected.size && !state.running){ run([...selected]); return; }
      run();
    };
    $('lddPQPause').onclick = () => { if(state.running){ state.paused = !state.paused; save(); } };
    $('lddPQStop').onclick = () => { state.running = false; state.paused = false; workerToken++; save(); };
    $('lddPQSkip').onclick = () => { if(state.index < state.prompts.length){ state.index++; save(); } };
    $('lddPQSelCancel').onclick = () => { selected = new Set(); render(); };
    $('lddPQSelOpen').onclick = () => { $('lddPQSelPopup').hidden = false; render(); };
    $('lddPQSelPopX').onclick = () => { $('lddPQSelPopup').hidden = true; };
    $('lddPQSelPopRun').onclick = () => { if(!selected.size||state.running) return; $('lddPQSelPopup').hidden = true; run([...selected]); };
    $('lddPQSelAll').onclick = () => { selected = new Set(state.prompts.map((_,i)=>i)); render(); };
    $('lddPQRangeGo').onclick = () => {
      const n = state.prompts.length;
      let a = Math.max(1, Math.min(n, +$('lddPQRangeFrom').value || 1));
      let b = Math.max(1, Math.min(n, +$('lddPQRangeTo').value || n));
      if(a > b) [a,b] = [b,a];
      for(let i = a-1; i < b; i++) selected.add(i);
      render();
    };
    $('lddPQSelDel').onclick = () => {
      if(!selected.size || state.running) return;
      const keep = state.prompts.filter((_,i)=>!selected.has(i));
      const oldIdx = state.prompts.map((_,i)=>i).filter(i=>!selected.has(i));
      const mapOld = {}; oldIdx.forEach((o,n)=>mapOld[o]=n);
      state.completed = state.completed.filter(i=>!selected.has(i)).map(i=>mapOld[i]);
      state.failed = state.failed.filter(i=>!selected.has(i)).map(i=>mapOld[i]);
      state.index = Math.min(state.index, keep.length);
      state.prompts = keep;
      selected = new Set();
      $('lddPQSelPopup').hidden = true;
      save();
    };
    $('lddPQList').onclick = e => {
      const cb = e.target.closest('input.lddPQSel');
      if(cb){
        const i = +cb.dataset.i;
        cb.checked ? selected.add(i) : selected.delete(i);
        render();
        return;
      }
      const tx = e.target.closest('.lddPQItemText');
      if(tx) openViewer(+tx.dataset.i);
    };
    chrome.storage.local.get(STATE_KEY, x => {
      state = { ...defaults, ...(x[STATE_KEY] || {}) };
      state.running = false; state.paused = false;
      render();
      if(state.lddPQAutoOpen){ state.lddPQAutoOpen = false; state.collapsed = false; panel.classList.add('open'); save(); }
    });
  }
  function unmount(){ workerToken++; state.running = false; state.paused = false; root?.remove(); root = null; }
  function render(){
    if(!root) return;
    const $ = id => root.querySelector('#' + id);
    if(document.activeElement !== $('lddPQInput')) $('lddPQInput').value = state.raw || '';
    $('lddPQDelay').value = state.delay || 3;
    $('lddPQPanel')?.classList.toggle('collapsed', !!state.collapsed);
    $('lddPQCollapse').textContent = state.collapsed ? '+' : '−';
    const total = state.prompts.length, done = state.completed.length;
    const pill = $('lddPQPill');
    const st = state.paused ? 'PAUSED' : state.running ? 'RUNNING' : 'READY';
    pill.textContent = st;
    pill.dataset.st = st;
    $('lddPQBar').style.width = (total ? Math.round(done / total * 100) : 0) + '%';
    $('lddPQCounts').textContent = done + ' / ' + total + ' complete';
    $('lddPQCount').textContent = total || '';
    $('lddPQCount').style.display = total ? '' : 'none';
    $('lddPQStart').textContent = state.paused ? 'Resume' : state.running ? 'Running…' : (selected.size ? `Start (${selected.size})` : 'Start');
    $('lddPQStart').disabled = state.running && !state.paused;
    $('lddPQPause').textContent = state.paused ? 'Resume' : 'Pause';
    $('lddPQClear').disabled = state.running || (!state.raw && !total);
    const tag = $('lddPQPackTag');
    if(state.packName){ tag.hidden = false; tag.innerHTML = '📄 ' + esc(state.packName.replace(/\.pdf$/i,'')) + ' <button id="lddPQPackX" title="Remove pack">×</button>';
      tag.querySelector('#lddPQPackX').onclick = () => { state.packName = ''; save(); };
    } else tag.hidden = true;
    $('lddPQListCount').textContent = total ? `(${total})` : '';
    $('lddPQSelDel').disabled = !selected.size || state.running;
    const pr=$('lddPQSelPopRun'); if(pr) pr.disabled = !selected.size || state.running;
    $('lddPQSelDel').textContent = selected.size ? `Delete selected (${selected.size})` : 'Delete selected';
    $('lddPQSelCount').textContent = selected.size ? `${selected.size} selected` : '';
    $('lddPQList').innerHTML = total
      ? state.prompts.map((p,i)=>`<div class="item ${i===state.index&&state.running?'current':''} ${state.completed.includes(i)?'done':''} ${state.failed.includes(i)?'fail':''}"><input type="checkbox" class="lddPQSel" data-i="${i}" ${selected.has(i)?'checked':''} title="Select prompt ${i+1}"><span>${state.completed.includes(i)?'✓':state.failed.includes(i)?'!':(i===state.index&&state.running)?'▶':i+1}</span><div class="lddPQItemText" data-i="${i}" title="Click to view full prompt">${esc(p.slice(0,180))}${p.length>180?'…':''}</div></div>`).join('')
      : '<div class="lddPQEmpty">Queue is empty — paste prompts or load a PDF pack.</div>';
  }
  function sync(on){ on ? mount() : unmount(); }
  chrome.storage.local.get({ [ENABLE_KEY]: true }, r => sync(r[ENABLE_KEY] !== false));
  chrome.storage.onChanged.addListener((c, a) => { if(a === 'local' && c[ENABLE_KEY]) sync(!!c[ENABLE_KEY].newValue); });
})();
