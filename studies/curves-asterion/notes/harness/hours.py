def exp(L): return max((((L-6)*L+17)*L-12)//6*100,0)
# median safe band exp/h per harness level (realistic kit), interpolated linearly in level
pts=[(1,384),(5,2361),(8,5409),(15,19663),(25,37617),(50,210981),(80,410169),(120,660520)]
def eph(L):
    for (a,x),(b,y) in zip(pts,pts[1:]):
        if a<=L<=b: return x+(y-x)*(L-a)/(b-a)
    return pts[-1][1]*(L/120)
cumA=cumB=cumC=0.0; out={}
for L in range(1,151):
    d=exp(L+1)-exp(L)
    cumA+=d/eph(L); cumB+=d/1500; cumC+=d/(eph(L)/3)
    out[L+1]=(cumA,cumB,cumC)
print("| Reach level | Harness band ladder (h) | Same ladder with 3x overhead (h) | Harness default 1,500 exp/h (h) | Sessions of 45 min (band x3) |")
for L in [5,8,10,15,20,25,30,35,40,50,60,80,100,120,150]:
    a,b,c=out[L]; print(f"| {L} | {a:,.1f} | {c:,.1f} | {b:,.0f} | {c/0.75:,.0f} |")
print("\n## death cost in minutes at band ladder, bottom of level: 0.1*exp(L)/eph(L)")
print("| Level | Exp lost | exp/h (band median) | Minutes (band) | Minutes (band x3) | Minutes @1500 |")
for L in [4,8,10,15,20,25,30,40,50,80,100,120]:
    lost=0.1*exp(L); e=eph(L); print(f"| {L} | {lost:,.0f} | {e:,.0f} | {lost/e*60:,.0f} | {lost/e*180:,.0f} | {lost/1500*60:,.0f} |")
