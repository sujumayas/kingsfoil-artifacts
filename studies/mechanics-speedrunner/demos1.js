// SpeedRunner mechanics study: figures 1 (hero, timeline, A1 to A6, B1 to B5). Shared helpers live in core.js (SR).
{
const C2=cv=>cv.getContext('2d');
const still=()=>!motion||reduce;
const SC=640/970;                                   // canvas px per world unit: a 640 px canvas shows the game's 970 u view
const K0=()=>({left:false,right:false,jump:false,jumpPressed:false});
// fixed-step accumulator with the figure's slow-motion checkbox; returns the interpolation alpha
const stepper=root=>{let acc=0;return (dt,fn)=>{acc=Math.min(acc+dt*slowF(root),.1);while(acc>=SR.DT){fn(SR.DT);acc-=SR.DT;}return acc/SR.DT;};};
// pose follower: the rig chases the state's target pose with the 38 ms constant
const follow=(pose,P,dt,clock,tau)=>SR.blend(pose,SR.targetPose(P,clock),1-Math.exp(-dt/(tau||.038)));
const rotOf=P=>P.flipOn?P.flipDir*P.facing*P.flip*Math.PI*2:0;
function drawP(c,P,pose,alpha,o){const x=lerp(P.px,P.x,alpha)+SR.W/2,y=lerp(P.py,P.y,alpha)+SR.H;SR.drawSamurai(c,pose,x,y,P.facing,Object.assign({flap:P.flap,grip:P.grip,rot:rotOf(P)},o||{}));}
const GC=['#d9a066','#f2c14e','#4c9bff','#b45cff','#4ce04c'];
window.SRfig={C2,SC,K0,stepper,follow,drawP};        // for demos3.js

// ======================================================================
// HERO: a looping mini course through the real step, with a ghost of the previous loop
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,btns=$$('.hero-tiers button',root),m=meter(.1),run=stepper(root);
  const PRE=[{n:'Today',o:{}},
    {n:'Recommended',o:{tuning:{cornerCorrect:8,wallReach:7,wallRetain:.06,jumpHBoost:40,liftCapX:250,liftCapY:130},hyper:true,liftBoost:true}},
    {n:'No forgiveness',o:{coyote:false,buffer:false,jumpCut:false,apex:false,wallCoyote:false}},
    {n:'Floaty',o:{phys:Object.assign({},SR.PHYS,{gravity:1500,fallMult:1})}}];
  const w=SR.course('hero');let pre=0,P,st,pose,cam,parts=[],time=0,steps=0,mode='run',modeT=0,rec=[],ghost=[],best=null,split=null,splitT=0,loops=0,clock=0,lastT=null,deaths=0;
  const camO=()=>({mode:'lock',width:w.width,top:-220,floorView:SR.G,deathY:w.deathY});
  function start(){P=SR.newPlayer(w.start,w.startY);st={};pose=SR.newPose();parts=[];time=0;steps=0;mode='run';modeT=0;rec=[];for(const mv of w.movers){mv.cur=null;mv.prev=null;}cam=SR.newCam(0,0);SR.cam(cam,P,Object.assign(camO(),{snap:true}),0);}
  function setPre(i){pre=i;btns.forEach((b,j)=>b.classList.toggle('on',j===i));ghost=[];best=null;lastT=null;start();}
  btns.forEach((b,i)=>b.addEventListener('click',()=>setPre(i)));setPre(0);
  function sim(dt){if(mode==='run'){const k=SR.bot(P,w,st),ev=SR.step(P,k,dt,Object.assign({world:w,time},PRE[pre].o));time+=dt;steps++;SR.spawnDust(parts,ev);
      for(const e of ev){const ms=steps*1000/120;
        if(e.t==='check'){if(best)split={d:ms-best.cp};splitT=1.5;rec.cp=ms;}
        else if(e.t==='finish'){mode='done';modeT=0;lastT=ms;best={cp:rec.cp,total:ms};ghost=rec;loops++;}
        else if(e.t==='die'){mode='dead';modeT=0;deaths++;SR.dust(parts,P.x+SR.W/2,P.y+SR.H/2,22,0,-1,1.6);}}
      if(steps%4===0)rec.push({t:time,x:P.x+SR.W/2,y:P.y+SR.H,f:P.facing,ps:pose,flap:P.flap,grip:P.grip,rot:rotOf(P)});}
    else{modeT+=dt;if((mode==='dead'&&modeT>=.38)||(mode==='done'&&modeT>=.9))start();}
    SR.updParts(parts,dt);}
  return {tick(dt){m.t0();const s=still()?0:dt;clock+=s;const alpha=run(s,sim);if(mode==='run')pose=follow(pose,P,s,clock);SR.cam(cam,P,camO(),s);
      SR.paper(c,W,H);SR.view(c,cam,SC);SR.drawSolids(c,w,cam,{time,cpOn:P.cp});
      if(ghost.length){let g=ghost[ghost.length-1];for(let i=0;i<ghost.length;i++)if(ghost[i].t>time){g=ghost[Math.max(0,i-1)];break;}SR.drawSamurai(c,g.ps,g.x,g.y,g.f,{ghost:true,alpha:.4,flap:g.flap,grip:g.grip,rot:g.rot});}
      SR.drawParts(c,parts);if(mode!=='dead')drawP(c,P,pose,alpha,{clock});
      c.setTransform(1,0,0,1,0,0);SR.plate(c,SR.fmtT(steps*1000/120),W/2,34,{size:20,mono:true,align:'center',weight:600,pad:8});
      if(splitT>0&&split){splitT-=s;SR.text(c,SR.fmtD(split.d),W/2,58,{size:14,mono:true,align:'center',weight:600,col:split.d<0?SR.ls.aheadG:SR.ls.behindL});}
      if(mode==='done')SR.plate(c,'FINISH  '+SR.fmtT(lastT),W/2,H/2,{size:18,mono:true,align:'center',weight:600,pad:8});
      if(mode==='dead')SR.plate(c,'dead · restart in 0.38 s, no countdown',W/2,H/2,{size:13,align:'center',col:SR.ink.red,pad:6});
      SR.text(c,PRE[pre].n,12,H-12,{size:12,col:SR.ink.grey});
      SR.text(c,(lastT!=null?'last '+SR.fmtT(lastT)+' · ':'')+'loops '+loops+' · deaths '+deaths,W-12,H-12,{size:12,align:'right',col:SR.ink.grey,mono:true});
      setHud(root,fms(m.t1())+' ms JS · 1/120 s step');}};});

// ======================================================================
// §3 timeline
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const X=y=>1.5+(y-1982)/45*95;
  let h='<div class="tl-axis">';for(const y of [1985,1995,2005,2015,2026])h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
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
  const pick=items.find(i=>/Celeste/.test(i.e.h)&&/coyote/.test(i.e.h))||items[0];show(pick.id);return {};});

