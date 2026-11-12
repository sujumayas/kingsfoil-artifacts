"use strict";
// ======================================================================
// demos2 (Agent F): pickup interaction (E), ownership and party rules (F),
// netcode and crowds (G), death drops (H). 17 figures.
// Everything lives in one closure so local names never clash with core.js
// or demos1/3. Uses the generic core.js helpers ($, $$, clamp, lerp, ctl,
// setHud, reg, pointer, cellOf, mkRng, drawText, textW, FONT, FONT_S, meter, fms).
// Every canvas is 170 px wide, 16 px tiles, integer blits, no smoothing.
// ======================================================================
(()=>{
// ---------- palette (the sandbox palette) and tiers (report C1) ----------
const P={ink:'#1a1420',dk:'#2b2236',sh:'#433650',s0:'#5d5468',s1:'#80778a',s2:'#a9a1ad',s3:'#d3ccc9',wh:'#f6eedb',
  g0:'#23422e',g1:'#2f6136',g2:'#4a8641',g3:'#7fb04c',g4:'#bcd66c',w0:'#45291f',w1:'#6b402c',w2:'#925c37',w3:'#bb864d',
  r0:'#64283a',r1:'#913641',r2:'#c25143',r3:'#e3845c',a0:'#1e3060',a1:'#2b5694',a2:'#4a8dc4',a3:'#92cfe4',o0:'#9a5a28',o1:'#dd9f3a',o2:'#ffe08a',
  k0:'#b5735a',k1:'#eab08c',k2:'#7a4a3a',sa0:'#c49d64',sa1:'#e2c58c',pk:'#d6698a',vi:'#6d4f9e',vi2:'#9a7ac8',te:'#3a8a86',cr:'#fff3c8',yl:'#f4d35e',
  bg:'#15121b',panel:'#1d1824',panel2:'#2a2334',line:'#3d3448',txt:'#f4efe2',mute:'#a9a2b4',dim:'#6d6578',red:'#e2483a',ok:'#6fdc6a',gold:'#f2c14e'};
const TIER=['#e8e8e8','#4ce04c','#4c9bff','#b45cff','#ff9a1f'],TNAME=['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY'];

// ---------- canvas and pixel helpers -------------------------------------
function cv2(root,i=0){const cv=$$('canvas',root)[i],c=cv.getContext('2d');c.imageSmoothingEnabled=false;return {cv,c,W:cv.width,H:cv.height};}
const R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const PX=(c,x,y,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),1,1);};
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g];};
function T(c,s,x,y,col=P.txt,o={}){return drawText(c,String(s),Math.round(x),Math.round(y),col,FONT,{outline:o.ol,shadow:o.sh,align:o.al});}
function t(c,s,x,y,col=P.txt,o={}){return drawText(c,String(s),Math.round(x),Math.round(y),col,FONT_S,{outline:o.ol,shadow:o.sh,align:o.al});}
const tw=s=>textW(String(s),FONT_S);
function box(c,x,y,w,h,col){R(c,x,y,w,1,col);R(c,x,y+h-1,w,1,col);R(c,x,y,1,h,col);R(c,x+w-1,y,1,h,col);}
function panel(c,x,y,w,h,fill=P.panel){R(c,x+1,y,w-2,h,P.ink);R(c,x,y+1,w,h-2,P.ink);R(c,x+1,y+1,w-2,h-2,P.line);R(c,x+2,y+2,w-4,h-4,fill);}
function bar(c,x,y,w,h,f,col,bg='#2a1f30'){R(c,x-1,y-1,w+2,h+2,P.ink);R(c,x,y,w,h,bg);R(c,x,y,Math.round(w*clamp(f,0,1)),h,col);}
function line(c,x0,y0,x1,y1,col,on=0,off=0){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy,k=0;c.fillStyle=col;
  for(let n=0;n<800;n++){if(!on||(k%(on+off))<on)c.fillRect(x0,y0,1,1);k++;if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}}
function dashBox(c,x,y,w,h,col){for(let i=0;i<w;i+=2){PX(c,x+i,y,col);PX(c,x+i,y+h-1,col);}for(let i=0;i<h;i+=2){PX(c,x,y+i,col);PX(c,x+w-1,y+i,col);}}
// fixed 60 Hz step; returns (dt, step) runner; slow motion divides dt
function fixed(){let acc=0;return (dt,step)=>{acc+=dt;let n=0;while(acc>=1/60&&n<8){acc-=1/60;step(1000/60);n++;}if(n>=8)acc=0;};}
const slowK=(q)=>{const e=q.el('slow');return e&&e.checked?.25:1;};
const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2, easeIn=x=>x*x, easeOut=x=>1-(1-x)*(1-x);
const cheb=(a,b)=>Math.max(Math.abs(a.tx-b.tx),Math.abs(a.ty-b.ty));
const mixHex=(a,b,k)=>{const A=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),B=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('');};

// ---------- sprites: rows of letters -> cached canvas -----------------------
const SC=new Map();
function spr(rows,pal,mir=false,dark=0){const k=rows.join('|')+JSON.stringify(pal)+mir+dark;let s=SC.get(k);if(s)return s;const h=rows.length,w=rows[0].length;const [cv,g]=mk(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=rows[y][mir?w-1-x:x];if(ch==='.'||ch===undefined)continue;const col=ch==='o'?P.ink:pal[ch];if(!col)continue;g.fillStyle=dark&&ch!=='o'?mixHex(col,P.ink,dark):col;g.fillRect(x,y,1,1);}
  SC.set(k,cv);return cv;}
// 8x8 item icons (the sandbox's set)
const IP={y:P.o2,Y:P.o1,d:P.o0,w:P.wh,s:P.s3,S:P.s2,D:P.s1,r:P.r2,R:P.r1,a:P.a2,A:P.a1,b:P.w2,B:P.w1,c:P.cr,k:P.s0,v:P.vi2,V:P.vi,g:P.a3,G:P.te,W:P.cr,O:P.o1,p:P.pk,e:P.k1,E:P.k0};
const ART={
 coin1:["........","...oo...","..oyyo..",".oyYYdo.",".oyYYdo.","..oddo..","...oo...","........"],
 coin3:["...oo...","..oyyo..",".oyYYdo.",".ooddoo.","oyyooyyo","oYdooYdo",".oddodd.","..o..o.."],
 pile:["...oo...","..oyyo..",".oyYyYo.",".oYyYdo.","oyYdYydo","oYdYdYdo","oddddddo",".oooooo."],
 potion:["...oo...","..obbo..","..oSSo..",".orwrro.","orrrrrRo","orrrrrRo",".oRRRRo.","..oooo.."],
 sword:["......oo",".....owo","....owSo",".o.owSo.",".ooySo..","..oyo...",".oboyo..",".oo.oo.."],
 shield:[".oooooo.","oSaaaaSo","oSaYYaSo","oSaYYaSo","oSaaaaSo",".oSaaSo.","..oSSo..","...oo..."],
 helmet:["..oooo..",".osssSo.","osssSSDo","osSSSSDo","oooooooo","oSo..oDo","oSo..oDo",".o....o."],
 ring:["...oo...","..owro..","..orRo..",".oyooyo.","oyo..odo","oyo..odo",".oyddyo.","..oooo.."],
 gem:["........","..oooo..",".owggAo.","oggggaAo",".oggaAo.","..oaAo..","...oo...","........"],
 rune:[".oooooo.","oSSSSSDo","oSSvSSDo","oSvvvSDo","oSSvSSDo","oSvSvSDo","oDDDDDDo",".oooooo."],
 scroll:["oooooooo","oBccccBo",".occcco.",".okkkco.",".occcco.",".okkkco.","oBccccBo","oooooooo"],
 bone:[".oo.....","owwo....","owwwo...",".owSwo..","..owSwo.","...owwwo","....owwo",".....oo."],
 meat:["...oooo.","..orrrRo",".orrerRo",".orrrRRo","..oRRRo.",".owoo...","owo.....","oo......"],
 star:["...oo...","..oyyo..",".oyWWyo.","oyWWWWOo",".oyWWOo.","..oyOo..","...oo...","........"],
 axe:["..oo....",".oSSo...","oSSSbo..","oSSobbo.",".oo.obbo",".....obo","......ob",".......o"],
 boots:[".oooo...",".obbo...",".obbo...",".obbo...",".obbboo.",".obbbbbo",".oBBBBBo",".ooooooo"],
 pack:["..oooo..",".oBooBo.","oooooooo","obbbbbbo","obbyybbo","oBbbbbBo","oBBBBBBo",".oooooo."],
 amulet:["oo....oo",".o....o.",".o....o.","..o..o..","...oo...","..oyyo..","..ogAo..","...oo..."],
 armor:[".oo..oo.","oSSooSSo","oSaaaaSo","oSaaaaSo",".oaYYao.",".oaaaao.",".oSaaSo.","..oooo.."],
 legs:[".oooooo.",".oaaaao.",".oaAAao.",".oaoaao.",".oaoaao.",".oaoaao.",".oSooSo.",".oo..oo."],
 lock:["..ooo...",".oSoSo..",".oo.oo..","oooooooo","oyyyyydo","oyydyydo","oddddddo","oooooooo"],
 key:["........",".ooo....","oyyyoooo","oyoyyyYo","oyyyoyoo",".ooo.o..","........","........"],
 skull:["..oooo..",".owwwwo.","owwwwwwo","owoowoow","owwwwwwo",".owoowo.","..owwo..","...oo..."],
 chest:["........",".oooooo.","obbbbbbo","oBBBBBBo","oooyyooo","obbydbbo","oBBBBBBo","oooooooo"]};
const icon=k=>spr(ART[k],IP);
// ---------- items: core.js itemImg / drawItem / haloImg / drawBeam (Agent R's shared look) ----------
// Kinds core.js lacks (backpack, amulet, armor, legs, lock, key, skull, chest) are baked here the same way:
// 8x8 art with an ink outline in a 12x12 canvas, tier ring around it (C1 shape ladder).
const XIMG=new Map();
function img12(k,tier=0,dim=false){if(ITEM_ART[k])return itemImg(k,tier,dim);const key=k+tier+dim;let cv=XIMG.get(key);if(cv)return cv;const [c0,g]=mk(12,12);cv=c0;const art=ART[k],fill=new Uint8Array(144);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const ch=art[y][x];if(ch==='.'||ch===undefined)continue;let col=ch==='o'?P.ink:IP[ch];if(!col)continue;if(dim&&ch!=='o')col=mixHex(col,'#5d5468',.6);g.fillStyle=col;g.fillRect(x+2,y+2,1,1);fill[(y+2)*12+x+2]=1;}
  const ring=dim?'#80778a':TIER[tier];g.fillStyle=ring;
  if(tier>=2){for(let y=0;y<12;y++)for(let x=0;x<12;x++){if(fill[y*12+x])continue;const n=(i,j)=>i>=0&&j>=0&&i<12&&j<12&&fill[j*12+i];if(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1))g.fillRect(x,y,1,1);}}
  else if(tier===1){for(const [x,y] of [[0,0],[1,0],[0,1],[11,0],[10,0],[11,1],[0,11],[1,11],[0,10],[11,11],[10,11],[11,10]])g.fillRect(x,y,1,1);}
  XIMG.set(key,cv);return cv;}
// draw an item centred on (x, y); o.gy floor y (shadow stays there while it flies), o.glow halo, o.beam legendary beam,
// o.grey not yours, o.time ms (epic sparkle), o.shadow false, o.a alpha
function item(c,k,tier,x,y,o={}){x=Math.round(x);y=Math.round(y);const gy=Math.round(o.gy??y);
  if(o.shadow!==false)drawShadow(c,x,gy+5,8,.55*Math.max(.35,1-(gy-y)/24));
  if(o.glow&&tier>=2&&!o.grey)drawHalo(c,x,y,tier,.6);
  if(o.beam&&tier>=4&&!o.grey)drawBeam(c,x,gy+5,4,1,o.beamA??1,o.beamH??32);
  const ga=c.globalAlpha;if(o.a!=null)c.globalAlpha=ga*o.a;c.drawImage(img12(k,o.grey?0:tier,!!o.grey),x-6,y-6);
  if(tier===3&&!o.grey&&o.time!=null)sparkle(c,x+4,y-5,(o.time||0)/1000);c.globalAlpha=ga;}
function label(c,s,tier,x,y,o){return drawLabel(c,s,tier,x,y+8,o);}

// ---------- people and corpses: core.js units (knight = you, ally = party, rival = PvP enemy, goblin, orc, mage) ----------
// a stranger is an ally tinted grey; a marked looter is tinted yellow
const UMAP={me:['knight'],party:['ally'],party2:['mage'],party3:['ally'],other:['ally','#8a8494',.55],yellow:['ally','#e8c84a',.6],foe:['rival'],foe2:['rival'],gob:['goblin'],elite:['orc']};
function person(c,look,x,y,o={}){const m=UMAP[look]||UMAP.other;return drawUnit(c,m[0],Math.round(x),Math.round(y),{fr:o.fr||0,flip:o.dir==='l',flash:m[1],fa:m[2],a:o.a,shadow:o.shadow,dy:o.dy});}
function corpse(c,look,x,y,o={}){const m=UMAP[look]||UMAP.other,im=corpseImg(m[0]);x=Math.round(x);y=Math.round(y);c.fillStyle='rgba(10,14,12,.4)';c.fillRect(x-Math.round(im.width/2),y-1,im.width,2);
  const ga=c.globalAlpha;if(o.a!=null)c.globalAlpha=ga*o.a;c.drawImage(im,x-Math.round(im.width/2),y-im.height+1);c.globalAlpha=ga;}

// ---------- the field: core.js mkField, plus an optional faint 16 px tile grid; cached per size ----------
const GRC=new Map();
function grass(W,H,seed=1,o={}){const k=W+'x'+H+'_'+seed+JSON.stringify(o);let g=GRC.get(k);if(g)return g;g=mkField(W,H,seed);const c=g.getContext('2d');
  if(o.grid){const ox=o.ox||0,oy=o.oy||0;c.fillStyle='rgba(20,40,24,.3)';for(let x=ox;x<W;x+=16)for(let y=0;y<H;y+=2)c.fillRect(x,y,1,1);for(let y=oy;y<H;y+=16)for(let x=0;x<W;x+=2)c.fillRect(x,y,1,1);}
  GRC.set(k,g);return g;}
function rock(c,x,y){c.fillStyle='rgba(10,14,12,.4)';c.fillRect(x+1,y+11,14,3);R(c,x+2,y+3,12,10,P.ink);R(c,x+1,y+5,14,7,P.ink);R(c,x+3,y+4,10,8,LG.rock2);R(c,x+2,y+6,12,5,LG.rock2);R(c,x+4,y+4,6,3,LG.rock);R(c,x+5,y+4,3,1,P.s3);R(c,x+3,y+10,10,1,P.s0);}

// ---------- audio: core.js AUD and loot sounds, gated per figure by its Sound button ----------
const AU={tone(o={}){AUD.blip(o.f??660,o.dec??90,o.vol??.05,o.type==='noise'?'sawtooth':(o.type||'square'));},
  coin(rate=1){coinSnd(12*Math.log2(rate));},tick(){AUD.blip(1900,25,.025,'triangle');},
  ok2(){landSnd('metal',.035);},thud(){AUD.blip(140,140,.08,'triangle');landSnd('stone',.03);},bad(){failSnd();},sting(t){stingSnd(t);}};
