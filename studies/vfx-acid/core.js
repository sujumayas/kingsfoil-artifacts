"use strict";
// ======================================================================
// core: helpers, acid palette, shared room simulation, demo runner, chrome
// Algorithms are ported from vfx-acid-sandbox.html (same constants).
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
const H32=a=>a.map(C32);
const un32=c=>[c&255,(c>>>8)&255,(c>>>16)&255];
const mix32=(a,b,t)=>{const A=un32(a),B=un32(b);return pack(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t));};
const css=c=>{const [r,g,b]=un32(c);return `rgb(${r},${g},${b})`;};
const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,parent){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svgText(parent,x,y,txt,attrs={}){const t=svgEl('text',{x,y,...attrs},parent);t.textContent=txt;return t;}

// ---------------------------------------------------------------- palette (Sandbox values)
const PAL={FLR:H32(['#40444f','#4a4f5b','#363942','#25272e']),WL:H32(['#56556d','#45445c','#2d2c39','#6a6988']),
  ST1:C32('#4f5947'),ST2:C32('#66704f'),SALT:C32('#d3d8cb'),SALT2:C32('#aeb6a5'),
  AC:H32(['#f6ffa8','#d9f75e','#a2e33c','#68b42c','#3f8124','#ecff86']),   // HI L M D DD EDGE
  SL:H32(['#eeffbe','#bff26a','#8bd544','#55a030','#2c5d20','#0f200b']),   // HI L M D OUTLINE EYE
  GOLD:H32(['#ffe07a','#d9a531','#8f631c']),GLASS:H32(['#e3f7ff','#8fc3d6','#4f7f91']),RUST:H32(['#c0713f','#8a4a2a']),
  PIT:C32('#363b44'),SALTI:C32('#c0dba0'),SKIN:C32('#f0c09a'),EYE:C32('#20161c'),TUNIC:C32('#3c6fb4'),PANTS:C32('#34364a'),
  SMOKE:C32('#a6ae9c'),SMOKE_D:C32('#6f7668'),FLAME:H32(['#fff0a0','#ffbe4a','#ff7a2e']),HOLDER:C32('#2a2a33'),WHITE:C32('#ffffff'),BLACK:C32('#000000')};
const STG=[null,null,null,
  [H32(['#b07f50','#8d603b','#5e3d26']),H32(['#80603f','#664a32','#463120']),H32(['#463528','#33281f','#221b16']),H32(['#2b231d','#221c17','#17120f'])],
  [H32(['#d4dce6','#98a3b1','#5c6472']),H32(['#b8c0ca','#86909d','#545b67']),H32(['#a3ad98','#7c8774','#4f574a']),H32(['#70766a','#585d51','#3c4038'])],
  [H32(['#ece4cc','#cdc3a3','#9c9275']),H32(['#ddd29f','#bdb082','#8f8462']),H32(['#b8ad83','#9a8f69','#6e664b']),H32(['#7d7558','#665f47','#4a4433'])],
  [H32(['#94613f','#744a30','#4c3020']),H32(['#6e4a35','#573928','#3c281b']),H32(['#47332b','#36271f','#251b16']),H32(['#2c221d','#221a16','#17120f'])],
  [H32(['#b4474a','#8f3439','#612229']),H32(['#985452','#7a4041','#552d2f']),H32(['#755148','#5d3f39','#412c28']),H32(['#4a3a34','#3a2d29','#28201d'])],
  null];
const M_FLOOR=0,M_GROUT=1,M_WALL=2,M_WOOD=3,M_IRON=4,M_BONE=5,M_LEATH=6,M_CLOTH=7,M_GOLD=8;
const MNAME=['floor','grout','wall','wood','iron','bone','leather','cloth','gold'];
const RATE=[0,0,0,.55,.8,.45,.6,1.1,0],GASK=[0,0,0,.6,.9,.4,.5,.5,0];
const OOZE=['#0e0314','#281039','#2c4273','#407292','#56a3b2','#6dd4c3','#95ffcf','#d5ffcc'];
const ACM=un32(PAL.AC[2]);
// the Sandbox's four palette variants: base, acid-wet tint, fume haze, shadow
const wetC=c=>{const [r,g,b]=un32(c);return pack((r*.55+ACM[0]*.45)*1.06,(g*.55+ACM[1]*.45)*1.06,(b*.55+ACM[2]*.45));};
const hazeC=c=>{const [r,g,b]=un32(c);return pack(r*.67+150*.33,g*.67+172*.33,b*.67+108*.33);};
const shadowC=c=>{const [r,g,b]=un32(c);return pack(r*.6,g*.6,b*.66);};
const dimC=c=>{const [r,g,b]=un32(c);return pack(r*.6,g*.63,b*.76);};
const torchC=c=>{const [r,g,b]=un32(c);return pack(r*1.02+8,g*.9+4,b*.7);};
const glowC=c=>{const [r,g,b]=un32(c);return pack(r*.62,g*.92+18,b*.52+4);};
// B3: integrity -> stage colour through a dithered threshold (Sandbox matIdx)
function stageCol(m,role,q,x,y,o){if(m===M_GOLD)return PAL.GOLD[role];const T=STG[m];const dz=o&&o.nodither;
  let si=Math.floor((1-q)*3.3+(dz?0:(bay(x,y)-7.5)/16*.9));si=si<0?0:si>3?3:si;const h=hash2(x,y);
  if(q<.15&&h<(.15-q)*7)return -1;
  if(m===M_IRON&&!(o&&o.nocue)){if(si===1&&h<.3)return PAL.PIT;if(si===2&&h<.45)return PAL.SALTI;}
  return T[si][role];}
const HEAT=new Uint32Array(256);for(let i=0;i<256;i++){const t=i/255;HEAT[i]=pack(t<.5?14+t*2*30:44+(t-.5)*2*200,t<.5?18+t*2*150:168+(t-.5)*2*87,t<.5?20+t*2*40:60-(t-.5)*2*10);}
const OHEAT=new Uint32Array(256);(()=>{const st=OOZE.map(hexRGB);for(let i=0;i<256;i++){const t=i/255*7,k=Math.min(6,t|0),f=t-k;const a=st[k],b=st[k+1];OHEAT[i]=pack(lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f));}})();

