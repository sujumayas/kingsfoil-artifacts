// ======================================================================
// demos2: spreading fire, smoke fields and combat fire (families D to G).
// Local helpers are prefixed f2 so they never clash with core.js or the
// other demos files.
// ======================================================================
const f2H=(a,b,c,d)=>{let h=Math.imul((a|0)^0x9E3779B9,0x85EBCA6B);h^=Math.imul((b|0)+0x632BE5AB,0xC2B2AE35);h=(h<<13)|(h>>>19);h^=Math.imul((c|0)+0x27D4EB2F,0x165667B1);h=(h<<11)|(h>>>21);h^=Math.imul((d|0)+0x61C88647,0x2545F491);h^=h>>>15;h=Math.imul(h,0x2C1B3C6D);h^=h>>>12;h=Math.imul(h,0x297A2D39);h^=h>>>15;return (h>>>0)/4294967296;};
const f2FIRE=['#1e0a08','#4a140c','#8a240e','#c43c12','#ec6a1a','#ffa232','#ffd468','#fff4c8'].map(U);
const f2GR=['#3b6631','#46753a','#528443','#5f924b'].map(U);
const f2ASH=['#3c3638','#4c4547','#5a5355'].map(U);
const f2EMB=['#3a1410','#6a1e10','#9a2a10'].map(U);
const f2rect=(u,W,H,x,y,w,h,col)=>{const x0=Math.max(0,x|0),y0=Math.max(0,y|0),x1=Math.min(W,(x+w)|0),y1=Math.min(H,(y+h)|0);for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++)u[j*W+i]=col;};
const f2disc=(u,W,H,cx,cy,r,col,lev)=>{for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){if(x<0||y<0||x>=W||y>=H)continue;const dx=x+.5-cx,dy=y+.5-cy;if(dx*dx+dy*dy>r*r)continue;if(lev===undefined||lev>bay(x,y))u[y*W+x]=col;}};
const f2clr=svg=>{while(svg.firstChild)svg.removeChild(svg.firstChild);};
const f2log=(v,a,b,x0,x1)=>x0+(Math.log10(v)-Math.log10(a))/(Math.log10(b)-Math.log10(a))*(x1-x0);
const f2ARW=['→','↘','↓','↙','←','↖','↑','↗'];
const f2arrow=deg=>f2ARW[Math.round((((deg%360)+360)%360)/45)%8];
const f2fmt=s=>{s=Math.max(0,Math.round(s));return (s/60|0)+':'+String(s%60).padStart(2,'0');};
const f2NB4=[[1,0],[0,1],[-1,0],[0,-1]],f2NB8=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
// fixed pool of dithered puffs (steam, smoke)
function f2Puffs(n){const P={x:new Float32Array(n),y:new Float32Array(n),l:new Float32Array(n),m:new Float32Array(n),vx:new Float32Array(n),
  add(x,y,life,vx){for(let i=0;i<n;i++)if(P.l[i]<=0){P.x[i]=x;P.y[i]=y;P.l[i]=life;P.m[i]=life;P.vx[i]=vx||0;return;}},
  step(dt,rise){for(let i=0;i<n;i++)if(P.l[i]>0){P.l[i]-=dt;P.y[i]-=rise*dt;P.x[i]+=P.vx[i]*dt;}},
  draw(u,W,H,col,col2){for(let i=0;i<n;i++)if(P.l[i]>0){const k=P.l[i]/P.m[i],r=1+(1-k)*2.4;f2disc(u,W,H,P.x[i],P.y[i],r,k>.5&&col2?col2:col,k*17);}},
  count(){let c=0;for(let i=0;i<n;i++)if(P.l[i]>0)c++;return c;},clear(){P.l.fill(0);}};return P;}
// small grass field colour by hash
const f2grass=(x,y,s)=>f2GR[(hash2(x+s*131,y)*4)|0];

// ======================================================================
// D2/D5: tile fire CA with ignite chance, moisture, wind, diagonal factor
// ======================================================================
reg('spread',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,N=W*H,c=ctl(root),ro=$('[data-ro]',root);
  const S=new Uint8Array(N),L=new Uint8Array(N);let act=new Int32Array(N),na=0,nxt=new Int32Array(N);
  let ox=W>>1,oy=H>>1,acc=0,ticks=0,idle=0,fr=0,burnt=0,burning=0;
  const reset=()=>{S.fill(0);L.fill(0);na=0;ticks=0;burnt=0;burning=0;idle=0;};
  const ignite=(x,y)=>{x=clamp(x|0,0,W-2);y=clamp(y|0,0,H-2);for(let j=0;j<2;j++)for(let i=0;i<2;i++){const k=(y+j)*W+x+i;if(S[k]===0){S[k]=1;L[k]=c.v('T');act[na++]=k;burnt++;}}ox=x;oy=y;idle=0;};
  pointer(cv,([x,y],k)=>{if(k==='down')ignite(x,y);});
  c.btn('reset',()=>{reset();ignite(W>>1,H>>1);});
  const PRE={sq:['8',100,100,1],dia:['4',100,100,1],round:['8',50,70,1],vn:['4',60,100,1],die:['8',30,70,1],fix:['8',30,70,4]};
  c.seg('pre',v=>{const P=PRE[v];c.setSeg('nb',P[0]);c.el('p').value=P[1];c.el('df').value=P[2];c.el('T').value=P[3];c.el('V').value=0;c.el('m').value=0;reset();ignite(W>>1,H>>1);});
  c.seg('nb',()=>{});
  const pw=(V,cs)=>Math.exp(V*(0.045+0.131*(cs-1)));
  function step(){const nb=c.segv('nb')==='4'?f2NB4:f2NB8,p=c.v('p')/100,m=c.v('m')/100,df=c.v('df')/100,V=c.v('V'),wd=c.v('wd')*Math.PI/180,wx=Math.cos(wd),wy=Math.sin(wd),T=c.v('T');
    const fac=nb.map(([dx,dy])=>{const l=Math.hypot(dx,dy);return Math.min(1,p*(1-m)*pw(V,(dx*wx+dy*wy)/l)*(l>1?df:1));});
    let nn=0;burning=0;
    for(let a=0;a<na;a++){const k=act[a];if(S[k]===1){const x=k%W,y=(k/W)|0;
        for(let j=0;j<nb.length;j++){const xx=x+nb[j][0],yy=y+nb[j][1];if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(S[q]===0&&rnd()<fac[j]){S[q]=1;L[q]=T;nxt[nn++]=q;burnt++;burning++;}}
        if(--L[k]<=0){S[k]=2;L[k]=5;}else burning++;nxt[nn++]=k;}
      else if(S[k]===2){if(--L[k]<=0)S[k]=3;else nxt[nn++]=k;}}
    const t=act;act=nxt;nxt=t;na=nn;ticks++;}
  function ratio(){const ext=(dx,dy)=>{let r=0,last=0;for(;;){r++;const x=ox+dx*r,y=oy+dy*r;if(x<0||y<0||x>=W||y>=H)return last>=r-1&&last>0?-1:last;if(S[y*W+x]!==0)last=r;}};
    const ax=[ext(1,0),ext(-1,0),ext(0,1),ext(0,-1)],dg=[ext(1,1),ext(-1,1),ext(-1,-1),ext(1,-1)];if(ax.some(v=>v<0)||dg.some(v=>v<0))return null;
    const a=(ax[0]+ax[1]+ax[2]+ax[3])/4,d=(dg[0]+dg[1]+dg[2]+dg[3])/4*Math.SQRT2;return a<6?null:d/a;}
  ignite(W>>1,H>>1);let lastR=null;
  return {tick(dt){fr++;acc+=dt;let n=0;while(acc>=0.1&&n<3){acc-=0.1;step();n++;}if(acc>0.3)acc=0;
    if(na===0){idle+=dt;if(idle>2.2&&motion){reset();ignite(W>>1,H>>1);}}
    const m=c.v('m')/100,G=f2GR.map(g=>mix32(g,U('#2a4652'),m*.65)),u=F.u32,ff=fr>>2;
    for(let i=0;i<N;i++){const s=S[i];const x=i%W,y=(i/W)|0;
      if(s===0)u[i]=G[(hash2(x,y)*4)|0];
      else if(s===1)u[i]=f2FIRE[4+((f2H(i,ff,1,2)*4)|0)>7?7:4+((f2H(i,ff,1,2)*4)|0)];
      else if(s===2)u[i]=f2EMB[L[i]>3?2:L[i]>1?1:0];
      else u[i]=f2ASH[(hash2(x+9,y)*3)|0];}
    F.put();
    const r=ratio();if(r!==null)lastR=r;
    c.out('p',(c.v('p')/100).toFixed(2));c.out('df',(c.v('df')/100).toFixed(2));c.out('T',c.v('T'));c.out('m',c.v('m')+'%');c.out('wd',f2arrow(c.v('wd'))+' '+c.v('wd')+'°');c.out('V',c.v('V')+' m/s');
    if(fr%5===0){const V=c.v('V');setHud(root,`tick ${ticks} · wind ${f2arrow(c.v('wd'))} ${V} m/s · burning ${burning}`);
      const sh=lastR===null?'measuring…':lastR<.82?'diamond':lastR>1.22?'square':'round';
      ro.innerHTML=`diagonal ÷ axis radius <b>${lastR===null?'–':lastR.toFixed(2)}</b> (${sh}; 0.71 diamond, 1.41 square, about 1 round) · catch chance over ${c.v('T')} burning tick${c.v('T')>1?'s':''} 1 − (1 − p)<sup>T</sup> = <b>${(1-Math.pow(1-c.v('p')/100*(1-m),c.v('T'))).toFixed(2)}</b> · wind ×${pw(V,1).toFixed(2)} downwind, ×${pw(V,-1).toFixed(2)} upwind · tiles burnt <b>${burnt}</b>`;}}};});

