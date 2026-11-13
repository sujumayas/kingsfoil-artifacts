// SpeedRunner verbs study (Mechanics #2): figures 1 (hero, timeline, A1 to A6, B1 to B5). Shared helpers live in core.js (SR).
{
const C2=cv=>cv.getContext('2d');
const still=()=>!motion||reduce;
const SC=640/970;                                   // canvas px per world unit: a 640 px canvas shows the game's 970 u view
const K0=()=>SR.K();
const stepper=root=>{let acc=0;return (dt,fn)=>{acc=Math.min(acc+dt*slowF(root),.1);while(acc>=SR.DT){fn(SR.DT);acc-=SR.DT;}return acc/SR.DT;};};
const follow=(pose,P,dt,clock,tau)=>SR.blend(pose,SR.targetPose(P,clock),1-Math.exp(-dt/(tau||.038)));
const rotOf=P=>P.flipOn?P.flipDir*P.facing*P.flip*Math.PI*2:0;
function drawP(c,P,pose,alpha,o){const x=lerp(P.px,P.x,alpha)+SR.W/2,y=lerp(P.py,P.y,alpha)+(P.h||SR.H);const b=SR.bladeOf(P)||{};SR.drawSamurai(c,pose,x,y,P.facing,Object.assign({flap:P.flap,grip:P.grip,rot:rotOf(P)},b,o||{}));}
// record a scripted run through stepV: one snapshot per step with a copy of the verb state
function recV(w,P,keysAt,o,T,extra){const out=[];for(let i=0;i<T/SR.DT;i++){let t=i*SR.DT;const k=Object.assign(SR.K(),keysAt(t,P,i)||{});const ev=SR.stepV(P,k,SR.DT,Object.assign({world:w,time:t},o||{}));t=(i+1)*SR.DT;const V=P.verb;
    const snap=Object.assign({},P,{t,ev:ev.filter(e=>e.t!=='dust'),verb:Object.assign({},V,{after:V.after.slice(),hook:V.hook&&Object.assign({},V.hook)}),keys:k});if(extra)extra(snap,P);out.push(snap);if(P.dead||P.finished)break;}return out;}
const at=(rec,t)=>rec[Math.min(rec.length-1,Math.max(0,Math.floor(t/SR.DT)))];
const GC=['#d9a066','#f2c14e','#4c9bff','#b45cff','#4ce04c'];
const BLs=u=>(u/46).toFixed(1)+' BL';
const holdJump=(k,P)=>{k.jump=!!k.jumpPressed||(!P.onGround&&P.vy<0&&!(P.verb&&P.verb.state==='hook'));return k;};
// a looping clock over one or more records with a pause at the end
function looper(){let t=0,wait=0;return {get t(){return t;},reset(){t=0;wait=0;},adv(d,end){if(wait>0){wait-=d;if(wait<=0)t=0;}else{t+=d;if(t>=end){t=end;wait=.9;}}}};}
// draw one snapshot's verb visuals and body in the current world transform
function drawS(c,S,pose,o){o=o||{};if(S.verb&&S.verb.after&&S.verb.after.length&&(S.verb.state==='dashSlash'||S.verb.state==='dash'))S.verb.after.forEach((a,i,arr)=>SR.drawSamurai(c,pose,a.x+SR.W/2,a.y+(a.h||SR.H),a.f,{ghost:true,alpha:.08+.14*(i+1)/arr.length,katana:false}));
  if(S.verb&&S.verb.state==='hook'&&S.verb.hook){const r=S.verb.hook.ring;c.strokeStyle=SR.ink.ink;c.lineWidth=2;c.beginPath();c.moveTo(r.x,r.y);c.lineTo(S.x+SR.W/2,S.y+10);c.stroke();}
  if(S.verb&&S.verb.state==='dashSlash'&&S.verb.phase==='active'){const b=SR.slashBox(S);c.fillStyle='rgba(255,255,255,.9)';c.fillRect(b[0],b[1]+b[3]/2-1.5,b[2],3);}
  const bl=SR.bladeOf(S)||{};SR.drawSamurai(c,pose,S.x+SR.W/2,S.y+(S.h||SR.H),S.facing,Object.assign({flap:S.flap,grip:S.grip,rot:rotOf(S),ghost:o.ghost,alpha:o.alpha},bl,o.o||{}));
  if(o.box){const b=SR.verbBox(S);if(b)SR.drawBox(c,b);if(o.body)SR.drawBox(c,[S.x,S.y,SR.W,S.h||SR.H],SR.ink.grey);}}
// a dotted trail of a record up to t, red while a verb state other than normal is live
function trail(c,rec,t,every){for(let i=0;i<rec.length;i+=every||4){const p=rec[i];if(p.t>t)break;const v=p.verb&&p.verb.state!=='normal'&&p.verb.state!=='crouch';c.fillStyle=v?SR.ink.red:SR.ink.grey2;c.fillRect(p.x+SR.W/2-1.2,p.y+(p.h||SR.H)-1.2,2.4,2.4);}}
window.SRfig={C2,SC,K0,stepper,follow,drawP,recV,at,looper,drawS,trail,holdJump};

// ======================================================================
// HERO: the Verbs gym on loop through the real step and the §7 state machine, a ghost of the other set
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,btns=$$('.hero-tiers button',root),m=meter(.1),run=stepper(root);
  const PRE=[{n:'Today',set:'today',o:{}},{n:'Recommended',set:'recommended',o:{hyper:true,liftBoost:true}},{n:'Kitchen sink',set:'kitchenGym',o:{hyper:true,liftBoost:true}}];
  const LBL={slide:'slide · Down at 280 u/s or more',slideJump:'slide-jump · 546 x 622 u/s, the hyper pair',crouch:'crawl · 120 u/s under 32 u',mantle:'mantle · no input, feet snap to the lip',pogo:'pogo · Down + Katana in the air',bounce:'bounce · 830 u/s, 3.0 BL, charge refunded',arm:'armed · katana held 200 ms',dashSlash:'dash-slash · 840 u/s, 2x run',kill:'kill · one charge refunded',hook:'ring hook · Up + Katana at 45°',release:'release · capped at 760 u/s',slash:'slash · 2 / 4 / 6 steps',wallRun:'wall run · 92 u in 250 ms',dash:'dash · 1120 u/s for 150 ms',djump:'double jump · 705 u/s',stand:'stands · the 46 u box is free',slideStop:'slide into a wall · 100 ms stop'};
  const w=SR.course('gym');let pre=1,P,st,pose,cam,parts=[],time=0,steps=0,mode='run',modeT=0,rec=[],split=null,splitT=0,loops=0,clock=0,lastT=null,deaths=0,msg='',msgT=0;
  const camO=()=>({mode:'lock',width:w.width,top:w.top,floorView:SR.G,deathY:w.deathY,speedFocus:true});
  // dry runs at init: the ghost exists from the first frame and the readout can compare the sets
  function dry(i){const ww=SR.course('gym');const Q=SR.newPlayerV(ww.start,ww.startY,PRE[i].set);let s2={},t=0,ps=SR.newPose();const r=[];
    for(let n=0;n<3600;n++){const k=SR.botV(Q,ww,s2);const ev=SR.stepV(Q,k,SR.DT,Object.assign({world:ww,time:t},PRE[i].o));t+=SR.DT;ps=SR.blend(ps,SR.targetPose(Q,t),1-Math.exp(-26*SR.DT));
      if(n%4===0)r.push({t,x:Q.x+SR.W/2,y:Q.y+Q.h,f:Q.facing,ps,flap:Q.flap,grip:Q.grip,rot:rotOf(Q),bl:SR.bladeOf(Q)});
      for(const e of ev){if(e.t==='check')r['cp'+e.i]=t*1000;}if(Q.finished){r.total=t*1000;break;}if(Q.dead)break;}return r;}
  PRE.forEach((p,i)=>{p.ghost=dry(i);});
  function start(){SR.resetGym(w);P=SR.newPlayerV(w.start,w.startY,PRE[pre].set);st={};pose=SR.newPose();parts=[];time=0;steps=0;mode='run';modeT=0;rec=[];split=null;msg='';cam=SR.newCam(0,0);SR.cam(cam,P,Object.assign(camO(),{snap:true}),0);}
  function setPre(i){pre=i;btns.forEach((b,j)=>b.classList.toggle('on',j===i));start();}
  btns.forEach((b,i)=>b.addEventListener('click',()=>setPre(i)));setPre(1);
  const other=()=>PRE[pre===0?1:0].ghost;
  function sim(dt){if(mode==='run'){const k=SR.botV(P,w,st),ev=SR.stepV(P,k,dt,Object.assign({world:w,time},PRE[pre].o));time+=dt;steps++;SR.spawnDust(parts,ev);
      for(const e of ev){const ms=steps*1000/120;
        if(e.t==='check'){const g=other();rec['cp'+e.i]=ms;if(g&&g['cp'+e.i]!=null){split={d:ms-g['cp'+e.i]};splitT=1.6;}}
        else if(e.t==='finish'){mode='done';modeT=0;lastT=ms;rec.total=ms;PRE[pre].ghost=rec;loops++;}
        else if(e.t==='die'){mode='dead';modeT=0;deaths++;SR.dust(parts,P.x+SR.W/2,P.y+P.h/2,22,0,-1,1.6);}
        else{const id=e.t==='verb'?e.id:e.t;if(LBL[id]){msg=LBL[id];msgT=1.2;}if(e.t==='kill'||e.t==='bounce'||e.t==='break')SR.dust(parts,e.x,e.y,12,0,-1,1.4);}}
      if(steps%4===0)rec.push({t:time,x:P.x+SR.W/2,y:P.y+P.h,f:P.facing,ps:pose,flap:P.flap,grip:P.grip,rot:rotOf(P),bl:SR.bladeOf(P)});}
    else{modeT+=dt;if((mode==='dead'&&modeT>=.38)||(mode==='done'&&modeT>=.9))start();}
    SR.updParts(parts,dt);}
  const fm=v=>v==null?'–':SR.fmtT(v);
  return {tick(dt){m.t0();const s=still()?0:dt;clock+=s;const alpha=run(s,sim);if(mode==='run')pose=follow(pose,P,s,clock);SR.cam(cam,P,camO(),s);
      SR.paper(c,W,H);SR.view(c,cam,SC);SR.drawSolids(c,w,cam,{time,cpOn:P.cp,glowRing:P.verb.hook&&P.verb.hook.ring});
      const gh=other();if(gh&&gh.length){let g=gh[gh.length-1];for(let i=0;i<gh.length;i++)if(gh[i].t>time){g=gh[Math.max(0,i-1)];break;}SR.drawSamurai(c,g.ps,g.x,g.y,g.f,Object.assign({ghost:true,alpha:.4,flap:g.flap,grip:g.grip,rot:g.rot},g.bl||{}));}
      if(mode!=='dead'){SR.drawAfter(c,P,pose);SR.drawRope(c,P);SR.drawSmear(c,P);}
      SR.drawParts(c,parts);if(mode!=='dead')drawP(c,P,pose,alpha,{clock,kim:P.verb.dashes<1?'#7a1a14':undefined});
      c.setTransform(1,0,0,1,0,0);SR.plate(c,SR.fmtT(steps*1000/120),W/2,34,{size:20,mono:true,align:'center',weight:600,pad:8});
      if(splitT>0&&split){splitT-=s;SR.text(c,SR.fmtD(split.d),W/2,58,{size:14,mono:true,align:'center',weight:600,col:split.d<0?SR.ls.aheadG:SR.ls.behindL});}
      if(msgT>0){msgT-=s;SR.plate(c,msg,W/2,H-38,{size:12,align:'center',col:SR.ink.red,pad:6});}
      if(mode==='done')SR.plate(c,'FINISH  '+SR.fmtT(lastT),W/2,H/2,{size:18,mono:true,align:'center',weight:600,pad:8});
      if(mode==='dead')SR.plate(c,'dead · restart in 0.38 s, no countdown',W/2,H/2,{size:13,align:'center',col:SR.ink.red,pad:6});
      SR.text(c,PRE[pre].n+' · '+P.verb.state+(P.verb.armed?' · armed':''),12,H-12,{size:12,col:SR.ink.grey});
      SR.text(c,`Today ${fm(PRE[0].ghost.total)} · Recommended ${fm(PRE[1].ghost.total)} · Kitchen ${fm(PRE[2].ghost.total)} · loops ${loops}${deaths?' · deaths '+deaths:''}`,W-12,H-12,{size:11.5,align:'right',col:SR.ink.grey,mono:true});
      setHud(root,fms(m.t1())+' ms JS · 1/120 s step');}};});

