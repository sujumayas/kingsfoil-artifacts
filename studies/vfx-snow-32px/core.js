"use strict";
// ======================================================================
// core (snow at 32 px, VFX #11): generic helpers (names shared with demos1-3,
// do not rename), the 7x12 walker of VFX #1 (for 8 px comparisons), integer
// hash, Bayer dithering, tone sprites, a fixed particle pool, colour helpers,
// noise tables, a cost meter, whole-number canvas scaling, the demo runner and
// page chrome. Lines are long; never put a // comment mid-line.
//
// Shared names:
//   $ $$ rnd mkRng clamp lerp sat smooth hash2 n1 vnoise BAYER bay pack U un32
//   mix32 mulc hexf rgbCss hexOf3 svgEl svgText fmtH poly PX cellOf pointer ctl
//   setHud digits FG PF LF charRows moveC hashI dith sprite blit mkPool ringAt
//   drawChar CHAR_PAL tileFrame mkWalker blueNoise reg
//   TONES                                     - default 5-step ramp for sprite()+blit(): fire, dark edge 1 .. light core 5
//   lum desat dist2 nearestIn                 - colour helpers
//   poisson mkTable tabAt tabBil fbmP         - Poisson-disc scatter, tileable noise tables, per-pixel fbm
//   meter fms                                 - smoothed performance.now() meter, ms formatter
//   snapStage stageRoom                       - whole-number scale for a .stage > canvas. Runs by itself; call snapStage after changing canvas.width
// The 32 px art (24x32 characters, snow ramp, tiles, pines) lives in each demos file, inside its own block.
// Page data from build.py: SCORE (scorecard rows), GENS (timeline) and T6, the tables of section 6 as cell strings
// (keys tick, ground, shader, upload, bake, chars, frame, 6b, 6c, 6d, 6e).
// ======================================================================
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let rs=20261112;
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


// integer hash: same answer on every machine, any iteration order (cosmetics from hash(position, clock))
const hashI=(x,y,t,s)=>{let h=Math.imul(x|0,0x27d4eb2d)^Math.imul(y|0,0x165667b1)^Math.imul(t|0,0x9e3779b1)^Math.imul(s|0,0x85ebca77);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return h>>>0;};
// Bayer threshold test: draw when coverage a (0..1) beats the 4x4 cell (17 levels)
const dith=(x,y,a)=>a*16>bay(x,y)+.5;
// tone sprites: rows of '.' and digits 1..5 -> Uint8Array
function sprite(rows){const h=rows.length,w=rows[0].length,a=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=rows[y][x];a[y*w+x]=c==='.'?0:+c;}return {w,h,a};}
// draw a tone sprite with its bottom centre at (x,y); pal maps tone -> colour (default TONES)
function blit(u,W,H,s,x,y,pal=TONES,flip=false){const x0=Math.round(x-(s.w-1)/2),y0=Math.round(y-s.h+1);
  for(let j=0;j<s.h;j++){const yy=y0+j;if(yy<0||yy>=H)continue;for(let i=0;i<s.w;i++){const t=s.a[j*s.w+(flip?s.w-1-i:i)];if(!t)continue;const xx=x0+i;if(xx>=0&&xx<W)u[yy*W+xx]=pal[t];}}}
// fixed pool (H1): ring buffer, spawning reuses the oldest slot, nothing allocates
function mkPool(n){const P={n,x:new Float32Array(n),y:new Float32Array(n),vx:new Float32Array(n),vy:new Float32Array(n),age:new Float32Array(n),life:new Float32Array(n),head:0,
  spawn(x,y,vx,vy,life){const j=P.head;P.x[j]=x;P.y[j]=y;P.vx[j]=vx;P.vy[j]=vy;P.age[j]=0;P.life[j]=life;P.head=(j+1)%n;return j;},
  step(dt,g=0,wind=0,drag=.95){let c=0;const k=Math.pow(drag,dt*60);for(let j=0;j<n;j++){if(P.life[j]<=0)continue;P.age[j]+=dt;if(P.age[j]>=P.life[j]){P.life[j]=0;continue;}
    P.vy[j]+=g*dt;P.vx[j]=(P.vx[j]+wind*dt)*k;P.x[j]+=P.vx[j]*dt;P.y[j]+=P.vy[j]*dt;c++;}return c;},
  count(){let c=0;for(let j=0;j<n;j++)if(P.life[j]>0)c++;return c;},clear(){P.life.fill(0);}};return P;}