// ======================================================================
// D4/E1/E3/6d: measured cost chart, log scale, 16.7 ms frame line
// ======================================================================
reg('costchart',root=>{const svg=$('svg',root),c=ctl(root),ro=$('[data-ro]',root);
  const R=[{g:'Fire CA at 320x180 (about 1,500 burning)'},
    {n:'Active list',js:.056,gd:.30,t:'Only burning tiles and their neighbours are visited. 10x cheaper than a sweep in JS, 35x in GDScript.'},
    {n:'Full sweep',js:.55,gd:10.5,t:'Every tile every tick. 10.5 ms in GDScript is most of a 60 fps frame.'},
    {g:'Fire CA at 1024x1024 (JS only)'},
    {n:'Active list',js:.085,t:'Cost follows burning tiles, not map size, so a huge map barely costs more.'},
    {n:'Full sweep',js:15.8,t:'186x the active list. One sweep nearly fills a 16.7 ms frame even in V8.'},
    {g:'Smoke at 320x180'},
    {n:'Smoke CA (integer)',js:.077,gd:3.9,t:'The 5-tap integer kernel with −1 decay. GDScript is about 50x slower than V8 here.'},
    {n:'Advection + decay',js:.31,t:'Semi-Lagrangian back-trace with a fixed wind, no pressure solve.'},
    {n:'Stam fluids, 4 iterations',js:7.2,t:'Real fluid, cut to 4 solver iterations. Still too heavy at screen size.'},
    {n:'Stam fluids, 20 iterations',js:32.1,t:'Stam 2003 as written. Two frames of budget for one smoke layer.'},
    {g:'Smoke at 64x64'},
    {n:'Smoke CA',js:.009,gd:.28,t:'A coarse grid makes even GDScript cheap.'},
    {n:'Stam fluids, 4 iterations',js:.45,t:'The study allows one fixed 64x64 hero effect at this size.'},
    {n:'Stam fluids, 20 iterations',js:1.82,t:'Full Stam at 64x64 fits under the 2 ms rule only just.'}];
  let sel=2;const X0=196,X1=590,LO=.005,HI=60,X=v=>f2log(clamp(v,LO,HI),LO,HI,X0,X1);
  const HH=+svg.getAttribute('viewBox').split(' ')[3];
  function draw(){f2clr(svg);const eng=c.segv('eng'),ph=c.v('ph');const top=22,bot=HH-26;
    for(const v of [.01,.1,1,10]){svgEl('line',{x1:X(v),x2:X(v),y1:top,y2:bot,class:'gl'},svg);svgText(svg,X(v),HH-10,(v<1?String(v):v)+' ms',{'text-anchor':'middle','font-size':11});}
    svgEl('line',{x1:X(16.7),x2:X(16.7),y1:top-8,y2:bot,stroke:'#ff6b5e','stroke-width':1.5},svg);svgText(svg,X(16.7)-3,top-10+6,'16.7 ms frame',{'text-anchor':'end','font-size':11,fill:'#ff8f7a'});
    svgEl('line',{x1:X(2),x2:X(2),y1:top-8,y2:bot,stroke:'#9fc7d6','stroke-dasharray':'4 3'},svg);svgText(svg,X(2)-3,top-10+6,'2 ms for all fire and smoke',{'text-anchor':'end','font-size':11,fill:'#9fc7d6'});
    let y=top+6;
    R.forEach((r,i)=>{if(r.g){svgText(svg,8,y+12,r.g,{'font-size':11.5,fill:'#ffb44a','font-weight':600});y+=19;return;}
      const on=i===sel;if(on)svgEl('rect',{x:4,y:y-2,width:632,height:22,fill:'#2a1c15'},svg);
      svgText(svg,X0-8,y+12,r.n,{'text-anchor':'end','font-size':12,fill:on?'#f3e9df':'#b8a696'});
      const bars=[];if(eng!=='gd')bars.push(['js',r.js,'#ffb44a']);if(eng!=='js'&&r.gd)bars.push(['gd',r.gd,'#e8622c']);
      bars.forEach(([k,v,col],bi)=>{const by=y+(bars.length>1?bi*9:4),bh=bars.length>1?8:11;
        if(ph)svgEl('rect',{x:X(v),y:by,width:Math.max(1,X(v*6)-X(v)),height:bh,fill:col,'fill-opacity':.22},svg);
        svgEl('rect',{x:X0,y:by,width:Math.max(1.5,X(v)-X0),height:bh,fill:col,rx:1},svg);
        const vx=X(ph?v*6:v)+4;svgText(svg,vx,by+bh-1,(v<.1?v.toFixed(3):v<10?String(+v.toFixed(2)):v.toFixed(1))+(k==='gd'?' GD':' JS'),{'font-size':10.5,fill:'#f3e9df'});});
      if(eng==='js'&&!r.js){}
      const hit=svgEl('rect',{x:0,y:y-2,width:640,height:22,fill:'transparent',style:'cursor:pointer'},svg);hit.addEventListener('click',()=>{sel=i;draw();});
      y+=23;});
    const r=R[sel];const ratio=r.gd?` · GDScript ÷ JS = <b>${(r.gd/r.js).toFixed(0)}x</b>`:'';
    ro.innerHTML=`<b>${r.n}</b>: ${r.js} ms in JS${r.gd?`, ${r.gd} ms in GDScript`:''}${ratio} · ${r.t}${ph?' · faint bars stretch to 6x for a phone (not measured; assume 3 to 6 times slower)':''}`;}
  c.seg('eng',draw);c.on('ph',draw);draw();
  return {tick(){}};});

// ======================================================================
// D7: percolation threshold, random fuel density
// ======================================================================
reg('percolation',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,N=W*H,c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);
  const fuel=new Uint8Array(N),st=new Uint8Array(N);let front=new Int32Array(N),nf=0,nxt=new Int32Array(N),seed=7,crossed=false,done=false,burntN=0,fuelN=0,maxX=0,hold=0,fr=0;
  const nbOf=()=>c.segv('nb')==='4'?f2NB4:f2NB8;
  function build(){const d=c.v('d')/1000;fuelN=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;fuel[i]=f2H(seed,x,y,7)<d?1:0;fuelN+=fuel[i];}
    st.fill(0);nf=0;for(let y=0;y<H;y++){const i=y*W;if(fuel[i]){st[i]=1;front[nf++]=i;}}crossed=false;done=false;burntN=nf;maxX=0;hold=0;}
  function step(){const nb=nbOf();let nn=0;for(let a=0;a<nf;a++){const k=front[a],x=k%W,y=(k/W)|0;st[k]=2;
      for(const [dx,dy] of nb){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;const q=yy*W+xx;if(fuel[q]&&!st[q]){st[q]=1;nxt[nn++]=q;burntN++;if(xx>maxX)maxX=xx;if(xx===W-1)crossed=true;}}}
    const t=front;front=nxt;nxt=t;nf=nn;if(!nf)done=true;}
  // crossing probability on small grids, filled in a little per frame
  const GW=64,GH=40,TR=16,DS=[];for(let d=.30;d<=.801;d+=.02)DS.push(+d.toFixed(2));const PC={4:[],8:[]};let pi=0;
  const q=new Int32Array(GW*GH),vis=new Uint8Array(GW*GH);
  function trial(d,nb,s){vis.fill(0);let h=0,t=0;for(let y=0;y<GH;y++){if(f2H(s,0,y,3)<d){vis[y*GW]=1;q[t++]=y*GW;}}
    while(h<t){const k=q[h++],x=k%GW,y=(k/GW)|0;if(x===GW-1)return true;for(const [dx,dy] of nb){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=GW||yy>=GH)continue;const j=yy*GW+xx;if(!vis[j]&&f2H(s,xx,yy,3)<d){vis[j]=1;q[t++]=j;}}}return false;}
  const XC=d=>40+(d-.3)/.5*560,YC=p=>150-p*124;
  function chart(){f2clr(svg);for(const p of [0,.5,1]){svgEl('line',{x1:40,x2:600,y1:YC(p),y2:YC(p),class:'gl'},svg);svgText(svg,34,YC(p)+4,p===0?'0':p===1?'100%':'50%',{'text-anchor':'end','font-size':10.5});}
    for(const d of [.3,.4,.5,.6,.7,.8])svgText(svg,XC(d),168,d.toFixed(1),{'text-anchor':'middle','font-size':10.5});
    svgText(svg,320,184,'fuel density (share of tiles that can burn)',{'text-anchor':'middle','font-size':10.5});
    svgText(svg,44,16,'chance a fire lit on the left edge reaches the right edge (64x40 grids, 16 maps per point)',{'font-size':10.5});
    for(const [th,col,lab] of [[.592746,'#ffb44a','0.5927 (4 neighbours)'],[.407,'#9fc7d6','about 0.407 (8 neighbours)']]){svgEl('line',{x1:XC(th),x2:XC(th),y1:24,y2:150,stroke:col,'stroke-dasharray':'4 3'},svg);svgText(svg,XC(th)+4,th>.5?60:44,lab,{'font-size':10.5,fill:col});}
    for(const [k,col] of [[4,'#ffb44a'],[8,'#9fc7d6']]){const pts=PC[k].map((p,i)=>[XC(DS[i]),YC(p)]);if(pts.length>1)poly(svg,pts,{stroke:col,'stroke-width':2});}
    const d=c.v('d')/1000;svgEl('line',{x1:XC(d),x2:XC(d),y1:20,y2:150,stroke:'#f3e9df','stroke-width':1.2},svg);
    const hit=svgEl('rect',{x:40,y:0,width:560,height:190,fill:'transparent',style:'cursor:ew-resize'},svg);
    const set=e=>{const r=svg.getBoundingClientRect();const dd=clamp(((e.clientX-r.left)/r.width*640-40)/560*.5+.3,.3,.8);c.el('d').value=Math.round(dd*1000);build();chart();};
    hit.addEventListener('pointerdown',e=>{set(e);try{hit.setPointerCapture(e.pointerId);}catch(_){}});hit.addEventListener('pointermove',e=>{if(e.buttons)set(e);});}
  c.on('d',()=>{build();chart();});c.seg('nb',()=>{build();chart();});c.btn('new',()=>{seed++;build();});
  build();
  return {tick(dt){fr++;
    if(pi<DS.length){for(const k of [4,8]){let n=0;for(let s=0;s<TR;s++)if(trial(DS[pi],k===4?f2NB4:f2NB8,1000+s*31))n++;PC[k].push(n/TR);}pi++;chart();}
    if(!done){step();if(!done)step();}else{hold+=dt;if(hold>2.5&&motion){seed++;build();}}
    const u=F.u32;for(let i=0;i<N;i++){const x=i%W,y=(i/W)|0;
      u[i]=!fuel[i]?((x+y)&1?U('#2a211c'):U('#2f2620')):st[i]===0?f2grass(x,y,3):st[i]===1?f2FIRE[5+((f2H(i,fr>>1,0,0)*3)|0)]:f2ASH[(hash2(x,y)*2)|0];}
    F.put();
    c.out('d',(c.v('d')/1000).toFixed(3));
    if(fr%4===0){const k=c.segv('nb'),th=k==='4'?.5927:.407,d=c.v('d')/1000;
      setHud(root,crossed?'crossed the map':done?'stayed local':'spreading');
      ro.innerHTML=`density <b>${d.toFixed(3)}</b> vs threshold <b>${th}</b> for ${k} neighbours (${d>th?'above':'below'}) · fire reached column <b>${maxX}</b> of ${W-1} · burnt <b>${Math.round(burntN/Math.max(1,fuelN)*100)}%</b> of the fuel · spread is certain here (p = 1); only the fuel layout decides`;}}};});

