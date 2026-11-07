#!/bin/bash
#
# Builds the offline callsign data the app downloads.
#
#   callbook.psv.gz   CALL|Name|City|ST|Grid for every active US licence,
#                     from the FCC's weekly amateur dump. ~12.7 MB gzipped.
#   cty.json          DXCC entities, prefixes and exact-call exceptions,
#                     from AD1C's cty.dat (MIT licensed). ~100 KB gzipped.
#   meta.json         Record count and build date, for the Settings panel.
#
# Sources, all freely redistributable:
#   FCC ULS      public domain US government data
#   Census ZCTA  public domain, used only to turn a ZIP into a grid square
#   cty.dat      MIT licence, see country-files.com
#
# QRZ is deliberately absent: it has no bulk download, and its terms are not
# something this script should assume. QRZ stays an online-only lookup.
#
# Usage: tools/build-offline-data.sh [outdir]      (default: ./out)
set -euo pipefail

OUT="${1:-out}"
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$OUT"

echo "==> FCC weekly amateur dump"
curl -sSfL --retry 3 -o "$WORK/l_amat.zip" \
  "https://data.fcc.gov/download/pub/uls/complete/l_amat.zip"

echo "==> Census ZCTA centroids"
curl -sSfL --retry 3 -o "$WORK/gaz.zip" \
  "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip"
unzip -o -q "$WORK/gaz.zip" -d "$WORK/gaz"
python3 -I "$HERE/zip_to_grid.py" "$WORK"/gaz/*.txt "$WORK/zipgrid.psv"

echo "==> DXCC prefix table"
curl -sSfL --retry 3 -o "$WORK/bigcty.zip" \
  "https://www.country-files.com/bigcty/download/bigcty.zip"
unzip -o -q "$WORK/bigcty.zip" -d "$WORK/cty"
python3 -I "$HERE/cty_to_json.py" "$WORK/cty/cty.dat" "$OUT/cty.json"

echo "==> Trimming the callbook"
# Active licences only. HD.dat field 6 is the licence status, 'A' = active.
unzip -p "$WORK/l_amat.zip" HD.dat \
  | awk -F'|' '$6=="A" && $5!="" {print $5}' | sort -u > "$WORK/active.txt"

# EN.dat carries the name and address. Keep the first row per callsign, join
# the ZIP to a grid, and sort by callsign — sorting alone saves ~2.4 MB in
# the gzip, because neighbouring callsigns share long prefixes.
unzip -p "$WORK/l_amat.zip" EN.dat \
  | awk -F'|' -v OFS='|' -v GRID="$WORK/zipgrid.psv" '
      BEGIN { while ((getline ln < GRID) > 0) { split(ln, g, "|"); zg[g[1]] = g[2] } }
      NR==FNR { act[$1]=1; next }
      {
        call=$5
        if (call=="" || !(call in act) || seen[call]++) next
        name = ($9!="" && $11!="") ? $9 " " $11 : $8
        z = substr($19, 1, 5)
        print call, name, $17, $18, (z in zg ? zg[z] : "")
      }
    ' "$WORK/active.txt" - \
  | sort -t'|' -k1,1 > "$WORK/callbook.psv"

gzip -9 -c "$WORK/callbook.psv" > "$OUT/callbook.psv.gz"

COUNT=$(wc -l < "$WORK/callbook.psv")
GRIDS=$(awk -F'|' '$5!=""' "$WORK/callbook.psv" | wc -l)
cat > "$OUT/meta.json" <<JSON
{
  "built": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "callsigns": $COUNT,
  "with_grid": $GRIDS,
  "bytes": $(stat -c%s "$OUT/callbook.psv.gz")
}
JSON

echo "==> Done"
cat "$OUT/meta.json"
