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
  desktop). No extra software. Pick the model in Settings: nineteen are listed
  across three protocol drivers — Icom CI-V, Yaesu CAT, and Kenwood/Elecraft —
  each with its own baud, data, stop, parity and handshake. The connection
  is picked back up automatically after a page refresh — the browser remembers
  the port, so no second trip through the port picker.
- **Wheel tuning** — click the Frequency field, then scroll (or press `↑`/`↓`)
  to step the dial: 1 kHz, `Shift` 100 Hz, `Alt` 10 kHz. With the rig connected
  each step is sent to the radio, so the wheel is the VFO knob. Steps snap onto
  the step grid, so the first click from an off-grid frequency lands on a round
  number rather than carrying the odd digits along.
- **PTT over the CAT cable** — key the radio from the logger, with the
  transmit command sent down the same port the frequency comes up. Hold-to-talk
  or toggle, on a button or on a key you assign (a function key keeps both hands
  free for typing). `Escape` always unkeys, and so does losing focus, hiding the
  tab, closing the page, disconnecting the rig or running past the time limit.
- **Frequency to 1 Hz** — the field carries all six decimal places, so a radio
  sitting on 14.211650 logs and exports as 14.211650 rather than rounded to the
  nearest 100 Hz.
- **Band quick-jump** — one tap per band. Each band remembers the last frequency
  you were on, so hopping away and back returns you to your own frequency
  instead of a canned one; connected rigs retune to it.
- **Callsign lookups** — QRZ first (via a small Cloudflare Worker proxy), with an
  automatic free fallback to callook.info and HamDB. No shack-PC bridge.
- **Backup & restore** — your log lives only in the browser you made it in, so
  Export writes it to a JSON file, Merge combines a phone log with a laptop
  one, and on desktop Chrome/Edge the app can keep a file on disk rewritten
  after every change.
- **Offline callsign lookup** — DXCC country, continent and CQ/ITU zone for any
  callsign on earth with no signal at all, from a prefix table that ships with
  the app. Optionally download the FCC's weekly list of active US licences
  (~12.7 MB) for operator names, towns and grid squares in the field.
- **Built for a phone** — on a narrow screen Settings moves to the foot of the
  page, below the log, instead of sitting between the entry form and the log,
  and a gear in the header jumps straight to it from anywhere. Number-only
  fields (the PIN, frequency, RST) bring up the number pad rather than the
  full keyboard. The desktop layout is unchanged: Settings stays at the bottom
  of the left column, which has its own scrollbar.
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

## Setting up your own station

Nothing in the app is pre-filled with anyone else's station. On a first visit
the header strip is empty and the logger opens straight away. In
**Settings** set:

- **My callsign** (the control op field on the entry form) — shown in the
  header badge and stamped onto every QSO
- **My grid** — or tap GPS
- **My QTH** and **Class** — free text, shown in the header strip; each one is
  hidden until you set it

### Device PIN

There is **no PIN until you set one**, in Settings. It is stored on that
device only, so setting one on a laptop does not set one on a phone, and it is
left out of backup files.

**It is a tidiness lock, not security.** It is checked in the page and held in
browser storage, so anyone with developer tools can read or skip it. It stops
a shared shack laptop or a club tablet being opened by accident. A static site
with no server behind it cannot do better, so do not rely on it to protect
anything. (Earlier builds had a PIN written into the source, which every
visitor could read — that is gone.)

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

Adding another radio means one entry in `RIG_TYPES` — everything else
(connect, reconnect, polling, wheel tuning, band memory, autofill) is shared.

---

### PTT

The logger can key the radio over the port it is already using for CAT, which
is useful when the radio is being reached through a remote-control program and
a virtual serial pair: those programs commonly need window focus to key, and
you cannot both hold their PTT and type a callsign here.

