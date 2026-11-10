// ======================================================================
// MatchRPG curve figures, part 1: survival, hazard, stairs, scroll, deaths,
// learning, pace, tiers, xpwall, endless, sessions, tetris, weights, abtest.
// Telemetry numbers come from notes/telemetry-aggregates.json (859 runs,
// 21 players, aggregates only, cells under 3 players are null). Constants and
// model tables come from notes/01-current-build.md; twin numbers from notes
// 03, 08 and 09. Wrapped in a block so names do not clash with other demos.
// ======================================================================
{
const CW=['#7fd6a0','#8ea8ff','#ffc870','#e07ab0','#c9a2ff'];
const RED='#ff8f7a',TXT='#ece6f2',MUTE='#9e94ad',YEL='#ffc870',BLU='#8ea8ff',GRN='#7fd6a0',PNK='#e07ab0',PUR='#c9a2ff',ORG='#e08a3a';
const TIERC={bronze:ORG,silver:'#b9b0c8',gold:YEL,diamond:BLU};
const TIERS=[['bronze',.65],['silver',.85],['gold',1.1],['diamond',1.25]];
const BOSSN=['Old Mossback','The Warden','The Deep Wyrm','The Sleeper Below','Astaroth'];
const ELN=[['Ogre King','Broodmother'],['Lich','Orc Warlord'],['Crystal Golem','Myconid Matriarch'],['The Hierophant','Shoggoth'],['Amdusias','Belial']];
const encName=n=>{const w=(n-1)/36|0,p=(n-1)%36+1;return `W${w+1} e${p}`+(p===36?' · '+BOSSN[w]:p===12?' · '+ELN[w][0]:p===24?' · '+ELN[w][1]:'');};
const nf=v=>Math.round(v).toLocaleString('en-US');
const pc=v=>v==null?'n/a':(Math.round(v*10)/10)+'%';
const cap=s=>s[0].toUpperCase()+s.slice(1);

// chart frame: margins [top,right,bottom,left]; o.xlog / o.ylog for log axes
function frame(svg,W,H,p,x0,x1,y0,y1,o={}){svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML='';
  const fx=o.xlog?Math.log:v=>v,fy=o.ylog?Math.log:v=>v,l=p[3],r=W-p[1];
  const X=v=>l+(fx(v)-fx(x0))/(fx(x1)-fx(x0))*(r-l),Y=v=>H-p[2]-(fy(v)-fy(y0))/(fy(y1)-fy(y0))*(H-p[0]-p[2]);
  const inv=px=>{const t=(px-l)/(r-l);return o.xlog?Math.exp(Math.log(x0)+t*(Math.log(x1)-Math.log(x0))):x0+t*(x1-x0);};
  return {X,Y,inv,W,H,p,top:p[0],bot:H-p[2],l,r};}
function yTicks(svg,c,ts,fmt,x){ts.forEach(t=>{svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(t),y2:c.Y(t),class:'gl'},svg);svgText(svg,(x==null?c.l:x)-4,c.Y(t)+3.5,fmt?fmt(t):t,{'text-anchor':'end','font-size':10});});}
function xTicks(svg,c,ts,fmt,y){ts.forEach(t=>{svgEl('line',{x1:c.X(t),x2:c.X(t),y1:c.top,y2:c.bot,class:'gl'},svg);svgText(svg,c.X(t),(y||c.bot)+12,fmt?fmt(t):t,{'text-anchor':'middle','font-size':10});});}
function ylab(svg,c,t,x=9){const y=(c.top+c.bot)/2;svgText(svg,x,y,t,{transform:`rotate(-90 ${x} ${y})`,'text-anchor':'middle','font-size':10});}
function xlab(svg,c,t,y){svgText(svg,(c.l+c.r)/2,y||c.H-3,t,{'text-anchor':'middle','font-size':10});}
function vline(svg,c,x,a){return svgEl('line',{x1:x,x2:x,y1:c.top,y2:c.bot,...a},svg);}
function hline(svg,c,y,a){return svgEl('line',{x1:c.l,x2:c.r,y1:y,y2:y,...a},svg);}
function axis(svg,c){svgEl('line',{x1:c.l,x2:c.r,y1:c.bot,y2:c.bot,class:'ax'},svg);}
// legend row: items {c,t,dash,dot,box}
function keys(svg,x,y,items){for(const it of items){
  if(it.box)svgEl('rect',{x,y:y-7,width:9,height:9,fill:it.c,'fill-opacity':it.op||.85},svg);
  else if(it.dot)svgEl('circle',{cx:x+5,cy:y-2.5,r:3,fill:it.c},svg);
  else svgEl('line',{x1:x,x2:x+12,y1:y-3,y2:y-3,stroke:it.c,'stroke-width':2,'stroke-dasharray':it.dash||''},svg);
  svgText(svg,x+(it.box||it.dot?13:16),y,it.t,{'font-size':9.5,fill:it.c});x+=(it.box||it.dot?13:16)+it.t.length*5.6+10;}}
function keysV(svg,x,y,items,dy=12){items.forEach((it,i)=>keys(svg,x,y+i*dy,[it]));}
function vbX(svg,e){const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return (e.clientX-r.left)/r.width*vb.width;}
function vbY(svg,e){const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return (e.clientY-r.top)/r.height*vb.height;}
function hover(svg,get,fn){const f=e=>{const c=get();if(!c)return;const x=vbX(svg,e);if(x<c.l-6||x>c.r+6)return;fn(c.inv(clamp(x,c.l,c.r)),e);};
  svg.addEventListener('pointermove',f);svg.addEventListener('pointerdown',f);}
function stepPts(c,arr,lo,yf){const pts=[];arr.forEach((v,i)=>{const n=i+lo,y=yf(v);pts.push([c.X(n-.5),y],[c.X(n+.5),y]);});return pts;}
function plen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
function worldBands(svg,c,lab=true){for(let k=0;k<5;k++){const a=c.X(k*36+.5),b=c.X(k*36+36.5);
  if(k%2)svgEl('rect',{x:a,y:c.top,width:b-a,height:c.bot-c.top,fill:'#fff','fill-opacity':.035},svg);
  if(lab)svgText(svg,(a+b)/2,c.bot+13,'W'+(k+1),{'text-anchor':'middle','font-size':10,fill:CW[k]});}}
function slotMarks(svg,c){for(let k=0;k<5;k++)for(const p of [12,24,36]){const n=k*36+p,x=c.X(n);
  vline(svg,c,x,{stroke:p===36?RED:BLU,'stroke-opacity':.3,'stroke-dasharray':'2 3'});
  if(p===36)svgEl('path',{d:`M${x} ${c.top-11}l4 5-4 5-4-5z`,fill:RED},svg);else svgEl('path',{d:`M${x-3.5} ${c.top-9}h7l-3.5 6z`,fill:BLU},svg);}}