// ======================================================================
// A1 jump arc: the gravity rule of step(), vertical only, against time
// ======================================================================
reg('jumparc',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const S=()=>({jv:cc.v('jv'),g:cc.v('g'),fm:cc.v('fm'),am:cc.v('am'),jc:cc.v('jc')});
  function arc(s,release){const pts=[{t:0,y:0}];let vy=-s.jv,y=0,t=0,cut=false,apexT=0,h=0,i=0;
    for(;i<600;i++){const held=t<release;if(!cut&&!held&&vy<0){vy*=s.jc;cut=true;}let g=s.g;if(vy>0)g*=s.fm;else if(Math.abs(vy)<SR.PHYS.apexBand&&held)g*=s.am;vy+=g*SR.DT;y+=vy*SR.DT;t+=SR.DT;
      if(y>=0){pts.push({t,y:0});break;}pts.push({t,y:-y});if(-y>h){h=-y;apexT=t;}}
    return {pts,h,apexT,total:t};}
  // 6a arcs in body lengths against time (Celeste 1 BL = 11 px, SMB1 1 BL = 16 px, N++ 1 BL = the 20 px ninja [I])
  function ballistic(v0,gUp,gDown,pin){const pts=[];let y=0,v=v0,t=0;for(let i=0;i<800&&(i===0||y>0);i++){pts.push({t,y});if(t<pin)y+=v0*SR.DT;else{v-=(v>0?gUp:gDown)*SR.DT;y+=v*SR.DT;}t+=SR.DT;}pts.push({t,y:0});return pts;}
  const CMP=[{n:'Celeste, pinned 0.2 s',pts:ballistic(105/11,900/11,900/11,.2),col:'#2458c9'},
    {n:'SMB1, fall x3.5',pts:ballistic(2*4.2/.444,2*4.2/(.444*.444),3.5*2*4.2/(.444*.444),0),col:'#1f8a3a'},
    {n:'N++ held, 6:1 gravity',pts:ballistic(2*4.8/1.125,2*4.8/(1.125*1.125),6*2*4.8/(1.125*1.125),0),col:'#9a9a9a'}];
  const L=54,Rr=W-16,B=296,T0=1.3,BLpx=48,X=t=>L+t/T0*(Rr-L),Y=bl=>B-bl*BLpx;
  let t=0,wait=0,live=null,pose=SR.newPose(),Pf={vx:420,vy:0,onGround:false,wallDir:0,roll:0,flipOn:false,land:0,phase:0};
  const relOf=()=>{const v=cc.segv('hold');return v==='held'?Infinity:v==='tap'?SR.DT*.5:.1;};
  let cur=arc(S(),relOf()),ro2=null;
  const refresh=()=>{cur=arc(S(),relOf());t=0;wait=0;['jv','g','fm','am','jc'].forEach(k=>cc.out(k,String(cc.v(k))));
    const s=S(),noband=arc(Object.assign({},s,{am:1}),relOf());const fall=cur.total-cur.apexT;
    ro.innerHTML=`height <b>${(cur.h/46).toFixed(2)} BL</b> (${Math.round(cur.h)} u) · apex <b>${Math.round(cur.apexT*1000)} ms</b> (${Math.round(noband.apexT*1000)} without the band) · fall <b>${Math.round(fall*1000)} ms</b> · air ${Math.round(cur.total*1000)} ms · ${(420*cur.total/46).toFixed(1)} BL of ground at 420 u/s`;};
  ['jv','g','fm','am','jc'].forEach(k=>cc.on(k,refresh));cc.seg('hold',refresh);cc.on('cmp',()=>{});refresh();
  const pb=cc.btn('press',()=>{});
  const down=e=>{e.preventDefault();live={t0:0,rel:Infinity,arc:null};live.arc=arc(S(),Infinity);t=0;};
  const up=()=>{if(live&&live.rel===Infinity){live.rel=Math.max(SR.DT*.5,t);live.arc=arc(S(),live.rel);}};
  pb.addEventListener('pointerdown',down);pb.addEventListener('pointerup',up);pb.addEventListener('pointerleave',up);pb.addEventListener('pointercancel',up);
  function plot(pts,col,w,dash){c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash||[]);c.beginPath();pts.forEach((p,i)=>{const x=X(p.t),y=Y(p.y/46);i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();c.setLineDash([]);}
  return {tick(dt){const s=still()?0:dt;run(s,d=>{if(live&&live.rel===Infinity){t+=d;if(live.arc.pts[live.arc.pts.length-1].t<t+.2)live.arc=arc(S(),Infinity);}
      else if(wait>0){wait-=d;if(wait<=0){t=0;if(live&&live.rel<Infinity)live=null;}}else{t+=d;const A=live?live.arc:cur;if(t>=A.total){t=A.total;wait=.7;}}});
    SR.paper(c,W,H);
    // grid in body lengths and 100 ms
    c.strokeStyle='#ececec';c.lineWidth=1;for(let bl=1;bl<=5;bl++){c.beginPath();c.moveTo(L,Y(bl));c.lineTo(Rr,Y(bl));c.stroke();SR.text(c,bl+' BL',L-6,Y(bl)+4,{size:11,align:'right',col:SR.ink.grey,mono:true});}
    for(let ms=100;ms<=1300;ms+=100){const x=X(ms/1000);c.beginPath();c.moveTo(x,B);c.lineTo(x,Y(5.2));c.stroke();if(ms%200===0)SR.text(c,ms,x,B+16,{size:11,align:'center',col:SR.ink.grey,mono:true});}
    SR.text(c,'ms after the press',Rr,B+32,{size:11,align:'right',col:SR.ink.grey});
    c.fillStyle=SR.ink.ink;c.fillRect(L,B,Rr-L,3);
    if(cc.v('cmp'))CMP.forEach((m,i)=>{plot(m.pts.map(p=>({t:p.t,y:p.y*46})),m.col,1.5,[5,4]);const ap=m.pts.reduce((a,b)=>b.y>a.y?b:a);const right=X(ap.t)>W-150;SR.text(c,m.n,X(ap.t)+(right?-6:6),Y(ap.y)+(i===0?16:-6),{size:11,col:m.col,align:right?'right':'left'});});
    const A=live?live.arc:cur;plot(A.pts,SR.ink.red,2.5);
    // apex marker
    c.fillStyle=SR.ink.red;c.beginPath();c.arc(X(A.apexT),Y(A.h/46),3.5,0,Math.PI*2);c.fill();
    SR.text(c,`${(A.h/46).toFixed(1)} BL at ${Math.round(A.apexT*1000)} ms`,X(A.apexT)+8,Y(A.h/46)+4,{size:11.5,col:SR.ink.red,weight:600});
    SR.dim(c,X(A.total),B+8,X(0),B+8,null,{col:SR.ink.grey});
    // the samurai along the arc
    const tt=Math.min(t,A.total);let yy=0,vy=0;for(let i=1;i<A.pts.length;i++)if(A.pts[i].t>=tt){const a=A.pts[i-1],b=A.pts[i],k=(tt-a.t)/((b.t-a.t)||1);yy=lerp(a.y,b.y,k);vy=(a.y-b.y)/SR.DT;break;}
    Pf.vy=vy;Pf.onGround=tt<=0||tt>=A.total;pose=follow(pose,Pf,s,0);
    c.save();c.translate(X(tt),Y(yy/46));c.scale(BLpx/46,BLpx/46);SR.drawSamurai(c,pose,0,0,1,{flap:-.3,grip:1});c.restore();
    if(live)SR.plate(c,live.rel===Infinity?'holding…':`held ${Math.round(live.rel*1000)} ms`,W-16,30,{size:12,align:'right',mono:true});
    SR.text(c,'SpeedRunner, the gravity rule stepped at 1/120 s',L+4,Y(5.2)-4,{size:11.5,col:SR.ink.red,weight:600});}};});

