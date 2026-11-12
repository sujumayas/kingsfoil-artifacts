// Magic study: figures 1 (hero, timeline, effectclock, missile, areamask, battlescript, missilechain, packets, darkflash, dirframes, flightpaths, homing, lob) and the stack
// Everything sits in one block so helper names stay local to this file.
{
// ----------------------------------------------------------------------
// shared bits for this file: pixel writers, element ramps, baked sprites
// ----------------------------------------------------------------------
const put=(u,W,H,x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=c;};
const putD=(u,W,H,x,y,c,op)=>{if(x>=0&&y>=0&&x<W&&y<H&&(op>=16||BAYER[(y&3)*4+(x&3)]<op))u[y*W+x]=c;};
const rect=(u,W,H,x,y,w,h,c)=>{for(let j=Math.max(0,y);j<Math.min(H,y+h);j++)for(let i=Math.max(0,x);i<Math.min(W,x+w);i++)u[j*W+i]=c;};
const dark=(u,W,H,x,y,k)=>{if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=mulc(u[y*W+x],k,k,k);};
const INK=U('#15111c'),WHT=U('#ffffff');
// element ramps: index 1 dark hue-shifted edge .. 5 light core, 6 pure white (peak frame only)
const RHEX=[['#4a1024','#b8281c','#f07818','#ffd040','#fff8dc'],['#141e5c','#2860c0','#50b0ec','#b0ecff','#e8faff'],['#28146c','#6040e0','#a088ff','#dcd2ff','#f2eeff'],
  ['#0c3018','#28802c','#78cc28','#d4f458','#f6ffd0'],['#5c3808','#c08418','#f4c848','#fff0a0','#fffbe4'],['#400848','#a8248c','#f058c4','#ffb0e8','#ffeaf8']];
const RAMP=RHEX.map(r=>Uint32Array.from(['#000000'].concat(r,['#ffffff']),U));
const FIRE=0,ICE=1,ENERGY=2,POISON=3,HOLY=4,ARCANE=5;
function line(u,W,H,x0,y0,x1,y1,c,op=16){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;
  for(let n=0;n<640;n++){putD(u,W,H,x0,y0,c,op);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}}
// ellipse arc, angles in turns: 0 right, .25 bottom (front), .75 top (back)
function ell(u,W,H,cx,cy,rx,ry,c,a0=0,a1=1,skip=0,op=16){const n=Math.max(8,((rx+ry)*3.4)|0),i0=Math.floor(a0*n),i1=Math.ceil(a1*n);let lx=-999,ly=-999;
  for(let i=i0;i<=i1;i++){if(skip&&(i&skip))continue;const a=i/n*6.2832,x=Math.round(cx+Math.cos(a)*rx),y=Math.round(cy+Math.sin(a)*ry);if(x===lx&&y===ly)continue;lx=x;ly=y;putD(u,W,H,x,y,c,op);}}
// 3x5 font for labels inside pixel canvases
const FSRC={'0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111',A:'111101111101101',B:'110101110101110',C:'111100100100111',D:'110101101101110',E:'111100111100111',F:'111100111100100',G:'111100101101111',H:'101101111101101',I:'111010010010111',J:'001001001101111',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'111101101101101',O:'111101101101111',P:'111101111100100',Q:'111101101111001',R:'111101110101101',S:'111100111001111',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111','-':'000000111000000','+':'000010111010000','.':'000000000000010',':':'000010000010000','>':'100010001010100','/':'001001010100100','=':'000111000111000'};
function txt(u,W,H,s,x,y,c,sh=INK){s=String(s).toUpperCase();for(let n=0;n<s.length;n++){const g=FSRC[s[n]];if(g)for(let k=0;k<15;k++)if(g[k]==='1'){const px=x+n*4+k%3,py=y+(k/3|0);if(sh!==null)put(u,W,H,px+1,py+1,sh);put(u,W,H,px,py,c);}}}
// ramp-indexed sprite: 0 clear, 1 dark edge .. 5 light core, 6 white. A 1 px dark outline is added around the body.
function bake(sz,fn,noOut){const w=sz*2+1,d=new Uint8Array(w*w);for(let y=0;y<w;y++)for(let x=0;x<w;x++)d[y*w+x]=fn(x-sz,y-sz)|0;const o=d.slice();if(noOut)return {w,h:w,ox:sz,oy:sz,d:o};
  for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x;if(d[i])continue;if((x>0&&d[i-1]>1)||(x<w-1&&d[i+1]>1)||(y>0&&d[i-w]>1)||(y<w-1&&d[i+w]>1))o[i]=1;}return {w,h:w,ox:sz,oy:sz,d:o};}
// draw a baked sprite centred on (x,y). op 0..16 is ordered-dither opacity; top caps the ramp index (5 = no white frame)
function rb(u,W,H,s,x,y,rp,op=16,top=6){const d=s.d,w=s.w;x=Math.round(x)-s.ox;y=Math.round(y)-s.oy;for(let j=0,k=0;j<s.h;j++)for(let i=0;i<w;i++,k++){const v=d[k];if(v)putD(u,W,H,x+i,y+j,rp[v>top?top:v],op);}}
// nearest-neighbour run-time rotation of a baked sprite (the anti-pattern of B1)
function rbRot(u,W,H,s,x,y,a,rp){const c=Math.cos(a),sn=Math.sin(a),o=s.ox,w=s.w,d=s.d,xi=Math.round(x),yi=Math.round(y);for(let j=-o;j<=o;j++)for(let i=-o;i<=o;i++){const uu=Math.round(i*c+j*sn)+o,v=Math.round(-i*sn+j*c)+o;if(uu<0||v<0||uu>=w||v>=w)continue;const q=d[v*w+uu];if(q)put(u,W,H,xi+i,yi+j,rp[q]);}}
// missile shapes in (u forward, v sideways): bolt with a tail, shard, orb, ringed orb
const SHAPES=[
  (u,v)=>{const av=Math.abs(v);if(u>0){const r=Math.hypot(u,v);return r<1.3?5:r<2.3?4:r<3.2?3:0;}const hw=3.2*(1+u/10);if(hw<=0)return 0;return av<hw*.3&&u>-4?5:av<hw*.6?(u>-6?4:3):av<hw?(u>-5?3:2):0;},
  (u,v)=>{const q=Math.abs(v)/2.3+Math.abs(u+1)/(u>-1?5.5:7);if(q>=1)return 0;return Math.abs(v)<.6?5:v<0?4:u<-4?2:3;},
  (u,v)=>{const r=Math.hypot(u,v);if(r<3.3)return Math.hypot(u+1,v+1)<1.1?5:r<1.9?4:r<2.7?3:2;return 0;},
  (u,v)=>{const r=Math.hypot(u,v);return r<1.2?5:r<2.2?4:r<3.2?3:r>3.9&&r<4.8&&(((Math.atan2(v,u)+3.2)*1.9|0)&1)?4:0;}];
const dirSet=(fn,nd,sz=11)=>{const a=[];for(let i=0;i<nd;i++){const an=i*6.2832/nd,c=Math.cos(an),s=Math.sin(an);a.push(bake(sz,(x,y)=>fn(x*c+y*s,-x*s+y*c)));}return a;};
// MS[shape][0] = 8 directions, MS[shape][1] = 16 directions; direction 0 points right, angles grow clockwise on screen
const MS=SHAPES.map(fn=>[dirSet(fn,8),dirSet(fn,16)]);
const dir8=a=>Math.round(a/.7854)&7,dir16=a=>Math.round(a/.3927)&15;
// flipbooks: flash, core, broken ring, sparks, fragments. One shape language per element. n frames, scale sc.
function bakeBook(el,n,sc){const fr=[];for(let f=0;f<n;f++){const p=n>1?f/(n-1):0,R=lerp(4.2,10.6,Math.pow(p,.62)),top=Math.round(lerp(5,2.7,p)),drop=p<.3?0:(p-.3)/.7*.55;let ho0=p<.2?0:lerp(0,6.6,(p-.2)/.8);
  fr.push(bake(Math.ceil(13*sc),(x,y)=>{let r=Math.hypot(x,y)/sc,m=1,ho=ho0;const a=Math.atan2(y,x);
    if(el===0)m=1+.17*Math.sin(a*5+f)+.1*Math.sin(a*3-f*2);
    else if(el===1){m=.42+.8*Math.pow(Math.abs(Math.cos(a*3+.5)),7);ho*=.6;}
    else if(el===2){m=.45+.85*hash2(((a+3.2)*2.3)|0,f*3+1);}
    else if(el===3)m=1+.24*Math.sin(a*4+f*.7);
    else if(el===4){m=.5+1.05*Math.pow(Math.abs(Math.cos(a*2)),16);ho*=1.25;}
    else{r=(f&1?Math.max(Math.abs(x),Math.abs(y))*1.12:(Math.abs(x)+Math.abs(y))*.8)/sc;}
    const ro=R*m;if(r>=ro||r<ho)return 0;if(drop&&hash2(x*7+f*31+el,y*13)<drop)return 0;
    const t=(r-ho)/(ro-ho),tt=ho>0?Math.abs(t-.45)*1.8:t;return f===0&&t<.55?6:Math.max(2,Math.round(top-tt*(top-2)));},p>.55));}return fr;}
const SPK=[],SPKS=[],TFX=[];for(let e=0;e<6;e++){SPK.push(bakeBook(e,5,1));SPKS.push(bakeBook(e,5,.58));TFX.push(bakeBook(e,8,.62));}
// characters: direct colour, drawn with the feet at (x,y)
function mkSpr(rows,pal){const h=rows.length,w=rows[0].length,d=new Uint32Array(w*h);rows.forEach((r,j)=>{for(let i=0;i<w;i++)if(r[i]!=='.')d[j*w+i]=pal[r[i]];});return {w,h,d};}
const MAGE=['.....oo.....','....ohho....','...ohhhho...','..ohhbbhho..','.oHHHHHHHHo.','..osssssso..','..osesseso..','..oossssoo..','.orrrbbrrro.','orrrrbbrrrro','osorrbbrroso','.oorrrrrroo.','.orrrrrrrro.','.orRrrrrRro.','.oRRRooRRRo.','..ooo..ooo..'];
const MAGE3=MAGE.slice(0,7).concat(['oso.ssss.oso','oroorbbrooro','.orrrbbrrro.','..orrbbrro..']).concat(MAGE.slice(11));
const mpal=(h,H2,r,R,b)=>({o:INK,h:U(h),H:U(H2),s:U('#eab98e'),e:U('#22161e'),r:U(r),R:U(R),b:U(b)});
const mage=p=>[mkSpr(MAGE,p),mkSpr(MAGE3,p)];
const SP_MAGE=mage(mpal('#5868e0','#38409c','#4a58cc','#2f3890','#ffd050'));
const SP_CROWD=[['#a04848','#703030','#8c4040','#5e2a2a','#d0c090'],['#4c8050','#305838','#44744a','#2a4e32','#d0c090'],['#3c7c84','#28565c','#367078','#224a50','#c8c8c8'],['#806040','#58422c','#74583c','#4c3a28','#c8b070'],['#70707c','#4c4c58','#666672','#44444e','#b0b0c0'],['#a8703c','#744c28','#986636','#684422','#e0d0a0']].map(c=>mage(mpal(...c)));
const SP_DUMMY=mkSpr(['....oooo....','...oyyyyo...','...oyYYyo...','...oyyyyo...','.ooooyyoooo.','owwwyyyywwwo','.oooyrryooo.','..oyrttryo..','..oyrttryo..','..oyyrryyo..','..oyYyyYyo..','...oooooo...','....owwo....','....owwo....','...oowwoo...','...oooooo...'],{o:INK,y:U('#d8b860'),Y:U('#a88838'),w:U('#7a5230'),r:U('#c03028'),t:U('#f0f0e0')});
const SP_BRAZ=mkSpr(['.oooooooo.','okkKKKKkko','.okkkkkko.','..okkkko..','...okko...','...okko...','..ookkoo..','.okkkkkko.','.oooooooo.'],{o:INK,k:U('#8a6a3a'),K:U('#f07818')});
const SP_PIL=(()=>{const w=14,h=30,d=new Uint32Array(w*h),c=['#a0a0b0','#8a8a9c','#727288','#565668'].map(U);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;const cap=y<4||y>25,x0=cap?0:2,x1=cap?13:11;if(x<x0||x>x1)continue;
    if(x===x0||x===x1||y===0||y===h-1||y===4||y===25)v=INK;else{const q=(x-x0)/(x1-x0);v=cap?(y<4?c[q<.5?0:1]:c[q<.5?2:3]):c[q<.25?0:q<.5?1:q<.8?2:3];if(!cap&&(x===5||x===8))v=c[3];if(!cap&&hash2(x,y)>.93)v=c[3];}d[y*w+x]=v;}return {w,h,d};})();
