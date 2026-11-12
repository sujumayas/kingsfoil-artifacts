// Grass study: figures 3 (drawcalls, seasons, wetsnow, biomecolor, reducemotion, costs, matrix, score)
{
// ----------------------------------------------------------------------
// small styles only these figures use
// ----------------------------------------------------------------------
{const st=document.createElement('style');st.textContent=
'.h3-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:8px}'+
'.h3-strip div{font-size:11.5px;color:var(--mute);line-height:1.3;min-width:0}'+
'.h3-strip div.on{color:var(--txt)}'+
'.h3-strip span{display:flex;height:12px;margin-bottom:3px;border:1px solid transparent;border-radius:2px;overflow:hidden}'+
'.h3-strip div.on span{border-color:var(--warm)}'+
'.h3-strip span i{flex:1}'+
'.h3-two{display:grid;grid-template-columns:min(38%,240px) minmax(0,1fr);gap:10px;align-items:start}'+
'.h3-ax{margin:4px 0 0;font-size:11.5px;color:var(--mute);line-height:1.35}'+
'.h3-cost{list-style:none;margin:8px 0 0;padding:0;font-size:12.5px;color:var(--mute);line-height:1.5}'+
'.h3-cost li{padding-left:14px;position:relative}'+
'.h3-cost li::before{content:"";position:absolute;left:0;top:.55em;width:7px;height:7px;border-radius:50%;background:var(--ice2)}'+
'.h3-cost li.off{opacity:.5;text-decoration:line-through}'+
'.h3-cost li.off::before{background:var(--line2)}'+
'.h3-pt{cursor:pointer;outline:none}';
document.head.appendChild(st);}

// ----------------------------------------------------------------------
// shared bits: ramps (index 0 deepest shadow .. 5 highlight; tufts use 1..5,
// ground uses 1..3), a hue helper, a cost meter and a number format
// ----------------------------------------------------------------------
const R6=a=>Uint32Array.from(a,U);
const hueOf=h=>{const r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,b=parseInt(h.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return 0;
  const H=mx===r?((g-b)/d+6)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return Math.round(H*60)%360;};
const mtr=()=>{let s=-1,t0=0;return {a(){t0=performance.now();},b(){const d=performance.now()-t0;s=s<0?d:s+(d-s)*.08;return s;},get v(){return Math.max(0,s);}};};
const f3=v=>v<.001?v.toFixed(5):v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);
// season ramps, anchored on Stardew's debris colours at index 4 (H1): spring (60,180,58), summer (110,190,24), fall (219,102,58).
// Shadows lean toward teal, highlights toward yellow.
const SEA_HEX={
  spring:['#152a2a','#1e4834','#2b6c3a','#3a9440','#3cb43a','#a6d860'],
  summer:['#1a2a26','#26442a','#3a6426','#508a20','#6ebe18','#c4dc54'],
  fallSD:['#241c24','#4a2a2a','#7a3a2c','#a84e30','#db663a','#f2a35e'],
  fallST:['#22261e','#3e4028','#6a6232','#967e3c','#c4a64a','#e6d48a'],
  winter:['#262c34','#3a4448','#525e5a','#6e7868','#8c927c','#aeae98']};
const SEA={};for(const k in SEA_HEX)SEA[k]=R6(SEA_HEX[k]);
// whole-pixel stepped sway (C5): q is time snapped to 5 fps
const step5=t=>Math.floor(t*5)/5;
// write a tone sprite's tones into a Uint8 buffer (drawTuft with an identity palette)
const IDP=[0,1,2,3,4,5];
// per-pixel tone of a tuft sprite: calls fn(x,y,tone,k,h) with k = rows above the root
function tuftEach(s,x,y,shear,fn,flip){const x0=Math.round(x-(s.w-1)/2),yb=Math.round(y);
  for(let j=0;j<s.h;j++){const k=s.h-1-j,off=Math.round(shear*(s.h>1?k/(s.h-1):0));for(let i=0;i<s.w;i++){const t=s.a[j*s.w+(flip?s.w-1-i:i)];if(t)fn(x0+i+off,yb-k,t,k,s.h);}}}
const segDist=(P,x,y)=>{let bd=1e9;for(let k=0;k<P.length-1;k++){const a=P[k],b=P[k+1],dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=((x-a[0])*dx+(y-a[1])*dy)/L;t=t<0?0:t>1?1:t;const ex=a[0]+dx*t-x,ey=a[1]+dy*t-y,d=ex*ex+ey*ey;if(d<bd)bd=d;}return Math.sqrt(bd);};
const countColours=u=>{const s=new Set();for(let i=0;i<u.length;i++)s.add(u[i]);return s.size;};

// ======================================================================
// H1 seasons: palette per season, per-tile phenology offset p, dither crossfade
// ======================================================================
reg('seasons',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),W=P.W,H=P.H,u=P.u32,ro=$('[data-ro]',root),strip=$('[data-strip]',root),m=mtr();
  const N=W*H,TS=8,TW=Math.ceil(W/TS),TH=Math.ceil(H/TS),NT=TW*TH;
  const KIND=new Uint8Array(N),TONE=new Uint8Array(N),OWN=new Uint16Array(N),FLC=new Uint8Array(N);
  const elev=(x,y)=>sat(1.05-y/H*1.15+(vnoise(x/30+4,y/22+1)-.5)*.7);
  const pcx=W*.77,pcy=H*.8,prx=W*.14,pry=H*.12;
  const pond=(x,y)=>Math.hypot((x-pcx)/prx,(y-pcy)/pry)+(vnoise(x/5,y/5)-.5)*.22;
  const PATH=[[-4,H*.36],[W*.18,H*.42],[W*.34,H*.56],[W*.48,H*.66],[W*.6,H*.76]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,pd=pond(x,y),r=hash2(x*7+3,y*13+1);OWN[i]=((y/TS)|0)*TW+((x/TS)|0);
    if(pd<1){KIND[i]=2;TONE[i]=pd<.55?0:pd<.84?1:2;if(((x*3+y*7)%23)===0&&pd<.8)TONE[i]=3;}
    else if(pd<1.13){KIND[i]=3;TONE[i]=r<.5?1:0;if(y<pcy&&pd<1.06)TONE[i]=2;}
    else{const pdd=segDist(PATH,x,y)+(vnoise(x/4,y/4)-.5)*1.3;
      if(pdd<2.6){KIND[i]=1;TONE[i]=pdd<1.6?(r<.15?4:3):2;if(r<.05)TONE[i]=1;}
      else{const n=vnoise(x/7,y/5)*.65+r*.35;TONE[i]=n<.33?1:n<.66?2:3;if(pdd<3.6)TONE[i]=1;}}}
  // tufts: a jittered grid on grass only, three sprite sizes, written into the tone buffer with the owner tile of the root
  const rng=mkRng(91),tufts=[];
  for(let gy=0;gy<H/6+1;gy++)for(let gx=0;gx<W/6+1;gx++){const x=Math.round((gx+rng())*6),y=Math.round((gy+rng())*6);if(x<2||y<4||x>=W-2||y>=H)continue;
    const i=y*W+x;if(KIND[i]!==0||segDist(PATH,x,y)<4.5||pond(x,y)<1.3||rng()<.35)continue;const e=elev(x,y);tufts.push({x,y,s:e>.62&&rng()<.5?TUFT.short:rng()<.3?TUFT.tall:TUFT.mid,fl:rng()<.5});}
  tufts.sort((a,b)=>a.y-b.y);
  for(const t of tufts){const own=((Math.min(H-1,t.y)/TS)|0)*TW+((t.x/TS)|0);
    tuftEach(t.s,t.x,t.y,0,(x,y,tn)=>{if(x<0||y<0||x>=W||y>=H)return;const j=y*W+x;if(KIND[j]>1&&KIND[j]!==4)return;KIND[j]=0;TONE[j]=tn;OWN[j]=own;},t.fl);
    for(let dx=-2;dx<=2;dx++){const x=t.x+dx,y=t.y+1;if(x>=0&&y<H&&x<W&&KIND[y*W+x]===0&&TONE[y*W+x]<=3)TONE[y*W+x]=0;}}
  // spring flowers: a plus of petals around a yellow eye, on open ground
  const FLW=[0,U('#f4f0e0'),U('#f2d04a'),U('#e88ab0'),U('#9a7ad8')];
  for(let k=0;k<70;k++){const x=2+(rng()*(W-4))|0,y=2+(rng()*(H-4))|0;if(pond(x,y)<1.4||segDist(PATH,x,y)<4||vnoise(x/22+7,y/22)<.45)continue;const col=1+((vnoise(x/30,y/30+5)*4)|0)%4;
    for(const [dx,dy,cc] of [[0,0,2],[1,0,col],[-1,0,col],[0,-1,col],[0,1,col]]){const j=(y+dy)*W+x+dx;if(KIND[j]!==0||TONE[j]>3)continue;KIND[j]=4;FLC[j]=cc;TONE[j]=3;}}
  // per-tile phenology offset: p = hash*0.25 + elevation term + moisture term (weights ours)
  const PH=new Float32Array(NT);
  for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const x=tx*TS+4,y=ty*TS+4,e=elev(x,y),mo=sat(1.6-pond(x,y)*.55);PH[ty*TW+tx]=hash2(tx+17,ty+93)*.25+e*.3-mo*.2;}
  const DIRT=R6(['#241a18','#3e2c24','#5e4432','#7e5e44','#a07e5c']),WAT=R6(['#1d3654','#28507a','#3a7096','#86bccc']),ICE=R6(['#7d97b4','#a6bcd2','#cddbe8','#eef4fa']),MUD=R6(['#2a2622','#3e362c','#54483a']);
  const NAMES=['Spring','Summer','Fall','Winter'],cur=new Uint8Array(NT),prv=new Uint8Array(NT),bl=new Float32Array(NT);
  let playT=0;
  const ramps=()=>[SEA.spring,SEA.summer,c.segv('fall')==='sd'?SEA.fallSD:SEA.fallST,SEA.winter];
  function paintStrip(si){const keys=['spring','summer',c.segv('fall')==='sd'?'fallSD':'fallST','winter'];
    strip.innerHTML=keys.map((k,j)=>`<div class="${j===si?'on':''}"><span>${SEA_HEX[k].map(h=>`<i style="background:${h}"></i>`).join('')}</span>${NAMES[j]} ${hueOf(SEA_HEX[k][4])}°${j===2?(k==='fallSD'?' (Stardew)':' (straw)'):j===3?' (dormant)':''}</div>`).join('');}
  let lastSi=-1,lastFall='';
  function draw(){m.a();const t=c.v('t')/100,offs=c.v('off'),SR=ramps(),cnt=[0,0,0,0];
    for(let k=0;k<NT;k++){const s=t+(offs?PH[k]:0),fl=Math.floor(s),fr=s-fl;cur[k]=((fl%4)+4)%4;prv[k]=(((fl-1)%4)+4)%4;bl[k]=offs&&fr<.05?fr/.05:1;cnt[cur[k]]++;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=OWN[i],b=bl[k],sea=b>=1||b*16>bay(x,y)+.5?cur[k]:prv[k],kd=KIND[i],tn=TONE[i];
      u[i]=kd===0?SR[sea][tn]:kd===4?(sea===0?FLW[FLC[i]]:SR[sea][tn]):kd===1?DIRT[tn]:kd===2?(sea===3?ICE[tn]:WAT[tn]):MUD[tn];}
    P.put();const ms=m.b();
    const g=Math.floor(t)%4,fr=c.segv('fall');setHud(root,`${NAMES[g]} · season_t ${t.toFixed(2)}`);
    if(g!==lastSi||fr!==lastFall){paintStrip(g);lastSi=g;lastFall=fr;}
    const pc=cnt.map(v=>Math.round(v/NT*100));
    ro.innerHTML=`Tiles now: spring <b>${pc[0]}%</b> · summer <b>${pc[1]}%</b> · fall <b>${pc[2]}%</b> · winter <b>${pc[3]}%</b>`+(offs?'':' <span style="color:#ff8f7a">(no offsets: the whole field flips in one frame)</span>')+
      `<br>This palette pass: <b>${f3(ms)} ms</b> in JS for ${W}×${H} px, measured here. Report: one hash and one palette lookup per pixel, a GPU pass of the 0.0021 ms class at 320×180 on the M4 [S12]. Network: one float per region per minute.`;}
  c.on('t',draw);c.on('off',draw);c.seg('fall',draw);c.on('play',()=>{});
  draw();
  return {tick(dt){if(!c.v('play'))return;playT+=dt;const e=c.el('t');let v=+e.value+dt*16;if(v>=400)v-=400;e.value=v.toFixed(1);draw();}};});

