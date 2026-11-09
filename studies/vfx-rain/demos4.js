// ======================================================================
// F4 + F5: rain rules on a tactical grid
// ======================================================================
reg('rules',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root),chips=$('[data-rules]',root);
  const MAP=["FFggggHH","FFgggpHH","ggggppgg","gppgggFg","ggpggggF","wwgggFFF"],TW=8,TH=6,TS=16;
  const T=(x,y)=>MAP[y][x];const active=()=>new Set($$('button.on',chips).map(b=>b.dataset.r));
  chips.addEventListener('click',e=>{const b=e.target.closest('button');if(b)b.classList.toggle('on');});
  let unit='foot',ux=1,uy=3,zap=null,zt=0,fr=0,t=0;const enemy={x:5,y:1};
  c.seg('unit',v=>unit=v);
  pointer(cv,([x,y],k)=>{if(k!=='down')return;const tx=(x/TS)|0,ty=(y/TS)|0;if(tx<0||ty<0||tx>=TW||ty>=TH||T(tx,ty)==='w'||(tx===enemy.x&&ty===enemy.y))return;ux=tx;uy=ty;});
  c.btn('zap',()=>{const A=active();if(!A.has('dos')||!c.v('rain')){zap=[];zt=1.2;return;}
    const seen=new Set(),q=[[5,1]];const out=[];while(q.length&&out.length<6){const [x,y]=q.shift();const k=x+','+y;if(seen.has(k))continue;seen.add(k);if(x<0||y<0||x>=TW||y>=TH||T(x,y)!=='p')continue;out.push([x,y]);q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}zap=out;zt=1.6;});
  function cost(x,y,A,rain){const tt=T(x,y);if(tt==='w')return 99;if(tt==='H')return 1;let base=tt==='F'?2:1;
    if(rain&&A.has('aw')&&unit==='tank'&&(tt==='g'||tt==='p'||tt==='F'))base+=1;
    if(rain&&A.has('fe')&&unit!=='tank'&&(tt==='g'||tt==='p'))base=Math.max(base,unit==='horse'?3:2);return base;}
  function reach(A,rain){const D=new Array(TW*TH).fill(99);D[uy*TW+ux]=0;const q=[[ux,uy]];while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=TW||ny>=TH)continue;if(nx===enemy.x&&ny===enemy.y)continue;const nd=D[y*TW+x]+cost(nx,ny,A,rain);if(nd<=6&&nd<D[ny*TW+nx]){D[ny*TW+nx]=nd;q.push([nx,ny]);}}}return D;}
  const GRc=[P32(GR[0]),P32(GR[1]),P32(GR[2])],FOc=[P32(CN[0]),P32(CN[1]),P32(CN[2]),P32(CN[3])],HOc=[P32(RF[0]),P32(RF[1]),P32(RF[2])];
  return {tick(dt){t+=dt;fr++;const A=active(),rain=c.v('rain'),u=px.u32,k=rain?tintK(.75):0;const D=reach(A,rain),Dd=reach(A,false);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const tx=(x/TS)|0,ty=(y/TS)|0,lx=x%TS,ly=y%TS,tt=T(tx,ty),h=hash2(x,y);let col;
      if(tt==='w'){col=P32(WA[0]);if(rain&&hash2(x,y+((t*6)|0)*97)<.03)col=P32(WA[3]);}
      else if(tt==='H')col=HOc[(ly%4===3)?1:(lx===0||ly===0||lx===15||ly===15)?2:0];
      else if(tt==='F'){const dx=(lx-8)/7,dy=(ly-7)/6;col=dx*dx+dy*dy<1?FOc[dx+dy<-.4?3:dx+dy<.3?0:1]:GRc[0];}
      else{col=GRc[h<.3?0:h<.7?1:2];if(tt==='p'&&rain){const dx=(lx-8)/6,dy=(ly-8)/4;if(dx*dx+dy*dy<1)col=P32(hash2(x,y+((t*5)|0)*31)<.05?PU[1]:PU[0]);}}
      if(rain)col=tintC(col,k);if(D[ty*TW+tx]<=6&&!(tx===ux&&ty===uy))col=mix32(col,C32('#4fa3e8'),.38);
      if(lx===0||ly===0)col=mix32(col,C32('#0b1016'),.35);u[y*W+x]=col;}
    if(zap&&zt>0){zt-=dt;for(const [zx,zy] of zap)for(let k2=0;k2<10;k2++){const x=zx*TS+ri(TS),y=zy*TS+ri(TS);u[y*W+x]=k2&1?P32(BOLT[0]):C32('#fff3a0');}}
    // vision ring (AW -1 in rain) and Hunt hearing ring around the enemy
    const vis=3-(rain&&A.has('aw')?1:0),hear=4*(rain&&A.has('hunt')?(1-.5*.75):1);
    const ring=(cx,cy,r,col,dash)=>{for(let a=0;a<120;a++){if(dash&&(a>>2)&1)continue;const xx=Math.round(cx+Math.cos(a/120*6.283)*r),yy=Math.round(cy+Math.sin(a/120*6.283)*r);if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=col;}};
    ring(ux*TS+8,uy*TS+8,vis*TS+8,C32('#ffb86b'),false);ring(enemy.x*TS+8,enemy.y*TS+8,hear*TS,C32('#c9a2ff'),true);
    drawSprite(u,W,H,enemy.x*TS+8,enemy.y*TS+14,{map:VMAP,wet:rain?.8:0});
    if(unit==='tank'){for(let y=-5;y<=0;y++)for(let x=-5;x<=5;x++){const xx=ux*TS+8+x,yy=uy*TS+13+y;u[yy*W+xx]=P32(y===-5||Math.abs(x)===5?MT[2]:y===-1?MT[1]:MT[0]);}for(let x=0;x<5;x++)u[(uy*TS+9)*W+ux*TS+8+x]=P32(MT[2]);}
    else{if(unit==='horse')for(let y=-2;y<=0;y++)for(let x=-6;x<=6;x++){if(Math.abs(x)>5&&y<0)continue;u[(uy*TS+14+y)*W+ux*TS+8+x]=P32(y===0&&Math.abs(x)%4===2?WD[2]:WD[1]);}
      drawSprite(u,W,H,ux*TS+8,uy*TS+(unit==='horse'?11:14),{wet:rain?.8:0});}
    if(rain)for(let k2=0;k2<26;k2++){const x=ri(W),y=ri(H);for(let s=0;s<3;s++)if(y+s<H&&x-(s>>1)>=0)u[(y+s)*W+x-(s>>1)]=P32(RNN);}
    px.put();
    if(fr%10===0){const n=D.filter(v=>v<=6).length-1,nd=Dd.filter(v=>v<=6).length-1,heard=Math.hypot(ux-enemy.x,uy-enemy.y)<=hear;const zz=zap&&zap.length?zap.length:0;
      setHud(root,`${n} tiles reachable${rain?` (dry: ${nd})`:''} · vision ${vis} · ${heard?'enemy hears you':'unheard'}`);
      const L=[];if(A.has('pkm'))L.push(`<b>Pokémon</b>: Water ×${rain?1.5:1}, Fire ×${rain?.5:1}`);if(A.has('fft'))L.push(`<b>FFT</b>: Lightning ×${rain?'5/4':1}, Fire ×${rain?'3/4':1}`);
      if(A.has('dos'))L.push(`<b>DOS2</b>: ${rain?'units are Wet':'dry'}; ${zz?`shock spread through ${zz} puddle tile${zz>1?'s':''}, the enemy in it is <b>Stunned</b>`:rain?'cast lightning on the puddle':'no puddles without rain'}`);
      if(A.has('aw'))L.push(`<b>Advance Wars</b>: ${rain?'vehicles +1 on plains and woods; vision −1':'no change'}`);if(A.has('fe'))L.push(`<b>Fire Emblem 7</b>: ${rain?'plains cost 2 on foot, 3 mounted; forest and indoors exempt':'no change'}`);
      if(A.has('hunt'))L.push(`<b>Hunt</b>: ${rain?'hearing radius 4 → 2.5 tiles':'hearing 4 tiles'}`);ro.innerHTML=L.join('<br>')||'Switch a rule set on.';}}};});

