// ======================================================================
// Asterion curve figures, part 1: hero, expcurve, skilltries, magiclevel,
// walkbeat, onboarding, experiments.
// Every formula is ported literally from notes/01-current-build.md (Q1 table,
// file:line in the captions) and checked against its test values: exp L2 = 100,
// L8 = 4,200; sword 50 = 12,932 tries = 14.4 h of session; a rat death at level 8
// is 52 min at 480 exp/h. Twin formulas come from notes/02-tibia-lineage.md Q1.
// Shared math and chart helpers are exported as globalThis.AS for demos2.js
// (files load in name order after core.js). Block-wrapped so names do not clash.
// ======================================================================
{
const YEL='#ffc870',BLU='#8ea8ff',GRN='#7fd6a0',PNK='#e07ab0',PUR='#c9a2ff',RED='#ff8f7a',ORG='#e08a3a',TEAL='#6dd4c3',MUTE='#9e94ad',TXT='#ece6f2';
const nf=v=>Math.round(v).toLocaleString('en-US');
const nf1=v=>(Math.round(v*10)/10).toLocaleString('en-US');
const fmtH=h=>h<1?Math.round(h*60)+' min':h<10?nf1(h)+' h':nf(h)+' h';
const fmtBig=v=>v>=1e9?nf1(v/1e9)+'B':v>=1e6?(v%1e6?nf1(v/1e6):v/1e6)+'M':v>=1e3?(v%1e3?nf1(v/1e3):v/1e3)+'k':String(v);

// ---------------------------------------------------------------- Asterion math (server/internal/game, main 8836106a)
// stats.go:15-25: exp(L) = (((L-6)L + 17)L - 12) / 6 x 100, integer division
const expForLevel=L=>{L=Math.max(1,Math.floor(L));return Math.max(0,Math.trunc((((L-6)*L+17)*L-12)/6)*100);};
const expStep=L=>expForLevel(L+1)-expForLevel(L);
const levelForExp=e=>{let L=1;while(L<255&&expForLevel(L+1)<=e)L++;return L;};
// skills.go:101-106: tries to leave skill s = base x mult^(s - 10); bases 50/30/100/20, mults 1.08/1.08/1.08/1.1
const skillTries=(s,base=50,mult=1.08)=>Math.trunc(base*Math.pow(mult,s-10));
const skillCum=(s,base=50,mult=1.08)=>{let c=0;for(let k=10;k<s;k++)c+=skillTries(k,base,mult);return c;};
// one try per swing, one swing per 2,000 ms (game.go:143): 1,800 swings an hour at full duty
const skillHours=(s,base=50,mult=1.08,duty=.5,sph=1800)=>skillCum(s,base,mult)/(sph*duty);
const skillAtHours=(h,base=50,mult=1.08,duty=.5,sph=1800)=>{const tries=h*sph*duty;let s=10,c=0;while(s<200){const t=skillTries(s,base,mult);if(c+t>tries)break;c+=t;s++;}return s+(c<tries?(tries-c)/skillTries(s,base,mult):0);};
// skills.go:119-121: the combat weight of a skill level
const skillRung=s=>10+(s-10)/2;
// skills.go:249-251: mana to go from ml to ml+1 = 1600 x 1.4^ml (b = 1.4 for everyone)
const manaForML=(ml,b=1.4)=>Math.trunc(1600*Math.pow(b,ml));
const manaCum=(ml,b=1.4)=>{let c=0;for(let k=0;k<ml;k++)c+=manaForML(k,b);return c;};
const mlAtMana=(m,b=1.4)=>{let ml=0,c=0;while(ml<45){const t=manaForML(ml,b);if(c+t>m)break;c+=t;ml++;}return ml+(c<m?(m-c)/manaForML(ml,b):0);};
// game.go:89,123: speed = 300 + 4 (L - 1); game.go:100: step = ceil(1000 x 150 / speed / 50) x 50 ms
const speedForLevel=(L,base=300,per=4)=>base+per*(Math.max(1,L)-1);
const stepMs=speed=>Math.ceil(1000*150/speed/50)*50;
const beatLevels=(base=300,per=4,bonus=0,maxL=255)=>{const out=[];let prev=null;for(let L=1;L<=maxL;L++){const ms=stepMs(speedForLevel(L,base,per)+bonus);if(ms!==prev){out.push({L,ms,speed:speedForLevel(L,base,per)+bonus});prev=ms;}}return out;};
// Harness band ladder: median safe exp/h per level, realistic kit (levels.txt, band.py), linear between the eight levels run
const LADDER=[[1,384],[5,2361],[8,5409],[15,19663],[25,37617],[50,210981],[80,410169],[120,660520]];
const expPerHour=L=>{if(L<=1)return LADDER[0][1];for(let i=0;i<LADDER.length-1;i++){const [a,x]=LADDER[i],[b,y]=LADDER[i+1];if(L>=a&&L<=b)return x+(y-x)*(L-a)/(b-a);}return LADDER[LADDER.length-1][1]*L/120;};
// hours.py: cumulative hours to reach L; overhead x3 turns the harness's stand-and-trade rate into a session
const HOURS_CACHE={};
const hoursToLevel=(L,overhead=3)=>{const key=overhead;if(!HOURS_CACHE[key]){const a=[0,0];let c=0;for(let l=1;l<=254;l++){c+=expStep(l)/(expPerHour(l)/overhead);a[l+1]=c;}HOURS_CACHE[key]=a;}return HOURS_CACHE[key][Math.min(255,Math.max(1,Math.floor(L)))];};
const levelAtHours=(h,overhead=3)=>{let L=1;while(L<255&&hoursToLevel(L+1,overhead)<=h)L++;const a=hoursToLevel(L,overhead),b=hoursToLevel(L+1,overhead);return L+(b>a?(h-a)/(b-a):0);};
// corpse.go:43,367: a death costs 10 % of exp; in minutes at an exp/h rate
const deathCostMin=(L,eph,loss=.1,top=false)=>loss*(top?expForLevel(L+1)-1:expForLevel(L))/eph*60;
// Tibia / RuneScape comparison laws (notes/02-tibia-lineage.md Q1; RuneScape wiki)
const tibiaExp=L=>expForLevel(L);                       // the same cubic, 50/3 (L^3 - 6L^2 + 17L - 12)
const tibiaSkillTries=(s,A=50,b=1.1)=>A*Math.pow(b,s-10);
const rsExp=L=>{let s=0;for(let l=1;l<L;l++)s+=Math.floor(l+300*Math.pow(2,l/7));return Math.floor(s/4);};
const CONST={deathLoss:.1,gearDrop:.1,corpseMin:30,creatureCorpseMin:8,attackMs:2000,foodManaPerHour:600,wandManaPerHour:5400,potionGold:60,potionMana:65,
  partyBonus:.2,partyRange:30,heartstoneMin:5,hpPerLevel:5,manaPerLevel:10,baseHp:145,baseMana:100,skillBase:{sword:50,distance:30,shielding:100,fishing:20},
  skillMult:{sword:1.08,distance:1.08,shielding:1.08,fishing:1.1},magicMult:1.4,baseSpeed:300,speedPerLevel:4,bootsSpeed:55,censoExp:72,censoGold:8,harnessExpPerHour:1500};
const WANDS=[{ml:10,name:'vara de la chispa',gold:1200,npc:'Maera'},{ml:15,name:'vara del ojo carmesí',gold:8000,npc:'Vero'},{ml:20,name:'vara del oráculo',gold:24000,npc:'Ubbo'}];
const BEATS=[10,20,34,51,76,114];
const WORLD_GATES=[{L:35,name:'Ingwen'},{L:100,name:'Gorothland'}];

// ---------------------------------------------------------------- chart helpers
// .chart text sets font-size in CSS, which beats the attribute, so font-size goes into an inline style
const tx=(p,x,y,t,a={})=>{const fs=a['font-size'];if(fs!=null){a={...a};delete a['font-size'];a.style='font-size:'+fs+'px'+(a.style?';'+a.style:'');}return svgText(p,x,y,t,a);};
// margins [top,right,bottom,left]; o.xlog / o.ylog for log axes
function frame(svg,W,H,p,x0,x1,y0,y1,o={}){svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML='';
  const fx=o.xlog?Math.log:v=>v,fy=o.ylog?Math.log:v=>v,l=p[3],r=W-p[1];
  const X=v=>l+(fx(v)-fx(x0))/(fx(x1)-fx(x0))*(r-l),Y=v=>H-p[2]-(fy(v)-fy(y0))/(fy(y1)-fy(y0))*(H-p[0]-p[2]);
  const inv=px=>{const t=(px-l)/(r-l);return o.xlog?Math.exp(Math.log(x0)+t*(Math.log(x1)-Math.log(x0))):x0+t*(x1-x0);};
  return {X,Y,inv,W,H,p,top:p[0],bot:H-p[2],l,r,x0,x1,y0,y1};}
function yTicks(svg,c,ts,fmt,fs=9){ts.forEach(t=>{svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(t),y2:c.Y(t),class:'gl'},svg);tx(svg,c.l-4,c.Y(t)+3,fmt?fmt(t):t,{'text-anchor':'end','font-size':fs});});}
function yTicksR(svg,c,ts,fmt,fs=9,col=MUTE){ts.forEach(t=>tx(svg,c.r+4,c.Y(t)+3,fmt?fmt(t):t,{'text-anchor':'start','font-size':fs,fill:col}));}
function xTicks(svg,c,ts,fmt,fs=9){ts.forEach(t=>{svgEl('line',{x1:c.X(t),x2:c.X(t),y1:c.top,y2:c.bot,class:'gl'},svg);tx(svg,c.X(t),c.bot+11,fmt?fmt(t):t,{'text-anchor':'middle','font-size':fs});});}
function ylab(svg,c,t,x=9,fs=9){const y=(c.top+c.bot)/2;tx(svg,x,y,t,{transform:`rotate(-90 ${x} ${y})`,'text-anchor':'middle','font-size':fs});}
function ylabR(svg,c,t,fs=9,col=MUTE){const x=c.W-6,y=(c.top+c.bot)/2;tx(svg,x,y,t,{transform:`rotate(90 ${x} ${y})`,'text-anchor':'middle','font-size':fs,fill:col});}
function xlab(svg,c,t,fs=9){tx(svg,(c.l+c.r)/2,c.H-3,t,{'text-anchor':'middle','font-size':fs});}
function vline(svg,c,x,a){return svgEl('line',{x1:x,x2:x,y1:c.top,y2:c.bot,...a},svg);}
function hline(svg,c,y,a){return svgEl('line',{x1:c.l,x2:c.r,y1:y,y2:y,...a},svg);}
function axis(svg,c){svgEl('line',{x1:c.l,x2:c.r,y1:c.bot,y2:c.bot,class:'ax'},svg);}
// legend row: items {c,t,dash,dot,box}
function keys(svg,x,y,items,fs=8.6){const cw=fs*.52;for(const it of items){
  if(it.box)svgEl('rect',{x,y:y-7,width:8,height:8,fill:it.c,'fill-opacity':.85},svg);
  else if(it.dot)svgEl('circle',{cx:x+4,cy:y-3,r:3,fill:it.c},svg);
  else svgEl('line',{x1:x,x2:x+12,y1:y-3,y2:y-3,stroke:it.c,'stroke-width':2,'stroke-dasharray':it.dash||''},svg);
  const o=it.box||it.dot?11:15;tx(svg,x+o,y,it.t,{'font-size':fs,fill:it.c});x+=o+it.t.length*cw+9;}return x;}