// ======================================================================
// H2 wet, dry, frost and snow: ramp swaps (left) against an alpha wash (right)
// ======================================================================
reg('wetsnow',root=>{const c=ctl(root),cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,ro=$('[data-ro]',root),mA=mtr(),mB=mtr();
  const N=W*H,KIND=new Uint8Array(N),TONE=new Uint8Array(N),SN=new Float32Array(N);
  const PATH=[[-4,H*.78],[W*.3,H*.64],[W*.55,H*.58],[W*.8,H*.4],[W+4,H*.3]];
  const STONES=[[W*.2,H*.32,4,3],[W*.7,H*.78,5,3],[W*.86,H*.62,3,2]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,r=hash2(x*5+1,y*11+2),pd=segDist(PATH,x,y)+(vnoise(x/4,y/4)-.5)*1.4;SN[i]=vnoise(x/9,y/5)*.7+r*.3;
    let st=-1;for(const [sx,sy,rx,ry] of STONES){const dx=(x-sx)/rx,dy=(y-sy)/ry,d=dx*dx+dy*dy;if(d<1){st=dy<-.3?3:dx<-.2?2:d>.6?0:1;}}
    if(st>=0){KIND[i]=2;TONE[i]=st;}
    else if(pd<3.4){KIND[i]=1;TONE[i]=pd<2.2?(r<.15?5:4):3;if(r<.05)TONE[i]=2;}
    else{const n=vnoise(x/7,y/5)*.65+r*.35;TONE[i]=n<.33?1:n<.66?2:3;if(pd<4.4)TONE[i]=1;}}
  const rng=mkRng(37),tufts=[];
  for(let gy=0;gy<H/7+1;gy++)for(let gx=0;gx<W/7+1;gx++){const x=Math.round((gx+rng())*7),y=Math.round((gy+rng())*7);if(x<3||y<6||x>=W-3||y>=H)continue;
    if(KIND[y*W+x]!==0||segDist(PATH,x,y)<5||rng()<.25)continue;const r=rng();tufts.push({x,y,s:r<.3?TUFT.tall:r<.75?TUFT.mid:TUFT.short,fl:rng()<.5,sw:rng()<.4,ph:rng()*6.283});}
  tufts.sort((a,b)=>a.y-b.y);
  // ramps: normal green; wet = +10% saturation, read one step down for shadows; straw; frost; snow with blue shadows
  const GR_HEX=['#16302c','#21503a','#2f7440','#46963f','#6cb444','#b6dc6a'],GR=R6(GR_HEX);
  const satK=(c32,k)=>{const a=un32(c32),l=.299*a[0]+.587*a[1]+.114*a[2];return pack(l+(a[0]-l)*k,l+(a[1]-l)*k,l+(a[2]-l)*k);};
  const GRW=GR.map(v=>satK(v,1.1));
  const DIRT=R6(['#1e1614','#33241e','#4e382a','#6e5038','#8e6e4c','#ae9068']);
  const STRAW=R6(['#2c2a1e','#4c4630','#746a3e','#9c8c4e','#c2ae66','#e2d29a']);
  const FROSTG=R6(['#1c3034','#2a4a46','#3e6a4e','#5a8a5a','#86ac7c','#cfe2de']),FT0=U('#e6f0f8'),FT1=U('#b6ccd6');
  const SNOW=R6(['#56648a','#7f90b4','#aebcd8','#d6e0ee','#eef3f9','#ffffff']),DORM=SEA.winter;
  const STONE=R6(['#2a2a34','#4a4a54','#6e6e78','#9a98a0']),GLINT=U('#eefcff');
  const look=u=>{let sl=0,sl2=0,sc=0;for(let i=0;i<u.length;i++){const p=u[i],r=p&255,g=(p>>>8)&255,b=(p>>>16)&255,l=.299*r+.587*g+.114*b;sl+=l;sl2+=l*l;sc+=Math.max(r,g,b)-Math.min(r,g,b);}const n=u.length,mu=sl/n;return [Math.round(Math.sqrt(Math.max(0,sl2/n-mu*mu))),Math.round(sc/n/2.55)];};
  const glints=[];let tt=0,cA=[0,0],cB=[0,0],cntT=0,lastKey='';
  function snowAt(x,y,i,d){if(d<=0)return false;const cov=d>=3?1.1:d===2?.78:.48,th=KIND[i]===1?cov-.35:cov;return SN[i]<th;}
  function paint(u,mode,d,sway){const q=step5(tt);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,kd=KIND[i],tn=TONE[i];let col;
      if(mode==='snow'&&kd===1&&d>=3){col=SN[i]<.12?SNOW[1]:SNOW[2];}
      else if(mode==='snow'&&snowAt(x,y,i,d)){const up=y>0&&!snowAt(x,y-1,i-W,d);const s=SN[i];col=SNOW[up?2:s<.3?3:s<.75?4:5];if(kd===2&&tn<2)col=SNOW[2];}
      else if(kd===2)col=STONE[mode==='wet'?Math.max(0,tn-1):tn];
      else if(kd===1)col=DIRT[mode==='wet'?tn-2:mode==='dry'?Math.min(5,tn+1):tn];
      else if(mode==='wet')col=GRW[Math.max(0,tn-1)];
      else if(mode==='dry')col=STRAW[tn];
      else if(mode==='frost')col=hash2(x*3,y*7)<.09?FROSTG[5]:FROSTG[tn];
      else if(mode==='snow')col=DORM[tn];
      else col=GR[tn];
      u[i]=col;}
    for(const t of tufts){const sh=sway&&t.sw&&mode!=='snow'?(Math.sin(q*2.6+t.ph)>.35?1:0):0;
      tuftEach(t.s,t.x,t.y,sh,(x,y,tn,k,h)=>{if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;let col;
        if(mode==='wet')col=GRW[tn<=3?tn-1:tn];
        else if(mode==='dry')col=STRAW[tn];
        else if(mode==='frost')col=k===h-1?FT0:k===h-2?FT1:FROSTG[tn];
        else if(mode==='snow'){if(d===0)col=DORM[tn];else if(k>=d&&k>=h-3)col=DORM[k===h-1?2:1];else if(k===d-1&&h>d)col=SNOW[2];else return;}
        else col=GR[tn];
        u[i]=col;},t.fl);}
    if(mode==='wet')for(const g of glints){const t=tufts[g.t],x0=Math.round(t.x-(t.s.w-1)/2);for(let i=0;i<t.s.w;i++)if(t.s.a[i]){const x=x0+i,y=t.y-t.s.h+1;if(x>=0&&x<W&&y>=0)u[y*W+x]=GLINT;break;}}}
  const WASH={wet:['#1a2a40',.32],dry:['#b09040',.42],frost:['#e8f0f8',.38],snow:['#f0f4fa',0]};
  function wash(u,mode,d){const w=WASH[mode];if(!w)return;const a=mode==='snow'?Math.min(.86,.2+d*.11):w[1],C=un32(U(w[0]));
    for(let i=0;i<N;i++){const p=u[i];u[i]=pack((p&255)+(C[0]-(p&255))*a,((p>>>8)&255)+(C[1]-((p>>>8)&255))*a,((p>>>16)&255)+(C[2]-((p>>>16)&255))*a);}}
  const TXT={normal:'Base field. Both panels match.',
    wet:'After rain, left: grass shadows one ramp step down and +10% saturation, dirt two steps down, 1 px glints on tuft tips for 1 to 3 frames. Right: a blue-grey wash.',
    dry:'Drought, left: a separate straw ramp, desaturated yellow-ochre. Right: a brown tint over the green, the thing the report warns against.',
    frost:'Frost, left: pale blue-white on the top two pixels of each tuft, sparse ground rime. Right: a white wash.',
    snow:'Snow, left: tufts taller than the depth show only their top 1 to 3 px as dark dots; deeper snow hides them. Right: a white wash, no tips.'};
  function frame(){const mode=c.segv('w'),d=c.v('d');$('[data-for="snow"]',root).style.display=mode==='snow'?'':'none';c.out('d',d+' px');
    mA.a();paint(A.u32,mode,d,true);A.put();const msA=mA.b();
    mB.a();paint(B.u32,mode==='snow'?'snow0':'normal',d,true);wash(B.u32,mode,d);B.put();const msB=mB.b();
    const key=mode+d;if(key!==lastKey||++cntT>30){cA=look(A.u32);cB=look(B.u32);cntT=0;lastKey=key;}
    setHud(root,`Ramp swap · contrast ${cA[0]} · sat ${cA[1]}%`,'a');setHud(root,`Alpha wash · contrast ${cB[0]} · sat ${cB[1]}%`,'b');
    ro.innerHTML=`${TXT[mode]}<br>Luma contrast (standard deviation): ramp swap <b>${cA[0]}</b>, alpha wash <b>${cB[0]}</b>. Mean saturation: <b>${cA[1]}%</b> against <b>${cB[1]}%</b>. JS cost here: ${f3(msA)} ms and ${f3(msB)} ms per panel (measured). Report: one lookup per pixel inside the same pass, 0.0021 ms class on the M4 GPU [S12]; glints are a few particles.`;}
  c.seg('w',frame);c.on('d',frame);
  frame();
  return {tick(dt){tt+=dt;if(c.segv('w')==='wet'){for(let k=glints.length-1;k>=0;k--)if(--glints[k].f<=0)glints.splice(k,1);if(Math.random()<dt*9)glints.push({t:(Math.random()*tufts.length)|0,f:1+((Math.random()*3)|0)});}else glints.length=0;frame();}};});

