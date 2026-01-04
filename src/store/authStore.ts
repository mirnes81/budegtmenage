import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
