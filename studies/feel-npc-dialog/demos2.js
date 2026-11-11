"use strict";
// ======================================================================
// demos2: portraits and acting, quest givers, shops, ambient life, audio,
// accessibility and the MMO systems figures (families D to H).
// Local helpers are prefixed d2 so they never clash with core.js or the
// other demos files. Uses only generic core.js helpers ($, $$, clamp,
// lerp, ctl, setHud, reg, motion, cellOf, mkRng).
// Every canvas is 170 px wide (2x on a 390 px phone, 4x at its max width)
// and draws with 2D canvas blits at integer positions, no smoothing.
// ======================================================================

// ---------- text: the shared core.js FONT -------------------------------
// Thin wrappers so every figure here draws with the one page font. Our y is
// the top of a 10 px cell with one accent row above the caps, so the core
// call gets y + 1.
const d2W=(s,sc=1)=>textW(String(s),FONT)*sc;
function d2T(c,s,x,y,col,o={}){return drawText(c,s,x,y+(o.sc||1),col,FONT,{outline:o.ol,shadow:o.sh,n:o.n,scale:o.sc});}
const d2Tc=(c,s,cx,y,col,o={})=>d2T(c,s,cx-Math.floor(d2W(s,o.sc||1)/2),y,col,o);
const d2wrap=(s,maxW,sc=1)=>wrap(s,Math.floor(maxW/sc),FONT);

// ---------- canvas, sprites and colours ---------------------------------
const d2C={ink:'#1d1b26',ol:'#2a2233',wht:'#f6f1e3',txt:'#f4efe2',mute:'#a9a7bd',box:'#262a46',box2:'#353a5e',edge:'#ece4cc',edge2:'#8e88aa',
  gold:'#f2c14e',gold2:'#c58a2c',cyan:'#7fd6e6',red:'#e05a4f',red2:'#9c3036',pink:'#f08aa0',grey:'#9a98a8',grey2:'#62606f',blue:'#5a8fe0',green:'#7cc56a',
  g0:'#3f7438',g1:'#4f8a43',g2:'#5e9e4f',g3:'#73b35b',p0:'#a88a5c',p1:'#c4a574',p2:'#d8bd8e',w0:'#6b4429',w1:'#8a5a3a',w2:'#a8714a',st0:'#55546a',st1:'#7a798e',st2:'#a3a2b4',
  roof:'#b04a3c',roof2:'#d06a4a',wall:'#e8d7b0',wall2:'#c7b38a',water:'#4f8fc8',night:'#0d1430'};
function d2cv(root,i=0){const cv=$$('canvas',root)[i],c=cv.getContext('2d');c.imageSmoothingEnabled=false;return {cv,c,W:cv.width,H:cv.height};}
const d2SP=new Map();
// rows of letters + map letter -> css colour -> cached canvas (optionally mirrored)
function d2S(rows,map,flip=false){const k=rows.join('|')+JSON.stringify(map)+flip;let s=d2SP.get(k);if(s)return s;s=document.createElement('canvas');s.width=rows[0].length;s.height=rows.length;const c=s.getContext('2d');
  for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y].length;x++){const ch=rows[y][flip?rows[y].length-1-x:x];if(ch==='.'||!map[ch])continue;c.fillStyle=map[ch];c.fillRect(x,y,1,1);}
  d2SP.set(k,s);return s;}
// draw a sprite with its bottom centre at (x, y)
const d2B=(c,s,x,y)=>c.drawImage(s,Math.round(x-(s.width>>1)),Math.round(y-s.height+1));
const d2R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};

// characters: 8x12, four facings, 3 frames (stand, step A, step B)
const d2CH={d:["..oooo..",".ohHhho.","ohhhhhho","ohsssSho","osesseSo",".osssso.","oCccccCo","osccccso",".oCccCo."],
  u:["..oooo..",".ohhhho.","ohhHhhho","ohhhhhho","ohhhhhho",".ohhhho.","oCccccCo","osccccso",".oCccCo."],
  r:["..oooo..",".ohhHho.","ohhhhhho","ohhsssso","ohhsseso",".ohssso.",".occcco.",".occsco.",".oCccCo."]};
const d2LEG=[[".oppppo.",".op..po.",".oo..oo."],[".oppppo.","..op.po.","..oo.oo."],[".oppppo.",".op.po..",".oo.oo.."]];
const d2LEGS=[[".oppppo.",".op..po.",".oo..oo."],[".opppo..","op...po.","oo...oo."],[".oppppo.","..oppo..","..oooo.."]];
const d2PAL=(h,c,p='#3d3a55',s='#f0c09a')=>({o:d2C.ol,h,H:d2lit(h),s,S:d2dim(s),e:d2C.ink,c,C:d2dim(c),p});
function d2hex(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function d2mix(a,b,t){const A=d2hex(a),B=d2hex(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
const d2dim=h=>d2mix(h,'#1d1b30',.32),d2lit=h=>d2mix(h,'#fff6dc',.3);
// draw a walker with feet at (x, y). dir d/u/l/r, fr 0..2
function d2char(c,x,y,dir,fr,pal){const side=dir==='l'||dir==='r',rows=(side?d2CH.r:d2CH[dir]).concat((side?d2LEGS:d2LEG)[fr%3]);d2B(c,d2S(rows,pal,dir==='l'),x,y);}
const d2NPCS=[d2PAL('#7a4a2e','#c0503c'),d2PAL('#e2c06a','#4a7fc0'),d2PAL('#3a2f45','#5aa060'),d2PAL('#c46a3a','#8a5ab0'),d2PAL('#d8d0c0','#7a6a50','#4a4440'),d2PAL('#2d2433','#d08a3a'),d2PAL('#9a5a3a','#3a9aa0'),d2PAL('#5a3a2a','#c0a040')];

// grass with tufts and a few flowers, cached per size and seed
const d2BG=new Map();
function d2grass(W,H,seed=1,o={}){const k=W+'x'+H+'s'+seed+JSON.stringify(o);let g=d2BG.get(k);if(g)return g;g=document.createElement('canvas');g.width=W;g.height=H;const c=g.getContext('2d'),r=mkRng(seed);
  d2R(c,0,0,W,H,o.base||d2C.g2);
  for(let i=0;i<W*H/14;i++){const x=(r()*W)|0,y=(r()*H)|0;c.fillStyle=r()<.5?d2C.g1:d2C.g3;c.fillRect(x,y,1,1);}
  for(let i=0;i<W*H/90;i++){const x=(r()*W)|0,y=(r()*H)|0;c.fillStyle=d2C.g1;c.fillRect(x,y,1,1);c.fillRect(x+2,y,1,1);c.fillRect(x+1,y+1,1,1);c.fillStyle=d2C.g3;c.fillRect(x+1,y-1,1,1);}
  if(!o.noFlowers)for(let i=0;i<W*H/700;i++){const x=(r()*W)|0,y=(r()*H)|0;c.fillStyle=r()<.5?'#f6e27a':'#f4f0ff';c.fillRect(x,y,1,1);c.fillStyle=d2C.g0;c.fillRect(x,y+1,1,1);}
  if(o.path){const P=o.path;for(const [x0,y0,w,h] of P){d2R(c,x0,y0,w,h,d2C.p1);for(let i=0;i<w*h/10;i++){c.fillStyle=r()<.5?d2C.p0:d2C.p2;c.fillRect(x0+((r()*w)|0),y0+((r()*h)|0),1,1);}
    c.fillStyle=d2C.g1;for(let xx=x0;xx<x0+w;xx++){if(r()<.5)c.fillRect(xx,y0-1,1,1);if(r()<.5)c.fillRect(xx,y0+h,1,1);}for(let yy=y0;yy<y0+h;yy++){if(r()<.5)c.fillRect(x0-1,yy,1,1);if(r()<.5)c.fillRect(x0+w,yy,1,1);}}}
  d2BG.set(k,g);return g;}
// wooden floor (shops, taverns)
function d2floor(W,H,seed=2){const k='fl'+W+'x'+H+seed;let g=d2BG.get(k);if(g)return g;g=document.createElement('canvas');g.width=W;g.height=H;const c=g.getContext('2d'),r=mkRng(seed);
  for(let y=0;y<H;y+=6){d2R(c,0,y,W,6,y%12?d2C.w1:'#93603e');d2R(c,0,y+5,W,1,d2C.w0);let x=-((r()*20)|0);while(x<W){x+=14+((r()*16)|0);d2R(c,x,y,1,5,d2C.w0);}
    for(let i=0;i<W/6;i++){c.fillStyle=d2C.w2;c.fillRect((r()*W)|0,y+1+((r()*3)|0),2,1);}}
  d2BG.set(k,g);return g;}

// dialog box: dark outline, cream rim, slate inner rim, navy fill, corners cut
function d2box(c,x,y,w,h,fill=d2C.box){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);
  d2R(c,x+1,y,w-2,h,d2C.ink);d2R(c,x,y+1,w,h-2,d2C.ink);
  d2R(c,x+2,y+1,w-4,h-2,d2C.edge);d2R(c,x+1,y+2,w-2,h-4,d2C.edge);
  d2R(c,x+2,y+2,w-4,h-4,d2C.edge2);d2R(c,x+3,y+3,w-6,h-6,fill);d2R(c,x+3,y+3,w-6,1,d2mix(fill,'#ffffff',.08));}
// speech bubble with a tail at tx pointing down (or up when up=true)
function d2bub(c,x,y,w,h,tx,up=false,fill=d2C.wht,ol=d2C.ink){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);tx=Math.round(tx);
  d2R(c,x+1,y,w-2,h,ol);d2R(c,x,y+1,w,h-2,ol);d2R(c,x+1,y+1,w-2,h-2,fill);
  tx=clamp(tx,x+3,x+w-4);
  if(!up){d2R(c,tx-2,y+h-1,5,1,fill);d2R(c,tx-3,y+h-1,1,1,ol);d2R(c,tx+3,y+h-1,1,1,ol);d2R(c,tx-1,y+h,3,1,fill);d2R(c,tx-2,y+h,1,1,ol);d2R(c,tx+2,y+h,1,1,ol);d2R(c,tx,y+h+1,1,1,fill);d2R(c,tx-1,y+h+1,1,1,ol);d2R(c,tx+1,y+h+1,1,1,ol);d2R(c,tx,y+h+2,1,1,ol);}
  else{d2R(c,tx-2,y,5,1,fill);d2R(c,tx-3,y,1,1,ol);d2R(c,tx+3,y,1,1,ol);d2R(c,tx-1,y-1,3,1,fill);d2R(c,tx-2,y-1,1,1,ol);d2R(c,tx+2,y-1,1,1,ol);d2R(c,tx,y-2,1,1,fill);d2R(c,tx-1,y-2,1,1,ol);d2R(c,tx+1,y-2,1,1,ol);d2R(c,tx,y-3,1,1,ol);}}
// a bubble sized to its text, tail over (sx, sy). Returns the box.
function d2say(c,txt,sx,sy,W,col=d2C.ink,maxW=90){const lines=d2wrap(txt,maxW),w=Math.max(...lines.map(l=>d2W(l)))+6,h=lines.length*9+4;
  const x=clamp(Math.round(sx-w/2),1,W-w-1),y=Math.round(sy-h-3);d2bub(c,x,y,w,h,sx);lines.forEach((l,i)=>d2T(c,l,x+3,y+1+i*9,col));return {x,y,w,h};}

// markers: ! and ?, outline 'o' + fill 'y' + highlight 'Y'
const d2EXC=[".ooo.","oyYyo","oyyyo","oyyyo",".oyo.",".oyo.","..o..",".ooo.",".oyo.",".ooo."];
const d2QM=[".ooooo.","oyyYyyo","oyoooyo","ooo.oyo","..ooyyo","..oyyo.","..oyo..","..ooo..","..oyo..","..ooo.."];
const d2MK={gold:{o:d2C.ink,y:d2C.gold,Y:'#fff0a8'},grey:{o:d2C.ink,y:d2C.grey,Y:'#c8c6d4'},hollow:{o:'#b8b6c8'},blue:{o:d2C.ink,y:'#4aa8f0',Y:'#bfe6ff'},red:{o:d2C.ink,y:d2C.red,Y:'#ffb0a0'}};
// emote balloons 11x11, icon pixels 'x'
const d2BAL=["..ooooooo..",".owwwwwwwo.","owwwwwwwwwo","owwwwwwwwwo","owwwwwwwwwo","owwwwwwwwwo","owwwwwwwwwo",".owwwwwwwo.","..ooowooo..","....owo....",".....o....."];
const d2ICO={'!':["....x....","....x....","....x....",".........","....x...."],'?':["...xxx...","..x...x..",".....x...",".........","....x...."],
  heart:["..xx.xx..",".xxxxxxx.","..xxxxx..","...xxx...","....x...."],anger:["..x...x..","...x.x...",".........","...x.x...","..x...x.."],
  '...':[".........",".........",".x..x..x.",".........","........."],note:[".....xx..",".....x.x.",".....x...","...xxx...","...xx...."]};
const d2ICOL={'!':d2C.red,'?':'#3a6ad0',heart:'#e0405a',anger:'#d03030','...':d2C.ink,note:'#3a6ad0'};
function d2balloon(kind){const rows=d2BAL.map(r=>r.split(''));const ic=d2ICO[kind];for(let j=0;j<5;j++)for(let i=0;i<9;i++)if(ic[j][i]==='x')rows[2+j][1+i]='x';
  return d2S(rows.map(r=>r.join('')),{o:d2C.ink,w:d2C.wht,x:d2ICOL[kind]});}

// fixed 60 Hz stepper: acc += dt; calls step() per 1/60 s (max 8 per tick)
function d2fixed(){let acc=0;return (dt,step)=>{acc+=dt;let n=0;while(acc>=1/60&&n<8){acc-=1/60;step();n++;}if(n>=8)acc=0;};}
// ms meter (smoothed)
function d2meter(){let s=-1,t=0;return {a(){t=performance.now();},b(){const d=performance.now()-t;s=s<0?d:s*.92+d*.08;return s;},get v(){return Math.max(0,s);}};}
const d2ms=v=>v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);

