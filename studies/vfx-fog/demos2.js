// ======================================================================
// demos2: clouds and cloud shadows, fog of war, atmosphere and light,
// gameplay fog and weather, palette and readability (families D to H).
// Local helpers are prefixed f2 so they never clash with core.js or the
// other demos files. Uses only the generic core.js helpers
// ($, $$, clamp, lerp, smooth, bay, U, un32, mix32, mulc, PX, pointer,
// ctl, setHud, svgEl, svgText, reg, motion).
// Fog rule used everywhere here: density -> a few flat bands toward a
// desaturated sky hue, Bayer dither only in a thin strip at each band
// edge, the matrix indexed by world pixels, drift in whole pixels.
// ======================================================================
const f2Hx=(a,b,c)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1)^Math.imul(c|0,0x9e3779b1);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;h=Math.imul(h,0x297a2d39);h^=h>>>15;return (h>>>0)/4294967296;};
// page palette: 40 entries, original picks. Ramps shift cool in the dark and warm in the light.
const f2DEF=[['g0','#22402f'],['g1','#2e5a3a'],['g2','#3f7446'],['g3','#5a8e4e'],['g4','#88b060'],
  ['d0','#4a3428'],['d1','#6b4e38'],['d2','#8f6d4b'],['d3','#c2a46c'],
  ['r0','#3a3a4a'],['r1','#5a5a6a'],['r2','#84828e'],['r3','#b0aeb4'],
  ['w0','#203658'],['w1','#2c5680'],['w2','#4682a6'],['w3','#8cc0d0'],
  ['t0','#3c2a20'],['l0','#18322a'],['l1','#244c34'],['l2','#356a3c'],['l3','#558c46'],
  ['f0','#552c30'],['f1','#86423a'],['f2','#ae5e40'],['m0','#8a7a66'],['m1','#c8b694'],
  ['ink','#12141c'],['skin','#e8b48a'],['hair','#4a2e22'],['sh','#3f78b8'],['sh2','#2a5288'],['pa','#3a3448'],
  ['red','#c8443c'],['red2','#842c30'],['gold','#e8c45a'],['gold2','#a8803a'],['wht','#f4f0e6'],['lamp','#ffd98a'],['lamp2','#fff4d0']];
const f2I={};f2DEF.forEach((d,i)=>{f2I[d[0]]=i;});
const f2P=Uint32Array.from(f2DEF,d=>U(d[1])),f2NP=f2DEF.length,f2PSET=new Set(f2P);
// one palette step darker (cloud shadows, tree shadows): the artist's own ramp, never a multiply
const f2SH=(()=>{const m={g4:'g2',g3:'g1',g2:'g0',g1:'l0',g0:'l0',d3:'d2',d2:'d1',d1:'d0',d0:'t0',r3:'r2',r2:'r1',r1:'r0',r0:'ink',w3:'w2',w2:'w1',w1:'w0',w0:'w0',t0:'ink',
  l3:'l2',l2:'l1',l1:'l0',l0:'ink',f2:'f1',f1:'f0',f0:'ink',m1:'m0',m0:'d1',ink:'ink',skin:'d2',hair:'t0',sh:'sh2',sh2:'pa',pa:'ink',red:'red2',red2:'f0',gold:'gold2',gold2:'d1',wht:'m1',lamp:'gold',lamp2:'lamp'};
  return Uint8Array.from(f2DEF,d=>f2I[m[d[0]]]);})();
// tileable fbm value noise, normalised 0..1 (a baked noise table)
function f2tile(W,H,cell,seed,oct=3,gain=.5){const a=new Float32Array(W*H);let amp=1;
  for(let o=0;o<oct;o++){const c=cell/(1<<o);if(c<2)break;const pw=Math.max(1,Math.round(W/c)),ph=Math.max(1,Math.round(H/c)),L=new Float32Array(pw*ph);
    for(let j=0;j<ph;j++)for(let i=0;i<pw;i++)L[j*pw+i]=f2Hx(i,j,seed*31+o);
    const sx=pw/W,sy=ph/H;
    for(let y=0;y<H;y++){const fy=y*sy,yi=Math.floor(fy),ty=fy-yi,vy=ty*ty*(3-2*ty),y0=(yi%ph)*pw,y1=((yi+1)%ph)*pw;
      for(let x=0;x<W;x++){const fx=x*sx,xi=Math.floor(fx),tx=fx-xi,vx=tx*tx*(3-2*tx),x0=xi%pw,x1=(xi+1)%pw;
        const p=L[y0+x0]+(L[y0+x1]-L[y0+x0])*vx,q=L[y1+x0]+(L[y1+x1]-L[y1+x0])*vx;a[y*W+x]+=amp*(p+(q-p)*vy);}}
    amp*=gain;}
  let mn=1e9,mx=-1e9;for(let i=0;i<a.length;i++){const v=a[i];if(v<mn)mn=v;if(v>mx)mx=v;}const k=1/(mx-mn||1);for(let i=0;i<a.length;i++)a[i]=(a[i]-mn)*k;return a;}
// band level 0..N from density d; dither only in the top e of each band, matrix indexed by world (x, y)
const f2lv=(d,N,x,y,e=.4)=>{const v=d*N;if(v<=0)return 0;if(v>=N)return N;let b=v|0;const f=v-b,e0=1-e;if(f>e0&&(f-e0)/e*16>bay(x,y)+.5)b++;return b;};
// fog lookup table: level k pulls every palette colour toward the fog colour by k/N * maxT
function f2ramp(fog,N,maxT,base=f2P){const n=base.length,R=new Uint32Array((N+1)*n);for(let k=0;k<=N;k++){const t=k/N*maxT;for(let i=0;i<n;i++)R[k*n+i]=mix32(base[i],fog,t);}return R;}
const f2lum=c=>{const [r,g,b]=un32(c).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*r+.7152*g+.0722*b;};
const f2desat=(c,k)=>{const [r,g,b]=un32(c),l=.3*r+.59*g+.11*b;return pack(lerp(r,l,k),lerp(g,l,k),lerp(b,l,k));};
const f2tm=()=>({v:0,add(ms){this.v=this.v?this.v*.92+ms*.08:ms;return this.v;}});
const f2ms=v=>v>=10?v.toFixed(1):v>=1?v.toFixed(2):v>=.1?v.toFixed(3):v.toFixed(4);
const f2cols=u=>new Set(u).size;
const f2off=u=>{let n=0;for(const c of new Set(u))if(!f2PSET.has(c))n++;return n;};
const f2fmtH=h=>{h=((h%24)+24)%24;return String(h|0).padStart(2,'0')+':'+String(Math.floor((h%1)*60)).padStart(2,'0');};
const f2clr=svg=>{while(svg.firstChild)svg.removeChild(svg.firstChild);};
// sprites: rows of letters, map letter -> value (palette index or colour); bottom centre at (x, y)
function f2spr(b,W,H,rows,map,x,y,flip=false,mask,id=1){const h=rows.length,w=rows[0].length,x0=Math.round(x-(w-1)/2),y0=Math.round(y-h+1);
  for(let j=0;j<h;j++){const yy=y0+j;if(yy<0||yy>=H)continue;const r=rows[j];for(let i=0;i<w;i++){const ch=r[flip?w-1-i:i];if(ch==='.')continue;const v=map[ch];if(v===undefined)continue;const xx=x0+i;if(xx<0||xx>=W)continue;b[yy*W+xx]=v;if(mask)mask[yy*W+xx]=id;}}}
const f2map=o=>{const m={};for(const k in o)m[k]=f2I[o[k]];return m;};
const f2mapC=o=>{const m={};for(const k in o)m[k]=f2P[f2I[o[k]]];return m;};
const f2BODY=["..hhh..",".hhhhh.",".hssse.",".hssss.","..sss..",".cccc..","cccCcc.","cCcccs.",".cccc.."];
const f2LEGS=[[".llll..",".l..l..","bb..bb."],[".lll...","..ll...","..bb..."],[".llll..","l...l..","b....b."]];
const f2walk=fr=>f2BODY.concat(f2LEGS[fr%3]);
const f2MW={h:'hair',s:'skin',e:'ink',c:'sh',C:'sh2',l:'pa',b:'ink'};
const f2SLIME=["..rrr..",".rwrrr.","rrerrer","rrrrrrr","RrrrrrR",".RRRRR."],f2MS={r:'red',R:'red2',e:'ink',w:'wht'};
const f2CHEST=[".ddddd.","dgggggd","dDDyDDd","dgggggd",".ddddd."],f2MC={d:'d0',g:'d2',D:'gold2',y:'gold'};
const f2POST=[".L.","LyL",".L.",".p.",".p.",".p.","ppp"],f2MP={L:'gold2',y:'lamp2',p:'r0'};
// a small highland world as palette indices: grass, water, sand, rock, a path, trees, rocks, houses
function f2world(W,H,seed,o={}){const h=f2tile(W,H,o.cell||64,seed,4),det=f2tile(W,H,16,seed+5,2),idx=new Uint8Array(W*H),I=f2I,wl=o.water===undefined?.3:o.water,rk=o.rock||.86,G=[I.g1,I.g2,I.g3,I.g4],lamps=[];
  const pathY=x=>(o.pathY||H*.55)+Math.sin(x/W*Math.PI*2*2)*H*.08;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,v=h[i];let c;
    if(v<wl){const dp=(wl-v)/.12;c=dp>1.4?I.w0:dp>.55?I.w1:I.w2;if(dp<.55&&f2Hx(x,y,seed)<.05)c=I.w3;}
    else if(v<wl+.022)c=v<wl+.008?I.d2:I.d3;
    else if(v>rk){c=det[i]>.55?I.r2:I.r1;if(v>rk+.05)c=det[i]>.5?I.r3:I.r2;}
    else{const g=clamp(det[i]*.75+(v-wl)*.5,0,.999);c=G[Math.min(3,f2lv(g,3,x,y,.3))];const q=f2Hx(x,y,seed+3);if(q<.016)c=I.g4;else if(q<.04)c=I.g0;}
    if(o.path&&v>=wl+.022&&v<=rk){const dy=Math.abs(y-pathY(x));if(dy<2.2)c=f2Hx(x,y,seed+8)<.15?I.d3:I.d2;else if(dy<3.2)c=I.d1;}
    idx[i]=c;}
  const set=(x,y,c)=>{x=((x%W)+W)%W;y=((y%H)+H)%H;idx[y*W+x]=c;},get=(x,y)=>idx[(((y%H)+H)%H)*W+(((x%W)+W)%W)];
  const grassy=(x,y)=>{const c=get(x,y);return c>=I.g0&&c<=I.g4;};
  const props=[];const g=o.grid||14;
  if(o.houses)for(const [hx,hy] of o.houses)props.push({k:'h',x:hx,y:hy});
  for(let gy=0;gy<H/g;gy++)for(let gx=0;gx<W/g;gx++){const r=f2Hx(gx,gy,seed+9),x=Math.floor(gx*g+f2Hx(gx,gy,seed+10)*g*.8),y=Math.floor(gy*g+f2Hx(gx,gy,seed+11)*g*.8);
    if(!grassy(x,y)||!grassy(x,y-8)||!grassy(x+4,y)||!grassy(x-4,y))continue;if(o.path&&Math.abs(y-pathY(x))<9)continue;
    if(o.houses&&o.houses.some(([hx,hy])=>Math.abs(x-hx-6)<14&&y>hy-18&&y<hy+8))continue;
    if(r<(o.trees===undefined?.3:o.trees))props.push({k:'t',x,y,r:4+((f2Hx(gx,gy,seed+12)*3)|0)});else if(r<(o.trees||.3)+.07)props.push({k:'r',x,y});}
  props.sort((a,b)=>a.y-b.y);
  for(const p of props){
    if(p.k==='t'){const r=p.r;for(let j=-2;j<=2;j++)for(let i=-r-1;i<=r+2;i++){if((i-1)*(i-1)/((r+1.5)*(r+1.5))+j*j/5>1)continue;set(p.x+i,p.y+j+1,f2SH[get(p.x+i,p.y+j+1)]);}
      for(let j=-2;j<=0;j++){set(p.x,p.y+j,I.t0);set(p.x+1,p.y+j,I.t0);}
      const cy=p.y-2-r;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const d2=i*i+j*j;if(d2>r*r+r*.6)continue;const s=(i*.55+j*.85)/r;let c=s>.5?I.l0:s>-.05?I.l1:s>-.6?I.l2:I.l3;
        const q=f2Hx(p.x+i,cy+j,seed+13);if(q<.07&&c>I.l0)c--;else if(q<.14&&c<I.l3)c++;if(d2>(r-1)*(r-1)&&s>.1)c=I.l0;set(p.x+i,cy+j,c);}}
    else if(p.k==='r'){const R=[".aa.","abba","accb"];const M={a:I.r2,b:I.r1,c:I.r0};for(let j=0;j<3;j++)for(let i=0;i<4;i++){const ch=R[j][i];if(ch!=='.')set(p.x+i-2,p.y+j-2,M[ch]);}set(p.x-1,p.y-3,I.r3);}
    else{const x=p.x,y=p.y,ww=12,wh=6;for(let j=0;j<=wh;j++){set(x+ww,y-j,f2SH[get(x+ww,y-j)]);set(x+ww+1,y-j+1,f2SH[get(x+ww+1,y-j+1)]);}
      for(let j=0;j<wh;j++)for(let i=0;i<ww;i++)set(x+i,y-j,i>=ww-3?I.m0:I.m1);
      for(let j=0;j<4;j++){set(x+2,y-j,I.d0);set(x+3,y-j,I.d0);}set(x+7,y-2,I.lamp);set(x+8,y-2,I.lamp);set(x+7,y-3,I.lamp2);set(x+8,y-3,I.lamp);
      for(let rr=0;rr<7;rr++){const yy=y-wh-rr,l=x-1+(rr>>1),r=x+ww-(rr>>1);for(let xx=l;xx<=r;xx++){let c=rr===0?I.f0:(xx<l+(r-l)*.45?I.f2:I.f1);if(rr===6)c=I.f2;if(rr>0&&xx===r)c=I.f0;set(xx,yy,c);}}
      lamps.push({x:x+7.5,y:y-2.5});}}
  return {W,H,idx,h,lamps,props};}
