// Water study: figures 1 (hero, tileclock, timeline, palcycle, hdma, tibiapattern, dualgrid, overlayshore, distfield, foamwaves, tide, flowmap)
// ======================================================================
// HERO: a small coast. 80x45 cells of 4 px, a tide on 4 steps, BFS
// distance per step, depth bands with Bayer edges, shoreward foam,
// run-up and wet sand, cycled highlights, a two-phase river, logs,
// night ramp with a moon column, and a wading walker with rings and a V.
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=320,H=180,tiers=$$('.hero-tiers button',root);
  const GW=80,GH=45,NC=GW*GH,CS=4,NP=W*H;
  const E=new Float32Array(NC),KIND=new Uint8Array(NC),FX=new Float32Array(NC),FY=new Float32Array(NC);
  const PD=new Float32Array(NP),PS=new Float32Array(NP),PR=new Float32Array(NP),PH=new Float32Array(NP),SLOT=new Uint8Array(NP);
  const rx=gy=>18+gy*.75+3*Math.sin(gy*.22),rdx=gy=>.75+.66*Math.cos(gy*.22);
  const coast=gy=>43+6*Math.sin(gy*.13+.5)-gy*.25;
  for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx;let e=(coast(gy)-gx)/10+.3*(vnoise(gx/7,gy/7)-.5);
    const di=Math.hypot(gx-66,(gy-30)*1.2);e=Math.max(e,(3.6-di)/9);E[i]=e;
    const d=rdx(gy),n=Math.hypot(d,1);FX[i]=d/n;FY[i]=1/n;}
  for(let i=0;i<NP;i++){const x=i%W,y=(i/W)|0;PH[i]=hash2(x*7+3,y*13+1);const s=Math.floor((x*.5+y*1.5+vnoise(x*.04,y*.06)*7)/3)&3;SLOT[i]=((y&1)===0&&hash2(x>>2,y*3+7)<.06)?s:255;}
  const TREES=[[34,40],[60,74],[22,122],[136,30],[140,72],[96,150]];
  let level=0,step=-1,bfsRuns=0,ms=0,scene=0,wetL=0,hud=0;
  const samp=(A,fx,fy)=>{fx=clamp(fx,0,GW-1.001);fy=clamp(fy,0,GH-1.001);const x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,i=y0*GW+x0;
    return (A[i]*(1-tx)+A[i+1]*tx)*(1-ty)+(A[i+GW]*(1-tx)+A[i+GW+1]*tx)*ty;};
  function rebuild(lvl){level=lvl;for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx;let k=E[i]<lvl?1:0;
      if(!k&&Math.abs(gx+.5-rx(gy))<1.7)k=2;KIND[i]=k;}
    const dc=distBFS(GW,GH,i=>KIND[i]>0),ds=distBFS(GW,GH,i=>KIND[i]===1);bfsRuns++;
    const C=new Float32Array(NC),S=new Float32Array(NC),Rv=new Float32Array(NC);
    for(let i=0;i<NC;i++){C[i]=clamp(dc[i],-6,20)-Math.sign(dc[i])*.5;S[i]=clamp(ds[i],-6,20)-Math.sign(ds[i])*.5;Rv[i]=KIND[i]===2?1:0;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const fx=(x+.5)/CS-.5,fy=(y+.5)/CS-.5,i=y*W+x;PD[i]=samp(C,fx,fy);PS[i]=samp(S,fx,fy);PR[i]=samp(Rv,fx,fy);}}
  // walker, logs, ring pool
  const P=mkPool(64),me={x:0,y:146,dir:'right',moving:true,anim:0},walk={tx:0,lx:0,sx:0,travel:0,wake:0};
  function findWalk(){const y=me.y;let lx=0,sx=0,x=0;for(;x<W;x++){const d=PS[y*W+x];if(d<-2.6)lx=x;if(d>0)break;}for(;x<W;x++)if(PS[y*W+x]>2.6){sx=x;break;}walk.lx=lx;walk.sx=sx||Math.min(W-4,lx+60);
    if(walk.tx!==walk.lx)walk.tx=walk.sx;}
  const logs=[{g:2,on:0},{g:-9,on:0},{g:-20,on:0}];
  const put=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=c;};
  const isW=(x,y)=>PD[y*W+x]>0;
  function setScene(t){scene=t;tiers.forEach(b=>b.classList.toggle('on',+b.dataset.t===t));P.clear();
    if(t===3){findWalk();me.x=walk.lx;walk.tx=walk.sx;}if(t===1){logs[0].g=6;logs[1].g=-4;logs[2].g=-14;logs.forEach(L=>L.on=0);}}
  tiers.forEach(b=>b.addEventListener('click',()=>setScene(+b.dataset.t)));
  rebuild(0);setScene(0);
  function tree(tx,ty,night){const k=night?.42:1,T=c=>night?mulc(c,.35,.42,.62):c;for(let j=-2;j<=2;j++)for(let i=-6;i<=6;i++)if(i*i/36+j*j/4<=1)put(tx+i+1,ty+j+1,T(mulc(WC.grass,.62,.62,.62)));
    for(let j=0;j<4;j++){put(tx,ty-j,T(WC.trunk));put(tx+1,ty-j,T(WC.wood3));}
    for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){const d=i*i+j*j;if(d>36)continue;const lit=(i+j)<-3,dark=(i+j)>4;put(tx+i,ty-9+j,T(lit?WC.leaf2:dark?WC.leaf3:WC.leaf));}
    put(tx-2,ty-12,T(U('#5aa35a')));put(tx-3,ty-11,T(U('#5aa35a')));void k;}
  return {tick(dt){ms+=dt*1000;const t=ms/1000,night=scene===2;
    // server-side tide: 4 steps on a slow clock (40 s here, illustrative)
    const st=Math.round((Math.sin(t*2*Math.PI/40)+1)/2*3);if(st!==step){step=st;rebuild([-.14,-.05,.05,.14][st]);if(scene===3)findWalk();}
    const T=4.6,run=.6*Math.max(0,Math.sin(t*2*Math.PI/T));wetL=Math.max(run,wetL-dt*.6);
    const ramp=night?NIGHT_HEX.sea:RAMP_HEX.sea,RA=night?NR:RS,RV=night?NRV:RRV,pstep=Math.floor(t*8),moonX=232;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,d=PD[i],s=PS[i];let c;
      if(d>0&&PR[i]>.45&&s<=.6){// river: two-phase scroll along the flow byte
        const ci=clamp((y/CS)|0,0,GH-1)*GW+clamp((x/CS)|0,0,GW-1),fx=FX[ci],fy=FY[ci],sp=t*.55,p0=sp-Math.floor(sp),p1=(sp+.5)-Math.floor(sp+.5),w0=1-Math.abs(1-2*p0);
        const p=bay(x,y)<w0*16?p0:p1,o=p*12+(p===p0?0:37),xx=x-fx*o,yy=y-fy*o;
        c=RV[PR[i]>.85?2:PR[i]>.65?1:0];if(hash2(Math.floor(xx/2),Math.floor(yy))<.1)c=night?HI[0]:HI[1];}
      else if(d>0){// sea: depth band by distance, Bayer at band edges
        const bf=clamp(s*.5-.15,0,4.99),b=bf|0,fr=bf-b;let bb=b;if(b<4&&dith(x,y,(fr-.6)/.4))bb++;c=RA[bb];
        const sl=SLOT[i];if(sl!==255&&s>1){const k=(sl+pstep)&3;if(k===1||k===3)c=night?mulc(HI[0],.6,.7,.9):HI[0];else if(k===2)c=night?HI[0]:HI[1];}
        if(s<3.4){const ph=s*.5+t/T,f=ph-Math.floor(ph);if(f<.09+(3.4-s)*.02)c=s<1.6?(night?HI[0]:WC.foam):(night?mulc(HI[0],.7,.8,1):WC.foam2);}
        if(s<.45)c=night?HI[0]:WC.foam;
        if(s>2&&hashI(x,y,Math.floor(t*4),3)<2.6e6)c=WC.white;
        if(night&&s>1.5){const wob=Math.sin(y*.35+t*2.2)*3,w=1.5+y*.03;if(Math.abs(x-moonX-wob)<w&&(y+pstep)%3===0&&PH[i]<.6)c=PH[i]<.25?WC.moon:HI[0];}}
      else{// land
        const h=PH[i];if(s>-2.4&&PR[i]<.25){c=h<.15?WC.sand2:h>.9?WC.sand3:WC.sand;
          if(-s<wetL)c=dith(x,y,clamp((wetL+s)/.5,0,1)*.9+.1)?WC.wet:c;
          if(-s<run){c=dith(x,y,.75)?RA[0]:WC.foam2;if(-s>run-.22)c=WC.foam;}}
        else if(PR[i]>.2)c=h<.5?WC.dirt:WC.dirt2;
        else c=h<.07?WC.grass3:h<.35?WC.grass2:WC.grass;
        if(night)c=mulc(c,.32,.38,.6);}
      u[i]=c;}
    for(const [tx,ty] of TREES)tree(tx,ty,night);
    // ring pool: squashed 1 px ellipses clipped to water
    const rc=night?HI[0]:WC.foam2;P.step(dt,0,0,1);
    for(let j=0;j<64;j++){if(P.life[j]<=0)continue;const f=P.age[j]/P.life[j];ringAt(u,W,H,P.x[j],P.y[j],.6+f*(P.vx[j]||5),f<.6?rc:RA[0],.5,isW);}
    if(scene===1){for(const L of logs){L.g+=dt*2.4;let x,y;if(L.g<0)continue;const gy=L.g;
        x=rx(gy)*CS;y=gy*CS;let dd=PS[clamp(y|0,0,H-1)*W+clamp(x|0,0,W-1)];
        if(dd>0){L.on+=dt;x+=L.on*14;y+=Math.sin(L.on*.7)*4;}else L.on=0;if(x>W+8||y>H+8){L.g=-6;L.on=0;continue;}
        const bob=Math.sin(t*Math.PI+L.g)>0?0:1;for(let i=-4;i<=4;i++){put(x+i,y+bob-1,WC.wood2);put(x+i,y+bob,WC.wood);put(x+i,y+bob+1,WC.wood3);}put(x-4,y+bob,WC.trunk);put(x+4,y+bob,U('#c8945a'));put(x-5,y+bob,WC.trunk);for(let i=-3;i<=3;i+=2)put(x+i,y+bob+2,WC.foam2);
        if(hash2(Math.floor(t*2),L.g|0)<dt*6)P.spawn(x,y+2,4,0,1.1);}}
    if(scene===3){const ix=clamp(Math.round(me.x),0,W-1),dd=PS[me.y*W+ix],sp=dd<=0?22:dd<1.6?13:9;const dir=Math.sign(walk.tx-me.x);
      me.dir=dir>0?'right':'left';me.moving=true;me.anim+=dt*(dd<=0?8:5);const mv=dir*sp*dt;me.x+=mv;
      if(Math.abs(walk.tx-me.x)<1){walk.tx=walk.tx===walk.sx?walk.lx:walk.sx;}
      if(dd>0){walk.travel+=Math.abs(mv);walk.wake+=Math.abs(mv);if(walk.travel>=8){walk.travel=0;P.spawn(me.x,me.y,6,0,1.2);}
        if(walk.wake>=6){walk.wake=0;const bx=-dir;for(let k=1;k<=3;k++){const px=me.x+bx*4*k;P.spawn(px,me.y+4*k*.354,2,0,1);P.spawn(px,me.y-4*k*.354,2,0,1);}}}
      const clip=dd<=0?0:dd<1.6?4:9;drawChar(u,W,H,me,me.x,me.y,clip,CHAR_PAL,night?(c=>mulc(c,.4,.45,.7)):null);
      if(clip)for(let i=-3;i<=3;i++)put(me.x+i,me.y-clip+1,night?HI[0]:WC.foam);}
    F.put();
    if(++hud%10===0){const mode=['coast','river','night','wade'][scene];setHud(root,`tide step ${step+1}/4 · BFS reruns ${bfsRuns} · palette step ${pstep%4} · rings ${P.count()}/64 · ${mode}`);}}};});