// ---------- audio: created only inside a click handler -------------------
const d2AU={ctx:null,ok(){if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;try{this.ctx=new A();}catch(e){return false;}}if(this.ctx.state==='suspended')this.ctx.resume();return true;},
  blip(freq,dur=.045,vol=.06,type='square'){const a=this.ctx;if(!a||a.state!=='running')return;const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.0005,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02);}};

// typewriter: ms per glyph, comma = 5 glyph-times, sentence end = 10 (§7 rule)
function d2typer(){return {s:'',n:0,acc:0,wait:0,done:true,ms:50,pause:true,
  set(s){this.s=s;this.n=0;this.acc=0;this.wait=0;this.done=!s.length;},
  finish(){this.n=this.s.length;this.done=true;this.wait=0;},
  step(dtms){if(this.done)return 0;if(this.ms<=0){const k=this.s.length-this.n;this.finish();return k;}
    this.acc+=dtms;let k=0;while(!this.done){const need=this.ms+this.wait;if(this.acc<need)break;this.acc-=need;this.wait=0;this.n++;k++;
      const ch=this.s[this.n-1],nx=this.s[this.n];if(this.pause){if(ch===','&&nx===' ')this.wait=this.ms*5;else if('.!?'.includes(ch)&&(nx===' '||nx===undefined)&&!(ch==='.'&&nx==='.'))this.wait=this.ms*10;}
      if(this.n>=this.s.length){this.done=true;this.wait=0;}}return k;},
  get paused(){return this.wait>0;}};}
// draw wrapped lines revealing the first n glyphs of lines.join(' ')
function d2typed(c,lines,x,y,n,col,lh=10,o={}){let left=n,base=0;lines.forEach((l,i)=>{if(left<=0)return;d2T(c,l,x,y+i*lh,col,Object.assign({},o,{n:left,base}));left-=l.length+1;base+=l.length+1;});}

// ======================================================================
// D1/D2: busts at 32, 48 and 64 px, expressions, mouth flaps and blinks
// ======================================================================
const d2BUSTC=new Map();
function d2bust(S,ex,mo,ey,pal){const key=[S,ex,mo,ey,pal.id].join();let cv=d2BUSTC.get(key);if(cv)return cv;
  cv=document.createElement('canvas');cv.width=S;cv.height=S;const c=cv.getContext('2d'),L=new Uint8Array(S*S),C=new Array(S*S).fill(null);
  const set=(x,y,col,l=1)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=S||y>=S)return;C[y*S+x]=col;L[y*S+x]=l;};
  const cx=(S-1)/2,hy=S*.42,rx=S*.27,ry=S*.3,inE=(x,y,ex_,ey_,a,b)=>((x-ex_)/a)**2+((y-ey_)/b)**2<=1;
  // body and neck
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(y>S*.74&&inE(x,y,cx,S*1.08,S*.44,S*.36))set(x,y,x>cx+S*.2?pal.c2:pal.c,1);}
  for(let y=Math.round(hy+ry*.6);y<S*.84;y++)for(let x=Math.round(cx-S*.08);x<=Math.round(cx+S*.08);x++)set(x,y,y<hy+ry*1.05?pal.s2:pal.s,2);
  // collar
  for(let x=Math.round(cx-S*.1);x<=Math.round(cx+S*.1);x++)set(x,Math.round(S*.84),pal.c2,1);
  // head
  for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(inE(x+.5-.5,y,cx,hy,rx,ry))set(x,y,x>cx+rx*.5?pal.s2:pal.s,2);
  // hair: cap with a zigzag fringe and side locks
  const fr=x=>hy-ry*.28+S*.05*Math.abs(Math.sin((x-cx)/S*13.5));
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const inH=inE(x,y,cx,hy-S*.03,rx+S*.045,ry+S*.05),inHead=inE(x,y,cx,hy,rx,ry);
    if(!inH)continue;if((inHead&&y<fr(x))||(!inHead&&y<hy+ry*.35)){const hl=inE(x,y,cx-rx*.35,hy-ry*.75,rx*.42,ry*.16);set(x,y,hl?pal.h2:(x>cx+rx*.55?pal.h3:pal.h),3);}}
  // outline around the silhouette
  const O=[];for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(L[y*S+x])continue;const n=(x>0&&L[y*S+x-1])||(x<S-1&&L[y*S+x+1])||(y>0&&L[(y-1)*S+x])||(y<S-1&&L[(y+1)*S+x]);if(n)O.push([x,y]);}
  // hair edge over skin gets the dark hair tone
  for(let y=1;y<S;y++)for(let x=0;x<S;x++)if(L[y*S+x]===2&&L[(y-1)*S+x]===3)C[(y-1)*S+x]=pal.h3;
  // face
  const ew=Math.max(2,Math.round(S/16)),eh=Math.max(3,Math.round(S/11)),eyY=Math.round(hy+ry*.14),exs=[Math.round(cx-rx*.44-ew/2+.5),Math.round(cx+rx*.44-ew/2+.5)],k=d2C.ink;
  const R=(x,y,w,h,col)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)set(x+i,y+j,col,2);};
  exs.forEach((x0,side)=>{const inner=side===0?1:-1;
    if(ex==='happy'&&ey===0){R(x0,eyY+1,ew,1,k);set(x0-1,eyY+2,k,2);set(x0+ew,eyY+2,k,2);}
    else if(ey===2){R(x0-(S>=48?1:0),eyY+eh-2,ew+(S>=48?2:0),1,k);R(x0,eyY+eh-3,ew,1,pal.s2);}
    else{const h=ey===1?Math.max(1,eh>>1):eh,y0=eyY+eh-h;if(ex==='surprised'){R(x0-1,y0-1,ew+2,h+2,'#ffffff');}
      R(x0,y0,ew,h,k);if(h>=3){set(x0,y0,'#ffffff',2);if(S>=64)set(x0+1,y0,'#ffffff',2);}}
    // brows
    const by=eyY-Math.max(2,Math.round(S/12))-(ex==='surprised'?2:ex==='happy'?1:0),bw=ew+2,bx=x0-1,bt=S>=64?2:1;
    for(let i=0;i<bw;i++){const t=side===0?i/(bw-1):1-i/(bw-1);let dy=0;if(ex==='sad')dy=Math.round((1-t)*(S>=48?2:1))-(S>=48?2:1);if(ex==='angry')dy=Math.round(t*(S>=48?2:1));
      for(let b=0;b<bt;b++)set(bx+i,by+dy+b,pal.h3,2);}
    if(ex==='happy'&&S>=48){set(x0-1,eyY+eh+1,'#f08a90',2);set(x0+ew,eyY+eh+1,'#f08a90',2);}
    if(ex==='sad'&&side===1&&S>=48)set(x0+ew-1,eyY+eh+1,'#7fc0f0',2);});
  if(S>=48){set(Math.round(cx),eyY+eh+Math.round(S/24),pal.s2,2);if(S>=64)set(Math.round(cx)+1,eyY+eh+Math.round(S/24),pal.s2,2);}
  const my=Math.round(hy+ry*.62),mw=Math.max(3,Math.round(S/9)),mx=Math.round(cx-mw/2+.5);
  if(mo){const mh=Math.max(2,Math.round(S/16))+(ex==='surprised'?1:0);R(mx,my-1,mw,mh,'#5a2030');if(S>=48)R(mx+1,my-1+mh-1,mw-2,1,'#d0606a');if(S>=64)R(mx+1,my-1,mw-2,1,'#f4f0ea');}
  else if(ex==='surprised'){R(mx+1,my-1,Math.max(2,mw-2),2,'#5a2030');}
  else{const curve=ex==='happy'?-1:ex==='sad'?1:0;R(mx,my,mw,1,'#7a3038');if(curve){set(mx-1,my+curve,'#7a3038',2);set(mx+mw,my+curve,'#7a3038',2);}if(ex==='angry')R(mx,my,mw,1,'#5a2030');}
  for(const [x,y] of O)C[y*S+x]=d2C.ink;
  for(let i=0;i<S*S;i++)if(C[i]){c.fillStyle=C[i];c.fillRect(i%S,(i/S)|0,1,1);}
  d2BUSTC.set(key,cv);return cv;}
const d2BPAL={id:'riona',s:'#f2c49c',s2:'#d89a78',h:'#b8503a',h2:'#e07a52',h3:'#7a2c2a',c:'#4a7a5a',c2:'#33584a'};
const d2LINES={neutral:'The mill is north of the bridge, past the old oak.',happy:'You found my cat? Thank you, truly!',sad:'The harvest failed again. We will manage.',
  angry:'Who trampled my garden? I saw boots!',surprised:'A dragon? Here, in Kingsfoil? Really?'};
reg('portrait',root=>{const {c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root),ty=d2typer();let ex='neutral',mouthT=0,mo=0,blinkT=2.5,blinkF=-1,lines=[],t=0;
  const say=()=>{lines=d2wrap(d2LINES[ex],W-14);ty.set(lines.join(' '));mouthT=0;mo=0;};
  q.seg('ex',v=>{ex=v;say();});q.btn('say',say);say();
  const SZ=[32,48,64],X=[5,43,97],BOT=72;
  return {tick(dt){t+=dt;const flap=q.v('flap'),blink=q.v('blink');ty.ms=50;const k=ty.step(dt*1000);
    // mouth: 2 frames at 120 ms, closed during pauses and when the line is done
    if(!ty.done&&!ty.paused&&flap){mouthT+=dt;if(mouthT>=.12){mouthT=0;mo^=1;}if(k&&mo===0&&mouthT===0)mo=1;}else{mo=0;mouthT=0;}
    // blink: open -> half (2 f) -> closed (2 f) -> half (1 f) every 2 to 6 s
    let ey=0;if(blink){if(blinkF<0){blinkT-=dt;if(blinkT<=0){blinkF=0;}}else{blinkF+=dt*60;if(blinkF>=5){blinkF=-1;blinkT=2+Math.random()*4;}}if(blinkF>=0)ey=blinkF<2?1:blinkF<4?2:1;}
    c.drawImage(d2floor(W,H,4),0,0);d2R(c,0,0,W,BOT+12,'#2e2a40');for(let x=0;x<W;x+=8)d2R(c,x,BOT+11,4,1,'#3b3652');
    SZ.forEach((S,i)=>{const x=X[i],y=BOT-S;d2R(c,x-2,y-2,S+4,S+4,d2C.ink);d2R(c,x-1,y-1,S+2,S+2,d2C.edge);d2R(c,x,y,S,S,'#6a86b0');d2R(c,x,y+(S>>1),S,S-(S>>1),'#5a76a0');
      c.drawImage(d2bust(S,ex,mo,ey,d2BPAL),x,y);d2Tc(c,S+' px',x+S/2,BOT+2,d2C.mute);});
    d2box(c,2,BOT+13,W-4,H-BOT-15);d2typed(c,lines,8,BOT+17,ty.n,d2C.txt,10);
    if(ty.done&&Math.floor(t*60/9)%4!==3){const off=[0,1,2,1][Math.floor(t*60/9)%4];d2R(c,W-12,H-8+off,5,1,d2C.gold);d2R(c,W-11,H-7+off,3,1,d2C.gold);d2R(c,W-10,H-6+off,1,1,d2C.gold);}
    setHud(root,`mouth ${mo?'open':'closed'} · eyes ${['open','half','closed (2 px)'][ey]}`);
    ro.innerHTML=`Frames per NPC <b>1 base + 4 expressions + 2 mouth + blink ≈ 7</b> small overlays [I] · one 64x64 RGBA frame is <b>16 KB</b>`;}};
});

