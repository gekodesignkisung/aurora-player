import { create } from 'zustand'
import type { GenreId, ThemeId } from '@/api/deezer'

type ActivePanel = 'queue' | 'genres' | null

interface UIState {
  showUI: boolean
  activePanel: ActivePanel
  selectedGenre: GenreId | null
  selectedTheme: ThemeId | null
  error: string | null
  musicPanelOpen: boolean

  setShowUI: (v: boolean) => void
  setActivePanel: (p: ActivePanel) => void
  setGenre: (g: GenreId | null) => void
  setTheme: (t: ThemeId | null) => void
  setError: (msg: string | null) => void
  setMusicPanelOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  showUI: true,
  activePanel: 'genres',
  selectedGenre: 'electro',
  selectedTheme: 'workout',
  error: null,
  musicPanelOpen: false,

  setShowUI: (v) => set({ showUI: v }),
  setActivePanel: (p) => set({ activePanel: p }),
  setGenre: (g) => set({ selectedGenre: g }),
  setTheme: (t) => set({ selectedTheme: t }),
  setError: (msg) => set({ error: msg }),
  setMusicPanelOpen: (v) => set({ musicPanelOpen: v }),
}))
