// ======================================================================
// E1: Stardew canopy fade (alpha +0.05 per tick, −0.09 inside the rect, floor 0.4) vs dither vs whole layer
// ======================================================================
reg('fade',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),svg=$('svg.chart',root),ovl=$('svg.ovl',root),ro=$('[data-ro]',root);const TS=16;
  const trees=[{x:56,y:90,sp:0,v:5},{x:104,y:70,sp:1,v:4}].map(t=>({...t,ph:1,off:0,shake:0,a:1}));
  const G=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)G[y*W+x]=groundCol(.55,.6,3,1,.4,x,y);
  // the 3 × 4.5-tile rect, from 1 tile left of and 5 tiles above the trunk tile
  const rectOf=t=>{const tx=Math.floor(t.x/TS),ty=Math.floor(t.y/TS);return [(tx-1)*TS,(ty-5)*TS,3*TS,4.5*TS];};
  const r0=rectOf(trees[0]);svgEl('rect',{x:r0[0],y:r0[1],width:r0[2],height:r0[3],fill:'rgba(240,194,90,.08)',stroke:'#f0c25a','stroke-dasharray':'2 2','stroke-width':.6},ovl);
  const WP=[[20,24],[60,30],[60,60],[20,60],[110,90],[124,40]];let wp=0,wait=0;const p=newWalker(20,24);let tgt=null;
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag')tgt=[x,y];});
  const hist=[];let acc=0,inside=false,tIn=0,tOut=0,firstFloor=-1,firstFull=-1,tick=0,exited=false;
  const path=svgEl('path',{class:'s1'},svg);svgEl('line',{x1:0,y1:10+(1-.4)*70,x2:240,y2:10+(1-.4)*70,stroke:'#f0c25a','stroke-dasharray':'3 3'},svg);svgText(svg,236,10+(1-.4)*70-3,'floor 0.4',{'text-anchor':'end','font-size':6.5});
  svgText(svg,4,8,'alpha of the front crown, last 240 ticks',{'font-size':6.5});
  return {tick(dt){const slow=c.v('slow')?.25:1,mode=c.segv('mode');
    if(tgt){const dx=tgt[0]-p.x,dy=tgt[1]-p.y;if(Math.hypot(dx,dy)<1.5){tgt=null;}else walkerStep(p,dx,dy,40*slow,dt);}
    else if(wait>0){wait-=dt*slow;p.moving=false;p.anim=0;}else{const [tx,ty]=WP[wp];const dx=tx-p.x,dy=ty-p.y;if(Math.hypot(dx,dy)<1.5){wp=(wp+1)%WP.length;wait=.6;}else walkerStep(p,dx,dy,34*slow,dt);}
    acc+=dt*60*slow;while(acc>=1){acc--;tick++;const pb=[p.x-3,p.y-11,7,12];
      for(const t of trees){const R=rectOf(t);const hit=pb[0]<R[0]+R[2]&&pb[0]+pb[2]>R[0]&&pb[1]<R[1]+R[3]&&pb[1]+pb[3]>R[1];t.hit=hit;t.a=Math.min(1,t.a+.05);if(hit)t.a=Math.max(.4,t.a-.09);}
      const t0=trees[0];if(t0.hit&&!inside){inside=true;tIn=tick;firstFloor=-1;}if(!t0.hit&&inside){inside=false;tOut=tick;firstFull=-1;exited=true;}
      if(inside&&firstFloor<0&&t0.a<=.4+1e-9)firstFloor=tick-tIn+1;if(!inside&&exited&&firstFull<0&&t0.a>=1)firstFull=tick-tOut+1;
      hist.push(t0.a);if(hist.length>240)hist.shift();}
    const u=F.u32;u.set(G);const anyHit=trees.some(t=>t.hit);
    drawForest(u,W,H,trees,{season:1,time:performance.now()/1000,wind:.3,player:p,occ:'none',fadeMode:mode==='alpha'||mode==='layer'?'alpha':'dither',
      fadeOf:t=>mode==='layer'?Math.min(...trees.map(q=>q.a)):mode==='twin'?(t.hit?.5:1):t.a});
    F.put();let d='';hist.forEach((a,i)=>{d+=(i?'L':'M')+i+','+(10+(1-a)*70).toFixed(1);});path.setAttribute('d',d);
    ro.innerHTML=`alpha <b>${trees[0].a.toFixed(2)}</b> · last fade 1.0 → 0.4: <b>${firstFloor>0?firstFloor+' ticks':'–'}</b> · last return 0.4 → 1.0: <b>${firstFull>0?firstFull+' ticks':'–'}</b> · ${mode==='layer'?'whole layer: every tree fades together':mode==='twin'?'Sandbox: a pre-dithered 50 % twin, on or off':mode==='dither'?'Bayer 4×4 keeps alpha × 16 of every 16 pixels':'true alpha leaves the palette'}`;}};});

