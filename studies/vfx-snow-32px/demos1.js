// Snow at 32 px: figures 1 (hero, timeline, scale, fieldratio, splitfield, autotile, globallevel, percell, rowsweep, upload) and the stack
// Everything sits in one block so helper names stay local to this file. The art is this file's own copy of the Sandbox's.
{
// ----------------------------------------------------------------------
// shared bits for this file: RNG, colours, ground tiles, thresholds, the
// small snow engine, 24x32 characters, flakes and object stamps
// ----------------------------------------------------------------------
// the RNG state lives in a typed array (the harness finding of section 6a)
const RS=new Int32Array([20261113]);
const rnd1=()=>{let r=RS[0];r^=r<<13;r^=r>>>17;r^=r<<5;RS[0]=r;return (r>>>0)/4294967296;};
const ri=n=>(rnd1()*n)|0;
const bay4=(x,y)=>BAYER[(y&3)*4+(x&3)];
const put=(u,W,H,x,y,c)=>{if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=c;};
const rectF=(u,W,H,x,y,w,h,c)=>{for(let j=Math.max(0,y);j<Math.min(H,y+h);j++)for(let i=Math.max(0,x);i<Math.min(W,x+w);i++)u[j*W+i]=c;};
const num=n=>Math.round(n).toLocaleString('en-US');
const OUTL=U('#1e1a2e'),GR_X=U('#22382f'),GR_D=U('#2d4b3d'),GR_A=U('#3a5d47'),GR_B=U('#4a704d'),GR_T=U('#6b8f57'),FLW=U('#e3d6a2'),
  SN_HI=U('#f2f1ec'),SN_BASE=U('#cbd3dc'),SN_MID=U('#9eabb8'),SN_SH=U('#7d7a96'),SN_DEEP=U('#5a5674'),SN_PACK=U('#a6b1c0'),SN_PSH=U('#7b8199'),SN_PDK=U('#575b76'),WHITE=U('#ffffff'),
  ROOF_L=U('#b65e4a'),ROOF_A=U('#934242'),ROOF_B=U('#71303a'),ROOF_D=U('#4c2031'),
  WALL_L=U('#b48d60'),WALL_A=U('#93704c'),WALL_B=U('#76573d'),WALL_D=U('#513b2d'),DOOR_A=U('#6b4631'),WIN=U('#7c9cbc'),WIN_D=U('#566f96'),ICE_C=U('#c6dcec'),
  ROCK_L=U('#abafba'),ROCK_A=U('#888d9b'),ROCK_B=U('#676c7e'),ROCK_C=U('#484c61'),
  CAN_L=U('#4c8c5c'),CAN_A=U('#2f6e52'),CAN_B=U('#235742'),CAN_D=U('#173c35'),TRUNK=U('#5f402d'),TRUNK_D=U('#402b23'),
  LAMP_P=U('#2e2c3b'),LAMP_H=U('#4d4b64'),LAMP_L=U('#ffd27a'),
  HAT=U('#c8443c'),HAT_L=U('#e2695a'),HAT_D=U('#8d2b38'),HATB=U('#eee6dc'),HATB_D=U('#c4bcc2'),SKIN=U('#f0c09a'),SKIN_D=U('#cd9072'),
  SCARF=U('#f2c14e'),SCARF_D=U('#c18a35'),COAT=U('#3c6fb4'),COAT_L=U('#5b90d1'),COAT_D=U('#2a4c85'),LEG=U('#3a3c54'),LEG_D=U('#2a2b40'),
  V_HAT=U('#7b5737'),V_COAT=U('#4f7a3a'),V_COAT_L=U('#6d9b4d'),V_COAT_D=U('#365930'),PUR_L=U('#9a79c9'),PUR_A=U('#7555a9'),PUR_D=U('#4d3979'),
  FLAKE_M=U('#dfe6f2'),FLAKE_F=U('#b4c1d8'),LAMP_Y=U('#ffd27a');
// the Sandbox's palette versions: sun shadow and frost
const shadeC=c=>{const a=un32(c);return pack(a[0]*.7,a[1]*.74,a[2]*.9+10);};
const frostC=c=>{const a=un32(c);return pack(a[0]*.74+190*.26,a[1]*.74+208*.26,a[2]*.74+226*.26);};

// ground: 6 grass tiles of 32x32 with tufts, picked by a position hash
const TUFTS=[["l...l",".l.l.",".lml.",".xmx."],["l.l",".l.",".x."],[".l...l.","l.l.l.l",".lmlml.","..xmx.."],["l..",".ll",".mx"],["..l..","l.l.l",".lml.",".xmx."]];
const GT=[],GTK=[];
for(let v=0;v<6;v++){const t=new Uint32Array(1024),k=new Uint8Array(1024);
  for(let gy=0;gy<3;gy++)for(let gx=0;gx<3;gx++){if(hash2(v*31+gx*7+1,gy*13+v*5+2)<.34)continue;
    const T=TUFTS[(hash2(gx+v*3,gy+9+v)*TUFTS.length)|0],tw=T[0].length,th=T.length;
    const x0=2+gx*10+((hash2(gx*5+v,gy*3+1)*(11-tw))|0),y0=2+gy*10+((hash2(gx+11,gy*7+v)*(11-th))|0);
    for(let r=0;r<th;r++)for(let c=0;c<tw;c++){const ch=T[r][c];if(ch==='.')continue;const px=x0+c,py=y0+r;if(px>31||py>31)continue;t[py*32+px]=ch==='l'?GR_T:ch==='m'?GR_B:GR_X;k[py*32+px]=1;}}
  for(let n=0;n<3;n++){const x=3+((hash2(v+n*9,77)*24)|0),y=3+((hash2(v*3+n,91)*24)|0);if(!t[y*32+x]&&!t[y*32+x+1]){t[y*32+x]=GR_D;t[y*32+x+1]=GR_D;if(n===0)t[(y+1)*32+x+1]=GR_D;}}
  if(v===2||v===5){const x=6+((hash2(v,5)*18)|0),y=6+((hash2(v,6)*18)|0);if(!k[y*32+x]){t[y*32+x]=FLW;t[y*32+x+1]=FLW;t[(y+1)*32+x]=FLW;t[(y+1)*32+x+1]=SCARF_D;k[y*32+x]=k[y*32+x+1]=k[(y+1)*32+x]=k[(y+1)*32+x+1]=1;}}
  if(v===3){const x=5+((hash2(v,8)*18)|0),y=5+((hash2(v,9)*18)|0);if(!k[y*32+x]){t[y*32+x]=ROCK_A;t[y*32+x+1]=ROCK_L;t[y*32+x+2]=ROCK_A;t[(y+1)*32+x]=ROCK_C;t[(y+1)*32+x+1]=ROCK_B;t[(y+1)*32+x+2]=ROCK_C;}}
  GT.push(t);GTK.push(k);}
// a grass field of W x H art px. B = colours, BF = frost version, TK = 1 where a tuft sits
function mkGround(W,H,seed=0){const B=new Uint32Array(W*H),TK=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,n=vnoise((x+seed*97)/52,y/44)*.6+vnoise(x/19,(y+seed*31)/16)*.4;
    let b=n<.37?GR_D:n>.64?GR_B:GR_A;const v=(hash2((x>>5)+3+seed*5,(y>>5)+7)*6)|0,ti=(y&31)*32+(x&31),tv=GT[v][ti];if(tv)b=tv;TK[i]=GTK[v][ti];B[i]=b;}
  return {W,H,B,TK,BF:B.map(frostC)};}
// the art threshold map: seed blobs on a 12.8 px lattice (about 6 per 32 px tile), 128 px period, stored in 2x2 px blocks
function seedDist(x,y){const cs=12.8,gx=Math.floor(x/cs),gy=Math.floor(y/cs);let best=99;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=gx+dx,cy=gy+dy,hx=((cx%10)+10)%10,hy=((cy%10)+10)%10;
    const sx=(cx+.15+hash2(hx+21,hy+4)*.7)*cs,sy=(cy+.15+hash2(hx+8,hy+33)*.7)*cs,r=1+hash2(hx+60,hy+2)*3,d=Math.hypot(x-sx,(y-sy)*1.3)-r;if(d<best)best=d;}
  return Math.max(0,best);}

