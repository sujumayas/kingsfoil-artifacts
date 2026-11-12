// ======================================================================
// demos2: trampling and wear, cut / regrow / hide, flying life, fireflies,
// ground critters, seeds and spawning (families D to G).
// Local helpers carry the g2 prefix so they never clash with core.js or the
// other demos files. Uses only generic core.js helpers ($, $$, clamp, lerp,
// smooth, bay, U, un32, mix32, PX, pointer, ctl, setHud, svgEl, reg, motion).
// Pixel rule used everywhere here: simulate in floats, round to whole world
// pixels at draw time, dither by world (x, y), colours from one palette.
// ======================================================================
const g2H=(a,b,c)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1)^Math.imul(c|0,0x9e3779b1);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return (h>>>0)/4294967296;};
const g2R=seed=>{let s=seed|0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
const g2N=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=g2H(xi,yi,7),b=g2H(xi+1,yi,7),c=g2H(xi,yi+1,7),d=g2H(xi+1,yi+1,7);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
// page palette, original picks. Grass ramp runs cool-dark to warm-light.
const G2HEX={ink:'#14161e',
  g0:'#1b3326',g1:'#264c2e',g2:'#356639',g3:'#4b8443',g4:'#71a24f',g5:'#a6c463',
  d0:'#3a2a20',d1:'#584030',d2:'#7a5b3f',d3:'#9e7f58',d4:'#c2a676',
  s0:'#76683a',s1:'#a2904c',s2:'#ccb86a',
  b0:'#1c1918',b1:'#332c29',b2:'#5a524c',em:'#e0703c',
  w0:'#16304a',w1:'#20486a',w2:'#316c90',w3:'#78b4c8',
  fr:'#d4524a',fp:'#e48aac',fy:'#f0d058',fw:'#f2eee0',fv:'#9878cc',
  sk:'#e4ae86',hr:'#4a2e20',tu:'#3a6eae',tu2:'#284e88',pa:'#383246',tr:'#b8483e',tr2:'#7e2e2c',tp:'#4e9a4e',tp2:'#2e6a3a',
  wo:'#ece6d6',wo2:'#bfb6a2',
  rb:'#9c7a5a',rb2:'#6c523e',rbw:'#e6dac8',fg:'#62a64a',fg2:'#3a6e32',ck:'#8a9a3a',ck2:'#55602a',
  gold:'#e8c45a',gold2:'#a8803a',ice:'#8fd0e0',red:'#e0584a',
  n0:'#090d16',n1:'#101826',ng0:'#0c1a18',ng1:'#132a24',ng2:'#1c3a30',ng3:'#284c3c',
  ff0:'#fffbd6',ff1:'#e2ee78',ff2:'#92b244',ff3:'#4c6a32',
  lamp:'#ffe08a',lamp2:'#fff6d6',lg1:'#7a6a3c',lg2:'#4a4434',iron:'#2a2a33',iron2:'#4a4a56',
  bee:'#f0c040',bee2:'#2a2018',wing:'#dcecf0',df:'#3ec0b4',df2:'#1e7a80',moth:'#d8ccb2',moth2:'#9a8a70',
  bf1:'#f4dc58',bf2:'#f2eee0',bf3:'#f09446',bfk:'#2a2018',bush:'#1a4034',bush2:'#2c6a4a',bush3:'#58a462',n2:'#1a2638',reed:'#6a7e3a',reed2:'#4a5a2a',cat:'#6a4228'};
const G2={};for(const k in G2HEX)G2[k]=U(G2HEX[k]);
const G2SET=new Set(Object.values(G2));
const g2off=u=>{let n=0;for(const c of new Set(u))if(!G2SET.has(c))n++;return n;};
const g2tm=()=>({v:0,add(ms){this.v=this.v?this.v*.92+ms*.08:ms;return this.v;}});
const g2ms=v=>v<.0001?'<0.0001':v>=10?v.toFixed(1):v>=1?v.toFixed(2):v>=.1?v.toFixed(3):v.toFixed(4);
const g2clr=svg=>{while(svg.firstChild)svg.removeChild(svg.firstChild);};
// put one pixel / a rectangle, clipped
const g2p=(u,W,H,x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=c;};
function g2rect(u,W,H,x,y,w,h,c){x=Math.round(x);y=Math.round(y);for(let j=Math.max(0,y);j<Math.min(H,y+h);j++)for(let i=Math.max(0,x);i<Math.min(W,x+w);i++)u[j*W+i]=c;}
// letter sprite, bottom centre at (x, y); map letter -> colour
function g2spr(u,W,H,rows,map,x,y,flip=false){const h=rows.length,w=rows[0].length,x0=Math.round(x-(w-1)/2),y0=Math.round(y)-h+1;
  for(let j=0;j<h;j++){const yy=y0+j;if(yy<0||yy>=H)continue;const r=rows[j];for(let i=0;i<w;i++){const ch=r[flip?w-1-i:i];if(ch==='.')continue;const v=map[ch];if(v===undefined)continue;const xx=x0+i;if(xx>=0&&xx<W)u[yy*W+xx]=v;}}}
// dithered disc (world-locked) for glows and soft marks: coverage a at the centre fading to 0 at r
function g2disc(u,W,H,cx,cy,r,c,a=1,sq=1){cx=Math.round(cx);cy=Math.round(cy);const R=Math.ceil(r);for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const d=Math.hypot(i,j/sq)/r;if(d>1)continue;const x=cx+i,y=cy+j;if(x<0||y<0||x>=W||y>=H)continue;if(a*(1-d)*16>bay(x,y)+.5)u[y*W+x]=c;}}
// dotted ring (squashed for 3/4 view)
function g2ring(u,W,H,cx,cy,r,c,sq=.6,dot=2){const n=Math.max(12,Math.ceil(r*6));let k=0;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r*sq);if((k++%dot)===0)g2p(u,W,H,x,y,c);}}
// meadow ground: two noise scales quantised to a 4-step ramp with an ordered-dither edge, plus hashed specks
function g2ground(W,H,seed,cols=[G2.g1,G2.g2,G2.g2,G2.g3],sc=1){const a=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=g2N(x/(15*sc)+seed*7.1,y/(10*sc)+seed*3.3)*.7+g2N(x/5+seed,y/4)*.3;let i=n*3.4-.3+(bay(x,y)/16-.5)*.45;i=clamp(i|0,0,3);
    const q=g2H(x,y,seed);let c=cols[i];if(q<.035)c=cols[Math.min(3,i+1)];else if(q<.06)c=cols[Math.max(0,i-1)];a[y*W+x]=c;}return a;}
// one grass tuft rooted at (x, y): 3 or 4 blades, h px tall, the tip leaning `lean` px (rounded per row, so the shear is whole pixels)
const G2TUFT=[G2.g2,G2.g3,G2.g4,G2.g5];
function g2tuft(u,W,H,x,y,h,lean,pal=G2TUFT,var_=0){if(h<1){g2p(u,W,H,x,y,pal[1]);return;}const B=[[-1,-1,h-1],[0,0,h],[1,1,h-2],[2,1,h-3]],nb=var_&1?4:3;
  for(let b=0;b<nb;b++){const [dx,fan,bh]=B[b];if(bh<1)continue;for(let j=0;j<bh;j++){const t=(j+1)/bh,ox=Math.round(lean*t*t+fan*t*.9);
      const c=j===bh-1?pal[3-(b===2?1:0)]:t>.6?pal[2]:t>.25?pal[1]:pal[0];g2p(u,W,H,x+dx+ox,y-j,c);}}}
// walker (7x12, side view facing right; front view for idle). Original sprite.
const G2BODY=["..hhh..",".hhhhs.",".hhsse.",".hssss.","..ss...",".cccc..","ccCccc.","cCccss.",".cccc.."];
const G2LEGS=[[".l..l..",".l..l..","bb..bb."],[".ll....","..l....","..bb..."],[".l...l.","l.....l","b.....b"]];
const G2FRONT=["..hhh..",".hhhhh.",".hsssh.",".seses.",".sssss.","scccccs","cccCccc",".ccCcc.",".ccccc.",".l...l.",".l...l.",".b...b."];
const g2MW={h:G2.hr,s:G2.sk,e:G2.ink,c:G2.tu,C:G2.tu2,l:G2.pa,b:G2.ink};
const g2Mred={...g2MW,c:G2.tr,C:G2.tr2},g2Mgrn={...g2MW,c:G2.tp,C:G2.tp2,h:G2.d1};
function g2walker(u,W,H,x,y,o={}){const m=o.map||g2MW;if(o.front){g2spr(u,W,H,G2FRONT,m,x,y);return;}const fr=o.moving?[0,1,0,2][(o.anim|0)&3]:0;g2spr(u,W,H,G2BODY.concat(G2LEGS[fr]),m,x,y,o.left);}
// sheep (9x6) and a 1 px ground shadow helper
const G2SHEEP=[".wwwww...","wwWwwwwkk","wwwwwwwke","wWwwwWw..",".k.k.k.k."],g2MSH={w:G2.wo,W:G2.wo2,k:G2.ink,e:G2.ink};
const G2SHEEP2=[".wwwww...","wwWwwwwkk","wwwwwwwke","wWwwwWw..","k..k.k..k"];
function g2sheep(u,W,H,x,y,left,anim){g2spr(u,W,H,(anim|0)&1?G2SHEEP2:G2SHEEP,g2MSH,x,y,left);}
function g2shadow(u,W,H,x,y,w,shade){x=Math.round(x);y=Math.round(y);for(let i=-(w>>1);i<=(w>>1);i++){const xx=x+i;if(xx>=0&&xx<W&&y>=0&&y<H)u[y*W+xx]=shade(u[y*W+xx]);}}
// one palette step darker, for shadows on the meadow (the artist's ramp, never a multiply)
const g2DK=(()=>{const m=new Map(),pairs=[['g5','g4'],['g4','g3'],['g3','g2'],['g2','g1'],['g1','g0'],['g0','ink'],['d4','d3'],['d3','d2'],['d2','d1'],['d1','d0'],['d0','ink'],['s2','s1'],['s1','s0'],['s0','d1'],['w3','w2'],['w2','w1'],['w1','w0'],['w0','ink'],
  ['ng3','ng2'],['ng2','ng1'],['ng1','ng0'],['ng0','n0'],['b2','b1'],['b1','b0'],['b0','ink'],['fy','s1'],['fw','wo2'],['fr','tr2'],['fp','fr'],['fv','pa']];for(const [a,b] of pairs)m.set(G2[a],G2[b]);return c=>m.get(c)??c;})();
// flowers: 3x3 heads on a 1-3 px stem, bottom at (x, y)
const G2FLOWER=[".p.","pcp",".p."],G2BUD=[".p.","ppp"];
function g2flower(u,W,H,x,y,col,stem=2,open=1){for(let j=1;j<=stem;j++)g2p(u,W,H,x,y-j+1,G2.g3);g2spr(u,W,H,open?G2FLOWER:G2BUD,{p:col,c:G2.fy},x,y-stem);}
// the halo atlas used by the fireflies and halos figures: 4 frames, palette steps only, normal alpha
// f0 bright core, plus one step down, diagonals and a 50% dithered diamond two steps down; later frames fade by one step
const G2HALO=[[[0,0,0],[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,2],[-1,1,2],[1,-1,2],[-1,-1,2],[2,0,3],[-2,0,3],[0,2,3],[0,-2,3]],
  [[0,0,0],[1,0,2],[-1,0,2],[0,1,2],[0,-1,2],[1,1,3],[-1,-1,3]],[[0,0,1],[1,0,3],[-1,0,3],[0,1,3],[0,-1,3]],[[0,0,2],[1,0,3],[-1,0,3]]];
const G2FF=[G2.ff0,G2.ff1,G2.ff2,G2.ff3];
// light levels never darken: a halo pixel is drawn only if its step is brighter than what is there
function g2halo(u,W,H,x,y,fr){x=Math.round(x);y=Math.round(y);const F=G2HALO[clamp(fr,0,3)];for(const [dx,dy,s] of F){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;if(s===3&&((xx+yy)&1))continue;
  const cur=u[yy*W+xx],k=G2FF.indexOf(cur);if(k>=0&&k<=s)continue;u[yy*W+xx]=G2FF[s];}}
// night meadow ground and silhouettes
function g2night(W,H,seed){const g=g2ground(W,H,seed,[G2.ng0,G2.ng1,G2.ng1,G2.ng2]);return g;}

// shared mover: walk entity e toward (tx, ty) at sp px/s; returns true on arrival
function g2move(e,tx,ty,sp,dt){const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);if(d<.8){e.vx=e.vy=0;e.moving=false;return true;}const s=Math.min(d,sp*dt);e.vx=dx/d*sp;e.vy=dy/d*sp;e.x+=dx/d*s;e.y+=dy/d*s;e.moving=true;e.anim=(e.anim||0)+dt*8;if(Math.abs(dx)>.3)e.left=dx<0;return false;}

// ======================================================================
// D1: Terraria WindGrid, a timestamp and direction per visible tile
// ======================================================================
reg('windgrid',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const TS=8,TW=W/TS,TH=H/TS,NT=TW*TH,Time=new Float64Array(NT).fill(-1e9),DX=new Int8Array(NT),DY=new Int8Array(NT),LEAN=new Float32Array(NT),DH=new Uint8Array(NT);
  const bg=g2ground(W,H,3,[G2.g1,G2.g1,G2.g2,G2.g2]),tufts=[];
  for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)for(let k=0;k<1;k++)tufts.push({x:tx*TS+1+((g2H(tx,ty,k*3+1)*6)|0),y:ty*TS+3+((g2H(tx,ty,k*3+2)*5)|0),t:ty*TW+tx,h:5+((g2H(tx,ty,k+9)*3)|0),v:(g2H(tx,ty,k+5)*4)|0});
  tufts.sort((a,b)=>a.y-b.y);
  const P={x:30,y:50,left:false,anim:0,moving:false,kind:0},S={x:150,y:74,left:true,anim:0,moving:false,wait:1,tx:150,ty:74,kind:1};
  let now=0,tgt=null,idle=9,fr=0,stamped=0,active=0;const tm=g2tm();
  pointer(cv,(p,k)=>{if(k==='down'||k==='drag'){tgt=[clamp(p[0],4,W-4),clamp(p[1],12,H-2)];idle=0;}});
  const auto=t=>[96+Math.sin(t*.42)*76,54+Math.sin(t*.84)*28];
  function stamp(e){const x0=Math.floor((e.x-3)/TS),x1=Math.floor((e.x+3)/TS),y0=Math.floor((e.y-5)/TS),y1=Math.floor(e.y/TS),sx=Math.abs(e.vx)>2?Math.sign(e.vx):0,sy=Math.abs(e.vy)>2?Math.sign(e.vy):0;
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tx<0||ty<0||tx>=TW||ty>=TH)continue;const i=ty*TW+tx;Time[i]=now;DX[i]=sx;DY[i]=sy;stamped++;}}
  function drawEnt(e){g2shadow(u,W,H,e.x,e.y+1,5,g2DK);if(e.kind)g2sheep(u,W,H,e.x,e.y,e.left,e.anim*.5);else g2walker(u,W,H,e.x,e.y,e);}
  return {tick(dt){fr++;now+=dt*1000;idle+=dt;const dur=c.v('dur'),grid=c.v('grid');c.out('dur',dur+' fr · '+(dur/60).toFixed(2)+' s');
    if(tgt&&idle<4){if(g2move(P,tgt[0],tgt[1],42,dt))tgt=null;}else{const [ax,ay]=auto(now/1000);g2move(P,ax,ay,42,dt);}
    if(S.wait>0){S.wait-=dt;S.moving=false;S.vx=S.vy=0;}else if(g2move(S,S.tx,S.ty,11,dt)){S.wait=1.2+Math.random()*2.5;S.tx=clamp(S.x+(Math.random()-.5)*70,12,W-12);S.ty=clamp(S.y+(Math.random()-.5)*40,16,H-4);}
    // the technique: stamp moving walkers, then one subtraction per drawn tile gives the push
    const t0=performance.now();stamped=0;active=0;
    if(P.moving)stamp(P);if(S.moving)stamp(S);
    for(let i=0;i<NT;i++){const uu=(now-Time[i])/(1000/60)/dur;if(uu>=0&&uu<1){const off=3.5*(1-uu)*Math.min(1,uu*5);LEAN[i]=off*DX[i];DH[i]=Math.round(Math.abs(DY[i])*off*.4);active++;}else{LEAN[i]=0;DH[i]=0;}}
    tm.add(performance.now()-t0);
    u.set(bg);
    if(grid){for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const i=ty*TW+tx,uu=(now-Time[i])/(1000/60)/dur;
        for(let k=0;k<TS;k+=2){g2p(u,W,H,tx*TS+k,ty*TS,G2.g0);g2p(u,W,H,tx*TS,ty*TS+k,G2.g0);}
        if(uu>=0&&uu<1){const a=(1-uu)*.6;for(let y=ty*TS+1;y<ty*TS+TS;y++)for(let x=tx*TS+1;x<tx*TS+TS;x++)if(a*16>bay(x,y)+.5)u[y*W+x]=G2.s1;
          const cx=tx*TS+4,cy=ty*TS+4;g2p(u,W,H,cx,cy,G2.gold);g2p(u,W,H,cx+DX[i],cy+DY[i],G2.gold);g2p(u,W,H,cx+2*DX[i],cy+2*DY[i],G2.gold);}}}
    const ents=[P,S].sort((a,b)=>a.y-b.y);let ei=0;const wv=now/1000;
    for(const tf of tufts){while(ei<2&&ents[ei].y<tf.y){drawEnt(ents[ei]);ei++;}
      let lean=LEAN[tf.t];if(lean===0)lean=Math.cos(wv*1.9-tf.x*.05)>.8?1:0;
      g2tuft(u,W,H,tf.x,tf.y,tf.h-DH[tf.t],lean,G2TUFT,tf.v);}
    while(ei<2){drawEnt(ents[ei]);ei++;}
    F.put();
    if(fr%8===1){setHud(root,tgt&&idle<4?'walking to your tap':'tap or drag to walk');
      ro.innerHTML=`<b>${active}</b> tiles pushing · <b>${stamped}</b> stamps this frame (the sheep stamps nothing while it stands)<br>grid ${TW}x${TH} tiles × 12 B = <b>${(NT*12).toLocaleString('en-US')} B</b> · push peak 3.5 px, gone after <b>${dur}</b> frames<br>cost measured here (stamps + one age read per tile): <b>${g2ms(tm.v)} ms</b> · §6a measured: a comparable byte grid, 10 walkers, <b>0.0023 ms</b>`;}}};});

