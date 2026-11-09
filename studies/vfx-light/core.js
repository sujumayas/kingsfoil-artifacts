"use strict";
// ======================================================================
// core: helpers, flash guard, the Light Sandbox's sky / flicker / light
// types, a factory port of the Sandbox village (albedo x light map,
// sun projection with roof/crown remap, polar 256-ray shadows with the
// height rule and caching, interior sun patches, water glints, three
// compose styles), demo runner and page chrome.
// Algorithms and constants are ported from vfx-light-sandbox.html.
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
// Sky: the Sandbox's sun/moon model, by hour or by an explicit elevation
// ----------------------------------------------------------------------
const NIGHTA=[.10,.12,.24],TWIA=[.34,.28,.44],GOLDA=[.46,.42,.54],DAYA=[.5,.56,.7];
const lerp3=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
function skyEl(el,az,mel,maz,overcast,cap){let amb,sun,dir=null,len=0;cap=cap||4;
  if(el>20){amb=DAYA;sun=[1.02,.98,.9];}else if(el>6){const k=(el-6)/14;amb=lerp3(GOLDA,DAYA,k);sun=lerp3([1.05,.72,.42],[1.02,.98,.9],k);}
  else if(el>0){const k=el/6;amb=lerp3(TWIA,GOLDA,k);sun=lerp3([.9,.42,.24],[1.05,.72,.42],k);}else if(el>-8){const k=(el+8)/8;amb=lerp3(NIGHTA,TWIA,k);sun=[0,0,0];}else{amb=NIGHTA;sun=[0,0,0];}
  let moon=false;
  if(el>0){dir=[-Math.sin(az),Math.cos(az)];len=Math.min(cap,1/Math.tan(Math.max(4,el)*Math.PI/180))*.62;}
  else if(mel>4){sun=[.16,.19,.32];dir=[-Math.sin(maz),Math.cos(maz)];len=Math.min(3,1/Math.tan(mel*Math.PI/180))*.62;moon=true;}
  if(overcast){sun=[0,0,0];amb=el>0?lerp3([.36,.36,.44],[.82,.84,.88],Math.min(1,el/25)):amb.map(v=>v*.8);dir=null;}
  return {el,mel,amb,sun,dir,len,moon,svy:dir?-dir[1]:0,svx:dir?-dir[0]:0};}
const sunEl=h=>62*Math.sin((h-6)/12*Math.PI), moonEl=h=>40*Math.sin((h-18)/12*Math.PI);
function sky(h,overcast,cap){return skyEl(sunEl(h),(90+(h-6)/12*180)*Math.PI/180,moonEl(h),(90+(h-18)/12*180)*Math.PI/180,overcast,cap);}
const tfsLight=m=>m<360||m>=1200?40:m<480?40+210*(m-360)/120:m<1080?250:250-210*(m-1080)/120;   // TFS world light by minute

// ----------------------------------------------------------------------
// Light types and flicker models (Sandbox TYPES and flicker())
// ----------------------------------------------------------------------
const TYPES={torch:{col:'#ff8c3a',R:46,h:10,fl:'fire',sh:1},campfire:{col:'#ff7030',R:58,h:4,fl:'camp',sh:1},candle:{col:'#ffb35a',R:20,h:6,fl:'candle',sh:1},lantern:{col:'#ffc870',R:40,h:9,fl:'lantern',sh:1},
  lamp:{col:'#ffd9a0',R:54,h:16,fl:'lamp',sh:1},fireplace:{col:'#ff7a34',R:48,h:6,fl:'camp',sh:1},brazier:{col:'#ff5a2a',R:46,h:8,fl:'fire',sh:1},magic:{col:'#7ae6ff',col2:'#b48cff',R:44,h:10,fl:'magic',sh:1},
  rune:{col:'#dfe8ff',R:40,h:12,fl:'rune',sh:1},mushroom:{col:'#5cffc8',R:13,h:2,fl:'breath',sh:0},firefly:{col:'#d6ff6a',R:7,h:6,fl:'blink',sh:0},bulb:{col:'#ffd27a',R:9,h:8,fl:'lamp',sh:0},
  orb:{col:'#bfe0ff',R:50,h:16,fl:'steady',sh:1},house:{col:'#ffb860',R:46,h:8,fl:'candle',sh:1}};
for(const k in TYPES){TYPES[k].c=hexf(TYPES[k].col);if(TYPES[k].col2)TYPES[k].c2=hexf(TYPES[k].col2);}
function flickerOf(fl,t,s){switch(fl){
  case 'fire':return .82+.18*n1(t*9,s)-(.12*Math.max(0,n1(t*3.1,s+5)-.75)*4);case 'camp':return .78+.22*n1(t*7,s)*n1(t*2.3,s+3)+.06*Math.sin(t*1.3+s);
  case 'candle':return .95+.03*n1(t*1.5,s)-(hash2((t*3)|0,s)<.02?.22*n1(t*20,s+2):0);case 'lantern':return .95+.03*n1(t*4,s);case 'lamp':return .97+.02*n1(t*2,s);
  case 'magic':return .72+.28*Math.sin(t*Math.PI*.9+s);case 'rune':return (hash2((t*12)|0,s)<.04||hash2((t*12)|0,s+1)<.02)?.08:1;
  case 'breath':return .55+.45*Math.sin(t*1.2+s);case 'blink':return Math.pow(Math.max(0,Math.sin(t*1.7+s)),6);default:return 1;}}