// ======================================================================
// E5: shade ellipse + sunflecks; merged vs stacked shadows; sunfleck size from gap height
// ======================================================================
reg('shade',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),K=PX(cvs[1]),c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root);const W=F.W,H=F.H;
  const trees=[{x:40,y:56,sp:0,v:4},{x:62,y:62,sp:1,v:3},{x:100,y:84,sp:0,v:5},{x:118,y:44,sp:3,v:2}].map(t=>({...t,ph:rnd()*6,off:0,shake:0}));
  const G=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)G[y*W+x]=groundCol(.55,.55,3,1,.2,x,y);
  const p=newWalker(20,80);let tgt=null,auto=0;const WP=[[20,80],[50,58],[80,64],[104,86],[122,48],[70,30]];let wp=0;pointer(cvs[0],([x,y],k)=>{if(k==='down'||k==='drag'){tgt=[x,y];auto=4;}});
  let time=0;
  return {tick(dt){time+=dt;if(tgt){const dx=tgt[0]-p.x,dy=tgt[1]-p.y;if(Math.hypot(dx,dy)<1.5)tgt=null;else walkerStep(p,dx,dy,36,dt);}else if(auto>0){auto-=dt;p.moving=false;}
      else{const [tx,ty]=WP[wp];const dx=tx-p.x,dy=ty-p.y;if(Math.hypot(dx,dy)<1.5)wp=(wp+1)%WP.length;else walkerStep(p,dx,dy,20,dt);}
    const u=F.u32;u.set(G);const merged=c.v('merge');let inSh=false;
    for(const t of trees){const S=spr(t.sp,t.v,1),sh=treeShadow(t,S);if(((p.x-sh.cx)/sh.rx)**2+((p.y-sh.cy)/sh.ry)**2<1)inSh=true;if(!merged)stackEllipse(u,W,H,sh.cx,sh.cy,sh.rx,sh.ry,sh.a);}
    const r=drawForest(u,W,H,trees,{season:1,time,wind:.4,player:p,occ:'none',dapple:c.v('fleck'),shadows:merged,inShade:c.v('shadeOn')?inSh:false});r.inShade=inSh;
    F.put();
    // sunfleck physics
    const h=c.v('gap'),el=c.v('el'),div=c.v('nsta')?100:108,ex=c.v('ex');const dm=h/div,px=dm*32,stretch=1/Math.sin(el*Math.PI/180);const shown=ex?Math.max(px,3+Math.min(3,px)):px;
    const v=K.u32;v.fill(U('#3a4a2a'));const cx=K.W/2,cy=K.H/2,rx=shown*stretch/2,ry=shown/2;for(let y=0;y<K.H;y++)for(let x=0;x<K.W;x++){if(((x+.5-cx)/Math.max(.5,rx))**2+((y+.5-cy)/Math.max(.5,ry))**2<=1)v[y*K.W+x]=U('#f6ecb0');}
    for(let x=0;x<K.W;x+=8)for(let y=0;y<K.H;y++)v[y*K.W+x]=mix32(v[y*K.W+x],U('#0d120c'),.25);K.put();
    svg.innerHTML='';svgEl('rect',{x:0,y:10,width:240,height:14,fill:'#2c4a24'},svg);svgEl('rect',{x:116,y:10,width:8,height:14,fill:'#0a0f09'},svg);svgEl('rect',{x:0,y:104,width:240,height:6,fill:'#5a4a30'},svg);
    const ax=Math.cos(el*Math.PI/180)*(94/Math.max(.2,Math.tan(el*Math.PI/180)))*.0;const sp=Math.max(3,shown*stretch*2);
    svgEl('path',{d:`M118,24 L${120-sp/2},104 L${120+sp/2},104 L122,24 Z`,fill:'rgba(246,236,176,.35)',stroke:'#f0c25a','stroke-width':.6},svg);
    svgText(svg,128,20,'gap',{'font-size':7});svgText(svg,4,64,`gap height ${h} m`,{'font-size':7});svgText(svg,236,100,'fleck',{'text-anchor':'end','font-size':7});
    ro.innerHTML=`player ${r.inShade?'<b>in shade</b>: RGB × (0.58, 0.64, 0.74)':'in sun'} · fleck width = ${h} m / ${div} = <b>${(dm*100).toFixed(1)} cm</b> = <b>${px.toFixed(1)} px</b> at 32 px/m${ex?` → drawn ${shown.toFixed(1)} px (artists exaggerate to 3–6)`:''} · sun ${el}° stretches it ×${stretch.toFixed(2)}`;
    c.out('gap',h+' m');c.out('el',el+'°');}};});

