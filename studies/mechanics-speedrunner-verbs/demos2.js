"use strict";
// ======================================================================
// demos2 (Agent F, Mechanics #2): B6 and families C to H. 24 figures, vector ink on paper.
// Generic core.js helpers are used when they exist (reg, ctl, AUD). The game helpers come from
// core.js's SR namespace (SR.step, SR.drawSamurai, SR.drawSolids, SR.sfx, SR.text). Everything the
// report adds in §7 (the VERBS table, the verb state machine, the cancel table, the pendulum, the
// crouch rules, the two-byte input log) is ported literally into `local` below, so this file works
// whether or not core.js ever gains a verb layer. World units are the game's: hero 20x46 u,
// ground top y 600, step 1/120 s.
// ======================================================================
(()=>{
if(typeof SR==='undefined'){console.warn('demos2: core.js SR namespace missing');return;}
const REG=typeof reg==='function'?reg:(n)=>console.warn('no runner for',n);
const CL=(v,a,b)=>v<a?a:v>b?b:v,LP=(a,b,t)=>a+(b-a)*t;
const RNG=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const QQ=(s,r=document)=>[...r.querySelectorAll(s)];
const CTL=typeof ctl==='function'?ctl:root=>{const gk=k=>root.querySelector(`[data-k="${k}"]`);return {el:gk,v:k=>{const e=gk(k);return e.type==='checkbox'?e.checked:+e.value;},
  set:(k,v)=>{const e=gk(k);if(!e)return;if(e.type==='checkbox')e.checked=!!v;else e.value=v;},
  on:(k,fn)=>{const e=gk(k);if(e){e.addEventListener('input',fn);e.addEventListener('change',fn);}},out:(k,t)=>{const o=root.querySelector(`[data-o="${k}"]`);if(o)o.textContent=t;},
  btn:(k,fn)=>{const e=root.querySelector(`[data-b="${k}"]`);if(e)e.addEventListener('click',()=>fn(e));return e;},
  seg:(k,fn)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(!s)return;s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;QQ('button',s).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);});},
  segv:k=>{const b=root.querySelector(`[data-seg="${k}"] button.on`);return b?b.dataset.v:null;},
  setSeg:(k,v)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(s)QQ('button',s).forEach(x=>x.classList.toggle('on',x.dataset.v===String(v)));}};};
const AU=typeof AUD!=='undefined'?AUD:{on:false,enable(){},disable(){}};

// ---------- ink, text, stage, idle, fixed step --------------------------
const {PHYS,W:PW,H:PH,BL,DT,G,ink}=SR;
const INK=ink.ink,RED=ink.red,GREY=ink.grey,LIGHT=ink.grey2,PALE=ink.grey3,PAPER=ink.paper,GREEN=ink.green,GOLD=ink.gold,BLUE=ink.blue,MUTE='#6f6a63',PINK='#fde8e6';
const T=(c,s,x,y,o={})=>SR.text(c,s,x,y,{size:o.s||12,col:o.col,align:o.al,base:o.bl,weight:o.w||400,mono:o.mono});
const TW=(c,s,o={})=>{c.font=`${o.w||400} ${o.s||12}px ${o.mono?SR.MONO:SR.SANS}`;return c.measureText(String(s)).width;};
function label(c,s,x,y,o={}){const w=TW(c,s,o)+8,h=(o.s||12)+6;c.fillStyle=o.bg||PAPER;c.globalAlpha=o.a==null?.88:o.a;c.fillRect(o.al==='center'?x-w/2:o.al==='right'?x-w:x-4,y-h+4,w,h);c.globalAlpha=1;T(c,s,x,y,o);}
function dash(c,x0,y0,x1,y1,col=LIGHT,d=[3,3],lw=1){c.save();c.strokeStyle=col;c.lineWidth=lw;c.setLineDash(d);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function box(c,x,y,w,h,col,fill){c.save();c.strokeStyle=col;c.lineWidth=1;c.setLineDash([3,2]);if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}c.strokeRect(x,y,w,h);c.restore();}
function arrow(c,x0,y0,x1,y1,col=INK,lw=1.2){c.save();c.strokeStyle=col;c.fillStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();const a=Math.atan2(y1-y0,x1-x0);c.beginPath();c.moveTo(x1,y1);c.lineTo(x1-7*Math.cos(a-.4),y1-7*Math.sin(a-.4));c.lineTo(x1-7*Math.cos(a+.4),y1-7*Math.sin(a+.4));c.closePath();c.fill();c.restore();}
const fmtMs=ms=>(ms/1000).toFixed(2)+' s';
const BLf=u=>(u/BL).toFixed(1)+' BL';
function stage(root,i=0){const cv=QQ('canvas',root)[i],W=+cv.getAttribute('width'),H=+cv.getAttribute('height');const dpr=Math.min(2,window.devicePixelRatio||1);
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}const c=cv.getContext('2d');
  return {cv,c,W,H,dpr,begin(bg=PAPER){c.setTransform(dpr,0,0,dpr,0,0);c.globalAlpha=1;c.setLineDash([]);c.fillStyle=bg;c.fillRect(0,0,W,H);c.lineCap='round';c.lineJoin='round';},
    pos(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];},
    world(cam,sc,ox=0,oy=0){c.setTransform(dpr*sc,0,0,dpr*sc,dpr*(ox-cam.x*sc),dpr*(oy-cam.y*sc));},
    ui(){c.setTransform(dpr,0,0,dpr,0,0);}};}
// idle tracker: a figure plays alone after 2 s without input
function idler(root){const I={t:performance.now()-3000,touch(){I.t=performance.now();},get idle(){return performance.now()-I.t>2000;}};
  for(const ev of ['pointerdown','keydown','input','change'])root.addEventListener(ev,()=>I.touch(),true);return I;}
const slow=q=>{const e=q.el&&q.el('slow');return e&&e.checked?.25:1;};
function fixed(hz=120){let acc=0;const dt=1/hz;return (sec,fn)=>{acc+=sec;let n=0;while(acc>=dt&&n<16){acc-=dt;fn(dt);n++;}if(n>=16)acc=0;return n;};}
const RO=(root,html)=>{const r=root.querySelector('[data-ro]');if(r)r.innerHTML=html;};
// sound button: data-b="snd" with aria-pressed; sounds only after this click (gesture gate)
function sndBtn(root,q){const b=q.btn('snd',e=>{const on=e.getAttribute('aria-pressed')!=='true';if(on)AU.enable();else AU.disable();e.setAttribute('aria-pressed',on);e.textContent=on?'Sound on':'Sound off';});return ()=>!!b&&b.getAttribute('aria-pressed')==='true';}
const SFX=(snd,n,o)=>{if(snd&&snd()&&AU.on)SR.sfx(n,o);};
// the verb voices the report adds (§7 layer 8): sheathe on arm, a noise burst with a sweep on the dash-slash, a ping per kill, the jump an octave lower for the pogo
function vfx(snd,n){if(!(snd&&snd()&&AU.on&&AU.ctx))return;const a=AU.ctx,t=a.currentTime;try{
  const tone=(f1,f2,dur,v,wave='triangle')=>{const o=a.createOscillator(),gn=a.createGain();o.type=wave;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+dur);gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn).connect(a.destination);o.start(t);o.stop(t+dur+.02);};
  const noise=(dur,v,f1,f2)=>{const b=a.createBuffer(1,Math.floor(a.sampleRate*dur),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=a.createBufferSource(),f=a.createBiquadFilter(),gn=a.createGain();f.type='bandpass';f.frequency.setValueAtTime(f1,t);f.frequency.exponentialRampToValueAtTime(f2,t+dur);gn.gain.value=v;s.buffer=b;s.connect(f).connect(gn).connect(a.destination);s.start(t);};
  switch(n){case 'dashslash':noise(.04,.3,1200,2400);break;case 'ping':tone(1800,1800,.08,.06,'sine');break;case 'pogo':tone(210,380,.09,.07);break;case 'whoosh':noise(.12,.15,400,1600);break;case 'click':tone(1400,900,.03,.06,'square');break;case 'arm':tone(900,600,.05,.08,'square');break;}}catch(_){}}

// ======================================================================
// local: the report's §7 verb layer, ported literally (VERBS, phase, canCancel, the state machine,
// onLand, stepHook, releaseHook, setCrouch, canStand, logByte, encodeInputs). Where the pseudocode
// is silent or inconsistent the figure's choice is noted in notes/scratch-figF/REPORT-ISSUES.md.
// ======================================================================
const local={};
local.VERBS={                 // steps at 120 Hz; speeds in u/s; the recommended set first
  slash:     { startup: 2, active: 4,  recovery: 6,  cadence: 12, box: [50, 40], cancelInto: { jump: 'any' } },
  pogo:      { startup: 2, active: 24, recovery: 0,  cadence: 12, box: [40, 50], bounceVy: -830, cancelInto: { land: 'any' } },
  dashSlash: { startup: 2, active: 12, activeFull: 18, recovery: 6, speed: 840, exit: 546, uses: 1,
               armSteps: 24, fullSteps: 36, iframes: 'projectiles', cancelInto: { jump: 'recovery', wall: 'any' } },
  slide:     { startup: 0, minSteps: 14, friction: 600, minSpeed: 280, box: [20, 26], cancelInto: { jump: 'any', stand: 'any' } },
  crouch:    { box: [20, 26], crawl: 120 },
  stomp:     { vyMin: 700 },
  mantle:    { reach: 16, vy: -300, vx: 200, steps: 12 },
  hook:      { angle: 45, speed: 1700, reach: 300, minLen: 90, pump: 900, capV: 760, hopVy: -500, buffer: 16, ringGrace: 10 },
  dash:      { startup: 1, active: 18, recovery: 0, cooldown: 24, speed: 1120, exit: 546, uses: 1, refillLock: 12, dirs: 2 },
  doubleJump:{ vy: -705 }, glide: { fallMult: 0.25 }, climb: { speed: 210, stamina: 2.4, jumpCost: 0.25, tired: 0.2 },
  wallRun:   { minVx: 300, rise: 92, steps: 30 }, dive: { startup: 14, vx: 600, prone: 30 }, pound: { fall: 1150, land: 18 },
  charged:   { maxHold: 72, mult: [0.6, 1.5] }, jetpack: { thrust: 3500, terminal: 600 }, slowTime: { scale: 0.3, meter: 1.0, refill: 1 / 3 },
};
const VERBS=local.VERBS;
local.phase=function(t,startup,active,recovery){if(t<startup)return 'startup';if(t<startup+active)return 'active';if(t<startup+active+recovery)return 'recovery';return 'done';};
local.canCancel=function(verb,into,t,activeOverride){const v=VERBS[verb],rule=v.cancelInto&&v.cancelInto[into];return rule==='any'||rule===local.phase(t,v.startup||0,activeOverride==null?(v.active||0):activeOverride,v.recovery||0);};
local.onLand=function(S){S.dashes=1;S.wallJumpSame=false;S.stamina=1;};   // one code path, as RefillDash() [V, S7]
// the pendulum: Fristrom's constraint, run before the collision pass, gravity symmetric while hooked
local.stepHook=function(p,a,L,k,dt){const pump=VERBS.hook.pump;
  p.vy+=PHYS.gravity*dt;                                    // no fallMult, no airDrag while hooked
  // the report adds the pump to vx; this port applies it along the rope tangent (REPORT-ISSUES)
  const rx=p.x-a.x,ry=p.y-a.y,d0=Math.hypot(rx,ry)||1,tx=-ry/d0,ty=rx/d0,dir=(k.right?1:0)-(k.left?1:0);
  p.vx+=dir*pump*dt*tx*Math.sign(tx||1);p.vy+=dir*pump*dt*ty*Math.sign(tx||1);
  let nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;
  const dx=nx-a.x,dy=ny-a.y,d=Math.hypot(dx,dy);
  if(d>L){nx=a.x+dx/d*L;ny=a.y+dy/d*L;}                     // project back onto the circle
  p.vx=(nx-p.x)/dt;p.vy=(ny-p.y)/dt;                          // velocity from the corrected move
  p.x=nx;p.y=ny;};
local.releaseHook=function(p,jumpBuffered,cap){const v=Math.hypot(p.vx,p.vy);cap=cap==null?VERBS.hook.capV:cap;
  if(cap&&v>cap){p.vx*=cap/v;p.vy*=cap/v;}
  if(jumpBuffered){p.vy=Math.min(p.vy,VERBS.hook.hopVy);}return v;};
// crouch: a hitbox swap with the feet fixed; standing tests solids only; a crouched body never enters the wall kit
local.canStand=function(p,solids,cornerCorrect=8){for(let n=0;n<=cornerCorrect;n++)for(const s of (n?[n,-n]:[0])){const b={x:p.x+s,y:p.y+p.h-46,w:20,h:46};
  if(!solids.some(S=>S[4]!=='tile'&&b.x<S[0]+S[2]&&b.x+b.w>S[0]&&b.y<S[1]+S[3]&&b.y+b.h>S[1])){p.x+=s;return true;}}return false;};
local.setCrouch=function(p,on,solids){const h=on?VERBS.crouch.box[1]:46;if(!on&&!local.canStand(p,solids))return false;p.y+=p.h-h;p.h=h;return true;};
local.wallProbe=function(p,probe){return p.h<46?0:probe(p);};
// the input log: L R U D Jh Jp Kh Dp, then [runLength, bits] pairs
local.logByte=function(k){return (k.left?1:0)|((k.right?1:0)<<1)|((k.up?1:0)<<2)|((k.down?1:0)<<3)|((k.jump?1:0)<<4)|((k.jumpPressed?1:0)<<5)|((k.katana?1:0)<<6)|((k.dashPressed?1:0)<<7);};
local.encodeInputs=function(log){const out=[];if(!log.length)return new Uint8Array(0);let cur=log[0],run=0;
  for(const b of log){if(b===cur&&run<255){run++;continue;}out.push(run,cur);cur=b;run=1;}
  out.push(run,cur);return new Uint8Array(out);};
local.encode1=function(log){const out=[];if(!log.length)return new Uint8Array(0);let cur=log[0]&31,run=0;   // Mechanics #1: 5 bits plus a 3-bit run in one byte (run 1..8)
  for(const b0 of log){const b=b0&31;if(b===cur&&run<8){run++;continue;}out.push(cur|((run-1)<<5));cur=b;run=1;}out.push(cur|((run-1)<<5));return new Uint8Array(out);};
local.hash=function(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,'0');};

// ---------- verb poses (one per verb state, §7 layer 7) --------------------
const VP={
  crouch:{hip:9,lean:1.0,th:[1.5,-1.3],sh:[2.4,2.2],ua:[.5,-.2],la:[.6,.6]},
  slide:{hip:6,lean:1.3,th:[.4,-.9],sh:[.4,1.9],ua:[-.9,-1.3],la:[.5,.3]},
  lunge:{hip:16,lean:1.05,th:[1.5,-.7],sh:[1.0,.5],ua:[1.7,-2.3],la:[.1,.2]},
  stab:{hip:21,lean:-.05,th:[.6,-.6],sh:[1.1,1.3],ua:[.3,.2],la:[.5,.5]},
  sheathe:{hip:21,lean:.2,th:[.35,-.3],sh:[.5,.4],ua:[.25,-1.5],la:[1.3,.6]},
  plant:{hip:19,lean:.55,th:[1.4,.1],sh:[1.9,.6],ua:[2.7,-1.0],la:[.2,.5]},
  hang:{hip:22,lean:0,th:[.3,-.25],sh:[.5,.4],ua:[3.0,-3.0],la:[.1,.1]},
  wallrun:{hip:20,lean:.55,th:[1.3,-.1],sh:[1.6,.8],ua:[1.0,-.8],la:[.6,.5]},
  climb:{hip:19,lean:.15,th:[1.3,.3],sh:[1.5,.9],ua:[2.8,-2.6],la:[.3,.4]},
  dive:{hip:19,lean:1.5,th:[.1,-.2],sh:[.2,.3],ua:[1.9,-1.9],la:[.2,.2]},
  glide:{hip:21,lean:0,th:[.4,-.4],sh:[.5,.5],ua:[1.9,-1.9],la:[.3,.3]},
  thrust:{hip:21,lean:.25,th:[.9,0],sh:[1.4,.8],ua:[.7,-.5],la:[1.1,1.1]},
  charge:{hip:13,lean:.55,th:[1.1,-.6],sh:[2.1,1.7],ua:[.8,-.5],la:[.9,.9]},
  prone:{hip:3,lean:1.55,th:[.2,.1],sh:[.1,.1],ua:[1.5,-1.4],la:[.3,.3]},
};

// ---------- a runner: SR.step wrapped with the §7 verb state machine --------
const TUN={cornerCorrect:8,wallReach:7,wallRetain:.06};
const slashBox=P=>P.facing>0?[P.x+PW,P.y+6,50,40]:[P.x-50,P.y+6,50,40];
const pogoBox=(P,h)=>[P.x+PW/2-20,P.y+PH,40,h||VERBS.pogo.box[1]];
const ov=(b,s)=>b[0]<s[0]+s[2]&&b[0]+b[2]>s[0]&&b[1]<s[1]+s[3]&&b[1]+b[3]>s[1];
function newVerb(){return {state:'normal',t:0,holdK:0,armed:false,charge:0,dashes:1,active:12,mantle:0,cool:0,buf:{jump:0,katana:0,dash:0},prevK:false,trail:[],flash:0,smear:0,kills:0,pogos:0,ev:[],lastT:'',prev:'normal'};}
function mkR(w,x,feetY){const P=SR.newPlayer(x,feetY==null?G:feetY);return {w,P,S:newVerb(),pose:SR.newPose(),parts:[],time:0,steps:0,opt:{},
  reset(x2,y2){const n=SR.newPlayer(x2==null?x:x2,y2==null?(feetY==null?G:feetY):y2);Object.assign(this.P,n);this.S=newVerb();this.parts.length=0;this.time=0;this.steps=0;for(const mv of (w.movers||[])){mv.cur=null;mv.prev=null;}}};}
// kills: enemies in w.foes {x,y,w,h,alive,spike}; a kill refunds the dash-slash (F1)
function sweep(R,b,snd){let n=0;for(const e of (R.w.foes||[])){if(e.alive!==false&&ov(b,[e.x,e.y,e.w,e.h])){e.alive=false;e.dieT=0;n++;R.S.dashes=1;R.S.flash=2;R.S.kills++;vfx(snd,'ping');}}return n;}
function pogoHit(R,b){for(const e of (R.w.foes||[]))if(e.alive!==false&&ov(b,[e.x,e.y,e.w,e.h]))return e;
  for(const sp of (R.w.spikes||[]))if(sp[3]!=='down'&&ov(b,[sp[0]+4,sp[1]-16,sp[2]-8,16]))return sp;return null;}
const STATES={
  normal:{update(R,k){const P=R.P,S=R.S,air=!P.onGround,o=R.opt;
    if(k.katanaReleased&&S.armed&&S.dashes>0&&o.dashSlash!==false)return 'dashSlash';          // iai release (F4 -> F1)
    if(S.buf.katana&&air&&k.up&&R.ringInReach&&R.ringInReach()){S.buf.katana=0;return 'hook'; } // Up + Katana near a ring (D1)
    if(S.buf.katana&&air&&k.down&&o.pogo!==false){S.buf.katana=0;return 'pogo';}               // Down + Katana in the air (F2)
    if(S.buf.katana){S.buf.katana=0;return 'slash';}                                           // tap (D4); hold past 24 steps arms
    if(k.down&&!air&&Math.abs(P.vx)>=VERBS.slide.minSpeed&&o.slide!==false)return 'slide';
    if(k.down&&!air&&o.crouch!==false)return 'crouch';
    if(k.down&&air&&P.vy<VERBS.stomp.vyMin&&o.stomp!==false&&P.wallDir===0){P.vy=VERBS.stomp.vyMin;S.stomped=true;}   // stomp: a fast fall, no state (B5)
    return null;}},
  slash:{begin(R){R.S.hit=false;R.S.smear=0;},
    update(R,k){const S=R.S,v=VERBS.slash,ph=local.phase(S.t,v.startup,v.active,v.recovery);
      if(ph==='active')sweep(R,slashBox(R.P),R.snd);
      if(S.buf.jump&&local.canCancel('slash','jump',S.t))return 'normal';
      return ph==='done'?'normal':null;}},
  dashSlash:{begin(R){const P=R.P,S=R.S,v=VERBS.dashSlash;S.dashes--;S.active=R.opt.dsActive!=null?R.opt.dsActive:(S.charge>=v.fullSteps?v.activeFull:v.active);P.vx=v.speed*P.facing;P.vy=0;S.armed=false;S.holdK=0;S.trail=[];S.smear=0;S.kills0=S.kills;vfx(R.snd,'dashslash');
      SR.dust(R.parts,P.x+PW/2,P.y+PH,10,-P.facing*.5,-.3,1.2);},
    update(R,k){const P=R.P,S=R.S,v=VERBS.dashSlash,ph=local.phase(S.t,v.startup,S.active,v.recovery);
      if(ph==='active'){P.vx=v.speed*P.facing;P.vy=0;sweep(R,slashBox(P),R.snd);if(S.t%2===0)S.trail.push({x:P.x,y:P.y,f:P.facing,t:0});S.smear=S.t-v.startup+1;}
      if(ph==='recovery'&&S.buf.jump)return 'normal';                              // jump cancels the recovery, not the active
      if(P.wallDir!==0&&ph!=='startup')return 'normal';                              // a wall ends it into the slide
      return ph==='done'?'normal':null;},
    end(R){const P=R.P;P.vx=Math.sign(P.vx)*Math.min(Math.abs(P.vx),VERBS.dashSlash.exit);}},
  pogo:{begin(R){R.S.bounced=false;},
    update(R,k){const P=R.P,S=R.S,v=VERBS.pogo,ph=local.phase(S.t,v.startup,v.active,v.recovery);
      if(ph==='active'){const e=pogoHit(R,pogoBox(P,R.opt.pogoH));if(e){P.vy=v.bounceVy;P.fromGround=true;P.jumpCut=false;P.holdT=0;P.peak=P.y+PH;S.dashes=1;S.bounced=true;S.pogos++;S.flash=2;S.smear=1;
          if(e.alive!==undefined){e.alive=false;e.dieT=0;}SR.dust(R.parts,P.x+PW/2,P.y+PH+30,6,0,-1,.8);vfx(R.snd,'pogo');return 'normal';}}
      if(P.onGround)return 'normal';
      if(!k.katana&&S.t>v.startup+1)return 'normal';
      return ph==='done'?'normal':null;}},
  slide:{begin(R){R.S.low=true;},update(R,k){const P=R.P,S=R.S,v=VERBS.slide;
      if(S.buf.jump)return 'normal';                                                 // the slide-jump (B2): handled on the jump event
      if(!P.onGround)return 'normal';
      if(S.t>=v.minSteps&&(!k.down||Math.abs(P.vx)<40))return k.down?'crouch':'normal';
      return null;},end(R){R.S.low=false;}},
  crouch:{begin(R){R.S.low=true;},update(R,k){const P=R.P,S=R.S;if(!P.onGround)return 'normal';if(!k.down)return 'normal';if(S.buf.jump)return 'normal';return null;},end(R){R.S.low=false;}},
  hook:{update(R,k){return R.hookUpdate?R.hookUpdate(k):'normal';}},
};
// one physics step with the verb layer between input and movement (§7 stepVerbs), then SR.step
function stepR(R,k,dt,o){o=o||{};const P=R.P,S=R.S,B=S.buf;S.prev=S.state;S.ev=[];if(globalThis.__FIGDBG)globalThis.__FIGDBG(R,k);
  k.katanaPressed=!!k.katana&&!S.prevK;k.katanaReleased=!k.katana&&S.prevK;S.prevK=!!k.katana;
  for(const b of ['jump','katana','dash'])B[b]=k[b+'Pressed']?16:Math.max(0,B[b]-1);
  if(k.katana&&S.state!=='pogo'&&S.state!=='hook'){S.holdK++;if(S.holdK===VERBS.dashSlash.armSteps&&R.opt.dashSlash!==false){S.armed=true;S.flash=2;S.ev.push('arm');vfx(R.snd,'arm');}if(S.holdK===VERBS.dashSlash.fullSteps&&S.armed){S.flash=2;S.ev.push('full');}}
  else if(!k.katana&&!k.katanaReleased)S.holdK=0;
  S.charge=S.holdK;
  const next=STATES[S.state].update(R,k);
  if(next&&next!==S.state){STATES[S.state].end&&STATES[S.state].end(R);S.state=next;S.t=0;STATES[next].begin&&STATES[next].begin(R,k);S.ev.push('enter:'+next);}
  if(k.katanaReleased){S.armed=false;S.holdK=0;}
  S.t++;
  const st=S.state,dsPh=st==='dashSlash'?local.phase(S.t,VERBS.dashSlash.startup,S.active,VERBS.dashSlash.recovery):null;
  const allowJump=st==='normal'||st==='slash'||st==='slide'||st==='crouch'||(st==='dashSlash'&&dsPh==='recovery');
  const keys={left:!!k.left,right:!!k.right,jump:!!k.jump||(allowJump&&B.jump>0),jumpPressed:allowJump&&B.jump>0};
  if(st==='dashSlash'||st==='slide'){keys.left=keys.right=false;}                   // air control locked like wallLock; the slide steers nothing
  if(st==='hook'){R.time+=dt;R.steps++;poseTick(R,dt);return [];}
  const vx0=P.vx,ground0=P.onGround;
  const ev=SR.step(P,keys,dt,Object.assign({world:R.w,time:R.time,tuning:TUN},o));
  if(st==='slide'&&P.onGround){const ax=Math.abs(vx0),sv=Math.sign(vx0)||P.facing;P.vx=sv*Math.max(0,ax-VERBS.slide.friction*dt);}
  if(st==='crouch'&&P.onGround){P.vx=CL(P.vx,-VERBS.crouch.crawl,VERBS.crouch.crawl);}
  for(const e of ev){if(e.t==='jump'||e.t==='wall'||e.t==='climb'||e.t==='hyper'){B.jump=0;if(st==='slide'&&e.t==='jump'){P.vx=546*P.facing;P.vy=-622;P.hyper=true;e.t='hyper';}}
    if(e.t==='land'||e.t==='touch'||e.t==='roll')local.onLand(S);}
  if(!ground0&&P.onGround&&S.stomped){S.stomped=false;}
  R.time+=dt;R.steps++;poseTick(R,dt);SR.spawnDust(R.parts,ev);
  for(const e of (R.w.foes||[]))if(e.alive===false)e.dieT=(e.dieT||0)+dt;
  return ev;}
