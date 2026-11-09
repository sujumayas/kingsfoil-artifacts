// ======================================================================
// C1 (+C5): an indexed sprite through a palette LUT; index tricks; damage rows
// ======================================================================
reg('lut',root=>{const cvs=$$('canvas',root),IX=PX(cvs[0]),O=PX(cvs[1]),c=ctl(root),lutBox=$('.lut',root),ro=$('[data-ro]',root);
  const sp=SPECIES[0],seed=1000+0*97+4*13;const S=genSprite(sp,seed,1.15,1,{leafIdx:1}),Sw=genSprite(sp,seed,1.15,3,{leafIdx:1});const W=O.W,H=O.H,ox=((W-S.w)/2)|0,oy=H-S.h-2;
  const grey=(pal,g)=>pal.map(cc=>mix32(cc,pack(140,140,134),g));
  const CHAR=P(['#3a3836','#2a2826','#1a1918']);
  const DEAD=P(['#a89a7a','#8a7a5e','#6a5c46','#4e4434','#30281e']);
  const ROWS=[{n:'Spring',l:L.oakSp},{n:'Summer',l:L.oakSu},{n:'Autumn',l:L.oakAu},{n:'Autumn, bare',l:L.oakAu,drop:.5},{n:'Winter, bare',l:DEAD,drop:1},{n:'Winter + snow',l:DEAD,drop:1,snow:1},
    {n:'Polluted (2 events)',l:grey(L.oakSu,.067),drop:.25,dmg:1},{n:'Polluted (4 events)',l:grey(L.oakSu,.134),drop:.5,dmg:1},{n:'Burnt',l:DEAD,drop:1,dmg:1,burnt:1}];
  let row=1;
  lutBox.innerHTML=ROWS.map((r,i)=>`<button type="button" class="lutrow${i===row?' on':''}" data-i="${i}"><span>${r.n}</span><span class="strip">${(r.burnt?CHAR:sp.bark).map(x=>`<span style="background:${css(x)};flex:.6"></span>`).join('')}${r.l.map(x=>`<span style="background:${css(x)}"></span>`).join('')}</span></button>`).join('');
  lutBox.addEventListener('click',e=>{const b=e.target.closest('.lutrow');if(!b)return;row=+b.dataset.i;$$('.lutrow',lutBox).forEach(x=>x.classList.toggle('on',x===b));});
  const G=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)G[y*W+x]=groundCol(.5,.5,3,1,.25,x,y);
  const IXC=[U('#f2f2f2'),U('#bdbdbd'),U('#8a8a8a'),U('#5e5e5e'),U('#363636')],BXC=[U('#c79a6a'),U('#9a7048'),U('#5e4028')];
  const isBr=li=>li>=20&&li<=22;
  return {tick(){const u=O.u32;u.set(G);const R=ROWS[row],tb=c.v('blossom'),tt=c.v('trans'),tsn=c.v('snowcap');const bark=R.burnt?CHAR:sp.bark;
    stackEllipse(u,W,H,ox+S.ax+3,oy+S.h-1,S.cw*.95,S.cw*.4,R.drop===1&&(tt||R.dmg)?.12:.3);
    let leaves=0;const bare=R.drop&&(tt||R.dmg);
    for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++){const i=y*S.w+x,li=S.li[i],wi=Sw.li[i],X=ox+x,Y=oy+y;let col=0;
      const branch=()=>{if(!isBr(wi))return 0;if(R.snow&&tsn&&(y===0||!isBr(Sw.li[i-S.w]))&&hash2(X,Y)<.85)return SNOW[0];return bark[wi-20];};
      if(li<=4){const lost=bare&&hash2(X*7,Y*3)<R.drop;if(lost)col=branch();else{col=R.l[li];leaves++;if(tb&&row===0&&li===0)col=U('#ffc8dc');if(tsn&&R.snow&&li<=1)col=SNOW[li];}}
      else if(isBr(li))col=bark[li-20];else if(S.px[i])col=S.px[i];else if(bare)col=branch();
      if(col)u[Y*W+X]=col;}
    O.put();const v=IX.u32;v.fill(U('#18211a'));for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++){const li=S.li[y*S.w+x];const X=ox+x,Y=oy+y;if(li<=4)v[Y*W+X]=IXC[li];else if(isBr(li))v[Y*W+X]=BXC[li-20];else if(S.px[y*S.w+x])v[Y*W+X]=U('#c8303a');}IX.put();
    ro.innerHTML=`LUT: ${ROWS.length} rows × 16 colours × 4 B = <b>${ROWS.length*16*4} B</b> for this species (the study's example is 48 rows × 16 colours, a few KB). Separate sheets: ${S.w}×${S.h} px × 4 B = ${(S.w*S.h*4/1024).toFixed(1)} KB per season per sprite · leaf px showing: ${leaves}`;}};});

