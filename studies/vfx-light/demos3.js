// ======================================================================
// D1: Kelvin scale, vocabulary chips, Kruithof mood grid
// ======================================================================
const kRGB=K=>{const t=K/100;let r,g,b;if(t<=66){r=255;g=99.4708025861*Math.log(t)-161.1195681661;b=t<=19?0:138.5177312231*Math.log(t-10)-305.0447927307;}
  else{r=329.698727446*Math.pow(t-60,-0.1332047592);g=288.1221695283*Math.pow(t-60,-0.0755148492);b=255;}return [clamp(r,0,255),clamp(g,0,255),clamp(b,0,255)];};
reg('kelvin',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root),strip=$('[data-strip]',root),marks=$('[data-marks]',root),voc=$('[data-vocab]',root);const W=F.W,H=F.H;
  const KMIN=1000,KMAX=27000,toK=v=>KMIN*Math.pow(KMAX/KMIN,v/1000),toV=K=>Math.log(K/KMIN)/Math.log(KMAX/KMIN)*1000;
  const stops=[];for(let k=0;k<=40;k++){const K=toK(k*25);stops.push(`${rgbCss(...kRGB(K))} ${k*2.5}%`);}strip.style.background=`linear-gradient(90deg,${stops.join(',')})`;
  const MK=[[1700,'match','1,700'],[1850,'candle','1,850'],[2400,'incandescent','2,400'],[2700,'soft white','2,700'],[3000,'warm white','3,000'],[3500,'golden hour','~3,500'],[5750,'noon','5,500–6,000'],[6500,'overcast','6,500'],[20000,'blue sky','15,000–27,000']];
  marks.innerHTML=MK.map(([K,l,v],i)=>{const p=toV(K)/10;return `<span style="left:${p}%;top:${(i%3)*21}px;transform:translateX(${p>85?'-100%':'-50%'})">${l}<b class="kk"> ${v} K</b></span>`;}).join('');
  const VOC=[['Terraria torch','#FFF2CC'],['Ice','#899BFF'],['Cursed','#9FFF50'],['Corrupt','#AD49FF'],['Jungle','#84FF9E'],['Mushroom','#40A6FF'],['RimWorld lamp','#D6945E'],['Kiradex lamp','#B3853D'],['candle ≈ #FF8B14 (unverified)','#FF8B14'],['tungsten ≈ #FFA757 (unverified)','#FFA757'],['pure red','#FF0000']];
  voc.innerHTML=VOC.map(([n,h])=>`<button type="button" data-h="${h}"><i style="background:${h}"></i>${n}</button>`).join('');let chip=null;
  voc.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;chip=chip===b.dataset.h?null:b.dataset.h;$$('button',voc).forEach(x=>x.classList.toggle('on',x.dataset.h===chip));});
  c.on('k',()=>{chip=null;$$('button',voc).forEach(x=>x.classList.remove('on'));});
  const ALB=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=hash2(x,y);let col=vnoise(x/8,y/8)<.45?U('#4f7d3e'):U('#5f8f48');if(x>34&&x<94&&y>16&&y<58){const row=(y/5)|0,off=(row&1)*3;col=((x+off)%7===0||y%5===0)?U('#6e6a63'):(h<.4?U('#949087'):U('#aaa69c'));}ALB[y*W+x]=col;}
  for(let y=20;y<30;y++)for(let x=96;x<103;x++)ALB[y*W+x]=(y===22||y===27)?U('#5a5a62'):x<99?U('#9a6a3e'):U('#7a5230');
  let L={x:64,y:36},drag=false;pointer(cv,([x,y],k)=>{if(k==='down')drag=true;if(k==='up')drag=false;if(drag&&(k==='down'||k==='drag')){L.x=x;L.y=y;}});
  const sat3=([r,g,b])=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);return mx?(mx-mn)/mx:0;};
  let fr=0;return {tick(){fr++;const K=toK(c.v('k')),br=c.v('b')/100;const rgb=chip?hexf(chip).map(v=>v*255):kRGB(K);c.out('k',chip?'chip':Math.round(K/10)*10+' K');c.out('b',c.v('b')+'%');
    const col=rgb.map(v=>v/255),u=F.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.hypot(x-L.x,y-L.y)/46;const q=Math.max(0,1-d*d),f=q*q*br*1.9;const a=un32(ALB[y*W+x]);const B=bay(x,y)/16;
      const lr=Math.floor((.08+col[0]*f)*6+B)/6,lg=Math.floor((.09+col[1]*f)*6+B)/6,lb=Math.floor((.16+col[2]*f)*6+B)/6;u[y*W+x]=pack(a[0]*lr,a[1]*lg,a[2]*lb);}
    for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])u[((L.y|0)+dy)*W+(L.x|0)+dx]=pack(255,250,230);F.put();
    if(fr%4===0){svg.innerHTML='';const X=K=>30+toV(K)/1000*260,Y=b=>132-(b-.15)/.85*112;
      svgEl('rect',{x:30,y:Y(.5),width:X(3200)-30,height:Y(.15)-Y(.5),fill:'#e08a3a','fill-opacity':.16},svg);svgText(svg,34,Y(.2),'dim + warm: pleasant',{'font-size':9.5,class:'w'});
      svgEl('rect',{x:X(5000),y:Y(.5),width:290-X(5000),height:Y(.15)-Y(.5),fill:'#8ea8ff','fill-opacity':.14},svg);svgText(svg,286,Y(.2),'dim + cold: gloomy',{'font-size':9.5,class:'c','text-anchor':'end'});
      svgText(svg,286,Y(.42),'(art rule: eerie)',{'font-size':8.5,'text-anchor':'end'});
      svgEl('line',{x1:30,x2:290,y1:132,y2:132,class:'ax'},svg);svgEl('line',{x1:30,x2:30,y1:16,y2:132,class:'ax'},svg);svgText(svg,160,146,'colour temperature (log) →',{'font-size':9,'text-anchor':'middle'});
      svgText(svg,6,74,'brightness →',{'font-size':9,transform:'rotate(-90 12 74)','text-anchor':'middle'});
      svgText(svg,160,12,'Kruithof (1941); Fotios (2017) found no support',{'font-size':8.5,'text-anchor':'middle'});
      if(!chip)svgEl('circle',{cx:X(K),cy:Y(br),r:5,fill:rgbCss(...rgb),stroke:'#fff','stroke-width':1.2},svg);
      const s=sat3(rgb);setHud(root,`${chip||Math.round(K)+' K'} · ${hexOf3(...rgb).toUpperCase()}`);
      ro.innerHTML=`${chip?'chip colour':Math.round(K).toLocaleString()+' K'} → <span class="swatch" style="background:${rgbCss(...rgb)}"></span> <b>${hexOf3(...rgb).toUpperCase()}</b> (${chip?'quoted value':'illustrative curve fit'}) · saturation ${(s*100).toFixed(0)}%${s>.97?' · <b>full saturation: artists warn against it; Terraria dims pure red, green and blue torches to 37–47%</b>':''}`;}}};});