function spr(u,W,H,s,x,y,flip=false,tint=null){const w=s.w,d=s.d;x=Math.round(x)-(w>>1);y=Math.round(y)-s.h+1;for(let j=0;j<s.h;j++){const yy=y+j;if(yy<0||yy>=H)continue;for(let i=0;i<w;i++){const c=d[j*w+(flip?w-1-i:i)];if(!c)continue;const xx=x+i;if(xx>=0&&xx<W)u[yy*W+xx]=tint?tint(c):c;}}}
const shadow=(g,W,H,cx,cy,rx)=>{for(let j=-2;j<=2;j++)for(let i=-rx;i<=rx;i++)if(i*i/(rx*rx)+j*j/5<1)dark(g,W,H,cx+i,cy+j,.6);};
// a ruined-courtyard floor: 16 px stone slabs with mortar lines, cracks and moss. grass=true adds a grass rim. Returns Uint32Array.
function court(W,H,seed=1,grass=true,dim=1){const G=new Uint32Array(W*H),S=['#474b59','#505462','#5a5e6c'].map(U),MORT=U('#2b2d38'),GR=['#2c5a34','#35703a','#418240','#6aa84a'].map(U);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const e=Math.min(x,W-1-x,y,H-1-y),n=vnoise(x/22+seed,y/22)*13+vnoise(x/7+9,y/7+seed)*5;let c;
    if(grass&&e<5+n*.8){const g=hash2(x+seed,y),v=vnoise(x/9,y/9+seed);c=v>.62?GR[2]:v>.35?GR[1]:GR[0];if(g>.94)c=GR[3];if(g<.003)c=U('#e8d860');}
    else{const T=hash2((x>>4)+seed*3,(y>>4)+50),base=S[T>.66?2:T>.33?1:0],mx=x&15,my=y&15;
      if(mx===0||my===0)c=MORT;else if(mx===1||my===1)c=mix32(base,WHT,.07);else if(mx===15||my===15)c=mulc(base,.84,.84,.84);
      else{c=base;const g=hash2(x+7,y+3+seed);if(g<.07)c=mulc(base,.87,.87,.87);else if(g>.95)c=mix32(base,WHT,.06);}
      if(vnoise(x/18+40+seed,y/18+40)>.68&&hash2(x,y+9)>.35)c=mix32(c,GR[0],.55);if(grass&&e<8+n*.8)c=mix32(c,GR[0],.4);}
    G[y*W+x]=dim<1?mulc(c,dim,dim,dim):c;}
  const rng=mkRng(seed*97+5);for(let k=0;k<Math.round(W*H/3200);k++){let x=8+rng()*(W-16)|0,y=6+rng()*(H-30)|0;const len=6+rng()*14|0;for(let j=0;j<len;j++){if(x>2&&x<W-2&&y<H-2)G[y*W+x]=dim<1?mulc(MORT,dim,dim,dim):MORT;x+=((rng()*3)|0)-1;y++;}}
  return G;}
// midpoint displacement between two points: gen generations, 2^gen segments, offset halves each time. Fills X,Y (Float32Array) and returns the point count.
function bolt(X,Y,x0,y0,x1,y1,gen,amp,rng){let n=1;X[0]=x0;Y[0]=y0;X[1]=x1;Y[1]=y1;const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  for(let g=0;g<gen;g++){for(let i=n;i>=1;i--){X[i*2]=X[i];Y[i*2]=Y[i];}for(let i=0;i<n;i++){const o=(rng()*2-1)*amp;X[i*2+1]=(X[i*2]+X[i*2+2])/2+nx*o;Y[i*2+1]=(Y[i*2]+Y[i*2+2])/2+ny*o;}n*=2;amp*=.5;}return n+1;}
const flightMs=tiles=>150*Math.sqrt(tiles);

// ======================================================================
// HERO: a live courtyard. Rune circle (D5), 8-direction fire bolt on the
// 150 x sqrt(tiles) clock (A2, B1) with a ribbon read back from the path
// function (B2, B5), 75 ms sparks (A1, C1), midpoint chain lightning (B7),
// a heal (D2) and a crowd drawn reduced (F1). Timed with performance.now().
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=320,H=180,btns=$$('.hero-tiers button',root),m=meter(.05);
  const G=court(W,H,3),M={x:76,y:106,castT:0,spr:SP_MAGE},D=[{x:224,y:76,sh:0},{x:254,y:134,sh:0}];
  const PIL=[[38,52],[284,52]],BRZ=[[122,36],[198,36]];
  const CR=[[30,142],[60,162],[106,168],[160,170],[208,166],[298,100],[300,152],[166,26]].map((p,i)=>({x:p[0],y:p[1],castT:0,spr:SP_CROWD[i%6],cd:.4+i*.37,el:[FIRE,ICE,ARCANE,POISON][i%4]}));
  PIL.forEach(p=>shadow(G,W,H,p[0]+2,p[1]+1,9));BRZ.forEach(p=>shadow(G,W,H,p[0],p[1]+1,6));shadow(G,W,H,M.x,M.y+1,6);D.forEach(d=>shadow(G,W,H,d.x,d.y+1,6));CR.forEach(c=>shadow(G,W,H,c.x,c.y+1,6));
  const FX=[],SCH=[],EV=[],BX=new Float32Array(40),BY=new Float32Array(40);let t=0,auto=.6,seq=0,crowd=false,hud=0,ids=1;
  const after=(s,fn)=>SCH.push({t:t+s,fn}),ev=b=>EV.push({t,b});
  const SIDES={[FIRE]:3,[ICE]:6,[ENERGY]:4,[HOLY]:8,[ARCANE]:5,[POISON]:4};
  function bolt1(c,tg,el,tier){const x0=c.x+5,y0=c.y-11,d=Math.hypot(tg.x-x0,tg.y-8-y0),dur=flightMs(d/16)/1000;ev(11);
    FX.push({k:1,t:0,dur,x0,y0,tg,el,tier,side:(ids++&1)?1:-1,amp:d*.09,sp:el===ICE?1:el===ARCANE?3:el===POISON?2:0,end(){FX.push({k:2,t:0,dur:.375,x:tg.x,y:tg.y-8,el,tier,id:ids++});tg.sh=.16;ev(9);}});}
  function cast(c,kind,tier){if(c.castT>0)return false;const el=kind===0?(tier?c.el:FIRE):kind===1?ENERGY:HOLY,ct=tier?.3:.45;c.castT=ct+.12;ev(8);
    FX.push({k:0,t:0,dur:ct+.4,cast:ct,c,el,tier});
    after(ct,()=>{if(kind===0)bolt1(c,D[tier?(ids&1):seq&1],el,tier);
      else if(kind===1){FX.push({k:3,t:0,dur:.3,pts:[[c.x+5,c.y-12],[D[0].x,D[0].y-8],[D[1].x,D[1].y-8]],tier,id:ids++});ev(9);ev(9);
        FX.push({k:2,t:0,dur:.375,x:D[0].x,y:D[0].y-8,el:ENERGY,tier,id:ids++});D[0].sh=.16;after(.06,()=>{FX.push({k:2,t:0,dur:.375,x:D[1].x,y:D[1].y-8,el:ENERGY,tier,id:ids++});D[1].sh=.16;});}
      else{FX.push({k:4,t:0,dur:.9,c,tier});ev(9);}});
    return true;}
  const posOf=(f,q)=>{q=clamp(q,0,1);const tx=f.tg.x,ty=f.tg.y-8,dx=tx-f.x0,dy=ty-f.y0,L=Math.hypot(dx,dy)||1,b=Math.sin(q*Math.PI)*f.amp*f.side;return [f.x0+dx*q-dy/L*b,f.y0+dy*q+dx/L*b];};
  function player(k){if(cast(M,k,0)){btns.forEach((b,i)=>{if(i<3)b.classList.toggle('on',i===k);});seq++;}}
  btns.forEach((b,i)=>b.addEventListener('click',()=>{if(i<3){player(i);auto=3;}else{crowd=!crowd;b.classList.toggle('on',crowd);b.setAttribute('aria-pressed',crowd);}}));
  function under(f){const rp=RAMP[f.el===undefined?HOLY:f.el],op=f.tier?6:16;
    if(f.k===0){const c=f.c,p=Math.min(1,f.t/f.cast),fade=f.t>f.cast?Math.max(1,Math.round(op*(1-(f.t-f.cast)/(f.dur-f.cast)))):op,rot=f.t*40/360,cx=c.x,cy=c.y,n=SIDES[f.el];
      ell(u,W,H,cx,cy,13,6,rp[3],rot-.25,rot-.25+p,0,fade);if(p>=1)ell(u,W,H,cx,cy,10,5,rp[2],0,1,1,fade);
      for(let i=0;i<n;i++){if(i/n>p)break;const a=(rot+i/n)*6.2832,b=(rot+(i+1)/n)*6.2832;line(u,W,H,cx+Math.cos(a)*9,cy+Math.sin(a)*4.2,cx+Math.cos(b)*9,cy+Math.sin(b)*4.2,rp[i/n+1/n<=p+.01?4:3],fade);}
      for(let i=0;i<8;i++){if(i/8>p)break;const a=(rot+i/8)*6.2832;putD(u,W,H,Math.round(cx+Math.cos(a)*16),Math.round(cy+Math.sin(a)*7.4),rp[5],fade);}}
    else if(f.k===4){const p=f.t/f.dur,r=3+p*11,c=f.c;ell(u,W,H,c.x,c.y,r,r*.45,RAMP[HOLY][p<.3?5:p<.6?4:3],0,1,p>.7?1:0,op);ell(u,W,H,c.x,c.y-p*17,7,3,RAMP[HOLY][3],.5,1,0,op);}}
  function over(f){const rp=RAMP[f.el===undefined?HOLY:f.el],own=!f.tier,op=own?16:6,top=own?6:5;
    if(f.k===0){const c=f.c,p=Math.min(1,f.t/f.cast),hx=c.x+5,hy=c.y-12;if(f.t<f.cast+.1){put(u,W,H,hx,hy,rp[2+Math.round(p*3)]);if(p>.5){put(u,W,H,hx-1,hy,rp[3]);put(u,W,H,hx+1,hy,rp[3]);put(u,W,H,hx,hy-1,rp[3]);put(u,W,H,hx,hy+1,rp[3]);}
        if(own)for(let i=0;i<5;i++){const q=(f.t*2.2+i/5)%1,a=i*1.9+f.t,r=(1-q)*12;put(u,W,H,hx+Math.cos(a)*r,hy+Math.sin(a)*r*.7,rp[q>.6?4:3]);}}}
    else if(f.k===1){const q=f.t/f.dur,n=own?8:4,st=.022/f.dur;let [px,py]=posOf(f,q-n*st);
      for(let k=n-1;k>=0;k--){const [x,y]=posOf(f,q-k*st),c=rp[k<2?4:k<4?3:k<6?2:1];line(u,W,H,px,py,x,y,c,op);if(k<4&&own){line(u,W,H,px,py+1,x,y+1,c,op);if(k<2)line(u,W,H,px+1,py,x+1,y,rp[5],op);}px=x;py=y;}
      const [ax,ay]=posOf(f,q-.02),[bx,by]=posOf(f,q+.02);rb(u,W,H,MS[f.sp][0][dir8(Math.atan2(by-ay,bx-ax))],px,py,rp,op,top);}
    else if(f.k===2){const fr=Math.min(4,(f.t/.075)|0);rb(u,W,H,(own?SPK:SPKS)[f.el][fr],f.x,f.y-fr,rp,op,top);
      if(own&&f.el===FIRE)for(let i=0;i<5;i++){const h1=hash2(i,f.id),h2=hash2(f.id,i+9),q=f.t/f.dur;put(u,W,H,f.x+(h1-.5)*18,f.y-2-q*(8+h2*10),rp[q<.4?5:q<.7?4:3]);}}
    else if(f.k===3){const rp2=RAMP[ENERGY],rng=mkRng(f.id*131+((f.t/.05)|0)*17),core=own&&f.t<.05?rp2[6]:rp2[f.t<.2?5:4];
      for(let s=0;s<f.pts.length-1;s++){const a=f.pts[s],b=f.pts[s+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=bolt(BX,BY,a[0],a[1],b[0],b[1],5,L*.13,rng);
        if(own)for(let i=0;i<n-1;i++){line(u,W,H,BX[i],BY[i]+1,BX[i+1],BY[i+1]+1,rp2[2]);line(u,W,H,BX[i],BY[i]-1,BX[i+1],BY[i+1]-1,rp2[2]);line(u,W,H,BX[i]+1,BY[i],BX[i+1]+1,BY[i+1],rp2[3]);}
        for(let i=0;i<n-1;i++)line(u,W,H,BX[i],BY[i],BX[i+1],BY[i+1],core,op);
        if(own){const i0=10+((rng()*8)|0),ex=BX[i0]+(b[0]-a[0])*.2+(rng()-.5)*30,ey=BY[i0]+(b[1]-a[1])*.2+(rng()-.5)*30,sx=BX[i0],sy=BY[i0],n2=bolt(BX,BY,sx,sy,ex,ey,3,6,rng);for(let i=0;i<n2-1;i++)line(u,W,H,BX[i],BY[i],BX[i+1],BY[i+1],rp2[3]);}}}
    else if(f.k===4){const p=f.t/f.dur,c=f.c,rp4=RAMP[HOLY];ell(u,W,H,c.x,c.y-p*17,7,3,rp4[p<.2?5:4],0,.5,0,op);
      for(let i=0;i<7;i++){const q=p-i*.07;if(q<0||q>.8)continue;const x=c.x+((i*37)%17)-8,y=c.y-3-q*26-((i*5)%6),col=rp4[q<.3?5:q<.55?4:3];putD(u,W,H,x,Math.round(y),col,op);if(own&&q<.5){put(u,W,H,x-1,y,rp4[3]);put(u,W,H,x+1,y,rp4[3]);put(u,W,H,x,y-1,rp4[3]);put(u,W,H,x,y+1,rp4[3]);put(u,W,H,x,y,col);}}}}
  return {tick(dt){m.t0();t+=dt;
    for(let i=SCH.length-1;i>=0;i--)if(SCH[i].t<=t){const fn=SCH[i].fn;SCH.splice(i,1);fn();}
    auto-=dt;if(auto<=0){player(seq%3);auto=1.7;}
    if(crowd)for(const c of CR){c.cd-=dt;if(c.cd<=0){cast(c,0,2);c.cd=1.3+hash2(ids,7)*1.6;}}
    M.castT=Math.max(0,M.castT-dt);for(const c of CR)c.castT=Math.max(0,c.castT-dt);for(const d of D)d.sh=Math.max(0,d.sh-dt);
    for(let i=FX.length-1;i>=0;i--){const f=FX[i];f.t+=dt;if(f.t>=f.dur){FX.splice(i,1);if(f.end)f.end();}}
    u.set(G);
    for(const f of FX)under(f);
    for(const p of PIL)spr(u,W,H,SP_PIL,p[0],p[1]);
    const q8=(t*8)|0;for(const b of BRZ){spr(u,W,H,SP_BRAZ,b[0],b[1]);for(let i=-3;i<=2;i++){const h=2+hashI(i,q8,b[0],5)%5-Math.abs(i+.5)|0;for(let j=0;j<h;j++)put(u,W,H,b[0]+i,b[1]-8-j,RAMP[FIRE][j<1?5:j<2?4:j<4?3:2]);}}
    for(const c of CR)spr(u,W,H,c.spr[c.castT>0?1:0],c.x,c.y,c.x>160);
    for(const d of D)spr(u,W,H,SP_DUMMY,d.x+(d.sh>0?((t*30)&1?1:-1):0),d.y);
    spr(u,W,H,M.spr[M.castT>0?1:0],M.x,M.y);
    for(const f of FX)over(f);
    F.put();m.t1();hud-=dt;
    if(hud<=0){hud=.25;while(EV.length&&EV[0].t<t-3)EV.shift();let b=0;for(const e of EV)b+=e.b;setHud(root,`JS ${fms(m.v)} ms · ${FX.length} fx · ${Math.round(b/3)} B/s`);}}};});

