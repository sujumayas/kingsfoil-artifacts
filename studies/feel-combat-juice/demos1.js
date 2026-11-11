// Combat juice study: figures 1 (hero, timeline, attack animation, impact feedback and camera, combat text). Shared helpers and sprites live in core.js.
{
const C2=cx2;
const still=()=>!motion||reduce;
const FR=1000/60;
// ---- per-unit visual hit state: freeze (hitstop), flash, recoil, squash. Times in ms.
const vfx=()=>({frz:0,ft:0,shk:0,fl:1e9,flc:'white',fk:1,rc:1e9,ramp:0,rdir:1,sq:1e9,sqA:0});
function vhit(v,o={}){v.fl=o.flash?0:1e9;v.flc=o.flash||'white';v.fk=o.fk||1;if(o.rec){v.rc=0;v.ramp=o.rec;v.rdir=o.dir||1;}if(o.frz){v.frz=Math.max(v.frz,o.frz);v.ft=0;v.shk=o.shake?1:0;}if(o.sq){v.sq=0;v.sqA=o.sq;}}
function vstep(v,ms){v.fl+=ms;if(v.frz>0){v.frz=Math.max(0,v.frz-ms);v.ft+=ms;if(!v.frz)v.shk=0;}else{v.rc+=ms;v.sq+=ms;}}
// flash: 2 frames full, then a 4-frame fade, 100 ms in all (§7 preset)
const flashA=t=>t<2*FR?1:t<100?1-(t-2*FR)/(4*FR):0;
// recoil: out over 3 frames, back over 3 frames
const recoil=(t,a)=>t<50?a*t/50:t<100?a*(1-(t-50)/50):0;
function vopts(v,o={}){const r={...o};const fa=flashA(v.fl);if(fa>0){r.flash=v.flc;r.fa=fa*v.fk;}
  r.dx=(o.dx||0)+Math.round(recoil(v.rc,v.ramp)*v.rdir)+(v.frz>0&&v.shk?(((v.ft/33)|0)%2?1:-1):0);
  if(v.sq<100){const k=v.sq<50?1:1-(v.sq-50)/50;r.sx=1+v.sqA*k;r.sy=1-v.sqA*k;}return r;}
const frozen=v=>v.frz>0;
// ---- trauma camera (B6): trauma 0..1, decay 1.5/s, shake = trauma^2, whole pixels, vertical half
const nz=(t,s)=>Math.sin(t*1.3+s)*.5+Math.sin(t*2.9+s*1.7)*.3+Math.sin(t*5.3+s*.3)*.2;
function mkCam(max=3){return {tr:0,kx:0,ky:0,t:0,pow:2,max,amt:1,white:false,ox:0,oy:0,
  add(a){this.tr=Math.min(1,this.tr+a);},kick(x,y){this.kx=x;this.ky=y;},
  step(s){this.t+=s;this.tr=Math.max(0,this.tr-1.5*s);const k=1-Math.pow(.7,s*60);this.kx-=this.kx*k;this.ky-=this.ky*k;
    const sh=Math.pow(this.tr,this.pow)*this.amt;let nx,ny;if(this.white){nx=Math.random()*2-1;ny=(Math.random()*2-1)*.5;}else{nx=nz(this.t*25,1);ny=nz(this.t*25,7)*.5;}
    this.ox=Math.round(nx*this.max*sh+this.kx);this.oy=Math.round(ny*this.max*sh+this.ky);return sh;}};}
// ---- swing data (A1, Slynyrd [S80]): ms per frame; frames 1-3 strike, 4 hold, 5 recovery
const SWING={sword:[100,50,50,50,100,50],spear:[200,50,50,50,150,50],hammer:[250,50,50,50,300,100]};
const SWA={sword:[-2.3,-1.25,-.25,.55,.85,.3],spear:[-.15,-.05,0,0,0,0],hammer:[-2.6,-1.6,-.4,.65,1,.5]};
const SWX={sword:[-1,0,0,0,1,0],spear:[-3,0,2,3,4,1],hammer:[-1,0,0,0,1,0]};
function swFrame(ms,dur){let a=0;for(let i=0;i<dur.length;i++){if(ms<a+dur[i])return i;a+=dur[i];}return -1;}
const sum=a=>a.reduce((x,y)=>x+y,0);
function drawWeapon(c,kind,hx,hy,ang){if(kind==='sword'){drawSword(c,hx,hy,ang,9);return;}
  const dx=Math.cos(ang),dy=Math.sin(ang);
  if(kind==='spear'){const L=15;c.fillStyle=CB.ink;for(let i=-2;i<=L+2;i++)c.fillRect(Math.round(hx+dx*i)-1,Math.round(hy+dy*i)-1,3,3);
    c.fillStyle='#9a6a3a';for(let i=-2;i<=L-2;i++)c.fillRect(Math.round(hx+dx*i),Math.round(hy+dy*i),1,1);c.fillStyle='#e8ecf4';for(let i=L-1;i<=L+2;i++)c.fillRect(Math.round(hx+dx*i),Math.round(hy+dy*i),1,1);return;}
  const L=8;c.fillStyle=CB.ink;for(let i=0;i<=L;i++)c.fillRect(Math.round(hx+dx*i)-1,Math.round(hy+dy*i)-1,3,3);
  const ex=Math.round(hx+dx*L),ey=Math.round(hy+dy*L);c.fillRect(ex-3,ey-3,7,7);c.fillStyle='#9a6a3a';for(let i=0;i<L;i++)c.fillRect(Math.round(hx+dx*i),Math.round(hy+dy*i),1,1);
  c.fillStyle='#8d93a3';c.fillRect(ex-2,ey-2,5,5);c.fillStyle='#c9ccd6';c.fillRect(ex-2,ey-2,4,1);c.fillRect(ex-2,ey-2,1,4);}
// knight body plus any weapon; returns the hand position
function drawKnight(c,x,y,o={}){const r=drawUnit(c,o.kind||'knight',x,y,{...o,sword:null});const U=UNITS.knight,sx=o.sx||1,sy=o.sy||1,flip=!!o.flip;
  const hx=flip?r.X+r.W-1-Math.round(U.hand[0]*sx):r.X+Math.round(U.hand[0]*sx),hy=r.Y+Math.round(U.hand[1]*sy);
  if(o.weapon&&o.ang!=null)drawWeapon(c,o.weapon,hx,hy,flip?Math.PI-o.ang:o.ang);return {hx,hy,...r};}
function pillar(c,x,y){rect(c,x-6,y-22,12,24,CB.ink);rect(c,x-5,y-21,10,22,'#5d5870');rect(c,x-5,y-21,3,22,'#6e6984');rect(c,x+3,y-21,2,22,'#47435a');rect(c,x-7,y-24,14,4,CB.ink);rect(c,x-6,y-23,12,2,'#7a7590');rect(c,x-6,y+1,12,2,'rgba(8,6,14,.4)');}
function torch(c,x,y,t){rect(c,x-1,y,3,6,'#5a3a22');const f=Math.floor(t*10)%3;rect(c,x-1,y-3-(f===1?1:0),3,3,'#ff8a28');px(c,x,y-4-(f===2?1:0),'#ffe14a');
  const g=c.createRadialGradient(x,y-2,1,x,y-2,22);g.addColorStop(0,'rgba(255,170,80,.18)');g.addColorStop(1,'rgba(255,170,80,0)');c.fillStyle=g;c.fillRect(x-22,y-24,44,44);}
// a frame strip: boxes proportional to ms, current frame lit, labels under
function strip(c,x,y,w,dur,cur,o={}){const T=sum(dur);let a=x;const lab=o.lab||[];
  for(let i=0;i<dur.length;i++){const bw=Math.max(3,Math.round(dur[i]/T*w));const col=o.col?o.col(i):'#3a3448';rect(c,a,y,bw-1,12,i===cur?'#f2c14e':col);
    if(bw>14)drawText(c,String(dur[i]),a+bw/2-1,y+2,i===cur?CB.ink:'#d6cfdc',FONT_S,{align:'center'});if(lab[i]&&bw>8)drawText(c,lab[i],a+bw/2-1,y+15,'#a9a1b4',FONT_S,{align:'center'});a+=bw;}
  if(o.ph!=null){const px_=x+Math.round(clamp(o.ph,0,T)/T*w);rect(c,px_,y-3,1,18,'#ffffff');}}
const hitstopMs=f=>Math.round(f*FR);

// ======================================================================
// HERO: a live arena in four fight styles
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=108,tiers=$$('.hero-tiers button',root),m=meter(.1),r=mkRng(17);
  const bg=mkArena(W,H,5),bc=bg.getContext('2d');[[14,32],[178,32]].forEach(([x,y])=>pillar(bc,x,y));
  let mode=0,t=0,hud=0,uid=1;const nums=mkNums({per:4,cap:64}),cam=mkCam(3);
  const me={kind:'knight',x:110,y:112,v:vfx(),an:0,face:1,sw:-1,cd:.4,tgt:null,hx:110,hy:112};
  let gobs=[],allies=[],bolts=[],fx=[];
  const spawn=(x,y)=>({id:uid++,kind:'goblin',x,y,hx:x,hy:y,v:vfx(),hp:70,max:70,an:r()*4,dead:-1,ph:r()*6,atk:1+r()*2,lunge:1e9});
  function setMode(k){mode=k;tiers.forEach((b,i)=>b.classList.toggle('on',i===k));nums.clear();fx=[];bolts=[];me.sw=-1;me.tgt=null;me.v=vfx();cam.tr=0;
    const crowd=k===2;gobs=[];const n=crowd?6:5,P=crowd?[[48,46],[96,40],[146,46],[56,90],[110,92],[160,88]]:[[112,66],[132,44],[146,80],[100,94],[124,30]];for(let i=0;i<n;i++)gobs.push(spawn(P[i][0]+r()*6,P[i][1]+r()*4));
    allies=[];if(crowd)for(let i=0;i<5;i++){const g=gobs[(i+1)%n];allies.push({kind:'ally',x:g.x-16,y:g.y+2,v:vfx(),an:0,face:1,sw:-1,cd:r()*1.5,tgt:g});}
    me.x=k===1?40:84;me.y=k===1?70:68;}
  tiers.forEach((b,i)=>b.addEventListener('click',()=>{setMode(i);for(let j=0;j<50;j++)api.tick(1/60,true);}));setMode(0);
  const juice=()=>mode!==3;
  function hit(att,g,own,dmgIn){if(g.dead>=0)return;let dmg=dmgIn||(6+((r()*14)|0));const crit=r()<.18;if(crit)dmg*=2;g.hp-=dmg;const kill=g.hp<=0;
    const f=kill?8:crit?6:3,ms=hitstopMs(f),J=juice();
    if(J){if(own){if(att)vhit(att.v,{frz:ms});vhit(g.v,{frz:ms,shake:true,flash:'white',rec:crit?4:2,dir:att?att.face:1});}else vhit(g.v,{flash:'red',fk:.5,rec:1,dir:att?att.face:1});
      fx.push({x:g.x,y:g.y-7,t:own?-ms:0,col:crit?'#ffd23a':'#fff0c0'});if(own&&crit){cam.add(.3);cam.kick(-(att?att.face:1),0);}}
    nums.add(g.id,dmg,g.x,g.y-24,crit?NUMC.crit:NUMC.phys,{crit,a:own?1:.5,life:crit?1200:1000});
    if(kill){g.dead=0;g.killMs=ms;if(own)me.tgt=null;}}
  function gobHits(g){const dmg=4+((r()*10)|0);if(juice()){vhit(me.v,{flash:'red',fk:.5});cam.add(.2+.3*dmg/60);}nums.add('me',dmg,me.x,me.y-26,NUMC.phys);g.lunge=0;}
  function stepSwing(u,ms,onHit){if(u.sw<0)return;if(frozen(u.v))return;const prev=swFrame(u.sw,SWING.sword);u.sw+=ms;const f=swFrame(u.sw,SWING.sword);if(prev<4&&(f>=4||f<0))onHit();if(f<0)u.sw=-1;}
  const api={tick(dt,warm){const s=dt*(still()&&!warm?0:1),ms=s*1000;t+=s;m.t0();
    // simulation
    vstep(me.v,ms);for(const g of gobs)vstep(g.v,ms);for(const a of allies)vstep(a.v,ms);nums.tick(ms);const sh=cam.step(s);
    const live=gobs.filter(g=>g.dead<0);
    for(const g of gobs){if(g.dead>=0){if(!frozen(g.v))g.dead+=ms;if(g.dead>1900){Object.assign(g,spawn(g.hx,g.hy),{id:g.id});}continue;}
      if(!frozen(g.v)){g.ph+=s*(mode===1?2.4:.8);g.an+=s*6;const amp=mode===1?18:5;g.x=g.hx+Math.sin(g.ph*.7)*amp*.4;g.y=g.hy+Math.sin(g.ph)*amp;}g.lunge+=ms;}
    if(mode===1){me.face=1;me.cd-=s;if(me.sw>=0){const pf=swFrame(me.sw,SWING.sword);me.sw+=ms;const f=swFrame(me.sw,SWING.sword);
        if(pf<2&&f>=2&&live.length){const g=live[(r()*live.length)|0],dx=g.x-me.x-6,dy=(g.y-6)-(me.y-9),d=Math.hypot(dx,dy)||1;bolts.push({x:me.x+6,y:me.y-9,vx:dx/d*192,vy:dy/d*192,left:120,tr:[]});}
        if(f<0)me.sw=-1;}
      if(me.cd<=0&&me.sw<0){me.sw=0;me.cd=.65;}}
    else{if(!me.tgt||me.tgt.dead>=0)me.tgt=live.slice().sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0]||null;
      me.cd-=s;const g=me.tgt;
      if(g&&me.sw<0&&!frozen(me.v)){const side=g.x>=me.x?-1:1,tx=g.x+side*15,ty=g.y,dx=tx-me.x,dy=ty-me.y,d=Math.hypot(dx,dy);
        if(d>2){const st=Math.min(d,38*s);me.x+=dx/d*st;me.y+=dy/d*st;me.an+=s*8;}else{me.face=g.x>=me.x?1:-1;if(me.cd<=0){me.sw=0;me.cd=.65;}}}
      stepSwing(me,ms,()=>{if(me.tgt)hit(me,me.tgt,true);});
      if(g&&g.dead<0&&!frozen(g.v)){g.atk-=s;if(g.atk<=0&&Math.hypot(g.x-me.x,g.y-me.y)<22){g.atk=1.6+r();gobHits(g);}}}
    for(const a of allies){if(!a.tgt||a.tgt.dead>=0){a.tgt=live[(r()*live.length)|0]||null;}const g=a.tgt;if(!g)continue;
      const tx=g.x-15,ty=g.y+3,dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);if(a.sw<0){if(d>2){const st=Math.min(d,30*s);a.x+=dx/d*st;a.y+=dy/d*st;a.an+=s*8;}else{a.cd-=s;if(a.cd<=0){a.sw=0;a.cd=1.1+r()*.8;}}}
      a.face=1;stepSwing(a,ms,()=>{if(a.tgt)hit(a,a.tgt,false);});}
    for(const b of bolts){b.tr.unshift([b.x,b.y]);if(b.tr.length>4)b.tr.pop();const st=Math.hypot(b.vx,b.vy)*s;b.x+=b.vx*s;b.y+=b.vy*s;b.left-=st;
      for(const g of gobs){if(g.dead>=0)continue;if(Math.hypot(g.x-b.x,(g.y-6)-b.y)<=9){hit(null,g,true,8+((r()*16)|0));b.done=true;break;}}
      if(!b.done&&b.left<=0){b.done=true;fx.push({x:b.x,y:b.y,t:0,col:'#a9a1b4',puff:1});}}
    bolts=bolts.filter(b=>!b.done);for(const f of fx)f.t+=ms;fx=fx.filter(f=>f.t<300);
    // draw
    c.fillStyle=CB.floor2;c.fillRect(0,0,W,H);c.save();c.translate(cam.ox,cam.oy);c.drawImage(bg,0,0);torch(c,14,6,t);torch(c,178,6,t);
    const ents=[];for(const g of gobs)ents.push(g);ents.push(me);for(const a of allies)ents.push(a);ents.sort((a,b)=>a.y-b.y);
    for(const e of ents){if(e.kind==='goblin'){const g=e;
        if(g.dead>=0){if(g.dead<133){drawUnit(c,'goblin',g.x,g.y,{flash:g.dead<2*FR?'white':null,sx:juice()?1.2:1,sy:juice()?.8:1});}else{const a=g.dead>1500?1-(g.dead-1500)/400:1;drawUnit(c,'goblin',g.x,g.y,{pose:'dead',a:Math.max(0,a),shadow:false});}continue;}
        const lg=g.lunge<120?(g.x>me.x?-2:2):0;drawUnit(c,'goblin',g.x,g.y,vopts(g.v,{fr:((g.an|0)&1),dx:lg}));
        if(mode!==1&&me.tgt===g)tmark(c,g.x-8,g.y-15,17,18,'#ff3a2a');hpBar(c,g.x,g.y-19,12,g.hp/g.max);}
      else{const u=e,f=u.sw>=0?swFrame(u.sw,SWING.sword):-1,ang=f>=0?SWA.sword[f]:-1.1,moving=u.sw<0&&!frozen(u.v)&&mode!==1&&Math.abs((u.an%2)-1)<2;
        const o=vopts(u.v,{fr:u.sw<0?((u.an|0)&1):0,flip:u.face<0,kind:u.kind,weapon:'sword',ang,dx:f>=0?SWX.sword[f]*u.face:0});
        if(juice()&&f===2&&!frozen(u.v)){const hx=u.x+(u.face>0?3:-3),hy=u.y-6;if(u.face>0)drawSmear(c,hx,hy,-1.25,.55,5,11);else drawSmear(c,hx,hy,Math.PI-.55,Math.PI+1.25,5,11);}
        drawKnight(c,u.x,u.y,o);}}
    for(const b of bolts){b.tr.forEach(([x,y],i)=>{c.fillStyle=i<2?'rgba(127,220,255,.7)':'rgba(127,220,255,.35)';c.fillRect(Math.round(x)-1,Math.round(y),2,1);});rect(c,b.x-1,b.y-1,3,3,'#7fdcff');px(c,b.x,b.y,'#ffffff');}
    if(juice()||mode===1)for(const f of fx){if(f.t<0)continue;spark(c,f.x,f.y,Math.min(3,(f.t/75)|0),f.col);}
    nums.draw(c);c.restore();
    const ms_=m.t1();if((hud-=dt)<=0){hud=.25;setHud(root,`JS ${fms(ms_)} ms/frame · ${nums.list.length} numbers${mode===2?' · allies dimmed':''}${sh>0.01?' · shake '+Math.round(sh*100)+'%':''}`);}}};for(let i=0;i<150;i++)api.tick(1/60,true);return api;});