// ======================================================================
// D2: Quake light-style player + DOOM thinkers
// ======================================================================
reg('flickerdata',root=>{const c=ctl(root),ro=$('[data-ro]',root),inp=$('.qs-in',root),strip=$('[data-strip]',root),lampsEl=$('[data-lamps]',root),warn=$('[data-warn]',root),qs=$('[data-qs]',root),dm=$('[data-doom]',root);
  const PRE=[['Candle A','mmmmmaaaaammmmmaaaaaabcdefgabcdefg'],['Candle B','mmmaaaabcdefgmmmmaaaammmaamm'],['Flicker','mmnmmommommnonmmonqnmmo'],['Fluorescent','mmamammmmammamamaaamammma'],['Gentle pulse','jklmnopqrstuvwxyzyxwvutsrqponmlkj'],['Fast strobe','mamamamamama']];
  qs.innerHTML=PRE.map(([n,s],i)=>`<button type="button" data-i="${i}" class="${i===2?'on':''}">${n}</button>`).join('');
  let str=PRE[2][1],t=0,fr=0,lastI=-1;const NL=6;const guards=Array.from({length:NL},()=>FG());
  lampsEl.innerHTML=Array.from({length:NL},(_,k)=>`<span class="lampbox"><i></i><span data-v></span></span>`).join('');const lampI=$$('.lampbox i',lampsEl),lampV=$$('.lampbox [data-v]',lampsEl);
  const setStr=s=>{str=(s.toLowerCase().replace(/[^a-z]/g,'')||'m').slice(0,64);strip.innerHTML=[...str].map(ch=>`<i style="height:${Math.max(4,(ch.charCodeAt(0)-97)/25*100)}%"><b>${ch}</b></i>`).join('');lastI=-1;
    const b=[...str].map(ch=>Math.min(1,(ch.charCodeAt(0)-97)*22/400));let tr=0;for(let i=0;i<b.length;i++)if(Math.abs(b[i]-b[(i+b.length-1)%b.length])>.1)tr++;const fps=tr/2/(b.length/10);
    warn.textContent=fps>3?`This string swings more than 10% about ${fps.toFixed(1)} times a second at 10 Hz; the lamps below are held to 3 flashes per second, so they look slower than the real thing.`:'';};
  setStr(str);
  qs.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',qs).forEach(x=>x.classList.toggle('on',x===b));inp.value=PRE[+b.dataset.i][1];setStr(inp.value);});
  inp.addEventListener('input',()=>{$$('button',qs).forEach(x=>x.classList.remove('on'));setStr(inp.value);});
  // DOOM thinkers at 35 Hz (illustrative max 200, min 96)
  const MAX=200,MIN=96,TH=[{n:'Fire flicker: every 4 tics, max − (rand&3)·16',k:'fire',lvl:MAX,cnt:4},{n:'Broken light flash: dark 1–8 tics, bright 1 or 65',k:'flash',lvl:MAX,cnt:1},{n:'Strobe, fast: 5 tics bright, 15 dark',k:'sf',lvl:MAX,cnt:5},{n:'Strobe, slow: 5 bright, 35 dark',k:'ss',lvl:MAX,cnt:5},{n:'Glow: ±8 per tic between min and max',k:'glow',lvl:MAX,dir:-1}];
  dm.innerHTML=TH.map(()=>'<div class="drow"><i></i><canvas width="280" height="30"></canvas><small></small></div>').join('');const rows=$$('.drow',dm);
  TH.forEach((th,i)=>{th.el=rows[i];th.sw=$('i',rows[i]);th.cv=$('canvas',rows[i]).getContext('2d');$('small',rows[i]).textContent=th.n;th.hist=new Array(140).fill(MAX);th.fg=FG();});
  function tic(th){if(th.k==='fire'){if(--th.cnt)return;const amount=((rnd()*4)|0)*16;th.lvl=th.lvl-amount<MIN+16?MIN+16:MAX-amount;th.cnt=4;}
    else if(th.k==='flash'){if(--th.cnt)return;if(th.lvl===MAX){th.lvl=MIN;th.cnt=((rnd()*8)|0)+1;}else{th.lvl=MAX;th.cnt=(((rnd()*256)|0)&64)+1;}}
    else if(th.k==='sf'||th.k==='ss'){if(--th.cnt)return;if(th.lvl===MIN){th.lvl=MAX;th.cnt=5;}else{th.lvl=MIN;th.cnt=th.k==='sf'?15:35;}}
    else{th.lvl+=th.dir*8;if(th.lvl<=MIN){th.lvl+=8;th.dir=1;}else if(th.lvl>=MAX){th.lvl-=8;th.dir=-1;}}}
  let acc=0;
  return {tick(dt){t+=dt;fr++;const off=c.v('off');const i0=Math.floor(t*10)%str.length;
    for(let k=0;k<NL;k++){const ph=off?k*3.7:0;const ch=str.charCodeAt(Math.floor((t+ph)*10)%str.length)-97;const v=ch*22;const b=guards[k](Math.min(1,v/400),t);lampI[k].style.background=rgbCss(255*b,200*b,112*b);lampI[k].style.boxShadow=`0 0 ${Math.round(b*14)}px rgba(255,200,112,${(b*.55).toFixed(2)})`;if(fr%3===0)lampV[k].textContent=v;}
    if(i0!==lastI){const bars=strip.children;if(bars[lastI])bars[lastI].classList.remove('on');if(bars[i0])bars[i0].classList.add('on');lastI=i0;}
    acc+=dt*35;let n=0;while(acc>=1&&n<6){for(const th of TH){tic(th);th.hist.push(th.lvl);th.hist.shift();}acc--;n++;}
    for(const th of TH){const b=th.fg(th.lvl/255,t);th.sw.style.background=rgbCss(255*b,176*b,64*b);const g=th.cv;g.clearRect(0,0,280,30);g.strokeStyle='#ffb040';g.lineWidth=1.5;g.beginPath();th.hist.forEach((v,i)=>{const y=28-(v-MIN+8)/(MAX-MIN+16)*26;if(i===0)g.moveTo(0,y);else{g.lineTo(i*2,g._py);g.lineTo(i*2,y);}g._py=y;});g.stroke();}
    if(fr%6===0){const ch=str[i0],v=(ch.charCodeAt(0)-97)*22;ro.innerHTML=`Quake: t = ${t.toFixed(1)} s → i = ${Math.floor(t*10)} → '${ch}' → (${ch.charCodeAt(0)} − 97) × 22 = <b>${v}</b> (${(v/264*100).toFixed(0)}% of 'm') · string length ${str.length} = a ${(str.length/10).toFixed(1)} s loop · DOOM: 35 tics per second; one character or one timer per light is the whole cost`;}}};});

