"use strict";
// ======================================================================
// core (feel-loot-pickup, Game feel #3; from feel-combat-juice): generic helpers, ONE shared bitmap
// font with a glyph atlas, pixel UI frames and bubbles, townsfolk sprites,
// a small town painter, a cost meter, gesture-gated audio, the demo runner
// and page chrome. Shared by demos1.js, demos2.js and demos3.js.
// COMBAT helpers (knight, goblin, flash silhouettes, numbers) and LOOT helpers (items, tiers, halos,
// beams, labels, bags, field, loot sounds) are documented at their sections.
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
// COMBAT (feel-combat-juice, Game feel #2): shared by demos1/2/3 so every
// figure looks the same. Sprites face RIGHT; pass o.flip to face left.
//   CB         arena palette;  NUMC number colours (phys, crit, heal, fire, earth, energy, ice, miss, white, mine)
//   cx2(cv)    2d context with smoothing off
//   UNITS      knight (10x15, sword drawn by angle, blue: you), ally (green tabard: another player), rival (red: PvP enemy),
//              goblin (12x12), orc (14x16), mage (10x15)
//   unitImg(kind, fr=0, pose='idle') cached canvas; pose 'idle' | 'hurt' (leans back, eyes shut) | 'dead' (lying)
//   unitSil(kind, fr, pose, col) the same sprite as a one-colour silhouette, baked ONCE and cached (§6d: 0.75 ms
//              for 100 flashing sprites pre-baked against 16.0 ms with per-frame source-atop)
//   drawUnit(ctx, kind, x, y, o) feet centred at (x, y); returns {X,Y,W,H}. o:
//       fr 0|1 stride, pose, flip, dx/dy sprite offset (shadow stays put), sx/sy squash scale from the feet,
//       a alpha, flash 'white'|'red'|'purple'|'#rrggbb', fa flash alpha 0..1 (HoH red is fa = 0.5 * m),
//       shadow false to skip it, sword angle in radians (knight; 0 = facing direction, -PI/2 = up), swLen
//   drawSword(ctx, hx, hy, ang, len=9) a 1 px blade with a dark outline and a gold guard, from the hand
//   drawSmear(ctx, cx, cy, a0, a1, r0, r1, col) a filled arc smear (angles in radians, a0 < a1)
//   spark(ctx, x, y, f, col) 4-frame hit spark, f = 0..3 (Tibia effects run 75 ms per frame)
//   hpBar(ctx, x, y, w, frac) Tibia-style bar centred on x;  tmark(ctx, x, y, w, h, col) 1 px target square
//   mkArena(W, H, seed) -> canvas of a stone floor in 16 px tiles (half of Asterion's 32 px)
//   drawNum(ctx, s, x, y, col, o) outlined bitmap number centred on x; o.scale integer, o.a alpha, o.font, o.bold (1 px wider strokes)
//   mkNums(o) Tibia number rules at figure scale (defaults: life 1000 ms, rise 24 px = 48 px at 32 px tiles halved,
//       fade from 833 ms, merge 400 ms, stack 250 ms and 6 px, 4 per target, 64 on screen)
//       .add(key, v, x, y, col, q) q: crit (bold, 2x pop for 3 frames, never merged), pop, bold, life, scale, a, nomerge
//       .tick(ms)  .draw(ctx)  .list  .merged  .dropped  .clear()
//   slowF(root) 0.25 when the figure's [data-k="slow"] box is ticked, else 1
// ======================================================================
const CB={ink:'#141018',floor:'#4a4658',floor2:'#423e50',floor3:'#56526a',mortar:'#2e2b3a',moss:'#4f5a48',wall:'#2a2735',torch:'#ffb347',
  blood:'#8a1c22',slime:'#4f8f2c',gold:UI.gold,white:'#ffffff',sky:'#7fb0ff'};
