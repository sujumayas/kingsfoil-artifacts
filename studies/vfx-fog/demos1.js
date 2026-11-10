// Fog study: figures 1 (hero, timeline, emerald, alttp, rtsfog, noiselayers, warp, pooling, density, clearing, dither, paletteLUT)
// Everything sits in one block so helper names stay local to this file.
{
// ----------------------------------------------------------------------
// shared bits for this file
// ----------------------------------------------------------------------
const RCACHE={};
// on-ramp fog colours: ramp(name, fogHex, N, snap) cached; name 'day' | 'night'
const NIGHTPAL=nightPal(PAL);
function ramp(name,fogHex,N=5,snap=false){const k=name+fogHex+N+snap;if(!RCACHE[k]){const base=name==='night'?NIGHTPAL:PAL;RCACHE[k]=fogRamp(base,fogHex,N,snap?base:null);}return RCACHE[k];}
// Beer's law lookup: fog amount for a thickness 0..1 at strength k, 256 entries
function beerLUT(k){const L=new Float32Array(257);for(let i=0;i<=256;i++)L[i]=1-Math.exp(-k*i/256);return L;}
const TAB128=mkTable(128,1,4,4),TAB64=mkTable(64,2,4,3),WARP64=mkTable(64,3,2,3),WARP64B=mkTable(64,9,2,3),CLOUD128=mkTable(128,7,3,4);
// cached highland scenes by size
const SCN={};const scene=(W,H,seed=3)=>SCN[W+'x'+H+'s'+seed]||(SCN[W+'x'+H+'s'+seed]=mkHighland(W,H,seed));
// bilinear read of a GW x GH grid at cell coords
function bil(A,GW,GH,fx,fy){fx=clamp(fx,0,GW-1.001);fy=clamp(fy,0,GH-1.001);const x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,i=y0*GW+x0;
  return (A[i]*(1-tx)+A[i+1]*tx)*(1-ty)+(A[i+GW]*(1-tx)+A[i+GW+1]*tx)*ty;}
// fog level with world-locked Bayer between steps (C1 + C2): f 0..1 -> step 0..N
const stepOf=(f,N,b)=>{const l=f*N,s=Math.floor(l);return Math.min(N,s+((l-s)*16>b+.5?1:0));};
// same, but flat bands with a narrow dithered seam (band = share of each step that dithers): the soft-band look of §4 C2
const stepB=(f,N,b,band=.4)=>{const l=f*N,s=Math.floor(l),t=clamp((l-s-(1-band)/2)/band,0,1);return Math.min(N,s+(t*16>b+.5?1:0));};
// distance from each pixel to its nearest light, and which light
function lightMap(S){const N=S.W*S.H,D=new Float32Array(N).fill(99),L=new Int16Array(N).fill(-1);
  S.lamps.forEach((l,k)=>{const R=26;for(let y=Math.max(0,Math.floor(l.y-R));y<Math.min(S.H,l.y+R);y++)for(let x=Math.max(0,Math.floor(l.x-R));x<Math.min(S.W,l.x+R);x++){const d=Math.hypot(x-l.x,(y-l.y)*1.25),i=y*S.W+x;if(d<D[i]){D[i]=d;L[i]=k;}}});return {D,L};}

// ======================================================================
// HERO: the highland with valley fog, cloud shadows, fog of war or night mist.
// 80x45 density field at 10 Hz (B4), Beer's-law pooling per pixel (B3),
// two table layers + one-fetch warp (B1, B2), palette steps + world-locked
// Bayer (C1, C2), halos sized by fog (F2), clearing holes (B5), one-step
// cloud shadows (D1, D2), counts + memory + fade for fog of war (E1, E4).
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=320,H=180,NP=W*H,tiers=$$('.hero-tiers button',root);
  const S=scene(W,H,3),LM=lightMap(S),GW=80,GH=45,NC=GW*GH,CS=4;
  let Fd=new Float32Array(NC),Fp=new Float32Array(NC),G=new Float32Array(NC);const MOI=new Float32Array(NC),CH=new Float32Array(NC);
  for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){let s=0;for(let k=0;k<4;k++)s+=S.h[(gy*CS+(k>>1)*2+1)*W+gx*CS+(k&1)*2+1];const hc=s/4;CH[gy*GW+gx]=hc;MOI[gy*GW+gx]=.35+.65*(1-smooth(.15,.65,hc));}
  // fog of war: 40 x 23 cells of 8 px
  const VW=40,VH=23,VIS=new Float32Array(VW*VH),EXP=new Float32Array(VW*VH);
  const mem=Uint32Array.from(PAL,c=>mix32(desat(c,.7),U('#262b3d'),.55)),UNK=U('#12131b'),UNK2=U('#181a24');
  const P={dens:1,ceil:.5,K:5,str:1,v1:15,v2:9,wind:[6,1.5],night:false,clouds:false,fow:false,fog:'#d3cdd6',halo:5};
  const SC=[{dens:1,ceil:.52,K:5,str:1.2,fog:'#d3cdd6',night:false,clouds:false,fow:false,halo:5},
    {dens:.55,ceil:.3,K:4,str:.8,fog:FOG_HEX.day,night:false,clouds:true,fow:false,halo:3},
    {dens:.7,ceil:.4,K:4,str:.85,fog:FOG_HEX.day,night:false,clouds:false,fow:true,halo:4},
    {dens:.85,ceil:.48,K:4.5,str:.9,fog:FOG_HEX.night,night:true,clouds:false,fow:false,halo:9}];
  let sc=0,t=0,acc=0,lerpT=0,hud=0,steps=0;const mPass=meter(),mField=meter();
  const walker=mkWalker(S.walk,13);
  function setScene(k){sc=k;Object.assign(P,SC[k]);tiers.forEach((b,i)=>b.classList.toggle('on',i===k));if(P.fow){VIS.fill(0);EXP.fill(0);}
    for(let i=0;i<NC;i++){Fd[i]=Fp[i]=P.dens*MOI[i];}}
  tiers.forEach((b,i)=>b.addEventListener('click',()=>setScene(i)));setScene(0);
  function fieldStep(){mField.t0();const dt=.1,[wx,wy]=P.wind,cx=walker.x/CS,cy=(walker.y-4)/CS;
    for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx;
      const up=bil(Fd,GW,GH,gx-wx*dt/CS*4,gy-wy*dt/CS*4);
      const avg=(Fd[gy>0?i-GW:i]+Fd[gy<GH-1?i+GW:i]+Fd[gx>0?i-1:i]+Fd[gx<GW-1?i+1:i])/4;
      let v=lerp(up,avg,.2);const tgt=P.dens*MOI[i]*(.8+.4*n1(t*.05+gx*.07,gy));v+=(tgt-v)*.06;
      const d=Math.hypot(gx-cx,(gy-cy)*1.2);if(d<5)v-=(1-d/5)*.18;
      G[i]=clamp(v,0,1.2);}
    for(const l of S.lamps){if(l.win)continue;const lx=l.x/CS|0,ly=l.y/CS|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=lx+dx,Y=ly+dy;if(X<0||Y<0||X>=GW||Y>=GH)continue;G[Y*GW+X]*=.9+.04*Math.hypot(dx,dy);}}
    const tmp=Fp;Fp=Fd;Fd=G;G=tmp;steps++;mField.t1();}
  function fowStep(dt){const cx=walker.x/8,cy=(walker.y-4)/8,R=5.2;
    for(let y=0;y<VH;y++)for(let x=0;x<VW;x++){const i=y*VW+x,inV=Math.hypot(x+.5-cx,y+.5-cy)<R;if(inV){EXP[i]=1;VIS[i]=Math.min(1,VIS[i]+dt/.3);}else VIS[i]=Math.max(0,VIS[i]-dt/.3);}}
  return {tick(dt){t+=dt;acc+=dt;walker.step(dt);if(acc>=.1){acc%=.1;fieldStep();lerpT=0;}lerpT=Math.min(1,acc/.1);if(P.fow)fowStep(dt);
    mPass.t0();
    const R=ramp(P.night?'night':'day',P.fog),RW=ramp(P.night?'night':'day',P.night?'#e8b070':FOG_HEX.lamp),beer=beerLUT(P.K),ceil=P.ceil,str=P.str*(P.night?.85:1);
    const o1x=Math.floor(t*P.v1),o1y=Math.floor(t*P.v1*.25),o2x=Math.floor(t*P.v2*-.4),o2y=Math.floor(t*P.v2);
    const cox=Math.floor(t*11),coy=Math.floor(t*4),thr=.56,halo=P.halo;
    for(let y=0;y<H;y++){const gy=y/CS-.5;for(let x=0;x<W;x++){const i=y*W+x;let c=S.idx[i];const b=bay(x,y);
      // cloud shadows: thresholded table, offset from the sun, one dithered edge band, one palette step darker
      if(P.clouds){const cv=tabAt(CLOUD128,128,(x-6+cox)>>1,(y+5+coy)>>1);if(cv>thr||(cv>thr-.05&&b<8))c=SHADE[c];}
      const gx=x/CS-.5,d=lerp(bil(Fp,GW,GH,gx,gy),bil(Fd,GW,GH,gx,gy),lerpT);
      const th=ceil-S.h[i];const pool=th>0?beer[Math.min(256,(th*256)|0)]:0;
      const w=tabAt(WARP64,64,x>>1,y>>1)-.5;
      const n=.6*tabAt(TAB128,128,((x+o1x)>>1)+((w*12)|0),((y+o1y)>>1)+((w*8)|0))+.4*tabAt(TAB64,64,x+o2x,y+o2y);
      const f=clamp(d*pool*(.45+1.1*n)*str+(P.night?.06:0),0,1);
      let s=stepB(f,5,b,.45),col=R[c*6+s];
      const ld=LM.D[i];if(ld<26){const r=halo*(.5+1.4*f)+(P.night?3:0);if(ld<r*.45)col=RW[c*6+Math.max(s,P.night?3:2)];else if(ld<r*.8)col=RW[c*6+Math.max(s,1)];else if(ld<r&&b<8)col=RW[c*6+Math.max(s,1)];}
      if(P.fow){const v=bil(VIS,VW,VH,x/8-.5,y/8-.5),e=bil(EXP,VW,VH,x/8-.5,y/8-.5);if(v*16<=b+.5){col=e*16>b+.5?mem[c]:((x+y)&1&&e>.05?UNK2:UNK);}}
      u[i]=col;}}
    drawChar(u,W,H,walker,walker.x,walker.y,0,CHAR_PAL,P.night?(c=>mulc(c,.55,.55,.75)):null);
    F.put();const pm=mPass.t1();
    if(++hud%12===0)setHud(root,`fog pass ${fms(pm)} ms · field ${fms(mField.v)} ms @ 10 Hz · JS on this device`);}};});

