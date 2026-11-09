// ======================================================================
// Scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#2a2030','#4a3040','#7a4a32','#c47a34','#ffc870'];const RL=['Simplicity','Speed','Pixel taste','Mood','Interactivity'];const SC=['#ffc870','#8ea8ff','#ff8f7a'];
  let sel=['A3','E1','C3'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Mood','Interact.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#1d1408':'#ece6f2'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-40 0 ${S+80} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#463c55':'#1d1924'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#1d1924'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// 6a: light personality catalogue (15 live mini scenes)
// ======================================================================
function miniScene(W,H,o){const N=W*H,ALB=new Uint32Array(N),BASE=new Int32Array(N).fill(-1),OCC=new Uint8Array(N),RAISED=new Uint8Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=hash2(x+o.seed,y);let col=vnoise(x/8+o.seed,y/8)<.45?U('#4f7d3e'):U('#5f8f48');if(h<.03)col=U('#82b25e');
    if(x>W*.22&&x<W*.62&&y>H*.2&&y<H*.66){const row=(y/5)|0,off=(row&1)*3;col=((x+off)%7===0||y%5===0)?U('#6e6a63'):(h<.4?U('#949087'):U('#aaa69c'));}ALB[y*W+x]=col;}
  const raise=(x,y,yb,col,h)=>{if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;ALB[i]=col;BASE[i]=yb*W+x;RAISED[i]=yb-y;};
  const fy=o.fy,fx0=o.fx0,fx1=o.fx1;for(let x=fx0;x<=fx1;x++){const post=((x-fx0)%6)<1;for(let y=fy-5;y<=fy;y++){if(!post&&y!==fy-2&&y!==fy-4)continue;raise(x,y,fy,post?U('#7a5a3a'):U('#a07a52'));}OCC[fy*W+x]=5;}
  const [bx,by]=o.barrel;for(let y=by-8;y<=by;y++)for(let x=bx-3;x<=bx+3;x++)raise(x,y,by,(y===by-6||y===by-2)?U('#5a5a62'):x<bx?U('#9a6a3e'):U('#7a5230'));for(let x=bx-3;x<=bx+3;x++)for(let y=by-1;y<=by;y++)OCC[y*W+x]=9;
  if(o.obel){const [ox,oy]=o.obel;for(let y=oy-o.oh;y<=oy;y++)for(let x=ox-1;x<=ox+1;x++)raise(x,y,oy,x<ox?U('#d0c8b8'):x===ox?U('#aaa294'):U('#807868'));}
  return {W,H,ALB,BASE,OCC,RAISED};}
function castMini(sc,L){const thr=L.h*.6;for(let a=0;a<256;a++){const an=a/256*2*Math.PI,dx=Math.cos(an),dy=Math.sin(an);let d=1;for(;d<L.R;d++){const px=(L.x+dx*d)|0,py=(L.y+dy*d)|0;if(px<0||py<0||px>=sc.W||py>=sc.H)break;if(sc.OCC[py*sc.W+px]>=thr)break;}L.dist[a]=d+1.5;}}
function drawMiniLight(u,sc,L,I,t){const W=sc.W,H=sc.H;const T=L.T;let col=T.c;if(T.c2){const k=.5+.5*Math.sin(t*.4+L.s);col=col.map((v,j)=>v+(T.c2[j]-v)*k);}
  const R=L.R*(T.fl==='fire'||T.fl==='camp'?(.94+.06*I):1);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,bi=sc.BASE[i]>=0?sc.BASE[i]:i,bx=bi%W,by=(bi/W)|0;const dx=bx-L.x,dy=by-L.y,d=Math.hypot(dx,dy);let f=0;
    if(d<=R){const a=(Math.round(Math.atan2(dy,dx)/(2*Math.PI)*256)+256)&255;if(!T.sh||d<=L.dist[a]){const q=1-(d/R)**2;f=q*q*I*1.25;}}
    const al=un32(sc.ALB[i]),B=bay(x,y)/16;u[i]=pack(al[0]*Math.floor((NIGHTA[0]+col[0]*f)*6+B)/6,al[1]*Math.floor((NIGHTA[1]+col[1]*f)*6+B)/6,al[2]*Math.floor((NIGHTA[2]+col[2]*f)*6+B)/6);}
  const fc=pack(255,Math.min(255,col[1]*290),Math.min(255,col[2]*255+40));const lx=L.x|0,ly=L.y|0;for(const [ax,ay] of [[0,-1],[0,-2],[1,-1]]){const xx=lx+ax,yy=ly+ay-(L.h>8?3:0);if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=I>.15?fc:pack(80,70,60);}}
