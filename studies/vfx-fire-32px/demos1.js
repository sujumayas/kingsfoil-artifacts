"use strict";
// Fire at 32 px: figures 1 (hero, timeline, scale, spreadroll, fieldres, framecost, uploads, lights, pingpong, maskseed, convert, spreadspeed) and the stack.
// Everything sits in one block so helper names stay local to this file. The art is this file's own copy of the Fire 32 Sandbox's.
{
// ----------------------------------------------------------------------
// shared bits: RNG, the Sandbox palette, shading, ground tiles, the burn-order
// map, flame loops, smoke puffs, 24x32 characters and the burn front rule
// ----------------------------------------------------------------------
const RS=new Int32Array([20261114]);
const rnd1=()=>{let r=RS[0];r^=r<<13;r^=r>>>17;r^=r<<5;RS[0]=r;return (r>>>0)/4294967296;};
const put=(u,W,H,x,y,c)=>{if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=c;};
const num=n=>Math.round(n).toLocaleString('en-US');
const f2=v=>v.toFixed(2);
const vnoiseT=(x,y,p)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),m=v=>((v%p)+p)%p;const a=hash2(m(xi),m(yi)),b=hash2(m(xi+1),m(yi)),c=hash2(m(xi),m(yi+1)),d=hash2(m(xi+1),m(yi+1));return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
// the Fire 32 Sandbox's ramps. Fire bends from purple through red to yellow
const OUTL=U('#1a1420'),G0=U('#1c3a32'),G1=U('#28583b'),G2=U('#3b7840'),G3=U('#5c9845'),G4=U('#92bf59'),
  D0=U('#5a4a2d'),D1=U('#836c39'),D2=U('#b09049'),D3=U('#d8bd6b'),FLW=U('#ece0b4'),FLR=U('#d4647c'),
  C0=U('#150e14'),C1=U('#26191d'),C2=U('#3b2a26'),C3=U('#583e30'),A0=U('#45414c'),A1=U('#68646f'),A2=U('#8f8a95'),A3=U('#b8b3bb'),
  S0=U('#2a2b3a'),S1=U('#45485b'),S2=U('#666a7e'),S3=U('#8e93a5'),S4=U('#bec2ce'),
  W0=U('#35201a'),W1=U('#583725'),W2=U('#7e522f'),W3=U('#a6733f'),W4=U('#cb995b'),
  R0=U('#44202a'),R1=U('#6c2d30'),R2=U('#964237'),R3=U('#be613e'),
  P0=U('#0f2f2c'),P1=U('#1a493c'),P2=U('#29694a'),P3=U('#498a54'),K1=U('#c37d5b'),K2=U('#eab28b'),
  U0=U('#1e2a57'),U1=U('#2e4b8d'),U2=U('#4b75c5'),V0=U('#2b4925'),V1=U('#446f35'),V2=U('#6a9949'),
  Y0=U('#89591d'),Y1=U('#c8912f'),Y2=U('#efc555'),RD0=U('#5d1923'),RD1=U('#952b2d'),RD2=U('#c7473b'),
  SM0=U('#2f2d36'),SM1=U('#4f4c58'),SM2=U('#777382'),SM3=U('#a29eaa'),I0=U('#1e1c25'),I1=U('#393743'),I2=U('#5b5967'),
  WIN=U('#6a7fa0'),WIN_D=U('#495a7b'),
  F0=U('#3f1a3f'),F1=U('#8d1f2c'),F2=U('#cf421f'),F3=U('#f1822a'),F4=U('#fcca4c'),F5=U('#fff3c4'),WHITE=U('#ffffff');
const FT=Uint32Array.from([0,F1,F2,F3,F4,F5,F0]);
// time-of-day shading as in the Sandbox's palette pass: ambient, warm band 1 and warm band 2 for each colour
function mkShade(a,nk){const a1=.1+.36*nk,a2=.22+.5*nk,M=new Map();
  return c=>{let v=M.get(c);if(!v){const r=c&255,g=(c>>>8)&255,b=(c>>>16)&255,R=r*a[0],G=g*a[1],B=b*a[2],wr=r*1.1+34,wg=g*.92+14,wb=b*.62+2;
    v=[pack(R,G,B),pack(R+(wr-R)*a1,G+(wg-G)*a1,B+(wb-B)*a1),pack(R+(wr-R)*a2,G+(wg-G)*a2,B+(wb-B)*a2)];M.set(c,v);}return v;};}
const DUSK=mkShade([.8,.6,.7],.62),NIGHT=mkShade([.3,.34,.56],1),DAY=mkShade([1,1,1],.15);
// the light band: 2 warm steps at 0.3 and 0.62, a dither band 0.026 wide in 2x2 px clusters
const lband=(L,x,y)=>{const d=(bay(x>>1,y>>1)/15-.5)*.052;return L>.62+d?2:L>.3+d?1:0;};
// Quake light style 1 (flicker), sampled at 10 Hz as in VFX #5
const FLK='mmnmmommommnonmmonqnmmo';const flick=(t,o)=>(FLK.charCodeAt(((t*10+o)|0)%FLK.length)-97)/12;

// ground: 6 grass tiles of 32x32 with tufts, picked by a position hash (the Sandbox's), plus charred and ash versions by rule
const TUFTS=[["l...l",".l.l.",".lml.",".xmx."],["l.l",".l.",".x."],[".l...l.","l.l.l.l",".lmlml.","..xmx.."],["l..",".ll",".mx"],["..l..","l.l.l",".lml.",".xmx."]];
function mkTiles(seed){const T=[],K=[];for(let v=0;v<6;v++){const t=new Uint32Array(1024),k=new Uint8Array(1024),sv=v+seed*7;
  for(let gy=0;gy<3;gy++)for(let gx=0;gx<3;gx++){if(hash2(sv*31+gx*7+1,gy*13+v*5+2)<.34)continue;
    const Tf=TUFTS[(hash2(gx+sv*3,gy+9+v)*TUFTS.length)|0],tw=Tf[0].length,th=Tf.length,x0=2+gx*10+((hash2(gx*5+sv,gy*3+1)*(11-tw))|0),y0=2+gy*10+((hash2(gx+11,gy*7+sv)*(11-th))|0);
    for(let r=0;r<th;r++)for(let c=0;c<tw;c++){const ch=Tf[r][c];if(ch==='.')continue;const px=x0+c,py=y0+r;if(px>31||py>31)continue;t[py*32+px]=ch==='l'?G4:ch==='m'?G3:G0;k[py*32+px]=1;}}
  for(let n=0;n<3;n++){const x=3+((hash2(sv+n*9,77)*24)|0),y=3+((hash2(sv*3+n,91)*24)|0);if(!t[y*32+x]&&!t[y*32+x+1]){t[y*32+x]=G1;t[y*32+x+1]=G1;if(n===0)t[(y+1)*32+x+1]=G1;}}
  if(v===2||v===5){const x=6+((hash2(sv,5)*18)|0),y=6+((hash2(sv,6)*18)|0),fc=v===2?FLW:FLR;if(!k[y*32+x]){t[y*32+x]=fc;t[y*32+x+1]=fc;t[(y+1)*32+x]=fc;t[(y+1)*32+x+1]=Y1;k[y*32+x]=k[y*32+x+1]=k[(y+1)*32+x]=k[(y+1)*32+x+1]=1;}}
  if(v===3){const x=5+((hash2(sv,8)*18)|0),y=5+((hash2(sv,9)*18)|0);if(!k[y*32+x]){t[y*32+x]=S3;t[y*32+x+1]=S4;t[y*32+x+2]=S3;t[(y+1)*32+x]=S1;t[(y+1)*32+x+1]=S2;t[(y+1)*32+x+2]=S1;}}
  T.push(t);K.push(k);}return [T,K];}
const DRYC=new Map([[G4,D3],[G3,D2],[G2,D2],[G1,D1],[G0,D0],[FLR,FLW]]);
// the burn-order map: 128 px, tileable, stored as 64x64 blocks of 2x2 px. Patches start at seeds and grow, so char arrives in clusters
let MB=null;
function getMB(){if(MB)return MB;MB=new Uint8Array(4096);const n=96,sx=[],sy=[],st=[],gr=[];for(let k=0;k<n;k++){sx.push(hash2(k,11)*64);sy.push(hash2(k,23)*64);st.push(hash2(k,37));gr.push(.7+hash2(k,41)*.6);}
  const raw=new Float32Array(4096);
  for(let by=0;by<64;by++)for(let bx=0;bx<64;bx++){let best=1e9;for(let k=0;k<n;k++){let dx=Math.abs(bx+.5-sx[k]),dy=Math.abs(by+.5-sy[k]);if(dx>32)dx=64-dx;if(dy>32)dy=64-dy;const v=st[k]*6+Math.sqrt(dx*dx+dy*dy)*gr[k];if(v<best)best=v;}raw[by*64+bx]=best+vnoiseT(bx/8,by/8,8)*3;}
  const ord=[...raw.keys()].sort((a,b)=>raw[a]-raw[b]);for(let r=0;r<4096;r++)MB[ord[r]]=(r*256/4096)|0;return MB;}
// a ground of W x H art px: B normal, CH charred, AS ash, TK tufts, HP a hash byte, MV the burn-order map, NB 1 where nothing burns
function mkGround(W,H,seed=1,dryAt){const [T,K]=mkTiles(seed),N=W*H,B=new Uint32Array(N),CH=new Uint32Array(N),AS=new Uint32Array(N),TK=new Uint8Array(N),HP=new Uint8Array(N),MV=new Uint8Array(N),NB=new Uint8Array(N),M=getMB();
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,n=vnoise(x/52+seed*5,y/44)*.6+vnoise(x/19,y/16+seed*2)*.4,dry=dryAt?dryAt(x,y):false;
    const v=(hash2((x>>5)+3+seed*7,(y>>5)+7)*6)|0,ti=(y&31)*32+(x&31),tv=T[v][ti];let b=dry?(n<.4?D1:n>.66?D3:D2):(n<.37?G1:n>.64?G3:G2);if(tv)b=dry?(DRYC.get(tv)||tv):tv;
    B[i]=b;TK[i]=K[v][ti];HP[i]=hashI(x,y,3,seed)&255;MV[i]=M[((y>>1)&63)*64+((x>>1)&63)];
    const h=hash2((x>>1)+seed*13,(y>>1)+71),n1=vnoise(x/9,y/8),n2=vnoise(x/13+40,y/11);let c=TK[i]?C0:(n1>.68?C3:(h<.45?C1:C2));if(!TK[i]&&h>.965)c=A1;if(dry&&!TK[i]&&n1<.3)c=C3;CH[i]=c;
    let a=n2<.32?A0:n2>.7?A2:A1;if(TK[i])a=(b===G4||b===D3)?A3:C1;else if(h<.035)a=C1;AS[i]=a;}
  return {W,H,B,CH,AS,TK,HP,MV,NB};}
// a dirt path below y0 with a ragged 1 px edge; it never burns
function addPath(G,y0){const {W,H,B,NB}=G;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const e=y0+Math.round((vnoise(x/22+1,3)-.5)*8),i=y*W+x;if(y<e)continue;
  const h=hash2(x>>1,y>>1),n=vnoise(x/11,y/9);B[i]=y===e?W1:h<.06?S2:h<.1?S1:n>.6?W2:n<.32?W0:W1;if(y===e+1&&h<.5)B[i]=W2;NB[i]=1;}}