// ======================================================================
// D2: an 80x45 byte trail map, stamped by walkers, beside the grass it bends
// ======================================================================
reg('trailmap',root=>{const cvs=$$('canvas',root),M=PX(cvs[0]),G=PX(cvs[1]),MW=80,MH=45,W=G.W,H=G.H,u=G.u32,mu=M.u32,c=ctl(root),ro=$('[data-ro]',root);
  const R=new Uint8Array(MW*MH),D=new Int8Array(MW*MH);let acc=0,fr=0,t=0;const tm=g2tm();
  const bg=g2ground(W,H,8,[G2.g0,G2.g1,G2.g1,G2.g2]);
  const POI=[[9,9],[70,8],[40,21],[12,37],[68,37],[40,40]];
  const WK=[];for(let i=0;i<10;i++){const p=POI[i%POI.length];WK.push({x:p[0]+i%3,y:p[1],tx:p[0],ty:p[1],wait:Math.random()*2,sp:5+Math.random()*2,sheep:i%5===4,anim:0,left:false,moving:false,vx:0,vy:0});}
  const pick=w=>{const p=POI[(Math.random()*POI.length)|0];w.tx=clamp(p[0]+(Math.random()-.5)*8,2,MW-3);w.ty=clamp(p[1]+(Math.random()-.5)*5,3,MH-2);};
  const GREY=new Uint32Array(256);for(let v=0;v<256;v++){const g=18+v*.82;GREY[v]=pack(g,g,g*1.04);}
  const PF=U('#e8c45a'),PH=U('#5a8ea0');
  return {tick(dt){fr++;t+=dt;const n=c.v('n'),dec=c.v('dec'),mode=c.segv('view');c.out('n',n);c.out('dec',dec+' s');
    let mov=0,stand=0;
    for(let i=0;i<n;i++){const w=WK[i];if(w.wait>0){w.wait-=dt;w.moving=false;w.vx=w.vy=0;stand++;continue;}
      if(g2move(w,w.tx,w.ty,w.sheep?2:w.sp,dt)){w.wait=w.sheep?2+Math.random()*3:.4+Math.random()*2.2;pick(w);}else mov++;}
    // decay before stamp: every cell loses 255 over `dec` seconds, then moving walkers stamp 255
    const t0=performance.now();
    acc+=255*dt/dec;const k=acc|0;acc-=k;if(k)for(let i=0;i<R.length;i++)R[i]=R[i]>k?R[i]-k:0;
    for(let i=0;i<n;i++){const w=WK[i];if(!w.moving)continue;const sx=w.vx>.5?1:w.vx<-.5?-1:0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(dx*dx+dy*dy>1+(w.sheep?1:0))continue;const x=Math.round(w.x)+dx,y=Math.round(w.y)+dy;if(x<0||y<0||x>=MW||y>=MH)continue;R[y*MW+x]=255;D[y*MW+x]=sx;}}
    tm.add(performance.now()-t0);
    // the byte map itself
    for(let i=0;i<R.length;i++){const v=R[i];mu[i]=mode==='pose'?(v>170?PF:v>60?PH:GREY[v>>2]):GREY[v];}
    for(let i=0;i<n;i++){const w=WK[i];g2p(mu,MW,MH,w.x,w.y,w.moving?G2.fw:G2.red);}
    M.put();
    // the grass: three poses read from the map, flat > 170, half up > 60, upright below
    u.set(bg);const order=WK.slice(0,n).sort((a,b)=>a.y-b.y);let oi=0;
    for(let cy=0;cy<MH;cy++){for(let cx=0;cx<MW;cx++){const i=cy*MW+cx,v=R[i],h=g2H(cx,cy,4),x=cx*2+(h<.5?0:1),y=cy*2+1,dir=D[i]||(h<.5?-1:1);
        if(v>170){g2p(u,W,H,x,y,G2.g5);g2p(u,W,H,x+dir,y,h<.3?G2.s2:G2.g5);}
        else if(v>60){g2p(u,W,H,x,y,G2.g3);g2p(u,W,H,x+dir,y-1,G2.g4);}
        else if(h<.55){const ln=Math.cos(t*1.6-cx*.22+h*5)>.82?1:0;g2p(u,W,H,x,y,G2.g2);g2p(u,W,H,x,y-1,G2.g3);g2p(u,W,H,x+ln,y-2,h<.12?G2.g5:G2.g4);}}
      while(oi<order.length&&order[oi].y<cy+1){const w=order[oi++],X=w.x*2,Y=w.y*2+1;g2shadow(u,W,H,X,Y+1,5,g2DK);if(w.sheep)g2sheep(u,W,H,X,Y,w.left,w.anim*.4);else g2walker(u,W,H,X,Y,w);}}
    while(oi<order.length){const w=order[oi++],X=w.x*2,Y=w.y*2+1;if(w.sheep)g2sheep(u,W,H,X,Y,w.left,w.anim*.4);else g2walker(u,W,H,X,Y,w);}
    G.put();
    if(fr%8===1){setHud(root,mode==='pose'?'gold flat · blue half up':'one byte per cell','a');
      ro.innerHTML=`<b>${mov}</b> of ${n} walkers stamping · <b>${stand}</b> standing, which stamp nothing · decay to 0 in <b>${dec} s</b><br>cost measured here (decay + stamps, 80x45 bytes): <b>${g2ms(tm.v)} ms</b><br>§6a measured: 80x45 with 10 walkers <b>0.0023 ms</b> (0.014 throttled) · GPU ping-pong <b>0.008 ms</b> · 256x256 R8 upload <b>0.016 ms</b>`;}}};});

// ======================================================================
// D3: Jahrmann and Wimmer crush and recovery, side view plus a plot
// ======================================================================
reg('crush',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root);
  const GY=46,REST=14,XS=[14,30,46,62,78,94,110],T=XS.map((x,i)=>({x,h:REST,eta:0,lean:1,last:-99,rec90:null}));
  const bg=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let col;if(y>GY+1){col=y>GY+4?((x+y)&3?G2.d1:G2.d0):G2.d2;if(g2H(x,y,2)<.08)col=G2.d3;}
    else{const k=y/GY;col=k<.35?G2.g0:(k-.35)/.2*16>bay(x,y)+.5&&k<.55?G2.g1:k<.55?G2.g0:G2.g1;if(y===GY+1)col=G2.g2;}bg[y*W+x]=col;}
  const Wk={x:-10,y:GY+1,left:false,anim:0,moving:true,on:true};let t=0,fr=0,next=1.2;const HIS=[],NH=300;
  const ax=svgEl('g',{},svg);
  c.btn('step',()=>{Wk.x=-8;Wk.on=true;});
  function blade(x0,h,lean,col3,len){const n=Math.ceil(len*1.6);let px=-99,py=-99;for(let s=1;s<=n;s++){const q=s/n,x=x0+lean*q*q,y=GY-h*(2*q-q*q)*.5-h*q*q*.5;const X=Math.round(x),Y=Math.round(y);if(X===px&&Y===py)continue;px=X;py=Y;g2p(u,W,H,X,Y,q>.85?col3[2]:q>.4?col3[1]:col3[0]);}}
  return {tick(dt){fr++;t+=dt;const a=c.v('a'),s=c.v('s'),e0=c.v('e0'),floor=c.v('floor'),auto=c.v('auto');c.out('a',a.toFixed(2)+' /s');c.out('s',s.toFixed(1)+' /s');c.out('e0',e0.toFixed(2));const kq=e0/(((REST-2)/REST)**2);
    if(auto&&!Wk.on){next-=dt;if(next<=0){Wk.x=-8;Wk.on=true;}}
    if(Wk.on){Wk.x+=24*dt;Wk.anim+=dt*8;if(Wk.x>W+10){Wk.on=false;next=6;}}
    for(const b of T){// collision displacement d, not scaled by dt (eq. 1); crush adds the squared push (eq. 2)
      if(Wk.on&&Math.abs(Wk.x-b.x)<4&&b.h>2){const d=2-b.h;b.h+=d;b.eta+=kq*(d/REST)*(d/REST);b.lean=1;b.last=t;b.rec90=null;}
      b.eta=Math.max(b.eta-a*dt,0);
      const r=(REST-b.h)*s*Math.max(1-b.eta,floor?.1:0);b.h=Math.min(REST,b.h+r*dt);
      if(b.rec90===null&&b.last>0&&b.h>=REST*.9)b.rec90=t-b.last;}
    u.set(bg);
    if(Wk.on){g2shadow(u,W,H,Wk.x,GY+2,5,g2DK);g2walker(u,W,H,Wk.x,GY+1,Wk);}
    const wind=Math.sin(t*2.3);
    for(const b of T){const L=REST,lean=Math.sqrt(Math.max(0,L*L-b.h*b.h))*b.lean+wind*1.2*(1-b.eta);
      blade(b.x-2,b.h*.85,lean-1,[G2.g2,G2.g3,G2.g4],L*.85);blade(b.x+2,b.h*.8,lean+1,[G2.g2,G2.g3,G2.g4],L*.8);blade(b.x,b.h,lean,[G2.g3,G2.g4,G2.g5],L);blade(b.x+1,b.h*.9,lean*.9,[G2.g2,G2.g3,G2.g5],L*.9);}
    const B=T[3];g2p(u,W,H,B.x,GY+3,G2.gold);g2p(u,W,H,B.x-1,GY+4,G2.gold);g2p(u,W,H,B.x+1,GY+4,G2.gold);
    F.put();
    if(fr%2===0){HIS.push([B.h/REST,B.eta,Math.max(1-B.eta,floor?.1:0)]);if(HIS.length>NH)HIS.shift();}
    if(fr%4===0){g2clr(ax);const X0=34,X1=312,Y0=10,Y1=104,sx=(X1-X0)/NH,sy=v=>Y1-v/1.2*(Y1-Y0);
      for(const v of [0,.5,1])svgEl('line',{x1:X0,x2:X1,y1:sy(v),y2:sy(v),class:v?'gl':'ax'},ax);
      svgText(ax,X0-6,sy(1)+4,'1',{'text-anchor':'end'});svgText(ax,X0-6,sy(0)+4,'0',{'text-anchor':'end'});
      if(floor)svgEl('line',{x1:X0,x2:X1,y1:sy(.1),y2:sy(.1),stroke:'#6fbf7a','stroke-dasharray':'2 4','stroke-width':1},ax);
      const line=(k,col,dash)=>poly2(ax,HIS.map((h,i)=>[X0+i*sx,sy(Math.min(1.2,h[k]))]),{stroke:col,'stroke-width':2,'stroke-dasharray':dash||'none'});
      line(2,'#6fbf7a','5 3');line(1,'#e8c45a');line(0,'#8fd0e0');
      svgText(ax,X1,118,'last 10 s →',{'text-anchor':'end'});}
    if(fr%8===1){setHud(root,Wk.on?'stepping through':'recovering');
      ro.innerHTML=`gold tuft: crush η <b>${B.eta.toFixed(2)}</b> · recovery factor max(1 − η, ${floor?'0.1':'0'}) = <b>${Math.max(1-B.eta,floor?.1:0).toFixed(2)}</b> · tip <b>${B.h.toFixed(1)}</b> of ${REST} px<br>back to 90% height <b>${B.rec90===null?'…':B.rec90.toFixed(1)+' s'}</b> after the last step (measured here) · η falls ${a.toFixed(2)} per s, so a push to η = ${e0.toFixed(2)} takes <b>${(e0/a).toFixed(1)} s</b> to clear`;}}};});