// ======================================================================
// C2: biome colormap tint (Minecraft-style triangle) vs a palette-row pick
// ======================================================================
reg('colormap',root=>{const cvs=$$('canvas',root),T=PX(cvs[0]),F=PX(cvs[1]),c=ctl(root),ro=$('[data-ro]',root);const TW=T.W,TH=T.H;
  let pt=[.8,.6],season=1;
  const CORN={hotWet:[63,154,42],hotDry:[176,170,74],cold:[96,140,110]};
  const cm=(t,r)=>{const a=CORN.cold,b=CORN.hotDry,cc=CORN.hotWet;const wet=t>0?r/t:0;let col=[0,1,2].map(k=>lerp(a[k],lerp(b[k],cc[k],wet),t));
    if(season===0)col=col.map(v=>v*1.08+8);else if(season===2)col=col.map((v,k)=>lerp(v,[200,150,58][k],.45));else if(season===3)col=col.map((v,k)=>lerp(v,[150,160,150][k],.5));return pack(...col);};
  function paint(){const u=T.u32;for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){const t=(x+.5)/TW,r=1-(y+.5)/TH;u[y*TW+x]=r<=t?cm(t,r):mix32(cm(t,Math.min(r,t)),U('#0d120c'),.75);}
    const X=Math.round(pt[0]*(TW-1)),Y=Math.round((1-pt[1]*pt[0])*(TH-1));for(let k=-3;k<=3;k++){for(const [xx,yy] of [[X+k,Y],[X,Y+k]])if(xx>=0&&yy>=0&&xx<TW&&yy<TH)u[yy*TW+xx]=U('#f0c25a');}T.put();}
  const greyPal=P(['#d8d8d8','#b0b0b0','#8a8a8a','#646464','#3a3a3a']);
  const base=genSprite(SPECIES[0],1311,.9,1,{pal:greyPal,leafIdx:1}),birch=genSprite(SPECIES[2],1777,1,1,{leafIdx:1});
  const ROWS=[L.oakSu,L.mpSu,L.kp,L.acW,L.acD,L.biSu];const rowMid=ROWS.map(r=>un32(r[2]));
  const G=new Uint32Array(F.W*F.H);for(let y=0;y<F.H;y++)for(let x=0;x<F.W;x++)G[y*F.W+x]=groundCol(.6,.5,3,1,.2,x,y);
  function tree(u,S,X,Y,mode,tint,rowPal,fixed){for(let y=0;y<S.h;y++)for(let x=0;x<S.w;x++){const i=y*S.w+x,li=S.li[i];let col=S.px[i];if(!col)continue;
    if(li<=4&&!fixed){if(mode==='mul'){const g=un32(col)[0]/255;const t=un32(tint);col=pack(t[0]*g*1.25,t[1]*g*1.25,t[2]*g*1.25);}else if(mode==='row')col=rowPal[li];}
    const xx=X+x,yy=Y+y;if(xx>=0&&yy>=0&&xx<F.W&&yy<F.H)u[yy*F.W+xx]=col;}}
  const nearestRow=col=>{const a=un32(col);let b=0,bd=1e9;rowMid.forEach((m,i)=>{const d=(m[0]-a[0])**2+(m[1]-a[1])**2+(m[2]-a[2])**2;if(d<bd){bd=d;b=i;}});return b;};
  c.seg('season',v=>{season=+v;paint();});
  const stage=cvs[0].parentElement;let drag=false;const mv=e=>{const r=stage.getBoundingClientRect();const t=clamp((e.clientX-r.left)/r.width,0,1),rr=clamp(1-(e.clientY-r.top)/r.height,0,1);pt=[t,t>0?clamp(rr/t,0,1):0];paint();};
  stage.addEventListener('pointerdown',e=>{drag=true;try{stage.setPointerCapture(e.pointerId);}catch(_){}mv(e);});stage.addEventListener('pointermove',e=>{if(drag)mv(e);});stage.addEventListener('pointerup',()=>drag=false);
  paint();
  return {tick(){const u=F.u32;u.set(G);const n=6,cols=new Set(),cols2=new Set();
    for(let k=0;k<n;k++){const tt=clamp(pt[0]+(k-(n-1)/2)*.06,0,1),rr=clamp(pt[1]+(hash2(k,3)-.5)*.2,0,1);const tint=cm(tt,rr*tt);const ri=nearestRow(tint);const X=4+k*30,fixed=c.v('opt')&&k===n-1;
      tree(u,fixed?birch:base,X,2,'mul',tint,null,fixed);tree(u,fixed?birch:base,X,48,'row',tint,ROWS[ri],fixed);}
    for(let y=0;y<F.H;y++)for(let x=0;x<F.W;x++){const col=u[y*F.W+x];if(col===G[y*F.W+x])continue;(y<46?cols:cols2).add(col);}
    F.put();const tint=cm(pt[0],pt[1]*pt[0]);ro.innerHTML=`temp ${pt[0].toFixed(2)} · rain ${pt[1].toFixed(2)} → R = rain·T = ${(pt[1]*pt[0]).toFixed(2)} · tint ${hexOf(tint)} · top row (RGB multiply): <b>${cols.size}</b> distinct colours · bottom row (palette row): <b>${cols2.size}</b>`;}};});

