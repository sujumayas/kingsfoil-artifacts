// ======================================================================
// demos2: trails, beams and lightning (B5 to B7), timing (E1), impacts,
// areas and residue (C1 to C5), auras, shields, status and cast circles
// (D1 to D5). Local helpers carry the m2 prefix so they never clash with
// core.js or the other demos files. Uses only generic core.js helpers ($, $$,
// clamp, lerp, bay, pack, U, mix32, PX, pointer, ctl, setHud, svgEl, svgText,
// digits, reg). Element ramps, the mage, the dummy and the stone floor match
// sandbox.html. Pixel rule: simulate in floats, round to whole pixels at draw
// time, palette steps instead of alpha, white only on the peak frame.
// ======================================================================
const m2H=(a,b,c=0)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1)^Math.imul(c|0,0x9e3779b1);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return (h>>>0)/4294967296;};
const m2R=seed=>{let s=seed|0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
const m2N=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=m2H(xi,yi,s),b=m2H(xi+1,yi,s),c=m2H(xi,yi+1,s),d=m2H(xi+1,yi+1,s);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
// element ramps, the sandbox's: index 1 dark hue-shifted edge .. 5 light core, 6 white (peak frame only), 0 ink
const M2INK=U('#15111c'),M2WHITE=U('#ffffff'),M2GOLD=U('#e8c45a'),M2RED=U('#e0584a');
const M2SRC=[['#4a1024','#b8281c','#f07818','#ffd040','#fff8dc'],['#141e5c','#2860c0','#50b0ec','#b0ecff','#e8faff'],['#28146c','#6040e0','#a088ff','#dcd2ff','#f2eeff'],['#0c3018','#28802c','#78cc28','#d4f458','#f6ffd0'],['#5c3808','#c08418','#f4c848','#fff0a0','#fffbe4'],['#400848','#a8248c','#f058c4','#ffb0e8','#ffeaf8']];
const M2RAMP=M2SRC.map(r=>Uint32Array.from([M2INK,...r.map(U),M2WHITE]));
const M2SMK=['#2a2630','#3c3844','#56525e','#74707c'].map(U);
const M2ELN=['fire','ice','energy','poison','holy','arcane'];
const m2tm=()=>({v:0,add(ms){this.v=this.v?this.v*.9+ms*.1:ms;return this.v;}});
const m2ms=v=>v<.0005?'<0.001':v>=10?v.toFixed(1):v>=1?v.toFixed(2):v.toFixed(3);
const m2mul=(c,r,g=r,b=r)=>pack((c&255)*r/16,(c>>8&255)*g/16,(c>>16&255)*b/16);
const m2add=(c,v)=>pack((c&255)+v,(c>>8&255)+v,(c>>16&255)+v);
const m2clr=el=>{while(el.firstChild)el.removeChild(el.firstChild);};
// counted pixel writers: every effect pixel goes through m2p, so m2w is the figure's pixel-write counter
let m2w=0;
const m2p=(u,W,H,x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H){u[y*W+x]=c;m2w++;}};
const m2dk=(u,W,H,x,y,k)=>{if(x>=0&&y>=0&&x<W&&y<H){const i=y*W+x;u[i]=m2mul(u[i],k);m2w++;}};
function m2rect(u,W,H,x,y,w,h,c){x=Math.round(x);y=Math.round(y);for(let j=Math.max(0,y);j<Math.min(H,y+h);j++)for(let i=Math.max(0,x);i<Math.min(W,x+w);i++)u[j*W+i]=c;}
// Bresenham line, th px thick (a run of th px across the major axis per step)
function m2line(u,W,H,x0,y0,x1,y1,c,th=1){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,o=th>>1,steep=-dy>dx;let e=dx+dy;
  for(let g=0;g<4000;g++){if(th<2)m2p(u,W,H,x0,y0,c);else if(steep)for(let i=0;i<th;i++)m2p(u,W,H,x0+i-o,y0,c);else for(let j=0;j<th;j++)m2p(u,W,H,x0,y0+j-o,c);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}}
// ellipse outline, angles in turns: 0 right, .25 bottom (front), .75 top (back). skip draws every second point
function m2ell(u,W,H,cx,cy,rx,ry,c,a0=0,a1=1,skip=0){const n=Math.max(8,((rx+ry)*3.4)|0),i0=Math.floor(a0*n),i1=Math.ceil(a1*n);let lx=-999,ly=-999;
  for(let i=i0;i<=i1;i++){if(skip&&(i&1))continue;const a=i/n*6.2832,x=Math.round(cx+Math.cos(a)*rx),y=Math.round(cy+Math.sin(a)*ry);if(x===lx&&y===ly)continue;lx=x;ly=y;m2p(u,W,H,x,y,c);}}
// disc: solid when a is 1, Bayer-dithered coverage otherwise
function m2disc(u,W,H,cx,cy,r,c,a=1){cx=Math.round(cx);cy=Math.round(cy);const R=Math.ceil(r);for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){if(i*i+j*j>r*r+.3)continue;if(a<1&&a*16<=bay(cx+i,cy+j)+.5)continue;m2p(u,W,H,cx+i,cy+j,c);}}
// thick midpoint circle: th px inward along the major axis, drop(x, y) returns true to skip a pixel
function m2circ(u,W,H,cx,cy,r,th,c,drop){r=Math.round(r);cx=Math.round(cx);cy=Math.round(cy);if(r<1){m2p(u,W,H,cx,cy,c);return;}let x=r,y=0,e=1-r;const P=(px,py)=>{if(!drop||!drop(px,py))m2p(u,W,H,px,py,c);};
  while(x>=y){for(let k=0;k<th;k++){const xx=x-k;if(xx<y)break;P(cx+xx,cy+y);P(cx-xx,cy+y);P(cx+xx,cy-y);P(cx-xx,cy-y);if(xx!==y){P(cx+y,cy+xx);P(cx-y,cy+xx);P(cx+y,cy-xx);P(cx-y,cy-xx);}}
    y++;if(e<0)e+=2*y+1;else{x--;e+=2*(y-x)+1;}}}
// orb with a dark edge
function m2orb(u,W,H,x,y,r,rp,top=5){x=Math.round(x);y=Math.round(y);const R=Math.ceil(r)+1;for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const d=Math.hypot(i,j);if(d<=r*.45)m2p(u,W,H,x+i,y+j,rp[top]);else if(d<=r*.8)m2p(u,W,H,x+i,y+j,rp[Math.max(2,top-1)]);else if(d<=r)m2p(u,W,H,x+i,y+j,rp[Math.max(2,top-2)]);else if(d<=r+1)m2p(u,W,H,x+i,y+j,rp[1]);}}
// ramp-indexed sprite baked from a shape function: 0 clear, 1 dark edge .. 5 core, 6 white. A 1 px dark outline is added
function m2bake(sz,fn,noOut){const w=sz*2+1,d=new Uint8Array(w*w);for(let y=0;y<w;y++)for(let x=0;x<w;x++)d[y*w+x]=fn(x-sz,y-sz)|0;const o=d.slice();if(noOut)return{w,h:w,ox:sz,oy:sz,d:o};
  for(let y=0;y<w;y++)for(let x=0;x<w;x++){const i=y*w+x;if(d[i])continue;if((x>0&&d[i-1]>1)||(x<w-1&&d[i+1]>1)||(y>0&&d[i-w]>1)||(y<w-1&&d[i+w]>1))o[i]=1;}return{w,h:w,ox:sz,oy:sz,d:o};}
// blit a baked sprite. sh lowers every ramp index by sh steps (afterimages), dz skips every second pixel
function m2blit(u,W,H,s,x,y,rp,sh=0,dz=0){const d=s.d,w=s.w;x=Math.round(x)-s.ox;y=Math.round(y)-s.oy;for(let j=0,k=0;j<s.h;j++)for(let i=0;i<w;i++,k++){let v=d[k];if(!v)continue;if(sh){if(v===1&&sh>1)continue;v=Math.max(1,v-sh);}if(dz&&((x+i+y+j)&1))continue;m2p(u,W,H,x+i,y+j,rp[v]);}}
// missile shapes in (u forward, v sideways): comet, shard, orb with a tail, star. 8 pre-drawn directions each, never rotated at run time
const M2SHAPES=[(u,v)=>{const av=Math.abs(v);if(u>0){const r=Math.hypot(u,v);return r<1.3?5:r<2.3?4:r<3.2?3:0;}const hw=3.2*(1+u/10);if(hw<=0)return 0;return av<hw*.3&&u>-4?5:av<hw*.6?(u>-6?4:3):av<hw?(u>-5?3:2):0;},
  (u,v)=>{const q=Math.abs(v)/2.3+Math.abs(u+1)/(u>-1?5.5:7);if(q>=1)return 0;return Math.abs(v)<.6?5:v<0?4:u<-4?2:3;},
  (u,v)=>{const r=Math.hypot(u,v);if(r<3.3)return Math.hypot(u+1,v+1)<1.1?5:r<1.9?4:r<2.7?3:2;return u<-4&&u>-6.6&&Math.abs(v)<.8?3:0;},
  (u,v)=>{const r=Math.hypot(u,v);return r<1.2?5:r<2.2?4:r<3.2?3:r>3.9&&r<4.8&&(((Math.atan2(v,u)+3.2)*1.9|0)&1)?4:0;}];
const M2MS=[];
function m2missile(k){if(!M2MS[k]){const a=[];for(let i=0;i<8;i++){const an=i*6.2832/8,c=Math.cos(an),s=Math.sin(an);a.push(m2bake(11,(x,y)=>M2SHAPES[k](x*c+y*s,-x*s+y*c)));}M2MS[k]=a;}return M2MS[k];}
const m2dir8=(vx,vy)=>(Math.round(Math.atan2(vy,vx)/(Math.PI/4))+8)&7;
// hit spark flipbook, 5 frames: flash, core, broken ring, sparks, fragments. One shape language per element
const M2SPK={};
function m2sparks(el,sc=1){const key=el+'_'+sc;if(M2SPK[key])return M2SPK[key];const R=[4.2,7,8.6,9.6,10.6],HO=[0,0,2.6,5.6,8],TOP=[5,5,4,3,2],DROP=[0,0,.12,.5,.78],fr=[];
  for(let f=0;f<5;f++)fr.push(m2bake(Math.ceil(13*sc),(x,y)=>{let r=Math.hypot(x,y)/sc,m=1,top=TOP[f],ho=HO[f];const a=Math.atan2(y,x);
    if(el===0)m=1+.17*Math.sin(a*5+f)+.1*Math.sin(a*3-f*2);else if(el===1){m=.42+.8*Math.pow(Math.abs(Math.cos(a*3+.5)),7);ho*=.6;}else if(el===2)m=.45+.85*m2H(((a+3.2)*2.3)|0,f*3+1);
    else if(el===3)m=1+.24*Math.sin(a*4+f*.7);else if(el===4){m=.5+1.05*Math.pow(Math.abs(Math.cos(a*2)),16);ho*=1.25;}else{r=(f&1?Math.max(Math.abs(x),Math.abs(y))*1.12:(Math.abs(x)+Math.abs(y))*.8)/sc;ho=[0,3.6,5.2,7,8.6][f];}
    const ro=R[f]*m;if(r>=ro||r<ho)return 0;if(DROP[f]&&m2H(x*7+f*31+el,y*13)<DROP[f])return 0;const t=(r-ho)/(ro-ho),tt=ho>0?Math.abs(t-.45)*1.8:t;return f===0&&t<.55?6:Math.max(2,Math.round(top-tt*(top-2)));},f>2));
  return M2SPK[key]=fr;}