// copy a wrapped window of the world into a view buffer
function f2copy(w,buf,W,H,cx,cy){for(let y=0;y<H;y++){const wy=(((y+cy)%w.H)+w.H)%w.H;for(let x=0;x<W;x++)buf[y*W+x]=w.idx[wy*w.W+((((x+cx)%w.W)+w.W)%w.W)];}}

// ======================================================================
// D1: cloud shapes from a thresholded scrolling noise table
// ======================================================================
reg('cloudshapes',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),T=PX(cvs[1]),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const WW=256,w=f2world(WW,WW,11,{water:.27,trees:.3,path:1,houses:[[40,150],[180,70]]}),N=f2tile(256,256,64,23,4,.55);
  const CL=U('#eef2ef'),CL2=U('#cbd5d9'),CL3=U('#9fadb8'),TH=[U('#0e1820'),U('#22343e'),U('#3b5260'),U('#5c7684')],TC=U('#e9f1f2'),TW=U('#ffc874'),TV=U('#7fd8e0');
  const tm=f2tm();let t=0,fr=0,camX=0,ox=0,oy=0,thr=.5,under=0;
  return {tick(dt){fr++;if(motion)t+=dt;const cover=c.v('cov')/100,band=c.v('band'),wind=c.v('wind'),lock=c.v('lock'),pan=c.v('pan');
    c.out('cov',Math.round(cover*100)+'%');c.out('band',band+' px');c.out('wind',wind+' px/s');
    camX=pan?Math.floor(t*6):0;ox=Math.floor(t*wind);oy=Math.floor(t*wind*.4);thr=1-cover;const e=band*.014,ovc=cover>.9;
    const t0=performance.now();let nu=0;
    for(let y=0;y<H;y++){const wy=y+60;for(let x=0;x<W;x++){const wx=x+camX,lx=lock?wx:x,ly=lock?wy:y;
      const n=N[((wy-oy)&255)*256+((wx-ox)&255)],sn=N[((wy-16-oy)&255)*256+((wx-9-ox)&255)];
      let g=w.idx[(wy&255)*WW+(wx&255)];if(ovc)g=f2SH[g];
      if(sn>=thr||(e>0&&sn>thr-e&&(sn-thr+e)/e*16>bay(lx,ly)+.5))g=f2SH[g];
      let col=f2P[g];
      if(n>=thr){nu++;const nb=N[((wy+3-oy)&255)*256+((wx-ox)&255)];col=nb<thr+.02?CL2:ovc?CL2:CL;if(nb<thr-.02&&!ovc)col=CL3;}
      else if(e>0&&n>thr-e&&(n-thr+e)/e*16>bay(lx,ly)+.5)col=ovc?CL3:CL2;
      u[y*W+x]=col;}}
    tm.add(performance.now()-t0);under=nu/(W*H);F.put();
    if(fr%4===1){const tu=T.u32,TWd=T.W;for(let y=0;y<T.H;y++)for(let x=0;x<TWd;x++){const v=N[(y*4)*256+x*4];let col=TH[Math.min(3,(v*4)|0)];if(v>=thr)col=TC;
        if(v>=thr&&(N[(y*4)*256+((x+1)&63)*4]<thr||N[(((y+1)&63)*4)*256+x*4]<thr||N[(y*4)*256+((x+63)&63)*4]<thr||N[(((y+63)&63)*4)*256+x*4]<thr))col=TW;tu[y*TWd+x]=col;}
      const vx=((camX-ox)&255)>>2,vy=((60-oy)&255)>>2,vw=W>>2,vh=H>>2;
      for(let i=0;i<=vw;i++){tu[(vy&63)*TWd+((vx+i)&63)]=TV;tu[((vy+vh)&63)*TWd+((vx+i)&63)]=TV;}for(let j=0;j<=vh;j++){tu[((vy+j)&63)*TWd+(vx&63)]=TV;tu[((vy+j)&63)*TWd+((vx+vw)&63)]=TV;}T.put();}
    if(fr%10===1){setHud(root,ovc?'overcast palette':`thr = 1 − cover = ${thr.toFixed(2)}`);
      ro.innerHTML=`cover <b>${Math.round(cover*100)}%</b> · threshold <b>${thr.toFixed(2)}</b> · <b>${Math.round(under*100)}%</b> of the view under cloud · drift <b>${wind} px/s</b> in whole pixels<br>cost measured here, JS on the CPU, ${W}x${H}: <b>${f2ms(tm.v)} ms</b> per frame · §6a measured, M4 GPU, one fetch: <b>0.0008 ms</b> at 320x180, <b>0.010 ms</b> at 720p`;}}};});

// ======================================================================
// D2: palette-step shadow vs multiply shadow, off-palette colour count
// ======================================================================
reg('cloudshadow',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,c=ctl(root),ro=$('[data-ro]',root);
  const WW=256,w=f2world(WW,WW,4,{water:.3,trees:.34,path:1,houses:[[70,100],[100,96]]}),N=f2tile(256,256,64,31,4,.55),thr=.56;
  const ta=f2tm(),tb=f2tm();let t=0,fr=0,ca=0,cb=0,oa=0,ob=0;const CX=58,CY=52;
  return {tick(dt){fr++;if(motion)t+=dt;const ang=c.v('sun')*Math.PI/180,wind=c.v('wind'),d50=c.v('d50');
    c.out('sun',c.v('sun')+'°');c.out('wind',wind+' px/s');
    // the sun sits at angle ang; shadows land away from it, so sample the cloud at p - offset
    const offX=Math.round(-Math.cos(ang)*12),offY=Math.round(-Math.sin(ang)*12),ox=Math.floor(t*wind),oy=Math.floor(t*wind*.3);
    const ua=A.u32,ub=B.u32;let t0=performance.now();
    for(let y=0;y<H;y++){const wy=y+CY;for(let x=0;x<W;x++){const wx=x+CX,g=w.idx[wy*WW+wx],n=N[((wy-offY-oy)&255)*256+((wx-offX-ox)&255)],s=smooth(thr-.07,thr+.07,n);
      ua[y*W+x]=s>0?mulc(f2P[g],1-.42*s,1-.4*s,1-.3*s):f2P[g];}}
    ta.add(performance.now()-t0);t0=performance.now();
    for(let y=0;y<H;y++){const wy=y+CY;for(let x=0;x<W;x++){const wx=x+CX,g=w.idx[wy*WW+wx],n=N[((wy-offY-oy)&255)*256+((wx-offX-ox)&255)];
      let sh=n>=thr||(n>thr-.035&&(n-thr+.035)/.035*16>bay(wx,wy)+.5);if(sh&&d50&&((wx+wy)&1))sh=false;
      ub[y*W+x]=f2P[sh?f2SH[g]:g];}}
    tb.add(performance.now()-t0);
    // sun marker in each corner
    for(const u of [ua,ub]){const sx=Math.round(W/2+Math.cos(ang)*(W/2-5)),sy=Math.round(H/2+Math.sin(ang)*(H/2-5));for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){if(i*i+j*j>5)continue;const xx=clamp(sx+i,0,W-1),yy=clamp(sy+j,0,H-1);u[yy*W+xx]=i*i+j*j>2?f2P[f2I.gold]:f2P[f2I.lamp2];}}
    A.put();B.put();
    if(fr%15===1){ca=f2cols(ua);cb=f2cols(ub);oa=f2off(ua);ob=f2off(ub);}
    if(fr%10===1){setHud(root,`multiply: ${ca} colours`,'a');setHud(root,`palette step: ${cb} colours`,'b');
      ro.innerHTML=`multiply makes <b>${oa}</b> colours that are not in the 40-colour palette · palette step makes <b>${ob}</b> · shadow offset (${offX}, ${offY}) px, away from the sun<br>cost measured here, JS, ${W}x${H}: multiply <b>${f2ms(ta.v)} ms</b>, palette step <b>${f2ms(tb.v)} ms</b> · §6a measured, M4 GPU, palette pass: <b>0.016 ms</b> at 720p`;}}};});

// ======================================================================
// D3: overhead clouds with parallax, faster than the shadows, dithered fade over the player
// ======================================================================
function f2puff(seed,w,h){const a=new Uint8Array(w*h),C=[],n=3+((f2Hx(seed,1,1)*3)|0);
  for(let k=0;k<n;k++){const r=h*.22+f2Hx(seed,k,2)*h*.14,f=k/(n-1),cx=w*.2+w*.6*f+(f2Hx(seed,k,3)-.5)*4,cy=h*.66-Math.sin(f*Math.PI)*h*.2-(k&1)*r*.25;C.push([cx,cy,r]);}
  const inside=(x,y)=>{if(x<0||y<0||x>=w||y>=h||y>h*.8)return false;for(const [cx,cy,r] of C)if((x+.5-cx)**2+(y+.5-cy)**2<=r*r)return true;return false;};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(inside(x,y)){let v=4;if(!inside(x,y+2)||!inside(x,y+1))v=2;else if(!inside(x-1,y-1)&&y<h*.6)v=5;else if(!inside(x+1,y+3))v=3;a[y*w+x]=v;}
    else if(inside(x+1,y)||inside(x-1,y)||inside(x,y+1)||inside(x,y-1))a[y*w+x]=1;}
  return {w,h,a};}
