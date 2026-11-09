
// shared slime mover (Sandbox hop: speed rides max(0, sin phase))
function hopTo(s,dt,tx,ty,base=16){const dx=tx-s.x,dy=ty-s.y,L=Math.hypot(dx,dy);const hop=Math.max(0,Math.sin(s.ph));const sp=(L>3?base:0)*(.35+.9*hop)*(s.mass>30?.75:1);
  s.ph+=dt*(L>3?8:3);s.vx*=Math.pow(.05,dt);s.vy*=Math.pow(.05,dt);s.x+=((L>0?dx/L*sp:0)+s.vx)*dt;s.y+=((L>0?dy/L*sp:0)+s.vy)*dt;if(Math.abs(dx)>2)s.dir=dx>0?1:-1;return L;}
function slimeTrail(r,s){const ti=(s.y|0)*r.W+(s.x|0);if(ti>0&&ti<r.N&&!r.SOL[ti]&&r.A[ti]<.3){r.A[ti]+=.006;r.grow(s.x-1,s.y-1,s.x+1,s.y+1);}}
function digest(r,s,mul,radius){let gained=0;const rr=(radius||srad)(s);for(let k=0;k<5;k++){const a=rnd()*6.28,d=Math.sqrt(rnd())*rr*.85;const x=(s.x+Math.cos(a)*d)|0,y=(s.y-2+Math.sin(a)*d*.6)|0;
    if(x<1||y<1||x>=r.W-1||y>=r.H-1)continue;const j=y*r.W+x;if(r.M[j]>=M_WOOD&&RATE[r.M[j]]>0)gained+=r.reactPx(j,-1,1,mul)*.9;}return gained;}
function burstSlime(r,s,rad){const R=rad*1.5;r.spill(s.x|0,(s.y-2)|0,R|0,.5+s.mass*.025);for(let k=0;k<10;k++){const a=rnd()*6.28;r.parts.push({k:'drop',x:s.x,y:s.y,z:4,vx:Math.cos(a)*40,vy:Math.sin(a)*24,vz:30+rnd()*30,life:2,t:0});}}

// ======================================================================
// FIG 15: slime threshold field shared with the acid
// ======================================================================
reg('field',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);const r=Room(W,H,{tile:16,seed:14});
  r.spill(52,62,12,1.2);r.spill(132,40,9,1.0);for(let k=0;k<300;k++)r.step({evap:false,react:false,gas:false,samples:0});r.item('sword',104,62);r.item('gold',156,80);
  const S=[newSlime(60,70,24),newSlime(92,50,16),newSlime(113,66,34)];let drag=null,cur=[-1,-1],t=0,fr=0;
  pointer(cv,([x,y],k)=>{cur=[x,y];if(k==='down'){let best=null,bd=1e9;for(const s of S){const d=Math.hypot(s.x-x,s.y-4-y);if(d<srad(s)+8&&d<bd){bd=d;best=s;}}drag=best;}
    if(k==='drag'&&drag){drag.x=clamp(x,6,W-6);drag.y=clamp(y+4,8,H-3);drag.moving=.2;}if(k==='up')drag=null;});
  function fieldAt(x,y){let f=0;const sqOn=c.v('sq');for(const s of S){const rr=srad(s),sq=sqOn?Math.sin(s.ph)*.13:0,rx=rr*(1+sq),ry=rr*(1-sq)*.82,cx=s.x,cy=s.y-ry*.55;const d2=((x-cx)/rx)**2+((y-cy)/ry)**2;if(d2<2.56){const v=1-d2/2.56;f+=v*v*2.7;}}return f;}
  return {tick(dt){t+=dt;fr++;for(const s of S){s.moving=(s.moving||0)-dt;s.ph+=dt*(s.moving>0?8:3);}
    const thr=c.v('thr'),aw=c.v('aw');c.out('thr',thr.toFixed(2));c.out('aw',aw.toFixed(2));const u=px.u32;r.render(u,t,{haze:false});
    drawSlimes(r,u,S,fr,{thr,aw,squash:c.v('sq'),see:c.v('see'),field:c.v('heat')});px.put();
    if(fr%4===0){if(cur[0]>=0){const f=fieldAt(cur[0],cur[1]),a=Math.min(1,r.A[cur[1]*W+cur[0]]||0),v=f+aw*a;setHud(root,`F ${f.toFixed(2)} + ${aw.toFixed(2)}·acid ${a.toFixed(2)} = ${v.toFixed(2)} ${v>=thr?'≥':'<'} ${thr.toFixed(2)} → ${v>=thr?'slime':'floor'}`);}
      else setHud(root,'Drag a slime onto a puddle');}}};});

