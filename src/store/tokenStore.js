import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SESSION_KEY = 'product-store-access-token';
const TOKEN_TTL = 2 * 60 * 60 * 1000; // 2 hours

const sessionStorageEngine = {
  getItem: (name) => {
    const item = sessionStorage.getItem(name);
    if (!item) return null;

    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiry) {
      sessionStorage.removeItem(name);
      return null;
    }

    return JSON.stringify({ accessToken: parsed.value });
  },
  setItem: (name, value) => {
    const accessToken = value?.state?.accessToken;
    if (accessToken) {
      sessionStorage.setItem(
        name,
        JSON.stringify({
          value: accessToken,
          expiry: Date.now() + TOKEN_TTL,
        })
      );
    }
  },
  removeItem: (name) => sessionStorage.removeItem(name),
};

export const usetokenStore = create(
  persist(
    (set, get) => ({
      // Token data
      token: null,
      refreshToken: null,
      expiresAt: null,

      // User data
      user: null,

      // Status
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setToken: (token, refreshToken = null, expiresIn = null) => {
        const expiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000).getTime()
          : null;

        set({
          token,
          refreshToken,
          expiresAt,
          isAuthenticated: !!token,
        });
      },

      setUser: (user) => set({ user }),

      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
          isAuthenticated: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      // Check if token is valid and not expired
      isTokenValid: () => {
        const { token, expiresAt } = get();
        if (!token) return false;
        if (!expiresAt) return true; // If no expiry time, assume valid
        return Date.now() < expiresAt;
      },

      // Get valid token (refresh if needed)
      getValidToken: async () => {
        const { token, refreshToken, isTokenValid } = get();

        if (!token) return null;
        if (isTokenValid()) return token;

        // Token is expired, try to refresh
        if (refreshToken) {
          try {
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              get().setToken(data.token, data.refreshToken, data.expiresIn);
              return data.token;
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }

        // Refresh failed, clear auth
        get().clearAuth();
        return null;
      },
    }),
    {
      name: SESSION_KEY,
      storage: sessionStorageEngine,
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
