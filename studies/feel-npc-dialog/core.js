"use strict";
// ======================================================================
// core (feel-npc-dialog, Game feel #1): generic helpers, ONE shared bitmap
// font with a glyph atlas, pixel UI frames and bubbles, townsfolk sprites,
// a small town painter, a cost meter, gesture-gated audio, the demo runner
// and page chrome. Shared by demos1.js, demos2.js and demos3.js.
//
// ---------------------------------------------------------------------
// TEXT API (stable; agent F uses it in demos2.js, do not rename)
// ---------------------------------------------------------------------
//   FONT   main font: caps 7 px, x-height 5, descenders 2, proportional,
//          1 px letter gap, space 3 px. FONT.lh = 10 (line height), FONT.h = 9.
//   FONT_S small caps font for bubbles: 3x5 (M, N, W wider), lowercase is
//          drawn as caps, accents dropped. FONT_S.lh = 7, FONT_S.h = 5.
//   FONT.adv(ch) -> advance in px (glyph width + 1)
//   textW(str, font=FONT) -> width in px of a plain string (no tags)
//   wrap(str, maxW, font=FONT) -> [lines]; words kept whole, '\n' breaks
//   drawText(ctx, str, x, y, col='#2b1d16', font=FONT, o={}) -> width
//       x,y = top-left of the line box, snapped to whole pixels.
//       o.shadow: colour of a 1 px drop shadow (right and down)
//       o.outline: colour of a 1 px outline on all 8 sides (Tibia-style overhead text)
//       o.align: 'left' (default) | 'center' | 'right'   o.n: draw only the first n glyphs
//   drawLines(ctx, lines, x, y, col, font=FONT, o={}) -> draws an array of lines, o.lh overrides
//   parseTags(src) -> {g:[{ch, col, fx, pause, spd, kw}], text}
//       [c=key]..[/c]  keyword colour      [c=#rrggbb]..[/c] any colour
//       [wave]..[/wave] [shake]..[/shake]  per-glyph motion
//       [p=N]   pause N frames (60 fps) before the next glyph
//       [spd=X]..[/spd]  typing speed multiplier for the glyphs inside
//       {word}  Tibia keyword: col 'key', kw:true, braces not drawn
//       Tags never count as glyphs.
//   layout(srcOrGlyphs, maxW, font=FONT) -> {g:[glyph+{x,y,w,line}], w, h, lines}
//   drawLayout(ctx, L, x, y, o) -> draws glyphs 0..o.n-1 (default all)
//       o.col default colour, o.key keyword colour (default UI.key), o.t seconds
//       (drives wave and shake), o.still true = reduce motion, o.ul underline keywords,
//       o.shadow drop-shadow colour, o.scale integer (default 1)
//   glyphAtlas(font, col) -> {cv, x[], w[]}  cached canvas holding every glyph in
//       one colour; drawText blits from it with one drawImage per glyph (§6d).
//
// PIXEL UI
//   UI           named colours (ink, paper, paper2, paper3, wood, wood2, wood3, gold,
//                gold2, cyan, key, red, green, blue, white, shadow, night, grass...)
//   frame(ctx, x, y, w, h, style='box') 9-slice pixel frame; styles: 'box' (parchment
//                with wood rim), 'bubble' (white, 1 px ink), 'ink' (dark panel), 'wood',
//                'chip' (small key chip). Corners are cut, edges tiled, never stretched.
//   bubble(ctx, x, y, w, h, tx, o) speech bubble body + tail whose tip is at (tx, y+h+3);
//                o.style 'bubble'|'ink', o.dir 1 (tail below) or -1 (tail above), o.think
//   bubTail(ctx, tx, yb, dir=1, style) the tail alone, for cached bubble bodies
//   arrowDown(ctx, x, y, col) 5x3 advance arrow;  px(ctx,x,y,col) one pixel; rect(ctx,x,y,w,h,col)
//   crisp: every single-canvas .stage is shown at a whole number of device pixels per
//          canvas pixel (automatic; add data-nofit to the .stage to opt out)
//   mkCanvas(w, h) -> offscreen canvas;  sprite(rows, pal) -> cached canvas from rows of chars
// TOWNSFOLK
//   LOOKS {player, elder, shop, guard, girl, boy, smith, bard, cat?...}: palette per character
//   drawNPC(ctx, x, y, look, dir='down', frame=0) 10x15 person, feet centred at (x, y);
//                dir 'down'|'up'|'left'|'right'; frame 0 stand, 1/3 stride
//   marker(ctx, x, y, kind, t) quest marker '!' gold, '?' gold, '?h' hollow grey, '!b' blue
//   mkTown(W, H, seed) -> {cv, spots:{fountain, board, shop, tavern, door, benches}} 16 px tiles
// COST AND SOUND
//   meter(k) smoothed performance.now() timer: m.t0(); ...; m.t1() -> ms (m.v)
//   fms(ms) formats ms;  AUD.enable() inside a click, AUD.on, AUD.blip(freq, ms, vol, type)
// GENERIC (same names as the VFX studies)
//   $ $$ rnd mkRng clamp lerp sat smooth hash2 svgEl svgText poly cellOf pointer ctl setHud reg
// ======================================================================
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let rs=20261111;
const rnd=()=>{rs^=rs<<13;rs^=rs>>>17;rs^=rs<<5;return (rs>>>0)/4294967296;};
const mkRng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const sat=v=>v<0?0:v>1?1:v;
const smooth=(a,b,x)=>{const t=sat((x-a)/(b-a));return t*t*(3-2*t);};
const hash2=(x,y)=>{let h=Math.imul(x*374761393+y*668265263,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,parent){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svgText(parent,x,y,txt,attrs={}){const t=svgEl('text',{x,y,...attrs},parent);t.textContent=txt;return t;}
function poly(svg,pts,attrs){return svgEl('polyline',{points:pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '),fill:'none',...attrs},svg);}
function cellOf(cv,e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height];}
function pointer(cv,fn){let down=false;cv.addEventListener('pointerdown',e=>{down=true;try{cv.setPointerCapture(e.pointerId);}catch(_){}fn(cellOf(cv,e),'down',e);});
  cv.addEventListener('pointermove',e=>{fn(cellOf(cv,e),down?'drag':'move',e);});
  const up=e=>{if(down){down=false;fn(cellOf(cv,e),'up',e);}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',e=>{if(!down)fn(cellOf(cv,e),'leave',e);});}
function ctl(root){const g=k=>root.querySelector(`[data-k="${k}"]`);
  return {el:g,v:k=>{const e=g(k);return e.type==='checkbox'?e.checked:+e.value;},
    on:(k,fn)=>{const e=g(k);e.addEventListener('input',fn);e.addEventListener('change',fn);},
    out:(k,t)=>{const o=root.querySelector(`[data-o="${k}"]`);if(o)o.textContent=t;},
    btn:(k,fn)=>{const e=root.querySelector(`[data-b="${k}"]`);if(e)e.addEventListener('click',()=>fn(e));return e;},
    seg:(k,fn)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(!s)return;s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',s).forEach(x=>x.classList.toggle('on',x===b));fn(b.dataset.v);});},
    segv:k=>{const b=root.querySelector(`[data-seg="${k}"] button.on`);return b?b.dataset.v:null;},
    setSeg:(k,v)=>{const s=root.querySelector(`[data-seg="${k}"]`);if(s)$$('button',s).forEach(x=>x.classList.toggle('on',x.dataset.v===String(v)));}};}
function setHud(root,t,k){const h=root.querySelector(k?`[data-hud="${k}"]`:'[data-hud]');if(h)h.textContent=t;}
function meter(k=.08){let s=-1,t=0;return {t0(){t=performance.now();},t1(){const d=performance.now()-t;s=s<0?d:s+(d-s)*k;return s;},get v(){return Math.max(0,s);}};}
const fms=v=>v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);

// ======================================================================
// BITMAP FONT + GLYPH ATLAS (hand-drawn for this page; see the API above)
// glyph string: char, width digit, then one base-32 digit per row (bit 4 = left column)
// ======================================================================
const FONT_BIG_SRC="A5ehhvhhh00B5uhhuhhu00C5ehggghe00D5uhhhhhu00E5vgguggv00F5vgguggg00G5ehgnhhf00H5hhhvhhh00I3s88888s00J572222ic00K5hikokih00L5ggggggv00M5hrllhhh00N5hppljjh00O5ehhhhhe00P5uhhuggg00Q5ehhhlid00R5uhhukih00S5ehge1he00T5v44444400U5hhhhhhe00V5hhhhha400W5hhhllrh00X5hha4ahh00Y5hha444400Z5v1248gv00a500e1fhf00b5gguhhhu00c400eggge00d511fhhhf00e500ehvge00f468s888800g500fhhhf1eh5gguhhhh00i1g0ggggg00j340444444ok4ggikoki00l2gggggg800m500qllll00n500uhhhh00o500ehhhe00p500uhhhuggq500fhhhf11r400moggg00s500fge1u00t408s888600u500hhhhf00v500hhha400w500hhlla00x500ha4ah00y500hhhhf1ez500v248v0005ehjlphe00138o8888s0025eh1248v0035eh161he004526aiv220055vgu11he0065egguhhe0075v1248880085ehhehhe0095ehhf11e00!1ggggg0g00\"3kk0000000#50avava000$54fke5u400%50pq4bj000&5cic8lid00'1gg0000000(28ggggg800)2g88888g00*300k8k0000+3008s80000,20000008g0-3000s00000.1000000g00/5122488g00:100g00g000;200808g000<4248g84200=300s0s0000>4g84248g00?5eh1240400@5ehnlnge00[2ogggggo00\\5g88422100]2o88888o00^38k0000000_50000000v0`2g80000000{3c88g88c00|1ggggggggg}3o88488o00~400ak00000á524e1fhf00é524ehvge00í28g8888800ó524ehhhe00ú524hhhhf00ñ5dmuhhhh00ü5a0hhhhf00ö5a0ehhhe00ä5a0e1fhf00ß5cikihhm00Ä5hehhvhh00Ö5hehhhhe00Ü5h0hhhhe00É56vguggv00¿5004048ghe¡100g0ggggg…5000000l00·1000g00000×300k8k0000→5042v24000←5048v84000♥50avve4000★504veah000°38k8000000";
const FONT_SMALL_SRC="A38kskkB3okokoC3cgggcD3okkkoE3sgogsF3sgoggG3cgkkcH3kkskkI3s888sJ3444k8K3kkokkL3ggggsM5hrlhhN4iqmiiO38kkk8P3okoggQ38kkocR3okokkS3cg84oT3s8888U3kkkksV3kkkk8W5hhlrhX3kk8kkY3kk888Z3s48gs03skkks138o88s23o48gs33o484o43kks4453sgo4o63cgsks73s488883sksks93sks4o!1ggg0g?3o4808.10000g,20008g'1gg000\"3kk000:10g0g0;20808g-300s00+308s80/3448gg(28ggg8)2g888g[2ogggo]2o888o*30k8k0=30s0s0<348g84>3g848g…50000l♥30ks80&38k8kc%3k48gk_30000s#3ksksk·100g00×30k8k0→404u40¿3808gc¡1g0ggg{28ggg8}2g888g|1ggggg$3co8co@3skgkc";
function mkFont(src,H,lh,small){const G={},B='0123456789abcdefghijklmnopqrstuv';let i=0;const step=2+H;
  while(i<src.length){const ch=src[i],w=+src[i+1],rows=[];for(let r=0;r<H;r++)rows.push(B.indexOf(src[i+2+r]));G[ch]={w,rows};i+=step;}
  const F={G,h:H,lh,small,sp:small?2:3,atl:{}};
  F.map=ch=>{if(G[ch])return ch;if(ch==='“'||ch==='”')return '"';if(ch==='‘'||ch==='’')return "'";if(ch==='—'||ch==='–')return '-';
    if(small){const u=ch.toUpperCase();if(G[u])return u;const d=ch.normalize('NFD')[0].toUpperCase();if(G[d])return d;}
    else{const d=ch.normalize('NFD')[0];if(G[d])return d;}return G['?']?'?':null;};
  F.adv=ch=>{if(ch===' ')return F.sp+1;const m=F.map(ch);return m?G[m].w+1:0;};
  return F;}
const FONT=mkFont(FONT_BIG_SRC,9,10,false),FONT_S=mkFont(FONT_SMALL_SRC,5,7,true);
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
// one canvas per (font, colour): every glyph side by side, 1 px apart
function glyphAtlas(F,col){const key=col;if(F.atl[key])return F.atl[key];const chars=Object.keys(F.G),xs={},ws={};let W=0;
  for(const ch of chars){xs[ch]=W;ws[ch]=F.G[ch].w;W+=F.G[ch].w+1;}
  const cv=mkCanvas(Math.max(1,W),F.h),c=cv.getContext('2d');c.fillStyle=col;
  for(const ch of chars){const g=F.G[ch];for(let r=0;r<F.h;r++){const b=g.rows[r];if(!b)continue;for(let k=0;k<5;k++)if(b&(16>>k))c.fillRect(xs[ch]+k,r,1,1);}}
  return F.atl[key]={cv,x:xs,w:ws};}
function textW(s,F=FONT){let w=0;for(const ch of s)w+=F.adv(ch);return Math.max(0,w-1);}
function wrap(s,maxW,F=FONT){const out=[];for(const para of String(s).split('\n')){let line='';for(const word of para.split(' ')){const t=line?line+' '+word:word;
      if(textW(t,F)<=maxW||!line)line=t;else{out.push(line);line=word;}}out.push(line);}return out;}
function blitGlyph(ctx,A,F,ch,x,y,s=1){const m=F.map(ch);if(!m)return;const w=A.w[m];ctx.drawImage(A.cv,A.x[m],0,w,F.h,x,y,w*s,F.h*s);}
function drawText(ctx,s,x,y,col='#2b1d16',F=FONT,o={}){s=String(s);const sc=o.scale||1;let w=textW(s,F)*sc;x=Math.round(o.align==='center'?x-w/2:o.align==='right'?x-w:x);y=Math.round(y);
  const n=o.n===undefined?Infinity:o.n;
  const run=(c,dx,dy)=>{const A=glyphAtlas(F,c);let cx=x+dx,k=0;for(const ch of s){if(k++>=n)break;if(ch!==' ')blitGlyph(ctx,A,F,ch,cx,y+dy,sc);cx+=F.adv(ch)*sc;}};
  if(o.outline){for(const [dx,dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]])run(o.outline,dx*sc,dy*sc);}
  else if(o.shadow)run(o.shadow,sc,sc);
  run(col,0,0);return w;}
function drawLines(ctx,lines,x,y,col,F=FONT,o={}){const lh=o.lh||F.lh;lines.forEach((l,i)=>drawText(ctx,l,x,y+i*lh*(o.scale||1),col,F,o));}
// --- tags: colour, wave, shake, pause, speed; {keyword}
function parseTags(src){const g=[];let col=null,fx=null,spd=1,pause=0,kw=false,text='';const s=String(src);
  for(let i=0;i<s.length;i++){const ch=s[i];
    if(ch==='['){const j=s.indexOf(']',i);if(j>i){const tag=s.slice(i+1,j);let m;
        if((m=tag.match(/^c=(.+)$/))){col=m[1];i=j;continue;}if(tag==='/c'){col=null;i=j;continue;}
        if(tag==='wave'||tag==='shake'){fx=tag;i=j;continue;}if(tag==='/wave'||tag==='/shake'){fx=null;i=j;continue;}
        if((m=tag.match(/^p=(\d+)$/))){pause+=+m[1];i=j;continue;}
        if((m=tag.match(/^spd=([\d.]+)$/))){spd=+m[1]||1;i=j;continue;}if(tag==='/spd'){spd=1;i=j;continue;}}}
    if(ch==='{'){kw=true;continue;}if(ch==='}'){kw=false;continue;}
    g.push({ch,col:kw?'key':col,fx,pause,spd,kw});pause=0;text+=ch;}
  return {g,text};}
function layout(src,maxW,F=FONT){const g=(typeof src==='string'?parseTags(src).g:src).map(x=>({...x}));let x=0,y=0,line=0,lastSp=-1,startLine=0,mw=0;
  for(let i=0;i<g.length;i++){const q=g[i];
    if(q.ch==='\n'){q.x=x;q.y=y;q.w=0;q.line=line;x=0;y+=F.lh;line++;lastSp=-1;startLine=i+1;continue;}
    const a=F.adv(q.ch);q.w=a;
    if(q.ch!==' '&&x+a-1>maxW&&lastSp>startLine){// move the current word to the next line
      const sh=lastSp+1<i?g[lastSp+1].x:x;/* the overflowing glyph may start its word */for(let k=lastSp+1;k<i;k++){g[k].x-=sh;g[k].y+=F.lh;g[k].line=line+1;}x-=sh;y+=F.lh;line++;startLine=lastSp+1;lastSp=-1;}
    q.x=x;q.y=y;q.line=line;if(q.ch===' ')lastSp=i;x+=a;mw=Math.max(mw,x-1);}
  return {g,w:mw,h:(line+1)*F.lh,lines:line+1,F};}
function drawLayout(ctx,L,x,y,o={}){const F=L.F||FONT,n=o.n===undefined?L.g.length:Math.min(o.n,L.g.length),t=o.t||0,sc=o.scale||1;
  const base=o.col||UI.ink,key=o.key||UI.key;
  for(let pass=o.shadow?0:1;pass<2;pass++)for(let i=0;i<n;i++){const q=L.g[i];if(q.ch===' '||q.ch==='\n')continue;
    let dx=0,dy=0;if(!o.still){if(q.fx==='wave')dy=Math.round(Math.sin(t*7+i*.7)*1.4);else if(q.fx==='shake'){const h=hash2(i*13,Math.floor(t*20));dx=h<.33?-1:h>.66?1:0;dy=hash2(i*7,Math.floor(t*20)+3)<.5?0:-1;}}
    const c=pass===0?o.shadow:(q.col==='key'?key:q.col||base);const A=glyphAtlas(F,c);
    const X=Math.round(x+(q.x+dx)*sc)+(pass===0?sc:0),Y=Math.round(y+(q.y+dy)*sc)+(pass===0?sc:0);blitGlyph(ctx,A,F,q.ch,X,Y,sc);
    if(pass===1&&o.ul&&q.kw){ctx.fillStyle=c;ctx.fillRect(X,Y+(F.h-1)*sc+ (F.small?1:0),(q.w)*sc,sc);}}}

// ======================================================================
// PIXEL UI: colours, frames, bubbles, arrows, sprites
// ======================================================================
const UI={ink:'#2b1d16',ink2:'#4a3426',paper:'#f4e7c5',paper2:'#e6d3a3',paper3:'#c9ad78',wood:'#7a4a2b',wood2:'#9e6a3c',wood3:'#4c2c1a',
  gold:'#f2c14e',gold2:'#c98a26',gold3:'#fff0a8',cyan:'#63d8ea',key:'#c2452d',red:'#d9503a',green:'#6fb04a',blue:'#4f8fd6',white:'#fbf7ec',
  shadow:'rgba(43,29,22,.35)',night:'#1c1a2a',grey:'#9a948a',grey2:'#c8c2b6',grass:'#6c9a3e',grass2:'#82b04c',grass3:'#55802f',
  cob:'#b3a690',cob2:'#9a8d77',cob3:'#7e725f',water:'#4fa6c9',water2:'#86cde3',roof:'#b4533a',roof2:'#8c3d2b',wall:'#e7d7b4',wall2:'#c9b48c'};
function px(ctx,x,y,col){ctx.fillStyle=col;ctx.fillRect(x|0,y|0,1,1);}
function rect(ctx,x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
const FRAME_ST={box:{rim:UI.wood3,mid:UI.wood2,hi:UI.gold,fill:UI.paper,inner:UI.paper2,t:3},bubble:{rim:UI.ink,fill:UI.white,inner:null,t:1},
  ink:{rim:'#120c09',mid:'#3a2a20',hi:'#6b5040',fill:'#21170f',inner:'#2b1f17',t:2},wood:{rim:UI.wood3,mid:UI.wood,hi:UI.wood2,fill:UI.wood2,inner:UI.wood,t:2},
  chip:{rim:UI.wood3,fill:UI.paper2,inner:UI.paper,t:1}};
function frame(ctx,x,y,w,h,style='box'){const S=typeof style==='string'?FRAME_ST[style]:style;x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);if(w<4||h<4)return;
  ctx.fillStyle=S.rim;ctx.fillRect(x+1,y,w-2,h);ctx.fillRect(x,y+1,w,h-2);
  if(S.t>=2){ctx.fillStyle=S.mid;ctx.fillRect(x+2,y+1,w-4,h-2);ctx.fillRect(x+1,y+2,w-2,h-4);
    if(S.hi){ctx.fillStyle=S.hi;ctx.fillRect(x+2,y+1,w-4,1);ctx.fillRect(x+1,y+2,1,h-4);}}
  const t=S.t>=3?3:S.t;ctx.fillStyle=S.rim;if(S.t>=3){ctx.fillRect(x+t-1,y+t-1,w-2*t+2,h-2*t+2);}
  ctx.fillStyle=S.fill;ctx.fillRect(x+t,y+t,w-2*t,h-2*t);
  if(S.t===1){ctx.fillStyle=S.fill;ctx.fillRect(x+1,y+1,w-2,h-2);}
  if(S.inner){ctx.fillStyle=S.inner;ctx.fillRect(x+t,y+h-t-1,w-2*t,1);ctx.fillRect(x+w-t-1,y+t,1,h-2*t);}}
// speech bubble: body (x,y,w,h) and a tail whose tip ends at (tx, y+h+3) (dir 1) or (tx, y-3) (dir -1)
function bubble(ctx,x,y,w,h,tx,o={}){const st=o.style||'bubble',S=FRAME_ST[st];x=Math.round(x);y=Math.round(y);tx=Math.round(clamp(tx,x+3,x+w-4));const d=o.dir||1;
  frame(ctx,x,y,w,h,st);if(o.think){const by=d>0?y+h+1:y-3;rect(ctx,tx-1,by,3,2,S.rim);px(ctx,tx,by+(d>0?0:1),S.fill);rect(ctx,tx+1,by+(d>0?3:-3),2,2,S.rim);return;}
  bubTail(ctx,tx,d>0?y+h-1:y,d,st);}
// the 3 px tail alone (for cached bubble bodies): yb = the body's bottom row (dir 1) or top row (dir -1)
function bubTail(ctx,tx,yb,d=1,st='bubble'){const S=FRAME_ST[st];tx=Math.round(tx);yb=Math.round(yb);ctx.fillStyle=S.fill;ctx.fillRect(tx-1,yb,3,1);
  for(let k=1;k<=3;k++){const yy=yb+d*k;const half=3-k;ctx.fillStyle=S.rim;ctx.fillRect(tx-half-1,yy,half*2+3,1);if(half>0){ctx.fillStyle=S.fill;ctx.fillRect(tx-half,yy,half*2+1,1);}}}
function arrowDown(ctx,x,y,col=UI.wood3){rect(ctx,x,y,5,1,col);rect(ctx,x+1,y+1,3,1,col);px(ctx,x+2,y+2,col);}
const SPR={};
function sprite(rows,pal,key){key=key||rows.join('|')+JSON.stringify(pal);if(SPR[key])return SPR[key];const h=rows.length,w=rows[0].length,cv=mkCanvas(w,h),c=cv.getContext('2d');
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=rows[y][x];if(ch!=='.'&&pal[ch]){c.fillStyle=pal[ch];c.fillRect(x,y,1,1);}}return SPR[key]=cv;}

// ======================================================================
// TOWNSFOLK: 10x15 people with outline, 4 directions, 2-frame stride
// letters: o outline, h hair, H hair shade, s skin, e eye, c shirt, C shirt shade,
// p legs, b boots, a hat, A hat shade, w beard/apron
// ======================================================================
const NPC_HEAD={down:["...oooo...","..ohhhho..",".ohhhhhho.",".ohssssho.",".osesseso.",".osssssso.","..osssso.."],
  up:["...oooo...","..ohhhho..",".ohhhhhho.",".ohhhhhho.",".oHhhhhHo.",".oHHHHHHo.","..osssso.."],
  right:["...oooo...","..ohhhho..",".ohhhhhho.",".ohhhssso.",".ohhssseo.",".oHsssssо.".replace('о','o'),"..osssso.."]};
const NPC_BODY={down:[".oCccccCo.","osccwwccso","osCcwwcCso",".oCccccCo."],up:[".oCccccCo.","osCccccCso","osCccccCso",".oCccccCo."],
  right:[".oCccccCo.",".oCcccsso.",".oCcccsso.",".oCccccCo."]};
const NPC_LEGS=[["..oppppo..","..opoopo..","..oboobo..","..oo..oo.."],["..oppppo..",".opo..opo.",".obo..obo.",".oo....oo."]];
const NPC_HAT={hood:["..oaaaao..",".oaaaaaao.","oaAaaaaAao"],helm:["...oooo...","..oaaaao..",".oaAAAAao."],cap:["..........","..oaaaao..",".oaaaaaaao".slice(0,10)],
  brim:["...oaao...","..oaaaao..","oAAAAAAAAo"]};
const LOOKS={
  player:{h:'#5a3a22',H:'#3e2716',s:'#f0c49a',e:'#2b1d16',c:'#3f78c2',C:'#2c5791',w:'#3f78c2',p:'#4a3a30',b:'#2b1d16'},
  elder:{h:'#e9e4d8',H:'#bdb6a6',s:'#e6b88e',e:'#2b1d16',c:'#7a4f9a',C:'#5a3874',w:'#f4f0e6',p:'#5a3874',b:'#3a2414'},
  shop:{h:'#a8552c',H:'#7d3c1e',s:'#f2c8a0',e:'#2b1d16',c:'#4f8a4a',C:'#3a6a37',w:'#efe2c2',p:'#5a4030',b:'#2b1d16'},
  guard:{h:'#4a3020',H:'#2e1c12',s:'#e8b88a',e:'#2b1d16',c:'#3b5f9e',C:'#2a4475',w:'#c9a24a',p:'#3a3a48',b:'#22222a',a:'#a7a9b4',A:'#6d6f7c',hat:'helm'},
  girl:{h:'#d68a3a',H:'#a8662a',s:'#f6d2b0',e:'#2b1d16',c:'#d9586a',C:'#a83e52',w:'#d9586a',p:'#7a4a6a',b:'#3a2414'},
  boy:{h:'#2e2a28',H:'#1a1716',s:'#c98e64',e:'#2b1d16',c:'#e0b13a',C:'#b0862a',w:'#e0b13a',p:'#3e5a7a',b:'#2b1d16'},
  smith:{h:'#3a2a1e',H:'#22180f',s:'#d9a07a',e:'#2b1d16',c:'#6a5a50',C:'#4a3e36',w:'#3a2c24',p:'#3a3028',b:'#1d1410'},
  bard:{h:'#f0d070',H:'#c9a848',s:'#f2caa6',e:'#2b1d16',c:'#2f9a8a',C:'#22746a',w:'#2f9a8a',p:'#6a3a2a',b:'#2b1d16',a:'#b4533a',A:'#8c3d2b',hat:'brim'},
  witch:{h:'#5a3a7a',H:'#3e2756',s:'#e7c7a4',e:'#2b1d16',c:'#3a4a3a',C:'#283428',w:'#3a4a3a',p:'#2a2a2a',b:'#1a1a1a',a:'#3a2a4a',A:'#24182e',hat:'hood'},
  monk:{h:'#7a5a3a',H:'#5a4028',s:'#e2b088',e:'#2b1d16',c:'#a0703a',C:'#7a522a',w:'#a0703a',p:'#7a522a',b:'#3a2414',a:'#a0703a',A:'#7a522a',hat:'hood'}};
LOOKS.list=['player','elder','shop','guard','girl','boy','smith','bard','witch','monk'];
function npcRows(look,dir,fr){const L=typeof look==='string'?LOOKS[look]:look;const d=dir==='left'?'right':dir;
  let head=NPC_HEAD[d].slice();if(L.hat){const H=NPC_HAT[L.hat];head=H.concat(head.slice(H.length));}
  return head.concat(NPC_BODY[d],NPC_LEGS[fr&1]);}
function drawNPC(ctx,x,y,look,dir='down',fr=0){const L=typeof look==='string'?LOOKS[look]:look;const name=typeof look==='string'?look:JSON.stringify(look);
  const cv=sprite(npcRows(L,dir,fr),{o:UI.ink,...L},'npc:'+name+dir.replace('left','right')+(fr&1));
  const X=Math.round(x)-5,Y=Math.round(y)-15+((fr&1)?0:0);
  ctx.fillStyle='rgba(43,29,22,.28)';ctx.fillRect(X+1,Math.round(y),8,1);ctx.fillRect(X+2,Math.round(y)+1,6,1);
  if(dir==='left'){ctx.save();ctx.translate(X+10,Y);ctx.scale(-1,1);ctx.drawImage(cv,0,0);ctx.restore();}else ctx.drawImage(cv,X,Y);}
// quest markers, 5x9 glyphs with a 1 px outline, whole-pixel bob (0,1,1,0 steps)
const MARK_ROWS={'!':['.ooo.','oxxxo','oxxxo','oxxxo','.oxo.','.oxo.','..o..','.oxo.','.ooo.'],'?':['.ooo.','oxxxo','oo.xo','..oxo','.oxo.','.oxo.','..o..','.oxo.','.ooo.']};
function marker(ctx,x,y,kind='!',t=0,still=false){const bob=still?0:[0,1,1,0][Math.floor(t*4)%4];const k=kind[0],v=kind.slice(1);
  const col=v==='h'?{o:'#4a4540',x:'#9a948a'}:v==='b'?{o:UI.ink,x:'#5ab0f0'}:{o:UI.ink,x:UI.gold};
  const rows=v==='h'?(k==='?'?['.ooo.','o...o','oo..o','..o.o','.o.o.','.o.o.','..o..','.o.o.','.ooo.']:MARK_ROWS[k]):MARK_ROWS[k];
  ctx.drawImage(sprite(rows,col,'mk'+kind),Math.round(x)-2,Math.round(y)-9-bob);}

// ======================================================================
// TOWN: 16 px tiles of cobbles, grass, a fountain, houses, a shop counter,
// a notice board, trees, benches and lamps. Drawn once into a canvas.
// ======================================================================
function mkTown(W,H,seed=7){const cv=mkCanvas(W,H),c=cv.getContext('2d'),R=mkRng(seed);
  const pl=(x,y,col)=>{c.fillStyle=col;c.fillRect(x,y,1,1);};
  // grass base with tufts
  rect(c,0,0,W,H,UI.grass);for(let i=0;i<W*H/14;i++){const x=(R()*W)|0,y=(R()*H)|0;pl(x,y,R()<.5?UI.grass2:UI.grass3);}
  // cobble square (rounded) in the middle
  const sq={x:Math.round(W*.12),y:Math.round(H*.38),w:Math.round(W*.76),h:Math.round(H*.6)};
  for(let y=sq.y;y<H;y++)for(let x=sq.x;x<sq.x+sq.w;x++){const ox=(x-sq.x),oy=(y-sq.y);if((ox<2||ox>sq.w-3)&&oy<2)continue;
    const bx=((x+((y>>2)&1)*3)>>2),by=y>>2,e=(x+((y>>2)&1)*3)%4===0||y%4===0;c.fillStyle=e?UI.cob3:hash2(bx,by+seed)<.3?UI.cob2:UI.cob;c.fillRect(x,y,1,1);}
  // houses along the top: wall, roof, door, window
  const houses=[];const hw=Math.round(W*.22);
  [[.04,'#b4533a','#8c3d2b'],[.39,'#5a7ab0','#40598a'],[.74,'#6f8a3a','#556c2c']].forEach(([fx,r1,r2],k)=>{const x=Math.round(W*fx),y=Math.round(H*.06),w=hw,h=Math.round(H*.3);
    rect(c,x+2,y+h,w,2,'rgba(43,29,22,.35)');
    rect(c,x,y+Math.round(h*.45),w,Math.round(h*.55),UI.wall);for(let yy=y+Math.round(h*.45);yy<y+h;yy+=4)rect(c,x,yy,w,1,UI.wall2);
    for(let j=0;j<Math.round(h*.5);j++){const inset=Math.max(0,3-j);rect(c,x-2+inset,y+j,w+4-2*inset,1,j%3===0?r2:r1);}
    rect(c,x-2,y+Math.round(h*.45)-1,w+4,1,UI.ink);
    const dx=x+Math.round(w*.42),dy=y+h-11;rect(c,dx-1,dy-1,9,12,UI.ink);rect(c,dx,dy,7,11,UI.wood);rect(c,dx+1,dy+1,5,10,UI.wood2);pl(dx+5,dy+6,UI.gold);
    const wx=x+5,wy=y+Math.round(h*.6);rect(c,wx-1,wy-1,8,7,UI.ink);rect(c,wx,wy,6,5,'#ffd884');rect(c,wx+3,wy,1,5,UI.ink);rect(c,wx,wy+2,6,1,UI.ink);
    const wx2=x+w-11;rect(c,wx2-1,wy-1,8,7,UI.ink);rect(c,wx2,wy,6,5,'#ffd884');rect(c,wx2+3,wy,1,5,UI.ink);rect(c,wx2,wy+2,6,1,UI.ink);
    houses.push({x,y,w,h,door:{x:dx+3,y:y+h+2}});});
  // shop sign and tavern sign
  const sh=houses[1],tv=houses[2];rect(c,sh.x+sh.w-4,sh.y+Math.round(sh.h*.45)+1,9,7,UI.ink);rect(c,sh.x+sh.w-3,sh.y+Math.round(sh.h*.45)+2,7,5,UI.gold);pl(sh.x+sh.w,sh.y+Math.round(sh.h*.45)+4,UI.ink);
  rect(c,tv.x-5,tv.y+Math.round(tv.h*.45)+1,9,7,UI.ink);rect(c,tv.x-4,tv.y+Math.round(tv.h*.45)+2,7,5,'#c98a26');rect(c,tv.x-2,tv.y+Math.round(tv.h*.45)+3,3,3,UI.paper);
  // fountain in the middle
  const fx=Math.round(W*.5),fy=Math.round(H*.66),fr=Math.round(Math.min(W,H)*.1);
  for(let y=-fr;y<=fr;y++)for(let x=-fr*1.4;x<=fr*1.4;x++){const d=(x*x)/(fr*fr*1.96)+(y*y)/(fr*fr);if(d>1)continue;pl(fx+Math.round(x),fy+y,d>.72?(y<0?UI.grey2:UI.grey):d>.6?UI.ink2:(hash2(x|0,y)<.15?UI.water2:UI.water));}
  rect(c,fx-1,fy-6,3,7,UI.grey2);rect(c,fx-2,fy-7,5,1,UI.ink2);
  // notice board (left), benches, lamps, trees
  const bx=Math.round(W*.2),by=Math.round(H*.5);rect(c,bx-8,by-10,16,10,UI.ink);rect(c,bx-7,by-9,14,8,UI.wood2);rect(c,bx-5,by-8,4,5,UI.paper);rect(c,bx,by-7,5,4,UI.paper2);rect(c,bx-6,by,2,5,UI.ink);rect(c,bx+4,by,2,5,UI.ink);
  const lamp=(x,y)=>{rect(c,x,y-14,1,14,UI.ink);rect(c,x-1,y-17,3,3,UI.ink);px(c,x,y-16,'#ffd884');rect(c,x-1,y,3,1,'rgba(43,29,22,.35)');};
  lamp(Math.round(W*.33),Math.round(H*.95));lamp(Math.round(W*.67),Math.round(H*.95));
  const bench=(x,y)=>{rect(c,x,y,14,3,UI.ink);rect(c,x+1,y,12,2,UI.wood2);rect(c,x+1,y+3,1,2,UI.ink);rect(c,x+12,y+3,1,2,UI.ink);};
  bench(Math.round(W*.62),Math.round(H*.86));
  const tree=(x,y)=>{rect(c,x-1,y-4,3,5,UI.wood3);rect(c,x-5,y,11,2,'rgba(43,29,22,.3)');
    for(let j=-14;j<=-3;j++)for(let i=-7;i<=7;i++){const d=(i*i)/49+((j+8.5)*(j+8.5))/36;if(d>1)continue;const lit=(-i-(j+8))/10+hash2(x+i,y+j)*.4;pl(x+i,y+j,d>.8?'#2e4a24':lit>.5?'#8ec05a':lit>0?'#6c9a3e':'#4a7a30');}};
  tree(Math.round(W*.04),Math.round(H*.62));tree(Math.round(W*.96),Math.round(H*.56));tree(Math.round(W*.94),Math.round(H*.98));
  return {cv,houses,fountain:{x:fx,y:fy,r:fr},board:{x:bx,y:by},sq};}

// ======================================================================
// AUDIO: off until a click enables it (no sound before a user gesture)
// ======================================================================
const AUD={ctx:null,on:false,enable(){try{if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();this.on=true;}catch(_){this.on=false;}return this.on;},
  disable(){this.on=false;},
  blip(f=440,ms=40,vol=.05,type='square'){if(!this.on||!this.ctx)return;const a=this.ctx,t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+ms/1000);o.connect(g).connect(a.destination);o.start(t);o.stop(t+ms/1000+.02);}};

// ======================================================================
// demo runner: lazy init + pause offscreen (IntersectionObserver) + rAF
// ======================================================================
const DEMOS={};function reg(name,fn){DEMOS[name]=fn;}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let motion=!reduce;
const live=new Map();
function initDemo(el){if(live.has(el))return;const name=el.dataset.demo,fn=DEMOS[name];const rec={api:null,vis:true,kick:120};live.set(el,rec);
  if(!fn){console.warn('no demo',name);return;}
  rec.api=fn(el)||{};if(rec.api.tick)rec.api.tick(1/60);
  const kick=()=>{rec.kick=Math.max(rec.kick,150);ensureLoop();};
  el.addEventListener('input',kick);el.addEventListener('pointerdown',kick);el.addEventListener('click',kick);el.addEventListener('keydown',kick);el.addEventListener('pointermove',()=>{if(!motion)rec.kick=Math.max(rec.kick,20);ensureLoop();});}
let looping=false,last=0;
function ensureLoop(){if(!looping){looping=true;last=performance.now();requestAnimationFrame(loop);}}
function loop(now){const dt=Math.min(.05,(now-last)/1000)||1/60;last=now;let any=false;
  for(const [el,rec] of live){if(!rec.vis||!rec.api||!rec.api.tick)continue;if(motion||rec.kick>0){if(rec.kick>0)rec.kick--;rec.api.tick(dt);any=true;}}
  if(any||motion)requestAnimationFrame(loop);else looping=false;}
const io=new IntersectionObserver(es=>{for(const e of es){const el=e.target;if(e.isIntersecting){initDemo(el);live.get(el).vis=true;ensureLoop();}else if(live.has(el))live.get(el).vis=false;}},{rootMargin:'120px 0px'});

// ======================================================================
// page chrome: TOC, motion toggle, profiles open/close, index filter
// ======================================================================
function chrome(){
  const toc=$('#toc'),btn=$('#tocBtn'),scrim=$('#tocScrim');
  const setOpen=o=>{toc.classList.toggle('open',o);btn.setAttribute('aria-expanded',o);scrim.hidden=!o;};
  btn.addEventListener('click',()=>setOpen(!toc.classList.contains('open')));scrim.addEventListener('click',()=>setOpen(false));
  toc.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
  addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
  const links=$$('.toc a[data-sec]'),map=new Map(links.map(a=>[a.dataset.sec,a]));
  const sio=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const a=map.get(e.target.id);if(a){links.forEach(l=>l.classList.toggle('on',l===a));}}},{rootMargin:'-20% 0px -70% 0px'});
  map.forEach((a,id)=>{const s=document.getElementById(id);if(s)sio.observe(s);});
  const mb=$('#motionBtn');const sync=()=>{mb.textContent=motion?'Pause animations':'Play animations';mb.setAttribute('aria-pressed',!motion);};sync();
  mb.addEventListener('click',()=>{motion=!motion;sync();ensureLoop();});
  $$('[data-openall]').forEach(b=>b.addEventListener('click',()=>$$('details.tp').forEach(d=>d.open=true)));
  $$('[data-closeall]').forEach(b=>b.addEventListener('click',()=>$$('details.tp').forEach(d=>d.open=false)));
  const openHash=()=>{const h=location.hash.slice(1);const d=h&&document.getElementById(h);if(d&&d.tagName==='DETAILS')d.open=true;};addEventListener('hashchange',openHash);openHash();
  const q=$('#idxq');if(q){const rows=$$('#idxt tbody tr'),n=$('#idxn'),chips=$$('.chips[data-idx] button');
    const f=()=>{const v=q.value.trim().toLowerCase();let c=0;rows.forEach(r=>{const m=!v||v.split('|').some(t=>r.textContent.toLowerCase().includes(t));r.hidden=!m;if(m)c++;});n.textContent=`${c} of ${rows.length} entries`;
      chips.forEach(b=>b.classList.toggle('on',b.dataset.q===v));};
    q.addEventListener('input',f);chips.forEach(b=>b.addEventListener('click',()=>{q.value=q.value===b.dataset.q?'':b.dataset.q;f();}));f();}
}
// whole-pixel scaling: the largest integer number of device pixels per canvas pixel that fits
function crispAll(){const dpr=window.devicePixelRatio||1;for(const st of $$('.stage:not([data-nofit])')){const cs=$$(':scope>canvas',st);if(cs.length!==1)continue;const cv=cs[0];
    const avail=st.parentElement.getBoundingClientRect().width;if(!avail)continue;const k=Math.min(Math.floor(avail*dpr/cv.width),Math.max(1,Math.floor(800*dpr/cv.width)));
    if(k>=1){cv.style.width=(k*cv.width/dpr)+'px';st.classList.add('fit');}else{cv.style.width='';st.classList.remove('fit');}}}
let crispT=0;addEventListener('resize',()=>{clearTimeout(crispT);crispT=setTimeout(crispAll,80);});
document.addEventListener('DOMContentLoaded',()=>{chrome();crispAll();$$('[data-demo]').forEach(el=>io.observe(el));});
