// ======================================================================
// MatchRPG curve figures, part 3: experiments, walls, mercy, ladder.
// Shared helpers and telemetry tables come from demos1.js through globalThis.MR.
// Telemetry numbers are aggregates from notes/telemetry-aggregates.json; constants
// from notes/01-current-build.md; twin numbers from notes 04, 05 and 06.
// Block-wrapped so names do not clash with other demos*.js files.
// ======================================================================
{
const DARK='#0e0c12';
// .chart text sets font-size in CSS, which beats the attribute, so move font-size into an inline style
const tx=(p,x,y,t,a={})=>{const fs=a['font-size'];if(fs!=null){a={...a};delete a['font-size'];a.style='font-size:'+fs+'px'+(a.style?';'+a.style:'');}return svgText(p,x,y,t,a);};
// legend row like demos1 keys(), at a set font size: items {c,t,dash,dot,box}
function keyz(svg,x,y,items,fs=8.6){const cw=fs*.52;for(const it of items){
  if(it.box)svgEl('rect',{x,y:y-7,width:8,height:8,fill:it.c,'fill-opacity':.85},svg);
  else if(it.dot)svgEl('circle',{cx:x+4,cy:y-3,r:3,fill:it.c},svg);
  else svgEl('line',{x1:x,x2:x+12,y1:y-3,y2:y-3,stroke:it.c,'stroke-width':2,'stroke-dasharray':it.dash||''},svg);
  const o=it.box||it.dot?11:15;tx(svg,x+o,y,it.t,{'font-size':fs,fill:it.c});x+=o+it.t.length*cw+9;}}

// ======================================================================
// experiments: the §9 natural experiments table, by scope area and reaction
// ======================================================================
// The §9 rows of report.md, copied verbatim. Keep in sync with the report.
const EXP_MD=[
  "| 1 | Crash Bandicoot 2 and N. Sane Trilogy | 1997; remaster Jun 2017 | A mask after about 6 deaths in a section, checkpoint crates after about 6 more; the remaster adds it to the first game | Rarely noticed; the remaster was called hard for other reasons | E2 [V, E2, S58] | Failure-count help with a cap works quietly, but cannot fix a feel problem |",
  "| 2 | Resident Evil 4 | 2005; exposed Jun 2015 | A hidden rank eases enemies when the player struggles, never announced | Press called it secret adjustment; reaction was curiosity, not anger | E3 [V, E3, S57] | Hidden help that only aids a struggling player is forgiven when found |",
  "| 3 | Candy Crush Saga | 2012, eased later | Level 65 shipped as a hard finale, then eased using attempt data | Highest-converting level and biggest churn point; players enjoy the eased version more | E2 [V, E2, S47, S48] | A wall converts payers and loses everyone else; with no store, MatchRPG only gets the churn |",
  "| 4 | Flappy Bird | Feb 2014 | No change; flat difficulty from the first pipe and an instant retry; pulled | Its designer called it \"an addictive product\" | E2 [V, E2, S60] | The control case; a flat curve with a 1 s retry is compulsive on its own |",
  "| 5 | Gems of War | Oct 2015, 1.0.7 | Gem falls, shifts and matches sped up; spells kept their old speed | Split; some could not follow cascades and asked for a toggle | E3 [V, E3, S53] | Board tempo is limited by how fast players can read a cascade |",
  "| 6 | Marvel Puzzle Quest | Mar 2016; May 2017 | Public tests of roster-based scaling; then scaling tied to clearance level | Players said they would drop clearance to keep clears short | E3 [V, E3, S51, S52] | Scaling that rises with progress invites sandbagging |",
  "| 7 | Hearthstone | Apr 2020 | Five leagues with rank floors and a star bonus from last season | About 9-10x as many Legend players in the first month; confounded by an expansion | E1 [V, E1, S64, S65] | Floors and a fast climb make a ladder feel safe |",
  "| 8 | Dead Cells | May to Jul 2020, Update 19 | Boss Cell 0 harder, 1-3 easier, density and damage down, a free amulet per tier | Press said it \"smoothed out its difficulty curve\"; stated aim \"without the big walls\" | E2 [V, E2, S39, S40] | Make step 1 harder so step 2 is not a wall |",
  "| 9 | Rogue Legacy 2 | 2021 to v1.2.1 | House Rules sliders for enemy HP and damage; the HP floor lowered from 50% to 25% | Praised as accessibility that also lets players raise the challenge | E3 [V, E3, S41] | Named, visible sliders with no penalty are welcomed |",
  "| 10 | Luck be a Landlord | Early Access, date not found | Forced higher rent moved out of the base game into opt-in floors | The developer cited feedback that forced rent was less fun | E2 [V, E2, S37] | Raise post-win difficulty by opt-in, never by raising the base |",
  "| 11 | Classic Tetris World Championship | Oct 2023 | A level 39 \"super killscreen\" at twice level 29's speed | Accepted as the way to end marathons | E3 [V, E3, S61] | A top speed is an end only until skill beats it |",
  "| 12 | Unnamed freemium puzzle game | Field test, paper 2023-2025 | Difficulty lowered for players predicted to churn, against a random holdout, over 300,000 players | Retention and engagement up; revenue figures only secondhand | E1 [V, E1, S82] | Easing the curve for at-risk players pays in who stays |",
  "| 13 | Candy Crush Saga | Mar 2024 | Fun measured by time to pass plus time to abandon; the 100 least fun levels rebuilt | A \"very significant uplift\" in engagement, no number given | E2 [V, E2, S47] | Measure abandonment, and keep hard beats short |",
  "| 14 | Balatro | Apr 2024, 1.0.1f | Middle antes lowered, late antes raised on harder stakes | Press said it \"should make winning easier\"; exact numbers conflict across sources | E3 [V, E3, S29] | Smooth the stall step and keep the end hard |",
  "| 15 | Peglin | 2024, 1.0 and v1.0.6 | Cruciball 17-20 added; v1.0.6 limited step 19's extra enemies | Step 19 was walked back within patches | E2 [V, E2, S32] | Cap the worst random combination of modifiers |",
  "| 16 | MatchRPG (ours) | 28 Oct 2026, v0.6.6 | `COMBO_STEP` 0.875 to 0.7, cascade multiplier −9% at ×2 to −16% at ×5 | Lab saw no change past noise; the live window also had a potion buff and 6 players | E1 [K, E1, S3, S4] | Ship one change per build, or the data cannot tell them apart |",
  "| 17 | MatchRPG (ours) | 29 Oct 2026, v0.7 | Ogre King loses 15% HP per loss to 60%; a Health potion at the first elite hit | Ogre King win rate 89.7% on v0.6 and 87.0% on v0.7, with a different player mix; median 3 attempts | E1 [K, E1, S3, S4] | Mercy at the small wall does not reach the big one |",
  "| 18 | MatchRPG (ours) | 4-5 Nov 2026, v0.7.4 to v0.7.8 | The chain survives world bosses, chain stops removed, the chain clock waits on the board | Lab median best chain 40-48 to 57-77; the live window's world 1 boss win rate 71.1% at a median lifetime run of 90 | E1 [K, E1, S3, S4] | Raw version windows measure who was playing |",
  "| 19 | MatchRPG (ours) | 5 Nov 2026, v0.7.9 | A run's XP past its first level counts a third, never told | Aimed at the 8% of v0.7 runs that brought 2-3 levels; effect not separable in the window | E1 [K, E1, S3, S4] | A hidden cut aimed at good players should at least be shown |",
  "| 20 | MatchRPG (ours) | 7 Nov 2026, v0.7.12 and v0.7.13 | Gold and diamond lines +0.02 moves/s; the Sleeper's warp warning 1.5 s to 0.8 s; disarming 1 s to 0.5 s | 2 players moved from diamond to gold; dark deaths at start level 21+ rose 20% to 36% on 22 runs and 3 players | E1 [K, E1, S3, S4] | A flag for the next data pull; restore the warning first |"];
// Our filing of each row (by #): w walls and mercy, b board pressure, l learning and tiers, e endless and ladders
const EXP_AREA={1:'w',2:'w',3:'w',4:'b',5:'b',6:'l',7:'l',8:'e',9:'l',10:'e',11:'e',12:'w',13:'w',14:'e',15:'e',16:'b',17:'w',18:'b',19:'l',20:'l'};
// Our reading of the Reaction column: -1 worse or split, 0 no clear effect, 1 accepted, 2 clear gain
const EXP_REACT={1:0,2:0,3:-1,4:0,5:-1,6:-1,7:2,8:1,9:2,10:1,11:1,12:2,13:2,14:1,15:-1,16:0,17:0,18:0,19:0,20:-1};
function expRows(){return EXP_MD.map(line=>{const c=line.replace(/^\|\s*|\s*\|\s*$/g,'').split(/\s*\|\s*/);
  const n=+c[0];return {n,game:c[1],when:c[2],change:c[3],reaction:c[4],gradeCell:c[5],grade:(c[5].match(/E\d/)||['E4'])[0],lesson:c[6],
    area:EXP_AREA[n]||'w',react:EXP_REACT[n]??0,ours:/MatchRPG/.test(c[1])};});}

reg('experiments',root=>{const {GRN,BLU,YEL,MUTE,TXT}=MR;const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root),list=$('[data-list]',root);
  const R=expRows();
  // sync guard: warn if the rendered §9 table has drifted from the embedded rows
  const tb=[...document.querySelectorAll('table')].find(t=>/Lesson/.test(t.tHead?t.tHead.textContent:'')&&/Reaction/.test(t.tHead?t.tHead.textContent:''));
  if(tb){const games=[...tb.tBodies[0].rows].map(r=>r.cells[1]&&r.cells[1].textContent.trim());
    if(games.length!==R.length||games.some((g,i)=>g!==R[i].game))console.warn('experiments: embedded rows differ from the report table');}
  const AREAS=[['w','Walls, mercy'],['b','Board pressure'],['l','Learning, tiers'],['e','Endless, ladders']];
  const AREA_LONG={w:'walls and mercy',b:'board pressure',l:'learning and tiers',e:'endless and ladders'};
  const RX=[[-1,'worse or split'],[0,'no clear effect'],[1,'accepted'],[2,'clear gain']],RX2=[['worse','or split'],['no clear','effect'],['accepted',''],['clear','gain']];
  const GC={E1:GRN,E2:BLU,E3:YEL,E4:MUTE};
  let fa='all',fg='all',sel=17;
  const match=r=>(fa==='all'||r.area===fa)&&(fg==='all'||r.grade===fg);
  const L=102,Rr=356,T=30,LH=40,colW=(Rr-L)/4;
  function draw(){svg.setAttribute('viewBox','0 0 360 236');svg.innerHTML='';
    keyz(svg,4,12,[{c:GRN,t:'E1 data',dot:1},{c:BLU,t:'E2 designer',dot:1},{c:YEL,t:'E3 community',dot:1}],10);
    svgEl('rect',{x:280,y:4,width:9,height:9,fill:'none',stroke:TXT},svg);tx(svg,293,12,'MatchRPG',{'font-size':10});
    RX.forEach((x,i)=>{const cx=L+colW*(i+.5);
      if(i)svgEl('line',{x1:L+colW*i,x2:L+colW*i,y1:T-4,y2:T+LH*4,class:'gl'},svg);
      tx(svg,cx,T+LH*4+13,RX2[i][0],{'text-anchor':'middle','font-size':10});tx(svg,cx,T+LH*4+25,RX2[i][1],{'text-anchor':'middle','font-size':10});});
    tx(svg,(L+Rr)/2,T+LH*4+40,'Reaction, our reading →',{'text-anchor':'middle','font-size':10.5});
    AREAS.forEach((a,k)=>{const y=T+k*LH,on=fa===a[0];
      svgEl('rect',{x:L,y,width:Rr-L,height:LH,fill:'#fff','fill-opacity':on?.07:k%2?.025:0},svg);
      tx(svg,L-6,y+LH/2+3.5,a[1],{'text-anchor':'end','font-size':10.5,class:on?'lab':''});});
    svgEl('line',{x1:L,x2:Rr,y1:T+LH*4,y2:T+LH*4,class:'ax'},svg);
    // place dots: within each cell, side by side, wrapping to a second row if needed
    const cells={};R.forEach(r=>{const k=r.area+r.react;(cells[k]=cells[k]||[]).push(r);});
    for(const k in cells){const rs=cells[k],ai=AREAS.findIndex(a=>a[0]===rs[0].area),ci=rs[0].react+1;
      const per=3,sp=16.5;rs.forEach((r,j)=>{const row=Math.floor(j/per),inRow=Math.min(per,rs.length-row*per),col=j%per;
        const x=L+colW*(ci+.5)+(col-(inRow-1)/2)*sp,y=T+ai*LH+LH/2+(rs.length>per?(row-.5)*15:0);
        const m=match(r),s=r.n===sel;
        const g=svgEl('g',{class:'dot'+(s?' on':''),tabindex:0,role:'button','aria-label':`Row ${r.n}, ${r.game}`,'data-n':r.n,opacity:m?1:.18},svg);
        if(r.ours)svgEl('rect',{x:x-6.6,y:y-6.6,width:13.2,height:13.2,rx:1.5,fill:GC[r.grade],stroke:s?'#fff':DARK,'stroke-width':s?2:1},g);
        else svgEl('circle',{cx:x,cy:y,r:7.2,fill:GC[r.grade],stroke:s?'#fff':DARK,'stroke-width':s?2:1},g);
        tx(g,x,y+3,r.n,{'text-anchor':'middle','font-size':8.4,fill:DARK,'font-weight':600,'pointer-events':'none'});});}
    list.innerHTML='';R.filter(match).forEach(r=>{const b=document.createElement('button');b.type='button';b.dataset.n=r.n;b.style.cssText='font-size:12px;padding:2px 7px';
      const short=r.game.replace(/ \(ours\)| and N\. Sane Trilogy|Unnamed | World Championship/g,'');b.title=r.game;
      b.innerHTML=`<span style="color:${GC[r.grade]}">#${r.n}</span> ${short}`;if(r.n===sel)b.style.borderColor='#ffc870';list.appendChild(b);});
    show();}
  function show(){const r=R.find(x=>x.n===sel),cnt=R.filter(match).length;
    ro.innerHTML=`<b>#${r.n} ${r.game}</b> · ${r.when} · ${r.gradeCell} · filed under ${AREA_LONG[r.area]} · reaction read as "${RX[r.react+1][1]}"`+
      `<br>Change: ${r.change}<br>Reaction: ${r.reaction}<br>Lesson: <b>${r.lesson}</b><br><span class="mute">${cnt} of ${R.length} rows match the filter</span>`;}
  function pick(n){sel=n;draw();}
  function refilter(){const m=R.filter(match);if(m.length&&!m.some(r=>r.n===sel))sel=m[0].n;draw();}
  svg.addEventListener('click',e=>{const g=e.target.closest('.dot');if(g)pick(+g.dataset.n);});
  svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const g=e.target.closest('.dot');if(g){e.preventDefault();pick(+g.dataset.n);}}});
  list.addEventListener('click',e=>{const b=e.target.closest('button');if(b)pick(+b.dataset.n);});
  c0.seg('area',v=>{fa=v;refilter();});c0.seg('grade',v=>{fg=v;refilter();});
  draw();return {};});

