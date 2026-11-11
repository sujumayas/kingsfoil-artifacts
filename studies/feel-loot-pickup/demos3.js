// Loot and pickup study: figures 3 (costs, score, matrix, stack). Helpers and sprites live in core.js.
{
const FAMC={A:'#d9a066',B:'#f2c14e',C:'#ff9a1f',D:'#4c9bff',E:'#4ce04c',F:'#9fd3c7',G:'#b45cff',H:'#f3eef5'};
const RL=['Clarity','Delight','MMO fit','Fairness','Speed'];
// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#211c29','#3a2e44','#6a4a4a','#b8703e','#f2c14e'];const SC=['#f2c14e','#9fd3c7','#ec7a5c'];
  let sel=['A3','C2','H1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Clarity','Delight','MMO','Fair','Speed'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#17121c':'#ebe5ee'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=100;svg.setAttribute('viewBox',`-46 0 ${S+92} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#50465f':'#2b2436'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#2b2436'},svg);const [lx,ly]=pt(k,6.2);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// §5 feel against fit: Clarity + Delight across, MMO fit + Fairness + Speed up
// ======================================================================
reg('matrix',root=>{const svg=$('svg',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const NOTE={C2:'a pre-baked halo costs 0.36 ms for 200 glows on the M4 GPU, shadowBlur 20.1 ms (§6d).',A2:'every spilled item is a separate thing to own, label, cap, race for and despawn.',
    G4:'invisible as feel, but it is what stops a dupe.',G2:'invisible as feel, fair for every ping.',A3:'one sprite swap and one byte, and players name bags by colour.',B1:'1000 arcing items with shadows cost 2.26 ms over baseline on the M4 GPU (§6d).',
    H1:'harsh, and it rewards bystanders who loot first.',F3:'free for all and round robin invite ninjas.',D3:'3000 candidates in 0.18 ms on the M4 with the grid (§6d).',E3:'delightful, but a big magnet steals clarity in a crowd.',C4:'it lowers cost, because most drops get the cheapest show.'};
  const nar=svg.getBoundingClientRect().width<520,VW=nar?380:600,H=320;svg.setAttribute('viewBox',`0 0 ${VW} ${H}`);const L=44,Rr=VW-12,T=22,B=262,X0=3.5,X1=10.5,Y0=8.5,Y1=15.5,X=v=>L+(v-X0)/(X1-X0)*(Rr-L),Y=v=>B-(v-Y0)/(Y1-Y0)*(B-T);
  const zone=(x0,x1,y0,y1,fill,label,anchor,ly)=>{svgEl('rect',{x:X(x0),y:Y(y1),width:X(x1)-X(x0),height:Y(y0)-Y(y1),fill,opacity:.12},svg);svgText(svg,anchor==='end'?X(x1)-5:X(x0)+5,ly==='top'?Y(y1)+14:Y(y0)-6,label,{'font-size':11,'text-anchor':anchor||'start',fill:'#c4bccc'});};
  zone(7.5,10.5,13.5,15.5,'#4ce04c','build first','end','top');zone(3.5,10.5,8.5,11.5,'#e0734f','costly or unfair in a crowd','start');
  for(let v=9;v<=15;v++){svgEl('line',{x1:L,x2:Rr,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-6,Y(v)+4,String(v),{'text-anchor':'end','font-size':11});}
  for(let v=4;v<=10;v++)svgText(svg,X(v),B+15,String(v),{'text-anchor':'middle','font-size':11});
  svgText(svg,(L+Rr)/2,B+32,'Clarity + Delight (feel) →',{'text-anchor':'middle','font-size':11,class:'lab'});
  svgText(svg,12,(T+B)/2,'MMO fit + Fairness + Speed →',{'text-anchor':'middle','font-size':11,class:'lab',transform:`rotate(-90 12 ${(T+B)/2})`});
  const cells={};SCORE.forEach(s=>{const k=(s.r[0]+s.r[1])+':'+(s.r[2]+s.r[3]+s.r[4]);(cells[k]=cells[k]||[]).push(s);});const pts=[];
  for(const k in cells){const list=cells[k],[fx,cy0]=k.split(':').map(Number),n=list.length,cols=Math.min(n,n>6?5:3),rowsN=Math.ceil(n/cols),dx=nar?8:12,dy=nar?8:10;
    list.forEach((s,j)=>{const col=j%cols,row=Math.floor(j/cols),cx=X(fx)+(col-(cols-1)/2)*dx,cy=Y(cy0)+(row-(rowsN-1)/2)*dy;
      const g=svgEl('g',{class:'pt',tabindex:0,'data-id':s.id,role:'button','aria-label':`${s.id} ${s.name}`},svg);
      svgEl('circle',{cx,cy,r:nar?3.4:4.6,fill:FAMC[s.id[0]],stroke:'#15121b','stroke-width':1},g);pts.push(g);});}
  const show=id=>{const s=SCORE.find(x=>x.id===id);pts.forEach(p=>p.classList.toggle('on',p.dataset.id===id));
    ro.innerHTML=`<a href="#t-${id.toLowerCase()}">${id}</a> <b>${s.name}</b> · Clarity ${s.r[0]} + Delight ${s.r[1]} = ${s.r[0]+s.r[1]} · MMO fit ${s.r[2]} + Fairness ${s.r[3]} + Speed ${s.r[4]} = ${s.r[2]+s.r[3]+s.r[4]} · sum ${s.sum}`+(NOTE[id]?`<br>${NOTE[id]}`:'');};
  svg.addEventListener('pointerover',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('focusin',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  const FN={A:'Containers, spills',B:'Drop motion',C:'Rarity',D:'Labels, filters',E:'Pickup',F:'Ownership',G:'Netcode, crowds',H:'Death drops'};
  leg.innerHTML=Object.entries(FAMC).map(([k,v])=>`<span><i style="background:${v};height:8px;width:8px;border-radius:50%"></i>${k} ${FN[k]}</span>`).join('');
  show('C2');return {};});

// ======================================================================
// §6d loot costs on a log axis, plus the Canvas 2D rows run on this device
// ======================================================================
const nums2=s=>String(s).split(' / ').map(x=>{const v=parseFloat(x.replace(/[^0-9.]/g,''));return isFinite(v)?v:null;});
// "200 labels, atlas / fillText / glyph blits" -> one label per value; a trailing "(CPU only)" goes to every part
function splitLab(l){l=l.replace(/`/g,'').replace(' (CPU only)',' (CPU)');if(!l.includes(' / '))return [l];let tail='';const m=l.match(/\s*(\([^)]*\))$/);if(m){tail=' '+m[1];l=l.slice(0,m.index);}
  const first=l.indexOf(' / '),cut=l.lastIndexOf(', ',first);const pre=cut>=0?l.slice(0,cut+2):'',rest=cut>=0?l.slice(cut+2):l;return rest.split(' / ').map(p=>pre+p+tail);}
// live keys per expanded bar, in §6d row order (null = not run here)
const LIVE=[['base'],['blit200'],['arc1000'],['halo200'],['blur200'],['beamS','beamG'],['lAtlas','lFill','lGlyph'],['lAtlas1k','lGlyph1k'],['solG','solN'],[null,null],['fly1000'],[null,null],[null,null]];
function liveBench(done){const cv=mkCanvas(320,180),c=cv.getContext('2d'),big=mkCanvas(1280,720),bc=big.getContext('2d');c.imageSmoothingEnabled=false;bc.imageSmoothingEnabled=false;
  const floor=mkField(320,180,3),R=mkRng(5),P=[];for(let i=0;i<1000;i++)P.push([8+R()*304,14+R()*160,(R()*5)|0,ITEM_KINDS[(R()*ITEM_KINDS.length)|0]]);
  const labs=P.map(p=>p[3].toUpperCase()+' '+(p[2]+1)),beamGrad=(x,y)=>{const g=c.createLinearGradient(0,y-48,0,y);g.addColorStop(0,'rgba(255,154,31,0)');g.addColorStop(1,'rgba(255,154,31,.8)');c.fillStyle=g;c.fillRect(x-3,y-48,7,48);};
  for(const p of P){itemImg(p[3],p[2]);}for(let i=0;i<1000;i++)labelImg(labs[i],P[i][2]);
  let ph=0;const solC=[];for(let i=0;i<3000;i++)solC.push({x:R()*320,y:12+R()*168,w:20+((R()*30)|0),h:9,tier:(R()*5)|0});solC.sort((a,b)=>b.tier-a.tier);
  const T={base:()=>{},blit200:()=>{for(let i=0;i<200;i++){const p=P[i];c.drawImage(itemImg(p[3],p[2]),p[0]|0,p[1]|0);}},
    arc1000:()=>{ph+=16;for(let i=0;i<1000;i++){const p=P[i],k=((ph+i*7)%400)/400;drawItem(c,p[3],p[2],p[0],p[1],{h:arcH(k,10)});}},
    halo200:()=>{for(let i=0;i<200;i++){const p=P[i],t=Math.max(2,p[2]);drawHalo(c,p[0],p[1]-5,t,glowA(ph/1000,i));c.drawImage(itemImg(p[3],t),p[0]-6|0,p[1]-11|0);}},
    blur200:()=>{c.save();for(let i=0;i<200;i++){const p=P[i];c.shadowColor=TIERC[Math.max(2,p[2])];c.shadowBlur=6;c.drawImage(itemImg(p[3],p[2]),p[0]-6|0,p[1]-11|0);}c.restore();},
    beamS:()=>{for(let i=0;i<300;i++){const p=P[i];drawBeam(c,p[0],p[1],4,1,.8);}},beamG:()=>{c.save();c.globalCompositeOperation='lighter';for(let i=0;i<300;i++){const p=P[i];beamGrad(p[0]|0,p[1]|0);}c.restore();},
    lAtlas:()=>{for(let i=0;i<200;i++){const p=P[i];c.drawImage(labelImg(labs[i],p[2]).cv,p[0]|0,p[1]|0);}},
    lFill:()=>{c.font='5px monospace';c.textBaseline='top';for(let i=0;i<200;i++){const p=P[i];c.fillStyle='rgba(14,12,22,.88)';c.fillRect(p[0]|0,p[1]|0,40,9);c.fillStyle=TIERC[p[2]];c.fillText(labs[i],(p[0]|0)+2,(p[1]|0)+2);}},
    lGlyph:()=>{for(let i=0;i<200;i++){const p=P[i];c.fillStyle='rgba(14,12,22,.88)';c.fillRect(p[0]|0,p[1]|0,40,9);drawText(c,labs[i],(p[0]|0)+2,(p[1]|0)+2,TIERC[p[2]],FONT_S);}},
    lAtlas1k:()=>{for(let i=0;i<1000;i++){const p=P[i];c.drawImage(labelImg(labs[i],p[2]).cv,p[0]|0,p[1]|0);}},
    lGlyph1k:()=>{for(let i=0;i<1000;i++){const p=P[i];c.fillStyle='rgba(14,12,22,.88)';c.fillRect(p[0]|0,p[1]|0,40,9);drawText(c,labs[i],(p[0]|0)+2,(p[1]|0)+2,TIERC[p[2]],FONT_S);}},
    fly1000:()=>{ph+=16;for(let i=0;i<1000;i++){const p=P[i],k=easeIO(((ph+i*5)%250)/250);c.drawImage(itemImg(p[3],p[2]),lerp(p[0],300,k)|0,lerp(p[1],170,k)|0);}}};
  const CPU={solG:()=>solveLabels(solC,{grid:true}),solN:()=>solveLabels(solC,{grid:false})};
  const keys=Object.keys(T).concat(Object.keys(CPU)),out={};let k=0;
  const runOne=()=>{if(k>=keys.length){done(out);return;}const key=keys[k];
    if(CPU[key]){for(let i=0;i<3;i++)CPU[key]();const N=12,t0=performance.now();for(let i=0;i<N;i++)CPU[key]();out[key]=(performance.now()-t0)/N;k++;setTimeout(runOne,16);return;}
    const fn=T[key],frameOnce=()=>{c.drawImage(floor,0,0);fn();bc.drawImage(cv,0,0,1280,720);bc.getImageData(0,0,1,1);};
    for(let i=0;i<5;i++)frameOnce();const N=key==='blur200'?10:30,t0=performance.now();for(let i=0;i<N;i++)frameOnce();out[key]=(performance.now()-t0)/N;k++;setTimeout(runOne,16);};
  setTimeout(runOne,30);}
reg('costs',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);let mine=null,busy=false;
  const KC={gpu:'#ff9a1f',thr:'#f2c14e',sw:'#857d92',you:'#4ce04c'};const CK=['','gpu','thr','sw'];
  const rows6=T6['6d'];const BARS=[];
  rows6.forEach((r,i)=>{const labs=splitLab(r[0]);labs.forEach((l,j)=>BARS.push({lab:l,cpu:/CPU only/.test(r[0]),vals:[1,2,3].map(ci=>nums2(r[ci])[labs.length>1?j:0]),live:(LIVE[i]||[])[j]||null,prof:r[4]}));});
  c.seg('col',draw);c.on('sub',draw);
  c.btn('run',b=>{if(busy)return;busy=true;b.textContent='Running…';liveBench(o=>{mine=o;busy=false;b.textContent='Run again on this device';draw();});});
  const fmt=v=>v>=10?v.toFixed(1):v>=1?v.toFixed(2):v>=.01?v.toFixed(3):v.toFixed(4);
  function draw(){const ci=+c.segv('col'),sub=c.v('sub');svg.innerHTML='';const baseC=BARS[0].vals[ci-1],baseMine=mine?mine.base:0;
    const rows=BARS.map((b,i)=>{let v=b.vals[ci-1];const isBase=i===0;if(sub&&!isBase&&!b.cpu&&v!=null)v=Math.max(.01,v-baseC);let y;if(mine)y=b.live?mine[b.live]:null;if(y!=null&&sub&&!isBase&&!b.cpu)y=Math.max(.001,y-baseMine);
      return {lab:b.lab,v:sub&&isBase?null:v,you:mine?(sub&&isBase?undefined:y):undefined,base:isBase};});
    const nar=svg.getBoundingClientRect().width<520,LO=-2,HI=2.5,VW=nar?360:600,x0=nar?14:280,x1=nar?334:586,y0=44,rh=nar?(mine?42:34):(mine?26:20),by=nar?14:0,n=rows.length;
    const hgt=y0+n*rh+34;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);const X=v=>x0+(Math.log10(Math.max(10**LO,v))-LO)/(HI-LO)*(x1-x0),yb=y0+n*rh;
    for(let e=LO;e<=2;e++){const v=10**e;svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:yb,class:'gl'},svg);svgText(svg,X(v),yb+13,v>=1?String(v):String(v).replace(/^0/,''),{'text-anchor':'middle','font-size':10});}
    svgText(svg,x1,yb+27,'ms per frame (log scale)',{'text-anchor':'end','font-size':10.5});
    svgEl('line',{x1:X(16.7),x2:X(16.7),y1:y0-22,y2:yb,stroke:'#ff6b5e','stroke-width':1.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(16.7)-4,y0-12,'16.7 ms frame',{'text-anchor':'end','font-size':10.5,fill:'#ff8f80'});
    rows.forEach((r,i)=>{let y=y0+i*rh;svgText(svg,6,y+10,r.lab,{class:'lab','font-size':nar?10.5:11});y+=by;const bh=nar?9:10;
      if(r.v===null)svgText(svg,x0+4,y+9,'subtracted',{'font-size':9.5,fill:'#857d92'});
      else{svgEl('rect',{x:x0,y:y+1,width:Math.max(1.5,X(r.v)-x0),height:bh,fill:KC[CK[ci]],rx:1},svg);const tx=X(r.v)+4,end=tx>x1-36;svgText(svg,end?X(r.v)-4:tx,y+bh,fmt(r.v),{'font-size':9.5,class:'v','text-anchor':end?'end':'start',...(end?{fill:'#15121b'}:{})});}
      if(r.you!==undefined){const yy=y+bh+3;if(r.you===null)svgText(svg,x0+4,yy+7,'not run here',{'font-size':9,fill:'#857d92'});
        else{svgEl('rect',{x:x0,y:yy,width:Math.max(1.5,X(r.you)-x0),height:6,fill:KC.you,rx:1},svg);const tx=X(r.you)+4,end=tx>x1-60;svgText(svg,end?X(r.you)-4:tx,yy+6,fmt(r.you)+' here',{'font-size':9,'text-anchor':end?'end':'start',fill:end?'#15121b':'#4ce04c'});}}});
    leg.innerHTML=`<span><i style="background:${KC[CK[ci]]}"></i>${['','M4 GPU','M4, 6x CPU throttle','SwiftShader (software)'][ci]}, measured [S5]</span>`+(mine?'<span><i style="background:#4ce04c"></i>this device now, Canvas 2D in this page</span>':'')+'<span><i style="background:#ff6b5e"></i>16.7 ms frame</span>';
    const g=k=>BARS.find(b=>b.lab.startsWith(k));const h=g('200 glows, pre').vals[ci-1],bl=g('200 glows, `shadowBlur`')||g('200 glows, shadowBlur');const blv=bl.vals[ci-1],la=g('1000 labels, atlas').vals[ci-1],lg=g('1000 labels, glyph').vals[ci-1];
    let note=`200 glows: halo sprite <b>${fmt(h)} ms</b> against shadowBlur <b>${fmt(blv)} ms</b> · 1000 labels: atlas <b>${fmt(la)} ms</b> against glyph blits <b>${fmt(lg)} ms</b>${ci===3?' · software GL: compare within this column only':''}`;
    if(mine)note+=`<br>Here: halo ${fmt(mine.halo200)} ms against shadowBlur ${fmt(mine.blur200)} ms, ${(mine.blur200/Math.max(1e-3,mine.halo200)).toFixed(1)}× · 1000 labels atlas ${fmt(mine.lAtlas1k)} ms against glyphs ${fmt(mine.lGlyph1k)} ms · solver grid ${fmt(mine.solG)} ms against naive ${fmt(mine.solN)} ms.`;
    ro.innerHTML=note+' · <span class="mute">Coloured bars: our benchmark [S5].</span>';}
  draw();return {};});

// ======================================================================
// §7 architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});
}
