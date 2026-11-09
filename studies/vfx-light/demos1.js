// ======================================================================
// HERO: the Sandbox village cycling day -> golden hour -> night
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),F=PX(cv),V=mkVillage(777),tiers=$$('.hero-tiers button',root);
  let hour=reduce?17.6:15.8,t=0,fr=0;V.setCarried('torch');const P=V.player;P.x=64;P.y=100;
  const WP=[[118,100],[150,112],[200,116],[222,120],[200,112],[150,108],[118,100],[64,100],[62,126],[64,100]];let wi=-1;
  tiers.forEach(b=>b.addEventListener('click',()=>{hour=+b.dataset.h;}));
  const rate=h=>{const el=sunEl(h);return Math.abs(el)<14?.17:(el<-30||el>40)?.75:.36;};
  return {tick(dt){t+=dt;fr++;if(motion)hour=(hour+dt*rate(hour))%24;
    if(P.tx===null||P.tx===undefined){wi=(wi+1)%WP.length;[P.tx,P.ty]=WP[wi];}
    V.update(dt,{hour,speed:22});
    const r=V.render(F.u32,320,180,0,0,{hour,t,mode:'banded',shadows:true,sunsh:true,refl:true});F.put();
    const el=sunEl(hour),ph=el>6?0:el>0?1:el>-12?2:3;tiers.forEach(b=>b.classList.toggle('on',+b.dataset.t===ph));
    if(fr%8===0)setHud(root,`${fmtH(hour)} · sun ${el>0?Math.round(el)+'°':'below horizon'} · ${r.nOn} lights, ${r.nSh} shadowed · ${r.rays} re-casts`);}};});

