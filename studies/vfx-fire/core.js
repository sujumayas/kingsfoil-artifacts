"use strict";
// ======================================================================
// core: generic helpers (names shared with demos1-3, do not rename),
// flash guard, fire palettes, integer hash, DOOM fire step, flame sprites,
// a fixed ember pool, Bayer dithering, demo runner and page chrome.
// ======================================================================
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let rs=20261109;
const rnd=()=>{rs^=rs<<13;rs^=rs>>>17;rs^=rs<<5;return (rs>>>0)/4294967296;};
const mkRng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const sat=v=>v<0?0:v>1?1:v;
const smooth=(a,b,x)=>{const t=sat((x-a)/(b-a));return t*t*(3-2*t);};
const hash2=(x,y)=>{let h=Math.imul(x*374761393+y*668265263,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const n1=(t,s)=>{const i=Math.floor(t),f=t-i,u=f*f*(3-2*f);return hash2(i,s)*(1-u)+hash2(i+1,s)*u;};
const vnoise=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const bay=(x,y)=>BAYER[(y&3)*4+(x&3)];
const pack=(r,g,b)=>((255<<24)|(clamp(b|0,0,255)<<16)|(clamp(g|0,0,255)<<8)|clamp(r|0,0,255))>>>0;
const U=h=>pack(parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16));
const un32=c=>[c&255,(c>>>8)&255,(c>>>16)&255];
const mix32=(a,b,t)=>{const A=un32(a),B=un32(b);return pack(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t));};
const mulc=(c,r,g,b)=>{const A=un32(c);return pack(A[0]*r,A[1]*g,A[2]*b);};
const hexf=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const rgbCss=(r,g,b)=>`rgb(${clamp(Math.round(r),0,255)},${clamp(Math.round(g),0,255)},${clamp(Math.round(b),0,255)})`;
const hexOf3=(r,g,b)=>'#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,parent){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svgText(parent,x,y,txt,attrs={}){const t=svgEl('text',{x,y,...attrs},parent);t.textContent=txt;return t;}
const fmtH=h=>{h=((h%24)+24)%24;return String(h|0).padStart(2,'0')+':'+String(Math.floor((h%1)*60)).padStart(2,'0');};

function PX(cv){const ctx=cv.getContext('2d');const W=cv.width,H=cv.height;const img=ctx.createImageData(W,H);const u32=new Uint32Array(img.data.buffer);
  return {cv,ctx,W,H,img,u32,put(){ctx.putImageData(img,0,0);}};}
function cellOf(cv,e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height];}
function pointer(cv,fn){let down=false;cv.addEventListener('pointerdown',e=>{down=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}fn(cellOf(cv,e),'down',e);});
  cv.addEventListener('pointermove',e=>{fn(cellOf(cv,e),down?'drag':'move',e);});
  const up=e=>{if(down){down=false;fn(cellOf(cv,e),'up',e);}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',e=>{if(!down)fn(cellOf(cv,e),'leave',e);});}
function ctl(root){const g=k=>root.querySelector(`[data-k="${k}"]`);
  return {el:g,v:k=>{const e=g(k);return e.type==='checkbox'?e.checked:+e.value;},
    on:(k,fn)=>{const e=g(k);e.addEventListener('input',fn);e.addEventListener('change',fn);},
    out:(k,t)=>{const o=root.querySelector(`[data-o="${k}"]`);if(o)o.textContent=t;},
    btn:(k,fn)=>{const e=root.querySelector(`[data-b="${k}"]`);if(e)e.addEventListener('click',()=>fn(e));return e;},
    seg:(k,fn)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(!s)return;s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',s).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);});},
    segv:k=>{const b=root.querySelector(`[data-seg="${k}"] button.on`);return b?b.dataset.v:null;},
    setSeg:(k,v)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(s)$$('button',s).forEach(x=>x.classList.toggle('on',x.dataset.v===String(v)));}};}