// ======================================================================
// walls: King's hard-then-lighter rhythm vs MatchRPG's measured hazard, with the A2 landing
// ======================================================================
reg('walls',root=>{const {frame,yTicks,vbX,encName,pc,LOSS,ATT,RED,BLU,GRN,YEL,MUTE,TXT,CW}=MR;
  const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);
  const NB=[23.4,27.66,31.6,32.5,33.2]; // world roster average HP before depth power (note 01, as in demos1 stairs)
  // q5_board_pressure.per_fight: median and p75 seconds to kill at each wall of W1 and W2
  const FS={12:[8.3,12.1],24:[7.9,11.9],36:[37.8,46.7],48:[7.3,10.2],60:[7.8,11.3],72:[33.2,43.4]};
  const NAMES={12:'Ogre King',24:'Broodmother',36:'Old Mossback',48:'Lich',60:'Orc Warlord',72:'The Warden'};
  const N=72;let land=0,hov=13,cH=null;
  const step=(n,Lg)=>{let s=Math.floor(n/12);const m=n%12;if(Lg&&n>12&&m>=1&&m<=Lg)s-=1;return s;};
  const dp=(n,Lg)=>1+.45*step(n,Lg);
  const wall=n=>n%12===0;
  const nhp=(n,Lg)=>NB[Math.floor((n-1)/36)]*dp(n,Lg);
  // King schematic: [difficulty 0-1, relative length]; hard levels short, a lighter level after each
  const KING=[];for(let i=0;i<26;i++){const hard=[5,11,18,23].includes(i),after=[6,12,19,24].includes(i);
    KING.push(hard?[.95,.55]:after?[.18,1]:[.36+.16*((i*7)%5)/4,1]);}
  function draw(){svg.setAttribute('viewBox','0 0 360 318');svg.innerHTML='';
    const L=42,Rr=352;
    // --- strip 1: King schematic
    tx(svg,4,12,'King: hard levels short, a lighter level after',{'font-size':10,class:'lab'});
    tx(svg,Rr,12,'schematic',{'font-size':10,'text-anchor':'end',fill:BLU});
    const kt=22,kb=70,tot=KING.reduce((a,k)=>a+k[1],0);let x=L;
    svgEl('line',{x1:L,x2:Rr,y1:kb,y2:kb,class:'ax'},svg);
    KING.forEach((k,i)=>{const w=(Rr-L)*k[1]/tot,h=(kb-kt)*k[0],hard=k[0]>.9,light=k[0]<.2;
      svgEl('rect',{x:x+.6,y:kb-h,width:w-1.2,height:h,rx:1,fill:hard?RED:light?GRN:MUTE,'fill-opacity':hard?.85:light?.75:.45},svg);x+=w;});
    tx(svg,L-4,kt+8,'harder',{'font-size':10,'text-anchor':'end'});tx(svg,L-4,kb,'easier',{'font-size':10,'text-anchor':'end'});
    tx(svg,(L+Rr)/2,kb+11,'levels in order; width is level length',{'font-size':10,'text-anchor':'middle'});
    // --- strip 2: MatchRPG hazard per encounter, log scale
    tx(svg,4,104,'MatchRPG: runs ending per attempt, first 72 encounters',{'font-size':10,class:'lab'});
    const c=frame({setAttribute(){},set innerHTML(v){}},360,318,[128,8,318-212,L],.5,N+.5,.1,60,{ylog:true});
    cH=c;
    for(let k=0;k<2;k++){const a=c.X(k*36+.5),b=c.X(k*36+36.5);if(k)svgEl('rect',{x:a,y:c.top,width:b-a,height:c.bot-c.top,fill:'#fff','fill-opacity':.035},svg);
      tx(svg,(a+b)/2,c.bot+11,'W'+(k+1),{'text-anchor':'middle','font-size':10,fill:CW[k]});}
    yTicks(svg,c,[.1,1,10],v=>v+'%');
    if(land)for(let n=13;n<=N;n++)if(n%12>=1&&n%12<=land){const a=c.X(n-.5);svgEl('rect',{x:a,y:c.top,width:c.X(n+.5)-a,height:c.bot-c.top,fill:GRN,'fill-opacity':.12},svg);}
    const bw=(c.X(2)-c.X(1))*.78;
    for(let n=1;n<=N;n++){const v=LOSS[n-1],p=n%36===0,e=wall(n)&&!p,col=p?RED:e?BLU:MUTE;
      const y=v>0?c.Y(Math.max(.1,v)):c.bot-1.5;
      svgEl('rect',{x:c.X(n)-bw/2,y,width:bw,height:Math.max(1.5,c.bot-y),fill:col,'fill-opacity':n===hov?1:p||e?.85:.55},svg);
      if(FS[n]){tx(svg,c.X(n),y-4,Math.round(FS[n][0])+' s',{'text-anchor':n===N?'end':'middle','font-size':10,fill:col});}}
    svgEl('line',{x1:c.l,x2:c.r,y1:c.bot,y2:c.bot,class:'ax'},svg);
    svgEl('line',{x1:c.X(hov),x2:c.X(hov),y1:c.top,y2:c.bot,stroke:TXT,'stroke-opacity':.3},svg);
    keyz(svg,L,123,[{c:MUTE,t:'normal',box:1},{c:BLU,t:'elite',box:1},{c:RED,t:'boss',box:1}]);
    tx(svg,Rr,123,'label = median s to kill',{'font-size':10,'text-anchor':'end'});
    // --- strip 3: normal enemy HP, today vs landing
    tx(svg,4,236,'Normal enemy HP (roster average × depth power)',{'font-size':10,class:'lab'});
    const h=frame({setAttribute(){},set innerHTML(v){}},360,318,[244,8,318-298,L],.5,N+.5,0,100);
    yTicks(svg,h,[0,50,100]);
    if(land)for(let n=13;n<=N;n++)if(n%12>=1&&n%12<=land){const a=h.X(n-.5);svgEl('rect',{x:a,y:h.top,width:h.X(n+.5)-a,height:h.bot-h.top,fill:GRN,'fill-opacity':.12},svg);}
    const seg=Lg=>{const pts=[];for(let n=1;n<=N;n++){if(wall(n)){pts.push(null);continue;}const y=h.Y(nhp(n,Lg));pts.push([h.X(n-.5),y],[h.X(n+.5),y]);}
      const out=[];let cur=[];pts.forEach(p=>{if(p)cur.push(p);else{if(cur.length)out.push(cur);cur=[];}});if(cur.length)out.push(cur);return out;};
    seg(0).forEach(p=>poly(svg,p,{stroke:land?MUTE:YEL,'stroke-width':land?1.2:2,'stroke-dasharray':land?'3 2':''}));
    if(land)seg(land).forEach(p=>poly(svg,p,{stroke:GRN,'stroke-width':2}));
    svgEl('line',{x1:h.X(hov),x2:h.X(hov),y1:h.top,y2:h.bot,stroke:TXT,'stroke-opacity':.3},svg);
    [12,24,36,48,60,72].forEach(n=>tx(svg,h.X(n),h.bot+11,n,{'text-anchor':'middle','font-size':10}));
    keyz(svg,L+6,h.top+8,land?[{c:MUTE,t:'today',dash:'3 2'},{c:GRN,t:'LANDING 3 (proposal)'}]:[{c:YEL,t:'today, step lands on the elite'}]);
    show();}
  function show(){const n=hov,v=LOSS[n-1],a=ATT[n-1];
    let s=`<b>${encName(n)}</b> · ${pc(v)} of ${a} attempts ended the run`;
    if(FS[n])s+=` · ${NAMES[n]} fight median ${FS[n][0]} s, p75 ${FS[n][1]} s`;
    if(wall(n))s+=n%36===0?'<br>Boss HP is fixed, so the landing does not change this slot.':'<br>Elite slot. The depth step lands here today.';
    else{const t=nhp(n,0),p=nhp(n,land||3);s+=`<br>Normal enemy HP ${Math.round(t)} today`+(Math.abs(t-p)>.1?` · ${Math.round(p)} with LANDING 3 (proposal)`:' · same with LANDING 3');}
    ro.innerHTML=s;}
  const pick=e=>{if(!cH)return;const x=vbX(svg,e);if(x<cH.l-4||x>cH.r+4)return;const n=clamp(Math.round(cH.inv(clamp(x,cH.l,cH.r))),1,N);if(n!==hov){hov=n;draw();}};
  svg.addEventListener('pointermove',pick);svg.addEventListener('pointerdown',pick);
  c0.seg('land',v=>{land=+v;draw();});draw();return {};});

