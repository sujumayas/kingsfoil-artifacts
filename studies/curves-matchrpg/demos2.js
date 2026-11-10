// MatchRPG curves: the hero figure. Uses helpers and data (LOSS, REACH, CW, frame, worldBands) from demos1.js.
// ======================================================================
// hero: 60 runs descend the 180 story encounters, dying at the real per-encounter loss rates
// ======================================================================
reg('hero',root=>{const {frame,worldBands,yTicks,stepPts,encName,REACH,LOSS}=MR;const svg=$('svg',root);const N=60,SPD=34;
  const c=frame(svg,320,180,[30,8,22,30],.5,180.5,0,100);
  worldBands(svg,c);
  yTicks(svg,c,[0,50,100],v=>v+'%');
  poly(svg,stepPts(c,REACH,1,v=>c.Y(v)),{stroke:'#ffc870','stroke-width':1.6,'stroke-opacity':.55,'stroke-linejoin':'round'});
  const pileG=svgEl('g',{},svg),dotG=svgEl('g',{},svg);
  const piles=new Map();
  let rng=mkRng(7),runs=[],wait=0,round=0;
  function reset(){round++;rng=mkRng(7+round);runs=[];pileG.innerHTML='';piles.clear();dotG.innerHTML='';
    for(let i=0;i<N;i++){const y=c.top+6+(c.bot-c.top-24)*(i+.5)/N;
      runs.push({e:1-rng()*6,y,alive:true,won:false,el:svgEl('circle',{r:1.9,cy:y,fill:'#ece6f2','fill-opacity':.9},dotG)});}
    wait=0;}
  function bury(r,n){const k=Math.round(n);const h=(piles.get(k)||0)+1;piles.set(k,h);
    r.el.remove();svgEl('rect',{x:c.X(k)-1.6,y:c.bot-h*2.2,width:3.2,height:2,fill:'#ff8f7a','fill-opacity':.85},pileG);}
  function hud(){const alive=runs.filter(r=>r.alive).length,won=runs.filter(r=>r.won).length;
    const front=Math.max(1,...runs.filter(r=>r.alive).map(r=>Math.floor(r.e)));
    setHud(root,alive?`${alive} of ${N} runs alive · ${encName(Math.min(180,front))}`:`${won} of ${N} runs cleared the descent · ${N-won} fell`);}
  reset();hud();
  let acc=0;
  return {tick(dt){
    if(!motion){if(round===1&&!runs.some(r=>!r.alive)){for(const r of runs){let n=1;for(;n<=180;n++)if(rng()*100<LOSS[n-1])break;
        if(n>180){r.alive=false;r.won=true;r.el.setAttribute('cx',c.X(180));}else{r.alive=false;bury(r,n);}}hud();}return;}
    const left=runs.some(r=>r.alive);
    if(!left){wait+=dt;if(wait>2.2){reset();}hud();return;}
    for(const r of runs){if(!r.alive)continue;const prev=Math.floor(r.e);r.e+=SPD*dt*(0.85+0.3*((r.y*13)%1));
      const now=Math.floor(r.e);
      for(let n=Math.max(1,prev+1);n<=now&&r.alive;n++){
        if(n>180){r.alive=false;r.won=true;r.el.setAttribute('fill','#7fd6a0');r.el.setAttribute('r',2.6);r.el.setAttribute('cx',c.X(180));break;}
        if(rng()*100<LOSS[n-1]){r.alive=false;bury(r,n);}}
      if(r.alive)r.el.setAttribute('cx',c.X(Math.max(1,Math.min(180,r.e))));}
    acc+=dt;if(acc>.12){acc=0;hud();}}};});
