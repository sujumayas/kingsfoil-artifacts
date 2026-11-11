// NPC dialog study: figures 1 (hero, timeline, classic roots, overhead text, the dialog box). Helpers and font live in core.js.
{
const C2=cv=>{const c=cv.getContext('2d');c.imageSmoothingEnabled=false;return c;};
const still=()=>!motion||reduce;
// 32x32 bust drawn per pixel: head ellipse, hair or hat, eyes that blink, a 2-frame mouth
function bust(c,x,y,look,o={}){const L=typeof look==='string'?LOOKS[look]:look;x=Math.round(x);y=Math.round(y);
  const ink=UI.ink,skin=L.s,sk2=shade(L.s,.86),hair=L.hat?L.a:L.h,hair2=L.hat?L.A:L.H;
  c.fillStyle=o.bg||'#d8c08c';c.fillRect(x,y,32,32);c.fillStyle=o.bg2||'#ccb07a';for(let j=2;j<32;j+=5)c.fillRect(x,y+j,32,1);
  for(let j=0;j<32;j++)for(let i=0;i<32;i++){let col=null;const hx=(i-15.5)/8.4,hy=(j-13.5)/9.4,dh=hx*hx+hy*hy;const sx=(i-15.5)/14.5,sy=(j-34)/11,ds=sx*sx+sy*sy;
    if(ds<1)col=ds>.88?ink:(i<16?L.c:L.C);
    if(ds<1&&L.w&&Math.abs(i-15.5)<3&&j>25)col=L.w;
    if(j>=20&&j<=25&&Math.abs(i-15.5)<3.6)col=Math.abs(i-15.5)>2.6?ink:sk2;
    if(dh<1){col=dh>.82?ink:(hx>.45?sk2:skin);
      const fringe=hy<-.42||(Math.abs(hx)>.7&&hy<.3);if(fringe)col=dh>.82?ink:(hx>.2?hair2:hair);
      if(look==='elder'&&hy>.42&&dh<.82)col=(hx>.35?'#d6d0c2':L.w);}
    else if(dh<1.18&&hy<.1&&!L.hat&&look!=='boy'){col=hy<-.2||Math.abs(hx)>.8?(dh>1.1?ink:hair2):col;}
    if(col){c.fillStyle=col;c.fillRect(x+i,y+j,1,1);}}
  const R=(i,j,w,h,col)=>{c.fillStyle=col;c.fillRect(x+i,y+j,w,h);};
  if(o.blink){R(11,14,3,1,ink);R(18,14,3,1,ink);}else{R(11,13,2,2,ink);R(19,13,2,2,ink);R(11,13,1,1,'#ffffff');R(19,13,1,1,'#ffffff');}
  const brow=o.expr==='angry'?1:0;R(10,11-brow,3,1,hair2);R(19,11-brow,3,1,hair2);if(o.expr==='angry'){R(12,11,1,1,hair2);R(19,11,1,1,hair2);}
  R(15,16,2,1,sk2);if(look!=='elder'){R(9,16,2,1,'#e89a8a');R(21,16,2,1,'#e89a8a');}
  const my=look==='elder'?19:19;
  if(o.mouth){R(14,my-1,4,3,ink);R(15,my,2,1,'#b0503a');}else if(o.expr==='happy'){R(13,my-1,1,1,ink);R(14,my,4,1,ink);R(18,my-1,1,1,ink);}else R(14,my,4,1,ink);}
function shade(hex,k){const n=parseInt(hex.slice(1),16);const r=(n>>16)&255,g=(n>>8)&255,b=n&255;return '#'+[r,g,b].map(v=>Math.round(v*k).toString(16).padStart(2,'0')).join('');}
// typewriter clock shared by the box figures. Pauses: 5 glyph-times after , ; : and 10 after . ! ? before a space (§6a)
function mkTyper(){const T={L:null,n:0,acc:0,done:true,
  set(L){T.L=L;T.n=0;T.acc=0;T.done=!L.g.length;},
  delay(i,cps,punct){const g=T.L.g[i];let d=1/(cps*(g.spd||1));if(g.pause)d+=g.pause/60;
    if(punct&&i>0){const p=T.L.g[i-1].ch;if(p===','||p===';'||p===':')d+=5/cps;else if('.!?…'.includes(p)&&(g.ch===' '||g.ch==='\n'))d+=10/cps;}return d;},
  step(dt,cps,punct=true,onGlyph){if(T.done||!T.L)return;if(!isFinite(cps)||cps<=0){T.finish();return;}T.acc+=dt;
    while(T.n<T.L.g.length){const d=T.delay(T.n,cps,punct);if(T.acc<d)break;T.acc-=d;if(onGlyph)onGlyph(T.L.g[T.n],T.n);T.n++;}
    if(T.n>=T.L.g.length){T.done=true;T.acc=0;}},
  finish(){if(T.L)T.n=T.L.g.length;T.done=true;},
  total(cps,punct){let s=0;if(!T.L)return 0;for(let i=0;i<T.L.g.length;i++)s+=T.delay(i,cps,punct);return s;}};return T;}
// cached bubble bodies (frame + text drawn once into a canvas), keyed by text
const BUBC=new Map();
function bubImg(text,F=FONT_S,maxW=90,style='bubble',col=UI.ink){const k=style+'|'+col+'|'+maxW+'|'+(F===FONT?'b':'s')+'|'+text;let b=BUBC.get(k);if(b)return b;
  const lines=wrap(text,maxW,F),w=Math.max(...lines.map(l=>textW(l,F)))+(F===FONT?8:6),h=lines.length*F.lh+(F===FONT?5:4);const cv=mkCanvas(w,h),c=cv.getContext('2d');
  frame(c,0,0,w,h,style);drawLines(c,lines,F===FONT?4:3,F===FONT?2:2,col,F);b={cv,w,h,lines};if(BUBC.size>600)BUBC.clear();BUBC.set(k,b);return b;}
// the same bubble drawn glyph by glyph every frame (the uncached path, for cost comparisons)
function bubLive(c,text,x,y,F=FONT_S,maxW=90,style='bubble',col=UI.ink){const lines=wrap(text,maxW,F),w=Math.max(...lines.map(l=>textW(l,F)))+(F===FONT?8:6),h=lines.length*F.lh+(F===FONT?5:4);
  frame(c,x,y,w,h,style);drawLines(c,lines,x+(F===FONT?4:3),y+2,col,F);return {w,h};}
const words='the of a to and in old herb road fish bread market gate river night wolf ale sword coin quest north south well mill bell lamp rain bird apple cart guard fair spring lantern tower'.split(' ');
function sayLine(n,r){let s='';while(s.length<n){const w=words[Math.floor(r()*words.length)];s+=(s?' ':'')+w;}s=s.slice(0,n).trimEnd();return s.charAt(0).toUpperCase()+s.slice(1)+(n>6?'.':'');}
const CROWD=['Anyone selling rope?','LFG cave, 2 more!','Nice hat!','Brb','Where is the bank?','lol','Trade me','Ale is on me!','Who wants a duel?','Hi all','Has anyone seen my cat?','Selling fish, cheap','Gz!','Wolves at the north gate','Need a healer','ty','The bard is back','Afk 5 min','Is the shop open?','Rain again'];

// ======================================================================
// HERO: a live town square in four dialog styles
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),c=C2(cv),W=320,H=180,tiers=$$('.hero-tiers button',root),m=meter(.1),r=mkRng(11);
  const T=mkTown(W,H,7);let mode=0,t=0,hud=0;
  const elder={x:T.board.x+18,y:T.board.y+5,look:'elder',dir:'down'},shop={x:T.houses[1].door.x,y:T.houses[1].door.y+1,look:'shop',dir:'down'},
    guard={x:T.houses[2].door.x-14,y:T.houses[2].door.y+4,look:'guard',dir:'down'},monk={x:T.fountain.x+36,y:T.fountain.y+4,look:'monk',dir:'left'};
  const player={x:elder.x,y:elder.y+20,look:'player',dir:'up',fr:0,an:0,tx:elder.x,ty:elder.y+20};
  const walkers=[{look:'girl',pts:[[118,150],[214,156]]},{look:'boy',pts:[[250,100],[296,150]]},{look:'bard',pts:[[40,150],[96,168]]}].map(w=>({...w,x:w.pts[0][0],y:w.pts[0][1],k:0,f:0,dir:'right',an:0}));
  const crowd=[];for(let i=0;i<24;i++)crowd.push({look:LOOKS.list[1+(i%9)],x:40+r()*240,y:96+r()*78,tx:0,ty:0,dir:'down',an:0,next:r()*6,bub:[]});crowd.forEach(p=>{p.tx=p.x;p.ty=p.y;});
  const LINES=['Ah, a traveller! The planters by the fountain have wilted again.','Bring me [c=key]3 herbs[/c] and I will [wave]brew[/wave] us both a tonic.[p=10] Deal?','Mind the guard by the tavern. He only answers to {hi}.'];
  const typer=mkTyper();let li=0,wait=0,mouth=0,blinkT=2;const boxL=LINES.map(s=>layout(s,250,FONT)),bubL=LINES.map(s=>layout(s,118,FONT));
  const start=()=>{li=0;wait=0;typer.set(mode===1?bubL[0]:boxL[0]);};
  // keyword chat script: who, text, delay before
  const KS=[['p','hi',.6],['g','Greetings, Alice. I guard the {gate}. Ask me about my {job}.',1],['p','gate',2.6],['g','It shuts at dusk. Want to pass before then? Say {yes}.',1],['p','yes',2.8],['g','Off you go. Mind the wolves on the north road.',1],['p','bye',2.8],['g','Good bye, Alice.',1],['-','',3]];
  let ks=0,kt=0;const said=[],log=[];
  const barks=[];let barkT=1.5;
  const setMode=k=>{mode=k;tiers.forEach((b,i)=>b.classList.toggle('on',i===k));start();ks=0;kt=0;said.length=0;log.length=0;barks.length=0;crowd.forEach(p=>p.bub=[]);
    if(k===2){player.tx=guard.x-20;player.ty=guard.y+4;}else{player.tx=elder.x;player.ty=elder.y+20;}};
  tiers.forEach((b,i)=>b.addEventListener('click',()=>setMode(i)));setMode(0);
  const walk=(o,tx,ty,dt,sp=22)=>{const dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy);if(d<.6){o.moving=false;return true;}const s=Math.min(d,sp*dt);o.x+=dx/d*s;o.y+=dy/d*s;o.moving=true;o.an=(o.an||0)+dt*7;o.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');return false;};
  const fr=o=>o.moving?((o.an|0)&1):0;
  function overhead(text,x,y,col,F=FONT){const lines=wrap(text,120,F);const w=Math.max(...lines.map(l=>textW(l,F)));const X=clamp(Math.round(x-w/2),3,W-w-3);
    lines.forEach((l,i)=>drawText(c,l,X+(w-textW(l,F))/2,y-(lines.length-i)*F.lh,col,F,{outline:UI.ink}));}
  return {tick(dt){t+=dt;m.t0();let glyphs=0;
    // world
    c.drawImage(T.cv,0,0);
    for(const w of walkers){const p=w.pts[w.k];if(walk(w,p[0],p[1],dt,14)){w.k^=1;}}
    walk(player,player.tx,player.ty,dt,40);if(!player.moving)player.dir=mode===2?'right':'up';
    elder.dir=mode===2?'down':'down';
    const people=[elder,shop,guard,monk,player,...walkers];if(mode===3){for(const p of crowd){if(walk(p,p.tx,p.ty,dt,10)){p.tx=clamp(p.x+(r()-.5)*60,30,290);p.ty=clamp(p.y+(r()-.5)*40,96,174);}}people.push(...crowd);}
    people.sort((a,b)=>a.y-b.y);for(const p of people)drawNPC(c,p.x,p.y,p.look,p.dir,fr(p));
    marker(c,monk.x,monk.y-17,'?',t,still());if(mode!==0)marker(c,elder.x,elder.y-17,'!',t+.5,still());
    // dialog
    if(mode===0||mode===1){const cps=20;const was=typer.n;typer.step(dt,cps,true);glyphs=typer.n;
      if(typer.done){wait+=dt;if(wait>2.6){wait=0;li=(li+1)%LINES.length;typer.set((mode===1?bubL:boxL)[li]);}}
      const g=typer.L.g[Math.max(0,typer.n-1)];mouth=!typer.done&&g&&g.ch!==' '?Math.floor(t*10)&1:0;blinkT-=dt;if(blinkT<-.1)blinkT=2+r()*2.5;
      if(mode===0){frame(c,4,128,312,48,'box');frame(c,10,134,36,36,'ink');bust(c,12,136,'elder',{mouth,blink:blinkT<0});
        const nm='Maren, the elder';const nw=textW(nm)+10;frame(c,52,120,nw,13,'wood');drawText(c,nm,57,122,UI.paper,FONT,{shadow:UI.wood3});
        drawLayout(c,typer.L,54,136,{n:typer.n,t,still:still(),ul:true});
        if(typer.done){const bob=still()?0:[0,1,2,1][Math.floor(t*60/9)%4];arrowDown(c,302,165+bob,UI.wood3);}}
      else{const L=typer.L,w=L.w+9,h=Math.max(1,(typer.done?L.lines:(L.g[Math.max(0,typer.n-1)]?.line??0)+1))*FONT.lh+5;const bx=clamp(elder.x-w/2,4,W-w-4),by=elder.y-22-h;
        bubble(c,bx,by,w,h,elder.x);drawLayout(c,L,bx+4,by+2,{n:typer.n,t,still:still(),ul:true});
        barkT-=dt;if(barkT<0){barkT=2.5+r()*3;const who=walkers[Math.floor(r()*walkers.length)];const txt=['FRESH BREAD!','NICE DAY.','HAVE YOU SEEN MY CAT?','TRA LA LA...'][Math.floor(r()*4)];barks.push({who,txt,life:Math.max(3,.06*txt.length)});}
        for(const b of barks){b.life-=dt;if(b.life<=0)continue;const im=bubImg(b.txt);const x=clamp(b.who.x-im.w/2,3,W-im.w-3),y=b.who.y-20-im.h;c.drawImage(im.cv,Math.round(x),Math.round(y));bubTail(c,b.who.x,y+im.h-1,1);glyphs+=b.txt.length;}
        for(let i=barks.length-1;i>=0;i--)if(barks[i].life<=0)barks.splice(i,1);}}
    else if(mode===2){kt+=dt;const st=KS[ks];if(kt>=st[2]){kt=0;if(st[0]!=='-'){said.push({who:st[0],txt:st[1],life:Math.max(3,.06*st[1].length)});log.push(st);if(log.length>3)log.shift();}ks=(ks+1)%KS.length;if(ks===0){log.length=0;}}
      for(const s of said){s.life-=dt;if(s.life<=0)continue;const o=s.who==='p'?player:guard;const txt=s.txt.replace(/[{}]/g,'');overhead(txt,o.x,o.y-17,s.who==='p'?'#efef00':'#5ff7f7');glyphs+=txt.length;}
      for(let i=said.length-1;i>=0;i--)if(said[i].life<=0)said.splice(i,1);
      frame(c,4,134,312,42,'ink');let y=139;for(const [w,txt] of log){const nm=w==='p'?'Alice: ':'Brom: ';const col=w==='p'?'#efef00':'#5ff7f7';drawText(c,nm,10,y,col,FONT);
        const L=layout(txt,300-textW(nm),FONT);drawLayout(c,L,10+textW(nm)+1,y,{col,key:'#ffd27a',ul:true});y+=11;glyphs+=txt.length;}}
    else{// crowd: priority + caps (3 per speaker, 12 on screen), greedy push
      const cps=20;typer.step(dt,cps,true);if(typer.done){wait+=dt;if(wait>2.6){wait=0;li=(li+1)%LINES.length;typer.set(bubL[li]);}}
      for(const p of crowd){p.next-=dt;if(p.next<0){p.next=4+r()*14;const s=CROWD[Math.floor(r()*CROWD.length)];p.bub.push({s,life:Math.max(3,.06*s.length),age:0});}for(const b of p.bub){b.life-=dt;b.age+=dt;}p.bub=p.bub.filter(b=>b.life>0);}
      const items=[];const L=typer.L,ew=L.w+9,eh=((typer.done?L.lines:(L.g[Math.max(0,typer.n-1)]?.line??0)+1))*FONT.lh+5;items.push({x:clamp(elder.x-ew/2,4,W-ew-4),y:elder.y-22-eh,w:ew,h:eh,tx:elder.x,pr:0,own:true});
      let alive=0;for(const p of crowd){p.bub.slice(-3).forEach((b,j,a)=>{const im=bubImg(b.s);items.push({x:clamp(p.x-im.w/2,3,W-im.w-3),y:p.y-20-im.h,w:im.w,h:im.h,tx:p.x,im,pr:2,age:b.age});});alive+=p.bub.length;}
      items.sort((a,b)=>a.pr-b.pr||b.age-a.age);const shown=items.slice(0,13),placed=[];
      for(const it of shown){let moved=true,g=0;while(moved&&g++<20){moved=false;for(const q of placed){if(it.x<q.x+q.w+2&&it.x+it.w+2>q.x&&it.y<q.y+q.h+2&&it.y+it.h+2>q.y){it.y=q.y-it.h-2;moved=true;}}}placed.push(it);}
      for(let i=placed.length-1;i>=0;i--){const it=placed[i];if(it.own){bubble(c,it.x,it.y,it.w,it.h,it.tx);drawLayout(c,L,it.x+4,it.y+2,{n:typer.n,t,still:still(),ul:true});}else{c.drawImage(it.im.cv,Math.round(it.x),Math.round(it.y));if(it.y+it.h<it.tx&&true)bubTail(c,it.tx,it.y+it.h-1,1);}}
      glyphs=typer.n+placed.length*14;hud=`${alive} lines alive · 12 shown · ${Math.max(0,alive-12)} to the log`;}
    const ms=m.t1();setHud(root,`frame ${fms(m.v)} ms (JS, this device)`+(mode===3?` · ${hud}`:''));}};});