// ======================================================================
// §3 timeline: four generations from GENS (built from the report)
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#9089ab','#e8c45a','#a088ff','#f058c4'];
  const X=y=>y<1997?2+(y-1983)/14*24:y<2020?28+(y-1997)/23*34:64+(y-2020)/7*34;
  let h='<div class="tl-axis">';for(const y of [1983,1997,2007,2020,2026])h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
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
  const pick=items.find(i=>/Tibia and Ultima/.test(i.e.h))||items[0];show(pick.id);return {};});

// §7 stack: click a layer to read its row
reg('stack',root=>{const det=$('.ldet',root),bt=$$('.layer',root);
  const show=b=>{bt.forEach(x=>x.classList.toggle('on',x===b));const tp=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(tp.content.cloneNode(true));};
  bt.forEach(b=>b.addEventListener('click',()=>show(b)));show(bt[bt.length-1]);return {};});

// ======================================================================
// A1 Tibia magic effect: id + tile + start time, phase = min(elapsed/75, n-1),
// gone after 75 x n ms. Step it, change the frame count, read the bytes.
// ======================================================================
const GREY=Uint32Array.from(['#000000','#2a2630','#3c3844','#56525e','#74707c','#9a96a4','#ffffff'],U);
const tileBox=(u,W,H,tx,ty,c)=>{const x=tx*16,y=ty*16;for(let i=0;i<=16;i++){put(u,W,H,x+i,y,c);put(u,W,H,x+i,y+16,c);put(u,W,H,x,y+i,c);put(u,W,H,x+16,y+i,c);}};
reg('effectclock',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),u=F.u32,W=176,H=96,c=ctl(root),ro=$('[data-ro]',root),by=$('[data-bytes]',root),strip=cvs.slice(1),SP=strip.map(PX),m=meter();
  const G=court(W,H,5,false),BOOK={},book=(el,n)=>BOOK[el+'_'+n]||(BOOK[el+'_'+n]=bakeBook(el,n,.62)),BG=U('#1c1926');
  let n=8,fm=75,clock=0,sel={tx:5,ty:2,el:FIRE},proto=0,els=0,idle=0,hud=0,stripKey='';const FXL=[];
  const fire=(tx,ty,el)=>FXL.push({tx,ty,el,t0:clock,n,fm});
  function drawStrip(){const k=sel.el+'_'+n;if(k===stripKey)return;stripKey=k;const bk=book(sel.el,n);strip.forEach((cn,i)=>{cn.hidden=i>=n;if(i<n){const P=SP[i];P.u32.fill(BG);rb(P.u32,19,19,bk[i],9,9,RAMP[sel.el]);P.put();}});}
  function bytes(){const B=(k,s)=>`<i class="${k}">${s}</i>`;
    by.innerHTML=proto===0?B('op','op')+B('pos','x')+B('pos','x')+B('pos','y')+B('pos','y')+B('pos','z')+B('id','id')+'<span>7 bytes: opcode 1, position 5, effect id 1</span>':
      proto===1?B('pl','·').repeat(9)+'<span>9 bytes in TFS from protocol 12.03</span>':B('pl','·').repeat(10)+B('x','?')+'<span>10 or 11 bytes in Canary</span>';}
  c.seg('id',v=>{fm=+v;});c.seg('proto',v=>{proto=+v;bytes();});c.on('n',()=>{n=c.v('n');c.out('n',n);});
  c.btn('step',()=>{c.el('play').checked=false;if(!FXL.some(f=>f.tx===sel.tx&&f.ty===sel.ty))fire(sel.tx,sel.ty,sel.el);else clock+=fm;});
  pointer(cvs[0],(p,kind)=>{if(kind!=='down')return;const tx=clamp(Math.floor(p[0]/16),0,10),ty=clamp(Math.floor(p[1]/16),0,5);sel={tx,ty,el:(++els)%6};fire(tx,ty,sel.el);idle=0;});
  bytes();
  return {tick(dt){const play=c.v('play');if(play)clock+=dt*1000;
    for(let i=FXL.length-1;i>=0;i--)if(clock-FXL[i].t0>=FXL[i].fm*FXL[i].n)FXL.splice(i,1);
    let cur=null;for(const f of FXL)if(f.tx===sel.tx&&f.ty===sel.ty)cur=f;
    if(play&&!cur){idle+=dt;if(idle>.45){idle=0;fire(sel.tx,sel.ty,sel.el);cur=FXL[FXL.length-1];}}
    drawStrip();u.set(G);tileBox(u,W,H,sel.tx,sel.ty,U('#e8c45a'));
    m.t0();for(const f of FXL){const ph=Math.min(Math.floor((clock-f.t0)/f.fm),f.n-1);rb(u,W,H,book(f.el,f.n)[ph],f.tx*16+8,f.ty*16+8,RAMP[f.el]);}m.t1();
    F.put();const ph=cur?Math.min(Math.floor((clock-cur.t0)/cur.fm),cur.n-1):-1;strip.forEach((cn,i)=>cn.classList.toggle('on',i===ph));
    hud-=dt;if(hud<=0||!play){hud=.2;setHud(root,`${FXL.length} live · blits ${fms(m.v)} ms`);
      const el=cur?Math.floor(clock-cur.t0):0,N=cur?cur.n:n,f2=cur?cur.fm:fm;
      ro.innerHTML=cur?`effect at tile <b>(${cur.tx}, ${cur.ty})</b> · elapsed <b>${el} ms</b> · phase = min(${el} / ${f2}, ${N-1}) = <b>${ph}</b> · removes itself at ${f2} x ${N} = <b>${f2*N} ms</b> · stored: id, tile, start time · sent once, <b>0 B</b> per frame`
        :`no live effect on tile (${sel.tx}, ${sel.ty}) · the next one lasts ${fm} x ${n} = <b>${fm*n} ms</b> · 1,000 / ${fm} = <b>${(1000/fm).toFixed(1)}</b> frames per second`;}}};});

