// ======================================================================
// Scorecard: sortable heat table + radar (as in the rain/acid studies)
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#1e2a1b','#2c4a24','#4d7a36','#7fb150','#a8d46c'];const RL=['Simplicity','Speed','Pixel taste','Aliveness','Variety'];const SC=['#f0c25a','#6dd4c3','#c9a2ff'];
  let sel=['C3','F1','E3'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Alive','Variety'][i]}</th>`).join('')+'<th data-s="sum">Sum</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#0d120c':'#e2ead8'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-40 0 ${S+80} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#3a4d2f':'#18211a'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#18211a'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// 6a: forest types catalogue: eight live mini-forests
// ======================================================================
function deadForest(W,H,seed){const trees=buildForest(W,H+28,{seed,biome:4,densMul:2.2,und:false,pick:(b,x,y,r)=>r()<.7?SI['Charred snag']:r()<.5?SI.Snag:SI.Shrub});
  for(const t of trees)if(t.sp===SI.Shrub){t.v=0;}return trees;}
function deadGround(W,H,trees,s){const g=bakeGround(W,H,trees,s===3?3:1,()=>[.55,.3],{bio:4});for(let i=0;i<g.length;i++){const x=i%W,y=(i/W)|0;let c=mix32(g[i],U('#57524c'),.6);if(hash2(x*5,y*3)<.05)c=U('#2e2b29');if(s<2&&hash2(x*13,y*7)<.006)c=U('#c86ab0');g[i]=c;}return g;}
reg('types',root=>{const grid=$('.cards',root),det=$('.detail',root),c=ctl(root);const CW=96,CH=56;let selI=3,season=1;
  grid.innerHTML=TYPES.map((t,i)=>{const m=t.c[1].match(/~(\d+)\/screen/);const n=m?+m[1]:0;return `<button type="button" class="card${i===selI?' on':''}" data-i="${i}"><canvas width="${CW}" height="${CH}" aria-hidden="true"></canvas><b>${t.n}</b><small>${n?n+' trees per 320×180 screen':'not in the Sandbox'}</small><span class="bar"><i style="width:${n/330*100}%"></i></span></button>`;}).join('');
  const cards=$$('.card',grid).map((el,i)=>{const px=PX($('canvas',el));const t=TYPES[i];const st={px,time:rnd()*9};
    if(t.b>=0){st.trees=buildForest(CW,CH+28,{seed:100+i,biome:t.b});st.g=[0,1,2,3].map(()=>null);}else{st.trees=deadForest(CW,CH,100+i);st.g=[null,null,null,null];}return st;});
  const groundOf=(st,i,s)=>{if(!st.g[s]){const t=TYPES[i];st.g[s]=t.b>=0?bakeGround(st.px.W,st.px.H,st.trees,s,()=>BIOME_TM[t.b],{bio:t.b,ox:i*977}):deadGround(st.px.W,st.px.H,st.trees,s);}return st.g[s];};
  const big=PX($('canvas',det));const bst={trees:[],g:[]};
  const LAB=['Species mix','Density','Undergrowth','Palette','Seasons','Gameplay feel'];
  function select(i){selI=i;$$('.card',grid).forEach((x,k)=>x.classList.toggle('on',k===i));const t=TYPES[i];
    bst.trees=t.b>=0?buildForest(big.W,big.H+28,{seed:200+i,biome:t.b}):deadForest(big.W,big.H,200+i);bst.g=[];bst.i=i;
    $('[data-txt]',det).innerHTML=`<h5>${t.n}</h5><dl class="kv">${LAB.map((l,k)=>`<dt>${l}</dt><dd>${t.c[k]}</dd>`).join('')}</dl>`;}
  grid.addEventListener('click',e=>{const b=e.target.closest('.card');if(b)select(+b.dataset.i);});c.seg('season',v=>{season=+v;});
  select(selI);let fr=0;
  return {tick(dt){fr++;cards.forEach((st,i)=>{st.time+=dt;if(fr%3!==i%3&&fr>2)return;drawForest(st.px.u32,CW,CH,st.trees,{ground:groundOf(st,i,season),season,time:st.time,wind:.45,dapple:false});st.px.put();});
    const i=bst.i;const t=TYPES[i];if(!bst.g[season])bst.g[season]=t.b>=0?bakeGround(big.W,big.H,bst.trees,season,()=>BIOME_TM[t.b],{bio:t.b,ox:i*577}):deadGround(big.W,big.H,bst.trees,season);
    bst.time=(bst.time||0)+dt;const r=drawForest(big.u32,big.W,big.H,bst.trees,{ground:bst.g[season],season,time:bst.time,wind:.45});big.put();setHud(det,`${bst.trees.filter(q=>!q.u).length} trees · ${bst.trees.filter(q=>q.u).length} undergrowth · ${SEASONS[season]}`);}};});

// ======================================================================
// 6b: species sheet: every species in four seasons and six sizes, bark, flex
// ======================================================================
reg('species',root=>{const grid=$('.cards',root),det=$('.detail',root),c=ctl(root);let selI=0,season=1;
  const thumb=(S,cv)=>{cv.width=S.w;cv.height=S.h;const g=cv.getContext('2d'),id=g.createImageData(S.w,S.h);new Uint32Array(id.data.buffer).set(S.px);g.putImageData(id,0,0);cv.style.width=S.w*2+'px';};
  grid.innerHTML=SPECROWS.map((r,i)=>`<button type="button" class="card${i===selI?' on':''}" data-i="${i}"><span class="seas">${[0,1,2,3].map(()=>'<canvas aria-hidden="true"></canvas>').join('')}</span><b>${r.n}</b><small>Flex ${SPECIES[i].flex} · ${SPECIES[i].kind}</small></button>`).join('');
  $$('.card',grid).forEach((el,i)=>{$$('canvas',el).forEach((cv,s)=>{thumb(spr(i,2,s),cv);cv.style.width='';cv.style.maxWidth='100%';});});
  const LAB=['Leaf','Bark','Size (px)','Autumn','Flex','Notes'];const sw=PX($('canvas.flexc',det));const bk=$('canvas.barkc',det);
  function barkSwatch(i){const sp=SPECIES[i],B=sp.bark,w=10,h=26;bk.width=w;bk.height=h;const g=bk.getContext('2d'),id=g.createImageData(w,h),u=new Uint32Array(id.data.buffer);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const rel=x/(w-1);let col=rel<.34?B[0]:rel>.7?B[2]:B[1];if(sp.birch){col=B[0];if(rel>.7)col=B[1];if(hash2(x+9,y>>1)<.22&&((y+x)&1))col=B[2];}else if(sp.kind==='palm'){col=((y>>1)&1)?B[1]:B[0];if(x>=w-2)col=B[2];}else if(hash2(x*5+9,y)<.12)col=B[2];u[y*w+x]=col;}
    g.putImageData(id,0,0);bk.style.width=w*4+'px';}
  function select(i){selI=i;$$('.card',grid).forEach((x,k)=>x.classList.toggle('on',k===i));const r=SPECROWS[i],sp=SPECIES[i];
    const sz=$('.sizes',det);sz.innerHTML='';for(let v=0;v<NV;v++){const cv=document.createElement('canvas');cv.setAttribute('aria-hidden','true');thumb(spr(i,v,season),cv);sz.appendChild(cv);}
    barkSwatch(i);$('[data-ramps]',det).innerHTML=[0,1,2,3].map(s=>{const pal=sp.leaf[s];return `<span class="mini">${SEASONS[s]}</span> `+(pal?`<span class="ramp">${pal.map(x=>`<i style="background:${css(x)}"></i>`).join('')}</span>`:'<span class="mini">no leaves</span>');}).join(' &nbsp; ');
    $('[data-txt]',det).innerHTML=`<h5>${r.n}</h5><dl class="kv">${LAB.map((l,k)=>`<dt>${l}</dt><dd>${r.c[k]}</dd>`).join('')}</dl>`;}
  grid.addEventListener('click',e=>{const b=e.target.closest('.card');if(b)select(+b.dataset.i);});c.seg('season',v=>{season=+v;select(selI);});select(0);
  const G=new Uint32Array(sw.W*sw.H);for(let y=0;y<sw.H;y++)for(let x=0;x<sw.W;x++)G[y*sw.W+x]=groundCol(.55,.55,3,1,.3,x,y);let time=0;
  return {tick(dt){time+=dt;const u=sw.u32;u.set(G);const wind=c.v('wind')/100;const A={x:24,y:sw.H-3,sp:0,v:2,ph:0,off:0,shake:0},B={x:72,y:sw.H-3,sp:selI,v:2,ph:0,off:0,shake:0};
    for(const t of [A,B]){const S=spr(t.sp,t.v,season);blit(u,sw.W,sw.H,S,t.x-S.ax,t.y-S.h+1,{sw:swayOf(t,time,wind)});}sw.put();setHud(det,`oak flex 1.0 · ${SPECROWS[selI].n} flex ${SPECIES[selI].flex}`,'flex');}};});

