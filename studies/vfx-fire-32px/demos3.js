"use strict";
// Fire 32 study: figures 3 (smokecluster, puffs, embers, burnchar, torchwalk, rimlight, sootwalk, crowd, areas, missile, explode, costs, tilesizes, score)
{
// ----------------------------------------------------------------------
// small styles only these figures use
// ----------------------------------------------------------------------
{const st=document.createElement('style');st.textContent=
'.h3-fr{display:grid;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));margin-top:4px;font:11.5px/1.3 "IBM Plex Mono",monospace;color:var(--mute,#8c98b0);text-align:center}'+
'.h3-fr span{padding:3px 2px;border-top:2px solid transparent;min-width:0}'+
'.h3-fr span b{display:block;font-weight:400;color:var(--txt,#dbe2ee)}'+
'.h3-fr span.on{color:var(--lamp,#ffd27a);border-top-color:var(--lamp,#ffd27a)}'+
'.h3-tag{font:10.5px "IBM Plex Mono",monospace;border-radius:3px;padding:0 5px;margin-left:3px;white-space:nowrap}'+
'.h3-tag.ship{background:rgba(181,217,138,.14);color:#b5d98a;border:1px solid rgba(181,217,138,.5)}'+
'.h3-tag.ours{background:rgba(255,190,106,.12);color:#ffbe6a;border:1px solid rgba(255,190,106,.5)}'+
'.h3-drop{margin:8px 0 0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px;font-size:13px;color:var(--txt,#dbe2ee);counter-reset:d}'+
'.h3-drop li{counter-increment:d;padding:3px 8px;border:1px solid var(--line2,#35435f);border-radius:4px}'+
'.h3-drop li::before{content:counter(d) ". ";color:var(--lamp,#ffd27a);font-family:"IBM Plex Mono",monospace}'+
'.h3-drop li.off{color:var(--mute,#8c98b0);text-decoration:line-through;border-style:dashed}'+
'.h3-chart{max-width:760px}'+
'.h3-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12.5px;color:var(--mute,#8c98b0);margin-top:6px}'+
'.h3-leg i{display:inline-block;width:12px;height:10px;border-radius:2px;vertical-align:-1px;margin-right:5px}'+
'.h3-side{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-start}'+
'.h3-side>.stage{flex:0 0 auto}'+
'.h3-side>.h3-facts{flex:1 1 220px;min-width:0}'+
'.h3-facts{margin:0;display:grid;grid-template-columns:minmax(90px,auto) minmax(0,1fr);gap:3px 10px;font-size:13px;line-height:1.45;padding:8px 10px;background:#090d16;border:1px solid var(--line,#212c45);border-radius:4px}'+
'.h3-facts dt{color:var(--mute,#8c98b0)}.h3-facts dd{margin:0;color:var(--txt,#dbe2ee)}.h3-facts dd.illu2{color:#ffbe6a}'+
'.h3-tl{width:100%;max-width:760px;display:block;margin-top:8px}'+
'.h3-cards{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end}'+
'.h3-cards button{display:flex;flex-direction:column;align-items:center;gap:3px;background:#0f1523;border:1px solid var(--line2,#35435f);border-radius:4px;padding:5px 4px 4px;color:var(--txt,#dbe2ee);font:11.5px/1.2 "IBM Plex Sans",sans-serif;cursor:pointer;min-width:0}'+
'.h3-cards button canvas{display:block;image-rendering:pixelated;border-radius:2px}'+
'.h3-cards button span{max-width:96px;text-align:center}'+
'.h3-cards button small{font:10.5px "IBM Plex Mono",monospace;color:var(--mute,#8c98b0)}'+
'.h3-cards button.on{border-color:var(--lamp,#ffd27a);background:#1b2234}'+
'.h3-cards button.ast{border-color:#ffbe6a}'+
'.h3-sub{margin:10px 0 4px!important;font-size:12.5px;color:var(--mute,#8c98b0)}'+
'.h3-chips{display:flex;flex-wrap:wrap;gap:5px}'+
'.h3-chips button{background:transparent;border:1px solid var(--line2,#35435f);border-radius:4px;color:var(--txt,#dbe2ee);font:12.5px "IBM Plex Sans",sans-serif;padding:3px 8px;cursor:pointer}'+
'.h3-chips button.on{border-color:var(--lamp,#ffd27a);background:#1b2234}'+
'.h3-card{display:grid;grid-template-columns:minmax(96px,auto) minmax(0,1fr);gap:3px 12px;margin:10px 0 0;padding:8px 10px;background:#090d16;border:1px solid var(--line,#212c45);border-radius:4px;font-size:13.5px;line-height:1.45}'+
'.h3-card dt{color:var(--mute,#8c98b0)}.h3-card dd{margin:0;color:var(--txt,#dbe2ee);min-height:1.45em}.h3-card dt.h,.h3-card dd.h{color:var(--lamp,#ffd27a);font-weight:600}'+
'@media (max-width:640px){.h3-fr{font-size:10px}.h3-drop{grid-template-columns:minmax(0,1fr)}.h3-facts{font-size:12.5px}}';
document.head.appendChild(st);}

// ----------------------------------------------------------------------
// colours: the Fire 32 Sandbox palette. Fire bends from purple through red to yellow
// ----------------------------------------------------------------------
const hx=h=>(0xff000000|parseInt(h.slice(5,7),16)<<16|parseInt(h.slice(3,5),16)<<8|parseInt(h.slice(1,3),16))>>>0;
const cR=c=>c&255,cG=c=>c>>>8&255,cB=c=>c>>>16&255;
const rgb=(r,g,b)=>(0xff000000|(b>255?255:b<0?0:b|0)<<16|(g>255?255:g<0?0:g|0)<<8|(r>255?255:r<0?0:r|0))>>>0;
const mixc=(a,b,t)=>rgb(cR(a)+(cR(b)-cR(a))*t,cG(a)+(cG(b)-cG(a))*t,cB(a)+(cB(b)-cB(a))*t);
const PAL={OUTL:'#1a1420',G0:'#1c3a32',G1:'#28583b',G2:'#3b7840',G3:'#5c9845',G4:'#92bf59',D0:'#5a4a2d',D1:'#836c39',D2:'#b09049',D3:'#d8bd6b',
  C0:'#150e14',C1:'#26191d',C2:'#3b2a26',C3:'#583e30',A0:'#45414c',A1:'#68646f',A2:'#8f8a95',A3:'#b8b3bb',S0:'#2a2b3a',S1:'#45485b',S2:'#666a7e',S3:'#8e93a5',S4:'#bec2ce',
  W0:'#35201a',W1:'#583725',W2:'#7e522f',W3:'#a6733f',W4:'#cb995b',R0:'#44202a',R1:'#6c2d30',R2:'#964237',R3:'#be613e',B0:'#1a2c54',B1:'#274b81',B2:'#3a72aa',B3:'#75afd5',B4:'#c5e7f1',
  P0:'#0f2f2c',P1:'#1a493c',P2:'#29694a',P3:'#498a54',K0:'#86493a',K1:'#c37d5b',K2:'#eab28b',U0:'#1e2a57',U1:'#2e4b8d',U2:'#4b75c5',V0:'#2b4925',V1:'#446f35',V2:'#6a9949',
  Q0:'#49295d',Q1:'#6d448f',Q2:'#996fbd',Y0:'#89591d',Y1:'#c8912f',Y2:'#efc555',RD0:'#5d1923',RD1:'#952b2d',RD2:'#c7473b',WL0:'#8a8595',WL1:'#c8c4cc',WL2:'#f0ece7',
  SM0:'#2f2d36',SM1:'#4f4c58',SM2:'#777382',SM3:'#a29eaa',ST0:'#c3cfdb',ST1:'#edf3f7',F0:'#3f1a3f',F1:'#8d1f2c',F2:'#cf421f',F3:'#f1822a',F4:'#fcca4c',F5:'#fff3c4',
  WHITE:'#ffffff',RIM:'#ffbe6a',ORNG:'#ff9900',LAMP:'#ffd27a',GREY:'#5d6170',GREYL:'#80859a'};
const C={};for(const k in PAL)C[k]=hx(PAL[k]);
const EMIS=new Set([C.F0,C.F1,C.F2,C.F3,C.F4,C.F5,C.WHITE,C.RIM,C.ORNG,C.LAMP]);
const RAMPS=[['G0','G1','G2','G3','G4'],['D0','D1','D2','D3'],['C0','C1','C2','C3'],['A0','A1','A2','A3'],['S0','S1','S2','S3','S4'],['W0','W1','W2','W3','W4'],['R0','R1','R2','R3'],['B0','B1','B2','B3','B4'],
  ['P0','P1','P2','P3'],['K0','K1','K2'],['U0','U1','U2'],['V0','V1','V2'],['Q0','Q1','Q2'],['Y0','Y1','Y2'],['RD0','RD1','RD2'],['WL0','WL1','WL2'],['SM0','SM1','SM2','SM3'],['ST0','ST1']];
const DK=new Map();for(const r of RAMPS)for(let k=1;k<r.length;k++)DK.set(C[r[k]],C[r[k-1]]);
// one step down its ramp (the Sandbox's DARK table); flame colours stay, everything else falls to the outline
const dark=c=>{const d=DK.get(c);return d!==undefined?d:EMIS.has(c)?c:C.OUTL;};
// palette versions, as the Sandbox builds them: 0 base, 1 and 2 warm-lit, 3 the burning tint (R x1.0, G x0.7, B x0.6). Times of day day, dusk, night.
const TOD={day:[1,1,1,0],dusk:[.8,.6,.7,.62],night:[.3,.34,.56,1]},TODK={day:0,dusk:4,night:8},VC=new Map();
function ver(c,tod,v){if(EMIS.has(c))return c;const key=c*16+TODK[tod]+v;let o=VC.get(key);if(o!==undefined)return o;const T=TOD[tod],r=cR(c),g=cG(c),b=cB(c);let R=r*T[0],G=g*T[1],B=b*T[2];
  if(v===1||v===2){const a=v===1?.1+.36*T[3]:.22+.5*T[3],wr=r*1.1+34,wg=g*.92+14,wb=b*.62+2;R+=(wr-R)*a;G+=(wg-G)*a;B+=(wb-B)*a;}
  else if(v===3){R=Math.max(R,r*.7)+22;G=Math.max(G,g*.5)*.7+6;B=Math.max(B,b*.4)*.6;}
  o=rgb(R,G,B);VC.set(key,o);return o;}
const nf=n=>Math.round(n).toLocaleString('en-US');
const f3=v=>v<.0005?'under 0.001':v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);
const mtr=(k=.08)=>{let s=-1,t0=0;return {a(){t0=performance.now();},b(){const d=performance.now()-t0;s=s<0?d:s+(d-s)*k;return s;},add(d){s=s<0?d:s+(d-s)*k;},get v(){return Math.max(0,s);}};};
const B2=[0,2,3,1];
// 2x2 block threshold for the cluster rule: a 4x4 Bayer laid on 2x2 px blocks, so every on or off patch is at least 2x2
const thr2=(x,y)=>(bay(x>>1,y>>1)+.5)/16;
function rect(u,W,H,x0,y0,w,h,col){for(let y=Math.max(0,y0);y<Math.min(H,y0+h);y++)for(let x=Math.max(0,x0);x<Math.min(W,x0+w);x++)u[y*W+x]=col;}
function box(u,W,H,x0,y0,w,h,col){for(let x=x0;x<x0+w;x++){if(x<0||x>=W)continue;if(y0>=0&&y0<H)u[y0*W+x]=col;if(y0+h-1>=0&&y0+h-1<H)u[(y0+h-1)*W+x]=col;}
  for(let y=y0;y<y0+h;y++){if(y<0||y>=H)continue;if(x0>=0&&x0<W)u[y*W+x0]=col;if(x0+w-1>=0&&x0+w-1<W)u[y*W+x0+w-1]=col;}}
// dashed 32 px tile grid drawn as a darker tone of what is there
function gridOv(u,W,H,ox,oy,ts=32){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const gx=((x-ox)%ts+ts)%ts===0,gy=((y-oy)%ts+ts)%ts===0;if((gx&&((y-oy)&3)<2)||(gy&&((x-ox)&3)<2)){const i=y*W+x;u[i]=mixc(u[i],C.OUTL,.3);}}}
function follow(stage,el){const f=()=>{const w=stage.getBoundingClientRect().width;if(w>0)el.style.maxWidth=w+'px';};f();if(typeof ResizeObserver!=='undefined')new ResizeObserver(f).observe(stage);addEventListener('resize',f);}

// ground in 2x2 clusters. kind: grass, burnt, ash, stone, dirt
function mkGround(W,H,seed,kind){const g=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const bx=x>>1,by=y>>1,n=vnoise(bx*.12+seed*3.7,by*.12+seed*1.3)*.72+vnoise(bx*.41+seed,by*.41+seed*5)*.28+(hash2(bx+seed*31,by*7+seed)-.5)*.06,h=hash2(bx*3+seed,(by>>1)*5+seed*7);let c;
    if(kind==='burnt')c=n>.6?C.C3:n<.4?C.C1:C.C2;
    else if(kind==='ash')c=n>.6?C.A2:n<.38?C.A0:C.A1;
    else if(kind==='stone')c=n>.62?C.S3:n<.38?C.S1:C.S2;
    else if(kind==='dirt')c=n>.62?C.D2:n<.38?C.D0:C.D1;
    else{c=n>.66?C.G3:n<.33?C.G1:C.G2;if(h>.993)c=C.G4;}
    g[y*W+x]=c;}return g;}
// a light level from a distance in px through a dither band about 3 px wide: edges [far, near] in px give levels 0, 1, 2
const band=(dpx,x,y,e1,e2)=>{const j=dpx+(thr2(x,y)-.5)*3;return j<e2?2:j<e1?1:0;};
// a map of tile kinds with ragged 2x2 borders. kindAt(tx, ty) -> kind name
function mkTileGround(W,H,seed,kindAt){const L={},g=new Uint32Array(W*H),K=new Uint8Array(W*H),names=[];
  const lay=k=>{if(!L[k]){L[k]=mkGround(W,H,seed+names.length*13,k);names.push(k);}return L[k];};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const bx=x>>1,by=y>>1,ox=(vnoise(bx*.5+seed,by*.5)-.5)*7,oy=(vnoise(bx*.5,by*.5+seed+9)-.5)*7,k=kindAt(clamp((x+ox)>>5,0,(W>>5)),clamp((y+oy)>>5,0,(H>>5)));g[y*W+x]=lay(k)[y*W+x];K[y*W+x]=names.indexOf(k);}
  return {g,K,names};}

// ----------------------------------------------------------------------
// flames: the Sandbox's generated loops (outline in the dark tone, 2 to 3 base rows held still, no lone pixels)
// id: w, h, frames, ms per frame, tones, variants
// ----------------------------------------------------------------------
const FCAT={fB:[44,50,5,100,6,4],torch:[10,16,6,100,5,1],htorch:[6,8,4,100,4,1],gs:[8,10,4,100,4,2],gl:[12,16,6,100,5,2],brz:[16,20,6,110,5,1],camp:[24,28,8,110,6,1],tree:[22,28,8,120,6,2],house:[28,32,8,130,6,2],
  fA:[46,46,5,120,6,4],fC:[34,36,5,100,5,4],st:[8,10,4,100,4,1],sth:[6,8,4,100,4,1]};
