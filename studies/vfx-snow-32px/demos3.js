// Snow 32 study: figures 3 (bootprints, tilemark, sink, trench, stride, smallcues, crowd, groundcost, nogpu, costs, convert, tilesizes, score)
{
// ----------------------------------------------------------------------
// small styles only these figures use
// ----------------------------------------------------------------------
{const st=document.createElement('style');st.textContent=
'.s3-col{max-width:100%}'+
'.s3-fr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;margin-top:4px;font:11.5px/1.3 "IBM Plex Mono",monospace;color:var(--mute);text-align:center}'+
'.s3-fr span{padding:3px 2px;border-top:2px solid transparent}'+
'.s3-fr span.on{color:var(--lamp);border-top-color:var(--lamp)}'+
'.s3-sl{max-width:460px;margin:10px 0 2px;font-size:13px;color:var(--mute)}'+
'.s3-sl output{font:12px "IBM Plex Mono",monospace;color:var(--ice);margin-left:8px}'+
'.s3-sl input{display:block;width:100%;margin:4px 0 2px;accent-color:#8fb3de}'+
'.s3-marks{position:relative;height:26px;margin:0 8px 0 8px;font:11.5px/1.2 "IBM Plex Mono",monospace;color:var(--mute)}'+
'.s3-marks i{position:absolute;top:0;width:1px;height:7px;background:var(--lamp)}'+
'.s3-marks span{position:absolute;top:9px;transform:translateX(-50%);white-space:nowrap}'+
'.s3-marks span.end{transform:translateX(-100%)}'+
'.s3-scale{display:flex;margin-top:3px;font:11px/1.3 "IBM Plex Mono",monospace;color:var(--mute);text-align:center}'+
'.s3-scale span{min-width:0;overflow:hidden;white-space:nowrap;border-top:3px solid #5b90d1;padding-top:2px;border-left:1px solid var(--bg)}'+
'.s3-scale span.t{border-top-color:var(--lamp);color:var(--lamp)}'+
'.s3-tl{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:4px;font:11px/1.25 "IBM Plex Mono",monospace;color:var(--mute);text-align:center}'+
'.s3-tl span{min-width:0;padding:4px 2px 3px;border:1px solid var(--line2);border-left-width:0;background:#0f1523;min-height:44px}'+
'.s3-tl span:first-child{border-left-width:1px}'+
'.s3-tl span.on{background:#1b2740;color:var(--ice)}'+
'.s3-tl span b{display:block;font-weight:400;color:var(--lamp);font-size:10.5px}'+
'.s3-tl i{position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--lamp);left:0}'+
'.s3-tag{font:10.5px "IBM Plex Mono",monospace;border-radius:3px;padding:0 5px;margin-left:2px;white-space:nowrap}'+
'.s3-tag.ship{background:rgba(181,217,138,.16);color:#b5d98a;border:1px solid rgba(181,217,138,.5)}'+
'.s3-tag.ours{background:rgba(255,210,122,.12);color:var(--lamp);border:1px solid rgba(255,210,122,.5)}'+
'.s3-drop{margin:8px 0 0;padding:0 0 0 0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px;font-size:13px;color:var(--txt);counter-reset:d}'+
'.s3-drop li{counter-increment:d;padding:3px 8px;border:1px solid var(--line2);border-radius:4px}'+
'.s3-drop li::before{content:counter(d) ". ";color:var(--lamp);font-family:"IBM Plex Mono",monospace}'+
'.s3-drop li.off{color:var(--mute);text-decoration:line-through;border-style:dashed}'+
'.s3-chart{max-width:760px}'+
'.s3-live{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-top:10px}'+
'.s3-live .stage{flex:0 0 auto}'+
'.s3-ms{margin:0;flex:1 1 200px;font:12.5px/1.6 "IBM Plex Mono",monospace;color:var(--mute);max-width:none}'+
'.s3-ms b{color:var(--lamp);font-weight:500}'+
'.s3-fol i{width:10px!important;height:10px!important;border-radius:2px;vertical-align:-1px!important}'+
'.s3-conv{max-width:100%!important;margin:8px 0 0}'+
'.s3-conv table{font-size:13px;width:100%}'+
'.s3-conv td,.s3-conv th{vertical-align:top}'+
'.s3-conv td:first-child{box-shadow:inset 3px 0 0 var(--k,#35435f)}'+
'.s3-conv td.calc{color:var(--lamp)}'+
'.s3-conv td.none{color:var(--mute)}'+
'.s3-conv td .f{display:inline-block;font:11px "IBM Plex Mono",monospace;border-radius:3px;padding:0 5px;color:#0c111b;background:var(--k,#8c98b0);white-space:nowrap}'+
'.s3-games{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end}'+
'.s3-games button{display:flex;flex-direction:column;align-items:center;gap:3px;background:#0f1523;border:1px solid var(--line2);border-radius:4px;padding:5px 4px 4px;color:var(--txt);font:11.5px/1.2 "IBM Plex Sans",sans-serif;cursor:pointer;min-width:0}'+
'.s3-games button canvas{display:block;image-rendering:pixelated;background:#182238;border-radius:2px}'+
'.s3-games button span{max-width:104px;text-align:center}'+
'.s3-games button small{font:10.5px "IBM Plex Mono",monospace;color:var(--mute)}'+
'.s3-games button.on{border-color:var(--lamp);background:#1b2740}'+
'.s3-games button.ast{border-color:var(--ice2)}'+
'.s3-sub{margin:10px 0 4px!important;font-size:12.5px;color:var(--mute)}'+
'.s3-chips{display:flex;flex-wrap:wrap;gap:5px}'+
'.s3-chips button{background:transparent;border:1px solid var(--line2);border-radius:4px;color:var(--txt);font:12.5px "IBM Plex Sans",sans-serif;padding:3px 8px;cursor:pointer}'+
'.s3-chips button.on{border-color:var(--lamp);background:#1b2740}'+
'.s3-card{display:grid;grid-template-columns:minmax(96px,auto) minmax(0,1fr);gap:3px 12px;margin:10px 0 0;padding:8px 10px;background:#090d16;border:1px solid var(--line);border-radius:4px;font-size:13.5px;line-height:1.45}'+
'.s3-card dt{color:var(--mute)}'+
'.s3-card dd{margin:0;color:var(--txt);min-height:1.45em}'+
'.s3-card dt.h,.s3-card dd.h{color:var(--lamp);font-weight:600}'+
'@media (max-width:640px){.s3-fr{font-size:10px}.s3-tl{font-size:9.5px}.s3-tl span b{font-size:9.5px}.s3-scale{font-size:9.5px}.s3-drop{grid-template-columns:minmax(0,1fr)}.s3-marks{font-size:10px}.s3-conv table{font-size:12px}}';
document.head.appendChild(st);}

// ----------------------------------------------------------------------
// shared kit: colours and palettes copied from the Snow 32 Sandbox
// ----------------------------------------------------------------------
const hx=h=>(0xff000000|parseInt(h.slice(5,7),16)<<16|parseInt(h.slice(3,5),16)<<8|parseInt(h.slice(1,3),16))>>>0;
const cR=c=>c&255,cG=c=>c>>>8&255,cB=c=>c>>>16&255;
const rgb=(r,g,b)=>(0xff000000|(b>255?255:b<0?0:b|0)<<16|(g>255?255:g<0?0:g|0)<<8|(r>255?255:r<0?0:r|0))>>>0;
const mixc=(a,b,t)=>rgb(cR(a)+(cR(b)-cR(a))*t,cG(a)+(cG(b)-cG(a))*t,cB(a)+(cB(b)-cB(a))*t);
const C={};
for(const [k,v] of Object.entries({OUTL:'#1e1a2e',GR_X:'#22382f',GR_D:'#2d4b3d',GR_A:'#3a5d47',GR_B:'#4a704d',GR_T:'#6b8f57',
  SN_HI:'#f2f1ec',SN_BASE:'#cbd3dc',SN_MID:'#9eabb8',SN_SH:'#7d7a96',SN_DEEP:'#5a5674',SN_PACK:'#a6b1c0',SN_PSH:'#7b8199',SN_PDK:'#575b76',
  ROOF_L:'#b65e4a',ROOF_A:'#934242',ROOF_B:'#71303a',WALL_L:'#b48d60',WALL_A:'#93704c',WALL_B:'#76573d',WALL_D:'#513b2d',DOOR_A:'#6b4631',
  ROCK_L:'#abafba',ROCK_A:'#888d9b',ROCK_B:'#676c7e',ROCK_C:'#484c61',CAN_L:'#4c8c5c',CAN_A:'#2f6e52',CAN_B:'#235742',TRUNK:'#5f402d',TRUNK_D:'#402b23',
  HAT:'#c8443c',HAT_L:'#e2695a',HAT_D:'#8d2b38',HATB:'#eee6dc',HATB_D:'#c4bcc2',SKIN:'#f0c09a',SKIN_D:'#cd9072',SCARF:'#f2c14e',SCARF_D:'#c18a35',
  COAT:'#3c6fb4',COAT_L:'#5b90d1',COAT_D:'#2a4c85',LEG:'#3a3c54',LEG_D:'#2a2b40',V_HAT:'#7b5737',V_COAT:'#4f7a3a',V_COAT_L:'#6d9b4d',V_COAT_D:'#365930',
  PUR_L:'#9a79c9',PUR_A:'#7555a9',PUR_D:'#4d3979',FOX:'#d9733a',FOX_D:'#a94f2d',BREATH:'#e6ebf3',FLAKE_M:'#dfe6f2',LAMP:'#ffd27a',INK:'#0c111b'}))C[k]=hx(v);
// the Sandbox's sun-shadow and frost versions of a colour
const SHC=new Map();
const shd=c=>{let v=SHC.get(c);if(v===undefined){v=rgb(cR(c)*.7,cG(c)*.74,cB(c)*.9+10);SHC.set(c,v);}return v;};
const frost=c=>rgb(cR(c)*.74+190*.26,cG(c)*.74+208*.26,cB(c)*.74+226*.26);
const nf=n=>Math.round(n).toLocaleString('en-US');
const mtr=(k=.08)=>{let s=-1,t0=0;return {a(){t0=performance.now();},b(){const d=performance.now()-t0;s=s<0?d:s+(d-s)*k;return s;},add(d){s=s<0?d:s+(d-s)*k;},get v(){return Math.max(0,s);}};};
const f3=v=>v<.0005?'under 0.001':v<.01?v.toFixed(4):v<.1?v.toFixed(3):v<10?v.toFixed(2):v.toFixed(1);
// keep an element as wide as the stage above it (the stage is snapped to a whole-number scale by core.js)
function follow(stage,el){const f=()=>{const w=stage.getBoundingClientRect().width;if(w>0)el.style.maxWidth=w+'px';};f();if(typeof ResizeObserver!=='undefined')new ResizeObserver(f).observe(stage);addEventListener('resize',f);}
// 3x5 digits for numbers drawn inside a pixel canvas
const DG=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001010010','111101111101111','111101111001111'];
function dg(u,W,H,x,y,str,col){for(const ch of String(str)){const d=DG[+ch];if(d!==undefined)for(let r=0;r<5;r++)for(let q=0;q<3;q++)if(d[r*3+q]==='1'){const xx=x+q,yy=y+r;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=col;}x+=4;}}
function rect(u,W,H,x0,y0,w,h,col){for(let y=Math.max(0,y0);y<Math.min(H,y0+h);y++)for(let x=Math.max(0,x0);x<Math.min(W,x0+w);x++)u[y*W+x]=col;}
function box(u,W,H,x0,y0,w,h,col){for(let x=x0;x<x0+w;x++){if(x<0||x>=W)continue;if(y0>=0&&y0<H)u[y0*W+x]=col;if(y0+h-1>=0&&y0+h-1<H)u[(y0+h-1)*W+x]=col;}
  for(let y=y0;y<y0+h;y++){if(y<0||y>=H)continue;if(x0>=0&&x0<W)u[y*W+x0]=col;if(x0+w-1>=0&&x0+w-1<W)u[y*W+x0+w-1]=col;}}
// dashed 32 px tile grid, 2 px on and 2 px off, drawn as a slightly darker tone of what is there
function gridOv(u,W,H,ox,oy,ts=32){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const gx=((x-ox)%ts+ts)%ts===0,gy=((y-oy)%ts+ts)%ts===0;if((gx&&((y-oy)&3)<2)||(gy&&((x-ox)&3)<2)){const i=y*W+x;u[i]=mixc(u[i],C.OUTL,.22);}}}

