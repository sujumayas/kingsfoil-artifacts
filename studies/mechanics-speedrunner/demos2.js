"use strict";
// ======================================================================
// demos2 (Agent F): elements (C), enemies (D), map design (E), difficulty (F),
// social (G) and race infrastructure (H). 24 figures, vector ink on paper.
// Everything lives in one closure. Generic core.js helpers are used when they
// exist (reg, ctl, clamp, lerp, mkRng, $$); every game helper (physics step,
// courses, the stick samurai rig, dust, camera, synth sounds) has a local copy
// under `local` so the file works even if core.js never gains SR.*. When
// core.js exposes SR with the same signatures, `H` prefers it (see pick()).
// World units are the game's: hero 20x46 u, ground top y 600, step 1/120 s.
// ======================================================================
(()=>{
const g=typeof globalThis!=='undefined'?globalThis:window;
const REG=typeof reg==='function'?reg:(n,f)=>console.warn('no runner for',n);
const CL=typeof clamp==='function'?clamp:(v,a,b)=>v<a?a:v>b?b:v;
const LP=typeof lerp==='function'?lerp:(a,b,t)=>a+(b-a)*t;
const RNG=typeof mkRng==='function'?mkRng:a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const Q=(s,r=document)=>r.querySelector(s),QQ=(s,r=document)=>[...r.querySelectorAll(s)];
const CTL=typeof ctl==='function'?ctl:root=>{const gk=k=>root.querySelector(`[data-k="${k}"]`);return {el:gk,v:k=>{const e=gk(k);return e.type==='checkbox'?e.checked:+e.value;},
  on:(k,fn)=>{const e=gk(k);if(e){e.addEventListener('input',fn);e.addEventListener('change',fn);}},out:(k,t)=>{const o=root.querySelector(`[data-o="${k}"]`);if(o)o.textContent=t;},
  btn:(k,fn)=>{const e=root.querySelector(`[data-b="${k}"]`);if(e)e.addEventListener('click',()=>fn(e));return e;},
  seg:(k,fn)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(!s)return;s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;QQ('button',s).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);});},
  segv:k=>{const b=root.querySelector(`[data-seg="${k}"] button.on`);return b?b.dataset.v:null;},
  setSeg:(k,v)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(s)QQ('button',s).forEach(x=>x.classList.toggle('on',x.dataset.v===String(v)));}};};

// ---------- ink palette and text ----------------------------------------
const INK='#0a0a0a',RED='#d0281f',GREY='#8a8a8a',LIGHT='#d8d8d8',PALE='#efefef',PAPER='#ffffff',GREEN='#1f9d55',GOLD='#b8891a',MUTE='#6f6a63',BLUE='#1478c8',SILVER='#9a9a9a',BRONZE='#8c5a2b';
const FS='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',MONO='ui-monospace, "SF Mono", Menlo, Consolas, monospace';
function T(c,s,x,y,o={}){c.font=`${o.w||400} ${o.s||12}px ${o.mono?MONO:FS}`;c.fillStyle=o.col||INK;c.textAlign=o.al||'left';c.textBaseline=o.bl||'alphabetic';c.fillText(String(s),x,y);}
function TW(c,s,o={}){c.font=`${o.w||400} ${o.s||12}px ${o.mono?MONO:FS}`;return c.measureText(String(s)).width;}
function label(c,s,x,y,o={}){const w=TW(c,s,o)+8,h=(o.s||12)+6;c.fillStyle=o.bg||PAPER;c.globalAlpha=o.a==null?.85:o.a;c.fillRect(o.al==='center'?x-w/2:o.al==='right'?x-w:x-4,y-h+4,w,h);c.globalAlpha=1;T(c,s,x,y,o);}
const fmtT=ms=>{ms=Math.max(0,Math.round(ms));const s=Math.floor(ms/1000),m=Math.floor(s/60);return (m?m+':':'')+String(s%60).padStart(m?2:1,'0')+'.'+String(ms%1000).padStart(3,'0');};
const fmt2=ms=>(ms/1000).toFixed(2)+' s';
const kb=b=>b>=1024?(b/1024).toFixed(1)+' KB':b+' B';
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const hex2=(a,b,k)=>{const A=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),B=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('');};

// ---------- stage: a 640-wide canvas drawn at device resolution --------
function stage(root,i=0){const cv=QQ('canvas',root)[i],W=+cv.getAttribute('width'),H=+cv.getAttribute('height');const dpr=Math.min(2,g.devicePixelRatio||1);
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}const c=cv.getContext('2d');
  const S={cv,c,W,H,dpr,begin(bg=PAPER){c.setTransform(dpr,0,0,dpr,0,0);c.globalAlpha=1;c.setLineDash([]);c.fillStyle=bg;c.fillRect(0,0,W,H);c.lineCap='round';c.lineJoin='round';},
    pos(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];}};return S;}
// idle tracker: a figure plays alone after 2 s without input
function idler(root){const I={t:performance.now()-3000,touch(){I.t=performance.now();},get idle(){return performance.now()-I.t>2000;}};
  for(const ev of ['pointerdown','keydown','input','change'])root.addEventListener(ev,()=>I.touch(),true);return I;}
// fixed 120 Hz accumulator; slow(q) reads the 0.25x checkbox
const slow=q=>{const e=q.el&&q.el('slow');return e&&e.checked?.25:1;};
function fixed(hz=120){let acc=0;const dt=1/hz;return (sec,fn)=>{acc+=sec;let n=0;while(acc>=dt&&n<16){acc-=dt;fn(dt);n++;}if(n>=16)acc=0;return n;};}
const HUD=(root,t)=>{const h=root.querySelector('[data-hud]');if(h)h.textContent=t;};
const RO=(root,html)=>{const r=root.querySelector('[data-ro]');if(r)r.innerHTML=html;};

