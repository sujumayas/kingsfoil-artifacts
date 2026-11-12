// Magic study: figures 3 (ramps, elements, tiers, budget, screenfx, flashlimit, drawpaths, glow, particles, feedback, sigil, costs, wire, score)
{
// ----------------------------------------------------------------------
// small styles only these figures use
// ----------------------------------------------------------------------
{const st=document.createElement('style');st.textContent=
'.m3-sw{display:flex;gap:6px;margin-top:8px}'+
'.m3-sw div{flex:1 1 0;min-width:0;font:11px/1.35 "IBM Plex Mono",monospace;color:var(--mute);text-align:center}'+
'.m3-sw i{display:block;height:18px;border-radius:2px;border:1px solid rgba(255,255,255,.16);margin-bottom:3px}'+
'.m3-el{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}'+
'.m3-el p{margin:4px 0 0;font-size:12px;color:var(--mute);line-height:1.3}'+
'.m3-el p b{color:var(--lamp);font-weight:600;display:block}'+
'.m3-el .hit .stage{border-color:#ff8f7a;box-shadow:0 0 0 1px #ff8f7a}'+
'.m3-el .hit p b{color:#ff8f7a}'+
'.m3-strip{margin-top:8px;line-height:0;border:1px solid var(--line);border-radius:4px;background:#0b0a11;padding:4px}'+
'.m3-strip canvas{display:block;width:100%;height:24px;image-rendering:pixelated}'+
'.m3-keys{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12.5px;color:var(--mute);margin-top:6px}'+
'.m3-keys i{display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:-1px;margin-right:5px}'+
'.m3-warn{border-color:#ff8f7a!important;color:#ffb3a6!important}'+
'.m3-warn:disabled{opacity:.5;cursor:not-allowed}'+
'.m3-tri{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}'+
'.m3-tri p{margin:5px 0 0;font-size:12.5px;color:var(--mute);line-height:1.4}'+
'.m3-tri p b{color:var(--lamp);font-weight:600}'+
'.m3-tri p span{font:11.5px "IBM Plex Mono",monospace;color:var(--cool);display:block}'+
'@media (max-width:640px){.m3-el{gap:5px}.m3-el p{font-size:11px}.m3-tri{gap:6px}.m3-tri p{font-size:11.5px}.m3-sw div{font-size:10px}}';
document.head.appendChild(st);}

// ----------------------------------------------------------------------
// shared kit: colour maths, element ramps (dark edge 1 .. light core 5, 6 = the
// white of the one bright frame), a pixel pen, sprites, a flagstone ground
// ----------------------------------------------------------------------
const hx=U,cr=c=>c&255,cg=c=>c>>>8&255,cb=c=>c>>>16&255;
const addc=(a,b)=>{const r=cr(a)+cr(b),g=cg(a)+cg(b),l=cb(a)+cb(b);return (0xff000000|(l>255?255:l)<<16|(g>255?255:g)<<8|(r>255?255:r))>>>0;};
const mulk=(c,k)=>pack(cr(c)*k,cg(c)*k,cb(c)*k);
const mixf=(a,b,k)=>{const j=256-k;return (0xff000000|((cb(a)*j+cb(b)*k)>>8)<<16|((cg(a)*j+cg(b)*k)>>8)<<8|((cr(a)*j+cr(b)*k)>>8))>>>0;};
const lumv=c=>(.299*cr(c)+.587*cg(c)+.114*cb(c))/255;
const mtr=()=>{let s=-1,t0=0;return {a(){t0=performance.now();},b(){const d=performance.now()-t0;s=s<0?d:s+(d-s)*.08;return s;},get v(){return Math.max(0,s);}};};
const f3=v=>v<.0005?'under 0.001':v<.001?v.toFixed(4):v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);
const nf=n=>Math.round(n).toLocaleString('en-US');
const INK=hx('#15111c'),WHITE=pack(255,255,255),BLK=pack(0,0,0);
// the six sandbox elements first, then earth, death and physical from the report's element table
const ELS=[['Fire',['#4a1024','#b8281c','#f07818','#ffd040','#fff8dc']],['Ice',['#141e5c','#2860c0','#50b0ec','#b0ecff','#e8faff']],['Energy',['#28146c','#6040e0','#a088ff','#dcd2ff','#f2eeff']],
  ['Poison',['#0c3018','#28802c','#78cc28','#d4f458','#f6ffd0']],['Holy',['#5c3808','#c08418','#f4c848','#fff0a0','#fffbe4']],['Arcane',['#400848','#a8248c','#f058c4','#ffb0e8','#ffeaf8']],
  ['Earth',['#2c1c10','#5a3a20','#8a6238','#bc9860','#e4d0a4']],['Death',['#0c0814','#2c1244','#5e2a94','#a070d8','#dccaf8']],['Physical',['#34343e','#6c6c78','#a4a4b0','#d4d4dc','#f2f2f6']]];
const mkRamp=a=>{const r=new Uint32Array(7);r[0]=INK;for(let i=0;i<5;i++)r[i+1]=hx(a[i]);r[6]=WHITE;return r;};
const RP=ELS.map(e=>mkRamp(e[1]));
const TCSS=['#60f080','#50a0ff','#b4b4b4','#ff4040'],TCOL=TCSS.map(hx),TNAME=['own','party','others','hostile'];
function Pen(P){const u=P.u32,W=P.W,H=P.H,o={u,W,H,n:0,op:16,tint:0,
  p(x,y,c){x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;if(o.op<16&&BAYER[(y&3)*4+(x&3)]>=o.op)return;u[y*W+x]=o.tint?mixf(c,o.tint,150):c;o.n++;},
  add(x,y,c){x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;u[i]=addc(u[i],c);o.n++;},
  mix(x,y,c,k){x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;u[i]=mixf(u[i],c,k);o.n++;},
  line(x0,y0,x1,y1,c){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;
    for(let g=0;g<600;g++){o.p(x0,y0,c);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}},
  disc(cx,cy,r,c){const R=Math.ceil(r);for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++)if(i*i+j*j<=r*r+r*.6)o.p(cx+i,cy+j,c);},
  orb(x,y,r,rp){const R=Math.ceil(r)+1;x=Math.round(x);y=Math.round(y);for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const d=Math.hypot(i,j);if(d<=r*.42)o.p(x+i,y+j,rp[5]);else if(d<=r*.75)o.p(x+i,y+j,rp[4]);else if(d<=r)o.p(x+i,y+j,rp[3]);else if(d<=r+1)o.p(x+i,y+j,rp[0]);}},
  ell(cx,cy,rx,ry,c,a0=0,a1=1){const n=Math.max(8,((rx+ry)*3.4)|0);let lx=-999,ly=-999;for(let i=Math.floor(a0*n);i<=Math.ceil(a1*n);i++){const a=i/n*6.2832,x=Math.round(cx+Math.cos(a)*rx),y=Math.round(cy+Math.sin(a)*ry);if(x===lx&&y===ly)continue;lx=x;ly=y;o.p(x,y,c);}},
  star(x,y,c,c2){o.p(x,y,c);o.p(x-1,y,c2);o.p(x+1,y,c2);o.p(x,y-1,c2);o.p(x,y+1,c2);},
  spr(s,x,y,flip,tc,tk){const w=s.w,d=s.d;x=Math.round(x)-(w>>1);y=Math.round(y)-s.h+1;for(let j=0;j<s.h;j++){const yy=y+j;if(yy<0||yy>=H)continue;for(let i=0;i<w;i++){const c=d[j*w+(flip?w-1-i:i)];if(!c)continue;const xx=x+i;if(xx<0||xx>=W)continue;u[yy*W+xx]=tk?mixf(c,tc,tk):c;}}},
  blit(s,x,y,rp,noW){const d=s.d,w=s.w;x=Math.round(x)-s.ox;y=Math.round(y)-s.oy;for(let j=0,k=0;j<s.h;j++)for(let i=0;i<w;i++,k++){const v=d[k];if(v)o.p(x+i,y+j,rp[v===6&&noW?5:v]);}}};return o;}
function mkSpr(rows,pal){const h=rows.length,w=rows[0].length,d=new Uint32Array(w*h);rows.forEach((r,j)=>{for(let i=0;i<w;i++)if(r[i]!=='.')d[j*w+i]=pal[r[i]];});return {w,h,d};}
const MAGE=['.....oo.....','....ohho....','...ohhhho...','..ohhbbhho..','.oHHHHHHHHo.','..osssssso..','..osesseso..','..oossssoo..','.orrrbbrrro.','orrrrbbrrrro','osorrbbrroso','.oorrrrrroo.','.orrrrrrrro.','.orRrrrrRro.','.oRRRooRRRo.','..ooo..ooo..'];
const mpal=(h,H2,r,R2,b)=>({o:INK,h:hx(h),H:hx(H2),s:hx('#eab98e'),e:hx('#22161e'),r:hx(r),R:hx(R2),b:hx(b)});
const SP_OWN=mkSpr(MAGE,mpal('#5868e0','#38409c','#4a58cc','#2f3890','#ffd050')),SP_HEAL=mkSpr(MAGE,mpal('#f0ece0','#b8b0a0','#e6e0d2','#aaa292','#e8a838'));
const SP_CROWD=[['#a04848','#703030','#8c4040','#5e2a2a','#d0c090'],['#4c8050','#305838','#44744a','#2a4e32','#d0c090'],['#3c7c84','#28565c','#367078','#224a50','#c8c8c8'],['#806040','#58422c','#74583c','#4c3a28','#c8b070'],['#70707c','#4c4c58','#666672','#44444e','#b0b0c0'],['#a8703c','#744c28','#986636','#684422','#e0d0a0']].map(c=>mkSpr(MAGE,mpal(...c)));
const SP_MON=mkSpr(['.oo......oo.','omo......omo','ommoooooommo','.ommmmmmmmo.','omeemmmmeemo','ommmmmmmmmmo','ommmwwwwmmmo','ommmmmmmmmmo','.oMmmmmmmMo.','.oMMmooMMmo.','..oo.oo.oo..'],{o:INK,m:hx('#a03858'),M:hx('#6a2040'),e:hx('#ffe060'),w:hx('#f0e8d8')});
const SP_BOSS=(()=>{const s=SP_MON,w=s.w*2,h=s.h*2,d=new Uint32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)d[y*w+x]=s.d[(y>>1)*s.w+(x>>1)];return {w,h,d};})();
// ramp-indexed sprite: 0 clear, 1 dark outline, 2..5 edge to core, 6 the white flash. bake() adds the 1 px outline.
function bake(sz,fn,noOut){const w=sz*2+1,d=new Uint8Array(w*w);for(let y=0;y<w;y++)for(let x=0;x<w;x++)d[y*w+x]=fn(x-sz,y-sz)|0;const o=d.slice();if(noOut)return {w,h:w,ox:sz,oy:sz,d:o};
  for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x;if(d[i])continue;if((x>0&&d[i-1]>1)||(x<w-1&&d[i+1]>1)||(y>0&&d[i-w]>1)||(y<w-1&&d[i+w]>1))o[i]=1;}return {w,h:w,ox:sz,oy:sz,d:o};}
// missile bodies in (u forward, v sideways), the sandbox's four shapes: teardrop, shard, blob, ringed orb
const SHAPES=[
  (u,v)=>{const av=Math.abs(v);if(u>0){const r=Math.hypot(u,v);return r<1.3?5:r<2.3?4:r<3.2?3:0;}const hw=3.2*(1+u/10);if(hw<=0)return 0;return av<hw*.3&&u>-4?5:av<hw*.6?(u>-6?4:3):av<hw?(u>-5?3:2):0;},
  (u,v)=>{const q=Math.abs(v)/2.3+Math.abs(u+1)/(u>-1?5.5:7);if(q>=1)return 0;return Math.abs(v)<.6?5:v<0?4:u<-4?2:3;},
  (u,v)=>{const r=Math.hypot(u,v);if(r<3.3)return Math.hypot(u+1,v+1)<1.1?5:r<1.9?4:r<2.7?3:2;return u<-4&&u>-6.6&&Math.abs(v)<.8?3:0;},
  (u,v)=>{const r=Math.hypot(u,v);return r<1.2?5:r<2.2?4:r<3.2?3:r>3.9&&r<4.8&&(((Math.atan2(v,u)+3.2)*1.9|0)&1)?4:0;}];
const mkMs=(fn,noOut)=>{const a=[];for(let i=0;i<8;i++){const an=i*6.2832/8,c=Math.cos(an),s=Math.sin(an);a.push(bake(11,(x,y)=>fn(x*c+y*s,-x*s+y*c),noOut));}return a;};
const MS=SHAPES.map(fn=>mkMs(fn)),ELSHAPE=[0,1,3,2,3,3,2,2,1];
const dir8=(vx,vy)=>((Math.atan2(vy,vx)/6.2832*8+8.5)|0)&7;
// hit spark flipbooks, 5 frames: flash, core, broken ring, sparks, fragments. One shape language per element.
function bakeSpark(el,sc){const R=[4.2,7,8.6,9.6,10.6],HO=[0,0,2.6,5.6,8],TOP=[5,5,4,3,2],DROP=[0,0,.12,.5,.78],fr=[];
  for(let f=0;f<5;f++)fr.push(bake(Math.ceil(13*sc),(x,y)=>{let r=Math.hypot(x,y)/sc,m=1,top=TOP[f],ho=HO[f];const a=Math.atan2(y,x);
    if(el===0)m=1+.17*Math.sin(a*5+f)+.1*Math.sin(a*3-f*2);
    else if(el===1){m=.42+.8*Math.pow(Math.abs(Math.cos(a*3+.5)),7);ho*=.6;}
    else if(el===2){m=.45+.85*hash2(((a+3.2)*2.3)|0,f*3+1);}
    else if(el===3)m=1+.24*Math.sin(a*4+f*.7);
    else if(el===4){m=.5+1.05*Math.pow(Math.abs(Math.cos(a*2)),16);ho*=1.25;}
    else{r=(f&1?Math.max(Math.abs(x),Math.abs(y))*1.12:(Math.abs(x)+Math.abs(y))*.8)/sc;ho=[0,3.6,5.2,7,8.6][f];}
    const ro=R[f]*m;if(r>=ro||r<ho)return 0;if(DROP[f]&&hash2(x*7+f*31+el,y*13)<DROP[f])return 0;
    const t=(r-ho)/(ro-ho),tt=ho>0?Math.abs(t-.45)*1.8:t;return f===0&&t<.55?6:Math.max(2,Math.round(top-tt*(top-2)));},f>2));return fr;}
