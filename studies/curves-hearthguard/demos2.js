// ======================================================================
// Hearthguard curve figures, part 2: punish, experiments, ci, director, coop, ladder, retry, leak.
// Block-wrapped so names do not clash with other demos*.js files.
// ======================================================================
{
function frame(svg,W,H,p,x0,x1,y0,y1,xlog){svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML='';
  const f=xlog?Math.log:v=>v,X=v=>p[3]+(f(v)-f(x0))/(f(x1)-f(x0))*(W-p[1]-p[3]),Y=v=>H-p[2]-(v-y0)/(y1-y0)*(H-p[0]-p[2]);
  return {X,Y,W,H,top:p[0],bot:H-p[2],l:p[3],r:W-p[1]};}
const pc=v=>Math.round(v*100)+'%';
const fmtS=s=>s<60?(s<10?s.toFixed(s<2?1:0):Math.round(s))+' s':(s/60).toFixed(s<600?1:0)+' min';

// horizontal range bars on a log axis (shared by punish and retry)
function rangeRows(svg,rows,o){const rowH=o.rowH||26,H=o.top+rows.length*rowH+24,c=frame(svg,360,H,[o.top,12,24,o.left],o.x0,o.x1,0,1,o.log);
  o.ticks.forEach(t=>{svgEl('line',{x1:c.X(t),x2:c.X(t),y1:o.top-4,y2:H-24,class:'gl'},svg);svgText(svg,c.X(t),H-10,o.tf(t),{'text-anchor':'middle','font-size':9.5});});
  rows.forEach((r,i)=>{const y=o.top+i*rowH;if(r.head){svgText(svg,4,y+rowH*.68,r.head,{'font-size':10.5,class:'lab'});return;}
    svgText(svg,o.left-6,y+rowH*.62,r.n,{'text-anchor':'end','font-size':9.5,fill:r.hg?'#ffc870':'#9e94ad'});
    if(r.lo==null){svgText(svg,c.l+4,y+rowH*.62,r.none||'no time lost',{'font-size':9.5,fill:'#9e94ad'});return;}
    const a=c.X(Math.max(o.x0,r.lo)),b=Math.max(a+3,c.X(Math.min(o.x1,r.hi)));
    svgEl('rect',{x:a,y:y+5,width:b-a,height:rowH-10,rx:2,fill:r.hg?'#ffc870':'#8ea8ff','fill-opacity':r.il?.35:.8,stroke:r.il?(r.hg?'#ffc870':'#8ea8ff'):'none','stroke-dasharray':'3 2'},svg);
    const tw=r.lab.length*5,ty=y+rowH*.62;
    if(b+4+tw<=c.r)svgText(svg,b+4,ty,r.lab,{'font-size':9});
    else if(a-4-tw>=c.l)svgText(svg,a-4,ty,r.lab,{'font-size':9,'text-anchor':'end'});
    else svgText(svg,b-3,ty,r.lab,{'font-size':9,'text-anchor':'end',fill:'#0e0c12'});});
  return c;}

// ======================================================================
// punish: Juul's four punishment types, minutes lost
// ======================================================================
reg('punish',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let m='min';
  // lo/hi in minutes; run = run or level length in minutes; il = illustrative
  const R=[{head:'Energy: lose health, move toward losing a life'},
    {n:'Hearthguard hero HP',hg:1,none:'0 min now; level-ups heal 25%'},
    {n:'Hearthguard Hearth HP',hg:1,none:'0 min now; refills only half at camp'},
    {head:'Life: lose a life, move toward game over'},
    {n:'Hearthguard respawn',hg:1,lo:.1,hi:.2,run:[24,27],lab:'6-12 s'},
    {n:'Super Meat Boy death',lo:1/60,hi:1/60,run:[.5,1],il:1,lab:'~1 s'},
    {head:'Game termination: the run ends'},
    {n:'Hearthguard Hearth falls',hg:1,lo:5,hi:27,run:[24,27],lab:'5-27 min'},
    {n:'Hades death',lo:30,hi:45,run:[30,45],lab:'up to 30-45 min'},
    {head:'Setback: replay part of the game'},
    {n:'Celeste screen checkpoint',lo:.1,hi:.5,run:[30,60],il:1,lab:'one screen'},
    {n:'Hearthguard + campfire',hg:1,lo:5,hi:6.5,run:[24,27],il:1,lab:'one chapter (proposal)'}];
  function draw(){if(m==='min')rangeRows(svg,R,{top:8,left:146,x0:.01,x1:60,log:true,ticks:[.01,.1,1,10,60],tf:t=>t<1?Math.round(t*60)+' s':t+' min'});
    else rangeRows(svg,R.map(r=>r.lo==null?r:{...r,lo:Math.max(.002,r.lo/r.run[1]),hi:Math.min(1,r.hi/r.run[0]),lab:pc(r.lo/r.run[1])+(r.hi/r.run[0]>r.lo/r.run[1]*1.3?'-'+pc(Math.min(1,r.hi/r.run[0])):'')}),
      {top:8,left:146,x0:.001,x1:1,log:true,ticks:[.001,.01,.1,1],tf:pc});
    ro.innerHTML=m==='min'?'Minutes of play lost per failure, log scale. Faded bars are illustrative.':'Share of the run or level lost per failure, log scale. Hearthguard\'s Hearth loss can take the whole run.';}
  c0.seg('m',v=>{m=v;draw();});draw();return {};});

