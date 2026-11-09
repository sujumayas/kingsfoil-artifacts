// ======================================================================
// helper: a small live forest view (used by several figures)
// ======================================================================
function miniForest(W,H,o){const st={trees:[],ground:null,season:o.season===undefined?1:o.season,time:rnd()*10,mask:null,fb:null};
  st.build=(bi,seed,extra={})=>{st.bi=bi;st.trees=buildForest(W,H+28,{seed,biome:bi,...extra});st.trees.forEach(t=>t.y-=0);st.bake();};
  st.bake=()=>{const T=BIOME_TM[st.bi>=0?st.bi:4];st.ground=bakeGround(W,H,st.trees,st.season,()=>T,{bio:st.bi>=0?st.bi:4,ox:(st.bi+1)*977});};
  st.draw=(fb,dt,extra={})=>{st.time+=dt;return drawForest(fb,W,H,st.trees,{ground:st.ground,season:st.season,time:st.time,wind:extra.wind===undefined?.45:extra.wind,mask:st.mask||(st.mask=new Float32Array(W*H)),...extra});};
  return st;}

// ======================================================================
// B1: climate → biome table; drag a point on temperature × moisture
// ======================================================================
reg('biome',root=>{const cvs=$$('canvas',root),Mp=PX(cvs[0]),F=PX(cvs[1]),c=ctl(root),svg=$('svg.ovl',root),ro=$('[data-ro]',root);
  const MW=Mp.W,MH=Mp.H;let mode='sandbox',pt=[.59,.7],season=1;
  const LU=[['Taiga',25,70,'#2f5a4a'],['Deciduous',60,68,'#4f8a3a'],['Rainforest',86,65,'#1f6a3a'],['Savanna',89,42,'#c9b064']];
  const RB=(e,m)=>e>.6?(m>=.66?['Taiga','#2f5a4a']:['non-forest (not in this table)','#3a3f36']):e>.3?(m<.83?['Temperate deciduous','#4f8a3a']:['Temperate rain forest','#2b6e4a']):(m<.66?['Tropical seasonal forest','#8a9a48']:['Tropical rain forest','#1f6a3a']);
  const LUn=(T,M)=>{let b=0,bd=1e9;LU.forEach((q,i)=>{const d=(T*100-q[1])**2+(M*100-q[2])**2;if(d<bd){bd=d;b=i;}});return LU[b];};
  function paintMap(){const u=Mp.u32;for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const T=(x+.5)/MW,M=1-(y+.5)/MH;let col;
      if(mode==='sandbox')col=U(BIOMES[biomeOf(T,M)].col);else if(mode==='redblob')col=U(RB(T,M)[1]);else col=U(LUn(T,M)[3]);
      if(bay(x,y)<2)col=mulc(col,.85,.85,.85);u[y*MW+x]=col;}Mp.put();
    svg.innerHTML='';const SHORT=['Boreal','Mixed','Birch','Deciduous','Open oak','Rainforest','Savanna'];const lab=mode==='sandbox'?BIOMES.map((b,i)=>[SHORT[i],[BIOME_TM[i][0],BIOME_TM[i][1]-(i===1||i===3?.1:0)]]):mode==='redblob'?[['Taiga',[.8,.83]],['Temp. deciduous',[.45,.45]],['Temp. rain',[.45,.92]],['Trop. seasonal',[.15,.35]],['Trop. rain',[.15,.83]],['(other)',[.8,.33]]]:LU.map(q=>[q[0],[q[1]/100,q[2]/100]]);
    for(const [n,[T,M]] of lab)svgText(svg,T*240,(1-M)*240+(mode==='luanti'?-6:3),n,{'text-anchor':'middle'});
    if(mode==='luanti')LU.forEach(q=>svgEl('circle',{cx:q[1]*2.4,cy:(100-q[2])*2.4,r:3,fill:'#e2ead8'},svg));
    svgText(svg,236,233,mode==='redblob'?'e (elevation) →':'temperature →',{'text-anchor':'end',class:'axl'});svgText(svg,4,11,mode==='luanti'?'↑ humidity':'↑ moisture',{class:'axl'});
    dot=svgEl('circle',{cx:pt[0]*240,cy:(1-pt[1])*240,r:7,class:'pt'},svg);}
  let dot,bi=-2,seed=11;const mf=miniForest(F.W,F.H,{season});
  function update(){const [T,M]=pt;dot.setAttribute('cx',T*240);dot.setAttribute('cy',(1-M)*240);const b=biomeOf(T,M);if(b!==bi){bi=b;mf.build(b,seed);}
    const B=BIOMES[b];const other=mode==='redblob'?` · Red Blob reads (e, m) as <b>${RB(T,M)[0]}</b>`:mode==='luanti'?` · Luanti's nearest point is <b>${LUn(T,M)[0]}</b>`:'';
    ro.innerHTML=`T ${T.toFixed(2)} · M ${M.toFixed(2)} → <b>${B.n}</b> (Sandbox) · density ${B.dens} · undergrowth ${B.und} · species ${Object.entries(B.w).map(([k,v])=>k+' '+v).join(', ')}${other}`;}
  c.seg('mode',v=>{mode=v;paintMap();update();});c.seg('season',v=>{season=+v;mf.season=season;mf.bake();});
  c.btn('reseed',()=>{seed++;bi=-2;update();});
  const stage=cvs[0].parentElement;
  stage.addEventListener('pointerdown',e=>{drag=true;try{stage.setPointerCapture(e.pointerId);}catch(_){}mv(e);});stage.addEventListener('pointermove',e=>{if(drag)mv(e);});stage.addEventListener('pointerup',()=>drag=false);
  let drag=false;function mv(e){const r=stage.getBoundingClientRect();pt=[clamp((e.clientX-r.left)/r.width,0,1),clamp(1-(e.clientY-r.top)/r.height,0,1)];update();}
  stage.addEventListener('keydown',e=>{const d={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,.02],ArrowDown:[0,-.02]}[e.key];if(d){e.preventDefault();pt=[clamp(pt[0]+d[0],0,1),clamp(pt[1]+d[1],0,1)];update();}});
  paintMap();update();
  return {tick(dt){mf.draw(F.u32,dt);F.put();}};});

