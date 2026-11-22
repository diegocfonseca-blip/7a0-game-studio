// 🏀 16/11 — A QUADRA DA ARENA no mapa do clube (carreira do basquete).
//
// Diego: *"pq apareceu essa maquete se já tem o mapa p todos...? Só q mapa q tem q ser p basquete né"*.
// O mapa da cidade é o MESMO do futebol; só o miolo do estádio troca: no lugar do gramado, das linhas e dos gols,
// um piso de madeira com as linhas de basquete e as duas cestas. Quem chama é `criarCampo3D` (presidencia-complexo-partida),
// e só quando o esporte ativo é o basquete — o futebol não passa por aqui.
//
// A quadra oficial (28 × 15 m) fica minúscula dentro de uma arquibancada desenhada pra um campo de 105 × 68 m. Por isso ela é
// desenhada em ESCALA (`S`), preenchendo o miolo, com as cestas na mesma escala — fica proporcional ao que a câmera mostra.
// Nada aqui é jogo: é cenário. Não existe partida de basquete em 3D (etapa separada).
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/** escala da quadra: 28 m × S cabe no comprimento do miolo (105 m) com folga pra área em volta */
export const QUADRA_S = 2.8
const L = 28 * QUADRA_S / 2, W = 15 * QUADRA_S / 2 // meio comprimento / meia largura, em metros do mapa

