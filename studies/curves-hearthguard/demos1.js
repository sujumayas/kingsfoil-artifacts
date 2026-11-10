// ======================================================================
// Hearthguard curve figures, part 1: hero, flow, ratio, waves, hearth, gold, learning.
// Numbers come from notes/curves_model.py (rules from the game repo at b509a56).
// Wrapped in a block so names do not clash with other demos*.js files.
// ======================================================================
{
const HPS=[1.0,2.3,4.6,8.0,13.0],ATS=[1.0,1.6,2.4,3.3,4.4],STEP=.07;
// hero level at each wave start, solo Fighter that kills everything (curves_model.py)
const LV=[1,1,2,3,4,5,7,8,8,9,10,11,13,13,13,14,15,15,17,18,18,19,20,21,23,23,24,24,25,26];
const GOLD=[25,41,43,73,62,249,82,135,128,277,197,547,154,268,258,578,386,1037,254,418,398,930,597,1724,380,681,633,1550,955,2782];
const BOSS=[8000,16000,28000,42000,60000],BOSSN=['Mossback','Warden','Deep Wyrm','Sleeper','Astaroth'];
const CHC=['#7fd6a0','#8ea8ff','#ffc870','#e07ab0','#c9a2ff'];
const PROP={hs:[1.0,2.5,4.3,7.1,11.3],st:.03,lv:[1,1,3,3,5,5,8,8,9,10,11,12,14,14,15,15,17,17,20,20,21,21,23,24,26,26,27,28,29,30]}; // the report's §11 proposal; lv = model levels with xp_to_next 80+70L+3L²
const hpm=(i,hs=HPS,st=STEP)=>hs[i/6|0]*(1+st*(i%6));
const atm=i=>ATS[i/6|0]*(1+STEP*(i%6));
const dmgm=(i,g=1.09,L=LV)=>{const lv=L[i]-1;return (32*Math.pow(g,lv)+2.4*lv)/32;};
const ratio=(i,g,hs,st,L)=>dmgm(i,g,L)/hpm(i,hs,st);
const mobs=i=>{const c=i/6|0,w=i%6;return w<5?Math.round([14+8*c,22+12*c,18+10*c,40+30*c,28+16*c][w]*1.08):0;};
const TGT=i=>.9+.06*(i%6); // illustrative target sawtooth: 0.90 at a chapter start, 1.20 by its boss
const wl=i=>`Ch ${(i/6|0)+1} · W ${i%6+1}`;
const f2=v=>v.toFixed(2),fk=v=>v>=1000?(v/1000).toFixed(v>=10000?0:1)+'k':String(Math.round(v));
const pct=v=>(v>=0?'+':'')+Math.round(v*100)+'%';

// tiny chart frame: margins [top,right,bottom,left]
function frame(svg,W,H,p,x0,x1,y0,y1,log){svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML='';
  const f=log?Math.log:v=>v,X=v=>p[3]+(v-x0)/(x1-x0)*(W-p[1]-p[3]),Y=v=>H-p[2]-(f(v)-f(y0))/(f(y1)-f(y0))*(H-p[0]-p[2]);
  return {X,Y,W,H,p,top:p[0],bot:H-p[2],l:p[3],r:W-p[1]};}
function yTicks(svg,c,ts,fmt){ts.forEach(t=>{svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(t),y2:c.Y(t),class:'gl'},svg);svgText(svg,c.l-4,c.Y(t)+3.5,fmt?fmt(t):t,{'text-anchor':'end','font-size':10});});}
function chBands(svg,c,lab=true){for(let k=0;k<5;k++){const a=c.X(k*6-.5),b=c.X(k*6+5.5);
  if(k%2)svgEl('rect',{x:a,y:c.top,width:b-a,height:c.bot-c.top,fill:'#fff','fill-opacity':.035},svg);
  if(lab)svgText(svg,(a+b)/2,c.bot+13,'Ch '+(k+1),{'text-anchor':'middle','font-size':10,fill:CHC[k]});}}
