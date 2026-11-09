"use strict";
// ======================================================================
// core: helpers, the Rain Sandbox palette, a resizable port of the
// Sandbox world (RWorld), characters, demo runner and page chrome.
// Algorithms and constants are ported from vfx-rain-sandbox.html.
// ======================================================================
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let rs=424242;
const rnd=()=>{rs^=rs<<13;rs^=rs>>>17;rs^=rs<<5;return (rs>>>0)/4294967296;};
const ri=n=>(rnd()*n)|0;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const sat=v=>v<0?0:v>1?1:v;
const hash2=(x,y)=>{let h=Math.imul(x*374761393+y*668265263,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const vnoise=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const bay=(x,y)=>BAYER[(y&3)*4+(x&3)];
const pack=(r,g,b)=>((255<<24)|(clamp(b|0,0,255)<<16)|(clamp(g|0,0,255)<<8)|clamp(r|0,0,255))>>>0;
const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const C32=h=>{const [r,g,b]=hexRGB(h);return pack(r,g,b);};
const un32=c=>[c&255,(c>>>8)&255,(c>>>16)&255];
const mix32=(a,b,t)=>{const A=un32(a),B=un32(b);return pack(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t));};
const mul32=(c,r,g,b)=>{const A=un32(c);return pack(A[0]*r,A[1]*g,A[2]*b);};
const lum32=c=>{const [r,g,b]=un32(c);return (.2126*r+.7152*g+.0722*b)/255;};
const css=c=>{const [r,g,b]=un32(c);return `rgb(${r},${g},${b})`;};
const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,parent){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svgText(parent,x,y,txt,attrs={}){const t=svgEl('text',{x,y,...attrs},parent);t.textContent=txt;return t;}

// ---------------------------------------------------------------- palette (Sandbox values)
const BASE=[];const Cx=h=>{BASE.push(h);return BASE.length-1;};const mk=a=>a.map(Cx);
const GR=mk(['#3c6a3e','#4b7d45','#5c8f4e','#79a35a']),FLW=mk(['#d9575b','#f2d15c','#e8e4f0']);
const DI=mk(['#8a6a4a','#7a5c3f','#6a4f36']),CO=mk(['#a3a29b','#8c8b84','#5e5d59','#b9b8b0']),SA=mk(['#d8c38f','#c9b27d']);
const WD=mk(['#a07850','#8a6442','#5e432c']),WA=mk(['#2c5a80','#3b739b','#5590b7','#a9d2e8','#1f4566']),LILY=mk(['#5a9a4c','#3c7236']);
const PU=mk(['#7f95ab','#b3c4d4','#566a80']),RF=mk(['#6f7f9a','#5c6b85','#3e4a60']);
const WL=mk(['#cdb894','#b49d79','#5c4a37']),DOOR=Cx('#4a3424'),WIN=Cx('#6f8fae');
const CN=mk(['#4a8a4e','#3a7440','#28552f','#62a05a']),TRUNK=Cx('#5a3b28');
const CL=mk(['#c24b45','#e8dcc6','#7a2f2c']),MT=mk(['#b2bac6','#7d8592','#4b515c']),SW=mk(['#9a968e','#6a6760']);
const FIRE=mk(['#ffe08a','#ffa040','#e0502a']),ASH=Cx('#4a4542'),LOG=Cx('#5a3b28');
const SHEEN=Cx('#e3edf6'),SPARK=Cx('#ffffff'),RNN=Cx('#cddcee'),RNF=Cx('#8fa5bd'),SPL=Cx('#e8f0f8'),STEAM=Cx('#d3d7dc'),MUDS=Cx('#5a442f');
const HAT=Cx('#c8443c'),HATB=Cx('#efe6dc'),SKIN=Cx('#f0c09a'),EYE=Cx('#2a1b22'),COAT=Cx('#3c6fb4'),COAT2=Cx('#2f5592'),LEG=Cx('#2a2c3a'),BOOT=Cx('#5a3a28');
const UMB=mk(['#f08a6f','#d0503f','#8c3029']),VCOAT=Cx('#7a5aa0'),VHAT=Cx('#4a3a5a'),FROG=mk(['#7fcf55','#3f7f2a']),BOLT=mk(['#f6f3ff','#b9b0ff']),MIST=Cx('#d9dfe6');
const BFLY=mk(['#f2d15c','#e8e4f0']);
const NC=BASE.length,EMIS=new Uint8Array(NC);[...FIRE,...BOLT,SPARK].forEach(i=>EMIS[i]=1);
const RGB=BASE.map(hexRGB);
// four variants per colour, as in the Sandbox: dry, wet, mist, shadow
const VAR=new Float32Array(NC*4*3);
for(let i=0;i<NC;i++){const [r,g,b]=RGB[i];const v=[[r,g,b],[r*.66,g*.69,b*.78],[r*.6+217*.4,g*.6+223*.4,b*.6+230*.4],[r*.6,g*.62,b*.7]];for(let k=0;k<4;k++){const o=(i+k*NC)*3;VAR[o]=v[k][0];VAR[o+1]=v[k][1];VAR[o+2]=v[k][2];}}
const P32=i=>pack(RGB[i][0],RGB[i][1],RGB[i][2]);        // dry colour as u32
const W32=i=>pack(RGB[i][0]*.66,RGB[i][1]*.69,RGB[i][2]*.78); // Sandbox wet row
const wetC=c=>mul32(c,.66,.69,.78);
const mistC=c=>{const [r,g,b]=un32(c);return pack(r*.6+217*.4,g*.6+223*.4,b*.6+230*.4);};
const shadowC=c=>mul32(c,.6,.62,.7);
const fireC=c=>{const [r,g,b]=un32(c);return pack(r*1.12+30,g*.98+12,b*.72);};
const tintK=I=>.12+.55*I;                      // H1: Sandbox overcast tint
const tintC=(c,k)=>mul32(c,1-k,1-.88*k,1-.6*k);
const HEAT=new Uint32Array(256);for(let i=0;i<256;i++){const q=i/255;HEAT[i]=pack(q<.5?14+q*2*20:34+(q-.5)*2*200,q<.5?20+q*2*120:140+(q-.5)*2*110,q<.5?40+q*2*160:200+(q-.5)*2*50);}

// pixel canvas wrapper
function PX(cv){const ctx=cv.getContext('2d');const W=cv.width,H=cv.height;const img=ctx.createImageData(W,H);const u32=new Uint32Array(img.data.buffer);
  return {cv,ctx,W,H,img,u32,put(){ctx.putImageData(img,0,0);}};}
function cellOf(cv,e){const r=cv.getBoundingClientRect();return [Math.floor((e.clientX-r.left)/r.width*cv.width),Math.floor((e.clientY-r.top)/r.height*cv.height)];}
function pointer(cv,fn){let down=false;cv.addEventListener('pointerdown',e=>{down=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}fn(cellOf(cv,e),'down',e);});
  cv.addEventListener('pointermove',e=>{fn(cellOf(cv,e),down?'drag':'move',e);});
  const up=e=>{if(down){down=false;fn(cellOf(cv,e),'up',e);}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}
function ctl(root){const g=k=>root.querySelector(`[data-k="${k}"]`);
  return {el:g,v:k=>{const e=g(k);return e.type==='checkbox'?e.checked:+e.value;},
    on:(k,fn)=>{const e=g(k);e.addEventListener('input',fn);e.addEventListener('change',fn);},
    out:(k,t)=>{const o=root.querySelector(`[data-o="${k}"]`);if(o)o.textContent=t;},
    btn:(k,fn)=>{const e=root.querySelector(`[data-b="${k}"]`);if(e)e.addEventListener('click',()=>fn(e));return e;},
    seg:(k,fn)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(!s)return;s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',s).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);});},
    segv:k=>{const b=root.querySelector(`[data-seg="${k}"] button.on`);return b?b.dataset.v:null;}};}
function setHud(root,t){const h=root.querySelector('[data-hud]');if(h)h.textContent=t;}
const TIERS=[['Drizzle',.12],['Light',.3],['Moderate',.5],['Heavy',.75],['Storm',1]];
const tierOf=I=>I<.02?'Dry':I<.21?'Drizzle':I<.4?'Light':I<.62?'Moderate':I<.87?'Heavy':'Storm';
const dropCount=I=>I>0?Math.round(60+1300*Math.pow(I,1.25)):0;     // A3/A6, at 320x180
const VZ=[110,170,240];                                                // far, mid, near px/s

// ----------------------------------------------------------------------
// RWorld: the Sandbox's buffers and rules at any size.
// S material, B base colour, FH floor height, WET byte, WAT water depth,
// R0/R1 ripple buffers, EXP exposure, SHL shelter, MI mist grid (2x2 px)
// ----------------------------------------------------------------------
const GRASS=0,DIRT=1,STONE=2,SAND=3,WOOD=4,WATER=5,ROOF=6,CANOPY=7,CLOTH=8,METAL=9,SOLID=10;
const DRY=[1.1,.7,3,2.2,1.5,0,3,1.2,.55,4,2],INF=[.003,.0004,.0002,.007,.004,1,1,1,.02,1,1],RIN=[.03,.06,.025,.02,.02],DRN=[.01,.01,.006,.02,.02,0,0,0,0,0,0];
function RWorld(W,H,o={}){const NP=W*H,GW=W>>1,GH=H>>1,AK=NP/57600;
  const w={W,H,NP,GW,GH,AK,S:new Uint8Array(NP),B:new Uint16Array(NP),FH:new Float32Array(NP),WET:new Uint8Array(NP),WAT:new Float32Array(NP),dW:new Float32Array(NP),
    R0:new Float32Array(NP),R1:new Float32Array(NP),EXP:new Float32Array(NP),SHL:new Float32Array(NP).fill(1),WOB:new Uint8Array(NP),O:new Int16Array(NP).fill(-1),
    Cm:new Uint8Array(NP),thr:new Float32Array(NP),BY:new Uint8Array(NP),HS:new Float32Array(NP),IDX:new Uint16Array(NP),SPR:new Uint8Array(NP),FIREL:new Float32Array(NP),
    MI:new Float32Array(GW*GH),MI2:new Float32Array(GW*GH),HARD:new Float32Array(GW*GH),CWET:new Float32Array(GW*GH),
    parts:[],stores:[],trees:[],fire:null,barrel:null,chars:[],frogs:[],I:0,wind:.3,t:0,frame:0,sunny:false,flash:0,boltT:0,bolt:null,shake:0,thunderT:-1,lastStrike:-9,strikes:[],
    maxd:o.maxd||900,wb:99,simMs:0,pal:new Uint32Array(NC*4),palF:new Uint32Array(NC*4),seed:o.seed||0,film:.12,mistGain:1,evapGain:1,speed:1};
  w.D={x:new Float32Array(w.maxd),y:new Float32Array(w.maxd),z:new Float32Array(w.maxd),l:new Uint8Array(w.maxd),on:new Uint8Array(w.maxd)};
  const {S,B,FH,WET,WAT,SHL,WOB,O,Cm,HS,BY}=w;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;BY[i]=bay(x,y);HS[i]=hash2(x+w.seed*131,y+w.seed*71);}
  const put=w.put=(x,y,s,b,oy,col,wob)=>{if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;S[i]=s;B[i]=b;O[i]=oy;if(col)Cm[i]=1;if(wob)WOB[i]=Math.max(WOB[i],wob);};
  const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
  // ---------------- builders
  w.grass=()=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const n=vnoise(x/13+w.seed,y/13)*.6+vnoise(x/4,y/4+w.seed)*.4;S[i]=GRASS;B[i]=n<.38?GR[0]:n<.64?GR[1]:GR[2];FH[i]=.06;if(HS[i]<.05)B[i]=GR[3];if(HS[i]>.993)B[i]=FLW[(HS[i]*1000|0)%3];}};
  w.ground=(x0,y0,x1,y1,mat)=>{for(let y=Math.max(0,y0);y<=Math.min(H-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(W-1,x1);x++){const i=y*W+x;S[i]=mat;
    if(mat===GRASS){B[i]=HS[i]<.3?GR[0]:HS[i]<.75?GR[1]:GR[2];FH[i]=.06;}else if(mat===SAND){B[i]=HS[i]<.4?SA[1]:SA[0];FH[i]=.05;}else if(mat===WOOD){B[i]=(x-x0)%4===0?WD[2]:(y%6===0?WD[1]:WD[0]);FH[i]=.06;}
    else if(mat===METAL){B[i]=(y===y0||x===x0)?MT[0]:MT[1];FH[i]=.06;}else if(mat===CLOTH){B[i]=((x-x0)/4|0)%2?CL[1]:CL[0];FH[i]=.06;}else if(mat===ROOF){B[i]=((y-y0)%4===3)?RF[1]:RF[0];FH[i]=.06;}}};
  w.dirt=(test,rut)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(test(x,y)){const i=y*W+x;S[i]=DIRT;B[i]=HS[i]<.3?DI[1]:DI[0];let fh=.05+vnoise(x/6,y/6)*.03;if(rut&&rut(x,y)){fh=.01;B[i]=DI[2];}FH[i]=fh;}};
  w.dips=(list,mat,depth)=>{for(const [px,py,r] of list)for(let y=py-r;y<=py+r;y++)for(let x=px-r;x<=px+r;x++){if(!inb(x,y))continue;const d=Math.hypot(x-px,(y-py)*1.3)/r;if(d<1&&S[y*W+x]===mat)FH[y*W+x]=Math.min(FH[y*W+x],d*depth);}};
  w.cobble=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(!inb(x,y))continue;const i=y*W+x;const row=((y-y0)/5)|0,off=(row&1)*3,jx=(x+off)%7===0,jy=(y-y0)%5===0;S[i]=STONE;
    if(jx||jy){B[i]=CO[2];FH[i]=.012;}else{const st=hash2(((x+off)/7)|0,row+w.seed);B[i]=st<.3?CO[1]:st>.85?CO[3]:CO[0];FH[i]=.04+st*.015;}}};
  w.pond=(cx,cy,rx,ry,beach)=>{for(let y=Math.max(0,cy-ry*1.3|0);y<=Math.min(H-1,cy+ry*1.3|0);y++)for(let x=Math.max(0,cx-rx*1.3|0);x<=Math.min(W-1,cx+rx*1.3|0);x++){const i=y*W+x;const dx=(x-cx)/rx,dy=(y-cy)/ry,r=Math.sqrt(dx*dx+dy*dy);
    if(r<1){S[i]=WATER;B[i]=r<.55?WA[4]:r<.8?WA[0]:WA[1];Cm[i]=1;O[i]=-1;}else if(beach&&r<1.22&&(dx+dy<.6)){S[i]=SAND;B[i]=HS[i]<.4?SA[1]:SA[0];FH[i]=.05;}}};
  w.house=(x0,y0,x1,y1,wall)=>{wall=wall||14;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let b=((y-y0)%4===3)?RF[1]:RF[0];if(((x+((y>>2)&1)*3)%6)===0&&b===RF[0])b=RF[1];const edge=y===y1||y===y0||x===x0||x===x1;put(x,y,edge?SOLID:ROOF,edge?RF[2]:b,y1+wall+1,y>=y1-8,30);}
    const wy0=y1+1,wy1=y1+wall;for(let y=wy0;y<=wy1;y++)for(let x=x0+2;x<=x1-2;x++){let b=WL[0];if(x===x0+2||x===x1-2||y===wy1||y===wy0||(x-x0-2)%22===0)b=WL[2];else if(HS[y*W+x]<.2)b=WL[1];
      const dx=((x0+x1)>>1);if(x>=dx-4&&x<=dx+4&&y>=wy1-wall+6){b=(x===dx-4||x===dx+4||y===wy1-wall+6)?WL[2]:DOOR;}
      for(const wx of [x0+8,x1-18])if(x>=wx&&x<=wx+10&&y>=wy0+4&&y<=wy0+9)b=(x===wx||x===wx+10||y===wy0+4||y===wy0+9||x===wx+5)?WL[2]:WIN;put(x,y,SOLID,b,wy1+1,true,30);}
    for(let y=wy1+1;y<=wy1+5;y++)for(let x=x0-2;x<=x1+2;x++)if(inb(x,y))SHL[y*W+x]*=Math.min(1,.05+(y-wy1-1)/5);
    for(let y=wy1+1;y<=wy1+3;y++)for(let x=x0;x<=x1;x++){if(!inb(x,y))continue;const i=y*W+x;S[i]=DIRT;B[i]=HS[i]<.5?CO[2]:DI[2];FH[i]=y===wy1+2?0:.012;}
    const st={k:'roof',x0,x1,y:wy1+1,z:wall+6,water:0,rate:1.2,drain:.0012,fill:.0004,hits:0};w.stores.push(st);return st;};
  w.awning=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const scal=y>=y1-2&&((x-x0)%6<3?y>y1-2:y>y1-1);if(scal)continue;const st=((x-x0)/6|0)%2;put(x,y,CLOTH,y>=y1-3?CL[2]:(st?CL[1]:CL[0]),y1+8,false,0);}
    for(const px of [x0+1,x1-1])for(let y=y1;y<=y1+8;y++)put(px,y,SOLID,WD[2],y1+8,y>=y1+7,12);
    for(let x=x0+3;x<=x1-3;x++)for(let y=y1+1;y<=y1+5;y++)if(inb(x,y))SHL[y*W+x]*=.15;for(let x=x0;x<=x1;x++)for(let y=y1+6;y<=y1+10;y++)if(inb(x,y))SHL[y*W+x]*=Math.min(1,.2+(y-y1-6)*.2);
    const st={k:'awning',x0,x1,y:y1+6,z:7,water:0,rate:.9,drain:.0015,fill:.0006,hits:0};w.stores.push(st);return st;};
  w.tree=(tx,ty)=>{const t={tx,ty,water:0,rate:.35,drain:.002,fill:.0008,k:'tree',px:[]};
    for(let y=ty-6;y<=ty+6;y++)for(let x=tx-15;x<=tx+15;x++){if(!inb(x,y))continue;const dx=(x-tx)/14,dy=(y-ty+1)/6.5,r=Math.sqrt(dx*dx+dy*dy);if(r<1)SHL[y*W+x]*=.1+.9*r*r;}
    for(let y=ty-6;y<=ty;y++)for(let x=tx-1;x<=tx+1;x++)put(x,y,SOLID,x===tx+1?WD[2]:TRUNK,ty,y>=ty-1,22);
    for(let x=tx-5;x<=tx+5;x++)for(let y=ty-1;y<=ty+1;y++)if(inb(x,y))WOB[y*W+x]=Math.max(WOB[y*W+x],18);
    for(let y=ty-26;y<=ty-4;y++)for(let x=tx-13;x<=tx+13;x++){const dx=(x-tx)/12.5,dy=(y-(ty-15))/11,r=dx*dx+dy*dy;if(r>1+vnoise(x*.4,y*.4)*.3-.15)continue;
      const sh=dx+dy*.8;put(x,y,CANOPY,sh<-.5?CN[3]:sh<.1?CN[0]:sh<.6?CN[1]:CN[2],ty,false,0);if(inb(x,y))t.px.push(y*W+x);}
    w.trees.push(t);w.stores.push(t);return t;};
  w.campfire=(x,y)=>{const f={x,y,F:.8,on:true,outAt:-1,lit:0};for(let k=0;k<10;k++){const a=k/10*6.283;put(Math.round(x+Math.cos(a)*5),Math.round(y+Math.sin(a)*3),STONE,CO[k%2?1:3],y+3,true,0);}
    for(let d=-3;d<=3;d++)put(x+d,y,SOLID,d%2?LOG:ASH,y,false,0);w.fire=f;return f;};
  w.lowWall=(x0,x1,y,h)=>{h=h||5;for(let x=x0;x<=x1;x++)for(let yy=y;yy<=y+h;yy++)put(x,yy,yy===y?STONE:SOLID,yy===y?CO[3]:(yy===y+h?SW[1]:SW[0]),y+h,true,9);};
  w.anvil=(x0,y0)=>{for(let y=y0;y<=y0+5;y++)for(let x=x0;x<=x0+9;x++){const top=y<=y0+2;put(x,y,top?METAL:SOLID,top?(x<x0+4?MT[0]:MT[1]):MT[2],y0+5,true,6);}};
  w.barrelAt=(x0,y0)=>{w.barrel={x:x0,y:y0,fill:.15};for(let y=y0;y<=y0+12;y++)for(let x=x0;x<=x0+8;x++){const hoop=y===y0+3||y===y0+9;put(x,y,SOLID,hoop?MT[1]:(x===x0||x===x0+8?WD[2]:WD[(x%3===0)?1:0]),y0+12,true,10);}};
  w.finish=()=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;w.thr[i]=S[i]===WATER?999:4+BY[i]*9+HS[i]*40;if(w.fire){const d=Math.hypot(x-w.fire.x,(y-w.fire.y)*1.4);w.FIREL[i]=Math.max(0,1-d/46);}}
    for(let cy=0;cy<GH;cy++)for(let cx=0;cx<GW;cx++){let h=0;for(let k=0;k<4;k++){const i=(cy*2+(k>>1))*W+cx*2+(k&1);const s=S[i];h+=(s===STONE||s===ROOF||s===WOOD||s===METAL||s===SOLID)?1:s===WATER?.8:s===DIRT?.4:.15;}w.HARD[cy*GW+cx]=h/4;}
    w.wb=99;w.exposure(w.wind);};
  // B2: exposure rays per wind bucket (rebuilt when round(3*wind) changes)
  w.computeExposure=wv=>{const dir=Math.sign(wv),mag=Math.abs(wv);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let e=SHL[i];
    if((S[i]<=SAND||S[i]===WOOD)&&mag>.15){for(let d=1;d<=26;d++){const sx=x-dir*d;if(sx<0||sx>=W)break;const h=WOB[y*W+sx];if(h>0){const L=h*.9*mag+1.5;if(d<L){const f=d/L;e*=.08+.92*f*f;}break;}}}w.EXP[i]=e;}};
  w.exposure=wv=>{const b=Math.round(wv*3);if(b!==w.wb){w.wb=b;w.computeExposure(b/3);}};
  w.curtainOn=true;w.curtain=(x,y)=>w.curtainOn?.45+.75*vnoise((x-w.wind*w.t*42)/46,y/38+w.t*.04):.825;
  w.spawnDrop=k=>{const D=w.D;let x,y,tries=0;do{x=rnd()*(W+80)-40;y=rnd()*(H+90);tries++;}while(rnd()>w.curtain(x,y)*.8&&tries<4);D.x[k]=x;D.y[k]=y;D.z[k]=40+rnd()*60;const r=rnd();D.l[k]=r<.5?0:r<.85?1:2;D.on[k]=1;};
  w.wetHit=(i,amt)=>{if(WET[i]<255)WET[i]=Math.min(255,WET[i]+amt);const s=S[i];if(s<=WOOD)WAT[i]+=RIN[s]*amt/26;};
  w.umbAt=(x,y)=>{for(const c of w.chars)if(c.umb&&Math.abs(x-c.x)<6&&Math.abs(y-c.y)<4)return c;return null;};
  w.impact=(x,y,layer)=>{x|=0;y|=0;if(x<1||y<1||x>=W-1||y>=H-1)return;const i=y*W+x,s=S[i];const P=w.parts;
    const uc=w.umbAt(x,y);if(uc){P.push({k:'spl',x,y:uc.y,z:15,vx:(rnd()-.5)*30,vy:0,vz:20,life:.25});return;}
    if(w.coverDrops&&s!==ROOF&&s!==CLOTH&&s!==CANOPY&&s!==WATER&&rnd()>w.EXP[i])return;
    const f=w.fire;if(f&&f.on&&!f.roof&&Math.hypot(x-f.x,y-f.y)<7){if(rnd()<.5)P.push({k:'steam',x,y,z:3,vx:w.wind*6,vy:0,vz:10,life:.9});f.F-=.004;return;}
    if(s===WATER||WAT[i]>.12){w.R0[i]-=layer===2?3:1.6;}
    else if(layer===2&&(s===STONE||s===WOOD||s===ROOF||s===METAL||s===SOLID)){for(let k=0;k<2;k++)P.push({k:'spl',x,y,z:0,vx:(rnd()-.5)*36+w.wind*10,vy:(rnd()-.5)*10,vz:22+rnd()*14,life:.28});}
    else if(layer===2&&s===DIRT&&WET[i]>200)P.push({k:'mud',x,y,z:0,vx:(rnd()-.5)*24,vy:0,vz:16,life:.25});
    for(const st of w.stores){if(st.k==='tree'){if(s===CANOPY&&Math.abs(st.tx-x)<14&&Math.abs(st.ty-15-y)<13){st.water=Math.min(1,st.water+st.fill);break;}}
      else if((s===ROOF&&st.k==='roof'||s===CLOTH&&st.k==='awning')&&x>=st.x0&&x<=st.x1){st.water=Math.min(1,st.water+st.fill);break;}}
    w.wetHit(i,layer===2?60:36);};
  // ---------------- the fixed 60 Hz step
  w.simStep=()=>{const I=w.I,sunny=w.sunny,R0=w.R0,R1=w.R1,EXP=w.EXP,dW=w.dW;
    const n=(I*1500*AK)|0;for(let k=0;k<n;k++){const i=(rnd()*NP)|0;const x=i%W,y=(i/W)|0;if(rnd()<EXP[i]*Math.min(1.3,w.curtain(x,y))){if(w.umbAt(x,y))continue;
      if(S[i]===WATER||WAT[i]>.12){if(rnd()<.35)R0[i]-=.9;}w.wetHit(i,26);for(const st of w.stores)if(st.k==='roof'&&S[i]===ROOF)st.water=Math.min(1,st.water+.00002);}}
    const FILM=w.film;dW.fill(0);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,a=WAT[i];if(a<.003)continue;const h=a+FH[i];let s=0,f0=0,f1=0,f2=0,f3=0,j,d,aj;
      j=i-1;if(S[j]<=WATER){aj=S[j]===WATER?0:WAT[j];d=h-aj-(S[j]===WATER?0:FH[j]);if(d>0&&(a>FILM||aj>.003)){f0=d;s+=d;}}
      j=i+1;if(S[j]<=WATER){aj=S[j]===WATER?0:WAT[j];d=h-aj-(S[j]===WATER?0:FH[j]);if(d>0&&(a>FILM||aj>.003)){f1=d;s+=d;}}
      j=i-W;if(S[j]<=WATER){aj=S[j]===WATER?0:WAT[j];d=h-aj-(S[j]===WATER?0:FH[j]);if(d>0&&(a>FILM||aj>.003)){f2=d;s+=d;}}
      j=i+W;if(S[j]<=WATER){aj=S[j]===WATER?0:WAT[j];d=h-aj-(S[j]===WATER?0:FH[j]);if(d>0&&(a>FILM||aj>.003)){f3=d;s+=d;}}
      if(s<=0)continue;const k=Math.min(.2,a*.9/s);dW[i]-=s*k;dW[i-1]+=f0*k;dW[i+1]+=f1*k;dW[i-W]+=f2*k;dW[i+W]+=f3*k;}
    const ev=sunny?.00014:I>.02?0:.00003;
    for(let i=W;i<NP-W;i++){const xx=i%W;if(xx===0||xx===W-1){WAT[i]=0;continue;}let a=WAT[i]+dW[i];if(a<=0){WAT[i]=0;continue;}const s=S[i];if(s===WATER){WAT[i]=0;continue;}a-=INF[s]+ev+a*DRN[s];if(a<.003)a=0;WAT[i]=a;if(a>.05)WET[i]=255;}
    const dryK=sunny?2.6:I>.25?0:I>.02?.55:.7,ns=Math.max(40,(5000*AK)|0),f=w.fire;
    for(let k=0;k<ns;k++){const i=(rnd()*NP)|0;if(!WET[i]||WAT[i]>.05)continue;let r=DRY[S[i]]*(sunny&&EXP[i]>.3?1:(sunny?.45:1))*dryK;if(I>.02&&EXP[i]<.1)r=DRY[S[i]]*.5;
      if(f&&f.on&&w.FIREL[i]>.75)r+=6;if(rnd()<r*.5)WET[i]=WET[i]>3?WET[i]-3:0;}
    for(let y=1;y<H-1;y++){const rr=y*W;for(let x=1;x<W-1;x++){const i=rr+x;if(S[i]!==WATER&&WAT[i]<.12){R1[i]=0;continue;}const v=(R0[i-1]+R0[i+1]+R0[i-W]+R0[i+W])*.5-R1[i];R1[i]=v*.95;}}
    const tmp=w.R0;w.R0=w.R1;w.R1=tmp;
    if(w.fountain&&rnd()<.6){const a=rnd()*6.283,r=2+rnd()*w.fountain.r;const x=Math.round(w.fountain.x+Math.cos(a)*r),y=Math.round(w.fountain.y+Math.sin(a)*r*.8);w.R0[y*W+x]-=1.2;}
    for(const st of w.stores){if(st.water<=.01||rnd()>=st.water*st.rate)continue;
      if(st.k==='tree'){const p=st.px[(rnd()*st.px.length)|0];if(p===undefined)continue;const y=(p/W)|0;w.parts.push({k:'drip',x:p%W+(rnd()-.5)*4,y:st.ty-2+(rnd()*6-3),z:st.ty-y+4,vx:0,vy:0,vz:0,life:3});}
      else w.parts.push({k:'drip',x:st.x0+((rnd()*(st.x1-st.x0+1))|0),y:st.y+((rnd()*2)|0),z:st.z,vx:0,vy:0,vz:0,life:3});st.water=Math.max(0,st.water-st.drain);}
    if(w.barrel){const b=w.barrel;b.fill=Math.min(1.05,b.fill+I*.00006);if(sunny)b.fill=Math.max(0,b.fill-.000004);if(b.fill>1)b.fill=1;}
    if(w.frame%10===0)for(let cy=0;cy<GH;cy++)for(let cx=0;cx<GW;cx++){const i=cy*2*W+cx*2;w.CWET[cy*GW+cx]=(WET[i]+WET[i+1]+WET[i+W]+WET[i+W+1])/1020;}
    const MI=w.MI,MI2=w.MI2,spray=Math.max(0,I-.45)*Math.max(0,I-.45)*.05*w.mistGain,evap=sunny?.0045*.25*w.evapGain:0;
    for(let c=0;c<GW*GH;c++)MI[c]+=spray*w.HARD[c]+evap*w.CWET[c]*w.CWET[c];
    const wx=w.wind*.25;for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){const c=y*GW+x;const src=sunny?MI[c+GW]*.25+MI[c]*.75:MI[c];const sx=wx>0?MI[c-1]:MI[c+1];
      MI2[c]=((src*(1-Math.abs(wx))+sx*Math.abs(wx))*4+MI[c-1]+MI[c+1]+MI[c-GW]+MI[c+GW])/8*.985;}
    w.MI=MI2;w.MI2=MI;for(let x=0;x<GW;x++){w.MI[x]=0;w.MI[(GH-1)*GW+x]=0;}for(let y=0;y<GH;y++){w.MI[y*GW]=0;w.MI[y*GW+GW-1]=0;}
    w.frame++;};
  // ---------------- drops, particles, fire, storm
  w.updateDrops=dt=>{const D=w.D,want=Math.min(w.maxd,Math.round(dropCount(w.I)*AK*(o.dropMul||1)));
    for(let k=0;k<w.maxd;k++){if(!D.on[k]){if(k<want&&rnd()<dt*4)w.spawnDrop(k);continue;}const l=D.l[k],vz=VZ[l]*(.55+.45*w.I);D.z[k]-=vz*dt;D.x[k]+=w.wind*vz*.55*dt;
      if(D.z[k]<=0){w.impact(D.x[k],D.y[k],l);if(k<want)w.spawnDrop(k);else D.on[k]=0;}}};
  w.updateParts=dt=>{const P=w.parts;for(let k=P.length-1;k>=0;k--){const p=P[k];p.life-=dt;if(p.life<=0){P.splice(k,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
    if(p.k==='spl'||p.k==='mud'||p.k==='spark'){p.vz-=150*dt;if(p.z<0){P.splice(k,1);continue;}}
    else if(p.k==='drip'){p.vz-=200*dt;if(p.z<=0){w.impact(p.x,p.y,1);const i=(p.y|0)*W+(p.x|0);if(i>0&&i<NP){WAT[i]+=.03;if(S[i]===WATER||WAT[i]>.12)w.R0[i]-=1.5;else if(rnd()<.5)P.push({k:'spl',x:p.x,y:p.y,z:0,vx:(rnd()-.5)*20,vy:0,vz:14,life:.2});}P.splice(k,1);continue;}}
    else if(p.k==='flame')p.vx+=w.wind*10*dt;}
    if(P.length>500)P.splice(0,P.length-500);};
  w.updateFire=dt=>{const f=w.fire;if(!f)return;if(f.on){f.F=Math.min(1,f.F+dt*.04);f.F-=w.I*(w.EXP[f.y*W+f.x])*dt*.11;if(rnd()<f.F*dt*30)w.parts.push({k:'flame',x:f.x+(rnd()-.5)*4,y:f.y,z:1,vx:w.wind*5,vy:0,vz:14+rnd()*10,life:.45+rnd()*.3});
      if(f.F<.12){f.on=false;f.outAt=w.t;for(let k=0;k<18;k++)w.parts.push({k:'steam',x:f.x+(rnd()-.5)*8,y:f.y,z:2,vx:w.wind*8+(rnd()-.5)*6,vy:0,vz:10+rnd()*10,life:1.4});}}
    else if(rnd()<dt*2)w.parts.push({k:'smoke',x:f.x+(rnd()-.5)*3,y:f.y,z:2,vx:w.wind*8,vy:0,vz:7,life:1.2});};
  // F1/F2 with a >= 1 s gap guard (the Sandbox has none) and the page's reduce-flash setting
  w.updateStorm=dt=>{w.flash=Math.max(0,w.flash-dt);w.boltT=Math.max(0,w.boltT-dt);if(w.thunderT>0){w.thunderT-=dt;if(w.thunderT<=0)w.shake=.45;}w.shake=Math.max(0,w.shake-dt);
    if(w.I>.85&&rnd()<dt*.18&&w.boltT<=0&&w.t-w.lastStrike>=1)w.strike(20+rnd()*(W-40),20+rnd()*(H-30));};
  w.strike=(tx,ty)=>{const b=[];const md=(x0,y0,x1,y1,d,depth)=>{if(depth===0||d<1.5){b.push([x0,y0,x1,y1]);return;}const mx=(x0+x1)/2+(rnd()-.5)*d,my=(y0+y1)/2+(rnd()-.5)*d*.3;md(x0,y0,mx,my,d/2,depth-1);md(mx,my,x1,y1,d/2,depth-1);
      if(depth>=3&&rnd()<.35){const a=Math.atan2(y1-y0,x1-x0)+(rnd()<.5?-.52:.52),L=Math.hypot(x1-x0,y1-y0)*.7;md(mx,my,mx+Math.cos(a)*L,my+Math.sin(a)*L,d/2,depth-2);}};
    md(tx+(rnd()-.5)*40,-4,tx,ty,Math.min(48,H*.4),6);w.bolt=b;w.boltT=.22;w.flash=calmFlash?.06:.28;w.thunderT=.4+rnd()*1.4;w.lastStrike=w.t;w.strikes.push(w.t);
    const i=(ty|0)*W+(tx|0);if(S[i]===WATER)for(let k=-2;k<=2;k++)w.R0[i+k]-=6;for(let k=0;k<10;k++)w.parts.push({k:'spark',x:tx,y:ty,z:2,vx:(rnd()-.5)*80,vy:(rnd()-.5)*40,vz:20+rnd()*30,life:.35});};
  // ---------------- characters (Sandbox sprites and rules)
  w.blocked=(x,y)=>{x|=0;y|=0;for(let xx=x-2;xx<=x+2;xx++){if(xx<0||xx>=W||y<4||y>=H)return true;if(Cm[y*W+xx]||Cm[(y-1)*W+xx])return true;}return false;};
  w.step=(c,mx,my)=>{const sp=Math.hypot(mx,my);if(!sp)return;c.dist+=sp;if(c.dist<5)return;c.dist=0;c.foot^=1;const side=c.foot?1:-1,hz=Math.abs(mx)>Math.abs(my);
    const fx=Math.round(c.x+(hz?0:side*1.5)),fy=Math.round(c.y+(hz?side*.6:0)),i=fy*W+fx;if(fx<1||fy<1||fx>=W-1||fy>=H-1)return;c.steps=(c.steps||0)+1;
    if(WAT[i]>.12){for(let k=0;k<3;k++)w.parts.push({k:'spl',x:fx,y:fy,z:0,vx:(rnd()-.5)*30,vy:(rnd()-.5)*10,vz:18+rnd()*14,life:.3});w.R0[i]-=2.5;c.shoe=1;}
    else if(S[i]===DIRT&&WET[i]>200){FH[i]=Math.max(0,FH[i]-.02);FH[i+1]=Math.max(0,FH[i+1]-.02);c.shoe=Math.max(c.shoe,.8);if(rnd()<.5)w.parts.push({k:'mud',x:fx,y:fy,z:0,vx:(rnd()-.5)*20,vy:0,vz:12,life:.22});c.mud=(c.mud||0)+1;}
    else if(c.shoe>.08&&WET[i]<200){WET[i]=Math.max(WET[i],180*c.shoe+60);WET[i+1]=Math.max(WET[i+1],150*c.shoe+40);c.shoe*=.8;c.prints=(c.prints||0)+1;}
    else if(WET[i]>220)c.shoe=Math.max(c.shoe,.5);};
  w.move=(c,vx,vy,dt)=>{const i=(c.y|0)*W+(c.x|0);const mud=S[i]===DIRT&&WET[i]>220?.82:1;c.inMud=mud<1;vx*=mud;vy*=mud;const nx=c.x+vx*dt,ny=c.y+vy*dt;let mx=0,my=0;
    if(!w.blocked(nx,c.y)){mx=nx-c.x;c.x=nx;}if(!w.blocked(c.x,ny)){my=ny-c.y;c.y=ny;}c.moving=Math.abs(mx)+Math.abs(my)>.001;
    if(c.moving){c.anim+=dt*8;if(Math.abs(vx)>Math.abs(vy))c.dir=vx>0?'right':'left';else c.dir=vy>0?'down':'up';w.step(c,mx,my);}else c.anim=0;};
  w.walkTo=(c,tx,ty,sp,dt)=>{const dx=tx-c.x,dy=ty-c.y,l=Math.hypot(dx,dy);if(l<1.5){c.moving=false;c.anim=0;return true;}w.move(c,dx/l*sp,dy/l*sp,dt);if(!c.moving){c.stuck=(c.stuck||0)+dt;if(c.stuck>.6){c.stuck=0;return true;}}else c.stuck=0;return false;};
  w.expAt=c=>w.EXP[(c.y|0)*W+(c.x|0)]||0;
  w.soak=(c,dt)=>{const e=w.expAt(c),f=w.fire;if(w.I>.02&&e>.25&&!c.umb)c.wet=Math.min(1,c.wet+w.I*e*dt*.12);else{let d=.012;if(w.sunny)d=.03;
      if(f&&f.on&&Math.hypot(c.x-f.x,c.y-f.y)<22){d=.12;if(c.wet>.1&&rnd()<dt*4)w.parts.push({k:'steam',x:c.x+(rnd()-.5)*5,y:c.y,z:6,vx:0,vy:0,vz:8,life:.8});}c.wet=Math.max(0,c.wet-d*dt);}
    c.drip=(c.drip||0)-dt;if(c.wet>.45&&c.drip<=0){c.drip=.35+rnd()*.5/c.wet;w.parts.push({k:'drip',x:c.x+(rnd()-.5)*6,y:c.y+1,z:5,vx:0,vy:0,vz:0,life:2});}};
  w.newChar=(x,y,map)=>{const c={x,y,dir:'down',anim:0,dist:0,foot:0,moving:false,wet:0,shoe:0,umb:false,drip:0,map:map||PMAP};w.chars.push(c);return c;};
  // ---------------- render
  w.buildPalette=(o2={})=>{let r,g,b;if(w.sunny){r=1.04;g=1;b=.93;}else{const k=o2.k!==undefined?o2.k:tintK(w.I);r=1-k;g=1-k*.88;b=1-k*.6;}if(o2.mul){[r,g,b]=o2.mul;}
    if(w.flash>0){const f=calmFlash?.35:1.1;const fw=Math.min(1,w.flash*6)*f;r+=fw;g+=fw;b+=fw*1.05;}
    for(let i=0;i<NC*4;i++){const q=i*3,base=i%NC;const R=VAR[q],G=VAR[q+1],Bc=VAR[q+2];if(EMIS[base]){w.pal[i]=w.palF[i]=pack(R,G,Bc);continue;}w.pal[i]=pack(R*r,G*g,Bc*b);w.palF[i]=pack(R*r*1.12+30,G*g*.98+12,Bc*b*.72);}};
  w.setPI=(i,idx)=>{w.IDX[i]=idx;w.SPR[i]=1;};
  w.putp=(x,y,idx)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;w.setPI(y*W+x,idx);};
  w.line=(x0,y0,x1,y1,idx)=>{x0|=0;y0|=0;x1|=0;y1|=0;const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx-dy,n=0;for(;;){w.putp(x0,y0,idx);if(x0===x1&&y0===y1||n++>400)break;const e2=2*e;if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}}};
  w.drawTpl=(rows,map,x0,y0,flip,feetY,wet)=>{const h=rows.length,ww=rows[0].length;for(let r=0;r<h;r++){const y=y0+r;if(y<0||y>=H)continue;for(let c=0;c<ww;c++){const ch=rows[r][flip?ww-1-c:c];if(ch==='.')continue;const x=x0+c;if(x<0||x>=W)continue;const i=y*W+x;if(O[i]>feetY)continue;
    let idx=map[ch];if(wet>0&&BY[i]<wet*17&&ch!=='e')idx+=NC;w.setPI(i,idx);}}};
  w.drawChar=c=>{const x=Math.round(c.x),y=Math.round(c.y);const fr=c.moving?[0,1,0,2][(c.anim|0)%4]:0;let body,legs,flip=false;
    if(c.dir==='down'){body=PF;legs=LF[fr];}else if(c.dir==='up'){body=PB;legs=LF[fr];}else{body=PS;legs=LS[fr];flip=c.dir==='left';}
    const rows=body.concat(legs);for(let xx=-2;xx<=2;xx++){const i=(y+1)*W+x+xx;if(y+1<H&&x+xx>=0&&x+xx<W&&w.IDX[i]<NC)w.IDX[i]+=3*NC;}w.drawTpl(rows,c.map,x-3,y-rows.length+1,flip,y,c.wet);
    if(c.umb){const uy=y-rows.length-2;for(let r=0;r<5;r++){const hw=[3,5,6,6,6][r];for(let xx=-hw;xx<=hw;xx++){const px=x+xx,py=uy+r;if(px<0||py<0||px>=W||py>=H)continue;let idx=r===4?(xx%3===0?UMB[2]:UMB[1]):(xx<-1&&r<3?UMB[0]:UMB[1]);if(w.I>.05&&BY[py*W+px]<8)idx+=NC;w.setPI(py*W+px,idx);}}
      for(let r=5;r<rows.length-3;r++)w.putp(x+3,uy+r,UMB[2]);}};
  w.render=(u,o2={})=>{w.buildPalette(o2);const sunny=w.sunny,slot=(w.frame>>3)*2654435761,R0=w.R0,IDX=w.IDX,view=o2.view||'normal';
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,s=S[i];let idx=B[i];
      if(s===WATER){const sl=(R0[i+1]-R0[i-1])+(R0[i+W]-R0[i-W]);idx=sl>.55?WA[3]:sl>.22?WA[2]:sl<-.5?WA[4]:idx;}
      else if(WAT[i]>.1-BY[i]*.002&&s!==SOLID&&o2.puddles!==false){const sl=(R0[i+1]-R0[i-1])+(R0[i+W]-R0[i-W]);const edge=WAT[i-1]<.1||WAT[i+1]<.1||WAT[i-W]<.1||WAT[i+W]<.1;
        idx=edge?PU[2]:sl>.35?PU[1]:sl<-.35?PU[2]:PU[0];if(sunny&&!edge&&((Math.imul(i^slot,2246822519)>>>24)<2))idx=SHEEN;}
      else if(WET[i]>w.thr[i]){idx+=NC;if((s===STONE||s===ROOF||s===METAL||(s===DIRT&&WET[i]>230))&&WET[i]>200&&o2.sheen!==false){const hl=s===METAL?.28:s===ROOF?.08:.05;if(HS[i]<hl&&((y+((w.frame>>4)))&3)!==0)idx=SHEEN;}
        if(sunny&&WET[i]>150&&(s===GRASS||s===STONE||s===ROOF)&&((Math.imul(i^slot,2246822519)>>>23)===0))idx=SPARK;}
      IDX[i]=idx;}
    if(w.barrel){const b=w.barrel;for(let y=b.y+1;y<=b.y+3;y++)for(let x=b.x+1;x<=b.x+7;x++){const i=y*W+x;IDX[i]=b.fill>.35?((y===b.y+1&&b.fill>.8)?WA[2]:WA[1]):WD[2];if(b.fill>.35&&w.I>.05&&HS[i]<.12*w.I)IDX[i]=WA[3];}}
    w.SPR.fill(0);
    const ents=w.chars.map(c=>[c.y,()=>w.drawChar(c)]);for(const f of w.frogs)ents.push([f.y,()=>{const z=f.hop>0?Math.sin(f.hop/.3*Math.PI)*3:0;const x=f.x|0,y=(f.y-z)|0;w.putp(x,y,FROG[0]);w.putp(x+1,y,FROG[0]);w.putp(x,y+1,FROG[1]);w.putp(x+1,y+1,FROG[1]);w.putp(x+1,y-1,FROG[0]);}]);
    if(o2.extra)ents.push(...o2.extra);ents.sort((a,b)=>a[0]-b[0]).forEach(e=>e[1]());
    for(const p of w.parts){const x=p.x|0,y=(p.y-p.z)|0;if(x<0||y<0||x>=W||y>=H)continue;const i=y*W+x;
      if(p.k==='spl')w.setPI(i,SPL);else if(p.k==='mud')w.setPI(i,MUDS);else if(p.k==='spark')w.setPI(i,SPARK);
      else if(p.k==='drip'){w.setPI(i,RNN);if(y>0)w.setPI(i-W,RNF);}
      else if(p.k==='flame'){const f=p.life;w.setPI(i,f>.5?FIRE[0]:f>.3?FIRE[1]:FIRE[2]);if(f>.45&&x+1<W)w.setPI(i+1,FIRE[1]);}
      else if((p.k==='steam'||p.k==='smoke')&&BY[i]<p.life*13)w.setPI(i,p.k==='steam'?STEAM:ASH);}
    if(o2.rain!==false){const D=w.D,I=w.I,wind=w.wind;for(let k=0;k<w.maxd;k++){if(!D.on[k])continue;const l=D.l[k];const sx=D.x[k]-wind*D.z[k]*.55,sy=D.y[k]-D.z[k];if(sy<-12||sy>H+2||sx<-10||sx>W+10)continue;
      const len=I<.2?1+l:([2,4,7][l]*(.5+.6*I))|0,idx=l===0?RNF:RNN;for(let t2=0;t2<=len;t2++){const px=(sx-wind*.55*t2)|0,py=(sy-t2)|0;if(px<0||py<0||px>=W||py>=H)continue;const i=py*W+px;if(l===0&&BY[i]>9)continue;w.setPI(i,idx);}}}
    if(w.boltT>0&&w.bolt){for(const [a,b,c,d] of w.bolt)w.line(a+1,b,c+1,d,BOLT[1]);for(const [a,b,c,d] of w.bolt)w.line(a,b,c,d,BOLT[0]);}
    if(o2.mist!==false){const MI=w.MI;for(let y=0;y<H;y++){const gr=(y>>1)*GW;for(let x=0;x<W;x++){const m=MI[gr+(x>>1)];if(m<.03)continue;const i=y*W+x;if(m*12>BY[i]+2&&IDX[i]<NC*2)IDX[i]=(IDX[i]%NC)+2*NC;if(m>.75&&BY[i]<(m-.75)*40)IDX[i]=MIST;}}}
    const f=w.fire,fl=f&&f.on?f.F*(.85+.15*Math.sin(w.frame*.4)):0;
    if(view==='normal'){for(let i=0;i<NP;i++){const idx=IDX[i];u[i]=(fl>0&&w.FIREL[i]*fl*22>BY[i]+3)?w.palF[idx]:w.pal[idx];}}
    else{for(let i=0;i<NP;i++){let v=-1;const s=S[i];if(view==='wet')v=WET[i]/255;else if(view==='water')v=s===WATER?-1:Math.min(1,WAT[i]*3);else if(view==='ripple')v=(s===WATER||WAT[i]>.12)?.5+R0[i]*.15:-1;else if(view==='exp')v=w.EXP[i];else v=w.MI[((i/W|0)>>1)*GW+((i%W)>>1)]*1.2;
      u[i]=(v<0||w.SPR[i])?w.pal[IDX[i]]:HEAT[Math.max(0,Math.min(255,(v*255)|0))];}}};
  w.puddlePx=()=>{let d=0,s=0;for(let i=0;i<NP;i++)if(WAT[i]>.1){if(S[i]===DIRT)d++;else if(S[i]===STONE)s++;}return [d,s];};
  w.wetFrac=mat=>{let n=0,k=0;for(let i=0;i<NP;i++)if(S[i]===mat){n++;if(WET[i]>w.thr[i])k++;}return n?k/n:0;};
  return w;}
