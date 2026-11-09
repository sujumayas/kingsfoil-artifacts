// ======================================================================
// HERO: a scrolling slice of a seamless forest strip; a walker on a trail,
// seasons tree by tree, travelling gusts, dither occlusion, birds.
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,fb=px.u32,tiers=$$('.hero-tiers span',root);
  const WW=1024,TAU=Math.PI*2;
  const tm=(x,y)=>[clamp(.5+.47*Math.sin(TAU*x/WW+.35)+(vnoise(x/70,y/70)-.5)*.12,0,1),clamp(.5+.3*Math.sin(TAU*2*x/WW+1.1)+(y/H-.5)*.25,0,1)];
  const py=x=>78+15*Math.sin(TAU*3*x/WW)+5*Math.sin(TAU*7*x/WW+1);
  const trees=buildForest(WW,H+30,{seed:41,biomeAt:(x,y)=>{const [T,M]=tm(x,y);return biomeOf(T,M);},reject:(x,y,u)=>Math.abs(y-py(x))<(u?6:9),wrap:true,densMul:1.05});
  const den=densityGrid(trees,WW,H+30);const TM=[];
  const grounds=[null,null,null,null];let baking=null;
  function bakeStep(s,cols){if(!grounds[s]&&(!baking||baking.s!==s))baking={s,x:0,g:new Uint32Array(WW*H)};if(!baking||baking.s!==s)return;const g=baking.g;
    for(let x=baking.x;x<Math.min(WW,baking.x+cols);x++){const yp=py(x);for(let y=0;y<H;y++){const [T,M]=tm(x,y);let c=groundCol(T,M,biomeOf(T,M),s,den(x,y),x,y);const dp=Math.abs(y-yp);
      if(dp<5-(hash2(x,y)<.5?1:0)){c=pathCol(s,T<.62,x,y);if(dp<1.2&&hash2(x>>1,y)<.3)c=mulc(c,.85,.85,.85);}g[y*WW+x]=c;}}
    baking.x+=cols;if(baking.x>=WW){grounds[s]=g;baking=null;}}
  let season=reduce?2.1:1.35,time=0,shown=-1,frame=0;const p=newWalker(40,py(40));p.dir='right';let camX=0;
  bakeStep(seasonIdx(season),WW);for(let s=0;s<4;s++)if(!grounds[s]&&reduce)bakeStep(s,WW);
  // birds: perch on crowns ahead of the walker, flee at 30 px (Sandbox), flock, land again ahead
  const birds=[],parts=[],flakes=[];const BC=[['#7a5a3a','#d8c8a8'],['#3a6ac8','#e8a060'],['#24232b','#3e3d48'],['#d8402a','#2e8a3a']];
  const wrapNear=(x,ref)=>x+Math.round((ref-x)/WW)*WW;
  function treeAhead(minD,maxD){for(let k=0;k<30;k++){const t=trees[(rnd()*trees.length)|0];if(t.u)continue;const S=spr(t.sp,t.v,seasonIdx(season,t));if(!S.leafy)continue;const x=wrapNear(t.x,p.x+minD);if(x-p.x>minD&&x-p.x<maxD&&t.y>S.h&&t.y<H+10)return [t,x];}return null;}
  function perch(b){const r=treeAhead(60,230);if(!r)return false;const [t,x]=r;const S=spr(t.sp,t.v,seasonIdx(season,t));b.tree=t;b.tx=x;b.px=x+(rnd()-.5)*S.cw*1.1;b.py=t.y-S.h+3+rnd()*4;b.x=b.px;b.y=t.y;b.z=t.y-b.py;b.state='perch';return true;}
  for(let k=0;k<7;k++){const b={col:BC[k%2],flap:rnd()*6,hop:rnd(),vx:0,vy:0,timer:0};if(perch(b))birds.push(b);}
  function updBirds(dt){const fly=birds.filter(b=>b.state==='fly');const wi=seasonIdx(season);
    for(const b of birds){b.flap+=dt*14;if(b.state==='perch'){b.hop-=dt;if(b.hop<=0){b.hop=.6+rnd()*2.5;b.px+=rnd()<.5?-1:1;}const dx=b.px-p.x,dy=b.y-p.y;
        if(dx*dx+dy*dy<30*30){b.state='fly';const L=Math.hypot(dx,dy)||1;b.vx=dx/L*45+20;b.vy=-25+(rnd()-.5)*20;b.timer=3+rnd()*4;}else if(b.px<p.x-140)perch(b);continue;}
      let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,n=0;for(const o of fly){if(o===b)continue;const dx=o.x-b.x,dy=o.y-b.y,d2=dx*dx+dy*dy;if(d2<64){sx-=dx;sy-=dy;}if(d2<1600){ax+=o.vx;ay+=o.vy;cx+=o.x;cy+=o.y;n++;}}
      const tx=p.x+110,ty=40;let fx=sx*1.6+(tx-b.x)*.12,fy=sy*1.6+(ty-b.y)*.12;if(n){fx+=(ax/n-b.vx)*.5+(cx/n-b.x)*.35;fy+=(ay/n-b.vy)*.5+(cy/n-b.y)*.35;}
      b.vx+=fx*dt*2;b.vy+=fy*dt*2;const sp=Math.hypot(b.vx,b.vy),cl=clamp(sp,30,52);b.vx*=cl/(sp||1);b.vy*=cl/(sp||1);b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=(30+Math.sin(b.flap*.2)*4-b.z)*dt;
      b.timer-=dt;if(b.timer<=0){if(!perch(b))b.timer=2;}}
    for(const b of birds){if(b.state==='perch'&&b.tree)b.col=wi===3?BC[2]:(b.tree.bi===5?BC[3]:(wi===0&&b.col===BC[2]?BC[1]:b.col===BC[2]||b.col===BC[3]?BC[0]:b.col));}}
  return {tick(dt){time+=dt;frame++;season=(season+dt*.057)%4;
    const gs=seasonIdx(season);if(!grounds[gs])bakeStep(gs,96);else if(!grounds[(gs+1)%4])bakeStep((gs+1)%4,24);
    if(gs!==shown){shown=gs;tiers.forEach(s=>s.classList.toggle('on',+s.dataset.t===gs));}
    p.x+=17*dt;const ny=py(p.x);p.dir=Math.abs(ny-p.y)>17*dt*.9?(ny>p.y?'down':'up'):'right';p.y=ny;p.moving=true;p.anim+=dt*8;camX=p.x-92;
    // ground slice
    const g=grounds[gs]||grounds.find(x=>x)||new Uint32Array(WW*H);const cx0=((Math.round(camX)%WW)+WW)%WW;
    for(let y=0;y<H;y++){const row=y*WW;for(let x=0;x<W;x++)fb[y*W+x]=g[row+((cx0+x)%WW)];}
    const wind=.38+.22*Math.sin(time*.13);
    // litter stamps
    for(const q of parts)if(q.land){const sx=Math.round(q.x-camX);if(sx>=0&&sx<W&&q.y>=0&&q.y<H)fb[(q.y|0)*W+sx]=q.col;}
    const r=drawForest(fb,W,H,trees,{camX:Math.round(camX),wrapW:WW,season,time,wind,player:p,occ:'dither',fadeP:.5,
      perTree:(t,X,Y,S)=>{for(const b of birds)if(b.state==='perch'&&b.tree===t)drawBirdPerch(fb,W,H,b.px-camX+(t.sw||0),b.py+(b.hop<.15?-1:0),U(b.col[0]),U(b.col[1]));}});
    // falling leaves / petals / snow
    if(rnd()<dt*14){const t=trees[(rnd()*trees.length)|0];const k=seasonIdx(season,t),sp=SPECIES[t.sp];const x=wrapNear(t.x,p.x);if(!t.u&&x>camX&&x<camX+W){const S=spr(t.sp,t.v,k);
      if((k===2&&sp.dec)||(k===0&&sp.blossom)){const pal=sp.leaf[k];parts.push({x:x+(rnd()-.5)*S.cw*1.6,y:t.y+(rnd()-.5)*6,z:S.h-S.cb*.5,vz:7+rnd()*5,ph:rnd()*6,col:k===0?U('#ffc8dc'):pal[(rnd()*3)|0],life:6});}}}
    for(let i=parts.length-1;i>=0;i--){const q=parts[i];if(q.land){q.life-=dt*.2;if(q.life<=0||q.x<camX-20)parts.splice(i,1);continue;}q.life-=dt;q.x+=(wind*14+Math.sin(time*3+q.ph)*6)*dt;q.z-=q.vz*dt;
      if(q.z<=0){q.land=1;q.life=3;continue;}const sx=Math.round(q.x-camX),sy=Math.round(q.y-q.z);if(sx>=0&&sx<W&&sy>=0&&sy<H)fb[sy*W+sx]=q.col;}
    if(parts.length>220)parts.splice(0,parts.length-220);
    updBirds(dt);
    for(const b of birds){if(b.state!=='fly')continue;const sx=b.x-camX,sy=b.y;for(let q=-1;q<=1;q++){const xx=Math.round(sx+q),yy=Math.round(sy+b.z*.25);if(xx>=0&&xx<W&&yy>=0&&yy<H)fb[yy*W+xx]=mix32(fb[yy*W+xx],SHADOWC,.28);}
      drawBirdFly(fb,W,H,sx,sy-b.z,Math.sin(b.flap)>0?0:1,U(b.col[0]));}
    if(gs===3){while(flakes.length<70)flakes.push([rnd()*W,rnd()*H,rnd()]);for(const f of flakes){f[1]+=(.25+f[2]*.35)*dt*60;f[0]+=(wind*.5+Math.sin(time+f[2]*9)*.2)*dt*60-17*dt;if(f[1]>H){f[1]=0;f[0]=rnd()*W;}if(f[0]<0)f[0]+=W;if(f[0]>=W)f[0]-=W;
      const i=(f[1]|0)*W+(f[0]|0);if(i>=0&&i<W*H){fb[i]=U('#f4f8ff');if(f[2]>.7&&(f[0]|0)+1<W)fb[i+1]=U('#f4f8ff');}}}else flakes.length=0;
    px.put();
    if(frame%10===1){const [T,M]=tm(((p.x%WW)+WW)%WW,p.y);const b=BIOMES[biomeOf(T,M)];let turned=0,n=0;for(const t of trees){if(t.u||!SPECIES[t.sp].dec)continue;n++;if(seasonIdx(season,t)!==gs)turned++;}
      setHud(root,`${b.n} · ${SEASONS[gs]} · ${Math.round(turned/Math.max(1,n)*100)} % of broadleaves still turning · ${r.vis} drawn · ${birds.filter(b=>b.state==='fly').length} birds flying`);}}};});