// ======================================================================
// experiments: natural experiments as a dot chart
// ======================================================================
reg('experiments',root=>{const svg=$('svg',root),ro=$('[data-ro]',root);
  const CAT=['Player power cut','Enemy cut or tier gap closed','Player power or income up','Retry budget or revive','New opt-in tier or ladder','Enemy buff (too easy)','Control (bugs)'];
  const CS=['Power cut','Enemy cut','Power up','Retry','Opt-in tier','Enemy up','Control'];
  // [cat, reaction -2..2 (author reading), game, when, change, reaction, lesson]
  const E=[[1,1,'Diablo 3','Jun 2012, 1.0.3','Inferno Acts II-IV monster damage and health cut; group damage scaling reduced.','Launch Inferno read as a wall; Blizzard called group scaling "a major barrier".','A spike at the last tier blocks the whole audience.'],
    [1,1,'Diablo 3','Aug 2012, 1.0.4','Elite HP and damage cut, trash HP up, magic and rare drops about 4x.','Accepted as the fix that made Inferno farmable.','Cut damage spikes and pay the player more for the time.'],
    [4,1.5,'Diablo 3','Oct 2012, 1.0.5','Monster Power 1-10, a player-chosen slider.','Well received as a way out of the fixed tier.','A player-steered ladder replaces one fixed top tier.'],
    [4,2,'Diablo 3','Feb 2014, 2.0.1','Normal to Torment I-VI, monster level scales with the character.','Press framed it as the revival.','Let any tier be chosen at any level, with loot scaled to the tier.'],
    [0,-2,'Diablo 4','Jul 2023, 1.1.0','Vulnerable damage cut about 65%, crit nerfs.','Review bombing; devs said they would not do it again.','Cutting the power curve at a season start is felt as theft.'],
    [2,1,'Diablo 4','Aug 2023, 1.1.1','More density, more loot, 3 affixes removed.','Calmed the 1.1.0 backlash.','More enemies read as more power when the mow returns.'],
    [4,0,'Diablo 4','Oct 2024, Season 6','Torment I-IV gated by Pit tier clears.','Big jump at T3 to T4; a reviewer stayed on Normal.','Uneven step sizes create the spike a ladder should hide.'],
    [0,-2,'Helldivers 2','Aug 2024','Difficulty 10 added while fire damage was cut.','671 negative reviews in a day, about 3,000 in three days.','A new top tier plus a power cut doubles the felt jump.'],
    [2,2,'Helldivers 2','Sep 2024','Railgun 60 to 225 damage, enemies lost HP and armor.','Concurrents nearly tripled the next day.','Raising player power brought players back.'],
    [0,-2,'Path of Exile 2','Apr 2025, 0.2.0','Player nerfs plus enemy buffs.','Recent reviews fell to 39%; "both went way too far".','Change one side of the ratio at a time.'],
    [2,2,'Path of Exile 2','Aug 2025, 0.3.0','Broad buffs; the Cruel campaign replay removed.','Described as overwhelmingly positive.','Replaying finished content at a higher multiplier reads as padding.'],
    [3,1,'Path of Exile 2','Jan 2025, 0.1.1','Arbiter of Ash gets 6 attempts, was one life.','Part of a patch called the fix for a boring endgame.','Cut failure cost on the hardest beat with a retry budget.'],
    [3,1,'Elden Ring Nightreign','Jun 2025, 1.01.1','Solo: one revive per night boss on Days 1-2, more runes.','"Makes solo runs viable".','Add a revive and income instead of cutting boss stats.'],
    [4,.5,'Elden Ring Nightreign','Sep 2025, Deep of Night','Ranked mode with 5 depths that move up and down.','Welcomed by the core; overtuning complaints.','Players asked for an exit, not only a climb.'],
    [6,-1,'Risk of Rain 2','Aug 2024, Seekers','Expansion with many bugs; not a curve change.','Reviews to Mixed while concurrents hit a record.','Track sentiment and player counts separately.'],
    [1,.5,'Back 4 Blood','Dec 2021, 1.04','Tiers rebalanced to "decrease the disparity".','Read as easier; Nightmare had been unmanageable.','Close gaps between tiers before adding tiers.'],
    [4,0,'Vermintide 2','Aug 2019, Winds of Magic','Cataclysm above Legend, unlocked by a clear; Weaves mode.','DLC Mostly Negative, aimed at Weaves, not Cataclysm.','A top tier gated by a clear is accepted.'],
    [5,1.5,'Monster Hunter Wilds','Feb-Aug 2025','Monster HP and wound resistance raised; harder Tempered tiers.','Praise for longer hunts.','A curve can fail by being too easy.'],
    [4,-.5,'Aghanim\'s Labyrinth','Aug 2020','Apex Mage tier above Grand Magus.','Fewest games of all tiers, low win rates.','Each new top tier reaches a shrinking fraction.'],
    [2,0,'Kingdom Rush 6','2025, patch 1','Casual +20% gold per enemy; Impossible gated by stage 18.','Mixed: some say too easy, some say uneven.','Tune the easy mode through income, not enemy stats.'],
    [4,1,'Deep Rock Galactic','Season 5','Hazard 5+ modifiers, each one named multiplier.','Adopted by core players as the post-Haz 5 ladder.','Split "harder" into named knobs the host picks.']];
  const c=frame(svg,360,250,[14,8,46,34],-.5,6.5,-2.6,2.6);
  [-2,-1,0,1,2].forEach(v=>{svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(v),y2:c.Y(v),class:v?'gl':'ax'},svg);});
  svgText(svg,c.l-4,c.Y(2)+3,'+',{'text-anchor':'end','font-size':13,fill:'#7fd6a0'});svgText(svg,c.l-4,c.Y(-2)+3,'−',{'text-anchor':'end','font-size':13,fill:'#ff8f7a'});
  svgText(svg,12,c.Y(0),'Player reaction',{transform:`rotate(-90 12 ${c.Y(0)})`,'text-anchor':'middle','font-size':10});
  CS.forEach((t,k)=>{const x=c.X(k),y=c.bot+12;svgText(svg,x,y,t,{'text-anchor':'end','font-size':9.5,transform:`rotate(-35 ${x} ${y})`});});
  const seen={};const dots=E.map((e,i)=>{const key=e[0]+':'+e[1];const n=seen[key]=(seen[key]||0)+1;const x=c.X(e[0])+(n%2?1:-1)*Math.floor(n/2)*11,y=c.Y(e[1]);
    const g=svgEl('g',{class:'dot',tabindex:0,'data-i':i},svg);svgEl('circle',{cx:x,cy:y,r:6,fill:e[1]>.4?'#7fd6a0':e[1]<-.4?'#ff8f7a':'#ffc870','fill-opacity':.85},g);
    svgText(g,x,y+3,i+1,{'text-anchor':'middle','font-size':7.5,fill:'#0e0c12'});return g;});
  const show=i=>{dots.forEach((d,k)=>d.classList.toggle('on',k===i));const e=E[i];
    ro.innerHTML=`<b>#${i+1} ${e[2]}</b> · ${e[3]} · <span class="mute">${CAT[e[0]]}</span><br>Change: ${e[4]}<br>Reaction: ${e[5]}<br>Lesson: ${e[6]}`;};
  const pick=ev=>{const g=ev.target.closest('.dot');if(g)show(+g.dataset.i);};
  svg.addEventListener('click',pick);svg.addEventListener('focusin',pick);svg.addEventListener('pointerover',pick);show(7);return {};});