// ---------- audio: synth voices from the game, off until a gesture ------
const AU={ctx:null,on:false,enable(){try{if(!this.ctx)this.ctx=new (g.AudioContext||g.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();this.on=true;}catch(_){this.on=false;}return this.on;},
  tone(f1,f2,dur,vol,wave='triangle',delay=0){const a=this.ctx,t=a.currentTime,o=a.createOscillator(),gn=a.createGain();o.type=wave;o.frequency.setValueAtTime(f1,t+delay);o.frequency.exponentialRampToValueAtTime(Math.max(1,f2),t+delay+dur);
    gn.gain.setValueAtTime(vol,t+delay);gn.gain.exponentialRampToValueAtTime(.0001,t+delay+dur);o.connect(gn).connect(a.destination);o.start(t+delay);o.stop(t+delay+dur+.02);},
  noise(dur,vol,freq){const a=this.ctx,b=a.createBuffer(1,Math.floor(a.sampleRate*dur),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
    const s=a.createBufferSource(),f=a.createBiquadFilter(),gn=a.createGain();f.type='lowpass';f.frequency.value=freq;gn.gain.value=vol;s.buffer=b;s.connect(f).connect(gn).connect(a.destination);s.start(a.currentTime);},
  play(n){if(!this.on||!this.ctx)return;const j=1+(Math.random()-.5)*.08;try{switch(n){
    case 'jump':this.tone(420*j,760*j,.09,.07);break;case 'wall':this.tone(520*j,980*j,.1,.08,'square');this.noise(.06,.12,2400);break;
    case 'land':this.noise(.08,.18,700);break;case 'roll':this.noise(.22,.14,900);break;case 'die':this.tone(300,70,.3,.09,'sawtooth');break;
    case 'check':this.tone(880,1320,.12,.05,'sine');break;case 'finish':[523,659,784,1046].forEach((f,i)=>this.tone(f,f,.22,.08,'triangle',i*.08));break;
    case 'slash':this.noise(.18,.25,5000);this.tone(2400,700,.16,.06,'sawtooth');break;case 'spring':this.tone(300*j,1200*j,.14,.08,'triangle');break;
    case 'bounce':this.tone(500*j,900*j,.1,.07,'square');break;case 'tick':this.tone(1200,1200,.03,.04,'square');break;case 'beep':this.tone(660,660,.12,.08,'sine');break;
    case 'go':this.tone(990,990,.25,.09,'sine');break;case 'rival':this.tone(660,990,.12,.06,'sine');this.tone(990,1320,.14,.06,'sine',.12);break;
    case 'shake':this.noise(.05,.05,400);break;case 'warn':this.tone(1500,1500,.06,.05,'square');this.tone(1500,1500,.06,.05,'square',.1);break;}}catch(_){}}};
// sound button: data-b="snd", aria-pressed; sounds only after this click
function sndBtn(root,q){const b=q.btn('snd',e=>{const on=e.getAttribute('aria-pressed')!=='true';if(on)AU.enable();else AU.on=false;e.setAttribute('aria-pressed',on);e.textContent=on?'Sound on':'Sound off';});return ()=>b&&b.getAttribute('aria-pressed')==='true';}
const SFX=(root,snd,n)=>{if(snd&&snd())AU.play(n);};

// ======================================================================
// local: the game's physics, courses, rig, dust, camera (SR.* fallback)
// ======================================================================
const local={};
local.PHYS={maxRun:420,groundAccel:2700,turnAccel:5200,groundFric:3000,overspeedDecay:500,airAccel:1900,airDrag:160,gravity:2500,fallMult:1.65,apexMult:.55,apexBand:90,maxFall:1150,
  jumpVel:830,jumpCut:.45,coyote:.10,buffer:.13,wallSlideMax:115,wallStick:.10,wallCoyote:.08,wallJumpX:440,wallJumpY:790,wallJumpSameY:330,wallLock:.15,wallClimbX:190,wallClimbLock:.07,
  rollFall:230,rollTime:.42,rollMinSpeed:280,flipTime:.46,flipMinSpeed:250};
const PW=20,PH=46,BL=46,DT=1/120,G=600;
// sin table built with Math.fround: the sim never calls Math.sin (H3)
const SINT=new Float32Array(4097);for(let i=0;i<=4096;i++)SINT[i]=Math.fround(Math.sin(i/4096*Math.PI*2));
const sinTable=ph=>{ph-=Math.floor(ph);const f=ph*4096,i=Math.floor(f);return SINT[i]+(SINT[i+1]-SINT[i])*(f-i);};
const cosTable=ph=>sinTable(ph+.25);
const overlap=(x,y,w,h,s)=>x<s[0]+s[2]&&x+w>s[0]&&y<s[1]+s[3]&&y+h>s[1];
const isTile=s=>s[4]==='tile'||!!s.mv;
const tileRise=s=>s.mv&&s.mv.prev?Math.max(0,s.mv.prev[1]-s[1]):0;
// a world: solids [x,y,w,h,tag], movers, timed blocks, springs, spikes, checkpoints, finish
local.makeCourse=function(spec){const w={solids:[],movers:[],timed:[],springs:[],spikes:[],checkpoints:[],enemies:[],width:4000,top:-400,deathY:700,start:{x:120,y:G},finish:null,labels:[],...spec};return w;};
// movers and wheels on the level clock (steps), report §7 moverPos
local.moverAt=function(mv,steps){const t=steps*DT;if(mv.lin){const u=Math.max(0,t-(mv.t0||0));return [mv.x0+mv.vx*u,mv.y0,mv.w,mv.h||18];}if(mv.wheel){const ph=(t/mv.period)+(mv.phase||0);return [mv.cx+mv.r*cosTable(ph)-mv.w/2,mv.cy+mv.r*sinTable(ph)-(mv.h||18)/2,mv.w,mv.h||18];}
  const ph=((t/mv.period)+(mv.phase||0))%1,s=.5-.5*cosTable(ph);return [mv.x0+(mv.x1-mv.x0)*s,mv.y0+(mv.y1-mv.y0)*s,mv.w,mv.h||18];};
// report §7 timedBlockSolid: 4-tick cycle, visible 2 ticks, gone 2 ticks
local.timedOn=function(b,steps,tick=.5){const t=Math.floor(steps*DT/tick);return ((t+(b.seq||0))%4)<2;};
local.timedShake=function(b,steps,tick=.5,pre=.3){const t=steps*DT,cyc=4*tick,u=((t+(b.seq||0)*tick)%cyc+cyc)%cyc;const off=2*tick;return u<off&&u>off-pre?(u-(off-pre))/pre:0;};
// report §7 patrolX: a triangle wave between x0 and x1
local.patrolX=function(e,steps,speed=85){const span=e.x1-e.x0,period=2*span/speed,u=((steps*DT)/period)%1;return e.x0+span*(u<.5?u*2:2-u*2);};
function updateWorld(w,steps,o={}){for(const mv of w.movers){mv.prev=mv.cur||local.moverAt(mv,steps);mv.cur=local.moverAt(mv,steps);mv.cur.mv=mv;}
  for(const b of w.timed){b.on=o.timedOff?true:local.timedOn(b,steps,o.tick||.5);b.shake=o.noShake?0:local.timedShake(b,steps,o.tick||.5,o.pre||.3);}
  for(const sp of w.springs)sp.comp=Math.max(0,(sp.comp||0)-DT);}
function solidAt(w,x,y,ww,h,land=null){const hit=s=>!isTile(s)||(land&&land.vy>0&&land.feet<=s[1]+3+tileRise(s));
  for(const s of w.solids)if(overlap(x,y,ww,h,s)&&hit(s))return s;
  for(const b of w.timed)if(b.on&&overlap(x,y,ww,h,b.r))return b.r;
  for(const mv of w.movers)if(mv.cur&&overlap(x,y,ww,h,mv.cur)&&hit(mv.cur))return mv.cur;return null;}
function groundBelow(w,x,fromY=-1e9){let best=1e9;for(const s of w.solids)if(x>=s[0]&&x<=s[0]+s[2]&&s[1]>=fromY&&s[1]<best)best=s[1];return best;}
local.mkP=function(x,y){return {x,y:y-PH,px:x,py:y-PH,vx:0,vy:0,onGround:false,facing:1,coyote:0,buffer:0,wallLock:0,wallMemT:0,wallMem:0,wallDir:0,wallStickT:0,wasWall:false,land:0,stretch:0,roll:0,flipOn:false,flip:0,flipPending:false,flipDir:1,
  holdT:0,jumpCut:false,fromGround:false,peak:y,airT:0,support:null,dustT:0,phase:0,flap:0,flapV:0,grip:1,lastWJ:0,dead:0,carryVx:0,auto:0,slash:0,slashT:0,hyper:0,t:0,steps:0};};
// Faithful port of the served step(). inp = {dir, jump, jumpPressed}. opts switch the forgiveness
// features (coyote, buffer, cut, apex, fallMult, wallStick, corner), ev collects 'jump','wall','land','roll'.
local.step=function(P,inp,dt,w,opts={},ev=null){const PH_=local.PHYS,o=opts;const E=n=>{if(ev)ev.push(n);};
  P.px=P.x;P.py=P.y;P.t+=dt;P.steps++;
  // movers carry and push
  const sup=P.support&&P.support.mv;if(sup&&P.onGround){const dx=sup.cur[0]-sup.prev[0];P.x+=dx;P.y=sup.cur[1]-PH;P.carryVx=dx/dt;}else P.carryVx=0;
  for(const mv of w.movers){const r=mv.cur;if(!r||!overlap(P.x,P.y,PW,PH,r))continue;if(P.vy>=0&&P.y+PH-r[1]<6+tileRise(r)){P.y=r[1]-PH;P.vy=0;P.onGround=true;P.support=r;}}
  const dir=inp.dir|0,jumpHeld=!!inp.jump||P.auto>0;
  if(inp.jumpPressed)P.buffer=o.buffer===false?dt:PH_.buffer;
  P.wallLock=Math.max(0,P.wallLock-dt);P.buffer=Math.max(0,P.buffer-dt);
  P.coyote=P.onGround?(o.coyote===false?dt*1.01:PH_.coyote):Math.max(0,P.coyote-dt);
  P.wallMemT=Math.max(0,P.wallMemT-dt);P.land=Math.max(0,P.land-dt);P.stretch=Math.max(0,P.stretch-dt*6);P.auto=Math.max(0,P.auto-dt);P.hyper=Math.max(0,P.hyper-dt);
  const ax=Math.abs(P.vx),sv=Math.sign(P.vx);
  if(P.slash>0&&o.slashStops){/* the wrong way: a slash clamps vx */P.vx=0;}
  else if(P.onGround){if(dir!==0){if(sv!==0&&sv!==dir)P.vx+=dir*PH_.turnAccel*dt;else if(ax>PH_.maxRun)P.vx-=sv*Math.min(ax-PH_.maxRun,PH_.overspeedDecay*dt);else P.vx=dir*Math.min(PH_.maxRun,ax+PH_.groundAccel*dt);P.facing=dir;}
    else if(P.roll<=0)P.vx=sv*Math.max(0,ax-PH_.groundFric*dt);}
  else{if(dir!==0&&P.wallLock<=0){if(sv===dir&&ax>=PH_.maxRun){}else P.vx=CL(P.vx+dir*PH_.airAccel*dt,-Math.max(PH_.maxRun,ax),Math.max(PH_.maxRun,ax));if(!P.flipOn)P.facing=dir;}
    else if(dir===0)P.vx=sv*Math.max(0,ax-PH_.airDrag*dt);}
  // jumps
  if(P.buffer>0){if(P.coyote>0){P.vy=-PH_.jumpVel;P.onGround=false;P.coyote=0;P.buffer=0;P.jumpCut=false;P.fromGround=true;P.holdT=0;P.peak=P.y+PH;P.airT=0;
      P.flipPending=Math.abs(P.vx)>PH_.flipMinSpeed;P.flipDir=P.facing;P.stretch=1;P.lastWJ=0;
      if(P.roll>0&&o.hyper){P.vx=P.facing*PH_.maxRun*(o.hyperMult||1.3);P.hyper=.3;}P.roll=0;E('jump');}
    else if(P.wallMemT>0&&P.wallMem!==0){const ww=P.wallMem,same=ww===P.lastWJ,toward=dir===ww;P.vx=-ww*(toward?PH_.wallClimbX:PH_.wallJumpX);P.vy=-(same?PH_.wallJumpSameY:PH_.wallJumpY);
      P.wallLock=toward?PH_.wallClimbLock:PH_.wallLock;P.lastWJ=ww;P.facing=-ww;P.buffer=0;P.wallMemT=0;P.jumpCut=true;P.fromGround=false;P.wallStickT=0;
      if(!same){P.flipOn=true;P.flip=0;P.flipDir=-ww;P.flipPending=false;}P.stretch=1;E('wall');}}
  if(!P.onGround)P.holdT+=dt;
  if(o.cut!==false&&P.fromGround&&!P.jumpCut&&!jumpHeld&&P.vy<0){P.vy*=PH_.jumpCut;P.jumpCut=true;P.flipPending=false;}
  // gravity
  let gr=PH_.gravity;if(P.vy>0)gr*=(o.fallMult===false?1:PH_.fallMult);else if(o.apex!==false&&Math.abs(P.vy)<PH_.apexBand&&jumpHeld)gr*=PH_.apexMult;
  if(!P.onGround)P.vy+=gr*dt;
  // wall slide
  const sliding=!P.onGround&&P.wallDir!==0&&P.vy>0;
  if(sliding){if(!P.wasWall)P.wallStickT=o.wallStick===false?0:PH_.wallStick;if(P.wallStickT>0){P.wallStickT-=dt;P.vy=Math.min(P.vy,25);}else P.vy=Math.min(P.vy,PH_.wallSlideMax);P.facing=P.wallDir;P.flipOn=false;P.flipPending=false;}
  P.wasWall=sliding;P.vy=Math.min(P.vy,PH_.maxFall);
  // integrate X
  P.x+=P.vx*dt;let s,guard=0;
  while((s=solidAt(w,P.x,P.y,PW,PH))&&guard++<6){if(P.vx>0)P.x=s[0]-PW;else if(P.vx<0)P.x=s[0]+s[2];else P.x=(P.x+PW/2<s[0]+s[2]/2)?s[0]-PW:s[0]+s[2];P.vx=0;}
  if(P.x<0){P.x=0;P.vx=0;}if(P.x>w.width-PW){P.x=w.width-PW;P.vx=0;}
  // integrate Y (with the report's corner nudge before a ceiling stop)
  const wasGround=P.onGround,land={vy:P.vy,feet:P.y+PH},dy=P.vy*dt;
  P.y+=dy;P.onGround=false;guard=0;
  if(dy<0&&o.corner>0&&solidAt(w,P.x,P.y,PW,PH)){for(let n=1;n<=o.corner;n++){if(!solidAt(w,P.x+n,P.y,PW,PH)){P.x+=n;break;}if(!solidAt(w,P.x-n,P.y,PW,PH)){P.x-=n;break;}}}
  while((s=solidAt(w,P.x,P.y,PW,PH,land))&&guard++<6){if(P.vy>0){P.y=s[1]-PH;P.onGround=true;P.support=s;}else P.y=s[1]+s[3];P.vy=0;}
  if(!P.onGround&&P.vy>=0&&(s=solidAt(w,P.x,P.y+PH,PW,1,{vy:1,feet:P.y+PH}))){P.onGround=true;P.support=s;}
  if(!P.onGround&&P.support)P.support=null;
  if(wasGround&&!P.onGround){P.peak=P.y+PH;P.airT=0;}
  if(!P.onGround){P.airT+=dt;P.peak=Math.min(P.peak,P.y+PH);}
  if(!wasGround&&P.onGround){const fall=(P.y+PH)-P.peak;P.lastWJ=0;P.fromGround=false;P.flipPending=false;P.auto=0;
    if(fall>PH_.rollFall&&P.wallDir===0&&o.roll!==false){P.roll=PH_.rollTime;P.flipOn=false;if(Math.abs(P.vx)<PH_.rollMinSpeed)P.vx=P.facing*PH_.rollMinSpeed;E('roll');}
    else if(fall>50){P.land=.13;E('land');}else E('touch');}
  // flips and roll
  if(P.flipPending&&!P.onGround&&P.holdT>.1&&jumpHeld){P.flipOn=true;P.flip=0;P.flipPending=false;}
  if(P.flipOn){P.flip+=dt/PH_.flipTime*(P.onGround?3:1);if(P.flip>=1){P.flipOn=false;P.flip=0;}}
  if(P.roll>0){P.roll-=dt;if(Math.abs(P.vx)<PH_.rollMinSpeed*.85)P.vx=P.facing*PH_.rollMinSpeed*.85;}
  // wall probe
  P.wallDir=0;if(!P.onGround){const py=P.y+8,ph=PH-16;if(solidAt(w,P.x-2,py,2,ph))P.wallDir=-1;else if(solidAt(w,P.x+PW,py,2,ph))P.wallDir=1;if(P.wallDir!==0){P.wallMem=P.wallDir;P.wallMemT=PH_.wallCoyote;}}
  // springs: one-way tiles with a launch (C1)
  for(const sp of w.springs){if(P.vy>=0&&P.x+PW>sp.x&&P.x<sp.x+sp.w&&P.y+PH>=sp.y-4&&P.y+PH<=sp.y+8&&P.py+PH<=sp.y+8){const mult=o.springMult==null?1.45:o.springMult;
      P.vy=-PH_.jumpVel*mult;P.onGround=false;P.fromGround=!!o.springCut;P.jumpCut=false;P.auto=o.springCut?0:.6;P.peak=P.y+PH;P.airT=0;P.stretch=1;P.support=null;sp.comp=.15;P.roll=0;
      if(sp.side){P.vx=sp.side*PH_.maxRun*1.3;P.wallLock=.3;}E('spring');}}
  // slash timers
  if(P.slash>0){P.slash=Math.max(0,P.slash-dt);P.slashT+=dt;}
  // rig timers and kimono spring
  P.phase+=Math.abs(P.vx)*dt*.042;
  const ft=CL(-Math.abs(P.vx)/PH_.maxRun*.55+(P.onGround?0:CL(P.vy/900,-.6,.6)),-1.1,.8);P.flapV+=((ft-P.flap)*160-P.flapV*14)*dt;P.flap+=P.flapV*dt;
  const gt=P.wasWall||P.wallLock>0||P.flipOn||P.roll>0?0:1;P.grip+=(gt-P.grip)*Math.min(1,dt*14);
  // hazards
  for(const sp of w.spikes){const hb=sp[3]==='down'?[sp[0]+4,sp[1],sp[2]-8,16]:[sp[0]+4,sp[1]-16,sp[2]-8,16];if(overlap(P.x+3,P.y,PW-6,PH,hb)){P.dead=1;E('die');}}
  if(P.y>w.deathY){P.dead=1;E('die');}
  return P;};
// a simple look-ahead bot: hold right, jump gaps and walls, wall jump when sliding
local.bot=function(P,w,o={}){const lead=o.lead||100;let jump=false;const feet=P.y+PH;
  if(P.onGround&&P.roll<=0){const gx=P.x+PW+lead;let ground=false;for(const s of w.solids)if(gx>=s[0]&&gx<=s[0]+s[2]&&s[1]>=feet-4&&s[1]<feet+120){ground=true;break;}
    for(const mv of w.movers)if(mv.cur&&gx>=mv.cur[0]&&gx<=mv.cur[0]+mv.cur[2]&&mv.cur[1]>=feet-40&&mv.cur[1]<feet+120)ground=true;
    for(const b of w.timed)if(b.on&&!b.shake&&gx>=b.r[0]&&gx<=b.r[0]+b.r[2]&&b.r[1]>=feet-40&&b.r[1]<feet+120)ground=true;
    const wall=solidAt(w,P.x+PW+2,P.y+4,o.wallLead||70,PH-10);
    if(!ground||wall)jump=true;
    for(const sp of w.spikes)if(sp[0]-P.x-PW<(o.spikeLead||150)&&sp[0]+sp[2]>P.x&&sp[1]>=feet-30&&!sp[3])jump=true;
    if(o.avoid)for(const e of o.avoid)if(e.x-P.x-PW<(o.enemyLead||120)&&e.x+e.w>P.x)jump=true;}
  else if(!P.onGround&&(P.wallDir!==0||P.wallMemT>0)&&P.vy>-50)jump=true;
  const hold=jump||(!P.onGround&&P.vy<0&&P.botHold);P.botHold=hold&&!P.onGround||jump;
  const pressed=jump&&!P.jHeld;P.jHeld=hold;return {dir:o.dir==null?1:o.dir,jump:hold,jumpPressed:pressed};};

// ---------- the stick samurai rig (port of the game's drawSamurai) --------
const SAM={leg:1.22,torso:17,neck:7,head:5.2,ua:9.8,la:9.2,lw:2.1};
const poseIdle=t=>({hip:22+Math.sin(t*2.2)*.5,lean:.04,th:[.12,-.1],sh:[.05,.05],ua:[.15,-.12],la:[.35,.3]});
local.targetPose=function(P,t=0){const sp=Math.min(1,Math.abs(P.vx)/local.PHYS.maxRun);
  if(P.dead)return {hip:6,lean:1.3,th:[1.4,1.1],sh:[.4,.6],ua:[1.6,1.2],la:[.3,.6]};
  if(P.roll>0)return {hip:13,lean:.9,th:[2.1,1.9],sh:[2.6,2.6],ua:[1.2,1.0],la:[1.1,1.1]};
  if(P.flipOn)return {hip:15,lean:.6,th:[2.0,1.8],sh:[2.5,2.5],ua:[1.3,1.1],la:[1.0,1.0]};
  if(!P.onGround&&P.wallDir!==0&&P.vy>0)return {hip:20,lean:.28,th:[.75,.25],sh:[1.2,.7],ua:[2.1,-.45],la:[.15,.4]};
  if(!P.onGround){if(P.vy<-120)return {hip:21,lean:.12,th:[1.15,.2],sh:[1.6,.5],ua:[2.7,-.5],la:[.3,.6]};if(P.vy<160)return {hip:21,lean:.12,th:[.7,.05],sh:[1.0,.6],ua:[1.9,-1.0],la:[.4,.4]};return {hip:22,lean:.06,th:[.35,-.2],sh:[.35,.6],ua:[1.55,-1.45],la:[.2,.2]};}
  if(P.land>0){const k=P.land/.13;return {hip:22-7*k,lean:.25+.2*k,th:[.9*k+.1,.7*k],sh:[1.6*k,1.4*k],ua:[.6,-.4],la:[.6,.4]};}
  if(sp>.04){const p=P.phase,s=Math.sin(p),c=Math.cos(p);return {hip:22-Math.abs(c)*1.8*sp,lean:.08+.32*sp,th:[.95*s*sp,-.95*s*sp],sh:[.25+Math.max(0,c)*1.5*sp,.25+Math.max(0,-c)*1.5*sp],ua:[-.85*s*sp,.85*s*sp],la:[.9+.3*sp,.9+.3*sp]};}
  return poseIdle(t);};
local.blend=function(pose,tg,k){if(!pose)return JSON.parse(JSON.stringify(tg));const L=(a,b)=>a+(b-a)*k;return {hip:L(pose.hip,tg.hip),lean:L(pose.lean,tg.lean),th:[L(pose.th[0],tg.th[0]),L(pose.th[1],tg.th[1])],sh:[L(pose.sh[0],tg.sh[0]),L(pose.sh[1],tg.sh[1])],ua:[L(pose.ua[0],tg.ua[0]),L(pose.ua[1],tg.ua[1])],la:[L(pose.la[0],tg.la[0]),L(pose.la[1],tg.la[1])]};};
function katanaBlade(c,B,D,E,len,w,bow,col){const pt=(t,off)=>{const b=bow*len*t*t;return [B[0]+D[0]*len*t+E[0]*(b+off),B[1]+D[1]*len*t+E[1]*(b+off)];},hw=t=>w/2*(1-.35*t);
  c.fillStyle=col;c.beginPath();let p=pt(0,-hw(0));c.moveTo(p[0],p[1]);for(let t=.1;t<=1.0001;t+=.1){p=pt(t,-hw(t));c.lineTo(p[0],p[1]);}const tip=pt(1.05,-hw(1)*.6);c.lineTo(tip[0],tip[1]);
  const k1=pt(1.02,hw(1)*1.2),k0=pt(.9,hw(.9));c.quadraticCurveTo(k1[0],k1[1],k0[0],k0[1]);for(let t=.8;t>=-.0001;t-=.1){p=pt(t,hw(t));c.lineTo(p[0],p[1]);}c.closePath();c.fill();
  if(col===INK){c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=Math.max(.35,w*.16);c.beginPath();p=pt(.06,hw(.06)*.45);c.moveTo(p[0],p[1]);for(let t=.16;t<=.9;t+=.1){p=pt(t,hw(t)*.45);c.lineTo(p[0],p[1]);}c.stroke();}}
function katanaHilt(c,Gp,Hd,len,w,col){const n=[-Hd[1],Hd[0]],at=(k,o=0)=>[Gp[0]+Hd[0]*k+n[0]*o,Gp[1]+Hd[1]*k+n[1]*o];c.fillStyle=col;
  c.beginPath();c.ellipse(Gp[0],Gp[1],w*.4,w*1.05,Math.atan2(Hd[1],Hd[0]),0,Math.PI*2);c.fill();
  const qd=[at(.6,-w/2),at(len,-w*.46),at(len+1.3,-w*.5),at(len+1.3,w*.5),at(len,w*.46),at(.6,w/2)];c.beginPath();c.moveTo(qd[0][0],qd[0][1]);for(const v of qd.slice(1))c.lineTo(v[0],v[1]);c.closePath();c.fill();}
function drawHead(c,x,y,rot,hat,ink){c.fillStyle=ink;c.beginPath();c.arc(x,y,SAM.head,0,Math.PI*2);c.fill();c.save();c.translate(x,y);c.rotate(rot+.1);c.translate(0,-2.2);c.fillStyle=hat;c.beginPath();
  c.moveTo(-14,1.6);c.quadraticCurveTo(0,-.6,14,1.6);c.lineTo(1.1,-8.2);c.lineTo(-1.1,-8.2);c.closePath();c.fill();c.lineWidth=.9;c.strokeStyle=ink;c.stroke();c.restore();}
let aclock=0;
// drawSamurai(ctx, pose, x, y, facing, {hat, kim, ink, flap, blade, grip, sx, sy, rot, pivot, alpha}); feet centre at (x,y)
local.drawSamurai=function(c,ps,x,y,facing=1,o={}){const ink=o.ink||INK,kim=o.kim||RED,hat=o.hat||'#111111',flap=o.flap||0,lw=SAM.lw,grip=o.grip==null?1:o.grip;
  c.save();c.translate(x,y);if(o.alpha!=null)c.globalAlpha*=o.alpha;if(facing<0)c.scale(-1,1);if(o.rot){c.translate(0,-(o.pivot||22));c.rotate(o.rot);c.translate(0,o.pivot||22);}if(o.sx||o.sy)c.scale(o.sx||1,o.sy||1);
  const hip=[0,-ps.hip*SAM.leg],sh=[hip[0]+Math.sin(ps.lean)*SAM.torso,hip[1]-Math.cos(ps.lean)*SAM.torso],head=[sh[0]+Math.sin(ps.lean*.7)*SAM.neck,sh[1]-Math.cos(ps.lean*.7)*SAM.neck];
  const seg=(og,a,len)=>[og[0]+Math.sin(a)*len,og[1]+Math.cos(a)*len],line=(a,b,w=lw)=>{c.lineWidth=w;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();};
  c.lineCap='round';c.lineJoin='round';c.strokeStyle=ink;
  const limbs=i=>{const knee=seg(hip,ps.th[i]+ps.lean*.2,11*SAM.leg),foot=seg(knee,ps.th[i]-ps.sh[i],11.5*SAM.leg),elb=seg(sh,ps.ua[i]+ps.lean*.3,SAM.ua),hand=seg(elb,ps.ua[i]+ps.la[i],SAM.la);return {knee,foot,elb,hand};};
  const back=limbs(1),front=limbs(0),perp=[Math.cos(ps.lean),Math.sin(ps.lean)],up=[Math.sin(ps.lean),-Math.cos(ps.lean)],ob=[LP(hip[0],sh[0],.12),LP(hip[1],sh[1],.12)];
  const a0=c.globalAlpha;c.globalAlpha=a0*.75;line(hip,back.knee);line(back.knee,back.foot);line(sh,back.elb);line(back.elb,back.hand);c.globalAlpha=a0;
  const wv=Math.sin(aclock*7)*.6,kn=[ob[0]-perp[0]*2.5,ob[1]-perp[1]*2.5];c.strokeStyle=kim;
  for(const [len,drop] of [[9.5,2.2],[7.5,5.2]]){const end=[kn[0]-perp[0]*len*(1-flap*.35)-up[0]*(drop*(1+flap)-wv),kn[1]-perp[1]*len*(1-flap*.35)-up[1]*(drop*(1+flap)-wv)],mm=[LP(kn[0],end[0],.5)-up[0]*wv,LP(kn[1],end[1],.5)-up[1]*wv];
    c.lineWidth=1.5;c.beginPath();c.moveTo(kn[0],kn[1]);c.quadraticCurveTo(mm[0],mm[1],end[0],end[1]);c.stroke();}
  c.strokeStyle=ink;line(hip,sh,lw*1.15);line(sh,head,lw);c.strokeStyle=kim;line([ob[0]-perp[0]*3.4,ob[1]-perp[1]*3.4],[ob[0]+perp[0]*3.4,ob[1]+perp[1]*3.4],3.4);c.strokeStyle=ink;
  line(hip,front.knee);line(front.knee,front.foot);let gripAt=null;
  if(o.blade==null){const e=CL(.42+flap*.32,.06,.8),D=[perp[0]*Math.cos(e)+up[0]*Math.sin(e),perp[1]*Math.cos(e)+up[1]*Math.sin(e)],nU=[D[1],-D[0]],pv=[ob[0]+perp[0]*4+up[0],ob[1]+perp[1]*4+up[1]];
    const at=(k,n=0)=>[pv[0]+D[0]*k+nU[0]*n,pv[1]+D[1]*k+nU[1]*n];katanaBlade(c,at(.4),[-D[0],-D[1]],nU,30,2.3,.07,ink);katanaHilt(c,at(.4),D,9.5,2.9,ink);gripAt=at(5.5);}
  drawHead(c,head[0],head[1],ps.lean*.5-flap*.06,hat,ink);
  if(o.blade!=null){const Db=[Math.sin(o.blade),Math.cos(o.blade)];katanaBlade(c,front.hand,Db,[Db[1],-Db[0]],34,2.1,-.05,ink);katanaHilt(c,front.hand,[-Db[0],-Db[1]],7,2.8,ink);}
  if(gripAt&&grip>.01){const l1=SAM.ua,l2=SAM.la,dx=gripAt[0]-sh[0],dy=gripAt[1]-sh[1],d=Math.min(Math.hypot(dx,dy),l1+l2-.01),a=Math.atan2(dy,dx),A=Math.acos(CL((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1)),ea=a+A;
    const Ep=[sh[0]+Math.cos(ea)*l1,sh[1]+Math.sin(ea)*l1],tl=Math.hypot(gripAt[0]-Ep[0],gripAt[1]-Ep[1])||1,Hh=[Ep[0]+(gripAt[0]-Ep[0])/tl*l2,Ep[1]+(gripAt[1]-Ep[1])/tl*l2];
    front.elb=[LP(front.elb[0],Ep[0],grip),LP(front.elb[1],Ep[1],grip)];front.hand=[LP(front.hand[0],Hh[0],grip),LP(front.hand[1],Hh[1],grip)];}
  c.strokeStyle=ink;line(sh,front.elb);line(front.elb,front.hand);c.restore();};
// hero visual from a player: rotation for roll and flip, squash and stretch
function heroVis(P){let rot=0,pivot=22;if(P.flipOn)rot=ease(Math.min(1,P.flip))*Math.PI*2;if(P.roll>0){rot=(1-P.roll/local.PHYS.rollTime)*Math.PI*2;pivot=12;}
  const st=P.stretch,sq=P.land/.13*.5;return {rot,pivot,sx:1-st*.07+sq*.1,sy:1+st*.1-sq*.1,flap:P.flap,grip:P.grip};}
// a rig state carried per runner: pose blended at 26/s (38 ms)
function mkRig(){return {pose:null,t:0};}
function rigTick(rig,P,dt){rig.t+=dt;const k=1-Math.exp(-26*dt);rig.pose=local.blend(rig.pose,local.targetPose(P,rig.t),k);}
function drawHero(c,P,rig,o={}){const v=heroVis(P);const blade=P.slash>0?LP(-1.3,1.6,1-P.slash/(o.slashMs||.1)):null;
  local.drawSamurai(c,rig.pose||local.targetPose(P,0),P.x+PW/2,P.y+PH,P.facing,{...v,blade,...o});}

// ---------- dust and bursts --------------------------------------------
local.dust=function(parts,x,y,n,dx=0,dy=-1,spread=1,rng=Math.random){for(let i=0;i<n;i++){const a=rng()*Math.PI*2,sp=(40+rng()*90)*spread;parts.push({x,y,vx:Math.cos(a)*sp*.8+dx*140,vy:Math.sin(a)*sp*.35+dy*60-20,life:.35+rng()*.3,t:0,r:1.2+rng()*2.4,g:rng()<.5});}};
function dustTick(parts,dt){for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.t+=dt;if(p.t>=p.life){parts.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy=p.vy*.92+40*dt;}}
function dustDraw(c,parts){for(const p of parts){const k=1-p.t/p.life;c.globalAlpha=k*(p.g?.35:.6);c.fillStyle=p.g?'#7a7a7a':INK;c.beginPath();c.arc(p.x,p.y,p.r*(.6+.4*k),0,Math.PI*2);c.fill();}c.globalAlpha=1;}
function dustFor(parts,P,ev){for(const e of ev){if(e==='jump')local.dust(parts,P.x+PW/2,P.y+PH,7,0,-1);else if(e==='wall')local.dust(parts,P.wallMem>0?P.x+PW:P.x,P.y+PH*.6,9,-P.wallMem,0);else if(e==='land')local.dust(parts,P.x+PW/2,P.y+PH,6,0,-.5);
  else if(e==='roll')local.dust(parts,P.x+PW/2,P.y+PH,10,0,-.6,1.2);else if(e==='die')local.dust(parts,P.x+PW/2,P.y+PH/2,22,0,-.8,1.6);else if(e==='spring')local.dust(parts,P.x+PW/2,P.y+PH,8,0,-1.2,1.2);}}

// ---------- camera and world drawing ------------------------------------
// cam modes: lock with look-ahead (the game's), platform snap vertical reference
local.cam=function(cam,P,w,dt,vw,vh,o={}){const look=o.look==null?120:o.look;cam.x=CL(P.x+PW/2-vw*.36+look,0,Math.max(0,w.width-vw));const feet=P.y+PH;
  if(cam.ref==null||P.onGround||P.wasWall||feet>cam.ref)cam.ref=feet;else if(feet<cam.ref-60)cam.ref=feet+60;
  const base=(w.floorView||G)-vh*.8,ty=CL(cam.ref-vh*.62,w.top,base);cam.y=o.snap?ty:LP(cam.y==null?ty:cam.y,ty,1-Math.exp(-(P.wasWall?9:5)*dt));return cam;};
function drawSpikes(c,sp){const [x,gy,w]=sp,n=Math.max(1,Math.round(w/20)),st=w/n;c.save();c.translate(0,gy);if(sp[3]==='down')c.scale(1,-1);c.fillStyle=INK;c.beginPath();
  c.moveTo(x-6,1);c.bezierCurveTo(x-2,1,x,-3.5,x+4,-3.5);c.lineTo(x+w-4,-3.5);c.bezierCurveTo(x+w,-3.5,x+w+2,1,x+w+6,1);c.closePath();
  for(let i=0;i<n;i++){const cx=x+(i+.5)*st+(i%2?.6:-.6),hw=Math.min(6,st*.32),h=19+(i%3===1?1.5:0);c.moveTo(cx-hw,-2);c.quadraticCurveTo(cx-hw*.25,-h*.45,cx,-h);c.quadraticCurveTo(cx+hw*.25,-h*.45,cx+hw,-2);c.closePath();}
  c.fill();c.restore();}
function drawFlag(c,x,gy,t){c.fillStyle=INK;c.fillRect(x,gy-130,5,130);const wv=Math.sin(t*5)*4;c.beginPath();c.moveTo(x+5,gy-130);c.quadraticCurveTo(x+30,gy-125+wv,x+58,gy-118+wv);c.lineTo(x+5,gy-94);c.closePath();c.fill();
  c.fillStyle=PAPER;c.beginPath();c.arc(x+26,gy-115+wv*.5,6,0,Math.PI*2);c.fill();c.fillStyle=RED;c.beginPath();c.arc(x+26,gy-115+wv*.5,4.2,0,Math.PI*2);c.fill();}
function drawCheckpoint(c,x,gy,on){c.fillStyle=on?INK:'#c4c4c4';c.fillRect(x,gy-70,3,70);c.beginPath();c.moveTo(x+3,gy-70);c.lineTo(x+26,gy-62);c.lineTo(x+3,gy-54);c.closePath();c.fill();}
function drawSpring(c,sp){const comp=sp.comp>0,h=comp?9:20,{x,y,w}=sp;c.fillStyle=INK;c.fillRect(x,y-6,w,6);c.strokeStyle=INK;c.lineWidth=2.2;c.beginPath();
  for(let i=0;i<=4;i++){const yy=y-6-(h-5)*i/4,xx=x+w/2+(i%2?-10:10);if(i===0)c.moveTo(x+w/2,y-6);else c.lineTo(xx,yy);}c.stroke();c.fillStyle=RED;c.fillRect(x-2,y-6-h,w+4,5);
  if(sp.side){c.fillStyle=RED;c.beginPath();c.moveTo(x+w/2-6*sp.side,y-6-h-4);c.lineTo(x+w/2+8*sp.side,y-6-h+2);c.lineTo(x+w/2-6*sp.side,y-6-h+8);c.closePath();c.fill();}}
function drawTimed(c,b,t){const r=b.r,dx=b.shake>0?Math.sin(t*90)*3*b.shake:0;if(b.on){c.fillStyle=INK;c.fillRect(r[0]+dx,r[1],r[2],r[3]);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.5;c.setLineDash([5,5]);c.strokeRect(r[0]+dx+5,r[1]+5,r[2]-10,r[3]-10);c.setLineDash([]);}
  else{c.strokeStyle='#bbb';c.lineWidth=1.5;c.setLineDash([4,6]);c.strokeRect(r[0],r[1],r[2],r[3]);c.setLineDash([]);}}
function drawRock(c,s){c.fillStyle=INK;c.beginPath();c.moveTo(s[0]-4,s[1]+s[3]);c.quadraticCurveTo(s[0]+2,s[1]+6,s[0]+s[2]*.35,s[1]);c.quadraticCurveTo(s[0]+s[2]*.8,s[1]-4,s[0]+s[2]+4,s[1]+s[3]);c.closePath();c.fill();}
// drawSolids(ctx, world, cam, {sc, t, cps, vw}) draws the whole world in world units after a camera transform
local.drawSolids=function(c,w,cam,o={}){const sc=o.sc||640/970,t=o.t||0;c.save();c.scale(sc,sc);c.translate(-cam.x,-cam.y);const vw=(o.vw||640)/sc,x0=cam.x-60,x1=cam.x+vw+60;
  c.fillStyle='#bdbdbd';for(const [lx,txt] of (w.labels||[])){T(c,txt,lx,groundBelow(w,lx+10)-150,{s:16,w:700,col:'#c9c9c9'});}
  if(w.start){T(c,'START',w.start.x-56,w.start.y-90,{s:12,w:700,col:'#c4c4c4'});c.fillStyle='#d6d6d6';c.fillRect(w.start.x-60,w.start.y-82,2,82);}
  (w.checkpoints||[]).forEach((x,i)=>drawCheckpoint(c,x,groundBelow(w,x+30),o.cp!=null&&i<=o.cp));
  if(w.finish)drawFlag(c,w.finish.x,w.finish.y||groundBelow(w,w.finish.x+2),t);
  c.fillStyle=INK;for(const s of w.solids){if(s[0]>x1||s[0]+s[2]<x0)continue;if(s[4]==='rock')drawRock(c,s);else if(s[4]==='tile'){c.fillRect(s[0],s[1],s[2],s[3]);c.fillStyle=PAPER;c.fillRect(s[0]+3,s[1]+4,s[2]-6,2);c.fillStyle=INK;}
    else if(s[4]==='bamboo'){c.fillStyle=s.cut?'#cfcfcf':INK;c.fillRect(s[0]+s[2]*.3,s[1],s[2]*.4,s[3]);for(let yy=s[1]+10;yy<s[1]+s[3];yy+=22){c.fillRect(s[0]+s[2]*.2,yy,s[2]*.6,3);}c.fillStyle=INK;}
    else c.fillRect(s[0],s[1],s[2],s[3]);}
  for(const b of w.timed)drawTimed(c,b,t);
  for(const mv of w.movers){const r=mv.cur||local.moverAt(mv,0);if(mv.wheel){c.strokeStyle='#d4d4d4';c.lineWidth=2;c.setLineDash([6,8]);c.beginPath();c.arc(mv.cx,mv.cy,mv.r,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='#d4d4d4';c.beginPath();c.arc(mv.cx,mv.cy,5,0,Math.PI*2);c.fill();}
    else{c.strokeStyle='#d4d4d4';c.lineWidth=2;c.setLineDash([6,8]);c.beginPath();c.moveTo(mv.x0+mv.w/2,mv.y0+(mv.h||18)/2);c.lineTo(mv.x1+mv.w/2,mv.y1+(mv.h||18)/2);c.stroke();c.setLineDash([]);}
    c.fillStyle=INK;c.fillRect(r[0],r[1],r[2],r[3]);c.fillStyle=PAPER;c.fillRect(r[0]+4,r[1]+r[3]/2-1,r[2]-8,2);}
  for(const sp of w.springs)drawSpring(c,sp);for(const sp of w.spikes)drawSpikes(c,sp);c.restore();};
// a one-eyed ink blob patroller (the Sandbox's), hitbox inset shown on request
function drawPatroller(c,x,y,dir,t,o={}){const bob=Math.abs(Math.sin(t*14))*2;c.fillStyle=o.col||INK;c.beginPath();c.ellipse(x,y-13-bob,14,11,0,0,Math.PI*2);c.fill();
  c.beginPath();c.moveTo(x-6,y-22-bob);c.lineTo(x-3,y-31-bob);c.lineTo(x,y-22-bob);c.closePath();c.fill();c.lineWidth=2.2;c.strokeStyle=o.col||INK;const sw=Math.sin(t*14)*5;
  c.beginPath();c.moveTo(x-6,y-4);c.lineTo(x-6+sw,y);c.moveTo(x+6,y-4);c.lineTo(x+6-sw,y);c.stroke();c.fillStyle=PAPER;c.beginPath();c.arc(x+dir*6,y-14-bob,2.6,0,Math.PI*2);c.fill();c.fillStyle=RED;c.beginPath();c.arc(x+dir*6.8,y-14-bob,1.4,0,Math.PI*2);c.fill();}
function hitbox(c,x,y,w,h,col=RED){c.strokeStyle=col;c.lineWidth=1.2;c.setLineDash([3,3]);c.strokeRect(x,y,w,h);c.setLineDash([]);}
// a runner bundle: player, rig, dust, events, finished flag; reset() restarts the course
function mkRunner(w,o={}){const R={w,P:null,rig:mkRig(),parts:[],ev:[],cam:{x:0,y:null,ref:null},done:0,deaths:0,finishes:0,cp:-1,splits:[],o,
  reset(){R.P=local.mkP(w.start.x,w.start.y);R.rig=mkRig();R.ev.length=0;R.done=0;R.cp=-1;R.splits=[];R.cam={x:0,y:null,ref:null};for(const mv of w.movers){mv.cur=null;mv.prev=null;}},
  step(inp,dt,opts){updateWorld(w,R.P.steps,opts);R.ev.length=0;local.step(R.P,inp,dt,w,opts,R.ev);dustFor(R.parts,R.P,R.ev);rigTick(R.rig,R.P,dt);
    (w.checkpoints||[]).forEach((x,i)=>{if(i>R.cp&&R.P.x>x){R.cp=i;R.splits[i]=R.P.steps;R.ev.push('check');}});
    if(w.finish&&R.P.x+PW>w.finish.x&&!R.done){R.done=1;R.ev.push('finish');}if(R.P.dead&&R.done!==2){R.done=2;}return R.ev;}};R.reset();return R;}
// pick shared helpers if core.js grew them with the same signatures
const H=local;                                        // SR.* in core.js has different step/draw signatures, so the local port stays
local.ink={INK,RED,GREY,LIGHT,PAPER,GREEN,GOLD,MUTE};local.text=T;local.sfx=n=>AU.play(n);

// ---------- common bits for figure code ---------------------------------
const SC=640/970;                                     // the game's view scale: 970 u across 640 px
function worldToScreen(c,cam,sc=SC){c.save();c.scale(sc,sc);c.translate(-cam.x,-cam.y);}
function flat(width,extra={}){return local.makeCourse({width,solids:[[0,G,width,400]],deathY:700,...extra});}
function bars(c,x,y,w,h,f,col=INK,bg=PALE){c.fillStyle=bg;c.fillRect(x,y,w,h);c.fillStyle=col;c.fillRect(x,y,Math.round(w*CL(f,0,1)),h);}
function arrow(c,x0,y0,x1,y1,col=INK,wd=1.5){c.strokeStyle=col;c.fillStyle=col;c.lineWidth=wd;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();const a=Math.atan2(y1-y0,x1-x0);c.beginPath();c.moveTo(x1,y1);c.lineTo(x1-7*Math.cos(a-.4),y1-7*Math.sin(a-.4));c.lineTo(x1-7*Math.cos(a+.4),y1-7*Math.sin(a+.4));c.closePath();c.fill();}
function dashLine(c,x0,y0,x1,y1,col=GREY,d=[5,5],wd=1.2){c.strokeStyle=col;c.lineWidth=wd;c.setLineDash(d);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.setLineDash([]);}
const FRIENDS=[['KAEDE',23410,'2026-11-09','#2b5694'],['RIN',26080,'2026-11-11','#3a8a86'],['HIRO',29750,'2026-11-12','#6d4f9e'],['SORA',34200,'2026-11-10','#9a5a28'],['YUI',41900,'2026-11-13','#913641']];
const MAPS=[{id:'m1',name:'FIRST STEPS',diff:'Easy',width:6830,spikes:2},{id:'m2',name:'ROCKY MOUNTAIN',diff:'Medium',width:8700,spikes:2},{id:'m3',name:'THE DUNGEON',diff:'Hard',width:4580,spikes:9},{id:'m4',name:'STAIRWAY OF CLOUDS',diff:'Hard',width:6550,spikes:1}];
// FNV-1a 32-bit as a stand-in for sha256().slice(): same role, synchronous
function fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}

// ======================================================================
// C1 spring: 1.45x jumpVel with auto-jump semantics against a plain jump
// ======================================================================
REG('spring',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const w=flat(2600);w.springs.push({x:760,y:G,w:40,comp:0});const side={x:1700,y:G,w:40,comp:0,side:1};
  const R=mkRunner(w);let arcs=null,arcKey='';
  const opts=()=>({springMult:q.v('mult'),springCut:q.v('cut'),corner:8});
  // predicted arcs from a headless sim: plain jump and spring launch at the slider value
  function arc(kind,mult){const ww=flat(4000);const P=local.mkP(760,G);P.vx=420;P.onGround=true;const pts=[];let apex=0;const o={springMult:mult};
    if(kind==='jump'){local.step(P,{dir:1,jump:1,jumpPressed:1},DT,ww,o);}else{ww.springs.push({x:760,y:G,w:40,comp:0});P.y=G-PH-2;P.vy=10;P.onGround=false;local.step(P,{dir:1,jump:0},DT,ww,o);}
    for(let i=0;i<400&&!(P.onGround&&i>5);i++){local.step(P,{dir:1,jump:kind==='jump',jumpPressed:0},DT,ww,o);pts.push([P.x+PW/2,P.y+PH]);apex=Math.max(apex,G-(P.y+PH));}return {pts,apex};}
  q.on('side',()=>{w.springs.length=1;if(q.v('side'))w.springs.push(side);});
  const cam={x:0,y:G-545*.88};
  return {tick(sec){const o=opts();const key=o.springMult+'';if(key!==arcKey){arcKey=key;arcs={jump:arc('jump',1),spring:arc('spring',o.springMult)};}
    run(sec*slow(q),dt=>{aclock+=dt;const P=R.P;const inp={dir:1,jump:0,jumpPressed:0};
      const ev=R.step(inp,dt,o);for(const e of ev)SFX(root,snd,e==='die'?'die':e);dustTick(R.parts,dt);
      if(P.x>2500||P.dead)R.reset();});
    const c=S.c;S.begin();const P=R.P;cam.x=CL(P.x-200,0,w.width-970);
    H.drawSolids(c,w,cam,{t:aclock});worldToScreen(c,cam);
    // arcs: grey plain jump, red spring prediction
    const dash=(pts,col)=>{c.setLineDash([4,6]);c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.setLineDash([]);};
    dash(arcs.jump.pts,GREY);dash(arcs.spring.pts,RED);
    const bx=720;dashLine(c,bx,G,bx,G-arcs.spring.apex,RED,[2,4]);T(c,`${Math.round(arcs.spring.apex)} u = ${(arcs.spring.apex/BL).toFixed(1)} BL`,bx-8,G-arcs.spring.apex+4,{s:17,col:RED,al:'right',w:600});
    T(c,`plain jump ${Math.round(arcs.jump.apex)} u = ${(arcs.jump.apex/BL).toFixed(1)} BL`,bx-8,G-arcs.jump.apex-6,{s:16,col:GREY,al:'right'});
    if(w.springs[0].comp>0)T(c,'compressed 150 ms',780,G+40,{s:15,col:RED,w:600});
    T(c,q.v('cut')?'jump cut by reflex: 0.45 x vy':'auto-jump: no cut, apex band on',P.x+PW/2,P.y-30,{s:15,al:'center',col:q.v('cut')?RED:INK});
    dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();
    // view height bracket
    const vh=545,top=360-(vh*SC)*0.95;dashLine(c,20,top,620,top,LIGHT);T(c,'top of a 545 u view when the ground sits at the bottom',24,top-5,{s:11,col:MUTE});
    T(c,`vy ${Math.round(-P.vy)} u/s · height ${Math.max(0,Math.round(G-P.y-PH))} u`,628,22,{s:13,mono:1,al:'right'});
    const launch=Math.round(830*o.springMult),apx=arcs.spring.apex;
    RO(root,`spring <b>${o.springMult.toFixed(2)}x</b> jumpVel = ${launch} u/s · apex <b>${Math.round(apx)} u = ${(apx/BL).toFixed(1)} BL</b>, ${Math.round(apx/545*100)}% of the 545 u view · plain jump ${Math.round(arcs.jump.apex)} u = ${(arcs.jump.apex/BL).toFixed(1)} BL · Celeste 1.76x would be 9.3 BL`);
  }};});

// ======================================================================
// C2 clock: movers, a wheel and timed blocks on the level clock; two runners, one clock each
// ======================================================================
REG('clock',root=>{const S=stage(root),q=CTL(root),I=idler(root),run=fixed();
  const mk=()=>{const w=flat(3000);w.movers.push({x0:900,y0:G-150,x1:900,y1:G-40,w:90,h:18,period:2.6,phase:0});
    w.movers.push({wheel:1,cx:1700,cy:G-230,r:92,w:60,h:18,period:3.6,phase:0},{wheel:1,cx:1700,cy:G-230,r:92,w:60,h:18,period:3.6,phase:.25},{wheel:1,cx:1700,cy:G-230,r:92,w:60,h:18,period:3.6,phase:.5},{wheel:1,cx:1700,cy:G-230,r:92,w:60,h:18,period:3.6,phase:.75});
    w.timed.push({r:[1250,G-120,80,30],seq:0},{r:[1350,G-120,80,30],seq:2},{r:[2300,G-150,80,30],seq:1});return w;};
  const lanes=[{w:mk(),R:null,on:true,name:'runner A'},{w:mk(),R:null,on:false,name:'runner B'}];lanes.forEach(L=>L.R=mkRunner(L.w));
  let wall=0,scrub=-1,scrubAt=0;q.on('t',()=>{scrub=q.v('t');scrubAt=performance.now();});q.btn('b',()=>{lanes[1].on=true;lanes[1].R.reset();});
  return {tick(sec){const slowK=slow(q);wall+=sec;if(wall>1.3&&!lanes[1].on){lanes[1].on=true;lanes[1].R.reset();}
    if(scrub>=0&&performance.now()-scrubAt>2500)scrub=-1;
    if(scrub<0)run(sec*slowK,dt=>{aclock+=dt;for(const L of lanes){if(!L.on)continue;const R=L.R,P=R.P;const inp=local.bot(P,L.w,{lead:80});R.step(inp,dt,{corner:8});dustTick(R.parts,dt);if(P.x>2900||P.dead)R.reset();}});
    const c=S.c;S.begin();const sc=.5;
    lanes.forEach((L,i)=>{const y0=i*180;c.save();c.beginPath();c.rect(0,y0,640,180);c.clip();c.translate(0,y0);const R=L.R,P=R.P;const steps=scrub>=0?Math.round(scrub/DT):P.steps;
      if(scrub>=0)updateWorld(L.w,steps);const cam={x:L.on&&scrub<0?CL(P.x-300,0,L.w.width-1280):CL(P.x-300,0,L.w.width-1280),y:G-320};
      H.drawSolids(c,L.w,cam,{t:aclock,sc});worldToScreen(c,cam,sc);
      if(L.on&&scrub<0){dustDraw(c,R.parts);drawHero(c,P,R.rig);}c.restore();
      label(c,`${L.name} · level clock ${steps} steps = ${(steps*DT).toFixed(3)} s`,10,16,{s:13,w:600,a:.9});
      if(!L.on)T(c,'waiting at the start line, its clock has not started',10,34,{s:12,col:MUTE});
      const mv=L.w.movers[0],ph=((steps*DT/mv.period)%1);label(c,`mover phase ${ph.toFixed(2)} · wheel ${((steps*DT/3.6)%1).toFixed(2)} · block tick ${Math.floor(steps*DT/.5)}`,10,52,{s:11,col:MUTE,mono:1,a:.9});c.restore();});
    c.fillStyle=LIGHT;c.fillRect(0,179,640,2);
    if(scrub>=0)label(S.c,`scrubbed: both clocks at ${scrub.toFixed(2)} s`,320,350,{s:13,al:'center',col:RED,w:600});
    T(c,`wall clock ${wall.toFixed(1)} s`,630,16,{s:12,mono:1,al:'right',col:MUTE});
    const a=lanes[0].R.P.steps,b=lanes[1].R.P.steps;
    RO(root,`same course, two level clocks. A is at step <b>${a}</b>, B at step <b>${b}</b>. At equal step counts every mover, wheel and block is in the same place, whatever the wall clock says. Movers use a 4096-entry sin table built with Math.fround, never Math.sin (H3).`);
  }};});

// ======================================================================
// C3 telegraph: pre-shake, the 1 s warning rule, spike silhouettes
// ======================================================================
REG('telegraph',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),run=fixed();
  const w=local.makeCourse({width:5200,solids:[[0,G,1400,400],[1520,G,2060,400],[3580,G,1700,400]],spikes:[[2300,G,100]],deathY:700});
  w.timed.push({r:[1400,G,120,40],seq:0});
  const R=mkRunner(w);let saw=null,seen=0,warned=0,outcome='',log=[];
  const rules=()=>({noShake:!q.v('warn'),pre:.3,corner:8});
  return {tick(sec){const o=rules(),v=q.v('v');
    run(sec*slow(q),dt=>{aclock+=dt;const P=R.P;
      // the saw spawns well ahead and rolls toward the runner at v u/s
      if(!saw&&P.x>2700&&P.x<2800){saw={x:P.x+1700,y:G-30,r:30,t:0};seen=0;warned=0;outcome='';}
      if(saw){saw.t+=dt;saw.x-=v*dt;const dist=saw.x-(P.x+PW),ttc=dist/(420+v),vis=dist<=621;if(vis&&!seen)seen=saw.t;if(q.v('warn')&&ttc<=1&&!warned){warned=saw.t;SFX(root,snd,'warn');}
        const known=(seen&&saw.t-seen>=.25)||(warned&&saw.t-warned>=.25);saw.known=known;saw.ttc=ttc;saw.vis=vis;
        const inp=local.bot(P,w,{lead:100,spikeLead:150});if(known&&ttc<.4&&P.onGround){inp.jump=true;inp.jumpPressed=true;P.botHold=true;}if(P.onGround&&P.support===w.timed[0].r&&w.timed[0].shake>0){inp.jump=true;inp.jumpPressed=true;P.botHold=true;}
        if(saw.x<P.x-400){outcome=outcome||'cleared';saw=null;}
        const ev=R.step(inp,dt,o);for(const e of ev)SFX(root,snd,e);
        if(saw&&Math.hypot(P.x+PW/2-saw.x,P.y+PH-10-saw.y)<saw.r+8&&!P.dead){P.dead=1;R.ev.push('die');SFX(root,snd,'die');outcome='hit, no time to react';}}
      else{const inp=local.bot(P,w,{lead:100,spikeLead:150});if(P.onGround&&P.support===w.timed[0].r&&w.timed[0].shake>0){inp.jump=true;inp.jumpPressed=true;P.botHold=true;}const ev=R.step(inp,dt,o);for(const e of ev)SFX(root,snd,e);}
      if(w.timed[0].shake>0&&P.x>1200&&P.x<1400&&Math.random()<.2)SFX(root,snd,'shake');
      dustTick(R.parts,dt);if(R.P.dead){R.P.deadT=(R.P.deadT||0)+dt;}if(R.P.x>5000||(R.P.dead&&R.P.deadT>.6)){if(R.P.dead)log.push(outcome||'fell with the block');else log.push('run clean');log=log.slice(-4);R.reset();saw=null;}});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x+PW/2-970*.36+120,0,w.width-970),y:G-545*.8};
    H.drawSolids(c,w,cam,{t:aclock});worldToScreen(c,cam);
    if(q.v('hb')){for(const sp of w.spikes)hitbox(c,sp[0]+4,sp[1]-16,sp[2]-8,16);hitbox(c,P.x+3,P.y,PW-6,PH,BLUE);T(c,'spike hitbox 16 u tall, inset 4 u; art 1 u wider',2300,G-50,{s:14,col:RED,al:'center'});}
    const b=w.timed[0];if(b.shake>0)T(c,`pre-shake ${(b.shake*.3).toFixed(2)} s of 0.3`,1490,G-60,{s:15,al:'center',col:RED,w:600});else if(!q.v('warn')&&P.x>1000&&P.x<1600)T(c,'no warning: the block just vanishes',1490,G-60,{s:15,al:'center',col:RED,w:600});
    if(saw){c.fillStyle=INK;c.beginPath();c.arc(saw.x,saw.y,saw.r,0,Math.PI*2);c.fill();c.fillStyle=PAPER;for(let i=0;i<8;i++){const a=aclock*20+i*Math.PI/4;c.beginPath();c.arc(saw.x+Math.cos(a)*saw.r*.6,saw.y+Math.sin(a)*saw.r*.6,4,0,Math.PI*2);c.fill();}}
    dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();
    // warning icon at the right edge and the timeline
    if(saw&&q.v('warn')&&saw.ttc<=1&&saw.ttc>0&&!saw.vis){c.fillStyle=RED;c.beginPath();c.moveTo(600,150);c.lineTo(630,205);c.lineTo(570,205);c.closePath();c.fill();T(c,'!',600,196,{s:28,w:800,col:PAPER,al:'center'});T(c,'saw in 1 s',600,222,{s:12,col:RED,al:'center',w:600});}
    const tv=621/(420+v);T(c,`saw at ${v} u/s toward a 420 u/s runner: visible to contact ${tv.toFixed(2)} s`,12,20,{s:13,w:600});
    const x0=12,x1=420,tx=t=>x0+(x1-x0)*CL(t/2,0,1);bars(c,x0,30,x1-x0,10,0,INK);c.fillStyle=tv<1?RED:GREEN;c.fillRect(x0,30,tx(tv)-x0,10);
    dashLine(c,tx(1),24,tx(1),46,INK,[2,2]);T(c,'1 s rule',tx(1)+4,45,{s:11});dashLine(c,tx(.38),24,tx(.38),46,GREY,[2,2]);T(c,'0.38 s: react 250 ms and clear 60 u (illustrative)',tx(.38)+4,58,{s:10,col:MUTE});
    if(saw&&saw.t>0&&saw.vis)T(c,saw.known?'runner has reacted':'runner reacting (250 ms)',12,80,{s:12,col:saw.known?GREEN:MUTE});
    
    RO(root,`block: 0.5 s tick, visible 1.0 s, gone 1.0 s, shakes 0.3 s before it goes [I] · saw: ${v} u/s, visible for <b>${tv.toFixed(2)} s</b> before contact${tv<1?' (under the 1 s rule, so it needs the warning icon)':' (over 1 s, readable on sight)'} · the runner reacts 250 ms after it sees or is warned (illustrative) · last outcomes: <b>${log.join(' / ')||'running'}</b>`);
  }};});