// ----------------------------------------------------------------------
// the small snow engine: a depth byte and a packed byte per cell, FS art px
// per depth cell and PS per packed cell (split mode: 4 and 2). Tick rates,
// stamps, sampling and banded shading follow the Sandbox (section 8).
// o: {thr: 0 Bayer 4 + noise, 1 art map; bilin; soft; expo(x,y) -> 0..1.3}
// ----------------------------------------------------------------------
const mkMask=rows=>{const m=[];for(let y=0;y<rows.length;y++)for(let x=0;x<rows[y].length;x++)if(rows[y][x]==='#')m.push(x,y);return m;};
// boot prints: 4x6 px, one mask per walking direction (0 down, 1 up, 2 right, 3 left). Only the 1:1 field can hold the heel gap
const BOOT1=[mkMask(["####","....","####","####","####",".##."]),mkMask([".##.","####","####","####","....","####"]),mkMask(["#.###.","#.####","#.####","#.###."]),mkMask([".###.#","####.#","####.#",".###.#"])];
const BOOTV=mkMask(["####","####","####","####","####","####"]),BOOTH=mkMask(["######","######","######","######"]);
function mkSnow(G,o={}){const W=G.W,H=G.H,NP=W*H,B=G.B,BF=G.BF,TK=G.TK,W3=3*W;
  const cov=new Uint8Array(NP),ds=new Uint8Array(NP),T=new Uint8Array(NP),TF=[new Float32Array(NP),new Float32Array(NP)],TB=[new Float32Array(NP),new Float32Array(NP)];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,tuft=TK[i]?5:0,bx=x>>1,by=y>>1,X=bx*2+1,Y=by*2+1,y1=Math.min(H-1,by*2+1),x1=Math.min(W-1,bx*2+1);
    const tb=(TK[by*2*W+bx*2]|TK[by*2*W+x1]|TK[y1*W+bx*2]|TK[y1*W+x1])?1:0;
    TF[0][i]=.5+tuft;TB[0][i]=bay4(x,y)*.55+hash2(x+7,y+3)*2.5;
    const d=seedDist(X,Y),lf=(vnoise(X/88,Y/70)-.5)*10;TF[1][i]=Math.max(2,4+d*4.6+tb*10+lf);TB[1][i]=bay4(bx,by)/15*2.2;}
  const S={W,H,cov,ds,T,thr:o.thr===undefined?1:o.thr,bilin:o.bilin!==false,soft:o.soft||110,maxD:200,picks:0,inten:1,flat:!!o.flat,kT:o.kT||0},expo=o.expo||(()=>1);
  let FS=0,PS=0,sh=0,psh=0,FW=0,FH=0,PW=0,PH=0,NF=0,D=null,P=null,LIM=null,E=null,fadeAcc=0,xi,xw,yi,yw,pxi,pxw,pyi,pyw;
  const axis=(n,r)=>{const m=n/r,I=new Int32Array(n),Wt=new Uint8Array(n);for(let x=0;x<n;x++){const f=(x+.5)/r-.5,x0=clamp(Math.floor(f),0,Math.max(0,m-2));I[x]=x0;Wt[x]=Math.round(clamp(f-x0,0,1)*16);}return [I,Wt];};
  // the dither swing follows 2 / field ratio, so a snow edge keeps its width in art px
  const scaleT=()=>{const k=S.kT||2/FS,F=TF[S.thr],Bv=TB[S.thr];for(let i=0;i<NP;i++)T[i]=clamp(Math.floor(F[i]+Bv[i]*k),0,255);};
  const rs=(src,sw,sh2,sfs,dst,dw,dh,dfs)=>{for(let cy=0;cy<dh;cy++)for(let cx=0;cx<dw;cx++){
    if(dfs>sfs){const k=dfs/sfs;let a=0;for(let y=0;y<k;y++)for(let x=0;x<k;x++)a+=src[(cy*k+y)*sw+cx*k+x];dst[cy*dw+cx]=a/(k*k);}
    else dst[cy*dw+cx]=src[Math.min(sh2-1,(cy*dfs/sfs)|0)*sw+Math.min(sw-1,(cx*dfs/sfs)|0)];}};
  S.setField=(fs,ps,keep)=>{ps=ps||fs;const oD=D,oP=P,oFW=FW,oFH=FH,oPW=PW,oPH=PH,oFS=FS,oPS=PS;
    FS=fs;PS=ps;sh=Math.log2(fs);psh=Math.log2(ps);FW=W/fs;FH=H/fs;PW=W/ps;PH=H/ps;NF=FW*FH;
    D=new Uint8Array(NF);P=new Uint8Array(PW*PH);LIM=new Uint8Array(NF);E=new Float32Array(NF);
    for(let cy=0;cy<FH;cy++)for(let cx=0;cx<FW;cx++){const c=cy*FW+cx;E[c]=Math.min(1.3,expo((cx+.5)*fs,(cy+.5)*fs));
      LIM[c]=Math.min(S.maxD,(S.soft*E[c]*(.8+.4*vnoise((cx+.5)*fs/36+30,(cy+.5)*fs/28+11))+6)|0);}
    if(keep&&oD){rs(oD,oFW,oFH,oFS,D,FW,FH,FS);rs(oP,oPW,oPH,oPS,P,PW,PH,PS);}
    [xi,xw]=axis(W,fs);[yi,yw]=axis(H,fs);[pxi,pxw]=axis(W,ps);[pyi,pyw]=axis(H,ps);scaleT();
    Object.assign(S,{FS,PS,FW,FH,PW,PH,NF,D,P,LIM,E});};
  S.setThr=k=>{S.thr=k;scaleT();};
  S.fill=k=>{for(let i=0;i<NF;i++)D[i]=Math.min(S.maxD,(LIM[i]*k+hash2(i,3)*5)|0);P.fill(0);};
  // one tick: snowfall picks up to each cell's limit, sandpile picks, and the even fade of packed snow. Rates are picks per 1,000 cells
  S.tick=()=>{const kc=NF/1000,fw=FW,span=NF-2*FW-2,rt=1.5*FS;let n=(15.6*kc*S.inten)|0,picks=n;
    for(let k=0;k<n;k++){const i=ri(NF);if(rnd1()<E[i]&&D[i]<LIM[i])D[i]++;}
    n=(69.4*kc)|0;picks+=n;for(let k=0;k<n;k++){const i=fw+1+ri(span),r=ri(4),j=r===0?i+1:r===1?i-1:r===2?i+fw:i-fw;if(D[i]>D[j]+rt){D[i]--;D[j]++;}}
    fadeAcc+=.22*S.inten;if(fadeAcc>=1){const f=fadeAcc|0;fadeAcc-=f;for(let q=0;q<P.length;q++){const v=P[q];if(v)P[q]=v>f?v-f:0;}}
    S.picks=picks;return picks;};
  // a stamp given as art pixels. Each cell loses depth by the share of it the stamp covers, and the packed field takes the same share
  const TC=new Int32Array(64),TN=new Uint8Array(64);
  S.stamp=(x0,y0,mask,keep,packV)=>{let n=0,m=0,spill=0;const area=FS*FS,parea=PS*PS;
    for(let k=0;k<mask.length;k+=2){const px=x0+mask[k],py=y0+mask[k+1];if(px<0||py<0||px>=W||py>=H)continue;const c=(py>>sh)*FW+(px>>sh);let q=0;for(;q<n;q++)if(TC[q]===c)break;if(q===n){if(n>=32)continue;TC[n]=c;TN[n]=0;n++;}TN[q]++;}
    for(let q=0;q<n;q++){const c=TC[q],cv=Math.min(1,TN[q]/area),d=D[c],nd=(d*(1-cv*(1-keep))+.5)|0;spill+=d-nd;D[c]=nd;}
    for(let k=0;k<mask.length;k+=2){const px=x0+mask[k],py=y0+mask[k+1];if(px<0||py<0||px>=W||py>=H)continue;const c=(py>>psh)*PW+(px>>psh);let q=32;for(;q<32+m;q++)if(TC[q]===c)break;if(q===32+m){if(m>=32)continue;TC[q]=c;TN[q]=0;m++;}TN[q]++;}
    for(let q=32;q<32+m;q++){const c=TC[q],pv=(packV*Math.min(1,TN[q]/parea))|0;if(pv>P[c])P[c]=pv;}
    return spill;};
  const pOf=i=>PS===FS?P[i]:P[((i/FW)|0)*2*PW+(i%FW)*2];
  // the spill goes to an even ring of cells around the stamp
  S.rim=(cx,cy,r,spill)=>{if(spill<=0)return;const K=FS===1?36:FS===2?10:8,per=Math.max(1,Math.round(spill/K)),a0=rnd1()*6.283;
    for(let k=0;k<K&&spill>0;k++){const a=a0+k*6.283/K,rr=FS===1&&(k&1)?r+1.3:r,px=Math.round(cx+Math.cos(a)*rr),py=Math.round(cy+Math.sin(a)*rr*.9);
      if(px<0||py<0||px>=W||py>=H)continue;const c=(py>>sh)*FW+(px>>sh);if(pOf(c)<200){const add=Math.min(per,spill,S.maxD-D[c]);D[c]+=add;spill-=add;}}};
  // one boot print for step frame f (0 left, 2 right). Two rows 6 px apart, each print snapped to the packed field's cells
  S.boot=(c,f)=>{const fx=Math.round(c.x),fy=Math.round(c.y),d=c.dir,g=~(PS-1);let px,py;
    if(d<2){const xl=(fx-5)&g;px=((f===0)===(d===0))?xl+6:xl;py=(d===0?fy-4:fy-6)&g;}else{const yt=(fy-8)&g;py=f===0?yt:yt+6;px=(d===2?fx:fx-6)&g;}
    const sp=S.stamp(px,py,PS===1?BOOT1[d]:d<2?BOOTV:BOOTH,.3,255);S.rim(px+(d<2?2:3),py+(d<2?3:2),Math.max(4.8,FS*1.9),sp);S.prints=(S.prints||0)+1;};
  S.brush=(cx,cy,r,mode)=>{const r2=r*r;for(let y=Math.max(0,(cy-r)>>sh);y<=Math.min(FH-1,(cy+r)>>sh);y++)for(let x=Math.max(0,(cx-r)>>sh);x<=Math.min(FW-1,(cx+r)>>sh);x++){const dx=(x+.5)*FS-cx,dy=(y+.5)*FS-cy;if(dx*dx+dy*dy>r2)continue;const i=y*FW+x;
    if(mode==='snow')D[i]=Math.min(S.maxD,D[i]+5);else{D[i]=0;if(PS===FS)P[i]=0;}}};
  // the depth beside the feet, skipping cells that are already packed
  S.amb=(x,y)=>{let s=0,n=0,s2=0,n2=0;for(let k=0;k<4;k++){const px=(x+[-9,9,-6,6][k])|0,py=(y+[-1,-1,3,3][k])|0;if(px<0||py<0||px>=W||py>=H)continue;const c=(py>>sh)*FW+(px>>sh);
    s2+=D[c];n2++;if(P[(py>>psh)*PW+(px>>psh)]<110){s+=D[c];n++;}}return n?s/n:n2?s2/n2:0;};
  // pass A: sample both fields per art pixel and test against the threshold. Codes: 0 bare, 1 snow, 3 packed, 7 boot print
  // pass B: banded shading. Light rim on north and west edges, shadow line on south and east edges, one body colour
  S.render=u=>{const bil=S.bilin,flat=S.flat;let anyP=0;for(let q=0;q<P.length;q++)if(P[q]){anyP=1;break;}
    for(let y=0,i=0;y<H;y++){const j0=yi[y]*FW,wy=yw[y],q0=pyi[y]*PW,vy=pyw[y],jn=(y>>sh)*FW,qn=(y>>psh)*PW;
      for(let x=0;x<W;x++,i++){let d,p=0,pc=0;
        if(bil&&FS>1){const j=j0+xi[x],wx=xw[x];d=((D[j]*(16-wx)+D[j+1]*wx)*(16-wy)+(D[j+FW]*(16-wx)+D[j+FW+1]*wx)*wy+128)>>8;}else d=D[jn+(x>>sh)];
        if(anyP&&d>2){pc=P[qn+(x>>psh)];if(bil&&PS>1){const q=q0+pxi[x],wx=pxw[x];p=((P[q]*(16-wx)+P[q+1]*wx)*(16-vy)+(P[q+PW]*(16-wx)+P[q+PW+1]*wx)*vy+128)>>8;}else p=pc;}
        ds[i]=d;cov[i]=p>84?(pc>200?7:3):(d+(p>>1)>T[i]?1:0);}}
    const at=(x,y,c)=>x<0||y<0||x>=W||y>=H?c:cov[y*W+x];
    for(let y=0,i=0;y<H;y++){const inY=y>=3&&y<H-3;for(let x=0;x<W;x++,i++){const c=cov[i],d=ds[i];let col;
      if(flat){if(c===0){u[i]=B[i];continue;}const sl=y>0&&y<H-1&&x>0&&x<W-1?(ds[i+1]-ds[i-1])+(ds[i+W]-ds[i-W]):0; // the VFX #1 emboss: no edge lines, tone by slope
        u[i]=(c&2)?(sl<-5?SN_PSH:SN_PACK):d<T[i]+4?SN_BASE:sl>6?SN_HI:sl>=-6?SN_BASE:sl>=-13?SN_MID:sl>=-22?SN_SH:SN_DEEP;continue;}
      if(c===0){col=d>=4?BF[i]:B[i];if(y>0&&cov[i-W]===1&&ds[i-W]>T[i-W]+14)col=shadeC(col);u[i]=col;continue;}
      const inner=inY&&x>=3&&x<W-3;let n,w,s,e,n2,w2,s2;
      if(inner){n=cov[i-W];w=cov[i-1];s=cov[i+W];e=cov[i+1];n2=cov[i-2*W];w2=cov[i-2];s2=cov[i+2*W];}
      else{n=at(x,y-1,c);w=at(x-1,y,c);s=at(x,y+1,c);e=at(x+1,y,c);n2=at(x,y-2,c);w2=at(x-2,y,c);s2=at(x,y+2,c);}
      if(c===7)col=(n&2)&&(w&2)?SN_PSH:SN_PDK;
      else if(c&2)col=(n&2)+(w&2)+(s&2)+(e&2)<4?SN_BASE:((n===1||w===1||n2===1||w2===1)&&(s&2)&&(e&2))?SN_PSH:SN_PACK;
      else if(s===0||e===0)col=((n===0)+(w===0)+(s===0)+(e===0)>=3)?SN_BASE:d>T[i]+14?SN_SH:SN_MID;
      else if(n===0||w===0)col=SN_HI;
      else if(((n&2)&&(n2&2))||((w&2)&&(w2&2)))col=SN_HI;
      else if(s2===0&&d>T[i]+14)col=SN_SH;
      else{col=SN_BASE;if(inner){const sl=(ds[i+3]-ds[i-3])+(ds[i+W3]-ds[i-W3]);if((sl>32||sl<-32)&&!((cov[i+3]|cov[i-3]|cov[i+W3]|cov[i-W3])&2))col=sl>0?SN_HI:SN_MID;}}
      u[i]=col;}}};
  S.setField(o.fs||2,o.ps||o.fs||2,false);
  return S;}