// ======================================================================
// D3: flicker personality lab
// ======================================================================
reg('flicker',root=>{const cv=$('canvas',root),F=PX(cv),tc=$('canvas.trace',root),tg=tc.getContext('2d'),c=ctl(root),ro=$('[data-ro]',root),pb=$('[data-p]',root),leg=$('[data-leg]',root);const W=F.W,H=F.H;
  const nz=(t,s)=>(n1(t,s)-.5)*2;const ST={};
  const Pz=[
    {n:'Torch (noise recipe)',c:'#ff8c3a',f:(t,s)=>1-.18*Math.abs(nz(6*t,s))-.07*nz(11*t,s+3),fire:1,fx:'1 − 0.18·|noise(6t)| − 0.07·noise(11t)'},
    {n:'Fire (Sandbox)',c:'#ff8c3a',f:(t,s)=>flickerOf('fire',t,s),fire:1,fx:'.82 + .18·n1(9t) − gust'},
    {n:'Campfire (Sandbox)',c:'#ff7030',f:(t,s)=>flickerOf('camp',t,s),fire:1,fx:'.78 + .22·n1(7t)·n1(2.3t) + .06·sin(1.3t)'},
    {n:'Lone candle (steady)',c:'#ffb35a',f:(t,s)=>flickerOf('candle',t,s),fx:'slow drift + rare draught dips (Sandbox)'},
    {n:'3-flame bundle',c:'#ffb35a',f:(t,s)=>.86+.045*Math.sin(2*Math.PI*10.8*t)+.02*nz(3*t,s),fx:'≈ 10.8 Hz shimmer (illustrative)'},
    {n:'Lantern',c:'#ffc870',f:(t,s)=>flickerOf('lantern',t,s),fx:'.95 + .03·n1(4t)'},
    {n:'Street lamp',c:'#ffd9a0',f:(t,s)=>flickerOf('lamp',t,s),fx:'.97 + .02·n1(2t)'},
    {n:'Magic pulse (recipe)',c:'#7ae6ff',f:(t,s)=>.85+.15*Math.sin(2*Math.PI*.5*t+s),fx:'0.85 + 0.15·sin(2π·0.5t + phase)'},
    {n:'Magic crystal (Sandbox)',c:'#9ab8ff',f:(t,s)=>flickerOf('magic',t,s),fx:'.72 + .28·sin(0.9πt), 2.2 s'},
    {n:'Electric blackout',c:'#dfe8ff',f:(t,s,k)=>{const st=ST[k]||(ST[k]={v:1,f:-1});const fr=Math.floor(t*60);if(fr!==st.f){st.f=fr;st.v=rnd()<.03?.1:1;}return st.v;},fx:'rand < 0.03 per frame → 0.1'},
    {n:'Rune (Sandbox)',c:'#dfe8ff',f:(t,s)=>flickerOf('rune',t,s),fx:'drops to .08 in ~6% of 83 ms slots'},
    {n:'Glow mushroom',c:'#5cffc8',f:(t,s)=>flickerOf('breath',t,s),fx:'.55 + .45·sin(1.2t), ~5.2 s'},
    {n:'Firefly',c:'#d6ff6a',f:(t,s)=>flickerOf('blink',t,s),fx:'max(0, sin 1.7t)⁶'},
    {n:'Brogue jitter',c:'#ffa050',f:(t,s,k)=>{const st=ST[k]||(ST[k]={v:1,f:-1});const st7=Math.floor(t*7);if(st7!==st.f){st.f=st7;st.v=.78+rnd()*.22;st.g=.38+rnd()*.15;st.b=.15+rnd()*.07;}return st.v;},fire:1,fx:'radius and colour re-rolled from {75,38,15, 0,15,7}, 7 Hz'},
    {n:"Quake 'flicker' string",c:'#ffc870',f:t=>{const s='mmnmmommommnonmmonqnmmo';return (s.charCodeAt(Math.floor(t*10)%s.length)-97)*22/264*.9;},fx:"mmnmmommommnonmmonqnmmo at 10 Hz"},
    {n:'DOOM fire flicker',c:'#ffb040',f:(t,s,k)=>{const st=ST[k]||(ST[k]={v:1,f:-1});const q=Math.floor(t*8.75);if(q!==st.f){st.f=q;st.v=(200-((rnd()*4)|0)*16)/200;}return st.v;},fx:'every 4 tics (8.75 Hz): max − (rand&3)·16'}];
  let sel=[0,3,9];const TC=['#ffc870','#8ea8ff','#ff8f7a'];
  pb.innerHTML=Pz.map((p,i)=>`<button type="button" data-i="${i}"><i style="background:${p.c}"></i>${p.n}</button>`).join('');
  const sync=()=>{$$('button',pb).forEach(b=>b.classList.toggle('on',sel.includes(+b.dataset.i)));leg.innerHTML=sel.map((i,k)=>`<span><i style="background:${TC[k]}"></i>${Pz[i].n}</span>`).join('');};sync();
  pb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i;if(sel.includes(i)){if(sel.length>1)sel=sel.filter(x=>x!==i);}else{sel.unshift(i);if(sel.length>3)sel.pop();}hist.length=0;sync();});
  const ALB=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=hash2(x,y);ALB[y*W+x]=vnoise(x/8,y/8)<.45?U('#4f7d3e'):U('#5f8f48');if(y>44&&y<48&&x>8&&x<50&&((x-8)%7<1||y===45||y===47))ALB[y*W+x]=U('#a07a52');}
  for(let y=24;y<34;y++)for(let x=82;x<89;x++)ALB[y*W+x]=(y===26||y===31)?U('#5a5a62'):x<85?U('#9a6a3e'):U('#7a5230');
  const hist=[];let t=0,fr=0,held=1,heldT=-1;const fg=FG();
  return {tick(dt){t+=dt;fr++;const calm=c.v('calm'),step=c.v('step'),breath=c.v('breath');
    const vals=sel.map((i,k)=>{let v=clamp(Pz[i].f(t,(i*37)%97,i),0,1.2);if(calm)v=1-(1-v)*.3;return v;});hist.push([t,...vals]);while(hist.length&&hist[0][0]<t-4)hist.shift();
    const p=Pz[sel[0]];let I=vals[0];if(step){if(Math.floor(t*10)!==heldT){heldT=Math.floor(t*10);held=Math.round(I*5)/5;}I=held;}I=fg(I,t);
    let col=hexf(p.c);if(sel[0]===13&&ST[13])col=[.75/.75,ST[13].g/.75,ST[13].b/.75].map(v=>clamp(v,0,1));const R=40*(p.fire&&breath?(.94+.06*I):1)*(sel[0]===13&&ST[13]?(.85+.3*(ST[13].v-.78)/.22):1);
    const u=F.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.hypot(x-60,y-36)/R;const q=Math.max(0,1-d*d),f=q*q*I*1.35;const a=un32(ALB[y*W+x]);const B=bay(x,y)/16;
      u[y*W+x]=pack(a[0]*Math.floor((.08+col[0]*f)*6+B)/6,a[1]*Math.floor((.09+col[1]*f)*6+B)/6,a[2]*Math.floor((.16+col[2]*f)*6+B)/6);}
    const fc=pack(255*Math.min(1,col[0]*1.2),255*Math.min(1,col[1]*1.1),255*col[2]);u[35*W+60]=fc;u[35*W+61]=fc;u[36*W+60]=fc;u[36*W+61]=fc;u[37*W+60]=U('#6a4a32');F.put();
    const TW=420,THh=140;tg.clearRect(0,0,TW,THh);tg.strokeStyle='#2e2838';tg.lineWidth=1;for(const v of [0,.5,1]){const y=THh-8-v*120;tg.beginPath();tg.moveTo(0,y);tg.lineTo(TW,y);tg.stroke();}
    tg.fillStyle='#9e94ad';tg.font='11px "IBM Plex Mono",monospace';tg.fillText('1.0',2,THh-8-120+12);tg.fillText('0.5',2,THh-8-60+12);tg.fillText('−4 s',2,THh-2);tg.fillText('now',TW-26,THh-2);
    sel.forEach((_,k)=>{tg.strokeStyle=TC[k];tg.lineWidth=k===0?2:1.4;tg.beginPath();hist.forEach((h,j)=>{const x=(h[0]-(t-4))/4*TW,y=THh-8-Math.min(1.1,h[k+1])*120;if(j===0)tg.moveTo(x,y);else tg.lineTo(x,y);});tg.stroke();});
    if(fr%10===0){let tr=0,anchor=null;for(const h of hist){const v=h[1];if(anchor===null)anchor=v;else if(Math.abs(v-anchor)>.1){tr++;anchor=v;}}const span=Math.max(.5,hist.length?t-hist[0][0]:1),fl=tr/2/span;
      setHud(root,`${p.n} · I ${I.toFixed(2)}`);ro.innerHTML=`<b>${p.n}</b>: ${p.fx} · swings above 10%: <b>${fl.toFixed(1)}</b> per second ${fl>3?'(<b>over the 3-flash limit</b>; the swatch on this page is held back)':'(within the 3-flash limit)'}${calm?' · reduce-flicker on: amplitude × 0.3':''}${step?' · stepped at 10 Hz in 5 bands':''}`;}}};});

