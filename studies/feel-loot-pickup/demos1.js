// Loot and pickup study: figures 1 (hero, timeline, containers and spills, drop motion, rarity, labels and filters). Shared helpers and sprites live in core.js (LOOT section).
{
const C2=cx2;
const still=()=>!motion||reduce;
const TXc=t=>t*16+8,TYf=t=>t*16+13;
const NAMES={potion:'potion',sword:'sword',shield:'shield',helmet:'helmet',ring:'ring',gem:'gem',rune:'rune',scroll:'scroll',bone:'bone',meat:'meat',star:'sunstone',axe:'axe',boots:'boots'};
const ADJ=['','fine ','runed ','storm ','ancient '];
const isGold=k=>k==='coin1'||k==='coin3'||k==='pile';
function iname(it){if(isGold(it.kind))return (it.n||5)+' gold';return (it.kind==='star'?'':ADJ[it.tier])+NAMES[it.kind];}
// Diablo ring search: centre, then square rings outward, nearest first; skips blocked and used tiles
function ringTiles(cx,cy,n,blocked,R=6,used=new Set()){const out=[];for(let r=0;r<=R&&out.length<n;r++){const ring=[];
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===r)ring.push([cx+dx,cy+dy]);
    ring.sort((a,b)=>Math.hypot(a[0]-cx,a[1]-cy)-Math.hypot(b[0]-cx,b[1]-cy)||Math.atan2(a[1]-cy,a[0]-cx)-Math.atan2(b[1]-cy,b[0]-cx));
    for(const [x,y] of ring){if(out.length>=n)break;const k=x+','+y;if(used.has(k)||(blocked&&blocked(x,y)))continue;used.add(k);out.push([x,y]);}}return out;}
// one dropped item in flight: x0,y0 start, x1,y1 landing (feet), t ms since launch (negative = waiting), dur, apex
let DID=1;
const mkDrop=(it,x0,y0,x1,y1,delay,o={})=>({...it,id:DID++,x0,y0,x1,y1,t:-delay,dur:o.dur==null?400:o.dur,apex:o.apex==null?10:o.apex,landed:false,lt:0});
function stepDrop(d,ms,onLand){d.t+=ms;if(!d.landed&&d.t>=d.dur){d.landed=true;d.lt=0;if(onLand)onLand(d);}else if(d.landed)d.lt+=ms;}
function dropXY(d){const k=d.dur>0?sat(d.t/d.dur):1;return {x:lerp(d.x0,d.x1,k),y:lerp(d.y0,d.y1,k),h:d.landed?0:arcH(k,d.apex),k};}
function bump(ms){return ms<60?1+.15*ms/60:ms<120?1.15-.15*(ms-60)/60:1;}
// a flying item into the bag: 250 ms ease in-out with a sideways curve of +-8 px (16 px at Asterion scale)
const mkFly=(it,x0,y0,x1,y1,side,ms=250)=>({...it,x0,y0,x1,y1,side,t:0,ms});
function flyXY(f){const k=easeIO(f.t/f.ms),nx=-(f.y1-f.y0),ny=f.x1-f.x0,L=Math.hypot(nx,ny)||1,s=Math.sin(Math.PI*k)*8*f.side;return {x:lerp(f.x0,f.x1,k)+nx/L*s,y:lerp(f.y0,f.y1,k)+ny/L*s,k};}
function drawBag(c,x,y,b,n){const s=b>1.01?2:1;const w=14,h=13;if(b>1.01){c.drawImage(BAG_IMG,Math.round(x-w*b/2),Math.round(y-h*b),Math.round(w*b),Math.round(h*b));}else c.drawImage(BAG_IMG,x-7,y-13);
  if(n!=null)drawText(c,String(n),x+8,y-8,'#ffe08a',FONT_S,{outline:'#1a1420'});return s;}
function hand(c,x,y){x=Math.round(x);y=Math.round(y);const rows=["o....","oo...","owo..","owwo.","owwwo","owwoo","oo.o."];c.fillStyle='#1a1420';rows.forEach((r,j)=>{for(let i=0;i<5;i++){if(r[i]==='o'){c.fillStyle='#1a1420';c.fillRect(x+i,y+j,1,1);}else if(r[i]==='w'){c.fillStyle='#f6eedb';c.fillRect(x+i,y+j,1,1);}}});}
function wolfCorpse(){return sprite(["..............","......oo......","..oooooaoo....",".oaaaaaaaao...","oaAaaaaaaaoo..","oaAAaaaaaawo.o",".oAAAaaaaaaooa","..ooAAAAAaao.o","....oo.ooo.oo."],{o:'#1a1420',a:'#8a8f9c',A:'#5d6270',w:'#f6eedb'},'wolfdead');}
function wolfLive(fr){return sprite(fr?["...o.o........","..oaoao.......","..oawaao......","..oaaaao......","...oaaaaaaaoo.","...oaAaaaaaaoa","....oAAaaaaao.","....oo.o..oo..","...oo..oo..oo."]:["...o.o........","..oaoao.......","..oawaao......","..oaaaao......","...oaaaaaaaoo.","...oaAaaaaaaoa","....oAAaaaaao.","....o.oo.oo...","....oo.oo.oo.."],{o:'#1a1420',a:'#8a8f9c',A:'#5d6270',w:'#ffe14a'},'wolf'+fr);}
// tier glint over a corpse: 2 frames, best tier colour (A3)
function glint(c,x,y,tier,t){const f=Math.floor(t*4)%2;c.fillStyle=TIERC[tier];if(f){c.fillRect(x,y-2,1,5);c.fillRect(x-2,y,5,1);c.fillStyle='#ffffff';c.fillRect(x,y,1,1);}else{c.fillRect(x,y,1,1);c.fillRect(x-1,y-1,1,1);c.fillRect(x+1,y+1,1,1);}}
// a loot line: "Loot of a goblin: " then item names in tier colour, wrapped to maxW
function lootLine(c,who,items,x,y,maxW,o={}){const F=FONT_S,parts=[{s:'LOOT OF '+who.toUpperCase()+':',col:o.head||'#d3ccc9'}];items.forEach((it,i)=>parts.push({s:iname(it).toUpperCase()+(i<items.length-1?',':'.'),col:o.plain?'#d3ccc9':TIERC[it.tier]}));
  let cx=x,cy=y;for(const p of parts){const w=textW(p.s,F);if(cx>x&&cx+w>x+maxW){cx=x;cy+=7;}drawText(c,p.s,cx,cy,p.col,F,{outline:o.outline});cx+=w+4;}return cy+7-y;}

