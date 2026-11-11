// Combat juice study: figures 3 (costs, score, matrix, stack). Helpers and sprites live in core.js.
{
const FAMC={A:'#ec7a5c',B:'#f2c14e',C:'#9fd3c7',D:'#7fb0ff',E:'#e0734f',F:'#a6d96a',G:'#d7a2e8',H:'#f3eef5'};
const RL=['Impact','Clarity','MMO fit','Fairness','Speed'];
// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#211c29','#3a2e44','#6a4a4a','#b8703e','#f2c14e'];const SC=['#f2c14e','#9fd3c7','#ec7a5c'];
  let sel=['B2','H5','D3'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Impact','Clarity','MMO','Fair','Speed'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
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
// §5 feel against cost: Impact + Clarity across, MMO fit + Fairness + Speed up
// ======================================================================
reg('matrix',root=>{const svg=$('svg',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const NOTE={B2:'100 flashing sprites cost 0.75 ms pre-baked against 0.74 ms for none (§6d).',H5:'a 2-frame flash, a squash and a corpse at about 133 ms, readable for everyone.',
    D3:'the lowest sum, 17, because in PvP a lock trades the "aimed can miss" contract for comfort.',B1:'22, not higher, because crowds force it short.',B3:'real knockback in PvP is crowd control, so Fairness drops to 3.',
    C1:'1000 live numbers by glyph blits cost 13.18 ms under a 6x CPU throttle (§6d).',F4:'per-entity events avoid tick jitter but cost a scheduler.',A3:'layers multiply draws in a crowd.',B4:'2000 particles cost 1.02 ms with fillRect on the M4 (§6d).',
    G2:'invisible as feel, but PvP needs it.',A1:'weight from holds, safe on a shared screen.'};
  const nar=svg.getBoundingClientRect().width<520,VW=nar?380:600,H=320;svg.setAttribute('viewBox',`0 0 ${VW} ${H}`);const L=44,Rr=VW-12,T=22,B=262,X0=3.5,X1=10.5,Y0=10.5,Y1=15.5,X=v=>L+(v-X0)/(X1-X0)*(Rr-L),Y=v=>B-(v-Y0)/(Y1-Y0)*(B-T);
  const zone=(x0,x1,y0,y1,fill,label,anchor,ly)=>{svgEl('rect',{x:X(x0),y:Y(y1),width:X(x1)-X(x0),height:Y(y0)-Y(y1),fill,opacity:.12},svg);svgText(svg,anchor==='end'?X(x1)-5:X(x0)+5,ly==='top'?Y(y1)+14:Y(y0)-6,label,{'font-size':11,'text-anchor':anchor||'start',fill:'#c4bccc'});};
  zone(8.5,10.5,14.5,15.5,'#a6d96a','build first','end','top');zone(3.5,10.5,10.5,12.5,'#e0734f','unfair or costly in a crowd','start');
  for(let v=11;v<=15;v++){svgEl('line',{x1:L,x2:Rr,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-6,Y(v)+4,String(v),{'text-anchor':'end','font-size':11});}
  for(let v=4;v<=10;v++)svgText(svg,X(v),B+15,String(v),{'text-anchor':'middle','font-size':11});
  svgText(svg,(L+Rr)/2,B+32,'Impact + Clarity (feel) →',{'text-anchor':'middle','font-size':11,class:'lab'});
  svgText(svg,12,(T+B)/2,'MMO fit + Fairness + Speed →',{'text-anchor':'middle','font-size':11,class:'lab',transform:`rotate(-90 12 ${(T+B)/2})`});
  const cells={};SCORE.forEach(s=>{const k=(s.r[0]+s.r[1])+':'+(s.r[2]+s.r[3]+s.r[4]);(cells[k]=cells[k]||[]).push(s);});const pts=[];
  for(const k in cells){const list=cells[k],[fx,cy0]=k.split(':').map(Number),n=list.length,cols=Math.min(n,n>6?5:3),rowsN=Math.ceil(n/cols),dx=nar?8:12,dy=nar?8:10;
    list.forEach((s,j)=>{const col=j%cols,row=Math.floor(j/cols),cx=X(fx)+(col-(cols-1)/2)*dx,cy=Y(cy0)+(row-(rowsN-1)/2)*dy;
      const g=svgEl('g',{class:'pt',tabindex:0,'data-id':s.id,role:'button','aria-label':`${s.id} ${s.name}`},svg);
      svgEl('circle',{cx,cy,r:nar?3.4:4.6,fill:FAMC[s.id[0]],stroke:'#15121b','stroke-width':1},g);pts.push(g);});}
  const show=id=>{const s=SCORE.find(x=>x.id===id);pts.forEach(p=>p.classList.toggle('on',p.dataset.id===id));
    ro.innerHTML=`<a href="#t-${id.toLowerCase()}">${id}</a> <b>${s.name}</b> · feel ${s.r[0]}+${s.r[1]} = ${s.r[0]+s.r[1]} · MMO fit ${s.r[2]} + Fairness ${s.r[3]} + Speed ${s.r[4]} = ${s.r[2]+s.r[3]+s.r[4]} · sum ${s.sum}`+(NOTE[id]?`<br>${NOTE[id]}`:'');};
  svg.addEventListener('pointerover',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('focusin',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  const FN={A:'Attack animation',B:'Impact, camera',C:'Combat text',D:'Targeting',E:'Telegraphs, aim',F:'Netcode, crowds',G:'Queues, PvP',H:'Audio, death'};
  leg.innerHTML=Object.entries(FAMC).map(([k,v])=>`<span><i style="background:${v};height:8px;width:8px;border-radius:50%"></i>${k} ${FN[k]}</span>`).join('');
  show('B2');return {};});

// ======================================================================
// §6d juice costs on a log axis, plus the Canvas 2D rows run on this device
// ======================================================================
const nums2=s=>String(s).split(' / ').map(x=>{const v=parseFloat(x.replace(/[^0-9.]/g,''));return isFinite(v)?v:null;});
function splitLab(l){const m=l.match(/^(.*?)(\S+) \/ (\S+)(.*)$/);return m?[m[1]+m[2]+m[4],m[1]+m[3]+m[4]]:[l];}
// live keys per expanded bar (null = WebGL, not run here)
const LIVE=[['base',null],['n1000'],['n100'],[null],[null],['pfill','pimg'],[null],['fbake','fatop'],[null],['shk0','shk1'],[null,null]];
function liveBench(done){const cv=mkCanvas(320,180),c=cv.getContext('2d'),big=mkCanvas(1280,720),bc=big.getContext('2d');c.imageSmoothingEnabled=false;bc.imageSmoothingEnabled=false;
  const img=unitImg('goblin',0,'idle'),sil=unitSil('goblin',0,'idle','#ffffff'),tmp=mkCanvas(12,12),tc=tmp.getContext('2d'),dot=mkCanvas(2,2);dot.getContext('2d').fillStyle='#ffd23a';dot.getContext('2d').fillRect(0,0,2,2);
  const sprites=()=>{for(let i=0;i<100;i++)c.drawImage(img,(i%20)*16,((i/20)|0)*20+40);};
  const T={base:()=>{},n1000:()=>{for(let i=0;i<1000;i++)drawText(c,String(100+i%900),(i*13)%300,((i/23)|0)%170,NUMC.phys);},n100:()=>{for(let i=0;i<100;i++)drawText(c,String(1000+i*7),(i*29)%300,((i/10)|0)*17,NUMC.phys);},
    pfill:()=>{c.fillStyle='#ffd23a';for(let i=0;i<2000;i++)c.fillRect((i*37)%320,(i*53)%180,2,2);},pimg:()=>{for(let i=0;i<2000;i++)c.drawImage(dot,(i*37)%320,(i*53)%180);},
    fbake:()=>{for(let i=0;i<100;i++){const x=(i%20)*16,y=((i/20)|0)*20+40;c.drawImage(img,x,y);c.globalAlpha=.6;c.drawImage(sil,x,y);c.globalAlpha=1;}},
    fatop:()=>{for(let i=0;i<100;i++){tc.globalCompositeOperation='source-over';tc.clearRect(0,0,12,12);tc.drawImage(img,0,0);tc.globalCompositeOperation='source-atop';tc.fillStyle='rgba(255,255,255,.6)';tc.fillRect(0,0,12,12);c.drawImage(tmp,(i%20)*16,((i/20)|0)*20+40);}},
    shk0:()=>{sprites();},shk1:()=>{c.setTransform(1,0,0,1,Math.round(Math.random()*4-2),Math.round(Math.random()*2-1));sprites();c.setTransform(1,0,0,1,0,0);}};
  const keys=Object.keys(T),out={};let k=0;
  const runOne=()=>{if(k>=keys.length){done(out);return;}const fn=T[keys[k]];
    const frameOnce=()=>{c.fillStyle=CB.floor;c.fillRect(0,0,320,180);fn();bc.drawImage(cv,0,0,1280,720);bc.getImageData(0,0,1,1);};
    for(let i=0;i<5;i++)frameOnce();const N=30,t0=performance.now();for(let i=0;i<N;i++)frameOnce();out[keys[k]]=(performance.now()-t0)/N;k++;setTimeout(runOne,16);};
  setTimeout(runOne,30);}
reg('costs',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);let mine=null,busy=false;
  const KC={gpu:'#ec7a5c',thr:'#f2c14e',sw:'#857d92',you:'#a6d96a'};const CK=['','gpu','thr','sw'];
  const rows6=T6['6d'].filter(r=>!/Audio/.test(r[0]));const BARS=[];
  rows6.forEach((r,i)=>{const labs=splitLab(r[0].replace(/`/g,''));labs.forEach((l,j)=>BARS.push({lab:l,gl:/WebGL/.test(l)||/WebGL2/.test(r[0])&&j===1&&i===0,vals:[1,2,3].map(ci=>nums2(r[ci])[labs.length>1?j:0]),live:(LIVE[i]||[])[j]||null,prof:r[4]}));});
  BARS.forEach(b=>{if(/WebGL/.test(b.lab))b.gl=true;});
  c.seg('col',draw);c.on('sub',draw);
  c.btn('run',b=>{if(busy)return;busy=true;b.textContent='Running…';liveBench(o=>{mine=o;busy=false;b.textContent='Run again on this device';draw();});});
  const fmt=v=>v>=10?v.toFixed(1):v>=1?v.toFixed(2):v>=.01?v.toFixed(3):v.toFixed(4);
  function draw(){const ci=+c.segv('col'),sub=c.v('sub');svg.innerHTML='';const baseC=BARS[0].vals[ci-1],baseG=BARS[1].vals[ci-1],baseMine=mine?mine.base:0;
    const rows=BARS.map((b,i)=>{let v=b.vals[ci-1];const isBase=i<2;if(sub&&!isBase&&v!=null)v=Math.max(.01,v-(b.gl?baseG:baseC));let y;if(mine)y=b.live?mine[b.live]:null;if(y!=null&&sub&&!isBase)y=Math.max(.001,y-baseMine);
      return {lab:b.lab,v:sub&&isBase?null:v,you:mine?(sub&&isBase?undefined:y):undefined,base:isBase};});
    const nar=svg.getBoundingClientRect().width<520,LO=-2,HI=2.5,VW=nar?360:600,x0=nar?14:262,x1=nar?334:586,y0=44,rh=nar?(mine?42:34):(mine?26:20),by=nar?14:0,n=rows.length;
    const hgt=y0+n*rh+34;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);const X=v=>x0+(Math.log10(Math.max(10**LO,v))-LO)/(HI-LO)*(x1-x0),yb=y0+n*rh;
    for(let e=LO;e<=2;e++){const v=10**e;svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:yb,class:'gl'},svg);svgText(svg,X(v),yb+13,v>=1?String(v):String(v).replace(/^0/,''),{'text-anchor':'middle','font-size':10});}
    svgText(svg,x1,yb+27,'ms per frame (log scale)',{'text-anchor':'end','font-size':10.5});
    svgEl('line',{x1:X(16.7),x2:X(16.7),y1:y0-22,y2:yb,stroke:'#ff6b5e','stroke-width':1.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(16.7)-4,y0-12,'16.7 ms frame',{'text-anchor':'end','font-size':10.5,fill:'#ff8f80'});
    rows.forEach((r,i)=>{let y=y0+i*rh;svgText(svg,6,y+10,r.lab,{class:'lab','font-size':nar?10.5:11});y+=by;const bh=nar?9:10;
      if(r.v===null)svgText(svg,x0+4,y+9,'subtracted',{'font-size':9.5,fill:'#857d92'});
      else{svgEl('rect',{x:x0,y:y+1,width:Math.max(1.5,X(r.v)-x0),height:bh,fill:KC[CK[ci]],rx:1},svg);const tx=X(r.v)+4,end=tx>x1-36;svgText(svg,end?X(r.v)-4:tx,y+bh,fmt(r.v),{'font-size':9.5,class:'v','text-anchor':end?'end':'start',...(end?{fill:'#15121b'}:{})});}
      if(r.you!==undefined){const yy=y+bh+3;if(r.you===null)svgText(svg,x0+4,yy+7,'not run here (WebGL or cache test)',{'font-size':9,fill:'#857d92'});
        else{svgEl('rect',{x:x0,y:yy,width:Math.max(1.5,X(r.you)-x0),height:6,fill:KC.you,rx:1},svg);const tx=X(r.you)+4,end=tx>x1-60;svgText(svg,end?X(r.you)-4:tx,yy+6,fmt(r.you)+' here',{'font-size':9,'text-anchor':end?'end':'start',fill:end?'#15121b':'#a6d96a'});}}});
    leg.innerHTML=`<span><i style="background:${KC[CK[ci]]}"></i>${['','M4 GPU','M4, 6x CPU throttle','SwiftShader'][ci]}, measured [S4]</span>`+(mine?'<span><i style="background:#a6d96a"></i>this device now, Canvas 2D in this page</span>':'')+'<span><i style="background:#ff6b5e"></i>16.7 ms frame</span>';
    const g=k=>BARS.find(b=>b.lab.startsWith(k));const n1=g('1000 numbers, Canvas2D').vals[ci-1],n2=g('1000 hits aggregated to 100, glyph').vals[ci-1],fa=g('100 flashing sprites, source').vals[ci-1],fb=g('100 flashing sprites, pre').vals[ci-1];
    let note=`1000 numbers <b>${fmt(n1)} ms</b>, aggregated to 100 <b>${fmt(n2)} ms</b> · 100 flashes <b>${fmt(fb)} ms</b> baked against <b>${fmt(fa)} ms</b> with source-atop · audio at 128 hits/s used 3.6% of a core`;
    if(mine)note+=`<br>Here: 1000 numbers ${fmt(mine.n1000)} ms, 100 numbers ${fmt(mine.n100)} ms · flashes ${fmt(mine.fbake)} ms baked against ${fmt(mine.fatop)} ms source-atop, ${(mine.fatop/Math.max(1e-3,mine.fbake)).toFixed(1)}× apart.`;
    ro.innerHTML=note+' · <span class="mute">Coloured bars: our benchmark [S4].</span>';}
  draw();return {};});

// ======================================================================
// §7 architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});
}