function drawMiniSun(u,sc,hour){const W=sc.W,H=sc.H,S=sky(hour),SH=new Uint8Array(W*H);
  if(S.dir){for(let i=0;i<W*H;i++){if(sc.BASE[i]<0)continue;const x=i%W,yb=(sc.BASE[i]/W)|0,h=sc.RAISED[i];for(let e=0;e<2;e++){const sx=Math.round(x+S.dir[0]*h*S.len)+e,sy=Math.round(yb+S.dir[1]*h*S.len);if(sx>=0&&sy>=0&&sx<W&&sy<H)SH[sy*W+sx]=1;}}}
  const f=.45+.55*Math.max(0,S.svy+.3*Math.abs(S.svx));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,raised=sc.BASE[i]>=0;const s=raised?f:(SH[i]?0:1);const al=un32(sc.ALB[i]),B=bay(x,y)/16;
    u[i]=pack(al[0]*Math.floor((S.amb[0]+S.sun[0]*s)*6+B)/6,al[1]*Math.floor((S.amb[1]+S.sun[1]*s)*6+B)/6,al[2]*Math.floor((S.amb[2]+S.sun[2]*s)*6+B)/6);}return S;}
reg('catalogue',root=>{const grid=$('.cards',root),det=$('.detail',root),txt=$('[data-txt]',root),big=PX($('.detail canvas',root)),tc=$('canvas.trace',root),tg=tc.getContext('2d');
  const CFG=[{t:'candle'},{t:'torch'},{t:'campfire'},{t:'brazier'},{t:'lantern'},{t:'lamp'},{t:'fireplace'},{t:'magic'},{t:'rune'},{t:'mushroom'},{t:'firefly'},{sun:0,chip:'#8094e6'},{sun:12,chip:'#fffae6'},{sun:17.6,chip:'#ffb86b'},{sun:18.3,chip:'#574770'}];
  const LAB=['Colour (K → hex)','Radius','Flicker model','Height','Shadows?','Gameplay role'];
  grid.innerHTML=CATROWS.map((r,i)=>{const cf=CFG[i];const chip=cf.t?TYPES[cf.t].col:cf.chip;const tmp=document.createElement('div');tmp.innerHTML=r.c[2];const tx=tmp.textContent;const fl=tx.length>64?tx.slice(0,62).replace(/[\s;,(]+\S*$/,'')+'…':tx;
    return `<button type="button" class="card${i===1?' on':''}" data-i="${i}"><canvas width="96" height="56"></canvas><b><span class="swatch" style="background:${chip}"></span>${r.n}</b><small>${fl}</small></button>`;}).join('');
  const cards=$$('.card',grid);
  const scSmall=miniScene(96,56,{seed:3,fy:44,fx0:6,fx1:44,barrel:[70,30]}),scSun=miniScene(96,56,{seed:3,fy:46,fx0:6,fx1:44,barrel:[70,34],obel:[34,30],oh:18});
  const scBig=miniScene(192,96,{seed:9,fy:76,fx0:14,fx1:90,barrel:[136,52]}),scBigSun=miniScene(192,96,{seed:9,fy:80,fx0:14,fx1:90,barrel:[136,56],obel:[70,50],oh:28});
  const mkL=(ty,x,y,s)=>{const T=TYPES[ty];const L={T,x,y,R:T.R,h:T.h,dist:new Float32Array(256),s,fg:FG()};return L;};
  const Ls=CFG.map((cf,i)=>cf.t?mkL(cf.t,40,30,i*31+7):null);Ls.forEach(L=>{if(L)castMini(scSmall,L);});
  const PXs=cards.map(cd=>PX($('canvas',cd)));let sel=1,bigL=null,hist=[],t=0,fr=0;
  function select(i){sel=i;cards.forEach((c,k)=>c.classList.toggle('on',k===i));const r=CATROWS[i];txt.innerHTML=`<h5>${r.n}</h5><dl class="kv">${r.c.map((v,k)=>`<dt>${LAB[k]}</dt><dd>${v}</dd>`).join('')}</dl>`;
    const cf=CFG[i];bigL=cf.t?mkL(cf.t,82,46,i*31+7):null;if(bigL)castMini(scBig,bigL);hist=[];}
  grid.addEventListener('click',e=>{const b=e.target.closest('.card');if(b)select(+b.dataset.i);});select(1);
  return {tick(dt){t+=dt;fr++;
    CFG.forEach((cf,i)=>{const u=PXs[i].u32;if(cf.t){const L=Ls[i];const I=L.fg(flickerOf(L.T.fl,t,L.s),t);drawMiniLight(u,scSmall,L,I,t);}else if(fr%10===1||i===sel)drawMiniSun(u,scSun,cf.sun);PXs[i].put();});
    const cf=CFG[sel];let I=1;if(cf.t){I=bigL.fg(flickerOf(bigL.T.fl,t,bigL.s),t);drawMiniLight(big.u32,scBig,bigL,I,t);setHud(root,`${cf.t}: R ${bigL.R} px, h ${bigL.h} · I ${I.toFixed(2)}`);}
    else{const S=drawMiniSun(big.u32,scBigSun,cf.sun);I=S.sun[0]+S.sun[1]+S.sun[2]?1:0;setHud(root,`${fmtH(cf.sun)} · sun ${Math.round(S.el)}°${S.moon?' · moon shadows':''}${!S.dir?' · no cast shadows':''}`);}
    big.put();hist.push([t,I]);while(hist.length&&hist[0][0]<t-4)hist.shift();
    tg.clearRect(0,0,384,56);tg.strokeStyle='#2e2838';tg.beginPath();tg.moveTo(0,8);tg.lineTo(384,8);tg.moveTo(0,50);tg.lineTo(384,50);tg.stroke();tg.strokeStyle='#ffc870';tg.lineWidth=1.6;tg.beginPath();
    hist.forEach((h,j)=>{const x=(h[0]-(t-4))/4*384,y=50-Math.min(1.1,h[1])*42;if(j===0)tg.moveTo(x,y);else tg.lineTo(x,y);});tg.stroke();tg.fillStyle='#9e94ad';tg.font='10px "IBM Plex Mono",monospace';tg.fillText('brightness, last 4 s',4,20);}};});

// ======================================================================
// 6b: object interaction matrix with live village crops
// ======================================================================
reg('matrix',root=>{const tbody=$('tbody',root),cv=$('canvas',root),F=PX(cv),note=$('[data-note]',root),V=mkVillage(777);const BIG=new Uint32Array(320*180);
  const P=V.player;
  const PRE=[
    [{crop:[120,10],hour:13,note:'Noon over the trees: crowns cast broken shade, with about 8% of crown pixels left as sunflecks; the obelisk and lamp posts throw short shadows.'},
     {crop:[160,90],hour:22.5,carry:'lantern',path:[[232,120],[300,118],[316,140],[300,176],[232,178],[226,150]],note:'A lantern carried round the pond: each nearby light draws a shimmering column on the water, and tree trunks (22 px) cut its light.'},
     {crop:[160,90],hour:23.5,note:'Night by the pond: the moon draws a streak on the water, fireflies blink and mushrooms breathe.'}],
    [{crop:[100,40],loop:[7,17.5,.9],note:'The obelisk as a sundial: its shadow swings from west to east and shortens towards noon.'},
     {crop:[0,90],hour:21,path:[[30,150],[96,150],[96,166],[30,166]],carry:'torch',note:'The fence is 5 px tall: the campfire (h 4) is stopped by it, the street lamp (h 16) shines over it, and the walker\'s torch (h 10) passes it too.'},
     {crop:[100,50],loop:[18.6,19.7,.12],note:'Dusk on a loop: the four street lamps switch on one by one, about ten minutes apart, and the string lights come on with the night.'}],
    [{crop:[0,10],hour:15.5,roofOff:true,note:'Roof cut away at 15:30: sun patches fall on the floor through the window and door gaps.'},
     {crop:[0,10],hour:21.5,roofOff:false,note:'Roof on at night: the fireplace and candle shine out through the gaps onto the grass, while the roof itself takes only 20%.'},
     {crop:[0,0],scale:2,loop:[18,19.4,.12],note:'The whole village at dusk: windows light up untinted and the lamps stagger on.'}],
    [{crop:[120,60],hour:9,path:[[140,96],[210,96],[210,124],[140,124]],npc:true,note:'Morning: the walker and the robed NPC cast projected sun shadows, longer while the sun is low.'},
     {crop:[0,90],hour:22,path:[[44,128],[74,128],[76,152],[40,152]],note:'Round the campfire: the walker\'s 5×2 px occluder throws a long shadow away from the fire.'},
     {crop:[100,60],hour:22,carry:'torch',path:[[130,100],[210,100],[210,124],[130,124]],npc:true,note:'Night: both characters carry their own light, so they stay readable in the dark.'}]];
  tbody.innerHTML=MATROWS.map((r,ri)=>`<tr><th scope="row">${r.n}<small>${r.sub}</small></th>${r.c.map((v,ci)=>`<td tabindex="0" role="button" aria-label="${r.n} under ${['sun','point light','night'][ci]}: show it" data-r="${ri}" data-c="${ci}">${v}</td>`).join('')}</tr>`).join('');
  let cur=null,t=0,lt=0,wi=0,fr=0;
  function apply(ri,ci){cur=PRE[ri][ci];lt=0;wi=0;V.npc.show=!!cur.npc;V.setCarried(cur.carry||'none');if(cur.path){[P.x,P.y]=cur.path[0];}else{P.x=-80;P.y=-80;}P.tx=null;
    $$('td[data-r]',tbody).forEach(b=>b.classList.toggle('on',+b.dataset.r===ri&&+b.dataset.c===ci));note.textContent=cur.note;}
  tbody.addEventListener('click',e=>{const a=e.target.closest('a');if(a)return;const b=e.target.closest('td[data-r]');if(b)apply(+b.dataset.r,+b.dataset.c);});
  tbody.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const b=e.target.closest('td[data-r]');if(b){e.preventDefault();apply(+b.dataset.r,+b.dataset.c);}});apply(1,1);
  return {tick(dt){t+=dt;lt+=dt;fr++;const hour=cur.loop?cur.loop[0]+((lt*cur.loop[2])%(cur.loop[1]-cur.loop[0])):cur.hour;
    if(cur.path&&(P.tx===null||P.tx===undefined)){wi=(wi+1)%cur.path.length;[P.tx,P.ty]=cur.path[wi];}
    V.update(dt,{hour,free:true,speed:18});const st={hour,t,mode:'banded'};if(cur.roofOff!==undefined)st.roofOff=cur.roofOff;
    if(cur.scale===2){V.render(BIG,320,180,0,0,st);const u=F.u32;for(let y=0;y<90;y++)for(let x=0;x<160;x++)u[y*160+x]=BIG[(y*2)*320+x*2];}else V.render(F.u32,160,90,cur.crop[0],cur.crop[1],st);
    F.put();if(fr%8===0)setHud(root,`${fmtH(hour)}${cur.loop?' (looping)':''}`);}};});