// ======================================================================
// A2 forgiveness: press timing at a ledge; a corner clip and a ledge lip
// ======================================================================
reg('forgiveness',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=320,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const scale=640/700;const VWf=W/scale;
  const edgeW=()=>SR.makeCourse({width:1200,deathY:720,solids:[[0,480,240,400],[300,SR.G,100,300],[550,SR.G,650,300]]});
  const cornerW=()=>{const clip=cc.v('clip'),lip=cc.v('lip');return SR.makeCourse({width:1300,deathY:800,solids:[[0,SR.G,700,300],[cornerX()+clip-80,340,80,120],[700,SR.G-lip,600,300+lip]]});};
  // dry run of the jump with no block: the body's left x on the first step its head is above the block's underside (y 460)
  function cornerX(){const w0=SR.makeCourse({width:1300,solids:[[0,SR.G,700,300]]}),Q=SR.newPlayer(120,SR.G);Q.vx=420;let t=0,j=false;for(let i=0;i<300;i++){const k={right:true};if(!j&&Q.x>=300&&Q.onGround){k.jumpPressed=true;j=true;}k.jump=j;SR.step(Q,k,SR.DT,{world:w0,time:t});t+=SR.DT;if(j&&Q.y<460)return Q.x;}return 354;}
  let scene='edge',w=edgeW(),P,pose,parts,time,keys,fired=null,done=0,result='',tLand=null,tEdge=null,clock=0,cam={x:0,y:SR.G-H/scale*.78},jumped=false,bonk=null,lipRes='';
  const opts=()=>({world:w,time,coyote:cc.v('coyote'),buffer:cc.v('buffer'),tuning:{cornerCorrect:cc.v('cc')?8:0}});
  // dry run: when does the samurai land on the ledge and leave its edge, with no press
  function dry(){const Q=SR.newPlayer(120,480);Q.vx=420;let t=0,land=null,edge=null;for(let i=0;i<300;i++){const ev=SR.step(Q,{right:true},SR.DT,{world:w,time:t});t+=SR.DT;
      for(const e of ev)if((e.t==='land'||e.t==='touch')&&land==null&&Q.x>280)land=t;if(land!=null&&edge==null&&!Q.onGround&&Q.x>380)edge=t;if(edge!=null)break;}return {land,edge};}
  function reset(){w=scene==='edge'?edgeW():cornerW();P=SR.newPlayer(120,scene==='edge'?480:SR.G);P.vx=420;pose=SR.newPose();parts=[];time=0;fired=null;done=0;result='';jumped=false;bonk=null;lipRes='';
    if(scene==='edge'){const d=dry();tLand=d.land;tEdge=d.edge;}}
  reset();
  const showCtl=()=>{$$('[data-for]',root).forEach(l=>l.hidden=l.dataset.for!==scene);};showCtl();
  cc.seg('scene',v=>{scene=v;showCtl();reset();});
  cc.on('press',()=>{cc.out('press',(cc.v('press')>=0?'+':'')+cc.v('press')+' ms');reset();});cc.on('clip',()=>{cc.out('clip',cc.v('clip')+' u');reset();});cc.on('lip',()=>{cc.out('lip',cc.v('lip')+' u');reset();});
  ['coyote','buffer','cc'].forEach(k=>cc.on(k,reset));
  function sim(dt){if(done>0){done-=dt;if(done<=0)reset();return;}
    const k=K0();k.right=true;
    if(scene==='edge'){const pt=tEdge+cc.v('press')/1000;if(fired==null&&time<=pt&&time+dt>pt){k.jumpPressed=true;fired={t:pt,state:P.onGround?'ground':(time<tLand?'air before landing':'air after the edge')};}k.jump=!!fired&&time<fired.t+.35;}
    else{if(!jumped&&P.x>=300&&P.onGround){k.jumpPressed=true;jumped=true;}k.jump=jumped&&time<2;}
    const ev=SR.step(P,k,dt,opts());time+=dt;SR.spawnDust(parts,ev);
    for(const e of ev){if(e.t==='jump'&&fired&&!fired.at){fired.at=time;const late=(time-tEdge)*1000;fired.how=P.px>0&&fired.state==='ground'?'on the ledge':(late>0?'coyote time, '+Math.round(late)+' ms after the edge':'the buffer, kept '+Math.round((tLand-fired.t)*1000)+' ms until the landing');}
      if(e.t==='corner')bonk={kind:e.kind,n:e.n};if(e.t==='bonk'&&!bonk)bonk={kind:'bonk'};
      if(e.t==='die'){done=1.2;result=scene==='edge'?(fired&&fired.at?'jumped from '+fired.how+' but fell':'no jump fired: the press came '+Math.round((fired?fired.t-tEdge:0)*1000)+' ms after the edge, outside the windows'):'fell';}}
    if(scene==='edge'&&!done&&P.onGround&&P.x>560){done=1.2;result='cleared the gap. Jump fired through '+(fired&&fired.how||'?');}
    if(scene==='corner'&&!done){if(P.x>=680&&P.onGround&&Math.abs(P.vx)<1){lipRes='stopped dead by a '+cc.v('lip')+' u lip';done=1.4;}if(P.x>1100){lipRes=P.y+SR.H<SR.G-1?'stepped up the '+cc.v('lip')+' u lip and ran on':'ran on';done=.8;}}
    SR.updParts(parts,dt);}
  return {tick(dt){const s=still()?0:dt;clock+=s;const alpha=run(s,sim);pose=follow(pose,P,s,clock);
      cam.x=scene==='edge'?0:clamp(P.x-250,0,700);
      SR.paper(c,W,H);SR.view(c,cam,scale);SR.drawSolids(c,w,cam,{VW:VWf,death:true,start:false});
      if(scene==='edge'){c.fillStyle='rgba(208,40,31,.18)';c.fillRect(400,SR.G-2,150,8);}
      SR.drawParts(c,parts);if(!P.dead)drawP(c,P,pose,alpha,{clock});
      c.setTransform(1,0,0,1,0,0);
      if(scene==='edge'){// the window timeline
        const L=40,Rr=W-20,y0=H-46,Xm=ms=>L+(ms+300)/480*(Rr-L);c.fillStyle='#f1f1f1';c.fillRect(L,y0-14,Rr-L,28);
        const landMs=(tLand-tEdge)*1000;
        if(cc.v('buffer'))SR.band(c,Xm(landMs-130),y0-14,Xm(landMs)-Xm(landMs-130),28,'rgba(36,88,201,.22)');
        SR.band(c,Xm(landMs),y0-14,Xm(0)-Xm(landMs),28,'rgba(10,10,10,.12)');
        if(cc.v('coyote'))SR.band(c,Xm(0),y0-14,Xm(100)-Xm(0),28,'rgba(31,138,58,.25)');
        SR.band(c,Xm(cc.v('coyote')?100:0),y0-14,Rr-Xm(cc.v('coyote')?100:0),28,'rgba(208,40,31,.14)');
        c.fillStyle=SR.ink.ink;c.fillRect(Xm(0)-1,y0-18,2,36);c.fillRect(Xm(landMs)-1,y0-18,2,36);
        SR.text(c,'landing',Xm(landMs),y0-22,{size:10.5,align:'center',col:SR.ink.grey});SR.text(c,'edge',Xm(0),y0-22,{size:10.5,align:'center',col:SR.ink.grey});
        if(cc.v('buffer'))SR.text(c,'buffer 130 ms',Xm(landMs-65),y0+4,{size:10.5,align:'center',col:'#2458c9'});SR.text(c,'on the ledge',Xm(landMs/2),y0+4,{size:10.5,align:'center',col:SR.ink.ink});
        if(cc.v('coyote'))SR.text(c,'coyote 100 ms',Xm(50),y0+4,{size:10.5,align:'center',col:SR.ink.green});SR.text(c,'too late',Xm(140),y0+4,{size:10.5,align:'center',col:SR.ink.red});
        const px=Xm(cc.v('press'));c.fillStyle=SR.ink.red;c.beginPath();c.moveTo(px,y0-20);c.lineTo(px-6,y0-30);c.lineTo(px+6,y0-30);c.closePath();c.fill();SR.text(c,'press',px,y0-33,{size:10.5,align:'center',col:SR.ink.red,weight:600});
        const now=Xm(clamp((time-tEdge)*1000,-300,180));c.fillStyle=SR.ink.ink;c.fillRect(now-.5,y0-14,1,28);
        SR.text(c,'-300',L,y0+26,{size:10,col:SR.ink.grey,mono:true});SR.text(c,'+180 ms',Rr,y0+26,{size:10,align:'right',col:SR.ink.grey,mono:true});
        ro.innerHTML=(result?`<b>${result}</b>`:(fired&&fired.at?`jump fired through <b>${fired.how}</b>`:'running…'))+` · landing ${Math.round(landMs)} ms before the edge`;}
      else{SR.plate(c,'jump at x 300 · block edge clips the rising head by '+cc.v('clip')+' u · lip '+cc.v('lip')+' u',W/2,24,{size:12,align:'center'});
        const msg=bonk?(bonk.kind==='ceiling'?`nudged ${Math.abs(bonk.n)} u ${bonk.n>0?'right':'left'}, the jump continues`:bonk.kind==='ledge'?`stepped up ${Math.round(bonk.n)} u`:'bonk: the jump stops dead'):'';
        ro.innerHTML=`${msg?'ceiling: <b>'+msg+'</b>':'rising…'}${lipRes?' · lip: <b>'+lipRes+'</b>':''} · corner correction ${cc.v('cc')?'8 u':'off (today)'}`;}}};});
}
{
const {C2,SC,K0,stepper,follow,drawP}=window.SRfig;
const still=()=>!motion||reduce;
// record a scripted run through SR.step: an array of shallow player snapshots per step
function record(w,P,keysAt,o,T,extra){const out=[];for(let i=0;i<T/SR.DT;i++){let t=i*SR.DT;const k=keysAt(t,P,i);const ev=SR.step(P,k,SR.DT,Object.assign({world:w,time:t},o||{}));t=(i+1)*SR.DT;const snap=Object.assign({},P,{t,ev:ev.filter(e=>e.t!=='dust')});if(extra)extra(snap,P);out.push(snap);if(P.dead)break;}return out;}
const at=(rec,t)=>rec[Math.min(rec.length-1,Math.max(0,Math.floor(t/SR.DT)))];
// ======================================================================
// A3 momentum: speed against time under the game's horizontal rules
// ======================================================================
reg('momentum',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=320,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const flat=()=>SR.makeCourse({width:4000,solids:[[0,SR.G,4000,300]]});
  const SCN={
    accel:{T:1.3,keys:t=>({right:t<.8}),note:r=>{const up=r.find(s=>s.vx>=419.9),dn=r.find(s=>s.t>.8&&Math.abs(s.vx)<.5);return `0 to 420 u/s in <b>${Math.round(up.t*1000)} ms</b> (groundAccel 2700, 19 steps) · 420 to 0 in <b>${Math.round((dn.t-.8)*1000)} ms</b> (groundFric 3000, 17 steps)`;}},
    turn:{T:1.6,keys:t=>({right:t<.6,left:t>=.6}),note:r=>{const rev=r.find(s=>s.t>.6&&s.vx<=-419.9),z=r.find(s=>s.t>.6&&s.vx<=0);return `reversal on the ground: 420 to 0 in <b>${Math.round((z.t-.6)*1000)} ms</b>, to -420 in <b>${Math.round((rev.t-.6)*1000)} ms</b> (turnAccel 5200)`;}},
    over:{T:1.3,keys:()=>({right:true}),init:P=>{P.vx=700;},note:r=>{const d=r.find(s=>s.vx<=420.5);return `700 to 420 u/s in <b>${Math.round(d.t*1000)} ms</b> at overspeedDecay 500 u/s², 0.19x groundAccel · Celeste RunReduce 400 against RunAccel 1000 bleeds 260 to 90 px/s in 0.43 s`;}},
    air:{T:1.7,keys:(t,P,i)=>({right:t<.5,left:t>=.5,jumpPressed:i===Math.round(.4/SR.DT),jump:t>=.4&&t<.75}),note:r=>{const z=r.find(s=>s.t>.5&&s.vx<=0),l=r.find(s=>s.t>.5&&s.onGround);return `air reversal: 420 to 0 in <b>${Math.round((z.t-.5)*1000)} ms</b> at airAccel 1900 (ground turn ${Math.round(420/5200*1000)} ms, grey) · landed at ${l?l.vx.toFixed(0):'?'} u/s`;}},
    boost:{T:1.8,mover:true,keys:(t,P,i)=>({right:true,jumpPressed:i===Math.round(.5/SR.DT),jump:t>=.5&&t<.9}),note:(r,g)=>{const j=r.find(s=>s.ev.some(e=>e.t==='jump')),j0=g.find(s=>s.ev.some(e=>e.t==='jump'));const l=r.find(s=>s.t>.7&&s.onGround),l0=g.find(s=>s.t>.7&&s.onGround);return `jump off a mover carrying 150 u/s: leaves at <b>${j?Math.round(j.vx):'?'} u/s</b> with the toggles, ${j0?Math.round(j0.vx):'?'} without (grey) · lands ${l&&l0?Math.round(l.x-l0.x):'?'} u further`;}}};
  let sc='accel',rec=[],rec0=[],t=0,pose=SR.newPose(),pose0=SR.newPose(),clock=0,wait=0;
  function build(){const S=SCN[sc],mk=(o)=>{const w=flat();if(S.mover){w.solids=[[0,SR.G,300,300],[1200,SR.G,2800,300]];w.movers=[{x0:300,y0:SR.G-18,x1:900,y1:SR.G-18,w:200,h:18,period:4,phase:.75}];}
      const P=SR.newPlayer(S.mover?360:60,SR.G-(S.mover?18:0));if(S.init)S.init(P);P.onGround=true;if(S.mover){SR.updMovers(w,null,0,SR.DT);P.support=w.movers[0].cur;}return record(w,P,S.keys,o,S.T);};
    rec=mk({tuning:{jumpHBoost:cc.v('jb')&&sc==='boost'?40:0,liftCapX:250,liftCapY:130},liftBoost:cc.v('lb')&&sc==='boost'});
    rec0=sc==='air'?(()=>{const w=flat(),P=SR.newPlayer(60,SR.G);P.onGround=true;return record(w,P,tt=>({right:tt<.5,left:tt>=.5}),{},SCN[sc].T);})():sc==='boost'?mk({}):null;
    t=0;wait=0;ro.innerHTML=SCN[sc].note(rec,rec0||rec);}
  cc.seg('sc',v=>{sc=v;build();});cc.on('jb',build);cc.on('lb',build);build();
  const L=50,Rr=W-14,T0=130,B=292,Y=v=>B-(v+500)/1250*(B-T0),X=tt=>L+tt/SCN[sc].T*(Rr-L);
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>{if(wait>0){wait-=d;if(wait<=0)t=0;}else{t+=d;if(t>=rec[rec.length-1].t){t=rec[rec.length-1].t;wait=.8;}}});
      const S=at(rec,t),S0=rec0?at(rec0,t):null;pose=follow(pose,S,s,clock);if(S0)pose0=follow(pose0,S0,s,clock);
      SR.paper(c,W,H);
      // strip: the course scrolls so the runner stays in view
      const sc2=.5,camx=clamp(S.x-200,0,3000);c.save();c.translate(0,0);c.beginPath();c.rect(0,0,W,118);c.clip();c.setTransform(sc2,0,0,sc2,-camx*sc2,-(SR.G-200)*sc2);
      const w=flat();if(SCN[sc].mover){w.solids=[[0,SR.G,300,300],[1200,SR.G,2800,300]];w.movers=[{x0:300,y0:SR.G-18,x1:900,y1:SR.G-18,w:200,h:18,period:4,phase:.75}];SR.updMovers(w,null,t,SR.DT);}
      SR.drawSolids(c,w,{x:camx,y:0},{VW:W/sc2,time:t,start:false});
      if(S0)SR.drawSamurai(c,pose0,S0.x+SR.W/2,S0.y+SR.H,S0.facing,{ghost:true,alpha:.45,flap:S0.flap,grip:S0.grip});
      SR.drawSamurai(c,pose,S.x+SR.W/2,S.y+SR.H,S.facing,{flap:S.flap,grip:S.grip});c.restore();c.setTransform(1,0,0,1,0,0);
      SR.plate(c,`${Math.round(S.vx)} u/s`,S.x*sc2-camx*sc2+10,38,{size:12,mono:true,align:'center',weight:600});
      // chart
      c.strokeStyle='#ececec';c.lineWidth=1;for(const v of [-420,0,420,700]){c.beginPath();c.moveTo(L,Y(v));c.lineTo(Rr,Y(v));c.stroke();SR.text(c,v,L-6,Y(v)+4,{size:10.5,align:'right',col:SR.ink.grey,mono:true});}
      c.strokeStyle=SR.ink.ink;c.beginPath();c.moveTo(L,Y(0));c.lineTo(Rr,Y(0));c.stroke();
      SR.text(c,'u/s',L-6,T0-4,{size:10.5,align:'right',col:SR.ink.grey});SR.text(c,SCN[sc].T.toFixed(1)+' s',Rr,B+14,{size:10.5,align:'right',col:SR.ink.grey,mono:true});
      c.setLineDash([4,3]);c.strokeStyle=SR.ink.grey2;c.beginPath();c.moveTo(L,Y(420));c.lineTo(Rr,Y(420));c.stroke();c.setLineDash([]);SR.text(c,'maxRun 420',Rr-4,Y(420)-4,{size:10.5,align:'right',col:SR.ink.grey});
      const plot=(r,col,wd)=>{c.strokeStyle=col;c.lineWidth=wd;c.beginPath();r.forEach((p,i)=>{i?c.lineTo(X(p.t),Y(p.vx)):c.moveTo(X(p.t),Y(p.vx));});c.stroke();};
      if(rec0)plot(rec0,SR.ink.grey,1.5);plot(rec,SR.ink.red,2.2);
      rec.forEach(p=>{for(const e of p.ev){if(e.t==='jump')SR.text(c,'jump',X(p.t),Y(p.vx)-10,{size:10.5,align:'center',col:SR.ink.ink});if(e.t==='land')SR.text(c,'land',X(p.t),Y(p.vx)+16,{size:10.5,align:'center',col:SR.ink.ink});}});
      c.fillStyle=SR.ink.ink;c.fillRect(X(t)-.5,T0,1,B-T0);c.fillStyle=SR.ink.red;c.beginPath();c.arc(X(t),Y(S.vx),3.5,0,Math.PI*2);c.fill();}};});