// ----------------------------------------------------------------------
// the Sandbox's 24x32 character: row templates, frames and outline
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
// frame 0 is the left step, frame 2 the right step, 1 and 3 are passing poses, 4 is idle
const UPS=[UP_F,UP_B,UP_S],LEGS=[[LF_R,LF_I,LF_L,LF_I,LF_I],[LF_L,LF_I,LF_R,LF_I,LF_I],[LS_F,LS_FP,LS_N,LS_NP,LS_I]];
const mkMap=(hat,hatL,hatD,coat,coatL,coatD,scarf,scarfD,hair,brim,brimD)=>({h:hat,L:hatL,H:hatD,w:brim||C.HATB,W:brimD||C.HATB_D,k:hair,K:C.TRUNK_D,s:C.SKIN,S:C.SKIN_D,E:C.OUTL,y:scarf,Y:scarfD,c:coat,l:coatL,C:coatD,g:C.SKIN,G:C.SKIN_D,p:C.LEG,P:C.LEG_D,b:C.DOOR_A,B:C.WALL_D,o:C.OUTL});
const MAPS=[mkMap(C.HAT,C.HAT_L,C.HAT_D,C.COAT,C.COAT_L,C.COAT_D,C.SCARF,C.SCARF_D,C.TRUNK),
  mkMap(C.V_HAT,C.WALL_A,C.WALL_D,C.V_COAT,C.V_COAT_L,C.V_COAT_D,C.HAT,C.HAT_D,C.ROCK_B,C.WALL_L,C.WALL_A),
  mkMap(C.CAN_A,C.CAN_L,C.CAN_B,C.ROOF_A,C.ROOF_L,C.ROOF_B,C.HATB,C.HATB_D,C.TRUNK),
  mkMap(C.PUR_A,C.PUR_L,C.PUR_D,C.WALL_A,C.WALL_L,C.WALL_B,C.COAT,C.COAT_D,C.TRUNK_D),
  mkMap(C.SCARF,C.SN_HI,C.SCARF_D,C.PUR_A,C.PUR_L,C.PUR_D,C.HAT,C.HAT_D,C.TRUNK),
  mkMap(C.COAT,C.COAT_L,C.COAT_D,C.ROCK_A,C.ROCK_L,C.ROCK_B,C.SCARF,C.SCARF_D,C.WALL_D),
  mkMap(C.ROCK_B,C.ROCK_A,C.ROCK_C,C.CAN_A,C.CAN_L,C.CAN_B,C.FOX,C.FOX_D,C.TRUNK,C.ROCK_L,C.ROCK_A)];
function outlineSprite(px,w,h){const add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(px[i])continue;if((x>0&&px[i-1])||(x<w-1&&px[i+1])||(y>0&&px[i-w])||(y<h-1&&px[i+w]))add.push(i);}for(const i of add)px[i]=C.OUTL;}
function mkFrames(map){const out=[],hatSet=new Set([map.h,map.L,map.H,map.w,map.W]),coatSet=new Set([map.c,map.l,map.C]);
  for(let d=0;d<3;d++){const up=UPS[d],fr=[];
    for(let f=0;f<5;f++){const px=new Uint32Array(768),m=new Uint8Array(768),bob=(f===1||f===3)?1:0,y0=2-bob;
      const row=(str,y,xo)=>{for(let x=0;x<24;x++){const ch=str[x],X=x+(xo|0);if(ch!=='.'&&y>=0&&y<32&&X>=0&&X<24)px[y*24+X]=map[ch];}};
      const g=up.map(r=>r.split(''));g.push(new Array(24).fill('.'),new Array(24).fill('.'));let sway=0;
      if(d<2&&(f===0||f===2)){const plantRight=(f===0)===(d===0),fa=plantRight?3:17,ba=plantRight?17:3;sway=plantRight?1:-1;
        for(let r=21;r>=15;r--)for(let x=fa;x<fa+4;x++)g[r+2][x]=g[r][x];
        for(let r=15;r<=20;r++)for(let x=ba;x<ba+4;x++)g[r][x]=g[r+1][x];for(let x=ba;x<ba+4;x++)g[21][x]='.';}
      for(let r=0;r<25;r++)row(g[r].join(''),y0+r,sway);
      if(d===2){const sw=f===0?3:f===2?-3:0;for(let r=0;r<ARM_S.length;r++){const s=ARM_S[r],xo=Math.round(sw*r/6);for(let x=0;x<5;x++)if(s[x]!=='.')px[(y0+15+r)*24+10+xo+x]=map[s[x]];}}
      const L=LEGS[d][f];if(bob)row(L[0],24);for(let r=0;r<6;r++)row(L[r],25+r);
      for(let x=0;x<24;x++){let r0=-1;for(let y=0;y<10;y++)if(px[y*24+x]){r0=y;break;}if(r0>=0&&hatSet.has(px[r0*24+x])){m[r0*24+x]=1;if(hatSet.has(px[(r0+1)*24+x]))m[(r0+1)*24+x]=2;}}
      for(let y=y0+13;y<=y0+16;y++)for(let x=0;x<24;x++)if(coatSet.has(px[y*24+x])&&!px[(y-1)*24+x]){m[y*24+x]=3;if(coatSet.has(px[(y+1)*24+x]))m[(y+1)*24+x]=4;}
      outlineSprite(px,24,32);fr.push({px,m});}
    out.push(fr);}
  return out;}
let FRc=null;
const FR=()=>FRc||(FRc=MAPS.map(mkFrames));
const SHW=[3,6,7,6,3];
// draw one character with its feet on (fx, fy). dir: 0 down, 1 up, 2 right, 3 left. fr: 0..3 walk, 4 idle.
// sk = sink in px. o: {shadow, rim, snow (0, 1 = a 1 px line on hat and shoulders, 4 = a second row on both), M = per-frame mask of sprite pixels}
function drawChar(u,W,H,set,dir,fr,fx,fy,sk,o){o=o||{};const F=FR()[set][dir===0?0:dir===1?1:2][fr],px=F.px,mk=F.m,flip=dir===3,x0=fx-12,y0=fy-30+sk,M=o.M;
  if(o.shadow!==false){const shr=sk>>2;for(let r=0;r<5;r++){const y=fy-5+r,hw=SHW[r]-shr;if(y<0||y>=H||hw<1)continue;for(let x=fx-hw;x<fx+hw;x++){if(x<0||x>=W)continue;const i=y*W+x;if(M){if(M[i])continue;M[i]=1;}u[i]=shd(u[i]);}}}
  const lv=o.snow|0,last=30-sk;
  for(let r=0;r<=last;r++){const y=y0+r;if(y<0||y>=H)continue;for(let cx=0;cx<24;cx++){const sc=flip?23-cx:cx;let v=px[r*24+sc];if(!v)continue;const x=x0+cx;if(x<0||x>=W)continue;
      if(lv){const m=mk[r*24+sc];if(m&&(lv===4||m===1||m===3))v=(m===1||m===3)?C.SN_HI:C.SN_BASE;}
      u[y*W+x]=v;if(M)M[y*W+x]=2;}}
  if(sk>=2&&o.rim!==false){const hw=6;for(let r=0;r<3;r++){const y=fy-2+r;if(y<0||y>=H)continue;const w=r===0?hw-2:hw;for(let x=fx-w;x<fx+w;x++){if(x<0||x>=W)continue;
      const end=x===fx-w||x===fx+w-1;if((r===0&&((x+fx)%5===0))||(r===2&&end))continue;u[y*W+x]=r===0?C.SN_HI:r===2?C.SN_MID:end?C.SN_MID:C.SN_HI;if(M)M[y*W+x]=2;}}}}

