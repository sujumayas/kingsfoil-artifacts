// ======================================================================
// demos2: rivers that move things, depth and surface colour, interaction
// (rings, wakes, wading, splashes, bobbing, fishing), element reactions
// and cheap simulation (families C2 to G2). Local helpers are prefixed
// w2 so they never clash with core.js or the other demos files.
// Uses only the generic core.js helpers ($, PX, ctl, pointer, reg, ...).
// ======================================================================
const w2H=(a,b,c,d)=>{let h=Math.imul((a|0)^0x9E3779B9,0x85EBCA6B);h^=Math.imul((b|0)+0x632BE5AB,0xC2B2AE35);h=(h<<13)|(h>>>19);h^=Math.imul((c|0)+0x27D4EB2F,0x165667B1);h=(h<<11)|(h>>>21);h^=Math.imul((d|0)+0x61C88647,0x2545F491);h^=h>>>15;h=Math.imul(h,0x2C1B3C6D);h^=h>>>12;h=Math.imul(h,0x297A2D39);h^=h>>>15;return (h>>>0)/4294967296;};
const w2C=o=>{const r={};for(const k in o)r[k]=U(o[k]);return r;};
const W2=w2C({deep:'#1b2b58',deep2:'#213f78',mid:'#285d93',mid2:'#3277a9',shal:'#3e96b2',shal2:'#5bb7bd',hi:'#9fdcd8',foam:'#e4f3ef',glint:'#ffffff',
  sand:'#d6c08a',sand2:'#c7ad76',sand3:'#e3d09e',wet:'#a68f5e',wet2:'#937d50',grass:'#4c8a3e',grass2:'#5a9a47',grass3:'#3d7536',
  rock:'#6c6873',rock2:'#8a8690',rock3:'#4a4752',rock4:'#3a3842',wood:'#8a5a34',wood2:'#a8703f',wood3:'#5e3b22',leaf:'#2f6b3a',leaf2:'#3e8546',leaf3:'#235230',leaf4:'#4f9a50',
  ink:'#0a1220',skin:'#f0c8a0',hair:'#5a3a2a',shirt:'#c8443c',shirt2:'#8e2c28',pants:'#34466a',boot:'#2a2228',gold:'#ffd27a',red:'#ff6b5e'});
const w2rect=(u,W,H,x,y,w,h,col)=>{const x0=Math.max(0,x|0),y0=Math.max(0,y|0),x1=Math.min(W,(x+w)|0),y1=Math.min(H,(y+h)|0);for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++)u[j*W+i]=col;};
const w2disc=(u,W,H,cx,cy,r,col,lev)=>{for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){if(x<0||y<0||x>=W||y>=H)continue;const dx=x+.5-cx,dy=y+.5-cy;if(dx*dx+dy*dy>r*r)continue;if(lev===undefined||lev>bay(x,y))u[y*W+x]=col;}};
const w2clr=svg=>{while(svg.firstChild)svg.removeChild(svg.firstChild);};
const w2px=(u,W,H,x,y,col)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=col;};
// 1 px ellipse outline; a = coverage 0..1 through the Bayer matrix; ok(x,y) optional clip mask
function w2ell(u,W,H,cx,cy,rx,ry,col,a=1,ok){if(rx<.6){const x=Math.round(cx),y=Math.round(cy);if(x>=0&&y>=0&&x<W&&y<H&&(!ok||ok(x,y))&&(a>=1||a*16>bay(x,y)))u[y*W+x]=col;return;}
  const n=Math.max(10,Math.ceil(2*Math.PI*Math.max(rx,ry)*1.5));let lx=-99,ly=-99;
  for(let i=0;i<n;i++){const t=i/n*2*Math.PI,x=Math.round(cx+rx*Math.cos(t)),y=Math.round(cy+ry*Math.sin(t));if(x===lx&&y===ly)continue;lx=x;ly=y;
    if(x<0||y<0||x>=W||y>=H)continue;if(a<1&&a*16<=bay(x,y))continue;if(ok&&!ok(x,y))continue;u[y*W+x]=col;}}
const w2lerpCol=(cols,t)=>{t=clamp(t,0,1)*(cols.length-1);const i=Math.min(cols.length-2,Math.floor(t));return mix32(cols[i],cols[i+1],t-i);};
// a small walker drawn in code (7 x 13), side view facing right. h hair, s skin, e eye, c shirt, C shirt shade, l legs, b boots
const w2BODY=["..hhh..",".hhhhh.",".hssse.",".hssss.","..sss..",".cccc..","cccCcc.","cCcccs.",".cccc.."];
const w2LEGS=[[".llll..",".l..l..","bb..bb."],[".lll...","..ll...","..bb..."],[".llll..","l...l..","b....b."]];
const w2PAL={h:W2.hair,s:W2.skin,e:W2.ink,c:W2.shirt,C:W2.shirt2,l:W2.pants,b:W2.boot};
// draw the walker with its feet at (x, fy). o.cut: rows from the top that stay dry (others tinted or hidden), o.tint colour, o.hide
function w2walker(u,W,H,x,fy,frame,flip,o={}){const rows=w2BODY.concat(w2LEGS[frame%3]),h=rows.length,x0=Math.round(x-3),y0=Math.round(fy-h+1);
  for(let j=0;j<h;j++){const yy=y0+j;if(yy<0||yy>=H)continue;const wet=o.cut!==undefined&&j>=o.cut;if(wet&&o.hide)continue;
    for(let i=0;i<7;i++){const ch=rows[j][flip?6-i:i];if(ch==='.')continue;const xx=x0+i;if(xx<0||xx>=W)continue;let col=w2PAL[ch];if(o.pal&&o.pal[ch])col=o.pal[ch];if(wet)col=mix32(col,o.tint,.5);u[yy*W+xx]=col;}}}
// tileable value noise on a period p (lattice units)
function w2tile(size,cell,seed){const a=new Float32Array(size*size),p=size/cell;
  const g=(i,j)=>w2H(((i%p)+p)%p,((j%p)+p)%p,seed,1);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const fx=x/cell,fy=y/cell,xi=Math.floor(fx),yi=Math.floor(fy),tx=fx-xi,ty=fy-yi,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);
    const v=lerp(lerp(g(xi,yi),g(xi+1,yi),sx),lerp(g(xi,yi+1),g(xi+1,yi+1),sx),sy);a[y*size+x]=v;}return a;}
// rgb -> [hue deg, sat 0..1, light 0..1]
function w2hsl(c){const [r,g,b]=un32(c).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(!d)return [0,0,l];
  const s=d/(1-Math.abs(2*l-1));let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;return [h,s,l];}
const w2hex=c=>'#'+un32(c).map(v=>v.toString(16).padStart(2,'0')).join('');
// BFS distance from every cell where src(i) is true, over cells where pass(i) is true (4 neighbours)
function w2bfs(W,H,src,pass){const d=new Int16Array(W*H).fill(-1),q=new Int32Array(W*H);let h=0,t=0;
  for(let i=0;i<W*H;i++)if(src(i)){d[i]=0;q[t++]=i;}
  while(h<t){const k=q[h++],x=k%W,y=(k/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const j=yy*W+xx;if(d[j]<0&&pass(j)){d[j]=d[k]+1;q[t++]=j;}}}return d;}

// ======================================================================
// C2: Emerald forced currents. walk 16 x 1 px, surf 8 x 2 px, current 2,3,3,2,3,3
// ======================================================================
reg('currents',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);
  const T=16,COLS=W/T|0,LY=[16,32,48];
  const PAT=[[1],[2],[2,3,3,2,3,3]],NAME=['Walk','Surf','Current'],PTXT=['1 px × 16','2 px × 8','2,3,3,2,3,3'],CSS=['#e8c46a','#8fd0e0','#ff8a6a'],COL=CSS.map(U);
  const rock=[new Uint8Array(COLS),new Uint8Array(COLS),new Uint8Array(COLS)];rock[2][13]=1;rock[0][12]=1;
  let L=[],acc=0,hold=0,scroll=0,fr=0,fc=0;const hist=[[],[],[]],NB=36;
  const reset=()=>{L=[0,1,2].map(()=>({x:0,moving:false,moved:0,pi:0,stopped:false,done:false,frames:0}));hist.forEach(h=>h.length=0);hold=0;fc=0;};reset();
  // chart: per-frame pixel steps for the last 36 frames
  const bars=[];svgText(svg,4,14,'pixels moved in each of the first 36 frames',{'font-size':13,fill:'#9fb3ba'});
  for(let i=0;i<3;i++){const y0=30+i*40;svgText(svg,4,y0+16,NAME[i],{'font-size':14,fill:CSS[i],'font-weight':600});svgText(svg,4,y0+32,PTXT[i],{'font-size':12,fill:'#9fb3ba'});
    svgEl('line',{x1:100,x2:396,y1:y0+31,y2:y0+31,stroke:'#2a3a46'},svg);const row=[];
    for(let k=0;k<NB;k++)row.push(svgEl('rect',{x:100+k*8.2,y:y0+31,width:6.4,height:0,fill:CSS[i],rx:1},svg));bars.push(row);}
  pointer(cv,([x,y],k)=>{if(k!=='down')return;const col=x/T|0,lane=((y-16)/16)|0;if(lane<0||lane>2||col<1||col>=COLS)return;rock[lane][col]^=1;reset();});
  c.btn('reset',reset);c.btn('clear',()=>{rock.forEach(r=>r.fill(0));reset();});c.seg('spd',()=>{});
  function frame(){fc++;for(let i=0;i<3;i++){const a=L[i];let d=0;
      if(!a.done){if(!a.moving){const nc=(a.x/T|0)+1;if(nc>=COLS)a.done=true;else if(rock[i][nc]){a.done=true;a.stopped=true;}else{a.moving=true;a.moved=0;a.pi=0;}}
        if(a.moving){const p=PAT[i];d=p[a.pi%p.length];a.pi++;a.x+=d;a.moved+=d;if(a.moved>=T)a.moving=false;}
        if(!a.done)a.frames++;}
      if(hist[i].length<NB)hist[i].push(d);}
    if(L.every(a=>a.done))hold++;}
  return {tick(dt){fr++;const sp=+(c.segv('spd')||1);acc+=dt*sp;let n=0;while(acc>=1/60&&n<8){acc-=1/60;frame();n++;}
      if(hold>70&&motion)reset();scroll+=dt*40*sp;
      // banks, sand path, still water, current tiles with scrolling chevrons
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){let col;
        if(y<16||y>=64){col=hash2(x,y)<.12?W2.grass3:hash2(x+5,y)<.1?W2.grass2:W2.grass;if(y===15||y===64)col=W2.sand2;}
        else if(y<32){col=hash2(x,y)<.15?W2.sand2:W2.sand;if(y===16||y===31)col=W2.sand2;}
        else if(y<48){col=W2.mid;if(w2H(x>>1,y,(fr/20)|0,3)<.02)col=W2.hi;else if(((x+y*2)>>2)%7===0&&hash2(x>>2,y)<.4)col=W2.mid2;}
        else {const lx=(((x-scroll)%16)+16)%16,ly=y-48;col=(ly<1||ly>14)?W2.mid:W2.mid2;if(ly>=3&&ly<=13&&Math.abs(lx-(11-Math.abs(ly-8)*.8))<1)col=W2.hi;}
        u[y*W+x]=col;}
      for(let i=0;i<3;i++)for(let k=1;k<COLS;k++)if(rock[i][k]){const cx=k*T+8,cy=LY[i]+8;w2disc(u,W,H,cx,cy+1,6.5,W2.rock4);w2disc(u,W,H,cx,cy,6,W2.rock);w2disc(u,W,H,cx-1.5,cy-1.5,3.2,W2.rock2);}
      for(let i=0;i<3;i++){const a=L[i],cx=a.x+8,cy=LY[i]+8;
        if(i===1){w2disc(u,W,H,cx,cy+2,5.5,W2.foam);}
        if(i===2){w2ell(u,W,H,cx-2,cy+1,6,3,W2.foam,.7);}
        w2disc(u,W,H,cx,cy,4.2,W2.ink);w2disc(u,W,H,cx,cy,3.4,COL[i]);w2px(u,W,H,cx-1,cy-2,W2.glint);
        if(a.stopped&&(fr>>3)&1){w2rect(u,W,H,cx+6,cy-6,2,6,W2.gold);w2rect(u,W,H,cx+6,cy+2,2,2,W2.gold);}}
      F.put();
      for(let i=0;i<3;i++){const h=hist[i];for(let k=0;k<NB;k++){const d=h[k]||0;bars[i][k].setAttribute('height',d*9);bars[i][k].setAttribute('y',30+i*40+31-d*9);}}
      if(fr%4===0){const ts=a=>a.frames?(a.x/a.frames*60/16):0;
        setHud(root,`frame ${fc}${sp<1?' · slow motion':''}`);
        ro.innerHTML=L.map((a,i)=>`${NAME[i]} <b>${ts(a).toFixed(2)}</b> tiles/s${a.stopped?' (blocked: control returns)':''}`).join(' · ')+` · on 16 px tiles at 60 fps the targets are 3.75, 7.5 and 10, so a current carries you <b>1.33x</b> faster than surfing`;}}};});

