"use strict";
// ======================================================================
// demos2: targeting (D), telegraphs and aiming (E), netcode and crowds (F),
// queues and PvP (G), audio, crits and death (H).
// Local helpers are prefixed f2 so they never clash with core.js or the
// other demos files. Uses generic core.js helpers ($, $$, clamp, lerp,
// ctl, setHud, reg, motion, cellOf, mkRng, drawText, FONT, FONT_S, meter, fms).
// Every canvas is 170 px wide (2x on a 390 px phone, 4x at its max width),
// 12 px tiles, and draws with integer blits, no smoothing.
// ======================================================================

// ---------- canvas, colours, text ---------------------------------------
const f2C={ink:'#17121c',ol:'#1d1622',txt:'#f4efe2',mute:'#a9a2b4',dim:'#6d6578',panel:'#1c1724',panel2:'#2a2334',line:'#3d3448',
  red:'#e2483a',red2:'#9a2a2a',gold:'#f2c14e',gold2:'#c58a2c',yel:'#ffe066',cyan:'#7fd6e6',blue:'#5a8fe0',green:'#7cc56a',purple:'#b07ae8',
  orange:'#f08a3a',orange2:'#b85a20',wht:'#fbf7ec',grey:'#9a98a8',grey2:'#5d5a6a',
  g0:'#263d24',g1:'#2f4a2b',g2:'#385733',g3:'#43663b',g4:'#507545',dirt:'#5a4a36',dirt2:'#6e5a40'};
function f2cv(root,i=0){const cv=$$('canvas',root)[i],c=cv.getContext('2d');c.imageSmoothingEnabled=false;return {cv,c,W:cv.width,H:cv.height};}
const f2R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const f2P=(c,x,y,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),1,1);};
// big font (caps 7 px) and small font (3x5) from core.js; y = top of the glyph box
function f2T(c,s,x,y,col=f2C.txt,o={}){return drawText(c,s,x,y,col,FONT,{outline:o.ol,shadow:o.sh,align:o.al,scale:o.sc});}
function f2t(c,s,x,y,col=f2C.txt,o={}){return drawText(c,s,x,y,col,FONT_S,{outline:o.ol,shadow:o.sh,align:o.al,scale:o.sc});}
const f2w=(s,F=FONT_S)=>textW(String(s),F);
// whole-pixel Bresenham line, optional dash pattern (on, off)
function f2line(c,x0,y0,x1,y1,col,on=0,off=0){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy,k=0;c.fillStyle=col;
  for(let n=0;n<600;n++){if(!on||(k%(on+off))<on)c.fillRect(x0,y0,1,1);k++;if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}}
// pixel ellipse outline (rings under targets), optional dashes
function f2ring(c,x,y,rx,ry,col,dash=0){const seen=new Set();let k=0;c.fillStyle=col;const n=Math.max(24,Math.round((rx+ry)*4));
  for(let i=0;i<n;i++){const a=i/n*6.2832,px=Math.round(x+Math.cos(a)*rx),py=Math.round(y+Math.sin(a)*ry),key=px+','+py;if(seen.has(key))continue;seen.add(key);if(!dash||((k++>>1)%3)!==2)c.fillRect(px,py,1,1);}}
function f2bar(c,x,y,w,h,f,col,bg='#2a1418'){f2R(c,x-1,y-1,w+2,h+2,f2C.ink);f2R(c,x,y,w,h,bg);f2R(c,x,y,Math.round(w*clamp(f,0,1)),h,col);}
function f2hpCol(f){return f>.6?'#5fd35a':f>.3?'#f2c14e':'#e2483a';}
function f2fixed(){let acc=0;return (dt,step)=>{acc+=dt;let n=0;while(acc>=1/60&&n<8){acc-=1/60;step();n++;}if(n>=8)acc=0;};}
function f2mix(a,b,t){const A=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),B=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
const f2cheb=(a,b)=>Math.max(Math.abs(a.tx-b.tx),Math.abs(a.ty-b.ty));

// ---------- sprites ------------------------------------------------------
const f2SP=new Map();
function f2S(rows,map,flip=false){const k=rows.join('|')+JSON.stringify(map)+flip;let s=f2SP.get(k);if(s)return s;s=document.createElement('canvas');s.width=rows[0].length;s.height=rows.length;const c=s.getContext('2d');
  for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){const ch=rows[y][flip?rows[y].length-1-x:x];if(ch==='.'||!map[ch])continue;c.fillStyle=map[ch];c.fillRect(x,y,1,1);}
  f2SP.set(k,s);return s;}
// pre-baked silhouette in one colour (white flash, red tint, purple immune): made once, blitted per frame (B2, §6d)
const f2SIL=new Map();
function f2sil(s,col='#ffffff'){let m=f2SIL.get(s);if(!m){m={};f2SIL.set(s,m);}if(m[col])return m[col];const o=document.createElement('canvas');o.width=s.width;o.height=s.height;const c=o.getContext('2d');
  c.drawImage(s,0,0);c.globalCompositeOperation='source-in';c.fillStyle=col;c.fillRect(0,0,o.width,o.height);return m[col]=o;}
// letters: o outline, h helm, H helm shade, v visor, c tunic, C tunic shade, g trim, b belt, l legs, L leg shade, f boots, w blade, W blade shade, s skin
const f2KN_TOP=["...oooo.....","..ohhhho..w.",".ohhhhhHo.wW",".ohvvvvHo.wW",".ohhhhhHo.wW","..oHHHHo..wW",".occgccCo.wW","ohcccccChggg","oHcCgcCCHosW",".obbbbbbo..."];
const f2KN_LEG=[["..olllLo....","..ol..Lo....","..of..fo....","..oo..oo...."],["..olllLo....",".olo..oLo...",".ofo..ofo...",".oo....oo..."]];
const f2GOB=[["oo......oo","ogooooooGo",".oggggggo.",".oyggggyo.",".ogGwwGgo.","..oGGGGo..",".occcccCo.","ogcbbbbCgo",".occcccCo.","..oGo.oGo.","..oo..oo.."],
  ["oo......oo","ogooooooGo",".oggggggo.",".oyggggyo.",".ogGwwGgo.","..oGGGGo..",".occcccCo.","ogcbbbbCgo",".occcccCo.",".oGo..oGo.",".oo....oo."]];
const f2MAGE=[["...oooo...","..oaaaao..",".oaaaaaAo.",".oassssAo.",".osesseso.","..osssso..",".oaaaaaAo.","osaagaaAso",".oaaaaaAo.",".oaaaaaAo.","oaaaaaaaAo","oooooooooo"],
  ["...oooo...","..oaaaao..",".oaaaaaAo.",".oassssAo.",".osesseso.","..osssso..",".oaaaaaAo.","osaagaaAso",".oaaaaaAo.",".oaaaaaAo.",".oaaaaaaAo",".ooooooooo"]];
const f2SLIME=[["...oooo...","..oggggo..",".oggwgggo.",".ogyggygo.","oggggggggo","oGgggggGGo","oGGGGGGGGo",".oooooooo."],
  ["..........","...oooo...","..ogwgggo.",".ogyggygo.","oggggggggo","oGgggggGGo","oGGGGGGGGo","oooooooooo"]];
// palettes: players differ by helm and tunic colour
const f2PAL={
  me:{o:f2C.ol,h:'#c9ccd8',H:'#8a8ea2',v:'#2a2433',c:'#3f78d2',C:'#2a5296',g:'#f2c14e',b:'#6a4a2a',l:'#4a4458',L:'#36313f',f:'#2a2026',w:'#eef2ff',W:'#9aa2c0',s:'#f0c49a'},
  party:{o:f2C.ol,h:'#c9ccd8',H:'#8a8ea2',v:'#2a2433',c:'#4aa04a',C:'#32733a',g:'#d8e8a0',b:'#6a4a2a',l:'#4a4458',L:'#36313f',f:'#2a2026',w:'#eef2ff',W:'#9aa2c0',s:'#f0c49a'},
  other:{o:f2C.ol,h:'#a8a2b0',H:'#76707e',v:'#2a2433',c:'#8a7a9a',C:'#645870',g:'#c0b8c8',b:'#4a3a2a',l:'#4a4458',L:'#36313f',f:'#2a2026',w:'#d8d8e0',W:'#8a8a9a',s:'#e0b890'},
  foe:{o:f2C.ol,h:'#4a3a44',H:'#2e242c',v:'#e2483a',c:'#b0303a',C:'#7a1e28',g:'#f08a3a',b:'#3a2a2a',l:'#3a3040',L:'#2a2230',f:'#1a1418',w:'#f0d8d8',W:'#a08080',s:'#e0b890'},
  gob:{o:f2C.ol,g:'#6fb04a',G:'#4a7f33',y:'#ffe066',w:'#f4f0e0',c:'#7a5232',C:'#563820',b:'#3a2818'},
  gob2:{o:f2C.ol,g:'#9a7ac0',G:'#6a5290',y:'#ffe066',w:'#f4f0e0',c:'#4a4a5a',C:'#343440',b:'#2a2018'},
  mage:{o:f2C.ol,a:'#6a4ab0',A:'#46307a',g:'#f2c14e',s:'#f0c49a',e:'#1d1622'},
  slime:{o:f2C.ol,g:'#5ac0b0',G:'#3a8a80',y:'#1d1622',w:'#c8fff4'}};
// map our kind + palette to the shared core.js units (Agent R): knight (you), ally, rival, goblin, orc, mage.
// The slime and the grey "stranger" tint stay local.
const f2HAS=typeof drawUnit==='function'&&typeof UNITS==='object';
function f2kind(kind,pal){if(!f2HAS)return null;if(kind==='knight')return pal==='party'||pal==='other'?'ally':pal==='foe'?'rival':'knight';if(kind==='gob')return pal==='gob2'?'orc':'goblin';if(kind==='mage')return 'mage';return null;}
// get a cached sprite canvas: kind knight|gob|mage|slime, palette key, frame 0/1, flip
function f2spr(kind,pal,fr=0,flip=false){const K=f2kind(kind,pal);if(K&&!flip)return unitImg(K,fr);const P=f2PAL[pal]||pal;
  if(kind==='knight')return f2S(f2KN_TOP.concat(f2KN_LEG[fr&1]),P,flip);
  if(kind==='gob')return f2S(f2GOB[fr&1],P,flip);
  if(kind==='mage')return f2S(f2MAGE[fr&1],P,flip);
  return f2S(f2SLIME[fr&1],P,flip);}
// draw a unit with its feet at (x, y): shadow, sprite, optional flash colour, squash (sx, sy) and pixel offset
function f2unit(c,u,o={}){const K=f2kind(u.kind,u.pal);
  if(K){const fl=o.flash||(u.pal==='other'?'#8a8494':null),fa=o.flash?(o.fa??1):u.pal==='other'?.5:1;
    return drawUnit(c,K,u.x,u.y,{fr:o.fr||0,flip:o.flip??u.flip,dx:o.dx,dy:o.dy,sx:o.sx,sy:o.sy,a:o.alpha,flash:fl,fa,shadow:o.noShadow?false:true,sword:(K==='knight'||K==='ally'||K==='rival')&&!o.noSword?(u.sword??-1.15):null,pose:o.pose});}
  return f2unitL(c,u,o);}
function f2unitL(c,u,o={}){const s=f2spr(u.kind,u.pal,o.fr||0,u.flip);const fx=o.flash?f2sil(s,o.flash):null;const X=Math.round(u.x+(o.dx||0)),Y=Math.round(u.y+(o.dy||0));
  const kw=u.kind==='knight'?-1:0;
  if(!o.noShadow){c.fillStyle='rgba(10,8,14,.45)';c.fillRect(X-4,Y,9,1);c.fillRect(X-3,Y+1,7,1);}
  const sx=o.sx||1,sy=o.sy||1,w=Math.round(s.width*sx),h=Math.round(s.height*sy),L=X-Math.round((s.width*sx)/2)+(kw*(sx===1?1:0))+1,T=Y-h+1;
  if(o.alpha!==undefined)c.globalAlpha=o.alpha;
  if(sx===1&&sy===1){c.drawImage(s,L,T);if(fx){if(o.fa!==undefined&&o.fa<1){c.globalAlpha=(o.alpha??1)*o.fa;}c.drawImage(fx,L,T);}}
  else{c.drawImage(s,L,T,w,h);if(fx)c.drawImage(fx,L,T,w,h);}
  c.globalAlpha=1;return {L,T,w,h};}
// 4x4 ordered dither mask, used for dissolves and telegraph fills
const f2BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function f2dither(c,s,X,Y,keep,w,h){/* draws sprite s keeping only pixels whose bayer value < keep*16 */
  const k=Math.round(keep*16);if(k<=0)return;if(k>=16){c.drawImage(s,X,Y,w||s.width,h||s.height);return;}
  const key='dz'+k,m=f2SIL.get(s)||{};if(!f2SIL.has(s))f2SIL.set(s,m);let d=m[key];
  if(!d){d=document.createElement('canvas');d.width=s.width;d.height=s.height;const g=d.getContext('2d');g.drawImage(s,0,0);const im=g.getImageData(0,0,d.width,d.height);
    for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++)if(f2BAYER[(y&3)*4+(x&3)]>=k)im.data[(y*d.width+x)*4+3]=0;g.putImageData(im,0,0);m[key]=d;}
  c.drawImage(d,X,Y,w||s.width,h||s.height);}

// ---------- ground: dark grass on a 12 px tile grid, cached ---------------
const f2BG=new Map();
const f2TS=16;/* 16 px tiles, half of Asterion's 32, as in the shared arena */
function f2ground(W,H,seed=1,o={}){if(typeof mkArena==='function'&&!o.tiles){const k='A'+W+'x'+H+'s'+seed;let g=f2BG.get(k);if(!g){g=mkArena(W,H,seed);f2BG.set(k,g);}return g;}
  if(o.tiles&&typeof CB==='object'){const k='T'+W+'x'+H+'s'+seed+JSON.stringify(o);let g=f2BG.get(k);if(g)return g;g=document.createElement('canvas');g.width=W;g.height=H;const c=g.getContext('2d'),r=mkRng(seed),T=f2TS,ox=o.ox||0,oy=o.oy||0;
    f2R(c,0,0,W,H,CB.mortar);for(let ty=oy-T;ty<H;ty+=T)for(let tx=ox-T;tx<W;tx+=T){const v=r();f2R(c,tx+1,ty+1,T-1,T-1,v<.18?CB.floor3:v<.4?CB.floor2:CB.floor);if(r()<.3)f2R(c,tx+2,ty+2,5,1,'rgba(255,255,255,.06)');
      if(r()<.12){const cx=tx+3+((r()*9)|0),cy=ty+4+((r()*8)|0);f2R(c,cx,cy,2,1,CB.mortar);f2R(c,cx+1,cy+1,2,1,CB.mortar);}if(r()<.08){f2R(c,tx+1,ty+T-3,3,2,CB.moss);}}
    const gr=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(8,6,16,.45)');c.fillStyle=gr;c.fillRect(0,0,W,H);f2BG.set(k,g);return g;}
  return f2groundL(W,H,seed,o);}
function f2groundL(W,H,seed=1,o={}){const k=W+'x'+H+'s'+seed+JSON.stringify(o);let g=f2BG.get(k);if(g)return g;g=document.createElement('canvas');g.width=W;g.height=H;const c=g.getContext('2d'),r=mkRng(seed),T=12;
  f2R(c,0,0,W,H,o.base||f2C.g2);
  for(let i=0;i<W*H/9;i++){const x=(r()*W)|0,y=(r()*H)|0;c.fillStyle=r()<.5?f2C.g1:f2C.g3;c.fillRect(x,y,1,1);}
  for(let i=0;i<W*H/80;i++){const x=(r()*W)|0,y=(r()*H)|0;c.fillStyle=f2C.g4;c.fillRect(x,y,1,1);c.fillRect(x+2,y-1,1,1);c.fillStyle=f2C.g1;c.fillRect(x+1,y+1,1,1);}
  if(o.dirt)for(let i=0;i<o.dirt;i++){const cx=r()*W,cy=r()*H,rr=3+r()*6;for(let y=-rr;y<=rr;y++)for(let x=-rr*1.4;x<=rr*1.4;x++){if(x*x/1.96+y*y>rr*rr*(.7+r()*.3))continue;f2P(c,cx+x,cy+y,r()<.8?f2C.dirt:f2C.dirt2);}}
  if(o.grid!==false){c.fillStyle='rgba(12,20,10,.22)';for(let x=0;x<W;x+=T)for(let y=0;y<H;y+=2)c.fillRect(x,y,1,1);for(let y=0;y<H;y+=T)for(let x=0;x<W;x+=2)c.fillRect(x,y,1,1);}
  for(let i=0;i<(o.stones??W*H/1600);i++){const x=(r()*W)|0,y=(r()*H)|0;f2R(c,x,y,3,2,'#5d5a6a');f2R(c,x,y,2,1,'#8a8798');f2P(c,x+1,y+2,f2C.g0);f2P(c,x+2,y+2,f2C.g0);}
  f2BG.set(k,g);return g;}

const f2NC=typeof NUMC==='object'?NUMC:{phys:'#ff4030',crit:'#ffd23a',heal:'#5cf05c',miss:'#b8b0a4'};
// ---------- damage numbers (Tibia rules scaled to 12 px tiles) ------------
// life 1000 ms, rise 48 px at 32 px tiles = 18 px here, fade from 833 ms,
// same colour on the same target inside 400 ms adds up (C1). Crits: 1200 ms,
// 2x integer pop for 3 frames, never merged (C3).
function f2nums(){const L=[];return {L,
  add(x,y,v,col=f2NC.phys,o={}){const now=o.t??0;if(!o.crit&&!o.nomerge){const m=L.find(n=>n.key===o.key&&n.key!==undefined&&n.col===col&&!n.crit&&n.age<400&&typeof n.v==='number'&&typeof v==='number');if(m){m.v+=v;m.age=0;m.pop=2;return m;}}
    const n={x,y,v,col,age:0,crit:!!o.crit,key:o.key,pop:o.crit?3:0,life:o.crit?1200:(o.life||1000),rise:o.rise??24,sc:o.sc||1,ol:o.ol||f2C.ink,strike:false};L.push(n);if(L.length>64)L.shift();return n;},
  step(ms){for(const n of L){n.age+=ms;if(n.pop>0&&ms>0)n.pop-=ms/16.67;}for(let i=L.length-1;i>=0;i--)if(L[i].age>=L[i].life)L.splice(i,1);},
  draw(c){for(const n of L){const t=n.age/n.life,y=n.y-Math.round(n.rise*Math.min(1,n.age/1000)),fade=n.crit?1-sat((n.age-1000)/200):1-sat((n.age-833)/167);if(fade<=0)continue;
    const sc=(n.pop>0?2:1)*n.sc;c.globalAlpha=fade;const s=String(n.v);if(typeof drawNum==='function')drawNum(c,s,n.x,y-(sc-1)*7,n.col,{scale:sc});else f2T(c,s,n.x,y-(sc-1)*7,n.col,{ol:n.ol,al:'center',sc});
    if(n.strike){const w=f2w(s,FONT)*sc;f2R(c,n.x-w/2-1,y+3,w+2,1,f2C.wht);}c.globalAlpha=1;}}};}
// ---------- sparks: whole-pixel particles with gravity --------------------
function f2sparks(){const L=[];return {L,
  burst(x,y,n,cols,sp=60,o={}){for(let i=0;i<n;i++){const a=(o.a??-Math.PI/2)+(Math.random()-.5)*(o.spread??Math.PI*2),v=sp*(.4+Math.random()*.8);L.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,life:(o.life||.25)*(.6+Math.random()*.7),col:cols[(Math.random()*cols.length)|0],g:o.g??120});}if(L.length>600)L.splice(0,L.length-600);},
  step(dt){for(const p of L){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;}for(let i=L.length-1;i>=0;i--)if(L[i].t>=L[i].life)L.splice(i,1);},
  draw(c){for(const p of L){c.fillStyle=p.col;c.fillRect(Math.round(p.x),Math.round(p.y),1,1);}}};}