// ======================================================================
// §3 timeline
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#9ca1b4','#f2b866','#93a0cc','#d9a3c4'];
  const X=y=>y<1985?(y-1845)/140*22:y<2021?24+(y-1985)/36*46:72+(y-2021)/6*27;
  let h='<div class="tl-axis">';for(const y of [1852,1950,1990,2000,2010])h+=`<span style="left:${X(y)}%">${y}</span>`;h+=`<span style="left:${X(2022)}%">2022</span><span style="left:${X(2024)}%">2024</span><span style="left:${X(2026.3)}%">2026</span><i class="tl-brk" style="left:70.9%"></i><i class="tl-brk" style="left:22.9%"></i></div>`;
  const items=[];
  GENS.forEach((g,gi)=>{const ys=g.ev.filter(e=>e.y).map(e=>e.y+e.m/12);const a=Math.min(...ys),b=Math.max(...ys);
    h+=`<div class="tl-lane" data-g="${gi}"><span class="tl-lab">${g.id}</span><div class="tl-track"><i class="tl-bar" style="left:${X(a)}%;width:${Math.max(.8,X(b)-X(a))}%;background:${GC[gi]}"></i>`;
    g.ev.forEach((e,ei)=>{const id=`tle-${gi}-${ei}`;items.push({gi,ei,id,e});if(e.y)h+=`<button class="tl-dot" type="button" style="left:${X(e.y+e.m/12)}%;--c:${GC[gi]}" data-id="${id}" aria-label="${g.id}, ${e.y}"></button>`;});
    h+='</div></div>';});
  lanes.innerHTML=h;
  gb.innerHTML='<button type="button" class="on" data-g="all">All generations</button>'+GENS.map((g,gi)=>`<button type="button" data-g="${gi}"><i style="background:${GC[gi]}"></i>${g.id}: ${g.t}</button>`).join('');
  list.innerHTML=items.map(it=>`<li id="${it.id}" data-g="${it.gi}" style="--c:${GC[it.gi]}"><span class="yr">${GENS[it.gi].id}${it.e.y?' · '+it.e.y:''}</span>${it.e.h}</li>`).join('');
  const show=id=>{const it=items.find(i=>i.id===id);if(!it)return;$$('.tl-list li',root).forEach(l=>l.classList.toggle('hl',l.id===id));det.innerHTML=`<b>${GENS[it.gi].id}: ${GENS[it.gi].t}</b> · ${it.e.h}`;};
  lanes.addEventListener('pointerover',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('click',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('focusin',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  gb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',gb).forEach(x=>x.classList.toggle('on',x===b));const g=b.dataset.g;
    $$('.tl-list li',root).forEach(l=>l.hidden=!(g==='all'||l.dataset.g===g));$$('.tl-lane',root).forEach(l=>l.classList.toggle('dim',!(g==='all'||l.dataset.g===g)));});
  const pick=items.find(i=>/Emerald draws fog/.test(i.e.h))||items[0];show(pick.id);return {};});