// ======================================================================
// B2: species weights × slow cluster noise → groves (with a Hopkins index)
// ======================================================================
reg('groves',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),bars=$('[data-bars]',root),ro=$('[data-ro]',root);
  const BI=1,B=BIOMES[BI],names=Object.keys(B.w);let seed=5,trees=[],pts=[],view='trees',focus='Birch',ground,time=0;const SPC={Pine:'#457a40',Oak:'#d58e3a',Birch:'#f2efe6',Spruce:'#53967c',Maple:'#ec5a3c'};
  pts=poisson(W,H+26,9,24,mkRng(3),{margin:2});
  function hopkins(sp){const P=trees.filter(t=>t.sp===sp);if(P.length<6)return NaN;const r=mkRng(77);let su=0,sw=0;const m=Math.min(25,P.length>>1);
    const nn=(x,y,ex)=>{let b=1e9;for(const q of P){if(q===ex)continue;const d=(q.x-x)**2+(q.y-y)**2;if(d<b)b=d;}return b;};
    for(let k=0;k<m;k++){su+=nn(8+r()*(W-16),8+r()*(H-16),null);const q=P[(r()*P.length)|0];sw+=nn(q.x,q.y,q);}return su/sw;}
  function gen(){const rng=mkRng(seed),con=c.v('con')/100,sc=c.v('sc');trees=[];
    for(const [x,y] of pts){if(rng()>B.dens)continue;const sp=pickSpecies(B.w,x+seed*50,y,rng,con,sc);trees.push({x:Math.round(x),y:Math.round(y),sp,v:(rng()*NV)|0,ph:rng()*6.28,off:0,shake:0});}
    ground=bakeGround(W,H,trees,1,()=>BIOME_TM[BI],{bio:BI});
    const cnt={};trees.forEach(t=>cnt[t.sp]=(cnt[t.sp]||0)+1);const tot=trees.length,wt=names.reduce((a,n)=>a+B.w[n],0);
    bars.innerHTML=names.map(n=>{const si=SI[n],k=cnt[si]||0,h=hopkins(si);return `<button type="button" class="mb${n===focus?' on':''}" data-n="${n}"><span>${n}</span><i style="--w:${k/tot*100}%;background:linear-gradient(90deg,${SPC[n]} ${k/tot*100}%,#1e2a1b ${k/tot*100}%)"></i><b>${Math.round(k/tot*100)} %</b><small>weight ${Math.round(B.w[n]/wt*100)} % · H ${isNaN(h)?'–':h.toFixed(2)}</small></button>`;}).join('');
    c.out('con',Math.round(con*100)+' %');c.out('sc','x/'+sc);}
  bars.addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;focus=b.dataset.n;$$('[data-n]',bars).forEach(x=>x.classList.toggle('on',x===b));});
  c.on('con',gen);c.on('sc',gen);c.seg('view',v=>view=v);c.btn('reseed',()=>{seed++;gen();});gen();
  return {tick(dt){time+=dt;const fb=F.u32;const si=SI[focus],sc=c.v('sc');
    if(view==='noise'){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise((x+seed*50)/sc+si*13,y/sc+si*7);fb[y*W+x]=mix32(U('#0d120c'),U(SPC[focus]),n*.9);}
      for(const t of trees){const i=(t.y-1)*W+t.x;if(t.y>0&&t.y<=H&&t.x>=0&&t.x<W)fb[i]=t.sp===si?U('#f0c25a'):U('#1e2a1b');}}
    else if(view==='dots'){fb.set(ground);for(const t of trees){const col=U(SPC[SPECIES[t.sp].n]);for(let q=0;q<4;q++){const x=t.x+(q&1),y=t.y-2+(q>>1);if(x>=0&&x<W&&y>=0&&y<H)fb[y*W+x]=col;}}}
    else drawForest(fb,W,H,trees,{ground,season:1,time,wind:.35,shadows:true,dapple:false});
    F.put();}};});

