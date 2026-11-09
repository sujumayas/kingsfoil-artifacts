// ======================================================================
// C7 / H2: splash flipbook per surface + live strip with note 03 counts
// ======================================================================
reg('splash',root=>{const fl=$$('.flip canvas',root).map(PX),cv=$('canvas[width="192"]',root),S=PX(cv),c=ctl(root),fo=$('[data-frame]',root);
  const SPc=P32(SPL),WA2=P32(WA[2]),WA3=P32(WA[3]),MUD=P32(MUDS),DK=P32(DI[2]),GRL=P32(GR[3]);
  const bg=(k,x,y)=>{const h=hash2(x+k*31,y);return k===0?P32(h<.2?WA[1]:WA[0]):k===1?P32(((x+((y/5|0)&1)*3)%7===0||y%5===0)?CO[2]:CO[0]):k===2?W32(h<.3?DI[1]:DI[0]):k===3?P32(h<.3?GR[0]:h<.7?GR[1]:GR[2]):P32(h<.4?SA[1]:SA[0]);};
  // frames: lists of [dx,dy,colour] around (8,10)
  const F=[
    [[[0,0,SPc]],[[-1,0,WA3],[1,0,WA3],[0,-1,WA2],[0,1,WA2]],[[-3,0,WA3],[3,0,WA3],[-2,-1,WA2],[2,-1,WA2],[-2,1,WA2],[2,1,WA2],[0,-2,WA2],[0,2,WA2]],[[-4,0,WA2],[4,0,WA2],[0,-2,WA2],[0,2,WA2],[-3,-1,WA2],[3,1,WA2]]],
    [[[0,0,SPc],[0,-1,SPc]],[[-2,0,SPc],[1,0,SPc],[-1,0,0],[0,0,0]],[[-3,-1,SPc],[2,-1,SPc]],[]],
    [[[0,0,MUD],[-1,0,MUD],[1,0,MUD],[0,-1,MUD]],[[-2,-1,MUD],[2,-1,MUD],[0,0,DK]],[[-3,0,MUD],[0,0,DK]],[[0,0,DK]]],
    [[[0,-1,SPc]],[[0,-2,GRL],[1,-1,SPc]],[[1,-2,GRL]],[]],
    [[[0,-1,SPc],[0,0,SPc]],[[0,0,W32(SA[0])],[-1,-1,SPc],[1,-1,SPc]],[[0,0,W32(SA[0])]],[[0,0,W32(SA[0])]]]];
  let f=0,play=!reduce,acc=0;const pb=c.btn('play',b=>{play=!play;b.textContent=play?'Pause flipbook':'Play flipbook';});if(!play)pb.textContent='Play flipbook';
  c.btn('step',()=>{f=(f+1)&3;drawFlip();});
  function drawFlip(){fl.forEach((P,k)=>{const u=P.u32;for(let y=0;y<16;y++)for(let x=0;x<16;x++)u[y*16+x]=bg(k,x,y);for(const [dx,dy,col] of F[k][f])if(col)u[(10+dy)*16+8+dx]=col;P.put();});
    fo.textContent=`Frame ${f+1} of 4${f===3?' (blank, or the stain that stays)':''}`;}
  drawFlip();
  let tier=2;c.seg('tier',v=>tier=+v);const RATE={ring:[0,1,3,8,15],crown:[0,1,2,5,10],fleck:[0,.5,1,3,6]};const SPL2=[],W=S.W,H=S.H,BW=W/5,area=(BW/32)*(H/32);let fr=0,cnt=[0,0,0];const D=[];
  return {tick(dt){fr++;if(play){acc+=dt;if(acc>.16){acc=0;f=(f+1)&3;drawFlip();}}
    const kinds=['ring','crown','crown','fleck','crown'];
    for(let b=0;b<5;b++){const r=RATE[kinds[b]][tier]*area*dt;if(rnd()<r)SPL2.push({b,x:b*BW+2+rnd()*(BW-4),y:3+rnd()*(H-6),age:0,life:b===0?.3+rnd()*.3:.2,rm:2+rnd()*4});}
    const u=S.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const b=Math.min(4,(x/BW)|0);u[y*W+x]=bg(b,x,y);if(x%Math.round(BW)===0&&x)u[y*W+x]=C32('#0b1016');}
    const want=[0,6,12,22,34][tier];while(D.length<want)D.push({x:rnd()*W,y:rnd()*H,z:rnd()*20});if(D.length>want)D.length=want;for(const d of D){d.z-=60*dt;if(d.z<0){d.x=rnd()*W;d.y=rnd()*H;d.z=20;}const yy=(d.y-d.z)|0,xx=d.x|0;for(let s=0;s<3;s++)if(yy-s>=0&&yy-s<H)u[(yy-s)*W+xx]=P32(RNN);}
    for(let k=SPL2.length-1;k>=0;k--){const s=SPL2[k];s.age+=dt;if(s.age>=s.life){SPL2.splice(k,1);continue;}const x=s.x|0,y=s.y|0;
      if(s.b===0){const r=s.rm*Math.pow(s.age/s.life,.6);for(let a=0;a<16;a++){const xx=Math.round(x+Math.cos(a/16*6.283)*r),yy=Math.round(y+Math.sin(a/16*6.283)*r*.5);if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=s.age/s.life<.5?WA3:WA2;}}
      else{const fi=Math.min(3,(s.age/s.life*4)|0);for(const [dx,dy,col] of F[s.b][fi]){const xx=x+dx,yy=y+dy;if(col&&xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=col;}}}
    S.put();if(fr%20===0)setHud(root,tier===0?'Drizzle: no splashes, only haze and speckles':`per m² per s: rings ${RATE.ring[tier]} · crowns ${RATE.crown[tier]} · grass flecks ${RATE.fleck[tier]}`);}};});

