// Fire and smoke study: figures 3 (score, budget, stack)
// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#2c1a14','#4e2618','#8a3a1c','#d0602a','#ffb44a'];const RL=['Simplicity','Speed','Pixel taste','Mood','Interactivity'];const SC=['#ffb44a','#9fc7d6','#ff7a5c'];
  let sel=['A1','D1','F1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Mood','Interact.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#1d1008':'#f3e9df'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-40 0 ${S+80} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#5c4334':'#22160f'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#22160f'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// §6d web budget: measured ms on a log axis, 1 / 2 / 16.7 ms lines
// ======================================================================
reg('budget',root=>{const c=ctl(root),svg=$('svg.chart',root),vd=$('.verdict',root),ro=$('[data-ro]',root);
  const ROWS=[{id:'act',lab:'Fire CA, active list',sub:'320×180, ~1,500 burning',js:.056,gd:.30,k:'fire'},
    {id:'full',lab:'Fire CA, full sweep',sub:'320×180',js:.55,gd:10.5,k:'fire'},
    {id:'sca',lab:'Smoke CA',sub:'320×180',js:.077,gd:3.9,k:'smoke'},
    {id:'sca80',lab:'Smoke CA',sub:'80×45, estimate',js:null,gd:.3,k:'smoke'},
    {id:'adv',lab:'Smoke advect + decay',sub:'320×180',js:.31,gd:null,k:'smoke'},
    {id:'st64',lab:'Stam fluids, 20 iter.',sub:'64×64',js:1.82,gd:null,k:'smoke'},
    {id:'st320',lab:'Stam fluids, 20 iter.',sub:'320×180',js:32.1,gd:null,k:'smoke'}];
  const LO=Math.log10(.01),HI=Math.log10(300),x0=150,x1=430,y0=26,rh=36;
  const X=v=>x0+(Math.log10(Math.max(.01,v))-LO)/(HI-LO)*(x1-x0);
  const lab=()=>c.out('ph',(c.v('ph')/10).toFixed(1)+'×');c.on('ph',()=>{lab();draw();});lab();
  ['eng','fire','smoke'].forEach(k=>c.seg(k,draw));
  function draw(){const eng=c.segv('eng'),fire=c.segv('fire'),smoke=c.segv('smoke'),ph=c.v('ph')/10;svg.innerHTML='';
    for(const v of [.01,.1,1,10,100]){svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:y0+ROWS.length*rh,class:'gl'},svg);svgText(svg,X(v),y0+ROWS.length*rh+14,v<1?String(v):v+'',{'text-anchor':'middle'});}
    svgText(svg,x1,y0+ROWS.length*rh+28,'ms per step (log)',{'text-anchor':'end'});
    ROWS.forEach((r,i)=>{const y=y0+i*rh,on=r.id===fire||r.id===smoke;
      if(on)svgEl('rect',{x:2,y:y-4,width:436,height:rh-2,fill:'#36231a',rx:3},svg);
      svgText(svg,8,y+11,r.lab,{class:on?'lab':'','font-size':12});svgText(svg,8,y+24,r.sub,{'font-size':10.5});
      [['js','#ffb44a',0],['gd','#9fc7d6',12]].forEach(([k,col,dy])=>{const v=r[k];if(v===null){svgText(svg,x0+4,y+dy+9,'not measured',{'font-size':9.5});return;}
        const w=X(v*ph)-x0,dim=k!==eng;svgEl('rect',{x:x0,y:y+dy,width:Math.max(1,w),height:10,fill:col,opacity:dim?.35:1,rx:1},svg);
        svgText(svg,x0+w+4,y+dy+9,(v*ph<1?(v*ph).toFixed(v*ph<.1?3:2):(v*ph).toFixed(1))+' ms',{'font-size':10,class:dim?'':'v'});});});
    const ln=(v,t,col,an,dx)=>{svgEl('line',{x1:X(v),x2:X(v),y1:y0-10,y2:y0+ROWS.length*rh,stroke:col,'stroke-width':1.6,'stroke-dasharray':'4 3'},svg);svgText(svg,X(v)+dx,y0-12,t,{'text-anchor':an,'font-size':10.5,fill:col});};
    ln(1,'1 ms tick','#b3a293','end',-3);ln(2,'2 ms','#ff9a3c','start',3);ln(16.7,'16.7 ms frame','#ff6b5e','start',3);
    const fr=ROWS.find(r=>r.id===fire),sm=ROWS.find(r=>r.id===smoke);const fv=fr[eng],sv=sm[eng];
    const fms=fv===null?null:fv*ph,sms=sv===null?null:sv*ph;
    const ok=fms!==null&&sms!==null&&fms<1&&sms<2;
    vd.className='verdict '+(ok?'ok':'bad');
    vd.textContent=(fms===null||sms===null)?`${sms===null?sm.lab+' ('+sm.sub+')':fr.lab} was not measured in ${eng==='js'?'JavaScript':'GDScript'}`:
      ok?`Fits: ${fms.toFixed(2)} ms per server tick, ${sms.toFixed(2)} ms of smoke per frame`:`Over budget: ${fms>=1?'server tick '+fms.toFixed(2)+' ms > 1 ms':''}${fms>=1&&sms>=2?', ':''}${sms>=2?'smoke '+sms.toFixed(2)+' ms > 2 ms':''}`;
    ro.hidden=sms===null;ro.innerHTML=sms===null?'':`client smoke uses <b>${(sms/16.7*100).toFixed(1)}%</b> of a 16.7 ms frame and ${(sms/2*100).toFixed(0)}% of the 2 ms fire and smoke budget · GDScript ran 15 to 50 times slower than V8 on these loops`;}
  draw();return {};});

// ======================================================================
// §7 architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});