// ======================================================================
// H3 biome colour: temperature x moisture table -> one of six ramps, or a continuous tint
// ======================================================================
reg('biomecolor',root=>{const c=ctl(root),[tcv,scv]=$$('canvas',root),T=PX(tcv),S=PX(scv),TW=T.W,TH=T.H,W=S.W,H=S.H,ro=$('[data-ro]',root);
  const BIO={
    tundra:{n:'Tundra',g:['#1e2630','#323e44','#4c5a56','#6a7668','#8e967e','#b8b8a0'],s:['#3a3a40','#55565a','#76767a','#9a9a9c'],cov:.85,per:[2,3],kind:'mat',sway:0,dens:'flat mats'},
    steppe:{n:'Steppe',g:['#1e2a26','#34442e','#526238','#748244','#98a258','#c4c47e'],s:['#3c3428','#5c5038','#7c6c4c','#9a8a64'],cov:.7,per:[2,3],kind:'short',sway:1,dens:'2 to 3 short tufts'},
    meadow:{n:'Meadow',g:SEA_HEX.spring,s:['#3a2c22','#5a4430','#7a5e40','#9a7a54'],cov:.96,per:[3,4],kind:'mid',sway:1,dens:'3 to 4 tufts'},
    savanna:{n:'Savanna',g:['#2a2418','#4a3e22','#76622c','#a08636','#c8aa48','#e8d47a'],s:['#4a2e22','#6e4630','#94603e','#b47e52'],cov:.4,per:[1,2],kind:'thin',sway:1,dens:'1 to 2 tall thin tufts, dirt showing'},
    desert:{n:'Desert',g:['#262418','#3e3e24','#5a5a30','#76743c','#94904c','#b8b268'],s:['#8a6a48','#ac8a5c','#c8a874','#e0c48e'],cov:.06,per:[0,1],kind:'scrub',sway:0,dens:'0 to 1 scrub, no sway'},
    swamp:{n:'Swamp',g:['#122222','#1c3a30','#2a5434','#3c6e38','#5a8a40','#8aac5a'],s:['#1e1e1a','#2e2c22','#3e3a2a','#524c36'],cov:.9,per:[2,3],kind:'mid',sway:1,dens:'2 to 3 tufts, reeds within 1 to 2 tiles of water'}};
  for(const k in BIO){BIO[k].G=R6(BIO[k].g);BIO[k].Sl=R6(BIO[k].s);}
  const zone=(t,m)=>t<.25?'tundra':m>=.62?'swamp':t>=.75&&m<.22?'desert':t>=.55&&m<.42?'savanna':t<.45&&m<.3?'steppe':'meadow';
  const C0=un32(U('#80b497')),C1=un32(U('#bfb755')),C2=un32(U('#47cd33'));
  const tint=(t,m)=>{const a=1-t,b=t-m,cc=m;return [C0[0]*a+C1[0]*b+C2[0]*cc,C0[1]*a+C1[1]*b+C2[1]*cc,C0[2]*a+C1[2]*b+C2[2]*cc];};
  const SPT=.16,SPM=.12;
  let pt=[.6,.34],tt=0;
  const sceneTM=(x,y)=>{const t=clamp(pt[0]+(x/W-.5)*SPT,0,1);let m=clamp(pt[1]+(.5-y/H)*SPM,0,1);if(m>t)m=t;return [t,m];};
  const WAT=R6(['#1c3048','#28486a','#3a6a8a','#78a8bc']),REED=[U('#5a3a22'),U('#8a5a30')];
  const water=(x,y)=>y>H-9+2*Math.sin(x/9)+Math.sin(x/4.3);
  const GT=8,GW=Math.ceil(W/GT),GH=Math.ceil(H/GT);
  // static ground noise and per-tile tuft seeds
  const NZ=new Float32Array(W*H),RZ=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){NZ[y*W+x]=vnoise(x/7,y/6)*.7+hash2(x*3+5,y*7)*.3;RZ[y*W+x]=hash2(x*11,y*5+9);}
  let tiles=[],lastKey='';
  function build(){tiles=[];for(let ty=0;ty<GH;ty++)for(let tx=0;tx<GW;tx++){const cx=tx*GT+4,cy=ty*GT+4,[t,m]=sceneTM(cx,cy),z=zone(t,m),b=BIO[z],r=mkRng(tx*131+ty*977+7);
      const n=b.per[0]+Math.round(r()*(b.per[1]-b.per[0]));const list=[];
      let dw=99;for(let k=0;k<3;k++){if(water(cx,cy+k*8))dw=Math.min(dw,k);}
      if(z==='swamp'&&dw<=2&&dw>0)for(let k=0;k<3;k++)list.push({x:tx*GT+1+r()*6,y:ty*GT+2+r()*6,k:'reed',h:8+((r()*4)|0),ph:r()*6.28});
      for(let k=0;k<n;k++)list.push({x:tx*GT+1+r()*6,y:ty*GT+2+r()*6,k:b.kind,ph:r()*6.28,fl:r()<.5});
      for(const q of list){q.x=Math.round(q.x);q.y=Math.round(q.y);if(!water(q.x,q.y)&&!water(q.x,q.y+2))tiles.push({...q,z,t,m});}}
    tiles.sort((a,b)=>a.y-b.y);}
  const SPR={mid:TUFT.mid,short:TUFT.short,thin:sprite(['.5...','.4..5','.4..4','..4.4','..3.3','..3.3','...33','...2.','..12.']),
    mat:sprite(['.5.45.4.','4343434.','23232321']),scrub:sprite(['.454.','45354','34343','.212.'])};
  function frame(){const cont=c.segv('mode')==='cont',q=step5(tt),u=S.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(water(x,y)){const d=y-(H-9+2*Math.sin(x/9));u[i]=WAT[d<1.5?3:d<3?2:(x*3+y*5)%17===0?2:1];continue;}
      const [t0,m0]=sceneTM(x,y),j=(bay(x,y)/16-.47)*.035,z=zone(clamp(t0+j,0,1),clamp(m0+j,0,1)),b=BIO[z],n=NZ[i],grass=n<b.cov+(water(x,y+6)&&z==='swamp'?.1:0);
      if(grass){const tn=n<b.cov*.35?1:n<b.cov*.75?2:3;if(cont){const v=lum(SEA.spring[tn])/lum(SEA.spring[5])*1.35,tc=tint(t0,m0);u[i]=pack(tc[0]*v,tc[1]*v,tc[2]*v);}else u[i]=b.G[tn];}
      else{const sn=RZ[i];u[i]=b.Sl[sn<.15?0:sn<.6?1:sn<.92?2:3];}}
    for(const q0 of tiles){const b=BIO[q0.z],sh=b.sway&&(Math.sin(q*2.4+q0.ph)>.3)?1:0;
      const put=(x,y,tn)=>{if(x<0||y<0||x>=W||y>=H)return;let col;if(cont){const v=lum(SEA.spring[tn])/lum(SEA.spring[5])*1.35,tc=tint(q0.t,q0.m);col=pack(tc[0]*v,tc[1]*v,tc[2]*v);}else col=b.G[tn];u[y*W+x]=col;};
      if(q0.k==='reed'){for(let k=0;k<q0.h;k++){const x=q0.x+(k>q0.h-4?sh:0),y=q0.y-k;if(y<0)continue;if(k>=q0.h-3&&k<q0.h-1){if(x>=0&&x<W)u[y*W+x]=REED[k===q0.h-2?1:0];}else put(x,y,k<2?2:k<q0.h-1?3:5);}}
      else tuftEach(SPR[q0.k],q0.x,q0.y,q0.k==='mat'||q0.k==='scrub'?0:sh,(x,y,tn)=>put(x,y,tn),q0.fl);}
    S.put();}
  function table(){const u=T.u32,cont=c.segv('mode')==='cont';
    for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){const i=y*TW+x,t=x/(TW-1),m=1-y/(TH-1);
      if(m>t+.001){u[i]=((x+y)&3)===0?U('#262c22'):U('#141811');continue;}
      if(cont){const tc=tint(t,m);u[i]=pack(tc[0],tc[1],tc[2]);}
      else{const z=zone(t,m),zr=x<TW-1?zone((x+1)/(TW-1),m):z,zd=y<TH-1?zone(t,1-(y+1)/(TH-1)):z;u[i]=z!==zr||z!==zd?U('#0c0f0a'):BIO[z].G[4];}}
    // the scene's extent and the picked point
    const x0=Math.round((pt[0]-SPT/2)*(TW-1)),x1=Math.round((pt[0]+SPT/2)*(TW-1)),y0=Math.round((1-pt[1]-SPM/2)*(TH-1)),y1=Math.round((1-pt[1]+SPM/2)*(TH-1)),dash=U('#e9ecdf');
    for(let x=x0;x<=x1;x++)for(const y of [y0,y1])if(x>=0&&x<TW&&y>=0&&y<TH&&(x&1))u[y*TW+x]=dash;
    for(let y=y0;y<=y1;y++)for(const x of [x0,x1])if(x>=0&&x<TW&&y>=0&&y<TH&&(y&1))u[y*TW+x]=dash;
    const px=Math.round(pt[0]*(TW-1)),py=Math.round((1-pt[1])*(TH-1));
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const ad=Math.abs(dx)+Math.abs(dy),x=px+dx,y=py+dy;if(x<0||y<0||x>=TW||y>=TH)continue;if(ad===2&&Math.abs(dx)!==2&&Math.abs(dy)!==2||ad===1)u[y*TW+x]=U('#ffffff');else if(ad===0||ad===3)u[y*TW+x]=U('#0c0f0a');}
    T.put();}
  function sync(fromSl){if(fromSl){const t=c.v('tp')/100,d=c.v('dp')/100;pt=[t,t*d];}else{c.el('tp').value=Math.round(pt[0]*100);c.el('dp').value=pt[0]>0?Math.round(pt[1]/pt[0]*100):0;}
    const t=pt[0],m=pt[1],D=t>0?m/t:0;c.out('tp',t.toFixed(2));c.out('dp',D.toFixed(2));
    const key=pt.join()+c.segv('mode');if(key!==lastKey){build();lastKey=key;}
    table();frame();
    const z=zone(t,m),b=BIO[z],tb=Math.round(t*255),mb=Math.round(m*255),nc=countColours(S.u32);
    ro.innerHTML=`<b>${b.n}</b> · temperature ${t.toFixed(2)}, downfall ${D.toFixed(2)}, moisture = downfall × temperature = ${m.toFixed(2)}`+
      `<br>Sent per region: 2 bytes, <code>0x${tb.toString(16).padStart(2,'0')} 0x${mb.toString(16).padStart(2,'0')}</code>. Per tile: ${b.dens}. Colours in the patch: <b>${nc}</b>`+(c.segv('mode')==='cont'?' (continuous tint)':' (six fixed ramps)');}
  pointer(tcv,(p,type)=>{if(type!=='down'&&type!=='drag')return;const t=clamp(p[0]/TW,0,1);let m=clamp(1-p[1]/TH,0,1);if(m>t)m=t;pt=[t,m];sync(false);});
  c.on('tp',()=>sync(true));c.on('dp',()=>sync(true));c.seg('mode',()=>{lastKey='';sync(false);});
  sync(false);
  return {tick(dt){tt+=dt;frame();}};});