function keysV(svg,x,y,items,dy=11,fs=8.6){items.forEach((it,i)=>keys(svg,x,y+i*dy,[it],fs));}
function vbX(svg,e){const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return (e.clientX-r.left)/r.width*vb.width;}
function vbY(svg,e){const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return (e.clientY-r.top)/r.height*vb.height;}
function hover(svg,get,fn){const f=e=>{const c=get();if(!c)return;const x=vbX(svg,e);if(x<c.l-6||x>c.r+6)return;fn(c.inv(clamp(x,c.l,c.r)),e);};
  svg.addEventListener('pointermove',f);svg.addEventListener('pointerdown',f);}
// a line y=f(x) sampled over [a,b]; values outside [lo,hi] on a log axis are clipped by splitting the polyline
function curve(svg,c,f,a,b,attrs,n=150){let cur=[];const lo=c.y0,hi=c.y1,step=(b-a)/n;
  for(let i=0;i<=n;i++){const x=a+step*i,y=f(x);if(y==null||!(y>=Math.min(lo,hi)&&y<=Math.max(lo,hi))){if(cur.length>1)poly(svg,cur,attrs);cur=[];continue;}cur.push([c.X(x),c.Y(y)]);}
  if(cur.length>1)poly(svg,cur,attrs);}

globalThis.AS={expForLevel,expStep,levelForExp,skillTries,skillCum,skillHours,skillAtHours,skillRung,manaForML,manaCum,mlAtMana,speedForLevel,stepMs,beatLevels,
  LADDER,expPerHour,hoursToLevel,levelAtHours,deathCostMin,tibiaExp,tibiaSkillTries,rsExp,CONST,WANDS,BEATS,WORLD_GATES,
  tx,frame,yTicks,yTicksR,xTicks,ylab,ylabR,xlab,vline,hline,axis,keys,keysV,hover,vbX,vbY,curve,nf,nf1,fmtH,fmtBig,
  C:{YEL,BLU,GRN,PNK,PUR,RED,ORG,TEAL,MUTE,TXT}};

