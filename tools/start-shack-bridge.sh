#!/usr/bin/env bash
# ===========================================================
#  TavaOne // QSO Logger - start the UDP shim  (macOS / Linux)
#  The Windows equivalent is start-shack-bridge.bat.
# ===========================================================
set -u

LISTEN=${LISTEN:-2236}      # port the logger POSTs to
UDPPORT=${UDPPORT:-2235}    # port your bridge listens on
# ${BRIDGE-...} not ${BRIDGE:-...}: an explicitly empty BRIDGE means skip,
# where the colon form would quietly put the default back.
BRIDGE=${BRIDGE-replay_to_cloner.py}    # your forwarder; set empty to skip

cd "$(dirname "$0")" || exit 1

# Start the bridge first, so it is listening before anything is sent to it.
BRIDGE_PID=
if [ -n "$BRIDGE" ]; then
  if [ -f "$BRIDGE" ] && command -v python3 >/dev/null 2>&1; then
    echo "  Starting your bridge: $BRIDGE"
    python3 "$BRIDGE" &
    BRIDGE_PID=$!
    sleep 1
  else
    echo "  Bridge not started (not found, or no python3): $BRIDGE"
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js was not found."
  echo "  The shim is a small Node script, so Node has to be installed."
  echo "  https://nodejs.org - the LTS version is fine."
  echo
  exit 1
fi

if [ ! -f qso-udp-shim.js ]; then
  echo
  echo "  qso-udp-shim.js is not next to this file. Keep them together."
  echo
  exit 1
fi

echo
echo "  Starting the shack bridge..."
echo
echo "  In the logger's Settings, turn on \"Send QSOs to the shack\" and set:"
echo "      Address    http://127.0.0.1:$LISTEN"
echo "      UDP port   $UDPPORT"
echo
echo "  Your own bridge must also be running and listening on $UDPPORT."
echo "  Leave this running. Ctrl-C to stop."
echo

# Both children are killed when this script stops, however it stops. Without
# this the shim outlives the launcher and keeps holding its port, so the next
# start fails with the port already in use.
if [ "$#" -eq 0 ]; then
  node qso-udp-shim.js --listen "$LISTEN" --port "$UDPPORT" &
else
  node qso-udp-shim.js "$@" &
fi
NODE_PID=$!
trap 'kill $NODE_PID $BRIDGE_PID 2>/dev/null' EXIT INT TERM
wait "$NODE_PID"