// ======================================================================
// ci: small samples, Wilson interval and Nielsen's detection curve
// ======================================================================
reg('ci',root=>{const c0=ctl(root),[s1,s2]=$$('svg',root),r1=$('[data-ro="w"]',root),r2=$('[data-ro="n"]',root);
  const wil=(k,n,z=1.96)=>{const p=k/n,d=1+z*z/n,ce=(p+z*z/(2*n))/d,h=z/d*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return [Math.max(0,ce-h),Math.min(1,ce+h)];};
  function w(){const n=c0.v('n'),ke=c0.el('k');ke.max=n;if(+ke.value>n)ke.value=n;const k=c0.v('k');c0.out('n',n);c0.out('k',k);
    const [lo,hi]=wil(k,n);const c=frame(s1,360,92,[18,14,24,14],0,1,0,1);
    for(let v=0;v<=1.001;v+=.2){svgEl('line',{x1:c.X(v),x2:c.X(v),y1:14,y2:c.bot,class:'gl'},s1);svgText(s1,c.X(v),c.bot+14,pc(v),{'text-anchor':'middle','font-size':9.5});}
    [[.2,'#ff8f7a'],[.8,'#7fd6a0']].forEach(([v,col])=>svgEl('line',{x1:c.X(v),x2:c.X(v),y1:14,y2:c.bot,stroke:col,'stroke-dasharray':'3 2','stroke-opacity':.7},s1));
    svgEl('rect',{x:c.X(lo),y:30,width:Math.max(2,c.X(hi)-c.X(lo)),height:20,rx:3,fill:'#8ea8ff','fill-opacity':.45,stroke:'#8ea8ff'},s1);
    svgEl('rect',{x:c.X(k/n)-1.5,y:26,width:3,height:28,fill:'#ffc870'},s1);
    svgText(s1,c.X(k/n),22,`${k}/${n} = ${pc(k/n)}`,{'text-anchor':'middle','font-size':10,fill:'#ffc870'});
    const verdict=hi<.2?'clearly below 20%':lo>.8?'clearly above 80%':lo>.2&&hi<.8?'somewhere in the middle band':'not enough to call';
    r1.innerHTML=`Win rate ${pc(k/n)} · 95% Wilson interval <b>${pc(lo)} to ${pc(hi)}</b> · against the 20%/80% decision bands: ${verdict}`;}
  function nl(){const p=c0.v('p')/100,n=c0.v('m');c0.out('p',c0.v('p')+'%');c0.out('m',n);const c=frame(s2,360,170,[10,12,26,34],1,15,0,1);
    [0,.25,.5,.75,1].forEach(v=>{svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(v),y2:c.Y(v),class:'gl'},s2);svgText(s2,c.l-4,c.Y(v)+3.5,pc(v),{'text-anchor':'end','font-size':9.5});});
    [1,5,10,15].forEach(v=>svgText(s2,c.X(v),c.bot+13,v,{'text-anchor':'middle','font-size':9.5}));
    svgText(s2,(c.l+c.r)/2,c.bot+24,'players in the session',{'text-anchor':'middle','font-size':9.5});
    const cur=(q,att)=>poly(s2,[...Array(15)].map((_,i)=>[c.X(i+1),c.Y(1-Math.pow(1-q,i+1))]),att);
    cur(.31,{stroke:'#9e94ad','stroke-dasharray':'3 2'});svgText(s2,c.X(2.2),c.Y(1-Math.pow(.69,2.2))-6,'p = 31% (Nielsen)',{'font-size':9});
    cur(p,{stroke:'#ffc870','stroke-width':2});const v=1-Math.pow(1-p,n);
    svgEl('circle',{cx:c.X(n),cy:c.Y(v),r:4.5,fill:'#ffc870',stroke:'#0e0c12'},s2);
    r2.innerHTML=`A problem that hits <b>${pc(p)}</b> of players is seen at least once by ${n} player${n>1?'s':''} with probability <b>${(v*100).toFixed(0)}%</b>`;}
  ['n','k'].forEach(k=>c0.on(k,w));['p','m'].forEach(k=>c0.on(k,nl));w();nl();return {};});