const NUMC={phys:'#ff4030',crit:'#ffd23a',heal:'#5cf05c',fire:'#ff8a28',earth:'#8ce04a',energy:'#c070ff',ice:'#7fdcff',miss:'#b8b0a4',white:'#fbf7ec',mine:'#fbf7ec'};
const FLASHC={white:'#ffffff',red:'#ff2a1a',purple:'#b45cff'};
const cx2=cv=>{const c=cv.getContext('2d');c.imageSmoothingEnabled=false;return c;};
const UNITS={
  knight:{pal:{o:CB.ink,p:'#d9503a',m:'#c9ccd6',M:'#7d8396',v:'#22252e',b:'#3f78c2',B:'#2c5791',h:UI.gold,l:'#5a4030',k:'#2b1d16'},hand:[8,9],
    body:["....pp....","...oooo...","..ommmmo..",".ommmmmmo.",".oMmmvvvo.",".oMmmmmmo.","..oMMMMo..",".obbbbbbo.","omBbbbbbmo","oMBhhhhhMo",".oBbbbbbo.",".ollllllo."],
    legs:[[".olo..olo.",".oko..oko.",".ooo..ooo."],["..olo.olo.","..oko.oko.","..ooo.ooo."]]},
  goblin:{pal:{o:CB.ink,g:'#79b84e',G:'#4f8a34',y:'#ffe14a',k:'#3a1a14',r:'#8a5a32',R:'#6a4022'},
    body:["....oooo....","o.oggggggo.o","oGoggggggoGo",".oGgyggyggo.","..oggggggo..","...ogkkgo...","...oooooo...","..orrrrrro..",".ogrRrrRrgo.",".oorrrrrroo."],
    legs:[["..ogo..ogo..","..oo....oo.."],[".ogo....ogo.",".oo......oo."]]},
  orc:{pal:{o:CB.ink,g:'#7a9a5a',G:'#56703e',y:'#ff6a3a',w:'#f4f0e6',m:'#8a8f9c',M:'#5d6270',r:'#6a4a3a',R:'#4a3228'},
    body:["....oooooo....","...ommmmmmo...","..oMmmmmmmMo..","..oggyggyggo..","..ogggggggggo.","..ogwggggwgo..","...oggggggo...","..oooooooooo..",".ogrrRrrRrrgo.","oggrrrrrrrrggo","oggorrrrrroggo",".oo.oRRRRo.oo.","....orrrro...."],
    legs:[["...ogo..ogo...","...ogo..ogo...","...ooo..ooo..."],["..ogo....ogo..","..ogo....ogo..","..ooo....ooo.."]]},
  mage:{pal:{o:CB.ink,a:'#5a3a9a',A:'#3e2770',s:'#f0c49a',e:'#2b1d16',c:'#7a4fc2',C:'#5a3894',h:UI.gold},hand:[8,9],
    body:["....oo....","...oaao...","..oaaaao..",".oAaaaaAo.","oAAAAAAAAo",".ossssso..",".osseseo..","..ossso...",".occcccco.","osCcccccso","osChhhhCso",".oCcccccCo."],
    legs:[[".oCcccccCo","..oCccCo..","..oo..oo.."],[".oCcccccCo",".oCco.oCo.",".oo...oo.."]]}};
UNITS.ally={...UNITS.knight,pal:{...UNITS.knight.pal,b:'#4a9a5a',B:'#33703f',p:'#f2c14e'}};
UNITS.rival={...UNITS.knight,pal:{...UNITS.knight.pal,b:'#c2453f',B:'#8f2e2a',p:'#2b2f3a',m:'#a9acb8',M:'#636878'}};
const UIMG={};
function unitRows(kind,fr,pose){const U=UNITS[kind];let rows=U.body.concat(U.legs[fr&1]);
  if(pose==='hurt'){const cut=Math.round(U.body.length*.6);rows=rows.map((r,i)=>i<cut?r.slice(1)+'.':r).map(r=>r.replace(/[ye]/g,'o'));}
  return rows;}
function unitImg(kind,fr=0,pose='idle'){const key=kind+(fr&1)+pose;if(UIMG[key])return UIMG[key];const U=UNITS[kind];
  const base=sprite(unitRows(kind,fr,pose==='dead'?'hurt':pose),U.pal,'u:'+kind+(fr&1)+(pose==='dead'?'hurt':pose));
  if(pose!=='dead')return UIMG[key]=base;
  const cv=mkCanvas(base.height,base.width),c=cv.getContext('2d');c.translate(base.height,0);c.rotate(Math.PI/2);c.drawImage(base,0,0);
  c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-atop';c.fillStyle='rgba(20,16,24,.35)';c.fillRect(0,0,cv.width,cv.height);return UIMG[key]=cv;}
function unitSil(kind,fr,pose,col){const key='s:'+kind+(fr&1)+pose+col;if(UIMG[key])return UIMG[key];const b=unitImg(kind,fr,pose),cv=mkCanvas(b.width,b.height),c=cv.getContext('2d');
  c.drawImage(b,0,0);c.globalCompositeOperation='source-in';c.fillStyle=col;c.fillRect(0,0,cv.width,cv.height);return UIMG[key]=cv;}
function drawUnit(c,kind,x,y,o={}){const img=unitImg(kind,o.fr||0,o.pose||'idle'),w=img.width,h=img.height,sx=o.sx||1,sy=o.sy||1;
  const W=Math.max(1,Math.round(w*sx)),H=Math.max(1,Math.round(h*sy)),X=Math.round(x+(o.dx||0)-W/2),Y=Math.round(y+(o.dy||0)-H),flip=!!o.flip;
  if(o.shadow!==false){const sw=Math.max(4,Math.round(w*.8)),bx=Math.round(x-sw/2),by=Math.round(y);c.fillStyle='rgba(8,6,14,.38)';c.fillRect(bx+1,by,sw-2,1);c.fillRect(bx+2,by+1,sw-4,1);}
  const ga=c.globalAlpha,al=o.a==null?1:o.a;c.globalAlpha=ga*al;
  const put=im=>{if(flip){c.save();c.translate(X+W,Y);c.scale(-1,1);c.drawImage(im,0,0,W,H);c.restore();}else c.drawImage(im,X,Y,W,H);};
  put(img);const fa=o.fa==null?1:o.fa;
  if(o.flash&&fa>0){c.globalAlpha=ga*al*Math.min(1,fa);put(unitSil(kind,o.fr||0,o.pose||'idle',FLASHC[o.flash]||o.flash));c.globalAlpha=ga*al;}
  const U=UNITS[kind];if(U.hand&&o.sword!=null&&o.pose!=='dead'){const hx=flip?X+W-1-Math.round(U.hand[0]*sx):X+Math.round(U.hand[0]*sx),hy=Y+Math.round(U.hand[1]*sy);drawSword(c,hx,hy,flip?Math.PI-o.sword:o.sword,o.swLen||9);}
  c.globalAlpha=ga;return {X,Y,W,H};}
function drawSword(c,hx,hy,ang,len=9){const dx=Math.cos(ang),dy=Math.sin(ang),pts=[];for(let i=2;i<=len;i++)pts.push([Math.round(hx+dx*i),Math.round(hy+dy*i)]);
  c.fillStyle=CB.ink;for(const [x,y] of pts)c.fillRect(x-1,y-1,3,3);
  const gx=Math.round(hx+dx*1.5),gy=Math.round(hy+dy*1.5),px_=Math.round(-dy*1.6),py_=Math.round(dx*1.6);c.fillRect(gx-px_-1,gy-py_-1,3,3);c.fillRect(gx+px_-1,gy+py_-1,3,3);
  c.fillStyle='#e8ecf4';for(const [x,y] of pts)c.fillRect(x,y,1,1);c.fillStyle='#9aa2b4';const [lx,ly]=pts[0];c.fillRect(lx,ly,1,1);
  c.fillStyle=UI.gold;c.fillRect(gx,gy,1,1);c.fillRect(gx-px_,gy-py_,1,1);c.fillRect(gx+px_,gy+py_,1,1);c.fillStyle='#8a5a32';c.fillRect(Math.round(hx),Math.round(hy),1,1);}
function drawSmear(c,cx,cy,a0,a1,r0,r1,col='#fff6d0'){cx=Math.round(cx);cy=Math.round(cy);const R=Math.ceil(r1)+1;
  const norm=a=>{a=(a-a0)%(2*Math.PI);return a<0?a+2*Math.PI:a;},span=a1-a0;
  for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const d=Math.hypot(i,j);if(d<r0||d>r1)continue;const t=norm(Math.atan2(j,i));if(t>span)continue;
    const k=t/span;c.fillStyle=d>r1-1.2?col:k>.5?'rgba(255,246,208,.85)':'rgba(255,246,208,.45)';c.fillRect(cx+i,cy+j,1,1);}}
