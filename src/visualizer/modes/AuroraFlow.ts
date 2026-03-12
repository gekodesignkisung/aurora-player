import * as THREE from 'three'
import type { IVisualMode } from '@/types/visual'
import type { AudioData } from '@/types/audio'

const VERT = /* glsl */`
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uWaveOff;
varying vec2  vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  float y01 = uv.y;  // 0 = bottom (anchored), 1 = top (waves freely)
  float w1 = sin(pos.x * 0.18 + uTime * 0.9 + uWaveOff) * (1.8 + uBass * 3.5) * y01;
  float w2 = sin(pos.x * 0.45 + uTime * 1.5 + uWaveOff * 1.7) * (0.9 + uMid * 2.0) * y01;
  float w3 = sin(pos.x * 0.08 + uTime * 0.4 + uWaveOff * 0.5) * 1.2 * y01;
  pos.z += w1 + w2 + w3;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const FRAG = /* glsl */`
varying vec2  vUv;
uniform vec3  uColor;
uniform float uAlpha;

void main() {
  // Fade at left/right edges
  float edgeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
  // Bright at bottom, fade at top — classic aurora curtain shape
  float curtain = pow(1.0 - vUv.y, 0.6) * (0.4 + vUv.y * 0.6);
  float alpha = curtain * edgeX * uAlpha;
  gl_FragColor = vec4(uColor, alpha);
}
`

interface Ribbon {
  mesh: THREE.Mesh
  uniforms: Record<string, THREE.IUniform>
}

// 6 ribbons: different Y positions, hue offsets, wave phases
const CONFIGS = [
  { yBottom: -14, h: 14, hueOff: 0.00, waveOff: 0.0, zOff:  0 },
  { yBottom:  -8, h: 10, hueOff: 0.22, waveOff: 1.4, zOff: -3 },
  { yBottom:  -3, h: 12, hueOff: 0.44, waveOff: 2.8, zOff: -6 },
  { yBottom:   2, h:  8, hueOff: 0.66, waveOff: 4.2, zOff: -9 },
  { yBottom:  -6, h:  6, hueOff: 0.12, waveOff: 5.6, zOff: -2 },
  { yBottom:   4, h: 16, hueOff: 0.55, waveOff: 0.7, zOff: -5 },
]

export class AuroraFlow implements IVisualMode {
  private ribbons: Ribbon[] = []
  private scene: THREE.Scene
  private hue = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene

    for (const cfg of CONFIGS) {
      const geo = new THREE.PlaneGeometry(56, cfg.h, 40, 10)
      // Translate so yBottom is the bottom of the ribbon
      geo.translate(0, cfg.yBottom + cfg.h / 2, cfg.zOff)

      const uniforms: Record<string, THREE.IUniform> = {
        uTime:    { value: 0 },
        uBass:    { value: 0 },
        uMid:     { value: 0 },
        uWaveOff: { value: cfg.waveOff },
        uColor:   { value: new THREE.Color().setHSL(cfg.hueOff, 1.0, 0.65) },
        uAlpha:   { value: 0.5 },
      }

      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)
      this.ribbons.push({ mesh, uniforms })
    }
  }

  update(audio: AudioData, delta: number, elapsed: number): void {
    const { bass, mid, treble, beat } = audio

    this.hue = (this.hue + delta * (0.02 + treble * 0.07)) % 1

    for (let i = 0; i < this.ribbons.length; i++) {
      const u = this.ribbons[i].uniforms
      u.uTime.value  = elapsed
      u.uBass.value  = bass
      u.uMid.value   = mid
      u.uAlpha.value = 0.35 + bass * 0.45 + (beat ? 0.15 : 0)
      const h = (this.hue + (i / this.ribbons.length) * 0.6) % 1
      u.uColor.value.setHSL(h, 1.0, 0.6 + bass * 0.2)
    }
  }

  dispose(): void {
    for (const r of this.ribbons) {
      r.mesh.geometry.dispose()
      ;(r.mesh.material as THREE.Material).dispose()
      this.scene.remove(r.mesh)
    }
  }
}