// characters, direct colour (the sandbox's mage, dummy and pillar)
function m2mk(rows,pal){const h=rows.length,w=rows[0].length,d=new Uint32Array(w*h);rows.forEach((r,j)=>{for(let i=0;i<w;i++)if(r[i]!=='.')d[j*w+i]=pal[r[i]];});return{w,h,d};}
const M2MAGE=['.....oo.....','....ohho....','...ohhhho...','..ohhbbhho..','.oHHHHHHHHo.','..osssssso..','..osesseso..','..oossssoo..','.orrrbbrrro.','orrrrbbrrrro','osorrbbrroso','.oorrrrrroo.','.orrrrrrrro.','.orRrrrrRro.','.oRRRooRRRo.','..ooo..ooo..'];
const M2MAGE2=M2MAGE.slice(0,13).concat(['.orRrrrrRro.','.oRRRRRRRRo.','...oooooo...']);
const M2MAGE3=M2MAGE.slice(0,7).concat(['oso.ssss.oso','oroorbbrooro','.orrrbbrrro.','..orrbbrro..']).concat(M2MAGE.slice(11));
const m2pal=(h,H2,r,R,b)=>({o:M2INK,h:U(h),H:U(H2),s:U('#eab98e'),e:U('#22161e'),r:U(r),R:U(R),b:U(b)});
const m2mage=p=>[m2mk(M2MAGE,p),m2mk(M2MAGE2,p),m2mk(M2MAGE3,p)];
const M2PLAYER=m2mage(m2pal('#5868e0','#38409c','#4a58cc','#2f3890','#ffd050')),M2HEALER=m2mage(m2pal('#f0ece0','#b8b0a0','#e6e0d2','#aaa292','#e8a838'));
const M2CROWD=[['#a04848','#703030','#8c4040','#5e2a2a','#d0c090'],['#4c8050','#305838','#44744a','#2a4e32','#d0c090'],['#3c7c84','#28565c','#367078','#224a50','#c8c8c8'],['#806040','#58422c','#74583c','#4c3a28','#c8b070'],['#70707c','#4c4c58','#666672','#44444e','#b0b0c0'],['#a8703c','#744c28','#986636','#684422','#e0d0a0']].map(c=>m2mage(m2pal(...c)));
const M2DUMMY=m2mk(['....oooo....','...oyyyyo...','...oyYYyo...','...oyyyyo...','.ooooyyoooo.','owwwyyyywwwo','.oooyrryooo.','..oyrttryo..','..oyrttryo..','..oyyrryyo..','..oyYyyYyo..','...oooooo...','....owwo....','....owwo....','...oowwoo...','...oooooo...'],{o:M2INK,y:U('#d8b860'),Y:U('#a88838'),w:U('#7a5230'),r:U('#c03028'),t:U('#f0f0e0')});
const M2PILLAR=(()=>{const w=14,h=30,d=new Uint32Array(w*h),c=['#a0a0b0','#8a8a9c','#727288','#565668'].map(U);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;const cap=y<4||y>25,x0=cap?0:2,x1=cap?13:11;if(x<x0||x>x1)continue;
    if(x===x0||x===x1||y===0||y===h-1||y===4||y===25)v=M2INK;else{const q=(x-x0)/(x1-x0);v=cap?(y<4?c[q<.5?0:1]:c[q<.5?2:3]):c[q<.25?0:q<.5?1:q<.8?2:3];if(!cap&&(x===5||x===8))v=c[3];if(!cap&&m2H(x,y)>.93)v=c[3];}d[y*w+x]=v;}return{w,h,d};})();
// draw a direct-colour sprite with its bottom centre at (x, y). fn(colour) optional (tint, flash)
function m2draw(u,W,H,s,x,y,flip,fn){const w=s.w,d=s.d;x=Math.round(x)-(w>>1);y=Math.round(y)-s.h+1;for(let j=0;j<s.h;j++){const yy=y+j;if(yy<0||yy>=H)continue;for(let i=0;i<w;i++){const c=d[j*w+(flip?w-1-i:i)];if(!c)continue;const xx=x+i;if(xx<0||xx>=W)continue;u[yy*W+xx]=fn?fn(c):c;}}}
function m2sil(u,W,H,s,x,y,flip,c,dz){const w=s.w,d=s.d;x=Math.round(x)-(w>>1);y=Math.round(y)-s.h+1;for(let j=0;j<s.h;j++)for(let i=0;i<w;i++)if(d[j*w+(flip?w-1-i:i)]&&!(dz&&((x+i+y+j)&1)))m2p(u,W,H,x+i,y+j,c);}
function m2shadow(u,W,H,cx,fy,rx=5){cx=Math.round(cx);fy=Math.round(fy);for(let j=-1;j<=1;j++)for(let i=-rx;i<=rx;i++)if(i*i/(rx*rx+5)+j*j/2.2<1){const x=cx+i,y=fy+j;if(x>=0&&x<W&&y>=0&&y<H)u[y*W+x]=m2mul(u[y*W+x],10.4);}}
// the stone courtyard floor: ts px tiles with mortar, bevels, specks, moss and a few cracks
function m2floor(W,H,seed=1,ts=16,dim=13.2){const S=['#474b59','#505462','#5a5e6c'].map(U),MORT=U('#2b2d38'),G0=U('#2c5a34'),a=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const T=m2H(Math.floor(x/ts),Math.floor(y/ts),seed),base=S[T>.66?2:T>.33?1:0],mx=x%ts,my=y%ts;let c;
    if(mx===0||my===0)c=MORT;else if(mx===1||my===1)c=m2add(base,14);else if(mx===ts-1||my===ts-1)c=m2mul(base,13.5);else{c=base;const g=m2H(x+7,y+3,seed);if(g<.07)c=m2mul(base,14);else if(g>.95)c=m2add(base,12);}
    if(m2N(x/14+seed,y/14,seed)>.8&&m2H(x,y+9,seed)>.45)c=mix32(c,G0,.4);a[y*W+x]=m2mul(c,dim);}
  for(let k=0;k<Math.round(W*H/1900);k++){let x=6+m2H(k,1,seed)*(W-12)|0,y=4+m2H(k,2,seed)*(H-16)|0;const len=5+m2H(k,3,seed)*12|0;for(let j=0;j<len;j++){if(x>1&&x<W-1&&y<H-1)a[y*W+x]=m2mul(MORT,dim);x+=((m2H(k,j+9,seed)*3)|0)-1;y++;}}
  return a;}
// 3x5 letters for the few labels drawn inside canvases
const M2F={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010','-':'000000111000000','+':'000010111010000'};
function m2txt(u,W,H,x,y,str,col){for(const ch of String(str)){const g=M2F[ch];if(g){for(let k=0;k<15;k++)if(g[k]==='1'){const xx=x+k%3,yy=y+(k/3|0);if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=col;}}else if(ch>='0'&&ch<='9')digits(u,W,H,x,y,ch,col);x+=4;}}
// time fn run rep times, in ms (performance.now() is too coarse for one small draw)
function m2time(tm,rep,fn){const w0=m2w,t0=performance.now();for(let i=0;i<rep;i++)fn();const d=performance.now()-t0;m2w=w0;return tm.add(d);}

// ======================================================================
// B5: ribbon, afterimages and a three-layer particle wake behind the same missile
// ======================================================================
reg('trails',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root);
  const bg=m2floor(W,H,5),LY=[22,58,94],EL=[2,1,0],SH=[m2missile(2),m2missile(1),m2missile(0)],X0=14,X1=W-24,tms=[m2tm(),m2tm(),m2tm()],wr=[0,0,0];
  const L=LY.map((y,i)=>({i,y0:y,t:-.35*i,x:X0,y,ox:X0,oy:y,dir:0,alive:false,dead:9,rx:new Float32Array(16),ry:new Float32Array(16),rn:0,rh:0,shr:0,gx:new Float32Array(8),gy:new Float32Array(8),gd:new Uint8Array(8),gn:0,gh:0,hit:9}));
  const NPt=320,P={x:new Float32Array(NPt),y:new Float32Array(NPt),vx:new Float32Array(NPt),vy:new Float32Array(NPt),a:new Float32Array(NPt),l:new Float32Array(NPt),k:new Uint8Array(NPt),h:0};
  const emit=(k,x,y,vx,vy,l)=>{const j=P.h;P.h=(j+1)%NPt;P.x[j]=x;P.y[j]=y;P.vx[j]=vx;P.vy[j]=vy;P.a[j]=0;P.l[j]=l;P.k[j]=k;};
  let acc=0,tick=0,fr=0,live=0;
  function step(N,sp,curve){tick++;const T=(X1-X0)/sp;
    for(const m of L){m.t+=1/60;if(m.hit<9)m.hit+=1/60;
      if(m.t>=0&&m.t<T){if(!m.alive){m.alive=true;m.rn=0;m.gn=0;m.ox=X0;m.oy=m.y0;}const p=m.t/T;m.x=X0+(X1-X0)*p;m.y=m.y0+(curve?Math.sin(p*7.9)*8*Math.min(1,p*5,(1-p)*5):0);
        const vx=m.x-m.ox,vy=m.y-m.oy;if(vx||vy)m.dir=m2dir8(vx,vy);m.ox=m.x;m.oy=m.y;
        const lx=m.rx[m.rh],ly=m.ry[m.rh];if(!m.rn||Math.abs(m.x-lx)>=1||Math.abs(m.y-ly)>=1){m.rh=(m.rh+1)&15;m.rx[m.rh]=m.x;m.ry[m.rh]=m.y;m.rn=Math.min(N,m.rn+1);}
        if(tick%3===0){m.gh=(m.gh+1)%5;m.gx[m.gh]=m.x;m.gy[m.gh]=m.y;m.gd[m.gh]=m.dir;m.gn=Math.min(5,m.gn+1);}
        if(m.i===2){const bx=m.x-4,by=m.y;emit(0,bx+(Math.random()-.5)*3,by+(Math.random()-.5)*3,0,0,.1);emit(0,bx-2+(Math.random()-.5)*3,by+(Math.random()-.5)*4,0,0,.1);
          if(tick&1)emit(1,bx+(Math.random()-.5)*4,by+(Math.random()-.5)*4,(Math.random()-.5)*10,-3-Math.random()*6,.6);if(tick%5===0)emit(2,bx,by+(Math.random()-.5)*3,(Math.random()-.5)*4,-5-Math.random()*4,1.4);}}
      else if(m.alive){m.alive=false;m.dead=0;m.hit=0;m.shr=0;m.x=X1;}
      else if(m.t>=T){m.dead+=1/60;m.shr+=1/1.4;while(m.shr>=1&&m.rn>0){m.rn--;m.shr--;}if(tick%3===0&&m.gn>0)m.gn--;if(m.dead>.9){m.t=0;}}}
    for(let j=0;j<NPt;j++){if(P.l[j]<=0)continue;P.a[j]+=1/60;if(P.a[j]>=P.l[j]){P.l[j]=0;continue;}P.x[j]+=P.vx[j]/60;P.y[j]+=P.vy[j]/60;}}
  function ribbon(m,N){const rp=M2RAMP[EL[0]],WD=[3,2,1,1],CL=[rp[5],rp[4],rp[3],rp[2]];
    for(let k=m.rn-2;k>=0;k--){const a=(m.rh-k+16)&15,b=(m.rh-k-1+16)&15,q=Math.min(3,(k*4/Math.max(1,N-1))|0);if(WD[q]>1)m2line(u,W,H,m.rx[a],m.ry[a],m.rx[b],m.ry[b],rp[1],WD[q]+2);}
    for(let k=m.rn-2;k>=0;k--){const a=(m.rh-k+16)&15,b=(m.rh-k-1+16)&15,q=Math.min(3,(k*4/Math.max(1,N-1))|0);m2line(u,W,H,m.rx[a],m.ry[a],m.rx[b],m.ry[b],CL[q],WD[q]);}}
  function ghosts(m){const rp=M2RAMP[EL[1]];for(let k=m.gn-1;k>=0;k--){const a=(m.gh-k+10)%5;m2blit(u,W,H,SH[1][m.gd[a]],m.gx[a],m.gy[a],rp,Math.min(4,k+(m.alive?0:1)),k>=3?1:0);}}
  function wake(){const rp=M2RAMP[EL[2]];live=0;for(let pass=2;pass>=0;pass--)for(let j=0;j<NPt;j++){if(P.l[j]<=0||P.k[j]!==pass)continue;live++;const q=P.a[j]/P.l[j],x=Math.round(P.x[j]),y=Math.round(P.y[j]);
      if(pass===2){if(q>.7&&((x+y)&1))continue;const c=M2SMK[q<.3?3:q<.6?2:1];m2p(u,W,H,x,y,c);if(q<.5)m2p(u,W,H,x+1,y,c);}else if(pass===1)m2p(u,W,H,x,y,rp[q<.3?4:q<.65?3:2]);else m2p(u,W,H,x,y,rp[q<.5?5:4]);}}
  return {tick(dt){fr++;const N=C.v('n'),sp=C.v('sp'),curve=C.v('curve');C.out('n',N+' pts · '+Math.round(N/60*1000)+' ms');C.out('sp',sp+' px/s');
    acc+=Math.min(dt,.05);while(acc>=1/60){acc-=1/60;step(N,sp,curve);}
    u.set(bg);for(const m of L){m2shadow(u,W,H,X1+8,m.y0+9);const sh=m.hit<.1?1:0;m2draw(u,W,H,M2DUMMY,X1+8+sh,m.y0+9);}
    const fn=[()=>ribbon(L[0],N),()=>ghosts(L[1]),wake];
    for(let i=0;i<3;i++){m2w=0;fn[i]();wr[i]=m2w;if(fr%6===0)m2time(tms[i],240,fn[i]);}
    for(const m of L){if(m.alive)m2blit(u,W,H,SH[m.i][m.dir],m.x,m.y,M2RAMP[EL[m.i]]);if(m.hit<.375){const f=Math.min(4,(m.hit/.075)|0);m2blit(u,W,H,m2sparks(EL[m.i],.58)[f],X1+4,m.y0,M2RAMP[EL[m.i]]);}}
    F.put();
    if(fr%8===1){setHud(root,'Ribbon · '+N+' points','a');setHud(root,'Afterimages · 5 copies','b');setHud(root,'Wake · 0.1, 0.6, 1.4 s','c');
      ro.innerHTML=`ribbon: <b>${wr[0]}</b> px writes · 240 missiles here <b>${m2ms(tms[0].v)} ms</b> · state ${N} points x 2 floats<br>afterimages: <b>${wr[1]}</b> px writes · 240 missiles here <b>${m2ms(tms[1].v)} ms</b> · state 5 positions<br>wake: <b>${wr[2]}</b> px writes · 240 missiles here <b>${m2ms(tms[2].v)} ms</b> · <b>${live}</b> live particles<br>§6a measured, 240 missiles: 12-point ribbon <b>0.044 / 0.27 ms</b> · afterimages through drawImage <b>1.0 / 6.35 ms</b> (M4 / 6x throttle)`;}}};});