// ---------- a 4-frame hit spark sprite at 75 ms per frame (B4) -------------
const f2HIT=[["...w...","..wyw..",".wyWyw.","wyWWWyw",".wyWyw.","..wyw..","...w..."],["w..w..w",".w.y.w.","..yWy..","wyW.Wyw","..yWy..",".w.y.w.","w..w..w"],["y.....y","...y...",".......","y.....y",".......","...y...","y.....y"]];
function f2hit(c,x,y,age,col='#ffe066'){if(typeof spark==='function'){const f=Math.floor(age/75);if(f>=0&&f<4)spark(c,x,y,f,col);return;}const f=Math.floor(age/75);if(f>2||age<0)return;const s=f2S(f2HIT[f],{w:'#ffffff',y:col,W:'#fff6c0'});c.drawImage(s,Math.round(x)-3,Math.round(y)-3);}
// puff (miss, block): grey ring that grows over 3 frames
function f2puff(c,x,y,age){const f=Math.floor(age/80);if(f>3||age<0)return;const r=1+f*1.5;f2ring(c,x,y,r+1,r,f<2?'#d8d4e0':'#8a8698');if(f<2)f2P(c,x,y,'#ffffff');}

// ---------- audio: off until a click inside the figure --------------------
const f2AU={ctx:null,noise:null,
  ok(){if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;try{this.ctx=new A();}catch(e){return false;}}if(this.ctx.state==='suspended')this.ctx.resume();return true;},
  live(){return this.ctx&&this.ctx.state==='running';},
  nbuf(){if(this.noise)return this.noise;const a=this.ctx,b=a.createBuffer(1,a.sampleRate*.3|0,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return this.noise=b;},
  // jsfxr-style hit: square, saw or noise, start 145 to 2260 Hz, downward slide, attack 0, sustain 0 to 23 ms, decay 23 to 204 ms (H3)
  hit(o={}){if(!this.live())return null;const a=this.ctx,t=a.currentTime,g=a.createGain(),vol=o.vol??.08,f=o.f??440,sus=(o.sus??10)/1000,dec=(o.dec??90)/1000,end=t+sus+dec;let src;
    if(o.type==='noise'){src=a.createBufferSource();src.buffer=this.nbuf();src.playbackRate.setValueAtTime(clamp(f/700,.3,3),t);src.playbackRate.exponentialRampToValueAtTime(clamp(f/700,.3,3)*.4,end);}
    else{src=a.createOscillator();src.type=o.type||'square';src.frequency.setValueAtTime(f,t);src.frequency.exponentialRampToValueAtTime(Math.max(40,f*(o.slide??.35)),end);}
    g.gain.setValueAtTime(vol,t);g.gain.setValueAtTime(vol,t+sus);g.gain.exponentialRampToValueAtTime(.0004,end);src.connect(g).connect(a.destination);src.start(t);src.stop(end+.02);return {src,g,end};},
  blip(f,ms=50,vol=.05,type='square'){return this.hit({f,sus:0,dec:ms,vol,type,slide:.9});}};
// a sound toggle button wired to f2AU: returns a getter
function f2snd(root,key='snd'){const b=root.querySelector(`[data-b="${key}"]`);let on=false;if(!b)return ()=>false;
  b.addEventListener('click',()=>{if(!on){if(!f2AU.ok())return;on=true;}else on=false;b.textContent=on?'Sound on':'Sound off';b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});return ()=>on;}
// small HUD panel drawn in canvas
function f2panel(c,x,y,w,h,fill=f2C.panel){f2R(c,x+1,y,w-2,h,f2C.ink);f2R(c,x,y+1,w,h-2,f2C.ink);f2R(c,x+1,y+1,w-2,h-2,f2C.line);f2R(c,x+2,y+2,w-4,h-4,fill);}


// ---------- tile units shared by the targeting figures --------------------
// u.tx, u.ty tile; u.x, u.y feet pixel (glides 1 tile in 180 ms); ox, oy grid origin
function f2mkU(o){const u=Object.assign({kind:'gob',pal:'gob',hp:40,max:40,fr:0,flip:false,glide:0},o);u.x=u.ox+u.tx*16+8;u.y=u.oy+u.ty*16+13;u.fx=u.x;u.fy=u.y;return u;}
function f2glide(u,dt){const gx=u.ox+u.tx*16+8,gy=u.oy+u.ty*16+13,dx=gx-u.fx,dy=gy-u.fy,d=Math.hypot(dx,dy),sp=16/0.18*dt;
  if(d<=sp){u.fx=gx;u.fy=gy;u.mv=false;}else{u.fx+=dx/d*sp;u.fy+=dy/d*sp;u.mv=true;u.walk=(u.walk||0)+dt*8;if(Math.abs(dx)>.5)u.flip=dx<0;}
  u.x=Math.round(u.fx);u.y=Math.round(u.fy);u.fr=u.mv?Math.floor(u.walk)&1:0;}
// tile outline (Tibia target square or attacker square), 1 px at this scale
function f2tile(c,u,col,inset=0,w=1){const x=u.x-8+inset,y=u.y-13+inset,s=16-inset*2;f2R(c,x,y,s,w,col);f2R(c,x,y+s-w,s,w,col);f2R(c,x,y,w,s,col);f2R(c,x+s-w,y,w,s,col);}
function f2brackets(c,u,col){const x=u.x-8,y=u.y-18,w=16,h=21;for(const [a,b,sx,sy] of [[x,y,1,1],[x+w-1,y,-1,1],[x,y+h-1,1,-1],[x+w-1,y+h-1,-1,-1]]){f2R(c,Math.min(a,a+sx*2),b,3,1,col);f2R(c,a,Math.min(b,b+sy*2),1,3,col);}}
function f2chip(c,s,x,y,col){f2T(c,s,x,Math.max(0,y),col,{ol:f2C.ink,al:'center'});}

// ======================================================================
// D1 / D5: click targeting, the battle list, target and attacker squares,
// target frame and target of target
// ======================================================================
reg('targetui',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),nums=f2nums(),sp=f2sparks();
  const OX=7,OY=22,AW=6,AH=6,LX=112,bg=f2ground(110,H-OY,21,{tiles:1,ox:OX,oy:0});
  const me=f2mkU({kind:'knight',pal:'me',name:'You',tx:2,ty:3,ox:OX,oy:OY,hp:180,max:180,id:0});
  const DEF=[['Goblin','gob','gob',40],['Goblin','gob','gob',40],['Slime','slime','slime',30],['Orc mage','mage','mage',55],['Bo','knight','other',120]];
  let clock=0,seq=0,target=null,hover=null,sortBy='time',mark='square',packets=0;const U=[];
  const spawn=(i,first)=>{const [name,kind,pal,max]=DEF[i];let tx,ty;do{tx=(Math.random()*AW)|0;ty=(Math.random()*AH)|0;}while(Math.max(Math.abs(tx-me.tx),Math.abs(ty-me.ty))<1||U.some(u=>u.alive&&u.tx===tx&&u.ty===ty));
    const u=f2mkU({kind,pal,name,tx,ty,ox:OX,oy:OY,hp:max,max,id:i+1,alive:true,seen:clock+(first?i*.01:0),mt:1+Math.random()*2,atk:1+Math.random()*2,blk:0,flash:0,cast:-1,castT:3+Math.random()*3,dead:0});
    if(name==='Bo')u.foe=false;U[i]=u;};
  DEF.forEach((_,i)=>spawn(i,true));U[0].tx=me.tx+1;U[0].ty=me.ty;U[1].tx=me.tx;U[1].ty=me.ty-1;U.forEach(u=>{u.fx=u.x=OX+u.tx*16+8;u.fy=u.y=OY+u.ty*16+13;});
  const cheb=u=>Math.max(Math.abs(u.tx-me.tx),Math.abs(u.ty-me.ty));
  const list=()=>{const L=U.filter(u=>u.alive);const k={time:(a,b)=>a.seen-b.seen,dist:(a,b)=>cheb(a)-cheb(b)||a.id-b.id,hp:(a,b)=>a.hp/a.max-b.hp/b.max||a.id-b.id,name:(a,b)=>a.name.localeCompare(b.name)||a.id-b.id}[sortBy];return L.sort(k);};
  const setT=u=>{if(u===target)return;target=u;packets++;seq++;};
  q.seg('sort',v=>{sortBy=v;});q.seg('mark',v=>{mark=v;});
  q.btn('next',()=>{const L=list().filter(u=>u.name!=='Bo');if(!L.length)return;const i=L.indexOf(target);setT(L[(i+1)%L.length]);});
  q.btn('clear',()=>{if(target){target=null;packets++;}});
  const pick=(x,y)=>{if(x>=LX){const i=Math.floor((y-OY-11)/13),L=list();return L[i]||null;}let best=null,bd=1e9;for(const u of U){if(!u.alive)continue;const d=Math.hypot(x-u.x,y-(u.y-6));if(d<bd){bd=d;best=u;}}return bd<9?best:null;};
  pointer(cv,([x,y],k)=>{if(k==='down'){const u=pick(x,y);if(u&&u.name!=='Bo')setT(u);}else if(k==='move'||k==='drag')hover=pick(x,y);else if(k==='leave')hover=null;});
  const fx=f2fixed();
  const step=()=>{const dt=1/60;clock+=dt;nums.step(1000/60);sp.step(dt);
    for(const u of U){if(!u.alive){u.dead-=dt;if(u.dead<=0)spawn(u.id-1);continue;}
      f2glide(u,dt);if(u.flash>0)u.flash--;if(u.blk>0)u.blk-=dt;
      u.mt-=dt;if(u.mt<=0){u.mt=1.2+Math.random()*2.2;const d=[[1,0],[-1,0],[0,1],[0,-1]][(Math.random()*4)|0],nx=clamp(u.tx+d[0],0,AW-1),ny=clamp(u.ty+d[1],0,AH-1);
        const goblinChase=u.kind==='gob'&&Math.random()<.6;let tx=nx,ty=ny;if(goblinChase){tx=u.tx+Math.sign(me.tx-u.tx);ty=u.ty+(tx===u.tx?Math.sign(me.ty-u.ty):0);}
        if(!(tx===me.tx&&ty===me.ty)&&!U.some(o=>o!==u&&o.alive&&o.tx===tx&&o.ty===ty)){u.tx=tx;u.ty=ty;}}
      if(u.kind==='gob'){u.atk-=dt;if(u.atk<=0){u.atk=2;if(cheb(u)===1){u.blk=1;const d=4+((Math.random()*6)|0);me.hp=Math.max(40,me.hp-d);nums.add(me.x,me.y-18,d,f2NC.phys);me.flash=6;}}}
      if(u.kind==='mage'){u.castT-=dt;if(u.cast<0&&u.castT<=0){u.cast=0;}if(u.cast>=0){u.cast+=dt;if(u.cast>=1.5){u.cast=-1;u.castT=3+Math.random()*2;sp.burst(me.x,me.y-8,6,['#b07ae8','#e0c8ff'],40);const d=8;me.hp=Math.max(40,me.hp-d);nums.add(me.x,me.y-18,d,f2NC.phys);me.flash=6;}}}}
    if(me.flash>0)me.flash--;me.hp=Math.min(me.max,me.hp+dt*2);
    me.atk=(me.atk??0)-dt;if(target&&target.alive&&me.atk<=0){me.atk=2;const d=8+((Math.random()*10)|0);target.hp-=d;target.flash=6;nums.add(target.x,target.y-18,d,f2NC.phys,{key:target.id});sp.burst(target.x,target.y-6,5,['#ffe066','#ffffff'],50);
      if(target.hp<=0){target.alive=false;target.dead=2.5;sp.burst(target.x,target.y-5,14,['#e2483a','#ffffff','#f2c14e'],70);target=null;packets++;}}
  };
  return {tick(dt){fx(dt,step);
    c.fillStyle=f2C.panel;c.fillRect(0,0,W,H);c.drawImage(bg,0,OY);
    const L=list(),nextU=target?null:L.filter(u=>u.name!=='Bo')[0];
    // under-sprite marks
    for(const u of U){if(!u.alive)continue;if(u===target&&mark==='ring')f2ring(c,u.x,u.y,6,2,f2C.red);if(u===nextU)f2ring(c,u.x,u.y,6,2,'#c0b8a8',1);}
    const all=[...U.filter(u=>u.alive),me].sort((a,b)=>a.y-b.y);
    for(const u of all){f2unit(c,u,{fr:u.fr,flash:u.flash>0?'#ffffff':null});if(u.cast>=0){f2bar(c,u.x-6,u.y-19,12,1,u.cast/1.5,f2C.gold,'#3a3040');}}
    for(const u of U){if(!u.alive)continue;if(u.blk>0)f2tile(c,u,'#000000',0,1);if(u===target&&mark==='square')f2tile(c,u,f2C.red,1,1);if(u===target&&mark==='brackets')f2brackets(c,u,f2C.red);
      if(u===hover&&u!==target){for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])f2unit(c,u,{fr:u.fr,dx,dy,flash:'#fbf7ec',noShadow:1,noSword:1});f2unit(c,u,{fr:u.fr,noShadow:1});}}
    sp.draw(c);nums.draw(c);
    // battle list
    f2panel(c,LX,OY-1,W-LX,H-OY+1);f2t(c,'BATTLE',LX+4,OY+3,f2C.gold);f2t(c,{time:'TIME',dist:'DIST',hp:'HP',name:'NAME'}[sortBy],W-4,OY+3,f2C.mute,{al:'right'});
    L.forEach((u,i)=>{const y=OY+11+i*13;if(y>H-12)return;const s=f2spr(u.kind,u.pal,0);c.drawImage(s,0,0,s.width,8,LX+3,y+1,s.width,8);
      f2t(c,u.name.toUpperCase().slice(0,8),LX+15,y,u===target?f2C.red:u.name==='Bo'?f2C.mute:f2C.txt);f2bar(c,LX+16,y+7,W-LX-22,2,u.hp/u.max,f2hpCol(u.hp/u.max));
      if(u===target){f2R(c,LX+2,y-1,10,1,f2C.red);f2R(c,LX+2,y+9,10,1,f2C.red);f2R(c,LX+2,y-1,1,11,f2C.red);f2R(c,LX+11,y-1,1,11,f2C.red);}
      if(u.blk>0){f2R(c,LX+2,y-1,10,1,'#000');f2R(c,LX+2,y+9,10,1,'#000');f2R(c,LX+2,y-1,1,11,'#000');f2R(c,LX+11,y-1,1,11,'#000');}});
    // target frame and target of target
    f2panel(c,0,0,W,21);
    if(target){const s=f2spr(target.kind,target.pal,0);f2R(c,3,3,15,15,'#120e16');c.drawImage(s,0,0,s.width,13,3+Math.floor((15-s.width)/2),4,s.width,13);
      f2t(c,target.name.toUpperCase(),21,3,f2C.txt);f2bar(c,21,10,58,3,target.hp/target.max,f2hpCol(target.hp/target.max));f2t(c,`${target.hp}/${target.max}`,82,9,f2C.mute);
      if(target.cast>=0){f2bar(c,21,16,58,1,target.cast/1.5,f2C.gold,'#3a3040');}
      if(q.v('tot')){const tt=target.kind==='gob'||target.kind==='mage'?(cheb(target)<=1||target.kind==='mage'?'YOU':'-'):'-';f2t(c,'TARGET OF',112,3,f2C.mute);f2t(c,'TARGET: '+tt,112,10,tt==='YOU'?f2C.red:f2C.txt);}}
    else f2t(c,'NO TARGET. CLICK ONE OR PRESS NEXT',4,8,f2C.mute);
    setHud(root,'');
    ro.innerHTML=`Target <b>${target?target.name:'none'}</b> · list sorted by <b>${{time:'display time',dist:'distance',hp:'hit points',name:'name'}[sortBy]}</b> · Next walks <b>${L.filter(u=>u.name!=='Bo').map(u=>u.name).join(' → ')||'nothing'}</b> · target packets sent <b>${packets}</b> (one per change) · black square = hit you in the last 1000 ms`;}};
});

