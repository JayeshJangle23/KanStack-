import { useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { formatDateTime, ACTIVITY_ICONS } from '../utils/constants';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'task_created', label: 'Created' },
  { id: 'task_moved', label: 'Moved' },
  { id: 'task_updated', label: 'Updated' },
  { id: 'comment_added', label: 'Comments' },
  { id: 'attachment_added', label: 'Attachments' },
  { id: 'member_invited', label: 'Members' },
];

export default function ActivityTimeline({ isOpen, onClose }) {
  const activities = useBoardStore((s) => s.activities);
  const [filter, setFilter] = useState('all');

  const filtered =
    filter === 'all' ? activities : activities.filter((a) => a.action === filter);

  return (
    <div className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div>
          <h3>Activity Timeline</h3>
          <span className="sidebar-subtitle">{activities.length} events</span>
        </div>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="activity-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="sidebar-body activity-timeline-body">
        {filtered.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon">📋</div>
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="timeline">
            {filtered.map((activity, i) => (
              <div
                key={activity._id}
                className="timeline-item animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
              >
                <div className="timeline-dot">
                  {ACTIVITY_ICONS[activity.action] || '•'}
                </div>
                <div className="timeline-content">
                  <div className="timeline-action">
                    <span className="activity-user">{activity.userId}</span>
                    <span className="timeline-details">
                      {activity.details || activity.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="activity-time">{formatDateTime(activity.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