// ----------------------------------------------------------------------
// a small snow field at 1 cell per 2x2 art px, with the Sandbox's stamps and
// its banded renderer (fixed 9/3/3/1 weights, art threshold map, prints as holes)
// ----------------------------------------------------------------------
function mkField(W,H,o){o=o||{};const FW=W>>1,FH=H>>1,NF=FW*FH,NP=W*H,D=new Uint8Array(NF),P=new Uint8Array(NF),T=new Uint8Array(NF);
  const GND=new Uint32Array(NP),GFR=new Uint32Array(NP),TH=new Uint8Array(NP),MK=new Uint8Array(NP),S=W+6,cov=new Uint8Array(S*(H+6)),ds=new Int16Array(S*(H+6));
  const seed=o.seed||1,rng=mkRng(seed*7919+13);
  const F={W,H,FW,FH,D,P,T,TH,writes:0,stamps:0};
  // grass in 2x2 clusters, with a few lighter tufts
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const bx=x>>1,by=y>>1,n=vnoise(bx*.17+seed*3.1,by*.17+seed*1.7)+(hash2(bx+seed*17,by)-.5)*.14;
    let c=n>.63?C.GR_B:n<.36?C.GR_D:C.GR_A;if(hash2((x>>1)+seed*5,(y>>2)*3+1)>.972)c=C.GR_T;else if(hash2((x>>2)*7+seed,(y>>1)*5+2)>.975)c=C.GR_X;
    GND[y*W+x]=c;GFR[y*W+x]=frost(c);}
  // art threshold map: about 6 seed blobs per 32 px tile, stored in 2x2 blocks, range about 4 to 55
  if(o.flat)TH.fill(4);
  else{const sx=[],sy=[];for(let ty=-1;ty<=(H>>5)+1;ty++)for(let tx=-1;tx<=(W>>5)+1;tx++)for(let k=0;k<6;k++){sx.push((tx+hash2(tx*7+k*13+seed,ty*11+k))*32);sy.push((ty+hash2(tx*5+k*3,ty*9+k*17+seed))*32);}
    for(let by=0;by<H;by+=2)for(let bx=0;bx<W;bx+=2){let m=1e9;for(let s=0;s<sx.length;s++){const dx=sx[s]-bx-1,dy=sy[s]-by-1;if(dx>24||dx<-24||dy>24||dy<-24)continue;const q=dx*dx+dy*dy;if(q<m)m=q;}
      const v=clamp(Math.round(4+Math.sqrt(m)*(o.thk||5.2)+(hash2(bx+seed,by)-.5)*5),4,55);for(let q=0;q<4;q++){const x=bx+(q&1),y=by+(q>>1);if(x<W&&y<H)TH[y*W+x]=v;}}}
  // short drift lines on about half of the tiles: a 1 px highlight over a 1 px shadow
  if(!o.flat)for(let ty=0;ty<=(H>>5);ty++)for(let tx=0;tx<=(W>>5);tx++){if(hash2(tx+seed*3,ty*7+1)>.6)continue;const lx=tx*32+3+((hash2(tx*3,ty+seed)*18)|0),ly=ty*32+4+((hash2(tx,ty*3+seed)*24)|0),len=5+((hash2(tx,ty+9+seed)*4)|0);
      for(let q=0;q<len;q++){const x=lx+q;if(x+1<W&&ly+1<H){MK[ly*W+x]=2;MK[(ly+1)*W+x+1]=1;}}}
  F.reset=fn=>{for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const v=clamp(Math.round(typeof fn==='function'?fn(x*2+1,y*2+1):fn),0,200);T[y*FW+x]=D[y*FW+x]=v;}P.fill(0);F.writes=0;F.stamps=0;};
  // the spill: an even ring of 10 deposits, or 10 deposits to both sides of a trench
  function ring(cx,cy,r,spill,side){if(spill<=0)return;const K=10,per=Math.max(1,Math.round(spill/K)),a0=rng()*6.283;
    for(let k=0;k<K&&spill>0;k++){let px,py;
      if(side){const sg=k&1?1:-1,rr=r+((k>>1)%4)*2,j=(((rng()*3)|0)-1)*2;px=Math.round(cx+side[0]*sg*rr-side[1]*j);py=Math.round(cy+side[1]*sg*rr+side[0]*j);}
      else{const a=a0+k*6.283/K;px=Math.round(cx+Math.cos(a)*r);py=Math.round(cy+Math.sin(a)*r*.9);}
      if(px<0||py<0||px>=W||py>=H)continue;const c=(py>>1)*FW+(px>>1);if(P[c]<200){const add=Math.min(per,spill,200-D[c]);D[c]+=add;spill-=add;F.writes++;}}}
  // a boot: 4x6 px (6x4 sideways) = 2x3 whole cells. Keeps 30%, packed 255, spills to the ring
  F.boot=(px,py,vert,ringOn)=>{const w=vert?2:3,h=vert?3:2,x0=px>>1,y0=py>>1;let spill=0;
    for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){if(x<0||y<0||x>=FW||y>=FH)continue;const q=y*FW+x,d=D[q],nd=(d*.3+.5)|0;spill+=d-nd;D[q]=nd;P[q]=255;F.writes+=2;}
    if(ringOn!==false)ring(px+(vert?2:3),py+(vert?3:2),4.8,spill);F.stamps++;};
  // the VFX #1 stamp: 2x2 px = one cell
  F.dot=(x,y)=>{const cx=clamp(Math.round(x/2),0,FW-1),cy=clamp(Math.round(y/2),0,FH-1),q=cy*FW+cx,d=D[q],nd=(d*.3)|0;D[q]=nd;P[q]=255;F.writes+=2;ring(x+1,y+1,3.2,d-nd);F.stamps++;};
  // the plough: a round brush of radius 5 px, floor at 40% of the ambient depth, spill to both sides
  F.trench=(cx,cy,amb,mx,my)=>{const R=5,lvl=(amb*.4)|0,m=Math.hypot(mx,my)||1;let spill=0;
    for(let y=Math.max(0,(cy-R)>>1);y<=Math.min(FH-1,(cy+R)>>1);y++)for(let x=Math.max(0,(cx-R)>>1);x<=Math.min(FW-1,(cx+R)>>1);x++){const dx=(x+.5)*2-cx,dy=(y+.5)*2-cy;if(dx*dx+dy*dy>R*R)continue;const q=y*FW+x,d=D[q];if(d>lvl){spill+=d-lvl;D[q]=lvl;F.writes++;}if(P[q]<160){P[q]=160;F.writes++;}}
    ring(cx,cy,R+2,spill,[-my/m,mx/m]);F.stamps++;};
  // note 13's first proposal: a bar 10 px wide and 4 px long, aligned to the grid, across the dominant axis of travel
  F.bar=(cx,cy,amb,mx,my)=>{const hz=Math.abs(mx)>=Math.abs(my),lvl=(amb*.4)|0,x0=(cx-(hz?2:5))>>1,y0=(cy-(hz?5:2))>>1,w=hz?2:5,h=hz?5:2,m=Math.hypot(mx,my)||1;let spill=0;
    for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){if(x<0||y<0||x>=FW||y>=FH)continue;const q=y*FW+x,d=D[q];if(d>lvl){spill+=d-lvl;D[q]=lvl;F.writes++;}if(P[q]<160){P[q]=160;F.writes++;}}
    ring(cx,cy,7,spill,hz?[0,1]:[1,0]);F.stamps++;};
  // the depth around a walker: 4 samples to the sides, skipping packed cells, as the Sandbox reads it
  const AX=[-9,9,-6,6],AY=[-1,-1,3,3];
  F.ambient=(x,y)=>{let s=0,n=0,s2=0,n2=0;for(let k=0;k<4;k++){const px=(x+AX[k])|0,py=(y+AY[k])|0;if(px<0||py<0||px>=W||py>=H)continue;const c=(py>>1)*FW+(px>>1);s2+=D[c];n2++;if(P[c]<110){s+=D[c];n++;}}return n?s/n:n2?s2/n2:0;};
  // snowfall: packed fades evenly, depth returns to its target
  let fa=0,ra=0;
  F.tick=(dt,fade,refill)=>{fa+=fade*dt;ra+=refill*dt;const f=fa|0,r=ra|0;fa-=f;ra-=r;if(!f&&!r)return;
    for(let q=0;q<NF;q++){if(f){const v=P[q];if(v)P[q]=v>f?v-f:0;}if(r){const d=D[q],t=T[q];if(d<t)D[q]=d+r>t?t:d+r;else if(d>t)D[q]=d-r<t?t:d-r;}}};
  F.packed=()=>{let n=0;for(let q=0;q<NF;q++)if(P[q]>84)n++;return n;};
  // render into a Uint32 buffer of W x H. cov and ds carry a 3 px margin that repeats the edge, so the canvas border draws no rim
  F.render=u=>{const S2=2*S,S3=3*S;
    for(let y=0;y<H;y++){const cy=y>>1,vy=(y&1)?(cy<FH-1?FW:0):(cy>0?-FW:0),rj=cy*FW;let i=y*W,k=(y+3)*S+3;
      for(let x=0;x<W;x++,i++,k++){const cx=x>>1,j=rj+cx,h=(x&1)?(cx<FW-1?1:0):(cx>0?-1:0);
        const d=(9*D[j]+3*D[j+h]+3*D[j+vy]+D[j+vy+h]+8)>>4;ds[k]=d;const pc=P[j],ph=P[j+h],pv=P[j+vy],pd=P[j+vy+h];let p=0;if(pc|ph|pv|pd)p=(9*pc+3*ph+3*pv+pd)>>4;
        cov[k]=p>84?(pc>200?7:3):(d+(p>>1)>TH[i]?1:0);}
      const r=(y+3)*S;for(let q=0;q<3;q++){cov[r+q]=cov[r+3];ds[r+q]=ds[r+3];cov[r+W+3+q]=cov[r+W+2];ds[r+W+3+q]=ds[r+W+2];}}
    for(let q=0;q<3;q++){cov.copyWithin(q*S,3*S,4*S);ds.copyWithin(q*S,3*S,4*S);cov.copyWithin((H+3+q)*S,(H+2)*S,(H+3)*S);ds.copyWithin((H+3+q)*S,(H+2)*S,(H+3)*S);}
    for(let y=0;y<H;y++){let i=y*W,k=(y+3)*S+3;const iu=y>0?-W:0;
      for(let x=0;x<W;x++,i++,k++){const c=cov[k];let col;
        if(c===0){col=ds[k]>=4?GFR[i]:GND[i];if(cov[k-S]===1&&ds[k-S]>TH[i+iu]+14)col=shd(col);u[i]=col;continue;}
        const d=ds[k],n=cov[k-S],w=cov[k-1],s=cov[k+S],e=cov[k+1];
        if(c===7)col=(n&2)&&(w&2)?C.SN_PSH:C.SN_PDK;
        else if(c&2)col=(n&2)+(w&2)+(s&2)+(e&2)<4?C.SN_BASE:((n===1||w===1||cov[k-S2]===1||cov[k-2]===1)&&(s&2)&&(e&2))?C.SN_PSH:C.SN_PACK;
        else if(s===0||e===0)col=((n===0)+(w===0)+(s===0)+(e===0)>=3)?C.SN_BASE:d>TH[i]+14?C.SN_SH:C.SN_MID;
        else if(n===0||w===0)col=C.SN_HI;
        else if(((n&2)&&(cov[k-S2]&2))||((w&2)&&(cov[k-2]&2)))col=C.SN_HI;
        else if(cov[k+S2]===0&&d>TH[i]+14)col=C.SN_SH;
        else{col=C.SN_BASE;if(d>=34){const m=MK[i];if(m)col=(m&1)?C.SN_MID:C.SN_HI;}}
        u[i]=col;}}};
  // outline the packed cells (for the trench figure)
  F.cells=u=>{for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){if(P[y*FW+x]<=84)continue;const i=(y*2)*W+x*2;u[i]=mixc(u[i],C.LAMP,.75);}};
  F.reset(o.depth===undefined?60:o.depth);return F;}

// a breath puff: 3 frames that grow from 2x2 to 5x4 px, a light cluster with a darker foot. (x, y) is its bottom centre
const PUF=[["##","##"],[".##.","####",".##."],[".###.","#####","#####",".###."]];
function drawPuff(u,W,H,x,y,k){const m=PUF[k],h=m.length,w=m[0].length;for(let r=0;r<h;r++)for(let q=0;q<w;q++){if(m[r][q]!=='#')continue;const xx=x+q-(w>>1),yy=y+r-h;if(xx<0||yy<0||xx>=W||yy>=H)continue;u[yy*W+xx]=r===h-1?C.SN_MID:C.BREATH;}}
// the Sandbox's footfall: two rows of prints 6 px apart, each print snapped to whole cells. f = walk frame 0 or 2
function footfall(F,fx,fy,d,f,ringOn){let px,py;
  if(d<2){const xl=(fx-5)&~1;px=((f===0)===(d===0))?xl+6:xl;py=(d===0?fy-4:fy-6)&~1;}
  else{const yt=(fy-8)&~1;py=f===0?yt:yt+6;px=(d===2?fx:fx-6)&~1;}
  F.boot(px,py,d<2,ringOn);return [px,py];}
// the VFX #1 dots: one 2x2 stamp per 4 px of travel, feet alternate
function dotfall(F,fx,fy,d,foot){const side=foot?1:-1,hz=d>=2;F.dot(fx+(hz?0:side*1.5)-1,fy+(hz?side*.8:0)-1);}
// time one boot stamp in this browser: the median of 7 runs of 2,000 stamps on a scratch field
let stampUs=-1;
function benchStamp(){if(stampUs>=0)return stampUs;const F=mkField(160,96,{seed:9,flat:true}),r=[];
  for(let k=0;k<7;k++){F.reset(60);const t0=performance.now();for(let q=0;q<2000;q++)footfall(F,17+((q*37)%120),20+((q*53)%60),q&3,q&2,true);r.push((performance.now()-t0)/2000*1000);}
  r.sort((a,b)=>a-b);stampUs=r[3];return stampUs;}

// ======================================================================
// D1 boot prints on contact frames
// ======================================================================
reg('bootprints',root=>{const c=ctl(root),cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),ro=$('[data-ro]',root),frs=$$('[data-fr] span',root),play=$('[data-b="play"]',root);
  follow(cvs[0].parentElement,$('[data-fr]',root));
  const FA=mkField(104,40,{seed:3,flat:true,depth:60}),FB=mkField(160,112,{seed:5,depth:60});
  const PTS=[[33,40],[129,40],[129,104],[33,104]],LEN=[96,64,96,64],TOT=320,DIRS=[2,0,3,1],DN=['down','up','right','left'];
  let s=0,gf=-1,dk=-1,playing=true,mode='boot',us=-1;
  const pos=q=>{q=((q%TOT)+TOT)%TOT;let k=0;while(q>=LEN[k]){q-=LEN[k];k++;}const a=PTS[k],b=PTS[(k+1)%4],t=q/LEN[k];return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),DIRS[k]];};
  function adv(to){s=to;
    if(mode==='boot'){const g=Math.floor(s/8+1e-6);while(gf<g){gf++;const f=gf&3;if(f===0||f===2){const p=pos(gf*8);footfall(FB,p[0],p[1],p[2],f,true);}}dk=Math.floor(s/4+1e-6);}
    else{const g=Math.floor(s/4+1e-6);while(dk<g){dk++;const p=pos(dk*4);dotfall(FB,p[0],p[1],p[2],dk&1);}gf=Math.floor(s/8+1e-6);}}
  c.btn('play',()=>{playing=!playing;play.textContent=playing?'Pause':'Play';play.setAttribute('aria-pressed',String(!playing));});
  c.btn('step',()=>{if(playing){playing=false;play.textContent='Play';play.setAttribute('aria-pressed','true');}adv((Math.floor(s/8+1e-6)+1)*8);});
  c.seg('st',v=>{mode=v;});c.on('grid',()=>{});
  function strip(dir,f){FA.reset(60);const u=A.u32;
    // each cell shows the ground as it is on that frame: a contact frame has its print under the planted boot, a passing frame has it 8 px behind
    const bx=dir===2?-1:dir===3?1:0,by=dir===0?-1:dir===1?1:0;
    for(let q=0;q<4;q++){const fx=13+26*q,fy=34,back=(q&1)*8;if(mode==='boot')footfall(FA,fx+bx*back,fy+by*back,dir,q&2,true);else{dotfall(FA,fx,fy,dir,0);dotfall(FA,fx+bx*4,fy+by*4,dir,1);}}
    FA.render(u);for(let q=0;q<4;q++)drawChar(u,104,40,0,dir,q,13+26*q,34,0);
    box(u,104,40,26*f,0,26,40,C.LAMP);A.put();frs.forEach((e,q)=>e.classList.toggle('on',q===f));}
  function tick(dt){if(playing)adv(s+80*dt);FB.tick(dt,55,14);
    const p=pos(s),f=Math.floor(s/8+1e-6)&3,u=B.u32;FB.render(u);if(c.v('grid'))gridOv(u,160,112,17,16);
    drawChar(u,160,112,0,p[2],f,p[0],p[1],0);B.put();strip(p[2],f);
    if(us<0)us=benchStamp();
    setHud(root,`frame ${f} · ${f&1?'passing':'contact'}`);
    ro.innerHTML=`Frame <b>${f}</b> of 0 to 3, ${f&1?'a passing pose with the body 1 px up':'a contact frame that stamps the '+(f===0?'left':'right')+' print'}. Walking ${DN[p[2]]}, 8 px per frame, 100 ms per frame at 400 ms per tile.`+
      `<br>${mode==='boot'?'Boot print <b>4x6 px</b>, 6x4 px sideways, 2x3 cells of the 1:2 field. Keeps 30% of the depth. Rows 6 px apart, one print per foot every 32 px.':'VFX #1 stamp, <b>2x2 px</b> every 4 px of travel. One cell of the 1:2 field, 1/16 of a tile wide.'} Packed cells now: ${FB.packed()}.`+
      `<br>Report, measured: a boot stamp costs <b>0.16 µs</b> at 1:2 on the desktop median and 0.95 µs under the 6x throttle. In this browser: ${us<.01?'under 0.01':us.toFixed(2)} µs per stamp, the median of 7 runs of 2,000.`;}
  return {tick};});

