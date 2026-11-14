// ======================================================================
// Asterion curve figures, part 2 (figs B): deathcost, corpserun, session,
// partyshare, gearladder, bestiary, dashboard. Constants come from
// notes/01-current-build.md (file:line in the captions), creature and item
// rows from atlas/data.json (extracted by a scratch script, fields trimmed),
// the Tibia 8.41 loss line from notes/02-tibia-lineage.md Q2 and the
// telemetry graph from notes/09-measurement.md Q5. Shared math is read from
// globalThis.AS (demos1.js) with a private port as the fallback. Wrapped in
// a block so names do not clash with the other demo files.
// ======================================================================
{
// ---- shared math: AS from demos1.js, else a literal port of 01-current-build.md Q1 ----
const FALLBACK=(()=>{
  const expForLevel=L=>{L=Math.max(1,Math.floor(L));return Math.max(Math.trunc((((L-6)*L+17)*L-12)/6)*100,0);}; // stats.go:15-25
  const skillTries=(s,base=50,mult=1.08)=>Math.trunc(base*Math.pow(mult,s-10));                               // skills.go:101-106 (bases 50/30/100/20, fishing 1.1)
  const manaForML=ml=>1600*Math.pow(1.4,ml);                                                                   // skills.go:249-251
  const speedForLevel=L=>300+4*(Math.max(1,L)-1);                                                              // game.go:89,123
  const stepMs=speed=>Math.ceil(1000*150/speed/50)*50;                                                         // game.go:100 (takes the speed, as AS does)
  const LADDER=[[1,384],[5,2361],[8,5409],[15,19663],[25,37617],[50,210981],[80,410169],[120,660520]];         // levels.txt, band.py
  const expPerHour=L=>{if(L<=1)return LADDER[0][1];for(let i=0;i<LADDER.length-1;i++){const [a,x]=LADDER[i],[b,y]=LADDER[i+1];if(L>=a&&L<=b)return x+(y-x)*(L-a)/(b-a);}return LADDER[LADDER.length-1][1]*L/120;};
  const deathCostMin=(L,eph)=>0.1*expForLevel(L)/(eph||expPerHour(L))*60;                                     // corpse.go:43,367
  return {expForLevel,skillTries,manaForML,speedForLevel,stepMs,deathCostMin,expPerHour,LADDER};})();
const A=Object.assign({},FALLBACK,globalThis.AS||{});
const expL=L=>A.expForLevel(L),stepExp=L=>expL(L+1)-expL(L),eph=L=>A.expPerHour(L),stepMs=L=>A.stepMs(A.speedForLevel(L));
const lossFlat=L=>0.1*expL(L);
// Tibia 8.41 (level 24+): ((L+50)/100)·50·(L²−5L+8); below 24 the 7.x flat 10 % (notes/02 Q2). Asterion's cubic is Tibia's exp formula, so the loss applies to the same exp numbers.
const lossTibia=L=>L<24?0.1*expL(L):((L+50)/100)*50*(L*L-5*L+8);

// ---- palette (style.css tokens) ----
const YEL='#ffc870',BLU='#8ea8ff',GRN='#7fd6a0',PNK='#e07ab0',PUR='#c9a2ff',RED='#ff8f7a',ORG='#e08a3a',MUTE='#9e94ad',TXT='#ece6f2',DIM='#5a4d6a';
const WORLDS=['Akron','Ingwen','Gorothland','Boggland','no spawn'],WC=[GRN,BLU,ORG,PNK,MUTE];
const KINDS=['melee weapon','distance weapon','ammo','shield','head','body','legs','feet','other armour'],LANE=['melee','distance','ammo','shield','head','body','legs','feet','other'],KC=[YEL,BLU,'#b9b0c8',GRN,PUR,PNK,ORG,RED,MUTE];
const nf=v=>Math.round(v).toLocaleString('en-US');
const mm=v=>{const m=Math.floor(v),s=Math.round((v-m)*60);return `${m}:${String(s).padStart(2,'0')}`;};
const fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/'/g,'').replace(/ /g,'_');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

// ---- chart frame helpers (private copies of the pattern used in the other demo files) ----
function frame(svg,W,H,p,x0,x1,y0,y1,o={}){svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML='';
  const fx=o.xlog?Math.log:v=>v,fy=o.ylog?Math.log:v=>v,l=p[3],r=W-p[1];
  const X=v=>l+(fx(v)-fx(x0))/(fx(x1)-fx(x0))*(r-l),Y=v=>H-p[2]-(fy(v)-fy(y0))/(fy(y1)-fy(y0))*(H-p[0]-p[2]);
  const inv=px=>{const t=(px-l)/(r-l);return o.xlog?Math.exp(Math.log(x0)+t*(Math.log(x1)-Math.log(x0))):x0+t*(x1-x0);};
  return {X,Y,inv,W,H,p,top:p[0],bot:H-p[2],l,r};}
function yTicks(svg,c,ts,fmt){ts.forEach(t=>{svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(t),y2:c.Y(t),class:'gl'},svg);svgText(svg,c.l-4,c.Y(t)+3.5,fmt?fmt(t):t,{'text-anchor':'end','font-size':10});});}
function xTicks(svg,c,ts,fmt){ts.forEach(t=>{svgEl('line',{x1:c.X(t),x2:c.X(t),y1:c.top,y2:c.bot,class:'gl'},svg);svgText(svg,c.X(t),c.bot+12,fmt?fmt(t):t,{'text-anchor':'middle','font-size':10});});}
function ylab(svg,c,t,x=9){const y=(c.top+c.bot)/2;svgText(svg,x,y,t,{transform:`rotate(-90 ${x} ${y})`,'text-anchor':'middle','font-size':10});}
function xlab(svg,c,t,y){svgText(svg,(c.l+c.r)/2,y||c.H-3,t,{'text-anchor':'middle','font-size':10});}
function axis(svg,c){svgEl('line',{x1:c.l,x2:c.r,y1:c.bot,y2:c.bot,class:'ax'},svg);}
function keys(svg,x,y,items){for(const it of items){
  if(it.box)svgEl('rect',{x,y:y-7,width:9,height:9,fill:it.c,'fill-opacity':it.op||.85},svg);
  else if(it.dot)svgEl('circle',{cx:x+5,cy:y-2.5,r:3,fill:it.c},svg);
  else svgEl('line',{x1:x,x2:x+12,y1:y-3,y2:y-3,stroke:it.c,'stroke-width':2,'stroke-dasharray':it.dash||''},svg);
  svgText(svg,x+(it.box||it.dot?13:16),y,it.t,{'font-size':9.5,fill:it.c});x+=(it.box||it.dot?13:16)+it.t.length*5.6+10;}}
function keysV(svg,x,y,items,dy=12){items.forEach((it,i)=>keys(svg,x,y+i*dy,[it]));}
function vbX(svg,e){const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return (e.clientX-r.left)/r.width*vb.width;}
function vbY(svg,e){const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return (e.clientY-r.top)/r.height*vb.height;}
function hover(svg,get,fn){const f=e=>{const c=get();if(!c)return;const x=vbX(svg,e);if(x<c.l-6||x>c.r+6)return;fn(c.inv(clamp(x,c.l,c.r)),e);};
  svg.addEventListener('pointermove',f);svg.addEventListener('pointerdown',f);}
function plen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}
// draw-on animation for a set of polylines: returns tick(dt) that reveals them over `secs`
function drawOn(lines,secs){let t=0,done=!motion;if(done)return ()=>{};const L=lines.map(l=>{const n=+l.getAttribute('data-len');l.setAttribute('stroke-dasharray',n);l.setAttribute('stroke-dashoffset',n);return n;});
  return dt=>{if(done)return;t+=dt;const p=Math.min(1,t/secs);lines.forEach((l,i)=>l.setAttribute('stroke-dashoffset',L[i]*(1-p)));if(p>=1){done=true;lines.forEach(l=>{l.removeAttribute('stroke-dasharray');l.removeAttribute('stroke-dashoffset');});}};}
function line(svg,pts,attrs){const p=poly(svg,pts,attrs);p.setAttribute('data-len',plen(pts).toFixed(1));return p;}

