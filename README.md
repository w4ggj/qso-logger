# TavaOne // QSO Logger

Amateur radio QSO logger built as a static PWA — no server required. Runs on
GitHub Pages at **qso.tavaone.com**. Set up as a **GOTA (Get On The Air)** log:
each contact records both the control operator's callsign and which prospective
student was on the mic.

## Features

- **Control op callsign field** — the licensed op responsible for the station.
  Editable, remembered across sessions, shown in the header badge, and stamped
  onto each QSO as it's logged, so it drives `STATION_CALLSIGN` / `OPERATOR` in
  ADIF, the `Ctrl_Op` CSV column, and the export filenames. Defaults to W4GGJ.
- **GOTA operator field** — log the guest/student who made each contact (stays
  set across a run of QSOs); shows as its own column, feeds a Students stat, and
  is carried into ADIF (`APP_TAVAONE_GOTA_OP` + a `[GOTA op: NAME]` comment) and CSV.
- **Edit logged QSOs** — every row has an EDIT button that loads the contact back
  into the entry form (including its activation programs) for correction. Any
  half-typed next QSO is parked while you edit and restored when you save or
  cancel.
- **Live CAT tracking (Icom IC-706MKIIG)** — reads frequency, mode, and band
  straight from the radio over the CAT cable using the browser's Web Serial API
  (Chrome/Edge desktop). No extra software. The connection is picked back up
  automatically after a page refresh — the browser remembers the port, so no
  second trip through the port picker.
- **Wheel tuning** — click the Frequency field, then scroll (or press `↑`/`↓`)
  to step the dial: 1 kHz, `Shift` 100 Hz, `Alt` 10 kHz. With the rig connected
  each step is sent to the radio over CI-V, so the wheel is the VFO knob.
- **Band quick-jump** — one tap per band. Each band remembers the last frequency
  you were on, so hopping away and back returns you to your own frequency
  instead of a canned one; connected rigs retune to it.
- **Callsign lookups** — QRZ first (via a small Cloudflare Worker proxy), with an
  automatic free fallback to callook.info and HamDB. No shack-PC bridge.
- POTA · WWFF · SOTA · IOTA · BOTA · GMA · LOTA · WCA program support
- ADIF + CSV export
- Offline-capable PWA (installs to home screen), 100% static files

---

## Files

```
index.html            Main app (self-contained)
sw.js                 Service worker (PWA offline cache)
manifest.json         PWA manifest
qrz-proxy-worker.js   Cloudflare Worker — QRZ lookup proxy (deploy separately)
icons/                PWA icons
```

---

## Deploy the app (GitHub Pages)

1. Push these files to `w4ggj/qso-logger`
2. **Settings → Pages → Deploy from a branch → main → / (root)**
3. Live at the domain in `CNAME` (qso.tavaone.com)

No build step. After changing `index.html`, bump the cache version in `sw.js`
(`tavaone-qso-vN`) so devices pick up the new file.

---

## Callsign lookups

Lookups try **QRZ first** (worldwide, needs a QRZ XML Data subscription), then
fall back automatically to the free **callook.info** (US FCC) and **HamDB**
callbooks. The free fallback needs no account, so lookups work even with the QRZ
fields left blank.

### Enabling QRZ (optional) — Cloudflare Worker

A browser page can't call QRZ directly (QRZ sends no CORS headers), so QRZ goes
through a tiny always-on proxy. `qrz-proxy-worker.js` is that proxy — it runs on
Cloudflare's free tier, no PC to keep on.

1. Create a free account at cloudflare.com and go to **Workers & Pages → Create → Worker**
2. Replace the starter code with the contents of `qrz-proxy-worker.js` and **Deploy**
3. Copy the worker URL (e.g. `https://qso-qrz.yourname.workers.dev`)
4. In the app: **Settings → QRZ Callsign Lookup**, paste the URL into **QRZ Proxy URL**
   and enter your QRZ username + password, then click **TEST**

The worker accepts your QRZ username/password from the app over HTTPS. If you'd
rather not store credentials in the browser, set `QRZ_USER` and `QRZ_PASS` as
Worker **secrets/variables** in the Cloudflare dashboard and leave the app fields
blank — the worker will use those instead.

> Requires a **QRZ XML Data subscription** for QRZ callsign data. The free
> callook.info / HamDB fallback covers US callsigns without any subscription.

---

## ADIF Program Fields

| Program | Activator ADIF field | Hunter ADIF field |
|---------|---------------------|-------------------|
| POTA    | MY_POTA_REF         | POTA_REF          |
| WWFF    | MY_WWFF_REF         | WWFF_REF          |
| SOTA    | MY_SOTA_REF         | SOTA_REF          |
| IOTA    | MY_IOTA             | IOTA              |
| BOTA    | MY_BOTA_REF         | BOTA_REF          |
| GMA     | MY_GMA_REF          | GMA_REF           |
| LOTA    | MY_LOTA_REF         | LOTA_REF          |
| WCA     | MY_WCA_REF          | WCA_REF           |

---

73 DE W4GGJ · GrumpaGrinch · tavaone.com
