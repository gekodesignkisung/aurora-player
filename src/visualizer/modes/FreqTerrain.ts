import * as THREE from 'three'
import type { IVisualMode } from '@/types/visual'
import type { AudioData } from '@/types/audio'

const COLS = 64
const ROWS = 48
const W = 42
const H = 30

function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
  return [f(0), f(8), f(4)]
}

export class FreqTerrain implements IVisualMode {
  private geo: THREE.BufferGeometry
  private positions: Float32Array
  private colors: Float32Array
  private mesh: THREE.Mesh
  private group: THREE.Group
  private beatFlash = 0

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group()

    const totalVerts = (COLS + 1) * (ROWS + 1)
    this.positions = new Float32Array(totalVerts * 3)
    this.colors    = new Float32Array(totalVerts * 3)

    // Build XY grid — Z will be displaced toward camera each frame
    for (let iy = 0; iy <= ROWS; iy++) {
      for (let ix = 0; ix <= COLS; ix++) {
        const v = iy * (COLS + 1) + ix
        this.positions[v*3]   = -W/2 + (ix / COLS) * W
        this.positions[v*3+1] =  H/2 - (iy / ROWS) * H
        this.positions[v*3+2] = 0
      }
    }

    const indices: number[] = []
    for (let iy = 0; iy < ROWS; iy++) {
      for (let ix = 0; ix < COLS; ix++) {
        const a = iy*(COLS+1)+ix, b = a+1, c = (iy+1)*(COLS+1)+ix, d = c+1
        indices.push(a, b, d, a, d, c)
      }
    }

    this.geo = new THREE.BufferGeometry()
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage))
    this.geo.setAttribute('color',    new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage))
    this.geo.setIndex(indices)

    this.mesh = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
    }))

    this.group.add(this.mesh)
    scene.add(this.group)
  }

  update(audio: AudioData, delta: number, elapsed: number): void {
    const { frequencies, bass, mid, beat } = audio
    const freqLen = frequencies.length

    if (beat) this.beatFlash = 1.0
    else this.beatFlash = Math.max(0, this.beatFlash - delta * 4)

    for (let iy = 0; iy <= ROWS; iy++) {
      const env = Math.sin((iy / ROWS) * Math.PI)  // taper at top/bottom edges
      for (let ix = 0; ix <= COLS; ix++) {
        const v = iy * (COLS + 1) + ix
        const binIdx = freqLen > 0 ? Math.floor((ix / COLS) * Math.min(freqLen-1, 255)) : 0
        const amp = freqLen > 0 ? frequencies[binIdx] / 255 : 0

        // Z displacement toward camera (terrain "mountains" pop toward viewer)
        const travel = Math.sin(iy / ROWS * Math.PI * 3 - elapsed * 2.2 + ix * 0.08)
        this.positions[v*3+2] = (amp * 9 + travel * amp * 3) * env + this.beatFlash * 1.5 * env

        // Color: hue sweeps across X (frequency) + brightness from amplitude
        const h = ((ix / COLS) * 0.65 + elapsed * 0.018 + bass * 0.1) % 1
        const l = 0.12 + amp * 0.68 + this.beatFlash * 0.1
        const [r, g, b] = hsl2rgb(h, 0.95, l)
        this.colors[v*3] = r; this.colors[v*3+1] = g; this.colors[v*3+2] = b
      }
    }

    this.geo.attributes.position.needsUpdate = true
    this.geo.attributes.color.needsUpdate    = true

    // Gentle sway
    this.group.rotation.y = Math.sin(elapsed * 0.12) * 0.25
    this.group.rotation.x = mid * 0.04
  }

  dispose(): void {
    this.geo.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
    this.mesh.removeFromParent()
  }
}
