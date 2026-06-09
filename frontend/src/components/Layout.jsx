import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '◈' },
    { path: '/boards', label: 'Boards', icon: '▦' },
    { path: '/settings/email', label: 'Email Monitor', icon: '📧' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar animate-slide-down">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">⬡</span>
          <span>KanbanFlow</span>
        </Link>

        <div className="navbar-links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="user-avatar" />
          ) : (
            <div className="user-avatar placeholder">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  );
}