// ======================================================================
// C3: waterfall: lip, scrolling strip that darkens, synced splash, mist dots
// ======================================================================
reg('waterfall',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const SX=48,SW=32,TOP=30,BOT=94,STREAK=14,CX=SX+SW/2;
  const BANDS=['#e4f5f6','#a6dbe8','#62add2','#3f84b8','#2e6399','#244b7c'].map(U);
  const ph=new Float32Array(SW),bx=new Float32Array(SW);for(let i=0;i<SW;i++){ph[i]=hash2(i,3)*STREAK;bx[i]=vnoise(i*.33,7.3);}
  const M=64,mx=new Float32Array(M),my=new Float32Array(M),mvx=new Float32Array(M),mvy=new Float32Array(M),ml=new Float32Array(M),mm=new Float32Array(M);
  let off=0,t=0,macc=0,fr=0,uns=0;
  c.seg('mode',()=>{});
  return {tick(dt){fr++;t+=dt;const sp=c.v('sp'),rate=c.v('mist'),sync=c.v('sync'),cyc=c.segv('mode')==='cyc';off+=sp*dt;uns+=dt;
      c.out('sp',sp+' px/s');c.out('mist',rate+' per 100 ms');
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){let col;const i=y*W+x;
        if(y<TOP-3){ // plateau with the upper river
          if(x>=SX-6&&x<SX+SW+6){const e=x<SX-4||x>=SX+SW+4;const v=(((y-off*.45+ph[(x-SX+40)%SW]*.6)%10)+10)%10;col=e?W2.sand2:v<2?W2.mid2:W2.mid;if(!e&&w2H(x,y,(fr/12)|0,1)<.012)col=W2.hi;}
          else col=hash2(x,y)<.12?W2.grass3:hash2(x+3,y)<.08?W2.grass2:W2.grass;}
        else if(y<TOP){ // the lip: brightest, 6-frame sparkle loop
          if(x>=SX-2&&x<SX+SW+2){col=y===TOP-3?BANDS[1]:BANDS[0];if(w2H(x,y,Math.floor(t*10)%6,2)<.25)col=W2.glint;else if(y===TOP-1&&(x&1))col=BANDS[1];}
          else col=y===TOP-1?W2.rock4:W2.rock2;}
        else if(y<BOT){ // cliff and falling strip
          if(x>=SX&&x<SX+SW){const k=x-SX,fy=(y-TOP)/(BOT-TOP);let idx;
            if(cyc){const b=Math.floor(((((y+ph[k])/STREAK)%1)+1)%1*4),s=(b-Math.floor(t*sp/STREAK*4))%4;idx=((s%4)+4)%4+(fy>.4?1:0)+(fy>.75?1:0);}
            else{const v=((((y-off+ph[k])/STREAK)%1)+1)%1,val=.5*bx[k]+.5*(v<.32?1:0)-(k<2||k>=SW-2?.35:0);idx=Math.floor((1-val)*2.4+fy*2.6);}
            col=BANDS[clamp(idx,0,5)];
            if(fy>.86&&w2H(x,y,Math.floor(off/3),4)<(fy-.86)*6)col=BANDS[0];}
          else {const band=((y-TOP+((x*7)>>3))>>3)&1,edge=x===SX-1||x===SX+SW;col=edge?W2.rock4:band?W2.rock:W2.rock3;if(hash2(x,y)<.06)col=W2.rock2;}}
        else { // pool
          const r=Math.hypot((x-CX)/2.4,(y-BOT-3)),v=(((r-off*.25)%9)+9)%9;col=r<6?W2.shal:v<1.2&&r<34?W2.mid2:W2.mid;
          if(x<10||x>W-11){col=x<8||x>W-9?W2.sand:W2.wet;}}
        u[i]=col;}
      // churn at the foot of the strip
      for(let x=SX-3;x<SX+SW+3;x++)for(let y=BOT-1;y<BOT+3;y++)if(w2H(x,y,Math.floor(t*12),5)<.55)w2px(u,W,H,x,y,BANDS[y<BOT+1?0:1]);
      // 4-frame splash ring: in sync = phase taken from the scroll offset
      const fsp=sync?Math.floor(((off/STREAK)%1)*4):Math.floor(uns*5)%4;
      const rx=SW/2+3+fsp*4;w2ell(u,W,H,CX,BOT+3,rx,rx/3,W2.foam,1-fsp*.18);w2ell(u,W,H,CX,BOT+3,rx-5,(rx-5)/3,W2.hi,.8);
      for(let k=0;k<6;k++){const a=w2H(k,fsp,9,1)*Math.PI,rr=6+fsp*3;w2px(u,W,H,CX+Math.cos(a)*rr*1.6*(k&1?1:-1),BOT-1-Math.sin(a)*rr*.6,W2.foam);}
      // mist: 1 px white dots, rate per 100 ms, rise and vanish over 0.5 to 1 s
      macc+=dt*10*rate;while(macc>=1){macc--;for(let j=0;j<M;j++)if(ml[j]<=0){mx[j]=SX-4+rnd()*(SW+8);my[j]=BOT+rnd()*3;mvx[j]=(rnd()-.5)*5;mvy[j]=-(5+rnd()*8);ml[j]=mm[j]=.5+rnd()*.5;break;}}
      let live=0;for(let j=0;j<M;j++)if(ml[j]>0){ml[j]-=dt;mx[j]+=mvx[j]*dt;my[j]+=mvy[j]*dt;live++;w2px(u,W,H,mx[j],my[j],ml[j]/mm[j]>.35?W2.glint:W2.hi);}
      F.put();
      if(fr%5===0){setHud(root,cyc?'palette cycle, 4 band colours':'scrolling strip');
        ro.innerHTML=`strip 32 × 64 px (1 × 2 tiles of 32 px) · ${cyc?'colours rotate':'streaks scroll'} at <b>${sp} px/s</b>, one 14 px streak loop every <b>${(STREAK/sp).toFixed(2)} s</b> · splash frame <b>${fsp+1}/4</b> ${sync?'locked to the flow':'on its own 200 ms clock, so it drifts against the fall'} · mist dots live <b>${live}</b>`;}}};});

// ======================================================================
// C4: Minecraft-style flowing water, levels 0..7, drop search, dirty chunks
// ======================================================================
reg('flowca',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const CS=8,GW=W/CS|0,GH=H/CS|0,N=GW*GH,CW=8,CH=7;
  const kind=new Uint8Array(N),src=new Uint8Array(N);let lev=new Int8Array(N).fill(-1),nl=new Int8Array(N),dist=new Int16Array(N);
  const chunkDirty=new Uint8Array(Math.ceil(GW/CW)*Math.ceil(GH/CH));
  let acc=0,ticks=0,changed=0,settledFor=0,fr=0;
  function layout(){kind.fill(0);src.fill(0);lev.fill(-1);
    for(let x=3;x<20;x++){kind[3*GW+x]=1;}for(let y=3;y<10;y++)kind[y*GW+19]=1;for(let x=6;x<16;x++)kind[9*GW+x]=1;
    kind[11*GW+21]=2;kind[11*GW+22]=2;kind[12*GW+21]=2;kind[1*GW+12]=2;
    src[6*GW+5]=1;mapChanged();ticks=0;}
  // weight = steps to the nearest drop within 4 blocks (Minecraft's search), else 1000
  function mapChanged(){const d=w2bfs(GW,GH,i=>kind[i]===2,i=>kind[i]===0);for(let i=0;i<N;i++)dist[i]=d[i]<0||d[i]>4?1000:d[i];settledFor=0;}
  function step(){nl.fill(-1);chunkDirty.fill(0);
    for(let i=0;i<N;i++)if(src[i]&&kind[i]===0)nl[i]=0;
    for(let i=0;i<N;i++){const L=lev[i];if(L<0||L>=7||kind[i]!==0)continue;const x=i%GW,y=(i/GW)|0;const cand=[];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=GW||yy>=GH)continue;const j=yy*GW+xx;if(kind[j]!==1)cand.push(j);}
      let best=1e9;for(const j of cand)best=Math.min(best,kind[j]===2?-1:dist[j]);
      for(const j of cand){const w=kind[j]===2?-1:dist[j];if(w!==best)continue;const v=kind[j]===2?8:L+1;if(nl[j]<0||v<nl[j])nl[j]=v;}}
    // a flowing cell touching 2 sources on solid ground becomes a source
    for(let i=0;i<N;i++){if(src[i]||kind[i]!==0||nl[i]<1||nl[i]>7)continue;const x=i%GW,y=(i/GW)|0;let s=0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=GW||yy>=GH)continue;if(src[yy*GW+xx])s++;}if(s>=2){src[i]=1;nl[i]=0;}}
    changed=0;for(let i=0;i<N;i++)if(nl[i]!==lev[i]){changed++;chunkDirty[((i/GW|0)/CH|0)*Math.ceil(GW/CW)+((i%GW)/CW|0)]=1;}
    const t=lev;lev=nl;nl=t;ticks++;settledFor=changed?0:settledFor+1;}
  let painting=-1;
  pointer(cv,([x,y],k)=>{if(k!=='down'&&k!=='drag')return;const gx=x/CS|0,gy=y/CS|0;if(gx<0||gy<0||gx>=GW||gy>=GH)return;const i=gy*GW+gx,tool=c.segv('tool');
    if(k==='down')painting=tool==='src'?(src[i]?0:1):tool==='wall'?(kind[i]===1?0:1):tool==='hole'?(kind[i]===2?0:1):0;
    if(tool==='src'){src[i]=painting;if(painting){kind[i]=0;}}else if(tool==='wall'){kind[i]=painting?1:0;src[i]=0;}else if(tool==='hole'){kind[i]=painting?2:0;src[i]=0;}else{kind[i]=0;src[i]=0;}
    mapChanged();});
  c.seg('tool',()=>{});c.btn('reset',layout);c.btn('dry',()=>{src.fill(0);settledFor=0;});
  layout();
  const WCOL=['#1f4f8e','#245c9a','#2b6aa6','#3479b0','#3f88b8','#4c97bf','#5ba5c4','#6db2c8'].map(U);
  return {tick(dt){fr++;const ms=c.v('ms');acc+=dt*1000;let n=0;while(acc>=ms&&n<3){acc-=ms;step();n++;}if(acc>ms*3)acc=0;
      c.out('ms',ms+' ms');
      for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx,L=lev[i],kd=kind[i];
        for(let y=0;y<CS;y++)for(let x=0;x<CS;x++){const px=gx*CS+x,py=gy*CS+y;let col;
          if(kd===1)col=(x===0||y===0)?W2.rock2:(x===CS-1||y===CS-1)?W2.rock4:W2.rock;
          else if(kd===2){const r=Math.hypot(x-3.5,y-3.5);col=r<2?W2.ink:r<3.3?W2.rock4:W2.rock3;if(L===8&&r<3.6&&((Math.atan2(y-3.5,x-3.5)*2+fr*.2+r)%1.6)<.6)col=W2.shal2;}
          else if(L>=0&&L<=7){col=WCOL[L];if(src[i]&&(x===0||y===0||x===CS-1||y===CS-1))col=W2.deep;else if(y===0&&L>0)col=mix32(col,W2.foam,.25);}
          else col=((gx+gy)&1)?W2.grass:W2.grass2;
          u[py*W+px]=col;}
        if(L>=0&&L<=7&&kd===0)digits(u,W,H,gx*CS+3,gy*CS+2,L,L>=5?W2.deep:W2.foam);}
      // dirty chunk outlines (8 x 7 cells): only these would be visited next tick
      const cw=Math.ceil(GW/CW);for(let k=0;k<chunkDirty.length;k++)if(chunkDirty[k]&&settledFor===0){const x0=(k%cw)*CW*CS,y0=((k/cw)|0)*CH*CS,x1=Math.min(W,x0+CW*CS)-1,y1=Math.min(H,y0+CH*CS)-1;
        for(let x=x0;x<=x1;x++){if((x>>1)&1){w2px(u,W,H,x,y0,W2.gold);w2px(u,W,H,x,y1,W2.gold);}}for(let y=y0;y<=y1;y++){if((y>>1)&1){w2px(u,W,H,x0,y,W2.gold);w2px(u,W,H,x1,y,W2.gold);}}}
      F.put();
      if(fr%5===0){let wet=0,ns=0,dc=0;for(let i=0;i<N;i++){if(lev[i]>=0)wet++;if(src[i])ns++;}for(const d of chunkDirty)dc+=d;
        setHud(root,settledFor?`settled · 0 cells updated`:`tick ${ticks} · ${changed} cells changed`);
        ro.innerHTML=`${ns} source${ns===1?'':'s'} · <b>${wet}</b> wet cells of ${N} · last tick changed <b>${changed}</b> cells in <b>${settledFor?0:dc}</b> of ${chunkDirty.length} chunks (gold dashes) · ${settledFor?'settled: a dirty-chunk sim now costs nothing':'spreads 1 block per tick, up to level 7'} · tick ${ms} ms = ${(1000/ms).toFixed(1)} blocks/s`;}}};});

