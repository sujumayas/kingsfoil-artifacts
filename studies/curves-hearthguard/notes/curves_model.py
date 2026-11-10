import math
HP=[1.0,2.3,4.6,8.0,13.0];ATK=[1.0,1.6,2.4,3.3,4.4];STEP=0.07
XP={'wolf':3,'goblin':4,'treant_sapling':5,'giant_spider':5,'wicked_vine':5,'boar':5,'dark_gnome':5,'skeleton':5,'ghost':5,'imp':4,'orc':8,'cultist':6,'bat_swarm':4,'kobold_miner':6,'cave_crawler':8,'glowcap':5,'stone_elemental':10,'deep_one':7,'serpent_man':7,'drowned_acolyte':6,'night_gaunt':6,'gibbering_mass':12,'hellhound':6,'tortured_soul':6,'lilim':8,'ualac':7,'fallen_angel':12}
MHP={'wolf':16,'goblin':22,'treant_sapling':30,'giant_spider':24,'wicked_vine':26,'boar':30,'dark_gnome':16,'skeleton':28,'ghost':22,'imp':18,'orc':45,'cultist':26,'bat_swarm':14,'kobold_miner':30,'cave_crawler':40,'glowcap':24,'stone_elemental':50,'deep_one':34,'serpent_man':28,'drowned_acolyte':26,'night_gaunt':18,'gibbering_mass':56,'hellhound':22,'tortured_soul':26,'lilim':30,'ualac':28,'fallen_angel':60}
R=[{"wolf":5,"goblin":3,"treant_sapling":2,"giant_spider":2,"wicked_vine":2,"boar":1,"dark_gnome":2},{"skeleton":4,"ghost":3,"imp":3,"orc":2,"cultist":2},{"bat_swarm":5,"kobold_miner":3,"cave_crawler":2,"glowcap":2,"stone_elemental":1},{"deep_one":4,"serpent_man":3,"drowned_acolyte":3,"night_gaunt":3,"gibbering_mass":1},{"hellhound":5,"tortured_soul":3,"lilim":3,"ualac":2,"fallen_angel":1}]
OP=[["wolf","goblin","dark_gnome"],["skeleton","imp","ghost"],["bat_swarm","kobold_miner"],["deep_one","night_gaunt"],["hellhound","tortured_soul"]]
EL=[[(160,40),(140,40)],[(130,40),(180,50)],[(200,60),(170,60)],[(200,65),(230,65)],[(190,70),(210,70)]]
BO=[(8000,70,400),(16000,95,700),(28000,130,1100),(42000,160,1500),(60000,190,2000)]
BOSS_S=[150,90,75,75,75]  # boss-wave seconds assumed for adds (bot fighter ch1 ~150 s)
def cnt(c,w): return round([14+8*c,22+12*c,18+10*c,40+30*c,28+16*c][w]*1.08) if w<5 else 0
def span(w): return {0:22.0,3:26.0,5:0.0}.get(w,28.0)
def avg(r,key):
  t=sum(r.values()); return sum(key[k]*v for k,v in r.items())/t
def gold1(x): return 1+int(x/4)
def avg_gold(r):
  t=sum(r.values()); return sum(gold1(XP[k])*v for k,v in r.items())/t
def xp_next(L): return 80+L*70+L*L*6
def fdmg(L): lv=L-1; return 32*1.09**lv+4.8*lv*0.5
def fhp(L): lv=L-1; return 820+68*lv
def farm(L): return 3+0.3*(L-1)
xp=0.0;L=1;gold=0.0;rows=[]
def addxp(a):
  global xp,L
  xp+=a
  while L<30 and xp>=xp_next(L): xp-=xp_next(L); L+=1
for c in range(5):
  xm=2.4+0.65*c; gm=1+0.7*c
  for w in range(6):
    hm=HP[c]*(1+STEP*w); am=ATK[c]*(1+STEP*w); Ls=L
    r={k:1 for k in OP[c]} if w==0 else R[c]
    n=cnt(c,w)
    if w<5:
      wx=n*avg(r,XP)*xm; wg=n*avg_gold(r)*gm
      if w in(2,4):
        e=EL[c][0 if w==2 else 1]; wx+=e[1]*xm; wg+=gold1(e[1])*gm
      ahp=avg(r,MHP)*3.2*hm
    else:
      b=BO[c]; nadds=(3+c)*int((BOSS_S[c]-6)/5+1)
      wx=b[2]*xm+nadds*avg(R[c],XP)*xm; wg=gold1(b[2])*gm+nadds*avg_gold(R[c])*gm; ahp=b[0]
      n=f"boss {b[0]} HP + ~{nadds} adds"
    addxp(wx); gold+=wg
    ratio=(fdmg(Ls)/32)/hm
    hits=ahp/fdmg(Ls)
    tough=(fhp(Ls)*(1+0.06*farm(Ls)))/(820*(1+0.06*3))/am
    rows.append((c+1,w+1,n,span(w),round(hm,2),round(am,2),round(wx),round(wg),Ls,L,round(fdmg(Ls)/32,2),round(ratio,2),round(hits,1),round(tough,2),round(gold)))
print("ch|w|mobs/corridor|span s|HP mult|ATK mult|XP|gold|L start|L end|dmg mult|ratio|hits/avg mob|tough|cum gold")
for r in rows: print("|".join(str(x) for x in r))
print("xp_to_next", [xp_next(l) for l in range(1,26)])
tc=[130,120,150,150,110,120,100,120,100]
print("town lv costs per base 100:",[round(100*1.7**k) for k in range(5)],"all 9 to L1:",sum(tc),"all 9 to L5:",round(sum(b*sum(1.7**k for k in range(5)) for b in tc)))
print("respawn by chapter",[6+1.5*c for c in range(5)],"fire hp",[1400*a for a in ATK],"rush gold per full 12s gap",[round(24*(1+0.7*c)) for c in range(5)],"camp 25s",[round(50*(1+0.7*c)) for c in range(5)])
for c in range(5): print("elite HP ch",c+1,[round(e[0]*3.2*4.5*HP[c]*(1+STEP*w)) for e,w in zip(EL[c],(2,4))])