function sndBtn(root){const b=root.querySelector('[data-b="snd"]');let on=false;if(!b)return ()=>false;
  b.addEventListener('click',()=>{if(!on){if(!AUD.enable())return;on=true;}else on=false;b.textContent=on?'Sound on':'Sound off';b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});return ()=>on&&AUD.on;}
const RO=(root)=>$('[data-ro]',root);
const out=(q,k,s)=>q.out(k,s);

// ---------- tile field shared by the pickup figures -------------------------
// tile (tx, ty) -> centre pixel; feet sit 5 px below the centre
function bfs(from,goal,cols,rows,solid){const key=(x,y)=>y*cols+x,prev=new Map(),Q=[[from.tx,from.ty]];prev.set(key(from.tx,from.ty),null);
  while(Q.length){const [x,y]=Q.shift();if(goal(x,y)){const path=[];let k=key(x,y);while(k!==null&&k!==key(from.tx,from.ty)){path.unshift({tx:k%cols,ty:(k/cols)|0});k=prev.get(k);}return path;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows||solid(nx,ny))continue;if(dx&&dy&&(solid(x+dx,y)||solid(x,y+dy)))continue;const k=key(nx,ny);if(prev.has(k))continue;prev.set(k,key(x,y));Q.push([nx,ny]);}}
  return null;}

// ======================================================================
// E1: click from range, walk, retry every 300 ms, 200 ms action cooldown
// ======================================================================
reg('reach',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root),snd=sndBtn(root);
  const OX=5,COLS=10,ROWS=6,FH=96,bg=grass(W,FH,21,{grid:1,ox:OX});
  const ROCKS=new Set(['7,0','8,0','9,0','7,1','9,1','7,2','8,2','9,2','3,3','3,4','3,5']),solid=(x,y)=>ROCKS.has(x+','+y);
  const cx=tx=>OX+tx*16+8,cy=ty=>ty*16+8;
  const ITEMS=[{k:'sword',tier:2,tx:5,ty:4},{k:'potion',tier:0,tx:4,ty:0},{k:'coin3',tier:0,tx:6,ty:2},{k:'gem',tier:3,tx:8,ty:1},{k:'ring',tier:1,tx:9,ty:5}].map(o=>({...o,alive:true,resp:0}));
  const hero={tx:1,ty:3,x:cx(1),y:cy(3)+5,path:[],from:null,st:0,dir:'r',fr:0};const STEP=250,CD=200,RETRY=300;
  let now=0,nextAct=0,queue=[],pend=null,ev=[],fly=[],msg=null,idle=0,bag=0;const cnt={click:0,queued:0,dropped:0,retry:0,pick:0};
  const say=(s,col=P.txt)=>{msg={s,col,t:now};};
  const log=k=>ev.push({t:now,k});
  const pick=it=>{it.alive=false;it.resp=now+2600;fly.push({k:it.k,tier:it.tier,x:cx(it.tx),y:cy(it.ty),t0:now});cnt.pick++;log('pick');pend=null;if(snd())AU.coin(1);};
  const exec=it=>{nextAct=now+CD;log('exec');
    if(!it.alive){say('SORRY, NOT POSSIBLE.',P.mute);log('fail');pend=null;return;}
    if(cheb(hero,it)<=1){pick(it);return;}
    if(pend&&pend.it===it&&hero.path.length){return;}/* already walking there */
    const path=bfs(hero,(x,y)=>!solid(x,y)&&Math.max(Math.abs(x-it.tx),Math.abs(y-it.ty))<=1,COLS,ROWS,solid);
    if(!path){say('THERE IS NO WAY.',P.r3);log('fail');pend=null;if(snd())AU.bad();return;}
    hero.path=path;pend={it,next:now+RETRY};};
  const request=it=>{cnt.click++;log('click');if(snd())AU.tick();
    if(now<nextAct){if(q.v('drop')){cnt.dropped++;log('drop');}else{queue.push(it);cnt.queued++;log('queue');}return;}exec(it);};
  pointer(cv,([x,y],k)=>{if(k!=='down'||y>=FH)return;idle=0;const tx=Math.floor((x-OX)/16),ty=Math.floor(y/16);if(tx<0||tx>=COLS||ty<0||ty>=ROWS)return;
    const it=ITEMS.find(i=>i.alive&&i.tx===tx&&i.ty===ty);if(it){request(it);return;}
    if(solid(tx,ty))return;const p=bfs(hero,(a,b)=>a===tx&&b===ty,COLS,ROWS,solid);if(p){hero.path=p;pend=null;}});
  q.btn('reset',()=>{cnt.click=cnt.queued=cnt.dropped=cnt.retry=cnt.pick=0;ev=[];bag=0;});
  const fx=fixed();
  const step=dt=>{now+=dt;idle+=dt;
    if(queue.length&&now>=nextAct)exec(queue.shift());
    // walk tile to tile
    if(!hero.from&&hero.path.length){const n=hero.path.shift();hero.from={tx:hero.tx,ty:hero.ty};hero.tx=n.tx;hero.ty=n.ty;hero.st=0;const dx=n.tx-hero.from.tx,dy=n.ty-hero.from.ty;hero.dir=dx>0?'r':dx<0?'l':dy<0?'u':'d';}
    if(hero.from){hero.st+=dt;const f=Math.min(1,hero.st/STEP);hero.x=lerp(cx(hero.from.tx),cx(hero.tx),f);hero.y=lerp(cy(hero.from.ty),cy(hero.ty),f)+5;hero.fr=f<.5?1:0;if(f>=1){hero.from=null;hero.fr=0;}}
    if(pend&&now>=pend.next){cnt.retry++;log('retry');if(cheb(hero,pend.it)<=1&&!hero.from){pick(pend.it);}else pend.next+=RETRY;}
    for(const it of ITEMS)if(!it.alive&&now>=it.resp)it.alive=true;
    for(const f of fly)if(now-f.t0>=250&&!f.done){f.done=1;bag++;}
    fly=fly.filter(f=>now-f.t0<420);ev=ev.filter(e=>now-e.t<4000);
    if(idle>5000){idle=0;const far=ITEMS.filter(i=>i.alive&&cheb(hero,i)>2&&i.k!=='gem');if(far.length)request(far[(Math.random()*far.length)|0]);}};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    for(const k of ROCKS){const [x,y]=k.split(',').map(Number);rock(c,OX+x*16,y*16);}
    // reach ring: the 3x3 around the hero
    const rx=Math.round(hero.x)-24,ry=Math.round(hero.y)-5-8-16;dashBox(c,rx,ry,48,48,'rgba(255,240,180,.55)');
    if(pend){const it=pend.it;box(c,OX+it.tx*16,it.ty*16,16,16,P.yl);}
    for(const it of ITEMS)if(it.alive)item(c,it.k,it.tier,cx(it.tx),cy(it.ty),{time:now});
    person(c,'me',hero.x,hero.y,{dir:hero.dir,fr:hero.fr});
    for(const f of fly){const p=Math.min(1,(now-f.t0)/250),e=ease(p);const x=lerp(f.x,hero.x,e),y=lerp(f.y,hero.y-10,e)-Math.sin(p*Math.PI)*8;if(p<1)c.drawImage(icon(f.k),Math.round(x)-4,Math.round(y)-4);else{const a=(now-f.t0-250)/170;t(c,'+1',hero.x,hero.y-24-a*6,P.ok,{ol:P.ink,al:'center'});}}
    if(msg&&now-msg.t<1400)t(c,msg.s,clamp(hero.x,40,W-40),Math.max(1,hero.y-30),msg.col,{ol:P.ink,al:'center'});
    c.drawImage(icon('pack'),3,3);t(c,String(bag),13,5,P.txt,{ol:P.ink});
    // timeline: the last 4 s, clicks on top, the server below
    const ty=FH+2;R(c,0,FH,W,H-FH,P.panel);R(c,0,FH,W,1,P.line);t(c,'CLICK',2,ty+3,P.mute);t(c,'SERVER',2,ty+15,P.mute);const x0=30,sc=(W-x0-3)/4000,X=tt=>Math.round(W-3-(now-tt)*sc);
    R(c,x0,ty+7,W-x0-3,1,'#2f2838');R(c,x0,ty+19,W-x0-3,1,'#2f2838');
    for(const e of ev){const x=X(e.t);if(x<x0)continue;
      if(e.k==='click')R(c,x,ty+3,1,7,P.wh);else if(e.k==='queue'){R(c,x-1,ty+1,3,2,P.yl);}else if(e.k==='drop'){PX(c,x-1,ty+1,P.red);PX(c,x+1,ty+1,P.red);PX(c,x,ty+2,P.red);PX(c,x-1,ty+3,P.red);PX(c,x+1,ty+3,P.red);}
      else if(e.k==='exec'){R(c,x,ty+17,Math.max(1,Math.round(CD*sc)),5,'#8a6a2a');}else if(e.k==='retry')R(c,x,ty+15,1,3,P.s2);else if(e.k==='pick')R(c,x-1,ty+13,3,9,P.ok);else if(e.k==='fail')R(c,x-1,ty+13,3,9,P.red);}
    setHud(root,'');
    ro.innerHTML=`clicks <b>${cnt.click}</b> · queued in cooldown <b>${cnt.queued}</b> · dropped <b>${cnt.dropped}</b> · retries <b>${cnt.retry}</b> · picked <b>${cnt.pick}</b>${q.v('drop')?' · <b>dropping</b> clicks inside the 200 ms cooldown':''}`;}};
});

// ======================================================================
// E2: quick loot nearby (3x3, cap 30) against opening every corpse
// ======================================================================
reg('quickloot',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root),snd=sndBtn(root);
  const OX=5,COLS=10,ROWS=7,FH=112,bg=grass(W,FH,33,{grid:1,ox:OX}),HT={tx:4,ty:3};const cx=tx=>OX+tx*16+8,cy=ty=>ty*16+8;
  const LOOT=[['coin3',0],['potion',0],['bone',0],['meat',0],['sword',1],['shield',1],['gem',2],['rune',2],['ring',3],['helmet',1]];
  let C=[],fly=[],now=0,open=null,cnt={e:0,clicks:0,items:0},msg=[],seed=7;
  const roll=r=>{const n=1+((r()*4)|0),a=[];for(let i=0;i<n;i++){const L=LOOT[(r()*LOOT.length)|0];a.push({k:L[0],tier:L[1]});}return a;};
  const spawn=()=>{const r=mkRng(seed++),n=q.v('n');C=[];open=null;msg=[];
    const tiles=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)tiles.push({tx:HT.tx+dx,ty:HT.ty+dy});
    for(let i=0;i<n;i++){const T0=tiles[(i*5+2)%9];C.push({tx:T0.tx,ty:T0.ty,items:roll(r),own:i!==1,quest:i===4,look:i%7===3?'elite':'gob'});}
    for(const [tx,ty] of [[0,0],[8,1],[1,6],[9,5],[7,6],[0,3]])C.push({tx,ty,items:roll(r),own:true,quest:false,look:'gob',far:true});};
  const inReach=o=>Math.max(Math.abs(o.tx-HT.tx),Math.abs(o.ty-HT.ty))<=1;
  const bagX=W-14,bagY=8;
  const send=(k,tier,x,y,d)=>{if(fly.length<40)fly.push({k,tier,x,y,t0:now+d});};
  const quick=()=>{cnt.e++;const el=C.filter(o=>inReach(o)&&o.items.length&&o.own&&!o.quest);const take=el.slice(0,30),notMine=C.filter(o=>inReach(o)&&o.items.length&&!o.own).length,quest=C.filter(o=>inReach(o)&&o.items.length&&o.quest).length;
    let n=0;take.forEach((o,i)=>{for(const it of o.items){send(it.k,it.tier,cx(o.tx),cy(o.ty),Math.min(600,i*20));n++;}o.items=[];});cnt.items+=n;open=null;
    msg=[`LOOTED ${take.length} CORPSES, ${n} ITEMS`,`LEFT: ${notMine} NOT YOURS, ${quest} QUEST${el.length>30?`, ${el.length-30} OVER THE CAP`:''}`];if(snd()&&n)AU.coin(1);
    C=C.filter(o=>o.items.length||o.far||!o.own||o.quest);};
  q.btn('e',quick);q.btn('respawn',()=>{cnt={e:0,clicks:0,items:0};spawn();});q.on('n',()=>{out(q,'n',q.v('n'));cnt={e:0,clicks:0,items:0};spawn();});out(q,'n',q.v('n'));
  root.addEventListener('keydown',e=>{if(e.key==='e'||e.key==='E'){quick();e.preventDefault();}});
  pointer(cv,([x,y],k)=>{if(k!=='down')return;
    if(y>=FH&&open){const i=Math.floor((x-40)/14);const o=open;if(i>=0&&i<o.items.length){cnt.clicks++;const it=o.items.splice(i,1)[0];send(it.k,it.tier,40+i*14+6,FH+8,0);cnt.items++;if(snd())AU.tick();if(!o.items.length){C.splice(C.indexOf(o),1);open=null;}}return;}
    const tx=Math.floor((x-OX)/16),ty=Math.floor(y/16);const stack=C.filter(o=>o.tx===tx&&o.ty===ty&&o.items.length);if(!stack.length)return;const o=stack[stack.length-1];
    if(!inReach(o)){msg=['TOO FAR: WALK FIRST (E1)',''];return;}if(!o.own){msg=['YOU ARE NOT THE OWNER',''];if(snd())AU.bad();return;}cnt.clicks++;open=o;msg=[];});
  spawn();const fx=fixed();
  const step=dt=>{now+=dt;fly=fly.filter(f=>now-f.t0<260);};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    dashBox(c,OX+(HT.tx-1)*16,(HT.ty-1)*16,48,48,'rgba(255,240,180,.7)');
    const by=new Map();for(const o of C){if(!o.items.length&&!o.quest&&o.own)continue;const k=o.tx+','+o.ty;if(!by.has(k))by.set(k,[]);by.get(k).push(o);}
    for(const [k,arr] of by){const [tx,ty]=k.split(',').map(Number),X=cx(tx),Y=cy(ty)+5;const top=arr[arr.length-1];if(arr.length>1)corpse(c,arr[arr.length-2].look,X-2,Y-2);corpse(c,top.look,X,Y);
      if(!top.own)c.drawImage(icon('lock'),X+2,Y-14);if(top.quest)t(c,'!',X+5,Y-14,P.yl,{ol:P.ink});
      if(arr.length>1)t(c,'×'+arr.length,X+8,Y-4,P.txt,{ol:P.ink,al:'right'});}
    person(c,'me',cx(HT.tx),cy(HT.ty)+5,{dir:'d'});
    if(open)box(c,OX+open.tx*16,open.ty*16,16,16,P.yl);
    for(const f of fly){const p=(now-f.t0)/250;if(p<0)continue;const e=ease(Math.min(1,p));const x=lerp(f.x,bagX,e),y=lerp(f.y,bagY,e)-Math.sin(p*Math.PI)*10;c.drawImage(icon(f.k),Math.round(x)-4,Math.round(y)-4);}
    c.drawImage(icon('pack'),bagX-4,bagY-4);t(c,String(cnt.items),bagX-6,bagY-3,P.txt,{ol:P.ink,al:'right'});
    R(c,0,FH,W,H-FH,P.panel);R(c,0,FH,W,1,P.line);
    if(open){t(c,'LOOT',3,FH+6,P.mute);open.items.forEach((it,i)=>{R(c,40+i*14,FH+2,12,12,P.panel2);box(c,40+i*14,FH+2,12,12,it.tier?TIER[it.tier]:P.line);c.drawImage(icon(it.k),42+i*14,FH+4);});t(c,'CLICK EACH',W-3,FH+6,P.dim,{al:'right'});}
    else{t(c,msg[0]||'PRESS E, OR CLICK A CORPSE',3,FH+3,msg[0]?P.ok:P.mute);if(msg[1])t(c,msg[1],3,FH+9,P.s2);}
    // what the two ways cost for the corpses still in reach
    const rest=C.filter(o=>inReach(o)&&o.items.length&&o.own&&!o.quest),eachClicks=rest.reduce((s,o)=>s+1+o.items.length,0),presses=Math.ceil(rest.length/30);
    setHud(root,'');
    ro.innerHTML=`your clicks so far <b>${cnt.clicks}</b> · E presses <b>${cnt.e}</b> · items in the bag <b>${cnt.items}</b><br>left in reach: <b>${rest.length}</b> corpses. Opening each and dragging every item takes <b>${eachClicks}</b> clicks; quick loot takes <b>${presses}</b> press${presses===1?'':'es'}`;}};
});

