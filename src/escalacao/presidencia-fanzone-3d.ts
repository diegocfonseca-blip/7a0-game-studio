// 🚶 FAN ZONE NO MAPA 3D (07/11, Diego: *"andar pelas ruas… entrar no estádio… escolher a cadeira"* → mockup
// `scripts/mockups/fanzone.png` → *"pode p eu testar"*). Só a conta dele (`useFanZoneLiberada`).
// O boneco é o 1 (Rapaz, `adult-man`) dos bonecos 3D que o mapa já tem (`createCivilian`): anda, senta e levanta com as
// animações dele. Nada aqui mexe em save, jogo, torcida ou placar — é só um passeio de câmera com um boneco a mais na cena.
// Regras do passeio: o boneco nunca entra no corpo do estádio andando (só pelo botão do portão da torcida); o mundo tem borda;
// na arquibancada ele só senta em cadeira do setor da CASA que a torcida não está usando.
import * as THREE from 'three'
import { createCivilian } from './cidade3d/civilians.mjs'
import { STADIUM_HOME_GATE } from './cidade3d/stadium-entrances.mjs'
import type { AssentoComplexo } from './presidencia-complexo-arquitetura'

export type FaseFanZone = 'fora' | 'andando' | 'portao' | 'escolhendo' | 'sentado'
export type CadeiraFanZone = { id: string; rotulo: string }

const CHAO = 0.16
const ANDA = 2.4, CORRE = 4.8 // m/s (07/11: correr mais baixo — a 6,2 o passo do boneco não acompanhava e parecia escorregar)
const LIMITE = { minX: -290, maxX: 290, minZ: -230, maxZ: 260 }
// o corpo do estádio (portões: serviço x −90 · visitante x 105 · casa z 82) — andando, ninguém atravessa a parede
const ESTADIO = { minX: -91, maxX: 104, minZ: -84, maxZ: 81 }
const PERTO_PORTAO = 12
const INICIO = { x: STADIUM_HOME_GATE.approach.x + 4, z: STADIUM_HOME_GATE.approach.z + 22 }

export function dentroDoEstadio(x: number, z: number): boolean {
  return x > ESTADIO.minX && x < ESTADIO.maxX && z > ESTADIO.minZ && z < ESTADIO.maxZ
}
type Ponto = { x: number; z: number }
export type ObstaculoFanZone = { minX: number; maxX: number; minZ: number; maxZ: number; base: number; top: number; footprint?: readonly Ponto[] }
const RAIO = 0.32 // o "corpo" do boneco: chega encostado na parede, mas não entra
const dentroPoligono = (x: number, z: number, poly: readonly Ponto[]) => {
  let r = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) r = !r
  }
  return r
}
/** 07/11 (2º pedido do Diego): casa, prédio, loja, muro — o boneco não atravessa mais. Só conta o que está NO CHÃO e é alto
 *  o bastante pra barrar uma pessoa (base < 0,4 m e topo > 0,5 m); toldo, placa e marquise lá em cima não barram ninguém. */
export function criarColisaoFanZone(obstaculos: readonly ObstaculoFanZone[]) {
  const solidos = obstaculos.filter(o => o.base < 0.4 && o.top > 0.5)
  return (x: number, z: number) => {
    for (const o of solidos) {
      if (x < o.minX - RAIO || x > o.maxX + RAIO || z < o.minZ - RAIO || z > o.maxZ + RAIO) continue
      const f = o.footprint
      if (!f || f.length < 3) return true
      if (dentroPoligono(x, z, f) || dentroPoligono(x + RAIO, z, f) || dentroPoligono(x - RAIO, z, f) || dentroPoligono(x, z + RAIO, f) || dentroPoligono(x, z - RAIO, f)) return true
    }
    return false
  }
}
/** um passo do boneco: anda na direção pedida, mas nunca sai do mundo, nem entra no estádio, nem atravessa casa (desliza pela parede) */
export function passoFanZone(x: number, z: number, dx: number, dz: number, bate: (x: number, z: number) => boolean = () => false): { x: number; z: number } {
  const cx = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
  const barra = (a: number, b: number) => dentroDoEstadio(a, b) || bate(a, b)
  let nx = cx(x + dx, LIMITE.minX, LIMITE.maxX), nz = cx(z + dz, LIMITE.minZ, LIMITE.maxZ)
  if (barra(nx, nz)) {
    if (!barra(nx, z)) nz = z
    else if (!barra(x, nz)) nx = x
    else { nx = x; nz = z }
  }
  return { x: nx, z: nz }
}
/** cadeiras pra escolher: setor da CASA, anel de baixo, perto do meio-campo, nenhuma que a torcida já ocupa */
export function cadeirasDaCasa(seats: readonly AssentoComplexo[], ocupadas: ReadonlySet<string>, n = 4): AssentoComplexo[] {
  const casa = seats.filter(s => s.tier === 'lower' && s.sector !== 'visitante' && s.supporterSide !== 'away' && !ocupadas.has(s.id))
  // 07/11 (Diego: "me coloca muito próximo dos jogadores… visão muito ruim"): as de CIMA do anel, na altura do meio-campo
  const topo = casa.reduce((m, s) => Math.max(m, s.row), 0)
  return casa.sort((a, b) => Math.abs(a.row - (topo - 1)) - Math.abs(b.row - (topo - 1)) || Math.abs(a.position.x) - Math.abs(b.position.x)).slice(0, n)
}