function spark(c,x,y,f,col='#ffffff'){x=Math.round(x);y=Math.round(y);const R=(i,j,w,h,k)=>{c.fillStyle=k;c.fillRect(x+i,y+j,w,h);};
  if(f===0){R(-1,-1,3,3,'#ffffff');R(-2,0,5,1,col);R(0,-2,1,5,col);}
  else if(f===1){R(-4,0,9,1,col);R(0,-4,1,9,col);R(-1,-1,3,3,'#ffffff');R(-2,-2,1,1,col);R(2,-2,1,1,col);R(-2,2,1,1,col);R(2,2,1,1,col);}
  else if(f===2){R(-6,0,2,1,col);R(5,0,2,1,col);R(0,-6,1,2,col);R(0,5,1,2,col);R(-4,-4,1,1,col);R(4,-4,1,1,col);R(-4,4,1,1,col);R(4,4,1,1,col);}
  else if(f===3){R(-7,0,1,1,col);R(7,0,1,1,col);R(0,-7,1,1,col);R(0,7,1,1,col);}}
function hpBar(c,x,y,w,frac){frac=sat(frac);const X=Math.round(x-w/2-1),Y=Math.round(y);c.fillStyle=CB.ink;c.fillRect(X,Y,w+2,4);c.fillStyle='#3a1418';c.fillRect(X+1,Y+1,w,2);
  c.fillStyle=frac>.6?'#3fd23f':frac>.3?'#e8c82a':frac>.1?'#e8602a':'#c81e1e';c.fillRect(X+1,Y+1,Math.round(w*frac),2);}
