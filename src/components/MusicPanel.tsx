import { useState, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { useUIStore } from '@/store/uiStore'
import { useResponsive } from '@/hooks/useResponsive'
import { GENRES, THEMES, type GenreId, type ThemeId } from '@/api/deezer'
import type { Track } from '@/types/track'

interface Props {
  open: boolean
  onClose: () => void
}

// Figma design tokens (node 3-23)
const S = {
  colorText:          '#CCCCCC',
  colorSub:           '#999999',
  colorBg:            '#000000',
  font:               'Inter, -apple-system, sans-serif',
  pad:                30,
  gap:                30,
  tagRadius:          50,
  tagPadH:            15,
  tagPadV:            7,
  tagFontSize:        14,
  tagFontWeight:      600,
  trackTitleSize:     16,
  trackTitleWeight:   600,
  trackArtistSize:    14,
  trackArtistWeight:  500,
  trackGap:           30,
  playRowHeight:      60,
  playRowRadius:      500,
}

export default function MusicPanel({ open, onClose }: Props) {
  const [dragging, setDragging] = useState(false)
  const [tab, setTab] = useState<'genre' | 'theme' | 'local'>('genre')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isMobile } = useResponsive()

  const {
    track: currentTrack, playlist, jamendoQueue,
    setTrack, setIsPlaying,
    addLocalTracks, startGenreStream, startThemeStream, isLoadingJamendo,
  } = usePlayerStore()
  const { selectedGenre, setGenre, selectedTheme, setTheme: setSelectedTheme } = useUIStore()

  const allTracks: Track[] = tab === 'local' ? playlist : jamendoQueue

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|flac|aac|ogg|m4a|opus|wma|aiff?)$/i.test(f.name))
    if (arr.length === 0) return
    const tracks: Track[] = arr.map((f) => ({
      id: `${f.name}-${f.size}`,
      name: f.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local File',
      src: URL.createObjectURL(f),
      duration: 0,
      source: 'local' as const,
    }))
    addLocalTracks(tracks)
    onClose()
  }, [addLocalTracks, onClose])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  const hov = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.opacity = '0.6' },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.opacity = '1' },
    onMouseDown:  (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.opacity = '1' },
    onMouseUp:    (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.opacity = '0.6' },
  }

  const panelW: number | string = isMobile ? '100%' : 400
  const canPlay = (tab === 'genre' && !!selectedGenre) || (tab === 'theme' && !!selectedTheme)
  const handlePlay = () => {
    if (tab === 'genre' && selectedGenre) { startGenreStream(selectedGenre); onClose() }
    if (tab === 'theme' && selectedTheme) { startThemeStream(selectedTheme); onClose() }
  }

  return (
    <>
      {/* Backdrop — covers right side (panel opens from left) */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, bottom: 0,
            left: isMobile ? 0 : 400, right: 0,
            zIndex: 39, pointerEvents: 'auto',
          }}
        />
      )}

      {/* Panel — slides from left */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: panelW,
        background: S.colorBg,
        zIndex: 40, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        pointerEvents: 'auto',
        fontFamily: S.font,
        overflow: 'hidden',
      }}>

        {/* ── 고정 상단 영역 ── */}
        <div style={{ flexShrink: 0, padding: S.pad, paddingBottom: 0, display: 'flex', flexDirection: 'column', gap: S.gap }}>

          {/* Logo + Close button */}
          <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/logo-aurora.svg" alt="aurora" style={{ height: 50 }} />
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'opacity 0.15s', marginBottom: 10 }}
              {...hov}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="2" strokeLinecap="round">
                <line x1="7" y1="7" x2="17" y2="17"/>
                <line x1="17" y1="7" x2="7" y2="17"/>
              </svg>
            </button>
          </div>

          {/* Navigation: Genre / Theme / Local */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {(['genre', 'theme', 'local'] as const).map((id) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: S.colorText, fontSize: 16, fontWeight: 700, fontFamily: S.font,
                  opacity: tab === id ? 1 : 0.4,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = tab === id ? '0.6' : '0.7' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = tab === id ? '1' : '0.4' }}
                onMouseDown={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseUp={(e) => { e.currentTarget.style.opacity = tab === id ? '0.6' : '0.7' }}
              >
                {id === 'genre' ? 'Genre' : id === 'theme' ? 'Theme' : 'Local'}
              </button>
            ))}
          </div>

          {/* Genre tags */}
          {tab === 'genre' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GENRES.map((g) => {
                const active = selectedGenre === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => setGenre(g.id as GenreId)}
                    style={{
                      padding: `${S.tagPadV}px ${S.tagPadH}px`,
                      borderRadius: S.tagRadius,
                      fontSize: S.tagFontSize, fontWeight: S.tagFontWeight, fontFamily: S.font,
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? S.colorText : 'rgba(204,204,204,0.20)',
                      color: active ? '#000000' : S.colorText,
                    }}
                    {...hov}
                  >
                    {g.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Theme tags */}
          {tab === 'theme' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {THEMES.map((t) => {
                const active = selectedTheme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id as ThemeId)}
                    style={{
                      padding: `${S.tagPadV}px ${S.tagPadH}px`,
                      borderRadius: S.tagRadius,
                      fontSize: S.tagFontSize, fontWeight: S.tagFontWeight, fontFamily: S.font,
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? S.colorText : 'rgba(204,204,204,0.20)',
                      color: active ? '#000000' : S.colorText,
                    }}
                    {...hov}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Local file upload */}
          {tab === 'local' && (
            <div>
              <label
                htmlFor="music-file-input"
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, height: 200,
                  border: `2px dashed ${dragging ? '#999999' : '#666666'}`,
                  borderRadius: 20,
                  background: dragging ? 'rgba(255,255,255,0.03)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <img src="/icon-folder.svg" alt="" style={{ width: 60, height: 60 }} />
                <div style={{ opacity: 0.6, textAlign: 'center' }}>
                  <p style={{ color: '#CCCCCC', fontSize: 14, fontWeight: 600, fontFamily: S.font, margin: 0, lineHeight: '22.4px' }}>
                    음악 파일들을 드래그하거나 클릭
                  </p>
                  <p style={{ color: '#555555', fontSize: 14, fontWeight: 600, fontFamily: S.font, margin: 0, lineHeight: '22.4px' }}>
                    MP3, WAV, FLAC, AAC, OGG
                  </p>
                </div>
              </label>
              <input
                id="music-file-input" ref={fileInputRef}
                type="file" accept="audio/*" multiple
                onChange={onFileChange}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
              />
            </div>
          )}

          {/* Play button */}
          {(tab === 'genre' || tab === 'theme') && (
            <button
              onClick={handlePlay}
              disabled={!canPlay || isLoadingJamendo}
              style={{
                height: S.playRowHeight, borderRadius: S.playRowRadius,
                border: '2px solid #CCCCCC', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                paddingTop: 21, paddingBottom: 21, paddingLeft: 22, paddingRight: 22, gap: 10,
                cursor: canPlay && !isLoadingJamendo ? 'pointer' : 'default',
                opacity: canPlay && !isLoadingJamendo ? 1 : 0.3,
                transition: 'transform 0.15s, opacity 0.15s',
              }}
              onMouseEnter={(e) => { if (canPlay && !isLoadingJamendo) e.currentTarget.style.opacity = '0.6' }}
            onMouseLeave={(e) => { if (canPlay && !isLoadingJamendo) e.currentTarget.style.opacity = '1' }}
            onMouseDown={(e) => { if (canPlay && !isLoadingJamendo) e.currentTarget.style.opacity = '1' }}
            onMouseUp={(e) => { if (canPlay && !isLoadingJamendo) e.currentTarget.style.opacity = '0.6' }}
            >
              {isLoadingJamendo
                ? <span style={{ color: S.colorText, fontSize: 13, fontFamily: S.font }}>Loading…</span>
                : <img src="/icon-play-list.svg" alt="play" style={{ width: 30, height: 30 }} />
              }
            </button>
          )}
        </div>

        {/* ── 스크롤 하단 영역 ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: S.pad, display: 'flex', flexDirection: 'column', gap: S.gap }}>

          {/* Track list */}
          {allTracks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: S.trackGap }}>
              {allTracks.map((t) => {
                const isCurrent = currentTrack?.id === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => { setTrack(t); setIsPlaying(true); onClose() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.15s', borderRadius: 8, padding: '6px 8px', margin: '-6px -8px', background: isCurrent ? 'rgba(153,153,153,0.2)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'rgba(153,153,153,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isCurrent ? 'rgba(153,153,153,0.2)' : 'transparent' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        color: isCurrent ? '#ffffff' : S.colorText,
                        fontSize: S.trackTitleSize, fontWeight: S.trackTitleWeight, fontFamily: S.font,
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {t.name}
                      </p>
                      <p style={{
                        color: S.colorSub,
                        fontSize: S.trackArtistSize, fontWeight: S.trackArtistWeight, fontFamily: S.font,
                        margin: '4px 0 0',
                      }}>
                        {t.artist}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {allTracks.length === 0 && tab !== 'local' && (
            <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13, fontFamily: S.font, margin: 0 }}>
              {tab === 'genre' ? 'Genre를 선택 후 재생하세요' : 'Theme를 선택 후 재생하세요'}
            </p>
          )}

        </div>

      </div>
    </>
  )
}
