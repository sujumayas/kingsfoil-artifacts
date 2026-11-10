"use strict";
// ======================================================================
// core (fog study #8): generic helpers (names shared with demos1-3, do not
// rename), flash guard, walker sprites, integer hash, Bayer dithering, tone
// sprites, a fixed particle pool, ring and walker drawing, the fog helpers,
// demo runner and page chrome.
//
// Shared names (same signatures as vfx-water's core):
//   $ $$ rnd mkRng clamp lerp sat smooth hash2 n1 vnoise BAYER bay pack U un32
//   mix32 mulc hexf rgbCss hexOf3 svgEl svgText fmtH poly PX cellOf pointer ctl
//   setHud digits FG PF LF charRows moveC hashI dith sprite blit mkPool ringAt
//   drawChar CHAR_PAL tileFrame distBFS WC RAMP_HEX RAMP HI reg
// Fog additions:
//   PAL_HEX PAL NPAL PI_ SHADE LIGHT EMIT  - 32-entry highland palette, shade/light maps
//   FOG_HEX TONES LVL_T fogRamp nightPal  - fog colours of the hour, on-ramp fog steps
//   lum desat dist2 nearestIn             - colour helpers
//   mkTable tabAt fbmP blueNoise          - tileable noise tables, per-pixel fbm, blue noise
//   meter fms GPU6A                       - smoothed performance.now() cost meter, §6a figures
//   mkHighland mkWalker                   - the shared highland scene and a path walker
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


// legacy ground colours and water ramps (kept so shared code keeps working)
// ground and prop colours for small water scenes (original, page-only palette)
const WC={sand:U('#d9c08a'),sand2:U('#c9ad74'),sand3:U('#e8d4a2'),wet:U('#a88f62'),wet2:U('#957d55'),grass:U('#3f7a3c'),grass2:U('#4f8f45'),grass3:U('#6aa84f'),
  dirt:U('#6b4f35'),dirt2:U('#7f6042'),rock:U('#6e6a66'),rock2:U('#8c8780'),rock3:U('#4f4b48'),cliff:U('#5a5048'),cliff2:U('#433a34'),
  wood:U('#8a5a34'),wood2:U('#a8703f'),wood3:U('#6a4428'),trunk:U('#5a3a24'),leaf:U('#2e6b3a'),leaf2:U('#3d8446'),leaf3:U('#225530'),
  roof:U('#8e3b2e'),roof2:U('#a94a35'),lily:U('#4f9a4a'),lily2:U('#6fbf5a'),foam:U('#eaf8f6'),foam2:U('#bfe8e4'),white:U('#ffffff'),black:U('#000000'),
  mist:U('#d6eef2'),moon:U('#fff6d8'),night:U('#0a1020'),boat:U('#7a4e2c'),boat2:U('#9a6838'),sail:U('#e8e0cc')};
// depth ramps, index 0 = shallowest. Hue shifts from teal toward navy as it darkens (D1), not plain darkening.
const RAMP_HEX={sea:['#62c9bd','#3ba3b3','#2b7aa0','#225487','#1b3466'],
  river:['#74d2c4','#4fb0bf','#3a8eb0','#2d6c99','#24507e'],
  swamp:['#8aa45c','#6b8a4a','#52703e','#3d5735','#2c402c']};