// ======================================================================
// §3 timeline: five generations on a linear 1985-2027 axis
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#d9a066','#f2c14e','#9fd3c7','#e0734f','#d7a2e8'];
  const X=y=>1.5+(y-1985)/42*97;
  let h='<div class="tl-axis">';for(const y of [1986,1995,2005,2015,2025])h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
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
// A1 Tibia keyword NPC: hi / keywords / bye, 3-tile Chebyshev radius,
// 1 s reply delay, idle 120 s (shown 10x faster), cyan replies, {links}
// ======================================================================
reg('keyword',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=144,TS=16,ro=$('[data-ro]',root),logEl=$('.kwlog',root),inp=$('[data-kw]',root);
  const npc={tx:9,ty:4},pl={tx:7,ty:5,x:7*TS+8,y:5*TS+15,dir:'right',an:0};let focus=false,idle=0,pending=null,last=null,t=0;const over=[];const IDLE=12;
  const floor=mkCanvas(W,H),f=floor.getContext('2d');
  for(let ty=0;ty<9;ty++)for(let tx=0;tx<16;tx++){const x=tx*TS,y=ty*TS;f.fillStyle=((tx+ty)&1)?UI.cob:'#a99b84';f.fillRect(x,y,TS,TS);
    for(let k=0;k<5;k++){const h=hash2(tx*7+k,ty*3);f.fillStyle=h<.5?UI.cob2:UI.cob3;f.fillRect(x+((h*97)|0)%15,y+((h*331)|0)%15,2,1);}f.fillStyle='rgba(43,29,22,.18)';f.fillRect(x,y+TS-1,TS,1);f.fillRect(x+TS-1,y,1,TS);}
  // gate posts behind the guard
  for(const gx of [8,11]){f.fillStyle=UI.ink;f.fillRect(gx*TS+3,2,10,36);f.fillStyle=UI.grey;f.fillRect(gx*TS+4,3,8,34);f.fillStyle=UI.grey2;f.fillRect(gx*TS+4,3,2,34);}
  f.fillStyle=UI.wood3;f.fillRect(8*TS+13,10,3*TS-10,4);f.fillStyle=UI.wood2;f.fillRect(8*TS+13,11,3*TS-10,2);
  const name='Brom';
  const TREE={greet:'Greetings, Alice. I guard the {gate} of Asterion. Ask about my {job}, or about the {trade} road.',
    name:'I am Brom, of the town watch.',job:'I keep the {gate} and watch the road for wolves.',
    gate:'The gate shuts at dusk. Do you want to pass before then? Say {yes}.',yes:'Off you go then. Mind the wolves.',no:'Then stay inside the walls, friend.',
    trade:'I do not trade. Ask the shopkeeper by the fountain.',bye:'Good bye, Alice.',away:'Good bye.',idle:'Next, please.'};
  const has=(msg,w)=>new RegExp('(^|[^a-z])'+w+'($|[^a-z])').test(msg);
  const addLog=(who,txt)=>{const d=document.createElement('p');d.className=who==='npc'?'npc':'me';
    if(who==='npc'){d.innerHTML=`<b>${name}:</b> `+txt.replace(/[<>&]/g,'').replace(/\{(\w+)\}/g,'<button type="button" class="kwc" data-say="$1">$1</button>');}else d.innerHTML=`<b>Alice:</b> ${txt.replace(/[<>&]/g,'')}`;
    logEl.appendChild(d);while(logEl.children.length>40)logEl.firstChild.remove();logEl.scrollTop=logEl.scrollHeight;};
  const dist=()=>Math.max(Math.abs(pl.tx-npc.tx),Math.abs(pl.ty-npc.ty));
  const npcSay=k=>{pending={k,at:t+1};};
  const say=raw=>{const msg=String(raw).toLowerCase().trim().slice(0,40);if(!msg)return;addLog('me',msg);over.push({who:'p',txt:msg,life:Math.max(3,.06*msg.length)});
    if(dist()>3){note='Too far: the guard only hears you within 3 tiles.';return;}
    if(!focus){if(has(msg,'hi')||has(msg,'hello')){focus=true;idle=0;last=null;npcSay('greet');note='Greeted: the guard focuses on you.';}else note='No focus yet: say hi or hello first. Other words are ignored.';return;}
    if(has(msg,'bye')||has(msg,'farewell')){npcSay('bye');focus=false;return;}
    let k=null;if(last==='gate'&&has(msg,'yes'))k='yes';else if(last==='gate'&&has(msg,'no'))k='no';else for(const w of ['name','job','gate','trade'])if(has(msg,w)){k=w;break;}
    if(k){idle=0;last=k;npcSay(k);note=`Matched "${k}". The idle clock resets.`;}else note='No keyword matched, so no reply, and the idle clock keeps running.';};
  let note='Say hi to start. Click a chip, type a word, or click a cyan link in a reply.';{const d=document.createElement('p');d.className='sys';d.textContent='Brom the guard stands at the gate. He hears you within 3 tiles once you greet him.';logEl.appendChild(d);}
  root.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){say(b.dataset.say);}});
  $('.kwform',root).addEventListener('submit',e=>{e.preventDefault();say(inp.value);inp.value='';});
  let drag=false;pointer(cv,(p,k)=>{const tx=clamp(Math.floor(p[0]/TS),0,15),ty=clamp(Math.floor(p[1]/TS),2,8);if(k==='down'){drag=true;}if((k==='down'||k==='drag')&&drag&&!(tx===npc.tx&&ty===npc.ty)){pl.tx=tx;pl.ty=ty;}if(k==='up')drag=false;});
  return {tick(dt){t+=dt;
    // walk the player sprite toward its tile
    const gx=pl.tx*TS+8,gy=pl.ty*TS+15,dx=gx-pl.x,dy=gy-pl.y,d=Math.hypot(dx,dy);if(d>.5){const s=Math.min(d,70*dt);pl.x+=dx/d*s;pl.y+=dy/d*s;pl.an+=dt*9;pl.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');pl.mv=true;}else{pl.mv=false;}
    if(focus&&dist()>3){focus=false;pending={k:'away',at:t};note='You left the 3-tile radius, so the talk ended.';}
    if(focus){idle+=dt;if(idle>=IDLE){focus=false;pending={k:'idle',at:t};note='120 s of silence (12 s here) ended the talk.';}}
    if(pending&&t>=pending.at){const txt=TREE[pending.k];addLog('npc',txt);over.push({who:'n',txt:txt.replace(/[{}]/g,''),life:Math.max(3,.06*txt.length)});pending=null;}
    c.drawImage(floor,0,0);
    // talk radius: Chebyshev 3 tiles around the guard
    c.fillStyle=focus?'rgba(242,193,78,.30)':'rgba(242,193,78,.18)';const rx=(npc.tx-3)*TS,ry=(npc.ty-3)*TS;c.fillRect(rx,Math.max(0,ry),7*TS,7*TS);
    c.fillStyle=UI.gold;for(let i=0;i<7*TS;i+=4){c.fillRect(rx+i,Math.max(0,ry),2,1);c.fillRect(rx+i,ry+7*TS-1,2,1);c.fillRect(rx,Math.max(0,ry)+i,1,2);c.fillRect(rx+7*TS-1,Math.max(0,ry)+i,1,2);}
    const ndir=focus?(Math.abs(pl.tx-npc.tx)>=Math.abs(pl.ty-npc.ty)?(pl.tx>npc.tx?'right':'left'):(pl.ty>npc.ty?'down':'up')):'down';
    const ppl=[{x:npc.tx*TS+8,y:npc.ty*TS+15,look:'guard',dir:ndir,fr:0},{x:pl.x,y:pl.y,look:'player',dir:pl.dir,fr:pl.mv?((pl.an|0)&1):0}].sort((a,b)=>a.y-b.y);
    for(const p of ppl)drawNPC(c,p.x,p.y,p.look,p.dir,p.fr);
    if(pending&&!still()){const k=Math.floor(t*4)%4;for(let i=0;i<3;i++)if(i<k){c.fillStyle=UI.ink;c.fillRect(npc.tx*TS+3+i*4,npc.ty*TS-6,2,2);}}
    // overhead text: yellow say, cyan NPC reply, outlined, wrapped at 120 px
    for(const o of over){o.life-=dt;}for(let i=over.length-1;i>=0;i--)if(over[i].life<=0)over.splice(i,1);
    const lastOf=w=>{for(let i=over.length-1;i>=0;i--)if(over[i].who===w)return over[i];return null;};
    for(const w of ['p','n']){const o=lastOf(w);if(!o)continue;const ax=w==='p'?pl.x:npc.tx*TS+8,ay=(w==='p'?pl.y:npc.ty*TS+15)-18;const lines=wrap(o.txt,120,FONT);const lw=Math.max(...lines.map(l=>textW(l)));
      const X=clamp(Math.round(ax-lw/2),2,W-lw-2);lines.forEach((l,i)=>drawText(c,l,X+Math.round((lw-textW(l))/2),Math.max(1,ay-(lines.length-i)*10),w==='p'?'#efef00':'#5ff7f7',FONT,{outline:UI.ink}));}
    ro.innerHTML=`distance <b>${dist()}</b> tiles (Chebyshev) · ${dist()<=3?'in range':'out of range'} · focus <b>${focus?'yes':'no'}</b>`+(focus?` · idle ${(idle*10).toFixed(0)} of 120 s`:'')+(pending?` · reply in ${Math.max(0,pending.at-t).toFixed(1)} s`:'')+`<br>${note}`;}};});