// ======================================================================
// data literals from atlas/data.json (generated by scratch extract.py; made 2026-09-11, repo 8836106a)
// creatures: [name, farm_level, hp, world(0 akron,1 ingwen,2 gorothland,3 boggland,4 none), boss, slug or 0 when it is the ascii-folded name]
// exp is not stored: every creature follows D69, exp = (exp(L+1) − exp(L)) / 100 with L = farm_level (checked against all 232 rows)
// ======================================================================
const CRE=[["cuervo carroñero",1,12,0,0,0],["venado bruno",1,22,0,0,0],["rata parda",3,15,0,0,0],["serpiente de hierba",3,20,0,0,0],["lobo cinza",5,28,0,0,0],["jabalí cerdoso",7,34,0,0,0],["sapo de cueva",8,50,0,0,0],["araña de cueva",9,50,0,0,0],["esqueleto",10,35,0,0,0],["oso pardo",10,80,0,0,0],["verdín mordedor",10,62,1,0,0],["ceniza la vieja",12,90,4,1,0],["goblin de la linde",12,58,0,0,0],["tragamusgo",12,96,1,0,0],["araña aguijonera",14,55,0,0,0],["arquero goblin",14,46,0,0,0],["huargo",15,70,0,0,0],["ulric del cinto rojo",15,125,4,1,0],["gusano de veta",16,70,0,0,0],["seta andarina",16,84,1,0,0],["troll de la cantera",16,90,0,0,0],["colmillo de la linde",17,175,4,1,0],["comehuesos",18,150,0,0,0],["pólipo hambriento",18,145,1,0,0],["vigía de hueso",18,70,0,0,0],["berserker orco",20,138,0,0,0],["ceniza de raben",20,210,4,1,0],["cobrador del vado",20,190,0,1,0],["cochinilla farolera",20,165,1,0,0],["matón del peaje",20,140,4,0,0],["orco de guerra",20,120,0,0,0],["nodriza de cristal",22,225,1,0,0],["troll del embarcadero",22,225,4,1,0],["cuervo de ceniza",25,120,4,0,0],["harrek del peaje",25,270,4,1,0],["vigía del horno",25,240,4,1,0],["el borranombres",27,265,4,1,0],["fauces de juncal",28,250,1,0,0],["guardia del granero",28,190,4,0,0],["sargento de los sacos",28,320,4,1,0],["escribano de la arena",29,310,4,1,0],["arquero nautilus",30,165,0,0,0],["cerdoso el porfiado",30,160,4,1,0],["la fundidora de ceniza",30,320,4,1,0],["micelia errante",30,170,0,0,0],["troll de marea",30,250,0,0,0],["harvek el intendente",31,400,4,1,0],["rastreador del capitán",31,360,4,1,0],["soldado sin bandera",31,230,4,0,0],["abanderado sin compañía",33,400,4,1,0],["capataz de la presa",34,420,4,1,0],["gola roja",34,300,1,0,0],["hombre de beltrán",34,260,4,0,0],["quisquilla de oro",35,315,1,0,0],["roldán el mal nombrado",35,450,4,1,0],["pollo del barro",36,324,1,0,0],["rompedor de engranajes",36,450,4,1,0],["saqueador de fosas",37,450,4,1,0],["sepulturero de la sal",37,280,4,0,0],["maese beltrán el acreedor",38,500,4,1,0],["contador de los difuntos",39,470,4,1,0],["bandido del bosque",40,160,0,0,"bandido_de_bosque"],["bandido del desierto",40,160,0,0,"bandido_de_desierto"],["bandido del río",40,160,0,0,"bandido_de_rio"],["beda el zapador",40,190,4,1,0],["el mercader de la última sal",40,500,4,1,0],["enano aldeano",40,120,0,0,0],["enano del monte",40,200,0,0,0],["enano guerrero",40,200,0,0,0],["enano representante",40,140,0,0,0],["enano vocero",40,120,0,0,0],["guardia del bosque",40,170,0,0,"guardia_de_bosque"],["guardia del desierto",40,170,0,0,"guardia_de_desierto"],["guardia del río",40,170,0,0,"guardia_de_rio"],["lanza de la torre",40,300,4,0,0],["portero del diezmo",40,500,4,1,0],["rape de charca",40,360,1,0,0],["soldado plano",40,200,0,0,0],["cuajo de marea",41,369,1,0,0],["pez de buche",42,378,1,0,0],["verdugo de la puerta",42,540,4,1,0],["el castellano sin blasón",45,620,4,1,0],["grillo de cieno",45,405,1,0,0],["cofia de coral",47,423,1,0,0],["ajolote crestado",49,441,1,0,0],["el ahíto",50,700,1,0,0],["el centinela de orm",50,340,0,1,0],["el nigromante de la boca",50,345,0,0,0],["enano de élite",50,300,0,0,0],["grisla la de las piedras",50,275,0,0,0],["kraggo jinete de huargos",50,300,0,0,0],["la tejedora de la sima",50,240,4,1,0],["vurk el descabezador",50,265,0,0,0],["ermitaño de fango",51,459,1,0,0],["erizo de sangre",53,477,1,0,0],["flor de ojos",55,495,1,0,0],["pejeverde",55,385,2,0,0],["zancón de marisma",56,504,1,0,0],["peonza de ojos",57,513,1,0,0],["el tragón",58,812,1,0,0],["gorm el ogro",60,360,0,1,0],["ordo el capataz",60,330,4,1,0],["sapo de yelmo",61,549,1,0,0],["araña lobera",62,500,2,0,0],["el bogavante rojo",64,896,1,0,0],["chinche moteada",66,594,1,0,0],["el alfiletero",66,924,1,0,0],["lancero de bajamar",70,630,2,0,0],["melena roja",70,630,1,0,0],["pájaro tuerto",72,648,1,0,0],["el sombrerón",75,1050,1,0,0],["gusano orondo",75,520,3,0,0],["casquete dentado",76,520,3,0,0],["gusano tenaza",76,684,1,0,0],["ojón del charco",78,520,3,0,0],["andrajoso de la ciénaga",79,640,3,0,0],["ciempiés rojo",80,720,1,0,0],["el panzudo",80,640,3,0,0],["viuda de bandas",80,640,2,0,0],["el acorazado",82,1148,1,1,0],["vela naranja",82,620,3,0,0],["astado de cieno",83,610,3,0,0],["el morrudo",84,1176,1,0,0],["mantis del juncal",84,600,3,0,0],["coraza de brasa",85,765,1,0,0],["el ojón",86,580,3,0,0],["buhonero de las vejigas",87,570,3,0,0],["el melenudo",88,1232,1,0,0],["el pálido",88,560,2,0,0],["el verrugoso",88,560,3,0,0],["el invocador",90,420,0,0,0],["ojo de polilla",90,590,3,0,0],["zancudo negro",90,810,1,0,0],["melena de paja",91,730,3,0,0],["cresta violeta",92,740,3,0,0],["escarbabarros",92,510,3,0,0],["gusano catalejo",92,828,1,0,0],["cebón rosado",93,760,3,0,0],["brujo de algas",95,665,2,0,0],["quisquilla de barro",95,660,3,0,0],["toro de légamo",95,800,3,0,0],["cirio mirón",96,864,1,0,0],["lomo de guijarros",96,850,3,0,0],["cangrejo garfio",97,760,3,0,0],["cobrador de la trocha",97,910,3,0,0],["el del mandil rojo",99,1020,3,0,0],["barbas colgantes",100,1080,3,0,0],["cría de brasa",100,900,2,0,0],["greñas de alga",100,900,3,0,0],["gólem de basalto",100,900,0,0,0],["ojo errante",100,900,1,0,0],["cacique de la capa roja",101,1070,3,0,0],["duende de sayal",102,720,3,0,0],["brujo de los manojos",103,1040,3,0,0],["tenazas del fango",103,860,3,0,0],["el racimo",104,1020,3,0,0],["agallas rojas",105,690,1,0,0],["araña bermeja",105,840,2,0,0],["el sinrostro",105,1010,3,0,0],["sombrero moteado",105,690,3,0,0],["aleta gris",106,1020,3,0,0],["el encadenado",107,1030,3,0,0],["garrapata parda",107,700,3,0,0],["el musgoso",108,1210,3,0,0],["hocicón de lodo",108,1040,3,0,0],["el espinado",110,1560,1,0,0],["erizo zancudo",110,720,3,0,0],["la estrella roja",110,880,2,0,0],["el barrigón",111,1120,3,0,0],["colmillo torcido",112,990,3,0,0],["lomo de barro",114,1320,3,0,0],["el masticador",115,1800,1,0,0],["el tragabolsas",115,1150,2,0,0],["maraña dentada",115,1150,3,0,0],["el encostrado",117,1290,3,0,0],["el zurrón dentado",117,1070,3,0,0],["cascote pardo",118,850,3,0,0],["el sebo",119,1200,3,0,0],["abrojo naranja",120,790,3,0,0],["chamán de cuerno rizado",120,960,3,0,0],["el que cuelga",120,2100,1,0,0],["reptante del umbral",120,960,2,0,0],["el sogas",122,1360,3,0,0],["el ojo emplumado",123,1220,3,0,0],["el vellón de cuernos",123,1000,3,0,0],["araña de sebo",125,1400,2,0,0],["coronado de púas",125,1400,3,0,0],["orejudo de manto naranja",125,1400,3,0,0],["brujo de huesos",127,1590,3,0,0],["el greñudo",128,1680,3,0,0],["astado rojo",130,1860,3,0,0],["barba de liquen",130,1860,3,0,0],["el desollado",132,2050,2,0,0],["el ermitaño de túnica clara",132,2050,3,0,"ermitano_de_tunica_clara"],["zarpa blanca",133,2120,3,0,0],["jabalí de correas",134,2620,3,0,0],["lomo de musgo",135,2710,3,0,0],["espinazo bermejo",136,2790,3,0,0],["coraza de púas",138,2020,3,0,0],["el florecido",138,2960,3,0,0],["peñasco de ascuas",139,3040,3,0,0],["quijada seca",140,2600,3,0,0],["sierpe de escarcha",140,2600,2,0,0],["el del colmillo atado",141,3190,3,0,0],["flor de fauces",142,2720,3,0,0],["el astado de placas",143,3340,3,0,0],["cresta de brasa",145,2900,3,0,0],["el rey de la bajamar",145,2900,2,1,0],["cara quemada",146,3460,3,0,0],["piojo de peña",147,2870,3,0,0],["el ascua",148,3430,3,0,0],["lomo de piña",149,2840,3,0,0],["espaldas de púas",150,3390,3,0,0],["gusano colmillero",151,2810,3,0,0],["sabueso del vacío",152,2800,2,0,0],["cuernos negros",153,3480,3,0,0],["el cuatro ojos",153,2900,3,0,0],["cabeza de brasa",155,3100,3,0,0],["mole bermeja",155,4340,3,0,0],["dragón de ceniza",158,3400,2,0,0],["el costillar",158,3400,3,0,0],["trenzas de garfio",160,4200,3,0,0],["boca sin dueño",162,3600,2,0,0],["el nudillos",162,4320,3,0,0],["el de los hongos",164,4560,3,0,0],["coraza de mil patas",166,4800,3,0,0],["el carbón vivo",168,4200,2,0,0],["el tuerto de los huesos",168,5040,3,0,0],["brazo de yunque",171,5500,3,0,0],["lomo de piedra",173,5500,3,0,0],["Goroth el último",175,5500,2,0,0],["el racimero",175,5500,3,0,0]];
// items with a min_level: [name, kind(0 weapon-melee,1 weapon-distance,2 ammo,3 shield,4 armor-head,5 armor-body,6 armor-legs,7 armor-feet,8 armor-other), min_level, slug or 0]
const GEAR=[["pantalones de lino",6,1,0],["armadura de pieles",5,4,"armadura_pieles"],["bombachos del nómada",6,4,0],["broquel de metal",3,4,"broquel_metal"],["coraza de cuero",5,4,"coraza_cuero"],["guisarme",0,4,0],["cuero tachonado",5,5,0],["faldón del aprendiz",6,6,0],["espada media",0,7,0],["hacha enana",0,7,0],["partesana",0,7,0],["ranseur",0,7,0],["sable",0,7,0],["sagaris",0,7,0],["ballesta de mano",1,8,"ballesta_mano"],["camisa de malla",5,8,"camisa_malla"],["escudo grande de madera",3,8,"escudo_madera_g"],["escudo pequeño de metal",3,8,"escudo_metal_p"],["hoja de papiro",0,8,0],["pantalones de cuero remachado",6,8,0],["alfanje",0,10,0],["azote de huesos",0,10,0],["ballesta ligera",1,10,0],["cimitarra",0,10,0],["cota de escamas",5,10,"cota_escamas"],["guanteletes de cuero",8,10,"guanteletes_cuero"],["mazo de cantero",0,10,0],["pavés de madera",3,10,"paves_madera"],["guantes sin dedos",8,11,0],["anillo con gema",8,12,"anillo_gema"],["arco de hueso de araña",1,12,0],["armadura silvestre",5,12,0],["broche de esmalte",8,12,"broche_esmalte"],["capucha de malla",4,12,"capucha_malla"],["chapel de hierro",4,12,"chapel"],["cota de malla",5,12,"cota_malla"],["guantes de tela",8,12,"guantes_tela"],["guja",0,12,0],["hacha de asta",0,12,"hacha_asta"],["perneras de lianas",6,12,0],["guantes de malla",8,13,"guantes_malla"],["brazales",8,14,0],["hacha de garfio",0,14,"hacha_garfio"],["la gota",0,14,0],["labrys",0,14,0],["mitones de malla",8,14,"mitones_malla"],["armadura de láminas",5,15,"armadura_laminas"],["botas de siete leguas",7,15,"botas_siete_leguas"],["escudo mediano de metal",3,15,"escudo_metal_m"],["espadón de hueso",0,15,0],["grebas de nácar",6,15,"grebas_nacar"],["guanteletes articulados",8,15,0],["lanza de fuego",1,15,"lanza_fuego"],["peto de acero",5,15,"peto_acero"],["almófar",4,16,0],["armadura de bandas",5,16,"armadura_bandas"],["armadura de placas",5,16,"armadura_placas"],["ballesta de veneno de araña",1,16,"ballesta_de_arana"],["bardiche",0,16,0],["escudo alado",3,16,0],["espada larga",0,16,0],["galea",4,16,0],["media placa",5,16,0],["placas de dragón",5,16,"placas_dragon"],["placas de mithril",5,16,"placas_mithril"],["tridente de Kor",0,16,"tridente_kor"],["barbuta",4,17,0],["yelmo nasal",4,17,0],["aspis de bronce",3,18,"aspis_bronce"],["estoque",0,18,0],["hacha de batalla",0,18,"hacha_batalla"],["morrión",4,18,0],["pico de cuervo",0,18,"pico_cuervo"],["tridente",0,18,0],["armet",4,19,0],["celada",4,19,0],["yelmo de nácar",4,19,"casco_nacar"],["arco de rubí",1,20,0],["arco largo",1,20,0],["ballesta de repetición",1,20,"ballesta_repeticion"],["botas de nácar",7,20,"botas_nacar"],["escudo cometa",3,20,0],["escudo de púas",3,20,"escudo_puas"],["faldar de malla",6,20,0],["gran yelmo",4,20,0],["guanteletes de acero",8,20,"guanteletes_acero"],["pavés de metal",3,20,"paves_metal"],["peto de mando",5,20,"peto_mando"],["placas enanas",5,20,0],["espada bastarda",0,22,0],["guadaña de guerra",0,22,"guadana_guerra"],["guanteletes mixtos",8,22,0],["guanteletes de púas",8,23,"guanteletes_puas"],["alabarda",0,24,0],["gran hacha",0,24,0],["guanteletes de relojero",8,24,"guanteletes_reloj"],["hacha ono",0,24,0],["katana",0,24,0],["martillo de Lucerna",0,24,"martillo_lucerna"],["armadura celestial",5,25,0],["ballesta pesada",1,25,0],["escudo del hechicero",3,25,"escudo_hechicero"],["grebas de acero",6,25,0],["guantelete de placa",8,25,"guantelete_placa"],["mandoble",0,25,0],["mandoble del veterano",0,25,0],["yelmo de rana",4,25,"yelmo_rana"],["pantalones de runas",6,28,0],["arco de tejo",1,30,0],["espada de los antiguos",0,30,0],["flecha de punta ancha",2,30,0],["sable del destierro",0,30,0],["virote de acero",2,30,0],["espada de obsidiana",0,36,0],["grebas doradas",6,40,0],["espada de marfil",0,42,0],["grebas del guardián selvático",6,45,0],["espada de rubí",0,48,0],["espada glacial",0,55,0],["grebas del sultán",6,55,0],["hoja de ámbar",0,62,0],["grebas de la aurora",6,65,0],["colmillo del sol",0,70,0],["faldón del archimago",6,75,0],["filo de amatista",0,78,0],["grebas de amatista",6,85,0],["mandoble de jade",0,86,0],["grebas de jade",6,90,0],["colmillo del invierno",0,100,0],["grebas de cristal",6,100,0],["devoradora carmesí",0,120,0]];
// wands gate on magic level, not character level: content/items/vara_*.yaml:8, docs/systems/high-tier-items.md:71-73 (01 Q4)
const WANDS=[["vara de la chispa",10,1200,"vara_de_la_chispa"],["vara del ojo carmesí",15,8000,"vara_del_ojo_carmesi"],["vara del oráculo",20,24000,"vara_del_oraculo"]];
const creExp=fl=>Math.floor(stepExp(fl)/100);
const creSlug=r=>r[5]||fold(r[0]);
const gearSlug=r=>r[3]||fold(r[0]);