const NIGHT_HEX={sea:['#2f5f78','#24496a','#1c375a','#152a4a','#0f1d38']};
const RAMP={};for(const k in RAMP_HEX)RAMP[k]=Uint32Array.from(RAMP_HEX[k],U);
// surface highlights: soft, bright, glint (sparse 1-2 px white)
const HI_HEX=['#8fe0d8','#c8f4ee','#ffffff'],HI=Uint32Array.from(HI_HEX,U);
// tone sprites: 1..5 index the sea ramp light to dark, so sprite()+blit() draw water-coloured shapes by default
// integer hash: same answer on every machine, any iteration order (cosmetics from hash(position, clock))
const hashI=(x,y,t,s)=>{let h=Math.imul(x|0,0x27d4eb2d)^Math.imul(y|0,0x165667b1)^Math.imul(t|0,0x9e3779b1)^Math.imul(s|0,0x85ebca77);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return h>>>0;};
// Bayer threshold test: draw when coverage a (0..1) beats the 4x4 cell (17 levels)
const dith=(x,y,a)=>a*16>bay(x,y)+.5;
// tone sprites: rows of '.' and digits 1..5 -> Uint8Array
function sprite(rows){const h=rows.length,w=rows[0].length,a=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=rows[y][x];a[y*w+x]=c==='.'?0:+c;}return {w,h,a};}
// draw a tone sprite with its bottom centre at (x,y); pal maps tone -> colour (default TONES)
function blit(u,W,H,s,x,y,pal=TONES,flip=false){const x0=Math.round(x-(s.w-1)/2),y0=Math.round(y-s.h+1);
  for(let j=0;j<s.h;j++){const yy=y0+j;if(yy<0||yy>=H)continue;for(let i=0;i<s.w;i++){const t=s.a[j*s.w+(flip?s.w-1-i:i)];if(!t)continue;const xx=x0+i;if(xx>=0&&xx<W)u[yy*W+xx]=pal[t];}}}
// multi-source BFS distance-to-shore (B3). water(i) -> bool. Returns Int16Array, + in water (1 at the shore), - on land.
// 8-way by default; eight=false gives 4-way (diamond-shaped bands).
function distBFS(GW,GH,water,eight=true){const N=GW*GH,d=new Int16Array(N),q=new Int32Array(N);let h=0,t=0;const INF=32000;
  const W8=eight?[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1]],W4=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let i=0;i<N;i++)d[i]=INF;
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x,w=water(i);for(const [dx,dy] of W4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;if(water(ny*GW+nx)!==w){d[i]=w?1:-1;q[t++]=i;break;}}}
  while(h<t){const i=q[h++],x=i%GW,y=(i/GW)|0,s=d[i]>0?1:-1;for(const [dx,dy] of W8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;
    if(water(n)!==(s>0))continue;if(Math.abs(d[n])>Math.abs(d[i])+1){d[n]=d[i]+s;q[t++]=n;}}}
  for(let i=0;i<N;i++)if(d[i]===INF)d[i]=water(i)?99:-99;return d;}
// fixed pool (E1): ring buffer, spawning reuses the oldest slot, nothing allocates
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
// shared-clock tile frame (A2, F1): every copy of a tile shows the same frame unless phase is offset
const tileFrame=(ms,frames,holdMs,phase=0)=>(Math.floor(ms/holdMs)+phase)%frames;


// ======================================================================
// FOG HELPERS
// One indexed highland palette (32 entries), fog ramps that step each
// colour toward a desaturated sky hue, tileable noise tables, a highland
// scene generator (indices + height per pixel, trees, houses, tower,
// lamps), a smoothed cost meter, and the GPU/CPU numbers of §6a.
// ======================================================================
// base palette, index = meaning. Original, page-only colours.
const PAL_HEX=['#1b1f2a', // 0 outline, deep shadow
  '#2c4a5c','#3e6a7a','#79a3ad', // 1-3 water dark, water, water glint
  '#45553d','#5d6e47', // 4-5 marsh
  '#2b4430','#3a5c37','#507840','#6b9049','#8eab5d', // 6-10 grass: shadow, dark, mid, light, highlight
  '#584738','#7b6448','#9d8763', // 11-13 dirt path
  '#45444e','#67666f','#8d8b90', // 14-16 rock
  '#1d3227','#2a4a30','#3d683b','#5a8a47', // 17-20 tree crown
  '#3e2c22', // 21 trunk
  '#5a2e2c','#82423a','#a65f49', // 22-24 roof
  '#958670','#c5b593', // 25-26 wall
  '#ffd884','#f0a050', // 27-28 lamp light, warm glow
  '#2a2a33', // 29 iron
  '#b3adb2','#7f7b84']; // 30-31 tower stone light, stone