// ======================================================================
// B6: a beam as stacked lines, wide and dark outside, thin and light inside
// ======================================================================
reg('beam',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root),rp=M2RAMP[5],SP=m2sparks(5,.58);
  const bg=m2floor(W,H,11),M={x:24,y:54};let tx=162,ty=30,t=0,fr=0,mode='one',wrt=0,nl=0,ns=0;const tm=m2tm();
  C.seg('mode',v=>{mode=v;t=0;});pointer(cv,(p,k)=>{if(k==='down'||k==='drag'){tx=clamp(p[0],70,W-8);ty=clamp(p[1],10,H-6);}});
  function beam(life,on){const x0=M.x+6,y0=M.y-11,p=mode==='one'?t/life:0;nl=0;ns=0;if(mode==='one'&&p>=1)return;
    const grow=mode==='one'?Math.min(1,p/.2):1,x1=x0+(tx-x0)*grow,y1=y0+(ty-y0)*grow,k=1-p,fl=on.fl&&mode==='chan'&&((t*20)|0)&1?1:0;
    const w5=Math.round(5*k)+fl,w3=Math.round(3*k),w1=k>.15?1:0;
    if(on.halo&&w5>0){m2line(u,W,H,x0,y0,x1,y1,rp[1],w5+2);m2line(u,W,H,x0,y0,x1,y1,rp[2],w5);nl++;}
    if(on.mid&&w3>0){m2line(u,W,H,x0,y0,x1,y1,rp[4],w3);nl++;}
    if(on.core&&w1>0){m2line(u,W,H,x0,y0,x1,y1,rp[5],1);nl++;}
    if(on.caps){const f=(t/.075)|0;if(mode==='chan'){m2orb(u,W,H,x0,y0,2.4+(f&1)*.6,rp);m2blit(u,W,H,SP[1+f%3],x1,y1,rp);ns=2;}
      else{if(f<2){m2orb(u,W,H,x0,y0,f?2.6:3.6,rp);ns++;}const g=((t-life*.2)/.075)|0;if(t>=life*.2&&g<3){m2blit(u,W,H,SP[1+g],tx,ty,rp);ns++;}}}}
  return {tick(dt){fr++;t+=dt;const life=C.v('life')/1000,on={halo:C.v('halo'),mid:C.v('mid'),core:C.v('core'),caps:C.v('caps'),fl:C.v('fl')};C.out('life',C.v('life')+' ms');
    if(mode==='one'&&t>life+.75)t=0;
    u.set(bg);m2shadow(u,W,H,tx+2,ty+9);m2draw(u,W,H,M2DUMMY,tx+2+(mode==='one'&&t>life*.2&&t<life*.2+.1?1:0),ty+9);m2shadow(u,W,H,M.x,M.y);
    m2draw(u,W,H,M2PLAYER[mode==='chan'||t<life?2:0],M.x,M.y);
    m2w=0;beam(life,on);wrt=m2w;if(fr%6===0)m2time(tm,30,()=>beam(life,on));
    F.put();
    if(fr%8===1){setHud(root,'drag the target');const p=mode==='one'?Math.min(1,t/life):0;
      ro.innerHTML=`${mode==='one'?`one shot · life <b>${Math.round(life*1000)} ms</b> · length grows over the first 20% · width at <b>${Math.round((1-p)*100)}%</b>`:'channel · holds its width and re-casts its length every frame · 20 Hz flicker adds 1 px to the halo'}<br>this frame: <b>${nl}</b> lines + <b>${ns}</b> cap sprites · <b>${wrt}</b> px writes · 30 beams drawn here in <b>${m2ms(tm.v)} ms</b><br>§6a measured, as a guide: 40 lightning bolts of 48 segments as pixel lines <b>0.095 / 0.62 ms</b> (M4 / 6x throttle)`;}}};});

// ======================================================================
// B7: chain lightning by midpoint displacement, one seed byte per bolt
// ======================================================================
function m2bolt(X,Y,x0,y0,x1,y1,G,rnd,jag){X[0]=x0;Y[0]=y0;X[1]=x1;Y[1]=y1;let n=1,off=Math.hypot(x1-x0,y1-y0)*jag;
  for(let g=0;g<G;g++){for(let i=n;i>0;i--){X[i*2]=X[i];Y[i*2]=Y[i];}
    for(let i=0;i<n;i++){const ax=X[i*2],ay=Y[i*2],bx=X[i*2+2],by=Y[i*2+2],dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,o=(rnd()*2-1)*off;X[i*2+1]=(ax+bx)/2-dy/l*o;Y[i*2+1]=(ay+by)/2+dx/l*o;}n*=2;off/=2;}return n;}
reg('lightning',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root),rp=M2RAMP[2];
  const bg=m2floor(W,H,23,16,11.5),M={x:20,y:60},A={x:104,y:34},B={x:168,y:74};let fr=0,seed=58,castT=0,segs=0,wrt=0,drag=null;const tg=m2tm(),td=m2tm();
  const X=new Float32Array(33),Y=new Float32Array(33),BX=new Float32Array(33),BY=new Float32Array(33),PXs=new Float32Array(33),PYs=new Float32Array(33);
  pointer(cv,(p,k)=>{if(k==='down')drag=Math.hypot(p[0]-B.x,p[1]-B.y+8)<Math.hypot(p[0]-A.x,p[1]-A.y+8)?B:A;if((k==='down'||k==='drag')&&drag){drag.x=clamp(p[0],50,W-8);drag.y=clamp(p[1]+8,18,H-2);}if(k==='up')drag=null;});
  function hop(x0,y0,x1,y1,sd,G,o){const rnd=m2R(sd*7919+1);
    if(o.cons&&G>1){const n0=m2bolt(PXs,PYs,x0,y0,x1,y1,G-1,m2R(sd*7919+1),.2);for(let i=0;i<n0;i++)m2line(u,W,H,PXs[i],PYs[i],PXs[i+1],PYs[i+1],M2SMK[3]);}
    else if(o.cons)m2line(u,W,H,x0,y0,x1,y1,M2SMK[3]);
    const n=m2bolt(X,Y,x0,y0,x1,y1,G,rnd,.2);segs+=n;
    if(o.halo)for(let i=0;i<n;i++)m2line(u,W,H,X[i],Y[i],X[i+1],Y[i+1],rp[2],3);
    if(o.br&&G>1)for(let b=0;b<2;b++){const mi=b?n>>2:n>>1,mx=X[mi],my=Y[mi],dx=mx-x0,dy=my-y0,an=(b?-1:1)*(.3+rnd()*.3),cs=Math.cos(an),sn=Math.sin(an),ex=mx+(dx*cs-dy*sn)*.7,ey=my+(dx*sn+dy*cs)*.7;
        const bn=m2bolt(BX,BY,mx,my,ex,ey,Math.max(1,G-2),rnd,.22);segs+=bn;for(let i=0;i<bn;i++)m2line(u,W,H,BX[i],BY[i],BX[i+1],BY[i+1],rp[3]);}
    if(o.core)for(let i=0;i<n;i++)m2line(u,W,H,X[i],Y[i],X[i+1],Y[i+1],rp[5]);
    if(o.cons)for(let i=1;i<n;i+=2)m2p(u,W,H,X[i],Y[i],M2GOLD);}
  function bolts(G,o){segs=0;hop(M.x+6,M.y-11,A.x,A.y-8,seed,G,o);hop(A.x,A.y-8,B.x,B.y-8,seed+101,G,o);}
  return {tick(dt){fr++;castT+=dt;const G=C.v('g'),N=C.v('n'),o={halo:C.v('halo'),core:C.v('core'),br:C.v('br'),cons:C.v('cons')},hold=C.v('hold'),pulse=C.v('pulse');
    C.out('g',(1<<G)+' seg');C.out('n',N+' fr');
    if(!hold&&fr%N===0)seed=(m2H(seed,fr,7)*256)|0;if(castT>1.3)castT=0;const on=!pulse||castT<.3;
    u.set(bg);for(const d of [A,B]){m2shadow(u,W,H,d.x,d.y);m2draw(u,W,H,M2DUMMY,d.x,d.y);}m2shadow(u,W,H,M.x,M.y);m2draw(u,W,H,M2PLAYER[on?2:0],M.x,M.y);
    m2w=0;if(on){bolts(G,o);m2orb(u,W,H,M.x+6,M.y-11,1.6,rp);}wrt=m2w;
    if(fr%10===0){const t0=performance.now();for(let i=0;i<500;i++)m2bolt(X,Y,20,50,170,40,5,Math.random,.2);tg.add((performance.now()-t0)/500*1000);m2time(td,20,()=>bolts(G,{halo:1,core:1,br:1,cons:0}));}
    F.put();
    if(fr%8===1){setHud(root,'drag a dummy');
      ro.innerHTML=`seed byte <b>0x${seed.toString(16).padStart(2,'0').toUpperCase()}</b> · <b>${segs}</b> segments in 2 hops · <b>${wrt}</b> px writes · ${N===1?'re-rolled every frame, which looks like noise':N<=4?'re-rolled every '+N+' frames, a crackle':'re-rolled every '+N+' frames, slow enough to read each shape'}<br>here: one 32-segment bolt generated in <b>${tg.v.toFixed(2)} µs</b> · 40 bolts with branches and halo drawn in <b>${m2ms(td.v)} ms</b><br>§6a measured, 40 bolts re-rolled every frame: pixel lines <b>0.095 / 0.62 ms</b> · Canvas2D strokes <b>0.92 / 5.85 ms</b> (M4 / 6x throttle) · GPU batch <b>0.054 ms</b>`;}}};});

// ======================================================================
// E1: wind-up, climax and tail. Which frame holds the peak, and how long each frame is held
// ======================================================================
reg('timing',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),rp=M2RAMP[0],SP=m2sparks(0,1),MI=m2missile(0);
  const bg=m2floor(W,H,31),D={x:138,y:48},M={x:34,y:48},FT={fixed:[75,75,75,75,75],front:[33,33,50,83,134]},BR=[1,.72,.5,.3,.14],HEX=M2SRC[0],THIT=.4;
  let mode='fixed',T=0,fr=0,now=null,key='';
  const lvl=(k,pk)=>k<pk?.14+.3*(k+1)/(pk+1):BR[k-pk],X=ms=>40+ms/400*350,Y=v=>104-v*84;
  C.seg('tm',v=>{mode=v;});
  svg.addEventListener('pointerdown',e=>{const r=svg.getBoundingClientRect(),ms=((e.clientX-r.left)/r.width*400-40)/350*400,d=FT[mode];let a=0;for(let k=0;k<5;k++){a+=d[k];if(ms<a||k===4){C.el('pk').value=k+1;break;}}});
  function chart(pk){const d=FT[mode];m2clr(svg);svgEl('line',{x1:40,y1:104,x2:394,y2:104,class:'ax'},svg);svgEl('line',{x1:40,y1:14,x2:40,y2:104,class:'ax'},svg);
    for(const g of [100,200,300,400]){svgEl('line',{x1:X(g),y1:104,x2:X(g),y2:108,class:'ax'},svg);svgText(svg,X(g),121,g+(g===400?' ms':''),{'text-anchor':g===400?'end':'middle','font-size':11});}
    svgText(svg,40,121,'hit',{'text-anchor':'middle','font-size':11});svgText(svg,4,22,'bright',{'font-size':10});
    let a=0;for(let k=0;k<5;k++){const v=lvl(k,pk),col=k<pk?HEX[1]:k===pk?'#ffffff':HEX[Math.max(0,4-(k-pk))];
      svgEl('rect',{x:X(a)+.5,y:Y(v),width:Math.max(1,X(a+d[k])-X(a)-1),height:104-Y(v),fill:col,stroke:k===pk?'#e8c45a':'none','stroke-width':1.5,style:'cursor:pointer'},svg);
      svgText(svg,(X(a)+X(a+d[k]))/2,Y(v)-3,d[k],{'text-anchor':'middle','font-size':10,class:'lab'});a+=d[k];}
    now=svgEl('line',{x1:40,y1:12,x2:40,y2:104,class:'now',stroke:'#ffffff','stroke-dasharray':'3 2'},svg);}
  function gather(x,y,g){const n=6;for(let i=0;i<n;i++){const a=i/n*6.2832+.4,r=3+9*(1-g);m2p(u,W,H,x+Math.cos(a)*r,y+Math.sin(a)*r,rp[3]);m2p(u,W,H,x+Math.cos(a)*(r+1),y+Math.sin(a)*(r+1),rp[2]);}m2orb(u,W,H,x,y,1+2.2*g,rp,Math.min(5,3+Math.round(g*2)));}
  return {tick(dt){fr++;const pk=C.v('pk')-1,slow=C.v('slow'),d=FT[mode],tot=d.reduce((a,b)=>a+b,0);T+=dt*(slow&&T<THIT+tot/1000?.2:1);if(T>THIT+tot/1000+.8)T=0;C.out('pk','frame '+(pk+1)+' of 5');
    if(key!==mode+pk){key=mode+pk;chart(pk);}
    const e=(T-THIT)*1000;let k=-1,a=0;if(e>=0)for(let i=0;i<5;i++){if(e<a+d[i]){k=i;break;}a+=d[i];}
    now.setAttribute('x1',X(clamp(e,0,400)));now.setAttribute('x2',X(clamp(e,0,400)));now.setAttribute('visibility',e>=0&&e<tot?'visible':'hidden');
    u.set(bg);m2shadow(u,W,H,M.x,M.y);m2draw(u,W,H,M2PLAYER[T<THIT?2:0],M.x,M.y);m2shadow(u,W,H,D.x,D.y);m2draw(u,W,H,M2DUMMY,D.x+(e>=0&&e<90?1:0),D.y);
    if(T<THIT){const q=T/THIT;m2blit(u,W,H,MI[0],M.x+8+(D.x-M.x-12)*q,M.y-9,rp);}
    if(k>=0){if(k<pk)gather(D.x,D.y-8,(k+1)/(pk+1));else m2blit(u,W,H,SP[k-pk],D.x,D.y-8-(k-pk),rp);}
    if(e>=0&&e<600){const yy=D.y-22-Math.min(8,e/40)|0;m2txt(u,W,H,D.x-6,yy+1,'-12',M2INK);m2txt(u,W,H,D.x-7,yy,'-12',M2WHITE);}
    F.put();
    if(fr%8===1){let pa=0;for(let i=0;i<pk;i++)pa+=d[i];const cover=d[pk]+(pk<4?d[pk+1]:0),tail=tot-pa-d[pk];
      setHud(root,slow?'slow motion, 1/5 speed':'');
      ro.innerHTML=`peak arrives <b>${pa} ms</b> after the hit${pa<tot/4?', inside the first quarter':', <b>later than the first quarter</b>'} · the damage number shows at 0 ms<br>flash and core hide the target for <b>${cover} ms</b> ${cover<=150?'(inside the 100 to 150 ms cover limit)':'(over the 150 ms cover limit)'} · tail <b>${tail} ms</b> · total <b>${tot} ms</b><br>${mode==='fixed'?'fixed clock: 5 frames x 75 ms, the Tibia effect clock':'front-loaded: 33, 33, 50, 83, 134 ms, the fast-then-slow shape of MUGEN strong sparks (split illustrative)'} · cost <b>none</b>, timing is data`;}}};});

