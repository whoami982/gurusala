// GuruSala Logo — ගු over ghost S
// LogoMark: icon only  |  LogoBrand: icon + wordmark

export function LogoMark({ size = 'sm' }) {
  const d = {
    sm:  { box: 34,  radius: 9,  ghost: 36,  main: 20, gR: -4,  gB: -5  },
    md:  { box: 48,  radius: 13, ghost: 52,  main: 28, gR: -6,  gB: -9  },
    lg:  { box: 110, radius: 26, ghost: 100, main: 56, gR: -8,  gB: -14 },
  }[size] || { box: 34, radius: 9, ghost: 36, main: 20, gR: -4, gB: -5 }

  return (
    <div style={{
      width: d.box, height: d.box, borderRadius: d.radius,
      background: '#0d0d1f', border: '1.5px solid #1e1b4b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0
    }}>
      <span style={{
        position: 'absolute',
        fontFamily: "'Inter','Helvetica Neue',sans-serif",
        fontSize: d.ghost, fontWeight: 900,
        color: '#4338ca', opacity: 0.22,
        right: d.gR, bottom: d.gB,
        lineHeight: 1, userSelect: 'none', pointerEvents: 'none'
      }}>S</span>
      <span style={{
        fontFamily: "'Noto Sans Sinhala','Iskoola Pota',serif",
        fontSize: d.main, fontWeight: 700,
        position: 'relative', zIndex: 2,
        lineHeight: 1, paddingBottom: 2,
        background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
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
          Guru<span style={{ color: '#6366f1' }}>Sala</span>
        </div>
        <div style={{ fontSize: cfg.bySize, fontWeight: 500, color: '#4b5563', letterSpacing: '0.03em' }}>
          by Caxx Zer
        </div>
      </div>
    </div>
  )
}
