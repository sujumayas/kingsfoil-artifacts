
// ======================================================================
// FIG 20: glow via 8x8 block sums + per-pixel palette choice through Bayer
// ======================================================================
reg('glow',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,N=W*H,c=ctl(root);const r=Room(W,H,{tile:16,seed:71});r.wall(0,0,W,14);
  r.spill(48,60,10,1.2);r.spill(120,72,8,1.0);r.item('crate',96,24);r.item('bones',22,30);for(let k=0;k<240;k++)r.step({evap:false,react:false,gas:false,samples:0});
  const BW=Math.ceil(W/8),BH=Math.ceil(H/8),blk=new Float32Array(BW*BH),blk2=new Float32Array(BW*BH),glow=new Float32Array(N),T1=new Float32Array(N),T2=new Float32Array(N),base=new Uint32Array(N),CH=new Uint8Array(N);
  const TX=[40,120];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const d1=Math.hypot(x-TX[0],(y-10)*1.25)*2,d2=Math.hypot(x-TX[1],(y-10)*1.25)*2;
    T1[i]=clamp((1-d1/125)*2.3-.35,0,1);T2[i]=clamp((1-d2/125)*2.3-.35,0,1);}
  const EM=new Set([...PAL.AC,...PAL.SL.slice(0,4),...PAL.FLAME]);
  let view='final',t=0,fr=0;c.seg('view',v=>view=v);c.btn('clear',()=>{r.A.fill(0);});
  pointer(cv,([x,y],k)=>{if((k==='down'||k==='drag')&&y>15)r.spill(x,y,k==='down'?6:3,k==='down'?1.1:.5);});
  function computeGlow(){blk.fill(0);for(let y=0;y<H;y++){const by=y>>3;for(let x=0;x<W;x++){const a=r.A[y*W+x];if(a>0)blk[by*BW+(x>>3)]+=Math.min(a,1.2);}}
    for(let p=0;p<2;p++){for(let y=0;y<BH;y++)for(let x=0;x<BW;x++){let s=0,w=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=BW||Y>=BH)continue;const k=(2-Math.abs(dx))*(2-Math.abs(dy));s+=blk[Y*BW+X]*k;w+=k;}blk2[y*BW+x]=s/w;}blk.set(blk2);}
    for(let y=0;y<H;y++){const fy=Math.min(BH-1.001,Math.max(0,y/8-.5)),y0=fy|0,ty=fy-y0;for(let x=0;x<W;x++){const fx=Math.min(BW-1.001,Math.max(0,x/8-.5)),x0=fx|0,tx=fx-x0;
      const a=blk[y0*BW+x0],b=blk[y0*BW+x0+1],cc=blk[(y0+1)*BW+x0],d=blk[(y0+1)*BW+x0+1];glow[y*W+x]=clamp(((a+(b-a)*tx)*(1-ty)+(cc+(d-cc)*tx)*ty)/12-.35,0,1);}}}
  computeGlow();
  return {tick(dt){t+=dt;fr++;r.step({evap:false,react:false,gas:false,samples:0});if(fr%4===0)computeGlow();
    r.render(base,t,{haze:false});
    for(const tx of TX){base[12*W+tx]=PAL.HOLDER;base[13*W+tx]=PAL.HOLDER;base[11*W+tx-1]=PAL.HOLDER;base[11*W+tx+1]=PAL.HOLDER;const fl=(fr>>2)%3;base[10*W+tx]=PAL.FLAME[1];base[9*W+tx]=PAL.FLAME[fl===0?0:1];base[8*W+tx+(fl===1?1:0)]=PAL.FLAME[2];}
    const f1=.86+.14*Math.sin(fr*.37)*Math.sin(fr*.13),f2=.86+.14*Math.sin(fr*.29+1)*Math.sin(fr*.17),torch=c.v('torch');const u=px.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,b=bay(x,y),lg=glow[i],lt=torch?T1[i]*f1+T2[i]*f2:0,col=base[i],em=EM.has(col);
      const ch=(lg*20>b+2&&lg>=lt*.6)?2:(lt*19>b?1:0);CH[i]=ch;
      if(view==='mask')u[i]=ch===2?PAL.AC[3]:ch===1?C32('#c27a2c'):C32('#281039');
      else if(view==='glow')u[i]=OHEAT[(lg*255)|0];
      else u[i]=em?(ch===0?(()=>{const [R,G,B]=un32(col);return pack(R*.94,G*.94,B*.94);})():col):ch===2?glowC(col):ch===1?torchC(col):dimC(col);}
    if(c.v('blocks')){for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(x%8===0||y%8===0){const i=y*W+x;u[i]=mix32(u[i],C32('#ffb86b'),.35);}}
      for(let by=0;by<BH;by++)for(let bx=0;bx<BW;bx++){const v=blk[by*BW+bx];if(v>2){const i=(by*8+4)*W+bx*8+4;if(i<N)u[i]=PAL.WHITE;}}}
    px.put();if(fr%10===0){let g=0,tt=0;for(let i=0;i<N;i++){if(CH[i]===2)g++;else if(CH[i]===1)tt++;}setHud(root,`glow ${(g/N*100).toFixed(0)} % · torch ${(tt/N*100).toFixed(0)} % · dim ${(100-(g+tt)/N*100).toFixed(0)} % of pixels`);}}};});