// ======================================================================
// 6c: day/night timeline driving the village square
// ======================================================================
reg('daynight',root=>{const cv=$('canvas',root),F=PX(cv),svg=$('svg',root),tbody=$('tbody',root),ro=$('[data-ro]',root),V=mkVillage(777);const X0=100,Y0=50;
  const counts=[];for(let k=0;k<=240;k++){V.scheduleLights(k/10);counts.push(V.lights.filter(L=>L.on).length);}
  tbody.innerHTML=DNROWS.map((r,i)=>`<tr data-i="${i}" tabindex="0">${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('');
  const rowH=DNROWS.map(r=>{const tmp=document.createElement('div');tmp.innerHTML=r[0];const m=tmp.textContent.match(/(\d\d):(\d\d)/);return m?(+m[1]+ +m[2]/60):0;});
  let hour=17.6,auto=!reduce,t=0,fr=0,lastRow=-1;
  const go=i=>{hour=rowH[i]===0&&i>0?0.3:rowH[i];auto=false;};
  tbody.addEventListener('click',e=>{const tr=e.target.closest('tr');if(tr)go(+tr.dataset.i);});tbody.addEventListener('keydown',e=>{if(e.key==='Enter'){const tr=e.target.closest('tr');if(tr)go(+tr.dataset.i);}});
  const X=h=>36+h/24*372,Y=v=>170-v*150;const shadowPx=h=>{const S=sky(h);return S.dir?28*S.len:0;};
  function chart(){svg.innerHTML='';for(const h of [0,6,12,18,24]){svgEl('line',{x1:X(h),x2:X(h),y1:14,y2:170,class:'gl'},svg);svgText(svg,X(h),186,String(h).padStart(2,'0')+':00',{'font-size':10,'text-anchor':'middle'});}
    svgEl('line',{x1:36,x2:408,y1:Y(.5),y2:Y(.5),class:'ax'},svg);svgText(svg,32,Y(.5)+4,'0°',{'font-size':9.5,'text-anchor':'end'});svgText(svg,32,Y(1)+8,'62°',{'font-size':9.5,'text-anchor':'end'});
    for(let h=0;h<24;h+=.25){const a=sky(h).amb;svgEl('rect',{x:X(h),y:190,width:372/96+.4,height:8,fill:rgbCss(a[0]/.7*255,a[1]/.7*255,a[2]/.7*255)},svg);}
    const p1=[],p2=[],p3=[],p4=[];for(let k=0;k<=240;k++){const h=k/10;p1.push([X(h),Y(.5+sunEl(h)/124)]);p2.push([X(h),Y(tfsLight(h*60)/250)]);p3.push([X(h),Y(counts[k]/42)]);p4.push([X(h),Y(Math.min(1,shadowPx(h)/80))]);}
    poly(svg,p2,{class:'s2'});poly(svg,p3,{class:'s3'});poly(svg,p4,{class:'s4'});poly(svg,p1,{class:'s1'});
    svgEl('line',{x1:X(hour),x2:X(hour),y1:8,y2:198,class:'now'},svg);svgText(svg,X(hour)+(hour>18?-4:4),10,fmtH(hour),{'font-size':10,class:'v','text-anchor':hour>18?'end':'start'});
    const hit=svgEl('rect',{x:36,y:0,width:372,height:200,fill:'transparent',class:'drag'},svg);
    const set=e=>{const r=svg.getBoundingClientRect();hour=clamp(((e.clientX-r.left)/r.width*420-36)/372*24,0,23.99);auto=false;};
    hit.addEventListener('pointerdown',e=>{set(e);hit.setPointerCapture(e.pointerId);});hit.addEventListener('pointermove',e=>{if(e.buttons)set(e);});}
  return {tick(dt){t+=dt;fr++;if(auto&&motion)hour=(hour+dt*(Math.abs(sunEl(hour))<14?.2:.6))%24;V.update(dt,{hour});const r=V.render(F.u32,160,90,X0,Y0,{hour,t,mode:'banded'});F.put();
    if(fr%4===0){chart();let best=0,bd=99;rowH.forEach((h,i)=>{const d=Math.min(Math.abs(h-hour),24-Math.abs(h-hour));if(d<bd){bd=d;best=i;}});
      if(best!==lastRow){$$('tr',tbody).forEach((tr,i)=>tr.classList.toggle('sel',i===best));lastRow=best;}
      const S=r.S,n=counts[Math.round(hour*10)%241];setHud(root,`${fmtH(hour)} · sun ${Math.round(S.el)}° · ${n} lights on`);
      ro.innerHTML=`<b>${fmtH(hour)}</b> · sun ${S.el.toFixed(1)}° · ambient (${S.amb.map(v=>v.toFixed(2)).join(', ')}) · ${S.dir?`${S.moon?'moon':'sun'} shadow k ${S.len.toFixed(2)} → obelisk <b>${Math.round(28*S.len)} px</b>`:'<b>no cast shadows</b>'} · Tibia light ${Math.round(tfsLight(hour*60))} · lights on here: <b>${n}</b> · nearest table row: ${DNROWS[best][0]}`;}}};});

// ======================================================================
// 6d: carried light design (type, fuel, stealth)
// ======================================================================
reg('carried',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root),V=mkVillage(777);V.npc.show=false;const P=V.player;P.x=64;P.y=100;
  let ty='torch',L=V.setCarried(ty),ft=0,t=0,fr=0,wi=0;const hour=22.5;
  const ROUTE=[[96,92],[100,88],[124,88],[130,96],[150,110],[200,114],[222,120],[200,112],[140,104],[118,98],[64,100],[62,126],[64,100]];
  const LURK=[[140,72],[186,138],[90,124],[252,102],[40,96]];
  c.seg('ty',v=>{ty=v;L=V.setCarried(v);});c.btn('refuel',()=>{ft=0;});c.seg('fuel',()=>{ft=0;});
  pointer(cv,([x,y],k)=>{if(k==='down'){const cx=clamp(Math.round(P.x-80),0,160),cy=clamp(Math.round(P.y-50),0,90);P.tx=cx+x;P.ty=cy+y;c.el('auto').checked=false;}});
  return {tick(dt){t+=dt;fr++;ft+=dt;const fuel=c.segv('fuel');let m=1,stage='';
    if(fuel==='steps'){m=ft<10?1:ft<15?6/7:ft<20?5/7:0;stage=ft<10?'Lit 7':ft<15?'Medium 6':ft<20?'Small 5':'burnt out';}else if(fuel==='smooth'){m=Math.max(0,1-ft/20);stage=m>0?`${Math.round(m*100)}%`:'burnt out';}else stage='endless';
    L.R=Math.max(1,Math.round(TYPES[ty].R*m));L.on=m>0;L.dirty=true;
    if(c.v('auto')&&(P.tx===null||P.tx===undefined)){wi=(wi+1)%ROUTE.length;[P.tx,P.ty]=ROUTE[wi];}
    V.update(dt,{hour,speed:26});const cx=clamp(Math.round(P.x-80),0,160),cy=clamp(Math.round(P.y-50),0,90);
    const r=V.render(F.u32,160,90,cx,cy,{hour,t,mode:'banded',only:[L]});
    const det=L.on?L.R*1.2:0;let seen=0;const u=F.u32;
    for(const [lx,ly] of LURK){const d=Math.hypot(lx-P.x,ly-P.y),on=c.v('stealth')&&d<det;if(on)seen++;const ex=lx-cx,ey=ly-cy;const col=on?pack(255,74,58):pack(70,52,84);for(const dx of [-2,1])if(ex+dx>=0&&ex+dx<160&&ey>=0&&ey<90)u[ey*160+ex+dx]=col;}
    F.put();
    if(fr%6===0){const s=V.sample(P.x,P.y-1),lum=(.3*(NIGHTA[0]+s.pt[0])+.55*(NIGHTA[1]+s.pt[1])+.15*(NIGHTA[2]+s.pt[2]));const g=clamp(lum,0,1);const thr=TYPES[ty].h*.6;
      setHud(root,`${ty} · R ${L.on?L.R:0} px · ${stage}`);
      ro.innerHTML=`${ty==='orb'?'light spell':ty}: height ${TYPES[ty].h} → rays stop at occluders ≥ <b>${thr.toFixed(1)}</b>, so barrels (9) ${9>=thr?'<b>cast shadows</b>':'are flown over'} · fuel: <b>${stage}</b>${fuel==='steps'?' (steps read like a small alarm)':''} · light gem <span class="swatch" style="background:${rgbCss(255*g,230*g,160*g)}"></span> ${(g*100).toFixed(0)}% · ${c.v('stealth')?`lurkers noticing you: <b>${seen}</b> of ${LURK.length} (notice radius ${Math.round(det)} px)`:'stealth off'}`;}}};});

// ======================================================================
// 6e: performance budget calculator (work units vs the study's limits)
// ======================================================================
reg('budget',root=>{const c=ctl(root),svg=$('svg.chart',root),vd=$('.verdict',root),ro=$('[data-ro]',root);
  const PRE={study:{res:'480',lm:'0.5',n:30,r:80,l2:8,sh:2,rc:5,pcf:'1'},sandbox:{res:'320',lm:'1',n:28,r:34,l2:0,sh:0,rc:5,pcf:'1'},heavy:{res:'640',lm:'1',n:60,r:110,l2:20,sh:6,rc:16,pcf:'13'}};
  $$('[data-pre]',root).forEach(b=>b.addEventListener('click',()=>{const p=PRE[b.dataset.pre];c.setSeg('res',p.res);c.setSeg('lm',p.lm);c.setSeg('pcf',p.pcf);['n','r','l2','sh','rc'].forEach(k=>c.el(k).value=p[k]);draw();}));
  ['n','r','l2','sh','rc'].forEach(k=>c.on(k,draw));['res','lm','pcf'].forEach(k=>c.seg(k,draw));
  function bar(y,label,v,max,lims,unit,hot,fmt){const X0=150,Wd=200;const w=Math.min(1,v/max)*Wd;svgText(svg,0,y+9,label,{'font-size':10.5});svgEl('rect',{x:X0,y,width:Wd,height:12,fill:'#1d1924'},svg);
    svgEl('rect',{x:X0,y,width:Math.max(1,w),height:12,fill:hot?'#ff6b5e':'#e08a3a'},svg);for(const [lv,lab,col] of lims){const lx=X0+Math.min(1,lv/max)*Wd;svgEl('line',{x1:lx,y1:y-3,x2:lx,y2:y+15,stroke:col||'#8ea8ff','stroke-width':1.5},svg);if(lab)svgText(svg,lx+2,y-4,lab,{'font-size':8.5,fill:col||'#8ea8ff'});}
    svgText(svg,X0+Wd+6,y+10,(fmt?fmt(v):Math.round(v).toLocaleString())+unit,{'font-size':10.5,class:'v'});}
  function draw(){const res=+c.segv('res'),W=res,H=Math.round(res*9/16),s=+c.segv('lm'),n=c.v('n'),r=c.v('r'),l2=c.v('l2'),sh=Math.min(c.v('sh'),l2),rc=c.v('rc'),pcf=+c.segv('pcf');
    c.out('n',n);c.out('r',r);c.out('l2',l2);c.out('sh',sh);c.out('rc',rc);
    const lmTex=Math.round(W*s)*Math.round(H*s),per=Math.PI*(r*s)**2,fills=n*per,tiles=Math.ceil(W/16)*Math.ceil(H/16),cpu=rc*.06,passes=sh*4;
    svg.innerHTML='';let y=16;
    bar(y,'Light-map fills / frame',fills,600000,[[150000,'study example ≈ 150k']],'',fills>300000);y+=34;
    bar(y,'Light-map texels',lmTex,230400,[],'',false);y+=34;
    bar(y,'Tile light texels',tiles,1500,[],'',false);y+=34;
    bar(y,'Real Light2D on screen',l2,24,[[8,'8'],[12,'12'],[15,'15/item cap','#ff8f7a']],'',l2>12);y+=34;
    bar(y,'Shadowed lights',sh,8,[[3,'1–3']],'',sh>3);y+=34;
    bar(y,'Occluder passes',passes,32,[[12,'3 × 4']],'',passes>12);y+=34;
    bar(y,'Shadow taps per lit px',sh*pcf,104,[],'',false);y+=34;
    bar(y,'CPU polar casts (JS)',cpu,3.5,[[2,'2 ms'],[3,'3 ms']],' ms',cpu>2,v=>v.toFixed(2));
    const bad=[];if(l2>12)bad.push('more than 12 Light2D');if(sh>3)bad.push('more than 3 shadowed lights');if(cpu>2)bad.push('CPU rays over ~2 ms');if(fills>300000)bad.push('light-map fills twice the study\'s example');
    vd.className='verdict '+(bad.length?'bad':'ok');vd.textContent=bad.length?`Over the study's proposal: ${bad.join(', ')}. Profile on a phone first.`:'Within the study\'s proposed budget. Measure on a phone before adding the second shadowed light.';
    ro.innerHTML=`${W}×${H} with 16 px tiles = <b>${Math.ceil(W/16)}×${Math.ceil(H/16)} = ${tiles}</b> tile texels · light map ${s===1?'full':s===.5?'½':'¼'} = ${Math.round(W*s)}×${Math.round(H*s)} = <b>${lmTex.toLocaleString()}</b> texels · one R = ${r} px stamp ≈ π·(${r}·${s})² = ${Math.round(per).toLocaleString()} texels × ${n} = <b>${Math.round(fills).toLocaleString()}</b> fills · ${sh} shadowed × 4 passes = <b>${passes}</b>, × ${pcf} tap${pcf>1?'s':''} · ${rc} re-casts × ~60 µs = <b>${cpu.toFixed(2)} ms</b> CPU · day/night LUT: 2 fetches per pixel`;}
  draw();return {};});

// ======================================================================
// architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});