const SPK=[],SPKS=[],SPKT=[];for(let e=0;e<6;e++){SPK.push(bakeSpark(e,1));SPKS.push(bakeSpark(e,.58));SPKT.push(bakeSpark(e,.4));}
// courtyard flagstones with moss, optionally a grass rim; the same recipe as the sandbox floor
function mkGround(W,H,seed=1,o={}){const g=new Uint32Array(W*H),S=['#474b59','#505462','#5a5e6c'].map(hx),MORT=hx('#2b2d38'),GR=['#2c5a34','#35703a','#418240','#6aa84a'].map(hx);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const e=Math.min(x,W-1-x,y,H-1-y),n=vnoise((x+seed*9)/22,y/22)*13+vnoise(x/7+9,y/7+seed)*5;let c;
    if(o.grass&&e<o.grass-6+n*.8){const q=hash2(x,y+seed),v=vnoise(x/9,y/9+seed);c=v>.62?GR[2]:v>.35?GR[1]:GR[0];if(q>.94)c=GR[3];}
    else{const T=hash2((x>>4)+seed*7,(y>>4)+50),base=S[T>.66?2:T>.33?1:0],small=T>.8,m=small?7:15,mx=x&m,my=y&m;
      if(mx===0||my===0)c=MORT;else if(mx===1||my===1)c=addc(base,pack(14,14,14));else if(mx===m||my===m)c=mulk(base,.84);
      else{c=base;const q=hash2(x+7+seed,y+3);if(q<.07)c=mulk(base,.87);else if(q>.95)c=addc(base,pack(12,12,14));}
      if(vnoise((x+40)/18,(y+40)/18+seed)>.68&&hash2(x,y+9)>.35)c=mixf(c,GR[0],150);if(o.grass&&e<o.grass-3+n*.8)c=mixf(c,GR[0],100);}
    g[y*W+x]=o.dim?mulk(c,o.dim):c;}
  return g;}
const shadow=(g,W,H,cx,cy,rx)=>{for(let j=-2;j<=2;j++)for(let i=-rx;i<=rx;i++)if(i*i/(rx*rx)+j*j/5<1){const x=cx+i,y=cy+j;if(x>=0&&y>=0&&x<W&&y<H)g[y*W+x]=mulk(g[y*W+x],.6);}};

// ======================================================================
// E2 ramps, outlines and value contrast on busy ground
// ======================================================================
reg('ramps',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),W=P.W,H=P.H,u=P.u32,pen=Pen(P),ro=$('[data-ro]',root),sw=$('[data-sw]',root),m=mtr();
  const BW=W/3,G=new Uint32Array(W*H),GN=['flagstones','grass','sand'];
  // three busy grounds side by side: dark flagstones, mid grass, bright sand
  {const st=mkGround(W,H,5),GR=['#2c5a34','#35703a','#418240','#6aa84a','#8cc85a'].map(hx),SD=['#b89a62','#cfb47a','#e0c890','#eedcae','#f6ecd0'].map(hx);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const edge=x+Math.round(3*Math.sin(y*.35)+2*hash2(7,y)),b=edge<BW?0:edge<2*BW?1:2,q=hash2(x*3+1,y*5+2),v=vnoise(x/6,y/5);let col;
      if(b===0)col=st[y*W+x];else if(b===1){col=v>.6?GR[2]:v>.36?GR[1]:GR[0];if(q>.9)col=GR[3];if(q>.985)col=GR[4];if(q<.012)col=hx('#e8d860');}
      else{col=v>.62?SD[3]:v>.34?SD[2]:SD[1];if(q>.93)col=SD[4];if(q<.05)col=SD[0];if(q>.992)col=hx('#8a7a6a');}
      G[y*W+x]=col;}}
  const SH=[0,1,2,3],ELI=[0,1,3,4],bodies=SH.map(s=>mkMs(SHAPES[s],true)[0]);
  // masks of the 1 px ring and the second ring around a body
  const rings=s=>{const w=s.w,d=s.d,r1=new Uint8Array(w*w),r2=new Uint8Array(w*w),nb=(a,i,x,y)=>(x>0&&a[i-1])||(x<w-1&&a[i+1])||(y>0&&a[i-w])||(y<w-1&&a[i+w]);
    for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!d[i]&&nb(d,i,x,y))r1[i]=1;}
    for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!d[i]&&!r1[i]&&nb(r1,i,x,y))r2[i]=1;}return [r1,r2];};
  const RG=bodies.map(rings),M=new Uint8Array(W*H);let tt=0,ramp=null,lastKey='';
  const STEP={3:[0,1,1,3,3,5],4:[0,1,2,2,4,5],5:[0,1,2,3,4,5]};
  function build(){const e=ELI[+c.segv('el')],n=c.v('steps'),hue=c.v('hue'),src=RP[e],mid=src[3],r=new Uint32Array(7);
    const flat=[0,.3,.5,.72,.9,1].map(k=>mulk(mid,k*1.15));
    for(let t=1;t<=5;t++){const s=STEP[n][t];r[t]=hue?src[s]:flat[s];}r[0]=INK;r[6]=WHITE;ramp=r;
    const uniq=[...new Set([1,2,3,4,5].map(t=>STEP[n][t]))];
    sw.innerHTML=uniq.map((s,i)=>{const col=hue?src[s]:flat[s],v=Math.max(cr(col),cg(col),cb(col))/255;return `<div><i style="background:${hexOf3(cr(col),cg(col),cb(col))}"></i>${i===0?'edge':i===uniq.length-1?'core':'step '+(i+1)}<br>value ${Math.round(v*100)}%</div>`;}).join('');}
  function frame(){const k=c.segv('el')+c.v('steps')+c.v('hue');if(k!==lastKey){build();lastKey=k;c.out('steps',c.v('steps'));}
    const si=+c.segv('el'),s=bodies[si],[r1,r2]=RG[si],mode=c.segv('out'),w=s.w,acc=[0,0,0],cnt=[0,0,0];
    m.a();u.set(G);M.fill(0);
    for(let b=0;b<3;b++){const x=Math.round(((tt*22+b*BW)%W+W)%W),y=Math.round(H/2+5*Math.sin(tt*1.7+b*2.1)),x0=x-s.ox,y0=y-s.oy;
      if(mode==='under'){for(let j=-9;j<=9;j++)for(let i=-17;i<=9;i++){const d=(i+4)*(i+4)/170+j*j/64;if(d<1&&(d<.55||dith(x+i,y+j,(1-d)*2.2))){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=mixf(u[yy*W+xx],INK,150);}}}
      for(let j=0,q=0;j<w;j++)for(let i=0;i<w;i++,q++){const xx=x0+i,yy=y0+j;if(xx<0||yy<0||xx>=W||yy>=H)continue;const v=s.d[q];let col=0;
        if(v)col=ramp[v];else if(r1[q]&&(mode==='dark'||mode==='double'))col=INK;else if(r2[q]&&mode==='double')col=ramp[4];
        if(col){u[yy*W+xx]=col;M[yy*W+xx]=1;}}
      // value step across the silhouette edge, by the ground under each edge pixel
      for(let j=-1;j<=w;j++)for(let i=-1;i<=w;i++){const xx=x0+i,yy=y0+j;if(xx<1||yy<1||xx>=W-1||yy>=H-1||!M[yy*W+xx])continue;const q=yy*W+xx,l=lumv(u[q]);
        for(const o of [-1,1,-W,W]){if(M[q+o])continue;const gb=xx<BW?0:xx<2*BW?1:2;acc[gb]+=Math.abs(l-lumv(u[q+o]));cnt[gb]++;}}}
    P.put();const ms=m.b();
    const val=acc.map((a,i)=>cnt[i]?a/cnt[i]*100:-1);let wi=-1;val.forEach((v,i)=>{if(v>=0&&(wi<0||v<val[wi]))wi=i;});
    for(let i=0;i<3;i++)if(val[i]>=0)keep[i]=val[i];
    setHud(root,`${c.v('steps')} steps · ${{none:'no outline',dark:'dark outline',double:'double outline',under:'dark underlay'}[mode]}`);
    const worst=keep.indexOf(Math.min(...keep));
    ro.innerHTML=`Value step across the bolt's edge: `+GN.map((n,i)=>`${n} <b${keep[i]<15?' style="color:#ff8f7a"':''}>${keep[i].toFixed(0)}%</b>`).join(', ')+`. Weakest on ${GN[worst]}${keep[worst]<15?', where the bolt melts into the ground':''}.`+
      `<br>Cost: a ramp is a 6-entry table. Ramp blit for 30 impacts of 32x32, 0.036 ms on the M4 and 0.24 ms at 6x throttle (report, measured). This canvas, <b>${f3(ms)} ms</b> (live).`;}
  const keep=[0,0,0];
  ['steps','hue'].forEach(k=>c.on(k,frame));c.seg('el',frame);c.seg('out',frame);
  frame();return {tick(dt){tt+=dt;frame();}};});

// ======================================================================
// E3 and §6f element language: ramp, shape and motion per element, colour-blind simulation
// ======================================================================
// Machado, Oliveira and Fernandes (2009) matrices at full severity, applied to sRGB as an approximation
const CVD={d:[.367322,.860646,-.227968,.280085,.672501,.047413,-.01182,.04294,.968881],p:[.152286,1.052583,-.204868,.114503,.786281,.099216,-.003882,-.048116,1.051998],t:[1.255528,-.076749,-.178779,-.078411,.930809,.147602,.004733,.691367,.3039]};
const cvd=(c,m)=>{if(!m)return c;const r=cr(c),g=cg(c),b=cb(c);return pack(m[0]*r+m[1]*g+m[2]*b,m[3]*r+m[4]*g+m[5]*b,m[6]*r+m[7]*g+m[8]*b);};
const toLab=c=>{const f=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);},r=f(cr(c)),g=f(cg(c)),b=f(cb(c)),q=t=>t>.008856?Math.cbrt(t):7.787*t+16/116,
  X=q((.4124*r+.3576*g+.1805*b)/.95047),Y=q(.2126*r+.7152*g+.0722*b),Z=q((.0193*r+.1192*g+.9505*b)/1.08883);return [116*Y-16,500*(X-Y),200*(Y-Z)];};
