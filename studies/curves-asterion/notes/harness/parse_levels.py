import re,sys
rows={}; level=None; kit=None
for line in open(sys.argv[1],encoding='utf-8',errors='replace'):
    m=re.match(r'=== nivel (\d+) · kit "([^"]+)" ===',line)
    if m: level=int(m.group(1)); kit=m.group(2); rows.setdefault((level,kit),[]); continue
    if level is None or not line.strip() or line.startswith('criatura') or line.startswith(' '): 
        if level is not None and line.startswith('    hp'): rows[(level,kit)].append(('__kit__',line.strip()))
        continue
    parts=line.rstrip('\n')
    # columns are right aligned; split by 2+ spaces
    cols=re.split(r'\s{2,}',parts.strip())
    if len(cols)<7: continue
    name=cols[0]; 
    try:
        hp=int(cols[1]); 
    except: continue
    dmg=cols[2]; kill=cols[3]; coste=cols[4]; vidas=cols[5]; muerte=cols[6]; exph=cols[7] if len(cols)>7 else ''; gk=cols[8] if len(cols)>8 else ''; gh=cols[9] if len(cols)>9 else ''
    rows[(level,kit)].append((name,hp,dmg,kill,coste,vidas,muerte,exph,gk,gh))
def num(s):
    try: return float(s.replace(',',''))
    except: return None
for (lv,kit),rs in sorted(rows.items()):
    kitline=[r[1] for r in rs if r[0]=='__kit__']
    rs=[r for r in rs if r[0]!='__kit__' and r[1]<100000]
    print(f"\n### nivel {lv} kit {kit}: {kitline[0] if kitline else ''}  ({len(rs)} creatures)")
    safe=[r for r in rs if num(r[6].rstrip('%')) is not None and num(r[6].rstrip('%'))<=10 and num(r[7]) is not None]
    safe.sort(key=lambda r:-num(r[7]))
    dead=sum(1 for r in rs if r[6].strip()=='100%')
    print(f"  killable at <=10% death risk: {len(safe)} ; 100% death: {dead} ; stalemate: {sum(1 for r in rs if 'empate' in r[7])}")
    for r in safe[:6]: print(f"  {r[0]:<28} hp {r[1]:>6} dmg {r[2]:>7} ttk {r[3]:>7} vidas {r[5]:>6} muerte {r[6]:>5} exp/h {r[7]:>7} oro/h {r[9]:>6}")
    # iconic risk
    for nm in ['rata parda','lobo cinza','esqueleto','oso pardo','goblin de la linde','troll de la cantera','orco de guerra','comehuesos']:
        for r in rs:
            if r[0]==nm: print(f"    risk {nm}: muerte {r[6]} exp/h {r[7]} ttk {r[3]}")
