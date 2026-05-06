import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminCheck, adminStats, adminPending, adminApprove, adminDecline,
  adminReports, adminFixReport, adminDismissReport, adminLogout,
  adminPendingTags, adminApproveTag, adminDismissTag,
  adminGetVideos, adminEditVideo, adminDeleteVideo,
  adminGetLive, adminEditLive, adminDeleteLive
} from '../utils/api'
import { SUBJECTS, GRADES } from '../utils/helpers'
import { Spinner, useToast } from '../components/ui'
import { CheckIcon, CloseIcon, TagIcon, VideoIcon, AlertIcon, UserIcon, RadioIcon } from '../components/Icons'
import { LogoBrand } from '../components/Logo'

const fmtDate = s => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? s : d.toLocaleString('en-GB', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
const SECTIONS = [
  { id:'submissions', label:'Submissions' },
  { id:'tags', label:'Tag Suggestions' },
  { id:'reports', label:'Reports' },
  { id:'videos', label:'Edit Videos' },
  { id:'live', label:'Live Videos' },
]

function StatCard({ n, label, color='var(--t1)' }) {
  return (
    <div style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:12, padding:'16px 20px', textAlign:'center' }}>
      <div style={{ fontSize:24, fontWeight:900, lineHeight:1, color, letterSpacing:'-0.04em' }}>{n}</div>
      <div style={{ fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:5, fontWeight:700 }}>{label}</div>
    </div>
  )
}

function Sel({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{ background:'var(--s3)', border:'1px solid var(--b1)', borderRadius:7, color:'var(--t1)', fontSize:12, padding:'7px 10px', outline:'none', fontFamily:'inherit', cursor:'pointer', fontWeight:500 }}>
      {children}
    </select>
  )
}

function Inp({ value, onChange, placeholder, style={} }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder}
      style={{ background:'var(--s3)', border:'1px solid var(--b1)', borderRadius:7, color:'var(--t1)', fontSize:12, padding:'7px 10px', outline:'none', fontFamily:'inherit', width:'100%', ...style }}
      onFocus={e=>e.target.style.borderColor='var(--ac)'}
      onBlur={e=>e.target.style.borderColor='var(--b1)'} />
  )
}

function ABtn({ onClick, disabled, loading, variant='approve', children }) {
  const s = { approve:{bg:'rgba(34,197,94,0.1)',c:'var(--grn)',b:'1px solid rgba(34,197,94,0.2)'}, decline:{bg:'rgba(239,68,68,0.1)',c:'var(--red)',b:'1px solid rgba(239,68,68,0.2)'}, ghost:{bg:'var(--s2)',c:'var(--t2)',b:'1px solid var(--b1)'}, danger:{bg:'rgba(239,68,68,0.15)',c:'var(--red)',b:'1px solid rgba(239,68,68,0.3)'} }[variant]
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{ flex:variant==='danger'?undefined:1, padding:'9px 12px', borderRadius:8, border:s.b, background:s.bg, color:s.c, fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'opacity 0.13s', minWidth:variant==='danger'?36:undefined }}>
      {loading?<Spinner size={12}/>:children}
    </button>
  )
}

function VideoLink({ url, label='Open video' }) {
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:'var(--acl)', textDecoration:'none', padding:'4px 10px', borderRadius:6, border:'1px solid rgba(99,102,241,0.2)', background:'var(--acd)', fontWeight:600, transition:'background 0.13s' }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.18)'}
      onMouseLeave={e=>e.currentTarget.style.background='var(--acd)'}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      {label}
    </a>
  )
}