// ======================================================================
// Fig: DOOM fire next to DOOM sector light through a 32-row COLORMAP
// ======================================================================
reg('doom',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),T=PX(cvs[2]),c=ctl(root),ro=$('[data-ro]',root);const W=A.W,H=A.H,N=W*H;
  const RGB=[0x07,0x07,0x07,0x1F,0x07,0x07,0x2F,0x0F,0x07,0x47,0x0F,0x07,0x57,0x17,0x07,0x67,0x1F,0x07,0x77,0x1F,0x07,0x8F,0x27,0x07,0x9F,0x2F,0x07,0xAF,0x3F,0x07,0xBF,0x47,0x07,0xC7,0x47,0x07,0xDF,0x4F,0x07,0xDF,0x57,0x07,0xDF,0x57,0x07,0xD7,0x5F,0x07,0xD7,0x5F,0x07,0xD7,0x67,0x0F,0xCF,0x6F,0x0F,0xCF,0x77,0x0F,0xCF,0x7F,0x0F,0xCF,0x87,0x17,0xC7,0x87,0x17,0xC7,0x8F,0x17,0xC7,0x97,0x1F,0xBF,0x9F,0x1F,0xBF,0x9F,0x1F,0xBF,0xA7,0x27,0xBF,0xA7,0x27,0xBF,0xAF,0x2F,0xB7,0xAF,0x2F,0xB7,0xB7,0x2F,0xB7,0xB7,0x37,0xCF,0xCF,0x6F,0xDF,0xDF,0x9F,0xEF,0xEF,0xC7,0xFF,0xFF,0xFF];
  const FP=[];for(let i=0;i<37;i++)FP.push(pack(RGB[i*3],RGB[i*3+1],RGB[i*3+2]));
  const Fi=new Uint8Array(N);for(let x=0;x<W;x++)Fi[(H-1)*W+x]=36;
  function stepFire(){for(let x=0;x<W;x++)for(let y=1;y<H;y++){const src=y*W+x,p=Fi[src];if(p===0){Fi[src-W]=0;continue;}const rr=(rnd()*3.999)|0;const dst=src-rr+1;if(dst-W>=0)Fi[dst-W]=Math.max(0,p-(rr&1));}}
  // illustrative 64-colour palette: 8 ramps of 8; grey ramp contains #939393 (Hexen's index 23 colour)
  const RAMPS=[['#f0f0f0','#939393','#202020'],['#e8c090','#9a6a3a','#2a1608'],['#a8e070','#4f8f3e','#0e2a0a'],['#ff9a8a','#b8302a','#300806'],['#a8c8ff','#3c5ea8','#0a1230'],['#fff0a0','#ff8a20','#3a1004'],['#e0b0ff','#7a4aa8','#1e0a30'],['#f8d8b8','#b08060','#3a2418']];
  const PAL=[];for(const [a,m,b] of RAMPS){const A3=hexf(a),M3=hexf(m),B3=hexf(b);for(let k=0;k<8;k++){const t=k/7;const c3=t<.5?lerp3(A3,M3,t*2):lerp3(M3,B3,(t-.5)*2);PAL.push(c3.map(v=>v*255));}}
  PAL[1*0+2]=[0x93,0x93,0x93];
  const near=(r,g,b)=>{let bi=0,bd=1e9;for(let i=0;i<64;i++){const p=PAL[i],d=(p[0]-r)**2+(p[1]-g)**2*1.3+(p[2]-b)**2*.8;if(d<bd){bd=d;bi=i;}}return bi;};
  const FADES={black:[0,0,0],fog:[0x93,0x93,0x93],white:[252,252,252]};const CMS={};
  function cmapFor(f){if(CMS[f])return CMS[f];const T0=FADES[f],cm=new Uint8Array(33*64);for(let m=0;m<32;m++)for(let i=0;i<64;i++){const p=PAL[i],k=m/32;cm[m*64+i]=near(p[0]*(1-k)+T0[0]*k,p[1]*(1-k)+T0[1]*k,p[2]*(1-k)+T0[2]*k);}
    for(let i=0;i<64;i++){const p=PAL[i],gr=255-(p[0]*.3+p[1]*.55+p[2]*.15);cm[32*64+i]=near(gr,gr,gr);}return CMS[f]=cm;}
  // the room: index + axis (1 = wall running along x, 2 = along y) + fullbright flag
  const IX=new Uint8Array(N),AX=new Uint8Array(N),FB=new Uint8Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const tile=((x>>3)+(y>>3))&1;let id=(tile?2:3)+(hash2(x,y)<.12?1:0);
    if(x>=70&&x<=74&&y<54){id=8+2+((y>>2)&1);AX[i]=2;}if(y<8||y>=H-6){id=8+1+(((x>>2)+(y>>2))&1);AX[i]=1;}if(x<6||x>=W-6){id=8+1+((y>>2)&1);AX[i]=2;}
    if(x>=82&&x<=114&&y>=58&&y<=80){id=(x===82||x===114||y===58||y===80)?24+5:24+3;}
    const dx=(x-36)/16,dy=(y-64)/10;if(dx*dx+dy*dy<1)id=16+3+(hash2(x>>1,y>>1)<.3?1:0);
    IX[i]=id;}
  const torches=[[20,10],[100,10],[72,58]];for(const [tx,ty] of torches){for(let k=0;k<5;k++){const x=tx+(k%2),y=ty+((k/2)|0);const i=y*W+x;IX[i]=40+(k<2?0:1);FB[i]=1;}}
  for(let y=30;y<=38;y++)for(let x=96;x<=104;x++){if(Math.abs(x-100)+Math.abs(y-34)<5){IX[y*W+x]=32+1+((x+y)&1);}}
  let vx=W*.42,vy=H*.55;pointer(cvs[1],([x,y],k)=>{if(k==='leave')return;vx=x;vy=y;});
  const used=new Uint8Array(33);let fr=0,acc=0;if(reduce)for(let k=0;k<80;k++)stepFire();
  function drawTable(cm,f){const u=T.u32;u.fill(pack(14,12,18));for(let m=0;m<33;m++)for(let i=0;i<64;i++){const p=PAL[cm[m*64+i]];const dim=(m===32||used[m])?1:.3;const col=pack(p[0]*dim,p[1]*dim,p[2]*dim);
      const y=m===32?34:m;for(let xx=0;xx<4;xx++)u[y*256+i*4+xx]=col;}T.put();}
  return {tick(dt){fr++;acc+=dt*30;let n=0;while(acc>=1&&n<3){stepFire();acc--;n++;}const ua=A.u32;for(let i=0;i<N;i++)ua[i]=FP[Fi[i]];A.put();
    const lev=c.v('lev'),dist=c.v('dist'),fake=c.v('fake'),full=c.v('full'),fade=c.segv('fade');const cm=cmapFor(fade);c.out('lev',lev);
    const level=lev>>4,start=(15-level)*4;used.fill(0);let mn=99,mx=-1;const ub=B.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let L=level;if(fake&&AX[i])L=clamp(L+(AX[i]===1?-1:1),0,15);let m=(15-L)*4;
      if(dist){const d=Math.hypot(x-vx,y-vy),nearv=48*8/(d+8);m=m-Math.floor(nearv/2);}m=clamp(m,0,31);if(full&&FB[i])m=0;used[m]=1;if(m<mn)mn=m;if(m>mx)mx=m;
      const p=PAL[cm[m*64+IX[i]]];ub[i]=pack(p[0],p[1],p[2]);}
    B.put();if(fr%3===0)drawTable(cm,fade);
    if(fr%6===0){setHud(root,`level ${level} · maps ${mn}–${mx}`);
      ro.innerHTML=`sector byte <b>${lev}</b> → ${lev} &gt;&gt; 4 = level <b>${level}</b> → startmap = (15 − ${level}) × 4 = <b>${start}</b>${start>31?' (clamped to 31)':''} · ${dist?'nearer pixels step back toward brighter rows':'no distance term: one row for the whole floor'} · rows in use this frame: <b>${mn}–${mx}</b> of 32 · cost: one table fetch per pixel, 34 × 256 = 8,704 bytes of tables`;}}};});