// ======================================================================
// FIG 21: ramp builder + colour-vision simulation, acid vs poison
// ======================================================================
reg('ramp',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,N=W*H,c=ctl(root),sw=$('[data-sw]',root);let rampK='ooze',cvd='none',t=0,fr=0;
  c.seg('ramp',v=>{rampK=v;});c.seg('cvd',v=>{cvd=v;});
  const hsl=(h,s,l)=>{h=((h%360)+360)%360/360;const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;const f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};return pack(f(h+1/3)*255,f(h)*255,f(h-1/3)*255);};
  function ramp(){if(rampK==='ooze')return H32(OOZE);if(rampK==='sbx')return [C32('#0f200b'),C32('#2c5d20'),PAL.AC[4],PAL.AC[3],PAL.AC[2],PAL.AC[1],PAL.AC[0],PAL.AC[5]];
    const sh=c.v('sh'),li=c.v('li'),o=[];for(let k=0;k<8;k++){const tt=k/7;let h=sh+((li+360-sh)%360)*tt;const s=.55+.35*Math.sin(tt*Math.PI)-.25*tt*tt;o.push(hsl(h,clamp(s,.15,.95),.06+.84*Math.pow(tt,1.1)));}return o;}
  const POI=H32(['#1a0d22','#281039','#3d2050','#5b3a86','#7d5aa8','#b493d6']);
  const MATS={prot:[[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]],deut:[[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]],trit:[[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.303900]]};
  const lin=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);},gam=v=>255*(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055);
  const sim=col=>{if(cvd==='none')return col;const [r,g,b]=un32(col);if(cvd==='grey'){const y=.2126*lin(r)+.7152*lin(g)+.0722*lin(b);const v=gam(y);return pack(v,v,v);}
    const M=MATS[cvd],R=lin(r),G=lin(g),B=lin(b);return pack(gam(clamp(M[0][0]*R+M[0][1]*G+M[0][2]*B,0,1)),gam(clamp(M[1][0]*R+M[1][1]*G+M[1][2]*B,0,1)),gam(clamp(M[2][0]*R+M[2][1]*G+M[2][2]*B,0,1)));};
  const BG=new Uint32Array(N),DA=new Float32Array(N),DP=new Float32Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;BG[i]=(x%16===0||y%16===0)?PAL.FLR[3]:hash2(x>>4,y>>4)<.5?PAL.FLR[0]:PAL.FLR[1];
    DA[i]=1-Math.hypot((x-44)/34,(y-38)/24)+(vnoise(x/4,y/4)-.5)*.35;DP[i]=1-Math.hypot((x-132)/34,(y-38)/24)+(vnoise(x/9+7,y/9)-.5)*.2;}
  const bubbles=[],motes=[];for(let k=0;k<26;k++)motes.push({x:110+rnd()*44,y:22+rnd()*32,v:2+rnd()*3,ph:rnd()*6});
  return {tick(dt){t+=dt;fr++;c.out('sh',c.v('sh')+'°');c.out('li',c.v('li')+'°');const R=ramp(),cues=c.v('cues'),u=px.u32;
    if(cues&&rnd()<dt*6&&bubbles.length<8){for(let k=0;k<10;k++){const x=14+ri(60),y=18+ri(40);if(DA[y*W+x]>.25){bubbles.push({x,y,t:0,steam:rnd()<.4});break;}}}
    for(let i=0;i<N;i++){const x=i%W,y=(i/W)|0;let col=BG[i];const a=DA[i],p=DP[i];
      if(cues){if(a>0){const ring=a<.12;col=ring?(bay(x,y)<10?R[1]:R[0]):a<.3?R[4]:a<.6?R[5]:R[6];const w=Math.sin(x*.4+t*1.6+Math.sin(y*.35+t)*1.4);if(!ring&&w>.93)col=R[7];}
        else if(a>-.06&&hash2(x,y)<.5)col=R[0];
        if(p>-.12){const q=(p+.12)/.6;if(q*16>bay(x,y)+(p<0?6:0))col=q<.35?POI[2]:q<.7?POI[3]:POI[4];}}
      else{if(a>.05)col=a<.3?R[4]:R[5];if(p>.05)col=p<.3?POI[3]:POI[4];}
      u[i]=col;}
    if(cues){for(let k=bubbles.length-1;k>=0;k--){const b=bubbles[k];b.t+=dt;const i=b.y*W+b.x;if(b.t<.25)u[i]=R[7];else if(b.t<.5){u[i-1]=R[7];u[i+1]=R[7];u[i-W]=R[7];}else if(b.steam&&b.t<1.6){const y=(b.y-(b.t-.5)*14)|0;if(y>1&&bay(b.x,y)<(1.6-b.t)*12)u[y*W+b.x+(((b.t*3)|0)&1)]=PAL.SMOKE;}else bubbles.splice(k,1);}
      for(const m of motes){m.x+=Math.sin(t*.7+m.ph)*dt*m.v;m.y+=Math.cos(t*.5+m.ph)*dt*m.v*.6;const xi=m.x|0,yi=m.y|0;if(xi>0&&yi>0&&xi<W&&yi<H&&DP[yi*W+xi]>-.1)u[yi*W+xi]=POI[5];}}
    for(let i=0;i<N;i++)u[i]=sim(u[i]);px.put();
    if(fr%10===0)sw.innerHTML=R.map((col,k)=>`<span class="sw"><i style="background:${css(sim(col))}"></i>${'#'+un32(col).map(v=>v.toString(16).padStart(2,'0')).join('')}</span>`).join('');}};});