// ======================================================================
// D4: colour mixing and Brogue darkness/jitter
// ======================================================================
reg('mixing',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root);const W=F.W,H=F.H;
  const Ls=[{x:62,y:42,c:[1,1,0],R:46,n:'yellow'},{x:98,y:42,c:[1,0,0],R:46,n:'red'},{x:80,y:66,c:[.25,.45,1],R:40,n:'blue'}];const D={x:116,y:72,c:[-.2,-.2,-.2],R:30,n:'darkness'};
  let drag=null,hov=null,t=0,fr=0,jt=-1;const jit=Ls.map(()=>({r:1,c:[0,0,0]}));
  pointer(cv,([x,y],k)=>{if(k==='down'){let bd=12;drag=null;for(const L of [...Ls,D]){const d=Math.hypot(L.x-x,L.y-y);if(d<bd){bd=d;drag=L;}}}if((k==='down'||k==='drag')&&drag){drag.x=clamp(x,0,W-1);drag.y=clamp(y,0,H-1);}if(k==='up')drag=null;hov=k==='leave'?null:[x|0,y|0];});
  const Y=v=>.3*v[0]+.55*v[1]+.15*v[2];
  function contrib(x,y){const out=[];const all=c.v('dark')?[...Ls,D]:Ls;all.forEach((L,i)=>{const j=jit[i]||{r:1,c:[0,0,0]};const R=L.R*(c.v('jit')&&i<3?j.r:1);const d=Math.hypot(x-L.x,y-L.y);const f=Math.max(0,1-d/R);if(f>0)out.push({L,f,col:L.c.map((v,k)=>v+(c.v('jit')&&i<3?j.c[k]:0))});});return out;}
  function mix(cs,m){if(!cs.length)return [0,0,0];if(m==='lum'){let tot=0,h=[0,0,0],sumY=0,neg=[0,0,0];for(const e of cs){const v=e.col.map(q=>q*e.f);if(v[0]<0){for(let k=0;k<3;k++)neg[k]+=v[k];continue;}const w=Y(v);sumY+=w;tot+=w;for(let k=0;k<3;k++)h[k]+=e.col[k]*w;}
      if(!tot)return neg;h=h.map(v=>v/tot);const mx=Math.max(...h,.001);return h.map((v,k)=>Math.max(0,v/mx*Math.min(1,sumY/Math.max(.01,Y(h.map(q=>q/mx))))+neg[k]));}
    const s=[0,0,0];if(m==='max'){for(const e of cs)for(let k=0;k<3;k++)s[k]=e.col[k]<0?s[k]+e.col[k]*e.f:Math.max(s[k],e.col[k]*e.f);return s;}
    for(const e of cs)for(let k=0;k<3;k++)s[k]+=e.col[k]*e.f;if(m==='add')return s.map(v=>clamp(v,-1,1));const mx=Math.max(...s);return mx>1?s.map(v=>v/mx):s;}
  return {tick(dt){t+=dt;fr++;const m=c.segv('m');if(c.v('jit')&&Math.floor(t*7)!==jt){jt=Math.floor(t*7);jit.forEach(j=>{j.r=.85+rnd()*.3;j.c=[0,(rnd()-.5)*.2,(rnd()-.5)*.14];});}
    const u=F.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=mix(contrib(x,y),m);const g=((x>>3)+(y>>3))&1?150:138,h=hash2(x,y)<.1?-12:0;const a=g+h;
      u[y*W+x]=pack(a*clamp(.1+s[0],0,1.2),a*clamp(.11+s[1],0,1.2),a*clamp(.18+s[2],0,1.2));}
    for(const L of (c.v('dark')?[...Ls,D]:Ls)){const col=L===D?U('#2a1830'):pack(255*Math.max(.3,L.c[0]),255*Math.max(.3,L.c[1]),255*Math.max(.3,L.c[2]));for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])u[((L.y|0)+dy)*W+(L.x|0)+dx]=col;}F.put();
    if(fr%5===0){setHud(root,({add:'add + clamp',max:'max per channel',norm:'add, then ÷ largest channel',lum:'luminance-weighted hue'})[m]);
      if(hov){const cs=contrib(...hov);const raw=[0,0,0];cs.forEach(e=>{for(let k=0;k<3;k++)raw[k]+=e.col[k]*e.f;});const f=v=>'('+v.map(q=>Math.round(clamp(q,-2,3)*255)).join(',')+')';
        ro.innerHTML=cs.length?`${cs.map(e=>e.L.n+' '+Math.round(e.f*100)+'%').join(' + ')} · raw sum <b>${f(raw)}</b> → add+clamp ${f(mix(cs,'add'))} · max ${f(mix(cs,'max'))} · normalise <b>${f(mix(cs,'norm'))}</b> · luminance ${f(mix(cs,'lum'))}`:'No light here.';}}}};});

