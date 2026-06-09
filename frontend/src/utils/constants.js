export const STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const PRIORITY_COLORS = {
  Low: '#6b7280',
  Medium: '#3b82f6',
  High: '#f59e0b',
  Critical: '#ef4444',
};

export const STATUS_COLORS = {
  Todo: '#6366f1',
  'In Progress': '#3b82f6',
  Review: '#f59e0b',
  Done: '#10b981',
};

export function getUserId() {
  let userId = localStorage.getItem('kanban_userId');
  if (!userId) {
    userId = `user_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('kanban_userId', userId);
  }
  return userId;
}

export function getUserName() {
  let name = localStorage.getItem('kanban_userName');
  if (!name) {
    name = `User ${Math.floor(Math.random() * 9000 + 1000)}`;
    localStorage.setItem('kanban_userName', name);
  }
  return name;
}

export function setUserName(name) {
  localStorage.setItem('kanban_userName', name);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ACTIVITY_ICONS = {
  board_created: '📋',
  member_invited: '👥',
  task_created: '✨',
  task_updated: '✏️',
  task_moved: '↔️',
  task_deleted: '🗑️',
  comment_added: '💬',
  attachment_added: '📎',
  attachment_deleted: '📎',
};

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'Done') return false;
  return new Date(dueDate) < new Date();
}
