// SpeedRunner mechanics study: figures 3 (score, matrix, restartcost, bytes, stack). Helpers live in core.js (SR).
{
const FAMC={A:'#d0281f',B:'#e08a3c',C:'#c9a227',D:'#1f8a3a',E:'#2458c9',F:'#7a4fd6',G:'#c04f9a',H:'#6b6b6b'};
const FN={A:'Movement, controls',B:'Animation, camera, feedback',C:'Elements',D:'Enemies',E:'Map design',F:'Difficulty curve',G:'Social',H:'Race infrastructure'};
const RL=['Feel','Readability','Run fit','Cheapness','Evidence'];
// ======================================================================
// §5 scorecard: sortable heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#211c29','#3a2e44','#6a4a4a','#b8703e','#f2c14e'];const SC=['#f2c14e','#9fd3c7','#ec7a5c'];
  let sel=['A1','F1','H3'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Feel','Read.','Run fit','Cheap','Evid.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
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
  const NOTE={A1:'already built; the one addition is a jumpHeightBL and apexMs pair in the tuning object.',F1:'deletes the countdown: 3 s off every one of the hundreds of attempts a hard map takes.',
    H3:'the only strong check, invisible to players, M to L of server work.',E5:'30 to 40 hand-authored chunks proved by a headless bot: the most expensive row.',H5:'WebSockets on Vercel are a public beta; 100 B/s per racer.',
    A2:'corner correction is about 20 lines; the grace windows are already right.',B2:'one ctx.scale about the feet and a particle pool.',G2:'a pickable shadow with owner colours turns five names into rivals.',
    C1:'a 1.45x launch with auto-jump semantics, one constant and a pre-animation.',H1:'an integer step count is the exact time and the only value worth sorting on.'};
  const nar=svg.getBoundingClientRect().width<520,VW=nar?380:600,H=320;svg.setAttribute('viewBox',`0 0 ${VW} ${H}`);const L=44,Rr=VW-12,T=22,B=262,X0=7.5,X1=15.5,Y0=3.5,Y1=10.5,X=v=>L+(v-X0)/(X1-X0)*(Rr-L),Y=v=>B-(v-Y0)/(Y1-Y0)*(B-T);
  const zone=(x0,x1,y0,y1,fill,label,anchor,ly)=>{svgEl('rect',{x:X(x0),y:Y(y1),width:X(x1)-X(x0),height:Y(y0)-Y(y1),fill,opacity:.12},svg);svgText(svg,anchor==='end'?X(x1)-5:X(x0)+5,ly==='top'?Y(y1)+14:Y(y0)-6,label,{'font-size':11,'text-anchor':anchor||'start',fill:'#c4bccc'});};
  zone(12.5,15.5,8.5,10.5,'#4ce04c','build first','end','top');zone(7.5,15.5,3.5,6.5,'#e0734f','costly or thin evidence','start');
  for(let v=4;v<=10;v++){svgEl('line',{x1:L,x2:Rr,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,L-6,Y(v)+4,String(v),{'text-anchor':'end','font-size':11});}
  for(let v=8;v<=15;v++)svgText(svg,X(v),B+15,String(v),{'text-anchor':'middle','font-size':11});
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
  show('F1');return {};});

// ======================================================================
// §6c restart cost: death to control per game
// ======================================================================
reg('restartcost',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);let mine=null;
  // seconds read from the 6c rows; null = no number in the table
  const SEC={'Super Meat Boy':[.5,1],'Celeste':[1,1],'N++':[.5,1],'VVVVVV':[.05,0],'Hollow Knight':[3,0],'Trackmania':[1,1],'Neon White':[1,1],'Jetpack Joyride':[null,0],'SpeedRunner today':[3.4,0],'SpeedRunner proposed':[.38,0]};
  const rows=T6['6c'].map(r=>{const name=r[0],k=Object.keys(SEC).find(k=>name.startsWith(k));const [v,est]=SEC[k]||[null,0];return {name,v,est,txt:r[1]};});
  c.on('per100',draw);
  c.btn('run',b=>{const w=SR.course('hero');let P;const t0=performance.now(),N=1000;for(let i=0;i<N;i++){P=SR.newPlayer(w.start,w.startY);for(const mv of w.movers){mv.cur=null;mv.prev=null;}SR.updMovers(w,P,0,SR.DT);}
    mine=(performance.now()-t0)/N;b.textContent='Time it again';draw();});
  function draw(){const per=c.v('per100');svg.innerHTML='';const n=rows.length,L=170,Rr=570,y0=30,rh=28,hgt=y0+n*rh+40;svg.setAttribute('viewBox',`0 0 600 ${hgt}`);
    const MAX=per?6:4,X=v=>L+Math.min(1,v/MAX)*(Rr-L),val=v=>per?v*100/60:v,fmt=v=>per?v.toFixed(1)+' min':v.toFixed(2)+' s';
    const defs=svgEl('defs',{},svg),pat=svgEl('pattern',{id:'rc-hatch',width:6,height:6,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);svgEl('rect',{width:6,height:6,fill:'#fff'},pat);svgEl('rect',{width:2.5,height:6,fill:'#0a0a0a'},pat);
    for(let v=0;v<=MAX;v+=per?1:.5){svgEl('line',{x1:X(v),x2:X(v),y1:y0-8,y2:y0+n*rh,class:'gl'},svg);svgText(svg,X(v),y0+n*rh+14,per?v+' min':v+' s',{'text-anchor':'middle','font-size':10});}
    const tgt=per?.5*100/60:.5;svgEl('line',{x1:X(tgt),x2:X(tgt),y1:y0-14,y2:y0+n*rh,stroke:'#d0281f','stroke-width':1.5,'stroke-dasharray':'4 3'},svg);svgText(svg,X(tgt)+4,y0-4,'0.5 s target',{'font-size':10.5,fill:'#d0281f'});
    rows.forEach((r,i)=>{const y=y0+i*rh;svgText(svg,L-8,y+14,r.name,{'text-anchor':'end','font-size':11,class:'lab',fill:'#0a0a0a'});
      if(r.v==null){svgText(svg,L+4,y+14,'not timed in the table ("one tap after death")',{'font-size':10,fill:'#9a9a9a'});return;}
      const v=val(r.v),sr=/SpeedRunner/.test(r.name);svgEl('rect',{x:L,y:y+3,width:Math.max(1.5,X(v)-L),height:14,fill:r.est?'url(#rc-hatch)':(sr&&r.v>1?'#d0281f':'#0a0a0a'),stroke:'#0a0a0a','stroke-width':r.est?1:0},svg);
      svgText(svg,X(v)+5,y+14,fmt(v)+(r.est?' (estimate)':''),{'font-size':10,fill:sr&&r.v>1?'#d0281f':'#0a0a0a',class:'v'});});
    leg.innerHTML='<span><i style="background:#0a0a0a"></i>measured or from code</span><span><i style="background:repeating-linear-gradient(45deg,#0a0a0a 0 2px,#fff 2px 5px)"></i>estimate in §6c</span><span><i style="background:#d0281f"></i>SpeedRunner today</span><span><i style="background:#d0281f;height:2px"></i>0.5 s target</span>';
    ro.innerHTML=`SpeedRunner today <b>3.4 s</b> = 0.38 s beat + 3 s countdown; proposed <b>0.38 s</b>, skippable · at one death per 20 s that is <b>${(3.4/23.4*100).toFixed(0)}%</b> of a session against ${(0.38/20.38*100).toFixed(1)}%`+(mine!=null?` · in-place reset here: <b>${mine.toFixed(3)} ms</b> (Sandbox: 0.1 ms; countdown replay 3,400 ms)`:'');}
  draw();return {};});

