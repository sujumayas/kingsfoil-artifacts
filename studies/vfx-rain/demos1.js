// ======================================================================
// HERO: drizzle -> storm -> sun over a small town, villager, fire, pond
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,tl=$$('.hero-tiers span',root);
  const w=RWorld(W,H,{seed:3,maxd:700});w.grass();
  w.house(8,4,86,28,14);
  const wv=y=>Math.round(Math.sin(y*.13)*2);
  w.dirt((x,y)=>(y>=46&&x>=38+wv(y)&&x<=54+wv(y))||(y>=70&&y<=82+Math.round(Math.sin(x*.2))&&x>=50&&x<=128),
    (x,y)=>(y>=46&&x<=54+wv(y)&&(Math.abs(x-(42+wv(y)))<=1||Math.abs(x-(50+wv(y)))<=1))||(x>=56&&(Math.abs(y-74)<=1||Math.abs(y-79)<=1)));
  w.dips([[46,98,4],[45,116,4],[80,76,4],[112,77,3]],DIRT,.04);
  w.cobble(128,34,190,86);w.dips([[140,44,4],[176,78,5],[150,80,3],[184,48,3]],STONE,.035);
  w.pond(192,111,32,14,true);w.tree(208,30);w.tree(14,96);w.campfire(98,104);w.finish();
  const v=w.newChar(70,62,VMAP);const WP=[[70,62],[96,76],[122,78],[150,66],[176,58],[156,84],[104,92],[48,104],[46,64]];let wp=1,wait=0;
  const LV={sun:0,overcast:0,drizzle:.12,light:.3,moderate:.5,heavy:.75,storm:1};
  const NAMES={sun:'Sun',overcast:'Overcast',drizzle:'Drizzle',light:'Light rain',moderate:'Moderate rain',heavy:'Heavy rain',storm:'Thunderstorm'};
  const CYC=[['overcast',3],['drizzle',6],['light',6],['moderate',6],['heavy',7],['storm',12],['heavy',4],['light',4],['sun',18]];
  let ci=2,timer=6,weather='light',target=.3,windT=.3,acc=0;
  w.I=.3;w.wind=.3;for(let k=0;k<(reduce?520:220);k++){w.t+=1/60;w.simStep();w.updateDrops(1/60);w.updateParts(1/60);}if(reduce){w.I=.6;}
  const setW=n=>{weather=n;target=LV[n];w.sunny=n==='sun';tl.forEach(s=>s.classList.toggle('on',s.dataset.t.toLowerCase()===n||(n==='light'&&s.dataset.t==='Light')));if(n==='overcast'&&w.fire&&!w.fire.on){w.fire.on=true;w.fire.F=.5;}};
  setW('light');
  return {tick(dt){w.t+=dt;timer-=dt;if(timer<=0){ci=(ci+1)%CYC.length;setW(CYC[ci][0]);timer=CYC[ci][1];}
    w.I+=(target-w.I)*Math.min(1,dt*.6);if(w.I<.004)w.I=0;
    if(rnd()<dt*.12)windT=(rnd()*2-1)*(.25+w.I*.75);w.wind+=(windT-w.wind)*Math.min(1,dt*.5);w.exposure(w.wind);
    acc+=dt*60*(w.sunny?2:1);let n=0;while(acc>=1&&n<4){w.simStep();acc--;n++;}if(acc>4)acc=0;
    w.updateDrops(dt);w.updateParts(dt);w.updateFire(dt);w.updateStorm(dt);
    // villager: walk the loop, wait under the eaves in heavy rain
    if(w.I>.6){if(w.walkTo(v,66,46,26,dt))v.dir='down';}else if(wait>0){wait-=dt;v.moving=false;v.anim=0;}else if(w.walkTo(v,WP[wp][0],WP[wp][1],18,dt)){wp=(wp+1)%WP.length;wait=rnd()*1.2;}
    w.soak(v,dt);
    w.render(px.u32);px.put();
    if(!reduce)cv.style.transform=w.shake>0?`translate(${(rnd()-.5)*3*w.shake/.45}px,${(rnd()-.5)*2*w.shake/.45}px)`:'';
    if(w.frame%8===0){const [d,s]=w.puddlePx();setHud(root,`${NAMES[weather]} · I ${w.I.toFixed(2)} · wind ${w.wind<-.1?'←':w.wind>.1?'→':'·'}${Math.abs(w.wind).toFixed(1)} · puddles ${d+s} px · villager ${Math.round(v.wet*100)} % wet · fire ${w.fire.on?'lit':'out'}`);}}};});