// ======================================================================
// §3 timeline
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const X=y=>1.5+(y-1986)/41*95;
  let h='<div class="tl-axis">';for(const y of [1988,1998,2008,2018,2026])h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
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
  const pick=items.find(i=>/Celeste/.test(i.e.h)&&/DashSpeed/.test(i.e.h))||items[0];show(pick.id);return {};});

// ======================================================================
// A1 the dash: a gap only the dash clears, with the §7 numbers on sliders
// ======================================================================
reg('dash',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  const GAP=322;                                                                       // 7 BL, the dash tier of A1
  const mk=()=>SR.makeCourse({width:2200,deathY:SR.G+160,solids:[[0,SR.G,600,300],[600+GAP,SR.G,300,500],[900+GAP+GAP,SR.G,600,500]]});
  let rec=[],rec0=[],pose=SR.newPose(),pose0=SR.newPose(),clock=0,note='';
  function build(){const sp=cc.v('sp'),dur=cc.v('dur'),ex=cc.v('ex'),never=cc.segv('refill')==='never';cc.out('sp',sp.toFixed(2)+'x · '+Math.round(sp*420)+' u/s');cc.out('dur',dur+' steps · '+Math.round(dur*1000/120)+' ms');cc.out('ex',ex.toFixed(2)+'x · '+Math.round(ex*420)+' u/s');
    const D=SR.VERBS.dash,sv={speed:D.speed,active:D.active,exit:D.exit};Object.assign(D,{speed:Math.round(sp*420),active:dur,exit:Math.round(ex*420)});
    const keys=()=>{let used=0;return (t,P)=>{const k={right:true};const edge=P.x+SR.W>=560&&P.onGround,edge2=P.x+SR.W>=860+GAP&&P.onGround;if(edge||edge2){k.jumpPressed=true;}
      if(!P.onGround&&P.vy>-200&&P.verb.state==='normal'&&P.verb.dashes>0&&((P.x>660&&P.x<700)||(P.x>960+GAP&&P.x<1000+GAP))){k.dashPressed=true;used++;}return holdJump(k,P);};};
    const w=mk(),P=SR.newPlayerV(60,SR.G,{dash:1});P.vx=420;P.onGround=true;
    rec=recV(w,P,keys(),{},4,(s,Q)=>{if(never&&Q.verb.kills===0&&s.ev.some(e=>e.t==='verb'&&e.id==='dash'))Q.verb.never=true;if(never&&Q.verb.never)Q.verb.dashes=0;});
    const P0=SR.newPlayerV(60,SR.G,{});P0.vx=420;P0.onGround=true;rec0=recV(mk(),P0,(t,Q)=>{const k={right:true};if(Q.x+SR.W>=560&&Q.onGround){k.jumpPressed=true;}return holdJump(k,Q);},{},3);
    Object.assign(D,sv);lp.reset();
    const d1=rec.find(s=>s.ev.some(e=>e.t==='verb'&&e.id==='dash')),land=rec.find(s=>s.t>(d1?d1.t:0)&&s.ev.some(e=>e.t==='land'||e.t==='touch'||e.t==='roll')),j=rec.find(s=>s.ev.some(e=>e.t==='jump'));
    const dist=Math.round(sp*420*dur/120),flat=land&&j?Math.round(land.x-j.x):null,died=rec[rec.length-1].dead,second=rec[rec.length-1].x>900;
    note=`dash covers <b>${dist} u = ${BLs(dist)}</b> with gravity off (Celeste 36 px = 3.3 BL) · exit ${Math.round(ex*420)} u/s, then the 500 u/s² decay · jump plus dash lands <b>${flat!=null?flat+' u = '+BLs(flat):'in the gap'}</b> against about 248 u for the plain jump (grey) · gaps of 7 BL: ${died?'<span class="bad">fell at the '+(second>1?'second':'first')+' gap</span>':'<span class="ok">both cleared</span>'}${never?' · never refilled: one dash per run':' · refilled on landing'}`;ro.innerHTML=note;}
  ['sp','dur','ex'].forEach(k=>cc.on(k,build));cc.seg('refill',build);build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,Math.max(rec[rec.length-1].t,rec0[rec0.length-1].t)));const S=at(rec,lp.t),S0=at(rec0,lp.t);pose=follow(pose,S,s,clock);pose0=follow(pose0,S0,s,clock);
      SR.paper(c,W,H);const sc=.55,camx=clamp(S.x-220,0,1400),camy=SR.G-H/sc*.78;c.setTransform(sc,0,0,sc,-camx*sc,-camy*sc);const w=mk();SR.drawSolids(c,w,{x:camx,y:camy},{VW:W/sc,start:false,death:true});
      SR.dim(c,600,SR.G+40,600+GAP,SR.G+40,'7 BL',{col:SR.ink.grey});SR.dim(c,900+GAP,SR.G+40,900+GAP+GAP,SR.G+40,'7 BL',{col:SR.ink.grey});
      // Celeste's dash as a reference bar: 3.3 BL at 2.67x for 0.15 s
      c.fillStyle='#2458c9';c.fillRect(660,SR.G-200,152,3);SR.text(c,'Celeste dash 3.3 BL, 2.67x, 150 ms [V, S7]',660,SR.G-208,{size:13,col:'#2458c9'});
      trail(c,rec0,lp.t,5);trail(c,rec,lp.t,3);
      if(!S0.dead)drawS(c,S0,pose0,{ghost:true,alpha:.45});if(!S.dead)drawS(c,S,pose,{});
      c.setTransform(1,0,0,1,0,0);const V=S.verb;SR.plate(c,`${Math.round(Math.abs(S.vx))} u/s · ${V.state==='dash'?'dash '+V.phase+' step '+V.t:V.state} · charges ${V.dashes}`,12,24,{size:12,mono:true,weight:600,col:V.state==='dash'?SR.ink.red:SR.ink.ink});}};});