const RS=Uint32Array.from(RAMP_HEX.sea,U),NR=Uint32Array.from(NIGHT_HEX.sea,U),RRV=Uint32Array.from(RAMP_HEX.river,U),NRV=Uint32Array.from(['#3a6f86','#2c5a78','#22486a'],U);

// ======================================================================
// Context / A2: animated tile frames on a shared clock vs per-tile phase
// ======================================================================
reg('tileclock',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),TS=16,TX=W/TS,TY=H/TS;
  let frames=4,hold=16,unit='vf',ms=0;const PHS=new Uint8Array(TX*TY);for(let i=0;i<PHS.length;i++)PHS[i]=hashI(i,7,0,1)%64;
  const R=RS;
  const PRE={alttp:[3,9,'vf'],ladx:[4,16,'vf'],ladxc:[4,4,'vf'],emer:[8,16,'vf'],stardew:[10,200,'ms'],tibia:[16,500,'ms']};
  $$('[data-pre]',root).forEach(b=>b.addEventListener('click',()=>{const p=PRE[b.dataset.pre];frames=p[0];hold=p[1];unit=p[2];$$('[data-pre]',root).forEach(x=>x.classList.toggle('on',x===b));
    if(unit==='vf'){c.el('hold').value=hold;}lab();}));
  const lab=()=>{c.out('hold',unit==='vf'?hold+' vf':hold+' ms');};
  c.on('hold',()=>{hold=c.v('hold');unit='vf';$$('[data-pre]',root).forEach(x=>x.classList.remove('on'));lab();});lab();
  // one water tile, frame f of n. wrap=true: streaks continue across tile edges; false: a blob that pulses in the middle
  function px(i,j,f,n,wrap){const base=R[1];if(wrap){const o=Math.floor(f*16/n);if(((i+o+(j>>3)*5)&15)<3&&(j&7)===3)return HI[0];if(((i-o*.5+8+(j>>3)*3)&15)<2&&(j&7)===6)return R[0];return base;}
    const k=f/n,r=2+Math.round(4*Math.abs(Math.sin(k*Math.PI)));const dx=i-7.5,dy=j-7.5;if(dx*dx+dy*dy<r*r&&dx*dx+dy*dy>(r-1.6)*(r-1.6))return HI[f===0?1:0];return f===0?R[0]:base;}
  return {tick(dt){ms+=dt*1000;const holdMs=unit==='vf'?hold*1000/60:hold,sync=c.segv('ph')==='sync',wrap=c.v('wrap');
    const g=Math.floor(ms/holdMs);
    for(let ty=0;ty<TY;ty++)for(let tx=0;tx<TX;tx++){const f=(g+(sync?0:PHS[ty*TX+tx]))%frames,shore=ty===0;
      // shore row: sand with a foam edge that runs up and back on the same clock
      const ru=Math.round(3*Math.sin(f/frames*2*Math.PI));
      for(let j=0;j<TS;j++)for(let i=0;i<TS;i++){const x=tx*TS+i,y=ty*TS+j;let col;
        if(shore){const edge=8+ru;col=j<edge-1?(hash2(x,y)<.2?WC.sand2:WC.sand):j<edge+1?WC.foam:j<edge+2?WC.foam2:R[0];}
        else col=px(i,j,f,frames,wrap);
        u[y*W+x]=col;}}
    if(c.v('grid'))for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x%TS===0||y%TS===0)u[y*W+x]=mix32(u[y*W+x],WC.black,.35);
    F.put();
    const loop=frames*holdMs/1000,fps=1000/holdMs;
    ro.innerHTML=`${frames} frames × ${unit==='vf'?hold+' video frames':hold+' ms'} = loop <b>${loop.toFixed(2)} s</b> · ${fps.toFixed(fps<10?2:1)} fps · ${sync?'every tile on frame '+(g%frames):'each tile on its own frame'}`+
      ` · ${fps>=7?'fast water band':fps>=2.3?'calm water band':'slower than the classic band'}`;}};});

