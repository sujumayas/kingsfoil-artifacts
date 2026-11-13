"use strict";
// ======================================================================
// demos2 (Agent F): flames at 32 px (B1 to B6), the burn front and the
// burnt world (C1 to C5) and lava (F4). Figures: loops, tibiafield, dying,
// doom32, noisefire, stacked, burnmap, arrival, tileswap, tilestates, house,
// lava. Everything lives inside one block, so no name here can clash with
// core.js or the other demos files. From core.js it uses only $, $$, clamp,
// pack, U, PX, pointer, ctl, digits and reg.
// The art is a copy of sandbox.html: the palette and fire ramp, the grass
// tiles and the burnt-ground rule, the 128 px burn-order map, the flame-loop
// generator, the house and pine stamps and the 24x32 character.
// ======================================================================
{
// ---------- palette: the sandbox's base colours. Fire bends from purple through red to yellow ----------
const HX={OUTL:'#1a1420',G0:'#1c3a32',G1:'#28583b',G2:'#3b7840',G3:'#5c9845',G4:'#92bf59',D0:'#5a4a2d',D1:'#836c39',D2:'#b09049',D3:'#d8bd6b',FLW:'#ece0b4',FLR:'#d4647c',
  C0:'#150e14',C1:'#26191d',C2:'#3b2a26',C3:'#583e30',A0:'#45414c',A1:'#68646f',A2:'#8f8a95',A3:'#b8b3bb',S0:'#2a2b3a',S1:'#45485b',S2:'#666a7e',S3:'#8e93a5',S4:'#bec2ce',
  W0:'#35201a',W1:'#583725',W2:'#7e522f',W3:'#a6733f',W4:'#cb995b',R0:'#44202a',R1:'#6c2d30',R2:'#964237',R3:'#be613e',P0:'#0f2f2c',P1:'#1a493c',P2:'#29694a',P3:'#498a54',
  K1:'#c37d5b',K2:'#eab28b',U0:'#1e2a57',U1:'#2e4b8d',U2:'#4b75c5',Y0:'#89591d',Y1:'#c8912f',RD0:'#5d1923',RD1:'#952b2d',RD2:'#c7473b',
  SM0:'#2f2d36',SM1:'#4f4c58',SM2:'#777382',SM3:'#a29eaa',I0:'#1e1c25',I1:'#393743',I2:'#5b5967',WIN:'#6a7fa0',WIN_D:'#495a7b',
  F0:'#3f1a3f',F1:'#8d1f2c',F2:'#cf421f',F3:'#f1822a',F4:'#fcca4c',F5:'#fff3c4',WHITE:'#ffffff',GOLD:'#ffd27a',LV1:'#b8301f'};
const K={};for(const k in HX)K[k]=U(HX[k]);
const {OUTL,G0,G1,G2,G3,G4,D0,D1,D2,D3,FLW,FLR,C0,C1,C2,C3,A0,A1,A2,A3,S0,S1,S2,S3,S4,W0,W1,W2,W3,W4,R0,R1,R2,R3,P0,P1,P2,P3,K1,K2,U0,U1,U2,Y0,Y1,RD0,RD1,RD2,
  SM1,SM2,SM3,I0,I1,I2,WIN,WIN_D,F0,F1,F2,F3,F4,F5,WHITE,GOLD,LV1}=K;
// tone codes 1..5 are F1..F5, 6 is the purple edge F0
const FT=Uint32Array.from([0,F1,F2,F3,F4,F5,F0]);
const RAMPS=[[G0,G1,G2,G3,G4],[D0,D1,D2,D3],[C0,C1,C2,C3],[A0,A1,A2,A3],[S0,S1,S2,S3,S4],[W0,W1,W2,W3,W4],[R0,R1,R2,R3],[P0,P1,P2,P3],[I0,I1,I2],[WIN_D,WIN]];
const DARKM=new Map();for(const r of RAMPS)for(let k=1;k<r.length;k++)DARKM.set(r[k],r[k-1]);
const darkOf=c=>DARKM.get(c)||c;

// ---------- hashes, noise, colour helpers ----------
const h2=(x,y)=>{let h=Math.imul(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return((h^(h>>>16))>>>0)/4294967296;};
const hI=(x,y,t,s)=>{let h=Math.imul(x|0,0x27d4eb2d)^Math.imul(y|0,0x165667b1)^Math.imul(t|0,0x9e3779b1)^Math.imul(s|0,0x85ebca77);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return h>>>0;};
const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=h2(xi,yi),b=h2(xi+1,yi),c=h2(xi,yi+1),d=h2(xi+1,yi+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
const vnT=(x,y,p)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),m=v=>((v%p)+p)%p,a=h2(m(xi),m(yi)),b=h2(m(xi+1),m(yi)),c=h2(m(xi),m(yi+1)),d=h2(m(xi+1),m(yi+1));return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],bay4=(x,y)=>BAY[(y&3)*4+(x&3)];
const sat=v=>v<0?0:v>1?1:v;
const rgb=c=>[c&255,(c>>>8)&255,(c>>>16)&255];
const mul=(c,r,g,b)=>pack((c&255)*r,((c>>>8)&255)*g,((c>>>16)&255)*b);
// dusk: the ground is tinted once, flames keep their colours
const dk=c=>pack((c&255)*.6,((c>>>8)&255)*.55,((c>>>16)&255)*.72+5);
const night=c=>pack((c&255)*.42,((c>>>8)&255)*.4,((c>>>16)&255)*.58+6);
// warm light, the sandbox's palette version formula: k .2 for the outer step, .42 for the inner one
const warm=(c,k)=>{const r=c&255,g=(c>>>8)&255,b=(c>>>16)&255;return pack(r+(r*1.1+34-r)*k,g+(g*.92+14-g)*k,b+(b*.62+2-b)*k);};
const addc=(c,r,g,b)=>pack((c&255)+r,((c>>>8)&255)+g,((c>>>16)&255)+b);
const fms=v=>v<.001?v.toFixed(5):v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);
const now=()=>performance.now();
function meter(){let s=-1;return {add(d){s=s<0?d:s+(d-s)*.08;return s;},get v(){return Math.max(0,s);},reset(){s=-1;}};}
const pct=v=>(v*100).toFixed(v<.1?1:0)+'%';
const throttle=(fn,ms)=>{let t=-1e9;return ()=>{const n=now();if(n-t>=ms){t=n;fn();}};};

// ---------- ground: 6 grass tiles of 32x32 picked by a position hash, a burnt rule from the same art ----------
const TUFTS=[["l...l",".l.l.",".lml.",".xmx."],["l.l",".l.",".x."],[".l...l.","l.l.l.l",".lmlml.","..xmx.."],["l..",".ll",".mx"],["..l..","l.l.l",".lml.",".xmx."]];
const GT=[],GTK=[];
for(let v=0;v<6;v++){const t=new Uint32Array(1024),k=new Uint8Array(1024),sv=v+7;
  for(let gy=0;gy<3;gy++)for(let gx=0;gx<3;gx++){if(h2(sv*31+gx*7+1,gy*13+v*5+2)<.34)continue;
    const T=TUFTS[(h2(gx+sv*3,gy+9+v)*TUFTS.length)|0],tw=T[0].length,th=T.length;
    const x0=2+gx*10+((h2(gx*5+sv,gy*3+1)*(11-tw))|0),y0=2+gy*10+((h2(gx+11,gy*7+sv)*(11-th))|0);
    for(let r=0;r<th;r++)for(let c=0;c<tw;c++){const ch=T[r][c];if(ch==='.')continue;const px=x0+c,py=y0+r;if(px>31||py>31)continue;t[py*32+px]=ch==='l'?G4:ch==='m'?G3:G0;k[py*32+px]=1;}}
  for(let n=0;n<3;n++){const x=3+((h2(sv+n*9,77)*24)|0),y=3+((h2(sv*3+n,91)*24)|0);if(!t[y*32+x]&&!t[y*32+x+1]){t[y*32+x]=G1;t[y*32+x+1]=G1;if(n===0)t[(y+1)*32+x+1]=G1;}}
  if(v===2||v===5){const x=6+((h2(sv,5)*18)|0),y=6+((h2(sv,6)*18)|0),fc=v===2?FLW:FLR;if(!k[y*32+x]){for(const j of [y*32+x,y*32+x+1,(y+1)*32+x])t[j]=fc;t[(y+1)*32+x+1]=Y1;k[y*32+x]=k[y*32+x+1]=k[(y+1)*32+x]=k[(y+1)*32+x+1]=1;}}
  if(v===3){const x=5+((h2(sv,8)*18)|0),y=5+((h2(sv,9)*18)|0);if(!k[y*32+x]){t[y*32+x]=S3;t[y*32+x+1]=S4;t[y*32+x+2]=S3;t[(y+1)*32+x]=S1;t[(y+1)*32+x+1]=S2;t[(y+1)*32+x+2]=S1;}}
  GT.push(t);GTK.push(k);}
const DRYM=new Map([[G4,D3],[G3,D2],[G2,D2],[G1,D1],[G0,D0],[FLR,FLW]]);
// B normal art, CH charred (tufts to black stubble, the rest two browns in 2x2 clusters), AS ash (a grey ramp with char bits). (ox, oy) is the place in the world
function ground(W,H,ox=0,oy=0,dry){const N=W*H,B=new Uint32Array(N),CH=new Uint32Array(N),AS=new Uint32Array(N),TK=new Uint8Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=x+ox,Y=y+oy,i=y*W+x,n=vn(X/52,Y/44)*.6+vn(X/19,Y/16)*.4,d=dry?dry(X,Y):false;
    const v=(h2((X>>5)+3,(Y>>5)+7)*6)|0,ti=(Y&31)*32+(X&31),tv=GT[v][ti],tk=GTK[v][ti];let b=d?(n<.4?D1:n>.66?D3:D2):(n<.37?G1:n>.64?G3:G2);if(tv)b=d?(DRYM.get(tv)||tv):tv;
    B[i]=b;TK[i]=tk;const h=h2((X>>1)+13,(Y>>1)+71),n1=vn(X/9,Y/8);
    let c=tk?C0:(n1>.68?C3:(h<.45?C1:C2));if(!tk&&h>.965)c=A1;if(d&&!tk&&n1<.3)c=C3;CH[i]=c;
    const bx=X>>1,by=Y>>1,an=vn(bx/6+3,by/5)*.7+vn(bx/2.5+9,by/2.5)*.3,hb=h2(bx+7,by+113);let a=an<.36?A0:an<.62?A1:A2;if(hb<.009)a=C1;else if(hb<.016)a=C2;else if(hb>.993)a=A3;AS[i]=a;}
  return {W,H,B,CH,AS,TK};}
const segs=(C,root)=>$$('[data-seg]',root).forEach(s=>C.seg(s.dataset.seg,()=>{}));
const tint=(a,f)=>{const o=new Uint32Array(a.length);for(let i=0;i<a.length;i++)o[i]=f(a[i]);return o;};
// dotted tile grid every 32 px
function grid(u,W,H,ox=0,oy=0,col=GOLD){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=x+ox,Y=y+oy;if(((X&31)===0&&(Y&3)===0)||((Y&31)===0&&(X&3)===0))u[y*W+x]=mix(u[y*W+x],col,.55);}}
const mix=(a,b,t)=>pack((a&255)+((b&255)-(a&255))*t,((a>>>8)&255)+(((b>>>8)&255)-((a>>>8)&255))*t,((a>>>16)&255)+(((b>>>16)&255)-((a>>>16)&255))*t);
// darken an ellipse (a character's or a prop's shadow)
function shadow(u,W,H,cx,cy,hw,hh){for(let r=-hh;r<=hh;r++){const y=cy+r;if(y<0||y>=H)continue;const w=Math.round(hw*Math.sqrt(1-(r/(hh+.5))**2));for(let x=cx-w;x<cx+w;x++)if(x>=0&&x<W)u[y*W+x]=mul(u[y*W+x],.62,.6,.7);}}

// ---------- the burn-order map: 128 px, tileable, 64x64 blocks of 2x2 px. Patches start at seeds and grow, so char arrives in clusters ----------
const MB=new Uint8Array(4096);
{const n=96,sx=[],sy=[],st=[],gr=[];for(let k=0;k<n;k++){sx.push(h2(k,11)*64);sy.push(h2(k,23)*64);st.push(h2(k,37));gr.push(.7+h2(k,41)*.6);}
  const raw=new Float32Array(4096);
  for(let by=0;by<64;by++)for(let bx=0;bx<64;bx++){let best=1e9;for(let k=0;k<n;k++){let dx=Math.abs(bx+.5-sx[k]),dy=Math.abs(by+.5-sy[k]);if(dx>32)dx=64-dx;if(dy>32)dy=64-dy;const v=st[k]*6+Math.sqrt(dx*dx+dy*dy)*gr[k];if(v<best)best=v;}
    raw[by*64+bx]=best+vnT(bx/8,by/8,8)*3;}
  const ord=[...raw.keys()].sort((a,b)=>raw[a]-raw[b]);for(let r=0;r<4096;r++)MB[ord[r]]=(r*256/4096)|0;}
const mv=(x,y)=>MB[((y>>1)&63)*64+((x>>1)&63)];

