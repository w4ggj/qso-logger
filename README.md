# TavaOne // QSO Logger

Amateur radio QSO logger built as a static PWA — no server required. Runs on
GitHub Pages at **qso.tavaone.com**. Set up as a **GOTA (Get On The Air)** log:
each contact records both the control operator's callsign and which prospective
student was on the mic.

## Features

- **Operating sessions** — a separate log per day or per event, so a GOTA
  station starts each session with a clean table without losing the last one.
  The picker above the log chooses which session the table, the stats and the
  exports cover, or “All contacts” for everything at once. Nothing is ever
  deleted by starting a new session.
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
- **Live CAT tracking** — reads frequency, mode, and band straight from the
  radio over the CAT cable using the browser's Web Serial API (Chrome/Edge
  desktop). No extra software. Two radios are supported, picked in Settings:
  **Icom IC-706MKIIG** (CI-V) and **Yaesu FT-991A** (Yaesu CAT). The connection
  is picked back up automatically after a page refresh — the browser remembers
  the port, so no second trip through the port picker.
- **Wheel tuning** — click the Frequency field, then scroll (or press `↑`/`↓`)
  to step the dial: 1 kHz, `Shift` 100 Hz, `Alt` 10 kHz. With the rig connected
  each step is sent to the radio, so the wheel is the VFO knob.
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
version.json          Build marker the app checks to detect a stale copy
qrz-proxy-worker.js   Cloudflare Worker — QRZ lookup proxy (deploy separately)
icons/                PWA icons
```

---

## Deploy the app (GitHub Pages)

1. Push these files to `w4ggj/qso-logger`
2. **Settings → Pages → Deploy from a branch → main → / (root)**
3. Live at the domain in `CNAME` (qso.tavaone.com)

No build step. After changing `index.html`, bump **all three**:

- `APP_BUILD` in `index.html`
- `"build"` in `version.json` (must match `APP_BUILD` exactly)
- the cache version in `sw.js` (`tavaone-qso-vN`)

---

## Which build am I running?

The footer shows `BUILD <id>` — the build baked into the HTML the browser
actually loaded. On every load the page fetches `version.json` from the server
with the cache bypassed and compares. If the server has a different build, the
footer stamp turns amber and a bar appears at the top of the app offering to
update.

**FORCE REFRESH** (Settings → App Version) unregisters the service worker,
deletes every cached file, and reloads from the server. Reach for it when a
change you expect is missing:

- an installed PWA serves the copy it saved offline, and a browser hard-refresh
  in a *tab* does not touch the installed app's cache
- a CDN in front of the domain can hold an old `index.html`; a hard-refresh
  cannot bust an edge cache

Your log lives in `localStorage` and is not touched by Force Refresh.

`version.json` is a path that no old cache has ever seen, and the service worker
is written never to cache it — so opening `https://qso.tavaone.com/version.json`
directly tells you what the *server* is serving, independent of anything cached
on the device.

---

## Operating sessions

Every QSO belongs to a session. The bar above the log picks which one you are
looking at:

- **+ NEW SESSION** names a session (today's date by default), makes it active,
  and gives you an empty table. The previous session's contacts stay exactly
  where they were.
- **RENAME** retitles the session you are viewing — handy when “2026-09-20”
  should read “Field Day GOTA”.
- **REMOVE** appears only on a session with no contacts in it. It is there to
  undo a mis-tap, not to clear a log; contacts are only ever deleted one row at
  a time with DEL.
- **All contacts** shows every session together. New QSOs still go into the
  active session, and the bar says which one that is.

The stats strip, the search box and both exports follow whatever the picker is
showing. Export filenames carry the session name, CSV gains a `Session` column,
and ADIF records carry `APP_TAVAONE_SESSION`.

An existing flat log is folded into one session per day it was worked the first
time this version loads — the shape the log was already in implicitly, so
nothing moves and nothing is lost.

---

## Rig setup

Pick the radio in **Settings → CAT — Rig Control**, set the baud to match the
radio's menu, then click **CONNECT RIG** and choose the cable's serial port.

| | Icom IC-706MKIIG | Yaesu FT-991A |
|---|---|---|
| Protocol | CI-V, binary frames | Yaesu CAT, ASCII terminated with `;` |
| Radio menu | `SET → CI-V Baud` | `MENU 031 CAT RATE` |
| Rates | 19200 / 9600 / 4800 / 1200 | 38400 / 19200 / 9600 / 4800 |
| Ships at | — | **4800** |
| Address | CI-V address `58h` | not used |
| Also set | `CI-V Transceive = ON` | — |

### Android

Chrome on Android implements Web Serial for Bluetooth RFCOMM only, so its port
list shows paired Bluetooth devices and a CAT cable never appears there. Set
**Connection** to **USB direct** and the app drives the cable's USB-serial chip
over WebUSB instead — the same approach [FT8AF](https://www.ft8af.app/) takes
through the platform's USB host API for its CAT control. You need a USB-OTG adapter, and the phone
must supply bus power to the cable.

Chips handled: `CH340/CH341`, `CP210x`, `FTDI`, `PL2303`, and plain `CDC-ACM`
as a fallback. The status line names the chip it matched and prints the raw
`VID:PID` when it matches none, so an unsupported cable identifies itself
rather than failing silently.

On connect the app raises **DTR** and leaves **RTS** down. Plenty of cables
take their power from a handshake line, but RTS is also what hardware PTT
interfaces key on, and a stuck transmit is a worse failure than a dead cable
— so if the cable connects and reports nothing, that is the first thing to
change.

Register values for each chip come from the
[mik3y/usb-serial-for-android](https://github.com/mik3y/usb-serial-for-android)
drivers rather than being derived, since a wrong baud divisor yields
plausible-looking garbage rather than an error. The unit tests assert the exact
control transfers against those references.

The FT-991A's USB cable presents **two** serial ports. Choose the **Enhanced**
one — that is CAT. The Standard port is for PTT; it will open without ever
answering, which looks like a connected radio that never reports anything.

The 991A reports `DATA-L` / `DATA-U` / `DATA-FM` and `C4FM`, which have no
entry in the log's Mode list. Those appear in the readout but do not touch the
Mode field: picking FT8 over PSK31 over JS8 from "DATA-U" would be a guess, and
a wrong guess gets logged silently.

Adding another radio means one entry in `RIG_TYPES` plus a branch in each of
`rigPoll`, `rigTuneSend` and `rigParse` — everything else (connect, reconnect,
polling, wheel tuning, band memory, autofill) is shared.

---

## Callsign lookups

Lookups try **QRZ first** (worldwide, needs a QRZ XML Data subscription), then
fall back automatically to the free **callook.info** (US FCC) and **HamDB**
(US, Canada, Australia, Germany, Czech Republic) callbooks. The free fallback
needs no account, so lookups work even with the QRZ fields left blank.

Those five countries are the whole of the free coverage. A DX callsign outside
them comes back **N/F** unless QRZ is set up — QRZ is what closes that gap. Tap
the N/F badge and the app says which case it hit: no QRZ configured, or
configured and genuinely not found, quoting whatever QRZ itself said.

QRZ stores a name as `fname` + `name`, but plenty of non-US records leave those
blank and carry the whole name in `name_fmt`. The Worker reads `name_fmt` as a
fallback, and a record with only a QTH is returned rather than dropped — the
country and city are most of what a DX record is good for. **Redeploy the Worker
after updating it**, or those records keep reading as not-found.

QRZ settings live in `localStorage`, so they are **per device**. A phone needs
its own proxy URL and credentials even when the shack PC already has them.

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