// ======================================================================
// §3 timeline
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#96a9b8','#e8c88a','#3b9be0','#6fe0d2'];
  const X=y=>y<1985?(y-1882)/103*22:y<2021?24+(y-1985)/36*46:72+(y-2021)/6*27;
  let h='<div class="tl-axis">';for(const y of [1887,1950,1990,2000,2010])h+=`<span style="left:${X(y)}%">${y}</span>`;h+=`<span style="left:${X(2022)}%">2022</span><span style="left:${X(2024)}%">2024</span><span style="left:${X(2026.3)}%">2026</span><i class="tl-brk" style="left:70.9%"></i><i class="tl-brk" style="left:22.9%"></i></div>`;
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
  const pick=items.find(i=>/Pokémon Red/.test(i.e.h))||items[0];show(pick.id);return {};});

// ======================================================================
// A1: palette cycling. The index picture never changes; 4 reserved slots rotate.
// ======================================================================
reg('palcycle',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),pc=$('[data-pal]',root),pg=pc.getContext('2d');
  // palette: 0-1 sand, 2-3 grass, 4-8 sea ramp, 9 foam, 10-11 rock, 12-15 reserved highlight slots
  const BASE=[WC.sand,WC.sand2,WC.grass,WC.grass2].concat([...RS]).concat([WC.foam,WC.rock,WC.rock3]);
  const CYC=[RS[1],HI[0],HI[1],HI[0]];// colours that travel through the 4 slots
  const IDX=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const shore=26+5*Math.sin(y*.12)+3*vnoise(x*.1,y*.1),d=x-shore;let k;
    if(d<0)k=d<-10?(hash2(x,y)<.3?3:2):(hash2(x,y)<.18?1:0);
    else{k=4+Math.min(4,Math.floor(d/14+vnoise(x*.08,y*.08)*.6));if(d<2)k=9;
      // highlight streaks: slot from a diagonal wave index, so rotating slots makes the streaks travel
      const s=Math.floor((x*.6+y*1.4+vnoise(x*.05,y*.07)*8)/2.5)&3;if(d>5&&hash2(x>>1,y*5)<.11&&(y&1))k=12+s;
      // a stream on the right edge falls through the same 4 slots
      if(x>=W-14&&x<W-6){k=12+((Math.floor(y/2)+(x&1))&3);}}
    IDX[y*W+x]=k;}
  const pal=new Uint32Array(16);let acc=0,st=0;
  const lab=()=>{const r=c.v('rate');c.out('rate',r+'/s');};c.on('rate',lab);lab();
  return {tick(dt){const rate=c.v('rate'),mode=c.segv('mode'),blend=c.v('blend'),only=c.v('only');acc+=dt*rate;while(acc>=1){acc-=1;st++;}
    for(let k=0;k<12;k++)pal[k]=BASE[k];
    const fr=blend?acc:0,PP=[0,1,2,1],C3=[RS[1],HI[0],HI[1]];
    for(let k=0;k<4;k++){let a,b;if(mode==='rot'){a=CYC[(k+st)&3];b=CYC[(k+st+1)&3];}else{a=C3[PP[st&3]];b=C3[PP[(st+1)&3]];}
      pal[12+k]=fr?mix32(a,b,fr):a;}
    const grey=U('#202830');for(let i=0;i<W*H;i++){const k=IDX[i];u[i]=only&&k<12?mix32(pal[k],grey,.8):pal[k];}
    F.put();
    // palette strip: 16 slots, reserved ones underlined
    const sw=pc.width/16;pg.clearRect(0,0,pc.width,pc.height);for(let k=0;k<16;k++){const v=un32(pal[k]);pg.fillStyle=rgbCss(v[0],v[1],v[2]);pg.fillRect(k*sw+1,1,sw-2,pc.height-8);
      if(k>=12){pg.fillStyle='#6fe0d2';pg.fillRect(k*sw+1,pc.height-5,sw-2,4);}}
    ro.innerHTML=`step ${st} · palette writes this step: <b>4</b> · pixels the game redraws: <b>0</b> · DPaint rate ${Math.round(rate*16384/60)} (16384 = 60 steps/s)${mode==='pp'?' · one colour, ping-pong 0, 1, 2, 1':''}`;}};});

