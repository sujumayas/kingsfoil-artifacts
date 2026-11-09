
// ======================================================================
// FIG 20: warm-light / cold-shadow ramp builder
// ======================================================================
function hsl2c(h,s,l){h=((h%360)+360)%360/360;const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;const f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};return pack(f(h+1/3)*255,f(h)*255,f(h-1/3)*255);}
reg('ramp',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),sw=$('.swatches[data-gen]',root),ref=$('.swatches[data-ref]',root),ro=$('.readout',root);
  // height mound for preview
  const D=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x-W*.4)/(W*.32),dy=(y-H*.55)/(H*.42),r=dx*dx+dy*dy;D[y*W+x]=Math.max(0,1-r)*40+vnoise(x/8,y/8)*8+Math.max(0,1-((x-W*.8)**2/90+(y-H*.35)**2/50))*20;}
  const REF=[['highlight','#f6f9ff'],['base','#e2eaf6'],['mid','#c4d1ea'],['shadow','#9eaedb'],['deep','#7c86c2'],['packed','#c9cfe2'],['packed sh.','#a6aecf'],['sparkle','#ffffff']];
  ref.innerHTML=REF.map(([n,h])=>`<button type="button" class="sw" data-h="${h}" style="background:none;border:0;cursor:pointer"><i style="background:${h}"></i>${n}<br>${h}</button>`).join('');
  ref.addEventListener('click',e=>{const b=e.target.closest('[data-h]');if(!b)return;const col=C32(b.dataset.h),s=shadeC(col),[r,g,bb]=un32(s);
    ro.innerHTML=`shadow variant of <b>${b.dataset.h}</b> = (r·0.72, g·0.77, b·0.9 + 12) = <span style="display:inline-block;width:14px;height:12px;background:${css(s)};vertical-align:-1px"></span> rgb(${r}, ${g}, ${bb})`;});
  let ramp=[];
  function build(){const n=c.v('n'),lw=c.v('lw'),sc=c.v('sc'),white=c.v('white');c.out('n',n);c.out('lw',lw<50?'cool':lw>50?'warm':'neutral');c.out('sc',sc<50?'grey':'blue-violet');
    const shC=hsl2c(lerp(215,252,sc/100),lerp(.06,.4,sc/100),.5),baseC=hsl2c(222,.3,.86),liC=lw>=50?hsl2c(42,lerp(.1,.85,(lw-50)/50),.95):hsl2c(212,lerp(.1,.6,(50-lw)/50),.95);
    ramp=[];for(let k=0;k<n;k++){const t=k/(n-1);ramp.push(t<.6?mix32(shC,baseC,t/.6):mix32(baseC,liC,(t-.6)/.4));}
    if(white)ramp=ramp.map(()=>pack(250,250,250));
    sw.innerHTML=ramp.map((col,i)=>`<span class="sw"><i style="background:${css(col)}"></i>${i===0?'deep':i===ramp.length-1?'light':''}</span>`).join('');
    const u=px.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const l=x>0?D[i-1]:D[i],r=x<W-1?D[i+1]:D[i],up=y>0?D[i-W]:D[i],dn=y<H-1?D[i+W]:D[i];
      const sl=(r-l)+(dn-up);const lit=clamp(.55-sl*.08,0,1);let k=clamp(Math.floor(lit*(n-1)+(bay(x,y)/16-.5)*.9),0,n-1);u[i]=ramp[k];}
    // a character for contrast
    drawKid(u,W,H,W*.62,H*.8,0,0);px.put();}
  ['n','lw','sc','white'].forEach(k=>c.on(k,build));build();return {};});