// ======================================================================
// A4 wall kit
// ======================================================================
reg('wallkit',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const w=SR.makeCourse({width:1000,solids:[[0,SR.G,1000,300],[640,60,360,540]]});const scale=640/640,cam={x:120,y:SR.G-H/scale*.88};
  let kind='away',P,pose,parts,time,trail,ph,wallT,leftT,result,done,clock=0,slide=[],pressed=0;
  const opts=()=>({world:w,time,slideRamp:cc.segv('slide')==='ramp'});
  function reset(){P=SR.newPlayer(250,SR.G);P.vx=420;pose=SR.newPose();parts=[];time=0;trail=[];ph='run';wallT=null;leftT=null;result='';done=0;slide=[];pressed=0;}reset();
  cc.seg('kind',v=>{kind=v;reset();});cc.seg('slide',reset);cc.on('hold',()=>{cc.out('hold',cc.v('hold')+' ms');reset();});cc.on('late',()=>{cc.out('late',cc.v('late')+' ms');reset();});
  function sim(dt){if(done>0){done-=dt;if(done<=0)reset();return;}const k=K0();const hold=cc.v('hold')/1000,late=cc.v('late')/1000;
    if(ph==='run'){k.right=true;if(P.onGround&&P.x>=470){k.jumpPressed=true;ph='fly';}}
    else if(ph==='fly'){k.right=true;k.jump=true;if(P.wallDir===1&&P.vy>0){ph='slide';wallT=time;}}
    else if(ph==='slide'){const on=time-wallT;slide.push({t:on,vy:P.vy});
      if(kind==='climb')k.right=true;
      if(kind==='coyote'){if(on>=hold){k.left=true;if(P.wallDir===0&&leftT==null)leftT=time;if(leftT!=null&&time-leftT>=late&&!pressed){k.jumpPressed=true;pressed=1;ph='after';}}}
      else if(on>=hold){k.jumpPressed=true;pressed=1;ph='after';if(kind==='same'){ph='back';}}}
    else if(ph==='back'){k.right=P.wallLock<=0;if(P.wallDir===1&&P.vy>0&&P.lastWJ===1&&pressed===1){k.jumpPressed=true;pressed=2;ph='after';}k.jump=false;}
    else if(ph==='after'){if(kind==='coyote')k.left=true;}
    const ev=SR.step(P,k,dt,opts());time+=dt;SR.spawnDust(parts,ev);if(!P.onGround||ph==='run')trail.push({x:P.x+SR.W/2,y:P.y+SR.H});
    for(const e of ev){if(e.t==='wall'||e.t==='climb'){const vy=Math.abs(P.vy),vx=Math.abs(P.vx);result=`${e.t==='climb'?'climb jump':'wall jump'}${e.same?' on the same wall':''}: ${Math.round(vx)} u/s out, ${Math.round(vy)} u/s up, apex ${(vy*vy/(2*SR.PHYS.gravity)/46).toFixed(2)} BL`+(kind==='coyote'?`, fired <b>${Math.round((time-leftT)*1000)} ms</b> after the probe left the wall`:'');}
      if(e.t==='land'||e.t==='touch'||e.t==='roll'){if(ph==='after'||ph==='back'){done=1.1;if(!result)result='no jump: the press came '+Math.round((time-(leftT||time))*1000)+' ms after leaving, outside the 80 ms wall memory';}}}
    if(time>4)done=.1;SR.updParts(parts,dt);}
  return {tick(dt){const s=still()?0:dt;clock+=s;const alpha=run(s,sim);pose=follow(pose,P,s,clock);
      SR.paper(c,W,H);SR.view(c,cam,scale);SR.drawSolids(c,w,cam,{VW:W/scale,start:false});
      c.strokeStyle=SR.ink.grey;c.lineWidth=1.2;c.setLineDash([3,4]);c.beginPath();trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.setLineDash([]);
      if(ph==='slide'||ph==='after'){const on=time-(wallT||time);c.fillStyle='rgba(208,40,31,.12)';c.fillRect(600,SR.G-540,40,540);}
      SR.drawParts(c,parts);drawP(c,P,pose,alpha,{clock});
      c.setTransform(1,0,0,1,0,0);
      // inset: slide speed against time on the wall
      const L=14,T=14,IW=250,IH=96;c.fillStyle='rgba(255,255,255,.92)';c.fillRect(L,T,IW,IH);c.strokeStyle=SR.ink.ink;c.lineWidth=1;c.strokeRect(L+.5,T+.5,IW-1,IH-1);
      const X=tt=>L+10+tt/1.2*(IW-20),Y=v=>T+IH-12-v/160*(IH-26);
      const prof=(ramp,col)=>{c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();for(let tt=0;tt<=1.2;tt+=.02){const v=ramp?lerp(25,115,Math.min(1,tt/.8)):(tt<.1?25:115);tt?c.lineTo(X(tt),Y(v)):c.moveTo(X(tt),Y(v));}c.stroke();};
      prof(false,cc.segv('slide')==='ramp'?SR.ink.grey2:SR.ink.ink);prof(true,cc.segv('slide')==='ramp'?SR.ink.ink:SR.ink.grey2);
      c.strokeStyle=SR.ink.red;c.lineWidth=2;c.beginPath();slide.forEach((p,i)=>{if(p.t>1.2)return;i?c.lineTo(X(p.t),Y(p.vy)):c.moveTo(X(p.t),Y(p.vy));});c.stroke();
      SR.text(c,'slide speed u/s against seconds on the wall',L+10,T+11,{size:10,col:SR.ink.grey});SR.text(c,'115',L+IW-26,Y(115)-3,{size:9.5,col:SR.ink.grey,mono:true});SR.text(c,'black: today · grey: ramp · red: this slide',L+IW-6,Y(160)+10,{size:9.5,align:'right',col:SR.ink.grey});
      SR.text(c,'0',X(0)-3,T+IH-2,{size:9.5,col:SR.ink.grey,mono:true});SR.text(c,'1.2 s',X(1.2),T+IH-2,{size:9.5,align:'right',col:SR.ink.grey,mono:true});
      // wall memory band label
      if(kind==='coyote'&&leftT!=null){const ms=(time-leftT)*1000;SR.plate(c,`${Math.round(Math.min(ms,999))} ms since the probe left the wall · memory 80 ms`,W-16,30,{size:11.5,align:'right',mono:true,col:ms<=80?SR.ink.green:SR.ink.red});}
      ro.innerHTML=result||(ph==='slide'?`sliding ${Math.round((time-wallT)*1000)} ms at ${Math.round(P.vy)} u/s`:'approaching the wall…');}};});

