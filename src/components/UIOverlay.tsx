'use client'
import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useIdleHide } from '@/hooks/useIdleHide'
import type { AudioAnalyzer } from '@/audio/AudioAnalyzer'
import PlayerControls from './PlayerControls'
import MusicPanel from './MusicPanel'
import DropZone from './DropZone'

interface Props {
  audioRef: React.RefObject<HTMLAudioElement | null>
  analyzerRef: React.RefObject<AudioAnalyzer | null>
}

export default function UIOverlay({ audioRef, analyzerRef }: Props) {
  useIdleHide()
  const showUI = useUIStore((s) => s.showUI)
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <>
      <DropZone />
      {/* Panel toggle button — top right */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 20,
          width: 40, height: 40, borderRadius: '50%',
          background: panelOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', transition: 'background 0.2s',
          pointerEvents: 'auto',
        }}
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </button>
      {/* Player controls fade with idle timer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          opacity: showUI ? 1 : 0,
          transition: 'opacity 0.7s',
        }}
      >
        <PlayerControls audioRef={audioRef} analyzerRef={analyzerRef} />
      </div>
      <MusicPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  )
}
