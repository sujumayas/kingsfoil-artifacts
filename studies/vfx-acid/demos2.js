
// ======================================================================
// FIG 5: flow with film threshold (Sandbox rule), conservation counter
// ======================================================================
reg('flow',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root);let r,ref=0,t=0;
  function reset(){r=Room(W,H,{tile:16,seed:11});for(let x=104;x<W-1;x++)for(let y=47;y<=49;y++){const i=y*W+x;r.FH[i]=-.02;r.FB[i]=PAL.FLR[3];r.M[i]=r.FM[i]=M_GROUT;}
    r.spill(96,38,10,1.3);r.spill(30,70,6,1.0);ref=r.total();}
  reset();c.btn('reset',()=>{reset();r.A.fill(0);r.ST.fill(0);ref=0;});
  pointer(cv,([x,y],k)=>{if(x<1||y<1||x>=W-1||y>=H-1)return;if(k==='down'){r.spill(x,y,6,1.1);ref=r.total();}
    else if(k==='drag'){for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++){if(xx<1||yy<1||xx>=W-1||yy>=H-1)continue;if((xx-x)**2+(yy-y)**2>5)continue;r.A[yy*W+xx]+=.12;}r.grow(x-3,y-3,x+3,y+3);ref=r.total();}});
  const opt={};let fr=0;
  if(reduce)for(let k=0;k<600;k++)r.step({react:false,evap:false,gas:false,samples:0});
  return {tick(dt){t+=dt;fr++;const film=c.v('film'),ev=c.v('evap');c.out('film',film.toFixed(2));
    r.step({film,evap:ev,react:false,gas:false,samples:0});const u=px.u32;
    if(c.v('xray')){for(let i=0;i<r.N;i++)u[i]=r.M[i]===M_WALL?PAL.WL[2]:r.A[i]>0?HEAT[Math.min(255,(r.A[i]/1.5*255)|0)]:HEAT[0];}else r.render(u,t,{haze:false});
    px.put();
    if(fr%6===0){let tot=0,wet=0;for(let i=0;i<r.N;i++){const a=r.A[i];if(a>0){tot+=a;if(a>r.thr[i])wet++;}}
      const d=tot-ref;ro.innerHTML=`acid <b>${tot.toFixed(2)} u</b> · wet <b>${wet} px</b> (${(wet/256).toFixed(1)} floor tiles) · mean depth ${(wet?tot/wet:0).toFixed(2)} · Δ since last pour <b>${d>=0?'+':''}${d.toFixed(3)} u</b>${ev?' (evaporation on)':' (cells under 0.004 count as dry)'}`;
      setHud(root,film<.01?'FILM = 0: the film never stops':'Click or drag to spill');}}};});