// ======================================================================
// B3: white noise vs jittered grid vs Bridson (animated) vs local-max noise
// ======================================================================
reg('poisson',root=>{const cvs=$$('canvas',root),P4=cvs.map(PX),c=ctl(root);const W=96,H=96;let S=[],br=null,seed=1;
  const GC=U('#3d5a33'),DOT=U('#a8d46c'),DOT2=U('#2c4a24'),HOT=U('#f0c25a'),RED=U('#ff6b5e'),ACT=U('#6dd4c3');
  const stats=pts=>{const r=c.v('r');let md=1e9,bad=0;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const d=Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1]);if(d<md)md=d;if(d<r*.999)bad++;}return {n:pts.length,md:pts.length>1?md:0,bad};};
  function gen(){const r=c.v('r'),rng=mkRng(seed);c.out('r',r+' px');c.out('k',c.v('k'));c.out('keep',c.v('keep')+' %');
    // Bridson, stepped live
    const cs=r/Math.SQRT2,gw=Math.ceil(W/cs),gh=Math.ceil(H/cs);br={r,k:c.v('k'),cs,gw,gh,grid:new Int32Array(gw*gh).fill(-1),pts:[],act:[],rng:mkRng(seed+9),cur:-1,tries:0,done:false};
    const add=(x,y)=>{br.pts.push([x,y]);br.act.push(br.pts.length-1);br.grid[((y/cs)|0)*gw+((x/cs)|0)]=br.pts.length-1;};br.add=add;add(W/2,H/2);
    // jittered grid: one candidate per cell, jitter ≤ 0.5 cell, keep with probability = density
    const cell=r*1.15,keep=c.v('keep')/100,jg=[];for(let gy=0;gy*cell<H;gy++)for(let gx=0;gx*cell<W;gx++){const x=(gx+.25+.5*rng())*cell,y=(gy+.25+.5*rng())*cell;if(x<W&&y<H&&rng()<keep)jg.push([x,y]);}
    // local maxima of high-frequency noise within radius R
    const R=Math.max(2,Math.round(r*.55)),N=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)N[y*W+x]=vnoise(x/2.2+seed*31,y/2.2)*.7+hash2(x+seed,y)*.3;
    const lm=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=N[y*W+x];let ok=true;for(let dy=-R;dy<=R&&ok;dy++)for(let dx=-R;dx<=R;dx++){if(!dx&&!dy)continue;if(dx*dx+dy*dy>R*R)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;if(N[Y*W+X]>v){ok=false;break;}}if(ok)lm.push([x,y]);}
    S=[null,jg,null,lm];}
  function finishWhite(){const rng=mkRng(seed+3),n=br.pts.length,w=[];for(let k=0;k<n;k++)w.push([rng()*W,rng()*H]);S[0]=w;}
  function bstep(n){for(let s=0;s<n&&br.act.length;s++){const ai=(br.rng()*br.act.length)|0,[px,py]=br.pts[br.act[ai]];br.cur=br.act[ai];let found=false;
      for(let t=0;t<br.k;t++){br.tries++;const a=br.rng()*6.283,d=br.r*(1+br.rng());const x=px+Math.cos(a)*d,y=py+Math.sin(a)*d;if(x<1||y<1||x>=W-1||y>=H-1)continue;const gx=(x/br.cs)|0,gy=(y/br.cs)|0;let ok=true;
        for(let yy=Math.max(0,gy-2);yy<=Math.min(br.gh-1,gy+2)&&ok;yy++)for(let xx=Math.max(0,gx-2);xx<=Math.min(br.gw-1,gx+2);xx++){const q=br.grid[yy*br.gw+xx];if(q>=0){const dx=br.pts[q][0]-x,dy=br.pts[q][1]-y;if(dx*dx+dy*dy<br.r*br.r){ok=false;break;}}}
        if(ok){br.add(x,y);found=true;break;}}if(!found)br.act.splice(ai,1);}
    if(!br.act.length&&!br.done){br.done=true;br.cur=-1;finishWhite();S[2]=br.pts;}}
  c.on('r',()=>{gen();});c.on('k',()=>{gen();});c.on('keep',()=>{gen();});c.btn('again',()=>{seed++;gen();});gen();if(reduce)bstep(99999);
  const drawPts=(px,pts,hl)=>{const u=px.u32,r=c.v('r');for(let i=0;i<u.length;i++)u[i]=GC;if(c.v('disc'))for(const [x,y] of pts){const R=r/2;for(let yy=Math.floor(y-R);yy<=y+R;yy++)for(let xx=Math.floor(x-R);xx<=x+R;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;if((xx-x)**2+(yy-y)**2<=R*R)u[yy*W+xx]=mix32(u[yy*W+xx],U('#6aa84c'),.35);}}
    pts.forEach(([x,y],i)=>{const X=x|0,Y=y|0;const col=hl?hl(i):DOT;for(let q=0;q<4;q++){const xx=X+(q&1),yy=Y+(q>>1);if(xx>=0&&xx<W&&yy>=0&&yy<H)u[yy*W+xx]=q<2?col:DOT2;}});};
  let fr=0;
  return {tick(dt){bstep(reduce?99999:6);fr++;
    if(S[0])drawPts(P4[0],S[0]);else{P4[0].u32.fill(GC);}P4[0].put();
    drawPts(P4[1],S[1]);P4[1].put();
    const act=new Set(br.act);drawPts(P4[2],br.pts,i=>i===br.cur?HOT:act.has(i)?ACT:DOT);
    if(br.cur>=0){const [cx,cy]=br.pts[br.cur];const u=P4[2].u32;for(let a=0;a<6.283;a+=.05)for(const rr of [br.r,br.r*2]){const x=Math.round(cx+Math.cos(a)*rr),y=Math.round(cy+Math.sin(a)*rr);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=mix32(u[y*W+x],HOT,.6);}}
    P4[2].put();drawPts(P4[3],S[3]);P4[3].put();
    if(fr%6===0){const lab=['white','jitter','bridson','localmax'];for(let k=0;k<4;k++){const pts=k===2?br.pts:S[k];if(!pts){setHud(root,'waiting for Bridson…',lab[k]);continue;}if(k===2&&!br.done){setHud(root,`${pts.length} pts · active ${br.act.length} · ${br.tries} tries`,lab[k]);continue;}
      const s=stats(pts);setHud(root,`${s.n} pts · min ${s.md.toFixed(1)} px · ${s.bad} pairs < r`,lab[k]);}}}};});

