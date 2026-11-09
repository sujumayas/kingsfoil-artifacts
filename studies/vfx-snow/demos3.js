
// ======================================================================
// FIG 13: footprint decal ring buffer vs conserve-and-displace stamp
// ======================================================================
reg('footprint',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),Bp=PX(cvs[1]),Sx=PX(cvs[2]);const W=A.W,H=A.H,c=ctl(root),ro=$('.readout',root);
  const mkF=()=>{const f=Field(W,H,{seed:13});for(let i=0;i<f.N;i++)f.D[i]=44+((vnoise((i%W)/9,(i/W|0)/9)*14)|0);return f;};
  const fa=mkF(),fb=mkF();const total0=fb.D.reduce((a,b)=>a+b,0);
  const RING=32;const prints=[];let ri0=0;for(let k=0;k<RING;k++)prints.push({x:0,y:0,age:999});
  let t=0,wx=W/2,wy=H/2,dist=0,foot=0,fr=0,steer=null,drops=0;const SEC=W>>1;
  pointer(Bp.cv,([x,y],k)=>{if(k==='down'||k==='drag')steer=[x,y];});pointer(A.cv,([x,y],k)=>{if(k==='down'||k==='drag')steer=[x,y];});
  c.btn('reset',()=>{const f2=mkF();fb.D.set(f2.D);fb.P.fill(0);prints.forEach(p=>p.age=999);});
  return {tick(dt){t+=dt;fr++;let tx,ty;if(steer){tx=steer[0];ty=steer[1];}else{tx=W/2+(W*.36)*Math.sin(t*.45);ty=H/2+(H*.32)*Math.sin(t*.9);}
      const dx=tx-wx,dy=ty-wy,l=Math.hypot(dx,dy);if(l>.5){const d=(fb.D[(wy|0)*W+(wx|0)]||0),slow=1-Math.min(.55,d/170),sp=Math.min(l,22*slow*dt*(steer?1.4:1));wx+=dx/l*sp;wy+=dy/l*sp;dist+=sp;
        if(dist>4){dist=0;foot^=1;const side=foot?1:-1,horiz=Math.abs(dx)>Math.abs(dy);const fx=wx+(horiz?0:side*1.5)-1,fy=wy+(horiz?side*.8:0)-1;
          fb.stamp(fx,fy,2,2,.3,255);prints[ri0]={x:fx|0,y:fy|0,age:0};ri0=(ri0+1)&(RING-1);}}else if(steer)steer=null;
      const fall=c.v('fall');if(fall>0){fb.snowfall((fall*30)|0);drops+=(fall*30)|0;}
      fa.render(A.u32,{});const u=A.u32,plat=c.v('plat');
      for(const p of prints){p.age++;let vis;if(plat){vis=p.age<32;}else vis=p.age<40||(p.age<=56&&(p.age&1));
        if(!vis)continue;const a=plat?(p.age<16?1:1-(p.age-16)*2/31):1;
        for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const X=p.x+xx,Y=p.y+yy;if(X>=0&&Y>=0&&X<W&&Y<H)u[Y*W+X]=mix32(u[Y*W+X],COL.DEEP,a*.9);}}
      drawKid(u,W,H,wx,wy,0,(t*8)|0);A.put();
      fb.render(Bp.u32,{});drawKid(Bp.u32,W,H,wx,wy,Math.min(4,((fb.D[(wy|0)*W+(wx|0)]||0)/22)|0),(t*8)|0);
      for(let y=0;y<H;y+=2)Bp.u32[y*W+SEC]=mix32(Bp.u32[y*W+SEC],C32('#ffb86b'),.6);Bp.put();
      // cross-section along the dashed column
      const su=Sx.u32,SW=Sx.W,SH=Sx.H;su.fill(C32('#0a1022'));for(let y=0;y<H;y++){const d=fb.D[y*W+SEC],h=Math.round(d/90*(SH-2));const x0=Math.round(y/H*SW),x1=Math.round((y+1)/H*SW);
        for(let x=x0;x<x1;x++)for(let k=0;k<h;k++)su[(SH-1-k)*SW+x]=k===h-1?COL.HI:(fb.P[y*W+SEC]>110?COL.PACK:COL.SH);}
      const base=Math.round(44/90*(SH-2));for(let x=0;x<SW;x+=3)su[(SH-1-base)*SW+x]=C32('#ffb86b');Sx.put();
      if(fr%10===0){const tot=fb.D.reduce((a,b)=>a+b,0);ro.innerHTML=`decals alive: <b>${prints.filter(p=>p.age<(plat?32:57)).length}</b> of ${RING} slots (oldest overwritten) · stamp field total: <b>${tot}</b> u vs ${total0} u at start${fall?` + ${drops} snowfall picks`:''} (${fall?'snow is refilling':'conserved, minus edge clipping'})`;}}};});