// ======================================================================
// FIG 16: split, grow, merge, burst
// ======================================================================
reg('split',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),bars=$('[data-bars]',root);let r,S,t=0,fr=0,empty=0,msg='';
  const radAC=s=>1.644*Math.sqrt(s.mass);const RF=()=>c.v('area')?radAC:srad;
  function reset(){r=Room(W,H,{tile:16,seed:31,react:4});S=[newSlime(70,52,40),newSlime(130,40,14)];S[0].mother=true;r.item('crate',96,52);empty=0;msg='';}
  reset();c.btn('reset',reset);
  function split(s){const m=s.mass/2;s.mass=m;const a=rnd()*6.28;const n=newSlime(s.x+Math.cos(a)*4,s.y+Math.sin(a)*3,m);n.vx=Math.cos(a)*40;n.vy=Math.sin(a)*30;s.vx=-n.vx;s.vy=-n.vy;S.push(n);}
  c.btn('hit',()=>{if(!S.length)return;const s=S.reduce((a,b)=>a.mass>b.mass?a:b);s.mass-=8;s.hurt=.15;s.vx+=(rnd()-.5)*60;s.vy+=(rnd()-.5)*40;
    for(let k=0;k<5;k++)r.parts.push({k:'drop',x:s.x,y:s.y,z:5,vx:(rnd()-.5)*50,vy:(rnd()-.5)*30,vz:25+rnd()*20,life:2,t:0});
    if(s.mass<5){burstSlime(r,s,RF()(s));S.splice(S.indexOf(s),1);msg='burst into a pool';}else if(s.mass>=12&&S.length<10){split(s);msg='split in half';}else msg=S.length>=10?'no split: 10 slimes':'no split: under 12 mass';});
  c.btn('feed',()=>{if(!S.length)return;const s=S.reduce((a,b)=>a.mass>b.mass?a:b);r.item('crate',clamp((s.x-8)|0,2,W-18),clamp((s.y-10)|0,2,H-16));msg='crate dropped under the biggest';});
  return {tick(dt){t+=dt;fr++;const RFn=RF();
    for(const s of S){s.t-=dt;s.hurt=Math.max(0,s.hurt-dt);if(s.t<=0){s.t=1.5+rnd()*2.5;let tx=s.x+(rnd()-.5)*60,ty=s.y+(rnd()-.5)*40;
        if(c.v('merge')&&S.length>1){const o=S.filter(q=>q!==s).reduce((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)<Math.hypot(b.x-s.x,b.y-s.y)?a:b);tx=o.x;ty=o.y;}
        s.tx=clamp(tx,12,W-12);s.ty=clamp(ty,14,H-6);}
      hopTo(s,dt,s.tx,s.ty);s.x=clamp(s.x,8,W-8);s.y=clamp(s.y,12,H-4);s.mass+=digest(r,s,2.2,RFn);slimeTrail(r,s);
      if(s.mass>45&&S.length<6&&rnd()<dt*.5){split(s);msg='split on its own (mass > 45)';}if(s.mass>60)s.mass=60;}
    if(c.v('merge'))for(let a=0;a<S.length;a++)for(let b=a+1;b<S.length;b++){const p=S[a],q=S[b];const d=Math.hypot(p.x-q.x,p.y-q.y);
      if(d<(RFn(p)+RFn(q))*.6){p.mt=(p.mt||0)+dt;if(p.mt>2){p.mass=Math.min(60,p.mass+q.mass);p.x=(p.x+q.x)/2;p.y=(p.y+q.y)/2;S.splice(b,1);p.mt=0;msg='re-merged';break;}}}
    if(!S.length){empty+=dt;if(empty>4)reset();}
    r.step({evapMul:3});r.updParts(dt);const u=px.u32;r.render(u,t);r.drawParts(u);drawSlimes(r,u,S,fr,{radius:RFn});px.put();
    if(fr%8===0){bars.innerHTML=S.map((s,i)=>`<div class="mb"><span>Slime ${i+1}</span><i style="--w:${(s.mass/60*100).toFixed(0)}%"></i><b>${s.mass.toFixed(1)}</b><small>r ${RFn(s).toFixed(1)} px</small></div>`).join('')||'<div class="mb"><span>No slimes left. The pools keep flowing and fuming.</span></div>';
      setHud(root,`${S.length} slime${S.length===1?'':'s'} · acid ${r.total().toFixed(0)} u${msg?' · '+msg:''}`);}}};});