function poly2(svg,pts,attrs){return svgEl('polyline',{points:pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '),fill:'none',...attrs},svg);}

// ======================================================================
// D4: the entry rustle, 4 frames + rest, a 4-leaf burst and one sound voice
// ======================================================================
reg('rustle',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const TS=16,TW=W/TS,TH=H/TS,tall=(x,y)=>x>=2&&x<=7&&y>=1&&y<=4;
  const bg=g2ground(W,H,12,[G2.g1,G2.g2,G2.g2,G2.g3]),rt=new Int16Array(TW*TH).fill(-1);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(tall((x/TS)|0,(y/TS)|0)&&g2H(x,y,3)<.6)bg[y*W+x]=G2.g0;
  const tuftsOf=(x,y)=>[0,1,2,3,4,5,6].map(k=>({x:x*TS+1+((g2H(x,y,k)*14)|0),y:y*TS+4+((g2H(x,y,k+9)*12)|0),h:8+((g2H(x,y,k+18)*5)|0),v:k}));
  const TT=[];for(let y=0;y<TH;y++)for(let x=0;x<TW;x++)if(tall(x,y))for(const q of tuftsOf(x,y))TT.push({...q,i:y*TW+x});TT.sort((a,b)=>a.y-b.y);
  const FRL=[0,-2,2,-1,1];// lean per frame: rest, then frames 1-4
  const route=[[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[8,3],[7,3],[6,3],[5,3],[4,3],[3,3],[2,3],[1,3],[1,2]];
  const hroute=[[6,1],[6,2],[5,2],[5,1],[4,1],[3,1],[3,2],[4,2],[4,3],[5,3],[5,4],[6,4],[7,4],[7,3],[7,2],[7,1]];
  const P={tx:1,ty:2,fx:1,fy:2,k:0,step:0,ri:0,left:false,anim:0,moving:false},Hd={fx:6,fy:1,tx:6,ty:1,k:0,ri:0,step:0};
  const leaves=[];let voice=0,skipped=0,fr=0,leakN=0,ticks=0,lastTile=-1,manual=0;
  const SPK=["..k...",".kk...","kkk...","kkk...",".kk...","..k..."];
  function enter(tx,ty,hidden){if(!tall(tx,ty))return;const i=ty*TW+tx;if(hidden&&!c.v('leak'))return;if(hidden)leakN++;rt[i]=0;lastTile=i;
    for(let k=0;k<4;k++)leaves.push({x:tx*TS+8,y:ty*TS+4,z:0,vx:(Math.random()*2-1)*28,vz:40+Math.random()*30,life:.6+Math.random()*.4,a:0,col:k&1?G2.g5:G2.g4});
    if(voice>0)skipped++;else voice=.35;}
  function stepper(e,rt_,hidden,dt,go){if(e.step>0){e.step-=dt*60;e.k=1-e.step/16;if(e.step<=0){e.fx=e.tx;e.fy=e.ty;e.k=0;}return;}if(!go)return;
    e.ri=(e.ri+1)%rt_.length;const [nx,ny]=rt_[e.ri];if(nx!==e.fx)e.left=nx<e.fx;e.tx=nx;e.ty=ny;e.step=16;enter(nx,ny,hidden);}
  c.btn('step',()=>{manual++;});
  return {tick(dt){fr++;const auto=c.v('auto'),show=c.v('show');
    // 60 ticks per second: each rustling tile advances one tick per tick
    const nt=Math.max(1,Math.round(dt*60));ticks+=nt;
    for(let i=0;i<rt.length;i++)if(rt[i]>=0){rt[i]+=nt;if(rt[i]>=50)rt[i]=-1;}
    const go=auto?(fr%10===0):manual>0;if(!auto&&manual>0&&P.step<=0)manual--;
    stepper(P,route,false,dt,go&&P.step<=0);stepper(Hd,hroute,true,dt,(auto?(fr%13===0):go)&&Hd.step<=0);
    P.moving=P.step>0;if(P.moving)P.anim+=dt*8;
    for(let j=leaves.length-1;j>=0;j--){const l=leaves[j];l.a+=dt;l.vz-=110*dt;l.x+=l.vx*dt+Math.sin(l.a*14)*.4;l.z=Math.max(0,l.z+l.vz*dt);if(l.a>l.life)leaves.splice(j,1);}
    if(voice>0)voice-=dt;
    u.set(bg);
    const px=lerp(P.fx,P.tx,P.k)*TS+8,py=lerp(P.fy,P.ty,P.k)*TS+TS-2;let drawn=false;
    for(const q of TT){if(!drawn&&q.y>py){g2shadow(u,W,H,px,py+1,5,g2DK);g2walker(u,W,H,px,py,P);drawn=true;}
      const f=rt[q.i]<0?0:rt[q.i]<40?1+((rt[q.i]/10)|0):0;g2tuft(u,W,H,q.x,q.y,q.h-(f?1:0),FRL[f]*(q.v&1?1:.6)+(f?0:(Math.sin(fr*.03+q.x*.2)>.85?1:0)),G2TUFT,q.v);}
    if(!drawn){g2shadow(u,W,H,px,py+1,5,g2DK);g2walker(u,W,H,px,py,P);}
    if(show){const hx=lerp(Hd.fx,Hd.tx,Hd.k)*TS+8,hy=lerp(Hd.fy,Hd.ty,Hd.k)*TS+TS-2;for(let j=0;j<12;j+=2){g2p(u,W,H,hx-3,hy-j,G2.red);g2p(u,W,H,hx+3,hy-j,G2.red);}for(let i=-3;i<=3;i+=2){g2p(u,W,H,hx+i,hy-12,G2.red);g2p(u,W,H,hx+i,hy,G2.red);}}
    for(const l of leaves){g2p(u,W,H,l.x,l.y-l.z,l.col);if(l.vz>0)g2p(u,W,H,l.x+1,l.y-l.z,l.col);}
    // the sound cue: one voice at a time
    g2rect(u,W,H,W-22,3,19,10,G2.ink);g2spr(u,W,H,SPK,{k:voice>0?G2.fw:G2.b2},W-17,11);
    if(voice>0){for(let j=-2;j<=2;j++){g2p(u,W,H,W-13,7+j,G2.gold);}for(let j=-3;j<=3;j++)if(voice>.12)g2p(u,W,H,W-10+(Math.abs(j)>2?-1:0),7+j,G2.gold);}
    F.put();
    if(fr%6===1){const r=lastTile>=0?rt[lastTile]:-1,f=r<0?0:r<40?1+((r/10)|0):0;
      setHud(root,r<0?'rest':f?`frame ${f} of 4 · tick ${r%10+1}/10`:'rest (ticks 40-50)');
      ro.innerHTML=`last rustle: <b>${r<0?'done':(r/60).toFixed(2)+' s'}</b> of 0.83 s · leaves alive <b>${leaves.length}</b> · voice <b>${voice>0?'playing':'free'}</b>, cues skipped <b>${skipped}</b><br>hidden walker steps that rustled: <b>${leakN}</b>${c.v('leak')?' · <b>its path is leaking</b>':' · none, it is not sent to this client'}<br>§6a measured: 500 pollen-like particles update in <b>0.0031 ms</b>, pixel-write draw <b>0.012 ms</b>`;}}};});

// ======================================================================
// D5: desire paths, Helbing's ground comfort or a step counter per tile
// ======================================================================
reg('desire',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const CS=4,GW=W/CS,GH=H/CS,N=GW*GH,G=new Float32Array(N),C=new Uint16Array(N),LS=new Float32Array(N),ST=new Uint8Array(N);
  const POI=[{x:7,y:7,k:'house'},{x:41,y:6,k:'tree'},{x:25,y:15,k:'well'},{x:5,y:25,k:'gate'},{x:42,y:25,k:'stall'}];
  const bg=g2ground(W,H,21,[G2.g1,G2.g2,G2.g2,G2.g3]);
  const WK=[];const rng=g2R(5);for(let i=0;i<40;i++){const p=POI[i%5];WK.push({x:p.x+rng()*2,y:p.y+1+rng(),d:(i+1+(i>>2))%5,sp:2.6+rng()*.8,anim:0,ci:-1});}
  let simT=0,fr=0,chg=0,chgRate=0,mode0='',acc=0;const tm=g2tm(),MAN=["..h..",".hsh.",".ccc.","cCcCc",".l.l."],MANm={h:G2.hr,s:G2.sk,c:G2.tu,C:G2.tu2,l:G2.pa};
  const Gat=(x,y)=>{x|=0;y|=0;return x<0||y<0||x>=GW||y>=GH?0:G[y*GW+x];};
  function sim(dt,n,T,I,mode){simT+=dt;
    for(let i=0;i<n;i++){const w=WK[i],p=POI[w.d],dx=p.x-w.x,dy=p.y+1-w.y,dd=Math.hypot(dx,dy);
      if(dd<1){let nd=w.d;while(nd===w.d)nd=(Math.random()*5)|0;w.d=nd;continue;}
      // walkers lean toward worn ground ahead of them (trail potential sampled at 3 cells)
      let hx=dx/dd,hy=dy/dd,ax=0,ay=0;const a0=Math.atan2(hy,hx);
      for(let k=-3;k<=3;k++){const a=a0+k*.32,sx=Math.cos(a),sy=Math.sin(a),g=mode==='helb'?Gat(w.x+sx*3,w.y+sy*3):Math.min(1,C[(clamp(w.y+sy*3,0,GH-1)|0)*GW+(clamp(w.x+sx*3,0,GW-1)|0)]/50);ax+=sx*g;ay+=sy*g;}
      hx+=ax*.9;hy+=ay*.9;const l=Math.hypot(hx,hy)||1;w.x+=hx/l*w.sp*dt;w.y+=hy/l*w.sp*dt;w.anim+=dt*6;w.left=hx<0;
      const ci=(clamp(w.y,0,GH-1)|0)*GW+(clamp(w.x,0,GW-1)|0);if(ci!==w.ci){w.ci=ci;// one step lands on this tile
        if(mode==='helb')G[ci]+=I*(1-G[ci]);else{C[ci]=Math.min(999,C[ci]+1);LS[ci]=simT;}}}
    // the ground relaxes back toward G0 = 0 with durability T; the counter reverts after an idle span
    for(let i=0;i<N;i++){let s;if(mode==='helb'){G[i]+=(0-G[i])/T*dt;const g=G[i];s=g<.12?0:g<.3?1:g<.55?2:3;}
      else{if(C[i]&&simT-LS[i]>30)C[i]=0;const k=C[i];s=k<20?0:k<50?2:3;}
      if(s!==ST[i]){if(Math.abs(s-ST[i])>=1)chg++;ST[i]=s;}}}
  function prewarm(){const n=c.v('n'),T=c.v('T'),I=c.v('I'),mode=c.segv('mode');for(let k=0;k<700;k++)sim(.1,n,T,I,mode);chg=0;}
  c.seg('mode',()=>{G.fill(0);C.fill(0);ST.fill(0);prewarm();});c.btn('reset',()=>{G.fill(0);C.fill(0);ST.fill(0);});
  prewarm();
  function drawPOI(p){const x=p.x*CS+2,y=p.y*CS+3;
    if(p.k==='house'){g2rect(u,W,H,x-9,y-9,18,9,G2.wo);g2rect(u,W,H,x+5,y-9,4,9,G2.wo2);for(let r=0;r<6;r++)g2rect(u,W,H,x-11+r,y-10-r,22-2*r,1,r===0?G2.tr2:r<5?G2.tr:G2.fr);g2rect(u,W,H,x-1,y-5,3,5,G2.d0);g2rect(u,W,H,x-7,y-7,3,2,G2.lamp);}
    else if(p.k==='tree'){g2rect(u,W,H,x,y-4,2,4,G2.d0);g2disc(u,W,H,x+1,y-9,6.5,G2.bush,4);g2disc(u,W,H,x,y-10,5,G2.bush2,4);g2disc(u,W,H,x-1,y-11,3,G2.bush3,4);}
    else if(p.k==='well'){g2rect(u,W,H,x-4,y-4,9,4,G2.b2);g2rect(u,W,H,x-3,y-5,7,2,G2.w1);g2rect(u,W,H,x-4,y-11,1,7,G2.d1);g2rect(u,W,H,x+4,y-11,1,7,G2.d1);g2rect(u,W,H,x-5,y-12,11,2,G2.tr2);}
    else if(p.k==='gate'){for(let i=-6;i<=6;i+=4)g2rect(u,W,H,x+i,y-7,1,7,G2.d1);g2rect(u,W,H,x-6,y-5,13,1,G2.d2);g2rect(u,W,H,x-6,y-2,13,1,G2.d2);}
    else{g2rect(u,W,H,x-6,y-4,13,4,G2.d1);for(let i=0;i<13;i++)g2rect(u,W,H,x-6+i,y-9,1,3,(i>>1)&1?G2.fw:G2.fr);g2rect(u,W,H,x-6,y-6,1,2,G2.d0);g2rect(u,W,H,x+6,y-6,1,2,G2.d0);g2p(u,W,H,x-2,y-5,G2.fy);g2p(u,W,H,x+1,y-5,G2.fr);}}
  return {tick(dt){fr++;const n=c.v('n'),T=c.v('T'),I=c.v('I'),mode=c.segv('mode');c.out('n',n);c.out('T',T+' s');c.out('I',I.toFixed(2));
    const t0=performance.now();chg=0;sim(Math.min(dt,.05)*2,n,T,I,mode);tm.add(performance.now()-t0);chgRate=chgRate*.97+chg/(dt||.016)*.03;
    // draw: stage per pixel, sampled with a hashed 1 px jitter so cell edges come out ragged, not square
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=g2H(x,y,9),jx=j<.2?-1:j>.8?1:0,jy=j>.4&&j<.55?-1:0,cx=clamp(((x+jx)/CS)|0,0,GW-1),cy=clamp(((y+jy)/CS)|0,0,GH-1),s=ST[cy*GW+cx],q=g2H(x,y,3);let col;
      if(s===0||s===1)col=bg[y*W+x];else if(s===2)col=q<.15?G2.d1:q>.9?G2.d3:G2.d2;else col=q<.12?G2.d2:q>.93?G2.d4:G2.d3;
      if(s===1&&q<.25)col=q<.08?G2.s1:G2.g3;u[y*W+x]=col;}
    for(let cy=0;cy<GH;cy++)for(let cx=0;cx<GW;cx++){if(ST[cy*GW+cx]!==0)continue;const h=g2H(cx,cy,1);g2tuft(u,W,H,cx*CS+1+((h*2)|0),cy*CS+3,3+(h>.6?1:0),Math.cos(simT*.9-cx*.3)>.8?1:0,G2TUFT,(h*8)|0);}
    const ents=POI.map(p=>({y:p.y*CS+3,p})).concat(WK.slice(0,n).map(w=>({y:w.y*CS,w})));ents.sort((a,b)=>a.y-b.y);
    for(const e of ents){if(e.p)drawPOI(e.p);else{const w=e.w;g2spr(u,W,H,MAN,MANm,w.x*CS,w.y*CS,w.left);}}
    F.put();
    if(fr%10===1){const k=T*I/9;setHud(root,mode==='helb'?'dG/dt = (G0 − G)/T + I(1 − G/Gmax)·steps':'20 steps → dirt · 50 → path');
      ro.innerHTML=`${mode==='helb'?`κ = I·T/σ² = <b>${k.toFixed(2)}</b> with σ = 3 cells here: higher κ gives more direct paths, lower gives a shared network`:`step counter: dirt at 20, path at 50, back to grass after <b>30 s</b> idle here (72 h in the mod)`}<br>stage changes <b>${chgRate.toFixed(1)}</b>/s × 9 B = <b>${Math.round(chgRate*9)} B/s</b> if the server sent each one<br>cost measured here (walkers + full scan of ${GW}x${GH}): <b>${g2ms(tm.v)} ms</b> · §6a measured: a 256x256 full scan <b>0.055 ms</b>`;}}};});

// ======================================================================
// E1: random ticks and spread vs a full-scan automaton
// ======================================================================
reg('randomtick',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,c=ctl(root),ro=$('[data-ro]',root);
  let N=96,SA,SB,TA,TB,bare0=0,ticks=0,acc=0,fr=0,picked=[];const tmA=g2tm(),tmB=g2tm(),gA=g2ground(W,H,31),rng=g2R(77);
  const bareShape=(nx,ny)=>Math.abs(ny-(.6+Math.sin(nx*7.5)*.1))<.075||Math.hypot(nx-.3,(ny-.27)*1.1)<.17||(nx>.6&&nx<.88&&ny>.12&&ny<.34);
  function reset(){N=+c.segv('n');SA=new Uint8Array(N*N);SB=new Uint8Array(N*N);TA=new Float32Array(N*N).fill(-1);TB=new Float32Array(N*N).fill(-1);bare0=0;ticks=0;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=bareShape(x/N,y/N)?0:3;SA[y*N+x]=SB[y*N+x]=v;if(!v)bare0++;}}
  // one rule for both: full grass tries 4 spots in its 3x3 and seeds bare ones at 50%; young grass climbs a stage at 65%
  function rule(S,T,i){const s=S[i];if(s===3){const x=i%N,y=(i/N)|0;for(let k=0;k<4;k++){const nx=x+((rng()*3)|0)-1,ny=y+((rng()*3)|0)-1;if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;if(S[j]===0&&rng()<.5)S[j]=1;}}
    else if(s>0&&rng()<.65){S[i]=s+1;if(s+1===3)T[i]=ticks;}}
  function draw(P,S,marks){const u=P.u32,k=N/W;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=S[((y*k)|0)*N+((x*k)|0)],q=g2H(x,y,5);let col;
      if(s===3)col=gA[y*W+x];else if(s===2)col=q<.5?G2.g2:G2.g3;else if(s===1)col=(x+y)&1?G2.d2:(q<.5?G2.g3:G2.g2);else col=q<.18?G2.d1:q>.9?G2.d3:G2.d2;u[y*W+x]=col;}
    if(marks)for(const i of marks){const x=((i%N)/k)|0,y=(((i/N)|0)/k)|0;u[y*W+x]=G2.gold;}P.put();}
  const meanT=T=>{let s=0,n=0;for(let i=0;i<T.length;i++)if(T[i]>=0){s+=T[i];n++;}return [n?s/n:0,n];};
  c.seg('n',reset);c.btn('reset',reset);reset();
  return {tick(dt){fr++;const pps=Math.round(Math.pow(2,c.v('p'))),tot=Math.max(1,Math.round(pps*N*N/256)),pr=pps/256;c.out('p',pps+' / section');
    acc+=dt*20;let did=false;
    while(acc>=1){acc-=1;ticks++;did=true;
      let t0=performance.now();picked=[];for(let p=0;p<tot;p++){const i=(rng()*N*N)|0;rule(SA,TA,i);if(picked.length<400)picked.push(i);}tmA.add(performance.now()-t0);
      t0=performance.now();for(let i=0;i<N*N;i++)if(rng()<pr)rule(SB,TB,i);tmB.add(performance.now()-t0);if(acc>3)acc=0;}
    if(did||fr<3){draw(A,SA,picked);draw(B,SB,null);}
    if(fr%10===1){const [ma,na]=meanT(TA),[mb,nb]=meanT(TB);setHud(root,`${tot.toLocaleString('en-US')} picks · ${g2ms(tmA.v)} ms`,'a');setHud(root,`${(N*N).toLocaleString('en-US')} cells · ${g2ms(tmB.v)} ms`,'b');
      ro.innerHTML=`${N}x${N} grid, 20 ticks per second · each cell is picked every <b>${(256/pps/20).toFixed(1)} s</b> on average (${pps} picks per 16x16 section per tick)<br>regrown: random ticks <b>${Math.round(na/bare0*100)}%</b>, mean <b>${(ma/20).toFixed(1)} s</b> · full scan <b>${Math.round(nb/bare0*100)}%</b>, mean <b>${(mb/20).toFixed(1)} s</b><br>cost per tick measured here: picks <b>${g2ms(tmA.v)} ms</b> vs full scan <b>${g2ms(tmB.v)} ms</b> · §6a measured: 256 picks <b>0.0008 ms</b>, full scan 1024x1024 <b>0.89 ms</b>`;}}};});