// ======================================================================
// A4 text printers: Emerald 9/5/2, Crystal 5/3/1 frames per glyph, ALttP
// ======================================================================
reg('printers',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=132,cc=ctl(root),ro=$('[data-ro]',root);
  const LINE='The berry fields are ripe at last. Take a few for the road, and say hi to Gran!';
  const G={em:[['Slow','9 frames',9],['Mid','5 frames',5,'default'],['Fast','2 frames',2]],cr:[['Slow','5 frames',5],['Mid','3 frames',3],['Fast','1 frame',1]],
    lt:[['Speed 0','1 frame',0,'whole line'],['Speed 2','2 frames',2,'made up'],['Speed 6','6 frames',6,'made up']]};
  const L=layout(LINE,186,FONT);let frames=0,acc=0,lanes=[],held=false,fresh=false,done=0;
  const reset=()=>{frames=0;acc=0;done=0;lanes=G[cc.segv('g')].map(()=>({n:0,cd:0,doneAt:-1}));};
  cc.seg('g',reset);cc.btn('again',reset);reset();
  cv.addEventListener('pointerdown',e=>{held=true;fresh=true;if(cc.v('snd'))AUD.enable();});addEventListener('pointerup',()=>{held=false;});cv.addEventListener('pointerleave',()=>{held=false;});
  cc.on('snd',()=>{if(cc.v('snd'))AUD.enable();});
  return {tick(dt){const g=cc.segv('g'),def=G[g];acc+=dt*60;let steps=Math.floor(acc);acc-=steps;steps=Math.min(steps,4);
    for(let s=0;s<steps;s++){frames++;def.forEach((d,i)=>{const ln=lanes[i];if(ln.n>=L.g.length){if(ln.doneAt<0)ln.doneAt=frames;return;}
        const per=held&&fresh&&g!=='lt'?1:d[2];
        if(per===0){ln.n=L.g.length;return;}
        if(ln.cd<=0){ln.n++;ln.cd=per;if(cc.v('snd')&&i===1){const ch=L.g[ln.n-1].ch;if(ch!==' ')AUD.blip(g==='lt'?880:660,25,.03);}}ln.cd--;});}
    if(lanes.every(l=>l.doneAt>=0)&&frames-Math.max(...lanes.map(l=>l.doneAt))>120)reset();
    c.fillStyle='#2a1f17';c.fillRect(0,0,W,H);
    drawText(c,`FRAME ${frames}`,4,3,UI.gold,FONT_S);drawText(c,held&&g!=='lt'?'HELD: 1 FRAME PER GLYPH':'60 FPS',W-4,3,held?UI.gold3:'#b4a48a',FONT_S,{align:'right'});
    def.forEach((d,i)=>{const y=12+i*40,ln=lanes[i];frame(c,2,y,W-4,38,'box');drawText(c,d[0].toUpperCase(),7,y+5,UI.wood3,FONT_S);drawText(c,d[1].toUpperCase(),7,y+12,UI.wood,FONT_S);if(d[3])drawText(c,d[3].toUpperCase(),7,y+19,UI.gold2,FONT_S);
      drawLayout(c,L,56,y+7,{n:ln.n,col:UI.ink});
      if(ln.n>=L.g.length){const bob=still()?0:[0,1,2,1][Math.floor((frames-ln.doneAt)/9)%4];arrowDown(c,W-14,y+28+bob,UI.wood3);
        drawText(c,`DONE AT ${ln.doneAt}`,7,y+28,UI.key,FONT_S);}});
    const per=def.map(d=>d[2]);
    ro.innerHTML=def.map((d,i)=>`${d[0]}${d[3]==='default'?' (default)':''}: <b>${per[i]?(60/per[i]).toFixed(per[i]===9?1:0)+' glyphs/s':'instant'}</b>`+(lanes[i].doneAt>=0?` (done at frame ${lanes[i].doneAt})`:'')).join(' · ')+`<br>${L.g.length} glyphs · cost: a 192-glyph box measured 0.38 ms per frame on the M4 GPU, the same as an empty frame (§6d)`;}};});