// ======================================================================
// FIG 21: Bayer matrix explainer
// ======================================================================
reg('bayer',root=>{const grid=$('.bgrid',root),cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),ro=$('.readout',root);
  grid.innerHTML=BAYER.map((m,i)=>`<div tabindex="0" data-i="${i}">${m}</div>`).join('');const cells=$$('div',grid);
  const say=i=>{const m=BAYER[i];ro.innerHTML=`cell (x=${i%4}, y=${i>>2}) · M = <b>${m}</b> · threshold (M + 0.5)/16 = <b>${((m+.5)/16).toFixed(4)}</b> · turns white once the level passes it`;cells.forEach((d,k)=>d.classList.toggle('hl',k===i));};
  grid.addEventListener('pointerover',e=>{const d=e.target.closest('[data-i]');if(d)say(+d.dataset.i);});grid.addEventListener('focusin',e=>{const d=e.target.closest('[data-i]');if(d)say(+d.dataset.i);});
  function draw(){const lv=c.v('lv')/100,noise=c.v('noise'),five=c.v('five');c.out('lv',lv.toFixed(2)+` (${Math.round(lv*16)}/16 cells)`);
    cells.forEach((d,i)=>{const on=lv>(BAYER[i]+.5)/16;d.className=(on?'w':'g')+(d.classList.contains('hl')?' hl':'');});
    const u=px.u32,half=H>>1;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let b=bay(x,y)/16+.5/16;if(noise)b=clamp(b*.7+hash2(x,y)*.3,0,1);let col;
      if(y<half){const v=x<W*.5?x/(W*.5):lv;col=v>b?COL.BASE:COL.GR_A;if(x>=W*.5&&x<W*.5+1)col=C32('#ffb86b');}
      else{const d=x/W;if(five){const R=[COL.DEEP,COL.SH,COL.MID,COL.BASE,COL.HI];const s=clamp(Math.floor(d*4+(b-.5)),0,4);col=R[s];}else col=d>b?COL.BASE:COL.GR_A;}
      u[y*W+x]=col;}
    const mx=Math.round(lv*W*.5);for(let y=0;y<half;y+=2)if(mx<W)u[y*W+Math.min(W-1,mx)]=C32('#ffb86b');px.put();}
  ['lv','noise','five'].forEach(k=>c.on(k,draw));draw();say(5);return {};});

// ======================================================================
// FIG 22: emboss shading from neighbour differences (+ sparkle)
// ======================================================================
reg('emboss',root=>{const cv=$('canvas',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root);const f=Field(W,H,{seed:33});
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let d=30+vnoise(x/7,y/7)*44;const r=Math.abs(x-W*.66-(y-H/2)*.4);if(r<12)d+=(12-r)*7;f.D[i]=Math.min(200,d)|0;}
  for(let k=0;k<26;k++){f.stamp(8+k*3.5,H*.3+Math.sin(k*.5)*6+(k&1),2,2,.3,255);}
  for(let k=0;k<16;k++)f.stamp(W*.15+k*1.2,H*.75-k*1.6,1,1,.45,200);
  let mode='4',fr=0;c.seg('mode',v=>mode=v);
  pointer(cv,([x,y],k)=>{if(k==='down'||k==='drag')f.stamp(x-1,y-1,2,2,.3,255);});
  return {tick(dt){fr++;const k=c.v('k');c.out('k',k);if(fr%2===0)f.sandpile(300);
      if(mode==='4')f.render(px.u32,{sparkle:c.v('spark'),frame:fr});
      else{const u=px.u32;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,d=f.D[i];let col;
        if(f.P[i]>110)col=COL.PACK;else if(mode==='off')col=COL.BASE;else{const j=(y<H-1&&x<W-1)?i+W+1:i;const s=d-f.D[j];col=s>k?COL.SH:s<-k?COL.HI:COL.BASE;}
        if(c.v('spark')&&mode!=='off'&&((Math.imul(i^((fr>>3)*2654435761),2246822519)>>>23)===0))col=COL.SPARK;u[i]=col;}}
      px.put();}};});

