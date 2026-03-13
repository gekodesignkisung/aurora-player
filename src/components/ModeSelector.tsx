import { usePlayerStore } from '@/store/playerStore'
import { useResponsive } from '@/hooks/useResponsive'
import type { VisualMode } from '@/types/visual'

const MODES: { id: VisualMode; label: string; key: string }[] = [
  { id: 'nebula-cloud',    label: 'Nebula Cloud', key: '1' },
  { id: 'star-field',     label: 'Star Field', key: '2' },
  { id: 'crystal-lattice',label: 'Crystal Lattice', key: '3' },
  { id: 'freq-terrain',   label: 'Freq Terrain', key: '4' },
  { id: 'morph-blob',     label: 'Morph Blob', key: '5' },
  { id: 'tunnel-warp',    label: 'Tunnel Warp', key: '6' },
  { id: 'liquid-mercury',       label: 'Liquid Mercury', key: '7' },
]

export default function ModeSelector() {
  const { visualMode, setVisualMode } = usePlayerStore()
  const { isMobile } = useResponsive()

  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: isMobile ? 7 : 10, overflow: 'visible', alignItems: isMobile ? 'flex-end' : 'flex-start', justifyContent: 'center', paddingTop: 8 }}>
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setVisualMode(m.id)}
          style={{
            padding: isMobile ? '22px 10px' : '10px 22px',
            paddingTop: isMobile ? '22px' : '12px',
            borderRadius: isMobile ? 0 : 50,
            fontSize: 12,
            fontWeight: 400,
            ...(isMobile
              ? {
                  border: 'none',
                  borderTop: '2px solid' + (visualMode === m.id ? ' #fff' : ' transparent'),
                  lineHeight: '1.2',
                }
              : {
                  border: visualMode === m.id ? '2px solid #ddd' : '2px solid transparent',
                }),
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: 'transparent',
            color: visualMode === m.id ? '#ddd' : '#ffffff',
            fontFamily: 'Inter, -apple-system, sans-serif',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            writingMode: isMobile ? 'vertical-rl' : 'horizontal-tb',
            textOrientation: isMobile ? 'mixed' : 'mixed',
            transform: isMobile ? 'rotate(180deg)' : 'none',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => {
            if (!isMobile && visualMode !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.4)'
          }}
          onMouseLeave={(e) => {
            if (!isMobile) e.currentTarget.style.background = 'transparent'
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
