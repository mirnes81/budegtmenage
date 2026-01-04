import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  darkMode: boolean
  toggleDarkMode: () => void
  currentPage: string
  setCurrentPage: (page: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      darkMode: true,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    {
      name: 'app-storage',
    }
  )
);