// ======================================================================
// FIG 23: palette day/night tinting + dithered lamp pool (index buffer)
// ======================================================================
reg('daynight',root=>{const cv=$('canvas.scene',root),px=PX(cv),W=px.W,H=px.H,c=ctl(root),pc=$('canvas.pstrip',root),pctx=pc.getContext('2d'),ro=$('.readout',root);
  const BASE=['#2f4a3c','#3b5a45','#4a6b4b','#6a5140','#f6f9ff','#e2eaf6','#c4d1ea','#9eaedb','#7c86c2','#c9cfe2','#a6aecf','#8a3b3b','#6e2c31','#4a1f27','#8b6a4a','#7a5b3f','#4d3826','#3d2a1d','#7f9fbf','#2f6b4f','#24553f','#1a3d30','#5a3b28','#2c2a33','#ffd27a','#8a8f9a','#6f7480','#ffffff'].map(hexRGB);
  const NB=BASE.length,WIN=18,LAMP=24;const RGB=[];for(const [r,g,b] of BASE)RGB.push([r,g,b]);for(const [r,g,b] of BASE)RGB.push([r*.72,g*.77,b*.9+12]);
  const NP=RGB.length;pc.width=NP;pc.height=2;
  // build the index scene once (snow field + house + trees + lamp)
  const f=Field(W,H,{seed:51});buildScene(f,{hx:10,hy:6,hw:40,rh:16,wh:13,trees:[[70,24],[112,22],[100,62]],rocks:[[24,58]],fences:[]});
  for(let i=0;i<f.N;i++)if(f.holds(f.S[i]))f.D[i]=((f.S[i]===2?12:40)*Math.min(1,f.E[i]+.3)+vnoise((i%W)/8,(i/W|0)/8)*12)|0;
  const LX=80,LY=46;for(let y=LY-14;y<=LY;y++)f.put(LX,y,9,C32('#2c2a33'),0,LY,false);for(let y=LY-17;y<=LY-15;y++)for(let x=LX-1;x<=LX+1;x++)f.put(x,y,9,C32('#ffd27a'),0,LY,false);
  const tmp=new Uint32Array(W*H);f.render(tmp,{});const IDX=new Uint8Array(W*H);
  const lut=new Map();BASE.forEach(([r,g,b],k)=>lut.set(pack(r,g,b),k));
  for(let i=0;i<W*H;i++){let k=lut.get(tmp[i]);if(k===undefined){// nearest base colour
      const [r,g,b]=un32(tmp[i]);let best=0,bd=1e9;BASE.forEach(([R,G,B],j)=>{const d=(R-r)**2+(G-g)**2+(B-b)**2;if(d<bd){bd=d;best=j;}});k=best;}IDX[i]=k;}
  // cast shadows from the shadow bake use the second variant
  for(let i=0;i<W*H;i++)if(f.SH[i])IDX[i]+=NB;
  const pal=new Uint32Array(NP),palL=new Uint32Array(NP);const daylight=h=>clamp(Math.sin((h-6)/12*Math.PI)*1.6,0,1);
  let playing=false;c.btn('play',b=>{playing=!playing;b.classList.toggle('on',playing);b.textContent=playing?'Pause the clock':'Run the clock';});
  return {tick(dt){const te=c.el('h');if(playing){te.value=(+te.value+dt*60)%1440;}const h=+te.value/60;const hh=String(h|0).padStart(2,'0'),mm=String(((h%1)*60)|0).padStart(2,'0');c.out('h',`${hh}:${mm}`);
      const rad=c.v('rad'),lampOn=c.v('lamp');c.out('rad',rad+' px');
      const dl=daylight(h),nf=1-Math.min(1,dl*1.4),warm=Math.max(0,1-Math.abs(dl-.18)/.18);
      const r=.34+.66*dl+.16*warm,g=.4+.6*dl+.02*warm,b=.66+.34*dl-.08*warm;
      for(let i=0;i<NP;i++){let [R,G,Bc]=RGB[i];R*=r;G*=g;Bc*=b;const base=i%NB;
        if(base===WIN||base===LAMP){const e=base===LAMP?Math.max(nf,.25):nf;const wg=base===LAMP?214:196,wb=base===LAMP?130:96;R=R*(1-e)+255*e;G=G*(1-e)+wg*e;Bc=Bc*(1-e)+wb*e;}
        pal[i]=pack(R,G,Bc);const L=nf*.8,o=RGB[i];palL[i]=pack(R+(o[0]*.98+14-R)*L,G+(o[1]*.82+4-G)*L,Bc+(o[2]*.58-Bc)*L);}
      const u=px.u32,on=lampOn&&nf>.25;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let use=false;if(on){const dx=(x-LX)/rad,dy=(y-LY+2)/(rad*.6),rr=Math.sqrt(dx*dx+dy*dy);const lm=Math.pow(Math.max(0,1-rr),1.4);use=lm*nf*22>bay(x,y);}
        u[i]=use?palL[IDX[i]]:pal[IDX[i]];}
      px.put();for(let i=0;i<NP;i++){pctx.fillStyle=css(pal[i]);pctx.fillRect(i,0,1,1);pctx.fillStyle=css(palL[i]);pctx.fillRect(i,1,1,1);}
      ro.innerHTML=`daylight <b>${dl.toFixed(2)}</b> · tint (${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)}) · palette entries recomputed: <b>${NP*2}</b> · index buffer writes: <b>0</b> · lamp: ${on?'1 Bayer compare per pixel':'off (daylight)'}`;}};});

