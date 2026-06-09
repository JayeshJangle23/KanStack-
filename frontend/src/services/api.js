const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('kanban_token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const api = {
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  googleAuth: (credential) =>
    request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),

  getMe: () => request('/auth/me'),

  getStats: () => request('/auth/stats'),

  searchUsers: (q) => request(`/auth/users/search?q=${encodeURIComponent(q)}`),

  createBoard: (title, createdBy) =>
    request('/boards', { method: 'POST', body: JSON.stringify({ title, createdBy }) }),

  getBoards: (userId) => request(`/boards?userId=${encodeURIComponent(userId)}`),

  getBoardData: (id) => request(`/boards/${id}`),

  inviteMember: (boardId, memberId, invitedBy) =>
    request(`/boards/${boardId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ memberId, invitedBy }),
    }),

  getActivities: (boardId) => request(`/boards/${boardId}/activities`),

  getAnalytics: (boardId) => request(`/boards/${boardId}/analytics`),

  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  moveTask: (data) => request('/tasks/move', { method: 'POST', body: JSON.stringify(data) }),

  deleteTask: (id, userId) =>
    request(`/tasks/${id}`, { method: 'DELETE', body: JSON.stringify({ userId }) }),

  addComment: (taskId, text, userId) =>
    request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, userId }),
    }),

  getComments: (taskId) => request(`/tasks/${taskId}/comments`),

  getAttachments: (taskId) => request(`/tasks/${taskId}/attachments`),

  uploadAttachment: async (taskId, file, userId) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    const res = await fetch(`${API_BASE}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  },

  deleteAttachment: (id, userId) =>
    request(`/attachments/${id}`, { method: 'DELETE', body: JSON.stringify({ userId }) }),

  getEmailSettings: () => request('/email/settings'),

  updateEmailSettings: (settings) =>
    request('/email/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  sendTestEmail: () => request('/email/test', { method: 'POST' }),

  getEmailPreview: () => request('/email/preview'),

  getEmailLogs: () => request('/email/logs'),

  runEmailMonitor: () => request('/email/run', { method: 'POST' }),
};
