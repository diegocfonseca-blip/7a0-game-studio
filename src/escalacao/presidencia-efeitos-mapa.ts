// ✨ EFEITOS DE LANCE NO ESTÁDIO DO MAPA 3D (07/11, Diego: *"no mapa: trave tremendo, chapéu e a marca de onde a bola cai…
// fogos e sinalizador saindo da arquibancada da casa no gol do seu time… telão do estádio passando o replay do gol enquanto o
// jogo segue"*). SÓ DESENHO: tudo vem pronto da superfície do campinho 2D (`efeitos` em campo2d-superficie.ts — o mesmo quadro
// que decide os efeitos da aba Jogos), então o que aparece no mapa é o MESMO lance do campinho. Nada aqui mexe em jogo ou placar.
// Coordenadas do mapa: x ao longo do campo (gols em x = ±52,5), z na largura (±34), y pra cima.
import * as T from 'three'
import type { SuperficieCampo2D } from './campo2d-superficie'
import type { AssentoComplexo } from './presidencia-complexo-arquitetura'
import { tremorTrave } from './campo2d-efeitos'

const textura = (c: HTMLCanvasElement) => { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t }
function pontoMacio(cor: string): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d')!, gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, cor); gr.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c
}
function letreiro(txt: string, cor: string, emoji = ''): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160
  const g = c.getContext('2d')!
  g.font = '900 86px Oswald, "Arial Narrow", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.lineWidth = 14; g.strokeStyle = '#0C0C0C'; g.strokeText(txt, 256 + (emoji ? 40 : 0), 84); g.fillStyle = cor; g.fillText(txt, 256 + (emoji ? 40 : 0), 84)
  if (emoji) { g.font = '86px sans-serif'; g.fillText(emoji, 256 - g.measureText(txt).width / 2 - 30, 84) }
  return c
}

/** quantos quadros de replay o telão guarda (8 por segundo · 5 s antes do gol) */
const FPS_REPLAY = 8, SEG_REPLAY = 5

