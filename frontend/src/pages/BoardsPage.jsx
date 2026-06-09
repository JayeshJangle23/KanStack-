import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Layout from '../components/Layout';

export default function BoardsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [user?.email]);

  const loadBoards = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await api.getBoards(user.email);
      setBoards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setCreating(true);
    try {
      const board = await api.createBoard(newBoardTitle.trim(), user.email);
      setBoards((prev) => [board, ...prev]);
      setNewBoardTitle('');
      navigate(`/board/${board._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="boards-page">
        <div className="page-header animate-fade-up">
          <div>
            <h1>My Boards</h1>
            <p>Manage and collaborate on your Kanban boards</p>
          </div>
          <Link to="/dashboard" className="btn btn-secondary btn-sm">
            ← Dashboard
          </Link>
        </div>

        <div className="create-board-form animate-fade-up delay-1">
          <h3>Create New Board</h3>
          <div className="create-board-row">
            <input
              placeholder="Enter board title..."
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
            />
            <button className="btn btn-primary" onClick={handleCreateBoard} disabled={creating}>
              {creating ? 'Creating...' : '+ Create Board'}
            </button>
          </div>
        </div>

        <h2 className="section-subtitle animate-fade-up delay-2">Your Boards</h2>

        {loading ? (
          <div className="loading">
            <span className="spinner" /> Loading boards...
          </div>
        ) : boards.length === 0 ? (
          <div className="empty-state animate-fade-up delay-3">
            <div className="empty-icon">▦</div>
            <h3>No boards yet</h3>
            <p>Create your first board above to get started</p>
          </div>
        ) : (
          <div className="board-list stagger-children">
            {boards.map((board) => (
              <Link key={board._id} to={`/board/${board._id}`} className="board-item">
                <div className="board-item-icon">▦</div>
                <div>
                  <div className="board-item-title">{board.title}</div>
                  <div className="board-item-meta">
                    {board.members.length} member{board.members.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className="board-arrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
