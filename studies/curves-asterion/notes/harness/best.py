import re,sys
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
want={1:['inicial','cuero'],5:['inicial','cuero'],8:['cuero','cuero+joyas'],15:['cuero+joyas','raben (15)'],25:['campanas (25)','cuadrilla'],50:['juramento (40)','banda C'],80:['banda C','banda D'],120:['banda D','antiguos']}
for (lv,kit),rs in sorted(rows.items()):
    if kit not in want.get(lv,[]): continue
    safe=[r for r in rs if num(r[6]) is not None and num(r[6])<=5 and num(r[7])]
    safe.sort(key=lambda r:-num(r[7]))
    dead=sum(1 for r in rs if r[6]=='100%')
    print(f"\n## L{lv} {kit}: {len(rs)} creatures, {len(safe)} killable at <=5% death, {dead} always die")
    for r in safe[:5]: print(f"  {r[0]:<26} hp {r[1]:>5} dmg {r[2]:>6} ttk {r[3]:>7} vidas {r[5]:>5} death {r[6]:>4} exp/h {r[7]:>7} gold/h {r[9]:>7}")
    # median exp/h among safe
    if safe:
        v=sorted(num(r[7]) for r in safe); print(f"  median safe exp/h {v[len(v)//2]:.0f}; safe gold/h max {max((num(r[9]) or 0) for r in safe):.0f}")
    for nm in ['rata parda','lobo cinza','esqueleto','oso pardo','troll de la cantera','orco de guerra','comehuesos','berserker orco']:
        for r in rs:
            if r[0]==nm: print(f"    {nm}: death {r[6]} exp/h {r[7]} ttk {r[3]} vidas {r[5]}")