// ======================================================================
// telemetry tables (aggregates, see notes/telemetry-aggregates.json)
// ======================================================================
// q1_funnel.every_encounter: reach % of 651 story runs, attempts, loss % per encounter 1-180
const REACH=[100,99.7,99.7,99.4,99.4,98.9,98.8,98.6,98.5,98.3,98.2,98.2,85.9,85.3,84.9,84.9,84.9,84.8,84.3,84.2,84,83.9,83.7,83.7,72,71.9,71.4,71.3,71.1,70.8,70.5,70.5,70.2,70,69.6,69.3,43.9,43.9,43.6,43.6,43.5,43.3,43.3,43,43,42.9,42.9,42.9,37.3,37.3,37.2,37,36.7,36.4,36.3,35.8,35.6,35.5,34.9,34.7,27.5,27.5,27.3,27.3,27.2,27.2,27,26.9,26.9,26.9,26.9,26.9,18.9,18.9,18.9,18.9,18.6,18.4,18.4,18.4,18,17.8,17.8,17.5,14.4,14.4,14.3,14.1,14.1,14,13.7,13.5,13.4,13.4,13.2,13.1,10.3,10.1,10,10,9.8,9.7,9.5,9.5,9.2,9.2,9.2,9.2,5.4,5.4,5.2,5.2,5.2,5.1,4.9,4.9,4.9,4.9,4.9,4.9,3.8,3.7,3.7,3.7,3.5,3.5,3.5,3.5,3.5,3.4,3.4,3.4,2.9,2.9,2.9,2.9,2.9,2.9,2.9,2.9,2.9,2.9,2.9,2.9,1.7,1.7,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5];
const ATT=[651,649,649,647,647,644,643,642,641,640,639,639,559,555,553,553,553,552,549,548,547,546,545,545,469,468,465,464,463,461,459,459,457,456,453,451,286,286,284,284,283,282,282,280,280,279,279,279,243,243,242,241,239,237,236,233,232,231,227,226,179,179,178,178,177,177,176,175,175,175,175,175,123,123,123,123,121,120,120,120,117,116,116,114,94,94,93,92,92,91,89,88,87,87,86,85,67,66,65,65,64,63,62,62,60,60,60,60,35,35,34,34,34,33,32,32,32,32,32,32,25,24,24,24,23,23,23,23,23,22,22,22,19,19,19,19,19,19,19,19,19,19,19,19,11,11,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10];
const LOSS=[0.31,0,0.31,0,0.46,0.16,0.16,0.16,0.16,0.16,0,12.52,0.72,0.36,0,0,0.18,0.54,0.18,0.18,0.18,0.18,0,13.94,0.21,0.64,0.22,0.22,0.43,0.43,0,0.44,0.22,0.66,0.44,36.59,0,0.7,0,0.35,0.35,0,0.71,0,0.36,0,0,12.9,0,0.41,0.41,0.83,0.84,0.42,1.27,0.43,0.43,1.73,0.44,20.8,0,0.56,0,0.56,0,0.56,0.57,0,0,0,0,29.71,0,0,0,1.63,0.83,0,0,2.5,0.85,0,1.72,17.54,0,1.06,1.08,0,1.09,2.2,1.12,1.14,0,1.15,1.16,21.18,1.49,1.52,0,1.54,1.56,1.59,0,3.23,0,0,0,41.67,0,2.86,0,0,2.94,3.03,0,0,0,0,0,21.88,4,0,0,4.17,0,0,0,0,4.35,0,0,13.64,0,0,0,0,0,0,0,0,0,0,0,42.11,0,9.09,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40];
// q1_funnel.key_stages: encounter, reach % run-weighted, reach % player-weighted, players
const KS=[[1,100,100,18],[12,98.2,90.8,17],[24,83.7,57,15],[36,69.3,42.2,11],[37,43.9,28.4,10],[48,42.9,27.7,10],[60,34.7,22.8,10],[72,26.9,17.6,10],[73,18.9,13.1,10],[84,17.5,12.2,10],[96,13.1,9.5,10],[108,9.2,6.5,10],[109,5.4,4,10],[120,4.9,3.7,10],[132,3.4,2.7,8],[144,2.9,2.3,7],[145,1.7,1.5,7],[156,1.5,1.3,6],[168,1.5,1.3,6],[180,1.5,1.3,6]];

// ======================================================================
// survival: share of story runs still alive at each encounter
// ======================================================================
reg('survival',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let wt='run',hov=36,c=null,ln=null,len=0,t=0,done=!motion;
  function draw(){const lg=c0.v('log');c=frame(svg,360,236,[18,10,30,46],.5,180.5,lg?1:0,100,{ylog:lg});
    worldBands(svg,c);yTicks(svg,c,lg?[1,2,5,10,20,50,100]:[0,25,50,75,100],v=>v+'%');slotMarks(svg,c);
    const yf=v=>c.Y(Math.max(v,lg?1:0));
    const rp=stepPts(c,REACH,1,yf),kp=KS.map(r=>[c.X(r[0]),yf(r[2])]);
    const run=wt==='run';
    poly(svg,kp,{stroke:GRN,'stroke-width':run?1.2:2.2,'stroke-opacity':run?.35:1,'stroke-dasharray':'4 3'});
    KS.forEach(r=>svgEl('circle',{cx:c.X(r[0]),cy:yf(r[2]),r:run?1.8:3,fill:GRN,'fill-opacity':run?.4:1},svg));
    len=plen(rp);ln=poly(svg,rp,{stroke:YEL,'stroke-width':run?2.2:1.2,'stroke-opacity':run?1:.4,'stroke-linejoin':'round','stroke-dasharray':len,'stroke-dashoffset':done?0:len});
    const x=c.X(hov);svgEl('line',{x1:x,x2:x,y1:c.top,y2:c.bot,stroke:TXT,'stroke-opacity':.35},svg);
    svgEl('circle',{cx:x,cy:yf(REACH[hov-1]),r:3.2,fill:YEL,stroke:'#0e0c12'},svg);
    keysV(svg,c.X(58),c.top+30,[{c:YEL,t:'run-weighted, every encounter'},{c:GRN,t:'player-weighted, key stages',dash:'4 3'}]);
    ylab(svg,c,'Story runs still alive');}
  function show(n){hov=n;const k=KS.find(r=>r[0]===n);
    ro.innerHTML=`<b>${encName(n)}</b> · ${ATT[n-1]} of 651 runs got here (${pc(REACH[n-1])}) · ${pc(LOSS[n-1])} of attempts ended here`+
      (k?` · player-weighted reach ${pc(k[2])} (${k[3]} players)`:'')+`<br>Reach W2: ${pc(43.9)} run-weighted vs ${pc(28.4)} player-weighted. Story wins: 6 of 651 runs.`;}
  hover(svg,()=>c,v=>{const n=clamp(Math.round(v),1,180);if(n!==hov){show(n);draw();}});
  c0.seg('w',v=>{wt=v;done=true;draw();show(hov);});c0.on('log',()=>{done=true;draw();});draw();show(36);
  return {tick(dt){if(done)return;t+=dt;const p=Math.min(1,t/2.6);ln.setAttribute('stroke-dashoffset',len*(1-p));if(p>=1)done=true;}};});

// ======================================================================
// hazard: loss % per encounter attempt by slot type and world
// ======================================================================
// q1_funnel.loss_by_segment rows per world: [attempts, loss %, players] for reg 1-11, elite 12, reg 13-23, elite 24, reg 25-35, boss 36
const LBS=[[[7092,.17,18],[639,12.52,17],[6060,.23,15],[545,13.94,15],[5074,.35,11],[451,36.59,11]],
  [[3105,.23,10],[279,12.9,10],[2604,.65,10],[226,20.8,10],[1944,.21,10],[175,29.71,10]],
  [[1322,.68,10],[114,17.54,10],[993,.91,10],[85,21.18,10],[694,1.01,10],[60,41.67,10]],
  [[365,.82,10],[32,21.88,10],[256,1.17,8],[22,13.64,8],[209,0,7],[19,42.11,7]],
  [[112,.89,7],[10,0,6],[110,0,6],[10,0,6],[110,0,6],[10,40,6]]];
const wmean=rows=>{let a=0,b=0;rows.forEach(r=>{a+=r[0]*r[1];b+=r[0];});return {v:a/b,n:b};};
const HZ=LBS.map(w=>[wmean([w[0],w[2],w[4]]),wmean([w[1],w[3]]),{v:w[5][1],n:w[5][0]}]);
reg('hazard',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let hw=0;const SC=[MUTE,BLU,RED],SN=['normal','elite','boss'];
  function draw(){const lg=c0.segv('s')==='log';const c=frame(svg,360,226,[22,8,30,46],-.5,4.5,lg?.1:0,lg?100:50,{ylog:lg});
    yTicks(svg,c,lg?[.1,1,10,100]:[0,10,20,30,40,50],v=>v+'%');axis(svg,c);
    const gw=c.X(1)-c.X(0),bw=gw*.24;
    for(let w=0;w<5;w++){const x0=c.X(w);if(w===hw)svgEl('rect',{x:x0-gw/2,y:c.top,width:gw,height:c.bot-c.top,fill:'#fff','fill-opacity':.05},svg);
      svgText(svg,x0,c.bot+13,'W'+(w+1),{'text-anchor':'middle','font-size':10,fill:CW[w]});
      svgText(svg,x0,c.bot+24,`${LBS[w][0][2]} pl.`,{'text-anchor':'middle','font-size':8.5});
      HZ[w].forEach((h,s)=>{const x=x0+(s-1)*bw*1.15,v=lg?Math.max(h.v,.1):h.v,y=c.Y(v);
        svgEl('rect',{x:x-bw/2,y,width:bw,height:c.bot-y,fill:SC[s],'fill-opacity':h.n<30?.4:.85},svg);
        svgText(svg,x,y-3,h.v===0?'0':h.v<1?h.v.toFixed(1):Math.round(h.v),{'text-anchor':'middle','font-size':8,fill:SC[s]});});
      const r=svgEl('rect',{x:x0-gw/2,y:c.top,width:gw,height:c.bot-c.top,fill:'transparent'},svg);
      r.addEventListener('pointerenter',()=>{hw=w;draw();show();});r.addEventListener('click',()=>{hw=w;draw();show();});}
    keys(svg,c.l+4,12,[{c:MUTE,t:'normal',box:1},{c:BLU,t:'elite (e12, e24)',box:1},{c:RED,t:'boss (e36)',box:1}]);
    ylab(svg,c,'Runs ending, % of attempts');}
  function show(){const w=LBS[hw],f=r=>`${pc(r[1])} of ${r[0]}`;
    ro.innerHTML=`<b>W${hw+1}</b> · normal ${pc(HZ[hw][0].v)} per encounter · ${ELN[hw][0]} ${f(w[1])} · ${ELN[hw][1]} ${f(w[3])} · ${BOSSN[hw]} ${f(w[5])} attempts`+
      (hw===4?'<br>W5 cells have 10 attempts from 6 players, so treat them as a hint.':'<br>A boss attempt ends the run 50 to 150 times as often as a normal encounter.');}
  c0.seg('s',()=>draw());draw();show();return {};});