// ======================================================================
// DOOM fire next to a wetness-byte + ripple analogue
// ======================================================================
reg('doom',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root);const W=A.W,H=A.H,N=W*H;
  const RGB=[0x07,0x07,0x07,0x1F,0x07,0x07,0x2F,0x0F,0x07,0x47,0x0F,0x07,0x57,0x17,0x07,0x67,0x1F,0x07,0x77,0x1F,0x07,0x8F,0x27,0x07,0x9F,0x2F,0x07,0xAF,0x3F,0x07,0xBF,0x47,0x07,0xC7,0x47,0x07,0xDF,0x4F,0x07,0xDF,0x57,0x07,0xDF,0x57,0x07,0xD7,0x5F,0x07,0xD7,0x5F,0x07,0xD7,0x67,0x0F,0xCF,0x6F,0x0F,0xCF,0x77,0x0F,0xCF,0x7F,0x0F,0xCF,0x87,0x17,0xC7,0x87,0x17,0xC7,0x8F,0x17,0xC7,0x97,0x1F,0xBF,0x9F,0x1F,0xBF,0x9F,0x1F,0xBF,0xA7,0x27,0xBF,0xA7,0x27,0xBF,0xAF,0x2F,0xB7,0xAF,0x2F,0xB7,0xB7,0x2F,0xB7,0xB7,0x37,0xCF,0xCF,0x6F,0xDF,0xDF,0x9F,0xEF,0xEF,0xC7,0xFF,0xFF,0xFF];
  const FP=[];for(let i=0;i<37;i++)FP.push(pack(RGB[i*3],RGB[i*3+1],RGB[i*3+2]));
  const F=new Uint8Array(N);let fireOn=true,rain=true;for(let x=0;x<W;x++)F[(H-1)*W+x]=36;
  const M=new Uint8Array(N),BASEC=new Uint32Array(N),WETC=new Uint32Array(N),WET=new Uint8Array(N),TH=new Float32Array(N),HSH=new Float32Array(N);let R0=new Float32Array(N),R1=new Float32Array(N);const flash=new Uint8Array(N);
  const mats=[[GRASS,[GR[0],GR[1],GR[2]]],[DIRT,[DI[0],DI[1],DI[0]]],[STONE,[CO[0],CO[1],CO[3]]]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const dx=(x-64)/28,dy=(y-50)/15;HSH[i]=hash2(x,y+7);
    if(dx*dx+dy*dy<1){M[i]=WATER;BASEC[i]=P32(dx*dx+dy*dy<.35?WA[4]:WA[0]);continue;}
    const tx=(x>>4),ty=(y>>4),k=(tx+ty*2)%3;const [m,cols]=mats[k];M[i]=m;let b=cols[(hash2(tx*3+(m===STONE?((x+((y/5|0)&1)*3)/7|0):0),ty*5+(m===STONE?(y/5|0):0))*3)|0];
    if(m===STONE&&((x+((y/5|0)&1)*3)%7===0||y%5===0))b=CO[2];if(m===GRASS&&HSH[i]<.06)b=GR[3];BASEC[i]=P32(b);WETC[i]=W32(b);}
  const thr=()=>{const d=c.v('dith');for(let i=0;i<N;i++)TH[i]=M[i]===WATER?999:d?4+bay(i%W,(i/W)|0)*9+HSH[i]*40:128;};thr();
  c.btn('fire',b=>{fireOn=!fireOn;b.textContent=fireOn?'Switch the fire off':'Switch the fire on';for(let x=0;x<W;x++)F[(H-1)*W+x]=fireOn?36:0;});
  c.btn('rain',b=>{rain=!rain;b.textContent=rain?'Stop the rain':'Start the rain';});
  c.on('dith',thr);const io=()=>c.out('int',c.v('int')+' %');c.on('int',io);io();
  let acc=0,fr=0;
  function stepFire(){for(let x=0;x<W;x++)for(let y=1;y<H;y++){const src=y*W+x,p=F[src];if(p===0){F[src-W]=0;continue;}const rr=(rnd()*3.999)|0;const dst=src-rr+1;if(dst-W>=0)F[dst-W]=Math.max(0,p-(rr&1));}}
  function stepRain(){const I=c.v('int')/100;flash.fill(0);
    if(rain){const n=(I*520)|0;for(let k=0;k<n;k++){const i=(rnd()*N)|0;if(M[i]===WATER){if(rnd()<.5)R0[i]-=1.6+I*1.4;}else{WET[i]=Math.min(255,WET[i]+26);if(rnd()<.25)flash[i]=1;}}}
    const dk=rain?(I>.25?0:.55):2.6;for(let k=0;k<2600;k++){const i=(rnd()*N)|0;if(!WET[i])continue;if(rnd()<DRY[M[i]]*dk*.5)WET[i]=WET[i]>3?WET[i]-3:0;}
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(M[i]!==WATER){R1[i]=0;continue;}R1[i]=((R0[i-1]+R0[i+1]+R0[i-W]+R0[i+W])*.5-R1[i])*.95;}const t=R0;R0=R1;R1=t;}
  if(reduce)for(let k=0;k<160;k++){stepFire();stepRain();}
  return {tick(dt){acc+=dt*30;let n=0;while(acc>=1&&n<3){stepFire();stepRain();acc--;n++;}fr++;
    const u=A.u32;for(let i=0;i<N;i++)u[i]=FP[F[i]];A.put();
    const v=B.u32;let wet=0,land=0,rip=0;for(let i=0;i<N;i++){if(M[i]===WATER){const sl=(R0[i+1]-R0[i-1])+(R0[i+W]-R0[i-W]);v[i]=sl>.55?P32(WA[3]):sl>.22?P32(WA[2]):sl<-.5?P32(WA[4]):BASEC[i];if(Math.abs(sl)>.22)rip++;continue;}
      land++;const isw=WET[i]>TH[i];if(isw)wet++;v[i]=flash[i]?P32(SPL):isw?WETC[i]:BASEC[i];}
    B.put();if(fr%15===0)setHud(root,`${Math.round(wet/land*100)} % of ground looks wet · ${rip} rippling px`);}};});