// ======================================================================
// F6: villagers shelter, frogs, butterflies, the barrel
// ======================================================================
reg('npc',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root);
  const w=RWorld(W,H,{seed:77,maxd:500});w.grass();w.cobble(40,30,124,70);w.awning(46,8,112,18);w.pond(140,78,22,12,false);w.tree(18,44);w.barrelAt(116,14);w.finish();w.wind=.2;w.exposure(.2);w.coverDrops=true;
  const vs=[w.newChar(60,50,VMAP),w.newChar(96,60,VMAP),w.newChar(80,40,PMAP)];vs[2].umbOwner=true;
  const WPS=[[[60,50],[100,44],[110,64],[56,66]],[[96,60],[50,40],[70,62],[120,52]],[[80,40],[30,60],[118,40],[80,68]]];const wi=[0,0,0],SH=[[64,25],[80,25],[96,25]];
  const bf=[0,1,2].map(k=>({x:20+k*40,y:30+k*12,ph:k*2,vx:0,vy:0}));let cyc=0,fr=0,thr=.42;
  c.seg('thr',v=>thr=+v);const io=()=>c.out('int',(c.v('int')/100).toFixed(2));c.on('int',()=>{c.el('cycle').checked=false;io();});io();
  return {tick(dt){w.t+=dt;fr++;if(c.v('cycle')){cyc+=dt;const ph=(cyc%40)/40,I=ph<.15?0:ph<.55?(ph-.15)/.4:ph<.75?1-(ph-.55)/.2:0;c.el('int').value=Math.round(I*100);io();}
    w.I=c.v('int')/100;w.sunny=w.I<.02;w.simStep();w.updateDrops(dt);w.updateParts(dt);if(w.barrel)w.barrel.fill=Math.min(1,w.barrel.fill+.0036*w.I*30*dt);
    vs.forEach((v,k)=>{const umbr=v.umbOwner&&w.I>.02;v.umb=umbr;if(w.I>thr&&!umbr){w.walkTo(v,SH[k][0],SH[k][1],24,dt);if(!v.moving)v.dir='down';}else if(w.walkTo(v,WPS[k][wi[k]][0],WPS[k][wi[k]][1],14,dt))wi[k]=(wi[k]+1)%4;w.soak(v,dt);});
    const want=w.I>.25?3:(w.I>.02?1:0);if(w.frogs.length<want&&rnd()<dt*.8)w.frogs.push({x:118+rnd()*14,y:70+rnd()*8,t:1,hop:0});if(w.frogs.length>want&&rnd()<dt*.3)w.frogs.shift();
    for(const f of w.frogs){f.t-=dt;if(f.hop>0){f.hop-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;}else if(f.t<=0){f.t=1+rnd()*3;const a=rnd()*6.283;f.vx=Math.cos(a)*30;f.vy=Math.sin(a)*18;f.hop=.3;const nx=f.x+f.vx*.3,ny=f.y+f.vy*.3,ni=(ny|0)*W+(nx|0);if(nx<4||ny<4||nx>W-4||ny>H-4||w.S[ni]===WATER||w.Cm[ni])f.hop=0;}}
    const out=w.I<.02;const extra=[];for(const b of bf){b.ph+=dt*9;if(out){b.vx+=(rnd()-.5)*60*dt;b.vy+=(rnd()-.5)*60*dt;b.vx*=.97;b.vy*=.97;b.x=clamp(b.x+b.vx*dt,4,W-4);b.y=clamp(b.y+b.vy*dt,10,H-6);}
      else{b.x+=(18-b.x)*dt*.8;b.y+=(30-b.y)*dt*.8;}const hide=!out&&Math.hypot(b.x-18,b.y-30)<6;if(!hide)extra.push([b.y+8,()=>{const x=b.x|0,y=b.y|0,o=Math.sin(b.ph)>0;w.putp(x,y,BFLY[0]);if(o){w.putp(x-1,y-1,BFLY[0]);w.putp(x+1,y-1,BFLY[0]);}else{w.putp(x-1,y,BFLY[1]);w.putp(x+1,y,BFLY[1]);}}]);}
    w.render(px.u32,{extra});px.put();
    if(fr%10===0){const shelt=vs.filter(v=>v.y<30).length;setHud(root,`I ${w.I.toFixed(2)} · ${tierOf(w.I)} · threshold ${thr}`);
      ro.innerHTML=`Sheltering: <b>${shelt}</b> of 2 · umbrella villager ${w.I>.02?'has it open':'keeps walking'} · frogs <b>${w.frogs.length}</b> · butterflies <b>${out?'out':'hidden'}</b> · barrel <b>${Math.round(w.barrel.fill*100)} %</b>`;}}};});