// ======================================================================
// D1 vs D2: Hugo Elias two-buffer ripples vs a stateless ring field
// ======================================================================
reg('ripples',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root);const W=96,H=64,N=W*H;
  let R0=new Float32Array(N),R1=new Float32Array(N);const MW=new Uint8Array(N),BASE=new Uint32Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const dx=(x-48)/44,dy=(y-32)/28;const r=dx*dx+dy*dy;MW[i]=r<1?1:0;BASE[i]=r<1?P32(r<.3?WA[4]:r<.7?WA[0]:WA[1]):P32(r<1.2?CO[hash2(x,y)<.3?1:0]:GR[hash2(x,y)<.4?0:1]);}
  pointer(cvs[0],([x,y],k)=>{if(k==='down'||k==='drag')for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const i=(y+b)*W+x+a;if(i>=0&&i<N&&MW[i])R0[i]-=6;}});
  const io=()=>{c.out('damp',(c.v('damp')/100).toFixed(2));c.out('int',(c.v('int')/100).toFixed(2));};c.on('damp',io);c.on('int',io);io();
  const TM=[1,.85,.93,1.13],TA=[0,.2,.45,.7];let t=0,fr=0;const LC=['#ffb86b','#6dd4c3','#c9a2ff','#f6a8c8'].map(C32);
  return {tick(dt){t+=dt;fr++;const I=c.v('int')/100,damp=c.v('damp')/100;
    const n=I*1.4;for(let k=0;k<Math.floor(n)+(rnd()<n%1?1:0);k++){const i=(rnd()*N)|0;if(MW[i])R0[i]-=1.6+I*1.4;}
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!MW[i]){R1[i]=0;continue;}R1[i]=((R0[i-1]+R0[i+1]+R0[i-W]+R0[i+W])*.5-R1[i])*damp;}const tmp=R0;R0=R1;R1=tmp;
    const u=A.u32;for(let i=0;i<N;i++){if(!MW[i]){u[i]=BASE[i];continue;}const sl=(R0[i+1]-R0[i-1])+(R0[i+W]-R0[i-W]);u[i]=sl>.55?P32(WA[3]):sl>.22?P32(WA[2]):sl<-.5?P32(WA[4]):BASE[i];}A.put();
    // ring field
    const v=B.u32,show=c.v('cells'),layers=Math.ceil(I*4);let lookups=0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let col=BASE[i];if(!MW[i]){v[i]=col;continue;}
      for(let k=0;k<layers;k++){const wk=sat((I-k/4)*4);if(wk<=0)continue;lookups++;const ox=k*5,oy=k*7;const cx=Math.floor((x+ox)/16),cy=Math.floor((y+oy)/16);
        const h=hash2(cx+k*101,cy),h2=hash2(cy+k*57,cx+3),ph=(t*1.6*TM[k]+h+TA[k])%1;const ccx=cx*16-ox+5+h2*6,ccy=cy*16-oy+5+h*6,rm=2+h2*4;
        const r=rm*Math.pow(ph,.6),d=Math.hypot(x-ccx,(y-ccy)*1.4);if(Math.abs(d-r)<.55&&(1-ph)*wk*16>bay(x,y)){col=show?LC[k]:(ph<.4?P32(WA[3]):P32(WA[2]));}}
      if(I>.7&&hash2(x*3+((t*8)|0),y*5)<(I-.7)*.6)col=show?C32('#ffffff'):P32(WA[2]);
      if(show&&(((x+0)%16===0)||((y+0)%16===0)))col=mix32(col,C32('#a9d2f0'),.25);v[i]=col;}
    B.put();if(fr%15===0){let wn=0;for(let i=0;i<N;i++)wn+=MW[i];setHudK(root,'a',`17 ops × ${wn} cells = ${(17*wn/1000).toFixed(0)}k / step`);setHudK(root,'b',`${layers} layer${layers===1?'':'s'} · ${(lookups/wn).toFixed(1)} lookups / px${I>.7?' · chop':''}`);}}};});