const PAL=Uint32Array.from(PAL_HEX,U),NPAL=PAL.length;
const PI_={outline:0,wat:1,marsh:4,grass:6,dirt:11,rock:14,tree:17,trunk:21,roof:22,wall:25,lamp:27,glow:28,iron:29,stone:30};
// one step darker for cloud shadows (D2) and slope shading; index -> index
const SHADE=Uint8Array.from([0, 0,1,2, 4,4, 6,6,7,8,9, 11,11,12, 14,14,15, 17,17,18,19, 21, 22,22,23, 25,25, 28,28, 29, 31,14]);
// one step lighter (sunlit slopes); index -> index
const LIGHT=Uint8Array.from([0, 2,3,3, 5,5, 7,8,9,10,10, 12,13,13, 15,16,16, 18,19,20,20, 21, 23,24,24, 26,26, 27,27, 29, 30,30]);
// emissive entries keep their colour at night and glow through fog
const EMIT=new Uint8Array(NPAL);EMIT[27]=1;EMIT[28]=1;
// fog colours: desaturated sky hue of the hour (H1). Day is a cool lavender grey, not neutral grey.
const FOG_HEX={day:'#c4c8d8',dawn:'#d9ccd0',dusk:'#a99cb4',night:'#4a5370',grey:'#a0a0a0',lamp:'#f6cf8c'};
// tone sprites default to the fog ramp (TONES[1..5] light -> dark) so sprite()+blit() draw mist shapes
const TONES=Uint32Array.from(['#000000','#e3e5ee','#c4c8d8','#9fa5b9','#7a8199','#565d75'],U);
// RGB helpers on packed colours
const lum=c=>{const a=un32(c);return .299*a[0]+.587*a[1]+.114*a[2];};
const desat=(c,k)=>{const a=un32(c),l=.299*a[0]+.587*a[1]+.114*a[2];return pack(lerp(a[0],l,k),lerp(a[1],l,k),lerp(a[2],l,k));};
const dist2=(a,b)=>{const A=un32(a),B=un32(b),dr=A[0]-B[0],dg=A[1]-B[1],db=A[2]-B[2];return 2*dr*dr+4*dg*dg+3*db*db;};
function nearestIn(pal,c){let bi=0,bd=1e18;for(let i=0;i<pal.length;i++){const d=dist2(pal[i],c);if(d<bd){bd=d;bi=i;}}return bi;}
// night version of the base palette: dark, blue, low saturation; lamps and windows stay lit
function nightPal(base=PAL){return Uint32Array.from(base,(c,i)=>EMIT[i]?c:mulc(desat(c,.45),.36,.42,.66));}
// fog level weights: level k of N moves this far toward the fog colour (C2: value and saturation, few flat bands)
const LVL_T=[0,.2,.38,.56,.74,.9];
// fog ramp: RAMP_F[idx*(N+1)+k] = colour of palette index idx at fog level k (0 = clear). snap: pick the
// nearest colour of `snapPal` instead (strict palette fog). Emissive entries fade slower so lamps read through fog.
function fogRamp(base,fogHex,N=5,snapPal=null){const f=U(fogHex),out=new Uint32Array(base.length*(N+1));
  for(let i=0;i<base.length;i++)for(let k=0;k<=N;k++){let t=LVL_T[Math.round(k*5/N)]??k/N;if(EMIT[i])t*=.45;
    let c=mix32(desat(base[i],t*.55),f,t);if(snapPal)c=snapPal[nearestIn(snapPal,c)];out[i*(N+1)+k]=c;}return out;}