// ======================================================================
// FIG 6: level grid (0-7, Minecraft-style) vs virtual pipes
// ======================================================================
reg('pipes',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root);const W=A.W,H=A.H,N=W*H;
  const CS=4,LW=W/CS,LH=H/CS,LN=LW*LH,L=new Uint8Array(LN),L2=new Uint8Array(LN),SRC=new Uint8Array(LN),srcs=[];
  const bed=new Float32Array(N),d=new Float32Array(N),fl=new Float32Array(N),fr2=new Float32Array(N),ft=new Float32Array(N),fb=new Float32Array(N);
  const bg=new Uint32Array(N);
  function build(){const bowl=c.v('bowl');for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const dx=(x-W/2)/(W/2),dy=(y-H/2)/(H/2);bed[i]=bowl?.9*(dx*dx+dy*dy):0;
      const gx=x%16,gy=y%16;bg[i]=(gx===0||gy===0)?PAL.FLR[3]:hash2(x>>4,y>>4)<.5?PAL.FLR[0]:PAL.FLR[1];if(bowl){const s=bed[i]/1.8;bg[i]=mix32(bg[i],PAL.FLR[3],clamp(.6-s,0,.6));}}}
  build();c.on('bowl',build);
  function drop(x,y){for(let yy=y-3;yy<=y+3;yy++)for(let xx=x-3;xx<=x+3;xx++){if(xx<1||yy<1||xx>=W-1||yy>=H-1)continue;const q=(xx-x)**2+(yy-y)**2;if(q>10)continue;const i=yy*W+xx;d[i]+=2.4*(1-q/12);}
    const k=clamp((y/CS)|0,1,LH-2)*LW+clamp((x/CS)|0,1,LW-2);srcs.push(k);SRC[k]=1;if(srcs.length>3){SRC[srcs.shift()]=0;}}
  c.btn('drop',()=>drop(28+ri(40),20+ri(24)));
  cvs.forEach(cv=>pointer(cv,([x,y],k)=>{if(k==='down')drop(x,y);}));
  function stepLevel(dt){for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){const i=y*LW+x;if(SRC[i]){L2[i]=7;continue;}const m=Math.max(x>0?L[i-1]:0,x<LW-1?L[i+1]:0,y>0?L[i-LW]:0,y<LH-1?L[i+LW]:0);L2[i]=m>1?m-1:0;}L.set(L2);}
  function stepPipes(h){const g=10,fric=1-c.v('fr');
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,hh=bed[i]+d[i];
      let a=x>0?Math.max(0,fl[i]*fric+h*g*(hh-bed[i-1]-d[i-1])):0,b=x<W-1?Math.max(0,fr2[i]*fric+h*g*(hh-bed[i+1]-d[i+1])):0,
          e=y>0?Math.max(0,ft[i]*fric+h*g*(hh-bed[i-W]-d[i-W])):0,f=y<H-1?Math.max(0,fb[i]*fric+h*g*(hh-bed[i+W]-d[i+W])):0;
      const s=(a+b+e+f)*h;if(s>d[i]&&s>0){const K=d[i]/s;a*=K;b*=K;e*=K;f*=K;}fl[i]=a;fr2[i]=b;ft[i]=e;fb[i]=f;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let inn=0;if(x>0)inn+=fr2[i-1];if(x<W-1)inn+=fl[i+1];if(y>0)inn+=fb[i-W];if(y<H-1)inn+=ft[i+W];
      d[i]=Math.max(0,d[i]+h*(inn-(fl[i]+fr2[i]+ft[i]+fb[i])));}}
  let t=0,tl=0,f0=0;drop(48,32);
  if(reduce){for(let k=0;k<40;k++){stepLevel(.1);for(let s=0;s<4;s++)stepPipes(.04);}}
  return {tick(dt){t+=dt;c.out('fr',c.v('fr').toFixed(3));f0++;tl+=dt;while(tl>.08){stepLevel(.08);tl-=.08;}for(let s=0;s<4;s++)stepPipes(.04);
    const u=A.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,l=L[((y/CS)|0)*LW+((x/CS)|0)];let col=l===0?bg[i]:l>=7?PAL.AC[4]:l>=5?PAL.AC[3]:l>=3?PAL.AC[2]:l>=2?PAL.AC[1]:wetC(bg[i]);
      if(l>0&&(x%CS===0||y%CS===0)&&l<7)col=mix32(col,PAL.AC[4],.25);u[i]=col;}A.put();
    const v=B.u32;let vol=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,dd=d[i];vol+=dd;if(dd<.03){v[i]=bg[i];continue;}
      const sl=(x<W-1?bed[i+1]+d[i+1]:bed[i]+dd)-(x>0?bed[i-1]+d[i-1]:bed[i]+dd)+(y<H-1?bed[i+W]+d[i+W]:bed[i]+dd)-(y>0?bed[i-W]+d[i-W]:bed[i]+dd);
      let col=dd<.12?wetC(bg[i]):dd<.5?PAL.AC[2]:dd<1.1?PAL.AC[3]:PAL.AC[4];if(sl<-.09)col=sl<-.2?PAL.AC[0]:PAL.AC[1];else if(sl>.12)col=PAL.AC[4];v[i]=col;}B.put();
    if(f0%10===0)setHud(root,`volume ${vol.toFixed(1)} (conserved)`);}};});