// ======================================================================
// tile-to-tile walkers shared by tilemark and crowd
// ======================================================================
function mkTileWalker(tx,ty,set,rng,T){const w={tx,ty,nx:tx,ny:ty,p:rng(),dir:0,set,fr:4,feet:2,T:T||.4,x:0,y:0,started:false};return w;}
// pick the next tile: keep going 60% of the time, never reverse unless boxed in
function nextTile(w,rng,TW,TH){const DX=[0,0,1,-1],DY=[1,-1,0,0],opts=[];for(let d=0;d<4;d++){const x=w.tx+DX[d],y=w.ty+DY[d];if(x<0||y<0||x>=TW||y>=TH)continue;if((d^1)===w.dir&&w.started)continue;opts.push(d);}
  let d;if(opts.includes(w.dir)&&rng()<.6)d=w.dir;else d=opts.length?opts[(rng()*opts.length)|0]:(w.dir^1);w.dir=d;w.nx=w.tx+DX[d];w.ny=w.ty+DY[d];w.started=true;}

// ======================================================================
// D2 one mark per tile left
// ======================================================================
reg('tilemark',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=104,OY=8,TW=5,THt=3,u=X.u32,ro=$('[data-ro]',root);
  const F=mkField(W,H,{seed:8,depth:70}),BG=new Uint32Array(W*H);F.render(BG);
  const rng=mkRng(41),M=new Uint8Array(W*H);
  const ws=[];for(let k=0;k<6;k++)ws.push(mkTileWalker([0,4,2,1,3,2][k],[0,2,1,2,0,0][k],k,rng));
  // per tile: age of the mark in seconds (-1 = none) and the direction it was left in
  const age=new Float32Array(TW*THt).fill(-1),mdir=new Uint8Array(TW*THt);
  let mode='em',made=0;c.seg('m',v=>{mode=v;age.fill(-1);made=0;});c.on('n',()=>{});c.on('grid',()=>{});
  // a boot print as a hole: dark line on its north and west inner edge, floor, highlight on the far rim
  const BM=[["####","....","####","####","####",".##."],[".##.","####","####","####","....","####"],["#.###.","#.####","#.####","#.###."],[".###.#","####.#","####.#",".###.#"]];
  function printAt(x0,y0,d,fl,dk,hi){const m=BM[d],h=m.length,w=m[0].length,on=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&m[y][x]==='#';
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(!on(x,y))continue;const X0=x0+x,Y0=y0+y;if(X0<0||Y0<0||X0>=W-1||Y0>=H-1)continue;u[Y0*W+X0]=(on(x,y-1)&&on(x-1,y))?fl:dk;
      if(hi){if(!on(x,y+1)&&y===h-1)u[(Y0+1)*W+X0]=hi;if(!on(x+1,y)&&x===w-1)u[Y0*W+X0+1]=hi;}}}
  function pair(t,d,fl,dk,hi){const x0=(t%TW)*32,y0=OY+((t/TW)|0)*32;
    if(d<2){printAt(x0+18,y0+(d===0?4:3),d,fl,dk,hi);printAt(x0+10,y0+(d===0?20:19),d,fl,dk,hi);}
    else{printAt(x0+(d===2?4:3),y0+10,d,fl,dk,hi);printAt(x0+(d===2?20:19),y0+18,d,fl,dk,hi);}}
  function tick(dt){const n=c.v('n');c.out('n',n);
    for(let k=0;k<n;k++){const w=ws[k];w.p+=dt/w.T;
      if(w.p>=1){w.p-=1;w.tx=w.nx;w.ty=w.ny;const t=w.ty*TW+w.tx,od=w.dir;nextTile(w,rng,TW,THt);
        if(mode==='tb'){if(age[t]<0){age[t]=0;mdir[t]=od;made++;}}else{age[t]=0;mdir[t]=w.dir;made++;}}
      w.fr=Math.min((w.p*4)|0,3);w.x=Math.round((w.tx+(w.nx-w.tx)*w.p)*32+17);w.y=Math.round(OY+(w.ty+(w.ny-w.ty)*w.p)*32+24);}
    const life=mode==='em'?57/60:mode==='pt'?32/30:10;let liveN=0;
    u.set(BG);
    for(let t=0;t<TW*THt;t++){if(age[t]<0)continue;age[t]+=dt;if(age[t]>=life){age[t]=-1;continue;}liveN++;const a=age[t];
      if(mode==='em'){if(a>41/60&&(((a-41/60)*60)|0)&4)continue;pair(t,mdir[t],C.SN_PSH,C.SN_PDK,C.SN_HI);}
      else if(mode==='pt'){const k=a<16/30?0:(a-16/30)/(16/30);if(k<.34)pair(t,mdir[t],C.SN_PSH,C.SN_PDK,C.SN_HI);else if(k<.67)pair(t,mdir[t],C.SN_PACK,C.SN_PSH,0);else pair(t,mdir[t],C.SN_BASE,C.SN_MID,0);}
      else{const x0=(t%TW)*32,y0=OY+((t/TW)|0)*32;printAt(x0+18,y0+3,0,C.SN_PSH,C.SN_PDK,C.SN_HI);printAt(x0+10,y0+19,1,C.SN_PSH,C.SN_PDK,C.SN_HI);printAt(x0+3,y0+11,2,C.SN_PSH,C.SN_PDK,C.SN_HI);printAt(x0+21,y0+23,3,C.SN_PSH,C.SN_PDK,C.SN_HI);
        dg(u,W,H,x0+3,y0+3,Math.ceil(10-a),C.SN_SH);}}
    if(c.v('grid'))gridOv(u,W,H,0,OY);
    M.fill(0);const order=ws.slice(0,n).sort((a,b)=>a.y-b.y);for(const w of order)drawChar(u,W,H,w.set,w.dir,w.fr,w.x,w.y,0,{M});
    X.put();
    setHud(root,mode==='em'?'Emerald':mode==='pt'?'Platinum':'Tibia');
    const per=n*life/.4;
    ro.innerHTML=`Live marks <b>${liveN}</b> on 15 tiles, ${n} walker${n>1?'s':''}, 400 ms per tile. `+
      (mode==='em'?`Each mark shows for 41 frames and blinks until frame 57, about 0.95 s at 60 frames per second. That is about ${per.toFixed(1)} live marks for these walkers, out of Emerald's pool of <b>64 sprites</b> for everything on screen.`:
       mode==='pt'?`Each mark holds 16 ticks and fades over 16 more. With a tick of 1/30 s, which is this figure's assumption, that is about 1.07 s and ${per.toFixed(1)} live marks for these walkers.`:
       `A swapped tile reverts after <b>10 s</b>, however often it is walked on in between. The state is the tile's item id, so there is no sprite pool, and every player sees the same prints. Cost per print: two tile-change messages.`)+
      `<br>Pools in the report: Emerald 64 sprites, Quake 3 256 marks. 100 prints per second with a 10 s life would be 1,000 live decals.`;}
  return {tick};});

// ======================================================================
// D3 sinking by clipping, with a front rim
// ======================================================================
reg('sink',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=80,u=X.u32,ro=$('[data-ro]',root);
  const F=mkField(W,H,{seed:12,depth:90}),BG=new Uint32Array(W*H);F.render(BG);let t=0;
  const FY=62,XS=[19,47,75];
  ['sink','rim','walk'].forEach(k=>c.on(k,()=>{}));
  function tick(dt){t+=dt;const sk=c.v('sink'),rim=c.v('rim'),walk=c.v('walk'),fr=walk?((t/.1)|0)&3:4;c.out('sink',sk+' px');
    u.set(BG);
    // the foot line: where the boots stood before the snow
    for(let k=0;k<3;k++)drawChar(u,W,H,0,[0,2,1][k],fr,XS[k],FY,sk,{rim});
    // magnified lower body of the front view, 3x
    const ZX=87,ZY=11,sx0=XS[0]-12,sy0=FY-17;
    for(let y=0;y<19;y++)for(let x=0;x<24;x++){const v=u[(sy0+y)*W+sx0+x];for(let q=0;q<9;q++)u[(ZY+y*3+((q/3)|0))*W+ZX+x*3+(q%3)]=v;}
    box(u,W,H,ZX-1,ZY-1,74,59,C.OUTL);
    // tick marks on the magnifier at the foot line
    rect(u,W,H,ZX-1,ZY+17*3+2,3,1,C.LAMP);rect(u,W,H,ZX+70,ZY+17*3+2,3,1,C.LAMP);
    X.put();
    const boots=Math.max(0,3-sk),trou=Math.max(0,3-Math.max(0,sk-3)),left=boots+trou,coat=Math.max(0,sk-6),seen=rim&&sk>=2?Math.max(0,left-3):left;
    setHud(root,`sink ${sk} px · legs ${left} of 6 rows`);
    ro.innerHTML=`Sink <b>${sk} px</b>. The sprite is drawn ${sk} px lower and its bottom ${sk} rows are discarded. Legs left by the clip: <b>${left} of 6 rows</b> (${boots} of 3 boot rows, ${trou} of 3 trouser rows)${coat?`, and ${coat} rows of the coat are gone too`:''}.`+
      `<br>${sk===0?'No sink. Sink starts at 40 depth units with the 6 px cap.':sk<=6?`With the 6 px cap this is reached at ${sk*20} depth units, 2 px per 40 units. With the 12 px cap at ${sk*10} units.`:`Past the 6 px cap. With the 12 px cap this is reached at ${sk*10} depth units, 2 px per 20 units.`} ${sk===6?'This is the cap for weather snow.':sk===12?'This is the cap for authored deep snow, Platinum\'s first tier.':sk===8?'The report warns that 8 px of clipping buries the whole leg of a chibi sprite.':''}`+
      `<br>Rim ${sk<2?'not drawn below 2 px of sink':rim?`on. Its 3 rows cover the lowest rows that the clip left, so ${seen} leg row${seen===1?'':'s'} still show`:'off, the cut is a straight line'}. The shadow shrinks 2 px per 4 px of sink. Report, measured: 20 sprites with clip, shadow and rim cost 0.022 ms on the desktop median, 0.123 ms under the 6x throttle.`;}
  return {tick};});

// ======================================================================
// free walking with the Sandbox's rules: 8 px per frame, boots on frames 0 and 2,
// a trench every 2 px once the sink is 4 px or more
// ======================================================================
function mkFree(set){return {x:0,y:0,dir:2,fr:4,ph:0,moving:false,trd:0,sink:0,amb:0,set:set||0,kick:null};}
function freeStep(F,a,mx,my,o){const m=Math.hypot(mx,my);a.x+=mx;a.y+=my;if(m<.001){a.moving=false;a.fr=4;return;}
  if(Math.abs(mx)>Math.abs(my)+.01)a.dir=mx>0?2:3;else a.dir=my>0?0:1;
  const fx=Math.round(a.x),fy=Math.round(a.y),deep=a.sink>=4;
  if(!a.moving){a.moving=true;a.ph=0;a.fr=0;if(!deep)footfall(F,fx,fy,a.dir,0,true);if(a.kick)a.kick(fx,fy,deep);}
  else{a.ph+=m/8;const f=(a.ph|0)&3;if(f!==a.fr){a.fr=f;if(f===0||f===2){if(!deep)footfall(F,fx,fy,a.dir,f,true);if(a.kick)a.kick(fx,fy,deep);}}}
  if(deep){a.trd+=m;if(a.trd>=2){a.trd=0;(o&&o.bar?F.bar:F.trench)(fx,fy-3,a.amb,mx,my);}}}
const sinkOf=(amb,cap)=>cap?Math.min(cap,2*((amb*cap/240)|0)):0;
const bandOf=d=>d<10?0:d<40?1:d<80?2:3,SLOW=[1,.85,.7,.5];

// ======================================================================
// D4 the trench in deep snow
// ======================================================================
reg('trench',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=96,u=X.u32,ro=$('[data-ro]',root);
  follow(cv.parentElement,$('.s3-scale',root));
  const F=mkField(W,H,{seed:21});const dep=x=>16+118*x/159;F.reset((x,y)=>dep(x));
  const PTS=[[-14,34],[30,62],[64,38],[102,70],[134,44],[176,66]],a=mkFree(0);let seg=0,wait=0,bar=false;
  a.x=PTS[0][0];a.y=PTS[0][1];
  c.seg('b',v=>{bar=v==='bar';});c.on('cells',()=>{});
  function tick(dt){F.tick(dt,13,10);
    if(wait>0){wait-=dt;if(wait<=0){a.x=PTS[0][0];a.y=PTS[0][1];seg=0;a.moving=false;}}
    else{a.amb=Math.min(F.ambient(a.x,a.y),dep(clamp(a.x,0,159)));a.sink=sinkOf(a.amb,6);const sp=80*SLOW[bandOf(a.amb)];let left=sp*dt;
      while(left>0&&seg<PTS.length-1){const b=PTS[seg+1],dx=b[0]-a.x,dy=b[1]-a.y,L=Math.hypot(dx,dy);if(L<.01){seg++;continue;}const st=Math.min(left,L,2);
        freeStep(F,a,dx/L*st,dy/L*st,{bar});left-=st;if(st>=L-1e-6)seg++;}
      if(seg>=PTS.length-1)wait=3;}
    F.render(u);if(c.v('cells'))F.cells(u);
    if(wait<=0)drawChar(u,W,H,0,a.dir,a.moving?a.fr:4,Math.round(a.x),Math.round(a.y),a.sink);
    X.put();
    const d=Math.round(a.amb),deep=a.sink>=4,bn=bandOf(a.amb);
    setHud(root,wait>0?'':`depth ${d} · sink ${a.sink} px · ${deep?'trench':'boots'}`);
    ro.innerHTML=(wait>0?'The walker is off screen. The trench fills in behind it.':`Depth around the walker <b>${d}</b> units, sink <b>${a.sink} px</b>, tile band ${bn}, speed x${SLOW[bn]}. ${deep?`Ploughing with the ${bar?'grid-aligned bar, 10x4 px':'round brush, radius 5 px'}, one stamp per 2 px, floor at ${(a.amb*.4)|0} units, 40% of the depth.`:'Stamping boots, 4x6 px, on frames 0 and 2.'}`)+
      `<br>Sink is 2 px per 40 units with the 6 px cap, so boots stamp up to depth 79 and the trench starts at 80.`+
      `<br>Report, measured: a trench piece costs <b>0.28 µs</b> at 1:2 on the desktop median and 1.66 µs under the 6x throttle. A boot stamp costs 0.16 µs.`;}
  return {tick};});