// ======================================================================
// D3: emote balloons on Emerald's integer hop
// ======================================================================
reg('emotes',root=>{const {cv,c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root),fx=d2fixed();
  const SH=88,bg=d2grass(W,SH,7,{path:[[0,58,W,9]]});let kind='!',slow=false;
  const N=[{x:24,y:54,d:'d',p:d2NPCS[0]},{x:62,y:76,d:'r',p:d2NPCS[1]},{x:108,y:52,d:'l',p:d2NPCS[2]},{x:146,y:80,d:'d',p:d2NPCS[3]}].map(n=>Object.assign(n,{e:null,f:0,y0:0,vy:0,hist:[]}));
  const KINDS=['!','?','heart','anger','...'];let last=null,acc=0,turnT=0;
  const play=n=>{n.e=kind==='rand'?KINDS[(Math.random()*5)|0]:kind;n.f=0;n.y0=0;n.vy=-5;n.hist=[];n.d='d';last=n;};
  q.seg('k',v=>{kind=v;});q.btn('all',()=>N.forEach(play));
  cv.addEventListener('pointerdown',e=>{const [x,y]=cellOf(cv,e);let best=null,bd=1e9;for(const n of N){const d=Math.hypot(x-n.x,y-(n.y-7));if(d<bd){bd=d;best=n;}}if(best&&bd<22)play(best);});
  play(N[2]);
  const step=()=>{for(const n of N){if(!n.e)continue;n.f++;if(n.vy!==null){n.y0+=n.vy;n.vy++;if(n.y0>=0){n.y0=0;n.vy=null;}}n.hist.push(n.y0);if(n.f>=60){n.e=null;}}};
  return {tick(dt){slow=q.v('slow');fx(slow?dt/4:dt,step);turnT+=dt;if(turnT>2.2){turnT=0;const n=N[(Math.random()*4)|0];if(!n.e)n.d='dlru'[(Math.random()*4)|0];}
    c.drawImage(bg,0,0);for(const [x,y] of [[8,30],[90,26],[160,40],[128,96],[44,98]])d2B(c,d2S(d2BUSH,d2BUSHM),x,y);for(let x=60;x<100;x+=4){d2R(c,x,36,1,6,d2C.w0);d2R(c,x+1,37,1,5,d2C.w2);}d2R(c,60,38,40,1,d2C.w1);d2R(c,60,40,40,1,d2C.w0);
    for(const n of [...N].sort((a,b)=>a.y-b.y)){d2R(c,n.x-3,n.y,7,1,d2C.g0);d2char(c,n.x,n.y,n.d,0,n.p);if(n.e){const s=d2balloon(n.e);d2B(c,s,n.x,n.y-14+n.y0);}}
    // hop strip: one column per frame of the 60-frame life
    d2R(c,0,SH,W,H-SH,'#1a1a28');const gx=8,gy=H-4;d2R(c,gx,gy,120,1,'#3a3a52');
    if(last){for(let i=0;i<60;i++){const v=i<last.hist.length?-last.hist[i]:0,cur=i===last.hist.length-1;if(i<last.hist.length){d2R(c,gx+i*2,gy-v,2,1,cur?d2C.gold:'#9fd0ff');if(v>0)d2R(c,gx+i*2,gy-v+1,2,v-1,cur?'#8a6a2a':'#33507a');}}}
    d2T(c,'peak 15',gx+124,gy-17,d2C.mute);d2T(c,'60 f',gx+124,gy-8,d2C.mute);d2R(c,gx+120,gy-15,2,1,'#6a6a82');
    const f=last&&last.e?last.f:60;setHud(root,last&&last.e?`frame ${f} / 60 · y ${last.y0} px`:'click a villager');
    ro.innerHTML=`Hop <b>vy = −5, +1 per frame</b> · offsets −5, −9, −12, −14, −15, −15, −14, −12, −9, −5, 0 · then hold to frame 60 · one event byte per emote [I]`;}};
});

// ======================================================================
// D4: turn to face the talker, restore after, direction fix, TFS vs Canary
// ======================================================================
reg('turnface',root=>{const {cv,c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const bg=d2grass(W,H,9,{path:[[0,46,W,10],[80,0,10,H]],noFlowers:1});const npc={x:85,y:56,d:'l',saved:null,idle:0,wt:1.5,hx:85,hy:56,fr:0,mv:0},R=40;
  const P=[{n:'Ana',x:52,y:64,p:d2NPCS[1],talk:false,t0:0,say:0,d:'r'},{n:'Bo',x:118,y:44,p:d2NPCS[5],talk:false,t0:0,say:0,d:'l'}];
  let rule='first',focus=[],npcSay='',npcSayT=0,clock=0,drag=null;
  const dirTo=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y;return Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u');};
  const greet=p=>{if(p.talk)return;if(Math.hypot(p.x-npc.x,p.y-npc.y)>R){p.say=1.2;p.msg='hi';p.far=1.5;return;}p.talk=true;p.t0=clock;p.say=1.2;p.msg='hi';focus.push(p);if(focus.length===1&&npc.saved===null)npc.saved=npc.d;npcSay=focus.length>1&&rule==='first'?`Wait, ${p.n}.`:`Hello, ${p.n}.`;npcSayT=1.6;};
  const bye=p=>{if(!p.talk)return;p.talk=false;p.say=1;p.msg='bye';focus=focus.filter(f=>f!==p);npcSay='Goodbye.';npcSayT=1.2;npc.idle=0;};
  q.btn('h1',()=>greet(P[0]));q.btn('h2',()=>greet(P[1]));q.btn('b1',()=>bye(P[0]));q.btn('b2',()=>bye(P[1]));q.seg('rule',v=>{rule=v;});
  cv.addEventListener('pointerdown',e=>{const [x,y]=cellOf(cv,e);for(const p of P)if(Math.hypot(x-p.x,y-p.y+6)<10){drag=p;try{cv.setPointerCapture(e.pointerId);}catch(_){}}});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const [x,y]=cellOf(cv,e);drag.x=clamp(x,6,W-6);drag.y=clamp(y+5,14,H-2);drag.mv=.2;});
  const up=()=>{drag=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  return {tick(dt){clock+=dt;const fix=q.v('fix');
    for(const p of P){if(p.talk&&Math.hypot(p.x-npc.x,p.y-npc.y)>R)bye(p);if(p.say>0)p.say-=dt;if(p.mv>0){p.mv-=dt;p.fr=(p.fr||0)+dt*8;}else p.fr=0;p.d=dirTo(p,npc);}
    if(npcSayT>0)npcSayT-=dt;
    const target=focus.length?(rule==='first'?focus[0]:focus[focus.length-1]):null;let state;
    if(target){if(!fix)npc.d=dirTo(npc,target);npc.mv=0;state=`facing ${target.n}`;}
    else if(npc.saved!==null){npc.idle+=dt;state=`idle ${npc.idle.toFixed(1)} s`;if(npc.idle>=2.5){npc.d=npc.saved;npc.saved=null;npc.idle=0;}}
    else{npc.wt-=dt;state='wandering';if(npc.wt<=0){npc.wt=1.2+Math.random()*1.6;if(!fix&&Math.random()<.5)npc.d='dlru'[(Math.random()*4)|0];else{npc.tx=clamp(npc.hx+(Math.random()-.5)*16,70,100);npc.ty=clamp(npc.hy+(Math.random()-.5)*8,50,62);npc.mv=1;}}
      if(npc.mv&&npc.tx!==undefined){const dx=npc.tx-npc.x,dy=npc.ty-npc.y,d=Math.hypot(dx,dy);if(d<.6)npc.mv=0;else{npc.x+=dx/d*dt*10;npc.y+=dy/d*dt*10;if(!fix)npc.d=Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u');npc.fr+=dt*7;}}}
    c.drawImage(bg,0,0);
    // talk radius
    {let px=-1,py=-1,k=0;for(let a=0;a<200;a++){const x=Math.round(npc.x+Math.cos(a/200*6.283)*R),y=Math.round(npc.y-3+Math.sin(a/200*6.283)*R*.6);if(x===px&&y===py)continue;px=x;py=y;if((k++>>1)%3!==2)d2R(c,x,y,1,1,focus.length?d2C.gold:'#c8f0a0');}}
    const all=[...P,npc].sort((a,b)=>a.y-b.y);
    for(const o of all){d2R(c,o.x-3,o.y,7,1,d2C.g0);if(o===npc)d2char(c,o.x,o.y,o.d,npc.mv?Math.floor(npc.fr)%3:0,d2NPCS[4]);else{d2char(c,o.x,o.y,o.d,o.mv>0?Math.floor(o.fr)%3:0,o.p);d2Tc(c,o.n,o.x,o.y+2,o.talk?d2C.gold:d2C.wht,{ol:d2C.ink});}}
    for(const p of P)if(p.say>0)d2say(c,p.msg,p.x,p.y-13,W);
    if(npcSayT>0)d2say(c,npcSay,npc.x,npc.y-13,W);
    if(fix)d2Tc(c,'direction fix',npc.x,npc.y+2,d2C.cyan,{ol:d2C.ink});
    const far=P.find(p=>p.far>0);for(const p of P)if(p.far>0)p.far-=dt;setHud(root,far?`${far.n} is too far: walk closer`:state);
    ro.innerHTML=`Focus list <b>${focus.length?focus.map(f=>f.n).join(', '):'empty'}</b> · saved facing <b>${npc.saved===null?'none':{d:'down',u:'up',l:'left',r:'right'}[npc.saved]}</b> · rule <b>${rule==='first'?'first talker (TFS)':'latest talker (Canary)'}</b>`;}};
});

// ======================================================================
// E1: marker states, shape vs colour, colour-blind simulation
// ======================================================================
const d2CVD={deu:[.367322,.860646,-.227968,.280085,.672501,.047413,-.01182,.04294,.968881],pro:[.152286,1.052583,-.204868,.114503,.786281,.099216,-.003882,-.048116,1.051998],gry:[.299,.587,.114,.299,.587,.114,.299,.587,.114]};
function d2sim(c,W,H,mode){if(mode==='none')return;const M=d2CVD[mode],im=c.getImageData(0,0,W,H),d=im.data;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];d[i]=M[0]*r+M[1]*g+M[2]*b;d[i+1]=M[3]*r+M[4]*g+M[5]*b;d[i+2]=M[6]*r+M[7]*g+M[8]*b;}c.putImageData(im,0,0);}
const d2simC=(hex,mode)=>{const v=d2hex(hex);if(mode==='none')return v;const M=d2CVD[mode];return [0,1,2].map(k=>clamp(M[k*3]*v[0]+M[k*3+1]*v[1]+M[k*3+2]*v[2],0,255));};
reg('markers',root=>{const {c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root);const bg=d2grass(W,H,12,{path:[[0,50,W,9]]});let design='shape',vis='none',t=0;
  const ST=[{lab:'New',sh:'exc',k:'gold',co:'#f2c14e'},{lab:'Later',sh:'exc',k:'grey',co:'#9a98a8'},{lab:'Doing',sh:'qm',k:'hollow',co:'#a8c070'},{lab:'Done',sh:'qm',k:'gold',co:'#e07a3a'},{lab:'Daily',sh:'exc',k:'blue',co:'#4aa8f0'}];
  q.seg('d',v=>{design=v;});q.seg('v',v=>{vis=v;});
  return {tick(dt){t+=dt;const bob=q.v('bob');c.drawImage(bg,0,0);
    ST.forEach((s,i)=>{const x=17+i*34,y=56;d2R(c,x-3,y,7,1,d2C.g0);d2char(c,x,y,'d',0,d2NPCS[i]);
      const b=bob?[0,1,2,1][(Math.floor(t*60/10)+i*2)%4]:0;let spr;
      if(design==='shape')spr=d2S(s.sh==='exc'?d2EXC:d2QM,d2MK[s.k]);else spr=d2S(d2EXC,{o:d2C.ink,y:s.co,Y:d2lit(s.co)});
      d2B(c,spr,x,y-15-b);d2Tc(c,s.lab,x,y+5,d2C.wht,{ol:d2C.ink});});
    d2sim(c,W,H,vis);
    // which markers can a viewer tell apart? same shape and close colours count as one
    const keys=ST.map(s=>design==='shape'?{sh:s.sh+(s.k==='hollow'?'h':''),col:d2simC(s.k==='gold'?d2C.gold:s.k==='grey'?d2C.grey:s.k==='blue'?'#4aa8f0':'#b8b6c8',vis)}:{sh:'exc',col:d2simC(s.co,vis)});
    const grp=[];keys.forEach(k=>{if(!grp.some(g=>g.sh===k.sh&&Math.hypot(g.col[0]-k.col[0],g.col[1]-k.col[1],g.col[2]-k.col[2])<48))grp.push(k);});
    setHud(root,`${grp.length} of 5 states tell apart`);
    ro.innerHTML=`View <b>${{none:'full colour',deu:'deuteranopia (simulated)',pro:'protanopia (simulated)',gry:'greyscale'}[vis]}</b> · design <b>${design==='shape'?'shape for kind, second cue for state':'one shape, colour only'}</b> · distinct states <b>${grp.length} / 5</b>`;}};
});

// canvas buttons: draw and remember hit rects; hits(x, y) -> id
function d2ui(){const R=[];return {clear(){R.length=0;},
  btn(c,id,x,y,w,h,label,o={}){R.push({id,x,y,w,h});const hot=o.hot;d2R(c,x+1,y,w-2,h,d2C.ink);d2R(c,x,y+1,w,h-2,d2C.ink);d2R(c,x+1,y+1,w-2,h-2,hot?d2C.gold:o.dim?'#4a4a62':'#e9e2cc');d2R(c,x+1,y+h-2,w-2,1,hot?d2C.gold2:o.dim?'#38384c':'#b8ae94');
    d2Tc(c,label,x+w/2,y+Math.round((h-10)/2)-(o.dy||0),o.dim?'#8a8aa0':d2C.ink);},
  area(id,x,y,w,h){R.push({id,x,y,w,h});},
  hit(x,y){for(let i=R.length-1;i>=0;i--){const r=R[i];if(x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h)return r.id;}return null;}};}
// small props
const d2HERB=["..p.p..",".pPpPp.","..lpl..","l.lll.l",".lLlLl.","..lll.."],d2HERBM={p:'#b07ad8',P:'#e0b0ff',l:'#3f8a3c',L:'#6ab84f'};
const d2BUSH=["..oooo...",".oGgggo..","oGgggGgo.","oggGgggGo","ogggggggo",".ooooooo."],d2BUSHM={o:'#244a2a',g:'#3f7a3c',G:'#5fa04f'};
const d2SPARK=(c,x,y,t,col=d2C.gold)=>{const r=Math.round(2+t*6);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])d2R(c,x+dx*r,y+dy*r,1,1,col);if(t<.5)d2R(c,x,y,1,1,'#ffffff');};

