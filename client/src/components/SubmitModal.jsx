import { useState, useRef } from 'react'
import { Modal, ModalHeader, FormField, Input, Select, Button } from './ui'
import { checkDuplicate, submitLink } from '../utils/api'
import { SUBJECTS, GRADES } from '../utils/helpers'
import { AlertIcon, CheckIcon, VideoIcon, FolderIcon, RadioIcon, CloseIcon } from './Icons'

const TABS = [
  { id: 'video', label: 'Video', icon: VideoIcon },
  { id: 'tute', label: 'Study Material', icon: FolderIcon },
  { id: 'live', label: 'Live Class', icon: RadioIcon },
]

function DupWarning() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 14px', marginBottom: 14 }}>
      <div style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }}><AlertIcon size={14} /></div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 2 }}>Link already exists</div>
        <div style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.5 }}>This link is already on GuruSala. Please check before submitting.</div>
      </div>
    </div>
  )
}

function ErrorBox({ msg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 14px', marginBottom: 14 }}>
      <div style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }}><AlertIcon size={14} /></div>
      <div style={{ fontSize: 12, color: '#fca5a5' }}>{msg}</div>
    </div>
  )
}

function SuccessState({ onClose }) {
  return (
    <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
      {/* Animated check circle */}
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--grn)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'fadeIn 0.4s ease 0.1s both' }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.03em', marginBottom: 8 }}>Submitted Successfully</div>
        <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, maxWidth: 300 }}>
          Your link has been sent for review and will appear on the site once approved by the admin.
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8, lineHeight: 1.6, fontStyle: 'italic' }}>
          
        </div>
      </div>
      <div style={{ width: '100%', height: 1, background: 'var(--b1)', margin: '4px 0' }} />
      <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid var(--b1)', background: 'var(--s2)', color: 'var(--t2)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Close
      </button>
    </div>
  )
}

function SubjGradeRow({ form, set }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <FormField label="Subject" required>
        <Select value={form.subject || ''} onChange={e => set('subject', e.target.value)}>
          <option value="">Select subject</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </FormField>
      <FormField label="Grade" required>
        <Select value={form.grade || ''} onChange={e => set('grade', e.target.value)}>
          <option value="">Select grade</option>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </Select>
      </FormField>
    </div>
  )
}

export default function SubmitModal({ open, onClose }) {
  const [tab, setTab] = useState('video')
  const [form, setForm] = useState({})
  const [dupWarn, setDupWarn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const dupTimer = useRef(null)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function handleClose() {
    onClose()
    setTimeout(() => { setForm({}); setDupWarn(false); setSuccess(false); setError(''); setTab('video') }, 300)
  }

  async function onUrlChange(val) {
    set('url', val)
    setDupWarn(false)
    clearTimeout(dupTimer.current)
    if (!val || val.length < 10) return
    dupTimer.current = setTimeout(async () => {
      try { const r = await checkDuplicate(val); if (r.data.duplicate) setDupWarn(true) } catch {}
    }, 500)
  }

  async function handleSubmit() {
    setError('')
    if (!form.title?.trim()) return setError('Please enter a title.')
    if (!form.url?.trim()) return setError('Please enter a URL.')
    if (!form.subject) return setError('Please select a subject.')
    if (tab === 'live' && (!form.date || !form.time)) return setError('Please enter the date and time for the live class.')
    if (dupWarn) return setError('This link already exists on GuruSala.')

    setLoading(true)
    try {
      await submitLink({
        type: tab, title: form.title, url: form.url,
        subject: form.subject, grade: form.grade || 'Unknown',
        tute_url: form.tute_url || '', date: form.date || '',
        time: form.time || '', name: form.name || 'Anonymous'
      })
      setSuccess(true)
      setTimeout(() => { setSuccess(false); handleClose() }, 4000)
    } catch (err) {
      const msg = err.response?.data?.error
      if (err.response?.status === 409) {
        setDupWarn(true)
        setError('This link already exists on GuruSala.')
      } else if (err.response?.status === 429) {
        setError('Too many submissions. Please wait 15 minutes before trying again.')
      } else {
        setError(msg || 'Submission failed. Please check your details and try again.')
      }
    }
    setLoading(false)
  }

  const urlPlaceholder = {
    video: 'https://youtube.com/watch?v=...',
    tute: 'https://drive.google.com/...',
    live: 'https://youtube.com/live/... or Zoom link'
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth={520}>
      <ModalHeader title="Submit a Link" subtitle="All submissions reviewed before going live" onClose={handleClose} />

      {success ? (
        <SuccessState onClose={handleClose} />
      ) : (
        <div style={{ padding: '18px 20px 24px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 3, background: 'var(--s2)', borderRadius: 11, padding: 4, marginBottom: 18, border: '1px solid var(--b1)' }}>
            {TABS.map(t => (
              <button key={t.id}
                onClick={() => { setTab(t.id); setForm({}); setDupWarn(false); setError('') }}
                style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s', background: tab === t.id ? 'var(--ac)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--t3)' }}>
                <t.icon size={12} />
                {t.label}
              </button>
            ))}
          </div>

          {dupWarn && <DupWarning />}
          {error && <ErrorBox msg={error} />}

          {/* Title */}
          <FormField label={tab === 'tute' ? 'Material Title' : tab === 'live' ? 'Class Title' : 'Video Title'} required>
            <Input value={form.title || ''} onChange={e => set('title', e.target.value)}
              placeholder={tab === 'video' ? 'e.g. Physics 2026 A/L Mechanics — Lesson 01' : tab === 'tute' ? 'e.g. Physics 2026 A/L Paper Collection' : 'e.g. Physics 2026 A/L Live Revision'} />
          </FormField>

          {/* URL */}
          <FormField label={tab === 'tute' ? 'Google Drive URL' : tab === 'live' ? 'Live Class URL' : 'Video URL'} required
            hint={tab === 'video' ? 'YouTube, Zoom, Google Classroom or any platform' : tab === 'tute' ? 'Link to a Drive folder or file' : 'YouTube Live, Zoom, Google Meet, etc.'}>
            <Input type="url" value={form.url || ''} onChange={e => onUrlChange(e.target.value)} placeholder={urlPlaceholder[tab]} />
          </FormField>

          <SubjGradeRow form={form} set={set} />

          {/* Live date/time */}
          {tab === 'live' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="Date" required hint="Shows 'Today' if today">
                <Input type="date" value={form.date !== undefined ? form.date : new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} />
              </FormField>
              <FormField label="Time (Sri Lanka)" required>
                <Input type="time" value={form.time || ''} onChange={e => set('time', e.target.value)} />
              </FormField>
            </div>
          )}

          {/* Optional tute URL for video/live */}
          {(tab === 'video' || tab === 'live') && (
            <FormField label="Study Material URL" hint="Optional — Google Drive link for related notes or PDF">
              <Input type="url" value={form.tute_url || ''} onChange={e => set('tute_url', e.target.value)} placeholder="https://drive.google.com/..." />
            </FormField>
          )}

          {/* Name */}
          <FormField label="Your Name">
            <Input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Optional — Anonymous by default" />
          </FormField>

          <Button onClick={handleSubmit} loading={loading} disabled={loading || dupWarn} style={{ width: '100%', padding: '12px', marginTop: 6, fontSize: 13, fontWeight: 700, borderRadius: 10 }}>
            {tab === 'video' ? 'Submit Video for Review' : tab === 'tute' ? 'Submit Material for Review' : 'Submit Live Class for Review'}
          </Button>

          <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
            All submissions are reviewed by admin before appearing on the site.
          </div>
        </div>
      )}
    </Modal>
  )
}