function setHud(root,t,k){const h=root.querySelector(k?`[data-hud="${k}"]`:'[data-hud]');if(h)h.textContent=t;}
// 3x5 pixel digits for numbers drawn inside pixel canvases
const DIG=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001010010','111101111101111','111101111001111'];
function digits(u,W,H,x,y,str,col){for(const ch of String(str)){const d=DIG[+ch];if(d!==undefined)for(let r=0;r<5;r++)for(let c=0;c<3;c++)if(d[r*3+c]==='1'){const xx=x+c,yy=y+r;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=col;}x+=4;}}
// polyline helper for small SVG charts
function poly(svg,pts,attrs){return svgEl('polyline',{points:pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '),fill:'none',...attrs},svg);}


// ----------------------------------------------------------------------
// Flash guard: at most one >10 % brightness swing per 1/6 s, i.e. at most
// six transitions (three flashes) per second, whatever the model asks for.
// ----------------------------------------------------------------------
function FG(){let a=null,lt=-9;return (v,t)=>{if(a===null){a=v;lt=t;return v;}if(Math.abs(v-a)<=.1)return v;if(t-lt>=1/6){a=v;lt=t;return v;}return clamp(v,a-.099,a+.099);};}

// ----------------------------------------------------------------------
// Characters (7x12 walker, reused from the series)
// ----------------------------------------------------------------------
const PF=["..hhh..",".hhhhh.",".HHHHH.",".seses.",".sssss.","yccCccy","ccccccc","ccccccc",".CcccC."],PB=["..hhh..",".hhhhh.",".HHHHH.",".hhhhh.",".sssss.","ccccccc","ccccccc","ccccccc",".CcccC."],PS=["..hhh..",".hhhhh.",".HHHHH.","..ssse.","..ssss.",".cccc..","ccccc..",".cccc..",".CccC.."];
const LF=[[".ll.ll.",".ll.ll.",".bb.bb."],[".ll.ll.","..l.ll.","..b.bb."],[".ll.ll.",".ll.l..",".bb.b.."]],LS=[["..ll...","..ll...","..bbb.."],[".l..l..",".l...l.","bb...bb"],["..ll...",".ll....",".bb...."]];
function charRows(c){const fr=c.moving?[0,1,0,2][(c.anim|0)%4]:0;if(c.dir==='down')return [PF.concat(LF[fr]),false];if(c.dir==='up')return [PB.concat(LF[fr]),false];return [PS.concat(LS[fr]),c.dir==='left'];}
function moveC(c,vx,vy,dt,blocked){const nx=c.x+vx*dt,ny=c.y+vy*dt;let mx=0,my=0;if(!blocked||!blocked(nx,c.y)){mx=nx-c.x;c.x=nx;}if(!blocked||!blocked(c.x,ny)){my=ny-c.y;c.y=ny;}c.moving=Math.abs(mx)+Math.abs(my)>.001;
  if(c.moving){c.anim+=dt*8;if(Math.abs(vx)>Math.abs(vy))c.dir=vx>0?'right':'left';else c.dir=vy>0?'down':'up';}else c.anim=0;}

// ======================================================================
// FIRE HELPERS
// ======================================================================
// DOOM PSX fire palette, 37 entries, heat 0..36 (Sanglard, S1)
const DOOM_HEX='070707 1f0707 2f0f07 470f07 571707 671f07 771f07 8f2707 9f2f07 af3f07 bf4707 c74707 df4f07 df5707 df5707 d75f07 d75f07 d7670f cf6f0f cf770f cf7f0f cf8717 c78717 c78f17 c7971f bf9f1f bf9f1f bfa727 bfa727 bfaf2f b7af2f b7b72f b7b737 cfcf6f dfdf9f efefc7 ffffff'.split(' ');
const DOOM_PAL=Uint32Array.from(DOOM_HEX,h=>U('#'+h));
// 4-tone flame ramp (B1): 1 deep red edge, 2 orange, 3 yellow, 4 near-white core; 5 = pure white, kept for flashes
const TONE_HEX=['#000000','#a22633','#f26a1b','#fdb52f','#fff1b8','#ffffff'];
const TONES=Uint32Array.from(TONE_HEX,U);
// 6-step heat ramp (B3): black, dark red, red, orange, yellow, pale yellow-white
const RAMP6_HEX=['#120707','#5b1313','#b0281f','#ee6a1a','#fcbf34','#fff4c8'];
const RAMP6=Uint32Array.from(RAMP6_HEX,U);
// smoke state colours (E5): grey wood smoke, white steam, black oil smoke; 4 shades each, light to dense
const SMOKE_HEX=['#4a4442','#6a6360','#8d8580','#b3aca5'],STEAM_HEX=['#7f949c','#a9bfc7','#d3e3e8','#f2f9fb'],OIL_HEX=['#2a2224','#1f191b','#161213','#0d0a0b'];
const SMOKE=Uint32Array.from(SMOKE_HEX,U),STEAM=Uint32Array.from(STEAM_HEX,U),OILSM=Uint32Array.from(OIL_HEX,U);
// ground and prop colours for small fire scenes
const FC={grass:U('#3f7a3c'),grass2:U('#4f8f45'),grass3:U('#6aa84f'),dry:U('#a8973f'),dry2:U('#c2ad52'),dry3:U('#8a7a34'),dirt:U('#6b4f35'),dirt2:U('#7f6042'),
  road:U('#8a8072'),road2:U('#a19887'),stone:U('#6e6a66'),stone2:U('#8c8780'),water:U('#2c5f8a'),water2:U('#3f7fae'),water3:U('#7fb8d8'),
  ash:U('#3b3634'),ash2:U('#4f4946'),ash3:U('#2a2625'),char:U('#1e1716'),leaf:U('#2e6b3a'),leaf2:U('#3d8446'),leaf3:U('#225530'),trunk:U('#5a3a24'),
  wood:U('#8a5a34'),wood2:U('#a8703f'),wood3:U('#6a4428'),roof:U('#8e3b2e'),roof2:U('#a94a35'),roof3:U('#6e2b22'),win:U('#2a1c14'),winlit:U('#ffcf6a'),
  post:U('#4a3020'),black:U('#000000'),ember:U('#d8401c'),ember2:U('#8e1f12'),lava:U('#e8501c'),lava2:U('#ffb02e'),crust:U('#2b1a16'),night:U('#0c0a12')};
// integer hash for deterministic fire: same answer on every machine, any iteration order (D8)
const hashI=(x,y,t,s)=>{let h=Math.imul(x|0,0x27d4eb2d)^Math.imul(y|0,0x165667b1)^Math.imul(t|0,0x9e3779b1)^Math.imul(s|0,0x85ebca77);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return h>>>0;};
// Bayer threshold test: draw when coverage a (0..1) beats the 4x4 cell (17 levels)
const dith=(x,y,a)=>a*16>bay(x,y)+.5;
// DOOM fire step on a heat buffer (A1). r = round(random()*3) gives sideways +1..-2 and decay r&1.
// opt.wind: extra sideways px per row (fractional, sign = direction); opt.pd: decay chance (canonical 0.5)
function doomStep(buf,W,H,opt={}){const wind=opt.wind||0,pd=opt.pd===undefined?.5:opt.pd,aw=Math.abs(wind),ws=wind<0?-1:1,R=opt.rand||Math.random;
  for(let x=0;x<W;x++)for(let y=1;y<H;y++){const src=y*W+x,p=buf[src];if(p===0){buf[src-W]=0;continue;}
    const r=Math.round(R()*3);let dst=src-r+1;if(aw){const fl=Math.floor(aw);dst+=ws*(fl+(R()<aw-fl?1:0));}
    const row=(y-1)*W;let d=dst-W;if(d<row)d+=W;else if(d>=row+W)d-=W;
    const dec=pd===.5?(r&1):(R()<pd?1:0);buf[d]=p-dec>0?p-dec:0;}}
// tone sprites: rows of '.' and digits 1..5 -> Uint8Array
function sprite(rows){const h=rows.length,w=rows[0].length,a=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=rows[y][x];a[y*w+x]=c==='.'?0:+c;}return {w,h,a};}
// hand-drawn 4-frame torch loop, 9x14, still base, tip breaks off in frame 3 (B1)
const FLAME4=[
 ["....1....","...11....","...121...","..1221...","..12321..",".122321..",".1233321.",".1234321.","12344321.","123444321","123444321","123444321",".1234321.","..11111.."],
 [".....1...",".....1...","....11...","...121...","...1221..","..12321..",".122331..",".1233321.",".12344321","123444321","123444321","123444321",".1234321.","..11111.."],
 ["...1.....","..121....","...1.....",".........","...121...","..12321..",".123321..",".1233321.","12344321.","123444321","123444321","123444321",".1234321.","..11111.."],
 [".........","..1......","..11.....","..121....",".1221....",".12321...",".123321..",".1233321.","12344321.","123444321","123444321","123444321",".1234321.","..11111.."]].map(sprite);
// same loop without the detaching tip (the "jelly" version)
const FLAME4J=[FLAME4[0],FLAME4[1],sprite(["....1....","...121...","...121...","..1221...","..12321..",".122321..",".123321..",".1233321.","12344321.","123444321","123444321","123444321",".1234321.","..11111.."]),FLAME4[3]];
// procedural flame frames for any size (w x h), tones 1..4 (5 = white core only when big)
function mkFlame(w,h,frames=4){const out=[];for(let f=0;f<frames;f++){const a=new Uint8Array(w*h),cx=(w-1)/2,ph=f/frames*2*Math.PI,tip=h*(.84+.16*Math.sin(ph+.6));
  for(let y=0;y<h;y++){const v=(h-1-y)/tip;if(v>1)continue;const hw=(w/2+.3)*Math.sqrt(1-v)*Math.min(1,.62+v*1.7),sx=Math.sin(v*3.4+ph)*v*v*w*.2;
    for(let x=0;x<w;x++){const d=Math.abs(x-cx-sx)/hw;if(d>=1)continue;const q=1-d-v*.55+(v<.3?.14:0);a[y*w+x]=q>.56?4:q>.3?3:q>.07?2:1;}}
  if(f%2===1){const ty=Math.round(h-1-tip-1-(f>>1)),tx=Math.round(cx+Math.sin(3.4+ph)*w*.2);if(ty>=0&&tx>=0&&tx<w){a[ty*w+tx]=w>6?2:1;if(w>8&&ty>0)a[(ty-1)*w+tx]=1;}}
  out.push({w,h,a});}return out;}
// draw a tone sprite with its bottom centre at (x,y); pal maps tone -> colour (default TONES)
function blit(u,W,H,s,x,y,pal=TONES,flip=false){const x0=Math.round(x-(s.w-1)/2),y0=Math.round(y-s.h+1);
  for(let j=0;j<s.h;j++){const yy=y0+j;if(yy<0||yy>=H)continue;for(let i=0;i<s.w;i++){const t=s.a[j*s.w+(flip?s.w-1-i:i)];if(!t)continue;const xx=x0+i;if(xx>=0&&xx<W)u[yy*W+xx]=pal[t];}}}
// continuous-phase flame (same shape model as mkFlame): bottom centre (cx,by), size w x h, phase ph in radians
function drawFlame(u,W,H,cx,by,w,h,ph,pal=TONES){const tip=h*(.84+.16*Math.sin(ph+.6));
  for(let y=0;y<h;y++){const v=y/tip;if(v>1)break;const hw=(w/2+.3)*Math.sqrt(1-v)*Math.min(1,.62+v*1.7),sx=Math.sin(v*3.4+ph)*v*v*w*.2,yy=Math.round(by-y);if(yy<0||yy>=H)continue;
    for(let x=Math.floor(cx-hw-w*.25);x<=Math.ceil(cx+hw+w*.25);x++){if(x<0||x>=W)continue;const d=Math.abs(x-cx-sx)/hw;if(d>=1)continue;const q=1-d-v*.55+(v<.3?.14:0);u[yy*W+x]=pal[q>.56?4:q>.3?3:q>.07?2:1];}}}
// Stardew torch phase (B5): frame = ((ms + x*3047 + y*88) % period) * frames / period
const flameFrame=(x,y,ms,frames=4,period=400)=>Math.floor((((ms+x*3047+y*88)%period)+period)%period*frames/period);
// fixed ember pool (C1): ring buffer, spawning reuses the oldest slot, nothing allocates
function mkPool(n){const P={n,x:new Float32Array(n),y:new Float32Array(n),vx:new Float32Array(n),vy:new Float32Array(n),age:new Float32Array(n),life:new Float32Array(n),head:0,
  spawn(x,y,vx,vy,life){const j=P.head;P.x[j]=x;P.y[j]=y;P.vx[j]=vx;P.vy[j]=vy;P.age[j]=0;P.life[j]=life;P.head=(j+1)%n;return j;},
  step(dt,g=0,wind=0,drag=.95){let c=0;const k=Math.pow(drag,dt*60);for(let j=0;j<n;j++){if(P.life[j]<=0)continue;P.age[j]+=dt;if(P.age[j]>=P.life[j]){P.life[j]=0;continue;}
    P.vy[j]+=g*dt;P.vx[j]=(P.vx[j]+wind*dt)*k;P.x[j]+=P.vx[j]*dt;P.y[j]+=P.vy[j]*dt;c++;}return c;},
  count(){let c=0;for(let j=0;j<n;j++)if(P.life[j]>0)c++;return c;},clear(){P.life.fill(0);}};return P;}
// colour by age (C1): 0-20 % pale yellow, 20-50 % yellow-orange, 50-85 % red, 85-100 % dark red blinking at 15 Hz
const EMBER_HEX=['#fff1b8','#fdb52f','#e0401c','#8e1f12'],EMBERC=Uint32Array.from(EMBER_HEX,U);
const emberCol=(f,t)=>f<.2?EMBERC[0]:f<.5?EMBERC[1]:f<.85?EMBERC[2]:(Math.floor(t*30)&1?EMBERC[3]:0);

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
}
document.addEventListener('DOMContentLoaded',()=>{chrome();$$('[data-demo]').forEach(el=>io.observe(el));});