function tmark(c,x,y,w,h,col='#ff3a2a'){x=Math.round(x);y=Math.round(y);c.fillStyle=col;c.fillRect(x,y,w,1);c.fillRect(x,y+h-1,w,1);c.fillRect(x,y,1,h);c.fillRect(x+w-1,y,1,h);}
function mkArena(W,H,seed=3){const cv=mkCanvas(W,H),c=cv.getContext('2d'),R=mkRng(seed);c.fillStyle=CB.floor;c.fillRect(0,0,W,H);
  for(let ty=0;ty<H;ty+=16)for(let tx=0;tx<W;tx+=16){const r=R(),off=((ty>>4)&1)*8;const x0=tx-off;
    c.fillStyle=r<.18?CB.floor3:r<.4?CB.floor2:CB.floor;c.fillRect(x0+1,ty+1,15,15);c.fillRect(x0+17,ty+1,15,15);
    c.fillStyle=CB.mortar;c.fillRect(x0,ty,16,1);c.fillRect(x0,ty,1,16);
    if(R()<.3){c.fillStyle='rgba(255,255,255,.06)';c.fillRect(x0+2,ty+2,5,1);}
    if(R()<.12){c.fillStyle=CB.mortar;const cx=x0+3+((R()*9)|0),cy=ty+4+((R()*8)|0);c.fillRect(cx,cy,2,1);c.fillRect(cx+1,cy+1,2,1);}
    if(R()<.08){c.fillStyle=CB.moss;c.fillRect(x0+1,ty+13,3,2);c.fillRect(x0+2,ty+12,1,1);}}
  const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(8,6,16,.45)');c.fillStyle=g;c.fillRect(0,0,W,H);return cv;}
function drawNum(c,s,x,y,col,o={}){const ga=c.globalAlpha;if(o.a!=null){if(o.a<=0)return;c.globalAlpha=ga*o.a;}s=String(s);const F=o.font||FONT,sc=o.scale||1,al=o.align||'center',ol=o.outline||CB.ink;
  if(o.bold){const xx=al==='center'?x-sc/2:x;drawText(c,s,xx,y,ol,F,{outline:ol,align:al,scale:sc});drawText(c,s,xx+sc,y,ol,F,{outline:ol,align:al,scale:sc});drawText(c,s,xx,y,col,F,{align:al,scale:sc});drawText(c,s,xx+sc,y,col,F,{align:al,scale:sc});}
  else drawText(c,s,x,y,col,F,{outline:ol,align:al,scale:sc});c.globalAlpha=ga;}
function mkNums(o={}){const P={life:1000,rise:24,fade:833,merge:400,stack:250,stackPx:6,per:4,cap:64,...o};
  const N={P,list:[],now:0,merged:0,dropped:0,
    add(key,v,x,y,col,q={}){const now=N.now,mine=N.list.filter(n=>n.key===key);
      if(P.merge>0&&!q.crit&&!q.nomerge&&typeof v==='number')for(const n of mine){if(!n.crit&&n.col===col&&typeof n.v==='number'&&now-n.born<P.merge){n.v+=v;n.hits++;n.bump=now;N.merged++;return n;}}
      if(P.per&&mine.length>=P.per){N.list.splice(N.list.indexOf(mine.shift()),1);N.dropped++;}
      if(P.cap&&N.list.length>=P.cap){const k=N.list.shift();N.dropped++;const i=mine.indexOf(k);if(i>=0)mine.splice(i,1);}
      const last=mine.length?mine[mine.length-1]:null;let yo=0;if(last&&P.stack>0&&now-last.born<P.stack)yo=last.yo+P.stackPx-P.rise*(now-last.born)/P.life;
      const n={key,v,x,y,col,born:now,life:q.life||P.life,yo,crit:!!q.crit,pop:q.pop==null?!!q.crit:q.pop,bold:q.bold==null?!!q.crit:q.bold,scale:q.scale||1,a:q.a==null?1:q.a,hits:1,bump:-1e9,font:q.font};N.list.push(n);return n;},
    tick(ms){N.now+=ms;if(N.list.length&&N.now-N.list[0].born>=0)N.list=N.list.filter(n=>N.now-n.born<n.life);},
    clear(){N.list=[];},
    draw(c){for(const n of N.list){const age=N.now-n.born,ff=n.life*P.fade/P.life,a=age<ff?1:sat((n.life-age)/(n.life-ff));
        const y=n.y+n.yo-P.rise*age/P.life;let sc=n.scale;if(n.pop&&age<50)sc*=2;
        drawNum(c,n.v,n.x,y-(sc>n.scale?4:0),n.col,{scale:sc,a:a*n.a,font:n.font,bold:n.bold});}}};return N;}
function slowF(root){const e=root.querySelector('[data-k="slow"]');return e&&e.checked?.25:1;}

// ======================================================================
// LOOT (feel-loot-pickup, Game feel #3): shared by demos1/2/3 so every figure looks the same.
// Figures draw at 16 px tiles, half of Asterion's 32 px, so a 20 px apex is 10 px here.
//   TIER[t]    {n:'Common'..'Legendary', c:'#e8e8e8' fill (report C1 hex), d dark shade, k short key}; TIERC[t] = TIER[t].c
//              Shape ladder (C1): 0 none, 1 corner pixels, 2 full outline, 3 outline + sparkle, 4 outline + beam
//   LG         field palette (g0..g4 grass dark to light, path, rock, ink, wood, gold)
//   ITEM_KINDS ['coin1','coin3','pile','potion','sword','shield','helmet','ring','gem','rune','scroll','bone','meat','star','axe','boots']
//   itemImg(kind, tier=0, dim=false) -> cached 12x12 canvas: 8x8 art with an ink outline, centred, plus the tier ring.
//              dim greys it out (an item you may not take). Gold uses coin1 / coin3 / pile, see goldKind(n).
//   goldKind(n) 'coin1' (1-2), 'coin3' (3-9) or 'pile' (10+): stack-size sprites (B3)
//   drawItem(c, kind, tier, x, y, o) item centred on x with its feet (bottom row) at y; o.h height above the floor in px
//              (shadow stays on the floor), o.dim, o.shadow false, o.t seconds (epic sparkle), o.a alpha, o.sc integer scale
//   drawShadow(c, x, y, w=8, a=.6) a floor shadow, 60% black by default (§7 preset), shrinks with o.h in drawItem
//   arcH(k, apex) parabolic height at progress k 0..1 (4 apex k (1-k));  ease(k) smoothstep;  easeIO(k) ease in-out
//   haloImg(tier) -> cached dithered disc in tier colour (pre-baked halo sprite, §6d: 0.94 ms vs 20.68 ms shadowBlur)
//   drawHalo(c, x, y, tier, a) additive halo centred at (x, y)
//   glowA(t, id) SPD pulse: 2 s triangle wave capped at 0.6, phase from the item id (C2)
//   beamImg(tier, h=48) -> cached 7 px beam with a white core, dithered fade upward (32 x 96 px at Asterion scale, half here)
//   drawBeam(c, x, y, tier, k=1, a=1, h=48) beam standing on (x, y); k grows it 0..1
//   sparkle(c, x, y, t) 4-frame epic sparkle at (x, y)
//   labelImg(text, tier, o) -> cached {cv, w, h}: dark box, tier-coloured top rule and text in FONT_S caps;
//              o.dim (not yours), o.icon true adds the 5x5 tier shape icon, o.junk boxless grey. One canvas per text: the atlas idea (D2)
//   drawLabel(c, text, tier, x, y, o) label centred on x, bottom at y; returns {x, y, w, h} for hit tests
//   TSHAPE[t]  5x5 label icons (none, dot, plus, diamond, star), drawn with tShape(c, x, y, t, col)
//   lootBagImg(tier) -> RotMG-style bag coloured by the best item inside (A3), 10x10
//   BAG_IMG    the player's backpack, 14x13;  BONES_IMG rotted corpse, 12x7
//   corpseImg(kind='goblin') lying corpse from UNITS (dead pose), cached
//   mkField(W, H, seed) -> canvas of grass on 16 px tiles with tufts, flowers and an optional dirt path (o.path row)
//   solveLabels(cands, o) grid label solver, documented where it is defined
//   lootSnd: AUD helpers (silent until AUD.enable() in a click): landSnd(material 'cloth'|'metal'|'coin'|'glass'|'stone', vol),
//              stingSnd(tier, vol), coinSnd(semi, vol), failSnd()
// ======================================================================
const TIER=[{n:'Common',k:'C',c:'#e8e8e8',d:'#6e6a72'},{n:'Uncommon',k:'U',c:'#4ce04c',d:'#1f6a2a'},{n:'Rare',k:'R',c:'#4c9bff',d:'#1f3f8a'},{n:'Epic',k:'E',c:'#b45cff',d:'#4f2486'},{n:'Legendary',k:'L',c:'#ff9a1f',d:'#8a4a10'}];
const TIERC=TIER.map(t=>t.c);
const LG={g0:'#23422e',g1:'#2f6136',g2:'#4a8641',g3:'#7fb04c',g4:'#bcd66c',p0:'#9e8670',p1:'#c49d64',p2:'#e2c58c',ink:'#1a1420',rock:'#a9a1ad',rock2:'#80778a',wood:'#925c37',gold:'#ffe08a',gold2:'#dd9f3a',gold3:'#9a5a28',blood:'#8a2440'};
const IPAL={o:'#1a1420',y:'#ffe08a',Y:'#dd9f3a',d:'#9a5a28',w:'#f6eedb',s:'#d3ccc9',S:'#a9a1ad',D:'#80778a',r:'#c25143',R:'#913641',a:'#4a8dc4',A:'#2b5694',b:'#925c37',B:'#6b402c',c:'#fff3c8',k:'#5d5468',v:'#9a7ac8',V:'#6d4f9e',g:'#92cfe4',G:'#3a8a86',W:'#fff3c8',O:'#dd9f3a',e:'#eab08c'};
const ITEM_ART={
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
 boots:[".oooo...",".obbo...",".obbo...",".obbo...",".obbboo.",".obbbbbo",".oBBBBBo",".ooooooo"]};
const ITEM_KINDS=Object.keys(ITEM_ART);
const goldKind=n=>n>=10?'pile':n>=3?'coin3':'coin1';
const LIMG={};
function hexMix(a,b,t){const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function itemImg(kind,tier=0,dim=false){const key='i:'+kind+tier+(dim?'d':'');if(LIMG[key])return LIMG[key];const art=ITEM_ART[kind]||ITEM_ART.bone,cv=mkCanvas(12,12),c=cv.getContext('2d'),G=hexMix(TIERC[tier]||'#e8e8e8','#5d5468',.15);
  const fill=new Uint8Array(144);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const ch=art[y][x];if(ch==='.')continue;let col=IPAL[ch];if(dim&&ch!=='o')col=hexMix(col,'#5d5468',.6);c.fillStyle=col;c.fillRect(x+2,y+2,1,1);fill[(y+2)*12+x+2]=1;}
  const ring=dim?'#80778a':TIERC[tier];
  if(tier>=2){c.fillStyle=ring;for(let y=0;y<12;y++)for(let x=0;x<12;x++){if(fill[y*12+x])continue;const n=(i,j)=>i>=0&&j>=0&&i<12&&j<12&&fill[j*12+i];if(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1))c.fillRect(x,y,1,1);}}
  else if(tier===1){c.fillStyle=ring;for(const [x,y] of [[0,0],[1,0],[0,1],[11,0],[10,0],[11,1],[0,11],[1,11],[0,10],[11,11],[10,11],[11,10]])c.fillRect(x,y,1,1);}
  return LIMG[key]=cv;}