// ======================================================================
// D2: Tab cycling by Chebyshev distance, clockwise angle from facing, id
// ======================================================================
reg('tabcycle',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const OX=5,OY=7,GW=10,GH=6,bg=f2ground(W,H,33,{tiles:1,ox:OX,oy:OY});
  const me=f2mkU({kind:'knight',pal:'me',name:'You',tx:4,ty:3,ox:OX,oy:OY});let face='u',target=null,presses=0,lastOrder=[];
  const mk=(id,name,kind,pal,tx,ty,o={})=>f2mkU(Object.assign({id,name,kind,pal,tx,ty,ox:OX,oy:OY,mt:1.5+Math.random()*3},o));
  const U=[mk(1,'Goblin','gob','gob',6,1,{combat:true}),mk(2,'Goblin','gob','gob',2,4,{combat:true}),mk(3,'Goblin','gob','gob',8,3),mk(4,'Goblin','gob','gob',1,1),
    mk(5,'Pet','slime','slime',5,5,{pet:true}),mk(6,'Rogue','knight','foe',8,0,{player:true}),mk(7,'Archer','knight','foe',2,2,{player:true})];
  const FV={u:[0,-1],r:[1,0],d:[0,1],l:[-1,0]};
  const order=()=>{const lock=q.v('lock'),pvp=q.v('pvp');let L=U.filter(u=>!u.pet);if(lock&&L.some(u=>u.combat))L=L.filter(u=>u.combat||(pvp&&u.player));
    const f=FV[face],fa=Math.atan2(f[1],f[0]);const ang=u=>{let a=Math.atan2(u.ty-me.ty,u.tx-me.tx)-fa;while(a<0)a+=6.2832;while(a>=6.2832)a-=6.2832;return a;};
    return L.map(u=>({u,d:f2cheb(u,me),a:ang(u)})).sort((A,B)=>(pvp?(B.u.player?1:0)-(A.u.player?1:0):0)||A.d-B.d||A.a-B.a||A.u.id-B.u.id);};
  q.seg('face',v=>{face=v;});
  const tab=()=>{const O=order();if(!O.length)return;const i=O.findIndex(o=>o.u===target);target=O[(i+1)%O.length].u;presses++;};
  q.btn('tab',tab);root.addEventListener('keydown',e=>{if(e.key==='Tab'&&e.target.closest('.stage')){e.preventDefault();tab();}});
  q.btn('wander',b=>{b.classList.toggle('on');});
  pointer(cv,([x,y],k)=>{if(k!=='down')return;const tx=Math.floor((x-OX)/16),ty=Math.floor((y-OY)/16);if(tx<0||ty<0||tx>=GW||ty>=GH)return;const hit=U.find(u=>u.tx===tx&&u.ty===ty);
    if(hit){target=hit.pet?target:hit;return;}if(tx===me.tx&&ty===me.ty){face={u:'r',r:'d',d:'l',l:'u'}[face];q.setSeg('face',face);return;}me.tx=tx;me.ty=ty;});
  let clock=0;
  return {tick(dt){clock+=dt;const wander=root.querySelector('[data-b="wander"]').classList.contains('on');f2glide(me,dt);
    for(const u of U){f2glide(u,dt);if(!wander)continue;u.mt-=dt;if(u.mt<=0){u.mt=2+Math.random()*3;const d=[[1,0],[-1,0],[0,1],[0,-1]][(Math.random()*4)|0],nx=clamp(u.tx+d[0],0,GW-1),ny=clamp(u.ty+d[1],0,GH-1);if(!(nx===me.tx&&ny===me.ty)&&!U.some(o=>o!==u&&o.tx===nx&&o.ty===ny)){u.tx=nx;u.ty=ny;}}}
    c.drawImage(bg,0,0);
    // Chebyshev rings: squares of equal distance around you
    for(let r=1;r<=9;r++){const x=OX+(me.tx-r)*16,y=OY+(me.ty-r)*16,s=(2*r+1)*16;const col=r%2?'rgba(255,240,200,.13)':'rgba(255,240,200,.07)';c.fillStyle=col;for(let i=0;i<s;i+=2){c.fillRect(x+i,y,1,1);c.fillRect(x+i,y+s-1,1,1);c.fillRect(x,y+i,1,1);c.fillRect(x+s-1,y+i,1,1);}}
    // facing wedge
    const f=FV[face];for(let k=1;k<=3;k++)f2P(c,me.x+f[0]*(6+k*2),me.y-5+f[1]*(5+k*2),f2C.gold);
    const O=order(),idx=new Map(O.map((o,i)=>[o.u,i+1]));lastOrder=O;
    for(const u of U)if(u===target)f2ring(c,u.x,u.y,6,2,f2C.red);
    for(const u of [...U,me].sort((a,b)=>a.y-b.y)){f2unit(c,u,{fr:u.fr,alpha:idx.has(u)||u===me?1:.55});}
    for(const u of U){const n=idx.get(u);if(n)f2chip(c,String(n),u.x,u.y-25,u===target?f2C.red:u.player?'#f0a0a0':f2C.gold);else f2t(c,u.pet?'PET':'SKIP',u.x,u.y-21,f2C.mute,{al:'center',ol:f2C.ink});
      if(u.combat)f2t(c,'!',u.x+6,u.y-16,f2C.red,{ol:f2C.ink});}
    setHud(root,'');
    ro.innerHTML=`Tab order <b>${O.map(o=>`${o.u.name} d${o.d}`).join(' → ')||'empty'}</b> · facing <b>${{u:'up',r:'right',d:'down',l:'left'}[face]}</b> · presses <b>${presses}</b> · ties broken by clockwise angle from facing, then lowest id`;}};
});

// ======================================================================
// D3: soft target snap cone: start direction snaps, never curves after release
// ======================================================================
reg('softlock',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums();
  const bg=f2ground(W,H,44,{dirt:2,stones:2});const me={kind:'knight',pal:'me',x:22,y:56};
  const G=[{kind:'gob',pal:'gob',x:118,y:40,ph:0,sp:1.1,flash:0,flip:true},{kind:'gob',pal:'gob2',x:146,y:74,ph:2,sp:.8,flash:0,flip:true}];
  let aim=[130,46],auto=true,idle=0,P=[],shots=0,hits=0,clock=0,autoT=1;
  const coneDeg=()=>q.v('cone');
  q.on('cone',()=>{q.out('cone',q.v('cone')+'°');q.setSeg('pre','');shots=hits=0;});q.out('cone',q.v('cone')+'°');
  q.seg('pre',v=>{q.el('cone').value=v;q.out('cone',v+'°');shots=hits=0;});
  q.on('home',()=>{shots=hits=0;});
  const snap=(ax,ay)=>{const a0=Math.atan2(ay-(me.y-6),ax-me.x),cone=coneDeg()*Math.PI/180;let best=null,bd=1e9;
    for(const g of G){const a=Math.atan2(g.y-6-(me.y-6),g.x-me.x);let d=Math.abs(a-a0);if(d>Math.PI)d=6.2832-d;if(d<=cone&&d<bd){bd=d;best={g,a};}}return best?{a:best.a,g:best.g}:{a:a0,g:null};};
  const fire=(ax,ay)=>{const s=snap(ax,ay);P.push({x:me.x,y:me.y-6,a:s.a,d:0,g:s.g,home:q.v('home')});shots++;};
  pointer(cv,([x,y],k)=>{if(k==='move'||k==='drag'||k==='down'){aim=[x,y];idle=0;auto=false;}if(k==='down')fire(x,y);});
  const fx=f2fixed();
  const step=()=>{const dt=1/60;clock+=dt;idle+=dt;if(idle>3)auto=true;sp.step(dt);nums.step(1000/60);
    for(const g of G){g.ph+=dt*g.sp;g.y=Math.round((g===G[0]?40:70)+Math.sin(g.ph)*20);if(g.flash>0)g.flash--;}
    if(auto){autoT-=dt;const g=G[0];aim=[g.x+Math.cos(clock*.7)*14,g.y-6+Math.sin(clock*1.3)*20];if(autoT<=0){autoT=1.1;fire(aim[0],aim[1]);}}
    const v=192*dt;/* 12 tiles/s at 16 px per tile */
    for(const p of P){if(p.home&&p.g){const a=Math.atan2(p.g.y-6-p.y,p.g.x-p.x);let d=a-p.a;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;p.a+=clamp(d,-.12,.12);}
      p.x+=Math.cos(p.a)*v;p.y+=Math.sin(p.a)*v;p.d+=v;
      for(const g of G){if(Math.abs(p.x-g.x)<6&&Math.abs(p.y-(g.y-6))<6){p.dead=true;g.flash=6;hits++;sp.burst(p.x,p.y,6,['#ffe066','#ffffff'],50);nums.add(g.x,g.y-17,12,f2NC.phys,{key:g.pal});break;}}
      if(p.d>128){p.dead=true;p.puff=0;sp.burst(p.x,p.y,4,['#c8c4d0','#8a8698'],25);}}
    P=P.filter(p=>!p.dead);};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.drawImage(bg,0,0);
    const s=snap(aim[0],aim[1]),a0=Math.atan2(aim[1]-(me.y-6),aim[0]-me.x),cone=coneDeg()*Math.PI/180,R=128;
    // cone edges and the range arc
    if(cone>0){for(const sg of [-1,1])f2line(c,me.x,me.y-6,me.x+Math.cos(a0+sg*cone)*R,me.y-6+Math.sin(a0+sg*cone)*R,'rgba(127,214,230,.55)',1,2);
      for(let i=-20;i<=20;i++){const a=a0+cone*i/20;f2P(c,me.x+Math.cos(a)*R,me.y-6+Math.sin(a)*R,'rgba(127,214,230,.55)');}}
    f2line(c,me.x,me.y-6,me.x+Math.cos(a0)*R,me.y-6+Math.sin(a0)*R,'rgba(251,247,236,.45)',1,3);
    for(let d=8;d<=R;d+=6){f2R(c,me.x+Math.cos(s.a)*d-1,me.y-6+Math.sin(s.a)*d-1,2,2,s.g?f2C.gold:f2C.wht);}
    if(s.g)f2ring(c,s.g.x,s.g.y,6,2,f2C.gold);
    for(const u of [me,...G].sort((a,b)=>a.y-b.y))f2unit(c,u,{flash:u.flash>0?'#ffffff':null});
    for(const p of P){for(let k=3;k>=1;k--){f2R(c,p.x-Math.cos(p.a)*k*3-1,p.y-Math.sin(p.a)*k*3-1,2,2,k===3?'#4a6ab0':k===2?'#6a9ae0':'#9ac8ff');}f2R(c,p.x-2,p.y-2,4,4,'#cfe8ff');f2R(c,p.x-1,p.y-1,2,2,'#ffffff');}
    sp.draw(c);nums.draw(c);
    const ax=aim[0]|0,ay=aim[1]|0;f2R(c,ax-3,ay,2,1,f2C.wht);f2R(c,ax+2,ay,2,1,f2C.wht);f2R(c,ax,ay-3,1,2,f2C.wht);f2R(c,ax,ay+2,1,2,f2C.wht);
    setHud(root,auto?'demo aim':'');
    const off=Math.round(Math.abs(((s.a-a0+9.42)%6.2832)-3.1416)*180/Math.PI);
    ro.innerHTML=`${auto?'Demo aiming; move over the field to aim, click to fire · ':''}Snap cone <b>${coneDeg()}°</b> · start direction bent by <b>${off}°</b>${s.g?' toward the goblin':', nothing inside the cone'} · ${q.v('home')?'<b>homing on</b> (the wrong way)':'flies straight after release'} · hits <b>${hits} / ${shots}</b>`;}};
});

// ======================================================================
// D4: tap fires at the auto pick, drag aims, drag back cancels; pick
// stability with and without 1 tile of hysteresis
// ======================================================================
reg('tapdrag',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums();
  const AH=92,bg=f2ground(W,AH,55),me={kind:'knight',pal:'me',x:30,y:52,tx:1,ty:3};
  const BT={x:146,y:106,r:11};
  const G=[{id:1,n:'A',kind:'gob',pal:'gob',x:90,y:30,hp:40,max:40,flash:0,flip:true},{id:2,n:'B',kind:'gob',pal:'gob2',x:90,y:76,hp:60,max:100,flash:0,osc:0,flip:true},{id:3,n:'C',kind:'slime',pal:'slime',x:132,y:52,hp:22,max:30,flash:0}];
  let pick=null,switches=[],clock=0,drag=null,P=[],mode='closest',rule='hyst',cancelled=0,fired=0,lastMsg='';
  q.seg('pick',v=>{mode=v;});q.seg('rule',v=>{rule=v;switches=[];});
  const tileOf=g=>({tx:Math.floor(g.x/16),ty:Math.floor((g.y-4)/16)});
  const score=g=>{const t=tileOf(g);if(mode==='hp')return g.hp;if(mode==='pct')return g.hp/g.max;if(rule==='float')return Math.hypot(g.x-me.x,g.y-me.y)/16;return Math.max(Math.abs(t.tx-me.tx),Math.abs(t.ty-me.ty));};
  const choose=()=>{const L=G.filter(g=>g.hp>0).map(g=>({g,s:score(g)})).sort((a,b)=>a.s-b.s||a.g.id-b.g.id);if(!L.length)return null;let best=L[0].g;
    if(rule==='hyst'&&mode==='closest'&&pick&&pick.hp>0){const cur=score(pick);if(!(L[0].s<=cur-1))best=pick;}
    if(best!==pick){pick=best;switches.push(clock);}return pick;};
  const fireAt=(tx,ty,aimed)=>{const a=Math.atan2(ty-(me.y-6),tx-me.x);P.push({x:me.x,y:me.y-6,a,d:0,max:aimed?128:Math.min(128,Math.hypot(tx-me.x,ty-me.y+6))});fired++;};
  const inBtn=(x,y,r=BT.r)=>Math.hypot(x-BT.x,y-BT.y)<=r;
  pointer(cv,([x,y],k)=>{if(k==='down'&&inBtn(x,y,BT.r+4)){drag={x0:x,y0:y,x,y,moved:false};}
    else if(k==='drag'&&drag){drag.x=x;drag.y=y;if(Math.hypot(x-drag.x0,y-drag.y0)>5)drag.moved=true;}
    else if(k==='up'&&drag){if(!drag.moved){const p=pick;if(p){fireAt(p.x,p.y-6);lastMsg=`tap: fired at ${p.n}'s tile, no lead`;}}
      else if(inBtn(drag.x,drag.y)){cancelled++;lastMsg='dragged back onto the button: cancelled';}
      else{const a=Math.atan2(drag.y-BT.y,drag.x-BT.x);fireAt(me.x+Math.cos(a)*128,me.y-6+Math.sin(a)*128,true);lastMsg='drag: aimed shot fired on release';}drag=null;}});
  const fx=f2fixed();
  const step=()=>{const dt=1/60;clock+=dt;sp.step(dt);nums.step(1000/60);
    const B=G[1];B.osc+=dt*1.6;B.x=Math.round(84+Math.sin(B.osc)*8);/* B swings across the A distance band */
    for(const g of G){if(g.flash>0)g.flash--;if(g.hp<=0){g.dead=(g.dead||0)+dt;if(g.dead>2){g.hp=g.max;g.dead=0;}}}
    choose();
    for(const p of P){const v=192*dt;p.x+=Math.cos(p.a)*v;p.y+=Math.sin(p.a)*v;p.d+=v;
      for(const g of G){if(g.hp>0&&Math.abs(p.x-g.x)<6&&Math.abs(p.y-(g.y-6))<6){p.dead=1;g.flash=6;const d=8+((Math.random()*6)|0);g.hp=Math.max(0,g.hp-d);nums.add(g.x,g.y-16,d,f2NC.phys,{key:g.id});sp.burst(p.x,p.y,6,['#ffe066','#fff'],50);if(g.hp<=0)sp.burst(g.x,g.y-5,12,['#e2483a','#fff'],60);break;}}
      if(p.d>=p.max){p.dead=1;sp.burst(p.x,p.y,4,['#c8c4d0','#8a8698'],25);}}
    P=P.filter(p=>!p.dead);switches=switches.filter(t=>clock-t<10);};
  return {tick(dt){fx(dt,step);c.fillStyle=f2C.panel;c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    // range ring 8 tiles
    for(let i=0;i<120;i++){const a=i/120*6.2832;const x=me.x+Math.cos(a)*128,y=me.y-6+Math.sin(a)*128;if(y<AH&&i%2===0)f2P(c,x,y,'rgba(251,247,236,.18)');}
    if(pick&&!drag)f2ring(c,pick.x,pick.y,6,2,'#d8d0c0',1);
    if(drag&&drag.moved&&!inBtn(drag.x,drag.y)){const a=Math.atan2(drag.y-BT.y,drag.x-BT.x);for(let d=8;d<=128;d+=6)f2R(c,me.x+Math.cos(a)*d-1,me.y-6+Math.sin(a)*d-1,2,2,f2C.gold);f2ring(c,me.x+Math.cos(a)*128,me.y-6+Math.sin(a)*128,3,3,f2C.gold);}
    for(const u of [me,...G.filter(g=>g.hp>0)].sort((a,b)=>a.y-b.y))f2unit(c,u,{flash:u.flash>0?'#ffffff':null});
    for(const g of G)if(g.hp>0){f2bar(c,g.x-6,g.y-17,12,1,g.hp/g.max,f2hpCol(g.hp/g.max));f2t(c,g.n,g.x+8,g.y-9,g===pick?f2C.gold:f2C.mute,{ol:f2C.ink});}
    for(const p of P){f2R(c,p.x-Math.cos(p.a)*4-1,p.y-Math.sin(p.a)*4-1,2,2,'#6a9ae0');f2R(c,p.x-2,p.y-2,4,4,'#cfe8ff');f2R(c,p.x-1,p.y-1,2,2,'#fff');}
    sp.draw(c);nums.draw(c);
    // control strip: the skill button and its cancel zone
    f2R(c,0,AH,W,H-AH,'#141019');f2R(c,0,AH,W,1,f2C.line);
    f2t(c,'TAP: FIRE AT THE PICK',4,AH+5,f2C.mute);f2t(c,'DRAG: AIM, RELEASE TO FIRE',4,AH+13,f2C.mute);f2t(c,'DRAG BACK: CANCEL',4,AH+21,f2C.mute);
    const ring=drag&&drag.moved?(inBtn(drag.x,drag.y)?f2C.red:f2C.gold):'#5d5a6a';
    for(let i=0;i<60;i++){const a=i/60*6.2832;f2P(c,BT.x+Math.cos(a)*BT.r,BT.y+Math.sin(a)*BT.r,ring);}
    for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++)if(x*x+y*y<=64)f2P(c,BT.x+x,BT.y+y,y<-3?'#4a7ad0':'#3a5aa8');
    f2R(c,BT.x-1,BT.y-4,2,8,'#cfe8ff');f2R(c,BT.x-4,BT.y-1,8,2,'#cfe8ff');
    if(drag&&drag.moved){const dx=clamp(drag.x-BT.x,-30,30),dy=clamp(drag.y-BT.y,-30,30);f2line(c,BT.x,BT.y,BT.x+dx,BT.y+dy,f2C.gold);f2R(c,BT.x+dx-2,BT.y+dy-2,4,4,f2C.gold);}
    if(inBtn(drag?drag.x:-99,drag?drag.y:-99)&&drag&&drag.moved)f2t(c,'CANCEL',BT.x,BT.y-20,f2C.red,{al:'center',ol:f2C.ink});
    setHud(root,'');
    ro.innerHTML=`Auto pick <b>${pick?pick.n:'none'}</b> by <b>${{closest:'closest',hp:'lowest HP',pct:'lowest HP %'}[mode]}</b>${mode==='closest'?` (${{float:'float distance',tiles:'whole tiles',hyst:'tiles, keep unless 1 tile closer'}[rule]})`:''} · pick switches in the last 10 s <b>${switches.length}</b> · fired <b>${fired}</b> · cancelled <b>${cancelled}</b>${lastMsg?' · '+lastMsg:''}`;}};
});