// ======================================================================
// director: L4D-style build up, sustain peak, fade, relax
// ======================================================================
reg('director',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root),rng=mkRng(7);
  const PH=['Build up','Sustain peak','Peak fade','Relax'],PC=['#ffc870','#ff8f7a','#8ea8ff','#7fd6a0'],SPEED=3,WIN=150,DT=.25;
  const c=frame(svg,360,214,[10,8,54,30],0,WIN,0,100);
  [0,25,50,75,100].forEach(v=>{svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(v),y2:c.Y(v),class:'gl'},svg);svgText(svg,c.l-4,c.Y(v)+3.5,v,{'text-anchor':'end','font-size':9.5});});
  svgText(svg,12,c.Y(50),'Intensity',{transform:`rotate(-90 12 ${c.Y(50)})`,'text-anchor':'middle','font-size':10});
  const thr=svgEl('line',{x1:c.l,x2:c.r,stroke:'#ff8f7a','stroke-dasharray':'4 3','stroke-opacity':.7},svg);
  const thrT=svgText(svg,c.r-2,0,'peak threshold',{'text-anchor':'end','font-size':9,fill:'#ff8f7a'});
  const thL=poly(svg,[[0,0]],{stroke:'#9e94ad','stroke-opacity':.5,'stroke-width':1});
  const inL=poly(svg,[[0,0]],{stroke:'#ece6f2','stroke-width':1.8});const band=svgEl('g',{},svg);
  const lg=svgEl('g',{},svg),LX=[0,64,150,222];
  PH.forEach((p,k)=>{svgEl('rect',{x:c.l+LX[k],y:c.bot+38,width:9,height:9,fill:PC[k]},lg);svgText(lg,c.l+LX[k]+12,c.bot+46,p,{'font-size':9});});
  const sx=c.l+(c.r-c.l)*60/WIN;svgEl('line',{x1:c.l,x2:sx,y1:c.bot+22,y2:c.bot+22,stroke:'#9e94ad'},svg);svgText(svg,sx+4,c.bot+25,'60 s (shown at 3x speed)',{'font-size':9});
  let ph=0,tin=0,I=5,threat=1,hold=4,hist=[],acc=0,cycles=0,t=0;const tally=[0,0,0,0];
  function step(){const pk=c0.v('pk'),rl=c0.v('rl');tin+=DT;t+=DT;
    if(ph===0){threat=1;if(I>=pk){ph=1;tin=0;hold=3+rng()*2;}}
    else if(ph===1){threat=1;if(tin>=hold){ph=2;tin=0;}}
    else if(ph===2){threat=.1;if(I<pk*.25&&tin>2){ph=3;tin=0;}}
    else{threat=.1;if(tin>=rl){ph=0;tin=0;cycles++;}}
    const dmg=threat*(rng()<.35?rng()*9:0);I=clamp(I+dmg-(ph>=2?2.4:.5)*DT*4,0,100);tally[ph]+=DT;hist.push([I,ph,threat]);if(hist.length>WIN/DT)hist.shift();}
  for(let k=0;k<200;k++)step();
  function draw(){const pk=c0.v('pk');c0.out('pk',pk);c0.out('rl',c0.v('rl')+' s');thr.setAttribute('y1',c.Y(pk));thr.setAttribute('y2',c.Y(pk));thrT.setAttribute('y',c.Y(pk)-4);
    const x=k=>c.l+k*DT/WIN*(c.r-c.l);
    inL.setAttribute('points',hist.map((h,k)=>x(k).toFixed(1)+','+c.Y(h[0]).toFixed(1)).join(' '));
    thL.setAttribute('points',hist.map((h,k)=>x(k).toFixed(1)+','+(c.bot-h[2]*10).toFixed(1)).join(' '));
    band.innerHTML='';let s=0;for(let k=1;k<=hist.length;k++)if(k===hist.length||hist[k][1]!==hist[s][1]){svgEl('rect',{x:x(s),y:c.bot+4,width:Math.max(.5,x(k)-x(s)),height:10,fill:PC[hist[s][1]]},band);s=k;}
    const tot=tally.reduce((a,b)=>a+b,0);
    ro.innerHTML=`<b>${PH[ph]}</b> for ${tin.toFixed(0)} s · intensity ${I.toFixed(0)} · cycles ${cycles} · time share: peak ${pc((tally[1])/tot)}, relax ${pc(tally[3]/tot)} · ${SPEED}x speed`;}
  draw();c0.on('pk',draw);c0.on('rl',draw);
  return {tick(dt){if(!motion){draw();return;}acc+=dt*SPEED;while(acc>=DT){acc-=DT;step();}draw();}};});