// ======================================================================
// FIG 14: trail render target with slow refill (Batman-style subtract)
// ======================================================================
reg('trail',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]);const W=A.W,H=A.H,c=ctl(root),ro=$('.readout',root);
  const f=Field(W,H,{seed:17});const T=new Uint8Array(W*H);let t=0,acc=0,view='ground',steer=null;let wx=W/2,wy=H/2;
  c.seg('view',v=>view=v);c.btn('clear',()=>T.fill(0));
  pointer(A.cv,([x,y],k)=>{if(k==='down'||k==='drag')steer=[x,y];if(k==='up')steer=null;});
  const blob=(x,y)=>{for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){const X=(x|0)+xx,Y=(y|0)+yy;if(X<0||Y<0||X>=W||Y>=H)continue;const r=xx*xx+yy*yy;if(r>5)continue;const i=Y*W+X;T[i]=Math.min(255,T[i]+(r<2?120:50));}};
  const upd=()=>{const amt=c.v('amt'),iv=c.v('iv')/100;c.out('amt',amt+'/255');c.out('iv',iv.toFixed(2)+' s');
    ro.innerHTML=`a full-depth print (255) refills in <b>${(255/amt*iv).toFixed(1)} s</b> · report example: 1/255 every 0.5 s ≈ 128 s`;};c.on('amt',upd);c.on('iv',upd);upd();
  return {tick(dt){t+=dt;let tx,ty;if(steer){tx=steer[0];ty=steer[1];}else{tx=W/2+W*.34*Math.cos(t*.5);ty=H/2+H*.3*Math.sin(t*.5)*Math.cos(t*.23);}
      const dx=tx-wx,dy=ty-wy,l=Math.hypot(dx,dy);if(l>.5){const sp=Math.min(l,26*dt*(steer?1.6:1));wx+=dx/l*sp;wy+=dy/l*sp;}blob(wx,wy+1);
      const iv=c.v('iv')/100,amt=c.v('amt');acc+=dt;while(acc>=iv){acc-=iv;for(let i=0;i<W*H;i++)T[i]=T[i]>amt?T[i]-amt:0;}
      const u=A.u32;
      if(view==='map'){for(let i=0;i<W*H;i++){const v=T[i];u[i]=pack(v,v*.25,v*.25);} }
      else{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,v=T[i];const thr=bay(x,y)*6+20;let col;
        if(v>200)col=wetC(COL.DIRT);else if(v>110)col=bay(x,y)*10<(v-110)*1.6?wetC(COL.DIRT):COL.PSH;else if(v>thr)col=COL.PACK;else{const n=hash2(x,y);col=n<.08?COL.MID:n>.97?COL.HI:COL.BASE;}
        u[i]=col;}}
      drawKid(u,W,H,wx,wy+1,0,(t*8)|0);A.put();}};});