// ======================================================================
// D1: depth bands. Hue-shifted ramp vs plain darkening, biome presets, Bayer edges
// ======================================================================
reg('depthramp',root=>{const cvs=$$('canvas',root),FA=PX(cvs[0]),FB=PX(cvs[1]),W=FA.W,H=FA.H,N=W*H,c=ctl(root),ro=$('[data-ro]',root);
  const wet=new Uint8Array(N);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x-W/2)/(W*.43),dy=(y-H/2)/(H*.4);wet[y*W+x]=dx*dx+dy*dy+(vnoise(x*.07,y*.07)-.5)*.75<1?1:0;}
  const dw=w2bfs(W,H,i=>!wet[i],i=>wet[i]===1),dl=w2bfs(W,H,i=>wet[i]===1,i=>!wet[i]);let md=1;for(let i=0;i<N;i++)if(dw[i]>md)md=dw[i];
  const D=new Float32Array(N);for(let i=0;i<N;i++)D[i]=wet[i]?Math.min(.999,Math.pow(dw[i]/md,.8)):0;
  const PRE={sea:{n:'Sea',r:['#56b5ab','#2f86a0','#2b5a8c','#2b3a6c']},river:{n:'River',r:['#62c2b2','#3a9bb2','#2f74a2','#2b5687']},
    swamp:{n:'Swamp',r:['#7d8b4c','#5d6e45','#405447','#2f3c38']},cave:{n:'Cavern',r:['#6e6ca2','#4f4b88','#3a3369','#2a2349']}};
  const F=[1.25,1,.72,.48];
  let pre='sea';const sw=$$('[data-sw]',root);
  const ramps=()=>{const R=PRE[pre].r.map(U),b=R[1];return [F.map(f=>mulc(b,f,f,f)),R];};
  function draw(){const [plain,shift]=ramps(),dith=c.v('dith');
    [[FA,plain],[FB,shift]].forEach(([P,R],pi)=>{const u=P.u32;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let col;
        if(!wet[i]){const d=dl[i];col=d<=1?W2.wet:d<=4?(hash2(x,y)<.2?W2.sand2:W2.sand):(hash2(x,y)<.12?W2.grass3:hash2(x+7,y)<.1?W2.grass2:W2.grass);if(pre==='cave'&&d>4)col=hash2(x,y)<.2?W2.rock3:W2.rock;if(pre==='swamp'&&d>4)col=hash2(x,y)<.2?W2.grass3:U('#4d6b34');}
        else{const v=D[i]*4;let b=Math.floor(v);if(dith){const f=v-b;if(f>.7&&(f-.7)/.3*16>bay(x,y)+.5)b++;}b=Math.min(3,b);col=R[b];
          if(b===0){const s=hash2(x>>1,y>>1);if(s<.35)col=mix32(col,W2.sand,.3);}
          if(dw[i]===1&&pre!=='swamp')col=W2.foam;}
        u[i]=col;}
      P.put();
      const el=sw[pi];el.innerHTML=R.map((c,k)=>`<span style="flex:1;background:${w2hex(c)};height:22px" title="band ${k}"></span>`).join('');});
    const desc=R=>R.map(c=>{const [h,s,l]=w2hsl(c);return `${Math.round(h)}°/${Math.round(s*100)}%/${Math.round(l*100)}%`;}).join(' → ');
    const set=new Set([...FB.u32]);
    ro.innerHTML=`hue/sat/light, shallow → deep · plain: <b>${desc(plain)}</b> · shifted: <b>${desc(shift)}</b> · right panel uses <b>${set.size}</b> colours in all, ${dith?'with Bayer dither on the outer 30% of each band':'hard band edges'}`;}
  c.seg('pre',v=>{pre=v;draw();});c.on('dith',draw);draw();
  return {tick(){}};});

// ======================================================================
// D2: two opposite-scrolling noises, multiplied, cut into a few bands
// ======================================================================
reg('noisebands',root=>{const cvs=$$('canvas',root),FB=PX(cvs[0]),FS=PX(cvs[1]),W=FB.W,H=FB.H,c=ctl(root),ro=$('[data-ro]',root);
  const T=64,mk=s=>{const a=w2tile(T,8,s),b=w2tile(T,4,s+9),o=new Float32Array(T*T);for(let i=0;i<T*T;i++)o[i]=.65*a[i]+.35*b[i];return o;};
  const A=mk(11),B=mk(23);let t=0,fr=0;
  const RAMP=[W2.deep,W2.deep2,W2.mid,W2.mid2,W2.shal,W2.shal2,W2.hi];
  const sa=(G,x,y)=>G[((y%T+T)%T)*T+((x%T+T)%T)];
  return {tick(dt){fr++;t+=dt;const v=c.v('sp')/1000,n=c.v('n'),thr=c.v('thr')/100,ps=+(c.segv('ps')||2),ratio=c.segv('ratio')==='07'?.7:1;
      c.out('sp',v.toFixed(3)+' UV/s');c.out('n',n+' bands');c.out('thr',thr.toFixed(2));
      const ax=Math.floor(t*v*T),bx=-Math.floor(t*v*ratio*T);const pal=[];for(let k=0;k<n;k++)pal.push(w2lerpCol(RAMP.slice(0,6),n===1?0:k/(n-1)));
      const u=FB.u32;let hi=0;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const qx=Math.floor(x/ps)*ps,qy=Math.floor(y/ps)*ps,a=sa(A,qx+ax,qy+ax),b=sa(B,qx+bx,qy+bx),p=a*b;
        let col;if(p>thr){col=W2.foam;hi++;}else{const q=clamp((p-.06)/.36,0,.999);col=pal[Math.floor(q*n)];}u[y*W+x]=col;}
      FB.put();
      const s=FS.u32,SW=FS.W;for(let y=0;y<FS.H;y++)for(let x=0;x<SW;x++){const pn=(x/64)|0,lx=x%64;let g;
        const a=sa(A,lx+ax,y+ax),b=sa(B,lx+bx,y+bx);if(pn===0)g=a;else if(pn===1)g=b;else g=a*b*1.6;
        let col=pack(g*235+10,g*235+12,g*235+18);if(pn===2&&a*b>thr)col=W2.foam;if(lx===0&&pn>0)col=W2.ink;s[y*SW+x]=col;}
      FS.put();
      if(fr%6===0){const rA=1/v,rB=1/(v*ratio),both=ratio===1?rA:rA*10;
        setHud(root,`${n} bands + highlight`);
        ro.innerHTML=`64 px tile at ${v.toFixed(3)} UV/s: layer A repeats every <b>${rA.toFixed(0)} s</b>, layer B every <b>${rB.toFixed(0)} s</b>; their product repeats every <b>${both.toFixed(0)} s</b> (our arithmetic) · palette <b>${n+1}</b> colours · highlight pixels this frame ${hi} · pixel size ${ps}`;}}};});

// ======================================================================
// D3: Voronoi caustics gated to the shallow bands, plus hashed glints
// ======================================================================
reg('caustics',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,N=W*H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const R=['#58b9b0','#3b93ac','#2c6a9c','#283f78'].map(U),LIT=[U('#8fd8cc'),U('#6cc0c8'),U('#4a8fbc'),U('#3a5c96')];
  const shore=new Float32Array(H);for(let y=0;y<H;y++)shore[y]=22+7*vnoise(y*.09,1.7);
  const band=new Int8Array(N),sandy=new Uint8Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,dx=x-shore[y];if(dx<0){band[i]=-1;continue;}const d=dx/(W-shore[y])+(vnoise(x*.06,y*.06)-.5)*.25;band[i]=clamp(Math.floor(d*4.2),0,3);sandy[i]=hash2(x>>1,y>>1)<.4?1:0;}
  const LAY=[{s:22,vx:3.2,vy:1.1},{s:15,vx:-2.1,vy:2.3}];let t=0,fr=0;
  const pts=LAY.map(()=>({ox:0,oy:0,i0:0,j0:0,nw:0,px:null,py:null}));
  function prep(L,P){const ox=t*L.vx,oy=t*L.vy;P.ox=ox;P.oy=oy;P.i0=Math.floor(ox/L.s)-1;P.j0=Math.floor(oy/L.s)-1;P.nw=Math.ceil(W/L.s)+4;const nh=Math.ceil(H/L.s)+4;
    if(!P.px||P.px.length<P.nw*nh){P.px=new Float32Array(P.nw*nh);P.py=new Float32Array(P.nw*nh);}
    for(let j=0;j<nh;j++)for(let i=0;i<P.nw;i++){const ci=P.i0+i,cj=P.j0+j,h1=w2H(ci,cj,L.s,1),h2=w2H(ci,cj,L.s,2);P.px[j*P.nw+i]=ci+.5+.38*Math.sin(t*.8+h1*6.283);P.py[j*P.nw+i]=cj+.5+.38*Math.cos(t*.6+h2*6.283);}}
  function edge(L,P,x,y){const fx=(x+P.ox)/L.s,fy=(y+P.oy)/L.s,ci=Math.floor(fx),cj=Math.floor(fy);let f1=9,f2=9;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const k=(cj+j-P.j0)*P.nw+(ci+i-P.i0),dx=P.px[k]-fx,dy=P.py[k]-fy,d=Math.sqrt(dx*dx+dy*dy);if(d<f1){f2=f1;f1=d;}else if(d<f2)f2=d;}return f2-f1;}
  return {tick(dt){fr++;t+=dt;const cau=c.v('cau'),gate=c.v('gate'),gl=c.v('gl'),steps=+(c.segv('st')||3),rate=c.v('rate')/1000;c.out('rate',rate.toFixed(3));
      if(cau)LAY.forEach((L,k)=>prep(L,pts[k]));let hashes=0;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,b=band[i];let col;
        if(b<0){const dx=shore[y]-x;col=dx<1.5?W2.wet:hash2(x,y)<.18?W2.sand2:W2.sand;}
        else{col=R[b];if(b===0&&sandy[i])col=mix32(col,W2.sand,.28);else if(b===1&&sandy[i])col=mix32(col,W2.sand,.12);
          if(cau&&(!gate||b<=1)){hashes+=18;const e=Math.min(edge(LAY[0],pts[0],x,y),edge(LAY[1],pts[1],x,y));
            if(steps===3){if(e<.04)col=W2.hi;else if(e<.1)col=LIT[b];}else if(e<.07)col=LIT[b];}
          if(x-shore[y]<1.5)col=W2.foam;}
        u[i]=col;}
      let live=0;if(gl){const st=Math.floor(t/.2),ph=(t/.2)%1;
        for(let cy=0;cy<H/4;cy++)for(let cx=0;cx<W/4;cx++){if(w2H(cx,cy,st,7)>=rate)continue;const x=cx*4+((w2H(cx,cy,st,8)*4)|0),y=cy*4+((w2H(cx,cy,st,9)*4)|0);if(band[y*W+x]<0)continue;
          if(ph<.18){w2px(u,W,H,x,y,W2.glint);w2px(u,W,H,x+1,y,W2.glint);live++;}else if(ph<.34){w2px(u,W,H,x,y,W2.foam);live++;}}}
      F.put();
      if(fr%6===0){setHud(root,gate?'caustics on the 2 shallow bands':'caustics everywhere (lies about depth)');
        ro.innerHTML=`procedural Voronoi: 9 cell distances per pixel per layer, 2 layers = <b>${hashes.toLocaleString('en-US')}</b> per frame here, so bake it to a tiling texture (2 fetches per pixel) · glints: ${(W/4)*(H/4)} cells hashed per 0.2 s step at p = ${rate.toFixed(3)}, <b>${live}</b> lit now, no list kept`;}}};});