// ---------- the burn front of section 7, per art pixel: T = (1 - a) clamp(dot(u, -e) / s + 0.5) + a N, d = b - T ----------
// directions the fire came from, in the 3-bit order of section 7: W, NW, N, NE, E, SE, S, SW
const DIRN=[[-1,0],[-.7071,-.7071],[0,-1],[.7071,-.7071],[1,0],[.7071,.7071],[0,1],[-.7071,.7071]],DNAME=['W','NW','N','NE','E','SE','S','SW'];
const DIRV=[[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]];
// el: (now - t_ignite) / t_sweep. Returns 0 unburnt, 1 glowing edge (its first px), 4 dark red (the rest of the edge), 2 scorch band, 3 charred
function front7(X,Y,dir,el,a,N,rimPx,scPx){const e=DIRN[dir],ux=((X&31)+.5)/32-.5,uy=((Y&31)+.5)/32-.5,s=(e[0]!==0&&e[1]!==0)?Math.SQRT2:1;
  const T=(1-a)*sat((ux*-e[0]+uy*-e[1])/s+.5)+a*N,w1=(1-a)/32,wr=rimPx*w1,ws=scPx*w1,b=sat(el)*(1+wr+ws),d=b-T;return d>=wr+ws?3:d>=wr?2:d>=w1?4:d>=0?1:0;}
// a spread run on a small tile grid: each tile rolls once per second from the second it caught, p per roll (x 0.7 diagonal).
// Returns ignition seconds T and the entry direction D (toward the tile that lit it)
function spreadSim(TW,TH,srcs,seed,p){const n=TW*TH,T=new Float32Array(n).fill(1e9),D=new Int8Array(n).fill(0),done=new Uint8Array(n);
  for(const s of srcs)T[s]=0;
  for(let it=0;it<n;it++){let c=-1,bt=1e9;for(let i=0;i<n;i++)if(!done[i]&&T[i]<bt){bt=T[i];c=i;}if(c<0)break;done[c]=1;const cx=c%TW,cy=(c/TW)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=TW||ny>=TH)continue;const ni=ny*TW+nx;if(done[ni])continue;
      const pp=dx&&dy?p*.7:p;let k=1;while(k<12&&h2(ni*31+c*7+seed*101,k*13+seed)>=pp)k++;const t=T[c]+k;
      if(t<T[ni]){T[ni]=t;D[ni]=DIRV.findIndex(v=>v[0]===-dx&&v[1]===-dy);}}}
  return {T,D};}

// ---------- flame loops built in code (the sandbox's generator): tongues with a held base, a distance field for the tones, detached 2x2 tongues ----------
const BANDS={2:[.6],3:[.4,.78],4:[.3,.58,.84],5:[.24,.46,.68,.88]};
function genFlame(w,h,n,nt,vs){const codes=nt===3?[3,4,5]:nt===4?[2,3,4,5]:nt===5?[1,2,3,4,5]:[6,1,2,3,4,5],frames=[];
  const ntg=w<9?1:w<18?2:3,tg=[];
  for(let k=0;k<ntg;k++){const c=ntg===1?0:ntg===2?(k?.2:-.16)*w:[0,-.27,.27][k]*w,Hh=ntg===1?1:ntg===2?(k?.72:1):[1,.68,.6][k],Wd=ntg===1?.95:ntg===2?(k?.6:.78):[.62,.5,.48][k];
    tg.push({c:c+(h2(k,vs+3)-.5)*w*.08,H:Hh*(.92+h2(k,vs)*.12),Wd,ph:h2(k,vs+7),ps:h2(k,vs+11)});}
  const swayA=w*(w<9?.12:.16),hA=h<12?.1:.16;
  for(let f=0;f<n;f++){const ph=f/n,m=new Uint8Array(w*h);
    for(const t of tg){const hk=t.H*h*(1-hA+hA*Math.sin(2*Math.PI*(ph+t.ph)));
      for(let y=0;y<h;y++){const yy=h-1-y,v=yy/hk;if(v>1)continue;const sx=Math.sin(2*Math.PI*(ph+t.ps)+v*2.2)*swayA*Math.pow(v,1.5),hw=t.Wd*w/2*Math.pow(1-v,.65)*Math.min(1,.62+2.2*v)+.35;
        for(let x=0;x<w;x++)if(Math.abs(x+.5-(w/2+t.c+sx))<hw)m[y*w+x]=1;}}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(x+.5-w/2)/(w*.46),dy=(y+.5-(h-h*.1))/(h*.13+.5);if(dx*dx+dy*dy<1)m[y*w+x]=1;}
    const d=new Uint8Array(w*h);for(let i=0;i<w*h;i++)d[i]=m[i]?99:0;
    for(let it=0;it<2;it++){for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!d[i])continue;const l=x>0?d[i-1]:0,u=y>0?d[i-w]:0;d[i]=Math.min(d[i],l+1,u+1);}
      for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(!d[i])continue;const r=x<w-1?d[i+1]:0,b=y<h-1?d[i+w]:99;d[i]=Math.min(d[i],r+1,b+1);}}
    const a=new Uint8Array(w*h),inner=codes.slice(1),bands=BANDS[inner.length]||[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!m[i])continue;const yy=h-1-y;
      if(d[i]<=1){a[i]=codes[0];continue;}
      const heat=Math.min(1,(d[i]-1)/(w*.2+.4))*(1-.62*yy/h)+(yy<h*.3?.14:0);let b=0;while(b<bands.length&&heat>=bands[b])b++;a[i]=inner[b];}
    if(h>=14){const life=Math.max(2,Math.min(4,n>>1)),u=f%life,tw=h>=24?3:2,tip=Math.round(h-1-tg[0].H*h*.86),wy=tip-3-u*3,wx=Math.round(w/2+tg[0].c+Math.sin(ph*6.28)*1.5)-1;
      for(let yy=0;yy<tw;yy++)for(let xx=0;xx<2;xx++){const X=wx+xx,Y=wy+yy;if(X>=0&&X<w&&Y>=0&&Y<h&&!m[Y*w+X])a[Y*w+X]=u===0?codes[1]:codes[0];}}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!a[i])continue;const nb=[x>0?a[i-1]:0,x<w-1?a[i+1]:0,y>0?a[i-w]:0,y<h-1?a[i+w]:0],cnt=nb.filter(v=>v).length;
      if(cnt===0){a[i]=0;continue;}if(cnt>=3&&!nb.includes(a[i])){const fq={};let best=a[i],bn=0;for(const v of nb)if(v){fq[v]=(fq[v]||0)+1;if(fq[v]>bn){bn=fq[v];best=v;}}a[i]=best;}}
    frames.push(a);}
  for(let f=1;f<n;f++)for(let y=h-3;y<h;y++)for(let x=0;x<w;x++)frames[f][y*w+x]=frames[0][y*w+x];
  return frames;}
const FCACHE=new Map();
function flameSet(w,h,n,nt,vs){const k=w+'x'+h+'x'+n+'x'+nt+'x'+vs;let f=FCACHE.get(k);if(!f){f=genFlame(w,h,n,nt,vs);FCACHE.set(k,f);}return f;}
const CANDLE_R=[[".3..",".33.","3443","3453","3453",".44.",".33.","...."],["..3.",".33.","3443","3453","3453",".44.",".33.","...."],["....",".3..","343.","3453","3453",".44.",".33.","...."],[".3..","..3.",".34.","3453","3453",".44.",".33.","...."]];
const CANDLE=CANDLE_R.map(r=>{const a=new Uint8Array(32);for(let y=0;y<8;y++)for(let x=0;x<4;x++){const ch=r[y][x];a[y*4+x]=ch==='.'?0:+ch;}a[5*4+1]=5;return a;});
// draw a flame frame with its top-left at (ax, ay); clip(X, Y) optional
function drawF(u,W,H,a,w,h,ax,ay,clip){for(let yy=0;yy<h;yy++){const Y=ay+yy;if(Y<0||Y>=H)continue;for(let xx=0;xx<w;xx++){const t=a[yy*w+xx];if(!t)continue;const X=ax+xx;if(X<0||X>=W)continue;if(clip&&!clip(X,Y))continue;u[Y*W+X]=FT[t];}}}
// Tibia's fire field stages (2118, 2119, 2120) from Canary's appearances.dat: box, frames, ms, light, Canary stage seconds
// Tibia's boxes are 49x47, 49x54 and 38x40; the sprites here are the sandbox's 46x46, 44x50 and 34x36
const FIELD=[{id:2118,w:46,h:46,bw:49,bh:47,n:5,ms:120,light:7,s:200,nt:6},{id:2119,w:44,h:50,bw:49,bh:54,n:5,ms:100,light:5,s:148,nt:6},{id:2120,w:34,h:36,bw:38,bh:40,n:5,ms:100,light:3,s:98,nt:5}];
const fieldSet=(s,v)=>flameSet(FIELD[s].w,FIELD[s].h,FIELD[s].n,FIELD[s].nt,v*29+s*7+3);

// ---------- small particle pool: embers (2x2) and smoke puffs drawn in 2x2 clusters ----------
function mkPool(n){const P={n,x:new Float32Array(n),y:new Float32Array(n),vx:new Float32Array(n),vy:new Float32Array(n),t:new Float32Array(n),life:new Float32Array(n),s0:new Float32Array(n),s1:new Float32Array(n),head:0,
  add(x,y,vx,vy,life,s0=0,s1=0){const j=P.head;P.x[j]=x;P.y[j]=y;P.vx[j]=vx;P.vy[j]=vy;P.t[j]=0;P.life[j]=life;P.s0[j]=s0;P.s1[j]=s1;P.head=(j+1)%n;},
  step(dt,ay=0,drag=1){let c=0;for(let j=0;j<n;j++){if(P.life[j]<=0)continue;P.t[j]+=dt;if(P.t[j]>=P.life[j]){P.life[j]=0;continue;}P.vy[j]+=ay*dt;P.vx[j]*=drag;P.x[j]+=P.vx[j]*dt;P.y[j]+=P.vy[j]*dt;c++;}return c;},
  clear(){P.life.fill(0);}};return P;}
function drawEmbers(u,W,H,P){for(let j=0;j<P.n;j++){if(P.life[j]<=0)continue;const f=P.t[j]/P.life[j],x=P.x[j]|0,y=P.y[j]|0,c=f<.35?F4:f<.7?F3:F2;
  for(let q=0;q<4;q++){const X=x+(q&1),Y=y+(q>>1);if(X>=0&&Y>=0&&X<W&&Y<H)u[Y*W+X]=c;}}}
// a puff: round lobes in 2x2 blocks, lit on the upper left, thinning by a block dither as it ages
function drawPuffs(u,W,H,P){for(let j=0;j<P.n;j++){if(P.life[j]<=0)continue;const f=P.t[j]/P.life[j],r=(P.s0[j]+(P.s1[j]-P.s0[j])*Math.sqrt(f))/2,cx=P.x[j],cy=P.y[j],keep=1-f*f;
  for(let by=Math.floor((cy-r)/2);by<=Math.ceil((cy+r)/2);by++)for(let bx=Math.floor((cx-r)/2);bx<=Math.ceil((cx+r)/2);bx++){const dx=bx*2+1-cx,dy=by*2+1-cy,d=Math.hypot(dx,dy*1.15)+(h2(bx+j*7,by)-.5)*2.2;if(d>r)continue;
    if((BAY[(by&3)*4+(bx&3)]+.5)/16>keep*1.05)continue;const c=dx+dy<-r*.5?SM3:dx+dy>r*.45?SM1:SM2;
    for(let q=0;q<4;q++){const X=bx*2+(q&1),Y=by*2+(q>>1);if(X>=0&&Y>=0&&X<W&&Y<H)u[Y*W+X]=c;}}}}

// ---------- stamps: normal colour c, ruin colour a, flags f (1 roof or crown, 2 seam that glows, 4 glass, 8 stone, 16 gone in the ruin, 32 stump) ----------
function mkStamp(w,h){return {w,h,c:new Uint32Array(w*h),a:new Uint32Array(w*h),f:new Uint8Array(w*h)};}
function sset(st,x,y,c,a,f){x|=0;y|=0;if(x<0||y<0||x>=st.w||y>=st.h)return;const i=y*st.w+x;st.c[i]=c;st.a[i]=a||0;st.f[i]=f||0;}
function soutline(st){const {w,h,c}=st,add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(c[i])continue;if((x>0&&c[i-1]&&c[i-1]!==OUTL)||(x<w-1&&c[i+1]&&c[i+1]!==OUTL)||(y>0&&c[i-w]&&c[i-w]!==OUTL)||(y<h-1&&c[i+w]&&c[i+w]!==OUTL))add.push(i);}for(const i of add){c[i]=OUTL;st.a[i]=0;st.f[i]=0;}}
function routline(st){const {w,h,c,a}=st,add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!c[i]||a[i])continue;const q=j=>a[j]&&a[j]!==OUTL;if((x>0&&q(i-1))||(x<w-1&&q(i+1))||(y>0&&q(i-w))||(y<h-1&&q(i+w)))add.push(i);}for(const i of add)a[i]=OUTL;}
const lumOf=c=>(.3*(c&255)+.59*((c>>>8)&255)+.11*((c>>>16)&255))/255;
function charOf(c,x,y,f){if(f&8)return darkOf(c);if(c===OUTL)return C0;if(f&4)return C0;const L=lumOf(c),h=h2((x>>1)+5,(y>>1)+9);return L<.16?C0:L<.3?C1:L<.5?(h<.55?C1:C2):(h<.6?C2:C3);}
// a stamp placed at (ox, oy): per pixel normal, charred and ruin colours, flags and a 0..255 height from the base for the burn order
function place(st,ox,oy,base){const o={st,ox,oy,base,top:9999,ch:new Uint32Array(st.w*st.h),vr:new Uint8Array(st.w*st.h)};
  for(let y=0;y<st.h;y++)for(let x=0;x<st.w;x++)if(st.c[y*st.w+x]&&oy+y<o.top)o.top=oy+y;
  const hg=Math.max(1,base-o.top+1),SEAM=new Set([W0,R0,D0,P0,G0,W1]);
  for(let y=0;y<st.h;y++)for(let x=0;x<st.w;x++){const i=y*st.w+x;if(!st.c[i])continue;if(SEAM.has(st.c[i])&&!(st.f[i]&8))st.f[i]|=2;o.ch[i]=charOf(st.c[i],ox+x,oy+y,st.f[i]);o.vr[i]=clamp((base-(oy+y))/hg*255,0,255)|0;}
  return o;}
