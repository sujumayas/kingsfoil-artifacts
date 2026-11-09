"use strict";
// ======================================================================
// core: helpers, palette, shared snow field, demo runner, page chrome
// ======================================================================
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let rs=2463534242;
const rnd=()=>{rs^=rs<<13;rs^=rs>>>17;rs^=rs<<5;return (rs>>>0)/4294967296;};
const ri=n=>(rnd()*n)|0;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const hash2=(x,y)=>{let h=Math.imul(x*374761393+y*668265263,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const vnoise=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const bay=(x,y)=>BAYER[(y&3)*4+(x&3)];
const pack=(r,g,b)=>((255<<24)|(clamp(b|0,0,255)<<16)|(clamp(g|0,0,255)<<8)|clamp(r|0,0,255))>>>0;
const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const C32=h=>{const [r,g,b]=hexRGB(h);return pack(r,g,b);};
const un32=c=>[c&255,(c>>>8)&255,(c>>>16)&255];
const shadeC=c=>{const [r,g,b]=un32(c);return pack(r*.72,g*.77,b*.9+12);};   // Sandbox blue-shifted shadow variant
const wetC=c=>{const [r,g,b]=un32(c);return pack(r*.66,g*.68,b*.74);};
const mix32=(a,b,t)=>{const A=un32(a),B=un32(b);return pack(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t));};
const css=(c)=>{const [r,g,b]=un32(c);return `rgb(${r},${g},${b})`;};

// Sandbox colours (from the report's E1 table and the sandbox palette)
const COL={HI:C32('#f6f9ff'),BASE:C32('#e2eaf6'),MID:C32('#c4d1ea'),SH:C32('#9eaedb'),DEEP:C32('#7c86c2'),PACK:C32('#c9cfe2'),PSH:C32('#a6aecf'),SPARK:C32('#ffffff'),
  GR_D:C32('#2f4a3c'),GR_A:C32('#3b5a45'),GR_B:C32('#4a6b4b'),GR_T:C32('#5f7f52'),DIRT:C32('#6a5140'),DIRT_B:C32('#5b4536'),
  ROOF_A:C32('#8a3b3b'),ROOF_B:C32('#6e2c31'),ROOF_D:C32('#4a1f27'),WALL_A:C32('#8b6a4a'),WALL_B:C32('#7a5b3f'),WALL_D:C32('#4d3826'),WIN:C32('#7f9fbf'),DOOR:C32('#3d2a1d'),
  CAN_A:C32('#2f6b4f'),CAN_B:C32('#24553f'),CAN_D:C32('#1a3d30'),TRUNK:C32('#5a3b28'),ROCK_A:C32('#8a8f9a'),ROCK_B:C32('#6f7480'),ROCK_C:C32('#4e525d'),
  FEN_A:C32('#9a7650'),FEN_D:C32('#6a4d33'),ICE_A:C32('#8fb6d6'),ICE_B:C32('#a9cbe4'),
  COAT:C32('#3c6fb4'),COAT2:C32('#2f5592'),HAT:C32('#c8443c'),SKIN:C32('#f0c09a'),SCARF:C32('#f2c14e'),LEG:C32('#2a2c3a'),FOX:C32('#d9733a'),
  NIGHT:C32('#0b1020'),FLAKE:C32('#ffffff'),FLAKE_F:C32('#c9d6ee'),HEAT0:C32('#14183c')};
const HEAT=new Uint32Array(256);for(let i=0;i<256;i++){const t=i/255;const r=t<.5?20+t*2*40:60+(t-.5)*2*195,g=t<.5?24+t*2*150:174+(t-.5)*2*81,b=t<.5?60+t*2*170:230+(t-.5)*2*25;HEAT[i]=pack(r,g,b);}

// pixel canvas wrapper
function PX(cv){const ctx=cv.getContext('2d');const W=cv.width,H=cv.height;const img=ctx.createImageData(W,H);const u32=new Uint32Array(img.data.buffer);
  return {cv,ctx,W,H,img,u32,put(){ctx.putImageData(img,0,0);}};}
function cellOf(cv,e){const r=cv.getBoundingClientRect();return [Math.floor((e.clientX-r.left)/r.width*cv.width),Math.floor((e.clientY-r.top)/r.height*cv.height)];}
function pointer(cv,fn){let down=false;cv.addEventListener('pointerdown',e=>{down=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}fn(cellOf(cv,e),'down',e);});
  cv.addEventListener('pointermove',e=>{fn(cellOf(cv,e),down?'drag':'move',e);});
  const up=e=>{if(down){down=false;fn(cellOf(cv,e),'up',e);}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',e=>{if(!down)fn([-1,-1],'leave',e);});}
// controls: <input data-k="name">, <output data-o="name">
function ctl(root){const g=k=>root.querySelector(`[data-k="${k}"]`);
  return {el:g,v:k=>{const e=g(k);return e.type==='checkbox'?e.checked:+e.value;},
    on:(k,fn)=>{const e=g(k);e.addEventListener('input',fn);e.addEventListener('change',fn);},
    out:(k,t)=>{const o=root.querySelector(`[data-o="${k}"]`);if(o)o.textContent=t;},
    btn:(k,fn)=>{const e=root.querySelector(`[data-b="${k}"]`);if(e)e.addEventListener('click',()=>fn(e));return e;},
    seg:(k,fn)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(!s)return;s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',s).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);});}};}
function setHud(root,t){const h=root.querySelector('[data-hud]');if(h)h.textContent=t;}

// ----------------------------------------------------------------------
// Shared snow field (one byte of depth per pixel), after the Sandbox rules
// surface: 0 ground, 1 roof/top, 2 canopy, 3 ice, 9 solid (no snow)
// ----------------------------------------------------------------------
function Field(W,H,opt={}){
  const N=W*H,f={W,H,N,D:new Uint8Array(N),P:new Uint8Array(N),Wt:new Uint8Array(N),E:new Float32Array(N).fill(1),SHL:new Float32Array(N).fill(1),
    thr:new Float32Array(N),G:new Uint32Array(N),S:new Uint8Array(N),SH:new Uint8Array(N),WOB:new Uint8Array(N),Hgt:new Uint8Array(N),O:new Int16Array(N).fill(-1),MAXD:200};
  const seed=opt.seed||0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const n=vnoise((x+seed)/14,y/14)*.6+vnoise((x+seed)/5,y/5)*.4;
    let c=n<.38?COL.GR_D:n<.62?COL.GR_A:COL.GR_B,t=bay(x,y)*.55+hash2(x+7+seed,y+3)*2.5+.5;
    if(hash2(x+seed,y)<.05){c=COL.GR_T;t+=5;}f.G[i]=c;f.thr[i]=t;}
  const holds=s=>s<9, cls=s=>s===3?0:s;
  f.holds=holds;f.cls=cls;
  f.put=(x,y,s,c,h,o,obst)=>{if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;f.S[i]=s;f.G[i]=c;f.Hgt[i]=h||0;f.O[i]=o===undefined?-1:o;if(obst)f.WOB[i]=Math.max(f.WOB[i],h);if(holds(s)&&s!==0)f.thr[i]=bay(x,y)*.5+hash2(x,y)*1.5+.4;};
  f.capOf=s=>s===2?14:f.MAXD;
  f.deposit=(i,a)=>{const s=f.S[i];if(!holds(s))return;if(f.Wt[i]>90&&rnd()<.6){f.Wt[i]-=3;return;}f.D[i]=Math.min(f.capOf(s),f.D[i]+a);if(f.P[i])f.P[i]=f.P[i]>14?f.P[i]-14:0;};
  f.snowfall=(picks)=>{for(let k=0;k<picks;k++){const i=ri(N);const e=f.E[i];if(rnd()<e)f.deposit(i,1);}};
  f.sandpile=(n,rep=3)=>{for(let k=0;k<n;k++){const i=W+1+ri(N-2*W-2);const s=f.S[i];if(!holds(s)||s===2)continue;const r=ri(4),j=r===0?i+1:r===1?i-1:r===2?i+W:i-W;
    if(!holds(f.S[j])||cls(f.S[j])!==cls(s))continue;if(f.D[i]>f.D[j]+rep){f.D[i]--;f.D[j]++;}}};
  f.stamp=(x,y,w,h,keep,packV)=>{x|=0;y|=0;let spill=0;
    for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const px=x+xx,py=y+yy;if(px<1||py<1||px>=W-1||py>=H-1)continue;const i=py*W+px;if(!holds(f.S[i]))continue;
      const nd=(f.D[i]*keep)|0;spill+=f.D[i]-nd;f.D[i]=nd;f.P[i]=Math.max(f.P[i],packV);}
    if(spill<=0)return 0;const per=Math.max(1,(spill/6)|0);let moved=0;
    for(let k=0;k<6&&spill>0;k++){const a=rnd()*6.283,r=Math.max(w,h)*.5+1.2;const px=Math.round(x+w/2-.5+Math.cos(a)*r),py=Math.round(y+h/2-.5+Math.sin(a)*r*.7);
      if(px<0||py<0||px>=W||py>=H)continue;const i=py*W+px;if(holds(f.S[i])&&f.P[i]<200){const add=Math.min(per,spill);f.D[i]=Math.min(f.MAXD,f.D[i]+add);spill-=add;moved+=add;}}
    return moved;};
  f.melt=(picks,temp,sun,o={})=>{if(temp<=0)return;const n=(picks*Math.min(temp,6)/4*(.35+.65*sun))|0;const useShade=o.shade!==false,useEdge=o.edge!==false;
    for(let k=0;k<n;k++){const i=W+1+ri(N-2*W-2);if(!f.D[i])continue;
      let rate=(useShade&&f.SH[i]&&sun>.4?.25:1)*(f.P[i]>100?.5:1);const s=f.S[i];if(s===1)rate*=1.4;if(s===2)rate*=2.2;if(s===3)rate*=1.3;
      if(useEdge){let c=0;if(f.D[i-1]<3)c++;if(f.D[i+1]<3)c++;if(f.D[i-W]<3)c++;if(f.D[i+W]<3)c++;rate*=.35+c*.5;}else rate*=.6;
      if(rnd()<rate){f.D[i]--;if(s===0)f.Wt[i]=Math.min(255,f.Wt[i]+5);if(!f.D[i])f.P[i]=0;}}};
  f.evap=(n)=>{for(let k=0;k<n;k++){const i=ri(N);if(f.Wt[i]&&!f.D[i])f.Wt[i]=f.Wt[i]>2?f.Wt[i]-2:0;}};
  f.bakeShadow=()=>{f.SH.fill(0);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!f.Hgt[i]||f.O[i]<0)continue;const t=Math.min(f.O[i]-y,f.Hgt[i]);if(t<0)continue;
    for(let k=0;k<=t;k++){const sx=Math.round(x+k*.7),sy=Math.round(f.O[i]+1+k*.28);if(sx>=W||sy>=H)break;const j=sy*W+sx;if(f.S[j]===0&&f.O[j]<0)f.SH[j]=1;}}};
  f.bakeExposure=(wind)=>{const dir=Math.sign(wind),mag=Math.abs(wind);const BASEE=[1,1,.9,.7];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,s=f.S[i];if(!holds(s)){f.E[i]=0;continue;}let e=(BASEE[s]||1)*f.SHL[i];
      if(s===0&&mag>.15){for(let d=1;d<=28;d++){const sx=x-dir*d;if(sx<0||sx>=W)break;const h=f.WOB[y*W+sx];
        if(h>0){const L=h*1.1*mag+2;if(d<L){const q=d/L;e*=.15+.85*q*q;}else if(d<L*1.8)e*=1.12;break;}}}
      f.E[i]=Math.min(1.3,e);}};
  // render: threshold coverage + 4-tap emboss (Sandbox thresholds)
  f.render=(u32,o={})=>{const emb=o.emboss!==false,dith=o.dither!==false,shOn=!!o.shadow,spark=!!o.sparkle,slot=((o.frame||0)>>3)*2654435761;
    for(let y=0;y<H;y++){const row=y*W;for(let x=0;x<W;x++){const i=row+x,s=f.S[i];let c;
      if(!holds(s)){c=f.G[i];}
      else{const d=f.D[i],t=dith?f.thr[i]:1.5;
        if(d>t){let sl=0;if(emb){const l=x>0&&holds(f.S[i-1])?f.D[i-1]:d,r=x<W-1&&holds(f.S[i+1])?f.D[i+1]:d,u=y>0&&holds(f.S[i-W])?f.D[i-W]:d,dn=y<H-1&&holds(f.S[i+W])?f.D[i+W]:d;sl=(r-l)+(dn-u);}
          if(f.P[i]>110)c=sl<-5?COL.PSH:COL.PACK;else if(!emb||d<t+4)c=COL.BASE;else c=sl>6?COL.HI:sl>=-6?COL.BASE:sl>=-13?COL.MID:sl>=-22?COL.SH:COL.DEEP;
          if(spark&&sl>=0&&((Math.imul(i^slot,2246822519)>>>23)===0))c=COL.SPARK;
          if(shOn&&f.SH[i])c=shadeC(c);}
        else{c=f.G[i];if(shOn&&f.SH[i])c=shadeC(c);if(f.Wt[i]>50)c=wetC(c);}}
      u32[i]=c;}}};
  return f;}