// ======================================================================
// FIG 15: sinking and slowdown: depth -> speed for several models
// ======================================================================
reg('sink',root=>{const svg=$('svg',root),cv=$('canvas',root),px=PX(cv),c=ctl(root),ro=$('.readout',root);
  const Wd=640,Hd=300,L=48,R=16,T=16,B=48;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);
  const X=d=>L+d/200*(Wd-L-R),Y=s=>T+(1-s/100)*(Hd-T-B);
  const sandbox=d=>100*(1-Math.min(.55,d/170));
  const rim=p=>p<3?100:p<25?100:p<50?76:p<75?62:52;                // RimWorld bands on 0-100 % depth
  const pk=p=>p<25?100:p<50?100:p<75?50:25;                        // Pokémon tiers (equal-width placement is illustrative)
  const prop=p=>p<25?100:p<50?75:p<75?50:37.5;                      // our proposal 1.0/0.75/0.5/0.25-0.5 (midpoint)
  const pct=d=>d/2;                                                // illustrative mapping: 200 u = 100 %
  const g=svgEl('g',{},svg);
  for(let s=0;s<=100;s+=25){svgEl('line',{x1:L,x2:Wd-R,y1:Y(s),y2:Y(s),class:'gl'},g);svgText(g,L-6,Y(s)+4,s+'%',{'text-anchor':'end'});}
  for(let d=0;d<=200;d+=25){svgEl('line',{x1:X(d),x2:X(d),y1:T,y2:Hd-B,class:'gl'},g);svgText(g,X(d),Hd-B+16,d,{'text-anchor':'middle'});}
  svgText(g,(L+Wd-R)/2,Hd-10,'depth in Sandbox units (top axis mapping 200 u = 100 % depth is illustrative)',{'text-anchor':'middle'});
  const series=[['Sandbox: 1 − min(0.55, d/170)',d=>sandbox(d),'#8fd3ff',''],['RimWorld bands',d=>rim(pct(d)),'#ffb86b',''],['Pokémon Gen IV tiers',d=>pk(pct(d)),'#e9a0d6','5 4'],['Our proposal (midpoint)',d=>prop(pct(d)),'#9fe3b5','2 3']];
  series.forEach(([nm,fn,col,dash])=>{let p='';for(let d=0;d<=200;d+=1)p+=(d?'L':'M')+X(d).toFixed(1)+','+Y(fn(d)).toFixed(1);svgEl('path',{d:p,fill:'none',stroke:col,'stroke-width':2.2,'stroke-dasharray':dash},g);});
  const leg=$('.radar-keys',root);leg.innerHTML=series.map(s=>`<span><i style="background:${s[2]}"></i>${s[0]}</span>`).join('');
  const mk=svgEl('line',{y1:T,y2:Hd-B,stroke:'#f6f9ff','stroke-width':1.5,'stroke-dasharray':'3 3'},svg);const dots=series.map(s=>svgEl('circle',{r:4.5,fill:s[2],stroke:'#0b1020','stroke-width':1.5},svg));
  const hit=svgEl('rect',{x:L,y:T,width:Wd-L-R,height:Hd-T-B,fill:'transparent',style:'cursor:ew-resize'},svg);
  const set=d=>{d=clamp(Math.round(d),0,200);c.el('d').value=d;upd();};
  let drag=false;const fromEv=e=>{const r=svg.getBoundingClientRect();return ((e.clientX-r.left)/r.width*Wd-L)/(Wd-L-R)*200;};
  hit.addEventListener('pointerdown',e=>{drag=true;hit.setPointerCapture(e.pointerId);set(fromEv(e));});hit.addEventListener('pointermove',e=>{if(drag)set(fromEv(e));});hit.addEventListener('pointerup',()=>drag=false);
  let walkT=0;
  function upd(){const d=c.v('d');c.out('d',d+' u');mk.setAttribute('x1',X(d));mk.setAttribute('x2',X(d));series.forEach((s,i)=>{dots[i].setAttribute('cx',X(d));dots[i].setAttribute('cy',Y(s[1](d)));});
    const p=pct(d),band=p<25?(p<3?'below dusting':'dusting'):p<50?'thin':p<75?'medium':'thick';const tier=p<25?'minimal':p<50?'moderate (no running)':p<75?'heavy (×½)':'maximum (×¼)';
    ro.innerHTML=`Sandbox: speed <b>${sandbox(d).toFixed(0)} %</b>, sink <b>${Math.min(4,Math.floor(d/22))} px</b> · RimWorld (${band}): <b>${rim(p)} %</b> · Pokémon tier: <b>${tier}</b> · proposal: sink <b>${[0,2,4,6][p<25?0:p<50?1:p<75?2:3]} px</b>`;}
  c.on('d',upd);upd();
  return {tick(dt){walkT+=dt;const d=c.v('d'),W=px.W,H=px.H,u=px.u32;const sink=Math.min(4,Math.floor(d/22));
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const thr=bay(x,y)*.55+hash2(x,y)*2.5+.5;u[y*W+x]=d>thr?(y>H-6?COL.BASE:(hash2(x+3,y)<.06?COL.MID:COL.BASE)):COL.GR_A;}
      const sp=sandbox(d)/100;const x=((walkT*10*sp)%(W+10))-5;drawKid(u,W,H,x,H-6,sink,(walkT*8*sp)|0);
      for(let k=1;k<6;k++){const fx=Math.round(x-k*4);if(fx<1||fx>=W-1)continue;const fy=H-5+(k&1);if(d>2)u[fy*W+fx]=COL.PSH;}
      px.put();}};});