// ----------------------------------------------------------------------
// 24x32 characters: the Sandbox's row templates and frame builder.
// Frame 0 is the left step, 2 the right step, 1 and 3 passing poses, 4 idle
// ----------------------------------------------------------------------
const UP_F=["..........wwww..........",".........wwwwWW.........",".......hhhwwWWhhh.......","......hLLhhhhhhhhH......",".....hLLhhhhhhhhhHH.....","....hhLhhhhhhhhhhhHH....","....wwwwwwwwwwwwwwWW....","....wwwwwwwwwwwwwWWW....","....kssssssssssssssk....","....kssEEssssssEEssk....","....sssEEssssssEEsSs....","....sSssssssssssssSs....",".....ssssssSSsssssS.....","......yyyyyyyyyyyY......","....llyyyyyyyyyyyYCC....","...lccccyyyYYycccccCC...","...lccoccyyYYccccoCCC...","...lccocccyyYccccoCCC...","...cccocccccccccCoCCC...","...cccocccccccccCoCCC...","...gggoccccccccCCoGGG...","....gg.cccccccCCC.GG....",".......ccccccCCCC......."];
const UP_B=["..........wwww..........",".........wwwwWW.........",".......hhhwwWWhhh.......","......hLLhhhhhhhhH......",".....hLLhhhhhhhhhHH.....","....hhLhhhhhhhhhhhHH....","....hhhhhhhhhhhhhhHH....","....wwwwwwwwwwwwwwWW....","....wwwwwwwwwwwwwWWW....","....kkkkkkkkkkkkkkKK....","....kkkkkkkkkkkkkKKK....",".....kkkkkkkkkkkKKK.....","......ssssssssssSS......","......yyyyyyyyyyyY......","....llyyyyyyyyyyyYCC....","...lccccyyYccccccccCC...","...lccoccyyYcccccoCCC...","...lccoccyyYcccccoCCC...","...cccocccyYccccCoCCC...","...cccocccccccccCoCCC...","...gggoccccccccCCoGGG...","....gg.cccccccCCC.GG....",".......ccccccCCCC......."];
const UP_S=["........wwww............",".......wwwwWW...........","......hhwwWWhhhhh.......",".....hLLhhhhhhhhhH......","....hLLhhhhhhhhhhhHH....","....hhhhhhhhhhhhhhHH....","....wwwwwwwwwwwwwwWWW...","....wwwwwwwwwwwwwWWW....","....kkkkkssssssssss.....","....kkkksssssssEEss.....","....kkkkssssssSEEsss....",".....kkksssssssssss.....","......kkssssssssSS......","......yyyyyyyyyyyY......","...YYyyyyyyyyyyyYY......","..YY...lcccccccccC......","..Y....lccccccccCC......",".......lccccccccCC......",".......ccccccccCCC......",".......ccccccccCCC......",".......ccccccccCCC......","........ccccccCCC.......","........ccccccCCC......."];
const ARM_S=["ollC.","ollC.","ollC.","ollC.","ollC.","oggG.",".oo.."];
const LF_I=[".......pppp..pPPP.......",".......pppp..pPPP.......",".......pppp..pPPP.......","......bbbbb..bbbbB......","......bbbbb..bbbbB......","......bBBBB..bBBBB......"];
const LF_L=[".......pppp..pPPP.......",".......pppp..pPPP.......","......bbbbb..bbbbB......","......bbbbb..bBBBB......",".....bbbbbb.............",".....bbBBBB............."]; // viewer-left foot planted
const LF_R=[".......pppp..pPPP.......",".......pppp..pPPP.......","......bbbbb..bbbbB......","......bBBBB..bbbbB......",".............bbbbbB.....",".............bbBBBB....."];
const LS_I=["........pppPPP..........","........pppPPP..........","........pppPPP..........","........bbbbBBB.........","........bbbbbBBB........","........bBBBBBBB........"];
const LS_N=[".......PPPppppp.........","......PPP...pppp........",".....PPP.....pppp.......","....BBB.......bbbb......","...BBBB.......bbbbb.....","...BBB........bBBBBB...."]; // near leg forward
const LS_NP=["........pppPPP..........","........ppppPP..........",".......PPpppp...........","......BBBbbbb...........","......BB.bbbbb..........",".........bBBBBB........."];
const LS_F=[".......pppppPPP.........","......ppp...PPPP........",".....ppp.....PPPP.......","....bbb.......BBBB......","...bbbb.......BBBBB.....","...bBB........BBBBBB...."]; // far leg forward
const LS_FP=["........PPPppp..........","........PPpppp..........",".......ppPPPP...........","......bbbBBBB...........","......bB.BBBBB..........",".........BBBBBB........."];
const UPS=[UP_F,UP_B,UP_S],LEGS=[[LF_R,LF_I,LF_L,LF_I,LF_I],[LF_L,LF_I,LF_R,LF_I,LF_I],[LS_F,LS_FP,LS_N,LS_NP,LS_I]];
const mkMap=(hat,hatL,hatD,coat,coatL,coatD,scarf,scarfD,hair,brim,brimD)=>({h:hat,L:hatL,H:hatD,w:brim||HATB,W:brimD||HATB_D,k:hair,K:TRUNK_D,s:SKIN,S:SKIN_D,E:OUTL,y:scarf,Y:scarfD,c:coat,l:coatL,C:coatD,g:SKIN,G:SKIN_D,p:LEG,P:LEG_D,b:DOOR_A,B:WALL_D,o:OUTL});
const MAPS=[mkMap(HAT,HAT_L,HAT_D,COAT,COAT_L,COAT_D,SCARF,SCARF_D,TRUNK),mkMap(V_HAT,WALL_A,WALL_D,V_COAT,V_COAT_L,V_COAT_D,HAT,HAT_D,ROCK_B,WALL_L,WALL_A),
  mkMap(CAN_A,CAN_L,CAN_B,ROOF_A,ROOF_L,ROOF_B,HATB,HATB_D,TRUNK),mkMap(PUR_A,PUR_L,PUR_D,WALL_A,WALL_L,WALL_B,COAT,COAT_D,TRUNK_D)];
function outlineSprite(px,w,h){const add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(px[i])continue;if((x>0&&px[i-1])||(x<w-1&&px[i+1])||(y>0&&px[i-w])||(y<h-1&&px[i+w]))add.push(i);}for(const i of add)px[i]=OUTL;}
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
const FR=MAPS.map(mkFrames);
const SHW=[3,6,7,6,3];
// draw an actor with its feet at (c.x, c.y). dir 0 down, 1 up, 2 right, 3 left. sink clips the legs and adds a 3-row snow rim
function drawActor(u,W,H,c){const fx=Math.round(c.x),fy=Math.round(c.y),sk=c.sink|0,F=FR[c.set||0][c.dir===0?0:c.dir===1?1:2][c.moving?c.fr:4],px=F.px,mk=F.m,flip=c.dir===3,x0=fx-12,y0=fy-30+sk;
  if(!c.noShadow){const shr=sk>>2;for(let r=0;r<5;r++){const y=fy-5+r,hw=SHW[r]-shr;if(y<0||y>=H||hw<1)continue;for(let x=fx-hw;x<fx+hw;x++){if(x<0||x>=W)continue;u[y*W+x]=shadeC(u[y*W+x]);}}}
  const lv=c.snowy>.65?4:c.snowy>.3?1:0,last=30-sk;
  for(let r=0;r<=last;r++){const y=y0+r;if(y<0||y>=H)continue;for(let cx=0;cx<24;cx++){const sc=flip?23-cx:cx;let v=px[r*24+sc];if(!v)continue;const x=x0+cx;if(x<0||x>=W)continue;
      if(lv){const m=mk[r*24+sc];if(m&&(lv===4||m===1||m===3))v=(m===1||m===3)?SN_HI:SN_BASE;}u[y*W+x]=v;}}
  if(sk>=2){const hw=6;for(let r=0;r<3;r++){const y=fy-2+r;if(y<0||y>=H)continue;const w=r===0?hw-2:hw;for(let x=fx-w;x<fx+w;x++){if(x<0||x>=W)continue;if(r===0&&((x+fx)%5===0))continue;u[y*W+x]=r===0?SN_HI:(x===fx-w||x===fx+w-1)?SN_MID:r===1?SN_HI:SN_BASE;}}}}
const mkActor=(x,y,set=0)=>({x,y,set,dir:2,fr:0,ph:0,moving:false,sink:0,snowy:0});
// move an actor and stamp boots on frames 0 and 2. One walk frame per 8 px, so one print per foot every 16 px
function walkActor(S,c,vx,vy,dt,sinkCap=6){const mx=vx*dt,my=vy*dt,m=Math.hypot(mx,my);c.x+=mx;c.y+=my;if(m<.001){c.moving=false;c.fr=4;return;}
  c.dir=Math.abs(vx)>Math.abs(vy)+.01?(vx>0?2:3):(vy>0?0:1);
  if(!c.moving){c.moving=true;c.ph=0;c.fr=0;if(S)S.boot(c,0);}
  else{c.ph+=m/8;const f=(c.ph|0)&3;if(f!==c.fr){c.fr=f;if(S&&(f===0||f===2))S.boot(c,f);}}
  if(S){const a=S.amb(c.x,c.y);c.sink=sinkCap?Math.min(sinkCap,2*((a*sinkCap/240)|0)):0;}}

// ----------------------------------------------------------------------
// flakes: two stateless far layers (1 px and 2 px) and a near layer with
// height and a shadow dot (3 px, one in ten 4 px). Counts follow the area
// at the Sandbox's density: 560, 300 and 150 on 640x360
// ----------------------------------------------------------------------
const FSHAPE=[mkMask(["#"]),mkMask(["##","##"]),mkMask([".#.","###",".#."]),mkMask([".##.","####","####",".##."])];
function mkFlakes(W,H,dens=1){const A=W*H/230400*dens,cnt=[Math.round(560*A),Math.round(300*A)],nn=Math.round(150*A),HM=Math.max(cnt[0],cnt[1],1);
  const hx=new Float32Array(HM*2),hy=new Float32Array(HM*2),hp=new Float32Array(HM*2);for(let k=0;k<HM*2;k++){hx[k]=rnd1();hy[k]=rnd1();hp[k]=rnd1();}
  const nx=new Float32Array(nn),ny=new Float32Array(nn),nz=new Float32Array(nn),nph=new Float32Array(nn),nsh=new Uint8Array(nn),ox=[0,0],oy=[0,0];
  const spawn=(k,top)=>{nx[k]=rnd1()*(W+60)-30;ny[k]=rnd1()*(H+60);nz[k]=top?H*.5+rnd1()*20:rnd1()*H*.6;nph[k]=rnd1()*6.28;nsh[k]=(rnd1()*100)|0;};
  for(let k=0;k<nn;k++)spawn(k,false);
  const shape=(u,x,y,sp,col,col2)=>{const m=FSHAPE[sp];let n=0;for(let k=0;k<m.length;k+=2){const px=x+m[k],py=y+m[k+1];if(px<0||py<0||px>=W||py>=H)continue;u[py*W+px]=(sp===3&&m[k+1]>=3)?col2:col;n++;}return n;};
  const F={t:0,px:0,n:cnt[0]+cnt[1]+nn,
    step(dt,wind,S){F.t+=dt;for(let k=0;k<nn;k++){nz[k]-=64*dt*(.85+.3*Math.sin(nph[k]));nx[k]+=(wind*44+Math.sin(nph[k]+F.t*3)*8)*dt;ny[k]+=Math.cos(nph[k]*1.3+F.t*1.8)*3*dt;
        if(nz[k]<=0){const x=nx[k]|0,y=ny[k]|0;if(S&&x>=0&&y>=0&&x<W&&y<H){const i=(y>>Math.log2(S.FS))*S.FW+(x>>Math.log2(S.FS));if(rnd1()<S.E[i])S.D[i]=Math.min(S.LIM[i]>S.D[i]?S.LIM[i]:S.D[i],S.D[i]+2);}spawn(k,true);}
        if(nx[k]<-35)nx[k]+=W+65;else if(nx[k]>W+35)nx[k]-=W+65;}
      ox[0]+=wind*14*dt;oy[0]+=26*dt;ox[1]+=wind*26*dt;oy[1]+=42*dt;},
    shadows(u){for(let k=0;k<nn;k++){const gx=nx[k]|0,gy=ny[k]|0;if(gx>=0&&gy>=0&&gx<W-1&&gy<H&&nz[k]<70){const i=gy*W+gx;u[i]=shadeC(u[i]);u[i+1]=shadeC(u[i+1]);}}},
    draw(u){let n=0;for(let l=0;l<2;l++){const o=l*HM,col=l===0?FLAKE_F:FLAKE_M,ww=W+40,hh=H+20,sw=l===0?5:9;
        for(let k=0;k<cnt[l];k++){const ph=hp[o+k]*6.283,x=(((hx[o+k]*ww+ox[l]+Math.sin(ph+F.t*(1+hp[o+k]))+Math.sin(ph+F.t*1.3)*sw)%ww)+ww)%ww-20|0,y=((hy[o+k]*hh+oy[l]*(.8+.4*hp[o+k]))%hh)-10|0;n+=shape(u,x,y,l,col,col);}}
      for(let k=0;k<nn;k++){const sp=nsh[k]<10?3:2;n+=shape(u,(nx[k]|0)-1,((ny[k]-nz[k])|0)-1,sp,WHITE,FLAKE_M);}
      F.px=n;}};
  return F;}