// ======================================================================
// D4: reflections in 3/4 view: per-object flipped copy vs a screen flip
// ======================================================================
reg('reflect',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,N=W*H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const sy=new Int16Array(W);let WL=999;for(let x=0;x<W;x++){sy[x]=Math.round(62+3*Math.sin(x*.06)+3*(vnoise(x*.09,2.2)-.5));if(sy[x]<WL)WL=sy[x];}
  const base=new Uint32Array(N),obj=new Uint32Array(N),foot=new Int16Array(N),scene=new Uint32Array(N);
  const isW=(x,y)=>x>=0&&x<W&&y<H&&y>=sy[x];
  let t=0,fr=0,cx=80,dir=1,anim=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=sy[x]-y;base[y*W+x]=d<=0?0:d<=2?W2.wet:d<=7?(hash2(x,y)<.2?W2.sand2:W2.sand):(hash2(x,y)<.12?W2.grass3:hash2(x+3,y)<.1?W2.grass2:W2.grass);}
  const put=(x,y,col,fy)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;obj[y*W+x]=col;foot[y*W+x]=fy;};
  function drawObjs(){obj.fill(0);
    // tree: trunk and a shaded canopy, foot at y 57
    const tx=34,tf=sy[34]-4;for(let y=tf-12;y<=tf;y++)for(let x=tx-2;x<tx+2;x++)put(x,y,x===tx-2?W2.wood2:x===tx+1?W2.wood3:W2.wood,tf);
    for(let y=-15;y<=13;y++)for(let x=-15;x<=15;x++){const r=Math.hypot(x,y*1.08);if(r>14.5+1.5*vnoise(x*.4+3,y*.4))continue;const s=(x+y)/20+(vnoise(x*.35,y*.35)-.5)*.8;
      put(tx+x,tf-24+y,s<-.45?W2.leaf4:s<.05?W2.leaf2:s<.45?W2.leaf:W2.leaf3,tf);}
    // post with a sign
    const px=132,pf=sy[132]-3;for(let y=pf-15;y<=pf;y++){put(px,y,W2.wood2,pf);put(px+1,y,W2.wood3,pf);}for(let y=pf-16;y<pf-10;y++)for(let x=px-5;x<px+7;x++)put(x,y,y===pf-16||x===px-5?W2.wood2:W2.wood,pf);
    // walker, feet on the sand
    const f=sy[Math.round(cx)]-3,rows=w2BODY.concat(w2LEGS[Math.floor(anim)%3]);
    for(let j=0;j<rows.length;j++)for(let i=0;i<7;i++){const ch=rows[j][dir>0?i:6-i];if(ch!=='.')put(cx-3+i,f-rows.length+1+j,w2PAL[ch],f);}}
  return {tick(dt){fr++;t+=dt;const mode=c.segv('mode'),A=c.v('amp'),dk=c.v('dk')/100;c.out('amp',A+' px');c.out('dk',Math.round(dk*100)+'%');
      cx+=dir*14*dt;anim+=dt*7;if(cx>112){cx=112;dir=-1;}if(cx<62){cx=62;dir=1;}
      drawObjs();
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let col=base[i];
        if(isW(x,y)){const d=y-sy[x],v=((x*.5+y*3-t*6)%23+23)%23;col=d<1?W2.foam:v<1.4?W2.mid2:W2.mid;if(d>=1&&d<3)col=W2.shal;}
        u[i]=col;scene[i]=obj[i]||col;}
      const wob=y=>A?Math.round(A*Math.sin(y*.55+t*2.6)):0;let drawn=0;
      if(mode==='mirror'){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!obj[i])continue;const fy=foot[i],ry=2*fy-y+1,rx=x+wob(ry);
          if(ry<H&&isW(rx,ry)&&ry-sy[rx]>=1){const k=ry*W+rx;u[k]=mix32(mulc(obj[i],.85,.9,1),u[k],dk);drawn++;}}}
      else if(mode==='screen'){for(let x=0;x<W;x++)for(let y=sy[x]+1;y<H;y++){const yy=2*WL-y,xx=x+wob(y);if(yy<0||xx<0||xx>=W)continue;const s=scene[yy*W+xx];if(isW(xx,yy))continue;u[y*W+x]=mix32(mulc(s,.85,.9,1),u[y*W+x],dk);drawn++;}}
      for(let i=0;i<N;i++)if(obj[i])u[i]=obj[i];
      F.put();
      if(fr%6===0){setHud(root,mode==='mirror'?'one flipped copy per object':mode==='screen'?'screen flip about one line':'no reflection (murky water)');
        ro.innerHTML=mode==='mirror'?`each object flips about its own feet, darkened ${Math.round(dk*100)}% toward the water, row wobble ±${A} px snapped to whole pixels, clipped to water pixels · <b>${drawn}</b> reflected pixels · cost: one extra sprite per reflecting object`:
          mode==='screen'?`one mirror line for the whole screen: the grass and the tree's canopy land in the water at the wrong places, because in 3/4 view the pixel above the shore is not what would reflect there · in Godot this also needs <code>hint_screen_texture</code>, a full back-buffer copy`:
          `murky swamp water should not reflect at all (D1)`;}}};});

// ======================================================================
// E1: fixed ring pool, squashed ellipses, reuse the oldest when full
// ======================================================================
reg('rings',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);
  const MAX=64,X=new Float32Array(MAX),Y=new Float32Array(MAX),AGE=new Float32Array(MAX),A0=new Float32Array(MAX),FMS=new Float32Array(MAX),LIVE=new Uint8Array(MAX),STOLE=new Float32Array(MAX);
  let N=32,head=0,reused=0,spawned=0,t=0,fr=0,swim=800,rainAcc=0;const sw={x:80,y:50};
  const PRE={std:[150,1,'Stardew: 8 frames × 150 ms, about 1.2 s'],bob:[150,.75,'bobber: same ring at alpha 0.75'],fast:[75,1,'8 × 75 ms, 0.6 s: reads as rain']};
  const spawn=(x,y)=>{const p=PRE[c.segv('pre')||'std'],j=head;if(LIVE[j]){reused++;STOLE[j]=.35;}X[j]=x;Y[j]=y;AGE[j]=0;A0[j]=p[1];FMS[j]=p[0];LIVE[j]=1;head=(head+1)%N;spawned++;};
  const setN=()=>{N=c.v('pool');for(let j=N;j<MAX;j++)LIVE[j]=0;head%=N;c.out('pool',N+' slots');draw();};
  let rects=[],mark=null;
  function draw(){w2clr(svg);rects=[];const w=384/N;svgText(svg,8,14,'pool slots, arrow = next slot to fill',{'font-size':13,fill:'#9fb3ba'});
    for(let j=0;j<N;j++)rects.push(svgEl('rect',{x:8+j*w,y:22,width:Math.max(1,w-1.5),height:20,rx:1.5,fill:'#13202a'},svg));mark=svgEl('path',{d:'',fill:'#ffd27a'},svg);}
  pointer(cv,([x,y],k)=>{if(k==='down')spawn(x,y);});
  c.on('pool',setN);c.seg('pre',()=>{});c.btn('burst',()=>{for(let k=0;k<20;k++)spawn(10+rnd()*(W-20),8+rnd()*(H-16));});
  setN();
  return {tick(dt){fr++;t+=dt;
      if(c.v('swim')){swim-=dt*1000;if(swim<=400&&swim+dt*1000>400)spawn(sw.x,sw.y+3);if(swim<=0){swim+=800;spawn(sw.x,sw.y+3);}}
      if(c.v('rain')){rainAcc+=dt*6;while(rainAcc>=1){rainAcc--;spawn(6+rnd()*(W-12),6+rnd()*(H-12));}}
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=(((x*.35+y*2.2+t*3)%19)+19)%19;u[y*W+x]=v<1.1&&hash2(x>>2,y)<.5?W2.mid2:W2.mid;}
      let live=0;
      for(let j=0;j<N;j++){if(!LIVE[j])continue;AGE[j]+=dt;if(STOLE[j]>0)STOLE[j]-=dt;const f=Math.floor(AGE[j]*1000/FMS[j]);if(f>=8){LIVE[j]=0;continue;}live++;
        const r=2+f*2.6,a=A0[j]-.003*AGE[j]*60;w2ell(u,W,H,X[j],Y[j],r,r/3,f<2?W2.hi:W2.shal2,a*(f>=6?.6:1));}
      if(c.v('swim')){const b=Math.round(Math.cos(t*1000/2000*Math.PI)*.6);w2disc(u,W,H,sw.x,sw.y+b,3.2,W2.hair);w2rect(u,W,H,sw.x-2,sw.y+b+2,5,2,W2.skin);w2px(u,W,H,sw.x-3,sw.y+b+3,W2.skin);w2px(u,W,H,sw.x+3,sw.y+b+3,W2.skin);}
      F.put();
      const w=384/N;for(let j=0;j<N;j++){const r=rects[j];if(!r)continue;const f=LIVE[j]?AGE[j]*1000/FMS[j]/8:1;r.setAttribute('fill',STOLE[j]>0?'#ff6b5e':LIVE[j]?rgbCss(90+120*(1-f),170+60*(1-f),190+50*(1-f)):'#13202a');}
      const hx=8+head*w+(w-1.5)/2;mark.setAttribute('d',`M${hx-5} 56 L${hx+5} 56 L${hx} 47 Z`);
      if(fr%5===0){const p=PRE[c.segv('pre')||'std'];setHud(root,`live ${live} / ${N}`);
        ro.innerHTML=`${p[2]} · pool <b>${N}</b> slots, <b>${live}</b> live = ${live} sprite draws this frame · reused the oldest ring <b>${reused}</b> times (red flash) · no water grid, so a calm lake costs nothing`;}}};});