// ======================================================================
// §3 timeline: five generations on a linear 1996-2027 axis
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#ec7a5c','#f2c14e','#9fd3c7','#7fb0ff','#d7a2e8'];
  const X=y=>1.5+(y-1996)/32*95;
  let h='<div class="tl-axis">';for(const y of [1997,2004,2013,2018,2025])h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
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
  const pick=items.find(i=>/Tibia and Ultima Online launch/.test(i.e.h))||items[0];show(pick.id);return {};});

// ======================================================================
// A1 swing: anticipation, a fixed 150 ms strike, a follow-through hold
// ======================================================================
reg('swing',root=>{const cv=$('canvas',root),c=C2(cv),W=160,H=80,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,52,9);
  let wk='sword',ms=-1,idle=0,nums=mkNums({merge:0,stack:0,rise:14}),fx=[],g={v:vfx()};
  const dur=()=>{const d=SWING[wk].slice();d[0]=cc.v('ant');d[4]=cc.v('hold');return d;};
  const sync=()=>{cc.out('ant',cc.v('ant')+' ms');cc.out('hold',cc.v('hold')+' ms');const d=dur(),T=sum(d);
    ro.innerHTML=`<b>${wk}</b> ${d.join(' + ')} = <b>${T} ms</b> · strike ${d[1]+d[2]+d[3]} ms · wind-up ${d[0]} ms · hold ${d[4]} ms`+(d[0]>250?' · <b>over 250 ms the wind-up reads as input lag</b> unless a cast bar or decal shows it':'');};
  cc.seg('w',v=>{wk=v;cc.el('ant').value=SWING[v][0];cc.el('hold').value=SWING[v][4];sync();ms=0;});
  cc.on('ant',sync);cc.on('hold',sync);cc.btn('go',()=>{ms=0;});sync();
  return {tick(dt){const sl=slowF(root),s=dt*sl*(still()?0:1),step=s*1000,d=dur(),T=sum(d);vstep(g.v,step);nums.tick(step);for(const f of fx)f.t+=step;fx=fx.filter(f=>f.t<300);
    if(ms<0){idle+=s;if(idle>.7&&!still()){ms=0;idle=0;}}else{const pf=swFrame(ms,d);ms+=step;const f=swFrame(ms,d);
      if(pf<4&&(f>=4||f<0)){const dmg={sword:12,spear:14,hammer:31}[wk];vhit(g.v,{flash:'white',rec:wk==='hammer'?3:2,dir:1});nums.add(1,dmg,94,22,NUMC.phys);fx.push({x:92,y:37,t:0});}
      if(f<0){ms=-1;idle=0;}}
    const f=ms>=0?swFrame(ms,d):-1;
    c.drawImage(bg,0,0);rect(c,0,52,W,H-52,'#100d15');
    drawUnit(c,'goblin',94,45,vopts(g.v,{flip:true}));
    const ang=f>=0?SWA[wk][f]:(wk==='spear'?-.2:-1.1);drawKnight(c,wk==='spear'?60:68,45,{weapon:wk,ang,dx:f>=0?SWX[wk][f]:0});
    for(const x of fx)spark(c,x.x,x.y,Math.min(3,(x.t/75)|0),'#fff0c0');nums.draw(c);
    drawText(c,f<0?'idle':['wind-up','strike','strike','strike','hold','recovery'][f],4,4,'#f3eef5',FONT_S,{outline:CB.ink});
    if(sl<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    strip(c,6,58,148,d,f,{lab:['wind','','strike','','hold','rec'],col:i=>i>=1&&i<=3?'#8a2a2a':i===4?'#3a5a8a':'#3a3448',ph:ms>=0?ms:null});}};});