const FTONE=[0,C.F1,C.F2,C.F3,C.F4,C.F5,C.F0];
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
const FLC={};
function FL(id){if(FLC[id])return FLC[id];const [w,h,n,ms,nt,nv]=FCAT[id],vs=[];for(let v=0;v<nv;v++)vs.push(genFlame(w,h,n,nt,v*17+w));return FLC[id]={w,h,n,ms,vs};}
// draw one flame with its bottom centre at (x, y). t in seconds, ph a phase in frames, lean shifts the top 2 rows
function flame(u,W,H,id,t,x,y,ph=0,v=0,lean=0,M,depth){const F=FL(id),fr=F.vs[v%F.vs.length][((Math.floor(t*1000/F.ms)+ph)%F.n+F.n)%F.n],x0=Math.round(x-F.w/2),y0=Math.round(y)-F.h+1;
  for(let j=0;j<F.h;j++){const yy=y0+j;if(yy<0||yy>=H)continue;const sh=j<2?lean:0;for(let i=0;i<F.w;i++){const tn=fr[j*F.w+i];if(!tn)continue;const xx=x0+i+sh;if(xx<0||xx>=W)continue;const q=yy*W+xx;if(M&&M[q]>depth)continue;u[q]=FTONE[tn];}}}

// ----------------------------------------------------------------------
// the Sandbox's 24x32 characters: row templates, frames with hand positions, outline
// ----------------------------------------------------------------------
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
const mkMap=(hat,hatL,hatD,coat,coatL,coatD,scarf,scarfD,hair,hairD,brim,brimD)=>({h:C[hat],L:C[hatL],H:C[hatD],w:C[brim],W:C[brimD],k:C[hair],K:C[hairD],s:C.K2,S:C.K1,E:C.OUTL,y:C[scarf],Y:C[scarfD],c:C[coat],l:C[coatL],C:C[coatD],g:C.K2,G:C.K1,p:C.S1,P:C.S0,b:C.W1,B:C.W0,o:C.OUTL});
const MAPS=[mkMap('RD1','RD2','RD0','U1','U2','U0','Y1','Y0','W1','W0','W2','W1'),mkMap('D2','D3','D1','V1','V2','V0','RD1','RD0','S2','S1','D2','D1'),mkMap('P2','P3','P1','RD1','RD2','RD0','Y2','Y1','W1','W0','P1','P0'),
  mkMap('Q1','Q2','Q0','W2','W3','W1','U1','U0','W0','C1','Q0','Q0'),mkMap('Y1','Y2','Y0','Q1','Q2','Q0','RD1','RD0','W1','W0','Y0','Y0'),mkMap('U1','U2','U0','S2','S3','S1','Y1','Y0','C2','C1','U0','U0'),mkMap('S2','S3','S1','V1','V2','V0','R2','R1','W1','W0','S1','S0')];
function outlineSprite(px,w,h){const add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(px[i])continue;if((x>0&&px[i-1])||(x<w-1&&px[i+1])||(y>0&&px[i-w])||(y<h-1&&px[i+w]))add.push(i);}for(const i of add)px[i]=C.OUTL;}
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
let FRc=null;const FR=()=>FRc||(FRc=MAPS.map(mkFrames));
// draw one character with its feet on (x, y). dir 0 south, 1 north, 2 east, 3 west (the east frame flipped). fr 0..3 walk, 4 idle.
// o: tod, v (palette version 0..3), vf(x, y) -> version, cv(colour, x, y) -> colour, flash, rim [dx, dy, tones] in screen space, M depth mask with depth. Returns [rim px, inner px]
function drawCh(u,W,H,set,dir,fr,x,y,o){o=o||{};const dI=dir===0?0:dir===1?1:2,F=FR()[set][dI][fr],px=F.px,flip=dir===3,x0=Math.round(x)-12,y0=Math.round(y)-30,tod=o.tod||'day',rm=o.rim,M=o.M,dp=o.depth|0;
  const sp=(sx,sy)=>sx<0||sx>23||sy<0||sy>31?0:px[sy*24+(flip?23-sx:sx)];let rn=0,inn=0;
  for(let r=0;r<32;r++){const yy=y0+r;if(yy<0||yy>=H)continue;for(let cx=0;cx<24;cx++){const v=sp(cx,r);if(!v)continue;const xx=x0+cx;if(xx<0||xx>=W)continue;const q=yy*W+xx;if(M&&M[q]>dp)continue;let c;
      if(o.flash)c=C.WHITE;
      else if(rm&&rm[2]>0&&!sp(cx+rm[0],r+rm[1])){c=C.RIM;rn++;}
      else if(rm&&rm[2]>1&&v!==C.OUTL&&!sp(cx+2*rm[0],r+2*rm[1])){c=ver(v,tod,2);inn++;}
      else c=o.cv?o.cv(v,xx,yy):ver(v,tod,o.vf?o.vf(xx,yy):(o.v|0));
      u[q]=o.glow?o.glow(c,xx,yy):c;if(M)M[q]=dp;}}
  return [rn,inn];}
// a ground shadow ellipse: every pixel one step down its ramp. Mask m (optional) stops double darkening
let SHS=1;
function shadowEll(u,W,H,cx,cy,hw,hh,m){for(let r=-hh;r<=hh;r++){const y=cy+r;if(y<0||y>=H)continue;const w=Math.round(hw*Math.sqrt(Math.max(0,1-(r/(hh+.5))**2)));for(let x=cx-w;x<cx+w;x++){if(x<0||x>=W)continue;const i=y*W+x;if(m){if(m[i]===SHS)continue;m[i]=SHS;}u[i]=dark(u[i]);}}}
// hand position for a carried torch (E2): the idle frame's hand plus the per-frame offset, held 4 px forward in side view (the Sandbox as built). Returns [x, y] in sprite px
const HOFF_S=[[1,0],[0,-1],[-1,0],[0,-1],[0,0]],HOFF_X=[[1,0],[0,0],[-1,0],[0,0],[0,0]];
function handAt(set,dir,fr){const dI=dir===0?0:dir===1?1:2,st=FR()[set][dI][4],h=dI===0?st.hl:dI===1?st.hr:st.hl,off=dI<2?HOFF_S[fr]:HOFF_X[fr];
  let hx0=h[0]+off[0]+(dI===0?-2:dI===1?2:4),hy0=h[1]+off[1];if(dir===3)hx0=23-hx0;return [Math.round(hx0),Math.round(hy0)];}
// the torch: a 2x8 stick with a charred tip and a 6x8 flame on its own clock. In side view the stick tilts 6 px forward.
// As built, only a character facing north draws it behind the body; facing west the held hand is the near arm, so it stays in front
const torchAfter=dir=>dir!==1;
function drawTorch(u,W,H,set,dir,fr,x,y,t,ph,lean,M,depth){const h=handAt(set,dir,fr),X=Math.round(x)-12+h[0],Y=Math.round(y)-30+h[1],tl=dir===2?1:dir===3?-1:0;
  for(let k=0;k<8;k++)for(let q=0;q<2;q++){const xx=X+q-1+tl*Math.round(k*.8),yy=Y-k;if(xx<0||yy<0||xx>=W||yy>=H)continue;const i=yy*W+xx;if(M&&M[i]>depth)continue;u[i]=k>=6?(q?C.C1:C.W0):(q?C.W1:C.W3);if(M)M[i]=depth;}
  flame(u,W,H,'htorch',t,X+tl*6,Y-7,ph,0,lean,M,depth);return [X+tl*6,Y-7];}
// the Sandbox's two character shadows: a 14x5 blob, and within 4 tiles of a fire one 16 px ellipse, 6 to 10 px tall, pushed away from it.
// Both one shade darker, no pixel darkened twice. (dx, dy) points from the feet to the fire
function charShadows(u,W,H,x,y,m,dx,dy,d){SHS++;shadowEll(u,W,H,x,y-3,7,2,m);if(d!==undefined&&d<4&&d>.3){const l=Math.hypot(dx,dy),ux=-dx/l,uy=-dy/l;shadowEll(u,W,H,Math.round(x+ux*6),Math.round(y-3+uy*3),8,Math.round(3+Math.abs(uy)*2),m);}}

// puff masks (Sandbox): diameters 4..64 in 2 px steps; code 1 light, 2 body, 3 shade
const PUFFM=[];
function puffMask(s){s=clamp(s&~1,4,64);const k=(s-4)>>1;if(PUFFM[k])return PUFFM[k];const a=new Uint8Array(s*s),r=s/2,L=s<10?[[0,0,1]]:[[0,.12,.62],[-.42,.2,.44],[.42,.16,.46],[.04,-.34,.5]];
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){const dx=(x+.5-r)/r,dy=(y+.5-r)/r;let inL=-1,best=-9;for(let q=0;q<L.length;q++){const v=L[q][2]-Math.hypot(dx-L[q][0],dy-L[q][1]);if(v>best){best=v;inL=q;}}
    if(best<0)continue;const lx=(dx-L[inL][0])/L[inL][2],ly=(dy-L[inL][1])/L[inL][2];a[y*s+x]=(lx+ly<-.55&&best>.06)?1:(ly>.45&&(dy>.25||s<10))?3:2;}
  return PUFFM[k]={s,a};}
// draw a puff centred at (x, y). tones [light, body, shade]; under 16 px only two tones. fade 0..1 drops 2x2 chunks
function drawPuff(u,W,H,x,y,size,tones,fade,id){const P=puffMask(size),s=P.s,x0=Math.round(x-s/2),y0=Math.round(y-s/2),two=s<16;
  for(let j=0;j<s;j++){const yy=y0+j;if(yy<0||yy>=H)continue;for(let i=0;i<s;i++){const cd=P.a[j*s+i];if(!cd)continue;const xx=x0+i;if(xx<0||xx>=W)continue;
    if(fade>0&&hash2(((xx>>1)+id*7)|0,((yy>>1)+id*13)|0)<fade)continue;u[yy*W+xx]=two?(cd===3?tones[1]:tones[0]):tones[cd-1];}}}

// damage digits, 5x9 with a 1 px outline: 11 px tall (the Sandbox's glyphs)
const DG9=[[".###.","#...#","#...#","#...#","#...#","#...#","#...#","#...#",".###."],["..#..",".##..","#.#..","..#..","..#..","..#..","..#..","..#..","#####"],[".###.","#...#","....#","....#","...#.","..#..",".#...","#....","#####"],[".###.","#...#","....#","....#","..##.","....#","....#","#...#",".###."],["...#.","..##.",".#.#.","#..#.","#..#.","#####","...#.","...#.","...#."],["#####","#....","#....","####.","....#","....#","....#","#...#",".###."],[".###.","#...#","#....","#....","####.","#...#","#...#","#...#",".###."],["#####","....#","....#","...#.","...#.","..#..","..#..",".#...",".#..."],[".###.","#...#","#...#","#...#",".###.","#...#","#...#","#...#",".###."],[".###.","#...#","#...#","#...#",".####","....#","....#","#...#",".###."]];
// a number centred on x with its top at y; alpha < 1 blends toward what is under it (OTClient fades the text alpha)
function drawNum(u,W,H,x,y,str,col,alpha=1){str=String(str);const x0=Math.round(x-str.length*3),y0=Math.round(y),put=(xx,yy,c)=>{if(xx<0||yy<0||xx>=W||yy>=H)return;const i=yy*W+xx;u[i]=alpha>=1?c:mixc(u[i],c,alpha);};
  const on=(n,r,c)=>r>=0&&r<9&&c>=0&&c<5&&DG9[+str[n]][r][c]==='#';
  for(let n=0;n<str.length;n++)for(let r=-1;r<10;r++)for(let c=-1;c<6;c++){if(on(n,r,c))continue;if(on(n,r-1,c)||on(n,r+1,c)||on(n,r,c-1)||on(n,r,c+1))put(x0+n*6+c,y0+r+1,C.OUTL);}
  for(let n=0;n<str.length;n++)for(let r=0;r<9;r++)for(let c=0;c<5;c++)if(on(n,r,c))put(x0+n*6+c,y0+r+1,col);}

// a simple fixed pool for embers and sparks (D3): ring of n slots, nothing allocates
function mkEm(n){const E={n,x:new Float32Array(n),y:new Float32Array(n),vx:new Float32Array(n),vy:new Float32Array(n),t:new Float32Array(n),life:new Float32Array(n),k:new Uint8Array(n),head:0,
  spawn(x,y,vx,vy,life,k){for(let q=0;q<n;q++){const j=(E.head+q)%n;if(E.life[j]<=0){E.x[j]=x;E.y[j]=y;E.vx[j]=vx;E.vy[j]=vy;E.t[j]=0;E.life[j]=life;E.k[j]=k;E.head=(j+1)%n;return true;}}return false;},
  step(dt,wind){let c=0;for(let j=0;j<n;j++){if(E.life[j]<=0)continue;E.t[j]+=dt;if(E.t[j]>=E.life[j]){E.life[j]=0;continue;}c++;
    if(E.k[j]===1)E.vy[j]+=120*dt;else if(E.k[j]===3)E.vy[j]+=300*dt;else{E.vy[j]-=26*dt;E.vx[j]+=((wind||0)-E.vx[j])*.9*dt;E.vy[j]*=Math.pow(.985,dt*60);}
    E.x[j]+=E.vx[j]*dt;E.y[j]+=E.vy[j]*dt;}return c;},
  count(){let c=0;for(let j=0;j<n;j++)if(E.life[j]>0)c++;return c;},clear(){E.life.fill(0);}};return E;}
// draw the pool. one: VFX #6 style, every ember 1 px. frame: a counter for the flutter (top half cut every other frame)
const EMC=[C.F5,C.F4,C.F4,C.F3,C.F3,C.F2,C.F1];
function drawEm(u,W,H,E,one,frame){for(let j=0;j<E.n;j++){if(E.life[j]<=0)continue;const f=E.t[j]/E.life[j],x=Math.round(E.x[j]),y=Math.round(E.y[j]);if(x<0||y<1||x>=W-1||y>=H-1)continue;const i=y*W+x,k=E.k[j];
  if(k===0){const col=EMC[Math.min(6,(f*7)|0)];u[i]=col;if(!one){u[i+1]=col;if(((frame+j)&1)===0||f<.3){u[i-W]=col;u[i-W+1]=col;}}}
  else if(k===1){u[i]=f<.5?C.F5:C.F4;if(!one&&(j&1))u[i-W]=C.F5;}
  else if(k===2){u[i]=u[i+1]=f<.5?C.A2:C.A1;u[i-W]=u[i-W+1]=f<.5?C.A3:C.A2;}
  else{u[i]=u[i+1]=C.C2;u[i-W]=u[i-W+1]=C.C3;}}}

// a campfire: a ring of stones and two logs, flame on top. (x, y) is the base centre
function drawCamp(u,W,H,x,y,t,lit=true){const st=[[-11,-1],[-9,-4],[-4,-6],[2,-6],[7,-4],[9,-1],[-7,1],[5,1],[-1,2]];
  for(const [dx,dy] of st){const sx=Math.round(x+dx),sy=Math.round(y+dy);rect(u,W,H,sx,sy,3,2,C.S2);rect(u,W,H,sx,sy,3,1,C.S3);rect(u,W,H,sx,sy+2,3,1,C.S0);}
  rect(u,W,H,Math.round(x)-7,Math.round(y)-3,14,2,C.W1);rect(u,W,H,Math.round(x)-6,Math.round(y)-4,12,1,C.W2);rect(u,W,H,Math.round(x)-3,Math.round(y)-5,6,1,C.C2);
  if(lit)flame(u,W,H,'camp',t,x,y-1);}