// ======================================================================
// D5 stride and walk-cycle timing
// ======================================================================
reg('stride',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=72,u=X.u32,ro=$('[data-ro]',root),tl=$('[data-tl]',root),cur=$('[data-cur]',root),cells=$$('span',tl);
  follow(cv.parentElement,tl);
  const F=mkField(W,H,{seed:31,depth:60}),FY=52,WRAP=192;let s=0,mode='fit',gs=-1;
  c.seg('m',v=>{mode=v;gs=Math.floor(s/(v==='fit'?16:40)+1e-6);});c.on('t',()=>{});
  const wx=q=>Math.round(((q%WRAP)+WRAP)%WRAP)-16;
  function tick(dt){const T=c.v('t');c.out('t',T+' ms');const v=32/(T/1000);s+=v*dt;
    // a step is 16 px of travel when the cycle fits the tile, 40 px at 1.25 tiles per step
    const SL=mode==='fit'?16:40,g=Math.floor(s/SL+1e-6);
    while(gs<g){gs++;const at=gs*SL,x=wx(at);if(x>-10&&x<W+4)footfall(F,x,FY,2,(gs&1)?2:0,true);}
    const ph=(s/SL)%2,f=Math.min((ph*2)|0,3),p=(s/32)%1;
    F.tick(dt,55,14);F.render(u);gridOv(u,W,H,0,28);
    drawChar(u,W,H,0,2,f,wx(s),FY,0);X.put();
    cur.style.left=(p*100)+'%';cells.forEach((e,q)=>e.classList.toggle('on',q===f));
    setHud(root,`p ${p.toFixed(2)} · frame ${f}`);
    const ft=mode==='fit'?T/4:T*1.25/2;
    ro.innerHTML=`Tile time <b>${T} ms</b>, ${(1000/T).toFixed(2)} tiles per second, ${v.toFixed(0)} px/s. `+
      (mode==='fit'?`One 4-frame cycle per tile. Frame time <b>${ft.toFixed(1)} ms</b>, a step every ${(T/2).toFixed(0)} ms. Prints land on the same two spots of every tile, 16 px apart.`:
        `One step per 1.25 tiles. Frame time ${ft.toFixed(1)} ms, a step every ${(T*1.25).toFixed(0)} ms. The body moves <b>40 px</b> per step and the drawn legs span 16 px, so each planted boot skates 24 px. Prints land 40 px apart.`)+
      `<br>Network cost of the prints: 0 bytes. Each client derives both prints from the step timer.`;}
  return {tick};});

// ======================================================================
// D6 shadow, breath, kicked snow and snow on hat and shoulders
// ======================================================================
reg('smallcues',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=104,H=64,u=X.u32,ro=$('[data-ro]',root),rng=mkRng(77);
  const F=mkField(W,H,{seed:44,thk:2}),a=mkFree(0),parts=[],fl=[],dep=x=>x<46?38:x<58?38+(x-46)*4.4:90;F.reset((x,y)=>dep(x));
  for(let k=0;k<14;k++)fl.push([rng()*W,rng()*H,k%3===0?3:2,26+rng()*30]);
  a.x=21;a.y=46;let st='idle',idle=0,tgt=85,nextB=1.2,puff=-1;
  a.kick=(fx,fy,deep)=>{if(!deep||!c.v('ki'))return;const n=2+((rng()*2)|0);for(let k=0;k<n;k++)parts.push({x:fx+(rng()-.5)*8,y:fy-1+(rng()-.5)*3,z:1,vx:(rng()-.5)*26,vz:16+rng()*20,life:.25+rng()*.15});};
  ['sh','br','ki','hs','temp'].forEach(k=>c.on(k,()=>{}));
  c.btn('walk',()=>{if(st==='idle'){st='walk';tgt=a.x<52?85:21;}});
  function tick(dt){const temp=c.v('temp');c.out('temp',temp+' °C');F.tick(dt,26,12);
    a.amb=dep(a.x);a.sink=sinkOf(a.amb,6);
    if(st==='walk'){const dx=tgt-a.x,sp=80*SLOW[bandOf(a.amb)],stp=Math.min(Math.abs(dx),sp*dt);let left=stp;while(left>0){const q=Math.min(left,2);freeStep(F,a,Math.sign(dx)*q,0);left-=q;}idle=0;
      if(Math.abs(tgt-a.x)<.5){st='idle';a.moving=false;a.fr=4;a.dir=0;nextB=.9;}}
    else{idle+=dt;if(idle>8.5){st='walk';tgt=a.x<52?85:21;}
      nextB-=dt;if(nextB<=0){nextB=3+rng();if(temp<1&&c.v('br')){puff=0;}}}
    if(puff>=0){puff+=dt;if(puff>=.45)puff=-1;}
    for(let k=parts.length-1;k>=0;k--){const p=parts[k];p.life-=dt;if(p.life<=0){parts.splice(k,1);continue;}p.x+=p.vx*dt;p.z+=p.vz*dt;p.vz-=90*dt;if(p.z<0)p.z=0;}
    F.render(u);
    const fx=Math.round(a.x),fy=Math.round(a.y),snowy=st==='idle'?Math.min(1,idle/9):0,lv=c.v('hs')?(snowy>.65?4:snowy>.3?1:0):0;
    drawChar(u,W,H,0,a.dir,a.moving?a.fr:4,fx,fy,a.sink,{shadow:c.v('sh'),snow:lv});
    if(puff>=0)drawPuff(u,W,H,fx+3+((puff*12)|0),fy-10+a.sink+((puff*5)|0),Math.min(2,(puff/.15)|0));
    for(const p of parts){const x=Math.round(p.x),y=Math.round(p.y-p.z);if(x<1||y<1||x>=W-1||y>=H-1)continue;u[y*W+x]=u[y*W+x+1]=C.SN_HI;if(p.life>.15){u[(y+1)*W+x]=u[(y+1)*W+x+1]=C.SN_MID;}}
    // a light snowfall in whole-pixel steps
    for(const f of fl){f[1]+=f[3]*dt;if(f[1]>H+4){f[1]=-4;f[0]=rng()*W;}const x=f[0]|0,y=f[1]|0;if(x<1||y<1||x>=W-2||y>=H-2)continue;
      if(f[2]===2){u[y*W+x]=u[y*W+x+1]=u[(y+1)*W+x]=u[(y+1)*W+x+1]=C.FLAKE_M;}else{u[y*W+x+1]=u[(y+1)*W+x]=u[(y+1)*W+x+1]=u[(y+1)*W+x+2]=u[(y+2)*W+x+1]=C.SN_HI;}}
    X.put();
    setHud(root,st==='walk'?`walking · sink ${a.sink} px`:`idle ${idle.toFixed(1)} s${lv===4?' · snow, 2 rows':lv===1?' · snow, 1 px line':''}`);
    ro.innerHTML=`${st==='walk'?`Walking through snow of depth ${Math.round(a.amb)}, sink ${a.sink} px, speed x${SLOW[bandOf(a.amb)]} in tile band ${bandOf(a.amb)}. ${a.sink>=4?'The boots are hidden, so each contact kicks specks and the walker ploughs.':'The boots show, so the walker stamps prints and kicks nothing.'}`:`Standing for <b>${idle.toFixed(1)} s</b> of a 9 s idle timer in snow of depth ${Math.round(a.amb)}, sink ${a.sink} px. A 1 px line of snow on hat and shoulders at 2.7 s (0.3), a second row on both at 5.9 s (0.65).`}`+
      `<br>Shadow ${c.v('sh')?'on, a 14x5 px ellipse 3 px above the feet, 2 px smaller per 4 px of sink':'off'}. Breath ${!c.v('br')?'off':temp<1?'on, a 3-frame puff every 3 to 4 s when idle':'waits, because '+temp+' °C is not below 1 °C'}. Kicked snow ${c.v('ki')?'on, 2 to 3 specks per contact at a sink of 4 px or more':'off'}. Snow on the body ${c.v('hs')?'on, drawn as the Sandbox draws it. The report\'s proposal is a 2 px cap on the hat and 2x2 px on each shoulder':'off'}.`+
      `<br>Cost: not measured in the report. With 20 players breath is at most about 100 live puffs.`;}
  return {tick};});

// ======================================================================
// D7 the crowd budget
// ======================================================================
reg('crowd',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=320,H=180,u=X.u32,ro=$('[data-ro]',root),items=$$('[data-drop] li',root),rng=mkRng(5),OY=12,TW=10,THt=5;
  const F=mkField(W,H,{seed:52,depth:60}),M=new Uint8Array(W*H),ws=[],parts=[],mS=mtr(.06),mR=mtr(.06);
  for(let k=0;k<100;k++){const w=mkTileWalker((rng()*TW)|0,(rng()*THt)|0,k===0?0:1+(k%6),rng,.4);w.br=rng()*3.5;w.puff=-1;ws.push(w);}
  let us=-1,win=0,ws0=0,ww0=0,sps=0,bps=0;
  ['n','drop'].forEach(k=>c.on(k,()=>{}));
  function tick(dt){const n=c.v('n'),drop=c.v('drop');c.out('n',n);c.out('drop',drop===0?'nothing dropped':'steps 1 to '+drop);items.forEach((e,q)=>e.classList.toggle('off',q<drop));
    F.tick(dt,13,5);const me=ws[0];
    // movement and stamps, timed
    const t0=performance.now(),s0=F.stamps;
    for(let k=0;k<n;k++){const w=ws[k],own=k===0;w.p+=dt/w.T;let due=w.p>=.5?2:1;
      if(w.p>=1){if(w.feet<2&&(own||drop<4))footfall(F,w.x,w.y,w.dir,2,drop<3||own);w.p-=1;w.tx=w.nx;w.ty=w.ny;nextTile(w,rng,TW,THt);w.feet=0;due=w.p>=.5?2:1;}
      w.fr=Math.min((w.p*4)|0,3);w.x=Math.round((w.tx+(w.nx-w.tx)*w.p)*32+17);w.y=Math.round(OY+(w.ty+(w.ny-w.ty)*w.p)*32+24);
      while(w.feet<due){const f=w.feet===0?0:2;if(own||drop<4){footfall(F,w.x,w.y,w.dir,f,drop<3||own);if(own||drop<1)for(let q=0;q<2;q++)parts.push({x:w.x+(rng()-.5)*8,y:w.y-1,z:1,vx:(rng()-.5)*24,vz:14+rng()*18,life:.25+rng()*.15});}w.feet++;}
      w.br-=dt;if(w.br<=0){w.br=3+rng();const far=Math.hypot(w.x-me.x,w.y-me.y)>256;if(own||drop<2||!far)w.puff=0;}if(w.puff>=0){w.puff+=dt;if(w.puff>=.45)w.puff=-1;}}
    mS.add(performance.now()-t0);
    win+=dt;if(win>=1){sps=(F.stamps-ws0)/win;bps=(F.writes-ww0)/win;ws0=F.stamps;ww0=F.writes;win=0;}
    for(let k=parts.length-1;k>=0;k--){const p=parts[k];p.life-=dt;if(p.life<=0){parts[k]=parts[parts.length-1];parts.pop();continue;}p.x+=p.vx*dt;p.z+=p.vz*dt;p.vz-=90*dt;if(p.z<0)p.z=0;}
    mR.a();F.render(u);M.fill(0);
    const order=ws.slice(0,n).sort((a,b)=>a.y-b.y);for(const w of order){drawChar(u,W,H,w.set,w.dir,w.fr,w.x,w.y,0,{M});
      if(w.puff>=0&&w.dir!==1)drawPuff(u,W,H,w.x+(w.dir===2?10:w.dir===3?-10:0),w.y-13-((w.puff*8)|0),Math.min(2,(w.puff/.15)|0));}
    for(const p of parts){const x=Math.round(p.x),y=Math.round(p.y-p.z);if(x<1||y<1||x>=W-1||y>=H-1)continue;u[y*W+x]=u[y*W+x+1]=C.SN_HI;u[(y+1)*W+x]=u[(y+1)*W+x+1]=C.SN_MID;}
    mR.b();X.put();
    if(us<0)us=benchStamp();
    setHud(root,`${n} walkers · ${Math.round(sps)} stamps/s`);
    ro.innerHTML=`Live here: <b>${nf(sps)}</b> stamps per second and <b>${nf(bps)}</b> byte writes per second into the field, ${sps>0?(bps/sps).toFixed(0):'0'} per stamp. ${nf(F.packed())} of 14,400 cells are packed. ${parts.length} specks alive.`+
      `<br>Report, arithmetic: 20 players at 400 ms per tile make 100 stamps and about 2,500 byte writes per second. 100 players make about 12,500.`+
      `<br>Live in this browser: movement and stamping take <b>${f3(mS.v)} ms</b> per frame, and drawing the ground and ${n} sprites takes ${f3(mR.v)} ms. One boot stamp costs ${us<.01?'under 0.01':us.toFixed(2)} µs here. Report, measured: 0.16 µs on the desktop median, 0.95 µs under the 6x throttle.`;}
  return {tick};});