// ======================================================================
// FIG 22: scorecard heat table + radar
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#1f2a17','#2f4a1f','#4f7a28','#86c43a','#c8f25a'];const RL=['Simplicity','Speed','Pixel taste','Reactivity','Fairness'];const SC=['#ffb86b','#6dd4c3','#c9a2ff'];
  let sel=['D4','E2','A1'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','React.','Fair.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th><th data-s="cost">Cost class</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'||sortK==='cost'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}" tabindex="0"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#0c0f0a':'#e2ead8'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td><td class="cost">${s.cost}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name'||k==='cost')?1:-1;}rows();});
  const pick=tr=>{const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();};
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(tr)pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr&&!e.target.closest('a')){e.preventDefault();pick(tr);}}});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-34 0 ${S+68} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++)svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#3b4a31':'#1f281a'},svg);
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#1f281a'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// FIG 23: acid x materials matrix with a mini corrosion demo per row
// ======================================================================
reg('materials',root=>{const tbody=$('tbody',root),cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('[data-ro]',root);
  tbody.innerHTML=MATROWS.map((m,i)=>`<tr tabindex="0" data-i="${i}"><th scope="row">${m.m}</th><td>${m.rate}</td><td>${m.prop}</td><td>${m.stages}</td><td>${m.cue}</td><td>${m.hook}</td></tr>`).join('');
  const KIND={Wood:['plank',M_WOOD],'Iron / steel':['plate',M_IRON],Bone:['bonepile',M_BONE],Leather:['strap',M_LEATH],Cloth:['rug',M_CLOTH],Gold:['coins',M_GOLD]};
  let r,sel=1,obj=null,t=0,fr=0,flask=null,hp=100,hurt=0,siz=0,start=0;
  function setup(){const name=MATROWS[sel].m;r=Room(W,H,{tile:16,seed:80+sel,react:4});obj=null;flask=null;hp=100;t=0;start=0;
    if(KIND[name]){obj=r.item(KIND[name][0],38,26);start=obj.px.length;r.spill(48,32,13,1.2);}
    else if(name==='Stone'){r.wall(36,22,24,14);r.spill(48,42,12,1.1);}
    else if(name==='Glass'){for(let y=34;y<38;y++)for(let x=36;x<60;x++)r.setObj(x,y,M_WOOD,y===34?0:y===37?2:1,true,null);flask={x:45,y:28,alive:true};r.spill(36,44,9,1.2);}
    else if(name==='Flesh'){r.spill(48,44,12,1.1);}
    for(let k=0;k<60;k++)r.step({react:false,samples:0});
    $$('tr',tbody).forEach((tr,k)=>tr.classList.toggle('sel',k===sel));}
  const pick=tr=>{sel=+tr.dataset.i;setup();};
  tbody.addEventListener('click',e=>{const tr=e.target.closest('tr');if(tr&&!e.target.closest('a'))pick(tr);});
  tbody.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const tr=e.target.closest('tr');if(tr){e.preventDefault();pick(tr);}}});
  c.btn('again',()=>{r.spill(48,MATROWS[sel].m==='Stone'?42:32,12,1.2);});c.btn('lime',()=>r.lime(48,36,16));
  setup();
  return {tick(dt){t+=dt;fr++;const name=MATROWS[sel].m;for(let k=0;k<4;k++)r.step();r.updParts(dt);
    if(name==='Stone'&&rnd()<dt*8){const i=(rnd()*r.N)|0;if(r.A[i]>.2&&r.parts.length<30)r.parts.push({k:'fizz',x:i%W,y:(i/W)|0,z:0,vx:0,vy:0,vz:6,life:.6,t:0});}
    if(flask&&flask.alive){let held=0;for(let x=44;x<50;x++)if(r.M[34*W+x]===M_WOOD)held++;if(held<3){flask.alive=false;r.spill(48,38,7,1.4);for(let k=0;k<8;k++)r.parts.push({k:'drop',x:47,y:33,z:3,vx:(rnd()-.5)*60,vy:(rnd()-.5)*40,vz:20+rnd()*20,life:1.2,t:0});}}
    const u=px.u32;r.render(u,t);r.drawParts(u);
    for(const q of r.parts)if(q.k==='fizz'){const x=q.x|0,y=(q.y-q.z)|0;if(x>0&&y>0&&x<W&&y<H)u[y*W+x]=PAL.SALT;}
    if(flask&&flask.alive){const S=["..k..",".gGg.","gaaAg","gaAAg","gAAAg",".ggg."],mp={k:STG[M_WOOD][0][1],g:PAL.GLASS[1],G:PAL.GLASS[0],a:PAL.AC[1],A:PAL.AC[2]};for(let y=0;y<6;y++)for(let x=0;x<5;x++){const ch=S[y][x];if(ch!=='.')u[(flask.y+y)*W+flask.x+x]=mp[ch];}}
    if(name==='Flesh'){const i0=46*W+48,af=(r.A[i0]+r.A[i0-1]+r.A[i0+1])/3;if(af>.05){hp-=9*Math.min(1.5,af)*dt;hurt=.12;siz-=dt;if(siz<=0){siz=.12;r.parts.push({k:'smoke',x:48+(rnd()-.5)*5,y:46,z:1,vx:(rnd()-.5)*6,vy:0,vz:14,life:.9,t:0});}}
      if(hp<=0)hp=100;hurt-=dt;drawHero(u,W,H,48,46,{eq:{helm:1,chest:1,boots:0},flash:hurt>0&&(fr&2),tint:af>.05});}
    px.put();
    if(fr%8===0){const m=MATROWS[sel];let live='';
      if(obj){let q=0,n=0;for(const i of obj.px){n++;if(r.M[i]>=M_WOOD)q+=r.Q[i];}const lost=start-q;live=`integrity <b>${Math.round(q/n*100)} %</b> · acid spent ≈ <b>${(lost*.55).toFixed(1)} u</b> (0.55 × ${lost.toFixed(1)} lost)`;}
      else if(name==='Flesh')live=`HP <b>${Math.max(0,hp).toFixed(0)}</b> · bare feet: 9 × min(1.5, depth) HP/s`;else if(name==='Stone')live='Floor and walls only stain; limestone would fizz';else if(name==='Glass')live=flask&&flask.alive?'The flask is an entity: intact until the table under it is eaten':'The table gave way: the flask broke and became the spill';
      ro.innerHTML=`<b>${m.m}</b> · ${live} · acid ${r.total().toFixed(0)} u`;setHud(root,`${m.m} · 4× time`);}}};});

