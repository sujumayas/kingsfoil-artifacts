
// ======================================================================
// HERO: mini top-down scene (deposit x exposure, sandpile, z-flakes, prints, melt)
// ======================================================================
function buildScene(f,o={}){const W=f.W,H=f.H;
  // house roof (holds snow) + walls (solid)
  const hx=o.hx||18,hy=o.hy||14,hw=o.hw||48,rh=o.rh||24,wh=o.wh||17;const foot=hy+rh+wh;
  for(let y=hy;y<hy+rh;y++)for(let x=hx;x<hx+hw;x++){let c=((y-hy)%4===3)?COL.ROOF_B:COL.ROOF_A;if(((x+((y>>2)&1)*3)%6)===0&&c===COL.ROOF_A)c=COL.ROOF_B;
    const edge=y===hy||y===hy+rh-1||x===hx||x===hx+hw-1;f.put(x,y,edge?9:1,edge?COL.ROOF_D:c,30,foot,y>=hy+rh-2);}
  for(let y=hy+rh;y<foot;y++)for(let x=hx+3;x<hx+hw-3;x++){let c=((y-hy-rh)%3===2)?COL.WALL_B:COL.WALL_A;if(x===hx+3||x===hx+hw-4||y===foot-1)c=COL.WALL_D;
    const dx=hx+(hw>>1)-3;if(x>=dx&&x<=dx+6&&y>=hy+rh+5)c=(x===dx||x===dx+6||y===hy+rh+5)?COL.WALL_D:COL.DOOR;
    for(const wx of [hx+7,hx+hw-15])if(x>=wx&&x<=wx+7&&y>=hy+rh+3&&y<=hy+rh+9)c=(x===wx||x===wx+7||y===hy+rh+3||y===hy+rh+9)?COL.WALL_D:COL.WIN;
    f.put(x,y,9,c,30,foot,true);}
  for(let y=foot;y<foot+5;y++)for(let x=hx+1;x<hx+hw-1;x++)if(y<H)f.SHL[y*W+x]*=Math.min(1,.15+(y-foot)/5);
  for(const [tx,ty] of (o.trees||[])){
    for(let y=ty-9;y<=ty+6;y++)for(let x=tx-11;x<=tx+11;x++){if(x<0||y<0||x>=W||y>=H)continue;const dx=(x-tx)/10,dy=(y-ty+1)/5,r=Math.sqrt(dx*dx+dy*dy);if(r<1)f.SHL[y*W+x]*=.12+.88*r*r;}
    for(let y=ty-3;y<=ty;y++)for(let x=tx-1;x<=tx+1;x++)f.put(x,y,9,x===tx+1?COL.WALL_D:COL.TRUNK,22,ty,true);
    for(const [cy,r,h] of [[ty-4,8,7],[ty-9,6,6],[ty-14,4,5]])for(let k=0;k<=h;k++){const hw2=Math.round(r*(1-k/h));for(let x=tx-hw2;x<=tx+hw2;x++){
      const c=k===0?COL.CAN_D:(x<tx?COL.CAN_A:(x===tx&&hash2(x,cy-k)<.5?COL.CAN_A:COL.CAN_B));f.put(x,cy-k,k===0?9:2,c,22,ty,false);
      if(cy-k>=0&&x>=0&&x<W)f.thr[(cy-k)*W+x]=3+vnoise(x/2.2,(cy-k)/1.6)*9+bay(x,cy-k)*.35;}}
    for(let y=ty-2;y<=ty+1;y++)for(let x=tx-5;x<=tx+5;x++)if(x>=0&&x<W&&y<H&&y>=0)f.WOB[y*W+x]=Math.max(f.WOB[y*W+x],18);}
  for(const [x0,y0,len] of (o.fences||[]))for(let x=x0;x<=x0+len;x++)for(let y=y0;y<=y0+5;y++){const post=(x-x0)%8<2;let s=9,c=COL.FEN_D;
    if(post){c=x%2?COL.FEN_D:COL.FEN_A;if(y===y0)s=1;}else if(y===y0+1||y===y0+3){c=COL.FEN_A;s=1;}else continue;f.put(x,y,s,c,8,y0+5,y>=y0+4);}
  for(const [cx,cy] of (o.rocks||[]))for(let y=cy-4;y<=cy+3;y++)for(let x=cx-6;x<=cx+6;x++){const dx=(x-cx)/6,dy=(y-cy)/3.6;if(dx*dx+dy*dy<1)f.put(x,y,y<=cy?1:9,y<=cy?(x>cx+2?COL.ROCK_B:COL.ROCK_A):COL.ROCK_C,6,cy+3,true);}
  for(const [x0,y0,x1,y1] of (o.paths||[]))for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(x<0||y<0||x>=W||y>=H)continue;const i=y*W+x;if(f.S[i]!==0)continue;f.G[i]=hash2(x*3,y)<.3?COL.DIRT_B:COL.DIRT;f.thr[i]=bay(x,y)*.55+hash2(x,y+9)*2+.5;}
  f.bakeShadow();}