// ======================================================================
// F1: nature (Sandbox village pond corner)
// ======================================================================
reg('nature',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root),V=mkVillage(777);const X0=160,Y0=90;V.npc.show=false;
  let hour=22.5,t=0,fr=0;const P=V.player;P.x=246;P.y=118;V.setCarried('lantern');c.seg('h',v=>hour=+v);
  c.on('lan',()=>{V.setCarried(c.v('lan')?'lantern':'none');if(!c.v('lan'))P.x=-60;});
  pointer(cv,([x,y],k)=>{if(k==='leave'||!c.v('lan'))return;const nx=X0+x,ny=Y0+y;P.dir=nx<P.x-.5?'left':nx>P.x+.5?'right':P.dir;P.moving=Math.hypot(nx-P.x,ny-P.y)>.3;P.x=nx;P.y=ny;P.anim+=.4;});
  return {tick(dt){t+=dt;fr++;V.update(dt,{hour});const r=V.render(F.u32,160,90,X0,Y0,{hour,t,mode:'banded',refl:c.v('refl'),flecks:c.v('fleck')});F.put();P.moving=false;
    if(fr%8===0){const S=r.S;const near=V.lights.filter(L=>L.on&&L.I>.1&&L.T.R>=12&&L.x>226&&L.x<316&&L.y>108&&L.y<176).length;
      setHud(root,`${fmtH(hour)} · ${near} light${near===1?'':'s'} glinting`);
      ro.innerHTML=`glint columns: <b>${near}</b> from lamps near the pond${S.dir&&S.el<10&&S.el>0?' + the low sun':''}${S.el<0?' + the moon':''} · fireflies ${V.flies[0].on?'<b>on</b>':'off'} and mushrooms ${V.mush.on?'<b>on</b>':'off'} below 3° of sun · ${c.v('fleck')?'about 8% of crown pixels let sun through':'crowns cast solid shade'}`;}}};});