// ---------- aimed projectile drawing: core, 2 or 3 afterimages ------------
// pixel disc of radius r (whole pixels), used for bolt cores and afterimages
function f2disc(c,x,y,r,col){x=Math.round(x);y=Math.round(y);c.fillStyle=col;if(r<=1){c.fillRect(x-1,y-1,2,2);return;}for(let j=-r;j<r;j++){const w=Math.round(Math.sqrt(r*r-(j+.5)*(j+.5)));c.fillRect(x-w,y+j,w*2,1);}}
function f2bolt(c,p,tail=3,cols=['#cfe8ff','#9ac8ff','#6a9ae0','#4a6ab0'],r=2){const ca=Math.cos(p.a),sa=Math.sin(p.a),gap=Math.max(3,r+1);
  for(let k=tail;k>=1;k--)f2disc(c,p.x-ca*k*gap,p.y-sa*k*gap,Math.max(1,r-k),cols[Math.min(k,3)]);
  f2disc(c,p.x,p.y,r,cols[1]);f2disc(c,p.x-ca*.5,p.y-sa*.5,Math.max(1,r-1),cols[0]);f2R(c,p.x-1,p.y-1,2,2,'#ffffff');}
// preview dots: 2x2 every 4 px with an end marker (Asterion's 4x4 every 8 px at 32 px tiles, scaled)
function f2dots(c,x,y,a,len,col=f2C.gold,end=true){for(let d=6;d<=len;d+=4)f2R(c,x+Math.cos(a)*d-1,y+Math.sin(a)*d-1,2,2,col);if(end){const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len;f2R(c,ex-2,ey-2,5,1,col);f2R(c,ex-2,ey+2,5,1,col);f2R(c,ex-2,ey-2,1,5,col);f2R(c,ex+2,ey-2,1,5,col);}}
function f2cursor(c,x,y,col=f2C.wht,click=0){x|=0;y|=0;f2R(c,x-3,y,2,1,col);f2R(c,x+2,y,2,1,col);f2R(c,x,y-3,1,2,col);f2R(c,x,y+2,1,2,col);if(click>0)f2ring(c,x,y,7-click*4,7-click*4,col);}

// ======================================================================
// E1: normal cast, quick cast, quick cast with indicator
// ======================================================================
reg('castmodes',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums();
  const AH=92,bg=f2ground(W,AH,66,{dirt:2,stones:2}),me={kind:'knight',pal:'me',x:30,y:58};
  const G=[{kind:'gob',pal:'gob',x:112,y:32,flash:0,flip:true},{kind:'gob',pal:'gob2',x:134,y:68,flash:0,flip:true},{kind:'slime',pal:'slime',x:86,y:80,flash:0}];
  let mode='normal',slot=1,st=null,P=[],booms=[],cur=[120,40],stats={normal:[],quick:[],qi:[]},last=null,idle=2.5,ghost=null,clock=0,clickFx=0;
  const SLOTS=[{n:'Bolt',k:'target'},{n:'Shot',k:'line'},{n:'Blast',k:'ground'}];
  q.seg('mode',v=>{mode=v;st=null;last=null;});
  const RANGE=84,origin=()=>[me.x,me.y-6];
  const fire=(x,y)=>{const [ox,oy]=origin(),k=SLOTS[slot].k;
    if(k==='line'){const a=Math.atan2(y-oy,x-ox);P.push({x:ox,y:oy,a,d:0,max:RANGE});}
    else if(k==='ground'){let dx=x-ox,dy=y-oy,d=Math.hypot(dx,dy);if(d>RANGE){dx*=RANGE/d;dy*=RANGE/d;}booms.push({x:ox+dx,y:oy+dy,t:0});}
    else{let best=null,bd=1e9;for(const g of G){const d=Math.hypot(g.x-ox,g.y-oy);if(d<bd){bd=d;best=g;}}P.push({x:ox,y:oy,a:0,d:0,max:999,home:best});}};
  const done=()=>{const ms=Math.round((performance.now()-st.t0)*(q.v('slow')?.25:1));stats[mode].push({n:st.n,ms});if(stats[mode].length>8)stats[mode].shift();last={n:st.n,ms};st=null;};
  const press=(x,y,kind)=>{clickFx=1;const k=SLOTS[slot].k;
    if(k==='target'&&kind==='down'){st={t0:performance.now(),n:1};fire(x,y);done();return;}
    if(mode==='quick'){if(kind==='down'){st={t0:performance.now(),n:1};fire(x,y);done();}return;}
    if(mode==='qi'){if(kind==='down')st={t0:performance.now(),n:1,show:true};else if(kind==='up'&&st){fire(x,y);done();}return;}
    if(kind==='down'){if(!st)st={t0:performance.now(),n:1,show:true};else{st.n++;fire(x,y);done();}}};
  pointer(cv,([x,y],k,e)=>{if(e&&e.isTrusted){idle=0;ghost=null;}
    if(y>=AH){if(k==='down'){const i=Math.floor((x-W/2+30)/20);if(i>=0&&i<3){slot=i;st=null;}}return;}
    cur=[x,y];if(k==='down'||k==='up')press(x,y,k);});
  // a ghost hand plays the current mode when nobody touches the figure
  const ghostRun=dt=>{if(!ghost){const g=G[(Math.random()*3)|0];ghost={t:0,tx:g.x,ty:g.y-6,x:me.x+30,y:me.y-20,ph:0};}ghost.t+=dt;
    const g=ghost,mv=(tx,ty,sp)=>{g.x+=(tx-g.x)*Math.min(1,dt*sp);g.y+=(ty-g.y)*Math.min(1,dt*sp);cur=[g.x,g.y];};
    if(mode==='quick'){mv(g.tx,g.ty,6);if(g.ph===0&&g.t>.6){press(g.x,g.y,'down');g.ph=1;}if(g.t>1.6)ghost=null;}
    else if(mode==='qi'){if(g.ph===0&&g.t>.3){press(g.x,g.y,'down');g.ph=1;}if(g.ph>=1)mv(g.tx,g.ty,4);if(g.ph===1&&g.t>1.1){press(g.x,g.y,'up');g.ph=2;}if(g.t>2)ghost=null;}
    else{if(g.ph===0&&g.t>.3){press(g.x,g.y,'down');g.ph=1;}if(g.ph>=1)mv(g.tx,g.ty,4);if(g.ph===1&&g.t>1.2){press(g.x,g.y,'down');g.ph=2;}if(g.t>2.1)ghost=null;}};
  const fx=f2fixed();
  const step=()=>{const dt=1/60;clock+=dt;idle+=dt;sp.step(dt);nums.step(1000/60);if(clickFx>0)clickFx=Math.max(0,clickFx-dt*4);
    if(idle>3)ghostRun(dt);
    G.forEach((g,i)=>{if(g.flash>0)g.flash--;});
    for(const p of P){const v=192*dt;if(p.home){const a=Math.atan2(p.home.y-6-p.y,p.home.x-p.x);p.a=a;}p.x+=Math.cos(p.a)*v;p.y+=Math.sin(p.a)*v;p.d+=v;
      for(const g of G){if(Math.abs(p.x-g.x)<5&&Math.abs(p.y-(g.y-5))<6){p.dead=1;g.flash=6;nums.add(g.x,g.y-16,10,f2NC.phys,{key:g.pal});sp.burst(p.x,p.y,6,['#ffe066','#fff'],50);break;}}
      if(p.d>=p.max){p.dead=1;sp.burst(p.x,p.y,4,['#c8c4d0','#8a8698'],25);}}
    P=P.filter(p=>!p.dead);
    for(const b of booms){b.t+=dt;if(!b.hit&&b.t>0){b.hit=1;for(const g of G)if(Math.hypot(g.x-b.x,g.y-4-b.y)<14){g.flash=6;nums.add(g.x,g.y-16,14,f2NC.phys,{key:g.pal});}sp.burst(b.x,b.y,16,['#ffb04a','#ffe066','#fff'],70);}}
    booms=booms.filter(b=>b.t<.35);};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.fillStyle='#141019';c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    const [ox,oy]=origin(),k=SLOTS[slot].k,show=st&&st.show,a=Math.atan2(cur[1]-oy,cur[0]-ox);
    if(show&&k==='line')f2dots(c,ox,oy,a,RANGE);
    if(show&&k==='ground'){let dx=cur[0]-ox,dy=cur[1]-oy,d=Math.hypot(dx,dy);const cl=d>RANGE;if(cl){dx*=RANGE/d;dy*=RANGE/d;}f2ring(c,ox+dx,oy+dy,14,14,cl?'#ffb04a':f2C.gold);f2ring(c,ox+dx,oy+dy,13,13,'rgba(242,193,78,.35)');for(let i=0;i<90;i+=2){const t=i/90*6.2832;f2P(c,ox+Math.cos(t)*RANGE,oy+Math.sin(t)*RANGE,'rgba(251,247,236,.25)');}}
    for(const b of booms){const r=4+b.t*40;f2ring(c,b.x,b.y,r,r*.8,b.t<.1?'#ffffff':'#ffb04a');}
    for(const u of [me,...G].sort((a,b)=>a.y-b.y))f2unit(c,u,{flash:u.flash>0?'#ffffff':null});
    for(const p of P)f2bolt(c,p,p.home?2:3,p.home?['#ffe0a0','#f2c14e','#c58a2c','#8a5a20']:undefined);
    sp.draw(c);nums.draw(c);
    f2cursor(c,cur[0],cur[1],ghost?'#c8c0d8':f2C.wht,clickFx);
    // hotbar with a corner glyph per type: dot targeted, crosshair aimed, circle ground (E1)
    f2R(c,0,AH,W,1,f2C.line);const hx=W/2-30;
    SLOTS.forEach((s,i)=>{const x=hx+i*20,y=AH+4;f2panel(c,x,y,18,18,i===slot?'#3a3046':f2C.panel);if(i===slot){f2R(c,x,y,18,1,f2C.gold);f2R(c,x,y+17,18,1,f2C.gold);f2R(c,x,y,1,18,f2C.gold);f2R(c,x+17,y,1,18,f2C.gold);}
      const ic=i===0?'#f2c14e':i===1?'#9ac8ff':'#ffb04a';f2R(c,x+6,y+6,6,6,ic);f2R(c,x+7,y+7,4,4,'#ffffff');
      if(i===0)f2R(c,x+13,y+3,2,2,f2C.wht);if(i===1){f2R(c,x+12,y+4,5,1,f2C.wht);f2R(c,x+14,y+2,1,5,f2C.wht);}if(i===2){f2R(c,x+13,y+2,3,1,f2C.wht);f2R(c,x+13,y+6,3,1,f2C.wht);f2R(c,x+12,y+3,1,3,f2C.wht);f2R(c,x+16,y+3,1,3,f2C.wht);}
      f2t(c,String(i+1),x+2,y+11,f2C.mute);});
    f2t(c,SLOTS[slot].n.toUpperCase(),hx-6,AH+9,f2C.txt,{al:'right'});f2t(c,k==='target'?'HOMES':k==='line'?'AIMED':'GROUND',hx-6,AH+16,f2C.mute,{al:'right'});
    const S=stats[mode],avg=S.length?Math.round(S.reduce((s,x)=>s+x.ms,0)/S.length):0;
    f2t(c,'PRESSES',W-4,AH+5,f2C.mute,{al:'right'});f2T(c,last?String(last.n):'-',W-4,AH+11,f2C.gold,{al:'right'});
    setHud(root,st&&mode==='normal'&&st.show?'aim, then click again to confirm':ghost?'demo hand':'');
    ro.innerHTML=`<b>${{normal:'Normal cast',quick:'Quick cast',qi:'Quick cast with indicator'}[mode]}</b> · last cast <b>${last?last.n+' press'+(last.n>1?'es':'')+', '+last.ms+' ms':'none yet'}</b> · average time to fire <b>${S.length?avg+' ms':'n/a'}</b> over ${S.length} · slot ${slot+1} <b>${SLOTS[slot].k==='target'?'targeted, no preview, it homes':SLOTS[slot].k==='line'?'aimed line':'ground circle, clamped at range'}</b>`;}};
});

// ======================================================================
// E2: skillshot speed, width, range, tail and hitbox
// ======================================================================
reg('skillshot',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums();
  const bg=f2ground(W,H,77,{dirt:2,stones:2}),me={kind:'knight',pal:'me',x:18,y:56};
  const g={kind:'gob',pal:'gob',x:122,y:50,vy:40,flash:0,turn:1,flip:true};
  let P=[],speed='fast',hb='match',hits=0,shots=0,frozen=false,idle=3.1,autoT=.3,clock=0;
  const SPD={ez:{v:15.4,w:.92,r:9.2,n:'Ezreal Q'},fast:{v:12,w:.75,r:8,n:'Fast bolt'},orb:{v:6,w:.75,r:8,n:'Orb'}};
  q.seg('spd',v=>{speed=v;hits=shots=0;});q.seg('hb',v=>{hb=v;hits=shots=0;});
  q.btn('freeze',b=>{frozen=!frozen;b.classList.toggle('on',frozen);b.textContent=frozen?'Resume':'Freeze frame';});
  const fire=(x,y)=>{const S=SPD[speed];P.push({x:me.x+4,y:me.y-6,a:Math.atan2(y-(me.y-6),x-me.x-4),d:0,S,hw:S.w*16/2,hb:S.w*16/2*({match:1,big:1.8,small:.45}[hb])});shots++;};
  pointer(cv,([x,y],k,e)=>{if(k==='down'){idle=0;if(frozen)return;fire(x,y);}});
  const fx=f2fixed();
  const step=()=>{if(frozen)return;const dt=1/60;clock+=dt;idle+=dt;sp.step(dt);nums.step(1000/60);
    g.turn-=dt;if(g.turn<=0){g.turn=.5+Math.random()*1.2;if(Math.random()<.6)g.vy=-g.vy;}g.y+=g.vy*dt;if(g.y<22){g.y=22;g.vy=40;}if(g.y>94){g.y=94;g.vy=-40;}if(g.flash>0)g.flash--;
    if(idle>3){autoT-=dt;if(autoT<=0){autoT=1.3;fire(g.x,g.y-6);}}
    for(const p of P){const v=p.S.v*16*dt;p.x+=Math.cos(p.a)*v;p.y+=Math.sin(p.a)*v;p.d+=v;
      /* hurt box: 10x12 around the goblin body vs a circle of radius hb */
      const cx=clamp(p.x,g.x-5,g.x+5),cy=clamp(p.y,g.y-11,g.y);if(!p.dead&&Math.hypot(p.x-cx,p.y-cy)<=p.hb){p.dead=1;g.flash=6;hits++;nums.add(g.x,g.y-17,12,f2NC.phys,{key:1});sp.burst(p.x,p.y,7,['#ffe066','#fff'],55);}
      if(p.d>=p.S.r*16){p.dead=1;sp.burst(p.x,p.y,4,['#c8c4d0','#8a8698'],25);}}
    P=P.filter(p=>!p.dead);};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.drawImage(bg,0,0);
    const S=SPD[speed],R=S.r*16;for(let i=0;i<80;i++){const a=-1.2+i/80*2.4;if(i%2===0)f2P(c,me.x+4+Math.cos(a)*R,me.y-6+Math.sin(a)*R,'rgba(251,247,236,.25)');}
    for(const u of [me,g].sort((a,b)=>a.y-b.y))f2unit(c,u,{flash:u.flash>0?'#ffffff':null});
    const tail=q.v('tail')?3:0;
    for(const p of P){const r=Math.max(2,Math.round(p.hw*.7));f2bolt(c,p,tail,undefined,r);if(q.v('show')){f2ring(c,p.x,p.y,p.hb,p.hb,'#ff6af0');}}
    if(q.v('show')){f2R(c,g.x-5,g.y-11,11,1,'#ff6af0');f2R(c,g.x-5,g.y,11,1,'#ff6af0');f2R(c,g.x-5,g.y-11,1,12,'#ff6af0');f2R(c,g.x+5,g.y-11,1,12,'#ff6af0');}
    sp.draw(c);nums.draw(c);
    setHud(root,frozen?'still frame':'');
    ro.innerHTML=`${frozen?'Still frame, the tail alone shows the direction · ':idle>3?'Demo fires with no lead; click to fire yourself · ':''}<b>${S.n}</b> · ${S.v} tiles/s = <b>${(S.v*32/60).toFixed(1)} px per frame</b> at 32 px tiles · width ${S.w} tile · range ${S.r} tiles · hitbox <b>${{match:'matches the art',big:'1.8x the art',small:'0.45x the art'}[hb]}</b> · hits <b>${hits} / ${shots}</b>`;}};
});

