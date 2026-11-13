// ======================================================================
// demos2 (Agent F): the coverage look at 32 px (B1 to B5), objects (C1, C2)
// and falling snow (E1 to E4, 6d). Figures: bayer32, artmap, maskblend,
// overlay, edgeshade, caps, artmask, flakesize, tiledcell, zflakes,
// flakemotion. Everything lives inside one block, so no name here can clash
// with core.js or the other demos files. From core.js it uses only $, $$,
// clamp, pack, U, mix32, PX, pointer, ctl, setHud, svgEl, svgText and reg.
// The art is a copy of sandbox.html: palette, snow ramp, grass tiles, the art
// threshold map, banded edge shading, roof, pine and rock stamps with their
// cap thresholds, the 24x32 character and the flake code. Numbers match
// notes/SANDBOX-SPEC.md, "As built".
// ======================================================================
{
// ---------- palette (the sandbox's base colours) ----------
const HEX={OUTL:'#1e1a2e',GR_X:'#22382f',GR_D:'#2d4b3d',GR_A:'#3a5d47',GR_B:'#4a704d',GR_T:'#6b8f57',FLW:'#e3d6a2',
  DIRT_D:'#4b382f',DIRT_A:'#6b5343',DIRT_B:'#7e6650',DIRT_L:'#987e62',
  SN_HI:'#f2f1ec',SN_BASE:'#cbd3dc',SN_MID:'#9eabb8',SN_SH:'#7d7a96',SN_DEEP:'#5a5674',SN_PACK:'#a6b1c0',SN_PSH:'#7b8199',SN_PDK:'#575b76',SPARK:'#ffffff',
  ROOF_L:'#b65e4a',ROOF_A:'#934242',ROOF_B:'#71303a',ROOF_D:'#4c2031',WALL_L:'#b48d60',WALL_A:'#93704c',WALL_B:'#76573d',WALL_D:'#513b2d',DOOR_A:'#6b4631',
  WIN:'#7c9cbc',WIN_D:'#566f96',ICE_C:'#c6dcec',ROCK_L:'#abafba',ROCK_A:'#888d9b',ROCK_B:'#676c7e',ROCK_C:'#484c61',
  CAN_L:'#4c8c5c',CAN_A:'#2f6e52',CAN_B:'#235742',CAN_D:'#173c35',TRUNK:'#5f402d',TRUNK_D:'#402b23',LAMP_P:'#2e2c3b',
  HAT:'#c8443c',HAT_L:'#e2695a',HAT_D:'#8d2b38',HATB:'#eee6dc',HATB_D:'#c4bcc2',SKIN:'#f0c09a',SKIN_D:'#cd9072',
  SCARF:'#f2c14e',SCARF_D:'#c18a35',COAT:'#3c6fb4',COAT_L:'#5b90d1',COAT_D:'#2a4c85',LEG:'#3a3c54',LEG_D:'#2a2b40',
  V_HAT:'#7b5737',V_COAT:'#4f7a3a',V_COAT_L:'#6d9b4d',V_COAT_D:'#365930',FLAKE_M:'#dfe6f2',FLAKE_F:'#b4c1d8',GOLD:'#ffb86b'};
const K={};for(const k in HEX)K[k]=U(HEX[k]);
const {OUTL,GR_X,GR_D,GR_A,GR_B,GR_T,FLW,DIRT_D,DIRT_A,DIRT_B,DIRT_L,SN_HI,SN_BASE,SN_MID,SN_SH,SN_PACK,SN_PSH,SN_PDK,SPARK,
  ROOF_L,ROOF_A,ROOF_B,ROOF_D,WALL_L,WALL_A,WALL_B,WALL_D,DOOR_A,WIN,WIN_D,ICE_C,ROCK_L,ROCK_A,ROCK_B,ROCK_C,
  CAN_L,CAN_A,CAN_B,CAN_D,TRUNK,TRUNK_D,LAMP_P,SCARF,SCARF_D,FLAKE_M,FLAKE_F,GOLD}=K;
const ROOF=3,CANOPY=4,ROCKTOP=5,FENCETOP=6,SOLID=9;

// ---------- hash, noise, dither, colour versions ----------
const h2=(x,y)=>{let h=Math.imul(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return((h^(h>>>16))>>>0)/4294967296;};
const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=h2(xi,yi),b=h2(xi+1,yi),c=h2(xi,yi+1),d=h2(xi+1,yi+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],BAY2=[0,2,3,1];
const bay4=(x,y)=>BAY[(y&3)*4+(x&3)],bay8=(x,y)=>4*BAY[(y&3)*4+(x&3)]+BAY2[((y>>2)&1)*2+((x>>2)&1)];
// frost and sun-shadow versions of a colour, the sandbox's palette versions 4 and 1
const frost=c=>pack((c&255)*.74+49.4,(c>>>8&255)*.74+54.1,(c>>>16&255)*.74+58.8);
const shad=c=>pack((c&255)*.7,(c>>>8&255)*.74,(c>>>16&255)*.9+10);
const dim=(c,k)=>pack((c&255)*k,(c>>>8&255)*k,(c>>>16&255)*k);
// late afternoon: the background is tinted once. Flakes keep their own colours, so the three layers stay three ramp steps apart
const dusk=c=>c?pack((c&255)*.6,(c>>>8&255)*.67,(c>>>16&255)*.88+6):0;
const duskAll=a=>{for(let i=0;i<a.length;i++)a[i]=dusk(a[i]);return a;};
const scal=x=>{const q=Math.floor(x/3)*3;return .5+.3*Math.sin(q*.21)+.2*Math.sin(q*.083+1.3);};
const ms=v=>v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);
const HEAT=new Uint32Array(256);for(let i=0;i<256;i++){const t=i/255;HEAT[i]=t<.5?pack(20+t*80,24+t*300,60+t*340):pack(60+(t-.5)*390,174+(t-.5)*162,230+(t-.5)*50);}

// ---------- ground: 6 grass tiles of 32x32 picked by a position hash, over a slow noise of three greens ----------
const TUFTS=[["l...l",".l.l.",".lml.",".xmx."],["l.l",".l.",".x."],[".l...l.","l.l.l.l",".lmlml.","..xmx.."],["l..",".ll",".mx"],["..l..","l.l.l",".lml.",".xmx."]];
const GT=[],GTK=[];
for(let v=0;v<6;v++){const t=new Uint32Array(1024),k=new Uint8Array(1024);
  for(let gy=0;gy<3;gy++)for(let gx=0;gx<3;gx++){if(h2(v*31+gx*7+1,gy*13+v*5+2)<.34)continue;
    const T=TUFTS[(h2(gx+v*3,gy+9+v)*TUFTS.length)|0],tw=T[0].length,th=T.length;
    const x0=2+gx*10+((h2(gx*5+v,gy*3+1)*(11-tw))|0),y0=2+gy*10+((h2(gx+11,gy*7+v)*(11-th))|0);
    for(let r=0;r<th;r++)for(let c=0;c<tw;c++){const ch=T[r][c];if(ch==='.')continue;const px=x0+c,py=y0+r;if(px>31||py>31)continue;t[py*32+px]=ch==='l'?GR_T:ch==='m'?GR_B:GR_X;k[py*32+px]=1;}}
  for(let n=0;n<3;n++){const x=3+((h2(v+n*9,77)*24)|0),y=3+((h2(v*3+n,91)*24)|0);if(!t[y*32+x]&&!t[y*32+x+1]){t[y*32+x]=GR_D;t[y*32+x+1]=GR_D;if(n===0)t[(y+1)*32+x+1]=GR_D;}}
  if(v===2||v===5){const x=6+((h2(v,5)*18)|0),y=6+((h2(v,6)*18)|0);if(!k[y*32+x]){t[y*32+x]=FLW;t[y*32+x+1]=FLW;t[(y+1)*32+x]=FLW;t[(y+1)*32+x+1]=SCARF_D;k[y*32+x]=k[y*32+x+1]=k[(y+1)*32+x]=k[(y+1)*32+x+1]=1;}}
  if(v===3){const x=5+((h2(v,8)*18)|0),y=5+((h2(v,9)*18)|0);if(!k[y*32+x]){t[y*32+x]=ROCK_A;t[y*32+x+1]=ROCK_L;t[y*32+x+2]=ROCK_A;t[(y+1)*32+x]=ROCK_C;t[(y+1)*32+x+1]=ROCK_B;t[(y+1)*32+x+2]=ROCK_C;}}
  GT.push(t);GTK.push(k);}
// a ground of W x H art px. (ox, oy) is its place in the world, so two figures do not show the same tiles. S: 0 grass, 1 path, 2 flagstones
function ground(W,H,ox=0,oy=0){const B=new Uint32Array(W*H),TK=new Uint8Array(W*H),S=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=x+ox,Y=y+oy,i=y*W+x,n=vn(X/52,Y/44)*.6+vn(X/19,Y/16)*.4;let b=n<.37?GR_D:n>.64?GR_B:GR_A;
    const v=(h2((X>>5)+3,(Y>>5)+7)*6)|0,ti=(Y&31)*32+(X&31),tv=GT[v][ti];if(tv)b=tv;TK[i]=GTK[v][ti];B[i]=b;}
  return {W,H,ox,oy,B,TK,S};}
function addPath(G,inP){const {W,H,B,TK,S}=G;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(inP(x,y)){const i=y*W+x;S[i]=1;TK[i]=0;let b=vn(x/9,y/7)>.6?DIRT_B:DIRT_A;
    if(!inP(x,y-1)||!inP(x-1,y)||!inP(x,y-2))b=DIRT_D;else if(!inP(x,y+1)||!inP(x+1,y))b=DIRT_B;B[i]=b;}
  for(let gy=0;gy<H;gy+=12)for(let gx=0;gx<W;gx+=14){if(h2(gx,gy)<.55)continue;const x=gx+2+((h2(gx+1,gy)*8)|0),y=gy+2+((h2(gx,gy+1)*6)|0);
    if(x+3>=W||y+2>=H||!inP(x-1,y-1)||!inP(x+3,y+2)||!inP(x-1,y+2)||!inP(x+3,y-1))continue;const w=h2(gx+5,gy+5)<.5?2:3;
    for(let k=0;k<w;k++){B[y*W+x+k]=DIRT_L;B[(y+1)*W+x+k]=DIRT_D;TK[y*W+x+k]=TK[(y+1)*W+x+k]=1;}}}
// flagstones: every stone has a dark joint on its top and left and a shaded bottom and right, so a yard with missing stones still reads
function addStones(G,x0,y0,x1,y1){const {W,H,B,TK,S}=G,RH=10,CW=16,nr=Math.ceil((y1-y0)/RH);
  for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const row=((y-y0)/RH)|0,off=(row&1)*8,col=((x-x0+off)/CW)|0,my=(y-y0)%RH,mx=(x-x0+off)%CW,id=row*31+col;
    const sx0=x0+col*CW-off,edge=row===0||row===nr-1||sx0<=x0||sx0+CW>=x1;if(edge&&h2(id,5)<.42)continue;
    const base=h2(id,1)<.5?ROCK_A:ROCK_B;let c=base;if(my===0||mx===0)c=ROCK_C;else if(my===RH-1||mx===CW-1)c=ROCK_B;else if((my===1||mx===1)&&h2(id,2)<.6)c=ROCK_L;
    const i=y*W+x;B[i]=c;S[i]=2;TK[i]=0;}}