// ======================================================================
// E2: Kelvin wake from spawn spacing: arms at arcsin(1/3) = 19.47 degrees
// ======================================================================
reg('kelvin',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const M=260,PX0=new Float32Array(M),PY0=new Float32Array(M),NX=new Float32Array(M),NY=new Float32Array(M),SD=new Float32Array(M),OD=new Float32Array(M),AG=new Float32Array(M),LF=new Float32Array(M);let ph=0;
  const TAN=Math.tan(Math.asin(1/3));
  const WP=[[34,30],[158,28],[164,80],[30,84]];let wi=1,auto=true,tgt=null;
  const b={x:30,y:56,a:-Math.PI/2,odo:0,v:0};let since=0,tim=0,t=0,fr=0,live=0;
  const spawn=()=>{const sx=b.x-Math.cos(b.a)*5,sy=b.y-Math.sin(b.a)*5;for(const s of [-1,1]){const j=ph;ph=(ph+1)%M;PX0[j]=sx;PY0[j]=sy;NX[j]=-Math.sin(b.a);NY[j]=Math.cos(b.a);SD[j]=s;OD[j]=b.odo;AG[j]=0;LF[j]=.8+rnd()*.4;}};
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag'){auto=false;tgt=[x,y];}});
  c.btn('auto',()=>{auto=true;tgt=null;});c.seg('mode',()=>{});
  return {tick(dt){fr++;t+=dt;const sp=c.v('sp'),gap=c.v('gap'),byDist=c.segv('mode')!=='time';c.out('sp',sp+' px/s');c.out('gap',gap+' px');
      let goal=auto?WP[wi]:tgt,moving=false;
      if(goal){const dx=goal[0]-b.x,dy=goal[1]-b.y,d=Math.hypot(dx,dy);if(auto&&d<14)wi=(wi+1)%WP.length;
        if(!auto&&d<3){tgt=null;}else{let da=Math.atan2(dy,dx)-b.a;da=Math.atan2(Math.sin(da),Math.cos(da));b.a+=clamp(da,-2.2*dt,2.2*dt);moving=true;}}
      b.v=moving?sp:0;const step=b.v*dt;b.x+=Math.cos(b.a)*step;b.y+=Math.sin(b.a)*step;b.odo+=step;
      if(moving){if(byDist){since+=step;while(since>=gap){since-=gap;spawn();}}else{tim+=dt;while(tim>=.18){tim-=.18;spawn();}}}
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=(((x*.3+y*2.4-t*2)%23)+23)%23;u[y*W+x]=v<1&&hash2(x>>2,y)<.45?W2.deep2:W2.mid;}
      // guide lines at +-19.47 degrees behind the stern
      if(c.v('lines')){const sx=b.x-Math.cos(b.a)*5,sy=b.y-Math.sin(b.a)*5,ang=Math.asin(1/3);for(const s of [-1,1]){const a=b.a+Math.PI+s*ang;for(let r=2;r<90;r+=3)w2px(u,W,H,sx+Math.cos(a)*r,sy+Math.sin(a)*r,W2.gold);}}
      live=0;for(let j=0;j<M;j++){if(LF[j]<=0)continue;AG[j]+=dt;if(AG[j]>=LF[j]){LF[j]=0;continue;}live++;const off=(b.odo-OD[j])*TAN*SD[j],x=PX0[j]+NX[j]*off,y=PY0[j]+NY[j]*off,k=AG[j]/LF[j],r=.6+k*3.6;
        w2ell(u,W,H,x,y,r,r*.6,k<.6?W2.foam:W2.hi,1-k*.7);if(k<.5)w2px(u,W,H,x,y,W2.foam);}
      // transverse bars right behind the mover
      if(moving){const nx=-Math.sin(b.a),ny=Math.cos(b.a);for(const [dd,len] of [[8,3],[12,4]]){const cx=b.x-Math.cos(b.a)*dd,cy=b.y-Math.sin(b.a)*dd;for(let q=-len;q<=len;q++)if((q+fr/8|0)%3)w2px(u,W,H,cx+nx*q,cy+ny*q,W2.hi);}}
      // boat: a small rotated hull with a rower
      const ca=Math.cos(b.a),sa=Math.sin(b.a);for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){const lx=x*ca+y*sa,ly=-x*sa+y*ca,e=(lx/6.5)**2+(ly/2.8)**2;if(e>1)continue;w2px(u,W,H,b.x+x,b.y+y,e>.6?W2.wood3:lx>3?W2.wood2:W2.wood);}
      w2disc(u,W,H,b.x-ca*.5,b.y-sa*.5,1.6,W2.shirt);w2px(u,W,H,b.x-ca*.5,b.y-sa*.5,W2.hair);
      if(!auto&&tgt){w2px(u,W,H,tgt[0],tgt[1],W2.gold);w2ell(u,W,H,tgt[0],tgt[1],3,2,W2.gold,.6);}
      F.put();
      if(fr%5===0){setHud(root,moving?`${byDist?'spawn every '+gap+' px':'spawn every 0.18 s'}`:'stopped: pool drains to zero');
        ro.innerHTML=`half-angle arcsin(1/3) = <b>19.47°</b>, tan = 0.354, so each pair drifts sideways by distance behind × 0.354 · ${byDist?`one pair per <b>${gap} px</b> travelled: the arms keep the same spacing at any speed`:`one pair per 0.18 s = one per <b>${(sp*.18).toFixed(1)} px</b> at this speed: slow down and the arms bunch up`} · live particles <b>${live}</b> of ${M}`;}}};});

// ======================================================================
// E3: wading and swimming: knee clip, ring per step, head only, blocked
// ======================================================================
reg('wading',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const Z=[{n:'grass',x:0,g:150,f:'none'},{n:'sand',x:24,g:160,f:'none'},{n:'shallow',x:54,g:200,f:'WATER_SHALLOW'},{n:'swimmable',x:84,g:200,f:'WATER_SWIM'},{n:'deep',x:114,g:0,f:'WATER_DEEP'}];
  const edge=y=>Math.round(1.5*Math.sin(y*.35));
  const zoneAt=(x,y=40)=>{let k=0;for(let i=0;i<Z.length;i++)if(x>=Z[i].x+(i?edge(y):0))k=i;return k;};
  const FY=40,RM=16,RX=new Float32Array(RM),RY=new Float32Array(RM),RA=new Float32Array(RM);let rh=0;
  let x=8,dir=1,anim=0,lastStep=0,block=0,t=0,fr=0,state='walk';
  return {tick(dt){fr++;t+=dt;const base=c.v('sp'),tint=c.v('tint'),ringOn=c.v('ring');c.out('sp',base+' px/s');
      const zi=zoneAt(x);let g=Z[zi].g||200;
      if(block>0){block-=dt;if(block<=0)dir=-1;}
      else{const v=base*150/g,nx=x+dir*v*dt;if(dir>0&&zoneAt(nx+4)===4){block=.8;state='blocked';}else{x=nx;anim+=dt*7*v/base;}
        if(x<6){x=6;dir=1;}}
      const z=zoneAt(x);state=block>0?'blocked':z===3?'swim':z===2?'wade':'walk';
      const st=Math.floor(anim);if(st!==lastStep){lastStep=st;if(ringOn&&(z===2||z===3)){RX[rh]=x;RY[rh]=z===3?FY-2:FY-3;RA[rh]=0.001;rh=(rh+1)%RM;}}
      for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){const k=zoneAt(xx,yy),e=xx-(Z[k].x+(k?edge(yy):0));let col;
        if(k===0)col=hash2(xx,yy)<.12?W2.grass3:hash2(xx+5,yy)<.1?W2.grass2:W2.grass;
        else if(k===1)col=e>=Z[2].x-Z[1].x-3?W2.wet:hash2(xx,yy)<.18?W2.sand2:W2.sand;
        else if(k===2){col=hash2(xx>>1,yy>>1)<.4?mix32(W2.shal2,W2.sand,.3):W2.shal2;if(e<1)col=W2.foam;}
        else if(k===3){const v=(((xx*.4+yy*2-t*4)%17)+17)%17;col=v<1.2?W2.shal:W2.mid;}
        else{const v=(((xx*.3+yy*2-t*2)%23)+23)%23;col=v<1?W2.deep2:W2.deep;}
        u[yy*W+xx]=col;}
      for(let j=0;j<RM;j++){if(RA[j]<=0)continue;RA[j]+=dt;if(RA[j]>1){RA[j]=0;continue;}const r=2+RA[j]*7;w2ell(u,W,H,RX[j],RY[j],r,r/3,W2.foam,1-RA[j]);}
      const fr3=state==='blocked'?0:(Math.floor(anim)%4===1?1:Math.floor(anim)%4===3?2:0),flip=dir<0;
      if(state==='walk')w2walker(u,W,H,x,FY,fr3,flip);
      else if(state==='wade'||(state==='blocked'&&z===2)){w2walker(u,W,H,x,FY,fr3,flip,{cut:9,tint:W2.shal2,hide:!tint});w2ell(u,W,H,x,FY-3,4.5,1.3,W2.foam,.9);}
      else{const bob=Math.round(Math.sin(t*4));w2walker(u,W,H,x,FY+5+bob,0,flip,{cut:6,hide:true,pal:{c:U('#3a8a8a'),C:U('#2a6a6a')}});w2ell(u,W,H,x,FY-2+bob,4.5,1.4,W2.foam,.9);
        const arm=Math.floor(anim*1.5)%2;w2px(u,W,H,x+(arm?-4:4),FY-2+bob,W2.skin);}
      if(block>0&&(fr>>3)&1){w2rect(u,W,H,x+5,FY-17,2,4,W2.gold);w2rect(u,W,H,x+5,FY-12,2,1,W2.gold);}
      F.put();
      if(fr%5===0){const Zc=Z[z];const gs=Zc.g?Zc.g:'n/a';setHud(root,`${Zc.n} · ${state}`);
        ro.innerHTML=`tile <b>${Zc.n}</b> · flags <b>${Zc.f}</b> · ground speed <b>${gs}</b>${Zc.g?` → step time ×${(Zc.g/150).toFixed(2)} of grass (150)`:''} · state <b>${state}</b>${state==='wade'?` · cut 3 px above the feet, ${tint?'tinted 50% toward the water':'hidden'}`:state==='swim'?' · head and shoulders only, swim outfit':state==='blocked'?' · deep water: the step is refused':''}`;}}};});

// ======================================================================
// E4: splashes, sinking items (trashholder) and a log that floats
// ======================================================================
reg('splash',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const shoreY=x=>16+Math.round(2*Math.sin(x*.12));
  const T={item:{fr:2,ms:300,n:'Item',s:'2 splash frames × 300 ms, then deleted (trashholder) with blue bubbles'},rock:{fr:3,ms:150,n:'Stone',s:'ring sheet, 3 frames × 150 ms, then gone'},log:{fr:3,ms:150,n:'Log',s:'3 frames × 150 ms, then it floats and drifts'}};
  let O=[],t=0,fr=0,idle=0,sunk=0,last='Click the water to drop the chosen object.';let ids=0;
  const drop=(x,y,type)=>{if(y<shoreY(x)+6)y=shoreY(x)+6;O.push({type,x,y,z:26,vz:0,st:'fall',a:0,id:ids++});if(O.length>14)O.shift();idle=0;};
  pointer(cv,([x,y],k)=>{if(k==='down')drop(x,y,c.segv('obj')||'item');});
  c.seg('obj',()=>{});c.seg('mode',()=>{});
  const drawObj=(type,x,y,sub)=>{if(type==='item'){w2rect(u,W,H,x-1,y-5,3,1,W2.wood3);w2rect(u,W,H,x-2,y-4,5,4,U('#cfe8f0'));w2rect(u,W,H,x-1,y-3,3,3-sub,W2.shirt);}
    else if(type==='rock'){w2rect(u,W,H,x-2,y-3,5,3,W2.rock);w2rect(u,W,H,x-1,y-4,3,1,W2.rock2);w2px(u,W,H,x-1,y-3,W2.rock2);}
    else{w2rect(u,W,H,x-6,y-3,12,3,W2.wood);w2rect(u,W,H,x-6,y-3,12,1,W2.wood2);w2rect(u,W,H,x+5,y-3,1,3,W2.wood3);if(sub)w2rect(u,W,H,x-6,y-1,12,1,mix32(W2.wood,W2.mid,.5));}};
  return {tick(dt){fr++;t+=dt;idle+=dt;const cozy=c.segv('mode')==='cozy';
      if(idle>2.4&&motion){const ty=['item','rock','log'][(rnd()*3)|0];drop(20+rnd()*(W-40),40+rnd()*(H-50),ty);}
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=shoreY(x);let col;
        if(y<s){col=y===s-1?W2.wet:hash2(x,y)<.18?W2.sand2:W2.sand;}
        else{const v=(((x*.3+y*2.4-t*3)%21)+21)%21;col=y===s?W2.foam:v<1.1&&hash2(x>>2,y)<.5?W2.mid2:W2.mid;}
        u[y*W+x]=col;}
      for(let y=0;y<30;y++)for(let x=64;x<84;x++){if(y<shoreY(x))continue;u[y*W+x]=(x===64||x===83)?W2.wood3:((y>>2)&1)?W2.wood:W2.wood2;}
      for(let x=63;x<86;x+=21)for(let y=28;y<32;y++)u[y*W+x]=W2.wood3;
      let floating=0;
      for(const o of O){const T0=T[o.type];o.a+=dt;
        if(o.st==='fall'){o.vz+=260*dt;o.z-=o.vz*dt;w2ell(u,W,H,o.x,o.y,2.5-o.z/20,1,W2.deep2,.7);drawObj(o.type,o.x,o.y-o.z,0);
          if(o.z<=0){o.st='splash';o.a=0;}}
        else if(o.st==='splash'){const f=Math.floor(o.a*1000/T0.ms);
          if(f>=T0.fr){o.st=o.type==='log'&&cozy?'float':'sink';o.a=0;if(o.st==='sink')sunk++;last=`${T0.n}: ${o.type==='log'&&!cozy?'Tibia deletes it like any other item':T0.s}`;}
          else{for(let k=0;k<8;k++){const ang=k/8*Math.PI*2,r=2+f*3.5,h=Math.sin((f+1)/(T0.fr+1)*Math.PI)*6;w2px(u,W,H,o.x+Math.cos(ang)*r,o.y+Math.sin(ang)*r*.4-h*(k&1?1:.6),W2.foam);if(f===0)w2px(u,W,H,o.x+Math.cos(ang)*r*.6,o.y-2-h,W2.glint);}
            w2ell(u,W,H,o.x,o.y,2+f,1+f/3,W2.foam,1);}}
        if(o.st==='sink'||o.st==='float'){const r=3+o.a*16;if(o.a<.5)w2ell(u,W,H,o.x,o.y,r,r/3,W2.hi,1-o.a*1.6);}
        if(o.st==='sink'){if(o.a<.25)drawObj(o.type,o.x,o.y+2,1);
          if(o.type!=='rock')for(let k=0;k<4;k++){const ba=o.a-k*.12;if(ba<0||ba>.6)continue;w2px(u,W,H,o.x-3+k*2+Math.sin(ba*20+k)*1,o.y-ba*14,ba>.5?W2.hi:U('#bfe6ff'));}
          if(o.a>1)o.dead=true;}
        if(o.st==='float'){floating++;o.x+=5*dt;const bob=Math.round(Math.sin(o.a*Math.PI*2/2.5+o.id*2.1));drawObj('log',o.x,o.y+bob,1);if(o.x>W+12||o.a>25)o.dead=true;}}
      O=O.filter(o=>!o.dead);
      F.put();
      if(fr%5===0){setHud(root,cozy?'cozy: logs float':'Tibia: water is a trashholder');ro.innerHTML=`${last} · deleted <b>${sunk}</b> · floating <b>${floating}</b> · splashes stay under half a second`;}}};});