// ======================================================================
// A5 speed tech: the roll-jump hyper against a plain jump
// ======================================================================
reg('speedtech',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=320,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const mk=()=>SR.makeCourse({width:2600,solids:[[0,360,300,400],[300,SR.G,2300,300]]});
  let rec=[],rec0=[],t=0,wait=0,pose=SR.newPose(),pose0=SR.newPose(),clock=0,note='';
  function build(){const hm=cc.v('hm'),hw=cc.v('hw')/1000,delay=cc.v('delay')/1000;cc.out('hm',hm.toFixed(2)+'x');cc.out('hw',Math.round(hw*1000)+' ms');cc.out('delay',Math.round(delay*1000)+' ms');
    const keys=()=>{let landT=null,pressed=false;return (tt,P,i)=>{const k={right:true};if(landT==null&&P.roll>0)landT=tt;if(landT!=null&&!pressed&&tt-landT>=delay){k.jumpPressed=true;pressed=true;k.hold=tt;}k.jump=landT!=null&&pressed&&tt<landT+delay+.35;return k;};};
    const Pm=()=>{const P=SR.newPlayer(60,360);P.vx=420;P.onGround=true;return P;};
    rec0=record(mk(),Pm(),keys(),{},3.2);rec=record(mk(),Pm(),keys(),{hyper:true,tuning:{hyperMult:hm,hyperWindow:hw}},3.2);t=0;wait=0;
    const land=rec.find(s=>s.ev.some(e=>e.t==='roll')),j=rec.find(s=>s.ev.some(e=>e.t==='jump'||e.t==='hyper')),j0=rec0.find(s=>s.ev.some(e=>e.t==='jump'));
    const hy=j&&j.ev.some(e=>e.t==='hyper');const end=land?land.t+2:2,A=at(rec,end),B=at(rec0,end);
    const reach=(r,x)=>{const s=r.find(p=>p.x>=x);return s?s.t:null;};const ra=reach(rec,1500),rb=reach(rec0,1500);
    note=`${hy?'<b>hyper</b>: left at '+Math.round(j.vx)+' u/s':'plain jump: left at '+(j?Math.round(j.vx):'?')+' u/s (press outside the window)'} · plain lane ${j0?Math.round(j0.vx):'?'} u/s · lead after 2 s <b>${Math.round(A.x-B.x)} u</b> (${((A.x-B.x)/46).toFixed(1)} BL) · reaches x 1500 ${ra!=null&&rb!=null?'<b>'+Math.round((rb-ra)*1000)+' ms</b> sooner':''}`;ro.innerHTML=note;}
  ['hm','hw','delay'].forEach(k=>cc.on(k,build));build();
  const lane=(y0,r,ps,label,col)=>{const S=at(r,t),sc=.5,camx=clamp(S.x-260,0,1400);c.save();c.beginPath();c.rect(0,y0,W,150);c.clip();c.setTransform(sc,0,0,sc,-camx*sc,y0*1-(SR.G-270)*sc);
    const w=mk();SR.drawSolids(c,w,{x:camx,y:0},{VW:W/sc,start:false});
    // the hyper window on the ground: the first hyperWindow ms of the roll at run speed
    const land=r.find(s=>s.ev.some(e=>e.t==='roll'));if(land&&label==='hyper'){c.fillStyle='rgba(208,40,31,.18)';c.fillRect(land.x,SR.G-4,420*cc.v('hw')/1000,10);}
    SR.drawSamurai(c,ps,S.x+SR.W/2,S.y+SR.H,S.facing,{flap:S.flap,grip:S.grip,rot:S.flipOn?S.flip*Math.PI*2:0});
    for(let i=0;i<r.length;i+=6){const p=r[i];if(p.t>t)break;c.fillStyle=p.hyper?SR.ink.red:SR.ink.grey2;c.fillRect(p.x+SR.W/2-1,p.y+SR.H-1,2,2);}
    c.restore();c.setTransform(1,0,0,1,0,0);SR.plate(c,`${label}: ${Math.round(Math.abs(S.vx))} u/s`,12,y0+22,{size:12,mono:true,weight:600,col});c.fillStyle=SR.ink.grey2;c.fillRect(0,y0+149,W,1);};
  return {tick(dt){const s=still()?0:dt;clock+=s;run(s,d=>{if(wait>0){wait-=d;if(wait<=0)t=0;}else{t+=d;if(t>=rec[rec.length-1].t||t>=rec0[rec0.length-1].t){wait=.8;}}});
      pose=follow(pose,at(rec,t),s,clock);pose0=follow(pose0,at(rec0,t),s,clock);SR.paper(c,W,H);
      lane(0,rec0,pose0,'today',SR.ink.ink);lane(152,rec,pose,'hyper',SR.ink.red);
      SR.text(c,'Celeste for scale: dash 2.67x, super 2.9x, hyper 3.6x run speed [V, S7]',W-12,H-8,{size:10.5,align:'right',col:SR.ink.grey});}};});

