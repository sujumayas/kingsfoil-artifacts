// Fire and smoke study: figures 1 (hero, doomfire, ancestors, agetable, timeline, flameloop, loopspeed, ramp, embers, puffs, dither)
// ======================================================================
// HERO: village edge. 40x23 tile fire CA at 4 Hz, flame loops, embers,
// 80x45 Bayer smoke, chimney puffs, rain, a fireball and a fire field.
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=320,H=180,tiers=$$('.hero-tiers button',root);
  const GW=40,GH=23,NC=GW*GH,GRASS=0,DRY=1,TREE=2,ROAD=3,STONE=4,WATER=5,HOUSE=6,RING=7;
  const NONE=0,IGN=1,BURN=2,EMB=3,ASH=4;
  const BASEP=[.15,.40,.25,0,0,0,0,0],BURNT=[3,2,12,0,0,0,0,0];
  const MAT=new Uint8Array(NC),ST=new Uint8Array(NC),TIM=new Uint8Array(NC),AGE=new Uint8Array(NC),REG=new Uint16Array(NC),FLD=new Uint8Array(NC),FLT=new Float32Array(NC);
  const MOI=new Float32Array(NC),STM=new Float32Array(NC);
  const HOUSES=[[2,2,5,4],[9,3,4,3]],CHIM={x:41,y:13},TORCH=[[36,63],[92,63],[148,63]],CAMP={x:60,y:110},MAGE={x:176,y:66};
  let seed=7,tick=0,acc=0,ms=0,scene=1,rain=false,windV=6,active=[],quiet=0,nextBall=0;
  const DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1],WF=new Float32Array(8);
  const setWind=V=>{windV=V;for(let k=0;k<8;k++){const th=Math.atan2(DY[k],DX[k]);WF[k]=Math.exp(V*(.045+.131*(Math.cos(th)-1)));}};
  const cellAt=(x,y)=>clamp(y>>3,0,GH-1)*GW+clamp(x>>3,0,GW-1);
  function layout(){for(let cy=0;cy<GH;cy++)for(let cx=0;cx<GW;cx++){const c=cy*GW+cx;let m=vnoise(cx/5.5+seed,cy/4.5)>.5?DRY:GRASS;
      if(cy<8)m=GRASS;if(cy===8)m=ROAD;if(cx===21&&cy>8&&cy<14)m=ROAD;
      if(cx>=25&&cy<=6&&hash2(cx+seed,cy)<.62)m=TREE;if(cy>9&&hash2(cx,cy+seed*3)<.035&&cx<28)m=TREE;
      const dx=(cx-33)/5.2,dy=(cy-17.5)/3.3;if(dx*dx+dy*dy<1)m=WATER;
      if(Math.abs(cx-7)<=1&&Math.abs(cy-13)<=1)m=RING;
      for(const [hx,hy,hw,hh] of HOUSES)if(cx>=hx&&cx<hx+hw&&cy>=hy&&cy<hy+hh)m=HOUSE;
      MAT[c]=m;}}
  // static ground texture per pixel
  const BASE=new Uint32Array(W*H);
  function paintBase(){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const m=MAT[cellAt(x,y)],h=hash2(x*3+1,y*7+2),i=y*W+x;let col;
      if(m===DRY)col=h<.12?FC.dry3:h<.3?FC.dry2:FC.dry;
      else if(m===ROAD)col=((x+(y>>2&1)*3)%7===0||y%4===0)?FC.road:h<.5?FC.road2:FC.road;
      else if(m===WATER)col=h<.1?FC.water2:FC.water;
      else if(m===RING){const dx=x-CAMP.x,dy=(y-CAMP.y)*1.6,d=Math.hypot(dx,dy);col=d<5?FC.dirt:d<9?(h<.5?FC.stone2:FC.stone):(h<.3?FC.grass2:FC.grass);}
      else col=h<.08?FC.grass3:h<.35?FC.grass2:FC.grass;
      if((m===GRASS||m===DRY)&&hash2(x,y*5)<.04&&y>0&&BASE[i-W])col=m===DRY?FC.dry2:FC.grass3;
      BASE[i]=col;}}
  function reset(){layout();paintBase();ST.fill(0);TIM.fill(0);AGE.fill(0);REG.fill(0);FLD.fill(0);MOI.fill(0);SM.fill(0);STM.fill(0);SS.fill(0);active=[];quiet=0;P.clear();puffs.length=0;}
  const canBurn=c=>BASEP[MAT[c]]>0&&ST[c]===NONE;
  function ignite(c){if(canBurn(c)){ST[c]=BURN;TIM[c]=BURNT[MAT[c]];AGE[c]=0;active.push(c);return true;}return false;}
  function simTick(){tick++;const nw=[];
    for(const c of active){if(ST[c]!==BURN)continue;const cx=c%GW,cy=(c/GW)|0;
      for(let k=0;k<8;k++){const nx=cx+DX[k],ny=cy+DY[k];if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(!canBurn(n))continue;
        const p=BASEP[MAT[n]]*(1-MOI[n])*WF[k]*((k&1)?.7:1);if(hashI(nx,ny,tick,seed)/4294967296<p){ST[n]=IGN;nw.push(n);}}
      AGE[c]++;if(rain&&hashI(cx,cy,tick,seed^0x5a17)/4294967296<.20+.03*AGE[c]){ST[c]=NONE;MOI[c]=1;STM[c]=1.2;continue;}
      if(--TIM[c]<=0){ST[c]=EMB;TIM[c]=4;}}
    for(const c of active)if(ST[c]===EMB&&--TIM[c]<=0){ST[c]=ASH;REG[c]=60+(hashI(c,0,tick,seed)%60);}
    for(const n of nw){ST[n]=BURN;TIM[n]=BURNT[MAT[n]];AGE[n]=0;}
    active=active.filter(c=>ST[c]===BURN||ST[c]===EMB).concat(nw);
    for(let c=0;c<NC;c++){if(ST[c]===ASH&&--REG[c]===0)ST[c]=NONE;MOI[c]=rain?Math.min(.85,MOI[c]+.04):Math.max(0,MOI[c]-.01);
      if(FLD[c]&&(FLT[c]-=.25)<=0){FLD[c]--;FLT[c]=3;}}
    quiet=active.length?0:quiet+1;}
  // smoke and steam fields, 80x45 (4 px cells)
  const FW=80,FH=45,FN=FW*FH;let SM=new Float32Array(FN),SM2=new Float32Array(FN),SS=new Float32Array(FN),SS2=new Float32Array(FN);
  function smokeStep(dt){for(const c of active){const cx=c%GW,cy=(c/GW)|0,tr=MAT[c]===TREE,k=Math.max(0,cy*2-(tr?3:1))*FW+cx*2+1;SM[k]+=ST[c]===BURN?(tr?.30:.10):.03;}
    for(let c=0;c<NC;c++)if(STM[c]>0){SS[((c/GW)|0)*2*FW+(c%GW)*2+1]+=.45;STM[c]-=dt;}
    for(let c=0;c<NC;c++)if(FLD[c])SM[((c/GW)|0)*2*FW+(c%GW)*2+1]+=.04*FLD[c];
    SM[((CAMP.y-8)>>2)*FW+(CAMP.x>>2)]+=.05;
    const ux=windV*.55,uy=-3.2;
    for(let y=0;y<FH;y++){const tu=ux+Math.sin(y*.5+ms*.0016)*.6;for(let x=0;x<FW;x++){const sx=x-tu*dt,sy=y-(uy+Math.sin(x*.45+ms*.0012)*.4)*dt,x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;let a=0,b=0;
      for(let q=0;q<4;q++){const xx=x0+(q&1),yy=y0+(q>>1);if(xx<0||yy<0||xx>=FW||yy>=FH)continue;const w=((q&1)?fx:1-fx)*((q>>1)?fy:1-fy),kk=yy*FW+xx;a+=SM[kk]*w;b+=SS[kk]*w;}
      const k=y*FW+x;SM2[k]=Math.min(2.2,a*.986);SS2[k]=Math.min(2,b*.94);}}
    let t=SM;SM=SM2;SM2=t;t=SS;SS=SS2;SS2=t;}
  // chimney puffs (Stardew numbers, art px at 60 updates/s: rise 0.125, accel 0.0005, fade 0.002)
  const puffs=[];let puffT=0;
  // ember pool
  const P=mkPool(256);
  // fireball and explosion
  let ball=null;const booms=[];
  function throwBall(tx,ty){if(ball)return;const d=Math.hypot(tx-MAGE.x,ty-MAGE.y);ball={x0:MAGE.x+3,y0:MAGE.y-8,x1:tx,y1:ty,t:0,dur:Math.max(.3,d/150)};}
  function impact(x,y){booms.push({x,y,t:0});const c0=cellAt(x,y),cx=c0%GW,cy=(c0/GW)|0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const nx=cx+i,ny=cy+j;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const c=ny*GW+nx;
      if(MAT[c]!==WATER&&MAT[c]!==HOUSE){FLD[c]=3;FLT[c]=3;}ignite(c);if(MAT[c]===WATER)STM[c]=1.5;}
    for(let k=0;k<24;k++){const a=rnd()*Math.PI*2,s=30+rnd()*60;P.spawn(x,y,Math.cos(a)*s,Math.sin(a)*s-30,.5+rnd()*.5);}
    const k=clamp(y>>2,0,FH-1)*FW+clamp(x>>2,0,FW-1);SM[k]+=2;if(k>FW)SM[k-FW]+=1.5;}
  // scenes
  const AMB=[[.46,.42,.6],[1,.97,.92],[.62,.68,.8],[.88,.85,.9]];let amb=AMB[1].slice();
  function setScene(s){scene=s;tiers.forEach(b=>b.classList.toggle('on',+b.dataset.t===s));
    if(s===0){reset();rain=false;setWind(2);}
    if(s===1){reset();rain=false;setWind(6);startFire();for(let i=0;i<14;i++){simTick();smokeStep(.25);}}
    if(s===2){if(active.length<12){reset();setWind(4);startFire();for(let i=0;i<10;i++)simTick();}rain=true;}
    if(s===3){reset();rain=false;setWind(3);nextBall=.4;}}
  function startFire(){for(let cy=10;cy<GH;cy+=3){ignite(cy*GW+1);ignite(cy*GW+2);}}
  tiers.forEach(b=>b.addEventListener('click',()=>setScene(+b.dataset.t)));
  pointer(cv,([x,y],k)=>{if(k!=='down')return;if(scene===3){throwBall(x|0,y|0);return;}const c=cellAt(x|0,y|0);
    for(const d of [0,1,-1,GW,-GW])if(c+d>=0&&c+d<NC)ignite(c+d);if(scene===0&&active.length)quiet=0;});
  // drawing helpers
  const MAGEC={h:U('#6b2f7a'),H:U('#4e2160'),s:U('#e8b796'),e:U('#2a1c14'),c:U('#5b3a9a'),C:U('#3c2670'),y:U('#ffd34a'),l:U('#3a2a20'),b:U('#22160f')};
  const SPR_S=mkFlame(5,8),SPR_M=mkFlame(7,11),SPR_L=mkFlame(9,15),SPR_T=mkFlame(4,6);
  const put=(x,y,c)=>{x|=0;y|=0;if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=c;};
  function drawTree(cx,cy,c){const bx=cx*8+4+(hashI(cx,cy,1,seed)&1),by=cy*8+7;const burnt=ST[c]===ASH||ST[c]===EMB,burning=ST[c]===BURN;
    for(let y=by-3;y<=by;y++){put(bx,y,burnt?FC.char:FC.trunk);put(bx-1,y,burnt?FC.char:FC.trunk);}
    if(burnt&&ST[c]===ASH)return;const R=burning&&TIM[c]<4?3:5;
    for(let y=-R-1;y<=R;y++)for(let x=-R-1;x<=R;x++){const d=(x+.5)*(x+.5)+(y+.5)*(y+.5)*1.2;if(d>R*R+1)continue;const h=hash2(bx+x,by+y);
      let col=y<-1&&x<0?FC.leaf2:d>R*R-5?FC.leaf3:FC.leaf;if(h<.12)col=FC.leaf2;if(burning&&h<.35)col=FC.ember2;if(ST[c]===EMB)col=h<.3?FC.ember:FC.char;put(bx+x,by-6+y,col);}}
  function drawHouse([hx,hy,hw,hh],j){const x0=hx*8,y0=hy*8,w=hw*8,rh=Math.round(hh*8*.55),y1=y0+hh*8;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x0+w;x++){let col;if(y<y0+rh){const r=(y-y0)%4;col=r===3?FC.roof3:((x+(((y-y0)>>2)&1)*3)%6===0)?FC.roof3:FC.roof;if(y===y0)col=FC.roof2;}
      else{col=(x-x0)%6===0?FC.wood3:FC.wood;if(y===y0+rh)col=FC.wood3;}u[y*W+x]=col;}
    const wy=y0+rh+3;for(const wx of [x0+4,x0+w-9])for(let y=wy;y<wy+4;y++)for(let x=wx;x<wx+5;x++)u[y*W+x]=scene===0?FC.winlit:FC.win;
    const dx=x0+(w>>1)-2;for(let y=y1-7;y<y1;y++)for(let x=dx;x<dx+5;x++)u[y*W+x]=FC.wood3;
    if(j===0)for(let y=CHIM.y-6;y<CHIM.y+2;y++)for(let x=CHIM.x-2;x<=CHIM.x+2;x++)u[y*W+x]=y===CHIM.y-6?FC.stone2:(x===CHIM.x-2?FC.stone2:FC.stone);}
  // glow map from burning cells (G4), 40x23, two box passes
  const GL=new Float32Array(NC),GT=new Float32Array(NC);
  function glow(){GL.fill(0);for(const c of active)GL[c]+=ST[c]===BURN?(MAT[c]===TREE?1.3:.7):.25;for(let c=0;c<NC;c++)if(FLD[c])GL[c]+=.3*FLD[c];
    GL[cellAt(CAMP.x,CAMP.y)]+=1.6;for(const [x,y] of TORCH)GL[cellAt(x,y)]+=.6;if(ball)GL[cellAt(ball.x|0,ball.y|0)]+=1.2;for(const b of booms)GL[cellAt(b.x,b.y)]+=3*(1-b.t);
    for(let pass=0;pass<2;pass++){for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){let s=0,n=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=x+i,yy=y+j;if(xx<0||yy<0||xx>=GW||yy>=GH)continue;s+=GL[yy*GW+xx];n++;}GT[y*GW+x]=s/n*1.6;}GL.set(GT);}}
  setWind(6);reset();setScene(reduce?0:1);
  let hud=0;
  return {tick(dt){ms+=dt*1000;acc+=dt;while(acc>=.25){acc-=.25;simTick();}
    if(scene===1&&quiet>16){reset();startFire();}
    if(scene===0&&quiet>40&&active.length===0)quiet=0;
    if(scene===3){nextBall-=dt;if(nextBall<=0&&!ball){throwBall(40+rnd()*150,100+rnd()*70);nextBall=2.6;}}
    smokeStep(dt);
    // ambient eases to the scene's key
    const A=AMB[scene];for(let k=0;k<3;k++)amb[k]+=(A[k]-amb[k])*Math.min(1,dt*2);
    // 1. ground and burn states
    u.set(BASE);
    for(let c=0;c<NC;c++){const s=ST[c];if(s===NONE&&!FLD[c]&&MOI[c]<.3)continue;const x0=(c%GW)*8,y0=((c/GW)|0)*8;
      for(let y=y0;y<y0+8&&y<H;y++)for(let x=x0;x<x0+8;x++){const h=hash2(x*5,y*3),i=y*W+x;
        if(s===ASH||FLD[c])u[i]=h<.15?FC.ash2:h<.3?FC.ash3:FC.ash;
        else if(s===EMB)u[i]=h<.12?(Math.sin(ms*.006+h*40)>0?FC.ember:FC.ember2):h<.5?FC.char:FC.ash3;
        else if(s===BURN&&MAT[c]!==TREE)u[i]=h<.4?FC.char:h<.5?FC.ember2:u[i];
        else if(s===NONE&&MOI[c]>=.3&&h<MOI[c]*.5)u[i]=mix32(u[i],FC.water,.35);}}
    // water shimmer
    for(let c=0;c<NC;c++)if(MAT[c]===WATER){const x0=(c%GW)*8,y0=((c/GW)|0)*8;for(let k=0;k<3;k++){const x=x0+(hashI(c,k,ms/400|0,1)&7),y=y0+(hashI(c,k,ms/400|0,2)&7);put(x,y,FC.water3);}}
    // 2. props, top to bottom
    const props=[];for(let c=0;c<NC;c++)if(MAT[c]===TREE)props.push(c);props.sort((a,b)=>a-b);
    HOUSES.forEach(drawHouse);
    for(const [x,y] of TORCH)for(let k=0;k<8;k++)put(x,y+k-1,FC.post);
    for(let k=-4;k<=4;k++){put(CAMP.x+k,CAMP.y+1,k&1?FC.wood3:FC.wood);put(CAMP.x+k*.6,CAMP.y,FC.wood2);}
    for(const c of props)drawTree(c%GW,(c/GW)|0,c);
    {const [rows,fl]=charRows({dir:'down',moving:false,anim:0});rows.forEach((r,j)=>{for(let i=0;i<7;i++){const ch=r[fl?6-i:i];if(ch!=='.'&&MAGEC[ch])put(MAGE.x-3+i,MAGE.y-11+j,MAGEC[ch]);}});}
    // 3. light: ambient x (1 + glow), banded with the Bayer matrix
    glow();
    for(let y=0;y<H;y++){const gy=Math.min(GH-1.001,Math.max(0,(y-4)/8)),y0=gy|0,fy=gy-y0;for(let x=0;x<W;x++){const gx=Math.min(GW-1.001,Math.max(0,(x-4)/8)),x0=gx|0,fx=gx-x0,k=y0*GW+x0;
      const g=(GL[k]*(1-fx)+GL[k+1]*fx)*(1-fy)+(GL[k+GW]*(1-fx)+GL[k+GW+1]*fx)*fy,B=bay(x,y)/16,gq=Math.floor(Math.min(1.4,g)*5+B)/5,i=y*W+x,c=u[i];
      u[i]=pack((c&255)*(amb[0]+gq*1.0),((c>>>8)&255)*(amb[1]+gq*.62),((c>>>16)&255)*(amb[2]+gq*.3));}}
    // 4. flames: 4-frame loops, phase from the tile (B5)
    for(const c of active){if(ST[c]!==BURN)continue;const cx=c%GW,cy=(c/GW)|0,bx=cx*8+4,by=cy*8+7,h=hashI(cx,cy,3,seed),j=(h&3)-1,fr=flameFrame(cx,cy,ms);
      if(MAT[c]===TREE){blit(u,W,H,(TIM[c]>3?SPR_L:SPR_M)[fr],bx+j,by-5);blit(u,W,H,SPR_S[(fr+2)&3],bx-3,by-1);}
      else{blit(u,W,H,(MAT[c]===DRY?SPR_M:SPR_S)[fr],bx-1+j,by);blit(u,W,H,SPR_S[(fr+1)&3],bx+3-j,by-3);}}
    for(let c=0;c<NC;c++)if(FLD[c]){const cx=c%GW,cy=(c/GW)|0,fr=flameFrame(cx,cy,ms);blit(u,W,H,[SPR_T,SPR_S,SPR_M][FLD[c]-1][fr],cx*8+4,cy*8+7);}
    blit(u,W,H,SPR_L[flameFrame(7,13,ms)],CAMP.x,CAMP.y);blit(u,W,H,SPR_S[flameFrame(9,1,ms)],CAMP.x-3,CAMP.y+1);blit(u,W,H,SPR_S[flameFrame(2,9,ms)],CAMP.x+3,CAMP.y+1);
    for(const [x,y] of TORCH)blit(u,W,H,FLAME4[flameFrame(x,y,ms)],x,y-2,TONES);
    // 5. embers
    if(rnd()<dt*9)P.spawn(CAMP.x+(rnd()*6-3),CAMP.y-8,(rnd()-.5)*10,-18-rnd()*14,.8+rnd()*.6);
    for(const c of active)if(ST[c]===BURN&&rnd()<dt*(MAT[c]===TREE?3:.6)){const bx=(c%GW)*8+4,by=((c/GW)|0)*8-(MAT[c]===TREE?8:2);P.spawn(bx+rnd()*6-3,by,(rnd()-.5)*12,-15-rnd()*20,.6+rnd()*.8);}
    if(ball){ball.t+=dt/ball.dur;const t=Math.min(1,ball.t);ball.x=lerp(ball.x0,ball.x1,t);ball.y=lerp(ball.y0,ball.y1,t)-Math.sin(t*Math.PI)*16;
      for(let k=0;k<2;k++)P.spawn(ball.x+rnd()*2-1,ball.y+rnd()*2-1,(rnd()-.5)*8,(rnd()-.5)*8,.25+rnd()*.25);if(t>=1){impact(ball.x1|0,ball.y1|0);ball=null;}}
    P.step(dt,-6,windV*2.2,.97);
    for(let j=0;j<256;j++){if(P.life[j]<=0)continue;const col=emberCol(P.age[j]/P.life[j],ms/1000);if(col)put(Math.round(P.x[j]),Math.round(P.y[j]),col);}
    if(ball){const bx=Math.round(ball.x),by=Math.round(ball.y);for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const d=i*i+j*j;if(d<=5)put(bx+i,by+j,d<=1?TONES[4]:d<=2?TONES[3]:TONES[2]);}}
    for(const b of booms){b.t+=dt*1.6;const r=2+b.t*16;if(b.t<.12)for(let j=-8;j<=8;j++)for(let i=-8;i<=8;i++)if(i*i+j*j<64)put(b.x+i,b.y+j,TONES[4]);
      for(let a=0;a<48;a++){const an=a/48*Math.PI*2;put(b.x+Math.cos(an)*r,b.y+Math.sin(an)*r*.7,b.t<.5?TONES[3]:TONES[2]);}
      if(b.t<.6)blit(u,W,H,SPR_L[(b.t*12|0)&3],b.x,b.y+3);}
    for(let k=booms.length-1;k>=0;k--)if(booms[k].t>1)booms.splice(k,1);
    // 6. chimney puffs (C2), dithered
    puffT-=dt;if(puffT<=0){puffT=.6;puffs.push({x:CHIM.x,y:CHIM.y-7,vx:0,a:.75,s:2.5});}
    const st=dt*60;for(const p of puffs){p.vx+=.0005*st*(windV/3);p.x+=p.vx*st;p.y-=.125*st;p.a-=.002*st;p.s+=.02*st*.25;}
    for(let k=puffs.length-1;k>=0;k--)if(puffs[k].a<=0)puffs.splice(k,1);
    for(const p of puffs){const R=p.s,cov=p.a/.75;for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const d=(i*i+j*j)/(R*R);if(d>1)continue;const x=Math.round(p.x+i),y=Math.round(p.y+j);
      if(x<0||y<0||x>=W||y>=H)continue;if(dith(x,y,cov*(1-d*.6)))u[y*W+x]=mulc(d<.35?SMOKE[3]:SMOKE[2],amb[0]*.9+.1,amb[1]*.9+.1,amb[2]*.9+.1);}}
    // 7. smoke and steam field through the Bayer matrix (C3, E1)
    for(let y=0;y<H;y++){const fy=Math.min(FH-1,y>>2);for(let x=0;x<W;x++){const k=fy*FW+(x>>2),s=SM[k],w=SS[k];
      if(w>.05&&dith(x,y,Math.min(1,w*.8))){u[y*W+x]=STEAM[w>1?3:w>.5?2:1];continue;}
      if(s>.05&&dith(x,y,Math.min(.9,s*.55))){const c=SMOKE[s>1.4?0:s>.8?1:s>.4?2:3];u[y*W+x]=mulc(c,amb[0]*.8+.2,amb[1]*.8+.2,amb[2]*.8+.2);}}}
    // 8. rain
    if(rain)for(let k=0;k<90;k++){const sx=(hashI(k,0,0,9)%W+ms*.04*windV/4)%W,sy=(hashI(k,1,0,9)%H+ms*.22)%H;for(let q=0;q<3;q++)put(sx+q*.4,sy+q,U('#9fb6c8'));}
    F.put();
    if(++hud%10===0){const b=active.filter(c=>ST[c]===BURN).length;setHud(root,`tick ${tick} at 4 Hz · ${b} burning tiles · wind ${windV} m/s east${rain?' · rain':''} · ${P.count()}/256 embers`);}}};});

