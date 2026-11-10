// Fog study: figures 3 (score, costs, matrix, stack)
{
const FAMC={A:'#c9a2ff',B:'#93a0cc',C:'#cdd3ea',D:'#7fb7c9',E:'#f2b866',F:'#e58a7a',G:'#a6d96a',H:'#d9a3c4'};
// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#1c1e29','#2b2f45','#454c72','#7480b4','#c3cae8'];const RL=['Simplicity','Speed','Pixel taste','Mood','Interactivity'];const SC=['#f2b866','#a9bfe6','#e58a7a'];
  let sel=['B3','C3','F4'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Mood','Interact.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=5?'#151721':'#e7e8ef'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-40 0 ${S+80} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#464c62':'#23263a'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#23263a'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// §6a measured costs on a log axis, plus the CPU rows run on this device
// ======================================================================
const num=s=>{const v=parseFloat(String(s).replace(/[^0-9.]/g,''));return isFinite(v)?v:null;};
// the JS tasks of the CPU table, re-implemented here so the reader can time them
const LIVE={
  'fbm320':()=>{const W=320,H=180,o=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)o[y*W+x]=fbmP(x/24,y/24,4);return o[7];},
  'tab2':()=>{const W=320,H=180,o=new Uint8Array(W*H),T=mkTable.cache||(mkTable.cache=mkTable(128,1,4,4));for(let y=0;y<H;y++)for(let x=0;x<W;x++)o[y*W+x]=(tabAt(T,128,x+17,y)*.6+tabAt(T,128,(x>>1)+5,(y>>1)+9)*.4)*255;return o[9];},
  'grid80':()=>gridStep(80,45),'grid320':()=>gridStep(320,180),
  'bayer':()=>{const W=320,H=180,o=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=((x*7+y*3)&255)/255*3;o[y*W+x]=Math.min(3,Math.floor(v)+((v%1)*16>bay(x,y)?1:0));}return o[3];},
  'blur':()=>{const W=320,H=180,a=new Uint8Array(W*H),b=new Uint8Array(W*H);for(let i=0;i<a.length;i++)a[i]=(i*31)&255;for(let y=0;y<H;y++)for(let x=1;x<W-1;x++){const i=y*W+x;b[i]=(a[i-1]+a[i]+a[i+1])/3;}for(let y=1;y<H-1;y++)for(let x=0;x<W;x++){const i=y*W+x;a[i]=(b[i-W]+b[i]+b[i+W])/3;}return a[5];}};
const GS={};function gridStep(GW,GH){const k=GW+'x'+GH;const g=GS[k]||(GS[k]={F:new Float32Array(GW*GH).map((_,i)=>(i%7)/7),G:new Float32Array(GW*GH)});const F=g.F,G=g.G;
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x,sx=clamp(x-.3,0,GW-1.001),sy=clamp(y-.1,0,GH-1.001),x0=sx|0,y0=sy|0,tx=sx-x0,ty=sy-y0,j=y0*GW+x0;
    const up=(F[j]*(1-tx)+F[Math.min(j+1,F.length-1)]*tx)*(1-ty)+(F[Math.min(j+GW,F.length-1)]*(1-tx)+F[Math.min(j+GW+1,F.length-1)]*tx)*ty;
    const avg=(F[y>0?i-GW:i]+F[y<GH-1?i+GW:i]+F[x>0?i-1:i]+F[x<GW-1?i+1:i])/4;G[i]=lerp(up,avg,.2)*.998;}g.F=G;g.G=F;return G[1];}
