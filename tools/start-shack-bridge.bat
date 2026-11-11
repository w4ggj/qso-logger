@echo off
setlocal

REM ===========================================================
REM  TavaOne // QSO Logger - start the shack bridge
REM  ----------------------------------------------------------
REM  Double-click this file. It starts two things:
REM
REM    1. your Python bridge, in its own window
REM    2. the UDP shim, in this window
REM
REM  The bridge goes first, so it is already listening before
REM  the shim can send it anything.
REM
REM  Leave both windows open while you are logging.
REM ===========================================================

REM ---- Your bridge --------------------------------------------------------
REM Path to the Python script that forwards to the home shack. A bare
REM filename is looked for next to this file; otherwise put the full path,
REM in quotes if it has spaces:
REM     set BRIDGE=C:\Ham\field_cloner.py
REM Leave it empty to start only the shim.
set BRIDGE=field_cloner.py

REM ---- Ports --------------------------------------------------------------
REM Port the logger POSTs to. Settings: http://127.0.0.1:<LISTEN>
set LISTEN=2236

REM Port your bridge is listening on. Settings: UDP port
set UDPPORT=2235

REM ===========================================================
REM  Nothing below here normally needs changing.
REM ===========================================================

title QSO Logger - shack bridge

REM Run from this file's own folder, so double-clicking works wherever
REM the repo lives and whatever folder Explorer happened to be in.
cd /d "%~dp0"

REM ---- Start the Python bridge -------------------------------------------
if "%BRIDGE%"=="" goto :noBridge

if not exist "%BRIDGE%" (
  echo.
  echo   Could not find your bridge script:
  echo       %BRIDGE%
  echo.
  echo   Open this .bat in Notepad and put the full path on the
  echo   "set BRIDGE=" line near the top. Starting the shim anyway.
  echo.
  goto :noBridge
)

REM The py launcher ships with Windows Python and picks the right
REM version; fall back to whatever python is on PATH.
set PY=
where py >nul 2>nul && set PY=py
if "%PY%"=="" ( where python >nul 2>nul && set PY=python )

if "%PY%"=="" (
  echo.
  echo   Python was not found, so your bridge was not started.
  echo   Start it yourself, or install Python from https://python.org
  echo   Starting the shim anyway.
  echo.
  goto :noBridge
)

echo   Starting your bridge: %BRIDGE%
start "QSO Logger - %BRIDGE%" %PY% "%BRIDGE%"

REM Give it a moment to bind its port before anything is sent to it.
ping -n 3 127.0.0.1 >nul

:noBridge

REM ---- Check Node, then start the shim -----------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found.
  echo.
  echo   The shim is a small Node script, so Node has to be installed
  echo   on this PC. Get it from https://nodejs.org - the LTS version
  echo   is fine - then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "qso-udp-shim.js" (
  echo.
  echo   qso-udp-shim.js is not next to this file.
  echo.
  echo   Both files live in the repo's tools folder. Keep them
  echo   together, or edit the path below.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting the shack bridge...
echo.
echo   In the logger's Settings, turn on "Send QSOs to the shack" and set:
echo       Address    http://127.0.0.1:%LISTEN%
echo       UDP port   %UDPPORT%
echo.
echo   Leave this window open. Close it to stop the shim.
echo   Your bridge runs in its own window and is closed separately.
echo.

REM Arguments given on the command line win over the numbers above,
REM so this can also be run as:  start-shack-bridge.bat --port 2237
if "%~1"=="" (
  node "qso-udp-shim.js" --listen %LISTEN% --port %UDPPORT%
) else (
  node "qso-udp-shim.js" %*
)

echo.
echo   The shim has stopped. Your bridge window, if it is open, is separate.
echo.
pause