// ======================================================================
// D7: Far Cry 2 spreading-points budget with wind dot-product damage
// ======================================================================
reg('fc2budget',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);
  const CS=6,GW=F.W/CS|0,GH=F.H/CS|0,N=GW*GH;let last=[6,10];
  const S=new Uint8Array(N),T=new Uint8Array(N),SRC=new Int8Array(N),HEAT=new Float32Array(N);let pools=[],acc=0,idle=0,fr=0,quiet=0;
  function reset(){S.fill(0);T.fill(0);SRC.fill(-1);HEAT.fill(0);pools=[];for(let i=0;i<N;i++){const x=i%GW,y=(i/GW)|0;if(hash2(x*3+1,y*5+2)<.035)S[i]=4;}}
  function ignite(i,s){S[i]=5;T[i]=9;SRC[i]=s;HEAT[i]=0;pools[s].cells++;}
  function throwAt(x,y){x=clamp(x|0,0,GW-1);y=clamp(y|0,0,GH-1);const i=y*GW+x;let s=-1;
    for(let j=-3;j<=3&&s<0;j++)for(let k=-3;k<=3;k++){const xx=x+k,yy=y+j;if(xx<0||yy<0||xx>=GW||yy>=GH)continue;const q=yy*GW+xx;if(S[q]>=1&&S[q]<=5&&S[q]!==4&&SRC[q]>=0){s=SRC[q];break;}}
    if(s>=0){pools[s].pts+=60;pools[s].throws++;}else{if(pools.length>=100)reset();pools.push({pts:60,cells:0,throws:1});s=pools.length-1;}
    if(S[i]===0||S[i]===3&&false){if(c.v('nob')||pools[s].pts>=8){if(!c.v('nob'))pools[s].pts-=8;ignite(i,s);}}
    pools.cur=s;idle=0;quiet=4;last=[x,y];}
  pointer(cv,([x,y],k)=>{if(k==='down')throwAt(x/CS,y/CS);});
  c.btn('reset',()=>{reset();throwAt(6,GH>>1);});
  function step(){const wd=c.v('wd')*Math.PI/180,wx=Math.cos(wd),wy=Math.sin(wd),ws=c.v('ws')/100,nob=c.v('nob');let any=0;
    for(let i=0;i<N;i++){if(S[i]!==1)continue;any++;const x=i%GW,y=(i/GW)|0,s=SRC[i];
      for(const [dx,dy] of f2NB8){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=GW||yy>=GH)continue;const q=yy*GW+xx;if(S[q]!==0)continue;const l=Math.hypot(dx,dy);
        HEAT[q]+=.2*Math.max(0,1+ws*(dx*wx+dy*wy)/l)/l;
        if(HEAT[q]>=1){if(nob||pools[s].pts>=8){if(!nob)pools[s].pts-=8;ignite(q,s);}else HEAT[q]=1;}}}
    for(let i=0;i<N;i++){if(S[i]===5)S[i]=1;else if(S[i]===1){if(--T[i]===0){S[i]=2;T[i]=7;}}else if(S[i]===2){if(--T[i]===0)S[i]=3;}}
    return any;}
  function meter(){f2clr(svg);const p=pools[pools.cur];if(!p){svgText(svg,4,20,'Click the grass to throw a Molotov',{'font-size':12});return;}
    const nob=c.v('nob'),cap=p.throws*60,cells=Math.floor(cap/8);
    svgText(svg,4,14,nob?'No budget: spread stops only at fuel':`${p.pts} of ${cap} points left · ${p.throws} Molotov${p.throws>1?'s':''}`,{'font-size':12,fill:'#f3e9df'});
    if(nob)return;const w=322/15;for(let k=0;k<Math.ceil(cap/8);k++){const left=p.pts-k*8,full=left>=8,part=left>0&&!full;
      svgEl('rect',{x:4+k*w,y:22,width:w-2,height:16,fill:full?'#ffb44a':part?'#7a4a20':'#2a1c15',stroke:'#5c4334'},svg);}
    svgText(svg,4,56,`${p.cells} cells burnt · cap ${cells} cells at 8 points each`,{'font-size':11.5});}
  reset();throwAt(6,GH>>1);
  return {tick(dt){fr++;acc+=dt;let any=1;if(acc>=1/6){acc=0;any=step();if(quiet>0)quiet--;}
    if(!any&&quiet===0){idle+=dt;if(idle>2.5&&motion){const p=pools[pools.cur];if(p&&p.throws<2)throwAt(last[0],last[1]);else{reset();throwAt(4+((fr>>4)%3)*3,5+((fr>>3)%3)*5);}}}else idle=0;
    const u=F.u32,W=F.W;for(let y=0;y<F.H;y++)for(let x=0;x<W;x++){const i=((y/CS)|0)*GW+((x/CS)|0),s=S[i];let col;
      if(s===0){col=f2grass(x,y,5);if(HEAT[i]>0)col=mix32(col,U('#7a5a2a'),Math.min(.75,HEAT[i]*.75));}
      else if(s===1||s===5)col=f2FIRE[3+((f2H(x,y,fr>>2,9)*5)|0)];
      else if(s===2)col=f2EMB[(f2H(x,y,fr>>3,4)*3)|0];
      else if(s===3)col=f2ASH[(hash2(x,y)*3)|0];
      else col=(hash2(x,y)<.5?U('#6a6460'):U('#7a7470'));u[y*W+x]=col;}
    F.put();c.out('wd',f2arrow(c.v('wd'))+' '+c.v('wd')+'°');c.out('ws',(c.v('ws')/100).toFixed(2));
    if(fr%5===0){meter();const p=pools[pools.cur];setHud(root,`wind ${f2arrow(c.v('wd'))}`);
      ro.innerHTML=p?`damage to a neighbour = base × max(0, 1 + strength × dot(wind, direction)) · strength ${(c.v('ws')/100).toFixed(2)} gives ×${(1+c.v('ws')/100).toFixed(2)} downwind, ×${Math.max(0,1-c.v('ws')/100).toFixed(2)} upwind · this fire: <b>${p.cells}</b> cells, <b>${c.v('nob')?'no cap':p.pts+' points left'}</b> · one Molotov is 60 points, about 7 cells; two are about 15`:'';}}};});

// ======================================================================
// D1/D6/E1: rain, water and moisture on a burning patch, with steam
// ======================================================================
reg('extinguish',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root);
  const CS=2,GW=F.W/CS,GH=F.H/CS,N=GW*GH;
  const S=new Uint8Array(N),FU=new Uint8Array(N),AG=new Uint8Array(N),MO=new Uint8Array(N);const steam=f2Puffs(160);
  const DR=90,dx=new Float32Array(DR),dy=new Float32Array(DR);let rx=-20,acc=0,fr=0,doused=0,idle=0,tk=0;
  const rainMode=()=>c.segv('rain');
  const rained=x=>{const m=rainMode();return m==='steady'||(m==='shower'&&Math.abs(x-rx)<13);};
  function fresh(){for(let i=0;i<N;i++){S[i]=0;FU[i]=5+((hash2(i,3)*6)|0);AG[i]=0;}}
  function light(x0,y0,w,h){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){if(x<0||y<0||x>=GW||y>=GH)continue;const i=y*GW+x;if(S[i]===0){S[i]=2;AG[i]=0;}}idle=0;}
  function douse(i,x,y){S[i]=0;MO[i]=255;AG[i]=0;doused++;steam.add(x*CS+1,y*CS,1.2+hash2(x,y+tk)*.6,(hash2(y,x)-.5)*6);}
  function bucket(cx,cy){for(let y=cy-3;y<=cy+3;y++)for(let x=cx-3;x<=cx+3;x++){if(x<0||y<0||x>=GW||y>=GH||(x-cx)**2+(y-cy)**2>10)continue;const i=y*GW+x;
      if(S[i]===2||S[i]===1)douse(i,x,y);else if(S[i]===3){S[i]=4;steam.add(x*CS+1,y*CS,.8,0);}else MO[i]=255;}}
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag')bucket((x/CS)|0,(y/CS)|0);});
  c.btn('light',()=>{fresh();light(GW/2-2,GH/2-2,4,4);});c.btn('dry',()=>MO.fill(0));c.seg('rain',()=>{});
  function step(){tk++;const m=rainMode();if(m==='shower'){rx+=1.3;if(rx>GW+50)rx=-70;}
    for(let x=0;x<GW;x++){const r=rained(x);for(let y=0;y<GH;y++){const i=y*GW+x;if(r)MO[i]=Math.min(255,MO[i]+8);else if(MO[i]>0)MO[i]--;}}
    let live=0;
    for(let i=0;i<N;i++){const s=S[i];if(s!==2&&s!==3)continue;live++;const x=i%GW,y=(i/GW)|0;
      if(s===2&&rained(x)&&rnd()<.2+.03*Math.min(15,AG[i])){douse(i,x,y);continue;}
      const pb=s===2?.36:.03;
      for(const [ddx,ddy] of f2NB8){const xx=x+ddx,yy=y+ddy;if(xx<0||yy<0||xx>=GW||yy>=GH)continue;const q=yy*GW+xx;if(S[q]!==0)continue;
        if(rained(xx)||rained(xx-1)||rained(xx+1))continue;
        if(rnd()<pb*(ddx&&ddy?.7:1)*(1-MO[q]/255))S[q]=6;}
      if(s===2){AG[i]++;if(--FU[i]===0){S[i]=3;FU[i]=2+((hash2(x,y)*7)|0);}}else if(--FU[i]===0)S[i]=4;}
    for(let i=0;i<N;i++){if(S[i]===1){S[i]=2;AG[i]=0;}else if(S[i]===6)S[i]=1;}
    return live;}
  for(let i=0;i<DR;i++){dx[i]=rnd();dy[i]=rnd()*F.H;}
  fresh();light(GW/2-6,GH/2-2,4,4);let live=1,cnt=[0,0,0,0,0];
  return {tick(dt){fr++;acc+=dt;if(acc>=1/6){acc=0;live=step();}
    if(!live){idle+=dt;if(idle>3&&motion){fresh();light(12+((fr>>5)%4)*16,10+((fr>>4)%3)*12,4,4);rx=-20;}}
    steam.step(dt,9);const u=F.u32,W=F.W;cnt=[0,0,0,0,0];
    for(let y=0;y<F.H;y++)for(let x=0;x<W;x++){const tx=(x/CS)|0,ty=(y/CS)|0,i=ty*GW+tx,s=S[i];let col;
      if(s===0||s===6){col=f2grass(x,y,2);if(MO[i])col=mix32(col,U('#264656'),MO[i]/255*.6);}
      else if(s===1)col=(fr>>3)&1?U('#c4501a'):U('#a8401a');
      else if(s===2)col=f2FIRE[3+((f2H(x,y,fr>>2,5)*5)|0)];
      else if(s===3)col=f2EMB[(f2H(x,y,fr>>3,1)*3)|0];
      else col=f2ASH[(hash2(x,y)*3)|0];u[y*W+x]=col;}
    for(let i=0;i<N;i++){const s=S[i];cnt[s===6?0:s]++;}
    const m=rainMode();if(m!=='off'){for(let i=0;i<DR;i++){dy[i]+=dt*170;if(dy[i]>F.H){dy[i]=-4;dx[i]=rnd();}
        const x=m==='steady'?(dx[i]*W)|0:((rx-13+dx[i]*26)*CS)|0;if(x<0||x>=W)continue;for(let k=0;k<3;k++){const y=(dy[i]|0)+k;if(y>=0&&y<F.H)u[y*W+x]=U('#9cc4e8');}}}
    steam.draw(u,W,F.H,U('#d8dee6'),U('#f4f6fa'));F.put();
    if(fr%5===0){setHud(root,m==='off'?'no rain · click to throw water':'rain kills 20% + 3% × age per tick');
      const chip=(col,t)=>`<span style="display:inline-block;width:9px;height:9px;background:${col};margin:0 4px 0 2px;vertical-align:0"></span>${t}`;
      ro.innerHTML=`${chip('#528443','fresh')} <b>${cnt[0]}</b> · ${chip('#c4501a','igniting')} <b>${cnt[1]}</b> · ${chip('#ec6a1a','burning')} <b>${cnt[2]}</b> · ${chip('#6a1e10','embers')} <b>${cnt[3]}</b> · ${chip('#4c4547','ash')} <b>${cnt[4]}</b> · put out by water or rain <b>${doused}</b> · steam puffs live <b>${steam.count()}</b>`;}}};});