function drawShadow(c,x,y,w=8,a=.6){x=Math.round(x);y=Math.round(y);w=Math.max(2,Math.round(w));c.fillStyle=`rgba(10,14,12,${a})`;c.fillRect(x-(w>>1)+1,y-1,w-2,1);c.fillRect(x-(w>>1),y,w,1);c.fillRect(x-(w>>1)+1,y+1,w-2,1);}
const arcH=(k,apex)=>4*apex*k*(1-k);
const ease=k=>{k=sat(k);return k*k*(3-2*k);};
const easeIO=k=>{k=sat(k);return k<.5?2*k*k:1-2*(1-k)*(1-k);};
function drawItem(c,kind,tier,x,y,o={}){const img=itemImg(kind,tier,!!o.dim),sc=o.sc||1,h=o.h||0,X=Math.round(x-6*sc),Y=Math.round(y-11*sc-h);
  if(o.shadow!==false){const sh=Math.max(.25,1-h/24);drawShadow(c,x,y,Math.round(8*sc*sh),.6*(o.a==null?1:o.a)*(.5+.5*sh));}
  const ga=c.globalAlpha;if(o.a!=null)c.globalAlpha=ga*o.a;c.drawImage(img,X,Y,12*sc,12*sc);
  if(tier===3&&!o.dim&&o.t!=null)sparkle(c,X+10*sc,Y+1*sc,o.t+(o.id||0)*.37);c.globalAlpha=ga;return {X,Y,W:12*sc,H:12*sc};}