// ======================================================================
// E3: walk-over gold and the magnet: owner only, 400 ms after landing,
// never in PvP combat; the radius slider shows what a big magnet does
// ======================================================================
reg('magnet',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root),snd=sndBtn(root);
  const bg=grass(W,H,45),TS=16;let now=0,coins=[],idn=0,dropT=0,stats={own:0,stolen:0,dist:0,n:0,crossed:0};const m=meter(.1);
  const me={x:85,y:62,dir:'r',fr:0,vx:1};const others=[{x:30,y:30,look:'other'},{x:140,y:28,look:'party'},{x:28,y:92,look:'other'},{x:142,y:96,look:'other'}];
  const owners=[me,...others];
  const drop=()=>{const o=owners[(Math.random()*owners.length)|0];const a=Math.random()*6.28,d=8+Math.random()*16;coins.push({id:++idn,x:o.x+Math.cos(a)*d,y:o.y-4+Math.sin(a)*d*.6,owner:o,t0:now,land:now+400,st:'arc',ax:o.x,ay:o.y-8});};
  const fx=fixed();
  const step=dt=>{now+=dt;dropT-=dt;if(dropT<=0){dropT=260;drop();}
    // me walks back and forth across the middle
    me.x+=me.vx*dt*.022;if(me.x>132){me.vx=-1;me.dir='l';}if(me.x<38){me.vx=1;me.dir='r';}me.fr=((now/180)|0)&1;
    const r=q.v('rad'),pvp=q.v('pvp'),ownerOnly=q.v('own');m.t0();
    for(const k of coins){if(k.st==='arc'&&now>=k.land)k.st='ground';
      if(k.st==='ground'&&now-k.land>=400&&!pvp&&(k.owner===me||!ownerOnly)){const dtile=Math.max(Math.abs(Math.floor(k.x/TS)-Math.floor(me.x/TS)),Math.abs(Math.floor(k.y/TS)-Math.floor((me.y-6)/TS)));
        if(dtile<=r){k.st='pull';k.p0=now;k.px=k.x;k.py=k.y;const d=Math.hypot(k.x-me.x,k.y-me.y);stats.dist+=d;stats.n++;if(k.owner!==me){stats.stolen++;k.thief=1;}else stats.own++;
          if(others.some(o=>Math.abs(o.x-(k.x+me.x)/2)<12&&Math.abs(o.y-(k.y+me.y)/2)<14))stats.crossed++;if(snd())AU.coin(1+Math.min(8,stats.own%9)*.0595);}}
      if(k.st==='pull'&&now-k.p0>=150)k.st='gone';
      if(k.st==='ground'&&now-k.land>3200){k.st='gone';}/* the other owners pick their own up */}
    m.t1();coins=coins.filter(k=>k.st!=='gone');};
  q.on('rad',()=>out(q,'rad',q.v('rad')+' tile'+(q.v('rad')===1?'':'s')));out(q,'rad','1 tile');
  q.btn('clear',()=>{stats={own:0,stolen:0,dist:0,n:0,crossed:0};});
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    const r=q.v('rad'),tx=Math.floor(me.x/TS),ty=Math.floor((me.y-6)/TS);if(r>0)dashBox(c,(tx-r)*TS,(ty-r)*TS,(2*r+1)*TS,(2*r+1)*TS,q.v('pvp')?'rgba(226,72,58,.8)':'rgba(255,224,138,.8)');
    for(const k of coins){if(k.st==='arc'){const p=clamp((now-k.t0)/400,0,1),x=lerp(k.ax,k.x,p),y=lerp(k.ay,k.y,p)-Math.sin(p*Math.PI)*12;drawShadow(c,lerp(k.ax,k.x,p),lerp(k.ay+8,k.y,p)+5,8,.45);c.drawImage(icon('coin1'),Math.round(x)-4,Math.round(y)-4);}
      else if(k.st==='ground'){const wait=now-k.land<400;item(c,'coin1',0,k.x,k.y);if(k.owner===me){PX(c,k.x,k.y-6,wait?P.s1:P.a3);}}
      else if(k.st==='pull'){const p=easeIn(clamp((now-k.p0)/150,0,1));const x=lerp(k.px,me.x,p),y=lerp(k.py,me.y-8,p);if(k.thief){line(c,k.px,k.py,x,y,'rgba(226,72,58,.6)');}c.drawImage(icon('coin1'),Math.round(x)-4,Math.round(y)-4);}}
    for(const o of others)person(c,o.look,o.x,o.y,{dir:'d'});
    person(c,'me',me.x,me.y,{dir:me.dir,fr:me.fr});if(q.v('pvp')){t(c,'PVP',me.x,me.y-24,P.red,{ol:P.ink,al:'center'});}
    setHud(root,'');const avg=stats.n?stats.dist/stats.n/TS:0;
    ro.innerHTML=`your coins pulled <b>${stats.own}</b> · taken from others <b>${stats.stolen}</b>${q.v('own')?' (owner only blocks this)':''} · mean pull <b>${avg.toFixed(1)}</b> tiles · pulls that crossed another player <b>${stats.crossed}</b> · magnet check here <b>${fms(m.v)} ms</b> per frame, measured<br>report, measured on the M4 for 3,000 items and 30 players: grid 0.05 ms, brute force 0.10 ms`;}};
});

// ======================================================================
// E4: fly to bag, bag bump, +N and the coin streak pitch
// ======================================================================
reg('flybag',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root),snd=sndBtn(root);
  const bg=grass(W,H,57),hero={x:62,y:66},BAG={x:146,y:84},bagC=BAG_IMG;
  const KIND=['sword','gem','potion','ring','shield','rune','helmet','scroll'];
  let now=0,fly=[],bump=-1e9,pops=[],streak={n:0,last:-1e9},ground=[],idle=0,auto=0,lastFly=0,queue=[];const cnt={items:0,coins:0};
  const fill=()=>{ground=[];for(let i=0;i<7;i++){const a=i/7*6.28+.4;ground.push({k:i<4?'coin1':KIND[(i*3)%KIND.length],tier:i<4?0:(i%4)+1,x:hero.x+Math.cos(a)*22,y:hero.y-6+Math.sin(a)*14});}};
  const pitchStep=()=>{if(now-streak.last>1200)streak.n=0;streak.n=Math.min(8,streak.n+1);streak.last=now;return streak.n;};
  const launch=(g,delay=0)=>{const spd=q.segv('pre')==='spd';fly.push({k:g.k,tier:g.tier,x:g.x,y:g.y,t0:now+delay,dur:spd?500:250,side:spd?0:(Math.random()<.5?-16:16),spd,coin:g.k==='coin1'});};
  const take=(n,coinsOnly)=>{idle=0;let pool=ground.filter(g=>coinsOnly?g.k==='coin1':g.k!=='coin1');if(!pool.length){fill();pool=ground.filter(g=>coinsOnly?g.k==='coin1':g.k!=='coin1');}
    const got=pool.slice(0,n);ground=ground.filter(g=>!got.includes(g));return got;};
  q.btn('one',()=>{const g=take(1,false)[0];if(g)launch(g);});
  q.btn('coins',()=>{idle=0;for(let i=0;i<10;i++)queue.push(now+i*140);});
  q.btn('six',()=>{idle=0;const got=[];for(let i=0;i<6;i++)got.push({k:KIND[(i*5+1)%KIND.length],tier:1+(i%4),x:hero.x+(i-2.5)*9,y:hero.y-2});
    got.slice(0,3).forEach((g,i)=>launch(g,i*30));pops.push({s:'+6',t0:now+(q.segv('pre')==='spd'?500:250)+60});cnt.items+=3;/* the other 3 arrive with the +6 */});
  q.seg('pre',()=>{});
  fill();const fx=fixed();
  const step=dt=>{now+=dt;idle+=dt;
    while(queue.length&&now>=queue[0]){queue.shift();let g=take(1,true)[0];if(!g){g={k:'coin1',tier:0,x:hero.x+(Math.random()*40-20),y:hero.y-4+(Math.random()*20-10)};}launch(g);}
    for(const f of fly){if(!f.done&&now-f.t0>=f.dur){f.done=1;bump=now;lastFly=f.dur;
      if(f.coin){cnt.coins++;const s=pitchStep(),jit=(Math.random()*.6-.3);f.rate=Math.pow(2,(s-1+jit)/12);if(snd())AU.coin(f.rate);const lp=pops.find(p=>p.coin&&now-p.t0<500);if(lp){lp.n++;lp.s='+'+lp.n;lp.t0=now;}else pops.push({s:'+1',n:1,coin:1,t0:now,col:P.o2});}
      else{cnt.items++;if(snd())AU.ok2();}}}
    fly=fly.filter(f=>!f.done);pops=pops.filter(p=>now-p.t0<700);
    if(!ground.length)fill();
    if(idle>4500&&now>auto){auto=now+3000;const r=Math.random();if(r<.5){for(let i=0;i<6;i++)queue.push(now+i*140);}else{const g=take(1,false)[0];if(g)launch(g);}}};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    for(const g of ground)item(c,g.k,g.tier,g.x,g.y,{time:now});
    person(c,'me',hero.x,hero.y,{dir:'r'});
    for(const f of fly){const p=(now-f.t0)/f.dur;if(p<0){item(c,f.k,f.tier,f.x,f.y,{marks:false});continue;}const e=f.spd?p:ease(p);
      const dx=BAG.x-f.x,dy=BAG.y-f.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,off=Math.sin(Math.PI*p)*f.side;const x=f.x+dx*e+nx*off,y=f.y+dy*e+ny*off;
      if(f.spd){const s=Math.max(2,Math.round(8*(1-Math.sqrt(p))));c.drawImage(icon(f.k),Math.round(x-s/2),Math.round(y-s/2),s,s);}else c.drawImage(icon(f.k),Math.round(x)-4,Math.round(y)-4);}
    // bag bump: 1.0 to 1.15 to 1.0 over 120 ms
    const bp=(now-bump)/120,sc=bp>=0&&bp<1?1+.15*Math.sin(bp*Math.PI):1,bw=Math.round(14*sc),bh=Math.round(13*sc);
    R(c,BAG.x-12,BAG.y-12,24,24,'rgba(26,20,32,.55)');c.drawImage(bagC,Math.round(BAG.x-bw/2),Math.round(BAG.y+6-bh),bw,bh);
    t(c,String(cnt.items+cnt.coins),BAG.x+11,BAG.y+5,P.txt,{ol:P.ink,al:'right'});
    for(const p of pops){const a=(now-p.t0)/700;if(a<0)continue;t(c,p.s,BAG.x,BAG.y-14-Math.round(a*10),p.col||P.ok,{ol:P.ink,al:'center'});}
    // streak pitch ladder: 8 steps of a semitone, resets 1.2 s after the last coin
    const live=now-streak.last<1200,n=live?streak.n:0;t(c,'COIN PITCH',3,3,P.mute,{ol:P.ink});
    for(let i=0;i<8;i++){const h=3+i,on=i<n;R(c,3+i*5,22-h,4,h,on?(i===7?P.o1:P.o2):'rgba(26,20,32,.6)');}
    if(live)bar(c,3,25,39,1,1-(now-streak.last)/1200,P.a3);
    setHud(root,'');const rate=n?Math.pow(2,(n-1)/12):1;
    ro.innerHTML=`flight <b>${q.segv('pre')==='spd'?'500 ms straight, shrinking':'250 ms ease in-out, ±16 px side curve'}</b> · coin streak <b>${n}</b> of 8 · rate <b>×${rate.toFixed(3)}</b> · picked <b>${cnt.items}</b> items, <b>${cnt.coins}</b> coins${snd()?'':' · muted until you click Sound off'}`;}};
});