// ======================================================================
// stairs: depth power stairs (DEPTH_EVERY 12, DEPTH_POWER) vs hero base power
// ======================================================================
const NB=[23.4,27.66,31.6,32.5,33.2],AB=[4.9,6.39,6.81,7.21,7.59]; // world roster averages, back-solved from note 01's table
const EB=[[160,140],[130,180],[200,170],[200,230],[190,210]],EA=[[14,10],[12,15],[14,12],[13,14],[13,15]];
const BOSS=[[765,13.6],[2000,20],[3105,44.9],[4560,42],[5160,43.2]];
const HERO=[[1,1],[36,24],[72,31],[144,34],[180,39]]; // median level at first boss kill, v0.5 (note 01)
const META=[[37,52],[72,58],[145,84]]; // note 01 example build: attack with Forge 5 and Blade picks
const dpow=(n,d=.45)=>1+Math.floor(n/12)*d;
const sawp=(n,d)=>{const w=(n-1)/36|0,pos=(n-1)%36+1;return dpow(w*36+24,d)*(pos<12?.55:pos<24?.78:1);};
reg('stairs',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let hov=48,c=null;
  const st=n=>{const d=c0.v('dp')/100,saw=c0.v('saw'),p=saw?sawp(n,d):dpow(n,d),w=(n-1)/36|0,pos=(n-1)%36+1;
    if(pos===36)return {p:null,hp:BOSS[w][0],atk:BOSS[w][1],kind:'boss'};
    if(pos===12||pos===24){const e=pos===12?0:1;return {p,hp:EB[w][e]*p,atk:EA[w][e]*(.5+.5*p)*1.2*(n>=24?1.5:1),kind:'elite'};}
    return {p,hp:NB[w]*p,atk:AB[w]*(.5+.5*p),kind:'normal'};};
  const hatk=L=>(7.7+.7*(L-1))/7.7;
  function draw(){c0.out('dp',(c0.v('dp')/100).toFixed(2));c=frame(svg,360,250,[18,10,30,46],.5,180.5,.8,1000,{ylog:true});
    worldBands(svg,c);yTicks(svg,c,[1,3,10,30,100,300,1000],v=>v+'×');
    const S=[];for(let n=1;n<=180;n++)S.push(st(n));
    const nh=[],na=[];S.forEach((s,i)=>{const n=i+1;if(s.kind!=='normal'){nh.push(null);na.push(null);return;}nh.push(s.hp/23.4);na.push(s.atk/4.9);});
    const seg=(arr,col,w,dash)=>{let cur=[];arr.forEach((v,i)=>{if(v==null){if(cur.length)poly(svg,cur,{stroke:col,'stroke-width':w,'stroke-dasharray':dash||''});cur=[];return;}
      const y=c.Y(v);cur.push([c.X(i+.5),y],[c.X(i+1.5),y]);});if(cur.length)poly(svg,cur,{stroke:col,'stroke-width':w,'stroke-dasharray':dash||''});};
    seg(nh,YEL,2);seg(na,RED,1.6);
    S.forEach((s,i)=>{const n=i+1,x=c.X(n);if(s.kind==='elite'){svgEl('path',{d:`M${x-3.5} ${c.Y(s.hp/23.4)-3}h7l-3.5 6z`,fill:YEL},svg);svgEl('path',{d:`M${x-3.5} ${c.Y(s.atk/4.9)-3}h7l-3.5 6z`,fill:RED},svg);}
      if(s.kind==='boss'){svgEl('path',{d:`M${x} ${c.Y(s.hp/23.4)-4.5}l4 4.5-4 4.5-4-4.5z`,fill:'none',stroke:YEL,'stroke-width':1.3},svg);}});
    poly(svg,HERO.map(([n,L])=>[c.X(n),c.Y(hatk(L))]),{stroke:GRN,'stroke-width':1.6,'stroke-dasharray':'3 2'});
    HERO.forEach(([n,L])=>{svgEl('circle',{cx:c.X(n),cy:c.Y(hatk(L)),r:3,fill:GRN},svg);svgText(svg,c.X(n),c.Y(hatk(L))+12,'L'+L,{'text-anchor':'middle','font-size':8.5,fill:GRN});});
    META.forEach(([n,a])=>svgEl('circle',{cx:c.X(n),cy:c.Y(a/7.7),r:3,fill:'none',stroke:GRN,'stroke-width':1.3},svg));
    const x=c.X(hov);svgEl('line',{x1:x,x2:x,y1:c.top,y2:c.bot,stroke:TXT,'stroke-opacity':.35},svg);
    keysV(svg,c.l+6,c.top+12,[{c:YEL,t:'normal enemy HP (triangles elites, diamonds bosses)'},{c:RED,t:'enemy attack'},{c:GRN,t:'hero base attack at first-kill level',dash:'3 2'}]);
    if(c0.v('saw'))svgText(svg,c.r-4,c.top+12,'illustrative sawtooth',{'text-anchor':'end','font-size':9.5,fill:BLU});
    ylab(svg,c,'Multiplier vs encounter 1 (log)');show();}
  function show(){const s=st(hov),s179=st(179),d=c0.v('dp')/100;
    ro.innerHTML=`<b>${encName(hov)}</b> · ${s.kind}${s.p?` · depth power ${s.p.toFixed(2)}`:' · fixed stats'} · HP ${nf(s.hp)} (${(s.hp/23.4).toFixed(1)}×) · attack ${s.atk.toFixed(1)} (${(s.atk/4.9).toFixed(1)}×)`+
      `<br>Normal HP grows ${(s179.hp/23.4).toFixed(1)}× from encounter 1 to 179 at DEPTH_POWER ${d.toFixed(2)}. Hero base attack grows 4.5× from level 1 to 39.`;}
  hover(svg,()=>c,v=>{const n=clamp(Math.round(v),1,180);if(n!==hov){hov=n;draw();}});
  c0.on('dp',draw);c0.on('saw',draw);draw();return {};});