// ======================================================================
// Fig: albedo x light map, term by term (Sandbox village crop)
// ======================================================================
reg('compose',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root),V=mkVillage(777);const X0=40,Y0=70;
  let view='final',hour=17.6,mode='banded',t=0,fr=0,hov=null;V.npc.show=true;V.player.x=150;V.player.y=118;
  c.seg('view',v=>view=v);c.seg('hour',v=>hour=+v);c.seg('mode',v=>mode=v);
  pointer(cv,([x,y],k)=>{hov=k==='leave'?null:[x|0,y|0];});
  const f3=a=>a.map(v=>v.toFixed(2)).join(', ');
  return {tick(dt){t+=dt;fr++;V.update(dt,{hour});const r=V.render(F.u32,160,90,X0,Y0,{hour,t,mode,view});F.put();
    if(fr%6===0){setHud(root,`${fmtH(hour)} · ${({albedo:'albedo only',amb:'albedo × sky',sunv:'albedo × (sky + sun)',pts:'albedo × point lights',light:'the light map itself',final:'final'})[view]}`);
      if(hov){const s=V.sample(X0+hov[0],Y0+hov[1]),S=r.S;const sun=s.sh?[0,0,0]:S.sun;const L=[0,1,2].map(k=>S.amb[k]+sun[k]+s.pt[k]);const out=s.alb.map((v,k)=>Math.min(255,v*L[k]));
        ro.innerHTML=s.emis?'Emissive pixel: flames, lit windows and lamp heads bypass lighting.':`albedo <span class="swatch" style="background:${rgbCss(...s.alb)}"></span> (${s.alb.map(v=>v|0).join(',')}) × [sky (${f3(S.amb)}) + sun ${s.sh?'<b>blocked</b>':'('+f3(S.sun)+')'} + lamps (${f3(s.pt)})] = light (${f3(L)}) → <span class="swatch" style="background:${rgbCss(...out)}"></span> (${out.map(v=>v|0).join(',')}) · blue/red of the light: <b>${(L[2]/Math.max(.01,L[0])).toFixed(2)}</b> ${L[2]>L[0]?'(cool)':'(warm)'}`;}}}};});