function sparkle(c,x,y,t){const f=Math.floor(((t%1.2)+1.2)%1.2/.15);if(f>3)return;x=Math.round(x);y=Math.round(y);c.fillStyle='#ffffff';
  if(f===0)c.fillRect(x,y,1,1);else if(f===1){c.fillRect(x,y-1,1,3);c.fillRect(x-1,y,3,1);}else if(f===2){c.fillStyle=TIERC[3];c.fillRect(x,y-2,1,5);c.fillRect(x-2,y,5,1);c.fillStyle='#ffffff';c.fillRect(x,y,1,1);}else{c.fillStyle=TIERC[3];c.fillRect(x,y-2,1,1);c.fillRect(x,y+2,1,1);c.fillRect(x-2,y,1,1);c.fillRect(x+2,y,1,1);}}
const BAYER4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function haloImg(tier){const key='h:'+tier;if(LIMG[key])return LIMG[key];const r=[5,6,7,8,10][tier],s=r*2+1,cv=mkCanvas(s,s),c=cv.getContext('2d');c.fillStyle=TIERC[tier];
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){const d=Math.hypot(x-r,y-r)/r,v=(1-d)*(1-d)+(BAYER4[(y&3)*4+(x&3)]/16-.5)*.15,lv=v>.45?3:v>.2?2:v>.05?1:0;if(!lv)continue;c.globalAlpha=[0,.16,.32,.5][lv];c.fillRect(x,y,1,1);}
  return LIMG[key]=cv;}
function drawHalo(c,x,y,tier,a=.6){if(a<=0)return;const im=haloImg(tier),ga=c.globalAlpha,go=c.globalCompositeOperation;c.globalAlpha=ga*Math.min(1,a/.6);c.globalCompositeOperation='lighter';c.drawImage(im,Math.round(x-im.width/2),Math.round(y-im.height/2));c.globalCompositeOperation=go;c.globalAlpha=ga;}
const glowA=(t,id=0)=>{const p=((t/2+id*.618)%1+1)%1;return .6*(p<.5?p*2:2-p*2);};
function beamImg(tier,h=48){const key='b:'+tier+':'+h;if(LIMG[key])return LIMG[key];const cv=mkCanvas(7,h),c=cv.getContext('2d'),core=hexMix(TIERC[tier],'#ffffff',.75);
  for(let y=0;y<h;y++)for(let x=0;x<7;x++){const up=1-y/h,dx=Math.abs(x-3),thr=BAYER4[(y&3)*4+(x&3)]/16;let a=dx===0?1:dx===1?.9:dx===2?.5:.22;if(up<.25&&thr>up*4)a=0;if(dx===3&&thr>.5)a=0;if(!a)continue;
    c.globalAlpha=a*Math.min(1,up*1.5+.2);c.fillStyle=dx===0?core:TIERC[tier];c.fillRect(x,y,1,1);}
  return LIMG[key]=cv;}
function drawBeam(c,x,y,tier,k=1,a=1,h=48){if(k<=0||a<=0)return;const im=beamImg(tier,h),hh=Math.max(1,Math.round(h*sat(k))),ga=c.globalAlpha,go=c.globalCompositeOperation;c.globalAlpha=ga*a;c.globalCompositeOperation='lighter';
  c.drawImage(im,0,h-hh,7,hh,Math.round(x-3),Math.round(y-hh),7,hh);c.globalCompositeOperation=go;c.globalAlpha=ga;}