// ======================================================================
// E4 + E6: trunk collision, soft bushes, rustle, trampled grass with regrowth, shake and fell
// ======================================================================
reg('touch',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root);const GT=8;
  const trees=[{x:46,y:50,sp:0,v:5},{x:116,y:42,sp:4,v:3}].map(t=>({...t,ph:1,off:0,shake:0,rot:0,fall:null,stump:false}));
  const bushes=[[70,70],[86,78],[100,66],[30,84],[140,86],[60,30]].map(([x,y],k)=>({x,y,sp:SI.Shrub,v:k%6,ph:k,off:0,shake:0,u:1,cool:0}));
  const GW=W/GT,GH=H/GT,grass=new Float32Array(GW*GH);for(let i=0;i<grass.length;i++){const x=i%GW,y=(i/GW)|0;grass[i]=vnoise(x/3,y/3)>.45&&!(x>3&&x<8&&y<7)?1:0;}
  const tall=new Uint8Array(grass.length);for(let i=0;i<grass.length;i++)tall[i]=grass[i];
  const G=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)G[y*W+x]=groundCol(.55,.55,3,1,.2,x,y);
  const tuft=[U('#5e9a3e'),U('#86bc4c'),U('#3e7432')];
  const p=newWalker(12,60);let tgt=null,idle=0;const WP=[[12,60],[80,74],[150,70],[150,20],[90,24],[52,56],[20,30]];let wp=1;
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag'){tgt=[x,y];idle=5;}});
  const parts=[];let trampled=0,turnAcc=0,wood=0,blocks=0,time=0;
  const trunkR=t=>t.stump?3:(SPECIES[t.sp].kind==='broad'?3:2);
  const blocked=(x,y)=>{if(x<2||y<12||x>W-2||y>H-1)return true;for(const t of trees){if(t.gone&&!t.stump)continue;const r=trunkR(t),dx=x-t.x,dy=(y-t.y)*1.7;if(dx*dx+dy*dy<(r+2)*(r+2)){return true;}}return false;};
  const burst=(x,y,n,col)=>{for(let k=0;k<n;k++)parts.push({x:x+(rnd()-.5)*8,y,z:3+rnd()*6,vx:(rnd()-.5)*14,vz:4+rnd()*6,life:2,col});};
  const nearest=()=>{let b=null,bd=1e9;for(const t of trees){if(t.gone)continue;const d=Math.hypot(t.x-p.x,t.y-p.y);if(d<bd){bd=d;b=t;}}return b;};
  c.btn('shake',()=>{const t=nearest();if(!t)return;t.shake=1;const S=spr(t.sp,t.v,1);for(let k=0;k<10;k++)burst(t.x,t.y-S.h*.5,1,SPECIES[t.sp].leaf[1][(rnd()*3)|0]);});
  c.btn('fell',()=>{const t=nearest();if(!t||t.fall)return;t.fall={max:0,rot:0,dir:p.x<t.x?1:-1};});
  c.btn('regrow',()=>{for(const t of trees){t.gone=false;t.stump=false;t.fall=null;t.rot=0;}});
  return {tick(dt){time+=dt;let slow=1;
    for(const b of bushes){b.cool-=dt;const dx=p.x-b.x,dy=(p.y-b.y)*1.6;if(dx*dx+dy*dy<40){slow=.7;if(p.moving&&b.cool<=0){b.shake=.55;b.cool=.5;burst(b.x,b.y-4,2+((rnd()*5)|0),L.oakSu[(rnd()*3)|0]);}}b.shake*=Math.pow(.25,dt);}
    let mx=0,my=0;if(tgt){mx=tgt[0]-p.x;my=tgt[1]-p.y;if(Math.hypot(mx,my)<1.5){tgt=null;mx=my=0;}}else if(idle>0){idle-=dt;}else{const [tx,ty]=WP[wp];mx=tx-p.x;my=ty-p.y;if(Math.hypot(mx,my)<2)wp=(wp+1)%WP.length;}
    const ox=p.x,oy=p.y;walkerStep(p,mx,my,42*slow,dt,blocked);if((mx||my)&&!p.moving){blocks++;if(!tgt&&idle<=0)wp=(wp+1)%WP.length;}
    // SPD: stepping on high grass tramples it and bursts 4 leaves; Brogue: regrows at 1 % per turn
    const gi=((p.y/GT)|0)*GW+((p.x/GT)|0);if(gi>=0&&gi<grass.length&&tall[gi]&&grass[gi]>.5){grass[gi]=0;trampled++;burst(p.x,p.y,4,tuft[(rnd()*3)|0]);}
    turnAcc+=dt;while(turnAcc>=.25){turnAcc-=.25;for(let i=0;i<grass.length;i++)if(tall[i]&&grass[i]<1&&rnd()<.01)grass[i]=1;}
    for(const t of trees){t.shake*=Math.pow(.25,dt);if(t.fall){const f=t.fall;f.max+=.0015*dt*60;f.rot+=f.max*f.max*dt*60;t.rot=f.dir*f.rot;if(f.rot>=Math.PI/2){t.fall=null;t.rot=0;t.gone=true;t.stump=true;wood+=12+((rnd()*5)|0);}}
      else if(!t.gone){const young=t.v<2;t.rot=(young?Math.PI/64:Math.PI/128)*t.shake*Math.sin(time*30)*4;}}
    const u=F.u32;u.set(G);
    for(let i=0;i<grass.length;i++){if(!tall[i])continue;const x0=(i%GW)*GT,y0=((i/GW)|0)*GT,hgt=grass[i]>.5?4:1;for(let k=0;k<6;k++){const x=x0+1+((hash2(i,k)*6)|0),y=y0+2+((hash2(k,i)*5)|0);for(let q=0;q<hgt;q++){const yy=y-q;if(yy>=0&&x<W)u[yy*W+x]=tuft[(k+q)%3];}}}
    const draw=[];for(const t of trees){if(t.gone){if(t.stump)draw.push([t.y,()=>{for(let dx=-3;dx<=3;dx++)for(let dy=-2;dy<=0;dy++){const x=t.x+dx,y=t.y+dy;if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=dy===-2?U('#c8a070'):SPECIES[t.sp].bark[dx<0?0:1];}}]);continue;}
      draw.push([t.y,()=>{const S=spr(t.sp,t.v,1);const sh=treeShadow(t,S);const fa=t.fall?Math.max(0,1-t.fall.rot/(Math.PI/2)):1;stackEllipse(u,W,H,sh.cx,sh.cy,sh.rx,sh.ry,sh.a*fa);
        if(Math.abs(t.rot)>1e-4)blitRot(u,W,H,S,t.x-S.ax,t.y-S.h+1,t.rot);else blit(u,W,H,S,t.x-S.ax,t.y-S.h+1,{});}]);}
    for(const b of bushes)draw.push([b.y,()=>{const S=spr(b.sp,b.v,1);blit(u,W,H,S,b.x-S.ax,b.y-S.h+1,{sw:b.shake*Math.sin(time*30)*2.6});}]);
    draw.push([p.y+.5,()=>drawPlayer(u,W,H,p,0,0)]);draw.sort((a,b)=>a[0]-b[0]).forEach(d=>d[1]());
    if(c.v('col')){for(const t of trees){if(t.gone&&!t.stump)continue;const r=trunkR(t)+2;for(let a=0;a<6.283;a+=.2){const x=Math.round(t.x+Math.cos(a)*r),y=Math.round(t.y+Math.sin(a)*r/1.7);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=U('#ff6b5e');}}
      for(const b of bushes)for(let a=0;a<6.283;a+=.3){const x=Math.round(b.x+Math.cos(a)*6.3),y=Math.round(b.y+Math.sin(a)*6.3/1.6);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=U('#6dd4c3');}}
    for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.life-=dt;q.x+=q.vx*dt;q.z-=q.vz*dt;if(q.z<=0||q.life<=0){parts.splice(i,1);continue;}const x=Math.round(q.x),y=Math.round(q.y-q.z);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=q.col;}
    F.put();let tg=0,tt=0;for(let i=0;i<grass.length;i++)if(tall[i]){tt++;if(grass[i]<.5)tg++;}const t0=trees[0];
    ro.innerHTML=`speed ${slow<1?'<b>×0.7 in a bush</b>':'×1'} · blocked by a trunk ${blocks} times · trampled now ${tg}/${tt} tufts (regrow 1 % per 0.25 s turn) · shake angle ${(Math.abs(t0.rot)).toFixed(3)} rad · wood ${wood}`;}};});