const UP_F=["..........wwww..........",".........wwwwWW.........",".......hhhwwWWhhh.......","......hLLhhhhhhhhH......",".....hLLhhhhhhhhhHH.....","....hhLhhhhhhhhhhhHH....","....wwwwwwwwwwwwwwWW....","....wwwwwwwwwwwwwWWW....","....kssssssssssssssk....","....kssEEssssssEEssk....","....sssEEssssssEEsSs....","....sSssssssssssssSs....",".....ssssssSSsssssS.....","......yyyyyyyyyyyY......","....llyyyyyyyyyyyYCC....","...lccccyyyYYycccccCC...","...lccoccyyYYccccoCCC...","...lccocccyyYccccoCCC...","...cccocccccccccCoCCC...","...cccocccccccccCoCCC...","...gggoccccccccCCoGGG...","....gg.cccccccCCC.GG....",".......ccccccCCCC......."];
const UP_B=["..........wwww..........",".........wwwwWW.........",".......hhhwwWWhhh.......","......hLLhhhhhhhhH......",".....hLLhhhhhhhhhHH.....","....hhLhhhhhhhhhhhHH....","....hhhhhhhhhhhhhhHH....","....wwwwwwwwwwwwwwWW....","....wwwwwwwwwwwwwWWW....","....kkkkkkkkkkkkkkKK....","....kkkkkkkkkkkkkKKK....",".....kkkkkkkkkkkKKK.....","......ssssssssssSS......","......yyyyyyyyyyyY......","....llyyyyyyyyyyyYCC....","...lccccyyYccccccccCC...","...lccoccyyYcccccoCCC...","...lccoccyyYcccccoCCC...","...cccocccyYccccCoCCC...","...cccocccccccccCoCCC...","...gggoccccccccCCoGGG...","....gg.cccccccCCC.GG....",".......ccccccCCCC......."];
const UP_S=["........wwww............",".......wwwwWW...........","......hhwwWWhhhhh.......",".....hLLhhhhhhhhhH......","....hLLhhhhhhhhhhhHH....","....hhhhhhhhhhhhhhHH....","....wwwwwwwwwwwwwwWWW...","....wwwwwwwwwwwwwWWW....","....kkkkkssssssssss.....","....kkkksssssssEEss.....","....kkkkssssssSEEsss....",".....kkksssssssssss.....","......kkssssssssSS......","......yyyyyyyyyyyY......","...YYyyyyyyyyyyyYY......","..YY...lcccccccccC......","..Y....lccccccccCC......",".......lccccccccCC......",".......ccccccccCCC......",".......ccccccccCCC......",".......ccccccccCCC......","........ccccccCCC.......","........ccccccCCC......."];
const ARM_S=["ollC.","ollC.","ollC.","ollC.","ollC.","oggG.",".oo.."];
const LF_I=[".......pppp..pPPP.......",".......pppp..pPPP.......",".......pppp..pPPP.......","......bbbbb..bbbbB......","......bbbbb..bbbbB......","......bBBBB..bBBBB......"];
const LF_L=[".......pppp..pPPP.......",".......pppp..pPPP.......","......bbbbb..bbbbB......","......bbbbb..bBBBB......",".....bbbbbb.............",".....bbBBBB............."];
const LF_R=[".......pppp..pPPP.......",".......pppp..pPPP.......","......bbbbb..bbbbB......","......bBBBB..bbbbB......",".............bbbbbB.....",".............bbBBBB....."];
const LS_I=["........pppPPP..........","........pppPPP..........","........pppPPP..........","........bbbbBBB.........","........bbbbbBBB........","........bBBBBBBB........"];
const LS_N=[".......PPPppppp.........","......PPP...pppp........",".....PPP.....pppp.......","....BBB.......bbbb......","...BBBB.......bbbbb.....","...BBB........bBBBBB...."];
const LS_NP=["........pppPPP..........","........ppppPP..........",".......PPpppp...........","......BBBbbbb...........","......BB.bbbbb..........",".........bBBBBB........."];
const LS_F=[".......pppppPPP.........","......ppp...PPPP........",".....ppp.....PPPP.......","....bbb.......BBBB......","...bbbb.......BBBBB.....","...bBB........BBBBBB...."];
const LS_FP=["........PPPppp..........","........PPpppp..........",".......ppPPPP...........","......bbbBBBB...........","......bB.BBBBB..........",".........BBBBBB........."];
const UPS=[UP_F,UP_B,UP_S],LEGS=[[LF_R,LF_I,LF_L,LF_I,LF_I],[LF_L,LF_I,LF_R,LF_I,LF_I],[LS_F,LS_FP,LS_N,LS_NP,LS_I]];
const CMAP={h:RD1,L:RD2,H:RD0,w:W2,W:W1,k:W1,K:W0,s:K2,S:K1,E:OUTL,y:Y1,Y:Y0,c:U1,l:U2,C:U0,g:K2,G:K1,p:S1,P:S0,b:W1,B:W0,o:OUTL};
function outlineSprite(px,w,h){const add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(px[i])continue;if((x>0&&px[i-1])||(x<w-1&&px[i+1])||(y>0&&px[i-w])||(y<h-1&&px[i+w]))add.push(i);}for(const i of add)px[i]=OUTL;}
// frames[d][f]: d 0 facing south, 1 north, 2 east (flip for west); f 0..3 walk, 4 idle. hl, hr: hand positions
function mkFrames(map){const out=[];
  for(let d=0;d<3;d++){const up=UPS[d],fr=[];
    for(let f=0;f<5;f++){const px=new Uint32Array(768),hand=new Uint8Array(768),bob=(f===1||f===3)?1:0,y0=2-bob;
      const row=(str,y,xo)=>{for(let x=0;x<24;x++){const ch=str[x],X=x+(xo|0);if(ch!=='.'&&y>=0&&y<32&&X>=0&&X<24){px[y*24+X]=map[ch];hand[y*24+X]=(ch==='g'||ch==='G')?1:0;}}};
      const g=up.map(r=>r.split(''));g.push(new Array(24).fill('.'),new Array(24).fill('.'));let sway=0;
      if(d<2&&(f===0||f===2)){const plantRight=(f===0)===(d===0),fa=plantRight?3:17,ba=plantRight?17:3;sway=plantRight?1:-1;
        for(let r=21;r>=15;r--)for(let x=fa;x<fa+4;x++)g[r+2][x]=g[r][x];
        for(let r=15;r<=20;r++)for(let x=ba;x<ba+4;x++)g[r][x]=g[r+1][x];for(let x=ba;x<ba+4;x++)g[21][x]='.';}
      for(let r=0;r<25;r++)row(g[r].join(''),y0+r,sway);
      if(d===2){const sw=f===0?3:f===2?-3:0;for(let r=0;r<ARM_S.length;r++){const s=ARM_S[r],xo=Math.round(sw*r/6);for(let x=0;x<5;x++)if(s[x]!=='.'){const i=(y0+15+r)*24+10+xo+x;px[i]=map[s[x]];hand[i]=(s[x]==='g'||s[x]==='G')?1:0;}}}
      const L=LEGS[d][f];if(bob)row(L[0],24);for(let r=0;r<6;r++)row(L[r],25+r);
      let lx=0,ly=0,ln=0,rx=0,ry=0,rn=0;for(let i=0;i<768;i++)if(hand[i]){const x=i%24,y=(i/24)|0;if(x<12){lx+=x;ly+=y;ln++;}else{rx+=x;ry+=y;rn++;}}
      outlineSprite(px,24,32);fr.push({px,hl:ln?[lx/ln,ly/ln]:[5,22],hr:rn?[rx/rn,ry/rn]:[18,22]});}
    out.push(fr);}
  return out;}
let HERO=null;const hero=()=>HERO||(HERO=mkFrames(CMAP));
// draw a 24x32 frame with the feet at (fx, fy)
function drawCh(u,W,H,F,fx,fy,flip){const x0=Math.round(fx)-12,y0=Math.round(fy)-30;for(let y=0;y<32;y++){const Y=y0+y;if(Y<0||Y>=H)continue;for(let x=0;x<24;x++){const c=F.px[y*24+(flip?23-x:x)];if(!c)continue;const X=x0+x;if(X>=0&&X<W)u[Y*W+X]=c;}}}

// ---------- a wooden house, 3x3 tiles: a shingle roof 26 px above the footprint, a 40 px plank front (the sandbox's house) ----------
function buildHouse(fx0,fy0){const ox=fx0-6,oy=fy0-30,st=mkStamp(110,128),P=(x,y,c,a,f)=>sset(st,x-ox,y-oy,c,a,f);
  for(let y=fy0-26;y<=fy0+55;y++)for(let x=fx0-4;x<=fx0+99;x++){const ry=y-(fy0-26);let c,a=0;const rafter=((x-fx0+2)%16)<2||(ry>=12&&ry<=14)||ry>=78;
    if(ry<12)c=ry<1?R1:(((x+ry*3)%12)<2?R0:R1);else if(ry<15)c=ry===12?R3:ry===13?R2:R0;
    else{const q=ry-15,co=q%7,ci=(q/7)|0;c=co===6?R0:R2;if(co<6&&((x+(ci&1)*5)%10)===0)c=R1;if(co===0&&h2(x>>2,ci)<.5)c=R3;if(x>fx0+88&&c===R2)c=R1;if(x<fx0+3&&c===R2)c=R3;if(q>=65)c=R0;}
    if(rafter)a=ry>=12&&ry<=14?C0:(x-fx0+2)%16===0?C1:C0;P(x,y,c,a,1|16);}
  for(let y=fy0+56;y<=fy0+95;y++)for(let x=fx0+3;x<=fx0+92;x++){const wy=y-(fy0+56);let c,f=0,a=0;const b=wy%6;c=b===0?W3:b===5?W0:W2;if(b>=2&&b<=3&&h2(x>>2,y>>1)<.08)c=W1;if(x<fx0+7||x>fx0+88)c=x===fx0+3||x===fx0+89?W3:W1;
    if(wy<3)c=darkOf(c);if(wy>=37){c=(((x+(wy&1)*4)%9)===0)?S0:wy===37?S3:S2;f=8;}
    const corner=x<fx0+8||x>fx0+87,rh=corner?30:5+((h2((x>>2)+7,3)*12)|0);if(40-wy<=rh)a=(f&8)?darkOf(c):(40-wy===rh?A2:(c===W0||c===S0?C0:C1));P(x,y,c,a,f);}
  for(let y=fy0+64;y<=fy0+94;y++)for(let x=fx0+38;x<=fx0+57;x++){const dx=x-fx0-38,dy=y-fy0-64;let c=(dx<2||dx>17||dy<2)?W1:(dx%5===1?W0:W2);if((dy===7||dy===22)&&dx>=2&&dx<=6)c=I1;if(dx===15&&dy===16)c=Y1;P(x,y,c,dy>20&&(dx<2||dx>17)?C0:0,0);}
  for(const wx of [fx0+12,fx0+68])for(let y=fy0+65;y<=fy0+81;y++)for(let x=wx-1;x<=wx+16;x++){const dx=x-wx,dy=y-fy0-65;let c,f=0;
    if(dy===16||dy===15)c=W3;else if(dx<0||dx>15)continue;else if(dx===0||dx===15||dy===0||dy===14||dx===7||dx===8||dy===7)c=W1;else{c=(dx+dy>14)?WIN_D:WIN;f=4;}
    const ca=st.a[(y-oy)*st.w+(x-ox)];P(x,y,c,ca,f);}
  soutline(st);routline(st);return place(st,ox,oy,fy0+95);}
