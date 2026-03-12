import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import type { Track } from '@/types/track'

export default function DropZone() {
  const [active, setActive] = useState(false)
  const addLocalTracks = usePlayerStore((s) => s.addLocalTracks)

  useEffect(() => {
    let enterCount = 0

    const onEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      enterCount++
      setActive(true)
    }
    const onLeave = () => {
      enterCount = Math.max(0, enterCount - 1)
      if (enterCount === 0) setActive(false)
    }
    const onOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      enterCount = 0
      setActive(false)
      const files = e.dataTransfer?.files
      if (!files) return
      const tracks: Track[] = Array.from(files)
        .filter((f) => f.type.startsWith('audio/'))
        .map((f) => ({
          id: `${f.name}-${f.size}`,
          name: f.name.replace(/\.[^/.]+$/, ''),
          artist: 'Local File',
          src: URL.createObjectURL(f),
          duration: 0,
          source: 'local' as const,
        }))
      if (tracks.length > 0) addLocalTracks(tracks)
    }

    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [addLocalTracks])

  if (!active) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.6)',
        border: '3px dashed rgba(255,255,255,0.5)',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="text-center">
        <svg width="48" height="48" fill="rgba(255,255,255,0.7)" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
          <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
        </svg>
        <p className="text-white text-lg font-semibold">드롭해서 음악 추가</p>
        <p className="text-white/50 text-sm mt-1">MP3, WAV, FLAC, AAC, OGG</p>
      </div>
    </div>
  )
}
