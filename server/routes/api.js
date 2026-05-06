const express = require('express');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { readRows } = require('../config/google');
const { requireToken } = require('../middleware/tokenAuth');

const router = express.Router();
const D = path.join(__dirname, '../data');

const read = (f) => {
  try { return JSON.parse(fs.readFileSync(path.join(D, f), 'utf-8')); }
  catch { return (f.includes('views') || f.includes('tags')) ? {} : []; }
};
const write = (f, d) => fs.writeFileSync(path.join(D, f), JSON.stringify(d, null, 2));

// ── Ensure data files exist
const defaults = { 'tags.json':{}, 'views.json':{}, 'reports.json':[], 'submissions.json':[], 'approved.json':[], 'live.json':[], 'pending_tags.json':[] };
Object.entries(defaults).forEach(([f,def]) => { if (!fs.existsSync(path.join(D,f))) write(f,def); });

// ── Input sanitizer — strip HTML/script tags
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').trim().slice(0, 2000);
}

// ── Platform detection & validation
const ALLOWED_DOMAINS = [
  'youtube.com','youtu.be','m.youtube.com','www.youtube.com',
  'zoom.us','us06web.zoom.us','us02web.zoom.us','us04web.zoom.us',
  'classroom.google.com','drive.google.com',
  'vimeo.com','www.vimeo.com',
  'meet.google.com'
];

function isAllowedUrl(url) {
  try {
    const { hostname } = new URL(url);
    const h = hostname.toLowerCase().replace(/^www\./, '');
    return ALLOWED_DOMAINS.some(d => h === d || h.endsWith('.'+d));
  } catch { return false; }
}

function detectPlatform(url) {
  if (!url) return 'Other';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('zoom.us')) return 'Zoom';
  if (u.includes('classroom.google.com')) return 'Classroom';
  if (u.includes('drive.google.com')) return 'Drive';
  if (u.includes('vimeo.com')) return 'Vimeo';
  if (u.includes('meet.google.com')) return 'Meet';
  return 'Other';
}

function extractYtId(url) {
  if (!url) return '';
  const ps = [/[?&]v=([a-zA-Z0-9_-]{11})/,/youtu\.be\/([a-zA-Z0-9_-]{11})/,/\/live\/([a-zA-Z0-9_-]{11})/,/\/shorts\/([a-zA-Z0-9_-]{11})/];
  for (const p of ps) { const m = url.match(p); if (m) return m[1]; }
  return '';
}

// ── Shuffle array (Fisher-Yates) — for randomizing non-YouTube videos
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Rate limiters
const videoLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20,
  message: { error: 'Too many requests.' },
  standardHeaders: true, legacyHeaders: false
});
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 8,
  message: { error: 'Too many submissions. Wait 15 minutes.' }
});
const viewLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60,
  message: { error: 'Rate limited.' }
});
const tagLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { error: 'Too many tag submissions.' }
});
const dupLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30,
  message: { error: 'Too many requests.' }
});

// ── GET /api/videos
// YouTube videos first (they have thumbnails), rest shuffled per request
router.get('/videos', videoLimiter, requireToken, async (req, res) => {
  try {
    const base = read('videos.json');
    const views = read('views.json');
    const tags = read('tags.json');

    // Exclude Drive links from video feed
    const baseFiltered = base.filter(v => v.p !== 'Drive');

    const addMeta = (v, idStr) => ({
      ...v,
      views: views[idStr] || 0,
      communityTags: tags[idStr] || null,
      topTeacher: tags[idStr]?.teachers
        ? Object.entries(tags[idStr].teachers).sort((a,b)=>b[1]-a[1])[0]?.[0]
        : null
    });

    // YouTube videos first (shuffled each load), then others (shuffled each load)
    const ytVideos = shuffle(
      baseFiltered.filter(v => v.p === 'YouTube')
    ).map(v => addMeta(v, String(v.id)));

    const otherVideos = shuffle(
      baseFiltered.filter(v => v.p !== 'YouTube')
    ).map(v => addMeta(v, String(v.id)));

    // Sheet approved
    let sheetApproved = [];
    try {
      const rows = await readRows('Approved');
      sheetApproved = rows
        .filter(r => r[2] !== 'Drive' && r[1])
        .map((r, i) => {
          const id = `sheet_${i}`;
          return {
            id, t: sanitize(r[0]||''), u: r[1]||'', p: r[2]||'Other',
            s: r[3]||'Unknown', g: r[4]||'Unknown',
            d: r[5]||'', yi: r[6]||'',
            tute_url: r[7]||'', submitter: r[8]||'',
            type: r[9]||'video',
            views: views[id] || 0,
            communityTags: tags[id] || null,
            topTeacher: null
          };
        });
    } catch {}

    // Final order: YouTube first → sheet approved → other platforms shuffled
    res.json({ videos: [...ytVideos, ...sheetApproved, ...otherVideos] });
  } catch (err) {
    console.error('Videos error:', err);
    res.status(500).json({ error: 'Failed to load videos' });
  }
});