// ======================================================================
// Timeline (lanes + list), as in the snow and acid studies
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#8b9bb0','#a9d2f0','#ffb86b','#6dd4c3','#c9a2ff','#f6a8c8'];
  const X=y=>y<1990?(y-1905)/85*20:y<2024?22+(y-1990)/34*47:72+(y-2024)/3*28;
  let h='<div class="tl-axis">';for(const y of [1910,1950,1990,2000,2010,2020])h+=`<span style="left:${X(y)}%">${y}</span>`;h+=`<span style="left:${X(2025)}%">2025</span><span style="left:${X(2026)}%">2026</span><i class="tl-brk" style="left:70.5%"></i><i class="tl-brk" style="left:19.6%"></i></div>`;
  const items=[];
  GENS.forEach((g,gi)=>{const ys=g.ev.filter(e=>e.y).map(e=>e.y+e.m/12);const a=Math.min(...ys),b=Math.max(...ys);
    h+=`<div class="tl-lane" data-g="${gi}"><span class="tl-lab">${g.id}</span><div class="tl-track"><i class="tl-bar" style="left:${X(a)}%;width:${Math.max(.8,X(b)-X(a))}%;background:${GC[gi]}"></i>`;
    g.ev.forEach((e,ei)=>{const id=`tle-${gi}-${ei}`;items.push({gi,ei,id,e});if(e.y)h+=`<button class="tl-dot" type="button" style="left:${X(e.y+e.m/12)}%;--c:${GC[gi]}" data-id="${id}" aria-label="${g.id}, ${e.y}"></button>`;});
    h+='</div></div>';});
  lanes.innerHTML=h;
  gb.innerHTML='<button type="button" class="on" data-g="all">All generations</button>'+GENS.map((g,gi)=>`<button type="button" data-g="${gi}"><i style="background:${GC[gi]}"></i>${g.id}: ${g.t}</button>`).join('');
  list.innerHTML=items.map(it=>`<li id="${it.id}" data-g="${it.gi}" style="--c:${GC[it.gi]}"><span class="yr">${GENS[it.gi].id}${it.e.y?' · '+it.e.y:''}</span>${it.e.h}</li>`).join('');
  const show=id=>{const it=items.find(i=>i.id===id);if(!it)return;$$('.tl-list li',root).forEach(l=>l.classList.toggle('hl',l.id===id));det.innerHTML=`<b>${GENS[it.gi].id}: ${GENS[it.gi].t}</b> — ${it.e.h}`;};
  lanes.addEventListener('pointerover',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('click',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('focusin',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  gb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',gb).forEach(x=>x.classList.toggle('on',x===b));const g=b.dataset.g;
    $$('.tl-list li',root).forEach(l=>l.hidden=!(g==='all'||l.dataset.g===g));$$('.tl-lane',root).forEach(l=>l.classList.toggle('dim',!(g==='all'||l.dataset.g===g)));});
  const pick=items.find(i=>/Godot 4\.7/.test(i.e.h))||items[items.length-1];show(pick.id);return {};});