reg('overhead',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root);
  const WW=256,w=f2world(WW,WW,7,{water:.07,trees:.34,path:1,houses:[[120,110],[60,200]]}),N=f2tile(256,256,64,41,4,.55),thr=.6,view=new Uint8Array(W*H);
  const PC=[0,U('#7f8ea0'),U('#c3cdd5'),U('#dfe6ea'),U('#f3f5f2'),U('#ffffff')],puffs=[f2puff(3,46,26),f2puff(8,58,30),f2puff(15,38,22)],CX0=[0,120,230],CY0=[6,70,128],SPAN=330;
  const tm=f2tm(),MW=f2map(f2MW);let t=0,ct=0,fr=0,dist=0,px=128,py=128,dir=1;
  return {tick(dt){fr++;const freeze=c.v('rm'),par=c.v('par')/100,R=c.v('rad'),fade=c.v('fade'),sp=c.v('wind');
    c.out('par',par.toFixed(2)+'x');c.out('rad',R+' px');c.out('wind',sp+' px/s');
    t+=dt;if(motion&&!freeze)ct+=dt;
    const nx=128+70*Math.sin(t*.11),ny=128+46*Math.sin(t*.17);dist+=Math.hypot(nx-px,ny-py);dir=nx>px?1:-1;px=nx;py=ny;
    const camX=Math.round(px)-W/2,camY=Math.round(py)-H/2,t0=performance.now();
    f2copy(w,view,W,H,camX,camY);
    f2spr(view,W,H,f2walk(motion?((dist/3)|0):0),MW,W/2,H/2+5,dir<0);
    const ox=Math.floor(ct*sp),oy=Math.floor(ct*sp*.45);
    for(let y=0;y<H;y++){const wy=y+camY;for(let x=0;x<W;x++){const wx=x+camX,n=N[((wy-oy)&255)*256+((wx-ox)&255)];let g=view[y*W+x];
      if(n>=thr||(n>thr-.03&&(n-thr+.03)/.03*16>bay(wx,wy)+.5))g=f2SH[g];u[y*W+x]=f2P[g];}}
    // overhead clouds: their own plane, 1.9x the shadow speed, parallax par against the camera
    const pcx=W/2,pcy=H/2-1,co=ct*sp*1.9;
    for(let k=0;k<3;k++){const p=puffs[k];let sx=CX0[k]+co-camX*par;sx=((sx%SPAN)+SPAN)%SPAN-70;let sy=CY0[k]+co*.2-camY*par;sy=((sy%180)+180)%180-40;sx=Math.round(sx);sy=Math.round(sy);
      for(let j=0;j<p.h;j++){const yy=sy+j;if(yy<0||yy>=H)continue;for(let i=0;i<p.w;i++){const v=p.a[j*p.w+i];if(!v)continue;const xx=sx+i;if(xx<0||xx>=W)continue;
        if(fade&&R>0){const d=Math.hypot(xx-pcx,yy-pcy),a=smooth(R*.5,R,d);if(a<1&&a*16<=bay(xx+camX,yy+camY)+.5)continue;}u[yy*W+xx]=PC[v];}}}
    tm.add(performance.now()-t0);F.put();
    if(fr%10===1){setHud(root,freeze?'reduce motion: drift frozen':`clouds ${(sp*1.9).toFixed(1)} px/s · shadows ${sp} px/s`);
      ro.innerHTML=`shadows on the ground at parallax 1.0, drifting <b>${sp} px/s</b> · overhead clouds at parallax <b>${par.toFixed(2)}</b>, drifting <b>${(sp*1.9).toFixed(1)} px/s</b> (1.9x) · fade ${fade?`within <b>${R} px</b> of the walker`:'<b>off</b>, so a cloud can hide the walker'}<br>cost measured here, JS, whole ${W}x${H} frame: <b>${f2ms(tm.v)} ms</b> · §6a measured, M4 GPU, one thresholded layer: <b>0.0008 ms</b> at 320x180 · network: <b>0 bytes</b>`;}}};});

// ======================================================================
// E1/E2: visibility counts and an explored bit; full recompute vs naive re-stamp vs delta edges
// ======================================================================
reg('fowcounts',root=>{const cv=$('canvas',root),F=PX(cv),G=F.W,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),M=G-1,NC=G*G;
  // terrain as a minimap: water, sand, meadow, forest, rock
  const h=f2tile(G,G,32,5,4),dt2=f2tile(G,G,8,9,2),TER=new Uint32Array(NC),MEM=new Uint32Array(NC),UNK=U('#0a0d15'),TCH=U('#ffc874'),UC=U('#ffffff'),UC2=U('#7fd8e0'),MEMC=U('#1a2234');
  for(let i=0;i<NC;i++){const v=h[i],d=dt2[i];let col=v<.3?(v<.22?f2P[f2I.w1]:f2P[f2I.w2]):v<.33?f2P[f2I.d3]:v>.8?(d>.5?f2P[f2I.r2]:f2P[f2I.r1]):d>.62?f2P[f2I.l1]:d>.5?f2P[f2I.l2]:d>.3?f2P[f2I.g2]:f2P[f2I.g3];TER[i]=col;MEM[i]=mix32(f2desat(col,.6),MEMC,.55);}
  let NU=0,R=0,ux,uy,tx,ty,area,OFF,ENT,LEA,cntF,cntR,cntD,exp,tch,stamp=0,acc=0,fr=0,touched=[0,0,0],match=true,checks=0;const TM=[f2tm(),f2tm(),f2tm()];
  const wrap=(x,y)=>((y&M)*G)+(x&M);
  function circle(r){const o=[];for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r)o.push([x,y]);return o;}
  function build(){const nu=Math.round(10*Math.pow(100,c.v('n')/100)),r=+c.segv('r');if(nu===NU&&r===R)return;NU=nu;R=r;
    ux=new Int32Array(NU);uy=new Int32Array(NU);tx=new Int32Array(NU);ty=new Int32Array(NU);
    for(let k=0;k<NU;k++){ux[k]=(f2Hx(k,1,77)*G)|0;uy[k]=(f2Hx(k,2,77)*G)|0;tx[k]=(f2Hx(k,3,77)*G)|0;ty[k]=(f2Hx(k,4,77)*G)|0;}
    const C=circle(R),S=2*R+5,inC=new Uint8Array(S*S),key=(x,y)=>(y+R+2)*S+(x+R+2);for(const [x,y] of C)inC[key(x,y)]=1;area=C.length;OFF=C;
    ENT=[];LEA=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const e=[],l=[];for(const [x,y] of C){if(!inC[key(x-dx,y-dy)])l.push(x,y);if(!inC[key(x+dx,y+dy)])e.push(x+dx,y+dy);}ENT.push(Int32Array.from(e));LEA.push(Int32Array.from(l));}
    cntF=new Uint16Array(NC);cntR=new Uint16Array(NC);cntD=new Uint16Array(NC);exp=new Uint8Array(NC);tch=new Uint32Array(NC);
    for(let k=0;k<NU;k++)for(const [x,y] of OFF){const i=wrap(ux[k]+x,uy[k]+y);cntR[i]++;cntD[i]++;exp[i]=1;}}
  const oxA=new Int32Array(1000),oyA=new Int32Array(1000),dxA=new Int8Array(1000),dyA=new Int8Array(1000);
  function update(){build();const mv=+c.segv('mv')/100;stamp++;
    for(let k=0;k<NU;k++){oxA[k]=ux[k];oyA[k]=uy[k];dxA[k]=0;dyA[k]=0;
      if(f2Hx(k,stamp,5)<mv){let ddx=tx[k]-ux[k],ddy=ty[k]-uy[k];if(ddx>G/2)ddx-=G;if(ddx<-G/2)ddx+=G;if(ddy>G/2)ddy-=G;if(ddy<-G/2)ddy+=G;
        if(!ddx&&!ddy){tx[k]=(f2Hx(k,stamp,6)*G)|0;ty[k]=(f2Hx(k,stamp,7)*G)|0;}else{dxA[k]=Math.sign(ddx);dyA[k]=Math.sign(ddy);ux[k]=(ux[k]+dxA[k])&M;uy[k]=(uy[k]+dyA[k])&M;}}}
    // 1) full recompute: clear, stamp every unit, rebuild explored
    let t0=performance.now();cntF.fill(0);for(let k=0;k<NU;k++){const x0=ux[k],y0=uy[k];for(let j=0;j<area;j++){const o=OFF[j];cntF[((y0+o[1])&M)*G+((x0+o[0])&M)]++;}}
    for(let i=0;i<NC;i++)if(cntF[i])exp[i]=1;TM[0].add(performance.now()-t0);touched[0]=NC+NU*area;
    // 2) naive re-stamp: every unit removes its old circle and adds the new one
    t0=performance.now();for(let k=0;k<NU;k++){const ax=oxA[k],ay=oyA[k],bx=ux[k],by=uy[k];for(let j=0;j<area;j++){const o=OFF[j];cntR[((ay+o[1])&M)*G+((ax+o[0])&M)]--;}
      for(let j=0;j<area;j++){const o=OFF[j];cntR[((by+o[1])&M)*G+((bx+o[0])&M)]++;}}TM[1].add(performance.now()-t0);touched[1]=2*NU*area;
    // 3) delta: only units that changed cell touch their precomputed enter and leave crescents
    t0=performance.now();let td=0;for(let k=0;k<NU;k++){if(!dxA[k]&&!dyA[k])continue;const d=(dyA[k]+1)*3+dxA[k]+1,E=ENT[d],L=LEA[d],ax=oxA[k],ay=oyA[k];
      for(let j=0;j<L.length;j+=2){const i=((ay+L[j+1])&M)*G+((ax+L[j])&M);cntD[i]--;tch[i]=stamp;}
      for(let j=0;j<E.length;j+=2){const i=((ay+E[j+1])&M)*G+((ax+E[j])&M);if(++cntD[i]===1)exp[i]=1;tch[i]=stamp;}td+=L.length/2+E.length/2;}
    TM[2].add(performance.now()-t0);touched[2]=td;
    if(stamp%20===0){checks++;match=true;for(let i=0;i<NC;i++)if(cntF[i]!==cntD[i]||cntF[i]!==cntR[i]){match=false;break;}}}
  // chart: log-scale bars of measured ms with the §6a reference tick
  const NAMES=['Full recompute','Naive re-stamp','Delta edges'],COLS=['#e8a06a','#d8c27a','#7fd8e0'],REF={4:{10:[.0013,.0006,.0003],100:[.0084,.0103,.0033],1000:[.070,.110,.033]},8:{10:[.0035,.0032,.0005],100:[.020,.031,.0047],1000:[.184,.308,.048]}};
  const X0=118,X1=392,lg=v=>X0+(X1-X0)*clamp((Math.log10(Math.max(v,1e-5))+5)/6,0,1);
  svgText(svg,4,14,'ms per update, log scale · bar: here · tick: §6a',{'font-size':12,fill:'#93a5b3'});
  for(const v of [1e-4,1e-3,.01,.1,1]){const x=lg(v);svgEl('line',{x1:x,x2:x,y1:22,y2:118,stroke:'#22323e'},svg);svgText(svg,x,130,String(v),{'font-size':10,fill:'#93a5b3','text-anchor':'middle'});}
  const bars=[],labs=[],refs=[];for(let i=0;i<3;i++){const y=28+i*30;svgText(svg,4,y+13,NAMES[i],{'font-size':12,fill:COLS[i]});bars.push(svgEl('rect',{x:X0,y,width:1,height:16,fill:COLS[i],rx:2},svg));
    refs.push(svgEl('line',{x1:0,x2:0,y1:y-3,y2:y+19,stroke:'#ffffff','stroke-width':2},svg));labs.push(svgText(svg,X0,y+29,'',{'font-size':11,fill:'#cfdde8'}));}
  c.on('n',()=>{});c.seg('r',()=>{});c.seg('mv',()=>{});build();
  return {tick(dt){fr++;if(motion)acc+=dt;let n=0;while(acc>=.1&&n<3){acc-=.1;update();n++;}if(!motion&&fr%6===0)update();
    const show=c.v('tch');c.out('n',NU+' units');
    for(let i=0;i<NC;i++)u[i]=cntD[i]?TER[i]:exp[i]?MEM[i]:UNK;
    if(show)for(let i=0;i<NC;i++)if(tch[i]===stamp)u[i]=TCH;
    for(let k=0;k<NU;k++){const i=wrap(ux[k],uy[k]);u[i]=UC;if(NU<=100){u[wrap(ux[k]+1,uy[k])]=UC2;u[wrap(ux[k],uy[k]+1)]=UC2;}}
    F.put();
    if(fr%8===1){const rk=NU<32?10:NU<316?100:1000,rf=REF[R][rk];
      for(let i=0;i<3;i++){const v=TM[i].v;bars[i].setAttribute('width',Math.max(2,lg(v)-X0));const rx=lg(rf[i]);refs[i].setAttribute('x1',rx);refs[i].setAttribute('x2',rx);
        labs[i].textContent=`${f2ms(v)} ms · ${touched[i].toLocaleString('en-US')} cells · §6a ${rf[i]}`;}
      setHud(root,`${NU} units · radius ${R}`);
      ro.innerHTML=`${G}x${G} grid, Uint16 counts plus an explored bit, 10 updates/s · delta is <b>${(TM[0].v/Math.max(TM[2].v,1e-6)).toFixed(1)}x</b> cheaper than a full recompute here · ${checks?`grids agree after ${checks*20} updates: <b>${match?'yes':'no'}</b>`:'grids compared every 20 updates'}<br>§6a reference row: ${rk} units, radius ${R}, 256x256 grid (4x the cells of this one)`;}}};});

