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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <img src="/icon-folder.svg" alt="" style={{ width: 60, height: 60 }} />
        <div>
          <p style={{ color: '#CCCCCC', fontSize: 16, fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif', margin: 0, lineHeight: '30px' }}>
            Drag or click music files
          </p>
          <p style={{ color: '#999999', fontSize: 14, fontWeight: 400, fontFamily: 'Inter, -apple-system, sans-serif', margin: 0, lineHeight: '30px' }}>
            MP3, WAV, FLAC, AAC, OGG
          </p>
        </div>
      </div>
    </div>
  )
}