function poseTick(R,dt){const P=R.P,S=R.S;let tgt;const st=S.state;
  if(st==='dashSlash')tgt=VP.lunge;else if(st==='pogo')tgt=VP.stab;else if(st==='slide')tgt=VP.slide;else if(st==='crouch')tgt=VP.crouch;else if(st==='hook')tgt=VP.hang;
  else if(S.mantle>0)tgt=VP.plant;else if(S.armed&&P.onGround&&Math.abs(P.vx)<60)tgt=VP.sheathe;else tgt=SR.targetPose(P,R.time);
  R.pose=SR.blend(R.pose,tgt,1-Math.exp(-26*dt));SR.updParts(R.parts,dt);
  for(const a of S.trail)a.t+=dt;S.trail=S.trail.filter(a=>a.t<.22);S.flash=Math.max(0,S.flash-1);if(S.mantle>0)S.mantle--;}
// draw the hero with its verb reads: afterimages, the smear, the blade, the kimono tint for a spent charge, the 2-step flash
function drawR(c,R,o){o=o||{};const P=R.P,S=R.S,x=P.x+PW/2,y=P.y+PH;
  for(const a of S.trail)SR.drawSamurai(c,VP.lunge,a.x+PW/2,a.y+PH,a.f,{ghost:true,alpha:.45*(1-a.t/.22),katana:false});
  const op={flap:P.flap,grip:P.grip,clock:R.time,kim:S.dashes<=0&&R.opt.dashSlash!==false?'#9a9a9a':undefined};
  if(P.roll>0)op.rot=(1-P.roll/PHYS.rollTime)*Math.PI*2*P.facing;else if(P.flipOn)op.rot=P.flip*Math.PI*2*P.flipDir*P.facing;
  const st=S.state;
  if(st==='slash'){const v=VERBS.slash,tt=S.t/(v.startup+v.active+v.recovery);op.blade=LP(-1.3,1.6,tt);op.grip=0;
    if(local.phase(S.t,v.startup,v.active,v.recovery)==='active'){c.save();c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();c.arc(x+P.facing*22,y-20,36,P.facing>0?-1.2:Math.PI-.9,P.facing>0?.9:Math.PI+1.2);c.stroke();c.restore();}}
  if(st==='dashSlash'){op.blade=Math.PI/2;op.grip=0;op.flap=-.6;
    if(S.smear>0&&S.smear<=2){c.save();c.strokeStyle=PAPER;c.lineWidth=5;c.beginPath();c.moveTo(x-P.facing*10,y-24);c.lineTo(x+P.facing*(S.active*7+50),y-24);c.stroke();c.strokeStyle=INK;c.lineWidth=1.5;c.stroke();c.restore();}}
  if(st==='pogo'){op.blade=0;op.bladeLen=38;op.grip=0;}
  if(S.flash>0)op.ink='#ffffff';
  if(o.hb){if(st==='slash'||st==='dashSlash'){const b=slashBox(P);box(c,b[0],b[1],b[2],b[3],RED);}if(st==='pogo'){const b=pogoBox(P,R.opt.pogoH);box(c,b[0],b[1],b[2],b[3],RED);}}
  if(S.flash>0){c.save();c.globalAlpha=.9;c.fillStyle=PAPER;c.beginPath();c.arc(x,y-26,30,0,Math.PI*2);c.fill();c.restore();}
  SR.drawSamurai(c,R.pose,x,y,P.facing,op);
  if(S.flash>0){SR.drawSamurai(c,R.pose,x,y,P.facing,Object.assign({},op,{ink:RED,alpha:.5}));}
  SR.drawParts(c,R.parts);}
// enemies and gym pieces
function drawEnemies(c,w){for(const e of (w.foes||[])){if(e.alive===false&&e.dieT>.5)continue;c.save();if(e.alive===false){c.globalAlpha=1-e.dieT/.5;c.translate(e.x+e.w/2,e.y+e.h);c.rotate(e.dieT*4);c.translate(-e.x-e.w/2,-e.y-e.h);}
    c.fillStyle=INK;c.beginPath();c.ellipse(e.x+e.w/2,e.y+e.h*.6,e.w/2,e.h*.4,0,0,Math.PI*2);c.fill();c.fillStyle=PAPER;c.beginPath();c.arc(e.x+e.w*.35,e.y+e.h*.55,2.5,0,Math.PI*2);c.arc(e.x+e.w*.65,e.y+e.h*.55,2.5,0,Math.PI*2);c.fill();
    if(e.spike)SR.drawSpikes(c,[e.x,e.y+e.h*.25,e.w]);c.restore();}}
function drawRing(c,r,on,t){c.save();c.strokeStyle=on?RED:INK;c.lineWidth=on?4:3;c.beginPath();c.arc(r.x,r.y,20,0,Math.PI*2);c.stroke();
  if(on){c.globalAlpha=.25+.2*Math.sin(t*9);c.fillStyle=RED;c.beginPath();c.arc(r.x,r.y,27,0,Math.PI*2);c.fill();}c.restore();}
function flat(width,extra){return SR.makeCourse(Object.assign({width,solids:[[0,G,width,300]],deathY:G+120,finish:null,foes:[],hooks:[]},extra||{}));}
const camX=(P,VW,width,lead=120)=>CL(P.x+PW/2-VW*.36+lead,0,Math.max(0,width-VW));

// ======================================================================
// B6 spinjump: SMW's jump table in (normal, spin) pairs, the safer body, the enemy bounce
// ======================================================================
REG('spinjump',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const TABLE={stand:{normal:80,spin:74},p:{normal:95,spin:87}};             // 1/16 px per frame, DATA_00D2BD [V, S30]
  const SCW=.6,VW=640/SCW,wld=()=>flat(1500,{foes:[{x:560,y:G-30,w:30,h:30,alive:true,spike:true}]});
  const lanes=[{kind:'normal',w:wld(),R:null,deaths:0,bounces:0},{kind:'spin',w:wld(),R:null,deaths:0,bounces:0}];
  for(const L of lanes){L.R=mkR(L.w,60);L.R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};}
  let hold=0,bucket='stand';q.seg('b',v=>{bucket=v;for(const L of lanes){L.R.reset();L.w.foes[0].alive=true;L.dead=false;L.wait=0;L.jumped=false;}});
  const vOf=L=>TABLE[bucket][L.kind]/TABLE.stand.normal*PHYS.jumpVel;        // SMW ratios on SpeedRunner's gravity (illustrative)
  return {tick(sec){run(sec*slow(q),dt=>{for(const L of lanes){const R=L.R,P=R.P,e=L.w.foes[0];
      if(L.wait>0){L.wait-=dt;if(L.wait<=0){R.reset();e.alive=true;e.dieT=0;L.dead=false;}continue;}
      const k={right:true,jump:P.onGround?false:true,jumpPressed:false};
      if(P.onGround&&P.x>330&&P.x<360&&!L.jumped){k.jumpPressed=true;L.jumped=true;}
      if(P.onGround&&P.x<300)L.jumped=false;
      const ev=stepR(R,k,dt,{phys:Object.assign({},PHYS,{jumpVel:vOf(L)})});
      for(const x of ev)if(x.t==='jump')SFX(snd,'jump',{jitter:.04});
      // contact with the spiny: a normal body dies, a spinning body bounces
      if(e.alive&&!L.dead&&ov([P.x+3,P.y,PW-6,PH],[e.x+2,e.y,e.w-4,e.h])){
        if(L.kind==='spin'&&P.vy>0){P.vy=-vOf(L);P.y=e.y-PH-1;P.fromGround=true;P.jumpCut=false;P.holdT=0;L.bounces++;SFX(snd,'wall');SR.dust(R.parts,P.x+PW/2,P.y+PH,6,0,-1,.8);}
        else{L.dead=true;L.deaths++;L.wait=.7;SFX(snd,'die');}}
      if(P.x>1250||P.dead){L.wait=.3;}}});
    const c=S.c;S.begin();
    lanes.forEach((L,i)=>{const R=L.R,P=R.P,y0=i*180;const cam={x:camX(P,VW,L.w.width,60),y:G-280};
      c.save();c.beginPath();c.rect(0,y0,640,180);c.clip();S.world(cam,SCW,0,y0);
      SR.drawSolids(c,L.w,cam,{VW,start:false});drawEnemies(c,L.w);
      // the two heights: a dotted apex line for each lane
      const h=vOf(L)**2/(2*PHYS.gravity),hn=(TABLE[bucket].normal/80*PHYS.jumpVel)**2/(2*PHYS.gravity);
      dash(c,cam.x,G-PH-hn,cam.x+VW,G-PH-hn,LIGHT,[4,4]);dash(c,cam.x,G-PH-h,cam.x+VW,G-PH-h,L.kind==='spin'?RED:INK,[4,4]);
      if(L.dead){c.save();c.strokeStyle=RED;c.lineWidth=3;c.beginPath();c.moveTo(P.x-6,P.y+6);c.lineTo(P.x+26,P.y+40);c.moveTo(P.x+26,P.y+6);c.lineTo(P.x-6,P.y+40);c.stroke();c.restore();}
      else if(L.kind==='spin'&&!P.onGround){const sp=Math.sin(R.time*28);SR.drawSamurai(c,R.pose,P.x+PW/2,P.y+PH,P.facing,{sx:Math.abs(sp)<.25?.35:1,flap:P.flap,grip:P.grip,clock:R.time});SR.drawParts(c,R.parts);}
      else drawR(c,R);
      S.ui();
      T(c,L.kind==='normal'?'normal jump':'spin jump',10,y0+18,{s:13,w:600,col:L.kind==='spin'?RED:INK});
      const v=TABLE[bucket][L.kind];T(c,`launch -${v} (1/16 px per frame) · peak ${(h/BL).toFixed(2)} BL here · ${L.kind==='spin'?'bounces '+L.bounces:'deaths '+L.deaths}`,10,y0+34,{s:11,col:MUTE});
      c.restore();});
    dash(S.c,0,180,640,180,LIGHT,[2,3]);
    const t=TABLE[bucket],r=(1-(t.spin/t.normal)**2)*100;
    RO(root,`${bucket==='stand'?'standing':'P-speed'} pair: normal -${t.normal}, spin -${t.spin}, so the spin peaks <b>${r.toFixed(0)}%</b> lower [V, S30; I] · a P-speed spin (-87) still launches faster than a standing normal jump (-80) · SMW ratios applied to SpeedRunner's 830 u/s jump, illustrative`);
  }};});

// ======================================================================
// C1 ledge: Spelunky's hang against Celeste's climb hop; the automatic mantle on a gym ledge
// ======================================================================
REG('ledge',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.75,VW=640/SCW,TOP=194;                                            // block top 194 u up: a full jump puts the head 10 u under it
  const w=SR.makeCourse({width:1500,solids:[[0,G,1500,300],[700,G-TOP,420,TOP]],deathY:G+120});
  const R=mkR(w,60);R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};
  let mode='mantle',hang=0,times={},t0=null,done=0,bot={},lastEv='';q.seg('m',v=>{mode=v;R.reset();hang=0;t0=null;done=0;});
  const reset=()=>{R.reset();hang=0;t0=null;done=0;bot={};};
  return {tick(sec){const reach=q.v('reach');q.out('reach',reach+' u');
    run(sec*slow(q),dt=>{const P=R.P,Sv=R.S;if(done>0){done-=dt;if(done<=0)reset();return;}
      if(P.x>620&&t0==null)t0=R.time;
      let k;
      if(hang>0){hang-=dt;P.vx=0;P.vy=0;k={};if(hang<=0){P.y=G-TOP-PH;P.x=700;P.vy=-120;SFX(snd,'land');}else{R.time+=dt;poseTick(R,dt);return;}}
      k=k||{right:!(Sv.mantle>0),jump:!P.onGround&&P.vy<0,jumpPressed:false};
      if(P.onGround&&P.x>560&&P.x<590&&!bot.j){k.jumpPressed=true;bot.j=true;}
      if(mode==='off'&&!P.onGround&&P.wallDir!==0&&P.vy>=0&&!bot.wj){k.jumpPressed=true;bot.wj=true;}   // the climb jump the wall kit gives today
      const ev=stepR(R,k,dt);for(const x of ev){if(x.t==='jump'||x.t==='climb')SFX(snd,x.t==='jump'?'jump':'wall',{jitter:.04});if(x.t==='land')SFX(snd,'land');}
      // the mantle test, C1: a wall whose top sits between the head and `reach` above it, held toward or rising under 200 u/s
      if(mode!=='off'&&!P.onGround&&P.wallDir!==0&&!(Sv.mantle>0)&&hang<=0){const s=SR.solidAt(w,P.wallDir>0?P.x+PW:P.x-2,P.y+8,2,PH-16);
        if(s&&s[1]>=P.y-reach&&s[1]<=P.y+4&&(k.right||(P.vy<0&&P.vy>-200))){
          if(mode==='hang'){hang=.5;lastEv='hang: stop on the lip, then climb (Spelunky)';SFX(snd,'wall');}
          else{P.y=s[1]-PH;P.vy=VERBS.mantle.vy;P.vx=VERBS.mantle.vx*P.wallDir;P.onGround=false;Sv.mantle=VERBS.mantle.steps;lastEv='mantle: feet snapped to the top, vy -300, vx 200 for 12 steps';SFX(snd,'land',{vol:.6});SR.dust(R.parts,P.x+PW,P.y+PH,5,0,-.6,.6);}}}
      if(P.onGround&&P.y+PH<=G-TOP+1&&t0!=null&&!times[mode+'_t']){times[mode]=R.time-t0;times[mode+'_t']=true;}
      if(P.x>1300||P.dead){done=.4;}
      if(P.onGround&&P.x>720&&P.y+PH>G-10){bot.wj=false;}});
    const c=S.c;S.begin();const P=R.P;const cam={x:camX(P,VW,w.width,80),y:G-400};S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});
    // the mantle band on the block face: head to `reach` above it
    c.save();c.fillStyle='rgba(208,40,31,.14)';c.fillRect(640,G-TOP-reach,60,reach);c.fillStyle=RED;c.fillRect(640,G-TOP-.5,60,1);c.restore();
    dash(c,cam.x,G-PH-138,cam.x+VW,G-PH-138,LIGHT,[4,4]);
    drawR(c,R);S.ui();
    T(c,'the head at a full jump apex (feet at 3.0 BL)',630,(G-PH-138-cam.y)*SCW-4,{s:10,col:MUTE,al:'right'});
    T(c,`reach band ${reach} u above the head`,(650-cam.x)*SCW,(G-TOP-reach-cam.y)*SCW-6,{s:10,col:RED});
    const name={off:'off: corner correction 8 u only',hang:'hang (Spelunky)',mantle:'automatic mantle (Celeste\'s climb hop)'}[mode];
    T(c,name,10,20,{s:13,w:600,col:mode==='mantle'?RED:INK});if(lastEv)T(c,lastEv,10,36,{s:11,col:MUTE});
    const rows=['mantle','hang','off'].map(m=>`${m} ${times[m]!=null?fmtMs(times[m]*1000):'…'}`).join(' · ');
    RO(root,`time from 620 u to standing on the block: <b>${rows}</b> (measured) · the hop is <code>ClimbHopY -120</code>, 1.14x Celeste's jump, forced 0.2 s [V, S7] · the hang is a stop, and a stop on a clock is a death by another name [I]`);
  }};});

// ======================================================================
// C2 wallrun: a fixed-distance ride, 92 u over 250 ms, then the slide; a speed threshold
// ======================================================================
REG('wallrun',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.75,VW=640/SCW,WX=900,LT=200;
  const w=SR.makeCourse({width:1200,solids:[[0,G,1200,300],[WX,G-520,300,520],[600,G-LT,260,20]],deathY:G+120});
  const R=mkR(w,40);R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};
  let wr=-1,done=0,startY=null,best=0,reached=null,hits=0,gets=0,tries=0;
  const reset=()=>{R.reset();wr=-1;done=0;startY=null;reached=null;};
  return {tick(sec){const thr=q.v('thr'),app=q.v('app'),on=q.v('on');q.out('thr',thr+' u/s');q.out('app',app+' u/s');
    run(sec*slow(q),dt=>{const P=R.P;if(done>0){done-=dt;if(done<=0)reset();return;}
      const k={right:true,jumpPressed:false,jump:false};
      // approach speed: the bot eases to `app` before the wall
      if(P.onGround&&P.x>WX-260&&Math.abs(P.vx)>app)P.vx=app;
      if(P.onGround&&!R.S.tried&&SR.solidAt(w,P.x+PW,P.y+8,3,PH-16)){R.S.tried=true;tries++;}
      if(wr<0&&on&&P.onGround&&Math.abs(P.vx)>=thr&&SR.solidAt(w,P.x+PW,P.y+8,3,PH-16)){wr=VERBS.wallRun.steps;startY=P.y+PH;P.onGround=false;P.coyote=0;hits++;SFX(snd,'step');}
      if(wr>0){P.vy=-(VERBS.wallRun.rise/(VERBS.wallRun.steps*DT))-PHYS.gravity*dt;wr--;if(wr===0){wr=-2;}}
      if(wr<=-1&&!P.onGround&&P.wallDir!==0&&P.vy>=0){k.jumpPressed=true;k.right=false;k.left=true;if(wr===-1&&startY==null)startY=P.y+PH;}  // slide begins: jump away
      if(!P.onGround&&P.wallDir===0&&P.x<WX-30&&P.vx<0){k.right=false;k.left=P.x>700;}
      const ev=stepR(R,k,dt);for(const x of ev){if(x.t==='wall'){SFX(snd,'wall');wr=-3;}if(x.t==='land'||x.t==='touch'){if(P.y+PH<=G-LT+1&&reached==null){reached=true;gets++;done=.8;}else if(P.x<WX&&wr===-3){reached=false;done=.6;}}}
      if(P.x>1150||P.dead)done=.3;});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x-300,0,w.width-VW),y:G-420};S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});
    // the fixed 92 u ride drawn on the wall, and the ledge only the ride reaches
    SR.dim(c,WX+16,G,WX+16,G-VERBS.wallRun.rise,'92 u, 250 ms',{col:RED,ox:40,oy:0,align:'left'});
    dash(c,WX-200,G-VERBS.wallRun.rise-125,WX,G-VERBS.wallRun.rise-125,RED,[3,3]);dash(c,WX-200,G-125,WX,G-125,GREY,[3,3]);
    if(wr>0){c.save();c.fillStyle='rgba(208,40,31,.12)';c.fillRect(WX-PW-6,G-VERBS.wallRun.rise,PW+6,VERBS.wallRun.rise);c.restore();}
    if(wr>0){R.pose=SR.blend(R.pose,VP.wallrun,.5);}
    drawR(c,R);S.ui();
    T(c,'wall jump apex with the run (+92)',(WX-200-cam.x)*SCW,(G-VERBS.wallRun.rise-125-cam.y)*SCW-5,{s:10,col:RED});
    T(c,'wall jump apex from the floor (125 u)',(WX-200-cam.x)*SCW,(G-125-cam.y)*SCW-5,{s:10,col:MUTE});
    T(c,`approach ${app} u/s against a ${thr} u/s threshold · ${on?(Math.abs(app)>=thr?'runs the wall':'too slow: slides at once'):'wall run off'}`,10,20,{s:13,w:600,col:on&&app>=thr?RED:INK});
    if(wr>0)T(c,`wall run step ${VERBS.wallRun.steps-wr} of ${VERBS.wallRun.steps}`,10,36,{s:11,col:MUTE});
    RO(root,`ledge at ${LT} u reached <b>${gets}</b> of ${tries} attempts, ${hits} with a wall run${reached===false?' · this attempt missed: the wall jump from the floor peaks at 125 u':''} · Dustforce runs a wall "for a fixed distance, usually a few character lengths" [V, S43] · Mirror's Edge's shortest wall run is the fastest [V, S177] · off in Recommended: it rewrites the same-wall penalty and m2's 600 u chimney [K; I]`);
  }};});

