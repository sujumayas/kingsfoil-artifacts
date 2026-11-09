
// ======================================================================
// HERO: spill spreads and stops, a crate corrodes, a slime melts into the pool
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H;let r,slimes,flask,t,fr,acc,crate;
  function reset(){r=Room(W,H,{tile:16,react:6,seed:3});r.wall(0,0,W,10);crate=r.item('crate',74,44);r.item('sword',118,86);
    slimes=[newSlime(170,74,22)];slimes[0].tx=60;slimes[0].ty=64;flask={x:52,y:44,alive:true,t:1.3};t=0;fr=0;acc=0;}
  reset();
  function drawFlask(u){if(!flask.alive)return;const S=["..k..",".gGg.","gaaAg","gaAAg","gAAAg",".ggg."],mp={k:STG[M_WOOD][0][1],g:PAL.GLASS[1],G:PAL.GLASS[0],a:PAL.AC[1],A:PAL.AC[2]};
    const wob=flask.t<.5?((fr>>2)&1):0;for(let y=0;y<6;y++)for(let x=0;x<5;x++){const ch=S[y][x];if(ch==='.')continue;let c=mp[ch];if(ch==='a'&&((fr>>3)+x+y)%7===0)c=PAL.AC[0];u[(flask.y+y)*W+flask.x+x+wob]=c;}}
  function slimeStep(s,dt){const dx=s.tx-s.x,dy=s.ty-s.y,L=Math.hypot(dx,dy);if(L<4){s.tx=40+rnd()*60;s.ty=50+rnd()*40;}
    const hop=Math.max(0,Math.sin(s.ph)),sp=(L>3?16:0)*(.35+.9*hop);s.ph+=dt*(L>3?8:3);
    s.x+=(L>0?dx/L*sp:0)*dt;s.y+=(L>0?dy/L*sp:0)*dt;if(Math.abs(dx)>2)s.dir=dx>0?1:-1;
    const ti=(s.y|0)*W+(s.x|0);if(!r.SOL[ti]&&r.A[ti]<.3){r.A[ti]+=.006;r.grow(s.x-1,s.y-1,s.x+1,s.y+1);}}
  function adv(dt){t+=dt;acc+=dt*60;let n=0;while(acc>=1&&n<4){r.step({evapMul:2.5});acc--;n++;}if(acc>4)acc=0;
    if(flask.alive){flask.t-=dt;if(flask.t<=0){flask.alive=false;r.spill(56,56,10,1.3);for(let k=0;k<8;k++){const a=rnd()*6.28;r.parts.push({k:'drop',x:56,y:52,z:4,vx:Math.cos(a)*30,vy:Math.sin(a)*20,vz:20+rnd()*20,life:2,t:0});}}}
    for(const s of slimes)slimeStep(s,dt);r.updParts(dt);fr++;if(t>38)reset();}
  if(reduce){for(let k=0;k<60*9;k++)adv(1/60);}
  return {tick(dt){adv(dt);const u=px.u32;r.render(u,t);drawFlask(u);r.drawParts(u);drawSlimes(r,u,slimes,fr);
    // torches on the wall for a warm accent
    for(const tx of [40,152]){u[8*W+tx]=PAL.HOLDER;u[7*W+tx]=PAL.FLAME[(fr>>2)%3===0?0:1];u[6*W+tx]=PAL.FLAME[2];}
    px.put();if(fr%10===0){let q=0,n=0;for(const i of crate.px){n++;if(r.M[i]>=M_WOOD)q+=r.Q[i];}setHud(root,`acid ${r.total().toFixed(0)} u · crate ${Math.round(q/n*100)} % · slime ${slimes[0].mass|0}`);}}};});

