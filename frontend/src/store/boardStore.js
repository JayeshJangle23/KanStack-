import { create } from 'zustand';
import { STATUSES } from '../utils/constants';

const initialFilters = {
  priority: '',
  member: '',
  dueDate: '',
  search: '',
};

export const useBoardStore = create((set, get) => ({
  board: null,
  tasks: [],
  activities: [],
  analytics: null,
  onlineMembers: [],
  typingUsers: {},
  filters: { ...initialFilters },
  selectedTask: null,
  isModalOpen: false,
  isLoading: false,
  error: null,
  lastSync: null,
  incomingComment: null,

  setBoard: (board) => set({ board }),
  setIncomingComment: (comment) => set({ incomingComment: comment }),
  clearIncomingComment: () => set({ incomingComment: null }),
  setTasks: (tasks) => set({ tasks, lastSync: Date.now() }),
  setActivities: (activities) => set({ activities }),
  setAnalytics: (analytics) => set({ analytics }),
  setOnlineMembers: (onlineMembers) => set({ onlineMembers }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  resetFilters: () => set({ filters: { ...initialFilters } }),

  openTaskModal: (task) => set({ selectedTask: task, isModalOpen: true }),
  closeTaskModal: () => set({ selectedTask: null, isModalOpen: false }),

  addTask: (task) =>
    set((state) => {
      if (state.tasks.some((t) => t._id === task._id)) return state;
      return { tasks: [...state.tasks, task] };
    }),

  updateTaskInStore: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
      selectedTask:
        state.selectedTask?._id === updatedTask._id ? updatedTask : state.selectedTask,
    })),

  replaceAllTasks: (tasks) => set({ tasks, lastSync: Date.now() }),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== taskId),
      selectedTask: state.selectedTask?._id === taskId ? null : state.selectedTask,
      isModalOpen: state.selectedTask?._id === taskId ? false : state.isModalOpen,
    })),

  addActivity: (activity) =>
    set((state) => {
      if (state.activities.some((a) => a._id === activity._id)) return state;
      return { activities: [activity, ...state.activities].slice(0, 100) };
    }),

  updateBoardMembers: (members) =>
    set((state) => ({
      board: state.board ? { ...state.board, members } : null,
    })),

  setTyping: (taskId, userId, isTyping) =>
    set((state) => {
      const typingUsers = { ...state.typingUsers };
      if (!typingUsers[taskId]) typingUsers[taskId] = new Set();
      else typingUsers[taskId] = new Set(typingUsers[taskId]);

      if (isTyping) typingUsers[taskId].add(userId);
      else typingUsers[taskId].delete(userId);

      if (typingUsers[taskId].size === 0) delete typingUsers[taskId];
      return { typingUsers };
    }),

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    return tasks.filter((task) => {
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.member && task.assignedTo !== filters.member) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description.toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.dueDate) {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate).toDateString();
        const filterDate = new Date(filters.dueDate).toDateString();
        if (taskDate !== filterDate) return false;
      }
      return true;
    });
  },

  getTasksByStatus: (status) => {
    return get()
      .getFilteredTasks()
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  },

  getTasksByColumn: () => {
    const result = {};
    STATUSES.forEach((status) => {
      result[status] = get().getTasksByStatus(status);
    });
    return result;
  },
}));