// ======================================================================
// E5: bag full: the item stays, the bag flashes, the exact message,
// the loud style at most once per 15 s
// ======================================================================
reg('bagfull',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root),snd=sndBtn(root);
  const FH=74,bg=grass(W,FH,69),hero={x:30,y:52},cor={x:58,y:54};
  const loot=[{k:'sword',tier:2},{k:'axe',tier:1},{k:'shield',tier:0}];let corpseItems=loot.slice();
  let bag=['sword','axe','sword','shield','axe','sword','helmet','shield'].map((k,i)=>({k,tier:i%3})),cap=8;
  let now=0,lastLoud=-1e9,flash=-1e9,hop={i:-1,t:-1e9},loud=null,quiet=[],cnt={tries:0,loud:0,quiet:0,lost:0,ok:0},spill=[],thief=null,fly=[];
  const MSG='ATTENTION! THE CONTAINER FOR WEAPONS IS FULL.';
  const tryLoot=i=>{if(i>=corpseItems.length)return;cnt.tries++;const it=corpseItems[i];
    if(bag.length<cap){bag.push(it);corpseItems.splice(i,1);cnt.ok++;fly.push({k:it.k,x:cor.x+(i-1)*12,y:cor.y-20,t0:now});if(snd())AU.ok2();if(!corpseItems.length)setTimeout(()=>{corpseItems=loot.slice();},900);return;}
    if(q.v('spill')){corpseItems.splice(i,1);spill.push({...it,x:cor.x+14+spill.length*6,y:cor.y+4,t0:now});if(!corpseItems.length)corpseItems=loot.slice();if(!thief)thief={x:W+8,y:cor.y+6,t0:now};return;}
    flash=now;hop={i,t:now};if(snd())AU.thud();
    if(now-lastLoud>15000){lastLoud=now;loud={t:now};cnt.loud++;}else{quiet.push({t:now});cnt.quiet++;if(quiet.length>3)quiet.shift();}};
  pointer(cv,([x,y],k)=>{if(k!=='down')return;if(y>=FH+4&&y<FH+18&&x>=4&&x<4+3*14){tryLoot(Math.floor((x-4)/14));}else if(Math.abs(x-cor.x)<12&&Math.abs(y-cor.y)<12)tryLoot(0);});
  q.btn('loot',()=>tryLoot(0));q.btn('free',()=>{if(bag.length)bag.shift();});
  const fx=fixed();
  const step=dt=>{now+=dt;fly=fly.filter(f=>now-f.t0<250);
    if(thief){const tg=spill[0];if(!tg){thief.x+=dt*.05;if(thief.x>W+10)thief=null;}else{const dx=tg.x-thief.x;thief.x+=Math.sign(dx)*Math.min(Math.abs(dx),dt*.05);if(Math.abs(dx)<2){spill.shift();cnt.lost++;}}}};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    corpse(c,'gob',cor.x,cor.y);person(c,'me',hero.x,hero.y,{dir:'r'});
    for(const s of spill)item(c,s.k,s.tier,s.x,s.y);if(thief)person(c,'other',thief.x,thief.y,{dir:'l',fr:((now/150)|0)&1});
    if(spill.length)t(c,'PUBLIC TILE',cor.x+20,cor.y+8,P.r3,{ol:P.ink});
    for(const f of fly){const p=ease((now-f.t0)/250);c.drawImage(icon(f.k),Math.round(lerp(f.x,146,p))-4,Math.round(lerp(f.y,FH+11,p))-4);}
    // loud message: big and red, centred, at most once per 15 s
    if(loud&&now-loud.t<2400){const L=['ATTENTION! THE CONTAINER','FOR WEAPONS IS FULL.'];R(c,8,4,W-16,18,'rgba(26,20,32,.82)');L.forEach((s,i)=>t(c,s,W/2,7+i*7,'#ff5a4a',{ol:P.ink,al:'center'}));}
    // bottom: loot window, quiet log, bag
    R(c,0,FH,W,H-FH,P.panel);R(c,0,FH,W,1,P.line);
    corpseItems.forEach((it,i)=>{const hx=hop.i===i?(now-hop.t):1e9;const dy=hx<120?-Math.round(Math.sin(hx/120*Math.PI)*4):hx<240?((hx/40|0)&1?1:-1)*0:0;
      R(c,4+i*14,FH+4+dy,12,12,P.panel2);box(c,4+i*14,FH+4+dy,12,12,it.tier?TIER[it.tier]:P.line);c.drawImage(icon(it.k),6+i*14,FH+6+dy);});
    t(c,'CORPSE',4,FH+19,P.dim);
    quiet.forEach((m,i)=>t(c,'THE CONTAINER FOR WEAPONS IS FULL.',4,FH+33+i*6,now-m.t<600?P.s3:P.dim));
    const fl=now-flash<360&&((now-flash)/90|0)%2===0;const bx=120;R(c,bx-2,FH+3,48,23,fl?'#7a1e28':P.panel2);box(c,bx-2,FH+3,48,23,fl?P.red:P.line);
    for(let i=0;i<cap;i++){const x=bx+(i%4)*11,y=FH+5+Math.floor(i/4)*10;R(c,x,y,10,9,'#1a1420');if(bag[i])c.drawImage(icon(bag[i].k),x+1,y);}
    t(c,'WEAPONS '+bag.length+'/'+cap,bx+46,FH+27,bag.length>=cap?P.r3:P.ok,{al:'right'});
    const left=Math.max(0,15000-(now-lastLoud));if(left>0)t(c,'LOUD IN '+(left/1000).toFixed(1)+' S',50,FH+8,P.mute);
    setHud(root,'');
    ro.innerHTML=`tries <b>${cnt.tries}</b> · loud warnings <b>${cnt.loud}</b> · quiet lines <b>${cnt.quiet}</b> · looted <b>${cnt.ok}</b>${q.v('spill')?` · <b>spilling to a shared tile</b>, items lost to strangers <b>${cnt.lost}</b>`:''}`;}};
});

// ======================================================================
// F1: top damage owns, first attacker x1.3, 15 s owner and party,
// helpers with 10% until 20 s, then public. A scrubbable timeline.
// ======================================================================
reg('owner',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const SH=64,bg=grass(W,SH,81),gob={x:85,y:32};
  const PL=[{n:'A',look:'me',x:44,y:36,dir:'r',first:true,dmg:0,goal:41},{n:'B',look:'party3',x:126,y:36,dir:'l',dmg:0,goal:51},{n:'C',look:'party2',x:62,y:58,dir:'r',dmg:0,goal:8},{n:'D',look:'other',x:140,y:58,dir:'l',dmg:0,goal:0,stranger:true}];
  let now=0,phase='fight',fightT=0,ts=0,playing=true,drag=false,hits=[],seed=3;
  const refight=(rand)=>{const r=mkRng(seed++);if(rand){PL[0].goal=30+((r()*20)|0);PL[1].goal=38+((r()*22)|0);PL[2].goal=4+((r()*12)|0);}PL.forEach(p=>p.dmg=0);phase='fight';fightT=0;ts=0;playing=true;hits=[];};
  const totals=()=>{const tot=PL.reduce((s,p)=>s+p.dmg,0)||1,w=q.v('w13');let best=null;for(const p of PL){p.share=p.dmg/tot;p.wt=p.dmg*(p.first&&w?1.3:1);if(p.dmg>0&&(!best||p.wt>best.wt))best=p;}return best;};
  const party=p=>q.v('party')&&(p.n==='A'||p.n==='B');
  const access=(p,own,s)=>{if(p===own||(party(own)&&party(p)))return {ok:true,why:'OWNER'+(p===own?'':' PARTY')};if(s>=20)return {ok:true,why:'PUBLIC'};if(s>=15&&p.share>=.1)return {ok:true,why:'HELPER'};const at=p.share>=.1?15:20;return {ok:false,in:Math.ceil(at-s)};};
  pointer(cv,([x,y],k)=>{if(y<H-24&&k==='down')return;if(k==='down'||(k==='drag'&&drag)){drag=true;playing=false;if(phase!=='dead'){PL.forEach(p=>p.dmg=p.goal);phase='dead';}ts=clamp((x-8)/(W-16)*25,0,25);}if(k==='up')drag=false;});
  q.btn('play',()=>{if(phase!=='dead'){playing=true;return;}if(ts>=25)ts=0;playing=true;});q.btn('refight',()=>refight(true));
  q.on('w13',()=>{});q.on('party',()=>{});
  const fx=fixed();
  const step=dt=>{now+=dt;
    if(phase==='fight'){fightT+=dt;const k=fightT/2400;for(const p of PL){if(p.stranger)continue;const start=p.first?0:.15;const want=Math.round(p.goal*clamp((k-start)/(1-start),0,1));if(want>p.dmg){const d=want-p.dmg;p.dmg=want;if(Math.random()<.35||want===p.goal)hits.push({x:gob.x+(Math.random()*8-4),y:gob.y-18,v:d,t:now,col:p.first?P.o2:'#ff6a5a'});}}if(fightT>=2600){phase='dead';ts=0;}}
    else if(playing&&!drag){ts+=dt/1000*5;if(ts>=25){ts=25;playing=false;}}
    hits=hits.filter(h=>now-h.t<700);};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);const own=totals();
    if(phase==='fight'){person(c,'gob',gob.x,gob.y,{dir:'d',fr:((now/200)|0)&1});}else{corpse(c,'gob',gob.x,gob.y);}
    for(const p of PL){person(c,p.look,p.x,p.y,{dir:p.dir});t(c,p.n,p.x+(p.dir==='l'?8:-11),p.y-8,P.txt,{ol:P.ink});
      if(phase==='dead'){const a=access(p,own,ts);if(a.ok){t(c,a.why,p.x,p.y-24,a.why==='PUBLIC'?P.s3:a.why==='HELPER'?P.a3:P.o2,{ol:P.ink,al:'center'});}
        else{c.drawImage(icon('lock'),p.x-4,p.y-27);t(c,'IN '+a.in+' S',p.x,p.y-33,P.s2,{ol:P.ink,al:'center'});}}}
    for(const h of hits)t(c,String(h.v),h.x,h.y-(now-h.t)/40,h.col,{ol:P.ink,al:'center'});
    if(phase==='dead'&&own){box(c,own.x-8,own.y-17,16,19,P.o2);}
    // damage table
    const ty=SH+2;R(c,0,SH,W,H-SH,P.panel);R(c,0,SH,W,1,P.line);const maxW=Math.max(...PL.map(p=>p.dmg*(p.first&&q.v('w13')?1.3:1)),1);
    PL.slice(0,3).forEach((p,i)=>{const y=ty+2+i*8;t(c,p.n+(p.first?' FIRST':''),3,y,p===own&&phase==='dead'?P.o2:P.mute);const bw=90,raw=Math.round(bw*p.dmg/ (maxW)),wt=Math.round(bw*p.wt/(maxW));
      R(c,40,y,bw,5,'#2a2334');if(wt>raw)for(let x=raw;x<wt;x+=2)R(c,40+x,y,1,5,P.o1);R(c,40,y,raw,5,p.first?P.o2:'#ff6a5a');
      t(c,Math.round((p.share||0)*100)+'%',W-3,y,p.share>=.1?P.txt:P.r3,{al:'right'});});
    // timeline 0 to 25 s
    const ly=H-22,X=s=>Math.round(8+s/25*(W-16));R(c,X(0),ly+6,X(15)-X(0),5,P.o1);R(c,X(15),ly+6,X(20)-X(15),5,P.a2);R(c,X(20),ly+6,X(25)-X(20),5,P.s1);
    t(c,'OWNER + PARTY',X(0)+1,ly,P.o2);t(c,'10%',X(15)+2,ly,P.a3);t(c,'PUBLIC',X(20)+2,ly,P.s3);
    for(const s of [0,5,10,15,20,25]){R(c,X(s),ly+12,1,2,P.dim);t(c,s+'',X(s),ly+15,P.dim,{al:'center'});}
    if(phase==='dead'){R(c,X(ts),ly+4,1,10,P.wh);R(c,X(ts)-1,ly+3,3,1,P.wh);}
    setHud(root,'');
    ro.innerHTML=phase!=='dead'?'Fight in progress. Damage numbers in gold are the first attacker\'s.':`owner <b>${own?own.n:'-'}</b>${q.v('w13')?' (first attacker weighted ×1.3)':' (plain top damage)'} · t = <b>${ts.toFixed(1)} s</b> after the kill · A ${PL[0].dmg}, B ${PL[1].dmg}, C ${PL[2].dmg} damage · time runs 5x`;}};
});

// ======================================================================
// F2 / 6b: ownership timers compared, and three private styles
// ======================================================================
reg('timers',root=>{const A=cv2(root,0),B=cv2(root,1),q=ctl(root),ro=RO(root);
  // segments: [from, to, kind]; kind o owner/private, p party/2nd, h helpers/3rd, u public, n personal; end: true = item gone at the last 'to', false = runs on
  const ROWS=[
    ['TIBIA CORPSE',[[0,10,'o'],[10,670,'u']],false,'10 s owner, public until rot (670 s for a dragon)'],
    ['OSRS',[[0,60,'o'],[60,180,'u']],true,'60 s hidden, 120 s public'],
    ['OSRS UNTRADE.',[[0,180,'o']],true,'untradeables private 180 s'],
    ['RAGNAROK',[[0,3,'o'],[3,5,'p'],[5,7,'h'],[7,60,'u']],true,'3 + 2 + 2 s, gone at 60 s'],
    ['RAGNAROK MVP',[[0,10,'o'],[10,20,'p'],[20,22,'h'],[22,60,'u']],true,'10 + 10 + 2 s'],
    ['MAPLESTORY',[[0,15,'o'],[15,180,'u']],true,'15 s killer or party, expiry 180 s'],
    ['ALBION BLACK',[[0,90,'o'],[90,999,'u']],false,'player corpse: 90 s priority'],
    ['UO FELUCCA',[[0,999,'u']],false,'player corpse: anyone at once'],
    ['GUILD WARS 2',[[0,999,'n']],false,'personal loot for every contributor'],
    ['ASTERION CORPSE',[[0,15,'o'],[15,20,'h'],[20,999,'u']],false,'15 s owner and party, helpers to 20 s'],
    ['ASTERION SPILL',[[0,60,'o'],[60,180,'u']],true,'60 s private, public until 180 s']];
  const COL={o:P.o1,p:'#c88a3a',h:P.a2,u:P.s1,n:P.te};
  let scale=180,now=0,ph=0,sel=-1;q.seg('scale',v=>{scale=+v;ph=0;});
  pointer(A.cv,([x,y],k)=>{if(k!=='down')return;const i=Math.floor((y-3)/10);sel=i>=0&&i<ROWS.length?i:-1;});
  // the three styles: a corpse with three items as seen by viewer
  let viewer='stranger',react=[null,null,null],took=[0,0,0];const WIN=10000,PUB=4000;q.seg('view',v=>{viewer=v;});
  const PITEMS=[['sword',2],['coin3',0],['ring',3]];
  pointer(B.cv,([x,y],k)=>{if(k!=='down')return;const i=Math.floor(x/(B.W/3));if(i<0||i>2)return;react[i]={t:now};const pub=(now%(WIN+PUB))>=WIN;if(viewer==='owner'||pub)took[i]=now;});
  const fx=fixed();
  const step=dt=>{now+=dt;ph+=dt;};
  return {tick(dt){fx(dt*slowK(q),step);
    // ---- bars
    let c=A.c,W=A.W,H=A.H;c.fillStyle=P.panel;c.fillRect(0,0,W,H);const x0=62,bw=W-x0-10,X=s=>x0+Math.round(Math.min(s,scale)/scale*bw);
    const loop=scale===180?7000:5000,tt=(ph%loop)/loop*scale;
    ROWS.forEach((r,i)=>{const y=3+i*10;if(i===sel)R(c,0,y-1,W,9,'#2c2538');t(c,r[0],2,y+1,r[0].startsWith('ASTERION')?P.o2:P.s3);R(c,x0,y+1,bw,5,'#231d2b');
      for(const [a,b,k] of r[1]){if(a>=scale)continue;const xa=X(a),xb=X(b);R(c,xa,y,Math.max(1,xb-xa),7,COL[k]);if(xb-xa>2)R(c,xa,y,1,7,P.ink);}
      const last=r[1][r[1].length-1];if(r[2]&&last[1]<=scale){R(c,X(last[1]),y-1,1,9,P.red);}else if(last[1]>scale){PX(c,x0+bw+1,y+2,P.s3);PX(c,x0+bw+2,y+3,P.s3);PX(c,x0+bw+1,y+4,P.s3);}});
    const ay=3+ROWS.length*10+1;R(c,x0,ay,bw,1,P.dim);const ticks=scale===180?[0,30,60,90,120,150,180]:[0,5,10,15,20,25,30];for(const s of ticks){R(c,X(s),ay,1,3,P.dim);t(c,s+'',X(s),ay+4,P.mute,{al:'center'});}
    R(c,X(tt),2,1,ay-2,'rgba(246,238,219,.7)');
    const ly=ay+11;[['o','OWNER / 1ST',2,0],['p','2ND',58,0],['h','3RD / HELPERS',88,0],['u','PUBLIC',2,7],['n','PERSONAL',42,7]].forEach(([k,n,lx,dy])=>{R(c,lx,ly+dy+1,4,4,COL[k]);t(c,n,lx+6,ly+dy,P.mute);});
    R(c,89,ly+8,1,5,P.red);t(c,'ITEM GONE',94,ly+7,P.mute);
    // ---- styles
    c=B.c;W=B.W;H=B.H;const bg=grass(W,H,91);c.drawImage(bg,0,0);const cyc=now%(WIN+PUB),pub=cyc>=WIN,left=Math.ceil((WIN-cyc)/1000);const pw=Math.floor(W/3);
    ['HIDDEN','GREYED','BLOCKED'].forEach((n,i)=>{const x=i*pw,cx=x+pw/2;if(i)R(c,x,0,1,H,P.ink);t(c,n,cx,3,P.txt,{ol:P.ink,al:'center'});
      const gone=took[i]&&now-took[i]<1500,rx=react[i]&&now-react[i].t<600?now-react[i].t:-1,sh=rx>=0&&rx<120?((rx/30|0)&1?2:-2):0;const own=viewer==='owner'||pub;
      if(i<2){PITEMS.forEach(([k,tr],j)=>{if(gone)return;const ix=cx-14+j*14+(i===1&&!own?sh:0),iy=26;if(i===0&&!own)return;item(c,k,tr,ix,iy,{grey:i===1&&!own,time:now,marks:own||i!==1});});
        if(i===0&&!own&&rx>=0)t(c,'NOTHING HERE',cx,38,P.s2,{ol:P.ink,al:'center'});if(i===1&&!own&&rx>=0)t(c,'NOT YOURS',cx,38,P.r3,{ol:P.ink,al:'center'});}
      else{corpse(c,'gob',cx,33);if(!own){c.drawImage(icon('lock'),cx-4+sh,13);t(c,'OPENS IN '+left+' S',cx,38,rx>=0?P.o2:P.s2,{ol:P.ink,al:'center'});}else if(!gone)PITEMS.forEach(([k,tr],j)=>item(c,k,tr,cx-14+j*14,17,{time:now,shadow:false}));}
      if(gone)t(c,'TAKEN',cx,38,P.ok,{ol:P.ink,al:'center'});});
    R(c,0,H-7,W,7,'rgba(26,20,32,.8)');t(c,pub?'PUBLIC: ANYONE MAY TAKE IT':(viewer==='owner'?'YOU OWN IT':'PRIVATE FOR '+left+' S MORE'),W/2,H-6,pub?P.s3:P.o2,{al:'center'});
    setHud(root,'');const r=sel>=0?ROWS[sel]:null;
    ro.innerHTML=(r?`<b>${r[0].toLowerCase().replace(/^./,m=>m.toUpperCase())}</b>: ${r[3]} · `:'Click a row for its rule · ')+`playhead <b>${Math.round(tt)} s</b> · styles: viewing as <b>${viewer}</b>, the 10 s window below is illustrative`;}};
});