// ======================================================================
// D8/6e: bytes per tick, and why the RNG must be hashed per tile
// ======================================================================
reg('netbytes',root=>{const cv=$('canvas',root),F=PX(cv),G=F.W,N=G*G,c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);
  const mk=()=>({S:new Uint8Array(N),L:new Uint8Array(N),act:new Int32Array(N),na:0,nxt:new Int32Array(N)});const A=mk(),B=mk();
  let seed=11,tick=0,acc=0,hold=0,fr=0,rA,rB,hist=[],mis=0;
  const fuelOK=i=>f2H(seed,i,5,5)>.04;
  function start(){for(const s of [A,B]){s.S.fill(0);s.L.fill(0);s.na=0;const c0=(G>>1)*G+(G>>1);for(const d of [0,1,-1,G,-G]){const k=c0+d;s.S[k]=1;s.L[k]=4;s.act[s.na++]=k;}}
    rA=mkRng(seed);rB=mkRng(seed);tick=0;hist=[];hold=0;}
  function step(s,rev,rng,hashMode){let nn=0,ign=0,chg=0;const P=.5;
    for(let a=0;a<s.na;a++){const k=s.act[rev?s.na-1-a:a];
      if(s.S[k]===1){const x=k%G,y=(k/G)|0;
        for(let j=0;j<8;j++){const xx=x+f2NB8[j][0],yy=y+f2NB8[j][1];if(xx<0||yy<0||xx>=G||yy>=G)continue;const q=yy*G+xx;if(s.S[q]!==0||!fuelOK(q))continue;
          const roll=hashMode?f2H(seed,k,tick,j):rng();if(roll<P*(j>3?.7:1)){s.S[q]=1;s.L[q]=3+(((hashMode?f2H(seed,q,0,99):rng())*4)|0);s.nxt[nn++]=q;ign++;}}
        if(--s.L[k]===0){s.S[k]=2;s.L[k]=3;chg++;}s.nxt[nn++]=k;}
      else if(s.S[k]===2){if(--s.L[k]===0){s.S[k]=3;chg++;}else s.nxt[nn++]=k;}}
    // keep list order canonical (by insertion) so only the RNG differs between clients
    const t=s.act;s.act=s.nxt;s.nxt=t;s.na=nn;return {ign,chg:chg+ign};}
  c.seg('rng',()=>start());c.btn('again',()=>{seed++;start();});
  const X=t=>44+t/150*300,LO=1,HI=30000,Y=v=>f2log(clamp(v,LO,HI),LO,HI,262,24);
  function chart(){f2clr(svg);for(const v of [1,10,100,1000,10000]){svgEl('line',{x1:44,x2:344,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,38,Y(v)+4,v>=1000?(v/1000)+' KB':v+' B',{'text-anchor':'end','font-size':10.5});}
    for(const t of [0,50,100,150])svgText(svg,X(t),280,'tick '+t,{'text-anchor':t===150?'end':t===0?'start':'middle','font-size':10.5});
    svgEl('rect',{x:44,y:Y(9500),width:300,height:Y(4000)-Y(9500),fill:'#e8622c','fill-opacity':.12},svg);
    svgText(svg,344,14,'shaded: study\'s radius-100 front, 4 to 9.5 KB',{'text-anchor':'end','font-size':10.5,fill:'#e8622c'});
    const d=hist.map((h,i)=>[X(i),Y(Math.max(1,h.chg*5))]),e=hist.map((h,i)=>[X(i),Y(Math.max(1,h.ign*4))]);
    if(d.length>1){poly(svg,d,{stroke:'#ffb44a','stroke-width':2});poly(svg,e,{stroke:'#9fc7d6','stroke-width':2});}
    svgEl('circle',{cx:X(0),cy:Y(8),r:3.5,fill:'#6dd4c3'},svg);svgEl('line',{x1:X(0),x2:344,y1:Y(1),y2:Y(1),stroke:'#6dd4c3','stroke-dasharray':'2 3'},svg);
    svgText(svg,X(2)+4,Y(8)+4,'seed + lockstep: 8 bytes once, then nothing',{'font-size':10.5,fill:'#6dd4c3'});
    const last=hist[hist.length-1];if(last){svgText(svg,Math.min(300,X(hist.length-1)+4),Y(Math.max(1,last.chg*5))-6,'full diff',{'font-size':10.5,fill:'#ffb44a'});svgText(svg,Math.min(270,X(hist.length-1)+4),Y(Math.max(1,last.ign*4))+14,'ignition events',{'font-size':10.5,fill:'#9fc7d6'});}}
  start();
  return {tick(dt){fr++;acc+=dt;const hm=c.segv('rng')==='hash';
    if(acc>=1/12){acc=0;if(A.na||B.na){if(tick<150){const sa=step(A,false,rA,hm);step(B,true,rB,hm);hist.push(sa);tick++;}else{A.na=0;B.na=0;}}else{hold+=1/12;if(hold>2.5&&motion){seed++;start();}}
      mis=0;for(let i=0;i<N;i++)if(A.S[i]!==B.S[i])mis++;if(fr%2===0||!A.na)chart();}
    const u=F.u32;for(let i=0;i<N;i++){const s=A.S[i],x=i%G,y=(i/G)|0;let col=s===0?(fuelOK(i)?f2grass(x,y,1):U('#6a6460')):s===1?f2FIRE[4+((f2H(i,fr>>2,0,1)*4)|0)]:s===2?f2EMB[1]:f2ASH[(hash2(x,y)*3)|0];
      if(s!==B.S[i])col=U('#ff3cc8');u[i]=col;}F.put();
    const pl=c.v('pl');c.out('pl',pl);
    if(fr%5===0){const h=hist[hist.length-1]||{ign:0,chg:0};const kb=b=>(b*5*pl/1024).toFixed(b*5*pl<10240?1:0);
      setHud(root,mis?`client A vs B: ${mis} tiles differ`:'client A = client B');
      ro.innerHTML=`tick ${tick} · ${h.chg} tiles changed, ${h.ign} new ignitions · full diff <b>${h.chg*5} B</b>, events <b>${h.ign*4} B</b> per tick · at 5 Hz to ${pl} player${pl>1?'s':''}: <b>${kb(h.chg*5)} KB/s</b> vs <b>${kb(h.ign*4)} KB/s</b> · lockstep sends inputs only, but ${hm?'hashed rolls keep both clients identical':'<b>a shared RNG stream drifts as soon as two clients visit tiles in a different order</b>'}`;}}};});