// ======================================================================
// A2 smear: one stretched frame, and a hitbox that sweeps with it
// ======================================================================
reg('smear',root=>{const cv=$('canvas',root),c=C2(cv),W=144,H=80,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,H,13);
  const KX=52,KY=56,HX=KX-5+8,HY=KY-15+9,A0=SWA.sword[1],A1=SWA.sword[3],R=21;
  const gob=[-1.0,-.3,.42].map(a=>({a,x:HX+Math.cos(a)*R,y:HY+Math.sin(a)*R+6,v:vfx(),hitAt:-1}));
  let ms=-1,idle=0,nums=mkNums({merge:0,stack:0,rise:14});const d=SWING.sword,ST=d[0];
  const report=()=>{const hs=gob.map(g=>g.hitAt).filter(x=>x>=0);ro.innerHTML=(cc.segv('hb')==='sweep'?'Hitbox sweeps with the blade':'Hitbox pops in on the last strike frame')+(hs.length?` · hits at <b>${hs.map(x=>Math.round(x)+' ms').join(', ')}</b> after the swing started`:'')+` · strike frames ${ST} to ${ST+150} ms`;};
  cc.seg('hb',()=>{ms=0;});cc.btn('go',()=>{ms=0;});
  return {tick(dt){const sl=slowF(root),s=dt*sl*(still()?0:1),step=s*1000,mode=cc.segv('hb');gob.forEach(g=>vstep(g.v,step));nums.tick(step);
    if(ms<0){idle+=s;if(idle>.9&&!still()){ms=0;idle=0;}}else{if(ms===0)gob.forEach(g=>g.hitAt=-1);ms+=step;
      const into=ms-ST;let reach=null;if(mode==='sweep'){if(into>=0&&into<150)reach=A0+(A1-A0)*into/150;else if(into>=150)reach=A1;}else if(into>=100)reach=A1;
      for(const g of gob)if(g.hitAt<0&&reach!==null&&g.a<=reach){g.hitAt=ms;vhit(g.v,{flash:'white',rec:1,dir:1});nums.add(g.a,8,g.x+9,g.y-12,NUMC.phys);report();}
      if(swFrame(ms,d)<0){ms=-1;idle=0;}}
    const f=ms>=0?swFrame(ms,d):-1,into=ms-ST;c.drawImage(bg,0,0);
    if(cc.v('hit')&&f>=1&&f<=3){let a1=null;if(mode==='sweep')a1=A0+(A1-A0)*clamp(into/150,0,1);else if(f===3)a1=A1;
      if(a1!==null){c.fillStyle='rgba(255,60,48,.28)';for(let j=-R-6;j<=R+6;j++)for(let i=-R-6;i<=R+6;i++){const dd=Math.hypot(i,j);if(dd<4||dd>R+5)continue;const a=Math.atan2(j,i);if(a>=A0&&a<=a1)c.fillRect(HX+i,HY+j,1,1);}}}
    for(const g of gob)drawUnit(c,'goblin',g.x,g.y,vopts(g.v,{flip:true}));
    if(cc.v('sm')&&f===2)drawSmear(c,HX,HY,A0,A1,5,13);
    drawKnight(c,KX,KY,{weapon:'sword',ang:f>=0?SWA.sword[f]:-1.1,dx:f>=0?SWX.sword[f]:0});nums.draw(c);
    drawText(c,f<0?'idle':['wind-up','strike 1','strike 2, smear','strike 3','hold, clean','recovery'][f],4,4,'#f3eef5',FONT_S,{outline:CB.ink});
    if(sl<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});}};});

// ======================================================================
// A3 directions: 4 or 8 or 16, mirrored or not, and separate layers
// ======================================================================
reg('directions',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=96,cc=ctl(root),ro=$('[data-ro]',root);
  const P=UNITS.knight.pal,L=UNITS.knight.legs[0],head=["....pp....","...oooo...","..ommmmo..",".ommmmmmo."];
  const FRONT=sprite(head.concat([".omvvvvmo.",".oMmmmmMo.","..oMMMMo..",".obbbbbbo.","ombbbbbbmo","oMBhhhhBMo",".oBbbbbBo.",".ollllllo."],L),P,'kfront');
  const BACK=sprite(head.concat([".ommmmmmo.",".oMmmmmMo.","..oMMMMo..",".oBbbbbBo.","omBbbbbBmo","oMBbbbbBMo",".oBbbbbBo.",".ollllllo."],L),P,'kback');
  const SIDE=unitImg('knight',0,'idle'),MODES={'4m':[4,true],'4':[4,false],'8m':[8,true],'8':[8,false],'16':[16,false]},CX=48,CY=50;
  let aim=.3,auto=true,t=0,sw=0;
  pointer(cv,([x,y],k)=>{if(k==='leave'){auto=true;return;}if(x<98){aim=Math.atan2(y-CY,x-CX);auto=false;}});
  const q4=a=>((Math.round(a/(Math.PI/2))%4)+4)%4;
  function put(img,x,y,flip){const X=Math.round(x-img.width/2),Y=Math.round(y-img.height);if(flip){c.save();c.translate(X+img.width,Y);c.scale(-1,1);c.drawImage(img,0,0);c.restore();}else c.drawImage(img,X,Y);}
  cc.seg('m',()=>{});
  return {tick(dt){const s=dt*(still()?0:1);t+=s;sw=(sw+s*1000)%900;if(auto)aim+=s*.6;
    const [n,mir]=MODES[cc.segv('m')],step=2*Math.PI/n,snap=Math.round(aim/step)*step;let drawn=0;
    rect(c,0,0,W,H,'#18141e');rect(c,0,0,98,H,CB.floor2);for(let y=0;y<H;y+=16)rect(c,0,y,98,1,CB.mortar);for(let x=0;x<98;x+=16)rect(c,x,0,1,H,CB.mortar);
    for(let k=0;k<n;k++){const a=k*step,x=Math.round(CX+Math.cos(a)*40),y=Math.round(CY+Math.sin(a)*38),m=mir&&Math.cos(a)<-.01,on=Math.abs(((a-snap)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI)<.01;if(!m)drawn++;
      rect(c,x-2,y-2,5,5,CB.ink);rect(c,x-1,y-1,3,3,on?'#f2c14e':m?'#5b4f6b':'#ec7a5c');}
    const k4=q4(snap),img=[SIDE,FRONT,SIDE,BACK][k4],fl=k4===2,lb=cc.v('lb'),lw=cc.v('lw'),le=cc.v('le');
    const a0=snap-1.1,a1=snap+.6,cur=sw<150?a0+(a1-a0)*sw/150:snap-.5,hx=CX+Math.round(Math.cos(snap)*3),hy=CY-4+Math.round(Math.sin(snap)*2);
    const behind=Math.sin(snap)<-.2;
    if(lw&&behind)drawSword(c,hx,hy,cur,10);if(le&&sw<150)drawSmear(c,hx,hy,a0,cur,5,14);if(lb)put(img,CX,CY+8,fl);if(lw&&!behind)drawSword(c,hx,hy,cur,10);
    const panel=(y,lab,fn)=>{frame(c,102,y,88,30,'ink');drawText(c,lab,106,y+4,'#a9a1b4',FONT_S);fn(166,y+16);};
    panel(1,'BODY',(x,y)=>put(img,x,y+12,fl));panel(33,'WEAPON',(x,y)=>drawSword(c,x-2,y,cur,10));
    panel(65,'EFFECT',(x,y)=>{if(sw<150)drawSmear(c,x-2,y,a0,cur,5,12);});
    drawText(c,(drawn*6)+' FRAMES',3,3,'#ffd23a',FONT_S,{outline:CB.ink});
    ro.innerHTML=`<b>${n} directions${mir?', left side mirrored':''}</b> · ${drawn} drawn × 6 frames = <b>${drawn*6} frames per attack</b> · the body snaps to 4 directions, the sword and smear to ${n}`+(mir&&fl?' · mirrored: the sword is in the other hand':'');}};});