// ----------------------------------------------------------------------
// object stamps: drawn into a small buffer, outlined with one dark pixel.
// Cap pixels (classes 3 to 6) carry a threshold: snow shows where the cap
// depth passes it, shaded with the same rim and shadow rule as the ground
// ----------------------------------------------------------------------
const scal=x=>{const q=Math.floor(x/3)*3;return .5+.3*Math.sin(q*.21)+.2*Math.sin(q*.083+1.3);};
const SOLID=9,ROOF=3,CANOPY=4,ROCKTOP=5;
function mkStamp(w,h){return {w,h,c:new Uint32Array(w*h),s:new Uint8Array(w*h).fill(255),t:new Uint8Array(w*h),f:new Uint8Array(w*h),k:new Uint8Array(w*h),ax:0,ay:0};}
function sset(st,x,y,col,cls,thr,flag){x|=0;y|=0;if(x<0||y<0||x>=st.w||y>=st.h)return;const i=y*st.w+x;st.c[i]=col;st.s[i]=cls===undefined?SOLID:cls;st.t[i]=clamp((thr||0)|0,0,255);st.f[i]=flag||0;}
function soutline(st){const {w,h,s}=st,add=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(s[i]!==255)continue;
    if((x>0&&s[i-1]!==255)||(x<w-1&&s[i+1]!==255)||(y>0&&s[i-w]!==255)||(y<h-1&&s[i+w]!==255))add.push(i);}
  for(const i of add){st.c[i]=OUTL;st.s[i]=SOLID;}}
// draw a stamp with its anchor (st.ax, st.ay) at (x, y). capD is the snow depth its caps see
function drawStamp(u,W,H,st,x,y,capD){const {w,h,c,s,t,f,k}=st,x0=x-st.ax,y0=y-st.ay;
  for(let i=0;i<w*h;i++)k[i]=s[i]>2&&s[i]<9&&capD>t[i]?s[i]:0;
  for(let yy=0;yy<h;yy++){const Y=y0+yy;if(Y<0||Y>=H)continue;for(let xx=0;xx<w;xx++){const i=yy*w+xx;if(s[i]===255)continue;const X=x0+xx;if(X<0||X>=W)continue;let col=c[i];const q=k[i];
      if(q){const fl=f[i];if((yy<h-1?k[i+w]:0)!==q)col=SN_MID;else if((yy>0?k[i-w]:0)!==q||(xx>0?k[i-1]:0)!==q)col=SN_HI;else if((xx<w-1?k[i+1]:0)!==q)col=SN_MID;
        else if(fl===2&&((yy<h-2?k[i+2*w]:0)!==q||(yy<h-3?k[i+3*w]:0)!==q))col=SN_MID;else col=fl===1?SN_MID:fl===3?SN_HI:SN_BASE;
        if(fl===1&&col===SN_HI)col=SN_BASE;}
      u[Y*W+X]=col;}}}
// a pine of half-width hw and height h in 4 tiers. One snow cap per tier, from the top of what shows of it
function mkPine(hw,h,seed){const hc=h-8,cx=hw+4,st=mkStamp(2*hw+9,h+6),nT=4,yb=[],ya=[],hws=[];
  for(let k=0;k<nT;k++){yb[k]=Math.round(hc-k*hc*.215)+2;hws[k]=hw*(1-k*.2);ya[k]=k===nT-1?2:Math.round(yb[k]-hc*.44);}
  const tooth=(x,k)=>[0,1,2,3,2,1][(((x+k*3+seed)%6)+6)%6];
  const inTier=(k,x,y)=>{if(y<ya[k])return false;const u=Math.abs(x-cx+.5),f=(y-ya[k])/(yb[k]-ya[k]);if(f>1.25)return false;const w=hws[k]*Math.pow(Math.min(1,f),.8)+.6;if(u>w)return false;return y<=yb[k]-tooth(x,k)+Math.round(u/hws[k]*2.2);};
  for(let y=hc;y<=hc+10;y++)for(let x=cx-3;x<=cx+2;x++)sset(st,x,y,x<cx?TRUNK:TRUNK_D);
  sset(st,cx-4,hc+10,TRUNK);sset(st,cx+3,hc+10,TRUNK_D);
  const own=new Int8Array(st.w*st.h).fill(-1),fr=new Uint8Array(st.w*st.h);
  for(let k=0;k<nT;k++){
    if(k>0)for(let y=3;y<st.h;y++)for(let x=0;x<st.w;x++)if(own[y*st.w+x]>=0&&inTier(k,x,y-3)&&!inTier(k,x,y))st.c[y*st.w+x]=CAN_D;
    for(let y=ya[k];y<=yb[k]+4;y++)for(let x=0;x<st.w;x++){if(!inTier(k,x,y))continue;const u=(x-cx+.5)/hws[k],fringe=!inTier(k,x,y+2),fr1=!inTier(k,x,y+1);
      let c=u<-.3?(hash2((x>>1)+seed,(y>>1)+k*7)<.42?CAN_L:CAN_A):u<.28?(hash2((x>>1)+seed,(y>>1)+k*5)<.16?CAN_B:CAN_A):CAN_B;
      if(fringe)c=u<0?CAN_B:CAN_D;if(fr1&&u>-.5)c=CAN_D;
      sset(st,x,y,c,CANOPY,255,u>.5?1:0);own[y*st.w+x]=k;fr[y*st.w+x]=fringe?1:0;}}
  for(let x=0;x<st.w;x++)for(let k=0;k<nT;k++){let y1=-1,y2=-1;for(let y=0;y<st.h;y++)if(own[y*st.w+x]===k){if(y1<0)y1=y;y2=y;}if(y1<0)continue;
    const vis=y2-y1+1,lump=scal(x*1.6+seed*5+k*9);for(let y=y1;y<=y2;y++){const i=y*st.w+x,dT=y-y1;if(fr[i]||dT>vis*.62+1||vis<4)continue;st.t[i]=clamp(8+dT*(8.5+lump*5)+(k===nT-1?0:6),0,254)|0;}}
  soutline(st);st.ax=cx;st.ay=hc+10;st.hw=hw;return st;}
// the Sandbox's lamp post, 17x60 px, anchored at its foot
function mkLamp(){const st=mkStamp(17,60);
  for(let y=15;y<=54;y++){sset(st,7,y,LAMP_H);sset(st,8,y,LAMP_P);sset(st,9,y,LAMP_P);}
  for(let x=5;x<=11;x++){sset(st,x,55,LAMP_H);sset(st,x,56,LAMP_P);sset(st,x,57,LAMP_P);}sset(st,6,54,LAMP_P);sset(st,10,54,LAMP_P);
  for(let y=5;y<=13;y++)for(let x=5;x<=11;x++)sset(st,x,y,(x===5||x===11||y===13)?LAMP_P:(x===8?LAMP_H:LAMP_L));
  for(let x=6;x<=10;x++)sset(st,x,14,LAMP_P);
  for(let x=4;x<=12;x++)sset(st,x,4,x<8?LAMP_H:LAMP_P,ROCKTOP,255);
  for(let x=5;x<=11;x++)sset(st,x,3,x<8?LAMP_H:LAMP_P,ROCKTOP,30+Math.abs(x-8)*3);
  for(let x=6;x<=10;x++)sset(st,x,2,x<8?LAMP_H:LAMP_P,ROCKTOP,10+Math.abs(x-8)*3);
  sset(st,8,1,LAMP_P);soutline(st);st.ax=8;st.ay=57;return st;}
// a small log hut, w px wide: north roof slope, ridge, south slope in 8 px shingle courses, a log wall and a door. Snow covers the roof from the ridge down
function mkHut(w,rs,wh){const nN=6,ry0=2,wy0=ry0+nN+3+rs,h=wy0+wh+2,st=mkStamp(w,h),P=(x,y,c,s,t,f)=>sset(st,x,y,c,s,t,f),kq=58/rs;
  for(let y=ry0;y<wy0;y++)for(let x=1;x<=w-2;x++){const ry=y-ry0;let c,t,f=0;
    if(ry<nN){c=ry<2?ROOF_D:(((x+ry*3)%14)<2?ROOF_D:ROOF_B);t=4+ry*.6+scal(x+40)*5;f=1;}
    else if(ry<nN+3){c=ry===nN?ROOF_L:ry===nN+1?ROOF_A:ROOF_D;t=3+scal(x)*4;if(ry<nN+2)f=3;}
    else{const q=ry-nN-3,co=q%8,ci=(q/8)|0;c=co===7?ROOF_D:ROOF_A;if(co<7&&((x+(ci&1)*6)%12)===0)c=ROOF_B;if(co===0&&hash2(x>>2,ci)<.5)c=ROOF_L;if(x>w-10&&c===ROOF_A)c=ROOF_B;
      t=9+q*kq+scal(x)*12;if(co===7&&hash2(x>>3,ci+9)<.6&&q<rs-4)f=1;if(q>=rs-3)f=2;}
    P(x,y,c,ROOF,t,f);}
  for(let y=wy0;y<wy0+wh;y++)for(let x=5;x<=w-6;x++){const ly=(y-wy0)%8;let c=ly===0?WALL_L:ly<5?WALL_A:ly<7?WALL_B:WALL_D;
    if(ly>=2&&ly<=4&&hash2(x>>2,y>>1)<.1)c=WALL_B;
    if(x<11||x>w-12){const e=x<11?x-5:x-(w-11);c=e<2?WALL_L:e<4?WALL_A:WALL_B;if(ly===7)c=WALL_D;}
    if(y<wy0+3)c=c===WALL_L?WALL_A:c===WALL_A?WALL_B:WALL_D;
    if(y>=wy0+wh-2)c=y===wy0+wh-2?ROCK_A:(((x+(y&1)*5)%10)===0?ROCK_C:ROCK_B);
    P(x,y,c);}
  const dx0=(w>>1)-7;for(let y=wy0+wh-19;y<wy0+wh;y++)for(let x=dx0;x<dx0+14;x++){let c=(x===dx0||x===dx0+13||y===wy0+wh-19)?WALL_D:DOOR_A;if(c===DOOR_A&&(x===dx0+4||x===dx0+9))c=WALL_D;if(x===dx0+10&&(y===wy0+wh-9||y===wy0+wh-8))c=SCARF;P(x,y,c);}
  if(w>=56){const wx=w-25;for(let y=wy0+5;y<wy0+15;y++)for(let x=wx;x<wx+12;x++){const ix=x-wx,iy=y-wy0-5;let c=(ix===0||iy===0)?WALL_L:(ix===11||iy===9)?WALL_D:WIN;if(c===WIN){if(ix===5||ix===6)c=WALL_D;else if(ix+iy>12)c=WIN_D;else if(ix-iy===2&&ix<5)c=ICE_C;}P(x,y,c);}}
  soutline(st);
  for(let x=1;x<=w-2;x++){sset(st,x,wy0,OUTL,ROOF,66+scal(x+17)*8,2);if(x>=6&&x<=w-7){const g=scal(x*1.7+5);sset(st,x,wy0+1,WALL_D,ROOF,g>.42?80+g*8:255,2);}}
  st.ax=w>>1;st.ay=h-2;st.wy0=wy0;return st;}