// ======================================================================
// A3: row-offset waves (HDMA): one horizontal scroll value per scanline
// ======================================================================
reg('hdma',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),u=F.u32,W=F.W,H=F.H,G=PX(cvs[1]),c=ctl(root),ro=$('[data-ro]',root);
  // a still underwater scene: sandy floor, rocks, weed, a sunken pillar and a fish
  const SRC=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=hash2(x,y);let col=y<H*.55?mix32(RS[2],RS[3],y/(H*.55)):(h<.2?WC.sand2:WC.sand);
    if(y>=H*.55)col=mix32(col,RS[1],.35);
    const rk=Math.hypot((x-40)/14,(y-70)/8);if(rk<1)col=rk<.6?WC.rock2:WC.rock;
    const rk2=Math.hypot((x-118)/10,(y-78)/6);if(rk2<1)col=WC.rock3;
    if(x>=86&&x<98&&y>24&&y<74)col=(x===86||x===97)?WC.rock3:(y%10===0?WC.rock:WC.rock2);if(x>=82&&x<102&&y>=20&&y<26)col=WC.rock2;
    for(const wx of [20,60,140]){const sx=wx+Math.round(2*Math.sin(y*.3));if(y>H*.45&&Math.abs(x-sx)<1)col=WC.leaf2;}
    SRC[y*W+x]=col;}
  const fish=[[0,0,0,1,1,1,0,0],[0,1,1,2,2,2,1,0],[1,1,2,2,3,2,2,1],[0,1,1,2,2,2,1,0],[0,0,0,1,1,1,0,0]],FC2=[0,U('#c98a3a'),U('#e8b45a'),U('#1a1210')];
  for(let j=0;j<5;j++)for(let i=0;i<8;i++){const v=fish[j][i];if(v)SRC[(40+j)*W+56+i]=FC2[v];}
  let ms=0;const OFF=new Float32Array(H);
  function lab(){c.out('amp',c.v('amp')+' px');c.out('per',c.v('per')+' rows');c.out('spd',(c.v('spd')/10).toFixed(1)+' Hz');}['amp','per','spd'].forEach(k=>c.on(k,lab));lab();
  return {tick(dt){ms+=dt*1000;const A=c.v('amp'),Pp=c.v('per'),w=c.v('spd')/10*2*Math.PI,t=ms/1000,snap=c.v('snap');
    for(let y=0;y<H;y++)OFF[y]=A*Math.sin(y*2*Math.PI/Pp+t*w);
    for(let y=0;y<H;y++){const o=OFF[y];for(let x=0;x<W;x++){let col;if(snap){const sx=((x-Math.round(o))%W+W)%W;col=SRC[y*W+sx];}
        else{const fx=x-o,x0=Math.floor(fx),f=fx-x0,a=SRC[y*W+((x0%W)+W)%W],b=SRC[y*W+(((x0+1)%W)+W)%W];col=mix32(a,b,f);}u[y*W+x]=col;}}
    F.put();
    // the HDMA table: one value per scanline, drawn as bars around the centre
    const g=G.u32,GW2=G.W,bg=U('#0b1218'),ax=U('#344b5c');g.fill(bg);for(let y=0;y<G.H;y++){const o=OFF[Math.floor(y*H/G.H)],cx=GW2>>1,len=Math.round(o*(GW2/2-2)/16);
      for(let x=Math.min(cx,cx+len);x<=Math.max(cx,cx+len);x++)g[y*GW2+x]=x===cx+len?HI[1]:RS[1];if(len!==0)g[y*GW2+cx]=ax;}
    G.put();
    ro.innerHTML=`${H} scanlines × 2 bytes (BG1HOFS, "write twice") = <b>${H*2} bytes</b> per frame · CPU work per pixel: <b>0</b> · ${A<=2?'calm-water range (1 to 2 px)':A>=4?'heat or dream range (4 to 16 px)':'between calm and dream'}${snap?'':' · sub-pixel offsets blend into mixels'}`;}};});

// ======================================================================
// A4: Tibia water, 500 ms phases from one clock, sprite pattern by position
// ======================================================================
reg('tibiapattern',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),TS=16,TEX=64;
  // a 64x64 seamless sea texture = 4x4 patterns of 16 px. Each phase slides its streaks one step.
  function texel(x,y,ph,n){x=((x%TEX)+TEX)%TEX;y=((y%TEX)+TEX)%TEX;const a=2*Math.PI/TEX,p=ph/n*2*Math.PI;
    const v=Math.sin(x*a+Math.sin(y*a*2)*1.3+p)+Math.sin(y*a*3+Math.cos(x*a)*1.7-p)*.8+Math.sin((x+y)*a*2)*.4;
    return v>1.35?HI[0]:v>.9?RS[0]:v<-1.5?RS[3]:v<-.6?RS[2]:RS[1];}
  let ms=0;c.on('ph',()=>c.out('ph',c.v('ph')));c.out('ph',c.v('ph'));
  return {tick(dt){ms+=dt*1000;const n=c.v('ph'),phase=Math.floor((ms%(500*n))/500),pat=+c.segv('pat'),grid=c.v('grid');
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const tx=(x/TS)|0,ty=(y/TS)|0,qx=pat?tx%pat:0,qy=pat?ty%pat:0;let col=texel(qx*TS+(x%TS),qy*TS+(y%TS),phase,n);
      const d=Math.hypot((x-150)/18,(y-30)/12);if(d<1)col=d<.7?(hash2(x,y)<.3?WC.grass2:WC.grass):d<.85?WC.sand:WC.foam;
      if(grid&&(x%TS===0||y%TS===0))col=mix32(col,WC.black,.4);u[y*W+x]=col;}
    F.put();
    ro.innerHTML=`phase = (millis % (500 × ${n})) / 500 = <b>${phase}</b> · loop ${(n*.5).toFixed(1)} s · pattern ${pat>1?pat+'×'+pat+', sprite from position.x % '+pat+' and position.y % '+pat:'1×1, every tile the same sprite'} · bytes sent for water: <b>0</b>`;}};});

