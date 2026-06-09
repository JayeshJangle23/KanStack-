import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export default function InviteModal({ boardId, userId, onClose, onInvite }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await api.searchUsers(query);
        setResults(users);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleInvite = async (email) => {
    const memberEmail = email || selected?.email;
    if (!memberEmail) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.inviteMember(boardId, memberEmail, userId);
      onInvite(data);
      onClose();
    } catch (err) {
      setError(err.error || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.125rem' }}>Invite Member</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Search by email</label>
            <input
              className="form-input"
              placeholder="Type email to search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
          </div>

          {results.length > 0 && (
            <div className="user-search-results">
              {results.map((user) => (
                <button
                  key={user._id}
                  className={`user-result ${selected?.email === user.email ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(user);
                    setQuery(user.email);
                    setResults([]);
                  }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="user-result-avatar" />
                  ) : (
                    <div className="user-result-avatar placeholder">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="user-result-name">{user.name}</div>
                    <div className="user-result-email">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: 8 }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => handleInvite()}
            disabled={loading || (!selected && !query.includes('@'))}
          >
            {loading ? 'Inviting...' : 'Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
