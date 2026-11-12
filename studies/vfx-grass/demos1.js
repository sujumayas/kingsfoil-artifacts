// Grass study: figures 1 (hero, timeline, emerald, zeldacut, tibiadecay, stardew, highgrass, hashvar, cornerset, tuftcover, fieldlayer, flowers, rowshear, cosinewave, gusts)
// Everything sits in one block so helper names stay local to this file.
{
// ----------------------------------------------------------------------
// shared bits for this file
// ----------------------------------------------------------------------
const SCN={};const meadow=(W,H,seed=4,o)=>SCN[W+'x'+H+'s'+seed]||(SCN[W+'x'+H+'s'+seed]=mkMeadow(W,H,seed,o));
const NIGHTP=nightPal(PAL,.9),DUSKP=duskPal(PAL);
const TONE_I=[0,4,5,6,7,8],WHEAT_I=[0,11,13,14,15,16];
const tonesOf=(pal,I=TONE_I)=>Uint32Array.from(I,i=>pal[i]);
const GUST=mkTable(128,21,3,3),FLUT=mkTable(64,22,8,2);
const put=(u,W,H,x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=c;};
const rect=(u,W,H,x,y,w,h,c)=>{for(let j=Math.max(0,y);j<Math.min(H,y+h);j++)for(let i=Math.max(0,x);i<Math.min(W,x+w);i++)u[j*W+i]=c;};
// a bigger 12x24 walker for the zoomed figures (A1, A4, B3); letters map to BIG_PAL
const BIGW=["....hhhh....","...hhhhhh...","..hhHHHHhh..","..hHHHHHHh..","..hssssssh..","..ssesseshh.","..ssssssss..","...ssmmss...","....ssss....","..cccccccc..",".ccCccccCcc.",".cccccccccc.","sccccccccccs","s.cccccccc.s","s.cccccccc.s","..cccyyccc..","..pppppppp..","..pppppppp..","..ppp..ppp..","..ppp..ppp..","..ppp..ppp..","..ppp..ppp..","..bbb..bbb..",".bbbb..bbbb."];
const BIGL=[["..ppp..ppp..","..ppp..ppp..","..ppp..ppp..","..ppp..ppp..","..bbb..bbb..",".bbbb..bbbb."],["..ppp..ppp..","..ppp...ppp.","..ppp...ppp.","..bbb...ppp.",".bbbb...bbb.","........bbbb"],["..ppp..ppp..",".ppp...ppp..",".ppp...ppp..",".ppp...bbb..",".bbb...bbbb.","bbbb........"]];
const BIG_PAL={h:U('#3e2a1c'),H:U('#5e3f28'),s:U('#e8b88a'),e:U('#1a1210'),m:U('#b0705a'),c:U('#c0503a'),C:U('#8e3428'),y:U('#c9a050'),p:U('#3a4a6a'),b:U('#2a201a')};
// draw BIGW with feet at (x,y); frame 0..2; hide = rows from the feet up not drawn; returns nothing
function drawBig(u,W,H,x,y,frame=0,hide=0){const rows=BIGW.slice(0,18).concat(BIGL[frame]),n=rows.length,x0=Math.round(x)-6,y0=Math.round(y)-n+1;
  for(let j=0;j<n-hide;j++){const r=rows[j],yy=y0+j;if(yy<0||yy>=H)continue;for(let i=0;i<12;i++){const ch=r[i];if(ch==='.')continue;const xx=x0+i;if(xx>=0&&xx<W)u[yy*W+xx]=BIG_PAL[ch];}}}
// butterfly: 3x2 px, open or closed wings
function drawFly(u,W,H,x,y,col,open){x=Math.round(x);y=Math.round(y);const body=PAL[0];
  if(open){put(u,W,H,x-1,y,col);put(u,W,H,x+1,y,col);put(u,W,H,x-1,y+1,mix32(col,body,.35));put(u,W,H,x+1,y+1,mix32(col,body,.35));put(u,W,H,x,y,body);put(u,W,H,x,y+1,body);}
  else{put(u,W,H,x,y-1,col);put(u,W,H,x,y,col);put(u,W,H,x,y+1,body);}}
// world-locked dithered blend toward colour c by a (0..1) using 4 flat steps
const dmix=(base,c,a,x,y)=>{const l=a*4,s=Math.floor(l);const k=Math.min(4,s+((l-s)*16>bay(x,y)+.5?1:0));return k?mix32(base,c,k/4*.85):base;};

// ======================================================================
// HERO: a live meadow. Whole-pixel row shear from one wind + a downwind
// wave + a scrolling gust table (C1-C4), an 80x45 trail map (D2, D3),
// y-sort cover for the walker (A1, B3), flap-hop butterflies (F1) and
// pulse-coupled fireflies at dusk (G1). Timed live with performance.now().
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=320,H=180,tiers=$$('.hero-tiers button',root);
  const S=meadow(W,H,4),GW=80,GH=45,TM=new Float32Array(GW*GH),WM=new Float32Array(GW*GH);
  const SET=[{wind:.3,gust:.55,flut:.3,spd:12,dusk:0,gs:14},{wind:.8,gust:1.5,flut:.4,spd:12,dusk:0,gs:34},{wind:.2,gust:.35,flut:.2,spd:20,dusk:0,gs:10},{wind:.16,gust:.3,flut:.15,spd:10,dusk:1,gs:9}];
  const P=Object.assign({},SET[0]);let tier=0,t=0,hud=0,dusk=0,fr=0;const m=meter(.05);
  const LV=8,BASE=[],TON=[],WHE=[],PL=[];
  const palAt=k=>{if(!PL[k]){const a=k/(LV-1);PL[k]=Uint32Array.from(PAL,(c,i)=>EMIT[i]?c:mix32(mix32(c,DUSKP[i],Math.min(1,a*1.6)),NIGHTP[i],Math.max(0,a*.95-.35)));}return PL[k];};
  const baseAt=k=>{if(!BASE[k]){const p=palAt(k),b=new Uint32Array(W*H);for(let i=0;i<b.length;i++)b[i]=p[S.idx[i]];BASE[k]=b;TON[k]=tonesOf(p);WHE[k]=tonesOf(p,WHEAT_I);}return BASE[k];};
  const glints=[];for(let i=0;i<S.idx.length;i++)if(S.idx[i]===3||S.idx[i]===2&&hash2(i,7)<.05)glints.push(i);
  const walker=mkWalker([[24,150],[70,126],[118,150],[160,128],[196,152],[232,118],[200,96],[150,104]],P.spd);
  // butterflies: ground position (x,y), height h, flap-hop on a timer, a flower as goal, rest on landing
  const FC=[PAL[31],PAL[17],PAL[32],PAL[18]];
  const flies=[];for(let k=0;k<7;k++){const f=S.flowers[(k*37)%S.flowers.length];flies.push({x:f.x+10,y:f.y,h:8,vx:0,vh:0,ft:k*.07,goal:(k*53)%S.flowers.length,rest:0,col:FC[k%4],open:true});}
  // fireflies: phase 0..1 over a 5 s period, flash envelope, pulse coupling inside 48 px
  const NF=64,ff=[];for(let k=0;k<NF;k++)ff.push({x:20+hash2(k,1)*280,y:30+hash2(k,2)*140,h:4+hash2(k,3)*10,ph:hash2(k,4),fl:0,a:hash2(k,5)*6.28});
  function setTier(k){tier=k;Object.assign(P,SET[k]);tiers.forEach((b,i)=>b.classList.toggle('on',i===k));}
  tiers.forEach((b,i)=>b.addEventListener('click',()=>setTier(i)));setTier(0);
  return {tick(dt){m.t0();t+=dt;fr++;dusk+=(P.dusk-dusk)*Math.min(1,dt*1.2);const lv=Math.round(dusk*(LV-1)),base=baseAt(lv),TO=TON[lv],WH=WHE[lv],pal=palAt(lv);
    u.set(base);
    // pond glints, stepped at 4 fps
    const gs=Math.floor(t*4);for(const i of glints)u[i]=hashI(i,gs,0,1)%7===0?pal[3]:pal[2];
    // trail map: decay before stamp, no stamp while standing (D2); wear builds much slower (D5)
    walker.step(dt*P.spd/12);const wx=walker.x,wy=walker.y;
    for(let i=0;i<TM.length;i++){const v=TM[i];if(v>0)TM[i]=v>dt*85?v-dt*85:0;if(WM[i]>0)WM[i]-=dt*.004;}
    {const cx=wx/4,cy=wy/4;for(let gy=Math.floor(cy-2);gy<=cy+2;gy++)for(let gx=Math.floor(cx-2);gx<=cx+2;gx++){if(gx<0||gy<0||gx>=GW||gy>=GH)continue;const d=Math.hypot(gx+.5-cx,gy+.5-cy);if(d<1.8){const i=gy*GW+gx;TM[i]=255;WM[i]=Math.min(1,WM[i]+dt*(tier===2?.5:.12));}}}
    // worn ground: dithered toward dirt where wear is high
    const dirt=pal[11],dirt2=pal[10];
    for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const w=WM[gy*GW+gx];if(w<.08)continue;for(let y=gy*4;y<gy*4+4;y++)for(let x=gx*4;x<gx*4+4;x++){const i=y*W+x,id=S.idx[i];if(id<4||id>9)continue;if(w*16>bay(x,y)+.5)u[i]=w>.6&&(x+y)&1?dirt2:dirt;}}
    // flowers close at dusk (B5)
    const open=1-dusk;for(const f of S.flowers)drawFlower(u,W,H,f.x,f.y,pal[f.c],open,pal[5]);
    // lamp post by the path
    {const L=S.lamp;for(let k=0;k<9;k++)put(u,W,H,L.x,L.y-k,pal[0]);put(u,W,H,L.x-1,L.y-9,pal[0]);put(u,W,H,L.x+1,L.y-9,pal[0]);put(u,W,H,L.x,L.y-10,pal[0]);put(u,W,H,L.x,L.y-9,dusk>.4?PAL[28]:pal[23]);}
    // tufts and walker, y-sorted (B3); shear in whole pixels with the root fixed (C1)
    const wv=P.wind,gsp=P.gs;let drawnW=false;const onGrass=S.idx[Math.round(wy)*W+Math.round(wx)]>=4&&S.idx[Math.round(wy)*W+Math.round(wx)]<=9;
    const drawW=()=>{const c={dir:walker.dir,moving:true,anim:walker.anim};drawChar(u,W,H,c,wx,wy,onGrass?3:0,CHAR_PAL,dusk>.3?(q=>mix32(q,NIGHTP[0],dusk*.35)):null);
      if(onGrass)for(let dx=-4;dx<=4;dx++)for(let j=0;j<3;j++){if(hash2(dx+Math.round(wx)*3,j)<.45-j*.1){put(u,W,H,wx+dx,wy-j,TO[2+((dx+j)&1)+(j===2?1:0)]);}}drawnW=true;};
    for(const q of S.tufts){if(!drawnW&&q.y>wy)drawW();
      const g=tabBil(GUST,128,(q.x-t*gsp)/6,q.y/6),f=tabBil(FLUT,64,(q.x-t*50)/2,(q.y+t*8)/2),wave=Math.cos(q.x*.045-t*2.1);
      let lean=wv*.9+(g-.42)*P.gust*2.4+(f-.5)*P.flut*1.4+wave*.3*wv;const sh=clamp(lean*q.st*1.5,-2,2);
      const tm=TM[(q.y>>2)*GW+(q.x>>2)]/255;let cr=0,ln=0;if(tm>.02){cr=tm*.8;ln=(q.x<wx?-1:1)*tm*1.6;}
      drawTuft(u,W,H,TUFT[q.k],q.x,q.y,sh,q.k==='wheat'?WH:TO,q.fl,cr,ln);}
    if(!drawnW)drawW();
    // butterflies by day: flap-hop toward a flower goal, rest on landing (F1)
    const fa=1-smooth(.2,.6,dusk);let nb=0;
    if(fa>.05)for(const b of flies){const g=S.flowers[b.goal],dx=g.x-b.x,dy=g.y-3-b.y,d=Math.hypot(dx,dy);
      if(b.rest>0){b.rest-=dt;b.open=((t*1.5)|0)%3===0;if(b.rest<=0){b.goal=(b.goal*7+13+((t*10)|0))%S.flowers.length;b.vh=60;}}
      else{b.ft-=dt;if(b.ft<=0){b.ft=.18+hash2(b.goal,(t*9)|0)*.12;b.vh+=d<6?20:45+hash2(b.goal,fr)*40;b.open=true;}else if(b.ft<.1)b.open=false;
        b.vh-=120*dt;b.h=Math.max(0,b.h+b.vh*dt);if(b.h===0)b.vh=Math.max(0,b.vh);const sp=d<4?6:16;b.x+=dx/(d+.01)*sp*dt;b.y+=dy/(d+.01)*sp*dt;if(d<2&&b.h<3){b.rest=1+hash2(b.goal,3)*2.5;b.h=0;}}
      if(fa<1&&hash2(b.goal,fr)>fa)continue;put(u,W,H,b.x,b.y+2,mix32(u[clamp(Math.round(b.y+2),0,H-1)*W+clamp(Math.round(b.x),0,W-1)],0xff000000,.4));drawFly(u,W,H,b.x,b.y-b.h,b.col,b.open);nb++;}
    // fireflies at dusk: 5 s clocks, a flash nudges neighbours within 48 px by 0.035 (G1)
    let nf=0;if(dusk>.45){const vis=smooth(.45,.85,dusk);for(const q of ff){q.ph+=dt/5;q.a+=dt*(hash2(q.x|0,q.y|0)-.5);q.x+=Math.cos(q.a)*dt*3;q.y+=Math.sin(q.a)*dt*2;q.x=clamp(q.x,4,W-4);q.y=clamp(q.y,20,H-4);}
      for(const q of ff)if(q.ph>=1){q.ph-=1;q.fl=1;for(const o of ff){if(o===q||o.ph>=1)continue;const dd=Math.hypot(o.x-q.x,o.y-q.y);if(dd<48)o.ph=Math.min(.999,o.ph+.035);}}
      for(const q of ff){if(q.fl>0)q.fl=Math.max(0,q.fl-dt/.6);const b=q.fl>0?Math.sin(q.fl*Math.PI)*vis:0;if(b<.05)continue;nf++;const x=Math.round(q.x),y=Math.round(q.y-q.h);
        for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const d=Math.abs(i)+Math.abs(j);if(d===0||d>3)continue;const xx=x+i,yy=y+j;if(xx<0||yy<0||xx>=W||yy>=H)continue;const k=yy*W+xx;u[k]=dmix(u[k],PAL[27],b*(d===1?.75:d===2?.4:.18),xx,yy);}
        put(u,W,H,x,y,b>.5?PAL[26]:PAL[27]);}
      const L=S.lamp;for(let j=-14;j<=14;j++)for(let i=-18;i<=18;i++){const d=Math.hypot(i,j*1.3)/18;if(d>=1)continue;const xx=L.x+i,yy=L.y-9+j;if(xx<0||yy<0||xx>=W||yy>=H)continue;const k=yy*W+xx;u[k]=dmix(u[k],PAL[28],(1-d)*(1-d)*.7*vis,xx,yy);}}
    F.put();const ms=m.t1();
    if(++hud%12===0)setHud(root,`JS ${fms(ms)} ms · ${S.tufts.length} tufts · ${nb} butterflies · ${nf} fireflies lit`);}};});

