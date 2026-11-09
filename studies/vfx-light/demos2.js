// ======================================================================
// B1/B2/A7: one clock, three colourings (tint, keyframed palette + Purkinje, instant swap)
// ======================================================================
reg('daylut',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root),palEl=$('[data-pal]',root);const W=F.W,H=F.H;
  const RAMPS=[['#9ad46a','#6aa850','#4a8040','#2e5430'],['#d8b484','#b08a5a','#8a6640','#5a4028'],['#c8c0b0','#9a948a','#6e6a64','#46423e'],['#d86a52','#a84a3a','#7a3428','#4a2018'],['#6ab4e0','#3e86b8','#2c5e86','#1a3a5a'],['#9a7448','#7a5634','#5a3e26','#3a2818']];
  const BASE=[];RAMPS.forEach(r=>r.forEach(h=>BASE.push(hexf(h).map(v=>v*255))));BASE.push([255,207,106],[255,240,192]);const NE=BASE.length,EM=[24,25];
  const IX=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/9,y/9),h=hash2(x,y);let id=n<.4?2:n<.65?1:0;if(h<.04)id=0;if(h>.97)id=3;
    if(Math.abs(y-50-Math.sin(x/14)*3)<4)id=4+((h<.3)?1:0);if(Math.abs(x-62)<4&&y>50)id=4+(h<.3?1:2);
    const dx=(x-104)/20,dy=(y-58)/9;if(dx*dx+dy*dy<1)id=16+(dx*dx+dy*dy<.4?2:dx*dx+dy*dy>.8?0:1);IX[y*W+x]=id;}
  for(let y=6;y<=24;y++)for(let x=14;x<=54;x++){IX[y*W+x]=12+(((y-6)%4===3)?1:0)+(y===6||y===24||x===14||x===54?2:0);}
  for(let y=25;y<=38;y++)for(let x=16;x<=52;x++){let id=8+(hash2(x,y)<.2?1:0);if(x===16||x===52||y===38)id=11;if(x>=31&&x<=37&&y>=29)id=x===31||x===37||y===29?23:21;
    for(const wx of [20,42])if(x>=wx&&x<=wx+6&&y>=28&&y<=34)id=(x===wx||x===wx+6||y===28||y===34)?22:24;IX[y*W+x]=id;}
  for(let y=4;y<=30;y++)for(let x=72;x<=96;x++){const dx=(x-84)/12,dy=(y-16)/11;if(dx*dx+dy*dy<1+vnoise(x*.5,y*.5)*.2-.1){const sh=dx+dy*.8;IX[y*W+x]=sh<-.5?0:sh<.1?1:sh<.6?2:3;}}
  for(let y=28;y<=36;y++)for(let x=83;x<=85;x++)IX[y*W+x]=20+(x===85?1:0);
  for(let y=30;y<=46;y++)IX[y*W+118]=11;IX[29*W+118]=25;IX[29*W+117]=11;IX[29*W+119]=11;
  const lum=c=>.299*c[0]+.587*c[1]+.114*c[2];
  const KIR={morning:[1,.96,.86],evening:[1,.78,.6],night:[.5,.58,.9]};
  const purk=(i,s)=>{if(EM.includes(i))return BASE[i];const r=Math.floor(i/4),sh=i%4,a=BASE[r*4+(sh&2)],b=BASE[r*4+(sh&2)+1];let col=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
    const Y=lum(col);col=col.map(v=>lerp(v,Y,.6));col=[col[0]*.5,col[1]*.6,col[2]*.95];return BASE[i].map((v,k)=>lerp(v,col[k],s));};
  const mul=(i,m)=>EM.includes(i)?BASE[i]:BASE[i].map((v,k)=>v*m[k]);
  let m='pal',hour=17.2,auto=!reduce,fr=0;c.seg('m',v=>m=v);
  function palette(h){const el=sunEl(h),P=[];
    if(m==='tint'){const a=sky(h).amb;const k=[a[0]/.5,a[1]/.56,a[2]/.7];for(let i=0;i<NE;i++)P.push(BASE[i].map((v,j)=>v*k[j]));return P;}
    if(m==='swap'){const key=el>=20?null:el>0?(h<12?'morning':'evening'):'night';for(let i=0;i<NE;i++){if(!key){P.push(BASE[i]);continue;}if(i===24&&key==='night'){P.push(BASE[i].map(v=>v*.9));continue;}P.push(EM.includes(i)?BASE[i]:BASE[i].map((v,k)=>v*KIR[key][k]));}return P;}
    const gold=h<12?KIR.morning:KIR.evening;
    for(let i=0;i<NE;i++){let col;if(el>=20)col=BASE[i];else if(el>=6){const k=(el-6)/14;col=mul(i,gold).map((v,j)=>lerp(v,BASE[i][j],k));}
      else if(el>=-6){const k=(el+6)/12;const tw=purk(i,.5).map((v,j)=>v*(EM.includes(i)?1:[1,.9,.85][j]));col=tw.map((v,j)=>lerp(v,mul(i,gold)[j],k));}
      else if(el>=-12){const k=(el+12)/6;const tw=purk(i,.5).map((v,j)=>v*(EM.includes(i)?1:[1,.9,.85][j]));col=purk(i,1).map((v,j)=>lerp(v,tw[j],k));}else col=purk(i,1);P.push(col);}return P;}
  const cx=h=>30+h/24*360,cy=v=>130-v*112;const lumD=lum(DAYA);
  function chart(){svg.innerHTML='';for(const h of [0,6,12,18,24]){svgEl('line',{x1:cx(h),x2:cx(h),y1:14,y2:130,class:'gl'},svg);svgText(svg,cx(h),186,String(h).padStart(2,'0')+':00',{'font-size':10,'text-anchor':'middle'});}
    for(let h=0;h<24;h+=.25){const a=sky(h).amb;svgEl('rect',{x:cx(h),y:146,width:360/96+.5,height:22,fill:rgbCss(a[0]/.7*255,a[1]/.7*255,a[2]/.7*255)},svg);}
    svgText(svg,30,142,'Sandbox ambient colour',{'font-size':9.5});
    const p1=[],p2=[];for(let h=0;h<=24;h+=.1){p1.push([cx(h),cy(tfsLight(h*60)/250)]);p2.push([cx(h),cy(lum(sky(h).amb)/lumD)]);}poly(svg,p1,{class:'s1'});poly(svg,p2,{class:'s2'});
    svgText(svg,cx(9),cy(1)+14,'Tibia world light ÷ 250',{'font-size':10,class:'w'});svgText(svg,cx(1),cy(lum(NIGHTA)/lumD)-6,'Sandbox ambient brightness',{'font-size':10,class:'c'});
    svgEl('line',{x1:cx(hour),x2:cx(hour),y1:10,y2:170,class:'now'},svg);svgText(svg,cx(hour)+(hour>18?-4:4),10,fmtH(hour),{'font-size':10,class:'v','text-anchor':hour>18?'end':'start'});
    const hit=svgEl('rect',{x:30,y:0,width:360,height:190,fill:'transparent',class:'drag'},svg);
    const set=e=>{const r=svg.getBoundingClientRect();hour=clamp(((e.clientX-r.left)/r.width*400-30)/360*24,0,23.99);auto=false;};
    hit.addEventListener('pointerdown',e=>{set(e);hit.setPointerCapture(e.pointerId);});hit.addEventListener('pointermove',e=>{if(e.buttons)set(e);});}
  const dayLum=[0,1,2,3].reduce((a,i)=>a+lum(BASE[i]),0)/4;
  return {tick(dt){fr++;if(auto&&motion)hour=(hour+dt*.6)%24;const P=palette(hour);const PK=P.map(c=>pack(c[0],c[1],c[2]));const u=F.u32;for(let i=0;i<W*H;i++)u[i]=PK[IX[i]];F.put();
    if(fr%4===0){chart();palEl.innerHTML=P.map(c=>`<span style="background:${rgbCss(...c)}"></span>`).join('');
      const gl=[0,1,2,3].reduce((a,i)=>a+lum(P[i]),0)/4,ratio=gl/dayLum,el=sunEl(hour);
      setHud(root,`${fmtH(hour)} · sun ${Math.round(el)}°`);
      ro.innerHTML=`${m==='tint'?'one multiply colour for every pixel, lamps and windows included':m==='pal'?'26 palette entries lerped between the two nearest keys; emissive entries exempt':'one palette per phase, switched in a single frame; window yellow held at 0.90 at night'} · ground luma now <b>${(ratio*100).toFixed(0)}%</b> of day ${ratio>=.4?'(above the ~0.4 floor)':'<b>(below the ~0.4 floor for walkable ground)</b>'} · CPU work: ${m==='tint'?'none, but a full-screen multiply':'26 colours per frame'}`;}}};});

