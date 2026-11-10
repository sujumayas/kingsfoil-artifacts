"use strict";
// ======================================================================
// core: helpers, SVG chart helpers, demo runner and page chrome.
// Generic for every design-curves study; study demos live in demos*.js.
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