// ======================================================================
// E2: offer -> accept -> progress -> turn-in, tracker and reward popup
// ======================================================================
reg('questflow',root=>{const {cv,c,W,H}=d2cv(root),ro=$('[data-ro]',root),svg=$('svg',root),ui=d2ui();
  const bg=d2grass(W,H,15,{path:[[0,84,W,8]]});const npc={x:30,y:80},pl={x:46,y:82};
  const HB=[{x:88,y:44},{x:122,y:66},{x:150,y:40},{x:104,y:96},{x:140,y:100}];let st='avail',got=0,herbs=[],pop=[],t=0,flash=0,say='',sayT=0;
  const NODES=['Offer','Accept','Progress','Turn in','Done'],idx={avail:0,offer:0,active:2,ready:3,done:4};
  const nodes=NODES.map((n,i)=>{const g=svgEl('g',{class:'node'},svg);svgEl('rect',{x:4+i*68,y:6,width:60,height:26,rx:4},g);svgText(g,34+i*68,23,n,{'text-anchor':'middle',style:'font-size:11px'});return g;});
  for(let i=0;i<4;i++)svgEl('line',{class:'edge',x1:64+i*68,y1:19,x2:72+i*68,y2:19},svg);
  const reset=()=>{st='avail';got=0;herbs=HB.map(h=>({...h,on:true,t:0}));pop=[];say='';};reset();
  $('[data-b="reset"]',root).addEventListener('click',reset);
  cv.addEventListener('pointerdown',e=>{const [x,y]=cellOf(cv,e),id=ui.hit(x,y);
    if(id==='acc'){st='active';say='Three moonleaf, by the stream.';sayT=2;}
    else if(id==='dec'){st='avail';say='Another time, then.';sayT=1.6;}
    else if(id==='npc'){if(st==='avail')st='offer';else if(st==='ready'){st='done';pop=[{s:'+90 XP',t:0,col:d2C.cyan},{s:'+12 coins',t:-.25,col:d2C.gold}];say='Thank you! Here.';sayT=2;}else if(st==='active'){say=`${3-got} more, please.`;sayT=1.4;}}
    else if(typeof id==='number'&&st==='active'){const h=herbs[id];if(h.on&&got<3){h.on=false;h.t=0;got++;flash=.6;if(got===3)st='ready';}}});
  return {tick(dt){t+=dt;if(flash>0)flash-=dt;if(sayT>0)sayT-=dt;for(const p of pop)p.t+=dt;for(const h of herbs)if(!h.on)h.t+=dt;
    ui.clear();c.drawImage(bg,0,0);d2B(c,d2S(d2BUSH,d2BUSHM),12,60);d2B(c,d2S(d2BUSH,d2BUSHM),70,104);
    herbs.forEach((h,i)=>{if(h.on){d2B(c,d2S(d2HERB,d2HERBM),h.x,h.y);if(st==='active')ui.area(i,h.x-6,h.y-9,13,12);if(st==='active'&&Math.floor(t*3+i)%3===0)d2R(c,h.x+2,h.y-6,1,1,'#ffffff');}else if(h.t<.5)d2SPARK(c,h.x,h.y-3,h.t*2);});
    d2R(c,npc.x-3,npc.y,7,1,d2C.g0);d2char(c,npc.x,npc.y,'r',0,d2NPCS[6]);d2R(c,pl.x-3,pl.y,7,1,d2C.g0);d2char(c,pl.x,pl.y,'l',0,d2NPCS[1]);ui.area('npc',npc.x-8,npc.y-24,16,26);
    const b=[0,1,2,1][Math.floor(t*6)%4];
    if(st==='avail')d2B(c,d2S(d2EXC,d2MK.gold),npc.x,npc.y-15-b);if(st==='active')d2B(c,d2S(d2QM,d2MK.hollow),npc.x,npc.y-15-b);if(st==='ready')d2B(c,d2S(d2QM,d2MK.gold),npc.x,npc.y-15-b);
    // tracker
    if(st==='active'||st==='ready'){const line=`Moonleaf ${got}/3`,w=Math.max(d2W('Mira\'s herbs'),d2W(line))+8;d2R(c,W-w-2,2,w,23,'rgba(20,18,32,.82)');d2T(c,"Mira's herbs",W-w+2,3,d2C.gold);
      d2T(c,line,W-w+2,13,flash>0&&Math.floor(flash*10)%2?'#ffffff':got===3?d2C.green:d2C.txt);}
    if(sayT>0)d2say(c,say,npc.x+4,npc.y-15,W);
    for(const p of pop)if(p.t>0&&p.t<1.6)d2Tc(c,p.s,96,58-Math.round(Math.min(p.t,.6)*20)+(p.col===d2C.gold?10:0),p.col,{ol:d2C.ink});
    if(st==='offer'){d2box(c,8,8,W-16,70);d2T(c,"Mira's herbs",14,12,d2C.gold);d2T(c,'Bring 3 moonleaf from',14,24,d2C.txt);d2T(c,'the stream bank.',14,33,d2C.txt);
      d2T(c,'Reward: 90 XP, 12 coins',14,44,d2C.cyan);ui.btn(c,'acc',16,58,64,14,'Accept',{hot:1});ui.btn(c,'dec',90,58,64,14,'Decline');}
    const hint={avail:'click Mira',offer:'accept or decline',active:'pick 3 moonleaf',ready:'back to Mira',done:'done, press Reset'}[st];setHud(root,hint);
    const k=idx[st];nodes.forEach((n,i)=>n.classList.toggle('on',st==='avail'||st==='offer'?i===0:i===k||(st!=='done'&&i===1&&st==='active')));
    ro.innerHTML=`State <b>${st}</b> · server storage <b>herbs = ${got}</b> (an integer per player) · update <b>${st==='active'?'1 to 2 bytes per tick of the tracker':'none'}</b> [I]`;}};
});

// ======================================================================
// E3: renown heart fills with any mix of help, then the NPC sells
// ======================================================================
const d2HEART=["..ooo...ooo..",".oxxxo.oxxxo.","oxxxxxoxxxxxo","oxxxxxxxxxxxo","oxxxxxxxxxxxo","oxxxxxxxxxxxo",".oxxxxxxxxxo.","..oxxxxxxxo..","...oxxxxxo...","....oxxxo....",".....oxo.....","......o......"];
const d2BAG=["...ooo...","..oyyyo..","...ooo...","..oyyyo..",".oyyYyyo.","oyyyYyyyo","oyyYYYyyo","oyyyYyyyo",".oyyyyyo.","..ooooo.."];
const d2CROW=["..oo..",".oooo.","ooyoo.",".oooo.","o.oo.o"],d2WEED=[".w.w.","w.w.w",".www.","..w.."];
function d2heartFill(p){const rows=d2HEART.map(r=>r.split('')),fillRows=Math.floor(p*10+1e-6);for(let y=1;y<=10;y++){const on=y>10-fillRows;for(let x=0;x<13;x++)if(rows[y][x]==='x')rows[y][x]=on?(x<4&&y<5?'H':'x'):'e';}
  return d2S(rows.map(r=>r.join('')),{o:d2C.ink,x:'#e8506a',H:'#ffa0b0',e:'#40303e'});}