// ======================================================================
// B1 tile-pinned overhead text: max(3 s, 60 ms x chars), x2 yell, merge
// by tile + name + mode into blocks of 11, wrap 137 px (half of 275)
// ======================================================================
reg('tilepinned',root=>{const cv=$('canvas',root),c=C2(cv),W=240,H=176,TS=16,cc=ctl(root),ro=$('[data-ro]',root),r=mkRng(5);
  const floor=mkCanvas(W,H),f=floor.getContext('2d');f.fillStyle=UI.grass;f.fillRect(0,0,W,H);for(let i=0;i<900;i++){f.fillStyle=r()<.5?UI.grass2:UI.grass3;f.fillRect((r()*W)|0,(r()*H)|0,1,1);}
  for(let ty=6;ty<10;ty++)for(let tx=0;tx<15;tx++){const x=tx*TS,y=ty*TS;f.fillStyle=((tx+ty)&1)?UI.cob:'#a99b84';f.fillRect(x,y,TS,TS);f.fillStyle='rgba(43,29,22,.2)';f.fillRect(x,y+TS-1,TS,1);f.fillRect(x+TS-1,y,1,TS);}
  [[8,'#b4533a','#8c3d2b'],[88,'#5a7ab0','#40598a'],[168,'#6f8a3a','#556c2c']].forEach(([hx,r1,r2])=>{f.fillStyle='rgba(43,29,22,.35)';f.fillRect(hx+3,58,64,3);f.fillStyle=UI.wall;f.fillRect(hx,30,64,28);f.fillStyle=UI.wall2;for(let y=34;y<58;y+=4)f.fillRect(hx,y,64,1);
    for(let j=0;j<22;j++){f.fillStyle=j%3===0?r2:r1;f.fillRect(hx-2+Math.max(0,3-j),8+j,68-2*Math.max(0,3-j),1);}f.fillStyle=UI.ink;f.fillRect(hx-2,29,68,1);f.fillRect(hx+27,43,11,15);f.fillStyle=UI.wood;f.fillRect(hx+28,44,9,14);f.fillStyle=UI.gold;f.fillRect(hx+35,51,1,1);
    for(const wx of [hx+7,hx+48]){f.fillStyle=UI.ink;f.fillRect(wx-1,37,10,9);f.fillStyle='#ffd884';f.fillRect(wx,38,8,7);f.fillStyle=UI.ink;f.fillRect(wx+4,38,1,7);f.fillRect(wx,41,8,1);}});
  for(let x=0;x<W;x+=6){f.fillStyle=UI.ink;f.fillRect(x,154,4,10);f.fillStyle=UI.wood2;f.fillRect(x+1,155,2,8);}f.fillStyle=UI.ink;f.fillRect(0,157,W,2);
  for(let i=0;i<40;i++){const x=(r()*W)|0,y=66+((r()*22)|0);f.fillStyle=['#e0734f','#f2c14e','#f7eedb','#d7a2e8'][i&3];f.fillRect(x,y,2,2);f.fillStyle=UI.grass3;f.fillRect(x,y+2,1,2);}
  const wk={x:20,y:8*TS+12,dir:'right',an:0,vx:14};let t=0,sayT=.4;const blocks=[];
  const COL={say:'#efef00',npc:'#5ff7f7',yell:'#efef00'};
  const life=(n,mode)=>Math.max(3,.06*n)*(mode==='yell'?2:1);
  const emit=()=>{const mode=cc.segv('who'),n=cc.v('ch'),txt=sayLine(n,r),tx=Math.floor(wk.x/TS),ty=Math.floor((wk.y-1)/TS);const L=life(txt.length,mode);
    let b=blocks.find(b=>b.tx===tx&&b.ty===ty&&b.mode===mode);if(!b){b={tx,ty,mode,lines:[]};blocks.push(b);}b.lines.push({txt,life:L,max:L});if(b.lines.length>11)b.lines.shift();};
  cc.btn('say',emit);cc.on('ch',()=>cc.out('ch',cc.v('ch')));cc.seg('who',()=>{});
  return {tick(dt){t+=dt;if(cc.v('walk')){wk.x+=wk.vx*dt;if(wk.x>W-14){wk.vx=-14;}if(wk.x<14){wk.vx=14;}wk.dir=wk.vx>0?'right':'left';wk.an+=dt*7;}
    sayT-=dt;if(sayT<=0){sayT=2.4;emit();}
    for(const b of blocks){for(const l of b.lines)l.life-=dt;b.lines=b.lines.filter(l=>l.life>0);}for(let i=blocks.length-1;i>=0;i--)if(!blocks[i].lines.length)blocks.splice(i,1);
    c.drawImage(floor,0,0);
    for(const b of blocks){c.fillStyle='rgba(242,193,78,.28)';c.fillRect(b.tx*TS,b.ty*TS,TS,TS);}
    drawNPC(c,wk.x,wk.y,cc.segv('who')==='npc'?'shop':'player',wk.dir,cc.v('walk')?(wk.an|0)&1:0);
    for(const b of blocks){const rows=[];for(const l of b.lines)for(const w of wrap(l.txt,137,FONT))rows.push(w);const bw=Math.max(...rows.map(x=>textW(x)));const bh=rows.length*FONT.lh;
      let x=b.tx*TS+8-bw/2+5,y=b.ty*TS-4-bh;x=clamp(Math.round(x),2,W-bw-2);y=clamp(Math.round(y),2,H-bh-2);
      rows.forEach((row,i)=>drawText(c,row,x+Math.round((bw-textW(row))/2),y+i*FONT.lh,COL[b.mode],FONT,{outline:UI.ink}));
      const l0=b.lines[b.lines.length-1];c.fillStyle=UI.ink;c.fillRect(b.tx*TS+2,b.ty*TS+TS-3,TS-4,2);c.fillStyle=UI.gold;c.fillRect(b.tx*TS+2,b.ty*TS+TS-3,Math.max(1,Math.round((TS-4)*l0.life/l0.max)),2);}
    const n=cc.v('ch'),mode=cc.segv('who'),L=life(n,mode);
    ro.innerHTML=`lifetime = max(60 ms × ${n} = ${(n*.06).toFixed(2)} s, 3 s)${mode==='yell'?' × 2 for a yell':''} = <b>${L.toFixed(1)} s</b> · blocks on screen ${blocks.length} · lines ${blocks.reduce((a,b)=>a+b.lines.length,0)}`+
      `<br>Gold tiles hold text; the bar under each shows the newest line's time left. Cost: a redrawn glyph about 1.1 µs on the M4, a cached block almost nothing (§6d).`;}};});