// ======================================================================
// H5 reduce motion and low-end toggles
// ======================================================================
reg('reducemotion',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),W=P.W,H=P.H,u=P.u32,ro=$('[data-ro]',root),costs=$('[data-costs]',root),m=mtr();
  const N=W*H,GND=new Uint32Array(N),FLAT=new Uint32Array(N);
  const cx0=W/2,cy0=H/2+4,rx=W*.36,ry=H*.3;
  const onPath=(x,y)=>{const d=Math.hypot((x-cx0)/rx,(y-cy0)/ry);return Math.abs(d-1)*Math.min(rx,ry)<2.6+(vnoise(x/4,y/4)-.5)*1.4;};
  const GR=SEA.spring,DIRT=R6(['#2a1e18','#4a3626','#6b4f35','#8f7150','#ad9068']);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,r=hash2(x*7+1,y*3+5),n=vnoise(x/7,y/5)*.65+r*.35;
    if(onPath(x,y)){GND[i]=FLAT[i]=DIRT[r<.12?4:r<.8?3:2];continue;}
    GND[i]=GR[n<.33?1:n<.66?2:3];FLAT[i]=GR[n<.5?2:3];}
  const rng=mkRng(5),tufts=[],flowers=[];
  for(let gy=0;gy<H/6+1;gy++)for(let gx=0;gx<W/6+1;gx++){const x=Math.round((gx+rng())*6),y=Math.round((gy+rng())*6);if(x<3||y<6||x>=W-3||y>=H)continue;
    if(onPath(x,y)||onPath(x,y-3)||rng()<.22)continue;const r=rng();tufts.push({x,y,s:r<.3?TUFT.tall:r<.8?TUFT.mid:TUFT.short,fl:rng()<.5,r:rng(),ph:rng()*6.283});}
  tufts.sort((a,b)=>a.y-b.y);
  const FC=[PAL[17],PAL[18],PAL[19],PAL[20]];
  for(let k=0;k<26;k++){const x=4+(rng()*(W-8))|0,y=6+(rng()*(H-8))|0;if(onPath(x,y)||onPath(x,y-3))continue;flowers.push({x,y,c:FC[k%4]});}
  // trail map: 4 px cells, one byte each
  const CW=Math.ceil(W/4),CH=Math.ceil(H/4),TR=new Uint8Array(CW*CH);
  const wcx=cx0+12,wcy=cy0-8,wrx=rx*.78,wry=ry*1.12,walker={x:wcx+wrx,y:wcy,dir:'down',moving:true,anim:0},ang={a:0};
  // butterflies: flap-hop toward a flower, rest, flee the walker
  const BF=[];for(let k=0;k<12;k++){const f=flowers[k%flowers.length];BF.push({x:f.x,y:f.y-3,tg:k%flowers.length,rest:rng()*2,ph:rng()*6,c:k%3});}
  const BFC=[[U('#f0a040'),U('#ffd27a')],[U('#f4f0e0'),U('#c8d8f0')],[U('#9a7ad8'),U('#d0b8ff')]],BODY=U('#2a201a');
  const MASK=new Uint8Array(N);let tt=0,share=0,nSway=0;
  function frame(dt){const red=c.v('red'),deco=c.v('deco'),wind=c.v('wind')&&!red,react=c.v('react'),dens=c.v('dens')/100,rest=c.v('sway')/100;
    c.out('dens',Math.round(dens*100)+'%');c.out('sway',Math.round(rest*100)+'%');
    m.a();
    // walker on a loop; stamps the trail map
    ang.a+=dt*16/((wrx+wry)/2);const nx=wcx+Math.cos(ang.a)*wrx,ny=wcy+Math.sin(ang.a)*wry,vx=nx-walker.x,vy=ny-walker.y;walker.x=nx;walker.y=ny;walker.anim+=dt*7;
    walker.dir=Math.abs(vx)>Math.abs(vy)?(vx>0?'right':'left'):(vy>0?'down':'up');
    const dec=Math.max(1,Math.round((red?14:3)*dt*60));
    if(react){for(let i=0;i<TR.length;i++){const v=TR[i];TR[i]=v>dec?v-dec:0;}const fx=(walker.x/4)|0,fy=(walker.y/4)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=fx+dx,Y=fy+dy;if(X>=0&&Y>=0&&X<CW&&Y<CH)TR[Y*CW+X]=dx===0&&dy===0?255:Math.max(TR[Y*CW+X],170);}}
    else TR.fill(0);
    u.set(deco?GND:FLAT);
    if(deco)for(const f of flowers)drawFlower(u,W,H,f.x,f.y,f.c,1);
    const q=step5(tt);let wi=0;MASK.fill(0);nSway=0;
    const drawW=()=>drawChar(u,W,H,walker,walker.x,walker.y,0);
    for(const t of tufts){if(wi===0&&t.y>walker.y){drawW();wi=1;}if(!deco)continue;
      let sh=0,crush=0,lean=0;const sways=wind&&t.r<rest;
      if(sways){nSway++;sh=Math.sin(q*2.4+t.ph)>.3?1:0;tuftEach(t.s,t.x,t.y,0,(x,y)=>{if(x>=0&&y>=0&&x<W&&y<H)MASK[y*W+x]=1;},t.fl);tuftEach(t.s,t.x,t.y,1,(x,y)=>{if(x>=0&&y>=0&&x<W&&y<H)MASK[y*W+x]=1;},t.fl);}
      const tv=TR[((t.y/4)|0)*CW+((t.x/4)|0)]/255;if(tv>0){crush=tv*(red?.5:1);lean=Math.sign(t.x-walker.x||1)*Math.round(2*tv);}
      drawTuft(u,W,H,t.s,t.x,t.y,sh,GR,t.fl,crush,lean);}
    if(!wi)drawW();
    // butterflies
    const nB=Math.round(BF.length*dens),sp=red?.25:1;
    for(let k=0;k<nB;k++){const b=BF[k],f=flowers[b.tg];
      const dw=Math.hypot(b.x-walker.x,b.y-walker.y);
      if(b.rest>0){b.rest-=dt*sp;if(dw<14&&react){b.rest=0;b.tg=(b.tg+5)%flowers.length;}}
      else{const tx=f.x,ty=f.y-3,dx=tx-b.x,dy=ty-b.y,d=Math.hypot(dx,dy);if(d<1.2){b.rest=1.5+hash2(k,(tt*10)|0)*3;}else{const v=16*sp*dt;b.x+=dx/d*Math.min(v,d);b.y+=dy/d*Math.min(v,d);}b.ph+=dt*sp*24;}
      const fl=b.rest>0?0:(Math.floor(b.ph)%2),hop=b.rest>0?0:-Math.round(Math.abs(Math.sin(b.ph*.5))*2),x=Math.round(b.x),y=Math.round(b.y)+hop,C=BFC[b.c];
      const pp=(xx,yy,col)=>{if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=col;};
      pp(x,y,BODY);if(b.rest>0){pp(x,y-1,C[0]);}else if(fl){pp(x-1,y-1,C[0]);pp(x+1,y-1,C[0]);pp(x-2,y-1,C[1]);pp(x+2,y-1,C[1]);pp(x-1,y,C[1]);pp(x+1,y,C[1]);}else{pp(x-1,y,C[0]);pp(x+1,y,C[0]);pp(x-1,y-1,C[1]);pp(x+1,y-1,C[1]);}}
    P.put();const ms=m.b();
    let ms_=0;for(let i=0;i<N;i++)ms_+=MASK[i];share=ms_/N*100;
    const over=share>25;
    setHud(root,red?'Reduce motion on':'');
    $$('li',costs).forEach(li=>{const k=li.dataset.c;li.classList.toggle('off',k==='deco'?!deco:k==='wind'?!wind:k==='react'?!react:dens===0);});
    ro.innerHTML=`Swaying tufts: <b>${nSway}</b> of ${deco?tufts.length:0}, their moving pixels cover <b>${share.toFixed(0)}%</b> of the screen`+(over?' <span style="color:#ff8f7a">(over the 25% repeated-pattern line)</span>':' (under the 25% line)')+
      `<br>This frame: <b>${f3(ms)} ms</b> of JS pixel writes, measured here. Butterflies: ${nB}${red&&nB?', slowed to a quarter':''}.`;}
  ['red','deco','wind','react','dens','sway'].forEach(k=>c.on(k,()=>frame(0)));
  frame(1/60);
  return {tick(dt){tt+=dt;frame(dt);}};});