reg('hearts',root=>{const {cv,c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const bg=d2grass(W,H,21,{noFlowers:1});const field=document.createElement('canvas');field.width=W;field.height=H;{const f=field.getContext('2d');f.drawImage(bg,0,0);
    for(let y=34;y<96;y+=8){d2R(f,50,y,114,6,'#7a5638');d2R(f,50,y,114,1,'#9a7048');for(let x=52;x<162;x+=6){d2R(f,x,y+2,2,2,'#5aa04a');d2R(f,x+1,y+1,1,1,'#7ac060');}}}
  let p=0,tasks=[],pops=[],full=false,t=0,say='',sayT=0,acts={crow:0,weed:0,water:0};
  const mk=()=>{tasks=[];for(let i=0;i<3;i++)tasks.push({k:'crow',x:62+i*38+(i%2)*6,y:40+i*18,on:true,t:9});for(let i=0;i<4;i++)tasks.push({k:'weed',x:58+i*28,y:58+(i%2)*24,on:true,t:9});for(let i=0;i<3;i++)tasks.push({k:'water',x:76+i*32,y:52+(i%2)*30,on:true,t:9});};
  const GAIN={crow:.12,weed:.08,water:.1};
  const reset=()=>{p=0;full=false;pops=[];mk();acts={crow:0,weed:0,water:0};say='';};reset();q.btn('reset',reset);
  cv.addEventListener('pointerdown',e=>{const [x,y]=cellOf(cv,e);if(full)return;let best=null,bd=1e9;for(const k of tasks){if(!k.on)continue;const d=Math.hypot(x-k.x,y-k.y);if(d<bd){bd=d;best=k;}}
    if(best&&bd<11){best.on=false;best.t=0;acts[best.k]++;p=Math.min(1,p+GAIN[best.k]);pops.push({x:best.x,y:best.y,t:0,sp:1});
      if(p>=1&&!full){full=true;say='Thanks! Have a look at my wares.';sayT=3;pops.push({x:24,y:30,t:-.3,s:'+90 karma',col:d2C.gold});}}});
  return {tick(dt){t+=dt;if(sayT>0)sayT-=dt;for(const k of tasks){k.t+=dt;if(!k.on&&k.t>6&&!full){k.on=true;}}for(const o of pops)o.t+=dt;pops=pops.filter(o=>o.t<1.4);
    c.drawImage(field,0,0);
    for(const k of tasks){if(!k.on)continue;if(k.k==='crow'){const fl=Math.floor(t*2+k.x)%4===0;d2B(c,d2S(d2CROW,{o:'#1e1c28',y:d2C.gold}),k.x,k.y-(fl?1:0));}
      else if(k.k==='weed')d2B(c,d2S(d2WEED,{w:'#a8b040'}),k.x,k.y);else{d2R(c,k.x-2,k.y-3,5,3,'#8a6a40');d2R(c,k.x-1,k.y-5,1,2,'#9a8a50');d2R(c,k.x+1,k.y-4,1,1,'#9a8a50');}}
    const nx=24,ny=72;d2R(c,nx-3,ny,7,1,d2C.g0);d2char(c,nx,ny,'r',0,d2NPCS[7]);
    const b=[0,1,2,1][Math.floor(t*6)%4];if(full)d2B(c,d2S(d2BAG,{o:d2C.ink,y:d2C.gold,Y:'#fff0a8'}),nx,ny-15-b);else d2B(c,d2heartFill(p),nx,ny-15-b);
    if(q.v('pct')&&!full)d2Tc(c,Math.round(p*100)+'%',nx,ny+3,d2C.wht,{ol:d2C.ink});
    if(sayT>0)d2say(c,say,nx+6,ny-30,W,d2C.ink,80);
    for(const o of pops)if(o.sp){if(o.t<.5)d2SPARK(c,o.x,o.y-3,o.t*2,d2C.wht);}else if(o.t>0)d2Tc(c,o.s,o.x,o.y-14-Math.round(Math.min(o.t,.5)*16),o.col||d2C.wht,{ol:d2C.ink});
    setHud(root,full?'vendor now':'help in any way');
    ro.innerHTML=`Heart <b>${Math.floor(p*10+1e-6)} / 10 rows</b> filled · crows ${acts.crow}, weeds ${acts.weed}, watered ${acts.water} · one progress byte per update [I]`;}};
});

// ======================================================================
// F1/F2: one-service NPC skips gossip; keyword "trade" opens the panel
// ======================================================================
reg('handoff',root=>{const {cv,c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root),ui=d2ui();
  const fl=d2floor(W,H,6);let mode='bank',panel=null,clicks=0,visits=0,log=[],focus=false,t=0,npcSay='',sayT=0;
  const ITEMS=[['Rope',50],['Torch',2],['Shovel',50],['Fishing rod',150],['Backpack',20],['Bread',4]];
  const chat=(who,s)=>{log.push({who,s});if(log.length>12)log.shift();};
  const setMode=m=>{mode=m;panel=null;clicks=0;log=[];focus=false;$$('[data-only]',root).forEach(e=>{e.hidden=e.dataset.only!==m;e.style.display=e.hidden?'none':'';});};
  q.seg('m',setMode);
  const talkBank=()=>{clicks++;if(panel==='bank')return;const skip=q.v('skip'),quest=q.v('quest');if(skip&&!quest){panel='bank';visits++;}else panel='gossip';};
  const say=k=>{if(mode!=='shop')return;chat('Ana',k);clicks++;
    if(k==='hi'){if(focus){chat('npc','Ana, I am already talking to you.');}else{focus=true;chat('npc','Welcome, Ana. Need some {trade}?');}}
    else if(k==='trade'){if(!focus){return;}panel='shop';chat('npc','Of course, just browse through my wares.');}
    else if(k==='bye'){if(focus){focus=false;if(panel)panel=null;chat('npc','Goodbye.');}}};
  const closeShop=()=>{if(panel!=='shop')return;panel=null;clicks++;chat('npc',"Thank you, come back whenever you're in need of something else.");};
  q.btn('hi',()=>say('hi'));q.btn('trade',()=>say('trade'));q.btn('bye',()=>say('bye'));
  q.btn('away',()=>{if(mode!=='shop')return;if(focus){focus=false;panel=null;chat('npc','Goodbye.');chat('sys','(walked away: focus released, window closed)');}});
  q.btn('talk',talkBank);
  cv.addEventListener('pointerdown',e=>{const [x,y]=cellOf(cv,e),id=ui.hit(x,y);if(!id)return;
    if(id==='banker')talkBank();else if(id==='g-bank'){clicks++;panel='bank';visits++;}else if(id==='g-quest'){clicks++;panel='quest';}else if(id==='g-bye'||id==='x-bank'||id==='x-quest'){clicks++;panel=null;}
    else if(id==='x-shop')closeShop();else if(id==='merch'){if(!focus)say('hi');}});
  setMode('bank');
  return {tick(dt){t+=dt;ui.clear();c.drawImage(fl,0,0);
    if(mode==='bank'){d2R(c,0,0,W,30,'#4a3a5a');for(let x=0;x<W;x+=16){d2R(c,x+2,6,12,14,'#3a2c48');d2R(c,x+3,7,10,12,'#5a4a72');}
      d2R(c,20,46,130,12,'#6b4429');d2R(c,20,46,130,2,'#b07a4a');d2R(c,20,57,130,1,d2C.ink);
      d2char(c,85,46,'d',0,d2NPCS[4]);ui.area('banker',75,22,20,26);d2char(c,85,80,'u',0,d2NPCS[1]);
      if(!panel)d2B(c,d2S(d2BAG,{o:d2C.ink,y:d2C.gold,Y:'#fff0a8'}),85,30-[0,1,2,1][Math.floor(t*6)%4]);
      if(q.v('quest')&&panel!=='quest')d2B(c,d2S(d2EXC,d2MK.gold),97,30-[0,1,2,1][Math.floor(t*6)%4]);
      if(panel==='gossip'){d2box(c,10,60,W-20,48);d2T(c,'Banker',16,63,d2C.gold);let y=74;ui.btn(c,'g-bank',16,y,W-32,11,"I'd like to bank.");y+=12;
        if(q.v('quest')){ui.btn(c,'g-quest',16,y,W-32,11,'! The lost ledger',{hot:1});y+=12;}ui.btn(c,'g-bye',16,y,W-32,11,'Goodbye.');}
      if(panel==='bank'){d2box(c,30,58,110,50);d2T(c,'Bank',36,61,d2C.gold);for(let i=0;i<10;i++){const x=36+(i%5)*20,y=72+Math.floor(i/5)*17;d2R(c,x,y,17,15,d2C.ink);d2R(c,x+1,y+1,15,13,'#3a3f66');if(i<4)d2B(c,d2S(i%2?d2BAG:d2HERB,i%2?{o:d2C.ink,y:d2C.gold,Y:'#fff0a8'}:d2HERBM),x+8,y+12);}
        ui.btn(c,'x-bank',W-48,60,16,9,'x',{dy:1});}
      if(panel==='quest'){d2box(c,10,60,W-20,48);d2T(c,'The lost ledger',16,63,d2C.gold);d2T(c,'Find the ledger I lost',16,75,d2C.txt);d2T(c,'in the cellar.',16,85,d2C.txt);ui.btn(c,'x-quest',W-30,62,16,9,'x',{dy:1});}
      setHud(root,panel==='bank'?'bank open':panel==='gossip'?'gossip menu':panel==='quest'?'quest offer':'click the banker');
      ro.innerHTML=`Clicks this visit <b>${clicks}</b> · bank opened <b>${visits}</b> times · ${q.v('skip')&&!q.v('quest')?'one service and no quest, so the menu is skipped':'menu shown'+(q.v('quest')?' (never skip when a quest is available)':'')}`;}
    else{d2R(c,0,0,W,24,'#3a4a3a');for(let x=4;x<80;x+=12){d2R(c,x,4,10,16,'#5a4030');d2R(c,x+1,6,8,2,'#c0a060');d2R(c,x+1,11,8,2,'#a06040');d2R(c,x+1,16,8,2,'#80a0c0');}
      d2R(c,8,40,70,10,'#6b4429');d2R(c,8,40,70,2,'#b07a4a');d2char(c,40,40,focus?'r':'d',0,d2NPCS[0]);ui.area('merch',30,18,20,24);d2char(c,58,64,'l',0,d2NPCS[1]);
      if(panel==='shop'){d2box(c,82,1,86,72);d2T(c,'Buy',88,4,d2C.gold);d2T(c,'Sell',112,4,d2C.mute);ui.btn(c,'x-shop',150,4,14,9,'x',{dy:1});
        ITEMS.forEach(([n,pr],i)=>{const y=15+i*9;if(i%2===0)d2R(c,85,y,80,9,'#2f3456');d2T(c,n,88,y,d2C.txt);const ps=String(pr);d2T(c,ps,162-d2W(ps),y,d2C.gold);});}
      // chat log: player lines in yellow, NPC lines in cyan
      const lines=[];for(const m of log){const pre=m.who==='Ana'?'Ana: ':m.who==='npc'?'Merchant: ':'';d2wrap(pre+m.s.replace(/[{}]/g,''),W-10).forEach(l=>lines.push({l,col:m.who==='Ana'?'#f2e07a':m.who==='npc'?d2C.cyan:d2C.mute}));}
      d2R(c,0,74,W,H-74,'rgba(14,14,24,.88)');lines.slice(-3).forEach((o,i)=>d2T(c,o.l,5,77+i*10,o.col));
      setHud(root,focus?(panel?'shop open':'in conversation'):'say hi');
      const bytes=ITEMS.reduce((a,[n])=>a+17+n.length,0);
      ro.innerHTML=`Shop open <b>≈ ${bytes} bytes</b> for ${ITEMS.length} items (17 + name each) · close <b>1 byte</b> · clicks <b>${clicks}</b> [V, S15; I]`;}}};
});

// ======================================================================
// F3: a forged buy packet; the server re-checks and logs
// ======================================================================
reg('revalidate',root=>{const {c,W,H}=d2cv(root),q=ctl(root),logEl=$('[data-log]',root);
  const SC={honest:{amt:1,item:'Rope',shop:true,lab:'Buy 1 rope'},zero:{amt:0,item:'Rope',shop:true},stack:{amt:250,item:'Rope',shop:true},closed:{amt:1,item:'Rope',shop:false},
    sale:{amt:1,item:'Crown',shop:true},poor:{amt:5,item:'Rope',shop:true}};
  const PRICE={Rope:50,Crown:4000},ID={Rope:'0B 0D',Crown:'0C 1E'};let gold=120,inv=0,crowns=0,anim=null,log=[],t=0;
  const CHK=['shop open','for sale','amount ok','gold ok','in range'];
  const send=k=>{const s=SC[k],trust=q.v('trust');const res=[s.shop,s.item==='Rope',s.amt>0&&s.amt<=100,gold>=PRICE[s.item]*s.amt,s.shop];
    anim={k,s,res,t:0,trust,done:false};};
  $$('[data-sc]',root).forEach(b=>b.addEventListener('click',()=>send(b.dataset.sc)));
  q.btn('reset',()=>{gold=120;inv=0;crowns=0;log=[];anim=null;render();});
  const render=()=>{logEl.innerHTML=log.slice(-6).map(l=>`<div>${l}</div>`).join('')||'<div>server log is empty</div>';};render();
  const finish=a=>{const ok=a.res.every(Boolean),s=a.s;const cost=PRICE[s.item]*s.amt;
    if(a.trust){gold-=cost;if(s.item==='Rope')inv+=s.amt;else crowns+=s.amt;log.push(`<b>trusting client</b>: gave ${s.amt} ${s.item.toLowerCase()}, gold now ${gold}${gold<0?' (negative!)':''}`);}
    else if(ok){gold-=cost;inv+=s.amt;log.push(`ok: sold ${s.amt} rope for ${cost} gp, gold ${gold}`);}
    else{const i=a.res.indexOf(false);log.push(`<b>reject</b> purchase item=${s.item.toLowerCase()} amount=${s.amt}: ${['no open shop owner','hasShopItemForSale = false','amount 0 or over stack 100','not enough gold','player out of range'][i]}`);}
    render();};
  return {tick(dt){t+=dt;if(anim){anim.t+=dt;if(!anim.done&&anim.t>1.1+CHK.length*.14){anim.done=true;finish(anim);}if(anim.t>3.2)anim=null;}
    d2R(c,0,0,W,H,'#171826');
    // client panel
    d2box(c,2,2,80,H-4);d2T(c,'CLIENT',8,5,d2C.gold);d2T(c,'Shop',8,16,d2C.mute);d2R(c,7,27,70,10,'#2f3456');d2T(c,'Rope',9,27,d2C.txt);d2T(c,'50',75-d2W('50'),27,d2C.gold);
    d2T(c,'Gold',8,42,d2C.mute);d2T(c,String(gold),76-d2W(String(gold)),42,gold<0?d2C.red:d2C.txt);d2T(c,'Rope',8,52,d2C.mute);d2T(c,String(inv),76-d2W(String(inv)),52,d2C.txt);
    if(crowns)d2T(c,'Crown',8,57,d2C.red),d2T(c,String(crowns),76-d2W(String(crowns)),57,d2C.red);
    const a=anim;
    if(a){const s=a.s,hex=`7A ${ID[s.item]} 00 ${(s.amt&255).toString(16).toUpperCase().padStart(2,'0')} ${((s.amt>>8)&255).toString(16).toUpperCase().padStart(2,'0')} 00 00`;
      d2T(c,a.k==='honest'?'menu: allowed':'forged packet',8,68,a.k==='honest'?d2C.green:d2C.red);d2T(c,hex.slice(0,11),8,78,d2C.cyan);d2T(c,hex.slice(12),8,88,d2C.cyan);
      // the packet flies across
      const f=clamp(a.t/1,0,1),px=Math.round(lerp(78,94,f));if(f<1){d2R(c,px,50,7,5,d2C.wht);d2R(c,px,50,7,1,d2C.ink);d2R(c,px+3,52,1,1,d2C.ink);}}
    // server panel
    d2box(c,88,2,80,H-4,'#2a2236');d2T(c,'SERVER',94,5,d2C.gold);
    CHK.forEach((k,i)=>{const y=18+i*12;let col=d2C.mute,mark='·';if(a&&!a.trust&&a.t>1+i*.14){mark=a.res[i]?'ok':'no';col=a.res[i]?d2C.green:d2C.red;}if(a&&a.trust){col='#5a5870';mark='-';}
      d2T(c,k,94,y,col);d2T(c,mark,163-d2W(mark),y,col);});
    if(a&&a.trust)d2Tc(c,'checks skipped',128,80,d2C.red);else if(a&&a.done)d2Tc(c,a.res.every(Boolean)?'applied':'rejected',128,80,a.res.every(Boolean)?d2C.green:d2C.red);
    }};
});

// small town pieces
function d2house(c,x,y,w=34,roof=d2C.roof,lit=false){d2R(c,x+2,y+20,w,3,'rgba(20,30,20,.35)');d2R(c,x,y+8,w,14,d2C.wall);d2R(c,x,y+8,w,1,d2C.wall2);d2R(c,x+w-3,y+8,3,14,d2C.wall2);
  for(let r=0;r<9;r++){const l=x-2+(r>>1),rr=x+w+1-(r>>1);d2R(c,l,y+8-r,rr-l,1,r===0?d2dim(roof):r%3===1?d2lit(roof):roof);}
  d2R(c,x+5,y+14,5,8,d2C.w0);d2R(c,x+6,y+15,3,7,d2C.w1);d2R(c,x+w-12,y+12,6,5,lit?'#ffd870':'#4a6a8a');d2R(c,x+w-12,y+12,6,1,d2C.ink);d2R(c,x+w-10,y+12,1,5,d2C.wall2);}
function d2rain(c,W,H,t,n=60,seed=3){c.fillStyle='rgba(190,210,240,.7)';for(let i=0;i<n;i++){const x=((i*53+seed*17)%W),sp=110+(i*37%40),y=((t*sp+i*97)%(H+8))-8;c.fillRect(Math.round(x-y*.15+W)%W,Math.round(y),1,3);}}

// ======================================================================
// G1: rule-based barks; the rule with the most matching facts wins
// ======================================================================
reg('barks',root=>{const {c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root),histEl=$('[data-hist]',root);
  const F={day:true,night:false,rain:false,near:true,wolves:true,cleared:false};
  const RULES=[{id:'R1',need:['near'],s:'Hello there.'},{id:'R2',need:['near','day'],s:'Fine day, traveller.'},{id:'R3',need:['near','night'],s:'Late to be out, friend.'},
    {id:'R4',need:['near','rain'],s:'Mind the puddles.'},{id:'R5',need:['near','rain','night'],s:'Rain and dark. Stay by the lamps.'},{id:'R6',need:['near','wolves'],s:'Wolves howled again last night.'},
    {id:'R7',need:['near','cleared'],s:'You cleared the wolves? Thank you!'},{id:'R8',need:['near','cleared','day'],s:'Sheep graze again, thanks to you.'},{id:'R9',need:['near','wolves','night'],s:'Hear that? Stay off the road.'}];
  const mem=new Map();let say='',sayT=0,poll=2,t=0,hist=[],last=null;
  const chips=$$('[data-f]',root);const sync=()=>chips.forEach(b=>b.classList.toggle('on',!!F[b.dataset.f]));
  chips.forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.f;if(k==='day'||k==='night'){F.day=k==='day';F.night=!F.day;}else if(k==='wolves'||k==='cleared'){F.wolves=k==='wolves';F.cleared=!F.wolves;}else F[k]=!F[k];sync();}));sync();
  const query=()=>{last=null;if(!F.near)return;if(mem.has('speaking'))return;if(q.v('gate')&&Math.random()>.3){last={gate:1};return;}
    const ok=RULES.filter(r=>r.need.every(k=>F[k])&&!mem.has('said:'+r.id));if(!ok.length){last={none:1};return;}
    const best=Math.max(...ok.map(r=>r.need.length)),top=ok.filter(r=>r.need.length===best),r=top[(Math.random()*top.length)|0];
    say=r.s;sayT=2.4;mem.set('speaking',2.4);mem.set('said:'+r.id,16);last={r,n:best,ties:top.length};hist.unshift(`${r.id} (${best} facts${top.length>1?', tie of '+top.length:''}): ${r.s}`);hist=hist.slice(0,4);
    histEl.innerHTML=hist.map(h=>`<div>${h}</div>`).join('');};
  q.btn('q',query);
  return {tick(dt){t+=dt;for(const [k,v] of mem){const nv=v-dt;if(nv<=0)mem.delete(k);else mem.set(k,nv);}if(sayT>0)sayT-=dt;
    if(q.v('auto')){poll-=dt;if(poll<=0){poll=2+Math.random()*2;query();}}
    c.drawImage(d2grass(W,H,31,{path:[[0,70,W,10]]}),0,0);d2house(c,8,22,40,d2C.roof,F.night);d2house(c,120,18,42,'#4a6aa0',F.night);
    d2R(c,96,60,1,10,d2C.st0);d2R(c,94,58,5,3,F.night?'#ffd870':d2C.st1);
    const nx=74,ny=66;d2R(c,nx-3,ny,7,1,d2C.g0);d2char(c,nx,ny,F.near?'r':'d',0,d2NPCS[3]);
    if(F.near){d2R(c,nx+15,ny+10,7,1,d2C.g0);d2char(c,nx+18,ny+10,'l',Math.floor(t*4)%2?0:0,d2NPCS[1]);}
    if(F.night){c.fillStyle='rgba(14,20,60,.55)';c.fillRect(0,0,W,H);d2R(c,93,56,7,6,'rgba(255,216,112,.35)');}
    if(F.rain){c.fillStyle='rgba(40,50,80,.25)';c.fillRect(0,0,W,H);d2rain(c,W,H,t);}
    if(F.cleared&&!F.night){d2char(c,150,90,'l',0,{o:d2C.ol,h:'#f4f0e6',H:'#ffffff',s:'#f4f0e6',S:'#d8d0c0',e:d2C.ink,c:'#f4f0e6',C:'#d8d0c0',p:'#3a3a3a'});}
    if(sayT>0)d2say(c,say,nx,ny-14,W,d2C.ink,96);
    const memTxt=[...mem].map(([k,v])=>`${k} ${v.toFixed(0)}s`).join(', ')||'none';
    setHud(root,F.near?(mem.has('speaking')?'speaking':`next poll ${q.v('auto')?poll.toFixed(1)+' s':'off'}`):'no player near: no query');
    ro.innerHTML=`Query <b>${Object.keys(F).filter(k=>F[k]).join(' + ')}</b> · last ${last?last.r?`<b>${last.r.id}</b> won with ${last.n} matching facts`:last.gate?'<b>gate</b> said no':'<b>nothing left</b>, all said':'none'} · memory <b>${memTxt}</b>`;}};
});

