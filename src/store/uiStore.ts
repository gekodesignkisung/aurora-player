import { create } from 'zustand'
import type { GenreId } from '@/api/deezer'

type ActivePanel = 'queue' | 'genres' | null

interface UIState {
  showUI: boolean
  activePanel: ActivePanel
  selectedGenre: GenreId | null
  error: string | null

  setShowUI: (v: boolean) => void
  setActivePanel: (p: ActivePanel) => void
  setGenre: (g: GenreId | null) => void
  setError: (msg: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  showUI: true,
  activePanel: 'genres',
  selectedGenre: 'electro',
  error: null,

  setShowUI: (v) => set({ showUI: v }),
  setActivePanel: (p) => set({ activePanel: p }),
  setGenre: (g) => set({ selectedGenre: g }),
  setError: (msg) => set({ error: msg }),
}))