// ======================================================================
// F3 / F4: one drop, a party of four, five rules
// ======================================================================
reg('partymodes',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const SH=66,bg=grass(W,SH,101),gob={x:85,y:38};
  const PL=[{n:'A',role:'TANK',look:'me',x:44,y:28,react:260,lat:30,dmg:.20,taken:.70,heal:0},{n:'B',role:'DPS',look:'party3',x:126,y:28,react:240,lat:40,dmg:.40,taken:.10,heal:0},
            {n:'C',role:'DPS',look:'party2',x:44,y:60,react:300,lat:20,dmg:.35,taken:.10,heal:0,ninja:true},{n:'D',role:'HEAL',look:'party',x:126,y:60,react:280,lat:160,dmg:.05,taken:.10,heal:1}];
  PL.forEach(p=>{p.score=(p.dmg+p.taken+p.heal)/3;p.wins=0;p.items=0;});
  let mode='ffa',now=0,rr=0,kills=0,anim=null,info='';const n=PL.length,base=1/Math.cbrt(n);
  const ITEMS=[['sword',2],['ring',3],['shield',2],['gem',2],['helmet',2],['axe',2]];
  const decide=(fast)=>{kills++;const it=ITEMS[kills%ITEMS.length];let res={it,to:[],tags:{}};
    if(mode==='ffa'){let best=null;for(const p of PL){const tt=p.react+(Math.random()*160-80)+p.lat;res.tags[p.n]=Math.round(tt)+' MS';if(!best||tt<best.t)best={p,t:tt};}res.to=[best.p];info='first click wins';}
    else if(mode==='rr'){const p=PL[rr%n];rr++;res.to=[p];PL.forEach(x=>res.tags[x.n]=x===p?'TURN':'');info='next turn: '+PL[rr%n].n;}
    else if(mode==='ng'){let best=null;for(const p of PL){const need=p.ninja||Math.random()<.25,roll=1+((Math.random()*100)|0);res.tags[p.n]=(need?'NEED ':'GREED ')+roll;const key=(need?1000:0)+roll;if(!best||key>best.k)best={p,k:key};}res.to=[best.p];info='C always presses Need';}
    else if(mode==='personal'){res.to=PL.slice();PL.forEach(p=>res.tags[p.n]='OWN DROP');info='each sees only their own';}
    else{const top=PL.reduce((a,b)=>b.score>a.score?b:a);res.to=PL.slice();PL.forEach(p=>res.tags[p.n]=(p.score*100).toFixed(0)+'%'+(p===top?' *':''));res.top=top;info='unique items roll for the top score only';}
    for(const p of res.to){p.wins++;p.items++;}
    if(!fast)anim={res,t0:now};};
  q.seg('mode',v=>{mode=v;PL.forEach(p=>{p.wins=0;p.items=0;});kills=0;rr=0;anim=null;});
  q.btn('kill',()=>decide(false));q.btn('kill20',()=>{for(let i=0;i<19;i++)decide(true);decide(false);});
  const fx=fixed();let idle=0;
  const step=dt=>{now+=dt;idle+=dt;if(idle>3500&&(!anim||now-anim.t0>2200)){decide(false);}};
  root.addEventListener('click',()=>{idle=-6000;});
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    const at=anim?now-anim.t0:1e9;if(at<300)person(c,'gob',gob.x,gob.y,{dir:'d'});else corpse(c,'gob',gob.x,gob.y);
    if(mode==='chest'&&anim&&at>300){for(const p of PL){const cx=lerp(gob.x,p.x,.45),cy=lerp(gob.y,p.y,.45)+4;c.drawImage(icon('chest'),Math.round(cx)-4,Math.round(cy)-4);}}
    for(const p of PL){person(c,p.look,p.x,p.y,{dir:p.x<gob.x?'r':'l'});t(c,p.n,p.x+(p.x<gob.x?-10:7),p.y-12,P.txt,{ol:P.ink});
      if(anim&&anim.res.tags[p.n]&&at<2600)t(c,anim.res.tags[p.n],p.x,p.y-23,anim.res.to.includes(p)&&anim.res.to.length===1?P.o2:P.s3,{ol:P.ink,al:'center'});}
    if(anim){const {res}=anim;res.to.forEach((p,j)=>{const it=mode==='personal'||mode==='chest'?ITEMS[(kills+j)%ITEMS.length]:res.it;
      if(at<400){const pp=at/400;item(c,it[0],it[1],gob.x+(j-1.5)*6*pp,gob.y-6-Math.sin(pp*Math.PI)*14,{time:now,gy:gob.y-6});}
      else if(at<1100){item(c,it[0],it[1],gob.x+(j-1.5)*6,gob.y-6,{time:now});}
      else if(at<1400){const pp=ease((at-1100)/300);c.drawImage(icon(it[0]),Math.round(lerp(gob.x+(j-1.5)*6,p.x,pp))-4,Math.round(lerp(gob.y-6,p.y-8,pp))-4);}});}
    // tally
    R(c,0,SH,W,H-SH,P.panel);R(c,0,SH,W,1,P.line);const mx=Math.max(1,...PL.map(p=>p.wins));
    PL.forEach((p,i)=>{const y=SH+4+i*9;t(c,p.n+' '+p.role,3,y,P.mute);const w=Math.round(80*p.wins/mx);R(c,46,y,80,5,'#2a2334');R(c,46,y,w,5,p.ninja&&mode==='ng'?P.r2:P.o1);t(c,String(p.wins),130,y,P.txt);
      if(mode==='chest')t(c,'D'+Math.round(p.dmg*100)+' T'+Math.round(p.taken*100)+' H'+Math.round(p.heal*100),W-2,y,P.dim,{al:'right'});
      else if(mode==='ffa')t(c,p.lat+' MS',W-2,y,P.dim,{al:'right'});});
    t(c,mode==='chest'?`SCORE = MEAN OF 3 SHARES · 1/N = ${(1/n).toFixed(2)}`:info.toUpperCase(),W/2,H-7,P.s2,{al:'center'});
    setHud(root,'');const fair=kills?(Math.max(...PL.map(p=>p.wins))/Math.max(1,Math.min(...PL.map(p=>p.wins)))):0;
    ro.innerHTML=`kills <b>${kills}</b> · items handed out <b>${PL.reduce((s,p)=>s+p.items,0)}</b> · spread most to fewest <b>${kills?(Math.min(...PL.map(p=>p.wins))?fair.toFixed(1)+'×':'∞'):'-'}</b>`;}};
});

// ======================================================================
// G2: two players, one coin: first packet wins, or 100 ms tick batches
// ordered by a rank that rotates every 60 s
// ======================================================================
reg('race',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const SH=84,bg=grass(W,SH,111),SRV={x:85,y:12},coin={x:85,y:62},PA={x:34,y:70},PB={x:136,y:70},SLOW=8;
  let mode='first',now=0,race=null,trial=0,wins=[0,0],ties=0,clock=0;
  q.seg('mode',v=>{mode=v;wins=[0,0];trial=0;clock=0;});
  const lat=()=>[q.v('la'),q.v('lb')];
  const resolve=()=>{const [la,lb]=lat();const ca=Math.random()*80,cb=Math.random()*80;/* both press within 80 ms of each other */const aa=ca+la,ab=cb+lb,phase=Math.random()*100;
    clock+=6;/* a race every 6 s of game time */const rankA=Math.floor(clock/60)%2===0;let w;
    if(mode==='first')w=aa<=ab?0:1;else{const ta=Math.floor((aa+phase)/100),tb=Math.floor((ab+phase)/100);w=ta<tb?0:tb<ta?1:(rankA?0:1);if(ta===tb)ties++;}
    wins[w]++;trial++;return {ca,cb,aa,ab,w,phase,rankA};};
  q.btn('go',()=>{race={...resolve(),t0:now};});q.btn('run',()=>{for(let i=0;i<100;i++)resolve();race={...resolve(),t0:now};});
  const upd=()=>{out(q,'la',q.v('la')+' ms');out(q,'lb',q.v('lb')+' ms');wins=[0,0];trial=0;ties=0;};q.on('la',upd);q.on('lb',upd);upd();
  const fx=fixed();let idle=0;root.addEventListener('click',()=>{idle=-8000;});
  const step=dt=>{now+=dt;idle+=dt;if(idle>3000&&(!race||now-race.t0>(Math.max(race.aa,race.ab)+260)*SLOW*0+5200)){race={...resolve(),t0:now};idle=0;}};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    const rt=race?(now-race.t0)/SLOW:1e9;/* race time in ms, shown 8x slower */
    // server
    R(c,SRV.x-16,SRV.y-8,32,14,P.ink);R(c,SRV.x-15,SRV.y-7,30,12,P.panel2);t(c,'SERVER',SRV.x,SRV.y-4,P.s3,{al:'center'});
    line(c,PA.x,PA.y-18,SRV.x-10,SRV.y+6,'rgba(26,20,32,.5)',1,2);line(c,PB.x,PB.y-18,SRV.x+10,SRV.y+6,'rgba(26,20,32,.5)',1,2);
    person(c,'me',PA.x,PA.y,{dir:'r'});person(c,'party2',PB.x,PB.y,{dir:'l'});t(c,'P1',PA.x-16,PA.y-12,P.txt,{ol:P.ink});t(c,'P2',PB.x+9,PB.y-12,P.txt,{ol:P.ink});
    const done=race&&rt>Math.max(race.aa,race.ab)+40;
    if(race){const pk=(p,c0,arr,col)=>{if(rt<c0||rt>arr+60)return;const f=clamp((rt-c0)/(arr-c0),0,1);const x=lerp(p.x,SRV.x+(p===PA?-10:10),f),y=lerp(p.y-18,SRV.y+6,f);R(c,x-2,y-2,5,5,P.ink);R(c,x-1,y-1,3,3,col);if(rt-c0<120)t(c,'CLICK',p.x,p.y-26,P.s3,{ol:P.ink,al:'center'});};
      pk(PA,race.ca,race.aa,P.a3);pk(PB,race.cb,race.ab,P.vi2);}
    if(!done)item(c,'coin1',0,coin.x,coin.y);
    else{const wp=race.w?PB:PA,lp=race.w?PA:PB,f=ease(clamp((rt-Math.max(race.aa,race.ab)-40)/(250/SLOW*4),0,1));c.drawImage(icon('coin1'),Math.round(lerp(coin.x,wp.x,f))-4,Math.round(lerp(coin.y,wp.y-10,f))-4);
      t(c,'GOT IT',wp.x,wp.y-26,P.ok,{ol:P.ink,al:'center'});t(c,'SORRY, NOT',lp.x,lp.y-32,P.s2,{ol:P.ink,al:'center'});t(c,'POSSIBLE.',lp.x,lp.y-26,P.s2,{ol:P.ink,al:'center'});}
    // timeline 0 to 400 ms of real time
    R(c,0,SH,W,H-SH,P.panel);R(c,0,SH,W,1,P.line);const x0=18,X=m=>Math.round(x0+clamp(m,0,400)/400*(W-x0-4)),ty=SH+3;
    t(c,'P1',2,ty+1,P.a3);t(c,'P2',2,ty+9,P.vi2);
    if(race){if(mode==='tick'){for(let k=-1;k<6;k++){const m=k*100-race.phase;if(m<0||m>400)continue;R(c,X(m),ty-1,1,16,'#4a3f5a');}}
      const lane=(c0,arr,y,col)=>{R(c,X(c0),y+2,Math.max(1,X(Math.min(arr,rt))-X(c0)),1,col);if(rt>=arr){R(c,X(arr),y,2,5,col);} R(c,X(c0),y,1,5,P.wh);};
      lane(race.ca,race.aa,ty,P.a3);lane(race.cb,race.ab,ty+8,P.vi2);R(c,X(Math.min(rt,400)),ty-2,1,18,'rgba(246,238,219,.5)');}
    for(const m of [0,100,200,300]){t(c,m+'',X(m),ty+17,P.dim,{al:'center'});}t(c,'400 MS',W-2,ty+17,P.dim,{al:'right'});
    setHud(root,'');const tot=wins[0]+wins[1]||1;
    ro.innerHTML=`races <b>${trial}</b> · P1 wins <b>${wins[0]}</b> (${Math.round(wins[0]/tot*100)}%) · P2 wins <b>${wins[1]}</b> (${Math.round(wins[1]/tot*100)}%)${mode==='tick'?` · same-tick ties settled by rank <b>${ties}</b> · rank now <b>${Math.floor(clock/60)%2===0?'P1':'P2'}</b> first`:''} · animation 8x slower`;}};
});