// ======================================================================
// F3: buildings (house A with gaps, sun patches, spill, roof cutaway)
// ======================================================================
reg('buildings',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root),V=mkVillage(777);const X0=0,Y0=10;V.npc.show=false;
  const P=V.player;P.x=60;P.y=94;let t=0,fr=0,auto=!reduce;
  c.on('h',()=>auto=false);c.on('gaps',()=>V.setGaps(c.v('gaps')));
  c.btn('in',()=>{P.tx=60;P.ty=60;});c.btn('out',()=>{P.tx=60;P.ty=94;});
  pointer(cv,([x,y],k)=>{if(k==='down'){P.tx=X0+x;P.ty=Y0+y;}});
  return {tick(dt){t+=dt;fr++;if(auto&&motion){const e=c.el('h');e.value=((+e.value+dt*.25)%24).toFixed(2);}const hour=c.v('h');c.out('h',fmtH(hour));
    V.update(dt,{hour,speed:34});const rv=c.segv('roof');const st={hour,t,mode:'banded',view:c.segv('view')};if(rv==='on')st.roofOff=false;else if(rv==='off')st.roofOff=true;
    const r=V.render(F.u32,160,90,X0,Y0,st);F.put();
    if(fr%8===0){const inside=P.x>21&&P.x<99&&P.y>41&&P.y<81;const hA=V.houseOn().A,fire=V.LA[0].on;
      setHud(root,`${fmtH(hour)} · ${inside?'indoors':'outdoors'} · roof ${r.roofOff?'cut away':'on'}`);
      ro.innerHTML=`${r.roofOff?`interior: 28% of the sky ambient${r.S.dir?' + sun patches through the gaps':''}`:'roof on: the interior is hidden; roofs take 20% of point light'} · fireplace ${fire?'<b>lit</b>':'out'}, candle and windows ${hA?'<b>lit</b>':'dark'} · walls ${c.v('gaps')?'have door and window gaps, so light leaks both ways':'<b>sealed: a black box</b>'} · sun-shadow rebuilds: ${r.sunBuilds}`;}}};});

// ======================================================================
// G1/G2: banded + Bayer falloff, hue-shift ramps, colormap, glow rings
// ======================================================================
reg('banding',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);const W=F.W,H=F.H;
  const ALB=new Float32Array(W*H*3);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=hash2(x,y);let col;if(x>30&&x<130&&y>14&&y<82){const row=(y/5)|0,off=(row&1)*3;col=((x+off)%7===0||y%5===0)?[110,106,99]:(h<.4?[148,144,135]:[170,166,156]);}else col=vnoise(x/9,y/9)<.45?[79,125,62]:[95,143,72];const i=(y*W+x)*3;ALB[i]=col[0];ALB[i+1]=col[1];ALB[i+2]=col[2];}
  let L={x:80,y:48},drag=false,dirty=true;pointer(cv,([x,y],k)=>{if(k==='down')drag=true;if(k==='up')drag=false;if(drag&&(k==='down'||k==='drag')){L.x=x;L.y=y;dirty=true;}});
  ['n','mult'].forEach(k=>c.on(k,()=>dirty=true));['m','f','c'].forEach(k=>c.seg(k,()=>dirty=true));
  const fall=(d,f)=>{if(d>=1)return 0;const t=1-d;return f==='lin'?t:f==='smooth'?t*t*(3-2*t):f==='quad'?t*t:Math.pow(.8,d*15);};
  const amb=[.1,.12,.24];
  function quant(v,N,mult,B){if(mult){if(v<=.004)return 0;const k=Math.floor(Math.log(v)/Math.log(.6)+(B===undefined?0:-(B-.5)));return Math.pow(.6,Math.max(0,k));}return Math.floor(v*N+(B===undefined?0:B))/N;}
  return {tick(){if(!dirty)return;dirty=false;const m=c.segv('m'),f=c.segv('f'),N=c.v('n'),mult=c.v('mult'),col=hexf(c.segv('c'));c.out('n',N);const u=F.u32,R=62;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,a=[ALB[i*3],ALB[i*3+1],ALB[i*3+2]],B=bay(x,y)/16;const d=Math.hypot(x-L.x,y-L.y)/R;const v=fall(d,f);let o;
      if(m==='smooth'){o=a.map((q,k)=>q*(amb[k]+col[k]*v*1.3));}
      else if(m==='band'||m==='bayer'){const qv=quant(v,N,mult,m==='bayer'?B:undefined);o=a.map((q,k)=>q*(amb[k]+col[k]*qv*1.3));}
      else if(m==='gooch'){const kd=a.map(q=>q/255);const w=quant(v,N,false,B);const warm=kd.map((q,k)=>.4*(k<2?1:0)*(col[0]>col[2]?1:0)+.4*(col[0]>col[2]?0:col[k])+.6*q),cool=kd.map((q,k)=>(k===2?.4:0)+.2*q);
        o=kd.map((q,k)=>((1-w)*cool[k]*.55+w*warm[k]*1.15)*255);}
      else if(m==='cmap'){const lr=amb[0]+col[0]*v*1.3,lg=amb[1]+col[1]*v*1.3,lb=amb[2]+col[2]*v*1.3;const lum=.3*lr+.55*lg+.15*lb;const lev=clamp(Math.floor(lum*11+B),0,15),k=lev/10;let r=a[0]*k,g=a[1]*k,b=a[2]*k;if(k<.7){const w=(.7-k)/.7;r*=1-.28*w;g*=1-.2*w;b*=1+.25*w;}o=[r,g,b];}
      else{const ring=v>.6?3:v>.3?2:v>.1?1:0;const edge=v>.6-.06&&v<.6+.06||v>.3-.05&&v<.3+.05||v>.1-.04&&v<.1+.04;const rr=edge&&B>.5?Math.max(0,ring-1):ring;o=a.map((q,k)=>q*(amb[k]+col[k]*rr*.42));}
      u[i]=pack(o[0],o[1],o[2]);}
    for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])u[((L.y|0)+dy)*W+(L.x|0)+dx]=pack(255,250,230);F.put();
    svg.innerHTML='';const X=d=>20+d/1.2*232,Yv=v=>80-v*68;svgEl('line',{x1:20,x2:252,y1:80,y2:80,class:'ax'},svg);svgEl('line',{x1:X(1),x2:X(1),y1:8,y2:80,class:'gl'},svg);svgText(svg,X(1),88,'R',{'font-size':9,'text-anchor':'middle'});svgText(svg,20,88,'0',{'font-size':9});
    const p1=[],p2=[];for(let d=0;d<=1.2;d+=.004){const v=fall(d,f);p1.push([X(d),Yv(v)]);p2.push([X(d),Yv(quant(v,N,mult))]);}poly(svg,p1,{class:'s2'});poly(svg,p2,{class:'s1'});
    svgText(svg,250,14,mult?'steps ×0.6':`${N} bands`,{'font-size':9.5,class:'w','text-anchor':'end'});svgText(svg,250,26,'smooth falloff',{'font-size':9.5,class:'c','text-anchor':'end'});
    setHud(root,({smooth:'smooth',band:`${N} bands`,bayer:`${N} bands + 4×4 Bayer`,gooch:'Gooch warm/cool ramp',cmap:'DOOM colormap (luminance only)',rings:'3 dithered glow rings'})[m]);
    ro.innerHTML=m==='cmap'&&col[2]>col[0]?'Colormap mode looks up <b>luminance only</b>: the cyan light comes out as grey-white, the problem the study flags.':m==='gooch'?'I = ((1 + l·n)/2)·k_cool + (1 − (1 + l·n)/2)·k_warm, k_cool = (0,0,0.4) + 0.2·k_d, k_warm = (0.4,0.4,0) + 0.6·k_d, then quantised: shadows go blue, lit areas warm':`one threshold per pixel: <b>floor(l·${N}${m==='bayer'?' + bayer/16':''})/${N}</b>${mult?' with multiplicative steps':''} · falloff ${({lin:'linear',smooth:'t²(3 − 2t)',quad:'quadratic',geo:'0.8ⁿ (Minecraft-style)'})[f]}`;}};});