// ======================================================================
// C3 stamina: Celeste's 110-point budget as a live bar while climbing, hanging and climb-jumping
// ======================================================================
REG('stamina',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.6,VW=640/SCW,WX=620,MAX=110,UP=100/2.2,STILL=100/10,JUMP=110/4,TIRED=20;   // Player.cs constants [V, S7]
  const w=SR.makeCourse({width:1000,solids:[[0,G,1000,300],[WX,G-900,300,900]],deathY:G+120});
  const R=mkR(w,60);R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};
  let sc='climb',st=MAX,grab=false,done=0,log=[],jumps=0,jt=0,t0=0,used={climb:0,hang:0,jump:0},speed=1,regrab=0;
  q.seg('s',v=>{sc=v;reset();});
  const reset=()=>{R.reset();st=MAX;grab=false;done=0;jumps=0;jt=0;t0=0;used={climb:0,hang:0,jump:0};speed=1;regrab=0;};
  return {tick(sec){run(sec*slow(q)*speed,dt=>{const P=R.P;if(done>0){done-=dt;if(done<=0)reset();return;}
      const k={right:true,jump:!P.onGround&&P.vy<0,jumpPressed:false};
      if(P.onGround&&P.x>WX-150&&P.x<WX-120&&!grab)k.jumpPressed=true;
      const onWall=!P.onGround&&P.wallDir===1;regrab=Math.max(0,regrab-dt);
      if(onWall&&!grab&&regrab<=0&&st>0){grab=true;if(!t0)t0=R.time;P.vy=Math.min(P.vy,0)*.2;SFX(snd,'wall',{vol:.5});}   // ClimbGrabYMult 0.2
      if(grab&&st>0){
        let climbing=sc==='climb'||(sc==='jump'&&jumps<1&&R.time-t0<.12);
        if(sc==='hang'){climbing=false;speed=3;}
        if(climbing){P.vy=-VERBS.climb.speed-PHYS.gravity*dt;st-=UP*dt;used.climb+=dt;}
        else{P.vy=-PHYS.gravity*dt;st-=STILL*dt;used.hang+=dt;}                 // hold still: 10 per second
        if(sc==='jump'&&R.time-t0>.12){jt-=dt;if(jt<=0&&jumps<5){k.jumpPressed=true;jt=.08;}}
        if(st<=0){st=0;grab=false;speed=1;}}
      const ev=stepR(R,k,dt);
      for(const x of ev){if(x.t==='climb'){st-=JUMP;jumps++;used.jump++;grab=false;regrab=.3;SFX(snd,'wall');if(st<=0){st=0;}}if(x.t==='jump')SFX(snd,'jump');if(x.t==='land'||x.t==='touch'){if(grab||st<MAX){st=MAX;grab=false;done=1.2;}}}
      if(grab&&!onWall&&P.wallDir!==1)grab=false;
      if(P.dead||P.y+PH>G+60)done=.2;});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x-250,0,w.width-VW),y:CL(P.y-260,G-900,G-VH_(SCW)+40)};S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});
    if(grab)R.pose=SR.blend(R.pose,VP.climb,.4);drawR(c,R);
    // the bar beside the hero: the last 20 points flash red (IsTired)
    const bx=P.x-30,by=P.y,bh=PH;c.fillStyle=PALE;c.fillRect(bx,by,8,bh);c.fillStyle=st<TIRED?(Math.floor(R.time*10)%2?RED:'#f6b0ab'):INK;c.fillRect(bx,by+bh*(1-st/MAX),8,bh*st/MAX);
    c.fillStyle=RED;c.fillRect(bx-2,by+bh*(1-TIRED/MAX),12,1);
    S.ui();
    T(c,`stamina ${st.toFixed(0)} / 110${st<TIRED&&st>0?' · tired':st<=0?' · empty: let go':''}`,10,20,{s:13,w:600,col:st<TIRED?RED:INK});
    T(c,`${sc==='climb'?'climb at 210 u/s costs 45.45 per second: 2.42 s, 508 u, 11 BL':sc==='hang'?'hanging still costs 10 per second: 11 s (shown at 3x)':'a climb jump costs 27.5: four empty the budget'}`,10,36,{s:11,col:MUTE});
    T(c,`climbed ${used.climb.toFixed(2)} s · hung ${used.hang.toFixed(1)} s · climb jumps ${used.jump}`,10,52,{s:11,col:MUTE,mono:1});
    RO(root,`<code>ClimbMaxStamina 110</code>, <code>ClimbUpCost 100/2.2</code>, <code>ClimbStillCost 100/10</code>, <code>ClimbJumpCost 110/4</code>, tired under 20, refilled on the ground [V, S7] · SpeedRunner scaling: 210 u/s is half of maxRun as Celeste's 45 px/s is half its run; the budget buys 11 BL here against 9.9 BL in Celeste because a body length is 46 u, not 11 px [K; I]`);
  }};});
const VH_=sc=>360/sc;

// ======================================================================
// C4 crouchwall: the four conflict rules on a tiny course, a custom integrator on the live hitbox
// ======================================================================
REG('crouchwall',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const solids=[[0,G,640,300],[170,G-32-60,170,60],[380,G-60,90,8,'tile'],[560,G-130,80,130]];
  const p={x:20,y:G-46,h:46,vx:0,vy:0,onGround:true,facing:1};let t=0,phase=0,rules={},msg='',stopT=0,pinJump=0,wantStand=false,fired=[],prevCrouch=false,probe=null,sliding=false;
  const sol=b=>solids.find(s=>s[4]!=='tile'&&ov([b.x,b.y,b.w,b.h],s));
  const canStand=()=>local.canStand(p,solids,8);
  const reset=()=>{Object.assign(p,{x:20,y:G-46,h:46,vx:0,vy:0,onGround:true});t=0;phase=0;rules={};msg='';stopT=0;pinJump=0;wantStand=false;fired=[];};
  q.btn('stand',()=>{wantStand=true;});
  const fire=(n,s)=>{rules[n]=1.2;msg=s;if(!fired.includes(n))fired.push(n);};
  return {tick(sec){run(sec*slow(q),dt=>{t+=dt;for(const k in rules)rules[k]-=dt;
      // the script: approach slowly, crouch under the corridor, try to stand, jump pinned, stand on exit; jump onto the tile and press Down; slide into the wall
      let dir=1,down=false,jumpP=false,stand=wantStand;wantStand=false;
      if(phase===0){down=p.x>90;if(p.x>60)dir=p.vx>130?0:1;if(p.h<46&&p.x>240&&p.x<330){stand=true;}if(p.h<46&&p.x>318&&p.x<322&&pinJump<=0)jumpP=true;if(p.x>350&&p.h===46&&p.onGround&&t>0){phase=1;}}
      else if(phase===1){if(p.x>356&&p.x<362&&p.onGround)jumpP=true;down=p.y+p.h<=G-60+1&&p.onGround&&p.x>395;if(down&&p.x>430){phase=2;}}
      else if(phase===2){down=p.x>470;if(p.x>=540-20&&stopT<=0&&!rules.r3&&p.h<46){stopT=.1;fire('r3','rule 3: a crouched body touching a wall gets a 100 ms stand-up stop, not the wall stick');}
        if(p.onGround&&p.h===46&&p.x>=538&&stopT<=0){jumpP=true;dir=-1;phase=3;}}
      else{dir=-1;if(p.x<400){reset();return;}}
      if(stopT>0){stopT-=dt;dir=0;down=false;if(stopT<=0&&!local.setCrouch(p,false,solids))stopT=.05;}
      // Down: crouch (or slide above 280 u/s); release stands only if free (rule 1); jump while pinned is buffered 130 ms (rule 4)
      if(down&&p.h===46&&p.onGround){sliding=Math.abs(p.vx)>=VERBS.slide.minSpeed;local.setCrouch(p,true,solids);}
      if(p.h<46&&p.onGround&&sliding){p.vx=Math.sign(p.vx)*Math.max(0,Math.abs(p.vx)-VERBS.slide.friction*dt);if(Math.abs(p.vx)<40)sliding=false;}
      if((!down||stand)&&p.h<46&&stopT<=0){if(!local.setCrouch(p,false,solids)){if(stand&&!(rules.r1>0))fire('r1','rule 1: pinned under the ceiling, canStand() tests the 46 u box against solids only: keep crawling');}else if(sliding)sliding=false;}
      if(jumpP){if(p.h<46&&!canStand()){pinJump=.13;fire('r4','rule 4: a jump pressed while pinned is buffered 130 ms and fires when the body is free');}else if(p.onGround){p.vy=-PHYS.jumpVel;p.onGround=false;SFX(snd,'jump');}}
      if(pinJump>0){pinJump-=dt;if(p.h===46&&p.onGround){p.vy=-PHYS.jumpVel;p.onGround=false;pinJump=0;SFX(snd,'jump');msg='rule 4: the buffered jump fires on the way out';}}
      // Down on a one-way tile is a crouch, never a drop-through (rule 2)
      if(down&&p.onGround&&solids.some(s=>s[4]==='tile'&&p.y+p.h>=s[1]-1&&p.y+p.h<=s[1]+3&&p.x+20>s[0]&&p.x<s[0]+s[2])&&!(rules.r2>0)&&phase===1)fire('r2','rule 2: Down on a one-way tile crouches; a drop-through would re-route m4\'s roof maze');
      // movement: the live box, crawl 120 u/s, the game's accel and friction on the ground
      const cap=p.h<46?(sliding?1e9:VERBS.crouch.crawl):PHYS.maxRun;
      if(p.onGround&&!sliding){if(dir!==0)p.vx=dir*Math.min(cap,Math.abs(p.vx)+PHYS.groundAccel*dt);else p.vx=Math.sign(p.vx)*Math.max(0,Math.abs(p.vx)-PHYS.groundFric*dt);}
      else if(!p.onGround&&dir!==0)p.vx=CL(p.vx+dir*PHYS.airAccel*dt,-PHYS.maxRun,PHYS.maxRun);
      if(dir!==0)p.facing=dir;
      if(!p.onGround)p.vy+=PHYS.gravity*(p.vy>0?PHYS.fallMult:1)*dt;
      p.x+=p.vx*dt;let s;if((s=sol({x:p.x,y:p.y,w:20,h:p.h})))
        {p.x=p.vx>0?s[0]-20:s[0]+s[2];p.vx=0;}
      p.y+=p.vy*dt;p.onGround=false;const feet=p.y+p.h;
      for(const s2 of solids){const tile=s2[4]==='tile';if(!ov([p.x,p.y,20,p.h],s2))continue;if(tile&&!(p.vy>0&&feet-p.vy*dt<=s2[1]+3))continue;
        if(p.vy>0){p.y=s2[1]-p.h;p.onGround=true;}else{p.y=s2[1]+s2[3];}p.vy=0;}
      if(!p.onGround&&p.vy>=0&&solids.some(s2=>{const tile=s2[4]==='tile';return ov([p.x,p.y+p.h,20,1],s2)&&(!tile||feet<=s2[1]+3);}))p.onGround=true;
      // the wall probe: 2 u wide over y 8..38 of a standing body; a crouched body has none
      probe=p.h<46?null:[p.facing>0?p.x+20:p.x-2,p.y+8,2,30];});
    const c=S.c;S.begin();S.world({x:0,y:G-300},1);
    c.fillStyle=INK;for(const s of solids){c.fillRect(s[0],s[1],s[2],s[3]);if(s[4]==='tile'){c.fillStyle=PAPER;c.fillRect(s[0]+3,s[1]+s[3]-2.5,s[2]-6,1.5);c.fillStyle=INK;}}
    SR.dim(c,170,G-32,170,G,'32 u',{col:RED,ox:-18,oy:4});
    box(c,p.x,p.y,20,p.h,RED,'rgba(208,40,31,.08)');box(c,p.x,p.y+p.h-46,20,46,LIGHT);
    if(probe)box(c,probe[0],probe[1],probe[2],probe[3],BLUE,'rgba(36,88,201,.25)');
    const pose=p.h<46?(sliding?VP.slide:VP.crouch):{hip:22,lean:.1+Math.min(.3,Math.abs(p.vx)/1400),th:[.2+Math.sin(t*14)*.5*Math.min(1,Math.abs(p.vx)/300),-.2-Math.sin(t*14)*.5*Math.min(1,Math.abs(p.vx)/300)],sh:[.3,.3],ua:[.2,-.2],la:[.6,.6]};
    SR.drawSamurai(c,pose,p.x+10,p.y+p.h,p.facing,{clock:t});
    S.ui();
    T(c,`hitbox ${p.h===46?'20x46 u standing':'20x26 u crouched (57%), feet fixed'} · vx ${Math.abs(p.vx).toFixed(0)} u/s${sliding?' · sliding':''}`,10,20,{s:13,w:600});
    T(c,probe?'blue: the 2 u wall probe over y 8 to 38 of the body':'no wall probe while crouched: no stick, no wall jump',10,36,{s:11,col:probe?BLUE:RED});
    [['r1','1 stand only if the 46 u box is free'],['r2','2 Down on a one-way tile crouches'],['r3','3 no wall kit while crouched'],['r4','4 pinned jump buffered 130 ms']].forEach(([k,s],i)=>{const on=rules[k]>0,seen=fired.includes(k);T(c,s,636,300+i*15,{s:11,al:'right',col:on?RED:seen?INK:LIGHT,w:on?600:400});});
    if(msg)label(c,msg,10,352,{s:11,col:RED});
    RO(root,`the probe derives from the live hitbox, so a crouched body never enters the wall kit; <code>canStand()</code> tests solids and never one-way tiles, as Celeste's <code>CanUnDuck</code> tests <code>Solid</code> only [V, S7; K; I] · press "Try to stand" under the corridor`);
  }};});

// ======================================================================
// D1 swing: Fristrom's constraint, a ring hook on the gym, the 760 u/s release cap, a period readout
// ======================================================================
REG('swing',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.6,VW=640/SCW,GAP0=560,GAP1=980,FX=545,FY=G-105;
  const w=SR.makeCourse({width:1700,solids:[[0,G,GAP0,300],[GAP1,G,720,300]],deathY:G+80,hooks:[{x:740,y:G-300}]});
  const R=mkR(w,60);R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};R.snd=snd;
  let H={on:false,L:0,a:null,fire:0,fx:0,fy:0,maxV:0,relV:0,relRaw:0,capped:false,theta0:0,v0:0},done=0,landed=null,lands=0,falls=0,trace=[];
  const ring=w.hooks[0];const center=P=>[P.x+PW/2,P.y+PH*.4];
  R.ringInReach=()=>{const P=R.P,[cx,cy]=center(P),f=P.facing;for(let s=0;s<=VERBS.hook.reach;s+=10){const px=cx+f*s*Math.SQRT1_2,py=cy-s*Math.SQRT1_2;if(Math.hypot(px-ring.x,py-ring.y)<=30)return true;}return false;};
  R.hookUpdate=k=>{const P=R.P,Sv=R.S;
    if(H.fire>0){H.fire--;const [cx,cy]=center(P);const ev=SR.step(P,{left:!!k.left,right:!!k.right,jump:false,jumpPressed:false},DT,{world:w,time:R.time,tuning:TUN});R.time;   // the projectile flies 1700 u/s; the hero keeps falling
      if(H.fire===0){const [cx2,cy2]=center(P);H.L=Math.max(VERBS.hook.minLen,Math.hypot(cx2-ring.x,cy2-ring.y));H.on=true;H.a=ring;H.theta0=Math.atan2(cx2-ring.x,cy2-ring.y);H.v0=Math.hypot(P.vx,P.vy);H.maxV=0;vfx(snd,'click');}
      return null;}
    if(H.on){const p={x:P.x+PW/2,y:P.y+PH*.4,vx:P.vx,vy:P.vy};local.stepHook(p,ring,H.L,k,DT);P.x=p.x-PW/2;P.y=p.y-PH*.4;P.vx=p.vx;P.vy=p.vy;H.maxV=Math.max(H.maxV,Math.hypot(p.vx,p.vy));trace.push([p.x,p.y]);if(trace.length>90)trace.shift();
      if(k.katanaReleased||!k.katana){H.on=false;const raw=Math.hypot(P.vx,P.vy);const cap=q.v('cap')?VERBS.hook.capV:0;local.releaseHook(P,false,cap);H.relRaw=raw;H.relV=Math.hypot(P.vx,P.vy);H.capped=cap>0&&raw>cap;P.peak=P.y+PH;P.fromGround=false;P.jumpCut=true;vfx(snd,'whoosh');return 'normal';}
      return null;}
    return 'normal';};
  const reset=()=>{R.reset();H={on:false,L:0,a:null,fire:0,maxV:0,relV:0,relRaw:0,capped:false,theta0:0,v0:0};done=0;landed=null;trace=[];};
  let holdK=false;
  return {tick(sec){const rh=q.v('rh');q.out('rh',rh+' u');ring.x=FX+rh*Math.SQRT1_2;ring.y=FY-rh*Math.SQRT1_2;
    run(sec*slow(q),dt=>{const P=R.P,Sv=R.S;if(done>0){done-=dt;if(done<=0)reset();return;}
      const k={right:true,up:false,katana:holdK,jump:!P.onGround&&P.vy<0&&Sv.state==='normal'&&!Sv.fired,jumpPressed:false};
      if(P.onGround&&P.x>GAP0-100&&P.x<GAP0-70&&!Sv.j){k.jumpPressed=true;Sv.j=true;k.jump=true;}
      if(!P.onGround&&P.x<GAP1&&P.vy>-200&&!H.on&&H.fire<=0&&!Sv.fired&&R.ringInReach()){k.up=true;k.katana=true;holdK=true;Sv.fired=true;}
      if(Sv.state==='hook'&&H.on){const ang=Math.atan2(P.x+PW/2-ring.x,(P.y+PH*.4)-ring.y);if(ang>.55&&P.vx>0&&P.vy<0){holdK=false;k.katana=false;}else k.katana=true;k.right=true;}
      const was=Sv.state;const ev=stepR(R,k,dt);
      if(Sv.state==='hook'&&was!=='hook'){H.fire=Math.max(1,Math.round(Math.hypot(ring.x-(P.x+PW/2),ring.y-(P.y+PH*.4))/VERBS.hook.speed/DT));vfx(snd,'whoosh');}
      for(const x of ev){if(x.t==='jump')SFX(snd,'jump');if(x.t==='land'||x.t==='roll'){SFX(snd,x.t);if(P.x>GAP1&&landed==null){landed=true;lands++;}}}
      if(P.dead){if(landed==null){landed=false;falls++;}done=.5;}if(P.x>1600)done=.3;});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x-330,0,w.width-VW),y:G-440};S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});
    // the rope circle and the energy band
    if(H.on||H.fire>0){c.save();c.strokeStyle=LIGHT;c.setLineDash([4,5]);c.lineWidth=1;c.beginPath();c.arc(ring.x,ring.y,H.L||Math.hypot(ring.x-P.x,ring.y-P.y),0,Math.PI*2);c.stroke();c.restore();}
    c.save();c.strokeStyle=GREY;c.lineWidth=1;c.beginPath();for(let i=0;i<trace.length;i++){const[x,y]=trace[i];i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.restore();
    drawRing(c,ring,R.ringInReach()&&!P.onGround&&!H.on,R.time);
    if(H.fire>0){const [cx,cy]=center(P),k=1-H.fire*DT*VERBS.hook.speed/Math.hypot(ring.x-cx,ring.y-cy);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.lineTo(LP(cx,ring.x,CL(k,0,1)),LP(cy,ring.y,CL(k,0,1)));c.stroke();}
    if(H.on){c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(P.x+PW/2,P.y+PH*.4);c.lineTo(ring.x,ring.y);c.stroke();
      const rot=Math.atan2(P.x+PW/2-ring.x,(P.y+PH*.4)-ring.y);SR.drawSamurai(c,SR.blend(R.pose,VP.hang,.6),P.x+PW/2,P.y+PH,P.facing,{rot:-rot*P.facing,katana:false,flap:.4,clock:R.time});SR.drawParts(c,R.parts);}
    else drawR(c,R);
    S.ui();
    const L=H.L||rh,T0=2*Math.PI*Math.sqrt(L/PHYS.gravity);
    T(c,`rope ${L.toFixed(0)} u (${(L/BL).toFixed(1)} BL) · period 2π√(L/g) = ${T0.toFixed(2)} s · quarter swing ${(T0/4*1000).toFixed(0)} ms`,10,20,{s:13,w:600});
    T(c,H.on?`on the rope: |v| ${Math.hypot(P.vx,P.vy).toFixed(0)} u/s, peak ${H.maxV.toFixed(0)}`:H.relV?`released at ${H.relRaw.toFixed(0)} u/s${H.capped?', capped to '+H.relV.toFixed(0):q.v('cap')?' (under the cap)':' (cap off)'}`:'Up + Katana in the air with the ring in reach fires at 45°, 1700 u/s, reach 300 u',10,36,{s:11,col:H.capped?RED:MUTE});
    const e45=Math.sqrt(420*420+2*PHYS.gravity*276*(1-Math.cos(Math.PI/4))),e90=Math.sqrt(2*PHYS.gravity*276);
    RO(root,`three lines: Euler step, project back onto the circle, velocity from the corrected move [V, S19] · energy check at L = 276 u: a 45° entry at maxRun reaches <b>${e45.toFixed(0)} u/s</b>, a straight drop ${e90.toFixed(0)} u/s, above maxFall; the period 2π√(L/g) is ${(2*Math.PI*Math.sqrt(276/PHYS.gravity)).toFixed(2)} s, not the 0.66 s the report prints (see the figure notes); the release keeps at most 760 u/s (1.8x maxRun) [K; I] · landed ${lands}, fell ${falls}`);
  }};});