// ======================================================================
// scroll: px per real second for each tier clock, against story run length
// ======================================================================
// q5_board_pressure.by_depth_band: [median seconds, story runs, depth band]
const RL=[[64,94,'0-500'],[101.55,86,'500-1000'],[168.5,171,'1000-1500'],[202.8,44,'1500-2000'],[242.9,60,'2000-2500'],[301.3,52,'2500-3000'],[349.9,24,'3000-3500'],[406.85,42,'3500-4000'],[457.8,9,'4000-4500'],[503.6,5,'5000-5500'],[578.7,3,'won']];
reg('scroll',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let c=null,cur=null,dots=[],t=0,hovT=null,lastRo=-1;
  const sp=(s,k,B,A,M)=>k*Math.min(B+A*k*s,M);
  function draw(){const B=c0.v('b'),A=c0.v('a')/100,M=c0.v('m');c0.out('b',B);c0.out('a',A.toFixed(2));c0.out('m',M);
    const ymax=Math.ceil(M*1.25/20)*20+20;c=frame(svg,360,270,[18,12,92,40],0,600,0,ymax);
    yTicks(svg,c,[...Array(ymax/20+1)].map((_,i)=>i*20));
    const sT=c.bot+22,sB=c.bot+62;
    [0,100,200,300,400,500,600].forEach(s=>{svgEl('line',{x1:c.X(s),x2:c.X(s),y1:c.top,y2:sB,class:'gl'},svg);svgText(svg,c.X(s),sB+12,s,{'text-anchor':'middle','font-size':10});});
    xlab(svg,c,'Real seconds into the run',sB+24);
    [[177,'median 177 s'],[369,'p90 369 s']].forEach(([s,t2])=>{svgEl('line',{x1:c.X(s),x2:c.X(s),y1:c.top,y2:sB,stroke:TXT,'stroke-opacity':.5,'stroke-dasharray':'3 3'},svg);svgText(svg,c.X(s)+3,c.top+9,t2,{'font-size':9,fill:TXT});});
    TIERS.forEach(([n,k])=>{const pts=[];for(let s=0;s<=600;s+=4)pts.push([c.X(s),c.Y(sp(s,k,B,A,M))]);poly(svg,pts,{stroke:TIERC[n],'stroke-width':1.8});
      const tf=(M-B)/(A*k);if(tf<=600)svgEl('circle',{cx:c.X(tf),cy:c.Y(k*M),r:2.6,fill:TIERC[n]},svg);});
    keysV(svg,c.X(440),c.bot-42,TIERS.map(([n,k])=>({c:TIERC[n],t:`${n} ${k}`})).reverse(),11);
    ylab(svg,c,'Scroll, px per real second');
    const mx=Math.max(...RL.map(r=>r[1]));
    RL.forEach(([s,n])=>{const h=(n/mx)*(sB-sT);svgEl('rect',{x:c.X(s)-3,y:sB-h,width:6,height:h,fill:MUTE,'fill-opacity':.75},svg);});
    svgText(svg,c.l+2,sT-4,'Story runs by end depth, placed at the band median length',{'font-size':9});
    svgEl('line',{x1:c.l,x2:c.r,y1:sB,y2:sB,class:'ax'},svg);
    cur=svgEl('line',{y1:c.top,y2:c.bot,stroke:TXT,'stroke-opacity':.35},svg);dots=TIERS.map(([n])=>svgEl('circle',{r:3.2,fill:TIERC[n],stroke:'#0e0c12'},svg));
    lastRo=-1;place(hovT==null?(t%12)/12*600:hovT);}
  function place(s){if(!c)return;const B=c0.v('b'),A=c0.v('a')/100,M=c0.v('m'),x=c.X(s);cur.setAttribute('x1',x);cur.setAttribute('x2',x);
    TIERS.forEach(([n,k],i)=>{dots[i].setAttribute('cx',x);dots[i].setAttribute('cy',c.Y(sp(s,k,B,A,M)));});
    const r=Math.round(s/5);if(r===lastRo)return;lastRo=r;
    const full=TIERS.map(([n,k])=>`${n} ${nf((M-B)/(A*k))} s`).join(' · ');
    ro.innerHTML=`At <b>${Math.round(s)} s</b>: `+TIERS.map(([n,k])=>`${n} ${sp(s,k,B,A,M).toFixed(1)}`).join(' · ')+` px/s`+
      `<br>Real seconds to full speed: ${full}`;}
  hover(svg,()=>c,v=>{hovT=v;place(v);});svg.addEventListener('pointerleave',()=>{hovT=null;});
  ['b','a','m'].forEach(k=>c0.on(k,draw));draw();
  return {tick(dt){if(hovT!=null||!motion)return;t+=dt;place((t%12)/12*600);}};});

// ======================================================================
// deaths: HP deaths vs dark deaths by world (stacked shares)
// ======================================================================
const DW=[['All story runs',651,81.6,16.1,1.4,.9,18],['W1',365,87.9,9.9,2.2,0,18],['W2',163,79.1,20.2,.6,0,10],['W3',88,67,33,0,0,10],['W4',24,75,25,0,0,8],['W5',11,36.4,9.1,0,54.5,7]];
const DK=[['regular',104,7.7,85.6,6.7,0,15],['elite',287,93.7,5.6,.7,0,17],['boss',254,100,0,0,0,11]];
reg('deaths',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let by='world';const SC=[RED,PUR,MUTE,GRN],SN=['HP death','caught by the dark','other','won'];
  function draw(){const rows=by==='world'?DW:DK,H=rows.length*30+46;svg.setAttribute('viewBox',`0 0 360 ${H}`);svg.innerHTML='';
    const l=96,r=352,X=v=>l+v/100*(r-l);
    keys(svg,6,12,SN.map((t,i)=>({c:SC[i],t,box:1})));
    [0,25,50,75,100].forEach(v=>{svgEl('line',{x1:X(v),x2:X(v),y1:22,y2:H-18,class:'gl'},svg);svgText(svg,X(v),H-6,v+'%',{'text-anchor':'middle','font-size':10});});
    rows.forEach((row,i)=>{const y=28+i*30;let a=0;
      svgText(svg,l-6,y+10,by==='world'?row[0]:'ended at '+row[0],{'text-anchor':'end','font-size':10.5,class:'lab',fill:row[0][0]==='W'?CW[+row[0][1]-1]:TXT});
      svgText(svg,l-6,y+21,`${row[1]} runs · ${row[6]} pl.`,{'text-anchor':'end','font-size':8.5});
      for(let s=0;s<4;s++){const v=row[2+s];if(!v)continue;const w=X(a+v)-X(a);
        const g=svgEl('rect',{x:X(a),y,width:w,height:20,fill:SC[s],'fill-opacity':row[1]<30?.45:.85,'data-i':i,'data-s':s},svg);
        if(w>24)svgText(svg,X(a)+w/2,y+13.5,Math.round(v)+'%',{'text-anchor':'middle','font-size':9.5,fill:'#0e0c12'});a+=v;}});}
  function show(i){const rows=by==='world'?DW:DK,row=rows[i];
    ro.innerHTML=`<b>${by==='world'?row[0]:'Runs that ended at a '+row[0]+' encounter'}</b> · ${row[1]} runs, ${row[6]} players · `+SN.map((n,s)=>`${n} ${pc(row[2+s])}`).join(' · ')+(row[1]<30?'<br>Fewer than 30 runs, so the split is rough.':'');}
  const pick=e=>{const g=e.target.closest('rect[data-i]');if(g)show(+g.dataset.i);};svg.addEventListener('pointerover',pick);svg.addEventListener('click',pick);
  c0.seg('by',v=>{by=v;draw();show(0);});draw();show(0);return {};});

// ======================================================================
// learning: median and p75 depth by lifetime run cohort, power-law fit
// ======================================================================
// q3_learning.depth_by_run_number: label, lo, hi, runs, median, p75, players
const LR=[['1-3',1,3,57,441,441,18],['4-10',4,10,95,879,1161,12],['11-25',11,25,191,1315,2218,11],['26-50',26,50,180,2644,3551,10],['51+',51,100,128,1774,2757,3]];
const LNP=[['1-3',1,3,36,441,441,11],['4-10',4,10,46,876,885,5],['11-25',11,25,83,1313,1829,4],['26-50',26,50,62,3105,3971,3]];
// note 07 finer cells (career runs, story runs, median depth) used for the fit
const L7=[[1,1,23,441],[2,3,34,441],[4,7,55,811],[8,15,108,1304],[16,31,188,1904],[32,63,148,2651]];
const FIT=(()=>{const P=L7.map(r=>[Math.log(Math.sqrt(r[0]*r[1])),Math.log(r[3])]),n=P.length,mx=P.reduce((a,p)=>a+p[0],0)/n,my=P.reduce((a,p)=>a+p[1],0)/n;
  let sxy=0,sxx=0;P.forEach(p=>{sxy+=(p[0]-mx)*(p[1]-my);sxx+=(p[0]-mx)**2;});const b=sxy/sxx;return {b,a:Math.exp(my-b*mx)};})();