function Flakes(W,H,layers){const L=layers.map(l=>({...l,x:new Float32Array(l.n),y:new Float32Array(l.n),z:new Float32Array(l.n),ph:new Float32Array(l.n),on:new Uint8Array(l.n).fill(1)}));
  const spawn=(l,k,top)=>{l.x[k]=rnd()*(W+40)-20;l.y[k]=rnd()*(H+50);l.z[k]=top?44+rnd()*8:rnd()*52;l.ph[k]=rnd()*6.28;};
  L.forEach(l=>{for(let k=0;k<l.n;k++)spawn(l,k,false);});let fr=0;
  return {L,update(dt,wind,intensity,onLand){fr++;for(const l of L){const active=Math.round(l.n*Math.min(1,intensity*1.1));
      for(let k=0;k<l.n;k++){if(!l.on[k]){if(k<active&&rnd()<dt*2){spawn(l,k,true);l.on[k]=1;}continue;}
        l.z[k]-=l.vz*dt*(.85+.3*Math.sin(l.ph[k]));l.x[k]+=(wind*22*l.wf+Math.sin(l.ph[k]+fr*.05)*4)*dt;
        if(l.z[k]<=0){if(onLand)onLand(l.x[k]|0,l.y[k]|0);if(k<active)spawn(l,k,true);else l.on[k]=0;}
        if(l.x[k]<-25)l.x[k]+=W+45;else if(l.x[k]>W+25)l.x[k]-=W+45;}}},
    draw(u32,shadow=true,occ){for(const l of L){for(let k=0;k<l.n;k++){if(!l.on[k])continue;const gx=l.x[k]|0,gy=l.y[k]|0,x=gx,y=(l.y[k]-l.z[k])|0;
      if(shadow&&l.sz===2&&gx>=0&&gy>=0&&gx<W&&gy<H){const i=gy*W+gx;if(!occ||!occ[i])u32[i]=shadeC(u32[i]);}
      if(x<0||y<0||x>=W-1||y>=H-1)continue;const i=y*W+x;u32[i]=l.col;if(l.sz===2){u32[i+1]=l.col;u32[i+W]=l.col;u32[i+W+1]=COL.FLAKE_F;}}}}};}