// ======================================================================
// D2 and D3 hookpoints: rings only, any surface, pull hooks; reel and elastic as drawn references
// ======================================================================
REG('hookpoints',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.6,VW=640/SCW;
  const w=SR.makeCourse({width:1800,solids:[[0,G,520,300],[900,G,900,300],[380,G-340,900,40]],deathY:G+80,hooks:[{x:700,y:G-270}]});
  const ring=w.hooks[0];const R=mkR(w,60);R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};R.snd=snd;
  let mode='rings',H={st:'none',a:null,L:0,fire:0,hang:0,rel:0},done=0,stats={rings:[0,0],any:[0,0],pull:[0,0]};
  q.seg('m',v=>{mode=v;reset();});
  const center=P=>[P.x+PW/2,P.y+PH*.4];
  // the ray: 45° up-forward, 300 u; rings snap within 30 u; "any ceiling" anchors at the first solid underside on the ray
  const anchor=()=>{const P=R.P,[cx,cy]=center(P),f=P.facing;for(let s=0;s<=VERBS.hook.reach;s+=6){const px=cx+f*s*Math.SQRT1_2,py=cy-s*Math.SQRT1_2;
      if(mode!=='any'&&Math.hypot(px-ring.x,py-ring.y)<=30)return {x:ring.x,y:ring.y,ring:true};
      if(mode==='any'){const sl=SR.solidAt(w,px-1,py-1,2,2);if(sl)return {x:px,y:sl[1]+sl[3],ring:false};}}return null;};
  R.ringInReach=()=>!!anchor();
  R.hookUpdate=k=>{const P=R.P;
    if(H.st==='fire'){H.fire--;SR.step(P,{left:false,right:true,jump:false,jumpPressed:false},DT,{world:w,time:R.time,tuning:TUN});
      if(H.fire<=0){const [cx,cy]=center(P);H.L=Math.max(VERBS.hook.minLen,Math.hypot(cx-H.a.x,cy-H.a.y));H.st=mode==='pull'?'zip':'swing';vfx(snd,'click');}return null;}
    if(H.st==='swing'){const p={x:P.x+PW/2,y:P.y+PH*.4,vx:P.vx,vy:P.vy};local.stepHook(p,H.a,H.L,k,DT);P.x=p.x-PW/2;P.y=p.y-PH*.4;P.vx=p.vx;P.vy=p.vy;
      const ang=Math.atan2(p.x-H.a.x,p.y-H.a.y);if(ang>.5&&P.vx>0&&P.vy<0){H.st='none';H.rel=local.releaseHook(P,false,VERBS.hook.capV);P.peak=P.y+PH;P.jumpCut=true;vfx(snd,'whoosh');return 'normal';}return null;}
    if(H.st==='zip'){const [cx,cy]=center(P),dx=H.a.x-cx,dy=H.a.y+50-cy,d=Math.hypot(dx,dy),s=1550*DT;   // Terraria's 56 to 15 pull ratio: 1550 u/s, gravity off
      if(d<=s){P.x+=dx;P.y+=dy;P.vx=0;P.vy=0;H.st='hang';H.hang=.35;}else{P.x+=dx/d*s;P.y+=dy/d*s;P.vx=dx/d*1550;P.vy=dy/d*1550;}return null;}
    if(H.st==='hang'){H.hang-=DT;P.vx=0;P.vy=0;if(H.hang<=0){H.st='none';P.vy=-450;P.vx=PHYS.maxRun;P.peak=P.y+PH;P.jumpCut=true;SFX(snd,'jump');return 'normal';}return null;}
    return 'normal';};
  const reset=()=>{R.reset();H={st:'none',a:null,L:0,fire:0,hang:0,rel:0};done=0;};
  return {tick(sec){run(sec*slow(q),dt=>{const P=R.P,Sv=R.S;if(done>0){done-=dt;if(done<=0)reset();return;}
      const k={right:true,up:false,katana:Sv.state==='hook',jump:!P.onGround&&P.vy<0&&!Sv.fired,jumpPressed:false};
      if(P.onGround&&P.x>400&&P.x<430&&!Sv.j){k.jumpPressed=true;k.jump=true;Sv.j=true;}
      if(!P.onGround&&!Sv.fired&&P.vy>-250&&Sv.state==='normal'){const a=anchor();if(a){k.up=true;k.katana=true;Sv.fired=true;H.a=a;}else if(P.x>480&&P.vy>0&&mode==='rings'&&!anchor()){Sv.fired=true;Sv.miss=true;}}
      const was=Sv.state;const ev=stepR(R,k,dt);
      if(Sv.state==='hook'&&was!=='hook'){const [cx,cy]=center(P);H.st='fire';H.fire=Math.max(1,Math.round(Math.hypot(H.a.x-cx,H.a.y-cy)/VERBS.hook.speed/DT));vfx(snd,'whoosh');}
      for(const x of ev){if(x.t==='jump')SFX(snd,'jump');if((x.t==='land'||x.t==='roll')&&P.x>900&&!Sv.counted){Sv.counted=true;stats[mode][0]++;}}
      if(P.dead){if(!Sv.counted){Sv.counted=true;stats[mode][1]++;}done=.5;}if(P.x>1700)done=.3;});
    const c=S.c;S.begin();const P=R.P;const cam={x:CL(P.x-300,0,w.width-VW),y:G-480};S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});
    // valid anchors per mode
    if(mode==='any'){c.save();c.strokeStyle=RED;c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();c.moveTo(380,G-300);c.lineTo(1280,G-300);c.stroke();c.restore();T(c,'any underside on the ray is an anchor (SpeedRunners mode)',390,G-308,{s:14,col:RED});}
    else drawRing(c,ring,R.ringInReach()&&!P.onGround&&Sv_(R)==='normal',R.time);
    if(mode!=='any'){c.save();c.strokeStyle=LIGHT;c.setLineDash([2,4]);c.beginPath();c.arc(ring.x,ring.y,30,0,Math.PI*2);c.stroke();c.restore();}
    // the ray from the hero when in the air
    if(!P.onGround&&R.S.state==='normal'){const [cx,cy]=center(P);dash(c,cx,cy,cx+P.facing*300*Math.SQRT1_2,cy-300*Math.SQRT1_2,GREY,[3,4]);}
    if(H.a&&H.st!=='none'){const [cx,cy]=center(P);if(H.st==='fire'){const k=1-H.fire*DT*VERBS.hook.speed/Math.hypot(H.a.x-cx,H.a.y-cy);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.lineTo(LP(cx,H.a.x,CL(k,0,1)),LP(cy,H.a.y,CL(k,0,1)));c.stroke();}
      else{c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);if(q.v('el')){const n=10;for(let i=1;i<=n;i++){const t=i/n,px=LP(cx,H.a.x,t),py=LP(cy,H.a.y,t),nx=-(H.a.y-cy),ny=H.a.x-cx,L=Math.hypot(nx,ny)||1,z=(i%2?6:-6)*(i<n?1:0);c.lineTo(px+nx/L*z,py+ny/L*z);}}else c.lineTo(H.a.x,H.a.y);c.stroke();
        if(q.v('reel')){c.save();c.strokeStyle=BLUE;c.setLineDash([3,3]);c.beginPath();c.arc(H.a.x,H.a.y,H.L*.6,0,Math.PI*2);c.stroke();c.restore();T(c,'reel: a shorter rope swings faster (LBP2, Worms)',H.a.x+12,H.a.y+H.L*.6+14,{s:10,col:BLUE});}
        if(H.st==='swing'||H.st==='hang'){const rot=Math.atan2(cx-H.a.x,cy-H.a.y);SR.drawSamurai(c,SR.blend(R.pose,VP.hang,.6),P.x+PW/2,P.y+PH,P.facing,{rot:H.st==='swing'?-rot*P.facing:0,katana:false,clock:R.time});}}}
    if(!(H.st==='swing'||H.st==='hang'))drawR(c,R);
    S.ui();
    const names={rings:'rings only: a 45° ray, reach 300 u, snap 30 u (Ghostrunner\'s orbs, Bionic Commando\'s angles)',any:'any surface: the first underside on the ray (SpeedRunners); every roof in m3 and m4 becomes a shortcut',pull:'pull hook: zip to the ring at 1550 u/s, hang gravity-free, Jump to leave (Terraria 56:15)'};
    T(c,names[mode],10,20,{s:12,w:600,col:mode==='any'?RED:INK});
    if(R.S.miss)T(c,'no ring on the ray: nothing fires',10,36,{s:11,col:RED});else if(H.rel)T(c,`released at ${H.rel.toFixed(0)} u/s`,10,36,{s:11,col:MUTE});
    // Terraria's reach table in BL, with SpeedRunner's ring hook
    const rows=[['Grappling',6.25],['Diamond',9.4],['Bat',10.4],['Static',12.5],['Lunar x4',11.5],['SpeedRunner ring',6.5]];
    rows.forEach((r,i)=>{const y=134+i*11,wd=r[1]*13;c.fillStyle=i===5?RED:LIGHT;c.fillRect(420,y,wd,7);T(c,r[0],416,y+7,{s:9,al:'right',col:MUTE});T(c,r[1]+' BL',424+wd,y+7,{s:9,col:MUTE});});
    T(c,'hook reach, Terraria\'s table [V, S18]',420,128,{s:10,col:MUTE});
    RO(root,`rings landed ${stats.rings[0]}, fell ${stats.rings[1]} · any surface landed ${stats.any[0]}, fell ${stats.any[1]} · pull landed ${stats.pull[0]}, fell ${stats.pull[1]} · a ring is a signpost: "see an orb, that is the way" is the price of not re-tuning four maps [I] · reel and elastic are references only (D3)`);
  }};});
const Sv_=R=>R.S.state;

// ======================================================================
// D4 jetpack: the one-button corridor, 3500 u/s² thrust against 2500 down, terminal 600; Flappy's apex beside the jump's
// ======================================================================
REG('jetpack',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.6,VW=640/SCW,SEG=160,rng=RNG(7);const cave=[];      // [x, top, bottom] in world units; the corridor narrows and wanders
  const mk=i=>{const prev=cave[i-1]||[0,G-420,G-60];const mid=CL((prev[1]+prev[2])/2+(rng()-.5)*150,G-400,G-180),gap=CL(300-i*1.5,190,300);return [i*SEG,mid-gap/2,mid+gap/2];};
  for(let i=0;i<300;i++)cave.push(mk(i));
  const h={x:200,y:G-250,vy:0,t:0,held:false,deaths:0,dist:0,best:0,flash:0,mode:'thrust'};let manual=0;
  q.btn('hold',e=>{});const hb=root.querySelector('[data-b="hold"]');if(hb){hb.addEventListener('pointerdown',()=>{manual=1;I.touch();});const up=()=>{manual=0;};hb.addEventListener('pointerup',up);hb.addEventListener('pointerleave',up);hb.addEventListener('pointercancel',up);}
  const at=x=>cave[CL(Math.floor(x/SEG),0,cave.length-1)];
  const reset=()=>{const c0=at(h.x);h.y=(c0[1]+c0[2])/2-PH/2;h.vy=0;h.flash=.3;h.best=Math.max(h.best,h.dist);h.dist=0;};
  return {tick(sec){const thr=q.v('thr'),flap=q.v('flap');q.out('thr',thr+' u/s²');
    run(sec*slow(q),dt=>{h.t+=dt;if(h.flash>0){h.flash-=dt;return;}
      // the bot: aim at the corridor's centre 220 u ahead, with the look-ahead the siren rule asks for
      const ahead=at(h.x+200),ahead2=at(h.x+360),target=Math.max(ahead[1]+40,Math.min(ahead[2]-PH-40,((ahead[1]+ahead[2])/2+(ahead2[1]+ahead2[2])/2)/2-PH/2));const stop=h.y+(h.vy>0?h.vy*h.vy/(2*Math.max(200,thr-PHYS.gravity)):-h.vy*h.vy/(2*PHYS.gravity));const want=I.idle?(stop>target):manual>0;
      if(flap){if(want&&!h.held){h.vy=-PHYS.jumpVel*.5;SFX(snd,'jump',{vol:.5});}h.vy+=PHYS.gravity*dt;}
      else{h.vy+=(want?PHYS.gravity-thr:PHYS.gravity)*dt;if(want&&Math.floor(h.t*30)%3===0)SR.dust(dust_,h.x+PW/2-6,h.y+PH-6,1,-.6,1,.5);}
      h.held=want;h.vy=CL(h.vy,-VERBS.jetpack.terminal,VERBS.jetpack.terminal);h.y+=h.vy*dt;h.x+=PHYS.maxRun*dt;h.dist+=PHYS.maxRun*dt;
      const cv=at(h.x+PW/2);if(h.y<cv[1]+14||h.y+PH>cv[2]-14){h.deaths++;SFX(snd,'die');reset();}
      if(h.x>cave[cave.length-2][0])h.x=200;SR.updParts(dust_,dt);});
    const c=S.c;S.begin();const cam={x:h.x-260,y:G-560};S.world(cam,SCW);
    c.fillStyle=INK;for(const s of cave){if(s[0]+SEG<cam.x||s[0]>cam.x+VW)continue;c.fillRect(s[0],cam.y,SEG+1,s[1]-cam.y);c.fillRect(s[0],s[2],SEG+1,cam.y+600-s[2]);SR.drawSpikes(c,[s[0]+10,s[1],SEG-20,'down']);SR.drawSpikes(c,[s[0]+10,s[2],SEG-20]);}
    SR.drawParts(c,dust_);
    if(h.flash<=0){const pose=SR.blend(VP.thrust,VP.fall_||SR.POSES.fall,h.held?0:.6);SR.drawSamurai(c,pose,h.x+PW/2,h.y+PH,1,{flap:-.5,clock:h.t});
      c.fillStyle=INK;c.fillRect(h.x-6,h.y+14,7,16);if(h.held&&!flap){c.fillStyle=RED;c.beginPath();c.moveTo(h.x-6,h.y+30);c.lineTo(h.x+1,h.y+30);c.lineTo(h.x-2.5,h.y+40+Math.random()*8);c.closePath();c.fill();}}
    S.ui();
    const tFlap=[.37,.42],tSR=.33,tJet=VERBS.jetpack.terminal/(thr-PHYS.gravity);
    label(c,`${flap?'flap variant: vy -415 per tap, Flappy\'s rule':'thrust '+thr+' u/s² while held ('+(thr/PHYS.gravity).toFixed(1)+' g) against 2500 down, terminal 600 both ways'} · auto-scroll 420 u/s`,10,20,{s:12,w:600});
    label(c,flap?'a flap reads worse at 420 u/s and removes the hold':`from a 600 u/s fall to rising takes ${tJet.toFixed(2)} s under this thrust`,10,36,{s:11,col:MUTE});
    label(c,`deaths ${h.deaths} · this run ${(h.dist/BL).toFixed(0)} BL · best ${(h.best/BL).toFixed(0)} BL`,10,52,{s:11,col:MUTE,mono:1});
    // time-to-apex strip: Flappy clones 0.37 to 0.42 s, SpeedRunner's jump 0.33 s
    const x0=330,sc=500;c.fillStyle=PAPER;c.globalAlpha=.9;c.fillRect(x0-6,312,316,46);c.globalAlpha=1;c.fillStyle=PALE;c.fillRect(x0,330,300,6);c.fillStyle=LIGHT;c.fillRect(x0+tFlap[0]*sc,328,(tFlap[1]-tFlap[0])*sc,10);c.fillStyle=RED;c.fillRect(x0+tSR*sc-1,326,2,14);
    T(c,'time to apex: Flappy clones 0.37 to 0.42 s (grey), SpeedRunner\'s jump 0.33 s (red) [V, S132; K]',x0,322,{s:10,col:MUTE});T(c,'0',x0,350,{s:9,col:MUTE});T(c,'0.6 s',x0+300,350,{s:9,col:MUTE,al:'right'});
    RO(root,`Jetpack Joyride is one touch, thrust while held, constant forward speed; a vehicle from a gear box remaps the same touch until a hit [V, S112, S115] · in SpeedRunner the corridor is a map section, no fuel, because the corridor is the limit; as a core verb it removes the jump and the wall kit [K; I] · hold the button to fly, it flies alone after 2 s`);
  }};});
const dust_=[];

// ======================================================================
// D5 charged: Jump King's 0.6 s linear charge, 0.6 to 1.5 x jumpVel, direction locked, no air control
// ======================================================================
REG('charged',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const h={x:150,feet:G,vy:0,air:false,hold:0,holding:false,peak:0,lastHold:0,lastMult:0,t:0,phase:0,script:[.1,.3,.6],si:0,dir:0,vx:0};let manual=false;
  const hb=root.querySelector('[data-b="hold"]');if(hb){hb.addEventListener('pointerdown',()=>{manual=true;I.touch();});const up=()=>{manual=false;};hb.addEventListener('pointerup',up);hb.addEventListener('pointerleave',up);hb.addEventListener('pointercancel',up);}
  const MULT=t=>LP(VERBS.charged.mult[0],VERBS.charged.mult[1],Math.min(1,t/(VERBS.charged.maxHold*DT)));
  return {tick(sec){run(sec*slow(q),dt=>{h.t+=dt;
      let want=manual;
      if(I.idle&&!manual){if(!h.air){h.phase+=dt;const target=h.script[h.si%3];if(h.phase>.6&&h.phase<.6+target+dt)want=true;else if(h.phase>=.6+target+dt&&h.holding===false&&h.phase>1.2+target){h.phase=0;h.si++;}}}
      if(want&&!h.air){h.holding=true;h.hold+=dt;}
      else if(h.holding&&!h.air){h.holding=false;const m=MULT(h.hold);h.lastHold=h.hold;h.lastMult=m;h.vy=-PHYS.jumpVel*m;h.air=true;h.peak=0;h.hold=0;h.dir=1;h.vx=120;SFX(snd,'jump',{jitter:.05});}
      if(h.air){h.vy+=(h.vy<0?PHYS.gravity:PHYS.gravity*PHYS.fallMult)*dt;h.feet+=h.vy*dt;h.x+=h.vx*dt;h.peak=Math.max(h.peak,G-h.feet);if(h.feet>=G){h.feet=G;h.air=false;h.vy=0;h.x=150;SFX(snd,'land');}}});
    const c=S.c;S.begin();const sc=.55;S.world({x:0,y:G-620},sc);
    c.fillStyle=INK;c.fillRect(0,G,1200,200);
    // the height ladder: 0.6x, 1.0x (the plain jump), 1.5x
    [[.6,'0.6x: 1.1 BL (a tap)'],[1,'1.0x: 3.0 BL (the plain jump)'],[1.5,'1.5x: 6.7 BL (600 ms held)']].forEach(([m,s])=>{const hh=(m*PHYS.jumpVel)**2/(2*PHYS.gravity);dash(c,0,G-hh,1160,G-hh,m===1?GREY:RED,[4,4]);T(c,s,300,G-hh-6,{s:16,col:m===1?MUTE:RED});});
    if(h.peak>0&&h.air)dash(c,h.x-40,G-h.peak,h.x+60,G-h.peak,INK,[2,2]);
    const pose=h.holding?SR.blend(VP.charge,SR.idlePose(h.t),.0):h.air?(h.vy<0?SR.POSES.rise:SR.POSES.fall):SR.idlePose(h.t);
    SR.drawSamurai(c,pose,h.x+PW/2,h.feet,1,{clock:h.t,sy:h.holding?1-.12*Math.min(1,h.hold/.6):1});
    // the meter above the head while holding
    if(h.holding){const k=Math.min(1,h.hold/(VERBS.charged.maxHold*DT));c.fillStyle=PALE;c.fillRect(h.x-20,h.feet-80,60,8);c.fillStyle=k>=1?RED:INK;c.fillRect(h.x-20,h.feet-80,60*k,8);T(c,`${Math.round(h.hold*1000)} ms`,h.x+10,h.feet-86,{s:14,al:'center',mono:1});}
    S.ui();
    T(c,h.holding?`holding ${Math.round(h.hold*1000)} ms → intensity ${Math.min(1,h.hold/.6).toFixed(2)} → ${MULT(h.hold).toFixed(2)} x jumpVel`:h.lastHold?`held ${Math.round(h.lastHold*1000)} ms → ${h.lastMult.toFixed(2)} x jumpVel = ${Math.round(h.lastMult*PHYS.jumpVel)} u/s → apex ${((h.lastMult*PHYS.jumpVel)**2/(2*PHYS.gravity)/BL).toFixed(1)} BL`:'hold Jump while standing still, release to jump',10,20,{s:13,w:600});
    T(c,'intensity = min(1, hold / 0.6 s), linear; direction locked at release, no air control',10,36,{s:11,col:MUTE});
    RO(root,`Jump King: <code>CHARGE_TIME 0.6</code>, <code>JUMP -8.742858</code> px per frame, horizontal <code>SPEED 3.5</code> locked from the d-pad; the charge is quantised to 2 to 36 steps, max height 148.6 px = 5.7 body heights [V, S44, S46, S47] · in SpeedRunner it lives only while standing still (|vx| under 20 u/s) because it fights the variable jump on the same key; a 600 ms stand-still is 250 u of running given away [K; I] · press and hold the button`);
  }};});

// ======================================================================
// E1 hammer: Getting Over It's one analog verb, a pot with a hammer following the pointer (figure only)
// ======================================================================
REG('hammer',root=>{const S=stage(root),q=CTL(root),I=idler(root),run=fixed();
  const pts=[[0,330],[120,330],[260,250],[380,250],[430,180],[520,180],[560,120],[640,110]];     // the slope, illustrative
  const gy=x=>{for(let i=1;i<pts.length;i++){if(x<=pts[i][0]){const a=pts[i-1],b=pts[i],t=(x-a[0])/(b[0]-a[0]);return LP(a[1],b[1],CL(t,0,1));}}return pts[pts.length-1][1];};
  const B={x:60,y:300,vx:0,vy:0,r:22},Hm={x:120,y:260},REACH=110,RESP=.59;let ptr=null,t=0,planted=false,moves=0,top=0;
  S.cv.addEventListener('pointermove',e=>{ptr=S.pos(e);moves++;});S.cv.addEventListener('pointerdown',e=>{ptr=S.pos(e);});S.cv.addEventListener('pointerleave',()=>{ptr=null;});
  return {tick(sec){run(sec*slow(q),dt=>{t+=dt;
      // the target: the pointer, or an idle windmill ahead of the body
      let tx,ty;if(ptr&&!I.idle){[tx,ty]=ptr;}else{const a=t*2.6;tx=B.x+Math.cos(a)*105+40;ty=B.y+Math.sin(a)*105-10;}
      let dx=tx-B.x,dy=ty-B.y;const d=Math.hypot(dx,dy);if(d>REACH){dx*=REACH/d;dy*=REACH/d;}
      const want={x:B.x+dx,y:B.y+dy};const hx=Hm.x+(want.x-Hm.x)*RESP,hy=Hm.y+(want.y-Hm.y)*RESP;   // 0.59 responsiveness per step [V, S122]
      const gyh=gy(hx);planted=hy>gyh;
      if(planted){const push=hy-gyh;Hm.x=hx;Hm.y=gyh;B.y-=push*.95;B.vy=-push*.95/dt*.35;const mx=(hx-Hm.x);B.vx+=0;      // the planted head moves the body instead
        const dxh=want.x-hx;B.x-=dxh*RESP*.6;B.vx=-dxh*RESP*.6/dt*.3;}
      else{Hm.x=hx;Hm.y=hy;}
      B.vy+=900*dt;B.vx*=.995;B.x+=B.vx*dt;B.y+=B.vy*dt;
      const g=gy(B.x);if(B.y+B.r>g){B.y=g-B.r;if(B.vy>0)B.vy=0;B.vx*=.86;}
      if(B.x<B.r){B.x=B.r;B.vx=Math.abs(B.vx)*.3;}if(B.x>620){B.x=620;B.vx=-Math.abs(B.vx)*.3;}if(B.y<-200){B.y=-200;}
      top=Math.max(top,330-(B.y+B.r));});
    const c=S.c;S.begin();
    c.fillStyle=INK;c.beginPath();c.moveTo(0,360);for(const p of pts)c.lineTo(p[0],p[1]);c.lineTo(640,360);c.closePath();c.fill();
    // reach circle, the pot, the man, the hammer
    c.save();c.strokeStyle=LIGHT;c.setLineDash([3,4]);c.beginPath();c.arc(B.x,B.y,REACH,0,Math.PI*2);c.stroke();c.restore();
    c.fillStyle=INK;c.beginPath();c.ellipse(B.x,B.y+4,B.r,B.r*.85,0,0,Math.PI*2);c.fill();c.fillStyle=PAPER;c.fillRect(B.x-14,B.y-4,28,3);
    const ps={hip:9,lean:.3+(Hm.x-B.x)/400,th:[.2,-.2],sh:[.2,.2],ua:[Math.atan2(Hm.x-B.x,-(Hm.y-B.y))-.4,.6],la:[.4,.3]};
    SR.drawSamurai(c,ps,B.x,B.y-6,Hm.x>=B.x?1:-1,{katana:false,clock:t,kim:RED});
    c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.moveTo(B.x,B.y-30);c.lineTo(Hm.x,Hm.y);c.stroke();c.fillStyle=planted?RED:INK;c.save();c.translate(Hm.x,Hm.y);c.rotate(Math.atan2(Hm.y-(B.y-30),Hm.x-B.x));c.fillRect(-6,-9,12,18);c.restore();
    T(c,`the cursor is the hammer head, clamped to a ${REACH} u reach; the body follows a planted head`,10,20,{s:12,w:600});
    T(c,planted?'planted: the head is fixed, so the move goes into the body (hook, vault, pogo are patterns of this)':'swinging: the head moves 0.59 of the way to the target each step',10,36,{s:11,col:planted?RED:MUTE});
    T(c,`highest point this session ${Math.round(top)} u · pointer moves ${moves}`,10,52,{s:11,col:MUTE,mono:1});
    T(c,'illustrative: Foddy\'s pot mass, joint and motor force are unpublished; the reach and responsiveness are a Godot clone\'s [V, S122; U]',10,352,{s:10,col:MUTE});
    RO(root,`a pointer path at 120 Hz is replayable but never comparable across players, and the game is keyboard-only, so the hammer is a figure, not a toggle [K; I] · what transfers is depth inside one input, which F4's iai hold and H2's chords apply to the katana button [I] · move the pointer over the paper to drive the hammer`);
  }};});

