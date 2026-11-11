#!/usr/bin/env node
/* ============================================================
   TavaOne // QSO Logger — UDP shim
   ------------------------------------------------------------
   A web page cannot send a UDP datagram. There is no API for
   it: WebRTC is the nearest thing and it needs a peer that
   speaks ICE and DTLS, not a socket listening on a port. So a
   logger running in a browser cannot talk to the UDP port your
   bridge, N1MM, Log4OM or JTAlert is listening on.

   This turns an HTTP POST into that datagram, and does nothing
   else. The body is sent as the packet, byte for byte — the
   logger decides what goes in it, so this file should never
   need changing when a format does.

     browser  --HTTP POST-->  this shim  --UDP-->  your bridge

   Run it on the SAME machine as the browser:

     node qso-udp-shim.js
     node qso-udp-shim.js --listen 2236 --port 2235 --host 127.0.0.1

   Then put http://127.0.0.1:2236 into the logger's Settings.

   Why the same machine: the logger is served over HTTPS, and a
   browser blocks an HTTPS page from reaching http:// on another
   address as mixed content. localhost is the documented
   exception. A shim on a different PC on the LAN will be
   refused by the browser before the request is ever sent.

   No dependencies. Node 18 or newer.
   ============================================================ */

const http  = require('http');
const dgram = require('dgram');

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  return i === -1 ? dflt : argv[i + 1];
};

const LISTEN   = Number(arg('listen', 2236));   // where the browser POSTs
const UDP_PORT = Number(arg('port',   2235));   // where your bridge listens
const UDP_HOST = String(arg('host',   '127.0.0.1'));
const MAX_BODY = 64 * 1024;

/* The page may name a different UDP port than the default, so the whole
   setup lives in the logger's Settings rather than half here. The host is
   NOT settable from the page: a web page that could pick the destination
   address could use this to reach other machines. */
const PORT_OK = p => Number.isInteger(p) && p > 0 && p < 65536;

const sock = dgram.createSocket('udp4');

function cors(res, req) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  /* GET belongs here as much as POST: /health is a GET, and the logger is
     served over HTTPS, so Chrome preflights even a request it would
     otherwise send straight out @M@ 127.0.0.1 is a more private address than
     the page. A preflight that does not name the method the page is about
     to use fails, and the page is told nothing beyond "it did not work". */
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  /* Chrome asks before letting a public page reach a private address. */
  if (req.headers['access-control-request-private-network'] === 'true') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
}

const server = http.createServer((req, res) => {
  cors(res, req);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, udpHost: UDP_HOST, udpPort: UDP_PORT }));
  }

  if (req.method !== 'POST' || url.pathname !== '/send') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'POST /send' }));
  }

  let port = UDP_PORT;
  if (url.searchParams.has('port')) {
    const p = Number(url.searchParams.get('port'));
    if (!PORT_OK(p)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'bad port' }));
    }
    port = p;
  }

  const chunks = [];
  let size = 0;
  req.on('data', c => {
    size += c.length;
    if (size > MAX_BODY) { req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    if (!body.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'empty' }));
    }
    sock.send(body, port, UDP_HOST, err => {
      if (err) {
        console.error('udp send failed:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: String(err.message) }));
      }
      console.log(`${new Date().toISOString()}  ${body.length} bytes → ${UDP_HOST}:${port}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, bytes: body.length, port }));
    });
  });
});

server.listen(LISTEN, '127.0.0.1', () => {
  console.log(`QSO UDP shim`);
  console.log(`  listening  http://127.0.0.1:${LISTEN}`);
  console.log(`  forwarding UDP → ${UDP_HOST}:${UDP_PORT}`);
  console.log(`  put http://127.0.0.1:${LISTEN} in the logger's Settings`);
});