// ======================================================================
// A1 Emerald: 20 world-locked 64x64 sprites, GBA blend in 5-bit colour
// ======================================================================
reg('emerald',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=240,H=160,c=ctl(root),ro=$('[data-ro]',root);
  const S=scene(400,160,5),SW=S.W;
  // one soft 64x64 fog picture, 4 bpp: index 0 transparent, 1..15 light lavender greys
  const T=mkTable(64,11,3,4),SPR=new Uint8Array(64*64);for(let i=0;i<SPR.length;i++){const v=T[i];SPR[i]=v<.42?0:1+Math.min(14,Math.floor((v-.42)/.58*15));}
  const SC5=[];for(let k=0;k<16;k++){const t=k/15;SC5.push([Math.round(lerp(18,30,t)),Math.round(lerp(18,30,t)),Math.round(lerp(21,31,t))]);}
  const B5=new Uint8Array(NPAL*3);for(let k=0;k<NPAL;k++){const a=un32(PAL[k]);B5[k*3]=a[0]>>3;B5[k*3+1]=a[1]>>3;B5[k*3+2]=a[2]>>3;}
  let cam=0,camDir=1,fx=0,fy=0,frames=0,camAcc=0,eva=0,evb=16,target=1,stepAcc=0;
  const fbtn=c.btn('fade',b=>{target=target?0:1;b.textContent=target?'Fade out':'Fade in';});
  c.seg('mode',()=>{fx=fy=0;eva=0;evb=16;target=1;fbtn.textContent='Fade out';});
  return {tick(dt){const mode=c.segv('mode'),lock=c.v('lock');frames+=dt*60;
    // drift: 1 px per 4 frames (horizontal), or 20 px/s across and 12 down (diagonal)
    while(frames>=1){frames-=1;if(mode==='h'){stepAcc++;if(stepAcc>=4){stepAcc=0;fx++;}}else{fx+=20/60;fy+=12/60;}}
    if(c.v('pan')){camAcc+=dt*20;while(camAcc>=1){camAcc-=1;cam+=camDir;if(cam>=SW-W||cam<=0)camDir=-camDir;}}
    // fade: one coefficient by 1 per step; in 1.5 s (h) or 3.5 s (d), out 0.7 s
    const tin=mode==='h'?1.5:3.5,rate=(target?20/tin:20/.7)*dt;let moves=rate+(this._r||0);this._r=moves%1;moves=Math.floor(moves);
    for(let m=0;m<moves;m++){if(target){if(eva<12&&(evb===8||eva<=(16-evb)*1.5))eva++;else if(evb>8)evb--;}else{if(eva>0&&(evb===16||eva>=(16-evb)*1.5))eva--;else if(evb<16)evb++;}}
    const ox=Math.floor(fx),oy=Math.floor(fy);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const wx=x+cam,k=S.idx[y*SW+wx];let r=B5[k*3],g=B5[k*3+1],b=B5[k*3+2];
      const sx=((lock?wx:x)-ox)&255,sy=(y-oy)&255;const s=SPR[(sy&63)*64+(sx&63)];
      if(s&&eva){const A=SC5[s];r=Math.min(31,(A[0]*eva+r*evb)>>4);g=Math.min(31,(A[1]*eva+g*evb)>>4);b=Math.min(31,(A[2]*eva+b*evb)>>4);}
      let col=pack(r<<3|r>>2,g<<3|g>>2,b<<3|b>>2);
      if(c.v('grid')){const gx=(((lock?wx:x)-ox-32)%64+64)%64,gy=((y-oy-32)%64+64)%64;if((gx===0||gy===0)&&((x+y)&1))col=U('#f2b866');}
      u[y*W+x]=col;}
    F.put();
    ro.innerHTML=`EVA <b>${eva}</b> · EVB <b>${evb}</b> → fog ${Math.round(eva/16*100)}% + scene ${Math.round(evb/16*100)}% = ${Math.round((eva+evb)/16*100)}% · drift ${mode==='h'?'1 px per 4 frames, 15 px/s':'20 px/s across, 12 down'} · camera x ${cam}<br>`+
      `Cost: GBA, a few register writes and 20 sprite moves per frame · Godot, one blended layer: <b>0.0008 ms</b> at 320×180, <b>0.010 ms</b> at 720p (measured, §6a)`;}};});

