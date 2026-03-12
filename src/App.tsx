import { useRef } from 'react'
import type { AudioAnalyzer } from '@/audio/AudioAnalyzer'
import VisualizerCanvas from '@/components/VisualizerCanvas'
import UIOverlay from '@/components/UIOverlay'

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyzerRef = useRef<AudioAnalyzer | null>(null)

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />
      <VisualizerCanvas analyzerRef={analyzerRef} />
      <UIOverlay audioRef={audioRef} analyzerRef={analyzerRef} />
    </div>
  )
}