// ======================================================================
// Context: the DOOM PSX fire with decay, wind, extinguish and a live histogram
// ======================================================================
reg('doomfire',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),pal=PX($('[data-pal]',root)),hc=$('[data-hist]',root),hg=hc.getContext('2d');
  const buf=new Uint8Array(W*H),cnt=new Uint32Array(37);let lit=true,push=0,acc=0,fr=0,lastX=null;
  const bottom=v=>{for(let x=0;x<W;x++)buf[(H-1)*W+x]=v;};bottom(36);for(let k=0;k<120;k++)doomStep(buf,W,H);
  for(let i=0;i<37;i++)pal.u32[i]=DOOM_PAL[i];pal.put();
  const eb=c.btn('ext',b=>{lit=!lit;bottom(lit?36:0);b.textContent=lit?'Extinguish (bottom row to 0)':'Relight (bottom row to 36)';});
  c.btn('canon',()=>{c.el('pd').value=50;c.el('wind').value=0;lab();if(!lit)eb.click();});
  const lab=()=>{c.out('pd',c.v('pd')+'%');const w=c.v('wind')/10;c.out('wind',(w>0?'+':'')+w.toFixed(1));};c.on('pd',lab);c.on('wind',lab);lab();
  pointer(cv,([x],k)=>{if(k==='drag'&&lastX!==null)push=clamp(push+(x-lastX)*.25,-3,3);lastX=(k==='down'||k==='drag')?x:null;});
  return {tick(dt){acc+=dt;let n=0;while(acc>=1/27&&n<3){acc-=1/27;n++;doomStep(buf,W,H,{pd:c.v('pd')/100,wind:c.v('wind')/10+push});}push*=Math.pow(.2,dt);
    cnt.fill(0);for(let i=0;i<W*H;i++){F.u32[i]=DOOM_PAL[buf[i]];cnt[buf[i]]++;}F.put();
    if(++fr%6)return;
    let y=H-1;for(;y>=0;y--){let nz=0;for(let x=0;x<W;x++)if(buf[y*W+x])nz++;if(nz<W/2)break;}
    const pd=c.v('pd')/100,mean=H-1-y,exp=Math.round(36/pd),lean=-.5+c.v('wind')/10;
    ro.innerHTML=`flame height <b>${mean}</b> rows of ${H} (rows more than half lit) (theory: 36 ÷ ${pd.toFixed(2)} ≈ ${exp}${exp>H?', taller than the buffer':''})<br>lean ${lean>0?'+':''}${lean.toFixed(1)} px per row · ${(W*H).toLocaleString()} updates per frame at 27 fps`;
    hg.fillStyle='#0c0807';hg.fillRect(0,0,370,28);const mx=Math.log(1+Math.max(...cnt));
    for(let i=0;i<37;i++){const h=Math.round(Math.log(1+cnt[i])/mx*26);hg.fillStyle='#'+DOOM_HEX[i];if(i===0)hg.fillStyle='#3b2a20';hg.fillRect(i*10,28-h,9,h);}
    setHud(root,lit?'bottom row = 36':'bottom row = 0, dying out');}};});