// ======================================================================
// FIG 1: DOOM fire vs corrosion-front CA
// ======================================================================
reg('doom',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root);const W=A.W,H=A.H;
  const RGB=[0x07,0x07,0x07,0x1F,0x07,0x07,0x2F,0x0F,0x07,0x47,0x0F,0x07,0x57,0x17,0x07,0x67,0x1F,0x07,0x77,0x1F,0x07,0x8F,0x27,0x07,0x9F,0x2F,0x07,0xAF,0x3F,0x07,0xBF,0x47,0x07,0xC7,0x47,0x07,0xDF,0x4F,0x07,0xDF,0x57,0x07,0xDF,0x57,0x07,0xD7,0x5F,0x07,0xD7,0x5F,0x07,0xD7,0x67,0x0F,0xCF,0x6F,0x0F,0xCF,0x77,0x0F,0xCF,0x7F,0x0F,0xCF,0x87,0x17,0xC7,0x87,0x17,0xC7,0x8F,0x17,0xC7,0x97,0x1F,0xBF,0x9F,0x1F,0xBF,0x9F,0x1F,0xBF,0xA7,0x27,0xBF,0xA7,0x27,0xBF,0xAF,0x2F,0xB7,0xAF,0x2F,0xB7,0xB7,0x2F,0xB7,0xB7,0x37,0xCF,0xCF,0x6F,0xDF,0xDF,0x9F,0xEF,0xEF,0xC7,0xFF,0xFF,0xFF];
  const FP=[];for(let i=0;i<37;i++)FP.push(pack(RGB[i*3],RGB[i*3+1],RGB[i*3+2]));
  const F=new Uint8Array(W*H);let fireOn=true,acidOn=true;for(let x=0;x<W;x++)F[(H-1)*W+x]=36;
  const Cc=new Uint8Array(W*H),R=new Uint8Array(W*H),ROLEB=new Uint8Array(W*H);
  function plate(){Cc.fill(0);const h=c.v('hard')/100;for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;const v=vnoise(x/5+rs%97,y/5);R[i]=v<h*.8?0:(v<h?1:2);
      ROLEB[i]=(x%32===0||y%24===0)?2:((x%32===1||y%24===1)?0:(hash2(x,y)<.025?0:1));}}
  plate();
  c.btn('fire',b=>{fireOn=!fireOn;b.textContent=fireOn?'Switch the fire off':'Switch the fire on';for(let x=0;x<W;x++)F[(H-1)*W+x]=fireOn?36:0;});
  c.btn('acid',b=>{acidOn=!acidOn;b.textContent=acidOn?'Cut the acid off':'Pour the acid again';});
  c.btn('reset',()=>plate());c.on('hard',()=>{c.out('hard',c.v('hard')+' %');plate();});c.out('hard',c.v('hard')+' %');
  let fr=0,acc=0;
  function stepFire(){for(let x=0;x<W;x++)for(let y=1;y<H;y++){const src=y*W+x,p=F[src];if(p===0){F[src-W]=0;continue;}const rr=(rnd()*3.999)|0;const dst=src-rr+1;if(dst-W>=0)F[dst-W]=Math.max(0,p-(rr&1));}}
  function stepAcid(){if(acidOn)for(let x=0;x<W;x++)Cc[(H-1)*W+x]=36;const ok=1-c.v('hard')/100*.85;
    for(let x=0;x<W;x++)for(let y=1;y<H;y++){const src=y*W+x,p=Cc[src];if(p<2)continue;if(rnd()>ok)continue;const rr=(rnd()*3.999)|0;const dst=src-rr+1;const to=dst-W;if(to<0||to>=W*H)continue;
      const v=p-1-(rr&1)-R[to];if(v>Cc[to])Cc[to]=v;}}
  if(reduce){for(let k=0;k<160;k++){stepFire();stepAcid();}}
  return {tick(dt){acc+=dt*30;let n=0;while(acc>=1&&n<3){stepFire();stepAcid();acc--;n++;}fr++;
    const u=A.u32;for(let i=0;i<W*H;i++)u[i]=FP[F[i]];A.put();
    const v=B.u32,dith=c.v('dith'),t=fr/60;let eaten=0,reach=H;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=Cc[i];const q=1-k/32;let col=stageCol(M_IRON,ROLEB[i],q,x,y,{nodither:!dith});
      if(k>0&&y<reach)reach=y;
      if(col<0){eaten++;if(acidOn){const w=Math.sin(x*.35+t*1.7+Math.sin(y*.3+t*.9)*1.6)+Math.sin((x+y)*.21-t*1.3);col=w>1.5?PAL.AC[1]:(k>34?PAL.AC[3]:PAL.AC[2]);}else col=k>34?PAL.ST1:PAL.FLR[3];}
      v[i]=col;}
    B.put();if(fr%15===0)setHud(root,`holes ${eaten} px · front reached row ${reach}`);}};});