// ======================================================================
// §3 timeline: four generations, clickable dots, filter by generation
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#9ea58f','#e8c45a','#9cc069','#d9a3c4'];
  const X=y=>y<1990?(y-1962)/28*22:y<2021?24+(y-1990)/31*46:72+(y-2021)/6*27;
  let h='<div class="tl-axis">';for(const y of [1966,1990,2005])h+=`<span style="left:${X(y)}%">${y}</span>`;h+=`<span style="left:${X(2023.5)}%">2024</span><i class="tl-brk" style="left:70.9%"></i><i class="tl-brk" style="left:22.9%"></i></div>`;
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
  const pick=items.find(i=>/Emerald/.test(i.e.h))||items[0];show(pick.id);return {};});

// ======================================================================
// A1 Pokémon tall grass: Crystal's priority bit, Emerald's rustle
// (frames 1-4 then rest, 10 ticks each, 50 ticks at 59.73 fps) and long
// grass sinking from the second step. Step through it, toggle cover.
// ======================================================================
// blades of a 16x16 grass tile: x, height, shade offset. part 0..4 opens them outward from the middle
const BLADES=[[1,9,0],[2,12,1],[4,8,0],[5,13,1],[6,10,0],[8,12,1],[9,9,0],[10,13,1],[12,10,0],[13,12,1],[14,8,0],[3,6,1],[7,7,0],[11,6,1]];
function grassTile(u,W,H,x0,y0,part=0,tall=1,pal=TONES,bg=true){const yb=y0+15;
  if(bg)for(let j=0;j<16;j++)for(let i=0;i<16;i++){const x=x0+i,y=y0+j;if(x<0||y<0||x>=W||y>=H)continue;u[y*W+x]=((i*7+j*3)%11===0)?pal[3]:pal[2];}
  for(const [bx,bh0,s] of BLADES){const bh=Math.round(bh0*tall),dir=bx<8?-1:1,amt=part*(.45+.55*Math.abs(bx-7.5)/7.5);
    for(let r=0;r<bh;r++){const fr=r/(bh-1),off=Math.round(dir*amt*fr*fr),y=yb-r,x=x0+bx+off;if(y<0||y>=H||x<0||x>=W)continue;
      const tone=fr<.25?1:fr<.5?2+s:fr<.8?3+s:4+s;u[y*W+x]=pal[Math.min(5,tone)];}}}
reg('emerald',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),u=F.u32,W=128,H=56,c=ctl(root),ro=$('[data-ro]',root),strip=$$('.frames canvas',root).map(PX);
  const TX0=2,NT=6,ROWY=30;let mode='tall',x=8,target=8,steps=0,inGrass=0,pause=.5,acc=0;const rus=[];
  const SEQ={tall:[[1,10],[2,10],[3,10],[4,10],[0,10]],long:[[1,4],[2,4],[3,3],[0,3],[3,3],[0,3],[3,3],[0,3]]};
  const total=k=>SEQ[k].reduce((a,b)=>a+b[1],0);
  const frameAt=(k,tk)=>{let s=0;for(const [f,n] of SEQ[k]){if(tk<s+n)return f;s+=n;}return 0;};
  const tileOf=px=>Math.floor(px/16);
  c.seg('mode',v=>{mode=v;rus.length=0;});
  c.btn('step',()=>{if(x===target)target=x+16;c.el('auto').checked=false;});
  c.btn('reset',()=>{x=target=8;steps=0;inGrass=0;rus.length=0;});
  // frame strip: frames 0..4 of the tall-grass rustle, drawn once per mode
  const drawStrip=()=>strip.forEach((P,k)=>{P.u32.fill(PAL[0]);grassTile(P.u32,16,16,0,0,k,mode==='long'?1.25:1);P.put();});
  return {tick(dt){const slow=c.v('slow')?.25:1,auto=c.v('auto'),cover=c.v('cover');
    acc+=dt*59.73*slow;let ticks=Math.floor(acc);acc-=ticks;
    while(ticks-->0){
      if(x!==target){x+=1;if(x===target){const t=tileOf(x);if(t>=TX0&&t<TX0+NT){inGrass++;steps++;rus.push({t,tk:0});}else inGrass=0;}}
      else if(auto){pause-=1/59.73;if(pause<=0){pause=.35;target=x+16;if(tileOf(target)>=TX0+NT+1){x=target=8;inGrass=0;rus.length=0;}}}
      for(const r of rus)r.tk++;}
    for(let i=rus.length-1;i>=0;i--)if(rus[i].tk>total(mode)+40&&rus[i].t!==tileOf(x))rus.splice(i,1);
    // ground: dirt path left and right, grass tiles in the middle
    for(let y=0;y<H;y++)for(let i=0;i<W;i++){const h=hash2(i>>1,y>>1),r=hash2(i,y);u[y*W+i]=h>.82&&r<.5?PAL[7]:r<.04?PAL[5]:PAL[6];}
    rect(u,W,H,0,ROWY-11,W,17,PAL[11]);for(let i=0;i<W;i++){put(u,W,H,i,ROWY-12,PAL[10]);put(u,W,H,i,ROWY+6,PAL[5]);if(hash2(i,9)<.3)put(u,W,H,i,ROWY-11+((i*5)%15),PAL[12]);}
    const tl=mode==='long'?1.25:1;
    const partOf=t=>{const r=[...rus].reverse().find(q=>q.t===t);if(!r)return 0;return frameAt(mode,Math.min(r.tk,total(mode)-1));};
    for(let t=TX0;t<TX0+NT;t++)grassTile(u,W,H,t*16,ROWY-10,partOf(t),tl);
    // walker: feet at the tile's lower edge; frame from the step phase
    const wt=tileOf(x),on=wt>=TX0&&wt<TX0+NT,fr=x===target?0:(((x>>3)&1)?1:2),fy=ROWY+4;
    const sink=mode==='long'&&cover&&on&&inGrass>=2;drawBig(u,W,H,x,fy,fr,sink?12:0);
    if(cover&&on&&mode==='tall')grassTile(u,W,H,wt*16,ROWY-10,partOf(wt),tl,TONES,false);
    F.put();
    const cur=rus.length?rus[rus.length-1]:null,tk=cur?Math.min(cur.tk,total(mode)):0,f=cur?frameAt(mode,Math.min(cur.tk,total(mode)-1)):0;
    strip.forEach((P,k)=>P.cv.classList.toggle('on',cur&&cur.tk<total(mode)&&k===f));
    if(!strip.drawn||strip.mode!==mode){drawStrip();strip.drawn=1;strip.mode=mode;}
    ro.innerHTML=cur?`${mode==='tall'?'Tall grass':'Long grass'} rustle: frame <b>${f}</b> · tick <b>${tk}</b> of ${total(mode)} · ${(tk/59.73).toFixed(2)} s of ${(total(mode)/59.73).toFixed(2)} s · step ${inGrass} in the grass`+(mode==='long'?(sink?' · bottom half hidden by priority 3 (Emerald: the lower 16 of 32 px)':inGrass===1?' · first step: still drawn whole':''):cover&&on?' · grass pixels over the walker (OAM priority bit)':''):'Walk into the grass to start a rustle.';}};});