// ======================================================================
// A2/A3: Elias cooling map, Lode kernel, Parusel average - 1, same seed
// ======================================================================
reg('ancestors',root=>{const cvs=$$('canvas',root),E=PX(cvs[0]),L=PX(cvs[1]),Pa=PX(cvs[2]),c=ctl(root),ro=$('[data-ro]',root);const W=96,H=72,N=W*H,CH=H*2;
  // one shared 256-step palette interpolated from the six-step ramp, so only the rule differs
  const PAL=new Uint32Array(256);for(let x=0;x<256;x++){const f=x/255*5,i=Math.min(4,f|0);PAL[x]=mix32(RAMP6[i],RAMP6[i+1],f-i);}
  let seed=6,rE,rL,rP,eA,eB,CM,lf,pA,pB,off=0,acc=0,fr=0;
  function init(){rE=mkRng(seed);rL=mkRng(seed);rP=mkRng(seed);eA=new Float32Array(N);eB=new Float32Array(N);lf=new Int32Array(N);pA=new Int32Array(N);pB=new Int32Array(N);
    CM=new Float32Array(W*CH);const R=mkRng(seed*7+1);for(let k=0;k<900;k++)CM[(R()*W*CH)|0]=R()*255;
    const T=new Float32Array(W*CH);for(let pass=0;pass<20;pass++){for(let y=0;y<CH;y++)for(let x=0;x<W;x++){let s=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)s+=CM[((y+j+CH)%CH)*W+(x+i+W)%W];T[y*W+x]=s/9;}CM.set(T);}
    let mx=0;for(let i=0;i<W*CH;i++)mx=Math.max(mx,CM[i]);for(let i=0;i<W*CH;i++)CM[i]=CM[i]/mx*10;}
  init();
  const lab=()=>c.out('div',(c.v('div')/100).toFixed(2));c.on('div',lab);lab();
  c.btn('clear',()=>{const s=seed;init();});c.btn('seed',()=>{seed=(seed*31+7)%1000;init();});
  pointer(cvs[0],([x,y],k)=>{if(k!=='down'&&k!=='drag')return;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const xx=((x|0)+i+W)%W,yy=(((y|0)+j+off)%CH+CH)%CH;CM[yy*W+xx]=-5;}});
  function stepE(){for(let x=0;x<W;x++){eA[(H-1)*W+x]=rE()<.5?255:0;eA[(H-2)*W+x]=rE()<.5?255:0;}off=(off+1)%CH;
    for(let y=1;y<H-1;y++)for(let x=0;x<W;x++){const i=y*W+x,a=(eA[i-1+(x===0?W:0)]+eA[i+1-(x===W-1?W:0)]+eA[i-W]+eA[i+W])/4,cool=CM[((y+off)%CH)*W+x];eB[i-W]=Math.max(0,Math.min(255,a-cool));}
    for(let x=0;x<W;x++){eB[(H-2)*W+x]=eA[(H-2)*W+x];eB[(H-1)*W+x]=eA[(H-1)*W+x];}const t=eA;eA=eB;eB=t;}
  function stepL(div){for(let x=0;x<W;x++)lf[(H-1)*W+x]=(rL()*256)|0;
    for(let y=0;y<H-1;y++)for(let x=0;x<W;x++)lf[y*W+x]=Math.min(255,Math.floor((lf[(y+1)*W+(x-1+W)%W]+lf[(y+1)*W+x]+lf[(y+1)*W+(x+1)%W]+lf[((y+2)%H)*W+x])*32/(div*32)));}
  function stepP(){for(let x=0;x<W;x++){pA[(H-1)*W+x]=100+((rP()*51)|0);pA[(H-2)*W+x]=100+((rP()*51)|0);}
    const hs=10+((rP()*41)|0);for(let k=0;k<hs;k++){const hx=1+((rP()*(W-2))|0),hy=H-2+((rP()*2)|0)-1;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const yy=hy+j;if(yy>=0&&yy<H)pA[yy*W+hx+i]=255;}}
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,v=((pA[i-1]+pA[i+1]+pA[i-W]+pA[i+W])>>2);pB[i-W]=v>0?v-1:0;}
    for(let x=0;x<W;x++){pB[(H-1)*W+x]=pA[(H-1)*W+x];pB[(H-2)*W+x]=pA[(H-2)*W+x];}const t=pA;pA=pB;pB=t;}
  const height=a=>{let y=H-1;for(;y>=0;y--){let n=0;for(let x=0;x<W;x++)if(a[y*W+x]>=40)n++;if(n<W/2)break;}return H-1-y;};
  for(let k=0;k<80;k++){stepE();stepL(4.03);stepP();}
  return {tick(dt){acc+=dt;let n=0;while(acc>=1/30&&n<2){acc-=1/30;n++;stepE();stepL(c.v('div')/100);stepP();}
    const showMap=c.v('map');for(let i=0;i<N;i++){if(showMap){const y=(i/W)|0,v=CM[((y+off)%CH)*W+i%W];E.u32[i]=v<0?U('#ffb44a'):pack(v*24,v*20,v*18);}else E.u32[i]=PAL[eA[i]|0];L.u32[i]=PAL[lf[i]];Pa.u32[i]=PAL[pA[i]];}
    E.put();L.put();Pa.put();
    if(++fr%10)return;const d=c.v('div')/100;
    ro.innerHTML=`flame height (rows more than half above heat 40): Elias <b>${height(eA)}</b> · Lode <b>${height(lf)}</b> · Parusel <b>${height(pA)}</b>${height(pA)>=H-1?'+ (taller than the buffer)':''} rows of ${H}<br>Lode divisor ${d.toFixed(2)}${Math.abs(d-4.03)<.006?' (129 / 32, his value)':d<4.02?': too close to 4, the fire climbs to the top':d>4.3?': too large, the fire dies fast':''} · cost per pixel: 4 reads and a divide (Elias adds 1 map read); DOOM needs 1 read and 1 random number`;}};});