// ======================================================================
// A2 dash directions: two, four or eight, on a wheel and over a gap and a wall
// ======================================================================
reg('dashdirs',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  const GAP=322,WALLH=276;                                                              // 7 BL gap, 6 BL wall (m2's chimney is 13 BL)
  const mk=()=>SR.makeCourse({width:2400,deathY:SR.G+160,solids:[[0,SR.G,600,300],[600+GAP,SR.G,400,500],[1000+GAP,SR.G-WALLH,60,WALLH+500],[1060+GAP,SR.G-WALLH,800,WALLH+500]]});
  let rec=[],pose=SR.newPose(),clock=0,dirs=2;
  function build(){dirs=+cc.segv('dirs');
    const keys=()=>{let d2=false;return (t,P)=>{const k={right:true};if(P.onGround&&((P.x+SR.W>=560&&P.x<600)||(P.x+SR.W>=900+GAP&&P.x<960+GAP))){k.jumpPressed=true;}
      if(!P.onGround&&P.verb.state==='normal'&&P.verb.dashes>0){if(P.x>660&&P.x<720&&P.vy>-200)k.dashPressed=true;if(P.x>930+GAP&&P.vy>-150&&!d2){k.dashPressed=true;d2=true;if(dirs>=4)k.up=true;if(dirs<8&&dirs>=4)k.right=false;}}
      if(P.verb.state==='dash'&&P.verb.dy)k.right=dirs>=8;holdJump(k,P);if(P.verb.state==='dash')k.jump=false;return k;};};
    const w=mk(),P=SR.newPlayerV(60,SR.G,{dash:1,dashDirs:dirs});P.vx=420;P.onGround=true;rec=recV(w,P,keys(),{},4.5);lp.reset();
    const top=rec.reduce((a,s)=>Math.min(a,s.y+s.h),1e9),over=rec.some(s=>s.onGround&&s.y+s.h<=SR.G-WALLH+1),dashes=rec.filter(s=>s.ev.some(e=>e.t==='verb'&&e.id==='dash'));
    const d2=dashes[1],dir=d2?(d2.verb.dy?(d2.verb.dir?'up-forward diagonal':'straight up'):'forward'):'none';
    ro.innerHTML=`${dirs} directions · first dash forward over the 7 BL gap · second dash <b>${dir}</b> at the apex beside a 6 BL wall · highest feet <b>${BLs(SR.G-top)}</b> above the floor · ${over?'<span class="ok">over the wall in one jump</span>':'<span class="bad">stopped at the wall, the wall kit must climb it</span>'} · an up-dash adds 168 u plus a 0.75 exit: about 6.5 BL from one jump, so m2’s 13 BL chimney loses two wall jumps [K; I]`;}
  cc.seg('dirs',build);build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,rec[rec.length-1].t+.3));const S=at(rec,lp.t);pose=follow(pose,S,s,clock);
      SR.paper(c,W,H);const sc=.5,camx=clamp(S.x-260,0,1500),camy=SR.G-H/sc*.8;c.setTransform(sc,0,0,sc,-camx*sc,-camy*sc);SR.drawSolids(c,mk(),{x:camx,y:camy},{VW:W/sc,start:false,death:true});
      SR.dim(c,1000+GAP-30,SR.G,1000+GAP-30,SR.G-WALLH,'6 BL',{col:SR.ink.grey,ox:-34});trail(c,rec,lp.t,3);if(!S.dead)drawS(c,S,pose,{});
      c.setTransform(1,0,0,1,0,0);
      // the wheel: eight arrows, the allowed ones in ink
      const cx=W-70,cy=70,R=38;c.fillStyle='rgba(255,255,255,.92)';c.fillRect(cx-62,cy-62,124,124);c.strokeStyle=SR.ink.ink;c.lineWidth=1;c.strokeRect(cx-61.5,cy-61.5,123,123);
      for(let i=0;i<8;i++){const a=i*Math.PI/4,on=dirs>=8||(dirs>=4&&i%2===0)||(dirs===2&&(i===0||i===4));c.strokeStyle=on?SR.ink.ink:SR.ink.grey2;c.lineWidth=on?3:1.5;c.lineCap='round';c.beginPath();c.moveTo(cx+Math.cos(a)*8,cy+Math.sin(a)*8);c.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);c.stroke();
        if(on){c.fillStyle=SR.ink.ink;c.beginPath();c.arc(cx+Math.cos(a)*R,cy+Math.sin(a)*R,3.2,0,Math.PI*2);c.fill();}}
      SR.text(c,dirs+' directions',cx,cy+56,{size:11,align:'center',weight:600});
      const V=S.verb;SR.plate(c,`${V.state==='dash'?'dash '+(V.dy?(V.dir?'diagonal':'up'):'forward')+' · step '+V.t:V.state} · vy ${Math.round(S.vy)}`,12,24,{size:12,mono:true,weight:600,col:V.state==='dash'?SR.ink.red:SR.ink.ink});}};});

// ======================================================================
// A3 the air charge: one resource spent as an air dash or a double jump over the same gaps
// ======================================================================
reg('aircharge',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  let gap=322,recs=[],poses=[SR.newPose(),SR.newPose()],clock=0;
  const mk=()=>SR.makeCourse({width:2600,deathY:SR.G+160,solids:[[0,SR.G,600,300],[600+gap,SR.G,300,500],[900+gap+gap,SR.G,700,500]]});
  function build(){gap=+cc.segv('gap');lp.reset();
    const keys=kind=>(t,P)=>{const k={right:true};if(P.onGround&&((P.x+SR.W>=560&&P.x<600)||(P.x+SR.W>=860+gap&&P.x<900+gap)))k.jumpPressed=true;
      if(!P.onGround&&P.vy>-120&&P.verb.state==='normal'){if(kind==='dash'&&P.verb.dashes>0)k.dashPressed=true;if(kind==='dj'&&P.verb.airJumps>0&&P.coyote<=0)k.jumpPressed=true;}
      return holdJump(k,P);};
    recs=[['air dash',{airDash:1},'dash',SR.ink.red],['double jump',{doubleJump:1},'dj','#2458c9']].map(([n,set,kind,col])=>{const w=mk(),P=SR.newPlayerV(60,SR.G,set);P.vx=420;P.onGround=true;const r=recV(w,P,keys(kind),{},4.2);
      const j=r.find(s=>s.ev.some(e=>e.t==='jump')),l=r.find(s=>s.t>(j?j.t:0)+.2&&s.ev.some(e=>e.t==='land'||e.t==='touch'||e.t==='roll'));return {n,r,col,flat:j&&l?Math.round(l.x-j.x):null,died:r[r.length-1].dead,top:r.reduce((a,s)=>Math.min(a,s.y+s.h),1e9)};});
    ro.innerHTML=recs.map(x=>`<b>${x.n}</b>: jump plus the charge lands ${x.flat!=null?x.flat+' u = '+BLs(x.flat):'in the gap'}, apex ${BLs(SR.G-x.top)} · ${x.died?'<span class="bad">falls at a '+BLs(gap)+' gap</span>':'<span class="ok">clears both '+BLs(gap)+' gaps</span>'}`).join(' · ')+' · the charge refills on landing between the gaps (Dustforce, Hollow Knight) [V, S43, S21]';}
  cc.seg('gap',build);build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,Math.max(...recs.map(x=>x.r[x.r.length-1].t))+.3));SR.paper(c,W,H);
      recs.forEach((x,i)=>{const S=at(x.r,lp.t);poses[i]=follow(poses[i],S,s,clock);const y0=i*180,sc=.42,camx=clamp(S.x-200,0,1800),camy=SR.G-180/sc*.78;
        c.save();c.beginPath();c.rect(0,y0,W,180);c.clip();c.setTransform(sc,0,0,sc,-camx*sc,y0-camy*sc);SR.drawSolids(c,mk(),{x:camx,y:camy},{VW:W/sc,start:false,death:true});
        SR.dim(c,600,SR.G+40,600+gap,SR.G+40,BLs(gap),{col:SR.ink.grey});trail(c,x.r,lp.t,3);if(!S.dead)drawS(c,S,poses[i],{});c.restore();c.setTransform(1,0,0,1,0,0);
        const V=S.verb;SR.plate(c,`${x.n}: ${Math.round(Math.abs(S.vx))} u/s · charge ${x.n==='air dash'?V.dashes:V.airJumps}`,12,y0+22,{size:12,mono:true,weight:600,col:x.col});c.fillStyle=SR.ink.grey2;c.fillRect(0,y0+179,W,1);});}};});