// ======================================================================
// D1 the smoke field drawn through 2x2 clusters
// ======================================================================
// report §6a, smoke field rows: [cell px, field w x h, advect Uint8 desktop / throttle, draw plumes desktop / throttle]
const SMK6={4:['160x90','0.035','0.214','0.158','1.04'],8:['80x45','0.0095','0.060','0.099','0.606'],16:['40x23','0.0028','0.018','0.115','0.757']};
reg('smokecluster',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=96,u=X.u32,ro=$('[data-ro]',root);
  // two burning tiles on the bottom row, charred under the flames
  const BURN=[[1,2],[2,2]],TG=mkTileGround(W,H,4,(tx,ty)=>BURN.some(b=>b[0]===tx&&b[1]===ty)?'burnt':'grass'),G=TG.g;
  const SPOTS=[];for(const [tx,ty] of BURN)for(let k=0;k<3;k++)SPOTS.push([tx*32+7+k*9+((hash2(tx,k)*4)|0),ty*32+20+((hash2(k,tx+3)*9)|0),k]);SPOTS.sort((a,b)=>a[1]-b[1]);
  let cs=8,FW=0,FH=0,D=null,T=null,acc=0,t=0,mode='cl';const mS=mtr(.05),mD=mtr(.05);
  function setCS(v){cs=v;FW=Math.ceil(W/cs);FH=Math.ceil(H/cs);D=new Uint8Array(FW*FH);T=new Uint8Array(FW*FH);}
  setCS(8);c.seg('cs',v=>setCS(+v));c.seg('m',v=>{mode=v;});c.on('w',()=>{});
  const RW=new Float32Array(64),CW=new Float32Array(64);
  // one smoke tick at 30 Hz (the Sandbox's): emit, advect with per-row and per-column wobble tables, rise 26 px/s, wind 4 px/s per step, keep 50% per second, floor
  const KEEP=Math.round(256*Math.pow(.5,1/30));
  function step(dt,wind){const k=cs,rise=-26/k*dt,wx=wind*4/k*dt;
    for(let r=0;r<FH;r++)RW[r]=Math.sin(t*1.7+r*k*.09)*.35*dt*8;for(let q=0;q<FW;q++)CW[q]=Math.sin(t*1.3+q*k*.11)*.25*dt*8;
    // a burning tile emits into the cells over its top 16x16 px, the top 2x2 cells of 8 px, centred
    for(const [tx,ty] of BURN){const x0=Math.floor((tx*32+8)/k),y0=Math.floor(ty*32/k),n=Math.max(1,16/k);for(let yy=y0;yy<y0+n;yy++)for(let xx=x0;xx<x0+n;xx++){if(yy<FH&&xx<FW){const i=yy*FW+xx;D[i]=Math.min(255,D[i]+(hash2(xx+((t*20)|0),yy)*60+24));}}}
    for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){let sx=x-wx-RW[y],sy=y-rise-CW[x];if(sx<0)sx=0;if(sy<0)sy=0;if(sx>FW-1)sx=FW-1;if(sy>FH-1)sy=FH-1;
      const x0=sx|0,y0=sy|0,x1=Math.min(FW-1,x0+1),y1=Math.min(FH-1,y0+1),fx=sx-x0,fy=sy-y0;
      const v=(D[y0*FW+x0]*(1-fx)+D[y0*FW+x1]*fx)*(1-fy)+(D[y1*FW+x0]*(1-fx)+D[y1*FW+x1]*fx)*fy;let o=(v*KEEP)>>8;if(o<6)o=0;T[y*FW+x]=o;}
    const sw=D;D=T;T=sw;}
  // density at an art pixel, bilinear between cell centres
  const dens=(x,y)=>{const fx=(x+.5)/cs-.5,fy=(y+.5)/cs-.5,x0=clamp(Math.floor(fx),0,FW-1),y0=clamp(Math.floor(fy),0,FH-1),x1=Math.min(FW-1,x0+1),y1=Math.min(FH-1,y0+1),tx=clamp(fx-x0,0,1),ty=clamp(fy-y0,0,1);
    return (D[y0*FW+x0]*(1-tx)+D[y0*FW+x1]*tx)*(1-ty)+(D[y1*FW+x0]*(1-tx)+D[y1*FW+x1]*tx)*ty;};
  const ON=new Uint8Array(W*H);
  function draw(){u.set(G);for(const [x,y,k] of SPOTS)flame(u,W,H,'gl',t,x,y,k*2,k);ON.fill(0);let px=0;
    for(let cy=0;cy<FH;cy++){
      // skip empty spans: a band of cell rows with nothing in it draws nothing
      let any=false;for(let r=Math.max(0,cy-1);r<=Math.min(FH-1,cy+1)&&!any;r++)for(let q=0;q<FW;q++)if(D[r*FW+q]){any=true;break;}if(!any)continue;
      for(let y=cy*cs;y<Math.min(H,(cy+1)*cs);y++)for(let x=0;x<W;x++){let d,th,sx=x,sy=y;
        if(mode==='cl'){sx=x|1;sy=y|1;th=thr2(x,y);}else th=(bay(x,y)+.5)/16;
        // a slow drifting noise breaks the plume into lobes; light on the upper side, shade on the lower
        d=dens(sx,sy)*(.62+.7*vnoise(sx*.09+t*.2,sy*.09+t*.55));
        const cov=(d-26)/70;if(cov>th){const i=y*W+x,up=dens(sx,sy-4)-dens(sx,sy+4);ON[i]=1;u[i]=d>170&&up>-26?C.SM3:d<70||up<-60?C.SM1:C.SM2;px++;}}}
    return px;}
  const lone=()=>{let n=0;for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,v=ON[i];if(ON[i-1]!==v&&ON[i+1]!==v&&ON[i-W]!==v&&ON[i+W]!==v)n++;}return n;};
  function tick(dt){t+=dt;const wind=c.v('w');c.out('w',wind===0?'calm':(wind>0?'east ':'west ')+Math.abs(wind));acc+=dt;
    mS.a();let n=0;while(acc>=1/30&&n<3){step(1/30,wind);acc-=1/30;n++;}if(n)mS.b();
    mD.a();const px=draw();mD.b();X.put();const ln=lone(),R=SMK6[cs];
    setHud(root,`${cs} px cells · ${FW}x${FH}`);
    ro.innerHTML=`Field <b>${FW}x${FH}</b> cells of ${cs} px, ${nf(FW*FH)} bytes in one Uint8 channel. Each burning tile emits into the cells over its top 16x16 px. ${mode==='cl'?'Drawn through a <b>2x2 cluster</b> threshold, so every edge step is 2 px.':'Drawn through a <b>4x4 Bayer</b> per pixel, the VFX #6 way.'}`+
      `<br>Lone pixels now: <b>${nf(ln)}</b>, pixels whose four neighbours all differ from them, across ${nf(px)} smoke pixels.`+
      `<br>This browser, live: step <b>${f3(mS.v)} ms</b> per 30 Hz tick, draw ${f3(mD.v)} ms per frame for a 160x96 crop. Report, measured at 640x360 (desktop / 6x throttle): advect and decay ${R[1]} / ${R[2]} ms, plume draw with 2x2 clusters and empty spans skipped ${R[3]} / ${R[4]} ms.`+
      (cs===8?' At 8 px, Bayer 4 costs 0.283 / 1.70 ms and the cluster draw without skipping 0.273 / 1.68 ms.':'');}
  for(let k=0;k<60;k++)tick(.05);
  return {tick};});

// ======================================================================
// D2 hero puffs scaled by the tile
// [source, start px, end px, rise px/s, column tiles, puffs per second, tones, life note, which numbers are this figure's]
// ======================================================================
const PUFS={camp:{n:'Campfire',s0:[4,6],s1:[16,20],rise:12,col:[1,1.5],rate:2,t:'light',ill:''},
  chim:{n:'Chimney',s0:[8,10],s1:[32,46],rise:15,col:[2,3],rate:1/.6,t:'light',ill:''},
  tree:{n:'Burning tree',s0:[10,12],s1:[32,40],rise:17,col:[3,4],rate:1.4,t:'light',ill:'rise and rate'},
  house:{n:'Burning house',s0:[12,16],s1:[48,64],rise:20,col:[4,6],rate:3,t:'dark',ill:''},
  steam:{n:'Steam burst',s0:[6,8],s1:[10,12],rise:30,col:[0,0],rate:0,t:'steam',ill:'end size'}};
const PTONE={light:[C.SM3,C.SM2,C.SM1],dark:[C.SM2,C.SM1,C.SM0],steam:[C.ST1,C.ST0,C.A3]};
reg('puffs',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=208,u=X.u32,ro=$('[data-ro]',root),facts=$('[data-facts]',root);
  const G=mkGround(W,H,21,'grass'),EY=196,CAP=64;let src='chim',t=0,ps=[],acc=[0,0,0,0],refused=0,refWin=0,refRate=0,win=0,id=0,burstT=1;
  c.seg('s',v=>{src=v;ps=[];burstT=.3;});c.on('n',()=>{});c.btn('burst',()=>{burst();});
  const rr=(a)=>a[0]+Math.random()*(a[1]-a[0]);
  function add(x,y,P){if(ps.length>=CAP){refused++;return;}const col=rr(P.col);ps.push({x,y,s0:rr(P.s0),s1:rr(P.s1),rise:P.rise,life:P.rise?col*32/P.rise:.5+Math.random()*.5,t:0,vx:(Math.random()-.5)*3,tone:P.t,id:id++});}
  function burst(){const n=c.v('n'),P=PUFS.steam;for(let k=0;k<n;k++){const x=W*(k+.5)/n,cnt=8+((Math.random()*5)|0);for(let q=0;q<cnt;q++)setTimeout(()=>{if(src!=='steam')return;if(ps.length>=CAP){refused++;return;}ps.push({x:x+(Math.random()-.5)*12,y:EY-4+(Math.random()-.5)*6,s0:rr(P.s0),s1:rr(P.s1),rise:30,life:.5+Math.random()*.5,t:0,vx:(Math.random()-.5)*24,tone:'steam',id:id++});},Math.random()*300);}}
  // the sources: what sits under the column
  function drawSrc(x){const xi=Math.round(x);
    if(src==='camp')drawCamp(u,W,H,xi,EY+8,t);
    else if(src==='chim'){rect(u,W,H,xi-24,EY+2,48,10,C.R2);for(let k=0;k<48;k+=4)rect(u,W,H,xi-24+k,EY+2+((k>>2)&1),2,10,C.R1);rect(u,W,H,xi-24,EY+2,48,1,C.R3);rect(u,W,H,xi-5,EY-6,10,9,C.S2);rect(u,W,H,xi-5,EY-6,10,2,C.S3);rect(u,W,H,xi-4,EY-6,8,1,C.S0);box(u,W,H,xi-6,EY-7,12,11,C.OUTL);}
    else if(src==='tree'){rect(u,W,H,xi-2,EY+2,4,10,C.W1);for(let y=-14;y<6;y++)for(let dx=-15;dx<=15;dx++){const r=Math.hypot(dx/15,(y+4)/10);if(r<1+(vnoise((xi+dx)*.3,y*.3)-.5)*.3){const n=vnoise((xi+dx)>>1,(EY+y)>>1);rect(u,W,H,xi+dx,EY+y,1,1,n>.55?C.C3:n>.35?C.V0:C.C2);}}
      flame(u,W,H,'tree',t,xi-6,EY+2,0,0);flame(u,W,H,'tree',t,xi+7,EY+4,3,1);}
    else if(src==='house'){rect(u,W,H,xi-30,EY+2,60,12,C.R1);for(let k=0;k<60;k+=4)rect(u,W,H,xi-30+k,EY+2,1,12,C.R0);rect(u,W,H,xi-30,EY+2,60,1,C.C2);
      for(let k=0;k<3;k++)flame(u,W,H,'house',t,xi-18+k*18,EY+10,k*3,k);}
    else{for(let y=-3;y<4;y++)for(let dx=-12;dx<=12;dx++)if((dx*dx)/144+(y*y)/12<1)rect(u,W,H,xi+dx,EY+6+y,1,1,(dx+y*2)<-4?C.B3:C.B2);rect(u,W,H,xi-14,EY+10,6,2,C.C2);rect(u,W,H,xi+9,EY+9,5,2,C.C1);}}
  function tick(dt){t+=dt;const n=c.v('n'),P=PUFS[src];c.out('n',n);
    if(src==='steam'){burstT-=dt;if(burstT<=0){burst();burstT=2.4;}}
    else for(let k=0;k<n;k++){acc[k]+=dt*P.rate;while(acc[k]>=1){acc[k]-=1;add(W*(k+.5)/n+(Math.random()-.5)*4,EY-(src==='house'?14:src==='tree'?16:src==='camp'?22:6),P);}}
    for(let k=ps.length-1;k>=0;k--){const p=ps[k];p.t+=dt;if(p.t>=p.life){ps[k]=ps[ps.length-1];ps.pop();continue;}p.y-=p.rise*dt;p.x+=p.vx*dt;p.vx*=Math.pow(.97,dt*60);}
    win+=dt;if(win>=1){refRate=(refused-refWin)/win;refWin=refused;win=0;}
    u.set(G);for(let k=0;k<n;k++)drawSrc(W*(k+.5)/n);
    // the column ruler: one mark per tile above the source, the table's column band in amber
    const top=EY-14;for(let k=0;k<=6;k++){const y=top-32*k;if(y<0)break;rect(u,W,H,0,y,k?4:6,1,C.OUTL);if(k)digits(u,W,H,6,y-2,String(k),C.OUTL);}
    if(P.col[1]>0){const y1=top-32*P.col[1],y0=top-32*P.col[0];rect(u,W,H,1,Math.max(0,Math.round(y1)),2,Math.round(y0-y1),C.LAMP);}
    const ord=ps.slice().sort((a,b)=>a.id-b.id);for(const p of ord){const f=p.t/p.life,s=p.s0+(p.s1-p.s0)*f;drawPuff(u,W,H,p.x,p.y,Math.round(s),PTONE[p.tone],f>.6?(f-.6)/.4:0,p.id);}
    X.put();setHud(root,`${ps.length} of ${CAP} puffs`);
    const life=P.col[1]?`${(P.col[0]*32/P.rise).toFixed(1)} to ${(P.col[1]*32/P.rise).toFixed(1)} s`:'0.5 to 1 s';
    facts.innerHTML=`<dt>Source</dt><dd>${P.n}</dd><dt>Start size</dt><dd>${P.s0[0]} to ${P.s0[1]} px</dd><dt>End size</dt><dd${P.ill.includes('end')?' class="illu2"':''}>${P.s1[0]} to ${P.s1[1]} px${P.ill.includes('end')?', this figure\'s':''}</dd>`+
      `<dt>Rise</dt><dd${P.ill.includes('rise')?' class="illu2"':''}>${P.rise} px/s${P.ill.includes('rise')?', the Sandbox\'s':''}</dd><dt>Column</dt><dd>${P.col[1]?`${P.col[0]} to ${P.col[1]} tiles, ${Math.round(P.col[0]/11.25*100)} to ${Math.round(P.col[1]/11.25*100)}% of the screen height`:'none, a burst'}</dd>`+
      `<dt>Rate</dt><dd${P.ill.includes('rate')?' class="illu2"':''}>${src==='steam'?'8 to 12 puffs in 0.3 s':src==='chim'?'one every 600 ms':src==='house'?'2 to 4 per second, 3 here':P.rate+' per second'}${P.ill.includes('rate')?', the Sandbox\'s':''}</dd><dt>Life</dt><dd>${life}, column over rise</dd>`;
    ro.innerHTML=`Alive <b>${ps.length}</b> of a cap of ${CAP}. Refused at the cap: <b>${refRate.toFixed(1)}</b> per second. ${src==='house'&&n>=3?'Three burning houses already reach the cap, which is why wildfire smoke lives in the field.':'Add sources to reach the cap.'}`+
      `<br>Report, arithmetic: 64 small quads per frame. 240 burning tiles throwing puffs would keep about 580 alive.`;}
  for(let k=0;k<120;k++)tick(.05);
  return {tick};});

