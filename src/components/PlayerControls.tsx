import { useCallback, useEffect, useRef } from 'react'
import { AudioAnalyzer } from '@/audio/AudioAnalyzer'
import { usePlayerStore } from '@/store/playerStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import ModeSelector from './ModeSelector'

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

interface Props {
  audioRef: React.RefObject<HTMLAudioElement | null>
  analyzerRef: React.RefObject<AudioAnalyzer | null>
}

export default function PlayerControls({ audioRef, analyzerRef }: Props) {
  const {
    track, isPlaying, currentTime, duration, volume,
    setIsPlaying, setCurrentTime, setDuration, setVolume,
    nextTrack, prevTrack,
  } = usePlayerStore()

  const analyzerConnected = useRef(false)

  const ensureAnalyzer = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!analyzerRef.current) analyzerRef.current = new AudioAnalyzer()
    if (!analyzerConnected.current) {
      analyzerRef.current.connect(audio)
      analyzerConnected.current = true
    }
    analyzerRef.current.resume()
  }, [audioRef, analyzerRef])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime  = () => setCurrentTime(audio.currentTime)
    const onDur   = () => setDuration(audio.duration)
    const onEnd   = () => { setIsPlaying(false); nextTrack() }
    const onPlay  = () => { setIsPlaying(true); analyzerRef.current?.resume() }
    const onPause = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [audioRef, analyzerRef, setCurrentTime, setDuration, setIsPlaying, nextTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    audio.src = track.src
    audio.volume = volume
    audio.load()
    ensureAnalyzer()
    audio.play().catch(() => { setIsPlaying(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume, audioRef])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    ensureAnalyzer()
    if (isPlaying) audio.pause()
    else audio.play().catch(() => {})
  }, [audioRef, isPlaying, track, ensureAnalyzer])

  useKeyboardShortcuts(audioRef, togglePlay)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* Top-left: track info */}
      {track && (
        <div style={{ position: 'absolute', top: 32, left: 32, pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {track.coverUrl ? (
              <img
                src={track.coverUrl}
                alt=""
                style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" fill="rgba(255,255,255,0.5)" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            )}
            <div>
              <p style={{
                color: 'white', fontWeight: 600, fontSize: 15,
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {track.name}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                {track.artist}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-center: mode selector */}
      <div style={{
        position: 'absolute', bottom: 140, left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'auto',
      }}>
        <ModeSelector />
      </div>

      {/* Bottom: controls */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 32px 32px',
        pointerEvents: track ? 'auto' : 'none',
      }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="range"
            min={0} max={100}
            value={progress}
            onChange={(e) => {
              const audio = audioRef.current
              if (!audio || !duration) return
              audio.currentTime = (Number(e.target.value) / 100) * duration
            }}
            style={{ width: '100%', height: 3, cursor: 'pointer' }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4,
          }}>
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Buttons row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          {/* Prev / Play / Next */}
          <button
            onClick={prevTrack}
            style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </button>
          <button
            onClick={togglePlay}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'white', color: '#000', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            {isPlaying
              ? <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            }
          </button>
          <button
            onClick={nextTrack}
            style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
            </svg>
          </button>

          {/* Volume — right of next */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" fill="rgba(255,255,255,0.5)" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ width: 80, height: 3, cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