// ======================================================================
// Four ways to draw falling rain (A1 overlay, A2 landing-first, A3 z streaks, A4 hashed cells)
// ======================================================================
reg('ways',root=>{const cvs=$$('canvas',root),P=cvs.map(PX),c=ctl(root);const W=112,H=64,N=W*H,WW=224;
  // shared world strip 224 x 64: grass, a dirt path, a pond, a roof
  const GB=new Uint32Array(WW*H),GM=new Uint8Array(WW*H);
  for(let y=0;y<H;y++)for(let x=0;x<WW;x++){const i=y*WW+x;const n=vnoise(x/9,y/9);let m=GRASS,b=n<.4?GR[0]:n<.7?GR[1]:GR[2];
    if(Math.abs(y-38-Math.sin(x*.08)*5)<6){m=DIRT;b=hash2(x,y)<.3?DI[1]:DI[0];}
    const dx=(x-150)/26,dy=(y-20)/12;if(dx*dx+dy*dy<1){m=WATER;b=WA[0];}
    if(x>=60&&x<96&&y>=4&&y<22){m=ROOF;b=(y-4)%4===3?RF[1]:RF[0];if(y===4||y===21||x===60||x===95)b=RF[2];}
    GM[i]=m;GB[i]=P32(b);}
  const gnd=(u,cam)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const wx=((x+cam)%WW+WW)%WW;u[y*W+x]=GB[y*WW+wx];}};
  const matAt=(x,y,cam)=>GM[clamp(y|0,0,H-1)*WW+((((x+cam)|0)%WW)+WW)%WW];
  let tier=2,cam=0,fr=0,t=0;const I=()=>TIERS[tier][1];
  c.seg('tier',v=>{tier=+v;mkSheet();});const wo=()=>c.out('wind',(c.v('wind')/100).toFixed(2));c.on('wind',wo);wo();
  // A1: one 64x64 sheet per tier, 2:1 streaks
  let sheet=new Uint8Array(64*64);function mkSheet(){sheet.fill(0);const n=[14,26,42,64,90][tier];for(let k=0;k<n;k++){const x0=ri(64),y0=ri(64),L=2+ri(2+tier);for(let s=0;s<L*2;s++){const x=(x0-(s>>1)+64)&63,y=(y0+s)&63;sheet[y*64+x]=s===L*2-1?2:1;}}}mkSheet();
  let a1f=0,a1x=0,a1y=0;const FX=[1,0,1,0],FY=[0,17,0,17];
  // A2: landing-first sprites
  const A2=[];let a2t=0,a2sp=0;
  // A3: z streaks
  const D3={x:new Float32Array(300),y:new Float32Array(300),z:new Float32Array(300),l:new Uint8Array(300),on:new Uint8Array(300)};const SP3=[];
  return {tick(dt){fr++;t+=dt;const wind=c.v('wind')/100;if(c.v('pan'))cam+=dt*20;const camI=cam|0;const II=I();
    const RNNc=P32(RNN),RNFc=P32(RNF),SPLc=P32(SPL);
    // ---- A1
    {const u=P[0].u32;gnd(u,camI);if(fr%4===0){a1f=(a1f+1)&3;a1x+=FX[a1f]*(wind<0?-1:1);a1y+=FY[a1f];}
      const ox=a1x+(cam*.5|0),oy=a1y;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const xx=wind<0?x:63-((x)&63);const s=sheet[(((y-oy)%64+64)&63)*64+(((xx+ox)%64+64)&63)];if(s){const i=y*W+x;u[i]=mix32(u[i],s===2?SPLc:RNNc,.5);}}
      P[0].put();if(fr%20===0)setHudK(root,'a',`1 fetch + 1 blend × ${N} px · flat`);}
    // ---- A2
    {const u=P[1].u32;gnd(u,camI);const cap=[10,10,16,24,24][tier],every=tier>=3?4:8,storm=tier>=3,vx=(storm?-10:-6.5)*.467,vy=(storm?20:13)*.467,FALL=storm?12:18;
      a2t++;if(a2t>=every&&A2.filter(d=>d.t>=0).length<cap){a2t=0;const r=ri(14*8);const lx=(r%14)*8+4,ly=((r/14)|0)*8+4;A2.push({lx:lx+cam,ly,t:FALL,FALL,vx,vy,spl:-1,kind:matAt(lx,ly,camI)});}
      let live=0;for(let k=A2.length-1;k>=0;k--){const d=A2[k];if(d.t>0){live++;d.t--;const x=d.lx-cam-d.vx*d.t,y=d.ly-d.vy*d.t;for(let s=0;s<4;s++){const px2=(x-d.vx/d.vy*s)|0,py2=(y-s)|0;if(px2>=0&&py2>=0&&px2<W&&py2<H)u[py2*W+px2]=s?RNFc:RNNc;}if(d.t===0)d.spl=storm?10:7;}
        else if(d.spl>0){d.spl--;const x=(d.lx-cam)|0,y=d.ly|0,r=(storm?10:7)-d.spl;const set=(a,b)=>{if(a>=0&&b>=0&&a<W&&b<H)u[b*W+a]=SPLc;};
          if(d.kind===WATER){set(x-r,y);set(x+r,y);set(x,y-(r>>1));set(x,y+(r>>1));}else if(d.kind!==ROOF){if(r<2)set(x,y-1);else if(r<4){set(x-1,y);set(x+1,y);}else if(r<6){set(x-2,y-1);set(x+2,y-1);}}else set(x,y);}
        else A2.splice(k,1);}
      if(c.v('land'))for(const d of A2)if(d.t>0){const x=(d.lx-cam)|0,y=d.ly|0;for(const [a,b] of [[-2,0],[2,0],[0,-2],[0,2]])if(x+a>=0&&y+b>=0&&x+a<W&&y+b<H)u[(y+b)*W+x+a]=C32('#ffb86b');}
      P[1].put();if(fr%20===0)setHudK(root,'b',`${live} sprites (cap ${cap}) · 1 surface lookup per landing`);}
    // ---- A3
    {const u=P[2].u32;gnd(u,camI);const want=Math.min(300,Math.round(dropCount(II)*N/57600));let live=0,pxw=0;
      for(let k=0;k<300;k++){if(!D3.on[k]){if(k<want&&rnd()<dt*4){D3.x[k]=rnd()*(W+40)-20+cam;D3.y[k]=rnd()*(H+40);D3.z[k]=40+rnd()*60;const r=rnd();D3.l[k]=r<.5?0:r<.85?1:2;D3.on[k]=1;}continue;}
        live++;const l=D3.l[k],vz=VZ[l]*(.55+.45*II)*.6;D3.z[k]-=vz*dt;D3.x[k]+=wind*vz*.55*dt;
        if(D3.z[k]<=0){const m=matAt(D3.x[k]-cam,D3.y[k],camI);if(l===2||m===WATER)SP3.push({x:D3.x[k],y:D3.y[k],m,life:m===WATER?.4:.15});D3.on[k]=k<want?0:0;continue;}
        const sx=D3.x[k]-cam-wind*D3.z[k]*.55*.6,sy=D3.y[k]-D3.z[k]*.6,len=II<.2?1+l:([2,4,7][l]*(.5+.6*II))|0;
        for(let s=0;s<=len;s++){const px2=(sx-wind*.55*s)|0,py2=(sy-s)|0;if(px2<0||py2<0||px2>=W||py2>=H)continue;const i=py2*W+px2;if(l===0&&bay(px2,py2)>9)continue;u[i]=l?RNNc:RNFc;pxw++;}}
      for(let k=SP3.length-1;k>=0;k--){const s=SP3[k];s.life-=dt;if(s.life<=0){SP3.splice(k,1);continue;}const x=(s.x-cam)|0,y=s.y|0;const set=(a,b)=>{if(a>=0&&b>=0&&a<W&&b<H)u[b*W+a]=SPLc;};
        if(s.m===WATER){const r=Math.round((1-s.life/.4)*3)+1;set(x-r,y);set(x+r,y);set(x,y-1);set(x,y+1);}else if(s.m!==ROOF){set(x-1,y-1);set(x+1,y-1);}}
      P[2].put();if(fr%20===0)setHudK(root,'c',`${live} drops · ≈ ${Math.round(live*6+pxw)} ops`);}
    // ---- A4
    {const u=P[3].u32;gnd(u,camI);const dens=[.1,.16,.24,.34,.46][tier];
      for(let L=0;L<3;L++){const depth=.35+.325*L,cw=Math.max(3,Math.round((10+14*depth)/4)),chh=cw*3,sp=(520+780*depth)*.06*(.55+.45*II),col=L===2?RNNc:L===1?mix32(RNNc,RNFc,.5):RNFc,len=2+L+(tier>2?1:0)+(tier>3?1:0);
        const thr=dens*(1.3-.3*depth),oy=t*sp;
        for(let y=0;y<H;y++){const qy=y-oy;for(let x=0;x<W;x++){const qx=x+cam*depth+qy*wind*.6;const cx=Math.floor(qx/cw),cy=Math.floor(qy/chh);const h=hash2(cx+L*977,cy);if(h>=thr)continue;
          const lx=qx-cx*cw,ly=qy-cy*chh,ox=Math.floor(hash2(cx,cy+L*31)*cw),oyy=Math.floor(h/thr*(chh-len));if(Math.floor(lx)===ox&&ly>=oyy&&ly<oyy+len)u[y*W+x]=col;}}}
      P[3].put();if(fr%20===0)setHudK(root,'d',`3 hashes × ${N} px · flat`);}}};});