// ======================================================================
// E3: ground telegraphs that resolve when the marker ends
// ======================================================================
reg('groundaoe',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums();
  const OX=5,OY=7,GW=10,GH=6,bg=f2ground(W,H,88,{tiles:1,ox:OX,oy:OY});
  const me=f2mkU({kind:'knight',pal:'me',tx:4,ty:3,ox:OX,oy:OY});const boss=f2mkU({kind:'mage',pal:'mage',tx:5,ty:0,ox:OX,oy:OY});
  let T=[],path=[],castT=1,hit=0,dodged=0,bot=true,botWait=0,lastUser=-99,clock=0,flashMe=0,stepT=0;
  const lead=()=>Math.max(400,q.v('lead'));
  q.seg('pre',v=>{q.el('lead').value=v;q.out('lead',v+' ms');});q.on('lead',()=>{q.out('lead',lead()+' ms');q.setSeg('pre','');});q.out('lead',lead()+' ms');
  const shape=t=>{const L=[];for(let dy=-t.r;dy<=t.r;dy++)for(let dx=-t.r;dx<=t.r;dx++)if(t.tx+dx>=0&&t.tx+dx<GW&&t.ty+dy>=0&&t.ty+dy<GH)L.push([t.tx+dx,t.ty+dy]);return L;};
  const inT=(t,x,y)=>shape(t).some(([a,b])=>a===x&&b===y);
  const go=(tx,ty)=>{path=[];let x=me.tx,y=me.ty;while((x!==tx||y!==ty)&&path.length<20){if(x!==tx)x+=Math.sign(tx-x);else y+=Math.sign(ty-y);path.push([x,y]);}};
  pointer(cv,([x,y],k)=>{if(k!=='down')return;const tx=clamp(Math.floor((x-OX)/16),0,GW-1),ty=clamp(Math.floor((y-OY)/16),1,GH-1);lastUser=clock;go(tx,ty);});
  root.addEventListener('keydown',e=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]}[e.key];if(!d||!e.target.closest('.stage'))return;e.preventDefault();lastUser=clock;go(clamp(me.tx+d[0],0,GW-1),clamp(me.ty+d[1],1,GH-1));});
  const fx=f2fixed();
  const step=()=>{const dt=1/60;clock+=dt;sp.step(dt);nums.step(1000/60);if(flashMe>0)flashMe--;bot=clock-lastUser>6;
    stepT-=dt;if(stepT<=0&&path.length){const [x,y]=path.shift();me.tx=x;me.ty=y;stepT=.2;}f2glide(me,dt);f2glide(boss,dt);
    castT-=dt;if(castT<=0&&T.filter(t=>!t.done).length<2){const r=1;T.push({tx:me.tx,ty:me.ty,r,t:0,lead:lead()/1000,done:false,boom:-1,react:.25+Math.random()*.25});castT=lead()/1000+.5+Math.random()*.6;}
    const late=q.v('late');
    for(const t of T){t.t+=dt;
      if(bot&&!t.done&&t.t>t.react&&!t.botgo&&inT(t,me.tx,me.ty)){t.botgo=1;/* walk to the nearest tile outside */let best=null,bd=99;for(let y=1;y<GH;y++)for(let x=0;x<GW;x++){if(T.some(o=>!o.done&&inT(o,x,y)))continue;const d=Math.abs(x-me.tx)+Math.abs(y-me.ty);if(d<bd){bd=d;best=[x,y];}}if(best)go(best[0],best[1]);}
      if(!t.done&&t.t>=t.lead){t.done=true;t.boom=0;if(!late)t.res=inT(t,me.tx,me.ty);sp.burst(OX+t.tx*16+8,OY+t.ty*16+8,18,['#ffb04a','#ffe066','#ffffff'],80,{life:.3});}
      if(t.done){t.boom+=dt;if(late&&t.res===undefined&&t.boom>=.25){/* the wrong way: judged at the explosion peak, by a round blob, not by tiles */const cx=OX+t.tx*16+8,cy=OY+t.ty*16+8;t.res=Math.hypot(me.x-cx,me.y-6-cy)<(t.r+.9)*16;}
        if(t.res!==undefined&&!t.counted){t.counted=1;if(t.res){hit++;flashMe=6;nums.add(me.x,me.y-18,25,f2NC.phys);sp.burst(me.x,me.y-6,8,[f2NC.phys,'#fff'],50);}else dodged++;}}}
    T=T.filter(t=>!t.done||t.boom<.6);};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.drawImage(bg,0,0);
    for(const t of T){const L=shape(t),f=sat(t.t/t.lead);
      if(!t.done){/* tile-snapped decal: 1 px dark outline, 2x2 checker in warm orange, a fill that grows to the edge */
        for(const [x,y] of L){const X=OX+x*16,Y=OY+y*16,cx=OX+t.tx*16+8,cy=OY+t.ty*16+8,dd=Math.hypot(X+8-cx,Y+8-cy)/((t.r+.5)*16);
          for(let yy=0;yy<16;yy+=2)for(let xx=0;xx<16;xx+=2)if(((xx+yy)>>1)&1)f2R(c,X+xx,Y+yy,2,2,dd<=f?'rgba(255,160,50,.85)':'rgba(255,160,50,.28)');
          const edge=(a,b)=>!L.some(([p,q2])=>p===a&&q2===b);if(edge(x,y-1))f2R(c,X,Y,16,1,'#3a1a08');if(edge(x,y+1))f2R(c,X,Y+15,16,1,'#3a1a08');if(edge(x-1,y))f2R(c,X,Y,1,16,'#3a1a08');if(edge(x+1,y))f2R(c,X+15,Y,1,16,'#3a1a08');}}
      else if(t.boom<.034){for(const [x,y] of L)f2R(c,OX+x*16,OY+y*16,16,16,'rgba(255,255,255,.85)');}
      else{const cx=OX+t.tx*16+8,cy=OY+t.ty*16+8,r=(t.r+.9)*16*Math.min(1,t.boom/.25);f2ring(c,cx,cy,r,r*.85,t.boom<.3?'#ffe066':'#b85a20');if(t.boom<.3)f2ring(c,cx,cy,r*.7,r*.6,'#ffb04a');}}
    for(const [x,y] of path)f2R(c,OX+x*16+7,OY+y*16+7,2,2,'rgba(251,247,236,.5)');
    for(const u of [boss,me].sort((a,b)=>a.y-b.y))f2unit(c,u,{fr:u.fr,flash:u===me&&flashMe>0?'#ffffff':null});
    sp.draw(c);nums.draw(c);
    setHud(root,bot?'bot playing':'');
    ro.innerHTML=`${bot?'Bot dodges after 250 to 500 ms; click a tile to play · ':''}Lead <b>${lead()} ms</b> · resolve <b>${q.v('late')?'at the explosion peak, by a round blob (the wrong way)':'when the marker ends, by tiles'}</b> · dodged <b>${dodged}</b> · hit <b>${hit}</b>`;}};
});

// ======================================================================
// E4: misses keep flying, near-miss whoosh within 0.5 tile after it passed
// ======================================================================
reg('nearmiss',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums(),snd=f2snd(root);
  const bg=f2ground(W,H,99,{dirt:2,stones:1}),caster={kind:'mage',pal:'mage',x:16,y:54},dod={kind:'knight',pal:'party',x:118,y:50,vy:40,turn:1,flash:0,flip:true};
  let P=[],view='dodger',fireT=.5,cnt={hit:0,near:0,miss:0},cues=[],puffs=[],clock=0;
  q.seg('view',v=>{view=v;});
  const HR=3.5;/* hurt circle radius: 14 px across at 32 px tiles, halved */
  const fx=f2fixed();
  const step=()=>{const dt=1/60;clock+=dt;sp.step(dt);nums.step(1000/60);
    dod.turn-=dt;if(dod.turn<=0){dod.turn=.3+Math.random()*.9;if(Math.random()<.55)dod.vy=-dod.vy;}dod.y+=dod.vy*dt;if(dod.y<24){dod.y=24;dod.vy=40;}if(dod.y>94){dod.y=94;dod.vy=-40;}if(dod.flash>0)dod.flash--;
    fireT-=dt;if(fireT<=0){fireT=.75;const ty=dod.y-1+(Math.random()-.5)*22;P.push({x:caster.x+5,y:caster.y-6,a:Math.atan2(ty-(caster.y-6),dod.x-caster.x-5),dmin:1e9,cue:false});}
    for(const p of P){const v=192*dt;p.x+=Math.cos(p.a)*v;p.y+=Math.sin(p.a)*v;
      const fxp=dod.x,fyp=dod.y-1,d=Math.hypot(p.x-fxp,p.y-fyp)-HR;
      if(d<=1.5&&!p.dead){p.dead=1;dod.flash=6;cnt.hit++;nums.add(dod.x,dod.y-18,9,f2NC.phys);sp.burst(p.x,p.y,6,['#ffe066','#fff'],50);continue;}
      if(d<p.dmin)p.dmin=d;else if(!p.cue&&!p.passed){p.passed=1;/* only after it passed: distance started to grow */if(p.dmin<=8){p.cue=true;cnt.near++;cues.push({x:dod.x,y:dod.y-8,t:0,side:Math.sign(p.y-fyp)||1});if(snd()&&view!=='by')f2AU.hit({type:'noise',f:1400,sus:0,dec:120,vol:.06,slide:.3});}else cnt.miss++;}
      if(p.x>W-8){p.dead=1;puffs.push({x:W-8,y:p.y,t:0});}}
    P=P.filter(p=>!p.dead);for(const u of cues)u.t+=dt;cues=cues.filter(u=>u.t<.4);for(const u of puffs)u.t+=dt;puffs=puffs.filter(u=>u.t<.35);};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.drawImage(bg,0,0);
    // stone wall on the right: misses puff on it
    for(let y=0;y<H;y+=6){const o=(y/6)&1?3:0;for(let x=W-8-o;x<W;x+=6){f2R(c,x,y,6,6,'#4a4656');f2R(c,x,y,5,1,'#6a6676');f2R(c,x,y+5,6,1,'#2e2b38');}}
    for(const u of [caster,dod].sort((a,b)=>a.y-b.y))f2unit(c,u,{flash:u.flash>0?'#ffffff':null});
    if(q.v('hurt')){f2ring(c,dod.x,dod.y-1,HR,HR,'#ff6af0');f2ring(c,dod.x,dod.y-1,HR+8,HR+8,'rgba(255,106,240,.35)',1);}
    for(const p of P)f2bolt(c,p,3,['#ffd0f0','#e08ad8','#a05aa8','#6a3a7a']);
    for(const u of puffs)f2puff(c,u.x,u.y,u.t*1000);
    if(view!=='by')for(const u of cues){const k=Math.floor(u.t/.08);for(let i=0;i<3;i++){const y=u.y+u.side*(4+i*2),x=u.x-8-k*2+i;f2R(c,x,y,6-i,1,i===0?'#ffffff':'#c8e8ff');}
      if(u.t<.3)f2t(c,'CLOSE!',u.x+8,u.y-6,'#c8e8ff',{ol:f2C.ink});}
    sp.draw(c);nums.draw(c);
    setHud(root,{dodger:'the dodger sees the whoosh',caster:'the caster sees it too',by:'a bystander sees no cue'}[view]);
    ro.innerHTML=`Hits <b>${cnt.hit}</b> · near misses <b>${cnt.near}</b> (within 0.5 tile, cued after the shot passed) · clean misses <b>${cnt.miss}</b> · ${snd()?'<b>sound on</b>':'muted'}`;}};
});


// ======================================================================
// F1 / F2: predict the cosmetic start, confirm the outcome; a targeted
// bolt launches locally and lands on confirm
// ======================================================================
reg('predict',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums();
  const AH=74,bg=f2ground(W,AH,111,{dirt:2,stones:2}),me={kind:'mage',pal:'mage',x:30,y:52},gob={kind:'gob',pal:'gob',x:130,y:52,flash:0,hp:100,flip:true};
  const WIND=120,TILES=6,FLY=Math.round(150*Math.sqrt(TILES));/* Tibia: 150 * sqrt(tiles) ms */
  let mode='anim',acts=[],clock=0,idle=2,autoT=0,last=null;
  q.seg('mode',v=>{mode=v;});q.on('rtt',()=>q.out('rtt',q.v('rtt')+' ms'));q.out('rtt',q.v('rtt')+' ms');
  const cast=()=>{const L=q.v('rtt'),rej=q.v('rej')&&Math.random()<1/3;const a={t0:clock*1000,L,rej,mode,ev:{}};
    a.ev.press=0;a.ev.srv=L/2;a.ev.resolve=L/2+WIND;a.ev.confirm=L+WIND;
    if(mode==='wait'){a.ev.wind=L;a.ev.launch=L+WIND;}else{a.ev.wind=0;a.ev.launch=WIND;}
    a.ev.arrive=a.ev.launch+FLY;a.ev.show=Math.max(a.ev.arrive,a.ev.confirm);acts.push(a);last=a;if(acts.length>4)acts.shift();};
  q.btn('cast',()=>{idle=0;cast();});pointer(cv,(_,k)=>{if(k==='down'){idle=0;cast();}});
  const fx=f2fixed();
  const step=()=>{const dt=1/60;clock+=dt;idle+=dt;sp.step(dt);nums.step(1000/60);if(gob.flash>0)gob.flash--;
    if(idle>3){autoT-=dt;if(autoT<=0){autoT=1.7;cast();}}
    const now=clock*1000;
    for(const a of acts){const t=now-a.t0;a.t=t;
      // effects at the bolt's arrival (predicted) or at the shown impact (confirmed)
      const fxAt=a.mode==='fx'||a.mode==='num'?a.ev.arrive:a.ev.show;
      if(!a.didFx&&t>=fxAt){a.didFx=1;if(!a.rej||a.mode==='fx'||a.mode==='num'){sp.burst(gob.x,gob.y-6,8,['#e0c8ff','#b07ae8','#ffffff'],55);gob.flash=6;}else{a.puff=now;}}
      if(a.mode==='num'&&!a.didN&&t>=a.ev.arrive){a.didN=1;a.n=nums.add(gob.x,gob.y-18,14,f2NC.phys,{nomerge:1});}
      if(!a.didC&&t>=a.ev.confirm&&t>=a.ev.arrive||(!a.didC&&t>=a.ev.show)){a.didC=1;
        if(a.rej){if(a.n){a.n.strike=true;a.n.col='#9a98a8';}if(a.mode==='fx'||a.mode==='num')a.phantom=now;a.puff=a.puff||now;nums.add(gob.x,gob.y-26,'MISS','#c8c4d0',{nomerge:1,rise:10});}
        else if(a.mode!=='num'){nums.add(gob.x,gob.y-18,14,f2NC.phys,{nomerge:1});if(a.mode!=='fx'){gob.flash=6;}}}}
    acts=acts.filter(a=>now-a.t0<2600);};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.fillStyle='#141019';c.fillRect(0,0,W,H);c.drawImage(bg,0,0);const now=clock*1000;
    let winding=false;for(const a of acts){if(a.t>=a.ev.wind&&a.t<a.ev.launch)winding=a;}
    f2unit(c,me,{dy:winding?-1:0});if(winding){const f=(winding.t-winding.ev.wind)/WIND;f2bar(c,me.x-8,me.y-18,16,2,f,f2C.gold,'#3a3040');f2R(c,me.x+5,me.y-15,2,2,'#e0c8ff');}
    f2unit(c,gob,{flash:gob.flash>0?'#ffffff':null});
    for(const a of acts){if(a.t>=a.ev.launch&&a.t<a.ev.show){const f=Math.min(1,(a.t-a.ev.launch)/FLY),x=lerp(me.x+6,gob.x-4,f),y=me.y-8-Math.sin(f*3.14)*6;
        const p={x,y,a:Math.atan2(-Math.cos(f*3.14)*6*3.14/FLY,1)};f2bolt(c,p,f<1?3:0,['#f0e0ff','#c8a0f0','#9060c8','#603a90']);
        if(f>=1){/* holding at the target until the server confirms */const k=Math.floor(now/80)%4;f2ring(c,x,y,3+(k&1),3+(k&1),'#e0c8ff');}}
      if(a.puff&&now-a.puff<330)f2puff(c,gob.x,gob.y-6,now-a.puff);
      if(a.phantom&&now-a.phantom<900)f2t(c,'PHANTOM HIT',gob.x,gob.y-36,'#ff9a9a',{al:'center',ol:f2C.ink});}
    sp.draw(c);nums.draw(c);
    // timeline of the last cast: client row and server row, 0 to 1000 ms
    const ty=AH+4,x0=34,sc=(W-x0-4)/1000;f2R(c,0,AH,W,1,f2C.line);f2t(c,'CLIENT',2,ty+5,f2C.mute);f2t(c,'SERVER',2,ty+21,f2C.mute);
    for(let m=0;m<=1000;m+=100){f2R(c,x0+m*sc,ty+1,1,m%500?2:4,'#4a4258');f2R(c,x0+m*sc,ty+29,1,m%500?2:4,'#4a4258');}
    f2R(c,x0,ty+9,W-x0-4,1,'#3a3346');f2R(c,x0,ty+25,W-x0-4,1,'#3a3346');
    if(last){const E=last.ev,X=m=>Math.round(x0+Math.min(1000,m)*sc);
      f2R(c,X(E.wind),ty+7,Math.max(1,X(E.launch)-X(E.wind)),5,f2C.gold);f2R(c,X(E.launch),ty+8,Math.max(1,X(E.arrive)-X(E.launch)),3,'#b07ae8');
      if(E.show>E.arrive)f2R(c,X(E.arrive),ty+8,Math.max(1,X(E.show)-X(E.arrive)),3,'#5a4a70');
      f2R(c,X(0),ty+5,1,9,f2C.wht);f2R(c,X(E.show),ty+5,1,9,f2NC.phys);
      f2R(c,X(E.srv),ty+21,Math.max(1,X(E.resolve)-X(E.srv)),5,'#6a9ae0');f2line(c,X(0),ty+13,X(E.srv),ty+21,'#6a6278',1,1);f2line(c,X(E.resolve),ty+21,X(E.confirm),ty+13,'#6a6278',1,1);
      const tn=Math.min(1000,last.t);f2R(c,X(tn),ty+3,1,28,'rgba(251,247,236,.6)');
      f2t(c,'WIND',X(E.wind)+1,ty,f2C.gold);f2t(c,'HIT',X(E.show)+2,ty+12,'#ff8a6a');}
    setHud(root,'');
    const first=last?(last.mode==='wait'?last.L:0):0;
    ro.innerHTML=`${idle>3?'Demo casting; click to cast · ':''}RTT <b>${q.v('rtt')} ms</b> · first feedback after the press <b>${first} ms</b> · bolt flies <b>${FLY} ms</b> (6 tiles) · number shows at <b>${last?Math.round(last.ev.show):'-'} ms</b>${last&&last.ev.show>last.ev.arrive?` (the bolt waited ${Math.round(last.ev.show-last.ev.arrive)} ms for the server)`:''}`;}};
});