| Driver | Key | Unkey |
|---|---|---|
| **Icom CI-V** | `FE FE <addr> E0 1C 00 01 FD` | `FE FE <addr> E0 1C 00 00 FD` |
| **Yaesu CAT** | `TX1;` | `TX0;` |
| **Kenwood / Elecraft** | `TX;` | `RX;` |

The control appears in the rig panel once a radio is connected, and offers:

- **Hold** — transmit for as long as the button or key is held — or **Toggle**,
  one press on and one press off.
- A **key you assign**. Press the button, then press the key. A function key is
  the one to pick: it keys without typing anything. Whatever is assigned is
  swallowed while it is held, so a printable key does not also land in the
  field you are typing in. Modifiers count — `Ctrl+F9` does not fire on a bare
  `F9`.
- A **time limit** (30 s to 10 minutes). A transmit that runs past it is cut
  off. This is the dead-man switch for a key that sticks or a browser that
  stops delivering `keyup`.

Everything that can take your attention away from the page unkeys first:
losing window focus, hiding the tab, navigating away, closing it, or
disconnecting the rig. **`Escape` always unkeys**, whatever is assigned and
whatever has focus.

A key command the port refuses is not treated as a transmit: the indicator
goes back to receive rather than showing a transmitting radio that is
listening. A failed *unkey* is the dangerous direction, so it says so loudly
instead of quietly logging — at that point only the radio's own front panel
will stop it.

The transmit command is the one write in the app whose failure is reported
rather than swallowed, and the test suite asserts the inverse too: connecting,
polling and tuning never produce a transmit frame at any baud. Only a
deliberate PTT action does.

**Transmit is tested on the IC-7300.** The Yaesu and Kenwood commands come from
the published protocol and have not been run against a radio; the panel says
so. Key into a dummy load and confirm it **unkeys** before using either on air.

---


### Serial control lines, and PTT

The app holds **both DTR and RTS down** and never raises either. On most
modern radios one of those lines can be mapped to SEND/PTT — that is how some
programs key the rig — so raising one transmits. The logger keys over the CAT
command instead (see **PTT** below), so it has no reason to raise a handshake
line and never does: a line that goes up by accident keys a radio with no
software state saying it is transmitting, and nothing is then watching to put
it back down. Earlier builds raised DTR for cables that take their power from a
handshake line; that is now an **opt-in toggle, off by default**, and turning it
on warns you first.

One limit is the browser's: Web Serial takes no signal options when opening a
port, and what it leaves the lines at beforehand is undocumented — not in the
spec, not in Chrome's docs. The app lowers them as its first action, so the
worst case is a brief blip rather than a held carrier, but it cannot be
eliminated from a web page.

**Nothing on a working radio needs changing.** A station set up for WSJT-X or
N1MM is already configured correctly.

### CI-V baud

The CI-V list runs from **1200 to 115200**. A modern Icom on USB is often set
far above the old 19200 ceiling — a 7300 configured for digital modes is
usually on 115200 — and it has to match `SET → Connectors → CI-V → CI-V Baud
Rate` on the radio. A mismatch is not merely silent: the radio decodes the
garbage it receives, and some of what it decodes are commands it acts on. If
nothing is read back within a few seconds the app now says the baud is the
likely cause rather than sitting on "reading…".

### Serial parameters

The full line is settable, the way any other rig-control program does it:

| | Choices |
|---|---|
| Baud | 1200 – 115200 |
| Data bits | 8, 7 |
| Stop bits | 1, 2 |
| Parity | none, even, odd |
| Handshake | none, hardware |

**Settings belong to the radio, not the protocol.** An IC-7300 and an IC-706
are both CI-V but want different rates, so each model keeps its own; switching
between them restores what each was last set to. A panel note appears when a
radio differs from its defaults, with a reset link.

Two cautions. **Hardware handshake drives RTS**, which is SEND/PTT on many
radios, so choosing it asks first — rig control almost never needs it.
And **Web Serial has no XON/XOFF**, so it is not offered rather than offered
and silently ignored.