// ======================================================================
// B3: per-pixel sun projection (Sandbox) + cheap shadow tiers with 3 nearest lights
// ======================================================================
reg('sunproj',root=>{const cvs=$$('canvas',root),A=PX(cvs[0]),B=PX(cvs[1]),c=ctl(root),svg=$('svg.chart',root),ro=$('[data-ro]',root);
  const V=mkVillage(777);V.npc.show=false;V.player.x=204;V.player.y=98;const X0=150,Y0=14;let t=0,fr=0,tier='rot';c.seg('tier',v=>tier=v);
  const getSun=()=>{let az=c.v('az');if(c.v('q16'))az=Math.round(az/22.5)*22.5%360;return {el:c.v('el'),az};};
  pointer(cvs[0],([x,y],k)=>{if(k!=='down'&&k!=='drag')return;const dx=x-(174-X0),dy=y-(102-Y0);if(Math.hypot(dx,dy)<3)return;let az=Math.atan2(-dx,dy)*180/Math.PI;az=(az+360)%360;c.el('az').value=Math.round(az);});
  // right panel objects
  const PC={h:'#c8443c',H:'#efe6dc',s:'#f0c09a',e:'#2a1b22',y:'#f2c14e',c:'#3c6fb4',C:'#2f5592',l:'#2a2c3a',b:'#5a3a28'};
  const walker={dir:'down',moving:false,anim:0};const [wrows]=charRows(walker);
  const spr=(rows,map)=>{const px=[];rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.')px.push([x-3,y-rows.length+1,U(map[ch])]);}));return px;};
  const barrelPx=[];for(let y=-9;y<=0;y++)for(let x=-3;x<=3;x++)barrelPx.push([x,y,(y===-7||y===-2)?U('#5a5a62'):x<0?U('#9a6a3e'):U('#7a5230')]);
  const signPx=[];for(let y=-11;y<=0;y++)signPx.push([0,y,U('#5a3e26')]);for(let y=-12;y<=-9;y++)for(let x=-4;x<=4;x++)signPx.push([x,y,(y===-12||y===-9||Math.abs(x)===4)?U('#5a3e26'):U('#c8a46a')]);
  const fencePx=[];for(let x=-14;x<=14;x++){const post=((x+14)%7)<1;for(let y=-5;y<=0;y++){if(!post&&y!==-2&&y!==-4)continue;fencePx.push([x,y,post?U('#7a5a3a'):U('#a07a52')]);}}
  const OBJ=[{x:62,y:58,h:12,w:7,px:spr(wrows,PC),n:'walker'},{x:102,y:52,h:10,w:7,px:barrelPx,n:'barrel'},{x:40,y:78,h:6,w:29,px:fencePx,n:'fence'},{x:128,y:74,h:12,w:9,px:signPx,n:'sign'}];
  const lamps=[{x:30,y:30,h:16},{x:88,y:80,h:16},{x:140,y:34,h:16},{x:120,y:56,h:10}];let drag=null;
  pointer(cvs[1],([x,y],k)=>{if(k==='down'){let bd=12;drag=null;for(const L of lamps){const d=Math.hypot(L.x-x,L.y-y);if(d<bd){bd=d;drag=L;}}}if((k==='drag'||k==='down')&&drag){drag.x=clamp(x,2,157);drag.y=clamp(y,2,87);}if(k==='up')drag=null;});
  const grass=new Uint32Array(160*90);for(let y=0;y<90;y++)for(let x=0;x<160;x++){const n=vnoise(x/10,y/10),h=hash2(x+7,y);grass[y*160+x]=h<.04?U('#82b25e'):n<.4?U('#4f7d3e'):n<.65?U('#5f8f48'):U('#6ea052');}
  const SHA=new Float32Array(160*90);
  function shadowStamp(ox,oy,dx,dy,len,wid,a){// rotated ellipse from base toward (dx,dy) with given length
    const L=Math.max(1.5,len),cx=ox+dx*L/2,cy=oy+dy*L/2,rx=L/2+1,ry=Math.max(1.2,wid/2);
    const R=Math.ceil(Math.max(rx,ry))+1;for(let y=Math.floor(cy-R);y<=cy+R;y++)for(let x=Math.floor(cx-R);x<=cx+R;x++){if(x<0||y<0||x>=160||y>=90)continue;const px=x+.5-cx,py=y+.5-cy;const u=(px*dx+py*dy)/rx,v=(-px*dy+py*dx)/ry;if(u*u+v*v<=1){const i=y*160+x;SHA[i]=Math.min(.72,SHA[i]+a);}}}
  function chart(el){svg.innerHTML='';const X=e=>40+e/90*470,Y=v=>104-Math.min(v,10)/10*92;
    for(const v of [0,1,3,5,10]){svgEl('line',{x1:40,x2:510,y1:Y(v),y2:Y(v),class:'gl'},svg);svgText(svg,34,Y(v)+4,v+'h',{'font-size':10,'text-anchor':'end'});}
    for(const e of [0,6,10,20,30,45,60,90])svgText(svg,X(e),117,e+'°',{'font-size':9.5,'text-anchor':'middle'});
    const p=[],q=[];for(let e=.6;e<=90;e+=.4){p.push([X(e),Y(1/Math.tan(e*Math.PI/180))]);q.push([X(e),Y(.62*Math.min(4,1/Math.tan(Math.max(4,e)*Math.PI/180)))]);}poly(svg,p,{class:'s1'});poly(svg,q,{class:'s2','stroke-dasharray':'4 3'});
    for(const [e,v] of [[60,.58],[45,1],[30,1.73],[20,2.75],[10,5.67],[6,9.5]]){svgEl('circle',{cx:X(e),cy:Y(v),r:3,fill:'#ffc870'},svg);}
    svgEl('line',{x1:40,x2:510,y1:Y(3),y2:Y(3),stroke:'#ff8f7a','stroke-dasharray':'2 3'},svg);svgText(svg,506,Y(3)-4,'clamp ~3h',{'font-size':9.5,'text-anchor':'end',fill:'#ff8f7a'});
    svgText(svg,X(12)+4,Y(7.5),'h·cot(el)',{'font-size':9.5,class:'w'});svgText(svg,X(38),Y(5.2),'dashed: Sandbox 0.62·min(4, cot(max(4°, el)))',{'font-size':9.5,class:'c'});
    svgEl('line',{x1:X(el),x2:X(el),y1:10,y2:104,class:'now'},svg);}
  let lastEl=-1;
  return {tick(dt){t+=dt;fr++;const sun=getSun();c.out('el',sun.el+'°');c.out('az',Math.round(sun.az)+'°');
    const r=V.render(A.u32,160,90,X0,Y0,{hour:12,t,sunOv:sun,cap:4,noRemap:!c.v('remap'),mode:'banded',refl:false});A.put();
    // right panel
    const S=skyEl(sun.el,sun.az*Math.PI/180,-90,0,false,4);const u=B.u32;SHA.fill(0);
    const q16=c.v('q16'),qd=(dx,dy)=>{if(!q16)return [dx,dy];const a=Math.round(Math.atan2(dy,dx)/(Math.PI/8))*(Math.PI/8);return [Math.cos(a),Math.sin(a)];};
    const info=[];
    for(const o of OBJ){const srcs=[];if(S.dir)srcs.push({dir:qd(S.dir[0],S.dir[1]),k:S.len,a:.42,sun:1});
      const near=lamps.map(L=>({L,d:Math.hypot(o.x-L.x,o.y-L.y)})).filter(e=>e.d<46).sort((a,b)=>a.d-b.d).slice(0,3);
      for(const {L,d} of near){const dd=Math.max(1,d),dir=qd((o.x-L.x)/dd,(o.y-L.y)/dd);const k=Math.min(3,dd/Math.max(1,L.h-o.h*.5));srcs.push({dir,k,a:.38*(1-d/46),L});}
      info.push(`${o.n} ${srcs.length}`);
      for(const s of srcs){if(tier==='blob')continue;if(tier==='rot'){shadowStamp(o.x,o.y,s.dir[0],s.dir[1],o.h*s.k,Math.min(o.w,9)*.8,s.a);}
        else{for(const [px,py,col] of o.px){const hy=-py;const sx=Math.round(o.x+px+s.dir[0]*hy*s.k),sy=Math.round(o.y+s.dir[1]*hy*s.k);if(sx>=0&&sy>=0&&sx<160&&sy<90){const i=sy*160+sx;SHA[i]=Math.min(.72,Math.max(SHA[i],s.a*1.2));}}}}
      if(tier==='blob'){const rx=Math.max(3,o.w/2+1);for(let y=-2;y<=1;y++)for(let x=-rx;x<=rx;x++){if((x/rx)**2+(y/2)**2>1)continue;const xx=Math.round(o.x+x),yy=o.y+y;if(xx>=0&&yy>=0&&xx<160&&yy<90)SHA[yy*160+xx]=.5;}}}
    const am=S.amb,sn=S.sun,lampK=lerp(.9,.3,clamp(sun.el/40,0,1));
    for(let y=0;y<90;y++)for(let x=0;x<160;x++){const i=y*160+x;let lr=am[0]+sn[0]*.62,lg=am[1]+sn[1]*.62,lb=am[2]+sn[2]*.62;for(const L of lamps){const d=Math.hypot(x-L.x,y-L.y);if(d<46){const q=1-(d/46)**2,f=q*q*lampK;lr+=f;lg+=f*.82;lb+=f*.55;}}
      const sa=SHA[i],al=un32(grass[i]);u[i]=pack(al[0]*lr*(1-sa),al[1]*lg*(1-sa)+0,al[2]*lb*(1-sa*.7));}
    for(const o of OBJ.slice().sort((a,b)=>a.y-b.y))for(const [px,py,col] of o.px){const xx=o.x+px,yy=o.y+py;if(xx<0||yy<0||xx>=160||yy>=90)continue;const al=un32(col);let lr=am[0]+sn[0]*.62,lg=am[1]+sn[1]*.62,lb=am[2]+sn[2]*.62;for(const L of lamps){const d=Math.hypot(xx-L.x,yy-L.y);if(d<46){const q=1-(d/46)**2,f=q*q*lampK;lr+=f;lg+=f*.82;lb+=f*.55;}}u[yy*160+xx]=pack(al[0]*lr,al[1]*lg,al[2]*lb);}
    for(const L of lamps){for(let k=0;k<4;k++){const xx=L.x+(k&1)-1,yy=L.y+(k>>1)-1;if(xx>=0&&yy>=0&&xx<160&&yy<90)u[(yy|0)*160+(xx|0)]=U('#fff0c0');}}
    B.put();
    if(sun.el!==lastEl||fr%10===0){chart(sun.el);lastEl=sun.el;}
    if(fr%6===0){const k=.62*Math.min(4,1/Math.tan(Math.max(4,sun.el)*Math.PI/180));setHud(root,`el ${sun.el}° · az ${Math.round(sun.az)}°${c.v('remap')?'':' · remap OFF'}`);setHud(root,`${tier==='blob'?'blob: no direction':tier==='rot'?'≤ 4 shadows each':'sheared silhouettes'}`,'r');
      ro.innerHTML=`obelisk h = 28 px: true shadow 28·cot(${sun.el}°) = <b>${(28/Math.tan(sun.el*Math.PI/180)).toFixed(1)} px</b>; Sandbox draws 28 × ${k.toFixed(2)} = <b>${(28*k).toFixed(1)} px</b> (0.62 for the 3/4 view, capped) · sun-shadow rebuilds so far: <b>${r.sunBuilds}</b> (only when the sun moves) · right: ${info.join(', ')} shadows (sun + up to 3 nearest lamps)`;}}};});

// ======================================================================
// B4: sun/moon elevation over 24 h with twilight bands and the shadow gap
// ======================================================================
reg('twilight',root=>{const svg=$('svg',root),ro=$('[data-ro]',root),c=ctl(root);let hour=18.2,auto=!reduce,fr=0;
  const X=h=>40+h/24*580,Y=e=>{const a=Math.abs(e),f=a<=20?a*4:80+(a-20)*.55;return 122-Math.sign(e)*f;};
  function draw(){svg.innerHTML='';const band=(a,b,fill,op,lab)=>{svgEl('rect',{x:40,y:Y(a),width:580,height:Y(b)-Y(a),fill,'fill-opacity':op},svg);if(lab)svgText(svg,616,(Y(a)+Y(b))/2+3,lab,{'font-size':9.5,'text-anchor':'end'});};
    band(70,6,'#ffc870',.05,'day');band(6,0,'#e08a3a',.28,'golden 0–6°');band(0,-6,'#8ea8ff',.16,'civil');band(-6,-12,'#8ea8ff',.1,'nautical');band(-12,-18,'#8ea8ff',.05,'astronomical');band(-18,-70,'#000',0,'night');
    for(const e of [6,0,-6,-12,-18])svgEl('line',{x1:40,x2:620,y1:Y(e),y2:Y(e),class:'gl'},svg);
    for(const e of [60,20,6,0,-6,-12,-18,-60])svgText(svg,34,Y(e)+4,e+'°',{'font-size':10,'text-anchor':'end'});
    for(const h of [0,3,6,9,12,15,18,21,24])svgText(svg,X(h),244,String(h).padStart(2,'0'),{'font-size':10,'text-anchor':'middle'});
    svgEl('line',{x1:40,x2:620,y1:Y(-8),y2:Y(-8),stroke:'#9e94ad','stroke-dasharray':'2 3'},svg);svgText(svg,44,Y(-8)+11,'Sandbox reaches full night ambient at −8°',{'font-size':9.5});
    svgEl('line',{x1:40,x2:620,y1:Y(4),y2:Y(4),stroke:'#8ea8ff','stroke-dasharray':'1 3'},svg);
    const ps=[],pm=[];for(let h=0;h<=24;h+=.05){ps.push([X(h),Y(sunEl(h))]);pm.push([X(h),Y(moonEl(h))]);}poly(svg,ps,{class:'s1'});poly(svg,pm,{class:'s2','stroke-dasharray':'5 3'});
    let s=null;for(let h=0;h<=24.001;h+=.05){const gap=sunEl(h)<=0&&moonEl(h)<=4;if(gap&&s===null)s=h;if((!gap||h>=24)&&s!==null){svgEl('rect',{x:X(s),y:226,width:X(h)-X(s),height:6,fill:'#ff8f7a'},svg);s=null;}}
    svgEl('line',{x1:X(hour),x2:X(hour),y1:10,y2:232,class:'now'},svg);svgEl('circle',{cx:X(hour),cy:Y(sunEl(hour)),r:4,fill:'#ffc870'},svg);
    const hit=svgEl('rect',{x:40,y:0,width:580,height:250,fill:'transparent',class:'drag'},svg);
    const set=e=>{const r=svg.getBoundingClientRect();hour=clamp(((e.clientX-r.left)/r.width*640-40)/580*24,0,23.99);auto=false;draw();};
    hit.addEventListener('pointerdown',e=>{set(e);hit.setPointerCapture(e.pointerId);});hit.addEventListener('pointermove',e=>{if(e.buttons)set(e);});}
  function read(){const el=sunEl(hour),mel=moonEl(hour),oc=c.v('oc'),S=sky(hour,oc);
    const phase=el>6?'day':el>0?'golden hour':el>-6?'0 to −6°: no shadows, lamps on':el>-12?'−6 to −12°: deep blue, windows pop':'below −12°: night palette';
    const K=oc&&el>0?'~6,500 K overcast':el>20?'~5,500 K midday':el>6?'between golden and midday':el>2?'~3,500 K golden hour':el>0?'~2,000 K just after sunrise / before sunset':'sun below the horizon';
    const shadow=oc?'none (overcast)':el>0?`sun shadows, k = ${S.len.toFixed(2)} per px of height`:mel>4?'faint blue moon shadows':'<b>none: the twilight gap</b>';
    const lamps=[0,1,2,3].filter(k=>hour>=18.9+.175*k||hour<5.6-.105*k).length;
    ro.innerHTML=`<b>${fmtH(hour)}</b> · sun ${el.toFixed(1)}°, moon ${mel.toFixed(1)}° · phase: <b>${phase}</b> · sun colour: ${K} · shadows: ${shadow} · ambient <span class="swatch" style="background:${rgbCss(S.amb[0]/.7*255,S.amb[1]/.7*255,S.amb[2]/.7*255)}"></span> sun <span class="swatch" style="background:${rgbCss(Math.min(1,S.sun[0])*255,Math.min(1,S.sun[1])*255,Math.min(1,S.sun[2])*255)}"></span> · Sandbox street lamps on: <b>${lamps}/4</b>, night lights ${el<3?'<b>on</b> (elevation &lt; 3°)':'off'}`;}
  c.on('oc',read);draw();read();
  return {tick(dt){fr++;if(auto&&motion){hour=(hour+dt*(Math.abs(sunEl(hour))<14?.25:.8))%24;if(fr%3===0){draw();read();}}}};});

// ======================================================================
// C1: additive light map at low resolution + upscale choices
// ======================================================================
reg('lightmap',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),LMc=PX(cvs[1]),c=ctl(root),ro=$('[data-ro]',root);const W=192,H=108;
  const V=mkVillage(777);V.npc.show=false;V.player.x=-50;const ALB=new Uint32Array(W*H);V.render(ALB,W,H,64,70,{hour:12,t:0,view:'albedo',noChars:true});
  const A3=new Float32Array(W*H*3);for(let i=0;i<W*H;i++){const a=un32(ALB[i]);A3[i*3]=a[0];A3[i*3+1]=a[1];A3[i*3+2]=a[2];}
  const Ls=[['lamp',58,8],['lamp',162,8],['campfire',40,70],['torch',110,40],['magic',116,94],['candle',150,62],['lantern',80,92],['mushroom',156,104]].map(([ty,x,y],k)=>({ty,x,y,T:TYPES[ty],s:k*97+11,fg:FG()}));
  let drag=null,t=0,fr=0;pointer(cvs[0],([x,y],k)=>{if(k==='down'){let bd=14;drag=null;for(const L of Ls){const d=Math.hypot(L.x-x,L.y-y);if(d<bd){bd=d;drag=L;}}}if((k==='down'||k==='drag')&&drag){drag.x=clamp(x,0,W-1);drag.y=clamp(y,0,H-1);}if(k==='up')drag=null;});
  let LM=new Float32Array(W*H*3);
  return {tick(dt){t+=dt;fr++;const s=+c.segv('res'),up=c.segv('up'),bl=c.segv('bl');const lw=Math.max(1,Math.round(W*s)),lh=Math.max(1,Math.round(H*s));
    const N=lw*lh;if(LM.length<N*3)LM=new Float32Array(N*3);for(let i=0;i<N;i++){LM[i*3]=NIGHTA[0];LM[i*3+1]=NIGHTA[1];LM[i*3+2]=NIGHTA[2];}let tex=0;
    for(const L of Ls){let I=L.fg(flickerOf(L.T.fl,t,L.s),t);const R=L.T.R*s,cx=L.x*s,cy=L.y*s,col=L.T.c;tex+=Math.PI*R*R;
      for(let y=Math.max(0,Math.floor(cy-R));y<=Math.min(lh-1,Math.ceil(cy+R));y++)for(let x=Math.max(0,Math.floor(cx-R));x<=Math.min(lw-1,Math.ceil(cx+R));x++){const d=Math.hypot(x+.5-cx,y+.5-cy);if(d>R)continue;const q=1-(d/R)**2,f=q*q*I*1.25,i=(y*lw+x)*3;
        if(bl==='add'){LM[i]+=col[0]*f;LM[i+1]+=col[1]*f;LM[i+2]+=col[2]*f;}else{LM[i]=Math.max(LM[i],col[0]*f);LM[i+1]=Math.max(LM[i+1],col[1]*f);LM[i+2]=Math.max(LM[i+2],col[2]*f);}}}
    const u=F.u32,lu=LMc.u32;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const o=y*W+x;let lr,lg,lb;const fx=(x+.5)*s-.5,fy=(y+.5)*s-.5;
      if(up==='near'||lw===W){const i=(clamp(Math.floor((x+.5)*s),0,lh*0+lw-1)+clamp(Math.floor((y+.5)*s),0,lh-1)*lw)*3;lr=LM[i];lg=LM[i+1];lb=LM[i+2];}
      else{const x0=clamp(Math.floor(fx),0,lw-1),y0=clamp(Math.floor(fy),0,lh-1),x1=Math.min(lw-1,x0+1),y1=Math.min(lh-1,y0+1),ax=clamp(fx-x0,0,1),ay=clamp(fy-y0,0,1);
        const g=(xx,yy,k)=>LM[(yy*lw+xx)*3+k];const bi=k=>(g(x0,y0,k)*(1-ax)+g(x1,y0,k)*ax)*(1-ay)+(g(x0,y1,k)*(1-ax)+g(x1,y1,k)*ax)*ay;lr=bi(0);lg=bi(1);lb=bi(2);}
      if(up==='bay'){const B=bay(x,y)/16;lr=Math.floor(lr*6+B)/6;lg=Math.floor(lg*6+B)/6;lb=Math.floor(lb*6+B)/6;}
      u[o]=pack(A3[o*3]*lr,A3[o*3+1]*lg,A3[o*3+2]*lb);
      const j=(clamp(Math.floor((x+.5)*s),0,lw-1)+clamp(Math.floor((y+.5)*s),0,lh-1)*lw)*3;lu[o]=pack(LM[j]*170,LM[j+1]*170,LM[j+2]*170);}
    F.put();LMc.put();
    if(fr%6===0){setHud(root,`light map ${lw}×${lh}`);ro.innerHTML=`light map <b>${lw} × ${lh}</b> = ${N.toLocaleString()} texels · stamps ≈ πR² each = <b>${Math.round(tex).toLocaleString()}</b> texels for ${Ls.length} lights (${Math.round(tex/(W*H)*100)}% of the screen) · then <b>${(W*H).toLocaleString()}</b> multiplies, one per screen pixel · blend: ${bl==='add'?'add (sums can pass 1.0 and clip)':'max (never brighter than the brightest light)'}`;}}};});