// ======================================================================
// B2 greedy push-up (RuneScape 2006): test against earlier lines, 2 px margin
// ======================================================================
reg('pushup',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=128,cc=ctl(root),ro=$('[data-ro]',root),r=mkRng(9),m=meter(.1);
  const floor=mkCanvas(W,H),f=floor.getContext('2d');for(let y=0;y<H;y++)for(let x=0;x<W;x+=1){const b=((x+((y>>2)&1)*3)%4===0)||y%4===0;f.fillStyle=b?UI.cob3:hash2(x>>2,y>>2)<.3?UI.cob2:UI.cob;f.fillRect(x,y,1,1);}
  let t=0,sp=[],tests=0,hud=0;const SAY=['Selling lobsters','Buying feathers 4 each','Hi!','Follow me','Wave 2 gz','Bank?','Anyone know the way north?','Nice cape','lol','Trade?','Need a team','Ok'];
  const build=()=>{const n=cc.v('n');cc.out('n',n);sp=[];for(let i=0;i<n;i++){sp.push({x:Math.round(W/2+(i-(n-1)/2)*17),y:H-8,look:LOOKS.list[(i*3+1)%10],lines:[],next:r()*2});}};
  cc.on('n',build);build();let seq=0;
  return {tick(dt){t+=dt;for(const s of sp){s.next-=dt;if(s.next<0){s.next=1.5+r()*3.5;const txt=SAY[Math.floor(r()*SAY.length)];s.lines=[{txt,life:Math.max(3,.06*txt.length)+1,id:seq++}];}for(const l of s.lines)l.life-=dt;s.lines=s.lines.filter(l=>l.life>0);}
    c.drawImage(floor,0,0);for(const s of sp)drawNPC(c,s.x,s.y,s.look,'down',0);
    m.t0();const items=[];for(const s of sp)for(const l of s.lines){const w=textW(l.txt);items.push({x:clamp(s.x-Math.round(w/2),1,W-w-1),y:s.y-17-FONT.lh,w,h:FONT.lh,txt:l.txt,id:l.id});}
    if(cc.v('sort'))items.sort((a,b)=>a.id-b.id);else items.sort((a,b)=>b.id-a.id);
    tests=0;if(cc.v('push')){for(let k=0;k<items.length;k++){const it=items[k];let moved=true,g=0;while(moved&&g++<60){moved=false;for(let j=0;j<k;j++){const q=items[j];tests++;
          if(it.x<q.x+q.w+2&&it.x+it.w+2>q.x&&it.y<q.y+q.h+2&&it.y+it.h+2>q.y){it.y=q.y-it.h-2;moved=true;}}}}}
    const ms=m.t1();
    for(const it of items)drawText(c,it.txt,it.x,it.y,'#ffff00',FONT,{shadow:'#000000'});
    if(++hud%6===0)ro.innerHTML=`${items.length} lines · <b>${tests}</b> rectangle tests this frame · layout ${(m.v*1000).toFixed(1)} µs on this device · ${cc.v('push')?'pushed up':'overlapping'} · ${cc.v('sort')?'oldest first, old lines keep their slots':'newest first, every new line shoves the old ones'}`;}};});

// ======================================================================
// B3 upward stream (Habitat, Habbo line mode): spawn at speakerX - w/2,
// all bubbles up 15 px per tick of 3/6/12 s, removed above -2 heights
// ======================================================================
reg('stream',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=160,cc=ctl(root),ro=$('[data-ro]',root),r=mkRng(3);
  const room=mkCanvas(W,H),f=room.getContext('2d');for(let y=0;y<H;y++){f.fillStyle=(y>>3)&1?'#8a5a34':'#7a4e2c';f.fillRect(0,y,W,1);if(y%8===7){f.fillStyle='#5a3820';f.fillRect(0,y,W,1);}}
  for(let y=0;y<H;y+=8)for(let x=((y>>3)*37)%48;x<W;x+=48){f.fillStyle='#5a3820';f.fillRect(x,y,1,8);}
  f.fillStyle='#4c2c1a';f.fillRect(0,0,W,30);f.fillStyle='#3a2014';for(let x=0;x<W;x+=12)f.fillRect(x,0,1,30);f.fillStyle=UI.ink;f.fillRect(0,30,W,2);
  for(const sx of [20,150]){f.fillStyle=UI.ink;f.fillRect(sx,12,72,3);f.fillStyle=UI.wood2;f.fillRect(sx,12,72,2);for(let k=0;k<8;k++){const c=['#9fd3c7','#e0734f','#f2c14e','#82b04c'][k&3];f.fillStyle=UI.ink;f.fillRect(sx+4+k*8,4,6,8);f.fillStyle=c;f.fillRect(sx+5+k*8,5,4,7);}}
  f.fillStyle='#ffd884';f.fillRect(122,6,10,14);f.fillStyle=UI.ink;f.fillRect(121,5,12,1);f.fillRect(121,20,12,1);f.fillRect(126,6,1,14);f.fillRect(122,12,10,1);
  f.fillStyle='#6a2a22';f.fillRect(40,112,176,44);f.fillStyle='#8c3d2b';f.fillRect(43,115,170,38);f.fillStyle='#c98a26';for(let x=46;x<210;x+=8)f.fillRect(x,117,4,1),f.fillRect(x+2,150,4,1);
  f.fillStyle=UI.ink;f.fillRect(56,120,144,22);f.fillStyle=UI.wood2;f.fillRect(57,121,142,19);f.fillStyle='#b07a48';f.fillRect(57,121,142,2);
  for(const [x,y] of [[80,126],[120,128],[170,125]]){f.fillStyle=UI.ink;f.fillRect(x,y,6,7);f.fillStyle='#e8c070';f.fillRect(x+1,y+1,4,5);f.fillStyle=UI.white;f.fillRect(x+1,y+1,4,1);}
  const guests=[{x:44,y:148,look:'smith'},{x:86,y:118,look:'girl'},{x:128,y:118,look:'bard'},{x:172,y:118,look:'boy'},{x:214,y:148,look:'witch'}];
  const TALK=['Another round!','Did you hear the bard?','My feet hurt','Ha ha!','Who took my seat?','To the north road!','Cheers','The stew is good'];
  let bubs=[],t=0,tick=0,chatT=1,hud=0;const BASE=82;
  const talk=()=>{const g=guests[Math.floor(r()*guests.length)],txt=TALK[Math.floor(r()*TALK.length)],im=bubImg(txt,FONT_S,110);
    for(const b of bubs){b.ty-=15;b.tail=false;}bubs.push({g,im,x:clamp(g.x-Math.round(im.w/2),2,W-im.w-2),y:BASE,ty:BASE,tail:true});};
  cc.btn('talk',talk);cc.seg('iv',()=>{tick=0;});
  return {tick(dt){t+=dt;const iv=+cc.segv('iv');tick+=dt;if(tick>=iv){tick-=iv;for(const b of bubs){b.ty-=15;b.tail=false;}}
    if(cc.v('auto')){chatT-=dt;if(chatT<0){chatT=1.8+r()*3.2;talk();}}
    for(const b of bubs){if(b.y>b.ty)b.y=Math.max(b.ty,b.y-dt*90);}bubs=bubs.filter(b=>b.y+b.im.h> -2*b.im.h+b.im.h&&b.y>-2*b.im.h);
    c.drawImage(room,0,0);for(const g of guests)drawNPC(c,g.x,g.y,g.look,'down',0);
    for(const b of bubs){const y=Math.round(b.y);c.drawImage(b.im.cv,b.x,y);if(b.tail)bubTail(c,clamp(b.g.x,b.x+3,b.x+b.im.w-4),y+b.im.h-1,1);}
    if(++hud%8===0)ro.innerHTML=`next tick in <b>${(iv-tick).toFixed(1)} s</b> · every bubble rises 15 px per tick · ${bubs.length} bubbles · a new line shifts the others up at once (line mode)`;}};});