// ======================================================================
// B1: autotiling the coast. Blob 47 vs Wang 16 (edges) vs dual grid 16
// ======================================================================
reg('dualgrid',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),CS=24,MW=W/CS,MH=H/CS;
  const L=new Uint8Array(MW*MH);// 1 = land
  const PRE={island:()=>{for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const d=Math.hypot((x-4.5)/2.6,(y-3)/2);L[y*MW+x]=d<1?1:0;}L[2*MW+6]=1;L[4*MW+2]=0;L[1*MW+8]=1;},
    lake:()=>{for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const d=Math.hypot((x-4.5)/3,(y-3)/2.1);L[y*MW+x]=d<1?0:1;}L[3*MW+8]=0;L[3*MW+9]=0;L[5*MW+2]=1;},
    random:()=>{const s=rnd()*99;for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)L[y*MW+x]=vnoise(x/2.3+s,y/2.3)>.52?1:0;},clear:()=>L.fill(0)};
  PRE.island();
  ['island','lake','random','clear'].forEach(k=>c.btn(k,()=>PRE[k]()));
  const isL=(x,y)=>{x=clamp(x,0,MW-1);y=clamp(y,0,MH-1);return L[y*MW+x];};
  // blob 47: 8-bit mask of same-terrain neighbours, corners count only when both edges are set
  const red=m=>{const N=1,NE=2,E=4,SE=8,S=16,SW=32,Wb=64,NW=128;if(!(m&N&&m&E))m&=~NE;if(!(m&S&&m&E))m&=~SE;if(!(m&S&&m&Wb))m&=~SW;if(!(m&N&&m&Wb))m&=~NW;return m;};
  const uniq=[...new Set([...Array(256).keys()].map(red))].sort((a,b)=>a-b),BLOB=new Map(uniq.map((m,i)=>[m,i]));
  const D8=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
  let paint=-1;pointer(cv,([px,py],ty)=>{const x=(px/CS)|0,y=(py/CS)|0;if(x<0||y<0||x>=MW||y>=MH)return;if(ty==='down')paint=L[y*MW+x]?0:1;if((ty==='down'||ty==='drag')&&paint>=0)L[y*MW+x]=paint;if(ty==='up')paint=-1;});
  const R=RS,col=(v,x,y)=>v===2?(hash2(x,y)<.25?WC.grass2:WC.grass):v===1?(hash2(x,y)<.2?WC.sand2:WC.sand):v===3?WC.foam:(((x+y*3)%11===0&&hash2(x>>2,y)<.3)?R[0]:R[1]);
  const lbl=(x,y,n,bg)=>{const s=String(n),w=s.length*4-1;for(let j=-1;j<6;j++)for(let i=-1;i<=w;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=bg;}digits(u,W,H,x,y,s,WC.white);};
  return {tick(){const sch=c.segv('s'),labels=c.v('lab');const used=new Set();let bad=0;const badCells=[];
    if(sch==='dual'){// draw tiles on the half-offset grid: each looks at 4 map cells
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const hc=CS/2,dx=Math.floor((x+hc)/CS),dy=Math.floor((y+hc)/CS),s=((x+hc)%CS+.5)/CS,t=((y+hc)%CS+.5)/CS;
        const a=isL(dx-1,dy-1),b=isL(dx,dy-1),cc=isL(dx-1,dy),d=isL(dx,dy),v=(a*(1-s)+b*s)*(1-t)+(cc*(1-s)+d*s)*t;
        u[y*W+x]=col(v>.64?2:v>.5?1:v>.43?3:0,x,y);}
      for(let dy=0;dy<=MH;dy++)for(let dx=0;dx<=MW;dx++){const m=isL(dx-1,dy-1)|isL(dx,dy-1)<<1|isL(dx-1,dy)<<2|isL(dx,dy)<<3;used.add(m);}}
    else{for(let my=0;my<MH;my++)for(let mx=0;mx<MW;mx++){const land=isL(mx,my);let m=0;D8.forEach(([ox,oy],k)=>{const nx=mx+ox,ny=my+oy;const same=(nx<0||ny<0||nx>=MW||ny>=MH)?1:(L[ny*MW+nx]===land?1:0);if(same)m|=1<<k;});
        const ed=[!(m&1),!(m&4),!(m&16),!(m&64)];// N E S W differs
        const cn=[[0,2,1],[2,4,3],[4,6,5],[6,0,7]].map(([e1,e2,k])=>(m&(1<<e1))&&(m&(1<<e2))&&!(m&(1<<k)));// inner corners: both edges same, corner differs
        if(sch==='blob')used.add(land*1000+red(m));else used.add(land*100+(ed[0]|ed[1]<<1|ed[2]<<2|ed[3]<<3));
        if(sch==='wang'&&!land&&cn.some(Boolean)){bad++;badCells.push([mx,my]);}
        for(let j=0;j<CS;j++)for(let i=0;i<CS;i++){const x=mx*CS+i,y=my*CS+j;let v;
          if(land)v=2;else{let dd=99;if(ed[0])dd=Math.min(dd,j+.5);if(ed[1])dd=Math.min(dd,CS-i-.5);if(ed[2])dd=Math.min(dd,CS-j-.5);if(ed[3])dd=Math.min(dd,i+.5);
            if(sch==='blob'){const cx=[[CS,0],[CS,CS],[0,CS],[0,0]];cn.forEach((on,k)=>{if(on)dd=Math.min(dd,Math.hypot(i+.5-cx[k][0],j+.5-cx[k][1]));});}
            v=dd<CS*.2?1:dd<CS*.28?3:0;}
          u[y*W+x]=col(v,x,y);}}}
    // grids: map grid always, the dual grid dashed when it is in use
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(x%CS===0||y%CS===0)u[y*W+x]=mix32(u[y*W+x],WC.black,.28);
      if(sch==='dual'&&(((x+CS/2)%CS===0&&(y>>1)%2===0)||((y+CS/2)%CS===0&&(x>>1)%2===0)))u[y*W+x]=mix32(u[y*W+x],WC.white,.45);}
    for(const [mx,my] of badCells)for(let k=0;k<CS;k++){const red_=U('#ff6b5e');u[(my*CS)*W+mx*CS+k]=red_;u[(my*CS+CS-1)*W+mx*CS+k]=red_;u[(my*CS+k)*W+mx*CS]=red_;u[(my*CS+k)*W+mx*CS+CS-1]=red_;}
    if(labels){const bg=U('#0b1218');if(sch==='dual'){for(let dy=1;dy<MH;dy++)for(let dx=1;dx<MW;dx++){const m=isL(dx-1,dy-1)|isL(dx,dy-1)<<1|isL(dx-1,dy)<<2|isL(dx,dy)<<3;if(m!==0&&m!==15)lbl(dx*CS-(m>9?3:1),dy*CS-2,m,bg);}}
      else for(let my=0;my<MH;my++)for(let mx=0;mx<MW;mx++){if(isL(mx,my))continue;let m=0;D8.forEach(([ox,oy],k)=>{const nx=mx+ox,ny=my+oy;const same=(nx<0||ny<0||nx>=MW||ny>=MH)?1:(L[ny*MW+nx]===0?1:0);if(same)m|=1<<k;});
        const n=sch==='blob'?BLOB.get(red(m)):((!(m&1))|(!(m&4))<<1|(!(m&16))<<2|(!(m&64))<<3);if(red(m)!==255)lbl(mx*CS+(n>9?CS/2-4:CS/2-2),my*CS+CS/2-3,n,bg);}}
    F.put();
    const full={blob:47,wang:16,dual:16}[sch],kb={blob:'188 KB',wang:'64 KB',dual:'64 KB (24 KB with rotation, but 3/4 view needs 15 or 16 drawn)'}[sch];
    ro.innerHTML=`distinct tiles this map uses: <b>${used.size}</b> of ${full}${sch==='dual'?' (15 if all-water draws nothing)':''} · art per terrain pair per frame at 32×32 RGBA: ${kb}`+
      (sch==='wang'?` · <b>${bad}</b> water cell${bad===1?'':'s'} need an inner corner that edge tiles cannot draw (red)`:'')+(sch==='dual'?' · an edit touches 4 display cells':'');}};});