// a squashed 1 px ring (3/4 view: height = squash x width). mask(x,y) optional: draw only where it returns true
function ringAt(u,W,H,cx,cy,r,col,squash=.5,mask){if(r<.5){const x=Math.round(cx),y=Math.round(cy);if(x>=0&&y>=0&&x<W&&y<H&&(!mask||mask(x,y)))u[y*W+x]=col;return;}
  const n=Math.max(8,Math.ceil(r*6.4));let px=-9,py=-9;for(let k=0;k<n;k++){const a=k/n*Math.PI*2,x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r*squash);
    if(x===px&&y===py)continue;px=x;py=y;if(x>=0&&y>=0&&x<W&&y<H&&(!mask||mask(x,y)))u[y*W+x]=col;}}
// walker colours (letters used by PF/PB/PS/LF/LS)
const CHAR_PAL={h:U('#4a2e1c'),H:U('#6b4429'),s:U('#e8b88a'),e:U('#1a1210'),y:U('#c9a050'),c:U('#2f6fa8'),C:U('#22507c'),l:U('#4a4038'),b:U('#2a201a')};
// draw the 7x12 walker with feet at (x,y). clip: rows from the feet up that are hidden (wading), 0 = none.
// tint(col) optional (night, reflection). Returns nothing; skips pixels outside the canvas.
function drawChar(u,W,H,c,x,y,clip=0,pal=CHAR_PAL,tint){const [rows,fl]=charRows(c),n=rows.length,x0=Math.round(x)-3,y0=Math.round(y)-n+1;
  for(let j=0;j<n-clip;j++){const r=rows[j],yy=y0+j;if(yy<0||yy>=H)continue;for(let i=0;i<7;i++){const ch=r[fl?6-i:i];if(ch==='.'||!pal[ch])continue;const xx=x0+i;if(xx<0||xx>=W)continue;u[yy*W+xx]=tint?tint(pal[ch]):pal[ch];}}}
// shared-clock tile frame (A1): every copy of a tile shows the same frame unless phase is offset
const tileFrame=(ms,frames,holdMs,phase=0)=>(Math.floor(ms/holdMs)+phase)%frames;




