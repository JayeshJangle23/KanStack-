import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getUserId, getUserName, setUserName } from '../utils/constants';

export default function Home({ onSelectBoard }) {
  const [boards, setBoards] = useState([]);
  const [userName, setUserNameState] = useState(getUserName());
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const userId = getUserId();

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(true);
    try {
      const data = await api.getBoards(userId);
      setBoards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = () => {
    setUserName(userName);
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    try {
      const board = await api.createBoard(newBoardTitle.trim(), userName || userId);
      setBoards((prev) => [board, ...prev]);
      setNewBoardTitle('');
      onSelectBoard(board._id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="home">
      <div className="home-header">
        <h1>Kanban Board</h1>
        <p>Real-time collaborative task management</p>
      </div>

      <div className="user-setup">
        <label>Your display name</label>
        <input
          value={userName}
          onChange={(e) => setUserNameState(e.target.value)}
          onBlur={handleSaveName}
          placeholder="Enter your name..."
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          ID: {userId} — share this with teammates to invite you
        </p>
      </div>

      <h2 style={{ fontSize: '1.125rem', marginBottom: 16 }}>Your Boards</h2>

      {loading ? (
        <div className="loading">Loading boards...</div>
      ) : boards.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>
          No boards yet. Create one below to get started.
        </p>
      ) : (
        <div className="board-list">
          {boards.map((board) => (
            <div key={board._id} className="board-item" onClick={() => onSelectBoard(board._id)}>
              <div>
                <div className="board-item-title">{board.title}</div>
                <div className="board-item-meta">
                  {board.members.length} member{board.members.length !== 1 ? 's' : ''}
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
            </div>
          ))}
        </div>
      )}

      <div className="create-board-form">
        <h3>Create New Board</h3>
        <input
          placeholder="Board title..."
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
        />
        <button className="btn btn-primary" onClick={handleCreateBoard}>
          Create Board
        </button>
      </div>
    </div>
  );
}