const TSHAPE=[null,[".....",".....","..x..",".....","....."],[".....","..x..",".xxx.","..x..","....."],["..x..",".xxx.","xxxxx",".xxx.","..x.."],["..x..","..x..","xxxxx",".x.x.","x...x"]];
function tShape(c,x,y,t,col){const s=TSHAPE[t];if(!s)return;c.fillStyle=col||TIERC[t];for(let j=0;j<5;j++)for(let i=0;i<5;i++)if(s[j][i]==='x')c.fillRect(Math.round(x)+i,Math.round(y)+j,1,1);}
function labelImg(text,tier,o={}){const key='l:'+text+'|'+tier+'|'+(o.dim?1:0)+(o.icon?1:0)+(o.junk?1:0);if(LIMG[key])return LIMG[key];
  const sw=o.icon&&tier>0?6:0,tw=textW(text,FONT_S),w=tw+4+sw,h=9,cv=mkCanvas(w,h),c=cv.getContext('2d'),fill=tier===4&&!o.dim&&!o.junk,col=o.dim?'#80778a':TIERC[tier];
  if(o.junk){drawText(c,text,2,2,'#a9a1ad',FONT_S,{outline:'#1a1420'});}
  else{c.fillStyle=fill?TIERC[4]:'rgba(14,12,22,.88)';c.fillRect(0,0,w,h);c.fillStyle=fill?'#ffe08a':col;c.fillRect(0,0,w,1);if(fill){c.fillStyle='#8a4a10';c.fillRect(0,h-1,w,1);}
    if(sw)tShape(c,2,2,tier,fill?'#1a1420':col);drawText(c,text,2+sw,2,fill?'#1a1420':col,FONT_S);}
  return LIMG[key]={cv,w,h};}
function drawLabel(c,text,tier,x,y,o={}){const L=labelImg(text,tier,o),X=Math.round(x-L.w/2),Y=Math.round(y-L.h);const ga=c.globalAlpha;if(o.a!=null)c.globalAlpha=ga*o.a;c.drawImage(L.cv,X,Y);c.globalAlpha=ga;return {x:X,y:Y,w:L.w,h:L.h};}
const LBAGC=['#925c37','#ff8ac8','#9a5cd6','#5fe0f0','#f4f4f4'];
function lootBagImg(tier){const q=LBAGC[tier]||LBAGC[0];return sprite(["...oo.....","..oTTo....","...oo.....","..oTTTTo..",".oLTTTTTo.","oLTTTTTTTo","oTTTTTTtTo","oTTTTTttto",".otttttto.","..oooooo.."],{o:'#1a1420',T:q,t:hexMix(q,'#1a1420',.35),L:hexMix(q,'#ffffff',.35)},'lbag'+tier);}
const BAG_IMG=sprite(["....oooooo....","...oBo..oBo...","..oooooooooo..",".obbbbbbbbbbo.",".obbbbbbbbbbo.",".oBBBBBBBBBBo.",".obbbyybbbbbo.",".obbbYYbbbbbo.",".obbbbbbbbbbo.",".obbbbbbbbbbo.",".oBbbbbbbbbBo.",".oBBBBBBBBBBo.","..oooooooooo.."],{o:'#1a1420',b:'#925c37',B:'#6b402c',y:'#ffe08a',Y:'#dd9f3a'},'lootpack');
const BONES_IMG=sprite(["..oo....oo..",".owwo..owSo.","..owwoowSo..","...owwwwo...","..owSo.owo..",".owSo...owo.","..oo.....o.."],{o:'#1a1420',w:'#f6eedb',S:'#a9a1ad'},'lootbones');
function corpseImg(kind='goblin'){return unitImg(kind,0,'dead');}
function mkField(W,H,seed=7,o={}){const cv=mkCanvas(W,H),c=cv.getContext('2d'),R=mkRng(seed);c.fillStyle=LG.g1;c.fillRect(0,0,W,H);
  const vn=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=hash2(xi+s,yi),b=hash2(xi+1+s,yi),d=hash2(xi+s,yi+1),e=hash2(xi+1+s,yi+1),sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return a+(b-a)*sx+(d-a)*sy+(a-b-d+e)*sx*sy;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vn(x/15,y/11,seed)*.75+vn(x/4,y/4,seed+40)*.25,th=BAYER4[(y&3)*4+(x&3)]/16*.08;if(n>.6+th){c.fillStyle=LG.g2;c.fillRect(x,y,1,1);}else if(n<.3-th){c.fillStyle='#2a5831';c.fillRect(x,y,1,1);}}
  if(o.path!=null){const py=o.path*16;c.fillStyle=LG.p0;c.fillRect(0,py,W,16);c.fillStyle=LG.p1;c.fillRect(0,py+2,W,12);for(let x=0;x<W;x+=3){if(hash2(x,py)<.4){c.fillStyle=LG.p2;c.fillRect(x,py+3+((hash2(x,7)*9)|0),1,1);}if(hash2(x,py+1)<.5){c.fillStyle=LG.g1;c.fillRect(x,py+(hash2(x,3)<.5?0:15),2,1);}}}
  for(let i=0;i<W*H/150;i++){const x=(R()*W)|0,y=(R()*H)|0;if(o.path!=null&&y>=o.path*16-1&&y<o.path*16+17)continue;c.fillStyle=LG.g3;c.fillRect(x,y,1,2);c.fillRect(x+2,y+1,1,1);c.fillStyle=LG.g0;c.fillRect(x,y+2,3,1);}
  for(let i=0;i<W*H/2600;i++){const x=(R()*W)|0,y=(R()*H)|0;if(o.path!=null&&y>=o.path*16-2&&y<o.path*16+18)continue;c.fillStyle=R()<.5?'#f6eedb':'#f4d35e';c.fillRect(x,y,1,1);c.fillStyle=LG.g4;c.fillRect(x-1,y,1,1);c.fillRect(x+1,y,1,1);}
  return cv;}
