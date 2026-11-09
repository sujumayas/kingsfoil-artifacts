
// ======================================================================
// FIG 10: integrity -> dithered stage colour, six items + ramp strip
// ======================================================================
reg('stages',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),qb=$('canvas.qbar',root),QB=PX(qb);
  const r=Room(W,H,{tile:16,seed:5});for(let i=0;i<r.N;i++){if(r.M[i]===M_WALL){r.M[i]=r.FM[i]=M_FLOOR;r.SOL[i]=0;r.FB[i]=PAL.FLR[2];}}
  r.item('crate',6,15);r.item('sword',38,21);r.item('shield',72,22);r.item('armor',100,11);r.item('bones',118,20);r.item('rug',139,14);
  let anim=false,q=c.v('q');c.btn('anim',b=>{anim=!anim;if(anim&&c.v('q')<.02)c.el('q').value=1;b.textContent=anim?'Stop':'Animate 1 → 0';});
  const SC=[C32('#2e3d25'),C32('#5d6b52'),C32('#a8b39a'),C32('#eef6e4')];
  function draw(){q=c.v('q');const dith=c.v('dith'),cues=c.v('cues'),map=c.v('map');c.out('q',q.toFixed(3));const u=px.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,m=r.M[i];let col=r.FB[i];
      if(m>=M_WOOD){if(map&&m!==M_GOLD){let si=Math.floor((1-q)*3.3+(dith?(bay(x,y)-7.5)/16*.9:0));si=clamp(si,0,3);col=(q<.15&&hash2(x,y)<(.15-q)*7)?PAL.BLACK:SC[si];}
        else{const s=stageCol(m,r.ROLE[i],q,x,y,{nodither:!dith,nocue:!cues});col=s<0?shadowC(r.FB[i]):s;}}
      u[i]=col;}px.put();
    const v=QB.u32,QW=QB.W;const mats=[M_WOOD,M_IRON,M_BONE,M_LEATH,M_CLOTH];
    for(let x=0;x<QW;x++){const qq=1-x/(QW-1);for(let k=0;k<5;k++)for(let yy=0;yy<2;yy++){const y=k*2+yy;const s=stageCol(mats[k],yy===0?0:1,qq,x,y,{nodither:!dith,nocue:!cues});v[y*QW+x]=s<0?PAL.BLACK:s;}
      const tick=[.70,.39,.09].some(b=>Math.abs(qq-b)<.003);v[10*QW+x]=tick?C32('#ffb86b'):PAL.BLACK;v[11*QW+x]=Math.abs(qq-q)<.004?PAL.WHITE:(tick?C32('#ffb86b'):PAL.BLACK);}
    QB.put();}
  ['q','dith','cues','map'].forEach(k=>c.on(k,draw));draw();
  return {tick(dt){if(anim){let v=c.v('q')-dt*.12;if(v<0)v=1;c.el('q').value=v;draw();}}};});