const dE=(a,b)=>{const A=toLab(a),B=toLab(b);return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]);};
const ELD=[['Fire','tongues rise and flicker'],['Ice','shards snap in, then hold'],['Energy','forks jump, no in-betweens'],['Poison','bubbles drift and pop'],['Holy','rays fall straight, stars'],['Arcane','geometry turns, motes orbit'],['Earth','chunks burst up and fall'],['Death','wisps sink into a dark core'],['Physical','one arc, one smear']];
const ELFN=[
  (p,t,rp)=>{const q=Math.floor(t*10),cx=32,by=40;for(let j=-2;j<=2;j++)for(let i=-9;i<=9;i++)if(i*i/81+j*j/5<1)p.mix(cx+i,by+j,BLK,110);
    for(let yy=0;yy<20;yy++){const w=Math.pow(1-yy/20,.8)*6.5+(hash2(q,yy)-.5)*1.6,sx=Math.round(Math.sin(q*.9+yy*.55)*yy/7);for(let i=-7;i<=7;i++){const d=Math.abs(i)/Math.max(.6,w);if(d>1)continue;p.p(cx+i+sx,by-yy,d<.35&&yy<6?rp[5]:d<.62&&yy<11?rp[4]:d<.85&&yy<16?rp[3]:rp[2]);}}
    for(let k=0;k<5;k++){const u=((t*.9+k*.21)%1),x=cx+Math.round((hash2(k,3)-.5)*14+Math.sin(t*3+k)*2),y=by-14-Math.round(u*16);p.p(x,y,u<.5?rp[4]:u<.8?rp[3]:hx('#56525e'));}},
  (p,t,rp)=>{const u=t%1.8,cx=32,cy=26;if(u>1.5){p.op=Math.max(1,Math.round((1.8-u)/.3*16));}
    if(u<.07){p.star(cx,cy,rp[6],rp[5]);p.star(cx,cy,rp[6],rp[5]);for(let k=0;k<4;k++)p.p(cx+[2,-2,0,0][k],cy+[0,0,2,-2][k],rp[5]);p.op=16;return;}
    for(let k=0;k<6;k++){const a=k*1.0472+.26,L=k&1?10:14,c2=Math.cos(a),s2=Math.sin(a);p.line(cx+c2*2-s2,cy+s2*2+c2,cx+c2*(L-3),cy+s2*(L-3),rp[3]);p.line(cx+c2*2,cy+s2*2,cx+c2*L,cy+s2*L,rp[4]);p.line(cx,cy,cx+c2*(L-5),cy+s2*(L-5),rp[5]);p.p(cx+c2*(L+1),cy+s2*(L+1),rp[2]);}
    for(let k=0;k<6;k++){const a=k*1.0472,b=a+1.0472;p.line(cx+Math.cos(a)*5,cy+Math.sin(a)*5,cx+Math.cos(b)*5,cy+Math.sin(b)*5,rp[2]);}p.op=16;},
  (p,t,rp)=>{const u=t%.9;if(u>.36){const k=Math.floor(t*12);for(let s=0;s<3;s++){const x=30+Math.round((hash2(k,s)-.5)*30),y=34+Math.round((hash2(s,k)-.5)*8);if(u<.6)p.p(x,y,s&1?rp[5]:rp[3]);}return;}
    const seed=Math.floor(t*20),X=new Float32Array(17),Y=new Float32Array(17);X[0]=9;Y[0]=9;X[16]=54;Y[16]=38;
    for(let st=16,d=9;st>1;st>>=1,d*=.55)for(let i=0;i<16;i+=st){const mid=i+st/2,o=(hash2(seed*31+mid,st)-.5)*2*d;X[mid]=(X[i]+X[i+st])/2-o*.54;Y[mid]=(Y[i]+Y[i+st])/2+o*.84;}
    for(let i=0;i<16;i++){p.line(X[i],Y[i]+1,X[i+1],Y[i+1]+1,rp[2]);p.line(X[i]+1,Y[i],X[i+1]+1,Y[i+1],rp[3]);}
    const bx=X[8],by=Y[8];p.line(bx,by,bx+9,by-7+hash2(seed,5)*5,rp[3]);p.line(bx+9,by-7+hash2(seed,5)*5,bx+14,by-4,rp[3]);
    for(let i=0;i<16;i++)p.line(X[i],Y[i],X[i+1],Y[i+1],rp[5]);},
  (p,t,rp)=>{const cx=32,by=39;for(let j=-3;j<=3;j++)for(let i=-13;i<=13;i++){const d=i*i/169+j*j/9;if(d<1)p.p(cx+i,by+j,d<.45?rp[3]:d<.8?rp[2]:rp[1]);}
    for(let k=0;k<7;k++){const u=((t*.33+k*.143+hash2(k,1)*.2)%1),x=cx+Math.round((hash2(k,7)-.5)*20+Math.sin(t*1.6+k*2)*2),y=by-2-Math.round(u*26),r=1+(k%3);
      if(u>.9){p.p(x-r-1,y,rp[4]);p.p(x+r+1,y,rp[4]);p.p(x,y-r-1,rp[4]);p.p(x,y+r+1,rp[4]);continue;}
      if(r===1){p.p(x,y,rp[3]);p.p(x,y-1,rp[4]);}else{p.ell(x,y,r,r,rp[3]);p.p(x-1,y-1,rp[5]);p.ell(x,y,r+1,r+1,rp[1],.05,.45);}}},
  (p,t,rp)=>{const u=t%1.6,cx=32,by=40;p.ell(cx,by,13,4,rp[3]);p.ell(cx,by,10,3,rp[2]);
    for(let k=0;k<3;k++){const x=cx+(k-1)*7,d=clamp((u-k*.07)/.3,0,1),top=4,bot=top+Math.round(d*(by-top)),w=k===1?2:1;if(u<1.35+k*.05)for(let y=top;y<=bot;y++)for(let i=-w;i<=w;i++)p.p(x+i,y,Math.abs(i)===w?(dith(x+i,y,.5)?rp[3]:rp[2]):i===0?rp[5]:rp[4]);}
    for(let k=0;k<6;k++){const ph=(t*.5+k*.17)%1,x=cx+Math.round((hash2(k,11)-.5)*34),y=by-6-Math.round(ph*24);if(((t*4+k*1.3)|0)%3===0)p.star(x,y,rp[5],rp[4]);else p.p(x,y,rp[4]);}},
  (p,t,rp)=>{const cx=32,cy=25,a0=t*.698;p.ell(cx,cy,16,16,rp[2]);p.ell(cx,cy,14,14,rp[3]);
    for(let k=0;k<5;k++){const a=a0+k*1.2566,b=a0+((k+2)%5)*1.2566;p.line(cx+Math.cos(a)*13,cy+Math.sin(a)*13,cx+Math.cos(b)*13,cy+Math.sin(b)*13,rp[3]);}
    p.ell(cx,cy,5,5,rp[4]);for(let k=0;k<3;k++){const a=-t*2.2+k*2.094,x=cx+Math.cos(a)*19,y=cy+Math.sin(a)*19;p.star(Math.round(x),Math.round(y),rp[5],rp[4]);const b=a+.28;p.p(cx+Math.cos(b)*19,cy+Math.sin(b)*19,rp[3]);}},
  (p,t,rp)=>{const u=t%1.5,cx=32,by=40;for(let i=-12;i<=12;i++)p.p(cx+i,by+Math.round(Math.sin(i*1.3)*1.2),rp[1]);
    for(let k=0;k<6;k++){const d=clamp(u/.6,0,1),x=cx+(k-2.5)*5,r=2+Math.round(d*2);if(u<1.1)for(let j=-r;j<=0;j++)for(let i=-r;i<=r;i++)if(i*i+j*j<=r*r&&dith(x+i,by+j-Math.round(d*3),.9-d*.6))p.p(x+i,by+j-Math.round(d*3),j<-1?rp[3]:rp[2]);}
    for(let k=0;k<9;k++){const vx=(hash2(k,21)-.5)*50,vy=-(52+hash2(k,22)*44),x=cx+vx*u,y=by+vy*u+85*u*u;if(y>by+2)continue;const X=Math.round(x),Y=Math.round(y),s=k%3===0?4:k%3===1?3:2;
      for(let j=0;j<s;j++)for(let i=0;i<s;i++){const edge=i===s-1||j===s-1;p.p(X+i,Y+j,i===0&&j===0?rp[5]:edge?rp[2]:j===0||i===0?rp[4]:rp[3]);}
      for(let i=-1;i<=s;i++){p.p(X+i,Y+s,rp[0]);p.p(X+i,Y-1,rp[0]);}for(let j=0;j<s;j++){p.p(X-1,Y+j,rp[0]);p.p(X+s,Y+j,rp[0]);}}},
  (p,t,rp)=>{const cx=32,cy=24;for(let k=0;k<7;k++){const ph=(t*.4+k/7)%1,r=22*(1-ph)+4,a=k*.9+ph*3.2,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.7+ph*8;
      for(let s=0;s<7;s++){const a2=a-s*.13,r2=r+s*1.1;p.p(cx+Math.cos(a2)*r2,cy+Math.sin(a2)*r2*.7+ph*8,s===0?rp[5]:s<3?rp[4]:s<5?rp[3]:rp[2]);}}
    const yy=cy+5;p.disc(cx,yy,5,rp[1]);p.ell(cx,yy,6,6,rp[5]);p.ell(cx,yy,7,7,rp[3],.1,.4);p.p(cx-1,yy-1,rp[2]);
    for(let i=-9;i<=9;i++)if(dith(cx+i,yy+10,.5))p.p(cx+i,yy+10,rp[1]);},
  (p,t,rp)=>{const u=t%1.1,cx=30,cy=28,R=15,a0=-2.3,a1=.5,px=41,hit=u>.09&&u<.24?1:0;
    for(let j=-2;j<=2;j++)for(let i=-6;i<=6;i++)if(i*i/36+j*j/5<1)p.mix(px+i,41+j,BLK,110);
    for(let y=22;y<=41;y++)for(let i=-2;i<=2;i++)p.p(px+i+hit,y,Math.abs(i)===2?INK:i===-1?hx('#a88838'):hx('#7a5230'));for(let i=-4;i<=4;i++){p.p(px+i+hit,21,INK);p.p(px+i+hit,22,Math.abs(i)===4?INK:hx('#d8b860'));p.p(px+i+hit,23,Math.abs(i)===4?INK:hx('#a88838'));p.p(px+i+hit,24,INK);}
    if(u>.3&&u<.9)for(let a=a0+.9;a<=a1-.2;a+=.05){const x=Math.round(cx+Math.cos(a)*R),y=Math.round(cy+Math.sin(a)*R*.8);if(dith(x,y,1.2-u*1.3))p.p(x,y,rp[2]);}
    if(u>.34)return;const f=u<.07?0:u<.14?1:u<.24?2:3,head=a0+(a1-a0)*[.55,1,1,1][f],tail=a0+(a1-a0)*[0,.15,.5,.8][f];
    for(let a=tail;a<=head;a+=.03){const k=(a-tail)/Math.max(.01,head-tail),w=f===3?1:Math.round(1+k*3);for(let s=0;s<w;s++){const r=R-s,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.8;if(f===3&&!dith(Math.round(x),Math.round(y),.5))continue;p.p(Math.round(x),Math.round(y),s===0?(f===0&&k>.6?rp[6]:rp[5]):s===1?rp[4]:rp[3]);}}
    if(f===1||f===2){const x=Math.round(cx+Math.cos(a1)*R),y=Math.round(cy+Math.sin(a1)*R*.8);p.star(x,y,rp[5],rp[4]);if(f===1){p.p(x-2,y,rp[3]);p.p(x+2,y,rp[3]);p.p(x,y-2,rp[3]);p.p(x,y+2,rp[3]);}}}];
reg('elements',root=>{const c=ctl(root),grid=$('[data-grid]',root),ro=$('[data-ro]',root),CW=64,CH=48,G=mkGround(CW,CH,2,{dim:.55});let tt=0,lastMode='';
  grid.innerHTML=ELD.map((e,i)=>`<div><div class="stage"><canvas width="${CW}" height="${CH}"></canvas></div><p><b>${e[0]}</b>${e[1]}</p></div>`).join('');
  const cells=$$('canvas',grid).map(cv=>{const P=PX(cv);return {P,pen:Pen(P),box:cv.closest('.stage').parentNode};});
  const cache=new Map();let mat=null,grey=false;
  const conv=col=>{let v=cache.get(col);if(v===undefined){v=cvd(col,mat);if(grey){const l=lumv(v)*255;v=pack(l,l,l);}cache.set(col,v);}return v;};
  function pairs(){const mode=c.segv('cb'),out=[];for(let a=0;a<9;a++)for(let b=a+1;b<9;b++){let d=0;for(const s of [2,3,4])d+=dE(cvd(RP[a][s],mat),cvd(RP[b][s],mat))/3;out.push([d,a,b]);}
    out.sort((x,y)=>x[0]-y[0]);const hit=out.filter(o=>o[0]<16),bad=new Set();hit.forEach(o=>{bad.add(o[1]);bad.add(o[2]);});cells.forEach((cl,i)=>cl.box.classList.toggle('hit',bad.has(i)&&!grey));
    const nm={n:'Normal vision',d:'Deuteranopia (no green cones)',p:'Protanopia (no red cones)',t:'Tritanopia (no blue cones)'}[mode];
    ro.innerHTML=`${nm}. Closest ramp pairs by colour distance: `+out.slice(0,4).map(o=>`${ELS[o[1]][0]} and ${ELS[o[2]][0]} <b${o[0]<16?' style="color:#ff8f7a"':''}>${o[0].toFixed(0)}</b>`).join(', ')+'.'+
      `<br>${hit.length?`${hit.length} pair${hit.length>1?'s':''} under 16 (our threshold) collide on hue here, outlined in red.`:'No pair falls under 16 (our threshold).'} ${grey?'With hue removed, shape and motion still tell all nine apart.':'Tick "Shapes only" to remove hue and check that shape and motion still tell them apart.'}`+
      `<br>Cost: the colour-blind palette is one table swap, no run-time cost (report).`;}
  function frame(){const mode=c.segv('cb'),g=c.v('grey'),key=mode+g;if(key!==lastMode){mat=mode==='n'?null:CVD[mode];grey=g;cache.clear();pairs();lastMode=key;}
    cells.forEach((cl,i)=>{const u=cl.P.u32;u.set(G);cl.pen.op=16;ELFN[i](cl.pen,tt+i*.37,RP[i]);if(mat||grey)for(let q=0;q<u.length;q++)u[q]=conv(u[q]);cl.P.put();});}
  c.seg('cb',frame);c.on('grey',frame);frame();return {tick(dt){tt+=dt;frame();}};});