// ======================================================================
// G2: schedules from the clock: 8 slots of 3 hours
// ======================================================================
reg('schedule',root=>{const {cv,c,W,H}=d2cv(root),q=ctl(root),tab=$('[data-tab]',root);
  const PL={home1:[22,34],home2:[56,34],home3:[90,34],shop:[132,44],tavern:[124,98],field:[34,96]},ROADY=66;
  const NAMES={home1:'home',home2:'home',home3:'home',shop:'shop',tavern:'tavern',field:'field'},COL={home:'#6a6488',shop:'#c58a2c',tavern:'#b04a3c',field:'#4f8a43'};
  const NP=[{n:'Tam',role:'shopkeeper',p:d2NPCS[0],jit:12/60,s:['home1','home1','shop','shop','shop','shop','shop','tavern']},
    {n:'Ida',role:'farmer',p:d2NPCS[2],jit:37/60,s:['home2','home2','field','field','field','shop','tavern','home2']},
    {n:'Bo',role:'bard',p:d2NPCS[5],jit:55/60,s:['home3','home3','home3','field','shop','tavern','tavern','tavern']}];
  // table
  tab.innerHTML='<table class="sched"><tr><th></th>'+[0,3,6,9,12,15,18,21].map(h=>`<th>${String(h).padStart(2,'0')}</th>`).join('')+'</tr>'+NP.map(n=>`<tr><th>${n.n}</th>`+n.s.map(k=>`<td style="background:${COL[NAMES[k]]}">${NAMES[k]}</td>`).join('')+'</tr>').join('')+'</table>';
  const cells=NP.map((n,i)=>$$('tr',tab)[i+1].querySelectorAll('td'));
  const path=(a,b,f)=>{const P=[a,[a[0],ROADY],[b[0],ROADY],b];let L=0;const seg=[];for(let i=0;i<3;i++){const l=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]);seg.push(l);L+=l;}let d=f*L;
    for(let i=0;i<3;i++){if(d<=seg[i]||i===2){const k=seg[i]?Math.min(1,d/seg[i]):1;return [lerp(P[i][0],P[i+1][0],k),lerp(P[i][1],P[i+1][1],k),P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]];}d-=seg[i];}};
  // deterministic position from the clock alone (walk takes 1 game hour)
  const pos=(n,h)=>{const hh=((h-n.jit)%24+24)%24,sl=Math.floor(hh/3),into=hh-sl*3,cur=PL[n.s[sl]],prev=PL[n.s[(sl+7)%8]];if(into<1&&n.s[sl]!==n.s[(sl+7)%8]){const r=path(prev,cur,into);return {x:r[0],y:r[1],mv:true,dx:r[2],dy:r[3],sl};}return {x:cur[0],y:cur[1],mv:false,sl};};
  const clk={x:88,y:94,r:11};let drag=false;
  const setH=(x,y)=>{const a=Math.atan2(y-clk.y,x-clk.x);let h=(a/(Math.PI*2)*24+6+24)%24;q.el('h').value=h.toFixed(2);};
  cv.addEventListener('pointerdown',e=>{const [x,y]=cellOf(cv,e);if(Math.hypot(x-clk.x,y-clk.y)<16){drag=true;q.el('run').checked=false;setH(x,y);try{cv.setPointerCapture(e.pointerId);}catch(_){}}});
  cv.addEventListener('pointermove',e=>{if(drag){const [x,y]=cellOf(cv,e);setH(x,y);}});cv.addEventListener('pointerup',()=>{drag=false;});
  let t=0;
  return {tick(dt){t+=dt;let h=+q.el('h').value;if(q.v('run')){h=(h+dt*1)%24;q.el('h').value=h.toFixed(2);}q.out('h',`${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor(h%1*60)).padStart(2,'0')}`);
    const bg=d2grass(W,H,41,{path:[[0,ROADY-3,W,8],[30,ROADY,8,30],[128,ROADY,8,26],[136,40,6,26]]});c.drawImage(bg,0,0);
    const night=h<5.5||h>20.5?1:h<7?(7-h)/1.5:h>19?(h-19)/1.5:0;
    d2house(c,8,12,28,d2C.roof,night>.3);d2house(c,42,12,28,'#7a5aa0',night>.3);d2house(c,76,12,28,'#4a7aa0',night>.3);
    d2house(c,124,18,36,'#c58a2c',night>.3);d2T(c,'shop',135,17,d2C.ink);d2house(c,116,74,38,'#8a3a3a',h>17||h<2);d2T(c,'inn',129,72,d2C.wht);
    for(let y=88;y<108;y+=5){d2R(c,12,y,44,3,'#7a5638');for(let x=14;x<54;x+=5)d2R(c,x,y,2,2,'#6ab04a');}
    const P=NP.map(n=>Object.assign({n},pos(n,h))).sort((a,b)=>a.y-b.y);
    for(const o of P){const d=o.mv?(Math.abs(o.dx)>Math.abs(o.dy)?(o.dx>0?'r':'l'):(o.dy>0?'d':'u')):'d';d2R(c,o.x-3,o.y,7,1,'rgba(30,50,30,.5)');d2char(c,o.x,o.y,d,o.mv?Math.floor(t*7)%3:0,o.n.p);d2Tc(c,o.n.n,o.x,o.y+1,d2C.wht,{ol:d2C.ink});}
    if(night>0){c.fillStyle=`rgba(12,18,56,${(night*.55).toFixed(3)})`;c.fillRect(0,0,W,H);}
    // clock: 8 slots of 3 h
    d2R(c,clk.x-13,clk.y-13,27,27,'rgba(20,18,32,.75)');for(let i=0;i<8;i++){const a=(i*3-6)/24*Math.PI*2;d2R(c,Math.round(clk.x+Math.cos(a)*clk.r),Math.round(clk.y+Math.sin(a)*clk.r),1,1,i===Math.floor(h/3)?d2C.gold:d2C.mute);}
    const a=(h-6)/24*Math.PI*2;for(let k=0;k<9;k++)d2R(c,Math.round(clk.x+Math.cos(a)*k),Math.round(clk.y+Math.sin(a)*k),1,1,d2C.gold);d2R(c,clk.x,clk.y,1,1,'#ffffff');
    NP.forEach((n,i)=>{const sl=Math.floor((((h-n.jit)%24)+24)%24/3);cells[i].forEach((td,j)=>td.classList.toggle('now',j===sl));});
    const tam=pos(NP[0],h);setHud(root,`slot ${Math.floor(h/3)+1} of 8 · Tam ${NAMES[NP[0].s[tam.sl]]}${tam.mv?' (walking)':''}`);}};
});