// ======================================================================
// E2/E3: a stage ladder with lazy changed_at evaluation and 9-byte updates
// ======================================================================
reg('stages',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),log=$('[data-log]',root);
  const TS=16,TW=W/TS,TH=H/TS,NT=TW*TH,STEP=6,SWEEP=2,bg=g2ground(W,H,41);
  const T=[];for(let i=0;i<NT;i++)T.push({s0:0,t0:0,burnt:false,sent:0});
  const changed=new Set(),NAMES=['tall','long','short','stubble','burnt'],IDS=['0F01','0F02','0F03','0F04','0F05','0F06'];
  let now=0,fr=0,pk=0,flatB=0,sweepT=0,lastUser=-9,autoT=1.5,lines=[],bits=[];
  const stage=t=>Math.max(0,t.s0-Math.floor((now-t.t0)/STEP));
  const tufts=[];for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)for(let k=0;k<5;k++)tufts.push({i:ty*TW+tx,x:tx*TS+1+((g2H(tx,ty,k)*14)|0),y:ty*TS+4+((g2H(tx,ty,k+7)*11)|0),h:g2H(tx,ty,k+3),v:k});
  tufts.sort((a,b)=>a.y-b.y);
  const Wk={x:-8,y:TS*2+12,left:false,anim:0,moving:true,dir:1};
  const sheep={on:false,x:0,y:0,tile:-1,t:0,left:false,anim:0};
  function send(i,s,why){const t=T[i];t.sent=s;pk++;const x=i%TW,y=(i/TW)|0,id=IDS[s===3&&t.burnt?5:s];
    lines.unshift(`${now.toFixed(1)} s  0x6B (${100+x},${200+y},7) stack 1 item 0x${id}  9 B  ${why}`);if(lines.length>4)lines.pop();}
  function act(i,tool){const t=T[i],cur=stage(t);
    if(tool==='cut'){if(cur>=3)return;t.s0=cur+1;t.t0=now;t.burnt=false;const x=(i%TW)*TS+8,y=((i/TW)|0)*TS+10;for(let k=0;k<6;k++)bits.push({x,y,z:2,vx:(Math.random()*2-1)*30,vz:30+Math.random()*30,a:0,col:k&1?G2.s2:G2.g4});}
    else if(tool==='burn'){for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const x=i%TW+dx,y=((i/TW)|0)+dy;if(x<0||y<0||x>=TW||y>=TH)continue;if((dx||dy)&&Math.random()<.5)continue;const q=T[y*TW+x];q.s0=4;q.t0=now;q.burnt=true;changed.add(y*TW+x);send(y*TW+x,4,'fire');}return;}
    else{sheep.on=true;sheep.tile=i;sheep.t=1.4;sheep.x=(i%TW)*TS+8;sheep.y=((i/TW)|0)*TS+13;return;}
    changed.add(i);send(i,stage(t),'action');}
  pointer(cv,(p,k)=>{if(k!=='down')return;const i=clamp((p[1]/TS)|0,0,TH-1)*TW+clamp((p[0]/TS)|0,0,TW-1);lastUser=now;act(i,c.segv('tool'));});
  // a field with some history, so every stage is on screen from the start
  for(const [i,s,ago,b] of [[2,3,1,0],[3,2,0,0],[12,4,1,1],[13,4,5,1],[22,1,0,0],[25,3,9,0],[36,2,2,0],[37,3,3,1],[47,1,1,0],[8,4,2,1]]){T[i].s0=s;T[i].t0=-ago;T[i].burnt=!!b;T[i].sent=stage(T[i]);changed.add(i);}
  return {tick(dt){fr++;now+=dt;const tool=c.segv('tool');
    Wk.x+=Wk.dir*20*dt;Wk.anim+=dt*8;Wk.left=Wk.dir<0;if(Wk.x>W+8){Wk.dir=-1;Wk.y=TS*(1+((Math.random()*3)|0))+12;}if(Wk.x<-8){Wk.dir=1;Wk.y=TS*(1+((Math.random()*3)|0))+12;}
    flatB+=10*dt*9*50;// the naive way: every flatten synced at 10 Hz to 50 viewers
    if(sheep.on){sheep.t-=dt;sheep.anim+=dt*2;if(sheep.t<=0){const t=T[sheep.tile],cur=stage(t);if(cur<3){t.s0=cur+1;t.t0=now;t.burnt=false;changed.add(sheep.tile);send(sheep.tile,stage(t),'graze');}sheep.on=false;}}
    if(now-lastUser>5){autoT-=dt;if(autoT<=0){autoT=2.2;const r=Math.random();act((Math.random()*NT)|0,r<.6?'cut':r<.8?'burn':'graze');}}
    // the server's coarse sweep: only changed tiles, stage computed from changed_at, a packet only when it differs
    sweepT-=dt;if(sweepT<=0){sweepT=SWEEP;for(const i of [...changed]){const s=stage(T[i]);if(s!==T[i].sent)send(i,s,'sweep');if(s===0)changed.delete(i);}}
    for(let j=bits.length-1;j>=0;j--){const b=bits[j];b.a+=dt;b.vz-=120*dt;b.x+=b.vx*dt;b.z=Math.max(0,b.z+b.vz*dt);if(b.a>.9)bits.splice(j,1);}
    // ground per tile from what this client was sent
    for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const t=T[ty*TW+tx],s=t.sent;for(let y=ty*TS;y<ty*TS+TS;y++)for(let x=tx*TS;x<tx*TS+TS;x++){const q=g2H(x,y,8);let col=bg[y*W+x];
        if(s===3)col=t.burnt?(q<.5?G2.b1:G2.b0):(q<.3?G2.d2:q<.4?G2.d1:col);else if(s===4)col=q<.12?G2.b2:q<.6?G2.b0:G2.b1;else if(s===2)col=q<.5?G2.g3:q<.8?G2.g2:G2.s1;else if(s===0&&q<.5)col=G2.g1;u[y*W+x]=col;}
      if(s===4&&now-t.t0<1.2)for(let k=0;k<3;k++)if(g2H(tx,ty,k+(fr>>3))<.5)g2p(u,W,H,tx*TS+3+k*4,ty*TS+5+k*3,G2.em);}
    let wd=false;
    for(const q of tufts){if(!wd&&q.y>Wk.y){g2shadow(u,W,H,Wk.x,Wk.y+1,5,g2DK);g2walker(u,W,H,Wk.x,Wk.y,Wk);wd=true;}
      const t=T[q.i],s=t.sent;if(s===4)continue;const near=Math.abs(q.x-Wk.x)<5&&Math.abs(q.y-Wk.y)<4,bend=near?(q.x<Wk.x?-2:2):0;
      if(s===3){if(q.v<3){if(t.burnt){g2p(u,W,H,q.x,q.y,G2.g3);if(q.v<2)g2p(u,W,H,q.x,q.y-1,G2.g4);}else{g2p(u,W,H,q.x,q.y,G2.s1);g2p(u,W,H,q.x,q.y-1,G2.s2);g2p(u,W,H,q.x+2,q.y,G2.s0);}}continue;}
      const h=s===0?9+q.h*3:s===1?5+q.h:2+q.h;g2tuft(u,W,H,q.x,q.y,Math.round(h)-(near?2:0),bend||(Math.sin(now*1.3+q.x*.15)>.9?1:0),G2TUFT,q.v);}
    if(!wd){g2walker(u,W,H,Wk.x,Wk.y,Wk);}
    if(sheep.on){g2shadow(u,W,H,sheep.x,sheep.y+1,7,g2DK);g2sheep(u,W,H,sheep.x,sheep.y,false,sheep.anim);}
    for(const b of bits)g2p(u,W,H,b.x,b.y-b.z,b.col);
    F.put();
    if(fr%6===1){setHud(root,`tap a tile: ${tool==='cut'?'scythe':tool==='burn'?'fire':'sheep'}`);log.textContent=lines.join('\n')||'(no packets yet)';
      ro.innerHTML=`lazy stages: <b>${pk}</b> packets × 9 B = <b>${pk*9} B</b> · tiles carrying state: <b>${changed.size}</b> of ${NT} · sweep every ${SWEEP} s here (10 to 60 s in the report)<br>syncing every flatten instead (1 walker, 10 Hz, 50 viewers): <b>${Math.round(flatB).toLocaleString('en-US')} B</b><br>report, 100 players crossing a field: about <b>135 B/s</b> per viewer with lazy stages vs about <b>450 KB/s</b> for flatten sync`;}}};});

// ======================================================================
// E4: hiding in tall grass, the server rule, what each client is sent
// ======================================================================
reg('hiding',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const TS=8,TW=W/TS,TH=H/TS,PID=new Uint8Array(TW*TH);
  for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){const e=g2H(x,y,3)<.35;if(x>=3&&x<=10&&y>=3&&y<=9&&!((x===3||x===10||y===3||y===9)&&e))PID[y*TW+x]=1;if(x>=13&&x<=18&&y>=8&&y<=12&&!((x===13||x===18||y===12)&&e))PID[y*TW+x]=2;}
  const bg=g2ground(W,H,51),tufts=[];for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)if(PID[ty*TW+tx])for(let k=0;k<3;k++)tufts.push({x:tx*TS+1+((g2H(tx,ty,k)*6)|0),y:ty*TS+3+((g2H(tx,ty,k+5)*5)|0),h:7+((g2H(tx,ty,k+9)*3)|0),v:k});
  tufts.sort((a,b)=>a.y-b.y);
  const mk=(name,team,map,route,sp)=>({name,team,map,route,ri:0,fx:route[0][0],fy:route[0][1],tx:route[0][0],ty:route[0][1],k:1,sp,left:false,anim:0,rev:-9,moving:false});
  const A=mk('A',1,g2MW,[[1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[7,5],[8,6],[9,7],[10,8],[11,8],[12,8],[12,7],[11,6],[10,5],[9,4],[8,4],[7,4],[6,4],[5,5],[4,6],[3,7],[2,7],[1,6]],.32);
  const Pm=mk('P',1,g2Mgrn,[[2,11],[3,11],[4,11],[5,12],[4,12],[3,12]],.7);
  const B=mk('B',2,g2Mred,[[16,3],[17,3],[17,4],[16,4]],1.1);
  const D=mk('D',2,g2Mred,[[13,5],[13,6],[13,7],[13,8],[13,7],[13,6]],.6);
  const ALL=[A,Pm,B,D],viewers=[Pm,B,D];let now=0,fr=0,events=0,spark=0;const lastVis=new Map(),prevD=new Map(),seen=new Map(),movesTo=new Map();
  const pid=e=>PID[clamp(Math.round(e.y),0,TH-1)*TW+clamp(Math.round(e.x),0,TW-1)];
  const cheb=(a,b)=>Math.max(Math.abs(Math.round(a.x)-Math.round(b.x)),Math.abs(Math.round(a.y)-Math.round(b.y)));
  // the rule, run on the server for every spectator pair
  function raw(v,t){if(v.team===t.team)return 'party';const d=cheb(v,t);if(d<=1)return 'adjacent';const p=pid(t);if(!p)return 'in the open';if(pid(v)===p)return 'same patch';if(now<t.rev)return 'revealed';
    const key=v.name+t.name,pd=prevD.get(key);if(d===2&&pd!==undefined&&pd>2)return 'closing at 2';return '';}
  function vis(v,t,delay){const r=raw(v,t),key=v.name+t.name;if(r){lastVis.set(key,now);return r;}const lv=lastVis.get(key);if(lv!==undefined&&now-lv<delay)return 'hide delay';return '';}
  c.btn('atk',()=>{A.rev=now+2;spark=.35;});
  function step(e,dt){if(e.k>=1){e.fx=e.tx;e.fy=e.ty;e.ri=(e.ri+1)%e.route.length;const [nx,ny]=e.route[e.ri];if(nx!==e.fx)e.left=nx<e.fx;e.tx=nx;e.ty=ny;e.k=0;}
    e.k=Math.min(1,e.k+dt/e.sp);e.x=lerp(e.fx,e.tx,e.k);e.y=lerp(e.fy,e.ty,e.k);e.moving=true;e.anim+=dt*8;}
  function drawE(e,style){const X=e.x*TS+4,Y=e.y*TS+6;g2shadow(u,W,H,X,Y+1,5,g2DK);
    if(!style){g2walker(u,W,H,X,Y,{...e,map:e.map});return;}
    const tmp=new Uint32Array(15*14).fill(0);g2walker(tmp,15,14,7,12,{...e,map:e.map});
    for(let j=0;j<14;j++)for(let i=0;i<15;i++){const col=tmp[j*15+i];if(!col)continue;const x=Math.round(X)-7+i,y=Math.round(Y)-12+j;if(x<0||y<0||x>=W||y>=H)continue;
      if(style==='check'){if((x+y)&1)u[y*W+x]=col;}
      else if(style==='dark'){u[y*W+x]=un32(col)[0]+un32(col)[1]>300?G2.pa:G2.ink;}
      else u[y*W+x]=mix32(u[y*W+x],col,.45);}
    if(style==='dark')for(let j=0;j<14;j++)for(let i=0;i<15;i++){if(tmp[j*15+i])continue;const nb=(i>0&&tmp[j*15+i-1])||(i<14&&tmp[j*15+i+1])||(j>0&&tmp[(j-1)*15+i])||(j<13&&tmp[(j+1)*15+i]);if(nb)g2p(u,W,H,Math.round(X)-7+i,Math.round(Y)-12+j,G2.ice);}}
  return {tick(dt){fr++;now+=dt;const view=c.segv('view'),self=c.segv('self'),delay=c.v('delay')/1000;c.out('delay',c.v('delay')+' ms');
    for(const e of ALL)step(e,dt);if(spark>0)spark-=dt;
    const V={};for(const v of viewers){const r=vis(v,A,delay),key=v.name;V[key]=r;const was=seen.get(key);if(was!==undefined&&!!was!==!!r)events++;seen.set(key,r);if(r&&A.k<dt/A.sp+.001)movesTo.set(key,(movesTo.get(key)||0)+1);prevD.set(v.name+A.name,cheb(v,A));}
    u.set(bg);
    for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)if(PID[ty*TW+tx])for(let y=ty*TS;y<ty*TS+TS;y++)for(let x=tx*TS;x<tx*TS+TS;x++)if(g2H(x,y,6)<.5)u[y*W+x]=G2.g1;
    // who appears on this screen
    const me=view==='server'?null:view==='A'?A:view==='B'?B:D;
    const shown=ALL.filter(e=>!me||e===me||(e===A?!!V[me.name]:me===A?true:true));
    const ents=shown.slice().sort((a,b)=>a.y-b.y);let ei=0;
    const inGrassA=!!pid(A);
    for(const q of tufts){while(ei<ents.length&&ents[ei].y*TS+6<q.y){const e=ents[ei++];drawE(e,e===A&&me===A&&inGrassA?self:'');}
      g2tuft(u,W,H,q.x,q.y,q.h,Math.sin(now*1.4+q.x*.12)>.85?1:0,G2TUFT,q.v);}
    while(ei<ents.length){const e=ents[ei++];drawE(e,e===A&&me===A&&inGrassA?self:'');}
    if(view==='server'){for(const v of viewers){const ok=!!V[v.name],x0=A.x*TS+4,y0=A.y*TS-2,x1=v.x*TS+4,y1=v.y*TS-2,n=Math.ceil(Math.hypot(x1-x0,y1-y0)/3);
        for(let k=1;k<n;k++){if(!ok&&(k&1))continue;g2p(u,W,H,lerp(x0,x1,k/n),lerp(y0,y1,k/n),ok?G2.gold:G2.red);}}}
    if(spark>0)for(let k=0;k<6;k++){const a=k/6*6.283+now*9;g2p(u,W,H,A.x*TS+4+Math.cos(a)*5,A.y*TS-2+Math.sin(a)*4,k&1?G2.gold:G2.fw);}
    F.put();
    if(fr%6===1){const rv=Math.max(0,A.rev-now);setHud(root,view==='server'?'server: gold = A is sent · red = withheld':view==='A'?'A’s screen (A is in the blue tunic)':`${view}’s screen`);
      ro.innerHTML=viewers.map(v=>`${v.name} (${v===Pm?'party':'enemy'}): ${V[v.name]?`sees A, <b>${V[v.name]}</b>`:'<b>nothing</b>, 0 move packets'}`).join(' · ')+
        `<br>A in tall grass: <b>${inGrassA?'yes, patch '+pid(A):'no'}</b> · reveal ${rv>0?'<b>'+rv.toFixed(1)+' s</b> left':'off'} · hide and reveal events so far <b>${events}</b>, each one remove or add of about 40 to 60 B`;}}};});

// ======================================================================
// E5: the TFS invisibility anti-pattern vs a rule that sends nothing
// ======================================================================
reg('tfsleak',root=>{const cvs=$$('canvas',root),PA=PX(cvs[0]),PB=PX(cvs[1]),W=PA.W,H=PA.H,c=ctl(root),ro=$('[data-ro]',root),la=$('[data-log="a"]',root),lb=$('[data-log="b"]',root);
  const TS=8,bg=g2ground(W,H,61),tufts=[];for(let k=0;k<70;k++){const x=40+((g2H(k,1,2)*80)|0),y=20+((g2H(k,2,2)*66)|0);tufts.push({x,y,h:6+((g2H(k,3,2)*4)|0),v:k&3});}tufts.sort((a,b)=>a.y-b.y);
  const route=[[8,4],[9,4],[10,4],[11,5],[12,6],[12,7],[11,8],[10,9],[9,9],[8,8],[7,7],[7,6],[7,5]];
  const I={ri:0,fx:8,fy:4,tx:8,ty:4,k:1,x:8,y:4,left:false,anim:0,moving:true},V={x:2.5,y:6};let now=0,fr=0,moves=0,linesA=[],trail=[];
  function step(dt){if(I.k>=1){I.fx=I.tx;I.fy=I.ty;I.ri=(I.ri+1)%route.length;const [nx,ny]=route[I.ri];if(nx!==I.fx)I.left=nx<I.fx;I.tx=nx;I.ty=ny;I.k=0;moves++;
      linesA.unshift(`MoveCreature id 0x10000042 (${100+I.fx},${200+I.fy},7) → (${100+nx},${200+ny},7)`);if(linesA.length>3)linesA.pop();trail.push([nx,ny]);if(trail.length>6)trail.shift();}
    I.k=Math.min(1,I.k+dt/.45);I.x=lerp(I.fx,I.tx,I.k);I.y=lerp(I.fy,I.ty,I.k);I.anim+=dt*8;}
  function scene(P,leak){const u=P.u32;u.set(bg);const X=I.x*TS+4,Y=I.y*TS+6;
    for(const q of tufts)g2tuft(u,W,H,q.x,q.y,q.h,Math.sin(now*1.3+q.x*.1)>.85?1:0,G2TUFT,q.v);
    g2shadow(u,W,H,V.x*TS+4,V.y*TS+7,5,g2DK);g2walker(u,W,H,V.x*TS+4,V.y*TS+6,{front:true});
    if(leak){for(const [tx,ty] of trail)g2p(u,W,H,tx*TS+4,ty*TS+6,G2.red);
      const tmp=new Uint32Array(9*14).fill(0);g2walker(tmp,9,14,4,12,{moving:true,anim:I.anim,left:I.left});
      for(let j=0;j<14;j++)for(let i=0;i<9;i++){if(tmp[j*9+i])continue;const nb=(i>0&&tmp[j*9+i-1])||(i<8&&tmp[j*9+i+1])||(j>0&&tmp[(j-1)*9+i])||(j<13&&tmp[(j+1)*9+i]);if(nb)g2p(u,W,H,Math.round(X)-4+i,Math.round(Y)-12+j,G2.red);}
      g2p(u,W,H,X,Y-15,G2.red);g2p(u,W,H,X,Y-16,G2.red);g2p(u,W,H,X,Y-18,G2.red);}
    P.put();}
  return {tick(dt){fr++;now+=dt;step(dt);const mod=c.v('mod');
    scene(PA,mod);scene(PB,false);
    if(fr%6===1){setHud(root,mod?'modified client: draws the position':'honest client: draws nothing','a');setHud(root,mod?'modified client: nothing to draw':'honest client: draws nothing','b');
      la.textContent=`AddCreature id 0x10000042 (${100+route[0][0]},${200+route[0][1]},7) dir E outfit {0,0,0,0} light\n`+linesA.join('\n');
      lb.textContent='canSeeCreature(viewer, hidden) = false\n(no AddCreature, no moves)';
      ro.innerHTML=`TFS: <b>1</b> add (about 40 to 60 B) + <b>${moves}</b> moves, every one carrying the position · our rule: <b>0</b> packets<br>a modified client ${mod?'<b>draws the hidden player and its trail</b> on the left and still nothing on the right':'would draw the position on the left; tick the box'}`;}}};});