// ======================================================================
// A4: Apple II age table and PICO-8 Monte Carlo fire
// ======================================================================
reg('agetable',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root),tab=$('[data-tab]',root);
  const AW=A.W,AH=A.H,a=new Uint8Array(AW*AH),T=[0,0,0,1,0,3,0,5],AC=['#000000','#5b1313','#000000','#d0381a','#000000','#fcbf34','#000000','#ffffff'].map(U);
  tab.innerHTML='<span><b>table[c]</b></span>'+T.map((v,i)=>`<span><i style="background:${['#000','#5b1313','#000','#d0381a','#000','#fcbf34','#000','#fff'][i]};height:10px;width:10px;border:1px solid #5c4334"></i>${i} → ${v}</span>`).join('');
  const BW=B.W,BH=B.H,b=new Uint8Array(BW*BH),PC={0:'#000000',1:'#1d2b53',2:'#7e2553',5:'#5f574f',7:'#fff1e8',8:'#ff004d',9:'#ffa300',10:'#ffec27'},PCU={},TT={7:10,10:9,9:8,8:2,2:1,1:0,5:0,0:0};
  for(const k in PC)PCU[k]=U(PC[k]);
  const lab=()=>{c.out('pc',c.v('pc')+'%');c.out('n',c.v('n'));c.out('fires',c.v('fires'));};['pc','n','fires','fixed'].forEach(k=>c.on(k,lab));lab();
  let acc=0,fr=0;
  function stepA(){a.copyWithin(0,AW);for(let x=0;x<AW;x++)a[(AH-1)*AW+x]=7;const pc=c.v('pc')/100;for(let i=0;i<AW*AH;i++)if(rnd()<pc)a[i]=T[a[i]&7];}
  function seedB(){const nf=c.v('fires'),seg=BW/nf;for(let f=0;f<nf;f++){const x0=Math.round(f*seg+seg*.22),x1=Math.round((f+1)*seg-seg*.22);for(let x=x0;x<x1;x++)b[(BH-1)*BW+x]=7;}}
  const nS=()=>c.v('fixed')?c.v('n'):c.v('n')*c.v('fires');
  function stepB(){seedB();const n=nS();for(let k=0;k<n;k++){const x=(rnd()*BW)|0,y=(rnd()*BH)|0,yy=Math.min(BH-1,y+((rnd()*2)|0));let col=b[yy*BW+x];if(rnd()*50<col)col=TT[col]??0;
    for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const px=x+dx,py=y+dy;if(px>=0&&py>=0&&px<BW&&py<BH-1)b[py*BW+px]=col;}}}
  return {tick(dt){acc+=dt;let n=0;while(acc>=1/30&&n<2){acc-=1/30;n++;stepA();stepB();}
    for(let i=0;i<AW*AH;i++)A.u32[i]=AC[a[i]];for(let i=0;i<BW*BH;i++)B.u32[i]=PCU[b[i]]||PCU[0];A.put();B.put();
    if(++fr%10)return;setHud(root,`${AW*AH} cells per frame, every cell`,'a');setHud(root,`${nS().toLocaleString()} px per frame${c.v('fixed')?' (fixed)':''}`,'b');}};});