// ======================================================================
// FIG 11: Mérillou pitting front | crate eaten from the wet edge, then rust
// ======================================================================
reg('fronts',root=>{const cvs=$$('canvas',root),L=PX(cvs[0]),R=PX(cvs[1]),c=ctl(root),svg=$('svg.spark',root);const W=L.W,H=L.H,N=W*H;
  // --- left: random-walk corrosion on a plate
  const COR=new Uint8Array(N),D=new Float32Array(N),HOLE=new Uint8Array(N),K=new Float32Array(N),SCR=new Uint8Array(N),ROLEP=new Uint8Array(N);let cor=[],t=0,hist=[],SL=[];
  function plate(){COR.fill(0);D.fill(0);HOLE.fill(0);SCR.fill(0);cor=[];t=0;hist=[];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;K[i]=(y>=50&&y<58)?.25:1;ROLEP[i]=(x%24===0||y%18===0)?2:(x%24===1||y%18===1)?0:(hash2(x,y)<.06?0:1);}
    for(let k=0;k<70;k++){const x=10+k,y=12+(k*.42|0);if(x<W&&y<H){SCR[y*W+x]=1;}}SL=[];for(let i=0;i<N;i++)if(SCR[i])SL.push(i);}
  plate();c.btn('plate',plate);
  pointer(cvs[0],([x,y],k)=>{if((k==='down'||k==='drag')&&x>=0&&y>=0&&x<W&&y<H){for(const j of [y*W+x,y*W+Math.min(W-1,x+1)])if(!SCR[j]){SCR[j]=1;SL.push(j);}}});
  const N8=[1,-1,W,-W,W+1,W-1,-W+1,-W-1];
  function stepPlate(){const kstr=c.v('kstr'),th=c.v('th');t++;
    for(let s=0;s<40;s++){const i=(rnd()*N)|0;if(COR[i])continue;const k=K[i]*(SCR[i]?kstr:1);if(rnd()<.0003*k){COR[i]=1;cor.push(i);}}
    if(SL.length)for(let s=0;s<4;s++){const i=SL[(rnd()*SL.length)|0];if(!COR[i]&&rnd()<.0004*kstr){COR[i]=1;cor.push(i);}}
    const n=Math.min(cor.length,60);for(let s=0;s<n;s++){const i=cor[(rnd()*cor.length)|0];const x=i%W;let done=false;const o=ri(8);
      for(let a=0;a<8;a++){const j=i+N8[(a+o)&7],jx=j%W;if(j<0||j>=N||Math.abs(jx-x)>1)continue;if(!COR[j]){if(rnd()<K[j]*(SCR[j]?1.5:1)){COR[j]=1;cor.push(j);}done=true;break;}}
      if(!done){D[i]+=.08;if(D[i]>th)HOLE[i]=1;}}
    if(t%6===0){let m=0;for(let i=0;i<N;i++)if(COR[i])m+=1+D[i];hist.push(m);if(hist.length>160)hist.shift();}}
  function spark(){const Wd=300,Hd=70;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);if(hist.length<3){svg.innerHTML='';return;}const n=hist.length,mx=Math.max(...hist)||1;
    const X=k=>6+k/(n-1)*(Wd-12),Y=v=>Hd-10-v/mx*(Hd-22);const kfit=hist[n-1]/Math.pow(n,.516);
    let p='',q='';hist.forEach((v,k)=>{p+=(k?'L':'M')+X(k).toFixed(1)+','+Y(v).toFixed(1);q+=(k?'L':'M')+X(k).toFixed(1)+','+Y(kfit*Math.pow(k+1,.516)).toFixed(1);});
    svg.innerHTML=`<path d="${q}" fill="none" stroke="#ffb86b" stroke-dasharray="3 3" stroke-width="1.5"/><path d="${p}" fill="none" stroke="#c8f25a" stroke-width="2"/><text x="8" y="12" fill="#c8f25a">corroded mass</text><text x="${Wd-8}" y="12" text-anchor="end" fill="#ffb86b">k·tⁿ, n = 0.516</text>`;}
  // --- right: crate from the wet edge, then rust
  const RW=R.W,RH=R.H;let rr,ph='Wet edge',simT=0,crate;
  function room(){rr=Room(RW,RH,{tile:16,seed:21});crate=rr.item('crate',40,28);rr.spill(33,35,7,1.3);simT=0;}
  room();c.btn('pour',()=>{rr.spill(34,35,6,1.2);});
  let fr=0;if(reduce){for(let k=0;k<400;k++)stepPlate();for(let k=0;k<1800;k++)rr.step();}
  return {tick(dt){fr++;c.out('kstr','×'+c.v('kstr'));c.out('th',c.v('th'));stepPlate();stepPlate();
    const u=L.u32,th=c.v('th');for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let col;
      if(HOLE[i])col=(bay(x,y)<6)?PAL.FLR[3]:C32('#17120f');
      else if(COR[i]){const q=.66-D[i]/th*.62;col=stageCol(M_IRON,ROLEP[i],q,x,y);if(col<0)col=PAL.FLR[3];}
      else{col=stageCol(M_IRON,SCR[i]?0:ROLEP[i],1,x,y);if(y>=50&&y<58&&(x+y)%5===0)col=C32('#b8c0b0');if(SCR[i])col=C32('#eef3f8');}
      u[i]=col;}L.put();if(fr%6===0)spark();
    const tx=c.v('tx');c.out('tx',tx+'×');for(let k=0;k<tx;k++){rr.step();simT+=1/60;}rr.updParts(dt);
    const v=R.u32;if(c.v('rx')){rr.render(v,simT);for(let i=0;i<rr.N;i++)if(rr.M[i]===M_IRON)v[i]=HEAT[Math.min(255,40+rr.RU[i])];}else rr.render(v,simT);rr.drawParts(v);R.put();
    if(fr%10===0){let tot=rr.total(),rust=0,ir=0,eaten=0;for(const i of crate.px){if(rr.M[i]===M_IRON){ir++;if(rr.RU[i]>rr.BY[i]*12+30)rust++;}else if(rr.M[i]<M_WOOD)eaten++;}
      ph=tot>2?'Wet edge':rust>0?'Rust spreading':'Drying';$('[data-ph]',root).textContent=ph;
      const mm=Math.floor(simT/60),ss=String(Math.floor(simT%60)).padStart(2,'0');root.querySelector('[data-hud2]').textContent=`t ${mm}:${ss} · eaten ${eaten} px · rusty ${rust}/${ir} iron · acid ${tot.toFixed(0)} u`;
      setHud(root,`holes ${HOLE.reduce((a,b)=>a+b,0)} px · front ${cor.length} px`);}}};});