// ----------------------------------------------------------------------
// a small fight engine shared by tiers, budget, wire and screenfx: a fixed effect
// array with the sandbox's cap, priority eviction and same-tile merge, a particle
// pool, and per-tier draw policies. Kinds: 2 missile, 5 spark, 6 area tile,
// 8 residue, 11 hostile telegraph.
// ----------------------------------------------------------------------
const TPRI={2:7,5:5,6:5,8:2,11:9},TIERPRI=[4,2,1,3];
const maskTiles=hw=>{const a=[],c=(hw.length-1)/2;hw.forEach((w,j)=>{for(let i=-w;i<=w;i++)a.push([i,j-c,Math.round(Math.hypot(i,j-c))]);});return a;};
const MASK37=maskTiles([1,2,3,3,3,2,1]),MASK73=maskTiles([0,2,3,4,4,5,4,4,3,2,0]),CROSS=[[0,0,0],[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]];
const TELE1=hx('#ff4040'),TELE0=hx('#40080c');
function mkFight(P,o={}){const pen=Pen(P),W=P.W,H=P.H,u=P.u32,G=o.ground||mkGround(W,H,o.seed||3,{grass:o.grass===undefined?12:o.grass,dim:o.dim});
  const NFX=o.nfx||512,FX=[];for(let i=0;i<NFX;i++)FX.push({on:0,ty:0,tier:0,el:0,t:0,dur:1,delay:0,x:0,y:0,x0:0,y0:0,x1:0,y1:0,pri:0,sm:0,key:-1,cb:null,hx:new Int16Array(6),hy:new Int16Array(6),hn:0});
  const NPT=o.np||1200,pp=mkPool(NPT),pe=new Uint8Array(NPT),ptr=new Uint8Array(NPT),tileT=new Float32Array(4096).fill(-9),tileE=new Uint8Array(4096),tileFx=new Map(),decFx=new Map();
  const F={pen,P,W,H,G,FX,A:[],now:0,live:0,cap:o.cap||NFX,merge:false,dedupe:false,evicted:0,merged:0,refused:0,px:[0,0,0,0],tierView:false,onEv:null,decals:!!o.decals,decalS:o.decalS||6,
    pol:[0,1,2,3].map(()=>({op:16,pm:1,red:0,mini:0,trail:1,decal:1}))};
  const ev=(k,b)=>{if(F.onEv)F.onEv(k,b);};
  F.kill=f=>{if(f.on){f.on=0;F.live--;}};
  // the cap: when full, the lowest of (tier priority, kind priority, time left) gives up its slot, or the newcomer is refused
  F.spawn=(ty,tier,el,dur)=>{
    if(F.live>=F.cap){const v=TIERPRI[tier]*100+TPRI[ty]*10+9;let w=null,wv=1e9;for(let i=0;i<NFX;i++){const g=FX[i];if(!g.on)continue;const gv=g.pri+(1-g.t/g.dur)*9;if(gv<wv){wv=gv;w=g;}}
      if(w&&wv<v){F.kill(w);F.evicted++;}else{F.refused++;return null;}}
    let f=null;for(let i=0;i<NFX;i++)if(!FX[i].on){f=FX[i];break;}if(!f){F.refused++;return null;}
    f.on=1;f.ty=ty;f.tier=tier;f.el=el;f.t=0;f.dur=dur;f.delay=0;f.pri=ty===11?999:TIERPRI[tier]*100+TPRI[ty]*10;f.sm=0;f.key=-1;f.cb=null;f.hn=0;F.live++;return f;};
  const burst=(x,y,el,tier,n)=>{const v=n*F.pol[tier].pm;let k=(v|0)+(rnd()<v-(v|0)?1:0);for(;k>0;k--){const a=rnd()*6.2832,s=18+rnd()*42,j=pp.spawn(x,y,Math.cos(a)*s,Math.sin(a)*s*.7-(el===0||el===4?16:0),.25+rnd()*.35);pe[j]=el;ptr[j]=tier;}};
  F.impact=(x,y,el,tier,big)=>{const pol=F.pol[tier],tk=(clamp(y>>4,0,63)<<6)|clamp(x>>4,0,63);
    if(F.merge&&tileE[tk]===el+1&&F.now-tileT[tk]<.15){F.merged++;return;}tileT[tk]=F.now;tileE[tk]=el+1;
    const f=F.spawn(5,tier,el,pol.mini?.225:.375);if(!f)return;f.x=x|0;f.y=y|0;f.sm=(pol.mini||pol.red||!big)?1:0;burst(x,y,el,tier,big?10:4);
    if(F.decals&&pol.decal&&big){const g=F.merge?decFx.get(tk):null;if(g&&g.on&&g.ty===8&&g.key===tk){g.t=0;return;}const d=F.spawn(8,tier,el,F.decalS);if(d){d.x=x|0;d.y=(y|0)+5;d.key=tk;decFx.set(tk,d);}}};
  F.missile=(a,tx,ty,el,big)=>{ev('missile',11);const d=Math.hypot(tx-a.x,ty-(a.y-9)),f=F.spawn(2,a.tier,el,Math.max(.1,.15*Math.sqrt(d/16)));if(!f){ev('effect',9);return;}
    f.x0=a.x+(tx<a.x?-5:5);f.y0=a.y-9;f.x1=tx;f.y1=ty;f.x=f.x0;f.y=f.y0;f.sm=big?1:0;};
  F.area=(tier,cx,cy,el,tiles,ts,sm)=>{const pol=F.pol[tier],bx=(cx/ts)|0,by=(cy/ts)|0;for(const [i,j,r] of tiles){if(pol.red&&((i+j)&1))continue;const key=(by+j+64)*1024+bx+i+64;
      if(F.dedupe){const g=tileFx.get(key);if(g&&g.on&&g.ty===6&&g.key===key){F.merged++;continue;}}
      const f=F.spawn(6,tier,el,.375);if(!f)continue;f.delay=r*.055;f.x=(bx+i)*ts+(ts>>1);f.y=(by+j)*ts+(ts>>1);f.sm=sm;f.key=key;tileFx.set(key,f);}};
  F.tele=(tx,ty,dur,cb)=>{const f=F.spawn(11,3,0,dur);if(f){f.x=tx|0;f.y=ty|0;f.cb=cb;}return f;};
  F.step=dt=>{F.now+=dt;for(let i=0;i<NFX;i++){const f=FX[i];if(!f.on)continue;if(f.delay>0){f.delay-=dt;continue;}f.t+=dt;
      if(f.ty===2){const p=Math.min(1,f.t/f.dur);f.x=f.x0+(f.x1-f.x0)*p;f.y=f.y0+(f.y1-f.y0)*p;f.hx[f.hn%6]=f.x;f.hy[f.hn%6]=f.y;f.hn++;}
      if(f.t>=f.dur){F.kill(f);if(f.ty===2){ev('effect',9);F.impact(f.x1,f.y1,f.el,f.tier,f.sm);}else if(f.ty===11&&f.cb)f.cb(f);}}
    pp.step(dt,50,0,.9);};
  F.draw=()=>{u.set(G);const px=F.px;px[0]=px[1]=px[2]=px[3]=0;pen.op=16;pen.tint=0;
    for(let i=0;i<NFX;i++){const f=FX[i];if(!f.on||f.ty!==8)continue;const a=1-f.t/f.dur,fade=a<.3?a/.3:1,n0=pen.n;for(let j=-3;j<=3;j++)for(let k=-7;k<=7;k++){const d=k*k/49+j*j/9;if(d<1&&dith(f.x+k,f.y+j,(1.15-d*.7)*fade))pen.mix(f.x+k,f.y+j,BLK,d<.4?130:80);}px[f.tier]+=pen.n-n0;}
    for(const a of F.A)pen.spr(a.spr,a.x,a.y,a.flip);
    for(let i=0;i<NFX;i++){const f=FX[i];if(!f.on||f.delay>0||f.ty===8||f.ty===11)continue;const pol=F.pol[f.tier],rp=RP[f.el],n0=pen.n;pen.op=pol.op;pen.tint=F.tierView?TCOL[f.tier]:0;
      if(f.ty===2){const n=Math.min(f.hn,6);if(pol.trail)for(let k=0;k<n-1;k++){const i1=(f.hn-1-k)%6,i0=(f.hn-2-k)%6;pen.line(f.hx[i0],f.hy[i0],f.hx[i1],f.hy[i1],k<2?rp[4]:k<4?rp[3]:rp[2]);}
        if(pol.mini){pen.star(Math.round(f.x),Math.round(f.y),rp[5],rp[3]);}else pen.blit(MS[ELSHAPE[f.el]][dir8(f.x1-f.x0,f.y1-f.y0)],f.x,f.y,rp);}
      else{const mini=pol.mini,fr=mini?Math.min(3,1+((f.t/.075)|0)):Math.min(4,(f.t/.075)|0),set=f.sm===2?SPKT:(f.sm||mini)?SPKS:SPK;pen.blit(set[f.el][fr],f.x,f.y,rp,pol.red||mini);}
      px[f.tier]+=pen.n-n0;}
    for(let j=0;j<NPT;j++){if(pp.life[j]<=0)continue;const tr=ptr[j],n0=pen.n,uu=1-pp.age[j]/pp.life[j];pen.op=F.pol[tr].op;pen.tint=F.tierView?TCOL[tr]:0;pen.p(pp.x[j],pp.y[j],RP[pe[j]][2+((uu*3.99)|0)]);px[tr]+=pen.n-n0;}
    pen.op=16;pen.tint=0;
    for(let i=0;i<NFX;i++){const f=FX[i];if(!f.on||f.ty!==11)continue;const p=f.t/f.dur,r=13-p*6,n0=pen.n;for(let j=-7;j<=7;j++)for(let k=-13;k<=13;k++){const d=k*k/(r*r)+j*j/(r*r*.25);if(d<1&&dith(f.x+k,f.y+j,.12+p*.4))pen.mix(f.x+k,f.y+j,TELE1,110);}
      pen.ell(f.x,f.y,r+1,(r+1)*.5,TELE0);pen.ell(f.x,f.y,r,r*.5,TELE1);px[3]+=pen.n-n0;}};
  F.sort=()=>F.A.sort((a,b)=>a.y-b.y);
  F.shadows=()=>{for(const a of F.A)shadow(G,W,H,a.x,a.y,a.spr.w>>1);};
  F.clear=()=>{for(const f of FX)f.on=0;F.live=0;pp.clear();F.evicted=F.merged=F.refused=0;};
  return F;}

// ======================================================================
// F1 owner tiers and per-source opacity: 30 casters, four tiers
// ======================================================================
reg('tiers',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),F=mkFight(P,{seed:4,decals:true,decalS:5}),ro=$('[data-ro]',root),m=mtr(),sm=[0,0,0,0];
  const mons=[{x:120,y:66,spr:SP_BOSS,tier:3,el:0,cd:1.2},{x:84,y:50,spr:SP_MON,tier:3,el:3,cd:2.1},{x:158,y:52,spr:SP_MON,tier:3,el:3,cd:3}];
  const own={x:120,y:118,spr:SP_OWN,tier:0,el:0,cd:.5},players=[own];
  [[97,113],[143,114],[80,103],[160,104]].forEach((p,i)=>players.push({x:p[0],y:p[1],spr:i===0?SP_HEAL:SP_CROWD[i+1],tier:1,el:[4,1,2,5][i],cd:.4+i*.3,flip:p[0]>120}));
  for(let k=0;k<22;k++){const a=(128+k*284/21)*Math.PI/180,rr=k&1?1:.8,x=Math.round(120+Math.cos(a)*104*rr);players.push({x,y:Math.round(68+Math.sin(a)*48*rr),spr:SP_CROWD[k%6],tier:2,el:k%6,cd:hash2(k,5)*2.2,flip:x>120});}
  F.A=players.concat(mons);F.sort();F.shadows();
  function pol(){const o=F.pol[2],pr=c.segv('pre');F.pol[0].op=Math.round(c.v('own')*.16);F.pol[3].op=Math.round(c.v('mon')*.16);F.pol[1].pm=.7;o.op=Math.round(c.v('oth')*.16);o.pm=1;o.red=0;o.mini=0;o.trail=1;o.decal=1;
    if(pr==='red'){o.pm=.5;o.red=1;o.decal=0;}else if(pr==='min'){o.pm=0;o.mini=1;o.trail=0;o.decal=0;}
    F.tierView=c.v('tv');['own','oth','mon'].forEach(k=>c.out(k,c.v(k)+'%'));}
  c.seg('pre',v=>{c.el('oth').value=v==='full'?100:40;pol();});['own','oth','mon','tv'].forEach(k=>c.on(k,pol));pol();
  function tick(dt){for(const a of players){a.cd-=dt;if(a.cd<=0){a.cd=1.2+rnd()*1.4;const tg=rnd()<.7?mons[0]:mons[1+((rnd()*2)|0)];F.missile(a,tg.x+((rnd()*11)|0)-5,tg.y-5-((rnd()*8)|0),a.el,true);}}
    for(const mo of mons){mo.cd-=dt;if(mo.cd<=0){mo.cd=2.4+rnd()*1.4;const tg=rnd()<.45?own:players[(rnd()*players.length)|0];F.tele(tg.x,tg.y,1,f=>F.area(3,f.x,f.y,mo.el,CROSS,12,1));}}
    m.a();F.step(dt);F.draw();P.put();const ms=m.b();for(let i=0;i<4;i++)sm[i]+=(F.px[i]-sm[i])*.05;
    const pr=c.segv('pre');setHud(root,`30 casters · others ${{full:'full',red:'reduced',min:'minimal'}[pr]}`);
    ro.innerHTML='Effect pixels per frame: '+[0,3,1,2].map(i=>`<span style="color:${TCSS[i]}">${TNAME[i]}</span> <b>${nf(sm[i])}</b>`).join(' · ')+`. Draw time here <b>${f3(ms)} ms</b> (live).`+
      '<br>Report, measured: the clarity manager saves 26% of CPU at 1x load and 16% at 16x, 0.26 to 0.20 ms on the M4 and 1.5 to 1.11 ms at 6x throttle. Opacity by ordered dither is free.';}
  return {tick};});

// ======================================================================
// F2 budget: a cap of 96, priority eviction and same-tile merge
// ======================================================================
reg('budget',root=>{const c=ctl(root),cvs=$$('canvas',root),P=PX(cvs[0]),S=PX(cvs[1]),F=mkFight(P,{seed:7,decals:true,decalS:4,cap:96}),W=F.W,ro=$('[data-ro]',root),m=mtr();
  const boss={x:120,y:64,spr:SP_BOSS,tier:3,el:0},own={x:120,y:112,spr:SP_OWN,tier:0,el:0},by=[[own],[],[],[boss]];
  [[98,108],[142,109],[82,98],[158,99]].forEach((p,i)=>by[1].push({x:p[0],y:p[1],spr:i===0?SP_HEAL:SP_CROWD[i+1],tier:1,el:[4,1,2,5][i],flip:p[0]>120}));
  for(let k=0;k<14;k++){const a=(140+k*260/13)*Math.PI/180,x=Math.round(120+Math.cos(a)*100);by[2].push({x,y:Math.round(62+Math.sin(a)*44),spr:SP_CROWD[k%6],tier:2,el:k%6,flip:x>120});}
  F.A=[].concat(...by);F.sort();F.shadows();
  const KC={2:hx('#f2eeff'),5:hx('#ffd040'),6:hx('#f07818'),8:hx('#7a6a5a'),11:hx('#ff4040')},EMPTY=hx('#1b172d'),SBG=hx('#0b0a11');
  let acc=0,sec=0,prev=[0,0,0],rate=[0,0,0];
  function cast(){const r=rnd(),tier=r<1/30?0:r<5/30?1:r<27/30?2:3;
    if(tier===3){const L=by[(rnd()*3)|0],tg=L[(rnd()*L.length)|0];F.tele(tg.x,tg.y,1,f=>F.area(3,f.x,f.y,0,CROSS,12,1));return;}
    const L=by[tier],a=L[(rnd()*L.length)|0],hot=rnd()<.85,tx=hot?boss.x-8+((rnd()*2)|0)*16:boss.x+((rnd()*90)|0)-45,ty=hot?boss.y-12+((rnd()*2)|0)*8:boss.y+((rnd()*50)|0)-30;F.missile(a,tx,ty,a.el,true);}
  c.btn('reset',()=>{F.clear();prev=[0,0,0];rate=[0,0,0];});
  function tick(dt){const r=c.v('rate'),cap=c.v('cap');c.out('rate',r+' per second');F.cap=cap?96:512;F.merge=F.dedupe=c.v('merge');
    acc+=r*dt;while(acc>=1){acc--;cast();}
    m.a();F.step(dt);F.draw();P.put();const ms=m.b();
    sec+=dt;if(sec>=1){sec=0;const now=[F.evicted,F.merged,F.refused];rate=now.map((v,i)=>v-prev[i]);prev=now;}
    const su=S.u32,tc=[0,0,0,0];su.fill(SBG);for(let i=0;i<F.FX.length;i++){const f=F.FX[i];if(f.on)tc[f.tier]++;if(i>=96)continue;const x=i*3;for(let y=0;y<S.H;y++){const col=!f.on?(y<6?EMPTY:SBG):y<6?TCOL[f.tier]:y<7?SBG:KC[f.ty];su[y*S.W+x]=col;su[y*S.W+x+1]=col;}}S.put();
    setHud(root,`${F.live} live${cap?' of 96':', no cap'}`);
    ro.innerHTML=`Slots held: `+[0,3,1,2].map(i=>`<span style="color:${TCSS[i]}">${TNAME[i]}</span> <b>${tc[i]}</b>`).join(' · ')+(F.live>96?` · <span style="color:#ff8f7a">${F.live-96} more beyond the strip</span>`:'')+
      `<br>Since reset: evicted <b>${nf(F.evicted)}</b> (${rate[0]} per second), merged <b>${nf(F.merged)}</b> (${rate[1]} per second), refused <b>${nf(F.refused)}</b> (${rate[2]} per second).`+
      `<br>Cost: one scan of the effect array per spawn at the cap. This frame <b>${f3(ms)} ms</b> (live). Report, measured: one effect per tile cuts 2,190 tile blits to 220, 2.87 to 0.39 ms at 6x throttle.`;}
  return {tick};});