// ======================================================================
// B2: overlay shores on one animated water tile (Ultima VI, Tibia)
// ======================================================================
reg('overlayshore',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),CS=16,MW=W/CS,MH=H/CS;
  const L=new Uint8Array(MW*MH);for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const s=3.2+1.4*Math.sin(y*1.1)+(y>3?1:0);L[y*MW+x]=x<s?1:0;}L[0*MW+6]=1;L[0*MW+7]=1;L[1*MW+7]=1;L[4*MW+7]=1;L[4*MW+8]=1;L[5*MW+8]=1;
  const isL=(x,y)=>(x<0||y<0||x>=MW||y>=MH)?0:L[y*MW+x];
  let ms=0;
  pointer(cv,([px,py],ty)=>{if(ty!=='down')return;const x=(px/CS)|0,y=(py/CS)|0;if(x>=0&&y>=0&&x<MW&&y<MH)L[y*MW+x]^=1;});
  // the one animated water tile: 4 frames on the shared clock
  const wpx=(x,y,f)=>{const o=f*4;return ((x+o+(y>>3)*6)&15)<3&&(y&7)===2?HI[0]:((x-o+20+(y>>3)*2)&15)<2&&(y&7)===5?RS[0]:RS[1];};
  return {tick(dt){ms+=dt*1000;const f=tileFrame(ms,4,250),ov=c.v('ov'),only=c.v('only'),seen=new Set();
    for(let my=0;my<MH;my++)for(let mx=0;mx<MW;mx++){const land=isL(mx,my);
      const e=[isL(mx,my-1),isL(mx+1,my),isL(mx,my+1),isL(mx-1,my)],dg=[isL(mx+1,my-1),isL(mx+1,my+1),isL(mx-1,my+1),isL(mx-1,my-1)];
      const inner=[dg[0]&&!e[0]&&!e[1],dg[1]&&!e[1]&&!e[2],dg[2]&&!e[2]&&!e[3],dg[3]&&!e[3]&&!e[0]];
      if(!land&&ov){e.forEach((v,k)=>{if(v)seen.add('e'+k);});[[0,1],[1,2],[2,3],[3,0]].forEach(([a,b],k)=>{if(e[a]&&e[b])seen.add('o'+k);});inner.forEach((v,k)=>{if(v)seen.add('i'+k);});}
      for(let j=0;j<CS;j++)for(let i=0;i<CS;i++){const x=mx*CS+i,y=my*CS+j;let col;
        if(land)col=only?U('#26323c'):(hash2(x,y)<.2?WC.grass2:WC.grass);
        else{col=only?(((x>>2)+(y>>2))&1?U('#3a4752'):U('#2e3943')):wpx(x,y,f);
          if(ov){let dd=99;if(e[0])dd=Math.min(dd,j+.5);if(e[1])dd=Math.min(dd,CS-i-.5);if(e[2])dd=Math.min(dd,CS-j-.5);if(e[3])dd=Math.min(dd,i+.5);
            const cx=[[CS,0],[CS,CS],[0,CS],[0,0]];inner.forEach((on,k)=>{if(on)dd=Math.min(dd,Math.hypot(i+.5-cx[k][0],j+.5-cx[k][1]));});
            if(dd<3)col=hash2(x,y)<.2?WC.sand2:WC.sand;else if(dd<4.3)col=WC.foam;else if(dd<5.3&&!only)col=WC.foam2;}}
        u[y*W+x]=col;}}
    if(c.v('grid'))for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x%CS===0||y%CS===0)u[y*W+x]=mix32(u[y*W+x],WC.black,.3);
    F.put();
    const ne=[...seen].filter(s=>s[0]==='e').length,no=[...seen].filter(s=>s[0]==='o').length,ni=[...seen].filter(s=>s[0]==='i').length;
    ro.innerHTML=`animated art: <b>4 frames × 1 water tile</b> (frame ${f}) · static overlay pieces in use: ${ne} edges, ${no} outer corners, ${ni} inner corners (${seen.size} of about 12) · with animated borders instead: 16 border tiles × 4 frames = 64`;}};});

// ======================================================================
// B3: distance to shore. Multi-source BFS (4- or 8-way) or chamfer 3-4, animated
// ======================================================================
reg('distfield',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),CS=4,GW=W/CS,GH=H/CS,N=GW*GH,INF=30000;
  const L=new Uint8Array(N),D=new Int32Array(N);
  function preset(){for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x;const coast=8+3*Math.sin(y*.35)+2*vnoise(x*.2,y*.2);let l=x<coast?1:0;
      const di=Math.hypot((x-31)/7,(y-15)/5.5);if(di<1)l=1;if(Math.abs(x-26)<1.5&&y>9&&y<14)l=1;L[i]=l;}start();}
  let q=[],lvl=0,phase='idle',row=0,mode='8',maxd=0,hover=-1;
  function start(){mode=c.segv('m');D.fill(INF);q=[];lvl=1;maxd=0;
    const W4=[[1,0],[-1,0],[0,1],[0,-1]];
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x;for(const [dx,dy] of W4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;if(L[ny*GW+nx]!==L[i]){D[i]=(L[i]?-1:1)*(mode==='c'?3:1);q.push(i);break;}}}
    phase=mode==='c'?'fwd':'bfs';row=0;}
  function stepBFS(){const nb=mode==='4'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],nq=[];
    for(const i of q){const x=i%GW,y=(i/GW)|0,s=D[i]>0?1:-1;for(const [dx,dy] of nb){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;
      if((L[n]?-1:1)!==s)continue;if(Math.abs(D[n])>Math.abs(D[i])+1){D[n]=D[i]+s;nq.push(n);}}}
    q=nq;lvl++;if(!q.length)phase='idle';}
  function chamRow(y,back){const xs=back?[...Array(GW).keys()].reverse():[...Array(GW).keys()],K=back?[[1,0,3],[0,1,3],[1,1,4],[-1,1,4]]:[[-1,0,3],[0,-1,3],[-1,-1,4],[1,-1,4]];
    for(const x of xs){const i=y*GW+x,s=L[i]?-1:1;for(const [dx,dy,w] of K){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(Math.abs(D[n])>=INF||(L[n]?-1:1)!==s)continue;
      const v=Math.abs(D[n])+w;if(v<Math.abs(D[i]))D[i]=s*v;}}}
  let acc=0,paint=-1;
  pointer(cv,([px,py],ty)=>{const x=(px/CS)|0,y=(py/CS)|0;if(x<0||y<0||x>=GW||y>=GH){hover=-1;return;}hover=y*GW+x;
    if(ty==='down')paint=L[hover]?0:1;if((ty==='down'||ty==='drag')&&paint>=0){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<GW&&yy<GH)L[yy*GW+xx]=paint;}}
    if(ty==='up'){paint=-1;start();}});
  c.seg('m',start);c.btn('reset',preset);c.btn('run',start);
  preset();
  return {tick(dt){acc+=dt*(c.v('fast')?60:10);while(acc>=1&&phase!=='idle'){acc-=1;
      if(phase==='bfs')stepBFS();else{if(phase==='fwd'){chamRow(row,false);row++;if(row>=GH){phase='bwd';row=GH-1;}}else{chamRow(row,true);row--;if(row<0)phase='idle';}}}
    if(phase==='idle')acc=0;
    const div=mode==='c'?3:1,front=new Set(phase==='bfs'?q:[]);maxd=0;
    for(let i=0;i<N;i++){const a=Math.abs(D[i]);if(a<INF)maxd=Math.max(maxd,a/div);}
    for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx,v=D[i],known=Math.abs(v)<INF,d=Math.abs(v)/div;let col;
      if(!known)col=L[i]?U('#2a3a2a'):U('#0f1d2c');
      else if(v>0){const b=Math.min(4,Math.floor((d-1)/2));col=RS[b];if(Math.floor(d)&1)col=mix32(col,WC.white,.1);}
      else{col=d<=1.5?WC.sand:d<4?WC.grass2:WC.grass;if(Math.floor(d)&1)col=mix32(col,WC.black,.12);}
      if(front.has(i))col=WC.foam;if(phase!=='idle'&&mode==='c'&&gy===row)col=mix32(col,U('#e8c88a'),.6);if(i===hover)col=mix32(col,WC.white,.5);
      for(let j=0;j<CS;j++)for(let k=0;k<CS;k++)u[(gy*CS+j)*W+gx*CS+k]=col;}
    F.put();
    const hv=hover>=0&&Math.abs(D[hover])<INF?` · cell under pointer: <b>${D[hover]>0?'+':''}${(D[hover]/div).toFixed(mode==='c'?2:0)}</b> tiles`:'';
    ro.innerHTML=`${N.toLocaleString('en')} cells · ${mode==='c'?(phase==='idle'?'2 raster passes done':phase==='fwd'?'forward pass, row '+row:'backward pass, row '+row):(phase==='idle'?'BFS done after '+lvl+' levels':'BFS level '+lvl+', frontier '+q.length)} · max ${maxd.toFixed(mode==='c'?1:0)} tiles · each cell settles once, O(N)${hv}`;}};});