// ======================================================================
// H4 draw calls: N separate draws vs one instanced draw vs MultiMesh rows
// ======================================================================
reg('drawcalls',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),W=P.W,H=P.H,u=P.u32,svg=$('svg',root),ro=$('[data-ro]',root),m=mtr();
  const NMAX=20000,LIMIT=16384,RB=8,ROWS=Math.ceil(H/RB);
  // tiny 3-blade tufts: [dx, k (rows above root), tone]
  const VAR=[[[-1,0,2],[-1,1,4],[0,0,2],[0,1,3],[0,2,5],[1,0,2],[1,1,4]],[[-1,0,2],[-1,1,3],[-1,2,5],[0,0,2],[0,1,4],[1,0,2],[1,1,3],[1,2,5]],
    [[-1,0,2],[-1,1,5],[0,0,2],[0,1,3],[0,2,4],[0,3,5],[1,0,2],[1,1,5]],[[-1,0,3],[0,0,2],[0,1,4],[1,0,2],[1,1,3],[1,2,5]]];
  const TX=new Int16Array(NMAX),TY=new Int16Array(NMAX),TV=new Uint8Array(NMAX),TB=new Uint8Array(NMAX),TO=new Uint16Array(NMAX);
  {const tmp=[];for(let i=0;i<NMAX;i++)tmp.push([1+(hash2(i,7)*(W-2))|0,3+(hash2(i,9)*(H-3))|0,(hash2(i,3)*4)|0,(hash2(i,5)*8)|0,i]);tmp.sort((a,b)=>a[1]-b[1]);
    tmp.forEach((t,i)=>{TX[i]=t[0];TY[i]=t[1];TV[i]=t[2];TB[i]=t[3];TO[i]=t[4];});}
  const GR=SEA.summer,GND=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/9,y/6)*.6+hash2(x*3,y*5)*.4;GND[y*W+x]=U(n<.3?'#2e2418':n<.7?'#3a2e1e':'#46382a');}
  const WIND=new Int8Array(1024);for(let i=0;i<1024;i++)WIND[i]=Math.max(-1,Math.min(1,Math.round(.8*Math.sin(i*.035)+.6*Math.sin(i*.11+1.3))));
  const HUE=R6(['#ff7a6a','#ffb44a','#ffe25a','#8ee06a','#5ad2c8','#6aa8ff','#b48aff','#ff8ad0']),ROWC=R6(['#ffb44a','#6aa8ff']),ONE=U('#ffe25a'),CUT=U('#ff5a4a');
  const PD=13.1/8000,PT=.056/8000;
  let tt=0;
  const est=(mode,n)=>mode==='sep'?n*PD:mode==='rows'?ROWS*PD+n*PT:n*PT;
  const cmds=(mode,n)=>mode==='sep'?n:mode==='rows'?ROWS:1;
  function chart(n,phone){svg.innerHTML='';const nar=svg.getBoundingClientRect().width<480,VW=nar?380:600,x0=nar?12:150,x1=VW-14,y0=34,rh=nar?40:30,LO=-3,HI=3;
    const rows=[['sep','N separate draws','#ff8f7a'],['rows',`MultiMesh rows (${ROWS})`,'#e8c45a'],['inst','One instanced draw','#9cc069']];const Hh=y0+rows.length*rh+34;svg.setAttribute('viewBox',`0 0 ${VW} ${Hh}`);
    const X=v=>x0+(Math.log10(Math.max(1e-3,v))-LO)/(HI-LO)*(x1-x0),yb=y0+rows.length*rh;
    for(let e=LO;e<=HI;e++){const v=10**e;svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:yb,class:'gl'},svg);svgText(svg,X(v),yb+13,v>=1?String(v):String(v).replace(/^0/,''),{'text-anchor':'middle','font-size':10});}
    svgText(svg,x1,yb+27,'estimated ms per frame, log scale',{'text-anchor':'end','font-size':10.5});
    const ln=(v,t,col,dy)=>{svgEl('line',{x1:X(v),x2:X(v),y1:y0-8-dy,y2:yb,stroke:col,'stroke-width':1.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(v)-4,y0-10-dy,t,{'text-anchor':'end','font-size':10.5,fill:col});};
    ln(2,'2 ms grass budget','#a7b0da',0);ln(16.7,'16.7 ms frame','#ff6b5e',13);
    rows.forEach(([k,l,col],i)=>{const y=y0+i*rh,v=est(k,n),by=nar?y+14:y+6;
      svgText(svg,nar?x0:8,nar?y+10:y+15,l,{class:'lab','font-size':11.5});
      if(phone)svgEl('rect',{x:x0,y:by,width:Math.max(1.5,X(v*10)-x0),height:10,fill:col,opacity:.28,rx:1},svg);
      svgEl('rect',{x:x0,y:by,width:Math.max(1.5,X(phone?v*5:v)-x0),height:10,fill:col,rx:1},svg);
      const vv=phone?`${f3(v*5)} to ${f3(v*10)}`:f3(v),tx=X(phone?v*10:v)+4,end=tx>x1-60;svgText(svg,end?X(phone?v*5:v)-4:tx,by+9,vv,{'font-size':10,'text-anchor':end?'end':'start',fill:end?'#0c100b':'#e9ecdf'});});}
  let lastChart='';
  function frame(){const n=c.v('n'),mode=c.segv('mode'),show=c.v('show'),phone=c.v('phone');c.out('n',n.toLocaleString('en-US'));
    const cm=cmds(mode,n),drawn=mode==='sep'?Math.min(n,LIMIT):n,o=(tt*30)|0;
    m.a();u.set(GND);let cnt=0,yCut=-1;
    for(let i=0;i<NMAX;i++){if(TO[i]>=n)continue;if(cnt>=drawn){yCut=TY[i];break;}cnt++;const x=TX[i],y=TY[i],v=VAR[TV[i]],s=WIND[(x+(y>>2)*3+o)&1023],hc=!show?0:mode==='sep'?HUE[TB[i]]:mode==='rows'?ROWC[((y/RB)|0)&1]:ONE;
      for(let p=0;p<v.length;p++){const [dx,k,tn]=v[p],xx=x+dx+(k>=2?s:0),yy=y-k;if(xx<0||xx>=W||yy<0)continue;u[yy*W+xx]=hc&&tn>=4?hc:GR[tn];}}
    if(yCut>=0){for(let x=0;x<W;x+=2)u[yCut*W+x]=CUT;}
    P.put();const ms=m.b();
    const key=n+mode+phone+(svg.getBoundingClientRect().width<480);if(key!==lastChart){chart(n,phone);lastChart=key;}
    const ign=Math.max(0,cm-LIMIT);
    setHud(root,`${cm.toLocaleString('en-US')} canvas command${cm===1?'':'s'}`+(ign?` · ${ign.toLocaleString('en-US')} ignored`:''));
    ro.innerHTML=`Canvas commands this update: <b>${cm.toLocaleString('en-US')}</b> of Godot's 16,384`+(ign?`. <span style="color:#ff8f7a">The last ${ign.toLocaleString('en-US')} tufts are "ignored": the field ends at the red line.</span>`:'.')+
      `<br>Estimate for ${n.toLocaleString('en-US')} tufts: separate ${f3(est('sep',n))} ms, rows ${f3(est('rows',n))} ms, instanced ${f3(est('inst',n))} ms`+(phone?', ×5 to ×10 on a low-end phone (an estimate)':'')+'.'+
      `<br>This canvas drew ${drawn.toLocaleString('en-US')} tufts with pixel writes in <b>${f3(ms)} ms</b>, measured here.`;}
  c.on('n',frame);c.seg('mode',frame);c.on('show',frame);c.on('phone',frame);addEventListener('resize',()=>{lastChart='';});
  frame();
  return {tick(dt){tt+=dt;frame();}};});

// ======================================================================
// §6a measured costs on a log axis, plus the CPU rows run on this device
// ======================================================================
// GPU rows: [technique, 320x180 M4, 720p M4, 320x180 SwiftShader, profiles, kind]
const G6=[['Tufts, 1 instanced draw, N=2000','0.012','0.046','27.4','B3, C1, C3','inst'],['Tufts, 1 instanced draw, N=8000','0.056','0.22','110.6','B3, H4','inst'],
  ['Tufts as N separate draws, N=2000','2.01','2.05','28.2','B3 (anti-pattern)','sep'],['Tufts as N separate draws, N=8000','7.9','8.0','113.9','H4 (anti-pattern)','sep'],
  ['Field shift (wind fetch plus layer fetch)','0.0021','0.0154','0.075','B4, C2, H1','field'],['Field shift plus trail map','0.0029','0.0172','0.083','B4, D2','field'],
  ['Field, 6 procedural blades per cell','0.0069','0.053','0.44','B4','field'],['4 blended field layers','0.0058','0.058','0.30','B3, B4','field'],['8 blended field layers','0.0096','0.120','0.60','B4','field'],
  ['Additive 9x9 halos, N=1000','0.0047','0.014','13.8','G2','life'],['Trail ping-pong, decay plus stamps, 80x45','0.0078',null,'0.052','D2','life']];
