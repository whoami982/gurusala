import { useState } from 'react'
import { Modal, ModalHeader, SubjBadge, GradeBadge, PlatBadge, Button } from './ui'
import { fmtDate, fmtViews, isToday, SUBJECTS, GRADES } from '../utils/helpers'
import { incrementView, submitReport, submitTag } from '../utils/api'
import { TagIcon, AlertIcon, CheckIcon, CloseIcon, ExternalIcon, ClockIcon, EyeIcon } from './Icons'

export default function VideoModal({ video, isLive = false, materials, onClose }) {
  const [tagMode, setTagMode] = useState(false)
  const [tagData, setTagData] = useState({ subject: '', grade: '', teacher: '' })
  const [tagSent, setTagSent] = useState(false)
  const [tagLoading, setTagLoading] = useState(false)
  const [reportMode, setReportMode] = useState(false)
  const [reportData, setReportData] = useState({ suggested_subject: '', suggested_grade: '', issues: [] })
  const [reportSent, setReportSent] = useState(false)
  const [localViews, setLocalViews] = useState(video?.views || 0)

  if (!video) return null

  const tute = video.tute_url
    ? { u: video.tute_url, t: 'Related Study Material' }
    : materials?.find(m => video.s && video.s !== 'Unknown' && m.t?.toLowerCase().includes(video.s.toLowerCase()))

  const descs = {
    YouTube: 'Opens on YouTube in a new tab.',
    Zoom: 'Opens in Zoom. Links may expire — download important recordings.',
    Classroom: 'Sign in with your school Google account to access.',
    Drive: 'Sign in with your Google account to open.',
    Other: 'Opens in a new tab.'
  }
  const btnLabels = { YouTube: 'Watch on YouTube', Zoom: 'Open in Zoom', Classroom: 'Open Classroom', Drive: 'Open in Drive', Other: 'Open Link' }
  const p = video.p || 'Other'

  const topTeacher = video.communityTags?.teachers
    ? Object.entries(video.communityTags.teachers).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null

  async function handleOpen() {
    if (!video.u) return
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isYouTube = video.p === 'YouTube' || video.u?.includes('youtube.com') || video.u?.includes('youtu.be')

    if (isMobile && isYouTube) {
      // On mobile: try YouTube app first, fall back to browser
      const ytAppUrl = video.u
        .replace('https://www.youtube.com/watch?v=', 'youtube://www.youtube.com/watch?v=')
        .replace('https://youtu.be/', 'youtube://www.youtube.com/watch?v=')
        .replace('https://m.youtube.com/watch?v=', 'youtube://www.youtube.com/watch?v=')
      // Try app first, fall back to browser after short delay
      window.location.href = ytAppUrl
      setTimeout(() => { window.open(video.u, '_blank', 'noopener,noreferrer') }, 1500)
    } else {
      window.open(video.u, '_blank', 'noopener,noreferrer')
    }
    // Track view
    try {
      const r = await incrementView(video.id)
      setLocalViews(r.data.views)
    } catch {
      setLocalViews(v => v + 1)
    }
  }

  async function sendTag() {
    if (!tagData.subject && !tagData.grade && !tagData.teacher.trim()) return
    setTagLoading(true)
    try {
      await submitTag(video.id, {
        subject: tagData.subject || undefined,
        grade: tagData.grade || undefined,
        teacher: tagData.teacher.trim() || undefined
      })
      setTagSent(true)
    } catch {}
    setTagLoading(false)
  }

  async function sendReport() {
    if (!reportData.suggested_subject && !reportData.suggested_grade && !reportData.issues.length) return
    try {
      await submitReport({ video_id: video.id, current_subject: video.s, current_grade: video.g, ...reportData })
      setReportSent(true)
    } catch {}
  }

  const toggleIssue = (issue) => setReportData(prev => ({
    ...prev,
    issues: prev.issues.includes(issue) ? prev.issues.filter(i => i !== issue) : [...prev.issues, issue]
  }))

  const selStyle = { background: 'var(--s3)', border: '1px solid var(--b1)', borderRadius: 8, color: 'var(--t1)', padding: '8px 10px', fontSize: 12, width: '100%', fontFamily: 'inherit', outline: 'none' }
  const inputStyle = { background: 'var(--s3)', border: '1px solid var(--b1)', borderRadius: 8, color: 'var(--t1)', padding: '8px 10px', fontSize: 12, width: '100%', fontFamily: 'inherit', outline: 'none' }

  return (
    <Modal open={!!video} onClose={onClose} maxWidth={640}>
      <ModalHeader title={video.t} onClose={onClose} />

      {/* Meta */}
      <div style={{ padding: '10px 18px 0', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <SubjBadge subject={video.s} />
        <GradeBadge grade={video.g} />
        <PlatBadge platform={isLive ? 'Live' : p} style={isLive ? { background: 'rgba(239,68,68,0.85)', color: '#fff', position: 'static' } : { position: 'static' }} />
        {topTeacher && (
          <span style={{ fontSize: 9, padding: '3px 7px', borderRadius: 5, background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.15)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserIcon size={9} /> {topTeacher}
          </span>
        )}
        {localViews > 0 && (
          <span style={{ fontSize: 9, padding: '3px 7px', borderRadius: 5, background: 'var(--s3)', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <EyeIcon size={9} /> {fmtViews(localViews)}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 2 }}>{fmtDate(isLive ? video.date : video.d)}</span>
      </div>

      <div style={{ padding: 20 }}>
        {/* Main action card */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 14, padding: '26px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--s3)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {isLive
                ? <><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></>
                : p === 'YouTube' ? <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>
                : p === 'Zoom' ? <><rect x="2" y="7" width="15" height="10" rx="2"/><path d="M17 9l5-2v10l-5-2V9z"/></>
                : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>
              }
            </svg>
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
            {isLive ? 'Live Class' : `${p} Video`}
          </div>

          {isLive && video.time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#fca5a5', fontWeight: 600 }}>
              <ClockIcon size={13} />
              {isToday(video.date) ? 'Today' : fmtDate(video.date)} at {video.time} · Sri Lanka Time
            </div>
          )}

          <div style={{ fontSize: 12, color: 'var(--t2)', maxWidth: 340, lineHeight: 1.7 }}>
            {descs[p] || descs.Other}
          </div>

          {p === 'Zoom' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 9, padding: '10px 14px', fontSize: 11, color: '#fbbf24', width: '100%', maxWidth: 380, textAlign: 'left', lineHeight: 1.6 }}>
              <AlertIcon size={13} />
              <span>Zoom recording links may expire at any time. Download and save important ones.</span>
            </div>
          )}

          {tute && (
            <a href={tute.u} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--acd)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: 'var(--acl)', width: '100%', maxWidth: 380, textDecoration: 'none', transition: 'background 0.13s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--acd)'}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {tute.t}
            </a>
          )}

          <Button onClick={handleOpen} style={{ padding: '11px 28px' }}>
            <ExternalIcon size={13} />
            {isLive ? 'Join Live Class' : (btnLabels[p] || 'Open')}
          </Button>
        </div>

        {/* Community tagging */}
        <div style={{ marginTop: 14, background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: tagMode ? 14 : 0 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TagIcon size={13} /> Community Tags
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>
                {topTeacher ? `Teacher: ${topTeacher} · Subject: ${video.s}` : 'Help improve filtering — tag this video'}
              </div>
            </div>
            {!tagSent && (
              <button onClick={() => setTagMode(!tagMode)} style={{ fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 7, border: `1px solid ${tagMode ? 'var(--ac)' : 'var(--b2)'}`, background: tagMode ? 'var(--acd)' : 'var(--s3)', color: tagMode ? 'var(--acl)' : 'var(--t2)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {tagMode ? 'Cancel' : 'Add Tag'}
              </button>
            )}
          </div>

          {tagMode && !tagSent && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Subject</div>
                  <select value={tagData.subject} onChange={e => setTagData(p => ({ ...p, subject: e.target.value }))} style={selStyle}>
                    <option value="">Select subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Grade</div>
                  <select value={tagData.grade} onChange={e => setTagData(p => ({ ...p, grade: e.target.value }))} style={selStyle}>
                    <option value="">Select grade</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Teacher Name</div>
                <input value={tagData.teacher} onChange={e => setTagData(p => ({ ...p, teacher: e.target.value }))} placeholder="e.g. Upul Sir, Saman Teacher..." style={inputStyle} />
                <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 4 }}>Submitted for admin review before appearing</div>
              </div>
              <button onClick={sendTag} disabled={tagLoading} style={{ width: '100%', padding: 9, borderRadius: 8, border: 'none', background: 'var(--ac)', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: tagLoading ? 0.6 : 1 }}>
                {tagLoading ? 'Submitting...' : 'Submit Tag for Review'}
              </button>
            </div>
          )}

          {tagSent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, fontSize: 12, color: 'var(--grn)' }}>
              <CheckIcon size={14} /> Tag submitted for admin review. Thank you!
            </div>
          )}

          {!tagMode && !tagSent && video.communityTags?.teachers && Object.keys(video.communityTags.teachers).length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--b1)' }}>
              <div style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Community tagged teachers</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {Object.entries(video.communityTags.teachers).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, c]) => (
                  <span key={t} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, background: 'rgba(168,85,247,0.09)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.15)', fontWeight: 500 }}>
                    {t} <span style={{ opacity: 0.5 }}>· {c}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Report issue */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--b1)' }}>
          {!reportMode && !reportSent && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Is something wrong with this video?</span>
              <button onClick={() => setReportMode(true)} style={{ fontSize: 11, fontWeight: 600, color: 'var(--amb)', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 6, padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Report Issue
              </button>
            </div>
          )}

          {reportMode && !reportSent && (
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 12 }}>Report an Issue</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {['wrong_subject', 'wrong_grade', 'broken_link', 'duplicate_video', 'inappropriate'].map(issue => (
                  <button key={issue} onClick={() => toggleIssue(issue)} style={{ padding: '5px 11px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: reportData.issues.includes(issue) ? 'var(--acd)' : 'var(--s3)', border: `1px solid ${reportData.issues.includes(issue) ? 'var(--ac)' : 'var(--b1)'}`, color: reportData.issues.includes(issue) ? 'var(--acl)' : 'var(--t3)' }}>
                    {issue.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 5 }}>Correct Subject</div>
                  <select value={reportData.suggested_subject} onChange={e => setReportData(p => ({ ...p, suggested_subject: e.target.value }))} style={selStyle}>
                    <option value="">No change</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 5 }}>Correct Grade</div>
                  <select value={reportData.suggested_grade} onChange={e => setReportData(p => ({ ...p, suggested_grade: e.target.value }))} style={selStyle}>
                    <option value="">No change</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={sendReport} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: 'var(--ac)', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Send Report</button>
                <button onClick={() => setReportMode(false)} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--s2)', color: 'var(--t2)', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {reportSent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, fontSize: 12, color: 'var(--grn)' }}>
              <CheckIcon size={13} /> Report submitted. Thank you for helping improve GuruSala.
            </div>
          )}
        </div>

        {/* Copyright */}
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--s2)', borderRadius: 9, fontSize: 10, color: 'var(--t4)', lineHeight: 1.7, textAlign: 'center' }}>
          This video belongs to its original creator. All rights reserved. GuruSala links to external content only and does not host any videos.
        </div>
      </div>
    </Modal>
  )
}