// ======================================================================
// B4 clutter: none / stack / priority + caps (3 per speaker, 12 visible) /
// overflow to log; cached bubble bodies against redrawing every glyph
// ======================================================================
reg('clutter',root=>{const cv=$('canvas',root),c=C2(cv),W=320,H=180,cc=ctl(root),ro=$('[data-ro]',root),logEl=$('.clog',root),r=mkRng(21),m=meter(.06);
  const T=mkTown(W,H,4);const elder={x:T.board.x+18,y:T.board.y+5,look:'elder'},me={x:T.board.x+18,y:T.board.y+24,look:'player'};
  const CONV=[['e','Bring me 3 herbs, dear.'],['m','Where do they grow?'],['e','In the planters by the fountain.'],['m','On my way!']];let ci=0,ct=0,conv=[];
  let crowd=[],t=0,logged=0,hud=0;const seenLog=new Set();
  const sync=()=>{const n=cc.v('n');cc.out('n',n);while(crowd.length<n){crowd.push({look:LOOKS.list[1+(crowd.length%9)],x:30+r()*260,y:100+r()*72,tx:0,ty:0,an:0,dir:'down',bub:[]});const p=crowd[crowd.length-1];p.tx=p.x;p.ty=p.y;}crowd.length=n;};
  cc.on('n',sync);sync();cc.seg('st',()=>{logEl.innerHTML='';logged=0;seenLog.clear();});
  return {tick(dt){t+=dt;const st=cc.segv('st'),cache=cc.v('cache');
    ct-=dt;if(ct<=0){ct=2.6;const [w,s]=CONV[ci];ci=(ci+1)%CONV.length;conv.push({w,s,life:Math.max(3,.06*s.length)+1,age:0,id:t});}
    for(const b of conv){b.life-=dt;b.age+=dt;}conv=conv.filter(b=>b.life>0);
    for(const p of crowd){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);if(d<1){p.tx=clamp(p.x+(r()-.5)*70,24,296);p.ty=clamp(p.y+(r()-.5)*40,100,174);p.mv=false;}else{const s=Math.min(d,10*dt);p.x+=dx/d*s;p.y+=dy/d*s;p.an+=dt*6;p.mv=true;p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}
      if(r()<dt/20){const s=CROWD[Math.floor(r()*CROWD.length)];p.bub.push({s,life:Math.max(3,.06*s.length),age:0,id:t+r()});}
      for(const b of p.bub){b.life-=dt;b.age+=dt;}p.bub=p.bub.filter(b=>b.life>0);}
    c.drawImage(T.cv,0,0);const ppl=[elder,me,...crowd].sort((a,b)=>a.y-b.y);for(const p of ppl)drawNPC(c,p.x,p.y,p.look,p===elder?'down':p===me?'up':p.dir,p.mv?(p.an|0)&1:0);
    m.t0();
    // collect: own conversation first (priority 0), crowd after (priority 2)
    const items=[];for(const b of conv){const o=b.w==='e'?elder:me;items.push({o,s:b.s,pr:0,age:b.age,id:b.id});}
    let alive=conv.length;for(const p of crowd){alive+=p.bub.length;const list=(st==='prio'||st==='log')?p.bub.slice(-3):p.bub;
      if(st==='prio'||st==='log'){for(const b of p.bub.slice(0,-3))items.push({o:p,s:b.s,pr:9,age:b.age,id:b.id,cap:true});}
      for(const b of list)items.push({o:p,s:b.s,pr:2,age:b.age,id:b.id});}
    for(const it of items){const im=bubImg(it.s,FONT_S,84);it.im=im;it.w=im.w;it.h=im.h;it.x=clamp(Math.round(it.o.x-im.w/2),4,W-im.w-4);it.y=Math.round(it.o.y-19-im.h);}
    let shown=items,hidden=[];
    if(st==='prio'||st==='log'){items.sort((a,b)=>a.pr-b.pr||b.age-a.age);shown=items.filter(i=>!i.cap).slice(0,12);hidden=items.filter(i=>!shown.includes(i));}
    else if(st==='stack')items.sort((a,b)=>b.age-a.age);
    if(st!=='none'){const placed=[];for(const it of shown){let moved=true,g=0;while(moved&&g++<40){moved=false;for(const q of placed){if(it.x<q.x+q.w+2&&it.x+it.w+2>q.x&&it.y<q.y+q.h+2&&it.y+it.h+2>q.y){it.y=q.y-it.h-2;moved=true;}}}
        if(st!=='stack')it.y=Math.max(4,it.y);placed.push(it);}}
    if(st==='log'){for(const h of hidden){if(!seenLog.has(h.id)){seenLog.add(h.id);logged++;const li=document.createElement('li');li.textContent=h.s;logEl.prepend(li);while(logEl.children.length>5)logEl.lastChild.remove();}}}
    for(let i=shown.length-1;i>=0;i--){const it=shown[i];const own=it.pr===0;
      if(cache)c.drawImage(it.im.cv,it.x,it.y);else bubLive(c,it.s,it.x,it.y,FONT_S,84);
      if(own){c.fillStyle=UI.gold;c.fillRect(it.x+1,it.y,it.w-2,1);}
      if(it.y+it.h<it.o.y-14)bubTail(c,clamp(it.o.x,it.x+3,it.x+it.w-4),it.y+it.h-1,1);}
    const ms=m.t1();
    logEl.hidden=st!=='log';
    if(++hud%6===0){setHud(root,`bubbles ${fms(m.v)} ms`);
      ro.innerHTML=`alive <b>${alive}</b> · shown <b>${shown.length}</b> · hidden <b>${hidden.length}</b> · logged <b>${logged}</b> · layout and drawing <b>${fms(m.v)} ms</b> on this device, ${cache?'cached bodies':'every glyph redrawn'}`+
        `<br>Benchmark (§6d, 6x throttled CPU): 50 bubbles 10.51 ms redrawn, 1.13 ms cached; 200 bubbles 44.98 ms redrawn, 1.78 ms cached.`;}}};});

// ======================================================================
// B5 offscreen: clamp 4 px inside, tail slides to the speaker, edge chip
// ======================================================================
reg('offscreen',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=144,cc=ctl(root),ro=$('[data-ro]',root);
  const T=mkTown(W,H,9);const npc={x:60,y:90,an:0,dir:'down'};let t=0,drag=false,state='';const TXT='Over here, traveller! The herbs are this way.';const L=layout(TXT,96,FONT);
  pointer(cv,(p,k)=>{if(k==='down'&&Math.hypot(p[0]-npc.x,p[1]-(npc.y-8))<16){drag=true;cc.el('auto').checked=false;}
    if(k==='drag'&&drag){npc.x=clamp(p[0],-120,W+120);npc.y=clamp(p[1]+8,-60,H+80);npc.dir='down';}if(k==='up')drag=false;});
  return {tick(dt){t+=dt;if(cc.v('auto')&&!drag){const a=t*.32;const nx=W/2+Math.cos(a)*(W*.62),ny=H*.62+Math.sin(a*2)*H*.3;npc.dir=Math.abs(nx-npc.x)>Math.abs(ny-npc.y)?(nx>npc.x?'right':'left'):(ny>npc.y?'down':'up');npc.x=nx;npc.y=ny;npc.an+=dt*6;}
    c.drawImage(T.cv,0,0);drawNPC(c,npc.x,npc.y,'elder',npc.dir,cc.v('auto')?(npc.an|0)&1:0);
    const w=L.w+9,h=L.lines*FONT.lh+5,off=npc.x<0||npc.x>W||npc.y-8<0||npc.y-15>H;let bx=Math.round(npc.x-w/2),by=Math.round(npc.y-20-h),dir=1;
    if(off&&cc.v('chip')){// chip on the edge where the line from the centre to the speaker leaves the view
      const cx=W/2,cy=H/2,dx=npc.x-cx,dy=(npc.y-8)-cy,m=12,sx=(W/2-m)/Math.abs(dx||1e-6),sy=(H/2-m)/Math.abs(dy||1e-6),k=Math.min(sx,sy),ex=Math.round(cx+dx*k),ey=Math.round(cy+dy*k);
      frame(c,ex-8,ey-8,16,16,'chip');const a=Math.atan2(dy,dx),ax=Math.round(Math.cos(a)*3),ay=Math.round(Math.sin(a)*3);
      for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const d=(i*Math.cos(a)+j*Math.sin(a)),pp=Math.abs(-i*Math.sin(a)+j*Math.cos(a));if(d>-2&&d<=2&&pp<=(2-d)*.75+.2){c.fillStyle=UI.key;c.fillRect(ex+i,ey+j,1,1);}}
      const lab='MAREN: OVER HERE';const lw=textW(lab,FONT_S)+6,lx=clamp(ex+(dx>0?-lw-10:10),2,W-lw-2),ly=clamp(ey-5,2,H-12);frame(c,lx,ly,lw,11,'ink');drawText(c,lab,lx+3,ly+3,UI.paper,FONT_S);
      state=`offscreen: edge chip on the ${Math.abs(dx)*(H/2)>Math.abs(dy)*(W/2)?(dx>0?'right':'left'):(dy>0?'bottom':'top')} edge, bubble hidden`;}
    else{let clamped=false;if(cc.v('clamp')){if(by<4){by=Math.round(npc.y+4);dir=-1;}const nbx=clamp(bx,4,W-4-w),nby=clamp(by,4,H-4-h);clamped=nbx!==bx||nby!==by;bx=nbx;by=nby;}
      const tx=cc.v('tail')?clamp(npc.x,bx+3,bx+w-4):bx+w/2;bubble(c,bx,by,w,h,tx,{dir});drawLayout(c,L,bx+4,by+2,{t,still:still()});
      state=off?'offscreen with no chip: the bubble floats and points at nothing':clamped?`clamped: body held 4 px inside${cc.v('tail')?', tail still on the speaker':', tail stuck in the middle'}${dir<0?', flipped below near the top':''}`:'on screen: bubble above the speaker';}
    ro.innerHTML=`speaker at (${Math.round(npc.x)}, ${Math.round(npc.y)}) in a ${W}×${H} view · <b>${state}</b>`;}};});

// shared: a dialog box with a framed 32x32 bust, a name plate and typed text
function dlgBox(c,W,H,look,name,L,n,t,o={}){frame(c,1,1,W-2,H-2,'box');frame(c,7,(H-36)>>1,36,36,'ink');bust(c,9,((H-36)>>1)+2,look,{mouth:o.mouth,blink:o.blink,expr:o.expr});
  if(name){drawText(c,name.toUpperCase(),48,6,UI.wood,FONT_S);}drawLayout(c,L,48,name?14:8,{n,t,still:still(),ul:true});
  if(o.arrow){const bob=still()?0:[0,1,2,1][Math.floor(t*60/9)%4];arrowDown(c,W-14,H-11+bob,UI.wood3);}}
const blipper=()=>{let k=0;return (g,pitch=520)=>{if(g.ch===' '||g.ch==='\n')return;if((k++)&1)return;AUD.blip(pitch*(1+(Math.random()-.5)*.08),30,.035);};};