// ======================================================================
// HERO: a goblin dies and its loot reaches the bag, in four styles
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=108,tiers=$$('.hero-tiers button',root),m=meter(.1);
  const bg=mkField(W,H,11,{path:5});let mode=1,t=0,hud=0,kills=0;
  const ROLLS=[[{kind:'coin3',tier:0,n:14},{kind:'potion',tier:0},{kind:'sword',tier:1},{kind:'gem',tier:2},{kind:'star',tier:4}],
    [{kind:'coin1',tier:0,n:2},{kind:'bone',tier:0},{kind:'helmet',tier:2},{kind:'ring',tier:3}],
    [{kind:'pile',tier:0,n:23},{kind:'meat',tier:0},{kind:'boots',tier:1},{kind:'rune',tier:2},{kind:'shield',tier:3},{kind:'star',tier:4}]];
  const me={x:54,y:62,an:0,face:1,sw:-1,cd:0};let gob=null,ph='walk',pt=0,drops=[],flies=[],bagN=0,bagB=1e9,win=null,others=[],toast=null;
  const label=()=>ph==='labels';
  function newGob(){gob={x:W-36,y:52+((kills*13)%22),hp:3,fl:1e9,an:0,dead:-1};ph='walk';pt=0;drops=[];win=null;}
  function setMode(k){mode=k;tiers.forEach((b,i)=>b.classList.toggle('on',i===k));flies=[];me.x=54;me.y=62;newGob();others=[];
    if(k===2)others=[{x:30,y:30,gx:44,gy:30,cd:.4+Math.random(),k:0,drops:[],ally:{x:30,y:30}},{x:150,y:92,gx:164,gy:92,cd:1.2,k:1,drops:[],ally:{x:150,y:92}}];}
  tiers.forEach((b,i)=>b.addEventListener('click',()=>setMode(i)));
  const moveTo=(u,tx,ty,sp,s)=>{const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<1)return true;const st=Math.min(d,sp*s);u.x+=dx/d*st;u.y+=dy/d*st;u.an+=s*8;if(Math.abs(dx)>.5)u.face=dx>0?1:-1;return d<=st+.01;};
  function spill(x,y,roll,own){const tx=Math.floor(x/16),ty=Math.floor(y/16),order=roll.slice().sort((a,b)=>a.tier-b.tier),tiles=ringTiles(tx,ty,order.length,(a,b)=>a<1||b<1||a>11||b>5||(own&&Math.abs(a*16+8-me.x)<8&&Math.abs(b*16+13-me.y)<8));
    const stag=Math.min(40,600/order.length);return order.map((it,i)=>{const [a,b]=tiles[i];const plain=mode===3||!own;return mkDrop(it,x,y-4,TXc(a)+(i%2?1:-1),TYf(b),plain?0:i*stag,{dur:plain?0:400,apex:10});});}
  function pickFly(d,x0,y0){flies.push(mkFly(d,x0,y0,180,104,d.id%2?1:-1));}
  const api={tick(dt){const s=dt*(still()?0:1),ms=s*1000;t+=s;pt+=ms;m.t0();
    // fight
    if(gob){if(gob.dead<0){if(ph==='walk'){gob.an+=s*6;gob.x-=s*60;if(gob.x<=me.x+16){gob.x=me.x+16;ph='fight';pt=0;me.cd=.15;}}
        else if(ph==='fight'){me.cd-=s;if(me.cd<=0&&me.sw<0){me.sw=0;me.cd=.5;}if(me.sw>=0){const p=me.sw;me.sw+=ms;if(p<150&&me.sw>=150){gob.hp--;gob.fl=0;if(gob.hp<=0){gob.dead=0;ph='dead';pt=0;kills++;}}if(me.sw>300)me.sw=-1;}}
        gob.fl+=ms;}else gob.dead+=ms;}
    if(ph==='dead'&&pt>=150){const roll=ROLLS[kills%3];pt=0;
      if(mode===0){ph='corpse';}else{drops=spill(gob.x,gob.y,roll,true);ph='drop';}}
    // corpse style: wait, walk next to it, click, window, take all
    if(ph==='corpse'){if(pt>900){ph='open';pt=0;}}
    if(ph==='open'){const roll=ROLLS[kills%3];if(!win&&pt>350){win={items:roll.slice(),t:0};}if(win){win.t+=ms;if(win.t>500&&win.items.length&&Math.floor((win.t-500)/180)>roll.length-win.items.length){const it=win.items.shift();const i=roll.length-win.items.length-1;pickFly(it,gob.x-((roll.length*13)>>1)+i*13+6,gob.y-30);}
        if(!win.items.length&&!flies.length){ph='done';pt=0;}}}
    // spill: land, labels on hold, magnet gold, walk to the rest
    for(const d of drops)stepDrop(d,ms);
    if(ph==='drop'&&drops.every(d=>d.landed)){ph=mode===3?'walk2':'labels';pt=0;}
    if(ph==='labels'&&pt>1300){ph='walk2';pt=0;}
    if(ph==='walk2'){const left=drops.filter(d=>!d.gone);if(!left.length){if(!flies.length){ph='done';pt=0;}}
      else{const gold=left.find(d=>isGold(d.kind));let tgt=left.slice().sort((a,b)=>Math.hypot(a.x1-me.x,a.y1-me.y)-Math.hypot(b.x1-me.x,b.y1-me.y))[0];
        for(const d of left){const dist=Math.hypot(d.x1-me.x,d.y1-me.y);if(isGold(d.kind)&&mode!==3&&d.lt>400&&dist<=18){d.mag=(d.mag||0)+ms;}
          if(d.mag){const k=sat(d.mag/180);d.x1=lerp(d.x1,me.x,k*.5);d.y1=lerp(d.y1,me.y,k*.5);if(Math.hypot(d.x1-me.x,d.y1-me.y)<3){d.gone=true;bagN+=d.n||1;bagB=0;}}}
        if(tgt&&!tgt.gone){const near=Math.hypot(tgt.x1-me.x,tgt.y1-me.y)<=(mode===3?4:14);if(!near)moveTo(me,tgt.x1+(tgt.x1>me.x?-10:10)*(mode===3?0:1),tgt.y1,46,s);
          else if(!(isGold(tgt.kind)&&mode!==3)){tgt.gone=true;if(mode===3){bagN++;bagB=1e9;}else pickFly(tgt,tgt.x1,tgt.y1-5);}
          else moveTo(me,tgt.x1,tgt.y1,46,s);}}}
    if(ph==='done'){const back=moveTo(me,54,62,46,s);if(pt>700&&back){me.face=1;newGob();}}
    for(const f of flies){f.t+=ms;if(f.t>=f.ms&&!f.done){f.done=true;bagN+=isGold(f.kind)?(f.n||1):1;bagB=0;}}flies=flies.filter(f=>!f.done);bagB+=ms;
    // crowd: allies kill their own goblins; their drops land plain, dim, beam 2 s, no label
    for(const o of others){o.cd-=s;if(o.cd<=0&&!o.drops.length){const roll=o.k?[{kind:'coin3',tier:0,n:5},{kind:'axe',tier:1},{kind:'star',tier:4}]:[{kind:'coin1',tier:0,n:1},{kind:'scroll',tier:2},{kind:'potion',tier:0}];
        const tx=Math.floor(o.gx/16),ty=Math.floor(o.gy/16);const tl=ringTiles(tx,ty,roll.length,(a,b)=>a<0||b<1||a>11||b>5);o.drops=roll.map((it,i)=>({...mkDrop(it,0,0,TXc(tl[i][0]),TYf(tl[i][1]),0,{dur:0}),landed:true,lt:0}));o.cd=3.4;}
      for(const d of o.drops)d.lt+=ms;if(o.drops.length&&o.drops[0].lt>2600){o.drops=[];}}
    // draw
    c.drawImage(bg,0,0);const ents=[];
    for(const o of others){for(const d of o.drops)ents.push({y:d.y1,f:()=>{drawItem(c,d.kind,d.tier,d.x1,d.y1,{dim:true});if(d.tier===4&&d.lt<2000)drawBeam(c,d.x1,d.y1-3,4,1,.7*(1-d.lt/2000));}});
      ents.push({y:o.ally.y,f:()=>drawUnit(c,'ally',o.ally.x,o.ally.y,{sword:o.drops.length&&o.drops[0].lt<300?.55:-1.1})});}
    if(gob){ents.push({y:gob.y,f:()=>{if(gob.dead<0){drawUnit(c,'goblin',gob.x,gob.y,{fr:(gob.an|0)&1,flip:true,flash:gob.fl<34?'white':null});hpBar(c,gob.x,gob.y-17,12,gob.hp/3);}
        else if(gob.dead<133)drawUnit(c,'goblin',gob.x,gob.y,{flip:true,flash:gob.dead<34?'white':null,sx:1.2,sy:.8});
        else{const im=corpseImg('goblin');c.drawImage(im,Math.round(gob.x-im.width/2),Math.round(gob.y-im.height+2));
          if(mode===0&&(ph==='corpse'||ph==='open')){const best=Math.max(...ROLLS[kills%3].map(i=>i.tier));drawHalo(c,gob.x,gob.y-3,best,.35);glint(c,gob.x+5,gob.y-8,best,t);}}}});}
    ents.push({y:me.y,f:()=>{const ang=me.sw>=0?(me.sw<150?-2.3+me.sw/150*2.85:.55):-1.1;drawUnit(c,'knight',me.x,me.y,{fr:(me.an|0)&1,flip:me.face<0,sword:ang});}});
    for(const d of drops){if(d.gone)continue;const p=dropXY(d);ents.push({y:p.y,f:()=>{const J=mode!==3;
      if(J&&d.landed&&d.tier>=2)drawHalo(c,p.x,p.y-5,d.tier,glowA(t,d.id));
      drawItem(c,d.kind,d.tier,p.x,p.y,{h:p.h,t,id:d.id,shadow:J});}});}
    ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.f();
    if(mode!==3)for(const d of drops){if(d.gone||d.tier<4||d.t<d.dur-200)continue;const p=dropXY(d);drawBeam(c,p.x,p.y-3,4,sat((d.t-(d.dur-200))/200));}
    if(label()){const L=drops.filter(d=>!d.gone).sort((a,b)=>b.tier-a.tier),placed=[];for(const d of L){let x=d.x1,y=d.y1-14;const w=textW(iname(d).toUpperCase(),FONT_S)+4;
        for(let k=0;k<7;k++){if(!placed.some(r=>Math.abs(r.x-x)<(r.w+w)/2+1&&Math.abs(r.y-y)<10))break;y-=10;}placed.push({x,y,w});drawLabel(c,iname(d).toUpperCase(),d.tier,x,y,{icon:true});}
      frame(c,4,H-14,18,11,'chip');drawText(c,'ALT',7,H-11,'#2b1d16',FONT_S);drawText(c,'HELD',25,H-11,'#f6eedb',FONT_S,{outline:'#1a1420'});}
    if(win){const n=ROLLS[kills%3].length,ww=n*13+6,wx=Math.round(gob.x-ww/2),wy=Math.round(gob.y-40);frame(c,wx,wy,ww,18,'ink');const roll=ROLLS[kills%3];
      for(let i=0;i<n;i++){rect(c,wx+3+i*13,wy+3,12,12,'#120c09');const it=roll[i];if(win.items.includes(it))c.drawImage(itemImg(it.kind,it.tier),wx+3+i*13,wy+3);}
      if(win.t<300)hand(c,gob.x+2,gob.y-6);}
    if(mode===0&&gob&&gob.dead>=150){const roll=ROLLS[kills%3];rect(c,0,H-17,W-22,17,'rgba(14,12,22,.8)');lootLine(c,'a goblin',roll,3,H-15,W-28);}
    for(const f of flies){const p=flyXY(f);c.drawImage(itemImg(f.kind,f.tier),Math.round(p.x-6),Math.round(p.y-6));}
    drawBag(c,180,105,bump(bagB),bagN||null);
    const ms_=m.t1();if((hud-=dt)<=0){hud=.25;const nIt=drops.filter(d=>!d.gone).length+others.reduce((a,o)=>a+o.drops.length,0);setHud(root,`JS ${fms(ms_)} ms/frame · ${nIt} ground items · ${['corpse container','ground spill','spill in a crowd','plain'][mode]}`);}}};
  setMode(1);return api;});