// ======================================================================
// B4: foam bands, a run-up that retreats, and wet sand that dries
// ======================================================================
reg('foamwaves',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),u=F.u32,W=F.W,H=F.H,X=PX(cvs[1]),v=X.u32,XH=X.H,c=ctl(root),ro=$('[data-ro]',root);
  const xs=y=>62+5*Math.sin(y*.09)+2*Math.sin(y*.31),LAM=14;let ms=0,wet=0,dry=0,prevRun=0;
  function lab(){c.out('T',(c.v('T')/10).toFixed(1)+' s');c.out('A',c.v('A')+' px');c.out('fb',c.v('fb')+' px');}['T','A','fb'].forEach(k=>c.on(k,lab));lab();
  return {tick(dt){ms+=dt*1000;const t=ms/1000,T=c.v('T')/10,A=c.v('A'),fb=c.v('fb'),wetOn=c.v('wet');
    const run=A*Math.max(0,Math.sin(2*Math.PI*t/T));// run-up onto the sand, px
    if(run>=prevRun-1e-6){wet=Math.max(wet,run);dry=0;}else dry+=dt;prevRun=run;
    const wetEdge=wet*Math.max(0,1-dry/1.0);if(wetEdge<=.05)wet=0;// the wet band fades over about 1 s after retreat
    const crest=(d)=>{const dc=d*(.55+.45*Math.min(1,d/40));return dc/LAM+t/T;};// shorter wavelength near the shore
    for(let y=0;y<H;y++){const s=xs(y);for(let x=0;x<W;x++){const d=x-s;let col;
      if(d<-run){// sand: dry, damp, wet
        const h=hash2(x,y);col=h<.15?WC.sand2:h>.92?WC.sand3:WC.sand;
        if(wetOn&&-d<=wetEdge+.5)col=dith(x,y,clamp((wetEdge+.5+d)/1.5,0,1))?WC.wet:WC.wet2;
        if(d<-30)col=h<.3?WC.grass2:WC.grass;}
      else if(d<0){col=dith(x,y,.6)?RS[0]:WC.foam2;if(d<-run+1.5)col=WC.foam;}// swash on the sand, foam at its edge
      else{const b=Math.min(4,Math.floor(d/18));col=RS[b];if(b<4&&dith(x,y,(d%18-12)/6))col=RS[b+1];
        if(d<40){const ph=crest(d),f=ph-Math.floor(ph),w=fb/LAM*.55;if(f<w)col=f<w*.5?WC.foam:WC.foam2;else if(f<w+.06)col=RS[Math.min(4,b+1)];}// steep crest, darker trough behind it
        if(d<2)col=WC.foam;}
      u[y*W+x]=col;}}
    F.put();
    // cross-section through the middle row: land rises to the left, seabed drops to the right
    const ym=H>>1,s0=xs(ym),sky=U('#0b1218'),SL=14;v.fill(sky);
    for(let x=0;x<W;x++){const d=x-s0,gy=Math.round(SL+d*.18),ph=crest(Math.max(0,d)),amp=d>0?Math.min(2.2,.8+(40-Math.min(40,d))/18):0;
      const wy=d>0?SL-amp*Math.max(0,Math.sin(2*Math.PI*ph))+.5:SL,surf=Math.round(wy);
      for(let y=0;y<XH;y++){let col=sky;if(y>=gy)col=y===gy?WC.sand3:(hash2(x,y)<.2?WC.sand2:WC.sand);
        if(d>=-run&&y>=surf&&y<gy){col=y===surf?(d<0||(ph%1)<.18?WC.foam:HI[0]):RS[Math.min(4,Math.floor((y-surf)/4))];}
        if(wetOn&&d<-run&&-d<=wetEdge+.5&&y===gy)col=WC.wet;v[y*W+x]=col;}}
    X.put();
    ro.innerHTML=`period ${T.toFixed(1)} s · run-up <b>${run.toFixed(1)} px</b> of ${A} · ${wetOn?(wetEdge>0&&run<prevRun+1e-6&&dry>0?'wet band drying, '+Math.max(0,1-dry).toFixed(1)+' s left':wetEdge>0?'wet band '+wetEdge.toFixed(1)+' px':'sand dry'):'wet band off'} · foam band ${fb} px · wavelength ${LAM} px, shorter near the shore${T<2?' · under 2 s reads as nervous':''}`;}};});

