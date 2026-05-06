import { useState, useEffect, useMemo } from 'react'
import VideoCard from '../components/VideoCard'
import VideoModal from '../components/VideoModal'
import SubmitModal from '../components/SubmitModal'
import { Loading } from '../components/ui'
import {
  SearchIcon, PlusIcon, VideoIcon, RadioIcon, FolderIcon,
  FileIcon, FilterIcon, RefreshIcon, ArrowRightIcon, ChevronIcon
} from '../components/Icons'
import { LogoBrand, LogoMark } from '../components/Logo'
import { getVideos, getMaterials, getLive, getNotice } from '../utils/api'
import { GRADE_ORDER, fmtDate } from '../utils/helpers'

const PER = 20

function getPagBtns(page, pages) {
  const s = new Set([1, pages, page])
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) s.add(i)
  return [...s].sort((a, b) => a - b)
}

// ── Welcome modal — once per session
function WelcomeModal({ onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(9,9,15,0.93)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeIn 0.2s ease' }}>
      <div style={{ background:'var(--s1)', border:'1px solid var(--b2)', borderRadius:20, width:'100%', maxWidth:520, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.8)', animation:'slideUp 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ height:4, background:'linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)' }} />
        <div style={{ padding:'28px 28px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
            <div style={{ width:48, height:48, borderRadius:13, background:'#0d0d1f', border:'1.5px solid #1e1b4b', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', flexShrink:0 }}>
              <span style={{ position:'absolute', fontFamily:"'Inter',sans-serif", fontSize:44, fontWeight:900, color:'#4338ca', opacity:0.22, right:-4, bottom:-8, lineHeight:1 }}>S</span>
              <span style={{ fontFamily:"'Noto Sans Sinhala','Iskoola Pota',serif", fontSize:28, fontWeight:700, position:'relative', zIndex:2, background:'linear-gradient(135deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>ගු</span>
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:'var(--t1)', letterSpacing:'-0.05em', lineHeight:1.1 }}>Welcome to <span style={{ color:'var(--acl)' }}>GuruSala</span></div>
              <div style={{ fontSize:12, color:'var(--t3)', marginTop:4, fontWeight:500 }}>ශ්‍රී ලාංකික සිසු දරුවන් සඳහා · Free for all Sri Lankan students</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:22 }}>
            {[
              { icon:'▶', title:'Free, no signup needed', desc:'Watch thousands of lessons instantly — no account, no payment, ever.' },
              { icon:'⌕', title:'Search and filter easily', desc:'Find lessons by subject, grade, or teacher name in Sinhala or English.' },
              { icon:'↓', title:'Some links may expire', desc:'External links (especially Zoom) can stop working. Download important videos.' },
              { icon:'⟳', title:'Community-powered tagging', desc:'Help us improve by tagging videos you know — subject, grade, teacher name.' },
            ].map((f,i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'11px 14px', background:'var(--s2)', borderRadius:11, border:'1px solid var(--b1)' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'var(--acd)', border:'1px solid rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:15 }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:'var(--t1)', marginBottom:2, letterSpacing:'-0.02em' }}>{f.title}</div>
                  <div style={{ fontSize:11, color:'var(--t3)', lineHeight:1.6, fontWeight:500 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ width:'100%', padding:14, borderRadius:12, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', letterSpacing:'-0.02em', fontFamily:'var(--font)', boxShadow:'0 6px 20px rgba(99,102,241,0.4)' }}>
            Start Learning &rarr;
          </button>
          <div style={{ textAlign:'center', marginTop:10, fontSize:11, color:'var(--t4)', fontWeight:500 }}>Shown once per session</div>
        </div>
      </div>
    </div>
  )
}

// ── YouTube preference banner
function YTBanner() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, marginBottom:14 }}>
      <div style={{ width:22, height:22, borderRadius:6, background:'rgba(255,0,0,0.12)', border:'1px solid rgba(255,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width={11} height={11} viewBox="0 0 24 24" fill="#ef4444"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
      </div>
      <span style={{ fontSize:12, color:'var(--t3)', fontWeight:500 }}>
        Always prefer <strong style={{ color:'var(--t2)', fontWeight:700 }}>YouTube videos</strong> — they never expire and have the best quality.
      </span>
    </div>
  )
}

function SelWrap({ value, onChange, minW=130, children }) {
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <select value={value} onChange={onChange} style={{
        background:'var(--s2)', border:'1px solid var(--b1)', borderRadius:9,
        color:value?'var(--t1)':'var(--t2)', fontSize:12, fontWeight:500,
        padding:'8px 30px 8px 11px', outline:'none', cursor:'pointer',
        appearance:'none', WebkitAppearance:'none', minWidth:minW,
        transition:'border-color 0.15s', fontFamily:'var(--font)'
      }}
        onFocus={e=>e.target.style.borderColor='var(--ac)'}
        onBlur={e=>e.target.style.borderColor='var(--b1)'}>
        {children}
      </select>
      <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--t3)' }}>
        <ChevronIcon size={11}/>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label, badge }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:13, fontWeight:600, transition:'all 0.15s', background:active?'var(--acg)':'transparent', color:active?'var(--acl)':'var(--t3)', letterSpacing:'-0.01em', position:'relative' }}>
      <span style={{ opacity:active?1:0.65 }}>{icon}</span>
      {label}
      {badge>0&&<span style={{ position:'absolute', top:5, right:5, width:7, height:7, borderRadius:'50%', background:'var(--red)', border:'1.5px solid var(--bg)' }}/>}
      {active&&<div style={{ position:'absolute', bottom:-1, left:'50%', transform:'translateX(-50%)', width:18, height:2, borderRadius:2, background:'var(--ac)' }}/>}
    </button>
  )
}

