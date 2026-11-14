import re,sys
def exp(L):
    v=(((L-6)*L+17)*L-12)//6*100; return max(v,0)
mfl={}; cexp={}
for line in open(sys.argv[2],encoding='utf-8',errors='replace'):
    p=line.rstrip('\n').split('|')
    if len(p)>=3 and p[1].isdigit(): mfl[p[0]]=int(p[1]); cexp[p[0]]=int(p[2])
rows={}; level=None; kit=None
for line in open(sys.argv[1],encoding='utf-8',errors='replace'):
    m=re.match(r'=== nivel (\d+) · kit "([^"]+)" ===',line)
    if m: level=int(m.group(1)); kit=m.group(2); rows.setdefault((level,kit),[]); continue
    if level is None or not line.strip() or line.startswith('criatura') or line.startswith(' '): continue
    cols=re.split(r'\s{2,}',line.strip())
    if len(cols)<8: continue
    try: hp=int(cols[1])
    except: continue
    if hp>=100000: continue
    rows[(level,kit)].append(cols)
def num(s):
    try: return float(s.rstrip('%').replace(',',''))
    except: return None
want={1:'inicial',5:'cuero',8:'cuero',15:'raben (15)',25:'campanas (25)',50:'juramento (40)',80:'banda C',120:'banda D'}
print("| Level | Kit | Band creatures (mfl within L-3..L+7) killable at <=10% death | exp/h | ttk s | Delta exp | Hours per level |")
for (lv,kit),rs in sorted(rows.items()):
    if want.get(lv)!=kit: continue
    d=exp(lv+1)-exp(lv)
    band=[r for r in rs if r[0].lstrip('* ') in mfl and lv-3<=mfl[r[0].lstrip('* ')]<=lv+7 and num(r[6]) is not None and num(r[6])<=10 and num(r[7])]
    band.sort(key=lambda r:-num(r[7]))
    allband=[r for r in rs if r[0].lstrip('* ') in mfl and lv-3<=mfl[r[0].lstrip('* ')]<=lv+7]
    print(f"\n### L{lv} kit {kit}: {len(allband)} band creatures in content, {len(band)} safe; delta exp {d:,}")
    for r in band[:8]:
        n=r[0].lstrip('* '); e=num(r[7]); print(f"| {lv} | {kit} | {r[0]} (mfl {mfl[n]}, exp {cexp[n]}) | {e:,.0f} | {r[3]} | {d:,} | {d/e:.2f} |")
    dead=[r[0] for r in allband if r[6]=='100%']
    if dead: print(f"  band creatures that always kill this character: {', '.join(dead[:10])}")
    if band:
        import statistics
        med=statistics.median(num(r[7]) for r in band); print(f"  median safe band exp/h {med:,.0f} -> {d/med:.2f} h per level; best {num(band[0][7]):,.0f} -> {d/num(band[0][7]):.2f} h")