// ======================================================================
// F3: favour the target (no rewind) against favour the shooter (rewind)
// ======================================================================
reg('favour',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const PH=54,SX=16,TX=132,YMIN=14,YMAX=44,V=192,INTERP=.1,bgA=f2ground(W,PH,121,{dirt:1,stones:1}),bgB=f2ground(W,PH,122,{dirt:1,stones:1});
  let mode='target',hist=[[0,29]],Y=29,vy=30,turn=1,t=0,shots=[],fireT=.8,tal={n:0,hit:0,tc:0,sc:0},msgs=[];
  q.seg('mode',v=>{mode=v;tal={n:0,hit:0,tc:0,sc:0};shots=[];fireT=.5;});
  const upd=()=>{q.out('ls',q.v('ls')+' ms');q.out('lt',q.v('lt')+' ms');};q.on('ls',upd);q.on('lt',upd);upd();
  const Yat=tt=>{if(tt<=hist[0][0])return hist[0][1];for(let i=hist.length-1;i>0;i--){if(hist[i-1][0]<=tt){const [a,ya]=hist[i-1],[b,yb]=hist[i];return b===a?yb:lerp(ya,yb,(tt-a)/(b-a));}}return Y;};
  const fx=f2fixed();
  const step=()=>{const dt=1/60;t+=dt;const Ls=q.v('ls')/1000,Lt=q.v('lt')/1000;
    // the target's own input: strafe, and dodge 200 ms after a bolt appears on its screen
    turn-=dt;for(const s of shots){if(!s.seen&&t>=s.tf+Ls/2+Lt/2){s.seen=1;s.dodgeAt=t+.2;}if(s.dodgeAt&&t>=s.dodgeAt&&!s.dodged){s.dodged=1;vy=(Y>29?-1:1)*34;turn=.5;}}
    if(turn<=0){turn=.6+Math.random()*.8;vy=(Math.random()<.5?-1:1)*30;}Y+=vy*dt;if(Y<YMIN){Y=YMIN;vy=30;}if(Y>YMAX){Y=YMAX;vy=-30;}hist.push([t,Y]);if(hist.length>400)hist.shift();
    // the shooter fires at the target where its own screen shows it
    fireT-=dt;if(fireT<=0){fireT=1.4;const ys=Yat(t-Lt/2-Ls/2-INTERP);const d=Math.hypot(TX-SX,ys-29),T=(TX-SX)/V;shots.push({tf:t,y0:29,y1:ys,T,res:{}});tal.n++;}
    for(const s of shots){const yAt=f=>lerp(s.y0,s.y1,f);
      const hitY=(py,ty)=>Math.abs(py-ty)<6;
      if(s.sv===undefined&&t>=s.tf+s.T){s.sv=hitY(yAt(1),Yat(s.tf+s.T-Lt/2-Ls/2-INTERP));}           /* shooter's screen */
      if(s.server===undefined&&t>=s.tf+Ls/2+s.T){s.server=mode==='target'?hitY(yAt(1),Yat(t-Lt/2)):hitY(yAt(1),Yat(s.tf+s.T-Lt/2-Ls/2-INTERP));if(s.server)tal.hit++;}
      if(s.tv===undefined&&t>=s.tf+Ls/2+Lt/2+s.T){s.tv=hitY(yAt(1),Y);}                                 /* target's screen */
      if(s.server!==undefined&&s.tv!==undefined&&s.sv!==undefined&&!s.done){s.done=1;if(s.server&&!s.tv){tal.tc++;s.tch=1;}if(!s.server&&s.sv){tal.sc++;s.sch=1;}}}
    shots=shots.filter(s=>t-s.tf<3);};
  const panel=(oy,bg,label,view)=>{c.drawImage(bg,0,oy);const Ls=q.v('ls')/1000,Lt=q.v('lt')/1000;
    const ty=view==='s'?Yat(t-Lt/2-Ls/2-INTERP):Y;const shooter={kind:'knight',pal:'foe',x:SX,y:oy+35},target={kind:'knight',pal:'party',x:TX,y:oy+Math.round(ty)+6,flip:true};
    let flash=false;
    for(const s of shots){const t0=view==='s'?s.tf:s.tf+Ls/2+Lt/2,f=(t-t0)/s.T;const res=view==='s'?(s.server!==undefined&&t>=s.tf+Ls/2+s.T+Ls/2?s.server:undefined):(s.server!==undefined&&t>=s.tf+Ls/2+s.T+Lt/2?s.server:undefined);
      if(f>=0&&f<1.25&&!(res===true&&f>1)){const x=lerp(SX+6,TX,f),y=oy+lerp(s.y0,s.y1,f);f2bolt(c,{x,y,a:Math.atan2(s.y1-s.y0,TX-SX-6)},3,['#ffd8a0','#f2a04a','#c06a20','#7a3a10']);}
      const rt=view==='s'?s.tf+Ls+s.T:s.tf+Ls/2+Lt/2+s.T;
      if(res!==undefined&&t-rt<.9&&t>=rt){if(res&&t-rt<.1)flash=true;const cheat=view==='s'?s.sch:s.tch;const ly=Math.max(oy+11,oy+Math.round(ty)-22);f2t(c,res?'HIT':'MISS',TX-10,ly+6,res?'#ff6a5a':'#c8c4d0',{al:'right',ol:f2C.ink});if(cheat)f2t(c,'NOT FAIR!',TX-10,ly+13,f2C.gold,{al:'right',ol:f2C.ink});}}
    f2unit(c,shooter);f2unit(c,target,{flash:flash?'#ffffff':null});
    f2R(c,0,oy,W,9,'rgba(23,18,28,.75)');f2t(c,label,3,oy+2,f2C.txt);};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.fillStyle=f2C.ink;c.fillRect(0,0,W,H);
    panel(0,bgA,"SHOOTER'S SCREEN (TARGET DRAWN LATE)",'s');panel(PH+2,bgB,"TARGET'S SCREEN (OWN MOVES AT ONCE)",'t');f2R(c,0,PH,W,2,f2C.line);
    setHud(root,'');
    ro.innerHTML=`<b>${mode==='target'?'Favour the target, the server checks positions now':'Favour the shooter, the server rewinds to what the shooter saw'}</b> · shots <b>${tal.n}</b> · hits <b>${tal.hit}</b> · target felt cheated <b>${tal.tc}</b> · shooter felt cheated <b>${tal.sc}</b>`;}};
});

// ======================================================================
// F4: OSRS 600 ms tick, a 100 ms step, per-entity scheduling
// ======================================================================
reg('ticks',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const X0=40,TW=W-X0-3,SPAN=3000,LANES=[{n:'OSRS TICK',s:'600 MS',k:'tick'},{n:'STEP',s:'100 MS',k:'step'},{n:'PER ENTITY',s:'SWING 2000',k:'ent'}];
  let t=0,presses=[],fires=[[],[],[]],waits=[[],[],[]],lastSwing=-9999,idle=3,autoT=0,swingFx=[0,0,0];
  const press=()=>{const p={t};presses.push(p);
    const tk=Math.ceil(t/600)*600,st=Math.ceil(t/100)*100,en=Math.max(t,lastSwing+2000);lastSwing=en;
    [tk,st,en].forEach((f,i)=>{fires[i].push({p:t,f});waits[i].push(f-t);if(waits[i].length>10)waits[i].shift();});};
  q.btn('press',()=>{idle=0;press();});pointer(cv,(_,k)=>{if(k==='down'){idle=0;press();}});
  root.addEventListener('keydown',e=>{if(e.key===' '&&e.target.closest('.stage')){e.preventDefault();idle=0;press();}});
  const fx=f2fixed();
  const step=()=>{const dt=1000/60;t+=dt*(q.v('slow')?1:1);idle+=dt/1000;if(idle>3){autoT-=dt;if(autoT<=0){autoT=500+Math.random()*900;press();}}
    for(let i=0;i<3;i++)for(const f of fires[i])if(!f.done&&t>=f.f){f.done=1;swingFx[i]=t;}
    presses=presses.filter(p=>t-p.t<SPAN+2500);for(let i=0;i<3;i++)fires[i]=fires[i].filter(f=>t-f.f<SPAN+200||!f.done);};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.fillStyle='#141019';c.fillRect(0,0,W,H);
    const X=tt=>Math.round(X0+TW-(t-tt)/SPAN*TW);
    f2t(c,'NOW',X0+TW,2,f2C.gold,{al:'right'});f2t(c,'3 S AGO',X0,2,f2C.mute);
    LANES.forEach((L,i)=>{const y=12+i*24;f2R(c,0,y,W,22,i%2?'#1a1522':'#1d1826');f2t(c,L.n,3,y+4,f2C.txt);f2t(c,L.s,3,y+12,f2C.mute);
      // beat marks
      if(L.k==='tick')for(let b=Math.floor((t-SPAN)/600)*600;b<=t;b+=600){const x=X(b);if(x>=X0)f2R(c,x,y+1,1,20,'#4a4258');}
      if(L.k==='step')for(let b=Math.floor((t-SPAN)/100)*100;b<=t;b+=100){const x=X(b);if(x>=X0)f2R(c,x,y+17,1,4,'#3a3448');}
      if(L.k==='ent'){/* creatures think every 1000 ms in 10 buckets of 100 ms */for(let k=0;k<10;k++){for(let b=Math.floor((t-SPAN)/1000)*1000+k*100;b<=t;b+=1000){const x=X(b);if(x>=X0)f2R(c,x,y+19,1,2,'#5a8a4a');}}}
      for(const f of fires[i]){const xp=X(f.p),xf=X(Math.min(t,f.f));if(xf<X0)continue;const y2=y+10;f2R(c,Math.max(X0,xp),y2,Math.max(0,xf-Math.max(X0,xp)),1,f.f>t?'#8a7a50':'#c8a050');
        if(xp>=X0){f2R(c,xp-1,y2-2,3,5,f2C.wht);}if(f.done){f2R(c,xf-1,y+4,3,13,'#ff6a4a');f2R(c,xf,y+3,1,15,'#ffd0a0');}}
      });
    // creature buckets: 10 goblins, each lights up on its 100 ms slot
    const by=86;f2t(c,'CREATURES',3,by+2,f2C.txt);f2t(c,'10 SLOTS',3,by+10,f2C.mute);
    for(let k=0;k<10;k++){const x=X0+1+Math.round(k*12.6),on=Math.floor((t%1000)/100)===k;const s=f2spr('gob','gob',0);c.globalAlpha=on?1:.45;c.drawImage(s,x,by+3);c.globalAlpha=1;f2t(c,String(k),x+4,by+16,on?f2C.gold:f2C.dim);}
    f2R(c,X0+TW,10,1,74,'rgba(242,193,78,.6)');
    setHud(root,'');
    const avg=i=>waits[i].length?Math.round(waits[i].reduce((a,b)=>a+b,0)/waits[i].length):0;
    ro.innerHTML=`${idle>3?'Demo presses; press yourself · ':''}average wait from press to action over the last ${waits[0].length} presses · OSRS tick <b>${avg(0)} ms</b> · 100 ms step <b>${avg(1)} ms</b> · per-entity swing <b>${avg(2)} ms</b> (waits only when the 2000 ms swing is not ready)`;}};
});

// ======================================================================
// F5 / H1: effect tiers own / party / others, hostile always on, source tags
// ======================================================================
reg('tiers',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums(),m=meter(.1),snd=f2snd(root);
  const bg=f2ground(W,H,131,{dirt:4,stones:3}),boss={x:85,y:34,flash:0};let party='reduced',others='off',clock=0,tele=[],tags=[],meHit=0,hitsOnMe=0,teleSeen=0;
  q.seg('party',v=>{party=v;});q.seg('others',v=>{others=v;});
  const P=[];const R=mkRng(5);
  for(let i=0;i<30;i++){const row=i<10?0:i<20?1:2,k=i%10,a=Math.PI*(.12+.76*(k+.5*(row&1))/10),rr=36+row*14;const x=Math.round(85+Math.cos(a)*rr*1.6),y=Math.round(34+Math.sin(a)*rr*.95)+6;
    P.push({x:clamp(x,8,W-8),y:clamp(y,40,H-3),tier:'others',pal:'other',cd:R()*2,flash:0,flip:x>85});}
  P.sort((a,b)=>Math.abs(a.x-85)+(H-a.y)*2-(Math.abs(b.x-85)+(H-b.y)*2));P[0].tier='own';P[0].pal='me';for(let i=1;i<5;i++){P[i].tier='party';P[i].pal='party';}
  const lvl=t=>t==='own'?'full':t==='party'?party:others;
  const DB={own:0,party:-10,others:-10,creatures:-6};let sndBudget=0;
  const fx=f2fixed();
  const step=()=>{const dt=1/60;clock+=dt;sp.step(dt);nums.step(1000/60);if(boss.flash>0)boss.flash--;sndBudget=Math.max(0,sndBudget-dt*8);
    for(const p of P){p.cd-=dt;if(p.flash>0)p.flash--;if(p.cd<=0){p.cd=1.2+Math.random()*1.2;const L=lvl(p.tier);
      if(L!=='off'){const full=L==='full';sp.burst(boss.x+(Math.random()-.5)*14,boss.y-8+(Math.random()-.5)*10,full?10:3,p.tier==='own'?['#ffe066','#fff','#f2c14e']:p.tier==='party'?['#a0f0a0','#fff']:['#c8c0d8','#fff'],full?60:40);
        if(full)nums.add(boss.x+(Math.random()-.5)*26,boss.y-24,10+((Math.random()*30)|0),p.tier==='own'?'#ffe066':f2NC.phys,{key:p.tier==='own'?'own':'x'+((Math.random()*4)|0)});
        boss.flash=Math.max(boss.flash,full?4:1);if(q.v('tags'))tags.push({x:p.x,y:p.y-16,s:p.tier==='own'?'OWN':'OTHERS',col:p.tier==='own'?f2C.gold:'#b8b0c8',t:0});
        if(snd()&&(p.tier==='own'||sndBudget<3)){sndBudget++;const g=Math.pow(10,DB[p.tier]/20);f2AU.hit({type:'square',f:p.tier==='own'?620:420+Math.random()*120,sus:4,dec:70,vol:.08*g});}}}}
    // the boss always telegraphs, whatever the tiers say (hostile always on)
    if(Math.random()<dt/2.6&&tele.length<2){const tg=P[Math.random()<.35?0:(Math.random()*P.length)|0];tele.push({x:tg.x,y:tg.y-4,t:0,lead:1.2});}
    for(const e of tele){e.t+=dt;if(e.t>=e.lead&&!e.done){e.done=1;for(const p of P)if(Math.hypot(p.x-e.x,p.y-4-e.y)<14){p.flash=6;if(p.tier==='own'){meHit++;nums.add(p.x,p.y-18,30,f2NC.phys);}}
      sp.burst(e.x,e.y,14,['#ffb04a','#ffe066'],70);if(q.v('tags'))tags.push({x:e.x,y:e.y-12,s:'CREATURES',col:'#ffb04a',t:0});if(snd()){f2AU.hit({type:'noise',f:500,sus:10,dec:160,vol:.1*Math.pow(10,DB.creatures/20)});}}}
    tele=tele.filter(e=>e.t<e.lead+.3);for(const g of tags)g.t+=dt;tags=tags.filter(g=>g.t<.7);};
  return {tick(dt){m.t0();fx(dt,step);c.drawImage(bg,0,0);const cull=q.v('cull');
    for(const e of tele){if(cull&&others==='off')continue;const f=sat(e.t/e.lead),r=14;for(let y=-r;y<=r;y+=2)for(let x=-r;x<=r;x+=2){if(x*x+y*y>r*r||((x+y)>>1&1))continue;const d=Math.hypot(x,y)/r;f2R(c,e.x+x,e.y+y*.7,2,2,d<=f?'rgba(255,160,50,.8)':'rgba(255,160,50,.25)');}f2ring(c,e.x,e.y,r,r*.7,'#3a1a08');}
    const bs=f2spr('gob','gob2',0),bw=bs.width*2,bh=bs.height*2;c.drawImage(boss.flash>0?f2sil(bs,'#ffffff'):bs,boss.x-bw/2,boss.y-bh+1,bw,bh);f2R(c,boss.x-12,boss.y+1,24,1,'rgba(10,8,14,.4)');
    for(const p of [...P].sort((a,b)=>a.y-b.y)){f2unit(c,{kind:'knight',pal:p.pal,x:p.x,y:p.y,flip:p.flip},{flash:p.flash>0?'#ffffff':null});}
    f2ring(c,P[0].x,P[0].y,6,2,f2C.gold);
    sp.draw(c);nums.draw(c);
    for(const g of tags)f2t(c,g.s,g.x,g.y-Math.round(g.t*8),g.col,{al:'center',ol:f2C.ink});
    const ms=m.t1();setHud(root,'');
    ro.innerHTML=`Own <b>full</b> · party <b>${party}</b> · others <b>${others}</b> · enemy telegraphs <b>${cull&&others==='off'?'hidden (fairness bug)':'always full'}</b> · particles <b>${sp.L.length}</b> · numbers <b>${nums.L.length}</b> · frame work <b>${fms(m.v)} ms</b> measured here · boss hits on you <b>${meHit}</b> · ${snd()?'<b>sound on</b>, OWN 0 dB, CREATURES −6, OTHERS −10':'muted'}`;}};
});