// ======================================================================
// Timeline (lanes + list)
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#9e94ad','#ffc870','#e08a3a','#8ea8ff'];
  const X=y=>y<1990?(y-1855)/135*24:y<2023?26+(y-1990)/33*44:72+(y-2023)/3.6*27;
  let h='<div class="tl-axis">';for(const y of [1860,1940,2000,2010,2020])h+=`<span style="left:${X(y)}%">${y}</span>`;h+=`<span style="left:${X(2024)}%">2024</span><span style="left:${X(2025.5)}%">2025</span><span style="left:${X(2026.5)}%">2026</span><i class="tl-brk" style="left:70.9%"></i><i class="tl-brk" style="left:24.9%"></i></div>`;
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
  const pick=items.find(i=>/DOOM/.test(i.e.h))||items[0];show(pick.id);return {};});

// ======================================================================
// A4: Tibia per-tile light texture, max vs add, world light ramp, burn-down
// ======================================================================
reg('tibia',root=>{const cvs=$$('canvas',root),M=PX(cvs[0]),T=PX(cvs[1]),c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);const TW=20,TH=15,TS=8,W=M.W,H=M.H;
  const cube=ci=>[((ci/36|0)%6)*51,((ci/6|0)%6)*51,(ci%6)*51];
  const KIND={torch:{r:7,c:206,n:'Lit Torch'},lamp:{r:6,c:199,n:'Lamp'},cand:{r:6,c:206,n:'Candelabrum'},lava:{r:4,c:193,n:'Lava'}};
  // base map (illustrative tiles)
  const base=new Uint32Array(W*H);
  for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){let kind='grass';if(ty===7||tx===9)kind='road';if(tx>=14&&ty>=9)kind='water';if(tx>=2&&tx<=6&&ty>=2&&ty<=5)kind=(tx===2||tx===6||ty===2||ty===5)?'wall':'floor';if(tx>=14&&tx<=18&&ty<=3)kind=(tx===14||tx===18||ty===3)?'wall':'floor';
    for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){const px=tx*TS+x,py=ty*TS+y,h=hash2(px,py);let col;
      if(kind==='grass')col=h<.5?U('#4f8a3e'):h<.9?U('#5e9a48'):U('#7ab25a');else if(kind==='road')col=((x+y*3)%7===0)?U('#6e6a63'):h<.5?U('#a8a296'):U('#968f82');
      else if(kind==='water')col=((x+((y>>1)&1)*2)%5===0)?U('#6aa8d8'):U('#2c5e86');else if(kind==='wall')col=(y===0||y===4)?U('#5a4a3a'):U('#8a7458');else col=(x===0||y===0)?U('#6a4e30'):U('#9a7448');
      base[py*W+px]=col;}}
  const B3=new Float32Array(W*H*3);for(let i=0;i<W*H;i++){const u=un32(base[i]);B3[i*3]=u[0];B3[i*3+1]=u[1];B3[i*3+2]=u[2];}
  let lights=[{x:4,y:9,k:'torch'},{x:11,y:4,k:'lamp'},{x:16,y:11,k:'lava'},{x:4,y:3,k:'cand'}];
  let put='torch',blend='max',hour=21,burn=null,uploads=0,lastHash='',skipped=0,t=0;
  c.seg('put',v=>put=v);c.seg('blend',v=>blend=v);
  c.btn('burn',()=>{lights=lights.filter(l=>!l.burn);const L={x:9,y:7,k:'torch',burn:1,r:7,age:0};lights.push(L);burn=L;});
  pointer(cvs[0],([x,y],k)=>{if(k!=='down')return;const tx=x/TS|0,ty=y/TS|0;const j=lights.findIndex(l=>l.x===tx&&l.y===ty);if(j>=0)lights.splice(j,1);else lights.push({x:tx,y:ty,k:put});});
  const TX=new Float32Array(TW*TH*3);
  // world light chart
  const cx=h=>24+h/24*262,cy=v=>100-v/255*84;
  function chart(){svg.innerHTML='';for(const v of [40,250]){svgEl('line',{x1:24,x2:286,y1:cy(v),y2:cy(v),class:'gl'},svg);svgText(svg,2,cy(v)+4,String(v),{'font-size':10});}
    for(const h of [0,6,8,12,18,20,24]){svgEl('line',{x1:cx(h),x2:cx(h),y1:14,y2:100,class:'gl'},svg);svgText(svg,cx(h),112,String(h).padStart(2,'0'),{'font-size':9.5,'text-anchor':'middle'});}
    const pts=[];for(let m=0;m<=1440;m+=10)pts.push([cx(m/60),cy(tfsLight(m))]);poly(svg,pts,{class:'s1'});
    svgEl('line',{x1:cx(hour),x2:cx(hour),y1:12,y2:100,class:'now'},svg);svgEl('circle',{cx:cx(hour),cy:cy(tfsLight(hour*60)),r:4,fill:'#8ea8ff'},svg);
    svgText(svg,cx(hour)+(hour>18?-4:4),11,`${fmtH(hour)} → ${Math.round(tfsLight(hour*60))}`,{'font-size':10,class:'c','text-anchor':hour>18?'end':'start'});
    const hit=svgEl('rect',{x:24,y:0,width:262,height:120,fill:'transparent',class:'drag'},svg);
    const set=e=>{const r=svg.getBoundingClientRect();hour=clamp(((e.clientX-r.left)/r.width*300-24)/262*24,0,23.99);chart();};
    hit.addEventListener('pointerdown',e=>{set(e);hit.setPointerCapture(e.pointerId);});hit.addEventListener('pointermove',e=>{if(e.buttons)set(e);});}
  chart();let fr=0;
  return {tick(dt){t+=dt;fr++;
    if(burn){burn.age+=dt;const a=burn.age;burn.r=a<10?7:a<15?6:a<20?5:0;if(!burn.r){lights=lights.filter(l=>l!==burn);burn=null;}}
    const wl=tfsLight(hour*60),g=wl/255;const skipAll=wl>=250;
    const hash=JSON.stringify([lights.map(l=>[l.x,l.y,l.k,l.r]),Math.round(wl),blend]);if(hash!==lastHash){lastHash=hash;uploads++;}else skipped++;
    for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){let r=255*g,gg=255*g,b=255*g;
      if(!skipAll)for(const L of lights){const K=KIND[L.k],rad=L.r||K.r,col=cube(K.c);const d=Math.hypot(tx-L.x,ty-L.y);let I=Math.min(1,(rad-d)*.2);if(I<.01)continue;
        if(blend==='max'){r=Math.max(r,col[0]*I);gg=Math.max(gg,col[1]*I);b=Math.max(b,col[2]*I);}else{r+=col[0]*I;gg+=col[1]*I;b+=col[2]*I;}}
      const i=(ty*TW+tx)*3;TX[i]=r;TX[i+1]=gg;TX[i+2]=b;T.u32[ty*TW+tx]=pack(r,gg,b);}
    T.put();const bil=c.v('bil');const u=M.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let fx=(x+.5)/TS-.5,fy=(y+.5)/TS-.5;let lr,lg,lb;
      if(bil){fx=clamp(fx,0,TW-1.001);fy=clamp(fy,0,TH-1.001);const x0=fx|0,y0=fy|0,ax=fx-x0,ay=fy-y0,i00=(y0*TW+x0)*3,i10=i00+3,i01=i00+TW*3,i11=i01+3;
        lr=(TX[i00]*(1-ax)+TX[i10]*ax)*(1-ay)+(TX[i01]*(1-ax)+TX[i11]*ax)*ay;lg=(TX[i00+1]*(1-ax)+TX[i10+1]*ax)*(1-ay)+(TX[i01+1]*(1-ax)+TX[i11+1]*ax)*ay;lb=(TX[i00+2]*(1-ax)+TX[i10+2]*ax)*(1-ay)+(TX[i01+2]*(1-ax)+TX[i11+2]*ax)*ay;}
      else{const i=((y/TS|0)*TW+(x/TS|0))*3;lr=TX[i];lg=TX[i+1];lb=TX[i+2];}
      const j=y*W+x;u[j]=pack(B3[j*3]*lr/255,B3[j*3+1]*lg/255,B3[j*3+2]*lb/255);}
    for(const L of lights){const px=L.x*TS+3,py=L.y*TS+2;const col=L.k==='lava'?U('#ff8a3a'):U('#fff0a0');for(let k=0;k<4;k++){const xx=px+(k&1),yy=py+(k>>1)+(L.k==='lava'?2:0);u[yy*W+xx]=col;}u[(py+2)*W+px]=U('#6a4a32');}
    M.put();
    if(fr%6===0){setHud(root,`world light ${Math.round(wl)}${skipAll?' · ≥ 250: lights skipped':''}`);
      ro.innerHTML=`${lights.length} lights · ${blend==='max'?'r = max(r, colour·I)':'r = r + colour·I (clamped at display)'} per channel · 20 × 15 = <b>300 texels</b> per screen · uploads on hash change: <b>${uploads}</b>, frames reused: ${skipped}${burn?` · burning torch: radius <b>${burn.r}</b> (${burn.r===7?'Lit':burn.r===6?'Medium':'Small'}), ${(20-burn.age).toFixed(0)} s left`:''}`;}}};});