const MATF={cloth:[180,60,'triangle'],metal:[620,90,'square'],coin:[1320,70,'square'],glass:[980,110,'sine'],stone:[140,80,'square']};
function landSnd(m='cloth',vol=.04){const f=MATF[m]||MATF.cloth;AUD.blip(f[0]*(1+(Math.random()-.5)*.08),f[1],vol,f[2]);if(m==='metal'||m==='coin')AUD.blip(f[0]*1.5,f[1]*.6,vol*.5,'sine');}
function coinSnd(semi=0,vol=.035){AUD.blip(1320*Math.pow(2,semi/12),60,vol,'square');AUD.blip(1980*Math.pow(2,semi/12),45,vol*.5,'sine');}
function stingSnd(tier,vol=.05){const N=[[],[],[660,880],[660,880,1100],[523,659,784,1047]][tier]||[];N.forEach((f,i)=>setTimeout(()=>AUD.blip(f,tier===4?260:180,vol,'triangle'),i*90));}
function failSnd(vol=.04){AUD.blip(180,90,vol,'square');setTimeout(()=>AUD.blip(140,120,vol,'square'),80);}
const MAT_OF={coin1:'coin',coin3:'coin',pile:'coin',potion:'glass',gem:'glass',ring:'metal',sword:'metal',axe:'metal',helmet:'metal',shield:'metal',star:'glass',rune:'stone',scroll:'cloth',bone:'stone',meat:'cloth',boots:'cloth'};

// solveLabels(cands, o) label declutter (D3): cands sorted by priority, each {x, y (label bottom), w, h, ...}; tries the natural
//   spot, a sideways push by the other label's width (o.push), then up to o.steps (7) steps of 10 px up, else hides it.
//   o.grid (default true) checks overlaps only in 32 x 16 px cells; o.W keeps labels inside a canvas of that width (and below y = 1). Returns {placed:[{x,y,w,h,cd}], hidden:[cd], checks}
function solveLabels(cands,o={}){const steps=o.steps==null?7:o.steps,grid=o.grid!==false,CW=32,CH=16,cells=new Map(),placed=[],hidden=[];let checks=0;
  const key=(i,j)=>i*4096+j;const hit=r=>{if(!grid){for(const p of placed){checks++;if(r.x<p.x+p.w+1&&r.x+r.w+1>p.x&&r.y<p.y+p.h+1&&r.y+r.h+1>p.y)return p;}return null;}
    const i0=Math.floor(r.x/CW),i1=Math.floor((r.x+r.w)/CW),j0=Math.floor(r.y/CH),j1=Math.floor((r.y+r.h)/CH);for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const L=cells.get(key(i,j));if(!L)continue;for(const p of L){checks++;if(r.x<p.x+p.w+1&&r.x+r.w+1>p.x&&r.y<p.y+p.h+1&&r.y+r.h+1>p.y)return p;}}return null;};
  const add=r=>{placed.push(r);if(!grid)return;const i0=Math.floor(r.x/CW),i1=Math.floor((r.x+r.w)/CW),j0=Math.floor(r.y/CH),j1=Math.floor((r.y+r.h)/CH);for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=key(i,j);let L=cells.get(k);if(!L)cells.set(k,L=[]);L.push(r);}};
  for(const cd of cands){let r={x:cd.x-(cd.w>>1),y:cd.y-cd.h,w:cd.w,h:cd.h,cd},ok=false;
    const out=q=>o.W&&(q.x<1||q.y<1||q.x+q.w>o.W-1);
    for(let s=0;s<=steps&&!ok;s++){const base={...r,y:cd.y-cd.h-s*10};if(base.y<1&&o.W)break;if(out(base)){base.x=clamp(base.x,1,o.W-1-base.w);}let p=hit(base);if(!p){r=base;ok=true;break;}
      const side={...base,x:p.x+p.w+2};if(o.push!==false&&!out(side)&&!hit(side)&&Math.abs(side.x+side.w/2-cd.x)<cd.w){r=side;ok=true;break;}}
    if(ok)add(r);else hidden.push(cd);}
  return {placed,hidden,checks};}

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
    const pe=st.parentElement,ps=getComputedStyle(pe),avail=pe.clientWidth-parseFloat(ps.paddingLeft)-parseFloat(ps.paddingRight)-2;if(!(avail>0))continue;/* content box minus the stage border */const k=Math.min(Math.floor(avail*dpr/cv.width),Math.max(1,Math.floor(800*dpr/cv.width)));
    if(k>=1){cv.style.width=(k*cv.width/dpr)+'px';st.classList.add('fit');}else{cv.style.width='';st.classList.remove('fit');}}}
let crispT=0;addEventListener('resize',()=>{clearTimeout(crispT);crispT=setTimeout(crispAll,80);});
document.addEventListener('DOMContentLoaded',()=>{chrome();crispAll();$$('[data-demo]').forEach(el=>io.observe(el));});