// ---------- thresholds. The art map is the sandbox's 128 px tileable map of seed blobs in 2x2 px blocks, about 6 seeds per tile ----------
function seedDist(x,y){const cs=12.8,gx=Math.floor(x/cs),gy=Math.floor(y/cs);let best=99;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=gx+dx,cy=gy+dy,hx=((cx%10)+10)%10,hy=((cy%10)+10)%10;
    const sx=(cx+.15+h2(hx+21,hy+4)*.7)*cs,sy=(cy+.15+h2(hx+8,hy+33)*.7)*cs,r=1+h2(hx+60,hy+2)*3,d=Math.hypot(x-sx,(y-sy)*1.3)-r;if(d<best)best=d;}
  return Math.max(0,best);}
function thArt(G){const {W,H,TK,S,ox,oy}=G,T=new Uint8Array(W*H),tk=(x,y)=>x>=0&&y>=0&&x<W&&y<H?TK[y*W+x]:0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const bx=(x+ox)>>1,by=(y+oy)>>1,X=bx*2+1,Y=by*2+1,lx=bx*2-ox,ly=by*2-oy,i=y*W+x;
    const tb=(tk(lx,ly)|tk(lx+1,ly)|tk(lx,ly+1)|tk(lx+1,ly+1))?1:0,d=seedDist(X,Y),lf=(vn(X/88,Y/70)-.5)*10;
    T[i]=clamp(Math.floor(Math.max(2,(S[i]?3+d*3:4+d*4.6+tb*10)+lf)+bay4(bx,by)/15*2.2),0,255);}
  return T;}
// the VFX #1 threshold, Bayer 4x4 plus a little noise with tufts 5 units later, stretched over the art map's 4 to 55 units so both fill at the same rate
function thBay(G){const {W,H,TK,ox,oy}=G,T=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=x+ox,Y=y+oy,i=y*W+x;T[i]=Math.floor(4+(bay4(X,Y)+.5)/16*51+(TK[i]?5:0)+(h2(X+7,Y+3)-.5)*2.5);}
  return T;}
// drawn drift lines: MK 1 shadow and 2 highlight (from depth 34), 3 shadow and 4 highlight for the longer arc (from depth 62)
const MARKS=[["hhhhh","mmmmm"],[".hhhh.","hmmmmh","m....m"],["hhh..","mmmhh","...mm"],["..hhh","hhmmm","mm..."]];
function marks(G){const {W,H,S,TK,ox,oy}=G,MK=new Uint8Array(W*H),free=(x,y)=>x>=1&&y>=1&&x<W-1&&y<H-1&&S[y*W+x]===0&&!MK[y*W+x]&&!TK[y*W+x];
  for(let ty=oy>>5;ty<=(oy+H-1)>>5;ty++)for(let tx=ox>>5;tx<=(ox+W-1)>>5;tx++){
    if(h2(tx*3+11,ty*7+5)<.4){const L=12+((h2(tx+31,ty+17)*11)|0),a=2+h2(tx+5,ty+41)*1.6,x0=tx*32-ox+((h2(tx*9+2,ty+8)*16)|0),y0=ty*32-oy+6+((h2(tx+6,ty*9+1)*20)|0);let ok=true;const pts=[];
      for(let q=0;q<L;q++){const x=x0+q,y=y0-Math.round(a*Math.sin(Math.PI*q/(L-1)));pts.push(x,y);if(!free(x,y)||!free(x,y+1)||!free(x,y-1)||!free(x,y+2))ok=false;}
      if(ok)for(let q=0;q<pts.length;q+=2){MK[pts[q+1]*W+pts[q]]=4;MK[(pts[q+1]+1)*W+pts[q]]=3;}}
    const n=1+((h2(tx*5+1,ty*3+2)*2)|0);
    for(let k=0;k<n;k++){const M=MARKS[(h2(tx+k*7,ty+k*13)*MARKS.length)|0],x0=tx*32-ox+2+((h2(tx*9+k,ty+4)*24)|0),y0=ty*32-oy+2+((h2(tx+2,ty*9+k)*26)|0);let ok=true;
      for(let r=-2;r<=M.length+1&&ok;r++)for(let c=-2;c<=M[0].length+1;c++)if(!free(x0+c,y0+r)){ok=false;break;}
      if(!ok)continue;
      for(let r=0;r<M.length;r++)for(let c=0;c<M[r].length;c++){const ch=M[r][c];if(ch!=='.')MK[(y0+r)*W+x0+c]=ch==='m'?1:2;}}}
  return MK;}
// the sandbox's banded shading. cov = depth > threshold. o: rim, shade, deep, drift (with o.MK), frost. Returns the number of snow pixels
function snowPass(out,G,TH,dep,o,cov){const {W,H,B}=G,N=W*H;let n=0;
  for(let i=0;i<N;i++){const c=dep[i]>TH[i]?1:0;cov[i]=c;n+=c;}
  const MK=o.drift?o.MK:null;
  for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){const d=dep[i];
    if(!cov[i]){let c=B[i];if(o.frost&&d>=4)c=frost(c);if(o.shade&&o.deep&&y>0&&cov[i-W]&&dep[i-W]>TH[i-W]+14)c=shad(c);out[i]=c;continue;}
    const nn=y>0?cov[i-W]:1,ww=x>0?cov[i-1]:1,ss=y<H-1?cov[i+W]:1,ee=x<W-1?cov[i+1]:1;let c=SN_BASE;
    if(nn+ww+ss+ee<=1)c=SN_BASE;
    else if(o.shade&&(!ss||!ee))c=o.deep&&d>TH[i]+14?SN_SH:SN_MID;
    else if(o.rim&&(!nn||!ww))c=SN_HI;
    else if(o.shade&&o.deep&&y<H-2&&!cov[i+2*W]&&d>TH[i]+14)c=SN_SH;
    else if(MK&&d>=34){const m=MK[i];if(m&&(m<3||d>=62))c=(m&1)?SN_MID:SN_HI;}
    out[i]=c;}
  return n;}
// connected snow patches smaller than 4 px (4-neighbour), the stray marks the cluster rule forbids
function strays(cov,W,H){const seen=new Uint8Array(W*H),st=[];let n=0;
  for(let s=0;s<W*H;s++){if(!cov[s]||seen[s])continue;let sz=0;st.push(s);seen[s]=1;
    while(st.length){const i=st.pop(),x=i%W;sz++;if(x>0&&cov[i-1]&&!seen[i-1]){seen[i-1]=1;st.push(i-1);}if(x<W-1&&cov[i+1]&&!seen[i+1]){seen[i+1]=1;st.push(i+1);}
      if(i>=W&&cov[i-W]&&!seen[i-W]){seen[i-W]=1;st.push(i-W);}if(i<W*H-W&&cov[i+W]&&!seen[i+W]){seen[i+W]=1;st.push(i+W);}}
    if(sz<4)n++;}
  return n;}
// a smooth depth factor per 2 px block, as a 1:2 field read with nearest sampling: about 0.6 to 1.4
function depthFactor(G,sx=40,sy=34){const {W,H,ox,oy}=G,F=new Float32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=((x+ox)>>1)*2+1,Y=((y+oy)>>1)*2+1;F[y*W+x]=.62+.76*vn(X/sx,Y/sy);}return F;}

// ---------- object stamps with cap thresholds (roof, pine, rock), drawn as in the sandbox ----------
function mkStamp(w,h){return {w,h,c:new Uint32Array(w*h),s:new Uint8Array(w*h).fill(255),t:new Uint8Array(w*h),f:new Uint8Array(w*h),cov:new Uint8Array(w*h)};}
function sset(st,x,y,col,cls,thr,flag){x|=0;y|=0;if(x<0||y<0||x>=st.w||y>=st.h)return;const i=y*st.w+x;st.c[i]=col;st.s[i]=cls===undefined?SOLID:cls;st.t[i]=clamp((thr||0)|0,0,255);st.f[i]=flag||0;}
function soutline(st){const {w,h,s}=st,add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(s[i]!==255)continue;
  if((x>0&&s[i-1]!==255)||(x<w-1&&s[i+1]!==255)||(y>0&&s[i-w]!==255)||(y<h-1&&s[i+w]!==255))add.push(i);}
  for(const i of add){st.c[i]=OUTL;st.s[i]=SOLID;}}
// a log house. rw roof width, sq rows of south slope, wh wall height. The roof fills from the ridge down and ends in a lip over the eave
function mkHouse(rw,sq,wh){const RY=12,E=RY+11+sq,st=mkStamp(rw+4,E+wh+2),P=(x,y,c,s,t,f)=>sset(st,x,y,c,s,t,f),x1=rw+1,wx0=8,wx1=rw-5;
  for(let y=RY;y<E;y++)for(let x=2;x<=x1;x++){const ry=y-RY;let c,t,f=0;
    if(ry<8){c=ry<2?ROOF_D:(((x+ry*3)%14)<2?ROOF_D:ROOF_B);t=4+ry*.75+scal(x+40)*5;f=1;}
    else if(ry<11){c=ry===8?ROOF_L:ry===9?ROOF_A:ROOF_D;t=3+scal(x)*4;if(ry<10)f=3;}
    else{const q=ry-11,co=q%8,ci=(q/8)|0;c=co===7?ROOF_D:ROOF_A;if(co<7&&((x+(ci&1)*6)%12)===0)c=ROOF_B;if(co===0&&h2(x>>2,ci)<.5)c=ROOF_L;if(x>rw-9&&c===ROOF_A)c=ROOF_B;
      t=9+q*(52/sq)+scal(x)*12+(vn(x/11,q/7)>.7&&q<sq*.43?16:0);if(co===7&&h2(x>>3,ci+9)<.6&&q<sq-5)f=1;if(q>=sq-4)f=2;}
    P(x,y,c,ROOF,t,f);}
  for(let y=E;y<E+wh;y++)for(let x=wx0;x<=wx1;x++){const ly=(y-E)%8;let c=ly===0?WALL_L:ly<5?WALL_A:ly<7?WALL_B:WALL_D;
    if(ly>=2&&ly<=4&&h2(x>>2,y>>1)<.1)c=WALL_B;
    if(x<wx0+8||x>wx1-8){const e=x<wx0+8?x-wx0:x-(wx1-7);c=e<2?WALL_L:e<5?WALL_A:WALL_B;if(ly===7)c=WALL_D;if(e===7)c=WALL_D;}
    if(y<E+4)c=c===WALL_L?WALL_A:c===WALL_A?WALL_B:WALL_D;
    if(y>=E+wh-3)c=y===E+wh-3?ROCK_A:(((x+(y&1)*5)%10)===0?ROCK_C:ROCK_B);
    P(x,y,c);}
  const dx=(rw*.56)|0,dy=E+6;
  for(let y=dy;y<E+wh;y++)for(let x=dx;x<=dx+17;x++){let c;if(y===dy)c=WALL_L;else if(x<dx+2||x>dx+15||y<dy+2)c=WALL_D;else{c=DOOR_A;if(x===dx+6||x===dx+11)c=WALL_D;if((y===dy+6||y===dy+7)&&x<dx+8)c=LAMP_P;if((x===dx+13||x===dx+14)&&(y===dy+11||y===dy+12))c=SCARF;}
    if(y>=E+wh-2)c=ROCK_A;P(x,y,c);}
  const wx=wx0+12,wy=E+7;
  for(let y=wy-1;y<=wy+14;y++)for(let x=wx-3;x<=wx+18;x++){let c=0,s=SOLID,t=0;const ix=x-wx,iy=y-wy;
    if(iy>=0&&iy<=11&&ix>=0&&ix<=15){c=(ix<2||iy<2)?WALL_L:(ix>13||iy>9)?WALL_B:WIN;
      if(c===WIN){if(ix===7||ix===8)c=ix===7?WALL_L:WALL_D;else if(iy===5||iy===6)c=iy===5?WALL_L:WALL_D;else if(ix+iy>16)c=WIN_D;else if((ix-iy===1||ix-iy===2)&&ix<7&&iy<5)c=ICE_C;}}
    else if(iy===-1&&ix>=-1&&ix<=16)c=OUTL;
    else if((ix===-1||ix===16)&&iy>=0&&iy<=11)c=OUTL;
    else if(iy===12&&ix>=-3&&ix<=18){c=WALL_L;s=FENCETOP;t=22+scal(x*2)*14;}
    else if(iy===13&&ix>=-3&&ix<=18)c=WALL_D;
    else if(iy===14&&ix>=-2&&ix<=17)c=OUTL;
    if(c)P(x,y,c,s,t);}
  const cx0=(rw*.7)|0;
  for(let y=2;y<=RY+12;y++)for(let x=cx0;x<=cx0+11;x++){const top=y<=5;if(!top&&(x<cx0+1||x>cx0+10))continue;let c,s=SOLID,t=0;
    if(top){c=y===2?ROCK_L:y===5?ROCK_C:(x>cx0+8?ROCK_B:ROCK_A);if(y<=4){s=ROCKTOP;t=8+(y-2)*22+Math.abs(x-cx0-5.5)*1.5;}}
    else{const by=(y-6)%6;c=by===5?ROCK_C:(((x+(((y-6)/6)|0)*4)%8)===0?ROCK_C:ROCK_A);if(x<cx0+3&&c===ROCK_A)c=ROCK_L;if(x>cx0+8&&c===ROCK_A)c=ROCK_B;if(y<8)c=ROCK_C;}
    P(x,y,c,s,t);}
  soutline(st);
  for(let x=2;x<=x1;x++){sset(st,x,E,OUTL,ROOF,66+scal(x+17)*8,2);if(x>=wx0+1&&x<=wx1-1){const g=scal(x*1.7+5);sset(st,x,E+1,WALL_D,ROOF,g>.42?80+g*8:255,2);}}
  st.E=E;st.base=E+wh;st.wx0=wx0;st.wx1=wx1;return st;}