// ======================================================================
// C4 and E3 routes: a safe line and a designed skip; when the skip pays
// ======================================================================
REG('routes',root=>{const S=stage(root),q=CTL(root),rng=RNG(7);const hist={3.4:[],0.5:[]};let runners=[],spawn=0,t=0;
  return {tick(sec){const s=q.v('s'),p=q.v('p')/100,tt=q.v('t');t+=sec;spawn-=sec;const k=slow(q);
    if(spawn<=0){spawn=.9;const fail=rng()<p;runners.push({u:0,fail,skip:true,alive:true});runners.push({u:0,skip:false,alive:true});}
    for(const r of runners){r.u+=sec*k*(r.skip?.42:.3);if(r.skip&&r.fail&&r.u>.55&&r.alive){r.alive=false;r.fallT=0;for(const R of [3.4,.5]){hist[R].push(-(tt+R));hist[R]=hist[R].slice(-40);}}
      if(!r.alive)r.fallT+=sec*k;if(r.skip&&!r.fail&&r.u>=1&&!r.scored){r.scored=1;for(const R of [3.4,.5]){hist[R].push(s);hist[R]=hist[R].slice(-40);}}}
    runners=runners.filter(r=>r.u<1.05&&!(r.fallT>.8));
    const c=S.c;S.begin();
    // the map: a safe line that detours down and around, a skip over a gap on a one-way tile
    const safe=u=>{if(u<.3)return [40+u/.3*180,120];if(u<.5)return [220+(u-.3)/.2*40,120+(u-.3)/.2*60];if(u<.8)return [260+(u-.5)/.3*240,180];return [500+(u-.8)/.2*100,180-(u-.8)/.2*60];};
    const skip=u=>{const x=220+u*280;const yy=u<.5?120-Math.sin(u*Math.PI)*70:u<.65?120:120;return [x,u<.5?120-Math.sin(u*Math.PI)*70:120];};
    c.strokeStyle=INK;c.lineWidth=14;c.lineCap='round';c.beginPath();for(let i=0;i<=40;i++){const [x,y]=safe(i/40);i?c.lineTo(x,y+8):c.moveTo(x,y+8);}c.stroke();
    c.lineWidth=14;c.beginPath();c.moveTo(440,128);c.lineTo(500,128);c.stroke();c.fillStyle=INK;c.fillRect(380,98,60,8);c.fillStyle=PAPER;c.fillRect(384,101,52,2);
    dashLine(c,220,120,500,120,RED,[4,6],1.5);c.setLineDash([4,6]);c.strokeStyle=RED;c.beginPath();for(let i=0;i<=20;i++){const [x,y]=skip(i/20*.5);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.setLineDash([]);
    T(c,'safe line',150,108,{s:12,col:MUTE});T(c,'the skip: one clean jump onto a one-way tile',300,40,{s:12,col:RED});T(c,'gap',320,170,{s:11,col:MUTE});T(c,'FLAG',606,112,{s:11,w:700,col:'#c4c4c4'});c.fillStyle=INK;c.fillRect(600,80,3,40);c.fillStyle=RED;c.beginPath();c.moveTo(603,80);c.lineTo(620,86);c.lineTo(603,92);c.fill();
    for(const r of runners){let x,y;if(r.skip){if(r.alive){[x,y]=skip(r.u);}else{[x,y]=skip(.55);y+=r.fallT*160;}}else[x,y]=safe(r.u);c.fillStyle=r.skip?RED:INK;if(!r.alive)c.globalAlpha=Math.max(0,1-r.fallT);c.beginPath();c.arc(x,y-8,5,0,Math.PI*2);c.fill();c.globalAlpha=1;}
    // the arithmetic
    const y0=215;T(c,`skip saves s = ${s.toFixed(1)} s · fails p = ${Math.round(p*100)}% · placed t = ${tt} s into the run`,12,y0,{s:13,w:600});
    T(c,'pays when s (1 - p) > p (t + restart). Expected gain per attempt:',12,y0+18,{s:12,col:MUTE});
    [[3.4,'restart 3.4 s (today)'],[.5,'restart 0.5 s (proposed)']].forEach(([Rr,nm],i)=>{const ev=s*(1-p)-p*(tt+Rr),need=p*(tt+Rr)/(1-p||1e-9);const y=y0+40+i*44;T(c,nm,12,y+10,{s:12});
      const cx=330,scale=18;c.fillStyle=PALE;c.fillRect(150,y,360,18);c.fillStyle=ev>=0?GREEN:RED;const bw=CL(Math.abs(ev)*scale,0,180);c.fillRect(ev>=0?cx:cx-bw,y,bw,18);c.fillStyle=INK;c.fillRect(cx,y-3,1,24);
      T(c,`${ev>=0?'+':''}${ev.toFixed(2)} s`,ev>=0?cx+bw+6:cx-bw-6,y+13,{s:12,w:600,al:ev>=0?'left':'right',col:ev>=0?GREEN:RED});T(c,`needs s > ${need.toFixed(1)} s`,520,y+13,{s:12,col:MUTE});
      const h=hist[Rr],avg=h.length?h.reduce((a,b)=>a+b,0)/h.length:0;T(c,h.length?`seen: ${h.length} skips, average ${avg>=0?'+':''}${avg.toFixed(2)} s`:'',150,y+31,{s:11,col:MUTE});});
    const a25=25;T(c,`on a 25 s author time: under the 6% gold band (${(a25*.06).toFixed(1)} s) nobody bothers, 8 to 15% (${(a25*.08).toFixed(0)} to ${(a25*.15).toFixed(1)} s) is the target, over 20% (${(a25*.2).toFixed(0)} s) the safe route dies`,12,345,{s:11,col:MUTE});
    
    RO(root,`today: s(1-p) = ${(s*(1-p)).toFixed(2)} against p(t+3.4) = ${(p*(tt+3.4)).toFixed(2)} · proposed: against p(t+0.5) = ${(p*(tt+.5)).toFixed(2)} · near the finish (t 25 s, p 30%) a skip must save about 12 s today; at the start (t 2 s) about 2.3 s`);
  }};});

// ======================================================================
// C5 checkpoints: splits only, respawn, Trackmania's both; one death at section 3
// ======================================================================
REG('checkpoints',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),run=fixed();
  const mk=()=>local.makeCourse({width:4300,solids:[[0,G,4300,400]],checkpoints:[1000,2000,3000],finish:{x:4000},start:{x:60,y:G}});
  const lanes=[{name:'Splits only (SpeedRunner today): whole map restarts, 3 s countdown',mode:'restart'},{name:'Respawn at the last checkpoint (Mario Maker, Celeste rooms): run unranked',mode:'respawn'},{name:'Both (Trackmania): respawn with the timer running, lost time is the penalty',mode:'both'}];
  for(const L of lanes){L.w=mk();L.R=mkRunner(L.w);L.timer=0;L.state='run';L.cd=0;L.died=false;L.lost=0;L.flag='';L.spent=0;L.cost=0;}
  let cycle=0;
  return {tick(sec){const dx=2000+q.v('pos')*10;
    run(sec*slow(q),dt=>{aclock+=dt;let allDone=true;for(const L of lanes){const R=L.R,P=R.P;
      if(L.state==='run'){const inp={dir:1,jump:0,jumpPressed:0};const ev=R.step(inp,dt,{});L.timer+=dt;for(const e of ev)if(e==='check')SFX(root,snd,'check');
        if(!L.died&&P.x>dx){L.died=true;P.dead=1;L.state='dead';L.deadT=0;L.deathTimer=L.timer;L.deathSteps=P.steps;dustFor(R.parts,P,['die']);SFX(root,snd,'die');}
        if(R.done===1&&L.state==='run'){L.state='done';SFX(root,snd,'finish');}}
      else if(L.state==='dead'){L.deadT+=dt;if(L.mode==='both'||L.mode==='respawn')L.timer+=dt;
        if(L.deadT>=.38){const cpx=L.w.checkpoints[R.cp]!=null?L.w.checkpoints[R.cp]+30:60;if(L.mode==='restart'){L.state='cd';L.cd=3;R.reset();L.lost=L.deathTimer+.38+3;L.timer=0;}
          else{const cp=R.cp;R.reset();R.P.x=cpx;R.cp=cp;L.state='run';L.lost=L.deathTimer-(cp>=0?L.deathSplit:0)+.38;if(L.mode==='respawn')L.flag='unranked';}}}
      else if(L.state==='cd'){L.cd-=dt;if(Math.ceil(L.cd)!==L.lastBeep){L.lastBeep=Math.ceil(L.cd);SFX(root,snd,L.cd<=0?'go':'beep');}if(L.cd<=0)L.state='run';}
      if(L.state!=='done')allDone=false;if(R.cp>=0&&L.deathSplit==null&&R.P.x>dx-50)L.deathSplit=R.splits[R.cp]*DT;dustTick(R.parts,dt);}
      if(allDone){cycle+=dt;if(cycle>1.8){cycle=0;for(const L of lanes){L.R.reset();L.timer=0;L.state='run';L.died=false;L.lost=0;L.flag='';L.deathSplit=null;}}}});
    const c=S.c;S.begin();const sc=.33;
    lanes.forEach((L,i)=>{const y0=i*120;c.save();c.beginPath();c.rect(0,y0,640,120);c.clip();c.translate(0,y0);const R=L.R,P=R.P;const cam={x:CL(P.x-700,0,L.w.width-1940),y:G-260};
      H.drawSolids(c,L.w,cam,{t:aclock,sc,cp:R.cp});worldToScreen(c,cam,sc);c.fillStyle=RED;c.beginPath();c.moveTo(dx-12,G);c.lineTo(dx,G-26);c.lineTo(dx+12,G);c.fill();T(c,'x',dx,G-32,{s:30,col:RED,al:'center',w:700});
      dustDraw(c,R.parts);if(L.state!=='cd')drawHero(c,P,R.rig);c.restore();
      T(c,L.name,10,16,{s:12,w:600});T(c,fmtT(L.timer*1000),630,18,{s:16,mono:1,al:'right',w:600});
      if(L.state==='cd')T(c,String(Math.ceil(L.cd)),320,70,{s:48,w:800,al:'center'});
      if(L.lost)T(c,`death cost ${L.lost.toFixed(2)} s${L.flag?' · '+L.flag:L.mode==='both'?' · ranked, the lost time is the penalty':''}`,10,112,{s:12,col:RED,w:600});
      c.restore();c.fillStyle=LIGHT;c.fillRect(0,y0+119,640,1);});
    
    const t3=(dx-2000)/420;RO(root,`sections are 1000 u, 2.38 s at top speed · dying ${t3.toFixed(1)} s into section 3 costs: splits only <b>${(2000/420+t3+3.4).toFixed(1)} s</b> (the run so far plus 0.38 s dead plus the 3 s countdown) · respawn <b>${(t3+.38).toFixed(2)} s</b> but the run leaves the board · both <b>${(t3+.38).toFixed(2)} s</b> on the clock, still ranked`);
  }};});