// ======================================================================
// coop: enemy multiplier per player count
// ======================================================================
reg('coop',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);
  const S=[{n:'Diablo II 1.10 monster HP',f:n=>(n+1)/2,col:'#8ea8ff',w:'(n+1)/2: shared HP, grows half a solo per player'},
    {n:'Dungeon Defenders II enemy HP',f:n=>1+.25*(n-1),col:'#7fd6a0',w:'+25% per player, after a fix cut it from +50%'},
    {n:'Deep Rock Galactic Haz 5 count',f:n=>[.85,.85,1.25,1.5][n-1],col:'#c9a2ff',w:'enemy count, not HP: 0.85 / 0.85 / 1.25 / 1.50'},
    {n:'Hearthguard boss HP',f:n=>1+.75*(n-1),col:'#ff8f7a',w:'+75% per player, for a boss that sits in one random lane',hg:1},
    {n:'Hearthguard Hearth per corridor',f:n=>(1+.5*(n-1))/n,col:'#ffc870',w:'+50% Hearth per player, split across n corridors that drain it',hg:1}];
  function draw(){const n=c0.v('n');c0.out('n',n);const c=frame(svg,360,200,[10,10,24,30],1,4,0,3.4);
    [0,1,2,3].forEach(v=>{svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(v),y2:c.Y(v),class:v===1?'ax':'gl'},svg);svgText(svg,c.l-4,c.Y(v)+3.5,v+'x',{'text-anchor':'end','font-size':9.5});});
    [1,2,3,4].forEach(v=>svgText(svg,c.X(v),c.bot+14,v+(v===1?' player':''),{'text-anchor':'middle','font-size':9.5,fill:v===n?'#ffc870':'#9e94ad'}));
    svgEl('rect',{x:c.X(3),y:c.top,width:c.X(4)-c.X(3),height:c.bot-c.top,fill:'#fff','fill-opacity':.03},svg);svgText(svg,c.X(3.5),c.top+10,'Hearthguard caps at 3',{'text-anchor':'middle','font-size':8.5});
    svgEl('line',{x1:c.X(n),x2:c.X(n),y1:c.top,y2:c.bot,stroke:'#ece6f2','stroke-opacity':.3},svg);
    S.forEach(s=>{const m=s.hg?3:4;poly(svg,[...Array(m)].map((_,i)=>[c.X(i+1),c.Y(s.f(i+1))]),{stroke:s.col,'stroke-width':2});
      if(!(s.hg&&n>3))svgEl('circle',{cx:c.X(n),cy:c.Y(s.f(n)),r:3.5,fill:s.col,stroke:'#0e0c12'},svg);});
    ro.innerHTML=S.map(s=>`<span style="color:${s.col}">■</span> ${s.n}: <b>${s.hg&&n>3?'n/a':s.f(n).toFixed(2)+'x'}</b> <span class="mute">${s.w}</span>`).join('<br>');}
  c0.on('n',draw);draw();return {};});

