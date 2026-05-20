# W4GGJ QSO Logger v3

Multi-program amateur radio QSO logger. Runs as a static PWA — no server required.

**Features**
- POTA · WWFF · SOTA · IOTA · BOTA · GMA · LOTA · WCA program support
- QRZ callsign auto-lookup (name, grid, QTH) on callsign entry
- QRZ Logbook upload via API
- WSJT-X format UDP forwarding to your home logging software (via local bridge)
- ADIF + CSV export
- Offline-capable PWA (installs to home screen)
- 100% static files — Shopify and GitHub Pages compatible

---

## Files

```
index.html          Main app (self-contained)
sw.js               Service worker (PWA offline cache)
manifest.json       PWA manifest
wsjtx_bridge.py     Local UDP bridge — run on your home PC
icons/
  icon-192.png      PWA icon (create these)
  icon-512.png      PWA icon
```

---

## Deploy on GitHub Pages

1. Push these files to your GitHub repo (`w4ggj/qso-logger`)
2. Go to **Settings → Pages**
3. Source: **Deploy from a branch → main → / (root)**
4. Site goes live at `https://w4ggj.github.io/qso-logger/`

That's it. No build step, no npm, no frameworks.

---

## Deploy on Shopify (tavaone.com)

Shopify doesn't serve arbitrary files from the root, but you have two clean options:

### Option A — Custom Page with Inline App (Easiest)

1. In Shopify Admin → **Online Store → Pages → Add page**
2. Title: `QSO Logger`
3. In the page editor, switch to **HTML** mode
4. Paste the entire contents of `index.html` (just the `<body>` content,
   removing `<html>/<head>/<body>` tags since Shopify wraps those)
5. The CSS and JS are all inline so it just works
6. Page URL will be: `https://tavaone.com/pages/qso-logger`

> Note: PWA install + service worker won't work inside a Shopify page
> (Shopify controls the domain root). Everything else works fine.

### Option B — GitHub Pages + Shopify Link (Recommended)

Host the full PWA (with service worker) on GitHub Pages, then link to it
from your Shopify site. This gives you the full PWA experience.

1. Deploy to GitHub Pages (see above)
2. In Shopify, add a navigation link or page redirect to your GitHub Pages URL
3. Optionally embed via iframe in a Shopify page:

```html
<iframe
  src="https://w4ggj.github.io/qso-logger/"
  style="width:100%;height:90vh;border:none;"
  title="W4GGJ QSO Logger">
</iframe>
```

---

## UDP Bridge Setup (Home Shack)

The browser cannot send raw UDP — that's a security restriction in all browsers.
The bridge is a tiny Python script that runs on your logging PC and acts as the
middleman: it receives HTTP POST from the web logger and forwards it as a
WSJT-X format UDP packet to your logging software.

### Requirements
- Python 3.7+ (no pip installs needed — stdlib only)
- Your logging software configured to receive WSJT-X UDP on port 2237
  - **Log4OM**: Tools → Settings → WSJT-X → UDP port 2237
  - **N1MM+**: Config → Configure Ports → WSJT-X → port 2237
  - **DXKeeper**: WSJT-X integration → port 2237
  - **ACLog**: Tools → WSJT-X Bridge → port 2237

### Run the bridge

```bash
# Default — same PC as browser and logger
python3 wsjtx_bridge.py

# Logger on a different LAN machine
python3 wsjtx_bridge.py --udp-host 192.168.1.50 --udp-port 2237

# Custom HTTP port
python3 wsjtx_bridge.py --http-port 12062
```

### Configure the web logger

In the **Settings → UDP Bridge** section, enter:
```
http://localhost:12061/log
```

Click **TEST** — you should see `UDP Bridge: Connected ✓`.

### Run on startup (Windows)

Create `start_bridge.bat`:
```bat
@echo off
python3 C:\path\to\wsjtx_bridge.py
```
Add it to your Startup folder (`Win+R → shell:startup`).

### Run on startup (Mac/Linux)

Add to crontab:
```bash
@reboot /usr/bin/python3 /path/to/wsjtx_bridge.py >> /tmp/wsjtx_bridge.log 2>&1
```

---

## QRZ API Key

1. Log in at **qrz.com** → **Logbook** → **Settings**
2. Under **API Access**, generate or copy your API Key
3. Paste into **Settings → QRZ Logbook** in the logger
4. Click **TEST** — should show `● Connected`

> Requires a **QRZ XML Data subscription** for callsign lookups,
> and a **QRZ Logbook subscription** for logbook uploads.

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
