// Dragon Pong runs only while the style creation panel is visible.
(()=>{
  if(globalThis.LDDScoutPong)return;
  let game=null;
  function stop(){if(!game)return;game.stopped=true;cancelAnimationFrame(game.raf);game.resize?.disconnect();game.abort?.abort();game.worker?.terminate();if(game.workerURL)URL.revokeObjectURL(game.workerURL);game=null}
  function start(canvas){
    if(!canvas||game?.canvas===canvas)return;stop();
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
    const card=canvas.closest('.ldd-pong-card'),overlay=card.querySelector('.ldd-pong-overlay');
    const s={canvas,ctx,card,overlay,stopped:false,playing:false,raf:0,resize:null,w:0,h:0,player:0,ai:0,x:0,y:0,vx:0,vy:0,score:0,enemy:0,last:0,drawn:0,abort:new AbortController()};game=s;
    const playerScore=card.querySelector('.ldd-pong-player'),enemyScore=card.querySelector('.ldd-pong-enemy');
    function resetBall(dir=Math.random()<.5?-1:1){s.x=s.w/2;s.y=s.h/2;const speed=Math.max(155,s.w*.54);s.vx=speed*dir;s.vy=(Math.random()*.8-.4)*speed}
    function measure(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);s.w=r.width;s.h=r.height;s.player=s.h/2;s.ai=s.h/2;resetBall();s.worker?.postMessage({type:'resize',w:s.w,h:s.h});draw()}
    function draw(){if(!s.w||!s.h)return;const {w,h}=s,pad=Math.max(16,w*.065),pw=Math.max(8,w*.026),ph=Math.max(46,h*.24),ball=Math.max(7,w*.022);ctx.fillStyle='#071020';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffffff40';for(let y=8;y<h;y+=20)ctx.fillRect(w/2-1,y,2,10);ctx.fillStyle='#00eeff';ctx.fillRect(pad-pw/2,s.player-ph/2,pw,ph);ctx.fillStyle='#ff2bd6';ctx.fillRect(w-pad-pw/2,s.ai-ph/2,pw,ph);ctx.font=`${Math.max(25,ball*3.2)}px "Segoe UI Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐉',s.x,s.y+1)}
    function finish(){s.playing=false;s.overlay.hidden=false;s.overlay.querySelector('strong').textContent=s.score>=10?'🐉 You win!':'🐉 Dragon wins!';s.overlay.querySelector('span').textContent=`${s.score} : ${s.enemy} · First to 10`;s.overlay.querySelector('button').textContent='Play Again'}
    function play(){s.score=0;s.enemy=0;playerScore.textContent='0';enemyScore.textContent='0';s.player=s.h/2;s.ai=s.h/2;resetBall();s.last=0;s.drawn=0;s.playing=true;s.overlay.hidden=true;cancelAnimationFrame(s.raf);if(s.worker)s.worker.postMessage({type:'play'});else s.raf=requestAnimationFrame(frame)}
    s.resize=new ResizeObserver(measure);s.resize.observe(canvas);measure();
    // A dedicated worker calculates motion; the page only paints the latest frame.
    (async()=>{try{const response=await fetch(chrome.runtime.getURL('scout/pong-worker.js'));if(!response.ok)throw Error('Worker unavailable');const source=await response.text();if(s.stopped)return;const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));s.workerURL=url;const worker=new Worker(url);s.worker=worker;worker.onerror=()=>{worker.terminate();s.worker=null;if(s.playing){s.last=0;s.raf=requestAnimationFrame(frame)}};worker.onmessage=e=>{if(s.stopped)return;const m=e.data;if(m.type!=='frame')return;s.x=m.x;s.y=m.y;s.ai=m.ai;s.player=m.player;s.score=m.score;s.enemy=m.enemy;playerScore.textContent=String(m.score);enemyScore.textContent=String(m.enemy);draw();if(m.finished)finish()};worker.postMessage({type:'init',w:s.w,h:s.h});if(s.playing)worker.postMessage({type:'play'})}catch{ /* RAF fallback retains the game if site CSP blocks workers. */}})();
    document.addEventListener('visibilitychange',()=>s.worker?.postMessage({type:'visible',visible:!document.hidden}),{signal:s.abort.signal});
    card.querySelector('.ldd-pong-play').addEventListener('click',play,{signal:s.abort.signal});
    canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();s.player=Math.max(0,Math.min(s.h,e.clientY-r.top));s.worker?.postMessage({type:'pointer',y:s.player})},{signal:s.abort.signal});
    function frame(now){
      if(s.stopped||!card.isConnected||!s.playing||s.worker)return;
      s.raf=requestAnimationFrame(frame);
      if(document.hidden){s.last=now;return}
      // Cap drawing work at 30 fps, while using elapsed time for game movement.
      if(now-s.drawn<32)return;
      const dt=Math.min(.04,s.last?(now-s.last)/1000:0);s.last=now;s.drawn=now;
      const {w,h}=s,pw=Math.max(8,w*.026),ph=Math.max(46,h*.24),pad=Math.max(16,w*.065),ball=Math.max(7,w*.022);
      s.ai+=(s.y-s.ai)*Math.min(1,dt*4.1);s.x+=s.vx*dt;s.y+=s.vy*dt;
      if(s.y<ball){s.y=ball;s.vy=Math.abs(s.vy)}if(s.y>h-ball){s.y=h-ball;s.vy=-Math.abs(s.vy)}
      const hit=(cx,cy)=>s.x+ball>=cx-pw/2&&s.x-ball<=cx+pw/2&&s.y+ball>=cy-ph/2&&s.y-ball<=cy+ph/2;
      if(s.vx<0&&hit(pad,s.player)){s.x=pad+pw/2+ball;s.vx=Math.abs(s.vx)*1.035;s.vy+=(s.y-s.player)*4}
      if(s.vx>0&&hit(w-pad,s.ai)){s.x=w-pad-pw/2-ball;s.vx=-Math.abs(s.vx)*1.035;s.vy+=(s.y-s.ai)*3}
      if(s.x<-ball){enemyScore.textContent=++s.enemy;if(s.enemy>=10){draw();finish();return}resetBall(1)}
      else if(s.x>w+ball){playerScore.textContent=++s.score;if(s.score>=10){draw();finish();return}resetBall(-1)}
      draw();
    }
  }
  globalThis.LDDScoutPong={start,stop};
})();
