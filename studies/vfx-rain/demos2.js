// ======================================================================
// B2 + E1: cover map painter with exposure rays per wind bucket
// ======================================================================
reg('shadow',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,N=W*H,c=ctl(root),ro=$('[data-ro]',root);
  const K=new Uint8Array(N),HT=new Uint8Array(N),SHL=new Float32Array(N),EXP=new Float32Array(N),WET=new Uint8Array(N),BASE=new Uint32Array(N),TH=new Float32Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const n=vnoise(x/10,y/10);BASE[i]=P32(x>70?(((x+((y/5|0)&1)*3)%7===0||y%5===0)?CO[2]:CO[hash2((x+((y/5|0)&1)*3)/7|0,y/5|0)<.3?1:0]):n<.4?GR[0]:n<.7?GR[1]:GR[2]);TH[i]=4+bay(x,y)*9+hash2(x,y)*40;}
  let tool='wall',view='rain',dirty=true,wb=99,fr=0;const D=[];
  const stamp=(x,y)=>{if(tool==='wall'){for(let yy=y-1;yy<=y;yy++)for(let xx=x-1;xx<=x;xx++)if(xx>=0&&yy>=0&&xx<W&&yy<H){const i=yy*W+xx;K[i]=1;HT[i]=9;}}
    else if(tool==='house'){for(let yy=y-5;yy<=y+5;yy++)for(let xx=x-7;xx<=x+7;xx++)if(xx>=0&&yy>=0&&xx<W&&yy<H){const i=yy*W+xx;K[i]=2;HT[i]=30;}}
    else if(tool==='tree'){for(let yy=y-6;yy<=y+6;yy++)for(let xx=x-15;xx<=x+15;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;const dx=(xx-x)/14,dy=(yy-y+1)/6.5,r=Math.sqrt(dx*dx+dy*dy);if(r<1)SHL[yy*W+xx]=Math.min(SHL[yy*W+xx],.1+.9*r*r);}
      for(let yy=y-24;yy<=y-3;yy++)for(let xx=x-12;xx<=x+12;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;const dx=(xx-x)/12,dy=(yy-(y-13))/10;if(dx*dx+dy*dy<1+vnoise(xx*.4,yy*.4)*.3-.15)K[yy*W+xx]=K[yy*W+xx]===1||K[yy*W+xx]===2?K[yy*W+xx]:3;}
      for(let yy=y-3;yy<=y;yy++)for(let xx=x-1;xx<=x+1;xx++)if(xx>=0&&yy>=0&&xx<W&&yy<H){K[yy*W+xx]=4;HT[yy*W+xx]=22;}}
    else for(let yy=y-3;yy<=y+3;yy++)for(let xx=x-3;xx<=x+3;xx++)if(xx>=0&&yy>=0&&xx<W&&yy<H){const i=yy*W+xx;K[i]=0;HT[i]=0;SHL[i]=1;}
    dirty=true;};
  function reset(){K.fill(0);HT.fill(0);SHL.fill(1);WET.fill(0);const t0=tool;tool='house';stamp(22,20);stamp(36,20);tool='wall';for(let y=36;y<62;y+=2)stamp(58,y);tool='tree';stamp(98,62);tool=t0;}
  reset();
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag')stamp(x,y);});
  c.seg('tool',v=>tool=v);c.seg('view',v=>view=v);c.btn('reset',()=>reset());
  const wind=()=>c.v('wind')/100;const wo=()=>c.out('wind',wind().toFixed(2));c.on('wind',wo);wo();
  function expo(){const b=Math.round(wind()*3);if(b===wb&&!dirty)return;wb=b;dirty=false;const wv=b/3,dir=Math.sign(wv),mag=Math.abs(wv);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(K[i]===1||K[i]===2||K[i]===4){EXP[i]=K[i]===2?1:0;continue;}let e=SHL[i];
      if(mag>.15)for(let d=1;d<=26;d++){const sx=x-dir*d;if(sx<0||sx>=W)break;const h=HT[y*W+sx];if(h>0){const L=h*.9*mag+1.5;if(d<L){const f=d/L;e*=.08+.92*f*f;}break;}}EXP[i]=e;}}
  const Wc=P32(WL[0]),Wd=P32(WL[2]),Rf=[P32(RF[0]),P32(RF[1]),P32(RF[2])],Cn=[P32(CN[0]),P32(CN[1]),P32(CN[2])],Tr=P32(TRUNK);
  const simOnce=()=>{for(let k=0;k<160;k++){const i=(rnd()*N)|0;if(K[i]===0||K[i]===3){if(rnd()<EXP[i])WET[i]=Math.min(255,WET[i]+26);}}
    for(let k=0;k<420;k++){const i=(rnd()*N)|0;if(WET[i]&&rnd()<.5)WET[i]=WET[i]>3?WET[i]-3:0;}};
  expo();for(let k=0;k<400;k++)simOnce();
  return {tick(dt){fr++;expo();const I=.8,wv=wind();simOnce();
    while(D.length<70)D.push({x:rnd()*(W+40)-20,y:rnd()*H,z:30+rnd()*40,l:ri(3)});
    const u=px.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=K[i];let col;
      if(view==='exp'&&k!==1&&k!==2&&k!==4){u[i]=HEAT[(EXP[i]*255)|0];continue;}
      if(k===1)col=(y%3===0)?Wd:Wc;else if(k===2)col=Rf[(y%4===3)?1:0];else if(k===4)col=Tr;else if(k===3)col=Cn[(x+y)%5===0?1:hash2(x,y)<.2?2:0];
      else col=WET[i]>TH[i]?wetC(BASE[i]):BASE[i];u[i]=col;}
    const RNc=P32(RNN),SPc=P32(SPL);
    for(const d of D){const vz=VZ[d.l]*(.55+.45*I)*.5;d.z-=vz*dt;d.x+=wv*vz*.55*dt;if(d.z<=0){const xi=d.x|0,yi=d.y|0;if(xi>=0&&yi>=0&&xi<W&&yi<H){const i=yi*W+xi;if(K[i]===2||rnd()<EXP[i])u[i]=SPc;}d.x=rnd()*(W+40)-20;d.y=rnd()*H;d.z=30+rnd()*40;continue;}
      const sx=d.x-wv*d.z*.55,sy=d.y-d.z;const len=[2,3,5][d.l];for(let s=0;s<=len;s++){const xx=(sx-wv*.55*s)|0,yy=(sy-s)|0;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=RNc;}}
    px.put();
    if(fr%15===0){const b=wb/3,m=Math.abs(b);setHud(root,`bucket round(3·wind) = ${wb} → wind ${b.toFixed(2)}`);
      ro.innerHTML=m>.15?`Lee lengths at |wind| ${m.toFixed(2)}: wall h 9 → <b>${(9*.9*m+1.5).toFixed(1)} px</b>, trunk h 22 → <b>${(22*.9*m+1.5).toFixed(1)} px</b>, roof h 30 → <b>${(30*.9*m+1.5).toFixed(1)} px</b>; rays stop at 26 px. The dry strip sits ${b>0?'right':'left'} of each obstacle.`:'Below |wind| 0.15 the Sandbox casts no lee: only roofs and canopies shelter.';}}};});