// ======================================================================
// FIG 16: worn paths from many walkers (per-tile wear byte, 1 Hz regrow)
// ======================================================================
reg('paths',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);const TW=W>>1,TH=H>>1,wear=new Uint8Array(TW*TH);
  const POI=[[8,7,'inn'],[38,6,'smithy'],[24,20,'well'],[6,22,'gate'],[42,22,'market']];
  const ag=[];const mkA=()=>{const p=POI[ri(POI.length)];return {x:p[0]+.5,y:p[1]+.5,t:ri(POI.length),wait:rnd()*2,c:[C32('#ffb86b'),C32('#8fd3ff'),C32('#e9a0d6'),C32('#9fe3b5')][ri(4)]};};
  let acc=0,view='snow',days=0;c.seg('view',v=>view=v);c.btn('clear',()=>wear.fill(0));
  return {tick(dt){const n=c.v('n'),snow=c.v('snow')/100,sp=c.v('sp');c.out('n',n);c.out('snow',snow.toFixed(2));c.out('sp',sp+'×');
      while(ag.length<n)ag.push(mkA());ag.length=n;const step=dt*sp;
      for(const a of ag){if(a.wait>0){a.wait-=step;continue;}const p=POI[a.t];const dx=p[0]+.5-a.x,dy=p[1]+.5-a.y,l=Math.hypot(dx,dy);
        if(l<.6){a.wait=1+rnd()*3;a.t=ri(POI.length);continue;}const jx=(rnd()-.5)*.9,jy=(rnd()-.5)*.9;a.x+=(dx/l+jx)*step*4;a.y+=(dy/l+jy)*step*4;
        const tx=a.x|0,ty=a.y|0;if(tx>=0&&ty>=0&&tx<TW&&ty<TH){if(rnd()<step*6){const i=ty*TW+tx;wear[i]=Math.min(255,wear[i]+12);}}}
      acc+=step;while(acc>=1){acc--;days++;const dec=Math.round(14*snow);for(let i=0;i<wear.length;i++)wear[i]=wear[i]>dec?wear[i]-dec:0;}
      const u=px.u32;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const w=wear[(y>>1)*TW+(x>>1)];let col;
        if(view==='heat')col=HEAT[w];else{const b=bay(x,y)*4;if(w>150+b)col=wetC(COL.DIRT);else if(w>60+b)col=COL.PSH;else if(w>25+b)col=COL.PACK;else col=hash2(x,y)<.06?COL.MID:COL.BASE;}
        u[y*W+x]=col;}
      for(const p of POI){for(let y=p[1]*2-2;y<p[1]*2+2;y++)for(let x=p[0]*2-3;x<p[0]*2+3;x++)if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=y<p[1]*2-1?COL.ROOF_A:COL.WALL_A;}
      for(const a of ag){const x=(a.x*2)|0,y=(a.y*2)|0;if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=a.c;}
      px.put();setHud(root,`${n} walkers · wear: 1 byte per tile · regrow ticks ${days}`);}};});

