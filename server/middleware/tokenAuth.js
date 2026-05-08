// ── API Token system — all /api/videos requests need a valid session token
// Token is generated on first page load and stored in session
// Scrapers hitting the API directly won't have a valid token

const crypto = require('crypto');

// Tokens valid for 2 hours, stored in memory
const validTokens = new Map(); // token -> { ip, created, uses }

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ── Route: GET /api/token — called by frontend on page load
function issueToken(req, res) {
  const ip = req.ip || '';
  const ua = req.headers['user-agent'] || '';
  const token = generateToken();
  validTokens.set(token, {
    ip,
    ua: ua.slice(0, 100),
    created: Date.now(),
    uses: 0
  });
  // Clean up old tokens
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [t, info] of validTokens.entries()) {
    if (info.created < cutoff) validTokens.delete(t);
  }
  res.json({ token });
}

// ── Middleware: verify token on video requests
function requireToken(req, res, next) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') return next();

  const token = req.headers['x-gs-token'] || req.query._t;
  if (!token) return res.status(403).json({ error: 'Forbidden' });

  const info = validTokens.get(token);
  if (!info) return res.status(403).json({ error: 'Forbidden' });

  // Token expired (2 hours)
  if (Date.now() - info.created > 2 * 60 * 60 * 1000) {
    validTokens.delete(token);
    return res.status(403).json({ error: 'Session expired. Refresh the page.' });
  }

  // Track usage
  info.uses++;
  validTokens.set(token, info);
  next();
}

module.exports = { issueToken, requireToken };