// ======================================================================
// E1/E5/C3: low-res advected smoke field, Bayer dithered, smoke/steam/oil
// ======================================================================
reg('smokefield',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root);
  const GW=80,GH=45,CN=GW*GH,CS=W/GW;let D=new Float32Array(CN),D2=new Float32Array(CN),t=0,acc=0,fr=0,sh=0;
  const BG=new Uint32Array(W*H);
  (function scene(){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/14,y/14);BG[y*W+x]=n<.45?f2GR[(hash2(x,y)*2)|0]:f2GR[2+((hash2(x,y)*2)|0)];}
    for(let x=0;x<W;x++){const yc=120+Math.sin(x/30)*8;for(let y=(yc-5)|0;y<yc+5;y++)if(y>=0&&y<H)BG[y*W+x]=hash2(x,y)<.5?U('#8a7458'):U('#7a664c');}
    const house=(x0,y0,w,h)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const roof=y<y0+h*.6;BG[y*W+x]=roof?(((y-y0)%4===0)?U('#6a2a20'):U('#8a3a2a')):(((x-x0)%5===0)?U('#6a5038'):U('#8a6a4a'));}
      for(let y=y0+h*.6+4|0;y<y0+h*.6+9;y++)for(let x=x0+6;x<x0+11;x++)BG[y*W+x]=U('#ffd468');};
    house(196,58,56,48);house(40,30,44,40);
    for(const [tx,ty] of [[130,40],[150,70],[280,30],[290,140],[110,150],[20,120]])for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){if(x*x+y*y>49)continue;const xx=tx+x,yy=ty+y;if(xx>=0&&yy>=0&&xx<W&&yy<H)BG[yy*W+xx]=(x+y<-3)?U('#3e7a3a'):U('#2a5a2c');}
    for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(x*x+y*y<=10&&x*x+y*y>=5)BG[(150+y)*W+88+x]=U('#6a6460');
    f2rect(BG,W,H,232,52,6,8,U('#5a5250'));})();
  const SRC=[{x:22,y:37,k:'camp',r:1},{x:58,y:12,k:'chim',r:.6}];
  pointer(cv,([x,y],k)=>{if(k!=='down')return;const gx=(x/CS)|0,gy=(y/CS)|0;const j=SRC.findIndex(s=>s.k==='tile'&&Math.abs(s.x-gx)<2&&Math.abs(s.y-gy)<2);if(j>=0)SRC.splice(j,1);else{if(SRC.filter(s=>s.k==='tile').length>=6)SRC.splice(SRC.findIndex(s=>s.k==='tile'),1);SRC.push({x:gx,y:gy,k:'tile',r:1});}});
  ['m','r','col'].forEach(k=>c.seg(k,()=>{}));
  const COL={smoke:['#a8a09c','#d4ccc4'],steam:['#d6dce6','#ffffff'],oil:['#4a4246','#141016']};
  const samp=(A,x,y)=>{if(x<0||y<0||x>GW-1||y>GH-1)return 0;const xi=x|0,yi=y|0,fx=x-xi,fy=y-yi,x1=Math.min(GW-1,xi+1),y1=Math.min(GH-1,yi+1);
    const a=A[yi*GW+xi],b=A[yi*GW+x1],cc=A[y1*GW+xi],d=A[y1*GW+x1];return a+(b-a)*fx+(cc-a)*fy+(a-b-cc+d)*fx*fy;};
  function step(){const ca=c.segv('m')==='ca',wind=c.v('w')/10,dec=c.v('dec')/1000;t+=.05;
    for(const s of SRC)for(const o of [-1,0,1]){const i=s.y*GW+s.x+o;if(i>=0&&i<CN)D[i]=Math.min(255,D[i]+40*s.r*(s.k==='chim'?(.6+.4*Math.sin(t*3)):1));}
    if(ca){for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x,cc=D[i],l=x>0?D[i-1]:0,r=x<GW-1?D[i+1]:0,b=y<GH-1?D[i+GW]:0,a=y>0?D[i-GW]:0;
        let d=(2*cc+l+r+3*b+a)>>3;D2[i]=d>0?d-1:0;}
      sh+=wind*.35;while(sh>=1){sh-=1;for(let y=0;y<GH;y++){for(let x=GW-1;x>0;x--)D2[y*GW+x]=D2[y*GW+x-1];D2[y*GW]=0;}}
      while(sh<=-1){sh+=1;for(let y=0;y<GH;y++){for(let x=0;x<GW-1;x++)D2[y*GW+x]=D2[y*GW+x+1];D2[y*GW+GW-1]=0;}}}
    else{for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const uu=wind*.35+(vnoise(x*.18,y*.18-t*1.6)-.5)*.8,vv=-.55;D2[y*GW+x]=samp(D,x-uu,y-vv)*dec;}}
    const tt=D;D=D2;D2=tt;}
  return {tick(dt){fr++;acc+=dt;let n=0;while(acc>=.05&&n<3){acc-=.05;step();n++;}if(acc>.2)acc=0;
    const u=F.u32,dith=c.segv('r')==='dith',cp=COL[c.segv('col')].map(U),C0=un32(cp[0]),C1=un32(cp[1]);u.set(BG);
    for(const s of SRC){const px=s.x*CS+2,py=s.y*CS+2;if(s.k==='chim')continue;for(let k=0;k<10;k++){const xx=px+((f2H(k,fr>>2,s.x,1)*6)|0)-3,yy=py+((f2H(k,fr>>2,s.y,2)*5)|0)-3;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=f2FIRE[4+((f2H(k,fr,3,3)*4)|0)];}}
    let tot=0;for(let i=0;i<CN;i++)tot+=D[i];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=samp(D,(x+.5)/CS-.5,(y+.5)/CS-.5);if(d<2)continue;const a=Math.min(.94,d/45),i=y*W+x;
      if(dith){const lv=a*16;if(lv>bay(x,y))u[i]=a>.55?cp[1]:cp[0];}
      else{const B=un32(u[i]),k=a>.55?(a-.55)/.45:0,cr=C0[0]+(C1[0]-C0[0])*k,cg=C0[1]+(C1[1]-C0[1])*k,cb=C0[2]+(C1[2]-C0[2])*k;u[i]=pack(B[0]+(cr-B[0])*a,B[1]+(cg-B[1])*a,B[2]+(cb-B[2])*a);}}
    F.put();c.out('w',(c.v('w')/10).toFixed(1));c.out('dec',(c.v('dec')/1000).toFixed(3));
    if(fr%6===0){const ca=c.segv('m')==='ca';setHud(root,`80 x 45 cells · wind ${c.v('w')>0?'→':c.v('w')<0?'←':'calm'}`);
      ro.innerHTML=`${ca?'integer CA: d = (2c + left + right + 3·below + above) >> 3, then −1':'semi-Lagrangian back-trace through wind + upward drift, then × '+(c.v('dec')/1000).toFixed(3)} · ${SRC.length} sources at +40 per tick · total smoke <b>${Math.round(tot)}</b> · measured on M4 Pro: smoke CA <b>0.077 ms</b> and advect + decay <b>0.31 ms</b> at 320x180 in JS; the CA at 64x64 in GDScript <b>0.28 ms</b>`;}}};});

// ======================================================================
// E5: smoke blocks line of sight (opaque cloud count along Bresenham)
// ======================================================================
reg('smokesight',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root);
  const CS=6,TW=W/CS,TH=H/CS,TN=TW*TH,SM=new Float32Array(TN),VIS=new Uint8Array(TN);let t=0,fr=0;const V={x:3,y:8};
  const TG=[[20,3],[21,12],[13,8],[5,14],[17,7],[9,2]];
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag'){V.x=clamp((x/CS)|0,0,TW-1);V.y=clamp((y/CS)|0,0,TH-1);}});
  c.seg('lim',()=>{});
  const BL=[{x:9,y:8,r:3.2,ax:2.5,ay:3,s:.31,p:0},{x:15,y:6,r:2.6,ax:2,ay:3.5,s:.23,p:2},{x:16,y:12,r:2.8,ax:3,ay:1.5,s:.19,p:4},{x:7,y:3,r:2.2,ax:2,ay:1,s:.27,p:1}];
  function los(x0,y0,x1,y1,thr,lim){let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy,x=x0,y=y0,n=0,steps=0;
    while(!(x===x1&&y===y1)){const e2=2*e;if(e2>=dy){e+=dy;x+=sx;}if(e2<=dx){e+=dx;y+=sy;}steps++;if(x===x1&&y===y1)break;if(SM[y*TW+x]>thr){n++;if(n>=lim)return [false,steps];}}return [true,steps];}
  return {tick(dt){fr++;if(motion)t+=dt;const thr=c.v('thr'),mode=c.segv('lim'),lim=mode==='inf'?1e9:+mode;
    for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){let s=0;for(const b of BL){const bx=b.x+Math.sin(t*b.s+b.p)*b.ax,by=b.y+Math.cos(t*b.s*1.3+b.p)*b.ay,d2=(x-bx)**2+(y-by)**2;s+=255*Math.exp(-d2/(b.r*b.r));}
      SM[y*TW+x]=clamp(s+(vnoise(x*.7+t*.5,y*.7)-.5)*50,0,255);}
    let reads=0,opq=0;for(let i=0;i<TN;i++){const x=i%TW,y=(i/TW)|0;if(SM[i]>thr)opq++;if(x===V.x&&y===V.y){VIS[i]=1;continue;}const [v,s]=los(V.x,V.y,x,y,thr,lim);VIS[i]=v?1:0;reads+=s;}
    const u=F.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const tx=(x/CS)|0,ty=(y/CS)|0,i=ty*TW+tx,sm=SM[i];
      let col=((tx+ty)&1)?U('#4a423c'):U('#544a42');if(hash2(x,y)<.12)col=U('#3e3632');if(x%CS===0||y%CS===0)col=U('#2e2824');
      if(sm>thr)col=bay(x,y)<11?U('#a49ca2'):U('#7e767c');else{const lv=sm/thr*9;if(lv>bay(x,y))col=U('#8e868c');}
      if(!VIS[i])col=mulc(col,.28,.3,.42);u[y*W+x]=col;}
    let vc=0;const cx=V.x*CS+3,cy=V.y*CS+3;
    for(const [tx,ty] of TG){const v=VIS[ty*TW+tx];if(v)vc++;const ex=tx*CS+3,ey=ty*CS+3;
      // pixel line from viewer to target: green while visible, red past the blocking tile
      let x=cx,y=cy,dx=Math.abs(ex-cx),dy=-Math.abs(ey-cy),sx=cx<ex?1:-1,sy=cy<ey?1:-1,e=dx+dy,k=0;
      while(!(x===ex&&y===ey)){const e2=2*e;if(e2>=dy){e+=dy;x+=sx;}if(e2<=dx){e+=dx;y+=sy;}k++;const tv=VIS[((y/CS)|0)*TW+((x/CS)|0)];if(k%2===0)u[y*W+x]=v?U('#7fd38a'):tv?U('#e8c070'):U('#ff5a4a');}
      f2rect(u,W,H,ex-1,ey-2,3,4,v?U('#ff5a4a'):U('#5a2a2a'));u[(ey-2)*W+ex]=v?U('#ffd0c0'):U('#7a3a3a');}
    f2rect(u,W,H,cx-1,cy-2,3,5,U('#5aa0ff'));u[(cy-2)*W+cx]=U('#f0e0c8');u[(cy-1)*W+cx]=U('#f0e0c8');
    F.put();c.out('thr',thr);
    if(fr%5===0){setHud(root,`${vc} of ${TG.length} targets in sight`);
      ro.innerHTML=`${mode==='inf'?'smoke is cosmetic: everyone sees everything':'sight stops after '+lim+' opaque tile'+(lim>1?'s':'')+(lim===2?' (DCSS)':'')} · opaque = smoke byte above <b>${thr}</b>, now <b>${opq}</b> of ${TN} tiles · full view costs <b>${reads}</b> tile reads, done on the server so every player sees the same thing`;}}};});

