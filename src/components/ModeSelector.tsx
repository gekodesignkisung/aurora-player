import { usePlayerStore } from '@/store/playerStore'
import type { VisualMode } from '@/types/visual'

const MODES: { id: VisualMode; label: string; key: string }[] = [
  { id: 'nebula-cloud',    label: 'Nebula',   key: '1' },
  { id: 'star-field',     label: 'Stars',    key: '2' },
  { id: 'crystal-lattice',label: 'Crystal',  key: '3' },
  { id: 'plasma-flow',    label: 'Plasma',   key: '4' },
  { id: 'freq-terrain',   label: 'Terrain',  key: '5' },
  { id: 'morph-blob',     label: 'Blob',     key: '6' },
  { id: 'tunnel-warp',    label: 'Tunnel',   key: '7' },
  { id: 'kaleidoscope',   label: 'Kaleid',   key: '8' },
]

export default function ModeSelector() {
  const { visualMode, setVisualMode } = usePlayerStore()

  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8 }}>
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setVisualMode(m.id)}
          title={`키 ${m.key}`}
          style={{
            padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: visualMode === m.id ? 'white' : 'rgba(255,255,255,0.12)',
            color: visualMode === m.id ? '#000' : 'rgba(255,255,255,0.7)',
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