// ======================================================================
// A2 Tibia missile: one frame from the 3x3 sheet, linear lerp, duration
// 150 x sqrt(tiles). Drag the target; a ghost flies at 150 ms per tile.
// ======================================================================
reg('missile',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),u=F.u32,W=208,H=144,c=ctl(root),ro=$('[data-ro]',root),sheet=cvs.slice(1),SP=sheet.map(PX),svg=$('svg',root);
  const G=court(W,H,7,false),C={tx:2,ty:4},T={tx:10,ty:2},NAMES=['NW','N','NE','W','centre','E','SW','S','SE'],CELLDIR=[5,6,7,4,-1,0,3,2,1],ELOF={0:FIRE,1:ICE,3:ARCANE},BG=U('#1c1926');
  let shape=0,t=0,hud=0;
  const X=d=>34+d/12*256,Y=ms=>148-ms/1800*136;
  svgEl('line',{x1:34,y1:148,x2:290,y2:148,stroke:'#362e57'},svg);svgEl('line',{x1:34,y1:12,x2:34,y2:148,stroke:'#362e57'},svg);
  for(const d of [0,4,8,12])svgText(svg,X(d),162,d+(d===12?' tiles':''),{'text-anchor':d===12?'end':'middle','font-size':10,fill:'#9089ab'});
  for(const ms of [500,1000,1800]){svgEl('line',{x1:34,y1:Y(ms),x2:290,y2:Y(ms),stroke:'#211b37','stroke-dasharray':'2 3'},svg);svgText(svg,30,Y(ms)+3,ms,{'text-anchor':'end','font-size':10,fill:'#9089ab'});}
  svgText(svg,38,10,'ms',{'font-size':10,fill:'#9089ab'});
  {const a=[],b=[];for(let d=0;d<=12;d+=.25){a.push([X(d),Y(flightMs(d))]);b.push([X(d),Y(150*d)]);}poly(svg,b,{class:'s3','stroke-dasharray':'5 3'});poly(svg,a,{class:'s1'});}
  const vl=svgEl('line',{class:'now',y1:12,y2:148},svg),d1=svgEl('circle',{r:4,fill:'#e8c45a',stroke:'#15111c'},svg),d2=svgEl('circle',{r:4,fill:'#ff8f7a',stroke:'#15111c'},svg),lab=svgText(svg,0,0,'',{'font-size':11,fill:'#e0ddee','font-family':'IBM Plex Mono, monospace'});
  function drawSheet(){const el=ELOF[shape];SP.forEach((P,i)=>{P.u32.fill(BG);const d=CELLDIR[i];rb(P.u32,23,23,d<0?MS[2][0][0]:MS[shape][0][d],11,11,RAMP[el]);P.put();});}
  c.seg('shape',v=>{shape=+v;drawSheet();});drawSheet();
  pointer(cvs[0],(p,kind)=>{if(kind!=='down'&&kind!=='drag')return;const tx=clamp(Math.floor(p[0]/16),0,12),ty=clamp(Math.floor(p[1]/16),0,8);if(tx!==T.tx||ty!==T.ty){T.tx=tx;T.ty=ty;t=0;}});
  return {tick(dt){t+=dt;const dx=T.tx-C.tx,dy=T.ty-C.ty,d=Math.hypot(dx,dy),dur=flightMs(d),lin=150*d,ghost=c.v('ghost'),cyc=Math.max(dur,ghost?lin:0)+650,tt=(t*1000)%cyc,el=ELOF[shape];
    const x0=C.tx*16+8,y0=C.ty*16+8,x1=T.tx*16+8,y1=T.ty*16+8,di=d?dir8(Math.atan2(dy,dx)):-1,cell=CELLDIR.indexOf(di);
    u.set(G);tileBox(u,W,H,C.tx,C.ty,U('#a088ff'));tileBox(u,W,H,T.tx,T.ty,U('#e8c45a'));
    for(let k=1;k<d*4;k++){const q=k/(d*4);put(u,W,H,lerp(x0,x1,q),lerp(y0,y1,q),k&1?U('#8a86a0'):U('#2b2d38'));}
    const hit=d&&tt>=dur&&tt<dur+375;spr(u,W,H,SP_DUMMY,x1+(hit&&tt<dur+150?((tt/33)&1?1:-1):0),y1+6);spr(u,W,H,SP_MAGE[tt<120?1:0],x0,y0+6);
    if(d){if(ghost&&tt<lin){const q=tt/lin;rb(u,W,H,MS[2][0][0],lerp(x0,x1,q),lerp(y0,y1,q),GREY,8);}
      if(tt<dur){const q=tt/dur;rb(u,W,H,MS[shape][0][di],lerp(x0,x1,q),lerp(y0,y1,q),RAMP[el]);}
      else if(hit)rb(u,W,H,SPKS[el][Math.min(4,((tt-dur)/75)|0)],x1,y1,RAMP[el]);}
    F.put();sheet.forEach((cn,i)=>cn.classList.toggle('on',i===cell));
    hud-=dt;if(hud<=0){hud=.15;const px=X(Math.min(12,d));vl.setAttribute('x1',px);vl.setAttribute('x2',px);d1.setAttribute('cx',px);d1.setAttribute('cy',Y(dur));d2.setAttribute('cx',px);d2.setAttribute('cy',Y(Math.min(1800,lin)));
      lab.textContent=Math.round(dur)+' ms';lab.setAttribute('x',px>220?px-52:px+7);lab.setAttribute('y',Y(dur)+(dur>300?14:-6));
      setHud(root,d?`${Math.round(Math.min(tt,dur))} / ${Math.round(dur)} ms`:'same tile');
      ro.innerHTML=`from <b>(${C.tx}, ${C.ty})</b> to <b>(${T.tx}, ${T.ty})</b> · delta (${dx}, ${dy}), length <b>${d.toFixed(2)}</b> tiles · 150 x sqrt(${d.toFixed(2)}) = <b>${Math.round(dur)} ms</b> · 150 per tile would be <b>${Math.round(lin)} ms</b> · frame <b>${NAMES[cell]}</b> (${cell%3}, ${(cell/3)|0}) · <b>0 B</b> per frame`;}}};});

// ======================================================================
// A3 Area masks: TFS masks as tiles, one effect per tile in phase, the
// byte bill per cast, and the real blit cost of N overlapping casts.
// ======================================================================
reg('areamask',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=208,H=208,c=ctl(root),bars=$('[data-bars]',root),kv=$('[data-kv]',root),m=meter(.1);
  const G=court(W,H,9,false),circ=ws=>{const n=Math.max(...ws);return ws.map(w=>{const r=new Array(n).fill(0);for(let i=(n-w)/2;i<(n+w)/2;i++)r[i]=1;return r;});};
  const MASKS={c3:circ([3,5,7,7,7,5,3]),c5:circ([1,5,7,9,9,11,9,9,7,5,1]),w4:[[1,1,1,1,1],[0,1,1,1,0],[0,1,1,1,0],[0,0,3,0,0]],b5:[[1],[1],[1],[1],[1],[3]]};MASKS.c3[3][3]=3;MASKS.c5[5][5]=3;
  let mask='c5',face=0,t=0,hud=0,TL=[];const CX=6,CY=6,fmtB=b=>b<1000?b+' B':(b/1000).toFixed(1)+' KB';
  function build(){const M=MASKS[mask];let ox=0,oy=0;M.forEach((r,j)=>r.forEach((v,i)=>{if(v===3){ox=i;oy=j;}}));TL=[];const rot=mask==='w4'||mask==='b5'?face:0;
    M.forEach((r,j)=>r.forEach((v,i)=>{if(!v)return;let dx=i-ox,dy=j-oy;for(let k=0;k<rot;k++){const q=dx;dx=-dy;dy=q;}TL.push({x:CX+dx,y:CY+dy,v});}));info();}
  function info(){const n=TL.length,sp=c.v('spec'),mx=730*30,row=(cls,lab,b)=>`<div class="bbar ${cls}">${lab} = <b>${fmtB(b)}</b><div class="tr"><i style="width:${Math.max(.5,b/mx*100)}%"></i></div></div>`;
    bars.innerHTML=row('alt',`Old protocol, ${n} x 7 B x ${sp} viewers`,n*7*sp)+row('alt',`At 10 B, ${n} x 10 B x ${sp} viewers`,n*10*sp)+row('good',`One area event, 11 B x ${sp} viewers`,11*sp);
    const cs=c.v('cast'),live=c.v('one')?n:n*cs;
    kv.innerHTML=`<dt>Live tile effects</dt><dd><b>${live.toLocaleString('en-US')}</b>${c.v('one')?' (one per tile)':` (${cs} x ${n})`}</dd><dt>Blits on your device</dt><dd><b data-live>…</b></dd><dt>Measured, 2,190 as blits</dt><dd>0.51 / 2.87 ms</dd><dt>Measured, 2,190 by drawImage</dt><dd>2.2 / 14.1 ms</dd><dt>Measured, 220, one per tile</dt><dd>0.060 / 0.39 ms</dd><dt>Measured, 2,190 in one GPU draw</dt><dd>0.024 ms</dd>`;}
  c.seg('mask',v=>{mask=v;build();});c.seg('face',v=>{face=+v;build();});c.on('spec',()=>{c.out('spec',c.v('spec'));info();});c.on('cast',()=>{c.out('cast',c.v('cast'));info();});c.on('one',info);build();
  return {tick(dt){t+=dt;const tt=(t*1000)%1500,ph=Math.floor(tt/75),num=c.v('num'),cs=c.v('one')?1:c.v('cast'),UND=U('#6a5ab8'),GOLD=U('#e8c45a');
    u.set(G);for(const q of TL){const x=q.x*16,y=q.y*16;for(let j=1;j<16;j++)for(let i=1;i<16;i++)if(((i+j)&3)===0)dark(u,W,H,x+i,y+j,.7);tileBox(u,W,H,q.x,q.y,q.v===3?GOLD:UND);}
    for(const q of TL)if(q.v===3)tileBox(u,W,H,q.x,q.y,GOLD);
    spr(u,W,H,SP_MAGE[tt<200?1:0],CX*16+8,CY*16+14);
    if(ph<8){m.t0();const bk=TFX[FIRE][ph],rp=RAMP[FIRE];for(let k=0;k<cs;k++)for(const q of TL)rb(u,W,H,bk,q.x*16+8,q.y*16+8,rp);m.t1();}
    if(num)for(const q of TL)txt(u,W,H,q.v,q.x*16+7,q.y*16+6,q.v===3?GOLD:WHT);
    F.put();hud-=dt;if(hud<=0){hud=.3;setHud(root,`${TL.length} tiles · frame ${Math.min(ph,7)+1} of 8, 75 ms each`);const l=$('[data-live]',kv);if(l)l.textContent=fms(m.v)+' ms';}}};});