// a campfire bed: ash, two crossed logs and a ring of stones (the Sandbox's), written into the ground
function addCamp(G,cx,cy){const {W,B,NB}=G,set=(x,y,c)=>{const i=y*W+x;if(x>=0&&x<W&&i>=0&&i<B.length){B[i]=c;NB[i]=1;}};
  for(let dy=-7;dy<=7;dy++)for(let dx=-16;dx<=16;dx++)if((dx/16)**2+((dy-1)/8)**2<1)NB[(cy+dy)*W+cx+dx]=1;
  for(let dy=-5;dy<=5;dy++)for(let dx=-11;dx<=11;dx++){const d=(dx/10)**2+(dy/4.5)**2;if(d<1)set(cx+dx,cy+dy,hash2((cx+dx)>>1,(cy+dy)>>1)<.5?C1:A0);}
  const log=(x0,y0,x1,y1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let k=0;k<=n;k++){const x=Math.round(x0+(x1-x0)*k/n),y=Math.round(y0+(y1-y0)*k/n);
    for(let t=-2;t<=2;t++)set(x,y+t,t===-2||t===2?OUTL:t===-1?W3:t===0?W2:W1);if(k===0||k===n)for(let t=-1;t<=1;t++)set(x,y+t,t?W1:W4);}};
  log(cx-9,cy+3,cx+9,cy-1);log(cx-8,cy-1,cx+8,cy+3);
  for(let k=0;k<9;k++){const a=k/9*6.283+.3,sx=Math.round(cx+Math.cos(a)*14),sy=Math.round(cy+1+Math.sin(a)*7);
    for(let dy=-2;dy<=2;dy++)for(let dx=-3;dx<=3;dx++){const d=(dx/3)**2+(dy/2.2)**2;if(d>1.15)continue;set(sx+dx,sy+dy,d>.7?OUTL:dy<0?S3:dy===0?S2:S1);}}}
// a torch on a post, 10x36 px, its foot at (px, py). Returns the flame's bottom centre
function drawPost(u,W,H,px,py){const x0=px-4,y0=py-35,s=(x,y,c)=>put(u,W,H,x0+x,y0+y,c);
  for(let y=7;y<=35;y++)for(let x=2;x<=6;x++)s(x,y,OUTL);for(let x=0;x<=8;x++){s(x,8,OUTL);s(x,9,OUTL);}for(let y=2;y<=7;y++)for(let x=1;x<=7;x++)s(x,y,OUTL);
  for(let y=8;y<=34;y++)for(let x=3;x<=5;x++)s(x,y,x===3?W3:x===4?W2:W1);for(let x=1;x<=7;x++)s(x,8,I1);s(2,7,I2);s(6,7,I1);
  for(let y=3;y<=6;y++)for(let x=2;x<=6;x++)s(x,y,y===3?W1:(x+y)%2?W0:C1);for(let x=2;x<=6;x++)s(x,35,S2);return [px,py-32];}

// flame loops, built in code (the Sandbox's genFlame): tongues with a held base, a distance field for the tones, detached 2x2 tongues.
// Tone codes 1..5 are F1..F5, 6 is the purple edge F0
const BANDS={2:[.6],3:[.4,.78],4:[.3,.58,.84],5:[.24,.46,.68,.88]};
function genFlame(w,h,n,nt,vs){const codes=nt===3?[3,4,5]:nt===4?[2,3,4,5]:nt===5?[1,2,3,4,5]:[6,1,2,3,4,5],frames=[];
  const ntg=w<9?1:w<18?2:3,tg=[];
  for(let k=0;k<ntg;k++){const c=ntg===1?0:ntg===2?(k?.2:-.16)*w:[0,-.27,.27][k]*w,Hh=ntg===1?1:ntg===2?(k?.72:1):[1,.68,.6][k],Wd=ntg===1?.95:ntg===2?(k?.6:.78):[.62,.5,.48][k];
    tg.push({c:c+(hash2(k,vs+3)-.5)*w*.08,H:Hh*(.92+hash2(k,vs)*.12),Wd,ph:hash2(k,vs+7),ps:hash2(k,vs+11)});}
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
const mkF=(w,h,n,nt,ms,vs=0)=>({w,h,n,ms,fr:genFlame(w,h,n,nt,vs*17+w)});
// the loops this file uses: post torch 10x16 and hand torch 6x8 (B1, E2), grass flames 12x16 and 8x10, campfire 24x28 with the purple edge,
// and the VFX #6 look, 4 tones and 8 px tall
const FLS={torch:mkF(10,16,6,5,100),htorch:mkF(6,8,4,4,100),gl:mkF(12,16,6,5,100),gl2:mkF(12,16,6,5,100,1),gs:mkF(8,10,4,4,100),camp:mkF(24,28,8,6,110),
  v6:mkF(6,8,4,4,100),v6c:mkF(10,12,4,4,100)};
// draw frame f of a loop with its bottom centre at (x, y). em marks emissive pixels
function drawF(u,W,H,F,f,x,y,em){const a=F.fr[((f%F.n)+F.n)%F.n],x0=Math.round(x-F.w/2),y0=Math.round(y-F.h+1);
  for(let j=0;j<F.h;j++){const yy=y0+j;if(yy<0||yy>=H)continue;for(let i=0;i<F.w;i++){const t=a[j*F.w+i];if(!t)continue;const xx=x0+i;if(xx<0||xx>=W)continue;const k=yy*W+xx;u[k]=FT[t];if(em)em[k]=1;}}}
const ffr=(F,t,ph)=>Math.floor(t*1000/F.ms)+ph;

// smoke puff masks (the Sandbox's): lumpy discs of four lobes, code 1 light, 2 body, 3 shade
const PUFFM=[];for(let s=2;s<=32;s+=1){const a=new Uint8Array(s*s),r=s/2,L=s<5?[[0,0,1]]:[[0,.12,.62],[-.42,.2,.44],[.42,.16,.46],[.04,-.34,.5]];
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){const dx=(x+.5-r)/r,dy=(y+.5-r)/r;let inL=-1,best=-9;for(let k=0;k<L.length;k++){const v=L[k][2]-Math.hypot(dx-L[k][0],dy-L[k][1]);if(v>best){best=v;inL=k;}}
    if(best<0)continue;const lx=(dx-L[inL][0])/L[inL][2],ly=(dy-L[inL][1])/L[inL][2];a[y*s+x]=(lx+ly<-.55&&best>.06)?1:(ly>.45&&(dy>.25||s<5))?3:2;}
  PUFFM[s]={s,a};}
// draw a puff of diameter d at (x, y). clusters: true draws a d/2 mask in 2x2 px blocks; false draws it per pixel through Bayer (the VFX #6 look)
function drawPuff(u,W,H,x,y,d,fade,clusters,em){const cols=[0,SM3,SM2,SM1];
  if(clusters){const s=clamp(Math.round(d/2),2,32),M=PUFFM[s],x0=Math.round(x/2-s/2)*2,y0=Math.round(y/2-s/2)*2;
    for(let j=0;j<s;j++)for(let i=0;i<s;i++){const t=M.a[j*s+i];if(!t)continue;const bx=x0+i*2,by=y0+j*2,edge=Math.hypot(i+.5-s/2,j+.5-s/2)>s/2-1;
      if(hash2(bx>>1,by>>1)*255<fade*255+(edge?50:0))continue;for(let q=0;q<4;q++){const X=bx+(q&1),Y=by+(q>>1);if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(em&&em[k])continue;u[k]=cols[t];}}}
  else{const s=clamp(Math.round(d),2,32),M=PUFFM[s],x0=Math.round(x-s/2),y0=Math.round(y-s/2);
    for(let j=0;j<s;j++)for(let i=0;i<s;i++){const t=M.a[j*s+i];if(!t)continue;const X=x0+i,Y=y0+j;if(X<0||Y<0||X>=W||Y>=H)continue;if(bay(X,Y)*16<fade*255+90)continue;const k=Y*W+X;if(em&&em[k])continue;u[k]=t===1?SM3:SM2;}}}

// 24x32 characters: the Sandbox's row templates and frame builder, with the hand positions for a carried torch
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
const mkMap=(hat,hatL,hatD,coat,coatL,coatD,scarf,scarfD,hair,hairD,brim,brimD)=>({h:hat,L:hatL,H:hatD,w:brim,W:brimD,k:hair,K:hairD,s:K2,S:K1,E:OUTL,y:scarf,Y:scarfD,c:coat,l:coatL,C:coatD,g:K2,G:K1,p:S1,P:S0,b:W1,B:W0,o:OUTL});
const MAPS=[mkMap(RD1,RD2,RD0,U1,U2,U0,Y1,Y0,W1,W0,W2,W1),mkMap(D2,D3,D1,V1,V2,V0,RD1,RD0,S2,S1,D2,D1)];
function outlineSprite(px,w,h){const add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(px[i])continue;if((x>0&&px[i-1])||(x<w-1&&px[i+1])||(y>0&&px[i-w])||(y<h-1&&px[i+w]))add.push(i);}for(const i of add)px[i]=OUTL;}
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
const FR=MAPS.map(mkFrames);
const mkActor=(x,y,set=0)=>({x,y,set,dir:2,fr:0,ph:0,moving:false,torch:true});
// walk: one frame per 8 px, so the contacts on frames 0 and 2 land every 16 px
function walkActor(a,vx,vy,dt){const mx=vx*dt,my=vy*dt,m=Math.hypot(mx,my);a.x+=mx;a.y+=my;if(m<.001){a.moving=false;return;}
  a.dir=Math.abs(vx)>Math.abs(vy)+.01?(vx>0?2:3):(vy>0?0:1);if(!a.moving){a.moving=true;a.ph=0;}else a.ph+=m/8;a.fr=(a.ph|0)&3;}
// draw an actor with its feet at (a.x, a.y). dir 0 down, 1 up, 2 right, 3 left. As in the Sandbox as built, only a north-facing character
// draws its torch behind the body; the stick tilts 6 px in side view and the flame runs on its own clock
function drawActor(u,W,H,a,t,em,look){const fx=Math.round(a.x),fy=Math.round(a.y),dI=a.dir===0?0:a.dir===1?1:2,fr=a.moving?a.fr:4,F=FR[a.set][dI][fr],px=F.px,flip=a.dir===3,x0=fx-12,y0=fy-30;
  for(let r=-2;r<=2;r++){const y=fy-3+r;if(y<0||y>=H)continue;const w=Math.round(7*Math.sqrt(1-(r/2.5)**2));for(let x=fx-w;x<fx+w;x++)if(x>=0&&x<W&&!(em&&em[y*W+x]))u[y*W+x]=mulc(u[y*W+x],.6,.58,.66);}
  let hx=0,hy=0;if(a.torch){const st=FR[a.set][dI][4],hh=dI===1?st.hr:st.hl;hx=hh[0];hy=hh[1];const off=dI<2?[[1,0],[0,-1],[-1,0],[0,-1],[0,0]][fr]:[[1,0],[0,0],[-1,0],[0,0],[0,0]][fr];hx+=off[0]+(dI===0?-2:dI===1?2:4);hy+=off[1];if(flip)hx=23-hx;}
  const lean=dI===2?(flip?-1:1):0,behind=a.dir===1;
  const torch=()=>{const X=x0+Math.round(hx),Y=y0+Math.round(hy);for(let k=0;k<8;k++)for(let q=0;q<2;q++){const x=X+q-1+lean*Math.round(k*.8),y=Y-k;put(u,W,H,x,y,k>=6?(q?C1:W0):(q?W1:W3));}
    drawF(u,W,H,look===0?FLS.v6:FLS.htorch,ffr(FLS.htorch,t,3),X+lean*6,Y-7,em);};
  if(a.torch&&behind)torch();
  for(let r=0;r<32;r++){const y=y0+r;if(y<0||y>=H)continue;for(let cx=0;cx<24;cx++){const v=px[r*24+(flip?23-cx:cx)];if(!v)continue;const x=x0+cx;if(x<0||x>=W)continue;u[y*W+x]=a.flash?mix32(v,WHITE,.6):v;if(em)em[y*W+x]=0;}}
  if(a.torch&&!behind)torch();
  return a.torch?[x0+Math.round(hx)+lean*6,y0+Math.round(hy)-10]:null;}

// the burn front rule of section 7, evaluated per 2x2 px block: T = (1 - a) x entry ramp + a x painted map, d = b - T
const DIRS=[[-1,0],[-.7071,-.7071],[0,-1],[.7071,-.7071],[1,0],[.7071,.7071],[0,1],[-.7071,.7071]];
function burnT(x,y,dir,mv,a){const e=DIRS[dir],ux=((x&30)+1)/32-.5,uy=((y&30)+1)/32-.5,s=(e[0]&&e[1])?1.41421:1;return (1-a)*clamp((-ux*e[0]-uy*e[1])/s+.5,0,1)+a*mv/255;}
const BA=.4,WR=(1-BA)*2/32,WS=(1-BA)*2.5/32;