reg('learning',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let hv=2,c=null;
  function draw(){const np=c0.v('np'),D=np?LNP:LR;c=frame(svg,360,240,[16,62,30,48],1,100,0,4000,{xlog:true});
    yTicks(svg,c,[0,1000,2000,3000,4000],v=>v?nf(v):'0');xTicks(svg,c,[1,2,5,10,20,50,100]);
    xlab(svg,c,"Player's lifetime run number (log)");ylab(svg,c,'Story depth, m');
    [[441,'Ogre King'],[879,'Broodmother'],[1315,'Mossback']].forEach(([m,t2],i)=>{hline(svg,c,c.Y(m),{stroke:i===2?RED:BLU,'stroke-opacity':.55,'stroke-dasharray':'4 3'});
      svgText(svg,c.r+3,c.Y(m)+3,t2,{'font-size':8.5,fill:i===2?RED:BLU});});
    const fp=[];for(let k=0;k<=40;k++){const x=Math.pow(63,k/40);fp.push([c.X(x),c.Y(FIT.a*Math.pow(x,FIT.b))]);}
    poly(svg,fp,{stroke:PUR,'stroke-width':1.5,'stroke-dasharray':'2 2'});
    const gm=r=>Math.sqrt(r[1]*r[2]);
    D.forEach((r,i)=>{svgEl('line',{x1:c.X(r[1]),x2:c.X(r[2]),y1:c.Y(r[4]),y2:c.Y(r[4]),stroke:YEL,'stroke-opacity':.35,'stroke-width':4},svg);});
    poly(svg,D.map(r=>[c.X(gm(r)),c.Y(r[5])]),{stroke:YEL,'stroke-width':1.4,'stroke-opacity':.6,'stroke-dasharray':'4 3'});
    poly(svg,D.map(r=>[c.X(gm(r)),c.Y(r[4])]),{stroke:YEL,'stroke-width':2.2});
    D.forEach((r,i)=>{const thin=r[6]<5;svgEl('circle',{cx:c.X(gm(r)),cy:c.Y(r[4]),r:i===hv?4.5:3.4,fill:thin?'#0e0c12':YEL,stroke:YEL,'stroke-width':1.5},svg);
      svgEl('circle',{cx:c.X(gm(r)),cy:c.Y(r[5]),r:2.4,fill:'none',stroke:YEL},svg);
      const h=svgEl('rect',{x:c.X(r[1]),y:c.top,width:Math.max(8,c.X(r[2])-c.X(r[1])),height:c.bot-c.top,fill:'transparent'},svg);
      h.addEventListener('pointerenter',()=>{hv=i;draw();});h.addEventListener('click',()=>{hv=i;draw();});});
    keysV(svg,c.l+6,c.top+8,[{c:YEL,t:'median'},{c:YEL,t:'p75',dash:'4 3'},{c:PUR,t:`fit, depth ∝ n^${FIT.b.toFixed(2)}`,dash:'2 2'}]);
    const r=D[Math.min(hv,D.length-1)];
    ro.innerHTML=`<b>Runs ${r[0]}</b> · ${r[3]} story runs, ${r[6]} players · median ${nf(r[4])} m · p75 ${nf(r[5])} m`+(r[6]<5?' · thin cell, read with care':'')+
      `<br>Power-law fit on note 07's six cells: depth ≈ ${Math.round(FIT.a)} × n^${FIT.b.toFixed(2)}. The median sits on a W1 wall for the first 25 runs.`;}
  c0.on('np',()=>{hv=Math.min(hv,c0.v('np')?3:4);draw();});draw();return {};});

// ======================================================================
// pace: moves per second flat while depth rises, two stacked panels
// ======================================================================
// q4_tiers.pace_by_run_number: label, runs, median moves/s, p75, players, tier mix bronze/silver/gold/diamond
const PR=[['1-3',54,.461,.531,18,[5.6,29.6,48.1,16.7]],['4-10',89,.475,.515,12,[3.4,15.7,44.9,36]],['11-25',181,.464,.514,11,[0,8.3,36.5,55.2]],['26-50',163,.45,.478,10,[2.5,9.8,46.6,41.1]],['51+',107,.448,.487,3,[0,1.9,57.9,40.2]]];
reg('pace',root=>{const svg=$('svg',root),ro=$('[data-ro]',root);let hv=0;
  function draw(){svg.setAttribute('viewBox','0 0 360 268');svg.innerHTML='';
    const l=44,r=350,X=i=>l+(i+.5)*(r-l)/5,bw=(r-l)/5;
    const A={top:22,bot:108},B={top:146,bot:236};
    const YA=v=>A.bot-v/.6*(A.bot-A.top),YB=v=>B.bot-v/4000*(B.bot-B.top);
    svgText(svg,l,A.top-8,'Moves per second (median, p75 tick)',{'font-size':10,class:'lab'});
    svgText(svg,l,B.top-8,'Story depth, m (median, p75 tick)',{'font-size':10,class:'lab'});
    [0,.2,.4,.6].forEach(v=>{svgEl('line',{x1:l,x2:r,y1:YA(v),y2:YA(v),class:'gl'},svg);svgText(svg,l-4,YA(v)+3.5,v.toFixed(1),{'text-anchor':'end','font-size':10});});
    [0,1000,2000,3000,4000].forEach(v=>{svgEl('line',{x1:l,x2:r,y1:YB(v),y2:YB(v),class:'gl'},svg);svgText(svg,l-4,YB(v)+3.5,v?nf(v):'0',{'text-anchor':'end','font-size':10});});
    [[1333,'W2']].forEach(([m,t2])=>{svgEl('line',{x1:l,x2:r,y1:YB(m),y2:YB(m),stroke:BLU,'stroke-opacity':.5,'stroke-dasharray':'4 3'},svg);svgText(svg,l+4,YB(m)-3,t2+' starts at 1,333 m',{'font-size':8.5,fill:BLU});});
    if(hv>=0)svgEl('rect',{x:l+hv*bw,y:A.top,width:bw,height:B.bot-A.top,fill:'#fff','fill-opacity':.05},svg);
    poly(svg,PR.map((p,i)=>[X(i),YA(p[2])]),{stroke:BLU,'stroke-width':2});
    poly(svg,LR.map((p,i)=>[X(i),YB(p[4])]),{stroke:YEL,'stroke-width':2});
    PR.forEach((p,i)=>{const thin=p[4]<5;svgEl('line',{x1:X(i)-6,x2:X(i)+6,y1:YA(p[3]),y2:YA(p[3]),stroke:BLU},svg);
      svgEl('circle',{cx:X(i),cy:YA(p[2]),r:3.4,fill:thin?'#0e0c12':BLU,stroke:BLU,'stroke-width':1.5},svg);
      const d=LR[i];svgEl('line',{x1:X(i)-6,x2:X(i)+6,y1:YB(d[5]),y2:YB(d[5]),stroke:YEL},svg);
      svgEl('circle',{cx:X(i),cy:YB(d[4]),r:3.4,fill:thin?'#0e0c12':YEL,stroke:YEL,'stroke-width':1.5},svg);
      svgText(svg,X(i),B.bot+13,p[0],{'text-anchor':'middle','font-size':10});
      const h=svgEl('rect',{x:l+i*bw,y:A.top,width:bw,height:B.bot-A.top,fill:'transparent'},svg);
      h.addEventListener('pointerenter',()=>{hv=i;draw();});h.addEventListener('click',()=>{hv=i;draw();});});
    svgText(svg,(l+r)/2,B.bot+27,"Player's lifetime run number",{'text-anchor':'middle','font-size':10});
    const p=PR[hv],d=LR[hv];
    ro.innerHTML=`<b>Runs ${p[0]}</b> · ${p[2].toFixed(3)} moves/s (p75 ${p[3].toFixed(3)}, ${p[1]} runs) · depth ${nf(d[4])} m (p75 ${nf(d[5])}) · ${p[4]} players`+
      `<br>Tier mix: bronze ${p[5][0]}% · silver ${p[5][1]}% · gold ${p[5][2]}% · diamond ${p[5][3]}%`;}
  draw();return {};});