// ======================================================================
// A4 double jump and its refill rules over a chain of gaps and a wall
// ======================================================================
reg('doublejump',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  const WALL=391;                                                                       // 8.5 BL: jump 3.0 + double 2.2 + climb jump 2.7 = 7.9 falls short; a wall refill adds 2.2
  const mk=()=>SR.makeCourse({width:2400,deathY:SR.G+160,solids:[[0,SR.G,500,300],[730,SR.G,260,500],[990,SR.G-WALL,60,900],[1050,SR.G-WALL,900,900]]});
  let rec=[],pose=SR.newPose(),clock=0,note='';
  function build(){const mode=cc.segv('refill'),vy=cc.v('vy');cc.out('vy',vy.toFixed(2)+' x jumpVel · '+Math.round(vy*830)+' u/s');const D=SR.VERBS.doubleJump,sv=D.vy;D.vy=-Math.round(vy*830);
    const keys=()=>(t,P)=>{const k={right:true};if(P.onGround&&((P.x+SR.W>=460&&P.x<500)||(P.x+SR.W>=900&&P.x<990)))k.jumpPressed=true;
      if(!P.onGround&&P.wallDir!==0&&P.vy>0)k.jumpPressed=true;                                           // the wall jump
      if(!P.onGround&&P.vy>-120&&P.verb.airJumps>0&&P.coyote<=0&&P.wallMemT<=0&&P.wallDir===0)k.jumpPressed=true;return holdJump(k,P);};
    const w=mk(),P=SR.newPlayerV(60,SR.G,{doubleJump:1});P.vx=420;P.onGround=true;
    rec=recV(w,P,keys(),{},4.5,(s,Q)=>{if(mode==='wall'&&Q.wallDir!==0&&Q.verb.airJumps<1){Q.verb.airJumps=1;s.refilled=true;}});Object.assign(D,{vy:sv});lp.reset();
    const dj=rec.filter(s=>s.ev.some(e=>e.t==='djump')),top=rec.some(s=>s.onGround&&s.y+s.h<=SR.G-WALL+1),ap=99.4*vy*vy/(.85*.85),fell=rec[rec.length-1].dead;
    note=`refill <b>${mode==='wall'?'on the ground or a wall (Hollow Knight)':'on the ground only (the Sandbox)'}</b> · double jumps used: ${dj.length} · second jump apex ${(ap/46).toFixed(1)} BL from ${Math.round(vy*830)} u/s · the 5 BL gap: ${fell&&!dj.length?'fell':'cleared'} · the 8.5 BL wall: ${top?'<span class="ok">reached the top: jump 3.0 BL, double jump '+(ap/46).toFixed(1)+', climb jump 2.7, and a second double jump '+(ap/46).toFixed(1)+' refilled by the wall</span>':'<span class="bad">not reached: jump 3.0 BL, double jump '+(ap/46).toFixed(1)+' and climb jump 2.7 BL fall short, and the ground rule gives no second charge</span>'}`;ro.innerHTML=note;}
  cc.seg('refill',build);cc.on('vy',build);build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,rec[rec.length-1].t+.3));const S=at(rec,lp.t);pose=follow(pose,S,s,clock);
      SR.paper(c,W,H);const sc=.5,camx=clamp(S.x-240,0,1400),camy=SR.G-H/sc*.82;c.setTransform(sc,0,0,sc,-camx*sc,-camy*sc);SR.drawSolids(c,mk(),{x:camx,y:camy},{VW:W/sc,start:false,death:true});
      SR.dim(c,500,SR.G+40,730,SR.G+40,'5 BL',{col:SR.ink.grey});SR.dim(c,960,SR.G,960,SR.G-WALL,'8.5 BL',{col:SR.ink.grey,ox:-36});
      rec.forEach(p=>{if(p.t<=lp.t&&p.ev.some(e=>e.t==='djump')){c.fillStyle=SR.ink.red;c.beginPath();c.arc(p.x+SR.W/2,p.y+p.h,5,0,Math.PI*2);c.fill();SR.text(c,'double jump',p.x+SR.W/2,p.y+p.h+24,{size:13,align:'center',col:SR.ink.red});}
        if(p.t<=lp.t&&p.refilled){c.fillStyle='#2458c9';c.fillRect(p.x+(p.wallDir>0?SR.W:-4),p.y+10,4,p.h-20);}});
      trail(c,rec,lp.t,3);if(!S.dead)drawS(c,S,pose,{});c.setTransform(1,0,0,1,0,0);
      SR.plate(c,`air jumps ${S.verb.airJumps} · vy ${Math.round(S.vy)}`,12,24,{size:12,mono:true,weight:600});}};});

