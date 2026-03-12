import * as THREE from 'three'
import type { IVisualMode } from '@/types/visual'
import type { AudioData } from '@/types/audio'

const FREQ_SEGS = 256
const WAVE_SEGS = 256
const SPARKS    = 80

function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
  return [f(0), f(8), f(4)]
}

export class WaveScope implements IVisualMode {
  private scene: THREE.Scene
  private group: THREE.Group

  // Outer: frequency bars
  private freqGeo: THREE.BufferGeometry
  private freqPos: Float32Array
  private freqCol: Float32Array

  // Inner: waveform loop
  private waveGeo: THREE.BufferGeometry
  private wavePos: Float32Array
  private waveCol: Float32Array

  // Ghost ring: mirrored, slightly scaled freq bars
  private ghostGeo: THREE.BufferGeometry
  private ghostPos: Float32Array
  private ghostCol: Float32Array

  // Center glow
  private glowMesh: THREE.Mesh

  // Beat sparks
  private sparkGeo: THREE.BufferGeometry
  private sparkPos: Float32Array
  private sparkCol: Float32Array
  private sparkVelX: Float32Array
  private sparkVelY: Float32Array
  private sparkLife: Float32Array
  private sparkMat: THREE.PointsMaterial

  private hue = 0
  private beatFlash = 0
  private scopeRot = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.group = new THREE.Group()

    // Frequency bars (outer)
    this.freqPos = new Float32Array(FREQ_SEGS * 2 * 3)
    this.freqCol = new Float32Array(FREQ_SEGS * 2 * 3)
    this.freqGeo = new THREE.BufferGeometry()
    this.freqGeo.setAttribute('position', new THREE.BufferAttribute(this.freqPos, 3))
    this.freqGeo.setAttribute('color',    new THREE.BufferAttribute(this.freqCol, 3))
    this.group.add(new THREE.LineSegments(this.freqGeo, new THREE.LineBasicMaterial({ vertexColors: true })))