// ======================================================================
// FIG 7: goop grid with combination rules
// ======================================================================
reg('goop',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),log=$('.goop-log',root);const TS=8,TW=W/TS,TH=H/TS,NT=TW*TH;
  const NONE=0,WATER=1,OIL=2,ACID=3,ICE=4,FACID=5;const LQ=new Uint8Array(NT),LV=new Uint8Array(NT),CONC=new Float32Array(NT),FIRE=new Float32Array(NT),ELEC=new Float32Array(NT),FREEZE=new Float32Array(NT);
  const unit={tx:9,ty:6,acid:false};let tool='acid';c.seg('tool',v=>tool=v);
  const say=(t,tag)=>{const li=document.createElement('li');li.innerHTML=t+(tag?` <span class="cite"><b class="tag tv">V</b> ${tag}</span>`:'');log.prepend(li);while(log.children.length>6)log.lastChild.remove();};
  function reset(){LQ.fill(0);LV.fill(0);CONC.fill(1);FIRE.fill(0);ELEC.fill(0);FREEZE.fill(0);
    const P=(x0,y0,w,h,q)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const k=y*TW+x;LQ[k]=q;LV[k]=2;}};
    P(1,2,5,4,WATER);P(2,6,3,3,WATER);P(8,1,2,9,OIL);P(10,9,4,2,OIL);P(13,2,5,4,ACID);P(15,6,3,2,ACID);unit.tx=11;unit.ty=5;unit.acid=false;log.innerHTML='';say('Board ready. Paint a liquid, set fire to the oil, or shock the water.');}
  reset();c.btn('reset',reset);
  const nb=k=>{const x=k%TW,y=(k/TW)|0,o=[];if(x>0)o.push(k-1);if(x<TW-1)o.push(k+1);if(y>0)o.push(k-TW);if(y<TH-1)o.push(k+TW);return o;};
  const flood=(k,q)=>{const seen=new Set([k]),st=[k];while(st.length){const a=st.pop();for(const b of nb(a))if(!seen.has(b)&&LQ[b]===q){seen.add(b);st.push(b);}}return [...seen];};
  function arrive(){const k=unit.ty*TW+unit.tx;
    if(LQ[k]===ACID){unit.acid=true;LQ[k]=NONE;LV[k]=0;say('Unit stops on acid: ACID status (weapon damage taken ×2); the pool becomes ground.','Into the Breach');}
    else if(LQ[k]===WATER&&unit.acid){unit.acid=false;LQ[k]=ACID;CONC[k]=1;LV[k]=2;say('Water cures the unit, but the water tile becomes an ACID tile.','Into the Breach');}
    else if(LQ[k]===WATER&&ELEC[k]>0)say('The unit is standing in electrified water.');}
  function paint(tx,ty,first){if(tx<0||ty<0||tx>=TW||ty>=TH)return;const k=ty*TW+tx,q=LQ[k];
    if(tool==='unit'){if(first){unit.tx=tx;unit.ty=ty;arrive();}return;}
    if(tool==='erase'){LQ[k]=NONE;LV[k]=0;FIRE[k]=0;return;}
    if(tool==='water'){if(q===ACID){LV[k]=Math.min(3,LV[k]+1);CONC[k]=CONC[k]*(LV[k]-1)/LV[k];if(first)say(`Water enters acid: level ${LV[k]}, concentration ${CONC[k].toFixed(2)}.`,'note 03 rule');return;}
      LQ[k]=WATER;LV[k]=2;FIRE[k]=0;return;}
    if(tool==='acid'){if(q===WATER){LQ[k]=ACID;CONC[k]=.5;LV[k]=Math.min(3,LV[k]+1);if(first)say('Acid poured into water arrives diluted.');return;}LQ[k]=ACID;CONC[k]=1;LV[k]=2;return;}
    if(tool==='oil'){LQ[k]=OIL;LV[k]=2;return;}
    if(!first)return;
    if(tool==='fire'){if(q===OIL){FIRE[k]=1.6;say('Fire on oil: a gradual front, tile by tile.','Gungeon');}
      else if(q===FACID){if(rnd()<.9){LQ[k]=ACID;say('Fire melts frozen acid back into acid (probability 90).','Noita reaction');}}
      else if(q===ICE){LQ[k]=WATER;say('Fire thaws the ice.');}
      else say(q===ACID?'Acid does not ignite in this table; keep the combinations small.':q===WATER?'Water does not burn.':'Nothing here to burn.');}
    if(tool==='shock'){if(q===WATER){const s=flood(k,WATER);for(const b of s)ELEC[b]=.7;say(`Shock crosses the whole connected pool <b>instantly</b>: ${s.length} tiles.`,'Gungeon');}
      else say(q===ACID?'Only water electrifies in Gungeon\'s table, so acid ignores the shock.':'No water to carry the shock.','Gungeon');}
    if(tool==='cryo'){if(q===WATER){FREEZE[k]=.01;say('Cryo: ice spreads through the pool until it is frozen (gradual).','Gungeon');}
      else if(q===ACID){const s=flood(k,ACID);for(const b of s)LQ[b]=FACID;say(`Cryo turns ${s.length} acid tiles into frozen acid (harmless until it thaws).`,'Into the Breach');}
      else say('Nothing to freeze.');}}
  let lastT=-1;pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag'){const tx=(x/TS)|0,ty=(y/TS)|0,key=tx+ty*99;if(k==='drag'&&key===lastT)return;paint(tx,ty,k==='down');lastT=key;}if(k==='up')lastT=-1;});
  let acc=0,fr=0;const WATERC=H32(['#2c4273','#407292','#56a3b2']),OILC=H32(['#1a0d22','#281039','#3d2050']),ICEC=H32(['#dff6ff','#a9d6e5','#7fb1c8']);
  return {tick(dt){fr++;acc+=dt;
    while(acc>.15){acc-=.15;
      for(let k=0;k<NT;k++){if(FIRE[k]>0){FIRE[k]-=.15;if(FIRE[k]>.9){const o=nb(k).filter(b=>LQ[b]===OIL&&FIRE[b]<=0);if(o.length)FIRE[o[ri(o.length)]]=1.6;}if(FIRE[k]<=0){FIRE[k]=0;LQ[k]=NONE;LV[k]=0;}}
        if(ELEC[k]>0)ELEC[k]-=.15;
        if(FREEZE[k]>0&&LQ[k]===WATER){LQ[k]=ICE;FREEZE[k]=0;for(const b of nb(k))if(LQ[b]===WATER&&rnd()<.7)FREEZE[b]=.01;}}}
    const u=px.u32;
    for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const k=ty*TW+tx,q=LQ[k];for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){const X=tx*TS+x,Y=ty*TS+y,i=Y*W+X;let col;
      const fl=(x===0||y===0)?PAL.FLR[3]:(hash2(X,Y)<.08?PAL.FLR[2]:hash2(tx,ty)<.5?PAL.FLR[0]:PAL.FLR[1]);
      if(q===WATER){const w=Math.sin(X*.5+Y*.2+fr*.06);col=w>.85?WATERC[2]:w>-.2?WATERC[1]:WATERC[0];}
      else if(q===OIL){col=hash2(X,Y)<.1?OILC[2]:(X+Y+(fr>>4))%7===0?OILC[2]:OILC[1];}
      else if(q===ACID){const w=Math.sin(X*.35+fr*.03+Math.sin(Y*.3+fr*.015)*1.6)+Math.sin((X+Y)*.21-fr*.02);col=w>1.5?PAL.AC[1]:LV[k]>2?PAL.AC[3]:PAL.AC[2];if(CONC[k]<.99)col=mix32(col,WATERC[1],(1-CONC[k])*.8);}
      else if(q===ICE)col=hash2(X,Y)<.15?ICEC[0]:ICEC[1];
      else if(q===FACID)col=hash2(X,Y)<.2?ICEC[0]:mix32(PAL.AC[2],ICEC[1],.55);
      else col=fl;
      if(q!==NONE){const e=(x===0&&tx>0&&LQ[k-1]!==q)||(y===0&&ty>0&&LQ[k-TW]!==q)||(x===TS-1&&tx<TW-1&&LQ[k+1]!==q)||(y===TS-1&&ty<TH-1&&LQ[k+TW]!==q);if(e&&q===ACID)col=PAL.AC[5];}
      if(FIRE[k]>0){const h=hash2(X+fr*3,Y)*1.2-(y/TS)*.4;if(h>.55)col=h>.9?PAL.FLAME[0]:h>.72?PAL.FLAME[1]:PAL.FLAME[2];}
      if(ELEC[k]>0&&((X*7+Y*3+fr)%9===0||(Y%4===0&&hash2(X,fr>>1)<.25)))col=(fr&2)?PAL.WHITE:C32('#fff0a0');
      u[i]=col;}}
    drawHero(u,W,H,unit.tx*TS+4,unit.ty*TS+7,{tint:unit.acid,flash:unit.acid&&(fr%40)<3,step:0});
    px.put();if(fr%10===0){let n=[0,0,0,0,0,0];for(let k=0;k<NT;k++)n[LQ[k]]++;setHud(root,`unit: ${unit.acid?'ACID (×2 damage)':'clean'} · acid ${n[ACID]} · water ${n[WATER]} · oil ${n[OIL]} tiles`);}}};});