Defaults come from each model, falling back to the protocol's. The IC-7300's
are confirmed on air (115200, 8N2, address 94); everything else starts at the
protocol default and is yours to correct.

If the readout is slow rather than absent, the framing is the first thing to
change: a mismatch at 115200 does not fail cleanly — enough replies are
corrupted that only the occasional one survives the parser.

While connected the panel shows **frames per second, total frames and total
bytes**. The difference between the last two is the diagnosis: bytes arriving
with nothing understood means the framing is wrong, while no bytes at all
means the baud or the cable is.

**CAT polling is reply-driven, not timer-driven.** A fixed interval means
every reading waits for the next tick however fast the radio answers, so the
next question goes out as soon as a reply lands instead. The lag becomes the
round trip rather than the interval — about 100 ms in practice. A 1 s interval
remains as a watchdog for when replies stop, and a 100 ms floor keeps a fast
radio from being hammered.

Mode is asked for every 2 s rather than at frequency rate: it changes when
somebody turns a knob, not continuously.

### Supported radios

The picker is a list of models; each one selects a protocol driver and seeds
that driver's defaults. Three drivers cover all of them:

| Driver | Radios | Differs by |
|---|---|---|
| **Icom CI-V** | IC-706MKIIG, IC-7100, IC-7300, IC-7610, IC-9700, IC-705, other | CI-V address (editable) |
| **Yaesu CAT** | FT-991A, FT-891, FT-710, FTDX10, FTDX101, other | default baud |
| **Kenwood / Elecraft** | TS-480, TS-590S/SG, TS-890S, K3/K3S, KX2/KX3, other | default baud |

Kenwood and Elecraft share Yaesu's ASCII-and-semicolon framing but send
**11 digits** in a frequency message where Yaesu sends 9, and query mode
without a VFO digit — which is why they are a separate driver rather than a
setting. Each driver checks the exact message length, so selecting the wrong
radio shows **no reading at all** instead of a plausible-looking wrong
frequency.

**The IC-706MKIIG, FT-991A and IC-7300 have been run against real hardware.**
Everything else is built from the published protocol and is labelled
`(untested)` in the picker, with a note in the panel. If you try one and it
works — or doesn't — say so and the label comes off. Adding a family means
adding one row to `RIG_TYPES` with its `poll`, `tune`, `parse` and `tx`;
nothing else in the rig layer changes.

## On-screen keyboards

Fields that only ever take digits ask the phone for the number pad
(`inputmode="numeric"`); Frequency asks for the decimal pad, since it needs the
dot. Everything else keeps the full keyboard on purpose:

| Field | Keyboard | Why |
|---|---|---|
| PIN | number pad | six digits (see below) |
| Frequency (MHz) | decimal pad | digits plus `.` |
| RST sent / received | number pad | `59`, `599` |
| CI-V address | full | hex — `4E`, `A2` need letters |
| My grid, their grid | full | Maidenhead is letters and digits |
| Callsign, program refs | full | `KD9XYZ`, `US-6317` |

A password field is the one input where `inputmode` is not honoured — iOS
Safari ignores it and Android keyboards disagree — so the PIN field is swapped
at load to a text field masked with `-webkit-text-security: disc`. It looks and
behaves the same and the number pad opens. A browser that cannot do that
masking keeps a real `type="password"` field instead, so the PIN is never shown
in the clear.

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

## Where your data lives, and backing it up

Everything is stored in **one browser, on one device**: `localStorage` for the
log, sessions and settings, IndexedDB for the offline callbook. Nothing is
uploaded, there is no account, and the only outbound request carrying anything
of yours is the QRZ lookup. Three consequences worth knowing:

- Clearing site data **deletes the log**. There is no server copy.
- Chrome and Safari on the same phone keep **separate logs**. So do a phone
  and a laptop.
