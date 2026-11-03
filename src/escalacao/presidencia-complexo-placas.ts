// 🪧 PLACAS DO ESTÁDIO NO MAPA 3D (03/11, aprovado pelo Diego).
//
//  1. 🏆 PATROCINADOR MASTER: *"a marca que você fecha ganha a placa grande na fachada do estádio e no telão; quando o
//     contrato acaba, a placa sai"*. A marca chega por `presidencia-complexo-master.ts` (o contrato ATIVO do save). Sem
//     contrato, nenhuma placa. Logo = a MESMA arte deitada das placas do campinho (`placasDoCampo`); marca sem essa arte vira
//     o nome escrito (Oswald, creme/tinta/dourado — a cara do jogo).
//  2. 📺 PLACAS EM VOLTA DO GRAMADO: *"na aba de jogos onde tem as placas dos patrocinadores em volta do campo, também faltou
//     aparecer lá no mapa quando rola o jogo"*. As MESMAS marcas e o MESMO rodízio de 7 s do campinho 2D (`campo2d.tsx`,
//     `PLACA_MS`), sem arte nova.
//
// ⚡ Peso: as placas da beira do campo são UMA textura (todas as marcas empilhadas, 768 px de largura) e UMA malha só; o rodízio
// é só o deslocamento dessa textura, conferido quando o mapa já está desenhando (nada de relógio próprio, nada de acordar o
// mapa). Nenhuma sombra nova. O Master são duas texturas pequenas (fachada 1024×288 e telão 512×242), feitas só quando há
// contrato.
import * as T from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { sponsorBrandOf } from './estadiodata'
import { placasDoCampo, tamanhoMarcaNaPlaca, type PlacaCampo } from './patrocinio'
import type { EstadoComplexo } from './presidencia-complexo-model'
import { masterDoMapa, observarMasterDoMapa } from './presidencia-complexo-master'