// wall-clock times of the separate-draw rows at 320x180
const WALL={2:'3.27',3:'13.1'};
// CPU rows: [task, size, M4 Pro, 6x throttle, profiles, avoid]
const C6=[['Tufts, 1 drawImage per tuft (pre-baked frames)','2000','1.62','10.1','C5',0],['Tufts, per-row slicing, 8 drawImage per tuft','2000','12.0','75','C1 (anti-pattern)',1],
  ['Tufts, pixel writes plus one putImageData','2000','0.051','0.30','B3, C1',0],['Field layer, 90 row bands of 2 px','any N','0.11','0.67','B4',0],['Re-bake the whole field layer','8000','4.8','30.5','B4 (dirty cells only)',1],
  ['Trail map u8 decay plus stamps, 10 walkers','80x45','0.0023','0.014','D1, D2, D3',0],['Random-tick regrowth, 256 picks','any map','0.0008','0.005','E1',0],['Full-scan regrowth automaton','1024x1024','0.89','5.2','E1 (avoid)',1],
  ['Butterflies update (wander, bob, flee)','1000','0.012','0.071','F1, F2, F3, G3',0],['Firefly phase sync, naive pairs','1000','1.14','6.75','G1',0],['Firefly phase sync, per-cell mean field','1000','0.067','0.40','G1',0],
  ['Glow, per-pixel radial loop','200','0.052','0.32','G2',0],['Pollen update plus pixel-write draw','500','0.015','0.089','F4, G4',0]];
// the same CPU tasks, re-implemented here (after the study's benchmark) so a reader can time them on their own device
const LV=(()=>{let L=null;const W=320,H=180;
  function init(){const mk=(w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;};
    const cv=mk(W,H),cx=cv.getContext('2d',{willReadFrequently:true}),img=cx.createImageData(W,H),u32=new Uint32Array(img.data.buffer),gnd=mk(W,H),gx=gnd.getContext('2d');
    for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const v=hash2(x,y);gx.fillStyle=v<.3?'#3f7d34':v<.8?'#47873a':'#52944a';gx.fillRect(x,y,2,2);}
    const gU=new Uint32Array(gx.getImageData(0,0,W,H).data.buffer.slice(0));
    const BL=[[1,6],[3,8],[4,7],[6,5]],TP=[];for(const [bx,bh] of BL)for(let k=0;k<bh;k++)TP.push([bx,7-k,k>bh-3?0xff5ad27a:0xff2e8a3c]);
    const sh=(s,r)=>Math.round(s*(7-r)/7),atlas=mk(60,8),ac=atlas.getContext('2d'),tuft=mk(8,8),tc=tuft.getContext('2d');
    const hx=v=>'#'+[v&255,(v>>8)&255,(v>>16)&255].map(q=>q.toString(16).padStart(2,'0')).join('');
    for(let f=0;f<5;f++)for(const [dx,dy,col] of TP){ac.fillStyle=hx(col);ac.fillRect(f*12+2+dx+sh(f-2,dy),dy,1,1);}for(const [dx,dy,col] of TP){tc.fillStyle=hx(col);tc.fillRect(dx,dy,1,1);}
    const OFF=[],COL=[];for(let f=0;f<5;f++){OFF.push(Int32Array.from(TP.map(([dx,dy])=>dy*W+dx+sh(f-2,dy))));COL.push(Uint32Array.from(TP.map(p=>p[2])));}
    const WD=new Int8Array(1024);for(let i=0;i<1024;i++)WD[i]=Math.max(-2,Math.min(2,Math.round(1.2*Math.sin(i*.035)+Math.sin(i*.11+1.3))));
    const mkT=n=>{const x=new Int16Array(n),y=new Int16Array(n);for(let i=0;i<n;i++){x[i]=2+(hash2(i,7)*(W-12)|0);y[i]=hash2(i,9)*(H-8)|0;}return {n,x,y};};
    const T2=mkT(2000),T8=mkT(8000),layer=mk(W,H),lc=layer.getContext('2d');for(let i=0;i<2000;i++)lc.drawImage(tuft,T2.x[i],T2.y[i]);
    const sync=()=>cx.getImageData(0,0,1,1).data[1];
    const tr={MW:80,MH:45,a:new Uint8Array(3600),wx:new Float32Array(10),wy:new Float32Array(10),d:[]};for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dy*dy<=4)tr.d.push(dx,dy,255-((dx*dx+dy*dy)*32|0));for(let k=0;k<10;k++){tr.wx[k]=hash2(k,3)*80;tr.wy[k]=hash2(k,4)*45;}
    const GW=1024,g=new Uint8Array(GW*GW),g2=new Uint8Array(GW*GW);for(let i=0;i<g.length;i++)g[i]=hash2(i,11)<.5?0:(hash2(i,12)*4)|0;
    const life=n=>{const o={n,x:new Float32Array(n),y:new Float32Array(n),a:new Float32Array(n),ph:new Float32Array(n),om:new Float32Array(n)};for(let i=0;i<n;i++){o.x[i]=hash2(i,1)*W;o.y[i]=hash2(i,2)*H;o.a[i]=hash2(i,5)*6.283;o.ph[i]=hash2(i,6)*6.283;o.om[i]=6.283*(.9+.2*hash2(i,8));}return o;};
    const B=life(1000),F1=life(1000),F2=life(1000),PO=life(500),GL=life(200),R=24,GCW=Math.ceil(W/R),GCH=Math.ceil(H/R),SX=new Float32Array(GCW*GCH),SY=new Float32Array(GCW*GCH),CN=new Int32Array(GCW*GCH),CE=new Int32Array(1000);
    const drift=o=>{for(let i=0;i<o.n;i++){o.a[i]+=(rnd()-.5)*.3;o.x[i]=(o.x[i]+Math.cos(o.a[i])*.064+W)%W;o.y[i]=(o.y[i]+Math.sin(o.a[i])*.064+H)%H;}};
    const night=new Uint32Array(W*H).fill(0xff2a1a12);let t=0;
    L=[
      ()=>{cx.drawImage(gnd,0,0);const o=(t+=.016)*40|0;for(let i=0;i<2000;i++){const x=T2.x[i],f=WD[(x+o)&1023]+2;cx.drawImage(atlas,f*12,0,12,8,x-2,T2.y[i],12,8);}sync();},
      ()=>{cx.drawImage(gnd,0,0);const o=(t+=.016)*40|0;for(let i=0;i<2000;i++){const x=T2.x[i],y=T2.y[i],s=WD[(x+o)&1023];for(let r=0;r<8;r++)cx.drawImage(tuft,0,r,8,1,x+sh(s,r),y+r,8,1);}sync();},
      ()=>{u32.set(gU);const o=(t+=.016)*40|0;for(let i=0;i<2000;i++){const x=T2.x[i],b=T2.y[i]*W+x,f=WD[(x+o)&1023]+2,of=OFF[f],cl=COL[f];for(let p=0;p<of.length;p++)u32[b+of[p]]=cl[p];}cx.putImageData(img,0,0);sync();},
      ()=>{cx.drawImage(gnd,0,0);const o=(t+=.016)*40|0;for(let y=0;y<H;y+=2){const s=WD[(y*3+o)&1023];cx.drawImage(layer,0,y,W,2,s,y,W,2);}sync();},
      ()=>{const c2=mk(W,H),g3=c2.getContext('2d');for(let i=0;i<8000;i++)g3.drawImage(tuft,T8.x[i],T8.y[i]);g3.getImageData(0,0,1,1);},
      ()=>{const a=tr.a;for(let i=0;i<a.length;i++){const v=a[i];a[i]=v>2?v-2:0;}for(let k=0;k<10;k++){tr.wx[k]=(tr.wx[k]+(rnd()-.4)*.5+80)%80;tr.wy[k]=(tr.wy[k]+(rnd()-.5)*.5+45)%45;const X=tr.wx[k]|0,Y=tr.wy[k]|0;
        for(let j=0;j<tr.d.length;j+=3){const x=X+tr.d[j],y=Y+tr.d[j+1];if(x<0||y<0||x>=80||y>=45)continue;const i=y*80+x;if(a[i]<tr.d[j+2])a[i]=tr.d[j+2];}}},
      ()=>{const n=GW*GW;for(let k=0;k<256;k++){const i=(rnd()*n)|0,s=g[i];if(s>=3){if(rnd()<.002)g[i]=0;continue;}if(s>0){g[i]=s+1;continue;}const x=i%GW;if((x>0&&g[i-1]===3)||(x<GW-1&&g[i+1]===3)||(i>=GW&&g[i-GW]===3)||(i+GW<n&&g[i+GW]===3))g[i]=1;}},
      ()=>{const n=GW*GW;for(let i=0;i<n;i++){const s=g[i];if(s>0){g2[i]=s<3?s+1:3;continue;}const x=i%GW;g2[i]=((x>0&&g[i-1]===3)||(x<GW-1&&g[i+1]===3)||(i>=GW&&g[i-GW]===3)||(i+GW<n&&g[i+GW]===3))?1:0;}for(let i=0;i<n;i+=97)if(g2[i]===3)g2[i]=0;g.set(g2);},
      ()=>{for(let i=0;i<1000;i++){const a=B.a[i]+(rnd()-.5)*.8;B.a[i]=a;let vx=Math.cos(a)*18,vy=Math.sin(a)*18;const dx=B.x[i]-160,dy=B.y[i]-90,d2=dx*dx+dy*dy;if(d2<1600){const k=60/Math.sqrt(d2+1);vx+=dx*k;vy+=dy*k;}
        let x=B.x[i]+vx*.016,y=B.y[i]+vy*.016;if(x<0)x+=W;else if(x>=W)x-=W;if(y<0)y+=H;else if(y>=H)y-=H;B.x[i]=x;B.y[i]=y;B.ph[i]+=.8;}},
      ()=>{drift(F1);const R2=R*R,ph=F1.ph,out=new Float32Array(1000);for(let i=0;i<1000;i++){let s=0,n=0;const xi=F1.x[i],yi=F1.y[i],pi=ph[i];for(let j=0;j<1000;j++){const dx=F1.x[j]-xi,dy=F1.y[j]-yi;if(dx*dx+dy*dy<R2&&j!==i){s+=Math.sin(ph[j]-pi);n++;}}out[i]=(pi+(F1.om[i]+(n?1.2*s/n:0))*.016)%6.2832;}F1.ph=out;},
      ()=>{drift(F2);const ph=F2.ph;SX.fill(0);SY.fill(0);CN.fill(0);for(let i=0;i<1000;i++){const cc=((F2.y[i]/R)|0)*GCW+((F2.x[i]/R)|0);CE[i]=cc;SX[cc]+=Math.cos(ph[i]);SY[cc]+=Math.sin(ph[i]);CN[cc]++;}
        for(let i=0;i<1000;i++){const cc=CE[i],gx2=cc%GCW,gy2=(cc/GCW)|0;let Sx=0,Sy=0,n=0;for(let yy=gy2-1;yy<=gy2+1;yy++){if(yy<0||yy>=GCH)continue;for(let xx=gx2-1;xx<=gx2+1;xx++){if(xx<0||xx>=GCW)continue;const q=yy*GCW+xx;Sx+=SX[q];Sy+=SY[q];n+=CN[q];}}
          const pi=ph[i],s=Sy*Math.cos(pi)-Sx*Math.sin(pi);ph[i]=(pi+(F2.om[i]+(n>1?1.2*s/(n-1):0))*.016)%6.2832;}},
      ()=>{u32.set(night);for(let i=0;i<200;i++){const X=GL.x[i]|0,Y=GL.y[i]|0;for(let dy=-4;dy<=4;dy++){const y=Y+dy;if(y<0||y>=H)continue;for(let dx=-4;dx<=4;dx++){const x=X+dx;if(x<0||x>=W)continue;const d2=dx*dx+dy*dy;if(d2>20)continue;const k=1-d2/20,j=y*W+x,p=u32[j];
        u32[j]=0xff000000|Math.min(255,((p>>16)&255)+k*40)<<16|Math.min(255,((p>>8)&255)+k*120)<<8|Math.min(255,(p&255)+k*110);}}}cx.putImageData(img,0,0);sync();},
      ()=>{u32.set(gU);t+=.016;const wx=14+6*Math.sin(t*.7);for(let i=0;i<500;i++){let x=PO.x[i]+(wx+WD[(i*7+(t*30|0))&1023]*3)*.016,y=PO.y[i]+Math.sin(PO.ph[i]+t*2)*.2;if(x>=W)x-=W;if(y<0)y+=H;if(y>=H)y-=H;PO.x[i]=x;PO.y[i]=y;u32[(y|0)*W+(x|0)]=0xffc8f6ff;}cx.putImageData(img,0,0);sync();}];}
  return {run(){if(!L)init();const out=[];L.forEach((f,i)=>{f();const n=i===1||i===4?2:i===7?3:i===9?4:20;const t0=performance.now();for(let r=0;r<n;r++)f();out[i]=(performance.now()-t0)/n;});return out;}};})();