// ======================================================================
// §3 timeline
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#d9a066','#f2c14e','#4c9bff','#b45cff','#4ce04c'];
  const X=y=>1.5+(y-1995)/32*95;
  let h='<div class="tl-axis">';for(const y of [1996,2004,2013,2018,2025])h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
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
// A1 / A3 / A4: the same kill as a corpse, a spill, one bag or straight to the bag
// ======================================================================
reg('containers',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=96,cc=ctl(root),ro=$('[data-ro]',root),bg=mkField(W,H,23);
  const ROLL=[{kind:'coin3',tier:0,n:9},{kind:'meat',tier:0},{kind:'boots',tier:1},{kind:'gem',tier:2}],best=2;
  const KX=60,KY=60,WX=118,WY=60;let st='corpse',t=0,ph='alive',pt=0,clicks=0,drops=[],win=null,flies=[],bagN=0,bagB=1e9,toast=0,hov=null;const tally={corpse:[],spill:[],bag:[],direct:[]};
  function reset(){ph='alive';pt=0;clicks=0;drops=[];win=null;flies=[];toast=0;}
  cc.seg('st',v=>{st=v;reset();});
  const fly=(it,x,y)=>flies.push(mkFly(it,x,y,184,94,flies.length%2?1:-1));
  function done(){if(ph!=='looted'){ph='looted';pt=0;tally[st].push(clicks);if(tally[st].length>20)tally[st].shift();}}
  function winRect(){const n=ROLL.length,ww=n*13+6;return {x:Math.round(WX-ww/2),y:WY-40,w:ww,h:18};}
  pointer(cv,([x,y],k)=>{if(k==='move'||k==='leave'){hov=k==='move'?[x,y]:null;return;}if(k!=='down'||ph==='alive'||ph==='looted')return;
    if(win){const r=winRect();for(let i=0;i<ROLL.length;i++){const sx=r.x+3+i*13;if(win.has(i)&&x>=sx&&x<sx+12&&y>=r.y+3&&y<r.y+15){clicks++;win.delete(i);fly(ROLL[i],sx+6,r.y+9);if(!win.size){win=null;done();}return;}}
      if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)return;}
    if(st==='corpse'||st==='bag'){if(!win&&Math.abs(x-WX)<10&&Math.abs(y-(WY-4))<9){clicks++;win=new Set(ROLL.map((_,i)=>i));}return;}
    if(st==='spill'){for(const d of drops){if(d.gone)continue;const p=dropXY(d);if(Math.abs(x-p.x)<8&&Math.abs(y-(p.y-5-p.h))<8){clicks++;d.gone=true;fly(d,p.x,p.y-5-p.h);if(drops.every(e=>e.gone))done();return;}}}});
  const api={tick(dt){const s=dt*(still()?0:1)*slowF(root),ms=s*1000;t+=s;pt+=ms;
    if(ph==='alive'&&pt>700){ph='dead';pt=0;
      if(st==='spill'){const tl=ringTiles(Math.floor(WX/16),Math.floor(WY/16),ROLL.length,(a,b)=>a<1||b<1||a>10||b>4||a*16+8<KX+12);drops=ROLL.slice().sort((a,b)=>a.tier-b.tier).map((it,i)=>mkDrop(it,WX,WY-4,TXc(tl[i][0]),TYf(tl[i][1]),i*40));}
      if(st==='direct'){ROLL.forEach((it,i)=>setTimeout(()=>{},0));drops=[];}}
    if(ph==='dead'&&st==='direct'){const k=Math.floor(pt/120);while(flies.length+bagN<k+0&&false);if(pt>150&&!toast){toast=1;ROLL.forEach((it,i)=>flies.push({...mkFly(it,WX,WY-6,184,94,i%2?1:-1),t:-i*60}));done();}}
    for(const d of drops)stepDrop(d,ms);
    for(const f of flies){f.t+=ms;if(f.t>=f.ms&&!f.done){f.done=true;bagN+=f.n||1;bagB=0;}}flies=flies.filter(f=>!f.done);bagB+=ms;if(toast)toast+=ms;
    if(ph==='looted'&&pt>1500&&!flies.length)reset();
    c.drawImage(bg,0,0);
    if(ph==='alive')c.drawImage(wolfLive((t*4|0)&1),WX-7,WY-9);
    else{const showCorpse=st!=='bag'||ph==='looted'||true;const im=wolfCorpse();if(st==='bag'){if(ph!=='looted'||win){const b=lootBagImg(best);const hop=pt<200?Math.round(arcH(pt/200,3)):0;drawShadow(c,WX,WY,8,.5);c.drawImage(b,WX-5,WY-10-hop);}}
      else{c.drawImage(im,WX-7,WY-8);if(st==='corpse'&&ph!=='looted'){drawHalo(c,WX,WY-4,best,.3);glint(c,WX+5,WY-8,best,t);}}}
    drawUnit(c,'knight',KX,KY,{sword:ph==='alive'&&pt>500?.55:-1.1});
    for(const d of drops){if(d.gone)continue;const p=dropXY(d);if(d.landed&&d.tier>=2)drawHalo(c,p.x,p.y-5,d.tier,glowA(t,d.id));drawItem(c,d.kind,d.tier,p.x,p.y,{h:p.h});}
    if(win){const r=winRect();frame(c,r.x,r.y,r.w,r.h,'ink');for(let i=0;i<ROLL.length;i++){rect(c,r.x+3+i*13,r.y+3,12,12,'#120c09');if(win.has(i))c.drawImage(itemImg(ROLL[i].kind,ROLL[i].tier),r.x+3+i*13,r.y+3);}}
    if(st==='corpse'&&ph!=='alive'){rect(c,0,0,W,17,'rgba(14,12,22,.8)');lootLine(c,'a wolf',ROLL,4,3,W-8);}
    if(st==='direct'&&toast&&toast<2200){const a=toast>1800?1-(toast-1800)/400:1;c.globalAlpha=a;frame(c,4,4,W-30,22,'ink');drawText(c,'+9 GOLD, MEAT,',9,8,'#d3ccc9',FONT_S);drawText(c,'FINE BOOTS',9,15,TIERC[1],FONT_S);drawText(c,'GEM',53,15,TIERC[2],FONT_S);c.globalAlpha=1;}
    for(const f of flies){if(f.t<0)continue;const p=flyXY(f);c.drawImage(itemImg(f.kind,f.tier),Math.round(p.x-6),Math.round(p.y-6));}
    drawBag(c,184,95,bump(bagB),null);
    if(hov&&ph!=='alive'&&ph!=='looted'&&st!=='direct')hand(c,hov[0],hov[1]);
    const avg=k=>tally[k].length?(tally[k].reduce((a,b)=>a+b,0)/tally[k].length).toFixed(1):'–';
    ro.innerHTML=`Clicks this kill: <b>${clicks}</b>${ph==='looted'?' · all looted':ph==='alive'?' · a wolf is about to die':' · click to loot'} · average per kill: corpse ${avg('corpse')}, spill ${avg('spill')}, bag ${avg('bag')}, direct ${avg('direct')}`;}};
  return api;});

// ======================================================================
// A2 spill patterns, stepped item by item; paint walls
// ======================================================================
reg('scatter',root=>{const cv=$('canvas',root),c=C2(cv),GW=12,GH=7,W=GW*16,H=GH*16,cc=ctl(root),ro=$('[data-ro]',root),bg=mkField(W,H,31);
  const DC=[5,3],wall=new Set(['3,2','4,4','7,2','7,3','8,4']);let pat='d1',placed=[],plan=[],t=0,play=false,acc=0,paint=null;
  const KINDS=['coin3','potion','sword','gem','helmet','ring','rune','boots','scroll','shield','axe','bone','meat','coin1','pile','star','gem','sword','ring','potion'];
  const isWall=(x,y)=>wall.has(x+','+y)||x<0||y<0||x>=GW||y>=GH;
  function compute(){const n=cc.v('n'),out=[];
    if(pat==='d1'){ringTiles(DC[0],DC[1],n,isWall,8).forEach(([x,y])=>out.push({x:TXc(x),y:TYf(y),tx:x,ty:y}));}
    else if(pat==='ro'){const cyc=[[1,1],[-1,0],[0,-1]],J=[3,6,9,12];for(let i=0;i<n;i++){let [ox,oy]=i===0?[0,0]:cyc[(i-1)%3],tx=DC[0]+ox,ty=DC[1]+oy;
        if(isWall(tx,ty)){const f=ringTiles(tx,ty,1,isWall,1)[0];if(f){tx=f[0];ty=f[1];}else{tx=DC[0];ty=DC[1];}}
        const jx=J[i%4]/16*16-8,jy=J[(i+1)%4]/16*16-8;out.push({x:tx*16+8+Math.round(jx*.5),y:ty*16+13+Math.round(jy*.5),tx,ty});}}
    else{for(let i=0;i<n;i++){const k=i===0?0:Math.ceil(i/2)*(i%2?1:-1);out.push({x:DC[0]*16+8+Math.round(k*12.5),y:DC[1]*16+13,tx:DC[0],ty:DC[1]});}}
    plan=out.map((p,i)=>({...p,kind:KINDS[i%KINDS.length],tier:[0,0,1,2,1,3,2,1,1,2,0,0,0,0,0,4,2,1,3,0][i%20]}));}
  function reset(){placed=[];compute();}
  function step(){if(placed.length>=plan.length)return false;const p=plan[placed.length];placed.push(mkDrop(p,DC[0]*16+8,DC[1]*16+9,p.x,p.y,0,{dur:300,apex:8}));return true;}
  cc.seg('pat',v=>{pat=v;reset();});cc.on('n',()=>{cc.out('n',cc.v('n'));reset();});
  cc.btn('step',()=>{play=false;if(!step()){reset();step();}});cc.btn('play',()=>{if(placed.length>=plan.length)reset();play=true;acc=0;});cc.btn('reset',()=>{play=false;reset();});
  cc.btn('clear',()=>{wall.clear();reset();});
  pointer(cv,([x,y],k)=>{const tx=Math.floor(x/16),ty=Math.floor(y/16);if(tx<0||ty<0||tx>=GW||ty>=GH)return;const key=tx+','+ty;if(tx===DC[0]&&ty===DC[1])return;
    if(k==='down'){paint=!wall.has(key);}if((k==='down'||k==='drag')&&paint!=null){if(paint)wall.add(key);else wall.delete(key);const keep=placed.length;reset();for(let i=0;i<keep;i++){step();placed[i].t=1e4;placed[i].landed=true;}}if(k==='up')paint=null;});
  reset();
  return {tick(dt){const s=dt*slowF(root),ms=s*1000;t+=s;if(play&&!still()){acc+=ms;if(acc>=180){acc=0;if(!step())play=false;}}
    for(const d of placed)stepDrop(d,ms);
    c.drawImage(bg,0,0);c.fillStyle='rgba(0,0,0,.12)';for(let x=1;x<GW;x++)c.fillRect(x*16,0,1,H);for(let y=1;y<GH;y++)c.fillRect(0,y*16,W,1);
    for(const k of wall){const [x,y]=k.split(',').map(Number),X=x*16,Y=y*16;rect(c,X+1,Y+3,14,12,LG.ink);rect(c,X+2,Y+4,12,10,LG.rock2);rect(c,X+2,Y+4,10,6,LG.rock);px(c,X+4,Y+5,'#f6eedb');rect(c,X+2,Y+14,13,2,'rgba(10,14,12,.45)');}
    const im=corpseImg('goblin');c.drawImage(im,DC[0]*16+8-(im.width>>1),DC[1]*16+14-im.height);tmark(c,DC[0]*16,DC[1]*16,16,16,'#ffe08a');
    const order=placed.map((d,i)=>[d,i]).sort((a,b)=>dropXY(a[0]).y-dropXY(b[0]).y);
    for(const [d,i] of order){const p=dropXY(d);drawItem(c,d.kind,d.tier,p.x,p.y,{h:p.h});if(d.landed)drawText(c,String(i+1),p.x+5,p.y-4,'#ffe08a',FONT_S,{outline:'#1a1420'});}
    if(pat==='ms'){c.fillStyle='rgba(255,224,138,.5)';c.fillRect(0,DC[1]*16+14,W,1);}
    const n=plan.length,free=new Set(plan.map(p=>p.x+','+p.y)).size,tiles=new Set(plan.map(p=>p.tx+','+p.ty)).size;
    ro.innerHTML=`${placed.length} of ${n} placed · ${tiles} tiles used · ${pat==='d1'?'one item per tile, walls skipped':pat==='ro'?'items share 4 cells, jitter keeps them from overlapping exactly':'one row on the foothold, walls ignored'}`;}};});