// butterfly frames: wings open, half, closed (upright); a = wing, b = wing edge, k = body
const G2BF=[["aa.aa","abkba",".aka."],[".a.a.",".aka.","..k.."],["..a..","..a..","..k.."]];
const G2BFPOSE=[0,1,2,1,0,1];
function g2bfly(u,W,H,b){const X=Math.round(b.x),Y=Math.round(b.y),Z=Math.round(b.z);u[clamp(Y,0,H-1)*W+clamp(X,0,W-1)]=g2DK(u[clamp(Y,0,H-1)*W+clamp(X,0,W-1)]);if(Z<5)g2p(u,W,H,X+1,Y,g2DK(u[clamp(Y,0,H-1)*W+clamp(X+1,0,W-1)]));
  g2spr(u,W,H,G2BF[b.pose],{a:b.col[0],b:b.col[1],k:G2.bfk},X,Y-Z);}

// ======================================================================
// F1: the Stardew flap-hop vs a random walk
// ======================================================================
reg('butterfly',root=>{const cvs=$$('canvas',root),PA=PX(cvs[0]),PB=PX(cvs[1]),W=PA.W,H=PA.H,c=ctl(root),ro=$('[data-ro]',root);
  const bg=g2ground(W,H,71);
  const FL=[[22,30,G2.fp],[32,36,G2.fy],[28,74,G2.fw],[118,24,G2.fv],[130,32,G2.fp],[112,80,G2.fy],[72,50,G2.fr],[142,66,G2.fw],[80,86,G2.fp],[50,22,G2.fy]].map(([x,y,col])=>({x,y,col,top:5}));
  const COLS=[[G2.bf1,G2.bf3],[G2.bf2,G2.wo2],[G2.bf3,G2.fr]];
  const mk=(i,rng)=>({x:30+i*45,y:40+i*12,z:8,vx:0,vy:0,vz:0,st:0,tgt:-1,t:1+i,flee:0,left:0,ph:.2,flapMs:.045+rng()*.035,frames:rng()<.5?4:6,pose:0,col:COLS[i%3],seqs:0,wt:0});
  const rngA=g2R(9),BA=[0,1,2].map(i=>mk(i,rngA)),BB=[0,1,2].map(i=>({...mk(i,rngA),x:40+i*40,y:50,z:8,ph:0}));
  const BENCH=[];const rb=g2R(4);for(let i=0;i<1000;i++)BENCH.push(mk(i,rb));
  let thr=null,thrT=0,t=0,fr=0,Wk={x:-20,y:62,left:false,anim:0,moving:true,on:false,next:4};const tm=g2tm();
  pointer(cvs[0],(p,k)=>{if(k!=='leave'){thr=p;thrT=1.5;}});
  const near=(x,y)=>{let bi=-1,bd=1e9;for(let i=0;i<FL.length;i++){const d=Math.hypot(FL[i].x-x,FL[i].y-y);if(d<90&&d>6&&d<bd*(0.6+Math.random())){bd=d;bi=i;}}return bi;};
  function up(b,dt,tx,ty,fl){if(b.st===1){const f=fl[b.tgt];b.x=f.x+1;b.y=f.y;b.z=f.top+1;b.t-=dt;b.wt+=dt;b.pose=(b.wt%1.1)<.8?0:1;
      const th=tx===null?1e9:Math.hypot(b.x-tx,b.y-ty);if(th<24||b.t<=0){b.st=0;b.tgt=-1;b.vz=30;b.flee=th<24?1.2:0;b.t=3+Math.random()*4;}return;}
    // the flap-hop: 4 or 6 frames of 45-80 ms, a kick on every other frame, then 200 ms of rest; gravity in between
    b.ph-=dt;b.flee-=dt;
    if(b.ph<=0){if(b.left===0){b.left=b.frames;b.seqs++;}
      b.left--;b.ph=b.flapMs;b.pose=G2BFPOSE[(b.frames-b.left)%6];
      if((b.left&1)===0){b.vz+=11+Math.random()*29;b.vx=clamp(b.vx+(Math.random()*2-1)*24,-40,40);b.vy=clamp(b.vy+(Math.random()*2-1)*17,-40,40);}
      if(b.left===0){b.ph=.2+(Math.random()*2-1)*.005;b.pose=0;}}
    let sx=0,sy=0;const th=tx===null?1e9:Math.hypot(b.x-tx,b.y-ty);
    if(th<24&&b.flee<=0)b.flee=1.2;
    if(b.flee>0){const l=th||1;sx=(b.x-tx)/l*60;sy=(b.y-ty)/l*60;b.tgt=-1;}
    else{b.t-=dt;if(b.tgt<0&&b.t<=0){b.tgt=near(b.x,b.y);b.t=4+Math.random()*4;}
      if(b.tgt>=0){const f=fl[b.tgt],dx=f.x-b.x,dy=f.y-b.y,d=Math.hypot(dx,dy)||1;sx=dx/d*30;sy=dy/d*30;if(d<3&&b.z<f.top+5){b.st=1;b.t=3+Math.random()*5;b.vx=b.vy=b.vz=0;b.wt=0;return;}}
      if(b.x<14)sx+=30;if(b.x>W-14)sx-=30;if(b.y<20)sy+=30;if(b.y>H-8)sy-=30;}
    b.vx+=(sx-b.vx)*Math.min(1,dt*1.5);b.vy+=(sy-b.vy)*Math.min(1,dt*1.5);
    b.x+=b.vx*dt;b.y+=b.vy*dt*.8;b.vz-=150*dt;b.z+=b.vz*dt;
    const zmin=b.tgt>=0?fl[b.tgt].top+1:4;if(b.z<zmin){b.z=zmin;if(b.vz<0)b.vz=0;}if(b.z>16){b.z=16;if(b.vz>0)b.vz=0;}
    b.x=clamp(b.x,2,W-3);b.y=clamp(b.y,8,H-2);}
  // the anti-pattern: a jittery random walk with wings flapping every frame
  function upR(b,dt){b.vx=(b.vx+(Math.random()-.5)*900*dt)*.92;b.vy=(b.vy+(Math.random()-.5)*900*dt)*.92;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<6||b.x>W-6)b.vx=-b.vx;if(b.y<14||b.y>H-4)b.vy=-b.vy;b.x=clamp(b.x,6,W-6);b.y=clamp(b.y,14,H-4);b.z=8+((Math.random()*3)|0)-1;b.ph++;b.pose=(b.ph&1)?2:0;}
  function scene(P,list){const u=P.u32;u.set(bg);for(const f of FL)g2flower(u,W,H,f.x,f.y,f.col,2);
    if(Wk.on){g2shadow(u,W,H,Wk.x,Wk.y+1,5,g2DK);g2walker(u,W,H,Wk.x,Wk.y,Wk);}
    for(const b of list.slice().sort((a,b)=>a.y-b.y))g2bfly(u,W,H,b);P.put();}
  return {tick(dt){fr++;t+=dt;thrT-=dt;if(thrT<=0)thr=null;
    Wk.next-=dt;if(!Wk.on&&Wk.next<=0){Wk.on=true;Wk.x=-10;Wk.y=40+Math.random()*40;}if(Wk.on){Wk.x+=26*dt;Wk.anim+=dt*8;if(Wk.x>W+10){Wk.on=false;Wk.next=8+Math.random()*4;}}
    const tx=thr?thr[0]:Wk.on?Wk.x:null,ty=thr?thr[1]:Wk.on?Wk.y-4:null;
    const t0=performance.now();for(const b of BA)up(b,dt,tx,ty,FL);if(c.v('bench'))for(const b of BENCH)up(b,dt,null,null,FL);tm.add(performance.now()-t0);
    for(const b of BB)upR(b,dt);
    scene(PA,BA);scene(PB,BB);
    if(fr%10===1){const rate=BA.map(b=>b.seqs/Math.max(1,t)).reduce((a,b)=>a+b,0)/3;setHud(root,thr?'fleeing your pointer':'move the pointer near one','a');setHud(root,'random walk, flapping every frame','b');
      ro.innerHTML=`flap frame per butterfly (rolled once): <b>${BA.map(b=>Math.round(b.flapMs*1000)+' ms × '+b.frames).join(' · ')}</b> · then 200 ms rest · <b>${rate.toFixed(1)}</b> flap cycles/s measured<br>states: ${BA.map(b=>b.st===1?'<b>on a flower</b>':b.flee>0?'<b>fleeing</b>':'flying').join(' · ')}<br>update cost measured here (${c.v('bench')?'3 + 1,000 off screen':'3 butterflies'}): <b>${g2ms(tm.v)} ms</b> · §6a measured: 1,000 update in <b>0.012 ms</b>, one canvas call each to draw <b>0.69 ms</b>`;}}};});

// ======================================================================
// F2/F3/F4: bees hop between flowers, a dragonfly darts and hovers, midges on a spring
// ======================================================================
reg('pondlife',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const PCX=140,PCY=72,PRX=46,PRY=28,inPond=(x,y)=>((x-PCX)/PRX)**2+((y-PCY)/PRY)**2<1;
  const bg=g2ground(W,H,81);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=((x-PCX)/PRX)**2+((y-PCY)/PRY)**2;if(d<1){const q=g2H(x,y,2);bg[y*W+x]=d>.82?(d>.92&&q<.5?G2.d2:G2.w2):d>.45?G2.w1:G2.w0;}else if(d<1.12)bg[y*W+x]=g2H(x,y,4)<.6?G2.d2:G2.d1;}
  const FL=[];const rf=g2R(3);for(let i=0;i<11;i++)FL.push({x:10+((rf()*72)|0),y:18+((rf()*84)|0),col:[G2.fp,G2.fy,G2.fv,G2.fw][i%4]});
  const REEDS=[];for(let i=0;i<16;i++){const a=Math.PI*(.9+i/15*.75),x=PCX+Math.cos(a)*PRX*.97,y=PCY+Math.sin(a)*PRY*.97;REEDS.push({x:Math.round(x+(rf()-.5)*4),y:Math.round(y),h:7+((rf()*6)|0),cat:i%4===1});}
  const POST={x:150,y:66};
  // bees
  const bees=[0,1,2].map(i=>({x:FL[i*3].x,y:FL[i*3].y,z:4,st:0,f:i*3,t:1+i*.6,fx:0,fy:0,tx:0,ty:0,dur:1,k:0,hops:0,max:3+((rf()*6)|0),lastArr:0}));
  const ints=[];let now=0,fr=0;
  function pickFlower(b){let best=-1;for(let n=0;n<20;n++){const j=(Math.random()*FL.length)|0;const d=Math.hypot(FL[j].x-FL[b.f].x,FL[j].y-FL[b.f].y);if(j!==b.f&&d>=12&&d<=44){best=j;break;}}return best<0?(b.f+1)%FL.length:best;}
  function upBee(b,dt){if(b.st===0){b.t-=dt;if(b.t<=0){b.hops++;b.fx=b.x;b.fy=b.y;if(b.hops>b.max){b.st=2;b.tx=-8;b.ty=b.y-20;b.dur=1.8;b.k=0;return;}b.f=pickFlower(b);b.tx=FL[b.f].x;b.ty=FL[b.f].y;b.dur=Math.hypot(b.tx-b.x,b.ty-b.y)/48+.15;b.k=0;b.st=1;}return;}
    b.k=Math.min(1,b.k+dt/b.dur);const e=b.k*b.k*(3-2*b.k);b.x=lerp(b.fx,b.tx,e);b.y=lerp(b.fy,b.ty,e);b.z=4+Math.sin(b.k*Math.PI)*5;
    if(b.k>=1){if(b.st===2){b.st=3;b.t=2+Math.random()*3;return;}b.st=0;b.t=2*(.5+Math.random()*.7);b.z=4;if(b.lastArr)ints.push(now-b.lastArr);if(ints.length>40)ints.shift();b.lastArr=now;}}
  // dragonfly: hover 0.8-3 s, dart 0.1-0.25 s to a point 1-3 tiles (8-24 px) away, home every 3-6 darts
  const D={x:PCX-6,y:PCY-6,hx:PCX-6,hy:PCY-6,st:0,t:1.5,fx:0,fy:0,tx:0,ty:0,dur:.2,k:0,n:0,home:4,left:false,wing:0,darts:0};
  function upD(dt){D.wing++;if(D.st===0){D.t-=dt;D.x+=Math.sin(now*2.1)*.6*dt;D.y+=Math.cos(now*1.7)*.4*dt;
      if(D.t<=0&&(D.wing&3)===0){D.n++;let tx,ty,ok=false;if(D.n>=D.home){D.n=0;D.home=3+((Math.random()*4)|0);tx=D.hx+(Math.random()-.5)*6;ty=D.hy+(Math.random()-.5)*4;ok=true;}
        for(let k=0;k<20&&!ok;k++){const a=Math.random()*6.283,r=8+Math.random()*16;tx=D.x+Math.cos(a)*r;ty=D.y+Math.sin(a)*r*.7;ok=inPond(tx,ty+4);}
        if(!ok){tx=D.hx;ty=D.hy;}D.fx=D.x;D.fy=D.y;D.tx=tx;D.ty=ty;D.left=tx<D.x;D.dur=.1+Math.random()*.15;D.k=0;D.st=1;D.darts++;}}
    else{D.k=Math.min(1,D.k+dt/D.dur);const e=1-(1-D.k)**3;D.x=lerp(D.fx,D.tx,e);D.y=lerp(D.fy,D.ty,e);if(D.k>=1){D.st=0;D.t=.8+Math.random()*2.2;}}}
  const DFA=["...ww..","dddddDH","...ww.."],DFB=["..w..w.","dddddDH","..w..w."],DFm={w:G2.wing,d:G2.df,D:G2.df2,H:G2.ink};
  // midges: a = -k(p - c) + jitter, v = (v + a dt) * 0.96, k_y = k_x / 2
  const MG=[];for(let i=0;i<30;i++)MG.push({x:(Math.random()-.5)*8,y:(Math.random()-.5)*8,vx:0,vy:0});let macc=0,pol=0;
  function upM(n,k,jit){const h=1/30;for(let i=0;i<n;i++){const m=MG[i];const ax=-k*m.x+(Math.random()-.5)*jit,ay=-k*.5*m.y+(Math.random()-.5)*jit;m.vx=(m.vx+ax*h)*.96;m.vy=(m.vy+ay*h)*.96;m.x+=m.vx*h;m.y+=m.vy*h;}
    let sx=0,sy=0,sm=0;for(let i=0;i<n;i++){sx+=MG[i].vx;sy+=MG[i].vy;sm+=Math.hypot(MG[i].vx,MG[i].vy);}pol=pol*.9+(sm?Math.hypot(sx,sy)/sm:0)*.1;}
  const BEEW=["w.w","yky"],BEEB=[".w.","yky"],BEEm={w:G2.wing,y:G2.bee,k:G2.bee2};
  const tm=g2tm();for(let i=0;i<120;i++){now+=1/30;for(const b of bees)upBee(b,1/30);upD(1/30);upM(20,14,90);}ints.length=0;
  return {tick(dt){fr++;now+=dt;const n=c.v('n'),k=c.v('k'),jit=c.v('jit');c.out('n',n);c.out('k',k);c.out('jit',jit);
    const t0=performance.now();
    if(c.v('bees'))for(const b of bees){upBee(b,dt);if(b.st===3){b.t-=dt;if(b.t<=0){b.st=0;b.hops=0;b.max=3+((Math.random()*6)|0);b.f=(Math.random()*FL.length)|0;b.x=-6;b.y=FL[b.f].y;b.t=0;b.lastArr=0;}}}
    if(c.v('dfly'))upD(dt);
    macc+=dt;while(macc>=1/30){macc-=1/30;upM(n,k,jit);}
    tm.add(performance.now()-t0);
    u.set(bg);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(inPond(x,y)&&((x+((now*3)|0))%23===0)&&g2H(x,y,(now*2)|0)<.15&&u[y*W+x]===G2.w1)u[y*W+x]=G2.w3;
    for(const f of FL)g2flower(u,W,H,f.x,f.y,f.col,2);
    // the post the swarm forms over
    g2rect(u,W,H,POST.x-1,POST.y-12,3,13,G2.iron);g2rect(u,W,H,POST.x+1,POST.y-12,1,13,G2.iron2);g2rect(u,W,H,POST.x-2,POST.y,5,1,G2.w0);
    for(const r of REEDS){for(let j=0;j<r.h;j++)g2p(u,W,H,r.x+(j>r.h-3&&!r.cat?(Math.sin(now*1.5+r.x)>.6?1:0):0),r.y-j,j<2?G2.reed2:G2.reed);if(r.cat){g2p(u,W,H,r.x,r.y-r.h,G2.cat);g2p(u,W,H,r.x,r.y-r.h-1,G2.cat);g2p(u,W,H,r.x,r.y-r.h-2,G2.reed);}}
    if(c.v('dfly')){const X=Math.round(D.x),Y=Math.round(D.y);g2p(u,W,H,X,Y+6,g2DK(u[clamp(Y+6,0,H-1)*W+clamp(X,0,W-1)]));g2p(u,W,H,X+1,Y+6,g2DK(u[clamp(Y+6,0,H-1)*W+clamp(X+1,0,W-1)]));g2spr(u,W,H,(D.wing>>(D.st?0:1))&1?DFA:DFB,DFm,X,Y+1,D.left);}
    if(c.v('bees'))for(const b of bees){if(b.st===3)continue;const X=Math.round(b.x),Y=Math.round(b.y);g2p(u,W,H,X,Y+1,g2DK(u[clamp(Y+1,0,H-1)*W+clamp(X,0,W-1)]));
      const bob=b.st===1||b.st===2?(Math.sin(now*5*6.283)>0?1:0):0;g2spr(u,W,H,b.st===0?(((now*1000/40)|0)&1?BEEW:BEEB):((fr&1)?BEEW:BEEB),BEEm,X,Y-Math.round(b.z)-bob);}
    for(let i=0;i<n;i++)g2p(u,W,H,POST.x+MG[i].x,POST.y-20+MG[i].y,G2.ink);
    F.put();
    if(fr%10===1){const s=ints.slice().sort((a,b)=>a-b),med=s.length?s[s.length>>1]:0;setHud(root,`dragonfly: ${D.st?'dart':'hover'}`);
      ro.innerHTML=`bees: median <b>${med?med.toFixed(1)+' s':'…'}</b> between flowers (measured, ${s.length} hops) · dragonfly darts <b>${D.darts}</b>, home every 3 to 6<br>midges: <b>${n}</b> on a spring, k<sub>y</sub> = k<sub>x</sub>/2 · polarisation <b>${pol.toFixed(2)}</b> (swarms of 12 to 111 measured at most 0.09; few midges read higher)<br>update cost measured here (all three): <b>${g2ms(tm.v)} ms</b> · §6a measured: 500 one-pixel particles update in <b>0.0031 ms</b>`;}}};});