// ======================================================================
// §6c bytes on the wire: one effect per tile against one area event
// ======================================================================
reg('wire',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),W=P.W,H=P.H,LH=24,SH=H-LH-2,G=mkGround(W,H,9,{grass:12}),F=mkFight(P,{ground:G,nfx:640}),u=P.u32,ro=$('[data-ro]',root);
  const boss={x:120,y:60,spr:SP_BOSS,tier:3,el:0},lane=new Uint32Array(W*LH),LBG=hx('#0b0a11'),KC={missile:hx('#50b0ec'),effect:hx('#ffd040'),tile:hx('#f07818'),area:hx('#78cc28')},BPP=8,pend={missile:0,effect:0,tile:0,area:0};
  lane.fill(LBG);F.dedupe=true;let casters=[],nLast=-1,secT=0,secB=0,lastB=0,first=true;
  F.onEv=(k,b)=>{pend[k]+=b;secB+=b;};c.seg('sp',()=>{});c.seg('send',()=>{});
  function layout(n){casters=[];for(let k=0;k<n;k++){const a=(k/n*360+90)*Math.PI/180,rr=n>24&&(k&1)?.76:1,x=Math.round(120+Math.cos(a)*106*rr);casters.push({x,y:Math.round(56+Math.sin(a)*42*rr)+6,spr:k===0?SP_OWN:SP_CROWD[k%6],tier:2,el:k%6,cd:k/n,flip:x>120});}
    F.A=casters.concat([boss]);F.sort();}
  function tick(dt){const n=c.v('n'),r=c.v('r'),sp=c.segv('sp'),send=c.segv('send');if(n!==nLast){layout(n);nLast=n;}c.out('n',n);c.out('r',r.toFixed(1)+' per second');
    const tiles=sp==='a37'?MASK37:sp==='a73'?MASK73:null,nt=tiles?tiles.length:0,per=tiles?(send==='tile'?nt*9:11):20;
    for(const a of casters){a.cd-=dt*r;if(a.cd<=0){a.cd+=1;if(!tiles)F.missile(a,boss.x+((rnd()*13)|0)-6,boss.y-6-((rnd()*9)|0),a.el,true);
        else{if(send==='tile')F.onEv('tile',nt*9);else F.onEv('area',11);F.area(2,boss.x+((rnd()*3)|0)*8-8,boss.y-8+((rnd()*3)|0)*8-8,a.el===1?0:a.el,tiles,8,2);}}}
    F.step(dt);F.draw();
    // the wire lane: time runs right to left, one pixel is 8 bytes
    const sh=clamp(Math.round(dt*120),1,6);lane.copyWithin(0,sh);let col=W-sh,row=0,over=false;for(let y=0;y<LH;y++)for(let x=W-sh;x<W;x++)lane[y*W+x]=LBG;
    for(const k in pend){let px=Math.floor(pend[k]/BPP);pend[k]-=px*BPP;for(;px>0;px--){if(col>=W){over=true;pend[k]=0;break;}lane[(LH-1-row)*W+col]=KC[k];if(++row>=LH){row=0;col++;}}}
    if(over)for(let x=W-sh;x<W;x++)lane[x]=hx('#ff4040');
    for(let x=0;x<W;x++){u[SH*W+x]=INK;u[(SH+1)*W+x]=INK;}u.set(lane,(SH+2)*W);P.put();
    secT+=dt;if(secT>=1){lastB=secB/secT;secB=0;secT=0;first=false;}
    const calc=n*r*per;
    setHud(root,`${nf(calc)} bytes per second per viewer`);
    ro.innerHTML=`Each cast: <b>${per} bytes</b> to each viewer`+(tiles?(send==='tile'?`, ${nt} effect events of 9 bytes`:`, one area event of 11 bytes that the client expands into ${nt} tiles`):', a missile of 11 bytes and an effect of 9')+'.'+
      `<br>${n} casters x ${r.toFixed(1)} casts per second x ${per} = <b>${nf(calc)} bytes per second per viewer</b>`+(first?'':` (counted here ${nf(lastB)})`)+`. Server output for ${n} viewers: <b>${(calc*n/1000).toFixed(calc*n<10000?2:1)} KB per second</b>.`+
      (over?'<br><span style="color:#ff8f7a">The lane is full. The red line marks bytes that did not fit the picture.</span>':'');}
  return {tick};});

// ======================================================================
// F3 screen feedback: edge tint, low-health pulse, one flash
// ======================================================================
// dithered tint that is strongest at the screen edge; a = 0..0.5 (the cap), never a full-screen fill
function edgeTint(u,W,H,depth,col,a){let n=0;for(let y=0;y<H;y++){const dy=Math.min(y,H-1-y);for(let x=0;x<W;x++){if(dy>=depth&&x===depth){x=W-depth-1;continue;}const d=Math.min(dy,x,W-1-x);if(d<depth&&BAYER[(y&3)*4+(x&3)]/16<(depth-d)/depth*a*2){u[y*W+x]=mixf(u[y*W+x],col,128);n++;}}}return n;}
reg('screenfx',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),F=mkFight(P,{seed:11,grass:8}),W=F.W,H=F.H,u=P.u32,ro=$('[data-ro]',root),m=mtr();
  const own={x:60,y:62,spr:SP_OWN,tier:0,el:0},mon={x:114,y:44,spr:SP_BOSS,tier:3,el:3},heal={x:36,y:74,spr:SP_HEAL,tier:1,el:4};
  F.A=[own,mon,heal];F.sort();F.shadows();
  const HURT=pack(204,52,56),FLASHC=RP[0][5];let tint=0,flashT=0,lastFlash=-9,hitAt=-1,hitD=0,auto=3,tt=0,meteor=-1;
  const luanti=d=>Math.min(127,95+64*d);
  function attack(){if(hitAt>=0)return;const d=Math.hypot(own.x-mon.x,own.y-8-(mon.y-9));F.missile(mon,own.x,own.y-8,3,true);hitAt=F.now+Math.max(.1,.15*Math.sqrt(d/16));hitD=c.v('dmg')/100;}
  function storm(){if(F.now-lastFlash<1.5)return;lastFlash=F.now;F.missile(own,mon.x,mon.y-8,0,true);meteor=F.now+.3;}
  c.btn('hit',attack);c.btn('storm',storm);
  function tick(dt){tt+=dt;const hp=c.v('hp');c.out('hp',hp+'%');c.out('dmg',c.v('dmg')+'% of max');
    if(c.v('auto')){auto-=dt;if(auto<=0){auto=4;attack();}}
    if(hitAt>=0&&F.now>=hitAt){hitAt=-1;tint=luanti(hitD);const e=c.el('hp'),nv=Math.max(0,+e.value-hitD*100);e.value=nv<=0&&c.v('auto')?100:nv;}
    if(meteor>=0&&F.now>=meteor){meteor=-1;F.area(0,mon.x,mon.y-6,0,MASK37,8,2);flashT=.18;}
    F.step(dt);F.draw();
    m.a();let n=0;
    if(flashT>0){const q=flashT/.18,lv=q>.66?150:q>.33?90:45;for(let i=0;i<u.length;i++)u[i]=mixf(u[i],FLASHC,lv);flashT-=dt;n+=u.length;}
    if(tint>0){n+=edgeTint(u,W,H,14,HURT,tint/255);tint=Math.max(0,tint-384*dt);}
    const low=hp<30,pulse=low?.3+.3*Math.sin(tt*Math.PI):0;if(low)n+=edgeTint(u,W,H,10,HURT,pulse*.5);
    for(let x=0;x<42;x++)for(let y=0;y<5;y++){const edge=x===0||x===41||y===0||y===4;u[(H-8+y)*W+4+x]=edge?INK:x-1<hp*.4?(low?HURT:hx('#60c060')):hx('#2a2630');}
    const ms=m.b();P.put();
    const a0=luanti(c.v('dmg')/100);
    setHud(root,low?'low health · edge pulse 0.5 Hz':tint>0?`edge tint ${Math.round(tint/255*100)}%`:flashT>0?'one flash':'');
    ro.innerHTML=`Luanti's rule for this hit: alpha = 95 + 64 x ${(c.v('dmg')/100).toFixed(2)} = <b>${Math.round(a0)} of 255</b> (${Math.round(a0/255*100)}%, cap 127), gone in <b>${(a0/384).toFixed(2)} s</b> at 384 units per second.`+
      `<br>Low-health pulse: ${low?`<b>on</b>, 0.5 Hz, edge alpha ${Math.round(pulse*50)}%`:'off, health is 30% or more'}. Full-screen flash: only for your own meteor storm, 0.18 s, at most one per 1.5 s here.`+
      `<br>Screen layer this frame: ${nf(n)} pixels, <b>${f3(ms)} ms</b> (live). Report, measured: Canvas2D flash fill 0.019 ms (0.12 at 6x throttle), dithered vignette 0.067 ms (0.43), GPU flash quad 0.0009 ms, vignette shader 0.0014 ms.`;}
  return {tick};});

// ======================================================================
// F4 the flash limiter: 3 bright frames in any second, small flashes exempt
// ======================================================================
reg('flashlimit',root=>{const c=ctl(root),cvs=$$('canvas',root),P=PX(cvs[0]),S=PX(cvs[1]),W=P.W,H=P.H,u=P.u32,pen=Pen(P),ro=$('[data-ro]',root),G=mkGround(W,H,6,{grass:14,dim:.8});
  const SPOTS=[[104,84],[214,70],[160,116]],act=[[40,150,0],[70,160,1],[204,152,2],[250,162,3],[160,168,4],[120,158,5]];
  for(const a of act)shadow(G,W,H,a[0],a[1],6);
  const shown=[],log=[],fx=[];let acc=0,now=0,unlim=0,border=0,borderC=0,k=0,asked=0,supp=0;
  const ub=c.btn('unlim',()=>{if(!reduce)unlim=3;});
  if(reduce&&ub){ub.disabled=true;ub.textContent='Unlimited mode is off, your system asks for reduced motion';}
  function request(){const A=c.v('area'),el=k%6,sp=SPOTS[k%3];k++;asked++;let kind;
    if(unlim>0)kind=0;else if(A<1600)kind=2;else if(c.v('rf')){kind=3;border=.35;borderC=RP[el][3];}
    else{while(shown.length&&now-shown[0]>1)shown.shift();if(shown.length>=3){kind=1;supp++;}else{shown.push(now);kind=0;}}
    log.push([now,kind]);if(log.length>40)log.shift();fx.push({t:0,x:sp[0],y:sp[1],el,flash:kind===0||kind===2,r:Math.sqrt(A/Math.PI)});if(fx.length>12)fx.shift();}
  const SC=[hx('#ffd040'),hx('#5a5470'),hx('#50b0ec'),hx('#f07818')],SBG=hx('#0b0a11'),LINE=hx('#362e57');
  function tick(dt){now+=dt;const hz=c.v('hz'),A=c.v('area');c.out('hz',hz.toFixed(1)+' per second');c.out('area',`${nf(A)} px, ${(A/576).toFixed(1)}%`);
    if(unlim>0){unlim-=dt;if(unlim<=0){unlim=0;shown.length=0;}}
    acc+=hz*dt;if(acc>=1){acc-=1;request();}
    u.set(G);pen.op=16;
    for(const a of act)pen.spr(a[2]===0?SP_OWN:SP_CROWD[a[2]],a[0],a[1],a[0]>160);
    pen.spr(SP_BOSS,160,96);
    for(const f of fx){if(f.t>.5)continue;const rp=RP[f.el],fr=Math.min(4,(f.t/.075)|0);
      if(f.flash&&f.t<.075){const R=Math.ceil(f.r),col=rp[5];for(let j=-R;j<=R;j++){const y=f.y+j;if(y<0||y>=H)continue;for(let i=-R;i<=R;i++){const x=f.x+i;if(x<0||x>=W||i*i+j*j>f.r*f.r)continue;u[y*W+x]=mixf(u[y*W+x],col,170);}}}
      else if(f.t<.4){const p=f.t/.4,r=f.r*(1-(1-p)*(1-p));pen.ell(f.x,f.y,r,r,rp[p<.4?4:p<.7?3:2]);}
      if(f.t<.375)pen.blit(SPK[f.el][fr],f.x,f.y,rp,!f.flash);f.t+=dt;}
    if(border>0){for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(y>2&&y<H-3&&x===3){x=W-4;continue;}u[y*W+x]=borderC;}border-=dt;}
    for(let i=0;i<40;i+=2){u[(H-46)*W+W-46+i]=WHITE;u[(H-7)*W+W-46+i]=WHITE;u[(H-46+i)*W+W-46]=WHITE;u[(H-46+i)*W+W-7]=WHITE;}digits(u,W,H,W-34,H-29,'1600',WHITE);
    P.put();
    const su=S.u32,SW=S.W,SHh=S.H;su.fill(SBG);for(let x=0;x<SW;x+=SW>>3)for(let y=0;y<SHh;y+=2)su[y*SW+x]=LINE;
    for(const [t,kd] of log){const x=Math.round(SW-1-(now-t)/2*SW);if(x<1)continue;const h=kd===1?4:SHh-2;for(let y=SHh-1-h;y<SHh-1;y++){su[y*SW+x]=SC[kd];su[y*SW+x-1]=SC[kd];}}S.put();
    while(shown.length&&now-shown[0]>1)shown.shift();
    setHud(root,unlim>0?`LIMITER OFF for ${unlim.toFixed(1)} s`:c.v('rf')?'reduce flashing · border, no bright frame':'limiter on');
    const lim=A<1600?'under 1,600 px, exempt from the count':unlim>0?'limiter off':c.v('rf')?'reduce flashing swaps every bright frame for a border':`bright frames in the last second <b>${shown.length} of 3</b>`;
    ro.innerHTML=`Asked for ${hz.toFixed(1)} flashes per second over ${nf(A)} px. Limiter: ${lim}. Bright frames dropped so far <b>${nf(supp)}</b> of ${nf(asked)} asked.`+
      `<br>${hz>3&&A>=1600&&unlim<=0&&!c.v('rf')?'Past 3 per second the effect still plays, starting on frame 2, so the hit stays readable. ':''}Cost: a ring buffer of about 32 entries and one comparison per spawn, no shader and no readback (report).`;}
  return {tick};});