// ======================================================================
// A6 the input chain, and a one-thumb phone mode
// ======================================================================
reg('inputchain',root=>{const cvs=$$('canvas',root),cv=cvs[0],c=C2(cv),W=640,H=220,cc=ctl(root),ro=$('[data-ro]',root);
  let hz=60,ev=null,auto=0,clock=0;
  function press(at){const os=cc.v('os'),fr=1000/hz,step=1000/120;const tKey=at==null?Math.random()*fr:at;const tEv=tKey+os;const tStep=Math.ceil(tEv/step)*step;const tFrame=Math.ceil(tStep/fr)*fr;const tPhoton=tFrame+fr;ev={tKey,tEv,tStep,tFrame,tPhoton,age:0};
    // average over the frame: the key lands anywhere in a frame
    let sum=0;const N=400;for(let i=0;i<N;i++){const k=i/N*fr+os,st=Math.ceil(k/step)*step,f=Math.ceil(st/fr)*fr;sum+=f+fr-(i/N*fr);}
    ro.innerHTML=`this press: key to photon <b>${Math.round(tPhoton-tKey)} ms</b> · browser and OS ${os} · wait for the step ${(tStep-tEv).toFixed(1)} · wait for the frame ${(tFrame-tStep).toFixed(1)} · present ${fr.toFixed(1)} · average at ${hz} Hz: <b>${(sum/N).toFixed(1)} ms</b>`;}
  cc.seg('hz',v=>{hz=+v;press();});cc.on('os',()=>{cc.out('os',cc.v('os')+' ms');press();});cc.btn('press',()=>press());press();
  // the phone: auto-run, tap to jump, hold for height
  const pc=cvs[1],p2=C2(pc),PW=180,PH=320,psc=PW/420;let w=SR.makeCourse(7),P,st,pose=SR.newPose(),parts=[],time=0,touch=false,touchT=0,idle=0,acc=0,cam=SR.newCam(0,0),dead=0;
  function restart(){P=SR.newPlayer(60,SR.G);st={noJump:false};parts=[];time=0;dead=0;}restart();
  const down=e=>{e.preventDefault();touch=true;touchT=0;idle=0;AUD.enable&&0;};const up=()=>{touch=false;};
  pc.addEventListener('pointerdown',down);pc.addEventListener('pointerup',up);pc.addEventListener('pointercancel',up);pc.addEventListener('pointerleave',up);
  return {tick(dt){const s=still()?0:dt;clock+=s;
      // timeline
      if(ev){ev.age+=s*1000*.35;}auto+=s;if(auto>3.2){auto=0;press();}
      SR.paper(c,W,H);const L=120,Rr=W-16,span=Math.max(80,Math.ceil((ev.tPhoton+10)/20)*20),X=ms=>L+ms/span*(Rr-L);
      const rows=[['key event',ev.tKey,ev.tEv,'#9a9a9a','browser and OS'],['120 Hz step',ev.tEv,ev.tStep,'#2458c9','wait, then consume'],[hz+' Hz frame',ev.tStep,ev.tFrame,'#1f8a3a','wait, then draw'],['present',ev.tFrame,ev.tPhoton,SR.ink.red,'next refresh']];
      const y0=40,rh=36;c.strokeStyle='#ececec';for(let ms=0;ms<=span;ms+=20){c.beginPath();c.moveTo(X(ms),y0-10);c.lineTo(X(ms),y0+rows.length*rh);c.stroke();SR.text(c,ms,X(ms),y0+rows.length*rh+14,{size:10,align:'center',col:SR.ink.grey,mono:true});}
      SR.text(c,'ms',Rr,y0+rows.length*rh+28,{size:10,align:'right',col:SR.ink.grey});
      rows.forEach((r,i)=>{const y=y0+i*rh;SR.text(c,r[0],L-8,y+16,{size:11.5,align:'right'});const vis=Math.min(ev.age,r[2]);if(vis>r[1]){c.fillStyle=r[3];c.fillRect(X(r[1]),y+4,X(vis)-X(r[1]),18);}
        if(ev.age>=r[2]){const tx=`${r[4]} ${(r[2]-r[1]).toFixed(1)} ms`,fits=X(r[2])+140<W;SR.text(c,tx,fits?X(r[2])+6:X(r[1])-6,y+17,{size:10.5,col:r[3],align:fits?'left':'right'});}});
      // grid of step and frame boundaries
      c.strokeStyle='rgba(36,88,201,.35)';for(let ms=0;ms<=span;ms+=1000/120){c.beginPath();c.moveTo(X(ms),y0+rh+2);c.lineTo(X(ms),y0+rh+24);c.stroke();}
      c.strokeStyle='rgba(31,138,58,.45)';for(let ms=0;ms<=span;ms+=1000/hz){c.beginPath();c.moveTo(X(ms),y0+2*rh+2);c.lineTo(X(ms),y0+3*rh+24);c.stroke();}
      c.fillStyle=SR.ink.ink;c.fillRect(X(ev.tKey)-1,y0-6,2,rows.length*rh+4);SR.text(c,'press',X(ev.tKey),y0-12,{size:10.5,align:'center',weight:600});
      if(ev.age>=ev.tPhoton){c.fillStyle=SR.ink.red;c.fillRect(X(ev.tPhoton)-1,y0-6,2,rows.length*rh+4);SR.plate(c,`${Math.round(ev.tPhoton-ev.tKey)} ms key to photon`,X(ev.tPhoton),y0-14,{size:11.5,align:'center',mono:true,weight:600,col:SR.ink.red});}
      // phone
      idle+=s;if(touch)touchT+=s;acc=Math.min(acc+s,.1);
      while(acc>=SR.DT){acc-=SR.DT;if(dead>0){dead-=SR.DT;if(dead<=0)restart();continue;}
        const k=idle>2?SR.bot(P,w,st):{right:true};if(idle<=2){k.right=true;k.jump=touch;k.jumpPressed=touch&&touchT===0;if(k.jumpPressed)touchT=1e-9;}
        const e=SR.step(P,k,SR.DT,{world:w,time});time+=SR.DT;SR.spawnDust(parts,e);if(P.dead){dead=.38;}if(P.x>w.width-200)restart();}
      SR.updParts(parts,s);pose=follow(pose,P,s,clock);SR.cam(cam,P,{mode:'lock',VW:420,VH:PH/psc,width:w.width,lookAhead:60,floorView:SR.G},s);
      SR.paper(p2,PW,PH);SR.view(p2,cam,psc);SR.drawSolids(p2,w,cam,{VW:420,start:false});SR.drawParts(p2,parts);if(dead<=0)drawP(p2,P,pose,1,{clock});
      p2.setTransform(1,0,0,1,0,0);SR.plate(p2,SR.fmtT(time*1000),PW/2,22,{size:13,mono:true,align:'center',weight:600});
      if(idle>2)SR.text(p2,'auto · tap to take over',PW/2,PH-10,{size:10,align:'center',col:SR.ink.grey});else SR.text(p2,touch?'hold: higher':'tap: jump',PW/2,PH-10,{size:10,align:'center',col:SR.ink.red});}};});
}
{
const {C2,SC,K0,stepper,follow,drawP}=window.SRfig;
const still=()=>!motion||reduce;
// ======================================================================
// B1 the rig: pose targets, the blend constant, foot planting, the kimono spring
// ======================================================================
reg('rig',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root);
  const Z=3,GY=300,CX=250;let target='run',pose=SR.newPose(),phase=0,landT=0,clock=0,anchor=null,flap=0,flapV=0,hist=[],stepT=0,acc=0;
  cc.seg('pose',v=>{target=v;anchor=null;});['tau','sp','ks','kd'].forEach(k=>cc.on(k,()=>{}));
  const fakeP=()=>{const sp=cc.v('sp');const P={vx:0,vy:0,onGround:true,wallDir:0,roll:0,flipOn:false,land:0,phase};
    switch(target){case 'run':P.vx=sp;break;case 'rise':P.onGround=false;P.vy=-500;break;case 'apex':P.onGround=false;P.vy=0;break;case 'fall':P.onGround=false;P.vy=600;break;
      case 'wall':P.onGround=false;P.wallDir=1;P.vy=100;break;case 'land':P.land=landT;break;case 'roll':P.roll=.3;P.vx=sp;break;}return P;};
  const L1=11*1.22,L2=11.5*1.22;const seg=(p,a,len)=>[p[0]+Math.sin(a)*len,p[1]+Math.cos(a)*len];
  return {tick(dt){const s=still()?0:dt*slowF(root);clock+=s;const tau=cc.v('tau')/1000,sp=cc.v('sp'),ks=cc.v('ks'),kd=cc.v('kd');
      cc.out('tau',cc.v('tau')+' ms');cc.out('sp',sp+' u/s');cc.out('ks',ks);cc.out('kd',kd);
      landT-=s;if(landT<=0)landT=.13;phase+=(target==='run'||target==='roll'?sp:0)*s*.042;
      const P=fakeP();pose=SR.blend(pose,SR.targetPose(P,clock),1-Math.exp(-s/tau));
      // the kimono spring answering a speed step every 1.5 s
      stepT+=s;const ft=(Math.floor(stepT/1.5)%2)?-.55:0;flapV+=((ft-flap)*ks-flapV*kd)*s;flap+=flapV*s;hist.push({t:clock,v:flap,ft});while(hist.length&&hist[0].t<clock-3)hist.shift();
      SR.paper(c,W,H);
      // treadmill ground: marks every 150 u, one stride
      const v=target==='run'||target==='roll'?sp:0;acc=(acc+v*s)%150;c.fillStyle=SR.ink.ink;c.fillRect(0,GY,W,3);c.fillStyle=SR.ink.grey2;for(let x=-acc*Z;x<W;x+=150*Z)c.fillRect(Math.round(x+CX),GY+6,2,10);
      // foot planting: pin the stance foot to a ground point that moves with the ground, solve the leg with two atan2 calls
      let ps=pose;if(cc.v('plant')&&target==='run'&&v>20){const hipP=[0,-pose.hip*1.22];const feet=[0,1].map(i=>{const k=seg(hipP,pose.th[i]+pose.lean*.2,L1);return seg(k,pose.th[i]-pose.sh[i],L2);});
        if(!anchor){const i=feet[0][1]>feet[1][1]?0:1;if(feet[i][1]>-2)anchor={i,x:feet[i][0]};}
        if(anchor){anchor.x-=v*s;const dx=anchor.x-hipP[0],dy=0-hipP[1],d=Math.hypot(dx,dy);
          if(d>L1+L2-.3||anchor.x<-14)anchor=null;else{const a=Math.atan2(dx,dy),A=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),a1=a+A,kneeA=Math.PI-Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1));
            ps=SR.blend(pose,pose,0);const th=a1-pose.lean*.2;ps.th=pose.th.slice();ps.sh=pose.sh.slice();ps.th[anchor.i]=th;ps.sh[anchor.i]=kneeA;}}}
      c.save();c.translate(CX,GY);c.scale(Z,Z);SR.drawSamurai(c,ps,0,0,1,{flap,grip:1,clock});c.restore();
      if(anchor){c.fillStyle=SR.ink.red;c.beginPath();c.arc(CX+anchor.x*Z,GY,4,0,Math.PI*2);c.fill();SR.text(c,'planted',CX+anchor.x*Z,GY+30,{size:10.5,align:'center',col:SR.ink.red});}
      // spring chart
      const L=400,T=24,IW=226,IH=110;c.fillStyle='rgba(255,255,255,.9)';c.fillRect(L,T,IW,IH);c.strokeStyle=SR.ink.ink;c.lineWidth=1;c.strokeRect(L+.5,T+.5,IW-1,IH-1);
      const X=t=>L+8+(t-(clock-3))/3*(IW-16),Y=f=>T+IH/2+f*70;c.strokeStyle=SR.ink.grey2;c.beginPath();hist.forEach((h,i)=>i?c.lineTo(X(h.t),Y(h.ft)):c.moveTo(X(h.t),Y(h.ft)));c.stroke();
      c.strokeStyle=SR.ink.red;c.lineWidth=1.6;c.beginPath();hist.forEach((h,i)=>i?c.lineTo(X(h.t),Y(h.v)):c.moveTo(X(h.t),Y(h.v)));c.stroke();
      const zeta=kd/(2*Math.sqrt(ks));SR.text(c,`k ${ks}, c ${kd}, damping ratio ${zeta.toFixed(2)}: ${zeta<1?'under-damped, flutters':zeta<1.05?'critical':'over-damped'}`,L+8,T+IH+16,{size:10.5,col:SR.ink.grey});
      SR.text(c,'flap against a speed step (grey: target)',L+8,T+12,{size:10,col:SR.ink.grey});
      SR.text(c,`target: ${target} · blend 1 - exp(-dt / ${cc.v('tau')} ms)`,16,24,{size:12,weight:600});
      const r=ps;ro.innerHTML=`hip ${r.hip.toFixed(1)} · lean ${r.lean.toFixed(2)} · thighs ${r.th.map(x=>x.toFixed(2)).join(' / ')} · shins ${r.sh.map(x=>x.toFixed(2)).join(' / ')} · upper arms ${r.ua.map(x=>x.toFixed(2)).join(' / ')} · forearms ${r.la.map(x=>x.toFixed(2)).join(' / ')} · phase ${(phase%(2*Math.PI)).toFixed(2)} (${(sp/150).toFixed(1)} strides/s)`;}};});