// ======================================================================
// FIG 17: engulf and digest, with visible contents
// ======================================================================
reg('engulf',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root);let r,s,its,t=0,fr=0,target=null,dead=0;
  function reset(){r=Room(W,H,{tile:16,seed:41,react:6});its=[r.item('crate',22,14),r.item('bones',64,56),r.item('sword',108,20),r.item('gold',132,58)];
    its.forEach(it=>{let x0=1e9,y0=1e9,x1=0,y1=0;for(const i of it.px){const x=i%W,y=(i/W)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}it.bb=[x0,y0,x1,y1];it.n=it.px.length;it.since=-1;it.cx=(x0+x1)/2;it.cy=(y0+y1)/2;});
    s=newSlime(80,44,18);target=null;dead=0;}
  reset();c.btn('reset',reset);
  c.btn('kill',()=>{if(!s)return;burstSlime(r,s,srad(s));s=null;dead=0;});
  const alive=it=>it.px.some(i=>r.M[i]>=M_WOOD);
  return {tick(dt){t+=dt;fr++;
    if(s){s.t-=dt;if(s.t<=0){s.t=2+rnd()*3;let best=null,bd=90;for(const it of its){if(it.kind==='gold'||!alive(it))continue;const d=Math.hypot(it.cx-s.x,it.cy-s.y);if(d<bd){bd=d;best=it;}}
        if(best&&rnd()<.75){target=best;s.tx=best.cx;s.ty=best.cy+4;}else{target=null;s.tx=clamp(s.x+(rnd()-.5)*70,12,W-12);s.ty=clamp(s.y+(rnd()-.5)*40,14,H-6);}}
      hopTo(s,dt,s.tx,s.ty);s.x=clamp(s.x,8,W-8);s.y=clamp(s.y,12,H-4);
      for(const it of its){const [x0,y0,x1,y1]=it.bb;const inside=s.x>x0-2&&s.x<x1+2&&s.y-3>y0-2&&s.y-3<y1+4;if(inside&&it.since<0)it.since=t;if(!inside)it.since=-1;}
      const grace=c.v('timer');const ok=!grace||its.some(it=>it.since>=0&&t-it.since>3);if(ok)s.mass+=digest(r,s,2.2);if(s.mass>60)s.mass=60;slimeTrail(r,s);}
    else{dead+=dt;if(dead>5)reset();}
    r.step({evapMul:2});r.updParts(dt);const u=px.u32;r.render(u,t);r.drawParts(u);if(s)drawSlimes(r,u,[s],fr);px.put();
    if(fr%8===0){const parts=its.map(it=>{let q=0;for(const i of it.px)if(r.M[i]>=M_WOOD)q+=r.Q[i];const p=Math.round(q/it.n*100);
        const g=s&&it.since>=0?(c.v('timer')&&t-it.since<3?` <i>engulfed, digest in ${(3-(t-it.since)).toFixed(1)} s</i>`:' <i>inside</i>'):'';return `${it.kind} <b>${p} %</b>${it.kind==='gold'?' (ignored)':''}${g}`;});
      ro.innerHTML=parts.join(' · ');setHud(root,s?`slime mass ${s.mass.toFixed(1)}${target?' · heading for the '+target.kind:''}`:'Burst: whatever was inside drops back to the floor');}}};});