// ======================================================================
// deathcost: minutes lost by one death vs level under three rules
// ======================================================================
reg('deathcost',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let c=null,hov=30,tick=()=>{},first=true;
  const ephOf=L=>{const ov=c0.segv('ov');return ov==='1500'?1500:eph(L)/(ov==='x3'?3:1);};
  const mins=(loss,L)=>loss/ephOf(L)*60;
  const prop=L=>{const p=c0.v('pct')/100,sc=c0.v('scaled');return p*expL(L)*(sc&&L>24?24/L:1);};
  const tib=L=>lossTibia(L)*(c0.v('bless')?.6:1);
  function draw(){c0.out('pct',c0.v('pct')+' %');const lg=c0.v('logx');
    c=frame(svg,360,250,[16,10,30,44],lg?1:0,120,1,5000,{xlog:lg,ylog:true});
    svgEl('rect',{x:c.l,y:c.Y(60),width:c.r-c.l,height:c.Y(30)-c.Y(60),fill:GRN,'fill-opacity':.1},svg);
    svgText(svg,c.r-3,c.Y(60)+9,'"about one session": 30 to 60 min (vision §2.5)',{'text-anchor':'end','font-size':8.5,fill:GRN});
    yTicks(svg,c,[1,3,10,30,60,180,600,1800],v=>v>=60?(v/60)+' h':v+' m');
    xTicks(svg,c,lg?[1,2,5,10,20,50,100]:[1,20,40,60,80,100,120]);axis(svg,c);
    const pts=f=>{const o=[];for(let L=lg?1:1;L<=120;L++)o.push([c.X(L),c.Y(clamp(mins(f(L),L),1,5000))]);return o;};
    const la=line(svg,pts(lossFlat),{stroke:YEL,'stroke-width':2.2}),lt=line(svg,pts(tib),{stroke:BLU,'stroke-width':1.8,'stroke-dasharray':'5 3'}),lp=line(svg,pts(prop),{stroke:PNK,'stroke-width':1.8});
    if(first){tick=drawOn([la,lt,lp],2.2);first=false;}else tick=()=>{};
    keysV(svg,c.l+8,c.top+10,[{c:YEL,t:'Asterion: flat 10 % of exp'},{c:BLU,t:'Tibia 8.41: level-scaled loss'+(c0.v('bless')?', 5 blessings':''),dash:'5 3'},{c:PNK,t:`proposed: ${c0.v('pct')} %${c0.v('scaled')?' tapering as 24/L past 24':''} (illustrative)`}],11);
    ylab(svg,c,'Minutes to re-earn one death (log)');xlab(svg,c,'Level'+(lg?' (log)':''));
    const x=c.X(hov);svgEl('line',{x1:x,x2:x,y1:c.top,y2:c.bot,stroke:TXT,'stroke-opacity':.35,'pointer-events':'none'},svg);
    [[lossFlat,YEL],[tib,BLU],[prop,PNK]].forEach(([f,col])=>svgEl('circle',{cx:x,cy:c.Y(clamp(mins(f(hov),hov),1,5000)),r:3,fill:col,stroke:'#0e0c12'},svg));show();}
  function show(){const L=hov,e=ephOf(L),f=v=>{const m=mins(v,L);return m>=120?(m/60).toFixed(1)+' h':Math.round(m)+' min';};
    const lv=v=>(v/stepExp(L)).toFixed(2);
    ro.innerHTML=`<b>Level ${L}</b> at ${nf(e)} exp/h: Asterion loses ${nf(lossFlat(L))} exp = <b>${f(lossFlat(L))}</b> (${lv(lossFlat(L))} levels) · Tibia 8.41 ${nf(tib(L))} exp = ${f(tib(L))} · proposed ${nf(prop(L))} exp = ${f(prop(L))}`+
      `<br>Dying at the top of the level costs up to ${(expL(L+1)/Math.max(1,expL(L))).toFixed(1)}× more. One 45-minute session = ${(mins(lossFlat(L),L)/45).toFixed(1)} sessions lost under the flat rule.`;}
  hover(svg,()=>c,v=>{const L=clamp(Math.round(v),1,120);if(L!==hov){hov=L;draw();}});
  ['pct','scaled','bless','logx'].forEach(k=>c0.on(k,draw));c0.seg('ov',draw);draw();
  return {tick(dt){tick(dt);}};});