// ======================================================================
// C1: wetness byte + Bayer threshold
// ======================================================================
reg('dither',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,N=W*H,c=ctl(root),ro=$('[data-ro]',root),bg=$('.bgrid',root);
  bg.innerHTML=BAYER.map((v,k)=>`<div data-k="${k}">${v}</div>`).join('');const cells=$$('div',bg);
  const WET=new Uint8Array(N),TH=new Float32Array(N),BASE=new Uint32Array(N),HS=new Float32Array(N);let mat=1,wx='rain',thr='bh',fr=0;const D=[];
  for(let i=0;i<N;i++)HS[i]=hash2(i%W,(i/W)|0);
  function paint(){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,h=HS[i],n=vnoise(x/7,y/7);let b;
    if(mat===GRASS)b=n<.4?GR[0]:n<.7?GR[1]:GR[2];else if(mat===DIRT)b=h<.3?DI[1]:n<.3?DI[2]:DI[0];else if(mat===SAND)b=h<.4?SA[1]:SA[0];
    else if(mat===STONE){const row=(y/5)|0,off=(row&1)*3;b=((x+off)%7===0||y%5===0)?CO[2]:(hash2((x+off)/7|0,row)<.3?CO[1]:CO[0]);}
    else if(mat===CLOTH)b=((x/6)|0)%2?CL[1]:CL[0];else b=(x%24===0||y%16===0)?MT[2]:(y%16===1?MT[0]:MT[1]);BASE[i]=P32(b);}}
  function thrs(){for(let i=0;i<N;i++){const B=bay(i%W,(i/W)|0);TH[i]=thr==='bh'?4+B*9+HS[i]*40:thr==='b'?4+B*15:128;}}
  paint();thrs();for(let k=0;k<160;k++){const n=(.3*1500*N/57600)|0;for(let j=0;j<n;j++){const i=(rnd()*N)|0;WET[i]=Math.min(255,WET[i]+26);}}
  c.seg('mat',v=>{mat=+v;paint();WET.fill(0);});c.seg('wx',v=>wx=v);c.seg('thr',v=>{thr=v;thrs();});
  const io=()=>c.out('int',(c.v('int')/100).toFixed(2));c.on('int',io);io();
  return {tick(dt){fr++;const I=c.v('int')/100,AK=N/57600,raining=wx==='rain';
    if(raining){const n=Math.max(1,(I*1500*AK)|0);for(let k=0;k<n;k++){const i=(rnd()*N)|0;WET[i]=Math.min(255,WET[i]+26);}}
    const dk=raining?(I>.25?0:.55):(wx==='sun'?2.6:2.6*.45);const ns=Math.max(40,(5000*AK)|0);for(let k=0;k<ns;k++){const i=(rnd()*N)|0;if(!WET[i])continue;if(rnd()<DRY[mat]*dk*.5)WET[i]=WET[i]>3?WET[i]-3:0;}
    const u=px.u32;let wet=0,sum=0;for(let i=0;i<N;i++){sum+=WET[i];const w2=WET[i]>TH[i];if(w2)wet++;let col=w2?wetC(BASE[i]):BASE[i];
      if(w2&&WET[i]>200&&(mat===STONE||mat===METAL)&&HS[i]<(mat===METAL?.28:.05)&&(((i/W|0)+(fr>>4))&3)!==0)col=P32(SHEEN);u[i]=col;}
    if(raining){const want=Math.round(dropCount(I)*AK*.6);while(D.length<want)D.push({x:rnd()*W,y:rnd()*H,z:20+rnd()*30});if(D.length>want)D.length=want;const RNc=P32(RNN);
      for(const d of D){d.z-=150*(.55+.45*I)*dt;if(d.z<=0){const i=(d.y|0)*W+(d.x|0);if(i>=0&&i<N){WET[i]=Math.min(255,WET[i]+36);u[i]=P32(SPL);}d.x=rnd()*W;d.y=rnd()*H;d.z=20+rnd()*30;continue;}
        for(let s=0;s<2;s++){const yy=(d.y-d.z-s)|0,xx=d.x|0;if(yy>=0&&yy<H)u[yy*W+xx]=RNc;}}}
    px.put();const avg=sum/N;
    if(fr%10===0){cells.forEach((el,k)=>{const pass=avg>(thr==='bh'?4+BAYER[k]*9+20:thr==='b'?4+BAYER[k]*15:128);el.classList.toggle('w',pass);});
      setHud(root,`${Math.round(wet/N*100)} % of pixels look wet · mean wetness ${avg.toFixed(0)}/255`);
      ro.innerHTML=`${MNAMES[mat]}: DRY = <b>${DRY[mat]}</b> · ${raining?`${Math.max(1,(I*1500*N/57600)|0)} virtual hits/step at +26`:'no rain'} · drying factor <b>${dk.toFixed(2)}</b> → each sampled pixel loses 3 with p = ${Math.min(1,DRY[mat]*dk*.5).toFixed(2)}`;}}};});