reg('hero',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H;const f=Field(W,H,{seed:11});
  buildScene(f,{hx:16,hy:12,hw:46,rh:22,wh:16,trees:[[98,30],[140,58],[18,84],[170,22],[184,96],[120,100]],fences:[[80,70,40]],rocks:[[152,40],[56,94]],paths:[[36,50,42,66]]});
  let wind=-.4;f.bakeExposure(wind);
  for(let i=0;i<f.N;i++)if(f.holds(f.S[i]))f.D[i]=((f.S[i]===2?9:16)*f.SHL[i]+hash2(i,1)*4)|0;
  const fl=Flakes(W,H,[{n:110,vz:14,wf:.6,col:COL.FLAKE_F,sz:1},{n:60,vz:24,wf:1,col:COL.FLAKE,sz:1},{n:20,vz:42,wf:1.5,col:COL.FLAKE,sz:2}]);
  const WP=[[76,60],[150,64],[160,90],[84,98]];const wk={x:76,y:60,wp:1,dist:0,foot:0,an:0};
  let t=0,frame=0,intensity=1,temp=-3,sun=0;
  const depthAt=(x,y)=>{x|=0;y|=0;if(x<1||y<1||x>=W-1||y>=H-1)return 0;const i=y*W+x;return (f.D[i]+f.D[i-1]+f.D[i+1])/3;};
  return {tick(dt){t+=dt;frame++;const c=t%48;let phase;
      if(c<24){phase='Snowing';intensity+=(1-intensity)*Math.min(1,dt*.6);temp+=(-3-temp)*dt*.5;sun+=(0-sun)*dt;}
      else if(c<28){phase='Overcast';intensity+=(0-intensity)*Math.min(1,dt*.8);temp+=(-1-temp)*dt*.5;sun+=(.15-sun)*dt;}
      else{phase='Sunny, melting';intensity+=(0-intensity)*Math.min(1,dt);temp+=(6-temp)*dt*.6;sun+=(1-sun)*dt*.8;}
      for(let s=0;s<2;s++){f.snowfall((260*intensity)|0);f.sandpile(1400);f.melt(560,temp,sun);if(temp>0)f.evap((560*(.3+sun))|0);else f.evap(100);}
      // walker
      const [tx,ty]=WP[wk.wp];const dx=tx-wk.x,dy=ty-wk.y,l=Math.hypot(dx,dy);if(l<1.5)wk.wp=(wk.wp+1)%WP.length;else{const d=depthAt(wk.x,wk.y),slow=1-Math.min(.55,d/170),sp=16*slow*dt;
        wk.x+=dx/l*sp;wk.y+=dy/l*sp;wk.dist+=sp;wk.an+=dt*8*slow;if(wk.dist>4){wk.dist=0;wk.foot^=1;const side=wk.foot?1:-1,horiz=Math.abs(dx)>Math.abs(dy);f.stamp(wk.x+(horiz?0:side*1.5)-1,wk.y+(horiz?side*.8:0)-1,2,2,.3,255);}}
      fl.update(dt,wind,intensity,(x,y)=>{if(x>=0&&y>=0&&x<W&&y<H){const i=y*W+x;if(rnd()<f.E[i])f.deposit(i,2);}});
      f.render(px.u32,{shadow:sun>.3,sparkle:sun>.5,frame});
      drawKid(px.u32,W,H,wk.x,wk.y,Math.min(4,(depthAt(wk.x,wk.y)/22)|0),(wk.an|0));
      fl.draw(px.u32,true);px.put();
      if(frame%15===0)setHud(root,`${phase} · ${temp.toFixed(1)} °C`);}};});