// ======================================================================
// a small burning scene on 32 px tiles, shared by the hero and Fig. scale.
// Tiles catch about one a second from the west, each at its own time, burn
// 5 s (green grass, 5 rolls as built), glow as embers for 5 s and turn to
// ash, then the meadow regrows and the cycle starts again. The front is the
// Sandbox's continuous one: each 2x2 px block samples the tiles' ignition
// times bilinearly, minus up to 0.9 s of jitter from the burn-order map.
// look 1 is the 32 px look, 0 the VFX #6 settings at the same size.
// ======================================================================
function mkScene(W,H,o){const G=mkGround(W,H,o.seed||2,o.dry),TW=Math.ceil(W/32),TH=Math.ceil(H/32),NT=TW*TH,tI=new Float32Array(NT),dT=new Uint8Array(NT),ph=new Uint8Array(NT),burnable=new Uint8Array(NT);
  if(o.path)addPath(G,o.path);if(o.camp)addCamp(G,o.camp[0],o.camp[1]);
  for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){let n=0;for(let y=ty*32;y<Math.min(H,ty*32+32);y+=4)for(let x=tx*32;x<Math.min(W,tx*32+32);x+=4)if(!G.NB[y*W+x])n++;burnable[ty*TW+tx]=n>40?1:0;}
  // every tile runs its own cycle of P seconds, offset by its column, so a new front leaves the west edge before the last one is gone:
  // burn 5 s, embers 3 s, ash fades in for 1 s and holds 0.5 s, regrows over 1.5 s, then grass until the next front arrives
  const BURN=5,EMB=3,ASH=1,HOLD=.5,RG=1.5,GRW=BURN+EMB+ASH+HOLD,GT=GRW+RG,P=Math.max(13,TW+4),bw=(W>>1)+2,bh=(H>>1)+2,BV=new Float32Array(bw*bh),AV=new Float32Array(bw*bh),E=new Float32Array(NT),TC=new Float32Array(NT);
  let t=o.t0+Math.min(TW*.55,6)*o.pace;const cnt=1;
  for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const k=ty*TW+tx,h=hash2(tx*7+31,ty*13+5);tI[k]=burnable[k]?o.t0+(tx+h*.8+(ty&1)*.2)*o.pace:1e9;dT[k]=h<.18?1:h>.82?7:0;ph[k]=(hash2(tx+1,ty+40)*8)|0;}
  // E: seconds since this tile last caught, or minus the seconds until it catches when it is grass. TC: that ignition time
  const upd=()=>{for(let k=0;k<NT;k++){if(tI[k]>1e8){E[k]=-99;TC[k]=1e9;continue;}const e=(((t-tI[k])%P)+P)%P;if(e<GT){E[k]=e;TC[k]=t-e;}else{E[k]=e-P;TC[k]=t-e+P;}}};upd();
  const puffs=[],EP=mkPool(160);let pAcc=0;
  const S={G,TW,TH,burning:0,
    tick(dt){t+=dt;upd();
      let nb=0;for(let k=0;k<NT;k++){const e=E[k];if(e>.2&&e<BURN){nb++;const tx=k%TW,ty=(k/TW)|0;
          if(rnd1()<dt*.8&&puffs.length<64)puffs.push({x:tx*32+8+rnd1()*16,y:ty*32+12,t:0,life:3+rnd1(),s0:4+rnd1()*4,s1:16+rnd1()*8,vx:4+rnd1()*3});
          if(rnd1()<dt*3)EP.spawn(tx*32+6+rnd1()*20,ty*32+18+rnd1()*8,(rnd1()-.5)*10,-22-rnd1()*16,.5+rnd1());}}
      S.burning=nb;
      if(o.camp){pAcc+=dt;if(pAcc>.5&&puffs.length<64){pAcc=0;puffs.push({x:o.camp[0]+(rnd1()-.5)*6,y:o.camp[1]-26,t:0,life:2.6+rnd1()*.6,s0:4+rnd1()*2,s1:16+rnd1()*4,vx:4+rnd1()*3});}
        if(rnd1()<dt*5)EP.spawn(o.camp[0]+(rnd1()-.5)*12,o.camp[1]-10,(rnd1()-.5)*8,-26-rnd1()*14,.6+rnd1()*.8);}
      for(let k=puffs.length-1;k>=0;k--){const p=puffs[k];p.t+=dt;p.x+=p.vx*dt;p.y-=26*dt;if(p.t>p.life)puffs.splice(k,1);}
      EP.step(dt,10,3,.97);},
    // the ground and the burn, into u. em marks emissive pixels
    ground(u,em,look){const {B,CH,AS,MV,HP,NB}=G,fr=(t*8)|0,M=getMB();
      if(look){const live=k=>E[k]>=0&&E[k]<GRW,cell=(px,py,ash)=>{const fx=clamp(px/32-.5,0,TW-1),fy=clamp(py/32-.5,0,TH-1),xi=Math.min(TW-2,fx|0),yi=Math.min(TH-2,fy|0),tx=fx-xi,ty=fy-yi,v=k=>live(k)?TC[k]+(ash?BURN+EMB:0):t+6+(ash?BURN+EMB:0),k=yi*TW+xi;
          return (v(k)*(1-tx)+v(k+1)*tx)*(1-ty)+(v(k+TW)*(1-tx)+v(k+TW+1)*tx)*ty;};
        for(let by=0;by<bh;by++)for(let bx=0;bx<bw;bx++){const px=bx*2-1,py=by*2-1,gb=((by+63)&63)*64+((bx+63)&63);BV[by*bw+bx]=t-cell(px,py,false)-M[gb]/255*.9;AV[by*bw+bx]=t-cell(px,py,true)-M[(((by+22)&63)<<6)|((bx+9)&63)]/255*2.2;}}
      for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++){const k=ty*TW+tx,e=E[k],x1=Math.min(W,tx*32+32),y1=Math.min(H,ty*32+32);
        for(let y=ty*32;y<y1;y++)for(let x=tx*32;x<x1;x++){const i=y*W+x;let c=B[i];em[i]=0;
          if(NB[i]||e===-99){u[i]=c;continue;}
          if(e>=GRW)c=MV[i]<(e-GRW)/RG*255?B[i]:AS[i];
          else if(e>=BURN+EMB)c=MV[i]<(e-BURN-EMB)/ASH*255?AS[i]:CH[i];
          else if(look){const lbx=(x>>1)+1,lby=(y>>1)+1,v=BV[lby*bw+lbx];
            if(v>=0){const hx=(x&1)?1:-1,vy=(y&1)?1:-1,bk=hashI(x>>1,y>>1,fr>>1,7)&7;
              if(BV[lby*bw+lbx+hx]<0||BV[(lby+vy)*bw+lbx]<0){c=bk<2?F3:F4;em[i]=1;}
              else if(BV[lby*bw+lbx-hx]<0||BV[(lby-vy)*bw+lbx]<0){c=F1;em[i]=1;}
              else if(v<.35){c=C0;if(bk===5&&e<BURN){c=F1;em[i]=1;}}
              else c=AV[lby*bw+lbx]>=0?AS[i]:CH[i];}}
          else if(e>=0&&e*16>bay(x,y)+.5){c=CH[i];if(e<BURN&&HP[i]<28){c=(HP[i]+fr)&1?F3:F4;em[i]=1;}}
          u[i]=c;}
        // embers: 2 to 3 glowing clusters of 2x2 px or more per charred tile, pulsing (VFX #6 look: none)
        if(look&&e>BURN-.5&&e<BURN+EMB){const fade=(e-BURN+.5)/(EMB+.5),pul=.5+.5*Math.sin(t*3+k);for(let q=0;q<3;q++){if(fade>.85-q*.22)continue;const ex=tx*32+4+(hashI(k,q,cnt,6)%24),ey=ty*32+4+(hashI(k,q,cnt,8)%22);
          for(let z=0;z<6;z++){const X=ex+(z%3),Y=ey+((z/3)|0);if(z===2&&(q&1))continue;if(X>=W||Y>=H)continue;const i=Y*W+X;if(NB[i]||u[i]!==CH[i])continue;u[i]=pul>.55&&z===1?F3:z===4||pul>.3?F2:F1;em[i]=1;}}}}},
    // flames on burning tiles, smoke and embers
    fx(u,em,look,lights){
      // up to 3 flames per burning tile; in its last 25% one small flame loops 1.4x slower (as built)
      for(let k=0;k<NT;k++){const e=E[k];if(e<.4||e>BURN)continue;const tx=k%TW,ty=(k/TW)|0,h1=hash2(tx*3+cnt,ty*5),h2=hash2(tx*5,ty*3+cnt),dying=e>BURN*.75;
        if(look){if(dying)drawF(u,W,H,FLS.gs,ffr(FLS.gs,t/1.4,ph[k]),tx*32+10+h1*12,ty*32+24+h2*4,em);
          else{drawF(u,W,H,k&1?FLS.gl2:FLS.gl,ffr(FLS.gl,t,ph[k]),tx*32+8+h1*8,ty*32+22+h2*6,em);drawF(u,W,H,FLS.gs,ffr(FLS.gs,t,ph[k]+2),tx*32+22+h2*6,ty*32+26+h1*4,em);
            if(h1>.45)drawF(u,W,H,FLS.gs,ffr(FLS.gs,t,ph[k]+1),tx*32+14+h2*6,ty*32+12+h1*4,em);}}
        else drawF(u,W,H,FLS.v6,ffr(FLS.v6,t,ph[k]),tx*32+16,ty*32+20,em);
        if(lights)lights.push([tx*32+16,ty*32+16,dying?30:44,.8]);}
      for(const p of puffs){const q=p.t/p.life,d=p.s0+(p.s1-p.s0)*Math.min(1,q*1.6);drawPuff(u,W,H,p.x,p.y,look?d:d*.6,Math.max(0,(q-.6)/.4),look===1,em);}
      for(let j=0;j<EP.n;j++){if(EP.life[j]<=0)continue;const q=EP.age[j]/EP.life[j],x=Math.round(EP.x[j]),y=Math.round(EP.y[j]),c=q<.3?F4:q<.6?F3:q<.85?F2:F1;
        if(look&&EP.age[j]>.12){for(let z=0;z<4;z++){if(z<2&&((EP.age[j]*10|0)&1)&&q>.5)continue;const X=(x&~1)+(z&1),Y=(y&~1)+(z>>1);if(X>=0&&Y>=0&&X<W&&Y<H){u[Y*W+X]=c;em[Y*W+X]=1;}}}
        else if(x>=0&&y>=0&&x<W&&y<H){u[y*W+x]=look?F5:c;em[y*W+x]=1;}}}};
  return S;}
// light map at 8 px cells, rebuilt each frame from [x, y, radius, intensity] sources, falloff (1 - d^2/r^2)^2, max blend
function mkLight(W,H,cs=8){const lw=Math.ceil(W/cs)+1,lh=Math.ceil(H/cs)+1,L=new Float32Array(lw*lh);
  return {lw,lh,L,cs,build(src){L.fill(0);for(const [sx,sy,r,I] of src){const x0=Math.max(0,Math.floor((sx-r)/cs)),x1=Math.min(lw-1,Math.ceil((sx+r)/cs)),y0=Math.max(0,Math.floor((sy-r)/cs)),y1=Math.min(lh-1,Math.ceil((sy+r)/cs));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=(x+.5)*cs-sx,dy=(y+.5)*cs-sy,q=1-(dx*dx+dy*dy)/(r*r);if(q<=0)continue;const v=I*q*q,i=y*lw+x;if(v>L[i])L[i]=v;}}},
    at(x,y){const fx=(x+.5)/cs-.5,fy=(y+.5)/cs-.5,xi=clamp(Math.floor(fx),0,lw-2),yi=clamp(Math.floor(fy),0,lh-2),tx=clamp(fx-xi,0,1),ty=clamp(fy-yi,0,1),i=yi*lw+xi;
      return (L[i]*(1-tx)+L[i+1]*tx)*(1-ty)+(L[i+lw]*(1-tx)+L[i+lw+1]*tx)*ty;}};}