// ======================================================================
// G3: wait for the server, cosmetic prediction, full prediction
// ======================================================================
reg('predict',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root),snd=sndBtn(root);
  const SH=70,bg=grass(W,SH,121,{grid:1,ox:2}),hero={x:58,y:52},IT={x:82,y:46},STR={x:136,y:52},BAG={x:W-12,y:10};
  let mode='cos',now=0,a=null,itemOn=true,bag=4,bagFlash=-1e9,lies=0,ok=0,rej=0,idle=0,resp=0;
  q.seg('mode',v=>{mode=v;});q.on('rtt',()=>out(q,'rtt',q.v('rtt')+' ms'));out(q,'rtt',q.v('rtt')+' ms');
  const click=()=>{if(a&&!a.end)return;if(!itemOn)return;idle=0;const L=q.v('rtt'),tw=Math.random()*100,fail=q.v('rej');
    a={t0:now,L,srv:L/2,res:L/2+tw,rep:L+tw,fail,mode,ev:{}};if(snd())AU.tick();if(mode==='full'){itemOn=false;}};
  pointer(cv,([x,y],k)=>{if(k==='down'&&y<SH)click();});q.btn('pick',click);
  const fx=fixed();
  const step=dt=>{now+=dt;idle+=dt;if(!a){if(!itemOn&&now>resp)itemOn=true;if(idle>3500){click();}return;}const tt=now-a.t0;
    if(!a.ev.rep&&tt>=a.rep){a.ev.rep=1;if(!a.fail){ok++;if(a.mode!=='full'){itemOn=false;a.fly=now;}if(snd())AU.ok2();}
      else{rej++;if(a.mode==='full'){lies++;bag--;bagFlash=now;a.back=now;if(snd())AU.bad();}else{a.shake=now;if(snd())AU.bad();}a.msg=now;}}
    if(a.mode==='full'&&!a.ev.add&&tt>=0){a.ev.add=1;a.fly=now;}
    if(a.fly&&!a.ev.bag&&now-a.fly>=250){a.ev.bag=1;if(a.mode==='full'||!a.fail){bag++;}}
    if(a.fail&&a.ev.rep&&!a.ev.rem&&now-a.t0>=a.rep+(a.mode==='full'?380:160)){a.ev.rem=1;itemOn=false;a.other=now;}/* the remove arrives with the picker's ID */
    if(now-a.t0>a.rep+1300){a.end=1;resp=now+400;a=null;}};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    person(c,'me',hero.x,hero.y,{dir:'r'});person(c,'party2',STR.x,STR.y,{dir:'l'});t(c,'OTHER',STR.x,STR.y-24,P.s2,{ol:P.ink,al:'center'});
    const tt=a?now-a.t0:1e9;
    if(itemOn){let dx=0,dy=0;if(a&&a.mode==='cos'&&tt<120)dy=-Math.round(Math.sin(tt/120*Math.PI)*4);if(a&&a.shake&&now-a.shake<120)dx=((now-a.shake)/30|0)%2?2:-2;item(c,'ring',3,IT.x+dx,IT.y+dy,{time:now,gy:IT.y});
      if(a&&a.mode==='cos'&&!a.ev.rep)box(c,IT.x-7,IT.y-7,14,14,'rgba(255,240,180,.8)');}
    if(a&&a.fly){const p=ease(clamp((now-a.fly)/250,0,1));if(p<1){const x=lerp(IT.x,BAG.x,p),y=lerp(IT.y,BAG.y,p)-Math.sin(p*Math.PI)*10;c.drawImage(icon('ring'),Math.round(x)-4,Math.round(y)-4);}}
    if(a&&a.back){const p=ease(clamp((now-a.back)/300,0,1));const x=lerp(BAG.x,IT.x,p),y=lerp(BAG.y,IT.y,p)-Math.sin(p*Math.PI)*16;if(p<1)c.drawImage(icon('ring'),Math.round(x)-4,Math.round(y)-4);else if(!a.other)item(c,'ring',3,IT.x,IT.y,{time:now});}
    if(a&&a.other){const p=ease(clamp((now-a.other)/250,0,1));if(p<1){c.drawImage(icon('ring'),Math.round(lerp(IT.x,STR.x,p))-4,Math.round(lerp(IT.y,STR.y-10,p))-4);}}
    if(a&&a.msg&&now-a.msg<1200){t(c,a.mode==='full'?'IT CAME BACK OUT?':'SORRY, NOT POSSIBLE.',hero.x+10,hero.y-28,a.mode==='full'?P.r3:P.s2,{ol:P.ink,al:'center'});}
    const fl=now-bagFlash<400&&((now-bagFlash)/100|0)%2===0;R(c,BAG.x-10,BAG.y-8,22,16,fl?'#7a1e28':'rgba(26,20,32,.7)');c.drawImage(icon('pack'),BAG.x-8,BAG.y-4);t(c,String(bag),BAG.x+9,BAG.y-2,fl?P.r3:P.txt,{al:'right'});
    // timeline
    R(c,0,SH,W,H-SH,P.panel);R(c,0,SH,W,1,P.line);const x0=30,X=m=>Math.round(x0+clamp(m,0,700)/700*(W-x0-4)),ty=SH+4;t(c,'CLIENT',2,ty,P.mute);t(c,'SERVER',2,ty+14,P.mute);R(c,x0,ty+7,W-x0-4,1,'#2f2838');R(c,x0,ty+19,W-x0-4,1,'#2f2838');
    for(const m of [0,100,200,300,400,500,600,700])R(c,X(m),ty+21,1,m%500?1:3,P.dim);t(c,'700 MS',W-2,ty+24,P.dim,{al:'right'});
    if(a||true){const A0=a||null;if(A0){const nowx=X(Math.min(700,tt));R(c,X(0),ty+3,1,7,P.wh);line(c,X(0),ty+9,X(A0.srv),ty+17,'#6a6278',1,1);R(c,X(A0.srv),ty+16,Math.max(1,X(A0.res)-X(A0.srv)),4,'#4a3f5a');R(c,X(A0.res),ty+15,2,6,A0.fail?P.red:P.ok);
        if(tt>=A0.res)line(c,X(A0.res),ty+17,X(A0.rep),ty+9,'#6a6278',1,1);if(tt>=A0.rep)R(c,X(A0.rep),ty+2,2,8,A0.fail?P.red:P.ok);
        if(A0.mode!=='wait')R(c,X(0)+1,ty+5,4,3,A0.mode==='full'?P.a3:P.o2);R(c,nowx,ty,1,22,'rgba(246,238,219,.5)');}}
    setHud(root,'');const L=q.v('rtt'),first=mode==='wait'?L:0;
    ro.innerHTML=`first feedback after the click <b>${first} ms</b> · the item leaves the ground at <b>${mode==='full'?'0 ms':'RTT + tick wait'}</b> · accepted <b>${ok}</b> · rejected <b>${rej}</b> · items that came back out of the bag <b>${lies}</b>`;}};
});

// ======================================================================
// G1 / G4: the authoritative move, step by step, and a crash between
// two non-transactional saves (the dupe) against GUID + one transaction
// ======================================================================
reg('dupe',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const SH=40,bg=grass(W,SH,131),CH={x:30,y:26},HE={x:136,y:32};
  const STEPS={two:['REQUEST MOVE (SLOT 3)','RE-RESOLVE, SAME SPRITE?','CHECK RIGHTS, REACH, FITS','MOVE IN MEMORY','SAVE PLAYER (TX 1)','SAVE HOUSE (TX 2)','REPLY, BROADCAST'],
               guid:['REQUEST MOVE (GUID 51)','RE-RESOLVE BY GUID','CHECK RIGHTS, REACH, FITS','MOVE IN MEMORY','UPDATE ... WHERE GUID','  AND CONTAINER; COMMIT','REPLY, BROADCAST']};
  let mode='two',st=-1,crashed=null,now=0,lastStep=0,auto=true,dupes=0,runs=0,flash=-1e9;
  // where the sword is: memory (mem) and database (db)
  let mem='house',db={player:false,house:true,guid:'house'};
  const reset=()=>{st=-1;crashed=null;mem='house';db={player:false,house:true,guid:'house'};};
  const apply=i=>{if(i===3)mem='bag';
    if(mode==='two'){if(i===4)db.player=true;if(i===5)db.house=false;}else if(i===5){db.guid='bag';}};
  const next=()=>{if(crashed){reset();return;}if(st>=6){reset();runs++;return;}st++;apply(st);lastStep=now;};
  const crash=()=>{if(crashed||st<0)return;crashed={at:st,t:now};flash=now;
    // restart: memory reloads from the database
    const n=mode==='two'?(db.player?1:0)+(db.house?1:0):1;if(n>1)dupes++;crashed.n=n;mem=mode==='two'?(db.player&&db.house?'both':db.player?'bag':'house'):db.guid;};
  q.seg('mode',v=>{mode=v;reset();});q.btn('next',()=>{auto=false;next();});q.btn('crash',()=>{auto=false;crash();});q.btn('auto',b=>{auto=!auto;});
  const fx=fixed();let loopN=0;
  const step=dt=>{now+=dt;if(!auto)return;if(crashed){if(now-crashed.t>2600){reset();loopN++;}return;}
    if(now-lastStep>900){if(mode==='two'&&st===4&&loopN%2===0){crash();return;}if(mode==='guid'&&st===4&&loopN%2===0){crash();return;}next();if(st===-1)loopN++;}};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    c.drawImage(icon('chest'),CH.x-4,CH.y-6);c.drawImage(icon('chest'),CH.x-4,CH.y-6);t(c,'HOUSE',CH.x,CH.y+4,P.txt,{ol:P.ink,al:'center'});
    person(c,'me',HE.x,HE.y,{dir:'l'});c.drawImage(icon('pack'),HE.x-18,HE.y-12);
    const inBag=mem==='bag'||mem==='both',inHouse=mem==='house'||mem==='both';
    if(inHouse)item(c,'sword',3,CH.x,CH.y-14,{time:now,shadow:false});if(inBag)item(c,'sword',3,HE.x-14,HE.y-20,{time:now,shadow:false});
    if(st===3&&!crashed&&now-lastStep<300){const p=ease((now-lastStep)/300);c.drawImage(icon('sword'),Math.round(lerp(CH.x,HE.x-14,p))-4,Math.round(lerp(CH.y-14,HE.y-20,p))-4);}
    if(crashed){const k=now-crashed.t;if(k<200){c.fillStyle='rgba(255,255,255,'+(1-k/200)*.7+')';c.fillRect(0,0,W,SH);}
      t(c,crashed.n>1?'RESTART: 2 SWORDS. DUPE!':'RESTART: 1 SWORD',W/2,3,crashed.n>1?P.red:P.ok,{ol:P.ink,al:'center'});}
    // steps
    R(c,0,SH,W,H-SH,P.panel);R(c,0,SH,W,1,P.line);const L=STEPS[mode];
    L.forEach((s,i)=>{const y=SH+4+i*8,on=i===st,done=i<st;if(on)R(c,1,y-1,98,7,crashed?'#5a1e28':'#3a3148');t(c,s,3,y,on?P.o2:done?P.s3:P.dim);
      if(mode==='two'&&i===4&&st===4&&!crashed){t(c,'< CRASH HERE',W-2,y+4,P.r3,{al:'right'});}});
    // database panel
    const dx=102,dy=SH+3;R(c,dx,dy,W-dx-2,H-dy-3,'#16121c');box(c,dx,dy,W-dx-2,H-dy-3,P.line);t(c,'DATABASE',dx+3,dy+3,P.mute);
    if(mode==='two'){t(c,'PLAYER_ITEMS',dx+3,dy+12,P.s2);t(c,db.player?'P7 SLOT 3 SWORD':'(EMPTY)',dx+5,dy+19,db.player?P.o2:P.dim);
      t(c,'HOUSE_ITEMS',dx+3,dy+29,P.s2);t(c,db.house?'H2 SLOT 1 SWORD':'(EMPTY)',dx+5,dy+36,db.house?P.o2:P.dim);}
    else{t(c,'ITEMS',dx+3,dy+12,P.s2);t(c,'GUID CONTAINER',dx+5,dy+19,P.dim);t(c,'51   '+(db.guid==='bag'?'BAG P7':'HOUSE H2'),dx+5,dy+27,P.o2);t(c,'ONE ROW, ONE TX',dx+3,dy+40,P.ok);}
    setHud(root,'');
    ro.innerHTML=`${mode==='two'?'Two saves, as TFS stores items by player, parent and slot':'One items table keyed by a 64-bit GUID, one transaction per move'} · step <b>${st<0?'-':st+1}</b> of 7 · dupes so far <b>${dupes}</b>${auto?' · auto playing; press Next step to take over':''}`;}};
});