// ======================================================================
// G3: voice blips per speaker
// ======================================================================
reg('blips',root=>{const {c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root),snd=root.querySelector('[data-b="snd"]');
  const SP=[{n:'Gran Ola',st:-4,p:d2NPCS[4],s:'Back then, the river froze.',col:'#c0a0ff'},{n:'Riona',st:0,p:d2NPCS[0],s:'The ferry leaves at noon.',col:d2C.cyan},{n:'Pip',st:4,p:d2NPCS[1],s:'Wanna see my frog?',col:d2C.gold}];
  SP.forEach(s=>{s.ty=d2typer();s.k=0;s.lastB=-1;s.ev=[];});let on=false,clock=0,cnt=0;
  snd.addEventListener('click',()=>{if(!on){if(!d2AU.ok())return;on=true;}else on=false;snd.textContent=on?'Sound on':'Sound off';snd.classList.toggle('on',on);});
  const play=i=>{const s=SP[i];s.ty.set(s.s);s.k=0;};
  $$('[data-play]',root).forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.play;if(v==='all')SP.forEach((_,i)=>play(i));else play(+v);}));
  play(0);
  return {tick(dt){clock+=dt;const nth=+(q.segv('n')||2),jit=q.v('jit');
    c.fillStyle='#1a1a2a';c.fillRect(0,0,W,H);
    SP.forEach((s,i)=>{s.ty.ms=50;const before=s.ty.n,k=s.ty.step(dt*1000);
      for(let j=before;j<s.ty.n;j++){const ch=s.s[j];if(ch===' '||!/[A-Za-z0-9]/.test(ch))continue;s.k++;if(s.k%nth!==0&&nth>1)continue;if(clock-s.lastB<.04)continue;s.lastB=clock;
        const st=s.st+(jit?(Math.random()-.5):0),f=330*Math.pow(2,st/12);s.ev.push({t:clock,st});if(on)d2AU.blip(f,.045,.05,'square');}
      s.ev=s.ev.filter(e=>clock-e.t<2.2);
      const y=4+i*28;d2char(c,10,y+20,'r',0,s.p);d2T(c,s.n,20,y,s.col);d2box(c,18,y+9,W-20,17);d2T(c,s.s,23,y+12,d2C.txt,{n:s.ty.n});
      if(!s.ty.done&&!s.ty.paused){d2R(c,4,y+3,1,2,s.col);d2R(c,6,y+2,1,3,s.col);}});
    // last 2 s of blips, one row per speaker, pitch shown as height
    const sy=90;d2R(c,0,sy-4,W,H-sy+4,'#11111c');SP.forEach((s,i)=>{for(const e of s.ev){const x=Math.round(W-6-(clock-e.t)*76);d2R(c,x,sy+i*6-Math.round(e.st/2)+2,2,2,s.col);}});d2R(c,W-6,sy-3,1,H-sy+3,'#3a3a52');
    const rate=SP.map(s=>s.ev.filter(e=>clock-e.t<1).length);ro.innerHTML=`${on?'<b>Sound on</b>':'Muted'} · blips in the last second <b>${rate.join(' / ')}</b> · every <b>${nth===1?'glyph':nth===2?'2nd glyph':'3rd glyph'}</b>, spaces skipped, at least 40 ms apart · pitch <b>−4, 0, +4</b> semitones${jit?' ± 0.5':''}`;}};
});

// word wrap over parseTags() glyphs (core layout() can break lines with x = NaN
// when the overflowing glyph follows a space), same output shape as layout()
function d2layout(src,maxW){const g=parseTags(src).g.map(q=>({...q}));let x=0,line=0,i=0;
  while(i<g.length){if(g[i].ch===' '){g[i].x=x;g[i].y=line*FONT.lh;g[i].line=line;g[i].w=FONT.adv(' ');x+=g[i].w;i++;continue;}
    let j=i,ww=0;while(j<g.length&&g[j].ch!==' '){ww+=FONT.adv(g[j].ch);j++;}
    if(x>0&&x+ww-1>maxW){line++;x=0;}
    for(let k=i;k<j;k++){const q=g[k];q.w=FONT.adv(q.ch);q.x=x;q.y=line*FONT.lh;q.line=line;x+=q.w;}i=j;}
  return {g,w:maxW,h:(line+1)*FONT.lh,lines:line+1,F:FONT};}