// ======================================================================
// A2 Zelda cut grass: a tile swap, a 4-piece puff over 4 steps and drops
// behind two 50% rolls, a rotating counter and a 4-sprite cap
// ======================================================================
const RUPEE=sprite(["..3..",".343.","34543","34543",".343.","..3.."]),HEART=sprite([".3.3.","35353","34443",".343.","..3.."]);
const RUPEE_P=Uint32Array.from(['#000000','#000000','#000000','#1f6a2c','#4fbf5a','#c8f0b0'],U),HEART_P=Uint32Array.from(['#000000','#000000','#000000','#8a1f2a','#d8483a','#ffb0a0'],U);
function thickTile(u,W,H,x0,y0,pal=TONES){for(let j=0;j<16;j++)for(let i=0;i<16;i++){const x=x0+i,y=y0+j;if(x<0||y<0||x>=W||y>=H)continue;u[y*W+x]=j>13?pal[1]:((i*5+j*3)%9===0?pal[3]:pal[2]);}
  for(const [dx,dy,f] of [[3,6,0],[8,5,1],[13,6,0],[5,10,1],[11,10,0],[3,15,0],[8,14,1],[13,15,1]])drawTuft(u,W,H,TUFT.short,x0+dx,y0+dy,0,pal,!!f);}
function cutTile(u,W,H,x0,y0){for(let j=0;j<16;j++)for(let i=0;i<16;i++){const x=x0+i,y=y0+j;if(x<0||y<0||x>=W||y>=H)continue;const r=hash2(x,y);u[y*W+x]=r<.06?PAL[11]:r<.1?PAL[8]:PAL[7];}
  for(let k=0;k<7;k++){const bx=x0+2+((k*7)%12),by=y0+3+((k*5)%11);put(u,W,H,bx,by,PAL[6]);put(u,W,H,bx+1,by,PAL[9]);}}
reg('zeldacut',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=128,H=80,c=ctl(root),ro=$('[data-ro]',root),slots=$$('.steps span',root);
  const GW=8,GH=5,T=new Uint8Array(GW*GH).fill(1),poofs=[],drops=[];
  const TABLE=['rupee','none','heart','rupee','none','rupee','heart','none'];let ctr=0,cuts=0,got=0,last='',t=0,autoT=.6,ax=0,ay=0;
  const regrow=()=>{T.fill(1);};
  function cut(gx,gy){const i=gy*GW+gx;if(!T[i])return;T[i]=0;cuts++;poofs.push({x:gx*16,y:gy*16,a:0});
    if(rnd()<.5){last='roll 1 (<code>GetRandomNumber() &amp; 1</code>) exits: no drop';return;}
    if(c.v('cap')&&drops.length>=4){last='4 or more sprites active: no drop';return;}
    const k=(ctr++)&7,it=TABLE[k];slots.forEach((s,j)=>s.classList.toggle('on',j===k));
    if(rnd()<.5){last=`counter slot ${k} picked, then roll 2 (<code>&amp; 8</code>) exits: no drop`;return;}
    if(it==='none'){last=`both rolls passed, slot ${k} is empty`;return;}
    got++;drops.push({x:gx*16+8,y:gy*16+11,t:0,it});last=`both rolls passed, slot ${k}: a ${it} drops`;}
  pointer(cv,([x,y],k)=>{if(k==='down')cut(clamp(x/16|0,0,GW-1),clamp(y/16|0,0,GH-1));});
  c.btn('mow',()=>{for(let gx=0;gx<GW;gx++)cut(gx,2);});c.btn('regrow',()=>{regrow();cuts=got=0;drops.length=0;last='';});
  return {tick(dt){t+=dt;
    if(c.v('auto')){autoT-=dt;if(autoT<=0){autoT=.45;let tries=0;do{ax=(ax+3)%GW;ay=(ay+(ax<3?2:0))%GH;tries++;}while(!T[ay*GW+ax]&&tries<40);if(tries>=40){regrow();}else cut(ax,ay);}}
    for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){if(T[gy*GW+gx])thickTile(u,W,H,gx*16,gy*16);else cutTile(u,W,H,gx*16,gy*16);}
    // puff: 4 pieces at the corners of a 16x16 box, 4 steps, spreading 2 px on the last
    for(let i=poofs.length-1;i>=0;i--){const p=poofs[i];p.a+=dt;const st=Math.floor(p.a/.06);if(st>3){poofs.splice(i,1);continue;}const sp=st===3?2:st===2?1:0;
      for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const cx=p.x+8+dx*(3+sp),cy=p.y+8+dy*(3+sp);for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++){if(Math.abs(j)+Math.abs(k)>1&&st<2)continue;put(u,W,H,cx+k,cy+j,(j+k)&1?PAL[8]:PAL[9]);}}}
    for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.t+=dt;if(d.t>5){drops.splice(i,1);continue;}const bob=d.t<.4?Math.round(-Math.sin(d.t/.4*Math.PI)*5):0;
      if(d.t>4&&((d.t*10)|0)%2)continue;put(u,W,H,d.x-1,d.y+1,PAL[4]);put(u,W,H,d.x,d.y+1,PAL[4]);put(u,W,H,d.x+1,d.y+1,PAL[4]);blit(u,W,H,d.it==='rupee'?RUPEE:HEART,d.x,d.y+bob,d.it==='rupee'?RUPEE_P:HEART_P);}
    F.put();
    ro.innerHTML=`${cuts} cuts · ${got} drops (<b>${cuts?Math.round(got/cuts*100):0}%</b>, at most about 25%) · ${drops.length} drop sprites active`+(last?`<br>Last cut: ${last}`:'');}};});