// ======================================================================
// corpserun: live walk from the temple back to the corpse inside the 30-minute window
// ======================================================================
reg('corpserun',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);
  const W=360,H=120,X0=28,X1=332,PY=74,WINDOW=1800,RATE=60;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  let st=null,rng=mkRng(11),runs=0,rot=0;
  // static scene
  const g=svgEl('g',{},svg);
  svgEl('rect',{x:0,y:0,width:W,height:H,fill:'#0b0a0f'},g);
  svgEl('line',{x1:X0,x2:X1,y1:PY,y2:PY,stroke:DIM,'stroke-dasharray':'2 4'},g);
  svgEl('path',{d:`M${X0-10} ${PY+8}h20v-12l-10-8-10 8z`,fill:'none',stroke:YEL,'stroke-width':1.4},g);svgText(g,X0,PY+22,'temple',{'text-anchor':'middle','font-size':9,fill:YEL});
  const bag=svgEl('path',{d:`M${X1-6} ${PY+5}h12v-8l-3-4h-6l-3 4z`,fill:'#3a2a1a',stroke:ORG,'stroke-width':1.3},g);const bagT=svgText(g,X1+12,PY+22,'corpse · bag',{'text-anchor':'end','font-size':9,fill:ORG});
  svgEl('rect',{x:X0,y:14,width:X1-X0,height:7,fill:'#1d1924',stroke:DIM,'stroke-width':.6},g);
  const clock=svgEl('rect',{x:X0,y:14,width:X1-X0,height:7,fill:GRN},g);const clockT=svgText(g,X1,32,'',{'text-anchor':'end','font-size':9,fill:MUTE});
  const tiles=svgText(g,X0,11,'',{'font-size':9,fill:MUTE});
  const friend=svgEl('circle',{r:3.2,cy:PY-9,fill:BLU},g),friendT=svgText(g,0,PY-15,'friend',{'text-anchor':'middle','font-size':8,fill:BLU});
  const me=svgEl('circle',{r:4,cy:PY,fill:TXT,stroke:'#0e0c12'},g),meT=svgText(g,0,PY-5,'you',{'text-anchor':'middle','font-size':8,fill:TXT});
  const msg=svgText(g,W/2,H-6,'',{'text-anchor':'middle','font-size':10,fill:TXT});
  const xOf=(t,d)=>X0+(X1-X0)*clamp(t/d,0,1);
  function reset(){const d=c0.v('d'),lv=c0.v('lv'),delay=c0.v('delay')*60,party=c0.v('party');
    st={d,lv,delay,party,t:0,me:0,fr:0,acc:0,facc:0,ms:stepMs(lv),fms:stepMs(Math.min(255,lv+20)),phase:'wait',done:0,arrived:null,farrived:null};
    runs++;bag.setAttribute('opacity',1);bagT.textContent='corpse · bag';friend.setAttribute('opacity',party?1:0);friendT.setAttribute('opacity',party?1:0);msg.textContent='';
    c0.out('d',d+' tiles');c0.out('lv',`${lv} (${st.ms} ms/tile)`);c0.out('delay',c0.v('delay')+' min');
    const walk=d*st.ms/60000;
    ro.innerHTML=`Death ${runs} at <b>${d} tiles</b>, level ${lv}: the walk is ${d} × ${st.ms} ms = <b>${mm(walk)}</b>, the window 30:00. Leaving after ${c0.v('delay')} min leaves ${mm(Math.max(0,30-walk-c0.v('delay')))} of slack`+
      (party?`; the friend (level ${Math.min(255,lv+20)}, ${st.fms} ms) arrives at ${mm(d*st.fms/60000+c0.v('delay'))}`:'')+'.'+(rot?` Rotted so far: ${rot} of ${runs-1}.`:'');}
  function paint(){const s=st,left=Math.max(0,WINDOW-s.t);clock.setAttribute('width',(X1-X0)*left/WINDOW);clock.setAttribute('fill',left<300?RED:left<900?YEL:GRN);
    clockT.textContent=`corpse window ${mm(left/60)} left · clock ×${RATE}`;tiles.textContent=s.phase==='wait'?`at the temple, leaving in ${mm(Math.max(0,s.delay-s.t)/60)}`:`${Math.min(s.me,s.d)} / ${s.d} tiles`;
    const x=xOf(s.me,s.d);me.setAttribute('cx',x);meT.setAttribute('x',x);const fx=xOf(s.fr,s.d);friend.setAttribute('cx',fx);friendT.setAttribute('x',fx);}
  ['d','lv','delay','party'].forEach(k=>c0.on(k,()=>{reset();paint();}));
  reset();paint();
  return {tick(dt){const s=st;if(!motion&&s.phase!=='wait'&&s.phase!=='walk'){return;}
    if(s.phase==='done'){s.done+=dt;if(s.done>2.4)reset();return;}
    const g=dt*RATE;s.t+=g;
    if(s.phase==='wait'&&s.t>=s.delay)s.phase='walk';
    if(s.phase==='walk'){s.acc+=g*1000;while(s.acc>=s.ms&&s.me<s.d){s.acc-=s.ms;s.me++;}
      if(s.party){s.facc+=g*1000;while(s.facc>=s.fms&&s.fr<s.d){s.facc-=s.fms;s.fr++;}if(s.fr>=s.d&&s.farrived==null)s.farrived=s.t;}
      if(s.me>=s.d){s.arrived=s.t;s.phase='done';bag.setAttribute('opacity',.25);bagT.textContent='bag recovered';
        msg.textContent=`Reached the corpse at ${mm(s.t/60)} with ${mm((WINDOW-s.t)/60)} to spare`+(s.farrived!=null?` · the friend held it from ${mm(s.farrived/60)}`:'');msg.setAttribute('fill',GRN);}}
    if(s.t>=WINDOW&&s.phase!=='done'){if(s.party&&s.fr>=s.d){s.phase='done';msg.textContent=`Window closed at 30:00, but the friend had the bag since ${mm(s.farrived/60)}`;msg.setAttribute('fill',BLU);}
      else{s.phase='done';rot++;bag.setAttribute('opacity',0);bagT.textContent='bones gone';msg.textContent=`Corpse rotted at 30:00 · you were ${s.d-s.me} tiles short`;msg.setAttribute('fill',RED);}}
    paint();}};
  });