// ======================================================================
// C1: a hit spark split into flash, core, sparks and smoke
// ======================================================================
const M2SPV={light:{nm:'light',n:6,tk:[2,2,2,2,2,2],R:5,sp:4},med:{nm:'medium',n:5,tk:[2,2,2,2,2],R:7,sp:6},strong:{nm:'strong',n:10,tk:[1,1,1,1,1,1,1,2,2,2],R:10,sp:9},clock:{nm:'Tibia clock',n:5,tk:[4.5,4.5,4.5,4.5,4.5],R:7,sp:6}};
function m2spk(u,W,H,cx,cy,V,k,L,rp,seed,cnt){const p=k/V.n,R=V.R;let w0=m2w;
  if(L.smoke&&p>.2)for(let i=0;i<3;i++){const a=m2H(seed,i,1)*6.283,d=R*(.3+.5*p);m2disc(u,W,H,cx+Math.cos(a)*d,cy+Math.sin(a)*d*.6-p*R*.7,R*.42*(1.15-p*.7),M2SMK[p<.5?3:p<.8?2:1],p>.75?.5:1);}
  if(cnt)cnt[3]=m2w-w0;w0=m2w;
  if(L.core&&p<.95){const rc=R*Math.pow(1-p,.8)*.95+.8,ho=p>.35?rc*(p-.2)*1.1:0,top=p<.15?5:p<.4?4:p<.7?3:2,Rr=Math.ceil(rc*1.3)+1;
    for(let j=-Rr;j<=Rr;j++)for(let i=-Rr;i<=Rr;i++){const a=Math.atan2(j,i),d=Math.hypot(i,j)/(1+.22*Math.sin(a*5+k*1.3+seed));if(d>rc+1||d<ho)continue;if(d>rc){m2p(u,W,H,cx+i,cy+j,rp[1]);continue;}m2p(u,W,H,cx+i,cy+j,rp[Math.max(2,Math.round(top-(d-ho)/(rc-ho||1)*(top-2)))]);}}
  if(cnt)cnt[1]=m2w-w0;w0=m2w;
  if(L.sparks&&k>0)for(let i=0;i<V.sp;i++){const a=(i+m2H(seed,i,2)*.7)/V.sp*6.283,e=1-(1-p)*(1-p),r0=R*(.5+1.15*e*(.7+.5*m2H(seed,i,3))),len=R*.55*(1-p),cs=Math.cos(a),sn=Math.sin(a);if(len<.4)continue;m2line(u,W,H,cx+cs*r0,cy+sn*r0,cx+cs*(r0+len),cy+sn*(r0+len),rp[p<.4?5:p<.7?4:3]);}
  if(cnt)cnt[2]=m2w-w0;w0=m2w;
  if(L.flash&&k===0){const Rr=Math.ceil(R*1.7);for(let j=-Rr;j<=Rr;j++)for(let i=-Rr;i<=Rr;i++){const d=Math.hypot(i,j),ax=Math.abs(i),ay=Math.abs(j),sp=Math.min(ax,ay)<1&&Math.max(ax,ay)<=R*1.6;
      if(d<=R*.72||(sp&&Math.max(ax,ay)<=R*1.2))m2p(u,W,H,cx+i,cy+j,M2WHITE);else if(d<=R||sp)m2p(u,W,H,cx+i,cy+j,rp[5]);else if(d<=R+1)m2p(u,W,H,cx+i,cy+j,rp[1]);}}
  if(cnt)cnt[0]=m2w-w0;}
reg('sparkanatomy',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),S=PX(cvs[1]),W=F.W,H=F.H,u=F.u32,su=S.u32,C=ctl(root),ro=$('[data-ro]',root),rp=M2RAMP[0];
  const bg=m2floor(W,H,41),D={x:40,y:44},cell=new Uint32Array(26*26),cnt=[0,0,0,0],tm=m2tm(),SBG=U('#0c0e14'),SB2=U('#1a1d28');let vk='med',k=0,e=0,fr=0,gap=0;
  C.seg('v',v=>{vk=v;k=0;e=0;gap=0;});C.btn('step',()=>{C.el('play').checked=false;k=(k+1)%M2SPV[vk].n;gap=0;});
  return {tick(dt){fr++;const V=M2SPV[vk],L={flash:C.v('flash'),core:C.v('core'),sparks:C.v('sparks'),smoke:C.v('smoke')},msOf=i=>V.tk[i]*1000/60,tot=V.tk.reduce((a,b)=>a+b,0)*1000/60;
    if(C.v('play')){if(gap>0){gap-=dt;if(gap<=0){k=0;e=0;}}else{e+=dt*1000*(C.v('slow')?.2:1);while(gap<=0&&e>=msOf(k)){e-=msOf(k);k++;if(k>=V.n){k=V.n-1;gap=.5;}}}}
    u.set(bg);m2shadow(u,W,H,D.x,D.y);m2draw(u,W,H,M2DUMMY,D.x+(k<2&&gap<=0?1:0),D.y);
    m2w=0;if(gap<=0)m2spk(u,W,H,D.x,D.y-8,V,k,L,rp,7,cnt);else cnt.fill(0);F.put();
    if(fr%6===0)m2time(tm,120,()=>m2spk(u,W,H,D.x,D.y-8,V,k,L,rp,7,null));
    su.fill(SBG);const V2={...V,R:V.R*.62};
    for(let i=0;i<V.n;i++){cell.fill(i===k&&gap<=0?SB2:SBG);m2spk(cell,26,26,13,13,V2,i,L,rp,7,null);const x0=(i%5)*26,y0=((i/5)|0)*26;for(let j=0;j<26;j++)for(let q=0;q<26;q++)su[(y0+j)*S.W+x0+q]=cell[j*26+q];
      if(i===k&&gap<=0){for(let q=0;q<26;q++){su[y0*S.W+x0+q]=M2GOLD;su[(y0+25)*S.W+x0+q]=M2GOLD;su[(y0+q)*S.W+x0]=M2GOLD;su[(y0+q)*S.W+x0+25]=M2GOLD;}}digits(su,S.W,S.H,x0+2,y0+2,i+1,M2SMK[3]);}
    let a=0;for(let i=0;i<V.n;i++){const x0=Math.round(a/tot*128)+1,x1=Math.round((a+msOf(i))/tot*128)+1;m2rect(su,S.W,S.H,x0,55,x1-x0-1,6,i===k&&gap<=0?M2GOLD:i===0?rp[5]:M2SMK[i&1?2:1]);a+=msOf(i);}
    S.put();
    if(fr%8===1){const tk=V.tk.reduce((a,b)=>a+b,0);setHud(root,C.v('slow')?'slow motion, 1/5 speed':'','a');
      ro.innerHTML=`${V.nm} spark · <b>${V.n}</b> frames in <b>${vk==='clock'?'5 x 75 ms':tk+' ticks'}</b> · <b>${Math.round(tot)} ms</b> · showing frame <b>${k+1}</b>, held ${Math.round(msOf(k))} ms<br>px writes this frame: flash <b>${cnt[0]}</b> · core <b>${cnt[1]}</b> · sparks <b>${cnt[2]}</b> · smoke <b>${cnt[3]}</b><br>120 sparks drawn here in <b>${m2ms(tm.v)} ms</b> · §6a measured, 120 live 32x32 impacts: drawImage <b>0.18 / 1.09 ms</b> · ramp blit <b>0.10 / 1.01 ms</b> (M4 / 6x throttle) · one GPU batch <b>0.0058 ms</b>`;}}};});

// ======================================================================
// C2: an explosion as a pure function of (seed, t), beside a stored particle pool
// ======================================================================
const M2PX=new Float32Array(64),M2PY=new Float32Array(64);
function m2puffs(u,W,H,n,fin,rp){const r=(3.5-3*fin)*1.5,c=fin<.15?rp[5]:fin<.3?rp[4]:fin<.5?rp[3]:fin<.75?M2SMK[3]:M2SMK[2],o=fin<.15?rp[4]:fin<.3?rp[3]:fin<.5?rp[2]:fin<.75?M2SMK[1]:M2SMK[0];
  if(fin<.8)for(let i=0;i<n;i++)m2disc(u,W,H,M2PX[i],M2PY[i],r+1,o);for(let i=0;i<n;i++)m2disc(u,W,H,M2PX[i],M2PY[i],r,c,fin>.8?.5:1);}
function m2boom(u,W,H,cx,cy,seed,t,mul,rp){if(t>=20)return;const rnd=m2R(seed*2654435+17),fin=clamp(t/20,0,1),e=1-Math.pow(1-fin,3);
  for(let i=0;i<5*mul;i++){const a=rnd()*6.2832,len=(3+rnd()*13)*e;M2PX[i]=cx+Math.cos(a)*len;M2PY[i]=cy+Math.sin(a)*len-fin*3;}m2puffs(u,W,H,5*mul,fin,rp);
  if(t<6){const f=t/6;m2circ(u,W,H,cx,cy,4+f*15,f<.5?2:1,rp[f<.4?5:4]);}
  for(let i=0;i<4*mul;i++){const a=rnd()*6.2832,d=(4+rnd()*24)*e,l=1+3*(1-fin),cs=Math.cos(a),sn=Math.sin(a);m2line(u,W,H,cx+cs*d,cy+sn*d,cx+cs*(d+l),cy+sn*(d+l),rp[fin<.5?5:fin<.8?4:3]);}}