// ======================================================================
// A4 battle script: a tiny interpreter over shared sprites. One ember
// sheet, 22 copies 2 frames apart, a shake task, one shared hit splat.
// ======================================================================
reg('battlescript',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=192,H=96,c=ctl(root),ro=$('[data-ro]',root),ol=$('[data-script]',root);
  const G=court(W,H,11,true,.8),CA={x:34,y:66},TG={x:156,y:58},NE=22;shadow(G,W,H,CA.x,CA.y+1,6);shadow(G,W,H,TG.x,TG.y+1,6);
  const EMB=[bake(4,(x,y)=>{const r=Math.hypot(x,y*1.15);return r<1?5:r<2?4:r<3?3:0;}),bake(4,(x,y)=>{const r=Math.hypot(x*1.15,y+.6);return r<.8?5:r<1.8?4:r<2.7?3:r<3.4&&y<0?2:0;})];
  const SC=[['loadspritegfx','ANIM_TAG_SMALL_EMBER'],['loadspritegfx','ANIM_TAG_IMPACT'],['monbg','ANIM_TARGET'],['setalpha','12, 8'],['createsprite','ember'],['delay','2'],['createvisualtask','shake target, 43 frames'],['waitforvisualfinish',''],['createsprite','ANIM_TAG_IMPACT at target'],['playse','hit'],['waitforvisualfinish',''],['end','']];
  ol.innerHTML=SC.map((s,i)=>`<li>${s[0]} <span>${s[1]}</span>${i===4?'<small data-loop></small>':''}</li>`).join('');const lis=$$('li',ol),loopEl=$('[data-loop]',ol);
  let el=FIRE,pc=0,wait=0,fr=0,made=0,shake=0,acc=0,sheets=0,hold=0,imp=-1,hud=0;const SPR=[];
  const reset=()=>{pc=0;wait=0;fr=0;made=0;shake=0;sheets=0;hold=0;imp=-1;SPR.length=0;};
  function frame(){fr++;if(shake>0)shake--;if(imp>=0)imp++;for(let i=SPR.length-1;i>=0;i--)if(++SPR[i].a>=SPR[i].life)SPR.splice(i,1);
    if(wait>0){wait--;return;}
    for(let guard=0;guard<8;guard++){const op=SC[pc][0];
      if(op==='loadspritegfx'){sheets++;pc++;}else if(op==='monbg'||op==='setalpha'||op==='playse'){pc++;}
      else if(op==='createsprite'&&pc===4){SPR.push({a:0,life:26,k:made,off:((made*7)%5)-2});made++;pc++;}
      else if(op==='delay'){wait=2;pc=made<NE?4:pc+1;return;}
      else if(op==='createvisualtask'){shake=43;pc++;}
      else if(op==='waitforvisualfinish'){if(SPR.length||(imp>=0&&imp<23))return;pc++;}
      else if(op==='createsprite'){imp=0;pc++;}
      else if(op==='end'){if(++hold>50)reset();return;}}}
  c.seg('el',v=>{el=+v;});c.btn('step',()=>{c.el('play').checked=false;frame();frame();});
  return {tick(dt){if(c.v('play')){acc+=dt*60*(c.v('slow')?.25:1);let n=0;while(acc>=1&&n++<4){acc-=1;frame();}}
    const rp=RAMP[el];u.set(G);spr(u,W,H,SP_MAGE[pc>3&&pc<7?1:0],CA.x,CA.y);spr(u,W,H,SP_DUMMY,TG.x+(shake>0?((fr>>1)&1?1:-1):0),TG.y);
    for(const s of SPR){const q=s.a/s.life,x=lerp(CA.x+8,TG.x-2,q),y=lerp(CA.y-10,TG.y-8,q)+s.off*Math.sin(q*3.14)*2.5+Math.sin(q*9+s.k)*1.5;rb(u,W,H,EMB[(s.a>>2)&1],x,y,rp,12,5);}
    if(imp>=0&&imp<23)rb(u,W,H,SPK[el][Math.min(4,(imp/4.5)|0)],TG.x,TG.y-8,rp);
    F.put();lis.forEach((l,i)=>{l.classList.toggle('on',i===pc||(i===5&&pc===4&&wait>0));l.classList.toggle('done',i<pc&&!(i===5&&pc===4));});loopEl.textContent=`${made} of ${NE}`;
    hud-=dt;if(hud<=0||!c.v('play')){hud=.12;const n=SPR.length+(imp>=0&&imp<23?1:0);setHud(root,`frame ${fr} · ${n} sprites`);
      ro.innerHTML=`frame <b>${fr}</b> (${Math.round(fr/60*1000)} ms) · line <b>${pc+1}</b> ${SC[pc][0]} · embers made <b>${made} of ${NE}</b>, all one sprite · sheets loaded <b>${sheets}</b> · alive <b>${n}</b> · cost now ${n} x 0.21 µs = <b>${(n*.21).toFixed(1)} µs</b> as pixel blits, ${(n*.93).toFixed(1)} µs as drawImage`;}}};});

// ======================================================================
// A5 Diablo missile rows: a row names the next row. Fire Bolt ->
// fireexplode with light 7 -> 13; Frozen Orb -> bolts in flight -> nova;
// Diablo I ExpLight ramp. Lights are dithered stamps on a dark floor.
// ======================================================================
reg('missilechain',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=256,H=112,c=ctl(root),ro=$('[data-ro]',root),rowsEl=$('[data-rows]',root),m=meter();
  const GL=court(W,H,13,false),GD=Uint32Array.from(GL,v=>mulc(v,.3,.3,.38)),LIT=Uint32Array.from(GL,v=>{const a=un32(v);return pack(a[0]*1.7+24,a[1]*1.25+10,a[2]*.6);});
  const LITI=Uint32Array.from(GL,v=>{const a=un32(v);return pack(a[0]*.75,a[1]*1.02,a[2]*1.3);}),EXP=[2,3,4,5,5,6,7,8,9,10,11,12],UNIT=3;
  const DEF={fb:[['firebolt','8 directions','on hit: <em>fireexplode</em>','light 7, RGB 255, 178, 64'],['fireexplode','1 direction','end of chain','light 13']],
    fo:[['frozenorb','1 direction','in flight: <em>frozenorbbolt</em> · on expiry: <em>frozenorbnova</em>','light not cited'],['frozenorbbolt','16 directions here','end of chain','light not cited'],['frozenorbnova','ring of 16 bolts','spawns <em>frozenorbbolt</em> x 16 here','light not cited']],
    d1:[['fireball (Diablo I)','16 directions here','on hit: <em>explosion</em>','light illustrative'],['explosion','1 direction','ExpLight, one step per frame','<span class="explight" data-exp></span>']]};
  const DIMS=v=>mulc(v,.6,.6,.68);let sp='fb',t=0,next=.3,spawned=0,refused=0,hud=0,stamps=0;const MI=[],TGX=206,Y0=58;
  function setSp(v){sp=v;MI.length=0;spawned=refused=0;next=.3;rowsEl.innerHTML=DEF[sp].map(r=>`<div><b>${r[0]}</b><span>${r[1]} · ${r[2]}</span><span>${r[3]}</span></div>`).join('');const ex=$('[data-exp]',rowsEl);if(ex)ex.innerHTML=EXP.map(v=>`<i style="height:${v/12*100}%" title="${v}"></i>`).join('');}
  const add=o=>{if(o.sub){if(MI.filter(q=>q.sub).length>=c.v('cap')){refused++;return;}spawned++;}MI.push(Object.assign({a:0},o));};
  function fire(){if(sp==='fo')add({row:0,x:28,y:Y0,vx:62,vy:0,life:1.9,emit:0,ang:0});else add({row:0,x:28,y:Y0,vx:190,vy:0,life:(TGX-36)/190});}
  c.seg('sp',setSp);c.btn('fire',()=>{fire();next=2.6;});c.on('cap',()=>c.out('cap',c.v('cap')));setSp('fb');
  function stamp(x,y,r,tab){stamps++;const r2=r*r,x0=Math.max(0,Math.floor(x-r)),x1=Math.min(W-1,Math.ceil(x+r)),y0=Math.max(0,Math.floor(y-r*.8)),y1=Math.min(H-1,Math.ceil(y+r*.8));
    for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){const dx=i-x,dy=(j-y)*1.25,d=dx*dx+dy*dy;if(d>=r2)continue;const l=(1-Math.sqrt(d)/r)*3.2,s=Math.floor(l),k=Math.min(3,s+((l-s)*16>bay(i,j)+.5?1:0));if(k){const q=j*W+i;u[q]=mix32(u[q],tab[q],k/3*.9);}}}
  return {tick(dt){t+=dt;next-=dt;if(next<=0){fire();next=sp==='fo'?4.2:2.4;}const light=c.v('light');stamps=0;
    for(let i=MI.length-1;i>=0;i--){const q=MI[i];q.a+=dt;q.x+=(q.vx||0)*dt;q.y+=(q.vy||0)*dt;
      if(sp==='fo'&&q.row===0){q.emit-=dt;if(q.emit<=0){q.emit=.11;q.ang+=.87;add({row:1,sub:1,x:q.x,y:q.y,vx:Math.cos(q.ang)*95,vy:Math.sin(q.ang)*70,life:.62,an:q.ang});}}
      if(q.a>=q.life){MI.splice(i,1);if(q.row===0&&sp!=='fo')add({row:1,x:TGX,y:Y0,life:sp==='d1'?.6:.42,hit:1});
        if(q.row===0&&sp==='fo'){add({row:2,x:q.x,y:q.y,life:.3});for(let k=0;k<16;k++){const an=k/16*6.2832;add({row:1,sub:1,x:q.x,y:q.y,vx:Math.cos(an)*120,vy:Math.sin(an)*88,life:.55,an});}}}}
    m.t0();u.set(GD);
    if(light)for(const q of MI){if(sp==='fo'){stamp(q.x,q.y,q.row===0?26:q.row===2?34*(1-q.a/q.life)+8:9,LITI);}
      else if(q.row===0)stamp(q.x,q.y,7*UNIT,LIT);else{const e=sp==='d1'?EXP[Math.min(11,(q.a/.05)|0)]:13*(1-Math.max(0,q.a/q.life-.5)*1.6);stamp(q.x,q.y,e*UNIT,LIT);}}
    spr(u,W,H,SP_MAGE[next>1.9?1:0],16,Y0+7,false,DIMS);if(sp!=='fo')spr(u,W,H,SP_DUMMY,TGX+((MI.some(q=>q.hit&&q.a<.15)&&((t*30)&1))?1:0),Y0+8,false,DIMS);
    for(const q of MI){if(sp==='fo'){if(q.row===0)rb(u,W,H,MS[2][0][0],q.x,q.y,RAMP[ICE]);else if(q.row===1)rb(u,W,H,MS[1][1][dir16(q.an)],q.x,q.y,RAMP[ICE]);else ell(u,W,H,q.x,q.y,6+q.a/q.life*22,(6+q.a/q.life*22)*.7,RAMP[ICE][q.a<.1?5:4],0,1,q.a>.2?1:0);}
      else if(q.row===0)rb(u,W,H,MS[0][0][0],q.x,q.y,RAMP[FIRE]);else rb(u,W,H,SPK[FIRE][Math.min(4,(q.a/(q.life/5))|0)],q.x,q.y,RAMP[FIRE]);}
    F.put();m.t1();const live=[0,0,0];for(const q of MI)live[q.row]++;$$('div',rowsEl).forEach((d,i)=>d.classList.toggle('on',live[i]>0));
    const ex=$$('[data-exp] i',rowsEl);if(ex.length){const h=MI.find(q=>q.row===1),k=h?Math.min(11,(h.a/.05)|0):-1;ex.forEach((e,i)=>e.classList.toggle('on',i===k));}
    hud-=dt;if(hud<=0){hud=.15;setHud(root,`${MI.length} rows live · ${fms(m.v)} ms`);
      ro.innerHTML=`live: ${DEF[sp].map((r,i)=>`${r[0].split(' ')[0]} <b>${live[i]}</b>`).join(' · ')} · light stamps this frame <b>${stamps}</b>`+(sp==='fo'?` · sub-missiles spawned <b>${spawned}</b>, refused by the cap <b>${refused}</b>`:sp==='fb'?' · light radius 7 in flight, 13 on the explosion':' · explosion light follows ExpLight, 2 to 12');}}};});