// ======================================================================
// FIG 25: scorecard heat table + radar (pick up to 3)
// ======================================================================
reg('score',root=>{const tbody=$('tbody',root),thead=$('thead',root),svg=$('svg',root),keys=$('.radar-keys',root);
  const HC=['#26305a','#33467c','#5672b0','#8fb4e8','#cfe6ff'];const RL=['Simplicity','Speed','Pixel taste','Aliveness','Interactivity'];const SC=['#ffb86b','#8fd3ff','#9fe3b5'];
  let sel=['C2','A4','B4'],sortK='id',dir=1;
  thead.innerHTML='<tr><th data-s="id">#</th><th data-s="name">Technique</th>'+RL.map((l,i)=>`<th data-s="${i}" title="${l}">${['Simpl.','Speed','Taste','Alive','Inter.'][i]}</th>`).join('')+'<th data-s="sum">Sum</th><th data-s="cost">Cost class</th></tr>';
  function rows(){const r=SCORE.slice();r.sort((a,b)=>{let va,vb;if(sortK==='id'||sortK==='name'||sortK==='cost'){va=a[sortK];vb=b[sortK];return va<vb?-dir:va>vb?dir:0;}
      if(sortK==='sum'){va=a.sum;vb=b.sum;}else{va=a.r[+sortK];vb=b.r[+sortK];}return (va-vb)*dir||(a.id<b.id?-1:1);});
    tbody.innerHTML=r.map(s=>`<tr data-id="${s.id}" class="${sel.includes(s.id)?'sel':''}"><td><a href="#t-${s.id.toLowerCase()}">${s.id}</a></td><td class="nm">${s.name}</td>${s.r.map(v=>`<td class="h" style="background:${HC[v-1]};color:${v>=4?'#0b1020':'#dbe4f5'}">${v}</td>`).join('')}<td class="sum">${s.sum}</td><td class="cost">${s.cost}</td></tr>`).join('');
    $$('th',thead).forEach(th=>th.setAttribute('aria-sort',th.dataset.s===sortK?(dir>0?'ascending':'descending'):'none'));}
  thead.addEventListener('click',e=>{const th=e.target.closest('th');if(!th)return;const k=th.dataset.s;if(sortK===k)dir=-dir;else{sortK=k;dir=(k==='id'||k==='name'||k==='cost')?1:-1;}rows();});
  tbody.addEventListener('click',e=>{if(e.target.closest('a'))return;const tr=e.target.closest('tr');if(!tr)return;const id=tr.dataset.id;if(sel.includes(id))sel=sel.filter(x=>x!==id);else{sel.push(id);if(sel.length>3)sel.shift();}rows();radar();});
  function radar(){const S=300,cx=150,cy=158,R=104;svg.setAttribute('viewBox',`-34 0 ${S+68} 300`);svg.innerHTML='';
    const pt=(k,v)=>{const a=-Math.PI/2+k*2*Math.PI/5;return [cx+Math.cos(a)*R*v/5,cy+Math.sin(a)*R*v/5];};
    for(let v=1;v<=5;v++){svgEl('polygon',{points:[0,1,2,3,4].map(k=>pt(k,v).join(',')).join(' '),fill:'none',stroke:v===5?'#33426a':'#1c2541'},svg);}
    for(let k=0;k<5;k++){const [x,y]=pt(k,5);svgEl('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#1c2541'},svg);const [lx,ly]=pt(k,6.1);svgText(svg,lx,ly+4,RL[k],{'text-anchor':'middle',class:'lab','font-size':12});}
    sel.forEach((id,si)=>{const s=SCORE.find(x=>x.id===id);svgEl('polygon',{points:s.r.map((v,k)=>pt(k,v).join(',')).join(' '),fill:SC[si],'fill-opacity':.14,stroke:SC[si],'stroke-width':2.2},svg);
      s.r.forEach((v,k)=>{const [x,y]=pt(k,v);svgEl('circle',{cx:x,cy:y,r:3,fill:SC[si]},svg);});});
    keys.innerHTML=sel.map((id,si)=>{const s=SCORE.find(x=>x.id===id);return `<span><i style="background:${SC[si]}"></i>${id} ${s.name} · ${s.sum}</span>`;}).join('')||'<span>Click rows to compare</span>';}
  rows();radar();return {};});