const PF=["..hhh..",".hhhhh.",".HHHHH.",".seses.",".sssss.","yccCccy","ccccccc","ccccccc",".CcccC."],PB=["..hhh..",".hhhhh.",".HHHHH.",".hhhhh.",".sssss.","ccccccc","ccccccc","ccccccc",".CcccC."],PS=["..hhh..",".hhhhh.",".HHHHH.","..ssse.","..ssss.",".cccc..","ccccc..",".cccc..",".CccC.."];
const LF=[[".ll.ll.",".ll.ll.",".bb.bb."],[".ll.ll.","..l.ll.","..b.bb."],[".ll.ll.",".ll.l..",".bb.b.."]],LS=[["..ll...","..ll...","..bbb.."],[".l..l..",".l...l.","bb...bb"],["..ll...",".ll....",".bb...."]];
const PMAP={h:HAT,H:HATB,s:SKIN,e:EYE,y:HAT,c:COAT,C:COAT2,l:LEG,b:BOOT},VMAP={h:VHAT,H:VHAT,s:SKIN,e:EYE,y:VHAT,c:VCOAT,C:COAT2,l:LEG,b:BOOT};
// direct (u32) sprite draw for small custom demos
function drawSprite(u,W,H,x,y,o={}){const map=o.map||PMAP;const rows=PF.concat(LF[o.fr||0]);const top=Math.round(y)-rows.length+1,x0=Math.round(x)-3;
  for(let r=0;r<rows.length;r++)for(let c=0;c<7;c++){const ch=rows[r][c];if(ch==='.')continue;const px=x0+c,py=top+r;if(px<0||py<0||px>=W||py>=H)continue;let col=P32(map[ch]);
    if(o.wet&&bay(px,py)<o.wet*17&&ch!=='e')col=W32(map[ch]);if(o.tint)col=o.tint(col);u[py*W+px]=col;}}