// ======================================================================
// A5: flood-fill light (Minecraft) with removal BFS, sky remap, Terraria-style sweeps
// ======================================================================
reg('flood',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),TB=PX(cvs[1]),c=ctl(root),ro=$('[data-ro]',root);const GW=24,GH=16,CS=8,NC=GW*GH;
  const cell=new Uint8Array(NC);// 0 open air, 1 wall, 2 roofed air
  for(let y=3;y<=12;y++)for(let x=12;x<=22;x++){cell[y*GW+x]=(x===12||x===22||y===3||y===12)?1:2;}for(let y=3;y<=12;y++)cell[y*GW+17]=1;cell[8*GW+12]=2;cell[6*GW+17]=2;cell[12*GW+20]=2;
  for(let x=2;x<=6;x++)cell[11*GW+x]=1;
  let torches=[[4,6],[15,9],[20,5]];
  const blk=new Uint8Array(NC),sky=new Uint8Array(NC);let steps=0,lastSteps=0,phase='',mark=new Uint8Array(NC),remQ=[],relQ=[],skyVal=4,mode='mc',tcol='#FFF2CC';
  const RGBL=new Float32Array(NC*3);const tCols=new Map();
  const nb=i=>{const x=i%GW,y=i/GW|0,o=[];if(x>0)o.push(i-1);if(x<GW-1)o.push(i+1);if(y>0)o.push(i-GW);if(y<GH-1)o.push(i+GW);return o;};
  function bfs(lv,seeds){const q=seeds.slice();let s=0;while(q.length){const i=q.shift();s++;for(const n of nb(i)){if(cell[n]===1)continue;if(lv[n]+2<=lv[i]){lv[n]=lv[i]-1;q.push(n);}}}return s;}
  function fullMC(){blk.fill(0);sky.fill(0);const sd=[];for(const [x,y] of torches){const i=y*GW+x;if(cell[i]!==1){blk[i]=14;sd.push(i);}}let s=bfs(blk,sd);const ss=[];for(let i=0;i<NC;i++)if(cell[i]===0){sky[i]=15;ss.push(i);}s+=bfs(sky,ss);return s;}
  function fullTR(){RGBL.fill(0);for(const [x,y] of torches){const i=y*GW+x;const col=hexf(tCols.get(x+','+y)||'#FFF2CC');RGBL[i*3]=col[0];RGBL[i*3+1]=col[1];RGBL[i*3+2]=col[2];}
    const dec=i=>cell[i]===1?.56:.91;let s=0;const sweep=(i,j)=>{s++;for(let k=0;k<3;k++){const v=RGBL[j*3+k]*dec(i);if(v>RGBL[i*3+k])RGBL[i*3+k]=v;}};
    for(let y=0;y<GH;y++){for(let x=1;x<GW;x++)sweep(y*GW+x,y*GW+x-1);for(let x=GW-2;x>=0;x--)sweep(y*GW+x,y*GW+x+1);}
    for(let x=0;x<GW;x++){for(let y=1;y<GH;y++)sweep(y*GW+x,(y-1)*GW+x);for(let y=GH-2;y>=0;y--)sweep(y*GW+x,(y+1)*GW+x);}
    for(let i=0;i<NC*3;i++)if(RGBL[i]<.0185)RGBL[i]=0;return s;}
  function recompute(){lastSteps=mode==='mc'?fullMC():fullTR();phase='';mark.fill(0);}
  recompute();
  c.seg('mode',v=>{mode=v;recompute();});c.seg('sky',v=>{skyVal=+v;lastSteps=0;});c.seg('tcol',v=>tcol=v);
  pointer(cvs[0],([x,y],k)=>{if(k!=='down'&&k!=='drag')return;const gx=x/CS|0,gy=y/CS|0;if(gx<0||gy<0||gx>=GW||gy>=GH)return;const i=gy*GW+gx;const tool=c.segv('tool');const ti=torches.findIndex(([a,b])=>a===gx&&b===gy);
    if(tool==='torch'&&k==='down'){if(ti>=0)return;if(cell[i]===1)cell[i]=0;torches.push([gx,gy]);tCols.set(gx+','+gy,tcol);
      if(mode==='mc'&&!phase){blk[i]=14;lastSteps=bfs(blk,[i]);}else recompute();}
    else if(tool==='erase'&&ti>=0&&k==='down'){torches.splice(ti,1);if(mode==='mc'&&!phase){const lv=blk[i];blk[i]=0;remQ=[[i,lv]];relQ=[];phase='unlight';mark.fill(0);mark[i]=1;lastSteps=0;}else recompute();}
    else if(tool==='wall'&&cell[i]!==1&&ti<0){cell[i]=1;recompute();}
    else if(tool==='roof'&&cell[i]===0){cell[i]=2;recompute();}
    else if(tool==='erase'&&cell[i]!==0&&ti<0){cell[i]=0;recompute();}});
  function animStep(){for(let k=0;k<3;k++){if(phase==='unlight'){if(!remQ.length){phase='relight';continue;}const [i,lv]=remQ.shift();lastSteps++;
        for(const n of nb(i)){if(cell[n]===1)continue;if(blk[n]!==0&&blk[n]<lv){remQ.push([n,blk[n]]);blk[n]=0;mark[n]=1;}else if(blk[n]>=lv)relQ.push(n);}}
      else if(phase==='relight'){if(!relQ.length){phase='';continue;}const i=relQ.shift();lastSteps++;for(const n of nb(i)){if(cell[n]===1)continue;if(blk[n]+2<=blk[i]){blk[n]=blk[i]-1;relQ.push(n);mark[n]=2;}}}}}
  const ALB=i=>{const x=i%GW,y=i/GW|0;if(cell[i]===1)return [120,104,96];if(cell[i]===2)return (x+y)&1?[150,118,80]:[138,108,72];return hash2(x,y)<.5?[96,150,76]:[110,162,84];};
  const blockCol=b=>{if(!b)return [0,0,0];const v=Math.pow(.8,15-b);return [v,v*.86,v*.62];};
  const skyCol=(s,sv)=>{const e=Math.max(0,s-(15-sv));if(!e)return [0,0,0];const v=Math.pow(.8,15-e),k=(sv-4)/11;return [v*lerp(.55,1,k),v*lerp(.62,1,k),v];};
  let fr=0,acc=0;
  return {tick(dt){fr++;if(phase){acc+=dt*24;while(acc>=1){animStep();acc--;}}
    const u=F.u32,num=c.v('num')&&mode==='mc';
    const lightAt=i=>{if(mode==='mc'){const bc=blockCol(blk[i]),sc=skyCol(sky[i],skyVal);return [Math.max(bc[0],sc[0]),Math.max(bc[1],sc[1]),Math.max(bc[2],sc[2])];}
      const sv=(skyVal-4)/11*.9+.1,o=cell[i]===0?sv:0;return [Math.max(RGBL[i*3],o*.8),Math.max(RGBL[i*3+1],o*.85),Math.max(RGBL[i*3+2],o)];};
    for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx,a=ALB(i);let L=lightAt(i);
      if(cell[i]===1){L=[0,0,0];for(const n of nb(i)){if(cell[n]===1)continue;const q=lightAt(n);L=[Math.max(L[0],q[0]),Math.max(L[1],q[1]),Math.max(L[2],q[2])];}}
      let col=pack(a[0]*Math.max(L[0],.04),a[1]*Math.max(L[1],.04),a[2]*Math.max(L[2],.05));if(mark[i]===1&&phase)col=mix32(col,U('#ff4a3a'),.55);else if(mark[i]===2&&phase)col=mix32(col,U('#4a7aff'),.45);
      for(let y=0;y<CS;y++)for(let x=0;x<CS;x++){let cc=col;if(cell[i]===1&&(y===0||x===0))cc=mulc(col,.8,.8,.8);if(cell[i]===2&&x===CS-1&&y===CS-1)cc=mulc(col,.85,.85,.85);u[(gy*CS+y)*192+gx*CS+x]=cc;}
      if(num&&cell[i]!==1){const v=Math.max(blk[i],Math.max(0,sky[i]-(15-skyVal)));const lum=(L[0]+L[1]+L[2])/3;digits(u,192,128,gx*CS+(v>9?0:2),gy*CS+1,v,lum>.45?U('#1a1420'):U('#f4eefa'));}}
    for(const [x,y] of torches){const px=x*CS+3,py=y*CS+2;const col=mode==='tr'?U(tCols.get(x+','+y)||'#FFF2CC'):U('#fff0a0');u[py*192+px]=col;u[py*192+px+1]=col;u[(py+1)*192+px]=col;u[(py+1)*192+px+1]=col;u[(py+2)*192+px]=U('#6a4a32');u[(py+3)*192+px]=U('#6a4a32');}
    F.put();
    for(let b=0;b<16;b++)for(let s=0;s<16;s++){const bc=blockCol(b),sc=skyCol(s,skyVal);TB.u32[(15-b)*16+s]=pack(Math.max(bc[0],sc[0])*255,Math.max(bc[1],sc[1])*255,Math.max(bc[2],sc[2])*255);}TB.put();
    if(fr%6===0){setHud(root,mode==='mc'?`sky value ${skyVal} · ${phase?phase+' pass':'idle'}`:`sky ${skyVal} · 4 sweeps`);
      ro.innerHTML=mode==='mc'?`last change cost <b>${lastSteps}</b> BFS steps${phase?` (${phase==='unlight'?'clearing what the torch lit':'re-seeding from neighbours'})`:''} · a level-L source touches 2L² − 2L + 1 tiles, so a level-8 one reaches 113 · changing the sky value costs <b>0</b> steps: only the 16×16 table is re-read`:
        `4 sweeps over 24 × 16 = <b>${lastSteps}</b> cell updates (4·W·H) regardless of the number of lights · light below 1.85 % is cut off · decay 0.91 per tile in air, 0.56 in walls [U]`;}}};});
