import { create } from 'zustand';
import { api } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('kanban_user') || 'null'),
  token: localStorage.getItem('kanban_token') || null,
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    localStorage.setItem('kanban_user', JSON.stringify(user));
    localStorage.setItem('kanban_token', token);
    set({ user, token, error: null });
  },

  logout: () => {
    localStorage.removeItem('kanban_user');
    localStorage.removeItem('kanban_token');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.login(email, password);
      get().setAuth(data.user, data.token);
      return data;
    } catch (err) {
      set({ error: err.error || 'Login failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.register(name, email, password);
      get().setAuth(data.user, data.token);
      return data;
    } catch (err) {
      set({ error: err.error || 'Registration failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  googleLogin: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.googleAuth(credential);
      get().setAuth(data.user, data.token);
      return data;
    } catch (err) {
      set({ error: err.error || 'Google sign-in failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const data = await api.getMe();
      set({ user: data.user });
      localStorage.setItem('kanban_user', JSON.stringify(data.user));
    } catch {
      get().logout();
    }
  },

  isAuthenticated: () => !!get().token,
}));