const MNAMES=['Grass','Dirt','Stone','Sand','Wood','Water','Roof','Canopy','Cloth','Metal'];

// ======================================================================
// C2: wet palette by porosity, plus film glints
// ======================================================================
reg('porosity',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),sw=$('[data-sw]',root);
  const MATS=[{n:'Sand',b:[SA[0],SA[1]],p:.62,steps:2},{n:'Dirt',b:[DI[0],DI[1]],p:.55,steps:2},{n:'Grass',b:[GR[1],GR[2]],p:.4,steps:1},{n:'Wood',b:[WD[0],WD[1]],wood:true,steps:2},
    {n:'Cloth',b:[CL[0],CL[1]],p:.5,steps:2},{n:'Stone',b:[CO[0],CO[3]],p:.25,steps:1,gl:.05},{n:'Roof',b:[RF[0],RF[1]],p:.2,steps:1,gl:.08},{n:'Metal',b:[MT[0],MT[1]],metal:true,p:0,steps:0,gl:.28}];
  const CW=W/MATS.length;let mode='por',fr=0;
  const wetOf=(m,col)=>{if(mode==='sbx')return wetC(col);if(mode==='steps'){let k=col;for(let s=0;s<m.steps;s++)k=mul32(k,.8,.82,.86);return k;}
    if(m.wood)return mul32(col,.82,.58,.38);const f=lerp(1,.2,(m.metal?0:1)*m.p);return mul32(col,f,f,f);};
  function swatches(){sw.innerHTML=MATS.map(m=>{const d=P32(m.b[0]),w2=wetOf(m,d);return `<span class="sw"><i style="background:${css(d)}"></i><i style="background:${css(w2)}"></i>${m.n} ${Math.round(lum32(w2)/lum32(d)*100)} %</span>`;}).join('');}
  c.seg('mode',v=>{mode=v;swatches();});const wo=()=>c.out('wet',c.v('wet')+' %');c.on('wet',wo);wo();swatches();
  return {tick(dt){fr++;const wl=c.v('wet')/100*255,gl=c.v('glint'),u=px.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const mi=Math.min(MATS.length-1,(x/CW)|0),m=MATS[mi],lx=x-mi*CW,h=hash2(x,y);let base;
      if(m.n==='Stone'){const row=(y/5)|0,off=(row&1)*3;base=((lx+off)%7===0||y%5===0)?P32(CO[2]):P32(m.b[hash2((lx+off)/7|0,row)<.4?1:0]);}
      else if(m.n==='Roof')base=P32((y%4===3)?RF[1]:RF[0]);else if(m.n==='Wood')base=P32((lx%5===0)?WD[2]:m.b[(y%7===0)?1:0]);
      else if(m.n==='Cloth')base=P32(((lx/4)|0)%2?CL[1]:CL[0]);else if(m.n==='Metal')base=P32(y%12===0||lx===0?MT[2]:(y%12===1?MT[0]:MT[1]));else base=P32(m.b[h<.35?1:0]);
      let col=base;const wet=wl>4+bay(x,y)*9+h*40;if(wet)col=wetOf(m,base);
      if(gl&&wet&&wl>200&&m.gl&&h<m.gl&&((y+(fr>>4))&3)!==0)col=P32(SHEEN);
      if(lx===CW-1)col=C32('#0b1016');u[y*W+x]=col;}
    px.put();}};});