const PINE_A=mkPine(22,64,1),PINE_B=mkPine(18,54,5),LAMP=mkLamp();

// ======================================================================
// HERO: a live strip of the 32 px scene. The canvas takes its width from
// the column, so it always fills it at 2x. A walker crosses on two lanes
// and stamps boots into a field that can be 1:1, 1:2 or 1:4, drawn through
// the Bayer or the art threshold. Timed with performance.now().
// ======================================================================
reg('hero',root=>{const cv=$('canvas',root),st=cv.parentElement,H=144,mt=meter(.05);
  const W=clamp(Math.floor((stageRoom(st)||320)/8)*4,160,320);cv.width=W;cv.height=H;snapStage(st);
  const F=PX(cv),u=F.u32,G=mkGround(W,H,1),px=Math.round(W*.21),lx=Math.round(W*.68),p2=W>=260?Math.round(W*.9):-99;
  const edge=x=>74+(vnoise(x/38,3.3)-.5)*26;
  const shel=(x,y,bx,by,hw)=>{const rx=hw+5,ry=hw*.55,dx=(x-bx)/rx,dy=(y-by+3)/ry,r=Math.sqrt(dx*dx+dy*dy);return r<1?.12+.88*r*r:1;};
  // thin, wind-swept cover behind the pines and deep snow in front. The pines shelter a ring around their trunks
  const S=mkSnow(G,{fs:2,thr:1,soft:50,kT:1,expo:(x,y)=>smooth(-13,13,y-edge(x))*shel(x,y,px,72,22)*(p2>0?shel(x,y,p2,60,18):1)});S.fill(1);
  const FL=mkFlakes(W,H),A=mkActor(-14,108,0),lanes=[108,130];let lane=0,wait=0,dirX=1,hud=0;
  const bf=$$('[data-f]',root),bt=$$('[data-th]',root),sync=()=>{bf.forEach(b=>b.classList.toggle('on',+b.dataset.f===S.FS));bt.forEach(b=>b.classList.toggle('on',+b.dataset.th===S.thr));};
  bf.forEach(b=>b.addEventListener('click',()=>{S.setField(+b.dataset.f,+b.dataset.f,true);sync();}));
  bt.forEach(b=>b.addEventListener('click',()=>{S.setThr(+b.dataset.th);sync();}));sync();
  return {tick(dt){
    if(wait>0){wait-=dt;if(wait<=0){lane^=1;dirX=-dirX;A.x=dirX>0?-14:W+14;A.y=lanes[lane];A.moving=false;}}
    else{walkActor(S,A,56*dirX,0,dt);if(A.x>W+16||A.x<-16)wait=1.4;}
    mt.t0();S.tick();FL.step(dt,-.35,S);mt.t1();
    S.render(u);
    FL.shadows(u);
    drawStamp(u,W,H,LAMP,lx,64,60);drawStamp(u,W,H,PINE_A,px,72,60);if(p2>0)drawStamp(u,W,H,PINE_B,p2,60,60);
    if(wait<=0)drawActor(u,W,H,A);
    FL.draw(u);F.put();hud-=dt;
    if(hud<=0){hud=.3;setHud(root,`tick ${fms(mt.v)} ms · 1:${S.FS}, ${num(S.NF)} cells, ${num(S.picks)} picks`);}}};});

// ======================================================================
// section 3 timeline: four generations from GENS (built from the report)
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#8c98b0','#8fb3de','#ffd27a','#e9a0d6'];
  const X=y=>y<2012?2+(y-1997)/15*22:y<2020?24+(y-2012)/8*28:52+(y-2020)/7*46;
  let h='<div class="tl-axis">';for(const y of [1997,2004,2012,2020,2026])h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
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
// A1 scale: the same corner of the screen at 8 px tiles (VFX #1) and at
// 32 px tiles, both at the same size on the display, plus whole-number
// window scales for three base sizes.
// ======================================================================
const rowsSpr=(rows,map)=>{const h=rows.length,w=rows[0].length,d=new Uint32Array(w*h);rows.forEach((r,j)=>{for(let i=0;i<w;i++)if(r[i]!=='.')d[j*w+i]=map[r[i]];});return {w,h,d};};
const blitSpr=(u,W,H,s,x,y)=>{x=Math.round(x)-(s.w>>1);y=Math.round(y)-s.h+1;for(let j=0;j<s.h;j++){const yy=y+j;if(yy<0||yy>=H)continue;for(let i=0;i<s.w;i++){const c=s.d[j*s.w+i];if(!c)continue;const xx=x+i;if(xx>=0&&xx<W)u[yy*W+xx]=c;}}};
// a 13x16 px pine for the 8 px scale
const PINE8=rowsSpr(["......o......",".....oho.....","....ohsbo....","...oalabbo...","....ohsbo....","...ohhssbo...","..oalaabbbo..",".oalaaabbbdo.","...ohhssbo...","..ohhsssbbo..",".oalaaabbbdo.","oallaaabbbbdo",".oooootTooooo",".....otTo....",".....otTo....","......oo....."],
  {o:OUTL,h:SN_HI,s:SN_BASE,a:CAN_A,l:CAN_L,b:CAN_B,d:CAN_D,t:TRUNK,T:TRUNK_D});
function mkGround8(W,H){const B=new Uint32Array(W*H),TK=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/13+5,y/11)*.6+vnoise(x/5,y/4+9)*.4,h=hash2(x+3,y+11);B[y*W+x]=h<.03?GR_T:h>.975?GR_X:n<.37?GR_D:n>.64?GR_B:GR_A;}
  return {W,H,B,TK,BF:B.map(frostC)};}
const DOT=mkMask(["##","##"]);
const PINE_B2=mkPine(18,54,5);
reg('scale',root=>{const cvs=$$('canvas',root),PA=PX(cvs[0]),PB=PX(cvs[1]),ua=PA.u32,ub=PB.u32,c=ctl(root),svgs=$$('svg',root),pls=$$('[data-p]',root),scl=$('[data-scl]',root);
  const edge=x=>24+(vnoise(x/30,1.7)-.5)*22,shel=(x,y)=>{const dx=(x-126)/23,dy=(y-49)/10,r=Math.sqrt(dx*dx+dy*dy);return r<1?.12+.88*r*r:1;};
  const expo=(x,y)=>smooth(-10,10,y-edge(x))*shel(x,y);
  const SB=mkSnow(mkGround(160,90,2),{fs:2,thr:1,soft:50,expo}),SA=mkSnow(mkGround8(80,45),{fs:1,thr:0,bilin:false,flat:true,kT:1,soft:50,expo:(x,y)=>expo(x*4,y*4)});
  SA.fill(1);SB.fill(1);
  const FB=mkFlakes(160,90),AB=mkActor(-14,76,0),AA={dir:'right',moving:true,anim:0};let wait=0,dist=0,foot=0,t=0;
  // VFX #1 flakes: 1 px, 1 px and 2x2 px, falling 14, 24 and 42 px per second
  const NA=28,fx=new Float32Array(NA),fy=new Float32Array(NA);for(let k=0;k<NA;k++){fx[k]=rnd1();fy[k]=rnd1();}
  const grid=(u,W,H,s)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x%s===0||y%s===0){const i=y*W+x;u[i]=mulc(u[i],.82,.82,.85);}};
  const scheme=(svg,tile,cw,ch)=>{svgEl('rect',{x:0,y:0,width:320,height:180,fill:'#2d4b3d'},svg);
    for(let x=tile;x<320;x+=tile)svgEl('line',{x1:x,y1:0,x2:x,y2:180,stroke:'#16263a','stroke-width':tile<10?.6:1},svg);
    for(let y=tile;y<180;y+=tile)svgEl('line',{x1:0,y1:y,x2:320,y2:y,stroke:'#16263a','stroke-width':tile<10?.6:1},svg);
    svgEl('rect',{x:1,y:1,width:79,height:44,fill:'none',stroke:'#ffd27a','stroke-width':2},svg);
    svgEl('rect',{x:196,y:120-ch,width:cw,height:ch,fill:'#f2f1ec',stroke:'#1e1a2e','stroke-width':1},svg);
    svgEl('line',{x1:196+cw+5,y1:120-ch,x2:196+cw+5,y2:120,stroke:'#ffd27a','stroke-width':2},svg);};
  scheme(svgs[0],8,7,12);scheme(svgs[1],16,12,16);
  pls[0].innerHTML='<b>40 x 22.5 tiles</b> of 8 px on a 320x180 screen. The 7x12 px walker is <b>6.7%</b> of the screen height. The yellow frame is the corner shown above, and the white block is the walker.';
  pls[1].innerHTML='<b>20 x 11.25 tiles</b> of 32 px on a 640x360 screen. The 24x32 px walker is <b>8.9%</b> of the screen height. On a 320x180 screen it would be 17.8%, with only 10 x 5.63 tiles in view.';
  const win=()=>{const hh=+c.segv('win');scl.innerHTML=[[640,360],[480,270],[320,180]].map(([bw,bh])=>{const k=hh/bh,ok=Math.abs(k-Math.round(k))<1e-6;
    return `<div class="${ok?'on':'bad'}"><b>${bw}x${bh}</b><span>${ok?`${k}x. One art pixel is a ${k}x${k} block`:`${k.toFixed(2)}x, not a whole number. It fails`}</span><em>${bw/32} x ${+(bh/32).toFixed(2)} tiles of 32 px</em></div>`;}).join('');};
  c.seg('win',win);win();
  return {tick(dt){t+=dt;
    if(wait>0){wait-=dt;if(wait<=0){AB.x=-14;AB.moving=false;}}
    else{const x0=AB.x;walkActor(SB,AB,56,0,dt);AA.anim+=dt*8;dist+=(AB.x-x0)/4;
      if(dist>=4){dist-=4;foot^=1;const ax=AB.x/4,ay=19+(foot?1:-1)*.8,sp=SA.stamp(Math.round(ax-1),Math.round(ay-1),DOT,.3,255);SA.rim(ax,ay,2.2,sp);}
      if(AB.x>176)wait=1.5;}
    SA.tick();SB.tick();FB.step(dt,-.3,SB);SA.render(ua);SB.render(ub);
    if(c.v('grid')){grid(ua,80,45,8);grid(ub,160,90,32);}
    FB.shadows(ub);blitSpr(ua,80,45,PINE8,31,13);drawStamp(ub,160,90,PINE_B2,126,52,60);
    if(wait<=0){drawChar(ua,80,45,AA,AB.x/4,19,2);drawActor(ub,160,90,AB);}
    for(let k=0;k<NA;k++){const sp=k<16?14:k<25?24:42,x=(((fx[k]*100-t*sp*.25)%100)+100)%100-10|0,y=((fy[k]*55+t*sp)%55)-5|0;put(ua,80,45,x,y,k<16?FLAKE_F:FLAKE_M);
      if(k>=25){put(ua,80,45,x,y,WHITE);put(ua,80,45,x+1,y,WHITE);put(ua,80,45,x,y+1,WHITE);put(ua,80,45,x+1,y+1,WHITE);}}
    FB.draw(ub);PA.put();PB.put();}};});

