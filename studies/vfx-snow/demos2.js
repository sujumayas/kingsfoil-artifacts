
// ======================================================================
// FIG 6: cost chart, log scale, 16.7 ms budget
// ======================================================================
const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,parent){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function svgText(parent,x,y,txt,attrs={}){const t=svgEl('text',{x,y,...attrs},parent);t.textContent=txt;return t;}
reg('cost',root=>{const svg=$('svg',root),c=ctl(root),tip=$('.readout',root);
  const DATA=[{k:'Composite rain layer (ToyShop)',v:4.11,lo:4.11,src:'Tatarchuk, author-reported [S35]',col:'#8fd3ff'},
    {k:'5–10K rain particles (ToyShop)',v:19.45,lo:19.45,src:'Tatarchuk, author-reported [S35]',col:'#ffb86b'},
    {k:'Batman: AO trail heightmaps',v:1,lo:1,lt:true,src:'vendor-reported “under 1 ms” on PS3/360 [S23]',col:'#9fe3b5'},
    {k:'Snow Sandbox simulation (JS, one machine)',v:9,lo:3,src:'about 3–9 ms per frame at 2–16× sim speed; illustrative, not a benchmark',col:'#c6a7ff'}];
  let log=true;c.seg('scale',v=>{log=v==='log';draw();});
  function draw(){svg.innerHTML='';const cp=root.clientWidth<600;const Wd=cp?400:720,L=cp?14:250,R=cp?16:24,T=cp?30:18,rowH=cp?52:44,Hd=T+rowH*4+40;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);
    const lo=.5,hi=32;const X=v=>log?L+(Math.log(v)-Math.log(lo))/(Math.log(hi)-Math.log(lo))*(Wd-L-R):L+v/hi*(Wd-L-R);
    const ticks=log?[.5,1,2,4,8,16,32]:(cp?[0,8,16,24,32]:[0,4,8,12,16,20,24,28,32]);
    for(const tk of ticks){const x=X(Math.max(tk,log?.5:0));svgEl('line',{x1:x,x2:x,y1:T,y2:T+rowH*4,class:'gl'},svg);svgText(svg,x,T+rowH*4+16,tk+'',{'text-anchor':'middle'});}
    svgText(svg,L+(Wd-L-R)/2,Hd-4,'milliseconds per frame ('+(log?'log':'linear')+' scale)',{'text-anchor':'middle'});
    DATA.forEach((d,i)=>{const y0=T+i*rowH+8,y=cp?y0+12:y0;if(cp)svgText(svg,L,y0+4,d.k,{class:'lab','font-size':13});else svgText(svg,L-10,y+16,d.k,{'text-anchor':'end',class:'lab','font-size':12.5});
      const x0=X(log?lo:0);const g=svgEl('g',{tabindex:0,role:'img','aria-label':`${d.k}: ${d.lo!==d.v?d.lo+'–':''}${d.lt?'<':''}${d.v} ms`},svg);
      if(d.lo!==d.v){svgEl('rect',{x:x0,y,width:X(d.lo)-x0,height:20,fill:d.col,opacity:.35,rx:2},g);svgEl('rect',{x:X(d.lo),y,width:X(d.v)-X(d.lo),height:20,fill:d.col,rx:2},g);}
      else svgEl('rect',{x:x0,y,width:Math.max(2,X(d.v)-x0),height:20,fill:d.col,rx:2,opacity:d.lt?.55:1},g);
      const lx=X(d.v)+6,txt=(d.lo!==d.v?d.lo+'–':'')+(d.lt?'< ':'')+d.v+' ms';const inside=lx+60>Wd;svgText(g,inside?X(d.v)-6:lx,y+15,txt,{class:'lab','font-size':12.5,'text-anchor':inside?'end':'start',fill:inside?'#0b1020':'#dbe4f5',style:inside?'fill:#0b1020':''});
      const show=()=>{tip.innerHTML=`<b>${d.k}</b>: ${d.lo!==d.v?d.lo+'–':''}${d.lt?'under ':''}${d.v} ms — ${d.src}. Share of a 60 fps frame: ${(d.v/16.7*100).toFixed(0)} %.`;};
      g.addEventListener('pointerenter',show);g.addEventListener('focus',show);g.addEventListener('click',show);});
    const bx=X(16.7);svgEl('line',{x1:bx,x2:bx,y1:T-12,y2:T+rowH*4,stroke:'#f6f9ff','stroke-dasharray':'4 3','stroke-width':1.5},svg);
    svgText(svg,bx-4,T-14+(cp?4:12),'16.7 ms = one 60 fps frame',{'text-anchor':'end',class:'lab','font-size':12});}
  let lastCp=null;addEventListener('resize',()=>{const cp=root.clientWidth<600;if(cp!==lastCp){lastCp=cp;draw();}});lastCp=root.clientWidth<600;
  draw();return {};});