// ======================================================================
// D1 patroller: a clock patroller, a 3 u hitbox inset and the 2-step contact rule
// ======================================================================
REG('patroller',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),run=fixed();
  const w=flat(2300);const e={x0:880,x1:1180,w:28,h:24,x:880,dir:1};const R=mkRunner(w);let attempt=0,delays=[0,.35,.7,1.05,1.4],delay=0,overlapN=0,maxOv=0,result='',tally={clean:0,graze:0,hit:0},flash=0;
  const begin=()=>{R.reset();delay=delays[attempt%delays.length];attempt++;overlapN=0;maxOv=0;result='';};begin();
  return {tick(sec){const speed=q.v('speed'),need=q.v('steps');
    run(sec*slow(q),dt=>{aclock+=dt;const P=R.P;if(delay>0){delay-=dt;updateWorld(w,R.P.steps);const px=local.patrolX(e,Math.round((R.P.t+ (delays[(attempt-1)%delays.length]-delay))/DT),speed);e.dir=px>=e.x?1:-1;e.x=px;return;}
      // the enemy reads the level clock; the runner jumps at a fixed spot so the phase decides the outcome
      const inp={dir:1,jump:P.botHold,jumpPressed:0};if(P.onGround&&P.x>700&&P.x<720){inp.jump=true;inp.jumpPressed=true;P.botHold=true;}if(P.vy>=0)P.botHold=false;inp.jump=inp.jump||P.botHold;
      const ev=R.step(inp,dt,{});for(const x of ev)SFX(root,snd,x);
      const px=local.patrolX(e,P.steps+Math.round(delays[(attempt-1)%delays.length]/DT),speed);e.dir=px>=e.x?1:-1;e.x=px;
      const hb=[e.x-e.w/2+3,G-e.h+3,e.w-6,e.h-3];const ov=!P.dead&&overlap(P.x,P.y,PW,PH,hb);overlapN=ov?overlapN+1:0;maxOv=Math.max(maxOv,overlapN);
      if(overlapN>=need&&!P.dead){P.dead=1;R.ev.push('die');dustFor(R.parts,P,['die']);SFX(root,snd,'die');result='hit';tally.hit++;flash=.5;}
      dustTick(R.parts,dt);if(P.dead)P.deadT=(P.deadT||0)+dt;
      if(P.x>1500&&!result){result=maxOv>0?'graze forgiven':'clean';tally[maxOv>0?'graze':'clean']++;}
      if(P.x>2200||(P.dead&&P.deadT>.7))begin();});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x-350,0,w.width-970),y:G-545*.8};
    H.drawSolids(c,w,cam,{t:aclock});worldToScreen(c,cam);
    dashLine(c,e.x0,G+6,e.x1,G+6,GREY,[4,4]);T(c,`${e.x1-e.x0} u at ${speed} u/s: ${(2*(e.x1-e.x0)/speed).toFixed(1)} s round trip`,(e.x0+e.x1)/2,G+30,{s:14,col:MUTE,al:'center'});
    drawPatroller(c,e.x,G,e.dir,aclock);
    if(q.v('hb')){hitbox(c,e.x-e.w/2+3,G-e.h+3,e.w-6,e.h-3);c.strokeStyle=GREY;c.lineWidth=1;c.strokeRect(e.x-e.w/2,G-e.h,e.w,e.h);hitbox(c,P.x,P.y,PW,PH,BLUE);T(c,'3 u inset',e.x,G-e.h-8,{s:12,col:RED,al:'center'});}
    dashLine(c,710,G,710,G-80,GREY,[2,4]);T(c,'jump here',710,G-86,{s:12,col:MUTE,al:'center'});
    dustDraw(c,R.parts);drawHero(c,P,R.rig);
    if(overlapN>0)T(c,`overlap ${overlapN} step${overlapN>1?'s':''}`,P.x+PW/2,P.y-14,{s:16,col:overlapN>=need?RED:GOLD,al:'center',w:600});c.restore();
    T(c,`attempt ${attempt} · start delay ${delays[(attempt-1)%delays.length].toFixed(2)} s · ${result||(delay>0?'waiting':'running')}`,12,20,{s:13,w:600});
    T(c,`contact needs ${need} consecutive overlapping step${need>1?'s':''} (${(need*8.33).toFixed(0)} ms)`,12,38,{s:12,col:MUTE});
    RO(root,`outcomes: clean <b>${tally.clean}</b> · graze forgiven <b>${tally.graze}</b> · hit <b>${tally.hit}</b> · the patroller's x is a triangle wave of the level clock (report §7 patrolX), so the same start delay always gives the same outcome · SMB1 checks player-enemy contact on even frames and needs two consecutive overlapping frames [V, S9, S11]`);
  }};});

// ======================================================================
// D2 chaser: spawns at the last split 1.5 s behind at 0.85x maxRun
// ======================================================================
REG('chaser',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),run=fixed();
  const w=local.makeCourse({width:4200,solids:[[0,G,4200,400],[1300,G-50,64,50,'rock'],[2100,G-50,64,50,'rock'],[2900,G-50,64,50,'rock']],checkpoints:[600],finish:{x:3900}});
  const R=mkRunner(w);let ch=null,passT=null,hes=0,hesAt=-1,caught=0,escaped=0,avg=0;
  const begin=()=>{R.reset();ch=null;passT=null;hes=0;hesAt=-1;};begin();
  return {tick(sec){const mult=q.v('mult'),delay=q.v('delay'),H0=q.v('hes');
    run(sec*slow(q),dt=>{aclock+=dt;const P=R.P;const inp=local.bot(P,w,{lead:90});
      // hesitation: the runner stops for H0 s before each rock (illustrative of a slow player)
      for(const s of w.solids)if(s[4]==='rock'&&s[0]-P.x-PW<140&&s[0]>P.x&&hesAt!==s[0]&&P.onGround){hesAt=s[0];hes=H0;}
      if(hes>0){hes-=dt;inp.dir=0;inp.jump=0;inp.jumpPressed=0;}
      const ev=R.step(inp,dt,{corner:8});for(const x of ev)SFX(root,snd,x);
      if(R.cp>=0&&passT==null)passT=P.t;
      if(passT!=null&&!ch&&P.t-passT>=delay){ch={x:630,phase:0};SFX(root,snd,'wall');}
      if(ch&&!P.dead&&!R.done){ch.x+=local.PHYS.maxRun*mult*dt;ch.phase+=local.PHYS.maxRun*mult*dt*.042;if(ch.x+10>P.x){P.dead=1;R.ev.push('die');dustFor(R.parts,P,['die']);SFX(root,snd,'die');caught++;}}
      if(P.dead)P.deadT=(P.deadT||0)+dt;if(R.done===1){R.doneT=(R.doneT||0)+dt;if(R.doneT===dt){escaped++;SFX(root,snd,'finish');}}
      avg=P.t>0?P.x/P.t:0;dustTick(R.parts,dt);if((P.dead&&P.deadT>.8)||(R.done===1&&R.doneT>1.2))begin();});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x+PW/2-970*.36+120,0,w.width-970),y:G-545*.8};
    H.drawSolids(c,w,cam,{t:aclock,cp:R.cp});worldToScreen(c,cam);
    if(ch){const s=Math.sin(ch.phase),co=Math.cos(ch.phase),ps={hip:22-Math.abs(co)*1.8,lean:.4,th:[.95*s,-.95*s],sh:[.25+Math.max(0,co)*1.5,.25+Math.max(0,-co)*1.5],ua:[-.85*s,.85*s],la:[1.2,1.2]};
      H.drawSamurai(c,ps,ch.x,G,1,{kim:INK,hat:INK,flap:-.5,grip:0});c.fillStyle=RED;c.beginPath();c.arc(ch.x+12,G-ps.hip*SAM.leg-24,1.8,0,Math.PI*2);c.fill();T(c,`chaser ${Math.round(420*mult)} u/s`,ch.x,G-70,{s:13,col:RED,al:'center',w:600});}
    else if(passT!=null)T(c,`chaser in ${Math.max(0,delay-(P.t-passT)).toFixed(1)} s`,630,G-90,{s:13,col:RED,al:'center',w:600});
    if(hes>0)T(c,'hesitating',P.x+PW/2,P.y-20,{s:14,col:RED,al:'center'});
    dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();
    // pace margin bar
    const margin=ch?(P.x-ch.x):null,secs=margin!=null?margin/(420*mult):null;T(c,'pace margin',12,22,{s:13,w:600});
    bars(c,100,12,400,12,ch?CL(margin/900,0,1):1,ch&&margin<200?RED:INK);T(c,ch?`${Math.round(margin)} u, ${secs.toFixed(2)} s`:'no chaser yet',510,22,{s:12,col:MUTE});
    T(c,`runner average ${Math.round(avg)} u/s against ${Math.round(420*mult)} u/s · caught ${caught} · escaped ${escaped}`,12,40,{s:12,col:MUTE});
    RO(root,`the chaser spawns at the first split <b>${delay.toFixed(1)} s</b> after the runner passes it and runs at <b>${mult.toFixed(2)}x maxRun = ${Math.round(420*mult)} u/s</b> on the level clock [I] · each stop before a rock costs ${H0.toFixed(2)} s, which the chaser converts into ${Math.round(420*mult*H0)} u · N's chase drone doubles its speed on sight [V, S160]`);
  }};});

// ======================================================================
// D3 stomp: the bounce at full jumpVel, a refund, and a shell as a platform
// ======================================================================
REG('stomp',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),run=fixed();
  const w=local.makeCourse({width:3400,solids:[[0,G,1500,400],[1760,G,1700,400]]});const shell={lin:1,x0:1900,vx:-504,y0:G-18,w:50,h:18,t0:0};w.movers.push(shell);
  const en={x:820,alive:1,deadT:0};const R=mkRunner(w);let bounceApex=0,peakY=0,shellPlaced=false,outcome='';
  const begin=()=>{R.reset();en.alive=1;en.deadT=0;bounceApex=0;peakY=1e9;outcome='';};
  // find a shell start time the bot can land on, headless
  function tuneShell(){for(let t0=2.8;t0<4.6;t0+=.04){shell.t0=t0;const Rr=mkRunner(w);let ok=false;for(let i=0;i<1400;i++){const P=Rr.P;const inp=local.bot(P,w,{lead:100});if(P.onGround&&P.x>820-q.v('jd')&&P.x<820-q.v('jd')+10&&!P.jumpedEn){inp.jump=1;inp.jumpPressed=1;P.botHold=1;P.jumpedEn=1;}
      Rr.step(inp,DT,{});if(P.vy>0&&en.alive&&P.x+PW>en.x-14&&P.x<en.x+14&&P.y+PH>=G-28&&P.y+PH<=G-16){P.vy=-830;P.auto=.6;}if(P.x>3200){ok=true;break;}if(P.dead)break;}if(ok)return true;}return false;}
  let tuned=false;q.on('jd',()=>{tuned=false;});q.on('bm',()=>{});begin();
  return {tick(sec){const bm=q.v('bm'),jd=q.v('jd');if(!tuned){tuned=true;shellPlaced=tuneShell();begin();}
    run(sec*slow(q),dt=>{aclock+=dt;const P=R.P;const inp=local.bot(P,w,{lead:100});
      if(P.onGround&&P.x>en.x-jd&&P.x<en.x-jd+10&&!P.jumpedEn){inp.jump=1;inp.jumpPressed=1;P.botHold=1;P.jumpedEn=1;}
      const ev=R.step(inp,dt,{});for(const x of ev)SFX(root,snd,x);
      if(en.alive&&!P.dead&&P.x+PW>en.x-14&&P.x<en.x+14&&P.y+PH>G-28&&P.y<G){
        if(P.vy>0&&P.y+PH<=G-16){P.vy=-830*bm;P.auto=.6;P.onGround=false;P.peak=P.y+PH;P.stretch=1;en.alive=0;SFX(root,snd,'bounce');local.dust(R.parts,en.x,G-20,8,0,-1);if(q.v('refund')){P.vx=P.facing*420*1.2;}outcome='stomped';}
        else{P.dead=1;R.ev.push('die');dustFor(R.parts,P,['die']);SFX(root,snd,'die');outcome='hit from the side: moving downward kills, anything else hurts';}}
      if(!en.alive){en.deadT+=dt;if(outcome==='stomped'){peakY=Math.min(peakY,P.y+PH);bounceApex=G-peakY;}}
      if(P.dead)P.deadT=(P.deadT||0)+dt;dustTick(R.parts,dt);if(P.x>3300||(P.dead&&P.deadT>.8))begin();});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x+PW/2-970*.36+120,0,w.width-970),y:G-545*.85};
    H.drawSolids(c,w,cam,{t:aclock});worldToScreen(c,cam);
    if(en.alive)drawPatroller(c,en.x,G,-1,aclock);else if(en.deadT<.4){c.globalAlpha=1-en.deadT/.4;c.fillStyle=INK;c.beginPath();c.ellipse(en.x,G-5,16,4,0,0,Math.PI*2);c.fill();c.globalAlpha=1;}
    dashLine(c,en.x-jd,G,en.x-jd,G-60,GREY,[2,4]);T(c,`jump ${jd} u before`,en.x-jd,G-66,{s:12,col:MUTE,al:'center'});
    const ja=830*830/5000;dashLine(c,en.x-60,G-ja,en.x+120,G-ja,GREY,[3,4]);T(c,`plain jump ${Math.round(ja)} u`,en.x+124,G-ja+4,{s:12,col:GREY});
    if(bounceApex>0){dashLine(c,en.x-60,G-bounceApex,en.x+120,G-bounceApex,RED,[3,4]);T(c,`bounce ${Math.round(bounceApex)} u = ${(bounceApex/BL).toFixed(1)} BL`,en.x+124,G-bounceApex+4,{s:13,col:RED,w:600});}
    const sh=shell.cur||local.moverAt(shell,0);T(c,'kicked shell 1.2x run = 504 u/s',sh[0]+25,sh[1]-10,{s:12,col:MUTE,al:'center'});T(c,'gap',1630,G+30,{s:12,col:MUTE,al:'center'});
    if(q.v('refund')&&P.x>en.x&&Math.abs(P.vx)>421)T(c,`refund: vx ${Math.round(Math.abs(P.vx))} u/s, decaying 500 u/s²`,P.x+PW/2,P.y-22,{s:13,col:RED,al:'center'});
    dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();
    T(c,outcome||'running',12,20,{s:13,w:600,col:outcome.startsWith('hit')?RED:INK});
    RO(root,`bounce = <b>${bm.toFixed(2)}x jumpVel</b> (${Math.round(830*bm)} u/s) with the apex band on, a jump the player did not have to time [I] · stomp needs vy &gt; 0 and the feet within the top band, SMB1's "moving downward kills" [V, S11] · the shell is a one-way platform moving at 1.2x run, the shell jump from Mario Maker [V, S188] ${shellPlaced?'':'· (no shell timing works for this jump point)'}`);
  }};});