function hline(svg,c,y,attrs){return svgEl('line',{x1:c.l,x2:c.r,y1:y,y2:y,...attrs},svg);}
function ylab(svg,c,t){const y=(c.top+c.bot)/2;svgText(svg,9,y,t,{transform:`rotate(-90 9 ${y})`,'text-anchor':'middle','font-size':10});}
function hitBars(svg,c,fn){for(let i=0;i<30;i++){const r=svgEl('rect',{x:c.X(i-.5),y:c.top,width:c.X(1)-c.X(0),height:c.bot-c.top,fill:'transparent'},svg);
  r.addEventListener('pointerenter',()=>fn(i));r.addEventListener('click',()=>fn(i));}}

// ======================================================================
// hero: the 30-wave ratio line drawn on, with a target sawtooth
// ======================================================================
reg('hero',root=>{const svg=$('svg',root);const c=frame(svg,320,180,[10,8,20,28],-.5,29.5,.5,1.4);
  chBands(svg,c);yTicks(svg,c,[.6,.8,1,1.2,1.4],v=>v.toFixed(1));
  hline(svg,c,c.Y(1),{stroke:'#9e94ad','stroke-dasharray':'4 3'});
  for(let k=0;k<5;k++)poly(svg,[0,1,2,3,4,5].map(w=>[c.X(k*6+w),c.Y(TGT(k*6+w))]),{stroke:'#8ea8ff','stroke-opacity':.45,'stroke-width':1.5,'stroke-dasharray':'2 2'});
  svgText(svg,c.r-2,c.Y(1.2)-5,'target sawtooth',{'font-size':9,fill:'#8ea8ff','text-anchor':'end'});
  const pts=[...Array(30)].map((_,i)=>[c.X(i),c.Y(ratio(i))]);let len=0;const cum=[0];
  for(let i=1;i<30;i++){len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);cum.push(len);}
  const ln=poly(svg,pts,{stroke:'#ffc870','stroke-width':2.4,'stroke-linejoin':'round','stroke-dasharray':len,'stroke-dashoffset':len});
  const cur=svgEl('line',{y1:c.top,y2:c.bot,stroke:'#ece6f2','stroke-opacity':.35},svg),dot=svgEl('circle',{r:3.5,fill:'#ffc870',stroke:'#0e0c12'},svg);
  let t=0,last=-1;
  return {tick(dt){t+=dt;const p=motion?Math.min(1,t/3.5):1;ln.setAttribute('stroke-dashoffset',len*(1-p));
    const i=p<1?Math.min(29,Math.floor(p*29.99)):Math.floor(motion?((t-3.5)*2.2)%30:29);
    if(i!==last){last=i;const x=pts[i][0];cur.setAttribute('x1',x);cur.setAttribute('x2',x);dot.setAttribute('cx',x);dot.setAttribute('cy',pts[i][1]);
      setHud(root,`${wl(i)} · Lv ${LV[i]} · ratio ${f2(ratio(i))}`);}}};});