reg('stateless',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,C=ctl(root),ro=$('[data-ro]',root),rp=M2RAMP[0],bg=m2floor(W,H,53,16,11.5),cx=W>>1,cy=(H>>1)+2;
  const NM=60,P={n:0,age:0,x:new Float32Array(NM),y:new Float32Array(NM),vx:new Float32Array(NM),vy:new Float32Array(NM),k:new Uint8Array(NM)};let T=0,fr=0,steps=0,resim=0,rew=0,lastSeed=-1,lastMul=-1;const ta=m2tm(),tb=m2tm();
  function spawn(seed,mul){const rnd=m2R(seed*2654435+17);P.n=0;P.age=0;const K=.2/(1-Math.pow(.8,20));
    for(let i=0;i<5*mul;i++){const a=rnd()*6.2832,len=3+rnd()*13,j=P.n++;P.x[j]=cx;P.y[j]=cy;P.vx[j]=Math.cos(a)*len*K;P.vy[j]=Math.sin(a)*len*K;P.k[j]=0;}
    for(let i=0;i<4*mul;i++){const a=rnd()*6.2832,d=4+rnd()*24,j=P.n++;P.x[j]=cx;P.y[j]=cy;P.vx[j]=Math.cos(a)*d*K;P.vy[j]=Math.sin(a)*d*K;P.k[j]=1;}}
  function stepP(){for(let j=0;j<P.n;j++){P.x[j]+=P.vx[j];P.y[j]+=P.vy[j];P.vx[j]*=.8;P.vy[j]*=.8;}P.age++;steps++;}
  function drawP(u){const t=P.age;if(t>=20)return;const fin=t/20;
    let q=0;for(let j=0;j<P.n;j++){if(P.k[j]===0){M2PX[q]=P.x[j];M2PY[q++]=P.y[j]-fin*3;}}m2puffs(u,W,H,q,fin,rp);
    if(t<6){const f=t/6;m2circ(u,W,H,cx,cy,4+f*15,f<.5?2:1,rp[f<.4?5:4]);}
    for(let j=0;j<P.n;j++){if(P.k[j]===1){const s=Math.hypot(P.vx[j],P.vy[j])||1,l=1+3*(1-fin);m2line(u,W,H,P.x[j],P.y[j],P.x[j]+P.vx[j]/s*l,P.y[j]+P.vy[j]/s*l,rp[fin<.5?5:fin<.8?4:3]);}}}
  C.on('t',()=>{C.el('play').checked=false;});
  return {tick(dt){fr++;const seed=C.v('seed'),mul=C.v('mul'),play=C.v('play');C.out('seed',seed);C.out('mul','x'+mul+' · '+9*mul+' shapes');let t;
    if(play){T+=dt*60*(C.v('slow')&&T<20?.2:1);if(T>=62){T=0;lastSeed=-1;}t=Math.min(20,T);C.el('t').value=Math.floor(t);}else{t=C.v('t');T=t;}
    C.out('t','tick '+Math.floor(t)+' · '+Math.round(Math.floor(t)*1000/60)+' ms');const tt=Math.floor(t);
    if(seed!==lastSeed||mul!==lastMul){spawn(seed,mul);lastSeed=seed;lastMul=mul;}
    if(tt<P.age){spawn(seed,mul);if(tt>0){rew++;resim+=tt;}}while(P.age<tt)stepP();
    A.u32.set(bg);B.u32.set(bg);m2boom(A.u32,W,H,cx,cy,seed,tt,mul,rp);drawP(B.u32);A.put();B.put();
    if(fr%6===0){m2time(ta,100,()=>m2boom(A.u32,W,H,cx,cy,seed,tt,mul,rp));m2time(tb,100,()=>drawP(B.u32));}
    if(fr%8===1){setHud(root,'f(seed '+seed+', t '+tt+')','a');setHud(root,P.n+' stored particles','b');
      ro.innerHTML=`stateless: <b>0</b> stored particles, about <b>16 B</b> per live effect (report estimate) · any t in any order, so scrubbing back is free<br>pool: <b>${P.n}</b> particles x 20 B = <b>${P.n*20} B</b> · <b>${steps}</b> steps so far · <b>${rew}</b> rewinds cost <b>${resim}</b> re-simulated steps<br>100 explosions drawn here: stateless <b>${m2ms(ta.v)} ms</b> · pool <b>${m2ms(tb.v)} ms</b><br>§6a measured, 2,000 particles: pixel writes <b>0.020 / 0.13 ms</b> · one drawImage each <b>1.66 / 10.5 ms</b> (M4 / 6x throttle) · stateless in a vertex shader <b>0.0095 ms</b>`;}}};});

// ======================================================================
// C3: the same area mask fired in phase and ring by ring
// ======================================================================
const M2ROWS={37:[3,5,7,7,7,5,3],73:[1,5,7,9,9,11,9,9,7,5,1]};
function m2mask(n){const rows=M2ROWS[n],h=rows.length,o=[];for(let j=0;j<h;j++){const w=rows[j];for(let i=0;i<w;i++){const dx=i-(w>>1),dy=j-(h>>1);o.push({dx,dy,ring:Math.round(Math.hypot(dx,dy))});}}return o;}
function m2tilefx(u,W,H,x0,y0,f,rp,sd){const R=[2,3.6,4.5,4.7,4.5,4.1,3.5,2.6][f],HO=[0,0,0,1.2,2.2,3,3.2,2.4][f],TOP=[5,5,4,4,3,3,2,2][f],DR=[0,0,0,.1,.25,.45,.6,.75][f];
  for(let j=-1;j<9;j++)for(let i=-1;i<9;i++){const dx=i-3.5,dy=j-3.5,d=Math.hypot(dx,dy)/(1+.18*Math.sin(Math.atan2(dy,dx)*3+sd+f));if(d>=R||d<HO)continue;if(DR&&m2H(x0+i,y0+j,f+sd)<DR)continue;m2p(u,W,H,x0+i,y0+j,rp[Math.max(2,Math.round(TOP-(d-HO)/(R-HO)*(TOP-2)))]);}}
reg('ringwave',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,C=ctl(root),ro=$('[data-ro]',root),rp=M2RAMP[0],bg=m2floor(W,H,61,8,11.5);
  let n=73,mask=m2mask(73),T=0,fr=0;const pk=[[0,0],[0,0]],cur=[[0,0],[0,0]];C.seg('mask',v=>{n=+v;mask=m2mask(n);T=0;});
  function draw(P,ph,t,ring,s){const u=P.u32;u.set(bg);m2shadow(u,W,H,48,53);m2draw(u,W,H,M2PLAYER[t<500?2:0],48,53);m2w=0;let fl=0;
    for(const m of mask){const f=Math.floor((t-(ph?0:m.ring*ring))/75);if(f<0||f>7)continue;if(f<2)fl++;m2tilefx(u,W,H,44+m.dx*8,44+m.dy*8,f,rp,(m.dx*7+m.dy*13)&7);}
    cur[s][0]=fl;cur[s][1]=m2w;pk[s][0]=Math.max(pk[s][0],fl);pk[s][1]=Math.max(pk[s][1],m2w);P.put();}
  return {tick(dt){fr++;const ring=C.v('ring');C.out('ring',ring+' ms');const end=(mask.reduce((a,m)=>Math.max(a,m.ring),0)*ring+600)/1000;T+=dt*(C.v('slow')&&T<end?.2:1);if(T>end+1.3){T=0;pk[0][0]=pk[0][1]=pk[1][0]=pk[1][1]=0;}
    draw(A,true,T*1000,ring,0);draw(B,false,T*1000,ring,1);
    if(fr%8===1){const rings=mask.reduce((a,m)=>Math.max(a,m.ring),0);
      ro.innerHTML=`in phase: all <b>${n}</b> tiles start in one frame · bright tiles now ${cur[0][0]}, peak <b>${pk[0][0]}</b> · px writes peak <b>${pk[0][1]}</b><br>ring by ring: ${rings} rings x ${ring} ms, the edge starts at <b>${rings*ring} ms</b> · bright tiles now ${cur[1][0]}, peak <b>${pk[1][0]}</b> · px writes peak <b>${pk[1][1]}</b><br>on the wire: one effect per tile ${n} x 9 B = <b>${n*9} B</b> (old protocol ${n*7} B, at 10 B ${n*10} B) · one area event about <b>11 B</b>`;}}};});

// ======================================================================
// C4: a shockwave ring from the midpoint circle that thins and breaks up
// ======================================================================
reg('shockwave',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,C=ctl(root),ro=$('[data-ro]',root),rp=M2RAMP[1],bg=m2floor(W,H,71),cx=W>>1,cy=52;
  const DM=[[cx-30,cy-10],[cx+26,cy-18],[cx+18,cy+34],[cx-22,cy+30]];let T=0,fr=0;const now=[0,0],sum=[0,0],last=[0,0];
  function draw(P,good,p,R,s){const u=P.u32;u.set(bg);const r=good&&C.v('ease')?R*(1-(1-p)*(1-p)):R*p;
    for(const d of DM){const dd=Math.hypot(d[0]-cx,d[1]-8-cy),hit=p<1&&Math.abs(r-dd)<5;m2shadow(u,W,H,d[0],d[1]);m2draw(u,W,H,M2DUMMY,d[0]+(hit?(d[0]>cx?1:-1):0),d[1]);}
    m2shadow(u,W,H,cx,cy+6);m2draw(u,W,H,M2PLAYER[p<.5?2:0],cx,cy+6);m2w=0;
    if(p<1){if(!good){m2circ(u,W,H,cx,cy,r+1,1,rp[1]);m2circ(u,W,H,cx,cy,r,3,rp[5]);}
      else{const th=p<.4?3:p<.75?2:1,k=C.v('bayer')&&p>.6?(p-.6)/.4*.9:0;if(p<.6)m2circ(u,W,H,cx,cy,r+1,1,rp[1]);m2circ(u,W,H,cx,cy,r,th,rp[p<.2?5:p<.6?4:3],k?(x,y)=>bay(x,y)/16<k:null);}}
    now[s]=m2w;sum[s]+=m2w;P.put();}
  return {tick(dt){fr++;const life=C.v('life')/1000,R=C.v('r');C.out('life',C.v('life')+' ms');C.out('r',R+' px');const p0=T/life;T+=dt*(C.v('slow')&&T<life?.15:1);
    if(T>life+1){T=0;last[0]=sum[0];last[1]=sum[1];sum[0]=sum[1]=0;}const p=Math.min(1,T/life);
    if(p<1||p0<1||fr<3){draw(A,false,p,R,0);draw(B,true,p,R,1);}
    if(fr%8===1){setHud(root,C.v('slow')?'slow motion':'','a');
      ro.innerHTML=`keeps its thickness: <b>${p<1?now[0]:0}</b> px writes this frame · <b>${last[0]||sum[0]}</b> over one cast<br>thins and breaks up: <b>${p<1?now[1]:0}</b> px writes this frame · <b>${last[1]||sum[1]}</b> over one cast · 3 px, then 2 at 40%, 1 at 75%, Bayer drop in the last 40%<br>circumference at r = ${R}: about <b>${Math.round(6.2832*R)} px</b> per pixel of thickness<br>§6a measured: CPU ring with a frame copy <b>0.026 / 0.16 ms</b> (M4 / 6x throttle) · GPU distortion with the screen copy <b>0.021 ms</b> at 320x180, <b>0.039 ms</b> at 1280x720`;}}};});