// ======================================================================
// B1 the pop arc: duration, apex, sound moment, presets from §6a
// ======================================================================
reg('arc',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=112,cc=ctl(root),ro=$('[data-ro]',root),bg=mkField(W,64,41);
  const PRE={spd:{d:400,a:20,snd:'land',n:'Shattered Pixel Dungeon'},dvx:{d:650,a:20,snd:300,n:'devilutionX (Diablo)'},flare:{d:600,a:20,snd:0,n:'Flare'},ast:{d:400,a:20,snd:'land',n:'Asterion proposal'}};
  let pre='ast',d=null,t=0,next=0,sndDone=false,fl=null,bagB=1e9,picked=0,cut=0;
  const dur=()=>cc.v('dur'),apex=()=>cc.v('apex');
  const sync=()=>{cc.out('dur',dur()+' ms');cc.out('apex',apex()+' px');};
  cc.seg('pre',v=>{pre=v;cc.el('dur').value=PRE[v].d;cc.el('apex').value=PRE[v].a;sync();drop();});
  cc.on('dur',()=>{sync();drop();});cc.on('apex',()=>{sync();drop();});
  cc.on('snd',()=>{if(cc.v('snd'))AUD.enable();});
  function drop(){d=mkDrop({kind:'sword',tier:2},96,40,140,48,0,{dur:dur(),apex:apex()/2});sndDone=false;next=dur()+700;}
  const sndAt=()=>{const p=PRE[pre].snd;return p==='land'?dur():typeof p==='number'?Math.min(p,dur()):0;};
  pointer(cv,([x,y],k)=>{if(k!=='down'||!d||d.gone)return;const p=dropXY(d);if(Math.abs(x-p.x)<9&&Math.abs(y-(p.y-5-p.h))<9){d.gone=true;cut=d.t;picked++;fl=mkFly(d,p.x,p.y-5-p.h,182,60,1);if(cc.v('snd'))coinSnd(0);next=900;}});
  cc.btn('go',drop);sync();drop();
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),ms=s*1000;t+=s;
    if(d&&!d.gone){stepDrop(d,ms);if(!sndDone&&d.t>=sndAt()){sndDone=true;if(cc.v('snd'))landSnd('metal',.05);}}
    next-=ms;if(next<=0)drop();if(fl){fl.t+=ms;if(fl.t>=fl.ms){fl=null;bagB=0;}}bagB+=ms;
    c.fillStyle='#110e16';c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    const im=corpseImg('goblin');c.drawImage(im,96-(im.width>>1),48-im.height);
    if(d&&!d.gone){const p=dropXY(d);drawItem(c,d.kind,d.tier,p.x,p.y,{h:p.h});if(!d.landed){rect(c,Math.round(p.x)-1,Math.round(p.y-5-apex()/2)-0,3,1,'rgba(255,224,138,.35)');}}
    if(fl){const p=flyXY(fl);c.drawImage(itemImg(fl.kind,fl.tier),Math.round(p.x-6),Math.round(p.y-6));}
    drawBag(c,182,60,bump(bagB),picked||null);
    // height over time
    const gx=8,gy=70,gw=W-16,gh=36,D=dur(),T=1000;rect(c,gx,gy,gw,gh,'#1a1622');c.fillStyle='#2e2838';for(let ms_=0;ms_<=T;ms_+=100)c.fillRect(gx+Math.round(ms_/T*gw),gy,1,gh);
    c.fillStyle='#4c9bff';for(let i=0;i<=gw;i++){const ms_=i/gw*T;if(ms_>D)break;const h=arcH(ms_/D,apex()/2);c.fillRect(gx+i,gy+gh-3-Math.round(h*(gh-6)/20),1,1);}
    const sx=gx+Math.round(sndAt()/T*gw);rect(c,sx,gy+2,1,gh-4,'#ffe08a');drawText(c,'SOUND',sx+2,gy+2,'#ffe08a',FONT_S);
    rect(c,gx+Math.round(D/T*gw),gy,1,gh,'#4ce04c');
    if(d&&!d.gone&&!d.landed)rect(c,gx+Math.round(d.t/T*gw),gy,1,gh,'#ffffff');
    drawText(c,'0',gx+1,gy+gh-7,'#80778a',FONT_S);drawText(c,'1000 MS',gx+gw-1,gy+gh-7,'#80778a',FONT_S,{align:'right'});
    ro.innerHTML=`${PRE[pre].n}: <b>${D} ms</b> in the air, apex <b>${apex()} px</b> at 32 px tiles (${apex()/2} px here), height 4·h·t·(1−t) · sound at <b>${Math.round(sndAt())} ms</b>${PRE[pre].snd===0?' (on the flip)':''}${picked?` · last pickup cut the arc at ${Math.round(cut)} ms`:''}`;}};});

// ======================================================================
// B2 shadow, landing sound and why a bounce slows reading
// ======================================================================
reg('landing',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=88,cc=ctl(root),ro=$('[data-ro]',root),bg=mkField(W,H,47);
  const SET=[{kind:'coin3',tier:0,n:5},{kind:'potion',tier:1},{kind:'helmet',tier:2},{kind:'ring',tier:3},{kind:'star',tier:4}];
  let ds=[],t=0,next=0,rest=[];
  cc.on('snd',()=>{if(cc.v('snd'))AUD.enable();});
  function launch(){ds=SET.map((it,i)=>{const d=mkDrop(it,96,30,24+i*36,62,i*120,{dur:400,apex:10});d.settle=null;return d;});rest=[];next=3200;}
  cc.btn('go',launch);cc.seg('b',()=>launch());cc.on('sh',()=>{});launch();
  // bounce rules: none; hop = one 2 px hop under 120 ms for epic and legendary (4 px at 32 px tiles); all = two bounces of 4 and 2 px, 180 ms each (illustrative)
  function extra(d){const b=cc.segv('b');if(b==='hop')return d.tier>=3?[[120,2]]:[];if(b==='all')return [[180,4],[180,2]];return [];}
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),ms=s*1000;t+=s;next-=ms;if(next<=0)launch();
    for(const d of ds){const was=d.landed;stepDrop(d,ms);if(!was&&d.landed&&cc.v('snd'))landSnd(MAT_OF[d.kind],.045);
      if(d.landed&&d.settle==null){const ex=extra(d),tot=ex.reduce((a,b)=>a+b[0],0);if(d.lt>=tot){d.settle=d.t;rest.push(d.t+0);}}}
    c.drawImage(bg,0,0);const im=corpseImg('goblin');c.drawImage(im,96-(im.width>>1),32-im.height);
    for(const d of ds){if(d.t<0)continue;const p=dropXY(d);let h=p.h;if(d.landed){let lt=d.lt;for(const [dd,hh] of extra(d)){if(lt<dd){h=arcH(lt/dd,hh);break;}lt-=dd;}}
      drawItem(c,d.kind,d.tier,p.x,p.y,{h,shadow:cc.v('sh')});
      if(d.settle!=null){drawText(c,String(Math.round(d.settle)),p.x,p.y+4,'#ffe08a',FONT_S,{align:'center',outline:'#1a1420'});}
      else if(d.landed)drawText(c,'...',p.x,p.y+4,'#80778a',FONT_S,{align:'center'});}
    drawText(c,'MS UNTIL STILL',4,80,'#a9a1ad',FONT_S);
    const done=ds.filter(d=>d.settle!=null),last=done.length===ds.length?Math.max(...done.map(d=>d.settle)):null;
    ro.innerHTML=`${cc.v('sh')?'Shadow on: the oval stays on the floor, so height reads':'Shadow off: the item seems to slide sideways, height is hard to read'} · ${last!=null?`all 5 still after <b>${Math.round(last)} ms</b>`:'landing…'} · bounce ${({none:'off',hop:'epic and legendary only',all:'on for every item (illustrative)'})[cc.segv('b')]}`;}};});