// ======================================================================
// F5: moths orbit the lamp (dorsal light response) vs the fly-straight myth
// ======================================================================
reg('moths',root=>{const cvs=$$('canvas',root),PA=PX(cvs[0]),PB=PX(cvs[1]),W=PA.W,H=PA.H,c=ctl(root),ro=$('[data-ro]',root);
  const LX=64,LY=40,BASE=92,bg=g2night(W,H,91);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.hypot((x-LX)/30,(y-BASE)/12);if(d<1){const k=1-d;if(k>.55||(k>.3&&(k-.3)/.25*16>bay(x,y)+.5))bg[y*W+x]=G2.lg2;if(k>.8||(k>.65&&(k-.65)/.15*16>bay(x,y)+.5))bg[y*W+x]=G2.lg1;}}
  const SK=[["m.m",".M."],[".m.","mMm"]];let on=true,now=0,fr=0,flips=0,stalls=0,dives=0,bumps=0,swaps=0,toggles=0;
  const mk=i=>({x:LX+Math.cos(i*1.7)*12,y:LY+Math.sin(i*1.7)*8,vx:0,vy:0,dir:i&1?1:-1,r:6+i*3,st:0,t:2+i,sv:1,z:0,ph:i});
  const MA=[0,1,2,3].map(mk),MB=[0,1,2,3].map(mk);
  c.btn('light',e=>{on=!on;toggles++;e.textContent=on?'Switch the lamp off':'Switch the lamp on';if(on)for(const m of MA)if(Math.random()<25/37){m.dir=-m.dir;swaps++;}});
  function upA(m,dt){const k=1-Math.pow(.9,dt*60);
    if(!on){m.vx+=((m.x<LX?-1:1)*18-m.vx)*k;m.vy+=((m.y<LY?-1:1)*8+Math.sin(now*3+m.ph)*10-m.vy)*k;m.x+=m.vx*dt;m.y+=m.vy*dt;m.x=clamp(m.x,2,W-3);m.y=clamp(m.y,6,H-6);return;}
    const dx=LX-m.x,dy=(LY-m.y)/.7,r=Math.hypot(dx,dy)||1,nx=dx/r,ny=dy/r;
    m.t-=dt;if(m.t<=0&&m.st===0){m.t=2+Math.random()*4;const q=Math.random();if(q<.35){m.st=1;m.sv=1;stalls++;}else if(q<.6){m.st=2;dives++;}}
    let sp=26,tx=-ny*m.dir*sp+nx*(r-m.r)*2.2,ty=nx*m.dir*sp+ny*(r-m.r)*2.2;
    if(m.st===1){m.sv=Math.max(0,m.sv-dt/.4);m.z=Math.min(6,m.z+dt*10);tx*=m.sv;ty*=m.sv;if(m.sv<=0){m.st=0;}}else m.z=Math.max(0,m.z-dt*6);
    if(m.st===2){tx=nx*45;ty=ny*45;if(r<2.5){m.st=0;m.dir=-m.dir;flips++;m.x+=nx*4;m.y+=ny*3;}}
    tx+=(Math.random()-.5)*30;ty+=(Math.random()-.5)*30;
    m.vx+=(tx-m.vx)*k;m.vy+=(ty-m.vy)*k;m.x+=m.vx*dt;m.y+=m.vy*dt*.7;}
  function upB(m,dt){const k=1-Math.pow(.9,dt*60);if(!on){m.vx+=((m.x<LX?-1:1)*18-m.vx)*k;m.vy+=(Math.sin(now*3+m.ph)*10-m.vy)*k;m.x=clamp(m.x+m.vx*dt,2,W-3);m.y=clamp(m.y+m.vy*dt,6,H-6);return;}
    const dx=LX-m.x,dy=LY-m.y,r=Math.hypot(dx,dy)||1;let tx=dx/r*34+(Math.random()-.5)*20,ty=dy/r*34+(Math.random()-.5)*20;
    if(r<2.5){const a=Math.random()*6.283;m.vx=Math.cos(a)*40;m.vy=Math.sin(a)*40;m.x+=Math.cos(a)*3;m.y+=Math.sin(a)*3;bumps++;return;}
    m.vx+=(tx-m.vx)*k;m.vy+=(ty-m.vy)*k;m.x+=m.vx*dt;m.y+=m.vy*dt;}
  function scene(P,list){const u=P.u32;u.set(bg);
    g2rect(u,W,H,LX,LY+3,2,BASE-LY-3,G2.iron);g2rect(u,W,H,LX-2,BASE-1,6,2,G2.iron);g2rect(u,W,H,LX-2,LY-3,6,1,G2.iron);g2rect(u,W,H,LX-3,LY+2,7,1,G2.iron);
    if(on){g2disc(u,W,H,LX+.5,LY,16,G2.lg2,.9,.9);g2disc(u,W,H,LX+.5,LY,10,G2.lg1,1,.9);g2rect(u,W,H,LX-1,LY-2,4,4,G2.lamp);g2rect(u,W,H,LX,LY-1,2,2,G2.lamp2);}
    else{g2rect(u,W,H,LX-1,LY-2,4,4,G2.iron2);}
    for(const m of list){const X=Math.round(m.x),Y=Math.round(m.y-(m.z||0));const lit=on&&Math.hypot(m.x-LX,m.y-LY)<18;g2spr(u,W,H,SK[((now*12+m.ph)|0)&1],{m:lit?G2.moth:G2.moth2,M:lit?G2.wo2:G2.b2},X,Y);}
    P.put();}
  const tm=g2tm();
  return {tick(dt){fr++;now+=dt;const t0=performance.now();for(const m of MA)upA(m,dt);tm.add(performance.now()-t0);for(const m of MB)upB(m,dt);
    scene(PA,MA);scene(PB,MB);
    if(fr%10===1){setHud(root,'back to the light','a');setHud(root,'straight at the light','b');
      ro.innerHTML=`left: stalls <b>${stalls}</b> · dives across <b>${dives}</b> · orbit flips <b>${flips}</b>${toggles?` · lamp toggled ${toggles}×, orbit swapped <b>${swaps}</b> times (25 of 37 in the field)`:''}<br>right: bumps into the lamp <b>${bumps}</b> · update cost measured here (4 moths): <b>${g2ms(tm.v)} ms</b> · report: about 0.0007 ms for 50`;}}};});

// night meadow with a sky band and a treeline, for the firefly figures
function g2nightScene(W,H,seed){const b=g2night(W,H,seed),hz=Math.round(H*.2);
  for(let x=0;x<W;x++){const top=hz-3-Math.round(g2N(x/9+seed,1)*7+g2N(x/3,seed)*2);for(let y=0;y<hz+2;y++){const i=y*W+x;if(y<top)b[i]=y<hz*.45?G2.n0:((y/hz-.45)/.5*16>bay(x,y)+.5)?G2.n2:G2.n1;else b[i]=y>hz?G2.ng0:G2.n0;}
    if(g2H(x,0,seed)<.02){const y=(g2H(x,1,seed)*top*.8)|0;b[y*W+x]=G2.wo2;}}
  return b;}
function g2grassFront(u,W,H,t,seed){for(let x=0;x<W;x+=2){const h=4+((g2H(x,seed,3)*6)|0),ln=Math.sin(t*.8+x*.07)>.7?1:0;for(let j=0;j<h;j++)g2p(u,W,H,x+(j>h-3?ln:0),H-1-j,j>h-2?G2.ng2:G2.ng0);}}

// ======================================================================
// G1: fireflies, solo blinks vs synchronous bursts, and what coupling costs
// ======================================================================
reg('fireflies',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const MAX=1000,X=new Float32Array(MAX),Y=new Float32Array(MAX),A=new Float32Array(MAX),PH=new Float32Array(MAX),PER=new Float32Array(MAX),FLN=new Float32Array(MAX),LIT=new Float32Array(MAX).fill(-1),BC=new Int8Array(MAX),FLASH=new Uint8Array(MAX);
  const bg=g2nightScene(W,H,5),hz=Math.round(H*.2),CNT=[8,15,30,60,150,300,600,1000],R=48,CW=Math.ceil(W/R),CH=Math.ceil(H/R),HEAD=new Int32Array(CW*CH),NEXT=new Int32Array(MAX),CS=new Float32Array(CW*CH),CC=new Float32Array(CW*CH);
  for(let i=0;i<MAX;i++){X[i]=4+Math.random()*(W-8);Y[i]=hz+4+Math.random()*(H-hz-8);A[i]=Math.random()*6.283;PH[i]=Math.random();FLN[i]=.3+Math.random()*.45;}
  let sp0='',fr=0,now=0,flashN=0;const tm=g2tm();
  function setSp(sp){for(let i=0;i<MAX;i++)PER[i]=sp==='py'?5.9+(Math.random()*2-1)*.6:12+(Math.random()*2-1)*1.2;}
  function grid(n){HEAD.fill(-1);for(let i=0;i<n;i++){const g=clamp((Y[i]/R)|0,0,CH-1)*CW+clamp((X[i]/R)|0,0,CW-1);NEXT[i]=HEAD[g];HEAD[g]=i;}}
  // pulse coupling: only when someone flashes, every neighbour within 48 px gets phase += phase * 0.035
  function pulse(j){const gx=clamp((X[j]/R)|0,0,CW-1),gy=clamp((Y[j]/R)|0,0,CH-1);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const x=gx+ox,y=gy+oy;if(x<0||y<0||x>=CW||y>=CH)continue;
      for(let i=HEAD[y*CW+x];i>=0;i=NEXT[i]){if(i===j)continue;const dx=X[i]-X[j],dy=Y[i]-Y[j];if(dx*dx+dy*dy<R*R)PH[i]=Math.min(1,PH[i]+PH[i]*.035);}}}
  return {tick(dt){fr++;now+=dt;const sp=c.segv('sp'),cm=c.segv('cm'),n=CNT[c.v('n')],on=c.v('on');c.out('n',n);if(sp!==sp0){setSp(sp);sp0=sp;}
    for(let i=0;i<n;i++){A[i]+=(Math.random()-.5)*3*dt;if(X[i]<6)A[i]=0;else if(X[i]>W-6)A[i]=Math.PI;if(Y[i]<hz+4)A[i]=1.57;else if(Y[i]>H-4)A[i]=-1.57;X[i]+=Math.cos(A[i])*6*dt;Y[i]+=Math.sin(A[i])*4*dt;}
    // phase models: Kuramoto-style nudges every frame (trig per pair), by three neighbour searches
    const t0=performance.now();grid(n);const K=on?.05:0;
    if(cm==='naive'&&K){for(let i=0;i<n;i++){let s=0,m=0;const a=PH[i]*6.2832;for(let j=0;j<n;j++){const dx=X[j]-X[i],dy=Y[j]-Y[i];if(dx*dx+dy*dy<R*R){s+=Math.sin(PH[j]*6.2832-a);m++;}}FLASH[i]=0;PH[i]+=K*s/Math.max(1,m)*dt;}}
    else if(cm==='grid'&&K){for(let i=0;i<n;i++){let s=0,m=0;const a=PH[i]*6.2832,gx=clamp((X[i]/R)|0,0,CW-1),gy=clamp((Y[i]/R)|0,0,CH-1);
        for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const x=gx+ox,y=gy+oy;if(x<0||y<0||x>=CW||y>=CH)continue;for(let j=HEAD[y*CW+x];j>=0;j=NEXT[j]){const dx=X[j]-X[i],dy=Y[j]-Y[i];if(dx*dx+dy*dy<R*R){s+=Math.sin(PH[j]*6.2832-a);m++;}}}PH[i]+=K*s/Math.max(1,m)*dt;}}
    else if(cm==='mean'&&K){CS.fill(0);CC.fill(0);const CN=new Float32Array(CW*CH);for(let i=0;i<n;i++){const g=clamp((Y[i]/R)|0,0,CH-1)*CW+clamp((X[i]/R)|0,0,CW-1),a=PH[i]*6.2832;CS[g]+=Math.sin(a);CC[g]+=Math.cos(a);CN[g]++;}
      for(let i=0;i<n;i++){const gx=clamp((X[i]/R)|0,0,CW-1),gy=clamp((Y[i]/R)|0,0,CH-1);let S=0,C=0,m=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const x=gx+ox,y=gy+oy;if(x<0||y<0||x>=CW||y>=CH)continue;const g=y*CW+x;S+=CS[g];C+=CC[g];m+=CN[g];}
        const a=PH[i]*6.2832;PH[i]+=K*(S*Math.cos(a)-C*Math.sin(a))/Math.max(1,m)*dt;}}
    for(let i=0;i<n;i++){PH[i]+=dt/PER[i];if(PH[i]>=1){PH[i]-=1;if(PH[i]>=1)PH[i]=0;LIT[i]=0;BC[i]=sp==='py'?1:5+((Math.random()*4)|0);flashN++;if(cm==='pulse'&&on)pulse(i);}}
    tm.add(performance.now()-t0);
    u.set(bg);let lit=0,sx=0,sy=0;
    for(let i=0;i<n;i++){const a=PH[i]*6.2832;sx+=Math.cos(a);sy+=Math.sin(a);let f=-1,z=0;
      if(LIT[i]>=0){LIT[i]+=dt;const t=LIT[i];
        if(sp==='py'){const L=FLN[i];if(t<L){f=t<1/60?0:Math.min(3,(t/L*4)|0);z=Math.min(2,Math.round(t/L*5));}else LIT[i]=-1;}
        else{const k=(t/.55)|0,p=t-k*.55;if(k>=BC[i])LIT[i]=-1;else if(p<.13)f=p<.04?0:p<.09?1:2;else if(p<.18)f=3;}}
      const xx=Math.round(X[i]),yy=Math.round(Y[i])-z;
      if(f>=0){lit++;g2halo(u,W,H,xx,yy,f);}else g2p(u,W,H,xx,yy,G2.ff3);}
    g2grassFront(u,W,H,now,2);
    F.put();
    if(fr%10===1){const r=Math.hypot(sx,sy)/Math.max(1,n);setHud(root,`${n} flies · ${Math.round(lit/n*100)}% lit`);
      ro.innerHTML=`${sp==='py'?'P. pyralis: one flash every 5.9 ± 0.6 s, 0.3 to 0.75 s long':'P. carolinus: bursts of 5 to 8 flashes 0.55 s apart, then dark, about every 12 s'} · phase order <b>${r.toFixed(2)}</b> (1 = all in step)<br>lit now <b>${Math.round(lit/n*100)}%</b> (real pyralis about 8%, above 25% reads as noise) · coupling ${on?`48 px, ${cm==='pulse'?'phase += phase·0.035 on each neighbour flash':'every frame with trig, '+cm}`:'off'}<br>coupling cost measured here: <b>${g2ms(tm.v)} ms</b> · §6a measured, 1,000 flies: naive <b>1.14 ms</b>, grid <b>0.42 ms</b>, mean field <b>0.067 ms</b>`;}}};});