// ======================================================================
// mercy: the elite wound and the proposed Old Mossback wound
// ======================================================================
reg('mercy',root=>{const {frame,yTicks,vbX,nf,RED,GRN,YEL,MUTE,TXT,BLU}=MR;
  const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);
  // measured first clears (q1_funnel.attempts_to_first_clear): median, p75, players cleared, never cleared
  const B={ogre:{n:'Ogre King',hp:232,base:232,med:3,p75:4,cl:15,nv:2,st:15,mx:60,wr:87.5},
    moss:{n:'Old Mossback',hp:765,base:765,med:7,p75:8.5,cl:10,nv:1,st:0,mx:0,wr:63.4},
    moss650:{n:'Old Mossback at 650 HP',hp:650,base:765,med:7,p75:8.5,cl:10,nv:1,st:5,mx:25,wr:63.4}};
  const NA=12;let key='ogre',hov=1;
  const share=(k,st,mx)=>1-Math.min(st*k,mx);
  // survival after n attempts, chance per attempt = p^(HP share)
  const surv=(p,st,mx,scale,n)=>{let S=1;for(let k=0;k<n;k++)S*=1-Math.pow(p,scale*share(k,st,mx));return S;};
  const medOf=(p,st,mx,scale)=>{let S=1;for(let k=0;k<400;k++){S*=1-Math.pow(p,scale*share(k,st,mx));if(S<=.5)return k+1;}return 400;};
  const meanOf=(p,st,mx,scale)=>{let S=1,E=0;for(let k=0;k<2000;k++){E+=S;S*=1-Math.pow(p,scale*share(k,st,mx));if(S<1e-9)break;}return E;};
  // calibrate p so the modelled median lands on the measured one, under the rule that held in the data
  function calib(med,st,mx){let lo=1e-4,hi=.9999;for(let i=0;i<60;i++){const p=(lo+hi)/2;
      const s=Math.sqrt(surv(p,st,mx,1,med-1)*surv(p,st,mx,1,med));if(s>.5)lo=p;else hi=p;}return (lo+hi)/2;}
  const P_OGRE=calib(3,.15,.6),P_MOSS=calib(7,0,0);
  const pOf=k=>k==='ogre'?P_OGRE:P_MOSS;
  function draw(){const b=B[key],st=c0.v('st')/100,mx=c0.v('mx')/100,p=pOf(key),sc=b.hp/b.base;
    c0.out('st',st.toFixed(2));c0.out('mx',mx.toFixed(2));
    svg.setAttribute('viewBox','0 0 360 290');svg.innerHTML='';
    const dummy={setAttribute(){},set innerHTML(v){}};
    // top: HP bars per attempt
    const t=frame(dummy,360,290,[24,10,290-128,46],.5,NA+.5,0,800);
    tx(svg,4,12,`${b.n}: HP at each attempt`,{'font-size':10,class:'lab'});
    yTicks(svg,t,[0,200,400,600,800]);
    const bw=(t.X(2)-t.X(1))*.66;
    if(b.base!==b.hp){const y=t.Y(b.base);svgEl('line',{x1:t.l,x2:t.r,y1:y,y2:y,stroke:MUTE,'stroke-dasharray':'3 3'},svg);tx(svg,t.r,y-3,'765 today',{'font-size':10,'text-anchor':'end'});}
    for(let a=1;a<=NA;a++){const hp=b.hp*share(a-1,st,mx),y=t.Y(hp);
      svgEl('rect',{x:t.X(a)-bw/2,y,width:bw,height:t.bot-y,fill:a===hov?YEL:RED,'fill-opacity':a===hov?.95:.7},svg);
      if(a===1||a===hov||a===NA)tx(svg,t.X(a),y-3,nf(hp),{'text-anchor':'middle','font-size':10,fill:a===hov?YEL:TXT});}
    svgEl('line',{x1:t.l,x2:t.r,y1:t.bot,y2:t.bot,class:'ax'},svg);
    // bottom: cumulative first-clear chance
    const c=frame(dummy,360,290,[172,10,290-262,46],.5,NA+.5,0,100);
    tx(svg,4,150,'Model: share of new players who have cleared it',{'font-size':10,class:'lab'});
    yTicks(svg,c,[0,50,100],v=>v+'%');
    for(let a=1;a<=NA;a++)tx(svg,c.X(a),c.bot+12,a,{'text-anchor':'middle','font-size':10,fill:a===hov?YEL:MUTE});
    tx(svg,(c.l+c.r)/2,c.bot+25,'attempt number (losses before it = attempt − 1)',{'text-anchor':'middle','font-size':10});
    const cum=(st2,mx2)=>{const pts=[[c.X(.5),c.Y(0)]];for(let a=1;a<=NA;a++)pts.push([c.X(a),c.Y(100*(1-surv(p,st2,mx2,sc,a)))]);return pts;};
    poly(svg,cum(0,0),{stroke:MUTE,'stroke-width':1.4,'stroke-dasharray':'4 3'});
    poly(svg,cum(st,mx),{stroke:YEL,'stroke-width':2.2});
    for(let a=1;a<=NA;a++)svgEl('circle',{cx:c.X(a),cy:c.Y(100*(1-surv(p,st,mx,sc,a))),r:a===hov?3.6:2.2,fill:YEL},svg);
    const m=medOf(p,st,mx,sc);if(m<=NA){svgEl('line',{x1:c.X(m),x2:c.X(m),y1:c.top,y2:c.bot,stroke:YEL,'stroke-opacity':.5,'stroke-dasharray':'2 2'},svg);}
    svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(50),y2:c.Y(50),stroke:TXT,'stroke-opacity':.25},svg);
    svgEl('path',{d:`M${c.X(b.med)} ${c.bot-3}l4 6h-8z`,fill:GRN},svg);
    keyz(svg,c.l-40,163,[{c:YEL,t:'with this wound'},{c:MUTE,t:'no wound',dash:'4 3'},{c:GRN,t:'measured median',dot:1}],9.6);
    show();}
  function show(){const b=B[key],st=c0.v('st')/100,mx=c0.v('mx')/100,p=pOf(key),sc=b.hp/b.base,k=hov-1,sh=share(k,st,mx);
    const pa=Math.pow(p,sc*sh),cm=1-surv(p,st,mx,sc,hov),m=medOf(p,st,mx,sc),m0=medOf(p,0,0,sc),e=meanOf(p,st,mx,sc),e0=meanOf(p,0,0,sc);
    const lossesToCap=st>0?Math.ceil(mx/st-1e-9):0;
    ro.innerHTML=`<b>Attempt ${hov}</b> after ${k} loss${k===1?'':'es'} · HP ${nf(b.hp*sh)} of ${nf(b.hp)}${sh<1?` (−${Math.round((1-sh)*100)}%)`:''} · model win chance ${Math.round(pa*100)}% · cleared by now ${Math.round(cm*100)}%`+
      `<br>Model median <b>${m>NA*3?'over '+NA*3:m} attempts</b>, mean ${e.toFixed(1)} · no wound ${m0} and ${e0.toFixed(1)}`+(st>0&&mx>0?` · cap reached after ${lossesToCap} losses at ${nf(b.hp*(1-mx))} HP`:' · no wound')+
      `<br><span class="mute">Measured: median ${b.med} attempts to first clear, p75 ${b.p75}, ${b.cl} players cleared, ${b.nv} never did. All-attempt win rate ${b.wr}%.</span>`;}
  const pick=e=>{const x=vbX(svg,e),l=46,r=350;if(x<l-6||x>r+6)return;const a=clamp(Math.round(.5+(x-l)/(r-l)*NA),1,NA);if(a!==hov){hov=a;draw();}};
  svg.addEventListener('pointermove',pick);svg.addEventListener('pointerdown',pick);
  c0.seg('boss',v=>{key=v;const b=B[v];c0.el('st').value=b.st;c0.el('mx').value=b.mx;draw();});
  c0.on('st',draw);c0.on('mx',draw);draw();return {};});

