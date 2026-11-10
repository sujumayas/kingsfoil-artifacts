// Water study: figures 3 (score, budget, stack)
// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#13222e','#1a3a52','#1f5f80','#2f93b0','#6fe0d2'];const RL=['Simplicity','Speed','Pixel taste','Mood','Interactivity'];const SC=['#6fe0d2','#e8c88a','#ff8f7a'];
  let sel=['A1','E1','G1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Mood','Interact.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#06141c':'#e1eaf1'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-40 0 ${S+80} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#344b5c':'#16222c'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#16222c'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// §6c web budget: cited ms and estimated reads per frame on log axes
// ======================================================================
reg('budget',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root);
  const TC={V:'#6fe0d2',I:'#e8c88a',U:'#c9a2ff'};
  const MS=[{lab:'Distance field, BFS or chamfer',sub:'256×256 tiles, once per map or tide step',lo:null,hi:10,tag:'I',note:'under 10 ms native'},
    {lab:'Godot terrain connect',sub:'per call, large map, user report',lo:4,hi:5,tag:'V',note:'4 to 5 ms'},
    {lab:'Pipe simulation',sub:'200×200, CUDA on a GTX 970',lo:.6,hi:1,tag:'V',note:'0.6 to 1.0 ms'}];
  const PXN=57600;
  const OPS=bake=>[{lab:bake?'Baked distance field':'Distance computed in the shader',sub:bake?'1 fetch per pixel':'about 36 fetches per pixel',lo:null,hi:bake?PXN:PXN*36,tag:bake?'I':'U'},
    {lab:'Depth ramp + foam',sub:'1 to 2 fetches per pixel',lo:PXN,hi:PXN*2,tag:'I'},
    {lab:'Flow map, two-phase',sub:'full-screen river, 3 per pixel',lo:null,hi:173000,tag:'I'},
    {lab:'Pond heightfield',sub:'80×45 cells, reads per step',lo:null,hi:7200,tag:'I'},
    {lab:'Ring and wake pool',sub:'64 slots, one sprite each',lo:null,hi:64,tag:'I'}];
  c.seg('v',draw);c.on('bake',draw);
  const fmt=v=>v>=1e6?(v/1e6).toFixed(2)+'M':v>=1e3?Math.round(v/1e3)+'k':v<1?v.toFixed(1):String(Math.round(v));
  function draw(){const view=c.segv('v'),bake=c.v('bake'),rows=view==='ms'?MS:OPS(bake);svg.innerHTML='';
    const LO=view==='ms'?Math.log10(.1):Math.log10(10),HI=view==='ms'?Math.log10(40):Math.log10(5e6),x0=196,x1=430,y0=34,rh=view==='ms'?46:36,n=rows.length;svg.setAttribute('viewBox',`0 0 440 ${y0+n*rh+34}`);
    const X=v=>x0+(Math.log10(Math.max(10**LO,v))-LO)/(HI-LO)*(x1-x0);
    const ticks=view==='ms'?[.1,1,10]:[10,100,1e3,1e4,1e5,1e6];
    for(const v of ticks){svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:y0+n*rh,class:'gl'},svg);svgText(svg,X(v),y0+n*rh+14,view==='ms'?String(v):fmt(v),{'text-anchor':'middle'});}
    svgText(svg,x1,y0+n*rh+28,view==='ms'?'ms (log)':'texture reads per frame at 320×180 (log)',{'text-anchor':'end'});
    rows.forEach((r,i)=>{const y=y0+i*rh,col=TC[r.tag];svgText(svg,8,y+11,r.lab,{class:'lab','font-size':12});svgText(svg,8,y+25,r.sub,{'font-size':10});
      if(r.lo!==null){svgEl('rect',{x:x0,y:y+4,width:Math.max(1,X(r.lo)-x0),height:12,fill:col,rx:1},svg);svgEl('rect',{x:X(r.lo),y:y+4,width:Math.max(2,X(r.hi)-X(r.lo)),height:12,fill:col,opacity:.45,rx:1},svg);}
      else svgEl('rect',{x:x0,y:y+4,width:Math.max(1,X(r.hi)-x0),height:12,fill:col,rx:1},svg);
      svgText(svg,Math.min(X(r.hi)+5,x1-2),y+14,(view==='ms'?r.note:(r.lo!==null?fmt(r.lo)+' to '+fmt(r.hi):fmt(r.hi)))+' · '+r.tag,{'font-size':10.5,class:'v','text-anchor':X(r.hi)+80>x1?'end':'start',...(X(r.hi)+80>x1?{x:X(r.hi)-5,y:y+28}:{})});});
    if(view==='ms'){const ln=(v,t,col,an,dx)=>{svgEl('line',{x1:X(v),x2:X(v),y1:y0-12,y2:y0+n*rh,stroke:col,'stroke-width':1.6,'stroke-dasharray':'4 3'},svg);svgText(svg,X(v)+dx,y0-16,t,{'text-anchor':an,'font-size':10.5,fill:col});};
      ln(2,'2 ms water budget','#4fd2dc','end',-3);ln(16.7,'16.7 ms frame','#ff6b5e','end',-3);
      ro.innerHTML='Only terrain connect runs per call at play time, and at 4 to 5 ms it would eat the whole 2 ms water budget twice over. The distance field runs once per map or tide step, never per frame.';}
    else{const tot=OPS(bake).slice(0,3).reduce((a,r)=>a+r.hi,0);
      ro.innerHTML=`distance, colour and flow together: <b>${fmt(tot)}</b> reads per frame · ${bake?'baked: 1 fetch per pixel for the distance':'in the shader: the distance alone is <b>36×</b> the baked lookup'}`;}}
  draw();return {};});

// ======================================================================
// §7 architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});