// ======================================================================
// F1: perched birds that check every 200 ms and flee within a radius
// ======================================================================
reg('flee',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root);const TS=16;
  const trees=buildForest(W,H+28,{seed:23,biome:4,densMul:1.1,und:false});const G=bakeGround(W,H,trees,1,()=>BIOME_TM[4],{bio:4});
  const KINDS={birdie:{n:'Birdie',r:4,c:['#7a5a3a','#d8c8a8']},wood:{n:'Woodpecker',r:6,c:['#c8403a','#2a2a2a']},song:{n:'Songbird',r:3,c:['#3a6ac8','#e8a060']},gull:{n:'Gull',r:4,c:['#e8eef6','#7a8a9a']},crow:{n:'Crow',r:5,c:['#24232b','#3e3d48']},heron:{n:'Heron',r:7,c:['#9aa8b8','#d8e0e8']}};
  let preset='stardew',birds=[];
  const spawn=()=>{birds=[];const ks=preset==='stardew'?['birdie','birdie','birdie','birdie','wood','birdie']:['song','song','gull','crow','crow','heron'];const r=mkRng(5);
    ks.forEach((k,i)=>{const x=20+r()*(W-40),y=30+r()*(H-40);birds.push({k,x,y,hx:x,hy:y,state:'ground',chk:r()*.2,delay:-1,vx:0,vy:0,z:0,t:0,peck:r()*2});});};
  c.seg('preset',v=>{preset=v;spawn();});spawn();
  const p=newWalker(10,H-14);let tgt=null,idle=0;const WP=[[10,H-14],[W-20,H-30],[W-30,20],[30,30]];let wp=1;
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag'){tgt=[x,y];idle=6;}});
  let time=0,checks=0;
  return {tick(dt){time+=dt;const mode=c.segv('gait'),mul=mode==='run'?1.5:mode==='sneak'?.6:1,spd=mode==='run'?60:mode==='sneak'?18:36;
    let mx=0,my=0;if(tgt){mx=tgt[0]-p.x;my=tgt[1]-p.y;if(Math.hypot(mx,my)<1.5){tgt=null;mx=my=0;}}else if(idle>0)idle-=dt;else{const [tx,ty]=WP[wp];mx=tx-p.x;my=ty-p.y;if(Math.hypot(mx,my)<2)wp=(wp+1)%WP.length;}
    walkerStep(p,mx,my,spd,dt);
    for(const b of birds){const K=KINDS[b.k],R=K.r*TS*mul;
      if(b.state==='ground'){b.chk-=dt;b.peck-=dt;if(b.peck<=0)b.peck=1+rnd()*2;if(b.chk<=0){b.chk+=.2;checks++;if(b.delay<0&&Math.hypot(b.x-p.x,b.y-p.y)<R)b.delay=.05+rnd()*.2;}
        if(b.delay>=0){b.delay-=dt;if(b.delay<0){b.state='fly';const dx=b.x-p.x,dy=b.y-p.y,L=Math.hypot(dx,dy)||1;b.vx=dx/L*55;b.vy=dy/L*40-20;b.t=3+rnd()*3;b.delay=-1;}}}
      else if(b.state==='fly'){b.x+=b.vx*dt;b.y+=b.vy*dt;b.z=Math.min(30,b.z+40*dt);b.t-=dt;if(b.t<=0){let tx,ty,tries=0;do{tx=16+rnd()*(W-32);ty=24+rnd()*(H-32);tries++;}while(Math.hypot(tx-p.x,ty-p.y)<R+20&&tries<30);b.hx=tx;b.hy=ty;b.state='land';}}
      else{const dx=b.hx-b.x,dy=b.hy-b.y,L=Math.hypot(dx,dy);if(L<1.5&&b.z<1){b.state='ground';b.z=0;b.chk=.2;}else{const s=Math.min(45,L*2+10);b.x+=dx/(L||1)*s*dt;b.y+=dy/(L||1)*s*dt;b.z=Math.max(0,Math.min(b.z,L*.5));}}}
    const u=F.u32;drawForest(u,W,H,trees,{ground:G,season:1,time,wind:.3,player:p,occ:'dither',dapple:false,
      underlay:fb=>{if(c.v('rad'))for(const b of birds){if(b.state!=='ground')continue;const R=KINDS[b.k].r*TS*mul;for(let a=0;a<6.283;a+=1.5/R){const x=Math.round(b.x+Math.cos(a)*R),y=Math.round(b.y+Math.sin(a)*R);if(x>=0&&y>=0&&x<W&&y<H&&((x+y)&1))fb[y*W+x]=mix32(fb[y*W+x],U('#f0c25a'),.85);}}
        for(const b of birds){if(b.state==='ground')drawBirdPerch(fb,W,H,b.x,b.y-(b.peck<.15?1:0),U(KINDS[b.k].c[0]),U(KINDS[b.k].c[1]));}}});
    for(const b of birds){if(b.state==='ground')continue;for(let q=-1;q<=1;q++){const x=Math.round(b.x+q),y=Math.round(b.y);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=mix32(u[y*W+x],SHADOWC,.35);}drawBirdFly(u,W,H,b.x,b.y-b.z,Math.sin(time*14+b.hx)>0?0:1,U(KINDS[b.k].c[0]));}
    F.put();const ground=birds.filter(b=>b.state==='ground').length;
    ro.innerHTML=`${ground} on the ground · ${birds.length-ground} in the air · ${checks} distance checks so far (5 per second per bird) · radius ×${mul} (${mode}) · `+[...new Set(birds.map(b=>b.k))].map(k=>`${KINDS[k].n} ${KINDS[k].r} tiles`).join(', ');}};});