// ======================================================================
// F1: Tibia fire field stages over time with damage ticks, two readings
// ======================================================================
reg('tibiafield',root=>{const svg=$('svg',root),cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),ro=$('[data-ro]',root);
  const RD={wiki:{n:'TibiaWiki',st:[200,148,98],tk:9},tfs:{n:'TFS 1.4 code',st:[120,120,120],tk:10}};
  const SN=['1487, big flames','1488, medium','1489, small, harmless'];
  const stageAt=(r,t)=>{let a=0;for(let i=0;i<3;i++){if(t<a+r.st[i])return i;a+=r.st[i];}return -1;};
  const evs=(r,ts)=>{const s=stageAt(r,ts),E=[];if(s===0)E.push([ts,20]);if(s===0||s===1)for(let k=1;k<=7;k++)E.push([ts+k*r.tk,10]);return E;};
  let t=0,fr=0,pt=0,flash=0,pops=[];const TM=480,X=s=>44+s/TM*580;
  function chart(){f2clr(svg);const ts=c.v('ts'),sel=c.segv('rd');
    for(let s=0;s<=TM;s+=60){svgEl('line',{x1:X(s),x2:X(s),y1:20,y2:186,class:'gl'},svg);svgText(svg,X(s),202,f2fmt(s),{'text-anchor':'middle','font-size':10.5});}
    const SC=['#ff7a2a','#d2602a','#7a5040'];
    [['wiki',26],['tfs',58]].forEach(([k,y])=>{const r=RD[k],on=k===sel;let a=0;svgText(svg,40,y+12,r.n,{'text-anchor':'end','font-size':10.5,fill:on?'#f3e9df':'#8f7a69'});
      r.st.forEach((d,i)=>{svgEl('rect',{x:X(a),y,width:X(a+d)-X(a)-1,height:16,fill:SC[i],'fill-opacity':on?1:.45,rx:2},svg);svgText(svg,X(a)+4,y+12,`stage ${i+1} · ${f2fmt(d)}`,{'font-size':10,fill:'#120b08'});a+=d;});
      for(const [et,dm] of evs(r,ts)){if(et>TM)continue;svgEl('line',{x1:X(et),x2:X(et),y1:y+17,y2:y+(dm>10?28:24),stroke:on?'#ffd468':'#8f7a69','stroke-width':dm>10?2:1.2},svg);}});
    const Yd=v=>180-v/90*80;svgText(svg,44,96,'damage taken after stepping on (cumulative)',{'font-size':10.5});
    for(const v of [0,90])svgText(svg,40,Yd(v)+4,v,{'text-anchor':'end','font-size':10});
    for(const [k,col] of [['wiki','#ffb44a'],['tfs','#9fc7d6']]){const E=evs(RD[k],ts);let s=0;const p=[[X(0),Yd(0)],[X(ts),Yd(0)]];for(const [et,dm] of E){p.push([X(Math.min(et,TM)),Yd(s)]);s+=dm;p.push([X(Math.min(et,TM)),Yd(s)]);}p.push([X(TM),Yd(s)]);poly(svg,p,{stroke:col,'stroke-width':k===sel?2.2:1.2});}
    svgEl('line',{x1:X(ts),x2:X(ts),y1:20,y2:186,stroke:'#6dd4c3','stroke-dasharray':'3 2'},svg);svgText(svg,X(ts)+3,100+12,'step on',{'font-size':10,fill:'#6dd4c3'});
    svgEl('line',{x1:X(t),x2:X(t),y1:16,y2:186,stroke:'#fff','stroke-width':1.1},svg);}
  c.on('ts',()=>{t=Math.max(0,c.v('ts')-8);pops=[];chart();});c.seg('rd',chart);
  const BGc=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)BGc[y*W+x]=((x>>4)+(y>>4))&1?U('#5a7a3a'):U('#4f6e34');for(let i=0;i<W*H;i++)if(hash2(i,1)<.08)BGc[i]=U('#6a8a48');
  function flames(u,cx,by,n,h,ph,seed){for(let k=0;k<n;k++){const fx=cx+(n===1?0:(k/(n-1)-.5)*10),hh=h*(.75+.25*f2H(k,ph,seed,1));
      for(let y=0;y<hh;y++){const w=Math.max(0,(1-y/hh)*3.2+(f2H(k,ph,y,2)-.5)*1.2);for(let x=-w;x<=w;x++){const xx=Math.round(fx+x+(f2H(k,ph,y,3)-.5)*1.2*y/hh),yy=by-y;if(xx<0||yy<0||xx>=W||yy>=H)continue;
          const q=1-y/hh-Math.abs(x)/(w+1)*.5;u[yy*W+xx]=f2FIRE[clamp(3+(q*5)|0,3,7)];}}}}
  return {tick(dt){fr++;const r=RD[c.segv('rd')],ts=c.v('ts'),sp=c.v('sp');pt=t;if(motion||fr<3)t+=dt*sp;if(t>TM){t=0;pt=0;pops=[];}
    for(const [et,dm] of evs(r,ts))if(et>pt&&et<=t){flash=.14;pops.push({v:dm,a:.8});}
    const u=F.u32;u.set(BGc);const s=stageAt(r,t),ph=fr>>3;
    if(s>=0){const n=[3,2,1][s],h=[12,9,6][s];for(let y=20;y<36;y++)for(let x=24;x<40;x++)if((x===24||x===39||y===20||y===35)&&hash2(x,y)<.6)u[y*W+x]=U('#3a2a1a');flames(u,32,33,n,h,ph,s);}
    // walker steps onto the field at ts, stays 3 s, then steps off
    const on=t>=ts&&t<ts+3,after=t>=ts+3,cx=on?32:after?50:14,cy=31;const burning=evs(r,ts).length&&t>=ts&&t<ts+7*r.tk;
    const body=flash>0?U('#ff6a5a'):U('#3c6fb4'),skin=flash>0?U('#ffb0a0'):U('#f0c09a');
    f2rect(u,W,H,cx-2,cy-9,5,3,U('#5a3a28'));f2rect(u,W,H,cx-2,cy-6,5,2,skin);f2rect(u,W,H,cx-3,cy-4,7,4,body);f2rect(u,W,H,cx-2,cy,2,2,U('#2a2c3a'));f2rect(u,W,H,cx+1,cy,2,2,U('#2a2c3a'));
    if(burning)for(let k=0;k<3;k++){const fx=cx-3+((f2H(k,ph,7,1)*7)|0),fy=cy-3-((f2H(k,ph,7,2)*5)|0);u[fy*W+fx]=f2FIRE[6];if(fy+1<H)u[(fy+1)*W+fx]=f2FIRE[4];}
    flash=Math.max(0,flash-dt);pops=pops.filter(p=>(p.a-=dt)>0);pops.forEach(p=>digits(u,W,H,cx+5,Math.round(cy-16+p.a*8),p.v,p.v>10?U('#ffffff'):U('#ff8a5a')));
    F.put();c.out('ts',f2fmt(ts));c.out('sp','×'+sp);
    if(fr%3===0)chart();
    if(fr%5===0){const st=stageAt(r,t);let a=0;for(let i=0;i<=st;i++)a+=r.st[i];
      setHud(root,st<0?`${f2fmt(t)} field gone`:`${f2fmt(t)} stage ${st+1}`);
      const tot=k=>evs(RD[k],ts).reduce((s,e)=>s+e[1],0),lastT=k=>{const E=evs(RD[k],ts);return E.length?E[E.length-1][0]-ts:0;};
      ro.innerHTML=`${r.n}: ${st<0?'field has decayed':`stage ${st+1} (${SN[st]}), ${Math.round(a-t)} s left`} · stepping on at ${f2fmt(ts)} costs <b>${tot('wiki')}</b> damage over ${lastT('wiki')} s by the wiki, <b>${tot('tfs')}</b> over ${lastT('tfs')} s by the server code · stage 2 has no 20-point entry hit, stage 3 does nothing`;}}};});

// ======================================================================
// F2: burn status models side by side, HP over time
// ======================================================================
reg('burnstatus',root=>{const svg=$('svg',root),cvs=$$('canvas[data-c]',root),FS=cvs.map(PX),c=ctl(root),ro=$('[data-ro]',root);
  const TM=12,HP0=100;
  const M=[{n:'Terraria',col:'#ffb44a',ev:()=>{const E=[];for(let k=1;k<=28;k++)E.push([k*.25,1]);return E;},on:t=>t<7},
    {n:'Gungeon',col:'#ff6b5e',cont:[4,4],on:t=>t<4,tint:true},
    {n:'Mewgenics',col:'#9fc7d6',ev:(tr,st)=>{const E=[];for(let k=0;k<st;k++)E.push([(k+1)*tr,st-k]);return E;},on:(t,tr,st)=>t<st*tr+.01},
    {n:'Pokémon',col:'#c9a2ff',ev:tr=>{const E=[];for(let k=1;k*tr<=TM;k++)E.push([k*tr,HP0/16]);return E;},on:()=>true},
    {n:'Asterion',col:'#6dd4c3',ev:(tr,st)=>{const E=[];for(let k=0;k<st;k++)E.push([(k+1)*2,(st-k)*4]);return E;},on:(t,tr,st)=>t<st*2+.01}];
  const hpAt=(m,t,tr,st)=>{if(m.cont)return HP0-m.cont[0]*Math.min(t,m.cont[1]);let h=HP0;for(const [et,d] of m.ev(tr,st))if(et<=t)h-=d;return Math.max(0,h);};
  let t=0,fr=0,pt=0;const st8=M.map(()=>({flash:0,last:-9,pops:[]}));
  const X=s=>44+s/TM*576,Y=h=>186-h/HP0*164;
  function chart(){f2clr(svg);const tr=c.v('tr'),st=c.v('st');
    for(const h of [0,25,50,75,100]){svgEl('line',{x1:44,x2:620,y1:Y(h),y2:Y(h),class:'gl'},svg);svgText(svg,38,Y(h)+4,h,{'text-anchor':'end','font-size':10.5});}
    for(let s=0;s<=TM;s+=2)svgText(svg,X(s),202,s+' s',{'text-anchor':'middle','font-size':10.5});
    const labs=M.map((m,i)=>{const p=[];for(let s=0;s<=TM;s+=.02)p.push([X(s),Y(hpAt(m,s,tr,st))]);poly(svg,p,{stroke:m.col,'stroke-width':2});return {m,y:Y(hpAt(m,TM,tr,st))-4};}).sort((a,b)=>a.y-b.y);
    for(let k=1;k<labs.length;k++)if(labs[k].y-labs[k-1].y<11)labs[k].y=labs[k-1].y+11;
    labs.forEach(l=>svgText(svg,X(TM)-2,l.y,l.m.n,{'text-anchor':'end','font-size':10.5,fill:l.m.col}));
    svgEl('line',{x1:X(t),x2:X(t),y1:16,y2:186,stroke:'#fff','stroke-width':1.1},svg);}
  const SL=['....xxxx....','..xxxxxxxx..','.xxxxxxxxxx.','xxxexxxxexxx','xxxexxxxexxx','xxxxxxxxxxxx','xxxxxxxxxxxx','.xxxxxxxxxx.'];
  c.on('tr',chart);c.on('st',chart);
  return {tick(dt){fr++;pt=t;if(motion||fr<3)t+=dt;if(t>TM+1.5){t=0;pt=0;st8.forEach(s=>{s.pops=[];s.last=-9;});}const tr=c.v('tr'),st=c.v('st'),tt=Math.min(t,TM);
    M.forEach((m,i)=>{const F=FS[i],u=F.u32,W=F.W,H=F.H,S=st8[i];u.fill(U('#1c130f'));
      for(let y=21;y<25;y++)for(let x=12;x<28;x++){const dx=(x-19.5)/8,dy=(y-22.5)/2;if(dx*dx+dy*dy<1)u[y*W+x]=U('#0e0907');}
      if(!m.cont)for(const [et,d] of m.ev(tr,st))if(et>pt&&et<=t&&et<=TM){if(t-S.last>.34){S.flash=.12;S.last=t;}S.pops.push({v:Math.round(d),a:.7});}
      const burning=m.on(tt,tr,st)&&t<=TM,hp=hpAt(m,tt,tr,st);
      let tint=0;if(m.tint&&burning)tint=.45;if(S.flash>0)tint=.55;S.flash=Math.max(0,S.flash-dt);
      const bob=(fr>>4)&1,ox=(W>>1)-6,oy=13+bob;
      SL.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='.')return;let col=ch==='e'?U('#1a1418'):(y<2?U('#9ad46a'):U('#6aa850'));if(tint&&ch!=='e')col=mix32(col,U('#ff3a2a'),tint);u[(oy+y)*W+ox+x]=col;}));
      if(burning){const ph=fr/6|0;for(let k=0;k<3;k++){const fx=ox+1+((f2H(i,k,ph>>2,1)*10)|0),fy=oy+5-((f2H(i,k,ph>>2,2)*4)|0),h=3+((f2H(i,k,ph,3)*3)|0);
          for(let y=0;y<h;y++){const w=y<h-1?1:0;for(let x=-w;x<=w;x++){const yy=fy-y;if(yy>=0)u[yy*W+fx+x]=f2FIRE[clamp(7-y-(x?1:0),3,7)];}}}}
      const bw=W-12,hb=Math.round(bw*hp/HP0);f2rect(u,W,H,6,H-5,bw,3,U('#3a1410'));f2rect(u,W,H,6,H-5,hb,3,hp>50?U('#7fd38a'):hp>25?U('#ffd468'):U('#ff5a4a'));
      S.pops=S.pops.filter(p=>(p.a-=dt)>0);S.pops.slice(-2).forEach((p,k)=>digits(u,W,H,ox+12-k*8,Math.round(3+p.a*8),p.v,U('#ffffff')));
      F.put();});
    c.out('tr',tr+' s');c.out('st',st);
    if(fr%3===0)chart();
    if(fr%8===0)ro.innerHTML=`HP after 12 s from 100 · `+M.map(m=>`${m.n} <b>${Math.round(hpAt(m,TM,tr,st))}</b>`).join(' · ')+` · damage flashes are capped at 3 per second, so Terraria's 4 ticks a second show as a steady drip of numbers`;}};});