// ======================================================================
// C5: capped decals that fade, and a fire field that steps down in three stages
// ======================================================================
reg('residue',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root),bg=m2floor(W,H,83),FR=M2RAMP[0],IC=M2RAMP[1],TOTAL=12,BD=U('#a8803a');
  const DEC=[];for(let i=0;i<64;i++)DEC.push({on:0,x:0,y:0,k:0,t:0,seed:0,tile:0});const FLD=[];let head=0,ev=0,refr=0,placed=0,kind='scorch',fr=0,spam=0,idle=9,auto=0,ts=0,wrt=0;const tm=m2tm();
  function add(k,x,y,cap){x|=0;y|=0;const tile=(y>>4)*16+(x>>4);for(let i=0;i<cap;i++){const d=DEC[i];if(d.on&&d.tile===tile&&d.k===k){d.t=0;refr++;return;}}
    if(head>=cap)head=0;const d=DEC[head];head=(head+1)%cap;if(d.on)ev++;d.on=1;d.x=x;d.y=y;d.k=k;d.t=0;d.seed=(Math.random()*1e6)|0;d.tile=tile;placed++;}
  function addField(x,y){const tx=clamp(x>>4,0,11),ty=clamp(y>>4,0,5);for(const f of FLD)if(f.tx===tx&&f.ty===ty){f.t=0;return;}if(FLD.length>=6)FLD.shift();FLD.push({tx,ty,t:0});}
  function scorch(d,life){const q=d.t/life,fade=q>.85?1-(q-.85)/.15:1,r=8+(d.seed&3),rot=(d.seed>>3&3)*1.5708;
    for(let j=-r;j<=r;j++)for(let i=-r-1;i<=r+1;i++){const an=Math.atan2(j,i)+rot,dd=Math.hypot(i,j*1.5)/(r*(1+.25*Math.sin(an*3+d.seed)+.12*Math.sin(an*7+d.seed*.3)));if(dd>1)continue;const x=d.x+i,y=d.y+j,cov=(dd<.55?1:(1-dd)/.45*.9+.1)*fade;if(cov*16<=bay(x,y)+.5)continue;m2dk(u,W,H,x,y,dd<.4?5.5:dd<.7?8:11);}
    if(d.t<1.6)for(let k=0;k<4;k++){if(m2H(d.seed,k,(ts*6)|0)<.35)continue;m2p(u,W,H,d.x+(m2H(d.seed,k,1)-.5)*r,d.y+(m2H(d.seed,k,2)-.5)*r*.6,FR[d.t<.5?4:d.t<1?3:2]);}}
  function frost(d,life){const q=d.t/life,fade=q>.85?1-(q-.85)/.15:1,r=7;
    for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const dd=Math.hypot(i,j*1.5)/r;if(dd>1)continue;const x=d.x+i,y=d.y+j;if(x<0||y<0||x>=W||y>=H||(1-dd*.7)*.75*fade*16<=bay(x,y)+.5)continue;u[y*W+x]=mix32(u[y*W+x],IC[dd<.5?4:3],dd<.5?.6:.4);m2w++;}
    for(let k=0;k<6;k++){const a=k*1.0472+(d.seed&7)*.13,len=r*(.55+.45*m2H(d.seed,k,5));for(let s=0;s<len;s++){const x=Math.round(d.x+Math.cos(a)*s),y=Math.round(d.y+Math.sin(a)*s*.66);if(fade*16<=bay(x,y)+.5)continue;m2p(u,W,H,x,y,s<2?IC[4]:IC[3]);}}}
  function field(f){const stg=Math.min(2,(3*f.t/TOTAL)|0),fq=(ts*2)|0,x0=f.tx*16,y0=f.ty*16,n=[5,4,2][stg],hm=[12,8,4][stg];
    for(let j=2;j<15;j++)for(let i=2;i<15;i++)m2dk(u,W,H,x0+i,y0+j,10);
    for(let k=1;k<16;k+=2){m2p(u,W,H,x0+k,y0+1,BD);m2p(u,W,H,x0+k,y0+15,BD);m2p(u,W,H,x0+1,y0+k,BD);m2p(u,W,H,x0+15,y0+k,BD);}
    for(let j=6;j<15;j++)for(let i=2;i<15;i++){const h=m2H(x0+i,y0+j,(fq&1)+stg*2);if(h<[.4,.25,.13][stg])m2p(u,W,H,x0+i,y0+j,FR[h<.05?4:h<.15?3:2]);}
    for(let k=0;k<n;k++){const bx=x0+3+Math.round(k*10/Math.max(1,n-1)),h=Math.max(2,Math.round(hm*(.5+.5*m2H(k,fq,f.tx+f.ty*7)))),by=y0+13-(k&1)*3;
      for(let yy=0;yy<h;yy++){const hw=yy<h*.4?1:0,sw=yy>h*.6?((fq+k)&1?1:-1):0;for(let dx=-hw;dx<=hw;dx++)m2p(u,W,H,bx+dx+sw,by-yy,dx?FR[2]:FR[yy<h*.3?5:yy<h*.65?4:3]);}}}
  function pass(life){for(let i=0;i<64;i++){const d=DEC[(head+i)&63];if(d.on)(d.k?frost:scorch)(d,life);}}
  C.seg('kind',v=>{kind=v;});C.btn('spam',()=>{spam=24;});
  for(let i=0;i<7;i++){add(i%3===1?1:0,20+m2H(i,1,9)*(W-40),18+m2H(i,2,9)*(H-30),16);DEC[i].t=i*1.4;}addField(104,54);placed=0;
  pointer(cv,(p,k)=>{if(k!=='down')return;idle=0;if(kind==='field')addField(p[0]|0,p[1]|0);else add(kind==='frost'?1:0,p[0],p[1],C.v('cap'));});
  return {tick(dt){fr++;ts+=dt;idle+=dt;auto+=dt;const cap=C.v('cap'),life=C.v('life');C.out('cap',cap+' decals');C.out('life',life+' s');
    for(let i=cap;i<64;i++)DEC[i].on=0;if(spam>0&&fr%2===0){spam--;add(Math.random()<.5?1:0,12+Math.random()*(W-24),14+Math.random()*(H-22),cap);}
    if(idle>3&&auto>1.1){auto=0;add(Math.random()<.4?1:0,12+Math.random()*(W-24),14+Math.random()*(H-22),cap);if(!FLD.length)addField(104,54);}
    let live=0;for(const d of DEC){if(!d.on)continue;d.t+=dt;if(d.t>=life)d.on=0;else live++;}
    for(let i=FLD.length-1;i>=0;i--){const f=FLD[i];f.t+=dt;if(f.t>=TOTAL){add(0,f.tx*16+8,f.ty*16+10,cap);FLD.splice(i,1);}}
    u.set(bg);m2w=0;pass(life);wrt=m2w;if(fr%6===0)m2time(tm,10,()=>pass(life));for(const f of FLD)field(f);
    m2shadow(u,W,H,36,70);m2draw(u,W,H,M2PLAYER[0],36,70);m2shadow(u,W,H,158,44);m2draw(u,W,H,M2DUMMY,158,44);F.put();
    if(fr%8===1){setHud(root,'click the floor');const f=FLD[0];
      ro.innerHTML=`decals <b>${live}</b> of cap <b>${cap}</b> · ${placed} placed by you · <b>${ev}</b> evicted, oldest first · <b>${refr}</b> refreshed on the same tile<br>life ${life} s, Bayer fade over the last 15% (illustrative, Mindustry fades in the last 2% of 60 s) · never synced, zero network bytes<br>fire field: ${f?`stage <b>${Math.min(3,((3*f.t/TOTAL)|0)+1)}</b> of 3, ${(TOTAL-f.t).toFixed(1)} s left`:'none placed'} · 3 stages x 4 s here (Tibia 3 x 120 s) · frames at 500 ms · one item change per stage on the wire<br>decal pass here: <b>${wrt}</b> px writes · 10 passes in <b>${m2ms(tm.v)} ms</b> · report: 64 decals are 64 small blits in one batch below the characters`;}}};});

// ======================================================================
// D1: back and front slots around a y-sorted sprite, with start and end overlays
// ======================================================================
reg('slots',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root),bg=m2floor(W,H,97),rp=M2RAMP[4],PIL={x:96,y:66,nm:'pillar'};
  const A={x:142,y:62,face:-1,wf:0,nm:'mage',spr:M2PLAYER,on:true,stT:9},B={x:40,y:76,face:1,wf:0,nm:'healer',spr:M2HEALER,on:true,stT:9};
  let ang=0,idle=9,tgt=null,mode='split',cyc=0,fr=0,ts=0,wrt=0,order='';const tm=m2tm();
  C.seg('mode',v=>{mode=v;});C.btn('tog',()=>{A.on=!A.on;A.stT=0;cyc=0;});
  pointer(cv,(p,k)=>{if(k==='down'||k==='drag'){tgt=[clamp(p[0],8,W-8),clamp(p[1],20,H-3)];idle=0;}});
  function half(e,back,o){const cx=Math.round(e.x),fy=Math.round(e.y),a0=back?.5:0,a1=back?1:.5;if(!(back?o.back:o.front))return;
    if(e.on){m2ell(u,W,H,cx,fy,9,3,rp[back?2:4],a0,a1);m2ell(u,W,H,cx,fy-7,8,3,rp[back?2:3],a0,a1,1);
      for(let k=0;k<12;k++){const a=(k/12+ts*.35)%1;if(a>=a0&&a<a1&&k%3===0){const x=cx+Math.cos(a*6.2832)*9,y=fy+Math.sin(a*6.2832)*3;m2p(u,W,H,x,y,rp[back?3:5]);}}
      for(let k=0;k<3;k++){const a=ts/1.6*6.2832+k*2.0944,s=Math.sin(a);if((s<0)!==back)continue;const x=Math.round(cx+Math.cos(a)*11),y=Math.round(fy-8+s*4);
        if(back){m2p(u,W,H,x,y,rp[3]);m2p(u,W,H,x,y-1,rp[2]);}else{m2p(u,W,H,x,y+1,rp[3]);m2p(u,W,H,x,y,rp[4]);m2p(u,W,H,x,y-1,rp[5]);m2p(u,W,H,x,y-2,rp[4]);}}}
    if(!back&&e.stT<.45&&e.on&&o.start){const f=(e.stT/.075)|0,r=4+f*2.2;m2ell(u,W,H,cx,fy,r,r*.4,rp[f<2?5:f<4?4:3],0,1,f>3?1:0);for(let k=0;k<5;k++){const x=cx-8+k*4,h0=f*4,h1=Math.min(22,f*6+4+(k&1)*3);for(let y=h0;y<h1;y++)m2p(u,W,H,x,fy-y,rp[y>h1-3?3:f<3?5:4]);}}
    if(!back&&e.stT<.3&&!e.on&&o.end){const f=(e.stT/.075)|0,r=11-f*2.5;m2ell(u,W,H,cx,fy,r,r*.4,rp[4-f>1?4-f:2],0,1,1);for(let k=0;k<6;k++)m2p(u,W,H,cx-9+k*3+(k&1),fy-12+f*3+(k*5)%7,rp[f<2?4:3]);}}
  function aura(e,slot,o){if(mode==='split')half(e,slot===0,o);else if((mode==='top')===(slot===1)){half(e,true,o);half(e,false,o);}}
  return {tick(dt){fr++;ts+=dt;idle+=dt;cyc+=dt;A.stT+=dt;const o={back:C.v('back'),front:C.v('front'),start:C.v('start'),end:C.v('end')};
    if(C.v('auto')&&((A.on&&cyc>5)||(!A.on&&cyc>1.6))){A.on=!A.on;A.stT=0;cyc=0;}
    let gx,gy;if(tgt&&idle<3.5){gx=tgt[0];gy=tgt[1];}else{if(tgt){ang=Math.atan2((A.y-64)/18,(A.x-96)/48);tgt=null;}ang+=dt*.55;gx=96+Math.cos(ang)*48;gy=64+Math.sin(ang)*18;}
    const dx=gx-A.x,dy=gy-A.y,d=Math.hypot(dx,dy),s=Math.min(d,40*dt);if(d>.6){A.x+=dx/d*s;A.y+=dy/d*s;A.wf+=dt;if(Math.abs(dx)>.4)A.face=dx<0?-1:1;}
    if(Math.abs(A.x-PIL.x)<9&&Math.abs(A.y-PIL.y)<3)A.y=PIL.y+(A.y>=PIL.y?3:-3);
    const L=[PIL,A,B].sort((a,b)=>a.y-b.y);u.set(bg);m2w=0;
    for(const e of L){if(e===PIL){m2shadow(u,W,H,e.x+1,e.y,8);m2draw(u,W,H,M2PILLAR,e.x,e.y+1);continue;}m2shadow(u,W,H,e.x,e.y);aura(e,0,o);m2draw(u,W,H,e.spr[e===A&&d>.6?((e.wf*7)|0)&1:0],e.x,e.y,e.face<0);aura(e,1,o);}
    wrt=m2w;if(fr%6===0)m2time(tm,15,()=>{aura(A,0,o);aura(A,1,o);aura(B,0,o);aura(B,1,o);});F.put();
    if(fr%8===1){setHud(root,tgt?'walking to your tap':'tap to walk the mage');const nm=mode==='split'?'back, body, front':mode==='top'?'body, then all of the aura':'all of the aura, then body';
      ro.innerHTML=`draw order now: ground → ${L.map(e=>e===PIL?'<b>pillar</b>':`<b>${e.nm}</b> (${nm})`).join(' → ')}<br>state <b>${A.on?'on':'off'}</b> on the mage · start overlay 6 frames and end overlay 4 frames at 75 ms (illustrative) · <b>${wrt}</b> aura px writes this frame<br>30 characters, back and front halves, drawn here in <b>${m2ms(tm.v)} ms</b><br>§6a measured, 30 characters with back, front and 6 orbiters (270 draws): Canvas2D <b>0.25 / 1.62 ms</b> · pixel blits <b>0.039 / 0.24 ms</b> (M4 / 6x throttle) · one GPU batch <b>0.0061 ms</b>`;}}};});