// ======================================================================
// A3 Tibia and TFS: grass as items with decay timers. Machete: 2782 ->
// 2781, back after 300 s. Wheat: 2737 -> 2738 -> 2739, 240 s each.
// ======================================================================
reg('tibiadecay',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=112,H=34,c=ctl(root),ro=$('[data-ro]',root);
  const NEXT={2781:[2782,300],2737:[2738,240],2738:[2739,240]};
  const tiles=[{id:2782,left:0},{id:2781,left:180},{id:2782,left:0},{id:2739,left:0},{id:2738,left:100},{id:2737,left:30}];
  let bytes=0,bunches=0,clock=0,acc=0,changes=0,flash=[0,0,0,0,0,0],autoT=4;
  const setId=(k,id)=>{tiles[k].id=id;tiles[k].left=NEXT[id]?NEXT[id][1]:0;bytes+=9;changes++;flash[k]=.4;};
  function use(k){const q=tiles[k];if(q.id===2782)setId(k,2781);else if(q.id===2739){setId(k,2737);bunches++;}}
  pointer(cv,([x],e)=>{if(e==='down'){const k=Math.floor((x-4)/18);if(k>=0&&k<6)use(k);}});
  const DARK=Uint32Array.from([0,PAL[4],PAL[4],PAL[5],PAL[6],PAL[7]]),GREENW=tonesOf(PAL);
  return {tick(dt){const sp=+c.segv('sp');acc+=dt*sp;
    // the server sweep touches every decaying item once per (game) second
    while(acc>=1){acc-=1;clock++;for(let k=0;k<6;k++){const q=tiles[k];if(NEXT[q.id]){q.left--;if(q.left<=0)setId(k,NEXT[q.id][0]);}}}
    if(c.v('auto')){autoT-=dt;if(autoT<=0){autoT=2.2;const rd=tiles.map((q,k)=>q.id===2782||q.id===2739?k:-1).filter(k=>k>=0);if(rd.length)use(rd[(clock*7)%rd.length]);}}
    u.fill(PAL[0]);
    for(let k=0;k<6;k++){const q=tiles[k],x0=4+k*18,y0=5,isW=k>=3;
      for(let j=0;j<16;j++)for(let i=0;i<16;i++){const r=hash2(x0+i,j);u[(y0+j)*W+x0+i]=isW?(j%4===3?PAL[10]:r<.3?PAL[12]:PAL[11]):(r<.2?PAL[5]:PAL[6]);}
      if(q.id===2782){for(const [dx,dy,f] of [[4,9,0],[11,10,1],[7,16,1],[3,16,0],[12,16,0]])drawTuft(u,W,H,TUFT.tall,x0+dx,y0+dy-1,0,DARK,!!f);}
      else if(q.id===2781){for(let m=0;m<12;m++){const bx=x0+1+(m*7)%14,by=y0+4+(m*5)%11;put(u,W,H,bx,by,PAL[5]);put(u,W,H,bx,by-1,PAL[9]);if(m%3===0){put(u,W,H,bx+2,by+1,PAL[8]);put(u,W,H,bx+3,by+1,PAL[7]);}}}
      else if(q.id===2739){for(const [dx,dy] of [[3,8],[8,7],[13,8],[5,15],[11,15]])drawTuft(u,W,H,TUFT.wheat,x0+dx,y0+dy,0,WHEAT);}
      else if(q.id===2738){for(const [dx,dy] of [[3,10],[8,9],[13,10],[5,15],[11,15]])drawTuft(u,W,H,TUFT.mid,x0+dx,y0+dy,0,GREENW);}
      else if(q.id===2737){for(let r=0;r<4;r++)for(let m=0;m<5;m++){const bx=x0+1+m*3+(r&1),by=y0+2+r*4;put(u,W,H,bx,by,PAL[14]);put(u,W,H,bx,by-1,PAL[15]);}}
      if(flash[k]>0){flash[k]-=dt;for(let i=0;i<16;i++){put(u,W,H,x0+i,y0-1,PAL[16]);put(u,W,H,x0+i,y0+16,PAL[16]);}}
      digits(u,W,H,x0,y0+19,q.id,flash[k]>0?PAL[16]:PAL[22]);
      if(NEXT[q.id]){const f=1-q.left/NEXT[q.id][1];for(let i=0;i<16;i++)put(u,W,H,x0+i,y0+25,i<f*16?PAL[18]:PAL[22]);}}
    F.put();
    const dl=tiles.map((q,k)=>NEXT[q.id]?`tile ${k+1}: ${q.id} → ${NEXT[q.id][0]} in ${q.left} s`:null).filter(Boolean);
    ro.innerHTML=`Game clock ${Math.floor(clock/60)}:${String(clock%60).padStart(2,'0')} (×${sp}) · decay list: <b>${dl.length}</b> entries, each touched once per second · untouched grass: 0 entries<br>${dl.join(' · ')||'nothing decaying'}<br>${changes} item changes sent, about <b>${bytes} bytes</b> at 9 bytes each (estimate) · ${bunches} bunches of wheat harvested`;}};});

// ======================================================================
// A4 Stardew tufts: four per tile with a seeded offset and flip, still
// until touched. Shake: max π/8, rate π/80, decay π/350 per tick, then
// halve each tick, sleep below 0.01 rad. Smooth rotation vs 3 lean frames.
// ======================================================================
reg('stardew',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=96,H=52,ro=$('[data-ro]',root),c=ctl(root);
  const tufts=[];for(let ty=0;ty<3;ty++)for(let tx=0;tx<6;tx++){const s=hashI(tx,ty,0,9);
    for(let k=0;k<4;k++){const h=hashI(tx,ty,k,17),ox=(h%5)-2,oy=((h>>4)%5)-2;tufts.push({x:tx*16+4+(k&1)*8+ox,y:ty*16+10+(k>>1)*7+oy,fl:!!((s>>k)&1),r:((h>>8)&255)/256,rot:0,max:0,dir:1,t0:0,awake:false});}}
  tufts.sort((a,b)=>a.y-b.y);
  const walker={x:-8,y:30,dir:'right',moving:true,anim:0};let vx=22,t=0,acc=0,lastSettle=0,peak=0;
  const MAX=Math.PI/8,RATE=Math.PI/80,DEC=Math.PI/350;
  const groundA=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const r=hash2(x,y);groundA[y*W+x]=r<.04?PAL[8]:r<.1?PAL[6]:PAL[7];}
  function shake(q,side){if(q.max>0)return;q.max=MAX;q.dir=side;q.awake=true;q.t0=t;}
  function tickShake(q){if(!q.awake)return;if(q.max>0){q.rot+=q.dir*RATE;if(Math.abs(q.rot)>=q.max){q.rot=Math.sign(q.rot)*q.max;q.dir=-q.dir;}q.max-=DEC;}else{q.rot/=2;if(Math.abs(q.rot)<.01){q.rot=0;q.awake=false;lastSettle=t-q.t0;}}}
  // native-resolution rotation around the root, nearest sampling: the mixel weak point
  function rotTuft(u,s,x,y,th,fl){const cs=Math.cos(th),sn=Math.sin(th),px=Math.round(x),py=Math.round(y),R=13;
    for(let dy=-R;dy<=1;dy++)for(let dx=-R;dx<=R;dx++){const sx=Math.round(cs*dx+sn*dy),sy=Math.round(-sn*dx+cs*dy);const ix=sx+(s.w-1)/2,iy=sy+s.h-1;if(ix<0||iy<0||ix>=s.w||iy>=s.h)continue;
      const tt=s.a[Math.round(iy)*s.w+(fl?s.w-1-Math.round(ix):Math.round(ix))];if(!tt)continue;const X=px+dx,Y=py+dy;if(X>=0&&Y>=0&&X<W&&Y<H)u[Y*W+X]=TONES[tt];}}
  return {tick(dt){t+=dt;walker.x+=vx*dt;walker.anim+=dt*8;if(walker.x>W+10){vx=-22;walker.dir='left';walker.y=hash2(t|0,1)<.5?22:38;}if(walker.x<-10){vx=22;walker.dir='right';walker.y=hash2(t|0,2)<.5?30:44;}
    for(const q of tufts){if(Math.abs(q.x-walker.x)<4&&Math.abs(q.y-walker.y)<4)shake(q,walker.x<q.x?1:-1);}
    acc+=dt*60;let n=0;while(acc>=1){acc-=1;for(const q of tufts)tickShake(q);}
    let awake=0;for(const q of tufts){if(q.awake)awake++;peak=Math.max(peak,Math.abs(q.rot/(1+q.r)));}
    A.u32.set(groundA);B.u32.set(groundA);let drawn=false;
    const drawW=()=>{drawChar(A.u32,W,H,walker,walker.x,walker.y,0);drawChar(B.u32,W,H,walker,walker.x,walker.y,0);drawn=true;};
    for(const q of tufts){if(!drawn&&q.y>walker.y)drawW();const th=q.rot/(1+q.r);
      if(Math.abs(th)<.005)drawTuft(A.u32,W,H,TUFT.mid,q.x,q.y,0,TONES,q.fl);else rotTuft(A.u32,TUFT.mid,q.x,q.y,th,q.fl);
      const lean=th>.1?1:th<-.1?-1:0;drawTuft(B.u32,W,H,TUFT.mid,q.x,q.y,lean,TONES,q.fl);}
    if(!drawn)drawW();A.put();B.put();
    ro.innerHTML=`Awake: <b>${awake}</b> of ${tufts.length} tufts update this frame; the rest sleep and cost nothing · last tuft settled in <b>${lastSettle?lastSettle.toFixed(2):'–'} s</b> (about 44 ticks, 0.73 s at 60 ticks/s) · peak bend ${(MAX*180/Math.PI).toFixed(1)}°, each tuft divides it by 1 + r`;}};});