// ======================================================================
// C3: per-tree phenology offsets, a Hopkins band and dithered turns
// ======================================================================
reg('pheno',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root),hop=$('[data-hop]',root);
  const SPN=['Maple','Birch','Oak','Larch'],OFF=[-.02,-.02,.03,.05];
  const larchPal=[P(['#b6d68a','#8ebc6a','#6a9c52','#4c7a42','#2c4a2c']),L.biAu,P(['#8a7a5a','#6a5a40','#4e4030','#3a3024','#2a2018'])];
  const SPR3=(k,v)=>{const key='ph'+k+'_'+v;let o=SPRC.get(key);if(o)return o;
    if(k<3){const si=SI[SPN[k]];o=[spr(si,v,1),spr(si,v,2),spr(si,v,3)];}else{o=larchPal.map((pal,s)=>genSprite(SPECIES[SI.Pine],7000+v*13,SIZES[v],1,{pal,noSnow:1}));}SPRC.set(key,o);return o;};
  const rng=mkRng(31),trees=[];const elev=(x,y)=>clamp(1-Math.hypot(x-W*.78,(y-H*.1)*1.4)/(W*.62),0,1);
  for(const [x,y] of poisson(W,H+26,10,24,rng)){if(rng()>.82)continue;const k=Math.floor(rng()*4);trees.push({x:Math.round(x),y:Math.round(y),k,v:(rng()*NV)|0,h:rng(),ph:rng()*6.28,sp:k<3?SI[SPN[k]]:SI.Pine,off:0,shake:0});}
  trees.sort((a,b)=>a.y-b.y);
  const G=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const e=elev(x,y);let col=groundCol(.5,.55-e*.25,3,2,.4,x,y);if(Math.abs((e*6)%1)<.05&&e>.05)col=mulc(col,.85,.85,.8);G[y*W+x]=col;}
  const A0=270/365,A1=288/365,LB=284/365,LE=300/365;let time=0;
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];const dateOf=d=>{const dt=new Date(2026,0,1+Math.round(d));return dt.getDate()+' '+months[dt.getMonth()];};
  function phaseOf(t,season,kel){return season-OFF[t.k]+elev(t.x,t.y)*kel+(c.v('jit')?t.h*.03-.015:0);}
  return {tick(dt){time+=dt;const day=c.v('day'),season=day/365,ft=c.v('ft'),deg=c.v('deg');const kel=(4*ft/400)/365;const wdays=c.v('w');const dith=c.v('dith');
    const days=4*deg+4*ft/400;hop.innerHTML=`Hopkins: 4 days × ${deg}° + 4 days × ${ft} ft / 400 = <b>${days.toFixed(0)} days</b> earlier in autumn at the hill top (and later in spring)`;
    const u=F.u32;u.set(G);const turned=[0,0,0,0],n=[0,0,0,0];
    for(const t of trees){const ph=phaseOf(t,season,kel);const S3=SPR3(t.k,t.v);const w=dith?wdays/365:1e-6;
      const a0=t.k===3?LB:A0,a1=t.k===3?LE:A1;const p1=clamp((ph-a0)/w,0,1),p2=clamp((ph-a1)/w,0,1);n[t.k]++;if(p1>=.5)turned[t.k]++;
      let base=S3[0],mix=null;if(p2>0){base=S3[1];mix={px:S3[2].px,p:p2};}else if(p1>0){mix={px:S3[1].px,p:p1};}
      const sw=Math.round(Math.sin(time*1.7+t.ph)*.6);const S=base;blit(u,W,H,S,t.x-S.ax,t.y-S.h+1,{mix:mix&&mix.p>0?mix:undefined,sw});}
    F.put();ro.innerHTML=`day ${day} (${dateOf(day)}, illustrative calendar) · turned: `+SPN.map((s,k)=>`${s} <b>${Math.round(turned[k]/Math.max(1,n[k])*100)} %</b>`).join(' · ');c.out('day',dateOf(day));c.out('w',wdays+' d');c.out('ft',ft+' ft');c.out('deg',deg+'°');}};});