// ======================================================================
// ladder: opt-in difficulty rungs, unlocked one clear at a time
// ======================================================================
reg('ladder',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let open=1,sel=['hg',0];
  const HG=[['Embers 0','Today\'s game, the base tier everything else is tuned against.'],['Embers 1','The dark arrives in chapter 3 instead of chapter 4.'],['Embers 2','Every chapter gets a second Horde in wave 2.'],
    ['Embers 3','Hearth starts at 75% of its HP.'],['Embers 4','The campfire refills a quarter of the Hearth instead of half.'],['Embers 5','Bosses enrage at 120 s instead of 150 s.']];
  const KR=[['Casual','Enemies have 80% HP.'],['Normal','Enemies have 100% HP.'],['Veteran','Enemies have 120% HP.'],['Impossible','Added in Kingdom Rush: Vengeance (2018); later games gate it behind campaign progress.']];
  function draw(){svg.setAttribute('viewBox','0 0 360 250');svg.innerHTML='';
    const col=(x,t,sub)=>{svgText(svg,x,14,t,{'text-anchor':'middle','font-size':10.5,class:'lab'});svgText(svg,x,26,sub,{'text-anchor':'middle','font-size':8.5});};
    col(62,'Hearthguard (proposal)','unlock on a clear');col(180,'Kingdom Rush 1','HP bands, pick any');col(298,'Slay the Spire','20 Ascension levels');
    const rung=(g,i,x,y,w,h,label,locked,on)=>{const e=svgEl('g',{class:'dot',tabindex:0,'data-g':g,'data-i':i},svg);
      svgEl('rect',{x,y,width:w,height:h,rx:3,fill:locked?'#16131b':on?'#2a2030':'#1d1924',stroke:on?'#ffc870':locked?'#2e2838':'#463c55','stroke-dasharray':locked?'3 2':''},e);
      if(label)svgText(e,x+w/2,y+h/2+3.5,label,{'text-anchor':'middle','font-size':9.5,fill:locked?'#5a4d6a':'#ece6f2'});};
    HG.forEach((r,i)=>rung('hg',i,12,226-(i+1)*33,100,28,r[0]+(i>=open?' · locked':''),i>=open,sel[0]==='hg'&&sel[1]===i));
    KR.forEach((r,i)=>rung('kr',i,130,226-(i+1)*44,100,38,r[0]+(i<3?' '+[80,100,120][i]+'%':''),false,sel[0]==='kr'&&sel[1]===i));
    for(let i=0;i<=20;i++)rung('ss',i,250,226-(i+1)*9,96,7,'',false,sel[0]==='ss'&&sel[1]===i);
    svgText(svg,298,240,'A0 to A20',{'text-anchor':'middle','font-size':8.5});svgText(svg,62,240,`${open} of 6 open`,{'text-anchor':'middle','font-size':8.5,fill:'#ffc870'});
    show();}
  function show(){const [g,i]=sel;
    if(g==='hg')ro.innerHTML=`<b>${HG[i][0]}</b>${i>=open?' · locked until you clear '+HG[i-1][0]:''} · ${HG[i][1]} · illustrative, each rung adds one modifier the game already has`;
    else if(g==='kr')ro.innerHTML=`<b>Kingdom Rush · ${KR[i][0]}</b> · ${KR[i][1]} One set of stars per stage at any difficulty.`;
    else ro.innerHTML=`<b>Slay the Spire · Ascension ${i}</b> · ${i===0?'base game, which Mega Crit balanced first':'unlocks after a win on Ascension '+(i-1)+'; each level stacks on the ones below'}.`;}
  svg.addEventListener('click',e=>{const r=e.target.closest('.dot');if(r){sel=[r.dataset.g,+r.dataset.i];draw();}});
  svg.addEventListener('keydown',e=>{if(e.key==='Enter'){const r=e.target.closest('.dot');if(r){sel=[r.dataset.g,+r.dataset.i];draw();}}});
  c0.btn('win',()=>{if(open<6){open++;sel=['hg',open-1];}draw();});c0.btn('reset',()=>{open=1;sel=['hg',0];draw();});
  draw();return {};});

