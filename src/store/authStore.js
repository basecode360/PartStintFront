// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // eBay connection state
      ebayConnected: false,
      ebayToken: null,
      ebayTokenExpires: null,

      // Actions
      setUser: (user) => set({ user }),

      setToken: (token) =>
        set({
          token,
          isAuthenticated: !!token,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setEbayConnection: (connected, token = null, expires = null) =>
        set({
          ebayConnected: connected,
          ebayToken: token,
          ebayTokenExpires: expires,
        }),

      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({
              error: data.message,
              isLoading: false,
            });
            return { success: false, error: data.message };
          }
        } catch (error) {
          const errorMessage = 'Login failed. Please try again.';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Register action
      register: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({
              error: data.message,
              isLoading: false,
            });
            return { success: false, error: data.message };
          }
        } catch (error) {
          const errorMessage = 'Registration failed. Please try again.';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          ebayConnected: false,
          ebayToken: null,
          ebayTokenExpires: null,
          error: null,
        });
      },

      // Check if user is authenticated
      checkAuth: () => {
        const { token, user } = get();
        return !!(token && user);
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        ebayConnected: state.ebayConnected,
        ebayToken: state.ebayToken,
        ebayTokenExpires: state.ebayTokenExpires,
      }),
    }
  )
);

export default useAuthStore;