// ======================================================================
// A6 packets: byte bars from §6c, and a mini scene of what each layout buys
// ======================================================================
reg('packets',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=160,H=72,box=$('[data-pk]',root),det=$('[data-det]',root);
  const G=court(W,H,17,false,.85),COL={t:'#e8c45a',u:'#f058c4',r:'#50b0ec',o:'#78cc28',a:'#a088ff'};
  const P=[['t','Tibia, old protocol','effect',7,7,'7'],['t','Tibia, old protocol','missile',12,12,'12'],['t','Tibia 12.03+ (TFS)','effect',9,9,'9'],['t','Tibia 12.03+ (TFS)','missile',11,11,'11'],
    ['u','Ultima Online','graphic effect',28,49,'28 to 49'],['r','Ragnarok Online','effect',10,10,'10'],['r','Ragnarok Online','ground unit, per cell',16,23,'16 to 23'],
    ['o','Old School RuneScape','spot animation',7,7,'6 + op'],['o','Old School RuneScape','projectile',21,21,'20 + op'],['a','Asterion proposal','effect',9,9,'9'],['a','Asterion proposal','missile',11,11,'11'],['a','Asterion proposal','area, any size',11,11,'11']];
  const TXT={t:'<p><b>Tibia</b> carries no extras. An id and a tile, or two tiles for a missile. The 12.03+ protocol has a command loop with delay and delta fields that servers leave unused.</p><p>An area has no message of its own, so a 73-tile UE is 511 to 730 bytes of single effects.</p>',
    u:'<p><b>Ultima Online</b> uses one <code>GraphicEffect</code> layout at 28, 36 or 49 bytes: type, source, target, graphic, two positions, speed, duration and flags. <code>0xC0</code> adds a hue and one of 8 render modes.</p><p>The scene plays one sprite in three hues, drawn normal on the left and additive (<code>One, One</code>) on the right.</p>',
    r:'<p><b>Ragnarok Online</b> sends an actor id and an effect id in 10 bytes, and the client expands the id into layers. 584 entries name a cheaper file. <code>/mineffect</code> swaps to it and <code>/effect</code> turns everything off.</p><p>A 5x5 ground spell is up to 25 unit packets of 16 to 23 bytes, 400 to 575 bytes per viewer.</p>',
    o:'<p><b>Old School RuneScape</b> runs a 600 ms server tick and a 20 ms client cycle. A spot animation carries a delay in client cycles. A projectile carries a start and end cycle, two heights and an angle.</p><p>The scene shows one tick that says "missile now, impact in 300 ms". The client plays them in order.</p>',
    a:'<p><b>Asterion proposal.</b> Cast 8, missile 11, effect 9, area 11 and condition 6 bytes, with relation bits, element, cast time and a ring delay. Cast, area and condition sizes are illustrative.</p><p>One area event replaces one effect per tile. The scene plays a 3x3 area from a single event, ring by ring.</p>'};
  box.innerHTML=P.map((p,i)=>`<button type="button" data-i="${i}"><span>${p[2]}<small>${p[1]}</small></span><span class="tr"><i class="mx" style="width:${p[4]/49*100}%;background:${COL[p[0]]}"></i><i style="width:${p[3]/49*100}%;background:${COL[p[0]]}"></i></span><b>${p[5]} B</b></button>`).join('');
  let sel=4,t=0;const pick=i=>{sel=i;t=0;$$('button',box).forEach((b,k)=>b.classList.toggle('on',k===i));det.innerHTML=TXT[P[i][0]];};
  box.addEventListener('click',e=>{const b=e.target.closest('button');if(b)pick(+b.dataset.i);});pick(4);
  const flip=(x,y,el,ms,sm)=>{const f=Math.floor(ms/75);if(f>=0&&f<5)rb(u,W,H,(sm?SPKS:SPK)[el][f],x,y,RAMP[el]);};
  const addb=(s,x,y,rp)=>{const d=s.d,w=s.w;x-=s.ox;y-=s.oy;for(let j=0,k=0;j<s.h;j++)for(let i=0;i<w;i++,k++){const v=d[k];if(v<2)continue;const xx=x+i,yy=y+j;if(xx<0||yy<0||xx>=W||yy>=H)continue;const a=un32(u[yy*W+xx]),b=un32(rp[v]);u[yy*W+xx]=pack(a[0]+b[0]*.8,a[1]+b[1]*.8,a[2]+b[2]*.8);}};
  return {tick(dt){t+=dt;const k=P[sel][0],ms=(t*1000)%1800;u.set(G);let lab='';
    if(k==='t'){if(P[sel][2]==='missile'){const q=ms/flightMs(6);if(q<1)rb(u,W,H,MS[0][0][0],lerp(32,128,q),36,RAMP[FIRE]);else flip(128,36,FIRE,ms-flightMs(6),1);spr(u,W,H,SP_MAGE[0],24,42);lab='MISSILE FROM > TO';}else{flip(80,36,FIRE,ms%900);lab='EFFECT ID AT TILE';}}
    else if(k==='u'){const hue=[FIRE,POISON,ARCANE][Math.floor(t/1.8)%3],f=Math.min(4,Math.floor((ms%900)/75));if(ms%900<375){rb(u,W,H,SPK[hue][f],46,36,RAMP[hue]);addb(SPK[hue][f],114,36,RAMP[hue]);}txt(u,W,H,'NORMAL',34,62,WHT);txt(u,W,H,'ADDITIVE',98,62,WHT);lab='HUE '+['A','B','C'][Math.floor(t/1.8)%3];}
    else if(k==='r'){const mn=Math.floor(t/1.8)&1,m2=ms%1800;if(P[sel][2].startsWith('ground')){for(let j=0;j<5;j++)for(let i=0;i<5;i++){const x=40+i*16,y=4+j*13;rect(u,W,H,x,y,15,12,mulc(u[y*W+x],.8,.8,1.25));if(m2<600&&(!mn||((i+j)&1)===0))rb(u,W,H,TFX[ICE][Math.min(7,Math.floor(m2/75))],x+8,y+6,RAMP[ICE]);}lab=mn?'MIN':'25 CELLS';}
      else{if(m2<375){const f=Math.floor(m2/75);rb(u,W,H,SPK[HOLY][f],80,36,RAMP[HOLY]);if(!mn){ell(u,W,H,80,44,8+f*4,(8+f*4)*.45,RAMP[HOLY][4-Math.min(2,f>>1)]);for(let i=0;i<6;i++)put(u,W,H,80+Math.cos(i*1.05+1)*(10+f*5),36+Math.sin(i*1.05+1)*(8+f*3)-f*2,RAMP[HOLY][5]);}}lab=mn?'/MINEFFECT':'FULL: 3 LAYERS';}}
    else if(k==='o'){const tk=ms%1200,bar=Math.round(tk/1200*120);rect(u,W,H,20,64,120,2,U('#2b2d38'));rect(u,W,H,20,64,bar,2,U('#78cc28'));rect(u,W,H,20+30,62,1,6,WHT);spr(u,W,H,SP_MAGE[tk<150?1:0],24,44);spr(u,W,H,SP_DUMMY,134,46);
      if(P[sel][2]==='projectile'){const q=tk/300;if(q<1){const x=lerp(32,130,q),h=4*14*q*(1-q);for(let i=-2;i<=2;i++)dark(u,W,H,Math.round(x)+i,40,.6);rb(u,W,H,MS[2][0][0],x,36-h,RAMP[POISON]);}else flip(134,36,POISON,tk-300,1);lab='START 0, END 15 CYCLES';}
      else{if(tk>=300)flip(134,36,ENERGY,tk-300);lab=tk<300?'DELAY 15 X 20 MS':'PLAY';}}
    else{const kind=P[sel][2];if(kind==='missile'){const q=ms/flightMs(6);if(q<1)rb(u,W,H,MS[3][0][0],lerp(32,128,q),36,RAMP[ARCANE]);else flip(128,36,ARCANE,ms-flightMs(6),1);spr(u,W,H,SP_MAGE[0],24,42);lab='REL OWN, 11 B';}
      else if(kind==='effect'){flip(80,36,ARCANE,ms%900);lab='REL PARTY, 9 B';}
      else{for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const ring=Math.max(Math.abs(i),Math.abs(j)),m2=ms-ring*55,x=80+i*16,y=36+j*16;tileBox(u,W,H,(x-8)/16,(y-8)/16,U('#6a5ab8'));if(m2>=0&&m2<600)rb(u,W,H,TFX[FIRE][Math.floor(m2/75)],x,y,RAMP[FIRE]);}lab='1 EVENT, RING 55 MS';}}
    txt(u,W,H,lab,4,4,U('#e8c45a'));F.put();}};});