// ======================================================================
// log-scale bar chart shared by groundcost, nogpu and costs
// rows: {lab, sub, b:[{v, s, col} or {none:'text'}]}. o: {lo, hi, lines:[[value, text, colour, dy]]}
// ======================================================================
function logBars(svg,rows,o){svg.innerHTML='';const nar=svg.getBoundingClientRect().width<520,LO=o.lo,HI=o.hi,VW=nar?360:600,x0=nar?12:292,x1=nar?250:500,y0=34,n=rows.length;
  // text is styled inline, because the page CSS sets a size and a fill on every chart text
  const tx=(x,y,t,size,fill,anchor)=>{const e=svgEl('text',{x,y,style:`font-size:${size}px;fill:${fill}`+(anchor?`;text-anchor:${anchor}`:'')},svg);e.textContent=t;return e;};
  const dk=c=>.299*parseInt(c.slice(1,3),16)+.587*parseInt(c.slice(3,5),16)+.114*parseInt(c.slice(5,7),16)<140;
  const hs=rows.map(r=>{const nb=r.b.length;return nar?(r.sub?37:26)+nb*13+5:Math.max(r.sub?30:20,nb*13+4)+5;});
  const hgt=y0+hs.reduce((a,b)=>a+b,0)+38;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);
  const Xv=v=>x0+(Math.log10(Math.max(10**LO,v))-LO)/(HI-LO)*(x1-x0),yb=hgt-34;
  for(let e=LO;e<=HI;e++){const v=10**e;svgEl('line',{x1:Xv(v),x2:Xv(v),y1:y0-6,y2:yb,stroke:'#1a2338'},svg);tx(Xv(v),yb+13,v>=1?String(v):String(+v.toFixed(4)),10,'#8c98b0','middle');}
  tx(x1,yb+27,o.axis||'ms per frame, log scale',10.5,'#8c98b0','end');
  for(const [v,t,col,dy] of o.lines||[]){svgEl('line',{x1:Xv(v),x2:Xv(v),y1:y0-8-dy,y2:yb,stroke:col,'stroke-width':1.5,'stroke-dasharray':'4 3'},svg);tx(Xv(v)+4,y0-10-dy,t,10.5,col,'start');}
  const bar=(b,y)=>{if(b.none){tx(x0+3,y+9,b.none,10,'#7d899f');return;}
    svgEl('rect',{x:x0,y,width:Math.max(1.5,Xv(b.v)-x0),height:10,fill:b.col,rx:1},svg);const fits=Xv(b.v)+5+b.s.length*5.6<VW-2;
    if(fits)tx(Xv(b.v)+5,y+8.6,b.s,10,'#eef2f8').style.cssText+=';paint-order:stroke;stroke:#090d16;stroke-width:3px;stroke-linejoin:round';else tx(Xv(b.v)-4,y+8.6,b.s,10,dk(b.col)?'#eef2f8':'#0c111b','end');};
  let y=y0;rows.forEach((r,i)=>{
    if(nar){tx(x0,y+10,r.lab,11,'#dbe2ee');if(r.sub)tx(x0,y+21,r.sub,9.5,'#8c98b0');r.b.forEach((b,q)=>bar(b,y+(r.sub?26:15)+q*13));}
    else{tx(8,y+11,r.lab,11.5,'#dbe2ee');if(r.sub)tx(8,y+23,r.sub,9.5,'#8c98b0');r.b.forEach((b,q)=>bar(b,y+2+q*13));}
    y+=hs[i];});}
const KC={desk:'#8fb3de',thr:'#4d6890',gpu:'#ffd27a',sw:'#ff8f7a',swthr:'#a35a52',live:'#b5d98a',pick:'#e9a0d6'};
const pct=v=>{const p=v/16.7*100;return p<1?p.toFixed(1)+'%':Math.round(p)+'%';};
const legHtml=l=>l.map(([k,t])=>`<span><i style="background:${KC[k]||k}"></i>${t}</span>`).join('')+'<span><i style="background:#ff6b5e"></i>16.7 ms frame</span>';
const FRAME=[[16.7,'16.7 ms frame','#ff6b5e',0]];

// ======================================================================
// F1 the ground render. Every number is copied from the tables of section 6a.
// rows: [label, profiles, desktop median, 6x throttle median, kind]
// ======================================================================
const G6=[['VFX #1 loop at 320x180, 8 px tiles','F1','0.337',null,'desk'],['VFX #1 loop as written at 640x360, snowing','A2, F1','1.44','8.85','desk'],
  ['Field 1:2 nearest, Bayer, flat','A3','0.289','1.73','desk'],['Field 1:2 bilinear, table weights, Bayer, flat','A3','0.867','5.30','desk'],
  ['Upsample only, 1:2, table weights','A3','0.594','4.00','desk'],['Upsample only, 1:2, fixed 9/3/3/1 weights','A3','0.135','0.862','desk'],
  ['Full 32 px renderer, field 1:2, 9/3/3/1, snowing','B5','0.945','5.80','desk'],['WebGL2 shader, full, field 1:2 linear, Metal wall time','F1','0.012',null,'gpu']];
reg('groundcost',root=>{const c=ctl(root),svg=$('svg.chart',root),cv=$('canvas',root),X=PX(cv),ro=$('[data-ro]',root),leg=$('[data-leg]',root),msEl=$('[data-ms]',root);
  // the timed loop: a 320x180 byte field upsampled to 640x360 with fixed 9/3/3/1 weights
  const FWb=320,FHb=180,NB=new Uint8Array(FWb*FHb),DB=new Uint8Array(FWb*FHb),OUT=new Uint8Array(640*360);
  for(let y=0;y<FHb;y++)for(let x=0;x<FWb;x++)NB[y*FWb+x]=clamp((vnoise(x*.045+3,y*.045+7)*.7+vnoise(x*.13,y*.13+2)*.3)*190,0,255);
  const V=mkField(160,90,{seed:61}),sam=[];let t=0,live=-1,since=1,col=0;
  function up(){for(let cy=0;cy<FHb;cy++){const r=cy*FWb,ru=cy>0?r-FWb:r,rd=cy<FHb-1?r+FWb:r;let o0=cy*2*640,o1=o0+640;
      for(let cx=0;cx<FWb;cx++){const xl=cx>0?cx-1:cx,xr=cx<FWb-1?cx+1:cx,a=DB[r+cx],l=DB[r+xl],rr=DB[r+xr],n9=9*a+8;
        const ul=DB[ru+xl],uu=DB[ru+cx],ur=DB[ru+xr],dl=DB[rd+xl],dd=DB[rd+cx],dr=DB[rd+xr];
        OUT[o0++]=(n9+3*l+3*uu+ul)>>4;OUT[o0++]=(n9+3*rr+3*uu+ur)>>4;OUT[o1++]=(n9+3*l+3*dd+dl)>>4;OUT[o1++]=(n9+3*rr+3*dd+dr)>>4;}}}
  function chart(){const rows=G6.map(r=>{const v=r[2+col];return {lab:r[0],sub:r[1],b:[v===null?{none:r[4]==='gpu'?'the CPU throttle does not slow the GPU':'no throttled figure in the report'}:{v:+v,s:`${v} ms · ${pct(+v)}`,col:col?(r[4]==='gpu'?KC.gpu:KC.thr):KC[r[4]]}]};});
    if(live>=0)rows.push({lab:'Here: fixed 9/3/3/1 upsample to 640x360',sub:'measured in this browser',b:[{v:live,s:`${f3(live)} ms live`,col:KC.live}]});
    logBars(svg,rows,{lo:-3,hi:2,lines:FRAME});
    leg.innerHTML=legHtml(col?[['thr','6x throttle, median, a low-end proxy'],['live','this browser, live']]:[['desk','desktop: GPU run, median'],['gpu','WebGL2 shader, Metal wall time'],['live','this browser, live']]);
    ro.innerHTML=(col?'Under the 6x throttle the VFX #1 loop takes <b>8.85 ms</b>, 53% of the frame, and the full 32 px renderer 5.80 ms. Table-weight bilinear costs 5.30 ms against 1.73 ms for nearest. The fixed 9/3/3/1 upsample costs 0.862 ms. Throttled rows carry up to 20% noise.':
      'On the desktop the full 32 px renderer costs <b>0.945 ms</b> and the shader <b>0.012 ms</b> of wall time, about 80 times less. The ground pass is 68 to 71% of every CPU frame.')+
      ' <span style="color:var(--mute)">Source: the study\'s benchmark, §6a, Apple M4 Pro, Chromium 153. Browser numbers on one machine, not Godot numbers.</span>';}
  c.seg('col',v=>{col=+v;chart();});addEventListener('resize',chart);
  function tick(dt){t+=dt;const off=Math.sin(t*.45)*46-18;for(let i=0;i<DB.length;i++){const v=NB[i]+off;DB[i]=v<0?0:v>200?200:v;}
    const t0=performance.now();up();up();const d=(performance.now()-t0)/2;sam.push(d);if(sam.length>90)sam.shift();
    // show a crop: copy 80x45 cells into the small field and draw it with the same renderer as the other figures
    for(let y=0;y<45;y++)for(let x=0;x<80;x++)V.D[y*80+x]=DB[(y+60)*FWb+x+120];V.render(X.u32);X.put();
    since+=dt;if(since>=.6){since=0;const m=sam.reduce((a,b)=>a+b,0)/sam.length;live=m;msEl.innerHTML=`This browser, live: <b>${f3(m)} ms</b> per 640x360 upsample with fixed 9/3/3/1 weights, the mean of the last ${sam.length} frames. The report's desktop median for this row is 0.135 ms and its throttled median 0.862 ms.`;chart();}}
  chart();return {tick};});

// ======================================================================
// F5 a machine without a GPU. Numbers from the shader table and profile F5.
// ======================================================================
reg('nogpu',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  function chart(){const q=c.v('q');c.out('q',nf(q));const pv=q*.013;
    const rows=[{lab:'Full ground shader, 640x360',sub:'11 reads, field 1:2 linear',b:[{v:.012,s:'0.012 ms on Metal',col:KC.gpu},{v:.688,s:'0.688 ms on SwiftShader · '+pct(.688),col:KC.sw}]},
      {lab:'Full ground shader, 1920x1080',sub:'the same shader at 9 times the fragments',b:[{v:.086,s:'0.086 ms on Metal',col:KC.gpu},{v:6.10,s:'6.10 ms on SwiftShader · '+pct(6.1),col:KC.sw}]},
      {lab:'Shader plus 2 hashed flake layers, 640x360',sub:'the far flakes drawn inside the ground pass',b:[{v:.017,s:'0.017 ms on Metal',col:KC.gpu},{v:.761,s:'0.761 ms on SwiftShader',col:KC.sw}]},
      {lab:'580 flake quads, about 13 µs each',sub:'instanced sprites on SwiftShader',b:[{v:8,s:'about 8 ms · '+pct(8),col:KC.sw}]},
      {lab:'46 actor quads',sub:'on SwiftShader',b:[{v:1,s:'about 1 ms',col:KC.sw}]},
      {lab:'Whole frame, 580 flakes as quads',sub:'WebGL2 on SwiftShader',b:[{v:10,s:'9.7 to 10.3 ms · '+pct(10),col:KC.sw},{v:11,s:'11.0 ms with the 6x throttle',col:KC.swthr}]},
      {lab:'Whole frame, far flakes in the shader',sub:'520 hashed in the shader, 60 near as quads',b:[{v:3.05,s:'2.8 to 3.3 ms · '+pct(3.05),col:KC.sw},{v:3.84,s:'3.84 ms with the 6x throttle',col:KC.swthr}]},
      {lab:'Whole frame, no flakes',sub:'WebGL2 on SwiftShader',b:[{v:1.8,s:'1.8 ms',col:KC.sw},{v:2.23,s:'2.23 ms with the 6x throttle',col:KC.swthr}]},
      {lab:`Your pick: ${nf(q)} quads x 13 µs`,sub:'arithmetic, not a measurement',b:[q?{v:pv,s:`${pv.toFixed(2)} ms · ${pct(pv)}`,col:KC.pick}:{none:'no quads, no cost'}]}];
    logBars(svg,rows,{lo:-3,hi:2,lines:FRAME});
    leg.innerHTML=legHtml([['gpu','Metal, a GPU, wall median'],['sw','SwiftShader, a software renderer'],['swthr','SwiftShader plus 6x CPU throttle'],['pick','your pick, arithmetic']]);
    ro.innerHTML=`${nf(q)} flake quads at about 13 µs each come to <b>${pv.toFixed(2)} ms</b> on a software renderer, ${pct(pv)} of a 16.7 ms frame. `+
      (q>=1000?'That is the Sandbox\'s 1,010 flakes drawn one quad each, most of a frame.':q>=500?'The bench drew 580 and measured about 8 ms.':q<=60?'With only the 60 near flakes as quads the cost stays under 1 ms.':'Every quad that moves into the ground shader stops costing.')+
      ' <span style="color:var(--mute)">Source: §6a and profile F5, Apple M4 Pro, Chromium 153. SwiftShader is a software renderer, not a phone. Not Godot numbers.</span>';}
  c.on('q',()=>{c.setSeg('pre',c.v('q'));chart();});c.seg('pre',v=>{c.el('q').value=v;chart();});addEventListener('resize',chart);chart();return {};});