// ======================================================================
// D2: orbiting motes on a 24-step table, heal sparkles and haste ghosts
// ======================================================================
reg('orbit',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root),bg=m2floor(W,H,103),AR=M2RAMP[5],HO=M2RAMP[4],IC=M2RAMP[1],LB=U('#a8a4b8');
  const O={x:28,y:46},HL={x:80,y:46},HS={x:124,y:46,face:1,wf:0,pause:0,mv:true},TX=new Int8Array(24),TY=new Int8Array(24),GX=new Float32Array(8),GY=new Float32Array(8),GF=new Int8Array(8),GW=new Uint8Array(8);
  let tabRx=-1,ry=0,ts=0,fr=0,acc=0,tick=0,gn=0,gh=0,w=[0,0,0];const tm=m2tm();
  function motes(front,n,per,show){const cx=O.x,cy=O.y-7,base=Math.floor(ts/per*24);
    if(show)for(let i=0;i<24;i++){if((i>0&&i<12)===front)m2p(u,W,H,cx+TX[i],cy+TY[i],M2SMK[front?3:1]);}
    for(let k=0;k<n;k++){const i=(base+Math.round(k*24/n))%24,f=i>0&&i<12;if(f!==front)continue;const j=(i+23)%24,x=cx+TX[i],y=cy+TY[i];
      const j2=(i+22)%24;m2p(u,W,H,cx+TX[j2],cy+TY[j2],AR[front?2:1]);m2p(u,W,H,cx+TX[j],cy+TY[j],AR[front?3:2]);if(front){m2p(u,W,H,x,y+1,AR[1]);m2p(u,W,H,x-1,y,AR[3]);m2p(u,W,H,x+1,y,AR[3]);m2p(u,W,H,x,y-1,AR[4]);m2p(u,W,H,x,y,AR[5]);}else{m2p(u,W,H,x,y-1,AR[2]);m2p(u,W,H,x,y,AR[3]);}}}
  function heal(front){const hT=ts%1.8,cx=HL.x,fy=HL.y;if(hT>=.9)return;const p=hT/.9;
    if(!front){const r=3+p*10;m2ell(u,W,H,cx,fy,r,r*.45,HO[p<.3?5:p<.6?4:3],0,1,p>.7?1:0);}
    for(let i=0;i<5;i++){if((i&1)!==(front?1:0))continue;const q=(hT*1000-i*70)/500;if(q<0||q>=1)continue;const x=cx-7+((i*37)%15),y=Math.round(fy-3-((i*5)%6)-q*14);
      if(q<.35){m2p(u,W,H,x,y,HO[5]);m2p(u,W,H,x-1,y,HO[4]);m2p(u,W,H,x+1,y,HO[4]);m2p(u,W,H,x,y-1,HO[4]);m2p(u,W,H,x,y+1,HO[4]);}else if(q<.7){m2p(u,W,H,x,y,HO[4]);m2p(u,W,H,x,y-1,HO[3]);}else m2p(u,W,H,x,y,HO[3]);}}
  function ghosts(G){for(let j=Math.min(gn,G);j>=1;j--){const a=(gh-j+1+16)&7;m2sil(u,W,H,M2PLAYER[GW[a]],GX[a],GY[a],GF[a]<0,IC[Math.max(1,5-j)],j>=3);}}
  return {tick(dt){fr++;const rx=C.v('rx'),per=C.v('per'),n=C.v('n'),G=C.v('g'),show=C.v('show');C.out('rx',rx+' px');C.out('per',per.toFixed(1)+' s');C.out('n',n);C.out('g',G);
    if(rx!==tabRx){tabRx=rx;ry=Math.round(rx*.42);for(let i=0;i<24;i++){TX[i]=Math.round(rx*Math.cos(i/24*6.2832));TY[i]=Math.round(ry*Math.sin(i/24*6.2832));}}
    ts+=dt;acc+=Math.min(dt,.05);while(acc>=1/60){acc-=1/60;tick++;if(HS.pause>0){HS.pause-=1/60;HS.mv=false;if(tick%4===0&&gn>0)gn--;}else{HS.mv=true;HS.x+=HS.face*46/60;HS.wf+=1/60;if(HS.x>150||HS.x<108){HS.face=-HS.face;HS.pause=.9;}
        if(tick%4===0){gh=(gh+1)&7;GX[gh]=HS.x;GY[gh]=HS.y;GF[gh]=HS.face;GW[gh]=((HS.wf*7)|0)&1;gn=Math.min(5,gn+1);}}}
    u.set(bg);for(const [s,x] of [['ORBIT',O.x-9],['HEAL',HL.x-7],['HASTE',120]]){m2txt(u,W,H,x+1,H-8,s,M2INK);m2txt(u,W,H,x,H-9,s,LB);}
    for(const e of [O,HL,HS])m2shadow(u,W,H,e.x,e.y);
    m2w=0;motes(false,n,per,show);m2draw(u,W,H,M2PLAYER[0],O.x,O.y);motes(true,n,per,show);w[0]=m2w;
    m2w=0;heal(false);m2draw(u,W,H,M2HEALER[ts%1.8<.5?2:0],HL.x,HL.y);heal(true);w[1]=m2w;
    m2w=0;ghosts(G);w[2]=m2w;if(fr%6===0)m2time(tm,240,()=>ghosts(4));m2draw(u,W,H,M2PLAYER[HS.mv?((HS.wf*7)|0)&1:0],HS.x,HS.y,HS.face<0);F.put();
    if(fr%8===1)ro.innerHTML=`orbit: 24-step table, rx ${rx} px, ry ${ry} px · <b>${n}</b> motes${n>4?' (over the cap of 4 per character)':''} · one turn in <b>${per.toFixed(1)} s</b>${per<1?', which looks frantic':per>2?', slower than the 1.2 to 2.0 s range':''} · ${n} table lookups, <b>0</b> sin or cos per frame<br>heal: 5 sparkles rising 14 px over 500 ms · <b>${w[1]}</b> px writes<br>haste: <b>${Math.min(gn,G)}</b> of ${G} ghosts, one captured every 4 frames, only while moving · <b>${w[2]}</b> px writes · 240 sprites with 4 ghosts each here in <b>${m2ms(tm.v)} ms</b><br>§6a measured, 240 sprites with 4 ghosts each: pixel blits <b>0.096 / 0.60 ms</b> · drawImage <b>1.0 / 6.35 ms</b> (M4 / 6x throttle)`;}};});

// ======================================================================
// D3: a rim-only shield beside a filled bubble, with a directional hit flash and a break ring
// ======================================================================
reg('shield',root=>{const cvs=$$('canvas',root),PA=PX(cvs[0]),PB=PX(cvs[1]),W=PA.W,H=PA.H,C=ctl(root),ro=$('[data-ro]',root),bg=m2floor(W,H,113),rp=M2RAMP[1],FI=M2RAMP[0],MI=m2missile(0),SPF=m2sparks(0,.58);
  const cx=36,fy=44,cy=fy-8,RX=10,RY=11,tmp=new Uint32Array(W*H),MS=[],NM=['E','SE','S','SW','W','NW','N','NE'],body=[];let hp=4,hitT=9,hitA=0,brk=9,down=false,bodyT=9,idle=9,auto=0,fr=0,lastA=null;const hid=[0,0];
  {const s=M2PLAYER[0];for(let j=0;j<s.h;j++)for(let i=0;i<s.w;i++)if(s.d[j*s.w+i])body.push((fy-s.h+1+j)*W+cx-(s.w>>1)+i);}
  const fire=a=>{MS.push({a,d:40});};
  for(const cv of cvs)pointer(cv,(p,k)=>{if(k==='down'){idle=0;fire(Math.atan2(p[1]-cy,p[0]-cx));}});
  function flash(u,back){if(hitT>=.24)return;const a=((hitA/6.2832)%1+1)%1,isBack=a>.5;if(isBack!==back)return;const f=(hitT/.075)|0;
    if(f===0){m2ell(u,W,H,cx,cy,RX,RY,M2WHITE,a-.12,a+.12);m2ell(u,W,H,cx,cy,RX+1,RY+1,rp[5],a-.09,a+.09);m2ell(u,W,H,cx,cy,RX+3,RY+3,rp[4],a-.06,a+.06,1);}
    else if(f===1){m2ell(u,W,H,cx,cy,RX,RY,rp[5],a-.1,a+.1);m2ell(u,W,H,cx,cy,RX+2,RY+2,rp[4],a-.06,a+.06,1);}else m2ell(u,W,H,cx,cy,RX,RY,rp[4],a-.07,a+.07);}
  function draw(P,filled,s){const u=P.u32;u.set(bg);m2shadow(u,W,H,cx,fy);const up=!down;
    if(up&&!filled){m2ell(u,W,H,cx,cy,RX,RY,rp[2],.5,1);m2ell(u,W,H,cx,fy,9,3,rp[2],.5,1);flash(u,true);}
    m2draw(u,W,H,M2PLAYER[0],cx,fy,false,bodyT<.075?()=>M2WHITE:null);tmp.set(u);
    if(up&&!filled){m2ell(u,W,H,cx,cy,RX,RY,rp[3],0,.5);m2ell(u,W,H,cx,fy,9,3,rp[3],0,.5);m2ell(u,W,H,cx,cy,RX-1,RY-1,rp[4],.56,.68);m2p(u,W,H,cx-5,cy-6,rp[5]);m2p(u,W,H,cx-4,cy-7,rp[5]);flash(u,false);}
    if(up&&filled){const hot=hitT<.15;for(let j=-RY;j<=RY;j++)for(let i=-RX;i<=RX;i++){const d=Math.hypot(i/RX,j/RY);if(d>1)continue;const x=cx+i,y=cy+j;if(d>.86)m2p(u,W,H,x,y,hot?rp[5]:rp[4]);else if(hot||12>bay(x,y)+.5)m2p(u,W,H,x,y,hot?rp[4]:i+j<-4?rp[4]:d>.6?rp[2]:rp[3]);}}
    if(brk<.9){const p=brk/.9;m2ell(u,W,H,cx,cy,RX*(1+p),RY*(1+p),rp[p<.25?5:p<.5?4:p<.75?3:2],0,1,p>.5?1:0);if(p<.6)for(let k=0;k<8;k++){const a=k*.785+.3,r=RX+p*22;m2p(u,W,H,cx+Math.cos(a)*r,cy+Math.sin(a)*r,rp[p<.3?5:4]);}}
    let n=0;for(const i of body)if(u[i]!==tmp[i])n++;hid[s]=Math.round(n/body.length*100);
    for(const m of MS){const x=cx+Math.cos(m.a)*m.d,y=cy+Math.sin(m.a)*m.d;m2blit(u,W,H,MI[m2dir8(-Math.cos(m.a),-Math.sin(m.a))],x,y,FI);}
    if(hitT<.225&&lastA!==null){const r=RX+1;m2blit(u,W,H,SPF[1+((hitT/.075)|0)],cx+Math.cos(lastA)*r,cy+Math.sin(lastA)*r,FI);}P.put();}
  return {tick(dt){fr++;hitT+=dt;brk+=dt;bodyT+=dt;idle+=dt;auto+=dt;const mx=C.v('hits');C.out('hits',mx+' hits');if(hp>mx)hp=mx;
    if(idle>3&&auto>1.25){auto=0;fire(((Math.random()*8)|0)*.7854+(Math.random()-.5)*.3);}
    for(let i=MS.length-1;i>=0;i--){const m=MS[i];m.d-=170*dt;if(m.d<=(down?3:RX+1)){MS.splice(i,1);lastA=m.a;hitA=m.a;if(down){bodyT=0;hitT=9;}else{hitT=0;hp--;if(hp<=0){down=true;brk=0;}}}}
    if(down&&brk>2.6){down=false;hp=mx;}
    draw(PA,true,0);draw(PB,false,1);
    if(fr%8===1){setHud(root,'click around the mage','a');let l1='no hit yet';if(lastA!==null){const k=(Math.round(lastA/.7854)+8)&7,deg=Math.round(((lastA*180/Math.PI)+450)%360);l1=`last hit from <b>${NM[k]}</b> (${deg}°) · hit overlay <b>${k+1}</b> of 8, drawn <b>${Math.sin(lastA)<0?'behind':'in front of'}</b> the body`;}
      ro.innerHTML=`${l1}<br>shield: ${down?`<b>broken</b>, the ring grew from 1x to 2x radius, re-forms in ${Math.max(0,2.6-brk).toFixed(1)} s`:`<b>${hp}</b> of ${mx} hits left`}<br>body pixels hidden right now: filled bubble <b>${hid[0]}%</b> · rim only <b>${hid[1]}%</b><br>cost, from the report: a hit-only spark costs nothing while idle · a persistent loop is 30 extra animated overlays in a 30-player fight`;}}};});