// ======================================================================
// 6c: decision table → live occlusion demo (dither, fade, cutaway, silhouette, none)
// ======================================================================
reg('decide',root=>{const cv=$('canvas',root),F=PX(cv),W=F.W,H=F.H,c=ctl(root),tb=$('tbody',root),ro=$('[data-ro]',root);
  const trees=buildForest(W,H+28,{seed:71,biome:3,densMul:1.1});const G=bakeGround(W,H,trees,1,()=>BIOME_TM[3],{bio:3});
  const MAP=[{m:'layer',lab:'A1 layer split (colour-0 holes)'},{m:'dither',lab:'A3 order + dither near you, party outline',party:1},{m:'alpha',lab:'E1 Stardew fade to 40 %'},{m:'cutaway',lab:'E2 cutaway with a dithered rim',rim:1},{m:'silhouette',lab:'E3 silhouette for the player only',enemy:1},{m:'overlay',lab:'A2 overlay'}];
  tb.innerHTML=DECIDE.map((r,i)=>`<tr data-i="${i}" tabindex="0"><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  let mode='dither',row=-1,party=false,enemy=false,rim=false;
  const setRow=i=>{row=i;$$('tr',tb).forEach((t,k)=>t.classList.toggle('sel',k===i));const M=MAP[i];mode=M.m;party=!!M.party;enemy=!!M.enemy;rim=!!M.rim;c.setSeg('occ',['layer','overlay'].includes(mode)?'':mode);};
  tb.addEventListener('click',e=>{const tr=e.target.closest('tr');if(tr&&!e.target.closest('a'))setRow(+tr.dataset.i);});tb.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr){e.preventDefault();setRow(+tr.dataset.i);}}});
  c.seg('occ',v=>{mode=v;row=-1;party=enemy=rim=false;$$('tr',tb).forEach(t=>t.classList.remove('sel'));});
  const loop=[[20,30],[90,40],[150,30],[190,70],[120,96],[40,88]];const p=newWalker(20,30);let wp=1;const q=newWalker(180,90);q.tint=[.7,1.25,.75];let qwp=3;
  const leafT=new Uint32Array(32*32),leafA=new Uint8Array(32*32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const n=vnoise(x/4,y/4)*.7+hash2(x,y)*.3;if(n>.52){leafA[y*32+x]=1;leafT[y*32+x]=L.oakSu[n>.7?3:n>.6?2:1];}}
  let time=0,fa=1;setRow(1);
  return {tick(dt){time+=dt;const [tx,ty]=loop[wp];if(Math.hypot(tx-p.x,ty-p.y)<2)wp=(wp+1)%loop.length;walkerStep(p,tx-p.x,ty-p.y,22,dt);
    const [ux,uy]=loop[qwp];if(Math.hypot(ux-q.x,uy-q.y)<2)qwp=(qwp+1)%loop.length;walkerStep(q,ux-q.x,uy-q.y,18,dt);
    const u=F.u32;const occ=mode==='layer'?'dither':mode==='overlay'?'none':mode;
    const r=drawForest(u,W,H,trees,{ground:G,season:1,time,wind:.35,player:p,occ,fadeP:mode==='layer'?13/16:.5,alphaV:.4,cutRim:rim,others:[q]});
    if(mode==='overlay'){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=((y+((time*2)|0))&31)*32+((x+((time*3)|0))&31);if(leafA[k])u[y*W+x]=mix32(u[y*W+x],leafT[k],.4);}}
    if(party&&q.vis<.6)drawPlayer(u,W,H,q,0,0,2,{a:.8});
    F.put();const solid=occ==='none'||occ==='silhouette'?100:occ==='dither'?(mode==='layer'?81:50):occ==='alpha'?40:'≈ 70';
    ro.innerHTML=`${MAP[row]?MAP[row].lab+' · ':''}player visible <b>${Math.round(((occ==='silhouette'&&r.occluded)?1:r.pvis)*100)} %</b>${r.occluded?' (behind a crown)':''} · front crown kept <b>${r.occluded?solid+' %':'100 %'}</b> · extra pass: <b>${occ==='silhouette'||party?'yes':'no'}</b> · ${party?'party member':'other character'} visible ${Math.round(q.vis*100)} %${enemy?' (an enemy stays hidden)':''}`;}};});

// ======================================================================
// 6d: boids with priority-capped accumulation, k nearest, a wrap box, flaps and height shadows
// ======================================================================
reg('boids',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),FL=PX(cvs[1]),c=ctl(root),ro=$('[data-ro]',root);const W=F.W,H=F.H;
  const trees=buildForest(W,H+28,{seed:13,biome:4,densMul:.9,und:false});const G=bakeGround(W,H,trees,1,()=>BIOME_TM[4],{bio:4});
  let B=[];const mk=n=>{while(B.length<n)B.push({x:rnd()*W,y:rnd()*H,vx:(rnd()-.5)*40,vy:(rnd()-.5)*40,z:16+rnd()*24,ph:rnd()*6});B.length=n;};mk(30);
  let mouse=null;cvs[0].addEventListener('pointermove',e=>{mouse=cellOf(cvs[0],e);});cvs[0].addEventListener('pointerdown',e=>{mouse=cellOf(cvs[0],e);});cvs[0].addEventListener('pointerleave',()=>mouse=null);
  const FR4=[["#...#",".#.#.","..#.."],["#.#.#",".###.","..#.."],[".....","##.##","..#.."],[".....","#####","..#.."]];
  let time=0,ops=0;
  return {tick(dt){time+=dt;mk(c.v('n'));const K=c.v('k'),metric=c.segv('nb')==='metric',prio=c.v('prio'),grow=c.v('wrap')?24:9999,MAXA=90;ops=0;
    const home=mouse?[mouse[0],mouse[1]-30]:[W/2+Math.cos(time*.3)*W*.3,H/2+Math.sin(time*.4)*H*.25];
    for(const b of B){const nb=[];if(metric){for(const o of B){if(o===b)continue;ops++;const d=Math.hypot(o.x-b.x,o.y-b.y);if(d<40)nb.push([d,o]);}}else{const ds=[];for(const o of B){if(o===b)continue;ops++;ds.push([Math.hypot(o.x-b.x,o.y-b.y),o]);}ds.sort((a,b)=>a[0]-b[0]);nb.push(...ds.slice(0,K));}
      let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0;for(const [d,o] of nb){if(d<8){sx+=(b.x-o.x)/(d*d+1)*20;sy+=(b.y-o.y)/(d*d+1)*20;}ax+=o.vx;ay+=o.vy;cx+=o.x;cy+=o.y;}const n=nb.length||1;
      const rules=[];if(mouse){const dx=b.x-mouse[0],dy=b.y-mouse[1],d=Math.hypot(dx,dy);if(d<30)rules.push([dx/d*60*3,dy/d*60*3]);}
      rules.push([sx*1.6*10,sy*1.6*10]);if(nb.length){rules.push([(ax/n-b.vx)*.5,(ay/n-b.vy)*.5]);rules.push([(cx/n-b.x)*.35,(cy/n-b.y)*.35]);}rules.push([(home[0]-b.x)*.12,(home[1]-b.y)*.12]);
      let fx=0,fy=0;if(prio){for(const [rx,ry] of rules){const rem=MAXA-Math.hypot(fx,fy);if(rem<=0)break;const m=Math.hypot(rx,ry);if(m<=rem){fx+=rx;fy+=ry;}else{fx+=rx*rem/m;fy+=ry*rem/m;}}}
      else{for(const [rx,ry] of rules){fx+=rx;fy+=ry;}fx/=rules.length/2;fy/=rules.length/2;}
      b.vx+=fx*dt;b.vy+=fy*dt;const sp=Math.hypot(b.vx,b.vy),cl=clamp(sp,30,52);b.vx*=cl/(sp||1);b.vy*=cl/(sp||1);b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x<-grow)b.x=W+grow;else if(b.x>W+grow)b.x=-grow;if(b.y<-grow)b.y=H+grow;else if(b.y>H+grow)b.y=-grow;}
    const u=F.u32;drawForest(u,W,H,trees,{ground:G,season:1,time,wind:.3,dapple:false});
    const fr=c.v('frames'),fps=c.v('fps'),hz=c.v('hz');const usedFrames=fr===2?[0,2]:fr===3?[0,1,2]:[0,1,2,3];
    for(const b of B){const a=clamp(.45*(1-b.z/60),.08,.45),sw=b.z<24?3:2;for(let q=0;q<sw;q++){const x=Math.round(b.x-1+q+b.z*.15),y=Math.round(b.y);if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=mix32(u[y*W+x],SHADOWC,a);}}
    for(const b of B){const f=usedFrames[Math.floor((time+b.ph)*fps)%usedFrames.length];const s=FR4[f];for(let r=0;r<3;r++)for(let q=0;q<5;q++)if(s[r][q]==='#'){const x=Math.round(b.x)-2+q,y=Math.round(b.y-b.z)-1+r;if(x>=0&&y>=0&&x<W&&y<H)u[y*W+x]=U('#2a2830');}}
    if(c.v('wrap')){/* the box is off-screen by design */}
    F.put();
    // flap strip: the true wingbeat sampled at 60 fps vs the 2–4 drawn frames
    const v=FL.u32;v.fill(U('#18211a'));for(let k=0;k<usedFrames.length;k++){const s=FR4[usedFrames[k]];const on=usedFrames[Math.floor(time*fps)%usedFrames.length]===usedFrames[k];for(let r=0;r<3;r++)for(let q=0;q<5;q++)if(s[r][q]==='#')v[(4+r)*FL.W+4+k*9+q]=on?U('#f0c25a'):U('#e2ead8');}
    for(let x=0;x<FL.W;x++){const ph=Math.sin(2*Math.PI*hz*(time+x/60));const y=Math.round(13+ph*2);v[y*FL.W+x]=U('#6dd4c3');}FL.put();
    ro.innerHTML=`${B.length} birds · ${metric?'metric radius 40 px':K+' nearest neighbours'} · ${ops.toLocaleString()} distance tests this frame · ${prio?'priority-capped (flee → separation → alignment → cohesion → home)':'averaged: rules can cancel, birds dither'} · wingbeat ${hz} Hz is ${(hz/60*100).toFixed(0)} % of a 60 fps frame rate, so draw ${fr} frames at ${fps} fps`;
    c.out('n',B.length);c.out('k',K);c.out('hz',hz+' Hz');c.out('fps',fps+' fps');c.out('frames',fr);}};});

// ======================================================================
// 6e: the performance budget, worked live
// ======================================================================
reg('budget',root=>{const c=ctl(root),svg=$('svg.chart',root),vd=$('.verdict',root),ro=$('[data-ro]',root);
  const PRE={savanna:{items:550,und:9,ui:8,baked:9,dens:.1},mixed:{items:1100,und:9,ui:8,baked:9,dens:.3},rain:{items:1770,und:9,ui:8,baked:9,dens:.5}};
  const set=(k,v)=>{const e=c.el(k);if(e)e.value=v;};
  $$('[data-pre]',root).forEach(b=>b.addEventListener('click',()=>{const p=PRE[b.dataset.pre];Object.entries(p).forEach(([k,v])=>set(k,k==='dens'?v*100:v));draw();}));
  ['items','und','ui','baked','dens'].forEach(k=>c.on(k,draw));c.seg('atlas',draw);c.seg('seasons',draw);
  function bar(y,label,v,max,lim,unit,hot,limLab){const X0=124,Wd=210;const w=Math.min(1,v/max)*Wd;svgText(svg,0,y+9,label,{'font-size':10.5});svgEl('rect',{x:X0,y,width:Wd,height:12,fill:'#18211a'},svg);
    svgEl('rect',{x:X0,y,width:Math.max(1,w),height:12,fill:hot?'#ff6b5e':'#6aa84c'},svg);if(lim!==null){const lx=X0+Math.min(1,lim/max)*Wd;svgEl('line',{x1:lx,y1:y-3,x2:lx,y2:y+15,stroke:'#f0c25a','stroke-width':1.5},svg);if(limLab)svgText(svg,lx+2,y-4,limLab,{'font-size':8.5,fill:'#f0c25a'});}
    svgText(svg,X0+Wd+6,y+10,`${typeof v==='number'?(v>=100?Math.round(v).toLocaleString():v.toFixed(v<10?1:0)):v}${unit}`,{'font-size':10.5,class:'v'});}
  function draw(){const items=c.v('items'),und=c.v('und'),ui=c.v('ui'),baked=c.v('baked'),dens=c.v('dens')/100;const atlasMB=c.segv('atlas')==='2048'?16:4;const sheets=c.segv('seasons')==='sheets';
    const calls=1+1+1+und+1+1+ui;const ysort=Math.round(9*256*dens);const upload=items*128/1024;const sprMB=sheets?.84:52000*4/1048576;const lut=sheets?0:3/1024;const bakedMB=baked*.25;const inst=2*3;
    const mem=atlasMB+bakedMB+inst;
    c.out('items',items.toLocaleString());c.out('und',und);c.out('ui',ui);c.out('baked',baked+' × 256 KB');c.out('dens',dens.toFixed(2)+' trees/tile');
    svg.innerHTML='';let y=14;
    bar(y,'Tree sprites on screen',items,6000,1500,'',items>1500,'target 1,500');y+=30;
    bar(y,'… vs CPU ceilings',items,6000,2000,'',items>2000,null);svgText(svg,124+2000/6000*210-2,y-4,'old phone 2k',{'font-size':8.5,fill:'#f0c25a','text-anchor':'end'});svgEl('line',{x1:124+5000/6000*210,y1:y-3,x2:124+5000/6000*210,y2:y+15,stroke:'#c9a2ff','stroke-width':1.5},svg);svgText(svg,124+5000/6000*210+2,y-4,'laptop 5k',{'font-size':8.5,fill:'#c9a2ff'});y+=30;
    bar(y,'Draw calls',calls,120,50,'',calls>50,'target 50');y+=30;
    bar(y,'Y-sorted per frame',ysort,1200,null,'',false);y+=30;
    bar(y,'Upload per frame',upload,800,null,' KB',false);y+=30;
    bar(y,'Atlas',atlasMB,40,null,' MB',false);y+=30;
    bar(y,'Baked chunks',bakedMB,40,null,' MB',false);y+=30;
    bar(y,'Instance buffers',inst,40,null,' MB',false);y+=30;
    bar(y,sheets?'Sprites, 4 season sheets':'Sprites, 1 season + LUT',sprMB+lut,40,null,' MB',false);
    const ok=items<1500&&calls<50;vd.className='verdict '+(ok?'ok':'bad');vd.textContent=ok?`Within the study's target: ${items.toLocaleString()} sprites < 1,500 and ${calls} draw calls < 50.`:`Over the study's target (< 1,500 sprites, < 50 draw calls): ${items>=1500?'bake the undergrowth (G5) or MultiMesh it (G3)':'merge layers into fewer batches'}.`;
    ro.innerHTML=`draw calls = trunks 1 + canopy 1 + shadows 1 + undergrowth ${und} chunks + particles 1 + birds 1 + characters and UI ${ui} = <b>${calls}</b> · y-sort = 9 chunks × 256 tiles × ${dens.toFixed(2)} = <b>${ysort}</b> · upload = ${items.toLocaleString()} × 128 B = <b>${upload.toFixed(0)} KB</b> per frame · memory ≈ <b>${mem.toFixed(1)} MB</b> (atlas ${atlasMB} + baked ${bakedMB.toFixed(2)} + instance 2 MB × 3)`;}
  draw();return {};});

// ======================================================================
// architecture stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[0]);return {};});