// the palette pass: ambient shade plus the warm bands, skipped on emissive pixels
function shadePass(u,em,W,H,SH,LM){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(em[i])continue;u[i]=SH(u[i])[LM?lband(LM.at(x,y),x,y):0];}}

// ======================================================================
// HERO: a live strip of the 32 px scene at dusk. The canvas takes its width
// from the column, so it always fills it at 2x. Timed with performance.now().
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),st=cv.parentElement,H=144,mt=meter(.05);
  const W=clamp(Math.floor((stageRoom(st)||320)/8)*4,160,320);cv.width=W;cv.height=H;snapStage(st);
  const F=PX(cv),u=F.u32,EM=new Uint8Array(W*H),camp=[34,118],post=[W-30,104];
  const S=mkScene(W,H,{seed:2,dry:(x,y)=>vnoise(x/46+3,y/30+1)>.6,path:100,camp,t0:1,pace:1});
  const LM=mkLight(W,H,8),A=mkActor(-14,140,0);let dirX=1,look=1,hud=0,t=0,wait=0;
  const bt=$$('[data-v]',root),sync=()=>bt.forEach(b=>b.classList.toggle('on',+b.dataset.v===look));bt.forEach(b=>b.addEventListener('click',()=>{look=+b.dataset.v;sync();}));sync();
  return {tick(dt){mt.t0();t+=dt;S.tick(dt);
    if(wait>0){wait-=dt;if(wait<=0){dirX=-dirX;A.x=dirX>0?-14:W+14;A.moving=false;}}else{walkActor(A,48*dirX,0,dt);if(A.x>W+16||A.x<-16)wait=2;}
    const lights=[[camp[0],camp[1]-8,76,flick(t,0)],[post[0],post[1]-36,56,.9*flick(t,7)]];
    S.ground(u,EM,look);
    drawF(u,W,H,look?FLS.camp:FLS.v6c,ffr(FLS.camp,t,0),camp[0],camp[1]+3,EM);
    const pf=drawPost(u,W,H,post[0],post[1]);drawF(u,W,H,look?FLS.torch:FLS.v6,ffr(FLS.torch,t,2),pf[0],pf[1],EM);
    S.fx(u,EM,look,lights);
    if(wait<=0){const tp=drawActor(u,W,H,A,t,EM,look);if(tp)lights.push([tp[0],tp[1],46,.85*flick(t,13)]);}
    LM.build(lights);shadePass(u,EM,W,H,DUSK,LM);F.put();const ms=mt.t1();hud-=dt;
    if(hud<=0){hud=.3;setHud(root,`frame ${fms(ms)} ms · ${S.TW*S.TH} tiles, ${S.burning} burning · ${look?'32 px look':'VFX #6 look'}`);}}};});

// ======================================================================
// section 3 timeline: four generations from GENS (built from the report)
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#b8a696','#9fc7d6','#ffb44a','#e8622c'];
  const X=y=>y<2008?2+(y-1991)/17*26:y<2017?28+(y-2008)/9*26:54+(y-2017)/10*44;
  let h='<div class="tl-axis">';for(const y of [1991,2000,2008,2017,2026])h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
  const items=[];
  GENS.forEach((g,gi)=>{const ys=g.ev.filter(e=>e.y).map(e=>e.y+e.m/12);const a=Math.min(...ys),b=Math.max(...ys);
    h+=`<div class="tl-lane" data-g="${gi}"><span class="tl-lab">${g.id}</span><div class="tl-track"><i class="tl-bar" style="left:${X(a)}%;width:${Math.max(.8,X(b)-X(a))}%;background:${GC[gi]}"></i>`;
    g.ev.forEach((e,ei)=>{const id=`tle-${gi}-${ei}`;items.push({gi,ei,id,e});if(e.y)h+=`<button class="tl-dot" type="button" style="left:${X(e.y+e.m/12)}%;--c:${GC[gi]}" data-id="${id}" aria-label="${g.id}, ${e.y}"></button>`;});
    h+='</div></div>';});
  lanes.innerHTML=h;
  gb.innerHTML='<button type="button" class="on" data-g="all">All generations</button>'+GENS.map((g,gi)=>`<button type="button" data-g="${gi}"><i style="background:${GC[gi]}"></i>${g.id}: ${g.t}</button>`).join('');
  list.innerHTML=items.map(it=>`<li id="${it.id}" data-g="${it.gi}" style="--c:${GC[it.gi]}"><span class="yr">${GENS[it.gi].id}${it.e.y?' · '+it.e.y:''}</span>${it.e.h}</li>`).join('');
  const show=id=>{const it=items.find(i=>i.id===id);if(!it)return;$$('.tl-list li',root).forEach(l=>l.classList.toggle('hl',l.id===id));$$('.tl-dot',root).forEach(d=>d.classList.toggle('on',d.dataset.id===id));det.innerHTML=`<b>${GENS[it.gi].id}: ${GENS[it.gi].t}</b> · ${it.e.h}`;};
  lanes.addEventListener('pointerover',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('click',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('focusin',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  list.addEventListener('click',e=>{const l=e.target.closest('li');if(l&&!e.target.closest('a'))show(l.id);});
  gb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',gb).forEach(x=>x.classList.toggle('on',x===b));const g=b.dataset.g;
    $$('.tl-list li',root).forEach(l=>l.hidden=!(g==='all'||l.dataset.g===g));$$('.tl-lane',root).forEach(l=>l.classList.toggle('dim',!(g==='all'||l.dataset.g===g)));});
  const pick=items.find(i=>/Tibia launches/.test(i.e.h))||items[0];show(pick.id);return {};});

// section 7 stack: click a layer to read its row
reg('stack',root=>{const det=$('.ldet',root),bt=$$('.layer',root);
  const show=b=>{bt.forEach(x=>x.classList.toggle('on',x===b));const tp=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(tp.content.cloneNode(true));};
  bt.forEach(b=>b.addEventListener('click',()=>show(b)));show(bt[bt.length-1]);return {};});

// ======================================================================
// A1 scale: the same burning corner at 8 px cells (VFX #6, 320x180) and at
// 32 px tiles (640x360), both one quarter of their screen, at the same size.
// ======================================================================
reg('scale',root=>{const cvs=$$('canvas',root),PA=PX(cvs[0]),PB=PX(cvs[1]),ua=PA.u32,ub=PB.u32,c=ctl(root),svgs=$$('svg',root),pls=$$('[data-p]',root);
  const EMA=new Uint8Array(80*45),EMB=new Uint8Array(160*90),SB=mkScene(160,90,{seed:4,dry:(x,y)=>vnoise(x/40+7,y/30)>.62,path:70,t0:.6,pace:1}),AB=mkActor(-14,80,0);
  // the VFX #6 corner: 8 px cells, grass in 1 px noise, 4-tone flames 8 px tall, a 7x12 walker, 1 px embers
  const GA=new Uint32Array(80*45),CA=new Uint32Array(80*45),AA={dir:'right',moving:true,anim:0},tA=new Float32Array(60),EPA=mkPool(60);
  for(let y=0;y<45;y++)for(let x=0;x<80;x++){const i=y*80+x,n=vnoise(x/13+7,y/9)*.6+vnoise(x/4,y/3+5)*.4,h=hash2(x+3,y+17),dry=vnoise(x/20+7,y/15)>.62,path=y>=35+Math.round((vnoise(x/11+1,3)-.5)*4);
    GA[i]=path?(h<.1?S2:n>.6?W2:W1):dry?(h<.04?D3:n<.4?D1:D2):(h<.04?G4:h>.97?G0:n<.37?G1:n>.64?G3:G2);CA[i]=path?GA[i]:h<.45?C1:h<.9?C2:A1;}
  let t=0,cyc=0;const rA=()=>{cyc++;for(let k=0;k<60;k++){const cx=k%10,cy=(k/10)|0;tA[k]=cy>=4?1e9:.6+(cx+hash2(cx+cyc*9,cy)*.8)*.5;}};rA();
  const gridOver=(u,W,H,s)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x%s===0||y%s===0){const i=y*W+x;u[i]=mulc(u[i],.78,.74,.76);}};
  const scheme=(svg,cell,cw,ch,lab)=>{svgEl('rect',{x:0,y:0,width:320,height:180,fill:'#2d4b3d'},svg);
    for(let x=cell;x<320;x+=cell)svgEl('line',{x1:x,y1:0,x2:x,y2:180,stroke:'#1b2a22','stroke-width':cell<10?.6:1},svg);
    for(let y=cell;y<180;y+=cell)svgEl('line',{x1:0,y1:y,x2:320,y2:y,stroke:'#1b2a22','stroke-width':cell<10?.6:1},svg);
    svgEl('rect',{x:1,y:1,width:79,height:44,fill:'none',stroke:'#ffb44a','stroke-width':2},svg);
    svgEl('rect',{x:196,y:120-ch,width:cw,height:ch,fill:'#f3e9df',stroke:'#1a1420','stroke-width':1},svg);svgText(svg,196+cw+6,118,lab,{class:'lab'});};
  scheme(svgs[0],8,7,12,'7x12 walker');scheme(svgs[1],16,12,16,'24x32 walker');
  pls[0].innerHTML='<b>40 x 22.5 cells</b> of 8 px on a 320x180 screen, 57,600 art pixels. The 7x12 px walker is <b>6.7%</b> of the screen height. The yellow frame is the corner shown above.';
  pls[1].innerHTML='<b>20 x 11.25 tiles</b> of 32 px on a 640x360 screen, 230,400 art pixels and 240 server cells. The 24x32 px walker is <b>8.9%</b> of the screen height.';
  const R=(lab,val,note)=>`<div><b>${lab}</b><span>${val}</span><em>${note}</em></div>`;
  $('[data-g="1"]',root).innerHTML=R('Burn front','3.7x','art pixels on fire')+R('Drawn loops','3.3x','150 flames copied in')+R('Light apply','2.8x','every art pixel')+R('Smoke draw','2.4x','every art pixel')+R('Palette pass','3.9x','921,600 bytes RGBA8')+R('DOOM at 1:1','4x cells','a full-screen buffer is 230,400');
  $('[data-g="0"]',root).innerHTML=R('Spread grid','240 B','one cell per tile, 20x12')+R('Burn progress','240 B','one value per tile')+R('Smoke field','3,600 B','80x45 at 8 px cells')+R('Light map build','3,600 B','80x45 at 8 px cells')+R('Ember pool','512','a count, not pixels');
  return {tick(dt){t+=dt;
    // 8 px panel
    if(t>14){t=0;rA();EPA.clear();}
    for(let y=0;y<45;y++)for(let x=0;x<80;x++){const i=y*80+x,k=(y>>3)*10+(x>>3),e=t-tA[k];let col=GA[i];EMA[i]=0;if(e>=0&&e<10){if(e*4*16>bay(x,y)+.5){col=CA[i];if(e<1.6&&hash2(x,y+k)<.12){col=hash2(x+((t*8)|0),y)<.5?F3:F4;EMA[i]=1;}}}ua[i]=col;}
    for(let k=0;k<40;k++){const e=t-tA[k];if(e>.1&&e<1.6){const cx=k%10,cy=(k/10)|0;drawF(ua,80,45,FLS.v6,ffr(FLS.v6,t,k),cx*8+4,cy*8+7,EMA);if(rnd1()<dt*2)EPA.spawn(cx*8+2+rnd1()*4,cy*8+3,(rnd1()-.5)*4,-10-rnd1()*6,.5+rnd1()*.5);}}
    EPA.step(dt,3,1,.97);for(let j=0;j<EPA.n;j++){if(EPA.life[j]<=0)continue;const q=EPA.age[j]/EPA.life[j];put(ua,80,45,Math.round(EPA.x[j]),Math.round(EPA.y[j]),q<.4?F4:q<.7?F3:F1);}
    AA.anim+=dt*8;const wx=((t*12)%110)-12;drawChar(ua,80,45,AA,wx,40);put(ua,80,45,Math.round(wx)+4,30,F4);put(ua,80,45,Math.round(wx)+4,29,F3);put(ua,80,45,Math.round(wx)+4,31,W2);
    // 32 px panel
    SB.tick(dt);SB.ground(ub,EMB,1);SB.fx(ub,EMB,1,null);walkActor(AB,40,0,dt);if(AB.x>176)AB.x=-14;drawActor(ub,160,90,AB,t,EMB,1);
    if(c.v('grid')){gridOver(ua,80,45,8);gridOver(ub,160,90,32);}
    PA.put();PB.put();}};});