// ======================================================================
// A2, A3 field ratio: one patch in three byte fields, 1:1, 1:2 and 1:4,
// each with its own tick. Nearest against bilinear, and a stored-cells view.
// ======================================================================
reg('fieldratio',root=>{const cvs=$$('canvas',root),PXs=cvs.map(PX),c=ctl(root),ms=$$('[data-m]',root),ro=$('[data-ro]',root),W=144,H=80,R=[1,2,4],mt=R.map(()=>meter(.05)),G=mkGround(W,H,3);
  const expo=(x,y)=>smooth(1.12,.3,Math.hypot((x-72)/62,(y-40)/34)+(vnoise(x/21,y/17)-.5)*.34);
  const SS=R.map(r=>mkSnow(G,{fs:r,thr:1,soft:64,expo,bilin:false})),RAMPV=[U('#1b2233'),SN_DEEP,SN_SH,SN_MID,SN_BASE,SN_HI];
  const reset=()=>SS.forEach(S=>{S.fill(1);for(let k=0;k<=9;k++)S.brush(46+k*6,58-k*4,5,'shovel');});reset();
  let tool='shovel',view='pic',hud=0;
  c.seg('tool',v=>tool=v);c.seg('view',v=>view=v);c.seg('samp',v=>SS.forEach(S=>S.bilin=v==='1'));c.btn('reset',reset);
  cvs.forEach(cv=>pointer(cv,(p,type)=>{if(type==='down'||type==='drag')SS.forEach(S=>S.brush(p[0]|0,p[1]|0,6,tool));}));
  const cells=(S,u)=>{const sh=Math.log2(S.FS),D=S.D,FW=S.FW;for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){const d=D[(y>>sh)*FW+(x>>sh)];u[i]=RAMPV[d<3?0:d<16?1:d<30?2:d<44?3:d<58?4:5];}};
  const CELLS=[230400,57600,14400],PICKS=[37600,9400,2350],col=[4,3,2];
  ms.forEach((m,k)=>{m.innerHTML=`<b>${num(CELLS[k])}</b> cells per map at 640x360<br><b>${num(PICKS[k])}</b> picks per tick at full count, <b>${T6.tick[0][col[k]]}</b> ms<br>Snowing tick <b>${T6.tick[1][col[k]]}</b> ms`;});
  return {tick(dt){SS.forEach((S,k)=>{mt[k].t0();S.tick();mt[k].t1();if(view==='pic')S.render(PXs[k].u32);else cells(S,PXs[k].u32);PXs[k].put();});hud-=dt;
    if(hud<=0){hud=.4;ro.innerHTML='This page, on a 144x80 px patch. '+R.map((r,k)=>`1:${r} has <b>${num(SS[k].NF)}</b> cells, ${num(SS[k].picks)} picks and a tick of <b>${fms(mt[k].v)}</b> ms`).join('. ')+'. Timed in your browser.';}}};});

// ======================================================================
// A4 split field: four walkers, four grids. Depth and packed at 1:1, 1:2
// and 1:4, and the split with depth at 1:4 and packed at 1:2.
// ======================================================================
reg('splitfield',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),u=F.u32,L=PX(cvs[1]),ul=L.u32,c=ctl(root),W=160,H=96,LW=40,MODES=[[1,1],[2,2],[4,4],[4,2]];
  const SS=MODES.map((m,k)=>mkSnow(mkGround(LW,H,4+k),{fs:m[0],ps:m[1],thr:1,soft:60})),buf=new Uint32Array(LW*H),AC=MODES.map((m,k)=>mkActor(LW/2,-6,k));
  const fresh=()=>SS.forEach(S=>S.fill(1));fresh();c.btn('clear',fresh);c.on('bil',()=>SS.forEach(S=>S.bilin=c.v('bil')));let wait=0;
  $('[data-rows]',root).innerHTML=[['1:1','The print keeps its heel gap. Exact, at four times the cells of 1:2.','230,400 cells. Sandbox loop: sim 0.55 ms, frame 2.13 ms'],['1:2','A print is 2x3 whole cells, with 2 px of snow between the rows.','57,600 cells. Sim 0.11 ms, frame 2.01 ms'],
    ['1:4','One row keeps blunt marks. The other shrinks to slivers.','14,400 cells. Sim 0.03 ms, frame 2.11 ms'],['Split','Depth at 1:4, packed trail at 1:2. Crisp prints on soft drifts.','14,400 + 57,600 cells. Sim 0.04 ms, frame 2.27 ms']].map(r=>`<div><b>${r[0]}</b><span>${r[1]}</span><em>${r[2]}</em></div>`).join('');
  return {tick(dt){
    if(wait>0){wait-=dt;if(wait<=0){fresh();AC.forEach(a=>{a.y=-6;a.moving=false;});}}
    else{AC.forEach((a,k)=>walkActor(SS[k],a,0,56,dt));if(AC[0].y>H+36)wait=2.6;}
    SS.forEach((S,k)=>{S.tick();S.render(buf);for(let y=0;y<H;y++)u.set(buf.subarray(y*LW,y*LW+LW),y*W+k*LW);});
    for(let k=1;k<4;k++)for(let y=0;y<H;y++){const i=y*W+k*LW;u[i]=mulc(u[i],.55,.55,.62);}
    const g=c.v('grid');
    for(let k=0;k<4;k++){const ps=MODES[k][1];for(let y=0;y<40;y++)for(let x=0;x<40;x++){const ax=10+(x>>1),ay=42+(y>>1);let col=u[ay*W+k*LW+ax];
        if(g&&ps>1&&((ax%ps===0&&!(x&1))||(ay%ps===0&&!(y&1))))col=mulc(col,.88,.88,.92);ul[y*160+k*40+x]=x===0&&k>0?OUTL:col;}}
    if(wait<=0)AC.forEach((a,k)=>{a.x+=k*LW;drawActor(u,W,H,a);a.x-=k*LW;});
    F.put();L.put();}};});

// ======================================================================
// tile snow from a level map (0 bare, 1 dusting, 2 snow, 3 deep), with the
// rim and shadow-line rule. Shapes for a dual grid (15 per band) and for a
// blob set (47 per band) are generated from the neighbour bits.
// ======================================================================
function shadeLevels(u,W,H,G,LV){const B=G.B,BF=G.BF,at=(x,y,l)=>x<0||y<0||x>=W||y>=H?l:LV[y*W+x],blob=(x,y)=>seedDist((x>>1)*2+1,(y>>1)*2+1)<1.5;
  for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){const l=LV[i],n=at(x,y-1,l),w=at(x-1,y,l),s=at(x,y+1,l),e=at(x+1,y,l);let col;
    if(l<2){col=l===1?BF[i]:B[i];if(l===1&&blob(x,y))col=!blob(x,y+2)?SN_MID:!blob(x,y-2)?SN_HI:SN_BASE;else if(n>=2)col=shadeC(col);}
    else if(s<2||e<2)col=l===3?SN_SH:SN_MID;
    else if(n<2||w<2)col=SN_HI;
    else if(l===3&&at(x,y+2,l)<2)col=SN_SH;
    else if(l===3&&(n<3||w<3))col=SN_HI;
    else if(l===3&&(s<3||e<3))col=SN_MID;
    else{col=SN_BASE;if(l===3){const bx=x>>4,by=y>>3,h=hash2(bx+5,by+9);if(h<.5){const lx=(x&15)-((h*16)|0),ly=y&7;if(lx>=0&&lx<6){if(ly===3)col=SN_HI;else if(ly===4)col=SN_MID;}}}}
    u[i]=col;}}
const DX8=[0,1,1,1,0,-1,-1,-1],DY8=[-1,-1,0,1,1,1,0,-1];
const dualShape=(m,lx,ly)=>{if(m===0)return 0;if(m===15)return 1;const uu=(lx+.5)/32,v=(ly+.5)/32,val=(m&1)*(1-uu)*(1-v)+(m>>1&1)*uu*(1-v)+(m>>2&1)*(1-uu)*v+(m>>3&1)*uu*v;
  return val+.1*Math.sin((lx+m*7)*.52)*Math.sin((ly+m*3)*.61)*16*uu*(1-uu)*v*(1-v)>.5?1:0;};
const blobShape=(nb,lx,ly)=>{const px=lx+.5,py=ly+.5;let dmin=99;for(let k=0;k<8;k++){if(nb>>k&1)continue;const dx=DX8[k],dy=DY8[k],ex=dx<0?px:dx>0?32-px:0,ey=dy<0?py:dy>0?32-py:0,d=Math.hypot(ex,ey);if(d<dmin)dmin=d;}
  return dmin>5.5+1.3*Math.sin(lx*.55+ly*.33)+1.1*Math.sin(ly*.47-lx*.21)?1:0;};
// a diagonal neighbour only matters when both edge neighbours beside it hold snow: 47 distinct cases
const blobReduce=nb=>{if(!(nb&1&&nb&4))nb&=~2;if(!(nb&4&&nb&16))nb&=~8;if(!(nb&16&&nb&64))nb&=~32;if(!(nb&64&&nb&1))nb&=~128;return nb;};
const BLOB47=[...new Set(Array.from({length:256},(_,k)=>blobReduce(k)))].sort((a,b)=>a-b);
const tileGrid=(bands,TW,TH)=>(tx,ty,b)=>bands[clamp(ty,0,TH-1)*TW+clamp(tx,0,TW-1)]>=b?1:0;
const dualMask=(g,i,j,b)=>g(i-1,j-1,b)|g(i,j-1,b)<<1|g(i-1,j,b)<<2|g(i,j,b)<<3;
const blobMask=(g,tx,ty,b)=>{let nb=0;for(let k=0;k<8;k++)if(g(tx+DX8[k],ty+DY8[k],b))nb|=1<<k;return blobReduce(nb);};
// fill LV for a band grid. mode 'dual' or 'blob'
function tileLevels(LV,W,H,bands,TW,TH,mode,maxB=3){const g=tileGrid(bands,TW,TH);
  const inB=(b,x,y)=>mode==='dual'?dualShape(dualMask(g,(x+16)>>5,(y+16)>>5,b),(x+16)&31,(y+16)&31):(g(x>>5,y>>5,b)?blobShape(blobMask(g,x>>5,y>>5,b),x&31,y&31):0);
  for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){let l=0;if(inB(1,x,y)){l=1;if(maxB>1&&inB(2,x,y)){l=2;if(maxB>2&&inB(3,x,y))l=3;}}LV[i]=l;}}

