// ⚡ RAIO RÁPIDO (25/10, Diego: *"senti que tá travando… não quero que perca qualidade… nada preso, o boneco não pode ir sempre
// no mesmo local"*). O mapa confere por onde cada pessoa pode andar disparando raios contra o chão do bairro — milhares de raios,
// e cada um testava TODOS os triângulos da malha (medido: ~9 s de trava no celular a cada apito). Com o índice espacial
// (three-mesh-bvh) cada raio só testa os triângulos perto dele: o RESULTADO é o mesmo (mesmos pontos, mesmas rotas, nada fica
// pré-gravado), só chega muito mais rápido. Não muda desenho, malha nem qualidade.
import * as THREE from 'three'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh'

const prontos = new WeakSet<THREE.BufferGeometry>()
/** liga o raio rápido nestas malhas (as instanciadas e as com esqueleto ficam como estão) */
export function acelerarRaios(malhas: readonly THREE.Object3D[]): void {
  for (const m of malhas) {
    if (!(m instanceof THREE.Mesh) || m instanceof THREE.InstancedMesh || (m as THREE.SkinnedMesh).isSkinnedMesh) continue
    const g = m.geometry as THREE.BufferGeometry & { boundsTree?: MeshBVH }
    if (!g?.attributes?.position || g.morphAttributes?.position?.length) continue
    if (!prontos.has(g)) {
      // `indirect`: não reordena o índice da malha (o desenho e qualquer leitura de face continuam iguais)
      try { g.boundsTree = new MeshBVH(g, { indirect: true }); prontos.add(g) } catch { continue }
    }
    m.raycast = acceleratedRaycast
  }
}
