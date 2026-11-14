import math,re,sys
def exp(L):
    if L<1: L=1
    v=(((L-6)*L+17)*L-12)//6*100
    return max(v,0)
hp=lambda L:145+5*L
mana=lambda L:100+10*L
speed=lambda L:300+4*(max(L,1)-1)
beat=lambda L:math.ceil(1000*150/speed(L)/50)*50
print("## exp curve")
print("| Level | Exp | Delta to next | Max HP | Max mana | Speed | Beat ms |")
for L in [1,2,3,5,8,10,12,15,20,25,30,35,40,50,60,70,80,90,100,120,150]:
    print(f"| {L} | {exp(L):,} | {exp(L+1)-exp(L):,} | {hp(L)} | {mana(L)} | {speed(L)} | {beat(L)} |")
print("\n## beat boundaries")
prev=None
for L in range(1,200):
    b=beat(L)
    if b!=prev: print(f"L{L}: speed {speed(L)} beat {b} ms"); prev=b
print("\n## death cost (10% of exp at level L, bottom of level) in minutes under exp/h ladders")
ladders={'rats 480':480,'harness 1500':1500}
print("| Level | Exp lost at bottom | Exp lost at top | @480/h min | @1500/h min |")
for L in [2,3,4,5,8,10,15,20,25,30,40,50,80,100,120]:
    lb=0.1*exp(L); lt=0.1*(exp(L+1)-1)
    print(f"| {L} | {lb:,.0f} | {lt:,.0f} | {lb/480*60:.0f} ({lt/480*60:.0f}) | {lb/1500*60:.0f} ({lt/1500*60:.0f}) |")
print("\n## magic level: mana to next = 1600*1.4^ml")
print("| ML | Mana ml->ml+1 | Cumulative from 0 | Hours at 600 mana/h (food only) | Hours at 5400 mana/h (wand 3 mana per 2 s) | Gold if potion-fed (60 g per 65 mana) |")
cum=0
for ml in range(0,26):
    need=int(1600*1.4**ml); cum+=need
    if ml in (0,1,2,3,4,5,6,7,8,9,10,11,12,15,20,25):
        print(f"| {ml+1} | {need:,} | {cum:,} | {cum/600:,.1f} | {cum/5400:,.1f} | {cum/65*60:,.0f} |")