// ======================================================================
// E2 drawslope: draw a slope with the pointer under a skier; speed from the slope; lift to jump (figure only)
// ======================================================================
REG('drawslope',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  let line=[[0,260],[200,260]],sk={x:60,y:260,s:200,air:false,vx:0,vy:0,ang:0,t:0,best:0,airT:0,drawn:0},cam={x:0,y:0},drawing={on:false,cut:false},gen=RNG(3),genT=0;
  const yAt=x=>{if(x<line[0][0]||x>line[line.length-1][0])return null;let lo=0,hi=line.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(line[m][0]<=x)lo=m;else hi=m;}const a=line[lo],b=line[hi];return {y:LP(a[1],b[1],(x-a[0])/((b[0]-a[0])||1)),ang:Math.atan2(b[1]-a[1],b[0]-a[0])};};
  const add=(x,y)=>{if(x<sk.x+40)return;if(!drawing.cut){while(line.length>2&&line[line.length-1][0]>=x)line.pop();drawing.cut=true;}const last=line[line.length-1];if(x>last[0]+6){line.push([x,CL(y,30,340)]);sk.drawn++;}};
  S.cv.addEventListener('pointerdown',e=>{drawing.on=true;drawing.cut=false;const [px,py]=S.pos(e);add(px+cam.x,py);});S.cv.addEventListener('pointermove',e=>{if(!drawing.on)return;const [px,py]=S.pos(e);add(px+cam.x,py);});
  const up=()=>{drawing.on=false;};S.cv.addEventListener('pointerup',up);S.cv.addEventListener('pointerleave',up);S.cv.addEventListener('pointercancel',up);
  return {tick(sec){run(sec*slow(q),dt=>{sk.t+=dt;const last=line[line.length-1];
      // idle: the figure draws its own hills ahead; a gap now and then is the lift
      if(I.idle&&!drawing.on&&last[0]<sk.x+700){genT+=1;const g=gen();if(g<.06&&last[0]>sk.x+400&&last[1]>120){line.push([last[0]+180+gen()*120,CL(last[1]+40+gen()*60,30,340)]);}
        else{const ny=CL(last[1]+Math.sin(last[0]/90)*22+(gen()-.5)*26,40,340);line.push([last[0]+18,ny]);}}
      while(line.length>2&&line[1][0]<sk.x-400)line.shift();
      const seg=yAt(sk.x);
      if(!sk.air){if(seg&&Math.abs(sk.y-seg.y)<40){sk.ang=seg.ang;sk.s+=PHYS.gravity*Math.sin(sk.ang)*dt;sk.s=CL(sk.s,60,1250);sk.x+=sk.s*Math.cos(sk.ang)*dt;const n=yAt(sk.x);
          if(n){const dy=n.y-sk.y;if(dy>sk.s*Math.sin(sk.ang)*dt+8&&sk.ang<n.ang-.02||!n){sk.air=true;sk.vx=sk.s*Math.cos(sk.ang);sk.vy=sk.s*Math.sin(sk.ang);sk.airT=0;SFX(snd,'jump',{vol:.4});}else sk.y=n.y;}
          else{sk.air=true;sk.vx=sk.s*Math.cos(sk.ang);sk.vy=sk.s*Math.sin(sk.ang);sk.airT=0;SFX(snd,'jump',{vol:.4});}}
        else{sk.air=true;sk.vx=sk.s*Math.cos(sk.ang);sk.vy=sk.s*Math.sin(sk.ang);sk.airT=0;}}
      else{sk.vy+=PHYS.gravity*dt;sk.x+=sk.vx*dt;sk.y+=sk.vy*dt;sk.airT+=dt;const n=yAt(sk.x);
        if(n&&sk.y>=n.y&&sk.vy>0){sk.y=n.y;sk.air=false;sk.ang=n.ang;sk.s=Math.max(60,sk.vx*Math.cos(n.ang)+sk.vy*Math.sin(n.ang));SFX(snd,'land',{vol:.5});}
        if(sk.y>420){sk.y=line[0][1];sk.x=line[0][0]+20;sk.air=false;sk.s=200;}}
      sk.best=Math.max(sk.best,sk.s);cam.x=sk.x-180;});
    const c=S.c;S.begin();c.save();c.translate(-cam.x,0);
    c.strokeStyle=INK;c.lineWidth=3;c.beginPath();line.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();
    c.save();c.globalAlpha=.08;c.fillStyle=INK;c.beginPath();line.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.lineTo(line[line.length-1][0],400);c.lineTo(line[0][0],400);c.closePath();c.fill();c.restore();
    // the skier: the stick samurai on skis, leaning into the slope
    const lean=sk.air?.1:sk.ang*.6;SR.drawSamurai(c,{hip:16,lean:.25+lean,th:[.9,-.2],sh:[1.4,.9],ua:[.9,-.7],la:[.5,.5]},sk.x,sk.y,1,{rot:sk.air?Math.min(.5,sk.airT*.8):sk.ang,katana:false,clock:sk.t});
    c.save();c.translate(sk.x,sk.y);c.rotate(sk.air?Math.min(.5,sk.airT*.8):sk.ang);c.fillStyle=INK;c.fillRect(-22,0,52,3);c.restore();
    c.restore();
    const deg=(sk.ang*180/Math.PI);T(c,`speed ${sk.s.toFixed(0)} u/s (${(sk.s/PHYS.maxRun).toFixed(2)}x maxRun) · slope ${sk.air?'in the air':deg.toFixed(0)+'°'} · ${sk.air?'lifted: ballistic':'a = g·sin θ = '+(PHYS.gravity*Math.sin(sk.ang)).toFixed(0)+' u/s²'}`,10,20,{s:12,w:600});
    T(c,'on a 30° downslope the gain is 1250 u/s², three times maxRun in a second, which is why slopes need a cap (here 1250 u/s) [K; I]',10,36,{s:11,col:MUTE});
    T(c,`drawn points ${sk.drawn} · fastest ${sk.best.toFixed(0)} u/s · drag on the paper to draw the hill ahead; it draws itself after 2 s`,10,352,{s:10,col:MUTE});
    RO(root,`Solipskier: draw the slope, downhill adds speed, inclines launch tricks, no tutorial [V, S127] · Tiny Wings holds to drop so the hill launches the bird [V, S128] · the player authors the route, so times are not comparable; the verb that survives is the slope slide, once the AABB collision learns slopes [I]`);
  }};});

// ======================================================================
// E3 tilt: tilt steering on a rising course with fixed-height item swaps (spring, propeller, jetpack, rocket)
// ======================================================================
REG('tilt',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const WW=640,rng=RNG(11);const plats=[];for(let i=0;i<400;i++)plats.push({x:40+rng()*(WW-120),y:G-i*95,w:80});
  const items=[{h:600,kind:'spring',lab:'spring 2x: 12 BL'},{h:1500,kind:'propeller',lab:'propeller 3 s at 300 u/s: 900 u'},{h:2700,kind:'jetpack',lab:'jetpack 2 s at 1000 u/s: 2000 u'},{h:4900,kind:'rocket',lab:'rocket 1 s at 2000 u/s: 2000 u'}];
  for(const it of items){const p=plats.reduce((a,b)=>Math.abs(G-b.y-it.h)<Math.abs(G-a.y-it.h)?b:a);it.x=p.x+p.w/2;it.y=p.y;it.used=false;}
  const d={x:300,y:G-PH,vx:0,vy:-PHYS.jumpVel,t:0,fly:null,flyT:0,best:0,deaths:0,ctrl:1,tilt:0};let camY=G-400,dev=null,devOn=false;
  q.btn('dev',e=>{if(devOn)return;const on=ev=>{if(ev.gamma!=null)dev=CL(ev.gamma/30,-1,1);};const go=()=>{window.addEventListener('deviceorientation',on);devOn=true;e.textContent='Device tilt on';};
    if(typeof DeviceOrientationEvent!=='undefined'&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().then(go).catch(()=>{e.textContent='Tilt not available';});else go();});
  const reset=()=>{d.x=300;d.y=G-PH;d.vx=0;d.vy=-PHYS.jumpVel;d.fly=null;camY=G-400;for(const it of items)it.used=false;};
  return {tick(sec){run(sec*slow(q),dt=>{d.t+=dt;
      // steering: the slider, the device, or the idle autopilot toward the next platform above
      let tilt=q.v('tilt')/100;if(dev!=null)tilt=dev;
      if(I.idle&&dev==null){const feet=d.y+PH;let next;if(d.vy<0)next=plats.find(p=>p.y<feet-10&&p.y>feet-200);else{for(const p of plats)if(p.y>=feet-6){if(!next||p.y<next.y)next=p;}}next=next||plats[0];tilt=CL((next.x+next.w/2-(d.x+PW/2))/70,-1,1);}
      d.tilt=tilt;d.vx=tilt*PHYS.maxRun*d.ctrl;d.x+=d.vx*dt;if(d.x<-PW)d.x=WW;if(d.x>WW)d.x=-PW;             // screen wrap
      if(d.fly){d.flyT-=dt;d.vy=-d.fly.v;d.y+=d.vy*dt;if(d.flyT<=0){d.fly=null;d.ctrl=1;d.vy=0;}}
      else{d.vy+=PHYS.gravity*(d.vy>0?PHYS.fallMult:1)*dt;const y0=d.y;d.y+=d.vy*dt;
        if(d.vy>0)for(const p of plats){if(d.x+PW>p.x&&d.x<p.x+p.w&&y0+PH<=p.y+2&&d.y+PH>=p.y){d.y=p.y-PH;d.vy=-PHYS.jumpVel;SFX(snd,'jump',{vol:.4,jitter:.05});   // the jump is automatic
            const it=items.find(i=>!i.used&&Math.abs(i.y-p.y)<2&&Math.abs(i.x-(d.x+PW/2))<50);
            if(it){it.used=true;SFX(snd,'check');if(it.kind==='spring')d.vy=-PHYS.jumpVel*2;else if(it.kind==='propeller'){d.fly={v:300};d.flyT=3;d.ctrl=1;}else if(it.kind==='jetpack'){d.fly={v:1000};d.flyT=2;d.ctrl=.5;}else{d.fly={v:2000};d.flyT=1;d.ctrl=0;}}break;}}}
      camY=Math.min(camY,d.y-200);d.best=Math.max(d.best,G-d.y-PH);
      if(d.y>camY+420){d.deaths++;SFX(snd,'die');reset();}});
    const c=S.c;S.begin();const sc=.8;S.world({x:0,y:camY},sc);
    c.fillStyle=INK;for(const p of plats){if(p.y<camY-20||p.y>camY+500)continue;c.fillRect(p.x,p.y,p.w,8);}
    for(const it of items){if(it.y<camY-20||it.y>camY+500||it.used)continue;c.fillStyle=RED;if(it.kind==='spring'){c.fillRect(it.x-12,it.y-10,24,10);}else{c.beginPath();c.arc(it.x,it.y-14,10,0,Math.PI*2);c.fill();T(c,it.kind[0].toUpperCase(),it.x,it.y-10,{s:11,col:PAPER,al:'center',w:700});}T(c,it.lab,it.x+16,it.y-10,{s:11,col:RED});}
    const pose=d.fly?VP.glide:(d.vy<0?SR.POSES.rise:SR.POSES.fall);SR.drawSamurai(c,pose,d.x+PW/2,d.y+PH,d.vx>=0?1:-1,{katana:false,clock:d.t,rot:d.tilt*.25});
    if(d.fly){c.fillStyle=RED;c.fillRect(d.x+PW/2-14,d.y-6,28,3);}
    // the BL ladder on the right
    S.ui();for(let b=0;b<=400;b+=5){const y=(G-b*BL-camY)*sc;if(y<0||y>360)continue;c.fillStyle=LIGHT;c.fillRect(600,y,40,1);T(c,b+' BL',636,y-3,{s:9,col:MUTE,al:'right'});}
    T(c,`height ${((G-d.y-PH)/BL).toFixed(0)} BL · best ${(d.best/BL).toFixed(0)} BL · falls ${d.deaths}${d.fly?' · '+(d.ctrl===1?'propeller: full control':d.ctrl===.5?'jetpack: control halved':'rocket: no control'):''}`,10,20,{s:12,w:600});
    T(c,`steer ${dev!=null?'by device tilt':'by the slider'} (${(d.tilt*100).toFixed(0)}%) · the jump is automatic, items sit at fixed heights`,10,36,{s:11,col:MUTE});
    RO(root,`Doodle Jump: tilt to steer, tap to shoot, screen wrap, items as flights of a known height [V, S116, S117] · tilt adds about 100 ms of filter latency, a late input for a wall flip, so it is no on desktop and a future phone mapping of run [S4 A6; I] · items on a ghost race must sit at fixed positions or the ghost and the live run diverge [I]`);
  }};});

// ======================================================================
// E4 fallguys: dive and grab timings against a clock; the same input, a different ragdoll landing
// ======================================================================
REG('fallguys',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.5,VW=640/SCW,w=flat(2000);const lanes=[{name:'clean run',dive:false,seed:1},{name:'dive, seed A',dive:true,seed:1},{name:'dive, seed B',dive:true,seed:2},{name:'dive, seed C',dive:true,seed:3}];
  for(const L of lanes){L.R=mkR(w,60);L.R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};L.t=0;L.fin=null;L.prone=0;L.rag=0;}
  let done=0,round=0,lastSpread=null;const reset=()=>{for(const L of lanes){L.R.reset();L.t=0;L.fin=null;L.prone=0;L.dived=false;}done=0;round++;};
  return {tick(sec){const varr=q.v('var')/100,same=q.v('same');q.out('var',(varr*1000).toFixed(0)+' ms');
    run(sec*slow(q),dt=>{if(done>0){done-=dt;if(done<=0)reset();return;}let all=true;
      for(const L of lanes){const R=L.R,P=R.P;if(L.fin!=null)continue;all=false;L.t+=dt;
        const k={right:L.prone<=0,jump:false,jumpPressed:false};
        if(P.onGround&&P.x>520&&P.x<550&&!L.j){k.jumpPressed=true;L.j=true;}
        if(L.dive&&!P.onGround&&P.vy>-60&&!L.dived){L.dived=true;P.vx=PHYS.maxRun*1.3;P.vy=Math.max(P.vy,0);L.diving=true;}   // the dive: a lunge into a prone body (illustrative numbers)
        if(L.prone>0){L.prone-=dt;P.vx=0;}
        const ev=stepR(R,k,dt);for(const x of ev){if(x.t==='jump')SFX(snd,'jump',{vol:.3});if((x.t==='land'||x.t==='touch'||x.t==='roll')&&L.diving){L.diving=false;
            const r=RNG(same?7:L.seed*131+round)(),rag=varr*r;L.rag=rag;L.prone=.5+rag;P.roll=0;SFX(snd,'land');}}
        if(P.x>1900){L.fin=L.t;}}
      if(all){done=1.6;const ff=lanes.slice(1).map(L=>L.fin);lastSpread=Math.max(...ff)-Math.min(...ff);}});
    const c=S.c;S.begin();
    lanes.forEach((L,i)=>{const R=L.R,P=R.P,y0=i*82;c.save();c.beginPath();c.rect(0,y0,640,82);c.clip();const cam={x:camX(P,VW,w.width,200),y:G-130};S.world(cam,SCW,0,y0);
      SR.drawSolids(c,w,cam,{VW,start:false});c.fillStyle=RED;c.fillRect(1900,G-80,3,80);
      if(L.prone>0){SR.drawSamurai(c,VP.prone,P.x+PW/2+10,P.y+PH,1,{clock:R.time,katana:false});}else if(L.diving){SR.drawSamurai(c,VP.dive,P.x+PW/2,P.y+PH,1,{clock:R.time,katana:false});SR.drawParts(c,R.parts);}else drawR(c,R);
      S.ui();T(c,L.name,8,y0+14,{s:12,w:600,col:L.dive?RED:INK});T(c,`clock ${L.fin!=null?fmtMs(L.fin*1000)+' finished':fmtMs(L.t*1000)}${L.prone>0?' · prone '+(L.prone).toFixed(2)+' s (ragdoll +'+(L.rag*1000).toFixed(0)+' ms)':''}`,8,y0+28,{s:10,col:MUTE,mono:1});
      dash(c,0,y0+82,640,y0+82,LIGHT,[2,3]);c.restore();});
    const spread=lastSpread;
    RO(root,`same inputs on lanes 2 to 4, landing settled by a ${same?'seeded':'unseeded'} ragdoll: finish spread <b>${spread!=null?(spread*1000).toFixed(0)+' ms':'…'}</b> · Walsh: "we don't want players who speedrun games to win every single time"; Tanton: "Falling over is basically their superpower" [V, S133, S134] · a ghost cannot carry an outcome the input does not decide, unless the ragdoll is seeded [I] · dive lunge and prone time are illustrative, Fall Guys publishes neither`);
  }};});

// ======================================================================
// E5 antiverbs: Cat Mario's trick vocabulary on a comedy map; "learned once" shows the second attempt
// ======================================================================
REG('antiverbs',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.6,VW=640/SCW;
  const traps=[{x:420,name:'fake solid falls',draw:'block'},{x:760,name:'hidden block over the gap',draw:'hidden'},{x:1080,name:'the cloud drops you',draw:'cloud'},{x:1380,name:'hostile power-up',draw:'shroom'},{x:1700,name:'the goal walks away',draw:'goal'}];
  const w=SR.makeCourse({width:2100,solids:[[0,G,2100,300]],deathY:G+80});
  const R=mkR(w,60);R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};
  let learned=new Set(),attempt=1,deaths=0,gag=null,done=0,total=0,times=[],clearT=null,last=null;
  const restart=()=>{R.reset();done=0;gag=null;attempt++;};
  q.on('learn',()=>{learned=q.v('learn')?new Set(traps.map(t=>t.x)):new Set();attempt=1;deaths=0;total=0;times=[];clearT=null;R.reset();});
  return {tick(sec){run(sec*slow(q),dt=>{const P=R.P;total+=dt;
      if(gag){gag.t+=dt;if(gag.t>.45&&!gag.dead){gag.dead=true;deaths++;SFX(snd,'die');learned.add(gag.trap.x);times.push(R.time);}if(gag.t>.45+.38){restart();}return;}   // the 0.38 s restart beat
      if(done>0){done-=dt;if(done<=0){learned=q.v('learn')?learned:new Set();attempt=0;deaths=0;total=0;times=[];clearT=null;restart();}return;}
      const k={right:true,jump:!P.onGround&&P.vy<0,jumpPressed:false};
      for(const t of traps){const kn=learned.has(t.x);if(kn&&P.onGround&&P.x>t.x-160&&P.x<t.x-130&&t.draw!=='hidden'&&t.draw!=='shroom'){k.jumpPressed=true;}  // learned: jump the trap
        if(!kn&&P.x>t.x-30&&P.x<t.x+30&&!gag){gag={trap:t,t:0,dead:false};P.vx=0;}
        if(kn&&t.draw==='hidden'&&P.onGround&&P.x>t.x-120&&P.x<t.x-90&&!k.jumpPressed){/* learned: run through, never jump */}}
      stepR(R,k,dt);
      if(P.x>2000&&!gag){clearT=R.time;done=2;last={attempt,deaths};}});
    const c=S.c;S.begin();const P=R.P;const cam={x:camX(P,VW,w.width,160),y:G-440};S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});
    for(const t of traps){const kn=learned.has(t.x),gg=gag&&gag.trap===t?gag.t:0;c.save();
      if(t.draw==='block'){c.fillStyle=kn?LIGHT:INK;c.fillRect(t.x-30,G-40+gg*300,60,40);if(kn)box(c,t.x-30,G-40,60,40,RED);}
      else if(t.draw==='hidden'){if(kn||gg){c.fillStyle=gg?INK:PALE;c.fillRect(t.x-20,G-150,40,40);box(c,t.x-20,G-150,40,40,RED);}else{c.strokeStyle=PALE;c.setLineDash([2,3]);c.strokeRect(t.x-20,G-150,40,40);}}
      else if(t.draw==='cloud'){c.fillStyle=kn?LIGHT:INK;c.beginPath();c.ellipse(t.x,G-110+gg*260,46,16,0,0,Math.PI*2);c.fill();}
      else if(t.draw==='shroom'){c.fillStyle=RED;c.beginPath();c.arc(t.x,G-22,16,Math.PI,0);c.fill();c.fillStyle=INK;c.fillRect(t.x-6,G-22,12,22);if(gg){c.fillStyle=PAPER;for(let i=0;i<4;i++){c.beginPath();c.moveTo(t.x-12+i*7,G-14);c.lineTo(t.x-9+i*7,G-6);c.lineTo(t.x-6+i*7,G-14);c.fill();}}}
      else{SR.drawFlag(c,t.x+gg*500,G);}c.restore();
      S.world(cam,SCW);T(c,(kn?'learned: ':'')+t.name,t.x,G-172,{s:16,al:'center',col:kn?MUTE:RED});}
    if(gag&&gag.dead){c.strokeStyle=RED;c.lineWidth=3;c.beginPath();c.moveTo(P.x-6,P.y+6);c.lineTo(P.x+26,P.y+40);c.moveTo(P.x+26,P.y+6);c.lineTo(P.x-6,P.y+40);c.stroke();}else drawR(c,R);
    S.ui();
    T(c,`attempt ${attempt} · deaths ${deaths} · traps learned ${learned.size} of 5 · clock ${fmtMs(total*1000)}`,10,20,{s:13,w:600});
    T(c,gag?gag.trap.name+(gag.dead?' · dead, 0.38 s to the restart':''):clearT!=null?`clear in ${fmtMs(clearT*1000)} on attempt ${attempt}`:'run and jump only; the level breaks every promise the shape makes',10,36,{s:11,col:gag?RED:MUTE});
    // the trap counter as a strip
    traps.forEach((t,i)=>{c.fillStyle=learned.has(t.x)?INK:PALE;c.fillRect(10+i*18,330,14,14);});T(c,'trap counter',10,326,{s:10,col:MUTE});
    RO(root,`a deterministic map with a 0.38 s restart makes betrayal cost nothing after one death and teach nothing after the second [K; S4 F1; I] · the first clear here costs about ${times.length?times.reduce((a,b)=>a+b,0).toFixed(1):'…'} s of dead runs plus 5 x 0.38 s; the learned run costs none · Syobon Action's TAS gains only on a one-frame wall clip and a quick turn [V, S23]`);
  }};});