const CREME = '#F4ECD6', TINTA = '#0C0C0C', OURO = '#FFC400'
const PLACA_MS = 7000 // o mesmo ritmo das placas do campinho 2D
const fonte = (px: number) => `900 ${Math.round(px)}px Oswald, "Arial Narrow", Arial, sans-serif`
const fundoDe = (p: PlacaCampo) => p.fundo.startsWith('linear') ? OURO : p.fundo
const claro = (cor: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(cor.trim()); if (!m) return false
  const n = parseInt(m[1], 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150
}

/** escreve o texto encolhendo até caber na largura */
function textoCabendo(g: CanvasRenderingContext2D, txt: string, x: number, y: number, max: number, px: number) {
  let size = px
  g.font = fonte(size)
  while (size > 8 && g.measureText(txt).width > max) { size -= 2; g.font = fonte(size) }
  g.fillText(txt, x, y)
}

const imagens = new Map<string, HTMLImageElement>()
function imagem(src: string, pronta: () => void): HTMLImageElement | null | false {
  let img = imagens.get(src)
  if (!img) { img = new Image(); img.decoding = 'async'; img.src = src; imagens.set(src, img) }
  if (img.complete) return img.naturalWidth ? img : false // false = a arte não veio: escreve o nome no lugar
  img.addEventListener('load', pronta, { once: true }); img.addEventListener('error', pronta, { once: true })
  return null
}

/** Uma marca deitada dentro de um retângulo: fundo da cor dela + logo no padrão da Tidex, ou o nome escrito. */
function desenhaMarca(g: CanvasRenderingContext2D, p: PlacaCampo, x: number, y: number, w: number, h: number, pronta: () => void) {
  const fundo = fundoDe(p)
  g.fillStyle = fundo; g.fillRect(x, y, w, h)
  const logo = p.logo ? imagem(p.logo, pronta) : false
  if (logo === null) return // ainda baixando: só o fundo por enquanto (redesenha quando chegar)
  if (logo) {
    const m = tamanhoMarcaNaPlaca(h, p.prop ?? 3, w * .9)
    g.drawImage(logo, x + (w - m.w) / 2, y + (h - m.h) / 2, m.w, m.h)
  } else {
    g.fillStyle = claro(fundo) ? TINTA : CREME; g.textAlign = 'center'; g.textBaseline = 'middle'
    textoCabendo(g, p.nome.toUpperCase(), x + w / 2, y + h / 2 + h * .03, w * .9, h * .62)
  }
}

function texturaCanvas(canvas: HTMLCanvasElement) {
  const map = new T.CanvasTexture(canvas)
  map.colorSpace = T.SRGBColorSpace; map.anisotropy = 4
  return map
}

type Lado = { x0: number; z0: number; x1: number; z1: number; n: number; nx: number; nz: number; virada?: boolean }
/** As faixas de placas, de frente pro gramado (campo de 105 × 68 no centro do mapa). Os vãos são de propósito: o túnel dos
 *  jogadores fica no meio da linha de fundo oeste e a equipe de apoio passa pelos cantos — placa nenhuma fecha caminho. */
// 🪧 03/11 (Diego: *"tá muito colado… bastam 5 placas em cada lado, igual no campo 2D da aba Jogos"*): só as duas laterais,
// 5 placas em cada uma, com respiro entre elas (`VAO`). Os fundos ficam sem placa, como no campinho.
const LADOS: Lado[] = [
  { x0: 50.4, z0: 37.6, x1: -50.4, z1: 37.6, n: 5, nx: 0, nz: -1, virada: true },  // sul: do outro lado dos bancos (virada pra câmera do mapa, que olha do sul)
  { x0: 42, z0: -39.6, x1: -42, z1: -39.6, n: 5, nx: 0, nz: 1 },     // norte: atrás dos bancos e dos técnicos
]
const VAO = 6 // metros livres entre uma placa e a outra
// 👀 03/11 (Diego: *"as placas não estão sendo bem visíveis no mapa… no campo 2D da aba Jogos é bem visto"*): a câmera do jogo no
// mapa olha o campo DE CIMA, e a placa em pé aparecia de lado (fina) ou de costas. Agora ela é maior e DEITADA pra trás (como o
// "tapete 3D" das transmissões): a frente vira pro céu e pro gramado, e dá pra ler a marca de cima e da arquibancada.
const ALTURA = 2.8, BASE = .04, INCLINA = 1.15 // ~66° deitada pra trás (topo longe do campo)

function criarPlacasDoGramado(root: T.Group, onChange: () => void) {
  const marcas = placasDoCampo()
  if (!marcas.length) return { redesenha() {}, dispose() {} }
  const n = marcas.length, W = 768, RH = 170 // faixa de ~4,5:1, a mesma proporção da placa (antes era 9:1 e a marca saía espichada)
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = RH * n
  const g = canvas.getContext('2d')!
  const map = texturaCanvas(canvas); map.wrapT = T.RepeatWrapping
  let desligado = false
  const desenha = () => {
    if (desligado) return
    marcas.forEach((p, r) => desenhaMarca(g, p, 0, r * RH, W, RH, desenha))
    map.needsUpdate = true; onChange()
  }
  desenha()
  const frentes: T.BufferGeometry[] = [], costas: T.BufferGeometry[] = []
  let k = 0
  for (const lado of LADOS) {
    const dx = (lado.x1 - lado.x0) / lado.n, dz = (lado.z1 - lado.z0) / lado.n, largura = Math.hypot(dx, dz) - VAO
    // ↩️ o lado sul fica de costas pro gramado e deitado PRO gramado: a câmera do mapa olha do sul, então assim a marca sai em pé
    // (deitada pra trás, ela aparecia de cabeça pra baixo)
    const giro = Math.atan2(lado.nx, lado.nz) + (lado.virada ? Math.PI : 0)
    for (let i = 0; i < lado.n; i++, k++) {
      const cx = lado.x0 + dx * (i + .5), cz = lado.z0 + dz * (i + .5), linha = k % n
      const frente = new T.PlaneGeometry(largura, ALTURA), uv = frente.getAttribute('uv')
      // cada placa lê a sua faixa da textura (com uma folguinha pra a marca do lado não vazar na borda)
      const topo = 1 - linha / n - .06 / n, pe = 1 - (linha + 1) / n + .06 / n
      for (let j = 0; j < uv.count; j++) uv.setY(j, uv.getY(j) > .5 ? topo : pe)
      frente.translate(0, ALTURA / 2, 0); frente.rotateX(-INCLINA); frente.rotateY(giro); frente.translate(cx, BASE, cz); frentes.push(frente)
      const caixa = new T.BoxGeometry(largura + .08, ALTURA + .1, .16)
      caixa.translate(0, ALTURA / 2, -.09); caixa.rotateX(-INCLINA); caixa.rotateY(giro); caixa.translate(cx, BASE, cz); costas.push(caixa.toNonIndexed()); caixa.dispose()
    }
  }
  const geoFrente = mergeGeometries(frentes)!, geoCostas = mergeGeometries(costas)!
  frentes.forEach(f => f.dispose()); costas.forEach(c => c.dispose())
  const matFrente = new T.MeshBasicMaterial({ map, toneMapped: false })
  const matCostas = new T.MeshStandardMaterial({ color: TINTA, roughness: .7 })
  const placas = new T.Mesh(geoFrente, matFrente), estrutura = new T.Mesh(geoCostas, matCostas)
  placas.name = 'placas-patrocinio-gramado'; estrutura.name = 'placas-patrocinio-estrutura'
  // 🔁 o rodízio: só confere o relógio quando o mapa JÁ está desenhando (não cria quadro novo nem acorda o mapa)
  let vez = -1
  placas.onBeforeRender = () => {
    const agora = Math.floor(Date.now() / PLACA_MS)
    if (agora === vez) return
    vez = agora; map.offset.y = -(agora % n) / n
  }
  root.add(placas, estrutura)
  void document.fonts?.ready.then(desenha)
  return {
    redesenha: desenha,
    dispose() { desligado = true; geoFrente.dispose(); geoCostas.dispose(); matFrente.dispose(); matCostas.dispose(); map.dispose() },
  }
}

/** a arte do Master: a MESMA placa deitada do campinho quando a marca tem uma; senão o nome escrito no creme */
function placaDoMaster(brandId: string): PlacaCampo | null {
  const marca = sponsorBrandOf(brandId)
  if (!marca) return null
  return placasDoCampo().find(p => p.nome === marca.name && p.logo) ?? { nome: marca.name, fundo: CREME }
}

function desenhaMaster(g: CanvasRenderingContext2D, p: PlacaCampo, W: number, H: number, faixa: number, borda: number, pronta: () => void) {
  g.clearRect(0, 0, W, H)
  g.fillStyle = TINTA; g.fillRect(0, 0, W, H)
  g.fillStyle = OURO; g.fillRect(borda, borda, W - borda * 2, faixa)
  g.fillStyle = TINTA; g.textAlign = 'center'; g.textBaseline = 'middle'
  textoCabendo(g, 'PATROCINADOR MASTER', W / 2, borda + faixa / 2 + faixa * .04, W * .8, faixa * .7)
  const y = borda + faixa + borda / 2
  desenhaMarca(g, p, borda, y, W - borda * 2, H - y - borda, pronta)
}

function criarPlacaMaster(root: T.Group, state: EstadoComplexo, brandId: string, onChange: () => void) {
  const p = placaDoMaster(brandId)
  if (!p) return { dispose() {} }
  const grupo = new T.Group(); grupo.name = 'placa-master:' + brandId; root.add(grupo)
  const recursos: { dispose(): void }[] = []
  let desligado = false
  const arte = (W: number, H: number, faixa: number, borda: number) => {
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
    const g = canvas.getContext('2d')!, map = texturaCanvas(canvas)
    const desenha = () => { if (desligado) return; desenhaMaster(g, p, W, H, faixa, borda, desenha); map.needsUpdate = true; onChange() }
    desenha(); void document.fonts?.ready.then(desenha)
    const mat = new T.MeshBasicMaterial({ map, toneMapped: false })
    recursos.push(map, mat)
    return mat
  }
  // 🚫 03/11 (Diego, print da placa em cima da portaria: *"isso aqui pode tirar"*): a placa grande da FACHADA saiu — o Master fica
  // só no telão (e nas placas da beira do gramado).
  // 📺 TELÃO: a marca por cima da tela (só existe telão quando ele foi comprado e as cadeiras estão prontas)
  if (state.screenVisible) {
    const tela = new T.PlaneGeometry(14.4, 6.8), telao = new T.Mesh(tela, arte(512, 242, 44, 6))
    telao.name = 'placa-master-telao'; telao.position.set(0, 17.2, -65.49)
    grupo.add(telao); recursos.push(tela)
  }
  onChange()
  return { dispose() { desligado = true; recursos.forEach(r => r.dispose()); grupo.removeFromParent() } }
}

/** As placas do estádio do mapa: as da beira do gramado (sempre que o estádio é válido) e as do Master (só com contrato). */
export function criarPlacasComplexo(scene: T.Scene, state: EstadoComplexo, onChange: () => void) {
  const root = new T.Group(); root.name = 'placas-estadio'; scene.add(root)
  const gramado = state.valid ? criarPlacasDoGramado(root, onChange) : { redesenha() {}, dispose() {} }
  let master: { dispose(): void } | null = null, marca: string | null = null
  const trocaMaster = (brandId: string | null) => {
    if (brandId === marca) return
    master?.dispose(); master = null; marca = brandId
    if (brandId && state.valid) master = criarPlacaMaster(root, state, brandId, onChange)
    onChange()
  }
  trocaMaster(masterDoMapa())
  const solta = observarMasterDoMapa(trocaMaster)
  return {
    root,
    inspect: () => ({ master: marca, boards: root.getObjectByName('placas-patrocinio-gramado') ? 1 : 0 }),
    dispose() { solta(); master?.dispose(); gramado.dispose(); root.removeFromParent() },
  }
}
