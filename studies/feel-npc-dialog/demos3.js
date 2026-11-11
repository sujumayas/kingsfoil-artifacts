// NPC dialog study: figures 3 (score, matrix, costs, stack)
{
const FAMC={A:'#d9a066',B:'#9fd3c7',C:'#f2c14e',D:'#e0734f',E:'#f7eedb',F:'#a6d96a',G:'#d7a2e8',H:'#7fa8d9'};
const RL=['Clarity','Charm','MMO fit','Authoring','Speed'];
// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#2a1f17','#4a3424','#7a5232','#b8803e','#f2c14e'];const SC=['#f2c14e','#9fd3c7','#e0734f'];
  let sel=['C1','B4','H6'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Clarity','Charm','MMO','Author.','Speed'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#1f140d':'#efe4cf'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=100;svg.setAttribute('viewBox',`-46 0 ${S+92} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#5c4636':'#33251b'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#33251b'},svg);const [lx,ly]=pt(k,6.2);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// §5 feel vs cost: Clarity + Charm across, Authoring + Speed up
// ======================================================================
reg('matrix',root=>{const svg=$('svg',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);
  const NOTE={H6:'a median 1.6 s per exchange on-device, and players talked reward NPCs out of their rewards (§4 H6).',F3:'invisible to players, but §7 rests on it.',H2:'2,580 bytes as text against 240 as ids for one line to 30 players (§6c).',
    D3:'the top sum, 24: one 16x16 sprite, an integer hop and a byte on the wire.',B4:'50 bubbles 10.51 ms redrawn, 1.13 ms cached on a throttled CPU (§6d).',C4:'a wave on the box measured free; RichTextLabel effects redraw per glyph in Godot.',
    D1:'portraits charm but cost art for every expression.',G3:'needs a gesture before any sound on the web.'};
  const nar=svg.getBoundingClientRect().width<520,VW=nar?380:600,H=320;svg.setAttribute('viewBox',`0 0 ${VW} ${H}`);const L=44,Rr=VW-12,T=22,B=262,X=v=>L+(v-1.5)/9*(Rr-L),Y=v=>B-(v-1.5)/9*(B-T);
  const zone=(x0,x1,y0,y1,fill,label,anchor,ly)=>{svgEl('rect',{x:X(x0),y:Y(y1),width:X(x1)-X(x0),height:Y(y0)-Y(y1),fill,opacity:.12},svg);svgText(svg,anchor==='end'?X(x1)-5:X(x0)+5,ly==='top'?Y(y1)+14:Y(y0)-6,label,{'font-size':11,'text-anchor':anchor||'start',fill:'#c9baa0'});};
  zone(7.5,10.5,8.5,10.5,'#a6d96a','build first','end');zone(1.5,6.5,1.5,6.5,'#e0734f','costly and stiff','start');
  for(let v=2;v<=10;v++){svgEl('line',{x1:L,x2:Rr,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-6,Y(v)+4,String(v),{'text-anchor':'end','font-size':11});svgText(svg,X(v),B+15,String(v),{'text-anchor':'middle','font-size':11});}
  svgText(svg,(L+Rr)/2,B+32,'Clarity + Charm (feel) →',{'text-anchor':'middle','font-size':11,class:'lab'});
  svgText(svg,12,(T+B)/2,'Authoring + Speed (cheap) →',{'text-anchor':'middle','font-size':11,class:'lab',transform:`rotate(-90 12 ${(T+B)/2})`});
  const cells={};SCORE.forEach(s=>{const k=(s.r[0]+s.r[1])+':'+(s.r[3]+s.r[4]);(cells[k]=cells[k]||[]).push(s);});const pts=[];
  for(const k in cells){const list=cells[k],[fx,cy0]=k.split(':').map(Number),n=list.length,cols=Math.min(n,n>6?4:3),rowsN=Math.ceil(n/cols),dx=nar?7:11,dy=nar?7:9;
    list.forEach((s,j)=>{const col=j%cols,row=Math.floor(j/cols),cx=X(fx)+(col-(cols-1)/2)*dx,cy=Y(cy0)+(row-(rowsN-1)/2)*dy;
      const g=svgEl('g',{class:'pt',tabindex:0,'data-id':s.id,role:'button','aria-label':`${s.id} ${s.name}`},svg);
      svgEl('circle',{cx,cy,r:nar?3.2:4.4,fill:FAMC[s.id[0]],stroke:'#1a1310','stroke-width':1},g);pts.push(g);});}
  const show=id=>{const s=SCORE.find(x=>x.id===id);pts.forEach(p=>p.classList.toggle('on',p.dataset.id===id));
    ro.innerHTML=`<a href="#t-${id.toLowerCase()}">${id}</a> <b>${s.name}</b> · feel ${s.r[0]}+${s.r[1]} = ${s.r[0]+s.r[1]} · cheap ${s.r[3]}+${s.r[4]} = ${s.r[3]+s.r[4]} · MMO fit ${s.r[2]} · sum ${s.sum}`+(NOTE[id]?`<br>${NOTE[id]}`:'');};
  svg.addEventListener('pointerover',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('click',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  svg.addEventListener('focusin',e=>{const g=e.target.closest('.pt');if(g)show(g.dataset.id);});
  const FN={A:'Classic roots',B:'Bubbles',C:'Dialog box',D:'Acting',E:'Quest givers',F:'Shops',G:'Ambient, audio',H:'Systems'};
  leg.innerHTML=Object.entries(FAMC).map(([k,v])=>`<span><i style="background:${v};height:8px;width:8px;border-radius:50%"></i>${k} ${FN[k]}</span>`).join('');
  show('D3');return {};});

// ======================================================================
// §6d text costs on a log axis, plus Canvas 2D rows run on this device
// ======================================================================
const num=s=>{const v=parseFloat(String(s).replace(/[^0-9.]/g,''));return isFinite(v)?v:null;};
function liveBench(done){const cv=mkCanvas(320,180),c=cv.getContext('2d'),big=mkCanvas(1280,720),bc=big.getContext('2d',{willReadFrequently:false});c.imageSmoothingEnabled=false;bc.imageSmoothingEnabled=false;
  const A=glyphAtlas(FONT,UI.ink),chars=Object.keys(FONT.G),L192=layout('The berry fields are ripe at last. Take a few for the road, and say hi to Gran! Bring me [c=key]3 herbs[/c] and I will [wave]brew[/wave] us both a tonic. Mind the wolves on the north road, and come back before dusk!!',300,FONT);
  const TXT=['Anyone selling rope today?','Wolves at the north gate','Ale is on me tonight!','Selling fish, cheap'];
  const bub=(x,y,s)=>{const w=textW(s,FONT_S)+6;frame(c,x,y,w,11,'bubble');drawText(c,s,x+3,y+2,UI.ink,FONT_S);};
  const cache=TXT.map(s=>{const w=textW(s,FONT_S)+6,b=mkCanvas(w,11),bx=b.getContext('2d');frame(bx,0,0,w,11,'bubble');drawText(bx,s,3,2,UI.ink,FONT_S);return b;});
  const T=[()=>{},()=>{for(let i=0;i<2000;i++){const ch=chars[i%chars.length];c.drawImage(A.cv,A.x[ch],0,A.w[ch],9,(i*6)%312,((i/52)|0)%170,A.w[ch],9);}},
    ()=>{c.font='8px monospace';c.fillStyle=UI.ink;for(let i=0;i<40;i++)c.fillText('The quick brown fox jumps over the lazy dog twice.',2,8+i*4);},
    ()=>{frame(c,4,120,312,56,'box');drawLayout(c,L192,10,126,{});},()=>{frame(c,4,120,312,56,'box');drawLayout(c,L192,10,126,{t:performance.now()/1000});},
    ()=>{for(let i=0;i<50;i++)bub((i*37)%250,(i*23)%160,TXT[i&3]);},()=>{for(let i=0;i<50;i++)c.drawImage(cache[i&3],(i*37)%250,(i*23)%160);},
    ()=>{for(let i=0;i<200;i++)bub((i*37)%250,(i*23)%160,TXT[i&3]);},()=>{for(let i=0;i<200;i++)c.drawImage(cache[i&3],(i*37)%250,(i*23)%160);},null];
  const out=[];let k=0;
  const runOne=()=>{if(k>=T.length){done(out);return;}const fn=T[k];if(!fn){out[k]=null;k++;setTimeout(runOne,0);return;}
    const frameOnce=()=>{c.fillStyle=UI.paper;c.fillRect(0,0,320,180);fn();bc.drawImage(cv,0,0,1280,720);bc.getImageData(0,0,1,1);};
    for(let i=0;i<5;i++)frameOnce();const N=40,t0=performance.now();for(let i=0;i<N;i++)frameOnce();out[k]=(performance.now()-t0)/N;k++;setTimeout(runOne,16);};
  setTimeout(runOne,30);}
reg('costs',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);let mine=null,busy=false;
  const KC={gpu:'#d9a066',thr:'#e0734f',sw:'#9a8c76',you:'#a6d96a'};const CK=['','gpu','thr','sw'];
  c.seg('col',draw);c.on('sub',draw);
  c.btn('run',b=>{if(busy)return;busy=true;b.textContent='Running…';liveBench(o=>{mine=o;busy=false;b.textContent='Run again on this device';draw();});});
  const fmt=v=>v>=10?v.toFixed(1):v>=1?v.toFixed(2):v>=.01?v.toFixed(3):v.toFixed(4);
  function draw(){const ci=+c.segv('col'),sub=c.v('sub');svg.innerHTML='';const base=num(T6['6d'][0][ci]),baseMine=mine?mine[0]:0;
    const rows=T6['6d'].map((r,i)=>{let v=num(r[ci]);if(sub&&i>0&&v!==null)v=Math.max(.01,v-base);let y=mine?mine[i]:undefined;if(y!=null&&sub&&i>0)y=Math.max(.001,y-baseMine);return {lab:r[0].replace(/`/g,''),sub:'profiles: '+r[4],v:sub&&i===0?null:v,you:sub&&i===0?undefined:y};});
    const nar=svg.getBoundingClientRect().width<520,LO=-2,HI=2.5,VW=nar?360:600,x0=nar?14:250,x1=nar?334:586,y0=44,rh=nar?(mine?44:36):(mine?28:22),by=nar?15:0,n=rows.length;
    const hgt=y0+n*rh+34;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);const X=v=>x0+(Math.log10(Math.max(10**LO,v))-LO)/(HI-LO)*(x1-x0),yb=y0+n*rh;
    for(let e=LO;e<=2;e++){const v=10**e;svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:yb,class:'gl'},svg);svgText(svg,X(v),yb+13,v>=1?String(v):String(v).replace(/^0/,''),{'text-anchor':'middle','font-size':10});}
    svgText(svg,x1,yb+27,'ms per frame (log scale)',{'text-anchor':'end','font-size':10.5});
    svgEl('line',{x1:X(16.7),x2:X(16.7),y1:y0-22,y2:yb,stroke:'#ff6b5e','stroke-width':1.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(16.7)-4,y0-12,'16.7 ms frame',{'text-anchor':'end','font-size':10.5,fill:'#ff8f80'});
    rows.forEach((r,i)=>{let y=y0+i*rh;if(nar)svgText(svg,6,y+10,r.lab,{class:'lab','font-size':11});else{svgText(svg,6,y+10,r.lab,{class:'lab','font-size':11.5});}
      y+=by;const bh=10;
      if(r.v===null)svgText(svg,x0+4,y+9,sub&&i===0?'subtracted':'n/a',{'font-size':9.5,fill:'#8a7a62'});
      else{svgEl('rect',{x:x0,y:y+1,width:Math.max(1.5,X(r.v)-x0),height:bh,fill:KC[CK[ci]],rx:1},svg);const tx=X(r.v)+4,end=tx>x1-36;svgText(svg,end?X(r.v)-4:tx,y+bh,fmt(r.v),{'font-size':9.5,class:'v','text-anchor':end?'end':'start',...(end?{fill:'#1a1310'}:{})});}
      if(r.you!==undefined){const yy=y+bh+3;if(r.you===null)svgText(svg,x0+4,yy+8,'not run here (WebGL)',{'font-size':9,fill:'#8a7a62'});
        else{svgEl('rect',{x:x0,y:yy,width:Math.max(1.5,X(r.you)-x0),height:7,fill:KC.you,rx:1},svg);const tx=X(r.you)+4,end=tx>x1-60;svgText(svg,end?X(r.you)-4:tx,yy+7,fmt(r.you)+' here',{'font-size':9,'text-anchor':end?'end':'start',fill:end?'#1a1310':'#a6d96a'});}}});
    leg.innerHTML=`<span><i style="background:${KC[CK[ci]]}"></i>${['','M4 GPU','M4, 6x CPU throttle','SwiftShader'][ci]}, measured [S3]</span>`+(mine?'<span><i style="background:#a6d96a"></i>this device now, Canvas 2D in this page</span>':'')+'<span><i style="background:#ff6b5e"></i>16.7 ms frame</span>';
    const T=T6['6d'],r5=num(T[5][ci]),r6=num(T[6][ci]),r7=num(T[7][ci]),r8=num(T[8][ci]);
    let note=`50 bubbles: <b>${fmt(r5)} ms</b> redrawn against <b>${fmt(r6)} ms</b> cached · 200 bubbles: <b>${fmt(r7)} ms</b> against <b>${fmt(r8)} ms</b>${r7>16.7?' · redrawn crosses the frame':''}`;
    if(mine){const k=mine[7]/Math.max(1e-3,mine[8]);note+=`<br>Here: 200 bubbles redrawn <b>${fmt(mine[7])} ms</b>, cached <b>${fmt(mine[8])} ms</b>, ${k.toFixed(1)}× apart · 2,000 blits ${fmt(mine[1])} ms against 40 fillText calls ${fmt(mine[2])} ms.`;}
    ro.innerHTML=note+' · <span class="mute">Coloured bars: our benchmark [S3].</span>';}
  draw();return {};});

// ======================================================================
// §7 architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});
}