// ======================================================================
// G5: area of interest, the 10-per-tile cap, merging and a despawn heap
// ======================================================================
reg('aoi',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const TS=4,MW=40,MH=27,OX=5,OY=2,VW=18,VH=14,LIFE=30000,BLINK=10000;/* life compressed; 10 s blink as proposed */
  const map=(()=>{const [cv0,g]=mk(MW*TS,MH*TS);const r=mkRng(5);for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){g.fillStyle=r()<.5?P.g1:mixHex(P.g1,P.g2,.5);g.fillRect(x*TS,y*TS,TS,TS);}g.fillStyle='rgba(20,40,24,.35)';for(let x=0;x<MW;x+=4)g.fillRect(x*TS,0,1,MH*TS);for(let y=0;y<MH;y+=4)g.fillRect(0,y*TS,MW*TS,1);return cv0;})();
  const V=[{x:10,y:8,vx:.6,vy:.3,col:P.a3},{x:26,y:16,vx:-.4,vy:.5,col:P.vi2},{x:32,y:6,vx:.3,vy:-.4,col:P.o2},{x:14,y:20,vx:.5,vy:-.2,col:P.pk}];
  let now=0,items=[],heap=[],pk=[],bytes=[],acc=0,cnt={add:0,rem:0,merge:0,hidden:0,sends:0},idn=0;
  const hpush=e=>{heap.push(e);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p].d<=heap[i].d)break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const hpop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l].d<heap[m].d)m=l;if(r<heap.length&&heap[r].d<heap[m].d)m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  const sees=(v,tx,ty)=>Math.abs(tx-v.x)<=VW/2&&Math.abs(ty-v.y)<=VH/2;
  const onTile=(tx,ty)=>items.filter(i=>i.tx===tx&&i.ty===ty&&!i.gone);
  const send=(tx,ty,b,col)=>{for(const v of V)if(sees(v,tx,ty)){cnt.sends++;bytes.push({t:now,b});if(pk.length<120)pk.push({x0:tx,y0:ty,v,t0:now,col});}};
  const add=(tx,ty,k,tier)=>{tx=clamp(tx,0,MW-1);ty=clamp(ty,0,MH-1);const here=onTile(tx,ty);
    if(q.v('merge')&&k==='coin1'){const m=here.find(i=>i.k==='coin1');if(m){m.n++;cnt.merge++;return;}}
    const it={id:++idn,tx,ty,k,tier,n:1,born:now,d:now+LIFE};items.push(it);hpush(it);
    const rank=here.concat([it]).sort((a,b)=>b.tier-a.tier).indexOf(it);if(q.v('cap')&&rank>=10){it.hidden=true;cnt.hidden++;return;}
    cnt.add++;send(tx,ty,20,TIER[tier]);};
  const rnd1=()=>{const tiers=[0,0,0,0,1,1,2,3,4],tier=tiers[(Math.random()*tiers.length)|0];return [Math.random()<.45?'coin1':['sword','gem','ring','potion','shield'][(Math.random()*5)|0],tier];};
  q.btn('boss',()=>{const tx=20,ty=13;for(let i=0;i<15;i++){const [k,tr]=rnd1();add(tx,ty,k,tr);}});
  q.on('rate',()=>out(q,'rate',q.v('rate')+' /s'));out(q,'rate',q.v('rate')+' /s');
  const fx=fixed();
  const step=dt=>{now+=dt;acc+=q.v('rate')*dt/1000;while(acc>=1){acc--;const [k,tr]=rnd1();const v=V[(Math.random()*V.length)|0];add(Math.round(v.x+(Math.random()*12-6)),Math.round(v.y+(Math.random()*8-4)),k,tr);}
    for(const v of V){v.x+=v.vx*dt/1000*1.5;v.y+=v.vy*dt/1000*1.5;if(v.x<4||v.x>MW-4)v.vx*=-1;if(v.y<3||v.y>MH-3)v.vy*=-1;}
    // one wake-up: pop everything due from the heap
    while(heap.length&&heap[0].d<=now){const it=hpop();it.gone=true;if(!it.hidden){cnt.rem++;send(it.tx,it.ty,9,P.r3);}
      // a hidden item moves up when one on its tile goes
      const rest=onTile(it.tx,it.ty).sort((a,b)=>b.tier-a.tier);rest.slice(0,10).forEach(r=>{if(r.hidden){r.hidden=false;cnt.add++;send(r.tx,r.ty,20,TIER[r.tier]);}});}
    items=items.filter(i=>!i.gone);pk=pk.filter(p=>now-p.t0<400);bytes=bytes.filter(b=>now-b.t<1000);};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(map,OX,OY);
    for(const v of V){const x=OX+Math.round((v.x-VW/2)*TS),y=OY+Math.round((v.y-VH/2)*TS);dashBox(c,x,y,VW*TS,VH*TS,v.col);}
    const tc=new Map();for(const it of items){const k=it.tx+','+it.ty;tc.set(k,(tc.get(k)||0)+1);}
    for(const it of items){if(it.hidden)continue;const left=it.d-now;if(left<BLINK&&((now/125)|0)%2)continue;R(c,OX+it.tx*TS+1,OY+it.ty*TS+1,2,2,it.k==='coin1'?P.o2:TIER[it.tier]);}
    let busiest=null,bn=0;for(const [k,n] of tc)if(n>bn){bn=n;busiest=k;}
    for(const v of V){const x=OX+Math.round(v.x*TS),y=OY+Math.round(v.y*TS);R(c,x-2,y-2,5,5,P.ink);R(c,x-1,y-1,3,3,v.col);}
    for(const p of pk){const f=clamp((now-p.t0)/400,0,1),x=lerp(OX+p.x0*TS+2,OX+p.v.x*TS,f),y=lerp(OY+p.y0*TS+2,OY+p.v.y*TS,f);PX(c,x,y,p.col);}
    // inset: the busiest tile and what a client gets from it
    const iy=OY+MH*TS+2;R(c,0,iy-1,W,H-iy+1,P.panel);R(c,0,iy-1,W,1,P.line);
    if(busiest&&bn>1){const [tx,ty]=busiest.split(',').map(Number);box(c,OX+tx*TS-1,OY+ty*TS-1,TS+2,TS+2,P.wh);const arr=onTile(tx,ty).sort((a,b)=>b.tier-a.tier);
      t(c,'BUSIEST TILE: '+arr.length+' ITEMS',3,iy+2,P.s3);arr.slice(0,11).forEach((it,i)=>{const x=3+i*13,y=iy+8;R(c,x,y,12,12,it.hidden?'#2a1820':'#1a1420');c.drawImage(img12(it.k,it.tier),x,y);if(it.hidden){line(c,x,y,x+11,y+11,P.red);line(c,x+11,y,x,y+11,P.red);}if(it.n>1)t(c,String(it.n),x+12,y+7,P.txt,{ol:P.ink,al:'right'});});
      if(arr.length>11)t(c,'+'+(arr.length-11),W-3,iy+11,P.mute,{al:'right'});}
    else t(c,'PRESS BOSS SPILL TO FILL ONE TILE',3,iy+2,P.mute);
    setHud(root,'');const bps=bytes.reduce((s,b)=>s+b.b,0);
    ro.innerHTML=`bytes per second to the 4 clients <b>${bps}</b> · adds sent <b>${cnt.add}</b> (20 B) · removes <b>${cnt.rem}</b> (9 B) · held back by the 10 cap <b>${items.filter(i=>i.hidden).length}</b> · coins merged <b>${cnt.merge}</b> · ground items <b>${items.length}</b> · next despawn in <b>${heap.length?((heap[0].d-now)/1000).toFixed(1):'-'} s</b>`;}};
});

// ======================================================================
// G6: crowd LOD around a boss corpse: own, party, others
// ======================================================================
reg('crowd',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root),snd=sndBtn(root);
  const bg=grass(W,H,141),BOSS={x:85,y:58},m=meter(.08);
  const PL=[];{const r=mkRng(9);for(let i=0;i<30;i++){const a=i/30*6.283+r()*.1,rad=44+r()*10;PL.push({x:BOSS.x+Math.cos(a)*rad*1.45,y:BOSS.y+Math.sin(a)*rad*.95,cls:i===22?'own':[3,8,13,17].includes(i)?'party':'other'});}}
  const me=PL[22],LOOKC={own:'me',party:'party',other:'other'};
  const NAMES={sword:'SWORD',gem:'GEM',ring:'RING',shield:'SHIELD',rune:'RUNE',coin1:'GOLD',helmet:'HELM',star:'SUNSTONE'};
  let items=[],now=0,killT=-1e9,idle=0,stats={glow:0,lab:0,arc:0,beam:0,snd:0};
  const kill=()=>{idle=0;killT=now;items=[];const n=q.v('n'),r=mkRng((now|0)+1);
    for(let i=0;i<n;i++){const u=r(),cls=u<.05?'own':u<.2?'party':'other';const owners=PL.filter(p=>p.cls===cls),ow=owners[(r()*owners.length)|0];const a=r()*6.283,d=Math.sqrt(r())*36;
      const tr=r(),tier=tr<.5?0:tr<.75?1:tr<.9?2:tr<.97?3:4;const ks=Object.keys(NAMES);items.push({k:tier===4?'star':ks[(r()*(ks.length-1))|0],tier,cls,ow,x:BOSS.x+Math.cos(a)*d*1.5,y:BOSS.y+Math.sin(a)*d*.8,t0:Math.min(600,i*40/Math.max(1,n/15)),played:false});}};
  q.btn('kill',kill);q.on('n',()=>out(q,'n',q.v('n')));out(q,'n',q.v('n'));kill();
  const fx=fixed();
  const step=dt=>{now+=dt;idle+=dt;if(now-killT>7000&&idle>2000)kill();};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    const lod=q.v('lod'),naive=q.v('naive'),hold=q.v('hold'),age=now-killT;stats={glow:0,lab:0,arc:0,beam:0,snd:0};
    if(age<300)person(c,'elite',BOSS.x,BOSS.y,{dir:'d'});else corpse(c,'elite',BOSS.x,BOSS.y);
    for(const p of PL)if(p.y<BOSS.y)person(c,LOOKC[p.cls],p.x,p.y,{dir:'d',shadow:true});
    m.t0();const labels=[];
    for(const it of items){const ta=age-300-it.t0;if(ta<0)continue;const full=!lod||it.cls==='own',party=it.cls==='party';
      const fly=age>4300+it.t0*.2;if(fly){const f=ease(clamp((age-4300-it.t0*.2)/250,0,1));if(f>=1)continue;c.drawImage(icon(it.k),Math.round(lerp(it.x,it.ow.x,f))-4,Math.round(lerp(it.y,it.ow.y-8,f))-4);continue;}
      const arc=(full||party)&&ta<400;let y=it.y;if(arc){const p=ta/400;y=lerp(BOSS.y-6,it.y,p)-Math.sin(p*Math.PI)*20;stats.arc++;}
      const x=arc?lerp(BOSS.x,it.x,ta/400):it.x;
      if(!arc&&!it.played&&(full)){it.played=true;if(it.cls==='own'&&it.tier>=3&&snd()){AU.sting(it.tier);}stats.snd++;}
      const glow=(full||party)&&it.tier>=2&&!arc;
      if(glow){stats.glow++;if(naive){c.save();c.shadowColor=TIER[it.tier];c.shadowBlur=6;c.fillStyle=TIER[it.tier];c.fillRect(Math.round(x)-2,Math.round(y)-2,4,4);c.restore();}else drawHalo(c,x,y,it.tier,.6);}
      const beam=it.tier===4&&(full||party||ta<2000);if(beam)stats.beam++;
      item(c,it.k,it.tier,x,y,{gy:it.y,beam,beamH:22,time:now,marks:full||party||it.tier>=4,shadow:true});
      if(full||(party&&hold))labels.push(it);}
    // labels: the bitmap font (cached glyph atlas), or fillText when naive
    for(const it of labels){stats.lab++;if(naive){c.font='6px monospace';c.fillStyle=TIER[it.tier];c.fillText(NAMES[it.k],Math.round(it.x)-8,Math.round(it.y)-8);}else label(c,NAMES[it.k],it.tier,it.x,it.y-13);}
    const ms=m.t1();
    for(const p of PL)if(p.y>=BOSS.y)person(c,LOOKC[p.cls],p.x,p.y,{dir:'u'});
    t(c,'YOU',me.x,me.y-24,P.a3,{ol:P.ink,al:'center'});
    // visible budget: about 200 items per screen
    const vis=items.filter(i=>age-300-i.t0>=0).length;R(c,3,H-8,60,4,P.ink);R(c,4,H-7,Math.min(58,Math.round(58*vis/600)),2,vis>200?P.r3:P.ok);R(c,4+Math.round(58*200/600),H-9,1,6,P.wh);t(c,'200',4+Math.round(58*200/600),H-15,P.s3,{ol:P.ink,al:'center'});
    setHud(root,'');
    ro.innerHTML=`items on screen <b>${vis}</b> · arcs <b>${stats.arc}</b> · glows <b>${stats.glow}</b> · beams <b>${stats.beam}</b> · labels <b>${stats.lab}</b> · item draw here <b>${fms(ms)} ms</b>, measured in this page<br>report, measured on the M4 GPU: 200 items 1.14 ms cheap against 4.85 ms naive; 600 items 2.46 against 13.38 ms`;}};
});

// ======================================================================
// H1: a Tibia death roll, blessings, red skull, amulet of loss,
// and 1000 deaths as a histogram
// ======================================================================
const DSLOTS=[{k:'pack',n:'BACKPACK',bp:1,tier:0},{k:'helmet',n:'HELMET',tier:2},{k:'amulet',n:'AMULET',tier:3},{k:'armor',n:'ARMOR',tier:2},{k:'legs',n:'LEGS',tier:1},
  {k:'boots',n:'BOOTS',tier:1},{k:'sword',n:'SWORD',tier:4},{k:'shield',n:'SHIELD',tier:2},{k:'ring',n:'RING',tier:3},{k:'rune',n:'AMMO',tier:0}];
const BLESS=[100,70,45,25,10,0];
function deathRoll(rng,bless,skull,aol){if(skull)return DSLOTS.map(()=>true);if(aol)return DSLOTS.map(()=>false);const p=BLESS[Math.min(5,bless)]/100;return DSLOTS.map(s=>rng()<(s.bp?p:p/10));}
reg('deathroll',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const SH=62,bg=grass(W,SH,151);let lost=DSLOTS.map(()=>false),hist=null,now=0,dieT=-1e9,same=null,mean=0,rng=mkRng(77);
  const params=()=>[+(q.segv('bless')||0),q.v('skull'),q.v('aol')];
  const die=()=>{const [b,s,a]=params();const r=q.v('clock')?mkRng(Math.floor(Date.now()/1000)):rng;lost=deathRoll(r,b,s,a);dieT=now;same=null;};
  const twice=()=>{const [b,s,a]=params();const sec=Math.floor(Date.now()/1000);const r1=q.v('clock')?mkRng(sec):rng,first=deathRoll(r1,b,s,a);const r2=q.v('clock')?mkRng(sec):rng,second=deathRoll(r2,b,s,a);lost=second;dieT=now;same=first.every((v,i)=>v===second[i]);};
  const many=()=>{const [b,s,a]=params();const r=mkRng((Math.random()*1e9)|0);hist=new Array(11).fill(0);let sum=0;for(let i=0;i<1000;i++){const n=deathRoll(r,b,s,a).filter(Boolean).length;hist[n]++;sum+=n;}mean=sum/1000;};
  q.seg('bless',()=>{many();die();});q.on('skull',()=>{many();die();});q.on('aol',()=>{many();die();});q.btn('die',die);q.btn('many',many);q.btn('twice',twice);
  many();die();const fx=fixed();let idle=0;root.addEventListener('click',()=>{idle=-8000;});
  const step=dt=>{now+=dt;idle+=dt;if(idle>3200){idle=0;die();}};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    const age=now-dieT;corpse(c,'me',112,40);t(c,'YOUR CORPSE',112,46,P.s3,{ol:P.ink,al:'center'});
    // inventory, 10 slots
    R(c,3,3,62,26,'rgba(26,20,32,.8)');DSLOTS.forEach((s,i)=>{const x=5+(i%5)*12,y=5+Math.floor(i/5)*12;R(c,x,y,11,11,P.panel2);if(!lost[i])c.drawImage(icon(s.k),x+1,y+1);else{R(c,x,y,11,11,'#3a1820');}});
    t(c,'KEPT',34,31,P.s3,{ol:P.ink,al:'center'});
    // lost items arc into the corpse, then sit on it
    const L=DSLOTS.map((s,i)=>i).filter(i=>lost[i]);L.forEach((i,j)=>{const sx=5+(i%5)*12+5,sy=5+Math.floor(i/5)*12+5,tx=92+(j%5)*10,ty=20+Math.floor(j/5)*8;const p=clamp((age-j*40)/400,0,1),e=ease(p);
      const x=lerp(sx,tx,e),y=lerp(sy,ty,e)-Math.sin(p*Math.PI)*12;c.drawImage(icon(DSLOTS[i].k),Math.round(x)-4,Math.round(y)-4);});
    const [b,s,a]=params();if(s){t(c,'RED SKULL: ALL DROP',W-3,52,P.red,{ol:P.ink,al:'right'});}else if(a){t(c,'AMULET OF LOSS: NO ROLL',W-3,52,P.o2,{ol:P.ink,al:'right'});}
    if(same!==null)t(c,same?'SAME ROLLS TWICE':'DIFFERENT ROLLS',W/2,3,same?P.r3:P.ok,{ol:P.ink,al:'center'});
    // histogram of items lost over 1000 deaths
    R(c,0,SH,W,H-SH,P.panel);R(c,0,SH,W,1,P.line);t(c,'1000 DEATHS: ITEMS LOST',3,SH+3,P.mute);t(c,'MEAN '+mean.toFixed(2),W-3,SH+3,P.o2,{al:'right'});
    if(hist){const mx=Math.max(...hist),bw=13,x0=12,by=H-9;hist.forEach((n,i)=>{const h=Math.round((H-SH-30)*n/mx);R(c,x0+i*14,by-h,bw,h,i===lost.filter(Boolean).length?P.o2:P.a2);t(c,String(i),x0+i*14+6,by+2,P.dim,{al:'center'});if(n&&h>7)t(c,String(n),x0+i*14+6,by-h-6,P.s3,{al:'center'});});}
    setHud(root,'');const p=BLESS[Math.min(5,b)];const atLeast=1-Math.pow(1-p/1000,9);
    ro.innerHTML=`${b} blessing${b===1?'':'s'}: backpack <b>${s?100:a?0:p}%</b>, each of the 9 other slots <b>${s?100:a?0:p/10}%</b> · chance to lose at least one of the 9 <b>${s?100:a?0:Math.round(atLeast*100)}%</b> · this death lost <b>${lost.filter(Boolean).length}</b>`;}};
});