// ── GET /api/materials
router.get('/materials', (req, res) => {
  try {
    const materials = read('materials.json');
    const base = read('videos.json');
    const driveMats = base.filter(v => v.p === 'Drive').map(v => ({ t: v.t, u: v.u, tp: 'file', d: v.d, s: v.s }));
    res.json({ materials: [...materials, ...driveMats] });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// ── GET /api/live
router.get('/live', async (req, res) => {
  try {
    const rows = await readRows('Live');
    const live = rows.filter(r => r[1]).map((r, i) => ({
      id: `live_${i}`,
      t: sanitize(r[0]||''), u: r[1]||'',
      s: r[2]||'Unknown', g: r[3]||'Unknown',
      date: r[4]||'', time: r[5]||'',
      tute_url: r[6]||'', submitter: r[7]||''
    }));
    res.json({ live });
  } catch { res.json({ live: [] }); }
});

// ── POST /api/view/:id — view count, 1 per IP per video per hour
const viewCache = new Map();
router.post('/view/:id', viewLimiter, (req, res) => {
  const rawId = req.params.id;
  // Validate ID format
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(rawId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  const ip = req.ip || '';
  const key = `${ip}_${rawId}`;
  const now = Date.now();
  const views = read('views.json');
  if (now - (viewCache.get(key) || 0) >= 60 * 60 * 1000) {
    viewCache.set(key, now);
    views[rawId] = (views[rawId] || 0) + 1;
    write('views.json', views);
  }
  res.json({ views: views[rawId] || 0 });
});

// ── GET /api/trending — top viewed videos
router.get('/trending', (req, res) => {
  try {
    const views = read('views.json');
    const base = read('videos.json');
    const sorted = Object.entries(views)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, count]) => {
        const v = base.find(x => String(x.id) === id);
        return v ? { ...v, views: count } : null;
      })
      .filter(Boolean);
    res.json({ trending: sorted });
  } catch { res.json({ trending: [] }); }
});

// ── GET /api/check-duplicate
router.get('/check-duplicate', dupLimiter, async (req, res) => {
  const url = sanitize(req.query.url || '');
  if (!url) return res.json({ duplicate: false });
  if (!isAllowedUrl(url)) return res.json({ duplicate: false, notAllowed: true });
  const n = url.toLowerCase();
  const videos = read('videos.json');
  const materials = read('materials.json');
  const submissions = read('submissions.json');
  let sheetDup = false;
  try {
    const rows = await readRows('Approved');
    sheetDup = rows.some(r => (r[1]||'').toLowerCase() === n);
  } catch {}
  const dup = videos.some(v=>v.u?.toLowerCase()===n) ||
    materials.some(m=>m.u?.toLowerCase()===n) ||
    submissions.some(s=>s.url?.toLowerCase()===n) ||
    sheetDup;
  res.json({ duplicate: dup });
});

// ── POST /api/submit
router.post('/submit', submitLimiter, async (req, res) => {
  // Sanitize all inputs
  const type     = sanitize(req.body.type || 'video');
  const title    = sanitize(req.body.title || '');
  const url      = sanitize(req.body.url || '');
  const subject  = sanitize(req.body.subject || '');
  const grade    = sanitize(req.body.grade || '');
  const tute_url = sanitize(req.body.tute_url || '');
  const date     = sanitize(req.body.date || '');
  const time     = sanitize(req.body.time || '');
  const name     = sanitize(req.body.name || 'Anonymous').slice(0, 60);

  // Validate
  if (!title || title.length < 3) return res.status(400).json({ error: 'Title must be at least 3 characters.' });
  if (!url) return res.status(400).json({ error: 'URL is required.' });
  if (!subject) return res.status(400).json({ error: 'Subject is required.' });
  if (!['video','tute','live'].includes(type)) return res.status(400).json({ error: 'Invalid type.' });
  if (type === 'live' && (!date || !time)) return res.status(400).json({ error: 'Date and time required for live class.' });

  // Validate URL format
  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL format.' }); }

  // Only allow specific platforms
  if (!isAllowedUrl(url)) {
    return res.status(400).json({ error: 'Only YouTube, Zoom, Google Classroom, Google Drive, and Vimeo links are accepted.' });
  }

  // Validate tute_url if provided
  if (tute_url && !isAllowedUrl(tute_url)) {
    return res.status(400).json({ error: 'Study material URL must be a Google Drive link.' });
  }

  // Date/time validation for live
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return res.status(400).json({ error: 'Invalid time format. Use HH:MM.' });
  // Allow today and future dates only (no more than 1 year in future)
  if (date) {
    const d = new Date(date);
    const today = new Date(); today.setHours(0,0,0,0);
    const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear()+1);
    if (d < today) return res.status(400).json({ error: 'Date cannot be in the past for live classes.' });
    if (d > maxDate) return res.status(400).json({ error: 'Date cannot be more than 1 year in the future.' });
  }

  const n = url.toLowerCase();
  const videos = read('videos.json');
  const materials = read('materials.json');
  const submissions = read('submissions.json');

  if (videos.some(v=>v.u?.toLowerCase()===n) ||
    materials.some(m=>m.u?.toLowerCase()===n) ||
    submissions.some(s=>s.url?.toLowerCase()===n)) {
    return res.status(409).json({ error: 'This link already exists on GuruSala.' });
  }

  const sub = {
    id: uuidv4(), type, title, url, subject, grade,
    tute_url, date, time, name,
    platform: detectPlatform(url),
    youtube_id: extractYtId(url),
    status: 'pending',
    submitted_at: new Date().toISOString()
  };
  submissions.push(sub);
  write('submissions.json', submissions);
  res.json({ success: true });
});