// a pine of 4 tiers. One cap per tier, from the top of what shows of the tier in each column, down to about 60% of it. The dark fringe stays free
function mkPine(hw,h,seed){const hc=h-8,cx=hw+4,st=mkStamp(2*hw+9,h+6),nT=4,yb=[],ya=[],hws=[];
  for(let k=0;k<nT;k++){yb[k]=Math.round(hc-k*hc*.215)+2;hws[k]=hw*(1-k*.2);ya[k]=k===nT-1?2:Math.round(yb[k]-hc*.44);}
  const tooth=(x,k)=>[0,1,2,3,2,1][(((x+k*3+seed)%6)+6)%6];
  const inTier=(k,x,y)=>{if(y<ya[k])return false;const u=Math.abs(x-cx+.5),f=(y-ya[k])/(yb[k]-ya[k]);if(f>1.25)return false;const w=hws[k]*Math.pow(Math.min(1,f),.8)+.6;
    if(u>w)return false;return y<=yb[k]-tooth(x,k)+Math.round(u/hws[k]*2.2);};
  for(let y=hc;y<=hc+10;y++)for(let x=cx-3;x<=cx+2;x++)sset(st,x,y,x<cx?TRUNK:TRUNK_D);
  sset(st,cx-4,hc+10,TRUNK);sset(st,cx+3,hc+10,TRUNK_D);
  const own=new Int8Array(st.w*st.h).fill(-1),fr=new Uint8Array(st.w*st.h);
  for(let k=0;k<nT;k++){
    if(k>0)for(let y=3;y<st.h;y++)for(let x=0;x<st.w;x++)if(own[y*st.w+x]>=0&&inTier(k,x,y-3)&&!inTier(k,x,y))st.c[y*st.w+x]=CAN_D;
    for(let y=ya[k];y<=yb[k]+4;y++)for(let x=0;x<st.w;x++){if(!inTier(k,x,y))continue;const u=(x-cx+.5)/hws[k],fringe=!inTier(k,x,y+2),fr1=!inTier(k,x,y+1);
      let c=u<-.3?(h2((x>>1)+seed,(y>>1)+k*7)<.42?CAN_L:CAN_A):u<.28?(h2((x>>1)+seed,(y>>1)+k*5)<.16?CAN_B:CAN_A):CAN_B;
      if(fringe)c=u<0?CAN_B:CAN_D;if(fr1&&u>-.5)c=CAN_D;
      sset(st,x,y,c,CANOPY,255,u>.5?1:0);own[y*st.w+x]=k;fr[y*st.w+x]=fringe?1:0;}}
  for(let x=0;x<st.w;x++)for(let k=0;k<nT;k++){let y1=-1,y2=-1;for(let y=0;y<st.h;y++)if(own[y*st.w+x]===k){if(y1<0)y1=y;y2=y;}if(y1<0)continue;
    const vis=y2-y1+1,lump=scal(x*1.6+seed*5+k*9);for(let y=y1;y<=y2;y++){const i=y*st.w+x,dT=y-y1;
      if(fr[i]||dT>vis*.62+1||vis<4)continue;st.t[i]=clamp(8+dT*(8.5+lump*5)+(k===nT-1?0:6),0,254)|0;}}
  soutline(st);st.ax=cx;st.ay=hc+10;st.hw=hw;return st;}
function mkRock(w,h,seed){const st=mkStamp(w+2,h+2),rx=w/2,ry=h/2,ys=[];
  for(let x=0;x<w;x++){ys[x]=-1;for(let y=0;y<h;y++){const dx=(x+.5-rx)/rx,dy=(y+.5-ry*1.02)/ry;if(dx*dx+dy*dy<1+(h2(seed+(x>>2),y>>2)-.5)*.16){if(ys[x]<0)ys[x]=y;
    const top=y<h*.5-Math.abs(dx)*h*.1;let c=top?(dx<.15?ROCK_L:ROCK_A):(dx>.35||y>h*.8?ROCK_C:ROCK_B);if(top&&dx<.15&&h2(seed+(x>>1),y>>1)<.2)c=ROCK_A;
    if(!top&&Math.abs(y-h*.5+Math.abs(dx)*h*.1)<1)c=ROCK_B;
    sset(st,x+1,y+1,c,top?ROCKTOP:SOLID,top?5+(y-ys[x])*11+Math.max(0,Math.abs(dx)-.7)*90:0,dx>.3?1:0);}}}
  for(let k=0;k<5;k++)sset(st,1+(rx+2+k*.6)|0,1+(h*.5+k)|0,ROCK_C);
  soutline(st);st.ax=(w>>1)+1;st.ay=h+1;return st;}
// draw a stamp with its snow. dep is a number or fn(x, y) in stamp px. o.noise replaces the drawn cap thresholds with Bayer plus noise.
// Shading follows the sandbox's cap pass: shadow on the south edge, highlight on north and west, a 3 px thickness band on the lip
function drawStamp(u,W,H,st,x0,y0,dep,o){const {w,h,c,s,t,f,cov}=st,df=typeof dep==='function'?dep:null,noise=o&&o.noise;let n=0,tested=0;
  for(let i=0;i<w*h;i++){cov[i]=0;const cl=s[i];if(cl===255||cl===SOLID)continue;tested++;const x=i%w,y=(i/w)|0,d=df?df(x,y):dep,th=noise?5+bay4(x,y)*2.4+h2(x+3,y+11)*56:t[i];if(th<255&&d>th){cov[i]=64+cl*8;n++;}}
  for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i++){if(s[i]===255)continue;const X=x0+x,Y=y0+y;if(X<0||Y<0||X>=W||Y>=H)continue;let col=c[i];const cc=cov[i];
    if(cc){if(noise)col=f[i]===1?SN_MID:SN_BASE;
      else{const S=y<h-1?cov[i+w]:0,N=y>0?cov[i-w]:0,Wc=x>0?cov[i-1]:0,Ec=x<w-1?cov[i+1]:0;
        if(S!==cc)col=SN_MID;else if(N!==cc||Wc!==cc)col=SN_HI;else if(Ec!==cc)col=SN_MID;
        else if(f[i]===2&&((y<h-2?cov[i+2*w]:0)!==cc||(y<h-3?cov[i+3*w]:0)!==cc))col=SN_MID;
        else col=f[i]===1?SN_MID:f[i]===3?SN_HI:SN_BASE;
        if(f[i]===1&&col===SN_HI)col=SN_BASE;}}
    u[Y*W+X]=col;}
  return {n,tested};}
const drawAt=(u,W,H,st,bx,by,dep,o)=>drawStamp(u,W,H,st,bx-st.ax,by-st.ay,dep,o);

// ---------- the 24x32 character: the sandbox's row templates, outlined in code ----------
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
const mkMap=(hat,hatL,hatD,coat,coatL,coatD,scarf,scarfD,hair,brim,brimD)=>({h:hat,L:hatL,H:hatD,w:brim||K.HATB,W:brimD||K.HATB_D,k:hair,K:TRUNK_D,s:K.SKIN,S:K.SKIN_D,E:OUTL,y:scarf,Y:scarfD,c:coat,l:coatL,C:coatD,g:K.SKIN,G:K.SKIN_D,p:K.LEG,P:K.LEG_D,b:DOOR_A,B:WALL_D,o:OUTL});
function outlineSprite(px,w,h){const add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(px[i])continue;if((x>0&&px[i-1])||(x<w-1&&px[i+1])||(y>0&&px[i-w])||(y<h-1&&px[i+w]))add.push(i);}for(const i of add)px[i]=OUTL;}
// frames[direction 0 front, 1 back, 2 side][0 left step, 1 pass, 2 right step, 3 pass, 4 idle] -> 24x32 colours, 0 is empty
function mkFrames(map){const out=[];
  for(let d=0;d<3;d++){const up=UPS[d],fr=[];
    for(let f=0;f<5;f++){const px=new Uint32Array(768),bob=(f===1||f===3)?1:0,y0=2-bob;
      const row=(str,y,xo)=>{for(let x=0;x<24;x++){const ch=str[x],X=x+(xo|0);if(ch!=='.'&&y>=0&&y<32&&X>=0&&X<24)px[y*24+X]=map[ch];}};
      const g=up.map(r=>r.split(''));g.push(new Array(24).fill('.'),new Array(24).fill('.'));let sway=0;
      if(d<2&&(f===0||f===2)){const plantRight=(f===0)===(d===0),fa=plantRight?3:17,ba=plantRight?17:3;sway=plantRight?1:-1;
        for(let r=21;r>=15;r--)for(let x=fa;x<fa+4;x++)g[r+2][x]=g[r][x];
        for(let r=15;r<=20;r++)for(let x=ba;x<ba+4;x++)g[r][x]=g[r+1][x];for(let x=ba;x<ba+4;x++)g[21][x]='.';}
      for(let r=0;r<25;r++)row(g[r].join(''),y0+r,sway);
      if(d===2){const sw=f===0?3:f===2?-3:0;for(let r=0;r<ARM_S.length;r++){const s=ARM_S[r],xo=Math.round(sw*r/6);for(let x=0;x<5;x++)if(s[x]!=='.')px[(y0+15+r)*24+10+xo+x]=map[s[x]];}}
      const L=LEGS[d][f];if(bob)row(L[0],24);for(let r=0;r<6;r++)row(L[r],25+r);
      outlineSprite(px,24,32);fr.push(px);}
    out.push(fr);}
  return out;}
