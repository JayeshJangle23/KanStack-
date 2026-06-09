import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Layout from '../components/Layout';

const FEATURES = [
  { icon: '⚡', title: 'Real-Time Sync', desc: 'Live task updates across all connected clients via Socket.io' },
  { icon: '🎯', title: 'Drag & Drop', desc: 'Intuitive Kanban columns with smooth drag-and-drop reordering' },
  { icon: '👥', title: 'Team Collaboration', desc: 'Invite members, see online presence, and typing indicators' },
  { icon: '🔍', title: 'Smart Filters', desc: 'Filter tasks by priority, assignee, due date, and search' },
  { icon: '📊', title: 'Analytics', desc: 'Track completion rates, overdue tasks, and workload distribution' },
  { icon: '💬', title: 'Comments & Activity', desc: 'Full activity timeline and task-level comment threads' },
];

const TECH_STACK = [
  { name: 'React 18', category: 'Frontend' },
  { name: 'Vite', category: 'Frontend' },
  { name: 'Zustand', category: 'State' },
  { name: 'Socket.io', category: 'Realtime' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'JWT Auth', category: 'Security' },
];

const COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completionRate =
    stats?.taskCount > 0 ? Math.round((stats.completedTasks / stats.taskCount) * 100) : 0;

  return (
    <Layout>
      <div className="dashboard">
        <section className="dashboard-hero animate-fade-up">
          <div className="hero-content">
            <span className="hero-badge">Collaborative Workspace</span>
            <h1>
              Welcome, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p>
              KanbanFlow is a real-time collaborative task management system — a Trello-like
              Kanban board built with the MERN stack and Socket.io for instant synchronization.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/boards')}>
                View My Boards
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/boards')}>
                + Create Board
              </button>
            </div>
          </div>
          <div className="hero-visual animate-float">
            <div className="mini-kanban">
              {COLUMNS.map((col, i) => (
                <div key={col} className="mini-column" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="mini-col-header">{col}</div>
                  {[...Array(3 - i)].map((_, j) => (
                    <div key={j} className="mini-card" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="stats-grid animate-fade-up delay-1">
          {[
            { label: 'Boards', value: stats?.boardCount ?? '—', icon: '▦', color: '#6366f1' },
            { label: 'Total Tasks', value: stats?.taskCount ?? '—', icon: '☑', color: '#3b82f6' },
            { label: 'Completed', value: stats?.completedTasks ?? '—', icon: '✓', color: '#10b981' },
            { label: 'Completion', value: loading ? '—' : `${completionRate}%`, icon: '◉', color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={stat.label} className="stat-card-interactive" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="stat-icon" style={{ background: `${stat.color}22`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-value-lg">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </section>

        <section className="dashboard-section animate-fade-up delay-2">
          <h2 className="section-title">About This Project</h2>
          <div className="about-card">
            <p>
              <strong>KanbanFlow</strong> is a full-stack collaborative Kanban board designed for teams
              who need instant task synchronization. Built as a MERN application with mandatory Socket.io
              integration, it handles simultaneous updates, reorder conflicts, and disconnect/reconnect
              scenarios gracefully.
            </p>
            <div className="about-highlights">
              <div className="highlight-item">
                <span className="highlight-num">4</span>
                <span>Kanban Columns</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-num">REST</span>
                <span>+ WebSocket APIs</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-num">JWT</span>
                <span>+ Google OAuth</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-num">100%</span>
                <span>Responsive UI</span>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section animate-fade-up delay-3">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section animate-fade-up delay-4">
          <h2 className="section-title">Tech Stack</h2>
          <div className="tech-grid">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="tech-chip">
                <span className="tech-name">{tech.name}</span>
                <span className="tech-category">{tech.category}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section animate-fade-up delay-5">
          <h2 className="section-title">Architecture</h2>
          <div className="arch-flow">
            <div className="arch-node">
              <span className="arch-label">React Client</span>
              <span className="arch-sub">Vite + Zustand + DnD</span>
            </div>
            <div className="arch-arrow animate-pulse">→</div>
            <div className="arch-node">
              <span className="arch-label">Express API</span>
              <span className="arch-sub">REST + JWT Auth</span>
            </div>
            <div className="arch-arrow animate-pulse">↔</div>
            <div className="arch-node accent">
              <span className="arch-label">Socket.io</span>
              <span className="arch-sub">Real-time Events</span>
            </div>
            <div className="arch-arrow animate-pulse">→</div>
            <div className="arch-node">
              <span className="arch-label">MongoDB</span>
              <span className="arch-sub">Boards, Tasks, Users</span>
            </div>
          </div>
        </section>

        {stats?.recentBoards?.length > 0 && (
          <section className="dashboard-section animate-fade-up delay-6">
            <h2 className="section-title">Recent Boards</h2>
            <div className="recent-boards">
              {stats.recentBoards.map((board) => (
                <Link key={board._id} to={`/board/${board._id}`} className="board-item recent">
                  <div>
                    <div className="board-item-title">{board.title}</div>
                    <div className="board-item-meta">
                      {board.members} member{board.members !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span className="board-arrow">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
