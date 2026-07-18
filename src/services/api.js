import axios from 'axios'

// Production uses same-origin /api proxy (vercel.json → Railway). Local dev hits backend directly.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')

const api = axios.create({
  baseURL: API_BASE_URL,
})
const TOKEN_KEY = 'traineradda_admin_token'

export function getStoredToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
}

export function setStoredToken(token) {
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }
}

api.interceptors.request.use((config) => {
  // Let the browser set multipart boundary for FormData; JSON otherwise
  if (config.data instanceof FormData) {
    const h = config.headers
    if (h) {
      if (typeof h.delete === 'function') h.delete('Content-Type')
      else {
        delete h['Content-Type']
        delete h['content-type']
      }
    }
  } else if (config.data != null) {
    const h = config.headers
    if (h && !h['Content-Type'] && !h['content-type']) {
      h['Content-Type'] = 'application/json'
    }
  }
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      setStoredToken(null)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/'
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const loginApi = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data)

// Vendors
export const getVendors = () => api.get('/vendors').then((r) => r.data)
export const getVendor = (id) => api.get(`/vendors/${id}`).then((r) => r.data)
export const createVendor = (vendor) => api.post('/vendors', vendor).then((r) => r.data)
export const updateVendor = (id, vendor) => api.put(`/vendors/${id}`, vendor).then((r) => r.data)
export const deleteVendor = (id) => api.delete(`/vendors/${id}`)

// Jobs
export const getJobs = () => api.get('/jobs').then((r) => r.data)
export const getJob = (id) => api.get(`/jobs/${id}`).then((r) => r.data)
export const createJob = (job) => api.post('/jobs', job).then((r) => r.data)
export const updateJob = (id, job) => api.put(`/jobs/${id}`, job).then((r) => r.data)
export const deleteJob = (id) => api.delete(`/jobs/${id}`)
export const getJobApplications = (jobId) => api.get(`/jobs/${jobId}/applications`).then((r) => r.data)

// Trainers (support FormData when photo file is provided)
export const getTrainers = () => api.get('/trainers').then((r) => r.data)
export const getTrainer = (id) => api.get(`/trainers/${id}`).then((r) => r.data)

const TRAINER_FORM_SKIP = new Set(['photo', 'resume', 'id', '_id', 'createdAt', 'updatedAt', '__v'])

function trainerPayload(trainer, photoFile, resumeFile) {
  if (photoFile || resumeFile) {
    const form = new FormData()
    Object.entries(trainer).forEach(([k, v]) => {
      if (TRAINER_FORM_SKIP.has(k)) return
      if (k === 'comments') form.append(k, JSON.stringify(v || []))
      else if (v != null && v !== '') form.append(k, v)
    })
    if (photoFile) form.append('photo', photoFile)
    if (resumeFile) form.append('resume', resumeFile)
    return form
  }
  const { photo, resume, ...rest } = trainer
  return {
    ...rest,
    photo: typeof photo === 'string' ? photo : '',
    resume: typeof resume === 'string' ? resume : '',
    comments: trainer.comments || [],
  }
}

export const createTrainer = (trainer, photoFile = null, resumeFile = null) => {
  const payload = trainerPayload(trainer, photoFile, resumeFile)
  const config = payload instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined
  return api.post('/trainers', payload, config).then((r) => r.data)
}

export const updateTrainer = (id, trainer, photoFile = null, resumeFile = null) => {
  const payload = trainerPayload(trainer, photoFile, resumeFile)
  const config = payload instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined
  return api.put(`/trainers/${id}`, payload, config).then((r) => r.data)
}

export const deleteTrainer = (id) => api.delete(`/trainers/${id}`)

// Important Links
export const getImportantLinks = () => api.get('/important-links').then((r) => r.data)
export const createImportantLink = (link) => api.post('/important-links', link).then((r) => r.data)
export const deleteImportantLink = (id) => api.delete(`/important-links/${id}`)

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats').then((r) => r.data)

// Activities
export const getActivities = (dateKey) => api.get('/activities', { params: { date: dateKey } }).then((r) => r.data)

// Contact Messages
export const getContacts = () => api.get('/contact').then((r) => r.data)
export const markContactRead = (id) => api.patch(`/contact/${id}/read`).then((r) => r.data)
export const deleteContact = (id) => api.delete(`/contact/${id}`)

export default api