// ======================================================================
// A5 autotile: paint a band per tile. The dual grid draws it with 15 shapes
// per band, the blob set with 47. The sheets light the shapes in use.
// ======================================================================
reg('autotile',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,c=ctl(root),kv=$('[data-kv]',root),W=160,H=96,TW=5,TH=3,G=mkGround(W,H,5),LV=new Uint8Array(W*H);
  const SD=PX($('[data-sh="d"]',root)),SBb=PX($('[data-sh="b"]',root)),nd=$('[data-n="d"]',root),nb=$('[data-n="b"]',root);
  const bands=Uint8Array.from([0,1,2,2,1,0,2,3,3,2,0,0,1,2,2]),g=tileGrid(bands,TW,TH);let band=2,mode='dual',prev=null,changed=0;
  const BC=[SN_MID,SN_BASE,SN_HI],DIM=U('#2a3550'),BG=U('#131a2a');
  const masks=()=>{const a=[];for(let b=1;b<=3;b++){if(mode==='dual'){for(let j=0;j<=TH;j++)for(let i=0;i<=TW;i++)a.push(dualMask(g,i,j,b));}else for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)a.push(g(tx,ty,b)?blobMask(g,tx,ty,b)+1:0);}return a;};
  const sheets=()=>{const ud=new Set(),ub=new Set();
    for(let b=1;b<=3;b++){for(let j=0;j<=TH;j++)for(let i=0;i<=TW;i++){const m=dualMask(g,i,j,b);if(m)ud.add(b*16+m);}
      for(let ty=0;ty<TH;ty++)for(let tx=0;tx<TW;tx++)if(g(tx,ty,b))ub.add(b*256+blobMask(g,tx,ty,b));}
    SD.u32.fill(BG);SBb.u32.fill(BG);
    for(let b=1;b<=3;b++){for(let m=1;m<=15;m++){const on=ud.has(b*16+m),x0=(m-1)*10+6,y0=(b-1)*10+1;for(let py=0;py<8;py++)for(let px=0;px<8;px++)SD.u32[(y0+py)*160+x0+px]=dualShape(m,px*4+2,py*4+2)?(on?BC[b-1]:DIM):(on?GR_A:BG);}
      BLOB47.forEach((nbm,q)=>{const on=ub.has(b*256+nbm),x0=(q%22)*7+3,y0=(b-1)*22+((q/22)|0)*7+1;for(let py=0;py<6;py++)for(let px=0;px<6;px++)SBb.u32[(y0+py)*160+x0+px]=blobShape(nbm,px*5.33+2.2,py*5.33+2.2)?(on?BC[b-1]:DIM):(on?GR_A:BG);});}
    SD.put();SBb.put();nd.textContent=`${ud.size} of 45 in use`;nb.textContent=`${ub.size} of 141 in use`;};
  const draw=()=>{const now=masks();if(prev&&prev.length===now.length){changed=0;for(let k=0;k<now.length;k++)if(now[k]!==prev[k])changed++;}prev=now;
    tileLevels(LV,W,H,bands,TW,TH,mode);shadeLevels(u,W,H,G,LV);
    if(c.v('grid')){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(x%32===0||y%32===0)u[i]=mulc(u[i],.6,.6,.66);else if(((x+16)%32===0&&(y&3)<2)||((y+16)%32===0&&(x&3)<2))u[i]=LAMP_Y;}}
    F.put();sheets();setHud(root,changed?`${changed} drawn tiles changed`:'');
    kv.innerHTML=`<dt>Stored per tile</dt><dd><b>1 band</b>, 0 to 3, which is 2 bits</dd><dt>This 5x3 grid</dt><dd>15 tiles</dd><dt>A 640x360 view</dt><dd><b>240 bytes</b> as a data texture at 1 texel per tile, 60 bytes at 2 bits per tile</dd><dt>The edge moves by</dt><dd><b>${mode==='dual'?'16 px':'32 px'}</b> per band change</dd><dt>Last edit</dt><dd><b>${changed}</b> drawn tiles changed, ${mode==='dual'?'4 lookups each':'8 neighbours each'}</dd>`;};
  c.seg('band',v=>band=+v);c.seg('mode',v=>{mode=v;prev=null;changed=0;draw();});c.on('grid',draw);
  pointer(cv,(p,type)=>{if(type!=='down'&&type!=='drag')return;const k=clamp(p[1]>>5,0,TH-1)*TW+clamp(p[0]>>5,0,TW-1);if(bands[k]!==band){bands[k]=band;draw();}});
  draw();return {};});

// ======================================================================
// A6 global level: Project Zomboid's one level against fixed per-tile
// noise, and Don't Starve Together's one level with object snow layers.
// ======================================================================
const HUT_S=mkHut(58,20,24),PINE_S=mkPine(13,38,7);
const driftTex=(x,y)=>{const h=hash2((x>>4)+5,(y>>3)+9);if(h<.5){const lx=(x&15)-((h*16)|0),ly=y&7;if(lx>=0&&lx<6){if(ly===3)return SN_HI;if(ly===4)return SN_MID;}}return SN_BASE;};
reg('globallevel',root=>{const cvs=$$('canvas',root),PA=PX(cvs[0]),PB=PX(cvs[1]),ua=PA.u32,ub=PB.u32,c=ctl(root),ro=$('[data-ro]',root),ro2=$('[data-ro2]',root),W=160,H=128,TW=5,TH=4,NT=20;
  const GA=mkGround(W,H,6),GB=mkGround(W,H,7),LV=new Uint8Array(W*H),bands=new Uint8Array(NT),NV=new Float32Array(NT);let mn=9,mx=-9;
  for(let k=0;k<NT;k++){const tx=k%TW,ty=(k/TW)|0,v=vnoise(tx/2.6+3,ty/2.6+8)+.5*vnoise(tx/1.3+1,ty/1.3)+.25*vnoise(tx*1.7,ty*1.7+5);NV[k]=v;if(v<mn)mn=v;if(v>mx)mx=v;}
  for(let k=0;k<NT;k++)NV[k]=.04+.94*(NV[k]-mn)/(mx-mn);
  const drawA=()=>{const s=c.v('str'),f=Math.min(1,s/7.5);let n=0;for(let k=0;k<NT;k++){bands[k]=NV[k]<=f?2:0;if(bands[k])n++;}
    tileLevels(LV,W,H,bands,TW,TH,'blob',2);for(let i=0;i<W*H;i++)if(LV[i]===1)LV[i]=2;shadeLevels(ua,W,H,GA,LV);
    if(c.v('num'))for(let k=0;k<NT;k++){const x=(k%TW)*32+12,y=((k/TW)|0)*32+13,t=String(Math.round(NV[k]*100)).padStart(2,'0');digits(ua,W,H,x+1,y+1,t,bands[k]?SN_MID:OUTL);digits(ua,W,H,x,y,t,bands[k]?OUTL:SN_HI);}
    PA.put();c.out('str',s.toFixed(1));ro.innerHTML=`snowStrength <b>${s.toFixed(1)}</b> gives a fraction of <b>${f.toFixed(2)}</b>. Snow on <b>${n} of 20</b> tiles. Synced state is <b>1 number</b>. Per-tile state on the wire is <b>0 bytes</b>.`;};
  c.on('str',drawA);c.on('num',drawA);drawA();
  let tS=c.v('t'),hold=0;c.on('t',()=>{tS=c.v('t');});
  const drawB=()=>{const lv=Math.min(1,tS/300),q=Math.round(lv*16)/16,on=lv>=.015,cap=on?200:0;
    for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++)ub[i]=q<=0?GB.B[i]:q>=1?driftTex(x,y):mix32(GB.B[i],driftTex(x,y),q);
    drawStamp(ub,W,H,HUT_S,50,82,cap);drawStamp(ub,W,H,PINE_B2,124,112,cap);PB.put();c.out('t',Math.min(300,tS).toFixed(0)+' s');
    ro2.innerHTML=`After <b>${Math.min(300,tS).toFixed(1)} s</b> of snow the level is <b>${lv.toFixed(3)}</b>. Object snow layers are <b>${on?'shown':'hidden'}</b>, with the switch at 0.015. The ground overlay is at <b>${Math.round(q*100)}%</b>.`;};
  return {tick(dt){if(c.v('play')){if(tS>=300){hold+=dt;if(hold>3){hold=0;tS=0;}}else tS=Math.min(300,tS+20*dt);c.el('t').value=tS;}drawB();}};});

// ======================================================================
// A7 per-cell depth, as RimWorld keeps it: random visits to 0.06% of the map
// per tick, a section rebuild only past 0.15, prints only at 0.4 or more.
// ======================================================================
reg('percell',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,c=ctl(root),kv=$('[data-kv]',root),W=160,H=96,TW=5,TH=3,N=15,MAPN=10000,G=mkGround(W,H,8),S=mkSnow(G,{fs:4,thr:1});
  const dep=new Float32Array(N),drawn=new Float32Array(N),nz=new Float32Array(N),AL=new Float32Array(W*H),A=mkActor(-14,60,1),prints=[];for(let k=0;k<N;k++)nz[k]=.6+.8*hash2(k,41);
  let acc=0,ticks=0,visits=0,rebuilds=-1,spd=60,mode='alpha',dist=0,foot=0,wait=0,hud=0,cell=-1,full=0;
  const bil=(arr,x,y)=>{const fx=clamp((x+.5)/32-.5,0,TW-1),fy=clamp((y+.5)/32-.5,0,TH-1),x0=Math.min(TW-2,fx|0),y0=Math.min(TH-2,fy|0),tx=fx-x0,ty=fy-y0;return (arr[y0*TW+x0]*(1-tx)+arr[y0*TW+x0+1]*tx)*(1-ty)+(arr[(y0+1)*TW+x0]*(1-tx)+arr[(y0+1)*TW+x0+1]*tx)*ty;};
  // a section rebuild copies the stored depths into the mesh: centre = the cell, edge midpoints and corners = means of 2 and 4 cells
  const rebuild=()=>{drawn.set(dep);for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++)AL[i]=bil(drawn,x,y);for(let cy=0;cy<S.FH;cy++)for(let cx=0;cx<S.FW;cx++)S.D[cy*S.FW+cx]=Math.min(200,bil(drawn,cx*4+1.5,cy*4+1.5)*72);rebuilds++;};
  const clear=()=>{dep.fill(0);prints.length=0;full=0;rebuild();};clear();c.btn('clear',clear);c.seg('spd',v=>spd=+v);c.seg('draw',v=>mode=v);
  const visit=k=>{dep[k]=Math.min(1,dep[k]+.046*1.2*nz[k]);visits++;if(Math.abs(dep[k]-drawn[k])>.15)rebuild();};
  return {tick(dt){const gt=60*dt*spd;ticks+=gt;acc+=N*.0006*gt;let guard=0;while(acc>=1&&guard++<400){acc--;visit(ri(N));}
    let mean=0;for(let k=0;k<N;k++)mean+=dep[k];if(mean/N>.985){full+=dt;if(full>5)clear();}
    if(wait>0){wait-=dt;if(wait<=0){A.x=-14;A.moving=false;cell=-1;}}
    else{const x0=A.x;walkActor(null,A,40,0,dt);dist+=A.x-x0;const k=clamp((A.y-2)>>5,0,TH-1)*TW+clamp(A.x>>5,0,TW-1);
      if(k!==cell&&A.x>=0&&A.x<W){cell=k;dep[k]=Math.max(0,dep[k]-.001);}
      if(dist>=20.2){dist-=20.2;foot^=1;if(A.x>=2&&A.x<W-2&&dep[k]>=.4)prints.push({x:Math.round(A.x)-3,y:foot?57:61,t:4.88});}
      if(A.x>W+16)wait=1.6;}
    for(let q=prints.length-1;q>=0;q--){prints[q].t-=dt;if(prints[q].t<=0)prints.splice(q,1);}
    if(mode==='thr')S.render(u);else for(let i=0;i<W*H;i++){const q=Math.round(AL[i]*8)/8;u[i]=q<=0?G.B[i]:q>=1?SN_BASE:mix32(G.B[i],SN_BASE,q);}
    for(const p of prints){const fl=p.t<1?SN_PACK:SN_PSH;rectF(u,W,H,p.x,p.y,5,3,fl);if(p.t>=1)rectF(u,W,H,p.x,p.y,5,1,SN_PDK);}
    if(c.v('num'))for(let k=0;k<N;k++){const x=(k%TW)*32+11,y=((k/TW)|0)*32+4,a=String(Math.round(dep[k]*100)).padStart(2,'0'),b=String(Math.round(drawn[k]*100)).padStart(2,'0');
      rectF(u,W,H,x-2,y-2,Math.max(a.length,b.length)*4+3,15,OUTL);digits(u,W,H,x,y,a,SN_HI);digits(u,W,H,x,y+6,b,LAMP_Y);}
    if(wait<=0)drawActor(u,W,H,A);F.put();hud-=dt;
    if(hud<=0){hud=.25;const idle=Math.max(0,visits-Math.max(0,rebuilds));
      kv.innerHTML=`<dt>Map</dt><dd>100x100 cells, 15 of them in view</dd><dt>Cells visited per tick</dt><dd><b>${Math.ceil(MAPN*.0006)}</b> of ${num(MAPN)}, which is 0.06%</dd><dt>Game ticks so far</dt><dd>${num(ticks)}</dd><dt>Visits to the cells in view</dt><dd><b>${num(visits)}</b></dd><dt>Section rebuilds</dt><dd><b>${num(Math.max(0,rebuilds))}</b></dd><dt>Visits that changed nothing on screen</dt><dd><b>${num(idle)}</b>${visits?`, ${Math.round(idle/visits*100)}%`:''}</dd><dt>Footprints alive</dt><dd><b>${prints.length}</b>, placed only at depth 0.40 or more</dd>`;}}};});

