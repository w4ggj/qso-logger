import json, re, sys
A='ABCDEFGHIJKLMNOPQR'; a='abcdefghijklmnopqrstuvwx'
def grid(lat, lon):
    lon += 180.0; lat += 90.0
    return (A[int(lon//20)]+A[int(lat//10)]+str(int((lon%20)//2))+str(int(lat%10))
          + a[int(((lon%2)*60)//5)]+a[int(((lat%1)*60)//2.5)])

text = open(sys.argv[1], encoding='utf-8', errors='replace').read()
ents, pfx, exact = [], {}, {}
for block in [b for b in text.split(';') if b.strip()]:
    lines = block.strip().split('\n')
    head = lines[0].split(':')
    if len(head) < 8: continue
    name = head[0].strip()
    cq, itu, cont = head[1].strip(), head[2].strip(), head[3].strip()
    try: lat, lon = float(head[4]), -float(head[5])   # cty.dat stores west-positive
    except ValueError: continue
    idx = len(ents)
    ents.append([name, int(cq or 0), int(itu or 0), cont, grid(lat, lon)])
    body = ' '.join(l.strip() for l in lines[1:]) if len(lines) > 1 else head[7]
    for tok in body.replace('\n', '').split(','):
        tok = tok.strip()
        if not tok: continue
        tok = re.sub(r'[\(\[\{<~].*', '', tok).strip()   # drop zone/coord overrides
        if not tok: continue
        if tok.startswith('='): exact[tok[1:]] = idx
        else: pfx[tok] = idx

out = {'entities': ents, 'prefixes': pfx, 'exact': exact}
js = json.dumps(out, separators=(',', ':'))
open(sys.argv[2], 'w').write(js)
print(f'  entities: {len(ents)}   prefixes: {len(pfx)}   exact calls: {len(exact)}')
print(f'  cty.json raw: {len(js):,} bytes')
import gzip; print(f'  cty.json gzip: {len(gzip.compress(js.encode(),9)):,} bytes')