// ── POST /api/tag/:id
router.post('/tag/:id', tagLimiter, (req, res) => {
  const rawId = req.params.id;
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(rawId)) return res.status(400).json({ error: 'Invalid ID' });

  const subject = sanitize(req.body.subject || '').slice(0,50);
  const grade   = sanitize(req.body.grade || '').slice(0,20);
  const teacher = sanitize(req.body.teacher || '').slice(0,80);

  if (!subject && !grade && !teacher) return res.status(400).json({ error: 'Nothing to tag.' });

  const pendingTags = read('pending_tags.json');
  const existing = pendingTags.find(t=>t.video_id===rawId&&t.status==='pending');
  if (existing) {
    if (subject) existing.subjects[subject] = (existing.subjects[subject]||0)+1;
    if (grade) existing.grades[grade] = (existing.grades[grade]||0)+1;
    if (teacher) existing.teachers[teacher] = (existing.teachers[teacher]||0)+1;
    existing.count = (existing.count||1)+1;
    existing.last_updated = new Date().toISOString();
  } else {
    const entry = { id:uuidv4(), video_id:rawId, subjects:{}, grades:{}, teachers:{}, count:1, status:'pending', created_at:new Date().toISOString(), last_updated:new Date().toISOString() };
    if (subject) entry.subjects[subject]=1;
    if (grade) entry.grades[grade]=1;
    if (teacher) entry.teachers[teacher]=1;
    pendingTags.push(entry);
  }
  write('pending_tags.json', pendingTags);
  res.json({ success: true, message: 'Tag submitted for review' });
});

// ── POST /api/report
router.post('/report', rateLimit({ windowMs:60*60*1000, max:10, message:{error:'Too many reports.'} }), (req, res) => {
  const video_id = sanitize(String(req.body.video_id||''));
  if (!video_id || !/^[a-zA-Z0-9_-]{1,50}$/.test(video_id)) return res.status(400).json({ error: 'Invalid video ID.' });

  const current_subject  = sanitize(req.body.current_subject||'').slice(0,50);
  const current_grade    = sanitize(req.body.current_grade||'').slice(0,20);
  const suggested_subject = sanitize(req.body.suggested_subject||'').slice(0,50);
  const suggested_grade  = sanitize(req.body.suggested_grade||'').slice(0,20);
  const issues = (req.body.issues||[]).filter(i=>typeof i==='string').map(i=>sanitize(i).slice(0,30)).slice(0,5);

  const reports = read('reports.json');
  const existing = reports.find(r=>r.video_id===video_id&&r.status==='pending');
  if (existing) {
    existing.count=(existing.count||1)+1;
    if (suggested_subject) existing.suggested_subject=suggested_subject;
    if (suggested_grade) existing.suggested_grade=suggested_grade;
    if (issues.length) existing.issues=[...new Set([...(existing.issues||[]),...issues])];
    existing.last_reported=new Date().toISOString();
  } else {
    reports.push({ id:uuidv4(), video_id, current_subject, current_grade, suggested_subject, suggested_grade, issues, count:1, status:'pending', reported_at:new Date().toISOString(), last_reported:new Date().toISOString() });
  }
  write('reports.json', reports);
  res.json({ success: true });
});

// ── GET /api/notice
router.get('/notice', (req, res) => {
  res.json({
    si: process.env.NOTICE_SI || 'බොහෝ Zoom recordings වැඩ නොකරනු ඇත — ඔබට අවශ්‍ය videos Download කර ඔබ සතුව තබාගන්න.',
    en: process.env.NOTICE_EN || 'Most Zoom recordings may expire. Download and save important videos yourself.'
  });
});

module.exports = router;