// ----------------------------------------------------------------------
// log-scale bar chart shared by drawpaths and costs. rows: {lab, sub, v, s, col, v2, s2, col2}
// o: {lo, hi, axis, lines:[[value, text, colour, dy]], sub:true when rows carry a second label line}
// ----------------------------------------------------------------------
function logBars(svg,rows,o){svg.innerHTML='';const nar=svg.getBoundingClientRect().width<520,LO=o.lo,HI=o.hi,VW=nar?360:600,x0=nar?14:300,x1=nar?336:588,y0=40,n=rows.length,two=rows.some(r=>r.v2!=null);
  const rh=nar?(o.sub?37:28)+(two?20:12):(two?36:o.sub?30:26),by=nar?(o.sub?25:16):0,hgt=y0+n*rh+36;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);
  const X=v=>x0+(Math.log10(Math.max(10**LO,v))-LO)/(HI-LO)*(x1-x0),yb=y0+n*rh;
  for(let e=LO;e<=HI;e++){const v=10**e;svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:yb,class:'gl',stroke:'#211b37'},svg);svgText(svg,X(v),yb+13,v>=1?String(v):String(+v.toFixed(4)).replace(/^0/,''),{'text-anchor':'middle','font-size':10,fill:'#9089ab'});}
  svgText(svg,x1,yb+27,o.axis||'ms per frame (log scale)',{'text-anchor':'end','font-size':10.5,fill:'#9089ab'});
  for(const [v,t,col,dy] of o.lines||[]){svgEl('line',{x1:X(v),x2:X(v),y1:y0-8-dy,y2:yb,stroke:col,'stroke-width':1.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(v)-4,y0-10-dy,t,{'text-anchor':'end','font-size':10.5,fill:col});}
  const bar=(v,s,col,y,h)=>{if(v==null){svgText(svg,x0+4,y+h,'not measured',{'font-size':9.5,fill:'#7c7594'});return;}svgEl('rect',{x:x0,y,width:Math.max(1.5,X(v)-x0),height:h,fill:col,rx:1},svg);const tx=X(v)+4,end=tx>x1-(s.length*5.2+2);
    svgText(svg,end?X(v)-4:tx,y+h-.5,s,{'font-size':9.5,'text-anchor':end?'end':'start',fill:'#f2eeff',stroke:'#0b0a11','stroke-width':2.6,'paint-order':'stroke','stroke-linejoin':'round'});};
  rows.forEach((r,i)=>{let y=y0+i*rh;
    if(nar){svgText(svg,x0,y+10,r.lab,{'font-size':11,fill:'#e0ddee'});if(o.sub&&r.sub)svgText(svg,x0,y+21,r.sub,{'font-size':9.5,fill:'#9089ab'});}
    else{svgText(svg,8,y+11,r.lab.length>50?r.lab.slice(0,49)+'…':r.lab,{'font-size':11.5,fill:'#e0ddee'});if(o.sub&&r.sub)svgText(svg,8,y+23,r.sub,{'font-size':9.5,fill:'#9089ab'});}
    y+=by;bar(r.v,r.s,r.col,y+1,9);if(r.v2!=null)bar(r.v2,r.s2,r.col2,y+13,7);});}

// ======================================================================
// G1 draw paths: one drawImage per effect against one pixel buffer, timed here
// ======================================================================
reg('drawpaths',root=>{const c=ctl(root),cvs=$$('canvas',root),cvA=cvs[0],ctx=cvA.getContext('2d',{willReadFrequently:true}),B=PX(cvs[1]),W=B.W,H=B.H,u=B.u32,svg=$('svg',root),ro=$('[data-ro]',root),mA=mtr(),mB=mtr();
  const G=mkGround(W,H,8,{dim:.7}),NMAX=4000,SW=SPKS[0][0].w,SO=SPKS[0][0].ox;
  const mk=(w,h)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;};
  // ground as a canvas, and the 6 x 5 spark atlas, both drawn once
  const gcv=mk(W,H),gimg=gcv.getContext('2d').createImageData(W,H);new Uint32Array(gimg.data.buffer).set(G);gcv.getContext('2d').putImageData(gimg,0,0);
  const atlas=mk(SW*5,SW*6),ax=atlas.getContext('2d'),aimg=ax.createImageData(SW*5,SW*6),au=new Uint32Array(aimg.data.buffer);
  for(let e=0;e<6;e++)for(let f=0;f<5;f++){const s=SPKS[e][f];for(let j=0;j<SW;j++)for(let i=0;i<SW;i++){const v=s.d[j*SW+i];if(v)au[(e*SW+j)*SW*5+f*SW+i]=RP[e][v===6?5:v];}}ax.putImageData(aimg,0,0);
  const EX=new Int16Array(NMAX),EY=new Int16Array(NMAX),EE=new Uint8Array(NMAX),EP=new Float32Array(NMAX);
  for(let i=0;i<NMAX;i++){EX[i]=SO+1+((hash2(i,3)*(W-SW-2))|0);EY[i]=SO+1+((hash2(i,5)*(H-SW-2))|0);EE[i]=(hash2(i,7)*6)|0;EP[i]=hash2(i,9)*5;}
  ctx.imageSmoothingEnabled=false;let tt=0,since=1,lastKey='';
  function frame(dt){const n=c.v('n');c.out('n',nf(n));const q=tt/.075;
    mA.a();ctx.drawImage(gcv,0,0);for(let i=0;i<n;i++){const f=((q+EP[i])%5)|0;ctx.drawImage(atlas,f*SW,EE[i]*SW,SW,SW,EX[i]-SO,EY[i]-SO,SW,SW);}ctx.getImageData(0,0,1,1);const a=mA.b();
    mB.a();u.set(G);for(let i=0;i<n;i++){const f=((q+EP[i])%5)|0,e=EE[i],s=SPKS[e][f].d,rp=RP[e],b=(EY[i]-SO)*W+EX[i]-SO;for(let j=0,k=0;j<SW;j++){const row=b+j*W;for(let x=0;x<SW;x++,k++){const v=s[k];if(v)u[row+x]=rp[v===6?5:v];}}}B.put();const b=mB.b();
    setHud(root,`${nf(n)} drawImage calls · ${f3(a)} ms`,'a');setHud(root,`1 putImageData · ${f3(b)} ms`,'b');
    since+=dt;const key=n+'|'+(svg.getBoundingClientRect().width<520);if(since>.4||key!==lastKey){since=0;lastKey=key;
      const A='#ff8f7a',Bc='#b5d98a',R='#a088ff',R2='#5a4f8a',Gp='#e8c45a';
      logBars(svg,[{lab:`Here: ${nf(n)} sparks, one drawImage each`,v:a,s:f3(a)+' live',col:A},{lab:`Here: ${nf(n)} sparks, one pixel buffer`,v:b,s:f3(b)+' live',col:Bc},
        {lab:'Report CPU: 2,000 particles, drawImage each',v:1.66,s:'1.66',col:R,v2:10.5,s2:'10.5 at 6x throttle',col2:R2},{lab:'Report CPU: 2,000 particles, pixel writes',v:.02,s:'0.020',col:R,v2:.13,s2:'0.13 at 6x throttle',col2:R2},
        {lab:'Report CPU: 120 flipbooks 32x32, drawImage',v:.18,s:'0.18',col:R,v2:1.09,s2:'1.09 at 6x throttle',col2:R2},{lab:'Report CPU: 120 flipbooks 32x32, ramp blit',v:.1,s:'0.10',col:R,v2:1.01,s2:'1.01 at 6x throttle',col2:R2},
        {lab:'Report GPU: 480 flipbooks 64x64, one draw',v:.058,s:'0.058 wall',col:Gp},{lab:'Report GPU: 32,000 particles, one instanced draw',v:.26,s:'0.26 wall',col:Gp},{lab:'Report GPU: 2,000 stateless particles, one draw',v:.0095,s:'0.0095 wall',col:Gp}],
        {lo:-3,hi:2,lines:[[2,'2 ms effect budget','#a7b0da',0],[16.7,'16.7 ms frame','#ff6b5e',13]]});
      ro.innerHTML=`Same ${nf(n)} sparks, same picture. One <code>drawImage</code> each <b>${f3(a)} ms</b>, one pixel buffer <b>${f3(b)} ms</b>, ${a>b?(a/b).toFixed(1)+' times cheaper':'about the same'} (live, this device, software canvas).`+
        `<br>In Godot 4 Compatibility every particle node is its own draw call, so 30 casters with 3 particle nodes each is 90 draws before a sprite. A per-sprite uniform that splits the batch costs 2x to 2.5x the batched frame (report, measured in WebGL2). Godot itself was not measured.`;}}
  c.on('n',()=>{since=1;});addEventListener('resize',()=>{lastKey='';});frame(0);
  return {tick(dt){tt+=dt;frame(dt);}};});

// ======================================================================
// G2 glow three ways: additive halos, palette-ramp glow, low-res buffer
// ======================================================================
reg('glow',root=>{const c=ctl(root),cvs=$$('canvas',root),PS=cvs.map(cv=>PX(cv)),pens=PS.map(Pen),W=PS[0].W,H=PS[0].H,ro=$('[data-ro]',root),outs=$$('[data-m]',root),ms=[mtr(),mtr(),mtr()];
  const GD=mkGround(W,H,12,{dim:.42}),GB=new Uint32Array(W*H);
  {const SD=['#cfb47a','#e0c890','#eedcae','#f6ecd0'].map(hx);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=vnoise(x/6,y/5),q=hash2(x*3+1,y*5+2);GB[y*W+x]=q>.94?SD[3]:q<.05?SD[0]:v>.55?SD[2]:SD[1];}}
  shadow(GD,W,H,48,46,6);shadow(GB,W,H,48,46,6);
  const LW=W>>2,LH=H>>2,LR=new Float32Array(LW*LH),LG=new Float32Array(LW*LH),LB=new Float32Array(LW*LH),TMP=new Float32Array(LW*LH),IDX=new Uint8Array(W*H),IEL=new Uint8Array(W*H);
  const LEL=[0,1,5,3,4,2,0,1,5,3],LX=new Float32Array(10),LY=new Float32Array(10),cols=[0,0,0];let tt=0,fc=0;
  const blur=a=>{for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){let s=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<LW&&yy<LH)s+=a[yy*LW+xx];}TMP[y*LW+x]=s/9;}a.set(TMP);};
  function frame(){const n=c.v('crowd')?10:3,G=c.v('sand')?GB:GD;
    for(let k=0;k<n;k++){LX[k]=Math.round(48+36*Math.sin(tt*(.45+k*.07)+k*2.1));LY[k]=Math.round(30+20*Math.sin(tt*(.38+k*.05)+k*1.3+1));}
    // 1 additive halos: smooth, many colours, clips toward white where lights stack
    {const P=PS[0],u=P.u32,pen=pens[0];ms[0].a();u.set(G);pen.spr(SP_OWN,48,46);
      for(let k=0;k<n;k++){const rp=RP[LEL[k]],lc=rp[3],R=14,cx=LX[k],cy=LY[k];for(let j=-R;j<=R;j++){const y=cy+j;if(y<0||y>=H)continue;for(let i=-R;i<=R;i++){const x=cx+i;if(x<0||x>=W)continue;const d2=(i*i+j*j)/(R*R);if(d2>=1)continue;const w=(1-d2)*(1-d2)*.8,q=y*W+x;u[q]=addc(u[q],pack(cr(lc)*w,cg(lc)*w,cb(lc)*w));}}}
      for(let k=0;k<n;k++)pen.orb(LX[k],LY[k],2.4,RP[LEL[k]]);P.put();ms[0].b();}
    // 2 palette ramp: ramp steps in an index buffer, a 6-entry table colours them, overlap climbs one step
    {const P=PS[1],u=P.u32,pen=pens[1];ms[1].a();u.set(G);pen.spr(SP_OWN,48,46);IDX.fill(0);
      for(let k=0;k<n;k++){const cx=LX[k],cy=LY[k],R=12;for(let j=-R;j<=R;j++){const y=cy+j;if(y<0||y>=H)continue;for(let i=-R;i<=R;i++){const x=cx+i;if(x<0||x>=W)continue;const d=Math.hypot(i,j);if(d>R)continue;
        const s=d<1.6?5:d<3?4:d<5?3:d<8.5?2:1,q=y*W+x,o=IDX[q];if(o){IDX[q]=Math.min(5,Math.max(o,s)+1);if(s>=o)IEL[q]=LEL[k];}else{IDX[q]=s;IEL[q]=LEL[k];}}}}
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const q=y*W+x,s=IDX[q];if(!s)continue;const rp=RP[IEL[q]];if(s>=3)u[q]=rp[s];else if(s===2){if(((x+y)&1)===0)u[q]=rp[3];}else if(bay(x,y)<3)u[q]=rp[3];}
      for(let k=0;k<n;k++){const x=LX[k],y=LY[k];for(let a=0;a<28;a++){const xx=Math.round(x+Math.cos(a/28*6.2832)*4.2),yy=Math.round(y+Math.sin(a/28*6.2832)*4.2);if(xx>=0&&yy>=0&&xx<W&&yy<H&&IDX[yy*W+xx]<4)u[yy*W+xx]=INK;}}
      P.put();ms[1].b();}
    // 3 low-res buffer: max-splat into W/4 x H/4, 3x3 block blur, each pixel picks a level through a Bayer threshold
    {const P=PS[2],u=P.u32,pen=pens[2];ms[2].a();u.set(G);pen.spr(SP_OWN,48,46);LR.fill(0);LG.fill(0);LB.fill(0);
      for(let k=0;k<n;k++){const lc=RP[LEL[k]][3],cx=LX[k]/4,cy=LY[k]/4,R=3.6;for(let y=Math.max(0,(cy-R)|0);y<=Math.min(LH-1,(cy+R)|0);y++)for(let x=Math.max(0,(cx-R)|0);x<=Math.min(LW-1,(cx+R)|0);x++){const d=Math.hypot(x+.5-cx,y+.5-cy)/R;if(d>=1)continue;const w=(1-d*d)*1.5,q=y*LW+x;
        LR[q]=Math.max(LR[q],w*cr(lc));LG[q]=Math.max(LG[q],w*cg(lc));LB[q]=Math.max(LB[q],w*cb(lc));}}
      blur(LR);blur(LG);blur(LB);
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const q=(y>>2)*LW+(x>>2),r=LR[q],g=LG[q],b=LB[q],I=Math.max(r,g,b)/255;if(I<.04)continue;const lv=Math.min(3,Math.floor(I*3+BAYER[(y&3)*4+(x&3)]/16));if(!lv)continue;const k=lv/3*.62/I,i=y*W+x;u[i]=addc(u[i],pack(r*k,g*k,b*k));}
      for(let k=0;k<n;k++)pen.orb(LX[k],LY[k],2.4,RP[LEL[k]]);P.put();ms[2].b();}
    if(fc++%12===0)PS.forEach((P,i)=>{cols[i]=new Set(P.u32).size;});
    outs.forEach((o,i)=>{o.textContent=`${cols[i]} colours · ${f3(ms[i].v)} ms live`;});
    if(fc%12===1)ro.innerHTML=`${n} lights on a ${W}x${H} canvas. Colours on screen: additive <b>${cols[0]}</b>, ramp <b>${cols[1]}</b>, buffer <b>${cols[2]}</b>. The ramp adds at most 5 colours per element to the scene's own.`+
      `<br>Report, measured: 240 additive halo sprites 0.46 ms on the M4 CPU (2.8 at 6x throttle), the 80x45 buffer 0.095 ms for the whole frame (0.58). On the GPU, 240 additive quads 0.0097 ms and an 80x45 blur composited to 720p 0.043 ms.`;}
  ['crowd','sand'].forEach(k=>c.on(k,()=>{fc=0;}));frame();
  return {tick(dt){tt+=dt;frame();}};});

