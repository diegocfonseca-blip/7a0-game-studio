// 🏀 16/11 — A ARENA DE BASQUETE (construção inteira), pra entrar no mapa no lugar do estádio de futebol.
//
// Diego, vendo só a quadra dentro do estádio: *"N tá parecendo arena de basquete"*. Ele tem razão: arena não é estádio com
// chão de madeira. É um GINÁSIO FECHADO: arquibancada em volta da quadra inteira, colada nela e bem em pé, dois anéis de
// cadeiras, telão de 4 faces pendurado em cima do círculo central, luz de cima e um prédio fechado com cúpula por fora.
// Este arquivo desenha isso. `cortado` tira a cúpula pra mostrar o miolo (é como o mapa enxerga de cima).
import * as THREE from 'three'
import { criarQuadra3D, QUADRA_S } from './presidencia-quadra-3d'

const L = 28 * QUADRA_S / 2, W = 15 * QUADRA_S / 2

function anelArredondado(hx: number, hz: number, r: number, hx2: number, hz2: number, r2: number): THREE.Shape {
  // as curvas são PARALELAS (raio = distância até a quadra + 2): fileira, corredor e parede andam juntos nas quinas
  r = 2 + (hx - L); r2 = 2 + (hx2 - L)
  const ret = (x: number, z: number, rr: number, buraco = false) => {
    const p = buraco ? new THREE.Path() : new THREE.Shape()
    p.moveTo(-x + rr, -z); p.lineTo(x - rr, -z); p.absarc(x - rr, -z + rr, rr, -Math.PI / 2, 0, false)
    p.lineTo(x, z - rr); p.absarc(x - rr, z - rr, rr, 0, Math.PI / 2, false)
    p.lineTo(-x + rr, z); p.absarc(-x + rr, z - rr, rr, Math.PI / 2, Math.PI, false)
    p.lineTo(-x, -z + rr); p.absarc(-x + rr, -z + rr, rr, Math.PI, Math.PI * 1.5, false)
    return p
  }
  const s = ret(hx2, hz2, r2) as THREE.Shape
  s.holes.push(ret(hx, hz, r, true) as THREE.Path)
  return s
}

export type OpcoesArena = { cortado?: boolean; cor?: string; cor2?: string; nome?: string; /** no mapa a quadra já vem do `criarCampo3D` */ semQuadra?: boolean }