// ======================================================================
// G1 + G2: haze chart, spray mist and evaporation mist
// ======================================================================
reg('fog',root=>{const svg=$('svg.fogc',root),cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root);
  const w=RWorld(W,H,{seed:88,maxd:500});w.grass();w.cobble(10,30,80,70);w.house(84,2,126,18,8);w.pond(104,58,22,12,true);w.finish();w.wind=.2;w.exposure(.2);
  let wx='storm',peak=0,fr=0,mark=0;
  const chart=()=>{const Wd=360,Hd=240,Lm=30,Rm=40,T=26,Bm=46;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';
    const X=r=>Lm+(Math.log10(r)-Math.log10(.5))/(Math.log10(100)-Math.log10(.5))*(Wd-Lm-Rm),YB=b=>T+(1-b/6)*(Hd-T-Bm),YV=v=>T+(1-v/10)*(Hd-T-Bm);
    for(const r of [.5,1,2,5,10,25,50,100]){svgEl('line',{x1:X(r),x2:X(r),y1:T,y2:Hd-Bm,class:'gl'},svg);svgText(svg,X(r),Hd-Bm+13,r,{'text-anchor':'middle','font-size':10});}
    svgText(svg,(Wd)/2,Hd-Bm+25,'rain rate R (mm/h, log)',{'text-anchor':'middle','font-size':10.5});
    for(const b of [0,2,4,6])svgText(svg,Lm-5,YB(b)+4,b,{'text-anchor':'end','font-size':10,fill:'#a9d2f0'});for(const v of [0,5,10])svgText(svg,Wd-Rm+5,YV(v)+4,v+' km',{'font-size':10,fill:'#ffb86b'});
    svgText(svg,Lm-24,T-6,'β (km⁻¹)',{'font-size':10.5,fill:'#a9d2f0'});svgText(svg,Wd-Rm+5,T-6,'vis.',{'font-size':10.5,fill:'#ffb86b'});
    let db='',dv='',first=true;for(let k=0;k<=80;k++){const r=.5*Math.pow(200,k/80),b=.312*Math.pow(r,.67),v=3.912/b;db+=(k?'L':'M')+X(r).toFixed(1)+','+YB(Math.min(6,b)).toFixed(1);if(v<=10){dv+=(first?'M':'L')+X(r).toFixed(1)+','+YV(v).toFixed(1);first=false;}}
    svgEl('path',{d:db,fill:'none',stroke:'#a9d2f0','stroke-width':2},svg);svgEl('path',{d:dv,fill:'none',stroke:'#ffb86b','stroke-width':2,'stroke-dasharray':'5 3'},svg);
    for(const [r,b,v] of [[2,.5,7.8],[5,.92,4.3],[25,2.7,1.45],[75,5.63,.69]]){svgEl('circle',{cx:X(r),cy:YB(b),r:3.5,fill:'#a9d2f0'},svg);svgText(svg,X(r)-5,YB(b)-6,b.toFixed(2),{'text-anchor':'end','font-size':9.5,fill:'#a9d2f0'});svgEl('circle',{cx:X(r),cy:YV(v),r:3,fill:'#ffb86b'},svg);svgText(svg,X(r)+5,YV(v)-5,v+' km',{'font-size':9.5,fill:'#ffb86b'});}
    svgText(svg,4,Hd-6,'haze α:',{'font-size':9.5,fill:'#8b9bb0'});[['2 %',2],['6 %',5],['12 %',25],['20 %',75]].forEach(([a,r])=>svgText(svg,X(r),Hd-6,a,{'text-anchor':'middle','font-size':9.5,fill:'#c9d6e4'}));
    const mr={heavy:25,storm:75,sun:.5}[wx];if(wx!=='sun')svgEl('line',{x1:X(mr),x2:X(mr),y1:T,y2:Hd-Bm,stroke:'#fff','stroke-opacity':.5,'stroke-width':1.5},svg);};
  chart();
  c.seg('wx',v=>{if(v==='sun'&&wx!=='sun'){for(let i=0;i<w.NP;i++)if(w.S[i]!==WATER)w.WET[i]=255;}wx=v;peak=0;chart();});
  const io=()=>{w.evapGain=c.v('gain');c.out('gain','×'+c.v('gain'));peak=0;};c.on('gain',io);io();
  return {tick(dt){w.t+=dt;fr++;w.I=wx==='storm'?1:wx==='heavy'?.75:0;w.sunny=wx==='sun';for(let k=0;k<2;k++)w.simStep();w.updateDrops(dt);w.updateParts(dt);
    let m=0;for(let i=0;i<w.MI.length;i++)if(w.MI[i]>m)m=w.MI[i];peak=Math.max(peak*.998,m);
    w.render(px.u32,{view:c.v('xray')?'mist':'normal'});const ha={heavy:.12,storm:.2,sun:0}[wx];if(ha&&!c.v('xray')){const hz=C32('#c9d2dc');const u=px.u32;for(let i=0;i<u.length;i++)u[i]=mix32(u[i],hz,ha);}px.put();
    if(fr%12===0){setHud(root,`${wx==='sun'?'Sun after rain':wx==='storm'?'Storm':'Heavy'} · mist peak ${peak.toFixed(2)}`);
      ro.innerHTML=wx==='sun'?`Evaporation mist gains <code>0.0011·CWET²</code> × ${c.v('gain')} per step. Peak <b>${peak.toFixed(2)}</b>; a cell draws where <code>12·m &gt; Bayer + 2</code>, so nothing shows below ~0.17. ${peak<.17?'Invisible, as in the Sandbox.':'Now visible as rising wisps.'}`:`Spray gains <code>0.05·max(0, I − 0.45)²·HARD</code> = ${(.05*Math.max(0,w.I-.45)**2).toFixed(4)} × HARD per step; HARD is 1 on stone and roofs, 0.8 on water. Peak <b>${peak.toFixed(2)}</b>; haze alpha ${Math.round(ha*100)} %.`;}}};});