// ======================================================================
// E5: floating things bob 1 px on their own phase and drift with the flow
// ======================================================================
reg('bobbing',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const RT=22,RB=74,ISL={x0:126,x1:152,y0:38,y1:54};
  const inIsl=(x,y)=>{const dx=(x-(ISL.x0+ISL.x1)/2)/((ISL.x1-ISL.x0)/2),dy=(y-(ISL.y0+ISL.y1)/2)/((ISL.y1-ISL.y0)/2);return dx*dx+dy*dy<1;};
  const SPR={log:{w:14,rows:["..aaaaaaaaaaa.","abbbbbbbbbbbcd","bbbbbbbbbbbbcd",".eeeeeeeeeee.."],big:1},
    bottle:{w:3,rows:[".k.","gfg","ggg","ggg","ggg"],big:0},pad:{w:6,rows:[".ppqp.","pppppp",".pppp."],big:0},
    boat:{w:18,rows:["....rrrrrrrrrr....","..rrsssssssssshr..",".rssttttttttttsshr","rssttttttttttttssr",".rsssssssssssssshr","..rrrrrrrrrrrrrr.."],big:1}};
  const CP={a:W2.wood2,b:W2.wood,c:W2.wood3,d:W2.sand2,e:W2.wood3,k:W2.wood3,g:U('#4f9a6a'),f:U('#a6e0b8'),p:U('#4f9a50'),q:U('#f2a6c8'),r:W2.wood3,s:W2.wood,t:W2.wood2,h:W2.sand3};
  const mk=()=>[{k:'log',x:10,y:36,dr:1},{k:'log',x:70,y:63,dr:1},{k:'bottle',x:96,y:48,dr:1},{k:'log',x:-30,y:46,dr:1},{k:'boat',x:30,y:30,dr:0},
    {k:'pad',x:100,y:69,dr:0},{k:'pad',x:110,y:71,dr:0},{k:'pad',x:160,y:28,dr:0},{k:'pad',x:172,y:30,dr:0}].map((o,i)=>({...o,id:i,stuck:false}));
  let O=mk(),t=0,fr=0;c.btn('reset',()=>{O=mk();});
  return {tick(dt){fr++;t+=dt;const A=c.v('amp'),P=c.v('per')/10,dr=c.v('dr'),same=c.v('same'),frz=c.v('frz');
      c.out('amp',A+' px');c.out('per',P.toFixed(1)+' s');c.out('dr',dr+' px/s');
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){let col;
        if(y<RT-4||y>=RB+4)col=hash2(x,y)<.12?W2.grass3:hash2(x+5,y)<.1?W2.grass2:W2.grass;
        else if(y<RT||y>=RB)col=(y===RT-1||y===RB)?W2.wet:W2.sand;
        else if(inIsl(x,y))col=hash2(x,y)<.2?W2.sand2:W2.sand;
        else{const v=(((x-t*dr*1.2+y*3.7)%19)+19)%19;col=v<1.2&&hash2(x>>2,y)<.55?W2.mid2:W2.mid;if(y===RT||y===RB-1)col=W2.foam;
          const dx=(x-(ISL.x0+ISL.x1)/2)/((ISL.x1-ISL.x0)/2+1),dy=(y-(ISL.y0+ISL.y1)/2)/((ISL.y1-ISL.y0)/2+1);if(dx*dx+dy*dy<1)col=W2.foam;}
        u[y*W+x]=col;}
      // mooring post and rope for the boat
      w2rect(u,W,H,24,RT-8,2,6,W2.wood3);for(let k=0;k<6;k++)w2px(u,W,H,26+k,RT-4+k*.8,W2.sand3);
      for(const o of O){const S=SPR[o.k];
        if(o.dr&&!o.stuck&&!frz){o.x+=dr*dt;const fx=o.x+S.w/2;if(inIsl(fx+1,o.y-1)||inIsl(fx+1,o.y-S.rows.length+1))o.stuck=true;if(o.x>W+4){o.x=-S.w-4;o.stuck=false;}}
        const P2=S.big?P:P*.57,phs=same?0:w2H(o.id,7,0,0)*6.283,bob=frz?0:Math.round(A*Math.sin(t*6.283/P2+phs));
        const h=S.rows.length,x0=Math.round(o.x-S.w/2),wl=o.y;
        for(let j=0;j<h;j++){const yy=Math.round(o.y-h+1+j+bob);for(let i=0;i<S.w;i++){const ch=S.rows[j][i];if(ch==='.')continue;let col=CP[ch];if(yy>=wl)col=mix32(col,W2.mid,.55);w2px(u,W,H,x0+i,yy,col);}}
        if(S.big&&!frz)w2ell(u,W,H,o.x,wl+1,S.w/2+1,1.2,W2.hi,.5);}
      F.put();
      if(fr%6===0){const st=O.filter(o=>o.stuck).length;setHud(root,frz?'bobbing frozen (motion option)':same?'same phase: everything bobs together':'phase from hash(id)');
        ro.innerHTML=`bob ${frz?'off':`<b>${A} px</b>`} · logs and boat <b>${P.toFixed(1)} s</b>, small items <b>${(P*.57).toFixed(1)} s</b> · drift <b>${dr} px/s</b> along the flow · stopped at the sandbar <b>${st}</b> · ${A>=2?'2 px and up reads as bouncing':'1 px at 320x180 reads as floating'}`;}}};});