// ======================================================================
// FIG 18: fume grid (Sandbox rule vs SPD average-minus-one)
// ======================================================================
reg('fumes',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);const r=Room(W,H,{tile:16,seed:51,react:3});const GW=r.GW,GH=r.GH;
  r.wall(0,0,W,8);r.wall(70,40,6,30);const plate=r.item('armor',116,58);const PD=plate.px.map(i=>[i,r.M[i],r.ROLE[i]]);r.spill(116,66,12,1.4);
  let rule='sbx',t=0,fr=0;const GI=new Int16Array(GW*GH),GI2=new Int16Array(GW*GH);c.seg('rule',v=>{rule=v;GI.fill(0);r.G.fill(0);});
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag'){const gx=x>>1,gy=y>>1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=gx+dx,Y=gy+dy;if(X<1||Y<1||X>=GW-1||Y>=GH-1)continue;const k2=Y*GW+X;
      if(rule==='sbx')r.G[k2]+=k==='down'?1.4:.4;else GI[k2]+=k==='down'?60:20;}}});
  const open=k=>{const x=(k%GW)*2,y=((k/GW)|0)*2;return r.M[y*W+x]!==M_WALL;};
  function spd(){for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){const k=y*GW+x;if(!open(k)){GI2[k]=0;continue;}let s=GI[k],n=1;for(const j of [k-1,k+1,k-GW,k+GW])if(open(j)){s+=GI[j];n++;}GI2[k]=s>=n?Math.floor(s/n)-1:0;}GI.set(GI2);}
  let acc=0;
  return {tick(dt){t+=dt;fr++;
    if(c.v('src')){let alive=0;for(const i of plate.px)if(r.M[i]>=M_WOOD)alive++;if(alive<20){for(const [i,m,ro] of PD){r.M[i]=m;r.ROLE[i]=ro;r.Q[i]=1;r.RU[i]=0;}}
      if(r.total()<25)r.spill(116,66,11,1.3);}
    if(rule==='sbx'){r.step({drift:c.v('drift')});}else{r.step({gas:false});acc+=dt;if(acc>.1){acc=0;for(let k=0;k<GW*GH;k++){if(r.G[k]>.02){GI[k]+=Math.round(r.G[k]*40);r.G[k]=0;}}spd();}}
    r.updParts(dt);const u=px.u32;r.render(u,t,{haze:false});r.drawParts(u);
    let peak=0,harm=0;const G=r.G,harmOn=c.v('harm');
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=(y>>1)*GW+(x>>1);const g=rule==='sbx'?G[k]:GI[k]/40;if(r.M[i]===M_WALL)continue;
      if(g>.02&&g*14>bay(x,y)+1)u[i]=hazeC(u[i]);
      if(harmOn&&g>.3){const gl=rule==='sbx'?G[k-1]:GI[k-1]/40,gu=rule==='sbx'?G[k-GW]:GI[k-GW]/40;if(((x&1)===0&&gl<=.3)||((y&1)===0&&gu<=.3))u[i]=C32('#ff6b5e');}}
    for(let k=0;k<GW*GH;k++){const g=rule==='sbx'?G[k]:GI[k]/40;if(g>peak)peak=g;if(g>.3)harm++;}
    px.put();if(fr%8===0)setHud(root,rule==='sbx'?`peak ${peak.toFixed(2)} · haze from 0.07 · harm from 0.3: ${harm} cells`:`SPD integers: peak ${Math.round(peak*40)} · −1 per step evaporates`);}};});

// ======================================================================
// FIG 19: drying ring + lime neutralisation with salt
// ======================================================================
reg('ring',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root);const W=A.W,H=A.H;let r1,r2,t1=0,fr2=0,limed=false;
  function reset(){r1=Room(W,H,{tile:16,seed:61});r2=Room(W,H,{tile:16,seed:62});r1.spill(48,36,12,1.0);r2.spill(48,36,12,1.0);t1=0;limed=false;
    for(let k=0;k<200;k++){r1.step({evap:false,gas:false,samples:0});r2.step({evap:false,gas:false,samples:0});}}
  reset();c.btn('reset',reset);
  pointer(cvs[1],([x,y],k)=>{if(k==='down'||k==='drag'){limed=true;r2.lime(x,y,7);}});
  const vis=(r,i)=>r.ST[i]>r.BY[i]*9+18;
  if(reduce){for(let k=0;k<2400;k++)r1.step();}
  return {tick(dt){const tx=c.v('tx');c.out('tx',tx+'×');for(let k=0;k<tx;k++){r1.step();r2.step();t1+=1/60;if(!limed&&t1>12){limed=true;r2.lime(42,32,7);r2.lime(54,40,7);}}r1.updParts(dt);r2.updParts(dt);
    const xr=c.v('xr');for(const [r,P] of [[r1,A],[r2,B]]){const u=P.u32;r.render(u,t1);r.drawParts(u);if(xr)for(let i=0;i<r.N;i++)if(r.M[i]!==M_WALL&&r.A[i]===0)u[i]=r.SALT[i]?mix32(PAL.SALT,HEAT[0],.2):HEAT[Math.min(255,r.ST[i]*3)];P.put();}
    if((fr2=(fr2+1)%8)===0){let s1=0,s2=0,sa=0;for(let i=0;i<r1.N;i++){if(vis(r1,i))s1++;if(vis(r2,i))s2++;if(r2.SALT[i]>r2.BY[i]*12+8)sa++;}
      const mm=Math.floor(t1/60),ss=String(Math.floor(t1%60)).padStart(2,'0');
      setHud(root,`t ${mm}:${ss} · acid ${r1.total().toFixed(0)} u · stain ${s1} px`);root.querySelector('[data-hud2]').textContent=`acid ${r2.total().toFixed(0)} u · salt ${sa} px · stain ${s2} px`;}}};});