// tileable value-noise fbm table, n x n (n a power of two), values 0..1 after normalising. base = lattice cells across.
function mkTable(n,seed=1,base=4,oct=4,gain=.5){const T=new Float32Array(n*n);let mn=9,mx=-9;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){let v=0,a=1,s=0,p=base;
    for(let o=0;o<oct;o++){const fx=x/n*p,fy=y/n*p,xi=Math.floor(fx),yi=Math.floor(fy),tx=fx-xi,ty=fy-yi,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);
      const h=(i,j)=>hash2(((i%p)+p)%p+seed*131+o*977,((j%p)+p)%p+seed*71);
      const A=h(xi,yi),B=h(xi+1,yi),C=h(xi,yi+1),D=h(xi+1,yi+1);v+=a*(A+(B-A)*sx+(C-A)*sy+(A-B-C+D)*sx*sy);s+=a;a*=gain;p*=2;}
    v/=s;T[y*n+x]=v;if(v<mn)mn=v;if(v>mx)mx=v;}
  for(let i=0;i<T.length;i++)T[i]=(T[i]-mn)/(mx-mn);return T;}
// nearest lookup with wrap (n power of two)
const tabAt=(T,n,x,y)=>T[((y|0)&(n-1))*n+((x|0)&(n-1))];
// procedural value fbm (per-pixel maths, the expensive comparison)
function fbmP(x,y,oct){let v=0,a=.5,s=0;for(let o=0;o<oct;o++){v+=a*vnoise(x,y);s+=a;x=x*2+17.3;y=y*2+5.1;a*=.5;}return v/s;}
// smoothed cost meter around performance.now(): m.t0(); ...; m.t1() -> smoothed ms
function meter(k=.08){let s=-1,t=0;return {t0(){t=performance.now();},t1(){const d=performance.now()-t;s=s<0?d:s+(d-s)*k;return s;},get v(){return Math.max(0,s);}};}
const fms=v=>v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);
// §6a measured figures (ms, Apple M4 Pro, Chromium, blended full-screen pass) for figure labels
const GPU6A={tex1:[.0008,.0099],tex2:[.001,.012],tex3:[.0012,.014],warpTex:[.0013,.014],height:[.0011,.013],bayer:[.0018,.016],fbm1:[.0029,.019],fbm4:[.0054,.065],simplex4:[.0125,.133],
  god8:[.0031,.021],god16:[.0064,.036],god32:[.0068,.07],god64:[.0112,.141],four:[.0032,.04],fetch:[.0015,.011]};