// ======================================================================
// D4: one multiply tint per status, one shown by priority, and a small overlay
// ======================================================================
const M2TINT={froz:[8,13,20],shock:[15,14,21],burn:[20,10,6],pois:[9,17,7]},M2PRI=['froz','shock','burn','pois'],M2STN={froz:'frozen',shock:'shocked',burn:'burning',pois:'poisoned'},M2STE={burn:0,froz:1,shock:2,pois:3};
const M2GLY={burn:['00100','01100','01110','11111','01110'],froz:['10101','01110','11111','01110','10101'],shock:['00110','01100','11111','00110','01100'],pois:['01110','10001','10101','10001','01110']};
reg('statustint',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root),bg=m2floor(W,H,127),HW=24,HH=27,hb=new Uint32Array(HW*HH);
  let mode='pri',fr=0,ts=0,ncache=0,rb=0;const tm=m2tm(),crowd=[],hero={spr:M2PLAYER,ph:0,st:{}};
  const shuffle=()=>{crowd.length=0;for(let i=0;i<30;i++){const st={};for(const k of M2PRI)st[k]=Math.random()<.3;crowd.push({x:70+(i%6)*21,y:24+((i/6)|0)*17,spr:M2CROWD[(Math.random()*6)|0],ph:Math.random()*2,st});}};shuffle();
  C.seg('mode',v=>{mode=v;});C.btn('shuf',shuffle);
  function tinted(s,key,m){const t=s.tn||(s.tn={});if(!t[key]){const d=new Uint32Array(s.d.length);for(let i=0;i<d.length;i++){const c=s.d[i];if(c)d[i]=m2mul(c,m[0],m[1],m[2]);}t[key]={w:s.w,h:s.h,d};ncache++;}return t[key];}
  function draw(b,BW,BH,e,x,y,icon){const act=M2PRI.filter(k=>e.st[k]),top=act[0],s0=e.spr[e.st.froz?0:((ts*4+e.ph)|0)&1];let s=s0,white=false;
    if(top&&mode==='mul'){const m=[16,16,16];for(const k of act)for(let q=0;q<3;q++)m[q]=m[q]*M2TINT[k][q]/16;s=tinted(s0,act.join('+'),m);}
    else if(top==='froz')s=tinted(s0,'froz',M2TINT.froz);else if(top==='shock'){if((ts*2.5)%1<.17)white=true;else s=tinted(s0,'shock',M2TINT.shock);}
    else if(top==='burn')s=((ts*7)|0)&1?tinted(s0,'burn2',[22,13,7]):tinted(s0,'burn',M2TINT.burn);else if(top==='pois')s=(ts%1)<.5?tinted(s0,'pois',M2TINT.pois):tinted(s0,'pois2',[14,16,13]);
    m2draw(b,BW,BH,s,x,y,false,white?()=>M2WHITE:null);if(!top)return act;const rp=M2RAMP[M2STE[top]];
    if(top==='burn'){const f=((ts*7)|0)&1;for(const [ox,oy] of [[-4,-14],[4,-12]]){m2p(b,BW,BH,x+ox,y+oy,rp[4]);m2p(b,BW,BH,x+ox,y+oy-1,rp[3]);m2p(b,BW,BH,x+ox+(f?1:-1),y+oy-2,rp[3]);m2p(b,BW,BH,x+ox,y+oy+1,rp[5]);}}
    else if(top==='pois'){const q=ts%1;m2p(b,BW,BH,x+3,Math.round(y-9+q*8),rp[4]);m2p(b,BW,BH,x+3,Math.round(y-10+q*8),rp[3]);if(q>.85){m2p(b,BW,BH,x+2,y,rp[3]);m2p(b,BW,BH,x+4,y,rp[3]);}}
    else if(top==='shock'){const q=(ts*10)|0;let ax=x-6,ay=y-12+((m2H(q,1)*9)|0);for(let k=0;k<3;k++){const bx=ax+4,by=y-13+((m2H(q*5+k,2)*11)|0);m2line(b,BW,BH,ax,ay,bx,by,(q+k)&1?rp[5]:rp[3]);ax=bx;ay=by;}}
    else{const L=(x0,y0,x1,y1,c)=>m2line(b,BW,BH,x0,y0,x1,y1,c);L(x-7,y,x-4,y-7,rp[4]);L(x-4,y-7,x-2,y,rp[3]);L(x+1,y,x+4,y-8,rp[4]);L(x+4,y-8,x+6,y,rp[3]);L(x-2,y,x,y-5,rp[5]);L(x,y-5,x+2,y,rp[3]);}
    if(icon){const g=M2GLY[top],gx=x-2,gy=y-24;for(let j=-1;j<6;j++)for(let i=-1;i<6;i++){const on=j>=0&&j<5&&i>=0&&i<5&&g[j][i]==='1';m2p(b,BW,BH,gx+i,gy+j,on?rp[5]:rp[1]);}}return act;}
  function measure(){const s=M2PLAYER[0],src=document.createElement('canvas'),oc=document.createElement('canvas'),dst=document.createElement('canvas');src.width=oc.width=s.w;src.height=oc.height=s.h;dst.width=320;dst.height=180;
    const sx=src.getContext('2d'),ox=oc.getContext('2d'),dx=dst.getContext('2d'),im=sx.createImageData(s.w,s.h);new Uint32Array(im.data.buffer).set(s.d);sx.putImageData(im,0,0);const runs=[];
    for(let r=0;r<7;r++){const t0=performance.now();for(let i=0;i<30;i++){ox.clearRect(0,0,s.w,s.h);ox.drawImage(src,0,0);const g=ox.getImageData(0,0,s.w,s.h),p=g.data;for(let q=0;q<p.length;q+=4){p[q]=Math.min(255,p[q]*20>>4);p[q+1]=p[q+1]*10>>4;p[q+2]=p[q+2]*6>>4;}ox.putImageData(g,0,0);dx.drawImage(oc,(i%10)*20,((i/10)|0)*20);}runs.push(performance.now()-t0);}
    runs.sort((a,b)=>a-b);rb=runs[3];}
  C.btn('rb',measure);
  return {tick(dt){fr++;ts+=dt;for(const k of M2PRI)hero.st[k]=C.v(k);u.set(bg);
    for(const e of crowd)m2shadow(u,W,H,e.x,e.y);const all=()=>{for(const e of crowd)draw(u,W,H,e,e.x,e.y,false);};all();if(fr%6===0)m2time(tm,10,all);
    for(let j=-2;j<=2;j++)for(let i=-11;i<=11;i++)if(i*i/121+j*j/4<1)u[(76+j)*W+30+i]=m2mul(u[(76+j)*W+30+i],10.4);
    hb.fill(0);const act=draw(hb,HW,HH,hero,12,25,true);for(let j=0;j<HH;j++)for(let i=0;i<HW;i++){const c=hb[j*HW+i];if(!c)continue;const x0=6+i*2,y0=24+j*2;for(let q=0;q<2;q++)for(let p=0;p<2;p++)u[(y0+q)*W+x0+p]=c;}
    F.put();
    if(fr%8===1){let l1;if(!act.length)l1='you: no status, plain sprite';else if(mode==='pri')l1=`you: ${act.map(k=>M2STN[k]).join(' + ')} · shown: <b>${M2STN[act[0]]}</b>, the top priority (frozen, shocked, burning, poisoned is our order)`;
      else{const m=[16,16,16];for(const k of act)for(let q=0;q<3;q++)m[q]=m[q]*M2TINT[k][q]/16;l1=`you: ${act.map(k=>M2STN[k]).join(' x ')} · all tints multiplied = <b>(${m.map(v=>(v/16).toFixed(2)).join(', ')})</b>${act.length>2?', a dark mud that names no status':''}`;}
      ro.innerHTML=`${l1}<br>cache: <b>${ncache}</b> pre-tinted sprites, ${(ncache*768).toLocaleString('en-US')} B · 30 characters drawn from it 10 times here in <b>${m2ms(tm.v)} ms</b><br>per-frame readback: ${rb?`measured here <b>${m2ms(rb)} ms</b> for 30 characters, one frame`:'press the button to measure it here'} · §6a measured <b>9 ms</b> for 30 characters on a GPU-backed canvas<br>§6a measured on the GPU: per-instance tint <b>0.0065 ms</b> in one draw · per-sprite uniform <b>0.015 ms</b>`;}}};});

// ======================================================================
// D5: a procedural rune circle that draws in over the cast time, with a charge at the hand
// ======================================================================
const M2POLY=[[3,1],[6,2],[4,1],[5,1],[4,1],[5,2]];
reg('castcircle',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,C=ctl(root),ro=$('[data-ro]',root),bg=m2floor(W,H,131,16,11.5),M={x:96,y:60};
  let el=0,rx=40,T=0,fr=0,key='',R=null,wrt=0,ringPx=0;const tm=m2tm();C.seg('el',v=>{el=+v;});C.seg('size',v=>{rx=+v;});
  function build(){const ry=rx>>1,X=[],Y=[],Uu=[],K=[];const arc=(ax,ay,cls,uf)=>{const n=Math.max(8,((ax+ay)*3.4)|0);let lx=-999,ly=-999;for(let i=0;i<=n;i++){const a=(.75+i/n)*6.2832,x=Math.round(Math.cos(a)*ax),y=Math.round(Math.sin(a)*ay);if(x===lx&&y===ly)continue;lx=x;ly=y;X.push(x);Y.push(y);Uu.push(uf(i/n));K.push(cls);}};
    arc(rx,ry,0,g=>g*.5);arc(rx*.7,ry*.7,1,g=>.2+.5*(1-g));const ng=rx>=50?12:rx>=30?10:8,P=[],G=[];for(let s=0;s<32;s++)P.push([Math.round(Math.cos(s/32*6.2832)*rx*.85),Math.round(Math.sin(s/32*6.2832)*ry*.85)]);
    for(let k=0;k<ng;k++)G.push(((m2H(el*13+rx,k,3)*511)|0)|16|(1<<(k%9)));return {ry,n:X.length,X,Y,U:Uu,K,ng,P,G};}
  function circle(t,dur,rot){const rp=M2RAMP[el],cx=M.x,cy=M.y-1,ry=R.ry;let p=clamp(t/dur,0,1),b=p>.85?5:4,dot=0;if(t>dur){const q=(t-dur)/.25;if(q>=1)return;b=q<.25?5:q<.5?4:q<.75?3:2;dot=q>.5;p=1;}
    ringPx=0;for(let i=0;i<R.n;i++){if(R.U[i]>p||(dot&&(i&1)))continue;if(R.K[i]===0)m2p(u,W,H,cx+R.X[i],cy+R.Y[i]+1,rp[1]);m2p(u,W,H,cx+R.X[i],cy+R.Y[i],R.K[i]?rp[Math.max(2,b-1)]:rp[b]);ringPx++;}
    const step=Math.floor(t*rot/360*32);for(let k=0;k<R.ng;k++){if(p<.25+.5*k/R.ng||(dot&&(k&1)))continue;const s=R.P[((Math.round(k*32/R.ng)+step)%32+32)%32],bits=R.G[k];for(let q=0;q<9;q++)if(bits>>q&1)m2p(u,W,H,cx+s[0]+q%3-1,cy+s[1]+((q/3)|0)-1,rp[b]);}
    const nv=M2POLY[el][0],sk=M2POLY[el][1],ed=Math.ceil(clamp((p-.45)/.5,0,1)*nv),ra=Math.floor(t*rot/5)/72;if(!dot)for(let k=0;k<ed;k++){const a1=(k*sk/nv+ra)*6.2832-1.5708,a2=((k+1)*sk/nv+ra)*6.2832-1.5708;m2line(u,W,H,cx+Math.cos(a1)*rx*.6,cy+Math.sin(a1)*ry*.6,cx+Math.cos(a2)*rx*.6,cy+Math.sin(a2)*ry*.6,rp[Math.max(2,b-1)]);}}
  function charge(t,dur){const rp=M2RAMP[el],hx=M.x+6,hy=M.y-11;if(t<=dur){const p=t/dur,n=3+Math.ceil(p*6);for(let i=0;i<n;i++){const q=(t*1.4+m2H(i,3))%1,a=m2H(i,5)*6.2832+t,r=(1-q*q)*15+1;m2p(u,W,H,hx+Math.cos(a)*r,hy+Math.sin(a)*r*.8,rp[q<.4?2:q<.75?3:4]);}m2orb(u,W,H,hx,hy,.8+p*1.9,rp,Math.min(5,2+Math.ceil(p*3)));}
    else{const q=t-dur;if(q<.075){m2disc(u,W,H,hx,hy,4.5,rp[5]);m2disc(u,W,H,hx,hy,3,M2WHITE);}const mx=hx+4+q*260;if(mx<W+8)m2blit(u,W,H,m2missile(el===1?1:el===2?2:el===4?3:0)[0],mx,hy,rp);}}
  return {tick(dt){fr++;const dur=C.v('dur'),rot=C.v('rot');C.out('dur',dur.toFixed(1)+' s');C.out('rot',rot+'°/s');T+=dt;if(T>dur+1)T=0;
    if(key!==el+'_'+rx){key=el+'_'+rx;R=build();}
    u.set(bg);m2w=0;circle(T,dur,rot);m2shadow(u,W,H,M.x,M.y);m2draw(u,W,H,M2PLAYER[T<dur+.2?2:0],M.x,M.y);charge(T,dur);wrt=m2w;if(fr%6===0)m2time(tm,30,()=>circle(Math.min(T,dur),dur,rot));F.put();
    if(fr%8===1){const p=Math.min(1,T/dur);setHud(root,T<=dur?'casting '+Math.round(p*100)+'%':'release');
      ro.innerHTML=`${M2ELN[el]} circle ${rx*2}x${R.ry*2} px · <b>${ringPx}</b> ring px · <b>${R.ng}</b> glyphs of 3x3 px on 32 fixed slots · <b>${M2POLY[el][0]}</b> polygon lines · <b>${wrt}</b> px writes this frame<br>cast time <b>${dur.toFixed(1)} s</b>${dur<.3?', <b>under 300 ms there is no time for a draw-in</b>':''} · turning at ${rot}°/s${rot?', one turn in <b>'+(360/rot).toFixed(1)+' s</b>':''}${rot>80?', which reads as a threat':rot>0?', which reads as charging':''}<br>30 casters' circles drawn here in <b>${m2ms(tm.v)} ms</b> · cast event <b>8 B</b> in the Sandbox (illustrative): caster, spell, element, cast time<br>baked instead, from the report: 8 elements x 32 frames fit a 512x512 atlas, one quad per caster`;}}};});
