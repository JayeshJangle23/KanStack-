import { useEffect, useState, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useBoardStore } from '../store/boardStore';
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';
import { STATUSES } from '../utils/constants';
import Column from './Column';
import Filters from './Filters';
import OnlineMembers from './OnlineMembers';
import TaskModal from './TaskModal';
import InviteModal from './InviteModal';
import ActivityTimeline from './ActivityTimeline';
import AnalyticsPanel from './AnalyticsPanel';

export default function BoardView({ boardId, userId, userName, onBack }) {
  const {
    board,
    isModalOpen,
    selectedTask,
    isLoading,
    error,
    setBoard,
    setTasks,
    setActivities,
    addTask,
    updateTaskInStore,
    replaceAllTasks,
    removeTask,
    addActivity,
    updateBoardMembers,
    openTaskModal,
    closeTaskModal,
    getTasksByColumn,
  } = useBoardStore();

  const { emit, refreshBoard } = useSocket(boardId, userId);
  const [showInvite, setShowInvite] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  useEffect(() => {
    const loadBoard = async () => {
      useBoardStore.getState().setLoading(true);
      try {
        const data = await api.getBoardData(boardId);
        setBoard(data.board);
        setTasks(data.tasks);
        setActivities(data.activities);
      } catch (err) {
        useBoardStore.getState().setError(err.error || 'Failed to load board');
      } finally {
        useBoardStore.getState().setLoading(false);
      }
    };
    loadBoard();
  }, [boardId, setBoard, setTasks, setActivities]);

  const handleDragEnd = useCallback(
    async (result) => {
      if (!result.destination) return;

      const { draggableId, source, destination } = result;
      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const columnsBefore = getTasksByColumn();
      const sourceTasks = [...columnsBefore[source.droppableId]];
      const [movedTask] = sourceTasks.splice(source.index, 1);

      let destTasks;
      if (source.droppableId === destination.droppableId) {
        destTasks = sourceTasks;
      } else {
        destTasks = [...columnsBefore[destination.droppableId]];
      }
      destTasks.splice(destination.index, 0, {
        ...movedTask,
        status: destination.droppableId,
      });

      const optimisticTasks = [];
      STATUSES.forEach((status) => {
        let col;
        if (status === source.droppableId && status === destination.droppableId) {
          col = destTasks;
        } else if (status === source.droppableId) {
          col = sourceTasks;
        } else if (status === destination.droppableId) {
          col = destTasks;
        } else {
          col = columnsBefore[status];
        }
        col.forEach((t, i) => optimisticTasks.push({ ...t, status, position: i }));
      });
      replaceAllTasks(optimisticTasks);

      try {
        const data = await api.moveTask({
          taskId: draggableId,
          sourceStatus: source.droppableId,
          destStatus: destination.droppableId,
          sourceIndex: source.index,
          destIndex: destination.index,
          userId,
        });
        replaceAllTasks(data.tasks);
        if (data.activity) addActivity(data.activity);
        emit('task_moved', data);
      } catch (err) {
        console.error('Move failed, refreshing board:', err);
        await refreshBoard();
        setSyncToast(true);
        setTimeout(() => setSyncToast(false), 3000);
      }
    },
    [userId, getTasksByColumn, replaceAllTasks, addActivity, emit, refreshBoard]
  );

  const handleAddTask = async (status, taskData) => {
    try {
      const data = await api.createTask({
        boardId,
        title: taskData.title,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        status,
        userId,
      });
      addTask(data.task);
      if (data.activity) addActivity(data.activity);
      emit('task_created', data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskUpdate = (data) => {
    updateTaskInStore(data.task);
    if (data.activity) addActivity(data.activity);
  };

  const handleTaskDelete = (data) => {
    removeTask(data.taskId);
    if (data.activity) addActivity(data.activity);
  };

  const handleInvite = (data) => {
    updateBoardMembers(data.board.members);
    if (data.activity) addActivity(data.activity);
    emit('member_invited', data);
  };

  if (isLoading) return <div className="loading">Loading board...</div>;

  const columns = getTasksByColumn();

  return (
    <div className="app">
      <header className="header animate-slide-down">
        <div className="header-left">
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            ← Back
          </button>
          <h1 className="header-title">{board?.title || 'Board'}</h1>
          <OnlineMembers />
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(true)}>
            Invite
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowActivity(true)}>
            Activity
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAnalytics(true)}>
            Analytics
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              await refreshBoard();
              setSyncToast(true);
              setTimeout(() => setSyncToast(false), 2000);
            }}
          >
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <Filters />

      <div className="board-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="board-columns">
            {STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={columns[status]}
                onAddTask={handleAddTask}
                onTaskClick={openTaskModal}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          board={board}
          userId={userId}
          onClose={closeTaskModal}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          emit={emit}
        />
      )}

      {showInvite && (
        <InviteModal
          boardId={boardId}
          userId={userId}
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}

      <ActivityTimeline isOpen={showActivity} onClose={() => setShowActivity(false)} />
      <AnalyticsPanel
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        boardId={boardId}
      />

      {syncToast && <div className="sync-toast">Board synced</div>}
    </div>
  );
}