// ======================================================================
// F3: explosion anatomy, frame stepper at 10 fps
// ======================================================================
reg('explosion',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),FL=PX(cvs[1]),W=A.W,H=A.H,c=ctl(root),ro=$('[data-ro]',root);
  const NF=12,NS=30,TOT=NF+NS,FR=[];const cx=48,cy=40,BG=new Uint32Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/8,y/8);BG[y*W+x]=n<.4?U('#3a2e26'):n<.7?U('#42342a'):U('#4a3c30');if(hash2(x,y)<.03)BG[y*W+x]=U('#5a4a3c');}
  const ang=(x,y)=>Math.atan2(y-cy,x-cx);
  function render(f){const u=new Uint32Array(BG);
    if(f>=6){const a=f<NF?1:Math.max(0,1-(f-NF)/NS);for(let y=cy-12;y<=cy+12;y++)for(let x=cx-22;x<=cx+22;x++){const dx=(x-cx)/20,dy=(y-cy)/10,d=dx*dx+dy*dy+(hash2(x,y)-.5)*.35;if(d<1&&a*(1-d)*24>bay(x,y))u[y*W+x]=d<.4?U('#140c0a'):U('#24180f');}}
    if(f===0){f2disc(u,W,H,cx,cy,9,U('#fff4c8'));f2disc(u,W,H,cx,cy,7,U('#ffffff'));}
    if(f>=1&&f<=6){const r=[0,9,14,17,19,20.5,21.5][f],heat=[0,1.25,1.1,.95,.8,.7,.6][f],eat=f>=4?(f-3)*.2:0;
      for(let y=Math.floor(cy-r-3);y<=cy+r+3;y++)for(let x=Math.floor(cx-r-3);x<=cx+r+3;x++){if(x<0||y<0||x>=W||y>=H)continue;const a=ang(x,y),rr=r*(1+.16*(n1(a*2.5+5,f>>1)-.5)*2),d=Math.hypot(x+.5-cx,y+.5-cy);if(d>rr)continue;
        const q=d/rr,nz=vnoise(x*.25+f*1.7,y*.25);if(eat&&q>1-eat+nz*.25){u[y*W+x]=nz>.55?U('#5a4640'):U('#3a2a26');continue;}
        const T=(1-q*.85)*heat+(nz-.5)*.25;u[y*W+x]=f2FIRE[clamp((T*7)|0,2,7)];}}
    if(f>=1&&f<=4){const rr=10+f*7,th=f<3?2:1,col=[0,U('#fff4c8'),U('#ffd468'),U('#ffa232'),U('#c46a3a')][f];
      for(let y=Math.floor(cy-rr-2);y<=cy+rr+2;y++)for(let x=Math.floor(cx-rr-2);x<=cx+rr+2;x++){if(x<0||y<0||x>=W||y>=H)continue;const d=Math.hypot(x+.5-cx,(y+.5-cy)*1.25);if(Math.abs(d-rr)<th*.5+.25&&(f<4||bay(x,y)<8))u[y*W+x]=col;}}
    if(f>=6&&f<NF){const k=(f-6)/6;for(let p=0;p<6;p++){const px=cx+(f2H(p,1,2,3)-.5)*26,py=cy-2+(f2H(p,4,5,6)-.5)*12-(f-6)*(2.5+f2H(p,7,8,9)*1.5),r=5.5+f2H(p,2,2,2)*2-(f-6)*.5;
        const lev=16*(1-k)+1;f2disc(u,W,H,px,py+1,r,U('#4a4248'),lev);f2disc(u,W,H,px-.5,py-.5,r*.8,U('#8a8288'),lev);}}
    if(c.v('deb')&&f>=1&&f<=9)for(let p=0;p<5;p++){const vx=(f2H(p,9,1,1)-.5)*8,vy=-(2.5+f2H(p,9,2,2)*3.5),x=Math.round(cx+vx*f),y=Math.round(cy+vy*f+.55*f*f);if(x>=0&&y>=0&&x<W&&y<H){u[y*W+x]=f<4?U('#ffd468'):U('#6a5a50');if(f<4&&x+1<W)u[y*W+x+1]=U('#ffa232');}}
    return u;}
  let cache={};const get=f=>cache[f]||(cache[f]=render(f));
  let seq=[],pos=0,acc=0,play=!reduce,fr=0,gap=0;
  function build(){cache={};seq=[0];if(c.v('hs'))seq.push(0,0);for(let f=1;f<TOT;f++)seq.push(f);pos=Math.min(pos,seq.length-1);}
  const pb=c.btn('play',b=>{play=!play;b.textContent=play?'Pause':'Play';});if(pb)pb.textContent=play?'Pause':'Play';
  c.btn('step',()=>{play=false;if(pb)pb.textContent='Play';pos=(pos+1)%seq.length;});c.btn('back',()=>{play=false;if(pb)pb.textContent='Play';pos=(pos-1+seq.length)%seq.length;});
  c.on('hs',build);c.on('deb',()=>{cache={};});c.seg('sk',()=>{});
  pointer(cvs[1],([x],k)=>{if(k==='down'){const f=clamp((x/24)|0,0,NF-1);pos=seq.indexOf(f);play=false;if(pb)pb.textContent='Play';}});
  const LAB=f=>f===0?'Frame 1: one white flash':f<=3?`Frame ${f+1}: fast yellow-orange growth, ring expanding`:f<=6?`Frame ${f+1}: growth slows, dark edges eat in`:f<NF?`Frame ${f+1}: grey puffs rise and dither out`:'Scorch decal fades over a few seconds';
  build();
  return {tick(dt){fr++;if(play&&motion){acc+=dt;if(acc>=.1){acc-=.1;if(pos===seq.length-1){gap+=.1;if(gap>.6){gap=0;pos=0;}}else pos++;}}
    const f=seq[pos],src=get(f),sk=c.segv('sk'),amp=sk==='heavy'?3:sk==='light'?1:0;let ox=0,oy=0;
    const si=pos-(c.v('hs')?2:0);if(amp&&f>=0&&f<=3&&!(c.v('hs')&&pos<3&&pos>0)){ox=Math.round((f2H(si,1,0,0)-.5)*2*amp);oy=Math.round((f2H(si,2,0,0)-.5)*2*amp);if(!ox&&!oy)ox=amp;}
    const u=A.u32;for(let y=0;y<H;y++){const sy=clamp(y-oy,0,H-1);for(let x=0;x<W;x++)u[y*W+x]=src[sy*W+clamp(x-ox,0,W-1)];}A.put();
    if(fr%2===0){const v=FL.u32,FW=FL.W;v.fill(U('#120b08'));for(let k=0;k<NF;k++){const s=get(k);for(let y=0;y<18;y++)for(let x=0;x<22;x++)v[y*FW+k*24+1+x]=s[(y*4+2)*W+x*4+5];
        if(k===Math.min(f,NF-1)&&f<NF)for(let x=0;x<24;x++){v[x+k*24]=U('#ffb44a');v[17*FW+x+k*24]=U('#ffb44a');}}
      for(let y=0;y<18;y++)if(f<NF){v[y*FW+f*24]=U('#ffb44a');v[y*FW+f*24+23]=U('#ffb44a');}FL.put();
      setHud(root,`${(pos/10).toFixed(1)} s · ${f<NF?'frame '+(f+1)+' of 12':'scorch'}`);
      const hold=c.v('hs')&&pos>0&&pos<3;ro.innerHTML=`${hold?'<b>Hitstop</b>: the flash is held 2 extra frames (about 12 frames at 60 Hz)':LAB(f)} · shake ${amp?amp+' px, whole pixels, frames 1 to 4 only':'off'} · ${c.v('deb')?'5 debris pixels with gravity':'no debris'}`;}}};});