// ======================================================================
// C3: drying S-curves (analytic replay of the Sandbox's sampled rule)
// ======================================================================
reg('drying',root=>{const svg=$('svg.dryc',root),cv=$('canvas',root),px=PX(cv),c=ctl(root),chips=$('[data-mats]',root);
  const MS=[{n:'Metal',m:METAL,col:'#b2bac6',meas:{sun:[13.5,17]}},{n:'Stone',m:STONE,col:'#d8d7cf',meas:{sun:[14,19.5],shade:[11.5,15.5]}},{n:'Roof',m:ROOF,col:'#8fa0be',meas:{sun:[14.5,19.5]}},
    {n:'Sand',m:SAND,col:'#d8c38f',meas:{sun:[14,19.5]}},{n:'Wood',m:WOOD,col:'#c09060',meas:{sun:[14,19.5]}},{n:'Grass',m:GRASS,col:'#79a35a',meas:{sun:[14,19.5],shade:[20.5,50]}},
    {n:'Dirt',m:DIRT,col:'#b08a62',meas:{sun:[16.5,24],shade:[57,99.5]}},{n:'Cloth',m:CLOTH,col:'#e0675f',meas:{sun:[19,25.5]}}];
  const on=new Set(['Metal','Grass','Dirt','Cloth']);let ex='sun';
  chips.innerHTML=MS.map(m=>`<button type="button" class="${on.has(m.n)?'on':''}" data-n="${m.n}"><i style="background:${m.col}"></i>${m.n} (DRY ${DRY[m.m]})</button>`).join('');
  chips.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const n=b.dataset.n;on.has(n)?on.delete(n):on.add(n);b.classList.toggle('on',on.has(n));draw();});
  c.seg('sun',v=>{ex=v;draw();});c.on('t',()=>{draw();});
  const THR=[];for(let b=0;b<16;b++)for(let k=0;k<20;k++)THR.push(4+b*9+(k+.5)/20*40);
  const ncdf=z=>{const t=1/(1+.2316419*Math.abs(z)),d=.3989423*Math.exp(-z*z/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p;};
  const pOf=m=>.0868*Math.min(1,DRY[m]*(ex==='sun'?2.6:2.6*.45)*.5);
  const frac=(m,t,thr)=>{const n=t*60,p=pOf(m),mu=n*p,sd=Math.sqrt(Math.max(1e-6,n*p*(1-p)));if(n===0)return 1;
    if(thr!==undefined)return ncdf(((255-thr)/3-.5-mu)/sd);let s=0;for(const th of THR)s+=ncdf(((255-th)/3-.5-mu)/sd);return s/THR.length;};
  function draw(){const cp=root.clientWidth<600,Wd=cp?420:760,Hd=cp?250:260,Lm=40,Rm=24,T=12,Bm=34,TM=120;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';
    const X=t=>Lm+t/TM*(Wd-Lm-Rm),Y=v=>T+(1-v)*(Hd-T-Bm),tt=c.v('t');c.out('t',tt+' s');
    for(const v of [0,.1,.5,1]){svgEl('line',{x1:Lm,x2:Wd-Rm,y1:Y(v),y2:Y(v),class:v===0?'ax':'gl'},svg);svgText(svg,Lm-6,Y(v)+4,Math.round(v*100)+'%',{'text-anchor':'end','font-size':11});}
    for(const t of [0,20,40,60,80,100,120])svgText(svg,X(t),Hd-14,t+' s',{'text-anchor':'middle','font-size':11});
    svgText(svg,Wd-Rm,T+10,'share of pixels that still look wet (solid) and still shine (dashed)',{'text-anchor':'end','font-size':11.5,class:'lab'});
    for(const M of MS){if(!on.has(M.n))continue;let d='',ds='';for(let t=0;t<=TM;t+=.5){d+=(t?'L':'M')+X(t).toFixed(1)+','+Y(frac(M.m,t)).toFixed(1);ds+=(t?'L':'M')+X(t).toFixed(1)+','+Y(frac(M.m,t,200)).toFixed(1);}
      svgEl('path',{d:ds,fill:'none',stroke:M.col,'stroke-width':1.2,'stroke-dasharray':'3 3','stroke-opacity':.8},svg);svgEl('path',{d,fill:'none',stroke:M.col,'stroke-width':2.2},svg);
      const mm=M.meas[ex];if(mm){svgEl('circle',{cx:X(mm[0]),cy:Y(.5),r:4.5,fill:'none',stroke:M.col,'stroke-width':2},svg);svgEl('circle',{cx:X(mm[1]),cy:Y(.1),r:4.5,fill:'none',stroke:M.col,'stroke-width':2},svg);}}
    svgEl('line',{x1:X(tt),x2:X(tt),y1:T,y2:Hd-Bm,stroke:'#ffb86b','stroke-width':1.5},svg);
    // strip per material at time tt (expected wetness through each pixel's threshold)
    const u=px.u32,Wc=px.W,Hc=px.H,cw=Wc/MS.length;for(let y=0;y<Hc;y++)for(let x=0;x<Wc;x++){const mi=Math.min(MS.length-1,(x/cw)|0),M=MS[mi];const base=P32({[METAL]:MT[1],[STONE]:CO[0],[ROOF]:RF[0],[SAND]:SA[0],[WOOD]:WD[0],[GRASS]:GR[1],[DIRT]:DI[0],[CLOTH]:CL[0]}[M.m]);
      const wv=255-3*tt*60*pOf(M.m)+(hash2(x,y)-.5)*30;const th=4+bay(x,y)*9+hash2(x+9,y)*40;let col=wv>th?wetC(base):base;if(wv>200&&hash2(x,y+3)<.12)col=P32(SHEEN);if(x%Math.round(cw)===Math.round(cw)-1)col=C32('#0b1016');u[y*Wc+x]=col;}
    px.put();}
  draw();let lastCp=root.clientWidth<600;addEventListener('resize',()=>{const cp=root.clientWidth<600;if(cp!==lastCp){lastCp=cp;draw();}});return {};});