// ======================================================================
// §3 timeline
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#b3a293','#ffb44a','#e8622c','#9fc7d6'];
  const X=y=>y<1990?(y-1970)/20*22:y<2023?24+(y-1990)/33*46:72+(y-2023)/3.6*27;
  let h='<div class="tl-axis">';for(const y of [1972,1985,2000,2010,2020])h+=`<span style="left:${X(y)}%">${y}</span>`;h+=`<span style="left:${X(2024)}%">2024</span><span style="left:${X(2025.5)}%">2025</span><span style="left:${X(2026.5)}%">2026</span><i class="tl-brk" style="left:70.9%"></i><i class="tl-brk" style="left:22.9%"></i></div>`;
  const items=[];
  GENS.forEach((g,gi)=>{const ys=g.ev.filter(e=>e.y).map(e=>e.y+e.m/12);const a=Math.min(...ys),b=Math.max(...ys);
    h+=`<div class="tl-lane" data-g="${gi}"><span class="tl-lab">${g.id}</span><div class="tl-track"><i class="tl-bar" style="left:${X(a)}%;width:${Math.max(.8,X(b)-X(a))}%;background:${GC[gi]}"></i>`;
    g.ev.forEach((e,ei)=>{const id=`tle-${gi}-${ei}`;items.push({gi,ei,id,e});if(e.y)h+=`<button class="tl-dot" type="button" style="left:${X(e.y+e.m/12)}%;--c:${GC[gi]}" data-id="${id}" aria-label="${g.id}, ${e.y}"></button>`;});
    h+='</div></div>';});
  lanes.innerHTML=h;
  gb.innerHTML='<button type="button" class="on" data-g="all">All generations</button>'+GENS.map((g,gi)=>`<button type="button" data-g="${gi}"><i style="background:${GC[gi]}"></i>${g.id}: ${g.t}</button>`).join('');
  list.innerHTML=items.map(it=>`<li id="${it.id}" data-g="${it.gi}" style="--c:${GC[it.gi]}"><span class="yr">${GENS[it.gi].id}${it.e.y?' · '+it.e.y:''}</span>${it.e.h}</li>`).join('');
  const show=id=>{const it=items.find(i=>i.id===id);if(!it)return;$$('.tl-list li',root).forEach(l=>l.classList.toggle('hl',l.id===id));det.innerHTML=`<b>${GENS[it.gi].id}: ${GENS[it.gi].t}</b> · ${it.e.h}`;};
  lanes.addEventListener('pointerover',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('click',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('focusin',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  gb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',gb).forEach(x=>x.classList.toggle('on',x===b));const g=b.dataset.g;
    $$('.tl-list li',root).forEach(l=>l.hidden=!(g==='all'||l.dataset.g===g));$$('.tl-lane',root).forEach(l=>l.classList.toggle('dim',!(g==='all'||l.dataset.g===g)));});
  const pick=items.find(i=>/Sanglard/.test(i.e.h))||items[0];show(pick.id);return {};});