// ======================================================================
// D3 embers and sparks at 2x2 px against 1 px only
// ======================================================================
const EMS={torch:{n:'Torch on a post',a:[1,3],f:'torch'},camp:{n:'Campfire',a:[4,8],f:'camp'},bon:{n:'Bonfire',a:[10,20],f:'bon'},house:{n:'Burning house',a:[20,40],f:'house'}};
reg('embers',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=96,u=X.u32,ro=$('[data-ro]',root);
  const G0=mkGround(W,H,33,'grass'),G=new Uint32Array(W*H),A=mkEm(512),B=mkEm(256),mL=mtr(.05);let src='bon',t=0,fr=0;
  c.seg('s',v=>{src=v;A.clear();B.clear();});
  // night ground lit by each fire through a 2x2 cluster band
  const FX=[40,120],FY=74;
  function light(){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const fx=x<80?FX[0]:FX[1],d=Math.hypot(x-fx,(y-FY+6)*1.25);G[y*W+x]=ver(G0[y*W+x],'night',band(d,x,y,58,30));}}
  light();
  function fire(x){if(src==='torch'){rect(u,W,H,x-1,FY-14,3,16,C.W1);rect(u,W,H,x-1,FY-14,1,16,C.W3);rect(u,W,H,x-3,FY-16,7,3,C.S1);flame(u,W,H,'torch',t,x,FY-16);return FY-26;}
    if(src==='camp'){drawCamp(u,W,H,x,FY+2,t);return FY-20;}
    if(src==='bon'){drawCamp(u,W,H,x-6,FY+3,t);flame(u,W,H,'house',t,x+3,FY+1,3,1);flame(u,W,H,'camp',t,x+8,FY+4,4);return FY-28;}
    rect(u,W,H,x-30,FY-6,60,10,C.R1);rect(u,W,H,x-30,FY-6,60,1,C.C2);for(let k=0;k<3;k++)flame(u,W,H,'house',t,x-18+k*18,FY+2,k*3,k);return FY-28;}
  function feed(E,x,top,one,dt){const S=EMS[src],want=(S.a[0]+S.a[1])/2,alive=E.count(),spread=src==='house'?50:src==='bon'?18:src==='camp'?12:5;
    // embers live 0.5 to 1.5 s, so the spawn rate that holds the count is about the count per second
    let r=want*dt*1.1;if(alive<S.a[0])r+=.3;while(r>0){if(Math.random()<r){E.spawn(x+(Math.random()-.5)*spread,top+Math.random()*10,(Math.random()-.5)*24,-30-Math.random()*36,.5+Math.random(),0);}r-=1;}
    // sparks: 1 px, the two hottest tones, 3 to 8 frames
    if(Math.random()<dt*want*.8)E.spawn(x+(Math.random()-.5)*spread,top+6,(Math.random()-.5)*70,-50-Math.random()*70,(3+Math.random()*5)/60,1);}
  function tick(dt){t+=dt;fr++;u.set(G);
    for(let y=4;y<H-4;y+=4)u[y*W+80]=C.SM1;
    const t0=fire(FX[0]),t1=fire(FX[1]);
    mL.a();feed(A,FX[0],t0,false,dt);feed(B,FX[1],t1,true,dt);A.step(dt,0);B.step(dt,0);drawEm(u,W,H,A,false,fr);drawEm(u,W,H,B,true,fr);mL.b();
    X.put();const S=EMS[src];setHud(root,`${S.n}`);
    ro.innerHTML=`Left, the 32 px rule: embers <b>2x2</b> coloured by age, sparks 1 px for 3 to 8 frames. ${A.count()} alive, pool use ${A.count()} of 512. Right, the VFX #6 look: every ember <b>1 px</b>, pool of 256, ${B.count()} alive.`+
      `<br>Alive near a ${S.n.toLowerCase()} in the report: ${S.a[0]} to ${S.a[1]}. Embers move in whole pixels, and a 2x2 ember loses its top half on every other frame.`+
      `<br>This browser, live: update and draw of both pools <b>${f3(mL.v)} ms</b>. Report, measured: about 7 ns per particle. 256 cost 0.0019 / 0.012 ms, 512 cost 0.0033 / 0.021 ms and 4,096 cost 0.030 / 0.196 ms (desktop / 6x throttle).`;}
  return {tick};});

// ======================================================================
// E1 and E5 a 24x32 character catching fire
// ======================================================================
// Tibia's CONST_ME_HITBYFIRE: 9 frames of 100 ms, about 42x40 px, flame licks around the body (the Sandbox's drawing)
let HBFc=null;
const HBF=()=>HBFc||(HBFc=(()=>{const out=[];for(let k=0;k<9;k++){const a=new Uint32Array(42*40);for(let y=0;y<40;y++)for(let x=0;x<42;x++){const dx=(x-20.5)/18,dy=(y-24)/15,r=Math.hypot(dx,dy),n=vnoise(x/3+k*1.7,y/3-k*1.3),ring=Math.abs(r-(.45+k*.06));let c=0;
  if(ring<.16+n*.12&&n>.35+k*.04&&y<36){c=k<3?C.F4:k<6?C.F3:C.F2;if(n>.7)c=k<5?C.F5:C.F3;if(ring>.14)c=C.F1;}a[y*42+x]=c;}
  for(let y=1;y<39;y++)for(let x=1;x<41;x++){const i=y*42+x;if(a[i]&&!a[i-1]&&!a[i+1]&&!a[i-42]&&!a[i+42])a[i]=0;}out.push(a);}return out;})());
function blitU(u,W,H,a,w,h,x0,y0){for(let y=0;y<h;y++){const yy=y0+y;if(yy<0||yy>=H)continue;for(let x=0;x<w;x++){const c=a[y*w+x];if(!c)continue;const xx=x0+x;if(xx>=0&&xx<W)u[yy*W+xx]=c;}}}
const PARTS=['tint','fl','head','emb','puff','flash','num','hit'];
reg('burnchar',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=128,H=96,u=X.u32,ro=$('[data-ro]',root);
  const G=mkGround(W,H,8,'grass'),E=mkEm(64),FX=64,FY=86;let t=0,next=.6,nTick=0,nums=[],hits=[],flash=0,puffs=[],pAcc=0,eAcc=0,field=-1,pend=[];
  const on=k=>c.v(k);PARTS.forEach(k=>c.on(k,()=>{}));
  const MODES={ast:{tint:1,fl:1,head:1,emb:1,puff:1,flash:1,num:1,hit:0},tib:{tint:0,fl:0,head:0,emb:0,puff:0,flash:0,num:1,hit:1}};
  c.seg('m',v=>{for(const k of PARTS)c.el(k).checked=!!MODES[v][k];E.clear();puffs=[];});
  c.btn('field',()=>{field=next+.2;});c.on('walk',()=>{});
  // one damage event: a number that merges into one under 400 ms old, a white flash, a hit effect
  function dmg(v){const last=nums[nums.length-1];if(last&&t-last.t0<.4)last.v+=v;else nums.push({t0:t,v});if(on('flash'))flash=.05;if(on('hit'))hits.push(t);}
  function tick(dt){t+=dt;const walk=c.v('walk'),fr=walk?(Math.floor(t*10)&3):4;
    next-=dt;if(next<=0){next+=1;nTick++;dmg(10);}
    if(field>=0){field-=dt;if(field<0){dmg(20);field=-1;}}
    for(let k=nums.length-1;k>=0;k--)if(t-nums[k].t0>=1)nums.splice(k,1);
    for(let k=hits.length-1;k>=0;k--)if(t-hits[k]>=.9)hits.splice(k,1);
    if(flash>0)flash-=dt;
    // embers 6 to 8 per second over the body, one 4x4 puff every 0.5 s rising 0.5 px per frame for 1 s
    if(on('emb')){eAcc+=dt*7;while(eAcc>=1){eAcc-=1;E.spawn(FX-8+Math.random()*16,FY-26+Math.random()*18,(Math.random()-.5)*14,-26-Math.random()*20,.5+Math.random(),0);}}
    if(on('puff')){pAcc+=dt;if(pAcc>=.5){pAcc-=.5;puffs.push({x:FX-2+Math.random()*4,y:FY-32,t:0,id:nTick*3+puffs.length});}}
    for(let k=puffs.length-1;k>=0;k--){const p=puffs[k];p.t+=dt;p.y-=30*dt;if(p.t>=1)puffs.splice(k,1);}
    E.step(dt,0);
    u.set(G);shadowEll(u,W,H,FX,FY-1,8,2);
    drawCh(u,W,H,0,0,fr,FX,FY,{v:on('tint')?3:0,flash:flash>0});
    const evenTick=(nTick&1)===0;let draws=1;
    if(on('fl')){flame(u,W,H,'st',t,FX-5,FY-17,0);flame(u,W,H,'st',t,FX+4,FY-8,2);draws+=2;}
    if(on('head')&&evenTick){flame(u,W,H,'sth',t,FX+1,FY-26,1);draws++;}
    drawEm(u,W,H,E,false,Math.floor(t*60));draws+=E.count();
    for(const p of puffs){drawPuff(u,W,H,p.x,p.y,4,PTONE.dark,p.t>.65?(p.t-.65)/.35:0,p.id);draws++;}
    for(const h of hits){blitU(u,W,H,HBF()[Math.min(8,((t-h)/.1)|0)],42,40,FX-21,FY-34);draws++;}
    if(on('num'))for(const n of nums){const a=t-n.t0;drawNum(u,W,H,FX,FY-62+8-48*a,n.v,C.ORNG,a<.833?1:Math.max(0,(1-a)/.167));draws++;}
    X.put();setHud(root,`next tick in ${next.toFixed(1)} s`);
    ro.innerHTML=`Burn tick every <b>1 s</b> here, 10 damage. ${nums.length?`Numbers on screen: ${nums.map(n=>n.v).join(', ')}.`:''} ${field>=0?'A field hit lands 200 ms after the next tick and merges into its number.':''}`+
      `<br>Draws this frame: <b>${draws}</b>. The report counts about 10 per burning character, so twenty burning players make about 200 sprites.`+
      `<br>Text: 11 px tall, rises 48 px in 1,000 ms from 8 px down, fades from 833 ms, merges within 400 ms. Flash: 50 ms of white per tick.`;}
  return {tick};});

// ======================================================================
// E2 a carried torch through the 4-frame walk
// ======================================================================
const DIRN=['south','north','east','west'];
reg('torchwalk',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=128,H=48,u=X.u32,ro=$('[data-ro]',root),play=$('[data-b="play"]',root),fspans=$$('[data-frs] span',root);
  follow(cv.parentElement,$('[data-dirs]',root));follow(cv.parentElement,$('[data-frs]',root));
  const G=mkGround(W,H,15,'grass'),ORDER=[0,2,1,3];let t=0,f=0,wt=0,playing=true;
  c.btn('play',()=>{playing=!playing;play.textContent=playing?'Pause the walk':'Play the walk';play.setAttribute('aria-pressed',String(!playing));});
  c.btn('step',()=>{if(playing){playing=false;play.textContent='Play the walk';play.setAttribute('aria-pressed','true');}f=(f+1)&3;});
  c.on('lean',()=>{});
  function tick(dt){t+=dt;if(playing){wt+=dt;if(wt>=.1){wt-=.1;f=(f+1)&3;}}
    u.set(G);for(let k=1;k<4;k++)for(let y=2;y<H;y+=4)u[y*W+k*32]=mixc(u[y*W+k*32],C.OUTL,.35);
    for(let k=0;k<4;k++){const d=ORDER[k],x=16+32*k,y=44,lean=playing&&c.v('lean')?(d===2?-1:d===3?1:0):0;
      shadowEll(u,W,H,x,y-1,7,2);
      if(!torchAfter(d))drawTorch(u,W,H,0,d,f,x,y,t,k,lean);
      drawCh(u,W,H,0,d,f,x,y);
      if(torchAfter(d))drawTorch(u,W,H,0,d,f,x,y,t,k,lean);}
    X.put();fspans.forEach((e,q)=>e.classList.toggle('on',q===f));
    const flameF=Math.floor(t*10)%4,o=HOFF_S[f],ox=HOFF_X[f];
    setHud(root,`walk frame ${f} · flame frame ${flameF}`);
    ro.innerHTML=`Walk frame <b>${f}</b> of 0 to 3, ${f===0||f===2?'a contact frame':'a passing frame, body 1 px up'}. Hand offset facing south <b>(${o[0]>0?'+':''}${o[0]}, ${o[1]})</b>, facing east or west (${ox[0]>0?'+':''}${ox[0]}, ${ox[1]}) along x.`+
      `<br>Flame frame ${flameF} of a 4-frame loop of 100 ms on its own clock, so pausing or stepping the walk does not restart it. ${playing&&c.v('lean')?'Walking: the top 2 flame rows lean 1 px against the walk facing east and west.':'Standing: no lean.'}`+
      `<br>Draw order: in front of the body in every facing but north, as the Sandbox draws it. Side view: 4 px forward, stick tilted 6 px. Cost: one sprite and one light entry per carrier, plus a rim uniform pair.`;}
  return {tick};});

// ======================================================================
// E3 the warm rim light and the fire shadow, ported from the §7 shader
// ======================================================================
const DX8=[1,1,0,-1,-1,-1,0,1],DY8=[0,1,1,1,0,-1,-1,-1],D8N=['east','south-east','south','south-west','west','north-west','north','north-east'];
reg('rimlight',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=96,u=X.u32,ro=$('[data-ro]',root);
  const G=mkGround(W,H,27,'grass'),CX=58,CY=70,M=new Uint32Array(W*H);let fx=118,fy=74,t=0,ang=0,cols=0,colT=0,lastRim=[0,0];
  pointer(cv,(p,type)=>{if(type==='down'||type==='drag'){fx=clamp(Math.round(p[0]),10,W-10);fy=clamp(Math.round(p[1])+10,30,H-3);c.el('orb').checked=false;}});
  ['orb','rings'].forEach(k=>c.on(k,()=>{}));c.seg('m',()=>{});
  function tick(dt){t+=dt;if(c.v('orb')){ang+=dt*.32;fx=Math.round(CX+Math.cos(ang)*64);fy=Math.round(CY-2+Math.sin(ang)*26);}
    const glow=c.segv('m')==='add';
    // the script's side: nearest fire, distance in tiles, direction quantized to 8, tones by distance, none behind the fire
    const dx=fx-CX,dy=(fy-6)-(CY-14),d=Math.hypot(dx,dy)/32,behind=dy>12&&Math.abs(dx)<Math.abs(dy);
    const q=((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8,tones=behind?0:d<=1.5?2:d<=3?1:0;
    // ground: palette mode lights it through the 3 px band, additive mode adds orange to every channel
    const k=(x,y)=>{const e=Math.hypot(x-fx,(y-fy+6)*1.2)/128;return e<1?(1-e)*(1-e)*.62:0;};
    const add=(col,x,y)=>{const a=k(x,y);return a>0?rgb(cR(col)+255*a,cG(col)+130*a,cB(col)+40*a):col;};
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,g=G[i];if(glow)u[i]=add(ver(g,'dusk',0),x,y);else u[i]=ver(g,'dusk',band(Math.hypot(x-fx,(y-fy+6)*1.2),x,y,96,48));}
    charShadows(u,W,H,CX,CY,M,dx,dy,d);
    if(c.v('rings')){const msk=(x,y)=>((x+y)&1)===0;ringAt(u,W,H,fx,fy-6,48,C.LAMP,1,msk);ringAt(u,W,H,fx,fy-6,96,C.F3,1,msk);}
    const back=fy<CY;if(back)drawCamp(u,W,H,fx,fy,t);
    lastRim=drawCh(u,W,H,0,0,4,CX,CY,glow?{tod:'dusk',glow:add}:{tod:'dusk',rim:[DX8[q],DY8[q],tones]});
    if(!back)drawCamp(u,W,H,fx,fy,t);
    X.put();colT-=dt;if(colT<=0){colT=.5;const s=new Set();for(let i=0;i<u.length;i++)s.add(u[i]);cols=s.size;}
    setHud(root,glow?'additive glow':`rim tones ${tones}`);
    ro.innerHTML=glow?`Additive glow: orange added to every channel near the fire, on the ground and the character alike. <b>${cols}</b> distinct colours in this frame, most of them in no palette. No rim, so the character does not turn toward the fire.`:
      `Fire <b>${d.toFixed(1)} tiles</b> away to the ${D8N[q]}, step (${DX8[q]}, ${DY8[q]}). ${behind?'The character stands north of the fire, behind it, so <b>no rim</b>.':tones===2?'Within 1.5 tiles: <b>rim and inner rim</b>.':tones===1?'Within 3 tiles: <b>rim only</b>.':'Beyond 3 tiles: <b>no rim</b>.'} Rim pixels ${lastRim[0]}, inner ${lastRim[1]}. ${cols} distinct colours in this frame, every one a palette entry.`+
      `<br>${d<4?'Fire shadow on, turned away from the fire.':'Fire shadow off beyond 4 tiles.'} Cost, not measured: two extra texture taps per fragment on 768 pixels per character.`;}
  return {tick};});