// ----------------------------------------------------------------------
// demo runner: lazy init + pause offscreen (IntersectionObserver) + rAF
// ----------------------------------------------------------------------
const DEMOS={};function reg(name,fn){DEMOS[name]=fn;}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let motion=!reduce;
let calmFlash=reduce;           // page-wide reduce-flash setting (on by default with reduced motion)
const calmHooks=[];
function setCalm(v){calmFlash=v;$$('[data-calm]').forEach(e=>{if(e.type==='checkbox')e.checked=v;else{e.setAttribute('aria-pressed',v);e.textContent=v?'Flashes reduced':'Reduce flashes';}});calmHooks.forEach(f=>f(v));}
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
// page chrome: TOC, motion + flash toggles, profiles open/close, index filter
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
  $$('[data-calm]').forEach(e=>{if(e.type==='checkbox')e.addEventListener('change',()=>setCalm(e.checked));else e.addEventListener('click',()=>setCalm(!calmFlash));});setCalm(calmFlash);
  $$('[data-openall]').forEach(b=>b.addEventListener('click',()=>$$('details.tp').forEach(d=>d.open=true)));
  $$('[data-closeall]').forEach(b=>b.addEventListener('click',()=>$$('details.tp').forEach(d=>d.open=false)));
  const openHash=()=>{const h=location.hash.slice(1);const d=h&&document.getElementById(h);if(d&&d.tagName==='DETAILS')d.open=true;};addEventListener('hashchange',openHash);openHash();
  const q=$('#idxq');if(q){const rows=$$('#idxt tbody tr'),n=$('#idxn'),chips=$$('.chips[data-idx] button');
    const f=()=>{const v=q.value.trim().toLowerCase();let c=0;rows.forEach(r=>{const m=!v||v.split('|').some(t=>r.textContent.toLowerCase().includes(t));r.hidden=!m;if(m)c++;});n.textContent=`${c} of ${rows.length} entries`;
      chips.forEach(b=>b.classList.toggle('on',b.dataset.q===v));};
    q.addEventListener('input',f);chips.forEach(b=>b.addEventListener('click',()=>{q.value=q.value===b.dataset.q?'':b.dataset.q;f();}));f();}
}
document.addEventListener('DOMContentLoaded',()=>{chrome();$$('[data-demo]').forEach(el=>io.observe(el));});