// ======================================================================
// A2 ALttP: overlay averaged 50/50 (add-half), drifting 7.5 px/s with no
// camera term, or following the camera at 1/2 or 1/4, or world-locked
// ======================================================================
reg('alttp',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=192,H=112,c=ctl(root),ro=$('[data-ro]',root);
  const S=mkHighland(448,112,8,{treeGrid:7,houses:[],lamps:[[.3,.6],[.7,.62]],tower:{x:380,y:30}}),SW=S.W;
  // overlay art: sparse soft blobs with transparent gaps (3 light shades)
  const OV=new Uint32Array(128*128),OC=Uint32Array.from(['#c9cde0','#dfe1ec','#f1f1f6'],U);
  for(let i=0;i<OV.length;i++){const v=TAB128[i];OV[i]=v<.46?0:OC[v<.58?0:v<.7?1:2];}
  let cam=0,camT=0,sub=0,drag=null;
  pointer(cv,(p,k)=>{if(k==='down'){drag={x:p[0],c:cam};c.el('auto').checked=false;}else if(k==='drag'&&drag){cam=clamp(Math.round(drag.c-(p[0]-drag.x)),0,SW-W);}else if(k==='up')drag=null;});
  return {tick(dt){if(c.v('auto')){camT+=dt;cam=Math.round((SW-W)/2*(1-Math.cos(camT*.35)));}
    sub+=0x2000*dt*60; // 16.16 fixed point per frame
    const mode=c.segv('mode'),drift=Math.floor(sub/65536);let ox,oy;
    if(mode==='fog'){ox=drift;oy=drift;}else if(mode==='half'){ox=cam>>1;oy=0;}else if(mode==='quarter'){ox=cam>>2;oy=0;}else{ox=cam;oy=0;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=PAL[S.idx[y*SW+x+cam]],o=OV[((y+oy)&127)*128+((x+ox)&127)];
      if(o){const a=un32(s),b=un32(o);u[y*W+x]=pack((a[0]+b[0])>>1,(a[1]+b[1])>>1,(a[2]+b[2])>>1);}else u[y*W+x]=s;}
    F.put();
    const f={fog:'scroll += 0x2000 per frame (1/8 px), no camera term',half:'scroll = camera >> 1',quarter:'scroll = camera >> 2',world:'scroll = camera (moves with the ground)'}[mode];
    ro.innerHTML=`CGADSUB 0x72: (scene + overlay) / 2 · ${f} · camera x ${cam}<br>Cost: SNES, one offset per frame · shader, one blended fetch: <b>0.0008 ms</b> at 320×180, <b>0.010 ms</b> at 720p (measured, §6a)`;}};});

// ======================================================================
// A5 Classic RTS fog of war: shroud / fog / visible on vision tiles
// ======================================================================
reg('rtsfog',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=192,H=128,c=ctl(root),ro=$('[data-ro]',root),CS=8,GW=W/CS,GH=H/CS,NC=GW*GH;
  const S=scene(W,H,4),mem=Uint32Array.from(PAL,k=>mix32(desat(k,.5),U('#1b1e2c'),.5)),SH=U('#0d0e14'),SH2=U('#14151e');
  const EXP=new Uint8Array(NC),VIS=new Uint8Array(NC),R=3.6,m=meter();
  const U8=[];const rng=mkRng(4);
  const mk=()=>({x:20+rng()*40,y:40+rng()*60,tx:rng()*W,ty:rng()*H,cell:-1,col:[U('#f2b866'),U('#a9bfe6'),U('#e58a7a'),U('#a6d96a')][U8.length%4]});
  let frame=0,rebuilds=0,recomputes=0;
  function stamp(un){const cx=un.x/CS,cy=un.y/CS;for(let y=Math.max(0,Math.floor(cy-R));y<=Math.min(GH-1,Math.ceil(cy+R));y++)for(let x=Math.max(0,Math.floor(cx-R));x<=Math.min(GW-1,Math.ceil(cx+R));x++){if(Math.hypot(x+.5-cx,y+.5-cy)<=R){VIS[y*GW+x]=1;EXP[y*GW+x]=1;}}}
  function full(){m.t0();VIS.fill(0);for(const un of U8)stamp(un);m.t1();recomputes++;}
  const reset=()=>{EXP.fill(0);VIS.fill(0);frame=0;};c.btn('reset',reset);
  const sync=()=>{const n=c.v('n');while(U8.length<n)U8.push(mk());U8.length=n;c.out('n',n);};c.on('n',sync);sync();
  return {tick(dt){const sc=c.segv('mode')==='sc';
    for(const un of U8){const dx=un.tx-un.x,dy=un.ty-un.y,d=Math.hypot(dx,dy);if(d<2){un.tx=8+rng()*(W-16);un.ty=8+rng()*(H-16);}else{un.x+=dx/d*16*dt;un.y+=dy/d*16*dt;}
      const cell=((un.y/CS)|0)*GW+((un.x/CS)|0);if(cell!==un.cell){un.cell=cell;if(sc)stamp(un);else full();}}
    // StarCraft: 24 game frames per second (42 ms); every 100 frames hide all tiles and re-reveal
    frame+=dt*24;if(sc&&frame>=100){frame-=100;full();rebuilds++;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,ci=((y/CS)|0)*GW+((x/CS)|0),k=S.idx[i];
      u[i]=VIS[ci]?PAL[k]:EXP[ci]?mem[k]:((x>>1)+(y>>1))&1?SH2:SH;}
    for(const un of U8){const x=Math.round(un.x),y=Math.round(un.y);for(let j=-2;j<=1;j++)for(let i=-1;i<=1;i++){const X=x+i,Y=y+j;if(X>=0&&Y>=0&&X<W&&Y<H)u[Y*W+X]=(j===-2||i!==0&&j===1)?PAL[0]:un.col;}}
    F.put();
    let nv=0,ne=0;for(let i=0;i<NC;i++){nv+=VIS[i];ne+=EXP[i];}
    ro.innerHTML=(sc?`next rebuild in <b>${Math.ceil(100-frame)}</b> frames (${((100-frame)*.042).toFixed(1)} s at 42 ms per frame) · rebuilds ${rebuilds}`:`full recompute on every tile change · recomputes ${recomputes}`)+
      ` · visible ${nv} · explored ${ne} of ${NC} cells<br>Cost here: <b>${m.v>0?(m.v*1000).toFixed(1)+' µs':'waiting for the first recompute'}</b> per recompute in JS (${NC} cells, ${U8.length} scouts) · measured: 1000 units, radius 8, 256×256: <b>0.18 ms</b>, 1.1 ms throttled (§6a)`;}};});