// a pine of four toothed tiers; the ruin is a black spike with stub branches, then a stump (flag 32)
function buildPine(bx,by,hw,h,sd){const hc=h-8,cx=hw+4,st=mkStamp(2*hw+9,h+6),nT=4,yb=[],ya=[],hws=[];
  for(let k=0;k<nT;k++){yb[k]=Math.round(hc-k*hc*.215)+2;hws[k]=hw*(1-k*.2);ya[k]=k===nT-1?2:Math.round(yb[k]-hc*.44);}
  const tooth=(x,k)=>[0,1,2,3,2,1][(((x+k*3+sd)%6)+6)%6];
  const inTier=(k,x,y)=>{if(y<ya[k])return false;const u=Math.abs(x-cx+.5),f=(y-ya[k])/(yb[k]-ya[k]);if(f>1.25)return false;const w=hws[k]*Math.pow(Math.min(1,f),.8)+.6;if(u>w)return false;return y<=yb[k]-tooth(x,k)+Math.round(u/hws[k]*2.2);};
  for(let y=hc;y<=hc+10;y++)for(let x=cx-3;x<=cx+2;x++)sset(st,x,y,x<cx-1?W3:x<cx+1?W2:W1,x<cx?C1:C0,y>=hc+3?32:0);
  sset(st,cx-4,hc+10,W2,C1,32);sset(st,cx+3,hc+10,W1,C0,32);
  const own=new Int8Array(st.w*st.h).fill(-1);
  for(let k=0;k<nT;k++){
    if(k>0)for(let y=0;y<st.h;y++)for(let x=0;x<st.w;x++)if(own[y*st.w+x]>=0&&inTier(k,x,y-3)&&!inTier(k,x,y))st.c[y*st.w+x]=P0;
    for(let y=ya[k];y<=yb[k]+4;y++)for(let x=0;x<st.w;x++){if(!inTier(k,x,y))continue;const u=(x-cx+.5)/hws[k],fringe=!inTier(k,x,y+2),fr1=!inTier(k,x,y+1);
      let c=u<-.3?(h2((x>>1)+sd,(y>>1)+k*7)<.42?P3:P2):u<.28?(h2((x>>1)+sd,(y>>1)+k*5)<.16?P1:P2):P1;if(fringe)c=u<0?P1:P0;if(fr1&&u>-.5)c=P0;
      sset(st,x,y,c,0,1);own[y*st.w+x]=k;}}
  for(let y=Math.round(hc*.22);y<hc;y++){const w=Math.max(0,Math.round((y-hc*.22)/(hc*.78)*2));for(let x=cx-1-w;x<=cx+w;x++){const i=y*st.w+x;if(st.c[i])st.a[i]=x<cx?C1:C0;}}
  for(let k=0;k<nT-1;k++){const yy=yb[k]-3,len=Math.round(hws[k]*.6);for(let q=1;q<=len;q++)for(const s of [-1,1]){const x=cx+(s<0?-1:0)+s*q,y=yy-(q>>1),i=y*st.w+x;if(x>=0&&x<st.w&&st.c[i])st.a[i]=C0;}}
  soutline(st);routline(st);const o=place(st,bx-cx,by-(hc+10),by);
  o.spots=[[bx,by-4,0],[bx-6,Math.round(by-hc*.25),.04],[bx+5,Math.round(by-hc*.45),.12],[bx-2,Math.round(by-hc*.7),.22]];return o;}
// draw an object with colour picked per pixel by col(i, X, Y); col returns 0 for nothing
function drawObj(u,W,H,o,col){const {st,ox,oy}=o;for(let y=0;y<st.h;y++){const Y=oy+y;if(Y<0||Y>=H)continue;for(let x=0;x<st.w;x++){const i=y*st.w+x;if(!st.c[i])continue;const X=ox+x;if(X<0||X>=W)continue;const c=col(i,X,Y);if(c)u[Y*W+X]=c;}}}
// a stone ring and crossed logs, campfire ground art, centre (cx, cy), ring radius rx, ry
function campBase(B,W,H,cx,cy,rx,ry,ns){const put=(x,y,c)=>{if(x>=0&&y>=0&&x<W&&y<H)B[y*W+x]=c;};
  for(let dy=-Math.round(ry*.65);dy<=Math.round(ry*.65);dy++)for(let dx=-Math.round(rx*.75);dx<=Math.round(rx*.75);dx++){const d=(dx/(rx*.72))**2+(dy/(ry*.64))**2;if(d<1)put(cx+dx,cy+dy,h2((cx+dx)>>1,(cy+dy)>>1)<.5?C1:A0);}
  const log=(x0,y0,x1,y1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let k=0;k<=n;k++){const x=Math.round(x0+(x1-x0)*k/n),y=Math.round(y0+(y1-y0)*k/n);
    for(let t=-2;t<=2;t++)put(x,y+t,t===-2||t===2?OUTL:t===-1?W3:t===0?W2:W1);if(k===0||k===n)for(let t=-1;t<=1;t++)put(x,y+t,t?W1:W4);}};
  const L=Math.round(rx*.62);log(cx-L,cy+2,cx+L,cy-2);log(cx-L+1,cy-2,cx+L-1,cy+2);
  for(let k=0;k<ns;k++){const a=k/ns*6.283+.3,sx=Math.round(cx+Math.cos(a)*rx),sy=Math.round(cy+1+Math.sin(a)*ry);
    for(let dy=-2;dy<=2;dy++)for(let dx=-3;dx<=3;dx++){const d=(dx/3)**2+(dy/2.2)**2;if(d>1.15)continue;put(sx+dx,sy+dy,d>.7?OUTL:dy<0?S3:dy===0?S2:S1);}}}
// light pools: per pixel the strongest of the sources (x, y, radius px, 0..1), in three steps with a 2x2 block dither band. Returns a lit copy of B
function litGround(B,W,H,src,amb){const o=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let I=0;for(const s of src){const d=Math.hypot(x-s[0],(y-s[1])*1.25),v=s[3]*sat(1-d/s[2]);if(v>I)I=v;}
    const j=(BAY[((y>>1)&3)*4+((x>>1)&3)]/15-.5)*.12,L=I+j,c=B[y*W+x];o[y*W+x]=L>.6?warm(c,.42):L>.3?warm(c,.2):L>.08?c:amb(c);}
  return o;}

// ======================================================================
// B1. loops: the flame ladder at 32 px
// ======================================================================
reg('loops',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=96,GY=86;segs(C,root);
  const G=ground(W,H,40,8),bg=tint(G.B,dk);
  campBase(bg,W,H,96,GY-5,14,7,9);campBase(bg,W,H,137,GY-6,18,8,11);
  const pr=new Uint32Array(W*H),pp=(x,y,c)=>{if(x>=0&&y>=0&&x<W&&y<H)pr[y*W+x]=c;};
  for(let y=GY-7;y<=GY-2;y++)for(let x=6;x<=9;x++)pp(x,y,x===6?FLW:x===9?D2:D3);
  for(let x=4;x<=11;x++){pp(x,GY-1,S3);pp(x,GY,S2);}
  for(let y=GY-24;y<=GY;y++)for(let x=21;x<=23;x++)pp(x,y,x===21?W3:x===22?W2:W1);
  for(let x=17;x<=27;x++)pp(x,GY-29,x>=19&&x<=25?(h2(x,3)<.5?F1:C1):I2);
  for(let y=GY-28;y<=GY-25;y++){const k=(y-GY+28)>>1;for(let x=18+k;x<=26-k;x++)pp(x,y,x<22?I2:I1);}
  for(let y=0;y<7;y++){const hw=Math.round(10-y*y/5);for(let x=66-hw;x<66+hw;x++)pp(x,GY-13+y,y===0?(x>58&&x<73?(h2(x,7)<.5?F1:C1):I2):y<3?I1:I0);}
  for(const lx of [59,66,72])for(let y=GY-6;y<=GY;y++)pp(lx,y,I1);
  for(let i=0;i<W*H;i++){if(pr[i])continue;const x=i%W;if((x>0&&pr[i-1]&&pr[i-1]!==OUTL)||(x<W-1&&pr[i+1]&&pr[i+1]!==OUTL)||(i>=W&&pr[i-W]&&pr[i-W]!==OUTL)||(i<W*H-W&&pr[i+W]&&pr[i+W]!==OUTL))pr[i]=OUTL;}
  shadow(bg,W,H,66,GY+1,10,2);shadow(bg,W,H,22,GY+1,5,1);shadow(bg,W,H,40,GY-1,7,2);
  for(let i=0;i<W*H;i++)if(pr[i])bg[i]=pr[i];
  const HF=hero()[0][4],hl=HF.hl,TX=40-12+Math.round(hl[0]-2),TY=GY-30+Math.round(hl[1]);
  // name, w, h, frames, ms, tones, centre x, bottom row y
  const L=[['Candle',4,8,4,100,3,8,GY-8],['Torch on a post',10,16,6,100,5,22,GY-30],['Carried torch',6,8,4,100,4,TX,TY-7],['Brazier',16,20,6,110,5,66,GY-13],['Campfire',24,28,8,110,6,96,GY-3],['Bonfire',32,48,8,130,6,137,GY-4]];
  const TN=['3 tones and a white core','5 tones','4 tones','5 tones','5 tones and a purple edge','6 tones'];
  const thin=(w,h,k)=>{const f=genFlame(w,h,4,3,k*13+w).map(a=>a.slice());
    f.forEach((a,fi)=>{for(let j=0;j<2;j++){const c=1+(hI(fi,j,k,3)%Math.max(1,w-2));let t0=-1;for(let y=0;y<h;y++)if(a[y*w+c]){t0=y;break;}const y=t0-2-((fi+j)&1);if(t0>=0&&y>=0)a[y*w+c]=3;}});return f;};
  const SET=L.map((l,k)=>k===0?CANDLE:flameSet(l[1],l[2],l[3],l[5],k*17+l[1])),THIN=L.map((l,k)=>k===0?CANDLE:thin(l[1],l[2],k));
  const acc=L.map((l,k)=>(hI(k,l[1],0,9)%1000)),M=meter();let play=true;
  const bp=C.btn('play',b=>{play=!play;b.textContent=play?'Pause':'Play';});
  C.btn('step',()=>{play=false;bp.textContent='Play';L.forEach((l,k)=>{const ms=l[4],n=C.v('thin')?4:l[3];acc[k]=(Math.floor(acc[k]/ms)+1)*ms;});});
  const out=throttle(()=>{const th=C.v('thin');ro.innerHTML=L.map((l,k)=>`<b>${l[0]}</b> ${l[1]}x${l[2]} px, ${th&&k?4:l[3]} x ${l[4]} ms, ${th&&k?'3 tones and 1 px licks':TN[k]}`).join('<br>')+
    `<br>Copying a cached frame here: ${(M.v/6*1000).toFixed(2)} µs per flame, measured in this browser. Report: 0.22 µs per flame, 150 flames 0.034 / 0.213 ms (desktop / 6x throttle, measured).`;},250);
  return {tick(dt){const th=C.v('thin');if(play)for(let k=0;k<L.length;k++)acc[k]+=dt*1000;u.set(bg);
    const t0=now();
    for(let k=0;k<L.length;k++){const l=L[k],fr=th?THIN[k]:SET[k],n=fr.length,fi=Math.floor(acc[k]/l[4])%n,w=l[1],h=l[2];
      if(k===2){drawCh(u,W,H,HF,40,GY,false);for(let q=0;q<8;q++)for(let s=0;s<2;s++){const X=TX+s-1,Y=TY-q;if(X>=0&&Y>=0)u[Y*W+X]=q>=6?(s?C1:W0):(s?W1:W3);}}
      drawF(u,W,H,fr[fi],w,h,l[6]-(w>>1),l[7]-h+1);}
    M.add(now()-t0);
    if(C.v('grid'))grid(u,W,H,0,0);P.put();out();}};});

// ======================================================================
// B2. tibiafield: a 3x3 fire bomb with overflowing field sprites and 16 position variants
// ======================================================================
reg('tibiafield',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=128;segs(C,root);
  const G=ground(W,H,200,40),bg=tint(G.B,dk),F=hero(),M=meter();
  const tiles=[];for(let ty=1;ty<=3;ty++)for(let tx=1;tx<=3;tx++)tiles.push([tx,ty]);
  const walker={x:12,v:44,anim:0};let T=0;
  const out=throttle(()=>{const s=+C.segv('st')-1,f=FIELD[s],one=C.v('one');
    ro.innerHTML=`<b>Stage ${s+1}</b>, item ${f.id}: Tibia's box ${f.bw}x${f.bh} px in a 64x64 canvas, drawn here with the Sandbox's ${f.w}x${f.h} px sprite, ${f.n} x ${f.ms} ms, light ${f.light}, ${f.s} s in Canary. `+
      `Variants on screen: ${one?'1 (all tiles share variant 0 and one clock)':'9 of 16, picked by x % 4 and y % 4'}. 80 sprites per stage. `+
      `Draws this frame: 9 flames and 1 character, y-sorted, ${fms(M.v)} ms here.`;},250);
  return {tick(dt){T+=dt;const s=+C.segv('st')-1,f=FIELD[s],one=C.v('one'),clip=C.v('clip');
    walker.x+=walker.v*dt;if(walker.x>150){walker.x=150;walker.v=-44;}if(walker.x<10){walker.x=10;walker.v=44;}walker.anim+=dt*10;
    u.set(bg);const t0=now(),ents=[];
    for(const [tx,ty] of tiles){const v=one?0:(tx%4)+(ty%4)*4,ph=one?0:hI(tx,ty,0,5)%997,bx=tx*32+32,by=ty*32+32;
      ents.push([by,()=>{const fr=fieldSet(s,v),fi=Math.floor((T*1000+ph)/f.ms)%f.n;
        drawF(u,W,H,fr[fi],f.w,f.h,bx-f.w,by-f.h,clip?(X,Y)=>X>=bx-32&&X<bx&&Y>=by-32&&Y<by:null);}]);}
    const wy=84;ents.push([wy,()=>{shadow(u,W,H,Math.round(walker.x),wy-2,7,2);drawCh(u,W,H,F[2][Math.floor(walker.anim)%4],walker.x,wy,walker.v<0);}]);
    ents.sort((a,b)=>a[0]-b[0]);for(const e of ents)e[1]();M.add(now()-t0);
    if(C.v('grid'))grid(u,W,H,0,0);
    if(C.v('num'))for(const [tx,ty] of tiles){const v=one?0:(tx%4)+(ty%4)*4,x=tx*32+2,y=ty*32+2;for(let yy=-1;yy<6;yy++)for(let xx=-1;xx<8;xx++)u[(y+yy)*W+x+xx]=OUTL;digits(u,W,H,x,y,String(v),GOLD);}
    P.put();out();}};});

