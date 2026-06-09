import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import BoardView from '../components/BoardView';

export default function BoardPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return (
    <BoardView
      boardId={id}
      userId={user?.email}
      userName={user?.name}
      onBack={() => navigate('/boards')}
    />
  );
}