// ======================================================================
// B1 noise-table layers vs per-pixel fbm, timed live
// ======================================================================
reg('noiselayers',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=160,H=90,c=ctl(root),ro=$('[data-ro]',root),msA=$('[data-ms="a"]',root),msB=$('[data-ms="b"]',root);
  const S=scene(W,H,6),R=ramp('day',FOG_HEX.day),ma=meter(.1),mb=meter(.1),FA=new Float32Array(W*H),FB=new Float32Array(W*H);let t=0,hud=0;
  const LAY=[[1,1,.25],[1.7,-.5,1],[2.9,.8,-.6]],SPD=[1,.6,.37];
  const show=()=>{c.out('lay',c.v('lay'));c.out('oct',c.v('oct'));const v=c.v('spd');c.out('spd',v+' px/s');};['lay','oct','spd'].forEach(k=>c.on(k,show));show();
  function compose(P,Fv){const u=P.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,pool=sat((.62-S.h[i])*2.4);const f=sat(Fv[i]*pool*1.25);u[i]=R[S.idx[i]*6+stepB(f,5,bay(x,y),.5)];}P.put();}
  return {tick(dt){t+=dt;const v=c.v('spd'),L=c.v('lay'),O=c.v('oct');
    ma.t0();for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0,wsum=0;for(let l=0;l<L;l++){const [sc,dx,dy]=LAY[l],o=t*v*SPD[l];s+=tabAt(TAB128,128,Math.floor((x+o*dx*1.6)/sc*1.4),Math.floor((y+o*dy*1.6)/sc*1.4))*(1/(l+1));wsum+=1/(l+1);}FA[y*W+x]=s/wsum;}const a=ma.t1();
    mb.t0();const o=t*v;for(let y=0;y<H;y++)for(let x=0;x<W;x++)FB[y*W+x]=fbmP((x+Math.floor(o))/22,(y+Math.floor(o*.25))/22,O);const b=mb.t1();
    compose(A,FA);compose(B,FB);
    if(++hud%8===0){const g=[0,GPU6A.tex1[1],GPU6A.tex2[1],GPU6A.tex3[1]][L],gb=O===1?GPU6A.fbm1[1]:O===4?GPU6A.fbm4[1]:null;
      msA.innerHTML=`JS here: <b>${fms(a)} ms</b> · M4 GPU 720p: <b>${g.toFixed(4)} ms</b> measured`;
      msB.innerHTML=`JS here: <b>${fms(b)} ms</b> · M4 GPU 720p: `+(gb?`<b>${gb.toFixed(3)} ms</b> measured`:'not measured for '+O+' octaves');
      const zone=v<=6?'horror fog range (0 to 6 px/s)':v<=20?'ground fog range (4 to 20 px/s)':'faster than 20 px/s: players read this as smoke, oil or water';
      ro.innerHTML=`${L} table read${L>1?'s':''} against ${O} octave${O>1?'s':''} per pixel · per-pixel fbm costs <b>${(b/Math.max(a,1e-4)).toFixed(1)}×</b> the table here · drift ${v} px/s: ${zone}`;}}};});

// ======================================================================
// B2 domain warp: RG offset table vs nested procedural fbm, timed live
// ======================================================================
reg('warp',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=128,H=72,c=ctl(root),ro=$('[data-ro]',root),msA=$('[data-ms="a"]',root),msB=$('[data-ms="b"]',root);
  const R=ramp('day',FOG_HEX.day),S=scene(W,H,6),ma=meter(.1),mb=meter(.1);let t=0,hud=0,odd=0,lastB=0;const POOL=new Float32Array(W*H);for(let i=0;i<W*H;i++)POOL[i]=.35+.85*sat((.66-S.h[i])*2.2);
  c.on('k',()=>c.out('k',c.v('k')+' px'));c.out('k',c.v('k')+' px');
  // warped fog over the highland, palette steps with a narrow dithered seam
  const put=(P,x,y,f)=>{const i=y*W+x;P.u32[i]=R[S.idx[i]*6+stepB(sat(f*POOL[i]),5,bay(x,y),.45)];};
  return {tick(dt){t+=dt;const k=c.v('k'),lv=+c.segv('lv'),dr=t*6;
    ma.t0();for(let y=0;y<H;y++)for(let x=0;x<W;x++){const qx=tabAt(WARP64,64,(x+dr*.5)>>1,y>>1)-.5,qy=tabAt(WARP64B,64,(x+dr*.5)>>1,y>>1)-.5;
      put(A,x,y,(tabAt(TAB128,128,Math.floor(x+dr+qx*k*2),Math.floor(y+qy*k*2))-.2)*1.4);}const a=ma.t1();A.put();
    if((odd^=1)||lastB===0){mb.t0();const s=1/36,kk=k/10;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const px=(x+dr)*s,py=y*s;
        const q1=fbmP(px,py,3),q2=fbmP(px+5.2,py+1.3,3);let wx=px+kk*q1,wy=py+kk*q2;
        if(lv===2){const r1=fbmP(wx+1.7,wy+9.2,3),r2=fbmP(wx+8.3,wy+2.8,3);wx=px+kk*r1;wy=py+kk*r2;}
        put(B,x,y,(fbmP(wx,wy,3)-.25)*1.7);}lastB=mb.t1();B.put();}
    if(++hud%8===0){msA.innerHTML=`JS here: <b>${fms(a)} ms</b> · 3 table reads per pixel · M4 GPU 720p: <b>0.014 ms</b> measured`;
      msB.innerHTML=`JS here: <b>${fms(mb.v)} ms</b> · ${lv===2?5:3} fbm calls × 3 octaves per pixel · M4 GPU 720p: ${lv===2?'<b>about 0.33 ms</b> by arithmetic':'not measured'}`;
      ro.innerHTML=`nested fbm costs <b>${(mb.v/Math.max(a,1e-4)).toFixed(0)}×</b> the table warp in JavaScript here · warp strength ${k} px${k>16?' · the pattern starts to tear':''}`;}}};});