// ======================================================================
// A4 auto-attack rhythm: a 2000 ms swing timer drawn three ways
// ======================================================================
reg('rhythm',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=124,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,100,21);
  const P=2000,lanes=['SWING ON THE HIT','SWING STRETCHED OVER 2 S','TIBIA, EFFECT ONLY'].map((lab,i)=>({lab,y:30+i*33,v:vfx(),nums:mkNums({merge:0,stack:0,rise:12}),fx:[]}));
  let t=900,last=-1,info='';const d=SWING.sword;
  cc.on('lat',()=>cc.out('lat',cc.v('lat')+' ms'));cc.out('lat',cc.v('lat')+' ms');
  return {tick(dt){const sl=slowF(root),s=dt*sl*(still()?0:1),step=s*1000;t+=step;const lat=cc.v('lat'),k=Math.floor(t/P),T=k*P,tc=t-T;
    for(const l of lanes){vstep(l.v,step);l.nums.tick(step);for(const f of l.fx)f.t+=step;l.fx=l.fx.filter(f=>f.t<300);}
    if(k!==last&&tc>=lat){last=k;lanes.forEach(l=>{vhit(l.v,{flash:'white',rec:1,dir:1});l.nums.add(1,9+((k*7)%9),132,l.y-20,NUMC.phys);l.fx.push({x:118,y:l.y-7,t:0});});
      info=lat<=100?`packet ${lat} ms after the server hit, inside the 100 ms wind-up, so the strike lands on time`:lat<=250?`packet ${lat} ms late, so the wind-up pose waits ${lat-100} ms, under the 150 ms cap`:`packet ${lat} ms late, past the 150 ms cap, so the strike played at 250 ms without a number`;}
    c.drawImage(bg,0,0);rect(c,0,100,W,H-100,'#100d15');
    lanes.forEach((l,i)=>{let ang=-.6,dx=0,bob=(Math.floor(tc/500)%2)?0:-1;
      if(i===0){let ms=-1;if(tc<100)ms=tc;else{const st=Math.min(Math.max(lat,100),250);ms=tc<st?99:100+(tc-st);}const f=swFrame(ms,d);if(f>=0){ang=SWA.sword[f];dx=SWX.sword[f];bob=0;}}
      else if(i===1){const f=swFrame(tc/P*sum(d),d);ang=f>=0?SWA.sword[f]:-.6;dx=f>=0?SWX.sword[f]:0;bob=0;}
      if(i)rect(c,0,l.y-25,W,1,'rgba(8,6,14,.5)');drawText(c,l.lab,4,l.y-23,'#d6cfdc',FONT_S,{outline:CB.ink});
      drawUnit(c,'goblin',120,l.y,vopts(l.v,{flip:true}));
      if(i<2)drawKnight(c,94,l.y,{weapon:'sword',ang,dx,dy:bob});else drawUnit(c,'knight',94,l.y,{});
      for(const x of l.fx)spark(c,x.x,x.y,Math.min(3,(x.t/75)|0),i===2?'#ffd23a':'#fff0c0');l.nums.draw(c);});
    const bx=8,bw=176,y=105;rect(c,bx,y,bw,6,'#2b2436');rect(c,bx,y+1,Math.round(tc/P*bw),4,'#5b4f6b');rect(c,bx,y-2,1,10,'#ff4030');rect(c,bx+Math.round(lat/P*bw),y-2,1,10,'#7fdcff');rect(c,bx+Math.round(tc/P*bw),y-3,1,12,'#ffffff');
    drawText(c,'PACKET',bx+Math.round(lat/P*bw)+3,y+9,'#7fdcff',FONT_S);drawText(c,'2000 MS',bx+bw,y+9,'#a9a1b4',FONT_S,{align:'right'});
    if(sl<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    ro.innerHTML=`Server hit every <b>2000 ms</b> (red tick) · ${info||'waiting for the first hit'}`;}};});

// ======================================================================
// A5 cancels: recovery cancels end locally, startup cancels ask the server
// ======================================================================
reg('cancel',root=>{const cv=$('canvas',root),c=C2(cv),W=176,H=112,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,52,27);
  const d=SWING.hammer,ANT=d[0],TOT=sum(d);let ms=-1,ev=[],res='',g={v:vfx()},nums=mkNums({merge:0,stack:0,rise:14}),verdictAt=-1,cancelled=false,auto=0;
  const out=()=>cc.out('rtt',cc.v('rtt')+' ms');cc.on('rtt',out);out();
  const start=()=>{const h=cc.v('rtt')/2;ms=0;ev=[{who:0,t:0,lab:'SWING'},{who:1,t:h,lab:'',arrow:0},{who:1,t:h+ANT,lab:'HIT'}];res='';verdictAt=-1;cancelled=false;};
  cc.btn('go',()=>{start();auto=-99;});
  cc.btn('cx',()=>{if(ms<0||cancelled||verdictAt>0)return;const rtt=cc.v('rtt');auto=-99;
    if(ms>=ANT){cancelled=true;ev.push({who:0,t:ms,lab:'MOVE'});res=`Recovery cancelled at ${Math.round(ms)} ms, on your screen at once. The hit had already landed, so nothing goes to the server.`;ms=-1;return;}
    const ok=ms<ANT-33;ev.push({who:0,t:ms,lab:'CANCEL'},{who:1,t:ms+rtt/2,lab:ok?'OK':'LATE',arrow:3});
    if(ok){ev.push({who:0,t:ms+rtt,lab:'STOP',arrow:4});verdictAt=ms+rtt;res=`Startup cancel pressed at ${Math.round(ms)} ms. It reaches the server ${rtt/2} ms later, before the hit frame, so the swing stops. You learn that ${rtt} ms after the press.`;}
    else res=`Pressed at ${Math.round(ms)} ms, inside the 33 ms grace before the hit frame, so the server refuses and the swing lands.`;});
  start();
  return {tick(dt){const sl=slowF(root),s=dt*sl*(still()?0:1),step=s*1000;vstep(g.v,step);nums.tick(step);
    if(ms>=0){const pf=swFrame(ms,d);let nx=ms+step;
      if(verdictAt>0){if(nx>=verdictAt){cancelled=true;ms=-1;verdictAt=-1;}else if(nx>=ANT-1)nx=ANT-1;}
      if(ms>=0){ms=nx;const f=swFrame(ms,d);if(pf<4&&(f>=4||f<0)){vhit(g.v,{flash:'white',rec:2,dir:1});nums.add(1,31,104,14,NUMC.phys);}if(f<0)ms=-1;}}
    else{auto+=s;if(auto>1.4&&!still()){start();auto=0;}}
    const f=ms>=0?swFrame(ms,d):-1;c.drawImage(bg,0,0);drawUnit(c,'goblin',104,44,vopts(g.v,{flip:true}));
    drawKnight(c,76,44,{weapon:'hammer',ang:f>=0?SWA.hammer[f]:-1.1,dx:f>=0?SWX.hammer[f]:0});nums.draw(c);
    drawText(c,f<0?(cancelled?'cancelled':'idle'):(verdictAt>0&&ms>=ANT-1?'waiting for the server':['wind-up','strike','strike','strike','hold','recovery'][f]),4,4,'#f3eef5',FONT_S,{outline:CB.ink});
    if(sl<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    rect(c,0,52,W,H-52,'#100d15');const X=v=>34+Math.round(v/1000*136),ly=[72,98];
    drawText(c,'YOU',3,ly[0]-2,'#d6cfdc',FONT_S);drawText(c,'SERVER',3,ly[1]-2,'#d6cfdc',FONT_S);
    for(const y of ly)rect(c,34,y,138,1,'#3a3448');rect(c,X(0),ly[0]-2,X(ANT)-X(0),2,'rgba(242,193,78,.5)');rect(c,X(ANT-33),ly[0]-2,X(ANT)-X(ANT-33),2,'#ff4030');
    c.strokeStyle='rgba(214,207,220,.45)';c.lineWidth=1;const ln=(a,b)=>{c.beginPath();c.moveTo(X(a.t)+.5,ly[a.who]+.5);c.lineTo(X(b.t)+.5,ly[b.who]+.5);c.stroke();};
    ln(ev[0],ev[1]);for(const e of ev)if(e.arrow)ln(ev[e.arrow-1]||ev[0],e);
    for(const e of ev){const x=X(e.t),y=ly[e.who];rect(c,x,y-2,1,5,e.who?'#7fdcff':'#f2c14e');if(e.lab)drawText(c,e.lab,x,e.who?y+5:y-10,e.who?'#7fdcff':'#f2c14e',FONT_S,{align:'center'});}
    if(ms>=0)rect(c,X(ms),ly[0]-5,1,10,'#ffffff');
    ro.innerHTML=res||`Hammer, ${ANT} ms wind-up, hit frame at ${ANT} ms, ${TOT} ms in all. Press <b>Cancel or move</b> during the wind-up or after the hit.`;}};});