// ======================================================================
// B4: density, clearings, path, edge ramp, undergrowth; canopy cover readout
// ======================================================================
reg('edges',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root);const TILE=16;let trees=[],ground,time=0,seed=3;
  const path=y=>W*.62+Math.sin(y/22)*12;
  const keys=['clear','path','edge','under','old','crown'];
  function gen(){const rng=mkRng(seed),o={};keys.forEach(k=>o[k]=c.v(k));const B=BIOMES[3];trees=[];
    const edge0=40,ramp=4*TILE;const dens=(x,y)=>{let d=B.dens;if(o.clear)d*=smooth(.42,.58,fbm(x*.02+seed,y*.02));if(o.edge)d*=smooth(edge0,edge0+ramp,x);else if(x<edge0)d=0;return d;};
    const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
    for(const [x,y] of poisson(W,H+28,9,24,rng)){const d=dens(x,y);if(rng()>d)continue;const sp=pickSpecies(B.w,x,y,rng);let v=(rng()*NV)|0;if(o.old){if(v>=4&&d<=.8*B.dens)v=2;if(d>.8*B.dens&&rng()<.25)v=5;}
      const S=spr(sp,v,1);if(o.path){const lim=o.crown?S.cw+3:1.5*TILE*.5;if(Math.abs(x-path(y))<lim)continue;}
      trees.push({x:Math.round(x),y:Math.round(y),sp,v,ph:rng()*6.28,off:0,shake:0});}
    if(o.under){for(const [x,y] of poisson(W,H+10,7,12,rng)){const d=dens(x,y);let p=B.und;if(o.edge&&x<edge0+ramp&&x>edge0-8)p=.75;if(d>.6&&!o.edge)p*=.5;
      if(o.path&&Math.abs(x-path(y))<8)continue;if(rng()>p)continue;if(!o.edge&&x<edge0)continue;trees.push({x:Math.round(x),y:Math.round(y),sp:rng()<.25?SI.Fern:SI.Shrub,v:(rng()*NV)|0,ph:rng()*6.28,off:0,shake:0,u:1});}}
    ground=bakeGround(W,H,trees,1,()=>BIOME_TM[3],{bio:3,path:o.path?path:null,pw:5});
    if(!o.edge)for(let y=0;y<H;y++)for(let x=0;x<edge0;x++)ground[y*W+x]=groundCol(.62,.35,4,1,0,x,y);
    const cov=new Uint8Array(W*H);let nT=0,nU=0;for(const t of trees){if(t.u){nU++;continue;}nT++;const S=spr(t.sp,t.v,1),cy=t.y-S.h+S.cb/2,R=S.cw;for(let y=Math.floor(cy-R*.8);y<=cy+R*.8;y++)for(let x=t.x-R;x<=t.x+R;x++){if(x<0||y<0||x>=W||y>=H)continue;if(((x-t.x)/R)**2+((y-cy)/(R*.8))**2<=1)cov[y*W+x]=1;}}
    let cv0=0;for(let i=0;i<W*H;i++)cv0+=cov[i];const pct=cv0/(W*H)*100;
    ro.innerHTML=`${nT} trees · ${nU} shrubs and ferns · canopy cover <b>${pct.toFixed(0)} %</b> of the view (targets: dense 60–80 %, open woodland 20–40 %, savanna 5–15 %)`;}
  keys.forEach(k=>c.on(k,gen));c.btn('reseed',()=>{seed++;gen();});gen();
  return {tick(dt){time+=dt;drawForest(F.u32,W,H,trees,{ground,season:1,time,wind:.4});F.put();}};});

