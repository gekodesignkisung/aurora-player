'use client'
import { useUIStore } from '@/store/uiStore'
import { useIdleHide } from '@/hooks/useIdleHide'
import { useResponsive } from '@/hooks/useResponsive'
import type { AudioAnalyzer } from '@/audio/AudioAnalyzer'
import PlayerControls from './PlayerControls'
import MusicPanel from './MusicPanel'
import DropZone from './DropZone'

interface Props {
  audioRef: React.RefObject<HTMLAudioElement | null>
  analyzerRef: React.RefObject<AudioAnalyzer | null>
}

export default function UIOverlay({ audioRef, analyzerRef }: Props) {
  useIdleHide(6000)
  const { isMobile } = useResponsive()
  const showUI = useUIStore((s) => s.showUI)
  const musicPanelOpen = useUIStore((s) => s.musicPanelOpen)
  const setMusicPanelOpen = useUIStore((s) => s.setMusicPanelOpen)

  const buttonSize = isMobile ? 56 : 72
  const buttonPosition = isMobile ? '16px' : '50px'

  return (
    <>
      <DropZone />
      {/* Panel toggle button — top right */}
      <button
        onClick={() => setMusicPanelOpen(!musicPanelOpen)}
        style={{
          position: 'fixed', top: buttonPosition, right: buttonPosition, zIndex: 20,
          width: buttonSize, height: buttonSize, borderRadius: '50%',
          background: 'none',
          border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', transition: 'background 0.2s',
          pointerEvents: 'auto',
          padding: 0,
        }}
      >
        <img src="/icon-menu.svg" alt="menu" style={{ width: buttonSize, height: buttonSize }} />
      </button>
      {/* Player controls fade with idle timer */}
      <div style={{ display: showUI ? 'block' : 'none' }}>
        <PlayerControls audioRef={audioRef} analyzerRef={analyzerRef} />
      </div>
      <MusicPanel open={musicPanelOpen} onClose={() => setMusicPanelOpen(false)} />
    </>
  )
}