// ======================================================================
// A5 roguelike high grass: LOS_BLOCKING like a wall; stepping in
// tramples it to short grass, bursts 4 leaves and recomputes the FOV
// (only when that cell was in view). Brogue regrows 1% per turn.
// ======================================================================
reg('highgrass',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=160,H=96,c=ctl(root),ro=$('[data-ro]',root),CS=8,GW=20,GH=12;
  const G=new Uint8Array(GW*GH),SEEN=new Uint8Array(GW*GH),VIS=new Uint8Array(GW*GH);
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x;if(x===0||y===0||x===GW-1||y===GH-1)G[i]=1;else if(((x===6||x===13)&&(y===3||y===8))||(x===9&&y===5))G[i]=1;else G[i]=vnoise(x/3.2+4,y/3.2+1)>.52?2:0;}
  const hero={x:3,y:6},foe={x:15,y:5,cd:0},pool=mkPool(32);let turn=0,recomp=0,trampled=0,path=[],stepT=0,lastF=-1;
  const blocks=i=>G[i]===1||G[i]===2;
  function fov(){VIS.fill(0);const R=8;for(let y=Math.max(0,hero.y-R);y<=Math.min(GH-1,hero.y+R);y++)for(let x=Math.max(0,hero.x-R);x<=Math.min(GW-1,hero.x+R);x++){
      if((x-hero.x)**2+(y-hero.y)**2>R*R)continue;let x0=hero.x,y0=hero.y;const dx=Math.abs(x-x0),dy=Math.abs(y-y0),sx=x0<x?1:-1,sy=y0<y?1:-1;let e=dx-dy,ok=true;
      while(!(x0===x&&y0===y)){const e2=2*e;if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}if(x0===x&&y0===y)break;if(blocks(y0*GW+x0)){ok=false;break;}}
      if(ok){VIS[y*GW+x]=1;SEEN[y*GW+x]=1;}}recomp++;}
  fov();
  function bfs(tx,ty){const prev=new Int16Array(GW*GH).fill(-1),q=[hero.y*GW+hero.x];prev[q[0]]=q[0];while(q.length){const i=q.shift();if(i===ty*GW+tx)break;const x=i%GW,y=(i/GW)|0;
      for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+ax,ny=y+ay,n=ny*GW+nx;if(G[n]===1||prev[n]>=0)continue;prev[n]=i;q.push(n);}}
    const out=[];let i=ty*GW+tx;if(prev[i]<0)return out;while(i!==hero.y*GW+hero.x){out.unshift(i);i=prev[i];}return out;}
  pointer(cv,([x,y],k)=>{if(k==='down'){const tx=clamp(x/CS|0,0,GW-1),ty=clamp(y/CS|0,0,GH-1);if(G[ty*GW+tx]!==1){path=bfs(tx,ty);c.el('auto').checked=false;}}});
  c.btn('reset',()=>{for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){const i=y*GW+x;if(G[i]!==1)G[i]=vnoise(x/3.2+4,y/3.2+1)>.52?2:0;}SEEN.fill(0);hero.x=3;hero.y=6;turn=recomp=trampled=0;fov();});
  function step(){const i=path.shift();if(i===undefined)return;hero.x=i%GW;hero.y=(i/GW)|0;turn++;
    if(G[i]===2){G[i]=3;trampled++;for(let k=0;k<4;k++){const a=k*1.57+.6;pool.spawn(hero.x*CS+4,hero.y*CS+4,Math.cos(a)*14,Math.sin(a)*14-10,.6);}}
    if(c.v('regrow'))for(let j=0;j<G.length;j++)if(G[j]===3&&j!==i&&rnd()<.01)G[j]=2;
    fov();
    foe.cd--;if(foe.cd<=0){foe.cd=2;const d=[[1,0],[-1,0],[0,1],[0,-1]][(turn*7+foe.x)%4],nx=foe.x+d[0],ny=foe.y+d[1];if(G[ny*GW+nx]!==1&&!(nx===hero.x&&ny===hero.y)){foe.x=nx;foe.y=ny;}}}
  const FL=[U('#2a2a30'),U('#45434a'),U('#55525a')],T0=tonesOf(PAL),TM=Uint32Array.from(T0,cc=>mix32(desat(cc,.6),PAL[0],.55));
  return {tick(dt){stepT-=dt;if(stepT<=0){stepT=.22;if(!path.length&&c.v('auto')){let tx,ty,g=0;do{tx=1+((hashI(turn,g,1,3))%(GW-2));ty=1+((hashI(turn,g,2,3))%(GH-2));g++;}while(G[ty*GW+tx]===1&&g<20);path=bfs(tx,ty).slice(0,9);}step();}
    pool.step(dt,40,0,.9);
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x,v=VIS[i],s=SEEN[i],x0=x*CS,y0=y*CS;
      if(!s){rect(u,W,H,x0,y0,CS,CS,U('#07090a'));continue;}const pal=v?T0:TM,g=G[i];
      for(let j=0;j<CS;j++)for(let k=0;k<CS;k++){const r=hash2(x0+k,y0+j);let col;if(g===1)col=j<2?PAL[23]:j===CS-1?PAL[0]:PAL[22];else if(g===3||g===2)col=r<.25?pal[3]:pal[2];else col=(j===CS-1||k===CS-1)?FL[0]:r<.1?FL[2]:FL[1];if(!v)col=mix32(desat(col,.55),PAL[0],.55);u[(y0+j)*W+x0+k]=col;}
      if(g===2){drawTuft(u,W,H,TUFT.mid,x0+2,y0+CS-1,0,pal,false);drawTuft(u,W,H,TUFT.mid,x0+6,y0+CS-1,0,pal,true);}
      else if(g===3){drawTuft(u,W,H,TUFT.flat,x0+4,y0+CS-1,0,pal,!!(x&1));}}
    if(VIS[foe.y*GW+foe.x]){const fx=foe.x*CS+4,fy=foe.y*CS+6;rect(u,W,H,fx-2,fy-2,5,3,U('#8a6a5a'));put(u,W,H,fx+2,fy-3,U('#e8c0b0'));put(u,W,H,fx-3,fy,U('#5a4a3a'));put(u,W,H,fx+1,fy-2,PAL[0]);}
    drawChar(u,W,H,{dir:'down',moving:false,anim:0},hero.x*CS+4,hero.y*CS+7,0);
    for(let j=0;j<pool.n;j++)if(pool.life[j]>0)put(u,W,H,pool.x[j],pool.y[j],j&1?PAL[8]:PAL[9]);
    F.put();let nv=0;for(const v of VIS)nv+=v;
    ro.innerHTML=`Turn ${turn} · <b>${nv}</b> cells visible · FOV recomputed ${recomp} times · ${trampled} cells trampled to short grass`+(c.v('regrow')?' · regrowth 1% per turn, mean about 100 turns':'')+(VIS[foe.y*GW+foe.x]?' · the rat is in view':' · something moves where you cannot see');}};});

// ======================================================================
// B1 variation by position hash: 4 tile variants and mirroring picked by
// hash(x, y), a slow mood map choosing ramp A, B or C with world-locked
// Bayer at the seams. Two clients: hash agrees, engine random does not.
// ======================================================================
// tone maps 1..5 for 4 variants of a 16x16 grass tile; clusters wrap at the tile edges so tiles join
const CLUSTER=[[0,-2,5],[0,-1,4],[0,0,4],[-2,-1,5],[-2,0,4],[2,-1,5],[2,0,4],[-1,1,2],[1,1,2],[0,1,2]];
function mkVariant(k){const T=new Uint8Array(256).fill(3);const rng=mkRng(41+k*13),n=[1,5,9,4][k];
  for(let m=0;m<n;m++){const cx=(rng()*16)|0,cy=(rng()*16)|0;for(const [dx,dy,tn] of CLUSTER){T[((cy+dy)&15)*16+((cx+dx)&15)]=tn;}T[((cy+2)&15)*16+((cx+1)&15)]=2;}
  if(k===2)for(let m=0;m<6;m++){const x=(rng()*16)|0,y=(rng()*16)|0;T[y*16+x]=2;}
  if(k===3){for(const [x,y] of [[4,5],[11,10]]){T[y*16+x]=6;T[y*16+x+1]=6;T[(y-1)*16+x]=6;T[(y+1)*16+x+1]=7;}}return T;}
const VAR=[0,1,2,3].map(mkVariant);
const RAMPS=[['#1f3a24','#2e5a2c','#437a33','#62983c','#8ab84a'],['#2c4026','#4a6a2c','#6a8a34','#8ca444','#b8c25a'],['#1b3a32','#24563e','#347248','#4e8f58','#76b070']].map(r=>Uint32Array.from(['#000000',...r,'#f2efe6','#f2d04a'],U));
reg('hashvar',root=>{const cvs=$$('canvas',root),Ps=cvs.map(PX),W=96,H=64,c=ctl(root),ro=$('[data-ro]',root);
  let mode='hash',cam=[0,0],drag=null,seedB=2,t=0,auto=true;
  const pickHash=(tx,ty)=>{const h=hashI(tx,ty,0,7),r=(h&1023)/1024;return [r<.4?0:r<.7?1:r<.93?2:3,(h>>12)&1];};
  const RND=[new Map(),new Map()];
  const pickRnd=(cl,tx,ty)=>{const k=tx+','+ty,M=RND[cl];if(!M.has(k)){const rng=mkRng((cl?seedB:1)*7919+M.size*31);const r=rng();M.set(k,[r<.4?0:r<.7?1:r<.93?2:3,rng()<.5?1:0]);}return M.get(k);};
  c.seg('mode',v=>{mode=v;});
  c.btn('rejoin',()=>{seedB++;RND[1].clear();});
  cvs.forEach(cv=>pointer(cv,([x,y],k)=>{if(k==='down')drag=[x,y,cam[0],cam[1]];else if(k==='drag'&&drag){cam=[Math.round(drag[2]-(x-drag[0])),Math.round(drag[3]-(y-drag[1]))];auto=false;}else if(k==='up')drag=null;}));
  return {tick(dt){t+=dt;if(auto)cam=[Math.round(t*6),Math.round(Math.sin(t*.3)*10)];const mood=c.v('mood');let same=true;
    for(let cl=0;cl<2;cl++){const u=Ps[cl].u32;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const wx=x+cam[0],wy=y+cam[1],tx=Math.floor(wx/16),ty=Math.floor(wy/16);
        const [v,fl]=mode==='one'?[1,0]:mode==='hash'?pickHash(tx,ty):pickRnd(cl,tx,ty);
        const lx=((wx%16)+16)%16,ly=((wy%16)+16)%16,tn=VAR[v][ly*16+(fl?15-lx:lx)];
        let ri=1;if(mood){const m=vnoise(wx/70+3,wy/60+1)*3.4-.7,b=Math.floor(m),f=clamp((m-b-.35)/.3,0,1);ri=clamp(b+(f*16>bay(wx,wy)+.5?1:0),0,2);}
        const col=RAMPS[ri][tn];u[y*W+x]=col;if(cl===1&&col!==Ps[0].u32[y*W+x])same=false;}
      Ps[cl].put();}
    ro.innerHTML=`Client A and client B ${same?'<b>see the same field</b>':'<b>see different fields</b>'} · network bytes for this: 0 · `+(mode==='one'?'one repeated tile: the 16 px grid shows':mode==='hash'?'variant and flip from <code>hash(x, y)</code>: the grid disappears':'engine random, unseeded by your function: each client paints its own meadow')+(mood?' · mood map picks ramp A, B or C, Bayer at the seams':'');}};});