function SubCard({ s, onApprove, onDecline, busy }) {
  const typeC = { video:['rgba(99,102,241,0.12)','var(--acl)'], tute:['rgba(34,197,94,0.12)','#4ade80'], live:['rgba(239,68,68,0.12)','#fca5a5'] }[s.type]||['var(--s3)','var(--t3)']
  return (
    <div style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:13, padding:'18px 20px', marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'var(--t1)', marginBottom:8, lineHeight:1.35, letterSpacing:'-0.02em' }}>{s.title}</div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:5, background:typeC[0], color:typeC[1], textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.type}</span>
            <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, background:'var(--s3)', color:'var(--t3)', border:'1px solid var(--b1)', fontWeight:600 }}>{s.subject}</span>
            <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, background:'var(--s3)', color:'var(--t3)', border:'1px solid var(--b1)', fontWeight:600 }}>{s.grade}</span>
            <VideoLink url={s.url} label="Open submitted link" />
            {s.tute_url && <VideoLink url={s.tute_url} label="Open material" />}
          </div>
        </div>
        <div style={{ fontSize:10, color:'var(--t3)', flexShrink:0, textAlign:'right', fontWeight:500 }}>
          <div>{fmtDate(s.submitted_at)}</div>
          <div style={{ marginTop:3, color:'var(--t4)', fontWeight:600 }}>{s.platform}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px', marginBottom:14, fontSize:12 }}>
        {s.type==='live'&&s.date&&<div><div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Date & Time</div><div style={{ color:'var(--t2)', fontWeight:600 }}>{s.date} at {s.time}</div></div>}
        <div><div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Submitted by</div><div style={{ color:'var(--t2)', fontWeight:600 }}>{s.name||'Anonymous'}</div></div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <ABtn onClick={()=>onApprove(s.id)} loading={busy===s.id+'_approve'} variant="approve"><CheckIcon size={13}/> Approve</ABtn>
        <ABtn onClick={()=>onDecline(s.id,s.title)} loading={busy===s.id+'_decline'} variant="decline"><CloseIcon size={13}/> Decline</ABtn>
      </div>
    </div>
  )
}

