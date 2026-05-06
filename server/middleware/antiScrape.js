const rateLimit = require('express-rate-limit');

// ── In-memory store for tracking suspicious IPs
const suspiciousIPs = new Map();   // ip -> { count, firstSeen, blocked }
const requestLog    = new Map();   // ip -> [timestamps]

// ── Known bad user agents
const BAD_UA = [
  'sqlmap','nikto','nmap','masscan','zgrab','dirbuster','gobuster',
  'wfuzz','hydra','medusa','burpsuite','python-requests','python-urllib',
  'go-http-client','scrapy','wget/','curl/','httpx','httpclient',
  'libwww-perl','java/','okhttp','axios/0','node-fetch','got/',
  'request/','aiohttp','mechanize','phantomjs','headlesschrome',
  'selenium','playwright','puppeteer','zombie','nightmare','casperjs',
  'webdriver','gecko/20','bot','crawler','spider','scraper',
  'archive.org_bot','ahrefsbot','semrushbot','mj12bot','dotbot',
  'baiduspider','yandexbot','petalbot','bytespider'
];

// ── Allowed legitimate bots (Google, Bing etc.)
const ALLOWED_BOTS = [
  'googlebot','bingbot','slurp','duckduckbot','facebookexternalhit',
  'twitterbot','whatsapp','linkedinbot','applebot'
];

// ── Check if UA is a scraper
function isBadUA(ua) {
  if (!ua) return true; // no UA = block
  const u = ua.toLowerCase();
  if (ALLOWED_BOTS.some(b => u.includes(b))) return false;
  return BAD_UA.some(b => u.includes(b));
}

// ── Check if request looks like browser
function looksLikeBrowser(req) {
  const ua = req.headers['user-agent'] || '';
  const accept = req.headers['accept'] || '';
  const acceptLang = req.headers['accept-language'] || '';
  // Real browsers always send Accept and Accept-Language
  if (!acceptLang && req.path.startsWith('/api/videos')) return false;
  if (!accept) return false;
  // Very short UA = bot
  if (ua.length < 20) return false;
  return true;
}

// ── Behavior analysis: too many API calls = scraper
function trackAndCheck(ip, path) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const THRESHOLD = 15; // more than 15 video API calls per minute = scraper

  if (!requestLog.has(ip)) requestLog.set(ip, []);
  const log = requestLog.get(ip).filter(t => now - t < windowMs);
  log.push(now);
  requestLog.set(ip, log);

  // Only count /api/videos requests
  if (!path.startsWith('/api/videos') && !path.startsWith('/api/check-duplicate')) return false;

  if (log.filter(t => now - t < windowMs).length > THRESHOLD) {
    const info = suspiciousIPs.get(ip) || { count: 0, firstSeen: now };
    info.count++;
    if (info.count > 3) info.blocked = true; // block after 3 violations
    suspiciousIPs.set(ip, info);
    return info.blocked;
  }
  return false;
}

// ── Clean up old entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [ip, log] of requestLog.entries()) {
    const fresh = log.filter(t => t > cutoff);
    if (fresh.length === 0) requestLog.delete(ip);
    else requestLog.set(ip, fresh);
  }
  // Unblock IPs after 1 hour
  for (const [ip, info] of suspiciousIPs.entries()) {
    if (Date.now() - info.firstSeen > 60 * 60 * 1000) suspiciousIPs.delete(ip);
  }
}, 10 * 60 * 1000);

// ── Main anti-scrape middleware
function antiScrape(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '';
  const ua = req.headers['user-agent'] || '';

  // 1. Block known bad user agents
  if (isBadUA(ua)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 2. Block previously flagged IPs
  const ipInfo = suspiciousIPs.get(ip);
  if (ipInfo?.blocked) {
    return res.status(429).json({ error: 'Too many requests.' });
  }

  // 3. Only check API routes for browser-like behavior
  if (req.path.startsWith('/api/') && !req.path.startsWith('/api/ml-panel')) {
    if (!looksLikeBrowser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  // 4. Behavior analysis
  if (trackAndCheck(ip, req.path)) {
    return res.status(429).json({ error: 'Rate limited.' });
  }

  next();
}

// ── Videos API: require referer on production
function requireReferer(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  const referer = req.headers['referer'] || req.headers['origin'] || '';
  const host = req.headers['host'] || '';
  // Allow if coming from own domain or no referer (first load)
  const ownDomain = process.env.SITE_DOMAIN || 'gurusala.guru';
  if (!referer || referer.includes(ownDomain) || referer.includes('localhost')) {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden' });
}

// ── Add CORS-like headers to confuse scrapers
function confuseScrapers(req, res, next) {
  // Add fake token requirement in header
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  // Vary header makes caching harder for scrapers
  res.setHeader('Vary', 'Accept-Encoding, User-Agent');
  next();
}

module.exports = { antiScrape, requireReferer, confuseScrapers };