// ======================================================================
// A5 the dash-jump lineage as arcs in body lengths
// ======================================================================
reg('dashjump',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  // each arc: launch vx, vy (positive up), gravity up and down, a pin time where the launch speed is held (Celeste's variable jump), 1 BL in its own units
  const CEL={g:900,BL:11,pin:.2},SR_={gu:2500,gd:4125,BL:46};
  function arc(a){const pts=[];let x=0,y=0,vy=a.vy,t=0;for(let i=0;i<2000;i++){pts.push({x:x/a.BL,y:y/a.BL,t});if(t<(a.pin||0)){y+=a.vy*SR.DT;}else{const g=vy>0?a.gu:a.gd;vy-=g*SR.DT;y+=vy*SR.DT;}x+=a.vx*SR.DT;t+=SR.DT;if(y<0&&i>2)break;}return pts;}
  const A=[{n:'SpeedRunner jump',s:'1.0x run, 830 u/s',vx:420,vy:830,gu:2500,gd:4125,BL:46,col:SR.ink.ink},
    {n:'roll-jump hyper = slide-jump',s:'1.3x run, 0.75 jumpVel (546 x 622)',vx:546,vy:622,gu:2500,gd:4125,BL:46,col:SR.ink.red},
    {n:'Celeste super',s:'2.9x run (260 x 105 px/s)',vx:260,vy:105,gu:900,gd:900,BL:11,pin:.2,col:'#2458c9'},
    {n:'Celeste hyper (and wavedash)',s:'3.6x run, half height (325 x 52.5)',vx:325,vy:52.5,gu:900,gd:900,BL:11,pin:.2,col:'#1f8a3a'},
    {n:'Celeste ultra',s:'super x1.2 on landing (312 px/s), same arc',vx:312,vy:105,gu:900,gd:900,BL:11,pin:.2,col:'#7a4fd6'},
    {n:'Mega Man X dash-jump',s:'2.33x walk (3.5 px/f), 5 px/f launch',vx:3.5*60,vy:5*60,gu:.25*3600,gd:.25*3600,BL:34,col:'#c9971c'}];
  A.forEach(a=>{a.pts=arc(a);a.dist=a.pts[a.pts.length-1].x;a.top=Math.max(...a.pts.map(p=>p.y));a.air=a.pts[a.pts.length-1].t;});
  const L=46,Rr=W-14,B=300,BLx=(Rr-L)/13,BLy=52,X=bl=>L+bl*BLx,Y=bl=>B-bl*BLy;
  let sel=1,t=0,pose=SR.newPose(),Pf={vx:420,vy:0,onGround:false,wallDir:0,roll:0,flipOn:false,land:0,phase:0,h:46},clock=0,wait=0;
  cc.seg('arc',v=>{sel=+v;t=0;});
  function note(){const a=A[sel];ro.innerHTML=`<b>${a.n}</b>: ${a.s} · covers <b>${a.dist.toFixed(1)} BL</b> of flat ground in ${Math.round(a.air*1000)} ms, apex ${a.top.toFixed(2)} BL · every arc is run at 1/120 s in its own game's units and drawn in body lengths (Celeste 1 BL = 11 px, Mega Man X about 34 px) [V, S7, S131; K; I]`;}note();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>{if(wait>0){wait-=d;if(wait<=0)t=0;}else{t+=d;if(t>=A[sel].air){t=A[sel].air;wait=.8;}}});note();
      SR.paper(c,W,H);c.strokeStyle='#ececec';c.lineWidth=1;for(let bl=1;bl<=4;bl++){c.beginPath();c.moveTo(L,Y(bl));c.lineTo(Rr,Y(bl));c.stroke();SR.text(c,bl+' BL',L-6,Y(bl)+4,{size:11,align:'right',col:SR.ink.grey,mono:true});}
      for(let bl=1;bl<=13;bl++){c.beginPath();c.moveTo(X(bl),B);c.lineTo(X(bl),Y(4.3));c.stroke();SR.text(c,bl,X(bl),B+16,{size:11,align:'center',col:SR.ink.grey,mono:true});}
      SR.text(c,'body lengths of flat ground',Rr,B+32,{size:11,align:'right',col:SR.ink.grey});c.fillStyle=SR.ink.ink;c.fillRect(L,B,Rr-L,3);
      A.forEach((a,i)=>{const on=i===sel;c.strokeStyle=a.col;c.lineWidth=on?3:1.5;c.setLineDash(on?[]:[5,4]);c.globalAlpha=on?1:.75;c.beginPath();a.pts.forEach((p,j)=>j?c.lineTo(X(p.x),Y(p.y)):c.moveTo(X(p.x),Y(p.y)));c.stroke();c.setLineDash([]);c.globalAlpha=1;
        SR.text(c,`${a.dist.toFixed(1)} BL`,X(a.dist)+(i%2?-4:4),B-6-(i%2?14:0),{size:10.5,col:a.col,align:i%2?'right':'left'});});
      const a=A[sel];let p=a.pts[0];for(const q of a.pts){if(q.t>=t){p=q;break;}p=q;}
      const vy=(p.y-(a.pts[Math.max(0,a.pts.indexOf(p)-1)]||p).y)*46/SR.DT;Pf.vy=-vy;Pf.onGround=t<=0||t>=a.air;pose=follow(pose,Pf,s,0);
      c.save();c.translate(X(p.x),Y(p.y));c.scale(BLy/46,BLy/46);SR.drawSamurai(c,pose,0,0,1,{flap:-.3,grip:1});c.restore();
      SR.text(c,a.n+' · '+a.s,L+4,Y(4.3)-4,{size:11.5,col:a.col,weight:600});}};});

// ======================================================================
// A6 glide, float and the cape: fall speed against the clock
// ======================================================================
reg('glide',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  const DROP=276;                                                                      // 6 BL
  const mk=()=>SR.makeCourse({width:1800,solids:[[0,SR.G-DROP,300,DROP+300],[300,SR.G,1500,300]]});
  let recs=[],poses=[],clock=0;
  function build(){const fm=cc.v('fm');cc.out('fm',fm.toFixed(2)+' x maxFall · '+Math.round(fm*1150)+' u/s');const Gl=SR.VERBS.glide,sv=Gl.fallMult;lp.reset();
    recs=[['fall (today)',{},1,SR.ink.ink],['glide 0.25 (Sandbox)',{glide:1},.25,SR.ink.red],['glide '+fm.toFixed(2)+' (slider)',{glide:1},fm,'#2458c9']].map(([n,set,mult,col])=>{Gl.fallMult=mult;const w=mk(),P=SR.newPlayerV(60,SR.G-DROP,set);P.vx=420;P.onGround=true;
      const r=recV(w,P,(t,Q)=>({right:true,jump:!Q.onGround}),{},4);const off=r.find(s=>!s.onGround),land=r.find(s=>off&&s.t>off.t&&s.onGround);return {n,r,col,fall:off&&land?land.t-off.t:null,x:off&&land?land.x-off.x:null};});
    Gl.fallMult=sv;
    const base=recs[0].fall;ro.innerHTML=recs.map(x=>`<b>${x.n}</b>: ${Math.round(x.fall*1000)} ms to the floor, ${x.x!=null?BLs(x.x)+' of ground':''}${x.fall>base+.001?' (<span class="bad">+'+Math.round((x.fall-base)*1000)+' ms</span>)':''}`).join(' · ')+` · a 1.3 s flight at 420 u/s is 550 u = 12 BL, the SMW cape's class; the fall is where the clock is decided [V, S15; K; I]`;}
  cc.on('fm',build);build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,Math.max(...recs.map(x=>x.r[x.r.length-1].t))));SR.paper(c,W,H);
      recs.forEach((x,i)=>{const S=at(x.r,lp.t);poses[i]=follow(poses[i]||SR.newPose(),S,s,clock);const x0=i*213,sc=.36,camx=240,camy=SR.G-DROP-60;
        c.save();c.beginPath();c.rect(x0,0,213,250);c.clip();c.setTransform(sc,0,0,sc,x0-camx*sc,-camy*sc);SR.drawSolids(c,mk(),{x:camx,y:camy},{VW:213/sc,start:false});SR.dim(c,280,SR.G-DROP,280,SR.G,'6 BL',{col:SR.ink.grey,ox:-30,size:14});
        trail(c,x.r,lp.t,2);drawS(c,S,poses[i],{});c.restore();c.setTransform(1,0,0,1,0,0);SR.plate(c,x.n,x0+8,20,{size:11,weight:600,col:x.col});SR.text(c,`vy ${Math.round(Math.max(0,S.vy))} u/s`,x0+8,240,{size:11,mono:true,col:x.col});c.fillStyle=SR.ink.grey2;c.fillRect(x0+212,0,1,250);});
      // the curves: fall speed against time since the edge
      const L=40,Rr=W-12,T=268,B=H-20,X=t=>L+t/1.2*(Rr-L),Y=v=>B-v/1200*(B-T);c.fillStyle=SR.ink.grey2;c.fillRect(0,250,W,1);
      c.strokeStyle='#ececec';for(const v of [288,575,1150]){c.beginPath();c.moveTo(L,Y(v));c.lineTo(Rr,Y(v));c.stroke();SR.text(c,v,L-4,Y(v)+4,{size:9.5,align:'right',col:SR.ink.grey,mono:true});}
      recs.forEach(x=>{const off=x.r.find(s=>!s.onGround);if(!off)return;c.strokeStyle=x.col;c.lineWidth=1.8;c.beginPath();let first=true;for(const p of x.r){if(p.t<off.t||p.t>lp.t)continue;if(p.onGround&&p.t>off.t+.05)break;const xx=X(p.t-off.t),yy=Y(Math.max(0,p.vy));first?c.moveTo(xx,yy):c.lineTo(xx,yy);first=false;}c.stroke();});
      SR.text(c,'fall speed u/s against seconds after the edge · 1.2 s',Rr,T-4,{size:10,align:'right',col:SR.ink.grey});}};});
}
{
const {C2,SC,K0,stepper,follow,drawP,recV,at,looper,drawS,trail,holdJump}=window.SRfig;
const still=()=>!motion||reduce;
const BLs=u=>(u/46).toFixed(1)+' BL';
// ======================================================================
// B1 crouch and crawl: the hitbox swap under a low corridor, "stand only if free"
// ======================================================================
reg('crouch',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=320,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  const CL=200;                                                                        // corridor length, 4.3 BL
  const mk=()=>SR.makeCourse({width:1600,solids:[[0,SR.G,1600,300],[500,SR.G-132,CL,100]]});
  let rec=[],pose=SR.newPose(),clock=0,note='';
  function build(){const crawl=cc.v('crawl');cc.out('crawl',crawl+' u/s · '+(crawl/420).toFixed(2)+' x maxRun');const sv=SR.VERBS.crouch.crawl;SR.VERBS.crouch.crawl=crawl;lp.reset();
    const keys=()=>{let pressed=false;return (t,P)=>{const k={right:true};if(P.x>=400&&P.x<560)k.down=true;if(P.x>=686&&P.verb.state==='crouch'&&!pressed){k.jumpPressed=true;pressed=true;}k.jump=P.x>=686&&P.x<760;return k;};};
    const w=mk(),P=SR.newPlayerV(60,SR.G,{crouch:1});P.vx=420;P.onGround=true;rec=recV(w,P,keys(),{},4);SR.VERBS.crouch.crawl=sv;
    const inn=rec.find(s=>s.x+SR.W>500),out=rec.find(s=>s.x>500+CL),rel=rec.find(s=>s.x>=560&&!s.keys.down&&s.verb.state==='crouch'),st=rec.find(s=>s.ev.some(e=>e.t==='verb'&&e.id==='stand')),jp=rec.find(s=>s.keys.jumpPressed),j=rec.find(s=>s.ev.some(e=>e.t==='jump'));
    note=`crouch 20x26 u (57%), feet fixed, head down 20 u · corridor ${CL} u at ${crawl} u/s: <b>${inn&&out?Math.round((out.t-inn.t)*1000)+' ms</b> under the ceiling':'…'} · Down released at x 560 under the ceiling: <b>kept crawling</b>, the 46 u box was not free · stood ${st&&rel?Math.round((st.t-rel.t)*1000)+' ms later':'…'} at the exit · jump pressed while pinned: fired <b>${j&&jp?Math.round((j.t-jp.t)*1000)+' ms</b> after the press, on the first free step':'not within the 130 ms buffer'} [K; I]`;ro.innerHTML=note;}
  cc.on('crawl',build);build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,rec[rec.length-1].t));const S=at(rec,lp.t);pose=follow(pose,S,s,clock);
      SR.paper(c,W,H);const sc=.8,camx=clamp(S.x-300,0,900),camy=SR.G-H/sc*.8;c.setTransform(sc,0,0,sc,-camx*sc,-camy*sc);SR.drawSolids(c,mk(),{x:camx,y:camy},{VW:W/sc,start:false});
      SR.dim(c,470,SR.G,470,SR.G-32,'32 u',{col:SR.ink.grey,ox:-26,size:11});SR.dim(c,500,SR.G+30,500+CL,SR.G+30,CL+' u = '+BLs(CL),{col:SR.ink.grey,size:11});
      c.fillStyle='rgba(208,40,31,.12)';c.fillRect(400,SR.G-4,160,8);SR.text(c,'Down held',400,SR.G+22,{size:10,col:SR.ink.red});
      trail(c,rec,lp.t,4);drawS(c,S,pose,{box:true,body:true});
      // the standing box the release tests, drawn when pinned
      if(S.verb.state==='crouch'&&!S.keys.down){SR.drawBox(c,[S.x,S.y+S.h-46,SR.W,46],SR.ink.red);SR.text(c,'46 u box not free: keep crawling',S.x+SR.W/2,S.y-30,{size:10.5,align:'center',col:SR.ink.red});}
      c.setTransform(1,0,0,1,0,0);SR.plate(c,`${S.verb.state} · box 20x${S.h} · ${Math.round(Math.abs(S.vx))} u/s${S.verb.jbuf>0?' · jump buffered':''}`,12,24,{size:12,mono:true,weight:600,col:S.h<46?SR.ink.red:SR.ink.ink});}};});