// ======================================================================
// B2 squash, stretch, gated dust and after-images
// ======================================================================
reg('squash',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=320,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const sc=.6,w=SR.makeCourse({width:1500,solids:[[0,463,420,300],[420,508,300,300],[720,SR.G,780,300]]});
  let P,pose,parts,time,sx=1,sy=1,hop=false,trail=[],trailT=0,clock=0,last='',cam={x:0,y:SR.G-H/sc*.84},lastJ='';
  function reset(){P=SR.newPlayer(40,463);P.vx=420;pose=SR.newPose();parts=[];time=0;sx=sy=1;hop=false;trail=[];}reset();
  function sim(dt){const k=K0();k.right=true;if(!hop&&P.x>=150&&P.onGround){k.jumpPressed=true;hop=true;}
    const ev=SR.step(P,k,dt,{world:w,time});time+=dt;const lv=ev.find(e=>e.t==='land'||e.t==='touch'||e.t==='roll'),landVy=lv?Math.abs(lv.vy):0;
    for(const e of ev){if(e.t==='jump'){if(cc.v('stretch')){sx=.6;sy=1.4;}lastJ='jump: scale (0.6, 1.4), recovering at 1.75 per second';}
      if(e.t==='land'||e.t==='touch'||e.t==='roll'){const vy=Math.abs(e.vy),kq=Math.min(vy/SR.PHYS.maxFall,1);if(cc.v('squash')){sx=1+.4*kq;sy=1-.4*kq;}
        const today=e.fall>50,gate=vy>=575;if(cc.v('gate')&&gate&&!today)SR.dust(parts,P.x+SR.W/2,P.y+SR.H,6,0,-.5);
        last=`landing: ${Math.round(vy)} u/s after a ${Math.round(e.fall)} u fall (${(e.fall/46).toFixed(1)} BL) · squash (${(1+.4*kq).toFixed(2)}, ${(1-.4*kq).toFixed(2)}) · dust today ${today?'yes':'no'}, gate ${gate?'yes':'no'}`;}
      if(e.t==='dust'){if(e.n===6&&lv&&cc.v('gate')&&landVy<575)continue;SR.dust(parts,e.x,e.y,e.n,e.dx,e.dy,e.spread);}}
    const rec=1.75*dt;sx+=clamp(1-sx,-rec,rec);sy+=clamp(1-sy,-rec,rec);
    trailT+=dt;if(trailT>=.03){trailT=0;trail.push({x:P.x,y:P.y,f:P.facing,ps:pose,vx:P.vx});if(trail.length>8)trail.shift();}
    SR.updParts(parts,dt);if(P.x>1380)reset();}
  return {tick(dt){const s=still()?0:dt;clock+=s;const alpha=run(s,sim);pose=follow(pose,P,s,clock);cam.x=clamp(P.x-300,0,w.width-W/sc);
      SR.paper(c,W,H);SR.view(c,cam,sc);SR.drawSolids(c,w,cam,{VW:W/sc,start:false});
      SR.dim(c,420,463,420,508,'45 u',{col:SR.ink.grey,ox:-22});SR.dim(c,720,508,720,SR.G,'92 u = 2 BL',{col:SR.ink.grey,ox:-40});
      if(cc.v('trail')&&Math.abs(P.vx)>=.9*SR.PHYS.maxRun)trail.forEach((t,i)=>{if(Math.abs(t.vx)<.9*SR.PHYS.maxRun)return;SR.drawSamurai(c,t.ps,t.x+SR.W/2,t.y+SR.H,t.f,{ghost:true,alpha:.08+.05*i,katana:false});});
      SR.drawParts(c,parts);drawP(c,P,pose,alpha,{clock,sx,sy});
      c.setTransform(1,0,0,1,0,0);SR.plate(c,`scale (${sx.toFixed(2)}, ${sy.toFixed(2)})`,W-14,26,{size:12,mono:true,align:'right',weight:600});
      ro.innerHTML=`${lastJ||'…'} · ${last||'…'}`;}};});

// ======================================================================
// B3 camera modes on a course with a blind drop
// ======================================================================
reg('camera',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=360,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const w=SR.makeCourse({width:2600,top:-300,deathY:800,floorView:720,finish:2460,solids:[[0,100,700,900],[700,720,1900,300],[1500,640,200,80]]});
  let P,st,pose,parts,time,cam,clock=0,visLand=null,fallSeen=false;
  const camO=()=>({mode:cc.segv('mode'),width:w.width,top:w.top,floorView:w.floorView,deathY:w.deathY,killClamp:cc.v('kill'),speedFocus:cc.v('focus'),fallLook:cc.v('fall')});
  function reset(){P=SR.newPlayer(60,100);st={};pose=SR.newPose();parts=[];time=0;cam=SR.newCam(0,0);SR.cam(cam,P,Object.assign(camO(),{snap:true}),0);visLand=null;fallSeen=false;}reset();
  cc.seg('mode',reset);
  function sim(dt){const k=SR.bot(P,w,st);const ev=SR.step(P,k,dt,{world:w,time});time+=dt;SR.spawnDust(parts,ev);
    if(!P.onGround&&P.vy>300&&P.x>700&&P.x<1400&&!fallSeen){fallSeen=true;}
    if(P.finished||P.dead||time>12)reset();SR.updParts(parts,dt);}
  return {tick(dt){const s=still()?0:dt;clock+=s;const alpha=run(s,sim);pose=follow(pose,P,s,clock);SR.cam(cam,P,camO(),s);
      const VH=H/SC;if(fallSeen&&!P.onGround&&visLand==null)visLand=(720<=cam.y+VH);if(P.onGround&&P.x>800&&fallSeen&&visLand==null)visLand=false;
      SR.paper(c,W,H);SR.view(c,cam,SC);SR.drawSolids(c,w,cam,{death:true});SR.drawParts(c,parts);drawP(c,P,pose,alpha,{clock});
      if(cc.v('over')){const mode=cc.segv('mode');c.save();
        if(mode!=='lerp'){c.fillStyle='rgba(36,88,201,.10)';c.fillRect(cam.x,cam.ref-60,SR.VW,60);c.strokeStyle='#2458c9';c.setLineDash([6,5]);c.lineWidth=1.5;c.beginPath();c.moveTo(cam.x,cam.ref);c.lineTo(cam.x+SR.VW,cam.ref);c.stroke();
          SR.text(c,'camera reference · 60 u dead zone above it',cam.x+12,cam.ref-66,{size:11,col:'#2458c9'});}
        const fx=P.x+SR.W/2+cam.look;c.strokeStyle=SR.ink.green;c.setLineDash([4,4]);c.beginPath();c.moveTo(fx,cam.y);c.lineTo(fx,cam.y+VH);c.stroke();SR.text(c,`focus +${Math.round(cam.look)} u`,fx+6,cam.y+VH-14,{size:11,col:SR.ink.green});
        c.restore();}
      c.setTransform(1,0,0,1,0,0);const killIn=w.deathY<=cam.y+VH;
      SR.plate(c,`cam y ${Math.round(cam.y)} · bottom ${Math.round(cam.y+VH)} · kill line ${killIn?'IN VIEW':'out of view'}${visLand!=null?' · landing seen: '+(visLand?'yes':'no'):''}`,W/2,24,{size:11,align:'center',mono:true,col:killIn?SR.ink.red:SR.ink.ink});
      ro.innerHTML=`${cc.segv('mode')} · the samurai runs off a ledge 620 u above the floor; terminal fall at 1150 u/s crosses the 545 u view in 0.47 s · ${visLand==null?'running…':(visLand?'<span class="ok">landing was in view during the fall</span>':'<span class="bad">blind drop: the floor entered the view only as the body reached it</span>')}`;}};});