const HERO=mkFrames(mkMap(K.HAT,K.HAT_L,K.HAT_D,K.COAT,K.COAT_L,K.COAT_D,SCARF,SCARF_D,TRUNK));
const VILL=mkFrames(mkMap(K.V_HAT,WALL_A,WALL_D,K.V_COAT,K.V_COAT_L,K.V_COAT_D,K.HAT,K.HAT_D,ROCK_B,WALL_L,WALL_A));
const SHW=[3,6,7,6,3];
// feet at (fx, fy). The shadow is a 14x5 px ellipse 3 px above the feet, a switch to the cold shadow version of what is there
function drawChar(u,W,H,px,fx,fy,flip,bg){fx=Math.round(fx);fy=Math.round(fy);
  for(let r=0;r<5;r++){const y=fy-5+r,hw=SHW[r];if(y<0||y>=H)continue;for(let x=fx-hw;x<fx+hw;x++){if(x<0||x>=W)continue;const i=y*W+x;u[i]=shad(bg?bg[i]:u[i]);}}
  const x0=fx-12,y0=fy-30;for(let r=0;r<=30;r++){const y=y0+r;if(y<0||y>=H)continue;for(let c=0;c<24;c++){const v=px[r*24+(flip?23-c:c)];if(!v)continue;const x=x0+c;if(x<0||x>=W)continue;u[y*W+x]=v;}}}
// the 7x12 walker of VFX #1 in the same colours, for the 8 px comparison
const P7=["..hhh..",".hhhhh.",".HHHHH.",".seses.",".sssss.","yccCccy","ccccccc","ccccccc",".CcccC.",".ll.ll.",".ll.ll.",".bb.bb."];
const P7C={h:K.HAT,H:K.HAT_D,s:K.SKIN,e:OUTL,y:SCARF,c:K.COAT,C:K.COAT_D,l:K.LEG,b:DOOR_A};

// ---------- flakes: the sandbox's shapes, two hashed layers with no state and a near layer with height ----------
const mkMask=rows=>{const m=[];for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y].length;x++)if(rows[y][x]==='#')m.push(x,y);return m;};
const SHAPES=[mkMask(["#"]),mkMask(["##","##"]),mkMask([".#.","###",".#."]),mkMask([".##.","####","####",".##."]),mkMask(["..##..",".####.","######","######",".####.","..##.."])];
function putShape(u,W,H,x,y,sp,col,col2){const m=SHAPES[sp];let n=0;for(let k=0;k<m.length;k+=2){const px=x+m[k],py=y+m[k+1];if(px<0||py<0||px>=W||py>=H)continue;u[py*W+px]=(sp>=3&&m[k+1]>=(sp===3?3:4))?col2:col;n++;}return n;}
// counts keep the sandbox's density: 560 far and 300 mid on its 680x380 wrap box, 150 near on its 760x490 spawn box
function mkFlakes(W,H,seed,nearN){const r=rng(seed),kf=((W+40)*(H+20))/(680*380),kn=((W+120)*(H+130))/(760*490);
  const nf=Math.round(560*kf),nm=Math.round(300*kf),nn=nearN||Math.round(150*kn),MAXN=64,hx=[],hy=[],hp=[];
  for(let k=0;k<nf+nm;k++){hx.push(r());hy.push(r());hp.push(r());}
  const N={x:new Float32Array(MAXN),y:new Float32Array(MAXN),z:new Float32Array(MAXN),ph:new Float32Array(MAXN),sh:new Uint8Array(MAXN)};
  const spawn=(q,top)=>{N.x[q]=r()*(W+120)-60;N.y[q]=r()*(H+130);N.z[q]=top?118+r()*20:r()*136;N.ph[q]=r()*6.28;N.sh[q]=(r()*100)|0;};
  for(let q=0;q<MAXN;q++)spawn(q,false);
  const F={nf,nm,nn,N,t:0,ox:[0,0],oy:[0,0],wind:-.4,fall:[26,42,64],lands:[],spawn,sdw:shad,
    step(dt){F.t+=dt;
      for(let q=0;q<F.nn;q++){N.z[q]-=F.fall[2]*dt*(.85+.3*Math.sin(N.ph[q]));N.x[q]+=(F.wind*44+Math.sin(N.ph[q]+F.t*3)*8)*dt;N.y[q]+=Math.cos(N.ph[q]*1.3+F.t*1.8)*3*dt;
        if(N.z[q]<=0){F.lands.push([N.x[q]|0,N.y[q]|0,.2]);spawn(q,true);}
        if(N.x[q]<-70)N.x[q]+=W+130;else if(N.x[q]>W+70)N.x[q]-=W+130;}
      for(let k=F.lands.length-1;k>=0;k--){F.lands[k][2]-=dt;if(F.lands[k][2]<=0)F.lands.splice(k,1);}
      F.ox[0]+=F.wind*14*dt;F.oy[0]+=F.fall[0]*dt;F.ox[1]+=F.wind*26*dt;F.oy[1]+=F.fall[1]*dt;},
    far(u,mode){let n=0;const one=mode==='1',large=mode==='large',ww=W+40,hh=H+20;
      for(let l=0;l<2;l++){const cnt=l?nm:nf,o=l?nf:0,col=l?FLAKE_M:FLAKE_F,sw=l?9:5;
        for(let k=0;k<cnt;k++){const p=hp[o+k],ph=p*6.283,x=((((hx[o+k]*ww+F.ox[l]+Math.sin(ph+F.t*(1+p)))+Math.sin(ph+F.t*1.3)*sw)%ww)+ww)%ww-20|0,y=((hy[o+k]*hh+F.oy[l]*(.8+.4*p))%hh)-10|0;
          const sp=one?0:l===0?(large&&p>.6?1:0):(large&&p>.7?2:1);n+=putShape(u,W,H,x,y,sp,col,col);}}
      return n;},
    near(u,mode,bg,shadow){let n=0;const one=mode==='1',large=mode==='large';
      for(let q=0;q<F.nn;q++){const gx=N.x[q]|0,gy=N.y[q]|0,y=(N.y[q]-N.z[q])|0,h=N.sh[q],sp=one?0:large?(h<20?4:h<45?3:2):(h<10?3:2);
        if(shadow&&gx>=0&&gy>=0&&gx<W-1&&gy<H&&N.z[q]<70){const i=gy*W+gx;for(let k=0;k<(one?1:2);k++)u[i+k]=F.sdw(bg[i+k]);}
        n+=putShape(u,W,H,gx-(sp>1?1:0),y-(sp>1?1:0),sp,SPARK,FLAKE_M);}
      return n;}};
  return F;}
// a snowy scene background for the flake figures: ground through the art map, optional pines and rocks. Returns colours and the ground object
function mkScene(W,H,ox,oy,depth,objs){const G=ground(W,H,ox,oy),TH=thArt(G),MK=marks(G),F=depthFactor(G),dep=new Float32Array(W*H),u=new Uint32Array(W*H);
  for(const o of objs||[]){const st=o.st,rx=(st.hw||10)+5,ry=rx*.5;for(let y=Math.max(0,(o.y-ry-4)|0);y<=Math.min(H-1,o.y+ry);y++)for(let x=Math.max(0,o.x-rx);x<=Math.min(W-1,o.x+rx);x++){const dx=(x-o.x)/rx,dy=(y-o.y+3)/ry,q=dx*dx+dy*dy;if(q<1)F[y*W+x]*=.12+.88*q;}}
  for(let i=0;i<W*H;i++)dep[i]=depth*F[i];
  snowPass(u,G,TH,dep,{rim:1,shade:1,deep:1,drift:1,MK,frost:1},new Uint8Array(W*H));
  for(const o of (objs||[]).slice().sort((a,b)=>a.y-b.y))drawAt(u,W,H,o.st,o.x,o.y,o.d===undefined?depth*1.3:o.d);
  return {u,G};}

// ======================================================================
// B1: Bayer 4x4 on an 8 px tile and on a 32 px tile, same level
// ======================================================================
reg('bayer32',root=>{const cv=$$('canvas',root),PA=PX(cv[0]),PB=PX(cv[1]),C=ctl(root),ro=$('[data-ro]',root),W=96,H=64,w8=24,h8=16;
  const G=ground(W,H,96,32),g8=new Uint32Array(w8*h8),a8=new Uint32Array(w8*h8);
  for(let y=0;y<h8;y++)for(let x=0;x<w8;x++){const n=vn(x/9+3,y/8+1)*.6+vn(x/3.5,y/3)*.4;g8[y*w8+x]=n<.4?GR_D:n>.63?GR_B:GR_A;}
  for(let ty=0;ty<2;ty++)for(let tx=0;tx<3;tx++)for(let k=0;k<2;k++){const x=tx*8+1+((h2(tx*5+k,ty+3)*6)|0),y=ty*8+1+((h2(tx+9,ty*7+k)*5)|0);g8[y*w8+x]=GR_T;g8[(y+1)*w8+x]=GR_X;}
  let dirty=true;C.on('lv',()=>{dirty=true;});C.on('b8',()=>{dirty=true;});
  const iso=(t,n)=>{let a=0,b=0;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const s=t(x,y),nb=t(x-1,y)+t(x+1,y)+t(x,y-1)+t(x,y+1);if(s&&!nb)a++;if(!s&&nb===4)b++;}return [a,b];};
  const corners=(u,x0,y0)=>{for(let k=0;k<6;k++)for(const [x,y] of [[x0+k,y0],[x0,y0+k],[x0+31-k,y0],[x0+31,y0+k],[x0+k,y0+31],[x0,y0+31-k],[x0+31-k,y0+31],[x0+31,y0+31-k]])u[y*W+x]=GOLD;};
  function draw(){const lv=C.v('lv'),b8=C.v('b8'),t=b8?(x,y)=>+(bay8(x,y)<lv*4):(x,y)=>+(bay4(x,y)<lv);C.out('lv',lv+'/16');
    for(let y=0;y<h8;y++)for(let x=0;x<w8;x++)a8[y*w8+x]=t(x,y)?SN_BASE:g8[y*w8+x];
    for(let r=0;r<12;r++)for(let c=0;c<7;c++){const ch=P7[r][c];if(ch!=='.')a8[(2+r)*w8+5+c]=P7C[ch];}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)PA.u32[y*W+x]=a8[(y>>2)*w8+(x>>2)];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)PB.u32[y*W+x]=t(x,y)?SN_BASE:G.B[y*W+x];
    drawChar(PB.u32,W,H,HERO[0][4],32,57);
    corners(PA.u32,64,32);corners(PB.u32,64,32);PA.put();PB.put();
    const a=iso(t,8),b=iso(t,32),rep=b8?[1,4]:[2,8];
    ro.innerHTML=`${b8?'Bayer 8x8':'Bayer 4x4'} at level <b>${lv}/16</b>, ${(lv/16*100).toFixed(1)}% of the pixels · the matrix repeats <b>${rep[0]}</b> ${rep[0]>1?'times':'time'} across an 8 px tile and <b>${rep[1]}</b> times across a 32 px tile<br>snow pixels with no snow neighbour, counted from the pattern: 8 px tile <b>${a[0]}</b> · 32 px tile <b>${b[0]}</b><br>ground pixels with snow on all four sides: 8 px tile <b>${a[1]}</b> · 32 px tile <b>${b[1]}</b><br>report §6a, measured: flat Bayer ground pass at 640x360 <b>0.291 / 1.85 ms</b> (desktop / 6x throttle)`;}
  return {tick(){if(dirty){dirty=false;draw();}}};});

