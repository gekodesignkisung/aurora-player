import { usePlayerStore } from '@/store/playerStore'
import { useUIStore } from '@/store/uiStore'
import { GENRES, type GenreId } from '@/api/jamendo'
import type { Track } from '@/types/track'

export default function QueuePanel() {
  const { activePanel, setActivePanel, selectedGenre, setGenre } = useUIStore()
  const { track, playlist, jamendoQueue, setTrack, addLocalTracks, startGenreStream, isLoadingJamendo } = usePlayerStore()

  const fileInputRef = { current: null as HTMLInputElement | null }
  const open = activePanel === 'queue'

  const allTracks = [...playlist, ...jamendoQueue]

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
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
    addLocalTracks(tracks)
    e.target.value = ''
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setActivePanel(open ? null : 'queue')}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
        title="큐 / 파일 추가"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
        </svg>
      </button>

      {/* Slide-in panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-80 flex flex-col transition-transform duration-300"
        style={{
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          zIndex: 50,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-white font-semibold text-sm">큐 & 파일</span>
          <button onClick={() => setActivePanel(null)} className="text-white/40 hover:text-white transition-colors">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Genre stream section */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Jamendo 스트리밍</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGenre(g.id as GenreId)}
                className="px-3 py-1 rounded-full text-xs transition-all duration-150"
                style={{
                  background: selectedGenre === g.id ? 'white' : 'rgba(255,255,255,0.08)',
                  color: selectedGenre === g.id ? '#000' : 'rgba(255,255,255,0.6)',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => selectedGenre && startGenreStream(selectedGenre)}
            disabled={!selectedGenre || isLoadingJamendo}
            className="w-full py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: 'white', color: '#000' }}
          >
            {isLoadingJamendo ? '로딩…' : '▶ 스트리밍 시작'}
          </button>
        </div>

        {/* Local file add */}
        <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 rounded-lg text-xs font-medium text-white/60 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.15)' }}
          >
            + 로컬 파일 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Track list */}
        <div className="flex-1 overflow-y-auto">
          {allTracks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/25 text-xs">
              트랙이 없습니다
            </div>
          ) : (
            allTracks.map((t) => (
              <div
                key={t.id}
                onClick={() => { setTrack(t); setActivePanel(null) }}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                style={{ background: track?.id === t.id ? 'rgba(255,255,255,0.07)' : undefined }}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-white/40"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {track?.id === t.id ? (
                    <div className="flex gap-0.5 items-end h-4">
                      {[1, 1.5, 0.8, 1.3].map((h, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-white rounded-sm"
                          style={{
                            height: `${h * 8}px`,
                            animation: `bar-bounce 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: track?.id === t.id ? 'white' : 'rgba(255,255,255,0.7)' }}
                  >
                    {t.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {t.artist}
                    {t.source === 'jamendo' && <span className="ml-1 opacity-50">· Jamendo</span>}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