// ======================================================================
// C2: Godot 2D light limits per canvas item and per render
// ======================================================================
reg('godot',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root);const W=192,H=120;let rng=mkRng(5);
  let lights=[];const addN=n=>{for(let k=0;k<n;k++)lights.push({x:4+rng()*(W-8),y:4+rng()*(H-8)});};addN(26);
  c.btn('add',()=>{addN(20);dirty=true;});c.btn('clear',()=>{lights=[];dirty=true;});
  pointer(cv,([x,y],k)=>{if(k==='down'){lights.push({x,y});dirty=true;}});
  const sprites=[[30,50],[70,22],[100,80],[140,44],[168,96],[52,100]].map(([x,y])=>({x:x-2,y:y-3,w:4,h:6,spr:1}));
  const ALB=new Uint32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const tx=x>>2,ty=y>>2,h=hash2(tx,ty);ALB[y*W+x]=(tx*7+ty*3)%11===0?U('#9a948a'):h<.5?U('#5f8f48'):U('#6ea052');if((x&3)===3||(y&3)===3)ALB[y*W+x]=mulc(ALB[y*W+x],.92,.92,.92);}
  for(const s of sprites)for(let y=0;y<s.h;y++)for(let x=0;x<s.w;x++)ALB[(s.y+y)*W+s.x+x]=y<2?U('#f0c09a'):U('#3c6fb4');
  let dirty=true;['tex','shad','ubo'].forEach(k=>c.on(k,()=>dirty=true));c.seg('q',()=>dirty=true);
  return {tick(){if(!dirty)return;dirty=false;const tex=c.v('tex'),q=+c.segv('q'),ubo=c.v('ubo'),nsh=c.v('shad');c.out('tex',tex+' px');c.out('shad',nsh);
    const half=tex/2/4,qs=q*4;const cap=ubo?64:256;const used=lights.slice(0,cap),overRender=Math.max(0,lights.length-cap);
    const items=[];for(let y=0;y<H;y+=qs)for(let x=0;x<W;x+=qs)items.push({x,y,w:Math.min(qs,W-x),h:Math.min(qs,H-y)});for(const s of sprites)items.push(s);
    const droppedL=new Set();let over=0,pairsDropped=0;
    for(const it of items){const touch=[];used.forEach((L,li)=>{if(L.x+half>=it.x&&L.x-half<=it.x+it.w&&L.y+half>=it.y&&L.y-half<=it.y+it.h)touch.push(li);});it.lit=touch.slice(0,15);if(touch.length>15){over++;it.over=touch.length;pairsDropped+=touch.length-15;touch.slice(15).forEach(li=>droppedL.add(li));}else it.over=0;}
    const u=F.u32;const itemAt=(x,y)=>{for(const s of sprites)if(x>=s.x&&x<s.x+s.w&&y>=s.y&&y<s.y+s.h)return s;return items[Math.floor(y/qs)*Math.ceil(W/qs)+Math.floor(x/qs)];};
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const it=itemAt(x,y);let l=.16,lg=.17,lb=.28;for(const li of it.lit){const L=used[li],d=Math.max(Math.abs(L.x-x),Math.abs(L.y-y));if(d>half)continue;const r=Math.hypot(L.x-x,L.y-y)/half;if(r>=1)continue;const f=(1-r*r)**2*.55;l+=f;lg+=f*.84;lb+=f*.6;}
      const a=un32(ALB[y*W+x]);u[y*W+x]=pack(a[0]*l,a[1]*lg,a[2]*lb);}
    for(const it of items){if(it.spr&&!it.over)continue;const col=it.over?U('#ff6b5e'):U('#2a2236');for(let x=it.x;x<it.x+it.w;x++){u[it.y*W+x]=col;if(it.y+it.h-1<H)u[(it.y+it.h-1)*W+x]=col;}for(let y=it.y;y<it.y+it.h;y++){u[y*W+it.x]=col;u[y*W+Math.min(W-1,it.x+it.w-1)]=col;}}
    lights.forEach((L,li)=>{const col=li>=cap||droppedL.has(li)?U('#8ea8ff'):li<nsh?U('#ffc870'):U('#fff0c0');const x=L.x|0,y=L.y|0;for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=col;}});
    F.put();setHud(root,`${lights.length} lights · ${over} item${over===1?'':'s'} over the cap`);
    ro.innerHTML=`light rect ${tex} px (${tex<192?'below':'at or above'} the forum's 192 px fix) · canvas items ${items.length} · items over 15 lights: <b>${over}</b>, light-item pairs dropped: <b>${pairsDropped}</b> · per render ${Math.min(lights.length,cap)}/${cap}${overRender?`, <b>${overRender} dropped</b>`:''} · shadowed: ${nsh} × 4 passes = <b>${nsh*4}</b> occluder passes, atlas 2048 × ${nsh*2} rows`;}};});