// ======================================================================
// C1/C2 typewriter: presets, punctuation pauses, hold to fast-forward
// ======================================================================
reg('typewriter',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=72,cc=ctl(root),ro=$('[data-ro]',root),bl=blipper();
  const LINES=['Well, well. You found the old mill? Then you have met Hilda, my sister.','She talks a lot, doesn\'t she? Sit down, have some tea, and tell me everything.','Hmm. Wolves on the north road, you say... That is bad news, friend.'];
  const Ls=LINES.map(s=>layout(s,196,FONT));const ty=mkTyper();let li=0,t=0,down=-1,fast=false,el=0,blinkT=2;ty.set(Ls[0]);
  const next=()=>{li=(li+1)%Ls.length;ty.set(Ls[li]);el=0;};
  cv.addEventListener('pointerdown',()=>{down=t;if(cc.v('snd'))AUD.enable();});
  const up=()=>{if(down<0)return;if(!fast){if(!ty.done)ty.finish();else next();}fast=false;down=-1;};cv.addEventListener('pointerup',up);cv.addEventListener('pointerleave',()=>{fast=false;down=-1;});
  cc.on('snd',()=>{if(cc.v('snd'))AUD.enable();});cc.seg('sp',()=>{ty.set(Ls[li]);el=0;});
  return {tick(dt){t+=dt;if(down>=0&&t-down>.2)fast=true;const ms=+cc.segv('sp'),cps=fast?60:ms?1000/ms:Infinity,punct=cc.v('pause')&&!fast;
    const was=ty.done;if(!ty.done)el+=dt;ty.step(dt,cps,punct,g=>{if(cc.v('snd'))bl(g,560);});if(ty.done&&!was&&!fast){}
    blinkT-=dt;if(blinkT<-.1)blinkT=2+Math.random()*2;const g=ty.L.g[Math.max(0,ty.n-1)],mouth=!ty.done&&g&&g.ch!==' '?Math.floor(t*10)&1:0;
    dlgBox(c,W,H,'elder','Maren',ty.L,ty.n,t,{mouth,blink:blinkT<0,arrow:ty.done});
    const base=ms?1000/ms:Infinity,nG=ty.L.g.length,typ=isFinite(base)?nG/base:0,tot=isFinite(base)?ty.total(base,true):0;
    ro.innerHTML=`${fast?'<b>fast-forward: 60 glyphs/s</b>':ms?`${ms} ms per glyph = <b>${(1000/ms).toFixed(0)} glyphs/s</b>`:'<b>instant</b>'}${cc.v('pause')&&ms?` · comma ${(5*ms)} ms, sentence end ${(10*ms)} ms`:''}`+
      `<br>this line: ${nG} glyphs · typing ${typ.toFixed(2)} s · with pauses ${tot.toFixed(2)} s${ty.done?` · took ${el.toFixed(2)} s`:''} · ${ty.done?'click for the next line':'click to complete'}`;}};});

// ======================================================================
// C3 mash test: press advances vs press completes + 200 ms guard
// ======================================================================
reg('guard',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=72,cc=ctl(root),ro=$('[data-ro]',root);
  const P=['Listen well, I will say this only once.','The cave is past the old mill, north of the river.','Take the left tunnel. The right one floods at night.','Bring back the blue lantern, not the red one.','And whatever you do, do not wake the bear.'];
  const Ls=P.map(s=>layout(s,196,FONT));const ty=mkTyper();let pg=0,t=0,doneAt=-1,unread=0,ignored=0,read=0,presses=0,mash=0,mashT=0,end=false;
  const reset=()=>{pg=0;ty.set(Ls[0]);doneAt=-1;unread=0;ignored=0;read=0;presses=0;end=false;};reset();
  const adv=complete=>{if(complete)read++;else unread++;pg++;if(pg>=P.length){end=true;return;}ty.set(Ls[pg]);doneAt=-1;};
  const press=()=>{if(end)return;presses++;const m=+cc.segv('m');
    if(m===0){adv(ty.done);return;}
    if(!ty.done){ty.finish();doneAt=t;return;}if(t-doneAt<.2){ignored++;return;}adv(true);};
  cc.btn('press',press);cc.btn('reset',reset);cc.btn('mash',()=>{mash=3;mashT=0;});cc.seg('m',reset);
  cv.addEventListener('pointerdown',press);
  return {tick(dt){t+=dt;if(mash>0){mash-=dt;mashT-=dt;if(mashT<=0){mashT+=1/8;press();}}
    const was=ty.done;ty.step(dt,20,true);if(ty.done&&!was&&doneAt<0)doneAt=t;
    if(end){frame(c,1,1,W-2,H-2,'box');drawText(c,'END OF THE BRIEFING',W/2,14,UI.wood,FONT_S,{align:'center'});
      drawText(c,`Read ${read} of ${P.length} pages`,W/2,28,UI.ink,FONT,{align:'center'});drawText(c,unread?`${unread} skipped before they finished`:'Nothing skipped',W/2,42,unread?UI.key:'#3d7a2a',FONT,{align:'center'});}
    else{const g=ty.L.g[Math.max(0,ty.n-1)];dlgBox(c,W,H,'guard',`Captain Ilsa · page ${pg+1} of ${P.length}`,ty.L,ty.n,t,{mouth:!ty.done&&g&&g.ch!==' '?Math.floor(t*10)&1:0,arrow:ty.done&&t-doneAt>=.2});
      if(+cc.segv('m')===1&&ty.done&&t-doneAt<.2){c.fillStyle=UI.key;c.fillRect(48,H-6,Math.round(196*(1-(t-doneAt)/.2)),2);}}
    ro.innerHTML=`presses <b>${presses}</b> · pages read <b>${read}</b> · <b>skipped unread ${unread}</b> · presses ignored by the guard ${ignored}${mash>0?' · mashing…':''}`;}};});

// ======================================================================
// C4 inline tags: [c=key] [wave] [shake] [p=N] [spd=X], never glyphs
// ======================================================================
reg('tags',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=64,cc=ctl(root),ro=$('[data-ro]',root),src=$('[data-src]',root);
  const ty=mkTyper();let L=null,t=0,wait=0;
  const parse=()=>{L=layout(src.value.slice(0,400),236,FONT);ty.set(L);wait=0;};src.addEventListener('input',parse);cc.btn('again',parse);parse();
  return {tick(dt){t+=dt;ty.step(dt,20,true);if(ty.done){wait+=dt;if(wait>3)parse();}
    frame(c,1,1,W-2,H-2,'box');drawLayout(c,L,10,8,{n:ty.n,t,still:cc.v('still')||still(),ul:cc.v('ul')});
    if(ty.done){const bob=still()?0:[0,1,2,1][Math.floor(t*60/9)%4];arrowDown(c,W-14,H-11+bob,UI.wood3);}
    const raw=src.value.length,gl=L.g.length,pause=L.g.reduce((a,g)=>a+(g.pause||0),0),fx=L.g.filter(g=>g.fx).length,col=L.g.filter(g=>g.col).length;
    ro.innerHTML=`<b>${raw}</b> characters typed in the box · <b>${gl}</b> glyphs on screen · tags removed ${raw-gl} characters · coloured ${col} · moving ${fx} · scripted pauses ${pause} frames · types in ${ty.total(20,true).toFixed(2)} s at Normal`;}};});

// ======================================================================
// C5 9-slice: stretched vs tiled edges, snap to the period, 8-frame open
// ======================================================================
reg('ninepatch',root=>{const cv=$('canvas',root),c=C2(cv),W=256,H=112,cc=ctl(root),ro=$('[data-ro]',root);
  // source art: 18x18, corners 6x6, edge period 6 (a twisted rope inside a wooden rim)
  const SRC=mkCanvas(18,18),s=SRC.getContext('2d');const P={k:UI.ink,w:UI.wood,h:UI.wood2,g:UI.gold,G:UI.gold3,p:UI.paper,d:UI.gold2};
  const EDGE=['kkkkkk','hhhhhh','GddGGd','dGGddG','wwwwww','kkkkkk'],COR=['.kkkkk','khhhhh','khGGdd','khGgdG','khddww','khdGwk'];
  for(let y=0;y<18;y++)for(let x=0;x<18;x++){let ch='p';const ex=x<6?0:x<12?1:2,ey=y<6?0:y<12?1:2;
    if(ex!==1&&ey!==1){let cx=ex===0?x:17-x,cy=ey===0?y:17-y;ch=COR[cy][cx];}else if(ey!==1){const yy=ey===0?y:17-y;ch=EDGE[yy][x%6];}else if(ex!==1){const xx=ex===0?x:17-x;ch=EDGE[xx][y%6];}
    if(ch!=='.'){s.fillStyle=P[ch];s.fillRect(x,y,1,1);}}
  const box=(dc,x,y,w,h,mode)=>{const e=6;dc.drawImage(SRC,0,0,e,e,x,y,e,e);dc.drawImage(SRC,12,0,e,e,x+w-e,y,e,e);dc.drawImage(SRC,0,12,e,e,x,y+h-e,e,e);dc.drawImage(SRC,12,12,e,e,x+w-e,y+h-e,e,e);
    const iw=w-2*e,ih=h-2*e;dc.fillStyle=UI.paper;dc.fillRect(x+e,y+e,iw,ih);
    if(mode==='stretch'){dc.drawImage(SRC,6,0,e,e,x+e,y,iw,e);dc.drawImage(SRC,6,12,e,e,x+e,y+h-e,iw,e);dc.drawImage(SRC,0,6,e,e,x,y+e,e,ih);dc.drawImage(SRC,12,6,e,e,x+w-e,y+e,e,ih);}
    else{for(let k=0;k<iw;k+=e){const sw=Math.min(e,iw-k);dc.drawImage(SRC,6,0,sw,e,x+e+k,y,sw,e);dc.drawImage(SRC,6,12,sw,e,x+e+k,y+h-e,sw,e);}
      for(let k=0;k<ih;k+=e){const sh=Math.min(e,ih-k);dc.drawImage(SRC,0,6,e,sh,x,y+e+k,e,sh);dc.drawImage(SRC,12,6,e,sh,x+w-e,y+e+k,e,sh);}}};
  const tmp=mkCanvas(128,112),tc=tmp.getContext('2d');tc.imageSmoothingEnabled=false;
  let t=0,openF=99,openAcc=0;const dims=()=>{let w=cc.v('w'),h=cc.v('h');if(cc.v('snap')){w=12+6*Math.round((w-12)/6);h=12+6*Math.round((h-12)/6);}return [w,h];};
  const out=()=>{const [w,h]=dims();cc.out('w',w);cc.out('h',h);};['w','h','snap'].forEach(k=>cc.on(k,out));out();
  cc.btn('open',()=>{openF=0;openAcc=0;});setTimeout(()=>{openF=0;},400);
  pointer(cv,(p,k)=>{if(k==='down'||k==='drag'){const cx=p[0]<128?64:192;cc.el('w').value=clamp(Math.round(Math.abs(p[0]-cx)*2),36,120);cc.el('h').value=clamp(Math.round(Math.abs(p[1]-62)*2),28,96);out();}});
  return {tick(dt){t+=dt;const [w,h]=dims();if(openF<8){openAcc+=dt*60/(cc.v('slow')?8:1);while(openAcc>=1&&openF<8){openAcc-=1;openF++;}}
    c.fillStyle='#2a1f17';c.fillRect(0,0,W,H);c.fillStyle='#3a2b20';c.fillRect(127,0,2,H);
    drawText(c,'STRETCH',64,3,'#e0734f',FONT_S,{align:'center'});drawText(c,'TILE',192,3,'#9fd3c7',FONT_S,{align:'center'});
    const op=openF>=8?255:Math.min(255,(openF+1)*32);const k=op/255;
    ['stretch','tile'].forEach((mode,i)=>{tc.clearRect(0,0,128,112);const x=Math.round((128-w)/2),y=Math.round(62-h/2);box(tc,x,y,w,h,mode);
      if(mode==='tile'&&openF>=8){const bob=still()?0:[0,1,2,1][Math.floor(t*60/9)%4];arrowDown(tc,x+w-14,y+h-14+bob,UI.wood3);}
      if(mode==='stretch'||openF>=8)c.drawImage(tmp,0,0,128,112,i*128,0,128,112);
      else{const vh=Math.max(1,Math.round(h*k));c.drawImage(tmp,x,y,w,h,128+x,Math.round(62-vh/2),w,vh);}});
    const sc=((w-12)/6).toFixed(2);
    ro.innerHTML=`box ${w}×${h} · edge length ${w-12} px = ${sc} periods of 6 px ${Number.isInteger((w-12)/6)?'(whole, so both look the same)':'(not whole: stretching repeats some source pixels and the rope turns uneven; tiling crops the last period)'}`+
      `<br>open: ${openF>=8?'done, 8 frames = 133 ms':`frame <b>${openF+1}</b> of 8, openness ${op} of 255`}${cc.v('slow')?' · slowed 8x':''}`;}};});