// ======================================================================
// flow: challenge vs skill plane with the 30 waves as a path
// ======================================================================
reg('flow',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);
  const X0=.8,X1=14,Y0=.8,Y1=20,LO=.8,HI=1.25;
  function draw(){const c=frame(svg,360,270,[10,10,30,36],Math.log(X0),Math.log(X1),Y0,Y1,true);const X=v=>c.X(Math.log(v));
    const cp=svgEl('clipPath',{id:'flowclip'},svg);svgEl('rect',{x:c.l,y:c.top,width:c.r-c.l,height:c.bot-c.top},cp);
    const g=svgEl('g',{'clip-path':'url(#flowclip)'},svg);
    svgEl('rect',{x:c.l,y:c.top,width:c.r-c.l,height:c.bot-c.top,fill:'#ff8f7a','fill-opacity':.07},g);
    const up=[],dn=[];for(let k=0;k<=40;k++){const x=X0*Math.pow(X1/X0,k/40);up.push([X(x),c.Y(x/LO)]);dn.push([X(x),c.Y(x/HI)]);}
    const P=a=>a.map(p=>p.join(',')).join(' ');
    svgEl('polygon',{points:P([...dn,[X(X1),c.bot+60],[X(X0),c.bot+60]]),fill:'#8ea8ff','fill-opacity':.09},g);
    svgEl('polygon',{points:P([...up,...dn.slice().reverse()]),fill:'#7fd6a0','fill-opacity':.16},g);
    [1,2,5,10].forEach(v=>{svgEl('line',{x1:X(v),x2:X(v),y1:c.top,y2:c.bot,class:'gl'},svg);svgText(svg,X(v),c.bot+13,v+'x',{'text-anchor':'middle','font-size':10});});
    yTicks(svg,c,[1,2,5,10,20],v=>v+'x');
    svgText(svg,(c.l+c.r)/2,c.bot+26,'Hero power: damage multiplier (log)',{'text-anchor':'middle','font-size':10});
    ylab(svg,c,'Challenge: mob HP multiplier (log)');
    svgText(svg,c.l+8,c.top+14,'Anxiety',{'font-size':12,fill:'#ff8f7a'});
    svgText(svg,c.r-8,c.bot-8,'Boredom',{'font-size':12,fill:'#8ea8ff','text-anchor':'end'});
    svgText(svg,X(6),c.Y(6)-6,'flow channel',{'font-size':10,fill:'#7fd6a0','text-anchor':'middle',transform:`rotate(-34 ${X(6)} ${c.Y(6)-6})`});
    const tgt=c0.v('tgt');
    if(tgt){for(let k=0;k<5;k++)poly(svg,[0,1,2,3,4,5].map(w=>{const i=k*6+w;return [X(dmgm(i)),c.Y(dmgm(i)/TGT(i))];}),{stroke:'#8ea8ff','stroke-width':1.6,'stroke-dasharray':'3 2'});}
    poly(svg,[...Array(30)].map((_,i)=>[X(dmgm(i)),c.Y(hpm(i))]),{stroke:'#ffc870','stroke-opacity':.6,'stroke-width':1.4});
    for(let i=0;i<30;i++){const k=i/6|0;const d=svgEl('circle',{cx:X(dmgm(i)),cy:c.Y(hpm(i)),r:i%6===0?4.2:3,fill:CHC[k],stroke:'#0e0c12','stroke-width':1,class:'dot',tabindex:0,'data-i':i},svg);
      if(tgt&&i%6===0)svgText(svg,X(dmgm(i))+5,c.Y(hpm(i))-5,'C'+(k+1),{'font-size':9,fill:CHC[k]});}}
  function show(i){const r=ratio(i),zone=r>HI?'boredom side':r<LO?'anxiety side':'inside the channel';
    ro.innerHTML=`<b>${wl(i)}</b> · hero damage ${f2(dmgm(i))}x · mob HP ${f2(hpm(i))}x · ratio ${f2(r)} · ${zone}`+(c0.v('tgt')?` · target ratio ${f2(TGT(i))}`:'');}
  const pick=e=>{const d=e.target.closest('.dot');if(d)show(+d.dataset.i);};
  svg.addEventListener('pointerover',pick);svg.addEventListener('click',pick);svg.addEventListener('focusin',pick);
  c0.on('tgt',()=>{draw();show(12);});draw();show(12);return {};});

