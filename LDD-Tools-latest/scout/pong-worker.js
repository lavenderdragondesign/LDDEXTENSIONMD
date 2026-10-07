// Dragon Pong physics runs away from the MyDesigns page's main JavaScript thread.
let timer=null,s=null;
function reset(dir=Math.random()<.5?-1:1){s.x=s.w/2;s.y=s.h/2;const speed=Math.max(155,s.w*.54);s.vx=speed*dir;s.vy=(Math.random()*.8-.4)*speed}
function tick(){if(!s||!s.playing||s.hidden)return;const now=performance.now(),dt=Math.min(.05,(now-s.last)/1000||0);s.last=now;
 const {w,h}=s,pw=Math.max(8,w*.026),ph=Math.max(46,h*.24),pad=Math.max(16,w*.065),ball=Math.max(7,w*.022);
 s.ai+=(s.y-s.ai)*Math.min(1,dt*4.1);s.x+=s.vx*dt;s.y+=s.vy*dt;
 if(s.y<ball){s.y=ball;s.vy=Math.abs(s.vy)}if(s.y>h-ball){s.y=h-ball;s.vy=-Math.abs(s.vy)}
 const hit=(cx,cy)=>s.x+ball>=cx-pw/2&&s.x-ball<=cx+pw/2&&s.y+ball>=cy-ph/2&&s.y-ball<=cy+ph/2;
 if(s.vx<0&&hit(pad,s.player)){s.x=pad+pw/2+ball;s.vx=Math.abs(s.vx)*1.035;s.vy+=(s.y-s.player)*4}
 if(s.vx>0&&hit(w-pad,s.ai)){s.x=w-pad-pw/2-ball;s.vx=-Math.abs(s.vx)*1.035;s.vy+=(s.y-s.ai)*3}
 if(s.x<-ball){s.enemy++;if(s.enemy>=10)s.playing=false;else reset(1)}else if(s.x>w+ball){s.score++;if(s.score>=10)s.playing=false;else reset(-1)}
 postMessage({type:'frame',x:s.x,y:s.y,ai:s.ai,player:s.player,score:s.score,enemy:s.enemy,finished:!s.playing});
}
onmessage=e=>{const m=e.data;if(m.type==='init'){s={w:m.w,h:m.h,player:m.h/2,ai:m.h/2,score:0,enemy:0,last:performance.now(),hidden:false,playing:false};reset();timer=setInterval(tick,33);postMessage({type:'ready'})}
 else if(!s)return;else if(m.type==='play'){s.score=0;s.enemy=0;s.player=s.h/2;s.ai=s.h/2;s.playing=true;s.last=performance.now();reset();postMessage({type:'frame',x:s.x,y:s.y,ai:s.ai,player:s.player,score:0,enemy:0})}
 else if(m.type==='pointer')s.player=Math.max(0,Math.min(s.h,m.y));else if(m.type==='visible'){s.hidden=!m.visible;s.last=performance.now()}else if(m.type==='resize'){s.w=m.w;s.h=m.h;s.player=m.h/2;s.ai=m.h/2;reset()}};
