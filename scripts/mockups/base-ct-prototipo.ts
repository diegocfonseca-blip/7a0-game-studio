// 🧪 SÓ MOCKUP (04/11): Campinho da Base + CT de Treinamento atrás do estádio, pra o Diego aprovar o lugar e os 3 níveis.
// Não entra no jogo: é importado pela bancada (scripts/mockups/foto-base-ct.cjs) e pendurado na cena do mapa 3D da QA.
// Medidas em metros, iguais às do mapa: o campo da base tem o tamanho do campo do Grêmio Esportivo Campo Grande (55×35).
import * as T from 'three'

export type NivelObra = 0 | 1 | 2 | 3
export type PedidoBaseCT = {
  base?: { x: number; z: number; nivel: NivelObra }
  ct?: { x: number; z: number; nivel: NivelObra }
  grade?: boolean
  /** some com as árvores do bosque dentro destes retângulos [minX,maxX,minZ,maxZ] */
  limpa?: [number, number, number, number][]
  /** cor do clube (logo do CT, uniforme da garotada) */
  cor?: string
  cor2?: string
  clube?: string
}

const mats = new Map<string, T.Material>()
const m = (c: string, r = .85) => { const k = c + r; let x = mats.get(k); if (!x) { x = new T.MeshStandardMaterial({ color: c, roughness: r }); mats.set(k, x) } return x }