// ======================================================================
// FIG 2: timeline (lanes + list), as in the snow study
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#93a08a','#c8f25a','#ffb86b','#6dd4c3','#c9a2ff','#e9a0d6','#f6ffa8'];
  const X=y=>y<2025?(y-1980)/(2025-1980)*68:72+(y-2025)/(2027-2025)*28;
  let html='<div class="tl-axis">';for(const y of [1985,1995,2005,2015])html+=`<span style="left:${X(y)}%">${y}</span>`;html+=`<span style="left:${X(2025)}%">2025</span><span style="left:${X(2026)}%">2026</span><i class="tl-brk" style="left:70%"></i></div>`;
  const items=[];
  GENS.forEach((g,gi)=>{const ys=g.ev.filter(e=>e.y).map(e=>e.y+e.m/12);const a=Math.min(...ys),b=Math.max(...ys);
    html+=`<div class="tl-lane" data-g="${gi}"><span class="tl-lab">${g.id}</span><div class="tl-track"><i class="tl-bar" style="left:${X(a)}%;width:${Math.max(.8,X(b)-X(a))}%;background:${GC[gi]}"></i>`;
    g.ev.forEach((e,ei)=>{const id=`tle-${gi}-${ei}`;items.push({gi,ei,id,e});if(e.y){html+=`<button class="tl-dot" type="button" style="left:${X(e.y+e.m/12)}%;--c:${GC[gi]}" data-id="${id}" aria-label="${GENS[gi].id}, ${e.y}"></button>`;}});
    html+='</div></div>';});
  lanes.innerHTML=html;
  gb.innerHTML='<button type="button" class="on" data-g="all">All generations</button>'+GENS.map((g,gi)=>`<button type="button" data-g="${gi}"><i style="background:${GC[gi]}"></i>${g.id}: ${g.t}</button>`).join('');
  list.innerHTML=items.map(it=>`<li id="${it.id}" data-g="${it.gi}" style="--c:${GC[it.gi]}"><span class="yr">${GENS[it.gi].id}${it.e.y?' · '+it.e.y:''}</span>${it.e.h}</li>`).join('');
  const show=id=>{const it=items.find(i=>i.id===id);if(!it)return;$$('.tl-list li',root).forEach(l=>l.classList.toggle('hl',l.id===id));det.innerHTML=`<b>${GENS[it.gi].id}: ${GENS[it.gi].t}</b> — ${it.e.h}`;};
  lanes.addEventListener('pointerover',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('click',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('focusin',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  gb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',gb).forEach(x=>x.classList.toggle('on',x===b));const g=b.dataset.g;
    $$('.tl-list li',root).forEach(l=>l.hidden=!(g==='all'||l.dataset.g===g));$$('.tl-lane',root).forEach(l=>l.classList.toggle('dim',!(g==='all'||l.dataset.g===g)));});
  const lastDated=[...items].reverse().find(i=>i.e.y&&/4\.7/.test(i.e.h))||items[items.length-1];show(lastDated.id);return {};});

