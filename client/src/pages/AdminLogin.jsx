import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../utils/api'
import { LogoMark } from '../components/Logo'

export default function AdminLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    if (!pw) return setError('Enter your password')
    setLoading(true); setError('')
    try {
      await adminLogin(pw)
      navigate('/ml-panel')
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect password')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: 18, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        {/* Top gradient bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)' }} />
        <div style={{ padding: '36px 32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <LogoMark size="md" />
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', textAlign: 'center', letterSpacing: '-0.04em' }}>
                Guru<span style={{ color: '#6366f1' }}>Sala</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginTop: 3, fontWeight: 500 }}>Admin Panel</div>
            </div>
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
            <input
              type="password" value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 10, color: 'var(--t1)', fontFamily: 'var(--font)', fontSize: 14, padding: '11px 14px', outline: 'none', width: '100%', transition: 'border-color 0.13s' }}
              onFocus={e => e.target.style.borderColor = 'var(--ac)'}
              onBlur={e => e.target.style.borderColor = 'var(--b1)'}
            />
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: '-0.02em', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && (
            <div style={{ color: '#fca5a5', fontSize: 12, textAlign: 'center', marginTop: 14, fontWeight: 600 }}>{error}</div>
          )}

          <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--t3)', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}>
            ← Back to GuruSala
          </a>
        </div>
      </div>
    </div>
  )
}