// ======================================================================
// FIG 24: equipment models over N hits
// ======================================================================
reg('equip',root=>{const box=$('[data-rows]',root),c=ctl(root);let seed=7;c.btn('roll',()=>{seed=(Math.random()*1e9)|0;draw();});
  function R(){let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
  function draw(){const N=c.v('n'),rest=c.v('rest');c.out('n',N);c.out('rest',rest);const rnd2=R();
    let tier=0;for(let k=0;k<N;k++)if(tier<3&&rnd2()<1/6)tier++;
    let corr=0,dur=0;for(let k=0;k<N;k++){if(!(rnd2()*(corr+28)<corr)){corr+=4;dur=Math.min(50,dur+10+2+((rnd2()*4)|0)+((rnd2()*4)|0));}dur=Math.max(0,dur-1);if(dur===0)corr=0;}
    const dur2=Math.max(0,dur-rest),corr2=dur2>0?corr:0;
    const rows=[
      {k:'NetHack weapon',d:`1/6 per hit · tier ${tier}/3 · damage −${tier}`,v:tier/3,seg:3,perm:true,txt:['','corroded','very corroded','thoroughly corroded'][tier]},
      {k:'Brogue',d:`−1 enchant per hit, warned first · floor −10`,v:Math.min(10,N)/10,seg:10,perm:true,txt:`enchant ${Math.max(-10,0-N)}`},
      {k:'D&D 5e',d:`−1 cumulative · destroyed at −5`,v:Math.min(5,N)/5,seg:5,perm:true,txt:N>=5?'destroyed':`−${N}`},
      {k:'DCSS (temporary)',d:`stack lands if !x_chance_in_y(corr, corr+28) · −1 AC per point`,v:Math.min(28,corr2)/28,seg:7,perm:false,txt:corr2?`−${corr2} AC for ${dur2} more turns`:(corr?'worn off after rest':'none')},
      {k:'Sandbox sword',d:`−0.06 integrity per hit on a slime`,v:Math.min(1,N*.06),seg:0,perm:true,txt:`${Math.max(0,100-N*6)} %${N>=17?' (empty)':''}`},
      {k:'XCOM 2 acid grenade',d:`shred 2 per grenade (starting armour 4, illustrative)`,v:Math.min(4,N*2)/4,seg:2,perm:true,txt:`armour ${Math.max(0,4-N*2)}`}];
    box.innerHTML=rows.map(r2=>`<div class="eq"><div class="eq-l"><b>${r2.k}</b><small>${r2.d}</small></div><div class="eq-bar ${r2.perm?'perm':'temp'}" style="--v:${(r2.v*100).toFixed(1)}%;--seg:${r2.seg}"><i></i></div><div class="eq-v">${r2.txt}<small>${r2.perm?'permanent':'recovers'}</small></div></div>`).join('');}
  c.on('n',draw);c.on('rest',draw);draw();return {};});

// ======================================================================
// FIG 25: the worked example on a log time axis (small multiples)
// ======================================================================
reg('timex',root=>{const svg=$('svg.timex',root),c=ctl(root),ro=$('[data-ro]',root);
  const P=[{k:'Wetted area (px)',col:'#c8f25a',pts:[[.5,317],[1,596],[5,866],[10,917]],dash:[[10,917],[90,917]],drop:90,max:1000},
    {k:'Acid in the puddle (units)',col:'#86c43a',pts:[[.5,289],[10,268],[60,145],[90,0]],max:300},
    {k:'Fume peak, big spill on the chestplate',col:'#c9a2ff',pts:[[1,1.16],[10,.38]],lines:[[.07,'haze'],[.3,'harm']],max:1.25},
    {k:'Visible stain pixels',col:'#ffb86b',pts:[[10,5],[30,67],[80,134],[600,125],[1200,104],[1800,52]],max:150},
    {k:'Rusty pixels (small spill at the chestplate)',col:'#c0713f',pts:[[120,4],[300,20],[600,43],[1500,50]],max:55}];
  const STEPS=[[.4,1.2,'1. Spill: a flask-sized disc (radius 10, depth 1.3 at the centre) puts 289 acid units on 317 px.'],
    [.4,10,'2. Spread: 596 px after 1 s, 866 px after 5 s, 917 px at 10 s (about 3.6 floor tiles, mean depth 0.29). Then FILM = 0.3 freezes the outline.'],
    [10,90,'3. Evaporation: interior cells lose 0.0024/s, edges 1.8×, thin cells extra. The puddle thins without shrinking: 268 u at 10 s, 145 at 60 s, dry at ~90 s.'],
    [1,10,'4. Fumes: evaporation alone peaks at 0.008 (invisible). The big spill on the chestplate peaks at 1.16 after ~1 s, ≈ 2.6 HP/s at head height, and falls to 0.38 by 10 s.'],
    [5,20,'5. Corrosion: the sword averages 0.61 integrity at 5 s and 0.37 at 10 s; all iron is gone by 20 s, leaving 2 gold pixels. The chestplate goes in ~20 s.'],
    [10,1800,'6. Stains: 5 visible at 10 s, 67 at 30 s, 134 at 80 s, mostly the frozen outline. After drying: 125 at 10 min, 104 at 20 min, 52 at 30 min.'],
    [60,1500,'7. Rust: starts once the 39 damaged pixels are dry (~60 s): 4 at 2 min, 20 at 5 min, 43 at 10 min (spread to 11 clean neighbours), all 50 by ~25 min.']];
  function draw(){const st=c.v('st');c.out('st',st);const cp=root.clientWidth<600;const Wd=cp?420:760,ph=cp?84:80,gap=24,Lm=cp?8:44,Rm=10,T=8;const Hd=T+P.length*(ph+gap)+26;
    svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);svg.innerHTML='';const lx=t=>Math.log10(t),X=t=>Lm+(lx(t)-lx(.4))/(lx(2400)-lx(.4))*(Wd-Lm-Rm);
    const [a,b,txt]=STEPS[st-1];svgEl('rect',{x:X(a),y:T,width:X(b)-X(a),height:Hd-T-26,fill:'#c8f25a','fill-opacity':.07},svg);
    const TK=[[1,'1 s'],[10,'10 s'],[60,'1 min'],[600,'10 min'],[1800,'30 min']];
    for(const [tt,l] of TK){svgEl('line',{x1:X(tt),x2:X(tt),y1:T,y2:Hd-26,class:'gl'},svg);svgText(svg,X(tt),Hd-10,l,{'text-anchor':'middle'});}
    P.forEach((p,k)=>{const y0=T+k*(ph+gap)+14,Y=v=>y0+ph-v/p.max*(ph-18);svgText(svg,Lm+2,y0-3,p.k,{class:'lab','font-size':12});svgEl('line',{x1:Lm,x2:Wd-Rm,y1:y0+ph,y2:y0+ph,class:'ax'},svg);
      if(p.lines)for(const [v,l] of p.lines){svgEl('line',{x1:Lm,x2:Wd-Rm,y1:Y(v),y2:Y(v),stroke:'#93a08a','stroke-dasharray':'3 3'},svg);svgText(svg,l==='haze'?Lm+2:Wd-Rm-2,Y(v)-3,l+' '+v,{'text-anchor':l==='haze'?'start':'end','font-size':11});}
      if(p.dash){svgEl('path',{d:`M${X(p.dash[0][0])},${Y(p.dash[0][1])}L${X(p.dash[1][0])},${Y(p.dash[1][1])}L${X(p.drop)},${Y(0)}`,fill:'none',stroke:p.col,'stroke-dasharray':'4 4','stroke-opacity':.7},svg);
        svgText(svg,X(30),Y(917)+16,'outline frozen, thinning (described)',{'text-anchor':'middle','font-size':11});}
      svgEl('path',{d:p.pts.map((q,i)=>(i?'L':'M')+X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1)).join(''),fill:'none',stroke:p.col,'stroke-width':2},svg);
      for(const q of p.pts){const g=svgEl('g',{},svg);svgEl('circle',{cx:X(q[0]),cy:Y(q[1]),r:3.5,fill:p.col},g);if(!cp||q===p.pts[p.pts.length-1]||q===p.pts[0])svgText(g,X(q[0]),Y(q[1])-6,q[1],{'text-anchor':'middle','font-size':10.5,class:'lab'});}});
    ro.innerHTML=txt;}
  c.on('st',draw);draw();let lastCp=root.clientWidth<600;addEventListener('resize',()=>{const cp=root.clientWidth<600;if(cp!==lastCp){lastCp=cp;draw();}});return {};});

// ======================================================================
// FIG 26: layered architecture as a clickable stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[0]);return {};});