// ======================================================================
// DOOM fire next to a canopy-depth automaton (one byte, one rule, one palette)
// ======================================================================
reg('doom',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root);const W=A.W,H=A.H,N=W*H;
  const RGB=[0x07,0x07,0x07,0x1F,0x07,0x07,0x2F,0x0F,0x07,0x47,0x0F,0x07,0x57,0x17,0x07,0x67,0x1F,0x07,0x77,0x1F,0x07,0x8F,0x27,0x07,0x9F,0x2F,0x07,0xAF,0x3F,0x07,0xBF,0x47,0x07,0xC7,0x47,0x07,0xDF,0x4F,0x07,0xDF,0x57,0x07,0xDF,0x57,0x07,0xD7,0x5F,0x07,0xD7,0x5F,0x07,0xD7,0x67,0x0F,0xCF,0x6F,0x0F,0xCF,0x77,0x0F,0xCF,0x7F,0x0F,0xCF,0x87,0x17,0xC7,0x87,0x17,0xC7,0x8F,0x17,0xC7,0x97,0x1F,0xBF,0x9F,0x1F,0xBF,0x9F,0x1F,0xBF,0xA7,0x27,0xBF,0xA7,0x27,0xBF,0xAF,0x2F,0xB7,0xAF,0x2F,0xB7,0xB7,0x2F,0xB7,0xB7,0x37,0xCF,0xCF,0x6F,0xDF,0xDF,0x9F,0xEF,0xEF,0xC7,0xFF,0xFF,0xFF];
  const FP=[];for(let i=0;i<37;i++)FP.push(pack(RGB[i*3],RGB[i*3+1],RGB[i*3+2]));
  const F=new Uint8Array(N);let fireOn=true;for(let x=0;x<W;x++)F[(H-1)*W+x]=36;
  // canopy: M = leaf or gap, D = depth into canopy (0..4), relaxed one pass per step
  const M=new Uint8Array(N),D=new Uint8Array(N),G=new Uint32Array(N);let felling=false;
  const rng=mkRng(9);for(const [x,y] of poisson(W,H,15,20,rng,{margin:0})){const R=7+rng()*6;for(let yy=Math.floor(y-R);yy<=y+R;yy++)for(let xx=Math.floor(x-R);xx<=x+R;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;const d=Math.hypot(xx-x,(yy-y)*1.15)/R;if(d<1-hash2(xx,yy)*.25)M[yy*W+xx]=1;}}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)G[y*W+x]=groundCol(.5,.55,3,1,.6,x,y);
  const ROWS=[L.oakSp,L.oakSu,L.oakAu,P(['#f6f9ff','#d5deef','#aebbd6','#6d7a8c','#3a4252'])];const CLOWN=[U('#d8f08a'),U('#3d6a34')];
  let season=1;c.seg('season',v=>season=+v);
  c.btn('fire',b=>{fireOn=!fireOn;b.textContent=fireOn?'Switch the fire off':'Switch the fire on';for(let x=0;x<W;x++)F[(H-1)*W+x]=fireOn?36:0;});
  c.btn('fell',b=>{felling=!felling;b.textContent=felling?'Let the canopy regrow':'Thin the canopy';});
  pointer(cvs[1],([x,y],k)=>{if(k!=='down'&&k!=='drag')return;for(let yy=-5;yy<=5;yy++)for(let xx=-5;xx<=5;xx++){const X=(x|0)+xx,Y=(y|0)+yy;if(X<0||Y<0||X>=W||Y>=H||xx*xx+yy*yy>25)continue;M[Y*W+X]=0;}});
  function stepFire(){for(let x=0;x<W;x++)for(let y=1;y<H;y++){const src=y*W+x,p=F[src];if(p===0){F[src-W]=0;continue;}const rr=(rnd()*3.999)|0;const dst=src-rr+1;if(dst-W>=0)F[dst-W]=Math.max(0,p-(rr&1));}}
  function stepCanopy(){for(let k=0;k<(felling?260:90);k++){const i=(rnd()*N)|0,x=i%W,y=(i/W)|0;if(x<1||y<1||x>=W-1||y>=H-1)continue;
      let n=M[i-1]+M[i+1]+M[i-W]+M[i+W]+M[i-W-1]+M[i-W+1]+M[i+W-1]+M[i+W+1];if(felling){if(M[i]&&n<8)M[i]=0;}else if(!M[i]&&n>=3)M[i]=1;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!M[i]){D[i]=0;continue;}const a=x>0?D[i-1]:0,b=x<W-1?D[i+1]:0,u=y>0?D[i-W]:0,d=y<H-1?D[i+W]:0;D[i]=Math.min(4,Math.min(a,b,u,d)+1);}}
  if(reduce)for(let k=0;k<120;k++){stepFire();stepCanopy();}
  let acc=0,fr=0,t=0;
  return {tick(dt){t+=dt;acc+=dt*30;let n=0;while(acc>=1&&n<3){stepFire();stepCanopy();acc--;n++;}fr++;
    const u=A.u32;for(let i=0;i<N;i++)u[i]=FP[F[i]];A.put();
    const v=B.u32,pal=ROWS[season],cyc=c.v('cyc');let cov=0,rim=0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,d=D[i];if(!d){v[i]=G[i];continue;}cov++;
      const ul=(x>0&&y>0)?D[i-W-1]:0,dr=(x<W-1&&y<H-1)?D[i+W+1]:0;const lit=ul<d,sh=dr<d;let k=2+(sh?1:0)-(lit?1:0)+(d===1&&sh?1:0)-(d===1&&lit?1:0);if(d>=3&&hash2(x,y)<.12)k+=hash2(y,x)<.5?-1:1;
      let col=pal[clamp(k,0,4)];if(cyc&&d===1){rim++;const ph=((t*6+((x+y*.5)/9|0))|0)&1;col=CLOWN[(ph+(x+y))&1];}v[i]=col;}
    B.put();if(fr%15===0)setHud(root,`canopy cover ${Math.round(cov/N*100)} %${cyc?` · ${rim} rim px cycling (${(rim/N*100).toFixed(1)} %)`:''}`);}};});