// ======================================================================
// B2 16-tile corner set: each vertex holds water, dirt or grass; each
// tile looks only at its 4 corners (2^4 = 16 tiles per pair), drawn with
// a tileable noise so neighbours always join. Grass gets a 1 px lip over
// dirt, and a darker wet band near water.
// ======================================================================
reg('cornerset',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=128,H=80,c=ctl(root),ro=$('[data-ro]',root),atlas=$$('.atlas canvas',root).map(PX);
  const VW=9,VH=6,V=new Uint8Array(VW*VH);const NT=mkTable(16,5,2,2),NT2=mkTable(16,8,2,2);
  for(let y=0;y<VH;y++)for(let x=0;x<VW;x++){const d=Math.hypot(x-6.2,y-3.6);V[y*VW+x]=d<1.3?0:(x+y*.6<4.4||d<2.4)?1:2;}
  let tool=2,hover=-1;c.seg('tool',v=>{tool=+v;});c.btn('clear',()=>V.fill(2));
  const layerAt=(L,tx,ty,lx,ly)=>{const a=V[ty*VW+tx]>=L,b=V[ty*VW+tx+1]>=L,cc=V[(ty+1)*VW+tx]>=L,d=V[(ty+1)*VW+tx+1]>=L;const fx=(lx+.5)/16,fy=(ly+.5)/16;
    const v=(a*(1-fx)+b*fx)*(1-fy)+(cc*(1-fx)+d*fx)*fy+((L===2?NT:NT2)[ly*16+lx]-.5)*.55;return v>.5;};
  const T=new Uint8Array(W*H);
  pointer(cv,([x,y],k)=>{const vx=Math.round(x/16),vy=Math.round(y/16);hover=Math.floor(y/16)*8+Math.floor(x/16);if((k==='down'||k==='drag')&&vx>=0&&vy>=0&&vx<VW&&vy<VH)V[vy*VW+vx]=tool;});
  // atlas: the 16 grass-over-dirt tiles, index = TL*8 + TR*4 + BL*2 + BR
  function drawAtlas(){atlas.forEach((P,k)=>{const cs=[(k>>3)&1,(k>>2)&1,(k>>1)&1,k&1];for(let ly=0;ly<16;ly++)for(let lx=0;lx<16;lx++){const fx=(lx+.5)/16,fy=(ly+.5)/16;
      const v=(cs[0]*(1-fx)+cs[1]*fx)*(1-fy)+(cs[2]*(1-fx)+cs[3]*fx)*fy+(NT[ly*16+lx]-.5)*.55;P.u32[ly*16+lx]=v>.5?(ly%5===0&&lx%3===0?PAL[8]:PAL[7]):((lx*3+ly*5)%7===0?PAL[12]:PAL[11]);}P.put();});}
  drawAtlas();
  let sig='';
  return {tick(){const ns=V.join('')+c.v('grid');if(ns===sig)return;sig=ns;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const tx=x>>4,ty=y>>4,lx=x&15,ly=y&15;T[y*W+x]=layerAt(2,tx,ty,lx,ly)?2:layerAt(1,tx,ty,lx,ly)?1:0;}
    const used=new Set(),usedW=new Set();
    for(let ty=0;ty<5;ty++)for(let tx=0;tx<8;tx++){const g=[V[ty*VW+tx]>=2,V[ty*VW+tx+1]>=2,V[(ty+1)*VW+tx]>=2,V[(ty+1)*VW+tx+1]>=2],d=[V[ty*VW+tx]>=1,V[ty*VW+tx+1]>=1,V[(ty+1)*VW+tx]>=1,V[(ty+1)*VW+tx+1]>=1];
      used.add(g[0]*8+g[1]*4+g[2]*2+g[3]);usedW.add(d[0]*8+d[1]*4+d[2]*2+d[3]);}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=T[i],r=hash2(x,y);let nearW=99;
      if(k>0)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;if(T[Y*W+X]===0)nearW=Math.min(nearW,Math.max(Math.abs(dx),Math.abs(dy)));}
      let col;
      if(k===2){col=(y%5===0&&(x+y)%3===0)?PAL[8]:r<.06?PAL[6]:PAL[7];if(y+1<H&&T[i+W]<2)col=PAL[5];if(nearW<=2)col=nearW===1?PAL[4]:PAL[5];}
      else if(k===1){col=(x*3+y*5)%7===0?PAL[12]:PAL[11];if(y>0&&T[i-W]===2)col=PAL[10];if(nearW<=2)col=nearW===1?PAL[10]:(r<.5?PAL[10]:PAL[11]);}
      else{let nl=false;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&T[Y*W+X]>0)nl=true;}col=nl?PAL[3]:(((x+(y>>1)*3)%9===0&&y%3===0)?PAL[3]:(r<.5?PAL[2]:PAL[1]));}
      u[i]=col;}
    if(c.v('grid')){for(let ty=0;ty<5;ty++)for(let tx=0;tx<8;tx++){const g=[V[ty*VW+tx]>=2,V[ty*VW+tx+1]>=2,V[(ty+1)*VW+tx]>=2,V[(ty+1)*VW+tx+1]>=2],id=g[0]*8+g[1]*4+g[2]*2+g[3];
        for(let i=0;i<16;i++){put(u,W,H,tx*16+i,ty*16,mix32(u[(ty*16)*W+tx*16+i],PAL[0],.4));put(u,W,H,tx*16,ty*16+i,mix32(u[(ty*16+i)*W+tx*16],PAL[0],.4));}
        rect(u,W,H,tx*16+1,ty*16+1,id>9?9:5,7,PAL[0]);digits(u,W,H,tx*16+2,ty*16+2,id,PAL[16]);}
      for(let vy=0;vy<VH;vy++)for(let vx=0;vx<VW;vx++){const t=V[vy*VW+vx],cc=t===2?PAL[9]:t===1?PAL[12]:PAL[3];for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])put(u,W,H,vx*16+dx,vy*16+dy,(dx||dy)?PAL[0]:cc);}}
    F.put();atlas.forEach((P,k)=>P.cv.classList.toggle('on',used.has(k)));
    ro.innerHTML=`Grass over dirt uses <b>${used.size}</b> of its 16 corner tiles here, dirt over water <b>${usedW.size}</b> · art budget: 16 corner tiles × 2 variants = <b>32</b> tiles per pair, a 47-tile blob set with 2 variants = <b>94</b>`;}};});

// ======================================================================
// B3 tuft sprites y-sorted with a walker, a grass-front strip over the
// lower body, and the draw-call price of each ordering
// ======================================================================
reg('tuftcover',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=128,H=72,c=ctl(root),ro=$('[data-ro]',root);
  const tufts=[];for(let y=26;y<H+2;y+=4)for(let x=2;x<W;x+=5){const jx=x+Math.round((hash2(x,y)-.5)*3),jy=y+Math.round((hash2(y,x)-.5)*2);if(jy<30+7*vnoise(jx/9,3))continue;tufts.push({x:jx,y:jy,fl:hash2(jx,jy)<.5});}
  tufts.sort((a,b)=>a.y-b.y);
  const ground=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const r=hash2(x*3,y*7);ground[y*W+x]=y<26?(r<.06?PAL[8]:PAL[7]):(r<.1?PAL[5]:PAL[6]);}
  let t=0,mode='tuft';c.seg('mode',v=>{mode=v;});
  const showS=()=>c.out('sh',c.v('sh')+' px');c.on('sh',showS);showS();
  const BAND=8;
  return {tick(dt){t+=dt;u.set(ground);const wx=64+46*Math.cos(t*.45),wy=46+18*Math.sin(t*.45),fr=((t*6)|0)%4===1?1:((t*6)|0)%4===3?2:0;
    const inPatch=wy>30;const strip=c.v('strip')?c.v('sh'):0;
    const sh=q=>Math.round(Math.sin(t*1.6+q.x*.07)*.9);
    const walkerDraw=()=>{drawBig(u,W,H,wx,wy,fr,0);
      if(strip&&inPatch)for(let dx=-8;dx<=8;dx++){const bh=strip-(hashI(Math.round(wx)+dx,0,0,3)%3);for(let j=0;j<bh;j++){const tn=j<2?1:j<bh*.5?2:j<bh-1?3:(dx&1?4:5);if((dx+j)%3===0&&j>bh-3)continue;put(u,W,H,wx+dx,wy+1-j,TONES[tn]);}}};
    let draws=0;
    if(mode==='tuft'){let d=false;for(const q of tufts){if(!d&&q.y>wy){walkerDraw();d=true;}drawTuft(u,W,H,TUFT.tall,q.x,q.y,sh(q),TONES,q.fl);}if(!d)walkerDraw();draws=tufts.length+1;}
    else if(mode==='batch'){for(const q of tufts)drawTuft(u,W,H,TUFT.tall,q.x,q.y,sh(q),TONES,q.fl);walkerDraw();draws=2;}
    else{const bands=new Map();for(const q of tufts){const b=Math.floor(q.y/BAND);if(!bands.has(b))bands.set(b,[]);bands.get(b).push(q);}
      const keys=[...bands.keys()].sort((a,b)=>a-b);let d=false;for(const b of keys){if(!d&&(b+1)*BAND>wy+BAND/2){walkerDraw();d=true;}for(const q of bands.get(b))drawTuft(u,W,H,TUFT.tall,q.x,q.y,sh(q),TONES,q.fl);}if(!d)walkerDraw();draws=keys.length+1;}
    F.put();const pct=Math.round(strip/24*100);
    ro.innerHTML=`${mode==='tuft'?`Per-tuft sprites: <b>${tufts.length}</b> separate draws, sorted one by one`:mode==='batch'?'One batch at one depth: <b>1</b> draw, but the walker cannot sit between tufts, so it floats on top':`Row bands: <b>${draws-1}</b> draws, one per ${BAND} px row, sorted with the walker by row`}`+
      ` · strip: ${strip?`${strip} px, <span class="${pct>40?'bad':'good'}">${pct}% of the 24 px walker</span> (keep under 40%)`:'off'}`+
      `<br>Measured for 2,000 tufts on the M4 GPU at 320×180: one instanced draw 0.012 ms, 2,000 separate draws 2.01 ms timer, 3.27 ms wall [V, S12]`;}};});