// ======================================================================
// B3 pooling: top view + cross-section, Beer's law on thickness
// ======================================================================
reg('pooling',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),X=PX(cvs[1]),W=192,H=108,XH=40,c=ctl(root),ro=$('[data-ro]',root);
  const S=scene(W,H,3),R=ramp('day',FOG_HEX.dawn);let row=Math.round(H*.6),hov=null,line=c.v('line')/100,t=0,hud=0;
  const SKY=U('#24273a'),GND=Uint32Array.from(['#3a5c37','#2b4430','#584738','#45444e'],U),LINE=U('#f2b866'),ROWC=U('#f2b866');
  pointer(cvs[0],(p,k)=>{if(k==='down'||k==='drag')row=clamp(p[1]|0,0,H-1);if(k==='move'||k==='drag')hov=[p[0]|0,p[1]|0];if(k==='leave')hov=null;});
  c.on('line',()=>{line=c.v('line')/100;});
  return {tick(dt){t+=dt;const K=c.v('k');c.out('k',K);
    if(c.v('burn')){line-=dt*.035;if(line<.08)line=.62;c.el('line').value=Math.round(line*100);}c.out('line',(line*100|0)+'%');
    let fogged=0;const u=F.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,th=line-S.h[i],f=th>0?1-Math.exp(-K*th):0;const s=stepB(f,5,bay(x,y),.4);if(s>0)fogged++;u[i]=R[S.idx[i]*6+s];}
    for(let x=0;x<W;x+=2)u[row*W+x]=ROWC;
    F.put();
    // cross-section: height 0..1 maps to the 40 px strip
    const v=X.u32,hy=e=>Math.round(XH-3-e*(XH-6));const ly=hy(line);
    for(let x=0;x<W;x++){const e=S.h[row*W+x],gy=hy(e);
      for(let y=0;y<XH;y++){let col=SKY;if(y>=gy)col=y===gy?GND[0]:y<gy+3?GND[1]:GND[3];
        else if(y>=ly){const th=line-(XH-3-y)/(XH-6),f=1-Math.exp(-K*Math.max(0,line-e));col=R[(y<gy?15:14)*6+stepB(f*(.6+.4*sat(th*4)),5,bay(x,y),.4)];}
        if(y===ly&&(x&3)<2)col=LINE;v[y*W+x]=col;}}
    X.put();
    if(++hud%6===0){let h='';if(hov){const i=hov[1]*W+hov[0],e=S.h[i],th=Math.max(0,line-e),T=Math.exp(-K*th);h=`pointer: height ${(e*100|0)}% · thickness ${(th*100|0)}% · T = exp(−k·d) = <b>${T.toFixed(2)}</b> · fog ${((1-T)*100|0)}% · `;}
      ro.innerHTML=h+`fog line ${(line*100|0)}% · k ${K} · ${(fogged/(W*H)*100).toFixed(0)}% of pixels fogged<br>Cost: <b>0.0011 ms</b> at 320×180, <b>0.013 ms</b> at 720p on the M4 (measured, §6a)`;}}};});

// ======================================================================
// B4 coarse density grid: advect, diffuse, relax; 10 Hz + lerp or every frame
// ======================================================================
reg('density',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,W=160,H=90,GW=80,GH=45,NC=GW*GH,CS=2,c=ctl(root),ro=$('[data-ro]',root);
  const S=scene(W,H,6),R=ramp('day',FOG_HEX.day),m=meter(.15),TG=new Float32Array(NC);
  for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const e=S.h[(gy*CS+1)*W+gx*CS+1];TG[gy*GW+gx]=.85*(1-smooth(.18,.6,e));}
  let Fd=Float32Array.from(TG),Fp=Float32Array.from(TG),G=new Float32Array(NC),acc=0,stepsS=0,sps=0,secT=0,hud=0,t=0;
  const puff=(x,y)=>{const cx=x/CS,cy=y/CS;for(let j=-5;j<=5;j++)for(let i=-5;i<=5;i++){const X=Math.round(cx+i),Y=Math.round(cy+j);if(X<0||Y<0||X>=GW||Y>=GH)continue;const d=Math.hypot(i,j);if(d<5)Fd[Y*GW+X]=Math.min(1.3,Fd[Y*GW+X]+(1-d/5)*.6);}};
  pointer(cv,(p,k)=>{if(k==='down'||k==='drag')puff(p[0],p[1]);});
  const lab=()=>{c.out('ws',c.v('ws')+' px/s');c.out('wd',c.v('wd')+'°');};c.on('ws',lab);c.on('wd',lab);lab();
  function step(dt){m.t0();const a=c.v('wd')*Math.PI/180,sp=c.v('ws')/CS,wx=Math.cos(a)*sp*dt,wy=Math.sin(a)*sp*dt;
    for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx;
      // semi-Lagrangian: read upwind, wrap at the edges so the wind keeps blowing
      let sx=gx-wx,sy=gy-wy;sx=(sx+GW)%GW;sy=clamp(sy,0,GH-1.001);const x0=sx|0,y0=sy|0,x1=(x0+1)%GW,tx=sx-x0,ty=sy-y0,y1=Math.min(GH-1,y0+1);
      const up=(Fd[y0*GW+x0]*(1-tx)+Fd[y0*GW+x1]*tx)*(1-ty)+(Fd[y1*GW+x0]*(1-tx)+Fd[y1*GW+x1]*tx)*ty;
      const avg=(Fd[gy>0?i-GW:i]+Fd[gy<GH-1?i+GW:i]+Fd[gx>0?i-1:i]+Fd[gx<GW-1?i+1:i])/4;
      let v=lerp(up,avg,.2);v+=(TG[i]-v)*.012*dt*10;G[i]=v;}
    const tmp=Fp;Fp=Fd;Fd=G;G=tmp;m.t1();stepsS++;}
  return {tick(dt){t+=dt;const mode=c.segv('rate');let lt=1;
    if(mode==='frame'){step(dt);}else{acc+=dt;while(acc>=.1){acc-=.1;step(.1);}lt=mode==='lerp'?acc/.1:1;}
    secT+=dt;if(secT>=1){sps=stepsS/secT;stepsS=0;secT=0;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const fx=x/CS-.5,fy=y/CS-.5,d=lerp(bil(Fp,GW,GH,fx,fy),bil(Fd,GW,GH,fx,fy),lt);
      const n=tabAt(TAB64,64,x+Math.floor(t*4),y);const f=sat(d*(.7+.5*n));u[y*W+x]=R[S.idx[y*W+x]*6+stepB(f,5,bay(x,y),.5)];}
    P.put();
    if(++hud%8===0)ro.innerHTML=`step <b>${fms(m.v)} ms</b> in JS here · ${sps.toFixed(0)} steps/s → <b>${fms(m.v*sps)} ms</b> per second · ${NC} cells · ${mode==='frame'?'every frame':'10 Hz'+(mode==='lerp'?', drawn as a lerp of the last two steps':', drawn raw')}<br>Measured, §6a: 80×45 step <b>0.060 ms</b> (0.34 ms throttled) · 320×180 0.93 ms · Stam solver in study #6: 32.1 ms`;}};});

