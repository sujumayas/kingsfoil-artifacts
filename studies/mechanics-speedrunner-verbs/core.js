"use strict";
// ======================================================================
// core (mechanics-speedrunner, Mechanics #1; from feel-loot-pickup): generic helpers, a cost meter,
// gesture-gated audio, the demo runner and page chrome, plus the shared SR helpers: a faithful port of
// SpeedRunner's movement and collision with every forgiveness feature switchable, the stick samurai rig,
// courses, camera modes, dust, synth sounds and ink text. Shared by demos1.js, demos2.js and demos3.js.
// Figures are VECTOR: Canvas2D paths on paper, no bitmap font (use SR.text), canvases 640x360 or 640x200.
//
// ---------------------------------------------------------------------
// SR API (stable; agent F uses it in demos2.js, do not rename)
// ---------------------------------------------------------------------
//   SR.PHYS, SR.TUNING   the game's constants [K] and the §7 TUNING knobs [I]; SR.W 20, SR.H 46, SR.BL 46,
//                        SR.DT 1/120, SR.G 600 (ground top), SR.VW 970, SR.VH 545 (world units in view)
//   SR.ink               colours: paper, paper2, ink, red, grey, grey2, grey3, ghost, green, gold, blue; SR.ls LiveSplit deltas
//   SR.newPlayer(x, feetY) -> P        a player state standing with its feet at feetY
//   SR.step(P, keys, dt, o) -> events  one physics step. keys {left, right, jump, jumpPressed}. o:
//        world: a course {solids, movers, spikes, width, deathY, finish, checkpoints}, time: level clock seconds,
//        phys: override of SR.PHYS, tuning: a TUNING object (cornerCorrect, wallReach, wallRetain, slideRampTime,
//        hyperMult, hyperWindow, jumpHBoost, liftCapX, liftCapY), feature flags default ON unless false:
//        coyote, buffer, jumpCut, apex, fallMult, wallStick, wallJump, wallCoyote, samePenalty, roll;
//        feature flags default OFF unless true: slideRamp, hyper, liftBoost. Returns P.ev, a list of
//        {t:'jump'|'hyper'|'wall'|'climb'|'land'|'touch'|'roll'|'bonk'|'corner'|'retain'|'die'|'finish'|'check'|'dust', ...}
//   SR.solidAt(world, x, y, w, h, land) -> solid or null (one-way tiles need land {vy, feet})
//   SR.moverAt(mv, t) -> [x, y, w, h] on the level clock (sin table, no Math.sin in the sim)
//   SR.makeCourse(seedOrSpec) -> course;  SR.course(name) -> a named course: hero, flat, gap, chimney, drop, lips, wall
//   SR.newCam(x, y), SR.cam(cam, P, o, dt)   modes 'lock' (today), 'lerp', 'snap'; o: VW, VH, width, top, floorView,
//        deathY, killClamp, lookAhead (120), speedFocus, fallLook, deadZone (60), snap
//   SR.paper(ctx, W, H), SR.view(ctx, cam, scale, ox, oy)   fill the paper, set the world transform
//   SR.drawSolids(ctx, course, cam, o)   blocks, one-way tiles, movers, wheels, spikes, flag, checkpoints, start line
//   SR.drawSamurai(ctx, pose, x, y, facing, o)   feet at (x, y); o {hat, kim, flap, grip, lw, alpha, sx, sy, clock, ghost}
//   SR.targetPose(P, t), SR.idlePose(t), SR.newPose(), SR.blend(pose, target, k) -> pose
//   SR.dust(parts, x, y, n, dx, dy, spread), SR.updParts(parts, dt), SR.drawParts(ctx, parts), SR.spawnDust(parts, ev)
//   SR.bot(P, world, st) -> keys   a simple autopilot: runs right, jumps gaps and walls, wall-jumps chimneys
//   SR.sfx(name, o)      jump, wall, land, roll, beep, go, die, check, finish, slash, sheath, step; o.jitter 0.04
//   SR.text(ctx, s, x, y, o)   o {size, col, align, base, weight, mono}; SR.plate(ctx, s, x, y, o) text on a paper plate
//   SR.dim(ctx, x0, y0, x1, y1, label, o)  a dimension line;  SR.band(ctx, x, y, w, h, col)  a tinted window band
//   SR.fmtT(ms), SR.fmtD(ms)   "12.34" and "+0.12" / "-0.08"
// GENERIC (same names as the other studies)
//   $ $$ rnd mkRng clamp lerp sat smooth hash2 svgEl svgText poly cellOf pointer ctl setHud meter fms reg slowF
//   mkCanvas ease easeIO hexMix;  AUD.enable() inside a click, AUD.on, AUD.blip(freq, ms, vol, type)
// ======================================================================
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let rs=20261113;
const rnd=()=>{rs^=rs<<13;rs^=rs>>>17;rs^=rs<<5;return (rs>>>0)/4294967296;};
const mkRng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const sat=v=>v<0?0:v>1?1:v;
const smooth=(a,b,x)=>{const t=sat((x-a)/(b-a));return t*t*(3-2*t);};
const hash2=(x,y)=>{let h=Math.imul(x*374761393+y*668265263,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const ease=k=>{k=sat(k);return k*k*(3-2*k);};
const easeIO=k=>{k=sat(k);return k<.5?2*k*k:1-2*(1-k)*(1-k);};
function hexMix(a,b,t){const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,parent){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svgText(parent,x,y,txt,attrs={}){const t=svgEl('text',{x,y,...attrs},parent);t.textContent=txt;return t;}
function poly(svg,pts,attrs){return svgEl('polyline',{points:pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '),fill:'none',...attrs},svg);}
function cellOf(cv,e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height];}
function pointer(cv,fn){let down=false;cv.addEventListener('pointerdown',e=>{down=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}fn(cellOf(cv,e),'down',e);});
  cv.addEventListener('pointermove',e=>{fn(cellOf(cv,e),down?'drag':'move',e);});
  const up=e=>{if(down){down=false;fn(cellOf(cv,e),'up',e);}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',e=>{if(!down)fn(cellOf(cv,e),'leave',e);});}
function ctl(root){const g=k=>root.querySelector(`[data-k="${k}"]`);
  return {el:g,v:k=>{const e=g(k);return e.type==='checkbox'?e.checked:+e.value;},
    set:(k,v)=>{const e=g(k);if(!e)return;if(e.type==='checkbox')e.checked=!!v;else e.value=v;},
    on:(k,fn)=>{const e=g(k);if(!e)return;e.addEventListener('input',fn);e.addEventListener('change',fn);},
    out:(k,t)=>{const o=root.querySelector(`[data-o="${k}"]`);if(o)o.textContent=t;},
    btn:(k,fn)=>{const e=root.querySelector(`[data-b="${k}"]`);if(e)e.addEventListener('click',()=>fn(e));return e;},
    seg:(k,fn)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(!s)return;s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',s).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);});},
    segv:k=>{const b=root.querySelector(`[data-seg="${k}"] button.on`);return b?b.dataset.v:null;},
    setSeg:(k,v)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(s)$$('button',s).forEach(x=>x.classList.toggle('on',x.dataset.v===String(v)));}};}
function setHud(root,t,k){const h=root.querySelector(k?`[data-hud="${k}"]`:'[data-hud]');if(h)h.textContent=t;}
function meter(k=.08){let s=-1,t=0;return {t0(){t=performance.now();},t1(){const d=performance.now()-t;s=s<0?d:s+(d-s)*k;return s;},get v(){return Math.max(0,s);}};}
const fms=v=>v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);
function slowF(root){const e=root.querySelector('[data-k="slow"]');return e&&e.checked?.25:1;}

// ======================================================================
// audio: silent until AUD.enable() runs inside a user gesture
// ======================================================================
const AUD={ctx:null,on:false,enable(){try{if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();this.on=true;}catch(_){this.on=false;}return this.on;},
  disable(){this.on=false;},
  blip(f=440,ms=40,vol=.05,type='square'){if(!this.on||!this.ctx)return;const a=this.ctx,t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+ms/1000);o.connect(g).connect(a.destination);o.start(t);o.stop(t+ms/1000+.02);}};

// ======================================================================
// SR: SpeedRunner shared helpers (ported from the served bundle of 13 Nov 2026, simplified)
// ======================================================================
const SR=(()=>{
const PHYS={maxRun:420,groundAccel:2700,turnAccel:5200,groundFric:3000,overspeedDecay:500,airAccel:1900,airDrag:160,
  gravity:2500,fallMult:1.65,apexMult:.55,apexBand:90,maxFall:1150,jumpVel:830,jumpCut:.45,coyote:.10,buffer:.13,
  wallSlideMax:115,wallStick:.10,wallCoyote:.08,wallJumpX:440,wallJumpY:790,wallJumpSameY:330,wallLock:.15,wallClimbX:190,wallClimbLock:.07,
  rollFall:230,rollTime:.42,rollMinSpeed:280,flipTime:.46,flipMinSpeed:250};
const TUNING={cornerCorrect:8,wallReach:7,wallRetain:.06,ceilingGrace:.05,slideRamp:false,slideRampTime:.8,hyperMult:1.3,hyperWindow:.10,
  jumpHBoost:40,liftCapX:250,liftCapY:130,springMult:1.45,blockTick:.5,preShake:.3,patrolSpeed:85,chaserMult:.85,chaserDelay:1.5,
  slashMs:100,slashW:50,slashH:40,startOnInput:true,deathBeat:.38,ghostHz:15,medals:[1.06,1.2,1.5]};
const W=20,H=46,BL=46,DT=1/120,G=600,VW=970,VH=545;
const ink={paper:'#ffffff',paper2:'#f7f4ef',ink:'#0a0a0a',red:'#d0281f',grey:'#9a9a9a',grey2:'#d4d4d4',grey3:'#ededed',ghost:'rgba(10,10,10,.28)',green:'#1f8a3a',gold:'#c9971c',blue:'#2458c9'};
// livesplit-core defaults [V, S16]: gold, ahead gaining, ahead losing, behind gaining, behind losing, PB blue
const ls={gold:'rgb(255,213,0)',aheadG:'rgb(0,204,54)',aheadL:'rgb(97,209,127)',behindG:'rgb(209,97,97)',behindL:'rgb(204,0,0)',pb:'rgb(20,165,255)'};
const SANS='"IBM Plex Sans",system-ui,sans-serif',MONO='"IBM Plex Mono",ui-monospace,Menlo,monospace';
// ---------------------------------------------------------------- state
function newPlayer(x,feetY){return {x,y:feetY-H,px:x,py:feetY-H,vx:0,vy:0,onGround:false,coyote:0,buffer:0,wallDir:0,wallMem:0,wallMemT:0,wallLock:0,wallStickT:0,wasWall:false,
  lastWJ:0,jumpCut:false,fromGround:false,holdT:0,facing:1,airT:0,peak:feetY,flip:0,flipOn:false,flipPending:false,flipDir:1,roll:0,land:0,stretch:0,phase:0,dustT:0,
  flap:0,flapV:0,grip:1,dead:false,finished:false,cp:0,support:null,carryVx:0,carryVy:0,slideT:0,retainVx:0,retainT:0,hyper:false,ev:[]};}
// ---------------------------------------------------------------- collision
const EPS=1e-4;
const overlap=(ax,ay,aw,ah,b)=>ax<b[0]+b[2]-EPS&&ax+aw>b[0]+EPS&&ay<b[1]+b[3]-EPS&&ay+ah>b[1]+EPS;
const isTile=s=>s[4]==='tile'||!!s.mv;
const tileRise=s=>s.mv&&s.mv.prev?Math.max(0,s.mv.prev[1]-s[1]):0;
function solidAt(w,x,y,bw,bh,land){const hit=s=>!isTile(s)||(land&&land.vy>0&&land.feet<=s[1]+3+tileRise(s));
  for(const s of w.solids)if(overlap(x,y,bw,bh,s)&&hit(s))return s;
  if(w.movers)for(const mv of w.movers)if(mv.cur&&overlap(x,y,bw,bh,mv.cur)&&hit(mv.cur))return mv.cur;return null;}
// a 4096-entry sine table built with Math.fround: the sim never calls Math.sin (§7, H3)
const SINT=new Float32Array(4097);for(let i=0;i<=4096;i++)SINT[i]=Math.fround(Math.sin(i/4096*2*Math.PI));
const sinT=ph=>{ph=((ph%1)+1)%1;return SINT[Math.round(ph*4096)];};
function moverAt(mv,t){const ph=(t/mv.period)+(mv.phase||0);
  if(mv.wheel)return [mv.cx+mv.r*sinT(ph+.25)-mv.w/2,mv.cy+mv.r*sinT(ph)-(mv.h||18)/2,mv.w,mv.h||18];
  const s=.5-.5*sinT(ph+.25);return [mv.x0+(mv.x1-mv.x0)*s,mv.y0+(mv.y1-mv.y0)*s,mv.w,mv.h||18];}
function updMovers(w,P,t,dt){if(!w.movers)return;for(const mv of w.movers){mv.prev=mv.cur||moverAt(mv,t);mv.cur=moverAt(mv,t);mv.cur.mv=mv;}
  if(!P)return;const sup=P.support&&P.support.mv;P.carryVx=0;P.carryVy=0;
  if(sup&&P.onGround){const dx=sup.cur[0]-sup.prev[0],dy=sup.cur[1]-sup.prev[1];P.x+=dx;P.y=sup.cur[1]-(P.h||H);P.carryVx=dx/dt;P.carryVy=dy/dt;P.support=sup.cur;}
  for(const mv of w.movers){const r=mv.cur,hh=P.h||H;if(!overlap(P.x,P.y,W,hh,r))continue;if(P.vy>=0&&P.y+hh-r[1]<6+tileRise(r)){P.y=r[1]-hh;P.vy=0;P.onGround=true;P.support=r;}}}
// ---------------------------------------------------------------- the step (§7 pseudocode, game order)
function step(P,k,dt,o){o=o||{};const H_=P.h||H;const PH=o.phys||PHYS,T=o.tuning||{},w=o.world||{solids:[]},on=n=>o[n]!==false,ev=P.ev=[];
  const push=(t,d)=>{ev.push(Object.assign({t},d||{}));};
  const dustE=(x,y,n,dx,dy,spread)=>push('dust',{x,y,n,dx:dx||0,dy:dy==null?-1:dy,spread:spread==null?1:spread});
  P.px=P.x;P.py=P.y;
  updMovers(w,P,o.time||0,dt);
  const dir=(k.right?1:0)-(k.left?1:0),jumpHeld=!!k.jump;
  if(k.jumpPressed)P.buffer=on('buffer')?PH.buffer:dt*1.5;
  P.wallLock=Math.max(0,P.wallLock-dt);P.buffer=Math.max(0,P.buffer-dt);
  P.coyote=P.onGround?(on('coyote')?PH.coyote:0):Math.max(0,P.coyote-dt);
  P.wallMemT=Math.max(0,P.wallMemT-dt);P.land=Math.max(0,P.land-dt);P.stretch=Math.max(0,P.stretch-dt*6);P.retainT=Math.max(0,P.retainT-dt);
  // --- horizontal ---
  const ax=Math.abs(P.vx),sv=Math.sign(P.vx);
  if(P.onGround){if(dir!==0){if(sv!==0&&sv!==dir)P.vx+=dir*PH.turnAccel*dt;else if(ax>PH.maxRun)P.vx-=sv*Math.min(ax-PH.maxRun,PH.overspeedDecay*dt);else P.vx=dir*Math.min(PH.maxRun,ax+PH.groundAccel*dt);P.facing=dir;}
    else if(P.roll<=0)P.vx=sv*Math.max(0,ax-PH.groundFric*dt);}
  else if(o.airControl===false){}
  else{if(dir!==0&&P.wallLock<=0){if(sv===dir&&ax>=PH.maxRun){}else P.vx=clamp(P.vx+dir*PH.airAccel*dt,-Math.max(PH.maxRun,ax),Math.max(PH.maxRun,ax));if(!P.flipOn)P.facing=dir;}
    else if(dir===0&&!o.noAirDrag)P.vx=sv*Math.max(0,ax-PH.airDrag*dt);}
  if(o.lockVx!=null)P.vx=o.lockVx;
  // --- jumps ---
  if(P.buffer>0){
    if(P.onGround||P.coyote>0){
      const hyper=!!o.hyper&&P.roll>0&&(PH.rollTime-P.roll)<=(T.hyperWindow==null?.1:T.hyperWindow);
      P.vy=o.jumpVy!=null?-o.jumpVy:-PH.jumpVel*(hyper?(o.hyperArc==null?.75:o.hyperArc):1);
      if(o.jumpVx!=null){P.vx=P.facing*o.jumpVx;P.hyper=true;}else if(hyper){P.vx=P.facing*PH.maxRun*(T.hyperMult==null?1.3:T.hyperMult);P.hyper=true;}else P.hyper=false;
      if(T.jumpHBoost&&dir!==0&&!hyper)P.vx+=dir*T.jumpHBoost;
      if(o.liftBoost&&P.support&&P.support.mv){P.vx+=clamp(P.carryVx,-(T.liftCapX||250),T.liftCapX||250);if(P.carryVy<0)P.vy+=Math.max(P.carryVy,-(T.liftCapY||130));}
      P.onGround=false;P.coyote=0;P.buffer=0;P.jumpCut=false;P.fromGround=true;P.holdT=0;P.peak=P.y+H_;P.airT=0;
      P.flipPending=Math.abs(P.vx)>PH.flipMinSpeed;P.flipDir=P.facing;P.stretch=1;P.roll=0;P.lastWJ=0;P.support=null;
      dustE(P.x+W/2,P.y+H_,7,0,-1);push(hyper||o.jumpVx!=null?'hyper':'jump',{vx:P.vx});
    }else if(on('wallJump')&&P.wallMemT>0&&P.wallMem!==0){
      const wd=P.wallMem,same=on('samePenalty')&&wd===P.lastWJ,toward=dir===wd;
      P.vx=-wd*(toward?PH.wallClimbX:PH.wallJumpX);P.vy=-(same?PH.wallJumpSameY:PH.wallJumpY);
      P.wallLock=toward?PH.wallClimbLock:PH.wallLock;P.lastWJ=wd;P.facing=-wd;P.buffer=0;P.wallMemT=0;P.jumpCut=true;P.fromGround=false;P.wallStickT=0;P.slideT=0;
      if(!same){P.flipOn=true;P.flip=0;P.flipDir=-wd;P.flipPending=false;}
      P.stretch=1;P.peak=P.y+H_;P.airT=0;
      dustE(wd>0?P.x+W:P.x,P.y+H_*.6,9,-wd,0);push(toward?'climb':'wall',{same,wd});}}
  if(!P.onGround)P.holdT+=dt;
  if(on('jumpCut')&&P.fromGround&&!P.jumpCut&&!jumpHeld&&P.vy<0){P.vy*=PH.jumpCut;P.jumpCut=true;P.flipPending=false;push('cut',{});}
  // --- gravity ---
  let g=PH.gravity*(o.gravScale==null?1:o.gravScale);
  if(P.vy>0){if(on('fallMult'))g*=PH.fallMult;}
  else if(on('apex')&&Math.abs(P.vy)<PH.apexBand&&jumpHeld)g*=PH.apexMult;
  if(!P.onGround)P.vy+=g*dt;
  // --- wall slide: 100 ms stick then 115 u/s flat, or the Celeste-like ramp 25 to 115 u/s over 0.8 s ---
  const sliding=!P.onGround&&P.wallDir!==0&&P.vy>0;
  if(sliding){if(!P.wasWall){P.wallStickT=on('wallStick')?PH.wallStick:0;P.slideT=0;}
    P.slideT+=dt;
    if(o.slideRamp)P.vy=Math.min(P.vy,lerp(25,PH.wallSlideMax,Math.min(1,P.slideT/(T.slideRampTime||.8))));
    else if(P.wallStickT>0){P.wallStickT-=dt;P.vy=Math.min(P.vy,25);}
    else P.vy=Math.min(P.vy,PH.wallSlideMax);
    P.facing=P.wallDir;P.flipOn=false;P.flipPending=false;P.dustT-=dt;
    if(P.dustT<=0){P.dustT=.06;dustE(P.wallDir>0?P.x+W:P.x,P.y+H_-4,1,0,.3,.6);}}
  P.wasWall=sliding;P.vy=Math.min(P.vy,o.fallCap!=null?o.fallCap:PH.maxFall);
  // --- integrate X (bounded resolve; a ledge lip within cornerCorrect steps the body up instead of stopping it) ---
  const cc=T.cornerCorrect||0;
  P.x+=P.vx*dt;let s,guard=0;
  while((s=solidAt(w,P.x,P.y,W,H_))&&guard++<6){
    const lip=P.y+H_-s[1];
    if(cc>0&&P.vy>=0&&lip>0&&lip<=cc&&!solidAt(w,P.x,s[1]-H_,W,H_)){P.y=s[1]-H_;push('corner',{kind:'ledge',n:lip});continue;}
    if(!P.onGround&&P.vx!==0&&T.wallRetain){P.retainVx=P.vx;P.retainT=T.wallRetain;}
    if(P.vx>0)P.x=s[0]-W;else if(P.vx<0)P.x=s[0]+s[2];else P.x=(P.x+W/2<s[0]+s[2]/2)?s[0]-W:s[0]+s[2];
    P.vx=0;}
  if(w.width!=null){if(P.x<0){P.x=0;P.vx=0;}if(P.x>w.width-W){P.x=w.width-W;P.vx=0;}}
  // --- integrate Y (rising into a ceiling: try a sideways nudge of 1..cornerCorrect first, §7 moveY) ---
  const wasGround=P.onGround,land={vy:P.vy,feet:P.y+H_},dy=P.vy*dt;
  if(dy<0&&cc>0&&solidAt(w,P.x,P.y+dy,W,H_,land)){let moved=0;
    for(let n=1;n<=cc&&!moved;n++){
      if(!solidAt(w,P.x+n,P.y+dy,W,H_,land)&&!solidAt(w,P.x+n,P.y,W,H_)){P.x+=n;moved=n;}
      else if(!solidAt(w,P.x-n,P.y+dy,W,H_,land)&&!solidAt(w,P.x-n,P.y,W,H_)){P.x-=n;moved=-n;}}
    if(moved)push('corner',{kind:'ceiling',n:moved});}
  P.y+=dy;P.onGround=false;guard=0;
  while((s=solidAt(w,P.x,P.y,W,H_,land))&&guard++<6){if(P.vy>0){P.y=s[1]-H_;P.onGround=true;P.support=s;}else{P.y=s[1]+s[3];push('bonk',{});}P.vy=0;}
  if(!P.onGround&&P.vy>=0&&(s=solidAt(w,P.x,P.y+H_,W,1,{vy:1,feet:P.y+H_}))){P.onGround=true;P.support=s;}
  if(!P.onGround&&P.support)P.support=null;
  // --- leave / land ---
  if(wasGround&&!P.onGround){P.peak=P.y+H_;P.airT=0;}
  if(!P.onGround){P.airT+=dt;P.peak=Math.min(P.peak,P.y+H_);}
  if(!wasGround&&P.onGround){const fall=(P.y+H_)-P.peak;P.lastWJ=0;P.fromGround=false;P.flipPending=false;P.hyper=false;
    if(on('roll')&&fall>PH.rollFall&&P.wallDir===0){P.roll=PH.rollTime;P.flipOn=false;if(Math.abs(P.vx)<PH.rollMinSpeed)P.vx=P.facing*PH.rollMinSpeed;dustE(P.x+W/2,P.y+H_,10,0,-.6,1.2);push('roll',{fall,vy:land.vy});}
    else if(fall>50){P.land=.13;dustE(P.x+W/2,P.y+H_,6,0,-.5);push('land',{fall,vy:land.vy});}
    else push('touch',{fall,vy:land.vy});}
  // --- flips and roll ---
  if(P.flipPending&&!P.onGround&&P.holdT>.1&&jumpHeld){P.flipOn=true;P.flip=0;P.flipPending=false;}
  if(P.flipOn){P.flip+=dt/PH.flipTime*(P.onGround?3:1);if(P.flip>=1){P.flipOn=false;P.flip=0;}}
  if(P.roll>0){P.roll-=dt;if(Math.abs(P.vx)<PH.rollMinSpeed*.85)P.vx=P.facing*PH.rollMinSpeed*.85;P.dustT-=dt;
    if(P.dustT<=0&&P.onGround){P.dustT=.035;dustE(P.x+W/2-P.facing*8,P.y+H_,1,-P.facing*.5,-.2);}}
  // --- wall probe (2 u today, wallReach when set) ---
  P.wallDir=0;
  if(!P.onGround&&!(P.h&&P.h<H)){const reach=Math.max(2,T.wallReach||2),py=P.y+8,ph=H_-16;
    if(solidAt(w,P.x-reach,py,reach,ph))P.wallDir=-1;else if(solidAt(w,P.x+W,py,reach,ph))P.wallDir=1;
    if(P.wallDir!==0){P.wallMem=P.wallDir;P.wallMemT=on('wallCoyote')?PH.wallCoyote:dt*1.01;}}
  // --- Celeste wall speed retention: the X speed lost on a wall comes back if the wall ends within wallRetain ---
  if(P.retainT>0&&!P.onGround){if(P.vx!==0&&Math.sign(P.vx)===-Math.sign(P.retainVx))P.retainT=0;
    else if(!solidAt(w,P.x+Math.sign(P.retainVx),P.y,W,H_)){P.vx=P.retainVx;P.retainT=0;push('retain',{vx:P.vx});}}
  // --- run dust ---
  if(P.onGround&&Math.abs(P.vx)>260&&P.roll<=0){P.dustT-=dt;if(P.dustT<=0){P.dustT=.09-Math.abs(P.vx)/10000;dustE(P.x+W/2-Math.sign(P.vx)*6,P.y+H_,1,-Math.sign(P.vx)*.4,-.3,.7);}}
  // --- animation timers and the kimono spring (stiffness 160, damping 14) ---
  P.phase+=Math.abs(P.vx)*dt*.042;
  const flapTarget=clamp(-Math.abs(P.vx)/PH.maxRun*.55+(P.onGround?0:clamp(P.vy/900,-.6,.6)),-1.1,.8);
  P.flapV+=((flapTarget-P.flap)*160-P.flapV*14)*dt;P.flap+=P.flapV*dt;
  const gripT=P.wasWall||P.wallLock>0||P.flipOn||P.roll>0?0:1;P.grip+=(gripT-P.grip)*Math.min(1,dt*14);
  // --- hazards, checkpoints, finish ---
  if(w.spikes)for(const sp of w.spikes)if(overlap(P.x+3,P.y,W-6,H_,sp[3]==='down'?[sp[0]+4,sp[1],sp[2]-8,16]:[sp[0]+4,sp[1]-16,sp[2]-8,16])){P.dead=true;push('die',{why:'spike'});return ev;}
  if(w.deathY!=null&&P.y>w.deathY){P.dead=true;push('die',{why:'fall'});return ev;}
  if(w.checkpoints&&P.cp<w.checkpoints.length&&P.x>w.checkpoints[P.cp]){push('check',{i:P.cp});P.cp++;}
  if(w.finish!=null&&!P.finished&&P.x+W>w.finish){P.finished=true;push('finish',{});}
  return ev;}
// ---------------------------------------------------------------- courses
function makeCourse(spec){
  if(typeof spec==='number'){const R=mkRng(spec),solids=[],spikes=[];let x=0;const width=3200;
    while(x<width){const len=Math.round(300+R()*500),gap=Math.round(100+R()*120);solids.push([x,G,len,300]);if(R()<.5)solids.push([x+len*.5,G-40-Math.round(R()*60),80+Math.round(R()*60),200]);x+=len+gap;}
    solids.push([width-400,G,500,300]);return makeCourse({solids,spikes,width,start:60,finish:width-120});}
  const c=Object.assign({solids:[],movers:[],spikes:[],checkpoints:[],width:3000,top:-400,deathY:G+50,floorView:G,start:60,startY:G,finish:null},spec);
  for(const mv of c.movers){mv.cur=null;mv.prev=null;}return c;}
const COURSES={
  // the hero loop: run, a gap, a chimney climbed with two wall jumps, a mover, the flag
  hero:()=>makeCourse({width:2800,deathY:700,finish:2520,checkpoints:[1480],
    solids:[[0,G,760,300],[920,G,560,300],[1330,300,30,160],[1480,320,400,500],[2200,480,600,320],[2200,G,600,200]],
    movers:[{x0:1960,y0:330,x1:1960,y1:480,w:160,h:18,period:3,phase:.2}]}),
  flat:()=>makeCourse({width:4000,solids:[[0,G,4000,300]]}),
  gap:()=>makeCourse({width:1600,solids:[[0,G,600,300],[780,G,820,300]],deathY:700}),
  chimney:()=>makeCourse({width:1400,solids:[[0,G,560,300],[410,300,30,160],[560,320,840,500]]}),
  drop:()=>makeCourse({width:2400,top:-500,deathY:800,floorView:720,solids:[[0,100,700,800],[700,720,1700,300]]}),
  lips:()=>makeCourse({width:1200,solids:[[0,G,1200,300],[700,G-8,500,8,'tile'],[300,380,90,24]]}),
  wall:()=>makeCourse({width:1000,solids:[[0,G,1000,300],[640,100,360,500]]})};
const course=name=>(COURSES[name]||COURSES.flat)();
// ---------------------------------------------------------------- camera
function newCam(x,y){return {x,y,px:x,py:y,ref:y+VH*.62,look:120};}
function cam(c,P,o,dt){o=o||{};const vw=o.VW||VW,vh=o.VH||VH,feet=P.y+H,mode=o.mode||'lock',width=o.width==null?1e9:o.width;c.px=c.x;c.py=c.y;
  let lookT=o.lookAhead==null?120:o.lookAhead;
  if(o.speedFocus)lookT=lerp(lookT,200,sat(Math.abs(P.vx)/(PHYS.maxRun*1.3)));
  c.look=o.snap?lookT:lerp(c.look,lookT,1-Math.exp(-(o.speedFocus?5:3)*dt));
  const f=o.facingLook?P.facing:1,tx=clamp(P.x+W/2-(f>0?vw*.36:vw*.64)+c.look*f,0,Math.max(0,width-vw));
  const dz=o.deadZone==null?60:o.deadZone,base=(o.floorView==null?G:o.floorView)-vh*.8,top=o.top==null?-1e9:o.top;
  if(mode==='lerp'){const k=o.snap?1:1-Math.exp(-(o.rate||4)*dt);c.x=lerp(c.x,tx,k);let ty=clamp(feet-vh*.62,top,base);if(o.killClamp&&o.deathY!=null)ty=Math.min(ty,o.deathY-vh);c.y=lerp(c.y,ty,k);}
  else{c.x=tx;
    if(mode==='snap'){c.ref=feet;}
    else if(o.snap||P.onGround||P.wasWall||feet>c.ref)c.ref=feet;
    else if(feet<c.ref-dz)c.ref=feet+dz;
    let ty=c.ref-vh*.62;
    if(o.fallLook&&!P.onGround&&P.vy>0)ty+=Math.min(200,P.vy*.25);
    ty=clamp(ty,top,base);
    if(o.killClamp&&o.deathY!=null)ty=Math.min(ty,o.deathY-vh);
    c.y=(o.snap||mode==='snap')?ty:lerp(c.y,ty,1-Math.exp(-(P.wasWall?9:5)*dt));}
  if(o.snap){c.px=c.x;c.py=c.y;}return c;}
// ---------------------------------------------------------------- drawing: paper, world, solids
function paper(ctx,w,h,col){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=col||ink.paper;ctx.fillRect(0,0,w,h);}
function view(ctx,c,s,ox,oy){ctx.setTransform(s,0,0,s,(ox||0)-c.x*s,(oy||0)-c.y*s);}
function drawSpikes(ctx,sp){const [x,gy,w]=sp,n=Math.max(1,Math.round(w/20)),st=w/n;ctx.save();ctx.translate(0,gy);if(sp[3]==='down')ctx.scale(1,-1);
  ctx.fillStyle=ink.ink;ctx.beginPath();ctx.moveTo(x-6,1);ctx.bezierCurveTo(x-2,1,x,-3.5,x+4,-3.5);ctx.lineTo(x+w-4,-3.5);ctx.bezierCurveTo(x+w,-3.5,x+w+2,1,x+w+6,1);ctx.closePath();
  for(let i=0;i<n;i++){const cx=x+(i+.5)*st+(i%2?.6:-.6),hw=Math.min(6,st*.32),h=19+(i%3===1?1.5:0);ctx.moveTo(cx-hw,-2);ctx.quadraticCurveTo(cx-hw*.25,-h*.45,cx,-h);ctx.quadraticCurveTo(cx+hw*.25,-h*.45,cx+hw,-2);ctx.closePath();}
  ctx.fill();ctx.restore();}
function drawFlag(ctx,x,gy){ctx.fillStyle=ink.ink;ctx.fillRect(x-2,gy-150,4,150);ctx.fillStyle=ink.red;ctx.beginPath();ctx.moveTo(x+2,gy-150);ctx.lineTo(x+58,gy-138);ctx.lineTo(x+2,gy-112);ctx.closePath();ctx.fill();}
function drawCheckpoint(ctx,x,gy,on){ctx.fillStyle=on?ink.ink:ink.grey2;ctx.fillRect(x,gy-64,3,64);ctx.beginPath();ctx.moveTo(x+3,gy-64);ctx.lineTo(x+26,gy-56);ctx.lineTo(x+3,gy-48);ctx.closePath();ctx.fill();}
function groundBelow(w,x){let best=G;for(const s of w.solids)if(x>=s[0]&&x<=s[0]+s[2]&&s[1]<best+1)best=Math.min(best,s[1]);return best;}
function drawSolids(ctx,w,c,o){o=o||{};const vw=o.VW||VW,x0=c.x-80,x1=c.x+vw+80,t=o.time||0;
  if(o.start!==false&&w.start!=null){ctx.fillStyle=ink.grey2;ctx.fillRect(w.start-60,groundBelow(w,w.start)-82,2,82);}
  for(const cp of (w.checkpoints||[]))if(cp>x0&&cp<x1)drawCheckpoint(ctx,cp,groundBelow(w,cp),o.cpOn!=null&&o.cpOn>w.checkpoints.indexOf(cp));
  if(w.finish!=null&&w.finish>x0-80&&w.finish<x1)drawFlag(ctx,w.finish,w.finishY==null?groundBelow(w,w.finish):w.finishY);
  ctx.fillStyle=ink.ink;
  for(const s of w.solids){if(s[0]>x1||s[0]+s[2]<x0)continue;ctx.fillRect(s[0],s[1],s[2],s[3]);
    if(s[4]==='tile'){ctx.fillStyle=ink.paper;ctx.fillRect(s[0]+3,s[1]+s[3]-2.5,s[2]-6,1.5);ctx.fillStyle=ink.ink;}}
  for(const mv of (w.movers||[])){const r=mv.cur||moverAt(mv,t);
    if(mv.wheel){ctx.strokeStyle=ink.grey;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(mv.cx,mv.cy);ctx.lineTo(r[0]+r[2]/2,r[1]+r[3]/2);ctx.stroke();
      ctx.fillStyle=ink.ink;ctx.beginPath();ctx.arc(mv.cx,mv.cy,6,0,Math.PI*2);ctx.fill();}
    else{ctx.save();ctx.strokeStyle=ink.grey2;ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(mv.x0+mv.w/2,mv.y0+(mv.h||18)/2);ctx.lineTo(mv.x1+mv.w/2,mv.y1+(mv.h||18)/2);ctx.stroke();ctx.restore();}
    ctx.fillStyle=ink.ink;ctx.fillRect(r[0],r[1],r[2],r[3]);ctx.fillStyle=ink.paper;ctx.fillRect(r[0]+4,r[1]+r[3]/2-1,r[2]-8,2);}
  for(const sp of (w.spikes||[]))if(sp[0]<x1&&sp[0]+sp[2]>x0)drawSpikes(ctx,sp);
  if(o.death&&w.deathY!=null){ctx.save();ctx.strokeStyle=ink.red;ctx.lineWidth=1.5;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(x0,w.deathY);ctx.lineTo(x1,w.deathY);ctx.stroke();ctx.restore();}}
// ---------------------------------------------------------------- the rig
const idlePose=t=>({hip:22+Math.sin(t*2.2)*.5,lean:.04,th:[.12,-.1],sh:[.05,.05],ua:[.15,-.12],la:[.35,.3]});
const newPose=()=>idlePose(0);
const POSES={
  roll:{hip:13,lean:.9,th:[2.1,1.9],sh:[2.6,2.6],ua:[1.2,1.0],la:[1.1,1.1]},
  flip:{hip:15,lean:.6,th:[2.0,1.8],sh:[2.5,2.5],ua:[1.3,1.1],la:[1.0,1.0]},
  wall:{hip:20,lean:.28,th:[.75,.25],sh:[1.2,.7],ua:[2.1,-.45],la:[.15,.4]},
  rise:{hip:21,lean:.12,th:[1.15,.2],sh:[1.6,.5],ua:[2.7,-.5],la:[.3,.6]},
  apex:{hip:21,lean:.12,th:[.7,.05],sh:[1.0,.6],ua:[1.9,-1.0],la:[.4,.4]},
  fall:{hip:22,lean:.06,th:[.35,-.2],sh:[.35,.6],ua:[1.55,-1.45],la:[.2,.2]}};
const landPose=k=>({hip:22-7*k,lean:.25+.2*k,th:[.9*k+.1,.7*k],sh:[1.6*k,1.4*k],ua:[.6,-.4],la:[.6,.4]});
const runPose=(p,sp)=>{const s=Math.sin(p),c=Math.cos(p);return {hip:22-Math.abs(c)*1.8*sp,lean:.08+.32*sp,th:[.95*s*sp,-.95*s*sp],sh:[.25+Math.max(0,c)*1.5*sp,.25+Math.max(0,-c)*1.5*sp],ua:[-.85*s*sp,.85*s*sp],la:[.9+.3*sp,.9+.3*sp]};};
function targetPose(P,t){const sp=Math.min(1,Math.abs(P.vx)/PHYS.maxRun);
  if(P.roll>0)return POSES.roll;if(P.flipOn)return POSES.flip;
  if(!P.onGround&&P.wallDir!==0&&P.vy>0)return POSES.wall;
  if(!P.onGround){if(P.vy<-120)return POSES.rise;if(P.vy<160)return POSES.apex;return POSES.fall;}
  if(P.land>0)return landPose(P.land/.13);
  if(sp>.04)return runPose(P.phase,sp);
  return idlePose(t||0);}
function blend(a,b,k){const L=(x,y)=>x+(y-x)*k;return {hip:L(a.hip,b.hip),lean:L(a.lean,b.lean),th:[L(a.th[0],b.th[0]),L(a.th[1],b.th[1])],sh:[L(a.sh[0],b.sh[0]),L(a.sh[1],b.sh[1])],ua:[L(a.ua[0],b.ua[0]),L(a.ua[1],b.ua[1])],la:[L(a.la[0],b.la[0]),L(a.la[1],b.la[1])]};}
// katana: a slim curved blade with a kissaki and a hair-thin edge line; the hilt with its wrap
function katanaBlade(c,B,D,E,len,w,bow,edgeLine=true){if(len<1)return;
  const pt=(t,off)=>{const b=bow*len*t*t;return [B[0]+D[0]*len*t+E[0]*(b+off),B[1]+D[1]*len*t+E[1]*(b+off)];};const hw=t=>w/2*(1-.35*t);
  c.beginPath();let p=pt(0,-hw(0));c.moveTo(p[0],p[1]);for(let t=.1;t<=1.0001;t+=.1){p=pt(t,-hw(t));c.lineTo(p[0],p[1]);}
  const tip=pt(1.05,-hw(1)*.6);c.lineTo(tip[0],tip[1]);const k1=pt(1.02,hw(1)*1.2),k0=pt(.9,hw(.9));c.quadraticCurveTo(k1[0],k1[1],k0[0],k0[1]);
  for(let t=.8;t>=-.0001;t-=.1){p=pt(t,hw(t));c.lineTo(p[0],p[1]);}c.closePath();c.fill();
  if(edgeLine){c.save();c.strokeStyle='rgba(255,255,255,0.6)';c.lineWidth=Math.max(.35,w*.16);c.lineCap='round';c.beginPath();p=pt(.06,hw(.06)*.45);c.moveTo(p[0],p[1]);for(let t=.16;t<=.9;t+=.1){p=pt(t,hw(t)*.45);c.lineTo(p[0],p[1]);}c.stroke();c.restore();}}
function katanaHilt(c,Gp,Hd,len,w){const n=[-Hd[1],Hd[0]],at=(k,o=0)=>[Gp[0]+Hd[0]*k+n[0]*o,Gp[1]+Hd[1]*k+n[1]*o];
  c.beginPath();c.ellipse(Gp[0],Gp[1],w*.4,w*1.05,Math.atan2(Hd[1],Hd[0]),0,Math.PI*2);c.fill();
  const q=[at(.6,-w/2),at(len,-w*.46),at(len,w*.46),at(.6,w/2)];c.beginPath();c.moveTo(q[0][0],q[0][1]);for(const v of q.slice(1))c.lineTo(v[0],v[1]);c.closePath();c.fill();
  const f=c.fillStyle;c.fillStyle='rgba(255,255,255,0.75)';for(let k=2.6;k<len-1.2;k+=2.4){const a=at(k-.85),b=at(k,w*.28),d=at(k+.85),e=at(k,-w*.28);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(d[0],d[1]);c.lineTo(e[0],e[1]);c.closePath();c.fill();}c.fillStyle=f;}
const SAM={leg:1.22,torso:17,neck:7,head:5.2,ua:9.8,la:9.2,lw:2.1};
function drawHead(c,x,y,rot,hat,inkc){c.fillStyle=inkc;c.beginPath();c.arc(x,y,SAM.head,0,Math.PI*2);c.fill();
  c.save();c.translate(x,y);c.rotate(rot+.1);c.translate(0,-2.2);c.fillStyle=hat;c.beginPath();c.moveTo(-14,1.6);c.quadraticCurveTo(0,-.6,14,1.6);c.lineTo(1.1,-8.2);c.lineTo(-1.1,-8.2);c.closePath();c.fill();c.lineWidth=.9;c.strokeStyle=inkc;c.stroke();c.restore();}
// the stick samurai, feet centred at (x, y), facing +1 or -1. o: hat, kim (kimono colour), flap, grip, lw, alpha, sx, sy (squash about the feet), clock, ghost
function drawSamurai(c,ps,x,y,facing,o){o=o||{};const lw=o.lw||SAM.lw,inkc=o.ghost?(o.ink||ink.grey):(o.ink||ink.ink),hat=o.ghost?inkc:(o.hat||'#111111'),kim=o.ghost?inkc:(o.kim||ink.red),flap=o.flap||0,grip=o.grip==null?1:o.grip,clock=o.clock||0;
  c.save();c.translate(x,y);c.scale((facing||1)*(o.sx||1),o.sy||1);if(o.rot){c.translate(0,-26);c.rotate(o.rot);c.translate(0,26);}if(o.alpha!=null)c.globalAlpha*=o.alpha;
  const hip=[0,-ps.hip*SAM.leg],sh=[hip[0]+Math.sin(ps.lean)*SAM.torso,hip[1]-Math.cos(ps.lean)*SAM.torso],head=[sh[0]+Math.sin(ps.lean*.7)*SAM.neck,sh[1]-Math.cos(ps.lean*.7)*SAM.neck];
  const seg=(p,a,len)=>[p[0]+Math.sin(a)*len,p[1]+Math.cos(a)*len];
  const line=(a,b,w=lw)=>{c.lineWidth=w;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();};
  c.lineCap='round';c.lineJoin='round';c.strokeStyle=inkc;c.fillStyle=inkc;
  const limbs=i=>{const knee=seg(hip,ps.th[i]+ps.lean*.2,11*SAM.leg),foot=seg(knee,ps.th[i]-ps.sh[i],11.5*SAM.leg),elb=seg(sh,ps.ua[i]+ps.lean*.3,SAM.ua),hand=seg(elb,ps.ua[i]+ps.la[i],SAM.la);return {knee,foot,elb,hand};};
  const back=limbs(1),front=limbs(0),perp=[Math.cos(ps.lean),Math.sin(ps.lean)],up=[Math.sin(ps.lean),-Math.cos(ps.lean)],ob=[lerp(hip[0],sh[0],.12),lerp(hip[1],sh[1],.12)];
  const a0=c.globalAlpha;c.globalAlpha=a0*.75;line(hip,back.knee);line(back.knee,back.foot);line(sh,back.elb);line(back.elb,back.hand);c.globalAlpha=a0;
  const wv=Math.sin(clock*7)*.6,kn=[ob[0]-perp[0]*2.5,ob[1]-perp[1]*2.5];c.strokeStyle=kim;
  for(const [len,drop] of [[9.5,2.2],[7.5,5.2]]){const end=[kn[0]-perp[0]*len*(1-flap*.35)-up[0]*(drop*(1+flap)-wv),kn[1]-perp[1]*len*(1-flap*.35)-up[1]*(drop*(1+flap)-wv)],m=[lerp(kn[0],end[0],.5)-up[0]*wv,lerp(kn[1],end[1],.5)-up[1]*wv];
    c.lineWidth=1.5;c.beginPath();c.moveTo(kn[0],kn[1]);c.quadraticCurveTo(m[0],m[1],end[0],end[1]);c.stroke();}
  c.strokeStyle=inkc;line(hip,sh,lw*1.15);line(sh,head,lw);
  c.strokeStyle=kim;line([ob[0]-perp[0]*3.4,ob[1]-perp[1]*3.4],[ob[0]+perp[0]*3.4,ob[1]+perp[1]*3.4],3.4);c.strokeStyle=inkc;
  line(hip,front.knee);line(front.knee,front.foot);
  let gripAt=null;
  if(o.katana!==false){const e=clamp(.42+flap*.32,.06,.8),D=[perp[0]*Math.cos(e)+up[0]*Math.sin(e),perp[1]*Math.cos(e)+up[1]*Math.sin(e)],nU=[D[1],-D[0]],pv=[ob[0]+perp[0]*4+up[0],ob[1]+perp[1]*4+up[1]];
    const at=(k,n=0)=>[pv[0]+D[0]*k+nU[0]*n,pv[1]+D[1]*k+nU[1]*n];katanaBlade(c,at(.4),[-D[0],-D[1]],nU,30,2.3,.07,!o.ghost);katanaHilt(c,at(.4),D,9.5,2.9);gripAt=at(5.5);}
  drawHead(c,head[0],head[1],ps.lean*.5-flap*.06,hat,inkc);
  if(o.blade!=null){const len=o.bladeLen==null?32:o.bladeLen,Db=[Math.sin(o.blade),Math.cos(o.blade)];katanaBlade(c,front.hand,Db,[Db[1],-Db[0]],len,2.1,-.05,!o.ghost);katanaHilt(c,front.hand,[-Db[0],-Db[1]],7,2.8);}
  if(gripAt&&grip>.01&&o.blade==null){const l1=SAM.ua,l2=SAM.la,dx=gripAt[0]-sh[0],dy=gripAt[1]-sh[1],d=Math.min(Math.hypot(dx,dy),l1+l2-.01),a=Math.atan2(dy,dx),A=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1)),ea=a+A;
    const E=[sh[0]+Math.cos(ea)*l1,sh[1]+Math.sin(ea)*l1],tl=Math.hypot(gripAt[0]-E[0],gripAt[1]-E[1])||1,Hh=[E[0]+(gripAt[0]-E[0])/tl*l2,E[1]+(gripAt[1]-E[1])/tl*l2];
    front.elb=[lerp(front.elb[0],E[0],grip),lerp(front.elb[1],E[1],grip)];front.hand=[lerp(front.hand[0],Hh[0],grip),lerp(front.hand[1],Hh[1],grip)];}
  line(sh,front.elb);line(front.elb,front.hand);
  c.restore();return {head,hand:front.hand,sh,hip};}
// ---------------------------------------------------------------- dust
function dust(parts,x,y,n,dx=0,dy=-1,spread=1){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=(40+Math.random()*90)*spread;
  parts.push({x,y,vx:Math.cos(a)*sp*.8+dx*140,vy:Math.sin(a)*sp*.35+dy*60-20,life:.35+Math.random()*.3,t:0,r:1.2+Math.random()*2.4,g:Math.random()<.5});}}
function spawnDust(parts,ev){for(const e of ev)if(e.t==='dust')dust(parts,e.x,e.y,e.n,e.dx,e.dy,e.spread);}
function updParts(parts,dt){for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.t+=dt;if(p.t>=p.life){parts.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy=p.vy*.92+40*dt;}}
function drawParts(ctx,parts){const a=ctx.globalAlpha;for(const p of parts){const k=1-p.t/p.life;ctx.globalAlpha=a*k*(p.g?.35:.6);ctx.fillStyle=p.g?'#7a7a7a':ink.ink;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(.6+.4*k),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=a;}
// ---------------------------------------------------------------- autopilot
function bot(P,w,st){const k={left:false,right:false,jump:false,jumpPressed:false};let dir=1;
  st.jumpT=Math.max(0,(st.jumpT||0)-DT);st.steerT=Math.max(0,(st.steerT||0)-DT);
  if(!P.onGround&&P.wallDir!==0&&st.lastWall!==P.wallDir){st.lastWall=P.wallDir;k.jumpPressed=true;st.jumpT=.1;st.steer=-P.wallDir;st.steerT=.7;}
  if(P.onGround){st.lastWall=0;st.steerT=0;}
  if(st.steerT>0)dir=st.steer;
  if(P.onGround&&!k.jumpPressed){const feet=P.y+H,ahead=P.x+(dir>0?W:0)+dir*34;
    const ground=solidAt(w,ahead,feet-2,2,10,{vy:1,feet});const wall=solidAt(w,dir>0?P.x+W:P.x-70,P.y+8,70,H-16);
    if(((!ground&&Math.abs(P.vx)>200)||wall)&&!st.noJump){k.jumpPressed=true;st.jumpT=.35;}}
  if(st.jumpT>0||(V.bounced&&P.vy<0))k.jump=true;
  if(dir>0)k.right=true;else if(dir<0)k.left=true;return k;}
// ---------------------------------------------------------------- synth sounds (the game's voices, gated by AUD)
function sfx(type,o){if(!AUD.on||!AUD.ctx)return;o=o||{};const a=AUD.ctx,t=a.currentTime,j=o.jitter?1+(Math.random()-.5)*2*o.jitter:1,vol=o.vol==null?1:o.vol;
  const tone=(f1,f2,dur,v,wave='triangle',delay=0)=>{const osc=a.createOscillator(),g=a.createGain();osc.type=wave;osc.frequency.setValueAtTime(f1*j,t+delay);osc.frequency.exponentialRampToValueAtTime(f2*j,t+delay+dur);
    g.gain.setValueAtTime(v*vol,t+delay);g.gain.exponentialRampToValueAtTime(.0001,t+delay+dur);osc.connect(g).connect(a.destination);osc.start(t+delay);osc.stop(t+delay+dur+.02);};
  const noise=(dur,v,freq)=>{const b=a.createBuffer(1,Math.max(1,Math.floor(a.sampleRate*dur)),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
    const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();f.type='lowpass';f.frequency.value=freq*j;g.gain.value=v*vol;s.buffer=b;s.connect(f).connect(g).connect(a.destination);s.start(t);};
  switch(type){case 'jump':tone(420,760,.09,.07);break;case 'wall':tone(520,980,.1,.08,'square');noise(.06,.12,2400);break;case 'land':noise(.08,.18,700);break;
    case 'roll':noise(.22,.14,900);break;case 'beep':tone(660,660,.12,.08,'sine');break;case 'go':tone(990,990,.25,.09,'sine');break;case 'die':tone(300,70,.3,.09,'sawtooth');break;
    case 'check':tone(880,1320,.12,.05,'sine');break;case 'slash':noise(.18,.25,5000);tone(2400,700,.16,.06,'sawtooth');break;case 'sheath':tone(900,600,.05,.08,'square');break;
    case 'step':noise(.02,.08,o.low?1200:1600);break;case 'finish':[523,659,784,1046].forEach((f,i)=>tone(f,f,.22,.08,'triangle',i*.08));break;}}
// ---------------------------------------------------------------- text and annotations (ctx.fillText, system font stack)
function text(ctx,s,x,y,o){o=o||{};ctx.font=`${o.weight||500} ${o.size||12}px ${o.mono?MONO:SANS}`;ctx.textAlign=o.align||'left';ctx.textBaseline=o.base||'alphabetic';ctx.fillStyle=o.col||ink.ink;ctx.fillText(String(s),x,y);return ctx.measureText(String(s)).width;}
function plate(ctx,s,x,y,o){o=o||{};ctx.font=`${o.weight||500} ${o.size||12}px ${o.mono?MONO:SANS}`;const w=ctx.measureText(String(s)).width,h=(o.size||12)*1.3,pad=o.pad==null?5:o.pad,al=o.align||'left';
  const bx=al==='center'?x-w/2-pad:al==='right'?x-w-pad:x-pad,by=y-h+2;ctx.fillStyle=o.fill||'rgba(255,255,255,0.92)';ctx.fillRect(bx,by,w+pad*2,h+2);
  if(o.stroke!==false){ctx.strokeStyle=o.stroke||ink.ink;ctx.lineWidth=1;ctx.strokeRect(bx+.5,by+.5,w+pad*2-1,h+1);}
  ctx.textAlign=al;ctx.textBaseline='alphabetic';ctx.fillStyle=o.col||ink.ink;ctx.fillText(String(s),x,y);return {x:bx,y:by,w:w+pad*2,h:h+2};}
function dim(ctx,x0,y0,x1,y1,label,o){o=o||{};const col=o.col||ink.grey;ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L*4,ny=dx/L*4;ctx.beginPath();ctx.moveTo(x0+nx,y0+ny);ctx.lineTo(x0-nx,y0-ny);ctx.moveTo(x1+nx,y1+ny);ctx.lineTo(x1-nx,y1-ny);ctx.stroke();
  if(label!=null)text(ctx,label,(x0+x1)/2+(o.ox||0),(y0+y1)/2+(o.oy||-5),{size:o.size||11,col:o.tcol||col,align:o.align||'center',mono:o.mono});ctx.restore();}
function band(ctx,x,y,w,h,col){ctx.fillStyle=col||'rgba(208,40,31,0.14)';ctx.fillRect(x,y,w,h);}
const fmtT=ms=>(Math.max(0,ms)/1000).toFixed(2);
const fmtD=ms=>(ms<0?'-':'+')+(Math.abs(ms)/1000).toFixed(2);
return {PHYS,TUNING,W,H,BL,DT,G,VW,VH,ink,ls,SANS,MONO,newPlayer,step,solidAt,moverAt,updMovers,overlap,makeCourse,course,newCam,cam,paper,view,drawSolids,drawSpikes,drawFlag,drawCheckpoint,groundBelow,
  idlePose,newPose,targetPose,blend,POSES,drawSamurai,katanaBlade,dust,spawnDust,updParts,drawParts,bot,sfx,text,plate,dim,band,fmtT,fmtD,sinT};})();

// ======================================================================
// SR verb layer (Mechanics #2): SR.VERBS (the §7 table), the verb state machine with startup, active
// and recovery phases and the cancel table, the resources reset by one onLand(), the crouch hitbox swap,
// the hook (Fristrom's constraint), the verb poses and the visuals. #1's API above is unchanged:
// SR.step still runs a plain player; SR.stepV wraps it. Everything here is design proposal [I] on [K].
// ======================================================================
(()=>{
const {PHYS,W,H,DT,ink}=SR;
// the §7 table, steps at 120 Hz, speeds in u/s; the recommended set first, then the comparison kits
const VERBS={
  slash:     {startup:2,active:4,recovery:6,cadence:12,box:[50,40],cancelInto:{jump:'any'}},
  pogo:      {startup:2,active:24,recovery:0,cadence:12,box:[40,50],bounceVy:-830,cancelInto:{land:'any'}},
  dashSlash: {startup:2,active:12,activeFull:18,recovery:6,speed:840,exit:546,uses:1,armSteps:24,fullSteps:36,iframes:'projectiles',cancelInto:{jump:'recovery',wall:'any'}},
  slide:     {startup:0,minSteps:14,friction:600,minSpeed:280,box:[20,26],cancelInto:{jump:'any',stand:'any'}},
  crouch:    {box:[20,26],crawl:120},
  stomp:     {vyMin:700},
  mantle:    {reach:16,vy:-300,vx:200,steps:12},
  hook:      {angle:45,speed:1700,reach:300,minLen:90,pump:900,capV:760,hopVy:-500,buffer:16,ringGrace:10},
  dash:      {startup:1,active:18,recovery:0,cooldown:24,speed:1120,exit:546,uses:1,refillLock:12,dirs:2},
  doubleJump:{vy:-705},glide:{fallMult:.25},climb:{speed:210,stamina:2.4,jumpCost:.25,tired:.2},
  wallRun:   {minVx:300,rise:92,steps:30},dive:{startup:14,vx:600,prone:30},pound:{fall:1150,land:18},
  charged:   {maxHold:72,mult:[.6,1.5]},jetpack:{thrust:3500,terminal:600},slowTime:{scale:.3,meter:1,refill:1/3}};
// verb sets (the Sandbox presets): which verbs the state machine may enter
const SETS={
  today:{},
  recommended:{crouch:1,slide:1,slideJump:1,stomp:1,mantle:1,slash:1,pogo:1,dashSlash:1,hook:1},
  kitchen:{crouch:1,slide:1,slideJump:1,mantle:1,slash:1,pogo:1,dashSlash:1,hook:1,dash:1,dashJump:1,doubleJump:1,dive:1,pound:1,wallRun:1,climb:1,glide:1,jetpack:1,charged:1},
  kitchenGym:{crouch:1,slide:1,slideJump:1,mantle:1,slash:1,pogo:1,dashSlash:1,hook:1,dash:1,dashJump:1,doubleJump:1,dive:1,pound:1,wallRun:1,glide:1,charged:1},
  celeste:{dash:1,dashDirs:4,dashJump:1,climb:1,crouch:1,slide:1},
  mario:{crouch:1,slide:1,slideJump:1,pound:1,dive:1},
  runner:{jetpack:1,glide:1,charged:1}};
const K=()=>({left:false,right:false,up:false,down:false,jump:false,jumpPressed:false,katana:false,katanaPressed:false,katanaReleased:false,dash:false,dashPressed:false,climb:false});
// verb state: one object per player, P.verb
function newVerbs(set){return {state:'normal',t:0,set:Object.assign({},typeof set==='string'?SETS[set]:(set||{})),charge:0,armed:false,full:false,dashes:1,airJumps:1,stamina:1,fuel:1,
  dashCd:0,dashLock:0,pogoCd:0,jbuf:0,hbuf:0,wasKatana:false,wasDown:false,hook:null,lastRing:null,ringGrace:0,chargeT:0,active:0,pvx:0,dir:1,dy:0,kills:0,after:[],flash:0,tint:0,glide:false,thrust:false,stomp:false,lastWall:0,pose:null,ev:[]};}
function newPlayerV(x,feetY,set){const P=SR.newPlayer(x,feetY);P.h=H;P.verb=newVerbs(set);return P;}
const phase=(t,startup,active,recovery)=>t<startup?'startup':t<startup+active?'active':t<startup+active+recovery?'recovery':'done';
function canCancel(verb,into,t,active){const v=VERBS[verb],rule=v.cancelInto&&v.cancelInto[into];return rule==='any'||rule===phase(t,v.startup,active==null?v.active:active,v.recovery);}
// hitbox swap with the feet fixed; standing tests solids only, never one-way tiles (Celeste CollideCheck<Solid>) [V, S7]
function canStand(P,w,cc){const h=P.h||H;for(let n=0;n<=(cc||0);n++)for(const s of (n?[n,-n]:[0]))if(!SR.solidAt(w,P.x+s,P.y+h-H,W,H)){if(s)P.x+=s;return true;}return false;}
function setCrouch(P,w,on,cc){const h=on?VERBS.crouch.box[1]:H;if(P.h===h)return true;if(!on&&!canStand(P,w,cc))return false;P.y+=(P.h||H)-h;P.h=h;return true;}
const PH_CRAWL=Object.assign({},PHYS,{maxRun:VERBS.crouch.crawl}),PH_SLIDE=Object.assign({},PHYS,{groundFric:VERBS.slide.friction,maxRun:0});
const crawlPhys=()=>{PH_CRAWL.maxRun=VERBS.crouch.crawl;return PH_CRAWL;},slidePhys=()=>{PH_SLIDE.groundFric=VERBS.slide.friction;return PH_SLIDE;};
// boxes
const body=P=>[P.x,P.y,W,P.h||H];
function slashBox(P){const b=VERBS.slash.box;return [P.facing>0?P.x+W:P.x-b[0],P.y+Math.max(0,(P.h||H)-b[1])/2,b[0],b[1]];}
function pogoBox(P){const b=VERBS.pogo.box;return [P.x+W/2-b[0]/2,P.y+(P.h||H),b[0],b[1]];}
function verbBox(P){const V=P.verb;if(!V)return null;const ph=V.phase;
  if((V.state==='slash'||V.state==='dashSlash')&&ph==='active')return slashBox(P);if(V.state==='pogo'&&ph==='active')return pogoBox(P);return null;}
// targets: enemies {x,y,w,h,alive}, spikes (floor), crates (solids tagged 'crate'), rings {x,y,r}
const hitEnemy=(w,b)=>{if(!w.enemies)return null;for(const e of w.enemies)if(e.alive!==false&&SR.overlap(b[0],b[1],b[2],b[3],[e.x,e.y,e.w,e.h]))return e;return null;};
const hitSpike=(w,b)=>{if(!w.spikes)return null;for(const sp of w.spikes)if(sp[3]!=='down'&&SR.overlap(b[0],b[1],b[2],b[3],[sp[0],sp[1]-16,sp[2],16]))return sp;return null;};
// the ring hook: a 45° ray up-forward from the chest, reach 300 u, a ring within 30 u of the ray [I]
function ringInReach(P,w,V){if(!w.rings)return null;const v=VERBS.hook,cx=P.x+W/2,cy=P.y+10,dx=P.facing*Math.SQRT1_2,dy=-Math.SQRT1_2;let best=null,bd=1e9;
  for(const r of w.rings){if(V&&V.lastRing===r)continue;const ex=r.x-cx,ey=r.y-cy,al=ex*dx+ey*dy;if(al<40||al>v.reach)continue;const perp=Math.abs(ex*dy-ey*dx);if(perp>30+(r.r||20)*0)continue;if(al<bd){bd=al;best=r;}}
  return best;}
function stepHook(P,V,k,dt){const a=V.hook.ring,L=V.hook.L,v=VERBS.hook;
  P.vy+=PHYS.gravity*dt;                                      // no fallMult, no airDrag while hooked
  const dir=(k.right?1:0)-(k.left?1:0);
  if(dir){const rx=P.x+W/2-a.x,ry=P.y+10-a.y,d=Math.hypot(rx,ry)||1,tx=-ry/d,ty=rx/d;const s=Math.sign(tx*dir)||dir;P.vx+=v.pump*dt*tx*s;P.vy+=v.pump*dt*ty*s;}
  let nx=P.x+P.vx*dt,ny=P.y+P.vy*dt;const dx=nx+W/2-a.x,dy=ny+10-a.y,d=Math.hypot(dx,dy);
  if(d>L){nx=a.x+dx/d*L-W/2;ny=a.y+dy/d*L-10;}                // project back onto the circle
  P.vx=(nx-P.x)/dt;P.vy=(ny-P.y)/dt;}
function releaseHook(P,V,jump){const v=VERBS.hook,sp=Math.hypot(P.vx,P.vy);if(sp>v.capV){P.vx*=v.capV/sp;P.vy*=v.capV/sp;}if(jump)P.vy=Math.min(P.vy,v.hopVy);V.lastRing=V.hook.ring;V.hook=null;}
// a jump out of the air: the bookkeeping step() does for a ground jump
function airJump(P,vy,vx){P.vy=vy;if(vx!=null)P.vx=vx;P.onGround=false;P.coyote=0;P.buffer=0;P.jumpCut=false;P.fromGround=true;P.holdT=0;P.peak=P.y+(P.h||H);P.airT=0;P.stretch=1;P.support=null;P.flipPending=false;P.flipOn=false;}
// ---------------------------------------------------------------- the state machine (§7 stepVerbs / STATES)
// each state: update(P,V,k,k2,o,w) -> next state or null; begin/end optional. k2 is the key set handed to step(), o its options.
const STATES={
  normal:{update(P,V,k,k2,o,w){const S=V.set,air=!P.onGround,dir=(k.right?1:0)-(k.left?1:0);
    if(k.katanaReleased&&V.armed&&S.dashSlash&&V.dashes>0)return 'dashSlash';            // iai release (F4 -> F1)
    if(V.hbuf>0&&air&&S.hook&&(V.hook=ringInReach(P,w,V)&&{ring:ringInReach(P,w,V),L:0}))return 'hook'; // Up + Katana near a ring (D1)
    if(k.katanaPressed&&air&&k.down&&S.pogo&&V.pogoCd<=0)return 'pogo';                  // Down + Katana in the air (F2)
    if(k.katanaPressed&&S.slash&&P.roll<=0)return 'slash';                                // tap (D4); hold past 24 steps arms
    if(k.dashPressed&&(S.dash||S.airDash)&&V.dashes>0&&V.dashCd<=0&&!(S.airDash&&!S.dash&&!air))return 'dash';
    if(k.down&&!air&&S.slide&&Math.abs(P.vx)>=VERBS.slide.minSpeed&&P.roll<=0&&o.jumpVy==null&&!k2.jumpPressed)return 'slide';
    if(k.down&&!air&&S.crouch&&P.roll<=0&&o.jumpVy==null&&!k2.jumpPressed)return 'crouch';
    if(k.down&&air&&S.pound&&V.wasDown===false&&!P.wasWall)return 'pound';
    if(k.down&&air&&S.stomp&&!S.pound&&!V.bounced&&P.vy<VERBS.stomp.vyMin){P.vy=VERBS.stomp.vyMin;V.stomp=true;}  // stomp: a fast fall, no state (B5); not inside a pogo bounce
    if(k.climb&&S.climb&&V.stamina>0&&P.wallDir!==0&&!P.onGround)return 'climb';
    if(k.jumpPressed&&air&&P.coyote<=0&&P.wallMemT<=0){
      if(S.doubleJump&&V.airJumps>0){V.airJumps--;airJump(P,VERBS.doubleJump.vy);k2.jumpPressed=false;V.ev.push({t:'djump'});}
      else if(S.dive&&!V.dove){k2.jumpPressed=false;return 'dive';}}
    if(k.jumpPressed&&!air&&S.charged&&Math.abs(P.vx)<20&&dir===0){k2.jumpPressed=false;return 'charged';}
    // glide and jetpack are rules, not states
    V.glide=!!(S.glide&&air&&k.jump&&P.vy>0&&!P.wasWall);if(V.glide)o.fallCap=PHYS.maxFall*VERBS.glide.fallMult;
    V.thrust=!!(S.jetpack&&k.jump);if(V.thrust){P.vy-=VERBS.jetpack.thrust*DT;if(P.vy<-VERBS.jetpack.terminal)P.vy=-VERBS.jetpack.terminal;o.fallCap=VERBS.jetpack.terminal;}
    return null;}},
  slash:{begin(P,V){V.ev.push({t:'verb',id:'slash'});},
    update(P,V,k,k2,o,w){const v=VERBS.slash;V.phase=phase(V.t,v.startup,v.active,v.recovery);
      if(V.phase==='active'){const e=hitEnemy(w,slashBox(P));if(e){e.alive=false;V.dashes=1;V.kills++;V.ev.push({t:'kill',x:e.x+e.w/2,y:e.y+e.h/2});}}
      if(k.jumpPressed&&canCancel('slash','jump',V.t))return 'normal';                    // jump cancels any phase
      if(k.down&&!P.onGround&&k.katanaPressed)return 'pogo';
      return V.phase==='done'?'normal':null;}},
  pogo:{begin(P,V){V.pogoCd=VERBS.pogo.cadence;V.ev.push({t:'verb',id:'pogo'});},
    update(P,V,k,k2,o,w){const v=VERBS.pogo;V.phase=phase(V.t,v.startup,v.active,v.recovery);
      if(P.onGround||V.phase==='done'||(!k.katana&&V.t>v.startup+2))return 'normal';
      if(V.phase==='active'){const b=pogoBox(P),e=hitEnemy(w,b),sp=e?null:hitSpike(w,b);
        if(e||sp){if(e){e.alive=false;V.kills++;}airJump(P,v.bounceVy);P.vy=v.bounceVy;V.dashes=1;P.lastWJ=0;V.bounced=true;V.ev.push({t:'bounce',x:P.x+W/2,y:b[1]+b[3],on:e?'enemy':'spike'});return 'normal';}}
      return null;}},
  dashSlash:{begin(P,V){const v=VERBS.dashSlash;V.dashes--;V.active=V.full?v.activeFull:v.active;P.vx=v.speed*P.facing;P.vy=0;V.armed=false;V.full=false;V.charge=0;V.after=[];V.ev.push({t:'verb',id:'dashSlash',steps:V.active});},
    update(P,V,k,k2,o,w){const v=VERBS.dashSlash;V.phase=phase(V.t,v.startup,V.active,v.recovery);
      if(V.phase==='startup'||V.phase==='active'){o.gravScale=0;o.lockVx=v.speed*P.facing;P.vy=0;if(V.t%2===0)V.after.push({x:P.x,y:P.y,f:P.facing,h:P.h});
        if(V.phase==='active'){const e=hitEnemy(w,slashBox(P));if(e){e.alive=false;V.dashes=1;V.kills++;V.ev.push({t:'kill',x:e.x+e.w/2,y:e.y+e.h/2});}}}
      if(V.phase==='recovery'){o.airControl=false;if(k.jumpPressed&&canCancel('dashSlash','jump',V.t,V.active))return 'normal';}
      if(P.wallDir!==0||(V.phase!=='startup'&&P.vx===0))return 'normal';                   // a wall ends it
      return V.phase==='done'?'normal':null;},
    end(P,V){const v=VERBS.dashSlash;P.vx=Math.sign(P.vx)*Math.min(Math.abs(P.vx),v.exit);V.phase='done';P.jumpCut=true;}},
  dash:{begin(P,V,k){const v=VERBS.dash,S=V.set;let dx=(k.right?1:0)-(k.left?1:0),dy=0;const dirs=S.dashDirs||v.dirs;if(dirs>=4&&(k.up||k.down)&&!(k.down&&P.onGround)){dy=k.up?-1:1;if(dirs<8)dx=0;}if(!dx&&!dy)dx=P.facing;
      V.dir=dx;V.dy=dy;if(dx)P.facing=dx;V.dashes--;V.dashCd=v.cooldown;V.dashLock=v.refillLock;V.after=[];if(dy<0){P.onGround=false;P.coyote=0;}P.jumpCut=true;P.fromGround=false;V.ev.push({t:'verb',id:'dash',dx,dy});},
    update(P,V,k,k2,o,w){const v=VERBS.dash;V.phase=phase(V.t,v.startup,v.active,v.recovery);
      if(V.phase!=='done'){o.gravScale=0;const sp=V.set.dashSpeed||v.speed;if(V.dy&&V.dir){o.lockVx=sp*V.dir*Math.SQRT1_2;P.vy=V.dy*sp*Math.SQRT1_2;}else if(V.dy){o.lockVx=0;P.vy=V.dy*sp;}else{o.lockVx=sp*V.dir;P.vy=0;}if(V.t%2===0)V.after.push({x:P.x,y:P.y,f:P.facing,h:P.h});
        if(k.jumpPressed&&V.set.dashJump&&!V.dy&&(P.onGround||P.coyote>0)){o.jumpVx=v.exit;V.ev.push({t:'verb',id:'dashJump'});return 'normal';}}
      if(P.wallDir!==0&&!V.dy)return 'normal';return V.phase==='done'?'normal':null;},
    end(P,V){const v=VERBS.dash;if(V.dy){P.vy=V.dy<0?P.vy*.75:Math.min(P.vy,v.exit);}else P.vx=Math.sign(P.vx)*Math.min(Math.abs(P.vx),v.exit);V.phase='done';}},
  slide:{begin(P,V,k,k2,o,w){setCrouch(P,w,true);V.ev.push({t:'verb',id:'slide'});},
    update(P,V,k,k2,o,w){o.phys=slidePhys();k2.left=k2.right=false;const cc=o.tuning&&o.tuning.cornerCorrect||0;
      if(k.jumpPressed&&V.set.slideJump&&(P.onGround||P.coyote>0)){o.jumpVy=622;o.jumpVx=546;if(setCrouch(P,w,false,cc)){V.ev.push({t:'verb',id:'slideJump'});return 'normal';}}
      if(k.katanaReleased&&V.armed&&V.set.dashSlash&&V.dashes>0&&setCrouch(P,w,false,cc))return 'dashSlash';
      if(V.t>=VERBS.slide.minSteps&&(!k.down||Math.abs(P.vx)<40)){if(!k.down&&setCrouch(P,w,false,cc))return 'normal';return V.set.crouch?'crouch':null;}
      if(!P.onGround&&P.vy>200){setCrouch(P,w,false,cc);return 'normal';}return null;}},
  slideStop:{update(P,V,k,k2,o,w){o.lockVx=0;k2.jumpPressed=false;if(V.t>=12){setCrouch(P,w,false,o.tuning&&o.tuning.cornerCorrect||0);return 'normal';}return null;}},
  crouch:{begin(P,V,k,k2,o,w){setCrouch(P,w,true);V.ev.push({t:'verb',id:'crouch'});},
    update(P,V,k,k2,o,w){const cc=o.tuning&&o.tuning.cornerCorrect||0;o.phys=crawlPhys();const free=canStand(P,w,0);
      if(k.jumpPressed&&!free){V.jbuf=16;}                                                     // pinned: the press waits 130 ms for a free step
      k2.jumpPressed=false;
      if((V.jbuf>0||k.jumpPressed||!k.down||!P.onGround)&&setCrouch(P,w,false,cc)){            // stand (with the 8 u sideways correction) and fire the waiting jump
        if(V.jbuf>0||k.jumpPressed){k2.jumpPressed=true;V.jbuf=0;}V.ev.push({t:'verb',id:'stand'});return 'normal';}
      if(k.down&&P.onGround&&V.set.slide&&Math.abs(P.vx)>=VERBS.slide.minSpeed)return 'slide';
      return null;}},
  dive:{begin(P,V){const v=VERBS.dive;P.vy=Math.min(P.vy,0);V.dove=true;V.ev.push({t:'verb',id:'dive'});},
    update(P,V,k,k2,o,w){const v=VERBS.dive;k2.jumpPressed=false;
      if(V.t<v.startup){o.airControl=false;return null;}
      if(V.t===v.startup){P.vx=v.vx*P.facing;setCrouch(P,w,true);V.ev.push({t:'verb',id:'lunge'});}
      o.airControl=false;o.lockVx=P.onGround?undefined:v.vx*P.facing;
      if(P.onGround){if(P.roll>0){setCrouch(P,w,false);return 'normal';}return 'prone';}return null;},
    end(P,V){}},
  prone:{begin(P,V){V.ev.push({t:'verb',id:'prone'});},update(P,V,k,k2,o,w){o.lockVx=0;k2.jumpPressed=false;if(V.t>=VERBS.dive.prone){setCrouch(P,w,false,8);return 'normal';}return null;}},
  pound:{begin(P,V){P.vx=0;P.jumpCut=true;P.fromGround=false;V.ev.push({t:'verb',id:'pound'});},
    update(P,V,k,k2,o,w){o.lockVx=0;o.airControl=false;k2.jumpPressed=false;if(!P.onGround){P.vy=VERBS.pound.fall;return null;}
      const s=P.support;if(s&&s[4]==='crate'){const i=w.solids.indexOf(s);if(i>=0)w.solids.splice(i,1);V.ev.push({t:'break',x:s[0]+s[2]/2,y:s[1]});P.onGround=false;}
      return 'poundLand';}},
  poundLand:{update(P,V,k,k2,o){o.lockVx=0;k2.jumpPressed=false;return V.t>=VERBS.pound.land?'normal':null;}},
  mantle:{begin(P,V,k,k2,o,w){const v=VERBS.mantle;P.vy=v.vy;P.vx=v.vx*V.dir;P.onGround=false;P.wallDir=0;P.wallMemT=0;V.ev.push({t:'mantle',x:P.x,y:P.y});},
    update(P,V,k,k2,o){o.lockVx=VERBS.mantle.vx*V.dir;o.airControl=false;k2.jumpPressed=false;return V.t>=VERBS.mantle.steps||P.onGround?'normal':null;}},
  wallRun:{begin(P,V){P.jumpCut=true;V.ev.push({t:'verb',id:'wallRun'});},
    update(P,V,k,k2,o){const v=VERBS.wallRun;o.gravScale=0;o.lockVx=0;P.vy=-v.rise/(v.steps*DT);
      if(k.jumpPressed)return 'normal';if(V.t>=v.steps||P.wallDir===0){P.vy=0;return 'normal';}return null;}},
  climb:{begin(P,V){V.dir=P.wallDir;P.vx=0;P.jumpCut=true;V.ev.push({t:'verb',id:'climb'});},
    update(P,V,k,k2,o,w){const v=VERBS.climb,up=k.up||(!k.down&&!k.up),down=k.down;o.gravScale=0;o.lockVx=0;
      const wall=SR.solidAt(w,V.dir<0?P.x-2:P.x+W,P.y+4,2,(P.h||H)-8);
      if(!k.climb||V.stamina<=0||P.onGround&&down)return 'normal';
      if(k.jumpPressed){V.stamina=Math.max(0,V.stamina-v.jumpCost);P.wallMem=V.dir;P.wallMemT=DT*2;return 'normal';}   // the climb jump costs a quarter
      if(!wall){P.vy=VERBS.mantle.vy;P.vx=VERBS.mantle.vx*V.dir;V.ev.push({t:'verb',id:'climbHop'});return 'normal';}       // over the top: Celeste's climb hop
      P.vy=down?v.speed:up?-v.speed:0;V.stamina=Math.max(0,V.stamina-DT/(down?6:up?v.stamina:10));P.wallMem=V.dir;P.wallMemT=DT*2;P.facing=V.dir;return null;}},
  charged:{begin(P,V){V.chargeT=0;V.ev.push({t:'verb',id:'charge'});},
    update(P,V,k,k2,o){const v=VERBS.charged;o.lockVx=0;k2.jumpPressed=false;V.chargeT=Math.min(v.maxHold,V.chargeT+1);
      if(!k.jump){const m=v.mult[0]+(v.mult[1]-v.mult[0])*V.chargeT/v.maxHold,dir=(k.right?1:0)-(k.left?1:0);airJump(P,-PHYS.jumpVel*m,dir?dir*PHYS.maxRun*.5:0);if(dir)P.facing=dir;V.locked=true;V.ev.push({t:'verb',id:'chargedJump',mult:m});return 'normal';}
      return null;}},
  hook:{begin(P,V,k,k2,o,w){const r=V.hook.ring,d=Math.hypot(P.x+W/2-r.x,P.y+10-r.y);V.hook.L=Math.max(VERBS.hook.minLen,d);V.hbuf=0;P.flipOn=false;P.flipPending=false;P.jumpCut=true;P.fromGround=false;V.ev.push({t:'hook',x:r.x,y:r.y,L:V.hook.L});},
    update(P,V,k,k2,o,w){stepHook(P,V,k,DT);o.gravScale=0;o.noAirDrag=true;o.airControl=false;k2.jumpPressed=false;
      if(!k.katana||P.onGround){releaseHook(P,V,k.jumpPressed||V.jbuf>0);V.ev.push({t:'release',vx:P.vx,vy:P.vy});return 'normal';}
      if(k.jumpPressed)V.jbuf=16;return null;}}};
// ---------------------------------------------------------------- stepV: the verb machine between input and movement, then step()
function stepV(P,k,dt,o){o=Object.assign({},o||{});const V=P.verb||(P.verb=newVerbs(o.set));if(o.set&&typeof o.set==='string')V.set=SETS[o.set];else if(o.set)V.set=o.set;
  const w=o.world||{solids:[]},S=V.set;V.ev=[];V.pvx=P.vx;V.t++;
  V.dashCd=Math.max(0,V.dashCd-1);V.dashLock=Math.max(0,V.dashLock-1);V.pogoCd=Math.max(0,V.pogoCd-1);V.jbuf=Math.max(0,V.jbuf-1);V.hbuf=Math.max(0,V.hbuf-1);V.flash=Math.max(0,V.flash-1);V.ringGrace=Math.max(0,V.ringGrace-1);
  // edges the step reads once: the katana press is the edge of its held bit; Up + Katana buffers a hook for 16 steps
  k.katanaPressed=k.katanaPressed||(k.katana&&!V.wasKatana);k.katanaReleased=k.katanaReleased||(!k.katana&&V.wasKatana);
  if(k.katanaPressed&&k.up&&S.hook)V.hbuf=VERBS.hook.buffer;
  // the iai hold: counts while the katana is held; arms at 24 steps, full at 36
  if(k.katana&&S.dashSlash){V.charge++;if(V.charge===VERBS.dashSlash.armSteps){V.armed=true;V.ev.push({t:'arm'});}if(V.charge>=VERBS.dashSlash.fullSteps)V.full=true;}
  else if(!k.katana){if(V.state!=='normal'&&V.state!=='slide')V.armed=false;V.charge=0;if(V.state!=='normal'&&V.state!=='slide'){V.full=false;}}
  const k2=Object.assign({},k);if(o.tuning==null)o.tuning={cornerCorrect:8,wallReach:7,wallRetain:.06,jumpHBoost:40,liftCapX:250,liftCapY:130};
  if(V.locked&&!P.onGround)o.airControl=false;else V.locked=false;
  let next=STATES[V.state].update(P,V,k,k2,o,w);
  if(next&&next!==V.state){const cur=STATES[V.state];if(cur.end)cur.end(P,V);V.state=next;V.t=0;V.phase='startup';const st=STATES[next];if(st.begin)st.begin(P,V,k,k2,o,w);
    // the entered state runs its first step at once (Celeste's Begin then Update), except the ones that want the press consumed
    const again=STATES[next].update(P,V,k,k2,o,w);if(again&&again!==next){if(STATES[next].end)STATES[next].end(P,V);V.state=again;V.t=0;if(STATES[again].begin)STATES[again].begin(P,V,k,k2,o,w);}}
  if(V.state==='hook'||V.state==='climb'||V.state==='wallRun')k2.left=k2.right=false;
  if(V.state==='crouch'||V.state==='slide'){if(P.onGround)k2.jump=k2.jump;}
  const ev=SR.step(P,k2,dt,o);
  const go=next=>{const cur=STATES[V.state];if(cur.end)cur.end(P,V);V.state=next;V.t=0;V.phase='startup';if(STATES[next].begin)STATES[next].begin(P,V,k,k2,o,w);};
  if(V.state==='slide'&&Math.abs(V.pvx)>100&&P.vx===0&&P.onGround){go('slideStop');V.ev.push({t:'verb',id:'slideStop'});}   // a slide into a wall is a 100 ms stand-up stop
  // mantle: automatic, no button; a wall top within 16 u above the head while holding toward it or rising slowly (C1)
  if(S.mantle&&V.state==='normal'&&!P.onGround&&P.h===H){const dir=(k.right?1:0)-(k.left?1:0);const reach=Math.max(2,o.tuning&&o.tuning.wallReach||2);for(const side of [1,-1]){const s=SR.solidAt(w,side>0?P.x+W:P.x-reach,P.y,reach,H-4);
      if(s&&!s.mv&&s[4]!=='tile'&&s[1]>=P.y-VERBS.mantle.reach&&s[1]<=P.y+6&&(dir===side||(P.vy<0&&-P.vy<200))&&!SR.solidAt(w,side>0?P.x+W:P.x-W,s[1]-H,W,H)){P.y=s[1]-H;V.dir=side;go('mantle');break;}}}
  // wall run: into a wall at 300 u/s or more while holding toward it (C2)
  if(S.wallRun&&V.state==='normal'&&!P.onGround&&P.wallDir!==0&&Math.abs(V.pvx)>=VERBS.wallRun.minVx&&((k.right?1:0)-(k.left?1:0))===P.wallDir&&V.lastWall!==P.wallDir){V.lastWall=P.wallDir;go('wallRun');}
  if(P.onGround)V.lastWall=0;
  // enemies kill on contact unless the dash-slash is active
  if(w.enemies&&!P.dead){const b=body(P),act=V.state==='dashSlash'&&V.phase==='active';for(const e of w.enemies)if(e.alive!==false&&SR.overlap(b[0],b[1],b[2],b[3],[e.x,e.y,e.w,e.h])){if(act){e.alive=false;V.dashes=1;V.kills++;V.ev.push({t:'kill',x:e.x+e.w/2,y:e.y+e.h/2});}else{P.dead=true;ev.push({t:'die',why:'enemy'});}}}
  // onLand: one code path resets the resources, as RefillDash() [V, S7]
  for(const e of ev)if(e.t==='land'||e.t==='touch'||e.t==='roll'){if(V.dashLock<=0&&V.dashes<1){V.dashes=1;V.flash=2;V.ev.push({t:'refill'});}V.airJumps=1;V.stamina=1;V.fuel=1;V.lastRing=null;V.dove=false;V.stomp=false;V.locked=false;V.bounced=false;}
  if(P.onGround&&V.state==='normal'&&V.dashes<1&&V.dashLock<=0){V.dashes=1;V.flash=2;V.ev.push({t:'refill'});}
  V.wasKatana=!!k.katana;V.wasDown=!!k.down;V.glideOn=V.glide;
  for(const e of V.ev)ev.push(e);return ev;}
// ---------------------------------------------------------------- poses per verb state (two angles each) and the blade
const VP={
  crouch:{hip:13,lean:.38,th:[1.35,1.05],sh:[2.3,2.1],ua:[.6,-.3],la:[.9,.6]},
  slide:{hip:11,lean:-.55,th:[1.75,1.25],sh:[.35,1.5],ua:[1.7,-1.5],la:[.3,.2]},
  dive:{hip:17,lean:1.3,th:[-.25,-.5],sh:[.25,.3],ua:[2.6,2.35],la:[.3,.3]},
  pound:{hip:14,lean:.25,th:[1.6,1.4],sh:[2.4,2.3],ua:[.9,-.9],la:[1.2,1.2]},
  mantle:{hip:18,lean:.65,th:[1.45,.3],sh:[1.8,.6],ua:[2.5,2.1],la:[-.7,-.5]},
  wallRun:{hip:21,lean:.5,th:[1.25,.1],sh:[1.4,.4],ua:[.8,-.9],la:[.7,.6]},
  climb:{hip:20,lean:.15,th:[.9,.3],sh:[1.2,.6],ua:[2.9,2.3],la:[-.4,-.3]},
  hang:{hip:22,lean:.02,th:[.4,-.25],sh:[.5,.3],ua:[3.0,2.85],la:[0,.05]},
  glide:{hip:22,lean:.05,th:[.3,-.3],sh:[.3,.2],ua:[1.5,-1.5],la:[0,0]},
  thrust:{hip:16,lean:.2,th:[1.2,1.0],sh:[1.8,1.6],ua:[.4,-.4],la:[1.0,1.0]},
  charge:{hip:12,lean:.5,th:[1.5,1.3],sh:[2.3,2.2],ua:[-.6,-.8],la:[.5,.4]},
  lunge:{hip:19,lean:.6,th:[1.3,-.6],sh:[.5,.9],ua:[1.9,-.7],la:[-.4,.6]},
  dash:{hip:20,lean:.72,th:[1.4,-.5],sh:[.6,1.0],ua:[2.2,-1.2],la:[-.3,.3]},
  pogo:{hip:18,lean:.3,th:[.9,.5],sh:[1.2,.8],ua:[.9,.4],la:[-.2,-.1]},
  sheathe:{hip:21,lean:.18,th:[.35,-.15],sh:[.3,.2],ua:[.4,-1.6],la:[1.9,.6]},
  slash:{hip:21,lean:.3,th:[.6,-.2],sh:[.6,.3],ua:[2.2,-.9],la:[-.3,.5]},
  prone:{hip:6,lean:1.45,th:[-.1,-.2],sh:[.1,.1],ua:[2.4,2.2],la:[.6,.6]}};
const targetPose0=SR.targetPose;
function targetPose(P,t){const V=P.verb;if(V){switch(V.state){
    case 'crouch':return VP.crouch;case 'slide':case 'slideStop':return VP.slide;case 'dive':return V.t<VERBS.dive.startup?SR.POSES.apex:VP.dive;case 'prone':return VP.prone;
    case 'pound':return VP.pound;case 'poundLand':return VP.crouch;case 'mantle':return VP.mantle;case 'wallRun':return VP.wallRun;case 'climb':return VP.climb;
    case 'hook':return VP.hang;case 'charged':return VP.charge;case 'dashSlash':return V.phase==='recovery'?VP.slash:VP.lunge;case 'dash':return VP.dash;case 'pogo':return VP.pogo;
    case 'slash':return VP.slash;}
    if(V.armed&&P.onGround&&Math.abs(P.vx)<30)return VP.sheathe;if(V.glide)return VP.glide;if(V.thrust)return VP.thrust;}
  return targetPose0(P,t);}
// blade angle for drawSamurai o.blade while a katana verb is live (null = sheathed on the back)
function bladeOf(P){const V=P.verb;if(!V)return null;const v=VERBS;
  if(V.state==='slash'){const ph=V.phase,k=ph==='startup'?0:ph==='active'?(V.t-v.slash.startup+1)/v.slash.active:1;return {blade:2.4-k*1.9,bladeLen:30};}
  if(V.state==='dashSlash')return {blade:V.phase==='recovery'?1.0:1.5,bladeLen:32};
  if(V.state==='pogo')return {blade:0,bladeLen:30};return null;}
// ---------------------------------------------------------------- visuals
function drawAfter(ctx,P,pose,o){const V=P.verb;if(!V||!V.after.length)return;const n=V.after.length;V.after.forEach((a,i)=>{SR.drawSamurai(ctx,pose,a.x+W/2,a.y+(a.h||H),a.f,{ghost:true,alpha:.08+.14*(i+1)/n,katana:false});});}
function drawSmear(ctx,P){const V=P.verb;if(!V||V.state!=='dashSlash'||V.phase!=='active')return;const b=slashBox(P),L=VERBS.dashSlash.speed*DT*V.active+b[2],x0=P.facing>0?P.x+W-L+b[2]:P.x+W-b[2];
  ctx.save();ctx.fillStyle='rgba(10,10,10,.10)';ctx.fillRect(Math.min(x0,x0+L),b[1],Math.abs(L),b[3]);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(b[0],b[1]+b[3]/2-1.5,b[2],3);ctx.restore();}
function drawBox(ctx,b,col){if(!b)return;ctx.save();ctx.strokeStyle=col||ink.red;ctx.lineWidth=1.2;ctx.setLineDash([3,3]);ctx.strokeRect(b[0]+.5,b[1]+.5,b[2]-1,b[3]-1);ctx.restore();}
function drawRope(ctx,P){const V=P.verb;if(!V||V.state!=='hook'||!V.hook)return;const r=V.hook.ring;ctx.save();ctx.strokeStyle=ink.ink;ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(P.x+W/2,P.y+10);ctx.stroke();ctx.restore();}
function drawRings(ctx,w,glow){if(!w.rings)return;for(const r of w.rings){ctx.save();ctx.strokeStyle=glow===r?ink.red:ink.ink;ctx.lineWidth=4;ctx.beginPath();ctx.arc(r.x,r.y,r.r||20,0,Math.PI*2);ctx.stroke();ctx.fillStyle=ink.grey2;ctx.fillRect(r.x-2,r.y-(r.r||20)-60,4,60-(r.r||20)+2);ctx.restore();}}
function drawEnemy(ctx,e,t){if(e.alive===false)return;ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h);const bob=Math.sin((t||0)*5+e.x)*1.5;ctx.fillStyle=ink.ink;ctx.beginPath();ctx.ellipse(0,-e.h/2+bob,e.w/2,e.h/2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=ink.paper;ctx.beginPath();ctx.arc(-e.w*.18,-e.h*.6+bob,2.6,0,Math.PI*2);ctx.arc(e.w*.18,-e.h*.6+bob,2.6,0,Math.PI*2);ctx.fill();ctx.fillStyle=ink.red;ctx.fillRect(-e.w/2,-e.h*.15,e.w,3);ctx.restore();}
function drawEnemies(ctx,w,t){if(w.enemies)for(const e of w.enemies)drawEnemy(ctx,e,t);}
function drawCrate(ctx,s){ctx.save();ctx.fillStyle=ink.paper;ctx.fillRect(s[0]+3,s[1]+3,s[2]-6,s[3]-6);ctx.strokeStyle=ink.ink;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(s[0]+6,s[1]+6);ctx.lineTo(s[0]+s[2]-6,s[1]+s[3]-6);ctx.moveTo(s[0]+s[2]-6,s[1]+6);ctx.lineTo(s[0]+6,s[1]+s[3]-6);ctx.stroke();ctx.restore();}
const drawSolids0=SR.drawSolids;
function drawSolids(ctx,w,c,o){drawSolids0(ctx,w,c,o);o=o||{};for(const s of w.solids)if(s[4]==='crate')drawCrate(ctx,s);drawRings(ctx,w,o.glowRing);drawEnemies(ctx,w,o.time);
  if(w.labels&&o.labels!==false)for(const [x,s] of w.labels)SR.text(ctx,s,x,SR.groundBelow(w,x)-64,{size:11,col:ink.grey,weight:600});}
function bar(ctx,x,y,w,h,frac,col){ctx.save();ctx.fillStyle=ink.paper;ctx.fillRect(x,y,w,h);ctx.strokeStyle=ink.ink;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=col||ink.red;ctx.fillRect(x+1,y+1,(w-2)*Math.max(0,Math.min(1,frac)),h-2);ctx.restore();}
// ---------------------------------------------------------------- the Verbs gym for the hero and the figures (G = 600 is the floor top)
const G=SR.G;
function gym(){return SR.makeCourse({width:4600,top:-320,deathY:G+330,finish:4400,checkpoints:[1500,3100],start:60,
  solids:[[0,G,1000,500],                                   // 1 the low corridor: 32 u under a 92 u block; Today jumps onto the block
    [520,G-124,110,92],
    [1200,G,480,500],                                       // 2 a 200 u gap for the slide-jump (both sets clear it, the low jump is faster)
    [1680,G-150,320,650],                                   // 3 the mantle lip: 150 u, 12 u over the jump; Today wall-jumps
    [2000,G,400,500],
    [2400,G+80,400,420],[2520,G-60,80,14,'tile'],           // 4 the pit: spikes at G+80 with two enemies; Today hops across a one-way tile
    [2800,G,800,500],                                       // 5 the enemy on the line; Today jumps over it
    [3600,G+150,400,350],[4000,G,600,500]],                 // 6 the ring over a 400 u gap; Today drops in and wall-jumps out
  spikes:[[2400,G+80,400]],
  enemies:[{x:2410,y:G+24,w:40,h:40,alive:true},{x:2660,y:G+24,w:40,h:40,alive:true},{x:3220,y:G-46,w:40,h:46,alive:true}],
  rings:[{x:3800,y:G-250,r:20}],
  labels:[[80,'1 CORRIDOR'],[1230,'2 SLIDE-JUMP'],[1700,'3 MANTLE'],[2420,'4 POGO'],[3000,'5 DASH-SLASH'],[3620,'6 HOOK']]});}
function resetGym(w){for(const e of w.enemies)e.alive=true;}
// ---------------------------------------------------------------- the verb-aware autopilot for the gym
function botV(P,w,st){const V=P.verb,S=V?V.set:{},k=K(),hh=P.h||H,feet=P.y+hh;st.jumpT=Math.max(0,(st.jumpT||0)-DT);st.steerT=Math.max(0,(st.steerT||0)-DT);
  let dir=1;if(st.steerT>0)dir=st.steer;
  const ahead=P.x+W+34,ground=SR.solidAt(w,ahead,feet-2,2,10,{vy:1,feet});
  const enemies=(w.enemies||[]).filter(e=>e.alive!==false);
  const eAhead=enemies.find(e=>e.x>P.x&&e.x-P.x-W<400&&Math.abs(e.y+e.h-feet)<10);
  const eBelow=enemies.find(e=>e.x+e.w>P.x-40&&e.x<P.x+W+300&&e.y>feet-60);
  const lowFar=S.slide&&SR.solidAt(w,P.x+W,feet-40,130,12)&&!SR.solidAt(w,P.x+W,feet-26,130,24);                 // a corridor within 130 u: no jump, slide late
  const lowAhead=lowFar&&SR.solidAt(w,P.x+W,feet-40,18,12);
  const gapSoon=S.slideJump&&!(S.pogo&&eBelow)&&!SR.solidAt(w,P.x+W+90,feet-2,2,10,{vy:1,feet})&&SR.solidAt(w,P.x+W+40,feet-2,2,10,{vy:1,feet});   // a gap 90 u out: slide into it, jump out of the slide
  const tallAhead=!lowFar&&!S.mantle&&SR.solidAt(w,P.x+W,feet-150,110,60);
  const wall=lowFar?null:(SR.solidAt(w,P.x+W,P.y+8,70,hh-16)||tallAhead);
  const under=hh<H&&SR.solidAt(w,P.x,P.y+hh-H,W,H-hh);
  const ring=S.hook&&w.rings&&w.rings[0];
  // wall jumps in the air (chimneys, the Today routes)
  const wtop=P.wallDir?SR.solidAt(w,P.wallDir>0?P.x+W:P.x-8,P.y,8,hh-4):null,mantleSoon=S.mantle&&wtop&&P.vy<0&&wtop[1]>P.y-70;
  if(!P.onGround&&P.wallDir!==0&&st.lastWall!==P.wallDir&&V.state!=='hook'&&V.state!=='mantle'&&!mantleSoon){st.lastWall=P.wallDir;k.jumpPressed=true;st.jumpT=.1;const chimney=SR.solidAt(w,P.wallDir>0?P.x-260:P.x+W+60,P.y-200,200,200+hh-30);st.steer=-P.wallDir;st.steerT=chimney?.5:.12;}
  if(P.onGround){st.lastWall=0;st.steerT=0;}
  if(P.onGround&&!k.jumpPressed){
    if(lowAhead||under||(gapSoon&&Math.abs(P.vx)>=300&&!lowFar)){k.down=true;}            // slide under the corridor (crawl if too slow), or slide into a gap
    else if(((!ground&&Math.abs(P.vx)>200)||wall)&&!(S.pogo&&eBelow&&!ground)){k.jumpPressed=true;st.jumpT=.35;}
    if(eAhead&&!S.dashSlash&&eAhead.x-P.x-W<90&&!k.jumpPressed){k.jumpPressed=true;st.jumpT=.3;}}
  if(V.state==='slide'&&!under&&S.slideJump&&!SR.solidAt(w,P.x+W+90,feet-2,2,10,{vy:1,feet}))k.down=true;   // keep the slide to the edge
  if(V.state==='slide'&&!ground&&!under){k.jumpPressed=true;st.jumpT=.3;}                   // slide-jump the gap
  // pogo: Down + Katana over an enemy or a spike while falling
  if(S.pogo&&!P.onGround&&P.vy>0){const cx=P.x+W/2,over=enemies.find(e=>e.x-6<cx&&cx<e.x+e.w+6&&e.y>feet-10&&e.y<feet+130);if(over){k.down=true;if(V.pogoCd<=0&&V.state!=='pogo'){k.katana=true;k.katanaPressed=true;st.katT=.05;st.jumpT=.35;}}}
  // dash-slash: arm 200 ms early, release with the enemy inside the kill line
  if(S.dashSlash&&eAhead&&P.onGround&&V.state!=='slide'){const d=eAhead.x-(P.x+W);if(d<420&&d>130)k.katana=true;else if(d<=130&&V.armed){k.katana=false;}else if(d<=130&&!V.armed)k.katana=true;}
  if(V.state==='dashSlash')k.katana=false;
  // hook: Up + Katana when the ring is in reach, pump forward, release on the way up past the ring
  if(ring&&!P.onGround&&V.state!=='hook'&&V.lastRing!==ring&&!(V.state==='pogo')){const r=ringInReach(P,w,V);if(r){k.up=true;k.katana=true;k.katanaPressed=true;}}
  if(V.state==='hook'){k.katana=true;const r=V.hook.ring;if(P.x>r.x+70&&P.vy<-150)k.katana=false;}
  if(st.katT>0){st.katT-=DT;k.katana=true;}
  if(V.state==='pogo')k.katana=true;
  if(st.jumpT>0)k.jump=true;
  if(dir>0)k.right=true;else if(dir<0)k.left=true;
  if(V.state==='hook')k.right=true;
  return k;}
Object.assign(SR,{VERBS,SETS,K,newVerbs,newPlayerV,stepV,STATES,phase,canCancel,canStand,setCrouch,slashBox,pogoBox,verbBox,ringInReach,stepHook,releaseHook,airJump,VP,targetPose,bladeOf,
  drawAfter,drawSmear,drawBox,drawRope,drawRings,drawEnemy,drawEnemies,drawCrate,drawSolids,bar,gym,resetGym,botV});
SR.course=(n=>name=>name==='gym'?gym():n(name))(SR.course);
})();

// ======================================================================
// demo runner: lazy init + pause offscreen (IntersectionObserver) + rAF
// ======================================================================
const DEMOS={};function reg(name,fn){DEMOS[name]=fn;}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let motion=!reduce;
const live=new Map();
function initDemo(el){if(live.has(el))return;const name=el.dataset.demo,fn=DEMOS[name];const rec={api:null,vis:true,kick:120};live.set(el,rec);
  if(!fn){console.warn('no demo',name);return;}
  rec.api=fn(el)||{};if(rec.api.tick)rec.api.tick(1/60);
  const kick=()=>{rec.kick=Math.max(rec.kick,150);ensureLoop();};
  el.addEventListener('input',kick);el.addEventListener('pointerdown',kick);el.addEventListener('click',kick);el.addEventListener('keydown',kick);el.addEventListener('pointermove',()=>{if(!motion)rec.kick=Math.max(rec.kick,20);ensureLoop();});}
let looping=false,last=0;
function ensureLoop(){if(!looping){looping=true;last=performance.now();requestAnimationFrame(loop);}}
function loop(now){const dt=Math.min(.05,(now-last)/1000)||1/60;last=now;let any=false;
  for(const [el,rec] of live){if(!rec.vis||!rec.api||!rec.api.tick)continue;if(motion||rec.kick>0){if(rec.kick>0)rec.kick--;rec.api.tick(dt);any=true;}}
  if(any||motion)requestAnimationFrame(loop);else looping=false;}
const io=new IntersectionObserver(es=>{for(const e of es){const el=e.target;if(e.isIntersecting){initDemo(el);live.get(el).vis=true;ensureLoop();}else if(live.has(el))live.get(el).vis=false;}},{rootMargin:'120px 0px'});

// ======================================================================
// page chrome: TOC, motion toggle, profiles open/close, index filter
// ======================================================================
function chrome(){
  const toc=$('#toc'),btn=$('#tocBtn'),scrim=$('#tocScrim');
  const setOpen=o=>{toc.classList.toggle('open',o);btn.setAttribute('aria-expanded',o);scrim.hidden=!o;};
  btn.addEventListener('click',()=>setOpen(!toc.classList.contains('open')));scrim.addEventListener('click',()=>setOpen(false));
  toc.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
  addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
  const links=$$('.toc a[data-sec]'),map=new Map(links.map(a=>[a.dataset.sec,a]));
  const sio=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const a=map.get(e.target.id);if(a){links.forEach(l=>l.classList.toggle('on',l===a));}}},{rootMargin:'-20% 0px -70% 0px'});
  map.forEach((a,id)=>{const s=document.getElementById(id);if(s)sio.observe(s);});
  const mb=$('#motionBtn');const sync=()=>{mb.textContent=motion?'Pause animations':'Play animations';mb.setAttribute('aria-pressed',!motion);};sync();
  mb.addEventListener('click',()=>{motion=!motion;sync();ensureLoop();});
  $$('[data-openall]').forEach(b=>b.addEventListener('click',()=>$$('details.tp').forEach(d=>d.open=true)));
  $$('[data-closeall]').forEach(b=>b.addEventListener('click',()=>$$('details.tp').forEach(d=>d.open=false)));
  const openHash=()=>{const h=location.hash.slice(1);const d=h&&document.getElementById(h);if(d&&d.tagName==='DETAILS')d.open=true;};addEventListener('hashchange',openHash);openHash();
  const q=$('#idxq');if(q){const rows=$$('#idxt tbody tr'),n=$('#idxn'),chips=$$('.chips[data-idx] button');
    const f=()=>{const v=q.value.trim().toLowerCase();let c=0;rows.forEach(r=>{const m=!v||v.split('|').some(t=>r.textContent.toLowerCase().includes(t));r.hidden=!m;if(m)c++;});n.textContent=`${c} of ${rows.length} entries`;
      chips.forEach(b=>b.classList.toggle('on',b.dataset.q===v));};
    q.addEventListener('input',f);chips.forEach(b=>b.addEventListener('click',()=>{q.value=q.value===b.dataset.q?'':b.dataset.q;f();}));f();}
  // sound toggles: any [data-sound] checkbox enables the audio context inside the click (gesture gate)
  $$('[data-sound]').forEach(cb=>cb.addEventListener('change',()=>{if(cb.checked)AUD.enable();}));
}
// vector canvases scale to the stage width through CSS (aspect-ratio); nothing to snap to whole pixels here
function crispAll(){}
document.addEventListener('DOMContentLoaded',()=>{chrome();$$('[data-demo]').forEach(el=>io.observe(el));});