// ======================================================================
// Timeline (lanes + list)
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#93a28a','#a8d46c','#f0c25a','#6dd4c3'];
  const X=y=>y<1990?(y-1885)/105*24:y<2023?26+(y-1990)/33*44:72+(y-2023)/3.6*27;
  let h='<div class="tl-axis">';for(const y of [1890,1940,2000,2010,2020])h+=`<span style="left:${X(y)}%">${y}</span>`;h+=`<span style="left:${X(2024)}%">2024</span><span style="left:${X(2025.5)}%">2025</span><span style="left:${X(2026.5)}%">2026</span><i class="tl-brk" style="left:70.9%"></i><i class="tl-brk" style="left:24.9%"></i></div>`;
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
  const pick=items.find(i=>/Godot 4\.7/.test(i.e.h))||items[items.length-1];show(pick.id);return {};});

// ======================================================================
// A1 two-layer metatiles · A2 canopy overlay · A3 Tibia diagonal order
// ======================================================================
reg('layers',root=>{const cvs=$$('canvas',root),P3=cvs.map(PX),c=ctl(root),ovl=$('svg.ovl',root);const W=96,H=80,TS=16;
  const TT=[[1,2],[4,1],[3,4]];const sprs=TT.map((q,k)=>genSprite(SPECIES[0],300+k*17,.8,1,{leafIdx:1}));
  const G=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)G[y*W+x]=groundCol(.55,.6,3,1,.3,x,y);
  const trees=TT.map(([tx,ty],k)=>{const S=sprs[k];return {tx,ty,S,bx:tx*TS+8,by:ty*TS+14,X:tx*TS+8-S.ax,Y:ty*TS+14-S.h+1};});
  const WP=[[8,24],[40,24],[40,34],[88,30],[88,8],[58,8],[58,56],[8,56]];let wp=1;const p=newWalker(8,24);
  // A2 overlay textures (generated): a leaf tile and a fog field
  const leafT=new Uint32Array(32*32),leafA=new Uint8Array(32*32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const n=vnoise(x/4,y/4)*.7+hash2(x,y)*.3;if(n>.52){leafA[y*32+x]=1;leafT[y*32+x]=L.oakSu[n>.7?3:n>.6?2:1];}}
  let ovMode='canopy',diag=-1,dT=0;c.seg('ov',v=>ovMode=v);
  // the diagonal-order overlay
  const tilesTxt=[];for(let ty=0;ty<5;ty++)for(let tx=0;tx<6;tx++){const d=tx+ty;tilesTxt.push(svgText(ovl,tx*TS+3,ty*TS+6,'',{'font-size':4.5,fill:'#f0c25a'}));tilesTxt[tilesTxt.length-1].dataset.d=d;}
  const rect=svgEl('rect',{x:0,y:0,width:16,height:16,fill:'none',stroke:'#f0c25a','stroke-width':.8,opacity:0},ovl);
  function drawLayers(fb,o){fb.set(G);const pTop=Math.round(p.y)-11;
    // A1: rows at or below the trunk's tile top go to the floor layer, rows above to the ceiling layer
    const parts=(t,floor)=>{const split=t.ty*TS;const S=t.S;for(let r=0;r<S.h;r++){const yy=t.Y+r;if(yy<0||yy>=H)continue;if((yy>=split)!==floor)continue;for(let q=0;q<S.w;q++){let col=S.px[r*S.w+q];if(!col)continue;const xx=t.X+q;if(xx<0||xx>=W)continue;
      if(!floor&&o.holes&&S.li&&S.li[r*S.w+q]===3&&hash2(xx,yy)<.4)continue;if(o.tint)col=mix32(col,floor?U('#6dd4c3'):U('#f0c25a'),.35);fb[yy*W+xx]=col;}}};
    for(const t of trees)parts(t,true);drawPlayer(fb,W,H,p,0,0);for(const t of trees)parts(t,false);}
  function drawYSort(fb){fb.set(G);const it=trees.map(t=>[t.by,t]);it.push([p.y+.5,null]);it.sort((a,b)=>a[0]-b[0]);for(const [,t] of it){if(!t)drawPlayer(fb,W,H,p,0,0);else blit(fb,W,H,t.S,t.X,t.Y,{});}}
  function drawTibia(fb){fb.set(G);const ptx=clamp(Math.floor(p.x/TS),0,5),pty=clamp(Math.floor((p.y-1)/TS),0,4);
    for(let d=0;d<=9;d++)for(let tx=0;tx<6;tx++){const ty=d-tx;if(ty<0||ty>4)continue;
      for(const t of trees)if(t.tx===tx&&t.ty===ty){const S=t.S,X=tx*TS-20+Math.round((32-S.w)/2)+4,Y=ty*TS-20+(32-S.h)+4;blit(fb,W,H,S,X+4,Y+4,{});}
      if(tx===ptx&&ty===pty)drawPlayer(fb,W,H,p,0,0);}}
  return {tick(dt){const [tx,ty]=WP[wp];const dx=tx-p.x,dy=ty-p.y;if(Math.hypot(dx,dy)<1.2)wp=(wp+1)%WP.length;walkerStep(p,dx,dy,16,dt);
    drawLayers(P3[0].u32,{holes:c.v('holes'),tint:c.v('tint')});P3[0].put();
    const fb=P3[1].u32;drawYSort(fb);if(ovMode!=='none'){const a=Math.round(c.v('ova')*31/100)/31;const t=performance.now()/1000;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(ovMode==='canopy'){const k=((y+((t*2)|0))&31)*32+((x+((t*3)|0))&31);if(leafA[k])fb[i]=mix32(fb[i],leafT[k],a);}
        else{const n=vnoise(x/14+t*.25,y/10)*.8+vnoise(x/5,y/5+t*.4)*.2;fb[i]=mix32(fb[i],U('#d9e2d4'),a*clamp(n*1.4-.2,0,1));}}}
    P3[1].put();
    drawTibia(P3[2].u32);P3[2].put();
    const show=c.v('diag');dT+=dt;if(show&&dT>.35){dT=0;diag=(diag+1)%11;}
    tilesTxt.forEach((e,k)=>{const d=+e.dataset.d,tx=k%6,ty=(k/6)|0;let ord=0;for(let dd=0;dd<d;dd++)for(let q=0;q<6;q++){const r=dd-q;if(r>=0&&r<=4)ord++;}for(let q=0;q<tx;q++){if(d-q>=0&&d-q<=4)ord++;}
      e.textContent=show?(ord+1):'';e.setAttribute('opacity',show&&d<=diag?1:.35);});
    const ptx=clamp(Math.floor(p.x/TS),0,5),pty=clamp(Math.floor((p.y-1)/TS),0,4);rect.setAttribute('x',ptx*TS);rect.setAttribute('y',pty*TS);rect.setAttribute('opacity',show?1:0);}};});

