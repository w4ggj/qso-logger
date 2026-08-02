/* ============================================================
   TavaOne // QSO Logger — QRZ XML proxy (Cloudflare Worker)
   ------------------------------------------------------------
   Replaces the old shack-PC bridge for QRZ callsign lookups.
   Runs in Cloudflare's cloud (free tier) — no PC to keep on.

   Endpoints (all CORS-enabled):
     GET  /health                         -> {ok:true}
     POST /qrz/auth   {user,pass}          -> {session, sub} | {error}
     GET  /qrz/lookup?session=..&call=..   -> {name,grid,city,state,country,dxcc}

   The app sends your QRZ username/password to THIS worker over
   HTTPS; the worker talks to QRZ and hands back JSON. You can
   also set QRZ_USER / QRZ_PASS as Worker secrets and leave the
   app fields blank if you'd rather not store creds in the browser.

   Requires a QRZ XML Data subscription for name/grid/QTH lookups.
   ============================================================ */

const QRZ_XML = 'https://xmldata.qrz.com/xml/current/';
const AGENT   = 'tavaqso1.0';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

/* pull the first <tag>…</tag> value out of QRZ's XML (namespace-agnostic) */
function tag(xml, name) {
  const m = xml.match(new RegExp('<' + name + '\\b[^>]*>([\\s\\S]*?)</' + name + '>', 'i'));
  return m ? m[1].trim() : '';
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url  = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '');

    if (path.endsWith('/health')) return json({ ok: true, service: 'qrz-proxy' });

    /* ---- AUTH: POST {user,pass} -> session key ---- */
    if (path.endsWith('/qrz/auth') && req.method === 'POST') {
      let body = {};
      try { body = await req.json(); } catch (e) {}
      const user = (body.user || (env && env.QRZ_USER) || '').trim();
      const pass = (body.pass || (env && env.QRZ_PASS) || '').trim();
      if (!user || !pass) return json({ error: 'Missing QRZ username/password' }, 400);

      const q = `${QRZ_XML}?username=${encodeURIComponent(user)};password=${encodeURIComponent(pass)};agent=${AGENT}`;
      let xml = '';
      try { xml = await (await fetch(q)).text(); }
      catch (e) { return json({ error: 'Could not reach QRZ' }, 502); }

      const key = tag(xml, 'Key');
      const err = tag(xml, 'Error');
      if (!key) return json({ error: err || 'QRZ auth failed' });
      return json({ session: key, sub: tag(xml, 'SubExp') });
    }

    /* ---- LOOKUP: GET ?session=&call= -> callsign info ---- */
    if (path.endsWith('/qrz/lookup') && req.method === 'GET') {
      const session = (url.searchParams.get('session') || '').trim();
      const call    = (url.searchParams.get('call') || '').trim();
      if (!session) return json({ session_expired: true, error: 'No session' }, 401);
      if (!call)    return json({ error: 'No callsign' }, 400);

      const q = `${QRZ_XML}?s=${encodeURIComponent(session)};callsign=${encodeURIComponent(call)};agent=${AGENT}`;
      let xml = '';
      try { xml = await (await fetch(q)).text(); }
      catch (e) { return json({ error: 'Could not reach QRZ' }, 502); }

      const err = tag(xml, 'Error');
      if (/session timeout|invalid session|not logged in|session does not exist/i.test(err)) {
        return json({ session_expired: true, error: err }, 401);
      }

      const name = [tag(xml, 'fname'), tag(xml, 'name')].filter(Boolean).join(' ').trim();
      const grid = tag(xml, 'grid');
      if (!name && !grid) return json({ error: err || 'Not found' });

      return json({
        source:  'qrz',
        name,
        grid,
        city:    tag(xml, 'addr2'),
        state:   tag(xml, 'state'),
        country: tag(xml, 'country'),
        dxcc:    tag(xml, 'dxcc'),
      });
    }

    return json({ error: 'Not found', path }, 404);
  },
};