// ======================================================================
// G1 + G2 + G6: one atlas, one material, instance uniforms; variety multipliers
// ======================================================================
reg('atlas',root=>{const cvs=$$('canvas',root),Sc=PX(cvs[0]),c=ctl(root),bars=$('[data-dc]',root),ro=$('[data-ro]',root),mult=$('.mult',root),acv=cvs[1],atl=$('[data-atlasinfo]',root);
  const W=Sc.W,H=Sc.H;const trees=buildForest(W,H+28,{seed:61,biome:1,und:true});const G=bakeGround(W,H,trees,1,()=>BIOME_TM[1],{bio:1});
  const BC=['#f0c25a','#6dd4c3','#c9a2ff','#ff6b5e','#a8d46c','#ffa070','#7ab89a','#e6f59a','#f39abc','#5ab0ff'].map(U);
  let lx=W*.3,time=0;
  function batches(){const atlas=c.v('atlas'),dup=c.v('dup'),inst=c.v('inst'),lit=c.v('light'),mm=c.v('mm');const list=[];
    list.push({k:'ground',tex:'ground',mat:'ground',lit:0});list.push({k:'shadows',tex:'atlas',mat:'shadow',lit:0});
    if(mm)list.push({k:'mm',tex:'atlas',mat:'forest',lit:0,mm:1});
    const items=trees.filter(t=>!(mm&&t.u)).slice().sort((a,b)=>a.y-b.y);
    for(const t of items){const tex=atlas?'atlas':'sp'+t.sp;const mat=dup?'m'+t.x+'_'+t.y:(inst?'forest':'forest');const L=lit&&Math.abs(t.x-lx)<34?1:0;list.push({t,tex,mat,lit:L});}
    list.push({k:'birds',tex:'atlas',mat:'forest',lit:0});list.push({k:'ui',tex:'ui',mat:'ui',lit:0});
    let n=0,prev=null;for(const it of list){if(!prev||it.mm||prev.mm||it.tex!==prev.tex||it.mat!==prev.mat||it.lit!==prev.lit)n++;it.b=n;prev=it;}return {n,list};}
  // variety multipliers (G6)
  const MK=[['species',3],['flips',2],['tints',4],['stages',5],['seasons',4]];
  mult.innerHTML=MK.map(([k,v],i)=>`<label>${k}<input type="number" min="1" max="12" value="${v}" data-m="${k}"></label>${i<MK.length-1?'<span>×</span>':''}`).join('')+'<span>=</span><b data-mv></b>';
  const mv=()=>{const vals=MK.map(([k])=>+$(`[data-m="${k}"]`,mult).value||1);const tot=vals.reduce((a,b)=>a*b,1);$('[data-mv]',mult).textContent=tot+' variants from '+(vals[0]*vals[3])+' drawings';
    // atlas thumbnails: species × stages drawings, then flips, tints, seasons multiply them
    const sps=[0,4,2],stg=[.45,.6,.75,.9,1.05];const cells=[];for(let s=0;s<Math.min(4,vals[4]);s++)for(let a=0;a<Math.min(3,vals[0]);a++)for(let g=0;g<Math.min(5,vals[3]);g++)for(let f=0;f<Math.min(2,vals[1]);f++)for(let ti=0;ti<Math.min(4,vals[2]);ti++)cells.push([sps[a],stg[g],f,ti,s]);
    const cw=20,ch=24,cols=Math.min(40,cells.length),rows=Math.ceil(Math.min(cells.length,480)/cols);acv.width=cols*cw;acv.height=rows*ch;const g=acv.getContext('2d');const id=g.createImageData(acv.width,acv.height),uu=new Uint32Array(id.data.buffer);uu.fill(U('#18211a'));
    const TINT=[[1,1,1],[1.1,1.02,.85],[.85,.95,1.05],[1.05,.9,.9]];
    cells.slice(0,480).forEach(([si,sz,f,ti,s],i)=>{const key='at'+si+'_'+sz+'_'+s;let S=SPRC.get(key);if(!S){S=genSprite(SPECIES[si],5000+si*31+Math.round(sz*100),sz,s);SPRC.set(key,S);}
      const X=(i%cols)*cw+((cw-S.w)>>1),Y=((i/cols)|0)*ch+(ch-S.h);for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++){const col=S.px[y*S.w+(f?S.w-1-x:x)];if(!col)continue;const xx=X+x,yy=Y+y;if(xx<0||yy<0||xx>=acv.width||yy>=acv.height)continue;uu[yy*acv.width+xx]=ti?mulc(col,...TINT[ti]):col;}});
    g.putImageData(id,0,0);acv.style.width=(acv.width*2)+'px';atl.textContent=`${Math.min(cells.length,480)} variants shown (${acv.width}×${acv.height} px, ${(acv.width*acv.height*4/1024).toFixed(0)} KB RGBA) · 2048² RGBA would be 16 MB`;};
  mult.addEventListener('input',mv);mv();
  return {tick(dt){time+=dt;lx=W*.5+Math.sin(time*.5)*W*.38;const {n,list}=batches();const u=Sc.u32;const show=c.v('show');
    drawForest(u,W,H,trees,{ground:G,season:1,time,wind:.35,dapple:false,perTree:show?(t,X,Y,S)=>{const it=list.find(q=>q.t===t);if(!it)return;const col=BC[it.b%BC.length];
      for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++){if(!S.px[y*S.w+x])continue;const xx=X+x,yy=Y+y;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=mix32(u[yy*W+xx],col,.55);}}:null});
    if(c.v('light'))for(let a=0;a<6.283;a+=.08){const x=Math.round(lx+Math.cos(a)*34),y=Math.round(H/2+Math.sin(a)*34);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=U('#f0c25a');}
    Sc.put();const items=list.length;
    bars.innerHTML=[['This scene',n,n>50],['Target (§6e)',50,false],['Case study before',240,true],['Case study after',38,false],['Cornucopia before',2583,true],['Cornucopia after',3,false]].map(([l,v,hot])=>`<div class="dcbar"><span>${l}</span><i class="${hot?'hot':''}" style="width:${Math.min(100,Math.log10(v+1)/Math.log10(2600)*100)}%"></i><b>${v}</b></div>`).join('');
    ro.innerHTML=`${items} canvas items → <b>${n} draw calls</b> · ${c.v('dup')?'a material per tree silently breaks every batch':c.v('atlas')?'one texture':'one texture per species: batches break wherever species alternate in y order'}${c.v('light')?' · lit/unlit state splits batches near the light':''}${c.v('mm')?' · the undergrowth MultiMesh is its own batch':''}`;}};});