// ======================================================================
// hero: 240 hours of play; level, sword and magic level climb at three rates
// ======================================================================
reg('hero',root=>{const svg=$('svg',root);const HM=240,W=320,H=180;
  const c=frame(svg,W,H,[14,34,20,26],0,HM,0,120);
  const Y2=v=>c.Y(v*10);                                   // right axis: magic level 0..12
  yTicks(svg,c,[0,30,60,90,120],v=>v,8);xTicks(svg,c,[0,60,120,180,240],v=>v+' h',8);
  yTicksR(svg,{...c,Y:Y2},[0,5,10],v=>'ml '+v,8,PNK);
  ylab(svg,c,'level · sword skill',8,8);
  // world gates as faint bands on the hours axis
  for(const g of WORLD_GATES){const h=hoursToLevel(g.L);if(h<HM){vline(svg,c,c.X(h),{stroke:TXT,'stroke-opacity':.12,'stroke-dasharray':'2 3'});tx(svg,c.X(h)+2,c.bot-3,g.name+' L'+g.L,{'font-size':7,fill:MUTE});}}
  const clip=svgEl('clipPath',{id:'heroclip'},svgEl('defs',{},svg));const crect=svgEl('rect',{x:c.l-2,y:0,width:0,height:H},clip);
  const g=svgEl('g',{'clip-path':'url(#heroclip)'},svg);
  const N=480,lv=[],sw=[],ml=[];for(let i=0;i<=N;i++){const h=HM*i/N;lv.push(levelAtHours(h));sw.push(skillAtHours(h));ml.push(mlAtMana(h*CONST.foodManaPerHour));}
  poly(g,ml.map((v,i)=>[c.X(HM*i/N),Y2(v)]),{stroke:PNK,'stroke-width':1.6});
  poly(g,sw.map((v,i)=>[c.X(HM*i/N),c.Y(Math.min(120,v))]),{stroke:BLU,'stroke-width':1.6});
  poly(g,lv.map((v,i)=>[c.X(HM*i/N),c.Y(v)]),{stroke:YEL,'stroke-width':2.2});
  for(const L of BEATS){const h=hoursToLevel(L);if(h>HM)continue;const x=c.X(h),y=c.Y(L);svgEl('line',{x1:x,x2:x,y1:y-5,y2:y+5,stroke:YEL,'stroke-width':1.4},g);
    tx(g,x+3,y+(L<30?-3:9),`L${L} · ${stepMs(speedForLevel(L))} ms`,{'font-size':7,fill:YEL});}
  const wh=manaCum(10)/CONST.foodManaPerHour;if(wh<HM){const x=c.X(wh),y=Y2(10);svgEl('path',{d:`M${x} ${y-5}l4 5-4 5-4-5z`,fill:PNK},g);tx(g,x-5,y-7,'first wand · ml 10',{'font-size':7,fill:PNK,'text-anchor':'end'});}
  keys(svg,c.l+4,c.top+8,[{c:YEL,t:'level'},{c:BLU,t:'sword skill'},{c:PNK,t:'magic level (right)'}],7.5);
  // the walker: a 6x9 pixel figure on the level curve
  const wk=svgEl('g',{},svg);const px=(x,y,w,h,f)=>svgEl('rect',{x,y,width:w,height:h,fill:f},wk);
  px(-2,-9,4,3,'#f1d6b4');px(-2,-6,4,4,YEL);px(-3,-5,1,3,'#f1d6b4');px(2,-5,1,3,'#f1d6b4');const lA=px(-2,-2,1.6,3,'#5a4d6a'),lB=px(.4,-2,1.6,3,'#5a4d6a');
  let t=0,wait=0,round=0;
  function place(h){const i=Math.min(N,Math.round(h/HM*N));const L=lv[i],x=c.X(h),y=c.Y(L);wk.setAttribute('transform',`translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    const ph=Math.floor(h*6)%2;lA.setAttribute('height',ph?3:2);lB.setAttribute('height',ph?2:3);
    crect.setAttribute('width',Math.max(0,x-c.l+3));
    setHud(root,`hour ${Math.floor(h)} · level ${Math.floor(L)} · sword ${Math.floor(sw[i])} · magic ${Math.floor(ml[i])} · ${stepMs(speedForLevel(Math.floor(L)))} ms`);}
  place(0);
  return {tick(dt){if(!motion){place(HM);return;}
    if(t>=HM){wait+=dt;if(wait>2.5){t=0;wait=0;round++;}return;}
    t=Math.min(HM,t+dt*12);place(t);}};});

// ======================================================================
// expcurve: Asterion's cubic (= Tibia's) vs RuneScape vs OT-style exp stages
// ======================================================================
reg('expcurve',root=>{const svg=$('svg',root),k=ctl(root),ro=$('[data-ro]',root);let hov=35,c=null;
  const stage=(L,M)=>L<20?M:L<50?Math.max(1,M/4):L<100?Math.max(1,M/10):1;
  const staged=(L,sc,M)=>{let s=0;for(let l=1;l<L;l++)s+=expStep(l)*sc/stage(l,M);return s;};
  function draw(){const sc=k.v('sc')/100,M=k.v('st');k.out('sc',sc.toFixed(2)+'×');k.out('st',M<=1?'off':`${M}× to 20, ${nf1(M/4)}× to 50, ${nf1(M/10)}× to 100`);
    c=frame(svg,360,250,[18,10,28,40],1,150,100,1e9,{ylog:true});
    yTicks(svg,c,[100,1e3,1e4,1e5,1e6,1e7,1e8,1e9],fmtBig);xTicks(svg,c,[1,25,50,75,100,125,150]);axis(svg,c);
    for(const g of WORLD_GATES)vline(svg,c,c.X(g.L),{stroke:TXT,'stroke-opacity':.15,'stroke-dasharray':'2 3'});
    curve(svg,c,L=>rsExp(Math.round(L)),2,120,{stroke:GRN,'stroke-width':1.6,'stroke-dasharray':'4 3'},118);
    curve(svg,c,L=>tibiaExp(Math.round(L)),2,150,{stroke:BLU,'stroke-width':3,'stroke-opacity':.45},148);
    if(M>1)curve(svg,c,L=>staged(Math.round(L),sc,M),2,150,{stroke:PUR,'stroke-width':1.6,'stroke-dasharray':'2 3'},148);
    curve(svg,c,L=>expForLevel(Math.round(L))*sc,2,150,{stroke:YEL,'stroke-width':2},148);
    const x=c.X(hov);vline(svg,c,x,{stroke:TXT,'stroke-opacity':.35});svgEl('circle',{cx:x,cy:c.Y(Math.max(100,expForLevel(hov)*sc)),r:3,fill:YEL},svg);
    keysV(svg,c.l+6,c.top+10,[{c:YEL,t:'Asterion, exp(L) × EXP_SCALE'},{c:BLU,t:'Tibia 7.x, the same cubic at 1×'},{c:GRN,t:'RuneScape 1-120',dash:'4 3'}].concat(M>1?[{c:PUR,t:'Asterion with exp stages (exp earned at 1×)',dash:'2 3'}]:[]));
    ylab(svg,c,'total exp to reach the level (log)');xlab(svg,c,'level');show();}
  function show(){const sc=k.v('sc')/100,M=k.v('st'),L=hov,e=expForLevel(L)*sc,st=expStep(L)*sc;
    ro.innerHTML=`<b>Level ${L}</b> · Asterion ${nf(e)} exp, ${nf(st)} to the next (${nf(st/expStep(L)*100/sc)} band kills at ${nf(expStep(L)/100)} exp each) · Tibia ${nf(tibiaExp(L))} · RuneScape ${L<=120?nf(rsExp(L)):'past 120'}`+
      (M>1?` · with stages ${nf(staged(L,sc,M))} earned at 1×`:'')+`<br>Hours to level ${L} on the harness band ladder ×3 at EXP_SCALE ${sc.toFixed(2)}: <b>${fmtH(hoursToLevel(L)*sc)}</b>; at 1,500 exp/h: ${fmtH(e/1500)}.`;}
  hover(svg,()=>c,v=>{const L=clamp(Math.round(v),1,150);if(L!==hov){hov=L;draw();}});
  k.on('sc',draw);k.on('st',draw);draw();return {};});

// ======================================================================
// skilltries: tries per rung at 1.08 (now) vs Tibia's 1.1 and 1.2, with the D87 knee
// ======================================================================
reg('skilltries',root=>{const svg=$('svg',root),k=ctl(root),ro=$('[data-ro]',root);let hov=50,c=null;
  const knee=s=>s<40?50*Math.pow(1.25,s-10):50*Math.pow(1.25,30)*Math.pow(1.8,s-40);   // skills.go at D87 (2026-08-03 to 08-30)
  function draw(){const m=k.v('m')/100,duty=k.v('d')/100;k.out('m',m.toFixed(2));k.out('d',Math.round(duty*100)+' %');
    c=frame(svg,360,250,[18,10,28,40],10,120,10,1e7,{ylog:true});
    yTicks(svg,c,[10,100,1e3,1e4,1e5,1e6,1e7],fmtBig);xTicks(svg,c,[10,20,40,60,80,100,120]);axis(svg,c);
    for(const g of [40,50,70]){vline(svg,c,c.X(g),{stroke:TXT,'stroke-opacity':.15,'stroke-dasharray':'2 3'});tx(svg,c.X(g)+2,c.bot-4,'gate '+g,{'font-size':7.5,fill:MUTE});}
    curve(svg,c,knee,10,120,{stroke:MUTE,'stroke-width':1.3,'stroke-dasharray':'2 3'},110);
    curve(svg,c,s=>tibiaSkillTries(s,50,1.2),10,120,{stroke:PNK,'stroke-width':1.5,'stroke-dasharray':'4 3'},110);
    curve(svg,c,s=>tibiaSkillTries(s,50,1.1),10,120,{stroke:BLU,'stroke-width':1.5,'stroke-dasharray':'4 3'},110);
    if(Math.abs(m-1.08)>.001)curve(svg,c,s=>skillTries(s,50,m),10,120,{stroke:GRN,'stroke-width':2},110);
    curve(svg,c,s=>skillTries(s),10,120,{stroke:YEL,'stroke-width':2.2},110);
    const x=c.X(hov);vline(svg,c,x,{stroke:TXT,'stroke-opacity':.35});svgEl('circle',{cx:x,cy:c.Y(Math.min(1e7,skillTries(hov))),r:3,fill:YEL},svg);
    keysV(svg,c.r-160,c.bot-58,[{c:YEL,t:'Asterion now, 50 × 1.08^(s−10)'},{c:GRN,t:'your slope'},{c:BLU,t:'Tibia knight sword, 1.1',dash:'4 3'},{c:PNK,t:'Tibia paladin sword, 1.2',dash:'4 3'},{c:MUTE,t:'D87 knee, Aug 2026 (reverted)',dash:'2 3'}]);
    ylab(svg,c,'swings to leave the skill level (log)');xlab(svg,c,'sword skill');show();}
  function show(){const m=k.v('m')/100,duty=k.v('d')/100,sph=1800*duty,s=hov;
    const H=(S,mm)=>fmtH(skillCum(S,50,mm)/sph);
    ro.innerHTML=`<b>Sword ${s}</b> · rung weight ${skillRung(s)} · swings to ${s+1}: now ${nf(skillTries(s))}, yours ${nf(skillTries(s,50,m))}, Tibia knight ${nf(tibiaSkillTries(s,50,1.1))}, D87 knee ${nf(knee(s))}`+
      `<br>At ${nf(sph)} swings an hour (${Math.round(duty*100)} % of a session swinging): sword 50 in <b>${H(50,1.08)}</b> now, ${H(50,m)} yours, ${H(50,1.1)} Tibia knight · sword 70: ${H(70,1.08)} / ${H(70,m)} / ${H(70,1.1)} · sword 100: ${H(100,1.08)} / ${H(100,m)} / ${H(100,1.1)}.`;}
  hover(svg,()=>c,v=>{const s=clamp(Math.round(v),10,120);if(s!==hov){hov=s;draw();}});
  k.on('m',draw);k.on('d',draw);draw();return {};});

// ======================================================================
// magiclevel: mana per magic level at 1.4 vs Tibia's vocations, hours at a mana rate, wand gates
// ======================================================================
reg('magiclevel',root=>{const svg=$('svg',root),k=ctl(root),ro=$('[data-ro]',root);let hov=10,c=null;
  const rate=()=>k.v('r');
  function draw(){const r=rate();k.out('r',nf(r)+'/h');
    c=frame(svg,360,260,[18,50,28,40],0,25,1e3,1e10,{ylog:true});
    yTicks(svg,c,[1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e10],fmtBig);xTicks(svg,c,[0,5,10,15,20,25]);axis(svg,c);
    const fh=h=>h<8760?fmtH(h):nf1(h/8760)+' y';
    yTicksR(svg,c,[1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e10],v=>fh(v/r),8.5,TEAL);ylabR(svg,c,'time at '+fmtBig(r)+' mana/h',8.5,TEAL);
    WANDS.forEach((w,i)=>{const x=c.X(w.ml);vline(svg,c,x,{stroke:ORG,'stroke-opacity':.35,'stroke-dasharray':'2 3'});
      tx(svg,i?x-2:x+2,c.top+8+i*10,`ml ${w.ml} · ${w.name}, ${nf(w.gold)} g`,{'font-size':7.5,fill:ORG,'text-anchor':i?'end':'start'});});
    curve(svg,c,ml=>manaCum(Math.round(ml),3.0),1,25,{stroke:RED,'stroke-width':1.5,'stroke-dasharray':'4 3'},24);
    curve(svg,c,ml=>manaCum(Math.round(ml),4.0),1,25,{stroke:MUTE,'stroke-width':1.2,'stroke-dasharray':'2 3'},24);
    curve(svg,c,ml=>manaCum(Math.round(ml),1.1),1,25,{stroke:BLU,'stroke-width':1.5,'stroke-dasharray':'4 3'},24);
    curve(svg,c,ml=>manaCum(Math.round(ml)),1,25,{stroke:YEL,'stroke-width':2.2},24);
    const x=c.X(hov);vline(svg,c,x,{stroke:TXT,'stroke-opacity':.35});svgEl('circle',{cx:x,cy:c.Y(Math.max(1e3,manaCum(hov))),r:3,fill:YEL},svg);
    keysV(svg,c.r-118,c.top+46,[{c:YEL,t:'1.4 Asterion, paladin'},{c:BLU,t:'1.1 Tibia mage',dash:'4 3'},{c:RED,t:'3.0 Tibia knight',dash:'4 3'},{c:MUTE,t:'4.0 OT, rejected (D10)',dash:'2 3'}],11,7.5);
    ylab(svg,c,'mana spent to reach the magic level (log)');xlab(svg,c,'magic level');show();}
  function show(){const r=rate(),ml=hov,m=manaCum(ml);const gold=m/CONST.potionMana*CONST.potionGold;
    ro.innerHTML=`<b>Magic level ${ml}</b> · ${nf(m)} mana spent in total, ${nf(manaForML(ml))} more for ${ml+1} · <b>${fmtH(m/r)}</b> at ${nf(r)} mana/h · ${nf(gold)} gold if every point came from potions (60 gold per 55-75 mana)`+
      `<br>Tibia mage ${nf(manaCum(ml,1.1))} · paladin ${nf(manaCum(ml,1.4))} · knight ${nf(manaCum(ml,3.0))} · wands at ml 10 / 15 / 20: ${fmtH(manaCum(10)/r)} / ${fmtH(manaCum(15)/r)} / ${fmtH(manaCum(20)/r)} at this rate.`;}
  hover(svg,()=>c,v=>{const ml=clamp(Math.round(v),1,25);if(ml!==hov){hov=ml;draw();}});
  k.on('r',draw);k.btn('fed',()=>{k.el('r').value=600;draw();});k.btn('wand',()=>{k.el('r').value=5400;draw();});draw();return {};});

// ======================================================================
// walkbeat: ms per tile by level, quantised to the 50 ms beat; the beat levels; boots +55
// ======================================================================
reg('walkbeat',root=>{const svg=$('svg',root),k=ctl(root),ro=$('[data-ro]',root);let hov=20,c=null;
  function draw(){const base=k.v('b'),per=k.v('p'),boots=k.v('boots');k.out('b',base);k.out('p','+'+per+' a level');
    c=frame(svg,360,240,[18,10,28,40],1,150,150,560);
    yTicks(svg,c,[200,300,400,500],v=>v+' ms');xTicks(svg,c,[1,25,50,75,100,125,150]);axis(svg,c);
    const stepPts=(bonus)=>{const pts=[];let prev=null;for(let L=1;L<=150;L++){const ms=stepMs(speedForLevel(L,base,per)+bonus);if(ms!==prev){if(prev!=null)pts.push([c.X(L),c.Y(prev)]);pts.push([c.X(L),c.Y(ms)]);prev=ms;}}pts.push([c.X(150),c.Y(prev)]);return pts;};
    const gddPts=[];let gp=null;for(let L=1;L<=150;L++){const ms=stepMs(280+5*(L-1));if(ms!==gp){if(gp!=null)gddPts.push([c.X(L),c.Y(gp)]);gddPts.push([c.X(L),c.Y(ms)]);gp=ms;}}gddPts.push([c.X(150),c.Y(gp)]);
    poly(svg,gddPts,{stroke:MUTE,'stroke-width':1.2,'stroke-dasharray':'2 3'});
    curve(svg,c,L=>1000*150/speedForLevel(L,base,per),1,150,{stroke:YEL,'stroke-width':1,'stroke-opacity':.5},149);
    if(boots)poly(svg,stepPts(CONST.bootsSpeed),{stroke:GRN,'stroke-width':1.8});
    poly(svg,stepPts(0),{stroke:YEL,'stroke-width':2.2});
    const beats=beatLevels(base,per,0,150).slice(1);
    beats.forEach(b=>{const x=c.X(b.L);svgEl('line',{x1:x,x2:x,y1:c.Y(b.ms)-4,y2:c.Y(b.ms)+4+ (b.ms>400?0:0),stroke:YEL,'stroke-width':1.4},svg);tx(svg,x,c.Y(b.ms)+13,'L'+b.L,{'font-size':8,fill:YEL,'text-anchor':'middle'});});
    const x=c.X(hov);vline(svg,c,x,{stroke:TXT,'stroke-opacity':.35});svgEl('circle',{cx:x,cy:c.Y(stepMs(speedForLevel(hov,base,per))),r:3,fill:YEL},svg);
    keysV(svg,c.r-150,c.top+10,[{c:YEL,t:'step per tile, quantised to 50 ms'},{c:GRN,t:'with botas de siete leguas, +55'},{c:MUTE,t:'stale GDD table: 280 + 5 a level',dash:'2 3'}]);
    ylab(svg,c,'ms per tile');xlab(svg,c,'level');show(beats);}
  function show(beats){const base=k.v('b'),per=k.v('p'),L=hov,sp=speedForLevel(L,base,per),ms=stepMs(sp),msb=stepMs(sp+CONST.bootsSpeed);
    ro.innerHTML=`<b>Level ${L}</b> · speed ${sp} · ${ms} ms a tile, ${nf(60000/ms)} tiles a minute · with boots ${msb} ms (${nf(60000/msb)} a minute) · the 459-step walk to the black iron chain's step 7: ${nf1(459*ms/60000)} min`+
      `<br>Beat levels at base ${base}, +${per}: <b>${beats.map(b=>`${b.L} (${b.ms} ms)`).join(' · ')||'none below 150'}</b>. Now: 10, 20, 34, 51, 76, 114.`;}
  hover(svg,()=>c,v=>{const L=clamp(Math.round(v),1,150);if(L!==hov){hov=L;draw();}});
  k.on('b',draw);k.on('p',draw);k.on('boots',draw);draw();return {};});

// ======================================================================
// onboarding: the censo chain as a five-step funnel, with illustrative drop-offs
// ======================================================================
reg('onboarding',root=>{const svg=$('svg',root),k=ctl(root),ro=$('[data-ro]',root);let c=null,prog=0,wait=0,hov=-1;
  // censo_tortuga_coja.yaml: five steps, five verbs; each hand-in 72 exp + 8 gold; whole chain "within twenty steps of the temple, ten minutes"
  const STEPS=[{v:'andar',n:'Walk the town',min:2.5,note:'movement, the automap'},{v:'pelear',n:'Kill your first rat',min:2.5,note:'a rat is 15 HP, 1-3 damage, 8.8 s to kill'},
    {v:'comprar',n:'Buy from Tomás',min:1.5,note:'a torch, 10 gold',gold:-10},{v:'guardar',n:'Find the chests',min:1.5,note:'storage at the temple'},{v:'preguntar',n:'Ask Sila for a heartstone',min:2,note:'free recall, 5 min cooldown'}];
  function draw(){const d=k.v('d')/100;k.out('d',Math.round(d*100)+' %');
    c=frame(svg,360,230,[14,10,24,10],0,1,0,1);const rows=STEPS.length,rh=(c.bot-c.top)/rows,W=c.r-c.l;
    let alive=100,exp=0,gold=0,t=0;
    STEPS.forEach((s,i)=>{const y=c.top+i*rh;const start=alive;alive=alive*(1-d);exp+=CONST.censoExp;gold+=CONST.censoGold+(s.gold||0);t+=s.min;
      const vis=clamp(prog-i,0,1);
      if(i===hov)svgEl('rect',{x:c.l,y:y+1,width:W,height:rh-2,fill:'#fff','fill-opacity':.04,rx:3},svg);
      svgEl('rect',{x:c.l+6,y:y+rh-11,width:(W-12)*start/100*vis||0,height:6,fill:ORG,'fill-opacity':.35,rx:1},svg);
      svgEl('rect',{x:c.l+6,y:y+rh-11,width:(W-12)*alive/100*vis||0,height:6,fill:YEL,'fill-opacity':.9,rx:1},svg);
      tx(svg,c.l+6,y+12,`${i+1}. ${s.n}`,{'font-size':9.5,fill:TXT,style:'font-weight:600'});
      tx(svg,c.l+6,y+22,`${s.v} · ${s.note}`,{'font-size':8,fill:MUTE});
      tx(svg,c.r-6,y+12,`${nf(exp)} exp · level ${levelForExp(exp)} · ${gold} gold`,{'font-size':8.5,fill:YEL,'text-anchor':'end'});
      tx(svg,c.r-6,y+22,`minute ${nf1(t)} · ${nf(alive)} of 100 go on`,{'font-size':8,fill:MUTE,'text-anchor':'end'});
      svgEl('rect',{x:c.l,y,width:W,height:rh,fill:'transparent','data-i':i},svg);});
    tx(svg,c.l+6,c.bot+14,'yellow bar: share of 100 new characters who finish the step (drop-off illustrative); faded: who started it · each hand-in 72 exp + 8 gold',{'font-size':7.5,fill:MUTE});
    show();}
  function show(){const d=k.v('d')/100,done=Math.pow(1-d,5)*100;
    ro.innerHTML=`Five hand-ins pay <b>360 exp and 40 gold</b> (level 3, 40 exp short of 400 for level 4), minus 10 gold for the torch. About ten minutes inside twenty tiles of the temple. At ${Math.round(d*100)} % drop per step, <b>${nf(done)} of 100</b> finish and get the Vecino title. Telemetry's <code>quest_step</code> would measure the real figure (§13); today nothing does. Tibia's 2009 census for comparison: 26 % of characters never left Rookgaard (level 8) [V, E1].`;}
  svg.addEventListener('pointermove',e=>{const t=e.target.closest('[data-i]');const i=t?+t.dataset.i:-1;if(i!==hov){hov=i;draw();}});
  k.on('d',()=>{draw();});draw();
  return {tick(dt){if(!motion){if(prog<5){prog=5;draw();}return;}
    if(prog>=5){wait+=dt;if(wait>3){prog=0;wait=0;}return;}prog=Math.min(5,prog+dt*1.1);draw();}};});

// ======================================================================
// experiments: natural experiments (note 05) and Asterion's own decisions (note 01 Q6) as a strip
// ======================================================================
const SYS={death:{c:RED,t:'death penalty'},skill:{c:BLU,t:'skill by use'},curve:{c:YEL,t:'long-curve pacing'},onboarding:{c:GRN,t:'onboarding'},session:{c:PUR,t:'session and rest'}};
// n, game, year (x), system, when, change, reaction, grade, lesson. Rows of notes/05-natural-experiments.md "The table".
const EXPS=[
 [1,'Tibia',2008.9,'death','8.4x, winter 2008/09','Exp loss on death stops being a flat 10 % above level 23 and shrinks with level (3.8 % at 200)','Still live 17 years later; blessings became mandatory purchases','E3','Scale the penalty to the time it costs, not to the number'],
 [2,'Tibia',2006.5,'death','Blessings, c. 2006/07; 2,000 gp to 200 × (L−20)','Pay gold before death to cut exp and skill loss 8 % each and item loss to 0 % with five','The default state of any character above about 50','E3','Let players prepay the penalty; it turns dread into a gold sink'],
 [3,'Tibia',2010.9,'death','8.62, Dec 2010','Twist of Fate: a sixth blessing that protects the other five on PvP death only','Treated as a PvP tax','E3','Separate the PvE penalty from the PvP penalty'],
 [4,'Tibia',2014.7,'death','10.55, Sep 2014','Adventurer\'s Blessing: no PvP death cost until level 21 on Open PvP worlds','Shipped with Dawnport, still in place','E3','A free grace period for the first hours costs nothing in retention'],
 [5,'Ultima Online',2000.3,'death','Renaissance, May 2000','Trammel facet: a PvE copy of the world beside Felucca','Subscribers 150k (Feb 2000) to 250k (Oct 2000); Felucca a "ghost town" per veterans','E1/E3','Taking the open-PvP cost out of the default world grew the game and split the community'],
 [6,'Ultima Online',2003.1,'death','Age of Shadows, Feb 2003','Item insurance: 750 then 600 gp per item to keep it through death; Siege excluded','Peak of about 250k accounts after AoS; Siege players refused the feature','E1/E3','Insurance only works if the penalty was real before it; keep one world without it'],
 [7,'Ultima Online',2002.5,'skill','Publish 16, Jul 2002','Guaranteed Gain System: a timer guarantees a skill tick for working near your level, replacing "power hour"','Power hour faded; GGS still in the game','E2','A guaranteed trickle beats a daily burst for casual players'],
 [8,'RuneScape',2007.8,'death','Oct and Dec 2007','One minute of hidden drops, then gravestones of 3 to 15 min','Gravestones outlived every later rework','E3','A short private window removes the humiliation of being looted by a bystander'],
 [9,'RuneScape 3',2015.4,'death','May 2015 "Death Rework"','Death\'s Office holds items 24 h; reclaim fee 15 % of value down to 0.5 % for 10M+ items','Fees cut to 0.1 % in Jan 2023; sacrifice option removed','E3','A fee that is a percentage of wealth is the only penalty that scales with the economy'],
 [10,'Old School RuneScape',2014.2,'death','2013 to 2015','Ground timer stretched: 3 min invisible (2013), 30 min (Oct 2014), 60 min (May 2015)','Jagex later called these changes "unpolled" and "temporary"','E2','Each softening becomes the new baseline'],
 [11,'Old School RuneScape',2020.5,'death','Jun 2020','Gravestone 15 min; fee 1k gp on a 100k item to 100k on a 10M item; Death\'s Office 5 % above 100k','Survey "mixed"; many supportive of a small increase in risk; hotfixes within 2 days','E2','Players will vote for more risk if the risk is capped and legible'],
 [12,'EverQuest',2002.7,'curve','Sep 2002 patch','Levels 50 to 60 smoothed so 51, 54 and 59 stop being hell levels; same total exp','Hell levels remembered fondly by a minority, hated by most','E2','A plateau that costs the same total exp but shows no progress feels worse than a uniform grind'],
 [13,'EverQuest',2005.9,'curve','Dec 2005','Monster Mission exp uses hell-level modifiers to smooth the curve at 30, 35, 40, 45','Effectively ended hell levels; the base modifiers never changed','E2','You can remove a plateau with a multiplier instead of a new curve'],
 [14,'Final Fantasy XI',2005.3,'death','Apr 2005','From level 25, death costs 8 % of exp to next level, capped at 2,400 exp','Raise II returns 75 %, Raise III 90 %; no loss at or below 30','E2','Cap the loss in absolute exp so the cost in minutes stops growing'],
 [15,'Black Desert',2016.4,'death','Jun 2016','Players with karma at or above 0 no longer lose exp when killed in PvP','Many called it a "Gamebreaker" for PvP','E3','Removing a penalty is also a change to the PvP meta'],
 [16,'Path of Exile',2013.1,'death','since 2013, kept','Exp loss on death 5 % in late acts, 10 % in maps; never removed','Yearly forum campaigns; GGG keeps it','E3','A penalty that only bites at the endgame is tolerable because the early curve is free'],
 [17,'Path of Exile 2',2024.9,'death','Early Access, Dec 2024','10 % exp loss from level 71 to 100, plus one map portal','Dozens of top forum threads; devs: loss "isn\'t punishment"','E2/E3','Stacking two penalties on one death multiplies the complaints'],
 [18,'Valheim',2021.1,'death','Feb 2021 (EA launch)','5 % of every skill lost on death; "No Skill Drain" buff for about 10 min after respawn','Buff present by 12 Feb 2021; a death-penalty world modifier (1 % to 100 %) added later','E3','Make the second death free: the corpse run itself is the punishment'],
 [19,'Dark Souls to Elden Ring',2022.1,'death','2011 to 2022','Souls dropped on death, recoverable once; Elden Ring drops hollowing costs and adds Stakes of Marika','Elden Ring sold 25M+ and is called the accessible Souls','E3','Recoverable currency plus a nearer respawn is the modern floor'],
 [20,'Diablo II',2000.5,'death','2000; LoD 2001','Exp loss on Nightmare 5 % and Hell 10 % of current level, 75 % recoverable at the corpse','Unchanged through Resurrected (2021)','E3','"Recover most of it at the corpse" is the oldest corpse-run mercy'],
 [21,'World of Warcraft',2004.9,'death','Nov 2004','Resurrection sickness (10 min, −75 % stats) only if you skip the corpse run; 10 % durability loss','Death became a time cost, not a progress cost; the genre followed','E3','A time penalty with a visible alternative is accepted where a progress penalty is not'],
 [22,'World of Warcraft',2004.3,'session','2004 beta to launch','Beta "fatigue" cut exp 50 % after hours of play; launch inverted it into rested exp +200 %','Beta revolt (Apr 2004); rested exp became standard','E2/E3','The same curve framed as a bonus is loved and framed as a penalty is hated'],
 [23,'World of Warcraft',2020.8,'curve','Shadowlands, Oct 2020','Level squish 120 to 50; new accounts 10 to 50 in one expansion; 50 to 70 % faster','Alpha speed-leveller reached 50 in under 7 h; backlash over "levels mean nothing"','E3','Compressing the curve helps newcomers and devalues veterans\' numbers at once'],
 [24,'Tibia',2011.5,'skill','Summer 2011 (9.x)','Offline training: up to 12 h banked, regenerated 1 s per 1 s online; beds in 2012','Premium feature kept; OT servers reimplemented it within months','E3','Offline progress is the honest version of rested exp for a skill-by-use game'],
 [25,'Tibia',2018.3,'skill','Apr 2018','Exercise weapons: 500 charges, 16 min 40 s, 7.2 hits per charge, 25 TC or 347,222 gp','Durable and Lasting tiers added Winter 2020','E3','Selling the grind as an item converts time into a cash shop line'],
 [26,'Tibia',2014.7,'onboarding','10.55, Sep 2014','Dawnport replaces Rookgaard; leave at 8, forced out at 20; try each vocation on a pedestal','Rookgaard kept for old accounts; Dawnport later replaced by Newhaven','E3','The tutorial island needs an exit level and a free class trial'],
 [27,'RuneScape',2008.5,'onboarding','2002 to 2018','Tutorial Island added Sep 2002; replaced Jul 2008 and reverted in 2 months; replaced 2009, 2013; reinstated May 2018','Jagex swapped tutorials five times and ended up back on the island','E2','A tutorial you can explain in one sentence beats a cinematic one'],
 [28,'Open Tibia servers',2007.2,'curve','2007 onward','Exp stages: a per-level-band multiplier (for example 50× to level 20, 5× by 100)','Standard on nearly every OT; low-rate "7.4" servers advertise 1× as a feature','E3','The multiplier table is the cheapest pacing knob a server has'],
 [29,'Path of Exile',2013.6,'session','since 2013','3-month leagues: a fresh economy and character, a finite curve inside an endless game','Steam concurrent peaks every league start, trough by month 3','E3','A long curve needs a scheduled restart or players make their own']];
// Asterion's own dated changes (notes/01-current-build.md Q6): id, x = day of 2026 as a fraction of Jul 1 .. Sep 15, system, when, change, why, before and after
const ASX=[
 ['D9',13,'death','2026-07-13','Death = flat 10 % exp + corpse + temple respawn; skills and mana spared','Calibrated to "about one session" rather than a percent','Test points: 10 min at level 4, 52 min at level 8 at 480 exp/h'],
 ['D10',13.3,'curve','2026-07-13','Magic multiplier 1.4, not OT\'s vocation-less 4.0','"the pillar is slow, not impossible" in 45-minute sessions','Magic 5 at 4.0 would need 546,000 mana; at 1.4 it is 17,511'],
 ['D30',26,'death','2026-07-26','Temple heals free; HP regen 6 s to 3 s per HP','First group playtest: early levels punish one bad fight for a long time','One meat 30 HP to 60 HP; mana regen left at 6 s'],
 ['F-003',28,'skill','2026-07-28','Skill mults 2.0/2.0/1.5 to 1.8/1.8/1.6; the harness -skills was written for it','Sword 10 to 25 cost 910 h; shielding outran sword 4.5 : 1','Sword 10 to 20: 28.4 h to about 12 h'],
 ['D38',28.3,'death','2026-07-28','Own corpse 4 + 4 min to 15 + 15 min','Step 7 of the black iron chain is 459 steps out; eight minutes deleted a distant bag','8 to 30 min corpse window'],
 ['F-095',29,'curve','2026-07-29','Speed per level +3 to +5','"se siente, pero podría ser un poquito más notorio": the beat boundaries make a level felt','Boundaries under 20: two to three'],
 ['D44',29.3,'death','2026-07-29','Heartstone: free recall, 30 min cooldown, out of combat only, destroyed by death','"a shortcut home, not an escape"; keeps the corpse run','Wishlist asked for 1 per 4 h'],
 ['D57',30,'curve','2026-07-30','Mana pool 50 + 5L to 100 + 10L; three spell clocks','One global exhaust could not shape a fight with 30 spells','Level-10 mana 100 to 200'],
 ['D69',31,'curve','2026-07-31','Creature exp derived from max_farm_level: 100 kills per level','36 hand-chosen exp numbers were incomparable','Rat 8 exp to 2 exp; the hour per level became flat'],
 ['D85',34,'curve','2026-08-03','Potion exhaust none to 4 s to 2 s, one clock for all bottles','Playtest: a hundred potions were "a second health bar"','A 30 s fight holds 7 sips at 4 s, 15 at 2 s'],
 ['D87',34.3,'skill','2026-08-03','Skill knee at 40: ×1.25 below, F-003 slopes above','Playtest: "a partir de nivel 18 no vale la pena subir skill"','Espada 18: 7.6 h to 66 min; but 45 to 46 became 763,000 swings'],
 ['D113',43,'death','2026-08-12','Heartstone cooldown 30 to 5 min','The out-of-combat gate protects the rule, not the length; thirty minutes bought dead time','30 to 5 min'],
 ['D137/8',52,'curve','2026-08-21','Tick 100 to 50 ms; base speed 280 to 300, per level +5 to +4','A stutter after every tile; diagonals slower than straight','Level 1: 600 ms real to 500 ms; beats 5/12/20/31/45 to 10/20/34/51'],
 ['D147',60,'curve','2026-08-29','Gorothland reached from Ingwen, not Akron','"geography is the level ladder": 1-35, 35-100, 100+','Boat Akron to Ingwen, Ingwen to Gorothland'],
 ['D149',61,'skill','2026-08-30','One slope 1.08, no knee; skillRung halves a rung\'s weight; gates 25/30/40 to 40/50/70','Nobody priced past the knee: 45 to 46 was 424 h in the air','Espada 40: 179 h to 6.3 h; 50: 14.4 h; 100: 707 h']];
reg('experiments',root=>{const svg=$('svg',root),k=ctl(root),ro=$('[data-ro]',root);let set='twins',sys='all',sel=0,idle=0,c=null,dots=[];
  const lanes=Object.keys(SYS);
  function data(){return set==='twins'?EXPS.map(r=>({id:'#'+r[0],g:r[1],x:r[2],s:r[3],when:r[4],ch:r[5],re:r[6],gr:r[7],les:r[8]})):
    ASX.map(r=>({id:r[0],g:'Asterion',x:r[1],s:r[2],when:r[3],ch:r[4],re:r[5],gr:'E2',les:r[6]}));}
  function draw(){const D=data().filter(d=>sys==='all'||d.s===sys);dots=D;if(sel>=D.length)sel=0;
    const tw=set==='twins';c=frame(svg,360,200,[12,10,26,78],tw?1999:0,tw?2026:78,0,lanes.length);
    const xt=tw?[2000,2005,2010,2015,2020,2025]:[0,15,31,46,62,76];
    xTicks(svg,c,xt,v=>tw?v:['Jul 1','Jul 16','Aug 1','Aug 16','Sep 1','Sep 15'][xt.indexOf(v)]);axis(svg,c);
    lanes.forEach((s,i)=>{const y=c.Y(i+.5);hline(svg,c,y,{stroke:'#201a27','stroke-dasharray':'2 3'});tx(svg,c.l-6,y+3,SYS[s].t,{'text-anchor':'end','font-size':8.5,fill:SYS[s].c});});
    // spread dots that share a lane and a year
    const taken=[];D.forEach((d,i)=>{const li=lanes.indexOf(d.s);let dy=0;const x=c.X(d.x);while(taken.some(([tx_,ty])=>Math.abs(tx_-x)<8&&ty===li*10+dy))dy++;taken.push([x,li*10+dy]);
      const y=c.Y(li+.5)-dy*8+(dy?4:0);const on=i===sel;
      const g=svgEl('g',{class:'dot'+(on?' on':''),'data-i':i,style:'cursor:pointer'},svg);
      if(tw)svgEl('circle',{cx:x,cy:y,r:on?5:3.6,fill:SYS[d.s].c,'fill-opacity':on?1:.75,stroke:on?TXT:'none','stroke-width':1.5},g);
      else svgEl('rect',{x:x-3.5,y:y-3.5,width:on?9:7,height:on?9:7,fill:SYS[d.s].c,'fill-opacity':on?1:.75,stroke:on?TXT:'none','stroke-width':1.5},g);
      if(on)tx(svg,x,y-8,d.id+' '+d.g,{'text-anchor':'middle','font-size':8,fill:TXT});});
    tx(svg,c.r,c.bot+22,tw?'one dot per row of the §9 table; click to read':'Asterion\'s decisions log, Jul to Sep 2026 (note 01, Q6); click to read',{'text-anchor':'end','font-size':7.5,fill:MUTE});
    show();}
  function show(){const d=dots[sel];if(!d){ro.innerHTML='No rows for this filter.';return;}
    ro.innerHTML=`<b>${d.id} ${d.g}</b> · ${d.when} · <span style="color:${SYS[d.s].c}">${SYS[d.s].t}</span> · ${d.gr}<br>${d.ch}.<br><span class="mute">Reaction:</span> ${d.re}.<br><span class="mute">Lesson:</span> <b>${d.les}</b>`;}
  svg.addEventListener('click',e=>{const t=e.target.closest('[data-i]');if(t){sel=+t.dataset.i;idle=-20;draw();}});
  k.seg('set',v=>{set=v;sel=0;idle=0;draw();});k.seg('sys',v=>{sys=v;sel=0;idle=0;draw();});draw();
  return {tick(dt){if(!motion||!dots.length)return;idle+=dt;if(idle>3.2){idle=0;sel=(sel+1)%dots.length;draw();}}};});
}