// ======================================================================
// shared colour, scatter, noise and timing helpers
// ======================================================================
const TONES=Uint32Array.from(['#15111c','#4a1024','#b8281c','#f07818','#ffd040','#fff8dc'],U);
const lum=c=>{const a=un32(c);return .299*a[0]+.587*a[1]+.114*a[2];};
const desat=(c,k)=>{const a=un32(c),l=.299*a[0]+.587*a[1]+.114*a[2];return pack(lerp(a[0],l,k),lerp(a[1],l,k),lerp(a[2],l,k));};
const dist2=(a,b)=>{const A=un32(a),B=un32(b),dr=A[0]-B[0],dg=A[1]-B[1],db=A[2]-B[2];return 2*dr*dr+4*dg*dg+3*db*db;};
function nearestIn(pal,c){let bi=0,bd=1e18;for(let i=0;i<pal.length;i++){const d=dist2(pal[i],c);if(d<bd){bd=d;bi=i;}}return bi;}
// Bridson Poisson-disc scatter (B5): points at least r apart in a w x h box; ok(x,y) optional mask
function poisson(w,h,r,rng=rnd,ok,k=24){const cs=r/Math.SQRT2,gw=Math.ceil(w/cs),gh=Math.ceil(h/cs),G=new Int32Array(gw*gh).fill(-1),P=[],A=[];
  const fits=(x,y)=>{if(x<0||y<0||x>=w||y>=h)return false;if(ok&&!ok(x,y))return false;const gx=(x/cs)|0,gy=(y/cs)|0;
    for(let j=Math.max(0,gy-2);j<=Math.min(gh-1,gy+2);j++)for(let i=Math.max(0,gx-2);i<=Math.min(gw-1,gx+2);i++){const q=G[j*gw+i];if(q>=0){const dx=P[q][0]-x,dy=P[q][1]-y;if(dx*dx+dy*dy<r*r)return false;}}return true;};
  const add=(x,y)=>{P.push([x,y]);A.push(P.length-1);G[((y/cs)|0)*gw+((x/cs)|0)]=P.length-1;};
  for(let t=0;t<30&&!P.length;t++){const x=rng()*w,y=rng()*h;if(fits(x,y))add(x,y);}
  while(A.length){const ai=(rng()*A.length)|0,[px,py]=P[A[ai]];let found=false;
    for(let t=0;t<k;t++){const a=rng()*Math.PI*2,d=r*(1+rng());const x=px+Math.cos(a)*d,y=py+Math.sin(a)*d;if(fits(x,y)){add(x,y);found=true;break;}}
    if(!found)A.splice(ai,1);}return P;}
// tileable value-noise fbm table, n x n (n a power of two), values 0..1 after normalising. base = lattice cells across.
function mkTable(n,seed=1,base=4,oct=4,gain=.5){const T=new Float32Array(n*n);let mn=9,mx=-9;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){let v=0,a=1,s=0,p=base;
    for(let o=0;o<oct;o++){const fx=x/n*p,fy=y/n*p,xi=Math.floor(fx),yi=Math.floor(fy),tx=fx-xi,ty=fy-yi,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);
      const h=(i,j)=>hash2(((i%p)+p)%p+seed*131+o*977,((j%p)+p)%p+seed*71);
      const A=h(xi,yi),B=h(xi+1,yi),C=h(xi,yi+1),D=h(xi+1,yi+1);v+=a*(A+(B-A)*sx+(C-A)*sy+(A-B-C+D)*sx*sy);s+=a;a*=gain;p*=2;}
    v/=s;T[y*n+x]=v;if(v<mn)mn=v;if(v>mx)mx=v;}
  for(let i=0;i<T.length;i++)T[i]=(T[i]-mn)/(mx-mn);return T;}
const tabAt=(T,n,x,y)=>T[((y|0)&(n-1))*n+((x|0)&(n-1))];
function tabBil(T,n,x,y){const xi=Math.floor(x),yi=Math.floor(y),tx=x-xi,ty=y-yi,m=n-1,a=T[(yi&m)*n+(xi&m)],b=T[(yi&m)*n+((xi+1)&m)],c=T[((yi+1)&m)*n+(xi&m)],d=T[((yi+1)&m)*n+((xi+1)&m)];
  return (a*(1-tx)+b*tx)*(1-ty)+(c*(1-tx)+d*tx)*ty;}
function fbmP(x,y,oct){let v=0,a=.5,s=0;for(let o=0;o<oct;o++){v+=a*vnoise(x,y);s+=a;x=x*2+17.3;y=y*2+5.1;a*=.5;}return v/s;}
// smoothed cost meter around performance.now(): m.t0(); ...; m.t1() -> smoothed ms
function meter(k=.08){let s=-1,t=0;return {t0(){t=performance.now();},t1(){const d=performance.now()-t;s=s<0?d:s+(d-s)*k;return s;},get v(){return Math.max(0,s);}};}
const fms=v=>v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);