// ======================================================================
// B4 synth audio: voices, pitch jitter, a beat through a death
// ======================================================================
reg('audio',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=240,cc=ctl(root),ro=$('[data-ro]',root);
  // the voices as frequency over time, from the served bundle [K]
  const V=[{n:'jump',f:[[0,420],[.09,760]],w:'triangle'},{n:'wall',f:[[0,520],[.1,980]],w:'square + noise'},{n:'land',f:[[0,700],[.08,700]],w:'noise 80 ms'},{n:'roll',f:[[0,900],[.22,900]],w:'noise 220 ms'},
    {n:'check',f:[[0,880],[.12,1320]],w:'sine'},{n:'finish',f:[[0,523],[.08,659],[.16,784],[.24,1046]],w:'4 triangle notes'},{n:'die',f:[[0,300],[.3,70]],w:'sawtooth'}];
  const flash={},pulses=[];let beat=0,beatOn=true,deadT=0,countT=0,clock=0,idle=0,lastBeat=-1,log='';
  function play(n){const jit=cc.v('jit');if(cc.v('snd')){AUD.enable();SR.sfx(n,{jitter:jit&&(n==='jump'||n==='land'||n==='roll'||n==='wall')?.04:0});}flash[n]=.35;idle=0;log=`${n}${jit&&(n==='jump'||n==='land'||n==='roll'||n==='wall')?' with ±4% jitter':''}`;
    if(n==='die'){if(cc.segv('music')==='restart'){beatOn=false;deadT=.38;countT=3;}}}
  V.forEach(v=>cc.btn(v.n,()=>play(v.n)));cc.btn('die',()=>play('die'));
  return {tick(dt){const s=still()?0:dt;clock+=s;idle+=s;
      if(idle>2.6){idle=0;const pick=['jump','land','wall','roll','check','jump','finish','die'][Math.floor(clock/2.6)%8];play(pick);}
      if(!beatOn){if(deadT>0){deadT-=s;}else{countT-=s;if(countT<=0){beatOn=true;beat=0;lastBeat=-1;}}}
      else{beat+=s;const b=Math.floor(beat/.5);if(b!==lastBeat){lastBeat=b;pulses.push({t:clock});if(cc.v('snd')&&AUD.on)AUD.blip(b%4===0?330:220,45,.03,'square');}}
      SR.paper(c,W,H);
      V.forEach((v,i)=>{const x=14+i*88,y=16,bw=80,bh=120;const fl=flash[v.n]||0;if(fl>0)flash[v.n]=fl-s;c.fillStyle=fl>0?'rgba(208,40,31,.12)':'#fafafa';c.fillRect(x,y,bw,bh);c.strokeStyle=fl>0?SR.ink.red:SR.ink.grey2;c.lineWidth=1;c.strokeRect(x+.5,y+.5,bw-1,bh-1);
        const T=.3,fmax=1400,X=t=>x+8+t/T*(bw-16),Y=f=>y+bh-14-f/fmax*(bh-34);
        c.strokeStyle=fl>0?SR.ink.red:SR.ink.ink;c.lineWidth=2;c.beginPath();if(v.n==='finish'){v.f.forEach(([t,f])=>{c.moveTo(X(t),Y(f));c.lineTo(X(t+.07),Y(f));});}else{v.f.forEach(([t,f],j)=>j?c.lineTo(X(t),Y(f)):c.moveTo(X(t),Y(f)));}c.stroke();
        if(/noise/.test(v.w)){c.strokeStyle=fl>0?SR.ink.red:SR.ink.grey;c.lineWidth=1;c.beginPath();const dur=v.f[1][0];for(let k=0;k<=24;k++){const t=k/24*dur;const f=v.f[0][1]*(1+(((k*7919)%13)/13-.5)*.6)*(1-k/30);k?c.lineTo(X(t),Y(f)):c.moveTo(X(t),Y(f));}c.stroke();}
        SR.text(c,v.n,x+8,y+12,{size:11,weight:600});SR.text(c,v.w,x+8,y+bh-4,{size:9,col:SR.ink.grey});
        SR.text(c,`${v.f[0][1]}${v.f[v.f.length-1][1]!==v.f[0][1]?' to '+v.f[v.f.length-1][1]:''} Hz`,x+8,y+23,{size:9,col:SR.ink.grey,mono:true});});
      // the beat bar
      const by=176,L=14,Rr=W-14;c.fillStyle='#f1f1f1';c.fillRect(L,by,Rr-L,22);const X=t=>L+((t-(clock-4))/4)*(Rr-L);
      for(const p of pulses.slice()){if(p.t<clock-4){pulses.shift();continue;}c.fillStyle=SR.ink.ink;c.fillRect(X(p.t)-1.5,by+2,3,18);}
      if(!beatOn){c.fillStyle='rgba(208,40,31,.18)';c.fillRect(X(clock)-2,by,Rr-X(clock)+2,22);SR.plate(c,deadT>0?'dead 0.38 s':`countdown ${Math.ceil(countT)}`,Rr-8,by+15,{size:11,align:'right',mono:true,col:SR.ink.red});}
      SR.text(c,cc.segv('music')==='keep'?'beat: keeps playing through the death (Super Meat Boy rule)':'beat: stops for the death beat and the 3 s countdown, then restarts',L,by+36,{size:11,col:SR.ink.grey});
      SR.text(c,'4 s',Rr,by-4,{size:10,align:'right',col:SR.ink.grey,mono:true});
      ro.innerHTML=`last: <b>${log||'…'}</b>${cc.v('snd')?'':' · sound is off'}`;}};});

// ======================================================================
// B5 UI motion: countdown digits, split deltas, results bars, an input display
// ======================================================================
reg('uimotion',root=>{const cv=$('canvas',root),c=C2(cv),W=640,H=320,cc=ctl(root),ro=$('[data-ro]',root),run=stepper(root);
  const w=SR.makeCourse(3);let P=SR.newPlayer(60,SR.G),st={},time=0,keys={},fade={left:0,right:0,jump:0,R:0},clock=0,idle=0,seqI=0;
  let count=null,split=null,results=null,timerMs=0;
  const SPL=[4.21,5.07,3.84,6.02],PB=[4.35,4.98,3.90,6.40];
  const fire={count:()=>{count={t:0};timerMs=0;},ahead:()=>{split={t:0,d:-420,kind:'aheadG',txt:'-0.42'};},behind:()=>{split={t:0,d:310,kind:'behindL',txt:'+0.31'};},gold:()=>{split={t:0,d:-120,kind:'gold',txt:'-0.12 best'};},results:()=>{results={t:0};}};
  Object.keys(fire).forEach(k=>cc.btn(k,()=>{fire[k]();idle=0;}));
  const SEQ=['count','ahead','behind','gold','results'];
  function sim(dt){const k=SR.bot(P,w,st);keys=k;SR.step(P,k,dt,{world:w,time});time+=dt;if(P.dead||P.x>w.width-300){P=SR.newPlayer(60,SR.G);st={};}
    if(k.jumpPressed)fade.R=0;for(const n of ['left','right','jump'])fade[n]=k[n]?1:Math.max(0,fade[n]-dt/.12);fade.R=Math.max(0,fade.R-dt/.12);if(!count||count.t>3)timerMs+=dt*1000;}
  return {tick(dt){const s=still()?0:dt;clock+=s;idle+=s;run(s,sim);if(idle>3){idle=0;fire[SEQ[seqI++%SEQ.length]]();}
      if(count){count.t+=s;if(count.t>4.2)count=null;}if(split){split.t+=s;if(split.t>2)split=null;}if(results){results.t+=s;if(results.t>4)results=null;}
      SR.paper(c,W,H);
      // timer plate
      SR.plate(c,SR.fmtT(timerMs),W/2,34,{size:20,mono:true,align:'center',weight:600,pad:8});
      // countdown digits: scale 1.4 to 1 over 150 ms, one per second
      if(count){const i=Math.floor(count.t),k=sat((count.t-i)/.15),sc=lerp(1.4,1,k),txt=i<3?String(3-i):'GO';c.save();c.translate(W/2,150);c.scale(sc,sc);SR.text(c,txt,0,0,{size:64,align:'center',base:'middle',weight:700,col:i<3?SR.ink.ink:SR.ink.red});c.restore();
        SR.text(c,`digit ${txt} at scale ${sc.toFixed(2)}`,W/2,200,{size:11,align:'center',col:SR.ink.grey,mono:true});}
      // split delta: slide in 100 ms, hold 1.5 s, fade 300 ms
      if(split){const k=sat(split.t/.1),a=split.t<1.6?1:sat(1-(split.t-1.6)/.3);c.save();c.globalAlpha=a;SR.text(c,split.txt,W/2+lerp(24,0,k),64,{size:16,mono:true,align:'center',weight:600,col:SR.ls[split.kind]});c.restore();
        SR.text(c,{aheadG:'ahead and gaining (0,204,54)',behindL:'behind and losing (204,0,0)',gold:'gold segment (255,213,0) overrides the sign'}[split.kind],W/2,82,{size:10.5,align:'center',col:SR.ink.grey});}
      // results: four section bars in under 1 s with a 60 ms stagger
      if(results){const x0=380,y0=110,bw=230;SR.text(c,'results',x0,y0-6,{size:12,weight:600});SPL.forEach((v,i)=>{const t0=i*.06,k=sat((results.t-t0)/.3);const d=v-PB[i];c.fillStyle='#f1f1f1';c.fillRect(x0,y0+i*30,bw,20);c.fillStyle=SR.ink.ink;c.fillRect(x0,y0+i*30,bw*(v/7)*k,20);
          if(k>=1){SR.text(c,v.toFixed(2),x0+bw*(v/7)+6,y0+i*30+15,{size:11,mono:true});SR.text(c,(d<0?'-':'+')+Math.abs(d).toFixed(2),x0+bw,y0+i*30+15,{size:11,mono:true,align:'right',col:d<-.1?SR.ls.gold:d<0?SR.ls.aheadG:SR.ls.behindL});}});
        SR.text(c,'section times (illustrative) against the PB; gold for a best segment',x0,y0+130,{size:10,col:SR.ink.grey});}
      // input display: four 24 px glyphs filled while held, fading over 120 ms
      const gx=16,gy=H-44;[['←','left'],['→','right'],['↑','jump'],['R','R']].forEach(([g,n],i)=>{const x=gx+i*30;c.fillStyle=`rgba(208,40,31,${fade[n]})`;c.fillRect(x,gy,24,24);c.strokeStyle=SR.ink.ink;c.lineWidth=1;c.strokeRect(x+.5,gy+.5,23,23);SR.text(c,g,x+12,gy+17,{size:13,align:'center',weight:600,col:fade[n]>.5?'#fff':SR.ink.ink});});
      SR.text(c,'input display: what the step saw (autopilot)',gx,gy-6,{size:10.5,col:SR.ink.grey});
      ro.innerHTML=`countdown ${count?'playing':'idle'} · split ${split?split.txt:'none'} · results ${results?'playing':'idle'} · keys: ${['left','right','jump'].filter(n=>keys[n]).join(' ')||'none'}`;}};});
}