// ======================================================================
// tiers: story depth by tier (median to p75) with the tier clock
// ======================================================================
// q4_tiers.by_tier and depth_by_tier_and_start_level: story runs, median, p75, reach W2 %, players
const TB={all:{bronze:[13,null,null,null,2],silver:[78,882,1661,25.6,11],gold:[292,1316,2642,46.2,8],diamond:[268,1317,2640,46.3,8]},
  '1-10':{bronze:[6,null,null,null,1],silver:[47,441,879,0,9],gold:[84,880,1023,3.6,8],diamond:[70,880,1309,2.9,6]},
  '11-20':{bronze:[0,null,null,null,0],silver:[18,null,null,null,1],gold:[80,1316,2211,40,5],diamond:[92,1768,2218,54.3,7]},
  '21+':{bronze:[7,null,null,null,1],silver:[13,null,null,null,1],gold:[128,2643,3551,78.1,4],diamond:[106,2638,3551,67.9,7]}};
const PACE={bronze:.305,silver:.353,gold:.443,diamond:.506},SPK={bronze:null,silver:161,gold:125,diamond:107};
reg('tiers',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let band='all';
  function draw(){svg.setAttribute('viewBox','0 0 360 212');svg.innerHTML='';const l=96,r=330,X=v=>l+v/4000*(r-l);
    [0,1000,2000,3000,4000].forEach(v=>{svgEl('line',{x1:X(v),x2:X(v),y1:18,y2:184,class:'gl'},svg);svgText(svg,X(v),196,v?nf(v):'0',{'text-anchor':'middle','font-size':10});});
    svgText(svg,(l+r)/2,209,'Story depth, m',{'text-anchor':'middle','font-size':10});
    [[1333,'W2'],[2666,'W3']].forEach(([m,t2])=>{svgEl('line',{x1:X(m),x2:X(m),y1:18,y2:184,stroke:BLU,'stroke-opacity':.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(m)+3,26,t2,{'font-size':9,fill:BLU});});
    keys(svg,l,12,[{c:TXT,t:'median',dot:1},{c:MUTE,t:'bar runs to p75'}]);
    TIERS.forEach(([n,k],i)=>{const y=34+i*40,d=TB[band][n];
      svgText(svg,l-8,y+8,cap(n),{'text-anchor':'end','font-size':11,fill:TIERC[n]});
      svgText(svg,l-8,y+20,`clock ${k}`,{'text-anchor':'end','font-size':8.5});svgText(svg,l-8,y+30,`${PACE[n]} moves/s`,{'text-anchor':'end','font-size':8.5});
      svgEl('rect',{x:l,y:y+4,width:X(k*1000)-l,height:3,fill:TIERC[n],'fill-opacity':.25},svg);
      if(d[1]==null){svgText(svg,l+6,y+16,`${d[0]} runs, ${d[4]} player${d[4]===1?'':'s'}, suppressed`,{'font-size':9.5});return;}
      svgEl('rect',{x:X(d[1]),y:y+9,width:X(d[2])-X(d[1]),height:10,fill:TIERC[n],'fill-opacity':.35},svg);
      svgEl('circle',{cx:X(d[1]),cy:y+14,r:4.5,fill:TIERC[n],stroke:'#0e0c12'},svg);
      svgText(svg,X(d[1]),y+3,`${nf(d[1])} m · ${d[0]} runs`,{'font-size':9,fill:TIERC[n],'text-anchor':'middle'});});
    const b=TB[band];
    ro.innerHTML=(band==='all'?'All story runs':'Start level '+band)+' · '+TIERS.map(([n])=>`${n} ${b[n][1]==null?'n/a':nf(b[n][1])+' m'}`).join(' · ')+
      `<br>Story seconds per 1,000 m: silver 161 · gold 125 · diamond 107. Seconds to the W1 boss: gold 114, diamond 101 (ratio 1.13, clock ratio 1.14).`;}
  c0.seg('band',v=>{band=v;draw();});draw();return {};});

// ======================================================================
// xpwall: hero level by run number for a player stuck at a wall (xp.py)
// ======================================================================
const xpn=L=>40*L+2*L*Math.max(0,L-8);
const WALLS=[['Ogre King (e12)',51,RED],['Broodmother (e24)',166,ORG],['Old Mossback (e36)',317,YEL],['The Warden (e72)',1091,GRN]];
function simXP(raw,cap,runs=60){let L=1,xp=0;const out=[];for(let r=0;r<runs;r++){const need=Math.max(xpn(L)-xp,0);
  const a=!cap||raw<=need?raw:need+Math.round((raw-need)/3);xp+=a;while(xp>=xpn(L)&&L<40){xp-=xpn(L);L++;}out.push(L);}return out;}
reg('xpwall',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let rule='cap',hr=10,c=null;
  function draw(){const capd=rule==='cap';c=frame(svg,360,236,[16,10,30,40],1,60,1,40);
    yTicks(svg,c,[1,10,20,30,40]);xTicks(svg,c,[1,10,20,30,40,50,60]);xlab(svg,c,'Run number');ylab(svg,c,'Hero level after the run');
    [3,8,14,21,29].forEach(L=>{hline(svg,c,c.Y(L),{stroke:PUR,'stroke-opacity':.3,'stroke-dasharray':'2 3'});svgText(svg,c.r-2,c.Y(L)-2,'row '+L,{'text-anchor':'end','font-size':8,fill:PUR});});
    const S=WALLS.map(w=>simXP(w[1],capd)),O=WALLS.map(w=>simXP(w[1],!capd));
    WALLS.forEach((w,i)=>{const big=i===0||i===3;poly(svg,O[i].map((L,r)=>[c.X(r+1),c.Y(L)]),{stroke:w[2],'stroke-width':1,'stroke-opacity':.3,'stroke-dasharray':'2 2'});
      poly(svg,S[i].map((L,r)=>[c.X(r+1),c.Y(L)]),{stroke:w[2],'stroke-width':big?2.3:1.3,'stroke-opacity':big?1:.6});});
    const x=c.X(hr);svgEl('line',{x1:x,x2:x,y1:c.top,y2:c.bot,stroke:TXT,'stroke-opacity':.35},svg);
    WALLS.forEach((w,i)=>svgEl('circle',{cx:x,cy:c.Y(S[i][hr-1]),r:3,fill:w[2],stroke:'#0e0c12'},svg));
    keysV(svg,c.l+6,c.top+8,WALLS.slice().reverse().map(w=>({c:w[2],t:'ends at '+w[0]})),11);
    ro.innerHTML=`After <b>run ${hr}</b> (${capd?'since v0.7.9, a third of XP past the first level':'before v0.7.9, all XP counts'}): `+WALLS.map((w,i)=>`${w[0].split(' (')[0]} L${S[i][hr-1]}`).join(' · ')+
      `<br>Stuck at the Ogre King: level ${S[0][9]} at run 10 and ${S[0][49]} at run 50. The other rule gives ${O[0][9]} and ${O[0][49]} (dotted lines).`;}
  hover(svg,()=>c,v=>{const r=clamp(Math.round(v),1,60);if(r!==hr){hr=r;draw();}});
  c0.seg('rule',v=>{rule=v;draw();});draw();return {};});

