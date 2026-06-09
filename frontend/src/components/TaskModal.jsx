import { useState, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { api } from '../services/api';
import { PRIORITIES, STATUSES, formatDateTime } from '../utils/constants';
import TaskAttachments from './TaskAttachments';

export default function TaskModal({ task, board, userId, onClose, onUpdate, onDelete, emit }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    assignedTo: task.assignedTo || '',
    status: task.status,
  });
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const typingTimeout = useRef(null);
  const commentsEndRef = useRef(null);
  const typingUsers = useBoardStore((s) => s.typingUsers[task._id] || new Set());
  const incomingComment = useBoardStore((s) => s.incomingComment);

  useEffect(() => {
    api.getComments(task._id).then(setComments).catch(console.error);
    api.getAttachments(task._id).then(setAttachments).catch(console.error);
  }, [task._id]);

  useEffect(() => {
    if (incomingComment && String(incomingComment.taskId) === String(task._id)) {
      setComments((prev) => {
        if (prev.some((c) => c._id === incomingComment._id)) return prev;
        return [...prev, incomingComment];
      });
      useBoardStore.getState().clearIncomingComment();
    }
  }, [incomingComment, task._id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'description') {
      emit('typing_start', { taskId: task._id });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        emit('typing_stop', { taskId: task._id });
      }, 1500);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await api.updateTask(task._id, {
        ...form,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
        version: task.version,
        userId,
      });
      onUpdate(data);
      emit('task_updated', data);
    } catch (err) {
      if (err.status === 409) {
        onUpdate({ task: err.task });
        alert('Task was updated by another user. Board refreshed.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      const data = await api.deleteTask(task._id, userId);
      onDelete(data);
      emit('task_deleted', data);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const data = await api.addComment(task._id, newComment.trim(), userId);
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
      emit('comment_added', data);
    } catch (err) {
      console.error(err);
    }
  };

  const typingList = Array.from(typingUsers).filter((u) => u !== userId);

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal modal-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <input
            className="modal-title-input"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          {[
            { id: 'details', label: 'Details', icon: '✏️' },
            { id: 'comments', label: `Comments (${comments.length})`, icon: '💬' },
            { id: 'attachments', label: `Files (${attachments.length})`, icon: '📎' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === 'details' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={(e) => handleChange('priority', e.target.value)}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Assigned To</label>
                  <select className="form-select" value={form.assignedTo} onChange={(e) => handleChange('assignedTo', e.target.value)}>
                    <option value="">Unassigned</option>
                    {(board?.members || []).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={(e) => handleChange('dueDate', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Add a description..."
                />
                {typingList.length > 0 && (
                  <div className="typing-indicator">
                    {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'comments' && (
            <div className="comments-section standalone">
              <div className="comments-list">
                {comments.length === 0 ? (
                  <div className="empty-state small">
                    <p>No comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c._id} className="comment enhanced">
                      <div className="comment-avatar">{c.userId.charAt(0).toUpperCase()}</div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">{c.userId}</span>
                          <span className="comment-time">{formatDateTime(c.createdAt)}</span>
                        </div>
                        <div className="comment-text">{c.text}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>
              <div className="comment-form">
                <input
                  className="form-input"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddComment}>Send</button>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <TaskAttachments
              taskId={task._id}
              userId={userId}
              attachments={attachments}
              onUpload={(att) => setAttachments((prev) => [att, ...prev])}
              onDelete={(id) => setAttachments((prev) => prev.filter((a) => a._id !== id))}
              emit={emit}
            />
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