// ======================================================================
// E3: soft fog-of-war edges: hard cells, 16-case edge tiles, bilinear + blur, bilinear + Bayer
// ======================================================================
reg('fowedges',root=>{const cvs=$$('canvas',root),FS=cvs.map(cv=>PX(cv)),W=FS[0].W,H=FS[0].H,c=ctl(root),ro=$('[data-ro]',root),CS=8,GX=W/CS,GY=H/CS;
  const w=f2world(W,H,21,{cell:32,water:.24,trees:.4,grid:11}),UNK=U('#0a0d16'),EXPC=U('#1a2133');
  const VIS=new Uint32Array(W*H),EXP=new Uint32Array(W*H),RV=new Uint32Array(W*H),RK=new Uint32Array(W*H);
  for(let i=0;i<W*H;i++){const col=f2P[w.idx[i]];VIS[i]=col;EXP[i]=mix32(f2desat(col,.5),EXPC,.6);RV[i]=mix32(col,EXP[i],.55);RK[i]=mix32(EXP[i],UNK,.55);}
  // 16 marching-squares masks (8x8): 1 inside, 2 inside rim
  const MASK=[];for(let k=0;k<16;k++){const m=new Uint8Array(64),a=k&1,b=(k>>1)&1,cc=(k>>2)&1,d=(k>>3)&1;
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){const fx=(x+.5)/8,fy=(y+.5)/8,v=(a*(1-fx)+b*fx)*(1-fy)+(cc*(1-fx)+d*fx)*fy;m[y*8+x]=v>=.5?(v<.64?2:1):0;}MASK.push(m);}
  const cell=new Float32Array(GX*GY),explored=new Uint8Array(GX*GY),sv=new Float32Array(W*H),tmp=new Float32Array(W*H),OUT=[0,1,2,3].map(()=>new Uint32Array(W*H)),TM=[0,1,2,3].map(()=>f2tm());
  for(let j=0;j<GY;j++)for(let i=0;i<3;i++)explored[j*GX+i]=1;
  let A=[30,34],t=0,fr=0,cols=[0,0,0,0],drag=false;const at=(x,y)=>cell[clamp(y,0,GY-1)*GX+clamp(x,0,GX-1)];
  const toWorld=(p,z)=>{const [ox,oy]=crop(z);return [ox+p[0]/z,oy+p[1]/z];};
  const crop=z=>[clamp(Math.round(A[0]-W/z/2),0,W-W/z),clamp(Math.round(A[1]-H/z/2),0,H-H/z)];
  cvs.forEach(cv=>pointer(cv,(p,k)=>{if(k==='down')drag=true;if(k==='up'||k==='leave')drag=false;if(k==='down'||k==='drag'){const z=+c.segv('z');A=toWorld(p,z).map(Math.round);A[0]=clamp(A[0],2,W-3);A[1]=clamp(A[1],2,H-3);}}));
  c.seg('z',()=>{});
  return {tick(dt){fr++;if(motion)t+=dt;const B=[W*.62+Math.cos(t*.5)*W*.2,H*.5+Math.sin(t*.7)*H*.28],rad=2.4;
    for(let j=0;j<GY;j++)for(let i=0;i<GX;i++){const x=(i+.5)*CS,y=(j+.5)*CS;let v=false;for(const p of [A,B])if(Math.hypot((x-p[0])/CS,(y-p[1])/CS)<=rad)v=true;const k=j*GX+i;if(v)explored[k]=1;cell[k]=v?1:explored[k]?.5:0;}
    // hard cells
    let t0=performance.now(),o=OUT[0];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,v=cell[(y>>3)*GX+(x>>3)];o[i]=v>=1?VIS[i]:v>0?EXP[i]:UNK;}TM[0].add(performance.now()-t0);
    // 16-case edge tiles on the dual grid (one case per 2x2 block of cells), two layers: known and visible
    t0=performance.now();o=OUT[1];for(let y=0;y<H;y++){const j=Math.floor((y-4)/8),ly=y-4-j*8;for(let x=0;x<W;x++){const i=Math.floor((x-4)/8),lx=x-4-i*8,q=ly*8+lx;
      const a=at(i,j),b=at(i+1,j),cc=at(i,j+1),d=at(i+1,j+1),kv=(a>=1)|(b>=1)<<1|(cc>=1)<<2|(d>=1)<<3,kk=(a>0)|(b>0)<<1|(cc>0)<<2|(d>0)<<3,mv=MASK[kv][q],mk=MASK[kk][q],p=y*W+x;
      o[p]=mv===1?VIS[p]:mv===2?RV[p]:mk===1?EXP[p]:mk===2?RK[p]:UNK;}}TM[1].add(performance.now()-t0);
    // bilinear upscale of the cell grid (shared by the next two)
    for(let y=0;y<H;y++){const fy=(y+.5)/CS-.5,j=Math.floor(fy),ty=fy-j;for(let x=0;x<W;x++){const fx=(x+.5)/CS-.5,i=Math.floor(fx),tx=fx-i;sv[y*W+x]=lerp(lerp(at(i,j),at(i+1,j),tx),lerp(at(i,j+1),at(i+1,j+1),tx),ty);}}
    // bilinear + two 3x3 box blur passes, then a smooth colour blend (the airbrush)
    t0=performance.now();const bl=Float32Array.from(sv);for(let pass=0;pass<2;pass++){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;tmp[i]=(bl[y*W+Math.max(0,x-1)]+bl[i]+bl[y*W+Math.min(W-1,x+1)])/3;}
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){bl[y*W+x]=(tmp[Math.max(0,y-1)*W+x]+tmp[y*W+x]+tmp[Math.min(H-1,y+1)*W+x])/3;}}
    o=OUT[2];for(let i=0;i<W*H;i++){const s=bl[i];o[i]=s<.5?mix32(UNK,EXP[i],s*2):mix32(EXP[i],VIS[i],(s-.5)*2);}TM[2].add(performance.now()-t0);
    // bilinear + world-locked Bayer threshold: three states, no new colours
    t0=performance.now();o=OUT[3];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,l=Math.min(2,Math.floor(sv[i]*2+(bay(x,y)+.5)/16));o[i]=l===2?VIS[i]:l===1?EXP[i]:UNK;}TM[3].add(performance.now()-t0);
    // units on top, then zoom crop into each canvas
    const z=+c.segv('z'),[ox,oy]=crop(z);
    for(let m=0;m<4;m++){const src=OUT[m];for(const [p,col] of [[A,f2P[f2I.wht]],[B,f2P[f2I.gold]]]){const px=Math.round(p[0]),py=Math.round(p[1]);for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])src[clamp(py+dy,0,H-1)*W+clamp(px+dx,0,W-1)]=dx||dy?f2P[f2I.ink]:col;}
      const dst=FS[m].u32;for(let y=0;y<H;y++){const sy=oy+Math.floor(y/z);for(let x=0;x<W;x++)dst[y*W+x]=src[sy*W+ox+Math.floor(x/z)];}FS[m].put();}
    if(fr%15===1)cols=OUT.map(f2cols);
    if(fr%10===1){['a','b','c','d'].forEach((k,m)=>setHud(root,`${cols[m]} colours`,k));
      ro.innerHTML=`measured here, JS, ${W}x${H}: hard <b>${f2ms(TM[0].v)} ms</b> · edge tiles <b>${f2ms(TM[1].v)} ms</b> · upscale + blur <b>${f2ms(TM[2].v)} ms</b> · Bayer threshold <b>${f2ms(TM[3].v)} ms</b><br>§6a measured: 3x3 box blur of a 320x180 byte mask <b>0.23 ms</b> on the CPU (1.20 ms at 6x throttle) · Bayer in the shader <b>0.0018 ms</b> at 320x180 on the M4 GPU · drag to move the white unit`;}}};});

// ======================================================================
// E4: reveal fade-in and remembered tiles (darker ramp, DCSS-style mesh, Brogue-style blue tint)
// ======================================================================
reg('remember',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),TS=8,GX=W/TS,GY=H/TS,NT=GX*GY,I=f2I;
  // tile map: 0 grass, 1 stone path, 2 tree (blocks sight), 3 rock wall (blocks sight)
  const tile=new Uint8Array(NT),nz=f2tile(GX*4,GY*4,8,61,2);
  for(let j=0;j<GY;j++)for(let i=0;i<GX;i++){const v=nz[(j*4)*GX*4+i*4];let k=v>.66?2:v<.18?3:0;if(i===0||j===0||i===GX-1||j===GY-1)k=2;tile[j*GX+i]=k;}
  for(let i=1;i<GX-1;i++){const j=Math.round(GY/2+Math.sin(i*.6)*2);tile[j*GX+i]=1;tile[(j+1)*GX+i]=tile[(j+1)*GX+i]>1?1:tile[(j+1)*GX+i];}
  for(let j=2;j<GY-2;j++){tile[j*GX+5]=tile[j*GX+5]>1?1:tile[j*GX+5];tile[j*GX+14]=tile[j*GX+14]>1?1:tile[j*GX+14];}
  // keep only floor reachable from the start
  const start=Math.round(GY/2)*GX+2;tile[start]=1;{const seen=new Uint8Array(NT),q=[start];seen[start]=1;while(q.length){const k=q.pop(),x=k%GX,y=(k/GX)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=(y+dy)*GX+x+dx;if(x+dx<0||y+dy<0||x+dx>=GX||y+dy>=GY||seen[n]||tile[n]>1)continue;seen[n]=1;q.push(n);}}
    for(let k=0;k<NT;k++)if(tile[k]<2&&!seen[k])tile[k]=2;}
  const floors=[];for(let k=0;k<NT;k++)if(tile[k]<2)floors.push(k);
  const idx=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=((y/TS)|0)*GX+((x/TS)|0),lx=x%TS,ly=y%TS,q=f2Hx(x,y,3);let col;
    switch(tile[k]){case 0:col=q<.1?I.g3:q<.16?I.g1:I.g2;if(q>.97)col=I.g4;break;
      case 1:{const cb=((lx>>2)+(ly>>2))&1;col=(lx&3)===3||(ly&3)===3?I.r0:(lx&3)===0&&(ly&3)===0?I.r3:cb?I.r1:I.r2;break;}
      case 2:{const dx=lx-3.5,dy=ly-3,d2=dx*dx+dy*dy,s=(dx*.55+dy*.85)/3.4;col=ly>=5?((lx===3||lx===4)&&ly<7?I.t0:I.g0):I.g1;if(d2<11.5){col=s>.45?I.l0:s>-.1?I.l1:s>-.6?I.l2:I.l3;if(q<.1&&col<I.l3)col++;}break;}
      default:col=ly===0?I.r3:ly>=6?(ly===7?I.ink:I.r0):((lx+ly*3)%7===0?I.r2:I.r1);}
    idx[y*W+x]=col;}
  const UNKC=U('#07090f'),MESH=U('#0b0d14'),DB=U('#141c3c'),DR=U('#1a2234');
  const LUT={ramp:Uint32Array.from(f2P,col=>mix32(f2desat(col,.55),DR,.55)),mesh:Uint32Array.from(f2P,col=>mix32(col,MESH,.3)),brogue:Uint32Array.from(f2P,col=>{const [r,g,b]=un32(col);return mix32(pack(r*.25,g*.25,b*.5),DB,.25);})};
  const vis=new Uint8Array(NT),exp=new Uint8Array(NT),rt=new Float32Array(NT).fill(-9),prev=new Uint8Array(NT),tm=f2tm();
  let wx=2,wy=Math.round(GY/2),path=[],t=0,fr=0,fading=0,dir=1,step=0;
  const mons=[0,1,2].map(k=>({k:floors[(f2Hx(k,9,9)*floors.length)|0],a:0}));
  const opaque=k=>tile[k]>1;
  function los(x0,y0,x1,y1){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*3);for(let s=1;s<n;s++){const x=Math.floor(lerp(x0,x1,s/n)),y=Math.floor(lerp(y0,y1,s/n));if(x===Math.floor(x1)&&y===Math.floor(y1))return true;if(opaque(y*GX+x))return false;}return true;}
  function bfs(a,b){const pr=new Int32Array(NT).fill(-1),q=[a];pr[a]=a;while(q.length){const k=q.shift();if(k===b)break;const x=k%GX,y=(k/GX)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=(y+dy)*GX+x+dx;if(pr[n]>=0||opaque(n))continue;pr[n]=k;q.push(n);}}
    const p=[];let k=b;if(pr[b]<0)return p;while(k!==a){p.push(k);k=pr[k];}return p.reverse();}
  const reset=()=>{vis.fill(0);exp.fill(0);rt.fill(-9);wx=2;wy=Math.round(GY/2);path=[];};
  c.btn('reset',reset);c.seg('mem',()=>{});
  return {tick(dt){fr++;if(motion)t+=dt;const fade=c.v('fade'),mem=c.segv('mem');c.out('fade',fade?fade.toFixed(2)+' s':'off (pop)');
    if(motion){step+=dt*4;if(!path.length)path=bfs(wy*GX+wx,floors[(f2Hx(fr,7,7)*floors.length)|0]);
      if(step>=1&&path.length){step=0;const k=path.shift(),nx=k%GX;dir=nx>wx?1:nx<wx?-1:dir;wx=nx;wy=(k/GX)|0;}
      if(fr%40===0)for(const m of mons){const x=m.k%GX,y=(m.k/GX)|0,d=[[1,0],[-1,0],[0,1],[0,-1]][(f2Hx(fr,m.a++,4)*4)|0],n=(y+d[1])*GX+x+d[0];if(!opaque(n))m.k=n;}}
    const t0=performance.now(),cx=wx+.5,cy=wy+.5;
    for(let k=0;k<NT;k++){const x=k%GX,y=(k/GX)|0,v=Math.hypot(x+.5-cx,y+.5-cy)<=3.6&&los(cx,cy,x+.5,y+.5)?1:0;if(v&&!vis[k]){rt[k]=t;prev[k]=exp[k];}if(v)exp[k]=1;vis[k]=v;}
    fading=0;const L=LUT[mem]||LUT.ramp;
    for(let k=0;k<NT;k++){const tx=(k%GX)*TS,ty=((k/GX)|0)*TS,a=vis[k]?(fade>0?(t-rt[k])/fade:1):0;if(vis[k]&&a<1)fading++;
      for(let ly=0;ly<TS;ly++)for(let lx=0;lx<TS;lx++){const x=tx+lx,y=ty+ly,i=y*W+x,g=idx[i];let col;
        const old=prev[k]?(mem==='mesh'&&((x+y)&1)?MESH:L[g]):UNKC,mm=exp[k]?(mem==='mesh'&&((x+y)&1)?MESH:L[g]):UNKC;
        if(vis[k])col=a>=1||a*16>bay(x,y)+.5?f2P[g]:old;else col=mm;u[i]=col;}}
    // creatures: live only, never remembered
    for(const m of mons){const k=m.k;if(!vis[k]||(fade>0&&t-rt[k]<fade))continue;f2spr(u,W,H,f2SLIME,f2mapC(f2MS),(k%GX)*TS+4,((k/GX)|0)*TS+7);}
    f2spr(u,W,H,f2walk(motion?((t*8)|0):0),f2mapC(f2MW),wx*TS+4,wy*TS+7,dir<0);
    tm.add(performance.now()-t0);F.put();
    if(fr%10===1){let ne=0,nv=0;for(let k=0;k<NT;k++){ne+=exp[k];nv+=vis[k];}
      setHud(root,`${fading} tiles fading in`);
      ro.innerHTML=`explored <b>${ne}</b> of ${NT} tiles · visible <b>${nv}</b> · a ${fade.toFixed(2)} s fade is <b>${Math.round(fade*60)}</b> frames at 60 fps, a dither dissolve with no new colours · slimes show only on visible tiles<br>cost measured here, JS, FOV plus redraw: <b>${f2ms(tm.v)} ms</b> · crossfade by our estimate from §6a: <b>0.002 ms</b> at 720p · §6a measured: 256x256 R8 mask upload <b>0.018 ms</b>`;}}};});