// ======================================================================
// FIG 17: degree-day calculator + RimWorld curve
// ======================================================================
reg('ddf',root=>{const svgs=$$('svg',root),c=ctl(root),ro=$('.readout',root);
  function chart(svg,xMax,yMax,xl,yl,draw){const Wd=420,Hd=240,L=46,R=12,T=12,B=40;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';
    const X=v=>L+v/xMax*(Wd-L-R),Y=v=>T+(1-v/yMax)*(Hd-T-B);
    for(let k=0;k<=4;k++){const v=yMax*k/4;svgEl('line',{x1:L,x2:Wd-R,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-6,Y(v)+4,+v.toFixed(1),{'text-anchor':'end'});}
    for(let k=0;k<=5;k++){const v=xMax*k/5;svgText(svg,X(v),Hd-B+16,+v.toFixed(0),{'text-anchor':'middle'});}
    svgText(svg,(L+Wd-R)/2,Hd-6,xl,{'text-anchor':'middle'});svgText(svg,12,T+(Hd-T-B)/2,yl,{'text-anchor':'middle',transform:`rotate(-90 12 ${T+(Hd-T-B)/2})`});
    draw(svg,X,Y);}
  function upd(){const T=c.v('t'),ddf=c.v('ddf'),mmu=c.v('mmu'),day=c.v('day'),cover=c.v('cover');
    c.out('t',T+' °C');c.out('ddf',ddf.toFixed(1)+' mm/°C/day');c.out('mmu',mmu+' mm');c.out('day',day+' min');c.out('cover',cover+' u');
    const melt=ddf*Math.max(0,T),u=melt/mmu,ups=u/(day*60),field=ups*57600,picks=field/10,days=u>0?cover/u:Infinity,hrs=days*day/60;
    ro.innerHTML=`M = DDF·max(0, T − 0) = <b>${melt.toFixed(1)} mm/day</b> = ${u.toFixed(2)} u per game day · ${ups.toFixed(4)} u/s per cell · whole 320×180 field ≈ <b>${field.toFixed(0)}</b> decrements/s ≈ <b>${picks.toFixed(0)} picks per 10 Hz tick</b> · ${cover} u cover lasts <b>${isFinite(days)?days.toFixed(1)+' game days ≈ '+hrs.toFixed(1)+' real hours':'forever (no melt)'}</b>`;
    chart(svgs[0],15,90,'air temperature T (°C)','melt (mm/day)',(s,X,Y)=>{
      svgEl('rect',{x:X(0),y:Y(6*15),width:X(15)-X(0),height:Y(2*15)-Y(6*15),fill:'#8fd3ff',opacity:.0},s);
      // typical band 2..6
      let band='M'+X(0)+','+Y(0);for(let t=0;t<=15;t+=.5)band+='L'+X(t)+','+Y(Math.min(90,6*t));for(let t=15;t>=0;t-=.5)band+='L'+X(t)+','+Y(Math.min(90,2*t));
      svgEl('path',{d:band+'Z',fill:'#8fd3ff',opacity:.14},s);
      svgEl('path',{d:`M${X(0)},${Y(0)}L${X(15)},${Y(Math.min(90,ddf*15))}`,stroke:'#ffb86b','stroke-width':2.4,fill:'none'},s);
      svgEl('path',{d:`M${X(0)},${Y(0)}L${X(15)},${Y(Math.min(90,10*15))}`,stroke:'#e9a0d6','stroke-width':1.6,'stroke-dasharray':'5 4',fill:'none'},s);
      svgEl('circle',{cx:X(T),cy:Y(Math.min(90,melt)),r:5,fill:'#ffb86b',stroke:'#0b1020','stroke-width':1.5},s);
      svgText(s,X(1),Y(84),'shaded: typical snow DDF 2–6',{class:'lab','font-size':11.5});
      svgText(s,X(5.6),Y(62),'Cordonnier 10 mm/°C/day',{fill:'#e9a0d6','font-size':11.5});});
    chart(svgs[1],20,12,'temperature T (°C)','% of depth per tick',(s,X,Y)=>{let p='';for(let t=0;t<=20;t+=.25){const v=t<10?.058*t*t:.58*t;p+=(t?'L':'M')+X(t)+','+Y(v);}
      svgEl('path',{d:p,stroke:'#9fe3b5','stroke-width':2.4,fill:'none'},s);svgEl('line',{x1:X(10),x2:X(10),y1:Y(0),y2:Y(12),stroke:'#33426a','stroke-dasharray':'3 3'},s);
      svgText(s,X(10)+4,Y(11),'both rules give 5.8 at 10 °C',{class:'lab','font-size':11.5});svgText(s,X(1),Y(3.2),'0.058 %·T²',{fill:'#9fe3b5','font-size':11.5});svgText(s,X(13.5),Y(6.2),'0.58 %·T',{fill:'#9fe3b5','font-size':11.5});
      const tt=clamp(T,0,20);svgEl('circle',{cx:X(tt),cy:Y(tt<10?.058*tt*tt:.58*tt),r:5,fill:'#9fe3b5',stroke:'#0b1020','stroke-width':1.5},s);});}
  ['t','ddf','mmu','day','cover'].forEach(k=>c.on(k,upd));upd();return {};});

// ======================================================================
// FIG 18: melt = temperature x sun x shade x edge
// ======================================================================
reg('melt',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);const f=Field(W,H,{seed:29});
  buildScene(f,{hx:20,hy:6,hw:40,rh:16,wh:13,trees:[[96,26],[112,60]],rocks:[[74,56]],fences:[[10,52,30]]});f.bakeExposure(-.4);
  const fill=()=>{for(let i=0;i<f.N;i++){f.Wt[i]=0;f.P[i]=0;if(f.holds(f.S[i]))f.D[i]=Math.min(f.capOf(f.S[i]),((50+vnoise((i%W)/10,(i/W|0)/10)*30)*Math.min(1,f.E[i]+.15))|0);}
    for(let k=0;k<30;k++)f.stamp(30+k*2.6,44+Math.sin(k*.6)*3,2,2,.3,255);};
  fill();const tot0=()=>{let a=0,s=0,sa=0;for(let i=0;i<f.N;i++){a+=f.D[i];if(f.SH[i]){s+=f.D[i];}}return [a,s];};let [T0,S0]=tot0();let fr=0,view='normal';
  c.btn('reset',()=>{fill();[T0,S0]=tot0();});c.seg('view',v=>view=v);
  return {tick(dt){fr++;const T=c.v('t'),sun=c.v('sun')/100,sp=c.v('sp');c.out('t',T.toFixed(1)+' °C');c.out('sun',sun.toFixed(2));c.out('sp',sp+'×');
      for(let s=0;s<sp;s++){f.melt((1500*f.N/57600)|0,T,sun,{shade:c.v('shade'),edge:c.v('edge')});f.sandpile(600);if(T>0)f.evap((1600*f.N/57600*(.3+sun))|0);}
      if(view==='normal')f.render(px.u32,{shadow:sun>.25,sparkle:sun>.4,frame:fr});
      else for(let i=0;i<f.N;i++)px.u32[i]=f.holds(f.S[i])?(view==='shadow'?(f.SH[i]?C32('#7c86c2'):C32('#2a3256')):view==='wet'?HEAT[f.Wt[i]]:HEAT[clamp(f.D[i]*3,0,255)]):mix32(f.G[i],0,.5);
      px.put();if(fr%10===0){const [a,s]=tot0();setHud(root,`snow left ${(a/T0*100).toFixed(0)} % · in cast shadow ${S0?(s/S0*100).toFixed(0):0} %`);}}};});