// ======================================================================
// tile walkers on a small grid, with BFS that refuses blocked tiles (sootwalk, crowd)
// ======================================================================
const TDX=[0,0,1,-1],TDY=[1,-1,0,0];
function bfs(TW,TH,from,to,blocked){if(from===to)return [];const prev=new Int16Array(TW*TH).fill(-1),q=[from];prev[from]=from;
  while(q.length){const c=q.shift();if(c===to)break;const x=c%TW,y=(c/TW)|0;for(let d=0;d<4;d++){const nx=x+TDX[d],ny=y+TDY[d];if(nx<0||ny<0||nx>=TW||ny>=TH)continue;const n=ny*TW+nx;if(prev[n]>=0||blocked(n))continue;prev[n]=c;q.push(n);}}
  if(prev[to]<0)return null;const path=[];for(let c=to;c!==from;c=prev[c])path.unshift(c);return path;}
const dirOf=(a,b,TW)=>{const dx=b%TW-a%TW,dy=((b/TW)|0)-((a/TW)|0);return dy>0?0:dy<0?1:dx>0?2:3;};

// ======================================================================
// E4 fields as terrain, soot prints and ash puffs
// ======================================================================
const SMAP=['GAAGG','GAFFG','GGFGG'];
reg('sootwalk',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=96,TW=5,TH=3,u=X.u32,ro=$('[data-ro]',root);
  const kind=(tx,ty)=>{const k=SMAP[clamp(ty,0,2)][clamp(tx,0,4)];return k==='A'?'ash':k==='F'?'burnt':'grass';};
  const G=mkTileGround(W,H,6,kind).g,isF=t=>SMAP[(t/TW)|0][t%TW]==='F',isA=t=>SMAP[(t/TW)|0][t%TW]==='A';
  const E=mkEm(64),prints=[],nums=[],M=new Uint8Array(W*H);
  const w={t:10,next:-1,p:0,dir:0,path:[],manual:false,soot:0,idle:0,trips:0,flare:-1,fx:0,hp:0};let t=0,msg='',lastC=-1;
  const tcx=t=>(t%TW)*32+16,tcy=t=>((t/TW)|0)*32+27;
  function go(to){const p=bfs(TW,TH,w.next>=0?w.next:w.t,to,isF);if(p===null){msg='Pathfinding refuses that route.';return;}if(w.next<0){w.path=p;}else w.path=p;w.manual=false;msg=p.length?`Pathfinding: ${p.length} tiles, around the fire fields.`:msg;}
  function stepIn(){if(w.next>=0||isF(w.t))return;const x=w.t%TW,y=(w.t/TW)|0;for(let d=0;d<4;d++){const nx=x+TDX[d],ny=y+TDY[d];if(nx<0||ny<0||nx>=TW||ny>=TH)continue;const n=ny*TW+nx;if(isF(n)){w.path=[n];w.manual=true;msg='A manual step goes into the field.';return;}}
    // not beside a field: walk next to one first
    const p=bfs(TW,TH,w.t,6,isF);if(p){w.path=p;w.after=true;msg='Walking beside a field first.';}}
  pointer(cv,(p,type)=>{if(type!=='down')return;const tx=clamp(p[0]>>5,0,TW-1),ty=clamp(p[1]>>5,0,TH-1),n=ty*TW+tx;w.idle=-6;if(isF(n)){msg='Pathfinding refuses a field tile. Use the button to step in by hand.';return;}go(n);});
  c.btn('in',()=>{w.idle=-6;stepIn();});c.seg('pr',()=>{});
  function stamp(f){if(w.soot<=0)return;const vert=w.dir<2,big=c.segv('pr')==='46',pw=vert?(big?4:3):(big?6:5),ph=vert?(big?6:5):(big?4:3);
    const x=Math.round(w.x),y=Math.round(w.y),side=f===0?-1:1,px=vert?x+(side<0?-5:2):x-(pw>>1),py=vert?y-ph:y-ph-(side<0?3:-1);prints.push({x:px,y:py,w:pw,h:ph,t:0});}
  function contact(f){const on=w.next>=0&&(w.p<.5?w.t:w.next);if(isA(on))for(let k=0;k<2;k++)E.spawn(w.x+(Math.random()-.5)*8,w.y-1,(Math.random()-.5)*6,-13,.3,2);stamp(f);}
  function tick(dt){t+=dt;
    if(w.next<0){if(w.path.length){w.next=w.path.shift();w.dir=dirOf(w.t,w.next,TW);w.p=0;contact(0);}else{w.idle+=dt;if(w.after){w.after=false;stepIn();}
      else if(w.idle>1.2){w.idle=0;w.trips++;if(w.trips%4===0)stepIn();else{let n;do n=(Math.random()*15)|0;while(isF(n)||n===w.t);go(n);}}}}
    if(w.next>=0){const o=w.p;w.p+=dt/.4;if(o<.5&&w.p>=.5)contact(2);
      if(w.p>=1){const from=w.t;w.t=w.next;w.next=-1;w.p=0;if(isF(w.t)){nums.push({t0:t,v:20});w.flare=t;w.fx=tcx(w.t);for(let k=0;k<4;k++)E.spawn(tcx(w.t)+(Math.random()-.5)*10,tcy(w.t)-2,(Math.random()-.5)*30,-30-Math.random()*20,.5+Math.random()*.5,0);
          w.path=[from];w.manual=true;msg='Stepped in by hand: 20 damage, a flare under the feet and 4 embers. Stepping back out.';}
        if(isA(from)||(isF(from)))w.soot=3;else if(w.soot>0)w.soot--;}}
    const a=w.t,b=w.next>=0?w.next:w.t,k=w.next>=0?w.p:0;w.x=lerp(tcx(a),tcx(b),k);w.y=lerp(tcy(a),tcy(b),k);const fr=w.next>=0?Math.min(3,(w.p*4)|0):4;
    for(let i=prints.length-1;i>=0;i--){prints[i].t+=dt;if(prints[i].t>=10)prints.splice(i,1);}
    for(let i=nums.length-1;i>=0;i--)if(t-nums[i].t0>=1)nums.splice(i,1);
    E.step(dt,0);u.set(G);
    // soot prints: the ground two shades darker, corners cut, fading in 2x2 chunks over their last 3 s
    for(const p of prints){const fade=p.t>7?(p.t-7)/3:0;for(let yy=0;yy<p.h;yy++)for(let xx=0;xx<p.w;xx++){if((xx===0||xx===p.w-1)&&(yy===0||yy===p.h-1))continue;const x=p.x+xx,y=p.y+yy;if(x<0||y<0||x>=W||y>=H)continue;if(fade&&hash2(x>>1,(y>>1)+((p.x*7)|0))<fade)continue;const i=y*W+x;u[i]=dark(dark(u[i]));}}
    // fields and the walker, y-sorted
    const ents=[];for(let n=0;n<15;n++)if(isF(n))ents.push({y:tcy(n)+3,f:()=>flame(u,W,H,'fC',t,tcx(n),tcy(n)+3,n*2,n)});
    ents.push({y:w.y,f:()=>{shadowEll(u,W,H,Math.round(w.x),Math.round(w.y)-3,7,2);drawCh(u,W,H,0,w.dir,fr,w.x,w.y,{flash:t-w.flare<.05});}});
    ents.sort((p,q)=>p.y-q.y).forEach(e=>e.f());
    if(w.flare>=0&&t-w.flare<.3){const k=Math.min(2,((t-w.flare)/.1)|0),fx=Math.round(w.x),fy=Math.round(w.y),hw=4+k*2,hh=2+k;for(let y=-hh;y<=hh;y++)for(let x=-hw;x<hw;x++)if((x*x)/(hw*hw)+(y*y)/(hh*hh)<1)rect(u,W,H,fx+x,fy-2+y,1,1,k===2?C.F2:Math.abs(y)<hh-1&&Math.abs(x)<hw-2?C.F5:C.F3);}
    drawEm(u,W,H,E,false,Math.floor(t*60));
    for(const n of nums){const a=t-n.t0;drawNum(u,W,H,w.x,w.y-46-48*a,n.v,C.ORNG,a<.833?1:Math.max(0,(1-a)/.167));}
    X.put();setHud(root,w.soot>0?`soot for ${w.soot} more tile${w.soot>1?'s':''}`:'clean boots');
    ro.innerHTML=`${msg||'Click a tile to walk there. Pathfinding goes around the three field tiles.'}`+
      `<br>Prints alive: <b>${prints.length}</b>, 2 per tile, ${c.segv('pr')==='46'?'4x6 px as VFX #11 drew them':'3x5 px as note 13 and the Sandbox have them'}, fading over 10 s. Soot for the 3 tiles after an ash, charred or field tile. Ash puffs rise from contact frames 0 and 2 over ash.`+
      `<br>Cost: one sprite and 4 particles per step. A print is one byte per print cell in a decal field and no network data.`;}
  return {tick};});

// ======================================================================
// E6 the crowd budget
// ======================================================================
reg('crowd',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=320,H=180,TW=10,TH=5,OY=12,u=X.u32,ro=$('[data-ro]',root),items=$$('[data-drop] li',root),rng=mkRng(9);
  const CT=2*TW+5,CFX=5*32+16,CFY=OY+2*32+28;
  const G=mkTileGround(W,H,12,(tx,ty)=>(ty===2||tx===5)?'stone':'grass').g,E=mkEm(512),mF=mtr(.06),mL=mtr(.06),Mk=new Uint32Array(W*H);
  const ws=[];for(let k=0;k<50;k++){let t0;do t0=(rng()*TW*TH)|0;while(t0===CT);ws.push({t:t0,n:-1,p:rng(),dir:0,set:k===0?0:1+(k%6),eA:0,nums:[],flash:0});}
  let t=0,tickN=0,tAcc=0,LW=0,LH=0,LM=null,lastHash=-1,rebuilds=0,rbWin=0,rbRate=0,win=0,checks=0,cs=8;
  c.seg('cs',v=>{cs=+v;lastHash=-1;});['n','b','drop'].forEach(k=>c.on(k,()=>{}));
  function build(src){LW=Math.ceil(W/cs);LH=Math.ceil(H/cs);if(!LM||LM.length!==LW*LH)LM=new Float32Array(LW*LH);LM.fill(0);checks=0;
    for(const s of src){const r=s[2];for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){checks++;const d=Math.hypot((x+.5)*cs-s[0],(y+.5)*cs-s[1])/32,v=(r-d)*.2;if(v>LM[y*LW+x])LM[y*LW+x]=v>1?1:v;}}}
  const Lat=(x,y)=>{const fx=x/cs-.5,fy=y/cs-.5,x0=clamp(Math.floor(fx),0,LW-1),y0=clamp(Math.floor(fy),0,LH-1),x1=Math.min(LW-1,x0+1),y1=Math.min(LH-1,y0+1),a=clamp(fx-x0,0,1),b=clamp(fy-y0,0,1);
    return (LM[y0*LW+x0]*(1-a)+LM[y0*LW+x1]*a)*(1-b)+(LM[y1*LW+x0]*(1-a)+LM[y1*LW+x1]*a)*b;};
  const lvl=(x,y)=>{const j=Lat(x,y)+(thr2(x,y)-.5)*.06;return j>.62?2:j>.3?1:0;};
  // night: unlit, the warm night version, and the warm dusk version for the brightest band
  const nv=(c,l)=>l===2?ver(c,'dusk',1):ver(c,'night',l?2:0);
  const tx=w=>(w.t%TW)*32+16,ty=w=>OY+((w.t/TW)|0)*32+26;
  function tick(dt){t+=dt;const t0=performance.now(),n=c.v('n'),nb=Math.min(c.v('b'),Math.max(0,n-1)),drop=c.v('drop');c.out('n',n);c.out('b',nb);c.out('drop',drop?'steps 1 to '+drop:'nothing dropped');items.forEach((e,q)=>e.classList.toggle('off',q<drop));
    tAcc+=dt;let dTick=false;if(tAcc>=1){tAcc-=1;tickN++;dTick=true;}
    const me=ws[0];
    for(let k=0;k<n;k++){const w=ws[k];if(w.n<0){const x=w.t%TW,y=(w.t/TW)|0,o=[];for(let d=0;d<4;d++){const nx=x+TDX[d],ny=y+TDY[d],q=ny*TW+nx;if(nx<0||ny<0||nx>=TW||ny>=TH||q===CT||(d^1)===w.dir)continue;o.push(d);}const d=o.includes(w.dir)&&rng()<.6?w.dir:o[(rng()*o.length)|0];w.dir=d;w.n=w.t+TDX[d]+TDY[d]*TW;}
      w.p+=dt/.4;if(w.p>=1){w.p-=1;w.t=w.n;w.n=-1;}
      const a=w.t,b=w.n>=0?w.n:w.t;w.x=lerp((a%TW)*32+16,(b%TW)*32+16,w.p);w.y=lerp(OY+((a/TW)|0)*32+26,OY+((b/TW)|0)*32+26,w.p);w.fr=Math.min(3,(w.p*4)|0);
      w.burn=k>=1&&k<=nb;w.far=Math.hypot(w.x-me.x,w.y-me.y)>6*32;
      if(w.burn&&dTick){const win2=drop>=4?.8:.4,l=w.nums[w.nums.length-1];if(l&&t-l.t0<win2)l.v+=10;else w.nums.push({t0:t,v:10});w.flash=.05;}
      for(let q=w.nums.length-1;q>=0;q--)if(t-w.nums[q].t0>=1)w.nums.splice(q,1);if(w.flash>0)w.flash-=dt;
      // embers: 1 to 3 alive per torch, 6 to 8 per second per burning character; dropped first for others more than 6 tiles away
      if(k===0||!(drop>=1&&w.far)){w.eA+=dt*(2+(w.burn?7:0));while(w.eA>=1){w.eA-=1;const h=w.burn&&Math.random()<.78;E.spawn(w.x+(h?(Math.random()-.5)*14:(w.dir===2?6:w.dir===3?-6:-3)),w.y-(h?8+Math.random()*16:26),(Math.random()-.5)*20,-26-Math.random()*24,.5+Math.random(),0);}}}
    E.step(dt,0);
    // the light map: one source per torch at the hand, radius 7 tiles (full to 2 tiles), plus the campfire. Rebuilt only when its inputs change
    const src=[[CFX,CFY-8,6]];for(let k=0;k<n;k++)src.push([ws[k].x,ws[k].y-22,7]);
    let h=cs*7919+n;for(const s of src)h=(Math.imul(h^((s[0]/cs)|0),16777619)^((s[1]/cs)|0))>>>0;
    if(h!==lastHash){lastHash=h;const l0=performance.now();build(src);mL.add(performance.now()-l0);rebuilds++;}
    win+=dt;if(win>=1){rbRate=(rebuilds-rbWin)/win;rbWin=rebuilds;win=0;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;u[i]=nv(G[i],lvl(x,y));}
    const ord=ws.slice(0,n).sort((a,b)=>a.y-b.y);let flames=0,draws=0,campDone=false;
    for(const w of ord){if(!campDone&&w.y>CFY){drawCamp(u,W,H,CFX,CFY,t);campDone=true;}const own=w===me,dx=CFX-w.x,dy=(CFY-6)-(w.y-14),d=Math.hypot(dx,dy)/32,behind=dy>12&&Math.abs(dx)<Math.abs(dy),q=((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;
      const rimOn=!behind&&d<=3&&(own||drop<3),tones=d<=1.5?2:1;
      charShadows(u,W,H,Math.round(w.x),Math.round(w.y),Mk,dx,dy,d);
      if(!torchAfter(w.dir))drawTorch(u,W,H,w.set,w.dir,w.fr,w.x,w.y,t,w.set);
      drawCh(u,W,H,w.set,w.dir,w.fr,w.x,w.y,{tod:'night',cv:w.burn?(v=>ver(v,'dusk',3)):((v,x,y)=>nv(v,lvl(x,y))),flash:w.flash>0,rim:rimOn?[DX8[q],DY8[q],tones]:null});
      if(torchAfter(w.dir))drawTorch(u,W,H,w.set,w.dir,w.fr,w.x,w.y,t,w.set);flames++;draws+=3;
      if(w.burn){flame(u,W,H,'st',t,w.x-5,w.y-17,0);flame(u,W,H,'st',t,w.x+4,w.y-8,2);flames+=2;draws+=2;if((tickN&1)===0&&(own||drop<2)){flame(u,W,H,'sth',t,w.x+1,w.y-26,1);flames++;draws++;}}}
    if(!campDone)drawCamp(u,W,H,CFX,CFY,t);
    drawEm(u,W,H,E,false,Math.floor(t*60));
    for(const w of ord)for(const m of w.nums){const a=t-m.t0;drawNum(u,W,H,w.x,w.y-54-48*a*.5,m.v,C.ORNG,a<.833?1:Math.max(0,(1-a)/.167));draws++;}
    X.put();mF.add(performance.now()-t0);const ea=E.count();draws+=ea;
    setHud(root,`${n} players · ${nb} burning`);
    ro.innerHTML=`Flames <b>${flames}</b>, lights <b>${n+1}</b> (one per carrier plus the campfire), embers alive <b>${ea}</b> of 512, about ${nf(draws)} draws. Light map ${LW}x${LH} cells of ${cs} px, ${nf(checks)} distance checks per rebuild, ${rbRate.toFixed(0)} rebuilds per second.`+
      `<br>This browser, live: the whole frame <b>${f3(mF.v)} ms</b>, of which the light map build ${f3(mL.v)} ms. Report, measured: an 8 px light map from 30 sources 0.021 / 0.142 ms, a per-tile map 0.0025 / 0.016 ms (desktop / 6x throttle).`+
      `<br>Report, arithmetic, for the whole view plus a margin (22 x 14 = 308 tiles): ${n} carriers make ${nf(n*308)} distance checks per rebuild and a 1,232-byte upload at one texel per tile. At 8 px cells the checks grow 16 times.`;}
  return {tick};});

