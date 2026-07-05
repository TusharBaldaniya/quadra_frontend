const BASE_URL = process.env.REACT_APP_API_BASE || 'https://quadra-production-1943.up.railway.app';

// add scheduler for every 30 minute to check backend health
async function scheduler() {
  setInterval(() => {
    request('/health', { method: 'GET' });
  }, 30 * 60 * 1000);
}
scheduler();

async function request(path, options = {}) {
  const token = localStorage.getItem('quadra_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Authentication
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email, password, name) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  getMe: () =>
    request('/auth/me'),

  // Tasks
  getTasks: () => request('/tasks'),
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: 'POST' }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  addDependency: (data) => request('/tasks/dependencies', { method: 'POST', body: JSON.stringify(data) }),
  getDependencies: (taskId) => request(`/tasks/${taskId}/dependencies`),
  removeDependency: (depId) => request(`/tasks/dependencies/${depId}`, { method: 'DELETE' }),

  // AI Assistant
  getAiSubtasks: (title, description) =>
    request('/ai/subtasks', { method: 'POST', body: JSON.stringify({ title, description }) }),
  analyzeTask: (text) =>
    request('/ai/analyze', { method: 'POST', body: JSON.stringify({ text }) }),
  getAiInsights: () =>
    request('/ai/insights'),

  // Focus Tracking
  createFocusSession: (taskId, duration) =>
    request('/focus', { method: 'POST', body: JSON.stringify({ taskId, duration }) }),
  getFocusStats: () => request('/focus/stats'),
  getFocusSessions: () => request('/focus'),
  getVapidPublicKey: () => request('/notifications/public-key'),
  subscribeNotifications: (sub) => request('/notifications/subscribe', { method: 'POST', body: JSON.stringify(sub) }),
  getPartnerStatus: () => request('/gamification/partner/status'),
  linkPartner: (partnerId) => request('/gamification/partner/link', { method: 'POST', body: JSON.stringify({ partnerId }) }),
  sendPartnerCheer: (message) => request('/gamification/partner/cheer', { method: 'POST', body: JSON.stringify({ message }) }),
  getGamificationStats: () => request('/gamification/stats'),

  // Analytics
  getSummary: () => request('/analytics/summary'),
  getCompletions: (days = 14) => request(`/analytics/completions?days=${days}`),
  getPriorityDistribution: () => request('/analytics/priority'),
  getQuadrantDistribution: () => request('/analytics/quadrant'),
};