function caixa(g: T.Object3D, c: string, w: number, h: number, d: number, x: number, y: number, z: number, ry = 0) {
  const o = new T.Mesh(new T.BoxGeometry(w, h, d), m(c)); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; g.add(o); return o
}
function chao(g: T.Object3D, c: string, w: number, d: number, x: number, z: number, y = .2) {
  const o = new T.Mesh(new T.PlaneGeometry(w, d), m(c, .95)); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); o.receiveShadow = true; g.add(o); return o
}
function texto(g: T.Object3D, s: string, w: number, h: number, x: number, y: number, z: number, bg: string, fg: string, deitado = false) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * h / w); const c = cv.getContext('2d')!
  c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = fg; c.font = `900 ${Math.round(cv.height * .62)}px Oswald, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, cv.width / 2, cv.height * .54, cv.width - 16)
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace
  const o = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, toneMapped: false })); o.position.set(x, y, z); if (deitado) o.rotation.x = -Math.PI / 2; g.add(o); return o
}
// linhas do campo desenhadas numa textura (barato e nítido de cima)
function gramado(g: T.Object3D, L: number, W: number, x: number, z: number, tipo: 'terra' | 'grama' | 'bom', y = .24) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.round(1024 * W / L); const c = cv.getContext('2d')!
  const sx = cv.width / L
  if (tipo === 'terra') { c.fillStyle = '#a9794b'; c.fillRect(0, 0, cv.width, cv.height); for (let i = 0; i < 900; i++) { c.fillStyle = i % 2 ? '#9a6b40' : '#b98a5a'; c.fillRect(Math.random() * cv.width, Math.random() * cv.height, 6, 4) } for (let i = 0; i < 40; i++) { c.fillStyle = '#6f8a3c'; c.beginPath(); c.arc(Math.random() < .5 ? Math.random() * 60 : cv.width - Math.random() * 60, Math.random() * cv.height, 8 + Math.random() * 14, 0, 7); c.fill() } }
  else { const n = tipo === 'bom' ? 12 : 8; for (let i = 0; i < n; i++) { c.fillStyle = tipo === 'bom' ? (i % 2 ? '#3f8f3a' : '#4aa043') : (i % 2 ? '#5d8f3e' : '#6a9a45'); c.fillRect(i * cv.width / n, 0, cv.width / n + 1, cv.height) } if (tipo === 'grama') for (let i = 0; i < 60; i++) { c.fillStyle = '#8a7a4a'; c.beginPath(); c.arc(cv.width / 2 + (Math.random() - .5) * 200, cv.height / 2 + (Math.random() - .5) * 120, 6 + Math.random() * 10, 0, 7); c.fill() } }
  c.strokeStyle = tipo === 'terra' ? '#efe2c8' : '#ffffff'; c.lineWidth = tipo === 'terra' ? 3 : 4
  const p = 1.2 * sx
  c.strokeRect(p, p, cv.width - 2 * p, cv.height - 2 * p); c.beginPath(); c.moveTo(cv.width / 2, p); c.lineTo(cv.width / 2, cv.height - p); c.stroke()
  c.beginPath(); c.arc(cv.width / 2, cv.height / 2, 6 * sx, 0, 7); c.stroke()
  const aw = 20 * sx * W / 35, ad = 9 * sx; c.strokeRect(p, cv.height / 2 - aw / 2, ad, aw); c.strokeRect(cv.width - p - ad, cv.height / 2 - aw / 2, ad, aw)
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4
  const o = new T.Mesh(new T.PlaneGeometry(L, W), new T.MeshStandardMaterial({ map: t, roughness: .95 })); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); o.receiveShadow = true; g.add(o)
  // traves
  for (const s of [-1, 1]) { const gx = x + s * (L / 2 - 1.2); for (const dz of [-2.5, 2.5]) caixa(g, '#f5f5f0', .18, 2.1, .18, gx, y + 1.05, z + dz); caixa(g, '#f5f5f0', .18, .18, 5.2, gx, y + 2.1, z); const rede = new T.Mesh(new T.PlaneGeometry(1.4, 5), new T.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: .35, side: T.DoubleSide })); rede.rotation.set(-Math.PI / 2, 0, 0); rede.position.set(gx + s * .7, y + 2.05, z); g.add(rede) }
  return o
}
function alambrado(g: T.Object3D, w: number, d: number, x: number, z: number, h = 3.2, abertura = 0) {
  const tela = new T.MeshStandardMaterial({ color: '#7e8b86', transparent: true, opacity: .45, side: T.DoubleSide, roughness: .7 })
  const lado = (len: number, cx: number, cz: number, ry: number) => { if (len <= 0) return; const o = new T.Mesh(new T.PlaneGeometry(len, h), tela); o.position.set(cx, .2 + h / 2, cz); o.rotation.y = ry; g.add(o); for (let i = 0; i <= Math.round(len / 4); i++) { const t = -len / 2 + i * len / Math.round(len / 4); caixa(g, '#56605d', .12, h + .2, .12, cx + Math.cos(ry) * t, .2 + h / 2, cz - Math.sin(ry) * t) } }
  lado(w, x, z - d / 2, 0)
  if (abertura) { const half = (w - abertura) / 2; lado(half, x - w / 2 + half / 2, z + d / 2, 0); lado(half, x + w / 2 - half / 2, z + d / 2, 0) } else lado(w, x, z + d / 2, 0)
  lado(d, x - w / 2, z, Math.PI / 2); lado(d, x + w / 2, z, Math.PI / 2)
}
function boneco(g: T.Object3D, x: number, z: number, cor: string, esc = .75, ry = 0) {
  const b = new T.Group(); b.position.set(x, .2, z); b.rotation.y = ry; b.scale.setScalar(esc)
  const corpo = new T.Mesh(new T.CylinderGeometry(.28, .3, 1.1, 8), m(cor)); corpo.position.y = 1.05; b.add(corpo)
  const pernas = new T.Mesh(new T.CylinderGeometry(.24, .2, .6, 8), m('#1d1d1d')); pernas.position.y = .3; b.add(pernas)
  const cabeca = new T.Mesh(new T.SphereGeometry(.24, 10, 8), m('#9b6a43')); cabeca.position.y = 1.85; b.add(cabeca)
  g.add(b)
}
function arvore(g: T.Object3D, x: number, z: number, r = 2.6) {
  caixa(g, '#6b4a2b', .35, 2.4, .35, x, 1.4, z); const c = new T.Mesh(new T.SphereGeometry(r, 10, 8), m('#4f7a32')); c.position.set(x, 3.6, z); c.castShadow = true; g.add(c)
}
function refletor(g: T.Object3D, x: number, z: number, h = 9, mira: [number, number] = [0, 0]) {
  caixa(g, '#4a5250', .25, h, .25, x, .2 + h / 2, z)
  const cab = caixa(g, '#e9ecdf', 1.8, .6, .4, x, h + .4, z); cab.lookAt(mira[0], 0, mira[1])
}

/** 🌱 Campinho da Base. N1 terrão + traves + alambrado · N2 grama + arquibancadinha + refletores · N3 gramado bom, placar, vestiário, garotada. */
export function campinhoBase(g: T.Group, nivel: NivelObra, cor: string, cor2: string, clube: string) {
  const L = 55, W = 35
  if (nivel === 0) { chao(g, '#7d8e5a', L + 10, W + 12, 0, 0, .19); texto(g, 'LOTE DA BASE', 22, 4, 0, .3, 0, '#F4ECD6', '#0C0C0C', true); return }
  chao(g, nivel === 1 ? '#8a7a55' : '#b9b3a2', L + 9, W + 11, 0, 0, .19)
  gramado(g, L, W, 0, 0, nivel === 1 ? 'terra' : nivel === 2 ? 'grama' : 'bom')
  alambrado(g, L + 7, W + 8, 0, 0, nivel === 1 ? 3 : 4, 6)
  if (nivel === 1) { caixa(g, '#7a5a3a', 3.2, .5, .6, -14, .45, W / 2 + 2.2); caixa(g, '#7a5a3a', 3.2, .5, .6, 14, .45, W / 2 + 2.2); texto(g, 'ESCOLINHA', 7, 1.4, 0, 2.2, W / 2 + 4.05, '#F4ECD6', '#0C0C0C'); boneco(g, -6, 3, cor, 1.0); boneco(g, 4, -5, cor2, 1.0, 1); return }
  // arquibancadinha (lado de baixo do campo, olhando pro campo)
  const deg = nivel === 2 ? 3 : 4
  for (let i = 0; i < deg; i++) caixa(g, i % 2 ? '#c9c2ae' : '#d8d1bd', 26, .55 * (i + 1), 1.1, 0, .2 + .275 * (i + 1), W / 2 + 5.2 + i * 1.1)
  if (nivel === 3) for (let i = 0; i < 9; i++) caixa(g, i % 2 ? cor : cor2, 26 / 9 - .25, .35, .7, -13 + 26 / 18 + i * 26 / 9, .2 + .55 * deg + .17, W / 2 + 5.2 + (deg - 1) * 1.1)
  const nRef = nivel === 2 ? 2 : 4
  const cantos: [number, number][] = nivel === 2 ? [[-L / 2 - 3, -W / 2 - 3.5], [L / 2 + 3, W / 2 + 3.5]] : [[-L / 2 - 3, -W / 2 - 3.5], [L / 2 + 3, -W / 2 - 3.5], [-L / 2 - 3, W / 2 + 3.5], [L / 2 + 3, W / 2 + 3.5]]
  for (const [x, z] of cantos.slice(0, nRef)) refletor(g, x, z, nivel === 2 ? 9 : 12)
  if (nivel === 2) { boneco(g, -8, 2, cor, 1.0); boneco(g, 6, -4, cor, 1.0, 1); boneco(g, 12, 6, cor2, 1.0, 2); return }
  // N3: placar pequeno atrás do gol oeste, vestiário no lado norte, garotada treinando (cones + bonecos)
  caixa(g, '#2a2f2e', .3, 4.5, .3, -L / 2 - 4.2, 2.45, -3); caixa(g, '#2a2f2e', .3, 4.5, .3, -L / 2 - 4.2, 2.45, 3)
  const pl = texto(g, 'BASE 2 x 1', 7, 2.4, -L / 2 - 4.05, 4.6, 0, '#0C0C0C', '#FFC400'); pl.rotation.y = Math.PI / 2; const pt = caixa(g, '#0C0C0C', .3, 2.8, 7.4, -L / 2 - 4.3, 4.6, 0)
  pt.position.x -= .05
  const vx = L / 2 + 7.5
  caixa(g, '#e9e3d3', 6, 3.4, 18, vx, 1.9, 0); caixa(g, cor, 6.6, .4, 18.6, vx, 3.8, 0)
  const vt = texto(g, 'VESTIÁRIO', 9, 1.3, vx - 3.03, 2.6, 0, cor, '#ffffff'); vt.rotation.y = -Math.PI / 2
  const vb = texto(g, 'BASE', 14, 4, vx, 4.05, 0, cor, '#ffffff', true); vb.rotation.z = Math.PI / 2
  for (let i = 0; i < 6; i++) { const cone = new T.Mesh(new T.ConeGeometry(.3, .7, 10), m('#f07a1a')); cone.position.set(-14 + i * 3, .55, -6); g.add(cone) }
  const pos: [number, number][] = [[-15, -3], [-12, -8], [-9, -3], [-6, -8], [-3, -3], [5, 4], [9, 9], [12, 2], [16, -6], [20, 5], [-20, 8], [0, 10]]
  pos.forEach(([x, z], i) => boneco(g, x, z, i % 4 === 3 ? cor2 : cor, 1.0, i))
  boneco(g, -18, -8, '#1d1d1d', 1.15)
}

/** 🏋️ CT de Treinamento (lote 64×50, sul = +z = lado do estádio). N1 campo de treino + contêiner · N2 prédio do CT + 2 campos + academia ·
 * N3 logo do clube, estacionamento e ônibus. */
export function ctTreino(g: T.Group, nivel: NivelObra, cor: string, cor2: string, clube: string) {
  const fL = 29, fW = 19, fz = 9
  if (nivel === 0) { chao(g, '#7d8e5a', 64, 50, 0, 0, .19); texto(g, 'LOTE DO CT', 22, 4, 0, .3, 0, '#F4ECD6', '#0C0C0C', true); return }
  chao(g, '#a8a493', nivel === 1 ? 33 : 64, nivel === 1 ? 46 : 50, nivel === 1 ? -15.5 : 0, 0, .19)
  const treino = (cx: number, cz: number) => {
    for (let i = 0; i < 7; i++) { const cone = new T.Mesh(new T.ConeGeometry(.3, .7, 10), m(i % 2 ? '#f07a1a' : '#ffd21a')); cone.position.set(cx - 9 + i * 2, .55, cz - 3 + (i % 2 ? 1.2 : -1.2)); g.add(cone) }
    for (let i = 0; i < 4; i++) caixa(g, '#e8c43a', .7, 1.9, .3, cx + 6 + (i % 2) * 1.2, 1.15, cz - 4 + i * 1.8, .2)
    for (let i = 0; i < 4; i++) { caixa(g, '#f0f0f0', .08, .5, .08, cx - 7 + i * 2.4, .45, cz + 4.5); caixa(g, '#f0f0f0', .08, .5, .08, cx - 7 + i * 2.4, .45, cz + 5.7); caixa(g, '#d93a2a', .1, .08, 1.3, cx - 7 + i * 2.4, .72, cz + 5.1) }
  }
  gramado(g, fL, fW, -15.5, fz, nivel === 1 ? 'grama' : 'bom'); treino(-15.5, fz)
  if (nivel === 1) {
    caixa(g, '#2f6f8f', 12, 2.6, 2.5, -15.5, 1.5, -12); caixa(g, '#e9ecdf', 1, 1.8, .1, -13, 1.3, -10.7)
    texto(g, 'CT', 3, 1.2, -18, 2.1, -10.7, '#F4ECD6', '#0C0C0C')
    boneco(g, -20, fz - 2, cor, 1.15); boneco(g, -12, fz + 3, cor, 1.15, 1); boneco(g, -9, fz - 4, '#1d1d1d', 1.15)
    return
  }
  gramado(g, fL, fW, 15.5, fz, 'grama'); treino(15.5, fz)
  // prédio do CT (norte) + academia de vidro
  caixa(g, '#e9e3d3', 26, 6.2, 10, -16, 3.3, -17); caixa(g, '#2a2f2e', 27, .5, 11, -16, 6.6, -17)
  for (let i = 0; i < 6; i++) caixa(g, '#416b7c', 2.6, 1.6, .1, -26 + i * 4, 4.2, -11.95)
  caixa(g, '#5b5f5c', 3, 2.8, .1, -16, 1.6, -11.95)
  caixa(g, '#416b7c', 13, 4.2, 9, 5, 2.3, -17); caixa(g, '#2a2f2e', 13.6, .4, 9.6, 5, 4.6, -17)
  texto(g, 'ACADEMIA', 7, 1.1, 5, 3.6, -12.45, '#0C0C0C', '#ffffff')
  boneco(g, -20, fz - 2, cor, 1.15); boneco(g, -12, fz + 3, cor, 1.15, 1); boneco(g, 12, fz - 3, cor2, 1.15, 2); boneco(g, 20, fz + 2, cor, 1.15, 1); boneco(g, -9, fz - 4, '#1d1d1d', 1.15)
  if (nivel === 2) { texto(g, 'CT', 4, 1.6, -16, 5.2, -11.94, '#F4ECD6', '#0C0C0C'); return }
  // N3: nome e escudo do clube, estacionamento com carros e o ônibus do clube
  texto(g, 'CT ' + clube.toUpperCase(), 24, 6, -16, 6.9, -17, cor, '#ffffff', true)
  const esc = new T.Mesh(new T.CircleGeometry(2, 28), m(cor2)); esc.position.set(-16, 5, -11.93); g.add(esc)
  texto(g, clube.slice(0, 3).toUpperCase(), 2.8, 1.3, -16, 5, -11.9, cor2, cor)
  chao(g, '#4a4d4e', 18, 13, 22, -17.5, .22)
  for (let i = 0; i < 5; i++) caixa(g, '#f5f5f0', .15, .03, 4.2, 14.5 + i * 3.4, .25, -21.5)
  ;['#c2452f', '#e9ecdf', '#2a2f2e', '#1b7a3d'].forEach((c, i) => { caixa(g, c, 2, 1.3, 4, 16.2 + i * 3.4, .9, -21.5); caixa(g, '#2a3438', 1.7, .6, 2, 16.2 + i * 3.4, 1.7, -21.7) })
  caixa(g, cor, 12, 3.4, 2.8, 22, 2, -14); caixa(g, '#2a3438', 11.4, 1, 2.85, 22, 2.6, -14); caixa(g, cor2, 12.05, .5, 2.85, 22, 1.2, -14)
  texto(g, clube.toUpperCase(), 7, 1.2, 22, 3.75, -14, cor2, cor, true)
  arvore(g, -30, -22); arvore(g, -30, 22)
}

export function montaBaseCT(scene: T.Scene, p: PedidoBaseCT) {
  const raiz = new T.Group(); raiz.name = 'mockup-base-ct'; scene.add(raiz)
  const cor = p.cor ?? '#1B7A3D', cor2 = p.cor2 ?? '#FFC400', clube = p.clube ?? 'Leão da Serra'
  // limpa as árvores do bosque dentro dos lotes (escala zero nas instâncias)
  if (p.limpa?.length) {
    const mt = new T.Matrix4(), pos = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3(), zero = new T.Matrix4().makeScale(0, 0, 0)
    const dentro = (x: number, z: number) => p.limpa!.some(([a, b, c, d]) => x >= a && x <= b && z >= c && z <= d)
    scene.traverse(o => {
      if (o === raiz || !(o instanceof T.InstancedMesh)) return
      o.updateMatrixWorld(); let mexeu = false
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, mt); mt.premultiply(o.matrixWorld).decompose(pos, q, s); if (pos.y < 12 && dentro(pos.x, pos.z)) { o.setMatrixAt(i, zero); mexeu = true } }
      if (mexeu) { o.instanceMatrix.needsUpdate = true; o.computeBoundingSphere?.() }
    })
    const some: T.Object3D[] = []
    scene.traverse(o => { if (o === raiz || o.parent === raiz) return; if (o instanceof T.Mesh && !(o instanceof T.InstancedMesh) && /tree|arvore|árvore/i.test(o.name)) { o.getWorldPosition(pos); if (dentro(pos.x, pos.z)) some.push(o) } })
    some.forEach(o => { o.visible = false })
    // as árvores do bosque estão FUNDIDAS numa malha só por material: separa cada pedaço solto (tronco, copa) e
    // apaga o pedaço INTEIRO quando o centro dele cai no lote e fica acima do chão (o chão e os caminhos não são tocados)
    scene.traverse(o => {
      if (!(o instanceof T.Mesh) || o.name !== 'entorno-material') return
      const geo = o.geometry as T.BufferGeometry, a = geo.getAttribute('position') as T.BufferAttribute, idx = geo.index
      o.updateMatrixWorld()
      const pai = new Int32Array(a.count).map((_, i) => i), acha = (i: number): number => { while (pai[i] !== i) { pai[i] = pai[pai[i]]; i = pai[i] } return i }
      const une = (x: number, y: number) => { const rx = acha(x), ry = acha(y); if (rx !== ry) pai[ry] = rx }
      const tri = idx ? idx.count : a.count, v = (t: number) => idx ? idx.getX(t) : t
      for (let t = 0; t < tri; t += 3) { une(v(t), v(t + 1)); une(v(t), v(t + 2)) }
      const igual = new Map<string, number>() // malha sem índice: vértice repetido no mesmo lugar = mesmo pedaço
      for (let i = 0; i < a.count; i++) { const k = a.getX(i).toFixed(3) + ',' + a.getY(i).toFixed(3) + ',' + a.getZ(i).toFixed(3); const j = igual.get(k); if (j === undefined) igual.set(k, i); else une(j, i) }
      const soma = new Map<number, number[]>()
      for (let i = 0; i < a.count; i++) { pos.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); const r = acha(i); let q = soma.get(r); if (!q) { q = [0, 0, 0, 0, 1e9, -1e9]; soma.set(r, q) } q[0] += pos.x; q[1] += pos.y; q[2] += pos.z; q[3]++; q[4] = Math.min(q[4], pos.y); q[5] = Math.max(q[5], pos.y) }
      const fora = new Set<number>(); for (const [r, q] of soma) { const cx = q[0] / q[3], cy = q[1] / q[3], cz = q[2] / q[3]; if (cy > 1 && q[4] > -1 && q[5] < 16 && q[3] < 4000 && dentro(cx, cz)) fora.add(r) }
      if (!fora.size) return
      // o pedaço inteiro vira um ponto embaixo da terra (sem esticar nada)
      for (let i = 0; i < a.count; i++) if (fora.has(acha(i))) a.setXYZ(i, 0, -500, 0)
      a.needsUpdate = true; geo.computeBoundingSphere()
    })
  }
  if (p.base) { const g = new T.Group(); g.position.set(p.base.x, 0, p.base.z); raiz.add(g); campinhoBase(g, p.base.nivel, cor, cor2, clube) }
  if (p.ct) { const g = new T.Group(); g.position.set(p.ct.x, 0, p.ct.z); raiz.add(g); ctTreino(g, p.ct.nivel, cor, cor2, clube) }
  if (p.grade) for (let x = -200; x <= 120; x += 20) for (let z = -220; z <= -40; z += 20) { const c = Math.abs(x) + Math.abs(z) === 0 ? '#ff0' : '#e8503a'; const o = new T.Mesh(new T.BoxGeometry(1.4, 14, 1.4), m(c)); o.position.set(x, 7, z); raiz.add(o); texto(raiz, `${x},${z}`, 9, 2.4, x, 15, z, '#000', '#fff', true) }
  return { raiz }
}