// ======================================================================
// D4 slash: 100 ms, 17 wind-up, 33 active, 50 recovery; 50x40 u; vx untouched
// ======================================================================
REG('slash',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const mk=()=>{const w=flat(3200);for(const x of [700,1400,2100,2800])w.solids.push([x,G-120,24,120,'bamboo']);return w;};
  let w=mk();const R=mkRunner(w);let cutN=0,manual={slash:0,jump:0},lastVx=[],minVx=420,stopT=0;
  const begin=()=>{w=mk();R.w=w;R.reset();minVx=420;stopT=0;};
  q.btn('x',()=>{manual.slash=1;});q.btn('j',()=>{manual.jump=1;});
  const WIND=2*DT,ACT=4*DT,TOTAL=.1;
  const doSlash=P=>{if(P.slash<=0){P.slash=TOTAL;P.slashT=0;P.slashHit=false;SFX(root,snd,'slash');}};
  return {tick(sec){const stops=q.v('stops');
    run(sec*slow(q),dt=>{aclock+=dt;const P=R.P;const inp={dir:1,jump:P.botHold?1:0,jumpPressed:0};
      const next=w.solids.find(s=>s[4]==='bamboo'&&!s.cut&&s[0]>P.x);
      if(I.idle&&next&&next[0]-P.x-PW<70&&P.slash<=0)doSlash(P);
      if(manual.slash){manual.slash=0;doSlash(P);}
      if(manual.jump||(I.idle&&P.slash>0&&P.slashT>WIND+ACT&&next&&Math.abs(next[0]-1400)<10&&P.onGround)){manual.jump=0;inp.jump=1;inp.jumpPressed=1;P.botHold=1;if(P.slash>0){P.slash=0;P.cancelled=.5;}}
      if(P.vy>=0)P.botHold=0;P.cancelled=Math.max(0,(P.cancelled||0)-dt);
      const ev=R.step(inp,dt,{slashStops:stops,corner:8});for(const x of ev)SFX(root,snd,x);
      if(P.slash>0&&P.slashT>=WIND&&P.slashT<WIND+ACT){const hb=[P.x+PW,P.y+6,50,40];for(const s of w.solids)if(s[4]==='bamboo'&&!s.cut&&overlap(hb[0],hb[1],hb[2],hb[3],s)){s.cut=1;s.cutT=0;cutN++;}}
      for(const s of w.solids)if(s.cut){s.cutT+=dt;}w.solids=w.solids.filter(s=>!(s.cut&&s.cutT>1));R.w=w;
      if(P.x>600&&P.x<3000)minVx=Math.min(minVx,Math.abs(P.vx));if(P.slash>0&&stops)stopT+=dt;
      dustTick(R.parts,dt);if(P.x>3100||P.dead)begin();});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x+PW/2-970*.36+120,0,w.width-970),y:G-330};
    c.save();c.beginPath();c.rect(0,0,640,230);c.clip();H.drawSolids(c,w,cam,{t:aclock});worldToScreen(c,cam);
    for(const s of w.solids)if(s.cut){c.save();c.translate(s[0]+s[2]/2,s[1]+s[3]);c.rotate(Math.min(1.4,s.cutT*3));c.fillStyle='#bdbdbd';c.fillRect(-s[2]*.2,-s[3],s[2]*.4,s[3]*.6);c.restore();}
    if(P.slash>0){const act=P.slashT>=WIND&&P.slashT<WIND+ACT;hitbox(c,P.x+PW,P.y+6,50,40,act?RED:LIGHT);if(act){c.strokeStyle=PAPER;c.lineWidth=3;c.beginPath();c.arc(P.x+PW+10,P.y+26,38,-1.2,.9);c.stroke();c.strokeStyle=INK;c.lineWidth=1.2;c.beginPath();c.arc(P.x+PW+10,P.y+26,38,-1.2,.9);c.stroke();}
      T(c,P.slashT<WIND?'wind-up':act?'active':'recovery',P.x+PW+25,P.y-6,{s:13,col:act?RED:MUTE,al:'center',w:600});}
    if(P.cancelled>0)T(c,'cancelled into a jump',P.x+PW/2,P.y-26,{s:13,col:RED,al:'center'});
    dustDraw(c,R.parts);drawHero(c,P,R.rig,{slashMs:TOTAL});c.restore();
    T(c,`vx ${Math.round(Math.abs(P.vx))} u/s · lowest vx this run ${Math.round(minVx)}${stops?' · the slash clamps vx (the wrong way)':''}`,12,20,{s:13,w:600,col:stops?RED:INK});c.restore();
    // frame strip: 12 steps of 8.33 ms
    c.fillStyle=LIGHT;c.fillRect(0,232,640,1);T(c,'the 12 physics steps of one slash (8.33 ms each)',12,248,{s:12,w:600});
    for(let i=0;i<12;i++){const x=22+i*52,y=333,act=i>=2&&i<6;const tt=i*DT,bl=LP(-1.3,1.6,tt/TOTAL);c.fillStyle=act?'#fde8e6':i<2?'#f3f3f3':PAPER;c.fillRect(x-10,268,50,84);
      const ps={hip:22,lean:.25,th:[.6,-.3],sh:[.6,.4],ua:[.2,-.6],la:[.5,.4]};H.drawSamurai(c,ps,x+12,y+8,1,{blade:bl,grip:0,flap:-.3,sx:.85,sy:.85});
      if(act){c.strokeStyle=RED;c.lineWidth=1;c.setLineDash([2,2]);c.strokeRect(x+22,y-26,17*.85,40*.85*.4);c.setLineDash([]);}
      T(c,`${Math.round(tt*1000)}`,x+12,349,{s:10,col:MUTE,al:'center',mono:1});}
    T(c,'wind-up 17 ms',12,264,{s:11,col:MUTE});T(c,'active 33 ms, 50x40 u in front',22+2*52-6,264,{s:11,col:RED,w:600});T(c,'recovery 50 ms, cancel into a jump any time',22+6*52-6,264,{s:11,col:MUTE});
    RO(root,`bamboo cut: <b>${cutN}</b> · the slash never writes vx, so a cut at 420 u/s costs nothing; tick the clamp to see a stop sign at every stalk [I] · Dustforce attacks barely touch forward speed and Pizza Tower's grab keeps momentum [V, S206, S190] · press Slash or Jump to drive it, it plays alone after 2 s`);
  }};});

// ======================================================================
// E1 medals: author time x1.06, x1.2, x1.5 over the four maps' run lengths
// ======================================================================
REG('medals',root=>{const S=stage(root),q=CTL(root);const rows=MAPS.map(m=>({name:m.name,run:m.width/420,w:m.width})).concat([{name:'Sandbox course',run:20/1.45,w:null,author:20}]);let t=0;
  return {tick(sec){t+=sec;const am=q.v('am'),yt=q.v('yt');const c=S.c;S.begin();const x0=150,x1=470,tmax=60,X=s=>x0+(x1-x0)*s/tmax;
    for(let s=0;s<=60;s+=10){dashLine(c,X(s),28,X(s),188,PALE,[2,3]);T(c,s+' s',X(s),22,{s:10,col:MUTE,al:'center'});}
    rows.forEach((r,i)=>{const y=40+i*30;const author=r.author||r.run*am,med=[1.06,1.2,1.5].map(k=>Math.ceil(author*k));const mine=author*yt;
      T(c,r.name,x0-8,y+12,{s:11,al:'right',w:600});c.fillStyle=PALE;c.fillRect(X(0),y+3,X(med[2])-X(0),14);
      if(r.w){c.fillStyle=INK;c.fillRect(X(0),y+3,X(r.run)-X(0),14);T(c,`${r.w} u`,X(0)+4,y+13,{s:9,col:PAPER,mono:1});}
      c.fillStyle=RED;c.fillRect(X(author)-1,y,2,20);
      [[GOLD,'G'],[SILVER,'S'],[BRONZE,'B']].forEach(([col,l],k)=>{c.fillStyle=col;c.beginPath();c.arc(X(med[k]),y+10,7,0,Math.PI*2);c.fill();T(c,l,X(med[k]),y+13,{s:9,col:PAPER,al:'center',w:700});});
      const got=mine<=med[0]?'gold':mine<=med[1]?'silver':mine<=med[2]?'bronze':'none';const bob=Math.sin(t*4+i)*1.5;c.fillStyle=BLUE;c.beginPath();c.moveTo(X(mine),y+2+bob);c.lineTo(X(mine)-5,y-6+bob);c.lineTo(X(mine)+5,y-6+bob);c.closePath();c.fill();
      T(c,`author ${author.toFixed(1)} · ${med.join('/')} · you ${mine.toFixed(1)} s, ${got}`,X(med[2])+12,y+13,{s:10,col:MUTE});});
    T(c,'black: pure running at 420 u/s · red: author time · G S B: 1.06x, 1.2x, 1.5x rounded up to the second · blue: you',12,196,{s:10,col:MUTE});
    RO(root,`author time = pure running x <b>${am.toFixed(2)}</b> (a clean human run is about 1.3 to 1.6x the flat-out time) · m1 ${(6830/420*am).toFixed(1)} s, m2 ${(8700/420*am).toFixed(1)} s, m3 ${(4580/420*am).toFixed(1)} s, m4 ${(6550/420*am).toFixed(1)} s · the Sandbox's 20 s author run gives gold 21.2, silver 24, bronze 30 s · about 29% of finishers on one Cup of the Day map had gold or better [V, S176]`);
  }};});

// ======================================================================
// E2 teach: the map set as teach, develop, twist, resolve
// ======================================================================
REG('teach',root=>{const S=stage(root),q=CTL(root);let t=0;
  const skills=['jump a rock','steps and buffer','momentum gap','wall jumps (chimney)','high drop and roll','narrow platforms','low ceiling hops','600 u wall climb','drop chain, roll twice','spike ceilings','one-way roof tiles','movers','wheels','everything at speed'];
  // 1 taught safely, 2 used again, 3 twisted, 4 demanded at speed and never taught
  const today={cols:['m1 FIRST STEPS','m2 ROCKY MOUNTAIN','m3 THE DUNGEON','m4 STAIRWAY','5 SAMURAI TRIAL'],tags:['teach','develop and twist','twist','twist','locked'],
    cells:[[1,2,2,2,0],[1,2,0,0,0],[1,2,0,2,0],[1,2,3,2,0],[1,2,2,0,0],[1,2,0,3,0],[0,1,2,0,0],[0,1,3,0,0],[0,1,0,0,0],[0,0,3,0,0],[0,0,0,4,0],[0,0,0,4,0],[0,0,0,4,0],[0,0,0,0,0]]};
  const prop={cols:['m1 FIRST STEPS','m2 ROCKY MOUNTAIN','new Medium map','m4 STAIRWAY','m3 THE DUNGEON','5 SAMURAI TRIAL'],tags:['teach','develop','develop','twist','twist','resolve'],
    cells:[[1,2,2,2,2,2],[1,2,2,2,2,2],[1,2,2,2,2,2],[1,2,2,2,3,3],[1,2,2,2,2,2],[1,2,2,3,2,3],[1,2,2,0,0,2],[0,1,2,0,3,3],[0,1,2,0,2,2],[0,0,0,0,3,3],[0,0,1,3,0,3],[0,0,1,3,0,3],[0,0,1,3,0,3],[0,0,0,0,0,3]]};
  return {tick(sec){t+=sec;const D=q.segv('v')==='prop'?prop:today;const c=S.c;S.begin();const x0=150,cw=(630-x0)/D.cols.length,rh=18,y0=46;const hi=Math.floor(t*.6)%D.cols.length;
    D.cols.forEach((n,j)=>{const x=x0+j*cw;if(j===hi){c.fillStyle='#f6f3ee';c.fillRect(x,y0-30,cw,skills.length*rh+30);}T(c,n.replace(/^(\S+) /,'$1\n').split('\n')[0],x+cw/2,y0-18,{s:10,w:700,al:'center'});T(c,D.tags[j],x+cw/2,y0-6,{s:10,col:D.tags[j]==='twist'||D.tags[j]==='resolve'?RED:MUTE,al:'center'});});
    skills.forEach((s,i)=>{const y=y0+i*rh;T(c,s,x0-8,y+13,{s:11,al:'right'});c.fillStyle=PALE;c.fillRect(x0,y+rh-1,630-x0,1);
      D.cells[i].forEach((v,j)=>{const x=x0+j*cw+cw/2,yy=y+10;if(!v)return;if(v===1){c.fillStyle=INK;c.beginPath();c.arc(x,yy,5,0,Math.PI*2);c.fill();}else if(v===2){c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.arc(x,yy,5,0,Math.PI*2);c.stroke();}
        else if(v===3){c.fillStyle=RED;c.beginPath();c.arc(x,yy,5,0,Math.PI*2);c.fill();}else{c.strokeStyle=RED;c.lineWidth=2;c.beginPath();c.moveTo(x-5,yy-5);c.lineTo(x+5,yy+5);c.moveTo(x+5,yy-5);c.lineTo(x-5,yy+5);c.stroke();}});});
    const ly=y0+skills.length*rh+14;const leg=[[INK,'f','taught safely'],[INK,'o','used again'],[RED,'f','twisted'],[RED,'x','demanded at speed, never taught']];let lx=x0-60;
    for(const [col,k,txt] of leg){if(k==='f'){c.fillStyle=col;c.beginPath();c.arc(lx,ly,5,0,Math.PI*2);c.fill();}else if(k==='o'){c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.arc(lx,ly,5,0,Math.PI*2);c.stroke();}else{c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.moveTo(lx-4,ly-4);c.lineTo(lx+4,ly+4);c.moveTo(lx+4,ly-4);c.lineTo(lx-4,ly+4);c.stroke();}T(c,txt,lx+10,ly+4,{s:11,col:MUTE});lx+=TW(c,txt,{s:11})+34;}
    T(c,D===today?'today: m4 asks for roof tiles, movers and wheels that no earlier map taught, and nothing resolves':'proposed: a Medium map teaches movers and tiles, maps 3 and 4 swap, SAMURAI TRIAL chains every atom at speed with nothing new',12,352,{s:11,col:MUTE});
    RO(root,D===today?`m1 teaches 7 atoms in 6830 u; m2 stacks a pillar run, a low-ceiling cave, a 600 u wall climb and a double roll; m3 is a generated twist on wall jumps under spike ceilings; m4 twists one-way tiles and movers that m1 and m2 never taught [K; I]`:`the missing halves are development and resolution: a low ceiling before m2's cave, a Medium map that uses movers and roof tiles safely before STAIRWAY, and a trial that chains everything at speed with no new atoms [I]`);
  }};});

// ======================================================================
// E4 readability: gaps in body lengths against the real jump arc; blind drops
// ======================================================================
REG('readability',root=>{const S=stage(root),q=CTL(root),run=fixed();
  const mkGap=bl=>local.makeCourse({width:2200,solids:[[0,G,700,400],[700+bl*BL,G,1500-bl*BL,400]],start:{x:120,y:G},deathY:760});
  let w=mkGap(q.v('gap')),R=mkRunner(w),gapBL=q.v('gap'),land='',maxGap=0,standGap=0;
  // measure the real maximum gap headless: full-speed held jump at the edge, and a standing jump
  function measure(stand){let best=0;for(let bl=1;bl<=12;bl+=.25){const ww=mkGap(bl);const Rr=mkRunner(ww);if(stand){Rr.P.x=700-PW;}let ok=false;
    for(let i=0;i<900;i++){const P=Rr.P;const inp=stand?{dir:P.x>=700-PW-1?1:0,jump:P.botHold?1:0,jumpPressed:0}:local.bot(P,ww,{lead:8});if(stand&&P.onGround&&!P.jumpedS){inp.jump=1;inp.jumpPressed=1;P.botHold=1;P.jumpedS=1;}
      if(P.vy>0)P.botHold=0;Rr.step(inp,DT,{});if(P.dead)break;if(P.onGround&&P.x>700+bl*BL){ok=true;break;}}if(ok)best=bl;else break;}return best;}
  maxGap=measure(false);standGap=measure(true);
  q.on('gap',()=>{gapBL=q.v('gap');w=mkGap(gapBL);R=mkRunner(w);land='';});
  // the blind-drop panel: the game's camera (ref follows the feet, lerp 5/s) against a downward look-ahead
  let drop={t:0,y:0,vy:0,cam:0,on:false,seen:null};
  return {tick(sec){const k=slow(q);
    run(sec*k,dt=>{aclock+=dt;const P=R.P;const inp=local.bot(P,w,{lead:8});R.step(inp,dt,{});dustTick(R.parts,dt);
      if(!land&&P.onGround&&P.x>700+gapBL*BL)land='landed';if(P.dead&&!land)land='fell';if(P.dead)P.deadT=(P.deadT||0)+dt;if(P.x>2000||(P.dead&&P.deadT>.6)){R.reset();land='';}
      // drop sim in 1D
      const D=q.v('drop');drop.t+=dt;if(!drop.on){if(drop.t>1){drop.on=true;drop.y=0;drop.vy=0;drop.cam=0;drop.seen=null;drop.t=0;}}
      else{drop.vy=Math.min(1150,drop.vy+2500*1.65*dt);drop.y+=drop.vy*dt;const ref=drop.y;let ty=ref;if(q.v('lead'))ty+=Math.min(200,drop.vy*.25);drop.cam+=(ty-drop.cam)*(1-Math.exp(-5*dt));
        const viewBottom=drop.cam+545*.38;if(drop.seen==null&&viewBottom>=D)drop.seen={t:drop.t,left:D-drop.y};if(drop.y>=D){drop.y=D;drop.on=false;drop.done={seen:drop.seen,T:drop.t};drop.t=-.6;}}});
    const c=S.c;S.begin();const P=R.P;
    // top: the gap
    c.save();c.beginPath();c.rect(0,0,640,212);c.clip();const cam={x:CL(P.x-380,0,w.width-970),y:G-545*.36};H.drawSolids(c,w,cam,{t:aclock});worldToScreen(c,cam);
    for(let b=0;b<=12;b++){const x=700+b*BL;dashLine(c,x,G,x,G+(b%2?14:24),GREY,[1,2],1);if(b%2===0)T(c,b+' BL',x,G+40,{s:12,col:MUTE,al:'center'});}
    c.fillStyle=RED;c.fillRect(700,G-2,gapBL*BL,2);T(c,`gap ${gapBL.toFixed(2)} BL = ${Math.round(gapBL*BL)} u`,700+gapBL*BL/2,G-10,{s:14,col:RED,al:'center',w:600});
    dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();
    T(c,`measured with the ported step: a held full-speed jump from the edge clears up to ${maxGap.toFixed(2)} BL (${Math.round(maxGap*BL)} u)`,12,20,{s:12,w:600});T(c,`a standing jump that starts moving at the edge clears up to ${standGap.toFixed(2)} BL`,12,36,{s:12,col:MUTE});
    T(c,land?`this gap: ${land}`:'',12,54,{s:13,col:land==='fell'?RED:GREEN,w:600});c.restore();
    c.fillStyle=LIGHT;c.fillRect(0,214,640,1);
    // bottom: blind drop with the view box
    const D=q.v('drop'),sc=.14,ox=90,oy=250;T(c,`blind drop: ${D} u from a mid-screen stance`,330,232,{s:12,w:600});
    c.save();c.beginPath();c.rect(0,216,640,144);c.clip();c.translate(ox,oy);c.scale(sc,sc);
    c.fillStyle=INK;c.fillRect(-900,0,900,1400);c.fillRect(0,D,1400,1400);
    const vx=-970*.36,vy=drop.cam-545*.62;c.strokeStyle=BLUE;c.lineWidth=6;c.strokeRect(vx,vy,970,545);c.fillStyle='rgba(20,120,200,.06)';c.fillRect(vx,vy,970,545);
    const ps=local.targetPose({vx:0,vy:drop.on?drop.vy:0,onGround:!drop.on,wallDir:0,land:0,roll:0,flipOn:0,phase:0},aclock);H.drawSamurai(c,ps,-12,drop.y,1,{flap:-.3});
    T(c,'landing',40,D+90,{s:60,col:drop.cam+545*.38>=D?GREEN:RED,w:600});
    const seen=drop.done&&drop.done.seen;c.restore();
    T(c,drop.done?(seen?`landing came into view ${Math.round(seen.left)} u, ${((drop.done.T-seen.t)).toFixed(2)} s before impact`:'landing never in view before impact'):'falling',330,250,{s:12,col:seen&&seen.left>288?GREEN:RED,w:600});
    T(c,'view 970x545 u, feet at 62% down; the vertical',330,270,{s:10,col:MUTE});T(c,'reference follows the feet with a 5/s lerp [K]',330,283,{s:10,col:MUTE});if(q.v('lead'))T(c,'plus a look-ahead of vy x 0.25 s capped at 200 u [I]',330,296,{s:10,col:MUTE});T(c,'green when the landing shows more than 288 u (250 ms at 1150 u/s) out',330,316,{s:10,col:MUTE});
    RO(root,`rule set from PHYS: safe gaps at most 6 BL, momentum gaps 7 to 9 BL, main-route platforms at least 2 BL wide [I] · the report's arithmetic puts the practical full-speed gap at 9 to 10 BL; the ported step measures <b>${maxGap.toFixed(2)} BL</b> at 420 u/s with the apex band held (see notes/scratch-figF/REPORT-ISSUES.md) · terminal fall crosses the 545 u view in 0.47 s, and 250 ms of reaction at 1150 u/s is 288 u, the "no spike within 300 u of an unseen landing" rule [K; I]`);
  }};});