function setHudK(root,k,t){const h=root.querySelector(`[data-hud="${k}"]`);if(h)h.textContent=t;}

// ======================================================================
// Reported costs against a 60 Hz frame (log / linear, stack your frame)
// ======================================================================
reg('cost',root=>{const svg=$('svg.costc',root),c=ctl(root),ro=$('[data-ro]',root);let scale='log';
  const D=[{k:'ToyShop: 5–10K CPU particles',v:19.45,src:'s58',t:'V vendor',col:'#ff8f7a'},
    {k:'ToyShop: one 256² ripple grid (seed, 2 Euler, Sobel)',v:6.98,src:'s58',t:'V',col:'#6dd4c3'},
    {k:'ToyShop: full-screen rain layer',v:4.11,src:'s58',t:'V vendor',col:'#a9d2f0'},
    {k:'Sandbox HUD, simStep only (headless Chromium)',v:[.9,2.7],src:'s4',t:'I Sandbox run',col:'#ffb86b'},
    {k:'Remember Me: four rain layers, any strength',v:1.7,src:'s59',t:'V vendor',col:'#a9d2f0',approx:true},
    {k:'Sandbox simStep in Node: storm',v:[1.46,1.6],src:'s4',t:'I Sandbox run',col:'#ffb86b'},
    {k:'Sandbox simStep in Node: drizzle',v:.76,src:'s4',t:'I Sandbox run',col:'#ffb86b'},
    {k:'Remember Me: heavy splashes (PS3)',v:.33,src:'s59',t:'V vendor',col:'#c9a2ff'},
    {k:'Remember Me: 256² depth map copied to the CPU',v:.036,src:'s59',t:'V vendor',col:'#c9a2ff'}];
  const on=new Set([2,4,7]);const val=d=>Array.isArray(d.v)?d.v[1]:d.v;
  c.seg('scale',v=>{scale=v;draw();});
  function draw(){const cp=root.clientWidth<600,Wd=cp?420:760,Lm=cp?6:300,Rm=cp?60:70,bh=cp?30:24,T=10,Hd=T+D.length*bh+(cp?D.length*16:0)+86;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';
    const lo=.02,hi=60,X=v=>scale==='log'?Lm+(Math.log10(Math.max(lo,v))-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(Wd-Lm-Rm):Lm+v/22*(Wd-Lm-Rm);
    const ticks=scale==='log'?[.02,.1,1,10]:[0,5,10,15,20];
    let y=T;const rowY=[];D.forEach((d,k)=>{if(cp)y+=16;rowY.push(y);y+=bh;});const yB=y+14;
    for(const tv of ticks){svgEl('line',{x1:X(tv),x2:X(tv),y1:T-4,y2:yB+40,class:'gl'},svg);svgText(svg,X(tv),yB+56,tv+' ms',{'text-anchor':'middle','font-size':11});}
    D.forEach((d,k)=>{const yy=rowY[k],g=svgEl('g',{class:'cbar'+(on.has(k)?' on':''),tabindex:0,role:'button','aria-pressed':on.has(k),'aria-label':d.k},svg);
      svgText(g,cp?Lm:Lm-8,cp?yy-4:yy+bh/2+4,d.k,{'text-anchor':cp?'start':'end','font-size':cp?11.5:12.5,class:'lab'});
      const v=d.v,x0=Array.isArray(v)?X(v[0]):X(scale==='log'?lo:0),x1=X(val(d));
      svgEl('rect',{x:x0,y:yy+4,width:Math.max(2,x1-x0),height:bh-10,rx:2,fill:d.col,'fill-opacity':on.has(k)?.95:.45},g);
      svgText(g,x1+5,yy+bh/2+4,(d.approx?'~':'')+(Array.isArray(v)?v.join('–'):v)+' ms',{'font-size':11.5,class:'lab'});
      svgEl('rect',{x:0,y:yy,width:Wd,height:bh,fill:'transparent'},g);
      const tog=()=>{on.has(k)?on.delete(k):on.add(k);draw();};g.addEventListener('click',tog);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}});});
    const sum=[...on].reduce((s,k)=>s+val(D[k]),0);svgEl('line',{x1:X(16.7),x2:X(16.7),y1:T-6,y2:yB+40,stroke:'#ffb86b','stroke-dasharray':'5 4','stroke-width':1.5},svg);
    svgText(svg,X(16.7)-4,yB+38,'16.7 ms = 1 frame at 60 Hz',{'text-anchor':'end','font-size':11,fill:'#ffb86b'});
    let sx=X(scale==='log'?lo:0);svgText(svg,cp?Lm:Lm-8,yB+22,'Your stacked frame',{'text-anchor':cp?'start':'end','font-size':12.5,class:'lab'});
    if(scale==='lin')for(const k of on){const w2=X(val(D[k]))-X(0);svgEl('rect',{x:sx,y:yB+(cp?26:8),width:Math.max(1,w2),height:16,fill:D[k].col,stroke:'#0b1016'},svg);sx+=w2;}
    else svgEl('rect',{x:X(lo),y:yB+(cp?26:8),width:Math.max(2,X(Math.max(lo,sum))-X(lo)),height:16,fill:'#a9d2f0','fill-opacity':.8},svg);
    ro.innerHTML=`Stacked: <b>${sum.toFixed(2)} ms</b> of 16.7 ms (${Math.round(sum/16.67*100)} %). ${scale==='log'?'Switch to linear to see each part. ':''}Tick or untick bars to change the stack. Tags: `+[...on].map(k=>`${D[k].k.split(':')[0]} <span class="cite"><b class="tag ${D[k].t[0]==='V'?'tv':'ti'}">${D[k].t[0]}</b> ${D[k].t.slice(2)}${D[k].t[0]==='V'?' <a class="sref" href="#'+D[k].src+'">S'+D[k].src.slice(1)+'</a>':''}</span>`).join(', ')+'.';}
  draw();let lastCp=root.clientWidth<600;addEventListener('resize',()=>{const cp=root.clientWidth<600;if(cp!==lastCp){lastCp=cp;draw();}});return {};});