// little character sprite (5 wide) drawn into u32 at feet (x,y); sink hides bottom rows
const KID=["..h..",".hhh.",".sss.","yyyyy","ccccc","ccccc",".l.l.",".l.l."];
const KMAP={h:COL.HAT,s:COL.SKIN,y:COL.SCARF,c:COL.COAT,l:COL.LEG};
function drawKid(u32,W,H,x,y,sink,frame){x=Math.round(x);y=Math.round(y);const rows=KID.length;const vis=rows-sink;
  for(let r=0;r<vis;r++){const row=KID[r];let line=row;if(r>=6&&frame&1)line=r===6?".l..l":"l...l";
    for(let c=0;c<5;c++){const ch=line[c];if(ch==='.')continue;const px=x-2+c,py=y-rows+1+sink+r;if(px<0||py<0||px>=W||py>=H)continue;u32[py*W+px]=KMAP[ch];}}
  if(sink>0)for(let c=-3;c<=3;c++){const px=x+c,py=y;if(px>=0&&px<W&&py<H&&py>=0)u32[py*W+px]=(c===-3||c===3)?COL.MID:COL.HI;}}

// ----------------------------------------------------------------------
// demo runner: lazy init + pause offscreen (IntersectionObserver) + rAF
// ----------------------------------------------------------------------
const DEMOS={};function reg(name,fn){DEMOS[name]=fn;}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let motion=!reduce;
const live=new Map(); // el -> {api, vis, kick}
function initDemo(el){if(live.has(el))return;const name=el.dataset.demo,fn=DEMOS[name];const rec={api:null,vis:true,kick:120};live.set(el,rec);
  if(!fn){console.warn('no demo',name);return;}
  rec.api=fn(el)||{};if(rec.api.tick)rec.api.tick(1/60);
  const kick=()=>{rec.kick=Math.max(rec.kick,150);ensureLoop();};
  el.addEventListener('input',kick);el.addEventListener('pointerdown',kick);el.addEventListener('click',kick);el.addEventListener('pointermove',()=>{if(!motion)rec.kick=Math.max(rec.kick,20);ensureLoop();});}
