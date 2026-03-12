import * as THREE from 'three'
import type { IVisualMode } from '@/types/visual'
import type { AudioData } from '@/types/audio'

const FOLDS = 8
const BARS  = 64
// Each fold: BARS forward bars + BARS mirror bars = 2*BARS bars
// Each bar: 2 verts (inner, outer)
// Total verts = FOLDS * 2 * BARS * 2
const TOTAL_VERTS = FOLDS * 2 * BARS * 2

function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
  return [f(0), f(8), f(4)]
}

export class Kaleidoscope implements IVisualMode {
  private scene: THREE.Scene
  private group: THREE.Group
  private geo: THREE.BufferGeometry
  private positions: Float32Array
  private colors: Float32Array
  private hue = 0
  private rotation = 0
  private beatFlash = 0
  private glowMat: THREE.MeshBasicMaterial

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.group = new THREE.Group()

    this.positions = new Float32Array(TOTAL_VERTS * 3)
    this.colors    = new Float32Array(TOTAL_VERTS * 3)

    this.geo = new THREE.BufferGeometry()
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage))
    this.geo.setAttribute('color',    new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage))
    this.group.add(new THREE.LineSegments(this.geo, new THREE.LineBasicMaterial({ vertexColors: true })))

    // Center glow
    this.glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
    this.group.add(new THREE.Mesh(new THREE.CircleGeometry(0.03, 32), this.glowMat))

    scene.add(this.group)
  }

  update(audio: AudioData, delta: number, _elapsed: number): void {
    const { frequencies, bass, mid, treble, beat } = audio
    const freqLen = frequencies.length

    if (beat) { this.beatFlash = 1.0; this.hue = (this.hue + 0.2) % 1 }
    else this.beatFlash = Math.max(0, this.beatFlash - delta * 3.5)
    this.hue = (this.hue + delta * (0.05 + treble * 0.15)) % 1

    this.rotation += delta * (0.08 + mid * 0.35 + this.beatFlash * 0.5)
    this.group.rotation.z = this.rotation

    const wedge = (Math.PI * 2) / FOLDS

    for (let fold = 0; fold < FOLDS; fold++) {
      const foldBase = fold * wedge

      for (let i = 0; i < BARS; i++) {
        const binIdx = freqLen > 0 ? Math.floor((i / BARS) * Math.min(freqLen-1, 255)) : 0
        const amp    = freqLen > 0 ? frequencies[binIdx] / 255 : 0
        const inner  = 0.06
        const outer  = inner + amp * 0.78 + this.beatFlash * 0.04

        const localAngle = (i / (BARS - 1)) * wedge
        const angleF = foldBase + localAngle
        const angleM = foldBase + (wedge - localAngle)   // mirror across fold bisector

        const h    = (this.hue + (fold / FOLDS) * 0.5 + amp * 0.25) % 1
        const rgb  = hsl2rgb(h, 1.0, 0.45 + amp * 0.4 + this.beatFlash * 0.15)
        const dim  = 0.25  // inner point brightness multiplier

        // vertex layout: (fold * BARS * 2 + half * BARS + i) * 2 = pair start
        const bF = (fold * BARS * 2 + i) * 2
        const bM = (fold * BARS * 2 + BARS + i) * 2

        for (const [bi, angle] of [[bF, angleF], [bM, angleM]] as [number, number][]) {
          const cos = Math.cos(angle), sin = Math.sin(angle)
          this.positions[bi*3]     = cos * inner;   this.positions[bi*3+1]     = sin * inner;   this.positions[bi*3+2]     = 0
          this.positions[(bi+1)*3] = cos * outer;   this.positions[(bi+1)*3+1] = sin * outer;   this.positions[(bi+1)*3+2] = 0
          this.colors[bi*3]     = rgb[0]*dim; this.colors[bi*3+1]     = rgb[1]*dim; this.colors[bi*3+2]     = rgb[2]*dim
          this.colors[(bi+1)*3] = rgb[0];     this.colors[(bi+1)*3+1] = rgb[1];     this.colors[(bi+1)*3+2] = rgb[2]
        }
      }
    }

    this.geo.attributes.position.needsUpdate = true
    this.geo.attributes.color.needsUpdate    = true

    const gc = hsl2rgb(this.hue, 1.0, 0.85)
    this.glowMat.color.setRGB(gc[0], gc[1], gc[2])
    const glowScale = (1 + bass * 3 + this.beatFlash * 2) / 0.03
    ;(this.group.children[1] as THREE.Mesh).scale.setScalar(glowScale)
  }

  dispose(): void {
    this.geo.dispose()
    this.glowMat.dispose()
    this.scene.remove(this.group)
  }
}