// ======================================================================
// FIG 1: DOOM fire vs its snow analogue
// ======================================================================
reg('doom',root=>{const cvs=$$('canvas',root);const A=PX(cvs[0]),Bx=PX(cvs[1]);const W=A.W,H=A.H;const c=ctl(root);
  // 37-entry fire palette (black -> red -> orange -> yellow -> white), interpolated for this demo
  const stops=[[0,[7,7,7]],[6,[71,15,7]],[12,[143,39,7]],[18,[199,71,7]],[24,[223,111,15]],[28,[215,135,23]],[32,[199,167,47]],[35,[223,223,159]],[36,[255,255,255]]];
  const ramp=(st,n)=>{const p=new Uint32Array(n);for(let i=0;i<n;i++){let a=st[0],b=st[st.length-1];for(let k=0;k<st.length-1;k++)if(i>=st[k][0]&&i<=st[k+1][0]){a=st[k];b=st[k+1];break;}
    const t=b[0]===a[0]?0:(i-a[0])/(b[0]-a[0]);p[i]=pack(lerp(a[1][0],b[1][0],t),lerp(a[1][1],b[1][1],t),lerp(a[1][2],b[1][2],t));}return p;};
  const FP=ramp(stops,37);
  const SP=ramp([[0,hexRGB('#0b1020')],[10,hexRGB('#1d2a52')],[20,hexRGB('#7c86c2')],[28,hexRGB('#c4d1ea')],[36,hexRGB('#f6f9ff')]],37);
  const fire=new Uint8Array(W*H);let fireOn=true;const setSrc=v=>{for(let x=0;x<W;x++)fire[(H-1)*W+x]=v;};setSrc(36);
  const mir=new Uint8Array(W*H);for(let x=0;x<W;x++)mir[x]=36;
  // ground snow field for the analogue
  const f=Field(W,H,{seed:5});for(let y=26;y<=62;y++)for(let x=80;x<=83;x++)f.put(x,y,9,(y%4===0)?COL.FEN_A:COL.FEN_D,10,62,true);
  for(let x=26;x<=54;x++)for(let y=76;y<=78;y++)f.put(x,y,9,y===76?COL.FEN_A:COL.FEN_D,10,78,true);
  f.bakeExposure(-.7);f.bakeShadow();for(let i=0;i<f.N;i++)if(f.holds(f.S[i]))f.D[i]=(9*f.E[i]+hash2(i,7)*5)|0;
  let snowOn=true,sun=false,mode='ground',fr=0;
  c.btn('fire',b=>{fireOn=!fireOn;setSrc(fireOn?36:0);b.textContent=fireOn?'Switch the fire off':'Switch the fire on';});
  c.btn('snow',b=>{snowOn=!snowOn;b.textContent=snowOn?'Stop the snowfall':'Start the snowfall';if(mode==='mirror')for(let x=0;x<W;x++)mir[x]=snowOn?36:0;});
  c.btn('sun',b=>{sun=!sun;b.classList.toggle('on',sun);b.textContent=sun?'Sun is out (melting)':'Let the sun out';});
  c.seg('mode',v=>{mode=v;root.querySelector('[data-cap=ground]').hidden=v!=='ground';root.querySelector('[data-cap=mirror]').hidden=v!=='mirror';
    root.querySelector('[data-b=sun]').disabled=v!=='ground';});
  let acc=0;
  return {tick(dt){acc+=dt;let steps=0;while(acc>1/40&&steps<3){acc-=1/40;steps++;fr++;
      // DOOM PSX fire: every pixel copies the one below it minus 0 or 1, with a sideways offset in {+1,0,-1,-2}
      for(let x=0;x<W;x++)for(let y=1;y<H;y++){const from=y*W+x,p=fire[from];if(p===0){fire[from-W]=0;continue;}const r=(rnd()*3.99)|0;let dst=from-r+1;if(dst<W)dst=W;fire[dst-W]=Math.max(0,p-(r&1));}
      if(mode==='mirror'){for(let x=0;x<W;x++)for(let y=H-2;y>=0;y--){const from=y*W+x,p=mir[from];if(p===0){mir[from+W]=0;continue;}const r=(rnd()*3.99)|0;let dst=from+r-1;if(dst>=W*(H-1))dst=W*(H-1)-1;if(dst<0)dst=0;mir[dst+W]=Math.max(0,p-(r&1));}}
      else{if(snowOn)f.snowfall(260);f.sandpile(1800);if(sun)f.melt(700,6,1);}}
    for(let i=0;i<W*H;i++)A.u32[i]=FP[fire[i]];A.put();
    if(mode==='mirror'){for(let i=0;i<W*H;i++)Bx.u32[i]=SP[mir[i]];}else f.render(Bx.u32,{shadow:sun,frame:fr});Bx.put();}};});

