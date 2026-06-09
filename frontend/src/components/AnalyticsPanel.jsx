import { useEffect, useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { api } from '../services/api';
import { STATUS_COLORS } from '../utils/constants';

export default function AnalyticsPanel({ isOpen, onClose, boardId }) {
  const analytics = useBoardStore((s) => s.analytics);
  const setAnalytics = useBoardStore((s) => s.setAnalytics);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && boardId) {
      setLoading(true);
      api.getAnalytics(boardId)
        .then(setAnalytics)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, boardId, setAnalytics]);

  const maxStatus = Math.max(...Object.values(analytics?.byStatus || {}), 1);
  const maxPriority = Math.max(...Object.values(analytics?.byPriority || {}), 1);
  const maxMember = Math.max(...Object.values(analytics?.byMember || {}), 1);
  const completionRate = analytics?.total
    ? Math.round((analytics.completed / analytics.total) * 100)
    : 0;

  return (
    <div className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div>
          <h3>Analytics</h3>
          <span className="sidebar-subtitle">Board insights</span>
        </div>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-body">
        {loading ? (
          <div className="loading"><span className="spinner" /> Loading analytics...</div>
        ) : !analytics ? (
          <p style={{ color: 'var(--text-muted)' }}>No data available</p>
        ) : (
          <>
            <div className="analytics-grid">
              <div className="stat-card">
                <div className="stat-value">{analytics.total}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics.overdue}</div>
                <div className="stat-label">Overdue</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{completionRate}%</div>
                <div className="stat-label">Completion</div>
              </div>
            </div>

            <div className="analytics-extra-stats">
              <div className="extra-stat">
                <span className="extra-stat-icon">💬</span>
                <div>
                  <div className="extra-stat-value">{analytics.commentCount || 0}</div>
                  <div className="extra-stat-label">Comments</div>
                </div>
              </div>
              <div className="extra-stat">
                <span className="extra-stat-icon">📎</span>
                <div>
                  <div className="extra-stat-value">{analytics.attachmentCount || 0}</div>
                  <div className="extra-stat-label">Attachments</div>
                </div>
              </div>
              <div className="extra-stat">
                <span className="extra-stat-icon">📊</span>
                <div>
                  <div className="extra-stat-value">{analytics.avgCommentsPerTask || 0}</div>
                  <div className="extra-stat-label">Avg comments/task</div>
                </div>
              </div>
            </div>

            <div className="completion-ring-wrap">
              <svg className="completion-ring" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-card)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate * 2.64} 264`}
                  transform="rotate(-90 50 50)"
                  className="ring-progress"
                />
              </svg>
              <div className="ring-label">{completionRate}%</div>
              <span className="ring-caption">Done</span>
            </div>

            <h4 className="analytics-section-title">By Status</h4>
            {Object.entries(analytics.byStatus || {}).map(([status, count]) => (
              <div key={status} className="chart-bar-group">
                <div className="chart-label">
                  <span>{status}</span>
                  <span>{count}</span>
                </div>
                <div className="chart-bar">
                  <div
                    className="chart-bar-fill"
                    style={{
                      width: `${(count / maxStatus) * 100}%`,
                      background: STATUS_COLORS[status] || 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            ))}

            <h4 className="analytics-section-title">By Priority</h4>
            {Object.entries(analytics.byPriority || {}).map(([priority, count]) => (
              <div key={priority} className="chart-bar-group">
                <div className="chart-label">
                  <span>{priority}</span>
                  <span>{count}</span>
                </div>
                <div className="chart-bar">
                  <div
                    className="chart-bar-fill"
                    style={{ width: `${(count / maxPriority) * 100}%`, background: 'var(--accent)' }}
                  />
                </div>
              </div>
            ))}

            {Object.keys(analytics.byMember || {}).length > 0 && (
              <>
                <h4 className="analytics-section-title">By Assignee</h4>
                {Object.entries(analytics.byMember).map(([member, count]) => (
                  <div key={member} className="chart-bar-group">
                    <div className="chart-label">
                      <span>{member}</span>
                      <span>{count}</span>
                    </div>
                    <div className="chart-bar">
                      <div
                        className="chart-bar-fill"
                        style={{
                          width: `${(count / maxMember) * 100}%`,
                          background: '#10b981',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