// pixel canvas wrapper
function PX(cv){const ctx=cv.getContext('2d');const W=cv.width,H=cv.height;const img=ctx.createImageData(W,H);const u32=new Uint32Array(img.data.buffer);
  return {cv,ctx,W,H,img,u32,put(){ctx.putImageData(img,0,0);}};}
function cellOf(cv,e){const r=cv.getBoundingClientRect();return [Math.floor((e.clientX-r.left)/r.width*cv.width),Math.floor((e.clientY-r.top)/r.height*cv.height)];}
function pointer(cv,fn){let down=false;cv.addEventListener('pointerdown',e=>{down=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}fn(cellOf(cv,e),'down',e);});
  cv.addEventListener('pointermove',e=>{fn(cellOf(cv,e),down?'drag':'move',e);});
  const up=e=>{if(down){down=false;fn(cellOf(cv,e),'up',e);}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',e=>{if(!down)fn([-1,-1],'leave',e);});}
function ctl(root){const g=k=>root.querySelector(`[data-k="${k}"]`);
  return {el:g,v:k=>{const e=g(k);return e.type==='checkbox'?e.checked:+e.value;},
    on:(k,fn)=>{const e=g(k);e.addEventListener('input',fn);e.addEventListener('change',fn);},
    out:(k,t)=>{const o=root.querySelector(`[data-o="${k}"]`);if(o)o.textContent=t;},
    btn:(k,fn)=>{const e=root.querySelector(`[data-b="${k}"]`);if(e)e.addEventListener('click',()=>fn(e));return e;},
    seg:(k,fn)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(!s)return;s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',s).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);});}};}
function setHud(root,t){const h=root.querySelector('[data-hud]');if(h)h.textContent=t;}

// ----------------------------------------------------------------------
// Room: the Sandbox's buffers and rules at any size.
// A acid amount, FH floor height, M material, Q integrity, SOL solid,
// ST stain, SALT salt, RU rust, G fume grid (2x2 px cells)
// ----------------------------------------------------------------------
function Room(W,H,o={}){const N=W*H,GW=(W+1)>>1,GH=(H+1)>>1,ts=o.tile||16;
  const r={W,H,N,GW,GH,ts,M:new Uint8Array(N),ROLE:new Uint8Array(N),Q:new Float32Array(N),SOL:new Uint8Array(N),FM:new Uint8Array(N),FB:new Uint32Array(N),
    FH:new Float32Array(N),A:new Float32Array(N),dA:new Float32Array(N),ST:new Uint8Array(N),SALT:new Uint8Array(N),RU:new Uint8Array(N),HS:new Float32Array(N),BY:new Uint8Array(N),thr:new Float32Array(N),
    G:new Float32Array(GW*GH),G2:new Float32Array(GW*GH),SF:new Float32Array(N),items:[],parts:[],FILM:.3,EVAP:.00004,react:o.react||1,bx0:1,bx1:W-2,by0:1,by1:H-2,stats:{eaten:0}};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;r.HS[i]=hash2(x+(o.seed||0),y);r.BY[i]=bay(x,y);r.thr[i]=.03+r.BY[i]*.004;}
  r.floor=()=>{r.M.fill(0);r.ROLE.fill(0);r.Q.fill(0);r.SOL.fill(0);r.A.fill(0);r.ST.fill(0);r.SALT.fill(0);r.RU.fill(0);r.G.fill(0);r.items.length=0;r.parts.length=0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;
      if(x===0||y===0||x===W-1||y===H-1){r.M[i]=r.FM[i]=M_WALL;r.SOL[i]=1;r.FB[i]=PAL.WL[2];continue;}
      const gx=x%ts,gy=y%ts,tx=(x/ts)|0,ty=(y/ts)|0,tr=hash2(tx*7+(o.seed||0),ty*13);
      if(gx===0||gy===0){r.FM[i]=M_GROUT;r.FB[i]=PAL.FLR[3];r.FH[i]=.03;}
      else{r.FM[i]=M_FLOOR;r.FH[i]=.035+tr*.03;let c=tr<.33?PAL.FLR[0]:tr<.7?PAL.FLR[1]:PAL.FLR[0];if(r.HS[i]<.07)c=PAL.FLR[2];if(gx===1||gy===1)c=PAL.FLR[1];if(gx===ts-1||gy===ts-1)c=PAL.FLR[2];r.FB[i]=c;}
      r.M[i]=r.FM[i];}};
  r.wall=(x0,y0,w,h)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){if(x<0||y<0||x>=W||y>=H)continue;const i=y*W+x;r.M[i]=r.FM[i]=M_WALL;r.SOL[i]=1;r.A[i]=0;
    const row=((y-y0)/5)|0;r.FB[i]=(y-y0)%5===4||((x+(row&1)*6)%12===0)?PAL.WL[2]:r.HS[i]<.25?PAL.WL[1]:PAL.WL[0];}};
  r.setObj=(x,y,m,role,sol,it)=>{if(x<1||y<1||x>=W-1||y>=H-1)return;const i=y*W+x;if(r.M[i]===M_WALL)return;r.M[i]=m;r.ROLE[i]=role;r.Q[i]=1;r.SOL[i]=sol?1:0;r.RU[i]=0;if(sol)r.A[i]=0;if(it)it.px.push(i);};
  r.destroy=i=>{r.M[i]=r.FM[i];r.SOL[i]=0;r.Q[i]=0;r.RU[i]=0;r.ST[i]=Math.min(255,r.ST[i]+60);r.stats.eaten++;};
  r.item=(kind,x0,y0)=>{const it={kind,x:x0,y:y0,px:[]};const P=(x,y,m,ro,s)=>r.setObj(x0+x,y0+y,m,ro,s,it);
    if(kind==='sword'){for(let x=0;x<16;x++){P(x,0,M_IRON,0);P(x,1,M_IRON,x>13?1:2);}P(16,0,M_IRON,1);P(17,1,M_IRON,2);
      for(let y=-2;y<=3;y++)P(-1,y,M_IRON,y<0?0:1);for(let x=-5;x<=-2;x++){P(x,0,M_LEATH,1);P(x,1,M_LEATH,2);}P(-6,0,M_GOLD,0);P(-6,1,M_GOLD,2);it.x+=6;}
    else if(kind==='shield'){for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const d=Math.hypot(x,y*1.1);if(d>7.4)continue;
        if(d>5.8)P(x,y,M_IRON,y<0?0:2);else if(d<1.8)P(x,y,M_IRON,x+y<0?0:1);else P(x,y,M_WOOD,(x+20)%4===0?2:(x+y<-4?0:1));}}
    else if(kind==='armor'){for(let y=0;y<14;y++){const hw=y<3?7:y<9?6:5;for(let x=-hw;x<=hw;x++){if(y<3&&Math.abs(x)<3)continue;
        P(x,y,(y<3&&Math.abs(x)>5)?M_LEATH:M_IRON,x===0?2:x<-2?0:(y>10?2:1));}}it.y+=6;}
    else if(kind==='crate'){for(let y=0;y<14;y++)for(let x=0;x<16;x++){const edge=x===0||x===15||y===0||y===13,band=(x<2||x>13)&&(y<2||y>11);
        P(x,y,band?M_IRON:M_WOOD,band?1:edge?2:y>=10?2:(y%3===0?2:(x<6?0:1)),true);}it.x+=8;it.y+=7;}
    else if(kind==='barrel'){for(let y=0;y<15;y++)for(let x=-6;x<=6;x++){const ex=Math.abs(x)/6.6;if(ex>1)continue;const hoop=y===2||y===11;
        P(x,y,hoop?M_IRON:M_WOOD,hoop?(x<0?0:2):(y<4?(x%3===0?2:0):(x%3===0?2:(x<-1?0:1))),true);}it.y+=7;}
    else if(kind==='bones'){for(let y=0;y<5;y++)for(let x=0;x<6;x++){if(y===4&&(x===0||x===5))continue;P(x,y,M_BONE,(y===2&&(x===1||x===4))?2:(x<3?0:1));}
      for(let k=0;k<10;k++){P(8+k,1+(k>>2),M_BONE,k%5===0?2:1);P(8+k,6-(k>>2),M_BONE,k%5===0?2:0);}it.x+=9;it.y+=3;}
    else if(kind==='gold'){for(let c=0;c<9;c++){const cx=(c%3)*5-5+(c>5?2:0),cy=((c/3)|0)*3-3;for(let y=-1;y<=1;y++)for(let x=-2;x<=2;x++)if(Math.abs(x)+Math.abs(y)<3)P(cx+x,cy+y,M_GOLD,y<0?0:y>0?2:1);}}
    else if(kind==='rug'){for(let y=0;y<16;y++)for(let x=0;x<28;x++){const b=x<2||x>25||y<2||y>13,m=Math.abs(x-14)+Math.abs((y-8)*1.7)<6;P(x,y,M_CLOTH,b?2:m?0:((x+y)%6===0?2:1));}it.x+=14;it.y+=8;}
    else if(kind==='plate'){for(let y=0;y<10;y++)for(let x=0;x<18;x++)P(x,y,M_IRON,y===0||x===0?0:(y===9||x===17)?2:1,true);it.x+=9;it.y+=5;}
    else if(kind==='strap'){for(let y=0;y<6;y++)for(let x=0;x<18;x++)P(x,y,M_LEATH,y===0?0:y===5?2:(x%5===0?2:1),true);it.x+=9;it.y+=3;}
    else if(kind==='plank'){for(let y=0;y<8;y++)for(let x=0;x<20;x++)P(x,y,M_WOOD,y===0?0:y===7?2:(y%3===0?2:(x<7?0:1)),true);it.x+=10;it.y+=4;}
    else if(kind==='bonepile'){for(let y=0;y<8;y++)for(let x=0;x<18;x++){const d=Math.hypot((x-9)/9,(y-4)/4);if(d>1)continue;P(x,y,M_BONE,y<3?0:y>5?2:1,true);}it.x+=9;it.y+=4;}
    else if(kind==='coins'){for(let c=0;c<6;c++){const cx=(c%3)*5+2,cy=((c/3)|0)*4+1;for(let y=-1;y<=1;y++)for(let x=-2;x<=2;x++)if(Math.abs(x)+Math.abs(y)<3)P(cx+x,cy+y,M_GOLD,y<0?0:y>0?2:1,true);}it.x+=7;it.y+=3;}
    r.items.push(it);return it;};
  r.spill=(cx,cy,rad,amt)=>{for(let y=cy-rad;y<=cy+rad;y++)for(let x=cx-rad;x<=cx+rad;x++){if(x<1||y<1||x>=W-1||y>=H-1)continue;const d=Math.hypot(x-cx,y-cy)/rad;if(d>1)continue;const i=y*W+x;if(!r.SOL[i])r.A[i]+=amt*(1-d*d*.6)*(.85+r.HS[i]*.3);}
    r.grow(cx-rad,cy-rad,cx+rad,cy+rad);};
  r.grow=(x0,y0,x1,y1)=>{r.bx0=Math.min(r.bx0,x0|0);r.by0=Math.min(r.by0,y0|0);r.bx1=Math.max(r.bx1,x1|0);r.by1=Math.max(r.by1,y1|0);};
  r.gasAdd=(i,v)=>{const x=i%W,y=(i/W)|0;r.G[(y>>1)*GW+(x>>1)]+=v;};
  r.bubble=(i,kind)=>{if(r.parts.length>60)return;r.parts.push({k:kind||'bub',x:i%W,y:(i/W)|0,z:0,vx:0,vy:0,vz:kind==='smoke'?10:0,life:kind==='smoke'?1.2:.45,t:0});};
  r.reactPx=(j,src,conc,mul)=>{const m=r.M[j];const dmg=RATE[m]*conc*.0035*mul*r.react*(.5+rnd());r.Q[j]-=dmg;
    if(src>=0)r.A[src]=Math.max(0,r.A[src]-dmg*.55);r.gasAdd(j,dmg*GASK[m]*6);
    if(rnd()<dmg*26)r.bubble(j,m===M_WOOD||m===M_CLOTH||m===M_LEATH?'smoke':'bub');
    if(r.Q[j]<=0)r.destroy(j);return dmg;};
  r.step=(opt={})=>{const A=r.A,dA=r.dA,FH=r.FH,SOL=r.SOL,M=r.M,FILM=opt.film!==undefined?opt.film:r.FILM,EV=opt.evap===false?0:r.EVAP*(opt.evapMul||1);
    const x0=Math.max(1,r.bx0-1),x1=Math.min(W-2,r.bx1+1),y0=Math.max(1,r.by0-1),y1=Math.min(H-2,r.by1+1);
    for(let y=y0;y<=y1;y++){const rw=y*W;for(let x=x0;x<=x1;x++)dA[rw+x]=0;}
    if(opt.flow!==false)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x,a=A[i];if(a<.004)continue;const h=a+FH[i];let s=0,f0=0,f1=0,f2=0,f3=0,j,d,aj;
      j=i-1;if(!SOL[j]){aj=A[j];d=h-aj-FH[j];if(d>0&&(a>FILM||aj>.004)){f0=d;s+=d;}}
      j=i+1;if(!SOL[j]){aj=A[j];d=h-aj-FH[j];if(d>0&&(a>FILM||aj>.004)){f1=d;s+=d;}}
      j=i-W;if(!SOL[j]){aj=A[j];d=h-aj-FH[j];if(d>0&&(a>FILM||aj>.004)){f2=d;s+=d;}}
      j=i+W;if(!SOL[j]){aj=A[j];d=h-aj-FH[j];if(d>0&&(a>FILM||aj>.004)){f3=d;s+=d;}}
      if(s<=0)continue;const k=Math.min(.2,a*.9/s);dA[i]-=s*k;dA[i-1]+=f0*k;dA[i+1]+=f1*k;dA[i-W]+=f2*k;dA[i+W]+=f3*k;}
    let nx0=W,nx1=0,ny0=H,ny1=0;const RE=opt.react!==false;
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;let a=A[i]+dA[i];if(a<.004){A[i]=0;continue;}A[i]=a;
      if(x<nx0)nx0=x;if(x>nx1)nx1=x;if(y<ny0)ny0=y;if(y>ny1)ny1=y;
      const m=M[i];if(RE&&m>=M_WOOD&&RATE[m]>0)r.reactPx(i,i,Math.min(1,a),1);else if(m<=M_GROUT&&rnd()<.012*a&&r.ST[i]<255)r.ST[i]++;
      if(RE){const ca=Math.min(1,a);if(SOL[i-1]&&RATE[M[i-1]]>0)r.reactPx(i-1,i,ca,.6);if(SOL[i+1]&&RATE[M[i+1]]>0)r.reactPx(i+1,i,ca,.6);
        if(SOL[i-W]&&RATE[M[i-W]]>0)r.reactPx(i-W,i,ca,.6);if(SOL[i+W]&&RATE[M[i+W]]>0)r.reactPx(i+W,i,ca,.6);}
      if(EV>0){const edge=A[i-1]===0||A[i+1]===0||A[i-W]===0||A[i+W]===0;const ev=EV*(edge?1.8:1)+(a<.08?.0005*(opt.evapMul||1):0);A[i]-=ev;r.gasAdd(i,ev*.9);
        if(edge&&a<.3&&rnd()<.03&&r.ST[i]<250)r.ST[i]+=2;}
      if(a>.45&&rnd()<.0005)r.bubble(i);if(A[i]<.004)A[i]=0;}
    r.bx0=nx0;r.bx1=nx1;r.by0=ny0;r.by1=ny1;if(nx0>nx1){r.bx0=1;r.bx1=0;r.by0=1;r.by1=0;}
    if(opt.gas!==false)r.fumes(opt.drift!==false);
    const S=opt.samples!==undefined?opt.samples:Math.max(60,(N*2500/57600)|0);
    for(let k=0;k<S;k++){const i=(rnd()*N)|0;const m=M[i];
      if(m===M_IRON&&r.Q[i]<.985&&A[i]===0&&A[i+1]===0&&A[i-1]===0){if(rnd()<.06*(1.15-r.Q[i]))r.RU[i]=Math.min(255,r.RU[i]+3);
        if(r.RU[i]>150&&rnd()<.03){const j=i+[1,-1,W,-W][(rnd()*4)|0];if(M[j]===M_IRON)r.RU[j]=Math.min(255,r.RU[j]+14);}if(r.RU[i]>220)r.Q[i]-=.0002;}
      if(r.ST[i]&&A[i]===0&&rnd()<.04*(opt.fade===undefined?1:opt.fade))r.ST[i]--;if(r.SALT[i]&&rnd()<.12*(opt.fade===undefined?1:opt.fade))r.SALT[i]--;}};
  r.fumes=(drift=true)=>{const G=r.G,G2=r.G2;for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){const c=y*GW+x;const d=(G[c]*4+G[c-1]+G[c+1]+G[c-GW]+G[c+GW])/8;
      G2[c]=(drift?(d*.8+((G[c+GW]*4+G[c+GW-1]+G[c+GW+1])/6)*.2):d)*.991;}const t=r.G;r.G=r.G2;r.G2=t;};
  r.lime=(x,y,rad=7)=>{let n=0;for(let yy=y-rad;yy<=y+rad;yy++)for(let xx=x-rad;xx<=x+rad;xx++){if(xx<1||yy<1||xx>=W-1||yy>=H-1)continue;if((xx-x)**2+(yy-y)**2>rad*rad)continue;const i=yy*W+xx;
      if(r.A[i]>0){r.SALT[i]=Math.min(255,r.SALT[i]+r.A[i]*200+40);r.gasAdd(i,r.A[i]*.08);if(rnd()<.05)r.parts.push({k:'smoke',x:xx,y:yy,z:0,vx:0,vy:0,vz:8,life:.8,t:0});r.A[i]=0;n++;}}return n;};
  r.updParts=dt=>{const P=r.parts;for(let k=P.length-1;k>=0;k--){const q=P[k];q.life-=dt;q.t+=dt;if(q.life<=0){P.splice(k,1);continue;}q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;
    if(q.k==='drop'){q.vz-=120*dt;if(q.z<=0){const x=q.x|0,y=q.y|0;if(x>1&&y>1&&x<W-2&&y<H-2&&!r.SOL[y*W+x]){r.A[y*W+x]+=.35;r.A[y*W+x+1]+=.08;r.A[y*W+x-1]+=.08;r.grow(x-1,y,x+1,y);}P.splice(k,1);}}
    else if(q.k==='smoke')q.vx*=.98;}};
  r.drawParts=u=>{for(const q of r.parts){const x=q.x|0,y=(q.y-q.z)|0;if(x<0||y<1||x>=W-1||y>=H-1)continue;const i=y*W+x;
    if(q.k==='bub'){const ph=q.t/.45;if(ph<.4)u[i]=PAL.AC[0];else if(ph<.8){u[i-1]=PAL.AC[5];u[i+1]=PAL.AC[5];u[i-W]=PAL.AC[5];}else u[i-W]=PAL.AC[0];}
    else if(q.k==='smoke'){if(r.BY[i]<q.life*12)u[i]=q.life>.6?PAL.SMOKE:PAL.SMOKE_D;}
    else if(q.k==='drop'){u[i]=PAL.AC[1];if(q.z>2&&y+1<H)u[i+W]=PAL.AC[3];}}};
  r.total=()=>{let t=0;for(let i=0;i<N;i++)t+=r.A[i];return t;};
  // render: stage colours, stain, salt, acid bands + sheen, haze
  r.render=(u,t,o2={})=>{const A=r.A,M=r.M,BY=r.BY,thr=r.thr,haze=o2.haze!==false,sheen=o2.sheen!==false;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,m=M[i];let c=-1;
      if(m===M_WALL){u[i]=r.FB[i];continue;}
      if(m>=M_WOOD){c=stageCol(m,r.ROLE[i],r.Q[i],x,y);if(c>=0&&m===M_IRON&&r.RU[i]>BY[i]*12+30)c=PAL.RUST[r.ROLE[i]===0?0:1];}
      const a=A[i];
      if(c<0){c=r.FB[i];if(r.ST[i]>BY[i]*9+18)c=r.ST[i]>170?PAL.ST2:PAL.ST1;if(r.SALT[i]>BY[i]*12+8)c=r.SALT[i]>150?PAL.SALT:PAL.SALT2;
        if(a>thr[i]){const edge=A[i-1]<=thr[i-1]||A[i+1]<=thr[i+1]||A[i-W]<=thr[i-W]||A[i+W]<=thr[i+W];
          if(a<.12)c=wetC(c);else if(edge)c=PAL.AC[5];else if(a<.22)c=wetC(c);else{c=a<.7?PAL.AC[2]:a<1.4?PAL.AC[3]:PAL.AC[4];
            if(sheen){const w=Math.sin(x*.35+t*1.7+Math.sin(y*.3+t*.9)*1.6)+Math.sin((x+y)*.21-t*1.3);if(w>1.5)c=w>1.8?PAL.AC[0]:PAL.AC[1];}}}}
      else if(a>thr[i]&&!r.SOL[i])c=a<.9?wetC(c):PAL.AC[3];
      if(haze){const g=r.G[(y>>1)*r.GW+(x>>1)];if(g>.02&&g*14>BY[i]+1)c=hazeC(c);}
      u[i]=c;}};
  r.floor();return r;}