// ======================================================================
// FIG 2: timeline (HTML lanes + list)
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#8d9bbb','#8fd3ff','#9fe3b5','#c6a7ff','#ffb86b','#e9a0d6','#f6f9ff'];
  const X=y=>y<2025?(y-1985)/(2025-1985)*68:72+(y-2025)/(2027-2025)*28;
  let html='<div class="tl-axis">';for(const y of [1990,2000,2010,2020])html+=`<span style="left:${X(y)}%">${y}</span>`;html+=`<span style="left:${X(2025)}%">2025</span><span style="left:${X(2026)}%">2026</span><i class="tl-brk" style="left:70%"></i></div>`;
  const items=[];
  GENS.forEach((g,gi)=>{g.ev.forEach(e=>{if(/not in our notes/.test(e.h))e.y=null;});const ys=g.ev.filter(e=>e.y).map(e=>e.y+e.m/12);const a=Math.min(...ys),b=Math.max(...ys);
    html+=`<div class="tl-lane" data-g="${gi}"><span class="tl-lab">${g.id.replace('Gen ','Gen ')}</span><div class="tl-track"><i class="tl-bar" style="left:${X(a)}%;width:${Math.max(.8,X(b)-X(a))}%;background:${GC[gi]}"></i>`;
    g.ev.forEach((e,ei)=>{const id=`tle-${gi}-${ei}`;items.push({gi,ei,id,e});if(e.y){html+=`<button class="tl-dot" type="button" style="left:${X(e.y+e.m/12)}%;--c:${GC[gi]}" data-id="${id}" aria-label="${e.y}"></button>`;}});
    html+='</div></div>';});
  lanes.innerHTML=html;
  gb.innerHTML='<button type="button" class="on" data-g="all">All generations</button>'+GENS.map((g,gi)=>`<button type="button" data-g="${gi}"><i style="background:${GC[gi]}"></i>${g.id}: ${g.t}</button>`).join('');
  list.innerHTML=items.map(it=>`<li id="${it.id}" data-g="${it.gi}" style="--c:${GC[it.gi]}"><span class="yr">${GENS[it.gi].id}${it.e.y?' · '+it.e.y:''}</span>${it.e.h}</li>`).join('');
  const show=id=>{const it=items.find(i=>i.id===id);if(!it)return;$$('.tl-list li',root).forEach(l=>l.classList.toggle('hl',l.id===id));det.innerHTML=`<b>${GENS[it.gi].id}: ${GENS[it.gi].t}</b> — ${it.e.h}`;};
  lanes.addEventListener('pointerover',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('click',e=>{const d=e.target.closest('.tl-dot');if(d){show(d.dataset.id);}});
  lanes.addEventListener('focusin',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  gb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',gb).forEach(x=>x.classList.toggle('on',x===b));const g=b.dataset.g;
    $$('.tl-list li',root).forEach(l=>l.hidden=!(g==='all'||l.dataset.g===g));$$('.tl-lane',root).forEach(l=>l.classList.toggle('dim',!(g==='all'||l.dataset.g===g)));});
  show(items[items.length-1].id);return {};});

// ======================================================================
// FIG 3: Emerald-style sprite flake list with a sine LUT
// ======================================================================
reg('lut',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);
  const SIN=new Int16Array(256);for(let i=0;i<256;i++)SIN[i]=Math.round(Math.sin(i/256*Math.PI*2)*256); // illustrative amplitude
  const MAX=64;const fl=[];for(let id=0;id<MAX;id++)fl.push({id,x0:0,y:0,dy:0,wi:0,on:false});
  const bg=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const tx=x>>4,ty=y>>4;const n=vnoise(x/20,y/20);let col=n<.45?COL.GR_D:COL.GR_A;
    if(((tx*7+ty*13)%11)===0&&(x&15)>3&&(x&15)<12&&(y&15)>3&&(y&15)<12)col=COL.CAN_B;if(hash2(x,y)<.03)col=COL.GR_T;
    const sn=vnoise(x/30+4,y/30)>.55;if(sn)col=hash2(x+5,y)<.06?COL.MID:COL.BASE;bg[y*W+x]=col;}
  const spawn=f=>{f.x0=((f.id*5)&7)*30+ri(30);f.y=-8*128-ri(H*64);f.dy=(ri(4))*5+64;f.wi=ri(256);};
  let active=0,target=16,fr=0,acc=0,ramping=true;
  const setT=()=>{target=c.v('n');c.out('n',target);};c.on('n',setT);setT();
  c.on('d',()=>c.out('d','±'+(256/c.v('d')).toFixed(0)+' px'));c.out('d','±'+(256/c.v('d')).toFixed(0)+' px');
  c.btn('stop',b=>{ramping=!ramping;b.textContent=ramping?'Stop snowing':'Start snowing';});
  return {tick(dt){acc+=dt;let n=0;while(acc>=1/60&&n<4){acc-=1/60;n++;fr++;
      const goal=ramping?target:0;if(fr%36===0){if(active<goal){spawn(fl[active]);fl[active].on=true;active++;}else if(active>goal){active--;fl[active].on=false;}}
      for(let k=0;k<active;k++){const f=fl[k];f.y+=f.dy;f.wi=(f.wi+((f.id&3)===0?2:1))&255;if(f.y>(H+8)*128){spawn(f);f.y=-8*128;}}}
    const u=px.u32;u.set(bg);const div=c.v('d'),cols=c.v('cols'),lut=c.v('lut');
    if(cols)for(let col=0;col<8;col++){const x0=col*30;for(let y=0;y<H;y+=2)for(let x=x0;x<x0+30&&x<W;x++){if(x===x0)u[y*W+x]=C32('#ffb86b');else if((x+y)%6===0)u[y*W+x]=mix32(u[y*W+x],col&1?C32('#8fd3ff'):C32('#ffb86b'),.35);}}
    for(let k=0;k<active;k++){const f=fl[k];const x=(f.x0+SIN[f.wi]/div)|0,y=(f.y/128)|0;
      for(const [dx,dy,cc] of [[0,-1,COL.FLAKE_F],[-1,0,COL.FLAKE_F],[0,0,COL.FLAKE],[1,0,COL.FLAKE_F],[0,1,COL.FLAKE_F]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H)u[Y*W+X]=cc;}}
    if(lut){const y0=H-26;for(let x=0;x<W;x++)u[(y0+12)*W+x]=mix32(u[(y0+12)*W+x],0,.6);
      for(let i=0;i<256;i++){const x=(i/256*W)|0,y=y0+12-Math.round(SIN[i]/256*10);u[y*W+x]=C32('#8fd3ff');}
      for(let k=0;k<active;k++){const x=(fl[k].wi/256*W)|0,y=y0+12-Math.round(SIN[fl[k].wi]/256*10);for(let d=-1;d<=1;d++){if(x+d>=0&&x+d<W)u[y*W+x+d]=C32('#ffb86b');}}}
    px.put();setHud(root,`flakes on screen ${active}/${ramping?target:0} · +1 every 36 frames`);}};});