// ======================================================================
// G3: normal-mapped sprites + 2D bump lookup
// ======================================================================
reg('normals',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root),ro=$('[data-ro]',root);const W=96,H=60,N=W*H;
  const HT=new Float32Array(N),AL=new Float32Array(N*3);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let h=0,a=vnoise(x/6,y/6)<.5?[90,120,70]:[100,132,78];
    const dx=(x-24)/16,dy=(y-34)/11,r=dx*dx+dy*dy;if(r<1){h=Math.sqrt(1-r)*10+vnoise(x*.6,y*.6)*1.5;a=hash2(x,y)<.2?[120,116,108]:[150,146,138];}
    if(x>=52&&x<=64&&y>=16&&y<=44){const cx=(x-58)/6.5;h=Math.sqrt(Math.max(0,1-cx*cx))*6;a=(y===20||y===38)?[90,90,98]:[154,106,62];}
    if(x>=72&&x<=94&&y>=14&&y<=56){const row=((y-14)/6)|0,off=(row&1)*5,mort=((y-14)%6===0)||((x-72+off)%10===0);h=mort?0:3+vnoise(x*.8,y*.8);a=mort?[110,104,96]:[168,92,72];}
    HT[i]=h;AL[i*3]=a[0];AL[i*3+1]=a[1];AL[i*3+2]=a[2];}
  const NR=new Float32Array(N*3),NQ=new Float32Array(N*3);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const hx=(HT[y*W+Math.min(W-1,x+1)]-HT[y*W+Math.max(0,x-1)])/2,hy=(HT[Math.min(H-1,y+1)*W+x]-HT[Math.max(0,y-1)*W+x])/2;
    let nx=-hx,ny=-hy,nz=1;const l=Math.hypot(nx,ny,nz);nx/=l;ny/=l;nz/=l;NR[i*3]=nx;NR[i*3+1]=ny;NR[i*3+2]=nz;
    const tilt=Math.acos(nz);let qx=0,qy=0,qz=1;if(tilt>.18){const az=Math.round(Math.atan2(ny,nx)/(Math.PI/4))*(Math.PI/4),tl=tilt>.7?1.0:.5;qx=Math.cos(az)*Math.sin(tl);qy=Math.sin(az)*Math.sin(tl);qz=Math.cos(tl);}NQ[i*3]=qx;NQ[i*3+1]=qy;NQ[i*3+2]=qz;}
  // 2D bump texture and radial light map
  const BH=new Float32Array(N),BA=new Float32Array(N*3);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,row=(y/8)|0,off=(row&1)*8,mort=(y%8===0)||((x+off)%16===0);BH[i]=mort?20:120+vnoise(x*.7,y*.7)*60+hash2(x,y)*20;const a=mort?[120,112,104]:[176,96,74];BA[i*3]=a[0];BA[i*3+1]=a[1];BA[i*3+2]=a[2];}
  const LMB=new Float32Array(256*256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const r=Math.hypot(x-128,y-128)/128;LMB[y*256+x]=Math.max(0,1-r)**2;}
  let L1={x:40,y:20},L2={x:48,y:30},d1=true,d2=true;
  pointer(cvs[0],([x,y],k)=>{if(k!=='leave'){L1.x=x;L1.y=y;d1=true;}});pointer(cvs[1],([x,y],k)=>{if(k!=='leave'){L2.x=x;L2.y=y;d2=true;}});
  ['q','lh'].forEach(k=>c.on(k,()=>d1=true));c.seg('v',()=>d1=true);c.on('bd',()=>d2=true);let t=0;
  return {tick(dt){t+=dt;if(!motion&&!d1&&!d2)return;if(motion&&!d1){L1.x=48+Math.cos(t*.7)*34;L1.y=30+Math.sin(t*.9)*20;d1=true;}
    if(d1){d1=false;const v=c.segv('v'),q=c.v('q'),lh=c.v('lh'),u=A.u32,NN=q?NQ:NR;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let nx=NN[i*3],ny=NN[i*3+1],nz=NN[i*3+2];if(v==='nrm'){u[i]=pack((nx*.5+.5)*255,(ny*.5+.5)*255,(nz*.5+.5)*255);continue;}if(v==='flat'){nx=0;ny=0;nz=1;}
        let lx=L1.x-x,ly=L1.y-y,lz=lh-HT[i];const d=Math.hypot(lx,ly);const l=Math.hypot(lx,ly,lz);lx/=l;ly/=l;lz/=l;const df=Math.max(0,nx*lx+ny*ly+nz*lz),at=Math.max(0,1-d/95)**2*1.8;
        u[i]=pack(AL[i*3]*(.12+df*at),AL[i*3+1]*(.12+df*at*.85),AL[i*3+2]*(.2+df*at*.6));}
      for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]){const xx=(L1.x|0)+dx,yy=(L1.y|0)+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=pack(255,240,190);}A.put();setHud(root,`light height ${lh} px`);}
    if(d2){d2=false;const bd=c.v('bd'),u=B.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const dx=(BH[i]-BH[y*W+Math.max(0,x-1)])*bd*.12,dy=(BH[i]-BH[Math.max(0,y-1)*W+x])*bd*.12;
        const uu=clamp(Math.round(128+dx-(x-L2.x)*2.6),0,255),vv=clamp(Math.round(128+dy-(y-L2.y)*2.6),0,255);const I=LMB[vv*256+uu]*1.5;u[i]=pack(BA[i*3]*(.1+I),BA[i*3+1]*(.1+I*.85),BA[i*3+2]*(.16+I*.6));}B.put();setHud(root,'3 fetches per pixel','r');
      ro.innerHTML=`normal map: one dot product per pixel per light, ${c.v('q')?'normals snapped to 17 directions (flat + 8 azimuths × 2 tilts)':'smooth normals'} · 2D bump: dx, dy from two neighbour reads, then <b>lightmap[128+dx][128+dy]</b> offset by the light: 3 reads per pixel, no maths beyond adds`;}}};});