// ======================================================================
// B1/B5: a drawn 4-frame loop and a row of 8 torches, synced or seeded
// ======================================================================
reg('flameloop',root=>{const cvs=$$('canvas',root),Bg=PX(cvs[0]),St=PX(cvs[1]),Rw=PX(cvs[2]),c=ctl(root),ro=$('[data-ro]',root),rl=$('[data-rowlab]',root);let ms=0,fr=0;
  const lab=()=>{c.out('fps',c.v('fps')+' fps');rl.textContent=c.v('seed')?'Phase from tile: x·3047 + y·88':'All torches start on frame 0';};['fps','seed','tip'].forEach(k=>c.on(k,lab));lab();
  const BGC=U('#140c09'),WALL=U('#2a1d17'),WALL2=U('#33241c');
  return {tick(dt){ms+=dt*1000;const fps=c.v('fps'),period=4000/fps,set=c.v('tip')?FLAME4:FLAME4J,cur=Math.floor(ms/period*4)%4;
    Bg.u32.fill(BGC);for(let x=6;x<14;x++){Bg.u32[18*20+x]=FC.wood3;Bg.u32[19*20+x]=FC.post;}blit(Bg.u32,20,20,set[cur],10,17);Bg.put();
    St.u32.fill(BGC);for(let f=0;f<4;f++){blit(St.u32,44,16,set[f],5+f*11,13);if(f===cur)for(let x=f*11+1;x<f*11+10;x++)St.u32[15*44+x]=U('#ffb44a');}St.put();
    for(let y=0;y<40;y++)for(let x=0;x<160;x++)Rw.u32[y*160+x]=y<26?((x%10===0||y%6===0)?WALL:WALL2):FC.road;
    const fs=[];for(let i=0;i<8;i++){const x=10+i*20,tx=3+i*2,ty=7;const f=c.v('seed')?flameFrame(tx,ty,ms,4,period):cur;fs.push(f);
      for(let y=24;y<36;y++){Rw.u32[y*160+x]=FC.post;Rw.u32[y*160+x+1]=FC.wood3;}blit(Rw.u32,160,40,set[f],x+1,23);}
    Rw.put();
    if(++fr%4===0){ro.innerHTML=`frames now: <b>${fs.join(' ')}</b> · ${Math.round(period/4)} ms per frame · loop ${Math.round(period)} ms`;setHud(root,`frame ${cur+1} of 4`);}}};});

// ======================================================================
// B2: f = 1.5 / sqrt(D) on a log axis, with a live flame at that rate
// ======================================================================
reg('loopspeed',root=>{const svg=$('svg',root),cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root);
  const MK=[['Candle',.01],['Torch',.05],['Brazier',.2],['Campfire',.5],['Bonfire',1],['Burning house',3],['Wildfire front',10]];
  const L0=Math.log10(.005),L1=Math.log10(20),x0=48,x1=404,y0=200,y1=14,F0=Math.log10(.3),F1=Math.log10(30);
  const X=d=>x0+(Math.log10(d)-L0)/(L1-L0)*(x1-x0),Y=f=>y0-(Math.log10(f)-F0)/(F1-F0)*(y0-y1),fD=d=>1.5/Math.sqrt(d);
  const D=()=>Math.pow(10,L0+(L1-L0)*c.v('d')/1000);
  for(const f of [.5,1,2,5,10,20]){svgEl('line',{x1:x0,x2:x1,y1:Y(f),y2:Y(f),class:'gl'},svg);svgText(svg,x0-6,Y(f)+4,f+' Hz',{'text-anchor':'end'});}
  for(const d of [.01,.1,1,10]){svgEl('line',{x1:X(d),x2:X(d),y1:y0,y2:y1,class:'gl'},svg);svgText(svg,X(d),y0+16,d+' m',{'text-anchor':'middle'});}
  svgEl('line',{x1:x0,x2:x1,y1:y0,y2:y0,class:'ax'},svg);svgEl('line',{x1:x0,x2:x0,y1:y0,y2:y1,class:'ax'},svg);
  const pts=[];for(let k=0;k<=80;k++){const d=Math.pow(10,L0+(L1-L0)*k/80);pts.push([X(d),Y(fD(d))]);}poly(svg,pts,{class:'s1'});
  svgEl('line',{x1:x0,x2:x1,y1:Y(10),y2:Y(10),stroke:'#9fc7d6','stroke-dasharray':'4 3','stroke-width':1},svg);svgText(svg,x1,Y(10)-5,'10 fps sprite rate',{'text-anchor':'end',class:'c'});
  const OFS=[[7,-8,'start'],[-6,16,'end'],[7,-8,'start'],[-8,16,'end'],[7,-9,'start'],[-6,16,'end'],[4,-10,'end']];
  MK.forEach(([n,d],i)=>{const [ox,oy,an]=OFS[i];svgEl('circle',{cx:X(d),cy:Y(fD(d)),r:4,fill:'#e8622c'},svg);svgText(svg,X(d)+ox,Y(fD(d))+oy,n,{'font-size':11,'text-anchor':an,class:'lab'});});
  const now=svgEl('line',{y1:y0,y2:y1,class:'now'},svg),dot=svgEl('circle',{r:6,fill:'none',stroke:'#fff','stroke-width':2},svg);
  svgEl('rect',{x:x0,y:y1,width:x1-x0,height:y0-y1,fill:'transparent',class:'drag'},svg);
  const fromX=e=>{const r=svg.getBoundingClientRect(),vx=(e.clientX-r.left)/r.width*420;c.el('d').value=clamp((vx-x0)/(x1-x0),0,1)*1000;upd();};
  let dn=false;svg.addEventListener('pointerdown',e=>{dn=true;fromX(e);});svg.addEventListener('pointermove',e=>{if(dn)fromX(e);});addEventListener('pointerup',()=>dn=false);
  function upd(){const d=D(),f=fD(d);c.out('d',d<.1?(d*100).toFixed(1)+' cm':d.toFixed(2)+' m');now.setAttribute('x1',X(d));now.setAttribute('x2',X(d));dot.setAttribute('cx',X(d));dot.setAttribute('cy',Y(f));
    let near=MK[0];for(const m of MK)if(Math.abs(Math.log(m[1]/d))<Math.abs(Math.log(near[1]/d)))near=m;const fr=10/f;
    ro.innerHTML=`D = ${d<.1?(d*100).toFixed(1)+' cm':d.toFixed(2)+' m'} (near the ${near[0].toLowerCase()}) · f = <b>${f.toFixed(2)} Hz</b> · one puff every ${Math.round(1000/f)} ms<br>`+(fr<2?'faster than a 10 fps sprite can show: 2 to 3 frames, or one sprite with per-frame jitter':`at 10 fps one puff spans about <b>${Math.round(fr)} frames</b>`);}
  c.on('d',upd);upd();let ph=0;
  return {tick(dt){const d=D(),f=fD(d);ph+=dt*f*2*Math.PI;F.u32.fill(U('#140c09'));for(let x=20;x<76;x++){F.u32[69*96+x]=FC.ash3;F.u32[70*96+x]=FC.ash3;}
    const t=(Math.log10(d)-L0)/(L1-L0),h=Math.round(8+t*54),w=Math.max(3,Math.round(h*.55));
    drawFlame(F.u32,96,72,48,68,w,h,ph);const cyc=(ph/(2*Math.PI))%1,py=68-h*(.86+cyc*.4),pr=Math.max(1,w*.14*(1-cyc));
    if(cyc<.7)for(let j=-pr;j<=pr;j++)for(let i=-pr;i<=pr;i++)if(i*i+j*j<=pr*pr){const x=Math.round(48+Math.sin(ph*.5)*w*.1+i),y=Math.round(py+j);if(x>=0&&y>=0&&x<96&&y<72)F.u32[y*96+x]=TONES[cyc<.35?2:1];}
    F.put();setHud(root,`${f.toFixed(1)} Hz`);}};});