// ======================================================================
// C3 + C6 + C7: polar 256-ray shadow maps with the height rule and caching
// ======================================================================
reg('polar',root=>{const cvs=$$('canvas',root),F=PX(cvs[0]),RW=PX(cvs[1]),c=ctl(root),svg=$('svg',root),ro=$('[data-ro]',root);const W=160,H=100,N=W*H;
  const OCC=new Uint8Array(N);const box=(x0,y0,x1,y1,h)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(x>=0&&y>=0&&x<W&&y<H)OCC[y*W+x]=h;};
  for(let x=96;x<=150;x++){box(x,12,x,13,30);box(x,49,x,50,30);}for(let y=12;y<=50;y++){box(96,y,97,y,30);box(149,y,150,y,30);}box(118,49,126,50,0);box(104,49,110,50,0);box(96,26,97,32,0);
  for(let x=8;x<=84;x++)box(x,70,x,71,5);box(52,36,56,39,9);box(60,42,64,45,9);box(24,24,30,27,7);
  const ALB=new Uint32Array(N);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/9,y/9),h=hash2(x,y);ALB[y*W+x]=(x>98&&x<149&&y>13&&y<49)?((y%4===0)?U('#6a4e30'):U('#9a7448')):h<.04?U('#82b25e'):n<.42?U('#4f7d3e'):U('#5f8f48');}
  const RMAX=64,LW=129,ANG=new Uint8Array(LW*LW),DST=new Float32Array(LW*LW);for(let dy=-RMAX;dy<=RMAX;dy++)for(let dx=-RMAX;dx<=RMAX;dx++){const k=(dy+RMAX)*LW+dx+RMAX;DST[k]=Math.hypot(dx,dy);ANG[k]=(Math.round(Math.atan2(dy,dx)/(2*Math.PI)*256)+256)&255;}
  const mkL=(ty,x,y)=>({ty,T:TYPES[ty],x,y,R:TYPES[ty].R,h:TYPES[ty].h,dist:new Float32Array(256),dirty:true,s:(x*7+y)|0,fg:FG()});
  const Ls=[mkL('campfire',36,84),mkL('lamp',112,76),mkL('torch',30,48)];let sel=0,drag=null,t=0,fr=0,casts=0,steps=0,castsTot=0;
  function cast(L){const thr=L.h*.6;let st=0;for(let a=0;a<256;a++){const an=a/256*2*Math.PI,dx=Math.cos(an),dy=Math.sin(an);let d=1;for(;d<L.R;d++){const px=(L.x+dx*d)|0,py=(L.y+dy*d)|0;if(px<0||py<0||px>=W||py>=H)break;if(OCC[py*W+px]>=thr)break;}st+=d;L.dist[a]=d+1.5;}L.dirty=false;casts++;castsTot++;steps+=st;}
  c.seg('ty',v=>{const L=Ls[sel];const n=mkL(v,L.x,L.y);Ls[sel]=n;});
  pointer(cvs[0],([x,y],k)=>{const tool=c.segv('tool');if(tool==='move'){if(k==='down'){let bd=16;drag=null;Ls.forEach((L,i)=>{const d=Math.hypot(L.x-x,L.y-y);if(d<bd){bd=d;drag=i;}});if(drag!==null){sel=drag;c.setSeg('ty',Ls[sel].ty);}}
      if((k==='down'||k==='drag')&&drag!==null){const L=Ls[drag];L.x=clamp(Math.round(x),1,W-2);L.y=clamp(Math.round(y),1,H-2);L.dirty=true;}if(k==='up')drag=null;return;}
    if(k==='down'||k==='drag'){box((x|0)-1,(y|0)-1,(x|0)+1,(y|0)+1,+tool);Ls.forEach(L=>L.dirty=true);}});
  function plot(L){svg.innerHTML='';svgEl('circle',{cx:0,cy:0,r:50,fill:'none',stroke:'#2e2838'},svg);svgEl('circle',{cx:0,cy:0,r:25,fill:'none',stroke:'#1d1924'},svg);
    const pts=[];for(let a=0;a<256;a++){const an=a/256*2*Math.PI,r=Math.min(1,(L.dist[a]-1.5)/L.R)*50;pts.push((Math.cos(an)*r).toFixed(1)+','+(Math.sin(an)*r).toFixed(1));}
    svgEl('polygon',{points:pts.join(' '),fill:'rgba(255,200,112,.22)',stroke:'#ffc870','stroke-width':1},svg);svgEl('circle',{cx:0,cy:0,r:2.5,fill:'#fff0c0'},svg);
    svgText(svg,-57,-51,`${L.ty} R${L.R} h${L.h}`,{'font-size':7,class:'w'});svgText(svg,-57,57,'256 angle bins',{'font-size':6.5});}
  return {tick(dt){t+=dt;fr++;casts=0;steps=0;for(const L of Ls)if(L.dirty)cast(L);
    const lr=new Float32Array(N),lg=new Float32Array(N),lb=new Float32Array(N);
    for(const L of Ls){const I=L.fg(flickerOf(L.T.fl,t,L.s),t),R=L.R,col=L.T.c;for(let dy=-R;dy<=R;dy++){const py=L.y+dy;if(py<0||py>=H)continue;for(let dx=-R;dx<=R;dx++){const px=L.x+dx;if(px<0||px>=W)continue;const k=(dy+RMAX)*LW+dx+RMAX,d=DST[k];if(d>R||d>L.dist[ANG[k]])continue;const q=1-(d/R)**2,f=q*q*I*1.25,i=py*W+px;lr[i]+=col[0]*f;lg[i]+=col[1]*f;lb[i]+=col[2]*f;}}}
    const u=F.u32;for(let i=0;i<N;i++){const o=OCC[i];let a=o===30?[176,160,150]:o===5?[200,150,96]:o===9?[190,130,72]:o===7?[176,172,164]:un32(ALB[i]);const B=bay(i%W,(i/W)|0)/16;
      const r=Math.floor((.2+lr[i])*6+B)/6,g=Math.floor((.2+lg[i])*6+B)/6,b=Math.floor((.34+lb[i])*6+B)/6;u[i]=pack(a[0]*r,a[1]*g,a[2]*b);}
    const L=Ls[sel];if(c.v('rays'))for(let a=0;a<256;a+=2){const an=a/256*2*Math.PI;for(let s=0;s<L.dist[a]-1.5;s+=2){const px=(L.x+Math.cos(an)*s)|0,py=(L.y+Math.sin(an)*s)|0;if(px>=0&&py>=0&&px<W&&py<H)u[py*W+px]=pack(255,220,80);}}
    Ls.forEach((Q,i)=>{for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const xx=Q.x+dx,yy=Q.y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H)u[yy*W+xx]=i===sel?U('#ffffff'):U('#fff0c0');}});
    F.put();for(let a=0;a<256;a++){const v=Math.min(1,(L.dist[a]-1.5)/L.R);RW.u32[a]=pack(255*v,200*v,112*v);}RW.put();
    if(fr%4===0)plot(L);
    if(fr%6===0){const thr=L.h*.6;setHud(root,`re-casts this frame: ${casts} of 3`);
      ro.innerHTML=`selected <b>${L.ty}</b>, h ${L.h} → a ray stops where occluder ≥ 0.6 × ${L.h} = <b>${thr.toFixed(1)}</b>: fence 5 ${5>=thr?'<b>blocks</b>':'passes'}, rock 7 ${7>=thr?'<b>blocks</b>':'passes'}, barrel 9 ${9>=thr?'<b>blocks</b>':'passes'}, wall 30 blocks · one cast = 256 rays × up to R = ${L.R} steps = ${256*L.R} · this frame ${casts} re-cast${casts===1?'':'s'} (${steps} steps), ${3-casts} reused from cache · total casts: ${castsTot}`;}}};});