// ======================================================================
// C4: bare branches by recursion (Windy Tree / L-system + pipe model), snow on tiers, interception
// ======================================================================
reg('winter',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root),ro=$('[data-ro]',root);let mode='windy',time=0;const BK=SPECIES[0].bark;
  c.seg('mode',v=>mode=v);
  const disc=(u,W,H,x,y,r,col)=>{const R=Math.max(.5,r);for(let yy=Math.floor(y-R);yy<=y+R;yy++)for(let xx=Math.floor(x-R);xx<=x+R;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;if((xx-x)**2+(yy-y)**2<=R*R+.25)u[yy*W+xx]=col;}};
  function windy(u,W,H,t,maxD){let segs=0;const go=(x,y,a,th,d,cnt)=>{for(let s=0;s<60;s++){x+=Math.cos(a)*1.4;y+=Math.sin(a)*1.4;a+=Math.sin(t+cnt)/149*c.v('gust');th*=.97;cnt++;segs++;
      disc(u,W,H,x,y,th/2,th>2.2?BK[1]:th>1.2?BK[0]:BK[2]);if(th<.7)return;if(cnt%9===0&&d<maxD){go(x,y,a+(cnt%18===0?.55:-.55),th*.6,d+1,cnt+3);}}};
    go(W/2,H-2,-Math.PI/2,6,0,0);return segs;}
  function lsys(u,W,H,t,it,ex){let s='X';for(let k=0;k<it;k++)s=s.replace(/[XF]/g,ch=>ch==='X'?'F[+X]F[-X]+X':'FF');
    // count tips above every F for the pipe model
    const segs=[];let st=[],x=W/2,y=H-2,a=-Math.PI/2,len=H*.78/Math.pow(2,it+1),dl=20*Math.PI/180;const stack=[];let cur=-1;const parent=[];
    for(const ch of s){if(ch==='F'){const nx=x+Math.cos(a)*len,ny=y+Math.sin(a)*len;segs.push({x0:x,y0:y,x1:nx,y1:ny,tips:0,p:cur});cur=segs.length-1;x=nx;y=ny;}
      else if(ch==='+')a+=dl+Math.sin(t*1.3+x*.05)*.02*c.v('gust');else if(ch==='-')a-=dl;else if(ch==='['){stack.push([x,y,a,cur]);}else if(ch===']'){segs[cur]&&(segs[cur].tip=1);[x,y,a,cur]=stack.pop();}}
    segs.forEach(sg=>{if(sg.tip){let q=sg;while(q){q.tips++;q=segs[q.p];}}});
    for(const sg of segs){const th=Math.pow(Math.max(1,sg.tips),1/ex)*.5;const n=Math.ceil(Math.hypot(sg.x1-sg.x0,sg.y1-sg.y0));for(let k=0;k<=n;k++){const f=k/Math.max(1,n);disc(u,W,H,lerp(sg.x0,sg.x1,f),lerp(sg.y0,sg.y1,f),th/2,th>2.5?BK[1]:th>1.2?BK[0]:BK[2]);}}
    return segs.length;}
  // right: a winter stand with snow on tiers and interception
  const rng=mkRng(8),trees=[];for(const [x,y] of poisson(B.W,B.H+30,10,24,rng)){if(rng()>.5)continue;const r=rng();trees.push({x:Math.round(x),y:Math.round(y),sp:r<.5?SI.Spruce:r<.75?SI.Birch:SI.Oak,v:(rng()*NV)|0,ph:rng()*6.28,off:0,shake:0});}
  let gIn,gOut;const bk=()=>{gIn=bakeGround(B.W,B.H,trees,3,()=>[.3,.5],{bio:0,allSnow:1});gOut=bakeGround(B.W,B.H,trees,3,()=>[.3,.5],{bio:0,allSnow:1,intercept:false});};bk();
  const noSnow=new Map();const sprW=(t,snow)=>{if(snow)return spr(t.sp,t.v,3);const k=t.sp*10+t.v;if(!noSnow.has(k))noSnow.set(k,genSprite(SPECIES[t.sp],1000+t.sp*97+t.v*13,SIZES[t.v],3,{noSnow:1}));return noSnow.get(k);};
  const flakes=[];for(let k=0;k<50;k++)flakes.push([rnd()*B.W,rnd()*B.H,rnd()]);
  return {tick(dt){time+=dt;const u=A.u32;for(let y=0;y<A.H;y++)for(let x=0;x<A.W;x++)u[y*A.W+x]=y>A.H-6?U('#e8eef6'):U('#1b2635');
    const n=mode==='windy'?windy(u,A.W,A.H,time,c.v('depth')):lsys(u,A.W,A.H,time,c.v('it'),c.v('ex')/10);A.put();
    const v=B.u32;v.set(c.v('icpt')?gIn:gOut);const snow=c.v('tiers');const items=trees.slice().sort((a,b)=>a.y-b.y);
    for(const t of items){const S=sprW(t,snow);blit(v,B.W,B.H,S,t.x-S.ax,t.y-S.h+1,{sw:Math.sin(time*1.7+t.ph)*.5*SPECIES[t.sp].flex});}
    for(const f of flakes){f[1]+=(8+f[2]*10)*dt;f[0]+=Math.sin(time+f[2]*9)*.2;if(f[1]>B.H){f[1]=0;f[0]=rnd()*B.W;}const i=(f[1]|0)*B.W+((f[0]|0)%B.W);if(i>=0&&i<v.length)v[i]=U('#f4f8ff');}B.put();
    c.out('depth',c.v('depth'));c.out('it',c.v('it'));c.out('ex',(c.v('ex')/10).toFixed(1));
    ro.innerHTML=`${mode==='windy'?'recursion':'L-system'}: <b>${n}</b> segments this frame (cost grows ~2^depth, so bake it or keep it for a hero tree) · ground snow under canopy ${c.v('icpt')?'cut by density × 0.65':'not reduced'}`;}};});