// ======================================================================
// FIG 8: Hugo Elias ripple buffer on an acid pool
// ======================================================================
reg('ripple',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,N=W*H,c=ctl(root);
  const MASK=new Uint8Array(N),DEP=new Uint8Array(N),BG=new Uint32Array(N);let B1=new Float32Array(N),B2=new Float32Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const d=Math.hypot((x-W/2)/58,(y-H/2)/30)+vnoise(x/10,y/10)*.3-.15;MASK[i]=(d<1&&x>1&&y>1&&x<W-2&&y<H-2)?1:0;
    const nz=vnoise(x/5,y/5)*.35+vnoise(x/2.2,y/2.2)*.15;DEP[i]=clamp(Math.round((1-d)*3.2+nz*2.2),1,4);const gx=x%16,gy=y%16;BG[i]=(gx===0||gy===0)?PAL.FLR[3]:(gx===1||gy===1)?PAL.FLR[1]:hash2(x>>4,y>>4)<.5?PAL.FLR[0]:PAL.FLR[1];}
  const RAMP=[PAL.AC[0],PAL.AC[1],PAL.AC[2],PAL.AC[3],PAL.AC[4]];
  const poke=(x,y,v,big)=>{for(let yy=y-(big?1:0);yy<=y+(big?1:0);yy++)for(let xx=x-(big?1:0);xx<=x+(big?1:0);xx++){const i=yy*W+xx;if(i>=0&&i<N&&MASK[i])B1[i]=v;}};
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag')poke(x,y,-420,c.v('seed3'));});
  let fr=0,pt=0;poke(W/2|0,H/2|0,-500,true);
  return {tick(dt){fr++;const damp=c.v('damp');c.out('damp',damp.toFixed(3));pt-=dt;
    if(c.v('pops')&&pt<=0){pt=.25+rnd()*.5;let tries=0;while(tries++<20){const x=ri(W),y=ri(H);if(MASK[y*W+x]&&DEP[y*W+x]>=2){poke(x,y,-160,c.v('seed3'));break;}}}
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!MASK[i]){B2[i]=0;continue;}let v=(B1[i-1]+B1[i+1]+B1[i-W]+B1[i+W])/2-B2[i];B2[i]=v*damp;}
    const t=B1;B1=B2;B2=t;const h=B1,u=px.u32,show=c.v('hbuf');
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!MASK[i]){u[i]=BG[i];continue;}
      if(show){u[i]=HEAT[clamp((128+h[i]*.6)|0,0,255)];continue;}
      const dx=h[i-1]-h[i+1],dy=h[i-W]-h[i+W];const xo=dx>5?1:dx<-5?-1:0,yo=dy>5?1:dy<-5?-1:0;const sh=(dx-dy)/2;
      const j=(y+yo)*W+x+xo;let k=DEP[MASK[j]?j:i];k+=sh>8?-1:sh<-8?1:0;k=clamp(k,0,4);let col=RAMP[k];
      if(!MASK[i-1]||!MASK[i+1]||!MASK[i-W]||!MASK[i+W])col=PAL.AC[5];u[i]=col;}
    for(let x=0;x<W;x++){u[x]=BG[x];u[(H-1)*W+x]=BG[(H-1)*W+x];}for(let y=0;y<H;y++){u[y*W]=BG[y*W];u[y*W+W-1]=BG[y*W+W-1];}
    px.put();if(fr%20===0){let e=0;for(let i=0;i<N;i++)e+=Math.abs(h[i]);setHud(root,`ring energy ${(e/1000).toFixed(1)}k · click to splash`);}}};});