// ======================================================================
// E2: roof, awning and tree stores keep dripping
// ======================================================================
reg('drips',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,svg=$('svg.dripc',root),c=ctl(root),ro=$('[data-ro]',root);
  const w=RWorld(W,H,{seed:44,maxd:400,dropMul:1.6});w.grass();const roof=w.house(2,2,54,18,10);const awn=w.awning(66,4,122,14);w.cobble(60,24,127,46);const tree=w.tree(96,70);
  w.dirt((x,y)=>y>=29&&y<=33&&x>=0&&x<=56);w.finish();w.wind=.2;w.exposure(.2);
  let raining=true,stopT=null,fr=0;const trace=[];roof.water=.85;awn.water=.2;tree.water=.2;
  const MEAS=[[5,.89,.14,.17,40],[10,.63,.11,.14,29],[15,.43,.07,.12,20],[20,.29,.05,.1,17],[30,.13,.02,.07,7],[45,.05,.01,.04,4],[60,.02,.01,.02,3]];
  const rb=c.btn('rain',b=>{raining=!raining;b.textContent=raining?'Stop the rain':'Start the rain';stopT=raining?null:0;trace.length=0;});
  c.btn('fill',()=>{roof.water=1;awn.water=.2;tree.water=.2;});
  const COL=['#a9d2f0','#e0675f','#79a35a'];
  function chart(){const Wd=300,Hd=200,Lm=30,Rm=8,T=10,Bm=26;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';const X=t=>Lm+t/60*(Wd-Lm-Rm),Y=v=>T+(1-v)*(Hd-T-Bm);
    for(const v of [0,.5,1]){svgEl('line',{x1:Lm,x2:Wd-Rm,y1:Y(v),y2:Y(v),class:v?'gl':'ax'},svg);svgText(svg,Lm-4,Y(v)+4,v,{'text-anchor':'end','font-size':10});}
    for(const t of [0,15,30,45,60])svgText(svg,X(t),Hd-8,t+' s',{'text-anchor':'middle','font-size':10});
    MEAS.forEach(m=>{for(let k=0;k<3;k++)svgEl('circle',{cx:X(m[0]),cy:Y(m[k+1]),r:3,fill:'none',stroke:COL[k],'stroke-width':1.5},svg);});
    for(let k=0;k<3;k++){if(trace.length<2)break;svgEl('path',{d:trace.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+','+Y(p[k+1]).toFixed(1)).join(''),fill:'none',stroke:COL[k],'stroke-width':2},svg);}
    ['roof','awning','tree'].forEach((n,k)=>{svgEl('rect',{x:Lm+6+k*70,y:T+2,width:10,height:3,fill:COL[k]},svg);svgText(svg,Lm+20+k*70,T+7,n,{'font-size':10.5,class:'lab'});});
    if(stopT===null)svgText(svg,X(60),Y(.78),'Raining: stop the rain to start the clock',{'text-anchor':'end','font-size':11,fill:'#ffb86b'});}
  chart();
  return {tick(dt){w.t+=dt;fr++;w.I=raining?.9:0;w.sunny=!raining;w.simStep();w.updateDrops(dt);w.updateParts(dt);w.render(px.u32);px.put();
    if(stopT!==null){stopT+=dt;if(stopT<=60&&fr%6===0)trace.push([stopT,roof.water,awn.water,tree.water]);}
    if(fr%12===0){chart();let drips=0;for(const p of w.parts)if(p.k==='drip')drips++;setHud(root,`${raining?'Raining':`${(stopT||0).toFixed(0)} s after the rain`} · ${drips} drips falling`);
      ro.innerHTML=`Stores: roof <b>${roof.water.toFixed(2)}</b> · awning <b>${awn.water.toFixed(2)}</b> · tree <b>${tree.water.toFixed(2)}</b>. Measured live drips after a storm fall from 40 at 5 s to 7 at 30 s.`;}}};});