// ======================================================================
// FIG 12: dissolve three ways
// ======================================================================
reg('dissolve',root=>{const cvs=$$('canvas',root),P=cvs.map(PX),c=ctl(root);const W=48,H=48,N=W*H;
  const SPR=new Float64Array(N).fill(-1),BG=new Uint32Array(N),NZ=new Float32Array(N),SM=new Float32Array(N),RANK=new Float32Array(N).fill(1),DN=new Float32Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;BG[i]=(x%16===0||y%16===0)?PAL.FLR[3]:hash2(x>>4,y>>4)<.5?PAL.FLR[0]:PAL.FLR[1];
    const d=Math.hypot(x-24,(y-24)*1.08);NZ[i]=hash2(x*3+1,y*7+2);SM[i]=vnoise(x/6,y/6);DN[i]=Math.hypot(x-6,y-42)/58;
    if(d<=16){let col;if(d>13.5)col=STG[M_IRON][0][y<24?0:2];else if(d<3.5)col=STG[M_IRON][0][x+y<48?0:1];else col=STG[M_WOOD][0][(x+40)%6===0?2:(x+y<38?0:1)];SPR[i]=col;}}
  // fizzlefade: 17-bit LFSR, XOR 0x12000, seed 1
  {let v=1,step=0;do{const yy=v&0xFF,xx=(v&0x1FF00)>>8;if(xx<W&&yy<H)RANK[yy*W+xx]=step/131072;const lsb=v&1;v>>=1;if(lsb)v^=0x12000;step++;}while(v!==1&&step<140000);}
  let drv='sim',anim=false,p=c.v('p');c.seg('drv',v=>drv=v);c.btn('anim',b=>{anim=!anim;b.textContent=anim?'Stop':'Animate';});
  const integ=i=>drv==='flat'?1-p:clamp(1-p*1.8+DN[i]*1.25,0,1);
  return {tick(dt){if(anim){p+=dt*.22;if(p>1.05)p=0;c.el('p').value=Math.min(1,p);}else p=c.v('p');c.out('p',p.toFixed(2));const sm=c.v('smooth');
    const [a,b,f]=P.map(q=>q.u32);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,s=SPR[i];let bg=BG[i];if(drv==='sim'&&DN[i]<.16&&p>0){bg=(DN[i]<.1)?PAL.AC[2]:wetC(bg);}
      if(s<0){a[i]=b[i]=f[i]=bg;continue;}const I=integ(i);
      if(sm){const e=I-SM[i]*.25;const al=clamp((e+.02)/.06,0,1);let col=mix32(s,mix32(s,0,.4),clamp((.6-e)/.1,0,1));col=mix32(col,PAL.AC[5],clamp((.12-e)/.08,0,1));a[i]=mix32(bg,col,al);}
      else{const e=I-NZ[i]*.25;a[i]=e<0?bg:e<.08?PAL.AC[5]:e<.55?shadowC(s):s;}
      b[i]=I>(bay(x,y)+.5)/16?s:bg;
      f[i]=I>RANK[i]?s:bg;}
    P.forEach(q=>q.put());}};});