// ======================================================================
// B2: the art threshold map beside Bayer plus noise, on one depth field
// ======================================================================
reg('artmap',root=>{const cv=$$('canvas',root),PA=PX(cv[0]),PB=PX(cv[1]),C=ctl(root),ro=$('[data-ro]',root),W=96,H=72;
  const G=ground(W,H,64,96),TA=thArt(G),TB=thBay(G),MK=marks(G),F=depthFactor(G),dep=new Float32Array(W*H),ca=new Uint8Array(W*H),cb=new Uint8Array(W*H);
  const LO=U('#141a33'),ramp=t=>mix32(LO,SN_MID,Math.floor(clamp(t/60,0,1)*9)/9);
  let dirty=true,view='snow';C.on('d',()=>{dirty=true;});C.on('fr',()=>{dirty=true;});C.seg('view',v=>{view=v;dirty=true;});
  function draw(){const D=C.v('d'),fr=C.v('fr');C.out('d',D+' units');for(let i=0;i<W*H;i++)dep[i]=D*F[i];
    const o={rim:1,shade:1,deep:1,drift:1,MK,frost:fr},na=snowPass(PA.u32,G,TA,dep,o,ca),nb=snowPass(PB.u32,G,TB,dep,o,cb);
    if(view==='map')for(let i=0;i<W*H;i++){PA.u32[i]=dep[i]>TA[i]?SN_HI:ramp(TA[i]);PB.u32[i]=dep[i]>TB[i]?SN_HI:ramp(TB[i]);}
    PA.put();PB.put();
    setHud(root,view==='map'?'dark fills first':'edge test, longest run 13 px','a');setHud(root,view==='map'?'16 levels, every pixel':'edge test, longest run 41 to 43 px','b');
    ro.innerHTML=`depth <b>${Math.round(D*.62)} to ${Math.round(D*1.38)}</b> units across the view · snow covers <b>${(na/W/H*100).toFixed(0)}%</b> through the art map and <b>${(nb/W/H*100).toFixed(0)}%</b> through Bayer<br>snow patches under 4 px, counted from the canvas: art map <b>${strays(ca,W,H)}</b> · Bayer <b>${strays(cb,W,H)}</b><br>report §6a, measured ground pass at 640x360, field 1:2 nearest, flat: art tile <b>0.404 / 2.75 ms</b> · Bayer <b>0.289 / 1.73 ms</b> (desktop / 6x throttle)<br>in the shader both are 3 reads and <b>0.0038 ms</b> on Metal · the map is 16,384 bytes and never changes`;}
  return {tick(){if(dirty){dirty=false;draw();}}};});

// winter twins of a ground: snow with drift lines and dry grass, a trodden path with boot prints, stones under snow. Hand-drawn rules, no depth
function winterPaint(G,MK){const {W,H,B,S,ox,oy}=G,Wn=new Uint32Array(W*H).fill(SN_BASE),cl=(x,y)=>S[clamp(y,0,H-1)*W+clamp(x,0,W-1)];
  for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){const s=S[i];
    if(s===0){if(MK[i])Wn[i]=(MK[i]&1)?SN_MID:SN_HI;}
    else if(s===1){let c=SN_PACK;if(cl(x,y-1)!==1||cl(x-1,y)!==1||cl(x,y-2)!==1||cl(x-2,y)!==1)c=SN_PSH;else if(cl(x+1,y)!==1||cl(x,y+1)!==1)c=SN_HI;Wn[i]=c;}
    else{const X=x+ox,Y=y+oy;if(B[i]===ROCK_C&&h2(X>>3,Y>>2)<.55)Wn[i]=SN_MID;}}
  const DRY=["l.ll.","lall.",".aa.m",".mmm."];
  for(let ty=oy>>5;ty<=(oy+H-1)>>5;ty++)for(let tx=ox>>5;tx<=(ox+W-1)>>5;tx++){if(h2(tx*7+2,ty*5+9)<.4)continue;const x0=tx*32-ox+4+((h2(tx+3,ty+8)*20)|0),y0=ty*32-oy+4+((h2(tx+12,ty+1)*20)|0);let ok=true;
    for(let r=-1;r<=4&&ok;r++)for(let c=-1;c<=5;c++){const x=x0+c,y=y0+r;if(x<0||y<0||x>=W||y>=H||S[y*W+x]!==0||MK[y*W+x]){ok=false;break;}}
    if(ok)for(let r=0;r<4;r++)for(let c=0;c<5;c++){const ch=DRY[r][c];if(ch!=='.')Wn[(y0+r)*W+x0+c]=ch==='l'?DIRT_L:ch==='a'?DIRT_A:SN_MID;}}
  return Wn;}
// a drawn boot print, 4x6 px: dark line on the north and west inner edge, floor two ramp steps under the body, highlight on the far rim
function bootPrint(a,W,H,x,y){for(let r=0;r<7;r++)for(let c=0;c<5;c++){const X=x+c,Y=y+r;if(X<0||Y<0||X>=W||Y>=H||(r===6&&c===4))continue;a[Y*W+X]=(r===6||c===4)?(r===0||c===0?a[Y*W+X]:SN_HI):(r===0||c===0)?SN_PDK:SN_PSH;}}

// ======================================================================
// B3: summer and winter tiles blended per pixel through depth > threshold
// ======================================================================
reg('maskblend',root=>{const cv=$$('canvas',root),PA=PX(cv[0]),PB=PX(cv[1]),C=ctl(root),ro=$('[data-ro]',root),W=128,H=96;
  const G=ground(W,H,160,32),inP=(x,y)=>{const wv=Math.round(Math.sin(y*.071)*2.6+Math.sin(y*.19+1)*1.2);return x>=36+wv&&x<=59+wv;};
  addPath(G,inP);addStones(G,66,34,128,96);
  const MK=marks(G),TH=thArt(G),F=depthFactor(G),Wn=winterPaint(G,MK),Sm=G.B;
  for(let y=6;y<H-8;y+=16){const wv=Math.round(Math.sin(y*.071)*2.6+Math.sin(y*.19+1)*1.2);bootPrint(Wn,W,H,42+wv,y);bootPrint(Wn,W,H,49+wv,y+8);}
  const LO=U('#141a33'),ramp=t=>mix32(LO,SN_MID,Math.floor(clamp(t/60,0,1)*9)/9),CELLS=[[0,0],[3,0],[1,1],[2,2]];
  let dirty=true;C.on('d',()=>{dirty=true;});
  function draw(){const D=C.v('d');C.out('d',D+' units');let n=0;
    for(let i=0;i<W*H;i++){const w=D*F[i]>TH[i];PB.u32[i]=w?Wn[i]:Sm[i];n+=w;}
    for(let k=0;k<4;k++){const sx=CELLS[k][0]*32,sy=CELLS[k][1]*32;for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(sy+y)*W+sx+x,ed=x===0||y===0;
      PA.u32[y*W+k*32+x]=ed?dim(Sm[i],.6):Sm[i];PA.u32[(32+y)*W+k*32+x]=ed?dim(Wn[i],.6):Wn[i];PA.u32[(64+y)*W+k*32+x]=ed?LO:D>TH[i]?SN_HI:ramp(TH[i]);}}
    PA.put();PB.put();setHud(root,'summer','a');setHud(root,'winter twin','b');setHud(root,'threshold','c');
    ro.innerHTML=`depth <b>${Math.round(D*.62)} to ${Math.round(D*1.38)}</b> units across the map · winter art on <b>${(n/W/H*100).toFixed(0)}%</b> of the pixels<br>fetches per pixel <b>4</b> (field, threshold, summer tile, winter tile) · <b>921,600</b> per frame at 640x360<br>not measured as such. The bench's 3-read flat shader took <b>0.0038 ms</b> on Metal at 640x360 (report §6a)<br>art cost: a full second tileset`;}
  return {tick(){if(dirty){dirty=false;draw();}}};});

// ======================================================================
// B4: what shipped games do: tileset swap, overlay autotile, SnowGrass
// ======================================================================
reg('overlay',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=96,TW=5,TH_=3;
  const G=ground(W,H,96,160),inP=(x,y)=>{const wh=Math.round(Math.sin(x*.043)*3+Math.sin(x*.13+2)*1.4);return y>=40+wh&&y<=58+wh;};addPath(G,inP);
  const MK=marks(G),Wn=winterPaint(G,MK),pine=mkPine(17,56,3),rock=mkRock(22,15,2),PX0=24,PY0=92,RX=134,RY=30,dep=new Float32Array(W*H),cov=new Uint8Array(W*H),T20=new Uint8Array(W*H).fill(20);
  for(let x=72;x<=128;x+=16){const wh=Math.round(Math.sin(x*.043)*3+Math.sin(x*.13+2)*1.4);for(const [dx,dy] of [[0,43],[8,50]]){const X=x+dx,Y=dy+wh;for(let r=0;r<5;r++)for(let c=0;c<7;c++){if(r===4&&c===6)continue;const i=(Y+r)*W+X+c;Wn[i]=(r===4||c===6)?(r===0||c===0?Wn[i]:SN_HI):(r===0||c===0)?SN_PDK:SN_PSH;}}}
  // the half-way tile: one tile of the art map frozen at a middle level, in 2 px blocks, clear of the tile border so it sits beside any neighbour
  const SGL=19;
  const SG=new Uint8Array(1024);for(let by=1;by<15;by++)for(let bx=1;bx<15;bx++)if(4+seedDist(bx*2+1+64,by*2+1+32)*4.6<SGL){SG[by*2*32+bx*2]=SG[by*2*32+bx*2+1]=SG[(by*2+1)*32+bx*2]=SG[(by*2+1)*32+bx*2+1]=1;}
  const OV0=[1,1,1,0,0, 1,1,1,1,0, 0,1,1,0,0],HF0=[2,2,1,1,0, 2,2,2,1,0, 2,1,1,0,0];let ov=OV0.slice(),hf=HF0.slice(),mode='swap',dirty=true;
  const lump=(l,p)=>Math.max(1,Math.round(2.6+1.5*Math.sin(l*.3927+p)+1.1*Math.sin(l*.589+p*1.7)));
  // the overlay edge of a tile depends only on which neighbours carry snow and on the position inside the tile, so it is an autotile
  function inside(x,y,f){const tx=x>>5,ty=y>>5,lx=x&31,ly=y&31;if(!f(tx,ty))return 0;const n=f(tx,ty-1),s=f(tx,ty+1),w=f(tx-1,ty),e=f(tx+1,ty),R=9;
    if(!n&&ly<lump(lx,2))return 0;if(!s&&31-ly<lump(lx,40))return 0;if(!w&&lx<lump(ly,90))return 0;if(!e&&31-lx<lump(ly,140))return 0;
    const cut=(a,b,cx,cy)=>{if(!a&&!b){const dx=cx?31-lx:lx,dy=cy?31-ly:ly;if(dx<R+2&&dy<R+2&&(R+2-dx)*(R+2-dx)+(R+2-dy)*(R+2-dy)>R*R+3)return 1;}return 0;};
    if(cut(n,w,0,0)||cut(n,e,1,0)||cut(s,w,0,1)||cut(s,e,1,1))return 0;
    const notch=(a,b,d,cx,cy)=>{if(a&&b&&!d){const dx=cx?31-lx:lx,dy=cy?31-ly:ly;if(dx*dx+dy*dy<30)return 1;}return 0;};
    if(notch(n,w,f(tx-1,ty-1),0,0)||notch(n,e,f(tx+1,ty-1),1,0)||notch(s,w,f(tx-1,ty+1),0,1)||notch(s,e,f(tx+1,ty+1),1,1))return 0;
    return 1;}
  const at=(a,tx,ty)=>a[clamp(ty,0,TH_-1)*TW+clamp(tx,0,TW-1)];
  C.seg('mode',v=>{mode=v;dirty=true;});C.btn('reset',()=>{ov=OV0.slice();hf=HF0.slice();dirty=true;});
  pointer(cv,(p,k)=>{if(k!=='down')return;const t=clamp(p[1]>>5,0,TH_-1)*TW+clamp(p[0]>>5,0,TW-1);if(mode==='over'){ov[t]^=1;dirty=true;}else if(mode==='half'){hf[t]=(hf[t]+1)%3;dirty=true;}});
  function draw(){let dp=0,dr=0,txt;
    if(mode==='summer'){u.set(G.B);txt='summer tileset · snow state <b>none</b>';}
    else if(mode==='swap'){u.set(Wn);dp=dr=110;txt='one event swaps the tileset and every tile changes at once · snow state <b>1 value for the whole map</b> · run-time cost <b>none</b><br>art cost: a second copy of every tile and object';}
    else{const f=mode==='over'?(tx,ty)=>at(ov,tx,ty):(tx,ty)=>at(hf,tx,ty)===2;
      for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){const k=mode==='half'?at(hf,x>>5,y>>5):0;dep[i]=inside(x,y,f)?70:k===1&&SG[(y&31)*32+(x&31)]?30:0;}
      snowPass(u,G,T20,dep,{rim:1,shade:1,deep:1,drift:1,MK,frost:1},cov);
      const pt=((PY0-2)>>5)*TW+(PX0>>5),rt=((RY-2)>>5)*TW+(RX>>5);
      if(mode==='over'){dp=ov[pt]?110:0;dr=ov[rt]?110:0;const n=ov.reduce((a,b)=>a+b,0);txt=`overlay on <b>${n}</b> of 15 tiles · snow state <b>1 bit per tile</b>, 2 bytes for this map · run-time cost <b>none</b><br>art cost: one transparent edge set that sits on any ground`;}
      else{dp=[0,34,110][hf[pt]];dr=[0,34,110][hf[rt]];const c=[0,0,0];hf.forEach(v=>c[v]++);txt=`grass <b>${c[0]}</b> · SnowGrass <b>${c[1]}</b> · snow <b>${c[2]}</b> tiles · snow state <b>2 bits per tile</b> · run-time cost <b>none</b><br>art cost: one half-way tile per ground, plus the snow edge set`;}}
    drawAt(u,W,H,rock,RX,RY,dr);drawAt(u,W,H,pine,PX0,PY0,dp);P.put();
    setHud(root,mode==='over'||mode==='half'?'click a tile to change it':'');
    ro.innerHTML=txt+'<br>report B4: free at run time, one event swaps a texture';}
  return {tick(){if(dirty){dirty=false;draw();}}};});