// ======================================================================
// H1 + H2: overcast shift and clean streak slopes
// ======================================================================
reg('palette',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root),strip=$('[data-strip]',root);
  const w=RWorld(128,72,{seed:99,maxd:300});w.grass();w.house(6,2,58,20,10);w.cobble(64,26,124,70);w.dirt((x,y)=>x>=20&&x<=36&&y>=36);w.pond(100,10,22,8,false);w.tree(84,60);w.campfire(40,58);w.finish();w.wind=.3;w.exposure(.3);
  let mode='sbx',slope=.5,fr=0;const SH=[GR[1],DI[0],CO[0],RF[0],WL[0],WA[1],CN[1],CL[0],SKIN,COAT,FIRE[1],MT[0]];
  c.seg('mode',v=>mode=v);c.seg('slope',v=>slope=+v);const io=()=>c.out('int',(c.v('int')/100).toFixed(2));c.on('int',io);io();
  const mulOf=I=>{if(mode==='em')return I>.02?[13/16,13/16,13/16]:[1,1,1];if(mode==='sw'){const k=I<.02?0:I<.5?.2:.4;return [1-k,1-k,1-k];}const k=I<.02?0:tintK(I);return [1-k,1-.88*k,1-.6*k];};
  const D=[];for(let k=0;k<26;k++)D.push({x:rnd()*64,y:rnd()*36,ph:rnd()});
  return {tick(dt){w.t+=dt;fr++;const I=c.v('int')/100;w.I=I;w.simStep();w.updateDrops(dt);w.updateParts(dt);w.updateFire(dt);if(!w.fire.on){w.fire.on=true;w.fire.F=.6;}
    const mul=mulOf(I);w.render(A.u32,{mul});A.put();
    if(fr%10===0){strip.innerHTML=SH.map(i=>`<span style="background:${css(pack(RGB[i][0]*mul[0],RGB[i][1]*mul[1],RGB[i][2]*mul[2]))}"></span>`).join('');
      setHudK(root,'a',`multipliers ${mul.map(v=>v.toFixed(2)).join(' / ')}`);}
    const u=B.u32,Wb=B.W,Hb=B.H,g=P32(CO[2]),g2=P32(CO[1]),st=mul32(P32(CO[0]),1.08,1.08,1.12),hd=P32(SPL);
    for(let y=0;y<Hb;y++)for(let x=0;x<Wb;x++)u[y*Wb+x]=((x+((y/5|0)&1)*3)%7===0||y%5===0)?g:g2;
    for(const d of D){d.y+=dt*40;d.x+=dt*40*slope;if(d.y>Hb+8){d.y=-8;d.x=rnd()*(Wb+20)-10;}if(d.x>Wb+8)d.x-=Wb+16;
      for(let s=0;s<7;s++){const xx=Math.round(d.x-slope*s),yy=Math.round(d.y-s);if(xx>=0&&yy>=0&&xx<Wb&&yy<Hb)u[yy*Wb+xx]=s===0?hd:st;}}
    B.put();if(fr%10===0){const ang=Math.atan(slope)*180/Math.PI;const clean=[0,.25,.5,1].includes(slope);setHudK(root,'b',`${slope===0?'vertical':slope===.25?'1:4':slope===.5?'1:2':slope===1?'1:1':'0.55'} · ${ang.toFixed(1)}° · ${clean?'clean':'jaggy'}`);}}};});

// ======================================================================
// Scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#1b2735','#22405e','#3d6a94','#6c9cc4','#a9d2f0'];const RL=['Simplicity','Speed','Pixel taste','Reactivity','Readability'];const SC=['#ffb86b','#6dd4c3','#c9a2ff'];
  let sel=['F3','A2','A1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','React.','Read.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th><th data-s="cost">Cost class</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'||sortK==='cost'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#0b1016':'#dde7f1'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td><td class="cost">${s.cost}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name'||k==='cost')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-40 0 ${S+80} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#34475d':'#17212c'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#17212c'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});