// ======================================================================
// E6 / F3: fishing tease, Stardew's 800 ms window, Tibia's chance and fished-out tiles
// ======================================================================
reg('fishing',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);
  const BX=84,BY=42,TS=1200,COMP=60,SHORE=78;
  let st='idle',sa=0,dur=0,nib=[],biteAt=0,win=0,t=0,fr=0,dep=0,tries=0,caught=0,roll=null,msg='Click the water or press Cast.',biteMs=0;
  const RG=12,RX=new Float32Array(RG),RY=new Float32Array(RG),RA=new Float32Array(RG);let rh=0;const ring=(x,y)=>{RX[rh]=x;RY[rh]=y;RA[rh]=.001;rh=(rh+1)%RG;};
  const chance=s=>Math.min(Math.max(10+(s-10)*.597,10),50);
  const mode=()=>c.segv('mode')||'stardew';
  function cast(){const m=mode();tries++;
    if(m==='tibia'){ring(BX,BY);ring(BX,BY);const was=dep>0,ch=chance(c.v('sk'));roll=!was&&rnd()*100<ch;st=roll?'caught':'empty';sa=0;if(roll){caught++;dep=TS;}if(was)tries--;
      msg=was?'fished-out tile: still splashes, no fish, no skill':roll?`caught at ${ch.toFixed(1)}%: one worm used`:`nothing this time (${ch.toFixed(1)}% chance)`;return;}
    st='cast';sa=0;roll=m==='server'?(dep>0?false:rnd()*100<chance(c.v('sk'))):null;}
  function startWait(){const m=mode();st='wait';sa=0;
    if(m==='stardew'){const bait=c.v('bait');biteMs=Math.max(500,(600+rnd()*(30000-250*10-600))*(bait?.5:1));dur=biteMs/1000/4;}
    else dur=1+rnd()*2;
    const n=(rnd()*4)|0;nib=[];for(let k=0;k<n;k++)nib.push(dur*(.35+.55*(k+1)/(n+1)));}
  function act(){if(st==='idle'||st==='caught'||st==='empty'||st==='early'||st==='missed')cast();
    else if(mode()==='stardew'){if(st==='wait'){st='early';sa=0;msg='too early: the fish swims off';}else if(st==='bite'){if(dep>0){st='empty';msg='fished-out tile: nothing bites here';}else{st='caught';caught++;dep=TS;msg=`caught ${Math.round(win*1000)} ms into the 800 ms window`;}sa=0;}}}
  pointer(cv,(p,k)=>{if(k==='down')act();});c.btn('act',act);c.seg('mode',()=>{st='idle';sa=0;msg='Click the water or press Cast.';});
  // chart: TFS chance and the fan fit for ice fishing
  const X=s=>36+(s-10)/90*270,Y=p=>176-p/55*128;
  function chart(){w2clr(svg);const sk=c.v('sk');
    for(const p of [0,10,30,50]){svgEl('line',{x1:36,x2:306,y1:Y(p),y2:Y(p),stroke:'#1e2c36'},svg);svgText(svg,30,Y(p)+4,p+'%',{'text-anchor':'end','font-size':11,fill:'#9fb3ba'});}
    for(const s of [10,40,70,100])svgText(svg,X(s),192,String(s),{'text-anchor':'middle','font-size':11,fill:'#9fb3ba'});
    svgText(svg,171,206,'fishing skill',{'text-anchor':'middle','font-size':11,fill:'#9fb3ba'});
    const a=[],b=[];for(let s=10;s<=100;s+=2){a.push([X(s),Y(chance(s))]);b.push([X(s),Y(Math.min(5+(s-10)/2,50))]);}
    poly(svg,b,{stroke:'#62d2c4','stroke-width':1.4,'stroke-dasharray':'4 3',opacity:.7});poly(svg,a,{stroke:'#ffd27a','stroke-width':2.2});
    svgEl('line',{x1:X(77),x2:X(77),y1:Y(50)-4,y2:Y(0),stroke:'#ffd27a','stroke-dasharray':'2 3',opacity:.6},svg);svgText(svg,X(77)+4,Y(50)+14,'cap at skill 77',{'font-size':11,fill:'#ffd27a'});
    svgText(svg,40,16,'TFS: min(max(10 + (skill − 10) × 0.597, 10), 50)%',{'font-size':11,fill:'#ffd27a'});svgText(svg,40,30,'fan fit, ice fishing (dashed)',{'font-size':11,fill:'#62d2c4'});
    svgEl('line',{x1:X(sk),x2:X(sk),y1:Y(55),y2:Y(0),stroke:'#ffffff','stroke-width':1},svg);svgEl('circle',{cx:X(sk),cy:Y(chance(sk)),r:4,fill:'#ffd27a'},svg);
    svgText(svg,X(sk)+(sk>70?-6:6),Y(chance(sk))-8,chance(sk).toFixed(1)+'%',{'font-size':12,fill:'#ffffff','text-anchor':sk>70?'end':'start'});}
  c.on('sk',chart);chart();
  return {tick(dt){fr++;t+=dt;sa+=dt;const m=mode();if(dep>0)dep=Math.max(0,dep-dt*COMP);c.out('sk',c.v('sk'));
      if(st==='cast'&&sa>.45){ring(BX,BY);startWait();}
      else if(st==='wait'){for(let k=0;k<nib.length;k++)if(nib[k]>0&&sa>=nib[k]){nib[k]=-nib[k];ring(BX,BY);}
        if(sa>=dur){if(m==='server'&&!roll){st='empty';sa=0;msg=dep>0?'fished-out tile: the server says no fish':'the roll failed, so the bobber just drifts back';}else{st='bite';sa=0;win=0;ring(BX,BY);ring(BX,BY);}}}
      else if(st==='bite'){win=sa;if(m==='server'&&sa>.5){st='caught';caught++;dep=TS;sa=0;msg='the server decided the catch at the cast; the client only played the tease';}
        else if(m==='stardew'&&sa>.8){st='missed';sa=0;msg='missed the 800 ms window: a new bite time is rolled';}}
      else if(st==='missed'&&sa>.7)startWait();
      else if((st==='caught'||st==='empty'||st==='early')&&sa>2.2){st='idle';sa=0;}
      else if(st==='idle'&&sa>2.5&&motion)cast();
      // scene
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){let col;const s=SHORE+Math.round(1.5*Math.sin(x*.15));
        if(y>=s)col=y===s?W2.wet:hash2(x,y)<.18?W2.sand2:W2.sand;
        else{const v=(((x*.3+y*2.4-t*3)%21)+21)%21;col=y===s-1?W2.foam:v<1.1&&hash2(x>>2,y)<.5?W2.mid2:W2.mid;
          const inT=x>=BX-16&&x<BX+16&&y>=BY-16&&y<BY+16;if(inT){if(dep>0)col=mix32(col,W2.deep,.35);if((x===BX-16||x===BX+15||y===BY-16||y===BY+15)&&((x+y)&1))col=dep>0?W2.deep2:W2.mid2;}}
        u[y*W+x]=col;}
      if(dep<=0)for(let k=0;k<3;k++){const ph=(t*.7+k*.33)%1;if(ph<.25){const fx=BX-12+w2H(k,Math.floor(t*.7+k*.33),3,0)*24,fy=BY-12+w2H(k,Math.floor(t*.7+k*.33),4,0)*24;w2px(u,W,H,fx,fy,U('#cfe2ea'));w2px(u,W,H,fx+1,fy,U('#9fb8c4'));}}
      w2walker(u,W,H,14,90,0,false);
      // bobber position by state
      let bx=BX,by=BY,show=true,under=false;
      if(st==='idle'){bx=26;by=72;}
      else if(st==='cast'){const k=Math.min(1,sa/.45);bx=lerp(26,BX,k);by=lerp(72,BY,k)-Math.sin(k*Math.PI)*18;}
      else if(st==='wait'){for(const n of nib)if(n<0&&sa+n<.3&&sa+n>=0)by+=1;by+=Math.round(Math.sin(t*2.4)*.4);}
      else if(st==='bite'){under=sa<.12||(m==='stardew'&&(Math.floor(sa*1000/50)&1)===1);if(m==='stardew')bx+=Math.round((w2H(Math.floor(sa*20),1,0,0)-.5)*2);}
      else if(st==='caught'){show=false;const k=Math.min(1,sa/.5),fx=lerp(BX,30,k),fy=lerp(BY,64,k)-Math.sin(k*Math.PI)*16;w2rect(u,W,H,fx-3,fy-1,6,3,U('#cfe2ea'));w2px(u,W,H,fx-4,fy,U('#9fb8c4'));w2px(u,W,H,fx+2,fy-1,W2.ink);}
      for(let k=0;k<=24;k++){const q=k/24,lx=lerp(22,bx,q),ly=lerp(76,by,q)+Math.sin(q*Math.PI)*4;if(k%2===0&&show)w2px(u,W,H,lx,ly,U('#d8e2e6'));}
      w2rect(u,W,H,19,74,4,1,W2.wood3);w2px(u,W,H,22,75,W2.wood3);
      if(show&&!under){w2rect(u,W,H,bx-1,by-2,3,2,W2.red);w2rect(u,W,H,bx-1,by,3,1,W2.glint);w2px(u,W,H,bx,by-3,W2.ink);}
      if(show&&under)w2px(u,W,H,bx,by-1,W2.red);
      if(st==='bite'&&(fr>>2)&1){w2rect(u,W,H,bx+5,by-12,2,5,W2.gold);w2rect(u,W,H,bx+5,by-6,2,2,W2.gold);}
      for(let j=0;j<RG;j++){if(RA[j]<=0)continue;RA[j]+=dt;if(RA[j]>1){RA[j]=0;continue;}const r=2+RA[j]*9;w2ell(u,W,H,RX[j],RY[j],r,r/3,W2.hi,(1-RA[j])*.9);}
      F.put();
      if(fr%5===0){const ch=chance(c.v('sk'));setHud(root,dep>0?`fished out: regrows in ${Math.floor(dep/60)}:${String(Math.floor(dep%60)).padStart(2,'0')}`:st);
        const base=m==='stardew'?`bite time random(600, 30000 − 250 × 10) ms${c.v('bait')?' × 0.5 bait':''}${biteMs?`, this cast <b>${(biteMs/1000).toFixed(1)} s</b> (played 4x faster)`:''} · window <b>800 ms</b>`:m==='server'?`server rolls ${ch.toFixed(1)}% at the cast, client plays 0 to 3 nibbles over 1 to 3 s`:`one click, one roll at ${ch.toFixed(1)}%`;
        ro.innerHTML=`${msg} · ${base} · tries ${tries}, fish ${caught} · fished-out tiles regrow after 1,200 s (shown 60x faster)`;}}};});

// ======================================================================
// F4: element reactions on water tiles: steam, ice, electrified, oil
// ======================================================================
reg('reactions',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const CS=8,GW=W/CS|0,GH=H/CS|0,N=GW*GH;
  const wat=new Uint8Array(N),ice=new Float32Array(N),stm=new Float32Array(N),elc=new Float32Array(N),oil=new Float32Array(N),brn=new Float32Array(N);
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const dx=(x-11.5)/6,dy=(y-6.5)/5.2;wat[y*GW+x]=(y>=5&&y<=8)||(dx*dx+dy*dy<1)?1:0;}
  const nearW=new Uint8Array(N);for(let i=0;i<N;i++){if(wat[i])continue;const x=i%GW,y=(i/GW)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<GW&&yy<GH&&wat[yy*GW+xx])nearW[i]=1;}}
  const NB=[[1,0],[-1,0],[0,1],[0,-1]];
  const nbs=i=>{const x=i%GW,y=(i/GW)|0,o=[];for(const [dx,dy] of NB){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<GW&&yy<GH)o.push(yy*GW+xx);}return o;};
  const ICE_T=15,STM_T=6,ELC_T=3,OIL_T=24;
  let t=0,fr=0,oilAcc=0,burnAcc=0,idle=0,auto=0,msg='Pick an element and click a water tile.';
  function apply(i,el){if(!wat[i]){msg='land tile: no water reaction';return;}idle=0;
    if(el==='frost'){let n=0;for(const j of [i,...nbs(i)])if(wat[j]&&!oil[j]){ice[j]=ICE_T;stm[j]=0;elc[j]=0;n++;}msg=`frost: ${n} tiles become ICE (walkable, ground speed about 110) for ${ICE_T} s, then decay back`;}
    else if(el==='fire'){if(oil[i]>0){brn[i]=2;msg='fire on oil: the slick burns and spreads along the oil';}else if(ice[i]>0){ice[i]=0;stm[i]=STM_T;msg='fire on ice: melts back to water with a puff of steam';}
      else{let n=0;for(const j of [i,...nbs(i)])if(wat[j]&&!ice[j]){stm[j]=STM_T;n++;}msg=`fire on water: a STEAM field on ${n} tiles that blocks sight for ${STM_T} s`;}}
    else if(el==='bolt'){if(ice[i]>0){msg='lightning on ice: nothing conducts';return;}const cap=c.v('nocap')?999:c.v('cap'),d=new Int16Array(N).fill(-1),q=[i];d[i]=0;let h=0,n=0,sn=0;
      while(h<q.length){const k=q[h++];elc[k]=ELC_T;n++;if(stm[k]>0)sn++;if(d[k]>=cap)continue;for(const j of nbs(k))if(d[j]<0&&wat[j]&&!ice[j]){d[j]=d[k]+1;q.push(j);}}
      msg=`lightning: flood fill reached <b>${n}</b> tiles${cap<999?` (stops ${cap} steps out)`:' with no cap: the whole connected lake'}${sn?`, ${sn} of them steam (electrified cloud)`:''}`;}
    else if(el==='oil'){let n=0;for(const j of [i,...nbs(i)])if(wat[j]&&!ice[j]){oil[j]=OIL_T;n++;}msg=`oil: a slick on ${n} tiles that drifts east with the flow and burns on fire contact`;}}
  pointer(cv,([x,y],k)=>{if(k!=='down')return;const gx=x/CS|0,gy=y/CS|0;if(gx<0||gy<0||gx>=GW||gy>=GH)return;apply(gy*GW+gx,c.segv('el')||'frost');});
  c.seg('el',()=>{});c.btn('clear',()=>{ice.fill(0);stm.fill(0);elc.fill(0);oil.fill(0);brn.fill(0);});
  const SEQ=[['oil',6*GW+5],['fire',6*GW+6],['frost',7*GW+15],['bolt',4*GW+11],['fire',8*GW+18]];
  return {tick(dt){fr++;t+=dt;idle+=dt;c.out('cap',c.v('cap')+' steps');
      if(idle>3.2&&motion){const [el,i]=SEQ[auto%SEQ.length];auto++;apply(i,el);idle=1.2;}
      for(let i=0;i<N;i++){if(ice[i]>0)ice[i]=Math.max(0,ice[i]-dt);if(stm[i]>0)stm[i]=Math.max(0,stm[i]-dt);if(elc[i]>0)elc[i]=Math.max(0,elc[i]-dt);if(oil[i]>0&&!brn[i])oil[i]=Math.max(0,oil[i]-dt);}
      burnAcc+=dt;if(burnAcc>=.15){burnAcc=0;const add=[];for(let i=0;i<N;i++)if(brn[i]>0){for(const j of nbs(i))if(oil[j]>0&&!brn[j])add.push(j);}for(const j of add)brn[j]=2;}
      for(let i=0;i<N;i++)if(brn[i]>0){brn[i]-=dt;if(brn[i]<=0){brn[i]=0;oil[i]=0;stm[i]=Math.max(stm[i],2);}}
      oilAcc+=dt;if(oilAcc>=1.2){oilAcc=0;for(let y=0;y<GH;y++)for(let x=GW-2;x>=0;x--){const i=y*GW+x,j=i+1;if(oil[i]>0&&!brn[i]&&wat[j]&&!ice[j]&&!oil[j]){oil[j]=oil[i];oil[i]=0;}}
        for(let y=0;y<GH;y++){const i=y*GW+GW-1;if(oil[i]>0&&!brn[i])oil[i]=0;}}
      for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx;
        for(let y=0;y<CS;y++)for(let x=0;x<CS;x++){const px=gx*CS+x,py=gy*CS+y;let col;
          if(!wat[i])col=nearW[i]?(hash2(px,py)<.18?W2.sand2:W2.sand):(hash2(px,py)<.12?W2.grass3:hash2(px+3,py)<.1?W2.grass2:W2.grass);
          else if(ice[i]>0){col=(x+y)%7===0?W2.glint:U('#cfe9f2');if(ice[i]<3&&((x*3+y*5+gx)%11===0))col=U('#7fa8bc');}
          else{const v=(((px-t*6+py*3.1)%15)+15)%15;col=v<1.1?W2.shal2:W2.shal;
            if(oil[i]>0){const s=hash2(px>>1,py>>1);col=s<.15?U('#8a6aa0'):s<.25?U('#6a8a6a'):(x+y)&1?U('#3a2a3e'):U('#46324a');}
            if(elc[i]>0)col=mix32(col,U('#bfe8ff'),.25);}
          if(brn[i]>0&&w2H(px,py,Math.floor(t*12),1)<.5)col=w2H(px,py,Math.floor(t*12),2)<.5?U('#ffb02e'):U('#e8501c');
          u[py*W+px]=col;}
        if(elc[i]>0){const k=Math.floor(t*10);let x=gx*CS+((w2H(i,k,1,0)*8)|0),y=gy*CS;for(let s=0;s<6;s++){w2px(u,W,H,x,y+s,U('#fff4a0'));x+=(w2H(i,k,s,2)*3|0)-1;}}
        if(stm[i]>0){const a=Math.min(1,stm[i]/2);for(let k=0;k<3;k++){const cx=gx*CS+2+((w2H(i,k,3,0)*5)|0),cy=gy*CS+6-((t*4+k*3)%8);w2disc(u,W,H,cx,cy,2.2,elc[i]>0?U('#e8f0a0'):U('#e8f2f4'),a*12);}}}
      F.put();
      if(fr%6===0){let a=[0,0,0,0,0];for(let i=0;i<N;i++){if(ice[i]>0)a[0]++;if(stm[i]>0)a[1]++;if(elc[i]>0)a[2]++;if(oil[i]>0)a[3]++;if(brn[i]>0)a[4]++;}
        setHud(root,`ice ${a[0]} · steam ${a[1]} · shock ${a[2]} · oil ${a[3]}`);ro.innerHTML=`${msg} · live field items: ice ${a[0]}, steam ${a[1]}, electrified ${a[2]}, oil ${a[3]}, burning ${a[4]}`;}}};});