// ======================================================================
// B5: edge shading built up one line at a time
// ======================================================================
reg('edgeshade',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=80,H=60;
  const G=ground(W,H,224,64),TH=thArt(G),MK=new Uint8Array(W*H),dep=new Float32Array(W*H),cov=new Uint8Array(W*H),sh=new Float32Array(W*H);
  const ELL=[[34,26,29,19],[57,37,17,13],[12,50,8,5]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const X=(x>>1)*2+1,Y=(y>>1)*2+1;let v=0;for(const [cx,cy,rx,ry] of ELL){const dx=(X-cx)/rx,dy=(Y-cy)/ry;v=Math.max(v,1-dx*dx-dy*dy);}sh[y*W+x]=v>0?.3+1.2*Math.sqrt(v):0;}
  const put=(x0,y0,rows)=>{for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++){const ch=rows[r][c];if(ch!=='.')MK[(y0+r)*W+x0+c]=ch==='m'?1:ch==='h'?2:ch==='M'?3:4;}};
  put(18,18,MARKS[0]);put(42,40,MARKS[2]);put(52,24,MARKS[3]);
  for(let q=0;q<18;q++){const x=24+q,y=31-Math.round(2.6*Math.sin(Math.PI*q/17));MK[y*W+x]=4;MK[(y+1)*W+x]=3;}
  let dirty=true;['rim','sh','deep','drift','d'].forEach(k=>C.on(k,()=>{dirty=true;}));
  function draw(){const D=C.v('d'),o={rim:C.v('rim'),shade:C.v('sh'),deep:C.v('deep'),drift:C.v('drift'),MK,frost:0};C.out('d',D+' units');
    for(let i=0;i<W*H;i++)dep[i]=D*sh[i];const n=snowPass(u,G,TH,dep,o,cov);P.put();
    let hi=0,mid=0,sd=0;for(let i=0;i<W*H;i++)if(cov[i]){const c=u[i];if(c===SN_HI)hi++;else if(c===SN_MID)mid++;else if(c===SN_SH)sd++;}
    const pc=v=>n?(v/n*100).toFixed(0)+'%':'0%',on=o.rim||o.shade||o.drift;
    setHud(root,on?'':'flat, one body colour');
    ro.innerHTML=`snow pixels <b>${n}</b> · body <code>#cbd3dc</code> <b>${pc(n-hi-mid-sd)}</b> · highlight <code>#f2f1ec</code> <b>${pc(hi)}</b> · shadow <code>#9eabb8</code> <b>${pc(mid)}</b> · deep shadow <code>#7d7a96</code> <b>${pc(sd)}</b><br>report §6a, measured ground pass at 640x360: flat Bayer <b>0.291 / 1.85 ms</b> · with emboss and 3 bands <b>0.713 / 5.60 ms</b> · full 32 px renderer <b>0.945 / 5.80 ms</b> (desktop / 6x throttle)<br>in the shader the banded look is 8 reads and <b>0.0089 ms</b> on Metal`;}
  return {tick(){if(dirty){dirty=false;draw();}}};});

// ======================================================================
// C1: shaped caps against plain threshold noise on the same roof and pine
// ======================================================================
reg('caps',root=>{const cv=$$('canvas',root),PA=PX(cv[0]),PB=PX(cv[1]),C=ctl(root),ro=$('[data-ro]',root),W=144,H=104;
  const G=ground(W,H,320,224),TH=thArt(G),MK=marks(G),F=depthFactor(G),dep=new Float32Array(W*H),cov=new Uint8Array(W*H),gr=new Uint32Array(W*H);
  const house=mkHouse(92,36,26),pine=mkPine(18,64,5),HX=2,HY=0,PXb=122,PYb=99,base=HY+house.base;
  for(let y=base;y<Math.min(H,base+16);y++)for(let x=HX+house.wx0-2;x<=HX+house.wx1+2;x++)F[y*W+x]*=Math.min(1,.15+(y-base)/16);
  {const rx=pine.hw+5,ry=pine.hw*.55;for(let y=Math.max(0,(PYb-ry-4)|0);y<=Math.min(H-1,PYb+ry);y++)for(let x=Math.max(0,PXb-rx);x<=Math.min(W-1,PXb+rx);x++){const dx=(x-PXb)/rx,dy=(y-PYb+3)/ry,q=dx*dx+dy*dy;if(q<1)F[y*W+x]*=.12+.88*q;}}
  let dirty=true,ma=-1,mb=-1;C.on('d',()=>{dirty=true;});
  const objs=(u,D,o)=>{const a=drawStamp(u,W,H,house,HX,HY,D,o),b=drawAt(u,W,H,pine,PXb,PYb,D,o);return {n:a.n+b.n,tested:a.tested+b.tested};};
  function draw(){const D=C.v('d');C.out('d',D+' units');for(let i=0;i<W*H;i++)dep[i]=D*.8*F[i];
    snowPass(gr,G,TH,dep,{rim:1,shade:1,deep:1,drift:1,MK,frost:1},cov);
    PA.u32.set(gr);PB.u32.set(gr);const ra=objs(PA.u32,D),rb=objs(PB.u32,D,{noise:1});PA.put();PB.put();
    const tmp=new Uint32Array(W*H),bench=o=>{const t0=performance.now();for(let k=0;k<12;k++)objs(tmp,D,o);return (performance.now()-t0)/12;};
    const a=bench(),b=bench({noise:1});ma=ma<0?a:ma+(a-ma)*.3;mb=mb<0?b:mb+(b-mb)*.3;
    ro.innerHTML=`cap pixels tested in this view <b>${ra.tested.toLocaleString('en-US')}</b>, one compare each · snow on <b>${ra.n.toLocaleString('en-US')}</b> shaped and <b>${rb.n.toLocaleString('en-US')}</b> noise pixels<br>this browser, both objects: shaped, test and edge shading <b>${ms(ma)} ms</b> · noise, test and flat fill <b>${ms(mb)} ms</b><br>Sandbox, measured: <b>23,877</b> cap pixels per frame, 10% of the screen, object layer <b>0.13 to 0.19 ms</b>`;}
  return {tick(){if(dirty){dirty=false;draw();}}};});