// ======================================================================
// A4: building a pixel tree, step by step (silhouette → clusters → ramp → outlines → bark)
// ======================================================================
reg('treebuild',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),note=$('.stepnote',root),stepBtns=$$('.steps button',root);
  const UW=32,UH=26;            // leaf units of 2×2 px; crown area 64×52 px
  const NOTES=[
    '<b>1 · Silhouette.</b> One shape function per species gives the half-width at each height (Weber &amp; Penn). Conical <code>0.2+0.8r</code> for pine, spherical <code>0.2+0.8·sin(πr)</code> for oak; the flame curve here is an illustrative stand-in for poplar.',
    '<b>2 · Clusters of leaf units.</b> Slynyrd\'s leaf unit is "a small 2x2px square"; "even ball shapes work great". Here the bundles sit at golden-angle offsets squashed ×0.7 (the blob recipe in G6). <b>Click the canvas to add a bundle.</b>',
    '<b>3 · A ramp by depth into the canopy.</b> Reeves &amp; Blau shade by depth from the light side plus distance to the edge. In pixels: <code>index = floor(clamp(k1·d_light + k2·(R − d_edge) + bayer·0.25)·(STEPS−1))</code>, with 4 or 5 colours per bundle and one consistent light.',
    '<b>4 · Outlines only at depth jumps.</b> Deussen &amp; Strothotte draw a line only where depth jumps by more than a threshold, and on the silhouette. Raise the threshold and the tree gets more abstract.',
    '<b>5 · Trunk and bark.</b> Stripes "widest in the center", a knot, a root flare, and a drop shadow from the crown onto the trunk top. Change the species to swap the bark ramp (Sandbox palettes).'];
  let step=0,shape='sphere',balls=[],extra=[];
  const ratio=r=>shape==='cone'?.2+.8*r:shape==='sphere'?.2+.8*Math.sin(Math.PI*r):(r<.7?r/.7:(1-r)/.3)*.9+.1;
  const CY0=2,CY1=24,CX=16,RW=12.5;
  const half=uy=>{const r=(uy-CY0)/(CY1-CY0);return r<0||r>1?-1:RW*ratio(r);};
  function autoBalls(){const n=c.v('n');balls=[];const cy=(CY0+CY1)/2,ry=(CY1-CY0)/2;
    for(let k=0;k<n;k++){const a=k*2.39996,d=Math.sqrt((k+.5)/n);let bx=CX+Math.cos(a)*d*RW*.7,by=cy+Math.sin(a)*d*ry*.7;const hw=Math.max(2,half(Math.round(by)));bx=clamp(bx,CX-hw+1,CX+hw-1);balls.push([bx,by,Math.max(2.4,Math.min(5.5,hw*.55+1.2))]);}
    balls.push(...extra);}
  c.seg('shape',v=>{shape=v;autoBalls();});c.on('n',()=>{autoBalls();c.out('n',c.v('n'));});c.out('n',c.v('n'));
  const setStep=s=>{step=s;stepBtns.forEach((b,i)=>b.classList.toggle('on',i===s));note.innerHTML=NOTES[s];};stepBtns.forEach((b,i)=>b.addEventListener('click',()=>setStep(i)));
  c.btn('clear',()=>{extra=[];autoBalls();});
  pointer(cv,([x,y],k)=>{if(k!=='down')return;const ux=x/2,uy=y/2;if(uy>CY1+1)return;extra.push([ux,uy,3+rnd()*1.5]);if(extra.length>8)extra.shift();autoBalls();if(step<1)setStep(1);});
  let sp=0;c.seg('sp',v=>sp=+v);const SPS=[0,2,4];
  autoBalls();setStep(0);
  return {tick(dt){const fb=px.u32;fb.fill(U('#18211a'));const steps=c.v('steps'),la=c.v('light')*Math.PI/180,thr=c.v('thr')/10,lx=Math.cos(la),ly=Math.sin(la);
    const pal=SPS[sp]===4?L.pi:SPS[sp]===2?L.biSu:L.oakSu,B=SPECIES[SPS[sp]].bark,ramp=steps===4?[pal[0],pal[1],pal[2],pal[4]]:pal;
    // ground shadow (centred under the tree, Slynyrd)
    if(step>=4)stackEllipse(fb,W,H,32,61,13,3,.35);
    // trunk
    const tTop=CY1*2-4,tBot=62;
    if(step>=4){const tw=6;const cols=[B[2],B[1],B[0],B[0],B[1],B[2]];for(let y=tTop;y<=tBot;y++){const fl=y>=tBot-1?(tBot-y===0?2:1):0;for(let dx=-3-fl;dx<3+fl;dx++){const k=clamp(dx+3,0,5);let col=cols[k];if(sp===1){col=hash2(dx+40,y>>1)<.22&&((y+dx)&1)?B[2]:dx>1?B[1]:B[0];}
      if((y===tTop+8||y===tTop+9)&&(dx===0))col=B[2];if(y<tTop+3)col=mulc(col,.6,.62,.7);fb[y*W+32+dx]=col;}}}
    // crown at unit resolution
    const own=new Int16Array(UW*UH).fill(-1);const ord=balls.map((b,i)=>i).sort((a,b)=>balls[a][1]-balls[b][1]);
    for(let uy=0;uy<UH;uy++){const hw=half(uy);for(let ux=0;ux<UW;ux++){const inS=hw>=0&&Math.abs(ux+.5-CX)<=hw;if(step===0){if(inS)own[uy*UW+ux]=0;continue;}
      for(const bi of ord){const [bx,by,br]=balls[bi];const dx=(ux+.5-bx)/br,dy=(uy+.5-by)/(br*.9);if(dx*dx+dy*dy<=1&&(inS||step>=1))own[uy*UW+ux]=bi;}}}
    for(let uy=0;uy<UH;uy++)for(let ux=0;ux<UW;ux++){const b=own[uy*UW+ux];if(b<0)continue;let col;
      if(step===0)col=pal[2];else if(step===1)col=[pal[1],pal[2],pal[3]][b%3];
      else{const [bx,by,br]=balls[b];const dx=ux+.5-bx,dy=uy+.5-by,dist=Math.hypot(dx,dy*1.1)/br;const dl=(dx*lx+dy*ly)/br*.5+.5;const gl=((ux-CX)*lx+(uy-(CY0+CY1)/2)*ly)/RW*.5+.5;
        let v=.62*(.6*dl+.4*gl)+.38*dist+(bay(ux,uy)/16-.5)*.25;let k=Math.floor(clamp(v,0,.999)*steps);
        if(step>=3){const nb=[[1,0],[-1,0],[0,1],[0,-1]];for(const [ox,oy] of nb){const q=ux+ox,r=uy+oy;const o2=(q<0||r<0||q>=UW||r>=UH)?-1:own[r*UW+q];
          if(o2<0){if(ox*lx+oy*ly>-.2)k=steps-1;}else if(o2!==b&&balls[o2][1]-balls[b][1]>thr*3&&ord.indexOf(o2)>ord.indexOf(b))k=steps-1;}}
        col=ramp[clamp(k,0,steps-1)];}
      for(let q=0;q<4;q++){const x=ux*2+(q&1),y=uy*2+(q>>1);fb[y*W+x]=col;}}
    if(step===1)for(const [bx,by,br] of balls){const X=Math.round(bx*2),Y=Math.round(by*2);if(X>=0&&X<W&&Y>=0&&Y<H)fb[Y*W+X]=U('#f0c25a');}
    px.put();setHud(root,`${balls.length} bundles · ${steps} colours · ${['silhouette','clusters','ramp','outlines','bark'][step]}`);}};});
