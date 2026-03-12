import * as THREE from 'three'
import type { IVisualMode } from '@/types/visual'
import type { AudioData } from '@/types/audio'

const POOL = 16

interface Ring {
  mesh: THREE.Mesh
  radius: number
  speed: number
  opacity: number
  active: boolean
}

export class PulsarRings implements IVisualMode {
  private rings: Ring[] = []
  private core: THREE.Mesh
  private coreMat: THREE.MeshBasicMaterial
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene

    for (let i = 0; i < POOL; i++) {
      const geo = new THREE.RingGeometry(1, 1.06, 64)
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = Math.PI / 2
      scene.add(mesh)
      this.rings.push({ mesh, radius: 0, speed: 0, opacity: 0, active: false })
    }

    const coreGeo = new THREE.IcosahedronGeometry(1, 1)
    this.coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    this.core = new THREE.Mesh(coreGeo, this.coreMat)
    scene.add(this.core)
  }

  onBeat() {
    // Find idle ring in pool
    const ring = this.rings.find((r) => !r.active)
    if (!ring) return
    ring.active = true
    ring.radius = 1.5
    ring.speed = 6 + Math.random() * 4
    ring.opacity = 0.9
  }

  update(audio: AudioData, delta: number, elapsed: number) {
    const { bass, mid, treble, beat, spectralCentroid } = audio

    if (beat) this.onBeat()

    // Core pulse
    const coreScale = 1 + bass * 0.5
    this.core.scale.setScalar(coreScale)
    this.core.rotation.y = elapsed * 0.8
    this.core.rotation.x = elapsed * 0.5
    const hue = 0.55 + spectralCentroid * 0.3
    this.coreMat.color.setHSL(hue, 1, 0.6 + treble * 0.3)

    for (const ring of this.rings) {
      if (!ring.active) continue
      ring.radius += (ring.speed + bass * 8) * delta
      ring.opacity -= delta * 0.7
      if (ring.opacity <= 0) { ring.active = false; ring.opacity = 0 }

      ring.mesh.scale.setScalar(ring.radius)
      ;(ring.mesh.material as THREE.MeshBasicMaterial).opacity = ring.opacity
      ;(ring.mesh.material as THREE.MeshBasicMaterial).color.setHSL(0.5 + mid * 0.3, 1, 0.6)
    }

    // Gentle ring plane oscillation
    const tiltAngle = Math.PI / 2 + Math.sin(elapsed * 0.3) * 0.2
    for (const ring of this.rings) ring.mesh.rotation.x = tiltAngle
  }

  dispose() {
    for (const r of this.rings) {
      r.mesh.geometry.dispose()
      ;(r.mesh.material as THREE.Material).dispose()
      r.mesh.removeFromParent()
    }
    this.core.geometry.dispose()
    this.coreMat.dispose()
    this.core.removeFromParent()
  }
}