// ======================================================================
// B3 big drops: 40 ms stagger, 600 ms cap, tier order, stack-size gold
// ======================================================================
reg('bigdrop',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=128,cc=ctl(root),ro=$('[data-ro]',root),bg=mkField(W,112,53);
  let ds=[],t=0,seqMs=0,next=0,lastLand=-1;
  function roll(n){const r=mkRng(n*7+3),L=[];const gold=[1,4,18,2,40,7];for(let i=0;i<Math.round(n/4);i++){const g=gold[i%gold.length];L.push({kind:goldKind(g),tier:0,n:g});}
    const pool=['potion','sword','shield','helmet','ring','gem','rune','scroll','bone','meat','axe','boots'];while(L.length<n-1){const tier=r()<.45?0:r()<.6?1:r()<.7?2:3;L.push({kind:pool[(r()*pool.length)|0],tier});}L.push({kind:'star',tier:4});return L;}
  function go(){const n=+cc.segv('n'),L=roll(n),ord=cc.segv('ord');let list=L.slice();if(ord==='tier')list.sort((a,b)=>a.tier-b.tier);else{const r=mkRng(Date.now()&1023);for(let i=list.length-1;i>0;i--){const j=(r()*(i+1))|0;[list[i],list[j]]=[list[j],list[i]];}}
    const cap=cc.v('cap'),stag=cap?Math.min(40,600/n):40;seqMs=stag*(n-1);const tl=ringTiles(7,3,n,(a,b)=>a<0||b<0||a>13||b>6,6);
    ds=list.map((it,i)=>mkDrop(it,112,52,TXc(tl[i][0]),TYf(tl[i][1]),i*stag,{dur:400,apex:10}));next=seqMs+3200;lastLand=-1;}
  cc.seg('n',go);cc.seg('ord',go);cc.on('cap',go);cc.btn('go',go);go();
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),ms=s*1000;t+=s;next-=ms;if(next<=0)go();
    for(const d of ds){const w=d.landed;stepDrop(d,ms);if(!w&&d.landed)lastLand=d.tier;}
    c.fillStyle='#110e16';c.fillRect(0,0,W,H);c.drawImage(bg,0,0);const im=corpseImg('orc');c.drawImage(im,112-(im.width>>1),56-im.height);
    const order=ds.filter(d=>d.t>=0).sort((a,b)=>dropXY(a).y-dropXY(b).y);
    for(const d of order){const p=dropXY(d);if(d.landed&&d.tier>=2)drawHalo(c,p.x,p.y-5,d.tier,glowA(t,d.id));drawItem(c,d.kind,d.tier,p.x,p.y,{h:p.h,t,id:d.id});}
    for(const d of ds)if(d.tier===4&&d.t>d.dur-200){const p=dropXY(d);drawBeam(c,p.x,p.y-3,4,sat((d.t-d.dur+200)/200));}
    // sequence strip: one tick per item at its launch time
    const sy=114,sx=6,sw=W-12,T=1300;rect(c,sx,sy,sw,10,'#1a1622');const xr=ms_=>sx+Math.round(ms_/T*sw);rect(c,xr(600),sy-2,1,14,'#ff6b5e');drawText(c,'600',xr(600)+2,sy+2,'#ff8f80',FONT_S);
    ds.forEach((d,i)=>{const at=-Math.min(0,d.t-d.t)+(d.t<0?0:0);const launch=(d.t<0?-d.t:0);});
    const now=ds.length?Math.max(...ds.map(d=>d.t+0))-0:0;ds.forEach(d=>{const l0=(ds[0].t-d.t);rect(c,xr(l0),sy+2,1,6,TIERC[d.tier]);});
    const prog=ds.length?ds[0].t:0;if(prog<T)rect(c,xr(Math.max(0,prog)),sy,1,10,'#ffffff');
    ro.innerHTML=`${ds.length} items · stagger <b>${(seqMs/Math.max(1,ds.length-1)).toFixed(1)} ms</b> · sequence <b>${Math.round(seqMs)} ms</b>${cc.v('cap')?'':' (no cap)'} · ${cc.segv('ord')==='tier'?'best item lands last':'random order, the legendary may land first'} · coins: 1 to 2 one coin, 3 to 9 a few, 10 and up a pile`;}};});

// ======================================================================
// C1 five tiers on grass, the shape ladder, colour-blind simulation
// ======================================================================
reg('tiers',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=104,cc=ctl(root),ro=$('[data-ro]',root);
  const floors={grass:mkField(W,H,61),path:(()=>{const f=mkField(W,H,61,{path:0}),g=f.getContext('2d');for(let y=16;y<H;y+=16)g.drawImage(f,0,0,W,16,0,y,W,16);return f;})(),stone:mkArena(W,H,5)};
  const CB={protan:[.152286,1.052583,-.204868,.114503,.786281,.099216,-.003882,-.048116,1.051998],deutan:[.367322,.860646,-.227968,.280085,.672501,.047413,-.01182,.04294,.968881],tritan:[1.255528,-.076749,-.178779,-.078411,.930809,.147602,.004733,.691367,.3039]};
  const lum=h=>{const v=[1,3,5].map(i=>{const x=parseInt(h.slice(i,i+2),16)/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const contrast=(a,b)=>{const A=lum(a),B=lum(b);return (Math.max(A,B)+.05)/(Math.min(A,B)+.05);};
  const FL={grass:'#2f6136',path:'#c49d64',stone:'#4a4658'};
  let t=0;cc.seg('sim',()=>{});cc.seg('fl',()=>{});
  return {tick(dt){t+=dt*(still()?0:1);const fl=cc.segv('fl');c.drawImage(floors[fl],0,0);
    for(let i=0;i<5;i++){const x=24+i*44,y=44;if(i>=2)drawHalo(c,x,y-5,i,glowA(t,i));drawItem(c,'sword',i,x,y,{t,id:i,sc:1});if(i===4)drawBeam(c,x,y-3,4,1,.9,40);
      drawLabel(c,TIER[i].n.toUpperCase(),i,x,y+12,{icon:true});
      drawText(c,TIERC[i].slice(1).toUpperCase(),x,y+16,'#f6eedb',FONT_S,{align:'center',outline:'#1a1420'});
      drawText(c,['NONE','CORNERS','OUTLINE','+SPARKLE','+BEAM'][i],x,y+24,'#f6eedb',FONT_S,{align:'center',outline:'#1a1420'});
      c.drawImage(itemImg('ring',i),x-18,y+34);c.drawImage(itemImg('gem',i),x-6,y+34);c.drawImage(itemImg('boots',i),x+6,y+34);}
    const sim=cc.segv('sim');if(sim!=='none'){const im=c.getImageData(0,0,W,H),D=im.data,M=CB[sim];for(let i=0;i<D.length;i+=4){const r=D[i],g=D[i+1],b=D[i+2];
        if(sim==='grey'){const y=Math.round(.299*r+.587*g+.114*b);D[i]=D[i+1]=D[i+2]=y;}else{D[i]=clamp(M[0]*r+M[1]*g+M[2]*b,0,255);D[i+1]=clamp(M[3]*r+M[4]*g+M[5]*b,0,255);D[i+2]=clamp(M[6]*r+M[7]*g+M[8]*b,0,255);}}c.putImageData(im,0,0);}
    ro.innerHTML='Contrast against the '+fl+' floor '+FL[fl]+' (computed, WCAG formula): '+TIER.map((T,i)=>`<span style="color:${T.c}">${T.n}</span> ${contrast(T.c,FL[fl]).toFixed(1)}:1`).join(' · ');}};});

// ======================================================================
// C2 glow pulse and beams: short for strangers, persistent for the owner, edge chip
// ======================================================================
reg('beams',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=112,cc=ctl(root),ro=$('[data-ro]',root),bg=mkField(W,88,67);
  const GL=[{kind:'gem',tier:2,x:30,y:40,id:3},{kind:'ring',tier:3,x:54,y:52,id:7},{kind:'rune',tier:2,x:40,y:72,id:12},{kind:'helmet',tier:3,x:70,y:34,id:21},{kind:'scroll',tier:2,x:84,y:66,id:30}];
  let t=0,leg=null,picked=0,flyL=null;
  function drop(){const off=cc.v('off');leg=mkDrop({kind:'star',tier:4},150,44,off?W+40:168,off?52:62,0);leg.age=0;}
  cc.btn('go',drop);cc.seg('who',()=>{});cc.on('off',drop);drop();
  pointer(cv,([x,y],k)=>{if(k!=='down'||!leg||!leg.landed||cc.v('off'))return;const p=dropXY(leg);if(Math.abs(x-p.x)<8&&Math.abs(y-p.y+5)<8){flyL=mkFly(leg,p.x,p.y-5,214,86,1);leg=null;picked++;}});
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),ms=s*1000;t+=s;const owner=cc.segv('who')==='owner',idp=cc.v('ph');
    if(leg){stepDrop(leg,ms);if(leg.landed)leg.age+=ms;if(!owner&&leg.age>6000)drop();}if(flyL){flyL.t+=ms;if(flyL.t>=flyL.ms){flyL=null;setTimeout(()=>{if(!leg)drop();},900);}}
    c.fillStyle='#110e16';c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    for(const g of GL){drawHalo(c,g.x,g.y-5,g.tier,glowA(t,idp?g.id:0));drawItem(c,g.kind,g.tier,g.x,g.y,{t,id:g.id});}
    let beamA=0;if(leg){const p=dropXY(leg);if(p.x<W+4)drawItem(c,'star',4,p.x,p.y,{h:p.h});
      const grow=sat((leg.t-(leg.dur-200))/200);beamA=owner?1:leg.age<2000?1:0;if(!owner&&leg.age>=1700&&leg.age<2000)beamA=1-(leg.age-1700)/300;
      if(p.x<W+4)drawBeam(c,p.x,p.y-3,4,grow,beamA);
      if(owner&&leg.landed&&p.x>W-4){const cy=Math.round(clamp(p.y-8,8,80)),bl=((t*2)|0)%2;rect(c,W-14,cy-6,13,13,'#1a1420');rect(c,W-13,cy-5,11,11,bl?'#ff9a1f':'#8a4a10');tShape(c,W-10,cy-2,4,'#1a1420');rect(c,W-2,cy-1,1,3,'#ff9a1f');}}
    if(flyL){const p=flyXY(flyL);c.drawImage(itemImg('star',4),Math.round(p.x-6),Math.round(p.y-6));}
    drawBag(c,214,87,1,picked||null);
    const gx=6,gy=92,gw=W-34,gh=16;rect(c,gx,gy,gw,gh,'#1a1622');rect(c,gx,gy+gh-2-Math.round(.6*12),gw,1,'#5d5468');drawText(c,'60%',gx+gw+2,gy+3,'#80778a',FONT_S);
    for(const [g,col] of [[GL[0],TIERC[2]],[GL[1],TIERC[3]]])for(let i=0;i<gw;i++){const tt=t-4+i/gw*4;c.fillStyle=col;c.fillRect(gx+i,gy+gh-2-Math.round(glowA(tt,idp?g.id:0)*12),1,1);}
    const st=!leg?'picked up':!leg.landed?'dropping':owner?(cc.v('off')?'off screen, the edge chip points to it':'beam stays until you pick it up'):beamA>0?`beam for ${(2-leg.age/1000).toFixed(1)} s more`:'beam gone, the item is still there';
    ro.innerHTML=`Viewer: <b>${owner?'owner':'stranger'}</b> · legendary ${st} · glow: 2 s triangle pulse capped at 60%, ${idp?'phase from item id, so piles never pulse together':'one shared phase, the whole pile pulses in lockstep'}${owner?'':' · click Drop to see the 2 s beam again'}`;}};});