// ======================================================================
// A2 spread roll: one fuel strip, three lanes, VFX #6's rule. Each lane runs
// a band 16 tiles deep with wrapped edges and shows one row of it.
// ======================================================================
// name, chance per roll, VFX #6 burn ticks, the Sandbox's burn rolls as built (green grass 5), ground art
const MATS=[['Green grass',.15,3,0,5],['Dry grass',.40,2,1,2],['Hay',.50,4,1,4],['Dead brush',.80,3,1,3],['Oil',1.0,6,2,6]];
// note 15's measured front, cells per tick (lanes 1 and 2), and the Sandbox's measured tiles/s at 32 px as built (lane 3)
const REP=[.52,.93,null,1.0,1.0],SBXV=[.47,.91,null,null,null];
reg('spreadroll',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=256,H=144,c=ctl(root),rows=$('[data-rows]',root),EM=new Uint8Array(W*H);
  const GG=mkGround(W,H,6),GD=mkGround(W,H,6,()=>true),PATHB=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=hash2(x>>1,y>>1),n=vnoise(x/11,y/7);PATHB[y*W+x]=h<.05?S2:n>.62?W2:n<.3?W0:W1;}
  // lanes: cell px, columns, rows simulated, rows shown, rolls once a second (true) or every 4 Hz tick
  const LN=[{cs:8,gw:32,gh:24,show:4,slow:false},{cs:32,gw:8,gh:16,show:1,slow:false},{cs:32,gw:8,gh:16,show:1,slow:true}];
  let mat=1,tick=0,acc=0,t=0,run=0,doneT=-1;const hist=[[],[],[]];
  const start=()=>{run++;tick=0;acc=0;t=0;doneT=-1;for(const L of LN){const n=L.gw*L.gh;L.st=new Uint8Array(n);L.left=new Uint8Array(n);L.ign=new Int32Array(n);L.tI=new Float32Array(n).fill(1e9);
      for(let y=0;y<L.gh;y++){const i=y*L.gw;L.st[i]=1;L.left[i]=L.slow?MATS[mat][4]:MATS[mat][2];L.ign[i]=0;L.tI[i]=0;}L.maxx=0;L.t2=-1;L.t7=-1;L.end=-1;L.wk=mkActor(48,0,1);L.wk.torch=false;L.caught=false;L.wdone=false;L.speed=null;}};
  c.seg('mat',v=>{mat=+v;hist.forEach(h=>h.length=0);start();});c.btn('again',start);start();
  const step=L=>{const p=MATS[mat][1],T=L.slow?MATS[mat][4]:MATS[mat][2],n=L.gw*L.gh,next=[];
    for(let i=0;i<n;i++){if(L.st[i]!==1)continue;if(L.slow&&!(tick>L.ign[i]&&((tick-L.ign[i])&3)===0))continue;const x=i%L.gw,y=(i/L.gw)|0;
      for(let d=0;d<8;d++){const nx=x+DX8[d],ny=(y+DY8[d]+L.gh)%L.gh;if(nx<0||nx>=L.gw)continue;const j=ny*L.gw+nx;if(L.st[j])continue;const pp=p*(d&1?.7:1);
        if(hashI(nx,ny,tick,run*7919+d)/4294967296<pp){L.st[j]=2;next.push(j);}}
      if(--L.left[i]===0)L.st[i]=3;}
    for(const j of next){L.st[j]=1;L.left[j]=T;L.ign[j]=tick;L.tI[j]=tick/4;const x=j%L.gw;if(x>L.maxx)L.maxx=x;}};
  const DX8=[1,1,0,-1,-1,-1,0,1],DY8=[0,1,1,1,0,-1,-1,-1];
  return {tick(dt){t+=dt;acc+=dt;
    while(acc>=.25){acc-=.25;tick++;for(const L of LN){if(L.end<0){step(L);const tipPx=(L.maxx+1)*L.cs;if(L.t2<0&&tipPx>=64)L.t2=tick/4;if(L.t7<0&&tipPx>=224){L.t7=tick/4;L.speed=(224-64)/(L.t7-L.t2);hist[LN.indexOf(L)].push(L.speed);}
        let alive=false;for(let i=0;i<L.st.length;i++)if(L.st[i]===1){alive=true;break;}if(tipPx>=W||!alive)L.end=tick/4;}}}
    if(doneT<0&&LN.every(L=>L.end>=0&&L.wdone))doneT=t;if(doneT>=0&&t-doneT>2.5)start();
    EM.fill(0);const fr=(t*8)|0,G=MATS[mat][3]===0?GG:GD;for(let i=0;i<W*H;i++)u[i]=PATHB[i];
    LN.forEach((L,li)=>{const y0=li*48+16;
      for(let y=0;y<32;y++)for(let x=0;x<W;x++){const Y=y0+y,i=Y*W+x,cx=Math.floor(x/L.cs),cy=Math.floor(y/L.cs),ci=cy*L.gw+cx,s=L.st[ci],e=t-L.tI[ci];let col=G.B[i];
        if(MATS[mat][3]===2&&((G.HP[i]>>3)+((x>>1)+(y>>1)))%7<2&&G.MV[i]<120)col=G.MV[i]<60?C0:U0;
        if(s>=1&&e>=0){if(L.cs===8){if(e*4*16>bay(x,y)+.5){col=G.CH[i];if(s===1&&G.HP[i]<26){col=(G.HP[i]+fr)&1?F3:F4;EM[i]=1;}if(s===3&&e>5&&G.HP[i]>200)col=G.AS[i];}}
          else{const b=clamp(e,0,1)*(1+WR+WS),d=b-burnT(x,y,0,G.MV[i],BA);if(d>=0){if(d<WR&&s===1){col=F4;EM[i]=1;}else if(d<WR+WS&&s===1)col=C0;else col=s===3&&e>6&&G.MV[i]<(e-6)*120?G.AS[i]:G.CH[i];}}}
        u[i]=col;}
      for(let x=0;x<W;x++){u[(y0-1)*W+x]=OUTL;u[(y0+32)*W+x]=OUTL;}
      for(let cx=0;cx<L.gw;cx++)for(let cy=0;cy<L.show;cy++){const ci=cy*L.gw+cx;if(L.st[ci]!==1)continue;
        if(L.cs===8)drawF(u,W,H,FLS.v6,ffr(FLS.v6,t,ci),cx*8+4,y0+cy*8+7,EM);else{drawF(u,W,H,FLS.gl,ffr(FLS.gl,t,cx),cx*32+10,y0+24,EM);drawF(u,W,H,FLS.gs,ffr(FLS.gs,t,cx+2),cx*32+22,y0+28,EM);}}
      // the walker, 80 px/s, one tile ahead of the fire
      const wk=L.wk,tip=L.end>=0&&L.maxx<L.gw-1?-1:(L.maxx+.5)*L.cs;if(!L.caught&&!L.wdone){walkActor(wk,80,0,dt);if(wk.x>=W-14){wk.x=W-14;wk.moving=false;L.wdone=true;}}
      if(!L.caught&&!L.wdone&&(L.maxx+.5)*L.cs>=wk.x-4&&L.end<0){L.caught=true;wk.moving=false;L.wdone=true;}
      wk.y=y0+30;wk.flash=L.caught&&(((t*6)|0)&1);drawActor(u,W,H,wk,t,EM,1);});
    F.put();
    rows.innerHTML=LN.map((L,li)=>{const sp=L.speed!=null?L.speed:null,mean=hist[li].length?hist[li].reduce((a,b)=>a+b,0)/hist[li].length:null,ts=v=>v==null?'measuring':`${v.toFixed(1)} px/s · ${f2(v/32)} tiles/s`;
      const rep=REP[mat],repT=li===2?(SBXV[mat]!=null?`Sandbox ${f2(SBXV[mat])} tiles/s`:rep!=null?`report cap 1.0 tiles/s`:'not measured'):rep==null?'not in the report':li===0?`report ${(rep*32).toFixed(1)} px/s`:`report ${(rep*4).toFixed(1)} tiles/s`;
      const lab=['8 px cells, 4 Hz','32 px tiles, 4 Hz','32 px tiles, 1 Hz'][li],wk=L.caught?'<span class="bad">walker caught</span>':L.wdone?'walker escaped':'walking';
      return `<div class="${L.caught?'bad':li===2?'on':''}"><b>${lab}</b><span>${ts(sp)}${mean!=null&&hist[li].length>1?` · mean of ${hist[li].length} runs ${f2(mean/32)} tiles/s`:''}</span><em>${wk} · ${repT}</em></div>`;}).join('');}};});