const LIVEKEY=['fbm320',null,'tab2','grid80','grid320','bayer','blur',null];
reg('costs',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);const mine={};let busy=false;
  const KC={tex:'#93a0cc',math:'#f2b866',rays:'#e58a7a',ref:'#6b7088',cpu:'#a9bfe6',you:'#a6d96a',full:'#e58a7a',naive:'#f2b866',d1:'#93a0cc',d2:'#a6d96a'};
  const kindOf=p=>/F4/.test(p)?'rays':/procedural|none/.test(p)?'math':/reference/.test(p)?'ref':'tex';
  c.seg('v',v=>{$$('[data-for]',root).forEach(e=>e.hidden=e.dataset.for!==v);draw();});c.seg('res',draw);c.seg('rad',draw);c.on('thr',draw);
  c.btn('run',b=>{if(busy)return;busy=true;b.textContent='Running…';setTimeout(()=>{LIVEKEY.forEach((k,i)=>{if(!k)return;LIVE[k]();const n=k==='grid80'?40:k==='fbm320'?3:8;const t0=performance.now();for(let r=0;r<n;r++)LIVE[k]();mine[i]=(performance.now()-t0)/n;});
    busy=false;b.textContent='Run again on this device';draw();},30);});
  const fmt=v=>v>=10?v.toFixed(1):v>=1?v.toFixed(2):v>=.01?v.toFixed(3):v.toFixed(4);
  function draw(){const view=c.segv('v');svg.innerHTML='';let rows=[],note='',legend=[];
    if(view==='gpu'){const ri=+c.segv('res');rows=T6.gpu.map(r=>({lab:r[0],sub:'profiles: '+r[5],v:num(r[ri]),k:kindOf(r[5])}));
      legend=[['tex','texture reads'],['math','per-pixel maths'],['rays','radial blur'],['ref','flat colour floor']];
      const top=rows.filter(r=>r.v!==null).sort((a,b)=>b.v-a.v)[0];
      note=`Dearest pass at ${['','320×180','720p','1080p','720p on SwiftShader'][ri]}: <b>${top.lab}</b>, ${fmt(top.v)} ms, ${(top.v/16.7*100).toFixed(top.v<.1?2:1)}% of a 16.7 ms frame.`+(ri===4?' Software GL ranks texture reads above maths; rank by the real GPU.':ri===1?' At native resolution the GPU is idle.':'');}
    else if(view==='cpu'){const thr=c.v('thr');rows=T6.cpu.map((r,i)=>({lab:r[0],sub:r[1]+' · profiles: '+r[4],v:num(thr?r[3]:r[2]),k:'cpu',you:mine[i]}));
      legend=[['cpu',thr?'M4 Pro, 6x throttle':'M4 Pro'],['you','this device, now']];
      const fbm=rows[1].v;note=`Per-pixel fbm at 1280×720 costs <b>${fmt(fbm||0)} ms</b>${thr?' throttled':''}${fbm>16.7?', more than the whole frame':''}. Grid, Bayer and upload together stay near 0.26 ms, about 1.5 ms throttled (§6a).`;
      if(Object.keys(mine).length){const r=mine[3]/num(T6.cpu[3][2]);note+=` On this device the 80×45 grid step took <b>${fmt(mine[3])} ms</b>, ${r.toFixed(1)}× the M4.`;}}
    else{const R=c.segv('rad');const sub=T6.fow.filter(r=>r[1]===R);
      sub.forEach(r=>{[['full','Full recompute',2],['naive','Naive re-stamp, all move',3],['d1','Delta edge, all move',4],['d2','Delta edge, 10% move',5]].forEach(([k,l,ci],j)=>rows.push({lab:j===0?r[0]+' units':'',sub:l,v:num(r[ci]),k,grp:j}));});
      legend=[['full','full recompute'],['naive','naive re-stamp'],['d1','delta, all move'],['d2','delta, 10% move']];
      const big=sub[sub.length-1];note=`1000 units at radius ${R}: delta stamping <b>${big[4]} ms</b> against a full recompute ${big[2]} ms and a naive re-stamp ${big[3]} ms. Full recompute with the 6x throttle: ${big[6]} ms.`;}
    const nar=svg.getBoundingClientRect().width<520,LO=-4,HI=2,VW=nar?360:600,x0=nar?18:view==='fow'?190:238,x1=nar?330:588,y0=40,rh=nar?(view==='cpu'?44:view==='fow'?24:27):view==='fow'?15:view==='cpu'?34:18,n=rows.length,gap=view==='fow'?8:0,by=nar?14:0;
    const hgt=y0+n*rh+Math.floor(n/4)*gap+36;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);
    const X=v=>x0+(Math.log10(Math.max(1e-4,v))-LO)/(HI-LO)*(x1-x0),yb=y0+n*rh+Math.floor(n/4)*gap;
    for(let e=LO;e<=HI;e++){const v=10**e;svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:yb,class:'gl'},svg);svgText(svg,X(v),yb+13,v>=1?String(v):String(v).replace(/^0/,''),{'text-anchor':'middle','font-size':10});}
    svgText(svg,x1,yb+27,view==='gpu'?'ms per full-screen pass (log scale)':'ms per call (log scale)',{'text-anchor':'end','font-size':10.5});
    const ln=(v,t,col,dy)=>{svgEl('line',{x1:X(v),x2:X(v),y1:y0-8-dy,y2:yb,stroke:col,'stroke-width':1.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(v)-4,y0-10-dy,t,{'text-anchor':'end','font-size':10.5,fill:col});};
    ln(2,'2 ms fog budget','#a7b0da',0);ln(16.7,'16.7 ms frame','#ff6b5e',14);
    rows.forEach((r,i)=>{let y=y0+i*rh+(view==='fow'?Math.floor(i/4)*gap:0);
      if(nar){svgText(svg,8,y+10,view==='fow'?(r.lab?r.lab+' · ':'')+r.sub:r.lab,{class:'lab','font-size':11});if(view==='cpu')svgText(svg,8,y+36,r.sub,{'font-size':9.5});}
      else if(view==='fow'){if(r.lab)svgText(svg,8,y+10,r.lab,{class:'lab','font-size':11.5});svgText(svg,x0-6,y+9,r.sub,{'font-size':9.5,'text-anchor':'end'});}
      else{svgText(svg,8,y+(view==='cpu'?11:10.5),r.lab,{class:'lab','font-size':11.5});if(view==='cpu')svgText(svg,8,y+24,r.sub,{'font-size':9.5});}
      const bh=view==='cpu'?9:10;const y_=y;y+=by;
      if(r.v===null){svgText(svg,x0+4,y+9,'not measured',{'font-size':9.5,fill:'#6b7088'});}
      else{svgEl('rect',{x:x0,y:y+1,width:Math.max(1.5,X(r.v)-x0),height:bh,fill:KC[r.k],rx:1},svg);
        const tx=X(r.v)+4,end=tx>x1-34;svgText(svg,end?X(r.v)-4:tx,y+bh,fmt(r.v),{'font-size':9.5,class:'v','text-anchor':end?'end':'start',...(end?{fill:'#151721'}:{})});}
      if(r.you!==undefined){const yy=y+bh+3;svgEl('rect',{x:x0,y:yy,width:Math.max(1.5,X(r.you)-x0),height:7,fill:KC.you,rx:1},svg);const tx=X(r.you)+4,end=tx>x1-34;svgText(svg,end?X(r.you)-4:tx,yy+7,fmt(r.you)+' here',{'font-size':9,'text-anchor':end?'end':'start',fill:end?'#151721':'#a6d96a'});}
      else if(view==='cpu'&&LIVEKEY[i]===null&&Object.keys(mine).length)svgText(svg,x0+4,y+bh+10,'not run here',{'font-size':9,fill:'#6b7088'});});
    leg.innerHTML=legend.map(([k,l])=>`<span><i style="background:${KC[k]}"></i>${l}</span>`).join('')+'<span><i style="background:#a7b0da"></i>2 ms fog budget</span><span><i style="background:#ff6b5e"></i>16.7 ms frame</span>';
    ro.innerHTML=note+' <span class="mute">Source: our benchmark [S10], Apple M4 Pro, Chromium 153.</span>';}
  draw();return {};});