// ======================================================================
// A7 console screen tricks: BlendPalette on 16 entries in 5-bit channels,
// and the darken-then-bolt beat on an indexed frame.
// ======================================================================
reg('darkflash',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),SW=PX(cvs[1]),B=PX(cvs[2]),W=128,H=80,N=W*H,c=ctl(root),ro=$('[data-ro]',root),ro2=$('[data-ro2]',root),m=meter();
  const src=court(W,H,21,false),to5=v=>{const a=un32(v);return [a[0]>>3,a[1]>>3,a[2]>>3];},to8=p=>pack(p[0]<<3|p[0]>>2,p[1]<<3|p[1]>>2,p[2]<<3|p[2]>>2);
  // 16 background entries: the most common colours after a 4-bit quantise; 16 sprite entries: the colours the two sprites use
  const cnt=new Map();for(let i=0;i<N;i++){const a=un32(src[i]),k=(a[0]>>4)<<8|(a[1]>>4)<<4|(a[2]>>4);cnt.set(k,(cnt.get(k)||0)+1);}
  const top=[...cnt.entries()].sort((a,b)=>b[1]-a[1]).slice(0,16).map(e=>pack((e[0]>>8)*17,((e[0]>>4)&15)*17,(e[0]&15)*17));while(top.length<16)top.push(INK);
  const sc=[];for(const s of [SP_MAGE[0],SP_DUMMY])for(const v of s.d)if(v&&!sc.includes(v))sc.push(v);while(sc.length<16)sc.push(INK);
  const BASE=top.concat(sc.slice(0,16)).map(to5),IDX=new Uint8Array(N),HIST=new Float32Array(16);
  for(let i=0;i<N;i++){const k=nearestIn(top,src[i]);IDX[i]=k;HIST[k]++;}
  const tmp=new Uint32Array(N);spr(tmp,W,H,SP_MAGE[0],34,60);spr(tmp,W,H,SP_DUMMY,94,56);for(let i=0;i<N;i++)if(tmp[i])IDX[i]=16+Math.max(0,sc.indexOf(tmp[i]));
  const TG={k:[0,0,0],w:[31,31,31],i:[0,20,31]},blend=(p,t,k)=>[p[0]+(((t[0]-p[0])*k)>>4),p[1]+(((t[1]-p[1])*k)>>4),p[2]+(((t[2]-p[2])*k)>>4)];
  const PA=new Uint32Array(32),PB=new Uint32Array(32),BX=new Float32Array(20),BY=new Float32Array(20);let tg='i',who='s',t=0,hud=0,seed=1;
  const resolve=(P,pal)=>{const u=P.u32;for(let i=0;i<N;i++)u[i]=pal[IDX[i]];};
  function left(){const k=c.v('k'),o=who==='s'?16:0;for(let i=0;i<32;i++)PA[i]=to8(i>=o&&i<o+16?blend(BASE[i],TG[tg],k):BASE[i]);resolve(A,PA);A.put();
    for(let i=0;i<16;i++)for(let y=0;y<16;y++)for(let x=0;x<8;x++)SW.u32[y*128+i*8+x]=x===7?INK:y<8?to8(BASE[o+i]):PA[o+i];SW.put();
    const e=o+(who==='s'?Math.max(0,sc.indexOf(U('#4a58cc'))):0),p=BASE[e],q=blend(p,TG[tg],k),T=TG[tg];
    ro.innerHTML=`entry ${e-o} of 16 · (${p.join(', ')}) toward (${T.join(', ')}) at coeff <b>${k}</b> gives <b>(${q.join(', ')})</b> · green: ${p[1]} + ((${T[1]} - ${p[1]}) * ${k} &gt;&gt; 4) = <b>${q[1]}</b> · 16 entries rewritten, ${N.toLocaleString('en-US')} pixels follow`;}
  c.seg('tg',v=>{tg=v;left();});c.seg('who',v=>{who=v;left();});c.on('k',()=>{c.out('k',c.v('k'));left();});c.on('d',()=>c.out('d',c.v('d')));c.btn('cast',()=>{t=0;seed++;});left();
  return {tick(dt){t+=dt;if(t>3.4){t=0;seed++;}const D=c.v('dim')?c.v('d'):0,k=Math.round(D*(t<.25?t/.25:t<1.15?1:t<1.4?1-(t-1.15)/.25:0));
    m.t0();for(let i=0;i<16;i++)PB[i]=to8(blend(BASE[i],TG.k,k));for(let i=16;i<32;i++)PB[i]=to8(BASE[i]);resolve(B,PB);m.t1();
    const bt=t-.55,u=B.u32,rp=RAMP[ENERGY];
    if(bt>=0&&bt<.3){const rng=mkRng(seed*77+((bt/.05)|0)),n=bolt(BX,BY,88+((seed*13)%14),0,94,42,4,9,rng),core=bt<.05?rp[6]:rp[bt<.2?5:4];
      for(let i=0;i<n-1;i++){line(u,W,H,BX[i]-1,BY[i],BX[i+1]-1,BY[i+1],rp[2]);line(u,W,H,BX[i]+1,BY[i],BX[i+1]+1,BY[i+1],rp[3]);}for(let i=0;i<n-1;i++)line(u,W,H,BX[i],BY[i],BX[i+1],BY[i+1],core);
      rb(u,W,H,SPKS[ENERGY][Math.min(4,(bt/.06)|0)],94,44,rp);}
    B.put();hud-=dt;if(hud<=0){hud=.2;let fl=0,fd=0,n=0;for(let i=0;i<16;i++){fl+=lum(to8(BASE[i]))*HIST[i];fd+=lum(to8(blend(BASE[i],TG.k,D)))*HIST[i];n+=HIST[i];}fl/=n;fd/=n;const bl=lum(rp[5]);
      setHud(root,`resolve ${fms(m.v)} ms · coeff ${k}`);
      ro2.innerHTML=`bolt luminance <b>${Math.round(bl)}</b> · floor ${Math.round(fl)} gives <b>${(bl/fl).toFixed(1)}x</b> with no darken · floor ${Math.round(fd)} gives <b>${(bl/fd).toFixed(1)}x</b> at coeff ${D} · ${16-D} of 16 of the floor's brightness is left`;}}};});

// ======================================================================
// B1 direction frames: 8 and 16 baked frames against nearest-neighbour
// run-time rotation. Counts the pixels that change and the outline gaps.
// ======================================================================
reg('dirframes',root=>{const cvs=$$('canvas',root),PN=cvs.slice(0,3).map(PX),AT=cvs.slice(3),ATP=AT.map(PX),c=ctl(root),ro=$('[data-ro]',root),ms=$$('[data-m]',root),S=27,N=S*S;
  const FL=court(S,S,23,false),BG=U('#1c1926'),prev=[0,1,2].map(()=>new Uint32Array(N)),win=[0,0,0],rate=[0,0,0],chg=[0,0,0],IB=new Uint8Array(N);
  let shape=0,a=20,sec=0,hud=0,first=true;
  const atlas=()=>ATP.forEach((P,i)=>{P.u32.fill(BG);rb(P.u32,23,23,MS[shape][0][i],11,11,RAMP[shape?ICE:FIRE]);P.put();});
  // same sampling as rbRot, into an index buffer, to count body pixels that touch the floor with no outline between
  function gaps(s,an){IB.fill(0);const co=Math.cos(an),sn=Math.sin(an),o=s.ox,w=s.w,d=s.d;for(let j=-o;j<=o;j++)for(let i=-o;i<=o;i++){const uu=Math.round(i*co+j*sn)+o,v=Math.round(-i*sn+j*co)+o;if(uu<0||v<0||uu>=w||v>=w)continue;const x=13+i,y=13+j;if(x>=0&&y>=0&&x<S&&y<S)IB[y*S+x]=d[v*w+uu];}
    let g=0;for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++){const i=y*S+x;if(IB[i]>1&&(!IB[i-1]||!IB[i+1]||!IB[i-S]||!IB[i+S]))g++;}return g;}
  c.seg('shape',v=>{shape=+v;atlas();first=true;});c.on('a',()=>{a=c.v('a');c.el('auto').checked=false;});atlas();
  return {tick(dt){if(c.v('auto')){a=(a+dt*26)%360;c.el('a').value=a;}c.out('a',a.toFixed(1)+'°');const rad=a*Math.PI/180,rp=RAMP[shape?ICE:FIRE],d8=dir8(rad),d16=dir16(rad);
    for(let k=0;k<3;k++){const P=PN[k],u=P.u32;u.set(FL);if(k===0)rb(u,S,S,MS[shape][0][d8],13,13,rp);else if(k===1)rb(u,S,S,MS[shape][1][d16],13,13,rp);else rbRot(u,S,S,MS[shape][0][0],13,13,rad,rp);
      let n=0;if(!first)for(let i=0;i<N;i++)if(u[i]!==prev[k][i])n++;prev[k].set(u);chg[k]=n;win[k]+=n;P.put();}
    first=false;sec+=dt;if(sec>=1){sec=0;for(let k=0;k<3;k++){rate[k]=win[k];win[k]=0;}}
    AT.forEach((cn,i)=>cn.classList.toggle('on',i===d8));
    hud-=dt;if(hud<=0){hud=.1;const g=gaps(MS[shape][0][0],rad);for(let k=0;k<3;k++)ms[k].innerHTML=`changed now <b>${chg[k]}</b> px · last second <b>${rate[k].toLocaleString('en-US')}</b>`+(k===2?` · outline gaps <b>${g}</b>`:' · outline gaps <b>0</b>');
      const e8=((a-d8*45+540)%360)-180,e16=((a-d16*22.5+540)%360)-180;
      ro.innerHTML=`angle <b>${a.toFixed(1)}°</b> · 8 directions: frame <b>${d8}</b> at ${d8*45}°, off by ${Math.abs(e8).toFixed(1)}° · 16 directions: frame <b>${d16}</b> at ${d16*22.5}°, off by ${Math.abs(e16).toFixed(1)}° · rotation: exact angle, every texel resampled`;}}};});

// ======================================================================
// B2 flight paths: position = f(start, angle, t). Scrub t both ways.
// ======================================================================
reg('flightpaths',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=256,H=104,c=ctl(root),ro=$('[data-ro]',root);
  const G=court(W,H,29,false),X0=30,Y0=50,RANGE=208;let path='helix',spd=200,hud=0,tv=.4;
  const life=()=>path==='orbit'?2.4:RANGE/spd;
  // the whole flight model: where bullet `id` is at t seconds. Returns ground x, ground y, height.
  function pos(t,id){const L=life(),q=t/L,A=c.v('amp')*16,fr=c.v('fr');
    if(path==='line')return [X0+spd*t,Y0,0];
    if(path==='sine'||path==='helix')return [X0+spd*t,Y0+A*Math.sin((id&1?Math.PI:0)+q*fr*2*Math.PI),0];
    if(path==='lob')return [X0+RANGE*q,Y0+22,4*clamp(RANGE/2,8,48)*q*(1-q)];
    const an=q*fr*Math.PI;return [128+Math.cos(an)*76,Y0+4+Math.sin(an)*34,0];}
  c.seg('path',v=>{path=v;});c.seg('spd',v=>{spd=+v;});c.on('t',()=>{tv=c.v('t');c.el('play').checked=false;});c.on('amp',()=>c.out('amp',c.v('amp').toFixed(2)));c.on('fr',()=>c.out('fr',c.v('fr').toFixed(1)));
  return {tick(dt){const L=life();if(c.v('play')){tv+=dt/L/(path==='orbit'?1:1.6);if(tv>1.12)tv=0;c.el('t').value=Math.min(1,tv);}const q=Math.min(1,tv),t=q*L;c.out('t',q.toFixed(2));
    u.set(G);const ids=path==='helix'?[0,1]:[0],mx=path==='orbit'?128:16,my=path==='orbit'?Y0+12:path==='lob'?Y0+24:Y0+8;
    for(let i=-6;i<=6;i++)for(let j=-2;j<=2;j++)if(i*i/36+j*j/5<1)dark(u,W,H,mx+i,my+1+j,.6);
    for(const id of ids)for(let k=0;k<=72;k++){const p=pos(L*k/72,id);put(u,W,H,p[0],p[1]-p[2],k/72<=q?(id?RAMP[ICE][3]:RAMP[ARCANE][3]):U('#8a86a0'));if(path==='lob'&&(k&1))put(u,W,H,p[0],p[1],U('#2b2d38'));}
    spr(u,W,H,SP_MAGE[q<.12?1:0],mx,my);
    for(const id of ids){const rp=path==='lob'?RAMP[POISON]:path==='line'||path==='sine'?RAMP[FIRE]:id?RAMP[ICE]:RAMP[ARCANE];
      const p=pos(t,id),p2=pos(t+.012,id),an=Math.atan2((p2[1]-p2[2])-(p[1]-p[2]),p2[0]-p[0]),S=path==='line'||path==='sine'?MS[0][0][dir8(an)]:path==='lob'?MS[2][0][0]:MS[3][0][0];
      if(path==='lob'){const w=p[2]>24?2:3;for(let i=-w;i<=w;i++)for(let j=-1;j<=1;j++)if(Math.abs(i)<w||j===0)dark(u,W,H,Math.round(p[0])+i,Math.round(p[1])+j,.55);}
      for(let g=3;g>=1;g--){const e=t-g*.05;if(e<0)continue;const pe=pos(e,id);rb(u,W,H,S,pe[0],pe[1]-pe[2],rp,g===1?8:g===2?5:3,5);}
      rb(u,W,H,S,p[0],p[1]-p[2],rp);}
    F.put();hud-=dt;if(hud<=0||!c.v('play')){hud=.1;setHud(root,`t ${Math.round(t*1000)} of ${Math.round(L*1000)} ms`);const A=c.v('amp'),fr=c.v('fr'),tl=spd/16;let s;
      if(path==='line')s=`dist = ${t.toFixed(2)} s x ${tl} tiles/s = <b>${(t*tl).toFixed(2)} tiles</b>`;
      else if(path==='sine'||path==='helix')s=`dist = ${t.toFixed(2)} s x ${tl} tiles/s = <b>${(t*tl).toFixed(2)} tiles</b> · deflection = ${A.toFixed(2)} x sin(phase + ${q.toFixed(2)} x ${fr} x 2π) = <b>${(A*Math.sin(q*fr*2*Math.PI)).toFixed(2)} tiles</b>`+(path==='helix'?` for even ids and <b>${(A*Math.sin(Math.PI+q*fr*2*Math.PI)).toFixed(2)}</b> for odd ids, phase π`:', phase 0');
      else if(path==='lob')s=`ground = lerp(from, to, ${q.toFixed(2)}) · h = 4 x 48 x ${q.toFixed(2)} x ${(1-q).toFixed(2)} = <b>${(4*48*q*(1-q)).toFixed(1)} px</b>`;
      else s=`angle = ${q.toFixed(2)} x ${fr} x π = <b>${(q*fr*180).toFixed(0)}°</b> around the caster`;
      ro.innerHTML=s+` · stored per missile: start, angle, start time, id · <b>0 B</b> per frame`;}}};});