// ======================================================================
// E3: character wetness meters (Sandbox, DST, Valheim)
// ======================================================================
reg('soak',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),mt=$('[data-meters]',root);
  const w=RWorld(W,H,{seed:55,maxd:400});w.grass();w.cobble(80,30,127,63);w.awning(82,18,126,28);w.tree(54,56);w.campfire(116,40);w.finish();w.wind=0;w.exposure(0);w.coverDrops=true;w.fire.F=1;
  const p=w.newChar(22,52,PMAP);const SP={open:[22,52],tree:[50,58],roof:[92,36],fire:[106,37],umb:[22,52]};let spot='open',tier=4,dst=0,val=0,fr=0;
  mt.innerHTML=`<div class="meter"><b>Sandbox</b><span class="mbar"><i data-m="s"></i><em style="left:45%" title="drips above 0.45"></em></span><small data-v="s"></small></div>
    <div class="meter"><b>DST</b><span class="mbar"><i data-m="d"></i><em style="left:35%" title="penalties from 35"></em></span><small data-v="d"></small></div>
    <div class="meter"><b>Valheim Wet</b><span class="mbar"><i data-m="v"></i></span><small data-v="v"></small></div>`;
  const bar=(k,f,txt)=>{$(`[data-m="${k}"]`,mt).style.width=(clamp(f,0,1)*100).toFixed(1)+'%';$(`[data-v="${k}"]`,mt).textContent=txt;};
  c.seg('spot',v=>{spot=v;});c.seg('tier',v=>tier=+v);
  pointer(cv,([x,y],k)=>{if(k!=='down')return;let best='open',bd=1e9;for(const [n,[sx,sy]] of Object.entries(SP)){if(n==='umb')continue;const d=Math.hypot(x-sx,y-sy);if(d<bd){bd=d;best=n;}}spot=best;$$('[data-seg="spot"] button',root).forEach(b=>b.classList.toggle('on',b.dataset.v===best));});
  return {tick(dt){w.t+=dt;fr++;const I=tier<0?0:TIERS[tier][1];w.I=I;w.simStep();w.updateDrops(dt);w.updateParts(dt);w.updateFire(dt);if(!w.fire.on){w.fire.on=true;w.fire.F=.6;}
    p.umb=spot==='umb';const [tx,ty]=SP[spot];w.walkTo(p,tx,ty,40,dt);w.soak(p,dt);
    const e=w.expAt(p),nearFire=Math.hypot(p.x-w.fire.x,p.y-w.fire.y)<22,exposed=I>.02&&e>.25;
    // DST: up to 1/s, umbrella 90 %, trees cut 35 % (rates per tier are illustrative)
    const prot=p.umb?.9:spot==='tree'?.35:0;if(I>.02&&e>.1&&spot!=='roof'&&spot!=='fire')dst=Math.min(100,dst+I*(1-prot)*dt);else dst=Math.max(0,dst-(nearFire?2:.5)*dt);
    // Valheim: 120 s, reset on exposure; roof clears; fire removes 10 s per second
    if(exposed&&!p.umb)val=120;else if(spot==='roof')val=0;else val=Math.max(0,val-(nearFire?10:1)*dt);
    w.render(px.u32);px.put();
    if(fr%6===0){bar('s',p.wet,`${p.wet.toFixed(2)}${p.wet>.45?' · dripping':''}`);bar('d',dst/100,`${dst.toFixed(0)} / 100${dst>=35?' · tools slip, sanity drain':''}`);bar('v',val/120,val>0?`Wet · ${val.toFixed(0)} s left`:'dry');
      setHud(root,`exposure ${e.toFixed(2)}${p.umb?' · umbrella':''}${nearFire?' · by the fire':''}`);}}};});

