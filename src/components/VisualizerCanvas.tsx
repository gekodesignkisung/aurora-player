import { useEffect, useRef } from 'react'
import { Renderer } from '@/visualizer/Renderer'
import { usePlayerStore } from '@/store/playerStore'
import type { AudioAnalyzer } from '@/audio/AudioAnalyzer'

interface Props {
  analyzerRef: React.RefObject<AudioAnalyzer | null>
}

export default function VisualizerCanvas({ analyzerRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const visualMode = usePlayerStore((s) => s.visualMode)

  useEffect(() => {
    if (!containerRef.current) return
    const r = new Renderer(containerRef.current, visualMode)
    rendererRef.current = r
    return () => { r.dispose(); rendererRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync analyzer ref into renderer every frame by polling
  useEffect(() => {
    let id: number
    const sync = () => {
      if (rendererRef.current && analyzerRef.current) {
        rendererRef.current.setAnalyzer(analyzerRef.current)
      }
      id = requestAnimationFrame(sync)
    }
    id = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(id)
  }, [analyzerRef])

  // Mode changes
  useEffect(() => {
    rendererRef.current?.setMode(visualMode)
  }, [visualMode])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-black"
      style={{ zIndex: 0 }}
    />
  )
}