// ======================================================================
// G3 + G4 + G5: single y-sort root vs chunks at camera ± 1; culling grid; baked far chunks
// ======================================================================
reg('chunks',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root);const SC=8,WW=W*SC,WH=H*SC,CH=256,GS=64,VW=320,VH=180;
  const r=mkRng(77),pts=[];const cell=13;for(let gy=0;gy*cell<WH;gy++)for(let gx=0;gx*cell<WW;gx++){const x=(gx+.25+.5*r())*cell,y=(gy+.25+.5*r())*cell;const d=vnoise(x/260,y/260);if(r()<d*1.05-.12)pts.push([x,y]);}
  const BG=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [T,M]=[clamp(y/H*1.05-.04+(vnoise(x*SC/260+3,y*SC/260+9)-.5)*.32,0,1),clamp(vnoise(x*SC/300+17,y*SC/300+5)*1.1-.05+(x/W-.5)*.35,0,1)];BG[y*W+x]=mix32(U(BIOMES[biomeOf(T,M)].col),U('#0d120c'),.35);}
  let cam=[WW*.3,WH*.4],drag=false,auto=true,time=0;
  cv.addEventListener('pointerdown',e=>{drag=true;auto=false;mv(e);try{cv.setPointerCapture(e.pointerId);}catch(_){}});cv.addEventListener('pointermove',e=>{if(drag)mv(e);});cv.addEventListener('pointerup',()=>drag=false);
  const mv=e=>{const [x,y]=cellOf(cv,e);cam=[clamp(x*SC-VW/2,0,WW-VW),clamp(y*SC-VH/2,0,WH-VH)];};
  return {tick(dt){time+=dt;if(auto)cam=[clamp(WW*.5+Math.cos(time*.12)*WW*.36-VW/2,0,WW-VW),clamp(WH*.5+Math.sin(time*.17)*WH*.34-VH/2,0,WH-VH)];
    const mode=c.segv('mode'),bake=c.v('bake'),grid=c.v('grid');const u=F.u32;u.set(BG);
    const ccx=Math.floor((cam[0]+VW/2)/CH),ccy=Math.floor((cam[1]+VH/2)/CH);const act=(x,y)=>Math.abs(Math.floor(x/CH)-ccx)<=1&&Math.abs(Math.floor(y/CH)-ccy)<=1;
    const ring2=(x,y)=>Math.max(Math.abs(Math.floor(x/CH)-ccx),Math.abs(Math.floor(y/CH)-ccy))===2;
    let sorted=0,drawn=0,cells=0,bakedN=0;const g0x=Math.max(0,Math.floor((cam[0]-40)/GS)),g1x=Math.floor((cam[0]+VW+40)/GS),g0y=Math.max(0,Math.floor((cam[1]-8)/GS)),g1y=Math.floor((cam[1]+VH+80)/GS);cells=(g1x-g0x+1)*(g1y-g0y+1);
    for(let cy=0;cy*CH<WH;cy++)for(let cx=0;cx*CH<WW;cx++){const a=Math.abs(cx-ccx)<=1&&Math.abs(cy-ccy)<=1,b2=Math.max(Math.abs(cx-ccx),Math.abs(cy-ccy))===2;if(bake&&b2)bakedN++;
      const col=a?U('#2c4a24'):b2&&bake?U('#3a3a52'):0;if(col)for(let y=cy*CH/SC;y<Math.min(H,(cy+1)*CH/SC);y++)for(let x=cx*CH/SC;x<Math.min(W,(cx+1)*CH/SC);x++){const i=y*W+x;u[i]=mix32(u[i],col,.55);}}
    for(const [x,y] of pts){const inCam=x>cam[0]-40&&x<cam[0]+VW+40&&y>cam[1]-8&&y<cam[1]+VH+80;const isAct=act(x,y);if(mode==='single')sorted++;else if(isAct)sorted++;if(inCam)drawn++;
      const X=(x/SC)|0,Y=(y/SC)|0;u[Y*W+X]=inCam?U('#f0c25a'):(mode==='single'||isAct)?U('#a8d46c'):U('#4d6b3a');}
    for(let x=0;x<W;x+=CH/SC)for(let y=0;y<H;y++)u[y*W+x]=mix32(u[y*W+x],U('#e2ead8'),.25);for(let y=0;y<H;y+=CH/SC)for(let x=0;x<W;x++)u[y*W+x]=mix32(u[y*W+x],U('#e2ead8'),.25);
    if(grid)for(let gy=g0y;gy<=g1y;gy++)for(let gx=g0x;gx<=g1x;gx++){const x0=gx*GS/SC,y0=gy*GS/SC,s=GS/SC;for(let k=0;k<s;k++){for(const [xx,yy] of [[x0+k,y0],[x0,y0+k]])if(xx<W&&yy<H)u[yy*W+xx]=U('#ffd27a');}}
    const X0=Math.round(cam[0]/SC),Y0=Math.round(cam[1]/SC),X1=Math.round((cam[0]+VW)/SC),Y1=Math.round((cam[1]+VH)/SC);for(let x=X0;x<=X1;x++){u[Y0*W+x]=U('#ffffff');if(Y1<H)u[Y1*W+x]=U('#ffffff');}for(let y=Y0;y<=Y1&&y<H;y++){u[y*W+X0]=U('#ffffff');if(X1<W)u[y*W+X1]=U('#ffffff');}
    F.put();const cmp=sorted>1?Math.round(sorted*Math.log2(sorted)):0;
    ro.innerHTML=`${pts.length} trees in an illustrative 1280×960 world · <b>${sorted}</b> sorted per frame (≈ ${cmp.toLocaleString()} comparisons) · ${drawn} on screen after the per-sprite test · ${cells} grid cells read · ${mode==='single'?'one y-sort root sorts every visible descendant, on screen or not':'only chunks at camera ± 1 are visible'}${bake?` · ${bakedN} far chunks baked × 256 KB = ${(bakedN*.25).toFixed(1)} MB`:''}`;}};});