// ======================================================================
// F1 + F2: bolt, Emerald flash curve, thunder delay, WCAG window
// ======================================================================
reg('bolt',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,N=W*H,svg=$('svg.flashc',root),c=ctl(root),ro=$('[data-ro]',root);
  const BASE=new Uint32Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,h=hash2(x,y);let b=h<.3?GR[0]:GR[1];
    if(x>40&&x<90&&y>30&&y<70){const row=((y-30)/5)|0,off=(row&1)*3;b=((x+off)%7===0||(y-30)%5===0)?CO[2]:CO[hash2((x+off)/7|0,row)<.3?1:0];}
    if(x>=6&&x<36&&y>=6&&y<26)b=(y-6)%4===3?RF[1]:RF[0];if(x>=96&&x<124&&y>=10&&y<30)b=(y-10)%4===3?RF[1]:RF[0];
    const dx=(x-104)/18,dy=(y-78)/12;if(dx*dx+dy*dy<1)b=dx*dx+dy*dy<.4?WA[4]:WA[0];if(x>=60&&x<68&&y>=44&&y<50)b=x<63?MT[0]:MT[1];
    BASE[i]=tintC(P32(b),tintK(.6));}
  let bolt=null,boltA=0,flash=0,t=0,last=-9,fr=0,thunder=-1,shake=0,auto=.6,disc=0,tx=0,ty=0;const queue=[],hist=[];
  const doStrike=(x,y)=>{tx=x;ty=y;const segs=[];const depth=c.v('det'),br=c.v('br');
    const md=(x0,y0,x1,y1,d,k)=>{if(k===0){segs.push([x0,y0,x1,y1]);return;}const mx=(x0+x1)/2+(rnd()-.5)*d,my=(y0+y1)/2+(rnd()-.5)*d*.3;md(x0,y0,mx,my,d/2,k-1);md(mx,my,x1,y1,d/2,k-1);
      if(br&&k>=3&&rnd()<.35){const a=Math.atan2(y1-y0,x1-x0)+(rnd()<.5?-.52:.52),L=Math.hypot(x1-x0,y1-y0)*.7;md(mx,my,mx+Math.cos(a)*L,my+Math.sin(a)*L,d/2,k-2);}};
    md(x+(rnd()-.5)*30,-4,x,y,40,depth);bolt=segs;boltA=1;flash=calmFlash?.06:.28;last=t;hist.push(t);disc=.25;thunder=c.v('dist')/343;};
  const ask=(x,y)=>{queue.push([x,y]);};
  pointer(cv,([x,y],k)=>{if(k==='down')ask(x,y);});
  c.btn('strike',()=>ask(20+rnd()*(W-40),20+rnd()*(H-30)));c.btn('burst',()=>{for(let k=0;k<6;k++)ask(20+rnd()*(W-40),20+rnd()*(H-30));});
  const io=()=>{c.out('det',c.v('det'));c.out('dist',c.v('dist')+' m');};c.on('det',io);c.on('dist',io);io();
  const line=(u,x0,y0,x1,y1,col,a)=>{x0|=0;y0|=0;x1|=0;y1|=0;const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx-dy,n=0;for(;;){if(x0>=0&&y0>=0&&x0<W&&y0<H&&bay(x0,y0)<a*16)u[y0*W+x0]=col;if(x0===x1&&y0===y1||n++>300)break;const e2=2*e;if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}}};
  function chart(){const Wd=420,Hd=132,Lm=10,Rm=10;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';const X=s=>Lm+(1-(t-s)/5)*(Wd-Lm-Rm);
    svgEl('rect',{x:X(t-1),y:14,width:X(t)-X(t-1),height:60,fill:'#a9d2f0','fill-opacity':.08,stroke:'#a9d2f0','stroke-opacity':.4},svg);
    svgText(svg,X(t-.5),11,'last 1 s',{'text-anchor':'middle','font-size':10});
    svgEl('line',{x1:Lm,x2:Wd-Rm,y1:74,y2:74,class:'ax'},svg);for(let s=0;s<=5;s++)svgText(svg,X(t-s),88,s?`−${s} s`:'now',{'text-anchor':'middle','font-size':10});
    for(const h of hist)if(t-h<5)svgEl('rect',{x:X(h)-2,y:24,width:4,height:50,fill:'#ffb86b'},svg);
    let mx=0;for(const h of hist){let n=0;for(const g of hist)if(g>=h&&g-h<=1)n++;mx=Math.max(mx,n);}const now=hist.filter(h=>t-h<=1).length;
    svgText(svg,Lm,106,`Flashes in the last 1 s: ${now}`,{'font-size':12,class:'lab'});svgText(svg,Lm,124,`Most in any 1 s window: ${mx} (WCAG limit: 3)`,{'font-size':12,fill:mx>3?'#ff8f7a':'#a9d2f0'});}
  return {tick(dt){t+=dt;fr++;if(motion){auto-=dt;if(auto<=0){auto=4+rnd()*3;if(!queue.length)ask(20+rnd()*(W-40),20+rnd()*(H-30));}}
    if(queue.length&&t-last>=1){const [x,y]=queue.shift();doStrike(x,y);}while(hist.length&&t-hist[0]>6)hist.shift();
    flash=Math.max(0,flash-dt);boltA=Math.max(0,boltA-.03*dt*60);disc=Math.max(0,disc-dt);if(thunder>=0){thunder-=dt;if(thunder<0){shake=.45;}}shake=Math.max(0,shake-dt);
    const u=px.u32,em=c.segv('fl')==='em',k=Math.min(1,flash*6)*(calmFlash?.35:.85);
    for(let i=0;i<N;i++){let col=BASE[i];if(k>0){const [r,g,b]=un32(col);const kk=em&&lum32(col)<.4?k*.5:k;col=pack(lerp(r,255,kk),lerp(g,255,kk),lerp(b,255,kk));}u[i]=col;}
    if(bolt&&boltA>0){for(const [a,b,cc,d] of bolt)line(u,a+1,b,cc+1,d,P32(BOLT[1]),boltA);for(const [a,b,cc,d] of bolt)line(u,a,b,cc,d,P32(BOLT[0]),boltA);}
    if(disc>0){const r=(1-disc/.25)*5+1;for(let a=0;a<20;a++){const xx=Math.round(tx+Math.cos(a/20*6.283)*r),yy=Math.round(ty+Math.sin(a/20*6.283)*r*.5);if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=P32(SPARK);}}
    px.put();if(!reduce)cv.style.transform=shake>0?`translate(${(rnd()-.5)*3*shake/.45}px,${(rnd()-.5)*2*shake/.45}px)`:'';
    if(fr%6===0){chart();setHud(root,`${queue.length?queue.length+' strike(s) queued · ':''}flash ${calmFlash?'0.06 s × 0.35':'0.28 s'}`);
      ro.innerHTML=thunder>=0?`Thunder in <b>${thunder.toFixed(1)} s</b> (${c.v('dist')} m ÷ 343 m/s).`:`Last bolt: ${bolt?bolt.length:0} segments at detail ${c.v('det')}. ${em?'Shadows (luminance &lt; 0.4) rise half as far.':'Every colour rises equally: the scene washes out.'}`;}}};});