// ======================================================================
// E5: server-side vision: the server only sends entities inside the viewer's vision
// ======================================================================
reg('servervision',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),pk=$('[data-pk]',root);
  const w=f2world(W,H,33,{cell:32,water:.22,trees:.25,grid:16}),base=Uint32Array.from(w.idx,g=>f2P[g]),FOGC=U('#141a28'),dark=Uint32Array.from(base,col=>mix32(f2desat(col,.5),FOGC,.62)),LEAK=U('#ff5a4e');
  const SH=[['#3f78b8','#2a5288'],['#e0b040','#9a7420'],['#d06a9a','#8e3e66']],PN=['A','B','C'];
  const ents=[];for(let k=0;k<3;k++)ents.push({id:k,kind:'p',x:30+k*60,y:40+(k%2)*36,s:.6+k*.2,ph:k*2});
  for(let k=0;k<11;k++)ents.push({id:3+k,kind:'m',x:12+f2Hx(k,1,2)*(W-24),y:14+f2Hx(k,2,2)*(H-24),s:.3+f2Hx(k,3,2)*.4,ph:k});
  const B_ENT=10,B_HDR=4;let t=0,fr=0,tick=0,acc=0,lastPk=[[],[],[]];
  const inView=(v,e,shape)=>shape==='tibia'?Math.abs(e.x-v.x)<=27&&Math.abs(e.y-v.y)<=21:Math.hypot(e.x-v.x,e.y-v.y)<=30;
  c.seg('who',()=>{});c.seg('model',()=>{});c.seg('shape',()=>{});
  return {tick(dt){fr++;if(motion)t+=dt;const who=+c.segv('who'),lock=c.segv('model')==='lock',hack=c.v('hack'),shape=c.segv('shape');
    for(const e of ents){e.x=clamp(e.x+Math.cos(t*e.s+e.ph)*dt*(e.kind==='p'?12:7),6,W-6);e.y=clamp(e.y+Math.sin(t*e.s*.8+e.ph*1.7)*dt*(e.kind==='p'?9:6),10,H-4);}
    // server tick at 10 Hz: build one packet per client
    acc+=motion?dt:0;if(acc>=.1||fr===1){acc=0;tick++;for(let v=0;v<3;v++){const V=ents[v];lastPk[v]=ents.filter(e=>e.id!==v&&(lock||inView(V,e,shape)));}}
    const V=ents[who],sent=new Set(lastPk[who].map(e=>e.id));
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,p={x,y};let inside=inView(V,p,shape);
      if(!inside&&!hack){const d=shape==='tibia'?Math.max(Math.abs(x-V.x)-27,Math.abs(y-V.y)-21):Math.hypot(x-V.x,y-V.y)-30;if(d<2&&(2-d)/2*16>bay(x,y)+.5)inside=true;}
      u[i]=inside||hack?base[i]:dark[i];}
    let leaked=0;
    for(const e of ents){if(e.id===who)continue;const iv=inView(V,e,shape),drawn=iv||(hack&&sent.has(e.id));if(!drawn||!sent.has(e.id))continue;
      if(!iv){leaked++;for(let j=-9;j<=1;j++)for(let i=-5;i<=5;i++)if((Math.abs(i)===5||j===-9||j===1)&&((i+j+fr/4|0)&1)){const xx=Math.round(e.x)+i,yy=Math.round(e.y)+j;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=LEAK;}}
      if(e.kind==='m')f2spr(u,W,H,f2SLIME,f2mapC(f2MS),e.x,e.y);else{const m=f2mapC(f2MW);m.c=U(SH[e.id][0]);m.C=U(SH[e.id][1]);f2spr(u,W,H,f2walk((t*6)|0),m,e.x,e.y);}}
    const mv=f2mapC(f2MW);mv.c=U(SH[who][0]);mv.C=U(SH[who][1]);f2spr(u,W,H,f2walk((t*6)|0),mv,V.x,V.y);
    F.put();
    if(fr%6===1){const bytes=lastPk.map(p=>B_HDR+p.length*B_ENT),tot=bytes.reduce((a,b)=>a+b,0),allB=3*(B_HDR+(ents.length-1)*B_ENT);
      setHud(root,`client ${PN[who]} · ${lock?'lockstep':'server-authoritative'}${hack?' · maphack on':''}`);
      pk.innerHTML=`tick ${tick} → client ${PN[who]}: `+(lastPk[who].length?lastPk[who].map(e=>e.kind==='p'?`player ${PN[e.id]}`:`slime #${e.id}`).join(', '):'(no entities)')+` · <b>${bytes[who]} B</b>`;
      ro.innerHTML=`bytes per tick for all 3 clients: <b>${tot} B</b> (illustrative: ${B_ENT} B per entity, ${B_HDR} B header) · sending everything to everyone would be ${allB} B<br>`+
        (hack?(leaked?`maphack shows <b>${leaked}</b> hidden entities, because the client already had them`:`maphack strips the fog and finds <b>0</b> hidden entities: they were never in the packet`):`tick the maphack box to strip the fog on the client`);}}};});

// ======================================================================
// F1: haze by distance: hue-only tint vs tint plus contrast drop
// ======================================================================
function f2hsl(col){const [r,g,b]=un32(col).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(!d)return [0,0,l];
  const s=d/(1-Math.abs(2*l-1));let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;return [h,s,l];}
function f2rgb(h,s,l){const C=(1-Math.abs(2*l-1))*s,X=C*(1-Math.abs((h/60)%2-1)),m=l-C/2;let r=0,g=0,b=0;
  if(h<60)[r,g,b]=[C,X,0];else if(h<120)[r,g,b]=[X,C,0];else if(h<180)[r,g,b]=[0,C,X];else if(h<240)[r,g,b]=[0,X,C];else if(h<300)[r,g,b]=[X,0,C];else [r,g,b]=[C,0,X];return pack((r+m)*255,(g+m)*255,(b+m)*255);}
reg('haze',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,c=ctl(root),ro=$('[data-ro]',root),I=f2I;
  const SKY=[U('#93acc2'),U('#adc0cf'),U('#c6d3db')],SKYC=SKY[2],SKYH=f2hsl(SKYC)[0],NP=5;
  // planes: 0 sky, 1..4 ridges far to near, 5 foreground meadow. idx = palette index (255 = sky)
  const idx=new Uint8Array(W*H),pl=new Uint8Array(W*H),top=[];
  for(let k=1;k<=NP;k++){const t=new Int16Array(W);for(let x=0;x<W;x++){const base=18+k*13;t[x]=Math.round(base-n1(x/(22-k*3)+k*9,k)*(16-k*1.5)-n1(x/6+k*3,k+20)*2.5);if(k===NP)t[x]=Math.round(80+n1(x/30,40)*4);}top.push(t);}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let k=0;for(let p=NP;p>=1;p--)if(y>=top[p-1][x]){k=p;break;}pl[i]=k;
    if(!k){idx[i]=255;continue;}const d=y-top[k-1][x],q=f2Hx(x,y,k);let g;
    if(k<NP){const bump=(n1(x/2.2+k*4,k+30)*2)|0;g=d<1+bump?I.l2:d<4+bump?I.l1:d<5+bump?I.l0:(d<7+bump&&q<.5?I.g3:q<.05?I.g3:I.g2);if(d<1+bump&&q<.3)g=I.l3;}
    else{g=d<2?I.g3:q<.08?I.g4:q<.18?I.g1:I.g2;}
    idx[i]=g;}
  // foreground props: trees and rocks on the near meadow, drawn full contrast
  for(const tx of [14,46,112,140]){const ty=top[NP-1][tx]+9,r=6;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){if(i*i+j*j>r*r+3)continue;const s=(i*.55+j*.85)/r,xx=tx+i,yy=ty-8+j;if(xx<0||xx>=W||yy<0||yy>=H)continue;idx[yy*W+xx]=s>.45?I.l0:s>-.1?I.l1:s>-.6?I.l2:I.l3;pl[yy*W+xx]=NP;}
    for(let j=-2;j<=2;j++){const yy=ty-1+j;if(yy<H){idx[yy*W+tx]=I.t0;idx[yy*W+tx+1]=I.t0;}}}
  const L=new Uint32Array((NP+1)*f2NP*2),tm=f2tm();let t=0,fr=0,ca=0,cb=0;
  return {tick(dt){fr++;if(motion)t+=dt;const a=c.v('str')/100,band=c.v('band');c.out('str',Math.round(a*100)+'%');
    const t0=performance.now();
    // rebuild the per-plane tables: hue-only (left) and tint + contrast drop toward the plane mean (right)
    for(let k=1;k<=NP;k++){const h=(NP-k)/(NP-1);let mr=0,mg=0,mb=0,n=0;for(const g of [I.l1,I.l2,I.g2,I.g3]){const v=un32(f2P[g]);mr+=v[0];mg+=v[1];mb+=v[2];n++;}const mean=pack(mr/n,mg/n,mb/n);
      for(let g=0;g<f2NP;g++){const col=f2P[g],[hh,ss,ll]=f2hsl(col);let dh=SKYH-hh;if(dh>180)dh-=360;if(dh<-180)dh+=360;L[(k*f2NP+g)*2]=f2rgb(((hh+dh*h*a)+360)%360,ss,ll);
        const tint=mix32(col,SKYC,h*a*.78),mt=mix32(mean,SKYC,h*a*.78);L[(k*f2NP+g)*2+1]=mix32(tint,mt,h*a*.7);}}
    const ua=A.u32,ub=B.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=pl[i];if(!k){const s=SKY[Math.min(2,f2lv(y/38,2,x,y,.5))];ua[i]=s;ub[i]=s;continue;}
      let ca2=L[(k*f2NP+idx[i])*2],cb2=L[(k*f2NP+idx[i])*2+1];
      // valley haze: a band along the foot of each ridge, drifting slowly, dither only at its edge
      if(band&&k<NP){const nt=top[k][x],th=4+n1(x/14+t*.12+k*5,k+60)*5,dd=(y-(nt-th))/th;if(dd>0){const lv=f2lv(clamp(dd,0,1),2,x+Math.floor(t*2),y,.5);if(lv){const m=lv===2?.6:.32;ca2=mix32(ca2,SKYC,m*a);cb2=mix32(cb2,SKYC,m*a);}}}
      ua[i]=ca2;ub[i]=cb2;}
    tm.add(performance.now()-t0);A.put();B.put();
    if(fr%15===1){ca=f2cols(ua);cb=f2cols(ub);}
    if(fr%10===1){setHud(root,`hue only · ${ca} colours`,'a');setHud(root,`tint + contrast · ${cb} colours`,'b');
      ro.innerHTML=`strength <b>${Math.round(a*100)}%</b> · far ridge depth h = 1, near meadow h = 0 · left keeps lightness and contrast and only turns the hue, so far ridges stay as dark as near ones · right pulls toward the sky colour and squeezes contrast toward each plane's mean<br>cost measured here, JS, both tables plus both ${W}x${H} passes: <b>${f2ms(tm.v)} ms</b> · §6a measured, M4 GPU, the palette pass this rides in: <b>0.016 ms</b> at 720p`;}}};});