// ======================================================================
// FIG 7: z-height flakes with ground shadow dots
// ======================================================================
reg('zflake',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);const f=Field(W,H,{seed:21});
  buildScene(f,{hx:96,hy:8,hw:44,rh:18,wh:14,trees:[[30,40],[58,82],[150,80]],rocks:[[100,70]],fences:[]});f.bakeExposure(-.3);
  for(let i=0;i<f.N;i++)if(f.holds(f.S[i]))f.D[i]=((f.S[i]===2?6:9)*f.SHL[i]+hash2(i,4)*5)|0;
  const fl=Flakes(W,H,[{n:72,vz:14,wf:.6,col:COL.FLAKE_F,sz:1},{n:42,vz:24,wf:1,col:COL.FLAKE,sz:1},{n:14,vz:42,wf:1.5,col:COL.FLAKE,sz:2}]);
  // screen-down variant: same flakes, but y increases and z is ignored
  const sd=fl.L.map(l=>({x:Float32Array.from(l.x),y:Float32Array.from(l.y)}));
  let mode='z',land=0,fr=0;c.seg('mode',v=>mode=v);
  return {tick(dt){fr++;const wind=c.v('wind')/100;c.out('wind',wind.toFixed(2));
      f.render(px.u32,{});const u=px.u32;
      if(mode==='screen'){fl.L.forEach((l,li)=>{const s=sd[li];for(let k=0;k<l.n;k++){s.y[k]+=l.vz*dt;s.x[k]+=(wind*22*l.wf+Math.sin(l.ph[k]+fr*.05)*4)*dt;if(s.y[k]>H+2){s.y[k]=-2;s.x[k]=rnd()*W;}
          if(s.x[k]<0)s.x[k]+=W;if(s.x[k]>=W)s.x[k]-=W;const x=s.x[k]|0,y=s.y[k]|0;if(x<0||y<0||x>=W-1||y>=H-1)continue;const i=y*W+x;u[i]=l.col;if(l.sz===2){u[i+1]=l.col;u[i+W]=l.col;u[i+W+1]=COL.FLAKE_F;}}});
        setHud(root,'screen-down fall: flakes slide south across the map');}
      else{fl.update(dt,wind,1,(x,y)=>{if(x>=0&&y>=0&&x<W&&y<H){land++;const i=y*W+x;if(rnd()<f.E[i])f.deposit(i,2);}});
        if(c.v('stems')){const l=fl.L[2];for(let k=0;k<l.n;k++){const gx=l.x[k]|0,gy=l.y[k]|0;for(let yy=(l.y[k]-l.z[k])|0;yy<gy;yy+=2){if(gx>=0&&gx<W&&yy>=0&&yy<H)u[yy*W+gx]=mix32(u[yy*W+gx],C32('#ffb86b'),.6);}}}
        fl.draw(u,mode==='z');setHud(root,`${mode==='z'?'z-height + shadow dot':'z-height, no shadow'} · landings ${land}`);}
      px.put();}};});

