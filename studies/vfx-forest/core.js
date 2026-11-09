"use strict";
// ======================================================================
// core: helpers, the Forest Sandbox's palettes + procedural sprite
// generator, climate/biome table, Bridson Poisson, a small forest builder,
// a software pixel renderer (u32 framebuffers), birds, demo runner, chrome.
// Algorithms and constants are ported from vfx-forest-sandbox.html.
// ======================================================================
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let rs=20261109;
const rnd=()=>{rs^=rs<<13;rs^=rs>>>17;rs^=rs<<5;return (rs>>>0)/4294967296;};
const mkRng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const sat=v=>v<0?0:v>1?1:v;
const hash2=(x,y)=>{let h=Math.imul(x*374761393+y*668265263,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const vnoise=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
const fbm=(x,y)=>vnoise(x,y)*.6+vnoise(x*2.1+7,y*2.1+3)*.28+vnoise(x*4.3+1,y*4.3+9)*.12;
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const bay=(x,y)=>BAYER[(y&3)*4+(x&3)];
const pack=(r,g,b)=>((255<<24)|(clamp(b|0,0,255)<<16)|(clamp(g|0,0,255)<<8)|clamp(r|0,0,255))>>>0;
const U=h=>pack(parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16));
const un32=c=>[c&255,(c>>>8)&255,(c>>>16)&255];
const mix32=(a,b,t)=>{const A=un32(a),B=un32(b);return pack(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t));};
const mulc=(c,r,g,b)=>{const A=un32(c);return pack(A[0]*r,A[1]*g,A[2]*b);};
const css=c=>{const [r,g,b]=un32(c);return `rgb(${r},${g},${b})`;};
const hexOf=c=>'#'+un32(c).map(v=>v.toString(16).padStart(2,'0')).join('');
const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,parent){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svgText(parent,x,y,txt,attrs={}){const t=svgEl('text',{x,y,...attrs},parent);t.textContent=txt;return t;}

// pixel canvas wrapper
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
const SEASONS=['Spring','Summer','Autumn','Winter'];

// ---------------------------------------------------------------- Sandbox palettes and species
const P=a=>a.map(U);
const L={oakSp:P(['#c4e88a','#97d064','#6fae4c','#4c8a40','#2a5530']),oakSu:P(['#a8d46c','#74b04e','#4f8f3f','#356b33','#1d4024']),oakAu:P(['#f0c25a','#d58e3a','#b0642e','#83442a','#4a2a1e']),
 mpSp:P(['#d2ec8e','#a6d466','#7ab24c','#558c42','#2e5530']),mpSu:P(['#9ccc6a','#6aa84c','#4a883e','#326432','#1c3c24']),mpAu:P(['#ffa070','#ec5a3c','#c03a30','#8c2a2a','#4c1a20']),
 biSp:P(['#e6f59a','#bce070','#90c456','#6a9e46','#3e6a34']),biSu:P(['#c2e278','#95c85a','#6ea648','#4e8240','#2c5430']),biAu:P(['#fff2a0','#f6d45a','#ddae3a','#ad7e2a','#5e4520']),
 chBl:P(['#fff0f6','#ffc8dc','#f39abc','#cc6e96','#7a3c58']),pi:P(['#8cbd6c','#62994e','#457a40','#2e5834','#18341f']),piW:P(['#7aa868','#548a4c','#3c6c40','#284e34','#16301f']),
 sp:P(['#7ab89a','#53967c','#3a7562','#265648','#14302a']),spW:P(['#6aa08a','#4a8470','#336858','#224c40','#122a24']),palm:P(['#b8dc6a','#86bc4c','#5e9a3e','#3e7432','#224a22']),
 kp:P(['#7cc45a','#4fa246','#36823c','#246232','#123a20']),acW:P(['#c4cc6a','#9aae50','#768e42','#566c36','#323e22']),acD:P(['#e0cc70','#bca856','#968444','#6e6036','#3e3622']),
 fern:P(['#8ed46a','#5eb04e','#3e8e40','#2a6a34','#163e20'])};
const SNOW=P(['#f6f9ff','#d5deef','#aebbd6']),BERRY=U('#c8303a'),WHITE=U('#ffffff'),COCO=U('#6a4a2a');
const SPECIES=[
 {n:'Oak',kind:'broad',R:[9,14],tr:[5,8],flex:1,bark:P(['#8a6a4a','#6a4f36','#3e2c20']),leaf:[L.oakSp,L.oakSu,L.oakAu,null],off:.1,dec:1},
 {n:'Maple',kind:'broad',R:[8,12],tr:[5,8],flex:1,bark:P(['#7a5a48','#5a4234','#33251e']),leaf:[L.mpSp,L.mpSu,L.mpAu,null],off:-.12,dec:1},
 {n:'Birch',kind:'broad',R:[5,8],tr:[9,13],flex:1.3,bark:P(['#f2efe6','#cfc9bb','#2b2a2e']),birch:1,leaf:[L.biSp,L.biSu,L.biAu,null],off:-.06,dec:1},
 {n:'Cherry',kind:'broad',R:[7,10],tr:[4,6],flex:1.1,bark:P(['#7a4a48','#5a3434','#341e22']),leaf:[L.chBl,L.oakSu,L.mpAu,null],off:0,dec:1,blossom:1},
 {n:'Pine',kind:'conifer',R:[7,10],H:[26,36],flex:.55,bark:P(['#b0603a','#80402c','#46221a']),leaf:[L.pi,L.pi,L.pi,L.piW],off:0},
 {n:'Spruce',kind:'conifer',R:[5,8],H:[30,44],flex:.45,bark:P(['#6e4a3a','#4e3428','#2c1e18']),leaf:[L.sp,L.sp,L.sp,L.spW],off:0},
 {n:'Palm',kind:'palm',H:[22,32],flex:1.5,bark:P(['#b39468','#8a6e4a','#5a462e']),leaf:[L.palm,L.palm,L.palm,L.palm],off:0},
 {n:'Kapok',kind:'broad',R:[12,17],tr:[7,10],flex:.8,bark:P(['#8a8070','#665c50','#3e3830']),leaf:[L.kp,L.kp,L.kp,L.kp],off:0,big:1},
 {n:'Acacia',kind:'acacia',R:[11,15],tr:[7,10],flex:.7,bark:P(['#7a5a3a','#5a402a','#33241a']),leaf:[L.acW,L.acW,L.acD,L.acD],off:0},
 {n:'Snag',kind:'dead',R:[6,10],tr:[10,15],flex:.25,bark:P(['#9a948c','#6e6a64','#403e3a']),leaf:[null,null,null,null],off:0},
 {n:'Shrub',kind:'bush',R:[4,6],flex:1.4,bark:P(['#6a4f36','#4e3a28','#2e2218']),leaf:[L.oakSp,L.oakSu,L.oakAu,null],off:.05,berries:1,dec:1,under:1},
 {n:'Fern',kind:'fern',R:[4,6],flex:1.6,bark:P(['#5a7a3a','#4a6a30','#2e4420']),leaf:[L.fern,L.fern,L.fern,L.fern],off:0,under:1}];
SPECIES.push({n:'Charred snag',kind:'dead',R:[6,10],tr:[10,15],flex:.25,bark:P(['#4a4643','#2e2b29','#1a1817']),leaf:[null,null,null,null],off:0});   // illustrative, for the dead/burnt type
const SI={};SPECIES.forEach((s,i)=>SI[s.n]=i);

// ---------------------------------------------------------------- procedural sprite generation (Sandbox genSprite)
// returns {px,w,h,ax,cb,cw,leafy}; o.pal overrides the leaf palette; o.leafIdx records leaf ramp index per pixel
function genSprite(sp,seed,size,season,o={}){
  const rng=mkRng(seed),pal=o.pal!==undefined?o.pal:sp.leaf[season],B=sp.bark;let w,h,px,ax,cb,cw,LI;const S=(x,y,c,li)=>{x|=0;y|=0;if(x>=0&&y>=0&&x<w&&y<h){px[y*w+x]=c;if(LI)LI[y*w+x]=li===undefined?255:li;}};
  const branches=(x,y,a,len,d,col)=>{for(let s=0;s<len;s++){x+=Math.cos(a);y+=Math.sin(a);S(x,y,col[d>2?1:2],20+(d>2?1:2));if(d>3)S(x+1,y,col[2],22);}if(d<=0){S(x,y-1,col[1],21);return;}const n=rng()<.3?3:2;for(let k=0;k<n;k++)branches(x,y,a+(k-(n-1)/2)*(.55+rng()*.3),len*(.62+rng()*.18),d-1,col);};
  const mk=(ww,hh)=>{w=ww;h=hh;px=new Uint32Array(w*h);if(o.leafIdx){LI=new Uint8Array(w*h).fill(255);}};
  if(sp.kind==='broad'||sp.kind==='bush'||sp.kind==='acacia'||sp.kind==='dead'){
    const R=Math.round((sp.R[0]+(sp.R[1]-sp.R[0])*rng())*size),flat=sp.kind==='acacia',bush=sp.kind==='bush';
    const tr=bush?0:Math.round((sp.tr[0]+(sp.tr[1]-sp.tr[0])*rng())*size);const ry=flat?R*.42:R*.85;
    mk(Math.round(2*R*(flat?1.35:1)+5),Math.round(ry*2+tr+3));ax=(w/2)|0;const base=h-1,cx=ax,cy=Math.round(ry)+1;
    cb=Math.min(h,Math.round(cy+ry));cw=Math.round(R*(flat?1.35:1));
    if(!bush){const tw=Math.max(2,Math.round(R/4))+(sp.big?1:0),top=pal?cy+Math.round(ry*.35):cy-1;
      for(let y=top;y<=base;y++){const flare=y>=base-1?(base-y===0?2:1):0;for(let dx=-((tw/2)|0)-flare;dx<tw-((tw/2)|0)+flare;dx++){const x=cx+dx;const rel=(dx+((tw/2)|0))/Math.max(1,tw-1);let c=rel<.34?B[0]:rel>.7?B[2]:B[1],li=rel<.34?20:rel>.7?22:21;
        if(sp.birch){c=B[0];li=20;if(rel>.7){c=B[1];li=21;}if(hash2(x+seed,y>>1)<.22&&((y+x)&1)){c=B[2];li=22;}}else if(hash2(x*5+seed,y)<.12){c=B[2];li=22;}S(x,y,c,li);}}
      if(flat){for(let k=-1;k<=1;k+=2)for(let s=0;s<R*.7;s++)S(cx+k*s,top-s*.55,B[1],21);}}
    if(!pal){if(sp.kind!=='bush'){const ty=bush?base:cy+Math.round(ry*.2);branches(cx,ty,-Math.PI/2,bush?R*.5:R*(sp.kind==='dead'?.75:.55),bush?2:(sp.kind==='dead'?3:4),B);if(sp.kind==='dead'){for(let y=0;y<4;y++)S(cx,cy-ry*.8+y,0);}}
      if(bush)for(let k=-1;k<=1;k+=2){branches(cx+k,base,-Math.PI/2+k*.45,R*.5,1,B);} }
    else{const n=flat?7:(5+((R/3)|0)),cl=[[cx,cy,R*(flat?.55:.62)]];
      for(let k=0;k<n;k++){const a=rng()*6.283,d=Math.sqrt(rng())*R*(flat?1:.55);cl.push([cx+Math.cos(a)*d*(flat?1.25:1),cy+Math.sin(a)*d*(flat?.28:.72),R*(flat?.38:.42+rng()*.2)]);}
      cl.sort((a,b)=>a[1]-b[1]);
      for(const [ccx,ccy,rr] of cl){const ryy=rr*(flat?.6:.9);for(let y=Math.floor(ccy-ryy-1);y<=ccy+ryy+1;y++)for(let x=Math.floor(ccx-rr-1);x<=ccx+rr+1;x++){
        const dx=(x-ccx)/rr,dy=(y-ccy)/ryy,d=dx*dx+dy*dy;if(d>1-hash2(x*7+seed,y*3+seed)*.28)continue;
        let l=-(dx*.6+dy*.8)*.75-((x-cx)/R*.35+(y-cy)/ry*.45)+(hash2(x+seed*3,y)-.5)*.42;let r=l>.55?0:l>.15?1:l>-.3?2:3;
        if(d>.72&&dx*.6+dy*.8>.25)r=4;else if(y>cy+ry*.55&&r<3)r++;let c=pal[r],li=r;
        if(sp.blossom&&season===0&&hash2(x*3,y*5+seed)<.08){c=WHITE;li=10;}if(sp.berries&&(season===1||season===2)&&hash2(x*11+seed,y*7)<.035&&r<4){c=BERRY;li=11;}S(x,y,c,li);}}}
  }else if(sp.kind==='conifer'){
    const R=Math.round((sp.R[0]+(sp.R[1]-sp.R[0])*rng())*size),H=Math.round((sp.H[0]+(sp.H[1]-sp.H[0])*rng())*size);
    mk(2*R+3,H+4);ax=(w/2)|0;const cx=ax,base=h-1,tTop=base-3;const k=4+((H/12)|0),step=(H-2)/k;cw=R;cb=tTop+1;const snow=season===3&&!o.noSnow;
    for(let y=tTop-2;y<=base;y++)for(let x=cx-1;x<=cx;x++)S(x,y,x<cx?B[0]:B[1],x<cx?20:21);
    for(let i=k-1;i>=0;i--){const bot=tTop-i*step*.95,tw=R*(1-i/k*.82),th=step*1.75,top=bot-th;
      for(let y=Math.floor(top);y<=bot;y++){const t=(y-top)/th;let half=tw*Math.pow(Math.max(0,t),.9);if(y>=bot-1&&hash2((y*3+i)|0,seed)<.5)half+=1;
        for(let x=Math.round(cx-half);x<=Math.round(cx+half);x++){let r=x<cx-half*.4?1:x<cx+half*.2?2:3;if(t<.3&&x<=cx)r=0;if(y>=bot-1)r=x<cx?3:4;let c=pal[r],li=r;
          if(snow&&(y-top)<th*.3&&hash2((x>>1)*5+seed+i,y*7)<.62){c=x>cx+half*.25?SNOW[1]:SNOW[0];li=12;}else if(snow&&y===Math.floor(top)+1){c=SNOW[0];li=12;}S(x,y,c,li);}}}
    S(cx,Math.floor(tTop-(k-1)*step*.95-step*1.75)-1,snow?SNOW[0]:pal[1],snow?12:1);
  }else if(sp.kind==='palm'){
    const H=Math.round((sp.H[0]+(sp.H[1]-sp.H[0])*rng())*size);mk(36,H+10);ax=18;const base=h-1,bend=(rng()-.5)*10;cw=14;cb=12;
    let tx=ax,ty=base;for(let s=0;s<=H;s++){const t=s/H;tx=ax+bend*t*t;ty=base-s;const ring=(s>>1)&1;S(tx,ty,ring?B[1]:B[0],ring?21:20);S(tx+1,ty,B[2],22);}
    const n=7;for(let f=0;f<n;f++){const a=-Math.PI+f/(n-1)*Math.PI+(rng()-.5)*.25,Lf=11+rng()*4;for(let s=1;s<Lf;s++){const t=s/Lf,x=tx+Math.cos(a)*s*1.05,y=ty+Math.sin(a)*s*.55+t*t*6;
      S(x,y,pal[1],1);S(x,y+1,pal[3],3);if(s%2===0&&s<Lf-1){S(x+Math.sin(a),y+1.5,pal[2],2);S(x-Math.sin(a)*.5,y-1,pal[0],0);}}}
    S(tx-1,ty+1,COCO);S(tx+1,ty+1,COCO);S(tx,ty+2,COCO);
  }else{ // fern
    const R=Math.round((sp.R[0]+(sp.R[1]-sp.R[0])*rng())*size);mk(2*R+5,R+4);ax=(w/2)|0;cw=R;cb=h;const base=h-1;
    for(let f=0;f<7;f++){const a=-Math.PI+.25+f/6*(Math.PI-.5);for(let s=0;s<R*1.3;s++){const t=s/(R*1.3),x=ax+Math.cos(a)*s*1.05,y=base+Math.sin(a)*s*.75+t*t*3;S(x,y,pal[t<.4?2:1],t<.4?2:1);if(s%2)S(x,y+1,pal[3],3);if(s%3===1)S(x-Math.sin(a),y,pal[0],0);}}}
  return {px,w,h,ax,cb:Math.max(2,Math.min(h,cb)),cw,leafy:!!pal,li:LI};}
const NV=6,SIZES=[.75,.85,1,1,1.15,1.35];
const SPRC=new Map();
function spr(si,v,s){const k=si*100+v*10+s;let S=SPRC.get(k);if(!S){S=genSprite(SPECIES[si],1000+si*97+v*13,SIZES[v],s);SPRC.set(k,S);}return S;}
function sprCanvas(S,scale=1){const c=document.createElement('canvas');c.width=S.w;c.height=S.h;const g=c.getContext('2d');const id=g.createImageData(S.w,S.h);new Uint32Array(id.data.buffer).set(S.px);g.putImageData(id,0,0);return c;}

// ---------------------------------------------------------------- climate & biomes (Sandbox BIOMES)
const BIOMES=[
 {n:'Boreal taiga',dens:.6,und:.22,w:{Spruce:6,Pine:3,Birch:1,Snag:.3},ug:{Shrub:1},col:'#2f5a4a'},
 {n:'Mixed forest',dens:.75,und:.3,w:{Pine:3.5,Oak:2.5,Birch:2,Spruce:1,Maple:1},ug:{Shrub:1},col:'#3f6e3f'},
 {n:'Birch grove',dens:.45,und:.25,w:{Birch:7,Pine:1.5,Oak:.5},ug:{Shrub:1},col:'#8aa64e'},
 {n:'Temperate deciduous',dens:.7,und:.35,w:{Oak:3.5,Maple:3,Birch:1,Cherry:1.2},ug:{Shrub:1},col:'#4f8a3a'},
 {n:'Open oak woodland',dens:.2,und:.15,w:{Oak:5,Maple:.5,Snag:.4},ug:{Shrub:1},col:'#a2ac5e'},
 {n:'Tropical rainforest',dens:.78,und:.5,w:{Kapok:5,Palm:3},ug:{Fern:6,Shrub:1},col:'#1f6a3a'},
 {n:'Savanna',dens:.09,und:.08,w:{Acacia:7,Snag:1},ug:{Shrub:1},col:'#c9b064'}];
const biomeOf=(T,M)=>T<.3?0:T<.48?(M>.5?1:2):T<.7?(M>.42?3:4):(M>.5?5:6);
const BIOME_TM=[[.15,.5],[.39,.7],[.39,.3],[.59,.7],[.59,.2],[.85,.75],[.85,.25]];   // a representative point inside each Sandbox band
const CM=[[128,150,110],[196,178,98],[70,118,92],[64,146,60]];

// Bridson Poisson-disk (Sandbox variant: candidates at r*(1+rand), k tries)
function poisson(W,H,r,k,rng,o={}){const cs=r/Math.SQRT2,gw=Math.ceil(W/cs),gh=Math.ceil(H/cs),grid=new Int32Array(gw*gh).fill(-1),pts=[],active=[];
  const m=o.margin||2;const add=(x,y)=>{pts.push([x,y]);active.push(pts.length-1);grid[((y/cs)|0)*gw+((x/cs)|0)]=pts.length-1;};add(o.sx!==undefined?o.sx:W/2,o.sy!==undefined?o.sy:H/2);
  while(active.length){const ai=(rng()*active.length)|0,[px,py]=pts[active[ai]];let found=false;
    for(let t=0;t<k;t++){const a=rng()*6.283,d=r*(1+rng());const x=px+Math.cos(a)*d,y=py+Math.sin(a)*d;if(x<m||y<m||x>=W-m||y>=H-m)continue;const gx=(x/cs)|0,gy=(y/cs)|0;let ok=true;
      for(let yy=Math.max(0,gy-2);yy<=Math.min(gh-1,gy+2)&&ok;yy++)for(let xx=Math.max(0,gx-2);xx<=Math.min(gw-1,gx+2);xx++){const q=grid[yy*gw+xx];if(q>=0){const dx=pts[q][0]-x,dy=pts[q][1]-y;if(dx*dx+dy*dy<r*r){ok=false;break;}}}
      if(ok){add(x,y);found=true;break;}}if(!found)active.splice(ai,1);}return pts;}
function pickSpecies(weights,x,y,rng,contrast=1,scale=90){let tot=0;const ws=[];for(const n in weights){const si=SI[n];const nz=vnoise(x/scale+si*13,y/scale+si*7);const w=weights[n]*lerp(1,.3+1.4*nz,contrast);ws.push([si,w]);tot+=w;}
  let r=rng()*tot;for(const [si,w] of ws){r-=w;if(r<=0)return si;}return ws[0][0];}
// a small Sandbox-style forest: o.biome (index) or o.biomeAt(x,y); o.path(y)->x; o.wrap for a seamless x
function buildForest(W,H,o={}){const rng=mkRng(o.seed||7),trees=[];const bAt=o.biomeAt||(()=>o.biome);
  const pts=poisson(W,H+(o.extraH||0),o.r||9,o.k||24,rng,{margin:o.margin!==undefined?o.margin:2});
  for(const [x,y0] of pts){const y=y0-(o.extraH||0)/2;if(o.path&&Math.abs(x-o.path(y))<(o.pathW||14))continue;if(o.reject&&o.reject(x,y,0))continue;const bi=bAt(x,y);if(bi<0)continue;const b=BIOMES[bi];
    if(rng()>b.dens*(o.densMul||1)*(.55+.9*vnoise(x/60+40+(o.seed||0),y/60)))continue;
    const sp=o.pick?o.pick(b,x,y,rng):pickSpecies(b.w,x,y,rng);let v=(rng()*NV)|0;if(v===5&&rng()<.6)v=3;trees.push({x:Math.round(x),y:Math.round(y),sp,v,ph:rng()*6.28,off:SPECIES[sp].off+(rng()-.5)*.3,shake:0,sw:0,bi});}
  if(o.und!==false){for(const [x,y0] of poisson(W,H+(o.extraH||0),7,12,rng)){const y=y0-(o.extraH||0)/2;if(o.path&&Math.abs(x-o.path(y))<(o.pathW||14)*.7)continue;if(o.reject&&o.reject(x,y,1))continue;const bi=bAt(x,y);if(bi<0)continue;const b=BIOMES[bi];if(rng()>b.und*(o.undMul||1))continue;
    const sp=pickSpecies(b.ug,x,y,rng);trees.push({x:Math.round(x),y:Math.round(y),sp,v:(rng()*NV)|0,ph:rng()*6.28,off:SPECIES[sp].off+(rng()-.5)*.3,shake:0,sw:0,u:1,bi});}}
  if(o.wrap){const r=o.r||9;for(let i=trees.length-1;i>=0;i--){const t=trees[i];if(t.x<W-r)continue;if(trees.some(q=>q!==t&&q.x<r&&Math.hypot(q.x+W-t.x,q.y-t.y)<(t.u||q.u?5:r)))trees.splice(i,1);}}
  return trees;}

// ground colour (Sandbox genGround, per pixel)
function groundCol(T,M,bio,s,den,x,y,o={}){let r=0,g=0,b=0;for(let k=0;k<3;k++){const c=(CM[0][k]*(1-T)+CM[1][k]*T)*(1-M)+(CM[2][k]*(1-T)+CM[3][k]*T)*M;if(k===0)r=c;else if(k===1)g=c;else b=c;}
  const h=hash2(x,y);const dec=(bio>=1&&bio<=4)?1:0;
  if(s===0){r*=1.03;g*=1.07;b*=.98;}else if(s===2&&dec){r=r*.72+168*.28;g=g*.72+138*.28;b=b*.72+70*.28;}
  const lit=bio===0?[96,78,58]:bio===5?[60,74,40]:[108,92,60];const dk=den*.45;r=r*(1-dk)+lit[0]*dk;g=g*(1-dk)+lit[1]*dk;b=b*(1-dk)+lit[2]*dk;
  const v=.92+vnoise(x/40,y/40)*.16;let m=(.9+h*.18)*v;if(hash2(x*3,y)<.05)m*=.82;else if(h<.03)m*=1.12;r*=m;g*=m;b*=m;
  if(s===3){if(T<.62||o.allSnow){const snowAmt=1-den*(o.intercept===false?0:.65);if(hash2(x*7,y*5)<snowAmt*(T<.5||o.allSnow?1:.75)){const sh=.94+h*.08;r=236*sh;g=242*sh;b=250*sh;if(hash2(x,y*3)<.04){r=200;g=210;b=230;}}}else{r=r*.8+150*.2;g=g*.8+140*.2;b=b*.8+100*.2;}}
  if(s<2&&(bio===2||bio===3||bio===4)&&hash2(x*13,y*17)<.004){const fc=[[240,236,224],[242,210,92],[180,120,220],[220,90,90]][(h*4)|0];r=fc[0];g=fc[1];b=fc[2];}
  if(s===2&&dec&&hash2(x*11,y*13)<.02+den*.06){const lc=[[214,142,58],[192,58,48],[236,200,90],[160,96,48]][(h*4)|0];r=lc[0];g=lc[1];b=lc[2];}
  return pack(r,g,b);}
function pathCol(s,snowy,x,y){const h=hash2(x,y),dm=.9+h*.15;let r=(s===3&&snowy?190:128)*dm,g=(s===3&&snowy?184:102)*dm,b=(s===3&&snowy?180:72)*dm;return pack(r,g,b);}
// canopy-density grid (16 px cells, Sandbox: +0.34 per tree, one blur pass)
function densityGrid(trees,W,H,DG=16){const DW=Math.ceil(W/DG)+1,DH=Math.ceil(H/DG)+1,D=new Float32Array(DW*DH);for(const t of trees){if(t.u)continue;const k=clamp((t.y/DG)|0,0,DH-1)*DW+clamp((t.x/DG)|0,0,DW-1);D[k]+=.34;}
  const tmp=D.slice();for(let y=1;y<DH-1;y++)for(let x=1;x<DW-1;x++){const i=y*DW+x;D[i]=Math.min(1,(tmp[i]*4+tmp[i-1]+tmp[i+1]+tmp[i-DW]+tmp[i+DW])/8);}
  return (x,y)=>D[clamp((y/DG)|0,0,DH-1)*DW+clamp((x/DG)|0,0,DW-1)];}
// bake a ground for a small scene; tm(x,y)->[T,M]; o.path(y)->x
function bakeGround(W,H,trees,s,tm,o={}){const out=new Uint32Array(W*H),den=densityGrid(trees,W,H);
  for(let y=0;y<H;y++){const pxp=o.path?o.path(y):-999;for(let x=0;x<W;x++){const [T,M]=tm(x,y);const bio=o.bio!==undefined?o.bio:biomeOf(T,M);let c=groundCol(T,M,bio,s,den(x,y),x+(o.ox||0),y+(o.oy||0),o);
    const dp=Math.abs(x-pxp);if(dp<(o.pw||6)-(hash2(y,x)<.5?1:0)){c=pathCol(s,T<.62,x,y);if(dp<1.5&&hash2(x,y>>1)<.3)c=mulc(c,.85,.85,.85);}out[y*W+x]=c;}}return out;}

// ---------------------------------------------------------------- software renderer
const SHADOWC=U('#0d1a10');
// blit a tree sprite with Sandbox band sway: rows [0,.35cb) ×2.2, [.35cb,.7cb) ×1.4, [.7cb,cb) ×0.7, trunk fixed
// o: sw (sway px), fade (0..1 dither keep), alpha (0..1 blend), cut {x,y,r}, tint [r,g,b], mix {px,p}, rot {a} (crown rotation about base)
function blit(fb,FW,FH,S,X,Y,o={}){X=Math.round(X);Y=Math.round(Y);const w=S.w,h=S.h,px=o.px||S.px,cb=S.cb,b1=Math.round(cb*.35),b2=Math.round(cb*.7),sw=o.sw||0;
  const o0=Math.round(sw*2.2),o1=Math.round(sw*1.4),o2=Math.round(sw*.7),fade=o.fade,al=o.alpha,cut=o.cut,mix=o.mix,tint=o.tint,smooth=o.smooth;
  for(let r=0;r<h;r++){const yy=Y+r;if(yy<0||yy>=FH)continue;const crown=r<cb;const off=o.noBands?0:r<b1?o0:r<b2?o1:r<cb?o2:0;
    for(let c=0;c<w;c++){let col=px[r*w+c];if(mix&&crown&&bay(X+c,yy)<mix.p*16){col=mix.px[r*w+c];}if(!(col>>>24))continue;const xx=X+c+off;if(xx<0||xx>=FW)continue;
      if(crown){if(fade!==undefined&&bay(xx,yy)>=fade*16)continue;if(cut){const dx=xx-cut.x,dy=yy-cut.y,d2=dx*dx+dy*dy;if(d2<cut.r*cut.r){if(!cut.rim||d2<(cut.r-2.5)**2||bay(xx,yy)<8)continue;}}}
      if(tint)col=mulc(col,tint[0],tint[1],tint[2]);
      const i=yy*FW+xx;if(al!==undefined&&crown)fb[i]=mix32(fb[i],col,al);else fb[i]=col;}}}
// rotate a sprite's crown around its trunk base (nearest neighbour), for shake and felling
function blitRot(fb,FW,FH,S,X,Y,a,o={}){X=Math.round(X);Y=Math.round(Y);const w=S.w,h=S.h,px=S.px,pxB=X+S.ax,pyB=Y+h-1,ca=Math.cos(a),sa=Math.sin(a),R=Math.hypot(w,h)+2;
  for(let yy=Math.floor(pyB-R);yy<=pyB+2;yy++){if(yy<0||yy>=FH)continue;for(let xx=Math.floor(pxB-R);xx<=pxB+R;xx++){if(xx<0||xx>=FW)continue;
    const dx=xx-pxB,dy=yy-pyB,sx=Math.round(dx*ca+dy*sa+S.ax),sy=Math.round(-dx*sa+dy*ca+h-1);if(sx<0||sy<0||sx>=w||sy>=h)continue;const col=px[sy*w+sx];if(!(col>>>24))continue;fb[yy*FW+xx]=o.tint?mulc(col,...o.tint):col;}}}
function shadeEllipse(mask,FW,FH,cx,cy,rx,ry,a){for(let y=Math.floor(cy-ry);y<=cy+ry;y++){if(y<0||y>=FH)continue;const dy=(y-cy)/ry,hw=rx*Math.sqrt(Math.max(0,1-dy*dy));
  for(let x=Math.round(cx-hw);x<=Math.round(cx+hw);x++){if(x<0||x>=FW)continue;const i=y*FW+x;if(mask[i]<a)mask[i]=a;}}}
function applyShade(fb,mask){for(let i=0;i<fb.length;i++){const a=mask[i];if(a>0)fb[i]=mix32(fb[i],SHADOWC,a);}}
function stackEllipse(fb,FW,FH,cx,cy,rx,ry,a){for(let y=Math.floor(cy-ry);y<=cy+ry;y++){if(y<0||y>=FH)continue;const dy=(y-cy)/ry,hw=rx*Math.sqrt(Math.max(0,1-dy*dy));
  for(let x=Math.round(cx-hw);x<=Math.round(cx+hw);x++){if(x<0||x>=FW)continue;const i=y*FW+x;fb[i]=mix32(fb[i],SHADOWC,a);}}}
const treeShadow=(t,S)=>{const sp=SPECIES[t.sp];const rx=Math.max(3,Math.round(S.cw*(sp.kind==='conifer'?.85:.95))),ry=Math.max(2,Math.round(rx*.45));return {cx:t.x+rx*.35,cy:t.y-1,rx,ry,a:S.leafy?(t.u?.22:.3):.1};};
const seasonIdx=(season,t)=>{const s=season+(t?t.off:0);return ((Math.floor(s+.5)%4)+4)%4;};
// Sandbox sway: wind·flex·(0.5·sin(1.7t+phase) + 1.2·(noise((x+0.35y)/80 − t·wind·1.3) − 0.35)) + shake·sin(30t)·2.6
const swayOf=(t,time,wind)=>{const sp=SPECIES[t.sp];const g=vnoise((t.x+t.y*.35)/80-time*wind*1.3,t.y/120)-.35;return wind*sp.flex*(.5*Math.sin(time*1.7+t.ph)+1.2*g)+t.shake*Math.sin(time*30)*2.6;};

// ---------------------------------------------------------------- the Sandbox player (7×12) in three modes
const PF=["..hhh..",".hhhhh.",".HHHHH.",".seses.",".sssss.","yccCccy","ccccccc","ccccccc",".CcccC."],PB=["..hhh..",".hhhhh.",".HHHHH.",".hhhhh.",".sssss.","ccccccc","ccccccc","ccccccc",".CcccC."],PS=["..hhh..",".hhhhh.",".HHHHH.","..ssse.","..ssss.",".cccc..","ccccc..",".cccc..",".CccC.."];
const LF=[[".ll.ll.",".ll.ll.",".bb.bb."],[".ll.ll.","..l.ll.","..b.bb."],[".ll.ll.",".ll.l..",".bb.b.."]],LS=[["..ll...","..ll...","..bbb.."],[".l..l..",".l...l.","bb...bb"],["..ll...",".ll....",".bb...."]];
const PC={h:'#c8443c',H:'#efe6dc',s:'#f0c09a',e:'#2a1b22',y:'#f2c14e',c:'#3c6fb4',C:'#2f5592',l:'#2a2c3a',b:'#5a3a28'};
const SILC=U('#f4f0c0');
const PSPR={};for(const dir of ['down','up','left','right'])for(let f=0;f<3;f++){const body=dir==='down'?PF:dir==='up'?PB:PS,legs=(dir==='down'||dir==='up')?LF[f]:LS[f],rows=body.concat(legs);
  const px=new Uint32Array(7*12);for(let r=0;r<12;r++)for(let c=0;c<7;c++){const ch=rows[r][dir==='left'?6-c:c];if(ch!=='.')px[r*7+c]=U(PC[ch]);}PSPR[dir+f]=px;}
function newWalker(x,y){return {x,y,dir:'down',anim:0,moving:false};}
const frameOf=p=>p.moving?[0,1,0,2][(p.anim|0)%4]:0;
// mode 0 normal, 1 shade (RGB ×0.58/0.64/0.74), 2 silhouette blend (75 % #f4f0c0); returns visible-pixel count when o.zb given
function drawPlayer(fb,FW,FH,p,camX,camY,mode=0,o={}){const px=PSPR[p.dir+frameOf(p)],X=Math.round(p.x-3-camX),Y=Math.round(p.y-11-camY);
  for(let r=0;r<12;r++){const yy=Y+r;if(yy<0||yy>=FH)continue;for(let c=0;c<7;c++){let col=px[r*7+c];if(!col)continue;const xx=X+c;if(xx<0||xx>=FW)continue;const i=yy*FW+xx;
    if(o.tint)col=mulc(col,...o.tint);if(mode===1)fb[i]=mulc(col,.58,.64,.74);else if(mode===2)fb[i]=mix32(fb[i],SILC,o.a||.75);else if(mode===3)fb[i]=o.col;else fb[i]=col;if(o.rec)o.rec.push(i,fb[i]);}}}
function walkerStep(p,dx,dy,sp,dt,blocked){const L=Math.hypot(dx,dy);if(L<.01){p.moving=false;p.anim=0;return;}const nx=p.x+dx/L*sp*dt,ny=p.y+dy/L*sp*dt;let mx=0,my=0;
  if(!blocked||!blocked(nx,p.y)){mx=nx-p.x;p.x=nx;}if(!blocked||!blocked(p.x,ny)){my=ny-p.y;p.y=ny;}p.moving=Math.abs(mx)+Math.abs(my)>.0005;
  if(p.moving){p.anim+=dt*8;if(Math.abs(dx)>Math.abs(dy))p.dir=dx>0?'right':'left';else p.dir=dy>0?'down':'up';}else p.anim=0;}
// crown-in-front test (Sandbox): base y > player y and crown rect overlaps the player's box
function inFront(t,S,p){if(t.u)return false;const r=[p.x-3,p.y-11,p.x+3,p.y];return t.y>p.y&&r[2]>t.x-S.cw-1&&r[0]<t.x+S.cw+1&&r[3]>t.y-S.h+1&&r[1]<t.y-S.h+1+S.cb;}

// ---------------------------------------------------------------- birds (Sandbox shapes)
const BF=[["#...#",".#.#.","..#.."],[".....","##.##","..#.."]];
function drawBirdFly(fb,FW,FH,x,y,fr,col){const s=BF[fr];for(let r=0;r<3;r++)for(let c=0;c<5;c++)if(s[r][c]==='#'){const xx=Math.round(x)-2+c,yy=Math.round(y)-1+r;if(xx>=0&&yy>=0&&xx<FW&&yy<FH)fb[yy*FW+xx]=col;}}
function drawBirdPerch(fb,FW,FH,x,y,c0,c1){const P=(xx,yy,c)=>{xx=Math.round(xx);yy=Math.round(yy);if(xx>=0&&yy>=0&&xx<FW&&yy<FH)fb[yy*FW+xx]=c;};P(x,y,c0);P(x+1,y,c0);P(x,y+1,c0);P(x+1,y+1,c0);P(x-1,y+1,c0);P(x+2,y,c1);P(x,y+1,c1);}

// a whole forest frame: ground, merged shadows (+flecks), y-sorted trees + player, occlusion
function drawForest(fb,W,H,trees,o){const camX=o.camX||0,camY=o.camY||0,p=o.player,time=o.time||0,wind=o.wind===undefined?.45:o.wind,occ=o.occ||'dither',WW=o.wrapW;
  if(o.ground)fb.set(o.ground.subarray?o.ground:o.ground);
  const vis=[];for(const t of trees){let x=t.x-camX;if(WW){x=((x%WW)+WW)%WW;if(x>W+60)x-=WW;}const s=o.seasonOf?o.seasonOf(t):seasonIdx(o.season||1,t);const S=spr(t.sp,t.v,s);
    if(x+S.w<0||x-S.w>W||t.y-camY-S.h>H||t.y-camY<-4)continue;vis.push({t,S,x,y:t.y-camY,s});}
  let inShade=false;if(o.shadows!==false){const mask=o.mask||(o.mask=new Float32Array(W*H));mask.fill(0);
    for(const v of vis){if(v.t.u&&SPECIES[v.t.sp].kind==='fern')continue;const sh=treeShadow(v.t,v.S);shadeEllipse(mask,W,H,v.x+sh.cx-v.t.x,v.y-1,sh.rx,sh.ry,sh.a);
      if(p&&v.S.leafy&&!v.t.u){const dx=(p.x-camX-(v.x+sh.cx-v.t.x))/sh.rx,dy=(p.y-camY-(v.y-1))/sh.ry;if(dx*dx+dy*dy<1)inShade=true;}}
    applyShade(fb,mask);
    if(o.dapple!==false){for(const v of vis){if(!v.S.leafy||v.t.u)continue;const sh=treeShadow(v.t,v.S);if(sh.rx<=5)continue;const cxs=v.x+sh.cx-v.t.x,cys=v.y-1;
      for(let k=0;k<3;k++){const a=hash2(v.t.x+k*31,v.t.y)*6.28,d=hash2(v.t.y+k,v.t.x)*.75;const fx=Math.round(cxs+Math.cos(a)*d*sh.rx+(v.t.sw||0)*.6+Math.sin(time*1.3+k+v.t.ph)*.8),fy=Math.round(cys+Math.sin(a)*d*sh.ry);
        for(let q=0;q<2;q++){const xx=fx+q;if(xx>=0&&xx<W&&fy>=0&&fy<H){const i=fy*W+xx;fb[i]=mix32(fb[i],U('#fbefb0'),.32);}}}}}}
  if(o.underlay)o.underlay(fb);
  const items=vis.map(v=>[v.t.y,v]);if(p)items.push([p.y+.5,null]);if(o.others)for(const q of o.others)items.push([q.y+.5,{npc:q}]);items.sort((a,b)=>a[0]-b[0]);let occluded=false,frontN=0;const rec=[];
  for(const [,v] of items){if(v&&v.npc){v.npc.rec=[];drawPlayer(fb,W,H,v.npc,camX,camY,0,{rec:v.npc.rec,tint:v.npc.tint});continue;}if(!v){drawPlayer(fb,W,H,p,camX,camY,(o.inShade!==undefined?o.inShade:inShade&&o.shadows!==false)?1:0,{rec});continue;}const t=v.t,S=v.S;const sw=o.noSway?0:swayOf(t,time,wind);t.sw=sw;
    const X=Math.round(v.x-S.ax),Y=Math.round(v.y-S.h+1);const front=p&&occ!=='none'&&inFront(t,S,{x:p.x-camX,y:p.y-camY});if(front){occluded=true;frontN++;}
    const bo={sw};if(o.mixOf){const m=o.mixOf(t,v.s);if(m)bo.mix=m;}
    if(front){if(occ==='dither')bo.fade=o.fadeP!==undefined?o.fadeP:.5;else if(occ==='alpha')bo.alpha=o.alphaV!==undefined?o.alphaV:.4;else if(occ==='cutaway')bo.cut={x:p.x-camX,y:p.y-camY-6,r:o.cutR||13,rim:o.cutRim};}
    if(o.fadeOf){const f=o.fadeOf(t);if(f!==undefined&&f<1){if(o.fadeMode==='alpha')bo.alpha=f;else bo.fade=f;}}
    if(t.rot)blitRot(fb,W,H,S,X,Y,t.rot);else blit(fb,W,H,S,X,Y,bo);
    if(o.perTree)o.perTree(t,X,Y,S,v);}
  if(o.others)for(const q of o.others){let n=0;for(let k=0;k<q.rec.length;k+=2)if(fb[q.rec[k]]===q.rec[k+1])n++;q.vis=q.rec.length?n/(q.rec.length/2):1;}
  let pv=0;for(let k=0;k<rec.length;k+=2)if(fb[rec[k]]===rec[k+1])pv++;const pvis=rec.length?pv/(rec.length/2):1;
  if(occluded&&occ==='silhouette'&&p)drawPlayer(fb,W,H,p,camX,camY,2);
  return {vis:vis.length,occluded,inShade,frontN,pvis};}

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
  const q=$('#idxq');if(q){const rows=$$('#idxt tbody tr'),n=$('#idxn'),chips=$$('.chips[data-idx] button');
    const f=()=>{const v=q.value.trim().toLowerCase();let c=0;rows.forEach(r=>{const m=!v||v.split('|').some(t=>r.textContent.toLowerCase().includes(t));r.hidden=!m;if(m)c++;});n.textContent=`${c} of ${rows.length} entries`;
      chips.forEach(b=>b.classList.toggle('on',b.dataset.q===v));};
    q.addEventListener('input',f);chips.forEach(b=>b.addEventListener('click',()=>{q.value=q.value===b.dataset.q?'':b.dataset.q;f();}));f();}
}
document.addEventListener('DOMContentLoaded',()=>{chrome();$$('[data-demo]').forEach(el=>io.observe(el));});