// ======================================================================
// ratio: power ratio per wave with growth slider and HP_SCALE preset
// ======================================================================
reg('ratio',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let pre='cur',hov=-1;
  function draw(){const g=1+c0.v('g')/100;c0.out('g',c0.v('g')+'%');const P=pre==='prop'?PROP:{hs:HPS,st:STEP,lv:LV};
    const R=[...Array(30)].map((_,i)=>ratio(i,g,P.hs,P.st,P.lv));const ymax=Math.max(1.6,Math.ceil(Math.max(...R)*5)/5);
    const c=frame(svg,360,210,[10,8,22,30],-.5,29.5,0,ymax);chBands(svg,c);
    const ts=[];for(let v=0;v<=ymax+1e-9;v+=ymax>2.4?.5:.2)ts.push(+v.toFixed(1));yTicks(svg,c,ts,v=>v.toFixed(1));
    const bw=(c.X(1)-c.X(0))*.72;
    R.forEach((r,i)=>svgEl('rect',{x:c.X(i)-bw/2,y:c.Y(r),width:bw,height:c.bot-c.Y(r),fill:CHC[i/6|0],'fill-opacity':i===hov?1:.75},svg));
    hline(svg,c,c.Y(1),{stroke:'#ece6f2','stroke-dasharray':'4 3','stroke-opacity':.7});svgText(svg,c.r-2,c.Y(1)-4,'1.0 = start balance',{'text-anchor':'end','font-size':9});
    hitBars(svg,c,i=>{hov=i;draw();});
    const r2=i=>Math.round(R[i]*100)/100;// rounded like the notes' table
    const drops=[1,2,3,4].map(k=>`Ch${k}→${k+1} <b>${pct(r2(6*k)/r2(6*k-1)-1)}</b>`).join(' · ');
    const ins=[0,1,2,3,4].map(k=>`Ch${k+1} ${pct(r2(6*k+5)/r2(6*k)-1)}`).join(' · ');
    ro.innerHTML=`Drop at each chapter start: ${drops}<br>Change inside each chapter: ${ins}`+(hov>=0?`<br><b>${wl(hov)}</b> · Lv ${P.lv[hov]} · hero ${f2(dmgm(hov,g,P.lv))}x · mob HP ${f2(hpm(hov,P.hs,P.st))}x · ratio ${f2(R[hov])}`:'');}
  c0.on('g',draw);c0.seg('p',v=>{pre=v;draw();});draw();return {};});

// ======================================================================
// waves: mobs per corridor per wave, horde and boss marked, player count
// ======================================================================
reg('waves',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let n=1,hov=-1;
  function draw(){const ymax=n*190;const c=frame(svg,360,226,[32,8,22,42],-.5,29.5,0,ymax);chBands(svg,c);
    const st=n===1?50:n===2?100:150;const ts=[];for(let v=0;v<=ymax;v+=st)ts.push(v);yTicks(svg,c,ts);
    const bw=(c.X(1)-c.X(0))*.72;
    for(let i=0;i<30;i++){const w=i%6,k=i/6|0,x=c.X(i);
      if(w<5){const v=mobs(i)*n;svgEl('rect',{x:x-bw/2,y:c.Y(v),width:bw,height:c.bot-c.Y(v),fill:w===3?'#ff8f7a':CHC[k],'fill-opacity':i===hov?1:w===3?.9:.55},svg);
        if(w===3)svgText(svg,x,c.Y(v)-3,v,{'text-anchor':'middle','font-size':8.5,fill:'#ff8f7a'});}
      else{const hp=BOSS[k]*(1+.75*(n-1));svgEl('path',{d:`M${x} ${c.top-14}l5 6-5 6-5-6z`,fill:'#ffc870'},svg);
        svgText(svg,x,c.top-17,fk(hp),{'text-anchor':'middle','font-size':8.5,fill:'#ffc870'});
        svgEl('line',{x1:x,x2:x,y1:c.top-2,y2:c.bot,stroke:'#ffc870','stroke-opacity':.25,'stroke-dasharray':'2 3'},svg);}}
    ylab(svg,c,n===1?'Mobs in one corridor':'Mobs across '+n+' corridors');
    hitBars(svg,c,i=>{hov=i;draw();});
    let tot=0;for(let i=0;i<30;i++)tot+=mobs(i)*n;
    const h=hov>=0?(hov%6<5?`<b>${wl(hov)}</b> · ${mobs(hov)} per corridor × ${n} = ${mobs(hov)*n} mobs${hov%6===3?' · Horde, three surges 9 s apart':''}`:
      `<b>${wl(hov)}</b> · ${BOSSN[hov/6|0]} ${BOSS[hov/6|0].toLocaleString('en')} HP × ${(1+.75*(n-1)).toFixed(2)} = ${Math.round(BOSS[hov/6|0]*(1+.75*(n-1))).toLocaleString('en')} HP, in one corridor, plus adds every 5 s`):'Hover or tap a wave.';
    ro.innerHTML=`${n} player${n>1?'s':''}: <b>${tot.toLocaleString('en')}</b> wave mobs over the run, not counting elites and boss adds · Horde peak ${mobs(27)*n}<br>${h}`;}
  c0.seg('n',v=>{n=+v;draw();});draw();return {};});