// ======================================================================
// FIG 8: OpenTTD-style density levels: scanline sweep vs LFSR order
// ======================================================================
reg('lfsr',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),Bp=PX(cvs[1]);const W=64,H=64,N=W*H,c=ctl(root);
  const height=new Uint8Array(N);for(let y=0;y<H;y++)for(let x=0;x<W;x++)height[y*W+x]=Math.round((vnoise(x/11,y/11)*.7+vnoise(x/4,y/4)*.3)*9);
  const mk=()=>({lvl:new Int8Array(N).fill(-1),tile:1,last:new Uint16Array(16)});let sa=mk(),sb=mk();
  const FB=0xD8F;const COLS=[C32('#3b5a45'),C32('#9eaedb'),C32('#c4d1ea'),C32('#e2eaf6'),C32('#f6f9ff')];
  const visit=(s,t,snowline)=>{const k=height[t]-snowline+1;if(s.lvl[t]<0){if(k>=0)s.lvl[t]=0;else return;}const req=k<0?0:Math.min(k,3);const cur=s.lvl[t];
    if(cur===req){if(k<0)s.lvl[t]=-1;}else s.lvl[t]+=cur<req?1:-1;};
  let ticks=0,acc=0;c.btn('reset',()=>{sa=mk();sb=mk();ticks=0;});
  const draw=(P,s)=>{const u=P.u32;for(let i=0;i<N;i++){const l=s.lvl[i];let col=l<0?COL.GR_A:COLS[l+1];if(l<0&&height[i]>6)col=COL.GR_B;u[i]=col;}
    if(c.v('hl'))for(let k=0;k<16;k++)u[s.last[k]]=C32('#ffb86b');P.put();};
  return {tick(dt){const sp=c.v('sp'),sl=c.v('sl');c.out('sp',sp+' ticks/s');c.out('sl',sl);acc+=dt*sp;let n=0;
      while(acc>=1&&n<400){acc--;n++;ticks++;const per=N>>8;
        for(let k=0;k<per;k++){sa.tile=(sa.tile+1)%N;visit(sa,sa.tile,sl);sa.last[k]=sa.tile;
          sb.tile=(sb.tile>>1)^(-(sb.tile&1)&FB);visit(sb,sb.tile,sl);sb.last[k]=sb.tile;}}
      draw(A,sa);draw(Bp,sb);setHud(root,`tick ${ticks} · ${N>>8} tiles per tick · each tile once per 256 ticks`);}};});

// ======================================================================
// FIG 9: tile-state swap vs per-pixel threshold dither
// ======================================================================
reg('tiledither',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),Bp=PX(cvs[1]);const W=A.W,H=A.H,c=ctl(root);const f=Field(W,H,{seed:41});
  // a roofed shed + wall so exposure can matter
  for(let y=10;y<26;y++)for(let x=70;x<100;x++)f.put(x,y,9,y===10||y===25?COL.ROOF_D:(y%4===3?COL.ROOF_B:COL.ROOF_A),20,30,y>=23);
  for(let y=26;y<31;y++)for(let x=72;x<98;x++)f.put(x,y,9,y===30?COL.WALL_D:COL.WALL_A,20,30,true);
  for(let y=31;y<37;y++)for(let x=71;x<99;x++)f.SHL[y*W+x]*=Math.min(1,.15+(y-31)/6);
  for(let y=40;y<64;y++)for(let x=30;x<32;x++)f.put(x,y,9,y%3?COL.FEN_D:COL.FEN_A,10,64,true);
  f.bakeExposure(-.6);
  const tileT=[];for(let ty=0;ty<Math.ceil(H/8);ty++)for(let tx=0;tx<W/8;tx++)tileT.push(hash2(tx*3+1,ty*7+2));
  const snowTile=(x,y)=>{const q=(x&7)+(y&7)*8;return (q%9===0)?COL.MID:((x+y)&7)===0?COL.HI:COL.BASE;};
  let mode='tiles',anim=false,dir=1,prev=new Uint8Array((W/8)*Math.ceil(H/8)),pops=0;
  c.seg('mode',v=>mode=v);c.btn('anim',b=>{anim=!anim;b.classList.toggle('on',anim);b.textContent=anim?'Stop':'Animate snow level';});
  return {tick(dt){const el=c.el('lvl');if(anim){let v=+el.value+dir*dt*18;if(v>=100){v=100;dir=-1;}if(v<=0){v=0;dir=1;}el.value=v;}
      const lvl=+el.value/100,expo=c.v('expo');c.out('lvl',lvl.toFixed(2));
      const a=A.u32,b=Bp.u32;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(f.S[i]===9){a[i]=b[i]=f.G[i];continue;}
        const ti=(y>>3)*(W/8)+(x>>3);const on=mode==='swap'?lvl>=.5:lvl>tileT[ti];a[i]=on?snowTile(x,y):f.G[i];
        const d=lvl*16*(expo?f.E[i]:1);b[i]=d>f.thr[i]?COL.BASE:f.G[i];}
      let changed=0;for(let ti=0;ti<prev.length;ti++){const on=mode==='swap'?(lvl>=.5?1:0):(lvl>tileT[ti]?1:0);if(on!==prev[ti]){changed++;prev[ti]=on;}}if(changed)pops+=changed;
      A.put();Bp.put();setHud(root,'');c.out('pops',`${pops} whole-tile pops so far`);}};});