// ======================================================================
// F1 dashslash: the kill line, 2 / 12 / 6 steps, 840 u/s, 84 u through enemies; a momentum readout; the frame strip
// ======================================================================
REG('dashslash',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.8,VW=640/SCW;const mk=()=>flat(1500,{foes:[760,805,850,895].map(x=>({x,y:G-30,w:30,h:30,alive:true}))});
  let w=mk();const R=mkR(w,60);R.snd=snd;R.opt={crouch:false,slide:false,stomp:false,pogo:false};
  let done=0,hist=[],holdK=false,relX=0,log={pre:0,peak:0,exit:0,kills:0,travel:0,x0:0},jumpC=false,manual={hold:false,rel:false};
  const hb=root.querySelector('[data-b="hold"]');if(hb){hb.addEventListener('pointerdown',()=>{manual.hold=true;I.touch();});const up=()=>{if(manual.hold){manual.hold=false;manual.rel=true;}};hb.addEventListener('pointerup',up);hb.addEventListener('pointerleave',up);hb.addEventListener('pointercancel',up);}
  const reset=()=>{w=mk();R.w=w;R.reset();done=0;holdK=false;relX=0;log={pre:0,peak:0,exit:0,kills:0,travel:0,x0:0};};
  return {tick(sec){const act=q.v('act');q.out('act',act+' steps');R.opt.dsActive=act;
    run(sec*slow(q),dt=>{const P=R.P,Sv=R.S;if(done>0){done-=dt;if(done<=0)reset();return;}
      const k={right:Sv.state!=='dashSlash',jump:false,jumpPressed:false,katana:false};
      if(I.idle){if(P.x>430&&P.x<700&&Sv.state==='normal'&&Sv.dashes>0)holdK=true;if(holdK&&P.x>=w.foes[0].x-34){holdK=false;}}
      else{if(manual.hold)holdK=true;if(manual.rel){holdK=false;manual.rel=false;}}
      k.katana=holdK;
      if(Sv.state==='dashSlash'&&local.phase(Sv.t,2,Sv.active,6)==='recovery'&&Sv.t===2+Sv.active+2&&q.v('jc')){k.jumpPressed=true;k.jump=true;}
      if(Sv.state==='normal'&&P.vy<0)k.jump=true;
      const was=Sv.state;const vxPre=Math.abs(P.vx);const ev=stepR(R,k,dt);
      if(Sv.state==='dashSlash'&&was!=='dashSlash'){log.pre=vxPre;log.x0=P.x;log.peak=0;}
      if(Sv.state==='dashSlash'){log.peak=Math.max(log.peak,Math.abs(P.vx));log.travel=P.x-log.x0;}
      if(was==='dashSlash'&&Sv.state!=='dashSlash'){log.exit=Math.abs(P.vx);log.kills=Sv.kills;hist.push(log.kills);if(hist.length>12)hist.shift();}
      for(const x of ev){if(x.t==='jump')SFX(snd,'jump');if(x.t==='land')SFX(snd,'land');}
      if(P.x>1400||P.dead)done=.4;});
    const c=S.c;S.begin();const P=R.P,Sv=R.S;const cam={x:camX(P,VW,w.width,100),y:G-250};
    c.save();c.beginPath();c.rect(0,0,640,235);c.clip();S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});
    // the kill line: body plus travel plus blade, 154 to 196 x 40 u
    if(Sv.state==='dashSlash'||Sv.armed){const len=act*7,x0=Sv.state==='dashSlash'?log.x0:P.x;c.save();c.fillStyle='rgba(208,40,31,.10)';c.fillRect(x0,P.y+6,PW+len+50,40);c.restore();SR.dim(c,x0,P.y-10,x0+PW+len+50,P.y-10,`${PW+len+50} x 40 u swept, ${len} u of travel = ${(len/BL).toFixed(1)} BL`,{col:RED,oy:-6});}
    drawEnemies(c,w);drawR(c,R,{hb:q.v('hb')});S.ui();
    const ph=Sv.state==='dashSlash'?local.phase(Sv.t,2,Sv.active,6):null;
    T(c,Sv.state==='dashSlash'?`dash-slash ${ph} · step ${Sv.t} · vx ${Math.abs(P.vx).toFixed(0)} u/s`:Sv.armed?`armed (held ${Sv.holdK} steps${Sv.holdK>=36?', full':''}) · release to fire`:holdK?`holding Katana ${Sv.holdK} steps · arms at 24`:`vx ${Math.abs(P.vx).toFixed(0)} u/s · dash-slash ${Sv.dashes>0?'ready':'spent (grey kimono), refunded by a kill or a landing'}`,10,20,{s:13,w:600,col:Sv.state==='dashSlash'?RED:INK});
    T(c,log.exit?`last line: ${log.pre.toFixed(0)} → ${log.peak.toFixed(0)} → exit ${log.exit.toFixed(0)} u/s, ${log.travel.toFixed(0)} u, kills ${log.kills}`:'momentum: run 420 → 840 during active → exit clamped to 546, the hyper\'s ceiling, then the 500 u/s² decay',10,36,{s:11,col:MUTE});
    c.restore();
    // the frame strip: startup 2, active N, recovery 6
    const tot=2+act+6,sw=Math.min(28,600/tot);T(c,`the ${tot} physics steps of one dash-slash (8.33 ms each): startup 2, active ${act} at 7 u per step, recovery 6 with air control locked`,10,252,{s:11});
    for(let i=0;i<tot;i++){const x=12+i*sw,phz=local.phase(i,2,act,6),cur=Sv.state==='dashSlash'&&Sv.t===i;c.fillStyle=phz==='active'?PINK:phz==='startup'?'#f1f1f1':PAPER;c.fillRect(x,262,sw-2,66);if(cur){c.strokeStyle=RED;c.lineWidth=2;c.strokeRect(x+1,263,sw-4,64);}
      if(phz==='active'){c.fillStyle=RED;c.fillRect(x+2,300,sw-6,3);}if(phz==='recovery'&&i===2+act+2&&q.v('jc')){T(c,'jump',x+sw/2-1,290,{s:9,col:BLUE,al:'center'});}
      if(i%2===0||i===tot-1)T(c,String(Math.round(i*DT*1000)),x+sw/2-1,342,{s:9,col:MUTE,al:'center',mono:1});}
    T(c,'ms',12+tot*sw+4,342,{s:9,col:MUTE});
    RO(root,`kills on the last ${hist.length} lines: <b>${hist.join(' ')||'…'}</b> · the read is the line drawn before release, not the frames [I] · Ghostrunner's Blink kills along a line after a short charge [V, S160]; Mega Man Zero slashes forward while dashing [V, S164] · Celeste's 2.67x for 0.15 s is the upper bound, 2.0x for 0.10 s the conservative start [V, S7; I] · hold the button, let go to fire`);
  }};});

// ======================================================================
// F2 pogoslash: Down + Katana in the air, a 40x50 u box, a fixed 830 u/s bounce, the dash refund; spikes become steps
// ======================================================================
REG('pogoslash',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.75,VW=640/SCW,P0=500,P1=1290;
  const mk=()=>SR.makeCourse({width:1800,solids:[[0,G,P0,300],[P1,G,600,300],[P0,G+120,P1-P0,200]],spikes:[[P0,G+120,P1-P0]],deathY:G+200,
    foes:[650,895,1140].map(x=>({x,y:G-10,w:30,h:34,alive:true,spike:true}))});
  let w=mk();const R=mkR(w,60);R.snd=snd;R.opt={crouch:false,slide:false,stomp:false,dashSlash:false};R.S.dashes=0;
  let done=0,stat={cross:0,fall:0},apex=null,bounceY=null,reachNote=0;
  const reset=()=>{w=mk();R.w=w;R.reset();R.S.dashes=0;done=0;apex=null;bounceY=null;};
  return {tick(sec){const bh=q.v('bh');q.out('bh',bh+' u');R.opt.pogoH=bh;
    run(sec*slow(q),dt=>{const P=R.P,Sv=R.S;if(done>0){done-=dt;if(done<=0)reset();return;}
      const k={right:true,down:!P.onGround,katana:false,jump:!P.onGround,jumpPressed:false};
      if(P.onGround&&P.x>P0-80&&P.x<P0-50&&!Sv.j){k.jumpPressed=true;Sv.j=true;}
      if(!P.onGround&&P.x<P1-60){const nx=w.foes.find(e=>e.alive&&e.x+e.w>P.x-10);const tx=nx?nx.x+nx.w/2:P1+40,d=tx-(P.x+PW/2);k.right=d>12;k.left=d<-12;}
      if(!P.onGround&&P.vy>100&&P.x>P0-40&&P.x<P1){k.katana=Sv.state!=='pogo'||Sv.t<VERBS.pogo.active;if(Sv.state==='pogo'&&Sv.t>=VERBS.pogo.active)Sv.rep=(Sv.rep||0)+1;}   // hold up to 24 steps, then the 12-step re-press
      if(Sv.state==='pogo'&&Sv.bounced){bounceY=P.y+PH;}
      const ev=stepR(R,k,dt);
      if(bounceY!=null&&!P.onGround){apex=Math.max(apex||0,bounceY-(P.y+PH));}
      // a body on a spiked enemy without the blade dies
      for(const e of w.foes)if(e.alive&&ov([P.x+3,P.y,PW-6,PH],[e.x+2,e.y,e.w-4,e.h])){P.dead=true;}
      for(const x of ev){if(x.t==='jump')SFX(snd,'jump');if(x.t==='land'||x.t==='roll'){SFX(snd,x.t);if(P.x>P1&&!Sv.c){Sv.c=true;stat.cross++;}}}
      if(P.dead){if(!Sv.c){stat.fall++;}SFX(snd,'die');done=.6;}if(P.x>1720)done=.3;});
    const c=S.c;S.begin();const P=R.P,Sv=R.S;const cam={x:camX(P,VW,w.width,120),y:G-280};S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});drawEnemies(c,w);
    if(bounceY!=null&&apex)dash(c,cam.x,bounceY-138,cam.x+VW,bounceY-138,RED,[4,4]);
    drawR(c,R,{hb:q.v('hb')});
    // where the blade meets the target against where the feet would
    if(Sv.state==='pogo'){const b=pogoBox(P,bh);SR.dim(c,b[0]-10,P.y+PH,b[0]-10,P.y+PH+bh,`${bh} u`,{col:RED,ox:-16,oy:4});}
    S.ui();
    T(c,Sv.state==='pogo'?`pogo · blade box 40 x ${bh} u below the feet · ${Sv.t<=2?'startup':'active, held '+Sv.t+' steps'}`:`${Sv.bounced?'bounced: vy -830, apex 3.0 BL, the dash-slash refunded':'Down held + Katana in the air'} · charge ${Sv.dashes>0?'ready':'spent (grey kimono)'}`,10,20,{s:13,w:600,col:Sv.state==='pogo'?RED:INK});
    T(c,`the blade reaches a spike top ${bh-16} u before the feet would (spike hitboxes are 16 u tall); floor spikes become steps, ceiling spikes stay deadly`,10,36,{s:11,col:MUTE});
    RO(root,`crossed ${stat.cross}, died ${stat.fall} · Hollow Knight sets velocity to <code>BOUNCE_VELOCITY 12</code> for 0.25 s regardless of fall speed, 72% of its jump, off enemies, spikes and some objects [V, S21, S25] · SpeedRunner's bounce is the full 830 u/s, the stomp bounce #1 settled; vx untouched, no i-frames, a spike pogo works only because the blade box hits first [S4 D3; K; I]`);
  }};});

// ======================================================================
// F3 deflect: the slash box against a 600 u/s shot; the emergent 14-step window; no stance; the rejected 120 ms parry
// ======================================================================
REG('deflect',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.8,VW=640/SCW,HX=540,TX=920;const w=flat(1400);
  const R=mkR(w,HX);R.snd=snd;R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};R.P.facing=1;
  let shots=[],tur={alive:true,t:0,period:1.4,dieT:0},res={hit:0,miss:0,last:''},manual=false,stance={on:false,t:0},lock=0,t=0;
  q.btn('x',()=>{manual=true;});
  // brute force: which press steps (relative to the shot's front reaching the box's far edge) deflect it
  const windowSteps=(v,width)=>{const box=[HX+PW,HX+PW+50];let ok=0,lo=1e9,hi=-1e9;for(let p=-80;p<=80;p++){let hit=false;for(let s=p+2;s<p+6;s++){const front=box[1]-v*DT*s,back=front+width;if(back>=box[0]&&front<=box[1])hit=true;}if(hit){ok++;lo=Math.min(lo,p);hi=Math.max(hi,p);}}return {n:ok,lo,hi};};
  return {tick(sec){const v=q.v('v'),par=q.v('par');q.out('v',v+' u/s');const wd=windowSteps(v,0),wd14=windowSteps(v,14);
    run(sec*slow(q),dt=>{t+=dt;const P=R.P,Sv=R.S;
      tur.t+=dt;if(!tur.alive){tur.dieT+=dt;if(tur.dieT>1.2){tur.alive=true;tur.dieT=0;tur.t=0;}}
      else if(tur.t>=tur.period){tur.t=0;shots.push({x:TX-10,y:G-30,vx:-v,w:14,h:8,back:false});SFX(snd,'beep',{vol:.3});}
      // when to press: the shot front reaches the far edge of the box at step 0 of the window; the bot presses in the middle of it
      const k={jump:false,jumpPressed:false,katana:false,right:false,left:false};
      const sh=shots.find(s=>!s.back&&s.vx<0);let press=false;
      if(sh){const stepsTo=(sh.x-(HX+PW+50))/(v*DT);const target=-(wd.lo+wd.hi)/2;if(I.idle&&stepsTo<=target&&stepsTo>target-1)press=true;}
      if(manual){manual=false;press=true;}
      if(par){if(press&&!stance.on&&lock<=0){stance.on=true;stance.t=0;SFX(snd,'sheath');}if(stance.on){stance.t++;if(stance.t>14){stance.on=false;lock=36;res.miss++;res.last='parry stance whiffed: 300 ms lockout, 126 u of running lost';}}if(lock>0)lock--;}
      else{if(press&&Sv.state==='normal'){k.katana=true;SFX(snd,'slash',{vol:.6});}}
      stepR(R,k,dt);
      const act=Sv.state==='slash'&&local.phase(Sv.t,2,4,6)==='active';const b=slashBox(P);
      for(const s of shots){s.x+=s.vx*dt;
        if(!s.back&&((act&&ov(b,[s.x,s.y,s.w,s.h]))||(par&&stance.on&&s.x<P.x+PW+30&&s.x+s.w>P.x))){s.back=true;s.vx=-s.vx*1.5;Sv.flash=2;res.hit++;res.last=par?'parry stance: reflected inside the 14-step window':'deflected: the shot entered the active box, back at 1.5x';vfx(snd,'ping');}
        if(!s.back&&s.x<P.x+PW&&s.x+s.w>P.x&&s.y+s.h>P.y&&s.y<P.y+PH){s.dead=true;res.miss++;res.last='hit: the shot crossed the box outside the 4 active steps';Sv.flash=2;SFX(snd,'die',{vol:.5});}
        if(s.back&&s.x>TX-20&&tur.alive){tur.alive=false;tur.dieT=0;s.dead=true;}}
      shots=shots.filter(s=>!s.dead&&s.x>-50&&s.x<1500);});
    const c=S.c;S.begin();const P=R.P,Sv=R.S;const cam={x:HX-230,y:G-250};c.save();c.beginPath();c.rect(0,0,640,215);c.clip();S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});
    // the turret
    c.save();if(!tur.alive){c.globalAlpha=1-tur.dieT/1.2;}c.fillStyle=INK;c.fillRect(TX-24,G-44,48,44);c.fillRect(TX-40,G-32,20,8);c.fillStyle=PAPER;c.beginPath();c.arc(TX,G-26,6,0,Math.PI*2);c.fill();c.restore();
    for(const s of shots){c.fillStyle=s.back?RED:INK;c.fillRect(s.x,s.y,s.w,s.h);}
    const b=slashBox(P);box(c,b[0],b[1],b[2],b[3],Sv.state==='slash'&&local.phase(Sv.t,2,4,6)==='active'?RED:LIGHT,Sv.state==='slash'?'rgba(208,40,31,.08)':undefined);
    if(par&&stance.on){c.save();c.strokeStyle=BLUE;c.lineWidth=2;c.beginPath();c.arc(P.x+PW/2,P.y+PH/2,34,0,Math.PI*2);c.stroke();c.restore();}
    if(par)R.pose=SR.blend(R.pose,lock>0?VP.sheathe:R.pose,.3);drawR(c,R);S.ui();
    T(c,par?`parry stance (rejected): 14-step window, then a 300 ms lockout${lock>0?' · locked '+lock+' steps':''}`:`the slash: 2 startup, 4 active, 6 recovery; the box is 50 u deep; a ${v} u/s shot crosses it in ${(50/(v*DT)).toFixed(1)} steps`,10,20,{s:12,w:600,col:par?BLUE:INK});
    T(c,res.last||'no stance, no button: any shot that enters the active box turns around',10,36,{s:11,col:res.last.startsWith('hit')||res.last.startsWith('parry stance w')?RED:MUTE});
    c.restore();
    // the window on a step axis: press steps that deflect, against the 120 ms stance and its 300 ms lockout
    const x0=60,sw=5.2,axis=268;T(c,'press timing, in physics steps before the shot reaches the far edge of the box',10,228,{s:11});
    for(let i=-30;i<=30;i+=5){const x=x0+(i+30)*sw;c.fillStyle=LIGHT;c.fillRect(x,axis,1,6);T(c,String(-i),x,axis+18,{s:9,col:MUTE,al:'center',mono:1});}
    c.fillStyle='rgba(208,40,31,.25)';c.fillRect(x0+(wd.lo+30)*sw,axis-24,(wd.n)*sw,20);T(c,`slash deflects: ${wd.n} steps = ${Math.round(wd.n*DT*1000)} ms (point shot); ${wd14.n} with a 14 u shot`,x0+(wd.lo+30)*sw+wd.n*sw+6,axis-10,{s:10,col:RED});
    c.fillStyle='rgba(36,88,201,.18)';c.fillRect(x0+(wd.lo+30)*sw,axis+28,14.4*sw,18);c.fillStyle='rgba(36,88,201,.06)';c.fillRect(x0+(wd.lo+30+14.4)*sw,axis+28,36*sw,18);
    T(c,'parry stance: 120 ms window (14.4 steps)',x0+(wd.lo+30)*sw,axis+60,{s:10,col:BLUE});T(c,'then 300 ms lockout = 126 u at 420 u/s',x0+(wd.lo+30+14.4)*sw+4,axis+41,{s:10,col:BLUE});
    T(c,'the miss cost of the slash is its own 6 recovery steps (50 ms)',x0,axis+76,{s:10,col:MUTE});
    RO(root,`deflected <b>${res.hit}</b>, hit ${res.miss} · the window is 10 crossing steps plus 4 active at 600 u/s = 14 steps = 117 ms, the 120 ms the spec asked for, with no new input and no new state; at 900 u/s it is 11, at 450 it is 17 [K; S4 D4; I] · Katana ZERO deflects any bullet that enters the swing [V, S152]; Sekiro's deflect is 12 frames shrinking on spam [V, S162] · press Slash to try the timing`);
  }};});

// ======================================================================
// F4 iai: hold to arm at 200 ms, full at 300 ms, release into a longer dash-slash; the whiff recovery bill
// ======================================================================
REG('iai',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.8,VW=640/SCW;const mk=()=>flat(1500,{foes:[{x:900,y:G-30,w:30,h:30,alive:true}]});
  let w=mk();const R=mkR(w,60);R.snd=snd;R.opt={crouch:false,slide:false,stomp:false,pogo:false};
  const script=[.15,.25,.36];let si=0,hold=false,holdT=0,done=0,manual={down:false,up:false},last='',res=[],x0=0,trav=0;
  const hb=root.querySelector('[data-b="hold"]');if(hb){hb.addEventListener('pointerdown',()=>{manual.down=true;I.touch();});const up=()=>{if(manual.down){manual.down=false;manual.up=true;}};hb.addEventListener('pointerup',up);hb.addEventListener('pointerleave',up);hb.addEventListener('pointercancel',up);}
  const reset=()=>{w=mk();R.w=w;R.reset();done=0;hold=false;holdT=0;trav=0;};
  return {tick(sec){run(sec*slow(q),dt=>{const P=R.P,Sv=R.S;if(done>0){done-=dt;if(done<=0)reset();return;}
      const target=script[si%3];
      Sv.cool=Math.max(0,(Sv.cool||0)-dt);
      if(I.idle){if(P.x>380&&!hold&&!Sv.rel&&Sv.state==='normal'&&Sv.cool<=0){hold=true;holdT=0;}if(hold){holdT+=dt;if(holdT>=target){hold=false;Sv.rel=true;Sv.cool=.7;si++;}}}
      else{if(manual.down&&!hold){hold=true;holdT=0;}if(hold)holdT+=dt;if(manual.up){manual.up=false;hold=false;Sv.rel=true;Sv.cool=.7;}}
      const k={right:Sv.state!=='dashSlash'&&Math.abs(P.vx)<1e9,katana:hold,jump:false,jumpPressed:false};
      if(hold&&P.x>700)k.right=false;                                     // the bot waits at the target while holding
      const was=Sv.state;stepR(R,k,dt);
      if(Sv.state==='dashSlash'&&was!=='dashSlash'){x0=P.x;}if(Sv.state==='dashSlash')trav=P.x-x0;
      if(was!=='normal'&&Sv.state==='normal'&&Sv.rel&&was==='dashSlash'){last=`held ${Math.round(holdT*1000)} ms → ${Sv.active===18?'full':'armed'}: ${Sv.active} active steps, ${trav.toFixed(0)} u`;res.push(Math.round(trav));if(res.length>6)res.shift();Sv.rel=false;}
      else if(Sv.rel&&!hold&&Sv.state==='normal'&&was==='normal'&&holdT<.2){last=`held ${Math.round(holdT*1000)} ms → under 200 ms: nothing beyond the tap's slash`;Sv.rel=false;}
      if(P.x>1400||P.dead)done=.5;});
    const c=S.c;S.begin();const P=R.P,Sv=R.S;const cam={x:camX(P,VW,w.width,120),y:G-250};c.save();c.beginPath();c.rect(0,0,640,230);c.clip();S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});drawEnemies(c,w);drawR(c,R);
    // the hold meter above the head with the arm and full marks
    if(hold||Sv.armed){const k=CL(Sv.holdK/48,0,1),mx=P.x-20,my=P.y-26;c.fillStyle=PALE;c.fillRect(mx,my,60,7);c.fillStyle=Sv.holdK>=36?RED:Sv.holdK>=24?INK:GREY;c.fillRect(mx,my,60*k,7);c.fillStyle=RED;c.fillRect(mx+30-.5,my-3,1,13);c.fillRect(mx+45-.5,my-3,1,13);T(c,`${Sv.holdK} steps`,mx+30,my-6,{s:10,al:'center',mono:1});}
    S.ui();
    T(c,Sv.state==='dashSlash'?`dash-slash: ${Sv.active} active steps (${Sv.active===18?'full charge':'armed'}), 840 u/s, longer not faster`:Sv.armed?`armed${Sv.holdK>=36?', full':''}: sheathe pose, release to fire`:hold?`holding ${Sv.holdK} steps · the tap's slash already fired at step 0`:'tap: slash · hold 24 steps: arm · 36: full · release: dash-slash',10,20,{s:13,w:600,col:Sv.state==='dashSlash'||Sv.armed?RED:INK});
    T(c,last||'while charging, run, jump and the wall kit all work; the charge survives a wall jump and dies on a hit',10,36,{s:11,col:MUTE});
    c.restore();
    // the hold timeline: 0 to 400 ms with the three outcomes, and the recovery bills
    const x0_=20,sc=1.45;T(c,'one button, four meanings by held time [V, S175; I]',x0_,246,{s:11});
    c.fillStyle=PALE;c.fillRect(x0_,254,400*sc,10);c.fillStyle='#f1f1f1';c.fillRect(x0_,254,100*sc,10);c.fillStyle=INK;c.fillRect(x0_+200*sc,254,100*sc,10);c.fillStyle=RED;c.fillRect(x0_+300*sc,254,100*sc,10);
    if(hold||Sv.armed){c.fillStyle=RED;c.fillRect(x0_+Math.min(400,Sv.holdK*DT*1000)*sc-1,250,2,18);}
    T(c,'0',x0_,276,{s:9,col:MUTE,mono:1});T(c,'tap: the slash (100 ms)',x0_+2,286,{s:10,col:MUTE});T(c,'200 ms: armed → 12 active',x0_+200*sc,276,{s:10});T(c,'300 ms: full → 18 active',x0_+300*sc,286,{s:10,col:RED});T(c,'400',x0_+400*sc,276,{s:9,col:MUTE,mono:1,al:'right'});
    T(c,'whiff bill: 6 recovery steps, 50 ms with air control locked (black) against the rejected 300 ms lockout, 126 u = 2.7 BL (red)',x0_,312,{s:10,col:MUTE});
    c.fillStyle=INK;c.fillRect(x0_,320,50*sc,8);c.fillStyle='rgba(208,40,31,.35)';c.fillRect(x0_,332,300*sc,8);T(c,'50 ms',x0_+50*sc+6,327,{s:9,col:MUTE});T(c,'300 ms',x0_+300*sc+6,339,{s:9,col:RED});
    RO(root,`last lines: <b>${res.join(', ')||'…'}</b> u · the arm threshold must be visible and audible (a 2-step white flash and the sheathe synth) or players release early [K; I] · Katana ZERO's iaijutsu is "less than a second" [V, S152]; Jump King caps at 0.6 s and Celeste commits in 0.15 s, so 300 ms to full is the usual range [V, S44, S7; I] · hold the button, let go to fire`);
  }};});