// ======================================================================
// FIG 4: palette-cycled flakes (pixels never move; the colour table rotates)
// ======================================================================
reg('cycle',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),strip=$('canvas.pstrip',root),sx=strip.getContext('2d');
  // palette: 0..15 scenery, then three cycling ranges
  const scen=['#0b1020','#111a33','#18244a','#22305e','#2a3f73','#1a3d30','#24553f','#e2eaf6','#c4d1ea','#9eaedb','#3d2a1d','#ffd27a','#8a3b3b','#4a1f27','#f6f9ff','#5a3b28'].map(C32);
  const LENS=[23,29,37],LENS_EQ=[29,29,29];let lens=LENS;
  const SKY=1;// all paths cross sky colour index 1 region
  const IDX=new Uint16Array(W*H);
  const horizon=x=>Math.round(H*.70+Math.sin(x*.06)*4+Math.sin(x*.17)*2);
  const build=()=>{
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let i=SKY;const hz=horizon(x);if(y>=hz)i=y<hz+2?8:(bay(x,y)<6?9:7);IDX[y*W+x]=i;}
    for(let k=0;k<26;k++){const x=ri(W),y=ri(H*.5);IDX[y*W+x]=14;}
    for(let y=8;y<16;y++)for(let x=W-30;x<W-22;x++){const dx=x-(W-26),dy=y-12;if(dx*dx+dy*dy<14)IDX[y*W+x]=8;}
    // cabin
    const cx=40;for(let y=0;y<10;y++)for(let x=-12+ (y>>1);x<=12-(y>>1);x++){const yy=horizon(cx)-6-y,xx=cx+x;if(yy>0)IDX[yy*W+xx]=y===0?13:12;}
    for(let y=0;y<7;y++)for(let x=-9;x<=9;x++){const yy=horizon(cx)-6+y,xx=cx+x;IDX[yy*W+xx]=(x>=-4&&x<=-1&&y>=2&&y<=4)?11:10;}
    for(const tx of [100,116,132]){const base=horizon(tx);for(let k=0;k<16;k++){const hw=Math.round(5*(1-k/16))+1;for(let x=tx-hw;x<=tx+hw;x++)IDX[(base-k)*W+x]=x<tx?6:5;}}
    // snow paths: straight diagonal 1-px lines across the sky; each pixel gets the next index of its range
    let p=0;for(let x0=-30;x0<W+10;x0+=5){const rg=p%3,start=16+[0,23,52][rg],L=lens[rg],slope=.25+((p*7)%5)*.04,ph=ri(L);p++;
      for(let y=0;y<H;y++){const x=Math.round(x0+y*slope);if(x<0||x>=W)continue;const i=y*W+x;if(IDX[i]!==SKY)continue;IDX[i]=start+((y+ph)%L);}}};
  build();
  const pal=new Uint32Array(16+23+29+37);let off=[0,0,0],fr=0,acc=0;
  c.on('eq',()=>{lens=c.v('eq')?LENS_EQ:LENS;build();});
  return {tick(dt){const sp=c.v('sp');c.out('sp',sp.toFixed(1)+'×');acc+=dt*sp;
      while(acc>1/30){acc-=1/30;fr++;off[0]=(off[0]+1)%lens[0];if(fr%2===0)off[1]=(off[1]+1)%lens[1];if(fr%3!==0)off[2]=(off[2]+1)%lens[2];}
      for(let i=0;i<16;i++)pal[i]=scen[i];const sky=scen[SKY];
      [0,23,52].forEach((s,rg)=>{const L=lens[rg];for(let k=0;k<L;k++){const ph=(k+off[rg])%L;let col=sky;if(ph===0)col=rg===2?COL.FLAKE:COL.FLAKE_F;else if(ph===1&&rg===2)col=COL.FLAKE_F;pal[16+s+k]=col;}});
      const rev=c.v('rev');const u=px.u32;
      for(let i=0;i<W*H;i++){const ix=IDX[i];if(rev&&ix>=16){const r=ix-16,rg=r<23?0:r<52?1:2;const k=rg===0?r:rg===1?r-23:r-52;u[i]=pack(60+rg*70,90+(k*9)%120,200-rg*40);}else u[i]=pal[ix];}
      px.put();
      // palette strip: the only thing that changes each frame
      const n=pal.length;for(let i=0;i<n;i++){sx.fillStyle=css(pal[i]);sx.fillRect(i,0,1,1);}
      setHud(root,`pixel writes per frame: 0 · palette entries rotated: ${lens[0]+lens[1]+lens[2]}`);}};});

