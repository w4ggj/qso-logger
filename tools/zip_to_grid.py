import sys
A = 'ABCDEFGHIJKLMNOPQR'; a = 'abcdefghijklmnopqrstuvwx'
def grid(lat, lon):
    lon += 180.0; lat += 90.0
    return (A[int(lon//20)] + A[int(lat//10)]
          + str(int((lon % 20)//2)) + str(int(lat % 10))
          + a[int(((lon % 2) * 60)//5)] + a[int(((lat % 1) * 60)//2.5)])

# self-check against published grids before trusting the table
for (nm, la, lo, want) in [('W1AW Newington CT', 41.714, -72.727, 'FN31pr'),
                           ('Tampa Bay FL',      27.773, -82.640, 'EL87'),
                           ('Seattle WA',        47.606, -122.332,'CN87'),
                           ('London UK',         51.507, -0.1276, 'IO91')]:
    got = grid(la, lo)
    ok = got.startswith(want) if len(want) == 4 else got == want
    print(f'  {"OK  " if ok else "FAIL"} {nm:20s} -> {got}  (expected {want})')
    if not ok: sys.exit(1)

out = {}
with open(sys.argv[1], encoding='utf-8', errors='replace') as f:
    next(f)
    for line in f:
        p = [x.strip() for x in line.split('\t')]
        if len(p) < 7 or not p[0]: continue
        try: out[p[0]] = grid(float(p[5]), float(p[6]))
        except ValueError: continue
with open(sys.argv[2], 'w') as f:
    for z in sorted(out): f.write(f'{z}|{out[z]}\n')
print(f'  ZCTAs with a grid: {len(out)}')