// ======================================================================
// C4 vs C5 puddles, plus FAO infiltration
// ======================================================================
function puddleTerrain(w){w.grass();const W=w.W,H=w.H;
  w.dirt((x,y)=>x>=6&&x<=44&&y>=4&&y<=60,(x,y)=>Math.abs(x-15)<=1||Math.abs(x-35)<=1);w.dips([[25,18,5],[16,44,4],[33,50,4]],DIRT,.04);
  w.cobble(50,6,92,46);w.dips([[60,16,5],[82,36,5],[72,28,3]],STONE,.035);w.ground(50,50,92,60,SAND);w.finish();}
reg('puddles',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),svg=$('svg.fao',root),c=ctl(root),ro=$('[data-ro]',root);
  const wa=RWorld(96,64,{seed:21,maxd:200}),wb=RWorld(96,64,{seed:21,maxd:200});puddleTerrain(wa);puddleTerrain(wb);wa.wind=wb.wind=0;wa.exposure(0);wb.exposure(0);
  const N=96*64,MASK=new Float32Array(N);for(let i=0;i<N;i++){const s=wa.S[i];MASK[i]=(s===DIRT||s===STONE)?clamp(wa.FH[i]/.08,0,1)*.9+.1:9;}
  let tier=3,raining=true,flood=0,fr=0;const INC=[0,.1,.3,.7,.7],RATE=[.5,2.5,7.6,25,60];
  c.seg('tier',v=>{tier=+v;raining=true;sb.textContent='Stop the rain';fao();});const sb=c.btn('stop',b=>{raining=!raining;b.textContent=raining?'Stop the rain':'Start the rain';});
  const SOILS=[['Clay',1,5],['Clay loam',5,10],['Loam',10,20],['Sandy loam',20,30],['Sand',30,60]];
  function fao(){const Wd=300,Hd=150,Lm=72,Rm=26;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';const X=v=>Lm+(Math.log10(v)-Math.log10(.5))/(Math.log10(60)-Math.log10(.5))*(Wd-Lm-Rm);
    for(const v of [1,10,50])svgText(svg,X(v),Hd-4,v+' mm/h',{'text-anchor':'middle','font-size':10});const R=RATE[tier];
    SOILS.forEach(([n,a,b],k)=>{const y=8+k*22,pud=R>a;svgText(svg,Lm-5,y+12,n,{'text-anchor':'end','font-size':11,class:'lab'});
      svgEl('rect',{x:X(a),y:y+2,width:X(b)-X(a),height:14,rx:2,fill:pud?'#6c9cc4':'#2a3d52',stroke:pud?'#a9d2f0':'none'},svg);if(n==='Sand')svgText(svg,X(b)-4,y+13,'> 30',{'text-anchor':'end','font-size':10,class:'lab'});});
    svgEl('line',{x1:X(R),x2:X(R),y1:2,y2:Hd-16,stroke:'#ffb86b','stroke-width':2},svg);svgText(svg,X(R)+(R>20?-4:4),Hd-24,(tier===4?'> 50':tier===0?'0.5':R)+' mm/h',{'text-anchor':R>20?'end':'start','font-size':10.5,fill:'#ffb86b'});}
  fao();
  return {tick(dt){fr++;const I=raining?TIERS[tier][1]:0,sp=c.v('fast')?4:1;wa.I=wb.I=I;
    flood=clamp(flood+(raining?INC[tier]*.05:-.05*.05)*dt*sp,0,1.2);
    for(let k=0;k<sp;k++){wb.t+=1/60;wb.simStep();}wb.updateDrops(dt);wb.updateParts(dt);
    wa.t+=dt;for(let k=0;k<sp;k++)wa.simStep();wa.updateDrops(dt);wa.updateParts(dt);wa.WAT.fill(0);
    // C4 render: depth mask against the flood level
    wa.render(A.u32,{puddles:false});const u=A.u32;let c4=0;for(let i=0;i<N;i++){if(MASK[i]>2||wa.SPR[i])continue;const wv=(flood-MASK[i])/.4;if(wv>bay(i%96,(i/96)|0)/16*.5){c4++;const edge=wv<.15;u[i]=tintC(P32(edge?PU[2]:PU[0]),tintK(I));}}A.put();
    wb.render(B.u32);B.put();
    if(fr%15===0){const [d,s]=wb.puddlePx();setHudK(root,'a',`flood ${flood.toFixed(2)} · ${c4} px`);setHudK(root,'b',`dirt ${d} · stone ${s} px`);
      ro.innerHTML=`${raining?TIERS[tier][0]:'Rain stopped'}: <b>C4</b> rises ${raining?INC[tier]:'−0.05'} per unit time, the same everywhere; <b>C5</b> holds ${d} dirt and ${s} stone puddle pixels. Soils whose infiltration the ${TIERS[tier][0].toLowerCase()} rate beats: <b>${SOILS.filter(s2=>RATE[tier]>s2[1]).map(s2=>s2[0]).join(', ')||'none'}</b>.`;}}};});

