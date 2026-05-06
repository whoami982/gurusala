import axios from 'axios'

// ── Fetch a session token from server on first load
let _token = null
async function getToken() {
  if (_token) return _token
  try {
    const r = await axios.get('/api/token', { withCredentials: true })
    _token = r.data.token
  } catch { _token = '' }
  return _token
}

// ── Axios instance with auto token injection
const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers['x-gs-token'] = token
  return config
})

// ── Auto refresh token on 403 (expired)
api.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 403 && err.config && !err.config._retry) {
      err.config._retry = true
      _token = null // force refresh
      const token = await getToken()
      if (token) err.config.headers['x-gs-token'] = token
      return api(err.config)
    }
    return Promise.reject(err)
  }
)

export const getVideos      = () => api.get('/videos')
export const getMaterials   = () => api.get('/materials')
export const getLive        = () => api.get('/live')
export const getNotice      = () => api.get('/notice')
export const checkDuplicate = (url) => api.get(`/check-duplicate?url=${encodeURIComponent(url)}`)
export const submitLink     = (data) => api.post('/submit', data)
export const incrementView  = (id) => api.post(`/view/${id}`)
export const submitReport   = (data) => api.post('/report', data)
export const submitTag      = (id, data) => api.post(`/tag/${id}`, data)

// Admin
const A = '/ml-panel'
export const adminLogin          = (pw)     => api.post(`${A}/login`, { password: pw })
export const adminLogout         = ()       => api.post(`${A}/logout`)
export const adminCheck          = ()       => api.get(`${A}/check`)
export const adminStats          = ()       => api.get(`${A}/stats`)
export const adminPending        = ()       => api.get(`${A}/pending`)
export const adminApprove        = (id)     => api.post(`${A}/approve/${id}`)
export const adminDecline        = (id)     => api.post(`${A}/decline/${id}`)
export const adminReports        = ()       => api.get(`${A}/reports`)
export const adminFixReport      = (id, d)  => api.post(`${A}/reports/${id}/fix`, d)
export const adminDismissReport  = (id)     => api.post(`${A}/reports/${id}/dismiss`)
export const adminGetVideos      = ()       => api.get(`${A}/videos`)
export const adminEditVideo      = (id, d)  => api.patch(`${A}/videos/${id}`, d)
export const adminDeleteVideo    = (id)     => api.delete(`${A}/videos/${id}`)
export const adminPendingTags    = ()       => api.get(`${A}/tags/pending`)
export const adminApproveTag     = (id, d)  => api.post(`${A}/tags/${id}/approve`, d)
export const adminDismissTag     = (id)     => api.post(`${A}/tags/${id}/dismiss`)

export default api