// ======================================================================
// retry: seconds of play lost per failure, campfire checkpoint toggle
// ======================================================================
reg('retry',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);
  function draw(){const cp=c0.v('cp');
    const R=[{n:'Super Meat Boy',lo:1,hi:1,lab:'~1 s to control'},{n:'Celeste screen',lo:5,hi:30,il:1,lab:'one screen'},
      {n:'Hearthguard respawn',hg:1,lo:6,hi:12,lab:'6-12 s respawn'},{n:'Hades death',lo:1800,hi:2700,lab:'run, 30-45 min'},
      cp?{n:'Hearthguard Hearth loss',hg:1,lo:300,hi:390,il:1,lab:'one chapter, 5-6.5 min'}:{n:'Hearthguard Hearth loss',hg:1,lo:287,hi:1622,lab:'4:47 to 27 min'}];
    rangeRows(svg,R,{top:8,left:140,rowH:30,x0:.5,x1:4000,log:true,ticks:[1,10,60,600,3600],tf:t=>t<60?t+' s':t/60+' min'});
    ro.innerHTML=cp?'With a campfire checkpoint, a Hearth loss sends the team back to the start of the chapter. The worst case drops from about <b>27 min</b> to about <b>5-6.5 min</b>.':
      'Today a Hearth loss restarts chapter 1. P1 lost at 4:47; the bots lost at up to 27 min. Every retry replays chapter 1 first.';}
  c0.on('cp',draw);draw();return {};});