// ======================================================================
// A3 field resolution: smoke at 4, 8 and 16 px cells or a light map at 32, 8
// and 4 px cells over one scene. Each panel builds its own field per frame.
// ======================================================================
reg('fieldres',root=>{const cvs=$$('canvas',root),PP=cvs.map(PX),c=ctl(root),ms=$$('[data-m]',root),tags=$$('[data-t]',root),ro=$('[data-ro]',root),W=144,H=96,EM=PP.map(()=>new Uint8Array(W*H));
  const G=mkGround(W,H,9,(x,y)=>vnoise(x/30+2,y/20)>.6),mt=[0,1,2].map(()=>meter(.05)),src=[[36,74],[102,62]];addCamp(G,36,74);
  let fld='smoke',t=0,hud=0;const SC=[4,8,16],LC=[32,8,4];
  const mkSm=cs=>{const fw=Math.ceil(W/cs),fh=Math.ceil(H/cs);return {cs,fw,fh,D:new Float32Array(fw*fh),T:new Float32Array(fw*fh)};};
  let SM=SC.map(mkSm);const LMs=LC.map(cs=>mkLight(W,H,cs));
  const smStep=(S,dt)=>{const {cs,fw,fh,D,T}=S;
    // emission: a disc of 7 px over each source, splatted by area so every field gets the same smoke
    for(const [sx,sy0] of src){const sy=sy0-18;for(let y=sy-7;y<=sy+7;y++)for(let x=sx-7;x<=sx+7;x++){if((x-sx)**2+(y-sy)**2>49||x<0||y<0||x>=W||y>=H)continue;D[((y/cs)|0)*fw+((x/cs)|0)]+=dt*2.4/(cs*cs);}}
    for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){const px=(x+.5)*cs,py=(y+.5)*cs,vx=9+Math.sin(py/14+t*1.3)*7,vy=-16;let bx=(px-vx*dt)/cs-.5,by=(py-vy*dt)/cs-.5;
      bx=clamp(bx,0,fw-1.001);by=clamp(by,0,fh-1.001);const xi=bx|0,yi=by|0,tx=bx-xi,ty=by-yi,i=yi*fw+xi,x1=Math.min(fw-1,xi+1)-xi,y1=(Math.min(fh-1,yi+1)-yi)*fw;
      T[y*fw+x]=((D[i]*(1-tx)+D[i+x1]*tx)*(1-ty)+(D[i+y1]*(1-tx)+D[i+y1+x1]*tx)*ty)*(1-dt*.32);}
    D.set(T);};
  const smAt=(S,x,y,bil)=>{const {cs,fw,fh,D}=S;if(!bil)return D[Math.min(fh-1,(y/cs)|0)*fw+Math.min(fw-1,(x/cs)|0)];const fx=clamp((x+.5)/cs-.5,0,fw-1.001),fy=clamp((y+.5)/cs-.5,0,fh-1.001),xi=fx|0,yi=fy|0,tx=fx-xi,ty=fy-yi,i=yi*fw+xi,x1=Math.min(fw-1,xi+1)-xi,y1=(Math.min(fh-1,yi+1)-yi)*fw;
    return (D[i]*(1-tx)+D[i+x1]*tx)*(1-ty)+(D[i+y1]*(1-tx)+D[i+y1+x1]*tx)*ty;};
  const R=k=>T6.smoke[k],Lr=k=>T6.light[k];
  const readout=()=>{if(fld==='smoke')ro.innerHTML=SC.map((cs,k)=>{const fw=640/cs,fh=Math.ceil(360/cs);return `<b>${cs} px cells</b>, ${fw}x${fh} = ${num(fw*fh)} cells, ${num(fw*fh)} bytes · advect, 1 channel ${R(1)[k+1]} ms · draw plumes ${R(2)[k+1]} ms`;}).join('<br>')+'<br><span class="mute">640x360 view, desktop / 6x throttle, our benchmark. The draw costs the same at every cell size.</span>';
    else ro.innerHTML=LC.map((cs,k)=>{const fw=640/cs,fh=Math.ceil(360/cs);return `<b>${cs} px cells</b>, ${fw}x${fh} = ${num(fw*fh)} cells, ${num(fw*fh)} bytes · build ${Lr(0)[k+1]} ms · apply nearest ${Lr(1)[k+1]} ms · bilinear ${Lr(3)[k+1]} ms`;}).join('<br>')+'<br><span class="mute">640x360 view, 30 sources, desktop / 6x throttle, our benchmark. The apply costs the same at every map size. The Sandbox as built builds its maps in 0.003, 0.03 and 0.12 ms at 32, 8 and 4 px.</span>';
    tags.forEach((g,k)=>g.textContent=fld==='smoke'?`Smoke, ${SC[k]} px cells`:`Light, ${LC[k]} px cells`);};
  c.seg('fld',v=>{fld=v;SM=SC.map(mkSm);readout();});readout();
  return {tick(dt){t+=dt;const bil=c.segv('samp')==='1',cells=c.segv('view')==='cells',fl=flick(t,0),fl2=flick(t,9);
    PP.forEach((P,k)=>{const u=P.u32,em=EM[k];mt[k].t0();
      for(let i=0;i<W*H;i++){u[i]=G.B[i];em[i]=0;}
      drawF(u,W,H,FLS.camp,ffr(FLS.camp,t,0),36,77,em);drawF(u,W,H,FLS.gl,ffr(FLS.gl,t,2),98,64,em);drawF(u,W,H,FLS.gs,ffr(FLS.gs,t,1),108,66,em);
      if(fld==='smoke'){const S=SM[k];smStep(S,dt);
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(em[i])continue;const d=cells?S.D[Math.min(S.fh-1,(y/S.cs)|0)*S.fw+Math.min(S.fw-1,(x/S.cs)|0)]:smAt(S,x,y,bil),thr=.16+G.MV[i]/255*.1;
          if(cells){if(d>.02)u[i]=mix32(u[i],SM3,clamp(d*1.4,0,.9));if(x%S.cs===0||y%S.cs===0)u[i]=mulc(u[i],.7,.7,.75);continue;}
          if(d<thr)continue;const m=d-thr;u[i]=m>.5?SM1:m>.18?SM2:SM3;}
        shadePass(u,em,W,H,DUSK,null);}
      else{const LM=LMs[k];LM.build([[36,66,70,fl],[103,56,52,.85*fl2],[124,30,34,.7]]);
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(em[i])continue;let L;if(bil&&!cells)L=LM.at(x,y);else{const lx=Math.min(LM.lw-1,(x/LM.cs)|0),ly=Math.min(LM.lh-1,(y/LM.cs)|0);L=LM.L[ly*LM.lw+lx];}
          if(cells){u[i]=NIGHT(u[i])[L>.62?2:L>.3?1:0];if(x%LM.cs===0||y%LM.cs===0)u[i]=mulc(u[i],.7,.7,.75);}else u[i]=NIGHT(u[i])[lband(L,x,y)];}
        drawPost(u,W,H,124,64);drawF(u,W,H,FLS.torch,ffr(FLS.torch,t,1),124,32,null);}
      P.put();mt[k].t1();});
    hud-=dt;if(hud<=0){hud=.4;ms.forEach((m,k)=>m.innerHTML=`<b>${fms(mt[k].v)} ms</b> build and draw here`);}}};});

// ======================================================================
// G1 frame cost: the measured frame medians, split by note 16's shares
// ======================================================================
reg('framecost',root=>{const bars=$('[data-bars]',root),c=ctl(root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const L=[['Light build + apply',44,2.8,'#ffb44a'],['Smoke',18,2.4,'#9fc7d6'],['Burn front',12,3.7,'#e8622c'],['Palette pass',10,3.9,'#c9a2ff'],['Drawn loops',6,3.3,'#fcca4c'],['putImageData',6,0,'#7a6252'],['Embers',1,1,'#ff8f7a'],['Ground copy',1,0,'#5c4334'],['Other',2,0,'#3b2a26']];
  const T=[['640x360, desktop',.624,'d640'],['640x360, 6x throttle',4.90,'t640'],['320x180, desktop',.206,'d320'],['320x180, 6x throttle',1.24,'t320']];
  // 640 desktop split from the shares; 320: known layers divided by their measured ratio, the rest takes the remainder
  const d640=L.map(l=>l[1]/100*.624),known=L.map((l,k)=>l[2]?d640[k]/l[2]:0),ks=known.reduce((a,b)=>a+b,0),restB=L.reduce((a,l,k)=>a+(l[2]?0:d640[k]),0),rk=(.206-ks)/restB;
  const d320=L.map((l,k)=>l[2]?known[k]:d640[k]*rk);
  const split={d640,t640:d640.map(v=>v/.624*4.9),d320,t320:d320.map(v=>v/.206*1.24)};
  leg.innerHTML=L.map(l=>`<span><i style="background:${l[3]}"></i>${l[0]}</span>`).join('');
  let sel=[0,0];
  const draw=()=>{const Z=+c.segv('zoom'),gpu=c.v('gpu');
    bars.innerHTML=T.map(([lab,tot,key],bi)=>{let x=0;const segs=split[key].map((v,k)=>{const w=v/Z*100,l=x;x+=w;if(l>=100)return '';return `<button type="button" class="fc-s${sel[0]===bi&&sel[1]===k?' on':''}" data-b="${bi}" data-k="${k}" style="left:${l}%;width:${Math.min(w,100-l)}%;background:${L[k][3]}" aria-label="${L[k][0]}, ${lab}, ${fms(v)} ms"></button>`;}).join('');
      const g=gpu&&(bi===0||bi===1)?`<i class="fc-gpu" style="width:${Math.min(100,(bi?1.6:.24)/Z*100)}%"></i>`:'';
      return `<div class="fc-row"><span class="fc-l">${lab}</span><div class="fc-t">${segs}${g}${Z>=16.7?`<i class="fc-16" style="left:${16.7/Z*100}%"></i>`:''}${tot>Z?'<b class="fc-over">→</b>':''}</div><span class="fc-v"><b>${fms(tot)} ms</b> ${Math.round(tot/16.7*100)}%</span></div>`;}).join('')+
      `<div class="fc-ax"><span>0</span><span>${Z>=16.7?'16.7 ms':Z+' ms'}</span></div>`;
    const [bi,k]=sel,v=split[T[bi][2]][k];ro.innerHTML=`<b>${L[k][0]}</b> · ${T[bi][0]} · ${fms(v)} ms, ${(v/T[bi][1]*100).toFixed(0)}% of the frame${bi===0?' (note 16 share)':' (derived split, see the caption)'}${gpu&&bi<2?` · shader path estimate for the whole frame ${bi?'1.6':'0.24'} ms`:''}`;};
  bars.addEventListener('click',e=>{const b=e.target.closest('.fc-s');if(!b)return;sel=[+b.dataset.b,+b.dataset.k];draw();});
  c.seg('zoom',draw);c.on('gpu',draw);draw();return {};});

// ======================================================================
// G2 uploads: bytes per whole-texture upload, and the fixed cost per upload
// ======================================================================
reg('uploads',root=>{const bars=$('[data-bars]',root),c=ctl(root),ro=$('[data-ro]',root);
  const up=k=>parseFloat(T6.upload[k][2]);
  // name, bytes, measured Metal wall ms or null, updates per second, where the rate comes from
  const F=[['Spread state, 20x12',240,null,4,'4 Hz tick'],['Burn progress, 20x12',240,null,4,'on events, up to 4 Hz'],['Smoke field, 80x45 R8',3600,up(1),4,'every tick'],['Light map, 80x45 R8',3600,null,10,'10 Hz flicker'],
    ['20 DOOM torches, one atlas',3840,null,30,'30 updates/s'],['DOOM buffer 128x96',12288,.016,30,'30 updates/s'],['DOOM atlas 128x128 R8',16384,null,30,'30 updates/s'],['Burn-order map 128x128',16384,null,0,'once'],
    ['DOOM band 640x120',76800,.024,60,'every frame'],['640x360 R8 field',230400,up(2),60,'every frame'],['Final frame 640x360 RGBA8',921600,up(3),60,'60 fps']];
  const TG=n=>`<span class="cite"><b class="tag ti">I</b> ${n}</span>`,FIX=.015,lg=v=>Math.log10(Math.max(1,v)),LMAX=lg(921600*60),LMIN=lg(100);
  const draw=()=>{const sec=c.segv('rate')==='sec';
    bars.innerHTML=F.map(([n,b,m,r,why])=>{const msv=m!=null?m:Math.max(FIX,FIX+b/921600*.076),bb=sec?b*r:b,mm=sec?msv*r:msv,top=sec?LMAX:lg(921600);
      const bw=clamp((lg(bb)-LMIN)/(top-LMIN)*100,1,100),mw=clamp(mm/(sec?5.6:.093)*100,1,100);
      return `<div class="fl-row"><span class="fl-n">${n}</span><div class="fl-b"><i class="here" style="width:${bb?bw:0}%"></i><i class="ref${m==null?' est':''}" style="width:${sec&&!r?0:mw}%"></i></div><span class="fl-v">${sec?(r?`${num(bb)} B/s · ${fms(mm)} ms/s · ${why}`:'uploaded once'):`${num(b)} B · ${m!=null?fms(m)+' ms measured':'about '+fms(msv)+' ms'}`}</span></div>`;}).join('');
    ro.innerHTML=sec?'At 60 fps the final frame moves 55.3 MB/s. A 128x128 R8 atlas at 30 updates per second moves 492 KB/s '+TG('note 12')+'. Each field pays the fixed 0.015 ms once per update, so the update rate matters more than the size for anything under 15 KB.':'An empty upload with a 1 px draw costs 0.00033 ms. Any upload costs about 0.015 ms more than that, so 240 bytes and 3,600 bytes cost the same. The 921,600-byte frame costs 0.091 ms on the Metal run and 0.095 ms on SwiftShader '+TG('note 16, measured')+'.';};
  c.seg('rate',draw);draw();return {};});

// ======================================================================
// G4 lights: N torches on one ground item, PointLight2D's 15 per item against a baked 8 px map
// ======================================================================
reg('lights',root=>{const cvs=$$('canvas',root),PA=PX(cvs[0]),PB=PX(cvs[1]),c=ctl(root),ms=$$('[data-m]',root),ro=$('[data-ro]',root),W=160,H=96,EA=new Uint8Array(W*H),EB=new Uint8Array(W*H);
  const G=mkGround(W,H,11),LM=mkLight(W,H,8),mA=meter(.05),mB=meter(.05),pts=[];
  for(let k=0;k<200&&pts.length<40;k++){const x=10+hash2(k,3)*140|0,y=40+hash2(k,7)*54|0;if(pts.every(p=>Math.hypot(p[0]-x,(p[1]-y)*1.4)>17))pts.push([x,y]);}
  let t=0,hud=0;const SH=NIGHT;
  return {tick(dt){t+=dt;const n=c.v('n');c.out('n',n);const src=pts.slice(0,n).map((p,k)=>[p[0],p[1]-30,40,.95*flick(t,k*5)]);
    // PointLight2D: smooth additive pools from the first 15 lights only
    mA.t0();const on=src.slice(0,15),UA=PA.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let L=0;for(const s of on){const dx=x-s[0],dy=(y-s[1]-24)*1.25,q=1-(dx*dx+dy*dy)/(s[2]*s[2]);if(q>0)L+=s[3]*q*q;}
      const cl=SH(G.B[i]),a=Math.min(1,L);UA[i]=a>0?mix32(cl[0],cl[2],a):cl[0];EA[i]=0;}
    mA.t1();
    mB.t0();LM.build(src.map(s=>[s[0],s[1]+24,s[2],s[3]]));const UB=PB.u32;for(let i=0;i<W*H;i++){UB[i]=G.B[i];EB[i]=0;}shadePass(UB,EB,W,H,SH,LM);mB.t1();
    pts.slice(0,n).forEach((p,k)=>{for(const [u,em] of [[UA,EA],[UB,EB]]){const f=drawPost(u,W,H,p[0],p[1]);drawF(u,W,H,FLS.torch,ffr(FLS.torch,t,k),f[0],f[1],em);}
      if(k>=15){for(let y=p[1]-34;y<p[1]-30;y++)for(let x=p[0]-1;x<=p[0]+1;x++)put(UA,W,H,x,y,RD2);}});
    PA.put();PB.put();hud-=dt;
    if(hud<=0){hud=.3;ms[0].innerHTML=`<b>${fms(mA.v)} ms</b> here, ${Math.min(n,15)} lights summed per pixel`;ms[1].innerHTML=`<b>${fms(mB.v)} ms</b> here, ${n} sources into ${LM.lw*LM.lh} cells`;
      ro.innerHTML=`<b>Lights on the ground item:</b> ${Math.min(n,15)} of ${n}${n>15?` · <span class="bad">${n-15} fires light nothing</span> (red mark)`:''} · a render holds 256, or 64 on small uniform buffers<br><b>Baked map:</b> ${n} of ${n} · ${LM.lw*LM.lh} cells for this strip · 80x45 = 3,600 bytes for a 640x360 view, one upload when its input changes`;}}};});