// ======================================================================
// B3/B4: ramp builder; drawn frames vs palette cycling
// ======================================================================
reg('ramp',root=>{const cvs=$$('canvas',root),RC=PX(cvs[0]),A=PX(cvs[1]),B=PX(cvs[2]),c=ctl(root),ro=$('[data-ro]',root);const W=80,H=56;
  const hsl=(h,s,l)=>{h=((h%360)+360)%360;const C=(1-Math.abs(2*l-1))*s,X=C*(1-Math.abs((h/60)%2-1)),m=l-C/2;let r=0,g=0,b=0;if(h<60){r=C;g=X;}else if(h<120){r=X;g=C;}else if(h>=300){r=C;b=X;}else{g=C;b=X;}return [(r+m)*255,(g+m)*255,(b+m)*255];};
  const LUM=[.05,.2,.36,.5,.6,.86];const ramp=new Uint32Array(6);let hex=[];
  function build(){const hs=c.v('hue'),sat=c.v('sat')/100;hex=[];for(let i=0;i<6;i++){let rgb=hsl(-4+i*hs,i===5?sat*.5:sat,LUM[i]);
      if(c.v('brown')&&i===2)rgb=[107,74,47];if(c.v('white')&&i>=4)rgb=[255,255,255];ramp[i]=pack(...rgb);hex.push(hexOf3(...rgb));}
    for(let i=0;i<6;i++)RC.u32[i]=ramp[i];RC.put();
    c.out('hue',hs+'°');c.out('sat',c.v('sat')+'%');c.out('k',c.v('k')+' frames');
    ro.innerHTML=`ramp: ${hex.map(h=>`<span class="swatch" style="background:${h}"></span> ${h}`).join(' &nbsp;')}<br>palette cycling costs 6 palette writes per step and no per-pixel work`;}
  ['hue','sat','k','brown','white'].forEach(k=>c.on(k,build));build();
  const FR=mkFlame(15,26);
  // still index picture for cycling: flame silhouette and a lava pool; -1 = background
  const IDX=new Int8Array(W*H).fill(-1),sil=mkFlame(19,34)[0];
  for(let j=0;j<sil.h;j++)for(let i=0;i<sil.w;i++){const t=sil.a[j*sil.w+i];if(!t)continue;const x=40-9+i,y=44-sil.h+1+j;IDX[y*W+x]=((Math.floor((y+vnoise(x/3,y/5)*4)/2.5))%6+6)%6+(t>=3?6:0);}
  for(let y=45;y<H;y++)for(let x=0;x<W;x++){const dx=(x-40)/30,dy=(y-50)/5.5;if(dx*dx+dy*dy<1)IDX[y*W+x]=12+(Math.floor(vnoise(x/5,y/2)*6+x/7)%6);}
  const BG=U('#140c09'),GR=U('#231812');let ms=0,cyc=0,fr=0;
  return {tick(dt){ms+=dt*1000;fr++;if(fr%c.v('k')===0)cyc++;
    A.u32.fill(BG);for(let y=45;y<H;y++)for(let x=0;x<W;x++)A.u32[y*W+x]=GR;
    for(let k=-9;k<=9;k++){const x=40+k;A.u32[46*W+x]=FC.wood3;A.u32[47*W+x]=k&1?FC.wood:FC.wood3;}
    const f=FR[Math.floor(ms/100)%4],pal=[0,ramp[1],ramp[2],ramp[3],ramp[4]];
    for(let j=0;j<f.h;j++)for(let i=0;i<f.w;i++){const t=f.a[j*f.w+i];if(!t)continue;const x=40-7+i,y=45-f.h+1+j;A.u32[y*W+x]=(t===4&&j>f.h*.62)?ramp[5]:pal[t];}
    for(let k=0;k<6;k++){const x=30+k*4,y=48+(k&1);A.u32[y*W+x]=FC.stone;A.u32[y*W+x+1]=FC.stone2;}
    A.put();
    const ping=[1,2,3,4,3,2],hot=[3,4,5,5,4,3],lav=[1,2,3,2,1,1];
    for(let i=0;i<W*H;i++){const v=IDX[i];if(v<0){B.u32[i]=i>=45*W?GR:BG;continue;}
      B.u32[i]=v<6?ramp[ping[(v+cyc)%6]]:v<12?ramp[hot[(v-6+cyc)%6]]:ramp[lav[(v-12+cyc)%6]];}
    B.put();}};});