- A home-screen PWA may or may not share storage with the browser it was
  installed from — test it rather than assume.

**Settings → Backup & Restore** covers this:

| Control | What it does | Where it works |
|---|---|---|
| **Export** | Downloads a JSON file — lands outside browser storage, so it survives a cache clear | everywhere |
| **Share** | Sends the same file to Drive, Files or mail via the share sheet | where `navigator.share` takes files (Android) |
| **Merge in** | Adds the QSOs from a file that aren't already here | everywhere |
| **Restore** | Replaces everything from a file | everywhere |
| **Link a backup file** | Holds a file you pick and rewrites it after every change, no prompts | **desktop Chrome/Edge only** |

Merging matches on callsign, date, time, band and mode rather than on the
record id, because ids are `Date.now()` and two devices can repeat one. That
makes merging idempotent: importing a file into the log it came from adds
nothing. It is the way to combine a GOTA student's phone log with the
station's.

The linked file uses the **File System Access API**. That is not available in
Chrome for Android, Firefox or Safari, so the button only appears where it
actually works; everywhere else, Export is the answer and the panel says so.
If the browser drops write permission — it needs a user gesture to re-grant —
the panel says *needs reconnecting* rather than failing silently.

**The QRZ password is deliberately excluded** from the file: backups end up in
Downloads and cloud drives, which is no place for a credential. A restore will
not overwrite the password already on the device. Everything else comes back —
grid, control op, rig setup and every operating session.

The panel also tracks when you last backed up, and says so plainly when that
was never or more than a week ago.

## Offline callsign lookup

Two tiers, both working with no network.

| | Ships with the app | Optional download |
|---|---|---|
| Source | `cty.dat` (AD1C, MIT licence) | FCC ULS weekly amateur dump |
| Size | ~100 KB over the wire | **~12.7 MB** gzipped |
| Coverage | every callsign on earth | 822k active **US** licences |
| Gives you | country, continent, CQ/ITU zone | name, town, state, grid |
| Stored in | the app shell | IndexedDB on that device |

The prefix tier needs no setup — country lookup already works offline from a
cold start. The callbook is downloaded from **Settings → Offline Callbook**;
do it over wi-fi before heading somewhere without signal. Deleting it never
touches your log.

**Order of preference.** With signal the app always tries the live sources
first (QRZ, then callook.info and HamDB) and only falls back to local data,
because the local copy is a weekly snapshot. With no signal it skips straight
to the local data rather than waiting out three network timeouts.

**Two honest limitations.**

- *The grid is approximate.* The FCC publishes an address, not coordinates, so
  the grid is derived from the licensee's ZIP centroid. That is normally the
  correct 4-character square and occasionally a neighbouring subsquare —
  W1AW comes out `FN31pq` against a published `FN31pr`. 97.6% of records get
  one. The country centroid from the prefix table is *never* used as a grid:
  the whole United States would be `EM47`.
- *It is a weekly snapshot of current grants.* A reissued or brand-new
  callsign can be missing. Offline, a callsign that matches no prefix at all
  reads N/F and says so; one that matches a prefix but has no US record still
  resolves to its country, so a typo offline tends to show a country rather
  than an error.

QRZ is deliberately not part of this. It offers no bulk download, and its data
is not ours to redistribute — it stays an online-only lookup.

### Rebuilding the data

`.github/workflows/offline-data.yml` runs `tools/build-offline-data.sh` every
Monday and force-pushes a single orphan commit to the `data` branch, so the
12.7 MB file never enters `main`'s history and cloning the app stays small.
The job refuses to publish a build with fewer than 700,000 callsigns, so a
truncated FCC file cannot quietly replace a working callbook on every phone.

Run it by hand with:

```
tools/build-offline-data.sh out
```

All three sources are freely redistributable: FCC ULS and the Census ZCTA
gazetteer are US public domain, `cty.dat` is MIT licensed.

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