// ======================================================================
// 6a whole-frame presets. [label, sub, desktop median, 6x throttle median, SwiftShader + 6x throttle median]
// ======================================================================
const W6=[['VFX #1 engine at 320x180','8 px tiles, field of 57,600 cells','0.578','3.70','3.87'],['Preset 1: naive 1:1 port at 640x360','everything on the CPU, field of 230,400 cells','2.50','15.3','15.3'],
  ['Preset 2: field 1:2, CPU render','bilinear plus art threshold','1.36','8.45','9.15'],['Preset 3: field 1:2, WebGL2 render','sim on the CPU, 580 flakes as quads','0.096','0.542','11.0'],
  ['Preset 3, far flakes in the shader','520 in the shader plus 60 near as quads','0.083','0.484','3.84'],['Preset 3, no flakes','','0.078','0.472','2.23']];
reg('costs',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  function chart(){const sw=c.segv('v')==='sw';
    const rows=W6.map(r=>({lab:r[0],sub:r[1],b:sw?[{v:+r[4],s:`${r[4]} ms · ${pct(+r[4])}`,col:KC.sw}]:[{v:+r[2],s:`${r[2]} ms · ${pct(+r[2])}`,col:KC.desk},{v:+r[3],s:`${r[3]} ms · ${pct(+r[3])}`,col:KC.thr}]}));
    logBars(svg,rows,{lo:-2,hi:2,lines:FRAME});
    leg.innerHTML=legHtml(sw?[['sw','SwiftShader + 6x throttle, median']]:[['desk','desktop: GPU run, median'],['thr','6x throttle, median, a low-end proxy']]);
    ro.innerHTML=(sw?'With no GPU and the throttle on top, the naive port still takes <b>15.3 ms</b>. The shader preset with 580 flake quads takes <b>11.0 ms</b>, worse than the CPU renderer at 9.15 ms. Moving the far flakes into the shader brings it to 3.84 ms.':
      'Under the 6x throttle the naive 1:1 port takes <b>15.3 ms</b> of 16.7, and one more sim tick per frame adds 1.73 ms. The 1:2 field with a CPU render takes 8.45 ms, about half the frame. With the ground in a shader the whole frame is <b>0.542 ms</b>, 3% of the budget, and less than the 3.70 ms the VFX #1 engine takes at a quarter of the pixels.')+
      ' <span style="color:var(--mute)">Source: the study\'s benchmark, §6a, 23 actors, Apple M4 Pro, Chromium 153, 12 Nov 2026. The throttle is a proxy, no phone was measured. Browser numbers on one machine, not Godot numbers.</span>';}
  c.seg('v',chart);addEventListener('resize',chart);chart();return {};});

// ======================================================================
// 6b the conversion table. [value, at 8 px, in tiles, at 32 px (the report's words), follows, per-tile factor or kind]
// kind: a number = px per tile for a "tile" row, 'same' = constant, 'px' = stays in px, null = no rule in the report
// ======================================================================
const B6=[['Character','7x12 px','0.875 x 1.5','24x32 px, 0.75 x 1','Neither',null],
  ['Print stamp','2x2 px','0.25','Boot 3x5 px proposed, 4x6 px in the Sandbox. A naive x4 gives 8x8 px','Character',null],
  ['Stride, one stamp per','4 px','0.5','16 px, 2 prints per tile','Tile',n=>`${n*.5} px`],
  ['Rim around a print','6 deposits at radius 2.2 px','0.28','10 deposits at radius 4 px proposed. An even ring in the Sandbox','Character',null],
  ['Keep fraction','30%','','30% for boots, 40% for the trench','Constant','30%'],
  ['Upwind ray','28 px','3.5','112 px, 56 cells at 1:2, 28 cells at 1:4','Tile',n=>`${n*3.5} px`],
  ['Lee length','1.1 x h x wind + 2 px','+ 0.25','+ 8 px, with h in art px','Tile',n=>`+ ${n*.25} px`],
  ['Drift band','L to 1.8 L at x1.12','ratio','The same','Constant','L to 1.8 L at x1.12'],
  ['Eave strip','6 rows','0.75','24 px','Tile',n=>`${n*.75} px`],
  ['Sink','1 row per 22 units, at most 4 rows','0.5, a third of the sprite','2 px steps to 6 px at 120 units, or 12 px for deep terrain','Character',null],
  ['Sink rim','7 px wide','sprite width','10 to 14 px wide and 2 px tall proposed, 3 rows in the Sandbox','Character',null],
  ['Slowdown','up to 55%','','x1.0, x0.85, x0.7, x0.5 by tile band','Constant',null],
  ['Puffs per step','3 above 18 units','','2 to 3 per contact at a sink of 4 px or more','Constant',null],
  ['Hat cap','3 px','','2 px cap, 10 to 12 px wide, plus 2x2 px shoulders','Character',null],
  ['Flake sizes','1 px, 1 px, 2x2 px','0.125 to 0.25','1, 2 and 3 px by default. 6 px keeps the shipped 0.1875','Tile in shipped code',n=>`${n*.1875} px at 0.1875 tile`],
  ['Flake count','260 + 150 + 46 = 456','0.51 per tile','114 by tiles, 1,824 by pixels. The Sandbox runs 560 + 300 + 150 = 1,010','Coverage',null],
  ['Fall speed','14, 24, 42 px/s','1.75, 3.0, 5.25 per s','26, 42, 64 px/s in the Sandbox, 0.8 to 2 tiles per s','Screen height',null],
  ['Shadow dot','1 px','','2 px','Character',null],
  ['Picks per frame','900, 4,000, 1,400, 1,500, 1,600','','163 per 1,000 cells. 9,400 at 1:2, 37,600 at 1:1, 2,350 at 1:4','Field cells',null],
  ['Field','1 cell per px, 57,600 cells','64 cells per tile','57,600 cells at 1:2, 256 per tile','Our choice',null],
  ['Bayer 4x4 period','4 px','0.5, 2 repeats per tile','A 32x32 art tile, 1 repeat. A naive port gives 8 repeats','Tile',n=>`a naive port gives ${n/4} repeats per tile`],
  ['Emboss','from 1 px neighbours','','1 px rim, 1 px east and 2 px south shadow line','Pixel','px'],
  ['Depth cap','200 units','','The same','Constant','200 units'],
  ['Sandpile repose','3 units per cell','','A slope limit of 1.5 units per art px in the Sandbox','Our choice',null],
  ['Trail refill','14 packed units off per deposit','','Dropped. Packed fades evenly, 0.22 units per tick','Our choice',null],
  ['Palette','58 base colours x 4 variants','','77 base colours x 6 versions, 462 entries, in the Sandbox','Constant',null],
  ['Breath','every 1.4 to 2.0 s','','Every 3 to 4 s when idle','Constant',null]];