// ======================================================================
// combat art (the Sandbox's): the 1-tile area effect, 14 frames of 40 ms then 13 x 60 ms in a 56 px canvas, and the missile
// ======================================================================
const FXW=56,FXF=14,FXMS=[40,60,60,60,60,60,60,60,60,60,60,60,60,60];
function genArea(vs){const fr=[];for(let k=0;k<FXF;k++){const a=new Uint32Array(FXW*FXW);
  for(let y=0;y<FXW;y++)for(let x=0;x<FXW;x++){const dx=x-27.5,dy=(y-36)*1.15,r=Math.hypot(dx,dy),bx=x>>1,by=y>>1,n=vnoise(bx/2.6+vs*9+k*.9,by/2.6-k*.55),up=Math.max(0,-dy);let c=0;
    if(k===0){if(r<9+n*3)c=r<5?C.WHITE:C.F5;}
    else if(k<4){const R=10+k*5+n*5;if(r<R){const q=r/R;c=q<.3?C.F5:q<.55?C.F4:q<.8?C.F3:q<.93?C.F2:C.F1;}}
    else if(k<9){const R=24+n*7-(k-4)*1.5,lift=(k-4)*2,q=Math.hypot(dx,dy+lift+up*.25)/R;if(q<1&&n>.18+(k-4)*.05){c=q<.25&&k<6?C.F4:q<.5?C.F3:q<.75?C.F2:q<.92?C.F1:C.F0;if(y>44&&q>.6)c=C.F0;}}
    else{const R=26+n*6,q=Math.hypot(dx,dy+(k-6)*4)/R;if(q<1&&n>.42+(k-9)*.07){c=n>.68?C.SM3:C.SM2;if(k<11&&n>.62&&q<.5)c=C.F1;}}
    a[y*FXW+x]=c;}
  for(let y=1;y<FXW-1;y++)for(let x=1;x<FXW-1;x++){const i=y*FXW+x;if(!a[i])continue;if(!a[i-1]&&!a[i+1]&&!a[i-FXW]&&!a[i+FXW])a[i]=0;}
  fr.push(a);}return fr;}
let AREAc=null;const AREA=()=>AREAc||(AREAc=[genArea(0),genArea(1),genArea(2)]);
// the frame of a timed effect at age ms, from a list of per-frame times. Returns -1 when it is over
function frameAt(ms,list){let i=0;while(i<list.length&&ms>=list[i]){ms-=list[i];i++;}return i<list.length?i:-1;}
// the explosion-rune effect: 12 frames of 50 ms and one of 100 ms, about 31x31 (this figure's drawing)
const EXMS=[50,50,50,50,50,50,50,50,50,50,50,50,100];
let EXc=null;const EXA=()=>EXc||(EXc=[0,1].map(vs=>EXMS.map((_,k)=>{const a=new Uint32Array(32*32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const dx=x-15.5,dy=y-17,r=Math.hypot(dx,dy),n=vnoise((x>>1)/2+vs*7+k,(y>>1)/2-k*.7);let c=0;
  if(k===0){if(r<6)c=C.WHITE;}else if(k<5){const R=6+k*2.6+n*3,q=r/R;if(q<1)c=q<.35?C.F5:q<.6?C.F4:q<.85?C.F3:C.F2;}
  else{const R=15+n*3,q=Math.hypot(dx,dy+(k-5)*1.5)/R;if(q<1&&n>.25+(k-5)*.07)c=k<8?(q<.5?C.F3:C.F1):(n>.6?C.SM3:C.SM2);}a[y*32+x]=c;}
  for(let y=1;y<31;y++)for(let x=1;x<31;x++){const i=y*32+x;if(a[i]&&!a[i-1]&&!a[i+1]&&!a[i-32]&&!a[i+32])a[i]=0;}return a;})));
// missile: one still 16x16 sprite per 8 directions, a round head and a tapering tail
let MISc=null;const MIS=()=>MISc||(MISc=[0,1,2,3,4,5,6,7].map(d=>{const a=new Uint32Array(256),an=d*Math.PI/4,ux=Math.cos(an),uy=Math.sin(an);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const px=x-7.5,py=y-7.5,al=px*ux+py*uy,pe=-px*uy+py*ux,rh=Math.hypot(px-ux*3,py-uy*3);let c=0;
    if(rh<3.6)c=rh<1.6?C.F5:rh<2.7?C.F4:C.F3;else if(al<3&&al>-7.5){const t=(3-al)/10.5,w=3.4*(1-t);if(Math.abs(pe)<w)c=t<.35?C.F3:t<.7?C.F2:C.F1;}a[y*16+x]=c;}
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=y*16+x;if(a[i])continue;if((x>0&&a[i-1]&&a[i-1]!==C.F0)||(x<15&&a[i+1]&&a[i+1]!==C.F0)||(y>0&&a[i-16]&&a[i-16]!==C.F0)||(y<15&&a[i+16]&&a[i+16]!==C.F0))a[i]=C.F0;}return a;}));

// ======================================================================
// F1 areas built from 1-tile effects
// ======================================================================
const SHAPES={gfb:{n:'Great fireball',k:'eff',t:(dx,dy)=>dx*dx+dy*dy<=10},exp:{n:'Explosion rune',k:'exp',t:(dx,dy)=>Math.abs(dx)+Math.abs(dy)<=1},
  bomb:{n:'Fire bomb',k:'fld',t:(dx,dy)=>Math.abs(dx)<=1&&Math.abs(dy)<=1},wall:{n:'Fire wall',k:'fld',t:(dx,dy)=>dy===0&&Math.abs(dx)<=2}};
reg('areas',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=224,H=224,N=7,u=X.u32,ro=$('[data-ro]',root);
  const G=mkGround(W,H,44,'grass'),effs=[],fields=[],SCT=new Float32Array(N*N).fill(-99);let t=0,auto=.2,idle=99,last={add:0,ref:0,del:0},cx0=3,cy0=3,rep=-1;
  c.seg('sh',()=>{effs.length=0;fields.length=0;SCT.fill(-99);});c.seg('st',()=>{});c.seg('va',()=>{});c.on('rep',()=>{});
  pointer(cv,(p,type)=>{if(type!=='down')return;cx0=clamp(p[0]>>5,0,N-1);cy0=clamp(p[1]>>5,0,N-1);idle=0;auto=2;cast();});
  function cast(){const S=SHAPES[c.segv('sh')],st=c.segv('st'),one=c.segv('va')==='one';last={add:0,ref:0,del:0,n:0};
    const id=S.k==='exp'?1:0,dur=S.k==='exp'?700:820,ph=S.k==='exp'?13:14,minAge=75*Math.max(ph/3,1);
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){if(!S.t(dx,dy))continue;const tx=cx0+dx,ty=cy0+dy;if(tx<0||ty<0||tx>=N||ty>=N)continue;last.n++;
      if(S.k==='fld'){fields.push({tx,ty,t0:t,v:one?0:(tx&1)+2*(ty&1)});last.add++;continue;}
      const ring=st==='ring'?Math.round(Math.hypot(dx,dy))*.075:st==='rnd'?Math.random()*.3:0;let start=t+ring;
      // Mehah's repeat rule: refuse while a copy on this tile is no older than 75 ms x max(phases / 3, 1); otherwise start a third of its duration later
      const old=effs.filter(e=>e.tx===tx&&e.ty===ty&&e.id===id&&e.t0<=start&&(start-e.t0)*1000<dur);
      if(old.length){const age=(start-old[old.length-1].t0)*1000;if(age<=minAge){last.ref++;continue;}start+=dur/3000;last.del++;}
      effs.push({tx,ty,id,t0:start,v:one?0:(tx+2*ty)%(id?2:3)});last.add++;}
    const r=c.v('rep');if(r>0)rep=t+r/1000;}
  function tick(dt){t+=dt;idle+=dt;const r=c.v('rep');c.out('rep',r?r+' ms':'off');
    if(rep>=0&&t>=rep){rep=-1;const k=c.v('rep');c.el('rep').value=0;cast();c.el('rep').value=k;}
    // idle: cast the selected shape at the centre every 2 s; a click stops this until 5 s pass without one
    auto-=dt;if(auto<=0&&(idle>5||t<1)){auto=2;cx0=3;cy0=3;cast();}
    u.set(G);
    // scorch left by each effect tile, fading in 2x2 chunks over 4.5 s as in the Sandbox
    for(let q=0;q<N*N;q++){const a=t-SCT[q];if(a<0||a>4.5)continue;const x0=(q%N)*32,y0=((q/N)|0)*32;
      for(let yy=2;yy<30;yy++)for(let xx=2;xx<30;xx++){const x=x0+xx,y=y0+yy,n=vnoise((x>>1)*.45,(y>>1)*.45+q),r=Math.hypot(xx-16,yy-17)/14;if(r>.7+n*.45)continue;if(hash2((x>>1)+q,(y>>1))<a/4.5)continue;const i=y*W+x;u[i]=r<.45?C.C2:dark(u[i]);}}
    // fields: three stages of the fire field, 46x46, 44x50, 34x36, overflowing their tile (stage times shortened here)
    for(let k=fields.length-1;k>=0;k--){if(t-fields[k].t0>6)fields.splice(k,1);}
    for(const f of fields){const x=f.tx*32,y=f.ty*32;for(let yy=y+4;yy<y+30;yy++)for(let xx=x+3;xx<x+29;xx++){const i=yy*W+xx;u[i]=dark(u[i]);}}
    const ents=[];
    for(const f of fields){const a=t-f.t0,id=a<2?'fA':a<4?'fB':'fC';ents.push([f.ty*32+30,()=>flame(u,W,H,id,t,f.tx*32+16+(id==='fA'?7:0),f.ty*32+31,f.v,f.v)]);}
    let alive=0;for(let k=effs.length-1;k>=0;k--){const e=effs[k],ms=(t-e.t0)*1000;if(ms<0){alive++;continue;}if(!e.sc){e.sc=1;SCT[e.ty*N+e.tx]=t;}const fi=frameAt(ms,e.id?EXMS:FXMS);if(fi<0){effs.splice(k,1);continue;}alive++;
      ents.push([e.ty*32+32,()=>{const x=e.tx*32+16,y=e.ty*32+32;if(e.id)blitU(u,W,H,EXA()[e.v][fi],32,32,x-16,y-32);else blitU(u,W,H,AREA()[e.v][fi],FXW,FXW,x-28,y-50);}]);}
    ents.sort((a,b)=>a[0]-b[0]).forEach(e=>e[1]());
    if(c.v('grid'))gridOv(u,W,H,0,0);
    X.put();const S=SHAPES[c.segv('sh')];setHud(root,`${S.n} · ${alive+fields.length} sprites`);
    ro.innerHTML=`${S.n}: <b>${last.n}</b> tiles, ${S.k==='eff'?'one FIREAREA effect each, 40 ms then 13 x 60 ms = 820 ms':S.k==='exp'?'one EXPLOSIONAREA effect each, 12 x 50 ms plus one 100 ms frame = 700 ms':'one fire field item each, which stays and burns in stages'}. Sprites alive now: <b>${alive+fields.length}</b>.`+
      `<br>Last cast: ${last.add} added${S.k==='fld'?'':`, ${last.ref} refused as repeats, ${last.del} delayed by a third of the old copy's duration`}. ${S.k==='eff'?'A repeat on a tile is refused while the old copy is 350 ms old or less.':S.k==='exp'?'A repeat is refused while the old copy is 325 ms old or less.':''}`+
      `<br>Light: one on the centre tile only. A light on each of 37 tiles would strobe.`;}
  return {tick};});