// ======================================================================
// A5: curtains from scrolling noise
// ======================================================================
reg('curtain',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root);
  const w=RWorld(W,H,{seed:9,maxd:400});w.grass();w.dirt((x,y)=>Math.abs(y-50-Math.sin(x*.05)*8)<9,(x,y)=>Math.abs(Math.abs(y-50-Math.sin(x*.05)*8)-5)<1);w.cobble(104,8,156,40);w.finish();
  w.I=.85;let view='rain',tries=0,acc=0,fr=0;c.seg('view',v=>view=v);const wo=()=>{w.wind=c.v('wind')/100;c.out('wind',w.wind.toFixed(2));};c.on('wind',wo);wo();
  const sp0=w.spawnDrop;w.spawnDrop=k=>{tries++;sp0(k);};
  return {tick(dt){w.t+=dt;fr++;w.curtainOn=c.v('on');w.exposure(w.wind);acc+=dt*60;let n=0;while(acc>=1&&n<2){w.simStep();acc--;n++;}
    for(const p of w.parts)if(p.k==='drip')p.life=0;w.updateDrops(dt);w.updateParts(dt);
    const u=px.u32;if(view==='wet')w.render(u,{view:'wet'});else w.render(u);
    if(view==='mask'){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(w.SPR[i])continue;const cv2=w.curtain(x,y);u[i]=HEAT[clamp(((cv2-.45)/.75)*255|0,0,255)];}}
    px.put();
    if(fr%20===0){let on=0;for(let k=0;k<w.maxd;k++)on+=w.D.on[k];let s=0,n2=0;for(let y=0;y<H;y+=6)for(let x=0;x<W;x+=6){s+=w.curtain(x,y);n2++;}const mean=s/n2;
      setHud(root,`${on} drops · curtain mean ${mean.toFixed(2)}`);ro.innerHTML=`Spawn rule: accept with probability <b>0.8 × curtain</b>, up to 4 tries. Sheets drift at <b>42·wind = ${(42*w.wind).toFixed(0)} px/s</b>. ${w.curtainOn?'The heavy bands move with the wind.':'Curtains off: the same count falls evenly.'}`;}}};});