// ======================================================================
// C6 choice menu: default cursor on the safe answer, B = No, 5-frame ignore
// ======================================================================
reg('choices',root=>{const cv=$('canvas',root),c=C2(cv),W=192,H=96,cc=ctl(root),ro=$('[data-ro]',root);
  const scene=mkCanvas(W,56),s=scene.getContext('2d');for(let y=0;y<56;y++){s.fillStyle=(y>>3)&1?'#8a5a34':'#7a4e2c';s.fillRect(0,y,W,1);}s.fillStyle=UI.ink;s.fillRect(0,30,120,10);s.fillStyle=UI.wood2;s.fillRect(0,31,119,8);s.fillStyle='#b07a48';s.fillRect(0,31,119,2);
  for(let i=0;i<5;i++){s.fillStyle=UI.ink;s.fillRect(8+i*20,22,9,9);s.fillStyle=['#c8c2b6','#e0734f','#9fd3c7','#f2c14e','#82b04c'][i];s.fillRect(9+i*20,23,7,7);}
  const Q=layout('Sell your old sword for 40 gold?',176,FONT);let open=false,sel=1,fr=0,acc=0,ign=0,res='',mashing=0,mashAcc=0,t=0;
  const ask=()=>{open=true;sel=cc.v('trap')?0:1;fr=0;acc=0;ign=0;res='';};
  const input=k=>{if(!open)return;if(cc.v('ign')&&fr<5){ign++;return;}
    if(k==='up'||k==='down')sel^=1;else if(k==='a'){open=false;res=sel===0?'You sold your sword for 40 gold. Oops.':'You keep your sword.';}else if(k==='b'){open=false;sel=1;res='Cancelled: B returns No (0). You keep your sword.';}};
  ['up','down','a','b'].forEach(k=>cc.btn(k,()=>input(k)));cc.btn('ask',ask);cc.btn('mash',()=>{ask();mashing=30;mashAcc=0;});
  cv.addEventListener('keydown',e=>{const k={ArrowUp:'up',ArrowDown:'down',Enter:'a',' ':'a',Escape:'b',Backspace:'b'}[e.key];if(k){e.preventDefault();input(k);}});
  cv.addEventListener('pointerdown',e=>{const p=cellOf(cv,e);if(open&&p[0]>140&&p[1]>20&&p[1]<54){const ns=p[1]<37?0:1;if(ns===sel)input('a');else{if(!(cc.v('ign')&&fr<5))sel=ns;else ign++;}}else if(!open)ask();});
  setTimeout(ask,300);
  return {tick(dt){t+=dt;acc+=dt*60;while(acc>=1){acc-=1;fr++;if(mashing>0){mashing--;if((mashing&1)===0)input('a');}}
    c.drawImage(scene,0,0);drawNPC(c,40,28,'shop','down',0);drawNPC(c,64,54,'player','up',0);
    frame(c,1,56,W-2,39,'box');drawLayout(c,Q,8,62,{});if(res){const R=layout(res,176,FONT);drawLayout(c,R,8,74,{col:UI.key});}
    if(open){frame(c,146,20,40,32,'box');drawText(c,'Yes',160,26,UI.ink);drawText(c,'No',160,38,UI.ink);const y=sel?39:27;c.fillStyle=UI.key;for(let i=0;i<4;i++)c.fillRect(152+i,y+i,1,7-2*i);
      if(cc.v('ign')&&fr<5){c.fillStyle='rgba(43,29,22,.35)';c.fillRect(149,23,34,26);}}
    ro.innerHTML=`${open?`menu open for <b>${fr}</b> frames · cursor on <b>${sel?'No':'Yes'}</b>${cc.v('ign')&&fr<5?' · ignoring input':''}`:'menu closed · click the canvas or Ask again'} · presses ignored at open <b>${ign}</b>${res?` · result: ${res}`:''}`;}};});

// ======================================================================
// C7 auto-advance curves (Ren'Py, Dialogic, ours) and a log
// ======================================================================
reg('autoadvance',root=>{const svg=$('svg',root),cv=$('canvas',root),c=C2(cv),cc=ctl(root),ro=$('[data-ro]',root),logEl=$('.aalog',root),W=192,H=48;
  const R={r:n=>1.5+.06*n,d:n=>1+.1*n,o:n=>clamp(1.2+.05*n,2,10)},NAME={r:"Ren'Py",d:'Dialogic',o:'Ours'},COL={r:'#f2c14e',d:'#e0734f',o:'#9fd3c7'};
  const L0=36,R0=350,T0=12,B0=170,X=n=>L0+n/160*(R0-L0),Y=s=>B0-s/18*(B0-T0);
  const draw=()=>{const n=cc.v('len');cc.out('len',n);svg.innerHTML='';
    for(let s=0;s<=18;s+=3){svgEl('line',{x1:L0,x2:R0,y1:Y(s),y2:Y(s),class:'gl'},svg);svgText(svg,L0-6,Y(s)+4,s+' s',{'text-anchor':'end','font-size':10});}
    for(let k=0;k<=160;k+=40)svgText(svg,X(k),B0+14,String(k),{'text-anchor':'middle','font-size':10});svgText(svg,R0,B0+27,'characters in the line',{'text-anchor':'end','font-size':10});
    for(const k of ['r','d','o']){const pts=[];for(let i=0;i<=160;i+=2)pts.push([X(i),Y(R[k](i))]);poly(svg,pts,{stroke:COL[k],'stroke-width':k===cc.segv('rule')?2.6:1.6,'stroke-dasharray':k==='o'?'5 3':''});}
    svgEl('line',{x1:X(n),x2:X(n),y1:T0,y2:B0,class:'now'},svg);
    for(const k of ['r','d','o']){const v=R[k](n);if(v<=18){svgEl('circle',{cx:X(n),cy:Y(v),r:3.5,fill:COL[k]},svg);}}
    ro.innerHTML=`${n} characters: Ren'Py <b>${R.r(n).toFixed(2)} s</b> · Dialogic <b>${R.d(n).toFixed(2)} s</b> · ours <b>${R.o(n).toFixed(2)} s</b> (clamped 2 to 10) · the box uses ${NAME[cc.segv('rule')]}`;};
  cc.on('len',draw);cc.seg('rule',draw);draw();
  const LINES=['Morning! The bakery opens late today.','Mira burnt the first batch again, poor thing.','If you want rolls, try the inn by the gate.','Oh, and tell Brom his cat is on my roof.','Ha!','That cat has been up there since spring, and nobody can get it down.'];
  const Ls=LINES.map(s=>layout(s,176,FONT));const ty=mkTyper();let li=0,wait=0,t=0;ty.set(Ls[0]);
  return {tick(dt){t+=dt;ty.step(dt,20,true);const k=cc.segv('rule'),need=R[k](LINES[li].length);
    if(ty.done){wait+=dt;if(wait>=need){const li2=document.createElement('li');li2.innerHTML=`<b>Baker:</b> ${LINES[li]} <span class="mute">(waited ${need.toFixed(1)} s)</span>`;logEl.prepend(li2);while(logEl.children.length>4)logEl.lastChild.remove();li=(li+1)%LINES.length;ty.set(Ls[li]);wait=0;}}
    frame(c,1,1,W-2,H-2,'box');drawLayout(c,ty.L,8,8,{n:ty.n,t});
    if(ty.done){c.fillStyle=UI.paper2;c.fillRect(8,H-7,176,2);c.fillStyle=COL[k];c.fillRect(8,H-7,Math.round(176*Math.min(1,wait/need)),2);}}};});
}