// ======================================================================
// C3 tier sounds: 8-voice pool, priority own > party > others, 6 dB duck on a legendary
// ======================================================================
reg('stings',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=100,cc=ctl(root),ro=$('[data-ro]',root),r=mkRng(77);
  const WHO=['others','party','own'],WC=['#80778a','#4ce04c','#ffe08a'];let voices=[],ev=[],t=0,acc=0,duck=-1,cnt={req:0,play:0,steal:0,drop:0,silent:0,duck:0};
  cc.on('dps',()=>cc.out('dps',cc.v('dps')+' /s'));cc.out('dps',cc.v('dps')+' /s');
  cc.on('snd',()=>{if(cc.v('snd'))AUD.enable();});cc.btn('reset',()=>{for(const k in cnt)cnt[k]=0;});
  const pr=v=>v.who*10+v.tier;
  function want(who,tier,kind,ms,isSting){cnt.req++;const v={who,tier,kind,end:t+ms/1000,born:t,sting:isSting};
    if(voices.length<8){voices.push(v);cnt.play++;return v;}
    let worst=null;for(const o of voices){if(!worst||pr(o)<pr(worst)||(pr(o)===pr(worst)&&o.born<worst.born))worst=o;}
    if(pr(worst)<pr(v)){voices.splice(voices.indexOf(worst),1);voices.push(v);cnt.steal++;cnt.play++;return v;}cnt.drop++;return null;}
  function emit(){const who=r()<.2?2:r()<.45?1:0,x=r(),tier=x<.6?0:x<.85?1:x<.95?2:x<.99?3:4,kinds=['coin3','sword','potion','ring','star'],kind=kinds[tier];
    const audible=who>0||tier===4;let played=false;
    if(audible){const v=want(who,tier,kind,80+tier*30,false);if(v){played=true;if(cc.v('snd')){const vol=(who===2?.04:who===1?.02:.01)*(t<duck?.5:1);landSnd(MAT_OF[kind],vol);}}}else cnt.silent++;
    if(who===2&&tier>=2){const v=want(who,tier,kind,[0,0,400,650,900][tier],true);if(v&&cc.v('snd'))stingSnd(tier,.045);if(v&&tier===4){duck=t+.3;cnt.duck++;}}
    ev.push({t,who,tier,ok:played||!audible,sil:!audible});if(ev.length>200)ev.shift();}
  return {tick(dt){const s=dt*(still()?0:1)*slowF(root);t+=s;acc+=s*cc.v('dps');while(acc>=1){acc--;emit();}voices=voices.filter(v=>v.end>t);
    c.fillStyle='#110e16';c.fillRect(0,0,W,H);drawText(c,'8-VOICE LOOT POOL',6,4,'#a9a1ad',FONT_S);
    for(let i=0;i<8;i++){const x=6+i*27,y=12;frame(c,x,y,25,22,'ink');const v=voices[i];if(v){const k=sat((v.end-t)/((v.end-v.born)||1));rect(c,x+3,y+18,Math.round(19*k),2,WC[v.who]);c.drawImage(itemImg(v.kind,v.tier),x+7,y+3);if(v.sting)drawText(c,'S',x+19,y+3,TIERC[v.tier],FONT_S);}}
    const dk=t<duck;drawText(c,'LOOT BUS',6,40,'#a9a1ad',FONT_S);rect(c,44,40,60,5,'#1a1622');rect(c,44,40,dk?30:60,5,dk?'#ff6b5e':'#4c9bff');drawText(c,dk?'-6 DB':'0 DB',108,40,dk?'#ff8f80':'#a9a1ad',FONT_S);
    drawText(c,'EVENTS, LAST 4 S',6,52,'#a9a1ad',FONT_S);rect(c,6,60,W-12,34,'#1a1622');for(let w=0;w<3;w++)drawText(c,WHO[2-w].toUpperCase(),8,62+w*11,WC[2-w],FONT_S);
    for(const e of ev){const age=t-e.t;if(age>4)continue;const x=W-8-Math.round(age/4*(W-50)),y=63+(2-e.who)*11;if(e.sil){c.fillStyle='#3a3448';c.fillRect(x,y+1,1,1);continue;}
      if(e.ok){c.fillStyle=TIERC[e.tier];c.fillRect(x-1,y,3,3);}else{c.fillStyle='#ff6b5e';c.fillRect(x-1,y,1,1);c.fillRect(x+1,y+2,1,1);c.fillRect(x,y+1,1,1);c.fillRect(x+1,y,1,1);c.fillRect(x-1,y+2,1,1);}}
    ro.innerHTML=`Requests <b>${cnt.req}</b> · played <b>${cnt.play}</b> · stole a voice <b>${cnt.steal}</b> · culled <b>${cnt.drop}</b> · stranger drops kept silent <b>${cnt.silent}</b> · ducks <b>${cnt.duck}</b>${cc.v('snd')?'':' · sound is off, tick Sound to hear it'}`;}};});