// ======================================================================
// G1: one button mashed under four rules: WoW queue, Tibia exhaust,
// OSRS tick, FFXIV lock
// ======================================================================
reg('queue',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const X0=40,TW=W-X0-3,SPAN=4000,GCD=1000,SC=['#f2c14e','#7fb8ff'];
  const LN=[{n:'WOW',s:'QUEUE'},{n:'TIBIA',s:'EXHAUST'},{n:'OSRS',s:'NEXT TICK'},{n:'FFXIV',s:'LOCK'}];
  let t=0,idle=3,autoT=0,lanes;const reset=()=>{lanes=LN.map(()=>({ev:[],ready:0,slot:null,fired:0,dropped:0,delay:[],lock:0}));};reset();
  const upd=()=>{q.out('win',q.v('win')+' ms');q.out('ping',q.v('ping')+' ms');};q.on('win',upd);q.on('ping',upd);upd();
  const press=k=>{const L=q.v('ping'),arr=t+L/2,win=q.v('win');
    lanes.forEach((ln,i)=>{const e={p:t,k,arr,st:'wait'};ln.ev.push(e);
      if(i===0){/* WoW: queue window, one slot, last press wins */e.chk=arr;}
      if(i===1){e.chk=arr;}
      if(i===2){e.chk=arr;}
      if(i===3){/* FFXIV: the client ignores presses during its 500 ms lock */if(t<ln.lock){e.st='drop';e.why='lock';ln.dropped++;}else{e.chk=arr;ln.lock=t+500;}}});};
  ['1','2'].forEach((v,i)=>q.btn('s'+v,()=>{idle=0;press(i);}));
  root.addEventListener('keydown',e=>{if((e.key==='1'||e.key==='2')&&e.target.closest('.fig')){idle=0;press(+e.key-1);}});
  const fire=(ln,e,at)=>{e.st='fire';e.f=at;ln.fired++;ln.delay.push(at-e.p);if(ln.delay.length>10)ln.delay.shift();};
  const fx=f2fixed();
  const step=()=>{const dt=1000/60;t+=dt;idle+=dt/1000;const L=q.v('ping'),win=q.v('win');
    if(idle>3){autoT-=dt;if(autoT<=0){autoT=230+Math.random()*260;press(Math.random()<.8?0:1);}}
    lanes.forEach((ln,i)=>{for(const e of ln.ev){if(e.st!=='wait'||t<e.chk)continue;
        if(i===0){const rem=ln.ready-e.arr;if(rem<=0&&!ln.slot){fire(ln,e,e.arr);ln.ready=e.arr+GCD;}else if(rem<=win){if(ln.slot&&ln.slot!==e){ln.slot.st='drop';ln.slot.why='replaced';ln.dropped++;}ln.slot=e;e.st='queued';}else{e.st='drop';e.why='early';ln.dropped++;}}
        else if(i===1){if(e.arr>=ln.ready){fire(ln,e,e.arr);ln.ready=e.arr+GCD;}else{e.st='drop';e.why='exhausted';e.msg=t;ln.dropped++;}}
        else if(i===2){const tick=Math.ceil(Math.max(e.arr,ln.ready)/600)*600;if(ln.slot&&ln.slot!==e&&ln.slot.f>t){ln.slot.st='drop';ln.slot.why='replaced';ln.dropped++;}e.st='queued';e.f=tick;ln.slot=e;}
        else{if(e.arr>=ln.ready){fire(ln,e,e.arr);ln.ready=e.arr+600+L;}else{e.st='drop';e.why='server';ln.dropped++;}}}
      if(i===0&&ln.slot&&ln.slot.st==='queued'&&t>=ln.ready){fire(ln,ln.slot,ln.ready);ln.ready+=GCD;ln.slot=null;}
      if(i===2&&ln.slot&&ln.slot.st==='queued'&&t>=ln.slot.f){const e=ln.slot;fire(ln,e,e.f);ln.ready=e.f+1200;ln.slot=null;}
      ln.ev=ln.ev.filter(e=>t-e.p<SPAN+400);});};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.fillStyle='#141019';c.fillRect(0,0,W,H);
    const X=tt=>Math.round(X0+TW-(t-tt)/SPAN*TW);f2t(c,'NOW',X0+TW,2,f2C.gold,{al:'right'});f2t(c,'4 S AGO',X0,2,f2C.mute);
    lanes.forEach((ln,i)=>{const y=11+i*25;f2R(c,0,y,W,23,i%2?'#1a1522':'#1d1826');f2t(c,LN[i].n,3,y+4,f2C.txt);f2t(c,LN[i].s,3,y+12,f2C.mute);
      if(i===2)for(let b=Math.floor((t-SPAN)/600)*600;b<=t;b+=600){const x=X(b);if(x>=X0)f2R(c,x,y+1,1,21,'#4a4258');}
      // GCD bars after each fire
      for(const e of ln.ev){if(e.st!=='fire')continue;const d=i===2?1200:i===3?600+q.v('ping'):GCD,x1=X(e.f),x2=X(Math.min(t,e.f+d));if(x2>X0)f2R(c,Math.max(X0,x1),y+17,x2-Math.max(X0,x1),2,'#3a3448');}
      for(const e of ln.ev){const xp=X(e.p);if(xp<X0)continue;const col=SC[e.k];
        if(e.st==='drop'){const xc=e.why==='replaced'?'#7a7488':e.why==='early'?'#a04a4a':'#ff4a3a';f2line(c,xp-1,y+4,xp+1,y+6,xc);f2line(c,xp-1,y+6,xp+1,y+4,xc);}else f2R(c,xp,y+3,1,5,col);
        if(e.st==='fire'){const xf=X(e.f);f2R(c,xp,y+10,Math.max(0,xf-xp),1,'#6a6278');f2R(c,xf-1,y+8,4,8,col);f2R(c,xf-1,y+8,4,1,'#ffffff');}
        if(e.st==='queued'){const xf=X(Math.min(t,e.f||t)),pulse=Math.floor(t/120)&1;f2R(c,xp,y+10,Math.max(0,X(t)-xp),1,'#6a6278');f2R(c,X(t)-4,y+8,4,8,pulse?col:'#2a2433');}
        if(e.msg&&t-e.msg<700&&e===ln.ev.filter(x=>x.msg).slice(-1)[0])f2t(c,'EXHAUSTED',Math.min(xp+3,W-38),y+9,'#ffffff',{ol:f2C.ink});}});
    f2R(c,X0+TW,10,1,100,'rgba(242,193,78,.6)');
    setHud(root,'');
    const avg=ln=>ln.delay.length?Math.round(ln.delay.reduce((a,b)=>a+b,0)/ln.delay.length):0;
    ro.innerHTML=`${idle>3?'Demo mashing; press 1 or 2 yourself · ':''}fired / dropped · WoW <b>${lanes[0].fired} / ${lanes[0].dropped}</b> · Tibia <b>${lanes[1].fired} / ${lanes[1].dropped}</b> · OSRS <b>${lanes[2].fired} / ${lanes[2].dropped}</b> · FFXIV <b>${lanes[3].fired} / ${lanes[3].dropped}</b> · average press to fire ${lanes.map((ln,i)=>LN[i].n+' '+avg(ln)+' ms').join(', ')}`;}};
});

// ======================================================================
// G2 / G3: diminishing returns, knockback immunity, PvP damage x0.5 and
// no hitstop on the victim player
// ======================================================================
reg('pvp',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums();
  const AH=62,bg=f2ground(W,AH,141,{dirt:2,stones:1});let view='att',t=0,hits=0,trauma=0,idle=3,autoT=.4,auto=0;
  const atkA={kind:'knight',pal:'me',x:22,y:40,hold:0},gob={kind:'gob',pal:'gob',x:44,y:40,stop:0,flash:0,kb:0,tile:0,flinch:0,flip:true};
  const atkB={kind:'knight',pal:'me',x:106,y:40,hold:0},vic={kind:'knight',pal:'foe',x:128,y:40,flash:0,flinch:0,walk:0,vy:14,kb:0,flip:true};
  // DR: 100%, 50%, immune, 20 s reset; knockback then 10 s immune
  let dr={n:0,reset:-1,stunEnd:-1},kbImm=-1,log=[],BASE=4,mobKB=0;
  const sec=()=>t/1000;
  q.seg('view',v=>{view=v;});
  const doHit=()=>{hits++;
    gob.flash=6;gob.stop=3;atkA.hold=3;gob.flinch=6;nums.add(gob.x,gob.y-16,20,f2NC.phys);sp.burst(gob.x-3,gob.y-6,6,['#ffe066','#fff'],45);
    vic.flash=6;vic.flinch=4;atkB.hold=view==='att'?3:0;nums.add(vic.x,vic.y-16,10,f2NC.phys);sp.burst(vic.x-3,vic.y-6,6,['#ffe066','#fff'],45);if(view==='vic')trauma=Math.min(1,trauma+.35);};q.btn('hit',()=>{idle=0;doHit();});
  const doStun=()=>{const s=sec();if(dr.reset>=0&&s>=dr.reset)dr.n=0;let mult=dr.n===0?1:dr.n===1?.5:0;const dur=Math.min(6,BASE*mult);
    log.push({t:s,dur,lab:mult===1?'100%':mult===.5?'50%':'IMMUNE'});if(dur>0){dr.stunEnd=Math.max(dr.stunEnd,s)+0+dur;}dr.n=Math.min(2,dr.n+1);dr.reset=(dur>0?s+dur:s)+20;};q.btn('stun',()=>{idle=0;doStun();});
  const doKB=()=>{const s=sec();mobKB=6;gob.kb=16;if(s>=kbImm){vic.kb=16;kbImm=s+10;log.push({t:s,dur:0,lab:'PUSH',kb:1});}else log.push({t:s,dur:0,lab:'NO PUSH',kb:1});};q.btn('kb',()=>{idle=0;doKB();});
  const fx=f2fixed();
  const step=()=>{const ms=1000/60*(q.v('fast')?4:1);t+=ms;sp.step(1/60);nums.step(1000/60);trauma=Math.max(0,trauma-1/60*1.5);idle+=1/60;if(idle>3){autoT-=1/60;if(autoT<=0){autoT=1.1;auto=(auto||0)+1;if(auto%5===0)doStun();else if(auto%11===0)doKB();else doHit();}}
    if(gob.stop>0)gob.stop--;if(atkA.hold>0)atkA.hold--;if(atkB.hold>0)atkB.hold--;
    for(const u of [gob,vic]){if(u.flash>0)u.flash--;if(u.flinch>0&&u.stop<=0)u.flinch--;}
    if(gob.kb>0&&gob.stop<=0){gob.kb--;gob.x=Math.min(60,gob.x+1);}if(gob.kb<=0&&gob.x>44)gob.x-=.25;
    const stunned=sec()<dr.stunEnd;if(!stunned){vic.walk+=1/60;vic.y+=vic.vy/60;if(vic.y<28){vic.y=28;vic.vy=14;}if(vic.y>54){vic.y=54;vic.vy=-14;}}
    if(vic.kb>0){vic.kb--;vic.x=Math.min(144,vic.x+1);}else if(vic.x>128)vic.x-=.25;
    log=log.filter(l=>sec()-l.t<32);};
  return {tick(dt){fx(dt,step);c.fillStyle='#141019';c.fillRect(0,0,W,H);
    const sh=view==='vic'?Math.round((Math.random()*2-1)*trauma*trauma*3):0,sv=view==='vic'?Math.round((Math.random()*2-1)*trauma*trauma*3):0;
    c.save();c.translate(sh,sv);c.drawImage(bg,0,0);f2R(c,84,0,1,AH,'rgba(23,18,28,.6)');
    f2t(c,'VS MONSTER',3,3,f2C.txt);f2t(c,'VS PLAYER',88,3,f2C.txt);
    // left: monster gets hitstop, flinch and the full tile push
    f2unit(c,atkA,{dx:atkA.hold>0?2:0});f2unit(c,gob,{flash:gob.flash>0?'#ffffff':null,dx:gob.stop>0?((gob.stop&1)?1:-1):gob.flinch>0?1:0});
    // right: the player keeps moving; only a cosmetic 1 px flinch
    const stunned=sec()<dr.stunEnd;
    f2unit(c,atkB,{dx:atkB.hold>0?2:0});f2unit(c,{...vic,x:Math.round(vic.x),y:Math.round(vic.y)},{fr:stunned?0:Math.floor(vic.walk*6)&1,flash:vic.flash>0?(view==='att'?'#ffffff':'#ff9a8a'):null,dx:vic.flinch>0?1:0});
    if(stunned){const k=Math.floor(t/150)%3;for(let i=0;i<3;i++){const a=t/300+i*2.1;f2P(c,vic.x+Math.cos(a)*5,vic.y-17+Math.sin(a)*2,f2C.yel);}}
    // DR pips over the player
    const s=sec(),drn=dr.reset>=0&&s>=dr.reset?0:dr.n;for(let i=0;i<2;i++)f2R(c,vic.x-4+i*5,vic.y-21,4,2,i<drn?(drn===2?f2C.red:f2C.gold):'#3a3448');
    if(s<kbImm){f2t(c,'KB IMMUNE '+Math.ceil(kbImm-s),vic.x,vic.y+3,'#c8c0d8',{al:'center',ol:f2C.ink});}
    sp.draw(c);nums.draw(c);c.restore();
    // DR timeline, last 30 s
    const ty=AH+3,X0=4,TW=W-8,X=tt=>Math.round(X0+TW-(s-tt)/30*TW);f2R(c,0,AH,W,1,f2C.line);
    f2t(c,'STUNS ON THE PLAYER, LAST 30 S',X0,ty,f2C.mute);f2R(c,X0,ty+19,TW,1,'#3a3448');
    for(let k=0;k<=30;k+=5){const x=X(s-k);f2R(c,x,ty+19,1,3,'#4a4258');}
    for(const l of log){const x1=X(l.t);if(l.kb){f2R(c,x1,ty+21,1,6,'#7fd6e6');continue;}if(l.dur>0){const x2=X(Math.min(s,l.t+l.dur));f2R(c,x1,ty+9,Math.max(1,x2-x1),9,l.lab==='100%'?f2C.gold:'#c58a2c');f2t(c,l.lab,x1+1,ty+11,f2C.ink);}else{f2t(c,'IMMUNE',x1,ty+11,f2C.red);f2R(c,x1,ty+9,1,9,f2C.red);}}
    if(dr.reset>=0&&s<dr.reset){const x=X(s);f2t(c,'RESET IN '+Math.ceil(dr.reset-s)+' S',W-4,ty+30,f2C.cyan,{al:'right'});}else f2t(c,'DR CLEAR',W-4,ty+30,'#7cc56a',{al:'right'});
    f2t(c,'GOLD 100%, DARK 50%, BLUE PUSH',X0,ty+30,f2C.dim);
    setHud(root,'');
    ro.innerHTML=`Monster takes <b>20</b> with hitstop, flinch and a 1 tile push · player takes <b>10</b> (x0.5), no hitstop, keeps walking · ${view==='att'?'attacker sees the full white flash and its own hold':'victim sees a tint and its own small shake, never a freeze'} · next stun <b>${drn===0?'100%':drn===1?'50%':'immune'}</b>`;}};
});


