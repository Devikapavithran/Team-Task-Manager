import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r.data,
  e => Promise.reject(e.response?.data || { error: 'Network error' })
)

export const authAPI = {
  login: d => api.post('/auth/login', d),
  signup: d => api.post('/auth/signup', d),
  me: () => api.get('/auth/me'),
  updateMe: d => api.put('/auth/me', d),
}

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  get: id => api.get(`/projects/${id}`),
  create: d => api.post('/projects', d),
  update: (id, d) => api.put(`/projects/${id}`, d),
  delete: id => api.delete(`/projects/${id}`),
  addMember: (id, d) => api.post(`/projects/${id}/members`, d),
  removeMember: (id, uid) => api.delete(`/projects/${id}/members/${uid}`),
}

export const tasksAPI = {
  getAll: p => api.get('/tasks', { params: p }),
  get: id => api.get(`/tasks/${id}`),
  create: d => api.post('/tasks', d),
  update: (id, d) => api.put(`/tasks/${id}`, d),
  delete: id => api.delete(`/tasks/${id}`),
  addComment: (id, d) => api.post(`/tasks/${id}/comments`, d),
  evaluate: (id, d) => api.post(`/tasks/${id}/evaluate`, d),
}

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

export const teamAPI = {
  getAll: () => api.get('/team'),
  updateRole: (id, role) => api.put(`/team/${id}/role`, { role }),
}

export const notificationsAPI = {
  getAll: p => api.get('/notifications', { params: p }),
  markRead: id => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}

export const usersAPI = {
  search: q => api.get('/users', { params: { search: q } }),
}

export default api