// ======================================================================
// §6d ghost bytes per minute, log scale, plus the same run encoded here
// ======================================================================
reg('bytes',root=>{const c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root),leg=$('[data-leg]',root);let mine=null,busy=false;
  // KB per minute read from the 6d rows: [label, KB, kind] with kind K (game), V (Sandbox), I (estimate), ref (another game's format)
  const BARS=[['SpeedRunner today, 18 floats as JSON, 30 Hz',100,'K','json30'],['Sandbox, full pose JSON, 30 Hz',143,'V','json30'],['Sandbox, full pose delta-quantised, 30 Hz',35.4,'V'],
    ['Sandbox, position JSON, 30 Hz',28.1,'V'],['Sandbox, position delta-quantised, 30 Hz',7.6,'V'],['Sandbox, position JSON, 10 Hz',9.3,'V'],['Sandbox, position delta-quantised, 10 Hz',2.6,'V'],
    ['Packed state, 30 Hz, raw',12.6,'I'],['Packed state, 10 Hz, raw',4.2,'I','pos15'],['Input run-length pairs, raw',.9,'I','rle'],['Input run-length, deflated',.7,'I','rleZ'],['Input bitmap, 3 bits per step',2.7,'I','bitmap'],['Input bitmap, deflated',.45,'I','bitmapZ'],
    ['Mario Kart Wii RKG, 10,240 B per 2.5 min race',10.24/2.5,'ref'],['Input log, 1 byte per step, raw',7.2,'I','raw'],['Input log, 1 byte per step, deflated',1,'I','rawZ']];
  const KC={K:'#0a0a0a',V:'#555555',I:'#9a9a9a',ref:'#2458c9',you:'#d0281f'};
  async function deflate(u8){try{if(!('CompressionStream' in window))return null;const cs=new CompressionStream('deflate');const w=cs.writable.getWriter();w.write(u8);w.close();const buf=await new Response(cs.readable).arrayBuffer();return buf.byteLength;}catch(_){return null;}}
  async function encodeRun(){const w=SR.makeCourse(11),st={};let P=SR.newPlayer(w.start,w.startY),t=0,pose=SR.newPose();const log=new Uint8Array(7200),json=[],pos=[];
    for(let i=0;i<7200;i++){const k=SR.bot(P,w,st);log[i]=(k.left?1:0)|(k.right?2:0)|(k.jump?4:0)|(k.jumpPressed?8:0);SR.step(P,k,SR.DT,{world:w,time:t});t+=SR.DT;pose=SR.blend(pose,SR.targetPose(P,t),1-Math.exp(-26*SR.DT));
      if(P.dead||P.x>w.width-150){P=SR.newPlayer(w.start,w.startY);st.lastWall=0;}
      if(i%4===0){const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;json.push([r1(P.x),r1(P.y),P.facing,r2(P.flipOn?P.flip*6.28:0),0,1,1,r2(P.flap),r2(pose.hip),r2(pose.lean),...pose.th.map(r2),...pose.sh.map(r2),...pose.ua.map(r2),...pose.la.map(r2)]);}
      if(i%8===0)pos.push(Math.round(P.x),Math.round(P.y));}
    const enc=new TextEncoder(),jsonB=enc.encode(JSON.stringify(json)).length;
    // §7 encodeInputs: (state, duration varint) pairs
    const out=[];let cur=log[0],run=0;const pushPair=(s,n)=>{out.push(s);while(n>=0x80){out.push((n&0x7f)|0x80);n>>=7;}out.push(n);};for(const b of log){if(b===cur&&run<0x3fff){run++;continue;}pushPair(cur,run);cur=b;run=1;}pushPair(cur,run);const rle=new Uint8Array(out);
    const bits=new Uint8Array(Math.ceil(7200*3/8));for(let i=0;i<7200;i++){const v=log[i]&7;for(let b=0;b<3;b++)if(v>>b&1){const p=i*3+b;bits[p>>3]|=1<<(p&7);}}
    const [rawZ,rleZ,bitmapZ,jsonZ]=await Promise.all([deflate(log),deflate(rle),deflate(bits),deflate(enc.encode(JSON.stringify(json)))]);
    return {json30:jsonB/1024,json30Z:jsonZ==null?null:jsonZ/1024,raw:log.length/1024,rawZ:rawZ==null?null:rawZ/1024,rle:rle.length/1024,rleZ:rleZ==null?null:rleZ/1024,bitmap:bits.length/1024,bitmapZ:bitmapZ==null?null:bitmapZ/1024,pos15:pos.length*2/1024,pairs:out.length/2,zip:rawZ!=null};}
  c.btn('run',async b=>{if(busy)return;busy=true;b.textContent='Encoding…';mine=await encodeRun();busy=false;b.textContent='Encode again';draw();});
  const fmt=v=>v>=10?v.toFixed(0)+' KB':v>=1?v.toFixed(1)+' KB':Math.round(v*1024)+' B';
  function draw(){svg.innerHTML='';const nar=svg.getBoundingClientRect().width<520,VW=nar?380:600,x0=nar?12:262,x1=VW-14,y0=40,rh=mine?(nar?38:24):(nar?34:19),by=nar?12:0,n=BARS.length,hgt=y0+n*rh+40;svg.setAttribute('viewBox',`0 0 ${VW} ${hgt}`);
    const LO=-1,HI=2.3,X=v=>x0+(Math.log10(Math.max(10**LO,v))-LO)/(HI-LO)*(x1-x0),yb=y0+n*rh;
    for(let e=LO;e<=2;e++){const v=10**e;svgEl('line',{x1:X(v),x2:X(v),y1:y0-6,y2:yb,class:'gl'},svg);svgText(svg,X(v),yb+13,v>=1?v+' KB':Math.round(v*1024)+' B',{'text-anchor':'middle','font-size':10});}
    svgText(svg,x1,yb+28,'bytes per minute of run (log scale)',{'text-anchor':'end','font-size':10.5});
    svgEl('line',{x1:X(1),x2:X(1),y1:y0-20,y2:yb,stroke:'#d0281f','stroke-width':1.2,'stroke-dasharray':'4 3'},svg);svgText(svg,X(1)+4,y0-10,'1 KB: a share link fits in a URL',{'font-size':10,fill:'#d0281f'});
    BARS.forEach(([lab,v,kind,key],i)=>{let y=y0+i*rh;svgText(svg,nar?x0:6,y+10,lab,{class:'lab','font-size':nar?10:10.5,fill:'#0a0a0a'});y+=by;const bh=nar?8:9;
      svgEl('rect',{x:x0,y:y+1,width:Math.max(1.5,X(v)-x0),height:bh,fill:KC[kind],rx:1},svg);svgText(svg,X(v)+4,y+bh,fmt(v),{'font-size':9.5,class:'v',fill:'#0a0a0a'});
      if(mine&&key&&mine[key]!=null){const yy=y+bh+2,mv=mine[key];svgEl('rect',{x:x0,y:yy,width:Math.max(1.5,X(mv)-x0),height:6,fill:KC.you,rx:1},svg);svgText(svg,X(mv)+4,yy+6,fmt(mv)+' here',{'font-size':9,fill:'#d0281f'});}});
    leg.innerHTML=`<span><i style="background:${KC.K}"></i>the game today [K]</span><span><i style="background:${KC.V}"></i>Sandbox measured [V, S3]</span><span><i style="background:${KC.I}"></i>report estimate [I]</span><span><i style="background:${KC.ref}"></i>another game's format</span>`+(mine?`<span><i style="background:${KC.you}"></i>this device, one 60 s autopilot run</span>`:'');
    ro.innerHTML=mine?`encoded here: 30 Hz full-pose JSON <b>${fmt(mine.json30)}</b>${mine.json30Z!=null?' ('+fmt(mine.json30Z)+' deflated)':''} · input log ${fmt(mine.raw)} raw${mine.rawZ!=null?', <b>'+fmt(mine.rawZ)+'</b> deflated':''} · ${mine.pairs} run-length pairs = ${fmt(mine.rle)}${mine.rleZ!=null?' ('+fmt(mine.rleZ)+' deflated)':''} · 3-bit bitmap ${fmt(mine.bitmap)}${mine.bitmapZ!=null?' ('+fmt(mine.bitmapZ)+')':''} · 15 Hz position track ${fmt(mine.pos15)} · ratio JSON to deflated inputs <b>${mine.rawZ?(mine.json30/mine.rawZ).toFixed(0):'?'}x</b>${mine.zip?'':' · no CompressionStream in this browser, raw sizes only'}`
      :'the game stores about 100 KB per minute; the input log is 7.2 KB raw and about 1 KB deflated, a factor of 20 to 100 [K; I]. Press the button to encode a real run here.';}
  draw();return {};});

// ======================================================================
// §7 architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[btns.length-1]);return {};});
}