// ======================================================================
// H2 / H3: a 16-voice pool, 3 per sound id, 40 ms between starts of one id,
// priority stealing; short synthesized hits in jsfxr's hitHurt ranges
// ======================================================================
reg('voices',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),snd=f2snd(root),m=meter(.1);
  // priority 5 own hit, 4 hit on you, 3 crit or kill involving you, 2 others, 1 ambient (H2)
  const SRC=[{id:'own',p:5,w:.1,col:'#ffe066',n:'OWN HIT'},{id:'onme',p:4,w:.05,col:'#ff6a5a',n:'HIT ON YOU'},{id:'crit',p:3,w:.03,col:'#ffb04a',n:'CRIT / KILL'},{id:'oth1',p:2,w:.35,col:'#9a98c8',n:'OTHERS'},{id:'oth2',p:2,w:.35,col:'#8088b8',n:''},{id:'amb',p:1,w:.12,col:'#5a8a6a',n:'AMBIENT'}];
  const POOL=16,PER=3,GAP=40;let V=[],t=0,acc=0,last={},ev=[],cnt={play:0,stolen:0,drop:0},rate=[],pr=0;
  // jsfxr hitHurt-like params per source: wave, start Hz (145 to 2260), sustain 0 to 23 ms, decay 23 to 204 ms
  const PARAM={own:{type:'square',f:880,sus:12,dec:110},onme:{type:'sawtooth',f:300,sus:20,dec:160},crit:{type:'square',f:1400,sus:23,dec:204},oth1:{type:'noise',f:900,sus:6,dec:80},oth2:{type:'square',f:520,sus:4,dec:60},amb:{type:'sawtooth',f:180,sus:0,dec:120}};
  q.on('hps',()=>q.out('hps',q.v('hps')+' /s'));q.out('hps',q.v('hps')+' /s');
  const pick=()=>{let r=Math.random(),s=0;for(const x of SRC){s+=x.w;if(r<s)return x;}return SRC[3];};
  const trig=src=>{const pool=q.v('pool'),P=PARAM[src.id],dur=P.sus+P.dec;let res='play',victim=null;
    if(pool){if(last[src.id]!==undefined&&t-last[src.id]<GAP)res='drop';
      else if(V.filter(v=>v.id===src.id).length>=PER){const old=V.filter(v=>v.id===src.id).sort((a,b)=>a.t0-b.t0)[0];victim=old;res='steal';}
      else if(V.length>=POOL){const low=[...V].sort((a,b)=>a.p-b.p||(a.end-t)-(b.end-t))[0];if(low.p<src.p||(low.p===src.p&&src.p<5)){victim=low;res='steal';}else res='drop';}}
    if(res==='drop'){cnt.drop++;ev.push({t,p:src.p,r:'drop',col:src.col});return;}
    if(victim){V.splice(V.indexOf(victim),1);cnt.stolen++;ev.push({t,p:victim.p,r:'stolen',col:victim.col});if(victim.a){try{victim.a.g.gain.cancelScheduledValues(0);victim.a.g.gain.setTargetAtTime(0,f2AU.ctx.currentTime,.004);victim.a.src.stop(f2AU.ctx.currentTime+.02);}catch(_){}}}
    last[src.id]=t;cnt.play++;let a=null;
    if(snd()){m.t0();const pitch=Math.pow(2,(Math.random()*2-1)/12);/* plus or minus 1 semitone, none on crits */a=f2AU.hit({...P,f:P.f*(src.id==='crit'?1:pitch),vol:(src.p>=3?.07:.035)*(pool?1:.6)});m.t1();}
    V.push({id:src.id,p:src.p,col:src.col,t0:t,end:t+dur,dur,a,flash:victim?6:0});ev.push({t,p:src.p,r:'play',col:src.col});};
  q.btn('own',()=>trig(SRC[0]));
  const fx=f2fixed();
  const step=()=>{const dt=1000/60;t+=dt;acc+=q.v('hps')*dt/1000;while(acc>=1){acc--;trig(pick());}
    V=V.filter(v=>v.end>t);for(const v of V)if(v.flash>0)v.flash--;ev=ev.filter(e=>t-e.t<2000);pr=Math.max(pr,V.length);};
  return {tick(dt){fx(dt,step);c.fillStyle='#141019';c.fillRect(0,0,W,H);
    // the pool: 16 slots
    const pool=q.v('pool'),N=pool?POOL:Math.max(POOL,V.length);f2t(c,pool?'VOICE POOL 16':'NO LIMIT',3,3,f2C.txt);f2t(c,V.length+' PLAYING',W-3,3,V.length>POOL?f2C.red:f2C.gold,{al:'right'});
    const cols=8,cw=20,chh=10;for(let i=0;i<Math.max(POOL,Math.min(40,V.length));i++){const x=3+(i%cols)*cw,y=11+Math.floor(i/cols)*(chh+2);if(y>11+4*(chh+2))break;const v=V[i];const extra=i>=POOL;
      f2R(c,x,y,cw-2,chh,extra?'#3a1820':'#221c2c');if(v){const f=(v.end-t)/v.dur;f2R(c,x+1,y+1,Math.round((cw-4)*f),chh-2,v.col);if(v.flash>0)f2R(c,x,y,cw-2,chh,'rgba(255,255,255,.7)');}
      f2R(c,x,y,cw-2,1,extra?'#7a2a3a':'#3a3346');}
    // legend
    const ly=11+2*(chh+2)+3+(V.length>POOL&&!pool?2*(chh+2):0);SRC.filter(s=>s.n).forEach((s,i)=>{const lx=3+(i%3)*56,yy=ly+Math.floor(i/3)*8;f2R(c,lx,yy+1,4,4,s.col);f2t(c,s.n,lx+6,yy,f2C.mute);});
    // last 2 s of triggers, one row per priority: dot played, ring stolen, x dropped
    const ry=H-38;f2R(c,0,ry-3,W,1,f2C.line);['P5','P4','P3','P2','P1'].forEach((n,i)=>f2t(c,n,3,ry+i*7,f2C.dim));
    for(const e of ev){const x=Math.round(W-3-(t-e.t)/2000*(W-18)),y=ry+(5-e.p)*7+2;if(e.r==='play')f2R(c,x,y,2,2,e.col);else if(e.r==='stolen'){f2R(c,x,y,2,2,'#141019');f2P(c,x-1,y,f2C.red);f2P(c,x+2,y+1,f2C.red);}else{f2P(c,x,y,'#ff3a3a');f2P(c,x+1,y+1,'#ff3a3a');f2P(c,x+1,y,'#ff3a3a');f2P(c,x,y+1,'#ff3a3a');}}
    setHud(root,'');
    ro.innerHTML=`${snd()?'<b>Sound on</b>':'Muted until you click Sound off'} · triggers <b>${cnt.play}</b> · stolen <b>${cnt.stolen}</b> · dropped <b>${cnt.drop}</b> · peak voices <b>${pr}</b>${snd()?` · main thread per trigger <b>${fms(m.v)} ms</b> measured here`:''} · own hits are never stolen`;}};
});

// ======================================================================
// H4: crit and overkill feedback stack, each layer on its own switch
// ======================================================================
reg('critstack',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums(),snd=f2snd(root);
  const bg=f2ground(W,H,151,{dirt:2,stones:2});const atk={kind:'knight',pal:'me',x:62,y:62},tg={kind:'knight',pal:'foe',x:84,y:62,flash:0,hp:100,dead:0,flip:true};
  let view='att',stop=0,trauma=0,kick=0,fxImg=[],idle=3,autoT=0,n=0,lastKind='',t=0;
  q.seg('view',v=>{view=v;});
  const L=k=>q.v(k);
  const hit=kind=>{const crit=kind!=='norm',over=kind==='over';lastKind=kind;n++;const me=view==='att',vic=view==='vic',by=view==='by';
    const dmg=crit?(over?96:42):14;
    // bystander: the impact sprite only (Tibia sends the crit effect to all, the text only to the attacker)
    if(L('sparks'))sp.burst(tg.x-2,tg.y-7,crit?(by?6:14):5,crit?['#ffe066','#ffffff','#ffb04a']:['#ffe066','#ffffff'],crit?75:50);
    fxImg.push({x:tg.x,y:tg.y-7,t:0,crit});
    if(!by){if(L('num'))nums.add(tg.x,tg.y-18,dmg,crit?f2NC.crit:f2NC.phys,{crit,nomerge:1});if(L('flash'))tg.flash=crit?6:4;}
    else if(L('flash'))tg.flash=2;
    if(me&&L('stop'))stop=crit?6:3;
    if(me&&crit&&L('kick')){trauma=Math.min(1,trauma+.3);kick=2;}
    if(vic&&L('kick'))trauma=Math.min(1,trauma+(crit?.35:.15));
    if(snd()&&L('snd')){const db=by?-12:0,g=Math.pow(10,db/20);f2AU.hit({type:'square',f:crit?1200:700,sus:crit?20:8,dec:crit?180:90,vol:.08*g});if(crit)f2AU.hit({type:'noise',f:400,sus:10,dec:140,vol:.06*g});}
    if(over){tg.dead=1;tg.pop=0;}};
  ['norm','crit','over'].forEach(k=>q.btn(k,()=>{idle=0;if(!tg.dead)hit(k);}));
  const fx=f2fixed();
  const step=()=>{const dt=1/60;t+=dt;idle+=dt;if(stop>0){stop--;}else{sp.step(dt);}nums.step(1000/60);trauma=Math.max(0,trauma-dt*1.6);if(kick>0)kick=Math.max(0,kick-dt*20);
    if(tg.flash>0&&stop<=0)tg.flash--;for(const f of fxImg)f.t+=dt*1000;fxImg=fxImg.filter(f=>f.t<300);
    if(tg.dead){tg.dead+=dt;if(tg.dead>1.6){tg.dead=0;tg.flash=0;}}
    if(idle>3){autoT-=dt;if(autoT<=0){autoT=1.2;if(!tg.dead){const r=n%5;hit(r===4?'over':r%2?'crit':'norm');}}}};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);
    const sx=Math.round((Math.random()*2-1)*trauma*trauma*4)-Math.round(kick),sy=Math.round((Math.random()*2-1)*trauma*trauma*4);
    c.fillStyle=f2C.ink;c.fillRect(0,0,W,H);c.save();c.translate(sx,sy);c.drawImage(bg,0,0);
    const frozen=stop>0;f2unit(c,atk,{dx:frozen?2:0});
    if(!tg.dead)f2unit(c,tg,{flash:tg.flash>0?'#ffffff':null,dx:frozen?((stop&1)?1:-1):0});
    else if(tg.dead<.2){const k=tg.dead/.2;f2unit(c,tg,{flash:'#ffffff',sx:1+.6*k,sy:1-.5*k,alpha:1-k});if(!tg.burst){tg.burst=1;sp.burst(tg.x,tg.y-6,28,['#ffe066','#ffffff','#e2483a','#ffb04a'],95,{life:.45});}}
    if(!tg.dead)tg.burst=0;
    for(const f of fxImg)f2hit(c,f.x,f.y,f.t,f.crit?'#ffb04a':'#ffe066');
    sp.draw(c);nums.draw(c);c.restore();
    f2t(c,{att:"ATTACKER'S SCREEN",vic:"VICTIM'S SCREEN",by:"BYSTANDER'S SCREEN"}[view],3,3,f2C.txt,{ol:f2C.ink});
    const on=['num','stop','flash','kick','snd','sparks'].filter(k=>L(k));
    setHud(root,'');
    ro.innerHTML=`${idle>3?'Demo hitting; press a button yourself · ':''}last <b>${{norm:'normal hit',crit:'crit',over:'overkill',['']:'none'}[lastKind]}</b> · layers on <b>${on.length?on.join(', '):'none'}</b> · ${view==='att'?'you get crit digits, 6-frame hitstop, trauma +0.3 and a 2 px kick':view==='vic'?'the victim gets the digits, the flash and a sound at 0 dB, plus its own small shake':'a bystander gets the impact sprite and a sound at −12 dB'}`;}};
});

// ======================================================================
// H5: kill confirmation, death pop, corpse at about 133 ms, rot stages
// ======================================================================
const f2CORPSE=[["..........","...oooo...",".oogggGoo.","ogyggcccGo","oggwgccbGo",".oogGGooo.","..........."].map(r=>r.slice(0,10)),
  ["..........","...oooo...",".oogGGGoo.","oGkGGcccGo","oGGGGccbGo",".ooGGGooo.",".........."],
  ["..........","..........","...o..o...","..owo.owo.",".owwwowwo.","..oo.ooo..",".........."]];
reg('death',root=>{const {cv,c,W,H}=f2cv(root),q=ctl(root),ro=$('[data-ro]',root),sp=f2sparks(),nums=f2nums(),snd=f2snd(root);
  const AH=66,bg=f2ground(W,AH,161,{dirt:2,stones:1}),me={kind:'knight',pal:'me',x:40,y:44};
  let G=[],t=0,idle=3,autoT=.5,stripF=-1,clock=0;const SCALE={1:1,20:20,60:60};
  const ROT=[120,120,30];/* seconds per stage (Asterion), shown compressed */
  const spawn=()=>{G=G.filter(g=>g.state!=='alive');G.push({state:'alive',x:72+((Math.random()*3)|0)*12,y:44,flash:0,hp:1});};
  spawn();
  const kill=()=>{const g=G.find(x=>x.state==='alive');if(!g)return;g.state='dying';g.t=0;g.inst=q.v('tibia');stripF=0;
    if(!g.inst){nums.add(g.x,g.y-18,'+120 XP','#9fe870',{nomerge:1,life:800,rise:16});}
    if(snd()){f2AU.hit({type:'square',f:660,sus:0,dec:60,vol:.06});setTimeout(()=>f2AU.hit({type:'square',f:990,sus:0,dec:90,vol:.05}),70);}};
  q.btn('kill',()=>{idle=0;kill();});q.seg('ts',v=>{});
  const fx=f2fixed();
  const step=()=>{const dt=1/60;t+=dt;idle+=dt;sp.step(dt);nums.step(1000/60);const k=+(q.segv('ts')||20);
    if(idle>3){autoT-=dt;if(autoT<=0){autoT=2.4;if(G.some(g=>g.state==='alive'))kill();}}
    for(const g of G){if(g.state==='dying'){g.t+=dt*1000;if(g.inst||g.t>=133){g.state='corpse';g.age=0;sp.burst(g.x,g.y-4,g.inst?10:8,g.inst?['#a02020','#d03030']:['#ffffff','#9fe870','#ffe066'],g.inst?35:55,{life:.3});if(!G.some(x=>x.state==='alive'))setTimeout(spawn,500);}}
      else if(g.state==='corpse'){g.age+=dt*k;}}
    if(stripF>=0)stripF++;
    G=G.filter(g=>g.state!=='corpse'||g.age<ROT[0]+ROT[1]+ROT[2]);};
  // death frames at 60 fps: 0-1 white flash, 2-7 squash to 1.2 x 0.8 with a dither fade, 8 corpse (about 133 ms)
  const drawDying=(cx,g,x,y,f)=>{const s=f2spr('gob','gob',0);
    if(f<2){f2unit(cx,{kind:'gob',pal:'gob',x,y},{flash:'#ffffff'});return;}
    const k=(f-2)/6,sx=1+.2*Math.min(1,k*2),sy=1-.2*Math.min(1,k*2),w=Math.round(s.width*sx),h=Math.round(s.height*sy);f2dither(cx,s,x-Math.round(w/2),y-h,1-k,w,h);};
  const drawCorpse=(cx,g,x,y)=>{const a=g.age,st=a<ROT[0]?0:a<ROT[0]+ROT[1]?1:2;const s=f2S(f2CORPSE[st],{o:f2C.ol,g:'#6fb04a',G:'#4a6a33',y:'#ffe066',c:'#7a5232',b:'#3a2818',w:'#e8e4d8',k:'#2a2a2a'});cx.drawImage(s,x-5,y-6);
    if(st===1){const k2=Math.floor(t*8);f2P(cx,x-3+(k2%5),y-9+((k2>>1)&1),'#1a1a1a');f2P(cx,x+3-(k2%4),y-11+((k2>>2)&1),'#1a1a1a');}};
  return {tick(dt){fx(q.v('slow')?dt/4:dt,step);c.fillStyle='#141019';c.fillRect(0,0,W,H);c.drawImage(bg,0,0);
    for(const g of G)if(g.state==='corpse')drawCorpse(c,g,g.x,g.y);
    f2unit(c,me);
    for(const g of G){if(g.state==='alive')f2unit(c,{kind:'gob',pal:'gob',x:g.x,y:g.y});else if(g.state==='dying'&&!g.inst)drawDying(c,g,g.x,g.y,Math.floor(g.t/16.67));}
    sp.draw(c);nums.draw(c);
    // rot stage labels
    const k=+(q.segv('ts')||20);for(const g of G.filter(x=>x.state==='corpse').slice(-1)){const a=g.age,st=a<ROT[0]?0:a<ROT[0]+ROT[1]?1:2,left=Math.ceil((st===0?ROT[0]:st===1?ROT[0]+ROT[1]:ROT[0]+ROT[1]+ROT[2])-a);f2t(c,['FRESH','ROTTING','BONES'][st]+' '+left+' S',g.x,g.y+3,'#c8c0d8',{al:'center',ol:f2C.ink});}
    // frame strip: the nine frames of the death at 60 fps
    const sy=AH+2;f2R(c,0,AH,W,H-AH,'#141019');f2R(c,0,AH,W,1,f2C.line);f2t(c,'THE DEATH, FRAME BY FRAME AT 60 FPS',3,sy+1,f2C.mute);
    for(let f=0;f<=8;f++){const x=3+f*18,y=sy+9;f2R(c,x,y,17,21,f===Math.min(8,Math.floor(stripF/(q.v('slow')?4:1)))&&stripF>=0&&stripF<40?'#3a3046':'#1d1826');
      if(f<8)drawDying(c,null,x+9,y+19,f);else drawCorpse(c,{age:0},x+9,y+18);f2t(c,String(f),x+1,y+1,f===8?f2C.gold:f2C.dim);}
    f2t(c,'133 MS',W-3,sy+1,f2C.gold,{al:'right'});
    setHud(root,'');
    ro.innerHTML=`${idle>3?'Demo killing; press Kill yourself · ':''}${q.v('tibia')?'<b>Tibia style</b>, splash and corpse at once, no animation':'<b>Asterion</b>, 2 white frames, squash to 1.2 x 0.8 with a dither fade, corpse at frame 8 (about 133 ms); killer only gets "+120 XP" rising 16 px over 800 ms'} · rot 120 + 120 + 30 s shown <b>${k}x faster</b>`;}};
});