// ======================================================================
// D1 + D2: shear vs smooth vs whole-pixel bands; travelling gusts; HDMA table pointer
// ======================================================================
reg('sway',root=>{const cvs=$$('canvas',root),T3=cvs.slice(0,3).map(PX),R=PX(cvs[3]),HD=PX(cvs[4]),c=ctl(root),gsvg=$('svg.gust',root),tsvg=$('svg.hdt',root);
  const S=spr(0,4,1);const TW=T3[0].W,TH=T3[0].H,ox=((TW-S.w)/2)|0,oy=TH-S.h-1;
  const G=new Uint32Array(TW*TH);for(let y=0;y<TH;y++)for(let x=0;x<TW;x++)G[y*TW+x]=groundCol(.55,.55,3,1,.4,x,y);
  let time=0,phase=0,acc=0,mix='Mixed';
  const rowTrees=[];const rr=mkRng(12);c.seg('row',v=>{mix=v;mk();});
  const mk=()=>{rowTrees.length=0;const pool=mix==='Mixed'?['Spruce','Pine','Oak','Birch','Palm']:[mix];let x=6;while(x<R.W-4){const n=pool[(rr()*pool.length)|0];const si=SI[n],v=1+((rr()*4)|0);const Sx=spr(si,v,1);rowTrees.push({x:x+Sx.ax,y:R.H-3-((rr()*6)|0),sp:si,v,ph:rr()*6.28,off:0,shake:0});x+=Sx.w*.72+rr()*4;}rowTrees.sort((a,b)=>a.y-b.y);};mk();
  const RG=new Uint32Array(R.W*R.H);for(let y=0;y<R.H;y++)for(let x=0;x<R.W;x++)RG[y*R.W+x]=groundCol(.55,.55,3,1,.5,x,y);
  // HDMA source image: rows of conifer crowns
  const HW=HD.W,HH=HD.H,SRC=new Uint32Array(HW*HH);for(let y=0;y<HH;y++)for(let x=0;x<HW;x++)SRC[y*HW+x]=groundCol(.3,.6,0,1,.6,x,y);
  {const r2=mkRng(5);for(let y=8;y<HH+20;y+=12)for(let x=-4+(y%24?6:0);x<HW+10;x+=13){const Sx=spr(SI.Spruce,(r2()*4)|0,1);blit(SRC,HW,HH,Sx,x-Sx.ax,y-Sx.h+1,{});}}
  const TAB=Array.from({length:112},(_,i)=>Math.round(3*Math.sin(i/112*Math.PI*2)));
  const tb=[];for(let i=0;i<112;i++)tb.push(svgEl('rect',{x:40+TAB[i]*8-2,y:i,width:4,height:1,fill:'#6aa84c'},tsvg));svgEl('line',{x1:40,y1:0,x2:40,y2:112,stroke:'#3a4d2f'},tsvg);
  const win=svgEl('rect',{x:10,y:0,width:60,height:HH,fill:'none',stroke:'#f0c25a','stroke-width':1.2},tsvg);svgText(tsvg,74,8,'table',{'font-size':6});svgText(tsvg,74,16,'pointer',{'font-size':6,fill:'#f0c25a'});
  const gp=svgEl('path',{class:'s2'},gsvg),gl=svgEl('line',{x1:0,y1:30,x2:256,y2:30,class:'gl'},gsvg);
  const tri=s=>{const f=s-Math.floor(s);return 1-Math.abs(f*2-1);};const smoothTri=s=>{const t=tri(s);return t*t*(3-2*t);};
  return {tick(dt){time+=dt;const wind=c.v('wind')/100,amp=c.v('amp')/10;
    const g=wind*amp*(.5*Math.sin(time*1.7)+.9*Math.sin(time*.6+1));
    // three treatments of the same crown
    for(let k=0;k<3;k++){const u=T3[k].u32;u.set(G);let cols=new Set();
      if(k===2)blit(u,TW,TH,S,ox,oy,{sw:g});
      else for(let y=0;y<S.h;y++){const h=k===0?(S.h-1-y)/(S.h-1):clamp((S.cb-y)/S.cb,0,1);const off=g*2.2*h*(k===0?1:h*1.6);const fo=Math.floor(off),fr=off-fo;
        for(let x=-2;x<S.w+2;x++){const sx=x-fo;let a=sx>=0&&sx<S.w?S.px[y*S.w+sx]:0,b=sx-1>=0&&sx-1<S.w?S.px[y*S.w+sx-1]:0;const X=ox+x,Y=oy+y;if(X<0||X>=TW)continue;const bg=u[Y*TW+X];
          if(k===0){const q=Math.round(off);const s2=x-q;const cc=s2>=0&&s2<S.w?S.px[y*S.w+s2]:0;if(cc)u[Y*TW+X]=cc;continue;}
          if(!a&&!b)continue;const ca=a||bg,cb=b||bg;const col=mix32(ca,cb,fr);u[Y*TW+X]=col;}}
      for(let y=oy;y<TH;y++)for(let x=0;x<TW;x++){const col=u[y*TW+x];if(col!==G[y*TW+x])cols.add(col);}
      T3[k].put();setHud(root,`${cols.size} colours`,'t'+k);}
    // travelling gust across a row: gust = smooth_tri(s/λ − t·v/λ), λ = 24 tiles, v = 3 tiles/s at 8 px tiles
    const lam=24*8,vel=3*8,inph=c.v('inph');const u=R.u32;u.set(RG);
    let d='';for(let x=0;x<=R.W;x+=4){const gg=inph?smoothTri(-time*vel/lam):smoothTri(x/lam-time*vel/lam);d+=(x?'L':'M')+x+','+(30-gg*24).toFixed(1);}gp.setAttribute('d',d);
    for(const t of rowTrees){const gg=inph?smoothTri(-time*vel/lam):smoothTri(t.x/lam-time*vel/lam);const sw=wind*SPECIES[t.sp].flex*(gg*gg*1.6+.25*Math.sin(time*1.7+(inph?0:t.ph)));const Sx=spr(t.sp,t.v,1);blit(u,R.W,R.H,Sx,t.x-Sx.ax,t.y-Sx.h+1,{sw});}
    R.put();
    // HDMA: each scanline scrolls by TAB[(line + phase) % 112]; the pointer moves, the table stays
    acc+=dt*60;while(acc>=1){acc--;phase=(phase+1)%112;}const v=HD.u32;for(let y=0;y<HH;y++){const off=TAB[(y+phase)%112];for(let x=0;x<HW;x++){const sx=((x-off)%HW+HW)%HW;v[y*HW+x]=SRC[y*HW+sx];}}HD.put();
    win.setAttribute('y',phase);if(phase+HH>112){win.setAttribute('height',112-phase);}else win.setAttribute('height',HH);
    c.out('wind',Math.round(wind*100)+' %');c.out('amp',amp.toFixed(1)+' px');}};});

