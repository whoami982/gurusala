import { useState, useEffect } from 'react'
import { subjColor, shortSubj, platColor } from '../utils/helpers'

export function Spinner({ size = 18 }) {
  return <span style={{ display:'inline-block', width:size, height:size, border:'2px solid var(--b2)', borderTopColor:'var(--ac)', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }} />
}

export function Loading({ text = 'Loading...' }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 20px', gap:10, color:'var(--t3)', fontSize:13 }}><Spinner /> {text}</div>
}

export function Empty({ icon = null, title, subtitle }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', gap:10, textAlign:'center', gridColumn:'1/-1' }}>
      {icon && <span style={{ opacity:0.2, color:'var(--t3)' }}>{icon}</span>}
      <div style={{ fontSize:14, fontWeight:600, color:'var(--t2)' }}>{title}</div>
      {subtitle && <div style={{ fontSize:12, color:'var(--t3)', maxWidth:220 }}>{subtitle}</div>}
    </div>
  )
}

export function Modal({ open, onClose, children, maxWidth = 640 }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  if (!open) return null

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(14,14,18,0.88)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:12, animation:'fadeIn 0.15s ease' }}>
      <div style={{ background:'var(--s1)', border:'1px solid var(--b2)', borderRadius:16, width:'100%', maxWidth, maxHeight:'92vh', overflowY:'auto', overflowX:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.7)', animation:'slideUp 0.2s cubic-bezier(0.22,1,0.36,1)', scrollbarWidth:'thin', scrollbarColor:'var(--b1) transparent' }}>
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'14px 16px 12px', borderBottom:'1px solid var(--b1)', position:'sticky', top:0, background:'var(--s1)', zIndex:10 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--t1)', lineHeight:1.4 }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--s2)', border:'1px solid var(--b1)', borderRadius:6, color:'var(--t2)', fontSize:14, cursor:'pointer', flexShrink:0, fontFamily:'var(--font)' }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.12)'; e.currentTarget.style.color='var(--red)' }}
        onMouseLeave={e => { e.currentTarget.style.background='var(--s2)'; e.currentTarget.style.color='var(--t2)' }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    </div>
  )
}

export function SubjBadge({ subject, style: ex = {} }) {
  const { bg, text } = subjColor(subject)
  return <span style={{ fontSize:8, fontWeight:700, padding:'2px 5px', borderRadius:4, letterSpacing:'0.04em', textTransform:'uppercase', background:bg, color:text, flexShrink:0, ...ex }}>{shortSubj(subject)}</span>
}

export function GradeBadge({ grade, style: ex = {} }) {
  if (!grade || grade === 'Unknown') return null
  return <span style={{ fontSize:8, padding:'2px 5px', borderRadius:4, fontWeight:500, background:'var(--s3)', color:'var(--t3)', border:'1px solid var(--b1)', flexShrink:0, ...ex }}>{grade}</span>
}

export function PlatBadge({ platform, style: ex = {} }) {
  const { bg, text } = platColor(platform)
  const L = { YouTube:'YouTube', Bunny:'Bunny', Zoom:'Zoom', Classroom:'Class', Drive:'Drive', Vimeo:'Vimeo', Other:'Other', Live:'LIVE' }
  return <span style={{ fontSize:8, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', padding:'2px 6px', borderRadius:4, background:bg, color:text, ...ex }}>{L[platform] || platform}</span>
}

export function FormField({ label, required, hint, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
      <label style={{ fontSize:10, fontWeight:700, color:'var(--t2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
        {label} {required && <span style={{ color:'var(--red)' }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize:10, color:'var(--t3)', lineHeight:1.5 }}>{hint}</div>}
    </div>
  )
}

const IB = { background:'var(--s2)', border:'1px solid var(--b1)', borderRadius:8, color:'var(--t1)', fontFamily:'var(--font)', fontSize:13, padding:'9px 11px', outline:'none', width:'100%', transition:'border-color 0.13s' }

export function Input({ style: ex = {}, ...props }) {
  return <input style={{ ...IB, ...ex }}
    onFocus={e => { e.target.style.borderColor='var(--ac)'; e.target.style.boxShadow='0 0 0 2px rgba(99,102,241,0.08)' }}
    onBlur={e => { e.target.style.borderColor='var(--b1)'; e.target.style.boxShadow='none' }}
    {...props} />
}

export function Select({ children, style: ex = {}, ...props }) {
  return (
    <select style={{ ...IB, appearance:'none', WebkitAppearance:'none', cursor:'pointer', paddingRight:28, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2355556a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 8px center', ...ex }}
      onFocus={e => e.target.style.borderColor='var(--ac)'}
      onBlur={e => e.target.style.borderColor='var(--b1)'}
      {...props}>
      {children}
    </select>
  )
}

export function Button({ children, variant='primary', style: ex={}, loading=false, ...props }) {
  const V = {
    primary: { background:'var(--ac)', color:'#fff', border:'none', boxShadow:'0 4px 14px rgba(99,102,241,0.3)' },
    danger:  { background:'rgba(239,68,68,0.12)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.25)' },
    ghost:   { background:'var(--s2)', color:'var(--t2)', border:'1px solid var(--b1)' },
    success: { background:'rgba(34,197,94,0.12)', color:'var(--grn)', border:'1px solid rgba(34,197,94,0.25)' },
  }
  return (
    <button style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 20px', borderRadius:8, fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:props.disabled?'not-allowed':'pointer', transition:'opacity 0.13s', opacity:props.disabled?0.5:1, ...V[variant], ...ex }} {...props}>
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState([])
  const show = (msg, ok=true) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, ok }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }
  const ToastContainer = () => (
    <div style={{ position:'fixed', bottom:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ padding:'10px 16px', borderRadius:8, fontSize:12, fontWeight:600, animation:'slideUp 0.2s ease', background:t.ok?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)', border:`1px solid ${t.ok?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, color:t.ok?'var(--grn)':'var(--red)', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>{t.msg}</div>
      ))}
    </div>
  )
  return { show, ToastContainer }
}