// ======================================================================
// C2: a coarse baked exposure map with and without the static art mask
// ======================================================================
reg('artmask',root=>{const cv=$$('canvas',root),PA=PX(cv[0]),PB=PX(cv[1]),C=ctl(root),ro=$('[data-ro]',root),W=104,H=72,N=W*H;
  const G=ground(W,H,448,96),TA=thArt(G),house=mkHouse(92,36,24),HX=-16,HY=-42,base=HY+house.base,eave=HY+house.E,xe=HX+house.w-2,E0=U('#131b38'),E1=U('#a9cdee');
  const cls=new Uint8Array(N),B=new Uint32Array(N),TH=new Uint8Array(N),FL=new Uint8Array(N),E=new Float32Array(N),dep=new Float32Array(N),cov=new Uint8Array(N);
  // exposure at art resolution: 1 on the roof, 0 on walls, a dry strip of 9 px under the eave that opens up by 21 px, and the wind lee east of the house
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,sx=x-HX,sy=y-HY,k=sx>=0&&sy>=0&&sx<house.w&&sy<house.h?sy*house.w+sx:-1;
    if(k>=0&&house.s[k]!==255){cls[i]=house.s[k];B[i]=house.c[k];TH[i]=house.s[k]===SOLID?6+bay4(x>>1,y>>1)*.5:house.t[k];FL[i]=house.f[k];E[i]=house.s[k]===SOLID?0:1;}
    else{let e=1;if(x>=xe)e=.36+.64*Math.min(1,(x-xe)/112);if(y>=base&&y<base+21&&x<xe)e*=clamp((y-base-9)/12,.05,1);cls[i]=0;B[i]=G.B[i];TH[i]=TA[i];E[i]=e;}}
  // bake at 1:R. plain: one mean per cell. byClass: a mean per surface class in the cell, so a pixel can mix only cells of its own class
  function bake(R){const cw=Math.ceil(W/R),chh=Math.ceil(H/R),plain=new Float32Array(cw*chh),cnt=new Float32Array(cw*chh),by={};
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,c=((y/R)|0)*cw+((x/R)|0),k=cls[i];plain[c]+=E[i];cnt[c]++;if(k===SOLID)continue;const b=by[k]||(by[k]={s:new Float32Array(cw*chh),n:new Float32Array(cw*chh)});b.s[c]+=E[i];b.n[c]++;}
    for(let c=0;c<cw*chh;c++)plain[c]/=cnt[c]||1;for(const k in by)for(let c=0;c<cw*chh;c++)if(by[k].n[c])by[k].s[c]/=by[k].n[c];
    return {R,cw,chh,plain,by};}
  const BK={1:bake(1),2:bake(2),4:bake(4)};
  function sample(b,x,y,k){const R=b.R,fx=(x+.5)/R-.5,fy=(y+.5)/R-.5,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0;let s=0,wsum=0;const src=k<0?null:b.by[k];
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){const cx=clamp(x0+i,0,b.cw-1),cy=clamp(y0+j,0,b.chh-1),c=cy*b.cw+cx,w=(i?tx:1-tx)*(j?ty:1-ty);if(src){if(!src.n[c])continue;s+=src.s[c]*w;wsum+=w;}else{s+=b.plain[c]*w;wsum+=w;}}
    return wsum>0?s/wsum:0;}
  let dirty=true,R=4;C.seg('r',v=>{R=+v;dirty=true;});C.on('mask',()=>{dirty=true;});C.on('d',()=>{dirty=true;});
  function draw(){const D=C.v('d'),mask=C.v('mask'),b=BK[R];C.out('d',D+' units');let onWall=0,soft=0;
    for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){const k=cls[i],e=mask?(k===SOLID?0:sample(b,x,y,k)):sample(b,x,y,-1);dep[i]=D*e;cov[i]=dep[i]>TH[i]?(mask?64+k*8:1):0;if(cov[i]&&k===SOLID)onWall++;
      const cx=(x/R)|0,cy=(y/R)|0,c=cy*b.cw+cx,ev=mask?(k===SOLID?-1:b.by[k].n[c]?b.by[k].s[c]:0):b.plain[c];
      let m=ev<0?dim(B[i],.5):dim(mix32(E0,E1,ev),R>1&&((cx+cy)&1)?.93:1);if(!mask&&k===SOLID&&B[i]===OUTL)m=dim(m,.72);PA.u32[i]=m;}
    for(let x=Math.max(0,HX+house.wx0+10);x<=Math.min(W-1,HX+house.wx1-10);x++){let y=eave,run=0;while(y<H&&cls[y*W+x]!==SOLID)y++;for(;y<H&&cls[y*W+x]===SOLID&&cov[y*W+x];y++)run++;soft=Math.max(soft,run);}
    for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){const c=cov[i];let col=B[i];
      if(!c){if(cls[i]===0&&dep[i]>=4)col=frost(col);if(cls[i]===0&&y>0&&cov[i-W]&&cov[i-W]===(mask?64:1)&&dep[i-W]>TH[i-W]+14)col=shad(col);}
      else{const n=y>0?cov[i-W]:c,w=x>0?cov[i-1]:c,s=y<H-1?cov[i+W]:c,e=x<W-1?cov[i+1]:c,deep=dep[i]>TH[i]+14&&cls[i]===0;
        if((n!==c)+(w!==c)+(s!==c)+(e!==c)>=3)col=SN_BASE;else if(s!==c||e!==c)col=deep?SN_SH:SN_MID;else if(n!==c||w!==c)col=SN_HI;
        else if(FL[i]===2&&mask&&((y<H-2?cov[i+2*W]:c)!==c||(y<H-3?cov[i+3*W]:c)!==c))col=SN_MID;
        else if(deep&&y<H-2&&!cov[i+2*W])col=SN_SH;else col=mask&&FL[i]===1&&cls[i]===ROOF?SN_MID:SN_BASE;}
      PB.u32[i]=col;}
    PA.put();PB.put();
    setHud(root,`1:${R}, cells of ${R}x${R} px`+(mask?', one value per class':''),'a');setHud(root,mask?'mask on, the eave is crisp':R===1?'1:1 needs no mask':`no mask, snow smears ${soft} px over the eave`,'b');
    const full=[0,230400,57600,0,14400][R];
    ro.innerHTML=`map 1:${R} · <b>${(b.cw*b.chh).toLocaleString('en-US')}</b> cells here, <b>${full.toLocaleString('en-US')}</b> bytes for 640x360 · snow drawn on <b>${onWall}</b> wall and outline pixels · it reaches <b>${soft} px</b> below the eave line<br>report §6a, measured bakes at this resolution (desktop / 6x throttle): sun shadow <b>${['','3.08 / 17.4','0.417 / 2.50','','0.064 / 0.389'][R]} ms</b> · exposure by row sweep <b>${['','0.490 / 3.25','0.137 / 0.808','','0.036 / 0.215'][R]} ms</b><br>the mask is static, so it uploads <b>0</b> bytes per frame and costs one alpha read per pixel`;}
  return {tick(){if(dirty){dirty=false;draw();}}};});

// ======================================================================
// E1 and 6d: flake size against tile size, and coverage against the 1% rule
// ======================================================================
reg('flakesize',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),W=160,H=90;
  const pine=mkPine(17,58,2),S=mkScene(W,H,512,300,26,[{st:pine,x:26,y:84,d:50}]),bg=S.u,FK=mkFlakes(W,H,11);drawChar(bg,W,H,VILL[0][4],112,74);
  // the chart
  const X=t=>44+t/72*344,Y=f=>212-f/14*196,st=(o)=>Object.entries(o).map(([k,v])=>k+':'+v).join(';');
  for(const t of [8,16,32,48,64]){svgEl('line',{x1:X(t),y1:Y(0),x2:X(t),y2:Y(14),style:'stroke:var(--line2,#35435f);stroke-width:1'},svg);svgText(svg,X(t),Y(0)+14,t,{'text-anchor':'middle','font-size':11,style:'fill:var(--mute,#8c98b0)'});}
  for(const f of [0,3,6,9,12]){svgEl('line',{x1:X(0),y1:Y(f),x2:X(72),y2:Y(f),style:'stroke:var(--line2,#35435f);stroke-width:1'},svg);svgText(svg,X(0)-6,Y(f)+4,f,{'text-anchor':'end','font-size':11,style:'fill:var(--mute,#8c98b0)'});}
  svgText(svg,X(36),244,'tile size, px',{'text-anchor':'middle','font-size':11.5,style:'fill:var(--mute,#8c98b0)'});svgText(svg,6,12,'flake, px',{'font-size':11.5,style:'fill:var(--mute,#8c98b0)'});
  svgEl('line',{x1:X(0),y1:Y(0),x2:X(72),y2:Y(13.5),style:'stroke:var(--warm,#ffd27a);stroke-width:1.4;stroke-dasharray:5 4'},svg);
  svgText(svg,X(72)+4,Y(9.6),'0.1875 of a tile',{'text-anchor':'end','font-size':11.5,style:'fill:var(--warm,#ffd27a)'});
  for(const [t,f,lab,dx,dy,an] of [[32,6,'VX Ace, 6 px',-9,-7,'end'],[48,9,'MV and MZ, 9 px',-9,-7,'end'],[64,12,'Stardew debris, 12 px',-9,-7,'end']]){svgEl('circle',{cx:X(t),cy:Y(f),r:4.5,style:'fill:var(--warm,#ffd27a)'},svg);svgText(svg,X(t)+dx,Y(f)+dy,lab,{'text-anchor':an,'font-size':11.5,style:'fill:var(--txt,#dbe2ee)'});}
  const dots={};for(const f of [1,2,3,6]){const s=2+f*1.1;dots[f]=svgEl('rect',{x:X(32)-s/2,y:Y(f)-s/2,width:s,height:s,style:'fill:var(--ice,#dfe9f5)'},svg);}
  dots[6].setAttribute('style','fill:none;stroke:var(--ice,#dfe9f5);stroke-width:1.6');dots[6].setAttribute('x',X(32)-8);dots[6].setAttribute('y',Y(6)-8);dots[6].setAttribute('width',16);dots[6].setAttribute('height',16);
  svgText(svg,X(32)+12,Y(2)+4,'Sandbox, 1, 2 and 3 px',{'font-size':11.5,style:'fill:var(--ice,#dfe9f5)'});const lg=svgText(svg,X(32)+13,Y(6)+16,'large mode adds 6 px',{'font-size':11,style:'fill:var(--ice,#dfe9f5)'});
  for(const f of [1,2])svgEl('rect',{x:X(8)-2,y:Y(f)-2,width:4,height:4,style:'fill:var(--mute,#8c98b0)'},svg);svgText(svg,X(8)+8,Y(.25),'VFX #1, 1 and 2 px',{'font-size':11,style:'fill:var(--mute,#8c98b0)'});
  let mode='mixed',cov=-1,fr=0;const sync=()=>{const on={1:[1],mixed:[1,2,3],large:[1,2,3,6]}[mode];for(const f in dots)dots[f].style.opacity=on.includes(+f)?1:.25;lg.style.opacity=mode==='large'?1:.35;cov=-1;};
  C.seg('sz',v=>{mode=v;sync();});sync();
  return {tick(dt){fr++;FK.step(dt);u.set(bg);const n=FK.far(u,mode)+FK.near(u,mode,bg,true);P.put();const c=n/W/H*100;cov=cov<0?c:cov+(c-cov)*.04;
    if(fr%10===1){setHud(root,cov.toFixed(2)+'% of the pixels');
      ro.innerHTML=`${mode==='1'?'1 px only':mode==='mixed'?'mixed, 1, 2 and 3 px':'large, up to 6 px'} · <b>${FK.nf+FK.nm+FK.nn}</b> flakes in the pool for this strip, the density of 1,010 on 640x360 · flake pixels now <b>${n}</b> of ${(W*H).toLocaleString('en-US')}, <b>${cov.toFixed(2)}%</b><br>the 1% rule: VX Ace <b>1.27%</b> · MV <b>0.89%</b> · VFX #1 <b>1.03%</b> · Sandbox measured <b>0.9 to 0.97%</b> mixed and <b>0.39%</b> at 1 px<br>report §6a, measured update and draw at 640x360: 456 flakes <b>0.015 / 0.086 ms</b> · 1,824 flakes <b>0.050 / 0.300 ms</b> (desktop / 6x throttle). Cost follows the count, not the size`;}}};});

// ======================================================================
// E2: Stardew's tiled animated cell
// ======================================================================
reg('tiledcell',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=96,WW=256;
  const pine=mkPine(17,58,4),pine2=mkPine(15,50,6),rock=mkRock(20,14,3),S=mkScene(WW,H,640,420,34,[{st:pine,x:40,y:60,d:60},{st:pine2,x:214,y:52,d:60},{st:rock,x:150,y:30,d:60}]),bg=S.u;drawChar(bg,WW,H,HERO[0][4],118,82);duskAll(bg);
  function mkCell(n){const r=rng(n*7+5),k=n/16,fl=[],cnt=n===16?5:7;for(let i=0;i<cnt;i++)fl.push({x:(r()*n)|0,y:(r()*n)|0,v:1+((r()*2)|0),ph:r()*6.283,s:n===16?(i<3?0:1):(i<4?1:2)});
    const fr=[];for(let f=0;f<16;f++){const m=new Uint8Array(n*n);for(const q of fl){const x=q.x+Math.round(Math.sin(f/16*6.283+q.ph)*k),y=q.y+q.v*f*k,sh=SHAPES[q.s];for(let j=0;j<sh.length;j+=2)m[(((y+sh[j+1])%n+n)%n)*n+((x+sh[j])%n+n)%n]=1;}fr.push(m);}
    return {n,fr,cnt};}
  const CELLS={16:mkCell(16),32:mkCell(32)};let n=16,t=0,cam=0,dir=1,fr=0;C.seg('n',v=>{n=+v;});C.on('cam',()=>{C.el('auto').checked=false;});
  return {tick(dt){fr++;t+=dt;const auto=C.v('auto');if(auto){cam+=dir*dt*18;if(cam>=96){cam=96;dir=-1;}if(cam<=0){cam=0;dir=1;}C.el('cam').value=Math.round(cam);}else cam=C.v('cam');
    const cx=Math.round(cam),cell=CELLS[n],m=cell.fr[Math.floor(t/.075)%16],tint=C.v('tint'),sh=n===16?4:5;C.out('cam',cx+' px');
    for(let y=0;y<H;y++){const ry=(y&(n-1))*n,py=y>>sh;for(let x=0;x<W;x++){const wx=x+cx;let c=bg[y*WW+wx];if(tint&&((wx>>sh)+py)&1)c=mix32(c,GOLD,.2);if(m[ry+(wx&(n-1))])c=mix32(c,SPARK,.8);u[y*W+x]=c;}}
    P.put();
    if(fr%10===1){const cols=Math.ceil((W+(cx&(n-1)))/n),rows=Math.ceil(H/n);setHud(root,'frame '+(Math.floor(t/.075)%16+1)+' of 16');
      ro.innerHTML=`cell <b>${n}x${n} px</b>, ${n===16?'half a tile':'one tile'} · 16 frames at 75 ms, a loop of 1.2 s · <b>${cell.cnt}</b> flakes drawn once, shown in <b>${cols*rows}</b> cells of this view<br>state per flake <b>0 bytes</b> · Stardew draws about <b>273</b> quads at 1280x720. A repeat shader does it in 1 draw and 1 fetch per pixel<br>report §6a, measured: two hashed flake layers inside the ground shader <b>0.005 ms</b> on Metal and <b>0.073 ms</b> on software GL`;}}};});