// ======================================================================
// FIG 10: exposure painter: shelter x wind lee, drift band, rays
// ======================================================================
reg('exposure',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('.readout',root);let f;
  const walls=new Uint8Array(W*H),trees=[[44,40],[120,64]];
  for(let y=20;y<36;y++)for(let x=96;x<99;x++)walls[y*W+x]=1;for(let x=20;x<60;x++)for(let y=66;y<68;y++)walls[y*W+x]=1;
  for(let y=14;y<24;y++)for(let x=128;x<148;x++)walls[y*W+x]=2;
  let tool='wall',view='expo',hover=null,dirty=true,wb=-.5;
  const rebuild=()=>{const D=f?f.D:null;f=Field(W,H,{seed:8});if(D)f.D.set(D);
    for(let i=0;i<W*H;i++)if(walls[i])f.put(i%W,(i/W)|0,9,walls[i]===2?((i>>1)%3?COL.ROOF_A:COL.ROOF_B):(((i/W)|0)%3?COL.FEN_D:COL.FEN_A),walls[i]===2?24:10,0,true);
    for(const [tx,ty] of trees){for(let y=ty-7;y<=ty+6;y++)for(let x=tx-11;x<=tx+11;x++){if(x<0||y<0||x>=W||y>=H)continue;const dx=(x-tx)/10,dy=(y-ty)/5,r=Math.sqrt(dx*dx+dy*dy);if(r<1)f.SHL[y*W+x]*=.12+.88*r*r;}
      for(let y=ty-1;y<=ty+1;y++)for(let x=tx-1;x<=tx+1;x++)if(x>=0&&y>=0&&x<W&&y<H)f.put(x,y,9,COL.TRUNK,20,0,true);
      for(let y=ty-1;y<=ty+1;y++)for(let x=tx-5;x<=tx+5;x++)if(x>=0&&x<W&&y>=0&&y<H)f.WOB[y*W+x]=Math.max(f.WOB[y*W+x],20);}
    f.bakeExposure(wb);for(let i=0;i<W*H;i++)if(!f.holds(f.S[i]))f.D[i]=0;dirty=false;};
  rebuild();
  c.seg('tool',v=>tool=v);c.seg('view',v=>view=v);c.btn('clear',()=>{f.D.fill(0);});
  c.on('wind',()=>{const w=c.v('wind')/100;c.out('wind',(w<0?'← ':'→ ')+Math.abs(w).toFixed(2)+` (bucket ${Math.round(w*2)/2})`);const nb=Math.round(w*2)/2;if(nb!==wb){wb=nb;dirty=true;}});c.out('wind','← 0.50 (bucket -0.5)');
  const paint=(x,y)=>{if(tool==='tree'){if(!trees.some(([a,b])=>Math.abs(a-x)<6&&Math.abs(b-y)<4))trees.push([x,y]);dirty=true;return;}
    for(let yy=y-1;yy<=y+1;yy++)for(let xx=x;xx<=x+1;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;const i=yy*W+xx;
      if(tool==='wall'){walls[i]=1;}else{walls[i]=0;for(let k=trees.length-1;k>=0;k--)if(Math.abs(trees[k][0]-xx)<3&&Math.abs(trees[k][1]-yy)<3)trees.splice(k,1);}}dirty=true;};
  let lastP=null;pointer(cv,([x,y],k)=>{if(k==='down'||(k==='drag'&&tool!=='tree')){if(k==='down'||!lastP||lastP[0]!==x||lastP[1]!==y)paint(x,y);lastP=[x,y];}if(k==='up')lastP=null;hover=k==='leave'?null:[x,y];});
  const ray=(x,y)=>{const mag=Math.abs(wb),dir=Math.sign(wb);if(mag<=.15)return {txt:'wind bucket 0: no lee test'};
    for(let d=1;d<=28;d++){const sx=x-dir*d;if(sx<0||sx>=W)return {d,end:sx,txt:`ray left the map after ${d-1} px: no obstacle upwind`};const h=f.WOB[y*W+sx];
      if(h>0){const L=h*1.1*mag+2;return {d,end:sx,hit:true,txt:`hit obstacle h=${h} at d=${d} · L = 1.1·h·|wind| + 2 = ${L.toFixed(1)} · ${d<L?`lee: × ${(0.15+0.85*(d/L)**2).toFixed(2)}`:d<1.8*L?'drift band: × 1.12':'beyond 1.8·L: no change'}`};}}
    return {d:28,end:x-dir*28,txt:'28 px upwind and no obstacle: open ground'};};
  return {tick(dt){if(dirty)rebuild();
      const u=px.u32;
      if(view==='snow'){for(let s=0;s<2;s++){f.snowfall(300);f.sandpile(1200);}f.render(u,{});}
      else{for(let i=0;i<W*H;i++)u[i]=f.holds(f.S[i])?HEAT[clamp((f.E[i]/1.3*255)|0,0,255)]:f.G[i];}
      for(const [tx,ty] of trees){for(let y=ty-6;y<=ty+3;y++)for(let x=tx-8;x<=tx+8;x++){if(x<0||y<0||x>=W||y>=H)continue;const dx=(x-tx)/8,dy=(y-ty+1)/4.5;if(dx*dx+dy*dy<1&&((x+y)&1||view==='snow'))u[y*W+x]=(x<tx?COL.CAN_A:COL.CAN_B);}}
      if(hover&&hover[0]>=0){const [x,y]=hover;const i=y*W+x;if(f.holds(f.S[i])){const r=ray(x,y);const dir=Math.sign(wb);
          if(r.end!==undefined)for(let d=1;d<r.d;d++){const sx=x-dir*d;if(sx>=0&&sx<W)u[y*W+sx]=C32('#ffb86b');}
          if(r.hit&&r.end>=0&&r.end<W)u[y*W+r.end]=C32('#ff6e5a');u[i]=C32('#ffffff');
          ro.innerHTML=`cell (${x},${y}) · exposure <b>${f.E[i].toFixed(2)}</b> · shelter ${f.SHL[i].toFixed(2)} · ${r.txt}`;}}
      px.put();}};});