// ======================================================================
// E5 daily: a seeded chunk generator, rhythm first, tagged chunks, bot proof
// ======================================================================
REG('daily',root=>{const S=stage(root),q=CTL(root),I=idler(root),run=fixed();const CW=1450;
  const LIB=[{tag:'rest',cost:0,b:()=>[]},{tag:'run with a rock',cost:1,b:()=>[[600,G-50,64,50,'rock']]},{tag:'one gap',cost:1,gaps:[[640,790]]},{tag:'rising steps',cost:2,b:()=>[[500,G-60,140,60],[640,G-120,140,120],[780,G-180,300,180]]},
    {tag:'two gaps',cost:2,gaps:[[400,550],[900,1060]]},{tag:'rock pair',cost:2,b:()=>[[450,G-50,64,50,'rock'],[800,G-50,64,50,'rock']]},{tag:'pillar run',cost:3,gaps:[[300,460],[556,716],[812,972],[1068,1228]]},
    {tag:'step then drop and roll',cost:2,b:()=>[[300,G-120,500,120]]},{tag:'long gap at speed',cost:4,gaps:[[600,820]]},{tag:'low ceiling hops',cost:3,b:()=>[[500,G-170,500,40],[520,G-30,40,30],[780,G-30,40,30]]}];
  const RAMP=[1,1,2,2,3,2,4,0];let seed=+q.v('seed')||20261113,gen=null,R=null,phase='gen',msg='';
  function build(sd){const rng=RNG(sd);const n=6+Math.floor(rng()*3);const rhythm=RAMP.slice(0,n).map((cst,i)=>({cost:cst,beats:cst===0?0:1+Math.floor(rng()*cst)}));
    const picks=rhythm.map(r=>{const cands=LIB.filter(l=>l.cost===r.cost);return cands[Math.floor(rng()*cands.length)];});return {rng,rhythm,picks,n};}
  function course(picks){const w=local.makeCourse({width:300+picks.length*CW+400,solids:[],deathY:760,start:{x:120,y:G},finish:{x:300+picks.length*CW+200},checkpoints:[]});
    let x=0;const ground=(a,b)=>{if(b>a)w.solids.push([a,G,b-a,400]);};ground(0,300);x=300;
    picks.forEach((p,i)=>{let gx=x;for(const [a,b] of (p.gaps||[])){ground(gx,x+a);gx=x+b;}ground(gx,x+CW);if(p.b)for(const s of p.b())w.solids.push([x+s[0],s[1],s[2],s[3],s[4]]);if(i%2===1)w.checkpoints.push(x+CW-40);x+=CW;});ground(x,x+400);w.labels=picks.map((p,i)=>[300+i*CW+20,`${i+1} ${p.tag}`]);return w;}
  function prove(w){const Rr=mkRunner(w);for(let i=0;i<120*90;i++){const P=Rr.P;Rr.step(local.bot(P,w,{lead:100}),DT,{corner:8});if(P.dead)return {ok:false,x:P.x,steps:i};if(Rr.done===1)return {ok:true,steps:P.steps};}return {ok:false,x:Rr.P.x,steps:0};}
  function generate(sd){const t0=performance.now();const g0=build(sd);let picks=g0.picks.slice(),tries=0,res,swaps=[];let w=course(picks);res=prove(w);
    while(!res.ok&&tries<6){tries++;const bad=Math.max(0,Math.min(picks.length-1,Math.floor((res.x-300)/CW)));const lower=LIB.filter(l=>l.cost<picks[bad].cost);picks[bad]=lower[Math.floor(g0.rng()*lower.length)]||LIB[0];swaps.push(bad+1);w=course(picks);res=prove(w);}
    gen={seed:sd,rhythm:g0.rhythm,picks,w,res,tries,swaps,ms:performance.now()-t0,author:res.ok?res.steps/120:null};R=mkRunner(w);phase='replay';}
  q.btn('gen',()=>{seed=Math.floor(+q.v('seed'))||1;generate(seed);});generate(seed);
  return {tick(sec){run(sec*slow(q),dt=>{aclock+=dt;if(!R)return;const P=R.P;R.step(local.bot(P,gen.w,{lead:100}),dt,{corner:8});dustTick(R.parts,dt);
      if(R.done){R.doneT=(R.doneT||0)+dt;if(R.doneT>1.5){if(I.idle){seed++;q.el('seed').value=seed;generate(seed);}else R.reset();}}});
    const c=S.c;S.begin();const w=gen.w,P=R.P;
    // overview strip
    const osc=620/w.width;c.save();c.translate(10,64);c.scale(osc,osc);c.fillStyle=INK;for(const s of w.solids)c.fillRect(s[0],(s[1]-G)*1+0,s[2],Math.min(s[3],60)+0);c.restore();
    gen.picks.forEach((p,i)=>{const x=10+(300+i*CW)*osc,wv=CW*osc;c.fillStyle=gen.swaps.includes(i+1)?RED:p.cost>=3?INK:MUTE;c.fillRect(x,50,wv*.96,3+p.cost*2);T(c,`cost ${p.cost}`,x+2,46,{s:9,col:MUTE,mono:1});T(c,p.tag,x+2,i%2?36:26,{s:9,col:MUTE});
      const beats=gen.rhythm[i].beats;for(let b=0;b<beats;b++){c.fillStyle=RED;c.beginPath();c.arc(x+10+b*9,16,3,0,Math.PI*2);c.fill();}});
    T(c,'rhythm first: jumps per chunk, drawn from the seed',10,10,{s:10,col:MUTE});c.fillStyle=BLUE;c.fillRect(10+(P.x)*osc-1,48,2,24);
    // camera view
    c.save();c.beginPath();c.rect(0,80,640,280);c.clip();c.translate(0,80);const cam={x:CL(P.x+PW/2-970*.36+120,0,w.width-970),y:G-545*.8+60};
    H.drawSolids(c,w,cam,{t:aclock,cp:R.cp,vw:640});worldToScreen(c,cam);dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();c.restore();
    T(c,`seed ${gen.seed} · ${gen.picks.length} chunks of ${CW} u, ${w.width} u in all · cost ramp ${gen.picks.map(p=>p.cost).join(' ')}`,12,100,{s:12,w:600});
    T(c,gen.res.ok?`bot proof: PASS in ${gen.tries} swap${gen.tries===1?'':'s'} (${gen.ms.toFixed(1)} ms headless) · author time ${gen.author.toFixed(2)} s`:'bot proof: FAIL after 6 swaps, the seed is rejected',12,118,{s:12,col:gen.res.ok?GREEN:RED,w:600});
    RO(root,`rhythm first: the seed draws ${gen.picks.length} beats of 1 to 4 jumps along the ramp 1, 1, 2, 2, 3, 2, 4, rest; each beat picks a chunk of that cost from a ${LIB.length}-chunk library; the headless bot then runs the real step() through the course and its time is the author time [V, S213, S214; I]${gen.swaps.length?` · chunks ${gen.swaps.join(', ')} were swapped lower after the bot died there`:''} · the next seed loads when the replay finishes and nobody has touched the figure`);
  }};});

// ======================================================================
// E6 maker: UCH's one piece per player per round, inside the 20 s format
// ======================================================================
REG('maker',root=>{const S=stage(root),q=CTL(root),I=idler(root);const PIECES=['block','gap','spike','platform','block','spike','gap','platform'];const names=FRIENDS.map(f=>f[0]),cols=FRIENDS.map(f=>f[3]),skill=[.9,.8,.7,.55,.45];
  let st=null,t=0,auto=0;const rng=RNG(99);
  const reset=()=>{st={round:0,pieces:[],score:[0,0,0,0,0],log:[],over:false,runs:null};};reset();
  function nextRound(){if(st.over)return;st.round++;const r=st.round;
    for(let p=0;p<5;p++){const kind=PIECES[(r*5+p)%PIECES.length];const x=200+((r*5+p)*331)%2500;st.pieces.push({kind,x,owner:p,diff:kind==='spike'?.35:kind==='gap'?.3:kind==='block'?.15:.1});}
    st.pieces.sort((a,b)=>a.x-b.x);
    // each player runs: a piece kills with chance diff * (1 - skill); traps score for the owner
    const runs=names.map((n,i)=>{for(const pc of st.pieces){if(pc.owner!==i&&rng()<pc.diff*(1-skill[i]))return {i,died:pc};}return {i,died:null};});
    const fin=runs.filter(r=>!r.died);const pts=[0,0,0,0,0],why=[];
    if(fin.length===0||fin.length===5){why.push(fin.length?'everyone reached the goal: no one scores':'nobody reached the goal: no one scores');}
    else{for(const r of fin){pts[r.i]+=1;why.push(`${names[r.i]} goal +1`);if(fin.length===1){pts[r.i]+=3;why.push(`${names[r.i]} solo +3`);}}}
    for(const r of runs)if(r.died){pts[r.died.owner]+=1;why.push(`${names[r.died.owner]}'s ${r.died.kind} trapped ${names[r.i]} +1`);}
    for(let i=0;i<5;i++)st.score[i]+=pts[i];st.runs=runs;st.log=why;st.anim=0;
    if(st.score.some(s=>s>=5)||st.round>=12)st.over=true;}
  q.btn('next',()=>{if(st.over)reset();nextRound();});
  return {tick(sec){t+=sec;auto+=sec;if(st.anim!=null)st.anim+=sec;if(I.idle&&auto>2.6){auto=0;if(st.over)reset();nextRound();}
    const c=S.c;S.begin();const sc=640/3200;
    T(c,`round ${st.round} of 12 · first to 5 points · ${st.pieces.length} pieces placed`,12,20,{s:13,w:600});
    // the level strip
    c.save();c.translate(0,40);c.scale(sc,sc);c.fillStyle=INK;c.fillRect(0,300,3200,60);
    for(const pc of st.pieces){c.fillStyle=cols[pc.owner];if(pc.kind==='block')c.fillRect(pc.x,240,60,60);else if(pc.kind==='platform')c.fillRect(pc.x,160,120,16);else if(pc.kind==='gap'){c.fillStyle=PAPER;c.fillRect(pc.x,300,110,60);}
      else{c.beginPath();for(let k=0;k<4;k++){c.moveTo(pc.x+k*20,300);c.lineTo(pc.x+k*20+10,262);c.lineTo(pc.x+k*20+20,300);}c.fill();}}
    c.fillStyle=INK;c.fillRect(3050,170,8,130);c.fillStyle=RED;c.beginPath();c.moveTo(3058,170);c.lineTo(3110,185);c.lineTo(3058,200);c.fill();
    if(st.runs){const k=CL(st.anim/1.6,0,1);st.runs.forEach((r,i)=>{const end=r.died?r.died.x:3040,x=LP(60,end,k),y=290-i*4;c.fillStyle=cols[i];c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.fill();if(r.died&&k>=1){T(c,'x',x,y-14,{s:40,col:cols[i],al:'center',w:700});}});}
    c.restore();
    // score table
    const y0=140;T(c,'player',20,y0,{s:11,col:MUTE});T(c,'points',150,y0,{s:11,col:MUTE});T(c,'skill (illustrative)',210,y0,{s:11,col:MUTE});
    names.forEach((n,i)=>{const y=y0+18+i*20;c.fillStyle=cols[i];c.fillRect(20,y-10,10,10);T(c,n,36,y,{s:12,w:600});bars(c,150,y-10,50,10,st.score[i]/5,cols[i]);T(c,st.score[i],206,y,{s:12,mono:1,al:'right'});T(c,`${Math.round(skill[i]*100)}%`,262,y,{s:11,col:MUTE,al:'right'});});
    T(c,'this round',340,y0,{s:11,col:MUTE});st.log.slice(0,9).forEach((l,i)=>T(c,l,340,y0+16+i*14,{s:11}));
    T(c,'UCH default preset: Goal 1, Solo 3, Postmortem 2, Trap 1, Coin 3, Comeback 4, 5 points over 12 rounds',12,262,{s:10,col:MUTE});T(c,'here only goal, solo and trap are simulated',12,274,{s:10,col:MUTE});
    const sec20=st.pieces.reduce((a,p)=>a+(p.kind==='gap'?.2:p.kind==='platform'?.3:.15),3200/420);T(c,`20-second format: the level now runs about ${sec20.toFixed(1)} s flat out`,12,290,{s:12,w:600,col:sec20>20?RED:INK});bars(c,12,296,300,8,sec20/20,sec20>20?RED:INK);dashLine(c,312,292,312,308,INK,[2,2]);T(c,'20 s',318,306,{s:10,col:MUTE});
    if(st.over){const win=st.score.indexOf(Math.max(...st.score));label(c,`${names[win]} wins with ${st.score[win]} points · next round starts a new table`,320,340,{s:13,al:'center',w:600,col:RED});}
    RO(root,`every round each of the five places one piece in their colour, then everyone runs; a piece is calibrated to the table because its author just played it, and every death has an author [V, S24, S146; I] · "if nobody reaches the goal, or everyone does, no one scores" [V, S24] · Mario Maker's 20 s minimum timer became the speedrun format, one idea per screen, a flag visible early, never stop [V, S175; I]`);
  }};});

// ======================================================================
// F1 restart: cost of failure over an attempt pile, countdown against instant
// ======================================================================
REG('restart',root=>{const S=stage(root),q=CTL(root);let t=0,lastKey='';let sim=null;
  function simulate(n,mean,sd){const rng=RNG(sd);const atts=[];for(let i=0;i<n;i++){const u=rng();const len=i===n-1?mean*1.4:Math.max(1.5,mean*(.3+1.4*u));atts.push(len);}return atts;}
  return {tick(sec){t+=sec;const n=q.v('n'),mean=q.v('mean'),budget=q.v('budget');const key=n+':'+mean;if(key!==lastKey){lastKey=key;sim=simulate(n,mean,7);t=0;}
    const lanes=[{name:'today: 0.38 s dead + 3 s countdown',cost:3.38},{name:'proposed: 0.38 s dead, skippable, no countdown',cost:.38}];
    const totalRun=sim.reduce((a,b)=>a+b,0);const total=[totalRun+lanes[0].cost*(n-1),totalRun+lanes[1].cost*(n-1)];const span=Math.max(...total);
    const reveal=CL(t/8,0,1)*span;const c=S.c;S.begin();
    lanes.forEach((L,li)=>{const y=40+li*120;T(c,L.name,12,y-8,{s:13,w:600});let x=0;const X=s=>12+616*s/span;
      for(let i=0;i<n&&x<reveal;i++){const len=sim[i];c.fillStyle=i===n-1?GREEN:INK;c.fillRect(X(x),y,Math.max(1,X(x+len)-X(x)-.5),34);x+=len;if(i<n-1){c.fillStyle=RED;c.fillRect(X(x),y,Math.max(.5,X(x+L.cost)-X(x)),34);x+=L.cost;}}
      const wasted=L.cost*(n-1);T(c,`${(total[li]/60).toFixed(1)} min for ${n} attempts, ${(wasted/60).toFixed(1)} min of it dead or counting down (${Math.round(wasted/total[li]*100)}%)`,12,y+52,{s:12,col:MUTE});
      const fit=Math.floor(budget*60/(mean+L.cost));T(c,`in a ${budget} min session: about ${fit} attempts at ${mean} s each`,12,y+70,{s:12,col:MUTE});});
    T(c,'black: play until the death · red: dead time and countdown · green: the clear',12,300,{s:11,col:MUTE});
    T(c,`at one death per 20 s, ${(3/23*100).toFixed(0)}% of a session is countdown; a map that takes 50 attempts spends ${(50*3/60).toFixed(1)} min on it [I]`,12,318,{s:11,col:MUTE});
    T(c,'run lengths are a seeded draw around the mean, not telemetry',12,336,{s:11,col:MUTE});
    RO(root,`${n} attempts, mean run ${mean} s before the death: today <b>${(total[0]/60).toFixed(1)} min</b>, proposed <b>${(total[1]/60).toFixed(1)} min</b>, the countdown costs <b>${((total[0]-total[1])/60).toFixed(1)} min</b> · McMillen: "the penalty is how much time it takes to start playing again" [V, S57] · Hollow Knight waits 2.85 s, the slow end of the canon [V, S13]`);
  }};});

// ======================================================================
// F2 ramp: the campaign ladder and the inside-level sawtooth
// ======================================================================
REG('ramp',root=>{const S=stage(root),q=CTL(root);let t=0;
  return {tick(sec){t+=sec;const prop=q.segv('v')==='prop',pos=q.v('pos'),p=q.v('p')/100;const c=S.c;S.begin();
    // left: campaign ladder by spike strips
    const maps=prop?[['m1',2,'Easy'],['m2',2,'Medium'],['m4',1,'Hard'],['m3',9,'Hard'],['Trial','?','Expert, on 3 of 4 golds']]:[['m1',2,'Easy'],['m2',2,'Medium'],['m3',9,'Hard'],['m4',1,'Hard'],['Trial','?','locked by finishing m4']];
    T(c,prop?'campaign ladder, proposed: 2, 2, 1, 9':'campaign ladder today: 2, 2, 9, 1 spike strips',12,20,{s:13,w:600});
    maps.forEach(([n,sp,d],i)=>{const x=20+i*52,h=sp==='?'?110:12+sp*10,y=170-h;c.fillStyle=sp==='?'?PALE:i===2&&!prop?RED:INK;c.fillRect(x,y,40,h);T(c,n,x+20,186,{s:11,al:'center',w:600});T(c,sp,x+20,y-4,{s:11,al:'center',col:MUTE});T(c,d.split(',')[0],x+20,198,{s:9,al:'center',col:MUTE});});
    const note=prop?['STAIRWAY teaches movers with one strip','before THE DUNGEON combines ceilings and climbs']:['map 3 is the shortest and most vertical','and has 9 strips: a spike, not a sawtooth'];T(c,note[0],12,222,{s:10,col:MUTE});T(c,note[1],12,235,{s:10,col:MUTE});
    c.fillStyle=LIGHT;c.fillRect(300,10,1,230);
    // right: inside one 20 s map, the hard part at pos% and the expected waste of a p failure
    const x0=320,x1=620,y0=40,yb=150;T(c,'inside a 20 s map: where the hard part sits',x0,20,{s:13,w:600});
    const prof=u=>{const sect=Math.floor(u*4);const base=.25+.1*sect;const bump=Math.exp(-Math.pow((u-pos/100)/.07,2));return base+.6*bump;};
    c.strokeStyle=INK;c.lineWidth=2;c.beginPath();for(let i=0;i<=120;i++){const u=i/120,x=x0+(x1-x0)*u,y=yb-prof(u)*100;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
    for(let s=1;s<4;s++){const x=x0+(x1-x0)*s/4;dashLine(c,x,y0,x,yb,LIGHT,[2,3]);T(c,'chime',x,yb+12,{s:9,col:MUTE,al:'center'});}
    const u=(t*.12)%1,rx=x0+(x1-x0)*u,ry=yb-prof(u)*100;c.fillStyle=RED;c.beginPath();c.arc(rx,ry,5,0,Math.PI*2);c.fill();
    const tp=pos/100*20,waste=[p*(tp+3.4),p*(tp+.5)];T(c,`a ${Math.round(p*100)}% failure at ${tp.toFixed(1)} s wastes per attempt:`,x0,yb+36,{s:11});
    T(c,`today (3.4 s restart) ${waste[0].toFixed(2)} s · proposed (0.5 s) ${waste[1].toFixed(2)} s`,x0,yb+52,{s:12,w:600,col:RED});
    T(c,`the same jump at the start: ${(p*3.4).toFixed(2)} s · at the end: ${(p*23.4).toFixed(2)} s`,x0,yb+68,{s:11,col:MUTE});
    T(c,'peak in section 2 or 3, a fast readable last section,',x0,yb+90,{s:10,col:MUTE});T(c,'a checkpoint chime at the end of every atom',x0,yb+103,{s:10,col:MUTE});
    RO(root,`N++ unlocks 20 episodes at a time and a stuck player steps sideways; Trackmania gates its tiers on medal counts [V, S63, S30] · in a full-restart map a 10% failure at the last jump of a 20 s map wastes about 2.3 s of expected run per attempt, the same jump at the start 0.3 s, so the hard part belongs early [V, S89; I] · "hard finish is cruel" is an inference, not a written rule [I]`);
  }};});

// ======================================================================
// F3 troll: a learned-once trap against an execution test
// ======================================================================
REG('troll',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),run=fixed();const rng=RNG(5);
  const mkA=()=>local.makeCourse({width:1900,solids:[[0,G,1900,400]],start:{x:100,y:G},finish:{x:1700},deathY:760});
  const mkB=()=>local.makeCourse({width:1900,solids:[[0,G,760,400],[940,G,46,400],[1240,G,660,400]],start:{x:100,y:G},finish:{x:1700},deathY:760});
  const lanes=[{name:'troll: a block drops from the ceiling the first time you pass',w:mkA(),att:0,deaths:0,best:null,learned:false,trap:null,hist:[]},{name:'honest expert: two one-tile jumps, an execution test every attempt',w:mkB(),att:0,deaths:0,best:null,hist:[]}];
  for(const L of lanes){L.R=mkRunner(L.w);L.att=1;}
  return {tick(sec){const pS=q.v('p')/100;
    run(sec*slow(q)*1.5,dt=>{aclock+=dt;for(const [i,L] of lanes.entries()){const R=L.R,P=R.P;const inp=local.bot(P,L.w,{lead:i?70:100});
      if(i===0){if(!L.trap&&P.x>700&&!L.learned){L.trap={y:G-260,vy:0};}if(L.trap){L.trap.vy+=2500*dt;L.trap.y+=L.trap.vy*dt;if(L.trap.y>G-40){L.trap.y=G-40;L.trap.vy=0;}
          if(!P.dead&&overlap(P.x,P.y,PW,PH,[760,L.trap.y,80,40])){P.dead=1;dustFor(R.parts,P,['die']);SFX(root,snd,'die');}}
        if(L.learned&&P.onGround&&P.x>640&&P.x<660){inp.jump=1;inp.jumpPressed=1;P.botHold=1;}if(P.vy>0)P.botHold=0;inp.jump=inp.jump||P.botHold;}
      else{if(P.onGround&&P.x>740-PW&&P.x<760&&!P.rolled){P.rolled=1;if(rng()>pS){P.failJump=1;}}if(P.failJump&&P.x>700&&!P.failed){P.failed=1;P.x=700;P.y=G-PH+10;P.vx=0;P.dead=1;dustFor(R.parts,P,['die']);SFX(root,snd,'die');}}
      const ev=R.step(inp,dt,{corner:8});for(const x of ev)if(x!=='die')SFX(root,snd,x);
      dustTick(R.parts,dt);if(P.dead)P.deadT=(P.deadT||0)+dt;
      if(R.done===1||(P.dead&&P.deadT>.5)){if(R.done===1){const tm=P.steps/120;L.best=L.best==null?tm:Math.min(L.best,tm);L.hist.push(tm);}else{L.deaths++;L.hist.push(null);if(i===0)L.learned=true;}
        L.hist=L.hist.slice(-16);L.att++;R.reset();if(i===0){L.trap=null;}}}});
    const c=S.c;S.begin();const sc=.36;
    lanes.forEach((L,i)=>{const y0=i*180;c.save();c.beginPath();c.rect(0,y0,640,180);c.clip();c.translate(0,y0);const R=L.R,P=R.P;const cam={x:CL(P.x-500,0,L.w.width-1777),y:G-380};
      H.drawSolids(c,L.w,cam,{t:aclock,vw:640});worldToScreen(c,cam,sc);
      if(i===0){c.fillStyle=INK;c.fillRect(760,L.trap?L.trap.y:G-260,80,40);if(L.learned)T(c,'learned: jump early',650,G-100,{s:22,col:MUTE,al:'center'});}
      else{T(c,'1 BL platform',963,G+40,{s:20,col:MUTE,al:'center'});T(c,'180 u',850,G+40,{s:20,col:MUTE,al:'center'});T(c,'254 u',1113,G+40,{s:20,col:MUTE,al:'center'});}
      dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();
      T(c,L.name,10,16,{s:12,w:600});T(c,`attempt ${L.att} · deaths ${L.deaths}${i===0?` · after the first: ${Math.max(0,L.deaths-1)}`:''} · record ${L.best==null?'none yet':L.best.toFixed(2)+' s'}`,10,32,{s:11,col:MUTE});
      L.hist.forEach((h,k)=>{c.fillStyle=h==null?RED:GREEN;c.fillRect(10+k*12,160,9,9);});c.restore();c.fillStyle=LIGHT;c.fillRect(0,y0+179,640,1);});
    RO(root,`the troll kills once and is a route memory item from attempt 2 on; the record is then just the flat run · the honest jump fails ${Math.round((1-pS)*100)}% of attempts (your slider), every attempt is a test and the record belongs to skill · Kayin says traps "need room to breathe", Defender1031 says a fair troll shows the correct action, and kaizo is "first and foremost fair" [V, S88, S89, S151]`);
  }};});