// ----------------------------------------------------------------------
// Characters (Sandbox 7x12 walker)
// ----------------------------------------------------------------------
const PF=["..hhh..",".hhhhh.",".HHHHH.",".seses.",".sssss.","yccCccy","ccccccc","ccccccc",".CcccC."],PB=["..hhh..",".hhhhh.",".HHHHH.",".hhhhh.",".sssss.","ccccccc","ccccccc","ccccccc",".CcccC."],PS=["..hhh..",".hhhhh.",".HHHHH.","..ssse.","..ssss.",".cccc..","ccccc..",".cccc..",".CccC.."];
const LF=[[".ll.ll.",".ll.ll.",".bb.bb."],[".ll.ll.","..l.ll.","..b.bb."],[".ll.ll.",".ll.l..",".bb.b.."]],LS=[["..ll...","..ll...","..bbb.."],[".l..l..",".l...l.","bb...bb"],["..ll...",".ll....",".bb...."]];
function charRows(c){const fr=c.moving?[0,1,0,2][(c.anim|0)%4]:0;if(c.dir==='down')return [PF.concat(LF[fr]),false];if(c.dir==='up')return [PB.concat(LF[fr]),false];return [PS.concat(LS[fr]),c.dir==='left'];}
function moveC(c,vx,vy,dt,blocked){const nx=c.x+vx*dt,ny=c.y+vy*dt;let mx=0,my=0;if(!blocked||!blocked(nx,c.y)){mx=nx-c.x;c.x=nx;}if(!blocked||!blocked(c.x,ny)){my=ny-c.y;c.y=ny;}c.moving=Math.abs(mx)+Math.abs(my)>.001;
  if(c.moving){c.anim+=dt*8;if(Math.abs(vx)>Math.abs(vy))c.dir=vx>0?'right':'left';else c.dir=vy>0?'down':'up';}else c.anim=0;}