// ======================================================================
// FIG 13: armour before flesh, footprints
// ======================================================================
reg('armour',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);const r=Room(W,H,{tile:16,seed:8});
  r.spill(88,42,13,1.0);for(let k=0;k<400;k++)r.step({evap:false,react:false,gas:false,samples:0});
  const p={x:10,dir:1,boots:1,hp:100,feet:0,dist:0,foot:0,hurt:0,siz:0,printT:0};const bars={boots:$('[data-bar="boots"]',root),hp:$('[data-bar="hp"]',root)},av=$('[data-v="acid"]',root),pps=$$('.pp',root);
  c.btn('go',()=>{p.x=10;p.dir=1;if(r.total()<60)r.spill(88,42,12,1.0);});c.btn('repair',()=>{p.boots=1;p.hp=100;c.el('boots').checked=true;});
  let fr=0,t=0;
  return {tick(dt){fr++;t+=dt;const y=46,i0=y*W+(p.x|0);const af=(r.A[i0]+r.A[i0-1]+r.A[i0+1])/3;
    const sp=24*(1-Math.min(.4,af*.4));p.x+=p.dir*sp*dt;if(p.x>W-8){p.dir=-1;}if(p.x<8)p.dir=1;
    p.dist+=sp*dt;let printing=false;if(p.dist>5){p.dist=0;p.foot^=1;if(p.feet>.05){const fx=(p.x+(p.foot?1.5:-1.5))|0;for(const j of [y*W+fx,y*W+fx-1])r.A[j]+=p.feet*.3;r.grow(fx-2,y-1,fx+2,y+1);p.feet*=.72;printing=true;p.printT=.3;}}
    const wear=c.v('ff')?40:8;let burning=false;
    if(af>.05){p.feet=Math.max(p.feet,Math.min(1,af));if(p.boots>0&&c.v('boots')){p.boots=Math.max(0,p.boots-.035*af*dt*wear);}else{p.hp-=9*Math.min(1.5,af)*dt;p.hurt=.12;burning=true;p.siz-=dt;if(p.siz<=0){p.siz=.12;r.parts.push({k:'smoke',x:p.x+(rnd()-.5)*5,y:y,z:1,vx:(rnd()-.5)*6,vy:0,vz:14,life:.9,t:0});}}}
    if(p.hp<=0){p.hp=100;}p.hurt-=dt;p.printT-=dt;
    r.step({evapMul:.3,react:false,samples:0});r.updParts(dt);const u=px.u32;r.render(u,t,{haze:false});r.drawParts(u);
    const bq=c.v('boots')?p.boots:0;drawHero(u,W,H,p.x,y,{eq:{helm:1,chest:1,boots:bq},flash:p.hurt>0&&(fr&2),step:((p.x/3)|0)%3});px.put();
    if(fr%3===0){av.textContent=af.toFixed(2);bars.boots.style.width=(bq*100)+'%';bars.hp.style.width=Math.max(0,p.hp)+'%';
      pps.forEach(e=>{const k=e.dataset.p;e.classList.toggle('on',k==='acid'?af>.05:k==='boots'?af>.05&&bq>0:k==='hp'?burning:p.printT>0);});
      setHud(root,`boots ${(bq*100).toFixed(0)} % · HP ${Math.max(0,p.hp).toFixed(0)} · speed ${(sp/24*100).toFixed(0)} %`);}}};});