export function criarEfeitosMapa(scene: T.Scene, opts: { seats: () => readonly AssentoComplexo[]; telao: boolean }) {
  const root = new T.Group(); root.name = 'efeitos-lance-mapa'; scene.add(root)
  const descartar: { dispose(): void }[] = []
  const guarda = <X extends { dispose(): void }>(x: X) => { descartar.push(x); return x }

  // 🎯 onde a bola cai: sombra + anel branco no gramado
  const discoGeo = guarda(new T.CircleGeometry(1, 32)), anelGeo = guarda(new T.RingGeometry(0.82, 1, 40))
  const discoMat = guarda(new T.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false })), anelMat = guarda(new T.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }))
  const disco = new T.Mesh(discoGeo, discoMat), anel = new T.Mesh(anelGeo, anelMat)
  for (const m of [disco, anel]) { m.rotation.x = -Math.PI / 2; m.renderOrder = 12; m.visible = false; root.add(m) }

  // 🎩 chapéu e 🔔 TÓIN: letreiros que sobem e somem
  const chapeuTex = guarda(textura(letreiro('CHAPÉU!', '#FFE600', '😳'))), toinTex = guarda(textura(letreiro('TÓIN!', '#ffffff')))
  const chapeu = new T.Sprite(guarda(new T.SpriteMaterial({ map: chapeuTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })))
  const toin = new T.Sprite(guarda(new T.SpriteMaterial({ map: toinTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })))
  for (const s of [chapeu, toin]) { s.scale.set(6, 1.9, 1); s.renderOrder = 31; s.visible = false; root.add(s) }

  // 🔔 a trave tremendo: uma cópia da baliza (o gol de verdade está fundido no estádio e não mexe) que vibra por cima
  const tuboMat = guarda(new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }))
  const posteGeo = guarda(new T.CylinderGeometry(0.07, 0.07, 2.5, 10)), travGeo = guarda(new T.CylinderGeometry(0.07, 0.07, 7.44, 10))
  const balizas = new Map<number, T.Group>()
  for (const sign of [-1, 1]) {
    const g = new T.Group(); g.name = 'trave-tremendo:' + sign
    for (const z of [-3.72, 3.72]) { const p = new T.Mesh(posteGeo, tuboMat); p.position.set(0, 1.25, z); g.add(p) }
    const tr = new T.Mesh(travGeo, tuboMat); tr.rotation.x = Math.PI / 2; tr.position.set(0, 2.5, 0); g.add(tr)
    g.position.set(sign * 52.5, 0, 0); g.visible = false; root.add(g); balizas.set(sign, g)
  }

  // 🎆 fogos (partículas) e 🔥 sinalizadores (luz vermelha + fumaça) na arquibancada da SUA torcida
  const N = 900, pos = new Float32Array(N * 3), cor = new Float32Array(N * 3)
  const vel = new Float32Array(N * 3), vida = new Float32Array(N), tipo = new Uint8Array(N) // 0 livre · 1 foguete subindo · 2 faísca
  const fogosGeo = guarda(new T.BufferGeometry()); fogosGeo.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage)); fogosGeo.setAttribute('color', new T.BufferAttribute(cor, 3).setUsage(T.DynamicDrawUsage))
  const pontoTex = guarda(textura(pontoMacio('rgba(255,220,120,1)')))
  const fogosMat = guarda(new T.PointsMaterial({ size: 2.6, map: pontoTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }))
  const fogos = new T.Points(fogosGeo, fogosMat); fogos.frustumCulled = false; fogos.visible = false; fogos.renderOrder = 20; root.add(fogos)
  const flareTex = guarda(textura(pontoMacio('rgba(255,30,10,1)'))), fumacaTex = guarda(textura(pontoMacio('rgba(150,150,150,.6)')))
  const flares: { luz: T.Sprite; fumaca: T.Sprite[] }[] = []
  for (let i = 0; i < 8; i++) {
    const luz = new T.Sprite(guarda(new T.SpriteMaterial({ map: flareTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })))
    luz.visible = false; luz.renderOrder = 21; root.add(luz)
    const fumaca = [0, 1, 2, 3].map(() => { const s = new T.Sprite(guarda(new T.SpriteMaterial({ map: fumacaTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.5 }))); s.visible = false; root.add(s); return s })
    flares.push({ luz, fumaca })
  }
  let festaIni = -1, festaKey = '', lancados = 0, pontosFesta: T.Vector3[] = [], proxFoguete = 0

  // 📺 o telão: guarda os últimos 5 s do campinho e, no gol, passa o replay (duas vezes) enquanto o jogo segue
  const telaoC = document.createElement('canvas'); telaoC.width = 512; telaoC.height = 242
  const telaoTex = guarda(textura(telaoC)), telaoGeo = guarda(new T.PlaneGeometry(14.4, 6.8))
  const telao = new T.Mesh(telaoGeo, guarda(new T.MeshBasicMaterial({ map: telaoTex, toneMapped: false })))
  telao.name = 'telao-replay'; telao.position.set(0, 17.2, -65.4); telao.visible = false; root.add(telao)
  const QUADROS = FPS_REPLAY * SEG_REPLAY, fita: HTMLCanvasElement[] = []
  let iFita = 0, cheios = 0, ultCaptura = 0, replay: { ini: number; ordem: HTMLCanvasElement[] } | null = null
  const captura = (src: SuperficieCampo2D, agora: number) => {
    if (!opts.telao || replay || agora - ultCaptura < 1000 / FPS_REPLAY) return
    ultCaptura = agora
    let q = fita[iFita]; if (!q) { q = document.createElement('canvas'); q.width = 240; q.height = 240; fita[iFita] = q }
    const r = src.rect, g = q.getContext('2d')!
    // (o campinho deitado já é largo; o em pé gira 90° pra ocupar o telão, que é largo)
    const largo = r.width >= r.height
    q.width = 300; q.height = 142
    g.save()
    if (largo) g.drawImage(src.canvas, r.x, r.y, r.width, r.height, 0, 0, 300, 142)
    else { g.translate(300, 0); g.rotate(Math.PI / 2); g.drawImage(src.canvas, r.x, r.y, r.width, r.height, 0, 0, 142, 300) }
    g.restore()
    iFita = (iFita + 1) % QUADROS; cheios = Math.min(QUADROS, cheios + 1)
  }
  const pintaTelao = (q: HTMLCanvasElement, rotulo: string) => {
    const g = telaoC.getContext('2d')!
    g.fillStyle = '#05070a'; g.fillRect(0, 0, 512, 242); g.drawImage(q, 0, 0, 512, 242)
    g.fillStyle = '#C2452F'; g.fillRect(14, 14, 150, 40); g.font = '900 30px Oswald, Arial, sans-serif'; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(rotulo, 26, 35)
    telaoTex.needsUpdate = true
  }

  const assentosDaTorcida = (lado: 'home' | 'away') => {
    const s = opts.seats().filter(a => (a.supporterSide ?? 'home') === lado)
    if (!s.length) return []
    // espalhados ao longo da arquibancada (pega de 8 faixas diferentes)
    const ord = [...s].sort((a, b) => a.position.x - b.position.x), out: T.Vector3[] = []
    for (let i = 0; i < 8; i++) { const a = ord[Math.floor((i + 0.5) / 8 * ord.length)]; out.push(new T.Vector3(a.position.x, a.position.y + 1.2, a.position.z)) }
    return out
  }
  const soltaFoguete = (de: T.Vector3) => {
    for (let i = 0; i < N; i++) if (!tipo[i]) {
      tipo[i] = 1; vida[i] = 0.9 + Math.random() * 0.4
      pos.set([de.x, de.y, de.z], i * 3); vel.set([(Math.random() - 0.5) * 2, 22 + Math.random() * 6, -Math.sign(de.z) * (3 + Math.random() * 2)], i * 3)
      cor.set([1, 0.85, 0.5], i * 3); return
    }
  }
  const estoura = (k: number, base: T.Color) => {
    let n = 0
    for (let i = 0; i < N && n < 90; i++) if (!tipo[i]) {
      tipo[i] = 2; vida[i] = 1.2 + Math.random() * 0.6; n++
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), v = 9 + Math.random() * 5
      pos.set([pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]], i * 3)
      vel.set([Math.sin(ph) * Math.cos(th) * v, Math.cos(ph) * v, Math.sin(ph) * Math.sin(th) * v], i * 3)
      const c = Math.random() < 0.5 ? base : new T.Color('#FFC400'); cor.set([c.r, c.g, c.b], i * 3)
    }
  }
  let corTime = new T.Color('#FFC400')

  /** a cada quadro do mapa. `meuLado` = de que lado o SEU time joga hoje (casa/fora) */
  function update(src: SuperficieCampo2D | undefined, meuLado: 'home' | 'away', dt: number, agora: number) {
    try { const qa = (window as unknown as { __qaEfeitosMapa?: Record<string, unknown> }).__qaEfeitosMapa; if (qa) Object.assign(qa, inspecao(), { temEfeitos: !!src?.efeitos }) } catch { /* bancada */ }
    dt = Math.min(0.1, Math.max(0, dt))
    const fx = src?.active ? src.efeitos : undefined
    // 🎯
    const pz = fx?.pouso
    disco.visible = anel.visible = !!pz
    if (pz) { const k = Math.min(1, pz.falta / 1.4), r = 0.9 + 1.7 * k; disco.position.set(pz.x, 0.05, pz.z); disco.scale.setScalar(r * 0.7); anel.position.set(pz.x, 0.055, pz.z); anel.scale.setScalar(r); anelMat.opacity = 0.95 - 0.3 * k }
    // 🎩
    const ch = fx?.chapeu
    chapeu.visible = !!ch
    if (ch) { chapeu.position.set(ch.x, 3.6 + ch.age * 1.2, ch.z); (chapeu.material as T.SpriteMaterial).opacity = Math.min(1, (1 - ch.age) * 2.5) }
    // 🔔
    const tv = fx?.trave
    for (const [sign, g] of balizas) {
      const ativa = !!tv && tv.sign === sign, idade = ativa ? tv!.age * 1.1 : 1
      const d = tremorTrave(idade) * 1.6
      g.visible = ativa && d !== 0; g.position.z = d; g.rotation.x = d * 0.05
    }
    toin.visible = !!tv && tv.age < 1
    if (tv) { toin.position.set(tv.sign * 52.5, 3.4 + tv.age * 2.2, 3.72); (toin.material as T.SpriteMaterial).opacity = Math.min(1, (1 - tv.age) * 2.5) }
    // 🎆🔥 gol do SEU time: fogos e sinalizadores da sua torcida por ~7 s
    const gol = fx?.gol
    if (gol && gol.key !== festaKey) {
      festaKey = gol.key
      if (gol.side === meuLado) {
        festaIni = agora; lancados = 0; proxFoguete = 0; pontosFesta = assentosDaTorcida(meuLado)
        const meu = src?.players.find(p => p.side === meuLado && !p.keeper)?.marker.color
        corTime = new T.Color(/^#[0-9a-f]{6}$/i.test(meu ?? '') ? meu! : '#FFC400')
      }
    } else if (!gol) festaKey = ''
    const festaIdade = festaIni < 0 ? 99 : (agora - festaIni) / 1000
    if (festaIdade < 4.5 && pontosFesta.length && agora >= proxFoguete && lancados < 14) { soltaFoguete(pontosFesta[lancados % pontosFesta.length]); lancados++; proxFoguete = agora + 260 + Math.random() * 200 }
    let vivos = 0
    for (let i = 0; i < N; i++) {
      if (!tipo[i]) { pos[i * 3 + 1] = -999; continue }
      vida[i] -= dt; vivos++
      vel[i * 3 + 1] -= (tipo[i] === 1 ? 6 : 7.5) * dt
      for (let a = 0; a < 3; a++) pos[i * 3 + a] += vel[i * 3 + a] * dt
      if (tipo[i] === 2) { const f = Math.max(0, 1 - dt * 1.4); for (let a = 0; a < 3; a++) cor[i * 3 + a] *= f }
      if (vida[i] <= 0) { if (tipo[i] === 1) { tipo[i] = 0; estoura(i, corTime) } else tipo[i] = 0 }
    }
    fogos.visible = vivos > 0
    if (vivos) { fogosGeo.attributes.position.needsUpdate = true; fogosGeo.attributes.color.needsUpdate = true }
    flares.forEach((f, i) => {
      const p = pontosFesta[i], on = festaIdade < 7 && !!p
      f.luz.visible = on; f.fumaca.forEach(s => { s.visible = on })
      if (!on || !p) return
      const pisca = 0.75 + Math.sin(agora / 45 + i * 3) * 0.15 + Math.random() * 0.1, some = Math.min(1, (7 - festaIdade) / 1.2)
      f.luz.position.set(p.x, p.y + 1.6, p.z); f.luz.scale.setScalar(6 * pisca); (f.luz.material as T.SpriteMaterial).opacity = some
      f.fumaca.forEach((s, k) => { const t = ((festaIdade * 0.45 + k / 4) % 1); s.position.set(p.x + Math.sin(k * 2 + festaIdade) * 0.6, p.y + 1 + t * 7, p.z); s.scale.setScalar(2 + t * 4); (s.material as T.SpriteMaterial).opacity = 0.45 * (1 - t) * some })
    })
    // 📺 replay no telão (qualquer gol): espera 1,2 s, passa os 5 s antes do gol duas vezes e volta pro escuro
    if (src?.active) captura(src, agora)
    if (opts.telao && gol && !replay && cheios >= FPS_REPLAY * 2 && festaKey === gol.key && telao.userData.k !== gol.key) {
      telao.userData.k = gol.key
      const ordem: HTMLCanvasElement[] = []; for (let k = 0; k < cheios; k++) ordem.push(fita[(iFita - cheios + k + QUADROS) % QUADROS])
      replay = { ini: agora + 1200, ordem }
    }
    if (replay) {
      const el = (agora - replay.ini) / 1000, dur = replay.ordem.length / FPS_REPLAY
      if (el >= dur * 2) { replay = null; telao.visible = false; cheios = 0 }
      else if (el >= 0) { telao.visible = true; const q = replay.ordem[Math.min(replay.ordem.length - 1, Math.floor((el % dur) * FPS_REPLAY))]; if (q) pintaTelao(q, 'REPLAY') }
    }
  }

  function inspecao() { return { fogos: fogos.visible, replay: !!replay && telao.visible, telao: opts.telao, quadrosFita: cheios, pouso: disco.visible, chapeu: chapeu.visible, trave: [...balizas.values()].some(g => g.visible), flares: flares[0].luz.visible, ponto: pontosFesta[0]?.toArray() ?? null } }
  return {
    update,
    /** precisa continuar desenhando (fogos voando, replay passando)? */
    ativo: () => fogos.visible || !!replay || flares[0].luz.visible,
    inspect: inspecao,
    dispose() { root.removeFromParent(); descartar.forEach(d => d.dispose()) },
  }
}