// ======================================================================
// C6: wet and muddy footprints
// ======================================================================
reg('prints',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root);
  const w=RWorld(W,H,{seed:33,maxd:200});w.grass();w.dirt((x,y)=>x<=58&&y>=10&&y<=70,(x,y)=>Math.abs(x-22)<=1||Math.abs(x-40)<=1);w.dips([[14,26,6],[30,58,5]],DIRT,.04);
  w.cobble(62,24,127,71);w.awning(64,4,124,18);w.finish();w.wind=0;w.exposure(0);
  const soak=()=>{for(let i=0;i<w.NP;i++){if(w.S[i]===DIRT){w.WET[i]=255;}}for(const [px2,py,r] of [[14,26,6],[30,58,5]])for(let y=py-r;y<=py+r;y++)for(let x=px2-r;x<=px2+r;x++){const i=y*W+x;if(w.S[i]===DIRT&&Math.hypot(x-px2,(y-py)*1.3)<r)w.WAT[i]=.3;}};soak();
  const p=w.newChar(14,36,PMAP);const WP=[[14,34],[22,50],[44,44],[80,40],[112,52],[96,64],[70,58],[40,30]];let wp=0,tgt=null,fr=0;
  pointer(cv,([x,y],k)=>{if(k==='down'){tgt=[x,y];}});c.btn('soak',soak);
  const pot=[];for(const [px2,py,r] of [[14,26,6],[30,58,5]])for(let y=py-r;y<=py+r;y++)for(let x=px2-r;x<=px2+r;x++){const i=y*W+x;if(w.S[i]===DIRT&&Math.hypot(x-px2,(y-py)*1.3)<r*.8)pot.push(i);}
  return {tick(dt){w.t+=dt;fr++;w.I=c.v('rain')?.3:0;for(const i of pot)w.WAT[i]=Math.max(w.WAT[i],.22);w.simStep();w.updateDrops(dt);w.updateParts(dt);
    if(tgt){if(w.walkTo(p,tgt[0],tgt[1],36,dt))tgt=null;}else if(c.v('auto')){if(w.walkTo(p,WP[wp][0],WP[wp][1],36,dt))wp=(wp+1)%WP.length;}else{p.moving=false;p.anim=0;}
    w.soak(p,dt);w.render(px.u32);px.put();
    if(fr%10===0){setHud(root,`shoe ${p.shoe.toFixed(2)}${p.inMud?' · in mud ×0.82':''}`);ro.innerHTML=`Steps <b>${p.steps||0}</b> · wet prints stamped <b>${p.prints||0}</b> · mud steps that sank the floor <b>${p.mud||0}</b>. Each print on the dry floor stamps <code>180·shoe + 60</code>, then the shoe keeps ×0.8.`;}}};});