const FK={'Tile':'#8fb3de','Tile in shipped code':'#8fb3de','Character':'#ffd27a','Constant':'#9aa5ba','Pixel':'#e9a0d6'},FKO='#7fd4c3';
reg('convert',root=>{const c=ctl(root),cv=$('canvas',root),X=PX(cv),W=160,H=56,u=X.u32,tb=$('tbody',root),th=$('[data-th]',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const F=mkField(W,H,{seed:71,depth:60,flat:true}),BG=new Uint32Array(W*H);F.render(BG);
  const CH={8:[7,12],16:[16,32],32:[24,32],48:[48,48]};
  leg.innerHTML=[['Tile','follows the tile'],['Character','follows the character'],['Constant','constant'],['Pixel','follows the pixel']].map(([k,t])=>`<span><i style="background:${FK[k]}"></i>${t}</span>`).join('')+`<span><i style="background:${FKO}"></i>coverage, screen, field or our choice</span>`+'<span>In the strip: <i style="background:#5b90d1;margin-left:4px"></i>upwind ray, 3.5 tiles<i style="background:#7b8199;margin-left:10px"></i>stride marks, half a tile apart<i style="background:#f2f1ec;margin-left:10px"></i>one flake at 0.1875 tile</span>';
  function draw(){const n=+c.segv('ts');th.textContent=`At ${n} px tiles`;let calc=0,none=0;
    tb.innerHTML=B6.map(r=>{const k=FK[r[4]]||FKO;let cell,cls='';
      if(n===8)cell=r[1];else if(n===32)cell=r[3];
      else if(typeof r[5]==='function'){cell=r[5](n);cls='calc';calc++;}
      else if(r[5]==='px'){cell=r[1].replace('from ','')+', unchanged';cls='calc';calc++;}
      else if(typeof r[5]==='string'){cell=r[5];cls='calc';calc++;}
      else{cell='';cls='none';none++;}
      return `<tr style="--k:${k}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="${cls}">${cell}</td><td><span class="f">${r[4]}</span></td></tr>`;}).join('');
    // the strip: the same 160 px of ground at each tile size
    u.set(BG);gridOv(u,W,H,0,(H-4)%n,n);
    const fy=44,chs=CH[n],cx=4+Math.max(12,chs[0]>>1);
    // stride marks half a tile apart, drawn as paired dark prints
    for(let x=cx+n/2,k=0;x<W-4;x+=n/2,k++){const y=fy-3+(k&1?3:0),w=n>=32?6:n>=16?4:2,h=n>=32?4:2;rect(u,W,H,Math.round(x),y,w,h,C.SN_PSH);rect(u,W,H,Math.round(x),y,w,1,C.SN_PDK);}
    // the character frame as a grey box with a head and a body
    const x0=cx-(chs[0]>>1),y0=fy-chs[1]+1;
    if(n===32)drawChar(u,W,H,0,2,4,cx,fy,0);
    else{const bw=Math.max(3,Math.round(chs[0]*.7)),hh=Math.max(3,Math.round(chs[1]*.4)),bx=cx-(bw>>1);rect(u,W,H,bx,y0+hh,bw,chs[1]-hh,C.ROCK_B);rect(u,W,H,bx+1,y0,bw-2,hh,C.ROCK_A);box(u,W,H,bx-1,y0+hh-1,bw+2,chs[1]-hh+2,C.OUTL);box(u,W,H,bx,y0-1,bw,hh+1,C.OUTL);}
    // the 3.5-tile upwind ray as a bar, and one flake of 0.1875 tile
    const ray=Math.min(3.5*n,W-8);rect(u,W,H,4,3,Math.round(ray),2,C.COAT_L);rect(u,W,H,4,2,1,4,C.COAT_D);if(3.5*n<=W-8)rect(u,W,H,4+Math.round(ray)-1,2,1,4,C.COAT_D);
    const fs=Math.max(1,Math.round(n*.1875));rect(u,W,H,W-6-fs,9,fs,fs,C.SN_HI);box(u,W,H,W-7-fs,8,fs+2,fs+2,C.SN_SH);
    X.put();
    const head=`${n} px tiles, ${(160/n).toFixed(n===48?1:0)} tiles across this strip. `;
    ro.innerHTML=head+(n===8?'VFX #1 as shipped. Pick another size to see which numbers move.':
      n===32?'The report\'s 32 px column. Blue rows grew with the tile. Amber rows follow the 24x32 sprite, which grew about 3 times. Grey rows did not change.':
      `At ${n} px tiles the figure fills <b>${calc}</b> cells by arithmetic and leaves <b>${none}</b> empty, because the report states no rule for them at this size. The stride is ${n/2} px, the upwind ray ${3.5*n} px${3.5*n>W-8?', longer than this strip':''} and a flake of 0.1875 tile is ${n*.1875} px.`);}
  c.seg('ts',draw);draw();return {};});

// ======================================================================
// 6c games by tile size. Cells are the report's table, word for word. Empty cells stay empty.
// [game, tile px, character px, internal resolution, snow ground, footprints, falling snow, sink or slowdown, source, tile (px or 0), frame w, frame h]
// ======================================================================
const C6=[['Tibia','32','','480x352 visible, 15x11 tiles','Hand-drawn ground items, about 60 snow ids','Whole-tile swap, 15 footprint ids, 10 s, no direction, players only','None in the 3 client files read. The mehah client has a snow shader','Snow tile speed 160 against ice 100','[V, S6, S7, S9, S10, S2]',32,0,0],
  ['Dwarf Fortress (Steam)','32','32, one tile','','One byte per tile','','','','[V, S58, S59]',32,32,32],
  ['Factorio 2.0, Space Age','32 at scale 1','44x66 frame','','Static Aquilo tiles with frozen and thawed twins','Not on snow. On dirt and sand, 15x11 px, 600 ticks plus 125 fade','','Vehicle friction x1.8 on snow tiles','[V, S67, S68, S69]',32,44,66],
  ['RPG Maker VX Ace','32','3 frames x 4 directions','544x416 [K]','','','Up to 90 flakes of 6x6 px, -1 and +3 px per frame','','[V, S27; U, S28]',32,0,0],
  ['RPG Maker MV, MZ','48','48x48','816x624, 17x13 tiles','A2 autotile, 6 source tiles, 48 shapes','None in core','Up to 90 flakes of 9x9 px, 2.94 px per frame, 41 to 60 frames','Bush depth 12 px at half opacity','[V, S19, S20, S25, S18, S26, S22, S23]',48,48,48],
  ['Stardew Valley 1.5.4','16, drawn at 4x','16x32','1280x720 window, 320x180 art px','Season tilesheet swap','None. The step sound changes','Tiled 16x16 cell, 16 frames. 16 to 63 debris of 4x4 px at 3x','None','[V, S29, S30, S31, S2]',16,16,32],
  ['Pokémon Emerald','16','16x32','240x160','Static tiles','One 16x16 print on the tile just left, about 57 frames','16 sprites of 8x8 px','None for snow','[V, S33, S38, S2]',16,16,32],
  ['Pokémon Platinum','16 units','32-unit sprite','256x192 [K]','Static map, 5 snow tile types','4 directions plus 6 bike shapes, 32 ticks, on the tile just left','Light and heavy handlers, about 24 and 50 flakes alive','Sink 12, 14, 16 units. 8, 16, 32 frames per tile','[V, S39, S42, S40, S41, S44]',16,32,32],
  ['Pokémon HeartGold','','','','One snow tile type','Not found in the decompiled C','WEATHER_SNOW constant','No deep tiers','[V, S45, S46]',0,0,0],
  ['Pokémon Black and White','','','','Winter snow opens paths in 5 areas','','Rain areas snow in winter','','[V, S47]',0,0,0],
  ['CrossCode','16','','568x320, search summary','Props carry terrain SNOW or ICE','Not found','Particle type SNOW_FLAKES, preset BERGEN_SNOW','','[V, S84, S85; U, S86]',16,0,0],
  ['RimWorld 1.6','1 cell','','','Float per cell, 9-vertex alpha mesh','At depth 0.4 or more, every 0.632 cell, 4.88 s','Two panned overlay textures','+0, 0, 4, 8, 12 ticks per cell','[V, S48, S49, S53, S55, S50]',0,0,0],
  ['Project Zomboid 41.78','Isometric','','','Global fraction against 256x256 noise, 44 pieces','None in code','','','[V, S60, S61]',0,0,0],
  ["Don't Starve Together",'Not tile art','','','One global float, one overlay texture','','600 particles per second, cap 4,800','','[V, S62, S66]',0,0,0],
  ['Noita','','','','Per-pixel powder material that melts to water','','Falling material cells in 1 of 12 winter runs','','[V, S70, S71]',0,0,0],
  ['Terraria','','','','Snow blocks, no build-up listed','','Blizzard in the snow biome','','[V, S72]',0,0,0],
  ['Rain World (Saint)','','','','Water texture altered to show snow','','Snowfall grows into a blizzard','Wind pushes creatures','[V, S73]',0,0,0],
  ['Ragnarok Online, via roBrowser','3D map','','','','','2 flakes per 25 ms tick, life 320 ticks','','[V, S75]',0,0,0],
  ['Chained Echoes','','','640x360, search summary','','','','','[U, S87]',0,0,0],
  ['Zelda: The Minish Cap','','','','No code named snow','','None by name','','[V, S89]',0,0,0],
  ['Zelda: A Link to the Past','','','','No code named snow','','Rain overlay only','','[V, S90]',0,0,0],
  ['EarthBound','','','','"snow" matches only snowman text','','None by name','','[V, S91]',0,0,0],
  ['Core Keeper','','','','No snow biome on the Biomes page','','','','[V, S74]',0,0,0]];
const AST=['Asterion Online (this study)','32','24x32','640x360, 20 x 11.25 tiles','A byte field at 1 cell per 2x2 px over 32 px tiles, drawn through an art threshold map','Boot prints of 4x6 px on contact frames, a trench from 4 px of sink','1,010 flakes of 1, 2 and 3 px in the Sandbox','Sink in 2 px steps to 6 px, speed x1.0 to x0.5 by tile band','[S3; I]',32,24,32];
reg('tilesizes',root=>{const gs=$('[data-games]',root),chips=$('[data-chips]',root),card=$('[data-card]',root);
  const boxed=C6.filter(r=>r[9]).concat([AST]).sort((a,b)=>a[9]-b[9]||(a===AST?1:b===AST?-1:0)),rest=C6.filter(r=>!r[9]);let sel=AST;
  const CW=52,CHh=70,btns=new Map();
  function paint(cv,r){const X=PX(cv),u=X.u32,ts=r[9],fw=r[10],fh=r[11],ast=r===AST;u.fill(hx('#182238'));
    const tx=(CW-ts)>>1,ty=CHh-2-ts;
    // the tile: a snow square with a 1 px rim, lit on the north and west
    rect(u,CW,CHh,tx,ty,ts,ts,C.SN_BASE);rect(u,CW,CHh,tx,ty,ts,1,C.SN_HI);rect(u,CW,CHh,tx,ty,1,ts,C.SN_HI);rect(u,CW,CHh,tx,ty+ts-1,ts,1,C.SN_MID);rect(u,CW,CHh,tx+ts-1,ty,1,ts,C.SN_MID);
    if(ast)drawChar(u,CW,CHh,0,0,4,CW>>1,CHh-4,0,{shadow:true});
    else if(fw){const fx=(CW-fw)>>1,fy=CHh-2-fh,hh=Math.round(fh*.38),bw=Math.max(4,Math.round(fw*.62)),hw=Math.max(4,Math.round(fw*.5)),bx=(CW-bw)>>1,hxp=(CW-hw)>>1;
      // the frame as a dotted outline, and a plain pawn inside it
      for(let x=fx;x<fx+fw;x+=2){if(fy>=0)u[fy*CW+x]=C.ROCK_C;u[(fy+fh-1)*CW+x]=C.ROCK_C;}for(let y=Math.max(0,fy);y<fy+fh;y+=2){u[y*CW+fx]=C.ROCK_C;u[y*CW+fx+fw-1]=C.ROCK_C;}
      rect(u,CW,CHh,bx,fy+hh+1,bw,fh-hh-3,C.ROCK_B);rect(u,CW,CHh,hxp,fy+2,hw,hh,C.ROCK_A);box(u,CW,CHh,bx-1,fy+hh,bw+2,fh-hh-1,C.OUTL);box(u,CW,CHh,hxp-1,fy+1,hw+2,hh+1,C.OUTL);}
    X.put();}
  function show(){for(const [r,b] of btns)b.classList.toggle('on',r===sel);const r=sel;
    const L=['Tile px','Character px','Internal resolution','Snow ground','Footprints','Falling snow','Sink or slowdown','Source'];
    card.innerHTML=`<dt class="h">Game</dt><dd class="h">${r[0]}</dd>`+L.map((l,i)=>`<dt>${l}</dt><dd>${r[i+1]}</dd>`).join('');}
  const scale=()=>{const w=gs.getBoundingClientRect().width;return w>=820?2:1;};
  function size(){const k=scale();$$('canvas',gs).forEach(cv=>{cv.style.width=CW*k+'px';cv.style.height=CHh*k+'px';});}
  for(const r of boxed){const b=document.createElement('button');b.type='button';if(r===AST)b.classList.add('ast');const cv=document.createElement('canvas');cv.width=CW;cv.height=CHh;cv.setAttribute('aria-hidden','true');
    const s=document.createElement('span');s.textContent=r===AST?'Asterion':r[0].replace(' (Steam)','').replace(', Space Age','').replace(' 1.5.4','').replace('Pokémon ','');const sm=document.createElement('small');sm.textContent=`${r[9]} px`+(r[10]?` · ${r[10]}x${r[11]}`:'');
    b.append(cv,s,sm);b.setAttribute('aria-label',`${r[0]}, tile ${r[1]}${r[2]?', character '+r[2]:''}`);b.addEventListener('click',()=>{sel=r;show();});gs.appendChild(b);btns.set(r,b);paint(cv,r);}
  for(const r of rest){const b=document.createElement('button');b.type='button';b.textContent=r[0];b.addEventListener('click',()=>{sel=r;show();});chips.appendChild(b);btns.set(r,b);}
  size();addEventListener('resize',size);show();return {};});

// ======================================================================
// §5 scorecard: sortable heat table + radar. Rows come from the page's SCORE
// data when the build provides it; the copy below is the report's table.
// [id, technique, Simplicity, Speed, Pixel taste, Mood, Interactivity, Sum]
// ======================================================================
const S5=[['A1','Base resolution 640x360, whole-number scale',5,5,5,3,1,19],['A2','Field at 1:1, the naive port',5,2,4,4,5,20],['A3','Coarse field, bilinear + threshold',4,4,5,4,4,21],['A4','Split field, depth coarse and trail fine',3,4,5,4,5,21],
  ['A5','Per-tile levels with autotiles',4,5,4,2,2,17],['A6','One global level against noise',5,5,3,3,1,17],['A7','RimWorld per-cell depth, smooth draw',4,5,3,4,3,19],['B1','Bayer 4 and 8 at 32 px',5,5,2,2,1,15],
  ['B2','Art threshold tile and frost tint',3,5,5,4,1,18],['B3','Summer and winter tilesets through a mask',3,5,5,5,2,20],['B4','Seasonal swaps and overlay autotiles',5,5,4,2,1,17],['B5','Edge shading: shadow line, body, rim',4,4,5,4,1,18],
  ['C1','Shaped snow caps and roof lips',3,5,5,5,1,19],['C2','Static art-resolution masks',4,5,4,3,1,17],['D1','Boot prints on contact frames',4,5,5,5,5,24],['D2','One mark per tile left',5,5,3,3,3,19],
  ['D3','Sinking by clipping, front rim',4,5,4,4,5,22],['D4','Trench in deep snow',4,5,4,5,5,23],['D5','Stride and walk-cycle timing',4,5,5,4,4,22],['D6','Shadow, breath, kicked snow, shoulders',4,5,5,5,3,22],
  ['D7','Crowd budget',4,5,3,3,4,19],['E1','Flake size 0.1875 tile, 1% coverage',5,5,5,4,1,20],['E2',"Stardew's tiled animated cell",5,5,3,3,1,17],['E3','Z-height flakes in three sizes',4,5,5,5,2,21],
  ['E4','World-locked, whole-pixel motion',5,5,5,4,1,20],['F1','Ground render in one shader',4,5,4,3,1,17],['F2','Whole-texture uploads, small field',4,5,3,2,2,16],['F3','Row-sweep exposure bake',4,5,3,3,1,16],
  ['F4','Pixel-perfect settings for 640x360',5,5,5,3,1,19],['F5','A machine without a GPU',3,3,3,2,1,12]].map(r=>({id:r[0],name:r[1],r:r.slice(2,7),sum:r[7]}));
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const GS=(typeof SCORE!=='undefined'&&Array.isArray(SCORE)&&SCORE.length===30)?SCORE:S5;
  const HC=['#141c2e','#22324f','#3d5f8c','#86abd4','#e6eef8'],RL=['Simplicity','Speed','Pixel taste','Mood','Interactivity'],SC=['#ffd27a','#7fd4c3','#ff8f7a'];
  let sel=['D1','B1','F1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Mood','Interact.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=GS.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#0c111b':'#dbe2ee'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
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