// ----------------------------------------------------------------------
// The highland scene (shared by the hero and several figures).
// mkHighland(W,H,seed) -> {W,H,idx,h,lamps,houses,tower,trees,path,walk}
//   idx: Uint8Array palette index per pixel; h: Float32Array height 0..1 per pixel,
//   with objects (tree crowns, roofs, the tower) raised so they rise out of pooled fog.
//   lamps: [{x,y}] light points (lamp heads, lit windows marked win:1).
// ----------------------------------------------------------------------
function mkHighland(W,H,seed=3,o={}){const N=W*H,idx=new Uint8Array(N),h=new Float32Array(N),hg=new Float32Array(N),obj=new Uint8Array(N);
  const S=Math.min(W/320,H/180),sc=1/Math.max(.5,S);
  const vy=x=>H*(.66+.09*Math.sin(x/W*3.3+.7+seed*.3)); // valley floor line
  const stream=x=>vy(x)+H*.012*Math.sin(x*.09*sc);
  const tower=o.tower||{x:Math.round(W*.79),y:Math.round(H*.24)};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;
    const dv=Math.abs(y-vy(x))/H;let e=.1+dv*1.15;
    e+=.36*Math.exp(-(((x-tower.x)/W)**2/.03+((y-tower.y)/H)**2/.05));
    e+=.2*(fbmP(x*sc/26+seed*7,y*sc/26,3)-.5);
    if(y<H*.12)e+=(H*.12-y)/H*.8;
    hg[i]=clamp(e,0,1);}
  // path: village (left) -> valley ford -> up to the tower
  const P=[[.04,.36],[.16,.4],[.3,.52],[.42,.63],[.52,.66],[.6,.57],[.67,.48],[.73,.4],[tower.x/W,(tower.y+11)/H]].map(([a,b])=>[a*W,b*H]);
  const pathD=new Float32Array(N).fill(99);
  for(let k=0;k<P.length-1;k++){const [ax,ay]=P[k],[bx,by]=P[k+1],L=Math.hypot(bx-ax,by-ay);
    for(let s=0;s<=L;s+=.5){const px=ax+(bx-ax)*s/L+1.5*Math.sin((ay+s)*.2),py=ay+(by-ay)*s/L;
      for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const X=Math.round(px+dx),Y=Math.round(py+dy);if(X<0||Y<0||X>=W||Y>=H)continue;const d=Math.hypot(dx,dy);const j=Y*W+X;if(d<pathD[j])pathD[j]=d;}}}
  const pw=Math.max(1.2,1.8*S);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,e=hg[i],r=hash2(x*3+seed,y*5),n2=fbmP((x*.8+y*.6)*sc/7+seed*3,(y*.8-x*.6)*sc/7,2);
    // slope light from the top-left (3/4 view relief)
    const e1=hg[Math.max(0,y-1)*W+Math.max(0,x-1)],sl=(e-e1)*60*sc;
    let c;const ds=Math.abs(y-stream(x));
    if(ds<1.4*Math.max(1,S*1.4)+.6*Math.sin(x*.3)){c=ds<.6?2:1;if(((x+y*3)&7)===0&&ds<1)c=3;}
    else if(e<.2&&fbmP(x*sc/14,y*sc/10+seed,3)>.52)c=n2>.5?5:4;
    else if(pathD[i]<pw){c=pathD[i]<pw-.9?(n2>.62?13:12):11;}
    else if(e>.8&&n2>.42){c=n2>.62?15:14;}
    else{c=e<.26?(n2>.58?10:9):e<.44?(n2>.6?9:8):e<.64?(n2>.56?8:7):(n2>.5?7:6);if(r<.012)c=LIGHT[c];}
    if(c>=6&&c<=16&&c!==11&&c!==12&&c!==13){if(sl>.9)c=LIGHT[c];else if(sl<-.9)c=SHADE[c];}
    idx[i]=c;h[i]=e;}
  const put=(x,y,c,dh)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;idx[i]=c;if(dh!==undefined){h[i]=Math.max(h[i],dh);obj[i]=1;}};
  const free=(x,y,r)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)return false;const j=Y*W+X;if(obj[j]||pathD[j]<pw+2||idx[j]<=5)return false;}return true;};
  // houses at the village edge
  const houses=[],lamps=[];
  const HS=o.houses||[[.1,.27],[.2,.31],[.07,.47]];
  for(const [hx,hy] of HS){const x0=Math.round(hx*W),y0=Math.round(hy*H),w=13,hh=11,base=hg[clamp(y0,0,H-1)*W+clamp(x0,0,W-1)];houses.push({x:x0,y:y0});
    for(let x=-1;x<=w+1;x++){put(x0+x+2,y0+2,SHADE[idx[clamp(y0+2,0,H-1)*W+clamp(x0+x+2,0,W-1)]]||6);}
    for(let y=-4;y<=0;y++)for(let x=0;x<w;x++)put(x0+x,y0+y,(x===0||x===w-1)?25:26,base+.2);
    for(let y=-hh;y<-4;y++){const r=y+hh;for(let x=-1;x<=w;x++){const inset=Math.max(0,3-r);if(x<inset-1||x>w-inset)continue;put(x0+x,y0+y,r===0?22:x<w/2?24:23,base+.28);}}
    put(x0+3,y0-1,0,base+.2);put(x0+3,y0,0,base+.2);put(x0+4,y0-1,0,base+.2);put(x0+4,y0,0,base+.2);// door
    put(x0+8,y0-3,27,base+.2);put(x0+9,y0-3,27,base+.2);put(x0+8,y0-2,28,base+.2);put(x0+9,y0-2,28,base+.2);// window
    lamps.push({x:x0+8.5,y:y0-2.5,win:1});}
  // lamp posts along the path into the valley
  const LP=o.lamps||[[.27,.47],[.45,.6],[.6,.6],[.13,.39]];
  for(const [lx,ly] of LP){const x=Math.round(lx*W),y=Math.round(ly*H),b=hg[clamp(y,0,H-1)*W+clamp(x,0,W-1)];
    for(let k=0;k<6;k++)put(x,y-k,29,b+.12);put(x+1,y,6);put(x-1,y-6,29,b+.14);put(x+1,y-6,29,b+.14);put(x,y-7,29,b+.14);put(x,y-6,27,b+.14);put(x-1,y-5,28,b+.13);put(x+1,y-5,28,b+.13);
    lamps.push({x,y:y-6});}
  // the watchtower on the ridge
  {const x0=tower.x-5,yb=tower.y+8,b=hg[clamp(tower.y,0,H-1)*W+clamp(tower.x,0,W-1)];
    for(let x=0;x<12;x++)put(x0+x+2,yb+1,SHADE[idx[clamp(yb+1,0,H-1)*W+clamp(x0+x+2,0,W-1)]]);
    for(let y=0;y<22;y++)for(let x=0;x<10;x++){let c=x<3?30:x>7?14:31;if(((y+(x>>1))%5)===0&&x>0&&x<9)c=SHADE[c];put(x0+x,yb-y,c,b+.35+y*.01);}
    for(let x=-1;x<11;x++)for(let y=22;y<25;y++){if(y===24&&(x&1))continue;put(x0+x,yb-y,y===22?14:x<3?30:31,b+.6);}
    put(x0+4,yb-14,0,b+.5);put(x0+5,yb-14,0,b+.5);put(x0+4,yb-13,27,b+.5);put(x0+5,yb-13,27,b+.5);put(x0+4,yb,0,b+.4);put(x0+5,yb,0,b+.4);put(x0+4,yb-1,0,b+.4);put(x0+5,yb-1,0,b+.4);
    lamps.push({x:x0+4.5,y:yb-13.5,win:1});}
  // trees on the slopes: a jittered grid, crown in 4 shades, trunk, ground shadow
  const trees=[],G=o.treeGrid||11;
  for(let gy=0;gy<H/G+1;gy++)for(let gx=0;gx<W/G+1;gx++){const r=hash2(gx*17+seed,gy*29),x=Math.round((gx+.5+(hash2(gx,gy+seed)-.5)*.8)*G),y=Math.round((gy+.5+(hash2(gx+seed,gy)-.5)*.8)*G);
    if(x<4||y<10||x>=W-4||y>=H-1)continue;const e=hg[y*W+x];if(e<.3||e>.74||r<.35)continue;if(!free(x,y,4))continue;
    if(Math.hypot(x-tower.x,y-tower.y)<16)continue;trees.push({x,y,e});}
  trees.sort((a,b)=>a.y-b.y);
  for(const t of trees){const {x,y,e}=t;
    for(let dx=-3;dx<=4;dx++)put(x+dx,y+1,SHADE[idx[clamp(y+1,0,H-1)*W+clamp(x+dx,0,W-1)]]);
    put(x,y,21,e+.05);put(x,y-1,21,e+.06);
    for(let dy=-10;dy<=-2;dy++)for(let dx=-4;dx<=4;dx++){const ny=(dy+6)/4.6,nx=dx/4.4;const d=nx*nx+ny*ny;if(d>1)continue;
      const lit=(-dx*.5-(dy+6)*.6)/4.4+hash2(x+dx,y+dy)*.35;const c=d>.78?17:lit>.55?20:lit>.05?19:18;put(x+dx,y+dy,c,e+.22+(1-d)*.08);}}
  // walk loop for a traveller: along the path in the valley
  const walk=P.slice(1,6);
  return {W,H,idx,h,lamps,houses,tower,trees,path:P,walk,stream};}
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