// ======================================================================
// G2: glow by pre-drawn halo sprites vs a per-pixel radial loop vs one light per fly
// ======================================================================
reg('halos',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),AT=PX(cvs[1]),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const bg=g2nightScene(W,H,9),hz=Math.round(H*.2),MAX=200,X=new Float32Array(MAX),Y=new Float32Array(MAX),A=new Float32Array(MAX),P=new Float32Array(MAX);
  for(let i=0;i<MAX;i++){X[i]=4+Math.random()*(W-8);Y[i]=hz+4+Math.random()*(H-hz-8);A[i]=Math.random()*6.283;P[i]=Math.random()*3;}
  // the atlas strip: four frames on the night ground
  {const a=AT.u32;a.fill(G2.ng1);for(let f=0;f<4;f++)g2halo(a,AT.W,AT.H,3+f*7,3,f);AT.put();}
  let fr=0,now=0,drop=0,offc=0,cols=0;const tm=g2tm(),ord=new Int32Array(MAX);
  const LC=un32(G2.ff1);
  return {tick(dt){fr++;now+=dt;const n=c.v('n'),m=c.segv('m');c.out('n',n);
    for(let i=0;i<n;i++){A[i]+=(Math.random()-.5)*3*dt;if(X[i]<6)A[i]=0;else if(X[i]>W-6)A[i]=Math.PI;if(Y[i]<hz+4)A[i]=1.57;else if(Y[i]>H-4)A[i]=-1.57;X[i]+=Math.cos(A[i])*6*dt;Y[i]+=Math.sin(A[i])*4*dt;}
    u.set(bg);const t0=performance.now();drop=0;
    if(m==='sprite'){for(let i=0;i<n;i++){const f=Math.min(3,((now+P[i])%3)/.4|0);g2halo(u,W,H,X[i],Y[i],f);}}
    else if(m==='radial'){for(let i=0;i<n;i++){const b=1-Math.min(1,((now+P[i])%3)/1.6),cx=Math.round(X[i]),cy=Math.round(Y[i]);
        for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=W||y>=H)continue;const d=Math.hypot(dx,dy)/5.5;if(d>=1)continue;const k=(1-d)*(1-d)*b;u[y*W+x]=mix32(u[y*W+x],d<.2?G2.ff0:G2.ff1,k);}}}
    else{// one light each: additive, and the canvas item takes 15 at most; lights past that just are not drawn
      for(let i=0;i<n;i++)ord[i]=i;const o=Array.from(ord.subarray(0,n)).sort((a,b)=>Y[a]-Y[b]);
      for(let r=0;r<n;r++){const i=o[r];if(r>=15){drop++;g2p(u,W,H,X[i],Y[i],G2.ff3);continue;}const b=1-Math.min(1,((now+P[i])%3)/1.6),cx=Math.round(X[i]),cy=Math.round(Y[i]);
        for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=W||y>=H)continue;const d=Math.hypot(dx,dy)/7.5;if(d>=1)continue;const k=(1-d)*(1-d)*b*1.6,q=un32(u[y*W+x]);u[y*W+x]=pack(q[0]+255*k,q[1]+250*k,q[2]+190*k);}}}
    tm.add(performance.now()-t0);
    g2grassFront(u,W,H,now,4);F.put();
    if(fr%10===1){offc=g2off(u);cols=new Set(u).size;setHud(root,m==='sprite'?'palette steps, normal alpha':m==='radial'?'smooth falloff per pixel':`additive, ${Math.min(15,n)} of ${n} lit`);
      ro.innerHTML=`off-palette colours on screen: <b>${offc}</b> of ${cols} · ${m==='light'?`lights not drawn (cap 15 per canvas item): <b>${drop}</b>`:'no light objects'}<br>glow cost measured here, ${n} flies on the CPU: <b>${g2ms(tm.v)} ms</b> (sprites here are pixel writes from a table)<br>§6a measured: 1,000 additive 9x9 halos on the M4 GPU <b>0.0047 ms</b>, on SwiftShader <b>13.8 ms</b> · CPU, 200 glows: radial loop <b>0.052 ms</b> vs sprites <b>0.19 ms</b>`;}}};});

// ======================================================================
// G3: rabbit, frog and cricket: flee rings, hops, a threat check every 200 ms
// ======================================================================
reg('critters',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const TS=8,TW=W/TS,TH=H/TS,PCX=30,PCY=94,PRX=28,PRY=14,inPond=(x,y)=>((x-PCX)/PRX)**2+((y-PCY)/PRY)**2<.8;
  const BUSH={x:168,y:30},TALL=new Uint8Array(TW*TH),bg=g2ground(W,H,101);
  for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)if(tx>=10&&tx<=17&&ty>=8&&ty<=12&&g2H(tx,ty,1)>.12)TALL[ty*TW+tx]=1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=((x-PCX)/PRX)**2+((y-PCY)/PRY)**2;if(d<1)bg[y*W+x]=d>.8?G2.w2:d>.4?G2.w1:G2.w0;else if(d<1.15)bg[y*W+x]=g2H(x,y,3)<.5?G2.d2:G2.d1;}
  const tufts=[];for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)if(TALL[ty*TW+tx])for(let k=0;k<3;k++)tufts.push({i:ty*TW+tx,x:tx*TS+1+((g2H(tx,ty,k)*6)|0),y:ty*TS+3+((g2H(tx,ty,k+4)*5)|0),h:7+((g2H(tx,ty,k+8)*3)|0),v:k});
  tufts.sort((a,b)=>a.y-b.y);
  const P={x:60,y:40,left:false,anim:0,moving:false};let tgt=null,idle=9,now=0,fr=0,cool=0,lastTile=-1,flushed=0,checks=0,autoCut=4;const route=[[60,40],[140,52],[120,92],[96,72],[70,82],[40,60]];let ri=0;
  pointer(cv,(p,k)=>{if(k!=='down')return;const ti=clamp((p[1]/TS)|0,0,TH-1)*TW+clamp((p[0]/TS)|0,0,TW-1);idle=0;if(TALL[ti])cut(ti);else tgt=[clamp(p[0],4,W-4),clamp(p[1],12,H-2)];});
  const R={x:150,y:44,st:0,t:2,chk:0,flee:false,z:0,hop:null,left:true,nib:0,blink:0},Fg={x:58,y:88,st:0,t:3,chk:.1,z:0,hop:null,left:true,blink:0,sp:0},CR=[],leaves=[],rip=[];
  const RSIT=["....r.r","....rrr",".rrrrrk","wrrrrr.",".RR.RR."],RNIB=["......."," ...r.r","....rrr","wrrrrrk",".RRRRR."].map(s=>s.replace(' ','.')),RHOP=["......r","....rrr","wrrrrrk",".rrrr..","R....R."],RM={r:G2.rb,R:G2.rb2,w:G2.rbw,k:G2.ink};
  const FS=[".e.e.","fffff","fFfFf","f...f"],FL=[".e.e.","fffff",".fFf.","f...f","f...f"],FM={e:G2.ink,f:G2.fg,F:G2.fg2},CK=["c.c","CcC"],CM={c:G2.ck,C:G2.ck2};
  function hopTo(e,a,dist,dur,peak){e.hop={fx:e.x,fy:e.y,tx:clamp(e.x+Math.cos(a)*dist,4,W-4),ty:clamp(e.y+Math.sin(a)*dist*.8,14,H-3),k:0,dur,peak};e.left=Math.cos(a)<0;}
  function hopStep(e,dt){const h=e.hop;h.k=Math.min(1,h.k+dt/h.dur);e.x=lerp(h.fx,h.tx,h.k);e.y=lerp(h.fy,h.ty,h.k);e.z=Math.sin(Math.PI*h.k)*h.peak;if(h.k>=1){e.hop=null;e.z=0;return true;}return false;}
  function cut(ti){TALL[ti]=2;const x=(ti%TW)*TS+4,y=((ti/TW)|0)*TS+6;for(let k=0;k<5;k++)leaves.push({x,y,z:2,vx:(Math.random()*2-1)*26,vz:30+Math.random()*25,a:0,col:k&1?G2.g5:G2.s2});if(Math.random()<.25)flush(x,y);}
  function flush(x,y){flushed++;CR.push({x,y,z:0,hop:null,n:1+((Math.random()*3)|0),a:Math.random()*6.283,left:false,rest:.15});}
  const dP=e=>Math.hypot(e.x-P.x,e.y-P.y);
  return {tick(dt){fr++;now+=dt;idle+=dt;const rings=c.v('rings');
    if(tgt&&idle<5){if(g2move(P,tgt[0],tgt[1],34,dt))tgt=null;}else if(g2move(P,route[ri][0],route[ri][1],30,dt))ri=(ri+1)%route.length;
    if(idle>5){autoCut-=dt;if(autoCut<=0){autoCut=5;const opts=[];for(let i=0;i<TALL.length;i++)if(TALL[i]===1)opts.push(i);if(opts.length)cut(opts[(Math.random()*opts.length)|0]);}}
    // walking into a tall tile: 1 to 3% flush, with a cooldown (Kingsfoil table)
    cool-=dt;const pt=clamp((P.y/TS)|0,0,TH-1)*TW+clamp((P.x/TS)|0,0,TW-1);if(pt!==lastTile){lastTile=pt;if(TALL[pt]===1&&cool<=0&&Math.random()<.03){flush(P.x,P.y);cool=2;}}
    // rabbit: nibble, check every 200 ms, flee inside 4 tiles, stop past 8, dive into the bush
    if(R.st!==3){R.chk-=dt;if(R.chk<=0){R.chk=.2;checks++;R.blink=1;const d=dP(R);if(d<32)R.flee=true;else if(d>64)R.flee=false;}}
    if(R.st===3){R.t-=dt;if(R.t<=0&&Math.hypot(P.x-BUSH.x,P.y-BUSH.y)>50){R.st=0;R.x=BUSH.x-12;R.y=BUSH.y+12;R.flee=false;R.t=2;}}
    else if(R.hop){if(hopStep(R,dt)){if(Math.hypot(R.x-BUSH.x,R.y-BUSH.y)<10){R.st=3;R.t=6+Math.random()*4;for(let k=0;k<4;k++)leaves.push({x:BUSH.x,y:BUSH.y,z:6,vx:(Math.random()*2-1)*20,vz:20+Math.random()*20,a:0,col:G2.bush3});}}}
    else if(R.flee){const away=Math.atan2(R.y-P.y,R.x-P.x),tob=Math.atan2(BUSH.y-R.y,BUSH.x-R.x);let a=Math.cos(away-tob)>-.2?tob:away;hopTo(R,a+(Math.random()-.5)*.4,10,.22,3);}
    else{R.t-=dt;R.nib+=dt;if(R.t<=0){R.t=2+Math.random()*5;hopTo(R,Math.random()*6.283,4,.2,2);}}
    // frog: leap toward the pond inside 3 tiles: 0.8 s, about 1.1 tiles high
    if(Fg.st!==3){Fg.chk-=dt;if(Fg.chk<=0){Fg.chk=.2;checks++;Fg.blink=1;if(dP(Fg)<24&&Fg.st===0)Fg.st=1;}}
    if(Fg.st===3){Fg.t-=dt;if(Fg.t<=0&&Math.hypot(P.x-58,P.y-88)>50){Fg.st=0;Fg.x=58;Fg.y=88;}}
    else if(Fg.hop){if(hopStep(Fg,dt)&&inPond(Fg.x,Fg.y)){Fg.st=3;Fg.t=5+Math.random()*3;rip.push({x:Fg.x,y:Fg.y,a:0});}}
    else if(Fg.st===1)hopTo(Fg,Math.atan2(PCY-Fg.y,PCX-Fg.x),14,.8,9);
    for(let j=CR.length-1;j>=0;j--){const k=CR[j];if(k.hop){if(hopStep(k,dt)){k.n--;k.rest=.12;}}else{k.rest-=dt;if(k.rest<=0){if(k.n<=0){CR.splice(j,1);continue;}k.a+=(Math.random()-.5)*1.6;hopTo(k,k.a,8,.45,2);}}}
    for(let j=leaves.length-1;j>=0;j--){const l=leaves[j];l.a+=dt;l.vz-=110*dt;l.x+=l.vx*dt;l.z=Math.max(0,l.z+l.vz*dt);if(l.a>.8)leaves.splice(j,1);}
    for(let j=rip.length-1;j>=0;j--){rip[j].a+=dt;if(rip[j].a>.7)rip.splice(j,1);}
    // draw
    u.set(bg);
    for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)if(TALL[ty*TW+tx]===2)for(let k=0;k<4;k++){const x=tx*TS+1+((g2H(tx,ty,k+20)*6)|0),y=ty*TS+2+((g2H(tx,ty,k+30)*5)|0);g2p(u,W,H,x,y,G2.s1);g2p(u,W,H,x,y-1,G2.s2);}
    for(const r of rip)g2ring(u,W,H,r.x,r.y,1+r.a*10,G2.w3,.5,1);
    g2disc(u,W,H,BUSH.x+2,BUSH.y+1,13,G2.g0,1,.6);g2disc(u,W,H,BUSH.x,BUSH.y-6,13,G2.bush,4,.75);g2disc(u,W,H,BUSH.x-2,BUSH.y-8,9,G2.bush2,4,.75);g2disc(u,W,H,BUSH.x-4,BUSH.y-10,5,G2.bush3,4,.75);
    if(rings){if(R.st!==3){g2ring(u,W,H,R.x,R.y,32,G2.red,.8,2);g2ring(u,W,H,R.x,R.y,64,G2.gold,.8,3);}if(Fg.st!==3)g2ring(u,W,H,Fg.x,Fg.y,24,G2.red,.8,2);}
    const ents=[{y:P.y,k:'p'}];if(R.st!==3)ents.push({y:R.y,k:'r'});if(Fg.st!==3)ents.push({y:Fg.y,k:'f'});for(const k of CR)ents.push({y:k.y,k:'c',o:k});ents.sort((a,b)=>a.y-b.y);
    let ei=0;const drawE=e=>{if(e.k==='p'){g2shadow(u,W,H,P.x,P.y+1,5,g2DK);g2walker(u,W,H,P.x,P.y,P);}
      else if(e.k==='r'){g2shadow(u,W,H,R.x,R.y+1,5,g2DK);g2spr(u,W,H,R.hop?RHOP:((R.nib%1.4)<.5?RNIB:RSIT),RM,R.x,R.y-Math.round(R.z),R.left);if(rings&&R.blink>0){g2p(u,W,H,R.x,R.y-9,G2.fw);R.blink=0;}}
      else if(e.k==='f'){g2shadow(u,W,H,Fg.x,Fg.y+1,3,g2DK);g2spr(u,W,H,Fg.hop?FL:FS,FM,Fg.x,Fg.y-Math.round(Fg.z));if(rings&&Fg.blink>0){g2p(u,W,H,Fg.x,Fg.y-7,G2.fw);Fg.blink=0;}}
      else{const k=e.o;g2p(u,W,H,k.x,k.y+1,g2DK(u[clamp(Math.round(k.y+1),0,H-1)*W+clamp(Math.round(k.x),0,W-1)]));g2spr(u,W,H,CK,CM,k.x,k.y-Math.round(k.z));}};
    for(const q of tufts){if(TALL[q.i]!==1)continue;while(ei<ents.length&&ents[ei].y<q.y)drawE(ents[ei++]);g2tuft(u,W,H,q.x,q.y,q.h,Math.sin(now*1.5+q.x*.1)>.85?1:0,G2TUFT,q.v);}
    while(ei<ents.length)drawE(ents[ei++]);
    for(const l of leaves)g2p(u,W,H,l.x,l.y-l.z,l.col);
    F.put();
    if(fr%8===1){setHud(root,'tap to walk · tap tall grass to cut');
      ro.innerHTML=`rabbit: <b>${R.st===3?'hidden in the bush':R.flee?'fleeing':'nibbling'}</b> (flee inside 4 tiles, stop past 8) · frog: <b>${Fg.st===3?'in the pond':Fg.hop?'leaping':'sitting'}</b> (3 tiles, 0.8 s leaps)<br>threat checks so far <b>${checks}</b>, one per critter every 200 ms · crickets flushed <b>${flushed}</b> (25% per cut here, 1 to 3% per tile walked)<br>§6a measured: 1,000 butterflies updating with flee in <b>0.012 ms</b> · report: 100 critters well under 0.1 ms in GDScript (estimate)`;}}};});