// ======================================================================
// B3. dying: a campfire and a fire field through their stages
// ======================================================================
reg('dying',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=96;segs(C,root);
  const G=ground(W,H,620,90),base=tint(G.B,dk);campBase(base,W,H,44,74,13,6,9);
  // Tibia campfire items 1998, 1999, 2000: frames, ms, light. Sprite sizes are illustrative
  const CF=[{id:1998,n:5,ms:100,light:7,w:24,h:28,nt:6},{id:1999,n:4,ms:100,light:5,w:18,h:20,nt:5},{id:2000,n:6,ms:300,light:3,w:12,h:12,nt:4}];
  const CFS=CF.map((c,k)=>flameSet(c.w,c.h,c.n,c.nt,40+k));
  let T=0,lastKey='',lit=base;
  const stageOf=()=>{const v=C.segv('st');return v==='auto'?Math.floor(T/3)%3:+v-1;};
  const out=throttle(()=>{const s=stageOf(),only=C.v('only'),c=CF[s],f=FIELD[s],ms=only?CF[0].ms:c.ms,lt=only?7:c.light,fms_=only?FIELD[0].ms:f.ms;
    ro.innerHTML=`<b>Stage ${s+1}.</b> Campfire item ${c.id}: ${c.n} x ${ms} ms, light ${lt}. Fire field item ${f.id}: Tibia's box ${f.bw}x${f.bh} px (Sandbox sprite ${f.w}x${f.h}), ${f.n} x ${fms_} ms, light ${only?7:f.light}, ${f.s} s in Canary.`+
      (only?' <b>Size only</b>: the sprite shrinks while frame time and light stay at stage 1.':'');},250);
  return {tick(dt){T+=dt;const s=stageOf(),only=C.v('only'),c=CF[s],f=FIELD[s],lc=only?7:c.light,lf=only?7:f.light,key=lc+'|'+lf;
    if(key!==lastKey){lastKey=key;lit=litGround(base,W,H,[[44,72,lc*7,1],[112,80,lf*7,1]],night);}
    u.set(lit);const ms=only?CF[0].ms:c.ms,fr=CFS[s],fi=Math.floor((T*1000)/ms)%fr.length;drawF(u,W,H,fr[fi],c.w,c.h,44-(c.w>>1),76-c.h);
    const ff=fieldSet(s,11),fm=only?FIELD[0].ms:f.ms,fj=Math.floor((T*1000+333)/fm)%f.n;drawF(u,W,H,ff[fj],f.w,f.h,128-f.w,96-f.h);
    if(C.v('grid'))grid(u,W,H,0,0);P.put();out();}};});

// ======================================================================
// B4. doom32: the DOOM fire at 32 px, in place or double-buffered, with the height rule and smoothing before quantizing
// ======================================================================
reg('doom32',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=128,BY=118,CX=104;segs(C,root);
  const G=ground(W,H,500,300),bg=tint(G.B,c=>night(c));campBase(bg,W,H,CX,BY+2,20,5,11);
  shadow(bg,W,H,36,121,7,2);drawCh(bg,W,H,hero()[0][4],36,123,false);
  // Sanglard's 37-entry DOOM palette
  const D37=[0x070707,0x1f0707,0x2f0f07,0x470f07,0x571707,0x671f07,0x771f07,0x8f2707,0x9f2f07,0xaf3f07,0xbf4707,0xc74707,0xdf4f07,0xdf5707,0xdf5707,0xd75f07,0xd75f07,0xd7670f,0xcf6f0f,0xcf770f,0xcf7f0f,0xcf8717,0xc78717,0xc78f17,0xc7971f,0xbf9f1f,0xbf9f1f,0xbfa727,0xbfa727,0xbfaf2f,0xb7af2f,0xb7b72f,0xb7b737,0xcfcf6f,0xdfdf9f,0xefefc7,0xffffff].map(v=>pack(v>>16,(v>>8)&255,v&255));
  const T5=[0,F1,F2,F3,F4,F5],R6=[0,1,1,2,2,3],M=meter();
  let sh=-1,k=1,BW=0,BH=0,F=null,FB2=null,TN=null,ema=null,steps=0,acc=0,rs=0x2545f491,TONE=null,lone=0,lit=0,warm_=0;
  const rng=()=>{rs^=rs<<13;rs^=rs>>>17;rs^=rs<<5;return rs>>>0;};
  const par=()=>({r:+C.segv('k'),loop:C.segv('loop'),L:C.v('L'),p:C.v('p'),tn:C.segv('tn'),sm:C.segv('sm')});
  function setup(){const q=par();const nsh=q.r===2?1:0;if(nsh!==sh){sh=nsh;k=1<<sh;BW=(32>>sh)+5;BH=Math.ceil(BY/k)+1;F=new Uint8Array(BW*BH);FB2=new Uint8Array(BW*BH);TN=new Uint8Array(BW*BH);warm_=60;}
    ema=new Float32Array(BH);steps=0;const L=q.L,nc=L<=10?2:3,B=L-nc;TONE=new Uint8Array(L+2);
    for(let v=1;v<=L+1;v++)TONE[v]=v>B?5:v<=Math.max(1,Math.round(B*.28))?1:v<=Math.round(B*.55)?2:v<=Math.round(B*.8)?3:4;}
  function step(q){const w=BW,h=BH,f=F,L=q.L,m=(w-1)/2;for(let x=0;x<w;x++){const e=Math.abs(x-m)/(m-2);f[(h-1)*w+x]=e<.55?L:Math.max(0,Math.round(L*(1-(e-.55)/.45*.75)));}
    const rd=q.loop==='db'?(FB2.set(f),FB2):f,exact=Math.abs(q.p-.5)<1e-6;
    for(let x=2;x<w-1;x++)for(let y=1;y<h;y++){const s=y*w+x,v=rd[s];if(v===0){f[s-w]=0;continue;}
      const r=R6[rng()%6],d=s-r+1,dec=exact?(r&1):(rng()/4294967296<q.p?1:0),nv=v-dec;f[d-w]=nv<0?0:nv;}}
  function shade(q){const w=BW,h=BH,f=F,L=q.L;TN.fill(0);
    for(let y=1;y<h-1;y++)for(let x=3;x<w-2;x++){const j=y*w+x;let lv;
      if(q.sm==='box'){const s=f[j-w-1]+f[j-w]+f[j-w+1]+f[j-1]+f[j]+f[j+1]+f[j+w-1]+f[j+w]+f[j+w+1];lv=(s*57)>>9;}
      else if(q.sm==='lode'&&y<h-2)lv=((f[j+w-1]+f[j+w]+f[j+w+1]+f[j+2*w])*32/129)|0;else lv=f[j];
      if(lv<=0)continue;lv=Math.min(L,lv);TN[j]=q.tn==='37'?1+Math.round(lv*35/L):TONE[lv];}
    lone=0;lit=0;for(let y=1;y<h-1;y++)for(let x=3;x<w-2;x++){const j=y*w+x,t=TN[j];if(!t)continue;lit++;if(TN[j-1]!==t&&TN[j+1]!==t&&TN[j-w]!==t&&TN[j+w]!==t)lone++;}}
  function measure(){const w=BW,h=BH,x0=Math.round(w*.3),x1=Math.round(w*.7);for(let y=0;y<h;y++){let c=0;for(let x=x0;x<x1;x++)if(F[y*w+x]>0)c++;const fr=c/(x1-x0),i=h-1-y;ema[i]=steps<1?fr:ema[i]+(fr-ema[i])*.03;}steps++;}
  const h50=()=>{for(let i=1;i<BH;i++)if(ema[i]<.5)return i;return BH;};
  setup();['k','loop','tn','sm'].forEach(s=>C.seg(s,setup));C.on('L',setup);C.on('p',setup);
  const out=throttle(()=>{const q=par(),rows=h50(),clean=q.L/q.p;
    ro.innerHTML=`Buffer ${BW} x ${BH} cells at ${q.r===2?'1:2':'1:1'}, ${(BW*BH).toLocaleString('en-US')} cells. Step plus draw <b>${fms(M.v)} ms</b> here (smoothed, measured). `+
      `Report, a 32x48 campfire, ${q.r===2?'0.0026 / 0.016':'0.0086 / 0.057'} ms (desktop / 6x throttle, measured).<br>`+
      `Height, the row where half the middle columns are lit: <b>${steps<45?'settling':rows+' rows, '+rows*k+' px'}</b>. Rule for a clean loop (L - c + 1) / p = ${clean.toFixed(0)} rows, ${(clean*k).toFixed(0)} px.`+
      (Math.abs(q.p-.5)<1e-6?` In-place rule 2.6 L = ${(2.6*q.L).toFixed(0)} rows, ${(2.6*q.L*k).toFixed(0)} px.`:' The report gives the in-place rule for p 0.5 only.')+
      `<br>Lone ${q.r===2?'2x2 clusters':'pixels'}: <b>${lit?pct(lone/lit):'0%'}</b> of lit cells differ in tone from all four neighbours. Report, raw 5 tones 25.3% at L 8 and 8.6% at L 36, 0.3% after a 3x3 average.`;},250);
  return {tick(dt){const q=par();C.out('L',q.L);C.out('p',q.p.toFixed(2));acc+=dt;let n=0;while(warm_>0){step(q);warm_--;}
    while(acc>=1/30&&n<3){acc-=1/30;n++;const t0=now();step(q);shade(q);M.add(now()-t0);measure();}
    if(acc>.2)acc=0;
    u.set(bg);const w=BW,h=BH;
    for(let y=1;y<h-1;y++)for(let x=3;x<w-2;x++){const t=TN[y*w+x];if(!t)continue;const col=q.tn==='37'?D37[t]:T5[t],ax=CX-16+(x-3)*k,ay=BY-(h-1-y)*k;
      for(let yy=0;yy<k;yy++)for(let xx=0;xx<k;xx++){const X=ax+xx,Y=ay+yy;if(X>=0&&Y>=0&&X<W&&Y<H)u[Y*W+X]=col;}}
    P.put();out();}};});

