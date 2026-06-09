import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useBoardStore } from '../store/boardStore';
import { api } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket(boardId, userId) {
  const socketRef = useRef(null);
  const {
    addTask,
    updateTaskInStore,
    replaceAllTasks,
    removeTask,
    addActivity,
    updateBoardMembers,
    setOnlineMembers,
    setTyping,
  } = useBoardStore();

  const refreshBoard = useCallback(async () => {
    if (!boardId) return;
    try {
      const data = await api.getBoardData(boardId);
      useBoardStore.getState().setBoard(data.board);
      replaceAllTasks(data.tasks);
      useBoardStore.getState().setActivities(data.activities);
    } catch (err) {
      console.error('Failed to refresh board:', err);
    }
  }, [boardId, replaceAllTasks]);

  useEffect(() => {
    if (!boardId || !userId) return;

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_board', { boardId, userId });
    });

    socket.on('reconnect', () => {
      socket.emit('join_board', { boardId, userId });
      refreshBoard();
    });

    socket.on('sync_required', () => {
      refreshBoard();
    });

    socket.on('joined_board', ({ onlineMembers }) => {
      setOnlineMembers(onlineMembers);
    });

    socket.on('online_members', (members) => {
      setOnlineMembers(members);
    });

    socket.on('task_created', ({ task, activity }) => {
      addTask(task);
      if (activity) addActivity(activity);
    });

    socket.on('task_updated', ({ task, activity }) => {
      updateTaskInStore(task);
      if (activity) addActivity(activity);
    });

    socket.on('task_moved', ({ tasks, activity }) => {
      replaceAllTasks(tasks);
      if (activity) addActivity(activity);
    });

    socket.on('task_deleted', ({ taskId, activity }) => {
      removeTask(taskId);
      if (activity) addActivity(activity);
    });

    socket.on('member_invited', ({ board, activity }) => {
      updateBoardMembers(board.members);
      if (activity) addActivity(activity);
    });

    socket.on('comment_added', ({ comment, activity }) => {
      if (comment) {
        useBoardStore.getState().setIncomingComment(comment);
      }
      if (activity) addActivity(activity);
    });

    socket.on('attachment_added', ({ activity }) => {
      if (activity) addActivity(activity);
    });

    socket.on('attachment_deleted', ({ activity }) => {
      if (activity) addActivity(activity);
    });

    socket.on('activity_added', (activity) => {
      addActivity(activity);
    });

    socket.on('typing_start', ({ taskId, userId: typingUserId }) => {
      if (typingUserId !== userId) {
        setTyping(taskId, typingUserId, true);
      }
    });

    socket.on('typing_stop', ({ taskId, userId: typingUserId }) => {
      setTyping(taskId, typingUserId, false);
    });

    socket.on('board_refresh_requested', () => {
      refreshBoard();
    });

    return () => {
      socket.emit('leave_board');
      socket.disconnect();
    };
  }, [
    boardId,
    userId,
    addTask,
    updateTaskInStore,
    replaceAllTasks,
    removeTask,
    addActivity,
    updateBoardMembers,
    setOnlineMembers,
    setTyping,
    refreshBoard,
  ]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, emit, refreshBoard };
}