let looping=false,last=0;
function ensureLoop(){if(!looping){looping=true;last=performance.now();requestAnimationFrame(loop);}}
function loop(now){const dt=Math.min(.05,(now-last)/1000)||1/60;last=now;let any=false;
  for(const [el,rec] of live){if(!rec.vis||!rec.api||!rec.api.tick)continue;if(motion||rec.kick>0){if(rec.kick>0)rec.kick--;rec.api.tick(dt);any=true;}}
  if(any||motion)requestAnimationFrame(loop);else looping=false;}
const io=new IntersectionObserver(es=>{for(const e of es){const el=e.target;if(e.isIntersecting){initDemo(el);live.get(el).vis=true;ensureLoop();}else if(live.has(el))live.get(el).vis=false;}},{rootMargin:'120px 0px'});

// ----------------------------------------------------------------------
// page chrome: TOC, motion toggle, profiles open/close, index filter
// ----------------------------------------------------------------------
function chrome(){
  const toc=$('#toc'),btn=$('#tocBtn'),scrim=$('#tocScrim');
  const setOpen=o=>{toc.classList.toggle('open',o);btn.setAttribute('aria-expanded',o);scrim.hidden=!o;};
  btn.addEventListener('click',()=>setOpen(!toc.classList.contains('open')));scrim.addEventListener('click',()=>setOpen(false));
  toc.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
  addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
  const links=$$('.toc a[data-sec]'),map=new Map(links.map(a=>[a.dataset.sec,a]));
  const sio=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const a=map.get(e.target.id);if(a){links.forEach(l=>l.classList.toggle('on',l===a||(a.closest('.sub')&&l.dataset.sec==='techniques')));}}},{rootMargin:'-20% 0px -70% 0px'});
  map.forEach((a,id)=>{const s=document.getElementById(id);if(s)sio.observe(s);});
  const mb=$('#motionBtn');const sync=()=>{mb.textContent=motion?'Pause animations':'Play animations';mb.setAttribute('aria-pressed',!motion);};sync();
  mb.addEventListener('click',()=>{motion=!motion;sync();ensureLoop();});
  $$('[data-openall]').forEach(b=>b.addEventListener('click',()=>$$('details.tp').forEach(d=>d.open=true)));
  $$('[data-closeall]').forEach(b=>b.addEventListener('click',()=>$$('details.tp').forEach(d=>d.open=false)));
  // open profile when navigating to its hash
  const openHash=()=>{const h=location.hash.slice(1);const d=h&&document.getElementById(h);if(d&&d.tagName==='DETAILS')d.open=true;};addEventListener('hashchange',openHash);openHash();
  const q=$('#idxq');if(q){const rows=$$('#idxt tbody tr'),n=$('#idxn');const f=()=>{const v=q.value.trim().toLowerCase();let c=0;rows.forEach(r=>{const m=!v||r.textContent.toLowerCase().includes(v);r.hidden=!m;if(m)c++;});n.textContent=`${c} of ${rows.length} entries`;};q.addEventListener('input',f);f();}
}
document.addEventListener('DOMContentLoaded',()=>{chrome();$$('[data-demo]').forEach(el=>io.observe(el));});