// ======================================================================
// A6 casts: raise, hold loop, release on the castpoint; cast bars (E5)
// ======================================================================
reg('cast',root=>{const cv=$('canvas',root),c=C2(cv),W=176,H=100,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,64,33);
  const CT=1500,MX=44,GX=136,GY=52;let ms=-1,auto=.5,state='',g={v:vfx()},nums=mkNums({merge:0,stack:0,rise:14}),bolt=null,shieldT=1e9,brk=-1;
  const out=()=>cc.out('lat',cc.v('lat')+' ms');cc.on('lat',out);out();
  const go=()=>{ms=0;state='';brk=-1;};cc.btn('go',()=>{go();auto=-99;});
  cc.btn('int',()=>{if(ms<0){state='Nothing to interrupt. Start a cast first.';return;}auto=-99;
    if(cc.segv('k')==='shield'){shieldT=0;state='The shield holds. This cast cannot be interrupted, and the bar said so before anyone used a stun.';}
    else{brk=0;ms=-1;state='Interrupted. The bar turns red and the loop stops for everyone.';}});
  return {tick(dt){const sl=slowF(root),s=dt*sl*(still()?0:1),step=s*1000,lat=cc.v('lat'),sh=cc.segv('k')==='shield';vstep(g.v,step);nums.tick(step);shieldT+=step;if(brk>=0)brk+=step;
    if(ms>=0){ms+=step;if(ms>=CT){ms=-1;bolt={x:MX+6,y:GY-10,t:0};state=state||'Released on the castpoint. Everyone sees the flash on the server event.';}}else if(brk<0||brk>900){auto+=s;if(auto>1&&!still()){go();auto=0;}}
    if(bolt){bolt.t+=step;bolt.x+=s*190;if(bolt.x>=GX-6){vhit(g.v,{flash:'white',rec:2,dir:1});nums.add(1,46,GX+8,GY-20,NUMC.energy);bolt=null;}}
    c.drawImage(bg,0,0);drawUnit(c,'goblin',GX,GY,vopts(g.v,{flip:true}));
    const ph=ms<0?'idle':ms<150?'raise':ms<CT-33?'loop':'release',loopF=Math.floor(Math.max(0,ms-150)/125)%3,rel=ms<0&&bolt&&bolt.t<33;
    drawUnit(c,'mage',MX,GY,{dy:ph==='raise'?-Math.round(ms/150):ph==='loop'||ph==='release'?-1:0,flash:rel||ph==='release'?'#e8c8ff':null,fa:.7});
    if(ph==='loop'||ph==='raise'){const k=ph==='raise'?Math.round(ms/50):3+loopF,r=[1,1,2,2,3,2][Math.min(5,k)],oy=GY-21;rect(c,MX-r,oy-r,2*r+1,2*r+1,'#c070ff');rect(c,MX-r+1,oy-r+1,Math.max(1,2*r-1),Math.max(1,2*r-1),'#e8c8ff');px(c,MX,oy,'#ffffff');
      for(let i=0;i<3;i++){const a=ms/200+i*2.1;px(c,MX+Math.round(Math.cos(a)*6),oy+Math.round(Math.sin(a)*4),'#c070ff');}}
    if(bolt){rect(c,bolt.x-1,bolt.y-1,3,3,'#c070ff');px(c,bolt.x,bolt.y,'#ffffff');rect(c,bolt.x-5,bolt.y,4,1,'rgba(192,112,255,.5)');}
    if(sh&&ms>=0){c.globalAlpha=shieldT<300?1:.75;rect(c,MX-12,GY-12,5,6,CB.ink);rect(c,MX-11,GY-11,3,4,'#c9ccd6');px(c,MX-10,GY-7,'#c9ccd6');c.globalAlpha=1;}
    nums.draw(c);rect(c,0,64,W,H-64,'#100d15');
    const bar=(y,lab,start)=>{drawText(c,lab,4,y+2,'#d6cfdc',FONT_S);const bx=56,bw=114;rect(c,bx,y,bw,9,sh?'#c9ccd6':CB.ink);rect(c,bx+1,y+1,bw-2,7,'#211c29');
      let fr=0;if(ms>=0)fr=clamp((ms-start)/(CT-start),0,1);else if(brk>=0&&brk<900)fr=1;
      const fc=brk>=0&&brk<900&&ms<0?'#d9503a':sh?'#9aa2b4':'#f2c14e';if(fr>0)rect(c,bx+1,y+1,Math.round((bw-2)*fr),7,fc);
      if(ms>=0&&ms<start)drawText(c,'NOT SEEN YET',bx+bw/2,y+2,'#857d92',FONT_S,{align:'center'});};
    bar(70,'YOUR BAR',0);bar(85,'OTHERS SEE',Math.min(CT-1,lat));
    drawText(c,ph.toUpperCase(),4,4,'#f3eef5',FONT_S,{outline:CB.ink});if(sl<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    ro.innerHTML=(state||`Cast ${CT} ms with a 150 ms raise, a 3-frame loop at 125 ms per frame and a release on the castpoint.`)+` · others start ${lat} ms late but end on the server's time`;}};});
// ======================================================================
// B1 hitstop: per entity against global, frames, Smash's player factor
// ======================================================================
reg('hitstop',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=96,cc=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),bg=mkArena(W,H,41);
  const me={kind:'knight',x:84,y:60,v:vfx(),sw:-1,face:1},foe={kind:'rival',x:108,y:60,v:vfx(),sw:-1,face:-1};let turn=0,cd=.5,gfrz=0,nums=mkNums({merge:0,stack:0,rise:14}),fx=[],last='';
  const walk=[{x:10,y:30,sp:14,an:0,kind:'ally'},{x:150,y:88,sp:-11,an:0,kind:'ally'},{x:70,y:88,sp:-11,an:.5,kind:'mage'}];
  const sync=()=>{cc.out('f',cc.v('f')+' f = '+hitstopMs(cc.v('f'))+' ms');chart();};
  cc.on('f',()=>{cc.setSeg('k','');sync();});cc.seg('k',v=>{cc.el('f').value=v;sync();});cc.seg('mode',()=>{});
  function chart(){svg.innerHTML='';const VW=320,VH=160,L=30,R=VW-8,T=10,B=VH-34,X=d=>L+d/40*(R-L),Y=f=>B-f/30*(B-T);svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
    svgEl('rect',{x:L,y:Y(8),width:R-L,height:Y(3)-Y(8),fill:'#ec7a5c',opacity:.16},svg);svgText(svg,X(16),Y(5.5)+3,'Asterion 3 to 8 f',{'font-size':10,fill:'#ec7a5c'});
    for(const f of [0,10,20,30]){svgEl('line',{x1:L,x2:R,y1:Y(f),y2:Y(f),class:'gl'},svg);svgText(svg,L-5,Y(f)+3,String(f),{'text-anchor':'end','font-size':10});}
    for(const d of [0,10,20,30,40])svgText(svg,X(d),B+13,d+'%',{'text-anchor':'middle','font-size':10});
    svgText(svg,(L+R)/2,VH-1,'damage of the hit (Smash Ultimate)',{'text-anchor':'middle','font-size':10,class:'lab'});
    const one=d=>Math.min(30,.65*d+6),eight=d=>{const h=one(d);return h<=10?h:h*(1-.25*(h-10)/20);},pts=(fn)=>{const a=[];for(let d=0;d<=40;d+=.5)a.push([X(d),Y(fn(d))]);return a;};
    poly(svg,pts(one),{stroke:'#f2c14e','stroke-width':2});poly(svg,pts(eight),{stroke:'#7fdcff','stroke-width':2,'stroke-dasharray':'5 3'});
    svgText(svg,X(20),Y(one(20))-9,'1 on 1',{'font-size':10,fill:'#f2c14e','text-anchor':'end'});svgText(svg,X(31),Y(eight(31))+13,'8 players',{'font-size':10,fill:'#7fdcff'});
    const f=cc.v('f');svgEl('line',{x1:L,x2:R,y1:Y(f),y2:Y(f),class:'now'},svg);svgText(svg,R-4,Y(f)+(f>20?12:-3),'this figure, '+f+' f',{'text-anchor':'end','font-size':10,class:'v'});}
  sync();
  const hit=(a,b)=>{const F=cc.v('f'),ms=hitstopMs(F),glob=cc.segv('mode')==='global';if(glob)gfrz=ms;else{vhit(a.v,{frz:ms});}vhit(b.v,{frz:glob?0:ms,shake:!glob,flash:'white',rec:2,dir:a.face});
    nums.add(b===me?0:1,F>=6?24:12,b.x,b.y-26,F>=6?NUMC.crit:NUMC.phys);fx.push({x:b.x-a.face*4,y:b.y-8,t:-ms});
    last=glob?`<b>Global</b>: the whole screen froze for ${ms} ms, and the ${walk.length} players walking past froze with it, though they had nothing to do with the hit.`:`<b>Per entity</b>: the two fighters froze for ${ms} ms while the ${walk.length} passers-by kept walking.`;};
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1);let step=s*1000;
    if(gfrz>0){const u=Math.min(gfrz,step);gfrz-=u;step-=u;}
    const ss=step/1000;vstep(me.v,step);vstep(foe.v,step);nums.tick(step);for(const f of fx)f.t+=step;fx=fx.filter(f=>f.t<300);
    for(const w of walk){w.x+=w.sp*ss;w.an+=ss*7;if(w.x>W+10)w.x=-10;if(w.x<-10)w.x=W+10;}
    for(const [a,b] of [[me,foe],[foe,me]]){if(a.sw<0||frozen(a.v))continue;const pf=swFrame(a.sw,SWING.sword);a.sw+=step;const f=swFrame(a.sw,SWING.sword);if(pf<4&&(f>=4||f<0))hit(a,b);if(f<0)a.sw=-1;}
    cd-=ss;if(cd<=0&&me.sw<0&&foe.sw<0){(turn++%2?foe:me).sw=0;cd=1;}
    c.drawImage(bg,0,0);const ents=[...walk.map(w=>({...w,w:1})),me,foe].sort((a,b)=>a.y-b.y);
    for(const e of ents){if(e.w){if(e.kind==='mage')drawUnit(c,'mage',e.x,e.y,{fr:(e.an|0)&1,flip:e.sp<0});else drawKnight(c,e.x,e.y,{kind:'ally',fr:(e.an|0)&1,flip:e.sp<0,weapon:'sword',ang:-1.1});continue;}
      const f=e.sw>=0?swFrame(e.sw,SWING.sword):-1;drawKnight(c,e.x,e.y,vopts(e.v,{kind:e.kind,flip:e.face<0,weapon:'sword',ang:f>=0?SWA.sword[f]:-1.1,dx:f>=0?SWX.sword[f]*e.face:0}));}
    for(const x of fx)if(x.t>=0)spark(c,x.x,x.y,Math.min(3,(x.t/75)|0),'#fff0c0');nums.draw(c);
    if(gfrz>0){rect(c,0,0,W,H,'rgba(127,176,255,.10)');drawText(c,'EVERYONE FROZEN',W/2,4,'#7fdcff',FONT_S,{align:'center',outline:CB.ink});}
    if(slowF(root)<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    ro.innerHTML=last||'The knights trade a hit every second.';}};});