// ======================================================================
// shared recorder for H2 and H3: a bot run logged as one input byte per step
// ======================================================================
const packIn=inp=>(inp.dir<0?1:0)|(inp.dir>0?2:0)|(inp.jump?4:0)|(inp.jumpPressed?8:0);
const unpackIn=b=>({dir:(b&2?1:0)-(b&1?1:0),jump:!!(b&4),jumpPressed:!!(b&8)});
const stateOf=P=>P.dead?7:P.roll>0?5:P.flipOn?6:P.wasWall?4:!P.onGround?(P.vy<-120?1:P.vy<160?2:3):0;
function frame18(R){const P=R.P,v=heroVis(P),ps=R.rig.pose||local.targetPose(P,0),r1=x=>Math.round(x*10)/10,r2=x=>Math.round(x*100)/100;
  return [r1(P.x),r1(P.y),P.facing,r2(v.rot),v.pivot,r2(v.sx),r2(v.sy),r2(P.flap),r2(ps.hip),r2(ps.lean),r2(ps.th[0]),r2(ps.th[1]),r2(ps.sh[0]),r2(ps.sh[1]),r2(ps.ua[0]),r2(ps.ua[1]),r2(ps.la[0]),r2(ps.la[1])];}
function recCourse(){return local.makeCourse({width:8200,solids:[[0,G,900,400],[1050,G,700,400],[1300,G-60,140,60],[1440,G-120,140,120],[1750,G,900,400],[2200,G-50,64,50,'rock'],[2820,G,1400,400],[3300,G-100,60,100],[4400,G,1200,400],[4700,G-50,64,50,'rock'],[5780,G,2420,400],[6300,G-60,140,60],[6440,G-120,140,120],[6580,G-180,200,180]],
  checkpoints:[1700,3200,4900,6500],finish:{x:7800},start:{x:120,y:G},deathY:760});}
function recordRun(w,phys){const save=local.PHYS;if(phys)local.PHYS={...save,...phys};const R=mkRunner(w),log=[],f30=[];
  for(let i=0;i<120*90;i++){const inp=local.bot(R.P,w,{lead:100});const b=packIn(inp);log.push(b);R.step(unpackIn(b),DT,{corner:8});if(i%4===0)f30.push(frame18(R));if(R.done||R.P.dead)break;}
  local.PHYS=save;return {inputs:Uint8Array.from(log),f30,steps:R.P.steps,splits:R.splits.slice(),finished:R.done===1,x:R.P.x};}
// report §7 encodeInputs: (state, duration) pairs, duration as a varint
function pushPair(out,state,run){out.push(state);while(run>=128){out.push((run&127)|128);run=Math.floor(run/128);}out.push(run);}
function encodeInputs(log){const out=[];let cur=log[0],run=0;for(const b of log){if(b===cur&&run<0x3fff){run++;continue;}pushPair(out,cur,run);cur=b;run=1;}pushPair(out,cur,run);return new Uint8Array(out);}
function decodeInputs(buf){const out=[];for(let i=0;i<buf.length;){const st=buf[i++];let run=0,sh=1;for(;;){const b=buf[i++];run+=(b&127)*sh;if(b<128)break;sh*=128;}for(let k=0;k<run;k++)out.push(st);}return out;}
// report §7 deriveTrack: replay headless, sample every 120/hz steps
function deriveTrack(inputs,w,hz){const R=mkRunner(w),every=Math.round(120/hz),track=[];for(let s=0;s<inputs.length;s++){R.step(unpackIn(inputs[s]),DT,{corner:8});if(s%every===0)track.push(R.P.x,R.P.y,stateOf(R.P),Math.round(R.P.phase*40)&255);}return track;}
const zig=v=>v<0?-v*2-1:v*2,varintLen=v=>{v=zig(Math.round(v));let n=1;while(v>=128){v=Math.floor(v/128);n++;}return n;};
function deltaBytes(frames){let n=0,prev=null;for(const f of frames){const qf=f.map((v,i)=>i<2?v*10:i===2||i===4?v:v*100);for(let i=0;i<qf.length;i++)n+=varintLen(prev?qf[i]-prev[i]:qf[i]);prev=qf;}return n;}
async function deflateSize(bytes){if(!g.CompressionStream)return null;try{const cs=new CompressionStream('deflate-raw'),wr=cs.writable.getWriter();wr.write(bytes);wr.close();const rd=cs.readable.getReader();let n=0;for(;;){const {done,value}=await rd.read();if(done)break;n+=value.length;}return n;}catch(_){return null;}}
const enc=new TextEncoder();

// ======================================================================
// F5 telemetry: deaths by section and a funnel from five simulated testers
// ======================================================================
REG('telemetry',root=>{const S=stage(root),q=CTL(root);let night=null,seedN=1,t=0,shown=0;const skills=[.85,.7,.6,.45,.35];
  function simulate(sd,d3){const rng=RNG(sd);const diff=[.22,.3,d3,.26];const testers=FRIENDS.map((f,i)=>({name:f[0],col:f[3],skill:skills[i],attempts:[],cleared:null,quit:false}));const events=[];
    for(const tr of testers){for(let a=1;a<=60;a++){let died=null;for(let s=0;s<4;s++){const p=diff[s]*(1-tr.skill);if(rng()<p){died={s,u:rng()};break;}}
        tr.attempts.push(died);events.push({name:tr.name,col:tr.col,a,died});if(!died){tr.cleared=a;break;}
        if(a>=3&&tr.attempts.every(x=>x&&x.s<2)){tr.quit=true;events.push({name:tr.name,col:tr.col,a,quit:true});break;}}}
    return {testers,events,diff};}
  const regen=()=>{night=simulate(seedN,q.v('d3')/100);t=0;shown=0;};q.btn('new',()=>{seedN++;regen();});q.on('d3',regen);regen();
  return {tick(sec){t+=sec;shown=Math.min(night.events.length,Math.floor(t/.12));const ev=night.events.slice(0,shown);const c=S.c;S.begin();
    // map strip with smears
    const x0=20,x1=620,secW=(x1-x0)/4;T(c,`one tester night, ${shown} of ${night.events.length} events`,12,20,{s:13,w:600});
    c.fillStyle=INK;c.fillRect(x0,110,x1-x0,6);for(let s=0;s<=4;s++){c.fillStyle=INK;c.fillRect(x0+s*secW-1,96,2,20);if(s<4)T(c,`section ${s+1}`,x0+s*secW+secW/2,92,{s:11,col:MUTE,al:'center'});}
    const deaths=[0,0,0,0],clears=[];for(const e of ev){if(e.died){deaths[e.died.s]++;const x=x0+(e.died.s+e.died.u)*secW;c.strokeStyle=e.col;c.globalAlpha=.7;c.lineWidth=2;c.beginPath();c.moveTo(x-4,100);c.lineTo(x+4,108);c.moveTo(x+4,100);c.lineTo(x-4,108);c.stroke();c.globalAlpha=1;}else if(!e.quit)clears.push(e);}
    // heat bars per section
    const maxD=Math.max(1,...deaths);deaths.forEach((d,s)=>{bars(c,x0+s*secW+4,124,secW-8,10,d/maxD,RED);T(c,`${d} deaths`,x0+s*secW+secW/2,146,{s:11,al:'center',col:MUTE});});
    // funnel: attempts that reached each checkpoint
    const reach=[0,0,0,0,0];for(const e of ev){if(e.quit)continue;const upto=e.died?e.died.s:4;for(let s=0;s<=upto;s++)reach[s]++;}
    T(c,'funnel: attempts reaching each checkpoint',12,176,{s:12,w:600});['start','cp 1','cp 2','cp 3','finish'].forEach((n,i)=>{const w=reach[0]?reach[i]/reach[0]:0;bars(c,70,184+i*14,300,10,w,i===4?GREEN:INK);T(c,n,64,193+i*14,{s:10,al:'right',col:MUTE});T(c,reach[i],376,193+i*14,{s:10,mono:1,col:MUTE});});
    // per tester
    T(c,'attempts to first clear',400,176,{s:12,w:600});night.testers.forEach((tr,i)=>{const seen=ev.filter(e=>e.name===tr.name);const n=seen.length,done=seen.some(e=>!e.died&&!e.quit),quit=seen.some(e=>e.quit);
      c.fillStyle=tr.col;c.fillRect(400,186+i*14,8,8);T(c,`${tr.name} ${n}${done?' cleared':quit?' quit before cp 2':'...'}`,414,194+i*14,{s:11,col:quit?RED:done&&n>15?RED:INK});});
    // thresholds
    const sorted=deaths.slice().sort((a,b)=>a-b),others=(sorted[0]+sorted[1]+sorted[2])/3||1,wall=deaths.findIndex(d=>d>3*others&&d>=4);
    const flags=[];if(wall>=0)flags.push(`section ${wall+1} has ${deaths[wall]} deaths, over 3x the others: a wall`);night.testers.forEach(tr=>{if(tr.cleared>15)flags.push(`${tr.name} needed ${tr.cleared} attempts, over the 15 Easy threshold`);if(tr.quit)flags.push(`${tr.name} quit before checkpoint 2 after 3 starts`);});
    T(c,'flags for the design meeting (thresholds from F5):',12,286,{s:12,w:600});(flags.length?flags:['none yet']).slice(0,4).forEach((f,i)=>T(c,f,12,302+i*14,{s:11,col:flags.length?RED:MUTE}));
    RO(root,`post {map, section, x, cause, attempt} on death, about 20 bytes, and five people in one night give a heatmap [K; I] · thresholds: a section whose deaths exceed 3x the others, more than 15 attempts to a first clear on an Easy card, any tester quitting before checkpoint 2 after 3 starts [I] · the server today sees starts and finishes only [K] · skills and section difficulties are illustrative; "New night" draws another seed`);
  }};});

// ======================================================================
// G1 boards: friends first, around me, percentile; a season column over a permanent board
// ======================================================================
REG('boards',root=>{const S=stage(root),q=CTL(root);const rng=RNG(31);const syll=['ka','ri','to','mi','sa','yu','ha','ne','ko','shi','ra','mo','ta','ki','no'];
  const crowd=[];for(let i=0;i<80;i++){const n=(syll[Math.floor(rng()*15)]+syll[Math.floor(rng()*15)]+(rng()<.4?syll[Math.floor(rng()*15)]:'')).toUpperCase();const season=19000+Math.pow(rng(),1.6)*42000;crowd.push({name:n,season:Math.round(season),all:Math.round(season*(rng()<.4?.9+rng()*.1:1)),date:`2026-11-${String(1+Math.floor(rng()*13)).padStart(2,'0')}`,prevDelta:Math.round(rng()*1500)});}
  for(const f of FRIENDS)crowd.push({name:f[0],season:f[1],all:Math.round(f[1]*(f[0]==='HIRO'?.93:1)),date:f[2],friend:true,col:f[3],prevDelta:Math.round(200+rng()*900)});
  let t=0;return {tick(sec){t+=sec;const you=Math.round(q.v('you')*1000),view=q.segv('v')||'friends';const me={name:'YOU',season:you,all:Math.min(you,26900),date:'2026-11-13',me:true,prevDelta:0};
    const all=crowd.concat([me]).sort((a,b)=>a.season-b.season);all.forEach((r,i)=>r.rank=i+1);const myI=all.indexOf(me);
    let rows,title;if(view==='friends'){rows=all.filter(r=>r.friend||r.me);title=`friends (${rows.length}): a feed, not a ranking`;}else if(view==='around'){rows=all.slice(Math.max(0,myI-3),myI+4);title=`around me: ranks ${rows[0].rank} to ${rows[rows.length-1].rank} of ${all.length}`;}
    else if(view==='top'){rows=all.slice(0,7);title='global top 7, the page the game shows today';}else{rows=[all[0],all[Math.floor(all.length*.1)],all[Math.floor(all.length*.25)],all[Math.floor(all.length*.5)],me].sort((a,b)=>a.season-b.season);title=`percentile: you are in the top ${Math.ceil(myI/all.length*100)}% of ${all.length} (needs about 50 players to mean anything)`;}
    const c=S.c;S.begin();T(c,title,12,22,{s:13,w:600});
    const cols=[['#',36,'right'],['name',50,'left'],['season',210,'right'],['all-time',280,'right'],['date',296,'left'],['since previous',378,'left'],['next target',470,'left']];cols.forEach(([n,x,al])=>T(c,n,x,46,{s:10,col:MUTE,al}));c.fillStyle=LIGHT;c.fillRect(12,52,616,1);
    rows.forEach((r,i)=>{const y=70+i*26;if(r.me){c.fillStyle='#fdecea';c.fillRect(12,y-16,616,24);}if(r.friend){c.fillStyle=r.col;c.fillRect(40,y-10,6,10);}
      T(c,r.rank,36,y,{s:12,al:'right',mono:1});T(c,r.name,50,y,{s:12,w:r.me||r.friend?700:400,col:r.me?RED:INK});T(c,fmtT(r.season),210,y,{s:12,al:'right',mono:1});T(c,r.all<r.season?fmtT(r.all):'same',280,y,{s:12,al:'right',mono:1,col:r.all<r.season?GOLD:MUTE});
      T(c,r.date,296,y,{s:11,col:MUTE});T(c,r.prevDelta?`-${(r.prevDelta/1000).toFixed(2)} s`:'first entry',378,y,{s:11,col:MUTE});
      const idx=all.indexOf(r),above=idx>0?all[idx-1]:null;T(c,above?`${above.name} by ${((r.season-above.season)/1000).toFixed(3)} s`:'holds the record',470,y,{s:11,col:MUTE});});
    const medals=[[21200,'gold'],[24000,'silver'],[30000,'bronze']],next=medals.find(m=>you>m[0]);
    T(c,`next medal for you: ${next?next[1]+' at '+fmtT(next[0])+', '+((you-next[0])/1000).toFixed(2)+' s away':'gold already (Sandbox ladder, author 20 s)'}`,12,340,{s:11,col:MUTE});
    T(c,'season column resets with SEASON; the all-time column keeps the record; gold text marks an all-time better than this season',12,355,{s:10,col:MUTE});
    RO(root,`you are <b>${myI+1} of ${all.length}</b> globally and <b>${rows.filter(r=>r.friend||r.me).findIndex(r=>r.me)+1} of ${FRIENDS.length+1}</b> among friends · with five names the top-7 page never pages, so show the date, the delta since the previous holder and the next name above you instead of a rank [I] · Trackmania keeps a permanent per-map board under a 3-month season board; Steam gives every title a free friends-only read filter [V, S26, S31, S37]`);
  }};});

// ======================================================================
// G2 rivals: a pickable shadow in the owner's colours and the rival toast
// ======================================================================
REG('rivals',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),run=fixed();
  const w=local.makeCourse({width:5000,solids:[[0,G,5000,400],[900,G-50,64,50,'rock'],[1800,G-50,64,50,'rock'],[2600,G-120,140,120],[3400,G-50,64,50,'rock'],[4100,G-60,200,60]],finish:{x:4700},checkpoints:[1500,3000]});
  const rec=recordRun(w);const track=deriveTrack(rec.inputs,w,15);const trackT=rec.steps/120;
  const owners={mine:{name:'my best',hat:'#111',kim:RED,ms:trackT*1000*1.0},author:{name:'author',hat:'#111',kim:INK,ms:trackT*1000*.98},wr:{name:'WR',hat:GOLD,kim:GOLD,ms:trackT*1000*.86}};
  for(const f of FRIENDS)owners[f[0]]={name:f[0],hat:f[3],kim:f[3],ms:trackT*1000*(f[1]/26080)};
  const R=mkRunner(w);let pick='KAEDE',toast={t:0,on:false,who:'KAEDE',by:420},tt=0;q.seg('g',v=>{pick=v;});
  S.cv.addEventListener('click',e=>{const [x,y]=S.pos(e);if(toast.on&&x>400&&x<620&&y>300&&y<330){pick=toast.who;q.setSeg('g',pick);toast.on=false;SFX(root,snd,'check');}});
  const ghostAt=(o,tSec)=>{const u=tSec/(o.ms/1000)*trackT*15;const i=Math.floor(u),k=u-i,n=track.length/4;if(i>=n-1)return {x:track[(n-1)*4],y:track[(n-1)*4+1],st:0,ph:0,done:true};return {x:LP(track[i*4],track[i*4+4],k),y:LP(track[i*4+1],track[i*4+5],k),st:track[i*4+2],ph:track[i*4+3]};};
  return {tick(sec){tt+=sec;run(sec*slow(q),dt=>{aclock+=dt;const P=R.P;R.step(local.bot(P,w,{lead:100}),dt,{corner:8});dustTick(R.parts,dt);if(R.done){R.doneT=(R.doneT||0)+dt;if(R.doneT>1.4)R.reset();}
      toast.t+=dt;if(!toast.on&&toast.t>6){toast.on=true;toast.t=0;toast.who=FRIENDS[Math.floor(Math.random()*3)][0];toast.by=200+Math.floor(Math.random()*600);SFX(root,snd,'rival');}if(toast.on&&toast.t>5)toast.on=false;});
    const c=S.c;S.begin();const P=R.P,o=owners[pick]||owners.mine,el=P.t;const cam={x:CL(P.x+PW/2-970*.36+120,0,w.width-970),y:G-545*.8};
    H.drawSolids(c,w,cam,{t:aclock,cp:R.cp});worldToScreen(c,cam);
    const gh=ghostAt(o,el);const ahead=gh.x-P.x,fade=ahead>970?Math.max(.1,1-(ahead-970)/600):1;
    const gp={x:gh.x,y:gh.y,vx:400,vy:gh.st===1?-300:gh.st===3?400:0,onGround:gh.st===0,wallDir:0,land:0,roll:gh.st===5?.2:0,flipOn:gh.st===6,phase:gh.ph/40,dead:false};
    H.drawSamurai(c,local.targetPose(gp,aclock),gh.x+PW/2,gh.y+PH,1,{hat:o.hat,kim:o.kim,ink:'#6a6a6a',alpha:.375*fade,flap:-.4});T(c,o.name,gh.x+PW/2,gh.y-12,{s:13,col:o.kim===RED?GREY:o.kim,al:'center',w:600});
    dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();
    // pace line: where everyone was at this elapsed time
    T(c,'pace line at '+el.toFixed(2)+' s',12,22,{s:12,w:600});c.fillStyle=PALE;c.fillRect(12,30,616,8);const X=x=>12+616*CL(x/w.width,0,1);
    Object.values(owners).map(oo=>({oo,gx:ghostAt(oo,el).x})).sort((a,b)=>a.gx-b.gx).forEach(({oo,gx},li)=>{c.fillStyle=oo.kim===RED?GREY:oo.kim;c.fillRect(X(gx)-1,28,2,12);T(c,oo.name,X(gx),50+(li%4)*9,{s:8,col:MUTE,al:'center'});});c.fillStyle=RED;c.fillRect(X(P.x)-2,26,4,16);
    if(toast.on){c.fillStyle=INK;c.fillRect(300,292,330,46);T(c,`${toast.who} beat your ROCKY MOUNTAIN by ${(toast.by/1000).toFixed(2)} s`,312,310,{s:12,col:PAPER,w:600});c.fillStyle=PAPER;c.fillRect(400,314,160,18);T(c,'race their ghost',480,327,{s:11,al:'center',w:600});}
    RO(root,`racing <b>${o.name}</b> at ${fmtT(o.ms)} on this course (${o.name==='my best'?'your own track':'the same track replayed at their pace, illustrative'}) · the ghost wears its owner's hat and kimono colours at 37.5% alpha, the duel's value [K], and fades once it is more than a screen ahead [I] · Trackmania loads any record's ghost with one click; Mario Kart Wii unlocked characters for beating rival ghosts [V, S28, S158]`);
  }};});