// ======================================================================
// session: a session at level L as a stacked bar (walk out, hunt, walk back, death walks)
// ======================================================================
reg('session',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let segs=[],t=0,anim=motion,rects=[];
  const tilesOut=L=>Math.min(600,120+4*L); // illustrative: the black iron chain's step 7 is 459 steps from town (GDD:380)
  function model(){const L=c0.v('lv'),len=c0.v('len'),risk=c0.v('risk')/100,stone=c0.v('stone');
    const ms=stepMs(L),out=tilesOut(L)*ms/60000,back=stone?0:out,kph=eph(L)*100/stepExp(L);
    const avail=Math.max(0,len-out-back),hunt=avail/(1+kph*risk*out/60),deaths=hunt/60*kph*risk,dwalk=deaths*out;
    const gained=hunt/60*eph(L),lost=deaths*lossFlat(L),net=gained-lost,swings=hunt*60/2*.5,sw=Math.round(10+L*1.2);
    return {L,len,risk,stone,ms,out,back,hunt,deaths,dwalk,gained,lost,net,swings,sw,kph,share:net/stepExp(L),rung:swings/A.skillTries(sw)};}
  function draw(){const m=model();c0.out('lv',m.L);c0.out('len',m.len+' min');c0.out('risk',c0.v('risk').toFixed(2)+' %');
    svg.setAttribute('viewBox','0 0 360 150');svg.innerHTML='';const l=10,r=350,X=v=>l+(r-l)*v/m.len;
    segs=[['walk out',m.out,MUTE],['hunt',m.hunt,GRN],['death walks',m.dwalk,RED],['walk back',m.back,'#7a6e8c']];
    svgText(svg,l,14,`${m.len} min at level ${m.L}: ${m.ms} ms per tile, ${nf(m.kph)} band kills/h`,{'font-size':10,fill:TXT});
    let x=l;rects=[];segs.forEach(([n,v,col])=>{const w=(r-l)*v/m.len;const rc=svgEl('rect',{x,y:24,width:w,height:30,fill:col,'fill-opacity':.85},svg);rects.push([rc,x,w]);
      if(w>34)svgText(svg,x+w/2,43,`${n} ${mm(v)}`,{'text-anchor':'middle','font-size':9.5,fill:'#0e0c12'});x+=w;});
    [0,.25,.5,.75,1].forEach(f=>{svgText(svg,X(f*m.len),66,mm(f*m.len),{'text-anchor':f===0?'start':f===1?'end':'middle','font-size':9});});
    keys(svg,l,82,segs.map(([n,,c])=>({c,t:n,box:1})));
    // exp bar: share of the current level
    svgText(svg,l,104,`Exp this session as a share of level ${m.L} (${nf(stepExp(m.L))} wide)`,{'font-size':10,fill:TXT});
    svgEl('rect',{x:l,y:110,width:r-l,height:14,fill:'#1d1924',stroke:DIM,'stroke-width':.6},svg);
    const sh=clamp(m.share,0,1);const eb=svgEl('rect',{x:l,y:110,width:(r-l)*sh,height:14,fill:YEL},svg);rects.push([eb,l,(r-l)*sh]);
    if(m.lost>0){const lw=(r-l)*clamp(m.lost/stepExp(m.L),0,1);svgEl('rect',{x:l+(r-l)*sh,y:110,width:Math.min(lw,r-l-(r-l)*sh),height:14,fill:RED,'fill-opacity':.6},svg);}
    svgText(svg,r,138,`${Math.round(m.share*100)} % of the level net of ${m.deaths.toFixed(1)} expected deaths${m.share>1?' (more than a level)':''}`,{'text-anchor':'end','font-size':9.5,fill:YEL});
    ro.innerHTML=`Hunt <b>${mm(m.hunt)}</b> of ${m.len}: +${nf(m.gained)} exp at ${nf(eph(m.L))} exp/h, minus ${nf(m.lost)} to ${m.deaths.toFixed(2)} expected deaths = <b>${nf(m.net)}</b> (${Math.round(m.share*100)} % of level ${m.L}).`+
      `<br>${nf(m.swings)} swings at one per 2 s, half the time (balance.go:129) = ${nf(m.swings)} sword tries, ${m.rung.toFixed(2)} of a rung at sword ${m.sw} (illustrative skill for the level). Each death: ${nf(lossFlat(m.L))} exp = ${Math.round(lossFlat(m.L)/eph(m.L)*60)} min to re-earn plus a ${mm(m.out)} walk back${m.stone?'; heartstone saves the walk home (recall.go:43)':''}.`;
    t=0;anim=motion;}
  ['lv','len','risk','stone'].forEach(k=>c0.on(k,draw));draw();
  return {tick(dt){if(!anim)return;t+=dt;const p=Math.min(1,t/1.4),e=1-Math.pow(1-p,3);rects.forEach(([rc,x,w])=>rc.setAttribute('width',Math.max(0,w*e)));if(p>=1)anim=false;}};});