// ======================================================================
// FIG 11: sandpile / talus relaxation with a cross-section
// ======================================================================
reg('sandpile',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),Pr=PX(cvs[1]);const W=A.W,H=A.H,c=ctl(root);const f=Field(W,H,{seed:2});
  for(let i=0;i<f.N;i++)f.D[i]=16+((hash2(i,9)*3)|0);let row=H>>1;
  const drop=(x,y,amt=60)=>{row=y;for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++){if(xx<1||yy<1||xx>=W-1||yy>=H-1)continue;const i=yy*W+xx;f.D[i]=Math.min(200,f.D[i]+amt);}};
  drop(30,26,120);drop(60,20,90);
  pointer(A.cv,([x,y],k)=>{if(k==='down'||k==='drag')drop(x,y,k==='down'?90:25);});
  c.btn('rand',()=>{for(let k=0;k<5;k++)drop(4+ri(W-8),4+ri(H-8),100);});c.btn('clear',()=>{for(let i=0;i<f.N;i++)f.D[i]=16+((hash2(i,9)*3)|0);});
  return {tick(dt){const n=c.v('n'),T=c.v('t');c.out('n',n);c.out('t','> '+T);f.sandpile(n,T);f.render(A.u32,{});
      for(let x=0;x<W;x+=2)A.u32[row*W+x]=mix32(A.u32[row*W+x],C32('#ffb86b'),.7);A.put();
      const u=Pr.u32,PH=Pr.H;u.fill(C32('#0a1022'));let mx=0;for(let x=0;x<W;x++)mx=Math.max(mx,f.D[row*W+x]);const sc=(PH-2)/Math.max(60,mx);
      for(let x=0;x<W;x++){const h=Math.round(f.D[row*W+x]*sc);for(let y=0;y<h;y++)u[(PH-1-y)*W+x]=y===h-1?COL.HI:(y>h-4?COL.BASE:COL.SH);}
      for(let x=0;x<W;x+=3){const y=PH-1-Math.round(T*12*sc);if(y>=0&&y<PH)u[y*W+x]=C32('#3c4f86');}
      Pr.put();setHud(root,`cross-section row ${row} · tallest column ${mx} u`);}};});