// ======================================================================
// F2 effect and missile timing
// ======================================================================
reg('missile',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=256,H=160,u=X.u32,ro=$('[data-ro]',root),svg=$('svg',root);
  const G=mkGround(W,H,51,'grass'),CT=[1,2],CXp=CT[0]*32+16,CYp=CT[1]*32+28;let t=0,m=null,fx=null,auto=.6,idle=9,info=null;
  c.seg('tm',()=>{});c.on('ai',()=>{});c.on('grid',()=>{});
  pointer(cv,(p,type)=>{if(type!=='down')return;idle=0;fire(clamp(p[0]>>5,0,7),clamp(p[1]>>5,0,4));});
  function fire(tx,ty){if(tx===CT[0]&&ty===CT[1])return;const d=Math.hypot(tx-CT[0],ty-CT[1]),dur=150*Math.sqrt(d),x0=CXp+6,y0=CYp-18,x1=tx*32+16,y1=ty*32+16,a=Math.atan2(y1-y0,x1-x0);
    m={x0,y0,x1,y1,t0:t,dur,dir:((Math.round(a/(Math.PI/4))%8)+8)%8,tx,ty};info={d,dur,tps:d/(dur/1000),ppf:d*32/(dur/1000)/60};}
  // the timeline: the classic fixed 75 ms frame against the per-frame data, with a playhead
  function timeline(ms){const cl=c.segv('tm')==='cl',nar=svg.getBoundingClientRect().width<520,VW=nar?380:600;svg.setAttribute('viewBox',`0 0 ${VW} 74`);svg.innerHTML='';const sx=(VW-58)/1050;
    const row=(y,list,lab,on)=>{let x=0;svgText(svg,0,y-4,lab,{style:`font-size:11px;fill:${on?'#ffd27a':'#8c98b0'}`});list.forEach((d,i)=>{svgEl('rect',{x:x*sx,y,width:Math.max(1,d*sx-1.5),height:12,fill:on?(i===0?'#fff3c4':i<4?'#f1822a':i<9?'#cf421f':'#777382'):'#2a3550',rx:1},svg);x+=d;});svgText(svg,x*sx+4,y+10,x+' ms',{style:'font-size:10.5px;fill:#8c98b0'});};
    row(18,FXMS,'Per-frame data: 40 ms, then 13 x 60 ms',!cl);row(54,new Array(14).fill(75),'Classic client: 14 frames x 75 ms',cl);
    if(ms>=0)svgEl('line',{x1:ms*sx,x2:ms*sx,y1:cl?44:8,y2:cl?70:34,stroke:'#ffd27a','stroke-width':2},svg);}
  function tick(dt){t+=dt;idle+=dt;if(!m&&!fx){auto-=dt;if(auto<=0&&idle>3){auto=1.1;let tx,ty;do{tx=(Math.random()*8)|0;ty=(Math.random()*5)|0;}while(Math.hypot(tx-CT[0],ty-CT[1])<2);fire(tx,ty);}}
    u.set(G);if(c.v('grid'))gridOv(u,W,H,0,0);
    const cl=c.segv('tm')==='cl',list=cl?new Array(14).fill(75):FXMS;let ms=-1;
    if(fx){ms=(t-fx.t0)*1000;const fi=frameAt(ms,list);if(fi<0)fx=null;else{const x=fx.tx*32+16,y=fx.ty*32+32;blitU(u,W,H,AREA()[(fx.tx+fx.ty)%3][fi],FXW,FXW,x-28,y-50);}}
    shadowEll(u,W,H,CXp,CYp-3,7,2);drawCh(u,W,H,2,2,4,CXp,CYp);
    if(m){const k=(t-m.t0)*1000/m.dur;if(k>=1){fx={tx:m.tx,ty:m.ty,t0:t};m=null;}else{const P=MIS()[m.dir];
      if(c.v('ai')){const l=Math.hypot(m.x1-m.x0,m.y1-m.y0),ux=(m.x1-m.x0)/l,uy=(m.y1-m.y0)/l;for(let q=2;q>=1;q--){const x=Math.round(lerp(m.x0,m.x1,k)-ux*10*q),y=Math.round(lerp(m.y0,m.y1,k)-uy*10*q);const D=P.map(v=>v?(q===1?dark(v===C.F5?C.F4:v===C.F4?C.F3:v===C.F3?C.F2:v===C.F2?C.F1:C.F0):(v===C.F5?C.F3:v===C.F4?C.F2:v===C.F3?C.F1:C.F0)):0);if(Math.hypot(x-m.x0,y-m.y0)>8)blitU(u,W,H,D,16,16,x-8,y-8);}}
      blitU(u,W,H,P,16,16,Math.round(lerp(m.x0,m.x1,k))-8,Math.round(lerp(m.y0,m.y1,k))-8);}}
    X.put();timeline(ms);setHud(root,info?`${info.d.toFixed(2)} tiles · ${Math.round(info.dur)} ms`:'click a tile');
    ro.innerHTML=info?`Distance <b>${info.d.toFixed(2)} tiles</b>, Euclidean. Flight <b>150 x sqrt(${info.d.toFixed(2)}) = ${Math.round(info.dur)} ms</b>, ${info.tps.toFixed(1)} tiles/s, ${info.ppf.toFixed(1)} px per frame at 60 fps. The damage was applied when the server sent the missile, so the flight is visual only.`+
      `<br>Impact: FIREAREA, ${cl?'14 frames x 75 ms = 1,050 ms in the classic client':'40 ms then 13 x 60 ms = 820 ms from the per-frame data'}. Report table: 1 tile 150 ms, 3 tiles 260, (3, 3) 309, 5 tiles 335, 7 tiles 397, 9 tiles 450.`:'Click a tile to throw a fireball at it.';}
  return {tick};});

// ======================================================================
// F3 explosions, scorch decals and whole-pixel shake
// ======================================================================
reg('explode',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=96,u=X.u32,ro=$('[data-ro]',root);
  const G=mkGround(W,H,61,'grass'),B=new Uint32Array(W*H),E=mkEm(64),booms=[],scs=[];let t=0,auto=.5,idle=9,trauma=0,k0=0,lastOff=[0,0];
  c.seg('sz',()=>{});c.seg('sk',()=>{});c.on('shake',()=>{});
  pointer(cv,(p,type)=>{if(type!=='down')return;idle=0;boom(clamp(p[0]>>5,0,4),clamp(p[1]>>5,0,2));});
  const SKN={0:'your own fireball',1:'your fire bomb',2:'a big blast within 3 tiles',6:'a boss slam'};
  function boom(tx,ty){const big=c.segv('sz')==='64',n=big?11:7;booms.push({tx,ty,t0:t,big,n});scs.push({tx,ty,t0:t,v:(tx*3+ty+k0++)%3,big});
    const nd=2+((Math.random()*5)|0);for(let q=0;q<nd;q++)E.spawn(tx*32+16,ty*32+18,(Math.random()-.5)*90,-50-Math.random()*50,.3+Math.random()*.2,3);
    // trauma squared times a 6 px cap gives the preset amplitude; it decays 1.5 per second
    const p=+c.segv('sk');trauma=Math.min(1,Math.max(trauma,Math.sqrt(p/6)));}
  function tick(dt){t+=dt;idle+=dt;auto-=dt;if(auto<=0&&idle>4){auto=2.2;boom(1+((Math.random()*3)|0),1+((Math.random()*2)|0)%2);}
    trauma=Math.max(0,trauma-1.5*dt);
    B.set(G);
    // scorch decals: 32x32, 3 variants, fading in 2x2 chunks over 4.5 s
    for(let k=scs.length-1;k>=0;k--){const s=scs[k],a=t-s.t0;if(a>4.5){scs.splice(k,1);continue;}const R=s.big?24:14;
      for(let yy=-R;yy<=R;yy++)for(let xx=-R;xx<=R;xx++){const x=s.tx*32+16+xx,y=s.ty*32+18+yy;if(x<0||y<0||x>=W||y>=H)continue;const n=vnoise((x>>1)*.5+s.v*9,(y>>1)*.5),q=Math.hypot(xx,yy*1.25)/R;if(q>.75+n*.35)continue;
        if(hash2((x>>1)+s.v*5,(y>>1)+k*3)<a/4.5)continue;const i=y*W+x;B[i]=q<.45?C.C1:q<.75?C.C2:dark(B[i]);}}
    // draw into the buffer, then copy it shifted by whole pixels
    for(let k=booms.length-1;k>=0;k--){const b=booms[k],fi=Math.floor((t-b.t0)*1000/75);if(fi>=b.n){booms.splice(k,1);continue;}
      frame2(b,fi,b.tx*32+16,b.ty*32+16);}
    E.step(dt,0);drawEm(B,W,H,E,false,0);
    let ox=0,oy=0;if(c.v('shake')&&trauma>0){const a=6*trauma*trauma;ox=Math.round((vnoise(t*30,1.7)*2-1)*a);oy=Math.round((vnoise(5.3,t*30)*2-1)*a*.5);}lastOff=[ox,oy];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const sx=x-ox,sy=y-oy;u[y*W+x]=sx<0||sy<0||sx>=W||sy>=H?C.OUTL:B[sy*W+sx];}
    X.put();const p=+c.segv('sk');setHud(root,`shake ${Math.abs(ox)} px, ${Math.abs(oy)} px`);
    ro.innerHTML=`${c.segv('sz')==='64'?'A 64 px blast: 11 frames at 75 ms':'A 1-tile hit: one 32x32 sprite of 7 frames at 75 ms'}. Frame 1 is one white flash, frames 2 to 4 grow to full size, the rest break into grey puffs. Debris: 2 to 6 particles of 2x2 px for 300 to 500 ms.`+
      `<br>Shake preset <b>${p} px</b>, ${SKN[p]}. ${c.v('shake')?`Trauma squared times the 6 px cap, half on the vertical, decaying 1.5 per second, offset now (${lastOff[0]}, ${lastOff[1]}).`:'Shake off.'} Strangers' spells shake nothing.`+
      `<br>Scorch: a 32x32 decal per hit, 3 variants, fading over 4.5 s as in the Sandbox. Cost: every shake method was within 0.05 ms of none.`;}
  // one explosion frame drawn into the buffer: a white flash of 22 px, growing to full size on frames 2 to 4, then 2 or 3 grey puffs
  function frame2(b,k,x,y){const S=b.big?32:16,r0=11,put=(xx,yy,col)=>{if(xx>=0&&yy>=0&&xx<W&&yy<H)B[yy*W+xx]=col;};
    if(k===0){for(let yy=-r0;yy<=r0;yy++)for(let xx=-r0;xx<=r0;xx++)if(xx*xx+yy*yy<=r0*r0)put(x+xx,y+yy,xx*xx+yy*yy<r0*r0*.4?C.WHITE:C.F5);return;}
    const grow=Math.min(1,k/(b.big?4:3)),R=Math.round(r0+(S-r0)*grow),fade=b.big?k>=5:k>=4;
    if(!fade){for(let yy=-R;yy<=R;yy++)for(let xx=-R;xx<=R;xx++){const q=Math.hypot(xx,yy)/R,n=vnoise((x+xx)>>1,((y+yy)>>1)+k*3);if(q<1-n*.18)put(x+xx,y+yy,q<.3?C.F5:q<.55?C.F4:q<.78?C.F3:q<.92?C.F2:C.F1);}}
    else{const j=k-(b.big?5:4),m=b.n-(b.big?5:4),lobes=b.big?3:2;for(let q=0;q<lobes;q++){const a=q*2.4+1,dd=S*.35+j*1.5,px=x+Math.cos(a)*dd,py=y-j*2+Math.sin(a)*dd*.6,sz=Math.round((b.big?20:12)+j*1.5);drawPuff(B,W,H,px,py,sz,PTONE.light,j/m*.9,q+b.tx*7);}}}
  return {tick};});

// ======================================================================
// log-scale bar chart (the snow study's). rows: {lab, sub, b:[{v, s, col} or {none:'text'}]}. o: {lo, hi, lines:[[value, text, colour, dy]]}
// ======================================================================
function logBars(svg,rows,o){svg.innerHTML='';const nar=svg.getBoundingClientRect().width<520,LO=o.lo,HI=o.hi,VW=nar?360:600,x0=nar?12:292,x1=nar?250:500,y0=34;
  const tx=(x,y,t,size,fill,anchor)=>{const e=svgEl('text',{x,y,style:`font-size:${size}px;fill:${fill}`+(anchor?`;text-anchor:${anchor}`:'')},svg);e.textContent=t;return e;};
  const dk=c=>.299*parseInt(c.slice(1,3),16)+.587*parseInt(c.slice(3,5),16)+.114*parseInt(c.slice(5,7),16)<140;
  const hs=rows.map(r=>{const nb=r.b.length;return nar?(r.sub?37:26)+nb*13+5:Math.max(r.sub?30:20,nb*13+4)+5;});
  const hgt=y0+hs.reduce((a,b)=>a+b,0)+38;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);
  const Xv=v=>x0+(Math.log10(Math.max(10**LO,v))-LO)/(HI-LO)*(x1-x0),yb=hgt-34;
  for(let e=LO;e<=HI;e++){const v=10**e;svgEl('line',{x1:Xv(v),x2:Xv(v),y1:y0-6,y2:yb,stroke:'#1a2338'},svg);tx(Xv(v),yb+13,v>=1?String(v):String(+v.toFixed(5)),10,'#8c98b0','middle');}
  tx(x1,yb+27,o.axis||'ms, log scale',10.5,'#8c98b0','end');
  for(const [v,t,col,dy] of o.lines||[]){svgEl('line',{x1:Xv(v),x2:Xv(v),y1:y0-8-dy,y2:yb,stroke:col,'stroke-width':1.5,'stroke-dasharray':'4 3'},svg);tx(Xv(v)-4,y0-10-dy,t,10.5,col,'end');}
  const bar=(b,y)=>{if(b.none){tx(x0+3,y+9,b.none,10,'#7d899f');return;}
    svgEl('rect',{x:x0,y,width:Math.max(1.5,Xv(b.v)-x0),height:10,fill:b.col,rx:1},svg);const fits=Xv(b.v)+5+b.s.length*5.6<VW-2;
    if(fits)tx(Xv(b.v)+5,y+8.6,b.s,10,'#eef2f8').style.cssText+=';paint-order:stroke;stroke:#090d16;stroke-width:3px;stroke-linejoin:round';else tx(Xv(b.v)-4,y+8.6,b.s,10,dk(b.col)?'#eef2f8':'#0c111b','end');};
  let y=y0;rows.forEach((r,i)=>{
    if(nar){tx(x0,y+10,r.lab,11,'#dbe2ee');if(r.sub)tx(x0,y+21,r.sub,9.5,'#8c98b0');r.b.forEach((b,q)=>bar(b,y+(r.sub?26:15)+q*13));}
    else{tx(8,y+11,r.lab,11.5,'#dbe2ee');if(r.sub)tx(8,y+23,r.sub,9.5,'#8c98b0');r.b.forEach((b,q)=>bar(b,y+2+q*13));}
    y+=hs[i];});}
const KC={desk:'#8fb3de',thr:'#4d6890',gpu:'#ffd27a',sw:'#ff8f7a'};
const pct=v=>{const p=v/16.7*100;return p<.1?'under 0.1%':p<1?p.toFixed(1)+'%':Math.round(p)+'%';};