// ======================================================================
// B2 crouch-slide and slide-jump against the roll-jump hyper and a plain jump under a low ceiling
// ======================================================================
reg('slide',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  const GAP=200,CEIL=130;
  const flat=()=>SR.makeCourse({width:1800,deathY:SR.G+160,solids:[[0,SR.G,700,300],[700+GAP,SR.G,900,500],[680,SR.G-CEIL-130,420,130]]});
  const drop=()=>SR.makeCourse({width:1800,deathY:SR.G+160,solids:[[0,SR.G-240,530,540],[530,SR.G,170,300],[700+GAP,SR.G,900,500],[680,SR.G-CEIL-130,420,130]]});
  let recs=[],poses=[],clock=0;
  function build(){const fr=cc.v('fr');cc.out('fr',fr+' u/s²');const sv=SR.VERBS.slide.friction;SR.VERBS.slide.friction=fr;const len=420*420/(2*fr);lp.reset();
    const jumpAt=(P,k)=>{if(P.onGround&&P.x+SR.W>=690&&P.x<700){k.jumpPressed=true;}};
    const r1=(()=>{const w=flat(),P=SR.newPlayerV(60,SR.G,{crouch:1,slide:1,slideJump:1});P.vx=420;P.onGround=true;const x0=700-Math.min(len*.7,300);return recV(w,P,(t,Q)=>{const k={right:true};if(Q.x>=x0&&Q.onGround&&Q.verb.state!=='slide'&&Q.x<690)k.down=true;if(Q.verb.state==='slide')k.down=true;jumpAt(Q,k);return holdJump(k,Q);},{},3.5);})();
    const r2=(()=>{const w=drop(),P=SR.newPlayerV(60,SR.G-240,{});P.vx=420;P.onGround=true;return recV(w,P,(t,Q)=>{const k={right:true};if(Q.roll>0&&Q.onGround&&!Q.hyper)k.jumpPressed=true;return holdJump(k,Q);},{hyper:true},3.5);})();
    const r3=(()=>{const w=flat(),P=SR.newPlayerV(60,SR.G,{});P.vx=420;P.onGround=true;return recV(w,P,(t,Q)=>{const k={right:true};jumpAt(Q,k);return holdJump(k,Q);},{},3.5);})();
    SR.VERBS.slide.friction=sv;
    const info=r=>{const j=r.find(s=>s.ev.some(e=>e.t==='jump'||e.t==='hyper'));const reach=r.find(s=>s.x>=1100);return {vx:j?Math.round(j.vx):null,vy:j?Math.round(-j.vy):null,hy:j&&j.ev.some(e=>e.t==='hyper'),t:reach?reach.t:null,dead:r[r.length-1].dead,bonk:r.some(s=>s.ev.some(e=>e.t==='bonk'))};};
    recs=[{n:'slide-jump',r:r1,w:flat,col:SR.ink.red},{n:'roll-jump hyper (#1)',r:r2,w:drop,col:'#2458c9'},{n:'plain jump',r:r3,w:flat,col:SR.ink.ink}].map(x=>Object.assign(x,info(x.r)));
    const sl=r1.find(s=>s.ev.some(e=>e.t==='verb'&&e.id==='slide')),sj=r1.find(s=>s.ev.some(e=>e.t==='verb'&&e.id==='slideJump'));
    ro.innerHTML=`slide from 420 u/s at ${fr} u/s²: <b>${Math.round(len)} u = ${BLs(len)}</b> in ${(420/fr).toFixed(2)} s (147 u in 0.7 s at the proposed 600)${sl&&sj?' · slid '+Math.round((sj.t-sl.t)*1000)+' ms before the edge':''} · `+recs.map(x=>`<b>${x.n}</b> leaves at ${x.vx} x ${x.vy} u/s${x.dead?' <span class="bad">and falls</span>':x.bonk?' <span class="bad">bonks the 130 u ceiling</span>':x.t!=null?', reaches x 1100 at '+x.t.toFixed(2)+' s':''}`).join(' · ')+' · one "low body plus jump" rule: the slide-jump and the roll-jump hyper are the same pair [K; S4 A5; I]';}
  cc.on('fr',build);build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,Math.max(...recs.map(x=>x.r[x.r.length-1].t))));SR.paper(c,W,H);
      recs.forEach((x,i)=>{const S=at(x.r,lp.t);poses[i]=follow(poses[i]||SR.newPose(),S,s,clock);const y0=i*120,sc=.4,camx=clamp(S.x-260,0,1200),camy=SR.G-120/sc*.8;
        c.save();c.beginPath();c.rect(0,y0,W,120);c.clip();c.setTransform(sc,0,0,sc,-camx*sc,y0-camy*sc);SR.drawSolids(c,x.w(),{x:camx,y:camy},{VW:W/sc,start:false,death:true});
        SR.dim(c,700,SR.G+40,700+GAP,SR.G+40,BLs(GAP),{col:SR.ink.grey,size:14});if(i===0)SR.dim(c,1080,SR.G,1080,SR.G-CEIL,'130 u',{col:SR.ink.grey,ox:36,size:14});
        trail(c,x.r,lp.t,3);if(!S.dead)drawS(c,S,poses[i],{box:true,body:i===0});c.restore();c.setTransform(1,0,0,1,0,0);
        SR.plate(c,`${x.n}: ${Math.round(Math.abs(S.vx))} u/s · ${S.verb.state}${S.roll>0?' · roll':''}`,12,y0+20,{size:11.5,mono:true,weight:600,col:x.col});c.fillStyle=SR.ink.grey2;c.fillRect(0,y0+119,W,1);});}};});