// ======================================================================
// FIG 12: snow caps via the "empty pixel above" rule
// ======================================================================
reg('caps',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);
  const A=new Uint32Array(W*H),heat=new Uint8Array(W*H);const bg=C32('#22305e');
  const R=(x0,y0,x1,y1,col,h)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(x>=0&&y>=0&&x<W&&y<H){A[y*W+x]=typeof col==='function'?col(x,y):col;if(h)heat[y*W+x]=1;}};
  // cabin: roof rows narrowing upward, wall, chimney (heat source)
  for(let k=0;k<12;k++)R(8+k,26-k,44-k,26-k,(x,y)=>(y%3===0?COL.ROOF_B:COL.ROOF_A));R(10,27,42,40,(x,y)=>(x===10||x===42||y===40)?COL.WALL_D:COL.WALL_A);R(22,32,28,40,COL.DOOR);R(14,30,18,34,COL.WIN);R(34,30,38,34,COL.WIN);
  R(36,10,39,20,(x,y)=>(x+y)%4?C32('#77727a'):C32('#55505a'),true);
  // fence
  for(let x=52;x<=90;x++){if((x-52)%7<2)R(x,30,x,40,(x%2)?COL.FEN_D:COL.FEN_A);}R(52,33,90,33,COL.FEN_A);R(52,37,90,37,COL.FEN_A);
  // rock
  for(let y=46;y<58;y++)for(let x=8;x<32;x++){const dx=(x-20)/12,dy=(y-53)/6;if(dx*dx+dy*dy<1)A[y*W+x]=y<52?(x>22?COL.ROCK_B:COL.ROCK_A):COL.ROCK_C;}
  // pine
  for(const [cy,r,h] of [[60,10,8],[52,8,7],[45,5,6]])for(let k=0;k<=h;k++){const hw=Math.round(r*(1-k/h));R(70-hw,cy-k,70+hw,cy-k,(x,y)=>x<70?COL.CAN_A:COL.CAN_B);}R(69,61,71,63,COL.TRUNK);
  // lamp
  R(102,22,102,48,C32('#2c2a33'));R(100,19,104,21,C32('#ffd27a'));R(99,18,105,18,C32('#2c2a33'));
  R(112,40,140,44,(x,y)=>y===40?COL.ROCK_A:COL.ROCK_B);R(112,45,140,47,COL.ROCK_C);
  const solid=i=>A[i]!==0;
  return {tick(){const lvl=c.v('lvl'),k=c.v('k'),lip=c.v('lip'),hi=c.v('hi'),excl=c.v('excl');c.out('lvl',lvl+' px');c.out('k',k.toFixed(1));
      const u=px.u32;for(let i=0;i<W*H;i++)u[i]=A[i]||bg;
      for(let y=1;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!solid(i)||solid(i-W))continue;if(excl&&heat[i])continue;
        // edge distance along the top run
        let l=0;while(x-l-1>=0&&solid(i-l-1)&&!solid(i-l-1-W))l++;let r=0;while(x+r+1<W&&solid(i+r+1)&&!solid(i+r+1-W))r++;const ed=Math.min(l,r)+1;
        const t=Math.min(lvl,Math.ceil(k*ed));if(hi){u[i]=C32('#ffb86b');continue;}
        for(let d=0;d<t;d++){const j=i+d*W;if(y+d>=H||!solid(j))break;u[j]=d===0?COL.HI:d===t-1&&t>1?COL.MID:COL.BASE;}
        if(lip&&t>0){if(l===0&&x>0&&!solid(i-1))u[i-1]=COL.BASE;if(r===0&&x<W-1&&!solid(i+1))u[i+1]=COL.BASE;}}
      px.put();}};});