// ======================================================================
// B2 flash: white, HoH red overlay, purple immune; baked against per-frame
// ======================================================================
reg('flash',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=128,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,62,45),m=meter(.05);
  const T=[{x:36,lab:'WHITE',k:'white'},{x:96,lab:'RED 50%',k:'red'},{x:156,lab:'PURPLE',k:'purple'}].map(o=>({...o,y:44,v:vfx(),inv:1e9,txt:1e9}));
  const tmp=mkCanvas(12,12),tc=tmp.getContext('2d');let t=0,next=.4,ti=0,hud=0;
  const hitT=g=>{if(g.k==='white')vhit(g.v,{flash:'white',rec:1,dir:1});else if(g.k==='red')vhit(g.v,{flash:'red',fk:.5});else{vhit(g.v,{flash:'purple'});g.inv=0;g.txt=0;}};
  pointer(cv,([x,y],k)=>{if(k!=='down'||y>62)return;const g=T.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a);hitT(g);next=1.2;});
  cc.seg('cost',()=>{});
  return {tick(dt){const sl=slowF(root),s=dt*sl*(still()?0:1),step=s*1000;t+=s;next-=s;if(next<=0&&!still()){hitT(T[ti++%3]);next=.6;}
    for(const g of T){vstep(g.v,step);g.inv+=step;g.txt+=step;}
    c.drawImage(bg,0,0);
    for(const g of T){let o=vopts(g.v,{});if(g.k==='purple'&&g.inv<2000&&o.fa==null){const b=.4+.5*(.5+.5*Math.sin(g.inv/2000*Math.PI*8));o.flash='#100d15';o.fa=1-b;}
      drawUnit(c,'goblin',g.x,g.y,o);drawText(c,g.lab,g.x,50,'#d6cfdc',FONT_S,{align:'center',outline:CB.ink});
      if(g.k==='purple'&&g.txt<700)drawText(c,'IMMUNE',g.x,24-Math.min(4,(g.txt/80)|0),'#c9a6ff',FONT_S,{align:'center',outline:CB.ink});}
    // 100 sprites: each flashes 100 ms in a moving wave
    rect(c,0,62,W,H-62,'#18141e');const atop=cc.segv('cost')==='atop',ph=(t*1000)%1400;m.t0();
    for(let i=0;i<100;i++){const x=10+(i%20)*9,y=84+((i/20)|0)*10,age=(ph-i*12+1400)%1400,fa=flashA(age),ox=x-6,oy=y-12;
      const img=unitImg('goblin',0,'idle');
      if(fa<=0)c.drawImage(img,ox,oy);
      else if(!atop){c.drawImage(img,ox,oy);c.globalAlpha=fa;c.drawImage(unitSil('goblin',0,'idle','#ffffff'),ox,oy);c.globalAlpha=1;}
      else{tc.globalCompositeOperation='source-over';tc.clearRect(0,0,12,12);tc.drawImage(img,0,0);tc.globalCompositeOperation='source-atop';tc.fillStyle=`rgba(255,255,255,${fa})`;tc.fillRect(0,0,12,12);c.drawImage(tmp,ox,oy);}}
    const v=m.t1();drawText(c,'100 SPRITES',4,65,'#a9a1b4',FONT_S);if(sl<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    if((hud-=dt)<=0){hud=.3;ro.innerHTML=`100 sprites drawn ${atop?'with a per-frame <b>source-atop</b> fill':'with a <b>pre-baked</b> silhouette'}: <b>${fms(v)} ms</b> here · our benchmark, M4 GPU: 0.75 ms baked, 16.0 ms source-atop; 6x throttle: 3.63 and 79.6 ms`;}}};});

// ======================================================================
// B3 knockback: server moves whole tiles; cosmetic recoil moves pixels
// ======================================================================
reg('knockback',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=96,cc=ctl(root),ro=$('[data-ro]',root);
  const TS=16,L={kx:40,gx:56,gy:56,tile:3,kb:-1,home:3},Rt={kx:136,gx:152,gy:56,v:vfx()};let ms=-1,auto=0,crit=false,nums=mkNums({merge:0,stack:0,rise:14}),info='';
  const fire=cr=>{crit=cr;ms=0;};cc.btn('hit',()=>{fire(false);auto=-3;});cc.btn('crit',()=>{fire(true);auto=-3;});
  return {tick(dt){const sl=slowF(root),s=dt*sl*(still()?0:1),step=s*1000;vstep(Rt.v,step);nums.tick(step);
    if(ms>=0){const pf=swFrame(ms,SWING.sword);ms+=step;const f=swFrame(ms,SWING.sword);
      if(pf<4&&(f>=4||f<0)){L.kb=0;L.from=L.tile;L.tile=L.tile+1;vhit(Rt.v,{flash:'white',rec:crit?4:2,dir:1,sq:cc.v('sq')?.15:0});
        nums.add('l',crit?24:12,L.gx+(L.from-3)*TS,30,crit?NUMC.crit:NUMC.phys);nums.add('r',crit?24:12,Rt.gx,30,crit?NUMC.crit:NUMC.phys);
        info=`Left: the server moved the goblin 1 tile over 150 ms and it ends on a tile. Right: the sprite moved ${crit?4:2} px and back in 6 frames (${crit?8:4} px at 32 px tiles). Its tile never changed.`;}
      if(f<0)ms=-1;}else{auto+=s;if(auto>1.4&&!still()){fire(Math.random()<.25);auto=0;}}
    if(L.kb>=0){L.kb+=step;if(L.kb>900){L.tile=L.home;L.kb=-1;}}
    // floor with a visible tile grid
    rect(c,0,0,W,H,CB.floor);for(let y=0;y<H;y+=TS)rect(c,0,y,W,1,CB.mortar);for(let x=0;x<W;x+=TS)rect(c,x,0,1,H,CB.mortar);rect(c,95,0,2,H,'#100d15');
    const kbx=L.kb>=0&&L.kb<150?lerp(L.from,L.tile,L.kb/150):L.tile;
    const tl=(x,col)=>{tmark(c,Math.round(x-8),L.gy-14,TS+1,TS+1,col);};
    tl(Math.round((L.kb>=0&&L.kb<150?L.from:L.tile)-3)*TS+L.gx,'#7fdcff');tl(Rt.gx,'#7fdcff');
    const f=ms>=0?swFrame(ms,SWING.sword):-1;const kxL=L.kx,kxR=Rt.kx;
    const kn=x=>drawKnight(c,x,L.gy,{weapon:'sword',ang:f>=0?SWA.sword[f]:-1.1,dx:f>=0?SWX.sword[f]:0});kn(kxL);kn(kxR);
    const lx=L.gx+(kbx-3)*TS;drawUnit(c,'goblin',lx,L.gy,{flash:L.kb>=0&&L.kb<100?'white':null,fa:flashA(L.kb)});
    drawUnit(c,'goblin',Rt.gx,Rt.gy,vopts(Rt.v,{}));nums.draw(c);
    drawText(c,'SERVER KNOCKBACK',4,4,'#f3eef5',FONT_S,{outline:CB.ink});drawText(c,'COSMETIC RECOIL',100,4,'#f3eef5',FONT_S,{outline:CB.ink});
    drawText(c,'BLUE SQUARE = TILE THE SERVER SEES',W/2,H-8,'#7fdcff',FONT_S,{align:'center',outline:CB.ink});
    if(sl<1)drawText(c,'0.25x',W-4,14,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    ro.innerHTML=info||'Watch the blue squares. Only the server knockback changes the tile.';}};});

// ======================================================================
// B5 hit reactions: flinch on every hit against a damage threshold
// ======================================================================
reg('reaction',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=96,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,H,51),r=mkRng(8);
  const MAX=400,O=[{x:50,fl:-1,n:0,v:vfx()},{x:142,fl:-1,n:0,v:vfx()}];let acc=0,hits=0,win=[],sp=[],hud=0;
  const sync=()=>{cc.out('div','max HP / '+cc.v('div')+' = '+Math.round(MAX/cc.v('div')));cc.out('n',cc.v('n')+' players');};cc.on('div',sync);cc.on('n',sync);sync();
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),step=s*1000,now=performance.now();O.forEach(o=>{vstep(o.v,step);if(o.fl>=0){o.fl+=step;if(o.fl>=150)o.fl=-1;}});
    acc+=s*cc.v('n')/2;while(acc>=1){acc--;hits++;const big=r()<.08,crit=r()<.1,dmg=big?40+((r()*40)|0):4+((r()*14)|0),th=MAX/cc.v('div');
      O.forEach((o,i)=>{const fl=i===0||dmg>=th||crit;if(fl){o.fl=0;o.n++;win.push({i,t:now});}vhit(o.v,{flash:'red',fk:.35});sp.push({x:o.x+(r()-.5)*10,y:66-6+(r()-.5)*8,t:0,col:crit?'#ffd23a':'#fff0c0'});});}
    for(const p of sp)p.t+=step;sp=sp.filter(p=>p.t<300);win=win.filter(w=>now-w.t<2000);
    c.drawImage(bg,0,0);rect(c,95,0,2,H,'#100d15');
    O.forEach((o,i)=>{const n=cc.v('n'),k=Math.min(6,n);for(let j=0;j<k;j++){const a=Math.PI*(.15+j/(k)*1.7)+Math.PI/2,x=o.x+Math.cos(a)*24,y=66+Math.sin(a)*14;drawKnight(c,x,y,{kind:'ally',flip:x>o.x,weapon:'sword',ang:(((now/250)|0)+j)%3?-1.1:.3});}
      drawUnit(c,'orc',o.x,66,vopts(o.v,{pose:o.fl>=0?'hurt':'idle',dx:o.fl>=0?(o.fl<75?1:0):0}));
      drawText(c,i===0?'EVERY HIT':'THRESHOLD',o.x,4,'#f3eef5',FONT_S,{align:'center',outline:CB.ink});
      const fps=win.filter(w=>w.i===i).length/2;drawText(c,fps.toFixed(1)+' FLINCHES/S',o.x,H-9,i===0?'#ff8a7a':'#9fd3c7',FONT_S,{align:'center',outline:CB.ink});});
    for(const p of sp)spark(c,p.x,p.y,Math.min(3,(p.t/75)|0),p.col);
    if((hud-=dt)<=0){hud=.4;const a=win.filter(w=>w.i===0).length/2,b=win.filter(w=>w.i===1).length/2;ro.innerHTML=`${cc.v('n')} players, one swing each every 2 s = <b>${(cc.v('n')/2).toFixed(1)} hits/s</b> · every hit: <b>${a.toFixed(1)}</b> flinches/s · threshold ${Math.round(MAX/cc.v('div'))} or a crit: <b>${b.toFixed(1)}</b> flinches/s`;}}};});