// ======================================================================
// F3 row sweep: the exposure bake as a ray per cell and as one sweep per
// row, on a 40x24 cell map. Both read cells at the same rate.
// ======================================================================
reg('rowsweep',root=>{const cvs=$$('canvas',root),PP=cvs.map(PX),c=ctl(root),ms=$$('[data-m]',root),ro=$('[data-ro]',root),bars=$('[data-bars]',root),W=160,H=96,FW=40,FH=24,NF=960,R=28;
  const G=mkGround(W,H,9),SS=[0,1].map(()=>mkSnow(G,{fs:4,thr:1})),OB=new Uint8Array(NF),EX=[new Float32Array(NF),new Float32Array(NF)],DONE=[new Uint8Array(NF),new Uint8Array(NF)],HX=84,HY=60,PXx=30,PY=90;
  // obstacle heights per cell, in the px of VFX #1 as the Sandbox keeps them: the hut's walls and the pine's trunk zone
  for(let cy=0;cy<FH;cy++)for(let cx=0;cx<FW;cx++){const x=cx*4+2,y=cy*4+2;if(Math.abs(x-HX)<=27&&y>=HY-30&&y<=HY)OB[cy*FW+cx]=14;if(Math.abs(x-PXx)<=10&&y>=PY-7&&y<=PY+3)OB[cy*FW+cx]=9;}
  // lee length in cells = (1.1 * h * wind + 2) * 4 / field ratio, with wind 0.6. Past the lee, a drift band up to 1.8 lee lengths
  const expoOf=(h,d)=>{const L=h*1.1*.6+2;return d<L?.15+.85*(d/L)*(d/L):d<L*1.8?1.12:1;};
  let dir=1,ray,sw,total=0,hold=0,same=-1,hud=0,view='snow';
  const cellAt=(n)=>{const y=(n/FW)|0,k=n%FW;return y*FW+(dir>0?k:FW-1-k);};
  const fin=(p,ci,e)=>{EX[p][ci]=e;DONE[p][ci]=1;SS[p].D[ci]=OB[ci]?0:Math.min(200,(72*e)|0);};
  const rayOp=()=>{if(ray.i>=NF)return;const ci=cellAt(ray.i);ray.ops++;
    if(OB[ci]){fin(0,ci,0);ray.i++;ray.d=0;return;}
    ray.d++;const x=ci%FW,xx=x-dir*ray.d;
    if(xx<0||xx>=FW||ray.d>R){ray.ops--;fin(0,ci,1);ray.i++;ray.d=0;return;}
    const h=OB[ci-x+xx];if(h){fin(0,ci,expoOf(h,ray.d));ray.i++;ray.d=0;}};
  const swOp=()=>{if(sw.i>=NF)return;const k=sw.i%FW,ci=cellAt(sw.i);if(k===0){sw.last=-1;sw.h=0;}sw.ops++;
    if(OB[ci]){fin(1,ci,0);sw.last=k;sw.h=OB[ci];}else{const d=k-sw.last;fin(1,ci,sw.last>=0&&d<=R?expoOf(sw.h,d):1);}sw.i++;};
  const start=()=>{ray={i:0,d:0,ops:0};sw={i:0,ops:0,last:-1,h:0};hold=0;same=-1;for(let p=0;p<2;p++){EX[p].fill(0);DONE[p].fill(0);SS[p].D.fill(0);}
    total=0;const sv=ray;while(ray.i<NF)rayOp();total=ray.ops;ray={i:0,d:0,ops:0};for(let p=0;p<2;p++){EX[p].fill(0);DONE[p].fill(0);SS[p].D.fill(0);}};
  start();c.seg('wind',v=>{dir=+v;start();});c.seg('view',v=>view=v);c.btn('again',start);c.on('spf',()=>c.out('spf',c.v('spf')));
  const pm=s=>parseFloat(s.split('/')[0]),LAB=['1:1, 230,400 cells','1:2, 57,600 cells','1:4, 14,400 cells'];
  bars.innerHTML=[3,2,1].map((j,q)=>{const r=T6.bake[0][j],s=T6.bake[1][j];return `<div class="bbar alt">Ray per cell at ${LAB[q]}: <b>${r}</b> ms<div class="tr"><i style="width:${pm(r)/15.9*100}%"></i></div></div><div class="bbar good">One sweep per row at ${LAB[q]}: <b>${s}</b> ms<div class="tr"><i style="width:${pm(s)/15.9*100}%"></i></div></div>`;}).join('');
  const ECOL=e=>e>1?SN_HI:e>=1?SN_BASE:e>.75?SN_MID:e>.45?SN_SH:SN_DEEP;
  const paint=p=>{const u=PP[p].u32;if(view==='snow')SS[p].render(u);else for(let y=0,i=0;y<H;y++)for(let x=0;x<W;x++,i++){const ci=(y>>2)*FW+(x>>2);u[i]=DONE[p][ci]&&!OB[ci]?ECOL(EX[p][ci]):G.B[i];}
    const s=p?sw:ray;if(s.i<NF){const ci=cellAt(s.i),cx=ci%FW,cy=(ci/FW)|0;
      if(!p)for(let d=1;d<=ray.d;d++){const xx=cx-dir*d;if(xx>=0&&xx<FW){put(u,W,H,xx*4+1,cy*4+1,LAMP_Y);put(u,W,H,xx*4+2,cy*4+1,LAMP_Y);put(u,W,H,xx*4+1,cy*4+2,LAMP_Y);put(u,W,H,xx*4+2,cy*4+2,LAMP_Y);}}
      else if(sw.last>=0){const lx=dir>0?sw.last:FW-1-sw.last;rectF(u,W,H,lx*4,cy*4,4,4,U('#8fb3de'));}
      rectF(u,W,H,cx*4,cy*4,4,4,LAMP_Y);rectF(u,W,H,cx*4+1,cy*4+1,2,2,OUTL);}
    drawStamp(u,W,H,HUT_S,HX,HY,70);drawStamp(u,W,H,PINE_S,PXx,PY,70);PP[p].put();};
  return {tick(dt){const n=c.v('spf');for(let k=0;k<n;k++){rayOp();swOp();}
    if(ray.i>=NF&&sw.i>=NF){if(same<0){same=0;for(let i=0;i<NF;i++)if(Math.abs(EX[0][i]-EX[1][i])<1e-9)same++;}hold+=dt;if(hold>6)start();}
    paint(0);paint(1);hud-=dt;
    if(hud<=0){hud=.15;ms[0].innerHTML=`Cell reads <b>${num(ray.ops)}</b> of ${num(total)}${ray.i>=NF?'. Done':''}`;ms[1].innerHTML=`Cell reads <b>${num(sw.ops)}</b> of ${num(NF)}${sw.i>=NF?'. Done':''}`;
      ro.innerHTML=same>=0?`Both bakes are done. <b>${num(same)} of ${num(NF)}</b> cells hold the same value. The ray version read <b>${(total/NF).toFixed(1)}</b> times as many cells.`:`Baking. The ray version is on row <b>${Math.min(FH,((ray.i/FW)|0)+1)}</b> of ${FH}${sw.i>=NF?', and the sweep finished after 960 reads':''}.`;}}};});

// ======================================================================
// F2 uploads: a 160x90 depth field as a map, with the 64x64 cell chunks of
// the 1:2 field over it, and the upload table of section 6a as bars.
// ======================================================================
reg('upload',root=>{const cv=$('canvas',root),F=PX(cv),u=F.u32,c=ctl(root),ro=$('[data-ro]',root),bars=$('[data-bars]',root),W=160,H=90,N=W*H,D=new Uint8Array(N),TR=new Uint8Array(N),dirty=new Uint8Array(15);
  const RAMPV=[U('#232a3d'),SN_DEEP,SN_SH,SN_MID,SN_BASE,SN_HI],PINES=[[70,20],[88,74],[20,62],[148,40],[60,52]];
  // a village corner as a depth map: drifts, two roofs, a path, a pond and the bare rings under five pines
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let d=96+90*(vnoise(x/23,y/19)-.5)+34*(vnoise(x/7,y/6+4)-.5);
    if(Math.abs(y-(46+7*Math.sin(x/19)))<3)d=20;const px=(x-126)/19,py=(y-22)/10;if(px*px+py*py<1)d=px*px+py*py>.72?30:52;
    for(const p of PINES){const r=Math.hypot(x-p[0],(y-p[1])*1.6);if(r<7)d=Math.min(d,r<3?0:14+r*5);}
    if(x>=16&&x<=52&&y>=8&&y<=30)d=y===8||y===30||x===16||x===52?70:y<17?132:164;if(x>=100&&x<=128&&y>=56&&y<=76)d=y===56||y===76||x===100||x===128?70:y<64?132:164;
    D[y*W+x]=clamp(d,0,200);}
  const WK=Array.from({length:6},(_,k)=>({x:20+k*24,y:40+(k%3)*14,tx:80,ty:46,k}));let wx='clear',hud=0,fr=0;c.seg('wx',v=>wx=v);
  const chunkBytes=k=>k<10?4096:3328;
  bars.innerHTML=T6.upload.map(r=>{const by=+r[1].replace(/,/g,''),nm=r[0].replace(/`/g,'');return `<div class="fl-row${/eight 64x64|320x180 R8, full/.test(nm)?' on':''}"><span class="fl-n">${nm}</span><span class="fl-b"><i class="here" style="width:${by/921600*100}%"></i><i class="ref" style="width:${+r[2]/.093*100}%"></i></span><span class="fl-v">${r[1]} bytes · ${r[2]} ms</span></div>`;}).join('');
  return {tick(dt){fr++;dirty.fill(wx==='snow'?1:0);
    for(const w of WK){const dx=w.tx-w.x,dy=w.ty-w.y,l=Math.hypot(dx,dy);if(l<1.5){w.tx=8+hash2(fr,w.k)*(W-16);w.ty=6+hash2(w.k+9,fr)*(H-12);}else{w.x+=dx/l*10*dt;w.y+=dy/l*10*dt;}
      const xi=w.x|0,yi=w.y|0;TR[yi*W+xi]=255;TR[yi*W+xi+1]=255;for(const ox of [-1,2])for(const oy of [-1,1])dirty[clamp((yi+oy)>>5,0,2)*5+clamp((xi+ox)>>5,0,4)]=1;}
    if(fr%3===0)for(let i=0;i<N;i++)if(TR[i])TR[i]--;
    for(let i=0;i<N;i++){const d=D[i],t=TR[i];u[i]=t>130?SN_PDK:t>30&&d>20?SN_PSH:RAMPV[d<8?0:d<40?1:d<75?2:d<110?3:d<150?4:5];}
    if(wx==='snow')for(let k=0;k<90;k++){const i=ri(N);if(D[i]>30)u[i]=WHITE;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x%32===0||y%32===0){const i=y*W+x;u[i]=mulc(u[i],.62,.62,.7);}
    let n=0,bytes=0;for(let k=0;k<15;k++)if(dirty[k]){n++;bytes+=chunkBytes(k);const x0=(k%5)*32,y0=((k/5)|0)*32,y1=Math.min(H-1,y0+31);for(let x=x0+1;x<x0+32;x++){put(u,W,H,x,y0+1,LAMP_Y);put(u,W,H,x,y1,LAMP_Y);}for(let y=y0+1;y<=y1;y++){put(u,W,H,x0+1,y,LAMP_Y);put(u,W,H,x0+31,y,LAMP_Y);}}
    for(const w of WK){const xi=w.x|0,yi=w.y|0;rectF(u,W,H,xi-1,yi-2,4,4,OUTL);rectF(u,W,H,xi,yi-1,2,2,LAMP_Y);}
    F.put();hud-=dt;
    if(hud<=0){hud=.3;ro.innerHTML=`Chunks changed this tick: <b>${n} of 15</b>. Sent as chunks that is <b>${num(bytes)}</b> bytes in ${n} calls. Sent as one image it is <b>57,600</b> bytes in 1 call, and that is the only path Godot has.`;}}};});
}