// ======================================================================
// partyshare: exp per member per hour for party sizes 1 to 5
// ======================================================================
reg('partyshare',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let hov=2,t=0,auto=true,idle=0;
  function members(n){const gap=c0.v('gap'),L0=30,ls=[];for(let i=0;i<n;i++)ls.push(L0+(n>1?gap*i/(n-1):0));const mx=Math.max(...ls);
    return ls.map(l=>({l,ok:!c0.v('rule')||l>=mx*2/3}));}
  function shares(n){const b=1+c0.v('bonus')/100,ms=members(n),mode=c0.segv('mode'),k=ms.filter(m=>m.ok).length;
    return ms.map(m=>({...m,v:!m.ok?0:mode==='one'?b/k:b}));}
  function draw(){c0.out('bonus','+'+c0.v('bonus')+' %');c0.out('gap',c0.v('gap')+' levels');
    const c=frame(svg,360,216,[16,10,40,52],.5,5.5,0,2.2);yTicks(svg,c,[0,.5,1,1.5,2],v=>Math.round(v*100)+' %');axis(svg,c);
    svgEl('line',{x1:c.l,x2:c.r,y1:c.Y(1),y2:c.Y(1),stroke:TXT,'stroke-opacity':.4,'stroke-dasharray':'3 3'},svg);svgText(svg,c.l+4,c.top+9,'dashed line: one solo player · bottom row: party total',{'font-size':8.5,fill:TXT});
    for(let n=1;n<=5;n++){const sh=shares(n),gw=c.X(1)-c.X(0),bw=Math.min(14,gw*.8/n),x0=c.X(n)-bw*n/2;
      if(n===hov)svgEl('rect',{x:c.X(n)-gw/2,y:c.top,width:gw,height:c.bot-c.top,fill:'#fff','fill-opacity':.05},svg);
      sh.forEach((m,i)=>{const y=c.Y(m.v);svgEl('rect',{x:x0+i*bw+1,y,width:bw-2,height:c.bot-y,fill:m.ok?GRN:DIM,'fill-opacity':m.ok?.85:.6},svg);
        if(!m.ok)svgText(svg,x0+i*bw+bw/2,c.bot-4,'×',{'text-anchor':'middle','font-size':9,fill:RED});});
      const tot=sh.reduce((a,m)=>a+m.v,0);svgText(svg,c.X(n),c.bot+13,n===1?'solo':String(n),{'text-anchor':'middle','font-size':10});
      svgText(svg,c.X(n),c.bot+24,`${Math.round(tot*100)} %`,{'text-anchor':'middle','font-size':8.5,fill:MUTE});
      const r=svgEl('rect',{x:c.X(n)-gw/2,y:c.top,width:gw,height:c.bot-c.top,fill:'transparent'},svg);
      r.addEventListener('pointerenter',()=>{hov=n;auto=false;idle=0;draw();});r.addEventListener('click',()=>{hov=n;auto=false;idle=0;draw();});}
    ylab(svg,c,'Exp per member per hour, % of solo');xlab(svg,c,'Party size',c.H-1);show();}
  function show(){const n=hov,sh=shares(n),mode=c0.segv('mode'),b=c0.v('bonus'),cut=sh.filter(m=>!m.ok).length,L=30;
    const per=(sh.find(m=>m.ok)||sh[0]).v,abs=nf(eph(L)*per);
    ro.innerHTML=`<b>${n===1?'Solo':n+' members'}</b>, ${mode==='one'?'one creature shared':'one creature each (spawn allows it)'}, +${b} % on the kill (party.go:63): ${Math.round(per*100)} % of solo per eligible member, ${abs} exp/h at level ${L} on the band ladder`+
      (cut?`. ${cut} of ${n} fall under the 2/3 level rule (lowest below two thirds of the highest, Tibia's rule) and get nothing`:'')+'.'+
      (mode==='one'&&n>1?` Sharing one target, a pair earns ${Math.round(per*100)} % each: grouping pays only when the spawn has a creature per member.`:'');}
  ['bonus','gap','rule'].forEach(k=>c0.on(k,()=>{auto=false;idle=0;draw();}));c0.seg('mode',()=>{auto=false;idle=0;draw();});draw();
  return {tick(dt){if(!motion)return;t+=dt;idle+=dt;if(!auto&&idle>8)auto=true;if(auto&&t>2.4){t=0;hov=hov%5+1;draw();}}};});