// ======================================================================
// hearth: Hearth margin against mob attack growth
// ======================================================================
reg('hearth',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let n=1,hov=-1;
  function draw(){const q=c0.v('q');c0.out('q',q?'+'+q*12+'%':'none');const H=6500*(1+.5*(n-1))*(1+.12*q);
    const M=i=>H/6500/atm(i)*100,Mc=i=>M(i)/n;const ymax=Math.max(100,Math.ceil(M(0)/50)*50);
    const c=frame(svg,360,210,[14,8,22,42],-.5,29.5,0,ymax);chBands(svg,c);
    const ts=[];for(let v=0;v<=ymax;v+=ymax>200?50:25)ts.push(v);yTicks(svg,c,ts);
    hline(svg,c,c.Y(100),{stroke:'#ece6f2','stroke-dasharray':'4 3','stroke-opacity':.5});
    const A=[...Array(30)].map((_,i)=>[c.X(i),c.Y(M(i))]),B=[...Array(30)].map((_,i)=>[c.X(i),c.Y(Mc(i))]);
    svgEl('polygon',{points:[...A,[c.X(29),c.bot],[c.X(0),c.bot]].map(p=>p.join(',')).join(' '),fill:'#7fd6a0','fill-opacity':.1},svg);
    poly(svg,A,{stroke:'#7fd6a0','stroke-width':2});
    if(n>1)poly(svg,B,{stroke:'#ff8f7a','stroke-width':2,'stroke-dasharray':'4 2'});
    svgText(svg,c.X(5),c.Y(M(5))-8,'whole Hearth',{'font-size':10,fill:'#7fd6a0'});
    if(n>1)svgText(svg,c.X(7),c.Y(Mc(7))-6,'per corridor',{'font-size':10,fill:'#ff8f7a'});
    ylab(svg,c,'Hits it can take (ch1 w1 solo = 100)');
    hitBars(svg,c,i=>{hov=i;draw();});
    const i=hov>=0?hov:28;
    ro.innerHTML=`Hearth <b>${Math.round(H).toLocaleString('en')}</b> HP for ${n} player${n>1?'s':''}${q?`, Quarry level ${q}`:''} · drained by ${n} corridor${n>1?'s':''}<br>`+
      `<b>${wl(i)}</b> · mob attack ${f2(atm(i))}x · margin ${Math.round(M(i))}${n>1?`, ${Math.round(Mc(i))} per corridor`:''} · one leak costs ${f2(atm(i))}x a ch1 w1 leak`;}
  c0.on('q',draw);c0.seg('n',v=>{n=+v;draw();});draw();return {};});