function TagCard({ t, onApprove, onDismiss, busy }) {
  const [selSubj, setSelSubj] = useState(t.top_subject?.value||'')
  const [selGrade, setSelGrade] = useState(t.top_grade?.value||'')
  const [selTeacher, setSelTeacher] = useState(t.top_teacher?.value||'')
  return (
    <div style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:13, padding:'18px 20px', marginBottom:12 }}>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:800, color:'var(--t1)', marginBottom:6, lineHeight:1.35, letterSpacing:'-0.02em' }}>{t.video_title}</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:5 }}>
          <span style={{ fontSize:11, color:'var(--t3)', fontWeight:500 }}>Currently: <strong style={{ color:'var(--t2)' }}>{t.current_subject}</strong> · <strong style={{ color:'var(--t2)' }}>{t.current_grade}</strong></span>
          <span style={{ fontSize:9, background:'rgba(245,158,11,0.1)', color:'var(--amb)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:4, padding:'2px 7px', fontWeight:700 }}>{t.count} suggestion{t.count!==1?'s':''}</span>
          {t.video_url && <VideoLink url={t.video_url} label="Open video" />}
        </div>
      </div>
      <div style={{ background:'var(--s2)', borderRadius:10, padding:14, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--t2)', marginBottom:12, letterSpacing:'-0.01em' }}>Select what to apply from community suggestions:</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Subject {t.top_subject&&<span style={{ color:'var(--amb)' }}>({t.top_subject.votes})</span>}</div>
            <Sel value={selSubj} onChange={e=>setSelSubj(e.target.value)}>
              <option value="">No change</option>
              {Object.entries(t.all_subjects||{}).sort((a,b)=>b[1]-a[1]).map(([s,v])=><option key={s} value={s}>{s} ({v})</option>)}
              {SUBJECTS.filter(s=>!t.all_subjects?.[s]).map(s=><option key={s} value={s}>{s}</option>)}
            </Sel>
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Grade {t.top_grade&&<span style={{ color:'var(--amb)' }}>({t.top_grade.votes})</span>}</div>
            <Sel value={selGrade} onChange={e=>setSelGrade(e.target.value)}>
              <option value="">No change</option>
              {Object.entries(t.all_grades||{}).sort((a,b)=>b[1]-a[1]).map(([g,v])=><option key={g} value={g}>{g} ({v})</option>)}
              {GRADES.filter(g=>!t.all_grades?.[g]).map(g=><option key={g} value={g}>{g}</option>)}
            </Sel>
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Teacher {t.top_teacher&&<span style={{ color:'var(--amb)' }}>({t.top_teacher.votes})</span>}</div>
            <Sel value={selTeacher} onChange={e=>setSelTeacher(e.target.value)}>
              <option value="">No teacher tag</option>
              {Object.entries(t.all_teachers||{}).sort((a,b)=>b[1]-a[1]).map(([n,v])=><option key={n} value={n}>{n} ({v})</option>)}
            </Sel>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <ABtn onClick={()=>onApprove(t.id,selSubj,selGrade,selTeacher)} loading={busy===t.id+'_approve'} variant="approve"><CheckIcon size={13}/> Apply Tag</ABtn>
        <ABtn onClick={()=>onDismiss(t.id)} loading={busy===t.id+'_dismiss'} variant="decline"><CloseIcon size={13}/> Dismiss</ABtn>
      </div>
    </div>
  )
}

function ReportCard({ r, onFix, onDismiss, busy }) {
  const [selSubj, setSelSubj] = useState(r.suggested_subject||'')
  const [selGrade, setSelGrade] = useState(r.suggested_grade||'')
  return (
    <div style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:13, padding:'18px 20px', marginBottom:12 }}>
      <div style={{ marginBottom:10 }}>
        {r.video_title && <div style={{ fontSize:13, fontWeight:800, color:'var(--t1)', marginBottom:6, letterSpacing:'-0.02em' }}>{r.video_title}</div>}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--t3)', fontWeight:500 }}>Current: <strong style={{ color:'var(--t2)' }}>{r.current_subject}</strong> · <strong style={{ color:'var(--t2)' }}>{r.current_grade}</strong></span>
          <span style={{ fontSize:9, background:'rgba(245,158,11,0.1)', color:'var(--amb)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:4, padding:'2px 7px', fontWeight:700 }}>{r.count} report{r.count!==1?'s':''}</span>
          {r.video_url && <VideoLink url={r.video_url} label="Open video" />}
        </div>
        {r.issues?.length>0 && (
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
            {r.issues.map(i=><span key={i} style={{ fontSize:9, padding:'3px 8px', borderRadius:5, background:'var(--s3)', color:'var(--t3)', border:'1px solid var(--b1)', fontWeight:600 }}>{i.replace(/_/g,' ')}</span>)}
          </div>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div><div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:5 }}>Correct Subject</div><Sel value={selSubj} onChange={e=>setSelSubj(e.target.value)}><option value="">No change</option>{SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}</Sel></div>
        <div><div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:5 }}>Correct Grade</div><Sel value={selGrade} onChange={e=>setSelGrade(e.target.value)}><option value="">No change</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</Sel></div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <ABtn onClick={()=>onFix(r.id,selSubj,selGrade)} loading={busy===r.id+'_fix'} variant="approve"><CheckIcon size={13}/> Apply Fix</ABtn>
        <ABtn onClick={()=>onDismiss(r.id)} loading={busy===r.id+'_dismiss'} variant="ghost">Dismiss</ABtn>
      </div>
    </div>
  )
}