// ======================================================================
// FIG 26: Sandbox worked-example rates (bar chart)
// ======================================================================
reg('rates',root=>{const svg=$('svg',root),ro=$('.readout',root);
  const D=[['Heavy snowfall, open ground',1.9,'#8fd3ff'],['Light snowfall (intensity 0.35)',.66,'#8fd3ff'],['Heavy snowfall, in a wall’s lee (E×0.15)',.28,'#8fd3ff'],['Heavy snowfall, at a pine trunk (×0.12)',.23,'#8fd3ff'],
    ['Sunny melt, edge with ≥2 bare neighbours',4.7,'#ffb86b'],['Sunny melt, edge with 1 bare neighbour',4.0,'#ffb86b'],['Sunny melt, interior',1.6,'#ffb86b'],['Sunny melt, packed interior',.8,'#ffb86b'],['Sunny melt, interior in cast shadow',.41,'#ffb86b']];
  function draw(){svg.innerHTML='';const cp=root.clientWidth<600;const Wd=cp?400:720,rowH=cp?40:27,T=8,L=cp?14:300,R=cp?50:60,Hd=T+D.length*rowH+34;svg.setAttribute('viewBox',`0 0 ${Wd} ${Hd}`);const X=v=>L+v/5*(Wd-L-R);
  for(let v=0;v<=5;v++){svgEl('line',{x1:X(v),x2:X(v),y1:T,y2:T+D.length*rowH,class:'gl'},svg);svgText(svg,X(v),T+D.length*rowH+16,v,{'text-anchor':'middle'});}
  svgText(svg,cp?L:X(2.5),Hd-2,cp?'u/s per cell at 2× speed (illustrative)':'depth units per second per cell, at 2× speed (derived from code; illustrative)',{'text-anchor':cp?'start':'middle'});
  D.forEach(([k,v,col],i)=>{const y0=T+i*rowH,y=cp?y0+14:y0;if(cp)svgText(svg,L,y0+12,k,{class:'lab','font-size':12.5});else svgText(svg,L-10,y+17,k,{'text-anchor':'end',class:'lab','font-size':12.5});const g=svgEl('g',{tabindex:0},svg);
    svgEl('rect',{x:X(0),y:y+5,width:X(v)-X(0),height:16,rx:2,fill:col},g);svgText(g,X(v)+6,y+17,v+' u/s',{class:'lab','font-size':12});
    const s=()=>{ro.innerHTML=`<b>${k}</b>: ${v} u/s. ${col==='#ffb86b'?`Edges melt ${(4.0/1.6).toFixed(1)}–${(4.7/1.6).toFixed(1)}× faster than interiors; cast shadow is about 4× slower.`:'Deposition is accepted with probability min(1, E), so shelter scales the rate.'}`;};g.addEventListener('pointerenter',s);g.addEventListener('focus',s);});}
  draw();let lastCp=root.clientWidth<600;addEventListener('resize',()=>{const cp=root.clientWidth<600;if(cp!==lastCp){lastCp=cp;draw();}});
  return {};});

// ======================================================================
// FIG 27: layered architecture as a clickable stack
// ======================================================================
reg('stack',root=>{const det=$('.ldet',root);const btns=$$('.layer',root);
  const show=b=>{btns.forEach(x=>x.classList.toggle('on',x===b));const t=$('template#'+b.dataset.l,root);det.innerHTML='';det.appendChild(t.content.cloneNode(true));};
  btns.forEach(b=>b.addEventListener('click',()=>show(b)));show(btns[0]);return {};});