// ======================================================================
// C4 honest tells against a fake near miss
// ======================================================================
reg('honest',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=96,cc=ctl(root),ro=$('[data-ro]',root),bgL=mkField(110,80,71),bgR=mkField(110,80,73);
  const SEQ=[0,1,0,2,0,3,1,0,4,0,2,1];let i=0,t=0,d=null,cnt={hb:0,fb:0,fz:0},next=0;
  function go(){const tier=SEQ[i++%SEQ.length];d={tier,t:0,kind:['bone','boots','gem','ring','star'][tier]};next=2000;cnt.hb+=tier===4?1:0;if(cc.v('fake')){cnt.fb++;if(tier!==4)cnt.fz++;}}
  cc.btn('go',go);cc.on('snd',()=>{if(cc.v('snd'))AUD.enable();});go();
  function panel(ox,bgc,fake){c.drawImage(bgc,ox,0);const x=ox+55,y=52,tt=d.t;const pre=fake?700:0,land=pre+400;
    if(fake&&tt<pre+200){const k=sat(tt/300),fiz=d.tier!==4&&tt>pre-150;drawBeam(c,x,y-3,4,fiz?k*(1-sat((tt-pre+150)/250)):k,fiz?.8*(1-sat((tt-pre+150)/250)):.9,40);if(fiz&&tt<pre+100){for(let j=0;j<4;j++)px(c,x-3+((j*5+tt/30)|0)%7,y-20-j*6,'#ff9a1f');}}
    if(tt>=pre){const k=sat((tt-pre)/400),h=arcH(k,10),xx=lerp(x-22,x,k),yy=lerp(y-6,y,k);
      if(k>=1&&d.tier>=2)drawHalo(c,x,y-5,d.tier,d.tier===2?.35:.6);drawItem(c,d.kind,d.tier,xx,yy,{h,t,id:3});
      if(d.tier===4&&tt>=land-200)drawBeam(c,x,y-3,4,sat((tt-land+200)/200),1,40);
      if(k>=1&&tt<land+500&&d.tier===4){const r_=Math.round((tt-land)/25);c.strokeStyle='rgba(255,154,31,.6)';c.lineWidth=1;c.beginPath();c.arc(x+.5,y-4.5,r_,0,Math.PI*2);c.stroke();}}
    const im=corpseImg('goblin');c.drawImage(im,x-22-(im.width>>1),y-4-im.height);}
  return {tick(dt){const s=dt*slowF(root)*(still()?0:1),ms=s*1000;t+=s;const fake=cc.v('fake');const pv=d.t;d.t+=ms;next-=ms;
    const land=400;if(pv<land&&d.t>=land&&cc.v('snd')){landSnd(MAT_OF[d.kind],.04);if(d.tier===1)AUD.blip(880,60,.03,'triangle');if(d.tier>=3)stingSnd(d.tier,.045);}
    if(next<=0)go();c.fillStyle='#110e16';c.fillRect(0,0,W,H);
    const dl=d.t;panel(0,bgL,false);if(fake){const save=d.t;d.t=dl;panel(114,bgR,true);d.t=save;}else{c.drawImage(bgR,114,0);drawText(c,'TICK FAKE NEAR MISS',169,36,'#d3ccc9',FONT_S,{align:'center',outline:'#1a1420'});}
    rect(c,110,0,4,H,'#110e16');drawText(c,'HONEST',55,84,'#4ce04c',FONT_S,{align:'center'});drawText(c,fake?'FAKE NEAR MISS':'(OFF)',169,84,fake?'#ff6b5e':'#80778a',FONT_S,{align:'center'});
    const B=['a thud','a pitch-up','glow','glow and a sting','beam, sting and a ping'];
    ro.innerHTML=`This drop: <b style="color:${TIERC[d.tier]}">${TIER[d.tier].n}</b>, budget ${B[d.tier]} · beams so far: honest <b>${cnt.hb}</b>, all legendary${fake?` · fake <b>${cnt.fb}</b>, of which <b>${cnt.fz}</b> fizzled`:''}`;}};});

// ======================================================================
// D1 the loot message and the party log
// ======================================================================
reg('lootlog',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=112,cc=ctl(root),ro=$('[data-ro]',root),r=mkRng(5);
  const WHO=['You','Mira','Tor','Ash'],MON=['a goblin','a goblin','a wolf','a goblin chief','a wolf'];let lines=[],t=0,acc=1.2,gold=[0,0,0,0];
  function kill(){const who=r()<.35?0:1+((r()*3)|0),mon=MON[(r()*MON.length)|0],n=1+((r()*3)|0),items=[{kind:'coin3',tier:0,n:3+((r()*20)|0)}];
    for(let i=0;i<n;i++){const x=r(),tier=x<.55?0:x<.82?1:x<.95?2:x<.995?3:4;items.push({kind:['meat','boots','gem','ring','star'][tier],tier});}
    gold[who]+=items[0].n;const last=lines[lines.length-1];
    if(cc.v('merge')&&last&&last.who===who&&last.mon===mon&&last.n<5){last.n++;last.items=last.items.concat(items.slice(1));last.items[0]={...last.items[0],n:last.items[0].n+items[0].n};}
    else lines.push({who,mon,items,n:1});if(lines.length>40)lines.shift();}
  cc.seg('tab',()=>{});cc.btn('split',()=>{const tot=gold.reduce((a,b)=>a+b,0);cc.out('split',`Session ${tot} gold · split ${Math.floor(tot/4)} each · you looted ${gold[0]}, Mira ${gold[1]}, Tor ${gold[2]}, Ash ${gold[3]}`);});
  for(let i=0;i<6;i++)kill();
  return {tick(dt){const s=dt*(still()?0:1);t+=s;acc-=s*cc.v('rate');if(acc<=0){acc=1;kill();}
    c.fillStyle='#120c09';c.fillRect(0,0,W,H);frame(c,0,0,W,H,'ink');const tab=cc.segv('tab');
    const tabs=['ALL','MINE','PARTY'];let tx=4;tabs.forEach((n,i)=>{const on=tab===['all','mine','party'][i],w=textW('LOOT '+n,FONT_S)+6;rect(c,tx,4,w,9,on?'#3a2a20':'#21170f');drawText(c,'LOOT '+n,tx+3,6,on?'#ffe08a':'#80778a',FONT_S);tx+=w+2;});
    const show=lines.filter(l=>tab==='all'||(tab==='mine'?l.who===0:l.who!==0));let y=H-6;const col=cc.v('col');
    for(let i=show.length-1;i>=0&&y>18;i--){const l=show[i],who=l.n>1?`${l.n} ${l.mon.replace(/^an? /,'')}s`:l.mon,h0=(()=>{let tmp=0;return tmp;})();
      const off=mkCanvas(1,1);let need=0;{let cx=0,lines_=1;const parts=['LOOT OF '+who.toUpperCase()+':'].concat(l.items.map(iname).map(s=>s.toUpperCase()+','));for(const p of parts){const w=textW(p,FONT_S);if(cx>0&&cx+w>W-36){cx=0;lines_++;}cx+=w+4;}need=lines_*7;}
      y-=need+2;if(y<16)break;drawText(c,WHO[l.who].toUpperCase(),5,y,l.who===0?'#ffe08a':'#4ce04c',FONT_S);lootLine(c,who,l.items,30,y,W-36,{plain:!col});}
    ro.innerHTML=`${lines.length} lines · party members see party kills · ${col?'item names in tier colour':'plain text, every item looks the same'}${cc.v('merge')?' · repeats from the same monster merge':''}`;}};});

// ======================================================================
// D2 labels on demand: hold key, owner first, cap sorted by tier then own then distance
// ======================================================================
reg('labels',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=128,cc=ctl(root),ro=$('[data-ro]',root),bg=mkField(W,H,83),r=mkRng(9);
  const KN=['coin3','potion','sword','gem','helmet','ring','rune','boots','scroll','shield','axe','bone','meat'];let items=[],t=0,hold=false,flies=[],bagN=0,bagB=1e9,rects=[];const HX=112,HY=72;
  function fill(){items=[];for(let i=0;i<46;i++){const x=10+r()*(W-20),y=14+r()*(H-24),q=r(),tier=q<.5?0:q<.75?1:q<.9?2:q<.98?3:4,own=r()<.45?'own':r()<.6?'public':'locked',kind=tier===4?'star':KN[(r()*KN.length)|0];items.push({kind,tier:kind==='bone'||kind==='meat'?0:tier,x:Math.round(x),y:Math.round(y),own,id:i});}}
  fill();const hb=root.querySelector('[data-b="hold"]');
  const on=v=>{hold=v;hb.classList.toggle('on',v);hb.setAttribute('aria-pressed',v);};hb.addEventListener('pointerdown',e=>{e.preventDefault();if(cc.v('tog'))on(!hold);else on(true);});
  addEventListener('pointerup',()=>{if(!cc.v('tog'))on(false);});hb.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();on(cc.v('tog')?!hold:true);}});hb.addEventListener('keyup',e=>{if(!cc.v('tog')&&(e.key===' '||e.key==='Enter'))on(false);});
  root.addEventListener('keydown',e=>{if(e.key==='Alt'){e.preventDefault();on(true);}});root.addEventListener('keyup',e=>{if(e.key==='Alt'&&!cc.v('tog'))on(false);});
  cc.on('cap',()=>cc.out('cap',cc.v('cap')));cc.out('cap',cc.v('cap'));cc.btn('refill',fill);
  pointer(cv,([x,y],k)=>{if(k!=='down')return;for(const q of rects){if(x>=q.x&&x<q.x+q.w&&y>=q.y&&y<q.y+q.h){const it=q.cd.it;items.splice(items.indexOf(it),1);flies.push(mkFly(it,it.x,it.y-5,214,124,1));return;}}});
  return {tick(dt){const s=dt*(still()?0:1),ms=s*1000;t+=s;for(const f of flies){f.t+=ms;if(f.t>=f.ms&&!f.done){f.done=true;bagN++;bagB=0;}}flies=flies.filter(f=>!f.done);bagB+=ms;
    c.drawImage(bg,0,0);const sorted=items.slice().sort((a,b)=>a.y-b.y);for(const it of sorted){if(it.tier>=2&&it.own!=='locked')drawHalo(c,it.x,it.y-5,it.tier,glowA(t,it.id));drawItem(c,it.kind,it.tier,it.x,it.y,{dim:it.own==='locked',t,id:it.id});}
    drawUnit(c,'knight',HX,HY,{sword:-1.1});
    const may=items.filter(i=>i.own!=='locked'),cap=cc.v('cap');let drawn=0,hid=0;rects=[];
    if(hold){const order=may.slice().sort((a,b)=>b.tier-a.tier||(a.own==='own'?0:1)-(b.own==='own'?0:1)||Math.hypot(a.x-HX,a.y-HY)-Math.hypot(b.x-HX,b.y-HY));
      const take=order.slice(0,cap),cands=take.map(it=>{const L=labelImg(iname(it).toUpperCase(),it.tier,{icon:true});return {x:it.x,y:it.y-12,w:L.w,h:L.h,it};});
      const res=solveLabels(cands,{W});for(const p of res.placed){c.globalAlpha=.35;rect(c,p.cd.x,p.y+p.h,1,Math.max(0,p.cd.y+1-p.y-p.h),'#f6eedb');c.globalAlpha=1;c.drawImage(labelImg(iname(p.cd.it).toUpperCase(),p.cd.it.tier,{icon:true}).cv,p.x,p.y);rects.push(p);}
      drawn=res.placed.length;hid=may.length-drawn;if(hid>0){frame(c,W-44,3,40,11,'ink');drawText(c,'+'+hid,W-24,6,'#ffe08a',FONT_S,{align:'center'});}}
    else{frame(c,4,4,64,11,'chip');drawText(c,'HOLD ALT',9,7,'#2b1d16',FONT_S);}
    for(const f of flies){const p=flyXY(f);c.drawImage(itemImg(f.kind,f.tier),Math.round(p.x-6),Math.round(p.y-6));}drawBag(c,214,125,bump(bagB),bagN||null);
    ro.innerHTML=`${items.length} items on the ground · ${may.length} you may take · ${hold?`labels <b>${drawn}</b>, hidden <b>${hid}</b> (cap ${cap}, then the solver hides losers)`:'labels off until you hold the key'} · grey items belong to someone else and never get a label${hold?' · click a label to pick up its item':''}`;}};});