function VideoEditCard({ v, onSave, onDelete, busy }) {
  const [title, setTitle] = useState(v.t||'')
  const [subj, setSubj] = useState(v.s||'')
  const [grade, setGrade] = useState(v.g||'')
  const [desc, setDesc] = useState(v.description||v.desc||'')
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  async function handleSave() {
    await onSave(v.id, title, subj, grade, desc)
    setSaved(true); setTimeout(()=>setSaved(false), 2500)
  }

  return (
    <div style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:11, padding:'14px 16px', marginBottom:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {/* Source badge */}
        <span style={{ fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:4, textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0, background:v.source==='sheet'?'rgba(34,197,94,0.12)':'var(--s3)', color:v.source==='sheet'?'var(--grn)':'var(--t4)' }}>{v.source==='sheet'?'Sheet':'Base'}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.02em' }}>{v.t}</div>
          <div style={{ fontSize:10, color:'var(--t3)', marginTop:2, fontWeight:500 }}>{v.s||'Unknown'} · {v.g||'Unknown'}</div>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
          {v.u && <VideoLink url={v.u} label="Open" />}
          <button onClick={()=>setExpanded(!expanded)} style={{ padding:'6px 10px', borderRadius:7, border:'1px solid var(--b1)', background:'var(--s2)', color:'var(--t2)', fontSize:11, fontFamily:'inherit', cursor:'pointer', fontWeight:600 }}>
            {expanded?'Close':'Edit'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Title</div>
            <Inp value={title} onChange={e=>setTitle(e.target.value)} placeholder="Video title" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Subject</div>
              <Sel value={subj} onChange={e=>setSubj(e.target.value)}><option value="">Unknown</option>{SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}</Sel>
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Grade</div>
              <Sel value={grade} onChange={e=>setGrade(e.target.value)}><option value="">Unknown</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</Sel>
            </div>
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Description / Notes</div>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Add description or notes..." rows={2}
              style={{ background:'var(--s3)', border:'1px solid var(--b1)', borderRadius:7, color:'var(--t1)', fontSize:12, padding:'8px 10px', outline:'none', fontFamily:'inherit', width:'100%', resize:'vertical' }}
              onFocus={e=>e.target.style.borderColor='var(--ac)'}
              onBlur={e=>e.target.style.borderColor='var(--b1)'} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleSave} disabled={busy===v.id||saved}
              style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:saved?'rgba(34,197,94,0.15)':'var(--ac)', color:saved?'var(--grn)':'#fff', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              {busy===v.id?<Spinner size={12}/>:saved?<><CheckIcon size={12}/> Saved</>:'Save Changes'}
            </button>
            {!confirmDel
              ? <ABtn onClick={()=>setConfirmDel(true)} variant="danger"><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></ABtn>
              : <div style={{ display:'flex', gap:5 }}>
                  <button onClick={()=>onDelete(v.id)} style={{ padding:'8px 12px', borderRadius:7, border:'none', background:'var(--red)', color:'#fff', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer' }}>Confirm</button>
                  <button onClick={()=>setConfirmDel(false)} style={{ padding:'8px 12px', borderRadius:7, border:'1px solid var(--b1)', background:'var(--s2)', color:'var(--t2)', fontFamily:'inherit', fontSize:11, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', gap:12, textAlign:'center' }}>
      <div style={{ color:'var(--t3)', opacity:0.3 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:800, color:'var(--t2)', letterSpacing:'-0.03em' }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--t3)', maxWidth:260, lineHeight:1.6, fontWeight:500 }}>{sub}</div>
    </div>
  )
}


function LiveEditCard({ v, onSave, onDelete, busy }) {
  const [title, setTitle]   = useState(v.t||'')
  const [subj, setSubj]     = useState(v.s||'')
  const [grade, setGrade]   = useState(v.g||'')
  const [date, setDate]     = useState(v.date||'')
  const [time, setTime]     = useState(v.time||'')
  const [tute, setTute]     = useState(v.tute_url||'')
  const [expanded, setExp]  = useState(false)
  const [saved, setSaved]   = useState(false)

  async function handleSave() {
    await onSave(v.id, { title, subject: subj, grade, date, time, tute_url: tute })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const isPast = v.date && new Date(v.date) < new Date(new Date().setHours(0,0,0,0))

  return (
    <div style={{ background:'var(--s1)', border:`1px solid ${isPast?'rgba(245,158,11,0.2)':'var(--b1)'}`, borderRadius:11, padding:'14px 16px', marginBottom:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:4, textTransform:'uppercase', background:isPast?'rgba(245,158,11,0.12)':'rgba(239,68,68,0.12)', color:isPast?'var(--amb)':'#fca5a5', flexShrink:0 }}>
          {isPast ? 'EXPIRED' : 'LIVE'}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.t}</div>
          <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{v.date} {v.time} · {v.s} · {v.g}</div>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {v.u && <VideoLink url={v.u} label="Open" />}
          <button onClick={() => setExp(!expanded)} style={{ padding:'6px 10px', borderRadius:7, border:'1px solid var(--b1)', background:'var(--s2)', color:'var(--t2)', fontSize:11, fontFamily:'inherit', cursor:'pointer', fontWeight:600 }}>
            {expanded ? 'Close' : 'Edit'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:4 }}>Title</div>
            <Inp value={title} onChange={e=>setTitle(e.target.value)} placeholder="Class title" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:4 }}>Subject</div>
              <Sel value={subj} onChange={e=>setSubj(e.target.value)}><option value="">Unknown</option>{SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}</Sel>
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:4 }}>Grade</div>
              <Sel value={grade} onChange={e=>setGrade(e.target.value)}><option value="">Unknown</option>{GRADES.map(g=><option key={g} value={g}>{g}</option>)}</Sel>
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:4 }}>Date</div>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ background:'var(--s3)', border:'1px solid var(--b1)', borderRadius:7, color:'var(--t1)', fontSize:12, padding:'7px 10px', outline:'none', fontFamily:'inherit', width:'100%' }} />
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:4 }}>Time</div>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{ background:'var(--s3)', border:'1px solid var(--b1)', borderRadius:7, color:'var(--t1)', fontSize:12, padding:'7px 10px', outline:'none', fontFamily:'inherit', width:'100%' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:4 }}>Study Material URL</div>
            <Inp value={tute} onChange={e=>setTute(e.target.value)} placeholder="https://drive.google.com/..." />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleSave} disabled={busy===v.id||saved}
              style={{ flex:1, padding:9, borderRadius:8, border:'none', background:saved?'rgba(34,197,94,0.15)':'var(--ac)', color:saved?'var(--grn)':'#fff', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              {busy===v.id?<Spinner size={12}/>:saved?<><CheckIcon size={12}/> Saved</>:'Save Changes'}
            </button>
            {isPast && (
              <button onClick={() => onDelete(v.id, true)}
                style={{ padding:'9px 14px', borderRadius:8, border:'1px solid rgba(34,197,94,0.25)', background:'rgba(34,197,94,0.1)', color:'var(--grn)', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                Move to Videos
              </button>
            )}
            <button onClick={() => onDelete(v.id, false)}
              style={{ padding:'9px 12px', borderRadius:8, border:'1px solid rgba(239,68,68,0.25)', background:'rgba(239,68,68,0.1)', color:'var(--red)', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer' }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [pending, setPending] = useState([])
  const [tagsPending, setTagsPending] = useState([])
  const [reports, setReports] = useState([])
  const [videos, setVideos] = useState([])
  const [videoSearch, setVideoSearch] = useState('')
  const [section, setSection] = useState('submissions')
  const [busy, setBusy] = useState('')
  const { show, ToastContainer } = useToast()

  const loadAll = useCallback(async () => {
    try {
      const [sRes, pRes, tRes, rRes] = await Promise.all([adminStats(), adminPending(), adminPendingTags(), adminReports()])
      setStats(sRes.data)
      setPending(pRes.data.submissions)
      setTagsPending(tRes.data.tags)
      setReports(rRes.data.reports)
    } catch {}
    setLoading(false)
  }, [])

  async function loadVideos() {
    try {
      const res = await adminGetVideos()
      setVideos([...res.data.sheet, ...res.data.base])
    } catch {}
  }

  const [liveVideos, setLiveVideos] = useState([])
  async function loadLiveVideos() {
    try {
      const res = await adminGetLive()
      setLiveVideos(res.data.live || [])
    } catch {}
  }

  useEffect(() => {
    adminCheck().then(r => {
      if (!r.data.isAdmin) navigate('/ml-panel/login')
      else loadAll()
    }).catch(() => navigate('/ml-panel/login'))
  }, [navigate, loadAll])

  useEffect(() => {
    if (section==='videos' && videos.length===0) loadVideos()
    if (section==='live' && liveVideos.length===0) loadLiveVideos()
  }, [section])

  async function handleApprove(id) {
    setBusy(id+'_approve')
    try { await adminApprove(id); setPending(p=>p.filter(s=>s.id!==id)); show('Approved — video will appear on site'); loadAll() }
    catch { show('Failed to approve', false) }
    setBusy('')
  }
  async function handleDecline(id, title) {
    if (!confirm(`Permanently decline "${title}"?`)) return
    setBusy(id+'_decline')
    try { await adminDecline(id); setPending(p=>p.filter(s=>s.id!==id)); show('Declined and removed'); loadAll() }
    catch { show('Failed', false) }
    setBusy('')
  }
  async function handleApproveTag(id, subject, grade, teacher) {
    setBusy(id+'_approve')
    try { await adminApproveTag(id, { subject:subject||undefined, grade:grade||undefined, teacher:teacher||undefined }); setTagsPending(t=>t.filter(x=>x.id!==id)); show('Tag applied'); loadAll() }
    catch { show('Failed', false) }
    setBusy('')
  }
  async function handleDismissTag(id) {
    setBusy(id+'_dismiss')
    try { await adminDismissTag(id); setTagsPending(t=>t.filter(x=>x.id!==id)); show('Dismissed') }
    catch { show('Failed', false) }
    setBusy('')
  }
  async function handleFixReport(id, subject, grade) {
    setBusy(id+'_fix')
    try { await adminFixReport(id, { suggested_subject:subject, suggested_grade:grade }); setReports(r=>r.filter(x=>x.id!==id)); show('Fix applied') }
    catch { show('Failed', false) }
    setBusy('')
  }
  async function handleDismissReport(id) {
    setBusy(id+'_dismiss')
    try { await adminDismissReport(id); setReports(r=>r.filter(x=>x.id!==id)); show('Dismissed') }
    catch { show('Failed', false) }
    setBusy('')
  }
  async function handleLiveSave(id, data) {
    setBusy(id)
    try { await adminEditLive(id, data); show('Live video updated'); loadLiveVideos() }
    catch { show('Failed', false) }
    setBusy('')
  }

  async function handleLiveDelete(id, moveToVideos) {
    if (!confirm(moveToVideos ? 'Move this live class to videos section?' : 'Delete this live class permanently?')) return
    setBusy(id+'_del')
    try {
      await adminDeleteLive(id, { moveToVideos })
      setLiveVideos(v => v.filter(x => x.id !== id))
      show(moveToVideos ? 'Moved to videos!' : 'Deleted')
    } catch { show('Failed', false) }
    setBusy('')
  }

  async function handleVideoSave(id, title, subject, grade, description) {
    setBusy(id)
    try { await adminEditVideo(id, { title, subject, grade, description }); show('Video updated') }
    catch { show('Failed to update', false) }
    setBusy('')
  }
  async function handleVideoDelete(id) {
    setBusy(id+'_del')
    try {
      await adminDeleteVideo(id)
      setVideos(v=>v.filter(x=>String(x.id)!==String(id)))
      show('Video deleted')
    } catch { show('Delete failed', false) }
    setBusy('')
  }

  const filteredVideos = videos.filter(v => !videoSearch || (v.t||'').toLowerCase().includes(videoSearch.toLowerCase()))
  const badgeFor = id => ({ submissions:stats.pending, tags:stats.pendingTags, reports:stats.pendingReports })[id]||0

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <nav style={{ background:'rgba(9,9,15,0.96)', borderBottom:'1px solid var(--b1)', height:58, display:'flex', alignItems:'center', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(20px)' }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px', width:'100%', display:'flex', alignItems:'center', gap:12 }}>
          <a href="/" style={{ textDecoration:'none' }}>
            <LogoBrand size="sm" theme="dark" />
          </a>
          <div style={{ background:'var(--acd)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:6, padding:'2px 8px', fontSize:9, fontWeight:800, color:'var(--acl)', letterSpacing:'0.08em', textTransform:'uppercase', marginLeft:2 }}>Admin</div>
          <div style={{ display:'flex', gap:2, marginLeft:12 }}>
            {SECTIONS.map(s=>(
              <button key={s.id} onClick={()=>setSection(s.id)} style={{ padding:'8px 14px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, transition:'all 0.13s', background:section===s.id?'var(--acd)':'transparent', color:section===s.id?'var(--acl)':'var(--t3)', display:'flex', alignItems:'center', gap:6, letterSpacing:'-0.01em', position:'relative' }}>
                {s.label}
                {badgeFor(s.id)>0&&<span style={{ background:'var(--red)', color:'#fff', fontSize:9, fontWeight:800, padding:'1px 5px', borderRadius:4, minWidth:16, textAlign:'center' }}>{badgeFor(s.id)}</span>}
              </button>
            ))}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <a href="/" style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--b1)', color:'var(--t3)', fontSize:12, textDecoration:'none', fontWeight:700 }}>View Site</a>
            <button onClick={async()=>{await adminLogout();navigate('/ml-panel/login')}} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.08)', color:'var(--red)', fontSize:12, fontFamily:'inherit', fontWeight:700, cursor:'pointer' }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1300, margin:'0 auto', padding:'24px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px', color:'var(--t3)', gap:10, alignItems:'center' }}><Spinner /> Loading...</div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:24 }}>
              <StatCard n={stats.pending||0} label="Pending" color="var(--amb)" />
              <StatCard n={stats.approved||0} label="Approved" color="var(--grn)" />
              <StatCard n={stats.declined||0} label="Declined" color="var(--red)" />
              <StatCard n={stats.pendingTags||0} label="Tag Suggestions" color="var(--pur)" />
              <StatCard n={stats.pendingReports||0} label="Reports" color="var(--acl)" />
            </div>

            <div style={{ fontSize:11, fontWeight:800, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16, paddingBottom:12, borderBottom:'1px solid var(--b1)' }}>
              {SECTIONS.find(s=>s.id===section)?.label}
            </div>

            {section==='submissions' && (
              pending.length===0
                ? <EmptyState icon={<CheckIcon size={28}/>} title="No pending submissions" sub="All caught up!" />
                : pending.map(s=><SubCard key={s.id} s={s} onApprove={handleApprove} onDecline={handleDecline} busy={busy}/>)
            )}

            {section==='tags' && (
              tagsPending.length===0
                ? <EmptyState icon={<TagIcon size={28}/>} title="No pending tag suggestions" sub="Students haven't submitted any yet" />
                : tagsPending.map(t=><TagCard key={t.id} t={t} onApprove={handleApproveTag} onDismiss={handleDismissTag} busy={busy}/>)
            )}

            {section==='reports' && (
              reports.length===0
                ? <EmptyState icon={<CheckIcon size={28}/>} title="No pending reports" sub="No issues reported" />
                : reports.map(r=><ReportCard key={r.id} r={r} onFix={handleFixReport} onDismiss={handleDismissReport} busy={busy}/>)
            )}

            {section==='live' && (
              <div>
                <div style={{ fontSize:11, color:'var(--t3)', marginBottom:14, fontWeight:600 }}>
                  {liveVideos.length} live classes from Google Sheet · Expired ones auto-move to videos daily
                </div>
                {liveVideos.length === 0
                  ? <EmptyState icon={<RadioIcon size={28}/>} title="No live classes" sub="Submit live classes from the main site" />
                  : liveVideos.filter(v => v.t !== '[MOVED]' && v.t !== '[REMOVED]').map(v => (
                    <LiveEditCard key={v.id} v={v} onSave={handleLiveSave} onDelete={handleLiveDelete} busy={busy} />
                  ))
                }
              </div>
            )}

            {section==='videos' && (
              <div>
                <div style={{ marginBottom:14 }}>
                  <Inp value={videoSearch} onChange={e=>setVideoSearch(e.target.value)} placeholder="Search videos by title..." style={{ maxWidth:380 }} />
                </div>
                <div style={{ fontSize:11, color:'var(--t3)', marginBottom:14, fontWeight:600 }}>
                  Showing {Math.min(filteredVideos.length, filteredVideos.length)} of {videos.length} videos · Sheet videos first · Click Edit to expand
                </div>
                {filteredVideos.map(v=>(
                  <VideoEditCard key={v.id} v={v} onSave={handleVideoSave} onDelete={handleVideoDelete} busy={busy}/>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  )
}