// ======================================================================
// B5. noisefire: a noise flame quantized to 5 tones and snapped to whole pixels (CPU emulation of the shader)
// ======================================================================
reg('noisefire',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=96;segs(C,root);
  const G=ground(W,H,800,100),bg=tint(G.B,night);
  // a plank house whose roof burns: walls 24..135 x 70..95, roof 18..141 x 44..69
  const st=mkStamp(W,H);for(let y=70;y<=94;y++)for(let x=26;x<=133;x++){const b=(y-70)%6;sset(st,x,y,b===0?W3:b===5?W0:W2);}
  for(let y=78;y<=94;y++)for(let x=70;x<=85;x++)sset(st,x,y,(x===70||x===85||y===78)?W1:W0);
  for(let y=44;y<=69;y++){const q=y-44,i0=18+Math.round((25-q)*.25),i1=141-Math.round((25-q)*.25);for(let x=i0;x<=i1;x++){const co=q%6;sset(st,x,y,co===5?R0:q<2?R3:(co===0&&h2(x>>2,q)<.5)?R3:R2);}}
  soutline(st);for(let i=0;i<W*H;i++)if(st.c[i])bg[i]=night(st.c[i]);
  const lobes=[[30,22,10],[50,34,12],[72,28,11],[94,38,12],[116,26,11],[134,16,8]];
  const MP=new Float32Array(W*H),MR=new Float32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let top=44;for(const l of lobes){const t=1-((x-l[0])/l[2])**2;if(t>0)top=Math.min(top,44-l[1]*Math.sqrt(t));}
    const inRoof=y>=44&&y<=66&&x>=22+Math.round((y-44)*.1)&&x<=137;let m=0;if(y<44&&x>=20&&x<=140&&y>=top)m=sat((y-top)/((44-top)*.9+4));if(inRoof)m=.95-(y-44)/22*.45;MP[y*W+x]=m;
    MR[y*W+x]=x>=24&&x<=136&&y>=8&&y<=66?sat((y-8)/40):0;}
  const RMP=[0,F1,F2,F3,F4,F5],M=meter();let T=0,lastKey='',px=0;const buf=new Uint32Array(W*H);
  const fbm=(x,y,oct)=>{let v=0,a=.5,s=0;for(let o=0;o<oct;o++){v+=a*vn(x,y);s+=a;x=x*2+17.3;y=y*2+5.1;a*=.5;}return v/s;};
  function compute(t){const oct=C.v('oct'),sn=+C.segv('snap'),painted=C.v('mask'),MM=painted?MP:MR;buf.fill(0);px=0;
    for(let y=0;y<70;y+=sn)for(let x=16;x<144;x+=sn){const cx=x+(sn>>1),cy=y+(sn>>1),m=MM[cy*W+cx];if(m<=0)continue;px+=sn*sn;
      const n=.6*fbm(cx/32,cy/32+t*1.5,oct)+.4*fbm(cx/21+3.1,cy/21+t*.9+7,oct),n2=sat((n-.5)*2.6+.5),heat=m-(1-n2)*.62+.08,q=Math.min(5,Math.floor(heat*5));if(q<1)continue;
      const c=RMP[q];for(let yy=0;yy<sn;yy++)for(let xx=0;xx<sn;xx++)buf[(y+yy)*W+x+xx]=c;}}
  const out=throttle(()=>{ro.innerHTML=`CPU emulation in this browser: <b>${fms(M.v)} ms</b> for ${px.toLocaleString('en-US')} mask px at ${C.v('oct')} octaves, recomputed only when the stepped time changes. `+
    `Report, WebGL2 on the GPU: the full 640x360 screen at 5 octaves 0.022 ms (Metal timer) and 0.510 ms (SwiftShader wall time), 3 octaves 0.014 and 0.399 ms, a 128x96 house front 0.0039 and 0.033 ms (measured). Snapping to 2 px saves nothing on a GPU, because the shader still runs per pixel.`;},300);
  return {tick(dt){T+=dt;C.out('oct',C.v('oct'));const fps=C.segv('fps'),t=fps==='free'?T:Math.floor(T*(+fps))/(+fps),key=[t,C.v('oct'),C.segv('snap'),C.v('mask')].join('|');
    if(key!==lastKey){lastKey=key;const t0=now();compute(t);M.add(now()-t0);}
    u.set(bg);for(let i=0;i<W*H;i++)if(buf[i])u[i]=buf[i];P.put();out();}};});

// ======================================================================
// B6. stacked: Stardew's campfire from three seeded copies of one loop, and the jitter and particle alternatives
// ======================================================================
reg('stacked',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=96;segs(C,root);
  const G=ground(W,H,330,610),bg=tint(G.B,night),SITES=[[32,74],[80,74],[128,74]];for(const [x,y] of SITES)campBase(bg,W,H,x,y,13,5,9);
  const BASE=flameSet(12,11,4,5,77),PAL=new Set([...bg,...FT]);const SP=mkPool(256);let T=0,emit=0,draws=0,cols=0,off=0;const M=meter();
  // Stardew's offsets (12, -8), (20, 0), (12, 12) screen px at 4x zoom, halved to art px on a 32 px tile; seeds from Torch.cs
  const OFF=[[6,-4,(x,y)=>x*3047+y*88],[10,0,(x,y)=>x*2047+y*98],[6,6,(x,y)=>x*2077+y*98]];
  const add=(c,a)=>pack((c&255)+(a&255)*50/255,((c>>>8)&255)+((a>>>8)&255)*50/255,((c>>>16)&255)+((a>>>16)&255)*50/255);
  const out=throttle(()=>{const m=C.segv('m');
    ro.innerHTML=`Flame draws this frame: <b>${draws}</b>${m==='spd'?' particle squares':''}. Colours on the canvas: ${cols}, of which <b>${off}</b> are off the palette. Copy and draw: ${fms(M.v)} ms here.<br>`+
      `Report: a stacked copy is one flame draw, 0.22 µs. A 20-tile SPD front is about 400 squares at about 7 ns each (measured).`;},300);
  return {tick(dt){T+=dt;const m=C.segv('m'),ms=T*1000;u.set(bg);const t0=now();draws=0;
    if(m==='spd'){emit+=dt;while(emit>=.03){emit-=.03;for(const [x,y] of SITES)SP.add(x-12+Math.random()*20,y-6,0,0,.6,8,0);}SP.step(dt,-160);
      for(let j=0;j<SP.n;j++){if(SP.life[j]<=0)continue;draws++;const f=SP.t[j]/SP.life[j],s=Math.max(1,Math.round(8*(1-f))),x0=Math.round(SP.x[j]-s/2),y0=Math.round(SP.y[j]-s/2);
        for(let yy=0;yy<s;yy++)for(let xx=0;xx<s;xx++){const X=x0+xx,Y=y0+yy;if(X>=0&&Y>=0&&X<W&&Y<H){const c=u[Y*W+X];u[Y*W+X]=pack((c&255)+238*.55,((c>>>8)&255)+119*.55,((c>>>16)&255)+34*.55);}}}}
    else for(const [cx,cy] of SITES){const tx=cx>>5,ty=cy>>5,bx=cx-14,by=cy-16;
      if(m==='one'){const fi=Math.floor(ms/100)%4;drawF(u,W,H,BASE[fi],12,11,cx-6,cy-12);draws++;continue;}
      if(m==='jit'){const fi=Math.floor((ms+OFF[1][2](tx,ty))/100)%4,a=BASE[fi];drawF(u,W,H,a,12,11,cx-6,cy-12);draws++;const rs=Math.floor(T*12);
        for(let r=0;r<7;r++){const ox=(hI(rs,r,tx,1)%7)-3,oy=-(hI(rs,r,ty,2)%4);draws++;for(let yy=0;yy<11;yy++)for(let xx=0;xx<12;xx++){const t=a[yy*12+xx];if(!t)continue;const X=cx-6+xx+ox,Y=cy-12+yy+oy;if(X>=0&&Y>=0&&X<W&&Y<H)u[Y*W+X]=add(u[Y*W+X],FT[t]);}}continue;}
      for(const [dx,dy,sd] of OFF){const ph=m==='sync'?0:sd(tx,ty),fi=Math.floor((ms+ph)/100)%4;drawF(u,W,H,BASE[fi],12,11,bx+dx,by+dy);draws++;}}
    M.add(now()-t0);
    if((T*4|0)!==(((T-dt)*4)|0)){const s=new Set();for(let i=0;i<W*H;i++)s.add(u[i]);cols=s.size;off=0;for(const c of s)if(!PAL.has(c))off++;}
    P.put();out();}};});

// ======================================================================
// C1. burnmap: two 32 px tiles burning through the per-pixel burn-order map
// ======================================================================
reg('burnmap',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=96,H=64,OX=96,OY=128;segs(C,root);
  const G=ground(W,H,OX,OY),bg=G.B,CH=G.CH,M=meter();let dir=0,T=0,cls=new Uint8Array(W*H),wr=0,ws=0;
  C.seg('dir',v=>{dir=+v;T=0;});C.el('b').addEventListener('input',()=>{C.el('auto').checked=false;});
  const out=throttle(()=>{const a=C.v('a'),r=C.v('rim'),s=C.v('sc');
    ro.innerHTML=`Fire came from the <b>${DNAME[dir]}</b>. w_rim = ${r} x (1 - a) / 32 = ${(r*(1-a)/32).toFixed(4)}, w_sc = ${s} x (1 - a) / 32 = ${(s*(1-a)/32).toFixed(4)}. `+
      `Measured on the top tile, mean per ${dir===2||dir===6?'column':'row'}: edge <b>${wr} px</b>, scorch band <b>${ws} px</b>. Set a to 0 to see the bare ramp.<br>`+
      `This pass: ${fms(M.v)} ms for 2,048 px here. Report: 1.8 ns per burning pixel, 0.082 / 0.515 ms with a fifth of the screen burning (desktop / 6x throttle, measured).`;},250);
  return {tick(dt){if(C.v('auto')){T+=dt;if(T>2.6)T=0;C.el('b').value=Math.min(1,T/1.6).toFixed(2);C.out('b',(+C.el('b').value).toFixed(2));}else C.out('b',(+C.v('b')).toFixed(2));
    C.out('a',(+C.v('a')).toFixed(2));C.out('rim',C.v('rim')+' px');C.out('sc',C.v('sc')+' px');
    const a=C.v('a'),rim=C.v('rim'),sc=C.v('sc'),b=C.v('b'),bay=C.segv('map')==='bay',showT=C.v('showT'),fr=(T*8)|0;u.set(bg);const t0=now();
    for(let y=0;y<64;y++)for(let x=32;x<64;x++){const X=x+OX,Y=y+OY,i=y*W+x,N=bay?(bay4(X,Y)+.5)/16:mv(X,Y)/255;
      if(showT){const e=DIRN[dir],ux=((X&31)+.5)/32-.5,uy=((Y&31)+.5)/32-.5,s=(e[0]&&e[1])?Math.SQRT2:1,t=(1-a)*sat((ux*-e[0]+uy*-e[1])/s+.5)+a*N,g=t*200+30;u[i]=pack(g,g,g);continue;}
      const c=front7(X,Y,dir,b,a,N,rim,sc);cls[i]=c;if(c===1)u[i]=((hI(X>>1,Y>>1,1,2)+fr)&3)?F4:F3;else if(c===4)u[i]=F1;else if(c===2)u[i]=C0;else if(c===3)u[i]=CH[i];}
    M.add(now()-t0);
    wr=0;ws=0;if(!showT){let r1=0,r2=0;for(let y=0;y<32;y++)for(let x=32;x<64;x++){const c=cls[y*W+x];if(c===1||c===4)r1++;else if(c===2)r2++;}wr=(r1/32).toFixed(1);ws=(r2/32).toFixed(1);}
    if(C.v('grid'))grid(u,W,H,OX,OY);P.put();out();}};});

// ======================================================================
// C2. arrival: per-tile progress against the continuous arrival-time front (the study's own construction)
// ======================================================================
reg('arrival',root=>{const cv=$$('canvas',root),PA=PX(cv[0]),PB=PX(cv[1]),C=ctl(root),ro=$('[data-ro]',root),W=128,H=96,TW=4,TH=3,OX=256,OY=64;segs(C,root);
  const G=ground(W,H,OX,OY),bg=G.B,CH=G.CH;let seed=3,S=spreadSim(TW,TH,[4],seed,.5),tmax=0,T=-.3,clA=new Uint8Array(W*H),clB=new Uint8Array(W*H),seamA=0,seamB=0;
  const reset=()=>{S=spreadSim(TW,TH,[4,0],seed,.5);tmax=Math.max(...S.T);T=-.3;};reset();
  C.btn('new',()=>{seed++;reset();});
  const WX=new Float32Array(W*H),WY=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const bx=(x+OX)>>1,by=(y+OY)>>1;WX[y*W+x]=((x>>1)*2+1)+(vn(bx/9+31,by/9)-.5)*16;WY[y*W+x]=((y>>1)*2+1)+(vn(bx/9,by/9+57)-.5)*16;}
  const NV=(X,Y)=>mv(X,Y)/255,HZ=6,J=.9,RIM=.04,RIM2=.08,SC=.35;
  const heat=v=>{const t=sat(v);return pack(30+t*225,20+t*190*t,90-t*60);};
  function seams(cl){let n=0;for(let y=0;y<H;y++)for(let x=31;x<W-1;x+=32){const a=cl[y*W+x],b=cl[y*W+x+1];if((a>=2&&b===0)||(b>=2&&a===0))n++;}
    for(let y=31;y<H-1;y+=32)for(let x=0;x<W;x++){const a=cl[y*W+x],b=cl[(y+1)*W+x];if((a>=2&&b===0)||(b>=2&&a===0))n++;}return n;}
  const out=throttle(()=>{ro.innerHTML=`Time ${Math.max(0,T).toFixed(1)} s. Tiles caught at whole seconds, ${[...S.T].map(v=>v|0).join(', ')} s. `+
    `Pixel pairs where char meets unburnt grass across a tile border: per-tile progress <b>${seamA}</b>, arrival-time front <b>${seamB}</b>.`;},250);
  return {tick(dt){T+=dt;if(T>tmax+2.5)T=-.3;const tex=C.v('tex');const ua=PA.u32,ub=PB.u32;ua.set(bg);ub.set(bg);
    const TA=new Float32Array(TW*TH);for(let i=0;i<TW*TH;i++)TA[i]=T>=S.T[i]?S.T[i]:T+HZ;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=x+OX,Y=y+OY,i=y*W+x,tx=x>>5,ty=y>>5,ti=ty*TW+tx,N=NV(X,Y);
      const ca=T>=S.T[ti]?front7(X,Y,S.D[ti],(T-S.T[ti])/1,.4,N,2,2.5):0;clA[i]=ca;
      const fx=clamp(WX[i]/32-.5,0,TW-1),fy=clamp(WY[i]/32-.5,0,TH-1),x0=Math.min(TW-2,Math.floor(fx)),y0=Math.min(TH-2,Math.floor(fy)),ax=fx-x0,ay=fy-y0;
      const ta=(TA[y0*TW+x0]*(1-ax)+TA[y0*TW+x0+1]*ax)*(1-ay)+(TA[(y0+1)*TW+x0]*(1-ax)+TA[(y0+1)*TW+x0+1]*ax)*ay,s=T-ta-N*J,cb=s<0?0:s<RIM?1:s<RIM2?4:s<RIM2+SC?2:3;clB[i]=cb;
      if(tex){ua[i]=heat(Math.min(TA[ti],tmax+1)/(tmax+1));ub[i]=heat(Math.min(ta,tmax+1)/(tmax+1));if(ca===1)ua[i]=WHITE;if(cb===1)ub[i]=WHITE;continue;}
      const fr=(T*8)|0,col=c=>c===1?(((hI(X>>1,Y>>1,1,2)+fr)&3)?F4:F3):c===4?F1:c===2?C0:CH[i];if(ca)ua[i]=col(ca);if(cb)ub[i]=col(cb);}
    seamA=seams(clA);seamB=seams(clB);
    if(C.v('grid')){grid(ua,W,H,OX,OY);grid(ub,W,H,OX,OY);}PA.put();PB.put();out();}};});