// ======================================================================
// gold: cumulative gold vs Town cost
// ======================================================================
reg('gold',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let hov=-1;
  const CUM=[];GOLD.reduce((a,g,i)=>(CUM[i]=a+g),0);
  const TOWN=[1100];for(let k=1;k<5;k++)TOWN.push(TOWN[k-1]+1100*Math.pow(1.7,k));// 1,100 · 2,970 · 6,149 · 11,553 · 20,741
  function draw(){const trio=c0.v('trio');const c=frame(svg,360,230,[10,30,22,36],-.5,30.5,20,trio?100000:30000,true);chBands(svg,c);
    yTicks(svg,c,trio?[100,1000,10000,100000]:[30,100,300,1000,3000,10000,30000],fk);
    TOWN.forEach((v,k)=>{hline(svg,c,c.Y(v),{stroke:'#c9a2ff','stroke-opacity':k===0||k===4?.8:.35,'stroke-dasharray':'3 3'});
      svgText(svg,c.r+3,c.Y(v)+3.5,'L'+(k+1),{'font-size':9,fill:'#c9a2ff'});});
    svgText(svg,c.r+3,c.Y(TOWN[4])-12,'Town',{'font-size':9,fill:'#c9a2ff'});
    const x30=c.X(30);svgEl('rect',{x:x30-5,y:c.Y(25000),width:10,height:c.Y(13000)-c.Y(25000),fill:'#ff8f7a','fill-opacity':.5},svg);
    svgText(svg,x30-8,c.Y(25000)-4,'bots: 13k-25k unspent',{'font-size':9,fill:'#ff8f7a','text-anchor':'end'});
    poly(svg,CUM.map((v,i)=>[c.X(i),c.Y(v)]),{stroke:'#ffc870','stroke-width':2.2});
    if(trio)poly(svg,CUM.map((v,i)=>[c.X(i),c.Y(v*4.8)]),{stroke:'#7fd6a0','stroke-width':2.2,'stroke-dasharray':'5 2'});
    svgText(svg,c.X(14),c.Y(CUM[14])+16,'solo',{'font-size':10,fill:'#ffc870'});if(trio)svgText(svg,c.X(8),c.Y(CUM[8]*4.8)-6,'trio team (≈4.8x solo)',{'font-size':10,fill:'#7fd6a0'});
    hitBars(svg,c,i=>{hov=i;draw();});
    const when=m=>{const i=CUM.findIndex(v=>v*m>=1100),j=CUM.findIndex(v=>v*m>=20741);return `all nine at L1 by ${i<0?'never':wl(i)}, ${j<0?'all at L5 not reached in this run':'all at L5 by '+wl(j)}`;};
    const i=hov>=0?hov:29;
    ro.innerHTML=`Solo: ${when(1)}${trio?`<br>Trio: ${when(4.8)}`:''}<br><b>${wl(i)}</b> · solo earned ${CUM[i].toLocaleString('en')} gold so far${trio?` · trio team ≈ ${Math.round(CUM[i]*4.8).toLocaleString('en')}`:''}`;}
  c0.on('trio',draw);draw();return {};});