// a walking traveller along a polyline (ping-pong), speed px/s. Returns the char object for drawChar.
function mkWalker(pts,speed=14){const c={x:pts[0][0],y:pts[0][1],dir:'down',moving:true,anim:0,seg:0,f:0,back:false};
  c.step=dt=>{let a=pts[c.seg],b=pts[c.seg+1];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);c.f+=speed*dt/L*(c.back?-1:1);
    if(c.f>1){c.f=0;c.seg++;if(c.seg>=pts.length-1){c.seg=pts.length-2;c.f=1;c.back=true;}}if(c.f<0){c.f=1;c.seg--;if(c.seg<0){c.seg=0;c.f=0;c.back=false;}}
    a=pts[c.seg];b=pts[c.seg+1];const nx=lerp(a[0],b[0],c.f),ny=lerp(a[1],b[1],c.f),vx=nx-c.x,vy=ny-c.y;c.x=nx;c.y=ny;c.moving=true;c.anim+=dt*7;
    if(Math.abs(vx)>Math.abs(vy))c.dir=vx>0?'right':'left';else c.dir=vy>0?'down':'up';};return c;}
// small blue-noise threshold matrix (n x n, values 0..1) by a void-and-cluster style greedy fill
function blueNoise(n=16,seed=5){const N=n*n,E=new Float32Array(N),R=new Float32Array(N),used=new Uint8Array(N),s2=2*1.6*1.6;
  const rng=mkRng(seed);for(let i=0;i<N;i++)E[i]=rng()*1e-3;
  for(let r=0;r<N;r++){let bi=-1,be=1e9;for(let i=0;i<N;i++)if(!used[i]&&E[i]<be){be=E[i];bi=i;}used[bi]=1;R[bi]=(r+.5)/N;const bx=bi%n,by=(bi/n)|0;
    for(let i=0;i<N;i++){let dx=Math.abs(i%n-bx),dy=Math.abs(((i/n)|0)-by);dx=Math.min(dx,n-dx);dy=Math.min(dy,n-dy);E[i]+=Math.exp(-(dx*dx+dy*dy)/s2);}}
  return R;}

// ======================================================================
// whole-number canvas scale. Every .stage > canvas is shown at k times its
// native width, where k is the largest whole number that fits the stage's
// parent box (and the stage's own max-width in px, if it has one). A canvas
// wider than the space, or a stage with data-fluid, keeps width:100%.
// ======================================================================
const stageCap=new WeakMap();
const stageBorder=st=>{const ss=getComputedStyle(st);return (parseFloat(ss.borderLeftWidth)||0)+(parseFloat(ss.borderRightWidth)||0);};
// stageRoom: the CSS px a stage's canvas may take, inside the parent's padding and the stage's own border
function stageRoom(st){const par=st.parentElement;if(!par)return 0;if(!stageCap.has(st)){const m=getComputedStyle(st).maxWidth;stageCap.set(st,/px$/.test(m)?parseFloat(m):1e9);}
  const cs=getComputedStyle(par);return Math.min(stageCap.get(st),par.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0))-stageBorder(st);}
function snapStage(st){const cv=st.querySelector(':scope>canvas');if(!cv||!st.parentElement||st.hasAttribute('data-fluid'))return;
  const bw=stageBorder(st),k=Math.floor(stageRoom(st)/cv.width);
  if(k>=1){st.style.maxWidth=(k*cv.width+bw)+'px';cv.style.width=(k*cv.width)+'px';}else{st.style.maxWidth='';cv.style.width='';}}
const stageRO=new ResizeObserver(es=>{for(const e of es)for(const st of e.target.children)if(st.classList.contains('stage'))snapStage(st);});
function snapAll(){const seen=new Set();$$('.stage').forEach(st=>{snapStage(st);const p=st.parentElement;if(p&&!seen.has(p)){seen.add(p);stageRO.observe(p);}});}

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
document.addEventListener('DOMContentLoaded',()=>{chrome();snapAll();$$('[data-demo]').forEach(el=>io.observe(el));});
