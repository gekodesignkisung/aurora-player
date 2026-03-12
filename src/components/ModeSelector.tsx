import { usePlayerStore } from '@/store/playerStore'
import type { VisualMode } from '@/types/visual'

const MODES: { id: VisualMode; label: string; key: string }[] = [
  { id: 'nebula-cloud',    label: 'A', key: '1' },
  { id: 'star-field',     label: 'B', key: '2' },
  { id: 'crystal-lattice',label: 'C', key: '3' },
  { id: 'freq-terrain',   label: 'D', key: '4' },
  { id: 'morph-blob',     label: 'E', key: '5' },
  { id: 'tunnel-warp',    label: 'F', key: '6' },
  { id: 'liquid-mercury',       label: 'G', key: '7' },
]

export default function ModeSelector() {
  const { visualMode, setVisualMode } = usePlayerStore()

  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 10, overflow: 'auto' }}>
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setVisualMode(m.id)}
          style={{
            padding: '10px 22px', borderRadius: 50, fontSize: 12, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: visualMode === m.id ? 'white' : 'rgba(255,255,255,0.2)',
            color: visualMode === m.id ? 'black' : 'white',
            fontFamily: 'Inter, -apple-system, sans-serif',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (visualMode !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
          }}
          onMouseLeave={(e) => {
            if (visualMode !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