// ======================================================================
// leak: instant Hearth damage vs a recoverable carry-back
// ======================================================================
reg('leak',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root),rng=mkRng(11);
  svg.setAttribute('viewBox','0 0 360 130');let mode='carry';
  const PX0=26,HX=320,Z0=110,Z1=250,CH=5;// chunk = 5% of Hearth (illustrative)
  svgEl('rect',{x:PX0,y:52,width:HX-PX0,height:26,fill:'#1d1924'},svg);
  svgEl('rect',{x:Z0,y:52,width:Z1-Z0,height:26,fill:'#8ea8ff','fill-opacity':.1},svg);svgText(svg,(Z0+Z1)/2,48,'hero covers this stretch',{'text-anchor':'middle','font-size':9,fill:'#8ea8ff'});
  svgEl('circle',{cx:PX0-8,cy:65,r:12,fill:'#c9a2ff','fill-opacity':.35,stroke:'#c9a2ff'},svg);svgText(svg,PX0-8,96,'portal',{'text-anchor':'middle','font-size':9});
  svgEl('rect',{x:HX,y:47,width:26,height:36,rx:3,fill:'#3a2a1a',stroke:'#ffc870'},svg);svgText(svg,HX+13,96,'Hearth',{'text-anchor':'middle','font-size':9});
  const bar=svgEl('rect',{x:HX+3,y:50,width:20,height:30,fill:'#ffc870'},svg);
  const layer=svgEl('g',{},svg);const hud=svgText(svg,8,122,'',{'font-size':9.5,class:'lab'});
  let mobs=[],spawn=0,hp=100,lost=0,won=0,esc=0,leaks=0;
  const reset=()=>{mobs=[];hp=100;lost=0;won=0;esc=0;leaks=0;};
  function step(dt){spawn-=dt;if(spawn<=0){spawn=.9+rng()*.8;mobs.push({x:PX0,dir:1,y:58+rng()*14});}
    for(const m of mobs){m.x+=m.dir*(m.dir>0?44:34)*dt;
      if(m.x>Z0&&m.x<Z1&&rng()<(m.dir>0?.45:.45)*dt){if(m.dir<0){hp=Math.min(100,hp+CH);won++;}m.dead=1;continue;}
      if(m.dir>0&&m.x>=HX){leaks++;hp-=CH;if(mode==='carry'){m.dir=-1;m.carry=1;}else{lost+=CH;m.dead=1;}}
      else if(m.dir<0&&m.x<=PX0){esc++;lost+=CH;m.dead=1;}}
    mobs=mobs.filter(m=>!m.dead);if(hp<=0)reset();}
  function draw(){layer.innerHTML='';for(const m of mobs){svgEl('circle',{cx:m.x,cy:m.y,r:m.carry?4.5:3.5,fill:m.carry?'#ffc870':'#ff8f7a',stroke:m.carry?'#ff8f7a':'none','stroke-width':1.5},layer);}
    const h=Math.max(0,hp)/100;bar.setAttribute('height',30*h);bar.setAttribute('y',50+30*(1-h));
    hud.textContent=`Hearth ${Math.round(hp)}% · leaks ${leaks}`;
    const tries=won+esc;ro.innerHTML=mode==='carry'?`Hearth HP lost for good: <b>${lost}%</b> · carriers caught ${won}, escaped ${esc} · chance to win it back: <b>${tries?pc(won/tries):'n/a'}</b>`:
      `Hearth HP lost for good: <b>${lost}%</b> · every leak is permanent until the campfire returns half · chance to win it back: <b>0%</b>`;}
  for(let k=0;k<600;k++)step(1/20);draw();
  c0.seg('m',v=>{mode=v;reset();draw();});c0.btn('reset',()=>{reset();draw();});
  return {tick(dt){if(motion)step(dt);draw();}};});
}