// ======================================================================
// FIG 14: damage-over-time models on one clock
// ======================================================================
reg('dot',root=>{const svg=$('svg.dotc',root),c=ctl(root),ro=$('[data-ro]',root),chips=$('[data-models]',root);
  const M=[
    {k:'DOOM nukage, 5 per 32 tics',col:'#c8f25a',on:true,f:(t,E,mx)=>5*Math.floor(Math.min(t,E)*35/32)},
    {k:'DOOM strong floor, 20 per 32 tics',col:'#9fd33a',on:false,f:(t,E,mx)=>20*Math.floor(Math.min(t,E)*35/32)},
    {k:'Factorio medium puddle, 28.8 DPS',col:'#ffb86b',on:true,f:(t,E,mx)=>28.8*Math.min(t,E,32)},
    {k:'Elden Ring Lake of Rot, 2 % + 30/s (coating)',col:'#c9a2ff',on:true,f:(t,E,mx)=>{const s=Math.max(0,Math.min(t,180+1)-1);return s*(mx*.02+30);}},
    {k:'Swamp of Aeonia, 2 % + 8/s (coating)',col:'#e9a0d6',on:false,f:(t,E,mx)=>{const s=Math.max(0,Math.min(t,181)-1);return s*(mx*.02+8);}},
    {k:'Risk of Rain 2 poison, 10 % over 10 s, can\'t kill',col:'#6dd4c3',on:true,cant:true,f:(t,E,mx)=>{const end=Math.min(t,E+10);return mx*.01*Math.max(0,end);}},
    {k:'Gungeon-style meter: 2 s to fill, then 10 % (illustrative)',col:'#56a3b2',on:true,f:(t,E,mx)=>mx*.1*Math.floor(Math.min(t,E)/2)},
    {k:'Tapering burn 4, 3, 2, 2, 1, 1 (illustrative)',col:'#f6ffa8',on:false,f:(t,E,mx)=>{let d=0;const T=[3,2,2,1,1];for(let s=1;s<=Math.floor(t);s++){if(s<=E)d+=4;else{const k=s-Math.ceil(E)-1;if(k>=0&&k<T.length)d+=T[k];}}return d;}}];
  chips.innerHTML=M.map((m,i)=>`<button type="button" class="${m.on?'on':''}" data-i="${i}"><i style="background:${m.col}"></i>${m.k}</button>`).join('');
  chips.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const m=M[+b.dataset.i];m.on=!m.on;b.classList.toggle('on',m.on);draw();});
  let hov=-1;
  function hpAt(m,t,E,mx){const v=mx-m.f(t,E,mx);return m.cant?Math.max(1,v):Math.max(0,v);}
  function draw(){const mx=c.v('hp'),E=c.v('exit');c.out('hp',mx+' HP');c.out('exit',E+' s');const cp=root.clientWidth<600;const Wd=cp?420:760,Hd=cp?300:300,Lm=44,Rm=12,T=14,B=34,TM=60;
    const X=t=>Lm+t/TM*(Wd-Lm-Rm),Y=v=>T+(1-v/mx)*(Hd-T-B);svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';
    for(let k=0;k<=4;k++){const v=mx*k/4;svgEl('line',{x1:Lm,x2:Wd-Rm,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,Lm-6,Y(v)+4,Math.round(v),{'text-anchor':'end'});}
    for(let t=0;t<=TM;t+=10){svgEl('line',{x1:X(t),x2:X(t),y1:T,y2:Hd-B,class:'gl'},svg);svgText(svg,X(t),Hd-B+16,t+' s',{'text-anchor':'middle'});}
    svgEl('rect',{x:X(0),y:T,width:X(E)-X(0),height:Hd-T-B,fill:'#c8f25a','fill-opacity':.05},svg);
    svgEl('line',{x1:X(E),x2:X(E),y1:T,y2:Hd-B,stroke:'#c8f25a','stroke-dasharray':'4 3'},svg);svgText(svg,X(E)+4,T+12,'leave the hazard',{class:'lab','font-size':12});
    for(const m of M){if(!m.on)continue;let d='',dead=null;for(let k=0;k<=TM*20;k++){const t=k/20,v=hpAt(m,t,E,mx);d+=(k?'L':'M')+X(t).toFixed(1)+','+Y(v).toFixed(1);if(v<=0&&dead===null)dead=t;}
      svgEl('path',{d,fill:'none',stroke:m.col,'stroke-width':2.2,'stroke-linejoin':'round'},svg);if(dead!==null){svgText(svg,X(dead),Y(0)-4,'✕',{'text-anchor':'middle',fill:m.col,'font-size':14});}}
    if(hov>=0){svgEl('line',{x1:X(hov),x2:X(hov),y1:T,y2:Hd-B,stroke:'#eef6e4','stroke-width':1},svg);
      ro.innerHTML=`at <b>${hov.toFixed(1)} s</b>: `+M.filter(m=>m.on).map(m=>`<span style="color:${m.col}">${m.k.split(',')[0]}</span> ${Math.round(hpAt(m,hov,E,mx))}`).join(' · ');}
    svgText(svg,Lm,Hd-4,'HP over time (each line is one model)',{});}
  svg.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;const x=(e.clientX-r.left)/r.width*vb.width;hov=clamp((x-44)/(vb.width-56)*60,0,60);draw();});
  svg.addEventListener('pointerleave',()=>{hov=-1;draw();});
  c.on('hp',draw);c.on('exit',draw);draw();let lastCp=root.clientWidth<600;addEventListener('resize',()=>{const cp=root.clientWidth<600;if(cp!==lastCp){lastCp=cp;draw();}});return {};});