function PagBtn({ children, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ minWidth:34, height:34, padding:'0 8px', display:'inline-flex', alignItems:'center', justifyContent:'center', background:active?'var(--ac)':'var(--s2)', border:`1px solid ${active?'var(--ac)':'var(--b1)'}`, borderRadius:9, color:active?'#fff':'var(--t2)', fontSize:13, fontWeight:active?700:500, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.25:1, fontFamily:'var(--font)' }}>
      {children}
    </button>
  )
}

function EmptyVid({ title, subtitle }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', gap:12, textAlign:'center', gridColumn:'1/-1' }}>
      <div style={{ width:56, height:56, borderRadius:14, background:'var(--s2)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t4)' }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:'var(--t2)', letterSpacing:'-0.02em' }}>{title}</div>
      {subtitle&&<div style={{ fontSize:13, color:'var(--t3)', maxWidth:240, lineHeight:1.6 }}>{subtitle}</div>}
    </div>
  )
}

export default function Home() {
  const [videos, setVideos]     = useState([])
  const [materials, setMaterials] = useState([])
  const [live, setLive]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('videos')
  const [prevTab, setPrevTab]   = useState('videos')
  const [search, setSearch]     = useState('')
  const [fSubj, setFSubj]       = useState('')
  const [fGrade, setFGrade]     = useState('')
  const [fPlat, setFPlat]       = useState('')
  const [fSort, setFSort]       = useState('def')
  const [fMatType, setFMatType] = useState('')
  const [fLiveSubj, setFLiveSubj] = useState('')
  const [fLiveGrade, setFLiveGrade] = useState('')
  const [page, setPage]         = useState(1)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [selectedLive, setSelectedLive]   = useState(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem('gs_welcomed'))

  useEffect(() => {
    Promise.all([getVideos(), getMaterials(), getLive()])
      .then(([v, m, l]) => {
        setVideos(v.data.videos || [])
        setMaterials(m.data.materials || [])
        setLive(l.data.live || [])
      })
      .catch(e => console.error('Load error:', e))
      .finally(() => setLoading(false))
  }, [])

  const subjs = useMemo(() => [...new Set(videos.map(v=>v.s).filter(s=>s&&s!=='Unknown'))].sort(), [videos])
  const gradeOpts = GRADE_ORDER.filter(g => videos.some(v=>v.g===g))

  const filtered = useMemo(() => {
    let r = videos.filter(v => {
      if (search) {
        const words = search.toLowerCase().split(/\s+/).filter(Boolean)
        const teacherStr = v.topTeacher || ''
        const tagTeachers = v.communityTags?.teachers ? Object.keys(v.communityTags.teachers).join(' ') : ''
        const hay = `${v.t} ${v.s} ${v.g} ${teacherStr} ${tagTeachers}`.toLowerCase()
        if (!words.every(x => hay.includes(x))) return false
      }
      if (fSubj && v.s !== fSubj) return false
      if (fGrade && v.g !== fGrade) return false
      if (fPlat && v.p !== fPlat) return false
      return true
    })
    if (fSort === 'new')   r = [...r].sort((a,b) => new Date(b.d)-new Date(a.d))
    else if (fSort === 'old')   r = [...r].sort((a,b) => new Date(a.d)-new Date(b.d))
    else if (fSort === 'az')    r = [...r].sort((a,b) => (a.t||'').localeCompare(b.t||''))
    else if (fSort === 'za')    r = [...r].sort((a,b) => (b.t||'').localeCompare(a.t||''))
    else if (fSort === 'views') r = [...r].sort((a,b) => (b.views||0)-(a.views||0))
    // 'def' — preserve server order (YouTube first already)
    return r
  }, [videos, search, fSubj, fGrade, fPlat, fSort])

  const pages     = Math.max(1, Math.ceil(filtered.length / PER))
  const pageVideos = filtered.slice((page-1)*PER, page*PER)

  const filteredLive = useMemo(() => live.filter(v => {
    if (search) { const w=search.toLowerCase().split(/\s+/).filter(Boolean); if (!w.every(x=>`${v.t} ${v.s} ${v.g}`.toLowerCase().includes(x))) return false }
    if (fLiveSubj && v.s !== fLiveSubj) return false
    if (fLiveGrade && v.g !== fLiveGrade) return false
    return true
  }), [live, search, fLiveSubj, fLiveGrade])

  const filteredMats = useMemo(() => materials.filter(m => {
    if (search && !(m.t||'').toLowerCase().includes(search.toLowerCase())) return false
    if (fMatType && m.tp !== fMatType) return false
    return true
  }), [materials, search, fMatType])

  function goPage(p) { setPage(p); window.scrollTo({ top:0, behavior:'smooth' }) }
  function switchTab(t) {
    setPrevTab(tab)
    setTab(t)
    setPage(1)
    window.scrollTo({ top:0, behavior:'smooth' })
  }
  function resetFilters() { setFSubj(''); setFGrade(''); setFPlat(''); setFSort('def'); setSearch(''); setPage(1) }
  const hasFilters = fSubj || fGrade || fPlat || fSort !== 'def' || search

  const searchInput = (
    <div style={{ flex:1, position:'relative' }}>
      <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', pointerEvents:'none' }}>
        <SearchIcon size={15}/>
      </div>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search videos, subjects, teachers..."
        autoComplete="off"
        style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--b1)', borderRadius:11, padding:'10px 14px 10px 40px', fontSize:13, color:'var(--t1)', outline:'none', transition:'all 0.15s', fontFamily:'var(--font)', letterSpacing:'-0.01em' }}
        onFocus={e => { e.target.style.borderColor='var(--ac)'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)' }}
        onBlur={e => { e.target.style.borderColor='var(--b1)'; e.target.style.boxShadow='none' }}
      />
      {search && (
        <button onClick={() => { setSearch(''); setPage(1) }} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', padding:4, display:'flex', borderRadius:4 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh' }}>
      {showWelcome && <WelcomeModal onClose={() => { setShowWelcome(false); sessionStorage.setItem('gs_welcomed','1') }} />}

      {/* ─── DESKTOP NAV ─── */}
      <nav style={{ position:'sticky', top:0, zIndex:200, background:'rgba(9,9,15,0.96)', backdropFilter:'blur(24px)', borderBottom:'1px solid var(--b1)' }}>
        <div style={{ maxWidth:1500, margin:'0 auto', padding:'0 24px', height:62, display:'flex', alignItems:'center', gap:16 }}>
          <a href="/" className="desktop-logo" style={{ textDecoration:'none', flexShrink:0 }}>
            <LogoBrand size="sm" theme="dark"/>
          </a>
          <div className="desktop-nav-tabs" style={{ display:'flex', gap:2, marginLeft:8, position:'relative' }}>
            <TabBtn active={tab==='videos'} onClick={()=>switchTab('videos')} icon={<VideoIcon size={14}/>} label="Videos"/>
            <TabBtn active={tab==='live'} onClick={()=>switchTab('live')} icon={<RadioIcon size={14}/>} label="Live" badge={live.length}/>
            <TabBtn active={tab==='materials'} onClick={()=>switchTab('materials')} icon={<FolderIcon size={14}/>} label="Materials"/>
          </div>
          <div className="desktop-nav-tabs" style={{ flex:1, maxWidth:440, marginLeft:'auto' }}>{searchInput}</div>
          <button className="desktop-submit-btn" onClick={()=>setShowSubmit(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'var(--ac)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s', flexShrink:0, boxShadow:'0 4px 14px rgba(99,102,241,0.3)', fontFamily:'var(--font)', letterSpacing:'-0.01em' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#5558e8';e.currentTarget.style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='var(--ac)';e.currentTarget.style.transform='none'}}>
            <PlusIcon size={14}/><span>Submit</span>
          </button>
        </div>
      </nav>

      {/* ─── MOBILE TOP BAR ─── */}
      <div className="mobile-top-bar" style={{ display:'none', position:'sticky', top:0, zIndex:200, background:'rgba(9,9,15,0.96)', backdropFilter:'blur(24px)', borderBottom:'1px solid var(--b1)' }}>
        <a href="/" style={{ textDecoration:'none', flexShrink:0 }}>
          <LogoMark size="sm" />
        </a>
        <div className="search-wrap" style={{ flex:1, position:'relative' }}>
          <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'var(--t3)', pointerEvents:'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search videos, subjects..."
            autoComplete="off"
            style={{ width:'100%', height:38, background:'var(--s2)', border:'1px solid var(--b1)', borderRadius:10, padding:'0 36px 0 38px', fontSize:14, color:'var(--t1)', outline:'none', fontFamily:'var(--font)' }}
            onFocus={e => { e.target.style.borderColor='var(--ac)' }}
            onBlur={e => { e.target.style.borderColor='var(--b1)' }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', padding:4, display:'flex', borderRadius:4 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* ─── HERO — show when on videos tab page 1 OR just switched to videos ─── */}
      {(tab === 'videos' && page === 1) && <div style={{ background:'linear-gradient(180deg,var(--s1) 0%,var(--bg) 100%)', borderBottom:'1px solid var(--b1)', padding:'20px 24px 16px' }}>
        <div style={{ maxWidth:1500, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:'clamp(18px,2.2vw,26px)', fontWeight:900, letterSpacing:'-0.05em', color:'var(--t1)', lineHeight:1.2 }}>
              Free Learning for{' '}
              <span style={{ background:'linear-gradient(135deg,var(--acl) 0%,#a78bfa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Sri Lanka</span>
            </h1>
            <p style={{ fontSize:12, color:'var(--t3)', marginTop:5, fontWeight:500, letterSpacing:'0.01em' }}>No signup &middot; No cost &middot; Works on any device</p>
          </div>
          <div style={{ display:'flex', gap:0, borderRadius:13, overflow:'hidden', border:'1px solid var(--b1)', background:'var(--s1)' }}>
            {[
              { n:loading?'—':videos.length.toLocaleString(), l:'Videos' },
              { n:loading?'—':subjs.length, l:'Subjects' },
              { n:'Free', l:'Always', c:'var(--grn)' }
            ].map((s,i) => (
              <div key={i} style={{ padding:'10px 20px', textAlign:'center', borderRight:i<2?'1px solid var(--b1)':'none' }}>
                <div style={{ fontSize:20, fontWeight:900, color:s.c||'var(--t1)', lineHeight:1, letterSpacing:'-0.04em' }}>{s.n}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* ─── MAIN ─── */}
      <div style={{ maxWidth:1500, margin:'0 auto', padding:'0 24px' }}>

        {/* VIDEOS */}
        {tab === 'videos' && (
          <div style={{ padding:'20px 0 60px' }} className="mob-pad">
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:14, padding:'12px 14px', background:'var(--s1)', borderRadius:12, border:'1px solid var(--b1)' }}>
              <span style={{ color:'var(--t3)' }}><FilterIcon size={13}/></span>
              <SelWrap value={fSubj} onChange={e=>{setFSubj(e.target.value);setPage(1)}} minW={140}>
                <option value="">All Subjects</option>
                {subjs.map(s=><option key={s} value={s}>{s}</option>)}
              </SelWrap>
              <SelWrap value={fGrade} onChange={e=>{setFGrade(e.target.value);setPage(1)}} minW={118}>
                <option value="">All Grades</option>
                {gradeOpts.map(g=><option key={g} value={g}>{g}</option>)}
              </SelWrap>
              <SelWrap value={fPlat} onChange={e=>{setFPlat(e.target.value);setPage(1)}} minW={128}>
                <option value="">All Platforms</option>
                {['YouTube','Zoom','Classroom'].map(p=><option key={p} value={p}>{p}</option>)}
              </SelWrap>
              <SelWrap value={fSort} onChange={e=>setFSort(e.target.value)} minW={140}>
                <option value="def">Default</option>
                <option value="views">Most Viewed</option>
                <option value="new">Newest First</option>
                <option value="old">Oldest First</option>
                <option value="az">A to Z</option>
                <option value="za">Z to A</option>
              </SelWrap>
              {hasFilters && (
                <button onClick={resetFilters} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:9, border:'1px solid var(--b1)', background:'transparent', color:'var(--t3)', fontSize:12, cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.13s', fontWeight:500 }}
                  onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'}}
                  onMouseLeave={e=>{e.currentTarget.style.color='var(--t3)';e.currentTarget.style.borderColor='var(--b1)'}}>
                  <RefreshIcon size={12}/> Reset
                </button>
              )}
              <span style={{ marginLeft:'auto', fontSize:12, color:'var(--t3)', whiteSpace:'nowrap', fontWeight:500 }}>
                <strong style={{ color:'var(--t2)', fontWeight:700 }}>{filtered.length.toLocaleString()}</strong> videos
              </span>
            </div>

            <YTBanner/>

            {loading ? <Loading text="Loading videos..."/> : (
              <>
                <div className="vgrid">
                  {pageVideos.length === 0
                    ? <EmptyVid title="No videos found" subtitle="Try different filters or search terms"/>
                    : pageVideos.map(v => <VideoCard key={v.id} video={v} onClick={setSelectedVideo}/>)
                  }
                </div>
                {pages > 1 && (
                  <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:28, flexWrap:'wrap' }}>
                    <PagBtn disabled={page===1} onClick={()=>goPage(page-1)}>&larr;</PagBtn>
                    {getPagBtns(page,pages).map((p,i,arr) => (
                      <span key={p} style={{ display:'contents' }}>
                        {arr[i-1]&&p-arr[i-1]>1&&<PagBtn disabled>&hellip;</PagBtn>}
                        <PagBtn active={p===page} onClick={()=>goPage(p)}>{p}</PagBtn>
                      </span>
                    ))}
                    <PagBtn disabled={page===pages} onClick={()=>goPage(page+1)}>&rarr;</PagBtn>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* LIVE */}
        {tab === 'live' && (
          <div style={{ padding:'20px 0 60px' }} className="mob-pad">
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18, padding:'16px 20px', background:'linear-gradient(135deg,rgba(239,68,68,0.05),rgba(239,68,68,0.02))', border:'1px solid rgba(239,68,68,0.12)', borderRadius:14 }}>
              <div style={{ width:42, height:42, borderRadius:11, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red)', flexShrink:0 }}>
                <RadioIcon size={18}/>
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                  <span style={{ fontSize:15, fontWeight:800, color:'var(--t1)', letterSpacing:'-0.03em' }}>Live Classes</span>
                  <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, padding:'3px 8px' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--red)', animation:'livePulse 1.5s ease-in-out infinite', display:'inline-block' }}/>
                    <span style={{ fontSize:9, fontWeight:800, color:'#fca5a5', letterSpacing:'0.08em', textTransform:'uppercase' }}>Live</span>
                  </div>
                </div>
                <p style={{ fontSize:12, color:'var(--t3)', fontWeight:500 }}>Upcoming and ongoing classes submitted by the community</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
              <SelWrap value={fLiveSubj} onChange={e=>setFLiveSubj(e.target.value)} minW={140}><option value="">All Subjects</option>{subjs.map(s=><option key={s} value={s}>{s}</option>)}</SelWrap>
              <SelWrap value={fLiveGrade} onChange={e=>setFLiveGrade(e.target.value)} minW={118}><option value="">All Grades</option>{GRADE_ORDER.map(g=><option key={g} value={g}>{g}</option>)}</SelWrap>
              <span style={{ fontSize:12, color:'var(--t3)', marginLeft:'auto', alignSelf:'center', fontWeight:500 }}><strong style={{ color:'var(--t2)', fontWeight:700 }}>{filteredLive.length}</strong> classes</span>
            </div>
            <div className="vgrid">
              {filteredLive.length === 0
                ? <EmptyVid title="No live classes yet" subtitle="Submit a live class link using the Submit button"/>
                : filteredLive.map(v=><VideoCard key={v.id} video={v} isLive onClick={setSelectedLive}/>)
              }
            </div>
          </div>
        )}

        {/* MATERIALS */}
        {tab === 'materials' && (
          <div style={{ padding:'20px 0 60px' }} className="mob-pad">
            <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
              <SelWrap value={fMatType} onChange={e=>setFMatType(e.target.value)} minW={130}><option value="">All Types</option><option value="folder">Folders</option><option value="file">Files</option></SelWrap>
              <span style={{ fontSize:12, color:'var(--t3)', marginLeft:'auto', fontWeight:500 }}><strong style={{ color:'var(--t2)', fontWeight:700 }}>{filteredMats.length}</strong> items</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
              {filteredMats.length === 0
                ? <EmptyVid title="Nothing found"/>
                : filteredMats.map((m,i) => (
                    <a key={i} href={m.u} target="_blank" rel="noopener noreferrer"
                      style={{ background:'var(--s1)', border:'1px solid var(--b1)', borderRadius:13, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, textDecoration:'none', transition:'all 0.2s' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.background='var(--s2)';e.currentTarget.style.transform='translateY(-2px)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b1)';e.currentTarget.style.background='var(--s1)';e.currentTarget.style.transform='none'}}>
                      <div style={{ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:m.tp==='folder'?'rgba(245,158,11,0.08)':'rgba(99,102,241,0.08)', border:`1px solid ${m.tp==='folder'?'rgba(245,158,11,0.15)':'rgba(99,102,241,0.15)'}`, color:m.tp==='folder'?'var(--amb)':'var(--acl)' }}>
                        {m.tp==='folder'?<FolderIcon size={16}/>:<FileIcon size={16}/>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.02em' }}>{m.t}</div>
                        <div style={{ fontSize:11, color:'var(--t3)', marginTop:3, fontWeight:500 }}>{fmtDate(m.d)} &middot; Google Drive {m.tp}</div>
                      </div>
                      <div style={{ color:'var(--t3)', flexShrink:0 }}><ArrowRightIcon size={14}/></div>
                    </a>
                  ))
              }
            </div>
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop:'1px solid var(--b1)', background:'var(--s1)', padding:'28px 24px 32px' }}>
        <div style={{ maxWidth:1500, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24, flexWrap:'wrap', marginBottom:24 }}>
            <div>
              <LogoBrand size="sm" theme="dark"/>
              <p style={{ fontSize:12, color:'var(--t3)', marginTop:12, maxWidth:280, lineHeight:1.7, fontWeight:500 }}>
                A free educational video platform for Sri Lanka students. No signup, no cost — always free.
              </p>
            </div>
            <div style={{ display:'flex', gap:40, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Platform</div>
                {[
                  { label:'Videos', action:()=>setTab('videos') },
                  { label:'Live Classes', action:()=>setTab('live') },
                  { label:'Study Materials', action:()=>setTab('materials') },
                  { label:'Submit a Link', action:()=>setShowSubmit(true) },
                ].map(l => (
                  <div key={l.label} style={{ marginBottom:8 }}>
                    <button onClick={l.action} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--t3)', fontFamily:'var(--font)', fontWeight:500, padding:0, transition:'color 0.13s' }}
                      onMouseEnter={e=>e.currentTarget.style.color='var(--t2)'}
                      onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                      {l.label}
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Contact</div>
                <a href="https://t.me/caxxzer" target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:13, color:'var(--t3)', fontWeight:500, transition:'color 0.13s', textDecoration:'none' }}
                  onMouseEnter={e=>e.currentTarget.style.color='#29b6f6'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" style={{ color:'#29b6f6', flexShrink:0 }}>
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z"/>
                  </svg>
                  @caxxzer
                </a>
                <div style={{ marginTop:8, fontSize:11, color:'var(--t4)', fontWeight:500 }}>Caxx Zer</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop:'1px solid var(--b1)', paddingTop:20, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ fontSize:12, color:'var(--t4)', fontWeight:500 }}>
              &copy; {new Date().getFullYear()} GuruSala &middot; Built by{' '}
              <a href="https://t.me/caxxzer" target="_blank" rel="noopener noreferrer"
                style={{ color:'var(--t3)', fontWeight:700, textDecoration:'none', transition:'color 0.13s' }}
                onMouseEnter={e=>e.currentTarget.style.color='#29b6f6'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                Caxx Zer
              </a>
            </div>
            <div style={{ fontSize:11, color:'var(--t4)', fontWeight:500, textAlign:'right' }}>
              All video content belongs to their respective creators. GuruSala links to external content only.
            </div>
          </div>
        </div>
      </footer>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <div className="mob-nav" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, zIndex:200, background:'rgba(9,9,15,0.98)', borderTop:'1px solid var(--b1)', backdropFilter:'blur(24px)', paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
        <div style={{ display:'flex', justifyContent:'space-around', maxWidth:480, margin:'0 auto', padding:'6px 8px 10px' }}>
          {[
            { id:'videos', label:'Videos', icon:<VideoIcon size={20}/> },
            { id:'live',   label:'Live',   icon:<RadioIcon size={20}/> },
            { id:'materials', label:'Study', icon:<FolderIcon size={20}/> },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={()=>setTab(id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1, border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:10, fontWeight:700, padding:'8px 4px', borderRadius:12, transition:'all 0.15s', letterSpacing:'0.01em', background:'none', color:tab===id?'var(--acl)':'var(--t3)', position:'relative' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:tab===id?'var(--acd)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', border:tab===id?'1px solid rgba(99,102,241,0.2)':'1px solid transparent' }}>
                {icon}
              </div>
              {label}
            </button>
          ))}
          <button onClick={()=>setShowSubmit(true)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1, border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:10, fontWeight:700, padding:'8px 4px', borderRadius:12, background:'none', color:'var(--t3)', letterSpacing:'0.01em' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--ac)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(99,102,241,0.4)' }}>
              <PlusIcon size={20}/>
            </div>
            Submit
          </button>
        </div>
      </div>

      <VideoModal video={selectedVideo} materials={materials} onClose={()=>setSelectedVideo(null)}/>
      <VideoModal video={selectedLive} isLive materials={materials} onClose={()=>setSelectedLive(null)}/>
      <SubmitModal open={showSubmit} onClose={()=>setShowSubmit(false)}/>
    </div>
  )
}