// ======================================================================
// H1 ping-pong: the DOOM fire in place (Sanglard's loop, section 7) against
// a gather from buffer A into buffer B that swaps every frame
// ======================================================================
const DOOMP=['070707','1f0707','2f0f07','470f07','571707','671f07','771f07','8f2707','9f2f07','af3f07','bf4707','c74707','df4f07','df5707','df5707','d75f07','d75f07','d7670f','cf6f0f','cf770f','cf7f0f','cf8717','c78717','c78f17','c7971f','bf9f1f','bf9f1f','bfa727','bfa727','bfaf2f','b7af2f','b7b72f','b7b737','cfcf6f','dfdf9f','efefc7','ffffff'].map(h=>U('#'+h));
// 5 tones in unequal bands plus the purple edge, for a fire whose source sits at L = 36
const TONE36=new Uint8Array(37);for(let h=0;h<37;h++)TONE36[h]=h<4?0:h<8?6:h<13?1:h<19?2:h<26?3:h<32?4:5;
reg('pingpong',root=>{const cvs=$$('canvas',root),P0=PX(cvs[0]),P1=PX(cvs[1]),AB=[PX(cvs[2]),PX(cvs[3])],c=ctl(root),ms=$$('[data-m]',root),kv=$('[data-kv]',root),abp=$('[data-ab]',root),W=64,H=128,L=36;
  const IP=new Uint8Array(W*H),BA_=new Uint8Array(W*H),BB=new Uint8Array(W*H),R6=[0,1,1,2,2,3],m0=meter(.05),m1=meter(.05);let cur=0,frame=0,acc=0,hud=0;
  for(let x=0;x<W;x++){IP[(H-1)*W+x]=L;BA_[(H-1)*W+x]=L;BB[(H-1)*W+x]=L;}
  const RQ=new Int32Array([987654321]),rq=()=>{let r=RQ[0];r^=r<<13;r^=r>>>17;r^=r<<5;RQ[0]=r;return r>>>0;};
  // both buffers wrap at the left and right edges, as note 12's script did, so the edges do not eat the flame
  const stepIP=()=>{for(let x=0;x<W;x++)for(let y=1;y<H;y++){const src=y*W+x,p=IP[src];if(p===0)IP[src-W]=0;else{const r=R6[rq()%6];IP[(y-1)*W+((x-r+1+W)%W)]=p-(r&1);}}};
  // gather: o = -1 (1/6, no loss), 0 (1/3, loses 1), 1 (1/3, no loss), 2 (1/6, loses 1), the scatter's odds seen from the pixel that receives
  const GO=[-1,0,0,1,1,2],GD=[0,1,1,0,0,1];
  const stepG=(A,B)=>{for(let y=0;y<H-1;y++)for(let x=0;x<W;x++){const r=hashI(x,y,frame,3)%6,v=A[(y+1)*W+((x+GO[r]+W)%W)]-GD[r];B[y*W+x]=v>0?v:0;}};
  // the height measure: the first row above the source whose lit fraction, averaged over time, is under one half
  const VA=new Float32Array(H),VB=new Float32Array(H);
  const halfRow=(buf,V)=>{for(let y=0;y<H;y++){let c2=0;for(let x=0;x<W;x++)if(buf[y*W+x])c2++;const i=H-1-y;V[i]+=(c2/W-V[i])*.03;}for(let i=1;i<H;i++)if(V[i]<.5)return i;return H;};
  const draw=(P,buf,raw,line,hh)=>{const u=P.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let col=U('#0d0807');
      if(raw)col=buf[i]?DOOMP[buf[i]]:col;else if(y>0&&y<H-1){const xl=(x+W-1)%W,xr=(x+1)%W,s=buf[(y-1)*W+xl]+buf[i-W]+buf[(y-1)*W+xr]+buf[y*W+xl]+buf[i]+buf[y*W+xr]+buf[(y+1)*W+xl]+buf[i+W]+buf[(y+1)*W+xr],tn=TONE36[(s*57)>>9];if(tn)col=FT[tn];}u[i]=col;}
    if(line){const y=H-1-hh;for(let x=0;x<W;x+=2)put(u,W,H,x,y,WHITE);}P.put();};
  const thumb=(P,buf,on)=>{const u=P.u32;for(let y=0;y<32;y++)for(let x=0;x<16;x++){const v=buf[(y*4+3)*W+x*4+2];u[y*16+x]=v?DOOMP[v]:(on?U('#2e1d14'):U('#0d0807'));}P.put();};
  return {tick(dt){acc+=dt;if(acc>1/30){acc=0;frame++;
      m0.t0();stepIP();m0.t1();const A=cur?BB:BA_,B=cur?BA_:BB;m1.t0();stepG(A,B);m1.t1();
      const ha=halfRow(IP,VA),hb=halfRow(B,VB);
      const raw=c.segv('draw')==='37',line=c.v('line');draw(P0,IP,raw,line,ha);draw(P1,B,raw,line,hb);
      thumb(AB[0],BA_,!cur);thumb(AB[1],BB,!!cur);cvs[2].classList.toggle('on',cur===0);cvs[3].classList.toggle('on',cur===1);
      abp.innerHTML=`Frame ${frame}: read <b>${cur?'B':'A'}</b>, write <b>${cur?'A':'B'}</b>`;cur^=1;
      hud-=1/30;if(hud<=0){hud=.4;ms[0].innerHTML=`half lit at <b>${ha} rows</b> · ${fms(m0.v)} ms`;ms[1].innerHTML=`half lit at <b>${hb} rows</b> · ${fms(m1.v)} ms`;
        kv.innerHTML=`<dt>Buffer</dt><dd>${W}x${H}, ${num(W*H)} cells each</dd><dt>In place, here</dt><dd><b>${ha}</b> rows, report 95</dd><dt>Gather, here</dt><dd><b>${hb}</b> rows, report 71</dd><dt>Double-buffered copy</dt><dd>report 73</dd><dt>GPU memory</dt><dd>a 128x128 RGBA8 buffer is 65,536 bytes, no CPU upload</dd>`;}}}};});