// ======================================================================
// F3: fire vs rain, plus Minecraft and DST rules
// ======================================================================
reg('fire',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,svg=$('svg.firec',root),c=ctl(root),ro=$('[data-ro]',root);
  const w=RWorld(W,H,{seed:66,maxd:300,dropMul:1.4});w.grass();w.cobble(24,26,72,56);const f=w.campfire(48,42);w.finish();w.wind=.1;w.exposure(.1);
  let tier=4,t0=0,outT=null,fr=0;const tr=[];const MEAS=[null,null,41.6,17.8,12.2];
  c.seg('tier',v=>{tier=+v;relight();});const relight=()=>{f.on=true;f.F=.8;t0=w.t;outT=null;tr.length=0;};c.btn('light',relight);
  c.on('roof',()=>{f.roof=c.v('roof');for(let y=30;y<=50;y++)for(let x=34;x<=62;x++)w.SHL[y*W+x]=f.roof?0:1;w.wb=99;w.exposure(w.wind);});
  function chart(){const Wd=380,Hd=230,Lm=30,T=22,cw=200;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';const X=s=>Lm+s/60*(cw-Lm),Y=v=>T+(1-v)*110;
    svgText(svg,Lm,12,'Fire strength F (live)',{'font-size':11,class:'lab'});svgEl('line',{x1:Lm,x2:cw,y1:Y(0),y2:Y(0),class:'ax'},svg);svgEl('line',{x1:Lm,x2:cw,y1:Y(.12),y2:Y(.12),stroke:'#ff8f7a','stroke-dasharray':'3 3'},svg);svgText(svg,cw,Y(.12)-3,'out below 0.12',{'text-anchor':'end','font-size':9.5,fill:'#ff8f7a'});
    for(const s of [0,20,40,60])svgText(svg,X(s),Y(0)+13,s+' s',{'text-anchor':'middle','font-size':9.5});
    if(MEAS[tier]&&!f.roof){svgEl('line',{x1:X(MEAS[tier]),x2:X(MEAS[tier]),y1:Y(1),y2:Y(0),stroke:'#ffb86b','stroke-dasharray':'2 3'},svg);svgText(svg,X(MEAS[tier])+3,Y(.75),`measured ${MEAS[tier]} s`,{'font-size':9.5,fill:'#ffb86b'});}
    if(tr.length>1)svgEl('path',{d:tr.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join(''),fill:'none',stroke:'#ffa040','stroke-width':2},svg);
    const x0=cw+30;svgText(svg,x0,12,'Minecraft: chance to go out',{'font-size':11,class:'lab'});for(let a=0;a<=10;a+=2){const p=Math.min(1,.2+.03*a),bx=x0+a*13;svgEl('rect',{x:bx,y:Y(p),width:10,height:Y(0)-Y(p),fill:'#6c9cc4'},svg);svgText(svg,bx+5,Y(p)-3,Math.round(p*100),{'text-anchor':'middle','font-size':8.5});svgText(svg,bx+5,Y(0)+13,a,{'text-anchor':'middle','font-size':9.5});}
    svgText(svg,x0,Y(0)+26,'age (illustrative range)',{'font-size':9.5});
    const yb=Y(0)+46;svgText(svg,Lm,yb,'DST fuel burn rate in rain',{'font-size':11,class:'lab'});[['Fire Pit',3],['Campfire',3.5],['Torch',2.5]].forEach(([n,m],k)=>{const yy=yb+8+k*16;svgEl('rect',{x:Lm+70,y:yy,width:m*40,height:11,fill:'#ffb86b','fill-opacity':.85},svg);svgText(svg,Lm+64,yy+9,n,{'text-anchor':'end','font-size':10});svgText(svg,Lm+76+m*40,yy+9,`×${m} (+${Math.round((m-1)*100)} %)`,{'font-size':10});});}
  chart();
  return {tick(dt){w.t+=dt;fr++;w.I=TIERS[tier][1];w.simStep();w.updateDrops(dt);w.updateParts(dt);const was=f.on;w.updateFire(dt);if(was&&!f.on)outT=w.t-t0;
    const el=w.t-t0;if(el<=60&&fr%10===0)tr.push([el,f.on?f.F:0]);
    w.render(px.u32);const u=px.u32;if(f.roof)for(let y=22;y<=28;y++)for(let x=32;x<=64;x++)u[y*W+x]=tintC(P32((y-22)%3===2?RF[2]:(x%6===0?RF[1]:RF[0])),tintK(w.I));px.put();
    if(fr%12===0){chart();setHud(root,f.on?`F ${f.F.toFixed(2)} · ${el.toFixed(0)} s`:`out after ${outT!==null?outT.toFixed(1):'?'} s · relight to retry`);
      ro.innerHTML=`${TIERS[tier][0]}: F changes by +0.04 − ${w.I}·EXP·0.11 = <b>${(.04-w.I*w.EXP[f.y*W+f.x]*.11).toFixed(3)}/s</b> before drop hits.${f.roof?' Under the roof EXP = 0, so the fire survives.':MEAS[tier]?'':' At this tier the regrowth wins and the fire survives, as in the Sandbox run.'}`;}}};});
