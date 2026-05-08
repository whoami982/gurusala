require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const apiRoutes   = require('./routes/api');
const adminRoutes = require('./routes/admin');
const { antiScrape, confuseScrapers } = require('./middleware/antiScrape');
const { issueToken } = require('./middleware/tokenAuth');

const app    = express();
const PORT   = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) app.set('trust proxy', 1);

// ── 1. Security headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https://img.youtube.com", "https://*.googleusercontent.com"],
      connectSrc:  ["'self'"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

// ── 2. Hide server info
app.disable('x-powered-by');
app.use(confuseScrapers);

// ── 3. Global DDoS — hard cap 300 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down.' }
}));

// ── 4. Anti-scraping middleware (UA check, behavior analysis)
app.use(antiScrape);

// ── 5. CORS
app.use(cors({
  origin: isProd ? false : 'http://localhost:3000',
  credentials: true
}));

// ── 6. Body limits (prevent payload attacks)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── 7. Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'gs_sid',
  cookie: {
    secure:   isProd,
    httpOnly: true,
    maxAge:   8 * 60 * 60 * 1000,
    sameSite: 'strict'
  }
}));

// ── 8. Block attack paths
const BLOCKED = ['/wp-admin','/wp-login','/.env','/phpMyAdmin','/admin.php',
  '/config.php','/.git','/etc/passwd','/.htaccess','/shell','/cgi-bin',
  '/xmlrpc.php','/.DS_Store','/server-status','/actuator','/admin'];
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (BLOCKED.some(b => p === b || p.startsWith(b + '/'))) {
    return res.status(404).send('Not found');
  }
  next();
});

// ── 9. API token endpoint (frontend calls this on load)
app.get('/api/token', issueToken);

// ── 10. Routes
app.use('/api', apiRoutes);
app.use('/api/ml-panel', adminRoutes);

// ── 11. Static files + React
if (isProd) {
  app.use(express.static(path.join(__dirname, '../client/dist'), {
    maxAge: '7d', etag: true, lastModified: true
  }));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ── 12. Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Auto-move expired live classes to Approved (videos) tab
// Runs every hour - moves live classes where date < today
async function autoMoveLiveToVideos() {
  try {
    const { readRows, appendRow, updateRow } = require('./config/google');
    const rows = await readRows('Live');
    const today = new Date(); today.setHours(0,0,0,0);
    let moved = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0] || row[0] === '[REMOVED]' || !row[4]) continue;
      const liveDate = new Date(row[4]);
      if (liveDate < today) {
        // Move to Approved as video
        const approvedRow = [
          row[0], row[1]||'', 'Zoom', row[2]||'Unknown', row[3]||'Unknown',
          row[8]||new Date().toISOString(), '', row[6]||'', row[7]||'Anonymous', 'video'
        ];
        await appendRow('Approved', approvedRow);
        await updateRow('Live', i, ['[MOVED]','','','','','','','','']);
        moved++;
      }
    }
    if (moved > 0) console.log(`✅ Auto-moved ${moved} expired live class(es) to videos`);
  } catch(e) {
    console.error('Auto-move error:', e.message);
  }
}

// Run on startup and every hour
setTimeout(autoMoveLiveToVideos, 5000);
setInterval(autoMoveLiveToVideos, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`✅ GuruSala on http://localhost:${PORT} [${isProd?'PROD':'dev'}]`);
});