// ======================================================================
// endless: depth power over encounters, ENDLESS_POWER compounding per 12
// ======================================================================
const EN={p25:107,med:250.5,p75:323,p90:359}; // q7_endless.summary encounters_cleared
reg('endless',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let c=null,hov=251;
  const dpE=(n,e)=>{const s=Math.floor(n/12);return s<=15?1+s*.45:7.75*Math.pow(1+e,s-15);};
  function draw(){const e=c0.v('e')/100;c0.out('e',e.toFixed(2));c=frame(svg,360,236,[18,10,30,48],1,540,.8,1000,{ylog:true});
    yTicks(svg,c,[1,3,10,30,100,300,1000],v=>v+'×');xTicks(svg,c,[1,90,180,270,360,450,540]);
    xlab(svg,c,'Encounter in an endless run');ylab(svg,c,'Depth power (log)');
    svgEl('rect',{x:c.X(EN.p25),y:c.top,width:c.X(EN.p75)-c.X(EN.p25),height:c.bot-c.top,fill:GRN,'fill-opacity':.09},svg);
    [[180,'lap 2'],[360,'lap 3']].forEach(([n,t2])=>{vline(svg,c,c.X(n),{stroke:MUTE,'stroke-opacity':.6});svgText(svg,c.X(n)+3,c.top+9,t2,{'font-size':9});});
    svgText(svg,c.X(8),c.top+9,'lap 1',{'font-size':9});
    [[EN.med,'median end'],[EN.p75,'p75']].forEach(([n,t2],i)=>{vline(svg,c,c.X(n),{stroke:GRN,'stroke-dasharray':'4 3'});svgText(svg,c.X(n)+3,c.top+22+i*11,t2,{'font-size':9,fill:GRN});});
    const ref=[];for(let n=1;n<=540;n++)ref.push(dpE(n,.12));
    if(Math.abs(e-.12)>.001)poly(svg,stepPts(c,ref,1,v=>c.Y(Math.min(v,1000))),{stroke:MUTE,'stroke-width':1.2,'stroke-dasharray':'3 2'});
    const cur=[];for(let n=1;n<=540;n++)cur.push(dpE(n,e));
    poly(svg,stepPts(c,cur,1,v=>c.Y(Math.min(v,1000))),{stroke:YEL,'stroke-width':2.2});
    const x=c.X(hov);svgEl('circle',{cx:x,cy:c.Y(Math.min(dpE(hov,e),1000)),r:3.2,fill:YEL,stroke:'#0e0c12'},svg);
    keysV(svg,c.X(290),c.bot-24,[{c:YEL,t:`ENDLESS_POWER ${e.toFixed(2)}`}].concat(Math.abs(e-.12)>.001?[{c:MUTE,t:'current 0.12',dash:'3 2'}]:[]));
    const dbl=12*Math.log(2)/Math.log(1+e);
    ro.innerHTML=`<b>Encounter ${hov}</b> · depth power ${dpE(hov,e).toFixed(1)}× · normal HP about ${nf(33.2*dpE(hov,e))} on later laps`+
      `<br>Enemies double every ${Math.round(dbl)} encounters past the bottom. At the median end (encounter ${Math.round(EN.med)}) power is ${dpE(EN.med,e).toFixed(1)}×, at p75 (${EN.p75}) ${dpE(EN.p75,e).toFixed(1)}×.`;}
  hover(svg,()=>c,v=>{const n=clamp(Math.round(v),1,540);if(n!==hov){hov=n;draw();}});
  c0.on('e',draw);draw();return {};});

// ======================================================================
// sessions: runs per sitting and per day, time to the next run
// ======================================================================
reg('sessions',root=>{const svg=$('svg',root),ro=$('[data-ro]',root);
  svg.setAttribute('viewBox','0 0 360 300');svg.innerHTML='';
  // top panel: quantile strips on a log axis of runs
  const l=100,r=334,XA=v=>l+Math.log(v)/Math.log(20)*(r-l);
  svgText(svg,8,14,'Runs per sitting and per active day',{'font-size':10.5,class:'lab'});
  [1,2,3,5,10,20].forEach(v=>{svgEl('line',{x1:XA(v),x2:XA(v),y1:24,y2:96,class:'gl'},svg);svgText(svg,XA(v),108,v,{'text-anchor':'middle','font-size':10});});
  svgText(svg,(l+r)/2,121,'Runs (log)',{'text-anchor':'middle','font-size':10});
  const strip=(y,lab,sub,q,col,txt)=>{svgText(svg,l-6,y+4,lab,{'text-anchor':'end','font-size':10,fill:col});svgText(svg,l-6,y+15,sub,{'text-anchor':'end','font-size':8.5});
    svgEl('line',{x1:XA(q.p25),x2:XA(q.p90),y1:y,y2:y,stroke:col,'stroke-opacity':.5,'stroke-width':2},svg);
    svgEl('rect',{x:XA(q.p25),y:y-6,width:Math.max(2,XA(q.p75)-XA(q.p25)),height:12,fill:col,'fill-opacity':.35},svg);
    svgEl('line',{x1:XA(q.med),x2:XA(q.med),y1:y-8,y2:y+8,stroke:col,'stroke-width':2.5},svg);
    svgText(svg,XA(q.p90)+3,y+3.5,'p90 '+q.p90,{'font-size':8.5,fill:col});
    svgText(svg,XA(q.med),y-11,txt,{'text-anchor':'middle','font-size':8.5,fill:col});};
  strip(46,'Per sitting','304 sittings',{p25:1,med:2,p75:3,p90:6.7},YEL,'median 2 · 48% are one run');
  strip(84,'Per active day','134 player-days',{p25:1.01,med:3.5,p75:8,p90:16},BLU,'median 3.5');
  // bottom panel: cumulative share of next runs started by t seconds (log)
  const T=150,B=262,cl=40,cr=348,XB=v=>cl+(Math.log(v)-Math.log(10))/(Math.log(1000)-Math.log(10))*(cr-cl),YB=v=>B-v/100*(B-T);
  svgText(svg,8,T-12,'Share of next runs started within t seconds',{'font-size':10.5,class:'lab'});
  [0,25,50,75,100].forEach(v=>{svgEl('line',{x1:cl,x2:cr,y1:YB(v),y2:YB(v),class:'gl'},svg);svgText(svg,cl-4,YB(v)+3.5,v+'%',{'text-anchor':'end','font-size':10});});
  [10,30,60,100,300,1000].forEach(v=>{svgEl('line',{x1:XB(v),x2:XB(v),y1:T,y2:B,class:'gl'},svg);svgText(svg,XB(v),B+12,v>=60?(v>=100?v+' s':'60 s'):v+' s',{'text-anchor':'middle','font-size':10});});
  svgText(svg,(cl+cr)/2,B+26,'Seconds from one run to the next (log)',{'text-anchor':'middle','font-size':10});
  svgEl('line',{x1:XB(60),x2:XB(60),y1:T,y2:B,stroke:TXT,'stroke-opacity':.5,'stroke-dasharray':'3 3'},svg);
  const A8=[[37,25],[60,36],[139,50],[600,63]],AS=[[24,25],[53,50],[134,75],[400,90]];
  const ser=(pts,col,dash)=>{poly(svg,pts.map(p=>[XB(p[0]),YB(p[1])]),{stroke:col,'stroke-width':1.6,'stroke-dasharray':dash||''});
    pts.forEach(p=>{const d=svgEl('circle',{cx:XB(p[0]),cy:YB(p[1]),r:3.6,fill:col,stroke:'#0e0c12',class:'dot','data-t':p[0],'data-p':p[1],'data-s':col===GRN?'a':'s',tabindex:0},svg);});};
  ser(A8,GRN);ser(AS,PNK,'4 3');
  keys(svg,cl+4,T+10,[{c:GRN,t:'any two runs, end to start'},{c:PNK,t:'inside a sitting',dash:'4 3'}]);
  const base='Hover or tap a dot. 36% of next runs start within 60 s and the median gap is 139 s, which includes town, talents and menus.';
  ro.innerHTML=base;
  const pick=e=>{const d=e.target.closest('.dot');if(!d)return;const a=d.dataset.s==='a';
    ro.innerHTML=`<b>${d.dataset.p}%</b> of next runs started within <b>${d.dataset.t} s</b> · `+(a?'end of one run to start of the next, all runs (note 08)':'inside a sitting, upload gap minus the next run\'s length (304 sittings)')+'<br>'+base;};
  svg.addEventListener('pointerover',pick);svg.addEventListener('click',pick);svg.addEventListener('focusin',pick);return {};});