// ======================================================================
// D3: Ferrari edge-band colour cycling on foliage
// ======================================================================
reg('ferrari',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root);
  const S=genSprite(SPECIES[SI.Kapok],4321,1.35,1),X0=((W-S.w)/2)|0,Y0=H-S.h-2;const G=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)G[y*W+x]=groundCol(.8,.7,5,1,.5,x,y);
  const base=G.slice();stackEllipse(base,W,H,X0+S.ax+4,Y0+S.h-1,S.cw*.95,S.cw*.4,.3);blit(base,W,H,S,X0,Y0,{});
  // reserved indices: inner rim (leaf px touching background) and outer halo (background px touching leaf)
  const leaf=new Uint8Array(W*H);for(let y=0;y<S.h&&y<S.cb;y++)for(let x=0;x<S.w;x++)if(S.px[y*S.w+x])leaf[(Y0+y)*W+X0+x]=1;
  const inner=[],outer=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,n=leaf[i-1]+leaf[i+1]+leaf[i-W]+leaf[i+W];if(leaf[i]&&n<4)inner.push(i);else if(!leaf[i]&&n>0&&y<Y0+S.cb)outer.push(i);}
  const band=i=>{const x=i%W,y=(i/W)|0;return (Math.floor((x+y*.6)/9))%3;};
  const LC=L.kp,STATES=[[0,0],[0,1],[0,2],[0,1],[0,0],[1,0],[2,0],[1,0]];
  let ph=0;
  return {tick(dt){const rate=c.v('rate'),sps=rate/280;ph+=dt*sps;const u=F.u32;u.set(base);const off=c.v('off'),show=c.v('show');
    const draw=(arr,which)=>{for(const i of arr){const st=STATES[(Math.floor(ph+(off?band(i)*2.7:0))%8+8)%8];const s=st[which];let col;
      if(which===0)col=s===0?base[i]:s===1?mix32(base[i],G[i],.5):G[i];else col=s===0?G[i]:s===1?mix32(G[i],LC[3],.5):LC[3];
      if(which===0&&s===0)col=base[i];if(which===1&&s===0)col=base[i];u[i]=show?(which?U('#ff4fd8'):U('#40e0ff')):col;}};
    draw(inner,0);draw(outer,1);F.put();
    c.out('rate',`${rate} → ${sps.toFixed(1)} steps/s`);ro.innerHTML=`reserved pixels: ${inner.length} inner rim + ${outer.length} outer halo = <b>${((inner.length+outer.length)/(W*H)*100).toFixed(1)} %</b> of this view animated (Ferrari's "Deep Forest – Day" animates 3.6 %, all of it water) · ${off?'phase offset in 3 bands':'every rim in lock-step (metronome)'}`;}};});