// ======================================================================
// C3. tileswap: whole-tile swap against a dual-grid scorch autotile on the same burn
// ======================================================================
reg('tileswap',root=>{const cv=$$('canvas',root),PA=PX(cv[0]),PB=PX(cv[1]),C=ctl(root),ro=$('[data-ro]',root),W=128,H=96,TW=4,TH=3,OX=640,OY=192;segs(C,root);
  const G=ground(W,H,OX,OY),bg=G.B,CH=G.CH,FS=flameSet(8,10,4,4,5);let seed=11,S=null,tmax=0,T=-.3,nb=0,nburn=0;
  const reset=()=>{S=spreadSim(TW,TH,[4],seed,.3);tmax=Math.max(...S.T);T=-.3;};reset();C.btn('new',()=>{seed++;reset();});
  const bit=(tx,ty)=>{tx=clamp(tx,0,TW-1);ty=clamp(ty,0,TH-1);return T>=S.T[ty*TW+tx]?1:0;};
  const out=throttle(()=>{ro.innerHTML=`Burnt tiles <b>${nb}</b> of 12, ${nburn} with flames. Whole-tile swap: 2 pictures per ground (normal, burnt) and an edge that moves 32 px at a time. `+
    `Dual grid: one burnt bit per tile gives 16 shapes (15 plus the empty one), drawn on a grid offset by half a tile, so the edge moves in 16 px steps.<br>`+
    `Report: copying a 32x32 tile by progress costs 0.011 / 0.066 ms with 10% of the screen burning and 0.116 / 0.720 ms at 100% (desktop / 6x throttle, measured), and nothing in a cached tile layer between state changes.`;},300);
  return {tick(dt){T+=dt;if(T>tmax+4)T=-.3;const ua=PA.u32,ub=PB.u32;ua.set(bg);ub.set(bg);nb=0;nburn=0;
    for(let i=0;i<TW*TH;i++)if(T>=S.T[i]){nb++;if(T<S.T[i]+3)nburn++;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=x+OX,Y=y+OY,i=y*W+x;if(bit(x>>5,y>>5))ua[i]=CH[i];
      const gx=(x-16)/32,gy=(y-16)/32,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,b00=bit(ix,iy),b10=bit(ix+1,iy),b01=bit(ix,iy+1),b11=bit(ix+1,iy+1);
      if(!(b00|b10|b01|b11))continue;const f=(b00*(1-fx)+b10*fx)*(1-fy)+(b01*(1-fx)+b11*fx)*fy,th=.5+(mv(X,Y)/255-.5)*.3;
      if(f>=th)ub[i]=CH[i];else if(f>=th-.09)ub[i]=C0;}
    for(let i=0;i<TW*TH;i++){if(!(T>=S.T[i]&&T<S.T[i]+3))continue;const tx=i%TW,ty=(i/TW)|0;
      for(let q=0;q<2;q++){const fx=tx*32+6+(hI(i,q,1,seed)%20),fy=ty*32+12+(hI(i,q,2,seed)%18),fi=Math.floor((T*1000+hI(i,q,3,0)%400)/100)%4;
        drawF(ua,W,H,FS[fi],8,10,fx-4,fy-9);drawF(ub,W,H,FS[fi],8,10,fx-4,fy-9);}}
    if(C.v('grid')){grid(ua,W,H,OX,OY);grid(ub,W,H,OX,OY);}PA.put();PB.put();out();}};});

// ======================================================================
// C4. tilestates: one tile's life as a strip with a time slider
// ======================================================================
reg('tilestates',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),W=96,H=64,OX=1024,OY=320,TX=32,TY=16;segs(C,root);
  const G=ground(W,H,OX,OY),bg=G.B,CH=G.CH,AS=G.AS,FS=flameSet(8,10,4,4,9),FB=flameSet(12,16,6,5,4),SM=mkPool(48);
  // state, seconds shown, duration text (green grass / tree), stored by the server, what is drawn
  const SEG=[['Fresh',2,'until lit',1,'the normal tileset'],['Catching (IGNITING)',1,'1 roll, 1 s',1,'the front enters from the entry side, one 8 to 10 px flame and a grey wisp'],
    ['Burning',3.75,'5 s / 24 s as built (5 and 24 rolls), 3 s / 12 s in the report\'s table',1,'2 or 3 flames at hashed offsets, the burn map sweeps the tile in about 1 s'],['Dying',1.25,'the last 25% of the burn',0,'one flame left, smoke doubled'],
    ['Embers',7,'4 to 10 s',1,'the charred tile with 2 to 4 glowing clusters of at least 2x2 px'],['Ash',90,'60 to 120 s',1,'a whole-tile swap, 2 variants by hash, a thin wisp for 3 to 5 s'],
    ['Regrowing, bare dirt',180,'2 to 4 min',1,'bare dirt'],['Regrowing, sprouts',90,'1 to 2 min, only beside green',1,'sprouts in 2x2 clusters'],['Regrowing, short grass',90,'1 to 2 min',1,'short grass'],['Regrown',2,'5 to 10 min after the ash began',1,'full grass']];
  const NUM=[0,1,2,3,4,5,6,6,6,6];let play=true,T=0;const sl=C.el('t');
  const W0s=400/SEG.length;for(let k=0;k<SEG.length;k++){const x=k*W0s;svgEl('rect',{x:x+1,y:8,width:W0s-2,height:22,rx:2,fill:SEG[k][3]?'#3b2a26':'#1d1820',stroke:SEG[k][3]?'#ffd27a':'#8f8a95','stroke-dasharray':SEG[k][3]?'':'3 2'},svg);svgText(svg,x+W0s/2,23,String(NUM[k]),{'text-anchor':'middle','font-size':11,fill:'#e8edf5'});}
  const cur=svgEl('rect',{x:0,y:4,width:2,height:30,fill:'#fcca4c'},svg);svgText(svg,2,46,'Gold border, stored by the server. Dashed, derived on the client.',{'font-size':10.5,fill:'#c6cfdd'});
  const bp=C.btn('play',b=>{play=!play;b.textContent=play?'Pause':'Play';});sl.addEventListener('input',()=>{play=false;bp.textContent='Play';});
  const out=throttle(()=>{const v=+sl.value/100,k=Math.min(SEG.length-1,Math.floor(v)),f=v-k,s=SEG[k];let el=0;for(let j=1;j<k;j++)el+=SEG[j][1];el+=k>0?f*s[1]:0;
    ro.innerHTML=`<b>${NUM[k]} ${s[0]}</b>. ${k?'Time since the tile caught: '+(el<120?el.toFixed(1)+' s':(el/60).toFixed(1)+' min')+'. ':''}Duration (green grass / tree): ${s[2]}. Server: ${s[3]?'yes':'no, derived from the time since ignition and the hashed burn length'}. Drawn: ${s[4]}.`;},200);
  return {tick(dt){T+=dt;if(play){let v=+sl.value/100+dt*.35;if(v>=SEG.length)v=0;sl.value=Math.round(v*100);}
    const v=+sl.value/100,k=Math.min(SEG.length-1,Math.floor(v)),f=v-k,fr=(T*8)|0;cur.setAttribute('x',(v/SEG.length*400).toFixed(1));
    u.set(bg);const inT=(x,y)=>x>=TX&&x<TX+32&&y>=TY&&y<TY+32;
    let b=0,flames=0,wisp=0;if(k===1){b=.25*f;flames=1;wisp=1;}else if(k===2){b=Math.min(1.2,.25+f*1.2);flames=3;wisp=1;}else if(k===3){b=1.2;flames=1;wisp=2;}else if(k>=4)b=1.2;
    for(let y=TY;y<TY+32;y++)for(let x=TX;x<TX+32;x++){const X=x+OX,Y=y+OY,i=y*W+x;
      if(k>=1&&k<=4){const c=front7(X,Y,0,b,.4,mv(X,Y)/255,2,2.5);if(c===1)u[i]=((hI(X>>1,Y>>1,1,2)+fr)&3)?F4:F3;else if(c===4)u[i]=F1;else if(c===2)u[i]=C0;else if(c===3)u[i]=CH[i];}
      else if(k===5)u[i]=h2(5,9)<.5?AS[i]:(G.TK[i]?C1:AS[i]);
      else if(k>=6&&k<=8){const d=h2(X>>1,Y>>1);let c=d<.4?D0:d<.8?W1:D1;if(k>=7&&((X>>1)+(Y>>1)*3)%5===0&&h2((X>>1)+3,Y>>1)<.5)c=k===7?G3:G2;if(k===8&&d<.55)c=d<.2?G2:G1;u[i]=c;}}
    if(k===4){const pul=.5+.5*Math.sin(T*3);for(let q=0;q<3;q++){const ex=TX+4+(hI(q,1,5,0)%22),ey=TY+4+(hI(q,2,5,0)%22);if(f>.85-q*.1)continue;for(let j=0;j<6;j++){const px=ex+(j%3),py=ey+((j/3)|0);if(q&1&&j===2)continue;u[py*W+px]=pul>.55&&j===1?F3:j===4||pul>.3?F2:F1;}}}
    if(wisp&&Math.random()<dt*3*wisp)SM.add(TX+8+Math.random()*16,TY+18,(Math.random()-.5)*3,-10,1.6,4,9);if(k===5&&f<.05&&Math.random()<dt*2)SM.add(TX+16,TY+20,0,-8,1.4,3,6);
    SM.step(dt);drawPuffs(u,W,H,SM);
    for(let q=0;q<flames;q++){const fx=TX+8+(hI(q,7,1,0)%16),fy=TY+12+(hI(q,7,2,0)%16),big=k===2&&q===0,fl=big?FB:FS,w=big?12:8,h=big?16:10,fi=Math.floor((T*1000+q*130)/100)%fl.length;
      if(k===1&&q===0){drawF(u,W,H,fl[fi],w,h,TX+6-(w>>1),TY+18-h);continue;}drawF(u,W,H,fl[fi],w,h,fx-(w>>1),fy-h+1);}
    if(C.v('grid'))grid(u,W,H,OX,OY);P.put();out();}};});

