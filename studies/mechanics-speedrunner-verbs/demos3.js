// SpeedRunner verbs study (Mechanics #2): figures 3 (score, matrix, dashchart, budgetchart, stack). Helpers live in core.js (SR).
{
const FAMC={A:'#d0281f',B:'#e08a3c',C:'#c9a227',D:'#1f8a3a',E:'#2458c9',F:'#7a4fd6',G:'#c04f9a',H:'#6b6b6b'};
const FN={A:'Dash and air verbs',B:'Ground and body verbs',C:'Wall and ledge verbs',D:'Rope, hook and flight',E:'Physics-input verbs',F:'Katana verbs',G:'Kits, items and placing',H:'Budget, inputs, determinism'};
const RL=['Feel','Readability','Run fit','Cheapness','Evidence'];
// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#211c29','#3a2e44','#6a4a4a','#b8703e','#f2c14e'];const SC=['#f2c14e','#9fd3c7','#ec7a5c'];
  let sel=['C1','F2','A1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Verb</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Feel','Read.','Run fit','Cheap','Evid.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
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
// §5 feel against cost: Feel + Readability + Run fit across, Cheapness + Evidence up
// ======================================================================
reg('matrix',root=>{const svg=$('svg',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const NOTE={C1:'automatic, no input: the lip death A2 named goes away for about 30 lines.',G1:'a verbs mask per map header keeps the four shipped boards valid on the day any verb ships.',
    B2:'one friction constant and the hyper pair already in the game; the slide-jump and the roll-jump hyper are one rule.',F2:'the katana’s first job in a run; reuses the slash box and the stomp bounce, spikes become steps.',
    F3:'no state of its own: 50 u of box and 4 active steps against a 600 u/s shot is a 14-step window for free.',H1:'three buttons, fifteen verbs, nine of them context verbs.',
    E5:'the comedy map stays one unranked map: a learned-once trap is a time attack’s enemy.',D3:'the elastic rope is the most expressive and least readable verb in the set; a reference, not a toggle.',
    E1:'a pointer-driven hammer has no deterministic log to compare; figure only.',E2:'a drawn slope needs a slope engine the game lacks; figure only.',
    A1:'a map rewrite: a 7 to 11 BL dash tier that collapses m1 and m2; a comparison toggle.',F1:'the recommended set’s ceiling, 840 u/s for 12 to 18 steps, one per airtime.'};
  const nar=svg.getBoundingClientRect().width<520,VW=nar?380:600,H=320;svg.setAttribute('viewBox',`0 0 ${VW} ${H}`);const L=44,Rr=VW-12,T=22,B=262,X0=4.5,X1=15.5,Y0=3.5,Y1=10.5,X=v=>L+(v-X0)/(X1-X0)*(Rr-L),Y=v=>B-(v-Y0)/(Y1-Y0)*(B-T);
  const zone=(x0,x1,y0,y1,fill,label,anchor,ly)=>{svgEl('rect',{x:X(x0),y:Y(y1),width:X(x1)-X(x0),height:Y(y0)-Y(y1),fill,opacity:.12},svg);svgText(svg,anchor==='end'?X(x1)-5:X(x0)+5,ly==='top'?Y(y1)+14:Y(y0)-6,label,{'font-size':11,'text-anchor':anchor||'start',fill:'#c4bccc'});};
  zone(12.5,15.5,8.5,10.5,'#4ce04c','recommend first','end','top');zone(4.5,9.5,3.5,6.5,'#e0734f','figure only or unranked','start');
  for(let v=4;v<=10;v++){svgEl('line',{x1:L,x2:Rr,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-6,Y(v)+4,String(v),{'text-anchor':'end','font-size':11});}
  for(let v=5;v<=15;v++)svgText(svg,X(v),B+15,String(v),{'text-anchor':'middle','font-size':11});
  svgText(svg,(L+Rr)/2,B+32,'Feel + Readability + Run fit →',{'text-anchor':'middle','font-size':11,class:'lab'});
  svgText(svg,12,(T+B)/2,'Cheapness + Evidence →',{'text-anchor':'middle','font-size':11,class:'lab',transform:`rotate(-90 12 ${(T+B)/2})`});
  const cells={};SCORE.forEach(s=>{const k=(s.r[0]+s.r[1]+s.r[2])+':'+(s.r[3]+s.r[4]);(cells[k]=cells[k]||[]).push(s);});const pts=[];
  for(const k in cells){const list=cells[k],[fx,cy0]=k.split(':').map(Number),n=list.length,cols=Math.min(n,n>6?5:3),rowsN=Math.ceil(n/cols),dx=nar?8:12,dy=nar?8:10;
    list.forEach((s,j)=>{const col=j%cols,row=Math.floor(j/cols),cx=X(fx)+(col-(cols-1)/2)*dx,cy=Y(cy0)+(row-(rowsN-1)/2)*dy;
      const g=svgEl('g',{class:'pt',tabindex:0,'data-id':s.id,role:'button','aria-label':`${s.id} ${s.name}`},svg);
      svgEl('circle',{cx,cy,r:nar?3.4:4.6,fill:FAMC[s.id[0]],stroke:'#15121b','stroke-width':1},g);pts.push(g);});}
  const show=id=>{const s=SCORE.find(x=>x.id===id);pts.forEach(p=>p.classList.toggle('on',p.dataset.id===id));
    ro.innerHTML=`<a href="#t-${id.toLowerCase()}">${id}</a> <b>${s.name}</b> · Feel ${s.r[0]} + Readability ${s.r[1]} + Run fit ${s.r[2]} = ${s.r[0]+s.r[1]+s.r[2]} · Cheapness ${s.r[3]} + Evidence ${s.r[4]} = ${s.r[3]+s.r[4]} · sum ${s.sum}`+(NOTE[id]?`<br>${NOTE[id]}`:'');};
  svg.addEventListener('pointerover',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('focusin',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  leg.innerHTML=Object.entries(FAMC).map(([k,v])=>`<span><i style="background:${v};height:8px;width:8px;border-radius:50%"></i>${k} ${FN[k]}</span>`).join('');
  show('C1');return {};});

// ======================================================================
// §6a dash numbers: speed multiple across, distance in BL up
// ======================================================================
reg('dashchart',root=>{const svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  // numbers read from the 6a rows (speed multiple, BL low, BL high); null = unpublished
  const NUM={'Celeste':[2.67,3.3,3.3,'V'],'Mega Man X':[2.33,4.5,4.5,'V'],'Hollow Knight':[2.4,4,4,'V'],'Dustforce':[null,null,null,'U'],'Neon White Godspeed':[null,null,null,'U'],'Pizza Tower Mach':[null,null,null,'V'],
    'SpeedRunner Sandbox dash':[2.67,3.65,3.65,'I'],'SpeedRunner dash-slash (recommended)':[2.0,1.8,2.7,'I']};
  const rows=T6['6a'].map(r=>{const k=Object.keys(NUM).find(k=>r[0].startsWith(k));const [sp,lo,hi,kind]=NUM[k]||[null,null,null,'U'];return {name:r[0],sp,lo,hi,kind,dur:r[2],dirs:r[4],refill:r[5],cd:r[6],src:r[7]};});
  const KC={V:'#0a0a0a',I:'#d0281f',U:'#9a9a9a'};
  function draw(){svg.innerHTML='';const nar=svg.getBoundingClientRect().width<520,VW=nar?380:600,H=340;svg.setAttribute('viewBox',`0 0 ${VW} ${H}`);const L=44,Rr=VW-(nar?12:150),T=20,B=250,X=v=>L+(v-1.5)/(3.5-1.5)*(Rr-L),Y=v=>B-v/6*(B-T);
    for(let v=1;v<=6;v++){svgEl('line',{x1:L,x2:Rr,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-6,Y(v)+4,v+' BL',{'text-anchor':'end','font-size':10,fill:'#0a0a0a'});}
    for(let v=1.5;v<=3.5;v+=.5){svgText(svg,X(v),B+14,v.toFixed(1)+'x',{'text-anchor':'middle','font-size':10,fill:'#0a0a0a'});}
    svgText(svg,(L+Rr)/2,B+30,'dash speed as a multiple of run speed →',{'text-anchor':'middle','font-size':10.5,fill:'#0a0a0a'});
    svgText(svg,12,(T+B)/2,'distance per dash, body lengths →',{'text-anchor':'middle','font-size':10.5,fill:'#0a0a0a',transform:`rotate(-90 12 ${(T+B)/2})`});
    // the canon band: 2.3x to 2.7x, 3 to 4 BL
    svgEl('rect',{x:X(2.3),y:Y(4),width:X(2.7)-X(2.3),height:Y(3)-Y(4),fill:'#0a0a0a',opacity:.06},svg);svgText(svg,X(2.7)+4,Y(3)+12,'the canon: 2.3x to 2.7x, 3 to 4 BL',{'font-size':9.5,fill:'#555555'});
    const pts=[];rows.forEach((r,i)=>{if(r.sp==null)return;const g=svgEl('g',{class:'pt',tabindex:0,'data-i':i,role:'button','aria-label':r.name},svg);
      if(r.hi!==r.lo)svgEl('line',{x1:X(r.sp),x2:X(r.sp),y1:Y(r.lo),y2:Y(r.hi),stroke:KC[r.kind],'stroke-width':3,'stroke-linecap':'round'},g);
      svgEl('circle',{cx:X(r.sp),cy:Y(r.hi),r:6,fill:KC[r.kind],stroke:'#ffffff','stroke-width':1.5},g);if(r.hi!==r.lo)svgEl('circle',{cx:X(r.sp),cy:Y(r.lo),r:6,fill:KC[r.kind],stroke:'#ffffff','stroke-width':1.5},g);
      const left=/Hollow|Mega/.test(r.name),dy=/Sandbox/.test(r.name)?-9:/Celeste/.test(r.name)?14:4;svgText(svg,X(r.sp)+(left?-10:10),Y(r.hi)+dy,r.name.replace(' (recommended)','').replace('SpeedRunner ','SR '),{'font-size':10,fill:KC[r.kind],'text-anchor':left?'end':'start'});pts.push(g);});
    // the unpublished rows to the side
    const side=rows.filter(r=>r.sp==null);if(!nar){svgText(svg,Rr+14,T+10,'no usable pair in §6a',{'font-size':10,fill:'#9a9a9a'});side.forEach((r,i)=>svgText(svg,Rr+14,T+28+i*16,r.name.replace(' Godspeed','').replace(' Mach',''),{'font-size':9.5,fill:'#555555'}));}
    else svgText(svg,L,B+46,'unpublished: '+side.map(r=>r.name).join(', '),{'font-size':9.5,fill:'#9a9a9a'});
    const show=i=>{const r=rows[i];pts.forEach(p=>p.classList.toggle('on',+p.dataset.i===i));ro.innerHTML=`<b>${r.name}</b> · ${r.sp!=null?r.sp+'x run, '+(r.lo===r.hi?r.lo:r.lo+' to '+r.hi)+' BL':'no published pair'} · duration ${r.dur} · directions ${r.dirs} · refill ${r.refill} · cooldown ${r.cd} · ${r.src}`;};
    svg.addEventListener('pointerover',e=>{const g=e.target.closest('.pt');if(g)show(+g.dataset.i);});svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)show(+g.dataset.i);});svg.addEventListener('focusin',e=>{const g=e.target.closest('.pt');if(g)show(+g.dataset.i);});
    leg.innerHTML=`<span><i style="background:${KC.V};width:9px;height:9px;border-radius:50%"></i>read from code or docs [V]</span><span><i style="background:${KC.I};width:9px;height:9px;border-radius:50%"></i>SpeedRunner proposal [I]</span><span><i style="background:#0a0a0a;opacity:.15;width:14px;height:9px"></i>the canon band</span>`;
    show(rows.findIndex(r=>r.name.startsWith('SpeedRunner dash-slash')));}
  draw();return {};});

// ======================================================================
// §6e verb budgets: action buttons across, verbs up
// ======================================================================
reg('budgetchart',root=>{const svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const rows=T6['6e'].map(r=>{const m=r[1].match(/^(\d+)/);const verbs=r[2].replace(/\([^)]*\)/g,'').split(/,|;|\bplus\b/).map(s=>s.trim()).filter(Boolean);const extra=(r[2].match(/\(([^)]*)\)/)||[])[1];
    const n=verbs.length+(extra&&/,/.test(extra)?extra.split(',').length:0)+(/the six above/.test(r[2])?5:0);return {name:r[0],btn:m?+m[1]:null,btnTxt:r[1],n,verbs:r[2],ctx:r[3],cats:r[4],src:r[5],sr:/^SpeedRunner/.test(r[0])};});
  function draw(){svg.innerHTML='';const nar=svg.getBoundingClientRect().width<520,VW=nar?380:600,H=340;svg.setAttribute('viewBox',`0 0 ${VW} ${H}`);const L=40,Rr=VW-(nar?12:160),T=20,B=250,X=v=>L+(v-.5)/4.2*(Rr-L),Y=v=>B-v/16*(B-T);
    for(let v=2;v<=16;v+=2){svgEl('line',{x1:L,x2:Rr,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-6,Y(v)+4,String(v),{'text-anchor':'end','font-size':10,fill:'#0a0a0a'});}
    for(let v=1;v<=4;v++)svgText(svg,X(v),B+14,v+(v===1?' button':' buttons'),{'text-anchor':'middle','font-size':10,fill:'#0a0a0a'});
    svgText(svg,12,(T+B)/2,'verbs listed in §6e →',{'text-anchor':'middle','font-size':10.5,fill:'#0a0a0a',transform:`rotate(-90 12 ${(T+B)/2})`});
    svgEl('line',{x1:X(3.5),x2:X(3.5),y1:T,y2:B,stroke:'#d0281f','stroke-width':1.2,'stroke-dasharray':'4 3'},svg);svgText(svg,X(3.5)-4,T+10,'three-button ceiling',{'font-size':9.5,fill:'#d0281f','text-anchor':'end'});
    svgEl('line',{x1:L,x2:Rr,y1:Y(10),y2:Y(10),stroke:'#9a9a9a','stroke-width':1,'stroke-dasharray':'4 3'},svg);svgText(svg,Rr-4,Y(10)-4,'Crawford: fewer than ten verbs',{'font-size':9.5,fill:'#555555','text-anchor':'end'});
    const cells={};rows.forEach((r,i)=>{if(r.btn==null)return;const k=r.btn+':'+r.n;(cells[k]=cells[k]||[]).push(i);});const pts=[];
    for(const k in cells){const list=cells[k];list.forEach((i,j)=>{const r=rows[i],cx=X(r.btn)+(j-(list.length-1)/2)*12,cy=Y(r.n);const g=svgEl('g',{class:'pt',tabindex:0,'data-i':i,role:'button','aria-label':r.name},svg);
      svgEl('circle',{cx,cy,r:6,fill:r.sr?'#d0281f':'#0a0a0a',stroke:'#ffffff','stroke-width':1.5},g);pts.push(g);});
      const lx=X(rows[list[0]].btn)+(list.length-1)*6+10;svgText(svg,list.length>1?X(rows[list[0]].btn)-6:lx,Y(rows[list[0]].n)+(list.length>1?16:4),list.map(i=>rows[i].name.replace('Super ','S. ')).join(', '),{'font-size':9.5,fill:rows[list[0]].sr?'#d0281f':'#0a0a0a'});}
    const side=rows.filter(r=>r.btn==null);if(!nar){svgText(svg,Rr+14,T+10,'no button count',{'font-size':10,fill:'#9a9a9a'});side.forEach((r,i)=>svgText(svg,Rr+14,T+28+i*28,r.name,{'font-size':9.5,fill:'#555555'}));side.forEach((r,i)=>svgText(svg,Rr+14,T+40+i*28,r.n+' verbs, '+(r.btnTxt.length>18?r.btnTxt.slice(0,18)+'…':r.btnTxt),{'font-size':9,fill:'#9a9a9a'}));}
    else svgText(svg,L,B+46,'analog input: '+side.map(r=>r.name).join(', '),{'font-size':9.5,fill:'#9a9a9a'});
    const show=i=>{const r=rows[i];pts.forEach(p=>p.classList.toggle('on',+p.dataset.i===i));ro.innerHTML=`<b>${r.name}</b> · ${r.btnTxt} · <b>${r.n} verbs</b>: ${r.verbs} · context inputs: ${r.ctx} · board: ${r.cats} · ${r.src}`;};
    svg.addEventListener('pointerover',e=>{const g=e.target.closest('.pt');if(g)show(+g.dataset.i);});svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)show(+g.dataset.i);});svg.addEventListener('focusin',e=>{const g=e.target.closest('.pt');if(g)show(+g.dataset.i);});
    leg.innerHTML='<span><i style="background:#0a0a0a;width:9px;height:9px;border-radius:50%"></i>a game in §6e</span><span><i style="background:#d0281f;width:9px;height:9px;border-radius:50%"></i>SpeedRunner today and recommended</span><span><i style="background:#d0281f;width:14px;height:2px"></i>three buttons</span><span><i style="background:#9a9a9a;width:14px;height:2px"></i>ten verbs</span>';
    show(rows.findIndex(r=>r.name==='SpeedRunner recommended'));}
  draw();return {};});

// ======================================================================
// §7 architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-7]||btns[0]);return {};});
}
