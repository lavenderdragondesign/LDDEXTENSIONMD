(() => {
  if (window.__LDD_PROMPT_QUEUE_MODULE__) return;
  window.__LDD_PROMPT_QUEUE_MODULE__ = true;

  const ENABLE_KEY = 'autoPromptQueueEnabled';
  const STATE_KEY = 'lddPromptQueueState_v132';
  const defaults = { raw:'', prompts:[], index:0, running:false, paused:false, delay:3, completed:[], failed:[], collapsed:false };
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
  async function run(){if(state.running)return;if(!state.prompts.length){state.prompts=smartParse(state.raw);state.index=0}if(!state.prompts.length)return save();state.running=true;state.paused=false;const token=++workerToken;save();while(state.running&&state.index<state.prompts.length&&token===workerToken){while(state.paused&&state.running&&token===workerToken)await sleep(300);const i=state.index;try{await putPrompt(state.prompts[i]);await waitComplete(token);state.completed=[...new Set([...state.completed,i])];state.failed=state.failed.filter(x=>x!==i);state.index=i+1;save()}catch(e){if(e.message==='stopped')break;state.failed=[...new Set([...state.failed,i])];state.running=false;save();break}if(state.index<state.prompts.length)await sleep(Math.max(2,Math.min(10,Number(state.delay)||3))*1000)}if(token===workerToken){state.running=false;state.paused=false;save()}}

  function mount(){if(root)return;root=document.createElement('div');root.id='lddPQRoot';root.innerHTML=`<button id="lddPQLaunch" title="LDD Auto Prompt Queue"><span>⚡</span><b>Prompt Queue</b></button><section id="lddPQPanel"><header><div><strong>Auto Prompt Queue</strong><small>LDD Tools</small></div><div><button id="lddPQCollapse" title="Collapse">−</button><button id="lddPQClose" title="Close">×</button></div></header><div class="lddPQBody"><textarea id="lddPQInput" placeholder="Paste your prompts here…"></textarea><div class="lddPQTools"><button id="lddPQParse">Detect Prompts</button><label>Delay <input id="lddPQDelay" type="number" min="2" max="10" value="3"> sec</label></div><div id="lddPQStatus"></div><div class="lddPQControls"><button id="lddPQStart">Start</button><button id="lddPQPause">Pause</button><button id="lddPQSkip">Skip</button><button id="lddPQStop">Stop</button></div><div id="lddPQList"></div></div></section>`;document.documentElement.appendChild(root);
    const $=id=>root.querySelector('#'+id), panel=$('lddPQPanel');
    $('lddPQLaunch').onclick=()=>panel.classList.toggle('open'); $('lddPQClose').onclick=()=>panel.classList.remove('open');
    $('lddPQCollapse').onclick=()=>{state.collapsed=!state.collapsed;save()};
    $('lddPQInput').oninput=e=>{state.raw=e.target.value;chrome.storage.local.set({[STATE_KEY]:state})};
    $('lddPQDelay').onchange=e=>{state.delay=Math.max(2,Math.min(10,+e.target.value||3));save()};
    $('lddPQParse').onclick=()=>{state.raw=$('lddPQInput').value;state.prompts=smartParse(state.raw);state.index=0;state.completed=[];state.failed=[];save()};
    $('lddPQStart').onclick=()=>state.paused?(state.paused=false,save()):run(); $('lddPQPause').onclick=()=>{if(state.running){state.paused=!state.paused;save()}};
    $('lddPQStop').onclick=()=>{state.running=false;state.paused=false;workerToken++;save()}; $('lddPQSkip').onclick=()=>{if(state.index<state.prompts.length){state.index++;save()}};
    chrome.storage.local.get(STATE_KEY,x=>{state={...defaults,...(x[STATE_KEY]||{})};state.running=false;state.paused=false;render();
      if(state.lddPQAutoOpen){state.lddPQAutoOpen=false;state.collapsed=false;panel.classList.add('open');save();}});
  }
  function unmount(){workerToken++;state.running=false;state.paused=false;root?.remove();root=null}
  function render(){if(!root)return;const $=id=>root.querySelector('#'+id);if(document.activeElement!==$('lddPQInput'))$('lddPQInput').value=state.raw||'';$('lddPQDelay').value=state.delay||3;root.querySelector('#lddPQPanel')?.classList.toggle('collapsed',!!state.collapsed);$('lddPQCollapse').textContent=state.collapsed?'+':'−';const total=state.prompts.length,done=state.completed.length,rem=Math.max(0,total-state.index);$('lddPQStatus').innerHTML=`<div><b>${state.paused?'PAUSED':state.running?'RUNNING':'READY'}</b><span>${done}/${total} complete</span></div><div class="bar"><i style="width:${total?Math.round(done/total*100):0}%"></i></div><small>${rem} remaining</small>`;$('lddPQStart').textContent=state.paused?'Resume':state.running?'Running…':'Start';$('lddPQPause').textContent=state.paused?'Resume':'Pause';$('lddPQList').innerHTML=state.prompts.map((p,i)=>`<div class="item ${i===state.index?'current':''} ${state.completed.includes(i)?'done':''} ${state.failed.includes(i)?'fail':''}"><span>${state.completed.includes(i)?'✓':state.failed.includes(i)?'!':i===state.index?'▶':i+1}</span><div>${esc(p.slice(0,180))}${p.length>180?'…':''}</div></div>`).join('')}
  function sync(on){on?mount():unmount()}
  chrome.storage.local.get({[ENABLE_KEY]:true},r=>sync(r[ENABLE_KEY]!==false));
  chrome.storage.onChanged.addListener((c,a)=>{if(a==='local'&&c[ENABLE_KEY])sync(!!c[ENABLE_KEY].newValue)});
})();