// ======================================================================
// G4: dandelion seeds, pollen and petals on the wind, wrapped in world space
// ======================================================================
reg('seeds',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const WW=384,bg=g2ground(WW,H,111),PXM=32;
  const DL=[34,104,176,250,322].map((x,i)=>({x,y:66+((i*17)%30),h:30+(i%3),n:14,re:0}));
  const SD=[],MOTE=[],PET=[];for(let i=0;i<60;i++)MOTE.push({x:Math.random()*WW,y:8+Math.random()*(H-12),p:Math.random()*6.283});for(let i=0;i<14;i++)PET.push({x:Math.random()*WW,y:8+Math.random()*(H-12),p:Math.random()*6.283,col:i&1?G2.fp:G2.fw});
  let now=0,fr=0,camX=0,last=null;const tm=g2tm();
  c.btn('gust',()=>{for(const d of DL)for(let k=0;k<5&&d.n>0;k++)release(d);});
  function release(d){d.n--;SD.push({x:d.x+(Math.random()-.5)*4,y:d.y,z:d.h+(Math.random()-.5)*3,z0:d.h,x0:d.x,t:0,up:0,rest:0});}
  return {tick(dt){fr++;now+=dt;const wind=c.v('wind'),pan=c.v('pan'),scr=c.segv('wrap')==='screen';c.out('wind',wind.toFixed(1)+' m/s');
    camX=pan?Math.round(96+Math.sin(now*.25)*96):96;const wpx=wind*PXM;
    for(const d of DL){if(d.n>0&&wind>.2&&Math.random()<dt*.5*wind)release(d);d.re+=dt;if(d.re>3&&d.n<14){d.n++;d.re=0;}}
    // seeds: sink at 39.1 cm/s = 12.5 px/s at 32 px per metre; 0.1% per update a lift
    for(let j=SD.length-1;j>=0;j--){const s=SD[j];if(s.rest>0){s.rest-=dt;if(s.rest<=0)SD.splice(j,1);continue;}s.t+=dt;
      if(s.up>0)s.up-=dt;else if(Math.random()<.001)s.up=1;
      s.x+=(wpx*(.9+.2*Math.sin(s.t*3+j))+Math.sin(s.t*5+j)*3)*dt;s.z+=(s.up>0?10:-12.5+Math.sin(s.t*6+j)*2)*dt;
      if(s.z<=0){s.z=0;s.rest=1.5;if(s.z0>25)last={t:s.t,d:s.x-s.x0};}}
    const t0=performance.now();
    for(const m of MOTE){m.x+=(wpx*.6+Math.sin(now*1.3+m.p)*3)*dt;m.y+=Math.cos(now*.9+m.p)*2*dt;m.x=((m.x%WW)+WW)%WW;if(m.y<6)m.y=H-4;if(m.y>H-3)m.y=6;}
    for(const p of PET){p.x+=(wpx*.8+Math.sin(now*2+p.p)*8)*dt;p.y+=(4+Math.cos(now*2.4+p.p)*6)*dt;p.x=((p.x%WW)+WW)%WW;if(p.y>H-3)p.y=6;}
    const t1=performance.now();
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)u[y*W+x]=bg[y*WW+((x+camX)%WW)];
    for(const d of DL){const X=d.x-camX;if(X<-8||X>W+8)continue;for(let j=0;j<d.h;j++)g2p(u,W,H,X+(j>d.h*.7&&Math.sin(now*2+d.x)>.5?1:0),d.y-j,j<4?G2.g2:G2.g3);
      g2p(u,W,H,X-1,d.y-1,G2.g4);g2p(u,W,H,X+1,d.y-2,G2.g4);const hy=d.y-d.h;for(let k=0;k<d.n;k++){const a=k/14*6.283;g2p(u,W,H,X+Math.round(Math.cos(a)*2.6),hy+Math.round(Math.sin(a)*2.6),k&1?G2.fw:G2.wo2);}g2p(u,W,H,X,hy,G2.s1);}
    for(const s of SD){const X=Math.round(s.x-camX),Y=Math.round(s.y),Z=Math.round(s.z);if(X<0||X>=W)continue;g2p(u,W,H,X,Y,g2DK(u[clamp(Y,0,H-1)*W+clamp(X,0,W-1)]));g2p(u,W,H,X,Y-Z,G2.fw);g2p(u,W,H,X,Y-Z-1,G2.wo2);}
    const t2=performance.now();
    for(const m of MOTE){const X=scr?Math.round(m.x)%W:Math.round(m.x-camX);if(X>=0&&X<W)g2p(u,W,H,X,m.y,G2.fy);}
    for(const p of PET){const X=scr?Math.round(p.x)%W:Math.round(p.x-camX);if(X<0||X>=W-1)continue;if(((now*4+p.p)|0)&1){g2p(u,W,H,X,p.y,p.col);g2p(u,W,H,X+1,p.y,p.col);}else{g2p(u,W,H,X,p.y,p.col);g2p(u,W,H,X,p.y+1,p.col);}}
    tm.add(t1-t0+performance.now()-t2);
    F.put();
    if(fr%10===1){setHud(root,scr?'screen-space wrap: motes slide with the camera':'world-space wrap');
      ro.innerHTML=`wind <b>${wind.toFixed(1)} m/s</b> = ${Math.round(wpx)} px/s at 32 px per metre · seeds fall at 39.1 cm/s = 12.5 px/s${last?` · last seed from the top: <b>${last.t.toFixed(1)} s</b> in the air, <b>${(last.d/PXM).toFixed(1)} m</b> downwind`:''}<br>motes and petals alive: <b>${MOTE.length+PET.length}</b>, always, since they wrap instead of dying · cost measured here (update + pixel writes): <b>${g2ms(tm.v)} ms</b><br>§6a measured: 500 motes update in <b>0.0031 ms</b>, draw as pixel writes in <b>0.012 ms</b>, one fillRect each <b>0.094 ms</b>`;}}};});

// ======================================================================
// G5: spawn tables by biome, season, hour and weather; anchors, a pool, caps
// ======================================================================
reg('spawn',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const VH=104,day=g2ground(W,VH,121),PCX=154,PCY=78,PRX=30,PRY=17;
  for(let y=0;y<VH;y++)for(let x=0;x<W;x++){const d=((x-PCX)/PRX)**2+((y-PCY)/PRY)**2;if(d<1)day[y*W+x]=d>.8?G2.w2:d>.4?G2.w1:G2.w0;else if(d<1.12)day[y*W+x]=G2.d2;
    const py=58+Math.sin(x/30)*6;if(Math.abs(y-py)<2.5&&d>1.12)day[y*W+x]=g2H(x,y,2)<.15?G2.d3:G2.d2;}
  const NIGHT=new Map();for(const [a,b] of [['g1','ng1'],['g2','ng1'],['g3','ng2'],['g4','ng3'],['g0','ng0'],['d2','b1'],['d3','b2'],['d1','b1'],['w0','n0'],['w1','n1'],['w2','w0']])NIGHT.set(G2[a],G2[b]);
  const nightBg=Uint32Array.from(day,v=>NIGHT.get(v)??v);
  const FLW=[[24,22],[30,28],[18,30],[60,84],[68,90],[54,92],[100,20],[108,26]],REED=[[126,70],[128,80],[132,64],[180,66],[176,90]],LAMP=[[44,52],[112,52]],BUSH=[[176,22]];
  const KINDS={bfly:{anc:FLW,col:G2.bf1},bee:{anc:FLW,col:G2.bee},dfly:{anc:REED,col:G2.df},ffly:{anc:FLW.concat([[80,40],[150,30],[30,70]]),col:G2.ff1},moth:{anc:LAMP,col:G2.moth},frog:{anc:REED,col:G2.fg},rabbit:{anc:BUSH,col:G2.rb}};
  const POOL=24,S=[];for(let i=0;i<POOL;i++)S.push({on:false});
  let now=0,fr=0,spT=0,spawns=0,desp=0,cam={x:40,y:30};const VW=96,VHh=56,RANGE=24;
  function targets(season,hr,wx){const dayT=hr>=6&&hr<19,night=hr>=20||hr<5,rain=wx==='rain',windy=wx==='wind',fly=!rain&&!windy,T={};
    T.bfly=fly&&dayT&&hr<15&&(season<=1)?[4,6][season]:0;
    T.bee=fly&&dayT&&season<3?[3,4,1][season]:0;
    T.dfly=!windy&&!rain&&dayT&&season<3?[1,2,1][season]:0;
    T.ffly=!windy&&(hr>=20&&hr<23.5)&&season<=1?[3,8][season]:0;
    T.moth=!windy&&night&&season<3?[2,3,2][season]*LAMP.length/2|0:0;
    T.frog=season<3?(rain?4:2):0;
    T.rabbit=!rain&&season<3?2:0;
    // Stardew-style cap on ambient critters: 10, or 20 in summer; rain leaves only frogs
    const cap=season===1?20:10;let amb=T.bfly+T.bee+T.rabbit+T.dfly;if(amb>cap){const f=cap/amb;for(const k of ['bfly','bee','rabbit','dfly'])T[k]=Math.floor(T[k]*f);}
    return T;}
  const inView=(x,y,m=0)=>x>=cam.x-m&&x<cam.x+VW+m&&y>=cam.y-m&&y<cam.y+VHh+m;
  function spawnOne(kind){const K=KINDS[kind],opts=K.anc.filter(([x,y])=>!inView(x,y)&&inView(x,y,RANGE));if(!opts.length)return false;const slot=S.find(s=>!s.on);if(!slot)return false;
    const [ax,ay]=opts[(Math.random()*opts.length)|0];Object.assign(slot,{on:true,k:kind,ax,ay,x:ax+(Math.random()-.5)*6,y:ay+(Math.random()-.5)*4,ph:Math.random()*6,z:kind==='frog'||kind==='rabbit'?0:5,t:0});spawns++;
    if(Math.random()<.4){const s2=S.find(s=>!s.on);if(s2){Object.assign(s2,{...slot,x:slot.x+(Math.random()-.5)*32,y:slot.y+(Math.random()-.5)*20,ph:Math.random()*6});spawns++;}}return true;}
  const hx=(a,b,cc,d)=>((g2H(a,b,cc*31+d)*4294967296)>>>0).toString(16).padStart(8,'0');
  return {tick(dt){fr++;now+=dt;const season=+c.segv('season'),hr=c.v('hr'),wx=c.segv('wx');c.out('hr',(hr|0).toString().padStart(2,'0')+':'+(hr%1?'30':'00'));
    const night=hr>=19.5||hr<5.5,T=targets(season,hr,wx);
    cam.x=Math.round(48+Math.sin(now*.12)*44);cam.y=Math.round(24+Math.sin(now*.17)*20);
    // despawn anything that leaves the range; spawn off screen but in range, on anchors, every 0.5 s
    const cnt={};for(const s of S)if(s.on){if(!inView(s.x,s.y,RANGE+8)){s.on=false;desp++;}else cnt[s.k]=(cnt[s.k]||0)+1;}
    for(const s of S)if(s.on&&!T[s.k]&&!inView(s.x,s.y)){s.on=false;desp++;}
    spT-=dt;if(spT<=0){spT=.5;for(const k in T)if((cnt[k]||0)<T[k])spawnOne(k);}
    for(const s of S){if(!s.on)continue;s.t+=dt;const k=s.k;
      if(k==='bfly'){s.x+=Math.sin(s.t*1.3+s.ph)*14*dt;s.y+=Math.cos(s.t*.9+s.ph)*8*dt;s.z=5+Math.abs(Math.sin(s.t*4))*3;}
      else if(k==='bee'){if((s.t%2.4)<.4){s.x+=Math.cos(s.ph)*30*dt;s.y+=Math.sin(s.ph)*20*dt;}else if((s.t%2.4)<.45)s.ph=Math.atan2(s.ay-s.y,s.ax-s.x)+(Math.random()-.5)*2;}
      else if(k==='dfly'){if((s.t%1.6)<.15){s.x+=Math.cos(s.ph)*60*dt;s.y+=Math.sin(s.ph)*30*dt;}else if((s.t%1.6)<.2)s.ph=Math.atan2(s.ay-6-s.y,s.ax-s.x)+(Math.random()-.5)*2.5;}
      else if(k==='ffly'){s.x+=Math.cos(s.t*.5+s.ph)*5*dt;s.y+=Math.sin(s.t*.4+s.ph)*3*dt;}
      else if(k==='moth'){const a=s.t*3*(s.ph>3?1:-1);s.x=s.ax+Math.cos(a)*7;s.y=s.ay-10+Math.sin(a)*4;}
      else if(k==='frog'||k==='rabbit'){if((s.t%3)<.3){s.x+=Math.cos(s.ph)*14*dt;s.y+=Math.sin(s.ph)*8*dt;}else if((s.t%3)<.35)s.ph=Math.atan2(s.ay-s.y,s.ax-s.x)+(Math.random()-.5)*3;}}
    u.set(night?nightBg:day);u.fill(G2.ink,W*VH);
    for(const [x,y] of FLW)g2flower(u,W,VH,x,y,night?G2.fv:G2.fp,2,night?0:1);
    for(const [x,y] of REED){for(let j=0;j<9;j++)g2p(u,W,VH,x,y-j,G2.reed);g2p(u,W,VH,x,y-9,G2.cat);g2p(u,W,VH,x,y-10,G2.cat);}
    for(const [x,y] of BUSH){g2disc(u,W,VH,x,y-4,10,G2.bush,4,.7);g2disc(u,W,VH,x-2,y-6,6,G2.bush2,4,.7);}
    for(const [x,y] of LAMP){g2rect(u,W,VH,x,y-12,1,12,G2.iron);if(night){g2disc(u,W,VH,x,y-13,7,G2.lg1,.8,.9);g2rect(u,W,VH,x-1,y-14,3,2,G2.lamp);}else g2rect(u,W,VH,x-1,y-14,3,2,G2.iron2);}
    for(const s of S){if(!s.on)continue;const X=Math.round(s.x),Y=Math.round(s.y),k=s.k;
      if(k==='ffly'){const f=((s.t+s.ph)%4);if(f<.5)g2halo(u,W,VH,X,Y,Math.min(3,(f/.13)|0));else g2p(u,W,VH,X,Y,G2.ff3);}
      else if(k==='frog')g2spr(u,W,VH,[".e.e.","fffff","f...f"],{e:G2.ink,f:G2.fg},X,Y);
      else if(k==='rabbit')g2spr(u,W,VH,["...r.r","...rrr","wrrrrk",".R..R."],{r:G2.rb,R:G2.rb2,w:G2.rbw,k:G2.ink},X,Y);
      else if(k==='bfly'){g2p(u,W,VH,X,Y,g2DK(u[clamp(Y,0,VH-1)*W+clamp(X,0,W-1)]));g2spr(u,W,VH,G2BF[((s.t*8)|0)%2?0:2],{a:G2.bf1,b:G2.bf3,k:G2.bfk},X,Y-Math.round(s.z));}
      else if(k==='bee')g2spr(u,W,VH,[((fr>>1)&1)?"w.w":".w.","yky"],{w:G2.wing,y:G2.bee,k:G2.bee2},X,Y-4);
      else if(k==='dfly')g2spr(u,W,VH,["...ww..","dddddDH","...ww.."],{w:G2.wing,d:G2.df,D:G2.df2,H:G2.ink},X,Y-5);
      else g2spr(u,W,VH,[((fr>>2)&1)?"m.m":".m.",".M."],{m:G2.moth,M:G2.wo2},X,Y);}
    if(wx==='rain')for(let k=0;k<70;k++){const x=((g2H(k,1,3)*W+now*40)|0)%W,y=((g2H(k,2,3)*VH+now*160)|0)%VH;g2p(u,W,VH,x,y,G2.w3);g2p(u,W,VH,x-1,y-1,G2.w2);}
    // outside the camera: one palette step darker on a 50% checker; the range box is dotted
    for(let y=0;y<VH;y++)for(let x=0;x<W;x++)if(!inView(x,y)&&((x+y)&1))u[y*W+x]=g2DK(u[y*W+x]);
    for(let x=cam.x-RANGE;x<cam.x+VW+RANGE;x+=3){g2p(u,W,VH,x,cam.y-RANGE,G2.gold2);g2p(u,W,VH,x,cam.y+VHh+RANGE,G2.gold2);}for(let y=cam.y-RANGE;y<cam.y+VHh+RANGE;y+=3){g2p(u,W,VH,cam.x-RANGE,y,G2.gold2);g2p(u,W,VH,cam.x+VW+RANGE,y,G2.gold2);}
    for(let x=cam.x;x<cam.x+VW;x++){g2p(u,W,VH,x,cam.y,G2.fw);g2p(u,W,VH,x,cam.y+VHh-1,G2.fw);}for(let y=cam.y;y<cam.y+VHh;y++){g2p(u,W,VH,cam.x,y,G2.fw);g2p(u,W,VH,cam.x+VW-1,y,G2.fw);}
    // the pool: 24 fixed slots, nothing allocates
    for(let i=0;i<POOL;i++){const s=S[i],x=2+i*8,col=s.on?KINDS[s.k].col:G2.b1;g2rect(u,W,H,x,VH+2,7,5,col);}
    F.put();
    if(fr%10===1){const used=S.filter(s=>s.on).length,bucket=Math.floor(now/45);setHud(root,`${['spring','summer','autumn','winter'][season]} · ${wx} · ${night?'night':'day'}`);
      const names={bfly:'butterflies',bee:'bees',dfly:'dragonflies',ffly:'fireflies',moth:'moths',frog:'frogs',rabbit:'rabbits'};
      ro.innerHTML=Object.keys(T).map(k=>`${names[k]} <b>${cnt[k]||0}</b>/${T[k]}`).join(' · ')+`<br>pool <b>${used}</b> of ${POOL} slots · ambient cap ${season===1?20:10} · spawned <b>${spawns}</b>, despawned out of range <b>${desp}</b><br>seed hash(chunk 3, 1, bucket ${bucket}, world) = <b>${hx(3,1,bucket,7)}</b>, the same on every client`;}}};});