function texturaMadeira(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#C98F55'; g.fillRect(0, 0, c.width, c.height)
  // tábuas no sentido do comprimento, com tons alternados e emendas desencontradas
  const tons = ['#C98F55', '#D29A60', '#C08650', '#CF9658', '#BF844C']
  const alt = 16
  for (let y = 0, r = 0; y < c.height; y += alt, r++) {
    let x = -((r * 137) % 200)
    while (x < c.width) {
      const len = 180 + ((r * 53 + x) % 140)
      g.fillStyle = tons[(r * 7 + Math.floor(x / 97)) % tons.length]
      g.fillRect(x, y, len - 2, alt - 1)
      x += len
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}

/** desenha a quadra na cena e devolve a textura (o chamador descarta junto com o resto do campo) */
export function criarQuadra3D(scene: THREE.Scene): THREE.Texture {
  const madeira = texturaMadeira()
  const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, ...extra })
  const piso = mat('#ffffff', { map: madeira, roughness: .35, metalness: .05 })
  const entorno = mat('#2A2622', { roughness: .9 })
  const garrafao = mat('#1B7A3D', { roughness: .45 })
  const ouro = mat('#FFC400', { roughness: .4 })
  const branco = mat('#F7F2E2', { roughness: .5 })
  const tinta = mat('#0C0C0C', { roughness: .6 })
  const vidro = new THREE.MeshStandardMaterial({ color: '#dff3ff', roughness: .1, transparent: true, opacity: .45 })
  const aro = mat('#E8503A', { roughness: .35, metalness: .3 })

  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.receiveShadow = true; mesh.castShadow = true; scene.add(mesh); return mesh }
  const chao = (w: number, d: number, m: THREE.Material, x: number, y: number, z: number) => { const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2); const mesh = add(geo, m, x, y, z); mesh.castShadow = false; return mesh }

  // 🟫 o piso da arena (o miolo inteiro, onde no futebol fica o gramado) + a quadra de madeira por cima
  chao(125, 86, entorno, 0, -.01, 0)
  chao(2 * L + 6, 2 * W + 6, piso, 0, .002, 0)

  // ✏️ linhas (faixas finas pintadas)
  const lw = .09 * QUADRA_S
  const linhas: THREE.BufferGeometry[] = []
  const seg = (x1: number, z1: number, x2: number, z2: number) => {
    const g = new THREE.PlaneGeometry(Math.hypot(x2 - x1, z2 - z1), lw); g.rotateX(-Math.PI / 2)
    g.rotateY(-Math.atan2(z2 - z1, x2 - x1)); g.translate((x1 + x2) / 2, .008, (z1 + z2) / 2); linhas.push(g)
  }
  const arco = (cx: number, cz: number, r: number, a0: number, a1: number, n = 48) => {
    for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n; seg(cx + Math.cos(a) * r, cz + Math.sin(a) * r, cx + Math.cos(b) * r, cz + Math.sin(b) * r) }
  }
  seg(-L, -W, L, -W); seg(L, -W, L, W); seg(L, W, -L, W); seg(-L, W, -L, -W) // contorno
  seg(0, -W, 0, W) // meio da quadra
  arco(0, 0, 1.8 * QUADRA_S, 0, Math.PI * 2, 64) // círculo central
  // 🟡 o miolo do círculo central em dourado (cor da casa)
  const centro = new THREE.CircleGeometry(1.8 * QUADRA_S - lw, 48); centro.rotateX(-Math.PI / 2); add(centro, ouro, 0, .006, 0).castShadow = false

  for (const lado of [-1, 1]) {
    const fundo = lado * L, dentro = -lado
    const cesta = fundo + dentro * 1.575 * QUADRA_S // centro do aro, a 1,575 m da linha de fundo
    // 🟩 garrafão pintado (4,9 × 5,8 m)
    const kw = 4.9 * QUADRA_S / 2, kd = 5.8 * QUADRA_S
    const key = new THREE.PlaneGeometry(kd, 2 * kw); key.rotateX(-Math.PI / 2); add(key, garrafao, fundo + dentro * kd / 2, .006, 0).castShadow = false
    seg(fundo, -kw, fundo + dentro * kd, -kw); seg(fundo, kw, fundo + dentro * kd, kw); seg(fundo + dentro * kd, -kw, fundo + dentro * kd, kw)
    // lance livre: meia-lua de fora
    arco(fundo + dentro * kd, 0, 1.8 * QUADRA_S, lado < 0 ? -Math.PI / 2 : Math.PI / 2, lado < 0 ? Math.PI / 2 : Math.PI * 1.5, 32)
    // linha de 3 (6,75 m do aro; reta nos cantos a 0,9 m da lateral)
    const r3 = 6.75 * QUADRA_S, zc = W - .9 * QUADRA_S
    const ang = Math.asin(zc / r3), xc = cesta + dentro * Math.cos(ang) * r3
    seg(fundo, -zc, xc, -zc); seg(fundo, zc, xc, zc)
    if (lado < 0) arco(cesta, 0, r3, -ang, ang, 64)
    else arco(cesta, 0, r3, Math.PI - ang, Math.PI + ang, 64)

    // 🏀 a CESTA: base acolchoada atrás da linha de fundo, braço, tabela de vidro, quadrado, aro e rede
    const baseX = fundo - dentro * 1.6 * QUADRA_S
    add(new THREE.BoxGeometry(1.6 * QUADRA_S, 1.0 * QUADRA_S, 1.6 * QUADRA_S), tinta, baseX, .5 * QUADRA_S, 0)
    const hTabela = 2.9 * QUADRA_S, alturaAro = 3.05 * QUADRA_S
    const xTabela = fundo + dentro * 1.2 * QUADRA_S
    // poste: do topo da base até a altura do braço (que segura a tabela pelo meio)
    const topoBase = 1.0 * QUADRA_S, yBraco = hTabela + .45 * QUADRA_S
    add(new THREE.CylinderGeometry(.12 * QUADRA_S, .12 * QUADRA_S, yBraco - topoBase + .08 * QUADRA_S, 10), tinta, baseX, (yBraco + topoBase) / 2, 0)
    const braco = new THREE.BoxGeometry(Math.abs(xTabela - baseX) + .12 * QUADRA_S, .16 * QUADRA_S, .16 * QUADRA_S)
    add(braco, tinta, (xTabela + baseX) / 2, yBraco, 0)
    add(new THREE.BoxGeometry(.05 * QUADRA_S, 1.05 * QUADRA_S, 1.8 * QUADRA_S), vidro, xTabela, hTabela + .525 * QUADRA_S, 0).castShadow = false
    // moldura e quadradinho da tabela
    for (const [w, h, y, z] of [[1.8, .05, hTabela + 1.05 * QUADRA_S, 0], [1.8, .05, hTabela, 0], [.05, 1.05, hTabela + .525 * QUADRA_S, -.9 * QUADRA_S], [.05, 1.05, hTabela + .525 * QUADRA_S, .9 * QUADRA_S]] as const)
      add(new THREE.BoxGeometry(.06 * QUADRA_S, h * QUADRA_S, w === .05 ? .05 * QUADRA_S : w * QUADRA_S), branco, xTabela + dentro * .02, y, z)
    for (const [w, h, y, z] of [[.59, .04, alturaAro + .45 * QUADRA_S, 0], [.59, .04, alturaAro + .02 * QUADRA_S, 0], [.04, .45, alturaAro + .235 * QUADRA_S, -.295 * QUADRA_S], [.04, .45, alturaAro + .235 * QUADRA_S, .295 * QUADRA_S]] as const)
      add(new THREE.BoxGeometry(.06 * QUADRA_S, h * QUADRA_S, w * QUADRA_S), aro, xTabela + dentro * .04, y, z)
    // aro (o laranja da bola) e a rede branca em cone
    const rim = new THREE.TorusGeometry(.225 * QUADRA_S, .03 * QUADRA_S, 8, 32); rim.rotateX(Math.PI / 2)
    add(rim, aro, cesta, alturaAro, 0)
    add(new THREE.BoxGeometry(Math.abs(cesta - xTabela) - .2 * QUADRA_S, .04 * QUADRA_S, .1 * QUADRA_S), aro, (cesta + xTabela) / 2 + dentro * .1 * QUADRA_S, alturaAro, 0)
    const rede = new THREE.CylinderGeometry(.225 * QUADRA_S, .15 * QUADRA_S, .45 * QUADRA_S, 16, 1, true)
    add(rede, new THREE.MeshStandardMaterial({ color: '#ffffff', wireframe: true }), cesta, alturaAro - .225 * QUADRA_S, 0).castShadow = false
  }
  const juntas = mergeGeometries(linhas); linhas.forEach(g => g.dispose())
  if (juntas) add(juntas, branco).castShadow = false
  return madeira
}