// ======================================================================
// learning: the first six and a half minutes
// ======================================================================
reg('learning',root=>{const svg=$('svg',root),ro=$('[data-ro]',root);
  const EV=[[0,'Intro','Help panel, 15 lines, hides after 9 s'],[0,'Intro','Right-click move and attack, A-move, S, H, camera'],[0,'Intro','Skill point at level 1, learn with Ctrl+QWER'],[0,'Intro','Space calls the wave early for gold'],
    [4,'1.1','Melee, ranged and hex mobs (opening roster of 3)'],[29,'1.2','Full roster of 7: web slow, vine root, Boar charge telegraph'],[38,'1.2','Ability ranks gated at levels 1/3/5/7'],
    [57,'1.3','First elite (Ogre King), telegraphed area move, guaranteed potion'],[60,'1.3','Potion belt (1-4) and the Alchemist at the Hearth'],[86,'1.3','Road fires get bashed; relight by holding the ring 5 s (P1\'s first fire went out at 1:26)'],
    [107,'1.4','The Horde, three surges 9 s apart'],[125,'1.4','Level 4: first talent row, 3 choices, opened over a live fight'],[147,'1.5','Second elite (Broodmother) births spiders'],
    [186,'1.6','First boss: phases at 70% and 35%, telegraphs, enrage at 150 s'],[225,'1.6','Level 6: ultimate R unlocks mid-boss'],
    [370,'Camp','Campfire 25 s: Town building, Alchemist anywhere, fires relit'],[377,'2.1','Damage types and resists'],[390,'2.1','Level 8: second talent row']];
  const WV=[[4,'1.1'],[29,'1.2'],[57,'1.3'],[107,'1.4'],[147,'1.5'],[186,'1.6'],[370,'camp'],[377,'']];
  const c=frame(svg,360,230,[10,10,24,30],0,400,0,8);const X=c.X;
  const mm=s=>`${s/60|0}:${String(s%60).padStart(2,'0')}`;
  for(let s=0;s<=390;s+=60){svgEl('line',{x1:X(s),x2:X(s),y1:c.top,y2:c.bot,class:'gl'},svg);svgText(svg,X(s),c.bot+13,mm(s),{'text-anchor':'middle','font-size':10});}
  // Horde span and talent spot
  svgEl('rect',{x:X(107),y:c.top,width:X(147)-X(107),height:c.bot-c.top,fill:'#ff8f7a','fill-opacity':.12},svg);
  svgText(svg,X(127),c.top+10,'Horde',{'text-anchor':'middle','font-size':9.5,fill:'#ff8f7a'});
  // wave strip
  const yS=104;WV.forEach((w,k)=>{const b=k<WV.length-1?WV[k+1][0]:400;svgEl('rect',{x:X(w[0]),y:yS,width:Math.max(1,X(b)-X(w[0])-1),height:10,fill:w[1]==='camp'?'#7fd6a0':k%2?'#3a3046':'#2a2232'},svg);
    if(w[1]&&w[1]!=='camp'&&X(b)-X(w[0])>16)svgText(svg,(X(w[0])+X(b))/2,yS+8.5,w[1],{'text-anchor':'middle','font-size':8,fill:'#ece6f2'});});
  // load bars: new things per 30 s
  const BK=[];for(let s=0;s<390;s+=30)BK.push(EV.filter(e=>e[0]>=s&&e[0]<s+30).length);
  const by0=c.bot,bh=60;svgText(svg,c.l,by0-bh-4,'new things per 30 s',{'font-size':9});
  BK.forEach((v,k)=>{const h=v/8*bh;svgEl('rect',{x:X(k*30)+1,y:by0-h,width:X(30)-X(0)-2,height:h,fill:v>=3?'#ff8f7a':'#8ea8ff','fill-opacity':.7},svg);if(v)svgText(svg,X(k*30+15),by0-h-2,v,{'text-anchor':'middle','font-size':8.5});});
  // event dots stacked above the strip
  const seen={};const dots=EV.map((e,i)=>{const k=Math.round(e[0]/12);const n=seen[k]=(seen[k]||0)+1;const x=X(e[0])+4,y=yS-10-(n-1)*12;
    const d=svgEl('circle',{cx:x,cy:y,r:4.5,fill:i===11?'#ffc870':e[1]==='Intro'?'#9e94ad':'#8ea8ff',stroke:'#0e0c12',class:'dot',tabindex:0,'data-i':i},svg);return d;});
  svgText(svg,X(125)+4,yS+22,'first talent ↑',{'font-size':9,fill:'#ffc870','text-anchor':'middle'});
  const show=i=>{dots.forEach((d,k)=>d.classList.toggle('on',k===i));const e=EV[i];ro.innerHTML=`<b>${mm(e[0])}</b> · wave ${e[1]} · ${e[2]}`;};
  const pick=e=>{const d=e.target.closest('.dot');if(d)show(+d.dataset.i);};
  svg.addEventListener('pointerover',pick);svg.addEventListener('click',pick);svg.addEventListener('focusin',pick);show(11);return {};});
}
