import { GENRES, type GenreId } from '@/api/jamendo'
import { useUIStore } from '@/store/uiStore'
import { usePlayerStore } from '@/store/playerStore'

export default function GenreSelector() {
  const { selectedGenre, setGenre } = useUIStore()
  const { startGenreStream, isLoadingJamendo, track } = usePlayerStore()

  const handleStream = () => {
    if (!selectedGenre) return
    startGenreStream(selectedGenre)
  }

  if (track) return null  // collapse when a track is playing

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 pointer-events-auto">
      <p className="text-white/40 text-sm">장르를 선택하고 스트리밍을 시작하세요</p>

      {/* Genre grid */}
      <div className="flex flex-wrap gap-3 justify-center max-w-sm">
        {GENRES.map((g) => (
          <button
            key={g.id}
            onClick={() => setGenre(g.id as GenreId)}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background: selectedGenre === g.id ? 'white' : 'rgba(255,255,255,0.1)',
              color: selectedGenre === g.id ? '#000' : 'rgba(255,255,255,0.75)',
              border: selectedGenre === g.id ? 'none' : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Stream button */}
      <button
        onClick={handleStream}
        disabled={!selectedGenre || isLoadingJamendo}
        className="px-10 py-3 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-40"
        style={{
          background: 'white',
          color: '#000',
          boxShadow: '0 0 30px rgba(255,255,255,0.3)',
        }}
      >
        {isLoadingJamendo ? '로딩 중…' : '▶ 스트리밍 시작'}
      </button>

      <p className="text-white/25 text-xs">또는 파일을 드래그해서 로컬 음악 재생</p>
    </div>
  )
}