// ======================================================================
// gearladder: items by min_level as rungs on the level axis, wands on a magic-level lane
// ======================================================================
reg('gearladder',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let c=null,cur=1,auto=true,idle=0,t=0,curEl=null;
  const byLevel=new Map();GEAR.forEach(g=>{const k=g[2];if(!byLevel.has(k))byLevel.set(k,[]);byLevel.get(k).push(g);});
  function draw(){const zoom=c0.segv('zoom')==='40',xmax=zoom?42:124,LH=16,lanes=KINDS.length,H=20+lanes*LH+70;
    c=frame(svg,360,H,[14,8,56,62],0,xmax,0,1);
    for(let i=0;i<lanes;i++){const y=c.top+i*LH;svgEl('rect',{x:c.l,y,width:c.r-c.l,height:LH,fill:i%2?'#fff':'none','fill-opacity':.03},svg);svgText(svg,c.l-5,y+LH/2+3.5,LANE[i],{'text-anchor':'end','font-size':9.5,fill:KC[i]});}
    const lanesBot=c.top+lanes*LH;svgEl('line',{x1:c.l,x2:c.r,y1:lanesBot,y2:lanesBot,class:'ax'},svg);
    const ticks=zoom?[0,5,10,15,20,25,30,35,40]:[0,20,40,60,80,100,120];ticks.forEach(v=>{svgEl('line',{x1:c.X(v),x2:c.X(v),y1:c.top,y2:lanesBot,class:'gl'},svg);svgText(svg,c.X(v),lanesBot+11,v,{'text-anchor':'middle','font-size':9.5});});
    [[35,'Ingwen'],[100,'Gorothland']].forEach(([v,tx])=>{if(v>xmax)return;svgEl('line',{x1:c.X(v),x2:c.X(v),y1:c.top-6,y2:lanesBot,stroke:BLU,'stroke-dasharray':'3 3','stroke-opacity':.7},svg);const right=v>xmax*.75;svgText(svg,c.X(v)+(right?-3:3),c.top-1,tx,{'font-size':8.5,fill:BLU,'text-anchor':right?'end':'start'});});
    svgText(svg,(c.l+c.r)/2,lanesBot+23,'Character level (min_level)',{'text-anchor':'middle','font-size':9.5});
    const stack={};GEAR.forEach((g,i)=>{if(g[2]>xmax)return;const k=g[1]+':'+g[2],n=stack[k]=(stack[k]||0)+1,lane=g[1],y0=c.top+lane*LH+LH-2,w=zoom?6:3;
      const a=svgEl('a',{href:'#atlas-'+gearSlug(g),class:'dot','data-i':i},svg);a.setAttribute('aria-label',`${g[0]}, ${KINDS[g[1]]}, level ${g[2]}`);
      svgEl('rect',{x:c.X(g[2])-w/2,y:y0-3-(n-1)*3.2,width:w,height:2.6,fill:KC[lane],rx:.6},a);
      a.addEventListener('pointerenter',()=>{auto=false;idle=0;pick(g[2],g);});a.addEventListener('focus',()=>{auto=false;idle=0;pick(g[2],g);});});
    // magic-level lane for the three wands
    const my=lanesBot+40,ml=v=>c.l+(c.r-c.l)*v/22;svgEl('line',{x1:c.l,x2:c.r,y1:my,y2:my,class:'ax'},svg);
    svgText(svg,c.l-5,my+3.5,'wand',{'text-anchor':'end','font-size':9.5,fill:PUR});[0,5,10,15,20].forEach(v=>{svgEl('line',{x1:ml(v),x2:ml(v),y1:my-10,y2:my,class:'gl'},svg);svgText(svg,ml(v),my+11,v,{'text-anchor':'middle','font-size':9.5});});
    svgText(svg,(c.l+c.r)/2,my+23,'Magic level (min_magic_level)',{'text-anchor':'middle','font-size':9.5});
    WANDS.forEach(w=>{const a=svgEl('a',{href:'#atlas-'+w[3],class:'dot'},svg);a.setAttribute('aria-label',`${w[0]}, magic level ${w[1]}`);svgEl('rect',{x:ml(w[1])-3,y:my-9,width:6,height:7,fill:PUR,rx:.8},a);
      a.addEventListener('pointerenter',()=>{auto=false;idle=0;ro.innerHTML=`<b>${esc(w[0])}</b>: magic level ${w[1]}, ${nf(w[2])} gold (vara_*.yaml:8, high-tier-items.md:71-73). Magic level ${w[1]} is ${nf(1600*(Math.pow(1.4,w[1])-1)/.4)} mana spent, ${Math.round(1600*(Math.pow(1.4,w[1])-1)/.4/600)} fed hours at 600 mana/h.`;});});
    curEl=svgEl('line',{x1:c.X(cur),x2:c.X(cur),y1:c.top,y2:lanesBot,stroke:TXT,'stroke-opacity':.5,'pointer-events':'none'},svg);
    svg.onpointermove=e=>{const x=vbX(svg,e),y=vbY(svg,e);if(y>lanesBot+14||x<c.l)return;auto=false;idle=0;const L=clamp(Math.round(c.inv(x)),1,120);if(L!==cur)pick(L);};}
  function pick(L,g){cur=L;if(curEl){curEl.setAttribute('x1',c.X(Math.min(L,c.inv(c.r))));curEl.setAttribute('x2',c.X(Math.min(L,c.inv(c.r))));}
    const here=byLevel.get(L)||[],below=GEAR.filter(x=>x[2]<=L).length;
    const list=here.slice(0,6).map(x=>`<a href="#atlas-${gearSlug(x)}">${esc(x[0])}</a>`).join(', ')+(here.length>6?` and ${here.length-6} more`:'');
    ro.innerHTML=(g?`<b>${esc(g[0])}</b> (${KINDS[g[1]]}) opens at level ${g[2]}. `:`<b>Level ${L}</b>: `)+(here.length?`${here.length} item${here.length>1?'s':''} unlock here: ${list}. `:'nothing unlocks here. ')+`${below} of 131 gated items are open at level ${L}; ${131-below} remain${L>=40?' (five tiers in 80 levels past the juramento set at 40)':''}.`;}
  c0.seg('zoom',()=>{auto=false;idle=0;draw();pick(cur);});draw();pick(16);
  return {tick(dt){if(!motion)return;idle+=dt;if(!auto&&idle>8)auto=true;if(!auto)return;t+=dt;if(t>.9){t=0;const lv=[...byLevel.keys()].sort((a,b)=>a-b),i=lv.indexOf(cur);pick(lv[(i+1)%lv.length]);}}};});

// ======================================================================
// bestiary: creatures as dots, farm level on x, exp (or HP) on y
// ======================================================================
reg('bestiary',root=>{const svg=$('svg',root),c0=ctl(root),ro=$('[data-ro]',root);let c=null,cur=null,auto=true,idle=0,t=0,order=CRE.map((_,i)=>i);
  const vis=w=>c0.v('w'+w);
  function draw(){const hp=c0.segv('y')==='hp';
    c=frame(svg,360,260,[14,10,30,46],-2,180,hp?10:1,hp?8000:20000,{ylog:true});
    yTicks(svg,c,hp?[10,30,100,300,1000,3000]:[1,10,100,1000,10000],v=>nf(v));xTicks(svg,c,[0,25,50,75,100,125,150,175]);axis(svg,c);
    [[35,'Ingwen'],[100,'Gorothland']].forEach(([v,tx])=>{svgEl('line',{x1:c.X(v),x2:c.X(v),y1:c.top,y2:c.bot,stroke:BLU,'stroke-dasharray':'3 3','stroke-opacity':.5},svg);svgText(svg,c.X(v)+3,c.bot-5,tx,{'font-size':8.5,fill:BLU});});
    if(!hp){const pts=[];for(let L=1;L<=178;L++)pts.push([c.X(L),c.Y(Math.max(1,creExp(L)))]);poly(svg,pts,{stroke:YEL,'stroke-width':1,'stroke-opacity':.5,'stroke-dasharray':'2 3'});svgText(svg,c.X(104),c.Y(500),'D69: exp = step(L) / 100',{'font-size':8.5,fill:YEL});}
    CRE.forEach((r,i)=>{if(!vis(r[3]))return;const y=hp?r[2]:creExp(r[1]),rad=1.2+Math.sqrt(r[2])/16;
      const a=svgEl('a',{href:'#atlas-'+creSlug(r),class:'dot'+(i===cur?' on':''),'data-i':i},svg);a.setAttribute('aria-label',`${r[0]}, level ${r[1]}, ${r[2]} HP, ${creExp(r[1])} exp`);
      svgEl('circle',{cx:c.X(r[1]),cy:c.Y(Math.max(hp?10:1,y)),r:rad,fill:WC[r[3]],'fill-opacity':r[4]?.25:.7,stroke:r[4]?TXT:'none','stroke-width':r[4]?1.2:0},a);
      a.addEventListener('pointerenter',()=>{auto=false;idle=0;pick(i);});a.addEventListener('focus',()=>{auto=false;idle=0;pick(i);});});
    ylab(svg,c,hp?'HP (log)':'Exp per kill (log)');xlab(svg,c,'max_farm_level (the band the creature is tuned for)');
    keys(svg,c.l+8,c.top+10,[{c:TXT,t:'ring = boss, area = HP',dot:1}]);}
  function pick(i){cur=i;const r=CRE[i];$$('.dot',svg).forEach(d=>d.classList.toggle('on',+d.dataset.i===i));
    const kills=Math.round(stepExp(r[1])/creExp(r[1]));
    ro.innerHTML=`<a href="#atlas-${creSlug(r)}"><b>${esc(r[0])}</b></a>${r[4]?' (boss)':''} · ${WORLDS[r[3]]} · band ${r[1]} · ${nf(r[2])} HP · ${nf(creExp(r[1]))} exp a kill, so ${kills} kills are one level at level ${r[1]} (D69, GDD:411) · ${(r[2]/creExp(r[1])).toFixed(1)} HP per exp. Click to open the Atlas card.`;}
  for(let w=0;w<5;w++)c0.on('w'+w,()=>{auto=false;idle=0;draw();});c0.seg('y',()=>{auto=false;idle=0;draw();});draw();pick(order[8]);
  return {tick(dt){if(!motion)return;idle+=dt;if(!auto&&idle>8)auto=true;if(!auto)return;t+=dt;if(t>.7){t=0;let n=0,i=cur;do{i=(i+1)%CRE.length;n++;}while(!vis(CRE[i][3])&&n<CRE.length);pick(i);}}};});

