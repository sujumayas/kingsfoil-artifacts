// Shared demos generated from the report by build.py: scorecard + radar, timeline, Curve Spec stack.
// ======================================================================
// Scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#2a2030','#4a3040','#7a4a32','#c47a34','#ffc870'];const RL=RLAB;const SC=['#ffc870','#8ea8ff','#ff8f7a'];
  let sel=SEL0.slice(),sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Pattern</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${RSHORT[i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
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
// Timeline (lanes + list)
// ======================================================================
reg('timeline',root=>{const lanes=$('.tl-lanes',root),list=$('.tl-list',root),gb=$('.tl-gens',root),det=$('.tl-detail',root);
  const GC=['#9e94ad','#ffc870','#e08a3a','#8ea8ff','#7fd6a0','#ff8f7a'];
  const ALL=GENS.flatMap(g=>g.ev.filter(e=>e.y).map(e=>e.y+e.m/12)),Y0=Math.floor(Math.min(...ALL)/5)*5,Y1=Math.ceil((Math.max(...ALL)+.5)/5)*5;
  const X=y=>(y-Y0)/(Y1-Y0)*97+1.5;const step=(Y1-Y0)>30?10:5;
  let h='<div class="tl-axis">';for(let y=Y0;y<=Y1;y+=step)h+=`<span style="left:${X(y)}%">${y}</span>`;h+='</div>';
  const items=[];
  GENS.forEach((g,gi)=>{const ys=g.ev.filter(e=>e.y).map(e=>e.y+e.m/12);const a=Math.min(...ys),b=Math.max(...ys);
    h+=`<div class="tl-lane" data-g="${gi}"><span class="tl-lab">${g.id}</span><div class="tl-track"><i class="tl-bar" style="left:${X(a)}%;width:${Math.max(.8,X(b)-X(a))}%;background:${GC[gi]}"></i>`;
    g.ev.forEach((e,ei)=>{const id=`tle-${gi}-${ei}`;items.push({gi,ei,id,e});if(e.y)h+=`<button class="tl-dot" type="button" style="left:${X(e.y+e.m/12)}%;--c:${GC[gi]}" data-id="${id}" aria-label="${g.id}, ${e.y}"></button>`;});
    h+='</div></div>';});
  lanes.innerHTML=h;
  gb.innerHTML='<button type="button" class="on" data-g="all">All generations</button>'+GENS.map((g,gi)=>`<button type="button" data-g="${gi}"><i style="background:${GC[gi]}"></i>${g.id}: ${g.t}</button>`).join('');
  list.innerHTML=items.map(it=>`<li id="${it.id}" data-g="${it.gi}" style="--c:${GC[it.gi]}"><span class="yr">${GENS[it.gi].id}${it.e.y?' · '+it.e.y:''}</span>${it.e.h}</li>`).join('');
  const show=id=>{const it=items.find(i=>i.id===id);if(!it)return;$$('.tl-list li',root).forEach(l=>l.classList.toggle('hl',l.id===id));det.innerHTML=`<b>${GENS[it.gi].id}: ${GENS[it.gi].t}</b> · ${it.e.h}`;};
  lanes.addEventListener('pointerover',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('click',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  lanes.addEventListener('focusin',e=>{const d=e.target.closest('.tl-dot');if(d)show(d.dataset.id);});
  gb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',gb).forEach(x=>x.classList.toggle('on',x===b));const g=b.dataset.g;
    $$('.tl-list li',root).forEach(l=>l.hidden=!(g==='all'||l.dataset.g===g));$$('.tl-lane',root).forEach(l=>l.classList.toggle('dim',!(g==='all'||l.dataset.g===g)));});
  const pick=items[0];show(pick.id);return {};});

// ======================================================================
// architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});

// ======================================================================
// Twin match matrix (from §5)
// ======================================================================
reg('twins',root=>{const tbody=$('tbody',root),thead=$('thead',root),ro=$('[data-ro]',root);const MC=['#3a2a34','#7a5a3a','#ffc870'],SYM=['○','◐','●'];
  let sortK='score',dir=-1,sel=0;
  const plain=s=>s.replace(/<[^>]+>/g,'');
  function draw(){const r=TWINS.map((t,i)=>({...t,i}));r.sort((a,b)=>{if(sortK==='n'){const x=plain(a.n),y=plain(b.n);return x<y?-dir:x>y?dir:0;}
      const va=sortK==='score'?a.score:a.c[+sortK].m,vb=sortK==='score'?b.score:b.c[+sortK].m;return (va-vb)*dir||(b.score-a.score);});
    tbody.innerHTML=r.map(t=>`<tr data-i="${t.i}" tabindex="0" class="${t.i===sel?'sel':''}"><td class="nm">${t.n}</td>${t.c.map(c=>`<td class="h" style="background:${MC[c.m]};color:${c.m===2?'#1a1208':'#eee'}" title="${plain(c.t).replace(/"/g,'&quot;')}">${SYM[c.m]}</td>`).join('')}<td><b>${t.score}</b>/12</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));show();}
  function show(){const t=TWINS[sel];ro.innerHTML=`<b>${t.n}</b> · match ${t.score}/12 · ${t.why}<br>`+t.c.map((c,k)=>`<span class="mute">${COND[k]}:</span> ${SYM[c.m]} ${c.t}`).join(' · ');}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=k==='n'?1:-1;}draw();});
  const pick=e=>{const tr=e.target.closest('tr');if(!tr)return;sel=+tr.dataset.i;draw();};
  tbody.addEventListener('click',pick);tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(e);}});
  draw();return {};});