// ======================================================================
// G1: Hugo Elias heightfield on an 80x45 lake vs a ring pool on the same lake
// ======================================================================
reg('heightfield',root=>{const cvs=$$('canvas',root),FH=PX(cvs[0]),FR=PX(cvs[1]),GW=FH.W,GH=FH.H,N=GW*GH,c=ctl(root),ro=$('[data-ro]',root);
  const lakeAt=(nx,ny)=>{const dx=(nx-.5)/.45,dy=(ny-.5)/.42;return dx*dx+dy*dy+(vnoise(nx*6,ny*6)-.5)*.5<1;};
  const mask=new Uint8Array(N);for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)mask[y*GW+x]=lakeAt((x+.5)/GW,(y+.5)/GH)?1:0;
  const RW=FR.W,RH=FR.H,rmask=new Uint8Array(RW*RH);for(let y=0;y<RH;y++)for(let x=0;x<RW;x++)rmask[y*RW+x]=lakeAt((x+.5)/RW,(y+.5)/RH)?1:0;
  let h0=new Float32Array(N),h1=new Float32Array(N),acc=0,t=0,fr=0,steps=0,dropT=0,lastMs=0;
  const RM=48,RX=new Float32Array(RM),RY=new Float32Array(RM),RA=new Float32Array(RM);let rh=0;
  const drop=(nx,ny)=>{const x=Math.round(nx*GW),y=Math.round(ny*GH);if(x<1||y<1||x>=GW-1||y>=GH-1||!mask[y*GW+x])return;const i=y*GW+x;h1[i]-=40;for(const k of [i-1,i+1,i-GW,i+GW])if(mask[k])h1[k]-=22;
    RX[rh]=nx*RW;RY[rh]=ny*RH;RA[rh]=.001;rh=(rh+1)%RM;};
  cvs.forEach(cv=>pointer(cv,([x,y],k)=>{if(k==='down')drop(x/cv.width,y/cv.height);}));
  c.seg('hz',()=>{});c.btn('calm',()=>{h0.fill(0);h1.fill(0);RA.fill(0);});
  function step(damp){const s=performance.now();for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){const i=y*GW+x;if(!mask[i]){h0[i]=0;continue;}
      h0[i]=((h1[i-1]+h1[i+1]+h1[i-GW]+h1[i+GW])/2-h0[i])*damp;}
    const tt=h0;h0=h1;h1=tt;steps++;lastMs=performance.now()-s;}
  const PAL=[W2.deep2,W2.mid,W2.mid2,W2.shal,W2.hi];
  return {tick(dt){fr++;t+=dt;const hz=+(c.segv('hz')||15),damp=c.v('damp')/1000;c.out('damp',damp.toFixed(3));
      acc+=dt;let n=0;while(acc>=1/hz&&n<4){acc-=1/hz;step(damp);n++;}if(acc>.3)acc=0;
      if(c.v('auto')&&motion){dropT-=dt;if(dropT<=0){dropT=1.3;let nx,ny,k=0;do{nx=.15+rnd()*.7;ny=.2+rnd()*.6;k++;}while(!lakeAt(nx,ny)&&k<20);drop(nx,ny);}}
      const u=FH.u32;for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x;let col;
        if(!mask[i]){let nw=false;for(const k of [i-1,i+1,i-GW,i+GW])if(k>=0&&k<N&&mask[k])nw=true;col=nw?W2.sand:(hash2(x,y)<.15?W2.grass3:W2.grass);}
        else{const v=h1[i]+((y>0&&y<GH-1)?(h1[i-GW]-h1[i+GW])*.5:0);col=PAL[v>7?4:v>2.5?3:v<-7?0:v<-2.5?1:2];}
        u[i]=col;}
      FH.put();
      const r=FR.u32,speed=.707*hz*(RW/GW);let live=0;
      for(let y=0;y<RH;y++)for(let x=0;x<RW;x++){const i=y*RW+x;if(rmask[i])r[i]=W2.mid;else{let nw=(x>0&&rmask[i-1])||(x<RW-1&&rmask[i+1])||(y>0&&rmask[i-RW])||(y<RH-1&&rmask[i+RW]);r[i]=nw?W2.sand:(hash2(x,y)<.15?W2.grass3:W2.grass);}}
      for(let j=0;j<RM;j++){if(RA[j]<=0)continue;RA[j]+=dt;if(RA[j]>2){RA[j]=0;continue;}live++;const rr=1+RA[j]*speed;w2ell(r,RW,RH,RX[j],RY[j],rr,rr,RA[j]<.8?W2.hi:W2.shal,RA[j]<1?1:2-RA[j],(x,y)=>rmask[y*RW+x]===1);}
      FR.put();
      if(fr%6===0){setHud(root,`${hz} Hz · damping ${damp.toFixed(3)}`);
        ro.innerHTML=`heightfield: 80 × 45 = <b>3,600</b> cells, about 7,200 reads per step × ${hz} Hz = <b>${(7200*hz).toLocaleString('en-US')}</b> reads/s, calm or not (last step ${lastMs<.1?'under 0.1':lastMs.toFixed(2)} ms in this browser) · rings grow 0.707 cells per tick = <b>${(.707*hz*4).toFixed(0)} px/s</b> on 4 px cells · ring pool: <b>${live}</b> live = ${live} draws, zero when calm`;}}};});

// ======================================================================
// G2: wave particles. Cost follows what moves, not how big the sea is
// ======================================================================
reg('waveparticles',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);
  const M=4000,OX=new Float32Array(M),OY=new Float32Array(M),DA=new Float32Array(M),DS=new Float32Array(M),AM=new Float32Array(M),BT=new Float32Array(M);let n=0,t=0,fr=0,splits=0,splitsRate=0,srAcc=0;
  const SPD=16,hist=[];
  const add=(ox,oy,a,d,am,bt)=>{if(n>=M)return false;OX[n]=ox;OY[n]=oy;DA[n]=a;DS[n]=d;AM[n]=am;BT[n]=bt;n++;return true;};
  const ring=(x,y,k,am)=>{for(let i=0;i<k;i++)add(x,y,i/k*Math.PI*2,Math.PI*2/k,am,t);};
  const boats=[0,1,2].map(i=>({ph:i*2.1,x:0,y:0,px:0,py:0,acc:0,a:0}));
  pointer(cv,([x,y],k)=>{if(k==='down')ring(x,y,12,1);});c.seg('src',()=>{});
  // chart: particle count over time on a log scale, against a 320x180 grid
  const LX=v=>112-Math.log10(Math.max(1,v))/5*86;
  const line=svgEl('polyline',{points:'',fill:'none',stroke:'#62d2c4','stroke-width':2},svg);
  for(const v of [1,10,100,1000,10000,100000]){svgEl('line',{x1:40,x2:396,y1:LX(v),y2:LX(v),stroke:'#1e2c36'},svg);if(v===1||v===100||v===10000)svgText(svg,34,LX(v)+4,v>=1000?(v/1000)+'k':String(v),{'text-anchor':'end','font-size':12,fill:'#9fb3ba'});}
  svgEl('line',{x1:40,x2:396,y1:LX(57600),y2:LX(57600),stroke:'#ff8a6a','stroke-width':1.6,'stroke-dasharray':'5 3'},svg);
  svgText(svg,394,LX(57600)-6,'320×180 grid: 57,600 cells per tick',{'text-anchor':'end','font-size':13,fill:'#ff8a6a'});
  const cur=svgText(svg,394,134,'',{'text-anchor':'end','font-size':13,fill:'#62d2c4'});svgText(svg,42,134,'particles alive, last 10 s',{'font-size':13,fill:'#9fb3ba'});
  return {tick(dt){fr++;t+=dt;const ns=+(c.segv('src')||1),S=c.v('sp'),doSplit=c.v('split');c.out('sp',S+' px');
      for(let b=0;b<3;b++){const B=boats[b];B.ph+=dt*.32;B.px=B.x;B.py=B.y;B.x=W/2+Math.sin(B.ph*(1+b*.15))*(W*.36);B.y=H/2+Math.sin(B.ph*1.7+b)*(H*.32);
        if(b<ns&&fr>1){const d=Math.hypot(B.x-B.px,B.y-B.py);B.a=Math.atan2(B.y-B.py,B.x-B.px);B.acc+=d;while(B.acc>=10){B.acc-=10;ring(B.x,B.y,8,.8);}}}
      // advance, damp, split, cull (positions are analytic: origin + direction × speed × age)
      for(let i=0;i<n;i++){AM[i]*=Math.exp(-dt/1.8);const r=(t-BT[i])*SPD,x=OX[i]+Math.cos(DA[i])*r,y=OY[i]+Math.sin(DA[i])*r;
        if(AM[i]<.12||x<-4||y<-4||x>W+4||y>H+4){n--;OX[i]=OX[n];OY[i]=OY[n];DA[i]=DA[n];DS[i]=DS[n];AM[i]=AM[n];BT[i]=BT[n];i--;continue;}
        if(doSplit&&DS[i]*r>S&&n+2<=M){const d=DS[i]/3;add(OX[i],OY[i],DA[i]-d,d,AM[i],BT[i]);add(OX[i],OY[i],DA[i]+d,d,AM[i],BT[i]);DS[i]=d;splits++;}}
      srAcc+=dt;if(srAcc>=1){splitsRate=splits;splits=0;srAcc=0;}
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=(((x*.3+y*2.4-t*2)%23)+23)%23;u[y*W+x]=v<1&&hash2(x>>2,y)<.45?W2.deep2:W2.mid;}
      for(let i=0;i<n;i++){const r=(t-BT[i])*SPD,x=OX[i]+Math.cos(DA[i])*r,y=OY[i]+Math.sin(DA[i])*r,a=AM[i];w2px(u,W,H,x,y,a>.55?W2.foam:a>.3?W2.hi:W2.shal2);}
      for(let b=0;b<ns;b++){const B=boats[b],ca=Math.cos(B.a),sa=Math.sin(B.a);for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++){const lx=x*ca+y*sa,ly=-x*sa+y*ca,e=(lx/5)**2+(ly/2.2)**2;if(e<=1)w2px(u,W,H,B.x+x,B.y+y,e>.55?W2.wood3:W2.wood);}}
      F.put();
      if(fr%3===0){hist.push(n);if(hist.length>200)hist.shift();line.setAttribute('points',hist.map((v,i)=>(40+i*(356/199)).toFixed(1)+','+LX(v).toFixed(1)).join(' '));cur.textContent=n+' now';}
      if(fr%6===0){setHud(root,`${n} particles`);
        ro.innerHTML=`<b>${n}</b> wave particles (pool ${M}) · splits per second <b>${splitsRate}</b> · each stores origin, direction, amplitude, spread angle and birth time; a particle splits in three when its neighbours drift more than ${S} px apart · ${ns?`${ns} moving source${ns>1?'s':''}`:'nothing moving'}: cost ${n?'follows the wakes':'is zero'}, while a 320x180 grid would touch 57,600 cells every tick`;}}};});