// ======================================================================
// tetris: speed tables on a normalised progress axis
// ======================================================================
const NESF=[48,43,38,33,28,23,18,13,8,6,5,5,5,4,4,4,3,3,3,2,2,2,2,2,2,2,2,2,2,1];
const TGM=[[0,4],[90,64],[170,144],[200,4],[251,256],[400,1280],[420,1024],[450,768],[500,5120],[999,5120]];
const canab=s=>{let v=100,t=0;const st=[[250,30],[400,20],[800,10]];for(const [top,a] of st){const d=(top-v)/a;if(s<=t+d)return v+a*(s-t);t+=d;v=top;}return 800;};
reg('tetris',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let hx=.5,c=null;
  const G=[
    {n:'NES Tetris',col:PNK,span:'levels 0-29',f:x=>{const L=Math.min(29,Math.floor(x*29.999));return {r:48/NESF[L],lab:`level ${L}, ${NESF[L]} frames per cell`};},max:48,steps:true},
    {n:'TGM',col:PUR,span:'levels 0-999',f:x=>{const L=x*999;let i=0;while(i<TGM.length-2&&TGM[i+1][0]<=L)i++;const [a,ga]=TGM[i],[b,gb]=TGM[i+1];const g=L>=500?5120:ga+(gb-ga)*(L-a)/(b-a);return {r:g/4,lab:`level ${Math.round(L)}, about ${Math.round(g)}/256 G`};},max:1280},
    {n:'Canabalt',col:BLU,span:'first 60 s',f:x=>{const v=canab(x*60);return {r:v/100,lab:`${Math.round(x*60)} s, ${Math.round(v)} px/s`};},max:8},
    {n:'MatchRPG (gold)',col:YEL,span:'first 369 s',f:x=>{const s=x*369,v=1.1*Math.min(18+.15*1.1*s,60);return {r:v/(1.1*18),lab:`${Math.round(s)} s, ${v.toFixed(1)} px/s`};},max:60/18}];
  function draw(){const lg=c0.segv('y')==='log';c=frame(svg,360,240,[16,10,30,48],0,1,lg?1:0,lg?2000:1,{ylog:lg});
    yTicks(svg,c,lg?[1,3,10,30,100,300,1000]:[0,.25,.5,.75,1],v=>lg?v+'×':Math.round(v*100)+'%');xTicks(svg,c,[0,.25,.5,.75,1],v=>v);
    xlab(svg,c,'Share of each table: 0 = start, 1 = end');ylab(svg,c,lg?'Speed × the start speed (log)':'Speed as share of top speed');
    G.forEach(g=>{const pts=[];for(let k=0;k<=400;k++){const x=k/400,v=g.f(x).r;pts.push([c.X(x),c.Y(lg?v:v/g.max)]);}poly(svg,pts,{stroke:g.col,'stroke-width':g.n[0]==='M'?2.4:1.6});});
    TGM.forEach(([L,gv])=>svgEl('circle',{cx:c.X(L/999),cy:c.Y(lg?gv/4:gv/5120),r:2.2,fill:PUR},svg));
    const x=c.X(hx);svgEl('line',{x1:x,x2:x,y1:c.top,y2:c.bot,stroke:TXT,'stroke-opacity':.35},svg);
    keysV(svg,c.l+6,c.top+8,G.map(g=>({c:g.col,t:g.n})),11);
    ro.innerHTML=`At <b>${Math.round(hx*100)}%</b> of each table: `+G.map(g=>{const v=g.f(hx);return `${g.n} ${v.lab} (${v.r<10?v.r.toFixed(1):Math.round(v.r)}×)`;}).join(' · ')+
      `<br>Range from start to top: NES 48×, TGM 1,280×, Canabalt 8×, MatchRPG 3.3×.`;}
  hover(svg,()=>c,v=>{hx=clamp(v,0,1);draw();});c0.seg('y',()=>draw());draw();return {};});

// ======================================================================
// weights: depth funnel by world, run-weighted vs player-weighted
// ======================================================================
const WF=[['W1 boss','e36',69.3,42.2],['W2','e37',43.9,28.4],['W3','e73',18.9,13.1],['W4','e109',5.4,4],['W5','e145',1.7,1.5],['Won','',.9,.7]];
const WOT={1:42.2,2:20.8};
reg('weights',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let hv=1;
  function draw(){const c=frame(svg,360,220,[22,8,30,46],-.5,5.5,0,100);yTicks(svg,c,[0,25,50,75,100],v=>v+'%');axis(svg,c);
    const show=c0.segv('m'),bw=(c.X(1)-c.X(0))*.34;ylab(svg,c,'Story runs reaching the stage');
    keys(svg,c.l+4,12,[{c:YEL,t:'run-weighted',box:1},{c:GRN,t:'player-weighted',box:1}]);
    WF.forEach((w,i)=>{const x=c.X(i);if(i===hv)svgEl('rect',{x:x-bw*1.5,y:c.top,width:bw*3,height:c.bot-c.top,fill:'#fff','fill-opacity':.05},svg);
      svgText(svg,x,c.bot+13,w[0],{'text-anchor':'middle','font-size':10,fill:i<5&&i>0?CW[i]:TXT});
      const bars=show==='both'?[[w[2],YEL,-1],[w[3],GRN,1]]:show==='run'?[[w[2],YEL,0]]:[[w[3],GRN,0]];
      bars.forEach(([v,col,o])=>{const bx=x+o*bw*.55-bw/2,y=c.Y(v);svgEl('rect',{x:bx,y,width:bw,height:c.bot-y,fill:col,'fill-opacity':.85},svg);
        svgText(svg,bx+bw/2,y-3,v<10?v.toFixed(1):Math.round(v),{'text-anchor':'middle','font-size':8.5,fill:col});});
      const h=svgEl('rect',{x:x-bw*1.5,y:c.top,width:bw*3,height:c.bot-c.top,fill:'transparent'},svg);
      h.addEventListener('pointerenter',()=>{hv=i;draw();});h.addEventListener('click',()=>{hv=i;draw();});});
    const w=WF[hv];
    ro.innerHTML=`<b>${w[0]}${w[1]?' ('+w[1]+')':''}</b> · run-weighted ${pc(w[2])} · player-weighted ${pc(w[3])}`+(WOT[hv]?` · without the top 4 players ${pc(WOT[hv])}`:'')+
      `<br>The 4 players with the most runs made 52.7% of story runs.`;}
  c0.seg('m',()=>draw());draw();return {};});

// ======================================================================
// abtest: minimum detectable effect vs runs per player (note 09 arithmetic)
// ======================================================================
const SDW=1258,SDB=500; // within-player and between-player SD of story depth, m
reg('abtest',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);
  const between=R=>4*Math.sqrt(SDB*SDB+SDW*SDW/R)/Math.sqrt(10); // Lehr 16 s²/d², 10 players per arm
  const switchb=R=>Math.sqrt(8)*SDW*Math.sqrt(2/(R/2))/Math.sqrt(10); // paired 8 s²/d², 10 active players, R/2 runs per arm
  function draw(){const R=c0.v('r');c0.out('r',R);const c=frame(svg,360,236,[16,10,30,50],4,80,0,2000);
    yTicks(svg,c,[0,500,1000,1500,2000],v=>v?nf(v):'0');xTicks(svg,c,[4,20,40,60,80]);xlab(svg,c,'Runs per player during the test');ylab(svg,c,'Smallest change it can detect, m');
    [[1333,'one world (1,333 m)'],[333,'a quarter world']].forEach(([m,t2])=>{hline(svg,c,c.Y(m),{stroke:MUTE,'stroke-opacity':.6,'stroke-dasharray':'4 3'});svgText(svg,c.r-2,c.Y(m)-3,t2,{'text-anchor':'end','font-size':9});});
    const bp=[],sp2=[];for(let r=4;r<=80;r++){bp.push([c.X(r),c.Y(Math.min(2000,between(r)))]);sp2.push([c.X(r),c.Y(Math.min(2000,switchb(r)))]);}
    poly(svg,bp,{stroke:RED,'stroke-width':2});poly(svg,sp2,{stroke:GRN,'stroke-width':2});
    const x=c.X(R);svgEl('line',{x1:x,x2:x,y1:c.top,y2:c.bot,stroke:TXT,'stroke-opacity':.4},svg);
    svgEl('circle',{cx:x,cy:c.Y(Math.min(2000,between(R))),r:3.5,fill:RED,stroke:'#0e0c12'},svg);svgEl('circle',{cx:x,cy:c.Y(Math.min(2000,switchb(R))),r:3.5,fill:GRN,stroke:'#0e0c12'},svg);
    keysV(svg,c.X(30),c.top+8,[{c:RED,t:'between players, 10 vs 10'},{c:GRN,t:'switchback, 10 active players'}]);
    ro.innerHTML=`<b>${R} runs per player</b> · between-player split detects ${nf(between(R))} m · per-run switchback detects ${nf(switchb(R))} m (${R/2} runs per arm)`+
      `<br>80% power at two-sided 5%. SD inside a player 1,258 m, between players about 500 m.`;}
  c0.on('r',draw);draw();return {};});
// shared with demos2.js / demos3.js (hero and the card figures)
globalThis.MR={CW,RED,TXT,MUTE,YEL,BLU,GRN,PNK,PUR,ORG,BOSSN,ELN,encName,nf,pc,cap,frame,yTicks,xTicks,ylab,xlab,vline,hline,axis,keys,keysV,vbX,vbY,hover,stepPts,plen,worldBands,slotMarks,REACH,ATT,LOSS};
}
