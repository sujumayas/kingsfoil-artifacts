// ======================================================================
// 6a: system-impact grid with tiny live icons
// ======================================================================
const techLinks=s=>s.replace(/`([^`]*)`/g,'<code>$1</code>').replace(/([A-H])(\d)–\1?([A-H]?)(\d)/g,(m,a,b,c2,d)=>{const L=[];for(let k=+b;k<=+d;k++)L.push(a+k);return L.join(', ');}).replace(/\b([A-H]\d)\b/g,'<a href="#t-$1">$1</a>').replace(/href="#t-([A-H]\d)"/g,(m,id)=>`href="#t-${id.toLowerCase()}"`);
reg('systems',root=>{const grid=$('[data-grid]',root),det=$('[data-det]',root),fl=$('[data-sysf]',root);
  const CAT=['vis','vis','vis','vis','play','play','play','play','play','play','vis','tech','tech','tech'];
  grid.innerHTML=SYSROWS.map((r,i)=>`<button type="button" class="sys" data-i="${i}" data-c="${CAT[i]}"><canvas width="48" height="16" aria-hidden="true"></canvas><b>${r.s}</b><small>${r.what}</small></button>`).join('');
  const btns=$$('.sys',grid),P=btns.map(b=>PX($('canvas',b)));let sel=0,t=0,fr=0;
  const show=i=>{sel=i;btns.forEach((b,k)=>b.classList.toggle('on',k===i));const r=SYSROWS[i];det.innerHTML=`<b>${r.s}</b> — ${r.what}<br>Techniques: ${techLinks(r.tech)} · Starting numbers: ${r.num} ${r.src}`;};
  grid.addEventListener('click',e=>{const b=e.target.closest('.sys');if(b)show(+b.dataset.i);});
  fl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',fl).forEach(x=>x.classList.toggle('on',x===b));const f=b.dataset.f;btns.forEach(x=>x.hidden=!(f==='all'||x.dataset.c===f));});
  show(0);const BG=C32('#0e1620'),RN=P32(RNN),RF2=P32(RNF),WT=P32(WA[1]),OR=C32('#ffa040'),BL=C32('#6c9cc4'),WH=C32('#ffffff'),GRc=P32(GR[1]),GRw=W32(GR[1]),DIc=P32(DI[0]);
  return {tick(dt){t+=dt;fr++;if(fr%2)return;
    P.forEach((p,k)=>{if(btns[k].hidden)return;const u=p.u32,W=48,H=16;u.fill(BG);const set=(x,y,c)=>{x|=0;y|=0;if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=c;};
      switch(k){
        case 0:{const fl2=(t%3)<.12;for(let i=0;i<W*H;i++){const y=(i/W)|0;u[i]=fl2?mix32(C32('#3a4f6a'),WH,.5):mix32(C32('#5f7da0'),C32('#1e2a3a'),y/H);}break;}
        case 1:for(let n=0;n<14;n++){const x=(n*7+t*30)%W,y=(n*5+t*90)%H;for(let s=0;s<3;s++)set(x-s*.5,y-s,s?RF2:RN);}break;
        case 2:{const lv=(Math.sin(t*.8)*.5+.5)*255;for(let y=0;y<H;y++)for(let x=0;x<W;x++)u[y*W+x]=lv>4+bay(x,y)*9+hash2(x,y)*40?GRw:GRc;break;}
        case 3:{for(let x=0;x<W;x++)set(x,0,P32(RF[1]));for(let n=0;n<5;n++){const x=4+n*9,y=((t*14+n*5)%16);set(x,y,RN);set(x,y-1,RF2);}break;}
        case 4:{const a=(Math.sin(t*1.5)*.5+.5);for(let x=0;x<W*.6*(.5+a*.5);x++){set(x,4,BL);set(x,5,BL);}for(let x=0;x<W*.6*(1-a*.5);x++){set(x,10,OR);set(x,11,OR);}break;}
        case 5:{for(let x=0;x<W;x++)for(let y=12;y<H;y++)u[y*W+x]=x>20&&x<34?DIc:GRc;const ux=(t*10)%W;for(let y=6;y<12;y++)set(ux,y,P32(COAT));set(ux,5,P32(SKIN));break;}
        case 6:{const r=4+(Math.sin(t)*.5+.5)*4;for(let a=0;a<40;a++)set(24+Math.cos(a/40*6.283)*r*1.6,8+Math.sin(a/40*6.283)*r,C32('#ffb86b'));set(24,8,P32(COAT));break;}
        case 7:{const v=(t*.15)%1;for(let x=0;x<44*v;x++)for(let y=6;y<10;y++)set(x+2,y,v>.35?C32('#c9a2ff'):BL);set(2+44*.35,4,WH);set(2+44*.35,11,WH);break;}
        case 8:{const f=1-(t*.2)%1;for(let n=0;n<8*f;n++)set(24+(hash2(n,(t*10)|0)-.5)*6,14-hash2(n+3,(t*10)|0)*10*f,n&1?OR:C32('#ffe08a'));if(f<.3)for(let n=0;n<6;n++)set(20+n*1.5,6-((t*8+n)%6),P32(STEAM));break;}
        case 9:{for(let x=30;x<46;x++){set(x,3,P32(CL[0]));set(x,4,P32(CL[1]));}const ph=(t*.25)%1,x=ph<.5?6+ph*2*30:36;for(let y=8;y<14;y++)set(x,y,P32(VCOAT));set(x,7,P32(SKIN));break;}
        case 10:for(let x=0;x<W;x+=2){const h=2+Math.abs(Math.sin(x*.4+t*6)*Math.sin(x*.13+t))*6;for(let y=8-h;y<8+h;y++)set(x,y,BL);}break;
        case 11:{const n=(Math.sin(t*.7)*.5+.5);for(let x=0;x<14;x++)for(let y=0;y<5;y++)set(x+2,y+2,RN);for(let x=0;x<44*n;x++)for(let y=0;y<5;y++)set(x+2,y+9,OR);break;}
        case 12:{const ph=t%2;for(let k2=0;k2<3;k2++)if(ph>k2*.6)for(let y=4;y<12;y++){set(8+k2*12,y,ph-k2*.6<.15?WH:C32('#ffb86b'));set(9+k2*12,y,ph-k2*.6<.15?WH:C32('#ffb86b'));}break;}
        case 13:{for(let x=2;x<6;x++)for(let y=4;y<12;y++)set(x,y,C32('#ffb86b'));for(let x=42;x<46;x++)for(let y=4;y<12;y++)set(x,y,BL);for(let n=0;n<3;n++){const x=6+((t*20+n*12)%36);set(x,8,WH);set(x+1,8,WH);}break;}}
      p.put();});}};});

// ======================================================================
// 6b: materials x wetness, wet -> dry mini demo per row
// ======================================================================
reg('matwet',root=>{const tbody=$('tbody',root),cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root);
  tbody.innerHTML=MATROWS.map((m,i)=>`<tr tabindex="0" data-i="${i}"><th scope="row">${m.m}</th>${m.c.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('');
  const POR={[SAND]:[.5,.5,.5],[DIRT]:[.56,.56,.56],[GRASS]:[.68,.68,.68],[WOOD]:[.82,.58,.38],[CLOTH]:[.6,.6,.6],[STONE]:[.8,.8,.8],[ROOF]:[.84,.84,.84],[METAL]:[1,1,1]};
  let w,sel=1,t=0,fr=0,mat=DIRT,who=null,rainT=6;
  function setup(){const name=MATROWS[sel].m;w=RWorld(W,H,{seed:100+sel,maxd:300});w.grass();rainT=6;who=null;
    if(/Grass/.test(name))mat=GRASS;else if(/Dirt/.test(name)){mat=DIRT;w.dirt(()=>true,(x,y)=>Math.abs(x-30)<=1||Math.abs(x-62)<=1);w.dips([[46,22,6],[30,46,5],[70,44,5]],DIRT,.04);}
    else if(/Cobble/.test(name)){mat=STONE;w.cobble(0,0,W-1,H-1);w.dips([[30,20,6],[66,42,6]],STONE,.035);}
    else if(/Sand/.test(name)){mat=SAND;w.ground(0,0,W-1,H-1,SAND);}else if(/Wood/.test(name)){mat=WOOD;w.ground(0,0,W-1,H-1,WOOD);}
    else if(/Roof/.test(name)){mat=ROOF;w.ground(0,0,W-1,H-1,ROOF);}else if(/Cloth/.test(name)){mat=CLOTH;w.ground(0,0,W-1,H-1,CLOTH);}
    else if(/Metal/.test(name)){mat=METAL;w.ground(0,0,W-1,H-1,METAL);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(y%16===0||x%24===0)w.B[y*W+x]=MT[2];}
    else if(/Characters/.test(name)){mat=GRASS;who=w.newChar(48,44,PMAP);}
    else if(/Fire/.test(name)){mat=STONE;w.cobble(0,0,W-1,H-1);w.campfire(48,38);rainT=14;}
    else if(/Water/.test(name)){mat=GRASS;w.pond(48,34,44,26,false);}
    w.finish();w.wind=.2;w.exposure(.2);t=0;$$('tr',tbody).forEach((tr,k)=>tr.classList.toggle('sel',k===sel));}
  const pick=tr=>{sel=+tr.dataset.i;setup();};
  tbody.addEventListener('click',e=>{const tr=e.target.closest('tr');if(tr&&!e.target.closest('a'))pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr){e.preventDefault();pick(tr);}}});
  c.btn('again',()=>{t=0;});setup();
  return {tick(dt){t+=dt*2;fr++;const raining=t<rainT;w.I=raining?.75:0;w.sunny=!raining;w.t+=dt*2;
    for(let k=0;k<2;k++)w.simStep();w.updateDrops(dt*2);w.updateParts(dt*2);w.updateFire(dt*2);if(who)w.soak(who,dt*2);
    const u=px.u32;w.render(u);
    // porosity darkening instead of the Sandbox's single wet row (metal stays bright)
    let mr,mg,mb;if(w.sunny){mr=1.04;mg=1;mb=.93;}else{const k=tintK(w.I);mr=1-k;mg=1-.88*k;mb=1-.6*k;}
    let wet=0,shine=0,n=0;for(let i=0;i<w.NP;i++){if(w.S[i]!==mat)continue;n++;const iw=w.WET[i]>w.thr[i];if(iw)wet++;if(w.WET[i]>200)shine++;
      if(iw&&!w.SPR[i]&&w.WAT[i]<.1&&w.IDX[i]!==SHEEN&&w.IDX[i]!==SPARK){const f=POR[mat];const [r,g,b]=RGB[w.B[i]];u[i]=pack(r*f[0]*mr,g*f[1]*mg,b*f[2]*mb);}}
    px.put();
    if(fr%10===0){const m=MATROWS[sel].m,[d,s]=w.puddlePx();setHud(root,`${raining?'Raining (heavy)':'Sun'} · ${t.toFixed(1)} s`);
      let extra='';if(who)extra=` · character ${Math.round(who.wet*100)} % wet`;if(w.fire)extra=` · fire ${w.fire.on?'F '+w.fire.F.toFixed(2):'out'}`;
      ro.innerHTML=`<b>${m}</b> · ${n?`${Math.round(wet/n*100)} % looks wet · shine ${Math.round(shine/n*100)} %`:'rings on the water'} · puddle px ${d+s}${extra} · DRY ${DRY[mat]}`;}}};});

