export function LogoMark({ size = 'sm' }) {
  const d = {
    sm:  { box: 34,  radius: 9,  ghost: 42,  main: 22, gR: -5,  gB: -7,  ghostOp: 0.35 },
    md:  { box: 48,  radius: 13, ghost: 58,  main: 30, gR: -7,  gB: -10, ghostOp: 0.35 },
    lg:  { box: 110, radius: 26, ghost: 118, main: 60, gR: -10, gB: -16, ghostOp: 0.35 },
  }[size] || { box: 34, radius: 9, ghost: 42, main: 22, gR: -5, gB: -7, ghostOp: 0.35 }

  return (
    <div style={{
      width: d.box, height: d.box, borderRadius: d.radius,
      background: '#0d0d1f',
      border: '1.5px solid #2d2d5e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 2px 12px rgba(99,102,241,0.2)'
    }}>
      {/* Ghost S — more visible */}
      <span style={{
        position: 'absolute',
        fontFamily: "'Inter','Helvetica Neue',sans-serif",
        fontSize: d.ghost, fontWeight: 900,
        color: '#6366f1', opacity: d.ghostOp,
        right: d.gR, bottom: d.gB,
        lineHeight: 1, userSelect: 'none', pointerEvents: 'none'
      }}>S</span>
      {/* ගු — stronger, darker gradient */}
      <span style={{
        fontFamily: "'Noto Sans Sinhala','Iskoola Pota',serif",
        fontSize: d.main, fontWeight: 700,
        position: 'relative', zIndex: 2,
        lineHeight: 1, paddingBottom: 2,
        background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 8px rgba(165,180,252,0.4))'
      }}>ගු</span>
    </div>
  )
}

export function LogoBrand({ size = 'sm', theme = 'dark' }) {
  const cfg = {
    sm: { nameSize: 15, bySize: 9,  gap: 9  },
    md: { nameSize: 18, bySize: 10, gap: 10 },
    lg: { nameSize: 22, bySize: 11, gap: 12 },
  }[size] || { nameSize: 15, bySize: 9, gap: 9 }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: cfg.gap }}>
      <LogoMark size={size} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{
          fontFamily: "'Inter',sans-serif",
          fontSize: cfg.nameSize, fontWeight: 900,
          letterSpacing: '-0.04em', lineHeight: 1,
          color: theme === 'dark' ? '#f4f4fb' : '#09090f'
        }}>
          Guru<span style={{ color: '#818cf8' }}>Sala</span>
        </div>
        <div style={{ fontSize: cfg.bySize, fontWeight: 500, color: '#4b5563', letterSpacing: '0.03em' }}>
          by Caxx Zer
        </div>
      </div>
    </div>
  )
}