// ======================================================================
// B5 clearing masks: erase, push, or subtract into a refilling field
// ======================================================================
reg('clearing',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,W=192,H=108,MW=96,MH=54,c=ctl(root),ro=$('[data-ro]',root);
  const S=scene(W,H,3),R=ramp('day',FOG_HEX.day),M=new Float32Array(MW*MH),GW=48,GH=27,FD=new Float32Array(GW*GH).fill(1),BASE=new Float32Array(W*H);
  const walker=mkWalker(S.walk.map(p=>[p[0],p[1]]),12);let tgt=null,acc=0,t=0,hud=0,writes=0;
  for(let i=0;i<W*H;i++){const th=.56-S.h[i];BASE[i]=th>0?1-Math.exp(-6*th):0;}
  pointer(cv,(p,k)=>{if(k==='leave')tgt=null;else tgt=p;});
  const lab=()=>{c.out('rp',c.v('rp')+' px');c.out('rl',c.v('rl')+' px');};c.on('rp',lab);c.on('rl',lab);lab();
  function disc(cx,cy,r){if(r<=0)return;const mx=cx/2,my=cy/2,mr=r/2;for(let y=Math.max(0,Math.floor(my-mr));y<=Math.min(MH-1,Math.ceil(my+mr));y++)for(let x=Math.max(0,Math.floor(mx-mr));x<=Math.min(MW-1,Math.ceil(mx+mr));x++){const d=Math.hypot(x+.5-mx,(y+.5-my)*1.2);if(d<mr){const v=smooth(mr,mr*.45,d);const i=y*MW+x;if(v>M[i])M[i]=v;writes++;}}}
  return {tick(dt){t+=dt;
    if(tgt){const dx=tgt[0]-walker.x,dy=tgt[1]-walker.y,d=Math.hypot(dx,dy);if(d>2){walker.x+=dx/d*24*dt;walker.y+=dy/d*24*dt;walker.moving=true;walker.anim+=dt*7;walker.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}else walker.moving=false;}
    else walker.step(dt);
    const mode=c.segv('mode'),rp=c.v('rp'),rl=c.v('rl');M.fill(0);writes=0;disc(walker.x,walker.y-5,rp);for(const l of S.lamps)if(!l.win)disc(l.x,l.y,rl);
    if(mode==='grid'){acc+=dt;while(acc>=.1){acc-=.1;for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx,m=M[(gy*2+1)*MW+gx*2+1];let v=FD[i];
        const l=FD[gx>0?i-1:i];v=lerp(v,l,.25);v+=(1-v)*.02;v-=m*.5;FD[i]=clamp(v,0,1);}}}
    const o1=Math.floor(t*9),o2=Math.floor(t*5);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,mi=(y>>1)*MW+(x>>1),m=M[mi];let sx=x,sy=y,keep=1;
      if(mode==='erase')keep=1-m;
      else if(mode==='push'&&m>0){const gx=(M[mi+1<M.length?mi+1:mi]-M[mi>0?mi-1:mi]),gy=(M[mi+MW<M.length?mi+MW:mi]-M[mi>=MW?mi-MW:mi]);sx=x+Math.round(gx*14);sy=y+Math.round(gy*14);keep=1-m*.55;}
      else if(mode==='grid')keep=bil(FD,GW,GH,x/4-.5,y/4-.5);
      const n=.6*tabAt(TAB128,128,(sx+o1)>>1,(sy)>>1)+.4*tabAt(TAB64,64,sx-o2,sy+o2);
      const f=sat(BASE[i]*(.5+n)*keep*1.2);u[i]=R[S.idx[i]*6+stepB(f,5,bay(x,y),.45)];}
    drawChar(u,W,H,walker,walker.x,walker.y);P.put();
    if(++hud%8===0)ro.innerHTML=`mask ${MW}×${MH}: <b>${writes}</b> cell writes this frame · traveller ${rp} px, lamps ${rl} px · client only: <b>0 bytes</b> sent<br>Cost on a GPU: one extra fetch, about <b>0.002 ms</b> at 720p (measured, §6a)`;}};});