// ======================================================================
// B3 homing: fixed speed, turn limit per frame, then a blend onto the
// direct lerp over the last 40% so the hit lands on the server's clock.
// ======================================================================
reg('homing',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=256,H=144,c=ctl(root),ro=$('[data-ro]',root);
  const G=court(W,H,31,true),M={x:36,y:86},T={x:206,y:60,vy:24,hold:0};shadow(G,W,H,M.x,M.y+1,6);
  let mis=null,acc=0,rest=.4,hud=0,res='waiting for the first shot',side=1,spark=0,sx=0,sy=0;const TR=new Float32Array(160);let trN=0;
  function launch(){const x0=M.x+5,y0=M.y-11,tx=T.x,ty=T.y-8,d=Math.hypot(tx-x0,ty-y0),dur=flightMs(d/16)/1000;side=-side;
    mis={x:x0,y:y0,px:x0,py:y0,sx:x0,sy:y0,x0,y0,a:Math.atan2(ty-y0,tx-x0)+side*.75,sp:d/dur*1.15,dur,t:0,da:0};trN=0;}
  function land(m,ok){const ms=Math.round(m.t*1000),sv=Math.round(m.dur*1000);res=ok?`landed at <b>${ms} ms</b>, the server said ${sv} ms, <b>${ms-sv>=0?'+':''}${ms-sv} ms</b>`:`<b>never lands</b>, the target is inside the turning circle. The server hit at ${sv} ms with no missile there`;if(ok){spark=.375;sx=T.x;sy=T.y-8;}mis=null;rest=.8;}
  function step(){const m=mis,tx=T.x,ty=T.y-8,turn=c.v('turn')*Math.PI/180;m.t+=1/60;let da=Math.atan2(ty-m.sy,tx-m.sx)-m.a;while(da>Math.PI)da-=6.2832;while(da<-Math.PI)da+=6.2832;m.da=da;m.a+=clamp(da,-turn,turn);
    m.sx+=Math.cos(m.a)*m.sp/60;m.sy+=Math.sin(m.a)*m.sp/60;m.px=m.x;m.py=m.y;const q=m.t/m.dur;
    if(c.v('blend')){const w=q<=.6?0:Math.min(1,(q-.6)/.4),e=Math.min(1,q);m.x=lerp(m.sx,lerp(m.x0,tx,e),w);m.y=lerp(m.sy,lerp(m.y0,ty,e),w);if(q>=1){m.t=m.dur;return land(m,true);}}
    else{m.x=m.sx;m.y=m.sy;if(Math.hypot(tx-m.x,ty-m.y)<5)return land(m,true);if(m.t>m.dur*3+1.2||m.x<-30||m.y<-30||m.x>W+30||m.y>H+30)return land(m,false);}
    const k=(trN++%80)*2;TR[k]=m.x;TR[k+1]=m.y;}
  pointer(cv,(p,k)=>{if(k==='down'||k==='drag'){T.x=clamp(p[0],60,W-10);T.y=clamp(p[1]+6,24,H-6);T.hold=2.5;}});
  c.on('turn',()=>c.out('turn',c.v('turn').toFixed(1)));
  return {tick(dt){const sl=c.v('slow')?.25:1;if(T.hold>0)T.hold-=dt;else{T.y+=T.vy*dt*sl;if(T.y>128||T.y<30){T.vy=-T.vy;T.y=clamp(T.y,30,128);}}
    spark=Math.max(0,spark-dt);if(!mis){rest-=dt;if(rest<=0)launch();}else{acc+=dt*60*sl;let n=0;while(acc>=1&&mis&&n++<6){acc-=1;step();}}
    u.set(G);for(let i=-6;i<=6;i++)for(let j=-2;j<=2;j++)if(i*i/36+j*j/5<1)dark(u,W,H,Math.round(T.x)+i,Math.round(T.y)+1+j,.6);
    spr(u,W,H,SP_DUMMY,T.x,T.y);spr(u,W,H,SP_MAGE[mis&&mis.t<.1?1:0],M.x,M.y);
    if(mis){const m=mis,q=Math.min(1,m.t/m.dur),tx=T.x,ty=T.y-8,turn=c.v('turn')*Math.PI/180,r=m.sp/(turn*60);
      for(let k=0;k<40;k++)if(k&1)put(u,W,H,lerp(m.x0,tx,k/40),lerp(m.y0,ty,k/40),U('#8a86a0'));put(u,W,H,lerp(m.x0,tx,q),lerp(m.y0,ty,q),WHT);put(u,W,H,lerp(m.x0,tx,q)+1,lerp(m.y0,ty,q),WHT);
      if(c.v('circ')&&r<400){const s=m.da>=0?1:-1;ell(u,W,H,m.sx-Math.sin(m.a)*r*s,m.sy+Math.cos(m.a)*r*s,r,r,U('#6a5ab8'),0,1,1);}
      const n=Math.min(trN,80);for(let k=0;k<n;k++){const i=((trN-1-k)%80)*2;put(u,W,H,TR[i],TR[i+1],RAMP[FIRE][k<6?4:k<16?3:2]);}
      rb(u,W,H,MS[0][0][dir8(Math.atan2(m.y-m.py,m.x-m.px)||m.a)],m.x,m.y,RAMP[FIRE]);}
    if(spark>0)rb(u,W,H,SPK[FIRE][Math.min(4,((.375-spark)/.075)|0)],sx,sy,RAMP[FIRE]);
    F.put();hud-=dt;if(hud<=0){hud=.12;const turn=c.v('turn'),d=Math.hypot(T.x-M.x-5,T.y-8-M.y+11),sp=mis?mis.sp:d/(flightMs(d/16)/1000)*1.15,r=sp/(turn*Math.PI/180*60);
      setHud(root,mis?`t ${Math.round(mis.t*1000)} of ${Math.round(mis.dur*1000)} ms`:'reload');
      ro.innerHTML=`speed <b>${(sp/16).toFixed(1)} tiles/s</b> · turn ${turn.toFixed(1)}° per frame = <b>${Math.round(turn*60)}°/s</b> · turning circle radius <b>${(r/16).toFixed(1)} tiles</b> · target ${(d/16).toFixed(1)} tiles away · last shot ${res}`;}}};});

// ======================================================================
// B4 lob: ground = lerp(from, to, t), h = 4 H t (1 - t), shadow at ground.
// ======================================================================
reg('lob',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,W=256,H=128,c=ctl(root),ro=$('[data-ro]',root);
  const G=court(W,H,37,true),M={x:38,y:100},T={x:200,y:72},LIFE=1.33;shadow(G,W,H,M.x,M.y+1,6);let t=0,hud=0;
  pointer(cv,(p,k)=>{if(k==='down'){T.x=clamp(Math.floor(p[0]/16)*16+8,72,W-8);T.y=clamp(Math.floor(p[1]/16)*16+8,24,H-8);t=0;}});
  c.on('H',()=>{c.out('H',c.v('H'));c.el('auto').checked=false;});
  return {tick(dt){t+=dt;const tt=t%(LIFE+.9),q=Math.min(1,tt/LIFE),x0=M.x+7,y0=M.y-1,d=Math.hypot(T.x-x0,T.y-y0),auto=c.v('auto'),Hh=auto?Math.round(clamp(d/2,8,48)):c.v('H');if(auto){c.el('H').value=Hh;c.out('H',Hh);}
    const gx=lerp(x0,T.x,q),gy=lerp(y0,T.y,q),h=4*Hh*q*(1-q),sh=c.v('sh'),gl=c.v('gl'),fly=tt<LIFE;
    u.set(G);if(sh||!fly)tileBox(u,W,H,(T.x-8)/16,(T.y-8)/16,U('#e8c45a'));
    if(gl){for(let k=0;k<=48;k++)if(k&1)put(u,W,H,lerp(x0,T.x,k/48),lerp(y0,T.y,k/48),U('#8a86a0'));if(fly)for(let j=0;j<h-4;j+=2)put(u,W,H,gx,gy-j,U('#a088ff'));}
    if(sh&&fly){const w=h>30?3:h>12?4:5;for(let i=-w;i<=w;i++)for(let j=-2;j<=2;j++)if(i*i/(w*w)+j*j/5<1)dark(u,W,H,Math.round(gx)+i,Math.round(gy)+j,.32);}
    spr(u,W,H,SP_MAGE[tt<.15?1:0],M.x,M.y);
    if(fly)rb(u,W,H,MS[2][0][0],gx,gy-h-3,RAMP[POISON]);else if(tt<LIFE+.375)rb(u,W,H,SPK[POISON][Math.min(4,((tt-LIFE)/.075)|0)],T.x,T.y-2,RAMP[POISON]);
    F.put();hud-=dt;if(hud<=0){hud=.1;setHud(root,fly?`t ${q.toFixed(2)} · height ${Math.round(h)} px`:'landed');
      ro.innerHTML=`distance <b>${(d/16).toFixed(1)} tiles</b> · H = <b>${Hh} px</b>${auto?' (half of '+Math.round(d)+' px, clamped to 8..48)':''} · h = 4 x ${Hh} x ${q.toFixed(2)} x ${(1-q).toFixed(2)} = <b>${h.toFixed(1)} px</b> · shadow at round(ground) = (${Math.round(gx)}, ${Math.round(gy)}) · sprite ${Math.round(h)} px above it · flight ${LIFE} s`;}}};});
}