// ======================================================================
// §6b pretty vs cheap: scatter of all profiles, Speed by Taste + Mood
// ======================================================================
reg('matrix',root=>{const svg=$('svg',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const NOTE={F4:'0.141 ms at 720p and 18.0 ms on SwiftShader, plus a screen copy (§6b).',B2:'texture warp 0.014 ms at 720p; the full procedural two-level warp about 0.33 ms (§6b).',
    B4:'80×45 grid step 0.060 ms in JS, 0.34 ms throttled (§6a).',E5:'server line of sight, the real fog-of-war cost (§6b).',C3:'cheap and ugly: off-palette colours, worst as a neutral grey quad.',
    A4:'additive screen fog greys night scenes.',C4:'animated blue noise shimmers.',B3:'one height fetch plus exp: 0.013 ms at 720p.',C2:'one table read inside 0.016 ms at 720p.',E4:'memory and reveal, the top sum at 23.'};
  const nar=svg.getBoundingClientRect().width<520,VWm=nar?380:600;svg.setAttribute('viewBox',`0 0 ${VWm} 300`);const W=VWm,H=300,L=40,Rr=VWm-10,T=24,B=250,X=v=>L+(v-1.5)/9*(Rr-L),Y=s=>T+(5.5-s)/4*(B-T);
  // zones
  const zone=(x0,x1,s0,s1,fill,label,anchor)=>{svgEl('rect',{x:X(x0),y:Y(s1),width:X(x1)-X(x0),height:Y(s0)-Y(s1),fill,opacity:.13},svg);svgText(svg,anchor==='end'?X(x1)-4:X(x0)+4,Y(s0)-5,label,{'font-size':11,'text-anchor':anchor||'start',fill:'#b9bdcc'});};
  zone(1.5,5.5,4.5,5.5,'#e58a7a','cheap but ugly');zone(9.5,10.5,4.5,5.5,'#a6d96a','pretty and cheap','end');zone(7.5,10.5,1.5,4.5,'#f2b866','pretty but expensive','end');
  for(let s=2;s<=5;s++){svgEl('line',{x1:L,x2:Rr,y1:Y(s),y2:Y(s),class:'gl'},svg);svgText(svg,L-6,Y(s)+4,String(s),{'text-anchor':'end','font-size':11});}
  for(let v=2;v<=10;v++){svgText(svg,X(v),B+14,String(v),{'text-anchor':'middle','font-size':11});}
  svgText(svg,(L+Rr)/2,B+30,'Pixel taste + Mood →',{'text-anchor':'middle','font-size':11,class:'lab'});
  const yl=svgText(svg,12,(T+B)/2,'Speed →',{'text-anchor':'middle','font-size':11,class:'lab',transform:`rotate(-90 12 ${(T+B)/2})`});
  // ghost marks: costs with no profile at Speed 2
  (nar?[['warp',2.2],['Stam',4.6],['CPU fbm',7]]:[['procedural warp, 720p',2],['Stam solver',5],['CPU fbm, 720p',7]]).forEach(([t,x])=>{svgEl('circle',{cx:X(x),cy:Y(2),r:5,fill:'none',stroke:'#6b7088','stroke-dasharray':'2 2'},svg);svgText(svg,X(x)+8,Y(2)+4,t,{'font-size':10.5,fill:'#9ca1b4'});});
  // pack dots per cell
  const cells={};SCORE.forEach(s=>{const k=s.r[1]+':'+(s.r[2]+s.r[3]);(cells[k]=cells[k]||[]).push(s);});
  const pts=[];
  for(const k in cells){const list=cells[k],[sp,tm]=k.split(':').map(Number),n=list.length,cols=Math.min(n,n>8?6:4),rowsN=Math.ceil(n/cols),dx=nar?6.4:9.6,dy=nar?8:10;
    list.forEach((s,j)=>{const col=j%cols,row=Math.floor(j/cols),cx=X(tm)+(col-(cols-1)/2)*dx,cy=Y(sp)+(row-(rowsN-1)/2)*dy;
      const g=svgEl('g',{class:'pt',tabindex:0,'data-id':s.id,role:'button','aria-label':`${s.id} ${s.name}`},svg);
      svgEl('circle',{cx,cy,r:nar?3:4.2,fill:FAMC[s.id[0]],stroke:'#151721','stroke-width':1},g);pts.push(g);});}
  const show=id=>{const s=SCORE.find(x=>x.id===id);pts.forEach(p=>p.classList.toggle('on',p.dataset.id===id));
    ro.innerHTML=`<a href="#t-${id.toLowerCase()}">${id}</a> <b>${s.name}</b> · Speed ${s.r[1]} · taste ${s.r[2]} + mood ${s.r[3]} = ${s.r[2]+s.r[3]} · simplicity ${s.r[0]} · interactivity ${s.r[4]} · sum ${s.sum}`+(NOTE[id]?`<br>${NOTE[id]}`:'');};
  svg.addEventListener('pointerover',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('focusin',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  leg.innerHTML=Object.entries(FAMC).map(([k,v])=>`<span><i style="background:${v};height:8px;width:8px;border-radius:50%"></i>${k}</span>`).join('');
  show('B3');return {};});

// ======================================================================
// §7 architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});
}