// ======================================================================
// B6/B7 trauma: hits add trauma, shake = trauma^2, positional falloff
// ======================================================================
reg('trauma',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=112,cc=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),bg=mkArena(W+8,H+8,57),cam=mkCam(3);
  const me={x:96,y:66,v:vfx()},boss={x:150,y:34},hist=[];let drag=false,slam=-1,acc=0,last='',hud=0,nums=mkNums({merge:0,stack:0,rise:14});
  pointer(cv,([x,y],k)=>{if(k==='down'&&Math.hypot(x-boss.x,y-boss.y)<14)drag=true;if(k==='up'||k==='leave')drag=false;if(drag&&(k==='drag'||k==='down')){boss.x=clamp(x,8,W-8);boss.y=clamp(y,18,H-6);}});
  const tiles=()=>Math.hypot(boss.x-me.x,boss.y-me.y)/16;
  cc.btn('hit',()=>{const d=10+((Math.random()*50)|0),a=.2+.3*d/200;cam.add(a);vhit(me.v,{flash:'red',fk:.5});nums.add(0,d,me.x,me.y-26,NUMC.phys);last=`Hit taken for ${d} of 200 HP: +${a.toFixed(2)} trauma (0.2 + 0.3 × damage / max HP).`;});
  cc.btn('crit',()=>{cam.add(.3);cam.kick(-1,0);last='Your crit: +0.30 trauma and a 1 px kick back from the aim (2 px at 32 px tiles).';});
  cc.btn('str',()=>{last='A stranger\'s crit, two tiles away: +0. Strangers\' hits never move your camera.';});
  cc.btn('slam',()=>{const d=tiles(),k=clamp((6-d)/6,0,1);cam.add(.6*k);slam=0;last=`Boss slam ${d.toFixed(1)} tiles away: falloff (6 - ${d.toFixed(1)}) / 6 = ${Math.round(k*100)}%, so +${(.6*k).toFixed(2)} trauma.`;});
  cc.seg('pow',v=>{cam.pow=+v;});cc.seg('nz',v=>{cam.white=v==='white';});
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),step=s*1000;cam.amt=cc.v('amt')/100;cc.out('amt',cc.v('amt')+'%');vstep(me.v,step);nums.tick(step);if(slam>=0){slam+=step;if(slam>400)slam=-1;}
    const sh=cam.step(s);acc+=s;if(acc>=1/30){acc=0;hist.push([cam.tr,sh]);if(hist.length>120)hist.shift();}
    rect(c,0,0,W,H,CB.floor2);c.save();c.translate(cam.ox,cam.oy);c.drawImage(bg,-4,-4);
    c.strokeStyle='rgba(255,90,60,.35)';c.setLineDash([2,2]);c.beginPath();c.ellipse(boss.x+.5,boss.y+.5,96,96,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
    c.strokeStyle='rgba(242,193,78,.6)';c.beginPath();c.moveTo(boss.x+.5,boss.y+.5);c.lineTo(me.x+.5,me.y-6+.5);c.stroke();
    if(slam>=0){const rr=Math.round(slam/400*30);c.strokeStyle=`rgba(255,200,120,${1-slam/400})`;c.beginPath();c.ellipse(boss.x+.5,boss.y+.5,rr,rr*.6,0,0,Math.PI*2);c.stroke();}
    drawUnit(c,'orc',boss.x,boss.y+8,{pose:slam>=0&&slam<150?'hurt':'idle',dy:slam>=0&&slam<100?-2:0});
    drawKnight(c,me.x,me.y,vopts(me.v,{weapon:'sword',ang:-1.1}));
    drawUnit(c,'ally',60,92,{});drawUnit(c,'goblin',76,92,{flip:true});nums.draw(c);c.restore();
    drawText(c,tiles().toFixed(1)+' TILES',4,4,'#f2c14e',FONT_S,{outline:CB.ink});drawText(c,'DRAG THE BOSS',W-4,4,'#a9a1b4',FONT_S,{align:'right',outline:CB.ink});
    drawText(c,`OFFSET ${cam.ox},${cam.oy} PX`,4,H-9,'#f3eef5',FONT_S,{outline:CB.ink});
    // graph: trauma line, shake filled
    if((hud-=dt)<=0){hud=1/15;svg.innerHTML='';const VW=320,VH=90,Lx=28,R=VW-6,T=8,B=VH-16,X=i=>Lx+i/119*(R-Lx),Y=v=>B-v*(B-T);svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
      for(const v of [0,.5,1]){svgEl('line',{x1:Lx,x2:R,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,Lx-4,Y(v)+3,String(v),{'text-anchor':'end','font-size':10});}
      if(hist.length>1){svgEl('polygon',{points:[[X(0),B],...hist.map((h,i)=>[X(i),Y(h[1])]),[X(hist.length-1),B]].map(p=>p.join(',')).join(' '),fill:'#ec7a5c',opacity:.45},svg);poly(svg,hist.map((h,i)=>[X(i),Y(h[0])]),{stroke:'#f2c14e','stroke-width':2});}
      svgText(svg,R,VH-3,'last 4 s',{'text-anchor':'end','font-size':10});svgText(svg,Lx,VH-3,'trauma',{'font-size':10,fill:'#f2c14e'});svgText(svg,Lx+50,VH-3,`shake = trauma${cam.pow===2?'²':'³'}`,{'font-size':10,fill:'#ec7a5c'});
      ro.innerHTML=`trauma <b>${cam.tr.toFixed(2)}</b> · shake <b>${Math.round(sh*100)}%</b> of 3 px · ${last||'Press a button. Chip damage barely moves the camera.'}`;}}};});
// ======================================================================
// C1 Tibia numbers: 1000 ms, rise 48 px (24 here), fade from 833 ms, merge 400 ms
// ======================================================================
reg('numbers',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=112,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(124,H,61),r=mkRng(4);
  const nums=mkNums({per:0,cap:0}),g={x:62,y:100,v:vfx()},COLS=[NUMC.phys,NUMC.fire,NUMC.energy,NUMC.earth];let acc=0,hits=0,mergedLog=[],fx=[],hud=0;
  const sync=()=>cc.out('hps',cc.v('hps')+' /s');cc.on('hps',sync);sync();
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),step=s*1000,now=nums.now;nums.P.merge=cc.v('mg')?400:0;nums.tick(step);vstep(g.v,step);
    acc+=s*cc.v('hps');while(acc>=1){acc--;hits++;const before=nums.merged,col=cc.segv('col')==='one'?NUMC.phys:COLS[(r()*4)|0];
      nums.add('g',5+((r()*20)|0),g.x,g.y-22,col);if(nums.merged>before)mergedLog.push(now);vhit(g.v,{flash:'white',rec:1,dir:1});fx.push({x:g.x+(r()-.5)*6,y:g.y-7,t:0});}
    for(const f of fx)f.t+=step;fx=fx.filter(f=>f.t<300);mergedLog=mergedLog.filter(t=>now-t<3000);
    c.drawImage(bg,0,0);rect(c,62-8,g.y-46,17,1,'rgba(255,255,255,.18)');drawText(c,'24 PX',62+12,g.y-48,'#857d92',FONT_S);
    drawUnit(c,'goblin',g.x,g.y,vopts(g.v,{}));for(const f of fx)spark(c,f.x,f.y,Math.min(3,(f.t/75)|0),'#fff0c0');nums.draw(c);
    // age panel
    rect(c,124,0,W-124,H,'#100d15');drawText(c,'AGE OF EACH NUMBER',128,3,'#a9a1b4',FONT_S);const bx=150,bw=70;
    drawText(c,'0',bx,11,'#857d92',FONT_S);drawText(c,'400',bx+28,11,'#9fd3c7',FONT_S,{align:'center'});drawText(c,'833',bx+58,11,'#a9a1b4',FONT_S,{align:'center'});
    nums.list.slice(-8).forEach((n,i)=>{const y=20+i*11,age=nums.now-n.born;drawText(c,String(n.v),146,y,n.col,FONT_S,{align:'right'});
      rect(c,bx,y,bw,6,'#2b2436');if(cc.v('mg'))rect(c,bx,y,28,6,'rgba(159,211,199,.22)');rect(c,bx+58,y,12,6,'rgba(255,255,255,.08)');
      rect(c,bx,y+1,Math.round(clamp(age/1000,0,1)*bw),4,n.col);if(n.hits>1)drawText(c,'x'+n.hits,bx+bw+2,y,'#9fd3c7',FONT_S);});
    if(slowF(root)<1)drawText(c,'0.25x',120,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    if((hud-=dt)<=0){hud=.25;ro.innerHTML=`${cc.v('hps')} hits/s · <b>${nums.list.length}</b> numbers alive · <b>${mergedLog.length}</b> hits merged in the last 3 s`+(cc.v('mg')?'':' · merging off, so every hit stacks 6 px lower (12 px at 32 px tiles)');}}};});

// ======================================================================
// C2 aggregation and caps: many attackers, three targets
// ======================================================================
reg('aggregate',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=112,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,H,65),r=mkRng(6),m=meter(.06);
  const nums=mkNums({}),T=[40,112,184].map((x,i)=>({x,y:80,v:vfx(),id:i}));const ATT=[];T.forEach(t=>{for(let j=0;j<8;j++){const a=Math.PI*(j/8)*2,x=t.x+Math.cos(a)*22,y=t.y+Math.sin(a)*11;ATT.push({t,x,y,flip:x>t.x,sw:-1e9});}});
  let acc=0,log=[],hud=0;const sync=()=>cc.out('rate',cc.v('rate')+' /s each');cc.on('rate',sync);sync();
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),step=s*1000,now=nums.now;nums.P.merge=cc.v('agg')?400:0;nums.P.per=cc.v('cap')?4:0;nums.P.cap=cc.v('cap')?64:0;nums.tick(step);
    acc+=s*cc.v('rate')*ATT.length;while(acc>=1){acc--;const a=ATT[(r()*ATT.length)|0],bm=nums.merged,bd=nums.dropped;a.sw=now;vhit(a.t.v,{flash:'white',fk:.6});
      nums.add(a.t.id,3+((r()*12)|0),a.t.x,a.t.y-34,NUMC.phys);log.push({t:now,m:nums.merged>bm,d:nums.dropped-bd});}
    log=log.filter(l=>now-l.t<1000);T.forEach(t=>vstep(t.v,step));
    c.drawImage(bg,0,0);const ents=[...ATT,...T.map(t=>({tt:t,y:t.y}))].sort((a,b)=>a.y-b.y);
    for(const e of ents){if(e.tt)drawUnit(c,'orc',e.tt.x,e.tt.y,vopts(e.tt.v,{}));else drawKnight(c,e.x,e.y,{kind:'ally',flip:e.flip,weapon:'sword',ang:now-e.sw<120?.4:-1.1});}
    m.t0();nums.draw(c);const v=m.t1();
    if(slowF(root)<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    if((hud-=dt)<=0){hud=.25;const mg=log.filter(l=>l.m).length,dr=log.reduce((a,l)=>a+l.d,0);
      ro.innerHTML=`${(cc.v('rate')*ATT.length).toFixed(0)} hits/s on 3 targets · <b>${nums.list.length}</b> numbers alive · ${mg} merged/s · ${dr} dropped/s · drawing them took <b>${fms(v)} ms</b> here`;}}};});

