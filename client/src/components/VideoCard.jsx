import { useState } from 'react'
import { ytThumb, thumbBg, fmtDate, fmtViews, subjColor, platColor, isToday } from '../utils/helpers'
import { PlayIcon, EyeIcon, ExternalIcon } from './Icons'

const PLAT_LABEL = { YouTube:'YouTube', Zoom:'Zoom', Classroom:'Classroom', Drive:'Drive', Vimeo:'Vimeo', Other:'Other', Live:'Live' }
const SUBJ_SHORT = { 'Business Studies':'Business', 'Engineering Technology':'Eng.Tech', 'Science for Technology':'SFT', 'Combined Maths':'C.Maths', 'Agriculture':'Agri', 'Geography':'Geo' }
const shortSubj = s => SUBJ_SHORT[s] || s || '?'

export default function VideoCard({ video, isLive = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)
  const thumb = !isLive && video.yi ? ytThumb(video.yi) : null
  const bg = thumbBg(video.s)
  const views = fmtViews(video.views)
  const { bg: sBg, text: sText } = subjColor(video.s)

  const topTeacher = video.topTeacher ||
    (video.communityTags?.teachers
      ? Object.entries(video.communityTags.teachers).sort((a,b)=>b[1]-a[1])[0]?.[0]
      : null)

  const dateStr = isLive
    ? (isToday(video.date) ? `Today · ${video.time||''}` : fmtDate(video.date))
    : fmtDate(video.d)

  return (
    <div
      onClick={() => onClick(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={0} role="button"
      onKeyDown={e => (e.key==='Enter'||e.key===' ') && onClick(video)}
      style={{
        background:'var(--s1)',
        border:`1px solid ${hovered?'var(--ac)':'var(--b1)'}`,
        borderRadius:14, overflow:'hidden', cursor:'pointer',
        display:'flex', flexDirection:'column',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 10px 36px rgba(0,0,0,0.55), 0 0 0 1px var(--ac)' : '0 2px 8px rgba(0,0,0,0.2)',
        transition:'all 0.2s cubic-bezier(0.22,1,0.36,1)',
        outline:'none'
      }}
    >
      {/* Thumbnail */}
      <div style={{ aspectRatio:'16/9', position:'relative', overflow:'hidden', background:bg, flexShrink:0 }}>
        {thumb && !imgError ? (
          <img src={thumb} alt="" loading="lazy" onError={()=>setImgError(true)}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transform:hovered?'scale(1.06)':'scale(1)', transition:'transform 0.4s ease' }} />
        ) : (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.25)' }}>
              <PlayIcon size={16} />
            </div>
            <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              {isLive ? 'Live' : (video.p||'Video')}
            </span>
          </div>
        )}
        {/* Bottom gradient */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:40, background:'linear-gradient(transparent,rgba(0,0,0,0.65))', pointerEvents:'none' }} />
        {/* Platform badge */}
        <span style={{ position:'absolute', top:7, left:7, fontSize:9, fontWeight:800, letterSpacing:'0.05em', textTransform:'uppercase', padding:'3px 7px', borderRadius:5, background:isLive?'rgba(239,68,68,0.92)':'rgba(0,0,0,0.65)', color:'#fff', backdropFilter:'blur(4px)', border:isLive?'1px solid rgba(239,68,68,0.4)':'1px solid rgba(255,255,255,0.1)' }}>
          {isLive ? 'Live' : (PLAT_LABEL[video.p]||video.p)}
        </span>
        {/* Live pulse */}
        {isLive && <span style={{ position:'absolute', top:9, right:9, width:7, height:7, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 0 0 rgba(239,68,68,0.4)', animation:'livePulse 1.5s ease-in-out infinite', display:'block' }} />}
        {/* Live time */}
        {isLive && video.time && (
          <div style={{ position:'absolute', bottom:7, left:8, fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', gap:4 }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {isToday(video.date)?'Today':fmtDate(video.date)} · {video.time}
          </div>
        )}
        {/* View count */}
        {views && !isLive && (
          <div style={{ position:'absolute', bottom:7, right:7, display:'flex', alignItems:'center', gap:3, background:'rgba(0,0,0,0.72)', borderRadius:5, padding:'3px 7px', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <EyeIcon size={9} /><span style={{ fontSize:10, color:'rgba(255,255,255,0.85)', fontWeight:700 }}>{views}</span>
          </div>
        )}
        {/* Play hover */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:hovered?1:0, transition:'opacity 0.2s', background:'rgba(0,0,0,0.22)' }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--ac)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 8px rgba(99,102,241,0.18)' }}>
            <PlayIcon size={16} />
          </div>
        </div>
      </div>

      {/* Card body — better mobile spacing */}
      <div style={{ padding:'11px 13px 0', flex:1, display:'flex', flexDirection:'column', gap:6 }}>
        {/* Pills */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
          {video.s && video.s!=='Unknown' && (
            <span style={{ fontSize:9, fontWeight:800, padding:'3px 7px', borderRadius:5, background:sBg, color:sText, textTransform:'uppercase', letterSpacing:'0.05em', lineHeight:1.3 }}>
              {shortSubj(video.s)}
            </span>
          )}
          {video.g && video.g!=='Unknown' && (
            <span style={{ fontSize:9, fontWeight:600, padding:'3px 7px', borderRadius:5, background:'var(--s3)', color:'var(--t2)', border:'1px solid var(--b1)', lineHeight:1.3 }}>
              {video.g}
            </span>
          )}
          {topTeacher && (
            <span style={{ fontSize:9, fontWeight:500, padding:'3px 7px', borderRadius:5, background:'rgba(168,85,247,0.1)', color:'#c084fc', border:'1px solid rgba(168,85,247,0.15)', lineHeight:1.3 }}>
              {topTeacher}
            </span>
          )}
        </div>

        {/* Title — stronger, bigger, clean 2-line clamp */}
        <div style={{
          fontSize:13, fontWeight:700, color:'var(--t1)', lineHeight:1.5,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          overflow:'hidden', flex:1, letterSpacing:'-0.02em',
          wordBreak:'break-word'
        }}>
          {video.t}
        </div>

        {/* Date + external arrow */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:0 }}>
          <span style={{ fontSize:10, color:'var(--t3)', fontWeight:500, letterSpacing:'0.01em' }}>{dateStr}</span>
          <span style={{ opacity:hovered?1:0, transition:'opacity 0.2s', color:'var(--t3)' }}><ExternalIcon size={11}/></span>
        </div>
      </div>

      {/* Copyright footer */}
      <div style={{ padding:'8px 13px 11px', marginTop:6, borderTop:'1px solid var(--b1)' }}>
        <div style={{ fontSize:9, color:'var(--t4)', letterSpacing:'0.01em', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          &copy; {topTeacher||'Original Creator'} &middot; All rights reserved
        </div>
      </div>
    </div>
  )
}