// ======================================================================
// H2 mask seed: a buffer fire seeded from the burning part of a roof and a
// tree crown, cooled by a painted, scrolling 32x64 map
// ======================================================================
reg('maskseed',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,CM=PX($$('canvas',root)[1]),c=ctl(root),kv=$('[data-kv]',root),W=160,H=96,N=W*H;
  const G=mkGround(W,H,13),BG=new Uint32Array(N),KIND=new Uint8Array(N),HT=new Float32Array(N),H2=new Float32Array(N),EM=new Uint8Array(N),seedM=new Uint8Array(N),mt=meter(.05);
  for(let i=0;i<N;i++)BG[i]=G.B[i];
  // the house: a gable roof 76 px wide seen from the south, plank walls, a door and a window. KIND 1 roof, 2 ridge, 3 crown
  const hx0=10,hx1=86,ry0=26,ry1=54,wy1=86;
  for(let y=ry0;y<=wy1;y++)for(let x=hx0;x<=hx1;x++){const i=y*W+x;
    if(y<=ry1){const inset=Math.round((ry1-y)*.28);if(x<hx0+inset||x>hx1-inset)continue;const ry=y-ry0,q=ry%6,ci=(ry/6)|0;let col=q===5?R0:R2;if(q<5&&((x+(ci&1)*5)%10)===0)col=R1;if(q===0&&hash2(x>>2,ci)<.5)col=R3;if(x>hx1-inset-6&&col===R2)col=R1;
      if(ry<3)col=ry===0?R3:ry===1?R2:R0;BG[i]=col;KIND[i]=ry<3?2:1;}
    else if(x>=hx0+5&&x<=hx1-5){const wy=y-ry1,b=wy%6;let col=b===0?W3:b===5?W0:W2;if(wy<3)col=W0;if(x>=40&&x<=54&&y>=66){col=(x===40||x===54||y===66)?W0:((x-40)%5===2?W1:W2);}
      if(x>=62&&x<=76&&y>=62&&y<=74){col=(x===62||x===76||y===62||y===74||x===69||y===68)?W1:(x+y>140?WIN_D:WIN);}if(y>=wy1-1)col=S2;BG[i]=col;}}
  // the pine (the Sandbox's tiered pine, smaller): trunk at x 124, foot at y 88
  {const cx=124,hc=58,nT=4,yb=[],ya=[],hws=[],hw=18,y0=88-hc-6;for(let k=0;k<nT;k++){yb[k]=Math.round(hc-k*hc*.215)+2;hws[k]=hw*(1-k*.2);ya[k]=k===nT-1?2:Math.round(yb[k]-hc*.44);}
    const tooth=(x,k)=>[0,1,2,3,2,1][(((x+k*3)%6)+6)%6],inT=(k,x,y)=>{if(y<ya[k])return false;const uu=Math.abs(x-cx+.5),f=(y-ya[k])/(yb[k]-ya[k]);if(f>1.25)return false;const w=hws[k]*Math.pow(Math.min(1,f),.8)+.6;if(uu>w)return false;return y<=yb[k]-tooth(x,k)+Math.round(uu/hws[k]*2.2);};
    for(let y=hc;y<=hc+8;y++)for(let x=cx-3;x<=cx+2;x++)BG[(y0+y)*W+x]=x<cx-1?W3:x<cx+1?W2:W1;
    for(let k=0;k<nT;k++)for(let y=ya[k];y<=yb[k]+4;y++)for(let x=cx-hw-2;x<=cx+hw+2;x++){if(!inT(k,x,y))continue;const uu=(x-cx+.5)/hws[k],fr=!inT(k,x,y+2);let col=uu<-.3?(hash2(x>>1,(y>>1)+k*7)<.42?P3:P2):uu<.28?P2:P1;if(fr)col=uu<0?P1:P0;const i=(y0+y)*W+x;BG[i]=col;KIND[i]=3;}}
  // 1 px outlines around both sprites
  {const add=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(KIND[i]||(BG[i]!==G.B[i]))continue;const o=j=>KIND[j]||BG[j]!==G.B[j];if(o(i-1)||o(i+1)||o(i-W)||o(i+W))add.push(i);}for(const i of add)BG[i]=OUTL;}
  // the painted cooling map: smooth noise with three dark channels that wander a little, tileable in x (32) and y (64)
  const CMAP=new Float32Array(2048);for(let y=0;y<64;y++)for(let x=0;x<32;x++){let v=3.2+vnoiseT(x/8,y/8,4)*4.5;for(const cx0 of [5,15,26]){const cx=cx0+Math.sin(y/64*6.283*2+cx0)*1.6,d=Math.min(Math.abs(x-cx),32-Math.abs(x-cx));v-=Math.max(0,3.4-d*1.3);}CMAP[y*32+x]=Math.max(.3,v);}
  {const cu=CM.u32;for(let i=0;i<2048;i++){const g=clamp(255-CMAP[i]*26,0,255);cu[i]=pack(g*.42+20,g*.22+12,g*.18+10);}CM.put();}
  let seed='roof',scroll=0,lone=0,hud=0,t=0;const CK=2.1;
  const setSeed=()=>{seedM.fill(0);const top=new Int16Array(W).fill(-1);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=KIND[y*W+x];const roof=k===1||k===2,crown=k===3;
      if((seed==='ridge'&&k===2)||((seed==="roof"||seed==="both")&&roof&&G.MV[y*W+x]<34)||((seed==='crown'||seed==='both')&&crown&&G.MV[y*W+x]<56))seedM[y*W+x]=1;}
    for(let x=0;x<W;x++)for(let y=0;y<H;y++){const k=KIND[y*W+x];if(!k)continue;if((seed==='ridge'||seed==='roof'||seed==='both')&&k===2)seedM[y*W+x]=1;break;}
    HT.fill(0);};
  c.seg('seed',v=>{seed=v;setSeed();});setSeed();
  return {tick(dt){t+=dt;scroll+=dt*36;const paint=c.segv('cool')==='paint',sc=scroll|0;mt.t0();
    for(let i=0;i<N;i++)if(seedM[i])HT[i]=paint?250:200+rnd1()*55;
    for(let y=0;y<H-2;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(seedM[i])continue;const cool=paint?CMAP[(((y+sc)&63)<<5)|(x&31)]*CK:rnd1()*7.4*CK;const v=(HT[i+W-1]+HT[i+W]+HT[i+W+1]+HT[i+2*W])*.2475-cool;H2[i]=v>0?v:0;}
    for(let y=0;y<H-2;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!seedM[i])HT[i]=H2[i];}
    const ms=mt.t1();let lit=0,lon=0;
    for(let i=0;i<N;i++){let col=BG[i];EM[i]=0;const k=KIND[i];if(seedM[i]&&k)col=G.MV[i]<40?C1:col===OUTL?C0:mulc(col,.62,.5,.5);u[i]=col;}
    const tn=new Uint8Array(N);for(let i=0;i<N;i++){const h=HT[i];tn[i]=h<40?0:h<62?6:h<95?1:h<135?2:h<180?3:h<225?4:5;}
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,v=tn[i];if(!v)continue;u[i]=FT[v];EM[i]=1;lit++;if(tn[i-1]!==v&&tn[i+1]!==v&&tn[i-W]!==v&&tn[i+W]!==v)lon++;}
    lone=lone*.9+(lit?lon/lit:0)*.1;shadePass(u,EM,W,H,DUSK,null);F.put();hud-=dt;
    if(hud<=0){hud=.4;setHud(root,`buffer ${fms(ms)} ms · ${num(N)} cells`);let ns=0;for(let i=0;i<N;i++)ns+=seedM[i];
      kv.innerHTML=`<dt>Seed pixels</dt><dd>${ns}</dd><dt>Lit pixels</dt><dd>${lit}</dd><dt>Lone pixels</dt><dd><b>${(lone*100).toFixed(1)}%</b> here, 0.1% in note 12's averaged sim</dd><dt>Cooling map</dt><dd>2,048 cells, one read per pixel</dd>`;
      $('[data-cm]',root).textContent=paint?'in use':'not used';}}};});

// ======================================================================
// 6b convert: the conversion table, VFX #6 value against the 32 px value, coloured by what it follows
// ======================================================================
reg('convert',root=>{const list=$('[data-list]',root),chips=$('[data-chips]',root),c=ctl(root);
  const KC={'Tile':'#ffb44a','Roll':'#fcca4c','Character':'#c9a2ff','Pixel rule':'#ff8f7a','Field cells':'#9fc7d6','Constant':'#b8a696','Crowd':'#6dd4c3','Screen':'#e8622c'};
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;'),md=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>');
  const kinds=Object.keys(KC);let filt=null;
  chips.innerHTML='<button type="button" class="on" data-f="">All '+T6['6b'].length+'</button>'+kinds.map(k=>`<button type="button" data-f="${k}"><i style="background:${KC[k]}"></i>${k}</button>`).join('');
  const draw=()=>{const big=c.segv('cs')==='32';
    list.innerHTML=T6['6b'].map(([a,b,f,n])=>{const ks=f.split(' / ').map(s=>s.trim());if(filt&&!ks.includes(filt))return '';const col=KC[ks[0]]||'#b8a696',col2=KC[ks[1]]||col;
      return `<div class="cv" style="--c:${col};--c2:${col2}"><div class="cv-v">${md(big?b:a)}</div><div class="cv-o"><span>${big?'VFX #6':'At 32 px'}</span> ${md(big?a:b)}</div><div class="cv-f"><span class="cv-k">${esc(f)}</span><span class="cv-n">${esc(n.replace(/^\[|\]$/g,''))}</span></div></div>`;}).join('');};
  chips.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;filt=b.dataset.f||null;$$('button',chips).forEach(x=>x.classList.toggle('on',x===b));draw();});
  c.seg('cs',draw);draw();return {};});

// ======================================================================
// 6d spread speed: the games of section 6d on a log axis of tiles per second
// ======================================================================
reg('spreadspeed',root=>{const svg=$('svg',root),ro=$('[data-ro]',root),nar=(svg.clientWidth||720)<560,VW=nar?380:720,X0=nar?128:262,X1=VW-20,LO=.01,HI=20,Y0=50,RH=30,CUT=nar?16:36,FS=nar?11:12;
  const X=v=>X0+(Math.log10(v)-Math.log10(LO))/(Math.log10(HI)-Math.log10(LO))*(X1-X0);
  const rows=T6['6d'].map(r=>{const s=r[2];let lo=null,hi=null,pt=null,dir=0;const m=s.match(/(\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)/);
    if(m){lo=+m[1];hi=+m[2];}else if(/at most/.test(s)){hi=+s.match(/(\d+(?:\.\d+)?)/)[1];dir=-1;}else if(/more than/.test(s)){lo=+s.match(/(\d+(?:\.\d+)?)/)[1];dir=1;}
    else{const a=s.match(/about (\d+(?:\.\d+)?)/g),all=(s.match(/\d+\.\d+|\d+/g)||[]).map(Number);if(a)pt=+a[a.length-1].replace('about ','');else if(all.length>1){lo=Math.min(...all);hi=Math.max(...all);}else if(all.length)pt=all[0];}
    const unit=/cells per turn/.test(s)?'cells per turn':/m\/s/.test(s)?'m/s':'';return {g:r[0],rule:r[1],s,vs:r[3],src:r[4],lo,hi,pt,dir,unit};});
  const H=Y0+rows.length*RH+(nar?56:40);svg.setAttribute('viewBox',`0 0 ${VW} ${H}`);
  const band=(a,b,lab,col,ly)=>{svgEl('rect',{x:X(a),y:Y0-8,width:X(b)-X(a),height:rows.length*RH+4,fill:col,opacity:.13},svg);svgText(svg,(X(a)+X(b))/2,Y0-ly,lab,{'text-anchor':'middle',class:'lab','font-size':11});};
  band(.08,.12,'creep','#b8a696',28);band(.3,.5,'green grass','#5c9845',14);band(.8,1,'brush, oil','#ffb44a',28);band(2.5,HI,'scripted only','#e8622c',14);
  for(const v of nar?[.01,.1,1,10]:[.01,.03,.1,.3,1,3,10]){svgEl('line',{x1:X(v),y1:Y0-6,x2:X(v),y2:Y0+rows.length*RH,class:'gl'},svg);svgText(svg,X(v),Y0+rows.length*RH+16,String(v),{'text-anchor':'middle'});}
  svgText(svg,X1,Y0+rows.length*RH+32,'tiles per second, log scale',{'text-anchor':'end'});
  svgEl('line',{x1:X(1),y1:Y0-6,x2:X(1),y2:Y0+rows.length*RH,stroke:'#ffb44a','stroke-width':1.5,'stroke-dasharray':'4 3'},svg);
  svgEl('line',{x1:X(2.5),y1:Y0-6,x2:X(2.5),y2:Y0+rows.length*RH,stroke:'#f3e9df','stroke-width':1.5},svg);
  svgText(svg,nar?4:X0,Y0+rows.length*RH+(nar?48:32),'dashed: the 1 Hz cap · solid: a 2.5 tiles/s walk',{class:'w','font-size':11});
  const gs=[];
  rows.forEach((r,k)=>{const y=Y0+k*RH+RH/2,g=svgEl('g',{class:'pt sp-row',tabindex:0,role:'button','aria-label':`${r.g}, ${r.s}`},svg);gs.push(g);
    svgEl('rect',{x:0,y:y-RH/2+1,width:VW,height:RH-2,fill:'transparent'},g);
    svgEl('title',{},g).textContent=r.g;svgText(g,X0-8,y+4,r.g.length>CUT?r.g.slice(0,CUT-1)+'…':r.g,{'text-anchor':'end',class:'lab','font-size':FS});
    const ast=/Asterion/.test(r.g),col=ast?'#ffb44a':/VFX #6/.test(r.g)?'#e8622c':r.unit?'#7a6252':'#9fc7d6';
    if(r.lo!=null&&r.hi!=null)svgEl('rect',{x:X(r.lo),y:y-6,width:Math.max(3,X(r.hi)-X(r.lo)),height:12,rx:2,fill:col},g);
    else if(r.dir<0){svgEl('line',{x1:X(r.hi),y1:y,x2:X(r.hi)-40,y2:y,stroke:col,'stroke-width':3},g);svgEl('circle',{cx:X(r.hi),cy:y,r:5,fill:col},g);svgText(g,X(r.hi)-44,y+4,'at most',{'text-anchor':'end','font-size':11});}
    else if(r.dir>0){const x=Math.min(X(r.lo),X1-30);svgEl('line',{x1:x,y1:y,x2:X1,y2:y,stroke:col,'stroke-width':3},g);svgEl('polygon',{points:`${X1},${y-5} ${X1+8},${y} ${X1},${y+5}`,fill:col},g);svgEl('circle',{cx:x,cy:y,r:4,fill:col},g);}
    else if(r.pt!=null)svgEl('circle',{cx:X(r.pt),cy:y,r:5.5,fill:col},g);
    if(r.unit){const ux=r.dir>0?Math.min(X(r.lo),X1-30)-8:X(r.hi!=null?r.hi:r.pt)+8;svgText(g,ux,y+4,r.unit,{'text-anchor':r.dir>0?'end':'start','font-size':10.5,class:'c'});}});
  const show=k=>{const r=rows[k];gs.forEach((g,j)=>g.classList.toggle('on',j===k));ro.innerHTML=`<b>${r.g}</b> · ${r.rule} · <b>${r.s}</b> · against a 2.5 tiles/s walk: ${r.vs} · <span class="cite">${r.src.replace(/^\[|\]$/g,'')}</span>`;};
  gs.forEach((g,k)=>{g.addEventListener('click',()=>show(k));g.addEventListener('focus',()=>show(k));});show(rows.findIndex(r=>/Asterion/.test(r.g)));return {};});
}
