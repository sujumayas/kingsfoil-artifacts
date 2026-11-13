// Scratch benchmark for note 12: draw a coarse snow field at 640x360 through a 32x32 threshold tile.
const W=640,H=360;
function makeField(r){const fw=Math.ceil(W/r),fh=Math.ceil(H/r),f=new Uint8Array(fw*fh);
 for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){const wx=(x+.5)*r,wy=(y+.5)*r;
  const v=.5+.25*Math.sin(wx*.021+1.3)*Math.cos(wy*.027)+.2*Math.sin((wx+wy)*.043)+.1*Math.sin(wx*.09-wy*.07);
  f[y*fw+x]=Math.max(0,Math.min(255,Math.round(v*200)));}
 return {f,fw,fh,r};}
function bayer(n){let m=[[0]];for(let s=1;s<n;s*=2){const k=[];for(let y=0;y<2*s;y++){k.push([]);for(let x=0;x<2*s;x++){const o=[[0,2],[3,1]][y>=s?1:0][x>=s?1:0];k[y].push(4*m[y%s][x%s]+o);}}m=k;}return m;}
function tile(kind){const T=new Float32Array(1024);const b4=bayer(4),b8=bayer(8);let s=12345;
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){let t=0.5;
  if(kind==='bayer4')t=(b4[y&3][x&3]+.5)/16;else if(kind==='bayer8')t=(b8[y&7][x&7]+.5)/64;
  else if(kind==='white'){s=(Math.imul(s,1664525)+1013904223)>>>0;t=s/4294967296;}
  else if(kind==='cluster'){t=.5+.28*Math.sin(x*Math.PI/8+.7)*Math.sin(y*Math.PI/8)+.2*Math.sin((x+2*y)*Math.PI/16);}
  T[y*32+x]=100+(t-.5)*40;}return T;}
function nearest(F,T,out){const {f,fw,r}=F,sh=Math.log2(r);for(let y=0;y<H;y++){const ro=(y>>sh)*fw,ty=(y&31)<<5;for(let x=0;x<W;x++)out[y*W+x]=f[ro+(x>>sh)]>T[ty|(x&31)]?1:0;}}
function bilinear(F,T,out){const {f,fw,fh,r}=F,inv=1/r;for(let y=0;y<H;y++){let v=(y+.5)*inv-.5;if(v<0)v=0;let y0=v|0;if(y0>fh-2){y0=fh-2;v=fh-1;}const fy=v-y0,r0=y0*fw,r1=r0+fw,ty=(y&31)<<5;
 for(let x=0;x<W;x++){let u=(x+.5)*inv-.5;if(u<0)u=0;let x0=u|0;if(x0>fw-2){x0=fw-2;u=fw-1;}const fx=u-x0;const a=f[r0+x0],b=f[r0+x0+1],c=f[r1+x0],e=f[r1+x0+1];const top=a+(b-a)*fx,bot=c+(e-c)*fx;out[y*W+x]=(top+(bot-top)*fy)>T[ty|(x&31)]?1:0;}}}
function runs(out){let n=0,sum=0,max=0,on4=0,tot=0;for(let y=0;y<H-1;y++){let run=0;for(let x=0;x<=W;x++){const b=x<W&&out[y*W+x]!==out[(y+1)*W+x];if(b){run++;tot++;if(((y+1)&3)===0)on4++;}else if(run){n++;sum+=run;if(run>max)max=run;run=0;}}}return {mean:(sum/n).toFixed(2),max,on4:(100*on4/tot).toFixed(0)};}
function med(fn,reps){const t=[];for(let i=0;i<reps;i++){const a=performance.now();fn();t.push(performance.now()-a);}t.sort((a,b)=>a-b);return t[reps>>1];}
const out=new Uint8Array(W*H);
console.log('ratio cells sample thresh | ms/frame(median of 300) | boundary run mean px, max px, % of boundary on 4px grid lines');
for(const r of [1,2,4,32]){const F=makeField(r);for(const [nm,fn] of [['nearest',nearest],['bilinear',bilinear]]){for(const k of ['flat','bayer4','bayer8','white','cluster']){const T=tile(k);for(let i=0;i<50;i++)fn(F,T,out);const ms=med(()=>fn(F,T,out),300);const q=runs(out);
 if(k==='flat'||k==='bayer4'||k==='cluster'||(r===4&&nm==='bilinear'))console.log(`1:${r}`.padEnd(5),String(F.f.length).padEnd(7),nm.padEnd(9),k.padEnd(8),'|',ms.toFixed(3),'|',q.mean,q.max,q.on4+'%');}}}
// stochastic ticks: 163.2 picks per 1,000 cells per frame (VFX #1: 9,400 picks on 57,600 cells), simplest possible body (increment), lower bound
for(const r of [1,2,4,32]){const F=makeField(r),n=F.f.length,picks=Math.round(n*0.1632);let s=7;const fn=()=>{for(let k=0;k<picks;k++){s=(Math.imul(s,1664525)+1013904223)>>>0;const i=s%n;const l=i>0?F.f[i-1]:0,rr=i<n-1?F.f[i+1]:0;if(F.f[i]<200&&F.f[i]<=l+rr+255)F.f[i]++;}};for(let i=0;i<200;i++)fn();console.log(`tick 1:${r} cells ${n} picks ${picks} ms ${med(fn,500).toFixed(4)}`);}
// bytes
for(const [nm,w,h] of [['view 640x360',640,360],['chunk 64x64 tiles (2048x2048 px)',2048,2048]])for(const r of [1,2,4,32])console.log(nm,`1:${r}`,Math.ceil(w/r)*Math.ceil(h/r),'bytes per R8 field');