reg('costs',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);let mine=null,busy=false;
  const KC={inst:'#9cc069',sep:'#ff8f7a',field:'#e8c45a',life:'#7fb7c9',cpu:'#c8d6a8',bad:'#ff8f7a',you:'#7fd0ff',wall:'#ffb8a8'};
  c.seg('v',v=>{$$('[data-for]',root).forEach(e=>e.hidden=e.dataset.for!==v);draw();});c.seg('res',draw);c.on('thr',draw);
  c.btn('run',b=>{if(busy)return;busy=true;b.textContent='Running…';setTimeout(()=>{try{mine=LV.run();}catch(e){mine=null;}busy=false;b.textContent='Run again on this device';draw();},30);});
  addEventListener('resize',()=>draw());
  function draw(){const view=c.segv('v');svg.innerHTML='';let rows=[],note='',legend=[];
    if(view==='gpu'){const ri=+c.segv('res');rows=G6.map((r,i)=>({lab:r[0],sub:'profiles: '+r[4],v:r[ri]===null?null:+r[ri],s:r[ri],k:r[5],wall:ri===1&&WALL[i]?+WALL[i]:undefined,ws:WALL[i]}));
      legend=[['inst','tufts in one instanced draw'],['sep','tufts as separate draws'],['field','field passes'],['life','halos and trail map']].concat(ri===1?[['wall','wall clock of the separate draws']]:[]);
      const top=rows.filter(r=>r.v!==null).sort((a,b)=>b.v-a.v)[0];
      note=`Dearest pass at ${['','320×180 on the M4 GPU','720p on the M4 GPU','320×180 on SwiftShader'][ri]}: <b>${top.lab}</b>, ${top.s} ms.`+
        (ri===1?' Wall clock for the separate draws is higher, 3.27 ms for 2,000 and 13.1 ms for 8,000. At native size every one-draw pass stays under 0.06 ms.':ri===3?' Software GL pays about 14 µs per quad, so tufts cost 27 to 114 ms; the field shift stays at 0.075 ms, which makes it the fallback.':' 720p barely moves the separate draws, because the cost is the call, not the pixels.');}
    else{const thr=c.v('thr');rows=C6.map((r,i)=>({lab:r[0],sub:'N = '+r[1]+' · profiles: '+r[4],v:+(thr?r[3]:r[2]),s:thr?r[3]:r[2],k:r[5]?'bad':'cpu',you:mine?mine[i]:undefined}));
      legend=[['cpu',thr?'M4 Pro, 6x throttle':'M4 Pro'],['bad','anti-pattern or avoid']].concat(mine?[['you','this device, now']]:[]);
      note=`Canvas pixel writes beat one <code>drawImage</code> per tuft by about 30x: ${thr?'0.30 against 10.1':'0.051 against 1.62'} ms for 2,000 tufts. Per-row slicing for crisp sway costs ${thr?'75':'12.0'} ms.`;
      if(mine){const r=mine[2]/+C6[2][2];note+=` On this device the pixel-write row took <b>${f3(mine[2])} ms</b>, ${r.toFixed(1)}× the M4.`;}}
    const nar=svg.getBoundingClientRect().width<520,LO=-4,HI=3,VW=nar?360:600,x0=nar?14:300,x1=nar?336:588,y0=40,n=rows.length,rh=nar?(view==='cpu'?(mine?52:44):40):(view==='cpu'?(mine?40:34):(rows.some(r=>r.wall)?32:28)),by=nar?(view==='cpu'?24:14):0;
    const hgt=y0+n*rh+36;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);
    const X=v=>x0+(Math.log10(Math.max(1e-4,v))-LO)/(HI-LO)*(x1-x0),yb=y0+n*rh;
    for(let e=LO;e<=HI;e++){const v=10**e;svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:yb,class:'gl'},svg);svgText(svg,X(v),yb+13,v>=1?String(v):String(v).replace(/^0/,''),{'text-anchor':'middle','font-size':10});}
    svgText(svg,x1,yb+27,'ms per frame (log scale)',{'text-anchor':'end','font-size':10.5});
    const ln=(v,t,col,dy)=>{svgEl('line',{x1:X(v),x2:X(v),y1:y0-8-dy,y2:yb,stroke:col,'stroke-width':1.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(v)-4,y0-10-dy,t,{'text-anchor':'end','font-size':10.5,fill:col});};
    ln(2,'2 ms grass budget','#a7b0da',0);ln(16.7,'16.7 ms frame','#ff6b5e',14);
    rows.forEach((r,i)=>{let y=y0+i*rh;
      if(nar){svgText(svg,x0,y+10,r.lab,{class:'lab','font-size':11});if(view==='cpu')svgText(svg,x0,y+21,r.sub,{'font-size':9.5});}
      else{svgText(svg,8,y+11,r.lab.length>50?r.lab.slice(0,49)+'…':r.lab,{class:'lab','font-size':11.5});svgText(svg,8,y+23,r.sub,{'font-size':9.5});}
      y+=by;const bh=9;
      if(r.v===null)svgText(svg,x0+4,y+9,'not measured',{'font-size':9.5,fill:'#7c8470'});
      else{svgEl('rect',{x:x0,y:y+1,width:Math.max(1.5,X(r.v)-x0),height:bh,fill:KC[r.k],rx:1},svg);const tx=X(r.v)+4,end=tx>x1-34;
        svgText(svg,end?X(r.v)-4:tx,y+bh,r.s,{'font-size':9.5,'text-anchor':end?'end':'start',fill:end?'#0c100b':'#e9ecdf'});}
      if(r.wall!==undefined){const yy=y+bh+3;svgEl('rect',{x:x0,y:yy,width:X(r.wall)-x0,height:6,fill:KC.wall,rx:1},svg);svgText(svg,X(r.wall)+4,yy+6,r.ws+' wall',{'font-size':9,fill:KC.wall});}
      if(r.you!==undefined){const yy=y+bh+3;svgEl('rect',{x:x0,y:yy,width:Math.max(1.5,X(r.you)-x0),height:7,fill:KC.you,rx:1},svg);const tx=X(r.you)+4,end=tx>x1-50;svgText(svg,end?X(r.you)-4:tx,yy+7,f3(r.you)+' here',{'font-size':9,'text-anchor':end?'end':'start',fill:end?'#0c100b':KC.you});}});
    leg.innerHTML=legend.map(([k,l])=>`<span><i style="background:${KC[k]}"></i>${l}</span>`).join('')+'<span><i style="background:#a7b0da"></i>2 ms budget (§6e)</span><span><i style="background:#ff6b5e"></i>16.7 ms frame</span>';
    ro.innerHTML=note+' <span style="color:var(--mute)">Source: our benchmark [S12], Apple M4 Pro, Chromium 153, WebGL2. No phone was measured.</span>';}
  draw();return {};});