// ======================================================================
// B4 per-tuft sprites vs one field layer in row bands vs pixel writes:
// the three canvas paths, timed live, next to the §6a numbers
// ======================================================================
reg('fieldlayer',root=>{const cv=$('canvas',root),ctx=cv.getContext('2d'),W=160,H=90,c=ctl(root),ro=$('[data-ro]',root),bars=$('[data-bars]',root);
  const img=ctx.createImageData(W,H),u=new Uint32Array(img.data.buffer),ground=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const r=hash2(x,y*3);ground[y*W+x]=y%6===0?PAL[11]:r<.12?PAL[5]:PAL[6];}
  const groundImg=ctx.createImageData(W,H);new Uint32Array(groundImg.data.buffer).set(ground);
  const KINDS=['tall','wheat','mid'],PALS={tall:TONES,mid:TONES,wheat:WHEAT};
  // pre-baked shear frames: 5 per kind, shear -2..+2 (C5: frames instead of rotation)
  const FR={};for(const k of KINDS){FR[k]=[];const s=TUFT[k];for(let sh=-2;sh<=2;sh++){const fc=document.createElement('canvas');fc.width=s.w+4;fc.height=s.h;const fx=fc.getContext('2d'),fi=fx.createImageData(fc.width,fc.height),fu=new Uint32Array(fi.data.buffer);
    drawTuft(fu,fc.width,fc.height,s,(s.w-1)/2+2,s.h-1,sh,PALS[k],false);fx.putImageData(fi,0,0);FR[k].push(fc);}}
  let N=0,tufts=[];const layer=document.createElement('canvas');layer.width=W;layer.height=H;const lctx=layer.getContext('2d'),limg=lctx.createImageData(W,H),lu=new Uint32Array(limg.data.buffer);
  let rebakeMs=0;
  function setN(n){N=n;const rng=mkRng(n);tufts=[];for(let i=0;i<n;i++){let y=6+Math.floor(rng()*(H-4));const x=Math.floor(rng()*W);if(y<36)y=6+Math.floor((y-6)/3)*3;tufts.push({x,y,k:y<36?'wheat':KINDS[i%3===0?2:0],ph:rng()});}tufts.sort((a,b)=>a.y-b.y);
    const t0=performance.now();lu.fill(0);for(const q of tufts)drawTuft(lu,W,H,TUFT[q.k],q.x,q.y,0,PALS[q.k],false);lctx.putImageData(limg,0,0);rebakeMs=performance.now()-t0;}
  const show=()=>{c.out('n',c.v('n').toLocaleString('en'));if(c.v('n')!==N)setN(c.v('n'));};c.on('n',show);show();
  let mode='sprite',t=0,hud=0;const LAST={sprite:null,bands:null,pixels:null};
  c.seg('mode',v=>{mode=v;});
  const shearAt=(x,y)=>clamp(Math.round(.6+Math.cos(x*.06-t*2.2)*.9+(tabBil(GUST,128,(x-t*20)/5,y/5)-.45)*2.2),-2,2);
  function draw(m,tc){if(m==='sprite'){tc.putImageData(groundImg,0,0);const t0=performance.now();for(const q of tufts){const s=TUFT[q.k];tc.drawImage(FR[q.k][shearAt(q.x,q.y)+2],q.x-(s.w-1)/2-2,q.y-s.h+1);}return performance.now()-t0;}
    if(m==='bands'){tc.putImageData(groundImg,0,0);const t0=performance.now();for(let y=0;y<H;y+=2){const off=shearAt(W/2,y);tc.drawImage(layer,0,y,W,2,off,y,W,2);}return performance.now()-t0;}
    const t0=performance.now();u.set(ground);for(const q of tufts)drawTuft(u,W,H,TUFT[q.k],q.x,q.y,shearAt(q.x,q.y),PALS[q.k],false);tc.putImageData(img,0,0);return performance.now()-t0;}
  c.btn('bench',b=>{const oc=document.createElement('canvas');oc.width=W;oc.height=H;const ox=oc.getContext('2d');for(const m of ['sprite','bands','pixels']){let s=0;draw(m,ox);for(let k=0;k<12;k++)s+=draw(m,ox);LAST[m]=s/12;}paint();});
  const REF={sprite:['1 drawImage per tuft',CPU6A.drawImage2k],bands:['field layer, row bands',CPU6A.bands],pixels:['pixel writes + putImageData',CPU6A.pixel2k]};
  function paint(){const mx=Math.max(1,...Object.values(LAST).filter(v=>v!==null),...Object.values(REF).map(r=>r[1][0]));
    bars.innerHTML=Object.keys(REF).map(k=>{const v=LAST[k],r=REF[k][1][0],sc=x=>Math.max(1,Math.log10(x*1000+1)/Math.log10(mx*1000+1)*100);
      return `<div class="fl-row${k===mode?' on':''}"><span class="fl-n">${REF[k][0]}</span><span class="fl-b"><i class="here" style="width:${v===null?0:sc(v)}%"></i><i class="ref" style="width:${sc(r)}%"></i></span><span class="fl-v">${v===null?'–':fms(v)} ms here · ${fms(r)} ms M4 at 2,000${k==='bands'?' (any N)':''}</span></div>`;}).join('');}
  paint();
  let benched=false;
  return {tick(dt){t+=dt;if(!benched&&hud===20){benched=true;$('[data-b="bench"]',root).click();}const ms=draw(mode,ctx);LAST[mode]=LAST[mode]===null?ms:LAST[mode]+(ms-LAST[mode])*.1;
    if(++hud%10===0){paint();ro.innerHTML=`${N.toLocaleString('en')} tufts · this view: <b>${fms(LAST[mode])} ms</b> of JavaScript per frame on your device · re-baking the field layer took ${fms(rebakeMs)} ms (measured 4.8 ms for 8,000 on the M4, so re-bake only dirty cells) · on a GPU, one instanced draw of 2,000 tufts measured 0.012 ms and 2,000 separate draws 3.27 ms wall`;}}};});

// ======================================================================
// B5 flowers: patches from a thresholded noise with Poisson-disc dots
// inside, against uniform random; heads open, half and closed by hour
// ======================================================================
reg('flowers',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=96,H=64,c=ctl(root),ro=$('[data-ro]',root);
  const SP=[17,18,19,20];let seed=1,fa=[],fb=[],hour=10,minA=0,minB=0;
  const ground=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const r=hash2(x*5,y*3);ground[y*W+x]=r<.05?PAL[7]:r<.09?PAL[5]:PAL[6];}
  const grassT=[];for(let k=0;k<70;k++)grassT.push([Math.floor(hash2(k,1)*W),4+Math.floor(hash2(k,2)*(H-4)),hash2(k,3)<.5]);
  function nn(P){let m=99;for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const d=Math.hypot(P[i].x-P[j].x,P[i].y-P[j].y);if(d<m)m=d;}return m;}
  function build(){const r=c.v('r'),rng=mkRng(seed*101),patch=(x,y)=>vnoise(x/13+seed*3,y/11+seed)>.64;
    fa=poisson(W,H-4,r,rng,(x,y)=>y>3&&patch(x,y)).map(([x,y])=>{const dom=SP[Math.floor(vnoise(x/40+seed,y/40)*4)%4],k=rng();return {x:Math.round(x),y:Math.round(y),c:k<.7?dom:SP[(SP.indexOf(dom)+1+Math.floor(rng()*3))%4],off:15+hash2(Math.round(x/24),Math.round(y/24)+seed)*2};});
    const r2=mkRng(seed*7+3);fb=fa.map(()=>({x:Math.floor(r2()*W),y:4+Math.floor(r2()*(H-6)),c:SP[Math.floor(r2()*4)],off:15+r2()*2}));minA=nn(fa);minB=nn(fb);}
  const showR=()=>{c.out('r',c.v('r')+' px');build();};c.on('r',showR);showR();
  c.btn('seed',()=>{seed++;build();});
  const showH=()=>{hour=c.v('h')/4;c.out('h',fmtH(hour));};c.on('h',()=>{c.el('run').checked=false;showH();});showH();
  const openAt=(f,h,rain)=>{if(rain)return 0;const close=f.off,open=8;if(h<open-1||h>=close+1)return 0;if(h<open)return h-(open-1);if(h<close)return 1;return 1-(h-close);};
  return {tick(dt){if(c.v('run')){hour=(hour+dt*.6)%24;c.el('h').value=Math.round(hour*4);c.out('h',fmtH(hour));}const rain=c.v('rain');
    let st=[0,0,0];
    for(const [P,L] of [[A,fa],[B,fb]]){P.u32.set(ground);for(const [x,y,fl] of grassT)drawTuft(P.u32,W,H,TUFT.short,x,y,0,TONES,fl);
      for(const f of L){const o=openAt(f,hour,rain);const fr=o>.66?1:o>.33?.5:0;drawFlower(P.u32,W,H,f.x,f.y,PAL[f.c],fr,PAL[5]);if(P===A)st[fr===1?0:fr===.5?1:2]++;}
      if(hour<6||hour>20){const k=hour<6?1-hour/6*.5:Math.min(.5,(hour-20)/4*.5+.2);for(let i=0;i<P.u32.length;i++)P.u32[i]=mix32(P.u32[i],PAL[30],k*.6);}
      P.put();}
    ro.innerHTML=`${fa.length} flowers each side · closest pair: <b>${minA.toFixed(1)} px</b> in patches against <b>${minB.toFixed(1)} px</b> random · ${fmtH(hour)}${rain?', rain':''}: ${st[0]} open, ${st[1]} half, ${st[2]} closed`;}};});

// ======================================================================
// C1 row shear in whole pixels vs smooth sub-pixel sway, zoomed; C5
// stepped sway at 5 fps as a toggle. Counts the colours on screen.
// ======================================================================
reg('rowshear',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=40,H=18,c=ctl(root),ro=$('[data-ro]',root);
  const items=[[8,15,'tall',TONES,false],[20,16,'wheat',WHEAT,false],[31,15,'mid',TONES,true],[14,17,'short',TONES,true],[27,17,'short',TONES,false],[36,17,'short',TONES,false],[3,17,'short',TONES,true]];
  const bg=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)bg[y*W+x]=y>13?(hash2(x,y)<.2?PAL[5]:PAL[6]):(y>11?PAL[6]:PAL[7]);
  let t=0,hud=0;const unq=a=>{const s=new Set();for(const v of a)s.add(v);return s.size;};
  // smooth branch: each row moves by a fractional offset and blends neighbouring texels with what is behind
  function smoothTuft(u,s,x,y,sh,pal,fl){const x0=Math.round(x-(s.w-1)/2),yb=Math.round(y);
    for(let j=0;j<s.h;j++){const sj=s.h-1-j,fr=j/(s.h-1),o=sh*fr,yy=yb-j;if(yy<0||yy>=H)continue;const io=Math.floor(o),f=o-io;
      for(let X=x0-3;X<x0+s.w+3;X++){if(X<0||X>=W)continue;const sx=X-x0-io;const ga=i=>{if(i<0||i>=s.w)return 0;return s.a[sj*s.w+(fl?s.w-1-i:i)];};
        const a=ga(sx),b=ga(sx-1);const wa=a?(1-f):0,wb=b?f:0;if(!wa&&!wb)continue;const dst=u[yy*W+X];let col=dst;
        if(a&&b)col=mix32(pal[a],pal[b],f);else if(a)col=mix32(dst,pal[a],1-f);else col=mix32(dst,pal[b],f);u[yy*W+X]=col;}}}
  return {tick(dt){t+=dt;const tq=c.v('step')?Math.floor(t*5)/5:t;A.u32.set(bg);B.u32.set(bg);let tipA=0;
    for(const [x,y,k,pal,fl] of items){const amp=k==='short'?1:2,sh=amp*Math.sin(tq*2.1+x*.12);drawTuft(A.u32,W,H,TUFT[k],x,y,sh,pal,fl);smoothTuft(B.u32,TUFT[k],x,y,sh,pal,fl);if(k==='tall')tipA=sh;}
    A.put();B.put();
    if(++hud%6===0){const tip=Math.round(tipA),mid=Math.round(tipA*.5);ro.innerHTML=`Tall tuft now: tip <b>${tip>0?'+':''}${tip} px</b>, middle ${mid>0?'+':''}${mid} px, root 0 px · colours on screen: <b>${unq(A.u32)}</b> whole-pixel against <b>${unq(B.u32)}</b> smooth`+(c.v('step')?' · stepped at 5 fps':'');}}};});