// ======================================================================
// FIG 9: reaction rules that spend the acid (TPT / Sandspiel / Sandbox / Noita-style)
// ======================================================================
reg('react',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,N=W*H,c=ctl(root),ro=$('[data-ro]',root);
  const T=new Uint8Array(N),S=new Float32Array(N),Q=new Float32Array(N),BG=new Uint32Array(N);let model='tpt',mat=M_IRON,dissolved=0,poured=0,fr=0;
  const HARD={3:40,4:14,5:24,7:70,8:0};   // illustrative "Hardness" for the TPT rule
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;BG[i]=(x%16===0||y%16===0)?PAL.FLR[3]:hash2(x>>4,y>>4)<.5?PAL.FLR[0]:PAL.FLR[1];}
  function reset(){T.fill(0);S.fill(0);Q.fill(0);dissolved=0;poured=0;for(let y=10;y<H-10;y++)for(let x=56;x<120;x++){const i=y*W+x;T[i]=1;Q[i]=1;}pour();}
  function pour(){let n=0,tries=0;while(n<60&&tries++<4000){const x=4+ri(44),y=4+ri(H-8),i=y*W+x;if(T[i]===0){T[i]=2;S[i]=model==='tpt'?75:model==='sand'?100+ri(51):1;n++;}}poured+=n;}
  c.seg('model',v=>{model=v;reset();});c.seg('mat',v=>{mat=+v;reset();});c.btn('pour',pour);c.btn('reset',reset);reset();
  const DIRS=[1,-1,W,-W];
  function step(){for(let k=0;k<N;k++){const i=(rnd()*N)|0;if(T[i]!==2)continue;const x=i%W,y=(i/W)|0;const j=i+(rnd()<.4?1:DIRS[ri(4)]),jx=j%W,jy=(j/W)|0;
      if(jx<1||jy<1||jx>=W-1||jy>=H-1||Math.abs(jx-x)>1)continue;
      if(T[j]===0){if(rnd()<.6){T[j]=2;S[j]=S[i];T[i]=0;S[i]=0;}continue;}
      if(T[j]===2){if(model==='tpt'){const d=(S[i]-S[j])/2;S[i]-=d/2;S[j]+=d/2;}continue;}
      // T[j] === 1: material
      if(model==='tpt'){if(S[i]>50){if(rnd()<HARD[mat]/1000*6){T[j]=0;dissolved++;S[i]-=1;}}else{T[i]=0;S[i]=0;}}
      else if(model==='sand'){if(mat===M_GOLD)continue;if(rnd()<.2){T[j]=0;dissolved++;S[i]-=60;if(S[i]<80){T[i]=0;S[i]=0;}}}
      else if(model==='ours'){const dmg=RATE[mat]*Math.min(1,S[i])*.0035*20*(.5+rnd());Q[j]-=dmg;S[i]-=.55*dmg;if(Q[j]<=0){T[j]=0;dissolved++;}if(S[i]<.004){T[i]=0;S[i]=0;}}
      else{if(mat===M_GOLD)continue;if(rnd()<.05){T[j]=0;dissolved++;}if(rnd()<.002){T[i]=0;S[i]=0;}}}}
  if(reduce)for(let k=0;k<200;k++)step();
  return {tick(dt){fr++;step();const u=px.u32;let alive=0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,t=T[i];let col=BG[i];
      if(t===1){const role=(x===56||y===10)?0:(x===119||y===H-11)?2:((x+y*3)%11===0?2:1);col=stageCol(mat,role,model==='ours'?Q[i]:1,x,y);if(col<0)col=BG[i];}
      else if(t===2){alive++;const f=model==='tpt'?(S[i]>50?1:.35):model==='sand'?(S[i]-80)/70:model==='ours'?S[i]:1;col=f>.66?PAL.AC[1]:f>.33?PAL.AC[2]:PAL.AC[3];}
      u[i]=col;}
    px.put();if(fr%8===0){const per=poured?(dissolved/poured):0;
      ro.innerHTML=`dissolved <b>${dissolved}</b> cells · acid pixels alive <b>${alive}</b> of ${poured} poured · <b>${per.toFixed(2)}</b> cells eaten per acid pixel`+
        (model==='tpt'?' · life 75, dies at ≤ 50 on contact':model==='sand'?' · −60 strength per dissolve, gone below 80':model==='ours'?` · RATE ${RATE[mat]} · acid pays 0.55 per unit of integrity`:' · acid survives; only evaporation stops it');
      setHud(root,`${MNAME[mat]}${mat===M_GOLD?' (immune)':''}`);}}};});