// ======================================================================
// H2: one inventory, four protection rules
// ======================================================================
reg('protect',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const INV=[{k:'sword',v:9000,tier:4},{k:'armor',v:6000,tier:3},{k:'helmet',v:3500,tier:2},{k:'shield',v:2500,tier:2},{k:'legs',v:2000,tier:2},{k:'ring',v:1500,tier:3},{k:'amulet',v:1200,tier:3},{k:'boots',v:800,tier:1},{k:'pack',v:600,tier:0,bp:1},{k:'potion',v:100,tier:0}];
  const SYS=['OSRS','TIBIA','UO','ALBION'];let res=null,seed=1,now=0,dieT=0;
  const roll=()=>{const r=mkRng(seed++),skull=q.v('skull');const out={};
    // OSRS: keep 3 most valuable, +1 with Protect Item; skulled keep 0 (+1)
    const keepN=(skull?0:3)+(q.v('pi')?1:0);out.OSRS=INV.map((it,i)=>i<keepN?'kept':'drop');
    // Tibia: blessings table, a red skull drops everything
    const b=q.v('bless'),p=BLESS[b]/100;out.TIBIA=INV.map(it=>skull?'drop':(r()<(it.bp?p:p/10)?'drop':'kept'));
    // UO: insured items return
    const ins=q.v('ins');out.UO=INV.map((it,i)=>i<ins?'kept':'drop');
    // Albion black zone: everything drops, about a third destroyed (reported)
    out.ALBION=INV.map(()=>r()<1/3?'gone':'drop');res=out;dieT=now;};
  const upd=()=>{out(q,'bless',q.v('bless'));out(q,'ins',q.v('ins'));roll();};
  q.on('skull',roll);q.on('pi',roll);q.on('bless',upd);q.on('ins',upd);q.btn('die',roll);upd();
  const fx=fixed();
  const step=dt=>{now+=dt;};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.panel;c.fillRect(0,0,W,H);const cw=Math.floor(W/4),tot=INV.reduce((s,i)=>s+i.v,0);
    SYS.forEach((n,si)=>{const x0=si*cw;if(si)R(c,x0,0,1,H,P.line);t(c,n,x0+cw/2,3,P.s3,{al:'center'});let kept=0;
      INV.forEach((it,i)=>{const st=res[n][i],x=x0+5+(i%2)*19,y=12+Math.floor(i/2)*17,age=now-dieT-i*25;R(c,x,y,15,15,st==='kept'?P.panel2:st==='gone'?'#141018':'#341a24');box(c,x,y,15,15,st==='kept'?(it.tier?TIER[it.tier]:P.line):st==='gone'?'#2a2430':P.r1);
        if(st!=='gone'||age<200){const dy=st==='kept'?0:Math.round(Math.min(1,Math.max(0,age)/250)*3);c.globalAlpha=st==='kept'?1:.55;c.drawImage(icon(it.k),x+4,y+4+dy);c.globalAlpha=1;}
        if(st==='gone'&&age>=200){line(c,x+3,y+3,x+11,y+11,P.s0);line(c,x+11,y+3,x+3,y+11,P.s0);}if(st==='kept')kept+=it.v;});
      const f=kept/tot;bar(c,x0+5,H-12,cw-10,3,f,f>.5?P.ok:f>.2?P.o1:P.red);t(c,Math.round(f*100)+'% KEPT',x0+cw/2,H-7,P.s3,{al:'center'});});
    setHud(root,'');const v=n=>INV.reduce((s,it,i)=>s+(res[n][i]==='kept'?it.v:0),0);
    ro.innerHTML=`value kept, illustrative prices: OSRS <b>${v('OSRS')}</b> · Tibia <b>${v('TIBIA')}</b> · UO <b>${v('UO')}</b> · Albion <b>0</b> (<b>${res.ALBION.filter(s=>s==='gone').length}</b> of 10 destroyed, the rest to the looter) · of <b>${tot}</b> gp`;}};
});

// ======================================================================
// H3: a grave timer that pauses offline against a corpse that rots anyway
// ======================================================================
reg('grave',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const bg=grass(W,H,161);let gt=0,online=true,osrs=900,ast=1200,offT=0;const GRAVE=spr(["..oooo..",".osssso.","osSSSSso","osSoSSso","osoooSso","osSoSSso","osSSSSso","osSSSSso","oDDDDDDo","oooooooo"],{s:P.s3,S:P.s2,D:P.s1});
  const reset=()=>{gt=0;osrs=900;ast=1200;offT=0;};
  const btn=q.btn('net',b=>{online=!online;b.textContent=online?'Disconnect':'Reconnect';});q.btn('die',reset);
  const fx=fixed();
  const step=dt=>{const sp=+(q.segv('spd')||60),g=dt/1000*sp;gt+=g;if(online){osrs=Math.max(0,osrs-g);ast=Math.max(0,ast-g);}else offT+=g;};
  const mmss=s=>{s=Math.max(0,Math.ceil(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
  return {tick(dt){fx(dt,step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    const lanes=[{n:'OSRS GRAVE',sub:'15 MIN, PAUSES OFFLINE',left:osrs,max:900,kind:'grave'},{n:'TIBIA CORPSE',sub:'1200 + 1200 S, THEN BONES',left:Math.max(0,3600-gt),max:3600,kind:'tibia'},{n:'ASTERION PVE',sub:'1200 S, PAUSES OFFLINE',left:ast,max:1200,kind:'ast'}];
    lanes.forEach((L,i)=>{const y=4+i*26;R(c,0,y-2,W,24,'rgba(26,20,32,.55)');t(c,L.n,32,y,P.txt);t(c,L.sub,32,y+7,P.mute);
      const X=16,Y=y+16;
      if(L.kind==='grave'){if(L.left>0)c.drawImage(GRAVE,X-4,Y-10);}
      else if(L.kind==='tibia'){if(gt<1200)corpse(c,'me',X,Y);else if(gt<2400){c.globalAlpha=.75;corpse(c,'me',X,Y);c.globalAlpha=1;}else if(gt<3600)c.drawImage(icon('bone'),X-4,Y-8);}
      else if(L.left>0)corpse(c,'me',X,Y);
      // timer bar
      const bw=W-34-4;if(L.kind==='tibia'){const seg=s=>Math.round(bw*s/3600);R(c,32,y+14,bw,4,'#231d2b');R(c,32,y+14,seg(Math.min(gt,1200)),4,P.s1);R(c,32+seg(1200),y+14,seg(clamp(gt-1200,0,1200)),4,P.s0);R(c,32+seg(2400),y+14,seg(clamp(gt-2400,0,1200)),4,'#3a3346');R(c,32+seg(1200),y+13,1,6,P.ink);R(c,32+seg(2400),y+13,1,6,P.ink);
        t(c,gt<2400?'LOOTABLE '+mmss(2400-gt):gt<3600?'BONES '+mmss(3600-gt):'GONE',W-3,y,gt<2400?P.o2:P.s1,{al:'right'});}
      else{bar(c,32,y+14,bw,4,L.left/L.max,L.left>0?(online?P.ok:P.a3):P.red);t(c,L.left>0?mmss(L.left)+(online?'':' PAUSED'):'GONE',W-3,y,L.left>0?(online?P.o2:P.a3):P.red,{al:'right'});}});
    const y=H-12;R(c,0,y-2,W,14,P.panel);t(c,online?'ONLINE':'OFFLINE',3,y+2,online?P.ok:P.r3);t(c,'GAME TIME '+mmss(gt)+(offT>0?' · OFFLINE '+mmss(offT):''),W-3,y+2,P.s2,{al:'right'});
    setHud(root,'');ro.innerHTML=`time runs <b>${q.segv('spd')||60}x</b> · you are <b>${online?'online':'offline'}</b> · disconnect to see which clocks stop`;}};
});

// ======================================================================
// H4 / H5: who loots a player corpse, and the death recap
// ======================================================================
reg('corpseloot',root=>{const {cv,c,W,H}=cv2(root),q=ctl(root),ro=RO(root);
  const SH=78,bg=grass(W,SH,171),COR={x:85,y:44};
  const K=[{n:'BRAKK',look:'foe',x:38,y:30},{n:'VELA',look:'foe2',x:34,y:58}],F={n:'TOMAS',look:'party',x:132,y:30},S0={x:160,y:70};
  const LOOT=[['sword',4],['ring',3],['armor',2],['potion',0],['coin3',0]];
  let mode='ast',gt=0,real=0,v=null,items=[],keys=0,dead=false,msg='',chan=null,hit=-1e9,yellow=-1e9,showDesc=-1e9,taken=null,friends=-1e9;
  const kill=()=>{gt=0;real=0;dead=true;items=LOOT.map(l=>({k:l[0],tier:l[1]}));v={x:S0.x,y:S0.y,st:'walk'};chan=null;taken=null;msg='';yellow=-1e9;friends=-1e9;
    if(mode==='osrs'){keys=Math.min(5,keys+1);taken={to:K[0],t:0,key:true};items=[];}};
  q.seg('mode',v2=>{mode=v2;kill();});q.btn('kill',kill);q.btn('hit',()=>{hit=real;if(chan){chan=null;msg='CHANNEL BROKEN';}});
  q.btn('friends',()=>{if(dead&&items.length&&mode!=='osrs'){taken={to:F,t:real};items=[];friends=real;}});
  pointer(cv,([x,y],k)=>{if(k==='down'&&Math.abs(x-COR.x)<12&&Math.abs(y-COR.y)<10)showDesc=real;});
  kill();const fx=fixed();
  const step=dt=>{real+=dt;if(!dead)return;const fast=mode==='ast'&&gt<60;gt+=dt/1000*(fast?10:1);
    if(v&&v.st==='walk'){const tx=COR.x+12,ty=COR.y+6,dx=tx-v.x,dy=ty-v.y,d=Math.hypot(dx,dy);if(d<1)v.st='at';else{const s=Math.min(d,dt*.03);v.x+=dx/d*s;v.y+=dy/d*s;}}
    if(v&&v.st==='at'&&items.length){
      if(mode==='tibia'){taken={to:v,t:real};items=[];msg='ANYONE MAY OPEN IT';}
      else if(mode==='ast'){if(gt>=60&&!chan&&real-hit>400)chan={t:real};if(chan&&real-chan.t>=1500){taken={to:v,t:real};items=[];chan=null;yellow=real;}}
      else if(mode==='osrs'){msg='NOTHING ON THE BODY';}}
    if(real>16000&&!items.length)kill();};
  return {tick(dt){fx(dt*slowK(q),step);c.fillStyle=P.bg;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    if(dead)corpse(c,'me',COR.x,COR.y);else person(c,'me',COR.x,COR.y);
    if(items.length){items.slice(0,3).forEach((it,i)=>PX(c,COR.x-4+i*4,COR.y-11,TIER[it.tier]));}
    for(const k of K){person(c,k.look,k.x,k.y,{dir:'r'});t(c,k.n,k.x,k.y-24,P.r3,{ol:P.ink,al:'center'});}
    person(c,F.look,F.x,F.y,{dir:'l'});t(c,F.n,F.x,F.y-24,P.ok,{ol:P.ink,al:'center'});
    if(v){const yl=real-yellow<6000;person(c,yl?'yellow':'other',v.x,v.y,{dir:'l',fr:v.st==='walk'?((real/160)|0)&1:0});t(c,'STRANGER',v.x,v.y-24,yl?P.yl:P.s2,{ol:P.ink,al:'center'});
      if(mode==='ast'&&v.st==='at'&&items.length&&gt<60){c.drawImage(icon('lock'),v.x-4,v.y-34);}
      if(chan){bar(c,v.x-8,v.y-31,16,2,(real-chan.t)/1500,P.o2);}
      if(real-hit<200){R(c,v.x-6,v.y-14,12,12,'rgba(255,255,255,.35)');}}
    if(taken){const p=ease(clamp((real-taken.t)/400,0,1));if(p<1){const ic=taken.key?'key':'sword';c.drawImage(icon(ic),Math.round(lerp(COR.x,taken.to.x,p))-4,Math.round(lerp(COR.y-8,taken.to.y-10,p))-4);}}
    if(mode==='osrs'&&dead){c.drawImage(icon('skull'),K[0].x-4,K[0].y-36);t(c,String(keys),K[0].x+6,K[0].y-35,P.wh,{ol:P.ink});}
    if(real-showDesc<2600){R(c,4,2,W-8,15,'rgba(26,20,32,.85)');t(c,'YOU RECOGNIZE ARIN. HE WAS',W/2,4,P.s3,{al:'center'});t(c,'KILLED BY BRAKK AND VELA.',W/2,10,P.s3,{al:'center'});}
    // window strip
    if(dead&&mode==='ast'){const f=clamp(gt/60,0,1);bar(c,40,SH-6,90,2,f,gt<60?P.o1:P.s1);t(c,gt<60?'PRIORITY '+Math.ceil(60-gt)+' S':'PUBLIC',W/2,SH-13,gt<60?P.o2:P.s3,{ol:P.ink,al:'center'});}
    if(dead&&mode==='tibia'){t(c,'NO OWNER',W/2,SH-13,P.s3,{ol:P.ink,al:'center'});}
    if(msg&&mode!=='ast')t(c,msg,v?v.x-20:W/2,SH-22,P.s2,{ol:P.ink,al:'center'});
    // death recap
    R(c,0,SH,W,H-SH,P.panel);R(c,0,SH,W,1,P.line);t(c,'DEATH RECAP',3,SH+3,P.o2);t(c,'KILLED BY BRAKK, VELA',W-3,SH+3,P.r3,{al:'right'});
    LOOT.forEach((l,i)=>{const x=3+i*14,y=SH+11;R(c,x,y,12,12,P.panel2);box(c,x,y,12,12,l[1]?TIER[l[1]]:P.line);c.drawImage(icon(l[0]),x+2,y+2);});
    const where=mode==='osrs'?'IN BRAKK\'S LOOT KEY':taken?(taken.to===F?'TAKEN BACK BY TOMAS':taken.to===v?'TAKEN BY A STRANGER':'TAKEN BY '+taken.to.n):'STILL ON YOUR CORPSE';
    t(c,where,74,SH+15,taken&&taken.to===v?P.r3:P.s3);
    setHud(root,'');const yl=real-yellow<6000;
    ro.innerHTML=mode==='tibia'?'Tibia: the corpse has no owner, so the first one to reach it opens it.':mode==='osrs'?`OSRS loot key: the loot goes straight to the killer's key; keys held <b>${keys}</b> of 5.`:`Asterion: 60 s priority for the killer's group and the victim's party (shown 10x), then a 1.5 s channel in real time${yl?' · the stranger now has a <b>yellow name</b> for 2 min':''}${real-friends<3000?' · <b>Tomas looted all</b> in one click':''}`;}};
});
})();