// ======================================================================
// C5. house: a 3x3 house and a pine burning in stages
// ======================================================================
reg('house',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=160,OX=-4,OY=0,FX=4,FY=32;segs(C,root);
  const G=ground(W,H,OX+1200,OY+60),bg=tint(G.B,dk),CHG=tint(G.CH,dk),ASG=tint(G.AS,dk);
  const HO=buildHouse(FX,FY),TR=buildPine(116,157,20,74,3);
  const FH=[flameSet(28,32,8,6,1),flameSet(28,32,8,6,2)],FS=flameSet(12,16,6,5,3),FT_=[flameSet(22,28,8,6,4),flameSet(22,28,8,6,5)],FC=flameSet(8,10,4,4,6);
  const EM=mkPool(160),SMK=mkPool(64);let T=0,msg='',burst=0;
  // fire cells: 9 house tiles, 1 tree trunk, as built: wood 30 rolls, p 0.30 per roll; the trunk 24 rolls. Embers 10 s
  const HC=[];for(let ty=0;ty<3;ty++)for(let tx=0;tx<3;tx++)HC.push({tx,ty,st:0,t:0,rl:30});const TC={st:0,t:0,rl:24};
  let collapsed=false;
  const reset=()=>{for(const c of HC){c.st=0;c.t=0;}TC.st=0;TC.t=0;collapsed=false;EM.clear();SMK.clear();T=0;msg='';};
  // auto-play: after 2 s idle light one edge tile and the trunk, play to ash, reset and repeat. A click hands control to the reader for 12 s
  let idle=0,user=-99,auto=false,done=0,cyc=0;const EDGE=[0,1,2,3,5,6,7,8];
  C.btn('reset',()=>{reset();user=now()/1000;auto=false;});
  const frac=c=>c.st===0?0:c.st===1?sat((T-c.t)/c.rl):1;
  pointer(cv,(p,kind)=>{if(kind!=='down')return;if(auto){reset();auto=false;}user=now()/1000;const x=p[0],y=p[1],tx=Math.floor((x-FX)/32),ty=Math.floor((y-FY)/32);
    const ti=Math.round(y-TR.oy)*TR.st.w+Math.round(x-TR.ox),onTree=x>=TR.ox&&x<TR.ox+TR.st.w&&y>=TR.oy&&y<TR.oy+TR.st.h&&TR.st.c[ti];
    if(onTree||(x>=100&&x<132&&y>=128)){if(TC.st===0){TC.st=1;TC.t=T;msg='The trunk cell caught.';}return;}
    if(tx>=0&&tx<3&&ty>=0&&ty<3){if(tx===1&&ty===1){msg='The inner tile takes no outside fire. Light an edge tile.';return;}const c=HC[ty*3+tx];if(c.st===0){c.st=1;c.t=T;msg='Edge tile '+(ty*3+tx+1)+' caught.';}return;}
    msg='Click an edge tile of the house or the tree.';});
  let rollAcc=0;
  function roll(){for(const c of HC)if(c.st===1&&T>c.t+.5){for(const n of HC){if(n.st!==0||Math.max(Math.abs(n.tx-c.tx),Math.abs(n.ty-c.ty))!==1)continue;const p=(n.tx!==c.tx&&n.ty!==c.ty)?.3*.7:.3;if(Math.random()<p){n.st=1;n.t=T;}}}
    for(const c of HC){if(c.st===1&&T-c.t>=c.rl){c.st=2;c.t=T;}else if(c.st===2&&T-c.t>=10){c.st=3;}}
    if(TC.st===1&&T-TC.t>=TC.rl){TC.st=2;TC.t=T;}else if(TC.st===2&&T-TC.t>=10){TC.st=3;TC.t=T;}}
  const AR=150;
  const houseCol=(fr,ne,all)=>(i,X,Y)=>{const st=HO.st,f=st.f[i],c=st.c[i];if(fr<=0&&!ne)return c;
    if(all){if(f&1)return (f&16)?0:st.a[i];return st.a[i]?st.a[i]:0;}
    if(!collapsed&&fr<.25)return c;if((f&1)&&collapsed)return st.a[i];
    const pp=(fr-.15)/.6,t=(AR*HO.vr[i]+(256-AR)*mv(X,Y))>>8,bb=pp*255-t;if(bb<0)return c;if(bb<10)return ((hI(X>>1,Y>>1,0,1)+((T*8)|0))&3)?F3:F4;
    if((f&2)&&h2(X>>1,Y>>1)<.27&&((hI(X>>1,Y>>1,0,2)+((T*6)|0))%5)<2)return F2;return HO.ch[i];};
  const treeCol=p=>(i,X,Y)=>{const st=TR.st,f=st.f[i],c=st.c[i];if(TC.st===0)return c;
    if(TC.st===3){if(T-TC.t>6&&!(f&32))return 0;return (f&16)?0:st.a[i];}if(TC.st===2||((f&1)&&p>.62))return st.a[i]||0;
    const t=(AR*TR.vr[i]+(256-AR)*mv(X,Y))>>8,bb=p*1.6*255-t;if(bb<0)return c;if(bb<10)return ((hI(X>>1,Y>>1,0,1)+((T*8)|0))&3)?F3:F4;return TR.ch[i];};
  const out=throttle(()=>{let nb=0,ne=0,na=0,fr=0;for(const c of HC){if(c.st===1)nb++;else if(c.st===2)ne++;else if(c.st===3)na++;fr+=frac(c);}fr/=9;
    const stage=nb+ne+na===0?'standing':nb===0?'charred wall stumps (100%)':fr>=.6?'roof collapsed to charred rafters (60%)':fr>=.25?'flames through the roof (25%)':'smoke under the eaves';
    ro.innerHTML=`House burnt <b>${pct(fr)}</b>, stage: <b>${stage}</b>. Tiles burning ${nb}, in embers ${ne}, ash ${na}. Tree: ${['standing','burning '+pct(frac(TC))+', flames climbing the crown','charred, bare branches','a stump after the ash'][TC.st]}.`+(msg?'<br>'+msg:'');},250);
  return {tick(dt){const sp=+C.segv('sp');T+=dt*sp;rollAcc+=dt*sp;while(rollAcc>=1){rollAcc-=1;roll();}
    const rt=now()/1000,quiet=rt-user>12,fresh=HC.every(c=>c.st===0)&&TC.st===0,over=HC.every(c=>c.st===0||c.st===3)&&TC.st!==1&&TC.st!==2&&!fresh;
    if(quiet){if(fresh){idle+=dt;if(idle>=2){idle=0;auto=true;cyc++;const c=HC[EDGE[(cyc*3)%8]];c.st=1;c.t=T;TC.st=1;TC.t=T+1;msg='Auto-play: an edge tile and the trunk caught. Click to take over.';}}else if(over){done+=dt;if(done>=3+(TC.st===3?0:0)){done=0;reset();}}else{idle=0;done=0;}}
    let fr=0,nb=0,ne=0;for(const c of HC){fr+=frac(c);if(c.st===1)nb++;if(c.st===2)ne++;}fr/=9;const all=nb===0&&HC.some(c=>c.st>0)&&HC.every(c=>c.st!==1);
    if(fr>=.6&&!collapsed){collapsed=true;for(let k=0;k<40;k++)EM.add(FX+Math.random()*96,FY+Math.random()*40,(Math.random()-.5)*30,-30-Math.random()*40,.4+Math.random()*.6);for(let k=0;k<6;k++)SMK.add(FX+12+Math.random()*72,FY+10,(Math.random()-.5)*6,-24,2.2,10,36);}
    u.set(bg);if(collapsed||all)for(let y=FY;y<FY+96;y++)for(let x=FX;x<FX+96;x++)if(x>=0&&x<W)u[y*W+x]=all&&ne===0?ASG[y*W+x]:CHG[y*W+x];
    drawObj(u,W,H,HO,houseCol(fr,ne,all));
    const fl=(arr,x,by,k,w,h,ms)=>{const fi=Math.floor((T*1000+k*173)/ms)%arr.length;drawF(u,W,H,arr[fi],w,h,x-(w>>1),by-h+1);};
    if(nb>0){if(fr<.25){for(const c of HC)if(c.st===1){const x=FX+c.tx*32+16,y=c.ty<2?FY+58:FY+94;fl(FS,x,y,c.tx+c.ty*3,12,16,100);}}
      else{const spots=[[FX+18,FY+8],[FX+48,FY-4],[FX+80,FY+10],[FX+30,FY+36],[FX+66,FY+38],[FX+50,FY+22]],n=Math.round(4+2*nb/9);for(let k=0;k<n;k++)fl(FH[k&1],spots[k][0],spots[k][1]+(collapsed?18:0),k,28,32,130);}
      if(Math.random()<dt*sp*2)SMK.add(FX+10+Math.random()*76,fr>=.25?FY-6:FY+56,(Math.random()-.5)*4,-14,2.4,6,fr>=.25?30:16);if(Math.random()<dt*sp*6)EM.add(FX+10+Math.random()*76,FY+Math.random()*50,(Math.random()-.5)*16,-24-Math.random()*20,.5+Math.random()*.6);}
    else if(ne>0){fl(FC,FX+30,FY+92,1,8,10,100);fl(FC,FX+64,FY+90,2,8,10,100);}
    const tp=frac(TC);drawObj(u,W,H,TR,treeCol(tp));
    if(TC.st===1){const S=TR.spots;if(T-TC.t<1)fl(FC,S[0][0],S[0][1],0,8,10,100);else for(let k=0;k<S.length;k++){if(k===0&&tp>.4)continue;if(tp<S[k][2]*1.4)continue;if(tp>.9&&k>1)continue;fl(k?FT_[k&1]:FC,S[k][0],S[k][1],k,k?22:8,k?28:10,k?120:100);}
      if(Math.random()<dt*sp*3)EM.add(116+(Math.random()-.5)*30,110+Math.random()*30,(Math.random()-.5)*12,-26,.6);if(Math.random()<dt*sp)SMK.add(116,84,(Math.random()-.5)*4,-12,2.2,6,22);}
    EM.step(dt,-6,.98);SMK.step(dt);drawPuffs(u,W,H,SMK);drawEmbers(u,W,H,EM);
    if(C.v('grid'))grid(u,W,H,OX,OY);P.put();out();}};});

// ======================================================================
// F4. lava at 32 px: Tibia's slow frames and 8 variants, Stardew's checkerboard, or a palette cycle; crust edge, glow band and light
// ======================================================================
reg('lava',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=128,OX=1600,OY=96;segs(C,root);
  const G=ground(W,H,OX,OY),bg=tint(G.B,night),DUSK=tint(G.B,dk),LT=new Set(['1,1','2,1','3,1','1,2','2,2']),isL=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&LT.has((x>>5)+','+(y>>5));
  const HOT=[F1,LV1,F2,F3,F4],M=meter();
  // wrapped voronoi over a texture period of pw x ph px: crust plates and cracks between them
  function tex(pw,ph,ncx,ncy,sd){const csx=pw/ncx,csy=ph/ncy,o={c:new Uint32Array(pw*ph),k:new Int8Array(pw*ph).fill(-1),pw,ph};
    for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const gx=Math.floor(x/csx),gy=Math.floor(y/csy);let d1=1e9,d2=1e9,bk=0,bx=0,by=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=gx+dx,cy=gy+dy,wx=((cx%ncx)+ncx)%ncx,wy=((cy%ncy)+ncy)%ncy,sx=(cx+.2+h2(wx+sd,wy+500)*.6)*csx,sy=(cy+.2+h2(wx+500,wy+sd)*.6)*csy,d=Math.hypot(x+.5-sx,(y+.5-sy)*1.15);
        if(d<d1){d2=d1;d1=d;bk=h2(wx+9+sd,wy+9);bx=sx;by=sy;}else if(d<d2)d2=d;}
      const i=y*pw+x;if(d2-d1<2.6||bk<.22)o.k[i]=((((x>>1)+(y>>1))>>1)+((h2(x>>2,y>>2)*2)|0))%5;else{const lx=x+.5-bx,ly=y+.5-by;o.c[i]=lx+ly<-2?C3:bk<.6?C2:C1;}}
    return o;}
  const TIB=tex(128,64,12,6,40),STA=tex(32,32,3,3,70),STB=tex(32,32,3,3,90),PAL=tex(64,64,6,6,110);
  const rim=new Uint8Array(W*H),glow=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,L=isL(x,y);let dmin=9;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){if(isL(x+dx,y+dy)!==L){const d=Math.max(Math.abs(dx),Math.abs(dy));if(d<dmin)dmin=d;}}
    if(L&&dmin<=2+(h2(x>>1,y>>1)<.5?1:0))rim[i]=dmin;if(!L&&dmin<=2)glow[i]=dmin;}
  let T=0,lastLit='',lit=bg;
  const out=throttle(()=>{const m=C.segv('m');
    ro.innerHTML=(m==='tib'?'<b>Tibia</b> classic lava: 3 synchronised frames of 500 ms, 8 position variants in a 4x2 pattern, light 4 in red-orange colour 193.':m==='sdv'?'<b>Stardew</b> volcano lava: 10 frames of 200 ms, 2 variants in a checkerboard by (x + y) % 2, a slow scroll of about 6 px/s at 32 px.':
      '<b>Palette cycle</b>, the report\'s plan: 4 variants by x % 2 and y % 2, five hot entries on the crack pixels cycled 8 steps per second, a 625 ms period.')+
      ` Tile draw ${fms(M.v)} ms here. Report: one palette uniform per frame for any number of lava tiles. A full-screen noise shader costs 0.022 ms of GPU time (B5).`;},300);
  return {tick(dt){const sp=C.v('fast')?4:1;T+=dt*sp;const m=C.segv('m'),edge=C.v('edge'),light=C.v('light'),key=light+'';
    if(key!==lastLit){lastLit=key;lit=light?litGround(DUSK,W,H,[[72,58,128,1]],c=>mul(c,.7,.72,.8)):bg;}
    u.set(lit);const t0=now(),f3=Math.floor(T/.5)%3,f10=Math.floor(T/.2)%10,step=Math.floor(T*8),scr=Math.floor(T*6);
    for(let y=32;y<96;y++)for(let x=32;x<128;x++){if(!isL(x,y))continue;const i=y*W+x,X=x+OX,Y=y+OY;let c,k;
      if(m==='tib'){const j=(Y&63)*128+(X&127);k=TIB.k[j];c=k>=0?HOT[(k+f3*2)%5]:TIB.c[j];}
      else if(m==='sdv'){const t=((X>>5)+(Y>>5))&1?STB:STA,j=((Y+scr)&31)*32+((X+scr)&31);k=t.k[j];c=k>=0?HOT[(k+f10)%5]:t.c[j];}
      else{const j=(Y&63)*64+(X&63);k=PAL.k[j];c=k>=0?HOT[(k+step)%5]:PAL.c[j];}
      if(edge&&rim[i])c=rim[i]===1?C0:(k>=0?F1:C1);u[i]=c;}
    if(edge)for(let i=0;i<W*H;i++)if(glow[i])u[i]=glow[i]===1?mix(u[i],F1,.55):mix(u[i],F2,.25);
    M.add(now()-t0);if(C.v('grid'))grid(u,W,H,OX,OY);P.put();out();}};});
}