// ======================================================================
// Backlog: fun impact vs cost (from §14)
// ======================================================================
reg('backlog',root=>{const svg=$('svg',root),ro=$('[data-ro]',root);const W=360,H=260,L=40,R=20,T=16,Bm=36;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const CX={S:0,M:1,L:2},X=c=>L+(CX[c]+.5)*(W-L-R)/3,Y=v=>T+(5-v)/4.4*(H-T-Bm);
  svgEl('rect',{x:L,y:T,width:(W-L-R)/3,height:(H-T-Bm)/2.2,fill:'#ffc870','fill-opacity':.06},svg);
  for(let v=1;v<=5;v++){svgEl('line',{x1:L,x2:W-R,y1:Y(v),y2:Y(v),stroke:'#1d1924'},svg);svgText(svg,L-8,Y(v)+4,v,{'text-anchor':'end',class:'lab','font-size':11});}
  ['S','M','L'].forEach(c=>svgText(svg,X(c),H-Bm+18,c==='S'?'S (cheap)':c==='M'?'M':'L (costly)',{'text-anchor':'middle',class:'lab','font-size':11}));
  svgText(svg,12,T+(H-T-Bm)/2,'Fun impact',{transform:`rotate(-90 12 ${T+(H-T-Bm)/2})`,'text-anchor':'middle',class:'lab','font-size':11});
  const seen={};const dots=BACKLOG.map((b,i)=>{const k=b.cost+b.imp;const n=seen[k]=(seen[k]||0)+1;const x=X(b.cost)+(n-1)%4*14-21,y=Y(b.imp)+Math.floor((n-1)/4)*14-4;
    const g=svgEl('g',{tabindex:0,class:'dot','data-i':i},svg);svgEl('circle',{cx:x,cy:y,r:8,fill:b.score>=3?'#ffc870':b.score>=2?'#c47a34':'#7a5a6a'},g);svgText(g,x,y+3.5,b.rank,{'text-anchor':'middle','font-size':9,style:'fill:#1a1208;font-weight:600'});return g;});
  const show=i=>{const b=BACKLOG[i];dots.forEach((d,k)=>d.classList.toggle('on',k===i));ro.innerHTML=`<b>#${b.rank}</b> ${b.change}<br><span class="mute">Cards</span> ${b.cards} · <span class="mute">impact</span> ${b.imp} · <span class="mute">cost</span> ${b.cost} · <span class="mute">score</span> ${b.score.toFixed(1)} · <span class="mute">tests</span> ${b.hyp}`;};
  svg.addEventListener('pointerover',e=>{const g=e.target.closest('.dot');if(g)show(+g.dataset.i);});svg.addEventListener('focusin',e=>{const g=e.target.closest('.dot');if(g)show(+g.dataset.i);});
  svg.addEventListener('click',e=>{const g=e.target.closest('.dot');if(g)show(+g.dataset.i);});show(0);return {};});