// ======================================================================
// ladder: E1's opt-in steps next to Peglin cruciball, Slay the Spire ascension and Balatro stakes
// ======================================================================
reg('ladder',root=>{const {RED,YEL,PUR,MUTE,TXT,GRN}=MR;const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);
  const KC={stat:RED,cut:YEL,beh:PUR,open:MUTE,base:GRN},KN={stat:'enemy stats',cut:'cut to healing or supply',beh:'new behaviour',open:'open slot',base:'base game'};
  // [short label, kind, what it changes, knob and file]
  const MR_=[['Base: Astaroth beaten','base','Today\'s descent, unchanged. Beating Astaroth opens step 1. Today a win opens only endless and blessings [K].',''],
    ['Elites at 6, 18, 30','beh','Each world gets three more elite slots, at encounters 6, 18 and 30, on top of 12, 24 and 36.','elite slots in the world layout'],
    ['One fewer belt slot','cut','The potion belt holds one slot fewer than the town has bought. The belt starts at 1 slot and holds 5 at most [K].','belt size'],
    ['EDGE_MERCY 0.30','cut','The hidden slack near the edge drops from 0.45 to 0.30, so the dark catches up sooner.','EDGE_MERCY, runner.gd:197'],
    ['ELITE_HIT 1.8','stat','Elites hit 1.8× instead of 1.5×, a 20% rise in elite damage from encounter 24.','ELITE_HIT, runner.gd:88-89'],
    ['Campfires heal half','cut','Each campfire restores half of what it restores today.','campfire heal'],
    ['Each boss gains a move','beh','Every world boss gets one new attack pattern.','boss move sets'],
    ['Open: enemy stats','open','A stat step from what is left of the +40% budget once ELITE_HIT has taken its share. Our placement [I].','to choose'],
    ['Open: a cut','open','A fourth cut to healing or supply, keeping the 40/40/20 mix. Our placement [I].','to choose'],
    ['Open: enemy stats','open','A stat step from the +40% budget. Our placement [I].','to choose'],
    ['Open: enemy stats','open','The last stat step. Total enemy stat inflation must stay at or under +40%. Our placement [I].','to choose']];
  const PEG=['Base game','One extra weak orb','Minibosses in ? nodes','One fewer crit peg','Misnavigation damage 4','One fewer refresh peg','Enemy HP up','Post-battle heal 15%','No starting gold, fights pay 40 instead of 50','Bomb self-damage 5','Boss HP up','Start with a cursed orb','Bombs −10 damage','Bosses heal 50%','−15% max HP','Enemies act during reload','Start with a cursed orb','Miniboss damage up','Shop prices up','Extra enemies in normal fights (limited in v1.0.6)','New behaviour for each boss'];
  const STS=['Base game, balanced first','More elites (about 60% more)','Normal enemies deal more damage','Elites deal more damage','Bosses deal more damage','Heal 75% of missing HP after a boss','Start at 90% HP','Normal enemies have more HP','Elites have more HP','Bosses have more HP','Ascender\'s Bane curse','One fewer potion slot','Fewer upgraded cards (25% less in Act 2, 50% less in Act 3)','Bosses drop 25% less gold','Lower max HP','Worse events','Shops 10% dearer','New enemy movesets (steps 17-19)','New enemy movesets (steps 17-19)','New enemy movesets (steps 17-19)','Double final boss'];
  const BAL=[['White','Base stake'],['Red','No cash from the small blind'],['Green','Steeper ante scaling'],['Black','Eternal jokers, which cannot be sold or destroyed'],['Blue','One fewer discard'],['Purple','Steeper ante scaling again'],['Orange','Perishable jokers'],['Gold','Rental jokers']];
  let open=1,sel=['mr',1];
  const COL=[{g:'mr',x:4,w:122,t:'MatchRPG (E1)',s:'proposal, 10 steps'},{g:'pg',x:134,w:66,t:'Peglin',s:'cruciball 0-20'},{g:'ss',x:208,w:66,t:'Slay the Spire',s:'ascension 0-20'},{g:'bl',x:282,w:74,t:'Balatro',s:'8 stakes'}];
  const TOP=34,BOT=286;
  function rung(g,i,x,y,w,h,label,fill,stroke,locked,on){const e=svgEl('g',{class:'dot',tabindex:0,role:'button','aria-label':label||`${g} ${i}`,'data-g':g,'data-i':i},svg);
    svgEl('rect',{x,y,width:w,height:h,rx:2,fill:locked?'#16131b':fill,stroke:on?'#fff':locked?'#2e2838':stroke,'stroke-width':on?1.6:1,'stroke-dasharray':locked?'3 2':''},e);
    if(label&&h>=10)tx(e,x+5,y+h/2+3.2,label,{'font-size':h>=18?9.6:8,fill:locked?'#8a7d9a':TXT,'pointer-events':'none'});return e;}
  function draw(){svg.setAttribute('viewBox','0 0 360 318');svg.innerHTML='';
    keyz(svg,4,314,[{c:RED,t:'enemy stats',box:1},{c:YEL,t:'cut',box:1},{c:PUR,t:'behaviour',box:1},{c:MUTE,t:'open slot',box:1},{c:TXT,t:'dashed = locked',box:0,dash:'3 2'}],9.4);
    COL.forEach(c=>{tx(svg,c.x+c.w/2,12,c.t,{'text-anchor':'middle','font-size':10.5,class:'lab'});tx(svg,c.x+c.w/2,24,c.s,{'text-anchor':'middle','font-size':9.2});});
    const H=BOT-TOP;
    // MatchRPG: 11 rungs (base + 10)
    const rh=H/11;MR_.forEach((r,i)=>{const y=BOT-(i+1)*rh,lk=i>open,s=sel[0]==='mr'&&sel[1]===i;
      const e=rung('mr',i,COL[0].x,y+1,COL[0].w,rh-2,(i?i+'. ':'')+r[0],'#1d1924',KC[r[1]],lk,s);
      svgEl('rect',{x:COL[0].x,y:y+1,width:3.5,height:rh-2,fill:KC[r[1]],'fill-opacity':lk?.45:1,'pointer-events':'none'},e);});
    const ph=H/21;
    PEG.forEach((t,i)=>rung('pg',i,COL[1].x,BOT-(i+1)*ph+.6,COL[1].w,ph-1.2,i%5===0?'C'+i:'','#1d1924','#463c55',false,sel[0]==='pg'&&sel[1]===i));
    STS.forEach((t,i)=>rung('ss',i,COL[2].x,BOT-(i+1)*ph+.6,COL[2].w,ph-1.2,i%5===0?'A'+i:'','#1d1924','#463c55',false,sel[0]==='ss'&&sel[1]===i));
    const bh=H/8;BAL.forEach((b,i)=>rung('bl',i,COL[3].x,BOT-(i+1)*bh+1,COL[3].w,bh-2,b[0],'#1d1924','#463c55',false,sel[0]==='bl'&&sel[1]===i));
    tx(svg,COL[0].x+COL[0].w/2,BOT+11,`${Math.min(open,10)} of 10 steps open`,{'text-anchor':'middle','font-size':9.6,fill:YEL});
    tx(svg,(COL[1].x+COL[3].x+COL[3].w)/2,BOT+11,'each level keeps every rule below it',{'text-anchor':'middle','font-size':9.4});
    show();}
  function show(){const [g,i]=sel;
    if(g==='mr'){const r=MR_[i],lk=i>open;
      ro.innerHTML=`<b>MatchRPG ${i?'step '+i:'base'}</b> · ${KN[r[1]]}${lk?' · locked until a clear with steps 1 to '+(i-1)+' on':''}<br>${r[2]}`+(r[3]?`<br><span class="mute">Knob: ${r[3]}. Proposal from card E1 [I].</span>`:'');}
    else if(g==='pg')ro.innerHTML=`<b>Peglin · cruciball ${i}</b> · ${PEG[i]}${i?'. Stacks on every level below.':'.'}`+(i===19?'<br>v1.0.6 limited the extra enemies and removed the chance of several hard enemies in one fight.':'');
    else if(g==='ss')ro.innerHTML=`<b>Slay the Spire · Ascension ${i}</b> · ${STS[i]}${i?'. Unlocks after a win on Ascension '+(i-1)+'.':'.'}`;
    else ro.innerHTML=`<b>Balatro · ${BAL[i][0]} Stake</b> · ${BAL[i][1]}${i?'. Includes every stake below it.':'.'}`;}
  const act=e=>{const r=e.target.closest('.dot');if(r){sel=[r.dataset.g,+r.dataset.i];draw();}};
  svg.addEventListener('click',act);svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act(e);}});
  c0.btn('win',()=>{if(open<10){open++;sel=['mr',open];}draw();});c0.btn('reset',()=>{open=1;sel=['mr',1];draw();});
  draw();return {};});
}
