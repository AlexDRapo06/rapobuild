// Hand-off to the Footy Up registration platform (Supabase + admin dashboard).
//
// When PLATFORM_API_URL is set, each api/*.js function sends the request body
// it received, unchanged, to the platform's /api/site/<action>, and passes the
// platform's answer straight back. Registrations, payments, training requests
// and contacts are then saved in Supabase and show up in the dashboard, and the
// spot limits, prices and access codes set in the dashboard apply here.
//
// With PLATFORM_API_URL unset, every function runs its original code below the
// forward() call, exactly as before. Unsetting it is the rollback.
const PLATFORM = (process.env.PLATFORM_API_URL || '').replace(/\/+$/, '');

const platformEnabled = () => Boolean(PLATFORM);

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(req.headers['x-real-ip'] || '') || (req.socket && req.socket.remoteAddress) || '';
}

// Returns true once it has answered the request.
async function forward(req, res, action) {
  if (!PLATFORM) return false;
  const query = req.method === 'GET' && req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  try {
    const upstream = await fetch(`${PLATFORM}/api/site/${action}${query}`, {
      method: req.method,
      headers: {
        'content-type': 'application/json',
        // Lets the platform rate-limit per family rather than per site server.
        'x-site-key': process.env.SITE_API_KEY || '',
        'x-footyup-client-ip': clientIp(req),
      },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(15000),
    });
    const text = await upstream.text();
    const cache = upstream.headers.get('cache-control');
    if (cache) res.setHeader('Cache-Control', cache);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(upstream.status).send(text);
  } catch (err) {
    console.error(`platform ${action} failed:`, err && err.message);
    res.status(502).json({ error: 'Registration is temporarily unavailable. Please try again in a minute.' });
  }
  return true;
}

module.exports = { forward, platformEnabled };