// ---------------------------------------------------------------- slimes (D1), drawn into the shared threshold
const srad=s=>2.5+Math.sqrt(s.mass)*1.25;
function newSlime(x,y,mass){return {x,y,mass,ph:rnd()*6,vx:0,vy:0,tx:x,ty:y,t:0,dir:1,hurt:0,blink:(rnd()*170)|0};}
function drawSlimes(r,u,slimes,frame,o={}){const W=r.W,H=r.H,SF=r.SF,A=r.A,T=o.thr===undefined?1:o.thr,AW=o.aw===undefined?.55:o.aw,boxes=[];
  for(const s of slimes){const rr=(o.radius||srad)(s),sq=o.squash===false?0:Math.sin(s.ph)*.13,rx=rr*(1+sq),ry=rr*(1-sq)*.82,cx=s.x,cy=s.y-ry*.55;
    const X0=Math.max(1,(cx-rx*1.7)|0),X1=Math.min(W-2,(cx+rx*1.7)|0),Y0=Math.max(1,(cy-ry*1.7)|0),Y1=Math.min(H-2,(cy+ry*1.7)|0);boxes.push([X0,X1,Y0,Y1,s,cx,cy,rx,ry]);
    if(!o.noshadow)for(let y=(s.y-ry*.45)|0;y<=(s.y+ry*.45)|0;y++)for(let x=(s.x-rx)|0;x<=(s.x+rx)|0;x++){if(x<0||y<0||x>=W||y>=H)continue;const dx=(x-s.x)/rx,dy=(y-s.y)/(ry*.45);if(dx*dx+dy*dy<1){const i=y*W+x;u[i]=shadowC(u[i]);}}}
  for(const [X0,X1,Y0,Y1,s,cx,cy,rx,ry] of boxes)for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const dx=(x-cx)/rx,dy=(y-cy)/ry,d2=dx*dx+dy*dy;if(d2<2.56){const v=1-d2/2.56;SF[y*W+x]+=v*v*2.7;}}
  const field=o.field;
  for(const [X0,X1,Y0,Y1,s] of boxes)for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){const i=y*W+x,f=SF[i];if(f<.05)continue;if(field){u[i]=OHEAT[Math.min(255,(f/2.7*255)|0)];if(f+Math.min(A[i],1)*AW>=T&&f+Math.min(A[i],1)*AW<T+.08)u[i]=PAL.WHITE;continue;}
    const v=f+Math.min(A[i],1)*AW;if(v<T)continue;let c;
    if(f<.3&&A[i]>.1)c=PAL.AC[2];else if(v<T+.13&&A[i]<.1)c=PAL.SL[4];else{const g=SF[i+W+1]-SF[i-W-1];c=g>.9?PAL.SL[0]:g>.4?PAL.SL[1]:g<-.45?PAL.SL[3]:PAL.SL[2];
      if(f>1.35&&r.M[i]>=M_WOOD&&o.see!==false){const ob=stageCol(r.M[i],r.ROLE[i],r.Q[i],x,y);if(ob>=0)c=wetC(ob);}}
    if(s.hurt>0&&(frame&2))c=PAL.WHITE;u[i]=c;}
  for(const [X0,X1,Y0,Y1,s,cx,cy,rx,ry] of boxes){if(!field){const ex=(cx+s.dir*rx*.28)|0,ey=(cy-ry*.18)|0;const bl=((frame+s.blink)%170)<6;const P=(x,y)=>{if(x>0&&y>0&&x<W&&y<H)u[y*W+x]=PAL.SL[5];};
      if(!bl){P(ex-2,ey);P(ex+2,ey);P(ex-2,ey+1);P(ex+2,ey+1);}else{P(ex-2,ey+1);P(ex+2,ey+1);}
      if(s.mother&&((frame>>3)&1))for(const [dx,dy] of [[-rx*.9,-ry*.9],[rx*.8,-ry*1.1],[0,-ry*1.4]]){const px=(cx+dx)|0,py=(cy+dy)|0;if(px>0&&py>0&&px<W&&py<H)u[py*W+px]=C32('#7fb4ff');}}
    for(let y=Y0;y<=Y1;y++)SF.fill(0,y*W+X0,y*W+X1+1);}}

