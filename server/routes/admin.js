const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { appendRow, readRows, updateRow } = require('../config/google');

const router = express.Router();
const D = path.join(__dirname, '../data');
const read = f => { try { return JSON.parse(fs.readFileSync(path.join(D, f), 'utf-8')); } catch { return f.includes('tags')||f.includes('views') ? {} : []; } };
const write = (f, d) => fs.writeFileSync(path.join(D, f), JSON.stringify(d, null, 2));

const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, message: { error: 'Too many attempts.' } });

router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Incorrect password' });
  req.session.isAdmin = true;
  res.json({ success: true });
});
router.post('/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
router.get('/check', (req, res) => { res.json({ isAdmin: !!(req.session && req.session.isAdmin) }); });

router.get('/stats', requireAuth, (req, res) => {
  const subs = read('submissions.json');
  const pendingTags = read('pending_tags.json');
  const reports = read('reports.json');
  res.json({
    pending: subs.filter(s=>s.status==='pending').length,
    approved: subs.filter(s=>s.status==='approved').length,
    declined: subs.filter(s=>s.status==='declined').length,
    total: subs.length,
    pendingTags: pendingTags.filter(t=>t.status==='pending').length,
    pendingReports: reports.filter(r=>r.status==='pending').length
  });
});

router.get('/pending', requireAuth, (req, res) => {
  const subs = read('submissions.json');
  res.json({ submissions: subs.filter(s=>s.status==='pending').sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)) });
});

// ── Approve → Google Sheet
router.post('/approve/:id', requireAuth, async (req, res) => {
  try {
    const subs = read('submissions.json');
    const idx = subs.findIndex(s=>s.id===req.params.id);
    if (idx===-1) return res.status(404).json({ error: 'Not found' });
    const sub = subs[idx];
    sub.status = 'approved';
    sub.approved_at = new Date().toISOString();
    write('submissions.json', subs);
    res.json({ success: true });
    const isLive = sub.type === 'live';
    const values = isLive
      ? [sub.title, sub.url, sub.subject, sub.grade, sub.date||'', sub.time||'', sub.tute_url||'', sub.name, sub.approved_at]
      : [sub.title, sub.url, sub.platform, sub.subject, sub.grade, sub.submitted_at, sub.youtube_id||'', sub.tute_url||'', sub.name, sub.type];
    appendRow(isLive?'Live':'Approved', values)
      .then(ok => { if(ok) console.log('✅ Sheet updated:', sub.title); })
      .catch(e => console.error('Sheet write error:', e.message));
  } catch(err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed' });
  }
});

