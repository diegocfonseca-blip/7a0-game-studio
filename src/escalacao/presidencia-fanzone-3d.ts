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
const ANDA = 2.6, CORRE = 6.2 // m/s
const LIMITE = { minX: -290, maxX: 290, minZ: -230, maxZ: 260 }
// o corpo do estádio (portões: serviço x −90 · visitante x 105 · casa z 82) — andando, ninguém atravessa a parede
const ESTADIO = { minX: -91, maxX: 104, minZ: -84, maxZ: 81 }
const PERTO_PORTAO = 12
const INICIO = { x: STADIUM_HOME_GATE.approach.x + 4, z: STADIUM_HOME_GATE.approach.z + 22 }

export function dentroDoEstadio(x: number, z: number): boolean {
  return x > ESTADIO.minX && x < ESTADIO.maxX && z > ESTADIO.minZ && z < ESTADIO.maxZ
}
/** um passo do boneco: anda na direção pedida, mas nunca sai do mundo nem entra no estádio (desliza pela parede) */
export function passoFanZone(x: number, z: number, dx: number, dz: number): { x: number; z: number } {
  const cx = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
  let nx = cx(x + dx, LIMITE.minX, LIMITE.maxX), nz = cx(z + dz, LIMITE.minZ, LIMITE.maxZ)
  if (dentroDoEstadio(nx, nz)) {
    if (!dentroDoEstadio(nx, z)) nz = z
    else if (!dentroDoEstadio(x, nz)) nx = x
    else { nx = x; nz = z }
  }
  return { x: nx, z: nz }
}
/** cadeiras pra escolher: setor da CASA, anel de baixo, perto do meio-campo, nenhuma que a torcida já ocupa */
export function cadeirasDaCasa(seats: readonly AssentoComplexo[], ocupadas: ReadonlySet<string>, n = 4): AssentoComplexo[] {
  const casa = seats.filter(s => s.tier === 'lower' && s.sector !== 'visitante' && s.supporterSide !== 'away' && !ocupadas.has(s.id))
  return casa.sort((a, b) => Math.abs(a.row - 6) - Math.abs(b.row - 6) || Math.abs(a.position.x) - Math.abs(b.position.x)).slice(0, n)
}

export function criarFanZone(scene: THREE.Scene, opts: { seats: () => readonly AssentoComplexo[]; ocupadas: () => ReadonlySet<string>; cor?: string; onFase: (f: FaseFanZone, extra?: { cadeiras?: CadeiraFanZone[]; escolhida?: string }) => void }) {
  let fase: FaseFanZone = 'fora'
  const pos = new THREE.Vector3(INICIO.x, CHAO, INICIO.z)
  let heading = Math.PI, camYaw = Math.PI, dist = 0, vel = 0, seated = 0, seatedAlvo = 0, t = 0
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
    if (!ator) ator = createCivilian(scene, { id: 'fanzone-eu', variant: 'adult-man', outfitColor: /^#[0-9a-f]{6}$/i.test(opts.cor ?? '') ? opts.cor : '#FFC400' })
    ator.root.visible = true
    pos.set(INICIO.x, CHAO, INICIO.z); heading = Math.PI; camYaw = Math.PI; seated = seatedAlvo = 0; vel = 0
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
  function rotular(s: AssentoComplexo): CadeiraFanZone { return { id: s.id, rotulo: `Fileira ${s.row + 1} · Cadeira ${s.column + 1}` } }
  function escolher(id: string) { const s = opcoes.find(o => o.id === id); if (s) { escolhida = s; opts.onFase('escolhendo', { cadeiras: opcoes.map(rotular), escolhida: s.id }) } }
  function sentar() {
    if (!escolhida) return
    pos.set(escolhida.position.x, escolhida.position.y, escolhida.position.z); heading = escolhida.heading; seatedAlvo = 1; vel = 0
    muda('sentado')
  }
  function levantar() {
    seatedAlvo = 0; seated = 0
    const g = STADIUM_HOME_GATE
    pos.set(g.approach.x, CHAO, g.approach.z - 2); heading = Math.PI; camYaw = Math.PI
    muda('andando')
  }

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
        const dx = fx * iy - rx * ix, dz = fz * iy - rz * ix, l = Math.hypot(dx, dz) || 1
        const alvo = Math.atan2(dx / l, dz / l)
        let d = alvo - heading; d = Math.atan2(Math.sin(d), Math.cos(d)); heading += d * Math.min(1, dt * 10)
        vel = (input.correr || teclas.has('shift') ? CORRE : ANDA) * m
        const p = passoFanZone(pos.x, pos.z, Math.sin(heading) * vel * dt, Math.cos(heading) * vel * dt)
        dist += Math.hypot(p.x - pos.x, p.z - pos.z); pos.x = p.x; pos.z = p.z
        let c = heading - camYaw; c = Math.atan2(Math.sin(c), Math.cos(c)); camYaw += c * Math.min(1, dt * 2.2)
      } else vel = 0
      const g = STADIUM_HOME_GATE, perto = Math.hypot(pos.x - g.approach.x, pos.z - (g.threshold.z + 6)) < PERTO_PORTAO
      if (perto && fase === 'andando') muda('portao'); else if (!perto && fase === 'portao') muda('andando')
    }
    seated += (seatedAlvo - seated) * Math.min(1, dt * 3)
    ator.root.position.copy(pos); ator.root.rotation.set(0, heading, 0)
    ator.update({ seconds: t, distance: dist, speed: vel, seated, transition: seatedAlvo < seated ? 'standing' : undefined })
    if (fase === 'andando' || fase === 'portao') {
      // atrás e um pouco acima: o boneco fica no terço de baixo e a rua aparece na frente
      camAlvo.set(pos.x + Math.sin(camYaw) * 3, pos.y + 1.6, pos.z + Math.cos(camYaw) * 3)
      camPos.set(pos.x - Math.sin(camYaw) * 7.5, pos.y + 4.2, pos.z - Math.cos(camYaw) * 7.5)
    } else {
      const s = escolhida
      if (!s) return false
      // sentado / escolhendo: atrás da cabeça, olhando pro gramado (o centro do campo)
      const hx = Math.sin(s.heading), hz = Math.cos(s.heading)
      const base = tmp.set(s.position.x, s.position.y + (s.seatHeight || 0.45), s.position.z)
      // sentado: por cima do ombro, alto o bastante pra cabeça não tapar o gramado
      camPos.set(base.x - hx * (fase === 'escolhendo' ? 4.5 : 1.9), base.y + (fase === 'escolhendo' ? 3.2 : 2.5), base.z - hz * (fase === 'escolhendo' ? 4.5 : 1.9))
      camAlvo.set(0, 0, 0).lerp(base, fase === 'escolhendo' ? 0.75 : 0.05)
      if (fase === 'escolhendo') { pos.copy(base); ator.root.position.set(s.position.x, s.position.y, s.position.z); ator.root.rotation.set(0, s.heading, 0) }
    }
    camera.position.lerp(camPos, Math.min(1, dt * 6)); target.lerp(camAlvo, Math.min(1, dt * 8))
    camera.lookAt(target); camera.updateMatrixWorld()
    return true
  }

  return {
    input, ligar, desligar, entrar, escolher, sentar, levantar, update,
    ativo: () => fase !== 'fora',
    fase: () => fase,
    inspect: () => ({ fase, pos: pos.toArray(), heading, escolhida: escolhida?.id ?? null, opcoes: opcoes.map(o => o.id) }),
    dispose() { desligar(); ator?.dispose(); ator = null },
  }
}