// tiny 7-px character (Sandbox sprite, front view) with equipment tinted by stage
const PF=["..hhh..",".hhhhh.",".HeseH.",".HsssH.","uccCccu","uccCccu","scCCCcs",".ppppp.",".pp.pp.",".bb.bb.",".BB.BB."];
const PFW=[".ppppp.",".pp.pp.","..b.bb.","..B.BB."],PFW2=[".ppppp.",".pp.pp.",".bb.b..",".BB.B.."];
function drawHero(u,W,H,x,y,o={}){x=Math.round(x);y=Math.round(y);const rows=PF.slice(0,7).concat(o.step===1?PFW:o.step===2?PFW2:PF.slice(7));const top=y-rows.length+1;
  const eq=o.eq||{helm:1,chest:1,boots:1},flash=o.flash,tint=o.tint;
  for(let r2=0;r2<rows.length;r2++){const row=rows[r2];for(let c=0;c<7;c++){const ch=row[c];if(ch==='.')continue;const px=x-3+c,py=top+r2;if(px<0||py<0||px>=W||py>=H)continue;let col;
    if(ch==='h'||ch==='H'){col=eq.helm>0?stageCol(M_IRON,ch==='h'?0:2,eq.helm,px,py):(ch==='h'?PAL.SMOKE_D:PAL.SKIN);}
    else if(ch==='c'||ch==='C'){col=eq.chest>0?stageCol(M_IRON,ch==='c'?1:2,eq.chest,px,py):PAL.TUNIC;}
    else if(ch==='b'||ch==='B'){col=eq.boots>0?stageCol(M_LEATH,ch==='b'?1:2,eq.boots,px,py):PAL.SKIN;}
    else col={s:PAL.SKIN,e:PAL.EYE,u:PAL.TUNIC,p:PAL.PANTS}[ch];
    if(col<0)col=ch==='b'||ch==='B'?PAL.SKIN:PAL.TUNIC;if(flash)col=PAL.WHITE;else if(tint)col=wetC(col);u[py*W+px]=col;}}}