// ======================================================================
// F2: lights in fog: additive halo sprites sized by density vs per-pixel point lights
// ======================================================================
reg('halos',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,c=ctl(root),ro=$('[data-ro]',root),I=f2I;
  const w=f2world(W,H,52,{cell:32,water:.2,trees:.22,grid:13,houses:[[18,44],[96,38],[120,82]]}),NF=3,FOG=U('#5d6a86');
  const NIGHT=Uint32Array.from(f2P,col=>mix32(mulc(col,.42,.48,.68),U('#141a2c'),.25));NIGHT[I.lamp]=f2P[I.lamp];NIGHT[I.lamp2]=f2P[I.lamp2];
  const FR=f2ramp(FOG,NF,.62,NIGHT),GLOW=U('#ffd68a'),GT=[0,.24,.48,.95],GL=new Uint32Array(4*FR.length);
  for(let l=0;l<4;l++)for(let i=0;i<FR.length;i++)GL[l*FR.length+i]=mix32(FR[i],GLOW,GT[l]);
  const n1t=f2tile(128,128,32,71,3),n2t=f2tile(128,128,32,72,3);
  // 40 lamp spots on open ground (house windows first)
  const spots=w.lamps.map(p=>({x:p.x,y:p.y,post:false}));for(let k=0;spots.length<40&&k<4000;k++){const x=4+((f2Hx(k,1,52)*(W-8))|0),y=10+((f2Hx(k,2,52)*(H-12))|0),g=w.idx[y*W+x];if(g>=I.g0&&g<=I.g4&&spots.every(s=>Math.hypot(s.x-x,s.y-y)>12))spots.push({x,y:y-5,post:true,bx:x,by:y});}
  const lev=new Uint8Array(W*H),fl=new Uint8Array(W*H),dens=new Float32Array(W*H),view=new Uint8Array(W*H),ta=f2tm(),tb=f2tm();let t=0,fr=0,ca=0,cb=0;
  return {tick(dt){fr++;if(motion)t+=dt;const n=c.v('n');c.out('n',n+(n===1?' lamp':' lamps'));
    const L=spots.slice(0,n);view.set(w.idx);for(const s of L)if(s.post)f2spr(view,W,H,f2POST,f2map(f2MP),s.bx,s.by);
    const o1=Math.floor(t*9),o2=Math.floor(t*5);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,d=smooth(.3,.85,n1t[(y&127)*128+((x-o1)&127)]*.6+n2t[((y-o2)&127)*128+((x+o2)&127)]*.4);dens[i]=d;fl[i]=f2lv(d,NF,x,y);}
    const ua=A.u32,ub=B.u32,NFP=f2NP;
    // left: one halo sprite per lamp, radius r0 (1 + 2 density), levels in palette steps, max not sum
    let t0=performance.now();lev.fill(0);
    for(const s of L){const sx=Math.round(s.x),sy=Math.round(s.y),dl=dens[clamp(sy,0,H-1)*W+clamp(sx,0,W-1)],R=6*(1+2*dl),R2=Math.ceil(R);
      for(let j=-R2;j<=R2;j++){const y=sy+j;if(y<0||y>=H)continue;for(let i=-R2;i<=R2;i++){const x=sx+i;if(x<0||x>=W)continue;const dd=Math.hypot(i,j);let l;
        if(dd<1.6)l=3;else{const a=(1-dd/R)*(.85+.8*dl);if(a<=0)continue;l=f2lv(clamp(a,0,1),2,x,y,.5);}const p=y*W+x;if(l>lev[p])lev[p]=l;}}}
    for(let i=0;i<W*H;i++)ua[i]=GL[lev[i]*FR.length+fl[i]*NFP+view[i]];
    ta.add(performance.now()-t0);
    // right: every pixel loops over every lamp, smooth falloff, colours leave the palette
    t0=performance.now();
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let s=0;for(const q of L){const dx=x-q.x,dy=y-q.y,sg=5*(1+dens[clamp(Math.round(q.y),0,H-1)*W+clamp(Math.round(q.x),0,W-1)]);s+=1/(1+(dx*dx+dy*dy)/(sg*sg));}
      ub[i]=mix32(FR[fl[i]*NFP+view[i]],GLOW,Math.min(.92,s*.55));}
    tb.add(performance.now()-t0);A.put();B.put();
    if(fr%15===1){ca=f2cols(ua);cb=f2cols(ub);}
    if(fr%10===1){setHud(root,`${ca} colours`,'a');setHud(root,`${cb} colours`,'b');
      ro.innerHTML=`measured here, JS, ${W}x${H}, ${n} lamps: halo sprites <b>${f2ms(ta.v)} ms</b> · per-pixel lights <b>${f2ms(tb.v)} ms</b>, which grows with lamps × pixels<br>§6a-based estimate: 20 halo sprites of 32x32 are about 36% of one 320x180 layer, under <b>0.001 ms</b> on the M4 · halo radius = 6 px × (1 + 2 × density at the lamp)`;}}};});

// ======================================================================
// F3/F4/F5: pre-drawn light shafts vs radial-blur god rays, dust motes
// ======================================================================
reg('shafts',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),W=A.W,H=A.H,c=ctl(root),ro=$('[data-ro]',root),I=f2I;
  const FOG=U('#e2d2c0'),NF=2,DAWN=Uint32Array.from(f2P,col=>mix32(col,U('#3a2a3a'),.2)),FR=f2ramp(FOG,NF,.42,DAWN),BR=[0,1,2].map(l=>Uint32Array.from(FR,col=>mix32(col,U('#fff6d6'),[0,.34,.62][l])));
  // canopy along the top with gaps of sky; trunks and forest floor below
  const idx=new Uint8Array(W*H),sky=new Uint8Array(W*H),cb=new Int16Array(W),SKY=U('#f6ead0');
  for(let x=0;x<W;x++)cb[x]=Math.round(24+n1(x/9,3)*9+n1(x/3,5)*2);
  const trunks=[10,31,52,77,96,121,142];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,q=f2Hx(x,y,9);let g;
    if(y<cb[x]){const gap=vnoise(x/11,y/7+2)>.68&&y<cb[x]-3;if(gap){sky[i]=1;g=255;}else{const e=y>=cb[x]-2;g=e?I.l0:q<.18?I.l2:q<.3?I.l0:I.l1;if(vnoise(x/4,y/4)>.72)g=I.l2;if(!e&&y>0&&vnoise(x/11,(y-1)/7+2)>.68&&y-1<cb[x]-3)g=I.l3;}}
    else{g=q<.1?I.g1:q<.16?I.g3:I.g2;if(y>cb[x]&&y<cb[x]+3)g=I.g0;if(q>.985)g=I.g4;}
    for(const tx of trunks)if(y>=cb[x]-1&&y<cb[x]+40+((tx*7)%22)&&(x===tx||x===tx+1||x===tx+2))g=x===tx+2?I.t0:x===tx?I.d1:I.d0;
    idx[i]=g;}
  // shafts: six tapered bands from canopy gaps, slanting (0.45 px across per px down); the pixel list is cached once
  const SL=.45,SX=[12,38,63,90,116,141];
  for(const sx of SX)for(let y=cb[sx]-9;y<cb[sx]-3;y++)for(let x=sx-2;x<=sx+2;x++){if(Math.abs(x-sx)+Math.abs(y-cb[sx]+6)>4)continue;const i=y*W+x;sky[i]=1;idx[i]=255;}
  const pi=[],pk=[],pc=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(y<cb[x])continue;for(let k=0;k<6;k++){const yc=cb[SX[k]],dy=y-yc;if(dy<0)continue;const x0=x-dy*SL,hw=3.5+(k%3)*1.5+dy*.07,p=1-Math.abs(x0-SX[k])/hw;if(p<=0)continue;const lf=1-dy/(72+k*6);if(lf<=0)continue;pi.push(y*W+x);pk.push(k);pc.push(Math.min(1,p*1.4)*lf);break;}}
  const PI=Int32Array.from(pi),PK=Uint8Array.from(pk),PC=Float32Array.from(pc),lev=new Uint8Array(W*H),fl=new Uint8Array(W*H),ray=new Float32Array(W*H);
  // dust motes: 12 per shaft, shaft-local coordinates
  const motes=[];for(let k=0;k<6;k++)for(let m=0;m<12;m++)motes.push({k,a:f2Hx(k,m,1)*60,s:(f2Hx(k,m,2)-.5)*3,v:2+f2Hx(k,m,3)*4,w:2+f2Hx(k,m,4)*2,ph:f2Hx(k,m,5)*6,c:f2Hx(k,m,6)<.5});
  const MC=[U('#fff4d0'),U('#ffd98a')],ta=f2tm(),tb=f2tm(),nt=f2tile(64,64,16,81,2);let t=0,fr=0,ca=0,cb2=0;
  return {tick(dt){fr++;if(motion)t+=dt;const S=c.v('n'),dust=c.v('dust');c.out('n',S+' samples');
    const of=Math.floor(t*4);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;fl[i]=y<cb[x]?0:f2lv(clamp(nt[(y&63)*64+((x-of)&63)]*.7+(y-cb[x])/H*.6-.15,0,1),NF,x,y);}
    const ua=A.u32,ub=B.u32;
    // left: cached shaft pixels, one or two palette steps brighter, breathing on a slow sine
    let t0=performance.now();lev.fill(0);const br=[0,1,2,3,4,5].map(k=>.62+.38*Math.sin(t*2*Math.PI/(6+k)+k*1.3));
    for(let j=0;j<PI.length;j++){const p=PI[j],x=p%W,y=(p/W)|0;lev[p]=f2lv(PC[j]*br[PK[j]],2,x,y,.5);}
    for(let i=0;i<W*H;i++)ua[i]=sky[i]?SKY:BR[lev[i]][fl[i]*f2NP+idx[i]];
    ta.add(performance.now()-t0);
    // right: radial blur toward an off-screen sun, S samples per pixel, then an additive blend
    t0=performance.now();const sx=-40,sy=-70,dec=Math.pow(.2,1/S),wgt=2.2/S;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let ax=x,ay=y,acc=0,il=1;const stx=(sx-x)/S*.55,sty=(sy-y)/S*.55;
      for(let s=0;s<S;s++){ax+=stx;ay+=sty;const qx=ax|0,qy=ay|0;if(qx>=0&&qy>=0&&qx<W&&qy<H&&sky[qy*W+qx])acc+=il*wgt;il*=dec;}ray[i]=acc;}
    for(let i=0;i<W*H;i++)ub[i]=sky[i]?SKY:mix32(FR[fl[i]*f2NP+idx[i]],U('#fff0c8'),Math.min(.85,ray[i]));
    tb.add(performance.now()-t0);
    if(dust)for(const m of motes){const yc=cb[SX[m.k]],al=((m.a+t*m.v)%60),y=Math.round(yc+4+al),x=Math.round(SX[m.k]+(y-yc)*SL+m.s+Math.sin(t*2*Math.PI/m.w+m.ph));if(x<0||y<0||x>=W||y>=H)continue;const p=y*W+x;
      if(lev[p])ua[p]=MC[m.c?0:1];if(ray[p]>.3)ub[p]=MC[m.c?0:1];}
    A.put();B.put();
    if(fr%15===1){ca=f2cols(ua);cb2=f2cols(ub);}
    if(fr%10===1){const ref={8:.021,16:.036,32:.070,64:.141},near=[8,16,32,64].reduce((a,b)=>Math.abs(b-S)<Math.abs(a-S)?b:a);
      setHud(root,`${ca} colours`,'a');setHud(root,`${cb2} colours`,'b');
      ro.innerHTML=`measured here, JS, ${W}x${H}: drawn shafts <b>${f2ms(ta.v)} ms</b> (${PI.length} cached pixels) · god rays at ${S} samples <b>${f2ms(tb.v)} ms</b> (${(W*H*S).toLocaleString('en-US')} samples)<br>§6a measured, god rays at ${near} samples: <b>${ref[near]} ms</b> at 720p on the M4 GPU · 64 samples on SwiftShader: <b>18.0 ms</b> · drawn shafts by our estimate: about <b>0.0002 ms</b>`;}}};});