// ======================================================================
// C2 Terraria's cosine wave: phase x*0.5 per column, s = cos(2π·counter
// + phase)·0.5 + wind, times lerp(0.08..0.18, |wind|); period 3.0 s calm
// to 0.6 s storm; crests move to −x. Asterion: crests travel downwind.
// ======================================================================
reg('cosinewave',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),P=PX(cvs[1]),W=240,H=48,PH=40,c=ctl(root),ro=$('[data-ro]',root);
  const tufts=[];for(let tx=0;tx<15;tx++)for(let k=0;k<3;k++)tufts.push({tx,x:tx*16+3+k*5+Math.round(hash2(tx,k)*2),y:30+((k*7+tx*3)%9),k:k===1?'tall':'mid',fl:(tx+k)&1});
  for(let tx=0;tx<15;tx++)for(let k=0;k<4;k++)tufts.push({tx,x:tx*16+2+k*4,y:43+(k&1)*3,k:'mid',fl:k&1});
  tufts.sort((a,b)=>a.y-b.y);
  const bg=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const r=hash2(x,y);bg[y*W+x]=y<20?(y<8?U('#8fb8d8'):U('#a9cce0')):(r<.08?PAL[5]:PAL[6]);}
  for(let x=0;x<W;x++){const hh=14+Math.round(3*Math.sin(x*.05)+2*Math.sin(x*.13));for(let y=hh;y<20;y++)bg[y*W+x]=y===hh?PAL[8]:PAL[7];}
  let counter=0,t=0,hud=0;const m=meter(.1);
  const showW=()=>c.out('w',(c.v('w')/100).toFixed(2));c.on('w',showW);showW();
  return {tick(dt){m.t0();t+=dt;const wind=c.v('w')/100,aw=Math.abs(wind),period=lerp(3,.6,aw);counter+=dt/period;const gate=c.v('gate')?smooth(.06,.2,aw):1,ast=c.segv('ph')==='ast';
    const sAt=tx=>{const ph=ast?-(wind>=0?1:-1)*tx*.5:tx*.5;return Math.cos(counter*2*Math.PI+ph)*.5+wind;};
    const rot=tx=>sAt(tx)*lerp(.08,.18,aw)*gate;
    A.u32.set(bg);for(const q of tufts){const sh=clamp(Math.round(rot(q.tx+(q.x%16)/16)*14),-2,2);drawTuft(A.u32,W,H,TUFT[q.k],q.x,q.y,sh,TONES,!!q.fl);}A.put();
    const u=P.u32;u.fill(U('#0c100b'));for(let x=0;x<W;x+=16)for(let y=0;y<PH;y+=2)u[y*W+x]=U('#1c2418');const mid=PH/2;for(let x=0;x<W;x++)u[mid*W+x]=U('#29331f');
    let best=-9,bx=0;for(let x=0;x<W;x++){const v=Math.cos(counter*2*Math.PI+(ast?-(wind>=0?1:-1):1)*(x/16)*.5);if(v>best&&x>4&&x<W-4){best=v;bx=x;}const y=Math.round(mid-v*(mid-4)*Math.max(.15,gate));if(y>=0&&y<PH){u[y*W+x]=PAL[15];if(y+1<PH)u[(y+1)*W+x]=PAL[13];}}
    for(let k=0;k<PH;k++)if((k>>1)&1)u[k*W+bx]=PAL[26];const dir=ast?(wind>=0?1:-1):-1;for(let k=0;k<5;k++){put(u,W,PH,bx+dir*(6+k),4,PAL[26]);}put(u,W,PH,bx+dir*10,3,PAL[26]);put(u,W,PH,bx+dir*10,5,PAL[26]);put(u,W,PH,bx+dir*9,2,PAL[26]);put(u,W,PH,bx+dir*9,6,PAL[26]);
    P.put();const ms=m.t1();
    if(++hud%8===0){const lam=2*Math.PI/.5*16;ro.innerHTML=`Wind ${wind.toFixed(2)} · period <b>${period.toFixed(2)} s</b> (${Math.round(period*60)} frames) · wavelength 12.6 tiles, about ${Math.round(lam)} px at 16 px tiles · crests move <b>${Math.round(lam/period)} px/s</b> toward <b>${dir<0?'−x':'+x'}</b>`+(ast?' (downwind)':wind>0?' (upwind: the +0.5x term ignores the wind sign)':'')+(c.v('gate')&&aw<.2?' · below the gate: nearly still':'')+` · JS ${fms(ms)} ms`;}}};});

// ======================================================================
// C3 gusts from two scrolling noise tables (slow strong gust, fast weak
// flutter), sampled at each tuft's root; C4 per-material stiffness
// 0.25-2.0 and the Stardew 1+r divisor. Tap for a blast primitive.
// ======================================================================
reg('gusts',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),G1=PX(cvs[1]),G2=PX(cvs[2]),W=160,H=80,c=ctl(root),ro=$('[data-ro]',root);
  const STIFF={short:.25,mid:.75,tall:1,wheat:2,flower:1.25};
  const tufts=[];for(let y=6;y<H+3;y+=4)for(let x=1;x<W;x+=4){const wz=y<30&&x>70;if(wz&&(y%8!==2))continue;const jx=wz?x+((y>>3)&1)*2:x+Math.round((hash2(x,y)-.5)*3),r=hash2(jx,y*3),m=vnoise(jx/30+2,y/20);let k=wz?'wheat':m>.6?'tall':m>.4?'mid':'short';if(k==='short'&&r>.5)continue;if(k==='tall'&&r>.8)continue;
    tufts.push({x:jx,y,k,fl:r<.5,r:hash2(jx*7,y),ph:hash2(jx,y*11)*100,sg:hash2(jx*3,y*5)<.5?-1:1,flw:k!=='wheat'&&r>.93});}
  tufts.sort((a,b)=>a.y-b.y);
  const bg=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const r=hash2(x*3,y);bg[y*W+x]=y<30&&x>70?(y%3===0?PAL[11]:PAL[13]):(r<.08?PAL[5]:PAL[6]);}
  const showS=()=>c.out('s',(c.v('s')/100).toFixed(2));c.on('s',showS);showS();
  let t=0,hud=0,blast=null,blasts=0;const m=meter(.08);
  pointer(cvs[0],([x,y],k)=>{if(k==='down'){blast={x,y,a:0};blasts++;}});
  return {tick(dt){m.t0();t+=dt;const wind=c.v('s')/100,gOn=c.v('g'),fOn=c.v('f'),vOn=c.v('v'),dance=c.v('d');
    const u=F.u32;u.set(bg);if(blast){blast.a+=dt;if(blast.a>1.2)blast=null;}
    for(const q of tufts){let lean;
      if(dance){lean=q.sg*(tabBil(FLUT,64,q.ph+t*9,q.ph*.7)-.5)*3.2+wind*.4;}
      else{const g=gOn?(tabBil(GUST,128,(q.x-t*26)/6,q.y/6)-.42)*2.4*wind:0,f=fOn?(tabBil(FLUT,64,(q.x-t*70)/2,(q.y+t*6)/2)-.5)*.9:0;lean=wind*.9+g+f;}
      let st=STIFF[q.flw?'flower':q.k];if(vOn&&!dance)st/=1+q.r*.999;
      if(q.flw&&vOn&&!dance)lean=lean*.85+Math.sin(t*3-q.x*.04)*.3;
      let sh=clamp(lean*st,-2,2),ln=0;if(blast){const dx=q.x-blast.x,dy=q.y-blast.y,d=Math.hypot(dx,dy),R=blast.a*90;if(d<R&&d>R-30){const k2=(1-blast.a/1.2)*(1-(R-d)/30);ln=Math.sign(dx)*k2*3;}}
      drawTuft(u,W,H,TUFT[q.k==='short'?'short':q.k],q.x,q.y,sh,q.k==='wheat'?WHEAT:TONES,q.fl,0,ln);if(q.flw)put(u,W,H,q.x+Math.round(sh),q.y-7,PAL[19]);}
    // the two tables, scrolled: what each tuft reads at its root
    for(const [P,T,n,sp,sc] of [[G1,GUST,128,26,6],[G2,FLUT,64,70,2]]){const v=P.u32,w=P.W,h=P.H;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=tabBil(T,n,(x*2-t*sp)/sc,y*2/sc);const l=a*5,b=Math.floor(l),k=clamp(b+((l-b)*16>bay(x,y)+.5?1:0),0,4);v[y*w+x]=[PAL[4],PAL[5],PAL[6],PAL[8],PAL[9]][k];}P.put();}
    F.put();const ms=m.t1();
    if(++hud%10===0)ro.innerHTML=`${tufts.length} tufts · ${dance?'per-tuft noise directions: the field dances':`gust ${gOn?'on':'off'}, flutter ${fOn?'on':'off'}, variation ${vOn?'on':'off'}`} · stiffness short 0.25, mid 0.75, tall 1.0, flowers 1.25, wheat 2.0 · JS <b>${fms(ms)} ms</b> here`+(blasts?` · ${blasts} blast primitive${blasts>1?'s':''}, about 12 bytes each on start (estimate)`:'');}};});

}