// ======================================================================
// F5 slowtime: slow time as a resource, two clocks, hitstop 0 and the hero-only flash; "ranked off"
// ======================================================================
REG('slowtime',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.7,VW=640/SCW;const mk=()=>SR.makeCourse({width:1600,solids:[[0,G,560,300],[790,G,810,300]],deathY:G+120,foes:[{x:1100,y:G-30,w:30,h:30,alive:true}]});
  let w=mk();const R=mkR(w,60);R.snd=snd;R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};
  let real=0,world=0,meter=1,slowOn=false,done=0,used=0,board=[],smears=0;
  const reset=()=>{w=mk();R.w=w;R.reset();done=0;board.push({real,world,used});if(board.length>4)board.shift();real=0;world=0;used=0;meter=1;slowOn=false;};
  return {tick(sec){const sc=VERBS.slowTime.scale,ranked=q.v('ranked'),worldClock=q.v('wc');
    run(sec*slow(q),dt=>{const P=R.P,Sv=R.S;if(done>0){done-=dt;if(done<=0)reset();return;}
      // air only: the bot slows the world over the gap while the meter lasts
      slowOn=!P.onGround&&meter>0&&P.x>500&&P.x<850&&!q.v('off');
      const ts=slowOn?sc:1;if(slowOn){meter=Math.max(0,meter-dt);used+=dt;}else if(P.onGround)meter=Math.min(1,meter+dt*VERBS.slowTime.refill);
      const k={right:true,jump:!P.onGround&&P.vy<0,jumpPressed:false,katana:false};
      if(P.onGround&&P.x>480&&P.x<510&&!Sv.j){k.jumpPressed=true;Sv.j=true;}
      if(P.x>1040&&P.x<1060&&Sv.state==='normal'&&!Sv.sl){k.katana=true;Sv.sl=true;}
      const ev=stepR(R,k,dt*ts);real+=dt;world+=dt*ts;         // the scale is applied inside the fixed step; the clock counts real steps
      for(const x of ev){if(x.t==='jump')SFX(snd,'jump');if(x.t==='land')SFX(snd,'land');}
      if(Sv.flash===2)smears++;
      if(P.x>1500||P.dead)done=.6;});
    const c=S.c;S.begin();const P=R.P,Sv=R.S;const cam={x:camX(P,VW,w.width,120),y:G-330};S.world(cam,SCW);
    if(slowOn){c.save();c.fillStyle='rgba(36,88,201,.06)';c.fillRect(cam.x,cam.y,VW,600);c.restore();}
    SR.drawSolids(c,w,cam,{VW,start:false});drawEnemies(c,w);drawR(c,R);S.ui();
    // two clocks
    const clk=(lab,v,x,col)=>{c.fillStyle=PALE;c.fillRect(x,8,150,40);T(c,lab,x+6,22,{s:10,col:MUTE});T(c,fmtMs(v*1000),x+6,42,{s:18,w:600,mono:1,col});};
    clk('real steps (the board)',real,10,INK);clk('world steps (what you see)',world,170,BLUE);
    c.fillStyle=PALE;c.fillRect(340,8,120,40);T(c,'meter 1.0 s',346,22,{s:10,col:MUTE});c.fillStyle=LIGHT;c.fillRect(346,28,108,12);c.fillStyle=slowOn?BLUE:INK;c.fillRect(346,28,108*meter,12);
    T(c,slowOn?'slow time: world at 0.3x, air only':P.onGround?'refilling 1 s per 3 s on the ground':'',470,22,{s:10,col:slowOn?BLUE:MUTE});
    T(c,`slowed ${used.toFixed(2)} s of real time → ${(used*(1-sc)).toFixed(2)} s added to the ranked clock`,470,42,{s:10,col:MUTE});
    label(c,`hitstop 0 world steps: a hit is a 2-step hero-only flash (${smears} so far); the smear and the kimono tint are the reads`,10,330,{s:11,col:MUTE});
    const flag=used>0?(worldClock?'assisted and free: the fastest line would hold it forever':(ranked?'flagged assisted: the board rejects the time':'practice: allowed, unranked')):'no slow time used';
    label(c,flag,10,348,{s:11,col:used>0&&(worldClock||ranked)?RED:MUTE,w:600});
    RO(root,`last runs (real / world): ${board.map(b=>fmtMs(b.real*1000)+' / '+fmtMs(b.world*1000)).join(' · ')||'…'} · Superhot ships one board in game time and one in real time, and the real-time runners "ignore the game's primary mechanic" [V, S169, S170] · Katana ZERO's gold-medal guides set hitpause 0% [V, S158] · rank on real steps; the Ghostrunner rule, air only [K; I]`);
  }};});

// ======================================================================
// G1 and G3 kits: power-ups as kits per style; the per-map verbs mask and a pickup that hands a glide
// ======================================================================
REG('kits',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const STY={SMB1:{base:['run','jump','crouch'],kits:['Super Mushroom','Fire Flower','Superball Flower','Master Sword (6 verbs)','SMB2 Mushroom (throw, charge jump)','Big Mushroom','shells','Goomba\'s Shoe','Dry Bones Shell','Lakitu\'s Cloud']},
    SMB3:{base:['run','jump','crouch'],kits:['Super Leaf','Frog Suit']},SMW:{base:['run','jump','crouch','spin jump'],kits:['Cape Feather','Yoshi','P-Balloon']},
    NSMBU:{base:['run','jump','crouch','spin jump','wall jump','ground pound'],kits:['Propeller Mushroom','Super Acorn']},'3DW':{base:['run','jump','crouch','spin jump','wall jump','ground pound'],kits:['Super Bell','Super Hammer','Boomerang Flower','Cannon Box','Propeller Box','Goomba Mask','Bullet Bill Mask']}};
  const VERBSROWS=['run','jump','crouch','spin jump','wall jump','ground pound'],NAMES=Object.keys(STY);
  const MAPS=[['m1 FIRST STEPS','run jump wall roll'],['m2 ROCKY MOUNTAIN','run jump wall roll'],['m3 THE DUNGEON','run jump wall roll'],['m4 STAIRWAY','run jump wall roll'],['Verbs gym','full'],['SAMURAI TRIAL','full']];
  let sty='SMW';q.seg('s',v=>{sty=v;});
  // a glide handed by a cape pickup and removed by a gate, 1.3 s at maxRun = 550 u
  const SCW=.5,VW=640/SCW,w=flat(1900,{});const R=mkR(w,40);R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};let cape=false,capeT=0,done=0,glided=0,gate=1500,pick=420;
  return {tick(sec){run(sec*slow(q),dt=>{const P=R.P;if(done>0){done-=dt;if(done<=0){R.reset();cape=false;capeT=0;done=0;}return;}
      const k={right:true,jump:cape&&!P.onGround,jumpPressed:false};
      if(P.onGround&&P.x>pick-120&&P.x<pick-90&&!R.S.j){k.jumpPressed=true;R.S.j=true;}
      if(!cape&&P.x>pick-20&&P.x<pick+30&&P.y<G-60){cape=true;capeT=1.3;SFX(snd,'check');}
      if(cape&&!P.onGround&&P.vy>0&&capeT>0){P.vy=Math.min(P.vy,PHYS.maxFall*VERBS.glide.fallMult);capeT-=dt;glided=P.x-pick;}       // the cape's class: a capped glide, no climb
      if(cape&&P.x>gate){cape=false;capeT=0;}
      stepR(R,k,dt);if(P.x>1850)done=.4;});
    const c=S.c;S.begin();
    // the style matrix: base verbs per style, kits as a list
    T(c,'Super Mario Maker 2 styles are verb sets; power-ups are kits of 2 to 7 verbs bound to a style [V, S69]',10,18,{s:12,w:600});
    NAMES.forEach((n,j)=>{const x=150+j*62;T(c,n,x,38,{s:11,al:'center',w:n===sty?700:400,col:n===sty?RED:INK});});
    VERBSROWS.forEach((v,i)=>{const y=56+i*15;T(c,v,140,y+4,{s:11,al:'right',col:MUTE});NAMES.forEach((n,j)=>{const x=150+j*62,on=STY[n].base.includes(v);c.fillStyle=on?(n===sty?RED:INK):PALE;c.beginPath();c.arc(x,y,on?4.5:2.5,0,Math.PI*2);c.fill();});});
    T(c,`${sty} kits (${STY[sty].kits.length}):`,470,56,{s:11,w:600});STY[sty].kits.forEach((kk,i)=>T(c,kk,470,70+i*12,{s:10,col:MUTE}));
    dash(c,0,152,640,152,LIGHT,[2,3]);
    // SpeedRunner: the map header's verbs mask
    T(c,'SpeedRunner: a verbs mask in the map header keeps the four shipped boards; pickups set and clear it [K; I]',10,170,{s:12,w:600});
    MAPS.forEach((m,i)=>{const y=186+i*13;T(c,m[0],10,y+4,{s:10,col:MUTE});c.fillStyle=m[1]==='full'?RED:INK;T(c,m[1]==='full'?'verbs: all 15, plus pickups':`verbs: ["run","jump","wall","roll"]`,150,y+4,{s:10,mono:1,col:m[1]==='full'?RED:INK});});
    // the pickup scene
    const P=R.P;const cam={x:camX(P,VW,w.width,200),y:G-130};c.save();c.beginPath();c.rect(0,270,640,90);c.clip();S.world(cam,SCW,0,270);
    SR.drawSolids(c,w,cam,{VW,start:false});
    if(!cape&&capeT===0&&P.x<pick){c.fillStyle=RED;c.beginPath();c.moveTo(pick,G-100);c.lineTo(pick+26,G-88);c.lineTo(pick,G-70);c.closePath();c.fill();}
    c.fillStyle=LIGHT;c.fillRect(gate,G-120,6,120);c.fillStyle=INK;S.world(cam,SCW,0,270);T(c,'remover gate',gate-10,G-126,{s:18,al:'right',col:MUTE});T(c,'cape pickup {x, y, verb: "glide", until: gate}',pick-10,G-110,{s:18,col:RED});
    drawR(c,R);if(cape&&!P.onGround){c.fillStyle=RED;c.beginPath();c.moveTo(P.x,P.y+10);c.lineTo(P.x-34,P.y+26);c.lineTo(P.x-6,P.y+34);c.closePath();c.fill();}
    S.ui();label(c,cape?`glide handed: fall at 0.25x maxFall for ${capeT.toFixed(2)} s more · ${(glided/BL).toFixed(0)} BL since the pickup`:'the level hands the verb and the level is the rule',10,356,{s:11,col:cape?RED:MUTE});c.restore();
    RO(root,`a handed glide is capped to the cape's class with no climb; 1.3 s at maxRun is 550 u = 12 BL on maps 4,580 to 8,700 u wide [V, S15; K; I] · the SMW cape climbs for 80 frames at 6% above sprint after a run-up [V, S15] · SMM2's Clear board bans Luigi, never a power-up, because the maker already chose the kit [V, S28]`);
  }};});

// ======================================================================
// G2 cards: Neon White's discards priced in ammo; the medal ladder as a verb ladder
// ======================================================================
REG('cards',root=>{const S=stage(root),q=CTL(root),I=idler(root);
  const CARDS=[['Elevate','pistol',9,'vertical boost / double jump'],['Purify','MG',35,'sticky grenade'],['Godspeed','rifle',4,'forward launch'],['Stomp','SMG',30,'ground slam'],['Dominion','RPG',4,'grapple'],['Fireball','shotgun',4,'aimable air dash']];
  const MED=[['bronze','main path, no discard',1.0],['silver','main path, clean',.85],['gold','one intended discard (the shortcut hint unlocks)',.7],['ace','every intended discard, the author\'s time',.55],['red','the route the author did not plan',.45]];
  let med='gold',t=0;q.seg('m',v=>{med=v;});const dots=[];for(let i=0;i<14;i++)dots.push(i/14);
  // the route: a main path (grey) and shortcuts that discards open
  const main=[[330,320],[380,300],[440,300],[480,260],[540,260],[560,210],[600,210],[620,160],[560,130],[480,130],[440,90],[380,90],[350,50]];
  const gold=[[480,260],[600,210]],ace=[[380,300],[560,210],[560,130],[380,90]],red=[[330,320],[620,160],[350,50]];
  const pathOf=m=>m==='red'?red:m==='ace'?[[330,320],[380,300],[560,210],[560,130],[380,90],[350,50]]:m==='gold'?[[330,320],[380,300],[440,300],[480,260],[600,210],[620,160],[560,130],[480,130],[440,90],[380,90],[350,50]]:main;
  const along=(p,u)=>{let L=0;const segs=[];for(let i=1;i<p.length;i++){const d=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);segs.push(d);L+=d;}let s=u*L;for(let i=1;i<p.length;i++){if(s<=segs[i-1]){const k=s/segs[i-1];return [LP(p[i-1][0],p[i][0],k),LP(p[i-1][1],p[i][1],k)];}s-=segs[i-1];}return p[p.length-1];};
  return {tick(sec){t+=sec*slow(q);const c=S.c;S.begin();
    // the price bars: movement is priced in ammo, 4 rounds on the strongest cards
    T(c,'discard price in ammo [V, S64]',10,18,{s:12,w:600});
    CARDS.forEach((k,i)=>{const y=34+i*28,wd=k[2]*6;c.fillStyle=k[2]<=4?RED:LIGHT;c.fillRect(100,y,wd,12);T(c,k[0],96,y+10,{s:11,al:'right',w:600});T(c,`${k[2]} (${k[1]}) · ${k[3]}`,104+wd,y+10,{s:10,col:MUTE});});
    T(c,'red: 4 rounds, the strongest movement (Godspeed, Dominion, Fireball); the weak ones cost 30 to 35',10,210,{s:10,col:MUTE});
    T(c,'in a game without guns the cost is the pickup\'s position off the straight line [I]',10,224,{s:10,col:MUTE});
    // the route and the medal ladder
    const pm=pathOf(med);c.save();c.strokeStyle=LIGHT;c.lineWidth=6;c.beginPath();main.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();
    c.strokeStyle=med==='red'?RED:med==='ace'?GOLD:med==='gold'?GOLD:INK;c.lineWidth=2;c.setLineDash(med==='red'?[6,4]:[]);c.beginPath();pm.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.restore();
    // cards on the main path only (Esposito: the shortcut uses cards from the main path and is never hidden)
    [[440,300,'Godspeed'],[560,210,'Elevate'],[480,130,'Dominion']].forEach(([x,y,n])=>{c.fillStyle=PAPER;c.strokeStyle=INK;c.lineWidth=1;c.fillRect(x-9,y-13,18,26);c.strokeRect(x-9,y-13,18,26);T(c,n[0],x,y+5,{s:12,al:'center',w:700});});
    const T0=MED.find(m=>m[0]===med)[2];dots.forEach(d=>{const u=((t*.12/T0)+d)%1,p=along(pm,u);c.fillStyle=med==='red'?RED:INK;c.beginPath();c.arc(p[0],p[1],3,0,Math.PI*2);c.fill();});
    c.fillStyle=INK;c.fillRect(326,318,8,8);SR.drawFlag(c,352,56);
    MED.forEach((m,i)=>{const y=250+i*18,on=m[0]===med;c.fillStyle=on?(m[0]==='red'?RED:INK):PALE;c.fillRect(100,y-8,Math.round(m[2]*130),10);T(c,m[0],96,y,{s:11,al:'right',w:on?700:400,col:on?(m[0]==='red'?RED:INK):MUTE});if(on)T(c,m[1],100+Math.round(m[2]*130)+6,y,{s:9.5,col:MUTE});});
    T(c,'relative time per medal, illustrative',100,348,{s:9,col:MUTE});
    RO(root,`"Cards are stage-specific, and you can't bring your own deck" [V, S64] · Esposito: "The shortcut path must only use cards from the main path", "The shortcut path cannot be hidden"; a Bomb card that existed only for a shortcut was cut [V, S65, S66] · Ace medals need a shortcut that saves real time even executed imperfectly; Red beats the developer [V, S67] · in SpeedRunner a card is a pickup with one charge of an existing verb, drawn by the timer; the four maps need none [I]`);
  }};});

// ======================================================================
// G4 placeblock: UCH's place-one-block loop as the async ghost-trap chain; place, the placer runs it, the next ghost runs it
// ======================================================================
REG('placeblock',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.5,VW=640/SCW,BASE={width:1500,solids:[[0,G,700,300],[860,G,640,300]],checkpoints:[1100],finish:1400,deathY:G+120};
  const AUTH=['Ana','Rin','Hiro','Sora','Yui'];let placed=[],chain=0,deck=[],phase='place',timer=4,cursor=null,piece=0,w=null,R=null,author=0,msg='',keyHash='',runs=0,rej=0,byAuthor='';
  const mkW=()=>{const spec=JSON.parse(JSON.stringify(BASE));spec.spikes=[];spec.movers=[];for(const p of placed){if(p[4]==='spike')spec.spikes.push([p[0],p[1]+p[3],p[2]]);else if(p[4]==='mover')spec.movers.push({x0:p[0],y0:p[1],x1:p[0],y1:p[1]-120,w:p[2],h:p[3],period:3,phase:0,by:p[5].author});else spec.solids.push([p[0],p[1],p[2],p[3]]);}
    const ww=SR.makeCourse(spec);keyHash='map:'+local.hash(JSON.stringify(BASE)+JSON.stringify(placed)).slice(0,12).padEnd(12,'0');return ww;};
  const PIECES=[{tag:'spike',w:60,h:16,lab:'16 u spike strip'},{tag:'solid',w:40,h:40,lab:'40x40 solid'},{tag:'mover',w:80,h:18,lab:'mover, 3 s period'}];
  const newDeck=()=>{deck=[0,1,2].sort(()=>Math.random()-.5).slice(0,3);piece=deck[0];};
  const valid=(x,y,pc)=>{const near=[60,1100,1400].some(cx=>Math.abs(x+pc.w/2-cx)<200);const over=BASE.solids.some(s=>ov([x,y,pc.w,pc.h],s))||placed.some(p=>ov([x,y,pc.w,pc.h],p));return !near&&!over&&x>0&&x+pc.w<1500&&y>G-400&&y+pc.h<=G+40;};
  const snap=v=>Math.round(v/20)*20;
  w=mkW();R=mkR(w,60);R.opt={crouch:false,slide:false,stomp:false,pogo:false,dashSlash:false};newDeck();
  const cam={x:120,y:G-420};
  const toWorld=([px,py])=>[px/SCW+cam.x,py/SCW+cam.y];
  S.cv.addEventListener('pointermove',e=>{if(phase!=='place')return;const [wx,wy]=toWorld(S.pos(e));cursor=[snap(wx-PIECES[piece].w/2),snap(wy-PIECES[piece].h/2)];});
  S.cv.addEventListener('pointerdown',e=>{if(phase!=='place')return;const [wx,wy]=toWorld(S.pos(e));const pc=PIECES[piece],x=snap(wx-pc.w/2),y=snap(wy-pc.h/2);if(valid(x,y,pc))place(x,y);else msg='not there: within 200 u of the start, a checkpoint or the finish, or over a solid';});
  q.seg('p',v=>{piece=+v;});
  const place=(x,y)=>{const pc=PIECES[piece];const cand=[x,y,pc.w,pc.h,pc.tag,{author:AUTH[author%5],t:Date.now()}];placed.push(cand);w=mkW();R.w=w;R.reset();phase='check';msg=`${cand[5].author} placed a ${pc.lab}; the placer runs it first (Clear Check)`;SFX(snd,'click');};
  const bot=P=>{const k={right:true,jump:false,jumpPressed:false};const feet=P.y+PH,ahead=P.x+PW+60;
    const gap=!SR.solidAt(w,ahead,feet+2,4,12,{vy:1,feet:feet+2})&&!(w.movers||[]).some(m=>m.cur&&ahead>m.cur[0]-20&&ahead<m.cur[0]+m.cur[2]+20);
    const wall=SR.solidAt(w,P.x+PW,P.y+6,56,PH-12),spike=(w.spikes||[]).some(s=>s[0]-(P.x+PW)<80&&s[0]+s[2]>P.x);
    if(P.onGround&&(gap||wall||spike))k.jumpPressed=true;if(!P.onGround&&P.vy<0)k.jump=true;return k;};
  return {tick(sec){run(sec*slow(q),dt=>{
      if(phase==='place'){timer-=dt;if(I.idle&&timer<2.5&&!msg.startsWith('bot')){for(let i=0;i<40;i++){const pc=PIECES[piece],x=snap(200+Math.random()*1100),y=snap(G-pc.h-Math.random()*160);if(valid(x,y,pc)){place(x,y);msg='bot '+msg;break;}}}
        if(timer<=0){phase='run';msg='the timer ran out: no piece this round';R.reset();}return;}
      const P=R.P;const ev=stepR(R,bot(P),dt);for(const x of ev){if(x.t==='jump')SFX(snd,'jump',{vol:.3});if(x.t==='die')SFX(snd,'die');}
      if(P.dead||P.finished||P.x>1450){
        if(phase==='check'){if(P.dead){placed.pop();rej++;msg='the placer died: the piece is rejected, the state never goes live';w=mkW();R.w=w;}else{chain++;msg=`live: chain ${chain} of 12, key ${keyHash}`;}phase='run';author++;R.reset();return;}
        runs++;if(P.dead){const k=P.ev.find(e=>e.t==='die');byAuthor=(placed.find(p=>Math.abs(p[0]-P.x)<90)||[,,,,,{author:'?'}])[5].author;msg=`the next runner died: "${byAuthor}'s ${k&&k.why==='spike'?'saw':'drop'}"`;}else msg='the next runner finished the new state';
        if(chain>=12){placed=[];chain=0;msg='chain cap 12 reached: the weekly reset clears the placed pieces';}
        w=mkW();R.w=w;R.reset();phase='place';timer=4;newDeck();cursor=null;}});
    const c=S.c;S.begin();c.save();c.beginPath();c.rect(0,0,640,300);c.clip();S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,time:R.time,cpOn:R.P.cp});
    // forbidden zones around the start, the checkpoint and the finish
    for(const cx of [60,1100,1400]){c.fillStyle='rgba(208,40,31,.07)';c.fillRect(cx-200,G-400,400,440);}
    for(const p of placed){if(p[4]==='spike'){}else if(p[4]==='mover'){}S.world(cam,SCW);T(c,p[5].author,p[0]+p[2]/2,p[1]-6,{s:16,al:'center',col:MUTE});}
    if(phase==='place'&&cursor){const pc=PIECES[piece],okv=valid(cursor[0],cursor[1],pc);c.save();c.globalAlpha=.6;c.fillStyle=okv?INK:RED;c.fillRect(cursor[0],cursor[1],pc.w,pc.h);c.restore();}
    if(phase!=='place')drawR(c,R);S.ui();
    T(c,phase==='place'?`PLACE: ${timer.toFixed(1)} s left (UCH 5 to 60 s, here 4; the proposal says 15) · piece: ${PIECES[piece].lab} · snap 20 u`:phase==='check'?'CHECK: the placer runs the new state once':'RUN: the next ghost runs the chained map',10,20,{s:12,w:600,col:phase==='place'?RED:INK});
    T(c,msg,10,36,{s:11,col:MUTE});c.restore();
    // the record and the key
    const lastP=placed[placed.length-1];
    T(c,`placed[] (${placed.length}): ${lastP?`[${lastP.slice(0,4).join(', ')}, '${lastP[4]}', {author: '${lastP[5].author}'}]`:'none'}`,10,318,{s:11,mono:1});
    T(c,`board key ${keyHash} = map:sha256(base + placed)[0:12] · chain ${chain} of 12 · runs ${runs}, rejected pieces ${rej}`,10,336,{s:11,mono:1,col:MUTE});
    T(c,'click on the paper to place the piece; red zones are forbidden; the bot places one after 1.5 s idle',10,354,{s:10,col:MUTE});
    RO(root,`one trap after a finished run, from a deck of three tags, snapped to 20 u, never within 200 u of the start, a checkpoint or the finish, never over a solid; the state is base + placed[], the key hashes it, the chain caps at 12 like UCH's rounds [V, S142, S146; I] · placement happens between runs, so the input log is unchanged and the replay header carries the hash [I] · the placer must finish the new state first, SMM's Clear Check and UCH's "author also runs" [V, S69, S142]`);
  }};});

