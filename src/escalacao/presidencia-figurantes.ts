// 👥 FIGURANTES (17/11, Diego: "mais NPCs no mapa no entorno do estádio em dia de jogo" + gente no clube de lazer e na balada).
// Gente PARADA e barata: o mesmo truque da torcida distante das arquibancadas (`presidencia-complexo-torcida.ts`) — um corpo de
// poucas caixas desenhado em LOTE (InstancedMesh). Três desenhos pro grupo inteiro (pele, camisa, calça), sem sombra, nada calculado
// por quadro além de um balanço leve no próprio desenho (shader). Quem anda e tem animação continua sendo o povo de sempre.
// Só cenário: não conta ingresso, não muda público oficial nem renda.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type PoseFigurante = 'pe' | 'sentado' | 'nadando'
export type Figurante = { x: number; y: number; z: number; heading?: number; camisa: string; pose?: PoseFigurante }

const PELES = ['#f1c9a5', '#d9a47c', '#b07a52', '#8a5a3b', '#5e3b26']
const CALCAS = ['#24324a', '#2b2b2b', '#4a4a4a', '#3a2f25', '#5b6b80']
const hash = (n: number) => { let h = Math.imul(n ^ 0x9e3779b9, 2654435761); h ^= h >>> 15; return (h >>> 0) / 4294967296 }

function parte(boxes: [number, number, number, number, number, number][], esfera?: [number, number, number, number]) {
  const gs: THREE.BufferGeometry[] = boxes.map(([w, h, d, x, y, z]) => new THREE.BoxGeometry(w, h, d).translate(x, y, z))
  if (esfera) gs.push(new THREE.SphereGeometry(esfera[0], 6, 4).translate(esfera[1], esfera[2], esfera[3]))
  const g = mergeGeometries(gs.map(x => x.toNonIndexed()), false)!; gs.forEach(x => x.dispose()); return g
}
// corpo em pé (~1,72 m): calça, camisa com braços, cabeça
const GEO = {
  calca: () => parte([[.15, .82, .18, -.09, .41, 0], [.15, .82, .18, .09, .41, 0]]),
  camisa: () => parte([[.42, .58, .24, 0, 1.11, 0], [.11, .52, .13, -.27, 1.08, 0], [.11, .52, .13, .27, 1.08, 0]]),
  pele: () => parte([[.08, .1, .08, 0, 1.45, 0]], [.13, 0, 1.6, 0]),
}

export function criarFigurantes(parent: THREE.Object3D, max: number, nome = 'figurantes') {
  const root = new THREE.Group(); root.name = nome; parent.add(root)
  const uTime = { value: 0 }
  const mat = (cor?: boolean) => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .85, vertexColors: false })
    // balanço leve de quem está em pé esperando (cada um no seu tempo) — custo zero de processador
    m.onBeforeCompile = sh => { sh.uniforms.uTime = uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat fase = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3;\ntransformed.y += sin(uTime * 2.1 + fase) * 0.025 * step(0.4, position.y);\ntransformed.x += sin(uTime * 1.3 + fase) * 0.02 * step(1.0, position.y);\n#endif') }
    void cor; return m
  }
  const partes = (['calca', 'camisa', 'pele'] as const).map(k => {
    const mesh = new THREE.InstancedMesh(GEO[k](), mat(), Math.max(1, max))
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage); mesh.castShadow = false; mesh.receiveShadow = false; mesh.frustumCulled = false
    mesh.count = 0; root.add(mesh); return mesh
  })
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color()
  let n = 0
  function set(lista: readonly Figurante[]) {
    n = Math.min(max, lista.length)
    for (let i = 0; i < n; i++) {
      const f = lista[i], pose = f.pose ?? 'pe'
      // sentado: abaixa o corpo (a calça some no banco) · nadando: só cabeça e ombros fora d'água
      const dy = pose === 'sentado' ? -.42 : pose === 'nadando' ? -1.18 : 0
      p.set(f.x, f.y + dy, f.z); q.setFromAxisAngle(up, f.heading ?? hash(i * 7 + 1) * Math.PI * 2); s.set(1, .92 + hash(i * 3) * .16, 1)
      m.compose(p, q, s)
      partes.forEach(pt => pt.setMatrixAt(i, m))
      partes[0].setColorAt(i, c.set(CALCAS[Math.floor(hash(i * 11) * CALCAS.length)]))
      partes[1].setColorAt(i, c.set(f.camisa))
      partes[2].setColorAt(i, c.set(PELES[Math.floor(hash(i * 13 + 5) * PELES.length)]))
    }
    for (const pt of partes) { pt.count = n; pt.instanceMatrix.needsUpdate = true; if (pt.instanceColor) pt.instanceColor.needsUpdate = true; pt.computeBoundingSphere() }
    root.visible = n > 0
  }
  return {
    root, set, quantos: () => n,
    tempo(t: number) { uTime.value = t },
    mostrar(v: boolean) { root.visible = v && n > 0 },
    inspect: () => ({ quantos: n, max, desenhos: partes.length, triangulos: n * partes.reduce((a, pt) => a + (pt.geometry.getAttribute('position').count / 3), 0) }),
    dispose() { partes.forEach(pt => { pt.geometry.dispose(); (pt.material as THREE.Material).dispose(); pt.dispose() }); root.removeFromParent() },
  }
}
export type Figurantes = ReturnType<typeof criarFigurantes>