// ======================================================================
// G1: smoke bombs and fog-cloud spells: tile density decays, dense tiles block a walker's sight
// ======================================================================
reg('smoke',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),TS=8,GX=W/TS,GY=H/TS,NT=GX*GY,I=f2I;
  const wall=new Uint8Array(NT);for(const [i,j] of [[7,3],[7,4],[7,5],[15,8],[16,8],[17,8],[11,10],[3,9],[20,3],[20,4]])wall[j*GX+i]=1;
  const idx=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=((y/TS)|0)*GX+((x/TS)|0),lx=x%TS,ly=y%TS,q=f2Hx(x,y,17);let g;
    if(wall[k])g=ly===0?I.r3:ly>=6?(ly===7?I.ink:I.r0):((lx+ly*3)%7===0?I.r2:I.r1);else{g=q<.1?I.g3:q<.16?I.g1:I.g2;if(q>.975)g=I.g4;}idx[y*W+x]=g;}
  const DK=Uint32Array.from(f2P,col=>mix32(f2desat(col,.5),U('#10141e'),.58)),S1=U('#aab2ba'),S2=U('#d2d8dc'),S3=U('#eef0ee'),RIM=U('#7e8a98');
  const den=new Float32Array(NT),vis=new Uint8Array(NT),dv=new Float32Array(W*H),nz=f2tile(64,64,16,91,2),tm=f2tm(),THR=.06;
  let wx=40,wy=56,t=0,fr=0,acc=0,last=-9,casts=0,bytes=0,dir=1;const mons=[0,1,2,3].map(k=>({x:20+k*44,y:20+(k%2)*60,ph:k*1.7}));
  const cast=(cx,cy)=>{const s=+c.segv('sz'),h=s>>1;for(let j=-h;j<=h;j++)for(let i=-h;i<=h;i++){const x=cx+i,y=cy+j;if(x<0||y<0||x>=GX||y>=GY||wall[y*GX+x])continue;den[y*GX+x]=1;}casts++;bytes+=11;};
  pointer(cv,([x,y],k)=>{if(k!=='down')return;cast((x/TS)|0,(y/TS)|0);last=t;});
  c.btn('clear',()=>den.fill(0));c.seg('sz',()=>{});
  const opaque=k=>wall[k]||den[k]>THR;
  return {tick(dt){fr++;if(motion)t+=dt;
    if(motion){wx=96+Math.sin(t*.23)*80;wy=56+Math.sin(t*.37)*36;dir=Math.cos(t*.23)>0?1:-1;for(const m of mons){m.x=clamp(m.x+Math.cos(t*.5+m.ph)*dt*8,8,W-8);m.y=clamp(m.y+Math.sin(t*.4+m.ph*2)*dt*6,10,H-4);}}
    if(motion&&t-last>4.5){last=t;cast(3+((f2Hx(fr,1,3)*(GX-6))|0),2+((f2Hx(fr,2,3)*(GY-4))|0));}
    // server rule at 10 Hz: density decays 4.5% per update, expires below the threshold
    acc+=motion?dt:0;while(acc>=.1){acc-=.1;for(let k=0;k<NT;k++)if(den[k]){den[k]*=.955;if(den[k]<THR*.5)den[k]=0;}}
    const t0=performance.now(),tx=wx/TS,ty=wy/TS,wk=(ty|0)*GX+(tx|0),inside=den[wk]>THR;
    for(let k=0;k<NT;k++){const x=k%GX+.5,y=((k/GX)|0)+.5,dd=Math.hypot(x-tx,y-ty);let v=dd<=(inside?1.5:7);
      if(v&&!inside){const n=Math.ceil(dd*3);for(let s=1;s<n;s++){const q=Math.floor(lerp(ty,y,s/n))*GX+Math.floor(lerp(tx,x,s/n));if(q===k)break;if(opaque(q)){v=false;break;}}}vis[k]=v?1:0;}
    tm.add(performance.now()-t0);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=((y/TS)|0)*GX+((x/TS)|0);u[i]=vis[k]?f2P[idx[i]]:DK[idx[i]];}
    for(const m of mons){const k=((m.y/TS)|0)*GX+((m.x/TS)|0);if(vis[k]&&!(den[k]>THR&&!inside))f2spr(u,W,H,f2SLIME,f2mapC(f2MS),m.x,m.y);}
    f2spr(u,W,H,f2walk(motion?((t*7)|0):0),f2mapC(f2MW),wx,wy,dir<0);
    // smoke: bilinear tile density plus slow noise, three flat bands, a rim where the rule ends
    const of=Math.floor(t*3);
    for(let y=0;y<H;y++){const fy=(y+.5)/TS-.5,j=Math.floor(fy),vy=fy-j;for(let x=0;x<W;x++){const fx=(x+.5)/TS-.5,i=Math.floor(fx),vx=fx-i;
      const at=(a,b)=>den[clamp(b,0,GY-1)*GX+clamp(a,0,GX-1)];dv[y*W+x]=lerp(lerp(at(i,j),at(i+1,j),vx),lerp(at(i,j+1),at(i+1,j+1),vx),vy)*(.7+.6*nz[(y&63)*64+((x+of)&63)]);}}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,d=dv[i];if(d<=THR*.5)continue;
      const rim=d>THR&&((x>0&&dv[i-1]<=THR)||(x<W-1&&dv[i+1]<=THR)||(y>0&&dv[i-W]<=THR)||(y<H-1&&dv[i+W]<=THR));
      if(rim){u[i]=RIM;continue;}const l=f2lv(clamp(Math.sqrt(d),0,1),3,x,y,.45);if(l===0)continue;u[i]=l===3?S3:mix32(u[i],l===2?S2:S1,l===2?.8:.5);}
    F.put();
    if(fr%10===1){let nb=0;for(let k=0;k<NT;k++)if(den[k]>THR)nb++;const mx=Math.max(...den);
      setHud(root,inside?'walker inside smoke: sight radius 1':`${nb} tiles block sight`);
      ro.innerHTML=`click to throw a smoke bomb · density ×0.955 per 10 Hz update, blocks sight above ${THR}, so a fresh cloud blocks for about <b>${(Math.log(THR)/Math.log(.955)/10).toFixed(1)} s</b>${mx?` · oldest cloud left <b>${(Math.log(THR/Math.max(...den.filter(v=>v>0)))/Math.log(.955)/10).toFixed(1)} s</b>`:''}<br>casts ${casts} · server events about <b>11 bytes</b> each, illustrative (${bytes} B so far) · FOV over ${NT} tiles measured here: <b>${f2ms(tm.v)} ms</b> · §6a measured, 80x45 grid step: <b>0.060 ms</b>`;}}};});

// ======================================================================
// H1 colour keys shared by weather and fogcolour: sky hue per hour, fog = that hue desaturated and lifted
// ======================================================================
const f2SKYK=[[0,'#26304e'],[5,'#3a3a62'],[6.5,'#f0a890'],[9,'#9cc4e4'],[12,'#8cc0e8'],[17,'#a8c0dc'],[18.6,'#f08850'],[20,'#4a3e6a'],[22,'#2a3050'],[24,'#26304e']].map(([h,c])=>[h,U(c)]);
const f2LITK=[[0,[.42,.48,.72]],[5,[.5,.5,.72]],[6.5,[1,.84,.8]],[9,[1,.97,.94]],[12,[1,1,1]],[17,[1,.95,.88]],[18.6,[1,.78,.6]],[20,[.56,.52,.74]],[22,[.44,.48,.72]],[24,[.42,.48,.72]]];
function f2keyAt(K,h){h=((h%24)+24)%24;for(let i=0;i<K.length-1;i++)if(h>=K[i][0]&&h<=K[i+1][0]){const t=(h-K[i][0])/(K[i+1][0]-K[i][0]||1),a=K[i][1],b=K[i+1][1];return typeof a==='number'?mix32(a,b,t):a.map((v,j)=>lerp(v,b[j],t));}return K[0][1];}
const f2fogOf=sky=>{const d=f2desat(sky,.5),[r,g,b]=un32(d),l=(r+g+b)/3,k=Math.max(0,118-l);return mix32(pack(r+k,g+k,b+k*1.15),pack(l+k+60,l+k+60,l+k+68),.35);};