// ======================================================================
// FIG 5: stateless hashed-cell layers (per-pixel, no flake list)
// ======================================================================
reg('hashed',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);
  const CELL=[26,17,11,8,6],FALL=[30,20,13,9,6],RAD=[1.25,.8,.75,.7,.65],PAR=[1,.75,.5,.35,.2];
  const COLS=[COL.FLAKE,COL.HI,C32('#c9d6ee'),C32('#9eaedb'),C32('#7c86c2')];
  const bg=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/16,y/12);bg[y*W+x]=y>H*.62?(n>.5?C32('#22305e'):C32('#1a2750')):mix32(C32('#0b1020'),C32('#18244a'),y/H);}
  let t=0,grid=0;c.seg('grid',v=>grid=+v);
  return {tick(dt){t+=dt;const nL=c.v('layers'),wind=c.v('wind')/100,step=!c.v('smooth');c.out('layers',nL);c.out('wind',wind.toFixed(2));
      const u=px.u32;u.set(bg);
      for(let i=nL-1;i>=0;i--){const cell=CELL[i],ox=wind*t*22*PAR[i],oy=-t*FALL[i];
        for(let y=0;y<H;y++){const qy=(y+oy)/cell,iy=Math.floor(qy),fy=qy-iy;
          for(let x=0;x<W;x++){const qx=(x+ox+i*37)/cell,ix=Math.floor(qx),fx=qx-ix;
            const h1=hash2(ix+i*17,iy),h2=hash2(ix,iy+i*31);const pxx=.15+.7*h1,pyy=.15+.7*h2;
            const dx=(fx-pxx)*cell,dy=(fy-pyy)*cell,d=Math.sqrt(dx*dx+dy*dy);
            if(step){if(d<RAD[i])u[y*W+x]=COLS[i];}else{const a=clamp(1-(d-RAD[i]+.9)/1.8,0,1);if(a>0)u[y*W+x]=mix32(u[y*W+x],COLS[i],a);}
            if(grid&&grid-1===i&&(fx*cell<1||fy*cell<1))u[y*W+x]=mix32(u[y*W+x],C32('#ffb86b'),.55);}}}
      px.put();setHud(root,`${W*H*nL|0} hash tests/frame · flakes stored: 0`);}};});