// ======================================================================
// E3: z-height flakes in three sizes, with shadow dots
// ======================================================================
reg('zflakes',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),W=160,H=96;
  const pine=mkPine(18,62,7),rock=mkRock(22,15,4),S=mkScene(W,H,800,520,58,[{st:pine,x:132,y:66,d:70},{st:rock,x:34,y:34,d:70}]),bg=S.u,FK=mkFlakes(W,H,23,18),N=FK.N;drawChar(bg,W,H,HERO[0][4],64,70);duskAll(bg);FK.sdw=c=>pack((c&255)*.56,(c>>>8&255)*.6,(c>>>16&255)*.76);
  const fy=new Float32Array(64);for(let q=0;q<64;q++)fy[q]=N.y[q]-N.z[q];let fr=0,lands=0;
  return {tick(dt){fr++;const zOn=C.v('z'),shOn=C.v('sh'),ln=C.v('line');FK.nn=C.v('n');C.out('n',FK.nn);const l0=FK.lands.length;FK.step(dt);if(FK.lands.length>l0)lands+=FK.lands.length-l0;
    u.set(bg);FK.far(u,'mixed');
    if(zOn){for(const L of FK.lands){const [x,y]=L;if(x>=1&&y>=1&&x<W-2&&y<H-1){u[y*W+x]=SN_HI;u[y*W+x+1]=SN_HI;if(L[2]>.1){u[(y-1)*W+x]=SN_HI;u[(y-1)*W+x+1]=SN_HI;}}}
      if(ln)for(let q=0;q<FK.nn;q++){const gx=N.x[q]|0,gy=N.y[q]|0,ty=(N.y[q]-N.z[q])|0;if(gx<0||gx>=W||N.z[q]>=70)continue;for(let y=Math.max(0,ty+3);y<Math.min(H,gy);y+=2)u[y*W+gx]=GOLD;}
      FK.near(u,'mixed',bg,shOn);}
    else{for(let q=0;q<FK.nn;q++){fy[q]+=FK.fall[2]*dt*(.85+.3*Math.sin(N.ph[q]));if(fy[q]>H+6)fy[q]=-6-((q*37)%30);const x=N.x[q]|0,sp=N.sh[q]<10?3:2;putShape(u,W,H,x-1,(fy[q]|0)-1,sp,SPARK,FLAKE_M);}}
    P.put();
    if(fr%10===1){setHud(root,zOn?(shOn?'':'no dots, so nothing pins a flake to the ground'):'no height, a flat overlay that never lands');
      ro.innerHTML=`near <b>${FK.nn}</b> flakes ${zOn?'with height':'without height'}, 3 px, 64 px/s · mid <b>${FK.nm}</b> at 2 px, 42 px/s · far <b>${FK.nf}</b> at 1 px, 26 px/s · the Sandbox's density would be 9 near flakes on this view<br>${zOn?`landed on their dots so far <b>${lands}</b> · each landing adds 2 depth units in the Sandbox`:'landings <b>0</b>. Without z there is no ground point to land on'}<br>report §6a, measured update and draw at 640x360: 60 near flakes with shadows plus 520 stateless far flakes <b>0.017 / 0.089 ms</b> (desktop / 6x throttle)`;}}};});

// ======================================================================
// E4: fall speed in tiles per second, whole pixels, world lock
// ======================================================================
reg('flakemotion',root=>{const cv=$('canvas',root),P=PX(cv),u=P.u32,C=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),W=160,H=96,WW=480;
  const pines=[mkPine(17,58,1),mkPine(15,50,2),mkPine(18,62,3)],rock=mkRock(22,15,6);
  const S=mkScene(WW,H,960,640,46,[{st:pines[0],x:52,y:54,d:60},{st:pines[1],x:150,y:44,d:60},{st:rock,x:214,y:40,d:60},{st:pines[2],x:292,y:56,d:60},{st:pines[1],x:372,y:46,d:60},{st:rock,x:108,y:52,d:60},{st:pines[0],x:446,y:52,d:60}]),bg=duskAll(S.u),HD=HERO[2].map(f=>duskAll(f.slice()));
  // speed scale, drawn at the svg's own width so the type keeps one size on a phone and on a desktop
  let X=v=>v,needle=null,sw=0;
  function scale(){const w=Math.max(280,Math.round(svg.getBoundingClientRect().width)||400);if(w===sw)return;sw=w;svg.textContent='';svg.setAttribute('viewBox','0 0 '+w+' 64');
    X=v=>22+(v-.4)/5.4*(w-44);const mut='fill:var(--mute,#8c98b0)',txt='fill:var(--txt,#dbe2ee)',ice='fill:var(--ice,#dfe9f5)',warm='fill:var(--warm,#ffd27a)';
    svgEl('line',{x1:X(.5),y1:40,x2:X(5.6),y2:40,style:'stroke:var(--line2,#35435f);stroke-width:2'},svg);
    for(let v=1;v<=5;v++){svgEl('line',{x1:X(v),y1:37,x2:X(v),y2:43,style:'stroke:var(--mute,#8c98b0);stroke-width:1'},svg);svgText(svg,X(v),61,v,{'text-anchor':'middle','font-size':11,style:mut});}
    svgText(svg,w-4,61,'tiles/s',{'text-anchor':'end','font-size':11,style:mut});
    for(const [a,b,v,lab,ly,an] of [[.5,.64,.55,'Stardew',12,'start'],[1.9,2.3,2.1,'Emerald',12,'start'],[2,2,2,'Sandbox',26,'end'],[3.7,3.7,3.7,'MV',26,'middle'],[5.6,5.6,5.6,'VX Ace',26,'end']]){const g=svgEl('g',{style:'cursor:pointer'},svg);
      svgEl('rect',{x:X(v)-16,y:0,width:32,height:50,style:'fill:transparent'},g);
      if(b>a)svgEl('rect',{x:X(a),y:35,width:Math.max(4,X(b)-X(a)),height:10,rx:2,style:warm+';opacity:.85'},g);else svgEl('rect',{x:X(a)-1.5,y:31,width:3,height:18,style:lab==='Sandbox'?ice:warm},g);
      svgText(g,an==='start'?X(a):an==='end'?X(v)+(lab==='Sandbox'?3:6):X(v),ly,lab,{'text-anchor':an,'font-size':12,style:lab==='Sandbox'?ice:txt});g.addEventListener('click',()=>{C.el('v').value=v;});}
    needle=svgEl('path',{d:'M0 0',style:'fill:#ffffff'},svg);}
  scale();if(typeof ResizeObserver!=='undefined')new ResizeObserver(scale).observe(svg);
  // flakes: three hashed layers. World x is wrapped into the camera box, as Mindustry does
  const r=rng(31),ww=W+40,hh=H+20,NL=[52,28,16],FL=[];for(let l=0;l<3;l++)for(let k=0;k<NL[l];k++)FL.push({l,x:r()*ww,y:r()*hh,p:r()});
  const oy=[0,0,0],COL=[FLAKE_F,FLAKE_M,SPARK],RAT=[26/64,42/64,1];
  let px='whole',lock='world',t=0,fr=0,wx=90,dir=1,cam=0,walk=0;C.seg('px',v=>{px=v;});C.seg('lock',v=>{lock=v;});
  const splat=(x,y,col)=>{const x0=Math.floor(x),y0=Math.floor(y),tx=x-x0,ty=y-y0;for(let j=0;j<2;j++)for(let i=0;i<2;i++){const X2=x0+i,Y2=y0+j,w=(i?tx:1-tx)*(j?ty:1-ty);if(w<.02||X2<0||Y2<0||X2>=W||Y2>=H)continue;const q=Y2*W+X2;u[q]=mix32(u[q],col,w);}};
  return {tick(dt){fr++;t+=dt;const v=C.v('v'),pan=C.v('pan');C.out('v',v.toFixed(1)+' tiles/s');
    if(pan){wx+=dir*80*dt;walk+=80*dt;if(wx>WW-70){wx=WW-70;dir=-1;}if(wx<70){wx=70;dir=1;}}
    cam=clamp(Math.round(wx)-80,0,WW-W);for(let y=0;y<H;y++)u.set(bg.subarray(y*WW+cam,y*WW+cam+W),y*W);
    drawChar(u,W,H,HD[pan?((walk/8)|0)&3:4],Math.round(wx)-cam,76,dir<0);
    for(let l=0;l<3;l++)oy[l]+=v*32*RAT[l]*dt;
    for(const f of FL){const ph=f.p*6.283,sw=[4,6,8][f.l],wxf=f.x+Math.sin(ph+t*1.3)*sw+(-.4*[14,26,44][f.l])*t,sxf=(((wxf-(lock==='world'?cam:0))%ww)+ww)%ww-20,syf=((f.y+oy[f.l]*(.85+.3*f.p))%hh)-10;
      if(px==='whole')putShape(u,W,H,(sxf|0)-(f.l>1?1:0),(syf|0)-(f.l>1?1:0),f.l,COL[f.l],COL[f.l]);
      else{const m=SHAPES[f.l];for(let k=0;k<m.length;k+=2)splat(sxf+m[k]-(f.l>1?1:0),syf+m[k+1]-(f.l>1?1:0),COL[f.l]);}}
    P.put();needle.setAttribute('d',`M${X(v).toFixed(1)} 45l-5 7h10z`);
    if(fr%10===1){const pps=v*32,near=v<=.7?"Stardew's debris":v>=1.9&&v<=2.3?"Emerald's range, the Sandbox's pick":v>=3.6&&v<=3.8?'RPG Maker MV, sleet next to Emerald':v>=5.5?'RPG Maker VX Ace':v<1.9?'between Stardew and Emerald':'faster than Emerald';
      setHud(root,(lock==='world'?'world-locked':'screen-locked')+' · '+(px==='whole'?'whole pixels':'sub-pixel'));
      ro.innerHTML=`near layer <b>${v.toFixed(1)} tiles/s</b> = <b>${Math.round(pps)} px/s</b>, ${(pps/60).toFixed(2)} px per frame at 60 fps · mid ${Math.round(pps*RAT[1])} px/s · far ${Math.round(pps*RAT[0])} px/s<br>a near flake crosses this 3-tile view in <b>${(H/pps).toFixed(1)} s</b> · ${near}<br>${lock==='world'?'world-locked, so flakes keep their place over the ground while the view pans at 80 px/s':'screen-locked, so flakes ignore the camera and slide over the ground with the walker'} · ${px==='whole'?'whole-pixel steps, hard 1, 2 and 3 px shapes':'sub-pixel positions, each flake pixel spread over up to 4 pixels'}<br>cost: <b>nothing extra</b> for speed or lock (report E4)`;}}};});
}