// ======================================================================
// G2/G3: weather as one state machine per region; radiation fog over a compressed day
// ======================================================================
reg('weather',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),RX=4,RY=2,NR=RX*RY,rw=W/RX,rh=H/RY;
  const w=f2world(W,H,63,{cell:48,water:-1,rock:.9,trees:.16,grid:14,houses:[[30,70],[140,40]]}),h=w.h;
  const R=[];for(let k=0;k<NR;k++)R.push({sky:0,wind:0,start:21+f2Hx(k,1,6)*2,clr:1+f2Hx(k,2,6)*2,ceil:0,sent:0,shown:0});
  const SKYN=['clear','cloudy'],WN=['calm','light','strong'],NF=3,tm=f2tm();
  let hour=2.5,fr=0,bytes=0,pk=0,lastRoll=-1,day=0,hist=new Float32Array(96).fill(-1),realT=0;
  // fog ceiling target from the G3 rule: forms 2 to 4 h after dusk (19:00) on clear, calm or light-wind nights, deepest at sunrise (06:00), clears 1 to 3 h later
  const target=(r,hr)=>{if(r.sky!==0||r.wind===2)return 0;const night=hr>=r.start?hr-r.start:hr<6?hr+24-r.start:-1,mx=r.wind===1?.7:.6;
    if(night>=0){const len=30-r.start;return mx*clamp(night/len,0,1);}if(hr>=6&&hr<6+r.clr)return mx*(1-(hr-6)/r.clr);return 0;};
  pointer(cv,([x,y],k)=>{if(k!=='down')return;const r=R[((y/rh)|0)*RX+((x/rw)|0)];r.sky^=1;bytes+=7;pk++;});
  lastRoll=0;for(const r of R){r.sent=Math.round(target(r,hour)*8);r.shown=r.sent/8;}
  // timeline chart
  const X0=40,X1=592,hx=hr=>X0+(X1-X0)*hr/24;
  for(const [hr,l] of [[0,'00'],[6,'06 sunrise'],[12,'12'],[19,'19 dusk'],[24,'24']]){svgEl('line',{x1:hx(hr),x2:hx(hr),y1:8,y2:62,stroke:'#22323e'},svg);svgText(svg,hx(hr),76,l,{'font-size':14,fill:'#93a5b3','text-anchor':hr===24?'end':hr===0?'start':'middle'});}
  svgText(svg,2,18,'fog',{'font-size':14,fill:'#93a5b3'});const line=svgEl('polyline',{points:'',fill:'none',stroke:'#e6d6c2','stroke-width':2},svg),mark=svgEl('line',{x1:0,x2:0,y1:6,y2:64,stroke:'#ffc874','stroke-width':2},svg);
  return {tick(dt){fr++;const spd=c.v('spd');c.out('spd',spd+'x');if(motion){realT+=dt;const ph=hour;hour+=dt*spd*24/48;if(hour>=24){hour-=24;day++;hist.fill(-1);}if((ph<12)!==(hour<12)&&hour>=12){}}
    // server: roll the Markov chain every 3 game hours, send 7 bytes on any change
    const roll=Math.floor((day*24+hour)/3);if(roll!==lastRoll){lastRoll=roll;for(let k=0;k<NR;k++){const r=R[k],a=f2Hx(k,roll,1),b=f2Hx(k,roll,2);const os=r.sky,ow=r.wind;
      r.sky=r.sky===0?(a<.75?0:1):(a<.55?1:0);r.wind=b<.6?r.wind:b<.85?(r.wind+1)%3:(r.wind+2)%3;if(os!==r.sky||ow!==r.wind){bytes+=7;pk++;}}}
    for(const r of R){const tg=target(r,hour),q=Math.round(tg*8);if(q!==r.sent){r.sent=q;bytes+=7;pk++;}r.shown+=(r.sent/8-r.shown)*Math.min(1,dt*spd*1.2);}
    const hi=Math.floor(hour/24*96);hist[hi]=R.reduce((a,r)=>a+r.shown,0)/NR;
    // client: light, fog colour and the fog line, all from the bytes and the clock
    const t0=performance.now(),lit=f2keyAt(f2LITK,hour),fog=f2fogOf(f2keyAt(f2SKYK,hour)),base=Uint32Array.from(f2P,col=>mulc(col,lit[0],lit[1],lit[2]));base[f2I.lamp]=lit[0]<.7?f2P[f2I.lamp]:base[f2I.lamp];base[f2I.lamp2]=lit[0]<.7?f2P[f2I.lamp2]:base[f2I.lamp2];
    const FR=f2ramp(fog,NF,.9,base),dr=Math.floor(realT*2);
    for(let y=0;y<H;y++){const fy=clamp((y+.5)/rh-.5,0,RY-1),j=Math.min(RY-2,Math.floor(fy)),vy=fy-j;for(let x=0;x<W;x++){const fx=clamp((x+.5)/rw-.5,0,RX-1),i=Math.min(RX-2,Math.floor(fx)),vx=fx-i;
      const ce=lerp(lerp(R[j*RX+i].shown,R[j*RX+i+1].shown,vx),lerp(R[(j+1)*RX+i].shown,R[(j+1)*RX+i+1].shown,vx),vy),p=y*W+x,d=(ce-h[p])/.16+vnoise((x-dr)/14,y/9)*.25-.12;
      u[p]=FR[f2lv(clamp(d,0,1),NF,x,y)*f2NP+w.idx[p]];}}
    for(let k=1;k<RX;k++)for(let y=0;y<H;y+=3)u[y*W+k*rw]=mix32(u[y*W+k*rw],0xffffffff,.25);for(let x=0;x<W;x+=3)u[rh*W+x]=mix32(u[rh*W+x],0xffffffff,.25);
    const ICON=['..aaa.....','.abbba.aa.','abbbbbabba','accccccccc','.cccccccc.'],IC={a:U('#7e8a98'),b:U('#f2f2ee'),c:U('#c6ccd2')};
    for(let k=0;k<NR;k++)if(R[k].sky)f2spr(u,W,H,ICON,IC,(k%RX)*rw+rw-9,((k/RX)|0)*rh+7);
    tm.add(performance.now()-t0);F.put();
    if(fr%6===1){const pts=[];for(let i=0;i<96;i++)if(hist[i]>=0)pts.push([hx(i/4),62-hist[i]/.7*52]);line.setAttribute('points',pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '));mark.setAttribute('x1',hx(hour));mark.setAttribute('x2',hx(hour));
      setHud(root,`${f2fmtH(hour)} · ${pk} packets`);
      ro.innerHTML=`each region holds 5 bytes (fog, cloud, wind x, wind y, fog ceiling) and sends a 7-byte packet only when one changes · sent so far <b>${bytes} B</b> in ${pk} packets, <b>${(bytes/Math.max(1,realT)).toFixed(1)} B/s</b> at this ${spd}x clock<br>`+
        R.map((r,k)=>`R${k+1} ${SKYN[r.sky]}, ${WN[r.wind]}${r.sent?`, fog ${r.sent}/8`:''}`).join(' · ')+`<br>client pass measured here, JS, ${W}x${H}: <b>${f2ms(tm.v)} ms</b> · click a region to flip its sky`;}}};});

// ======================================================================
// H1: fog colour follows the time of day; desaturated sky hue; scrub the clock
// ======================================================================
reg('fogcolour',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),svg=$('svg',root),NF=4;
  const w=f2world(W,H,74,{cell:48,water:.18,rock:.9,trees:.2,grid:13,houses:[[22,60],[128,34],[150,88]]}),h=w.h,tb=f2tm(),tp=f2tm();
  let hour=6.2,fr=0,lastH=-1,FR=null,fog=0,sky=0,ents=0,t=0;
  // 24 h strip: sky hue on top, fog colour under it
  const X0=4,X1=596,segs=[],fsegs=[];for(let i=0;i<48;i++){const x=X0+(X1-X0)*i/48,wd=(X1-X0)/48+.6;segs.push(svgEl('rect',{x,y:6,width:wd,height:14},svg));fsegs.push(svgEl('rect',{x,y:22,width:wd,height:22},svg));}
  for(const [hr,l] of [[0,'night'],[6.5,'dawn'],[12,'noon'],[18.6,'dusk']]){const x=X0+(X1-X0)*hr/24;svgText(svg,x+2,60,l,{'font-size':14,fill:'#93a5b3'});svgEl('line',{x1:x,x2:x,y1:44,y2:48,stroke:'#93a5b3'},svg);}
  const mark=svgEl('rect',{x:0,y:3,width:3,height:44,fill:'#ffffff'},svg);
  const paint=grey=>{for(let i=0;i<48;i++){const s=f2keyAt(f2SKYK,i/2);segs[i].setAttribute('fill','#'+un32(s).map(v=>v.toString(16).padStart(2,'0')).join(''));const f=grey?U('#9a9a9a'):f2fogOf(s);fsegs[i].setAttribute('fill','#'+un32(f).map(v=>v.toString(16).padStart(2,'0')).join(''));}};
  let greyWas=null;c.on('h',()=>{hour=c.v('h');});
  return {tick(dt){fr++;const play=c.v('play'),grey=c.v('grey');if(motion)t+=dt;if(play&&motion){hour=(hour+dt*.5)%24;c.el('h').value=hour.toFixed(1);}else hour=c.v('h');c.out('h',f2fmtH(hour));
    if(grey!==greyWas){greyWas=grey;paint(grey);lastH=-1;}
    // rebuild the fog table when the clock moves by 0.1 h: palette × light, then NF fog levels toward the fog colour
    if(Math.abs(hour-lastH)>=.1||!FR){lastH=hour;const t0=performance.now(),lit=f2keyAt(f2LITK,hour);sky=f2keyAt(f2SKYK,hour);fog=grey?U('#9a9a9a'):f2fogOf(sky);
      const base=Uint32Array.from(f2P,col=>mulc(col,lit[0],lit[1],lit[2]));if(lit[0]<.75){base[f2I.lamp]=f2P[f2I.lamp];base[f2I.lamp2]=f2P[f2I.lamp2];}
      for(let r=0;r<20;r++)FR=f2ramp(fog,NF,.8,base);ents=FR.length;tb.add((performance.now()-t0)/20);}
    const t0=performance.now(),dr=Math.floor(t*6),line=.4+.06*Math.sin(t*.3);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x,d=(line-h[p])/.22+vnoise((x-dr)/16,y/10)*.3-.1;u[p]=FR[f2lv(clamp(d,0,1),NF,x,y)*f2NP+w.idx[p]];}
    tp.add(performance.now()-t0);F.put();mark.setAttribute('x',X0+(X1-X0)*hour/24-1.5);
    if(fr%8===1){const hx=v=>'#'+un32(v).map(q=>q.toString(16).padStart(2,'0')).join('');
      setHud(root,`${f2fmtH(hour)} · fog ${hx(fog)}`);
      ro.innerHTML=`sky <b>${hx(sky)}</b> → fog <b>${hx(fog)}</b>${grey?' (forced grey: compare how it reads as a filter)':', the sky hue at half saturation, lifted'} · ${f2SKYK.length-1} keys interpolated, no 24 painted palettes<br>table of <b>${ents}</b> entries rebuilt in <b>${f2ms(tb.v)} ms</b> (measured here, JS) · per-pixel pass measured here <b>${f2ms(tp.v)} ms</b> · §6a measured, M4 GPU, palette pass: <b>0.016 ms</b> at 720p`;}}};});

// ======================================================================
// H2/H3: readability: characters inside the fog vs above it vs fog behind them; strength and reduce motion
// ======================================================================
reg('readable',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,u=F.u32,c=ctl(root),ro=$('[data-ro]',root),NF=4,I=f2I;
  const w=f2world(W,H,85,{cell:48,water:.16,trees:.3,grid:13,path:1,pathY:60}),FOG=U('#c4ccd2'),FR=f2ramp(FOG,NF,.9),MX=.9,INK=f2P[I.ink];
  const n1t=f2tile(128,128,64,95,3),n2t=f2tile(128,128,64,96,3),view=new Uint8Array(W*H),mask=new Uint8Array(W*H),LBL=['walker','slime','chest'];
  let t=0,ct=0,fr=0,cr=[0,0,0];const lvb=new Uint8Array(W*H);
  c.seg('mode',()=>{});
  return {tick(dt){fr++;if(motion)t+=dt;const rm=c.v('rm'),st=c.v('str')/100,mode=c.segv('mode');if(motion&&!rm)ct+=dt;c.out('str',Math.round(st*100)+'%');
    view.set(w.idx);mask.fill(0);
    const P=[[70+Math.sin(t*.6)*30,64],[128,58+Math.sin(t*.9)*4],[100,82]];
    f2spr(view,W,H,f2walk(motion?((t*7)|0):0),f2map(f2MW),P[0][0],P[0][1],Math.cos(t*.6)<0,mask,1);f2spr(view,W,H,f2SLIME,f2map(f2MS),P[1][0],P[1][1],false,mask,2);f2spr(view,W,H,f2CHEST,f2map(f2MC),P[2][0],P[2][1],false,mask,3);
    const o1=Math.floor(ct*9),o2=Math.floor(ct*15);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x,lowD=smooth(.25,.75,n1t[(y&127)*128+((x-o1)&127)])*.9*st,highD=smooth(.45,.75,n2t[((y-(o2>>1))&127)*128+((x-o2)&127)])*.25*st,sp=mask[p]>0;
      let d=mode==='over'?lowD+highD:sp?(mode==='above'?0:highD):lowD+highD;const l=f2lv(clamp(d,0,1),NF,x,y,.22);lvb[p]=l;u[p]=FR[l*f2NP+view[p]];}
    if(mode==='above')for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const p=y*W+x;if(!mask[p]&&(mask[p-1]||mask[p+1]||mask[p-W]||mask[p+W]))u[p]=INK;}
    F.put();
    if(fr%10===1){const sum=[0,0,0],cnt=[0,0,0];for(let p=0;p<W*H;p++){const k=mask[p];if(k){sum[k-1]+=lvb[p]/NF*MX;cnt[k-1]++;}}for(let k=0;k<3;k++)cr[k]=cnt[k]?sum[k]/cnt[k]:0;
      setHud(root,rm?'reduce motion: drift frozen':`fog strength ${Math.round(st*100)}%`);
      ro.innerHTML=`fog mixed into each sprite, measured from the drawn pixels: `+LBL.map((l,k)=>`${l} <b>${Math.round(cr[k]*100)}%</b>`).join(' · ')+
        `<br>draw order costs nothing; the outline costs a few reads on sprite pixels only · ${rm?'drift frozen by reduce motion':'low fog drifts 9 px/s, thin high fog 15 px/s'}`;}}};});