// ======================================================================
// FIG 19: ice / slush state machine
// ======================================================================
reg('states',root=>{const svg=$('svg',root),cv=$('canvas',root),px=PX(cv),c=ctl(root),ro=$('.readout',root);
  const NODES={POWDER:[70,46],PACKED:[230,46],SLUSH:[390,46],WET_GROUND:[560,46],GROUND:[700,130],ICE:[470,196]};
  const DESC={POWDER:'Fresh snow in the depth field. Deposition adds to it; packed marks fade as new snow lands (−14 per deposit in the Sandbox).',
    PACKED:'A step marks the cell packed (255 in the Sandbox stamp). Packed snow melts at half rate (packed > 100 → ×0.5).',
    SLUSH:'CoH2 blends Solid → Broken → Slush → Water by a cell “health” value. The slush and refreeze numbers have no game reference.',
    WET_GROUND:'Sandbox wet channel: +5 per melted unit; wet > 50 switches the ground to its wet palette; evaporation runs 1600·(0.3 + sun) picks above 0 °C.',
    GROUND:'Bare, dry ground. Snow falling on wet > 90 has a 60 % chance to consume 3 wet instead of depositing.',
    ICE:'Refreeze at night (T < 0). Dwarf Fortress freezes water ≥ 4/7 deep into ice walls. Tibia ice speed 100 vs snow 160 (lower is faster).'};
  const EDGES=[['POWDER','PACKED','step'],['PACKED','SLUSH','melt'],['SLUSH','WET_GROUND','melt'],['WET_GROUND','GROUND','dry / sun'],['SLUSH','ICE','T<0 night'],['WET_GROUND','ICE','T<0 night'],['ICE','SLUSH','T>0 sun'],['GROUND','POWDER','snowfall']];
  svg.setAttribute('viewBox','0 0 780 240');
  const defs=svgEl('defs',{},svg);const mkr=svgEl('marker',{id:'arw',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs);svgEl('path',{d:'M0,0L10,5L0,10z',fill:'#5a6b98'},mkr);
  const eEls={};EDGES.forEach(([a,b,l])=>{const [x1,y1]=NODES[a],[x2,y2]=NODES[b];let d;
    if(a==='GROUND'&&b==='POWDER')d=`M${x1-10},${y1+22}C${x1-120},${y1+100} ${x2-60},${y2+170} ${x2},${y2+18}`;
    else if(a==='ICE'&&b==='SLUSH')d=`M${x1-40},${y1-18}Q${x2-50},${y2+90} ${x2-30},${y2+18}`;
    else if(a==='SLUSH'&&b==='ICE')d=`M${x1+10},${y1+18}Q${x2-10},${y2-90} ${x2-10},${y2-18}`;
    else if(a==='WET_GROUND'&&b==='ICE')d=`M${x1},${y1+18}Q${x2+80},${y2-80} ${x2+40},${y2-18}`;
    else{const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy);d=`M${x1+dx/l*62},${y1+dy/l*20}L${x2-dx/l*66},${y2-dy/l*22}`;}
    const p=svgEl('path',{d,class:'edge','marker-end':'url(#arw)'},svg);eEls[a+'>'+b]=p;
    const len=p.getTotalLength?p.getTotalLength():0;let mid={x:(x1+x2)/2,y:(y1+y2)/2};try{mid=p.getPointAtLength(len/2);}catch(e){}
    svgText(svg,mid.x,mid.y-6,l,{class:'elab','text-anchor':'middle'});});
  const nEls={};for(const k in NODES){const [x,y]=NODES[k];const g=svgEl('g',{class:'node',tabindex:0,role:'button','aria-label':k},svg);svgEl('rect',{x:x-62,y:y-18,width:124,height:36,rx:4},g);svgText(g,x,y+5,k.replace('_',' '),{'text-anchor':'middle'});nEls[k]=g;
    const pick=()=>{set(k,null);};g.addEventListener('click',pick);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});}
  let cur='POWDER',auto=true,timer=0;const SCRIPT=[['POWDER','PACKED'],['PACKED','SLUSH'],['SLUSH','ICE'],['ICE','SLUSH'],['SLUSH','WET_GROUND'],['WET_GROUND','GROUND'],['GROUND','POWDER']];let si=0;
  function set(k,edge){cur=k;for(const n in nEls)nEls[n].classList.toggle('on',n===k);for(const e in eEls)eEls[e].classList.toggle('on',e===edge);ro.innerHTML=`<b>${k.replace('_',' ')}</b>: ${DESC[k]}`;}
  const go=(evt)=>{const e=EDGES.find(([a,,l])=>a===cur&&l.startsWith(evt));if(e)set(e[1],e[0]+'>'+e[1]);else ro.innerHTML=`<b>${cur.replace('_',' ')}</b>: no “${evt}” transition from this state.`;};
  c.btn('step',()=>{auto=false;go('step');});c.btn('melt',()=>{auto=false;go(cur==='ICE'?'T>0':cur==='WET_GROUND'?'dry':'melt');});c.btn('night',()=>{auto=false;go('T<0');});c.btn('snow',()=>{auto=false;go('snowfall');});
  c.btn('auto',b=>{auto=!auto;b.classList.toggle('on',auto);});set('POWDER',null);
  // pixel look of each state
  const look=(k,x,y)=>{const b=bay(x,y),h=hash2(x,y);switch(k){case'POWDER':return h<.07?COL.MID:h>.96?COL.HI:COL.BASE;case'PACKED':return b<3?COL.PSH:COL.PACK;
    case'SLUSH':return b<7?C32('#8b93ad'):wetC(COL.PACK);case'WET_GROUND':return h<.2?wetC(COL.DIRT_B):wetC(COL.DIRT);case'GROUND':return h<.3?COL.DIRT_B:COL.DIRT;case'ICE':return (Math.abs(Math.sin(x*.3+y*.7))<.08)?C32('#d7ecfa'):b<4?COL.ICE_B:COL.ICE_A;}};
  const ORDER=['POWDER','PACKED','SLUSH','WET_GROUND','GROUND','ICE'];
  return {tick(dt){if(auto){timer+=dt;if(timer>1.6){timer=0;const [a,b]=SCRIPT[si];if(cur!==a)set(a,null);set(b,a+'>'+b);si=(si+1)%SCRIPT.length;}}
      const u=px.u32,W=px.W,H=px.H;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=ORDER[Math.min(5,(x/(W/6))|0)];let col=look(k,x,y);if(k===cur&&(y<1||y>=H-1||x%(W/6)<1||x%(W/6)>=W/6-1))col=C32('#ffb86b');u[y*W+x]=col;}px.put();}};});