// ── Decline
router.post('/decline/:id', requireAuth, (req, res) => {
  let subs = read('submissions.json');
  const idx = subs.findIndex(s=>s.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  subs.splice(idx, 1);
  write('submissions.json', subs);
  res.json({ success: true });
});

// ── GET all videos for admin (base + sheet)
router.get('/videos', requireAuth, async (req, res) => {
  try {
    const base = read('videos.json');
    let sheetVideos = [];
    try {
      const rows = await readRows('Approved');
      sheetVideos = rows.map((r, i) => ({
        id: `sheet_${i}`, _sheetRow: i,
        t: r[0]||'', u: r[1]||'', p: r[2]||'Other',
        s: r[3]||'Unknown', g: r[4]||'Unknown',
        d: r[5]||'', yi: r[6]||'',
        tute_url: r[7]||'', submitter: r[8]||'',
        type: r[9]||'video', source:'sheet',
        description: r[10]||''
      }));
    } catch {}
    res.json({ base, sheet: sheetVideos, totalBase: base.length });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// ── Edit video (subject, grade, title, description)
router.patch('/videos/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { subject, grade, title, description } = req.body;

  if (id.startsWith('sheet_')) {
    const rowIdx = parseInt(id.replace('sheet_', ''));
    try {
      const rows = await readRows('Approved');
      if (rowIdx < rows.length) {
        const row = [...rows[rowIdx]];
        if (title !== undefined) row[0] = title;
        if (subject !== undefined) row[3] = subject;
        if (grade !== undefined) row[4] = grade;
        if (description !== undefined) row[10] = description;
        await updateRow('Approved', rowIdx, row);
        return res.json({ success: true, source:'sheet' });
      }
    } catch(e) { return res.status(500).json({ error: 'Sheet update failed: '+e.message }); }
  }

  const videos = read('videos.json');
  const idx = videos.findIndex(v=>String(v.id)===String(id));
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  if (title !== undefined) videos[idx].t = title;
  if (subject !== undefined) videos[idx].s = subject;
  if (grade !== undefined) videos[idx].g = grade;
  if (description !== undefined) videos[idx].desc = description;
  write('videos.json', videos);
  res.json({ success: true, source:'local' });
});

// ── Delete video
router.delete('/videos/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (id.startsWith('sheet_')) {
    // For sheet videos - we can't delete rows easily, so we blank the URL
    const rowIdx = parseInt(id.replace('sheet_', ''));
    try {
      const rows = await readRows('Approved');
      if (rowIdx < rows.length) {
        const row = [...rows[rowIdx]];
        row[0] = '[DELETED]'; row[1] = '';
        await updateRow('Approved', rowIdx, row);
        return res.json({ success: true, note: 'Sheet row blanked' });
      }
    } catch(e) { return res.status(500).json({ error: 'Sheet delete failed' }); }
  }

  const videos = read('videos.json');
  const idx = videos.findIndex(v=>String(v.id)===String(id));
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  videos.splice(idx, 1);
  write('videos.json', videos);
  res.json({ success: true });
});

// ── Pending tag suggestions
router.get('/tags/pending', requireAuth, (req, res) => {
  const pendingTags = read('pending_tags.json');
  const videos = read('videos.json');
  const pending = pendingTags.filter(t=>t.status==='pending').map(t => {
    const video = videos.find(v=>String(v.id)===String(t.video_id));
    const topSubj = Object.entries(t.subjects||{}).sort((a,b)=>b[1]-a[1])[0];
    const topGrade = Object.entries(t.grades||{}).sort((a,b)=>b[1]-a[1])[0];
    const topTeacher = Object.entries(t.teachers||{}).sort((a,b)=>b[1]-a[1])[0];
    return {
      id: t.id, video_id: t.video_id,
      video_title: video?.t||`Video #${t.video_id}`,
      video_url: video?.u||'',
      current_subject: video?.s||'Unknown',
      current_grade: video?.g||'Unknown',
      top_subject: topSubj?{value:topSubj[0],votes:topSubj[1]}:null,
      top_grade: topGrade?{value:topGrade[0],votes:topGrade[1]}:null,
      top_teacher: topTeacher?{value:topTeacher[0],votes:topTeacher[1]}:null,
      count: t.count,
      all_subjects: t.subjects, all_grades: t.grades, all_teachers: t.teachers,
      created_at: t.created_at
    };
  }).sort((a,b)=>b.count-a.count);
  res.json({ tags: pending });
});

// ── Approve tag
router.post('/tags/:id/approve', requireAuth, (req, res) => {
  const { subject, grade, teacher } = req.body;
  const pendingTags = read('pending_tags.json');
  const idx = pendingTags.findIndex(t=>t.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  const tagEntry = pendingTags[idx];
  tagEntry.status = 'approved';
  tagEntry.resolved_at = new Date().toISOString();
  write('pending_tags.json', pendingTags);

  const videos = read('videos.json');
  const vidIdx = videos.findIndex(v=>String(v.id)===String(tagEntry.video_id));
  if (vidIdx!==-1) {
    if (subject) videos[vidIdx].s = subject;
    if (grade) videos[vidIdx].g = grade;
    if (teacher) {
      const tags = read('tags.json');
      if (!tags[tagEntry.video_id]) tags[tagEntry.video_id] = { subjects:{}, grades:{}, teachers:{} };
      tags[tagEntry.video_id].teachers[teacher] = 999;
      write('tags.json', tags);
    }
    write('videos.json', videos);
  }
  res.json({ success: true });
});

// ── Dismiss tag
router.post('/tags/:id/dismiss', requireAuth, (req, res) => {
  const pendingTags = read('pending_tags.json');
  const idx = pendingTags.findIndex(t=>t.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  pendingTags[idx].status = 'dismissed';
  write('pending_tags.json', pendingTags);
  res.json({ success: true });
});

// ── Reports (with video link)
router.get('/reports', requireAuth, (req, res) => {
  const reports = read('reports.json');
  const videos = read('videos.json');
  const enriched = reports.filter(r=>r.status==='pending').map(r => {
    const video = videos.find(v=>String(v.id)===String(r.video_id));
    return { ...r, video_url: video?.u||'', video_title: video?.t||'' };
  }).sort((a,b)=>b.count-a.count);
  res.json({ reports: enriched });
});

router.post('/reports/:id/fix', requireAuth, (req, res) => {
  const { suggested_subject, suggested_grade } = req.body;
  const reports = read('reports.json');
  const videos = read('videos.json');
  const idx = reports.findIndex(r=>r.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  const report = reports[idx];
  const vidIdx = videos.findIndex(v=>String(v.id)===String(report.video_id));
  if (vidIdx!==-1) {
    if (suggested_subject) videos[vidIdx].s = suggested_subject;
    if (suggested_grade) videos[vidIdx].g = suggested_grade;
    write('videos.json', videos);
  }
  report.status = 'resolved';
  report.resolved_at = new Date().toISOString();
  write('reports.json', reports);
  res.json({ success: true });
});

router.post('/reports/:id/dismiss', requireAuth, (req, res) => {
  const reports = read('reports.json');
  const idx = reports.findIndex(r=>r.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error: 'Not found' });
  reports[idx].status = 'dismissed';
  write('reports.json', reports);
  res.json({ success: true });
});


// ── GET /api/ml-panel/live/all — all live videos for admin
router.get('/live/all', requireAuth, async (req, res) => {
  try {
    const rows = await readRows('Live');
    const live = rows.map((r, i) => ({
      id: `live_${i}`, _row: i,
      t: r[0]||'', u: r[1]||'',
      s: r[2]||'Unknown', g: r[3]||'Unknown',
      date: r[4]||'', time: r[5]||'',
      tute_url: r[6]||'', submitter: r[7]||'',
      approved_at: r[8]||'',
      source: 'live'
    }));
    res.json({ live });
  } catch(e) { res.status(500).json({ error: 'Failed: '+e.message }); }
});

// ── PATCH /api/ml-panel/live/:id — edit live video
router.patch('/live/:id', requireAuth, async (req, res) => {
  const rowIdx = parseInt(req.params.id.replace('live_',''));
  const { title, subject, grade, date, time, tute_url } = req.body;
  try {
    const rows = await readRows('Live');
    if (rowIdx >= rows.length) return res.status(404).json({ error: 'Not found' });
    const row = [...rows[rowIdx]];
    if (title !== undefined)    row[0] = title;
    if (subject !== undefined)  row[2] = subject;
    if (grade !== undefined)    row[3] = grade;
    if (date !== undefined)     row[4] = date;
    if (time !== undefined)     row[5] = time;
    if (tute_url !== undefined) row[6] = tute_url;
    await updateRow('Live', rowIdx, row);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: 'Sheet update failed: '+e.message }); }
});

// ── DELETE /api/ml-panel/live/:id — delete or move live to Approved
router.delete('/live/:id', requireAuth, async (req, res) => {
  const rowIdx = parseInt(req.params.id.replace('live_',''));
  const { moveToVideos } = req.body;
  try {
    const rows = await readRows('Live');
    if (rowIdx >= rows.length) return res.status(404).json({ error: 'Not found' });
    const row = [...rows[rowIdx]];
    if (moveToVideos) {
      // Move to Approved tab as a regular video
      const approvedRow = [
        row[0], row[1], 'Zoom', row[2], row[3],
        row[8]||new Date().toISOString(), '', row[6]||'', row[7]||'', 'video'
      ];
      await appendRow('Approved', approvedRow);
    }
    // Blank the live row (can't delete rows from Sheets easily)
    const blank = ['[REMOVED]','','','','','','','',''];
    await updateRow('Live', rowIdx, blank);
    res.json({ success: true, moved: !!moveToVideos });
  } catch(e) { res.status(500).json({ error: 'Failed: '+e.message }); }
});

module.exports = router;