    // Ghost freq ring (slightly inner, faint counter-rotation)
    this.ghostPos = new Float32Array(FREQ_SEGS * 2 * 3)
    this.ghostCol = new Float32Array(FREQ_SEGS * 2 * 3)
    this.ghostGeo = new THREE.BufferGeometry()
    this.ghostGeo.setAttribute('position', new THREE.BufferAttribute(this.ghostPos, 3))
    this.ghostGeo.setAttribute('color',    new THREE.BufferAttribute(this.ghostCol, 3))
    const ghostLines = new THREE.LineSegments(this.ghostGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.35 }))
    this.group.add(ghostLines)

    // Waveform ring (inner)
    this.wavePos = new Float32Array((WAVE_SEGS + 1) * 3)
    this.waveCol = new Float32Array((WAVE_SEGS + 1) * 3)
    this.waveGeo = new THREE.BufferGeometry()
    this.waveGeo.setAttribute('position', new THREE.BufferAttribute(this.wavePos, 3))
    this.waveGeo.setAttribute('color',    new THREE.BufferAttribute(this.waveCol, 3))
    this.group.add(new THREE.Line(this.waveGeo, new THREE.LineBasicMaterial({ vertexColors: true })))

    // Center glow disc
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    this.glowMesh = new THREE.Mesh(new THREE.CircleGeometry(0.12, 48), glowMat)
    this.group.add(this.glowMesh)

    // Beat sparks (fly outward from center)
    this.sparkPos  = new Float32Array(SPARKS * 3)
    this.sparkCol  = new Float32Array(SPARKS * 3)
    this.sparkVelX = new Float32Array(SPARKS)
    this.sparkVelY = new Float32Array(SPARKS)
    this.sparkLife = new Float32Array(SPARKS)
    this.sparkGeo  = new THREE.BufferGeometry()
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3))
    this.sparkGeo.setAttribute('color',    new THREE.BufferAttribute(this.sparkCol, 3))
    this.sparkMat = new THREE.PointsMaterial({
      size: 0.025, vertexColors: true, transparent: true,
      opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.group.add(new THREE.Points(this.sparkGeo, this.sparkMat))

    scene.add(this.group)
  }

  private spawnSparks(bass: number) {
    for (let s = 0; s < SPARKS; s++) {
      const angle = (s / SPARKS) * Math.PI * 2 + Math.random() * 0.3
      const speed = 0.6 + Math.random() * 1.2 + bass * 1.0
      this.sparkVelX[s] = Math.cos(angle) * speed
      this.sparkVelY[s] = Math.sin(angle) * speed
      this.sparkPos[s*3]   = 0
      this.sparkPos[s*3+1] = 0
      this.sparkPos[s*3+2] = 0
      this.sparkLife[s] = 1.0
    }
  }

  update(audio: AudioData, delta: number, _elapsed: number): void {
    const { bass, mid, treble, volume, beat, frequencies, waveform } = audio

    if (beat) {
      this.beatFlash = 1.0
      this.hue = (this.hue + 0.15) % 1
      this.spawnSparks(bass)
    } else {
      this.beatFlash = Math.max(0, this.beatFlash - delta * 4)
    }
    this.hue = (this.hue + delta * (0.04 + treble * 0.12)) % 1

    // Scope rotation — faster on beat
    this.scopeRot += delta * (0.08 + mid * 0.3 + this.beatFlash * 0.6)
    this.group.rotation.z = this.scopeRot

    const outerR = 0.72
    const innerR = 0.38
    const ghostR  = 0.60  // ghost ring slightly inside outer

    // Frequency bars
    for (let i = 0; i < FREQ_SEGS; i++) {
      const angle = (i / FREQ_SEGS) * Math.PI * 2 - Math.PI / 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const binIdx = Math.floor((i / FREQ_SEGS) * (frequencies.length || 1))
      const amp = frequencies.length > 0 ? frequencies[binIdx] / 255 : 0
      const barLen = 0.04 + amp * 0.42 + this.beatFlash * 0.05
      const h = (this.hue + amp * 0.25 + i / FREQ_SEGS * 0.5) % 1
      const rgb = hsl2rgb(h, 1.0, 0.5 + amp * 0.3 + this.beatFlash * 0.2)

      const b = i * 2
      this.freqPos[b*3]   = cos * outerR
      this.freqPos[b*3+1] = sin * outerR
      this.freqPos[b*3+2] = 0
      this.freqCol[b*3]   = rgb[0] * 0.35
      this.freqCol[b*3+1] = rgb[1] * 0.35
      this.freqCol[b*3+2] = rgb[2] * 0.35
      this.freqPos[(b+1)*3]   = cos * (outerR + barLen)
      this.freqPos[(b+1)*3+1] = sin * (outerR + barLen)
      this.freqPos[(b+1)*3+2] = 0
      this.freqCol[(b+1)*3]   = rgb[0]
      this.freqCol[(b+1)*3+1] = rgb[1]
      this.freqCol[(b+1)*3+2] = rgb[2]

      // Ghost ring: slightly smaller, complementary hue, inward bars
      const ghostAmp = amp * 0.6
      const ghostLen = 0.02 + ghostAmp * 0.2
      const gh = (h + 0.5) % 1
      const grgb = hsl2rgb(gh, 0.9, 0.35 + ghostAmp * 0.2)
      this.ghostPos[b*3]   = cos * (ghostR + ghostLen)
      this.ghostPos[b*3+1] = sin * (ghostR + ghostLen)
      this.ghostPos[b*3+2] = 0
      this.ghostPos[(b+1)*3]   = cos * ghostR
      this.ghostPos[(b+1)*3+1] = sin * ghostR
      this.ghostPos[(b+1)*3+2] = 0
      this.ghostCol[b*3]   = grgb[0]
      this.ghostCol[b*3+1] = grgb[1]
      this.ghostCol[b*3+2] = grgb[2]
      this.ghostCol[(b+1)*3]   = 0
      this.ghostCol[(b+1)*3+1] = 0
      this.ghostCol[(b+1)*3+2] = 0
    }
    this.freqGeo.attributes.position.needsUpdate  = true
    this.freqGeo.attributes.color.needsUpdate     = true
    this.ghostGeo.attributes.position.needsUpdate = true
    this.ghostGeo.attributes.color.needsUpdate    = true

    // Waveform ring
    for (let i = 0; i <= WAVE_SEGS; i++) {
      const idx = i % WAVE_SEGS
      const angle = (idx / WAVE_SEGS) * Math.PI * 2 - Math.PI / 2
      const wIdx = Math.floor((idx / WAVE_SEGS) * (waveform.length || 1))
      const wSample = waveform.length > 0 ? (waveform[wIdx] / 128 - 1) : 0
      const r = innerR + wSample * 0.12 * (1 + volume * 0.5)
      const h = (this.hue + idx / WAVE_SEGS * 0.4 + 0.5) % 1
      const rgb = hsl2rgb(h, 0.9, 0.55 + Math.abs(wSample) * 0.3 + this.beatFlash * 0.15)
      this.wavePos[i*3]   = Math.cos(angle) * r
      this.wavePos[i*3+1] = Math.sin(angle) * r
      this.wavePos[i*3+2] = 0
      this.waveCol[i*3]   = rgb[0]
      this.waveCol[i*3+1] = rgb[1]
      this.waveCol[i*3+2] = rgb[2]
    }
    this.waveGeo.attributes.position.needsUpdate = true
    this.waveGeo.attributes.color.needsUpdate    = true

    // Center glow
    const gmat = this.glowMesh.material as THREE.MeshBasicMaterial
    this.glowMesh.scale.setScalar((0.05 + bass * 0.12 + this.beatFlash * 0.08) / 0.12)
    const gc = hsl2rgb(this.hue, 1.0, 0.8 + this.beatFlash * 0.2)
    gmat.color.setRGB(gc[0], gc[1], gc[2])
    gmat.opacity = 0.4 + volume * 0.4 + this.beatFlash * 0.2

    // Sparks
    for (let s = 0; s < SPARKS; s++) {
      if (this.sparkLife[s] <= 0) {
        this.sparkPos[s*3] = 9999; this.sparkPos[s*3+1] = 9999
        continue
      }
      this.sparkLife[s] = Math.max(0, this.sparkLife[s] - delta * 2.2)
      this.sparkPos[s*3]   += this.sparkVelX[s] * delta
      this.sparkPos[s*3+1] += this.sparkVelY[s] * delta
      const sh = (this.hue + s / SPARKS * 0.4) % 1
      const srgb = hsl2rgb(sh, 1.0, 0.7)
      this.sparkCol[s*3]   = srgb[0] * this.sparkLife[s]
      this.sparkCol[s*3+1] = srgb[1] * this.sparkLife[s]
      this.sparkCol[s*3+2] = srgb[2] * this.sparkLife[s]
    }
    this.sparkGeo.attributes.position.needsUpdate = true
    this.sparkGeo.attributes.color.needsUpdate    = true
  }

  dispose(): void {
    this.freqGeo.dispose()
    this.ghostGeo.dispose()
    this.waveGeo.dispose()
    this.sparkGeo.dispose()
    this.sparkMat.dispose()
    ;(this.glowMesh.geometry as THREE.BufferGeometry).dispose()
    ;(this.glowMesh.material as THREE.Material).dispose()
    this.scene.remove(this.group)
  }
}