// ======================================================================
// FIG 3: DOOM animated flat + global damage clock
// ======================================================================
reg('floor',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),svg=$('svg.tics',root);const TS=16,TW=W/TS,TH=H/TS;
  // three 16x16 sludge frames (NUKAGE1-3 stand-ins, procedural)
  const FR=[0,1,2].map(f=>{const a=new Uint32Array(256);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const n=vnoise((x+f*5.3)/4.2,(y+f*2.1)/4.2)*.7+vnoise((x-f*3)/2.3,(y+f*4)/2.3)*.3;
      a[y*16+x]=n>.8?PAL.AC[0]:n>.7?PAL.AC[1]:n>.5?PAL.AC[2]:n>.32?PAL.AC[3]:PAL.AC[4];}return a;});
  const hz=new Uint8Array(TW*TH),phase=new Uint8Array(TW*TH);for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const k=ty*TW+tx;hz[k]=(tx>=3&&tx<=6&&ty>=1&&ty<=3)?1:0;phase[k]=ri(3);}
  const fl=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const gx=x%TS,gy=y%TS;const tr=hash2((x/TS)|0,(y/TS)|0);
    fl[y*W+x]=(gx===0||gy===0)?PAL.FLR[3]:(gx===1||gy===1)?PAL.FLR[1]:(gx===15||gy===15)?PAL.FLR[2]:(hash2(x,y)<.06?PAL.FLR[2]:tr<.5?PAL.FLR[0]:PAL.FLR[1]);}
  let sp=5,tic=0,hp=100,ax=6,dir=1,speed=18,hist=[],flash=0,lastHit='';c.seg('sp',v=>{sp=+v;});
  c.btn('dash',()=>{speed=110;ax=dir>0?6:W-6;});c.btn('walk',()=>{speed=18;});
  function onHazard(){const tx=(ax/TS)|0,ty=(56/TS)|0;return hz[ty*TW+tx]===1;}
  function drawStrip(){const Wd=720,Hd=66,span=160;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);const t0=Math.max(0,Math.floor(tic)-span+16);const X=k=>8+(k-t0)/span*(Wd-16);
    let s=`<line x1="8" x2="${Wd-8}" y1="28" y2="28" class="ax"/>`;
    for(let k=Math.ceil(t0/8)*8;k<t0+span;k+=8){const x=X(k);const big=(k&31)===0;s+=`<line x1="${x}" x2="${x}" y1="${big?16:22}" y2="34" stroke="${big?'#ffb86b':'#5d6b52'}" stroke-width="${big?2:1}"/>`;
      if(big)s+=`<text x="${x}" y="${Hd-2}" text-anchor="middle" font-size="11">${k}</text>`;}
    for(const h of hist){if(h.k<t0)continue;const x=X(h.k);s+=`<circle cx="${x}" cy="45" r="5" fill="${h.hit?'#ff6b5e':h.on?'#c8f25a':'none'}" stroke="${h.on?'#c8f25a':'#3b4a31'}"/>`;}
    const px2=X(tic);s+=`<line x1="${px2}" x2="${px2}" y1="14" y2="52" stroke="#eef6e4" stroke-dasharray="2 2"/>`;
    s+=`<text x="8" y="10" font-size="11">grey: flat frame flips every 8 tics</text><text x="${Wd-8}" y="10" text-anchor="end" font-size="11" fill="#ffb86b">orange: damage check every 32 tics · ● on hazard · red = hit</text>`;svg.innerHTML=s;}
  if(reduce){for(let k=0;k<60*4;k++)step(1/60);}
  function step(dt){const prev=Math.floor(tic);tic+=dt*35;for(let k=prev+1;k<=Math.floor(tic);k++){if((k&31)===0){const on=onHazard();let hit=false;
        if(on&&(!c.v('suit')||(sp===20&&ri(256)<5))){hp-=sp;hit=true;flash=.12;lastHit=`−${sp} at tic ${k}`;}hist.push({k,on,hit});if(hist.length>12)hist.shift();if(hp<=0)hp=100;}}
    ax+=dir*speed*dt;if(ax>W-6){ax=W-6;dir=-1;if(speed>40)speed=18;}if(ax<6){ax=6;dir=1;if(speed>40)speed=18;}flash-=dt;}
  let fr=0;
  return {tick(dt){step(dt);fr++;const u=px.u32;u.set(fl);const tk=Math.floor(tic),ph=c.v('phase');
    for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const k=ty*TW+tx;if(!hz[k])continue;const f=((tk>>3)+(ph?phase[k]:0))%3,T=FR[f];
      for(let y=0;y<16;y++)for(let x=0;x<16;x++)u[(ty*TS+y)*W+tx*TS+x]=T[y*16+x];}
    drawHero(u,W,H,ax,58,{flash:flash>0&&(fr&2),tint:onHazard()&&!c.v('suit'),step:((ax/4)|0)%3});
    if(c.v('suit'))for(let y=46;y<58;y++){const i=y*W+(ax|0)-4;if(u[i]!==undefined&&y%3===0)u[i]=C32('#7fdc6a');}
    px.put();if(fr%4===0)drawStrip();if(fr%6===0)setHud(root,`tic ${tk} · flat frame ${(tk>>3)%3+1}/3 · HP ${hp}${lastHit?' · last '+lastHit:''}`);}};});