// ----------------------------------------------------------------------
// demo runner: lazy init + pause offscreen (IntersectionObserver) + rAF
// ----------------------------------------------------------------------
const DEMOS={};function reg(name,fn){DEMOS[name]=fn;}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let motion=!reduce;
const live=new Map();
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
  const openHash=()=>{const h=location.hash.slice(1);const d=h&&document.getElementById(h);if(d&&d.tagName==='DETAILS')d.open=true;};addEventListener('hashchange',openHash);openHash();
  const q=$('#idxq');if(q){const rows=$$('#idxt tbody tr'),n=$('#idxn'),chips=$$('.chips button');
    const f=()=>{const v=q.value.trim().toLowerCase();let c=0;rows.forEach(r=>{const m=!v||v.split('|').some(t=>r.textContent.toLowerCase().includes(t));r.hidden=!m;if(m)c++;});n.textContent=`${c} of ${rows.length} entries`;
      chips.forEach(b=>b.classList.toggle('on',b.dataset.q===v));};
    q.addEventListener('input',f);chips.forEach(b=>b.addEventListener('click',()=>{q.value=q.value===b.dataset.q?'':b.dataset.q;f();}));f();}
}
document.addEventListener('DOMContentLoaded',()=>{chrome();$$('[data-demo]').forEach(el=>io.observe(el));});