// ======================================================================
// dashboard: telemetry events (left) and the metrics they feed (right)
// ======================================================================
// events: [key, label, proposed, definition]  (01 Q7, 09 §5.1 and §5.2)
const EV=[['ss','session_start',0,'Login; opens a session id (sid).'],['se','session_end',0,'Duration and net exp of the session.'],['kill','kill',0,'Creature, the killer\'s exp share, fight duration from first damage, position.'],
  ['death','death',0,'Source, exp lost, level, position.'],['level','level',0,'A level-up, with its timestamp.'],['dd','damage_dealt',0,'One record per hit landed; the count is swings.'],['dt','damage_taken',0,'Hits received, the shielding tries.'],
  ['heal','heal',0,'Healing with its source (food, potion, temple, spell).'],['mana','mana',0,'Mana spent, which is what magic level counts.'],['cons','consume',0,'Food and potions eaten.'],['loot','loot_take',0,'An item taken from a corpse.'],
  ['dest','item_destroy',0,'Quest items destroyed on death.'],['shop','shop_buy / shop_sell',0,'Shop trades with price.'],['gold','gold',0,'Signed gold movement with a reason.'],['quest','quest_* / quest_step',0,'Offered, accepted, complete, reset; quest_step carries ms since the previous step.'],
  ['ferry','ferry',0,'A boat trip between worlds.'],['eq','equip / unequip',0,'Gear changes, the kit per hunting ground.'],
  ['cr','corpse_recovered',1,'A1: ms since the death, items taken, owner or other.'],['dd2','death: items dropped',1,'A2: count and value of the slots and bag that dropped.'],['su','skill_up',1,'A3: new rung, tries and ms since the last rung.'],
  ['ml','magic_level',1,'A4: new magic level and mana spent since the last.'],['sl','spell_learned',1,'A5: spell, gold paid, level and magic level at purchase.'],['hs','heartstone_use',1,'A6: recall or destroyed on death, ms since last use.'],
  ['am','session_end.active_ms',1,'A7: time with input in the trailing 60 s; corrects every per-hour rate.'],['ps','kill.party_size',1,'A8: party size on the kill, solo or party.'],['sv','survey',1,'A9: ten answers from 1 to 7 per session, written by a script.']];
// metrics: [key, label, definition, [event keys]]  (09 §5.3 M1 to M11)
const MET=[['m1','M1 censo funnel','Share of characters reaching each quest_step of the censo chain and the median seconds between steps.',['quest']],
  ['m2','M2 hours per level','Session time between consecutive level events, per player, then the median; compared with the cubic ÷ bot exp/h.',['level','ss','se','am']],
  ['m3','M3 death cost in minutes','Exp lost ÷ the player\'s exp/h over the last three sessions × 60, plus recovery minutes and gold dropped ÷ gold/h. Target: 30 to 60 min.',['death','se','kill','cr','dd2','gold']],
  ['m4','M4 corpse recovery rate','corpse_recovered by the owner within 30 min ÷ deaths; median ms; share looted by someone else first.',['death','cr','loot']],
  ['m5','M5 time to retry','Seconds from a death to the same character\'s next kill; share of deaths followed by logout within 10 min.',['death','kill','se','hs']],
  ['m6','M6 exp/h by ground','World plus a 64×64 cell of the kill position; mechanical rate (harness definition) and session rate; their ratio is the friction factor.',['kill','se','ferry','eq','am']],
  ['m7','M7 party share','Share of kills in a party; exp per member per hour in a party against solo on the same ground.',['kill','ps']],
  ['m8','M8 potion and gold flows','consume per hour by item; gold by reason per session; potion gold per 1,000 exp.',['cons','gold','shop','heal','sl']],
  ['m9','M9 skill rungs per session','ms per rung by skill; tries per active hour; compared with cmd/balance -skills.',['dd','dt','mana','su','ml','am']],
  ['m10','M10 session shape','Duration median and quartiles per player, sessions per week, deaths per session, afk share; filter sessions under 10 min.',['ss','se','death','am','sv']],
  ['m11','M11 level gap in the group','Weekly max − min level among the five and the share of party kills with a gap over 10 levels.',['level','kill','ps']]];
reg('dashboard',root=>{const svg=$('svg',root),ro=$('[data-ro]',root);let sel='m3',auto=true,idle=0,t=0;
  const RH=13.5,W=360,H=22+EV.length*RH+8,LX=8,LW=128,RX=206,RW=148;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const ey=i=>22+i*RH,my=i=>22+(i+.5)*(EV.length*RH)/MET.length;
  const links=[];MET.forEach((m,j)=>m[3].forEach(k=>{const i=EV.findIndex(e=>e[0]===k);if(i>=0)links.push([i,j]);}));
  function draw(){svg.innerHTML='';const selM=MET.findIndex(m=>m[0]===sel),selE=EV.findIndex(e=>e[0]===sel);
    const onE=new Set(),onM=new Set();if(selM>=0){onM.add(selM);links.forEach(([i,j])=>{if(j===selM)onE.add(i);});}if(selE>=0){onE.add(selE);links.forEach(([i,j])=>{if(i===selE)onM.add(j);});}
    svgText(svg,LX,12,'Events (grey = proposed)',{'font-size':10,fill:TXT});svgText(svg,RX,12,'Metrics',{'font-size':10,fill:TXT});
    links.forEach(([i,j])=>{const on=(selM===j)||(selE===i);svgEl('path',{d:`M${LX+LW} ${ey(i)+RH/2}C${LX+LW+40} ${ey(i)+RH/2},${RX-40} ${my(j)},${RX} ${my(j)}`,fill:'none',stroke:on?YEL:DIM,'stroke-opacity':on?.9:.35,'stroke-width':on?1.4:.7},svg);});
    EV.forEach((e,i)=>{const on=onE.has(i),g=svgEl('g',{class:'node',tabindex:0,role:'button','data-k':e[0]},svg);g.setAttribute('aria-label',e[1]);
      svgEl('rect',{x:LX,y:ey(i)+1,width:LW,height:RH-2,rx:2,fill:on?(e[2]?'#2a2535':'#2a2414'):'#17141d',stroke:on?YEL:(e[2]?DIM:'#2e2838'),'stroke-width':on?1.2:.6},g);
      svgText(g,LX+5,ey(i)+RH/2+3.3,e[1],{'font-size':8.6,fill:e[2]?MUTE:(on?YEL:TXT),'font-style':e[2]?'italic':'normal'});});
    MET.forEach((m,j)=>{const on=onM.has(j),g=svgEl('g',{class:'node',tabindex:0,role:'button','data-k':m[0]},svg);g.setAttribute('aria-label',m[1]);
      svgEl('rect',{x:RX,y:my(j)-RH/2+1,width:RW,height:RH-2,rx:2,fill:on?'#2a2414':'#17141d',stroke:on?YEL:'#2e2838','stroke-width':on?1.2:.6},g);
      svgText(g,RX+5,my(j)+3.3,m[1],{'font-size':8.4,fill:on?YEL:TXT});});
    const e=EV[selE],m=MET[selM];
    if(m){const evs=m[3].map(k=>EV.find(x=>x[0]===k)).filter(Boolean);ro.innerHTML=`<b>${m[1]}</b>: ${m[2]} Needs ${evs.map(x=>`<span style="color:${x[2]?MUTE:TXT}">${x[1]}</span>`).join(', ')}${evs.some(x=>x[2])?' (italic/grey = proposed, 09 §5.2)':''}.`;}
    else if(e){const ms=MET.filter(x=>x[3].includes(e[0]));ro.innerHTML=`<b>${e[1]}</b>${e[2]?' (proposed)':' (exists, telemetry.md)'}: ${e[2]?e[3]:esc(e[3])} Feeds ${ms.map(x=>x[1]).join(', ')||'no metric in this list'}.`;}}
  const pick=k=>{sel=k;auto=false;idle=0;draw();};
  svg.addEventListener('click',e=>{const g=e.target.closest('.node');if(g)pick(g.dataset.k);});
  svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const g=e.target.closest('.node');if(g){e.preventDefault();pick(g.dataset.k);}}});
  draw();
  return {tick(dt){if(!motion)return;idle+=dt;if(!auto&&idle>10)auto=true;if(!auto)return;t+=dt;if(t>2.6){t=0;const j=MET.findIndex(m=>m[0]===sel);sel=MET[(j+1+MET.length)%MET.length][0];draw();}}};});
}