export function criarArenaBasquete3D(scene: THREE.Object3D, o: OpcoesArena = {}): void {
  const cor = o.cor ?? '#1B7A3D', cor2 = o.cor2 ?? '#FFC400'
  if (!o.semQuadra) criarQuadra3D(scene as THREE.Scene)
  const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: .7, ...extra })
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh }

  // 🪑 ARQUIBANCADA: degraus em anel arredondado, colados na quadra (4 m de folga) e bem em pé
  const cadeiraA = mat(cor), cadeiraB = mat('#2A2A30'), concreto = mat('#3B3A3F')
  const degrau = (i: number, folga: number, y0: number, prof: number, sobe: number, m: THREE.Material) => {
    const hx = L + folga + i * prof, hz = W + folga + i * prof, r = 6 + i * prof
    const g = new THREE.ExtrudeGeometry(anelArredondado(hx, hz, r, hx + prof, hz + prof, r + prof), { depth: sobe, bevelEnabled: false, curveSegments: 10 })
    g.rotateX(-Math.PI / 2); add(g, m, 0, y0 + i * sobe, 0)
  }
  const fileiras1 = 11, prof1 = 1.9, sobe1 = 1.05
  for (let i = 0; i < fileiras1; i++) degrau(i, 4, 0, prof1, sobe1, i % 2 ? cadeiraA : cadeiraB)
  // corredor (anel de concreto) entre os dois anéis
  const fim1 = 4 + fileiras1 * prof1, alto1 = fileiras1 * sobe1
  const corr = new THREE.ExtrudeGeometry(anelArredondado(L + fim1, W + fim1, 6 + fileiras1 * prof1, L + fim1 + 3, W + fim1 + 3, 9 + fileiras1 * prof1), { depth: .6, bevelEnabled: false, curveSegments: 10 })
  corr.rotateX(-Math.PI / 2); add(corr, concreto, 0, alto1, 0)
  // faixa de LED na frente do anel de cima (a cor do clube)
  const led = new THREE.ExtrudeGeometry(anelArredondado(L + fim1 + 2.6, W + fim1 + 2.6, 8.6 + fileiras1 * prof1, L + fim1 + 3, W + fim1 + 3, 9 + fileiras1 * prof1), { depth: 1.6, bevelEnabled: false, curveSegments: 10 })
  led.rotateX(-Math.PI / 2); add(led, mat(cor2, { emissive: cor2, emissiveIntensity: .55 }), 0, alto1 + 2.2, 0)
  const fileiras2 = 9, prof2 = 2.0, sobe2 = 1.45
  for (let i = 0; i < fileiras2; i++) degrau(i, fim1 + 3, alto1 + 3.8, prof2, sobe2, i % 2 ? cadeiraA : cadeiraB)
  const fim2 = fim1 + 3 + fileiras2 * prof2, alto2 = alto1 + 3.8 + fileiras2 * sobe2

  // 🙋 TORCIDA: pontinhos coloridos nas cadeiras (casa cheia)
  const pessoas = new THREE.InstancedMesh(new THREE.BoxGeometry(.7, 1.1, .5), mat('#ffffff', { roughness: .9 }), 9000)
  const tons = ['#E8503A', '#FFC400', '#F4ECD6', '#1B7A3D', '#7C3AED', '#2E6FD8', '#0C0C0C', '#ffffff', cor, cor, cor2]
  const m4 = new THREE.Matrix4(), c3 = new THREE.Color()
  let n = 0, seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  // ponto ao longo do contorno ARREDONDADO (retas + 4 quartos de círculo) — antes as quinas punham gente pra fora do prédio
  const noContorno = (hx: number, hz: number, r: number, t: number): [number, number] => {
    const ax = 2 * (hx - r), az = 2 * (hz - r), q = Math.PI * r / 2, per = 2 * ax + 2 * az + 4 * q
    let d = ((t % per) + per) % per
    const trecho: [number, (d: number) => [number, number]][] = [
      [ax, d => [-hx + r + d, -hz]], [q, d => { const a = -Math.PI / 2 + d / r; return [hx - r + Math.cos(a) * r, -hz + r + Math.sin(a) * r] }],
      [az, d => [hx, -hz + r + d]], [q, d => { const a = d / r; return [hx - r + Math.cos(a) * r, hz - r + Math.sin(a) * r] }],
      [ax, d => [hx - r - d, hz]], [q, d => { const a = Math.PI / 2 + d / r; return [-hx + r + Math.cos(a) * r, hz - r + Math.sin(a) * r] }],
      [az, d => [-hx, hz - r - d]], [q, d => { const a = Math.PI + d / r; return [-hx + r + Math.cos(a) * r, -hz + r + Math.sin(a) * r] }],
    ]
    for (const [len, f] of trecho) { if (d <= len) return f(d); d -= len }
    return [-hx + r, -hz]
  }
  const anel = (folga: number, y0: number, prof: number, sobe: number, fileiras: number) => {
    for (let i = 0; i < fileiras && n < 9000; i++) {
      const hx = L + folga + i * prof + prof / 2, hz = W + folga + i * prof + prof / 2, r = 2 + folga + i * prof + prof / 2
      const per = 4 * (hx + hz), passos = Math.floor(per / 1.0)
      for (let k = 0; k < passos && n < 9000; k++) {
        if (rnd() < .18) continue
        const [x, z] = noContorno(hx, hz, r, k)
        m4.makeTranslation(x, y0 + (i + 1) * sobe + .55, z); pessoas.setMatrixAt(n, m4)
        pessoas.setColorAt(n, c3.set(tons[Math.floor(rnd() * tons.length)])); n++
      }
    }
  }
  anel(4, 0, prof1, sobe1, fileiras1); anel(fim1 + 3, alto1 + 3.8, prof2, sobe2, fileiras2)
  pessoas.count = n; scene.add(pessoas)

  // 🪑 cadeiras de beira de quadra (courtside) + mesa dos oficiais
  for (const lado of [-1, 1]) add(new THREE.BoxGeometry(2 * L - 10, .9, 1.6), mat(cor), 0, .45, lado * (W + 2.2))
  add(new THREE.BoxGeometry(14, 1.6, 2.2), mat('#0C0C0C'), 0, .8, -(W + 4.2))
  add(new THREE.BoxGeometry(13.6, 1.0, .1), mat(cor2, { emissive: cor2, emissiveIntensity: .5 }), 0, 1.0, -(W + 3.05))

  // 🧱 PAREDE DO PRÉDIO e a cúpula
  const parede = new THREE.ExtrudeGeometry(anelArredondado(L + fim2, W + fim2, 6 + fim2, L + fim2 + 2, W + fim2 + 2, 8 + fim2), { depth: alto2 + 4, bevelEnabled: false, curveSegments: 12 })
  parede.rotateX(-Math.PI / 2); add(parede, mat('#E9E3D3'))
  // faixa de vidro e faixa na cor do clube na fachada
  const faixa = (y: number, h: number, m: THREE.Material, folga = 2.15) => {
    const g = new THREE.ExtrudeGeometry(anelArredondado(L + fim2 + 1.9, W + fim2 + 1.9, 7.9 + fim2, L + fim2 + folga, W + fim2 + folga, 8 + fim2 + folga - 2), { depth: h, bevelEnabled: false, curveSegments: 12 })
    g.rotateX(-Math.PI / 2); add(g, m, 0, y, 0)
  }
  faixa(alto2 * .45, alto2 * .35, new THREE.MeshStandardMaterial({ color: '#3D6E7E', roughness: .15, metalness: .4 }))
  faixa(alto2 + 1, 2.4, mat(cor))
  faixa(alto2 + 3.4, .8, mat(cor2))
  // 🪧 o NOME DA ARENA na fachada (os dois lados compridos), em cima da entrada
  const placa = (() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d')!
    g.fillStyle = '#0C0C0C'; g.fillRect(0, 0, 1024, 160); g.fillStyle = cor2; g.fillRect(0, 140, 1024, 20)
    g.fillStyle = '#ffffff'; g.font = 'bold 92px Oswald, Arial'; g.textAlign = 'center'; g.fillText(o.nome ?? 'BIDLEGENDS ARENA', 512, 110)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  })()
  for (const lado of [-1, 1]) {
    const p = add(new THREE.PlaneGeometry(52, 8.1), new THREE.MeshStandardMaterial({ map: placa, emissive: '#ffffff', emissiveMap: placa, emissiveIntensity: .35 }), 0, alto2 * .3, lado * (W + fim2 + 2.3))
    p.rotation.y = lado > 0 ? 0 : Math.PI; p.castShadow = false
    // entrada: vão escuro com marquise
    add(new THREE.BoxGeometry(30, 7, .4), mat('#1a1a1e'), 0, 3.5, lado * (W + fim2 + 2.2))
    add(new THREE.BoxGeometry(36, .8, 6), mat(cor2), 0, 7.6, lado * (W + fim2 + 4.5))
  }
  if (!o.cortado) {
    // laje do teto: fecha o prédio de parede a parede (a cúpula fica por cima, sem fresta nas quinas)
    const laje = anelArredondado(L + fim2 - 1, W + fim2 - 1, 0, L + fim2 + 2.2, W + fim2 + 2.2, 0)
    laje.holes.length = 0
    const gl = new THREE.ExtrudeGeometry(laje, { depth: .8, bevelEnabled: false, curveSegments: 12 }); gl.rotateX(-Math.PI / 2)
    add(gl, mat('#B9BEC3', { metalness: .3, roughness: .5 }), 0, alto2 + 4, 0)
    const cup = new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const m = add(cup, mat('#C9CED3', { metalness: .35, roughness: .4 }), 0, alto2 + 4.8, 0)
    m.scale.set(L + fim2 - 6, 12, W + fim2 - 6)
    // nervuras da cúpula
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2
      const g = new THREE.TorusGeometry(1, .012, 4, 32, Math.PI / 2); g.rotateY(-a)
      const rib = add(g, mat('#8E979E'), 0, alto2 + 4.8, 0); rib.scale.set(L + fim2 - 5.95, 12.1, W + fim2 - 5.95); rib.rotation.set(0, 0, 0)
    }
  }

  // 📺 TELÃO de 4 faces pendurado no centro
  if (o.cortado) {
    const telaTex = (() => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d')!
      g.fillStyle = '#0C0C0C'; g.fillRect(0, 0, 512, 256); g.fillStyle = cor2; g.font = 'bold 120px Oswald, Arial'; g.textAlign = 'center'; g.fillText('BL', 256, 150)
      g.fillStyle = '#ffffff'; g.font = 'bold 34px Arial'; g.fillText(o.nome ?? 'BIDLEGENDS ARENA', 256, 215)
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
    })()
    const tela = new THREE.MeshStandardMaterial({ map: telaTex, emissive: '#ffffff', emissiveMap: telaTex, emissiveIntensity: .9 })
    const caixa = mat('#111114')
    const yT = alto1 + 12
    add(new THREE.BoxGeometry(18, 10, 12), caixa, 0, yT, 0)
    for (const [x, z, ry, w] of [[0, 6.05, 0, 17], [0, -6.05, Math.PI, 17], [9.05, 0, Math.PI / 2, 11], [-9.05, 0, -Math.PI / 2, 11]] as const) {
      const p = add(new THREE.PlaneGeometry(w, 8.4), tela, x, yT, z); p.rotation.y = ry
    }
    add(new THREE.BoxGeometry(19, 1.4, 13), mat(cor2, { emissive: cor2, emissiveIntensity: .5 }), 0, yT - 5.6, 0)
    for (const [x, z] of [[-7, -5], [7, -5], [-7, 5], [7, 5]]) add(new THREE.CylinderGeometry(.08, .08, 30, 4), mat('#555'), x, yT + 20, z)
  }
}