// ======================================================================
// H1 and H2 budget: verbs against action buttons per game; the mapping board for three buttons
// ======================================================================
REG('budget',root=>{const S=stage(root),q=CTL(root),I=idler(root);
  const GAMES=[['N++',1,4],['Super Meat Boy',2,4],['SMB Forever',2,5],['Celeste',3,10,'+ Crouch Dash bind'],['Neon White',3,7],['Hollow Knight',4,5],['Katana ZERO',3,5],['Pizza Tower',3,6,'+ taunt'],['Fall Guys',3,3],['UCH',3,6,'+ place'],['Jetpack Joyride',1,1],['SpeedRunner today',1,6],['SpeedRunner recommended',3,15]];
  const ROWS=[['Jump','tap','jump; wall jump away; climb jump when holding in','during a slide: the slide-jump (546 x 622)','held: the variable jump, the apex band','',''],
    ['Katana','tap','the slash (2/4/6, 50x40 u); deflect is a property','Down + tap in the air: the pogo (40x50 u, 830 up)','held 200 ms: armed; 300 ms: full','release: dash-slash, 840 u/s, 12 to 18 steps','Up + tap in the air near a ring: the hook; release lets go'],
    ['Down','hold','on the ground under 280 u/s: crouch (20x26 u, crawl 120)','on the ground at 280 u/s or more: slide (600 u/s² friction)','in the air: the stomp (vy at least 700)','on a one-way tile: crouch, never a drop',''],
    ['no input','','the mantle: a wall top within 16 u above the head','','','','']];
  const COLS=['input','kind','meaning','with a body state','held','released','with a direction'];
  let view='prop',hover=null;q.seg('v',v=>{view=v;});
  S.cv.addEventListener('pointermove',e=>{const [x,y]=S.pos(e);hover=[x,y];});S.cv.addEventListener('pointerleave',()=>{hover=null;});
  return {tick(sec){const c=S.c;S.begin();
    // the dot chart: action buttons (plus direction) against verbs
    const X=b=>60+b*110,Y=v=>150-v*8.5;T(c,'verbs against action buttons (plus a direction), 6e [V; K; I]',10,16,{s:12,w:600});
    for(let b=1;b<=4;b++){dash(c,X(b),30,X(b),152,PALE,[2,3]);T(c,b+(b===1?' button':' buttons'),X(b),164,{s:10,col:MUTE,al:'center'});}
    dash(c,40,Y(10),620,Y(10),RED,[4,4]);T(c,'Crawford: "fewer than ten verbs"',618,Y(10)-4,{s:10,col:RED,al:'right'});
    for(let b=1;b<=4;b++){const col=GAMES.filter(g=>g[1]===b).sort((a,c2)=>c2[2]-a[2]);let ly=-1e9;col.forEach(g=>{const x=X(b),y=Y(g[2]);const sr=g[0].startsWith('SpeedRunner'),on=sr&&((view==='prop')===(g[0].includes('recommended')));
      c.fillStyle=sr?(on?RED:LIGHT):INK;c.beginPath();c.arc(x,y,sr?6:4,0,Math.PI*2);c.fill();ly=Math.max(ly+11,y+4);if(ly>y+4)dash(c,x+6,y,x+8,ly-3,LIGHT,[1,2]);
      T(c,g[0]+(g[3]?' '+g[3]:''),x+10,ly,{s:9.5,col:sr?(on?RED:MUTE):INK,w:on?600:400});});}
    T(c,'verbs',14,30,{s:10,col:MUTE});
    // the mapping board
    dash(c,0,178,640,178,LIGHT,[2,3]);T(c,view==='prop'?'the recommended mapping: Move, Jump and Katana, with Down and Up as modifiers (H2)':'today: one button and a direction; Down and Up do nothing [K]',10,194,{s:12,w:600});
    const cx=[8,60,92,240,372,470,552],rowH=34;
    COLS.forEach((h,i)=>{if(i===1)return;T(c,h,cx[i],206,{s:9.5,col:MUTE});});
    ROWS.forEach((r,i)=>{const y=216+i*rowH;c.fillStyle=i%2?'#f6f6f6':PAPER;c.fillRect(0,y-4,640,rowH-2);
      const today=i===0?['jump; wall jump away; climb jump when holding in','','held: the variable jump','',''].concat(['']):null;
      T(c,r[0],cx[0],y+10,{s:11,w:600,col:view==='today'&&i>0?LIGHT:INK});
      for(let j=2;j<7;j++){let s=r[j];if(view==='today'){s=i===0?(j===2?r[2]:j===4?'held: the variable jump':''):'';}if(!s)continue;
        const hov=hover&&hover[1]>y-4&&hover[1]<y+rowH-6&&hover[0]>cx[j]-4&&hover[0]<(cx[j+1]||640)-4;
        if(hov){c.fillStyle=PINK;c.fillRect(cx[j]-3,y-2,(cx[j+1]||640)-cx[j]-2,rowH-6);}
        const words=s.split(' ');let line='',ly=y+8;const maxW=(cx[j+1]||640)-cx[j]-8;for(const wd of words){const t2=line?line+' '+wd:wd;if(TW(c,t2,{s:9})>maxW&&line){T(c,line,cx[j],ly,{s:9,col:hov?RED:INK});line=wd;ly+=10;}else line=t2;}T(c,line,cx[j],ly,{s:9,col:hov?RED:INK});}});
    RO(root,`${view==='prop'?'15 verbs on 3 buttons: run, jump, wall slide, wall jump, climb jump, roll, crouch, slide, slide-jump, stomp, mantle, slash, pogo, dash-slash, hook; nine are context verbs, so the count sits inside Crawford\'s bound at Celeste\'s button count [K; I]':'6 verbs on 1 button today: run, jump, wall slide, wall jump, climb jump, roll [K]'} · Celeste added the Crouch Dash bind in 1.4.0.0 on 29 Mar 2021 because runners were binding it with Joy2Key [V, S14, S41] · hover a cell`);
  }};});

// ======================================================================
// H3 fsm: the verb state machine with startup, active, recovery and the cancel table, stepped live with an input strip
// ======================================================================
const SCRIPT=[[40,{right:1}],[2,{right:1,katana:1}],[22,{right:1}],[44,{right:1,katana:1}],[1,{right:1}],[18,{right:1}],[8,{right:1,jumpPressed:1,jump:1}],[20,{right:1,jump:1}],[26,{right:1,down:1}],[34,{right:1}],
  [16,{right:1,down:1}],[4,{right:1,down:1,jumpPressed:1,jump:1}],[40,{right:1,jump:1}],[30,{right:1}],[60,{down:1}],[10,{}],[10,{right:1,jumpPressed:1,jump:1}],[18,{right:1,jump:1}],[2,{right:1,jump:1,down:1,katana:1}],[30,{right:1,down:1,katana:1}],[40,{right:1}]];
function scripted(){let i=0,n=0;return {next(){const [len,k]=SCRIPT[i];const out={left:!!k.left,right:!!k.right,up:!!k.up,down:!!k.down,jump:!!k.jump,jumpPressed:!!k.jumpPressed&&n===0,katana:!!k.katana,katanaPressed:false};n++;if(n>=len){n=0;i=(i+1)%SCRIPT.length;}return out;},reset(){i=0;n=0;}};}
REG('fsm',root=>{const S=stage(root),q=CTL(root),snd=sndBtn(root,q),I=idler(root),run=fixed();
  const SCW=.6,VW=640/SCW;const mk=()=>flat(2600,{foes:[{x:560,y:G-30,w:30,h:30,alive:true},{x:1660,y:G-30,w:30,h:30,alive:true,spike:true}]});
  let w=mk();const R=mkR(w,60);R.snd=snd;const sc=scripted();let strip=[],paused=false,stepOnce=false,lastCancel=null,trans=[];
  q.btn('step',()=>{paused=true;stepOnce=true;});q.btn('play',()=>{paused=false;});
  const reset=()=>{w=mk();R.w=w;R.reset();sc.reset();strip=[];trans=[];};
  const VERBLIST=['normal','slash','dashSlash','pogo','slide','crouch','hook'];const CANCELS=[['slash','jump'],['dashSlash','jump'],['dashSlash','wall'],['slide','jump'],['slide','stand'],['pogo','land']];
  const one=dt=>{const P=R.P,Sv=R.S,k=sc.next();const before=Sv.state,t0=Sv.t;stepR(R,k,dt);
    strip.push({L:k.left,R:k.right,U:k.up,D:k.down,J:k.jump,Jp:k.jumpPressed,K:k.katana,st:Sv.state});if(strip.length>64)strip.shift();
    if(Sv.state!==before){trans.unshift({from:before,to:Sv.state,t:R.steps});if(trans.length>5)trans.pop();
      if(before==='slash'&&Sv.state==='normal'&&k.jump&&Sv.t===1&&t0<12)lastCancel={verb:'slash',into:'jump',ok:true,t:R.steps};
      if(before==='dashSlash'&&Sv.state==='normal'&&t0<2+Sv.active+6)lastCancel={verb:'dashSlash',into:P.wallDir?'wall':'jump',ok:true,t:R.steps};
      if(before==='slide'&&Sv.state==='normal')lastCancel={verb:'slide',into:k.jumpPressed||k.jump?'jump':'stand',ok:true,t:R.steps};}
    if(P.x>2500||P.dead)reset();};
  return {tick(sec){if(paused){if(stepOnce){stepOnce=false;one(DT);}}else run(sec*slow(q),one);
    const c=S.c;S.begin();const P=R.P,Sv=R.S;const cam={x:camX(P,VW,w.width,120),y:G-200};c.save();c.beginPath();c.rect(0,0,640,150);c.clip();S.world(cam,SCW);
    SR.drawSolids(c,w,cam,{VW,start:false});drawEnemies(c,w);drawR(c,R,{hb:true});S.ui();c.restore();dash(c,0,150,640,150,LIGHT,[2,3]);
    // the states
    T(c,'states (one enum, never a bag of booleans)',10,166,{s:11,w:600});
    VERBLIST.forEach((s,i)=>{const x=10+i*62,on=Sv.state===s;c.fillStyle=on?RED:PAPER;c.strokeStyle=on?RED:INK;c.lineWidth=1;c.fillRect(x,172,58,22);c.strokeRect(x+.5,172.5,57,21);T(c,s,x+29,187,{s:10,al:'center',col:on?PAPER:INK,w:on?600:400});});
    // the phase bar of the current verb
    const v=VERBS[Sv.state];let bar='';if(v&&v.active!=null){const act=Sv.state==='dashSlash'?Sv.active:v.active,tot=v.startup+act+v.recovery,x0=10,wd=380/Math.max(tot,1);
      for(let i=0;i<tot;i++){const ph=local.phase(i,v.startup,act,v.recovery);c.fillStyle=ph==='active'?PINK:ph==='startup'?'#efefef':'#f8f8f8';c.fillRect(x0+i*wd,204,wd-1,14);}
      c.fillStyle=RED;c.fillRect(x0+Math.min(tot,Sv.t)*wd-1,200,2,22);bar=`${Sv.state}: t = ${Sv.t} → ${local.phase(Sv.t,v.startup,act,v.recovery)} (startup ${v.startup}, active ${act}, recovery ${v.recovery})`;}
    else bar=`${Sv.state}: t = ${Sv.t}${Sv.armed?' · armed (held '+Sv.holdK+')':Sv.holdK?' · katana held '+Sv.holdK:''}${Sv.state==='slide'?' · minSteps 14':''}`;
    T(c,bar,10,232,{s:10.5,mono:1});
    // the cancel table lookups
    T(c,'cancelInto',440,166,{s:11,w:600});CANCELS.forEach(([vb,into],i)=>{const y=180+i*12,rule=VERBS[vb].cancelInto[into],hot=lastCancel&&lastCancel.verb===vb&&lastCancel.into===into&&R.steps-lastCancel.t<60;T(c,`${vb}.${into}: '${rule}'`,440,y,{s:10,mono:1,col:hot?RED:INK,w:hot?600:400});});
    T(c,`onLand() resets dashes, wallJumpSame, stamina · dashes ${Sv.dashes}`,10,246,{s:9.5,col:MUTE});
    // the input strip: the last 64 steps
    const rows=['L','R','U','D','J','Jp','K'];T(c,'input strip, one column per physics step (newest right); the colour band is the state',10,258,{s:10,col:MUTE});
    const sx=10,sy=264,cw=9.4,rh=9;rows.forEach((r,i)=>T(c,r,sx-2,sy+i*rh+8,{s:8,al:'right',mono:1,col:MUTE}));
    const col={normal:PAPER,slash:PINK,dashSlash:'#f6c5c0',pogo:'#dfe6f7',slide:'#e6f3e8',crouch:'#f1ecd8',hook:'#e8e8e8'};
    strip.forEach((s,j)=>{const x=sx+2+j*cw;c.fillStyle=col[s.st]||PAPER;c.fillRect(x,sy,cw-1,rows.length*rh);rows.forEach((r,i)=>{if(s[r]){c.fillStyle=r==='K'?RED:INK;c.fillRect(x+1,sy+i*rh+1,cw-3,rh-2);}});});
    T(c,trans.map(t=>`${t.from}→${t.to}`).join('  '),10,348,{s:10,mono:1,col:MUTE});
    RO(root,`the state machine runs once per step between input and movement; dash-class verbs beat the jump on the same step, as Celeste's <code>NormalUpdate</code> checks dash before jump [V, S7] · the table form is the anti-cheat: the validator hashes <code>VERBS</code> with <code>PHYS</code> [I] · Step pauses and advances one 8.33 ms step; Play resumes · scripted inputs loop: tap, hold and release, jump cancel, stomp, slide, slide-jump, crouch, pogo`);
  }};});

// ======================================================================
// H4 inputlog: the two-byte RLE log with verb bits, live bytes per minute, a TAS-style text view, categories
// ======================================================================
REG('inputlog',root=>{const S=stage(root),q=CTL(root),I=idler(root),run=fixed();
  const w=flat(2600,{foes:[{x:560,y:G-30,w:30,h:30,alive:true},{x:1660,y:G-30,w:30,h:30,alive:true,spike:true}]});const R=mkR(w,60);const sc=scripted();
  let log=[],katanaN=0,dashN=0,defl={raw2:null,raw1:null,busy:false},runSteps=0,view='tas';q.seg('v',v=>{view=v;});
  const hdr=()=>({mapId:'gym',mapHash:local.hash('gym').slice(0,8),physHash:local.hash(JSON.stringify(PHYS)).slice(0,8),verbsHash:local.hash(JSON.stringify(VERBS)).slice(0,8)});
  const letters=b=>[['L',1],['R',2],['U',4],['D',8],['J',16],['Jp',32],['K',64],['Dp',128]].filter(([,m])=>b&m).map(([l])=>l).join(',')||'.';
  const deflate=async()=>{if(defl.busy||typeof CompressionStream==='undefined'||!log.length)return;defl.busy=true;try{const sz=async bytes=>{const cs=new CompressionStream('deflate');const wr=cs.writable.getWriter();wr.write(bytes);wr.close();const buf=await new Response(cs.readable).arrayBuffer();return buf.byteLength;};
      defl.raw2=await sz(local.encodeInputs(log));defl.raw1=await sz(local.encode1(log));}catch(_){}defl.busy=false;};
  let dT=0;
  return {tick(sec){run(sec*slow(q),dt=>{const P=R.P,k=sc.next();const kp=!!k.katana&&!R.S.prevK;stepR(R,k,dt);
      const b=local.logByte(Object.assign({dashPressed:false},k));log.push(b);if(kp)katanaN++;runSteps++;
      if(P.x>2500||P.dead){R.reset();sc.reset();log=[];katanaN=0;dashN=0;runSteps=0;defl.raw1=defl.raw2=null;}});
    dT+=sec;if(dT>2){dT=0;deflate();}
    const c=S.c;S.begin();const enc2=local.encodeInputs(log),enc1=local.encode1(log),secs=runSteps*DT||1e-9,H=hdr();
    T(c,'byte 1 bits: L R U D Jh Jp Kh Dp · byte 0: run length 1 to 255',10,18,{s:12,w:600});
    // the last 48 steps as an 8-row bit strip
    const rows=['L','R','U','D','Jh','Jp','Kh','Dp'],sx=36,sy=26,cw=12,rh=9;rows.forEach((r,i)=>T(c,r,sx-4,sy+i*rh+8,{s:8,al:'right',mono:1,col:MUTE}));
    const tail=log.slice(-48);tail.forEach((b,j)=>{for(let i=0;i<8;i++){if(b&(1<<i)){c.fillStyle=i>=6?RED:INK;c.fillRect(sx+j*cw,sy+i*rh+1,cw-2,rh-2);}}});
    dash(c,0,110,640,110,LIGHT,[2,3]);
    // the pairs or the TAS text
    if(view==='tas'){T(c,'CelesteTAS style, one line per run of identical input (frames,actions) [V, S20]',10,126,{s:11});
      const pairs=[];for(let i=Math.max(0,enc2.length-24);i<enc2.length;i+=2)pairs.push([enc2[i],enc2[i+1]]);pairs.forEach((p,i)=>T(c,`${String(p[0]).padStart(3)},${letters(p[1])}`,10+(i%6)*105,142+Math.floor(i/6)*13,{s:10,mono:1,col:p[1]&64?RED:INK}));}
    else{T(c,'the pairs as bytes: run length, bits',10,126,{s:11});const px=[];for(let i=Math.max(0,enc2.length-36);i<enc2.length;i+=2)px.push(`${enc2[i]},${enc2[i+1].toString(2).padStart(8,'0')}`);px.forEach((s,i)=>T(c,s,10+(i%6)*105,142+Math.floor(i/6)*13,{s:10,mono:1}));}
    // readouts
    const bpm2=enc2.length/secs*60,bpm1=enc1.length/secs*60;
    T(c,`run ${secs.toFixed(1)} s, ${runSteps} steps · changes ${enc2.length/2} · two bytes per pair: ${enc2.length} B raw, ${bpm2.toFixed(0)} B per minute (measured)`,10,196,{s:11,mono:1});
    T(c,`Mechanics #1's one byte (5 bits + a 3-bit run): ${enc1.length} B raw, ${bpm1.toFixed(0)} B per minute · deflated ${defl.raw2!=null?defl.raw2+' B vs '+defl.raw1+' B':'…'}`,10,212,{s:11,mono:1,col:MUTE});
    T(c,`header { mapId: '${H.mapId}', mapHash: ${H.mapHash}, physHash: ${H.physHash}, verbsHash: ${H.verbsHash}, steps: ${runSteps} }`,10,236,{s:10.5,mono:1});
    T(c,'the validator checks verbsHash and physHash before any simulation; a Sandbox-tuned VERBS table fails here [I]',10,250,{s:10,col:MUTE});
    // categories on the board from the log alone
    const tags=['Any%'].concat(katanaN===0?['No Katana']:[]);
    T(c,'categories derived from the log, one board with filters, never two boards [V, S27, S38; I]',10,276,{s:11});
    tags.forEach((t,i)=>{const x=10+i*110;c.fillStyle=t==='Any%'?INK:PALE;c.fillRect(x,284,100,20);T(c,t,x+50,298,{s:11,al:'center',col:t==='Any%'?PAPER:INK,w:600});});
    T(c,`katana presses ${katanaN} · No Katana applies while the count is 0 · the katana press is the edge of its held bit, so no Kp bit; the hook is Up + Katana, so no hook bit`,10,322,{s:10,col:MUTE});
    T(c,'resources (dash charge, pogo, stamina) are derived state, never logged, reset by one onLand()',10,338,{s:10,col:MUTE});
    RO(root,`a 60 s run with about 400 input changes is about 800 bytes raw; the figure's scripted run measures the real pairs and shows that Jp, an edge bit, splits every jump into a 1-step pair [I] · CelesteTAS writes <code>123,R,J</code> [V, S20]; BizHawk's .bk2 writes one text line per frame [V, S22] · Celeste 1.4 reset every player's binds on update, so the log stores verbs, never keys [V, S14]`);
  }};});
})();
