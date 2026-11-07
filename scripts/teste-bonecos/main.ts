// 🧍 Bancada (07/11): os 6 bonecos 3D do mapa lado a lado, na pose parada (Idle) — foto pro Diego escolher.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const arqs = ['Casual_Male', 'Casual_Female', 'Fuller_Man', 'Fuller_Woman', 'oldclassy_male', 'oldclassy_female']
const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c') as HTMLCanvasElement, antialias: true })
r.setClearColor(0xF4ECD6)
const cena = new THREE.Scene()
cena.add(new THREE.HemisphereLight(0xffffff, 0x777766, 2.2)); const sol = new THREE.DirectionalLight(0xffffff, 1.6); sol.position.set(3, 6, 5); cena.add(sol)
const cam = new THREE.PerspectiveCamera(30, 1500 / 560, 0.1, 100); cam.position.set(0, 1.0, 6.6); cam.lookAt(0, 0.92, 0)
const loader = new GLTFLoader()
const mix: THREE.AnimationMixer[] = []
await Promise.all(arqs.map(async (a, i) => {
  const g = await loader.loadAsync(new URL(`../../src/escalacao/cidade3d/assets/${a}.glb`, import.meta.url).href)
  const o = g.scene; const box = new THREE.Box3().setFromObject(o); const h = box.max.y - box.min.y
  const s = 1.8 / h; o.scale.setScalar(s); o.position.set((i - 2.5) * 1.45, -box.min.y * s, 0); cena.add(o)
  const m = new THREE.AnimationMixer(o); const idle = g.animations.find(c => c.name === 'Idle') ?? g.animations[0]; if (idle) m.clipAction(idle).play(); m.update(0.5); mix.push(m)
}))
r.render(cena, cam)
;(window as unknown as { pronto: boolean }).pronto = true