// ======================================================================
// B3 Super Mario 64's launch table as arcs in body lengths
// ======================================================================
reg('longjump',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const BL64=160,G64=4;                                                                // 1 BL = 160 u, gravity 4 u per frame² at 30 Hz [V, S9, S13]
  const T=fv=>[{n:'jump',vy:42+.25*fv,fv,col:SR.ink.ink},{n:'double jump',vy:52+.25*fv,fv,col:SR.ink.grey},{n:'triple jump',vy:69,fv,col:'#c9971c'},{n:'backflip',vy:62,fv:-16,col:'#7a4fd6'},{n:'side flip',vy:62,fv:8,col:'#1f8a3a'},{n:'long jump',vy:30,fv:Math.min(48,fv*1.5),col:SR.ink.red}];
  function arc64(a){const pts=[];let x=0,y=0,vy=a.vy;for(let f=0;f<200;f++){pts.push({x:x/BL64,y:y/BL64});vy-=G64;y+=vy;x+=a.fv;if(y<0&&f>1)break;}return pts;}
  function arcSR(vx,vy){const pts=[];let x=0,y=0,v=vy;for(let i=0;i<400;i++){pts.push({x:x/46,y:y/46});v-=(v>0?2500:4125)*SR.DT;y+=v*SR.DT;x+=vx*SR.DT;if(y<0&&i>1)break;}return pts;}
  const CMP=[{n:'SpeedRunner jump',pts:arcSR(420,830),col:'#2458c9'},{n:'SpeedRunner slide-jump 546 x 622',pts:arcSR(546,622),col:'#2458c9'}];
  const L=46,Rr=W-14,B=300,BLx=(Rr-L)/8,BLy=58,X=bl=>L+bl*BLx,Y=bl=>B-bl*BLy;
  let arcs=[],sel=5,t=0,wait=0,clock=0,pose=SR.newPose(),Pf={vx:0,vy:0,onGround:false,wallDir:0,roll:0,flipOn:false,land:0,phase:0,h:46};
  function build(){const fv=cc.v('fv');cc.out('fv',fv+' u/f'+(fv>=32?' (run cap)':''));arcs=T(fv).map(a=>{a.pts=arc64(a);a.dist=a.pts[a.pts.length-1].x;a.top=Math.max(...a.pts.map(p=>p.y));a.frames=a.pts.length;return a;});t=0;
    const a=arcs[sel];ro.innerHTML=`<b>${a.n}</b>: vy ${a.vy.toFixed(1)}, forward ${a.fv.toFixed(1)} u per frame · height <b>${a.top.toFixed(2)} BL</b> (${Math.round(a.top*160)} u of 160 per Mario), ${a.dist.toFixed(1)} BL of ground in ${a.frames} frames at 30 Hz · ${arcs.map(b=>b.n+' '+b.top.toFixed(1)+' BL').join(', ')} · the long jump is 1.5x forward capped at 48 for 0.7 BL of height; SpeedRunner's slide-jump (dashed blue) is 1.3x at 0.75 jumpVel, inside SM64's x1.5 and Celeste's x1.25 [V, S9; K; I]`;}
  cc.on('fv',build);cc.seg('arc',v=>{sel=+v;build();});build();
  return {tick(dt){const s=still()?0:dt;clock+=s;const a=arcs[sel];run(s,d=>{if(wait>0){wait-=d;if(wait<=0)t=0;}else{t+=d;if(t>=a.frames/30){t=a.frames/30;wait=.8;}}});
      SR.paper(c,W,H);c.strokeStyle='#ececec';c.lineWidth=1;for(let bl=1;bl<=4;bl++){c.beginPath();c.moveTo(L,Y(bl));c.lineTo(Rr,Y(bl));c.stroke();SR.text(c,bl+' BL',L-6,Y(bl)+4,{size:11,align:'right',col:SR.ink.grey,mono:true});}
      for(let bl=-1;bl<=7;bl++){c.beginPath();c.moveTo(X(bl+1),B);c.lineTo(X(bl+1),Y(4.4));c.stroke();SR.text(c,bl,X(bl+1),B+16,{size:11,align:'center',col:SR.ink.grey,mono:true});}
      SR.text(c,'body lengths forward (Mario 160 u, the samurai 46 u)',Rr,B+32,{size:11,align:'right',col:SR.ink.grey});c.fillStyle=SR.ink.ink;c.fillRect(L,B,Rr-L,3);
      if(cc.v('cmp'))CMP.forEach((m,i)=>{c.strokeStyle=m.col;c.lineWidth=1.5;c.setLineDash([5,4]);c.beginPath();m.pts.forEach((p,j)=>j?c.lineTo(X(p.x+1),Y(p.y)):c.moveTo(X(p.x+1),Y(p.y)));c.stroke();c.setLineDash([]);const ap=m.pts.reduce((q,r)=>r.y>q.y?r:q);SR.text(c,m.n,X(ap.x+1)+(i?8:-8),Y(ap.y)+(i?14:-6),{size:10.5,col:m.col,align:i?'left':'right'});});
      arcs.forEach((b,i)=>{const on=i===sel;c.strokeStyle=b.col;c.lineWidth=on?3:1.5;c.globalAlpha=on?1:.6;c.beginPath();b.pts.forEach((p,j)=>j?c.lineTo(X(p.x+1),Y(p.y)):c.moveTo(X(p.x+1),Y(p.y)));c.stroke();c.globalAlpha=1;
        const ap=b.pts.reduce((q,r)=>r.y>q.y?r:q);if(on||b.n==='jump'||b.n==='long jump')SR.text(c,b.n,X(ap.x+1)+(b.fv<0?-6:6),Y(ap.y)+(on?-8:12),{size:10.5,col:b.col,align:b.fv<0?'right':'left',weight:on?600:500});});
      const f=Math.min(a.pts.length-1,Math.floor(t*30)),p=a.pts[f],q=a.pts[Math.max(0,f-1)];Pf.vy=-(p.y-q.y)*160*30;Pf.onGround=f<=0||f>=a.pts.length-1;pose=follow(pose,Pf,s,0);
      c.save();c.translate(X(p.x+1),Y(p.y));c.scale(BLy/46,BLy/46);SR.drawSamurai(c,pose,0,0,a.fv<0?-1:1,{flap:-.3,grip:1});c.restore();
      SR.text(c,'Super Mario 64 launch table, forwardVel '+cc.v('fv')+' [V, S9]',L+4,Y(4.4)-4,{size:11.5,col:SR.ink.red,weight:600});}};});