// ======================================================================
// FIG 4: Quake turbulence warp | palette-cycled pool
// ======================================================================
reg('zerosim',root=>{const cvs=$$('canvas',root),L=PX(cvs[0]),R=PX(cvs[1]),strip=cvs[2],sctx=strip.getContext('2d'),c=ctl(root);
  // 64x64 tiling pool texture as palette indices into the acid ramp
  const TEX=new Uint8Array(64*64);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const f=(a,b,s)=>vnoise(((a%64)+64)%64/s,b/s);
    const n=(vnoise(x/8,y/8)*.6+vnoise(x/3.5,y/3.5)*.4);const w=Math.sin(x/64*Math.PI*4)*.06+Math.sin(y/64*Math.PI*2)*.06;const v=n+w;TEX[y*64+x]=v>.8?0:v>.7?1:v>.5?2:v>.34?3:4;}
  // make it tile seamlessly by mirroring the noise weight at borders
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const bx=Math.min(x,63-x),by=Math.min(y,63-y);if(bx<4||by<4){const j=((y+32)&63)*64+((x+32)&63);if(hash2(x,y)<.5)TEX[y*64+x]=TEX[j];}}
  const RAMP=[PAL.AC[0],PAL.AC[1],PAL.AC[2],PAL.AC[3],PAL.AC[4]];
  let warp='quake';c.seg('warp',v=>{warp=v;$('[data-lab="warp"]',root).textContent=v==='quake'?'Quake turbulence':v==='quant'?'±1 px quantised':'Sandbox sheen';});
  const T=new Float32Array(128);
  // palette-cycled pool
  const W=R.W,H=R.H,IDXP=new Int8Array(W*H),BASE=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const gx=x%16,gy=y%16,tr=hash2((x>>4)*7,(y>>4)*13);
    BASE[i]=(gx===0||gy===0)?PAL.FLR[3]:(gx===1||gy===1)?PAL.FLR[1]:(gx===15||gy===15)?PAL.FLR[2]:tr<.5?PAL.FLR[0]:PAL.FLR[1];
    const d=Math.hypot((x-W/2)/52,(y-H/2)/34)+vnoise(x/9,y/9)*.35-.17;IDXP[i]=d<1?Math.floor(x*.22+y*.14+vnoise(x/6,y/6)*5)&7:-1;}
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(IDXP[i]>=0&&(IDXP[i-1]===-1||IDXP[i+1]===-1||IDXP[i-W]===-1||IDXP[i+W]===-1))IDXP[i]=-2;}
  const CYC=[PAL.AC[4],PAL.AC[3],PAL.AC[3],PAL.AC[2],PAL.AC[2],PAL.AC[1],PAL.AC[0],PAL.AC[2]];
  const HUE=[0,45,90,135,180,225,270,315].map(h=>{const [r,g,b]=[Math.cos(h/57.3)*.5+.5,Math.cos((h-120)/57.3)*.5+.5,Math.cos((h-240)/57.3)*.5+.5];return pack(r*255,g*255,b*255);});
  let t=0;['amp','spd','rate'].forEach(k=>c.on(k,()=>0));
  return {tick(dt){t+=dt;const amp=c.v('amp'),spd=c.v('spd'),rate=c.v('rate');c.out('amp',amp+' px');c.out('spd',spd+'/s');c.out('rate',rate+'/s');
    for(let i=0;i<128;i++)T[i]=amp+Math.sin(i*2*Math.PI/128)*amp;const off=(t*spd)|0;const u=L.u32,LW=L.W,LH=L.H;
    for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){let sx,sy,col;
      if(warp==='quake'){sx=(x+(T[(y+off)&127]|0))&63;sy=(y+(T[(x+off)&127]|0))&63;col=RAMP[TEX[sy*64+sx]];}
      else if(warp==='quant'){const tt=t*spd/10;sx=(x+Math.floor(Math.sin(y*.4+tt*2)*1+.5))&63;sy=(y+Math.floor(Math.sin(x*.4+tt*2)*1+.5))&63;col=RAMP[TEX[sy*64+sx]];}
      else{const k=TEX[(y&63)*64+(x&63)];col=RAMP[Math.max(2,k)];const tt=t*spd/20;const w=Math.sin(x*.35+tt*1.7+Math.sin(y*.3+tt*.9)*1.6)+Math.sin((x+y)*.21-tt*1.3);if(w>1.5)col=w>1.8?PAL.AC[0]:PAL.AC[1];}
      u[y*LW+x]=col;}
    L.put();
    const s=t*rate,si=Math.floor(s),fr2=c.v('blend')?s-si:0,showI=c.v('idx');const pal=new Uint32Array(8);for(let k=0;k<8;k++)pal[k]=fr2?mix32(CYC[(k+si)&7],CYC[(k+si+1)&7],fr2):CYC[(k+si)&7];
    const v=R.u32;for(let i=0;i<W*H;i++){const k=IDXP[i];v[i]=k===-1?BASE[i]:k===-2?PAL.AC[5]:showI?HUE[k]:pal[k];}R.put();
    const SP=[PAL.FLR[0],PAL.FLR[1],PAL.FLR[2],PAL.FLR[3],...pal,PAL.AC[5],PAL.ST1,PAL.SALT,PAL.WL[0]];const im=sctx.createImageData(16,1);const d32=new Uint32Array(im.data.buffer);SP.forEach((c2,k)=>d32[k]=c2);sctx.putImageData(im,0,0);
    setHud(root,`entries 4–11 rotate · ${W*H} px untouched`);}};});