// ======================================================================
// D3 label declutter: off, naive or grid solver; timed on 3000 candidates
// ======================================================================
reg('declutter',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=120,cc=ctl(root),ro=$('[data-ro]',root),bg=mkField(W,H,89),r=mkRng(13);
  const KN=['coin3','potion','sword','gem','helmet','ring','rune','boots','scroll','shield','axe'];const items=[];
  for(let i=0;i<24;i++){const cx=i<12?112:i<18?56:170,cy=i<20?78:i<28?96:92,a=r()*6.28,d=r()*(i<20?40:22);const q=r(),tier=q<.45?0:q<.72?1:q<.9?2:q<.98?3:4;items.push({kind:tier===4?'star':KN[(r()*KN.length)|0],tier,x:Math.round(cx+Math.cos(a)*d*1.3),y:Math.round(cy+Math.sin(a)*d*.6),id:i});}
  items.push({kind:'coin3',tier:0,x:112,y:78,id:90},{kind:'gem',tier:2,x:112,y:78,id:91},{kind:'ring',tier:1,x:113,y:78,id:92});
  const mn=meter(.15),mg=meter(.15);let bench={n:0,naive:0,grid:0,placed:0},bt=0;
  function runBench(){const N=cc.v('n'),R=mkRng(N),cands=[];for(let i=0;i<N;i++){const tier=(R()*5)|0;cands.push({x:R()*320,y:12+R()*168,w:20+((R()*30)|0),h:9,tier});}cands.sort((a,b)=>b.tier-a.tier);
    mn.t0();const a=solveLabels(cands,{grid:false});const tn=mn.t1();mg.t0();const b=solveLabels(cands,{grid:true});const tg=mg.t1();bench={n:N,naive:tn,grid:tg,placed:b.placed.length,cn:a.checks,cg:b.checks};}
  cc.seg('mode',()=>{});cc.on('n',()=>{cc.out('n',cc.v('n'));mn.t0();runBench();});cc.out('n',cc.v('n'));runBench();
  let t=0;return {tick(dt){t+=dt*(still()?0:1);bt-=dt;if(bt<=0){bt=.5;runBench();}
    c.drawImage(bg,0,0);const sorted=items.slice().sort((a,b)=>a.y-b.y||a.id-b.id);for(const it of sorted)drawItem(c,it.kind,it.tier,it.x,it.y,{t,id:it.id});
    const mode=cc.segv('mode'),order=items.slice().sort((a,b)=>b.tier-a.tier||Math.hypot(a.x-112,a.y-78)-Math.hypot(b.x-112,b.y-78));
    const cands=order.map(it=>{const L=labelImg(iname(it).toUpperCase(),it.tier,{icon:true});return {x:it.x,y:it.y-12,w:L.w,h:L.h,it};});let shown=0,hid=0,ov=0;
    if(mode==='off'){for(const cd of cands.slice().reverse()){c.drawImage(labelImg(iname(cd.it).toUpperCase(),cd.it.tier,{icon:true}).cv,Math.round(cd.x-cd.w/2),cd.y-cd.h);}shown=cands.length;
      for(let i=0;i<cands.length;i++)for(let j=0;j<i;j++){const a=cands[i],b=cands[j];if(Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.y-b.y)<9){ov++;}}}
    else{const res=solveLabels(cands,{push:mode!=='stack',W});shown=res.placed.length;hid=res.hidden.length;const per=new Map();for(const h of res.hidden){const k=Math.round(h.it.x/16)+','+Math.round(h.it.y/16);per.set(k,(per.get(k)||0)+1);}
      for(const [k,n] of per){const [tx,ty]=k.split(',').map(Number);drawText(c,'+'+n,tx*16,ty*16-2,'#ffe08a',FONT_S,{align:'center',outline:'#1a1420'});}for(const p of res.placed){c.globalAlpha=.35;rect(c,p.cd.x,p.y+p.h,1,Math.max(0,p.cd.y+1-p.y-p.h),'#f6eedb');c.globalAlpha=1;c.drawImage(labelImg(iname(p.cd.it).toUpperCase(),p.cd.it.tier,{icon:true}).cv,p.x,p.y);}
      }
    ro.innerHTML=`On screen: ${cands.length} labels, ${mode==='off'?`<b>${ov}</b> overlapping pairs`:`<b>${shown}</b> placed, <b>${hid}</b> hidden as +N`} · timed here on <b>${bench.n}</b> candidates in 320×180: grid <b>${fms(mg.v)} ms</b> (${bench.cg} checks) against naive <b>${fms(mn.v)} ms</b> (${bench.cn} checks), ${bench.placed} fit · measured on the M4 at 3000: 0.18 ms against 0.93 ms [S5]`;}};});

// ======================================================================
// D4 one tier style table and three filter presets
// ======================================================================
reg('filters',root=>{const cv=$('canvas',root),c=C2(cv),W=224,H=104,cc=ctl(root),ro=$('[data-ro]',root),tb=$('tbody',root),bg=mkField(W,H,97),r=mkRng(31);
  const PRE={all:{label:0,beam:4,sound:0},junk:{label:1,beam:4,sound:1},rare:{label:2,beam:4,sound:2}};let P={...PRE.all},pile=[],t=0;
  const KN=['coin3','potion','sword','gem','helmet','ring','rune','boots','scroll','shield','axe'];
  function drop(){pile=[];for(let i=0;i<28;i++){const q=i===17?.999:r(),junk=q<.25,tier=junk?0:q<.55?0:q<.78?1:q<.92?2:q<.985?3:4;pile.push({kind:junk?(r()<.5?'bone':'meat'):tier===4?'star':KN[(r()*KN.length)|0],tier,junk,x:14+((i%7)*30)+((r()*8)|0),y:20+Math.floor(i/7)*22+((r()*4)|0),id:i});}
    if(cc.v('snd')){const top=Math.max(...pile.map(p=>p.tier));if(top>=P.sound)stingSnd(Math.max(2,top),.04);}}
  function table(){tb.innerHTML=TIER.map((T,i)=>{const lab=i<P.label?'hidden':i===4?'big, filled':i===0?'small':'normal';return `<tr><td><span class="swatch" style="background:${T.c}"></span>${T.n}</td><td>${lab}</td><td><code>${T.c}</code></td><td>${i>=P.beam?'yes':'no'}</td><td>${i>=Math.max(P.sound,0)&&i>=1?(i>=2?'sting':'land'):'land'}</td></tr>`;}).join('')+`<tr><td><span class="swatch" style="background:#80778a"></span>Junk</td><td>${P.label>=1?'hidden':'small, grey'}</td><td><code>#a9a1ad</code></td><td>no</td><td>${P.sound>=1?'none':'land'}</td></tr>`;}
  cc.seg('pre',v=>{P={...PRE[v]};table();drop();});cc.on('snd',()=>{if(cc.v('snd'))AUD.enable();});cc.btn('go',drop);table();drop();
  return {tick(dt){t+=dt*(still()?0:1);c.drawImage(bg,0,0);let nl=0,nb=0;
    const order=pile.slice().sort((a,b)=>a.y-b.y);for(const p of order){if(p.tier>=2)drawHalo(c,p.x,p.y-5,p.tier,glowA(t,p.id));drawItem(c,p.kind,p.tier,p.x,p.y,{t,id:p.id});if(p.tier>=P.beam){drawBeam(c,p.x,p.y-3,4,1,.8,36);nb++;}}
    const cands=[];for(const p of order){const hideL=p.junk?P.label>=1:p.tier<P.label;if(hideL)continue;const txt=p.junk?(p.kind==='bone'?'BONE':'MEAT'):iname(p).toUpperCase();const L=labelImg(txt,p.tier,{icon:!p.junk,junk:p.junk});cands.push({x:p.x,y:p.y-12,w:L.w,h:L.h,txt,p});}
    cands.sort((a,b)=>b.p.tier-a.p.tier||(a.p.junk?1:0)-(b.p.junk?1:0));const res=solveLabels(cands,{steps:3,W});
    for(const q of res.placed){const cd=q.cd,L=labelImg(cd.txt,cd.p.tier,{icon:!cd.p.junk,junk:cd.p.junk});c.drawImage(L.cv,q.x,q.y);nl++;}
    ro.innerHTML=`${pile.length} drops · labels <b>${nl}</b> drawn${res.hidden.length?`, ${res.hidden.length} hidden by the solver`:''} · beams <b>${nb}</b> · sprites always stay, so hidden items remain pickable · one table row per tier, the client looks it up per item`;}};});
}