// ======================================================================
// The Sandbox village as a factory: mkVillage() -> world with update/render
// ======================================================================
const VW=320,VH=180;
const GROUND=0,WALLF=1,ROOF=2,CANOPY=3,OBJ=4,WATER=5,INTER=6,WIN=7;
function mkVillage(seed){
  const W=VW,H=VH,NP=W*H;let rq=seed||777;const rnd=()=>{rq^=rq<<13;rq^=rq>>>17;rq^=rq<<5;return (rq>>>0)/4294967296;};
  const BASE=[];const C=h=>{BASE.push(h);return BASE.length-1;};const mk=a=>a.map(C);
  const GR=mk(['#5f8f48','#6ea052','#4f7d3e','#82b25e']),FLW=mk(['#e8e4f0','#f2d15c']),DI=mk(['#a07e58','#8c6c4a']),CO=mk(['#aaa69c','#949087','#6e6a63']);
  const WA=mk(['#3e7aa6','#4a8cb8','#2c5e86']),SHORE=C('#c9b88a');
  const PL=mk(['#dccca8','#c4b392']),TIMB=C('#6a4a32'),DOOR=C('#4a3222'),GLASS=C('#7fa6c8'),WINLIT=C('#ffcf6a');
  const RFA=mk(['#a04a3a','#883c30','#5e2a24']),RFB=mk(['#4a6a9a','#3c5880','#283c5a']);
  const FLOOR=mk(['#9a7448','#86643c','#6a4e30']),BED=mk(['#c84a4a','#e8e0d0']),TABLE=C('#7a5634'),STONE=mk(['#8a8680','#6a6660','#4e4a46']),RUG=mk(['#5a4a8a','#c8a84a']);
  const CAN=mk(['#6aa856','#4f8f46','#3f7a3c','#2e5e30']),TRUNK=mk(['#6a4a32','#4e3624']),ROCK=mk(['#9a968e','#7a766e','#5a5650']);
  const BAR=mk(['#9a6a3e','#7a5230']),HOOP=C('#5a5a62'),FENCE=mk(['#a07a52','#7a5a3a']),POST=C('#3a3a44'),LAMPOFF=C('#c8c0a8'),LAMPON=C('#fff0c0');
  const OBEL=mk(['#d0c8b8','#aaa294','#807868']),CRYS=mk(['#9af0ff','#4ac8e8']),CRYSB=C('#3a5a6a'),MUSH=C('#5cffc8'),STEM=C('#d8e8e0');
  const FIRE=mk(['#fff0a0','#ffb040','#ff6a2a']),LOG=C('#6a4a32'),BRAZ=C('#4a4a52'),BULB=C('#ffd27a'),WIRE=C('#2a2a2a'),FFLY=C('#e8ff7a');
  const SKIN=C('#f0c09a'),EYE=C('#2a1b22'),HAT=C('#c8443c'),HATB=C('#efe6dc'),COAT=C('#3c6fb4'),COAT2=C('#2f5592'),LEG=C('#2a2c3a'),BOOT=C('#5a3a28');
  const ROBE=C('#6a5aa0'),ROBE2=C('#4e4280'),HOOD=C('#4a3a6a'),ORB=C('#d8ecff'),RUNE=C('#e8f0ff');
  const N=BASE.length,RGB=new Float32Array(N*3);BASE.forEach((h,i)=>{RGB[i*3]=parseInt(h.slice(1,3),16);RGB[i*3+1]=parseInt(h.slice(3,5),16);RGB[i*3+2]=parseInt(h.slice(5,7),16);});
  const EMIS=new Uint8Array(N);[...FIRE,WINLIT,LAMPON,...CRYS,MUSH,BULB,FFLY,ORB,RUNE].forEach(i=>EMIS[i]=1);
  const CMAP=new Uint32Array(N*16);for(let i=0;i<N;i++)for(let l=0;l<16;l++){const k=l/10;let r=RGB[i*3]*k,g=RGB[i*3+1]*k,b=RGB[i*3+2]*k;if(k<.7){const w=(.7-k)/.7;r*=1-.28*w;g*=1-.2*w;b*=1+.25*w;}else if(k>1){r*=1.04;b*=.9;}
    CMAP[i*16+l]=pack(r,g,b);}
  function newMaps(){return {IDX:new Uint16Array(NP),CLS:new Uint8Array(NP),OB:new Int16Array(NP),IN:new Uint8Array(NP)};}
  const MOUT=newMaps(),MIN=newMaps();const OCC=new Uint8Array(NP),MV=new Uint8Array(NP),HOUSE=new Uint8Array(NP);
  function put(M,x,y,idx,cls,ob){if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;M.IDX[i]=idx;M.CLS[i]=cls;M.OB[i]=ob;}
  function both(fn){fn(MOUT);fn(MIN);}
  function occ(x,y,h,mv=true){if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;OCC[i]=Math.max(OCC[i],h);if(mv)MV[i]=1;}
  both(M=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/12,y/12)*.6+vnoise(x/4,y/4)*.4,h=hash2(x,y);let c=n<.36?GR[2]:n<.62?GR[0]:GR[1];if(h<.05)c=GR[3];if(h>.994)c=FLW[(h*1e3|0)%2];put(M,x,y,c,GROUND,y);}});
  const pathPts=[[60,82,60,140],[60,100,120,100],[230,96,276,66],[226,128,260,140]];
  both(M=>{for(const [x0,y0,x1,y1] of pathPts){const L=Math.hypot(x1-x0,y1-y0);for(let s=0;s<=L;s+=.5){const x=x0+(x1-x0)*s/L,y=y0+(y1-y0)*s/L;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){if(dx*dx+dy*dy>14+hash2(x+dx|0,y+dy|0)*6)continue;const px=(x+dx)|0,py=(y+dy)|0;put(M,px,py,hash2(px,py)<.3?DI[1]:DI[0],GROUND,py);}}}});
  both(M=>{for(let y=72;y<=132;y++)for(let x=118;x<=230;x++){const row=((y-72)/5)|0,off=(row&1)*3,j=(x+off)%7===0||(y-72)%5===0;put(M,x,y,j?CO[2]:(hash2(((x+off)/7)|0,row)<.4?CO[1]:CO[0]),GROUND,y);}});
  const POND=new Uint8Array(NP);both(M=>{for(let y=124;y<H;y++)for(let x=226;x<W;x++){const dx=(x-272)/42,dy=(y-150)/20,r=dx*dx+dy*dy;if(r<1){put(M,x,y,r>.82?WA[1]:r<.4?WA[2]:WA[0],WATER,y);POND[y*W+x]=1;MV[y*W+x]=1;}else if(r<1.18)put(M,x,y,SHORE,GROUND,y);}});
  // house A (enterable): walls of height 30 with door and window gaps
  let gapsOn=true;const isGapA=(x,y)=>(y>=79&&((x>=56&&x<=63)||(x>=30&&x<=40)||(x>=80&&x<=90)))||((x<=21||x>=99)&&y>=52&&y<=60);
  const GAPPX=[];
  for(let y=40;y<=80;y++)for(let x=20;x<=100;x++){const wall=x<=21||x>=99||y<=41||y>=79;if(!wall)continue;const door=y>=79&&x>=56&&x<=63;const win=isGapA(x,y)&&!door;
    if(door)continue;if(win){MV[y*W+x]=1;HOUSE[y*W+x]=1;GAPPX.push([y*W+x,30]);continue;}occ(x,y,30);}
  for(let y=18;y<=62;y++)for(let x=18;x<=102;x++){let b=((y-18)%4===3)?RFA[1]:RFA[0];if(((x+((y>>2)&1)*3)%6)===0&&b===RFA[0])b=RFA[1];if(y===18||y===62||x===18||x===102)b=RFA[2];put(MOUT,x,y,b,ROOF,80);}
  for(let y=63;y<=80;y++)for(let x=20;x<=100;x++){let b=PL[0],cls=WALLF;if(x===20||x===100||y===63||y===80||(x-20)%20===0)b=TIMB;else if(hash2(x,y)<.2)b=PL[1];
    if(x>=56&&x<=63&&y>=68){b=(x===56||x===63||y===68)?TIMB:DOOR;}for(const wx of [30,80])if(x>=wx&&x<=wx+10&&y>=67&&y<=75){b=(x===wx||x===wx+10||y===67||y===75||x===wx+5)?TIMB:GLASS;if(b===GLASS){cls=WIN;HOUSE[y*W+x]=1;}}put(MOUT,x,y,b,cls,80);}
  for(let y=40;y<=80;y++)for(let x=20;x<=100;x++){const i=y*W+x;const wall=x<=21||x>=99||y<=41||y>=79;
    if(wall){const gap=isGapA(x,y);const door=y>=79&&x>=56&&x<=63;put(MIN,x,y,door?FLOOR[1]:gap?GLASS:(y<=41?STONE[0]:TIMB),door?INTER:OBJ,y);if(door)MIN.IN[i]=1;continue;}
    put(MIN,x,y,(y%4===0)?FLOOR[2]:(((x+(y>>2)*5)%11===0)?FLOOR[1]:FLOOR[0]),INTER,y);MIN.IN[i]=1;}
  for(let y=34;y<=39;y++)for(let x=20;x<=100;x++)put(MIN,x,y,y===34?STONE[2]:STONE[(x+y)%3===0?1:0],WALLF,41);
  for(let y=36;y<=46;y++)for(let x=52;x<=66;x++){const inner=x>=55&&x<=63&&y>=40;put(MIN,x,y,inner?STONE[2]:STONE[(x+y)%4===0?1:0],inner?INTER:OBJ,46);MIN.IN[y*W+x]=1;if(!inner&&y>=42)occ(x,y,8);}
  for(let y=44;y<=56;y++)for(let x=25;x<=39;x++){put(MIN,x,y,y<=47?BED[1]:BED[0],OBJ,56);MIN.IN[y*W+x]=1;occ(x,y,6);}
  for(let y=62;y<=73;y++)for(let x=44;x<=72;x++){put(MIN,x,y,(x===44||x===72||y===62||y===73)?RUG[1]:RUG[0],INTER,y);}
  for(let y=56;y<=63;y++)for(let x=74;x<=86;x++){put(MIN,x,y,y===63?FLOOR[2]:TABLE,OBJ,63);occ(x,y,5);}
  // house B (exterior only), walls 34
  const isGapB=(x,y)=>y>=63&&((x>=250&&x<=260)||(x>=288&&x<=298)||(x>=270&&x<=278));
  for(let y=30;y<=64;y++)for(let x=238;x<=310;x++){const wall=x<=239||x>=309||y<=31||y>=63;MV[y*W+x]=1;if(!wall)continue;if(isGapB(x,y)){HOUSE[y*W+x]=2;GAPPX.push([y*W+x,34]);continue;}occ(x,y,34);}
  both(M=>{for(let y=12;y<=48;y++)for(let x=236;x<=312;x++){let b=((y-12)%4===3)?RFB[1]:RFB[0];if(((x+((y>>2)&1)*3)%6)===0&&b===RFB[0])b=RFB[1];if(y===12||y===48||x===236||x===312)b=RFB[2];put(M,x,y,b,ROOF,64);}
    for(let y=49;y<=64;y++)for(let x=238;x<=310;x++){let b=PL[0],cls=WALLF;if(x===238||x===310||y===49||y===64||(x-238)%18===0)b=TIMB;else if(hash2(x,y)<.2)b=PL[1];
      if(x>=270&&x<=278&&y>=54){b=(x===270||x===278||y===54)?TIMB:DOOR;}for(const wx of [250,288])if(x>=wx&&x<=wx+10&&y>=53&&y<=60){b=(x===wx||x===wx+10||y===53||y===60||x===wx+5)?TIMB:GLASS;if(b===GLASS){cls=WIN;HOUSE[y*W+x]=2;}}put(M,x,y,b,cls,64);}});
  for(let x=270;x<=278;x++)MV[64*W+x]=1;
  const TREES=[[150,46],[205,40],[108,108],[26,116],[306,112],[218,172],[140,170]];
  function tree(tx,ty){both(M=>{for(let y=ty-5;y<=ty;y++)for(let x=tx-1;x<=tx+1;x++)put(M,x,y,x===tx+1?TRUNK[1]:TRUNK[0],OBJ,ty);
    for(let y=ty-28;y<=ty-4;y++)for(let x=tx-13;x<=tx+13;x++){const dx=(x-tx)/12.5,dy=(y-(ty-16))/11,r=dx*dx+dy*dy;if(r>1+vnoise(x*.4,y*.4)*.3-.15)continue;const sh=dx+dy*.8;put(M,x,y,sh<-.5?CAN[0]:sh<.1?CAN[1]:sh<.6?CAN[2]:CAN[3],CANOPY,ty);}});
    for(let y=ty-1;y<=ty;y++)for(let x=tx-2;x<=tx+2;x++)occ(x,y,22);}
  TREES.forEach(([x,y])=>tree(x,y));
  function rock(cx,cy){both(M=>{for(let y=cy-4;y<=cy+3;y++)for(let x=cx-6;x<=cx+6;x++){const dx=(x-cx)/6.5,dy=(y-cy)/4;if(dx*dx+dy*dy<1){put(M,x,y,y<cy?(x<cx?ROCK[0]:ROCK[1]):ROCK[2],OBJ,cy+3);}}});for(let x=cx-5;x<=cx+5;x++)for(let y=cy;y<=cy+3;y++)occ(x,y,7);}
  rock(96,132);rock(250,100);rock(18,170);
  function barrel(cx,cy){both(M=>{for(let y=cy-9;y<=cy;y++)for(let x=cx-3;x<=cx+3;x++)put(M,x,y,(y===cy-7||y===cy-2)?HOOP:(x<cx?BAR[0]:BAR[1]),OBJ,cy);});for(let x=cx-3;x<=cx+3;x++)for(let y=cy-2;y<=cy;y++)occ(x,y,9);}
  barrel(106,78);barrel(113,82);barrel(232,62);
  both(M=>{for(let y=74;y<=102;y++)for(let x=171;x<=177;x++){const top=y<77;const hw=top?3-(77-y):3;if(Math.abs(x-174)>hw)continue;put(M,x,y,x<174?OBEL[0]:x===174?OBEL[1]:OBEL[2],OBJ,102);}});for(let y=100;y<=102;y++)for(let x=171;x<=177;x++)occ(x,y,28);
  both(M=>{for(let x=8;x<=112;x++){for(let y=154;y<=160;y++){const post=(x-8)%13<2;if(!post&&y!==156&&y!==158)continue;put(M,x,y,post?FENCE[1]:FENCE[0],OBJ,160);}}});for(let x=8;x<=112;x++)for(let y=159;y<=160;y++)occ(x,y,5);
  const LAMPS=[[122,76],[226,76],[122,130],[226,130]];
  both(M=>{for(const [lx,ly] of LAMPS){for(let y=ly-14;y<=ly;y++)put(M,lx,y,POST,OBJ,ly);put(M,lx-1,ly-15,POST,OBJ,ly);put(M,lx+1,ly-15,POST,OBJ,ly);put(M,lx,ly-16,POST,OBJ,ly);}});for(const [lx,ly] of LAMPS)occ(lx,ly,3);
  both(M=>{for(let y=68;y<=74;y++)for(let x=280;x<=288;x++){if(y<70&&(x===280||x===288))continue;put(M,x,y,y<=69?BRAZ:(x===284?BRAZ:POST),OBJ,74);}
    for(let k=0;k<10;k++){const a=k/10*6.283;put(M,Math.round(58+Math.cos(a)*6),Math.round(140+Math.sin(a)*3.5),STONE[k%2],OBJ,143);}for(let x=55;x<=61;x++)put(M,x,141,LOG,OBJ,141);
    for(let y=150;y<=164;y++)for(let x=176;x<=184;x++){const hw=y<154?(y-150):4;if(Math.abs(x-180)>hw)continue;put(M,x,y,y<157?(x<180?CRYS[0]:CRYS[1]):CRYSB,OBJ,164);}
    for(const [mx,my] of [[210,174],[214,176],[224,175],[228,173],[219,177]]){put(M,mx,my,STEM,OBJ,my);put(M,mx-1,my-1,MUSH,OBJ,my);put(M,mx,my-1,MUSH,OBJ,my);put(M,mx+1,my-1,MUSH,OBJ,my);put(M,mx,my-2,MUSH,OBJ,my);}});
  for(let y=72;y<=74;y++)for(let x=280;x<=288;x++)occ(x,y,8);for(let x=52;x<=64;x++)for(let y=138;y<=143;y++)MV[y*W+x]=1;for(let x=176;x<=184;x++)for(let y=162;y<=164;y++)occ(x,y,14);
  for(let i=0;i<NP;i++)if(OCC[i]>0)MV[i]=MV[i]||1;for(let x=56;x<=63;x++){MV[79*W+x]=0;MV[80*W+x]=0;}
  for(let y=42;y<=78;y++)for(let x=22;x<=98;x++){const i=y*W+x;if(OCC[i]===0)MV[i]=0;}
  const OCCD=new Uint8Array(NP);
  // ---- lights ----
  const RMAX=64,LW=RMAX*2+1,ANG=new Uint8Array(LW*LW),DST=new Float32Array(LW*LW);
  for(let dy=-RMAX;dy<=RMAX;dy++)for(let dx=-RMAX;dx<=RMAX;dx++){const k=(dy+RMAX)*LW+dx+RMAX;DST[k]=Math.hypot(dx,dy);ANG[k]=(Math.round((Math.atan2(dy,dx)/(2*Math.PI))*256)+256)&255;}
  const lights=[];function addLight(type,x,y,o={}){const T=TYPES[type];const L={type,x,y,T,R:T.R,h:T.h,seed:(rnd()*1e4)|0,dist:new Float32Array(256),dirty:true,on:true,I:1,fg:FG(),...o};lights.push(L);return L;}
  const LA=[addLight('fireplace',59,47,{house:'A',indoor:1}),addLight('candle',80,57,{house:'A',indoor:1})];
  const wallT=[addLight('torch',48,82,{wall:[48,70]}),addLight('torch',71,82,{wall:[71,70]})];
  const LB=addLight('house',274,44,{house:'B'});const brazier=addLight('brazier',284,76,{flame:[284,68]});
  const lampL=LAMPS.map(([x,y],k)=>addLight('lamp',x,y+2,{lamp:k,head:[x,y-15],off:k*.35}));
  const camp=addLight('campfire',58,142,{flame:[58,139]});const crystal=addLight('magic',180,166,{});
  const mush=addLight('mushroom',219,178,{night:1});
  const bulbs=[];for(let k=0;k<8;k++){const x=14+k*13+6;bulbs.push(addLight('bulb',x,159,{bulb:[x,152],night:1}));}
  const flies=[];for(let k=0;k<14;k++)flies.push(addLight('firefly',150+rnd()*160,120+rnd()*55,{fly:1,vx:0,vy:0,night:1,z:4+rnd()*8}));
  const npcLight=addLight('lantern',130,120,{carriedNpc:1});
  let carried=null,carryType='none';
  let rayCount=0,rayTotal=0;
  function castRays(L){const lx=L.x,ly=L.y,R=Math.min(RMAX-1,L.R),thr=L.h*.6,start=L.carried?3:1;let steps=0;for(let a=0;a<256;a++){const an=a/256*2*Math.PI,dx=Math.cos(an),dy=Math.sin(an);let d=start;
    for(;d<R;d+=1){const px=(lx+dx*d)|0,py=(ly+dy*d)|0;if(px<0||py<0||px>=W||py>=H)break;const j=py*W+px;if(OCC[j]>=thr||OCCD[j]>=thr)break;}steps+=d;L.dist[a]=d+1.5;}L.dirty=false;rayCount++;rayTotal+=steps;}
  function setGaps(on){if(on===gapsOn)return;gapsOn=on;for(const [i,h] of GAPPX)OCC[i]=on?0:h;for(const L of lights)L.dirty=true;lastSunKey='';}
  // ---- sun ----
  const SH=new Uint8Array(NP),DSH=new Uint8Array(NP),SUNP=new Uint8Array(NP);let lastSunKey='',roofOff=false,sunBuilds=0;
  function sunShadows(S,M,st){SH.fill(0);SUNP.fill(0);sunBuilds++;if(!S.dir||st.sunsh===false)return;const [dx,dy]=S.dir,k=S.len,remap=!st.noRemap;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,cls=M.CLS[i];if(cls===GROUND||cls===WATER||cls===INTER)continue;const ob=M.OB[i],h=ob-y;if(h<=0)continue;if(cls===CANOPY&&st.flecks!==false&&hash2(x*3,y*7)<.08)continue;
      let gy=ob,hh=h;if(remap){if(cls===ROOF){hh=22;gy=y+22;}else if(cls===CANOPY){hh=15;gy=ob+(y-(ob-16))*.6;}}
      const sx=Math.round(x+dx*hh*k),sy=Math.round(gy+dy*hh*k),ext=cls===ROOF?3:2;for(let e=0;e<2;e++)for(let f=0;f<ext;f++){const px=sx+e,py=sy+f;if(px>=0&&py>=0&&px<W&&py<H)SH[py*W+px]=1;}}
    if(roofOff){const lim=Math.min(40,16*k/.62);for(let y=42;y<=78;y++)for(let x=22;x<=98;x++){const i=y*W+x;if(!MIN.IN[i])continue;let lit=0;
      for(let s=1;s<=lim;s++){const px=Math.round(x-dx*s),py=Math.round(y-dy*s);if(px<0||py<0||px>=W||py>=H){lit=1;break;}const j=py*W+px;if(OCC[j]>=20){lit=0;break;}if(px<20||px>100||py<40||py>80){lit=1;break;}}SUNP[i]=lit;}}}
  // ---- characters ----
  const PMAP={h:HAT,H:HATB,s:SKIN,e:EYE,y:HAT,c:COAT,C:COAT2,l:LEG,b:BOOT},NMAP={h:HOOD,H:HOOD,s:SKIN,e:EYE,y:ROBE2,c:ROBE,C:ROBE2,l:ROBE2,b:BOOT};
  const player={x:150,y:112,dir:'down',anim:0,moving:false,tx:null,ty:null};const npc={x:130,y:120,dir:'down',anim:0,moving:false,wp:0,show:true};
  const NWP=[[130,118],[220,118],[220,88],[130,88]];
  function blocked(x,y){x|=0;y|=0;for(let xx=x-2;xx<=x+2;xx++){if(xx<0||xx>=W||y<4||y>=H)return true;if(MV[y*W+xx])return true;}return false;}
  function setCarried(type){carryType=type;if(carried){lights.splice(lights.indexOf(carried),1);carried=null;}if(type&&type!=='none')carried=addLight(type,player.x,player.y,{carried:1});return carried;}
  let houseOn={A:false,B:false};
  const isNightH=h=>sunEl(h)<3;
  function scheduleLights(hour){const night=isNightH(hour);
    for(const L of lampL){L.on=(hour>=18.9+L.off*.5)||(hour<5.6-L.off*.3);}
    const hA=(hour>=18.4||hour<6.4)&&!(hour>=23.4&&hour<24)&&!(hour<5.5),hB=(hour>=18.9||hour<6)&&!(hour>=0.3&&hour<5.8);
    for(const L of LA)L.on=hA||L.type==='fireplace'&&(hour>=17||hour<7);LB.on=hB;houseOn={A:hA,B:hB};for(const L of wallT)L.on=night||hour>=18.5;
    for(const L of [mush,...bulbs,...flies])L.on=night;npcLight.on=night&&npc.show;}
  function update(dt,st){const hour=st.hour;if(st.schedule!==false)scheduleLights(hour);
    if(player.tx!==null&&player.tx!==undefined){const dx=player.tx-player.x,dy=player.ty-player.y,L=Math.hypot(dx,dy);if(L<1.2){player.tx=null;player.moving=false;player.anim=0;}else{moveC(player,dx/L*(st.speed||40),dy/L*(st.speed||40),dt,st.free?null:blocked);if(!player.moving&&!st.free)player.tx=null;}}
    else{player.moving=false;player.anim=0;}
    if(npc.show){const [tx,ty]=NWP[npc.wp];const dx=tx-npc.x,dy=ty-npc.y,l=Math.hypot(dx,dy);if(l<1.5)npc.wp=(npc.wp+1)%NWP.length;else moveC(npc,dx/l*14,dy/l*14,dt,null);}
    npcLight.x=npc.x+(npc.dir==='left'?-4:4);npcLight.y=npc.y+Math.round(Math.sin(npc.anim*.5)*.8);
    if(carried){const sw=player.moving?Math.round(Math.sin(player.anim*.5)):0;if(carryType==='orb'){carried.x+=(player.x-5-carried.x)*Math.min(1,dt*3);carried.y+=(player.y-2-carried.y)*Math.min(1,dt*3);}
      else{carried.x=player.x+(player.dir==='left'?-4:4)+(carryType==='lantern'?sw:0);carried.y=player.y+1;}}
    for(const f of flies){f.vx+=(rnd()-.5)*30*dt;f.vy+=(rnd()-.5)*30*dt;f.vx*=.97;f.vy*=.97;f.x=clamp(f.x+f.vx*dt,140,316);f.y=clamp(f.y+f.vy*dt,110,178);}}
  // ---- render ----
  const LR=new Float32Array(NP),LG=new Float32Array(NP),LBf=new Float32Array(NP),IDX=new Uint16Array(NP),OBF=new Int16Array(NP),CLF=new Uint8Array(NP),INF=new Uint8Array(NP);
  function drawTpl(rows,map,x0,y0,flip,feetY,M){for(let r=0;r<rows.length;r++){const y=y0+r;if(y<0||y>=H)continue;for(let c=0;c<7;c++){const ch=rows[r][flip?6-c:c];if(ch==='.')continue;const x=x0+c;if(x<0||x>=W)continue;const i=y*W+x;
    if(M.OB[i]>feetY&&M.CLS[i]!==GROUND&&M.CLS[i]!==INTER&&M.CLS[i]!==WATER)continue;IDX[i]=map[ch];OBF[i]=feetY;CLF[i]=OBJ;INF[i]=roofOff&&M.IN[(feetY)*W+x]?1:0;}}}
  function drawChar(c,map,M){const x=Math.round(c.x),y=Math.round(c.y);const [rows,flip]=charRows(c);drawTpl(rows,map,x-3,y-rows.length+1,flip,y,M);}
  function putE(x,y,idx,ob,M){x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;if(M&&M.OB[i]>ob&&M.CLS[i]!==GROUND&&M.CLS[i]!==INTER)return;IDX[i]=idx;OBF[i]=ob;CLF[i]=OBJ;}
  const BY=new Uint8Array(NP);for(let y=0;y<H;y++)for(let x=0;x<W;x++)BY[y*W+x]=BAYER[(y&3)*4+(x&3)];
  let frameN=0;
  // st: {hour,t,overcast,mode:'smooth'|'banded'|'colormap',shadows,sunsh,refl,view,roofOff,noRemap,flecks,sunOv:{el,az},cap,noChars,ptMul,ambMul,sunMul,bands}
  function render(out,ow,oh,cx0,cy0,st){const t=st.t||0;frameN++;
    roofOff=st.roofOff!==undefined?st.roofOff:(player.x>21&&player.x<99&&player.y>41&&player.y<81);
    const M=roofOff?MIN:MOUT;let S;
    if(st.sunOv){const el=st.sunOv.el,az=st.sunOv.az*Math.PI/180;S=skyEl(el,az,-90,0,st.overcast,st.cap);}else S=sky(st.hour,st.overcast,st.cap);
    const key=(st.sunOv?st.sunOv.el.toFixed(1)+'/'+st.sunOv.az.toFixed(0):Math.round(st.hour*40))+'_'+roofOff+'_'+st.overcast+'_'+st.sunsh+'_'+st.noRemap+'_'+st.cap+'_'+st.flecks+'_'+gapsOn;
    if(key!==lastSunKey){lastSunKey=key;sunShadows(S,M,st);}
    IDX.set(M.IDX);OBF.set(M.OB);CLF.set(M.CLS);INF.set(M.IN);
    OCCD.fill(0);DSH.fill(0);const chars=st.noChars?[]:(npc.show?[player,npc]:[player]);
    for(const c of chars){for(let dy=-1;dy<=0;dy++)for(let dx=-2;dx<=2;dx++){const px=(c.x|0)+dx,py=(c.y|0)+dy;if(px>=0&&py>=0&&px<W&&py<H)OCCD[py*W+px]=12;}
      if(S.dir&&st.sunsh!==false){for(let h=1;h<=12;h++)for(let dx=-2;dx<=2;dx++){if(h>9&&Math.abs(dx)>1)continue;const px=Math.round(c.x+dx+S.dir[0]*h*S.len),py=Math.round(c.y+S.dir[1]*h*S.len);if(px>=0&&py>=0&&px<W&&py<H)DSH[py*W+px]=1;}}}
    const ents=chars.map(c=>[c.y,()=>drawChar(c,c===player?PMAP:NMAP,M)]);ents.sort((a,b)=>a[0]-b[0]).forEach(e=>e[1]());
    const ft=(frameN>>2)%3;
    const flame=(x,y,ob,big)=>{putE(x,y,FIRE[1],ob,M);putE(x,y-1,FIRE[ft===0?0:1],ob,M);putE(x+(ft===1?1:-1)*(big?1:0),y-2,FIRE[2],ob,M);if(big){putE(x-1,y,FIRE[2],ob,M);putE(x+1,y,FIRE[ft===2?1:2],ob,M);putE(x,y-3,FIRE[ft===0?2:1],ob,M);}};
    if(!roofOff)for(const L of wallT){putE(L.wall[0],L.wall[1]+2,POST,80,null);if(L.on)flame(L.wall[0],L.wall[1],80,false);}
    if(roofOff){flame(59,44,46,true);putE(80,56,STEM,63,M);putE(80,55,FIRE[ft?0:1],63,M);}
    flame(camp.flame[0],camp.flame[1],143,true);flame(brazier.flame[0],brazier.flame[1],74,true);
    for(const L of lampL){putE(L.head[0],L.head[1]+1,L.on?LAMPON:LAMPOFF,L.y-2,M);}
    for(const L of bulbs){const [bx,by]=L.bulb;putE(bx,by,L.on?BULB:LAMPOFF,160,M);}
    for(let k=0;k<8;k++){const x0=8+k*13+1;for(let x=x0;x<x0+13;x++){const tt=(x-x0)/13,y=Math.round(152+Math.sin(tt*Math.PI)*3);putE(x,y,WIRE,160,M);}}
    for(const f of flies){if(!f.on||f.I<.2)continue;putE(f.x,f.y-f.z,FFLY,f.y,null);}
    if(crystal.I>.85&&(frameN&4))putE(180+((frameN>>3)%3)-1,151,ORB,164,M);
    if(carried&&!st.noChars){const cx=carried.x|0,cy=player.y|0;if(carryType==='torch'){putE(cx,cy-5,TRUNK[0],cy+1,null);putE(cx,cy-6,TRUNK[0],cy+1,null);flame(cx,cy-7,cy+1,false);}
      else if(carryType==='lantern'){putE(cx,cy-6,POST,cy+1,null);putE(cx,cy-5,LAMPON,cy+1,null);putE(cx,cy-4,POST,cy+1,null);}else{const oy=Math.round(carried.y-14+Math.sin(t*2)*1.5);putE(cx,oy,ORB,cy+1,null);putE(cx+1,oy,ORB,cy+1,null);putE(cx,oy+1,ORB,cy+1,null);putE(cx+1,oy+1,ORB,cy+1,null);}}
    if(npcLight.on&&!st.noChars){const cx=npcLight.x|0,cy=npc.y|0;putE(cx,cy-6,POST,cy+1,null);putE(cx,cy-5,LAMPON,cy+1,null);putE(cx,cy-4,POST,cy+1,null);}
    // ---- light map ----
    LR.fill(0);LG.fill(0);LBf.fill(0);rayCount=0;rayTotal=0;let nOn=0,nSh=0,stampTex=0;
    const shadowsOn=st.shadows!==false;
    for(const L of lights){if(!L.on||(st.only&&!st.only.includes(L))){L.I=0;continue;}let I=flickerOf(L.T.fl,t,L.seed);if(st.flick)I=st.flick(L,t,I);I=L.fg(I,t);L.I=I;if(I<.02)continue;
      let c=L.T.c;if(L.T.c2){const k=.5+.5*Math.sin(t*.4+L.seed);c=[c[0]+(L.T.c2[0]-c[0])*k,c[1]+(L.T.c2[1]-c[1])*k,c[2]+(L.T.c2[2]-c[2])*k];}
      const R=Math.min(RMAX-1,Math.round(L.R*(L.T.fl==='fire'||L.T.fl==='camp'?(.94+.06*I):1))),lx=Math.round(L.x),ly=Math.round(L.y),shad=L.T.sh&&shadowsOn;
      nOn++;if(shad)nSh++;
      if(lx+R<cx0||lx-R>cx0+ow||ly+R<cy0||ly-R>cy0+oh){if(shad&&L.dirty)castRays(L);continue;}
      if(shad){const near=chars.some(e=>Math.abs(e.x-L.x)<L.R+6&&Math.abs(e.y-L.y)<L.R+6);if(L.dirty||near||L.carried||L.carriedNpc||st.recastAll)castRays(L);}
      const cr=c[0]*I*1.25,cg=c[1]*I*1.25,cb=c[2]*I*1.25;
      for(let dy=-R;dy<=R;dy++){const py=ly+dy;if(py<0||py>=H)continue;const row=(dy+RMAX)*LW+RMAX;for(let dx=-R;dx<=R;dx++){const px=lx+dx;if(px<0||px>=W)continue;const k=row+dx,d=DST[k];if(d>R)continue;
        if(shad&&d>L.dist[ANG[k]])continue;const q=1-(d/R)*(d/R),f=q*q,i=py*W+px;LR[i]+=cr*f;LG[i]+=cg*f;LBf[i]+=cb*f;stampTex++;}}}
    if(st.refl!==false){const refl=(x0,str,c)=>{for(let x=Math.round(x0)-2;x<=Math.round(x0)+2;x++){if(x<0||x>=W)continue;for(let y=124;y<H;y++){const i=y*W+x;if(!POND[i])continue;const s=Math.sin(y*1.3+t*5+x*2.1)+Math.sin(y*.7-t*3.3);if(s<.9)continue;const w=str*(1-Math.abs(x-x0)/3);LR[i]+=c[0]*w;LG[i]+=c[1]*w;LBf[i]+=c[2]*w;}}};
      for(const L of lights){if(!L.on||L.I<.1||L.T.R<12)continue;if(L.x>226&&L.x<316&&L.y>108&&L.y<176&&!POND[(L.y|0)*W+(L.x|0)])refl(L.x,1.1*L.I,L.T.c);}
      if(S.dir&&S.el<10&&S.el>0)refl(272+S.dir[0]*-30,1.4,S.sun);if(S.el<0&&!st.overcast&&!st.sunOv){const mx=272-Math.cos((st.hour-18)/12*Math.PI)*28;refl(mx,.7,[.7,.78,1]);}}
    // ---- compose (crop only) ----
    const view=st.view||'final',mode=st.mode||'banded',bands=st.bands||6;const am=st.ambMul===undefined?1:st.ambMul,sm=st.sunMul===undefined?1:st.sunMul,pm=st.ptMul===undefined?1:st.ptMul;
    const [ar,ag,ab]=S.amb.map(v=>v*am),[sr,sg,sb]=S.sun.map(v=>v*sm);const fWall=.25+.75*Math.max(0,S.svy),fObj=.45+.55*Math.max(0,S.svy+.3*Math.abs(S.svx)),fRoof=.7+.3*Math.max(0,S.svy);
    const winI=.85+.15*n1(t*6,9);const wins=st.windows!==false;
    for(let oy=0;oy<oh;oy++){const y=cy0+oy;for(let ox=0;ox<ow;ox++){const x=cx0+ox,o=oy*ow+ox;if(x<0||y<0||x>=W||y>=H){out[o]=0xff000000;continue;}const i=y*W+x,idx=IDX[i];
      if(view==='albedo'){out[o]=pack(RGB[idx*3],RGB[idx*3+1],RGB[idx*3+2]);continue;}
      const cls=CLF[i];let r=RGB[idx*3],g=RGB[idx*3+1],b=RGB[idx*3+2];
      if(cls===WIN&&wins&&view==='final'){const on=HOUSE[i]===1?houseOn.A:houseOn.B;if(on){out[o]=pack(255*winI,207*winI,106*winI);continue;}}
      if(EMIS[idx]&&(view==='final'||view==='pts')){out[o]=pack(r,g,b);continue;}
      const elev=(cls===WALLF||cls===OBJ||cls===ROOF||cls===CANOPY||cls===WIN);const bi=elev?clamp(OBF[i],0,H-1)*W+x:i;
      let lr,lg,lb;const indoor=INF[i]||(elev&&roofOff&&INF[bi]);let sunv=0;
      if(indoor){const sp=SUNP[bi]?.95:0;lr=ar*.28;lg=ag*.28;lb=ab*.28;sunv=sp;}
      else{let f=1;if(cls===WALLF||cls===WIN)f=fWall;else if(cls===OBJ)f=fObj;else if(cls===ROOF)f=fRoof;else if(cls===CANOPY)f=.85;const shaded=(cls!==ROOF&&cls!==CANOPY)&&(SH[bi]||DSH[bi]);sunv=shaded?0:f;lr=ar;lg=ag;lb=ab;}
      const rec=(cls===ROOF?.2:cls===CANOPY?.45:1)*pm;
      if(view==='amb'){}else if(view==='sunv'){lr+=sr*sunv;lg+=sg*sunv;lb+=sb*sunv;}
      else if(view==='pts'){lr=LR[bi]*rec;lg=LG[bi]*rec;lb=LBf[bi]*rec;}
      else{lr+=sr*sunv+LR[bi]*rec;lg+=sg*sunv+LG[bi]*rec;lb+=sb*sunv+LBf[bi]*rec;}
      if(view==='light'){out[o]=pack(lr*150,lg*150,lb*150);continue;}
      if(view==='mask'){const v=(SH[bi]||DSH[bi])&&!elev?40:SUNP[bi]?250:(elev?90:200);out[o]=pack(v,v,v);continue;}
      if(view==='occ'){const oc=Math.max(OCC[i],OCCD[i]);out[o]=oc?pack(80+oc*5,60+oc*5,40):pack(r*.3,g*.3,b*.3);continue;}
      if(mode==='colormap'&&view==='final'){const lum=.3*lr+.55*lg+.15*lb;const lev=clamp(Math.floor(lum*11+BY[i]/16),0,15);out[o]=CMAP[idx*16+lev];continue;}
      if(mode==='banded'){const B=BY[i]/16;lr=Math.floor(lr*bands+B)/bands;lg=Math.floor(lg*bands+B)/bands;lb=Math.floor(lb*bands+B)/bands;}
      out[o]=pack(r*lr,g*lg,b*lb);}}
    if(st.raysOf&&st.raysOf.T.sh){const L=st.raysOf;for(let a=0;a<256;a+=2){const an=a/256*2*Math.PI,d=L.dist[a];for(let s=0;s<d;s+=2){const px=((L.x+Math.cos(an)*s)|0)-cx0,py=((L.y+Math.sin(an)*s)|0)-cy0;if(px>=0&&py>=0&&px<ow&&py<oh)out[py*ow+px]=pack(255,220,80);}}}
    return {S,nOn,nSh,rays:rayCount,raySteps:rayTotal,stampTex,roofOff,sunBuilds};}
  // sample the light terms at a world pixel (for readouts)
  function sample(x,y){x|=0;y|=0;const i=y*W+x,idx=IDX[i];return {alb:[RGB[idx*3],RGB[idx*3+1],RGB[idx*3+2]],pt:[LR[i],LG[i],LBf[i]],sh:SH[i]||DSH[i],cls:CLF[i],sunp:SUNP[i],emis:EMIS[idx]};}
  return {W,H,lights,player,npc,LA,LB,wallT,lampL,camp,crystal,brazier,mush,bulbs,flies,npcLight,OCC,addLight,setCarried,update,render,sample,blocked,setGaps,
    carried:()=>carried,houseOn:()=>houseOn,scheduleLights,stats:()=>({rays:rayCount,steps:rayTotal})};}

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