// ======================================================================
// G4: accessibility: size, speed, auto-advance, reduce motion, colour + shape
// ======================================================================
reg('access',root=>{const {cv,c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const SRC=['Ask about the {ferry}. The [wave]river[/wave] is high this week, and the old ford is gone.','The [shake]bridge[/shake] is out, so go and see {Mira} at the mill. She knows a way.','She sells {rope} by the mill. Bring coin, and mind the mud. Safe travels!'];
  let li=0,L=null,ty=d2typer(),t=0,auto=0,sc=1;
  const SPD={slow:83,normal:50,fast:30,instant:0};
  const load=()=>{sc=+(q.segv('sz')||1);L=d2layout(SRC[li],Math.floor((W-14)/sc));ty.set(L.g.map(g=>g.ch).join(''));auto=0;};
  q.seg('sz',load);q.seg('spd',()=>{});
  const adv=()=>{if(!ty.done){ty.finish();return;}li=(li+1)%SRC.length;load();};cv.addEventListener('pointerdown',adv);q.btn('next',adv);
  load();
  return {tick(dt){t+=dt;const rm=q.v('rm'),ul=q.segv('kw')==='ul',grey=q.v('grey');ty.ms=SPD[q.segv('spd')||'normal'];ty.step(dt*1000);
    if(ty.done&&q.v('auto')){auto+=dt;if(auto>1.5+.06*ty.s.length){li=(li+1)%SRC.length;load();}}
    c.drawImage(d2grass(W,40,51,{path:[[0,30,W,10]]}),0,0);const b=rm?0:[0,1,2,1][Math.floor(t*6)%4];d2char(c,85,34,'d',0,d2NPCS[6]);d2B(c,d2S(d2EXC,d2MK.gold),85,19-b);
    const by=40;d2box(c,1,by,W-2,H-by-1);
    // pages: the box holds a whole number of lines; earlier pages scroll out of the clip
    const lpp=Math.floor((H-by-12)/(10*sc)),cur=ty.n>0?L.g[Math.min(ty.n,L.g.length)-1].line:0,pg=Math.floor(cur/lpp);
    c.save();c.beginPath();c.rect(4,by+4,W-8,H-by-9);c.clip();drawLayout(c,L,8,by+6-pg*lpp*10*sc,{n:ty.n,t,still:rm,ul,scale:sc,col:d2C.txt,key:d2C.cyan});c.restore();
    if(ty.done&&!q.v('auto')){const o=rm?0:[0,1,2,1][Math.floor(t*60/9)%4];d2R(c,W-12,H-9+o,5,1,d2C.gold);d2R(c,W-11,H-8+o,3,1,d2C.gold);d2R(c,W-10,H-7+o,1,1,d2C.gold);}
    if(grey)d2sim(c,W,H,'gry');
    const cpl=Math.floor((W-14)/sc/5.2);
    setHud(root,`${sc}x text · about ${cpl} characters per line`);
    ro.innerHTML=`Speed <b>${q.segv('spd')}</b> (${ty.ms?ty.ms+' ms per glyph':'instant'}) · auto-advance <b>${q.v('auto')?'1.5 s + 0.06 s per character':'off, click to advance'}</b> · motion <b>${rm?'reduced: no wave, shake or bob':'full'}</b>`;}};
});

// ======================================================================
// H1: many players, one NPC: shared focus + queue vs multi-focus
// ======================================================================
reg('focus',root=>{const {c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const NAMES=['Ana','Bo','Cy','Dee','Eli','Fay','Gus','Hal','Ivy','Jo'];const K=10;// 1 s on screen = 10 s of game time
  let mode='queue',P=[],focus=[],queue=[],npcSay='',sayT=0,waits=[],served=0,t=0,npcD='d';
  const mk=n=>{P=[];for(let i=0;i<n;i++){const a=Math.PI*(.12+.76*(n===1?.5:i/(n-1)));P.push({n:NAMES[i],p:d2NPCS[i%8],x:Math.round(85-Math.cos(a)*62),y:Math.round(62+Math.sin(a)*38),st:'away',tt:.3+Math.random()*2,wait:0,talk:0,grief:false});}focus=[];queue=[];waits=[];served=0;};
  q.seg('m',v=>{mode=v;mk(q.v('n'));});q.on('n',()=>mk(q.v('n')));mk(q.v('n'));
  const start=p=>{p.st='talk';p.talk=(p.grief?120:20+Math.random()*20)/K;focus.push(p);waits.push(p.wait*K);if(waits.length>40)waits.shift();p.wait=0;};
  return {tick(dt){t+=dt;q.out('n',q.v('n'));const grief=q.v('grief');if(sayT>0)sayT-=dt;
    for(const p of P){p.grief=grief&&p===P[0];
      if(p.st==='away'){p.tt-=dt;if(p.tt<=0){p.st='wait';p.wait=0;if(mode==='multi')start(p);else if(!focus.length){start(p);npcSay=`Hello, ${p.n}.`;sayT=1.2;}else{queue.push(p);npcSay=`Wait for your turn, ${p.n}. (${queue.length})`;sayT=1.4;}}}
      else if(p.st==='wait')p.wait+=dt;
      else if(p.st==='talk'){p.talk-=dt;if(p.talk<=0){p.st='away';p.tt=(30+Math.random()*50)/K;focus=focus.filter(f=>f!==p);served++;if(p.grief){npcSay='Goodbye.';sayT=1.2;}
        if(mode==='queue'&&queue.length){const nx=queue.shift();start(nx);npcSay=`Next, ${nx.n}.`;sayT=1.2;}}}}
    const fp=focus[0];if(fp){const dx=fp.x-85,dy=fp.y-48;npcD=Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u');}
    c.drawImage(d2floor(W,H,8),0,0);d2R(c,0,0,W,14,'#4a3a5a');d2R(c,60,34,50,12,'#6b4429');d2R(c,60,34,50,2,'#b07a4a');d2char(c,85,34,npcD,0,d2NPCS[4]);
    for(const p of [...P].sort((a,b)=>a.y-b.y)){if(p.st==='away'){d2R(c,p.x-1,p.y,3,1,'rgba(0,0,0,.25)');continue;}
      d2char(c,p.x,p.y,p.y>52?'u':p.x<85?'r':'l',0,p.p);
      if(p.st==='wait'){d2B(c,d2balloon('...'),p.x,p.y-13);d2Tc(c,Math.round(p.wait*K)+'s',p.x,p.y+1,p.wait*K>60?d2C.red:d2C.wht,{ol:d2C.ink});}
      else{d2Tc(c,p.grief?'idle':'talk',p.x,p.y+1,p.grief?d2C.red:d2C.green,{ol:d2C.ink});if(p===fp)d2R(c,p.x-1,p.y-15,3,1,d2C.gold);}}
    if(sayT>0&&mode==='queue')d2say(c,npcSay,85,20,W,d2C.ink,W-10);
    const avg=waits.length?waits.reduce((a,b)=>a+b,0)/waits.length:0,mx=Math.max(0,...P.filter(p=>p.st==='wait').map(p=>p.wait*K));
    ro.innerHTML=`Talking <b>${focus.length}</b> · waiting <b>${P.filter(p=>p.st==='wait').length}</b> · average wait <b>${avg.toFixed(0)} s</b> · longest now <b>${mx.toFixed(0)} s</b> · conversations done <b>${served}</b>`;}};
});

// ======================================================================
// H2/H3: bytes per NPC line over a crowd, and the chat token bucket
// ======================================================================
reg('wire',root=>{const {c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  let fmt='text',ch='chat',P=[],pk=[],lineT=0,sent=0,tot=0,t=0,tokens=4,mutes=0,mute=0,refill=0,msgs=[],flash=0;
  const mk=n=>{P=[];const r=mkRng(7);for(let i=0;i<n;i++){const a=r()*Math.PI*2,d=18+r()*46;P.push({x:Math.round(85+Math.cos(a)*d*1.2),y:Math.round(46+Math.sin(a)*d*.55),p:d2NPCS[i%8],d:'dlru'[i%4]});}P.sort((a,b)=>a.y-b.y);};
  q.on('n',()=>mk(q.v('n')));mk(q.v('n'));q.seg('f',v=>{fmt=v;tot=0;sent=0;});
  const resetB=()=>{if(ch==='chat'){tokens=4;}else tokens=5;mutes=0;mute=0;msgs=[];};q.seg('ch',v=>{ch=v;resetB();});
  q.btn('spam',()=>{let ok;if(ch==='chat'){if(mute>0)ok='muted';else if(tokens>=1){tokens--;ok='sent';}else{mutes++;mute=5*mutes*mutes;ok=`muted ${mute} s`;}}
    else{if(tokens>=1){tokens--;ok='sent';}else ok='dropped';}msgs.unshift(ok);msgs=msgs.slice(0,3);flash=.3;});
  q.btn('reset',resetB);
  return {tick(dt){t+=dt;const n=q.v('n');q.out('n',n);const B=fmt==='text'?86:fmt==='id'?8:15;
    lineT-=dt;if(lineT<=0){lineT=1.5;sent++;tot+=B*n;for(const p of P)pk.push({x0:85,y0:30,x1:p.x,y1:p.y-8,t:0});}
    for(const k of pk)k.t+=dt*1.6;pk=pk.filter(k=>k.t<1);
    // buckets: TFS chat 4 tokens, one back per 1.5 s; NPC talk burst 5, 3 per second
    if(ch==='chat'){if(mute>0)mute=Math.max(0,mute-dt);refill+=dt;if(refill>=1.5){refill-=1.5;tokens=Math.min(4,tokens+1);}}else{tokens=Math.min(5,tokens+dt*3);}
    if(flash>0)flash-=dt;
    c.drawImage(d2grass(W,80,61,{noFlowers:1}),0,0);
    d2char(c,85,30,'d',0,d2NPCS[7]);if(lineT>1.1)d2say(c,fmt==='text'?'Greetings!':'#412',85,17,W);
    for(const p of P)d2char(c,p.x,p.y,p.d,0,p.p);
    for(const k of pk){const x=lerp(k.x0,k.x1,k.t),y=lerp(k.y0,k.y1,k.t);d2R(c,x,y,fmt==='text'?3:1,fmt==='text'?2:1,fmt==='text'?d2C.gold:d2C.cyan);}
    // bucket strip
    const sy=80;d2R(c,0,sy,W,H-sy,'#171826');d2T(c,ch==='chat'?'Chat bucket':'NPC bucket',4,sy+3,d2C.mute);const cap=ch==='chat'?4:5;
    for(let i=0;i<cap;i++){const x=70+i*12,full=tokens>=i+1,part=!full&&tokens>i;d2R(c,x,sy+3,9,9,d2C.ink);d2R(c,x+1,sy+4,7,7,full?d2C.gold:part?'#7a6030':'#2a2a3e');}
    if(mute>0)d2T(c,`muted ${Math.ceil(mute)} s`,4,sy+13,d2C.red);else d2T(c,msgs[0]?'last: '+msgs[0]:'press Send',4,sy+13,msgs[0]&&msgs[0]!=='sent'?d2C.red:d2C.txt);
    if(flash>0)d2R(c,0,sy,W,1,d2C.gold);
    ro.innerHTML=`One line to ${n} players <b>${(B*n).toLocaleString()} B</b> as ${fmt==='text'?'full text (86 B each)':fmt==='id'?'a line id (8 B)':'a line id + a name (15 B)'} · ${n} × 86 = ${(86*n).toLocaleString()} B against ${n} × 8 = ${(8*n).toLocaleString()} B · mutes so far <b>${mutes}</b> (5, 20, 45, 80 s)`;}};
});

// ======================================================================
// H5: the same line in English, Spanish and German; pseudolocalization
// ======================================================================
reg('expansion',root=>{const {c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const T={en:{line:'Talk to the smith about your broken sword.',b1:'Buy',b2:'Quests',b3:'Bye'},es:{line:'Habla con el herrero sobre tu espada rota.',b1:'Comprar',b2:'Misiones',b3:'Adiós'},
    de:{line:'Sprich mit dem Schmied über dein zerbrochenes Schwert.',b1:'Kaufen',b2:'Aufträge',b3:'Tschüss'}};
  const AC={a:'á',e:'é',i:'í',o:'ö',u:'ü',n:'ñ',A:'Á',E:'É',O:'Ö',U:'Ü'};
  const pseudo=s=>{const body=[...s].map(ch=>AC[ch]||ch).join(''),pad=Math.max(1,Math.round(s.length*.3)-2);return '['+body+'~'.repeat(pad)+']';};
  let lang='en',t=0;q.seg('l',v=>{lang=v;});
  const get=k=>lang==='ps'?pseudo(T.en[k]):T[lang][k];
  return {tick(dt){t+=dt;const spare=q.v('spare');c.drawImage(d2floor(W,H,9),0,0);
    // bubble sized for 3 English lines (+1 spare line when ticked)
    const bw=96,lines=d2wrap(get('line'),bw-8),rows=spare?4:3,bh=rows*10+5,bx=8,by=6;
    d2bub(c,bx,by,bw,bh,bx+20);
    c.save();c.beginPath();c.rect(bx+1,by+1,bw-2,bh-2);c.clip();lines.forEach((l,i)=>d2T(c,l,bx+4,by+2+i*10,d2C.ink));c.restore();
    lines.forEach((l,i)=>{if(i>=rows){d2T(c,l,bx+4,by+2+i*10,d2C.red);}});
    d2char(c,bx+20,by+bh+16,'d',0,d2NPCS[0]);
    // three fixed buttons, 46 px wide
    const ks=['b1','b2','b3'];let over=0;ks.forEach((k,i)=>{const x=6+i*54,y=H-18,w=46,s=get(k),tw=d2W(s);d2R(c,x+1,y,w-2,14,d2C.ink);d2R(c,x,y+1,w,12,d2C.ink);d2R(c,x+1,y+1,w-2,12,'#e9e2cc');
      c.save();c.beginPath();c.rect(x+1,y+1,w-2,12);c.clip();d2T(c,s,x+Math.max(3,Math.round((w-tw)/2)),y+2,d2C.ink);c.restore();if(tw>w-6){over++;d2R(c,x+w-2,y+1,1,12,d2C.red);d2R(c,x,y+14,w,1,d2C.red);}});
    const ofl=lines.length>rows;
    d2T(c,ofl?'overflow':'fits',110,8,ofl?d2C.red:d2C.green,{ol:d2C.ink});d2T(c,`${lines.length} / ${rows} lines`,110,19,d2C.wht,{ol:d2C.ink});
    setHud(root,'');
    const ratio=k=>(d2W(get(k))/d2W(T.en[k])*100).toFixed(0)+'%';
    ro.innerHTML=`Width against English: line <b>${ratio('line')}</b> (${get('line').length} chars) · buttons <b>${ratio('b1')}</b>, <b>${ratio('b2')}</b>, <b>${ratio('b3')}</b> · labels clipped <b>${over}</b> of 3`;}};
});

// ======================================================================
// H6: latency strip: a scripted line vs an LLM exchange
// ======================================================================
reg('llm',root=>{const {c,W,H}=d2cv(root),q=ctl(root),ro=$('[data-ro]',root);
  const LINE='The ferry leaves at noon.';let t=-1,src='device';q.seg('s',v=>{src=v;});
  const go=()=>{t=0;};q.btn('go',go);
  const RT=.15,OPEN=8/60,LAT={device:1.6,cloud:3.4},MAX=6;
  return {tick(dt){if(t>=0&&t<MAX+1)t+=dt;const lat=LAT[src];
    d2R(c,0,0,W,H,'#171826');
    const lanes=[{lab:'Scripted line id',first:Math.max(RT,OPEN),col:d2C.green},{lab:src==='device'?'On-device LLM':'Cloud LLM',first:lat,col:d2C.red}];
    lanes.forEach((ln,i)=>{const y=4+i*36;d2T(c,ln.lab,4,y,ln.col);d2char(c,10,y+30,'r',0,d2NPCS[i?3:0]);
      const open=t<0?0:clamp(t/OPEN,0,1);if(open>0){const bw=Math.round(18+(W-40)*open);d2box(c,20,y+11,bw,20);}
      if(t>=0&&open>=1){if(t<ln.first){const d=Math.floor(t*4)%4;d2T(c,'.'.repeat(d),26,y+15,d2C.mute);}else{const n=Math.floor((t-ln.first)*20);d2T(c,LINE,26,y+15,d2C.txt,{n});}}});
    // time axis 0..6 s
    const ax=10,aw=W-20,ay=H-14,X=s=>ax+Math.round(s/MAX*aw);d2R(c,ax,ay,aw,1,'#4a4a62');for(let s=0;s<=MAX;s++){d2R(c,X(s),ay-1,1,3,'#6a6a82');d2T(c,String(s),X(s)-2,ay+2,d2C.mute);}
    d2R(c,X(lanes[0].first),ay-6,2,5,d2C.green);d2R(c,X(lat),ay-6,2,5,d2C.red);
    if(t>=0)d2R(c,X(Math.min(t,MAX)),ay-9,1,9,d2C.gold);
    ro.innerHTML=`First word: scripted <b>${Math.round(lanes[0].first*1000)} ms</b> (round trip hidden inside the 133 ms box open) · ${src==='device'?'on-device 2B model':'cloud'} <b>${lat.toFixed(1)} s</b> median per voice exchange [V, S204]`;}};
});