// ======================================================================
// H1: radiance cascades, conceptual + brute-force reference
// ======================================================================
reg('rc',root=>{const cvs=$$('canvas',root),g=cvs[0].getContext('2d'),RF=PX(cvs[1]),c=ctl(root),ro=$('[data-ro]',root);const W=160,H=90;
  const walls=[[60,10,6,40],[60,60,6,24],[100,40,40,6],[20,70,24,5]];let E=[{x:34,y:40,r:6,c:[1,.55,.2]},{x:132,y:22,r:4,c:[.3,.5,1]}];let drag=false,dirtyR=true,dirtyV=true;
  const isWall=(x,y)=>walls.some(([a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h);const emit=(x,y)=>{for(const e of E)if((x-e.x)**2+(y-e.y)**2<=e.r*e.r)return e.c;return null;};
  let hp={x:96,y:52};pointer(cvs[0],([x,y],k)=>{if(k==='down')drag=Math.hypot(x-E[0].x,y-E[0].y)<12;if(k==='up')drag=false;if(drag&&(k==='down'||k==='drag')){E[0].x=clamp(x,8,W-8);E[0].y=clamp(y,8,H-8);dirtyR=true;dirtyV=true;}else if(k!=='leave'){hp={x,y};dirtyV=true;}});c.seg('c',()=>dirtyV=true);
  const bg=document.createElement('canvas');bg.width=W;bg.height=H;{const p=PX(bg);for(let y=0;y<H;y++)for(let x=0;x<W;x++)p.u32[y*W+x]=isWall(x,y)?U('#4a4258'):((x>>3)+(y>>3))&1?U('#1a1620'):U('#16131b');p.put();}
  function drawV(){const ci=+c.segv('c'),sp=4*2**ci,nr=4*4**ci,a=4*(4**ci-1)/3,b=4*(4**(ci+1)-1)/3;g.imageSmoothingEnabled=false;g.drawImage(bg,0,0);
    for(const e of E){g.fillStyle=rgbCss(e.c[0]*255,e.c[1]*255,e.c[2]*255);g.beginPath();g.arc(e.x,e.y,e.r,0,7);g.fill();}
    const col=['255,200,112','142,168,255','255,143,122','109,212,195'][ci];let np=0;const qx=Math.floor(hp.x/sp),qy=Math.floor(hp.y/sp);
    for(let py=sp/2;py<H;py+=sp)for(let px=sp/2;px<W;px+=sp){np++;const ix=Math.floor(px/sp),iy=Math.floor(py/sp),dd=Math.max(Math.abs(ix-qx),Math.abs(iy-qy));if(dd>1)continue;
      g.strokeStyle=`rgba(${col},${dd===0?.95:.3})`;g.lineWidth=dd===0?.8:.5;g.beginPath();for(let k=0;k<nr;k++){const an=(k+.5)/nr*Math.PI*2,cx=Math.cos(an),cy=Math.sin(an);g.moveTo(px+cx*a,py+cy*a);g.lineTo(px+cx*b,py+cy*b);}g.stroke();}
    g.fillStyle=`rgb(${col})`;for(let py=sp/2;py<H;py+=sp)for(let px=sp/2;px<W;px+=sp)g.fillRect(px-.5,py-.5,ci===0?1:2,ci===0?1:2);
    const rows=[0,1,2,3].map(k=>{const s=4*2**k,n=4*4**k,p=Math.ceil(W/s)*Math.ceil(H/s);return `C${k}: ${p} probes × ${n} rays = <b>${(p*n).toLocaleString()}</b>, interval ${Math.round(4*(4**k-1)/3)}–${Math.round(4*(4**(k+1)-1)/3)} px`;});
    ro.innerHTML=rows.join(' · ')+` · naive: ${(W*H).toLocaleString()} px × 512 rays = <b>${(W*H*512).toLocaleString()}</b>`;setHud(root,`cascade ${ci}: ${np} probes, ${nr} rays each`);}
  function drawR(){const u=RF.u32;for(let y=0;y<22;y++)for(let x=0;x<40;x++){const px=x*4+2,py=y*4+2;if(isWall(px,py)){u[y*40+x]=U('#4a4258');continue;}const e0=emit(px,py);if(e0){u[y*40+x]=pack(e0[0]*255,e0[1]*255,e0[2]*255);continue;}
      let r=0,gg=0,b=0;for(let k=0;k<64;k++){const an=(k+hash2(x,y)*.9)/64*Math.PI*2,dx=Math.cos(an),dy=Math.sin(an);for(let s=2;s<150;s+=2){const qx=px+dx*s,qy=py+dy*s;if(qx<0||qy<0||qx>=W||qy>=H)break;if(isWall(qx,qy))break;const e=emit(qx,qy);if(e){r+=e[0];gg+=e[1];b+=e[2];break;}}}
      const k=4.5/64;u[y*40+x]=pack(Math.min(255,(r*k)**.7*255),Math.min(255,(gg*k)**.7*255),Math.min(255,(b*k)**.7*255));}RF.put();}
  return {tick(){if(dirtyV){drawV();dirtyV=false;}if(dirtyR){drawR();dirtyR=false;}}};});