// ======================================================================
// B5: OpenTTD-style staggered stage tick + self-thinning into size classes
// ======================================================================
reg('growth',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root);
  const GW=12,GH=4,TS=16;const NAMES=['growing 1','growing 2','growing 3','grown','dying 1','dying 2','dead'];
  const st=new Int8Array(GW*GH).fill(-1);const r0=mkRng(4);for(let i=0;i<st.length;i++)if(r0()<.7)st[i]=(r0()*7)|0;
  const STG=[.38,.55,.72,1,1,1].map((s,k)=>genSprite(SPECIES[0],2000+k,s,1,k===4?{pal:P(['#c9c06a','#a8a050','#86803e','#5e5a30','#3a381e'])}:{}));STG.push(spr(SI.Snag,1,1));
  const GG=new Uint32Array(A.W*A.H);for(let y=0;y<A.H;y++)for(let x=0;x<A.W;x++)GG[y*A.W+x]=groundCol(.55,.55,3,1,.2,x,y);
  let tick=0,acc=0,lastHit=[];
  function stageTick(){tick++;lastHit=[];const r=rnd;for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){if((11*x+9*y+tick)%16!==0)continue;const i=y*GW+x;lastHit.push(i);const s=st[i];
      if(s<0){if(r()<.05)st[i]=0;}else if(s<3)st[i]++;else if(s===3){const q=r();if(q<.18)st[i]=4;else if(q<.45){const nb=[i-1,i+1,i-GW,i+GW].filter(j=>j>=0&&j<st.length&&st[j]<0&&Math.abs((j%GW)-x)<=1);if(nb.length)st[nb[(r()*nb.length)|0]]=0;}}
      else if(s<6)st[i]++;else if(r()<.5)st[i]=-1;}}
  // self-thinning: circles grow; when two intersect the smaller dies; seeds rain in
  const BW=B.W,BH=B.H;let PL=[],deaths=0;const seedN=()=>{for(let k=0;k<3;k++)PL.push({x:4+rnd()*(BW-8),y:4+rnd()*(BH-8),r:.6,g:.6+rnd()*.8});};for(let k=0;k<40;k++)seedN();
  function thin(dt){for(const p of PL)p.r+=p.g*dt*(1.2-p.r/14);for(let i=0;i<PL.length;i++)for(let j=i+1;j<PL.length;j++){const a=PL[i],b=PL[j];if(a.dead||b.dead)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r){(a.r<b.r?a:b).dead=1;deaths++;}}
    PL=PL.filter(p=>!p.dead);if(rnd()<dt*4)seedN();}
  if(reduce)for(let k=0;k<400;k++)thin(1/30);
  function hist(){const cls=new Array(7).fill(0);for(const p of PL)cls[clamp(Math.floor(p.r/2),0,6)]++;const mx=Math.max(4,...cls);svg.innerHTML='';
    svgEl('line',{x1:20,y1:84,x2:250,y2:84,class:'ax'},svg);cls.forEach((n,k)=>{const h=n/mx*58;svgEl('rect',{x:24+k*32,y:84-h,width:24,height:h,fill:'#6aa84c'},svg);svgText(svg,36+k*32,96,`${k*2}–${k*2+2}`,{'text-anchor':'middle','font-size':8});svgText(svg,36+k*32,81-h,n,{'text-anchor':'middle',class:'v','font-size':8});});
    svgText(svg,20,10,'self-thinning: plants per size class (radius px)',{'font-size':8});}
  return {tick(dt){acc+=dt*c.v('spd');while(acc>=.25){acc-=.25;stageTick();}
    const u=A.u32;u.set(GG);const items=[];for(let i=0;i<st.length;i++){if(st[i]<0)continue;const S=STG[st[i]];const x=(i%GW)*TS+8,y=((i/GW)|0)*TS+15;items.push([y,S,x,st[i]]);}
    items.sort((a,b)=>a[0]-b[0]);for(const [y,S,x,s] of items)blit(u,A.W,A.H,S,x-S.ax,y-S.h+1,s===5?{fade:.45}:{});
    if(c.v('hash'))for(const i of lastHit){const x0=(i%GW)*TS,y0=((i/GW)|0)*TS;for(let k=0;k<4;k++){const xs=[x0,x0+TS-1],ys=[y0,y0+TS-1];for(const xx of xs)for(const yy of ys){u[yy*A.W+xx]=U('#f0c25a');}}}
    A.put();thin(dt*c.v('spd'));const v=B.u32;v.fill(U('#3a4a2a'));for(const p of PL){const col=p.r>8?U('#2c4a24'):p.r>4?U('#4f8f3f'):U('#97d064');
      for(let y=Math.floor(p.y-p.r);y<=p.y+p.r;y++)for(let x=Math.floor(p.x-p.r);x<=p.x+p.r;x++){if(x<0||y<0||x>=BW||y>=BH)continue;const d=(x-p.x)**2+(y-p.y)**2;if(d<=p.r*p.r)v[y*BW+x]=d>(p.r-1)**2?U('#1d4024'):col;}}B.put();
    if((tick&3)===0)hist();const cnt=new Array(7).fill(0);for(const s of st)if(s>=0)cnt[s]++;
    ro.innerHTML=`tick ${tick} · tiles updated this tick: (11x + 9y + tick) mod 16 = 0 · `+NAMES.map((n,k)=>`${n} <b>${cnt[k]}</b>`).join(' · ')+` · self-thinning deaths <b>${deaths}</b>`;}};});