// ======================================================================
// B4 dive and belly flop: a lunge into a prone body with a landing bill, or a roll
// ======================================================================
reg('dive',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=320,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  const flat=()=>SR.makeCourse({width:1800,solids:[[0,SR.G,1800,300]]});
  const ledge=()=>SR.makeCourse({width:1800,solids:[[0,SR.G-260,400,560],[400,SR.G,1400,300]]});
  let recs=[],poses=[],clock=0;
  function build(){lp.reset();const vx=cc.v('vx'),pr=cc.v('prone');cc.out('vx',vx+' u/s · '+(vx/420).toFixed(2)+' x maxRun');cc.out('prone',Math.round(pr*1000/120)+' ms');const D=SR.VERBS.dive,sv={vx:D.vx,prone:D.prone};D.vx=vx;D.prone=pr;
    const mk=(w,feet,set,keys)=>{const P=SR.newPlayerV(60,feet,set);P.vx=420;P.onGround=true;return recV(w,P,keys,{},3.5);};
    const diveK=(t,Q)=>{const k={right:true};if(Q.onGround&&Q.x>=300&&Q.x<340&&Q.verb.state==='normal')k.jumpPressed=true;holdJump(k,Q);if(!Q.onGround&&Q.vy>-150&&Q.verb.state==='normal'&&!Q.verb.dove){k.jumpPressed=true;k.jump=true;}return k;};
    const jumpK=(t,Q)=>{const k={right:true};if(Q.onGround&&Q.x>=300&&Q.x<340)k.jumpPressed=true;return holdJump(k,Q);};
    const ledgeK=(t,Q)=>{const k={right:true};if(!Q.onGround&&Q.vy>0&&Q.vy<300&&Q.verb.state==='normal'&&!Q.verb.dove)k.jumpPressed=true;return k;};
    recs=[{n:'dive from a jump',r:mk(flat(),SR.G,{dive:1},diveK),w:flat,col:SR.ink.red},{n:'plain jump',r:mk(flat(),SR.G,{},jumpK),w:flat,col:SR.ink.ink},{n:'dive off a 260 u ledge',r:mk(ledge(),SR.G-260,{dive:1},ledgeK),w:ledge,col:'#2458c9'}];
    Object.assign(D,sv);
    const info=x=>{const r=x.r,reach=r.find(s=>s.x>=1200),pro=r.find(s=>s.ev.some(e=>e.t==='verb'&&e.id==='prone')),roll=r.find(s=>s.ev.some(e=>e.t==='roll')),lu=r.find(s=>s.ev.some(e=>e.t==='verb'&&e.id==='lunge'));Object.assign(x,{t:reach?reach.t:null,prone:!!pro,roll:!!roll,lvx:lu?Math.round(lu.vx):null});};recs.forEach(info);
    ro.innerHTML=recs.map(x=>`<b>${x.n}</b>: ${x.lvx?'lunges at '+x.lvx+' u/s after a 120 ms startup, ':''}${x.prone?'lands prone for '+Math.round(pr*1000/120)+' ms':x.roll?'lands in the roll and keeps speed':'lands and runs'}${x.t!=null?', reaches x 1200 at <b>'+x.t.toFixed(2)+' s</b>':''}`).join(' · ')+' · SM64 adds 15 to forwardVel capped 48 (x1.47 from a run) and lands in a dive slide; Fall Guys binds the dive to a second Jump press [V, S9, S137; I]';}
  ['vx','prone'].forEach(k=>cc.on(k,build));build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,Math.max(...recs.map(x=>x.r[x.r.length-1].t))));SR.paper(c,W,H);
      recs.forEach((x,i)=>{const S=at(x.r,lp.t);poses[i]=follow(poses[i]||SR.newPose(),S,s,clock);const y0=i*106,sc=.36,camx=clamp(S.x-240,0,1200),camy=SR.G-106/sc*.82;
        c.save();c.beginPath();c.rect(0,y0,W,106);c.clip();c.setTransform(sc,0,0,sc,-camx*sc,y0-camy*sc);SR.drawSolids(c,x.w(),{x:camx,y:camy},{VW:W/sc,start:false});
        c.fillStyle=SR.ink.grey2;c.fillRect(1200,SR.G-120,3,120);SR.text(c,'x 1200',1206,SR.G-100,{size:14,col:SR.ink.grey});trail(c,x.r,lp.t,3);drawS(c,S,poses[i],{box:true,body:true});c.restore();c.setTransform(1,0,0,1,0,0);
        const V=S.verb;SR.plate(c,`${x.n}: ${Math.round(Math.abs(S.vx))} u/s · ${V.state==='dive'&&V.t<14?'dive startup':V.state}${S.roll>0?' · roll':''}`,12,y0+18,{size:11,mono:true,weight:600,col:x.col});c.fillStyle=SR.ink.grey2;c.fillRect(0,y0+105,W,1);});}};});

// ======================================================================
// B5 ground pound, stomp and fast fall: Down in the air, two jobs
// ======================================================================
reg('pound',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root),lp=looper();
  const mk=()=>SR.makeCourse({width:1800,deathY:SR.G+400,solids:[[0,SR.G,500,500],[500,SR.G,100,60,'crate'],[500,SR.G+260,100,240],[600,SR.G,1200,500]]});
  let recs=[],poses=[],clock=0;
  function build(){lp.reset();const vmin=cc.v('vmin');cc.out('vmin',vmin+' u/s');const sv=SR.VERBS.stomp.vyMin;SR.VERBS.stomp.vyMin=vmin;
    const mk1=(set,keys)=>{const w=mk(),P=SR.newPlayerV(60,SR.G,set);P.vx=420;P.onGround=true;return {r:recV(w,P,keys,{},3.2),w};};
    const jumpAt=x=>(t,Q)=>{const k={right:true};if(Q.onGround&&Q.x>=x&&Q.x<x+40&&Q.verb.state==='normal')k.jumpPressed=true;return holdJump(k,Q);};
    const stompK=(t,Q)=>{const k=jumpAt(300)(t,Q);if(!Q.onGround&&Q.vy>-120)k.down=true;return k;};
    const poundK=(t,Q)=>{const k=jumpAt(400)(t,Q);if(!Q.onGround&&Q.vy>-120&&Q.x>470)k.down=true;if(Q.verb.state==='pound'||Q.verb.state==='poundLand')k.down=true;return k;};
    recs=[Object.assign({n:'plain jump',col:SR.ink.ink},mk1({},jumpAt(300))),Object.assign({n:'stomp (Down in the air)',col:SR.ink.red},mk1({stomp:1},stompK)),Object.assign({n:'ground pound',col:'#2458c9'},mk1({pound:1},poundK))];
    SR.VERBS.stomp.vyMin=sv;
    const info=x=>{const r=x.r,j=r.find(s=>s.ev.some(e=>e.t==='jump')),l=r.find(s=>j&&s.t>j.t&&s.ev.some(e=>e.t==='land'||e.t==='touch'||e.t==='roll'));const brk=r.find(s=>s.ev.some(e=>e.t==='break')),l2=r.find(s=>brk&&s.t>brk.t&&s.ev.some(e=>e.t==='land'||e.t==='touch'||e.t==='roll'));
      Object.assign(x,{air:j&&l?l.t-j.t:null,roll:l&&l.ev.some(e=>e.t==='roll'),fall:l?Math.round((l.ev.find(e=>e.fall!=null)||{}).fall||0):0,brk:!!brk,lag:brk?SR.VERBS.pound.land*1000/120:0,fall2:l2?Math.round((l2.ev.find(e=>e.fall!=null)||{}).fall||0):0});};recs.forEach(info);
    const base=recs[0].air;ro.innerHTML=recs.map(x=>`<b>${x.n}</b>: ${x.air!=null?'in the air '+Math.round(x.air*1000)+' ms':'…'}${x.air!=null&&base!=null&&x.air<base-.001?' (<span class="ok">'+Math.round((base-x.air)*1000)+' ms sooner</span>)':''}${x.brk?', breaks the crate, falls '+x.fall2+' u into a '+Math.round(x.lag)+' ms landing lag':x.roll?', a '+x.fall+' u fall feeds the roll':''}`).join(' · ')+` · the stomp keeps vx and sets vy to at least ${vmin} u/s; the pound zeroes vx, falls at maxFall 1150 and pays 150 ms, SM64's 10-frame hover is zero here [V, S10; K; I]`;}
  cc.on('vmin',build);build();
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>lp.adv(d,Math.max(...recs.map(x=>x.r[x.r.length-1].t))));SR.paper(c,W,H);
      recs.forEach((x,i)=>{const S=at(x.r,lp.t);poses[i]=follow(poses[i]||SR.newPose(),S,s,clock);const y0=i*120,sc=.36,camx=clamp(S.x-220,0,1200),camy=SR.G-120/sc*.7;
        // the crate is removed from this lane's world as the record plays: redraw it until the break
        const w=x.w,brk=x.r.find(q=>q.ev.some(e=>e.t==='break'));if(brk&&!w.solids.some(q=>q[4]==='crate')&&lp.t<brk.t)w.solids.push([500,SR.G,100,60,'crate']);if(brk&&lp.t>=brk.t){const k=w.solids.findIndex(q=>q[4]==='crate');if(k>=0)w.solids.splice(k,1);}
        c.save();c.beginPath();c.rect(0,y0,W,120);c.clip();c.setTransform(sc,0,0,sc,-camx*sc,y0-camy*sc);SR.drawSolids(c,w,{x:camx,y:camy},{VW:W/sc,start:false});
        trail(c,x.r,lp.t,3);drawS(c,S,poses[i],{});if(S.verb.stomp){c.fillStyle=SR.ink.red;c.fillRect(S.x+SR.W/2-1.5,S.y+S.h,3,22);}c.restore();c.setTransform(1,0,0,1,0,0);
        SR.plate(c,`${x.n}: vy ${Math.round(S.vy)} · ${S.verb.state}${S.verb.stomp?' · stomp':''}${S.roll>0?' · roll':''}`,12,y0+20,{size:11.5,mono:true,weight:600,col:x.col});c.fillStyle=SR.ink.grey2;c.fillRect(0,y0+119,W,1);});}};});
}