// ======================================================================
// C3 crits: an emphasis stack, and Diablo III's big-hit rule
// ======================================================================
reg('crit',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=84,cc=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),bg=mkArena(W+4,H+4,69),r=mkRng(12);
  const me={x:80,y:64,v:vfx(),sw:-1},g={x:108,y:64,v:vfx()},nums=mkNums({merge:0,stack:250,stackPx:6,rise:16}),cam=mkCam(2);let fx=[],seq=0,auto=0,pend=null;
  // Diablo III rule
  let bench=0,cal=[],pts=[],tt=0,nextHit=0,idle=0,lastOrange=-1;
  const go=cr=>{if(me.sw<0){me.sw=0;pend=cr;}};
  cc.btn('hit',()=>{go(false);auto=-4;});cc.btn('crit',()=>{AUD.enable();go(true);auto=-4;});cc.on('snd',()=>{if(cc.v('snd'))AUD.enable();});
  function land(cr){const L={dig:cc.v('dig'),pop:cc.v('pop'),life:cc.v('life'),stop:cc.v('stop'),kick:cc.v('kick'),snd:cc.v('snd')},ms=hitstopMs(cr&&L.stop?6:3);
    vhit(me.v,{frz:ms});vhit(g.v,{frz:ms,shake:true,flash:'white',rec:cr?3:2,dir:1});fx.push({x:g.x-3,y:g.y-8,t:-ms,col:cr?'#ffd23a':'#fff0c0'});
    nums.add(1,cr?38:19,g.x+2,g.y-30,cr&&L.dig?NUMC.crit:NUMC.phys,{crit:cr,bold:cr&&L.dig,pop:cr&&L.pop,life:cr&&L.life?1200:1000,nomerge:true});
    if(cr&&L.kick)cam.kick(-1,0);if(cr&&L.snd&&AUD.on){AUD.blip(990,70,.05,'square');AUD.blip(660,110,.04,'triangle');}else if(L.snd&&AUD.on)AUD.blip(330,50,.04,'square');}
  function chart(){svg.innerHTML='';const VW=320,VH=130,L=40,R=VW-30,T=10,B=VH-18,X=t=>L+(1-(tt-t)/12)*(R-L),Y=v=>B-Math.min(v,30000)/30000*(B-T);svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
    for(const v of [0,10000,20000,30000]){svgEl('line',{x1:L,x2:R,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-4,Y(v)+3,v?v/1000+'k':'0',{'text-anchor':'end','font-size':10});}
    svgEl('line',{x1:L,x2:R,y1:Y(10000),y2:Y(10000),stroke:'#857d92','stroke-dasharray':'2 2'},svg);
    const bp=pts.filter(p=>p.b>0);if(bp.length>1)poly(svg,bp.map(p=>[X(p.t),Y(p.b)]),{stroke:'#ff8a28','stroke-width':1.5,opacity:.8});
    for(const p of pts)svgEl('circle',{cx:X(p.t),cy:Y(p.v),r:p.o?3.4:2.2,fill:p.o?'#ff8a28':p.cal?'#857d92':'#ebe5ee'},svg);
    svgEl('rect',{x:R+8,y:Y(bench),width:12,height:B-Y(bench),fill:'#ff8a28',opacity:.85},svg);svgText(svg,R+14,VH-4,'bar',{'text-anchor':'middle','font-size':9});
    svgText(svg,L,VH-4,'last 12 s',{'font-size':10});svgText(svg,R,VH-4,'orange line = benchmark, −3%/s',{'text-anchor':'end','font-size':10,fill:'#ff8a28'});}
  return {tick(dt){const sl=slowF(root),s=dt*sl*(still()?0:1),step=s*1000;vstep(me.v,step);vstep(g.v,step);nums.tick(step);cam.step(s);for(const f of fx)f.t+=step;fx=fx.filter(f=>f.t<300);
    if(me.sw>=0&&!frozen(me.v)){const pf=swFrame(me.sw,SWING.sword);me.sw+=step;const f=swFrame(me.sw,SWING.sword);if(pf<4&&(f>=4||f<0))land(pend);if(f<0)me.sw=-1;}
    auto+=s;if(auto>.9&&!still()){go((seq++%3)===2);auto=0;}
    c.fillStyle=CB.floor2;c.fillRect(0,0,W,H);c.save();c.translate(cam.ox,cam.oy);c.drawImage(bg,-2,-2);
    drawUnit(c,'goblin',g.x,g.y,vopts(g.v,{flip:true}));const f=me.sw>=0?swFrame(me.sw,SWING.sword):-1;drawKnight(c,me.x,me.y,vopts(me.v,{weapon:'sword',ang:f>=0?SWA.sword[f]:-1.1,dx:f>=0?SWX.sword[f]:0}));
    for(const x of fx)if(x.t>=0)spark(c,x.x,x.y,Math.min(3,(x.t/75)|0),x.col);nums.draw(c);c.restore();
    if(sl<1)drawText(c,'0.25x',W-4,4,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    // big-hit stream, 2 hits per second
    if(!cc.v('pause')){tt+=s;idle=0;nextHit-=s;if(nextHit<=0){nextHit=.5;const v=r()<.18?10000+r()*16000:1500+r()*8000;let o=false,ca=false;
        if(cal.length<10){cal.push(v);ca=true;if(cal.length===10)bench=Math.max(...cal);}else if(v>10000&&v>bench){o=true;bench=v;lastOrange=tt;}
        pts.push({t:tt,v,o,cal:ca,b:bench});}}else{idle+=s;if(idle>10&&cal.length){cal=[];bench=0;}}
    bench*=Math.pow(.97,cc.v('pause')?0:s);pts=pts.filter(p=>tt-p.t<12);if(pts.length)pts[pts.length-1].b=bench;chart();
    ro.innerHTML=cal.length<10?`Calibrating on the first 10 hits (${cal.length}/10). None turn orange yet.`:`Benchmark <b>${Math.round(bench).toLocaleString('en-US')}</b>, falling 3% per second · a hit over 10,000 turns orange only if it beats it`+(lastOrange>=0?` · last orange ${(tt-lastOrange).toFixed(1)} s ago`:'')+(cc.v('pause')?` · paused ${idle.toFixed(0)} s, it resets at 10 s`:'');}};});

// ======================================================================
// C4 who sees which numbers, and how misses read
// ======================================================================
reg('misses',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=96,cc=ctl(root),ro=$('[data-ro]',root),bg=mkArena(W,H,73),r=mkRng(14);
  const F=[{lab:'YOU',kind:'knight',x:40,tier:'me'},{lab:'PARTY',kind:'ally',x:112,tier:'party'},{lab:'STRANGER',kind:'mage',x:184,tier:'str'}].map((f,i)=>({...f,y:70,gx:f.x+22,v:vfx(),cd:.3+i*.35,sw:-1,words:[],puffs:[]}));
  const nums=mkNums({rise:16});let hud=0;
  function attack(f){const o=r();const out=o<.62?'hit':o<.77?'MISS':o<.9?'BLOCK':'IMMUNE',tibia=cc.segv('style')==='tibia';
    const al=f.tier==='me'?1:f.tier==='party'?{full:1,half:.5,off:0}[cc.segv('party')]:{full:1,dim:.35,off:0}[cc.segv('str')];
    if(out==='hit'){vhit(f.v,{flash:'white',rec:1,dir:1});if(al>0)nums.add(f.tier,6+((r()*20)|0),f.gx,f.y-30,NUMC.phys,{a:al});}
    else if(tibia){if(out!=='IMMUNE')f.puffs.push({t:0});}
    else if(f.tier==='me')f.words.push({w:out,t:0});}
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),step=s*1000;nums.tick(step);
    c.drawImage(bg,0,0);
    for(const f of F){vstep(f.v,step);f.cd-=s;if(f.cd<=0&&f.sw<0){f.sw=0;f.cd=.9+r()*.4;}
      if(f.sw>=0){const pf=swFrame(f.sw,SWING.sword);f.sw+=step;const fr=swFrame(f.sw,SWING.sword);if(pf<4&&(fr>=4||fr<0))attack(f);if(fr<0)f.sw=-1;}
      for(const w of f.words)w.t+=step;f.words=f.words.filter(w=>w.t<700);for(const p of f.puffs)p.t+=step;f.puffs=f.puffs.filter(p=>p.t<300);
      drawUnit(c,'goblin',f.gx,f.y,vopts(f.v,{flip:true}));const fr=f.sw>=0?swFrame(f.sw,SWING.sword):-1;
      if(f.kind==='mage')drawUnit(c,'mage',f.x,f.y,{dy:fr>=1&&fr<=4?-1:0});else drawKnight(c,f.x,f.y,{kind:f.kind,weapon:'sword',ang:fr>=0?SWA.sword[fr]:-1.1,dx:fr>=0?SWX.sword[fr]:0});
      if(f.kind==='mage'&&fr>=1&&fr<=3)spark(c,f.gx-2,f.y-7,fr-1,'#c070ff');
      for(const p of f.puffs){const k=(p.t/75)|0;c.fillStyle='rgba(200,196,210,.85)';const rr=2+k;c.fillRect(f.gx-rr,f.y-7-rr+1,rr*2+1,rr*2-1);c.fillStyle='rgba(255,255,255,.6)';c.fillRect(f.gx-rr+1,f.y-7-rr+2,rr,1);}
      for(const w of f.words)drawText(c,w.w,f.gx,f.y-22,'#b8b0a4',FONT_S,{align:'center',outline:CB.ink});
      drawText(c,f.lab,f.x+11,4,f.tier==='me'?'#f2c14e':'#d6cfdc',FONT_S,{align:'center',outline:CB.ink});}
    nums.draw(c);if(slowF(root)<1)drawText(c,'0.25x',W-4,H-9,'#ffd23a',FONT_S,{align:'right',outline:CB.ink});
    if((hud-=dt)<=0){hud=.3;const n=k=>nums.list.filter(x=>x.key===k&&x.a>0).length;ro.innerHTML=`Numbers on screen · yours <b>${n('me')}</b> · party <b>${n('party')}</b> · strangers <b>${n('str')}</b>`+(cc.segv('style')==='tibia'?' · in Tibia mode misses and blocks are a grey puff that everyone sees':' · miss words show only on your own fight');}}};});
//@@MORE@@
}