export function criarFanZone(scene: THREE.Scene, opts: { seats: () => readonly AssentoComplexo[]; ocupadas: () => ReadonlySet<string>; cor?: () => string | undefined; obstaculos?: () => readonly ObstaculoFanZone[]; onFase: (f: FaseFanZone, extra?: { cadeiras?: CadeiraFanZone[]; escolhida?: string }) => void }) {
  let fase: FaseFanZone = 'fora'
  const pos = new THREE.Vector3(INICIO.x, CHAO, INICIO.z)
  let nObst = 0, comemoraIni = -1, corAtual = '', bate: (x: number, z: number) => boolean = () => false
  let heading = Math.PI, camYaw = Math.PI, camPitch = 0.42, olhar = 0, olharPitch = 0, dist = 0, vel = 0, seated = 0, seatedAlvo = 0, t = 0
  let opcoes: AssentoComplexo[] = [], escolhida: AssentoComplexo | null = null
  const input = { x: 0, y: 0, correr: false }
  const teclas = new Set<string>()
  let ator: ReturnType<typeof createCivilian> | null = null
  const camAlvo = new THREE.Vector3(), camPos = new THREE.Vector3(), tmp = new THREE.Vector3()
  const muda = (f: FaseFanZone, extra?: Parameters<typeof opts.onFase>[1]) => { fase = f; opts.onFase(f, extra) }
  const tecla = (e: KeyboardEvent, on: boolean) => {
    const k = e.key.toLowerCase()
    if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) return
    if (fase !== 'andando' && fase !== 'portao') return
    e.preventDefault()
    if (on) teclas.add(k); else teclas.delete(k)
  }
  const down = (e: KeyboardEvent) => tecla(e, true), up = (e: KeyboardEvent) => tecla(e, false)

  function ligar() {
    if (fase !== 'fora') return
    // 07/11: a camisa sai na cor do SEU time (a do jogo do dia; sem jogo, dourado). Mudou a cor? Veste o boneco de novo.
    const c = opts.cor?.() ?? '', cor = /^#[0-9a-f]{6}$/i.test(c) ? c : '#FFC400'
    if (ator && cor !== corAtual) { ator.dispose(); ator = null }
    if (!ator) { ator = createCivilian(scene, { id: 'fanzone-eu', variant: 'adult-man', outfitColor: cor }); corAtual = cor }
    const obst = opts.obstaculos?.() ?? []; nObst = obst.filter(o => o.base < 0.4 && o.top > 0.5).length
    bate = criarColisaoFanZone(obst)
    ator.root.visible = true
    pos.set(INICIO.x, CHAO, INICIO.z); heading = Math.PI; camYaw = Math.PI; camPitch = 0.42; olhar = olharPitch = 0; seated = seatedAlvo = 0; vel = 0; comemoraIni = -1
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    muda('andando')
  }
  function desligar() {
    if (fase === 'fora') return
    window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); teclas.clear()
    input.x = input.y = 0
    if (ator) ator.root.visible = false
    escolhida = null
    muda('fora')
  }
  function entrar() {
    opcoes = cadeirasDaCasa(opts.seats(), opts.ocupadas())
    if (!opcoes.length) return false
    escolhida = opcoes[0]
    muda('escolhendo', { cadeiras: opcoes.map(rotular), escolhida: escolhida.id })
    return true
  }
  /** arrastar o dedo na tela: gira a câmera (360° em volta do boneco · sentado, olha em volta da cadeira) */
  function girar(dx: number, dy: number) {
    if (fase === 'sentado' || fase === 'escolhendo') {
      olhar = Math.max(-1.3, Math.min(1.3, olhar - dx * 0.006)); olharPitch = Math.max(-0.35, Math.min(0.5, olharPitch + dy * 0.004)); return
    }
    camYaw -= dx * 0.008; camPitch = Math.max(0.12, Math.min(1.1, camPitch + dy * 0.005))
  }
  function rotular(s: AssentoComplexo): CadeiraFanZone { return { id: s.id, rotulo: `Fileira ${s.row + 1} · Cadeira ${s.column + 1}` } }
  function escolher(id: string) { const s = opcoes.find(o => o.id === id); if (s) { escolhida = s; opts.onFase('escolhendo', { cadeiras: opcoes.map(rotular), escolhida: s.id }) } }
  function sentar() {
    if (!escolhida) return
    pos.set(escolhida.position.x, escolhida.position.y, escolhida.position.z); heading = escolhida.heading; seatedAlvo = 1; vel = 0; olhar = olharPitch = 0
    muda('sentado')
  }
  function levantar() {
    seatedAlvo = 0; seated = 0; comemoraIni = -1
    const g = STADIUM_HOME_GATE
    pos.set(g.approach.x, CHAO, g.approach.z - 2); heading = Math.PI; camYaw = Math.PI
    muda('andando')
  }

  const PORTAO = { x: STADIUM_HOME_GATE.approach.x, z: STADIUM_HOME_GATE.threshold.z + 6 }
  /** 07/11: atalho "ir pro portão" — leva o boneco pra frente do portão da torcida, de frente pra ele */
  function irProPortao() {
    if (fase !== 'andando' && fase !== 'portao') return
    pos.set(PORTAO.x, CHAO, PORTAO.z + 5); heading = Math.PI; camYaw = Math.PI; vel = 0
  }
  /** a seta do canto: quantos metros até o portão e pra que lado da TELA ele fica (0 = pra frente, + = pra direita) */
  function rumo() {
    const vx = PORTAO.x - pos.x, vz = PORTAO.z - pos.z, c = Math.cos(camYaw), sn = Math.sin(camYaw)
    return { metros: Math.round(Math.hypot(vx, vz)), angulo: Math.atan2(-vx * c + vz * sn, vx * sn + vz * c) }
  }
  /** gol do seu time com você sentado: levanta, comemora (Victory) com uns pulinhos e senta de novo */
  function gol() { if (fase === 'sentado' && comemoraIni < 0) comemoraIni = t }

  /** a cada quadro (dentro do render do mapa): anda o boneco e põe a câmera. Devolve true se a câmera é dele. */
  function update(dt: number, camera: THREE.PerspectiveCamera, target: THREE.Vector3): boolean {
    if (fase === 'fora' || !ator) return false
    dt = Math.min(0.1, Math.max(0, dt)); t += dt
    if (fase === 'andando' || fase === 'portao') {
      let ix = input.x, iy = input.y
      if (teclas.has('a') || teclas.has('arrowleft')) ix -= 1
      if (teclas.has('d') || teclas.has('arrowright')) ix += 1
      if (teclas.has('w') || teclas.has('arrowup')) iy += 1
      if (teclas.has('s') || teclas.has('arrowdown')) iy -= 1
      const m = Math.min(1, Math.hypot(ix, iy))
      if (m > 0.08) {
        // controle relativo à câmera: pra cima = pra frente na tela
        const fx = Math.sin(camYaw), fz = Math.cos(camYaw), rx = -fz, rz = fx
        const dx = fx * iy + rx * ix, dz = fz * iy + rz * ix, l = Math.hypot(dx, dz) || 1 // 07/11: era "−" e a esquerda andava pra direita
        const alvo = Math.atan2(dx / l, dz / l)
        let d = alvo - heading; d = Math.atan2(Math.sin(d), Math.cos(d)); heading += d * Math.min(1, dt * 10)
        vel = (input.correr || teclas.has('shift') ? CORRE : ANDA) * m
        const p = passoFanZone(pos.x, pos.z, Math.sin(heading) * vel * dt, Math.cos(heading) * vel * dt, bate)
        dist += Math.hypot(p.x - pos.x, p.z - pos.z); pos.x = p.x; pos.z = p.z
      } else vel = 0
      const g = STADIUM_HOME_GATE, perto = Math.hypot(pos.x - g.approach.x, pos.z - (g.threshold.z + 6)) < PERTO_PORTAO
      if (perto && fase === 'andando') muda('portao'); else if (!perto && fase === 'portao') muda('andando')
    }
    const COMEMORA = 3.4, ct = comemoraIni < 0 ? -1 : t - comemoraIni
    if (ct > COMEMORA) comemoraIni = -1
    const festa = ct >= 0 && ct <= COMEMORA, alvoSentado = festa && ct < COMEMORA - 0.6 ? 0 : seatedAlvo
    seated += (alvoSentado - seated) * Math.min(1, dt * (festa ? 9 : 3))
    if (festa && alvoSentado === 0 && seated < 0.02) seated = 0
    const pulo = festa && seated === 0 ? Math.abs(Math.sin(ct * 7)) * 0.22 : 0
    ator.root.position.set(pos.x, pos.y + pulo, pos.z); ator.root.rotation.set(0, heading, 0)
    ator.update({ seconds: t, distance: dist, speed: vel, seated, transition: alvoSentado < seated ? 'standing' : undefined, ...(festa && seated === 0 ? { activity: 'celebrating', activityTime: Math.max(0, ct - 0.4) } : {}) })
    if (fase === 'andando' || fase === 'portao') {
      // atrás e acima, girando com o dedo (camYaw/camPitch): o boneco no terço de baixo e a rua na frente
      const d = 9, hz = Math.cos(camPitch) * d, vy = Math.sin(camPitch) * d
      camAlvo.set(pos.x + Math.sin(camYaw) * 2, pos.y + 1.5, pos.z + Math.cos(camYaw) * 2)
      camPos.set(pos.x - Math.sin(camYaw) * hz, pos.y + 1.2 + vy, pos.z - Math.cos(camYaw) * hz)
    } else {
      const s = escolhida
      if (!s) return false
      // sentado / escolhendo: atrás da cabeça, olhando pro gramado (o centro do campo)
      const hx = Math.sin(s.heading), hz = Math.cos(s.heading)
      const base = tmp.set(s.position.x, s.position.y + (s.seatHeight || 0.45), s.position.z)
      // sentado: por cima do ombro, alto o bastante pra cabeça não tapar o gramado
      // 🎉 no gol do seu time a câmera recua um pouco pra você VER o boneco levantar e pular (sentado ele fica embaixo da câmera)
      // (câmera de TV: na frente dele, um pouco de lado e acima, olhando pra ele com a torcida atrás)
      const recua = fase === 'escolhendo' ? 4.5 : 1.9, sobe = fase === 'escolhendo' ? 3.2 : 2.5
      if (festa) { camPos.set(base.x + hx * 4.4 + hz * 1.6, base.y + 2.4, base.z + hz * 4.4 - hx * 1.6); camAlvo.set(base.x, base.y + 0.7, base.z) }
      else { camPos.set(base.x - hx * recua, base.y + sobe, base.z - hz * recua); camAlvo.set(0, 0, 0).lerp(base, fase === 'escolhendo' ? 0.75 : 0.05) }
      if (fase === 'sentado' && !festa && (olhar || olharPitch)) { // olhando em volta da cadeira (gira o alvo em torno da cabeça)
        const vx = camAlvo.x - camPos.x, vz = camAlvo.z - camPos.z, c = Math.cos(olhar), sn = Math.sin(olhar)
        camAlvo.set(camPos.x + vx * c - vz * sn, camAlvo.y + olharPitch * 40, camPos.z + vx * sn + vz * c)
      }
      if (fase === 'escolhendo') { pos.copy(base); ator.root.position.set(s.position.x, s.position.y, s.position.z); ator.root.rotation.set(0, s.heading, 0) }
    }
    camera.position.lerp(camPos, Math.min(1, dt * 12)); target.lerp(camAlvo, Math.min(1, dt * 14)) // 07/11: segue mais colado (correndo ficava pra trás)
    camera.lookAt(target); camera.updateMatrixWorld()
    return true
  }

  return {
    input, ligar, desligar, entrar, escolher, sentar, levantar, update, girar, irProPortao, rumo, gol,
    ativo: () => fase !== 'fora',
    /** onde o boneco está (o som da torcida cresce conforme ele chega perto do estádio) */
    posicao: () => pos,
    fase: () => fase,
    inspect: () => ({ comemorando: comemoraIni >= 0, obstaculos: nObst, fase, pos: pos.toArray(), heading, escolhida: escolhida?.id ?? null, opcoes: opcoes.map(o => o.id) }),
    dispose() { desligar(); ator?.dispose(); ator = null },
  }
}