// ======================================================================
// G4 share: a share card, a course code and the two-tier board
// ======================================================================
REG('share',root=>{const S=stage(root),q=CTL(root),I=idler(root);const w=recCourse();const rec=recordRun(w);const run={m:'m2',t:Math.round(rec.steps/120*1000),s:rec.splits.map(x=>Math.round(x/120*1000))};
  const b64u=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const code=b64u(JSON.stringify({v:1,...run}));
  const mapJson=JSON.stringify({solids:w.solids,checkpoints:w.checkpoints,finish:w.finish.x,deathY:w.deathY});let mapDeflated=null;deflateSize(enc.encode(mapJson)).then(n=>{mapDeflated=n;});
  const board=FRIENDS.map(f=>({name:f[0],ms:f[1],tier:'verified',how:f[0]==='YUI'?'friend tapped looks legit':'re-simulated'}));let mine=null,auto=0,t=0;
  const submit=()=>{mine={name:'YOU',ms:run.t,tier:'unverified',how:'ghost not uploaded yet'};};const legit=()=>{if(mine&&mine.tier==='unverified'){mine.tier='verified';mine.how='friend tapped looks legit';}};const resim=()=>{if(mine){mine.tier='verified';mine.how='re-simulated on the server';}};
  q.btn('submit',submit);q.btn('legit',legit);q.btn('resim',resim);
  return {tick(sec){t+=sec;auto+=sec;if(I.idle&&auto>3){auto=0;if(!mine)submit();else if(mine.tier==='unverified')legit();else mine=null;}
    const c=S.c;S.begin();
    // share card
    c.fillStyle='#f6f3ee';c.fillRect(12,12,300,250);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(12.5,12.5,299,249);T(c,'ROCKY MOUNTAIN',28,40,{s:16,w:700});T(c,fmtT(run.t),28,76,{s:30,w:700,mono:1});
    T(c,'splits '+run.s.map(x=>(x/1000).toFixed(2)).join(' / '),28,96,{s:11,col:MUTE,mono:1});const med=run.t<=21200?'gold':run.t<=24000?'silver':run.t<=30000?'bronze':'no medal';T(c,`${med} · 13 Nov 2026 · keyboard`,28,112,{s:11,col:MUTE});
    const ps={hip:22,lean:.1,th:[.3,-.2],sh:[.2,.3],ua:[1.6,-.4],la:[.4,.5]};H.drawSamurai(c,ps,250,150,1,{blade:-.4,grip:0,flap:-.2,sx:1.4,sy:1.4});
    const ver=mine&&mine.tier==='verified';c.fillStyle=ver?GREEN:MUTE;c.fillRect(28,124,ver?70:84,16);T(c,ver?'verified':'unverified',28+(ver?35:42),136,{s:10,col:PAPER,al:'center',w:700});
    T(c,'run code (base64url of {v, map, time, splits}):',28,170,{s:10,col:MUTE});c.font=`10px ${MONO}`;c.fillStyle=INK;for(let i=0;i<code.length;i+=34)c.fillText(code.slice(i,i+34),28,184+Math.floor(i/34)*12);
    T(c,`${code.length} characters · with the input log about ${kb(Math.round(encodeInputs(rec.inputs).length*4/3))} more`,28,250,{s:10,col:MUTE});
    // course code
    T(c,'course code',330,30,{s:13,w:600});T(c,`${w.solids.length} solids as [x, y, w, h] JSON: ${kb(mapJson.length)}`,330,48,{s:11,col:MUTE});T(c,mapDeflated!=null?`deflated (CompressionStream): ${kb(mapDeflated)} = ${Math.ceil(mapDeflated*4/3)} URL chars`:'deflating...',330,64,{s:11,col:MUTE});
    T(c,'a few hundred solids are a few KB and fit a URL hash after lz-string',330,80,{s:10,col:MUTE});
    // two-tier board
    T(c,'two-tier board',330,112,{s:13,w:600});const rows=board.concat(mine?[mine]:[]).sort((a,b)=>a.ms-b.ms);
    rows.forEach((r,i)=>{const y=134+i*22;if(r.name==='YOU'){c.fillStyle='#fdecea';c.fillRect(326,y-14,304,20);}T(c,i+1,340,y,{s:12,al:'right',mono:1});T(c,r.name,350,y,{s:12,w:r.name==='YOU'?700:400,col:r.name==='YOU'?RED:INK});T(c,fmtT(r.ms),460,y,{s:12,al:'right',mono:1,col:r.tier==='verified'?INK:MUTE});
      c.fillStyle=r.tier==='verified'?GREEN:LIGHT;c.fillRect(470,y-10,8,8);T(c,r.how,484,y,{s:10,col:MUTE});});
    if(!mine)T(c,'submit a run to see it slot in as unverified',350,134+rows.length*22+8,{s:11,col:MUTE});
    T(c,'green: verified by a server re-simulation or by a friend who',330,290,{s:10,col:MUTE});T(c,'watched the ghost · grey: unverified until then',330,302,{s:10,col:MUTE});T(c,'a level publishes only with its author\'s clear attached, so the',330,320,{s:10,col:MUTE});T(c,'clear becomes the author medal and the author ghost [V, S51; I]',330,332,{s:10,col:MUTE});
    RO(root,`a share is a URL: the run summary in the fragment (${code.length} characters here) and, with the H2 input log, the whole replay in about 1 KB [I] · at five players verification is social and one click: a row shows unverified until its ghost is uploaded and either re-simulated or tapped "looks legit" by another player [I] · Mario Maker: "prove that you can clear it" before upload [V, S51]`);
  }};});

// ======================================================================
// H2 ghostbytes: a live encoder for one recorded run
// ======================================================================
REG('ghostbytes',root=>{const S=stage(root),q=CTL(root),run=fixed();const w=recCourse();const rec=recordRun(w);const secs=rec.steps/120;
  const t0=performance.now();const rle=encodeInputs(rec.inputs);const tEnc=performance.now()-t0;
  const json30=JSON.stringify(rec.f30),delta30=deltaBytes(rec.f30);const tracks={};for(const hz of [10,15,30]){const t1=performance.now();const tr=deriveTrack(rec.inputs,w,hz);tracks[hz]={n:tr.length/4,bytes:tr.length/4*6,ms:performance.now()-t1};}
  const defl={};deflateSize(rec.inputs).then(n=>defl.raw=n);deflateSize(rle).then(n=>defl.rle=n);deflateSize(enc.encode(json30)).then(n=>defl.json=n);
  const R=mkRunner(w);let i=0;
  return {tick(sec){const hz=+(q.segv('hz')||15);run(sec*slow(q),dt=>{aclock+=dt;if(i<rec.inputs.length){R.step(unpackIn(rec.inputs[i++]),dt,{corner:8});dustTick(R.parts,dt);}else{R.doneT=(R.doneT||0)+dt;if(R.doneT>1.2){R.reset();i=0;R.doneT=0;}}});
    const c=S.c;S.begin();const P=R.P,el=i/120;c.save();c.beginPath();c.rect(0,0,640,150);c.clip();const cam={x:CL(P.x+PW/2-970*.36+120,0,w.width-970),y:G-545*.45};H.drawSolids(c,w,cam,{t:aclock,cp:R.cp});worldToScreen(c,cam);dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();
    T(c,`recording ${el.toFixed(2)} s of ${secs.toFixed(2)} s · step ${i} · input byte ${i?rec.inputs[i-1].toString(2).padStart(4,'0'):'0000'} (left, right, jump, pressed)`,12,20,{s:12,w:600,mono:1});c.restore();
    const f=el/secs,perMin=b=>b/secs*60;
    const rows=[['game today: 18 floats at 30 Hz as JSON',json30.length,defl.json,'no'],['30 Hz full pose, delta-quantised varints',delta30,null,'no'],[`${hz} Hz state track, 6 B per sample`,tracks[hz].bytes,null,'no'],['input log, 1 byte per step',rec.inputs.length,defl.raw,'yes'],['input log, run-length (state, varint duration)',rle.length,defl.rle,'yes']];
    const y0=170,x0=250,xw=300,lg=b=>Math.log10(Math.max(1,b));const lmax=lg(perMin(json30.length)*1.5);
    T(c,'bytes per minute of run, log scale (bars fill as the recording grows)',12,y0-8,{s:11,col:MUTE});
    rows.forEach((r,k)=>{const y=y0+22+k*30;T(c,r[0],12,y+12,{s:11});const b=perMin(r[1]);c.fillStyle=PALE;c.fillRect(x0,y,xw,16);c.fillStyle=r[3]==='yes'?GREEN:INK;c.fillRect(x0,y,xw*lg(b*Math.max(.02,f))/lmax,16);
      T(c,`${kb(Math.round(b))}/min${r[2]!=null?' · deflated '+kb(Math.round(perMin(r[2]))):''}`,x0+xw+8,y+12,{s:9,mono:1});T(c,r[3]==='yes'?'re-simulable':'',x0+xw-4,y+12,{s:9,col:PAPER,w:600,al:'right'});});
    [[143*1024,'Sandbox 143 KB',0],[35.4*1024,'35.4 KB',0],[7.6*1024,'7.6 KB',1],[2.6*1024,'2.6 KB',0],[100*1024,'game 100 KB',1]].forEach(([b,l,row])=>{const x=x0+xw*lg(b)/lmax;dashLine(c,x,y0+14,x,y0+172,LIGHT,[2,3]);T(c,l,x,y0+2+row*10,{s:8,col:MUTE,al:'center'});});
    T(c,`measured here: RLE encode ${tEnc.toFixed(2)} ms · 15 Hz track derived by headless replay in ${tracks[15].ms.toFixed(1)} ms · ${tracks[hz].n} samples at ${hz} Hz`,12,355,{s:10,col:MUTE});
    RO(root,`this ${secs.toFixed(1)} s run: inputs <b>${rec.inputs.length} B</b> raw, <b>${rle.length} B</b> run-length${defl.rle!=null?', '+defl.rle+' B deflated':''} · 30 Hz 18-float JSON <b>${kb(json30.length)}</b>${defl.json!=null?' ('+kb(defl.json)+' deflated)':''}, delta-quantised ${kb(delta30)} · ${hz} Hz track ${kb(tracks[hz].bytes)} · the input log is the canonical ghost and the track is derived from it by replaying the same step() [I]`);
  }};});

// ======================================================================
// H3 validate: the plausibility ladder and server re-simulation under tampering
// ======================================================================
REG('validate',root=>{const S=stage(root),q=CTL(root),I=idler(root);const w=recCourse();const PH_=local.PHYS;const honest=recordRun(w);
  const hashMap=m=>fnv(JSON.stringify([m.solids,m.checkpoints,m.finish,m.deathY])),hashPhys=p=>fnv(JSON.stringify(p));
  w.minSplitSteps=[w.checkpoints[0]-w.start.x,...w.checkpoints.slice(1).map((x,i)=>x-w.checkpoints[i])].map(d=>Math.floor(d/PH_.maxRun*120));
  // report §7 plausible(), literal
  function plausible(sub,map,startedAt,now){const out={reasons:[]};const minSteps=Math.floor((map.finish.x-map.start.x)/PH_.maxRun*120);   // the report divides map.width; see REPORT-ISSUES
    if(sub.steps<minSteps){out.reasons.push(`steps ${sub.steps} < minSteps ${minSteps}: faster than running flat out`);return {ok:false,...out};}
    if(sub.splits.some((s,i)=>i&&s<=sub.splits[i-1])){out.reasons.push('splits not monotonic');return {ok:false,...out};}
    if(sub.splits.some((s,i)=>s<map.minSplitSteps[i])){out.reasons.push('a split under its per-map minimum');return {ok:false,...out};}
    const wall=(now-startedAt)/1000,sim=sub.steps/120;if(wall<sim-2){out.reasons.push(`submitted ${wall.toFixed(1)} s after start for a ${sim.toFixed(1)} s run`);return {ok:false,...out};}
    out.slowFlag=wall/sim>1.05;out.reasons.push(`wall ${wall.toFixed(1)} s over sim ${sim.toFixed(1)} s = ${(wall/sim).toFixed(2)}${out.slowFlag?' (over 1.05, review flag)':''}`);return {ok:true,...out};}
  // report §7 validateRun(), literal (stepWith = the same step with a decoded byte)
  function validateRun(sub){if(hashMap(w)!==sub.mapHash||hashPhys(PH_)!==sub.physHash)return 'STALE';const R=mkRunner(w),inputs=decodeInputs(sub.inputs);
    for(let s=0;s<inputs.length&&!R.done;s++)R.step(unpackIn(inputs[s]),DT,{corner:8});if(R.done!==1)return 'NO_FINISH';if(R.P.steps!==sub.steps)return 'STEP_MISMATCH';
    for(let i=0;i<4;i++)if(R.splits[i]!==sub.splits[i])return 'SPLIT_MISMATCH';return 'OK';}
  const mkSub=(r,o={})=>({steps:r.steps,splits:r.splits.slice(),inputs:encodeInputs(r.inputs),mapHash:hashMap(w),physHash:o.physHash||hashPhys(PH_),runId:'r7f3',wallSecs:o.wall==null?r.steps/120*1.02+.4:o.wall});
  const CASES={honest:()=>mkSub(honest),time:()=>{const s=mkSub(honest);s.steps-=60;return s;},maxrun:()=>mkSub(recordRun(w,{maxRun:2000})),jumpvel:()=>mkSub(recordRun(w,{jumpVel:1000})),splits:()=>{const s=mkSub(honest);[s.splits[1],s.splits[2]]=[s.splits[2],s.splits[1]];return s;},early:()=>mkSub(honest,{wall:honest.steps/120-5}),stale:()=>mkSub(honest,{physHash:'deadbeef'})};
  const NAMES={honest:'honest submit',time:'finish time edited 0.5 s faster (60 steps)',maxrun:'client ran with maxRun = 2000 (devtools)',jumpvel:'client ran with jumpVel = 1000 (devtools, same pace)',splits:'splits 2 and 3 swapped',early:'submitted 5 s before the run could end',stale:'recorded on older physics (physHash)'};
  let sub=null,res=null,caseK='honest',t=0,auto=0;const order=Object.keys(CASES);
  function runCase(k){caseK=k;auto=0;sub=CASES[k]();const t0=performance.now();const pl=plausible(sub,w,0,sub.wallSecs*1000);let v=null,ms=0;if(pl.ok){const t1=performance.now();v=validateRun(sub);ms=performance.now()-t1;}res={pl,v,ms,total:performance.now()-t0};t=0;}
  for(const k of order)q.btn(k,()=>runCase(k));runCase('honest');
  return {tick(sec){t+=sec;auto+=sec;if(I.idle&&auto>4.5){runCase(order[(order.indexOf(caseK)+1)%order.length]);}
    const c=S.c;S.begin();T(c,`submission: ${NAMES[caseK]}`,12,22,{s:13,w:600});
    T(c,`{steps ${sub.steps}, splits ${sub.splits.join('/')}, inputs ${sub.inputs.length} B, mapHash ${sub.mapHash}, physHash ${sub.physHash}, runId ${sub.runId}}`,12,40,{s:10,mono:1,col:MUTE});
    const rungs=[['1 run id issued at start, quoted at submit',sub.runId==='r7f3'?'OK':'FAIL'],['2 server bounds: min steps, monotonic splits, per-split minimum, wall-clock window',res.pl.ok?'OK':'FAIL'],['3 window.__sr stripped from production','build flag'],['4 device token HMACed into a session','OK'],['5 rate limit per token and IP','OK'],
      ['6 input replay re-simulated with the same step()',res.v==null?'skipped':res.v==='OK'?'OK':res.v],['7 slowdown ratio over 1.05 flagged for review',res.pl.ok?(res.pl.slowFlag?'review':'OK'):'skipped'],['8 input statistics, a review flag, never an auto-ban','review only']];
    const shown=Math.min(rungs.length,Math.floor(t/.35)+1);
    rungs.slice(0,shown).forEach((r,i)=>{const y=70+i*28;const bad=r[1]!=='OK'&&!['build flag','review only','review','skipped'].includes(r[1]);c.fillStyle=bad?RED:r[1]==='OK'?GREEN:LIGHT;c.fillRect(12,y-12,10,16);T(c,r[0],30,y,{s:12});T(c,r[1],628,y,{s:12,al:'right',mono:1,w:600,col:bad?RED:r[1]==='OK'?GREEN:MUTE});
      if(i===1&&res.pl.reasons.length)T(c,res.pl.reasons[res.pl.reasons.length-1],30,y+12,{s:10,col:res.pl.ok?MUTE:RED});});
    if(shown>=6)T(c,res.v==null?'the replay never runs on a submission the bounds rejected':`${decodeInputs(sub.inputs).length} inputs re-simulated in ${res.ms.toFixed(2)} ms: ${res.v}`,30,70+5*28+12,{s:10,col:res.v==='OK'?MUTE:RED});
    T(c,'cost from 6e: rungs 1 to 5 about a day, rung 6 one to two days plus the determinism work, and it also gives free ghosts and share links [I]',12,330,{s:10,col:MUTE});
    T(c,'hashes are FNV-1a stand-ins for sha256().slice() · minSteps uses finish minus start, not map.width · minSplitSteps is distance / maxRun x 120',12,345,{s:10,col:MUTE});
    RO(root,`result: <b>${res.pl.ok?(res.v||'...'):'rejected by the bounds'}</b> · the steps 1 to 5 filters are cheap and only the replay catches a client whose physics were edited, because its inputs no longer reach the flag under the server's step() [K; I] · the Sandbox re-simulated 2,240 inputs in about 6.5 ms [V, S3] · cases cycle every 4 s when idle`);
  }};});

// ======================================================================
// H5 plumbing: polling, WebSocket and WebRTC for a live ghost
// ======================================================================
REG('plumbing',root=>{const S=stage(root),q=CTL(root),run=fixed();const w=recCourse();const rec=recordRun(w);const track=deriveTrack(rec.inputs,w,60);const n=track.length/4;
  const R=mkRunner(w);let i=0,pkts=[],recv=[],acc=0,sent=0,bytes=0,tt=0,invoc=0,stat={lag:0};
  const sample=t=>{const u=CL(t*60,0,n-1),k=Math.floor(u),f=u-k;return {x:LP(track[k*4],track[Math.min(n-1,k+1)*4],f),y:LP(track[k*4+1],track[Math.min(n-1,k+1)*4+1],f),st:track[k*4+2]};};
  return {tick(sec){const tr=q.segv('tr')||'ws',rate=q.v('rate'),lat=q.v('lat')/1000,buf=q.v('buf');const over=tr==='poll'?300:tr==='ws'?6:20,pay=10;
    run(sec*slow(q),dt=>{aclock+=dt;tt+=dt;if(i<rec.inputs.length){R.step(unpackIn(rec.inputs[i++]),dt,{corner:8});dustTick(R.parts,dt);}else{R.reset();i=0;pkts=[];recv=[];}
      acc+=dt;const per=1/rate;while(acc>=per){acc-=per;const jitter=(Math.random()-.5)*lat*.4;const s=sample(tt);pkts.push({t0:tt,arrive:tt+lat*(tr==='poll'?2:1)+jitter,x:s.x,y:s.y,st:s.st,stamp:tt});sent++;bytes+=pay+over;if(tr==='poll'){invoc++;bytes+=over;}}
      for(let k=pkts.length-1;k>=0;k--)if(pkts[k].arrive<=tt){recv.push(pkts[k]);pkts.splice(k,1);}recv.sort((a,b)=>a.stamp-b.stamp);if(recv.length>60)recv.splice(0,recv.length-60);});
    // the remote ghost: raw latest packet, or interpolated 100 ms behind the newest arrival
    let gpos=null;if(recv.length){if(!buf)gpos=recv[recv.length-1];else{const target=tt-lat-.1;let a=null,b=null;for(const p of recv){if(p.stamp<=target)a=p;else{b=p;break;}}if(a&&b){const k=(target-a.stamp)/(b.stamp-a.stamp||1);gpos={x:LP(a.x,b.x,k),y:LP(a.y,b.y,k),st:a.st};}else gpos=a||recv[0];}}
    const c=S.c;S.begin();const P=R.P;
    // wire diagram
    T(c,'me',60,30,{s:12,w:700,al:'center'});T(c,tr==='rtc'?'friend (peer)':tr==='ws'?'friend via a relay':'friend via a function',580,30,{s:12,w:700,al:'center'});c.fillStyle=INK;c.fillRect(30,36,60,40);c.fillRect(550,36,60,40);c.fillStyle=PAPER;c.fillRect(34,40,52,32);c.fillRect(554,40,52,32);
    if(tr!=='rtc'){c.fillStyle=PALE;c.fillRect(300,34,40,44);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(300.5,34.5,40,44);T(c,tr==='ws'?'relay':'/api',320,60,{s:9,al:'center',col:MUTE});}
    c.strokeStyle=LIGHT;c.lineWidth=2;c.beginPath();c.moveTo(90,56);c.lineTo(550,56);c.stroke();
    for(const p of pkts){const k=CL((tt-p.t0)/(p.arrive-p.t0),0,1);const x=90+460*k;c.fillStyle=INK;c.beginPath();c.arc(x,56-6,3,0,Math.PI*2);c.fill();if(tr==='poll'){c.fillStyle=GREY;c.beginPath();c.arc(90+460*(1-k),56+6,3,0,Math.PI*2);c.fill();}}
    T(c,`${rate} Hz · ${pay} B payload + ${over} B framing${tr==='poll'?' each way':''} · latency ${Math.round(lat*1000)} ms${tr==='poll'?' x2 (request and response)':''}`,320,96,{s:11,al:'center',col:MUTE});
    const Bs=rate*(pay+over*(tr==='poll'?2:1));T(c,`${Math.round(Bs)} B/s per racer · a 60 s race moves ${kb(Math.round(Bs*60))} each way`,320,110,{s:11,al:'center',w:600});T(c,tr==='poll'?`${rate*60} function invocations per racer per minute`:tr==='ws'?`Durable Objects bill ${rate*60} incoming messages a minute as ${Math.ceil(rate*60/20)} requests`:'10 to 20% of home NAT pairs need a paid TURN relay',320,124,{s:10,al:'center',col:MUTE});
    // course strip
    c.save();c.beginPath();c.rect(0,130,640,200);c.clip();c.translate(0,130);const cam={x:CL(P.x+PW/2-970*.36+120,0,w.width-970),y:G-545*.5};H.drawSolids(c,w,cam,{t:aclock});worldToScreen(c,cam);
    if(gpos){const gp={vx:400,vy:gpos.st===1?-300:gpos.st===3?400:0,onGround:gpos.st===0,wallDir:0,land:0,roll:0,flipOn:0,phase:tt*11,dead:false};H.drawSamurai(c,local.targetPose(gp,aclock),gpos.x+PW/2,gpos.y+PH,1,{hat:FRIENDS[0][3],kim:FRIENDS[0][3],ink:'#6a6a6a',alpha:.5,flap:-.4});T(c,buf?'friend, 100 ms buffer':'friend, raw packets',gpos.x+PW/2,gpos.y-12,{s:13,col:FRIENDS[0][3],al:'center'});}
    dustDraw(c,R.parts);drawHero(c,P,R.rig);c.restore();c.restore();
    T(c,`packets sent ${sent} · ${kb(bytes)} so far · payload {step u32, x i16, y i16, state u8, phase u8} = 10 B`,12,345,{s:10,col:MUTE});
    RO(root,`${tr==='poll'?'polling a Vercel function at '+rate+' Hz is '+rate*60+' invocations per racer per minute; 1 Hz with input deltas is acceptable only for a ghost a second behind [I]':tr==='ws'?'WebSocket push: Cloudflare\'s free Durable Objects tier bills incoming messages 20:1 and covers about 3,000 two-player races a day; Vercel serves WebSockets in public beta, pinned to one instance [V, vendor, S41, S40; I]':'WebRTC data channel: free peer to peer, but 10 to 20% of home NAT pairs need a paid TURN relay [V, S114; I]'} · nothing interacts, so ${Math.round(lat*1000)} ms of latency is invisible behind a 100 ms interpolation buffer; untick the buffer to watch the shadow snap [I]`);
  }};});
})();
