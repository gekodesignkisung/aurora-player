import * as THREE from 'three'
import type { IVisualMode } from '@/types/visual'
import type { AudioData } from '@/types/audio'

const VERT = /* glsl */`
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const FRAG = /* glsl */`
precision highp float;
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uBeat;
uniform float uCentroid;
uniform vec2 uResolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1,0));
  float c = hash(i + vec2(0,1));
  float d = hash(i + vec2(1,1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * (0.3 + uMid * 0.4);

  float scale = 2.0 + uBass * 3.0;
  vec2 p = (uv - 0.5) * scale;

  float f1 = sin(p.x * 3.0 + t) + sin(p.y * 3.0 + t * 1.3);
  float f2 = sin((p.x + p.y) * 2.5 + t * 0.7);
  float f3 = fbm(p + t * 0.15) * 2.0 - 1.0;

  float plasma = (f1 + f2 + f3) / 3.0;

  float hue = 0.55 + uCentroid * 0.3 + plasma * 0.15;
  float sat = 0.7 + uTreble * 0.3;
  float lum = 0.3 + abs(plasma) * 0.4 + uBass * 0.2;

  // Beat flash
  if (uBeat > 0.1) {
    plasma = 1.0 - plasma;
    lum += uBeat * 0.3;
  }

  // HSL to RGB
  vec3 col;
  float h = fract(hue) * 6.0;
  float c2 = (1.0 - abs(2.0 * lum - 1.0)) * sat;
  float x2 = c2 * (1.0 - abs(mod(h, 2.0) - 1.0));
  float m = lum - c2 / 2.0;
  if (h < 1.0)      col = vec3(c2, x2, 0);
  else if (h < 2.0) col = vec3(x2, c2, 0);
  else if (h < 3.0) col = vec3(0, c2, x2);
  else if (h < 4.0) col = vec3(0, x2, c2);
  else if (h < 5.0) col = vec3(x2, 0, c2);
  else              col = vec3(c2, 0, x2);
  col += m;

  gl_FragColor = vec4(col, 1.0);
}
`

export class PlasmaFlow implements IVisualMode {
  private mesh: THREE.Mesh
  private uniforms: Record<string, THREE.IUniform>

  constructor(scene: THREE.Scene) {
    this.uniforms = {
      uTime:       { value: 0 },
      uBass:       { value: 0 },
      uMid:        { value: 0 },
      uTreble:     { value: 0 },
      uBeat:       { value: 0 },
      uCentroid:   { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
    })

    const geo = new THREE.PlaneGeometry(2, 2)
    this.mesh = new THREE.Mesh(geo, mat)
    scene.add(this.mesh)
  }

  onModeEnter() {
    this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
  }

  update(audio: AudioData, delta: number, elapsed: number) {
    this.uniforms.uTime.value = elapsed
    this.uniforms.uBass.value = audio.bass
    this.uniforms.uMid.value = audio.mid
    this.uniforms.uTreble.value = audio.treble
    this.uniforms.uCentroid.value = audio.spectralCentroid
    if (audio.beat) {
      this.uniforms.uBeat.value = 1.0
    } else {
      this.uniforms.uBeat.value = Math.max(0, this.uniforms.uBeat.value - delta * 4)
    }
  }

  dispose() {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.ShaderMaterial).dispose()
    this.mesh.removeFromParent()
  }
}