// ======================================================================
// B5: tide as a water level against height. 4 server steps, 1 byte each
// ======================================================================
reg('tide',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),CS=4,GW=W/CS,GH=H/CS;
  const HC=new Float32Array(GW*GH);
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const d1=Math.hypot((x-10)/9,(y-12)/9.5),d2=Math.hypot((x-31)/4.2,(y-11)/3.8);let h=60+30*vnoise(x*.3,y*.3);
    h=Math.max(h,215-d1*120,190-d2*95);if(x>16&&x<29&&Math.abs(y-11.5-Math.sin(x*.5))<1.6)h=Math.max(h,122+(Math.abs(x-22.5)<3?0:8));HC[y*GW+x]=h;}
  const PATH=[];for(let x=17;x<29;x++)PATH.push(Math.round(11.5+Math.sin(x*.5))*GW+x);
  const sampH=(px,py)=>{const fx=clamp(px/CS-.5,0,GW-1.001),fy=clamp(py/CS-.5,0,GH-1.001),x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,i=y0*GW+x0;return (HC[i]*(1-tx)+HC[i+1]*tx)*(1-ty)+(HC[i+GW]*(1-tx)+HC[i+GW+1]*tx)*ty;};
  const PHH=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)PHH[y*W+x]=sampH(x+.5,y+.5);
  let ms=0,lastStep=-1,bytes=0,flipped=0,flash=new Float32Array(GW*GH),stepLv=0;
  const quant=l=>{const b=clamp(Math.floor((l-88)/20),0,3);return {b,lv:98+b*20};};
  c.on('lv',()=>{c.el('auto').checked=false;});
  return {tick(dt){ms+=dt*1000;const auto=c.v('auto');let lvl;if(auto){lvl=128+40*Math.sin(2*Math.PI*ms/1000/24);c.el('lv').value=Math.round(lvl);}else lvl=c.v('lv');
    c.out('lv',Math.round(lvl));const q=quant(lvl);
    if(q.b!==lastStep){if(lastStep>=0){bytes++;flipped=0;for(let i=0;i<HC.length;i++){const was=HC[i]<stepLv,now=HC[i]<q.lv;if(was!==now){flipped++;flash[i]=1;}}}lastStep=q.b;stepLv=q.lv;}
    const smooth=c.segv('v')==='smooth';
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,ci=((y/CS)|0)*GW+((x/CS)|0),h=smooth?PHH[i]:HC[ci],L=smooth?lvl:stepLv,dd=L-h;let col;
      if(dd>0){const bf=dd/20,b=Math.min(4,bf|0);col=RS[b];if(b<4&&dith(x,y,(bf-b-.6)/.4))col=RS[b+1];if(dd<(smooth?4:0.01))col=WC.foam;}
      else{const up=-dd;col=up<14?(hash2(x,y)<.2?WC.sand2:WC.sand):up<55?WC.grass2:WC.grass;if(up<3&&smooth)col=WC.wet;}
      if(flash[ci]>0&&(x%CS===0||y%CS===0))col=mix32(col,U('#e8c88a'),flash[ci]);u[i]=col;}
    for(let i=0;i<flash.length;i++)if(flash[i]>0)flash[i]=Math.max(0,flash[i]-dt*.8);
    F.put();
    const open=PATH.every(i=>HC[i]>=stepLv);
    ro.innerHTML=`tide ${Math.round(lvl)} → server step <b>${q.b+1} of 4</b> (level ${stepLv}) · cells flipped at the last step: ${flipped} · bytes sent: <b>${bytes}</b>, 1 per step · path to the islet: <b>${open?'open':'flooded'}</b>`;}};});

// ======================================================================
// C1: flow maps. Single phase stretches and resets; two phases half a cycle apart do not
// ======================================================================
reg('flowmap',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),CS=8,GW=W/CS,GH=H/CS;
  const VX=new Float32Array(GW*GH),VY=new Float32Array(GW*GH),RK={x:64,y:40,r:9},BANK=8;
  function preset(){for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const px=x*CS+4-RK.x,py=y*CS+4-RK.y,r2=px*px+py*py,R2=(RK.r+4)*(RK.r+4),th=Math.atan2(py,px);
      let vx=1-(r2>R2?R2/r2:1)*Math.cos(2*th),vy=-(r2>R2?R2/r2:1)*Math.sin(2*th);const m=Math.hypot(vx,vy)||1;VX[y*GW+x]=vx/m*Math.min(1.4,m);VY[y*GW+x]=vy/m*Math.min(1.4,m);}}
  preset();c.btn('reset',preset);
  let last=null;pointer(cv,([px,py],ty)=>{if(ty==='down'){last=[px,py];return;}if(ty==='drag'&&last){const dx=px-last[0],dy=py-last[1],m=Math.hypot(dx,dy);if(m<2)return;
      const gx=(px/CS)|0,gy=(py/CS)|0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const x=gx+i,y=gy+j;if(x<0||y<0||x>=GW||y>=GH)continue;VX[y*GW+x]=dx/m;VY[y*GW+x]=dy/m;}last=[px,py];}if(ty==='up')last=null;});
  const fl=(px,py)=>{const fx=clamp(px/CS-.5,0,GW-1.001),fy=clamp(py/CS-.5,0,GH-1.001),x0=fx|0,y0=fy|0,tx=fx-x0,ty=fy-y0,i=y0*GW+x0;
    return [(VX[i]*(1-tx)+VX[i+1]*tx)*(1-ty)+(VX[i+GW]*(1-tx)+VX[i+GW+1]*tx)*ty,(VY[i]*(1-tx)+VY[i+1]*tx)*(1-ty)+(VY[i+GW]*(1-tx)+VY[i+GW+1]*tx)*ty];};
  const texv=(x,y)=>vnoise(x/7,y/3.5)*.8+vnoise(x/2.5,y/1.6)*.2,band=n=>n>.68?HI[1]:n>.61?HI[0]:n<.3?RS[3]:n<.44?RS[2]:RS[1];
  let ms=0;c.on('sp',()=>c.out('sp',(c.v('sp')/100).toFixed(2)+'/s'));c.out('sp',(c.v('sp')/100).toFixed(2)+'/s');
  return {tick(dt){ms+=dt*1000;const t=ms/1000,two=c.segv('m')==='two',sp=c.v('sp')/100,Lx=14,noise=c.v('noise'),arrows=c.v('arr');
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let col;
      const rk=Math.hypot(x-RK.x,(y-RK.y)*1.1);
      if(y<BANK-2||y>=H-BANK+2)col=hash2(x,y)<.25?WC.grass2:WC.grass;else if(y<BANK||y>=H-BANK)col=WC.sand;
      else if(rk<RK.r)col=rk<RK.r-2?(x+y<RK.x+RK.y-3?WC.rock2:WC.rock):WC.rock3;
      else if(rk<RK.r+1.5)col=WC.foam;
      else{const [fx,fy]=fl(x,y),off=noise?hash2((x/CS)|0,(y/CS)|0)*.999:0,p0=(t*sp+off)%1;
        if(!two){const o=p0*Lx;col=band(texv(Math.floor(x-fx*o),Math.floor(y-fy*o)));}
        else{const p1=(t*sp+off+.5)%1,w0=1-Math.abs(1-2*p0),o0=p0*Lx,o1=p1*Lx;// blend the two values by weight, then band to the palette
          const n=w0*texv(Math.floor(x-fx*o0),Math.floor(y-fy*o0))+(1-w0)*texv(Math.floor(x-fx*o1)+19,Math.floor(y-fy*o1)+7);col=band(.5+(n-.5)*(1.15+.6*Math.abs(.5-w0)));}}
      u[i]=col;}
    if(arrows)for(let gy=1;gy<GH-1;gy++)for(let gx=(gy&1);gx<GW;gx+=2){const cx=gx*CS+4,cy=gy*CS+4;if(Math.hypot(cx-RK.x,cy-RK.y)<RK.r+2)continue;const vx=VX[gy*GW+gx],vy=VY[gy*GW+gx];
      for(let k=0;k<=4;k++){const x=Math.round(cx+vx*k),y=Math.round(cy+vy*k);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=k>=3?U('#e8c88a'):RS[4];}}
    F.put();
    const p0=(t*sp)%1,w0=1-Math.abs(1-2*p0);
    ro.innerHTML=two?`progress ${p0.toFixed(2)} and ${((p0+.5)%1).toFixed(2)} · weights <b>${w0.toFixed(2)} / ${(1-w0).toFixed(2)}</b> (sum 1, blended, then banded to the palette) · 3 fetches per pixel: ${(W*H*3).toLocaleString('en')} here, about 173,000 at 320×180`:
      `progress ${p0.toFixed(2)} · offset ${(p0*Lx).toFixed(1)} px along the flow · ${p0>.8?'<b>stretched, about to snap back</b>':'stretching'} · 1 fetch per pixel`;}};});