// ======================================================================
// C1: fixed ember pool with age-to-colour, wind, gravity, impact sparks
// ======================================================================
reg('embers',root=>{const cv=$('canvas',root),F=PX(cv),PS=PX($('[data-pool]',root)),c=ctl(root);const W=F.W,H=F.H,CX=72,CY=62;
  const P=mkPool(256),SP=new Uint8Array(256),fl=mkFlame(11,18);let acc=0,ms=0,fr=0;
  const lab=()=>{c.out('rate',c.v('rate')+'/s');c.out('wind',c.v('wind'));c.out('g',c.v('g'));};['rate','wind','g'].forEach(k=>c.on(k,lab));lab();
  const burst=(x,y)=>{for(let k=0;k<30;k++){const a=-Math.PI*(.1+rnd()*.8),s=40+rnd()*50;const j=P.spawn(x,y,Math.cos(a)*s,Math.sin(a)*s,.4+rnd()*.5);SP[j]=1;}};
  c.btn('burst',()=>burst(CX,CY-6));pointer(cv,([x,y],k)=>{if(k==='down')burst(x,y);});
  const BG=U('#140c09'),GR=U('#1f1510'),FREE=U('#0c0807'),HEAD=U('#ffffff');
  return {tick(dt){ms+=dt*1000;acc+=c.v('rate')*dt;while(acc>=1){acc--;const a=-Math.PI/2+(rnd()*2-1)*20*Math.PI/180,s=15+rnd()*25;const j=P.spawn(CX+(rnd()*6-3),CY-8,Math.cos(a)*s,Math.sin(a)*s,.6+rnd()*.9);SP[j]=0;}
    const g=c.v('g');P.step(dt,g,c.v('wind'),.98);for(let j=0;j<256;j++)if(SP[j]&&P.life[j]>0)P.vy[j]+=(90-g)*dt;
    const u=F.u32;for(let i=0;i<W*H;i++)u[i]=i>=(CY+1)*W?GR:BG;
    for(let k=-6;k<=6;k++){u[(CY+1)*W+CX+k]=k&1?FC.wood:FC.wood3;u[(CY+2)*W+CX+k]=FC.wood3;}
    blit(u,W,H,fl[Math.floor(ms/100)%4],CX,CY);
    let live=0;for(let j=0;j<256;j++){if(P.life[j]<=0){PS.u32[j]=FREE;continue;}live++;const col=emberCol(P.age[j]/P.life[j],ms/1000);PS.u32[j]=col||EMBERC[3];
      if(!col)continue;const x=Math.round(P.x[j]),y=Math.round(P.y[j]);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=col;}
    for(let r=1;r<6;r++)for(let j=0;j<256;j++)PS.u32[r*256+j]=PS.u32[j];for(let r=0;r<6;r++)PS.u32[r*256+P.head]=HEAD;
    F.put();PS.put();if(++fr%8===0)setHud(root,`${live}/256 live · about ${(live*7).toLocaleString()} operations this frame`);}};});

// ======================================================================
// C2: Stardew chimney puffs (numbers divided by 4 for art pixels)
// ======================================================================
reg('puffs',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root);const W=F.W,H=F.H,CH={x:66,y:62};
  const puffs=[];let t=0,fr=0;
  const lab=()=>{const w=c.v('wind')/10;c.out('wind',(w>0?'+':'')+w.toFixed(1)+'×');c.out('every',c.v('every')+' ms');};['wind','every'].forEach(k=>c.on(k,lab));lab();c.seg('draw',()=>{});
  const BG=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=hash2(x*3,y*5);BG[y*W+x]=h<.08?FC.grass3:h<.35?FC.grass2:FC.grass;}
  const hx=40,hy=58,hw=52,hh=34,rh=19;for(let y=hy;y<hy+hh;y++)for(let x=hx;x<hx+hw;x++){let col;if(y<hy+rh){col=(y-hy)%4===3?FC.roof3:((x+(((y-hy)>>2)&1)*3)%6===0)?FC.roof3:FC.roof;if(y===hy)col=FC.roof2;}else col=(x-hx)%6===0?FC.wood3:FC.wood;BG[y*W+x]=col;}
  for(let y=hy+rh+4;y<hy+rh+9;y++)for(const x of [hx+6,hx+hw-12])for(let i=0;i<6;i++)BG[y*W+x+i]=FC.win;
  for(let y=CH.y-6;y<CH.y+3;y++)for(let x=CH.x-3;x<=CH.x+3;x++)BG[y*W+x]=y===CH.y-6?FC.stone2:x===CH.x-3?FC.stone2:FC.stone;
  return {tick(dt){const n=dt*60,wm=c.v('wind')/10;t+=dt*1000;if(t>=c.v('every')){t=0;puffs.push({x:CH.x,y:CH.y-7,vx:0,a:.75,sc:2});}
    for(const p of puffs){p.vx+=.0005*wm*n;p.x+=p.vx*n;p.y-=.125*n;p.a-=.002*n;p.sc+=.02*n;}for(let k=puffs.length-1;k>=0;k--)if(puffs[k].a<=0)puffs.splice(k,1);
    const u=F.u32;u.set(BG);const dither=c.segv('draw')==='dither';
    for(const p of puffs){const R=10*p.sc/8;for(let j=Math.floor(-R);j<=R;j++)for(let i=Math.floor(-R);i<=R;i++){const d=Math.sqrt(i*i+j*j)/R;if(d>1)continue;const x=Math.round(p.x+i),y=Math.round(p.y+j);if(x<0||y<0||x>=W||y>=H)continue;
      const soft=Math.min(1,(1-d)*2.5),idx=y*W+x;if(dither){if(dith(x,y,p.a/.75*soft))u[idx]=d<.45&&j<0?SMOKE[3]:SMOKE[2];}else u[idx]=mix32(u[idx],SMOKE[3],p.a*soft);}}
    F.put();
    if(++fr%10===0){setHud(root,`${puffs.length} puffs · ${new Set(u).size} colours on screen`);
      ro.innerHTML=`life 0.75 ÷ 0.002 = <b>375</b> updates ≈ 6.25 s<br>rise 375 × 0.125 ≈ <b>47</b> art px<br>drift ½ × ${(0.0005*wm).toFixed(5)} × 375² ≈ <b>${Math.round(.5*.0005*wm*375*375)}</b> art px<br>width from scale 2 to 9.5, <b>4.75×</b> wider`;}}};});

// ======================================================================
// C3: Bayer threshold vs alpha blend vs fill patterns
// ======================================================================
reg('dither',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),C=PX(cvs[2]),LV=PX($('[data-levels]',root)),c=ctl(root);const W=96,H=72;
  const BG=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=hash2(x*7,y*3);let col=h<.1?FC.grass3:h<.4?FC.grass2:FC.grass;if(y>40&&y<50)col=((x+(y>>2&1)*3)%7===0||y%4===0)?FC.road:FC.road2;BG[y*W+x]=col;}
  for(let k=0;k<17;k++)for(let y=0;y<4;y++)for(let x=0;x<4;x++)LV.u32[y*68+k*4+x]=bay(x,y)<k?U('#d3c2b3'):U('#1c130f');LV.put();
  const lab=()=>c.out('den',c.v('den')+'%');c.on('den',lab);lab();c.seg('kind',()=>{});
  const PAT=[()=>false,(x,y)=>!(x&1)&&!(y&1),(x,y)=>((x+y)&1)===0,(x,y)=>!((x&1)&&(y&1)),()=>true];
  let t=0,fr=0;
  return {tick(dt){t+=dt;const den=c.v('den')/100,kind=c.segv('kind'),S=kind==='steam'?STEAM:kind==='oil'?OILSM:SMOKE,anchor=c.v('anchor');
    const cx=((t*9)%150)-27,cy=30,ox=Math.round(t*9),light=S[kind==='oil'?1:3],dense=S[kind==='oil'?3:1];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,dx=(x-cx)/26,dy=(y-cy)/17,r=dx*dx+dy*dy;let a=0;
      if(r<1)a=Math.min(1,den*(1-r)*(.55+.45*vnoise((x-t*9)/9,y/7))*1.5);
      const bg=BG[i],col=a>.55?dense:light,px=anchor?x:x-ox;
      A.u32[i]=a>0&&dith(((px%4)+4)%4,y,a)?col:bg;
      B.u32[i]=a>0?mix32(bg,S[2],a):bg;
      const lv=Math.round(a*4);C.u32[i]=lv>0&&PAT[lv](((px%4)+4)%4,y)?col:bg;}
    A.put();B.put();C.put();
    if(++fr%12===0){setHud(root,`${new Set(A.u32).size} colours`,'a');setHud(root,`${new Set(B.u32).size} colours`,'b');setHud(root,`${new Set(C.u32).size} colours`,'c');}}};});