// ======================================================================
// §5 scorecard data (hard-coded from the report's table; 40 rows)
// [id, technique, Simplicity, Speed, Pixel taste, Mood, Interactivity, Sum]
// ======================================================================
const GS=[['A1','Pokémon tall grass, priority bit, rustle',5,5,5,4,4,23],['A2','Zelda cut grass, debris, throttled drops',5,5,4,3,5,22],['A3','Tibia and TFS decay items',5,5,3,2,4,19],
  ['A4','Stardew tufts, still until touched',4,5,3,4,4,20],['A5','Roguelike high grass blocks sight',5,5,4,4,4,22],['B1','Variation by hash, flips, mood map',5,5,5,4,1,20],
  ['B2','16-tile corner sets, layered tiles',4,5,5,3,1,18],['B3','Tuft sprites, y-sort cover',4,4,5,4,4,21],['B4','One field layer',3,5,4,4,2,18],['B5','Flowers in patches, daily cycle',4,5,5,5,2,21],
  ['C1','Whole-pixel row shear',4,5,5,4,1,19],['C2','Terraria cosine wave, wind gate',5,5,4,4,2,20],['C3','Two-noise gusts, wind primitives',4,5,4,5,3,21],['C4','Stiffness and per-tuft variation',5,5,4,4,1,19],
  ['C5','Stepped low-fps sway',5,5,5,3,1,19],['D1','Terraria WindGrid timestamps',4,5,4,3,5,21],['D2','Byte trail map',4,5,4,4,5,22],['D3','Crush and recovery',4,5,4,4,5,22],
  ['D4','Rustle frames, leaves, sound',5,5,5,4,5,24],['D5','Desire paths (Helbing)',3,5,4,5,5,22],['E1','Random ticks and spread',5,5,3,3,3,19],['E2','Timers, lazy stages, server bytes',4,5,3,2,4,18],
  ['E3','Cut, burn, graze stage ladder',4,5,4,4,5,22],['E4','Hiding rule on the server',3,5,4,4,5,21],['E5','TFS invisibility (anti-pattern)',5,5,1,1,2,14],['F1','Butterfly flap-hop',5,5,5,5,3,23],
  ['F2','Bee flower hops',4,5,4,4,2,19],['F3','Dragonfly dart and hover',4,5,4,4,3,20],['F4','Midge swarm spring',5,5,4,4,2,20],['F5','Moths orbiting lamps',4,5,4,5,2,20],
  ['G1','Firefly blink and sync',4,5,5,5,3,22],['G2','Pre-drawn halo glow',5,5,5,5,1,21],['G3','Critters flee and flush',4,5,4,4,5,22],['G4','Seeds, pollen, petals',5,5,4,4,1,19],
  ['G5','Spawn tables, anchors, pools',3,5,3,4,3,18],['H1','Season palettes, phenology offsets',4,5,5,5,1,20],['H2','Wet, dry, frost, snow grass',4,5,5,5,1,20],['H3','Biome colour table, density',5,5,4,3,1,18],
  ['H4','Batching, MultiMesh rows, limits',3,5,3,2,1,14],['H5','Reduce motion, low-end toggles',5,5,4,3,3,20]].map(r=>({id:r[0],name:r[1],r:r.slice(2,7),sum:r[7]}));
const FAMC={A:'#e8c45a',B:'#9cc069',C:'#7fd0c0',D:'#c99a6a',E:'#ff8f7a',F:'#f2a0d0',G:'#d8f08a',H:'#a8b8ff'};

// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#1b2116','#2c3a22','#4a6234','#7f9c50','#cfe08a'];const RL=['Simplicity','Speed','Pixel taste','Mood','Interactivity'];const SC=['#e8c45a','#7fd0ff','#ff8f7a'];
  let sel=['D4','H1','H4'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Mood','Interact.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=GS.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#0c100b':'#e9ecdf'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-40 0 ${S+80} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#4a5a3a':'#232c1c'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#232c1c'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=GS.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=GS.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// §6b pretty vs cheap: scatter of all 40 profiles, Speed by Taste + Mood
// ======================================================================
reg('matrix',root=>{const svg=$('svg',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const NOTE={B3:'one draw call per tuft is the expensive way: 3.27 ms wall for 2,000, 13.1 ms for 8,000 (§6b).',C1:'smooth sub-pixel sway without snapping is its cheap-but-ugly branch; canvas per-row slicing for crisp sway costs 12 ms for 2,000 tufts.',
    A4:'sprite rotation at 320×180 is its weak point.',C3:'per-blade noise directions that dance are its ugly branch.',G4:'screen-space debris that slides with the camera is the ugly branch.',
    G1:'square on/off blinks are the ugly branch; naive pair sync costs 1.14 ms for 1,000, the mean field 0.067 ms.',G2:'white additive halos that merge are the ugly branch; a PointLight2D per firefly pops past 15 lights per item.',
    E5:'cheap and wrong: the packet still carries the position.',H4:'invisible, but it decides whether the rest fits a phone: 8,000 tufts 0.056 ms in one draw, 13.1 ms as 8,000 draws.',
    D4:'the top sum, 24.',B5:'pretty and cheap: a sprite frame inside the instanced tuft draw.',H1:'pretty and cheap: one hash and one palette lookup per pixel.',H2:'pretty and cheap: palette operations inside the same pass.',F1:'pretty and cheap: a few float ops per creature.'};
  const nar=svg.getBoundingClientRect().width<520,VWm=nar?380:600;svg.setAttribute('viewBox',`0 0 ${VWm} 300`);const L=40,Rr=VWm-10,T=24,B=250,X=v=>L+(v-1.5)/9*(Rr-L),Y=s=>T+(5.5-s)/4*(B-T);
  const zone=(x0,x1,s0,s1,fill,label,anchor)=>{svgEl('rect',{x:X(x0),y:Y(s1),width:X(x1)-X(x0),height:Y(s0)-Y(s1),fill,opacity:.13},svg);svgText(svg,anchor==='end'?X(x1)-4:X(x0)+4,Y(s0)-5,label,{'font-size':11,'text-anchor':anchor||'start',fill:'#c3c9b4'});};
  zone(1.5,5.5,4.5,5.5,'#ff8f7a','cheap but ugly');zone(9.5,10.5,4.5,5.5,'#9cc069',nar?'pretty, cheap':'pretty and cheap','end');zone(7.5,10.5,1.5,4.5,'#e8c45a','pretty but expensive','end');
  for(let s=2;s<=5;s++){svgEl('line',{x1:L,x2:Rr,y1:Y(s),y2:Y(s),class:'gl'},svg);svgText(svg,L-6,Y(s)+4,String(s),{'text-anchor':'end','font-size':11});}
  for(let v=2;v<=10;v++)svgText(svg,X(v),B+14,String(v),{'text-anchor':'middle','font-size':11});
  svgText(svg,(L+Rr)/2,B+30,'Pixel taste + Mood →',{'text-anchor':'middle','font-size':11,class:'lab'});
  svgText(svg,12,(T+B)/2,'Speed →',{'text-anchor':'middle','font-size':11,class:'lab',transform:`rotate(-90 12 ${(T+B)/2})`});
  // ghost marks: the Speed 2 costs §6b names that no profile recommends
  (nar?[['draw per tuft',2.1],['row slicing',4.6],['re-bake',7]]:[['one draw per tuft, 8,000',2],['canvas row slicing',5],['full re-bake per trample',7.4]]).forEach(([t,x])=>{svgEl('circle',{cx:X(x),cy:Y(2),r:5,fill:'none',stroke:'#7c8470','stroke-dasharray':'2 2'},svg);svgText(svg,X(x)+8,Y(2)+4,t,{'font-size':10.5,fill:'#a3a991'});});
  const cells={};GS.forEach(s=>{const k=s.r[1]+':'+(s.r[2]+s.r[3]);(cells[k]=cells[k]||[]).push(s);});
  const pts=[];
  for(const k in cells){const list=cells[k],[sp,tm]=k.split(':').map(Number),n=list.length,cols=Math.min(n,n>8?(nar?5:6):4),rowsN=Math.ceil(n/cols),dx=nar?6.6:9.6,dy=nar?7.4:10;
    list.forEach((s,j)=>{const col=j%cols,row=Math.floor(j/cols),cx=X(tm)+(col-(cols-1)/2)*dx,cy=Y(sp)+(row-(rowsN-1)/2)*dy;
      const g=svgEl('g',{class:'h3-pt',tabindex:0,'data-id':s.id,role:'button','aria-label':`${s.id} ${s.name}`},svg);
      svgEl('circle',{cx,cy,r:nar?3:4.2,fill:FAMC[s.id[0]],stroke:'#0c100b','stroke-width':1},g);pts.push(g);});}
  const show=id=>{const s=GS.find(x=>x.id===id);pts.forEach(p=>{const on=p.dataset.id===id,ci=p.firstChild;ci.setAttribute('stroke',on?'#ffffff':'#0c100b');ci.setAttribute('stroke-width',on?2:1);});
    ro.innerHTML=`<a href="#t-${id.toLowerCase()}">${id}</a> <b>${s.name}</b> · Speed ${s.r[1]} · taste ${s.r[2]} + mood ${s.r[3]} = ${s.r[2]+s.r[3]} · simplicity ${s.r[0]} · interactivity ${s.r[4]} · sum ${s.sum}`+(NOTE[id]?`<br>${NOTE[id]}`:'');};
  svg.addEventListener('pointerover',e=>{const g=e.target.closest('.h3-pt');if(g)show(g.dataset.id);});
  svg.addEventListener('click',e=>{const g=e.target.closest('.h3-pt');if(g)show(g.dataset.id);});
  svg.addEventListener('focusin',e=>{const g=e.target.closest('.h3-pt');if(g)show(g.dataset.id);});
  leg.innerHTML=Object.entries(FAMC).map(([k,v])=>`<span><i style="background:${v};height:8px;width:8px;border-radius:50%"></i>${k}</span>`).join('');
  show('B3');return {};});
}