// ======================================================================
// G1/G2: lava crust over glowing cracks; water makes rock and steam
// ======================================================================
reg('lava',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,N=W*H,c=ctl(root),ro=$('[data-ro]',root);
  const IN=new Uint8Array(N),ROCK=new Float32Array(N),GLOW=new Float32Array(N),IDX=new Uint8Array(N);const steam=f2Puffs(140);let t=0,fr=0,rocks=0,pours=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x-80)/66,dy=(y-46)/34,d=dx*dx+dy*dy+(vnoise(x/11,y/11)-.5)*.6;IN[y*W+x]=d<1?1:0;
    IDX[y*W+x]=((vnoise(x/9,y/9)*6+vnoise(x/4,y/4)*2+(x+y)*.05)|0)&7;}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(IN[y*W+x])continue;let best=99;for(let j=-7;j<=7;j++)for(let k=-7;k<=7;k++){const xx=x+k,yy=y+j;if(xx<0||yy<0||xx>=W||yy>=H)continue;if(IN[yy*W+xx]){const d=Math.hypot(j,k);if(d<best)best=d;}}GLOW[y*W+x]=best<8?(1-best/8)**2:0;}
  const HOT=['#9a1400','#ff2200','#ff7700','#ffee00'].map(U),CRU=['#2a1410','#4a2418'].map(U),CYC=['#5a0e00','#9a1400','#ff2200','#ff7700','#ffb400','#ffee00','#ff7700','#c41a00'].map(U);
  function pour(cx,cy){pours++;for(let y=cy-4;y<=cy+4;y++)for(let x=cx-4;x<=cx+4;x++){if(x<0||y<0||x>=W||y>=H)continue;const d=(x-cx)**2+(y-cy)**2;if(d>17)continue;const i=y*W+x;
      if(IN[i]&&ROCK[i]===0){ROCK[i]=1;rocks++;if(hash2(x,y+pours)<.25)steam.add(x,y,1+hash2(y,x)*1.2,(hash2(x,y)-.5)*8);}}}
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag')pour(x|0,y|0);});
  c.btn('reset',()=>{ROCK.fill(0);rocks=0;steam.clear();});c.seg('m',()=>{});
  return {tick(dt){fr++;if(motion||fr<3)t+=dt;steam.step(dt,10);const cyc=c.segv('m')==='cyc',u=F.u32,thr=.55+.05*Math.sin(t*.3);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let col;
      if(!IN[i]){col=hash2(x,y)<.5?U('#3a3432'):U('#443c38');if(vnoise(x/6,y/6)>.62)col=U('#524a44');if(GLOW[i])col=mix32(col,U('#ff6a20'),GLOW[i]*(.45+.08*Math.sin(t*2+x*.1)));}
      else if(ROCK[i]>0){const h=ROCK[i];col=h>.5&&hash2(x,y)<h-.3?HOT[1]:mix32(U('#2e2a2a'),U('#6a1e10'),Math.max(0,h-.2));if(hash2(x+3,y)<.15)col=mulc(col,1.25,1.2,1.2);}
      else if(cyc)col=CYC[(IDX[i]+((t*8)|0))&7];
      else{const n=vnoise(x*.11+t*.06,y*.11+t*.035)*.8+vnoise(x*.3,y*.3+t*.02)*.2;if(n>thr)col=n>thr+.09?CRU[0]:CRU[1];else{const v=vnoise(x*.15+t*.3,y*.15-t*.15);col=HOT[clamp(Math.floor(v*4),0,3)];if(n>thr-.03)col=HOT[0];}}
      u[i]=col;}
    for(let i=0;i<N;i++)if(ROCK[i]>0)ROCK[i]=Math.max(.0001,ROCK[i]-dt*.12);
    if(motion&&!cyc&&fr%9===0){const x=(rnd()*W)|0,y=(rnd()*H)|0;if(IN[y*W+x]&&!ROCK[y*W+x])steam.add(x,y,.35,0);}
    steam.draw(u,W,H,U('#d8dee6'),U('#f4f6fa'));F.put();
    if(fr%6===0){setHud(root,cyc?'palette cycling: 8 entries rotate':`crust threshold ${thr.toFixed(3)}`);
      ro.innerHTML=`${cyc?'one index per pixel; the palette rotates, so the CPU cost is 8 colour writes per step':'two noise reads per pixel: slow noise above the threshold draws crust in 2 dark entries, faster noise fills the cracks with 4 hot entries, quantised'} · lava + water → rock + steam: <b>${rocks}</b> rock pixels, steam puffs live <b>${steam.count()}</b>`;}}};});

// ======================================================================
// G3: heat haze by sine row offsets over a pixel scene
// ======================================================================
reg('haze',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);
  const BG=new Uint32Array(W*H),BUF=new Uint32Array(W*H);let t=0,fr=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)BG[y*W+x]=f2grass(x,y,4);
  for(let y=4;y<26;y++)for(let x=34;x<126;x++)BG[y*W+x]=(y%4===0)?U('#5a2418'):((x+(y>>2)*3)%7===0?U('#6a2a1c'):U('#8a3a26'));
  for(let y=26;y<50;y++)for(let x=36;x<124;x++)BG[y*W+x]=(x%4===0)?U('#6a4e34'):U('#8e6c48');
  for(const wx of [44,64,96,108])for(let y=31;y<41;y++)for(let x=wx;x<wx+8;x++)BG[y*W+x]=(x===wx||x===wx+7||y===31||y===40||x===wx+3||x===wx+4)?U('#3a2a1c'):U('#ffd468');
  for(let y=34;y<50;y++)for(let x=77;x<85;x++)BG[y*W+x]=(x===77||x===84||y===34)?U('#3a2a1c'):U('#5a3a24');
  for(let x=4;x<156;x++)for(let y=56;y<62;y++){const post=x%8===0;if(post||y===57||y===60)BG[y*W+x]=post?U('#6a4a30'):U('#9a7450');}
  for(let k=0;k<14;k++){const a=k/14*Math.PI*2,sx=Math.round(80+Math.cos(a)*15),sy=Math.round(88+Math.sin(a)*6);f2rect(BG,W,H,sx-1,sy-1,3,2,U('#7a7470'));}
  const FW=26,FH=26,fb=new Uint8Array(FW*FH);
  function fireStep(){for(let x=0;x<FW;x++){const e=Math.min(x,FW-1-x);fb[(FH-1)*FW+x]=e<3?0:e<6?10:15;}
    for(let y=1;y<FH;y++)for(let x=0;x<FW;x++){const s=y*FW+x,r=(rnd()*3)|0,d=s-FW-r+1;if(d>=0&&d<FW*FH)fb[d]=Math.max(0,fb[s]-(r&1)-(rnd()<.18?1:0));}}
  const FP=[0,f2FIRE[1],f2FIRE[1],f2FIRE[2],f2FIRE[2],f2FIRE[3],f2FIRE[3],f2FIRE[4],f2FIRE[4],f2FIRE[5],f2FIRE[5],f2FIRE[6],f2FIRE[6],f2FIRE[7],f2FIRE[7],f2FIRE[7]];
  c.seg('m',()=>{});
  const R0=14,R1=78,X0=50,X1=110;
  const fall=y=>smooth(R0,R0+22,y),edge=x=>smooth(X0,X0+10,x)*smooth(X1,X1-10,x);
  const off=(y,A,fq)=>A*Math.sin(y*fq+t*6)*fall(y);
  for(let i=0;i<40;i++)fireStep();
  function plot(A,fq,round){f2clr(svg);const Y=y=>(y/H)*200,X=v=>60+v*12;svgEl('line',{x1:60,x2:60,y1:0,y2:200,class:'gl'},svg);
    for(const v of [-4,-2,2,4])svgEl('line',{x1:X(v),x2:X(v),y1:Y(R0),y2:Y(R1),class:'gl'},svg);
    const p=[],q=[];for(let y=R0;y<=R1;y++){const o=off(y,A,fq);p.push([X(o),Y(y)]);q.push([X(Math.round(o)),Y(y)],[X(Math.round(o)),Y(y+1)]);}
    poly(svg,p,{stroke:'#8f7a69','stroke-width':1});if(round)poly(svg,q,{stroke:'#ffb44a','stroke-width':1.6});
    svgText(svg,60,Y(R0)-4,'offset per row',{'text-anchor':'middle','font-size':9.5});svgText(svg,X(-4),Y(R1)+12,'−4',{'text-anchor':'middle','font-size':9});svgText(svg,X(4),Y(R1)+12,'+4 px',{'text-anchor':'middle','font-size':9});}
  return {tick(dt){fr++;if(motion||fr<3)t+=dt;if(motion&&fr%2===0)fireStep();const A=c.v('A')/4,fq=c.v('f')/100,round=c.v('rd'),dra=c.segv('m')==='dra';
    BUF.set(BG);for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const v=fb[y*FW+x];if(v>1)BUF[(68+y)*W+67+x]=FP[v];}
    const u=F.u32;u.set(BUF);
    for(let y=R0;y<=R1;y++){const o=off(y,A,fq);for(let x=X0;x<X1;x++){const e=edge(x);let sx=x-o*e,sy=y;
        if(dra)sy=clamp(Math.round(y-A*.7*Math.cos(t*3+8*Math.PI*(x-X0)/(X1-X0))*fall(y)*e),0,H-1);
        if(round){u[y*W+x]=BUF[sy*W+clamp(Math.round(sx),0,W-1)];}
        else{const xi=Math.floor(sx),fx=sx-xi,a=BUF[sy*W+clamp(xi,0,W-1)],b=BUF[sy*W+clamp(xi+1,0,W-1)];u[y*W+x]=fx<.01?a:mix32(a,b,fx);}}}
    F.put();c.out('A',A.toFixed(2)+' px');c.out('f',fq.toFixed(2));
    if(fr%3===0)plot(A,fq,round);
    if(fr%8===0){setHud(root,round?'whole-pixel offsets':'sub-pixel blend');
      ro.innerHTML=`offset_x(row) = round(${A.toFixed(2)} · sin(row · ${fq.toFixed(2)} + t · 6) · falloff) over <b>${R1-R0+1}</b> rows · one sine per row, or one read from a 180-entry table · ${dra?'plus a vertical wave across columns, the Dracula X mix':'horizontal only'} · ${round?'pixels stay crisp':'<b>blended pixels smear the window frames and shimmer</b>'}`;}}};});