// ======================================================================
// C4: FOV as light: recursive (Bergström), symmetric (Ford), ray casting
// ======================================================================
reg('fov',root=>{const cv=$('canvas',root),F=PX(cv),c=ctl(root),ro=$('[data-ro]',root);const GW=31,GH=21,CS=6;
  const wall=new Uint8Array(GW*GH);const R=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)wall[y*GW+x]=1;};
  R(0,0,GW-1,0);R(0,GH-1,GW-1,GH-1);R(0,0,0,GH-1);R(GW-1,0,GW-1,GH-1);R(10,1,10,7);R(10,10,10,GH-2);R(20,4,20,16);R(11,7,16,7);R(23,10,28,10);
  for(const [x,y] of [[5,5],[6,12],[15,13],[25,5],[25,15],[4,16],[16,3],[14,16]])wall[y*GW+x]=1;
  let ox=6,oy=9,alg='sym',dirty=true,lit=new Float32Array(GW*GH),asym=new Uint8Array(GW*GH),ops=0,nAsym=0,nLit=0;
  const isW=(x,y)=>x<0||y<0||x>=GW||y>=GH||wall[y*GW+x]===1;
  function fovRec(sx,sy,r,reveal){let op=0;reveal(sx,sy);const M=[[1,0,0,-1,-1,0,0,1],[0,1,-1,0,0,-1,1,0],[0,1,1,0,0,-1,-1,0],[1,0,0,1,-1,0,0,-1]];
    const castL=(row,start,end,xx,xy,yx,yy)=>{if(start<end)return;let ns=0;for(let j=row;j<=r;j++){let dx=-j-1,dy=-j,blocked=false;while(dx<=0){dx++;const X=sx+dx*xx+dy*xy,Y=sy+dx*yx+dy*yy;const ls=(dx-.5)/(dy+.5),rsl=(dx+.5)/(dy-.5);
        if(start<rsl)continue;else if(end>ls)break;op++;if(dx*dx+dy*dy<=(r+.5)*(r+.5))reveal(X,Y);
        if(blocked){if(isW(X,Y)){ns=rsl;continue;}else{blocked=false;start=ns;}}else if(isW(X,Y)&&j<r){blocked=true;castL(j+1,start,ls,xx,xy,yx,yy);ns=rsl;}}if(blocked)break;}};
    for(let o=0;o<8;o++)castL(1,1,0,M[0][o],M[1][o],M[2][o],M[3][o]);return op;}
  function fovSym(sx,sy,r,reveal){let op=0;reveal(sx,sy);
    const T=[(d,col)=>[sx+col,sy-d],(d,col)=>[sx+col,sy+d],(d,col)=>[sx+d,sy+col],(d,col)=>[sx-d,sy+col]];
    for(const tr of T){const scan=(d,sn,sd,en,ed)=>{if(d>r)return;const minC=Math.floor((2*d*sn+sd)/(2*sd)),maxC=Math.ceil((2*d*en-ed)/(2*ed))
        ;let prev=null;for(let col=minC;col<=maxC;col++){op++;const [X,Y]=tr(d,col);const w=isW(X,Y);const sym=col*sd>=d*sn&&col*ed<=d*en;
          if((w||sym)&&(col*col+d*d)<=(r+.5)*(r+.5))reveal(X,Y);
          if(prev===true&&!w){sn=2*col-1;sd=2*d;}
          if(prev===false&&w){scan(d+1,sn,sd,2*col-1,2*d);}prev=w;}
        if(prev===false)scan(d+1,sn,sd,en,ed);};scan(1,-1,1,1,1);}return op;}
  function fovRay(sx,sy,r,reveal){let op=0;reveal(sx,sy);const per=[];for(let k=-r;k<=r;k++){per.push([sx+k,sy-r],[sx+k,sy+r],[sx-r,sy+k],[sx+r,sy+k]);}
    for(const [tx,ty] of per){let x=sx,y=sy;const dx=Math.abs(tx-sx),dy=-Math.abs(ty-sy),stx=sx<tx?1:-1,sty=sy<ty?1:-1;let err=dx+dy;
      while(!(x===tx&&y===ty)){const e2=2*err;if(e2>=dy){err+=dy;x+=stx;}if(e2<=dx){err+=dx;y+=sty;}op++;if((x-sx)**2+(y-sy)**2>(r+.5)**2)break;reveal(x,y);if(isW(x,y))break;}}return op;}
  const ALG={rec:fovRec,sym:fovSym,ray:fovRay};
  function compute(){const r=c.v('r'),f=ALG[alg];lit.fill(-1);const seen=new Set();ops=f(ox,oy,r,(x,y)=>{if(x<0||y<0||x>=GW||y>=GH)return;const i=y*GW+x;lit[i]=Math.max(0,1-Math.hypot(x-ox,y-oy)/r);seen.add(i);});
    nLit=seen.size;asym.fill(0);nAsym=0;if(c.v('asym')){for(const i of seen){if(wall[i])continue;const x=i%GW,y=i/GW|0;if(x===ox&&y===oy)continue;let back=false;f(x,y,r,(a,b)=>{if(a===ox&&b===oy)back=true;});if(!back){asym[i]=1;nAsym++;}}}}
  c.seg('alg',v=>{alg=v;dirty=true;});['r','asym','band'].forEach(k=>c.on(k,()=>dirty=true));
  let drag=false;pointer(cv,([x,y],k)=>{const gx=x/CS|0,gy=y/CS|0;if(gx<1||gy<1||gx>=GW-1||gy>=GH-1)return;const tool=c.segv('tool');
    if(tool==='wall'){if(k==='down'&&!(gx===ox&&gy===oy)){wall[gy*GW+gx]^=1;dirty=true;}return;}
    if(k==='down')drag=true;if(k==='up')drag=false;if((k==='down'||k==='drag')&&drag&&!wall[gy*GW+gx]){ox=gx;oy=gy;dirty=true;}});
  return {tick(){if(!dirty)return;dirty=false;compute();const u=F.u32,band=c.v('band'),r=c.v('r');c.out('r',r);
    for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const i=gy*GW+gx;let v=lit[i];const w=wall[i];let col;
      if(v<0){col=w?U('#2c2534'):U('#18151e');}else{if(band)v=Math.ceil(v*5)/5;const a=w?[150,130,110]:((gx+gy)&1?[120,108,92]:[110,98,84]);const l=.12+v*1.05;col=pack(a[0]*l*1.05,a[1]*l*.92,a[2]*l*.7);if(asym[i])col=mix32(col,U('#ff4a3a'),.6);}
      for(let y=0;y<CS;y++)for(let x=0;x<CS;x++){let cc=col;if(w&&(y===0||x===0)&&v>=0)cc=mulc(col,1.15,1.15,1.15);u[(gy*CS+y)*186+gx*CS+x]=cc;}}
    for(let y=1;y<5;y++)for(let x=1;x<5;x++)u[(oy*CS+y)*186+ox*CS+x]=(x===1||x===4||y===1||y===4)?U('#ff8c3a'):U('#fff0a0');F.put();
    setHud(root,`${alg==='rec'?'recursive':alg==='sym'?'symmetric':'ray casting'} · ${ops} visits`);
    ro.innerHTML=`radius ${r}: lit <b>${nLit}</b> tiles · tiles visited <b>${ops}</b> (πR² ≈ ${Math.round(Math.PI*r*r)}) · asymmetric tiles: <b>${c.v('asym')?nAsym:'—'}</b>${c.v('asym')?(nAsym?' (lit by the lamp but blind to it)':' (fully symmetric here)'):''}`;}};});