// ======================================================================
// 6c: one intensity knob, live preview + tier table
// ======================================================================
reg('tiers',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root),tb=$('tbody',root),ths=$$('thead th',root);
  tb.innerHTML=TIERROWS.map(r=>`<tr><th scope="row">${r.k}</th>${r.v.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('');
  const w=RWorld(W,H,{seed:111,maxd:700});w.grass();const wv=y=>Math.round(Math.sin(y*.15)*2);
  w.dirt((x,y)=>x>=20+wv(y)&&x<=40+wv(y),(x,y)=>Math.abs(x-(25+wv(y)))<=1||Math.abs(x-(35+wv(y)))<=1);w.dips([[30,30,5],[29,62,5],[31,80,4]],DIRT,.04);
  w.cobble(50,10,110,60);w.dips([[62,22,5],[96,48,6],[80,36,3]],STONE,.035);w.pond(130,66,26,16,true);w.campfire(80,76);w.finish();w.wind=.3;w.exposure(.3);
  const HZ=[2,2,6,12,20],CEN=[.12,.3,.5,.75,1];let fr=0;
  const nearest=I=>{let b=0,bd=9;CEN.forEach((v,k)=>{if(Math.abs(I-v)<bd){bd=Math.abs(I-v);b=k;}});return b;};
  const upd=()=>{const I=c.v('I')/100;c.out('I',I.toFixed(2));const k=nearest(I);$$('tr',tb).forEach(tr=>$$('td',tr).forEach((td,j)=>td.classList.toggle('hl',j===k)));ths.forEach((th,j)=>th.classList.toggle('hl',j===k+1));
    const box=$('.tiertbl',root),th=ths[k+1],rh=ths[0].offsetWidth;if(box&&th&&box.scrollWidth>box.clientWidth+2){const l=th.offsetLeft-rh,r=th.offsetLeft+th.offsetWidth;if(l<box.scrollLeft||r>box.scrollLeft+box.clientWidth)box.scrollLeft=Math.max(0,l-8);}};
  c.on('I',upd);upd();for(let k=0;k<200;k++){w.I=c.v('I')/100;w.t+=1/60;w.simStep();}
  return {tick(dt){fr++;const I=c.v('I')/100;w.I=I;w.t+=dt;w.simStep();w.updateDrops(dt);w.updateParts(dt);w.updateFire(dt);if(!w.fire.on&&I<.35){w.fire.on=true;w.fire.F=.6;}
    w.render(px.u32);const k=nearest(I),ha=I<.02?0:(I<.12?2:I<.3?2:I<.5?lerp(2,6,(I-.3)/.2):I<.75?lerp(6,12,(I-.5)/.25):lerp(12,20,(I-.75)/.25))/100;
    if(ha>0){const hz=C32('#c9d2dc'),u=px.u32;for(let i=0;i<u.length;i++)u[i]=mix32(u[i],hz,ha);}px.put();
    if(fr%10===0){const [d,s]=w.puddlePx();const sp=VZ.map(v=>Math.round(v*(.55+.45*I))).join('/'),ln=I<.2?'1/2/3':[2,4,7].map(v=>(v*(.5+.6*I))|0).join('/');
      setHud(root,`${tierOf(I)} · ${Math.round(Math.min(w.maxd,dropCount(I)*w.AK))} drops here · puddles ${d}/${s} px`);
      ro.innerHTML=`At I = <b>${I.toFixed(2)}</b> (nearest tier: <b>${TIERS[k][0]}</b>): Sandbox drops <b>${dropCount(I)}</b> at 320×180 · fall speed far/mid/near <b>${sp}</b> px/s · streaks <b>${ln}</b> px · haze alpha ≈ <b>${Math.round(ha*100)} %</b> · fire ${w.fire.on?'burning':'out'}`;}}};});

// ======================================================================
// 6d: wind, lean, length, gusts, rain shadow
// ======================================================================
reg('wind',root=>{const svg=$('svg.windc',root),gs=$('svg.gustc',root),cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);
  let v=6.4,t=0,fr=0;c.seg('drop',x=>{v=+x;draw();});const SL=[0,.25,.5,1];
  const io=()=>{c.out('u',c.v('u')+' m/s');c.out('exp',c.v('exp')+' ms');c.out('h',c.v('h')+' m');draw();};['u','exp','h','snap'].forEach(k=>c.on(k,io));
  // deterministic gust envelope: events every 4-12 s, 1 s attack, 2-3 s release, peak 1.3x mean
  const EV=[];{let s=1;for(let k=0;k<12;k++){s+=4+hash2(k,3)*8;EV.push([s,2+hash2(k,9)]);}}const g=tt=>{tt%=60;let m=0;for(const [s,r] of EV){const d=tt-s;if(d>=0&&d<1)m=Math.max(m,d);else if(d>=1&&d<1+r)m=Math.max(m,1-(d-1)/r);}return m;};
  function draw(){const u=c.v('u'),h=c.v('h'),th=Math.atan2(u,v),Wd=360,Hd=230;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';
    const ox=60,oy=20,sc=10;const ex=ox+u*sc,ey=oy+v*sc;
    svgEl('line',{x1:ox,y1:oy,x2:ox,y2:ey,stroke:'#8b9bb0','stroke-width':2,'stroke-dasharray':'4 3'},svg);svgText(svg,ox-6,(oy+ey)/2,`v ${v} m/s`,{'text-anchor':'end','font-size':11,class:'lab'});
    svgEl('line',{x1:ox,y1:ey,x2:ex,y2:ey,stroke:'#ffb86b','stroke-width':2},svg);svgText(svg,(ox+ex)/2,ey+14,`u ${u} m/s`,{'text-anchor':'middle','font-size':11,fill:'#ffb86b'});
    svgEl('line',{x1:ox,y1:oy,x2:ex,y2:ey,stroke:'#a9d2f0','stroke-width':3},svg);
    const ar=26;if(u>0)svgEl('path',{d:`M${ox},${oy+ar} A${ar},${ar} 0 0 0 ${ox+Math.sin(th)*ar},${oy+Math.cos(th)*ar}`,fill:'none',stroke:'#a9d2f0'},svg);
    svgText(svg,ox+170,oy+14,`tan θ = u/v = ${(u/v).toFixed(2)}`,{'font-size':12,class:'lab'});svgText(svg,ox+170,oy+32,`θ = ${(th*180/Math.PI).toFixed(0)}°`,{'font-size':13,fill:'#a9d2f0'});
    // wall and shadow
    const gx=226,gy=Hd-24,ws=12,L=h*Math.tan(th);svgEl('line',{x1:gx-30,x2:Wd-6,y1:gy,y2:gy,class:'ax'},svg);svgEl('rect',{x:gx-6,y:gy-h*ws,width:6,height:h*ws,fill:'#6a6760'},svg);
    svgEl('rect',{x:gx,y:gy-2,width:L*ws,height:4,fill:'#ffb86b','fill-opacity':.8},svg);for(let k=0;k<7;k++){const sx=gx-30+k*22;svgEl('line',{x1:sx,y1:gy-h*ws-20,x2:sx+Math.tan(th)*(h*ws+20),y2:gy,stroke:'#6c9cc4','stroke-opacity':.5},svg);}
    svgText(svg,gx+L*ws/2,gy+14,`dry strip h·tan θ = ${L.toFixed(1)} m`,{'text-anchor':'middle','font-size':11,fill:'#ffb86b'});svgText(svg,gx-10,gy-h*ws-4,`wall ${h} m`,{'text-anchor':'end','font-size':10.5});
    const len=v*c.v('exp')/1000*32;svgText(svg,8,128,'length = v × exposure × 32 px/m',{'font-size':11,class:'lab'});svgText(svg,8,144,`= ${v} × ${(c.v('exp')/1000).toFixed(3)} × 32 = ${len.toFixed(1)} px`,{'font-size':11.5,fill:'#a9d2f0'});}
  io();const D=[];for(let k=0;k<40;k++)D.push({x:rnd()*W,y:rnd()*H});
  return {tick(dt){t+=dt;fr++;const ug=c.v('u')*(1+.3*g(t)),sl=ug/v,snap=c.v('snap');let s2=sl;if(snap){s2=SL.reduce((a,b)=>Math.abs(b-sl)<Math.abs(a-sl)?b:a);}
    const len=Math.max(1,Math.round(v*c.v('exp')/1000*32)),u=px.u32,vy=v*32*.5;u.fill(0);for(let y=0;y<H;y++)for(let x=0;x<W;x++)u[y*W+x]=P32((x+y*3)%11===0?GR[0]:GR[1]);
    for(const d of D){d.y+=vy*dt;d.x+=vy*s2*dt;if(d.y>H+len){d.y=-len;d.x=rnd()*(W+40)-20-(s2*20);}if(d.x>W+10)d.x-=W+20;
      for(let s=0;s<=len;s++){const xx=Math.round(d.x-s2*s),yy=Math.round(d.y-s);if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=s===0?P32(SPL):P32(RNN);}}
    px.put();
    if(fr%6===0){setHud(root,`gust ${(1+.3*g(t)).toFixed(2)}× · slope ${s2.toFixed(2)}${snap?' (snapped)':''} · ${len} px`);
      const Wd=360,Hd=70;gs.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);gs.innerHTML='';const X=tt=>8+tt/30*(Wd-16),Y=m=>Hd-14-m*40;const t0=Math.max(0,t-30);
      let p='';for(let k=0;k<=150;k++){const tt=t0+k/150*30;p+=(k?'L':'M')+X(tt-t0).toFixed(1)+','+Y(.3*g(tt)/.3*.3/ .3).toFixed(1);}
      svgEl('line',{x1:8,x2:Wd-8,y1:Y(0),y2:Y(0),class:'ax'},gs);svgEl('line',{x1:8,x2:Wd-8,y1:Y(.3/.3),y2:Y(1),stroke:'#ffb86b','stroke-dasharray':'3 3'},gs);
      svgEl('path',{d:p,fill:'none',stroke:'#a9d2f0','stroke-width':2},gs);svgText(gs,10,Y(1)-3,'1.3× mean',{'font-size':10,fill:'#ffb86b'});svgText(gs,Wd-10,Hd-2,'last 30 s',{'text-anchor':'end','font-size':10});}}};});

// ======================================================================
// 6e: storm -> sun, as measured (small multiples + steps)
// ======================================================================
reg('timex',root=>{const svg=$('svg.timex',root),c=ctl(root),ro=$('[data-ro]',root);
  const SUN=[[5,.17,4,.89,.14,.17,40,1],[10,.03,0,.63,.11,.14,29,1],[15,.005,0,.43,.07,.12,20,.88],[20,0,0,.29,.05,.1,17,.73],[30,0,0,.13,.02,.07,7,.43],[45,0,0,.05,.01,.04,4,0],[60,0,0,.02,.01,.02,3,0]];
  const WET10=[['Dirt',88],['Stone',65],['Grass',51],['Sand',48],['Wood',40]];
  const DRYB=[['Metal','exp',13.5,17],['Grass, stone, sand, wood','exp',14,19.5],['Roof','exp',14.5,19.5],['Dirt','exp',16.5,24],['Cloth','exp',19,25.5],['Stone','sh',11.5,15.5],['Grass','sh',20.5,50],['Dirt','sh',57,99.5]];
  const STEPS=[['storm',null,'1. Storm, 10 s after the switch (I = 0.83): visibly wet grass 51 %, dirt 88 %, stone 65 %, sand 48 %, wood 40 %; 409 dirt pixels already show puddles.'],
    ['storm',null,'2. Storm, 12–20 s: the campfire goes out in a burst of steam at 12 s. By 20 s every material is 98–100 % wet, the player is soaked, the roof store is at 0.85, and spray mist peaks at 0.96.'],
    ['storm',null,'3. Storm, 30–180 s: puddle area swings with the curtains, 480–1,090 px on dirt and 90–860 px on stone. Stores hold at roof 1.0, awning ~0.2, trees ~0.2, with 35–49 drips alive at once.'],
    ['sun',[5,10],'4. Sun, 5–10 s: intensity falls from 0.17 to 0.03, and the puddles are gone by 10 s (4 → 0 px), before the ground dries. Lagarde wants the opposite.'],
    ['sun',[10,60],'5. Sun, 10–60 s: drips fall from 29 to 3, the player dries from 1.00 to 0 by 45 s, the awning store is at 0.02 by 30 s and the roof by 60 s.'],
    ['dry',[11.5,99.5],'6. Drying: exposed pixels are 50 % dry at 13.5–19 s and 90 % at 17–25.5 s; shaded dirt takes 57 s and 99.5 s. Spray haze collapses within ~8 s; evaporation mist sits at 0.06–0.08 and is never drawn.']];
  function draw(){const st=c.v('st');c.out('st',st);const cp=root.clientWidth<600,Wd=cp?420:760,Lm=cp?10:200,Rm=cp?12:16;const [kind,band,txt]=STEPS[st-1];
    const ph=58,gap=26,T=8;let y=T;svg.innerHTML='';const HL='#ffb86b';
    // storm panel
    const sx=v=>Lm+v/100*(Wd-Lm-Rm);svgText(svg,cp?Lm:Lm-8,y+12,'Storm +10 s: visibly wet',{'text-anchor':cp?'start':'end','font-size':12,class:'lab'});if(cp)y+=16;
    svgEl('rect',{x:Lm-4,y:y-2,width:Wd-Lm-Rm+8,height:WET10.length*13+6,fill:'none',stroke:kind==='storm'?HL:'#243243','stroke-width':kind==='storm'?2:1,rx:3},svg);
    WET10.forEach(([n,v],k)=>{const yy=y+3+k*13;svgEl('rect',{x:Lm,y:yy,width:sx(v)-Lm,height:9,fill:'#6c9cc4'},svg);svgText(svg,sx(v)+4,yy+8.5,`${n} ${v} %`,{'font-size':10.5,class:'lab'});});
    y+=WET10.length*13+gap;
    const X=t=>Lm+t/60*(Wd-Lm-Rm);
    const panels=[{k:'Stores after the storm',ser:[[3,'#a9d2f0','roof'],[4,'#e0675f','awning'],[5,'#79a35a','tree']],max:1},{k:'Live drips',ser:[[6,'#a9d2f0','drips']],max:45},{k:'Player wetness',ser:[[7,'#c9a2ff','wet']],max:1},{k:'Puddle px and intensity ×20',ser:[[2,'#6c9cc4','puddle px'],[1,'#ffb86b','I×20',20]],max:5}];
    const ytop=y;panels.forEach(p=>{svgText(svg,cp?Lm:Lm-8,y+12,p.k,{'text-anchor':cp?'start':'end','font-size':12,class:'lab'});if(cp)y+=16;const Y=v=>y+ph-v/p.max*(ph-6);
      svgEl('line',{x1:Lm,x2:Wd-Rm,y1:y+ph,y2:y+ph,class:'ax'},svg);
      for(const [ci,col,lab,mul] of p.ser){const pts=SUN.map(r=>[X(r[0]),Y(Math.min(p.max,r[ci]*(mul||1)))]);svgEl('path',{d:pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+','+q[1].toFixed(1)).join(''),fill:'none',stroke:col,'stroke-width':2},svg);pts.forEach(q=>svgEl('circle',{cx:q[0],cy:q[1],r:2.6,fill:col},svg));[0,1,4,6].forEach(j=>{if(lab==='awning'||lab==='tree'||lab==='I×20')return;const r=SUN[j];svgText(svg,pts[j][0]+4,pts[j][1]-5,String(r[ci]),{'font-size':9.5,fill:col});});
        svgText(svg,Wd-Rm,Y(Math.min(p.max,SUN[0][ci]*(mul||1)))-4+(lab==='awning'?10:0),'',{});}
      if(p.ser.length>1)p.ser.forEach(([ci,col,lab],k)=>{svgEl('rect',{x:Wd-Rm-200+k*68,y:y+1,width:8,height:3,fill:col},svg);svgText(svg,Wd-Rm-189+k*68,y+6,lab,{'font-size':9.5});});
      y+=ph+gap;});
    for(const tt of [0,10,20,30,45,60])svgText(svg,X(tt),y-gap+14,tt+' s',{'text-anchor':'middle','font-size':10.5});
    if(band&&kind==='sun')svgEl('rect',{x:X(band[0]),y:ytop,width:X(band[1])-X(band[0]),height:y-ytop-gap,fill:HL,'fill-opacity':.09,stroke:HL,'stroke-opacity':.5},svg);
    svgText(svg,cp?Lm:Lm-8,y+4,'Sun: time after the switch',{'text-anchor':cp?'start':'end','font-size':11});y+=18;
    // drying bars 0..100 s
    const XD=t=>Lm+t/100*(Wd-Lm-Rm);svgText(svg,cp?Lm:Lm-8,y+12,'Drying: 50 % → 90 % dry',{'text-anchor':cp?'start':'end','font-size':12,class:'lab'});if(cp)y+=16;
    svgEl('rect',{x:Lm-4,y:y-2,width:Wd-Lm-Rm+8,height:DRYB.length*15+6,fill:'none',stroke:kind==='dry'?HL:'#243243','stroke-width':kind==='dry'?2:1,rx:3},svg);
    DRYB.forEach(([n,e,a,b],k)=>{const yy=y+3+k*15;svgEl('rect',{x:XD(a),y:yy,width:XD(b)-XD(a),height:10,rx:2,fill:e==='exp'?'#a9d2f0':'#6c9cc4','fill-opacity':.9},svg);
      const lab2=`${n} (${e==='exp'?'exposed':'shaded'}) ${a}–${b} s`;b>60?svgText(svg,XD(a)-5,yy+9,lab2,{'text-anchor':'end','font-size':10.5,class:'lab'}):svgText(svg,XD(b)+5,yy+9,lab2,{'font-size':10.5,class:'lab'});});y+=DRYB.length*15+8;
    for(const tt of [0,25,50,75,100])svgText(svg,XD(tt),y+10,tt+' s',{'text-anchor':'middle','font-size':10.5});y+=18;
    svg.setAttribute('viewBox',`0 0 ${Wd} ${y}`);ro.innerHTML=txt;}
  c.on('st',draw);draw();let lastCp=root.clientWidth<600;addEventListener('resize',()=>{const cp=root.clientWidth<600;if(cp!==lastCp){lastCp=cp;draw();}});return {};});

// ======================================================================
// Architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[0]);return {};});