// ======================================================================
// C1 dither: world-locked vs screen-locked Bayer, blue noise, temporal
// ======================================================================
reg('dither',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,W=160,H=90,c=ctl(root),ro=$('[data-ro]',root);
  const S=scene(256,90,6),SW=S.W,R=ramp('day',FOG_HEX.day),BN=blueNoise(16,5),m=meter(.1);
  // two-colour dither between fog steps (full dither, to show the pattern); world-space output buffer for flip counts
  let cam=0,dir=1,camAcc=0,t=0,frame=0,hud=0,flips=0,fogged=1,prevCam=0;const prev=new Uint32Array(SW*H),cur=new Uint32Array(SW*H);
  return {tick(dt){t+=dt;frame++;if(c.v('pan')){camAcc+=dt*14;while(camAcc>=1){camAcc-=1;cam+=dir;if(cam>=SW-W||cam<=0)dir=-dir;}}
    const mode=c.segv('mode'),o=Math.floor(t*3);m.t0();let fl=0,fg=0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const wx=x+cam,i=y*SW+wx,th=.6-S.h[i];
      const f=th>0?sat((1-Math.exp(-5*th))*(.55+.7*tabAt(TAB128,128,(wx+o)>>1,y>>1))):0;
      let b;if(mode==='world')b=bay(wx,y);else if(mode==='screen')b=bay(x,y);else if(mode==='blue')b=BN[(y&15)*16+(wx&15)]*16;else b=BN[((y+frame*7)&15)*16+((wx+frame*11)&15)]*16;
      const s=stepOf(f,4,b);if(s)fg++;const col=R[S.idx[i]*6+Math.min(5,s+(s?1:0))];u[y*W+x]=col;cur[i]=col;
      if(prev[i]&&prev[i]!==col)fl++;}
    m.t1();
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*SW+x+cam;prev[i]=cur[i];}
    if(cam!==prevCam){for(let y=0;y<H;y++){const xo=prevCam<cam?prevCam:cam+W;if(xo>=0&&xo<SW)prev[y*SW+xo]=0;}}
    prevCam=cam;flips=flips*.85+fl*.15;fogged=fogged*.85+fg*.15;P.put();
    if(++hud%8===0)ro.innerHTML=`<b>${Math.round(flips)}</b> ground pixels flipped this frame, ${(flips/Math.max(1,fogged)*100).toFixed(1)}% of the fogged ones · ${mode==='world'?'pattern pinned to world pixels':mode==='screen'?'pattern pinned to the screen: it swims when the camera moves':mode==='blue'?'blue noise, world-locked: no grid, more grain':'animated blue noise: every frame a new threshold'}<br>Cost: Bayer plus palette snap <b>0.0018 ms</b> at 320×180, <b>0.016 ms</b> at 720p on the M4; CPU 0.057 ms at 320×180 (measured, §6a)`;}};});

// ======================================================================
// C2/C3 palette lookup table vs plain alpha: off-palette colour counts
// ======================================================================
reg('paletteLUT',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),L=PX($('[data-lut]',root)),W=160,H=90,c=ctl(root),msA=$('[data-ms="a"]',root),msB=$('[data-ms="b"]',root);
  const S=scene(W,H,3),FD=new Float32Array(W*H);let t=0,hud=0,lut=null,key='',pal=null,palSet=null;
  for(let i=0;i<W*H;i++){const th=.6-S.h[i];FD[i]=th>0?1-Math.exp(-5*th):0;}
  function build(fogHex,N){const f=U(fogHex),sw=[0,.2,.4,.6,.8].map(k=>mix32(f,U('#2a2d3d'),k)).concat([mix32(f,PAL[8],.38),mix32(f,PAL[8],.62),mix32(f,PAL[7],.55),mix32(f,PAL[12],.45),mix32(f,PAL[2],.45),mix32(f,PAL[15],.5),mix32(f,PAL[23],.5),mix32(f,PAL[8],.22),mix32(f,PAL[2],.25)]);pal=Uint32Array.from([...PAL,...sw]);palSet=new Set(pal);
    lut=new Uint8Array(pal.length*(N+1));for(let i=0;i<pal.length;i++)for(let k=0;k<=N;k++){const tt=[0,.15,.29,.43,.57,.7][Math.round(k*5/N)];const ideal=mix32(desat(pal[i],tt*.55),f,tt);lut[i*(N+1)+k]=k===0?i:nearestIn(pal,ideal);}
    const lu=L.u32;for(let y=0;y<L.H;y++)for(let x=0;x<L.W;x++){const ci=Math.floor(x/6),k=Math.floor(y/7);lu[y*L.W+x]=(ci<pal.length&&k<=N)?pal[lut[ci*(N+1)+k]]:U('#0f1017');}L.put();}
  ['str','lv'].forEach(k=>c.on(k,()=>{}));
  return {tick(dt){t+=dt;const fogHex=c.segv('fc')==='sky'?FOG_HEX.day:FOG_HEX.grey,N=c.v('lv'),str=c.v('str')/100;c.out('str',Math.round(str*100)+'%');c.out('lv',N);
    if(key!==fogHex+N){key=fogHex+N;build(fogHex,N);}
    const fc=un32(U(fogHex)),o=Math.floor(t*8),ua=A.u32,ub=B.u32,seenA=new Set(),seenB=new Set();
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,n=tabAt(TAB128,128,(x+o)>>1,y>>1),f=sat(FD[i]*(.5+n)*str),k=S.idx[i];
      const ca=pal[lut[k*(N+1)+stepB(f,N,bay(x,y),.45)]];ua[i]=ca;seenA.add(ca);
      const a=un32(PAL[k]),al=f*.7,cb=pack(lerp(a[0],fc[0],al),lerp(a[1],fc[1],al),lerp(a[2],fc[2],al));ub[i]=cb;seenB.add(cb);}
    A.put();B.put();
    if(++hud%6===0){let offA=0,offB=0;seenA.forEach(v=>{if(!palSet.has(v))offA++;});seenB.forEach(v=>{if(!palSet.has(v))offB++;});
      msA.innerHTML=`<b>${seenA.size}</b> colours on screen · off-palette: <b>${offA}</b> · one table read, inside 0.016 ms at 720p`;
      msB.innerHTML=`<b>${seenB.size}</b> colours on screen · off-palette: <b>${offB}</b> · 0.010 ms per layer at 720p, 4 layers 3.9×`;}}};});

}