// ======================================================================
// C5: visibility polygon (corner rays) + SDF soft shadow
// ======================================================================
reg('vissdf',root=>{const cvs=$$('canvas',root),c=ctl(root),ro=$('[data-ro]',root);const g1=cvs[0].getContext('2d'),B=PX(cvs[1]);const W=160,H=100;
  const boxes=[[30,20,22,14],[96,14,14,30],[60,62,34,10],[126,60,18,18]];const tri=[[40,80],[52,92],[28,94]];
  const segs=[[0,0,W,0],[W,0,W,H],[W,H,0,H],[0,H,0,0]];for(const [x,y,w,h] of boxes)segs.push([x,y,x+w,y],[x+w,y,x+w,y+h],[x+w,y+h,x,y+h],[x,y+h,x,y]);for(let k=0;k<3;k++)segs.push([...tri[k],...tri[(k+1)%3]]);
  let L={x:76,y:44},L2={x:30,y:30},d1=false,d2=false,dirty1=true,dirty2=true,tests=0,nr=0;
  pointer(cvs[0],([x,y],k)=>{if(k==='down')d1=true;if(k==='up')d1=false;if(d1&&(k==='down'||k==='drag')){L.x=clamp(x,1,W-1);L.y=clamp(y,1,H-1);dirty1=true;}});
  pointer(cvs[1],([x,y],k)=>{if(k==='down')d2=true;if(k==='up')d2=false;if(d2&&(k==='down'||k==='drag')){L2.x=clamp(x,1,95);L2.y=clamp(y,1,59);dirty2=true;}});
  ['soft','rays'].forEach(k=>c.on(k,()=>dirty1=true));['k','st','dith'].forEach(k=>c.on(k,()=>dirty2=true));
  function ray(ox,oy,a){const dx=Math.cos(a),dy=Math.sin(a);let best=1e9,bx=0,by=0;for(const [x1,y1,x2,y2] of segs){tests++;const sx=x2-x1,sy=y2-y1,den=dx*sy-dy*sx;if(Math.abs(den)<1e-9)continue;const tt=((x1-ox)*sy-(y1-oy)*sx)/den,u=((x1-ox)*dy-(y1-oy)*dx)/den;if(tt>0&&u>=0&&u<=1&&tt<best){best=tt;bx=ox+dx*tt;by=oy+dy*tt;}}return [bx,by,a];}
  function poly(ox,oy){const pts=new Set();for(const s of segs){pts.add(s[0]+','+s[1]);pts.add(s[2]+','+s[3]);}const hits=[];nr=0;
    for(const p of pts){const [px,py]=p.split(',').map(Number);const a=Math.atan2(py-oy,px-ox);for(const e of [-1e-5,0,1e-5]){hits.push(ray(ox,oy,a+e));nr++;}}hits.sort((a,b)=>a[2]-b[2]);return hits;}
  const grass=document.createElement('canvas');grass.width=W;grass.height=H;{const gp=PX(grass);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=vnoise(x/9,y/9);gp.u32[y*W+x]=n<.45?U('#4f7d3e'):U('#5f8f48');}gp.put();}
  function draw1(){tests=0;g1.imageSmoothingEnabled=false;g1.fillStyle='#000';g1.fillRect(0,0,W,H);g1.globalAlpha=.22;g1.drawImage(grass,0,0);g1.globalAlpha=1;
    const soft=c.v('soft');const origins=soft?Array.from({length:11},(_,k)=>k===0?[L.x,L.y]:[L.x+Math.cos(k/10*6.283)*3,L.y+Math.sin(k/10*6.283)*3]):[[L.x,L.y]];
    g1.save();for(const [ox,oy] of origins){const h=poly(ox,oy);g1.beginPath();g1.moveTo(h[0][0],h[0][1]);for(const p of h)g1.lineTo(p[0],p[1]);g1.closePath();g1.globalAlpha=soft?.12:1;g1.save();g1.clip();g1.globalAlpha=soft?.12:1;g1.drawImage(grass,0,0);
      const gr=g1.createRadialGradient(ox,oy,2,ox,oy,90);gr.addColorStop(0,'rgba(255,200,112,.55)');gr.addColorStop(1,'rgba(255,200,112,0)');g1.fillStyle=gr;g1.fillRect(0,0,W,H);g1.restore();}
    g1.restore();g1.globalAlpha=1;
    if(c.v('rays')){const h=poly(L.x,L.y);g1.strokeStyle='rgba(255,220,80,.5)';g1.lineWidth=.5;for(const p of h){g1.beginPath();g1.moveTo(L.x,L.y);g1.lineTo(p[0],p[1]);g1.stroke();}}
    g1.fillStyle='#6a6070';for(const [x,y,w,h] of boxes)g1.fillRect(x,y,w,h);g1.beginPath();g1.moveTo(...tri[0]);g1.lineTo(...tri[1]);g1.lineTo(...tri[2]);g1.fill();
    g1.fillStyle='#fff0c0';g1.fillRect(L.x-1,L.y-1,3,3);setHud(root,`${nr} rays`);}
  const circ=[[34,20,7],[60,38,9]],rects=[[70,10,8,12],[14,40,16,6]];
  const sdf=(x,y)=>{let d=1e9;for(const [cx,cy,r] of circ)d=Math.min(d,Math.hypot(x-cx,y-cy)-r);for(const [rx,ry,w,h] of rects){const qx=Math.abs(x-(rx+w/2))-w/2,qy=Math.abs(y-(ry+h/2))-h/2;d=Math.min(d,Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0));}return d;};
  let evals=0;
  function draw2(){const k=c.v('k'),st=c.v('st'),dith=c.v('dith');c.out('k',k);c.out('st',st);evals=0;const u=B.u32;
    for(let y=0;y<60;y++)for(let x=0;x<96;x++){const px=x+.5,py=y+.5;const d0=sdf(px,py);let col;if(d0<0){u[y*96+x]=U('#6a6070');continue;}
      const dx=L2.x-px,dy=L2.y-py,D=Math.hypot(dx,dy),ux=dx/D,uy=dy/D;let res=1,t=1;for(let s=0;s<st&&t<D;s++){const h=sdf(px+ux*t,py+uy*t);evals++;if(h<.01){res=0;break;}res=Math.min(res,k*h/t);t+=Math.max(h,.5);}
      let f=Math.max(0,1-D/70);f=f*f*clamp(res,0,1);if(dith)f=Math.floor(f*5+bay(x,y)/16)/5;const n=vnoise(x/7,y/7)<.45?[79,125,62]:[95,143,72];
      u[y*96+x]=pack(n[0]*(.12+f*1.15),n[1]*(.13+f*.98),n[2]*(.24+f*.6));}
    for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])u[((L2.y|0)+dy)*96+(L2.x|0)+dx]=U('#fff0c0');B.put();setHud(root,`${evals.toLocaleString()} SDF reads`,'r');}
  return {tick(){if(dirty1){draw1();dirty1=false;}if(dirty2){draw2();dirty2=false;}
    ro.innerHTML=`polygon: <b>${nr}</b> rays (3 per unique endpoint) × ${segs.length} segments = ${(nr*segs.length).toLocaleString()} intersection tests${c.v('soft')?', ×11 for the soft version':''} · SDF: 96 × 60 pixels × up to ${c.v('st')} steps = <b>${evals.toLocaleString()}</b> distance reads for one light`;}};});