// ======================================================================
// H1 particles: Reeves emission, a struct-of-arrays pool with swap-remove against allocating objects
// ======================================================================
reg('particles',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),W=P.W,H=P.H,u=P.u32,pen=Pen(P),ro=$('[data-ro]',root),mS=mtr(),mO=mtr(),mD=mtr();
  const G=mkGround(W,H,14,{dim:.5,grass:10});shadow(G,W,H,96,96,6);
  const CAP=24000,X=new Float32Array(CAP),Y=new Float32Array(CAP),VX=new Float32Array(CAP),VY=new Float32Array(CAP),L=new Float32Array(CAP),M=new Float32Array(CAP);let n=0,objs=[];
  const SV=new Float32Array(1024*3),EX=96,EY=70,GRAV=120,TS={own:1,party:.7,others:.5};let last={raw:0,n:0};
  function frame(dt){const mean=c.v('mean'),vr=c.v('var'),tier=c.segv('tier'),pool=c.segv('pool'),el=tier==='own'?5:tier==='party'?1:2;c.out('mean',mean);c.out('var',vr);
    // Reeves 1983: NParts = MeanParts + Rand() x VarParts, Rand uniform in -1..1, then the tier scales emission
    const raw=Math.max(0,Math.round(mean+(rnd()*2-1)*vr)),em=Math.min(1024,Math.round(raw*TS[tier]));last={raw,n:em};
    for(let i=0;i<em;i++){const a=-1.5708+(rnd()-.5)*1.1,s=70+rnd()*60;SV[i*3]=Math.cos(a)*s;SV[i*3+1]=Math.sin(a)*s;SV[i*3+2]=.7+rnd()*.7;}
    const dr=1-.8*dt;
    mS.a();for(let i=0;i<em&&n<CAP;i++,n++){X[n]=EX;Y[n]=EY;VX[n]=SV[i*3];VY[n]=SV[i*3+1];L[n]=M[n]=SV[i*3+2];}
    for(let i=0;i<n;){const l=L[i]-dt;if(l<=0){n--;X[i]=X[n];Y[i]=Y[n];VX[i]=VX[n];VY[i]=VY[n];L[i]=L[n];M[i]=M[n];continue;}L[i]=l;VX[i]*=dr;VY[i]+=GRAV*dt;X[i]+=VX[i]*dt;Y[i]+=VY[i]*dt;i++;}const a=mS.b();
    mO.a();for(let i=0;i<em&&objs.length<CAP;i++)objs.push({pos:{x:EX,y:EY},vel:{x:SV[i*3],y:SV[i*3+1]},life:SV[i*3+2],max:SV[i*3+2]});
    for(const p of objs){p.life-=dt;p.vel={x:p.vel.x*dr,y:p.vel.y+GRAV*dt};p.pos={x:p.pos.x+p.vel.x*dt,y:p.pos.y+p.vel.y*dt};}objs=objs.filter(p=>p.life>0);const b=mO.b();
    mD.a();u.set(G);pen.spr(SP_OWN,96,96);const rp=RP[el];
    for(let k=0;k<5;k++)pen.p(EX+3,EY+2+k*3,hx('#8a6a3a'));pen.orb(EX+3,EY,2,rp);
    if(pool==='soa')for(let i=0;i<n;i++){const x=X[i]|0,y=Y[i]|0;if(x<0||y<0||x>=W||y>=H)continue;u[y*W+x]=rp[1+((L[i]/M[i]*4.99)|0)];}
    else for(const p of objs){const x=p.pos.x|0,y=p.pos.y|0;if(x<0||y<0||x>=W||y>=H)continue;u[y*W+x]=rp[1+((p.life/p.max*4.99)|0)];}
    P.put();const d=mD.b();
    setHud(root,`${nf(pool==='soa'?n:objs.length)} live · ${pool==='soa'?'struct of arrays':'objects'}`);
    ro.innerHTML=`This frame: N = ${mean} + rand x ${vr} = <b>${last.raw}</b>, times ${TS[tier]} for the ${tier} tier = <b>${last.n}</b> new particles.`+
      `<br>Update of ${nf(n)} particles: struct of arrays with swap-remove <b>${f3(a)} ms</b>, objects with fresh vectors and <code>filter()</code> <b>${f3(b)} ms</b>${a>0?`, ${(b/a).toFixed(1)} times slower`:''}. Pixel-write draw ${f3(d)} ms (all live).`+
      `<br>Report, measured: 2,000 particles step in 0.0068 ms on the M4 (0.042 at 6x throttle), 1.3x faster than plain objects and 3.3x faster than fresh vectors with <code>filter()</code>. At 32,000 on the proxy the allocating pool's p90 is 3.2 ms against 0.72 ms.`;}
  c.seg('tier',()=>{});c.seg('pool',()=>{});frame(1/60);return {tick(dt){frame(dt);}};});

// ======================================================================
// H2 demoscene buffers: feedback trails, a DOOM-fire aura, palette cycling
// ======================================================================
reg('feedback',root=>{const c=ctl(root),cvs=$$('canvas',root),PS=cvs.map(cv=>PX(cv)),W=PS[0].W,H=PS[0].H,ro=$('[data-ro]',root),outs=$$('[data-m]',root),ms=[mtr(),mtr(),mtr()];
  const G=mkGround(W,H,16,{dim:.45}),G2=mkGround(W,H,17,{dim:.5}),G3=mkGround(W,H,18,{dim:.5});shadow(G2,W,H,32,42,6);
  const FB=new Uint8Array(W*H),FT=new Uint8Array(W*H),FW=16,FH=24,FX0=24,FY0=18,FIRE=new Uint8Array(FW*FH),pens=PS.map(Pen);
  // palette-cycled portal: the index image is drawn once and never changes
  const CI=new Uint8Array(W*H);{const cx=32,cy=25,rx=25,ry=17;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x-cx)/rx,dy=(y-cy)/ry,d=Math.sqrt(dx*dx+dy*dy);if(d>1.08)continue;if(d>.94){CI[y*W+x]=d>1?10:9;continue;}
    const a=Math.atan2(dy,dx);CI[y*W+x]=1+((Math.floor(d*11-a*8/6.2832*2+64))&7);}}
  const CYC=[1,2,3,4,5,4,3,2],mx=[0,0],my=[0,0],lx=[20,44],ly=[24,24];let acc=0,cacc=0,off=0,tt=0;
  const stamp=(x,y,v)=>{x|=0;y|=0;if(x>0&&y>0&&x<W-1&&y<H-1){const i=y*W+x;FB[i]=v;if(FB[i-1]<v-1)FB[i-1]=v-1;if(FB[i+1]<v-1)FB[i+1]=v-1;if(FB[i-W]<v-1)FB[i-W]=v-1;if(FB[i+W]<v-1)FB[i+W]=v-1;}};
  function step(){const dec=c.v('dec'),up=c.v('up'),rd=c.v('rd'),heat=c.v('heat');
    ms[0].a();for(let y=0;y<H;y++){const sy=up?y+1:y;for(let x=0;x<W;x++){const v=sy<H?FB[sy*W+x]:0,d=rd?(rnd()*2)|0:dec;FT[y*W+x]=v>d?v-d:0;}}FB.set(FT);
    for(let k=0;k<2;k++){const t=tt*(k?1.3:1)+k*2,nx=32+24*Math.sin(t*1.9),ny=22+15*Math.sin(t*2.7+k);for(let s=1;s<=4;s++)stamp(lx[k]+(nx-lx[k])*s/4,ly[k]+(ny-ly[k])*s/4,5);lx[k]=nx;ly[k]=ny;mx[k]=nx;my[k]=ny;}ms[0].b();
    ms[1].a();for(let x=0;x<FW;x++){const e=Math.abs(x-8);FIRE[(FH-1)*FW+x]=e<3?heat:e<5?Math.max(0,heat-3):0;}
    for(let x=0;x<FW;x++)for(let y=1;y<FH;y++){const src=y*FW+x,v=FIRE[src];if(!v){FIRE[src-FW]=0;continue;}const r=(rnd()*4)&3,dx=clamp(x-r+1,0,FW-1);FIRE[(y-1)*FW+dx]=Math.max(0,v-(r&1));}ms[1].b();}
  function frame(dt){tt+=dt;acc+=dt*20;let g=0;while(acc>=1&&g++<3){acc--;step();}
    const sp=c.v('sp'),heat=c.v('heat');c.out('dec',c.v('rd')?'rand & 1':c.v('dec'));c.out('heat',heat);c.out('sp',sp+' per second');cacc+=dt*sp;while(cacc>=1){cacc--;off=(off+7)&7;}
    {const u=PS[0].u32,rp=RP[1];u.set(G);for(let i=0;i<u.length;i++){const v=FB[i];if(v)u[i]=rp[v];}for(let k=0;k<2;k++)pens[0].orb(mx[k],my[k],1.5,rp);PS[0].put();}
    {const u=PS[1].u32,rp=RP[0];u.set(G2);for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const v=FIRE[y*FW+x];if(!v)continue;const q=v/heat;u[(FY0+y)*W+FX0+x]=rp[q>.8?5:q>.6?4:q>.4?3:q>.2?2:1];}pens[1].spr(SP_OWN,32,42);PS[1].put();}
    {const u=PS[2].u32,rp=RP[5];ms[2].a();u.set(G3);for(let i=0;i<u.length;i++){const v=CI[i];if(!v)continue;u[i]=v===10?INK:v===9?rp[2]:rp[CYC[(v-1+off)&7]];}ms[2].b();PS[2].put();}
    outs[0].textContent=`${nf(W*H)} cells per step · ${f3(ms[0].v)} ms`;outs[1].textContent=`${FW*FH} cells per step · ${f3(ms[1].v)} ms`;outs[2].textContent=`0 cells, 8 palette writes per step`;
    ro.innerHTML=`Feedback: every cell loses ${c.v('rd')?'<code>rand & 1</code>':c.v('dec')} per step${c.v('up')?' and moves up 1 px':''}, so a 5-step ramp leaves a trail of about ${c.v('rd')?10:Math.ceil(5/c.v('dec'))} steps with no stored particles. Buffers step 20 times per second here.`+
      `<br>Report, measured: a full-screen feedback buffer for 240 missiles costs 0.066 ms on the M4 CPU (0.41 at 6x throttle) and 0.022 ms on the GPU, nearly flat in missile count. A 16x24 fire aura is 384 operations per frame.`;}
  frame(0);return {tick:frame};});

// ======================================================================
// H3 procedural sigils and two dissolves
// ======================================================================
reg('sigil',root=>{const c=ctl(root),cv=$('canvas',root),P=PX(cv),W=P.W,H=P.H,u=P.u32,pen=Pen(P),ro=$('[data-ro]',root),m=mtr();
  const G=mkGround(W,H,21,{dim:.6}),PANEL=hx('#0b0a11'),PLINE=hx('#362e57');for(let y=0;y<H;y++)for(let x=0;x<80;x++)G[y*W+x]=x===79?PLINE:((x+y)&7)===0&&(y&7)===0?hx('#1b172d'):PANEL;
  shadow(G,W,H,118,60,6);
  const NEL={3:0,4:6,5:5,6:1,7:2,8:4},NNAME={3:'fire',4:'earth',5:'arcane',6:'ice',8:'holy'},gone=new Uint8Array(W*H);let seed=7,flat=null,sq=null,key='',t=0,lfsr=1,stepsF=0,lastPh=-1;
  function mk(sy,n,k){const mp=new Map(),rng=mkRng(seed*977+n*13+k);
    const put=(x,y,tn)=>{const X=Math.round(x),Y=Math.round(y*sy),q=(Y+64)*256+X+64,a=((Math.atan2(y,x)/6.2832+1.25)%1*256)|0,o=mp.get(q);if(!o||o[3]<tn)mp.set(q,[X,Y,a,tn]);};
    const circ=(r,tn)=>{const s=Math.ceil(r*7);for(let i=0;i<s;i++){const a=i/s*6.2832;put(Math.cos(a)*r,Math.sin(a)*r,tn);}};
    const seg=(x0,y0,x1,y1,tn)=>{const s=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*1.6);for(let i=0;i<=s;i++)put(x0+(x1-x0)*i/s,y0+(y1-y0)*i/s,tn);};
    const vx=(i,r,o=0)=>[Math.cos(-1.5708+o+i*6.2832/n)*r,Math.sin(-1.5708+o+i*6.2832/n)*r];
    circ(28,4);circ(23,3);
    const ng=6+((rng()*7)|0);for(let g=0;g<ng;g++){const a=g/ng*6.2832+.2,gx=Math.cos(a)*25.5,gy=Math.sin(a)*25.5,bits=(rng()*511)|0||21;for(let j=0;j<3;j++)for(let i=0;i<3;i++)if(bits>>(j*3+i)&1)put(gx+i-1,gy+(j-1)/Math.max(sy,.5),5);}
    for(let i=0;i<n;i++){const a=vx(i,22),b=vx(i+k,22);seg(a[0],a[1],b[0],b[1],4);}
    const rin=k>1?22*Math.cos(Math.PI*k/n)/Math.cos(Math.PI*(k-1)/n):22*Math.cos(Math.PI/n);
    if(rng()<.5)circ(rin*.78,3);else for(let i=0;i<n;i++){const a=vx(i,rin*.8,Math.PI/n),b=vx(i+1,rin*.8,Math.PI/n);seg(a[0],a[1],b[0],b[1],3);}
    if(rin>9)circ(3,5);put(0,0,5);
    for(let i=0;i<n;i++){const a=vx(i,22);put(a[0],a[1],5);put(a[0]+1,a[1],5);put(a[0]-1,a[1],5);put(a[0],a[1]+1/Math.max(sy,.5),5);put(a[0],a[1]-1/Math.max(sy,.5),5);}
    return [...mp.values()];}
  c.btn('seed',()=>{seed=(seed*31+17)%997;key='';});
  const T1=1.5,T2=1.2,T3=1.2,T4=.5,TT=T1+T2+T3+T4;
  function frame(dt){const n=c.v('n'),k=Math.max(1,Math.min(c.v('k'),Math.floor((n-1)/2))),mode=c.segv('dis'),kk=n+'/'+k+'/'+seed;c.out('n',n);c.out('k',k);
    if(kk!==key){flat=mk(1,n,k);sq=mk(.5,n,k);key=kk;}
    t=(t+dt)%TT;const ph=t<T1?0:t<T1+T2?1:t<T1+T2+T3?2:3,p=ph===0?t/T1:ph===1?(t-T1)/T2:ph===2?(t-T1-T2)/T3:1,rp=RP[NEL[n]];
    if(ph!==lastPh){if(ph===2||ph===0){gone.fill(0);lfsr=1;}lastPh=ph;}
    stepsF=0;if(ph===2&&mode==='fizz'){stepsF=Math.round(131071*dt/T3);for(let s=0;s<stepsF;s++){const y=lfsr&255,x=(lfsr&0x1ff00)>>8,lsb=lfsr&1;lfsr>>=1;if(lsb)lfsr^=0x12000;if(x<W&&y<H)gone[y*W+x]=1;if(lfsr===1){gone.fill(1);break;}}}
    m.a();u.set(G);let vis=0;
    const drawSet=(L,cx,cy)=>{for(let i=0;i<L.length;i++){const e=L[i],x=cx+e[0],y=cy+e[1];if(x<0||y<0||x>=W||y>=H)continue;let col=rp[e[3]];
        if(ph===0){const d=p*256-e[2];if(d<=0)continue;if(d<14)col=rp[5];}
        else if(ph===2){if(mode==='bayer'){if((1-p)*16<=BAYER[(y&3)*4+(x&3)])continue;}else if(gone[y*W+x])continue;}
        else if(ph===3)continue;
        u[y*W+x]=col;vis++;}};
    drawSet(flat,40,48);drawSet(sq,118,60);pen.spr(SP_OWN,118,61);
    if(ph===0){const a=p*6.2832-1.5708;pen.star(Math.round(40+Math.cos(a)*28),Math.round(48+Math.sin(a)*28),WHITE,rp[5]);}
    P.put();const msv=m.b();
    setHud(root,['draw-in by angle','hold','dissolve, '+(mode==='bayer'?'Bayer threshold':'fizzlefade'),''][ph]+(ph<3?` ${Math.round(p*100)}%`:''));
    ro.innerHTML=`Star polygon {${n}/${k}}, seed ${seed}${NNAME[n]?`, ${n} sides for ${NNAME[n]} in our mapping`:', no element in our mapping'}. The atlas copy takes <b>${nf(flat.length)} pixel writes</b>, once (the report counts about 700 at radius 28). The squashed copy takes ${nf(sq.length)}.`+
      `<br>Run time: one compare per pixel, 57x57 = 3,249 compares for the atlas sprite`+(mode==='fizz'?`. Fizzlefade: a 17-bit LFSR with taps 0x12000 visits each of 131,071 states once${stepsF?`, ${nf(stepsF)} steps this frame`:''}.`:'. Bayer: visible when <code>alpha * 16 &gt; B4[y &amp; 3][x &amp; 3]</code>, 17 levels, no state.')+
      `<br>This frame <b>${f3(msv)} ms</b> (live). Report, measured: a Bayer palette select over 320x180 costs 0.064 ms on the M4 and 0.39 ms at 6x throttle.`;}
  ['n','k'].forEach(q=>c.on(q,()=>{}));c.seg('dis',()=>{});frame(0);return {tick:frame};});