// ======================================================================
// 6a the measured costs. Every number is copied from the tables of §6a.
// [label, sub, desktop (GPU run median), 6x throttle median] or [label, sub, GPU, SwiftShader, 'gpu']
// ======================================================================
const A6={flames:[['DOOM torch 8x24, 1:1','192 cells','0.0012','0.0084'],['DOOM torch 8x24, 1:2','48 cells','0.00039','0.0025'],['DOOM campfire 32x48, 1:1','1,536 cells','0.0086','0.057'],['DOOM campfire 32x48, 1:2','384 cells','0.0026','0.016'],
    ['DOOM bonfire 64x96, 1:1','6,144 cells','0.033','0.217'],['DOOM house front 128x96, 1:1','12,288 cells','0.067','0.417'],['DOOM house front 128x96, 1:2','3,072 cells','0.019','0.122'],['DOOM band 640x120, 1:1','76,800 cells','0.388','2.52'],['DOOM band 640x120, 1:2','19,200 cells','0.109','0.714'],
    ['20 DOOM torches, 1:1','3,840 cells','0.024','0.158'],['50 drawn loops','cached frames','0.011','0.073'],['150 drawn loops','','0.034','0.213'],['800 drawn loops','','0.179','1.17'],
    ['Noise fire shader, full screen','5 octaves, Metal timer and SwiftShader','0.022','0.510','gpu'],['Noise fire shader, 640x120 band','','0.0076','0.170','gpu']],
  world:[['Burn front, art map, 20%','48 tiles','0.082','0.515'],['Burn front, art map, 100%','240 tiles','0.417','2.88'],['Burn front, Bayer 4, 100%','','0.348','4.00'],['Burn front, whole-tile swap, 100%','','0.116','0.720'],
    ['Spread grid, 32 px tiles, per 4 Hz tick','85 burning','0.0036','0.024'],['Smoke advect, VFX #6 code, 8 px','3 Float32 channels','0.055','0.366'],['Smoke advect, 1 Uint8 channel, 8 px','','0.0095','0.060'],['Smoke draw, 2x2 clusters, 8 px','plumes, empty spans skipped','0.099','0.606'],
    ['Light map build, 8 px cells','30 sources','0.021','0.142'],['Light apply, nearest, Bayer band, 8 px','','0.294','1.98'],['Light apply, bilinear, 8 px','','0.505','3.25'],['512 embers','','0.0033','0.021'],['Palette pass, 640x360','','0.059','0.388'],['putImageData, 1 px sync','','0.033','0.200']],
  frame:[['Default frame at 640x360','spread, front at 20%, 150 loops, 512 embers, smoke, light, palette','0.624','4.90'],['Default frame at 320x180','same cell counts','0.206','1.24'],
    ['Smoke 80x45 R8 upload','3,600 bytes, wall time, then SwiftShader','0.016','0.018','gpu'],['640x360 R8 upload','230,400 bytes','0.034','0.039','gpu'],['640x360 RGBA8 upload','921,600 bytes','0.091','0.095','gpu']]};
reg('costs',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  function chart(){const g=c.segv('g'),rows=A6[g].map(r=>({lab:r[0],sub:r[1],b:r[4]==='gpu'?[{v:+r[2],s:`${r[2]} ms GPU`,col:KC.gpu},{v:+r[3],s:`${r[3]} ms SwiftShader`,col:KC.sw}]:[{v:+r[2],s:`${r[2]} ms`,col:KC.desk},{v:+r[3],s:`${r[3]} ms · ${pct(+r[3])}`,col:KC.thr}]}));
    logBars(svg,rows,{lo:-4,hi:2,lines:[[16.7,'16.7 ms frame','#ff6b5e',0]]});
    leg.innerHTML=[['desk','desktop: GPU run, median'],['thr','6x throttle, median, a low-end proxy'],['gpu','WebGL2 on Metal'],['sw','SwiftShader, a software renderer']].map(([k,t])=>`<span><i style="background:${KC[k]}"></i>${t}</span>`).join('')+'<span><i style="background:#ff6b5e"></i>16.7 ms frame</span>';
    ro.innerHTML=(g==='flames'?'A DOOM band is the only flame cost that matters: <b>2.52 ms</b> throttled at 1:1, 0.714 ms at 1:2. Twenty 1:1 torches cost 0.158 ms, under 1% of the throttled budget. A cell costs 3.9 to 5 ns per step.':
      g==='world'?'The light apply is the biggest layer: <b>0.294 ms</b> on the desktop with nearest sampling at 8 px cells. The report puts the apply at 44% of the desktop frame and the smoke at 18%. Bayer saves 8 to 17% on the burn front and nothing on smoke. Fields such as the spread grid and the light map build stay near zero.':
      'The default frame takes <b>0.624 ms</b> on the desktop and <b>4.90 ms</b> under the 6x throttle, 29% of the frame. At 320x180 it takes 1.24 ms, so 4 times the pixels cost 3.9 times as much throttled. A whole 640x360 RGBA8 upload is 0.091 ms of wall time.')+
      ' <span style="color:var(--mute,#8c98b0)">Source: §6a, Apple M4 Pro, Chromium 153. Browser JavaScript and WebGL2 on one machine, not Godot numbers.</span>';}
  c.seg('g',chart);addEventListener('resize',chart);chart();return {};});

// ======================================================================
// 6c games by tile size: flame boxes as a fraction of each game's tile, drawn on a 32 px tile.
// [game, tile px, flame or effect px, fraction (the report's words), frames x ms, source, fraction w, fraction h, tile for sorting]
// ======================================================================
const C6=[['Tibia fire field, stages 1 to 3','32','49x47, 49x54, 38x40 in a 64x64 canvas','1.53x1.47, 1.53x1.69, 1.19x1.25','5 x 120, 5 x 100, 5 x 100','[S12]',1.53,1.47,32],
  ['Tibia FIREAREA, HITBYFIRE','32','53x53, 42x40','1.66, 1.31x1.25','40 + 13 x 60, 9 x 100','[S12]',1.66,1.66,32],
  ['Tibia campfire, fireplace','32','32x32, 35x47','1.0, 1.09x1.47','5 x 100, 5 x 100','[S12]',1,1,32],
  ['Tibia lit torch, burnt stub','32','29x30 to 24x23, 11x14','0.91x0.94 to 0.34x0.44','2 x 500','[S12]',.91,.94,32],
  ['Tibia ash, lava','32','24x24, 32x32','0.75, 1.0','still, 3 x 500','[S12]',.75,.75,32],
  ['Cataclysm DDA, MShockXotto+','32','32x32','1.0','7 x 136','[S80, S77]',1,1,32],
  ['RPG Maker MV battle animation, state overlay','48','192x192, 96x96','4.0, 2.0','66.7 ms per cell, 8 x 133','[S58, S59]',4,4,48],
  ['Stardew campfire flame, fireplace flame','16 at 4x','12x11 at 3x, 12x11 at 4x','0.56x0.52, 0.75x0.69','4 x 100','[S47, S48]',.56,.52,16],
  ['Stardew floor torch, ember','16 at 4x','8x8 at 3x, 1 px at 3x','0.375, 0.047','7 x 100','[S47]',.375,.375,16],
  ['Terraria campfire','16','3x2 tiles','3.0 x 2.0','8 x 66.7','[S82]',3,2,16],
  ['Shattered Pixel Dungeon','16','4 px squares, rising 14.4 px','0.25, rise 0.9','1 per 30 ms, 0.6 s life','[S67, S68]',.25,.25,16],
  ['Zelda: A Link to the Past, Fire Rod impact','16','16x16','1.0','3 x 133 + 117','[S66]',1,1,16],
  ['Pokémon Emerald ash puff','16','16x16','1.0','201, 201, 134, 201, 201','[S64]',1,1,16],
  ['Project Zomboid','isometric','2 or 3 flames per tile, offsets up to 32 px','','4 frames at 12 fps','[S96, S97]',0,0,0]];
const AST6=['Asterion proposal','32','post torch 10x16, carried 6x8, campfire 24x28, field flames 40 to 54 tall','0.31x0.5, 0.19x0.25, 0.75x0.88, up to 1.7','6 x 100, 4 x 100, 8 x 100 to 120, 5 x 100 to 120','[I, notes 10, 11, 13]',.75,.88,32];
reg('tilesizes',root=>{const gs=$('[data-games]',root),chips=$('[data-chips]',root),card=$('[data-card]',root);
  const boxed=C6.filter(r=>r[8]).concat([AST6]).sort((a,b)=>a[8]-b[8]||(a===AST6?1:b===AST6?-1:0)),rest=C6.filter(r=>!r[8]);let sel=AST6;
  const CW=80,CH=72,btns=new Map(),SIL=new Uint32Array(768);
  // the grey shape: Asterion's 24x32 character as a flat silhouette, the same in every box
  {const F=FR()[0][0][4].px;for(let i=0;i<768;i++)SIL[i]=F[i]?(F[i]===C.OUTL?C.OUTL:C.GREY):0;for(let i=0;i<768;i++)if(SIL[i]===C.GREY&&(i<24||!SIL[i-24]||SIL[i-24]===C.OUTL))SIL[i]=C.GREYL;}
  function paint(cv,r){const X=PX(cv),u=X.u32,ast=r===AST6;u.fill(hx('#141a28'));const gy=CH-4,tx0=6,ty0=gy-32;
    // the tile, Asterion's 32 px, and the flame box at the table's fraction of a tile, standing on the tile's bottom centre
    rect(u,CW,CH,tx0,ty0,32,32,C.G2);rect(u,CW,CH,tx0,ty0,32,1,C.G3);rect(u,CW,CH,tx0,ty0,1,32,C.G3);rect(u,CW,CH,tx0,gy-1,32,1,C.G1);rect(u,CW,CH,tx0+31,ty0,1,32,C.G1);
    const fw=Math.max(2,Math.round(r[6]*32)),fh=Math.max(2,Math.round(r[7]*32)),fx=tx0+16-(fw>>1),fy=gy-fh;
    for(let y=0;y<fh;y++){const k=y/fh,col=k<.25?C.F2:k<.55?C.F3:k<.85?C.F4:C.F5;rect(u,CW,CH,fx,fy+y,fw,1,col);}box(u,CW,CH,fx,fy,fw,fh,C.F1);
    if(fy<0||fx<0){for(let x=Math.max(0,fx);x<Math.min(CW,fx+fw);x+=2)u[x]=C.LAMP;}
    // the character for scale
    for(let y=0;y<32;y++)for(let x=0;x<24;x++){const v=ast?FR()[0][0][4].px[y*24+x]:SIL[y*24+x];if(v)u[(gy-31+y)*CW+50+x]=v;}
    X.put();}
  function show(){for(const [r,b] of btns)b.classList.toggle('on',r===sel);const r=sel,L=['Tile px','Flame or effect, px','Fraction of a tile','Frames x ms','Source'];
    card.innerHTML=`<dt class="h">Game</dt><dd class="h">${r[0]}</dd>`+L.map((l,i)=>`<dt>${l}</dt><dd>${r[i+1]}</dd>`).join('')+(r[8]&&(r[6]>2||r[7]>2)?'<dt></dt><dd>The box is taller or wider than the card. A dotted top edge marks the cut.</dd>':'');}
  const scale=()=>gs.getBoundingClientRect().width>=560?2:1;
  function size(){const k=scale();$$('canvas',gs).forEach(cv=>{cv.style.width=CW*k+'px';cv.style.height=CH*k+'px';});}
  for(const r of boxed){const b=document.createElement('button');b.type='button';if(r===AST6)b.classList.add('ast');const cv=document.createElement('canvas');cv.width=CW;cv.height=CH;cv.setAttribute('aria-hidden','true');
    const s=document.createElement('span');s.textContent=r===AST6?'Asterion campfire':r[0].split(',')[0].replace(' MShockXotto+','');const sm=document.createElement('small');sm.textContent=`${r[1]} px · ${r[6]===r[7]?r[6]:r[6]+'x'+r[7]}`;
    b.append(cv,s,sm);b.setAttribute('aria-label',`${r[0]}, tile ${r[1]} px, fraction ${r[3]}`);b.addEventListener('click',()=>{sel=r;show();});gs.appendChild(b);btns.set(r,b);paint(cv,r);}
  for(const r of rest){const b=document.createElement('button');b.type='button';b.textContent=r[0];b.addEventListener('click',()=>{sel=r;show();});chips.appendChild(b);btns.set(r,b);}
  size();addEventListener('resize',size);show();return {};});

// ======================================================================
// §5 scorecard: sortable heat table + radar. Rows come from the page's SCORE data when the build provides it; the copy below is the report's table.
// ======================================================================
const S5=[['A1','Base resolution 640x360, buffers that grow',5,5,5,3,1,19],['A2','Spread grid per tile, rolled at 1 Hz',5,5,3,4,5,22],['A3','Light map and smoke field resolution',4,4,4,4,2,18],['B1','Drawn flame loops sized by the tile',4,5,5,5,2,21],
  ['B2','Tibia overflow sprites, 16 position variants',5,5,5,4,3,22],['B3','Dying fire: smaller, slower, dimmer',5,5,5,5,2,22],['B4','DOOM buffers 1:1 and 1:2, height rule, smoothing',4,4,3,4,3,18],['B5','GPU noise fire quantized to the palette',3,5,3,4,2,17],
  ['B6','Stacked copies, jitter, particle-only fire',5,5,3,3,2,18],['C1','Burn-order map with entry direction',3,4,5,5,4,21],['C2','Continuous arrival-time front',2,4,5,5,4,20],['C3','Whole-tile swap and scorch autotiles',5,5,3,2,3,18],
  ['C4','Tile states, burnt tileset, embers, ash, regrowth',4,5,5,4,4,22],['C5','Trees and houses in stages',3,5,5,5,4,22],['D1','Smoke field drawn with clusters',4,4,4,4,3,19],['D2','Hero puffs scaled by the tile',5,5,5,5,2,22],
  ['D3','Embers and sparks at 2x2 px',5,5,4,4,2,20],['E1','Burning overlay on a 24x32 character',4,5,4,5,4,22],['E2','Carried torch through a 4-frame walk',3,5,5,5,4,22],['E3','Warm rim light and fire shadow',3,4,4,5,4,20],
  ['E4','Walking through fire, soot prints, ash puffs',4,5,4,4,5,22],['E5','Damage text and hit flash',5,5,4,3,3,20],['E6','Crowd budget',4,5,3,3,3,18],['F1','Areas built from 1-tile effects',5,5,5,4,4,23],
  ['F2','Effect and missile timing',5,5,4,4,4,22],['F3','Explosions, scorch decals, shake',4,5,4,5,3,21],['F4','Lava at 32 px',4,5,4,4,2,19],['G1','Measured frame, light apply the biggest layer',4,5,3,3,1,16],
  ['G2','Whole-texture uploads, small R8 fields',4,5,3,2,2,16],['G3','Particles on the web',3,3,3,3,2,14],['G4','PointLight2D limits, baked light texture',4,4,4,4,2,18],['H1','GPU fire buffers on DrawableTexture2D',2,4,3,4,2,15],
  ['H2','Fire seeded from masks and cooling maps',3,4,4,5,3,19]].map(r=>({id:r[0],name:r[1],r:r.slice(2,7),sum:r[7]}));
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const GS=(typeof SCORE!=='undefined'&&Array.isArray(SCORE)&&SCORE.length===33)?SCORE:S5;
  const HC=['#1c1620','#3a2230','#7a3a2e','#d7793a','#fbd38a'],RL=['Simplicity','Speed','Pixel taste','Mood','Interactivity'],SC=['#ffd27a','#7fd4c3','#ff8f7a'];
  let sel=['F1','B5','C1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Mood','Interact.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=GS.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#1a1420':'#e8dfe4'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-46 0 ${S+92} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#35435f':'#1c2740'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#1c2740'},svg);const [lx,ly]=pt(k,5.45);svgText(svg,lx,ly+(k===0?-2:k===2||k===3?12:4),RL[k],{'text-anchor':k===0?'middle':k<3?'start':'end',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=GS.find(x=>x.id===id);if(!s)return;svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=GS.find(x=>x.id===id);return s?`<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`:'';}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});
}
