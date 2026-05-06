export const SUBJECTS = ['Physics','Chemistry','Biology','Maths','Combined Maths','ICT','English','Sinhala','Tamil','History','Science','Commerce','Business Studies','Accounting','Economics','Buddhism','Agriculture','Geography','Engineering Technology','Science for Technology','Other']
export const GRADES = ['A/L','O/L','Grade 10','Grade 9','Grade 8','Grade 7','Grade 6','Grade 5']
export const GRADE_ORDER = ['A/L','O/L','Grade 10','Grade 9','Grade 8','Grade 7','Grade 6','Grade 5','Unknown']

export const SUBJ_SHORT = {
  'Business Studies': 'Business', 'Engineering Technology': 'Eng.Tech',
  'Science for Technology': 'SFT', 'Combined Maths': 'C.Maths'
}

export const SUBJ_COLORS = {
  Physics:    { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc' },
  Chemistry:  { bg: 'rgba(34,197,94,0.13)',   text: '#4ade80' },
  Biology:    { bg: 'rgba(249,115,22,0.13)',  text: '#fb923c' },
  Maths:      { bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd' },
  'Combined Maths': { bg: 'rgba(109,40,217,0.15)', text: '#a78bfa' },
  ICT:        { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6' },
  English:    { bg: 'rgba(20,184,166,0.12)',  text: '#2dd4bf' },
  Sinhala:    { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  Tamil:      { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  History:    { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc' },
  Science:    { bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
  Commerce:   { bg: 'rgba(234,179,8,0.12)',   text: '#facc15' },
  'Business Studies': { bg: 'rgba(244,114,182,0.11)', text: '#f9a8d4' },
  Accounting: { bg: 'rgba(99,102,241,0.11)',  text: '#a5b4fc' },
  Economics:  { bg: 'rgba(52,211,153,0.11)',  text: '#6ee7b7' },
  Buddhism:   { bg: 'rgba(251,191,36,0.11)',  text: '#fde68a' },
}

export const THUMB_BGLORS = {
  Physics: '#0c1428', Chemistry: '#0c1c12', Biology: '#1c1208',
  Maths: '#120a28', 'Combined Maths': '#120a28', ICT: '#1c0a14',
  English: '#081c18', Sinhala: '#1c1808', Tamil: '#1c0808',
  History: '#160828', Science: '#081c0e', Commerce: '#1c1a00',
  Unknown: '#141420'
}

export const PLAT_COLORS = {
  YouTube:   { bg: 'rgba(255,0,0,0.85)',      text: '#fff' },
  Bunny:     { bg: 'rgba(220,38,38,0.85)',    text: '#fff' },
  Zoom:      { bg: 'rgba(37,99,235,0.85)',    text: '#fff' },
  Classroom: { bg: 'rgba(234,179,8,0.9)',     text: '#000' },
  Drive:     { bg: 'rgba(22,163,74,0.85)',    text: '#fff' },
  Vimeo:     { bg: 'rgba(26,183,234,0.85)',   text: '#fff' },
  Other:     { bg: 'rgba(80,80,110,0.85)',    text: '#ccc' },
}

export const ytThumb = (yi) => yi ? `https://img.youtube.com/vi/${yi}/mqdefault.jpg` : null

export const fmtDate = (s) => {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d) ? s : d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const fmtViews = (n) => {
  if (!n) return null
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n/1000).toFixed(1)}k`
  return String(n)
}

export const isToday = (ds) => {
  if (!ds) return false
  const d = new Date(ds), t = new Date()
  return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate()
}

export const shortSubj = (s) => SUBJ_SHORT[s] || s || '?'
export const subjColor = (s) => SUBJ_COLORS[s] || { bg: 'var(--s3)', text: 'var(--t3)' }
export const thumbBg = (s) => THUMB_BGLORS[s] || '#141420'
export const platColor = (p) => PLAT_COLORS[p] || PLAT_COLORS.Other