// ======================================================================
// §6a measured costs on a log axis. Every number is copied from the report's tables.
// ======================================================================
// CPU rows: [task, size, M4 Pro, 6x throttle, profiles, anti-pattern]
const C6=[['Particles, pixel writes plus one putImageData','2,000','0.020','0.13','C2, H1',0],['Particles, one drawImage each','2,000','1.66','10.5','anti-pattern',1],
  ['Impact flipbooks 32x32, drawImage','120','0.18','1.09','C1',0],['Impact flipbooks 32x32, ramp blit','120','0.10','1.01','C1, E2',0],
  ['Glow buffer 80x45, whole frame','2,000 particles, 120 discs','0.095','0.58','G2',0],['Glow as additive halo sprites','240','0.46','2.8','G2',0],
  ['Trail, 12-point ring, Bresenham','240 missiles','0.044','0.27','B5',0],['Trail, afterimages through drawImage','240 missiles','1.0','6.35','anti-pattern',1],
  ['Lightning, pixel lines, re-roll every frame','40 bolts','0.095','0.62','B7',0],['Lightning, Canvas2D strokes','40 bolts','0.92','5.85','anti-pattern',1],
  ['Tile effects 16x16, drawImage','2,190','2.2','14.1','A3',0],['Tile effects 16x16, ramp blit','2,190','0.51','2.87','A3',0],['Tile effects, one per tile, ramp blit','220','0.060','0.39','A3, F2',0],
  ['Shockwave ring with frame copy','radius 40','0.026','0.16','C4',0],['Auras and orbiters, pixel blits','30 characters','0.039','0.24','D1, D4',0]];
// GPU rows: [pass, size, 320x180 M4 wall, 1280x720 M4 wall, profiles]
const G6=[['Particles, stateless in the vertex shader','2,000','0.0095',null,'C2, H1'],['Particles, instanced, buffer upload','32,000','0.26','0.36','G1'],['Flipbooks 64x64, alpha blend','480','0.058','0.52','C1'],
  ['Glow as additive halo quads','240','0.0097','0.070','G2'],['Separable 9-tap blur plus composite','full screen','0.032','0.14','G2'],['Low-res glow at 80x45, blur, composite','120 impacts','0.042','0.043','G2'],
  ['Tile effects 16x16','2,190','0.024','0.17','A3'],['Shockwave distortion with screen copy','1','0.021','0.039','C4'],['Auras, 9 sprites per character, one batch','30 characters','0.0061',null,'D1']];
// whole scene: [pipeline, M4 at 1x 4x 16x, 6x throttle at 1x 4x 16x or null, kind]
const S6=[['Pixel buffer, clarity off',['0.26','0.63','2.0'],['1.5','3.9','12.6'],'px'],['Pixel buffer, clarity on',['0.20','0.51','1.74'],['1.11','3.1','10.6'],'px'],
  ['Canvas2D draw calls, clarity off',['0.97','3.97','15.5'],['6.15','24.9','98.5'],'bad'],['WebGL2 at 320x180 plus 4x upscale, M4 wall',['0.090','0.095','0.25'],null,'gpu'],
  ['WebGL2 native 1280x720, M4 wall',['0.24','0.32','0.66'],null,'gpu'],['WebGL2 on SwiftShader, 320x180',['35','139','556'],null,'bad']];
reg('costs',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const KC={cpu:'#a088ff',thr:'#5a4f8a',bad:'#ff8f7a',badthr:'#8a4a44',gpu:'#e8c45a',px:'#b5d98a',pxthr:'#5f7a44'};
  c.seg('v',v=>{$$('[data-for]',root).forEach(e=>e.hidden=e.dataset.for!==v);draw();});c.seg('res',draw);c.seg('load',draw);addEventListener('resize',()=>draw());
  function draw(){const view=c.segv('v');let rows=[],note='',legend=[];
    if(view==='cpu'){rows=C6.map(r=>({lab:r[0],sub:`${r[1]} · ${r[4]}`,v:+r[2],s:r[2],col:r[5]?KC.bad:KC.cpu,v2:+r[3],s2:r[3],col2:r[5]?KC.badthr:KC.thr}));
      legend=[['cpu','M4 Pro'],['thr','6x CPU throttle, a low-end proxy'],['bad','anti-pattern']];
      note='Every anti-pattern is a Canvas2D call per item. 2,000 particles cost <b>0.020 ms</b> as pixel writes and <b>1.66 ms</b> as one <code>drawImage</code> each, 83 times more. At 6x throttle the 2,190 tile effects of 30 area spells take 14.1 ms with <code>drawImage</code>, 2.87 ms as ramp blits and 0.39 ms with one effect per tile.';}
    else if(view==='gpu'){const ri=+c.segv('res');rows=G6.map(r=>({lab:r[0],sub:`${r[1]} · ${r[4]}`,v:r[ri]===null?null:+r[ri],s:r[ri]||'',col:KC.gpu}));
      legend=[['gpu',ri===2?'320x180, M4 wall clock':'1280x720, M4 wall clock']];
      note=ri===2?'At 320x180 every batched pass stays under 0.3 ms. The dearest is <b>32,000 instanced particles at 0.26 ms</b>, a count no spell fight reaches.':'At 1280x720 fill rate shows. Flipbooks rise from 0.058 to <b>0.52 ms</b> and tile effects from 0.024 to 0.17 ms, while the 80x45 glow buffer stays at 0.043 ms. On multi-pass tests the GPU timer query reads up to 2.5x higher than wall clock there.';
      note+=' Software GL pays about 13.5 µs per quad, 27 ms for 2,000 particles.';}
    else{const li=+c.segv('load');rows=S6.map(r=>({lab:r[0],v:+r[1][li],s:r[1][li],col:KC[r[3]],v2:r[2]?+r[2][li]:null,s2:r[2]?r[2][li]+' at 6x throttle':'',col2:r[3]==='bad'?KC.badthr:KC.pxthr}));
      legend=[['px','pixel buffer, M4'],['pxthr','the same at 6x throttle, a low-end proxy'],['gpu','WebGL2, M4 wall clock'],['bad','avoid']];
      note=['The 1x load is 30 missiles with trails, 30 impacts, 148 tile effects, 1,300 particles, 4 bolts, 30 auras, one glow pass, one shockwave and one vignette. It costs <b>1.5 ms</b> on the proxy and 0.090 ms of GPU work, inside the 2 ms effect budget.',
        'At 4x the pixel buffer takes 3.9 ms on the proxy and Canvas2D draw calls 24.9 ms, past the frame. The GPU path barely moves, 0.090 to 0.095 ms.',
        'At 16x on the proxy the pixel buffer takes <b>12.6 ms</b>, and clarity on saves 16%, down to 10.6 ms. Tiles (3.16 ms), auras (2.75 ms) and impacts (2.36 ms) dominate, against 0.94 ms for particles. SwiftShader takes 556 ms, so software GL is not a fallback.'][li];}
    logBars(svg,rows,{lo:-3,hi:3,sub:view!=='scene',lines:[[2,'2 ms effect budget','#a7b0da',0],[16.7,'16.7 ms frame','#ff6b5e',13]]});
    leg.innerHTML=legend.map(([k,l])=>`<span><i style="background:${KC[k]}"></i>${l}</span>`).join('')+'<span><i style="background:#a7b0da"></i>2 ms effect budget</span><span><i style="background:#ff6b5e"></i>16.7 ms frame</span>';
    ro.innerHTML=note+' <span style="color:var(--mute)">Source: the study\'s benchmark [S13], Apple M4 Pro, Chromium 153, 320x180 unless stated, median ms per frame. The 6x throttle is a low-end proxy. No phone was measured.</span>';}
  draw();return {};});

// ======================================================================
// §5 scorecard: sortable heat table + radar. Rows come from the page's SCORE
// data when the build provides it; the copy below is the report's table.
// [id, technique, Simplicity, Speed, Pixel taste, Mood, Readability, Sum]
// ======================================================================
const MS5=[['A1','Tibia magic effect, 75 ms clock',5,5,5,3,4,22],['A2','Tibia missile, 150 x sqrt(tiles)',5,5,5,3,4,22],['A3','Area masks and the UE',5,4,4,4,5,22],['A4','Pokémon battle scripts',4,5,5,5,4,23],
  ['A5','Diablo missile tables',4,5,4,5,4,22],['A6','Fat packets (UO, RO, RuneScape)',3,4,3,4,4,18],['A7','Console screen tricks',4,5,5,5,3,22],['B1','8 pre-drawn directions',5,5,5,3,5,23],
  ['B2','Flight paths as functions of time',5,5,4,3,5,22],['B3','Turn-limited homing',4,5,4,4,4,21],['B4','Lobbed arc with shadow',4,5,4,4,5,22],['B5','Trails (ribbon, afterimages, wake)',4,5,4,4,4,21],
  ['B6','Beams and channels',4,5,4,4,5,22],['B7','Midpoint chain lightning',4,5,5,5,4,23],['C1','Hit spark anatomy',5,5,5,4,5,24],['C2','Stateless layered explosions',4,5,4,5,4,22],
  ['C3','Ring-by-ring area waves',4,5,4,5,4,22],['C4','Shockwave rings as geometry',5,5,4,4,4,22],['C5','Residue decals and fields',4,5,4,4,3,20],['D1','Back and front slots',5,5,4,4,4,22],
  ['D2','Motes, heal, haste ghosts',5,5,4,4,3,21],['D3','Rim-only shields',4,5,4,4,5,22],['D4','Status tint by priority',5,5,4,4,5,23],['D5','Cast circles and charge-ups',3,5,5,5,5,23],
  ['E1','Timing, early climax, short tail',5,5,5,5,5,25],['E2','Ramps, outlines, value contrast',5,5,5,4,5,24],['E3','Element language, colour-blind safety',4,5,5,5,5,24],['F1','Owner tiers, per-source opacity',4,5,3,3,5,20],
  ['F2','Cap, eviction, same-tile merge',4,5,3,2,5,19],['F3','Screen feedback',5,5,4,4,4,22],['F4','Flash limiter, reduce flashing',4,5,3,2,5,19],['G1','Web draw paths, no GPU particles',3,5,4,3,3,18],
  ['G2','Glow three ways',4,5,5,5,4,23],['H1','Reeves to stateless bursts',5,5,4,4,3,21],['H2','Demoscene buffers as magic',4,4,4,5,3,20],['H3','Sigils and dither dissolves',4,5,5,5,4,23]].map(r=>({id:r[0],name:r[1],r:r.slice(2,7),sum:r[7]}));
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const GS=(typeof SCORE!=='undefined'&&Array.isArray(SCORE)&&SCORE.length===36)?SCORE:MS5;
  const HC=['#1a1628','#2e2550','#51419a','#8f7ae0','#e4dcff'],RL=['Simplicity','Speed','Pixel taste','Mood','Readability'],SC=['#e8c45a','#7fd0ff','#ff8f7a'];
  let sel=['E1','F2','G1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Mood','Readab.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=GS.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#0f0e15':'#e0ddee'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-40 0 ${S+80} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#4a4078':'#2a2344'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#2a2344'},svg);const [lx,ly]=pt(k,5.45);svgText(svg,lx,ly+(k===0?-2:k===2||k===3?12:4),RL[k],{'text-anchor':k===0?'middle':k<3?'start':'end',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=GS.find(x=>x.id===id);if(!s)return;svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=GS.find(x=>x.id===id);return s?`<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`:'';}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});
}
