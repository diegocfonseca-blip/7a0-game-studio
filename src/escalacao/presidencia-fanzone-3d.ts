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
import {cameraLivrePasseio} from './presidencia-passeio-geometria'

export type FaseFanZone = 'fora' | 'andando' | 'portao' | 'escolhendo' | 'sentado'
export type CadeiraFanZone = { id: string; rotulo: string }
export type DestinoPasseio = {id:string;nome:readonly [string,string];x:number;z:number;acao?:readonly [string,string]}
export type EstadoPasseioPessoa = {fase:FaseFanZone;pos:number[];heading:number;camYaw:number;camPitch:number;dist:number;correr:boolean;destino:string;cadeira:string|null}

const CHAO = 0.16
export const RITMO_PASSEIO = { andar: 2.4, correr: 5.6 } as const // corrida +17%; animação continua seguindo a distância real
export type LimitesFanZone = { minX: number; maxX: number; minZ: number; maxZ: number }
const LIMITE: LimitesFanZone = { minX: -290, maxX: 290, minZ: -230, maxZ: 260 }
// o corpo do estádio (portões: serviço x −90 · visitante x 105 · casa z 82) — andando, ninguém atravessa a parede
const ESTADIO = { minX: -91, maxX: 104, minZ: -84, maxZ: 81 }
const PERTO_PORTAO = 12
const INICIO = { x: STADIUM_HOME_GATE.approach.x + 4, z: STADIUM_HOME_GATE.approach.z + 22 }

export function dentroDoEstadio(x: number, z: number): boolean {
  return x > ESTADIO.minX && x < ESTADIO.maxX && z > ESTADIO.minZ && z < ESTADIO.maxZ
}
type Ponto = { x: number; z: number }
/** Inclui os endereços e bairros atuais sem liberar o personagem fora da cidade. */
export function limitesFanZone(pontos: readonly Ponto[], margem = 12): LimitesFanZone {
  const bounds = { ...LIMITE }
  for (const p of pontos) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) continue
    bounds.minX = Math.min(bounds.minX, p.x - margem); bounds.maxX = Math.max(bounds.maxX, p.x + margem)
    bounds.minZ = Math.min(bounds.minZ, p.z - margem); bounds.maxZ = Math.max(bounds.maxZ, p.z + margem)
  }
  return bounds
}
export type ObstaculoFanZone = { minX: number; maxX: number; minZ: number; maxZ: number; base: number; top: number; footprint?: readonly Ponto[];piso?:boolean }
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
  const solidos = obstaculos.filter(o => o.top > 0.5 || o.piso)
  return (x: number, z: number, feet=CHAO) => {
    for (const o of solidos) {
      if(o.base>=feet+1.7||o.top<=feet+(o.piso?.38:.1))continue
      if(o.piso&&(x<o.minX||x>o.maxX||z<o.minZ||z>o.maxZ||o.footprint&&!dentroPoligono(x,z,o.footprint)))continue
      if (x < o.minX - RAIO || x > o.maxX + RAIO || z < o.minZ - RAIO || z > o.maxZ + RAIO) continue
      const f = o.footprint
      if (!f || f.length < 3) return true
      if (dentroPoligono(x, z, f) || dentroPoligono(x + RAIO, z, f) || dentroPoligono(x - RAIO, z, f) || dentroPoligono(x, z + RAIO, f) || dentroPoligono(x, z - RAIO, f)) return true
    }
    return false
  }
}
/** um passo do boneco: anda na direção pedida, mas nunca sai do mundo, nem entra no estádio, nem atravessa casa (desliza pela parede) */
export function passoFanZone(x: number, z: number, dx: number, dz: number, bate: (x: number, z: number) => boolean = () => false, limites = LIMITE): { x: number; z: number } {
  const cx = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
  const barra = (a: number, b: number) => dentroDoEstadio(a, b) || bate(a, b)
  // Passos curtos impedem atravessar uma parede fina ao correr ou num quadro lento.
  const passos = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .16))
  for (let i = 0; i < passos; i++) {
    let nx = cx(x + dx / passos, limites.minX, limites.maxX), nz = cx(z + dz / passos, limites.minZ, limites.maxZ)
    if (barra(nx, nz)) {
      if (!barra(nx, z)) nz = z
      else if (!barra(x, nz)) nx = x
      else { nx = x; nz = z }
    }
    x = nx; z = nz
  }
  return { x, z }
}
/** cadeiras pra escolher: setor da CASA, anel de baixo, perto do meio-campo, nenhuma que a torcida já ocupa */
export function cadeirasDaCasa(seats: readonly AssentoComplexo[], ocupadas: ReadonlySet<string>, n = 4): AssentoComplexo[] {
  const casa = seats.filter(s => s.tier === 'lower' && s.sector !== 'visitante' && s.supporterSide !== 'away' && !ocupadas.has(s.id))
  // 07/11 (Diego: "me coloca muito próximo dos jogadores… visão muito ruim"): as de CIMA do anel, na altura do meio-campo
  const topo = casa.reduce((m, s) => Math.max(m, s.row), 0)
  return casa.sort((a, b) => Math.abs(a.row - (topo - 1)) - Math.abs(b.row - (topo - 1)) || Math.abs(a.position.x) - Math.abs(b.position.x)).slice(0, n)
}

export function criarFanZone(scene: THREE.Scene, opts: { somenteEstadio?:()=>boolean; seats: () => readonly AssentoComplexo[]; ocupadas: () => ReadonlySet<string>; cor?: () => string | undefined; obstaculos?: () => readonly ObstaculoFanZone[]; limites?: LimitesFanZone;piso?:(x:number,z:number,previous:number)=>number|null;destinos?:()=>readonly DestinoPasseio[];onInteragir?:(id:string)=>void; onFase: (f: FaseFanZone, extra?: { cadeiras?: CadeiraFanZone[]; escolhida?: string }) => void }) {
  let fase: FaseFanZone = 'fora'
  const pos = new THREE.Vector3(INICIO.x, CHAO, INICIO.z)
  let nObst = 0, comemoraIni = -1, corAtual = '', bate: (x: number, z: number,feet?:number) => boolean = () => false,obstaculos:readonly ObstaculoFanZone[]=[],destino='portao'
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
    if (!on) { teclas.delete(k); return }
    if (fase !== 'andando' && fase !== 'portao') return
    if (e.ctrlKey || e.metaKey || e.altKey || e.target instanceof HTMLElement && e.target.closest('input,textarea,select,[contenteditable="true"]')) return
    e.preventDefault()
    teclas.add(k)
  }
  const down = (e: KeyboardEvent) => tecla(e, true), up = (e: KeyboardEvent) => tecla(e, false)
  const parar = () => { teclas.clear(); input.x = input.y = 0; vel = 0 }
  const visibilidade = () => { if (document.hidden) parar() }

  function ligar() {
    if (fase !== 'fora') return
    // 07/11: a camisa sai na cor do SEU time (a do jogo do dia; sem jogo, dourado). Mudou a cor? Veste o boneco de novo.
    const c = opts.cor?.() ?? '', cor = /^#[0-9a-f]{6}$/i.test(c) ? c : '#FFC400'
    if (ator && cor !== corAtual) { ator.dispose(); ator = null }
    if (!ator) { ator = createCivilian(scene, { id: 'fanzone-eu', variant: 'adult-man', outfitColor: cor }); corAtual = cor }
    obstaculos=opts.obstaculos?.()??[];nObst=obstaculos.length
    bate = criarColisaoFanZone(obstaculos)
    ator.root.visible = true
    parar(); input.correr = false
    pos.set(INICIO.x, CHAO, INICIO.z); heading = Math.PI; camYaw = Math.PI; camPitch = 0.42; olhar = olharPitch = 0; seated = seatedAlvo = 0; vel = 0; comemoraIni = -1
    pos.y=opts.piso?.(pos.x,pos.z,CHAO)??CHAO
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    window.addEventListener('blur', parar); document.addEventListener('visibilitychange', visibilidade)
    muda('andando')
    if(opts.somenteEstadio?.()&&!entrar())desligar()
  }
  function desligar() {
    if (fase === 'fora') return
    window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); teclas.clear()
    window.removeEventListener('blur', parar); document.removeEventListener('visibilitychange', visibilidade)
    parar(); input.correr = false
    if (ator) ator.root.visible = false
    escolhida = null
    muda('fora')
  }
  function entrar() {
    opcoes = cadeirasDaCasa(opts.seats(), opts.ocupadas())
    if (!opcoes.length) return false
    escolhida = opcoes[0]
    parar()
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
    if (!escolhida) return false
    // A torcida pode chegar enquanto o usuário escolhe: conferir a vaga de novo.
    if (opts.ocupadas().has(escolhida.id) || !opts.seats().some(s => s.id === escolhida!.id)) {
      opcoes = cadeirasDaCasa(opts.seats(), opts.ocupadas()); escolhida = opcoes[0] ?? null
      muda('escolhendo', { cadeiras: opcoes.map(rotular), escolhida: escolhida?.id ?? '' })
      return false
    }
    pos.set(escolhida.position.x, escolhida.position.y, escolhida.position.z); heading = escolhida.heading; seatedAlvo = 1; vel = 0; olhar = olharPitch = 0
    muda('sentado')
    return true
  }
  function levantar() {
    if(opts.somenteEstadio?.()){if(!entrar())desligar();return}
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
    const escolhido=destinos().find(d=>d.id===destino),p=escolhido??PORTAO
    const vx = p.x - pos.x, vz = p.z - pos.z, c = Math.cos(camYaw), sn = Math.sin(camYaw)
    return { metros: Math.round(Math.hypot(vx, vz)), angulo: Math.atan2(-vx * c + vz * sn, vx * sn + vz * c) }
  }
  function destinos():readonly DestinoPasseio[]{return opts.destinos?.()??[{id:'portao',nome:['Portão','Gate'],...PORTAO}]}
  function escolherDestino(id:string){if(!id||destinos().some(d=>d.id===id))destino=id}
  function proximo(){
    if(fase!=='andando'&&fase!=='portao')return null
    return destinos().filter(d=>d.acao&&Math.hypot(d.x-pos.x,d.z-pos.z)<5).filter(d=>{
      const steps=Math.ceil(Math.hypot(d.x-pos.x,d.z-pos.z)/.4)
      return Array.from({length:steps},(_,i)=>({x:pos.x+(d.x-pos.x)*(i+1)/steps,z:pos.z+(d.z-pos.z)*(i+1)/steps})).every(p=>!bate(p.x,p.z,pos.y))
    }).sort((a,b)=>Math.hypot(a.x-pos.x,a.z-pos.z)-Math.hypot(b.x-pos.x,b.z-pos.z))[0]??null
  }
  function interagir(){const d=proximo();if(!d||!opts.onInteragir)return false;parar();opts.onInteragir(d.id);return true}
  function centralizar(){camYaw=heading;camPitch=.42;olhar=olharPitch=0}
  function snapshot():EstadoPasseioPessoa{return{fase,pos:pos.toArray(),heading,camYaw,camPitch,dist,correr:input.correr,destino,cadeira:escolhida?.id??null}}
  function restaurar(s:EstadoPasseioPessoa){
    if(s.fase==='fora'||s.pos.length!==3||![...s.pos,s.heading,s.camYaw,s.camPitch,s.dist].every(Number.isFinite))return false
    const b=opts.limites??LIMITE,seat=s.cadeira?opts.seats().find(c=>c.id===s.cadeira&&c.tier==='lower'&&c.sector!=='visitante'&&c.supporterSide!=='away'&&!opts.ocupadas().has(c.id)):undefined
    if(s.pos[0]<b.minX||s.pos[0]>b.maxX||s.pos[2]<b.minZ||s.pos[2]>b.maxZ)return false
    const piso=opts.piso?.(s.pos[0],s.pos[2],s.pos[1])
    if((s.fase==='andando'||s.fase==='portao')&&(criarColisaoFanZone(opts.obstaculos?.()??[])(s.pos[0],s.pos[2],s.pos[1])||dentroDoEstadio(s.pos[0],s.pos[2])||piso===null))return false
    if((s.fase==='sentado'||s.fase==='escolhendo')&&!seat)return false
    ligar();pos.fromArray(s.pos);if(piso!=null&&s.fase!=='sentado'&&s.fase!=='escolhendo')pos.y=piso;heading=s.heading;camYaw=s.camYaw;camPitch=Math.max(.12,Math.min(1.1,s.camPitch));dist=s.dist;input.correr=s.correr;escolherDestino(s.destino)
    if(seat){escolhida=seat;opcoes=[seat,...cadeirasDaCasa(opts.seats(),opts.ocupadas()).filter(c=>c.id!==seat.id)].slice(0,4);seated=seatedAlvo=s.fase==='sentado'?1:0}
    muda(s.fase,{cadeiras:opcoes.map(rotular),escolhida:escolhida?.id??''});return true
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
        vel = (input.correr || teclas.has('shift') ? RITMO_PASSEIO.correr : RITMO_PASSEIO.andar) * m
        const barreira=(x:number,z:number)=>bate(x,z,pos.y)||!!opts.piso&&opts.piso(x,z,pos.y)===null
        const p = passoFanZone(pos.x, pos.z, Math.sin(heading) * vel * dt, Math.cos(heading) * vel * dt, barreira, opts.limites)
        const andou = Math.hypot(p.x - pos.x, p.z - pos.z)
        dist += andou; vel = dt > 0 ? andou / dt : 0; pos.x = p.x; pos.z = p.z
        pos.y=opts.piso?.(pos.x,pos.z,pos.y)??pos.y
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
      camPos.copy(cameraLivrePasseio(camAlvo,camPos,obstaculos))
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
    if(fase==='andando'||fase==='portao')camera.position.copy(cameraLivrePasseio(target,camera.position,obstaculos))
    camera.lookAt(target); camera.updateMatrixWorld()
    return true
  }

  return {
    input, ligar, desligar, entrar, escolher, sentar, levantar, update, girar, irProPortao, rumo, gol,centralizar,destinos,escolherDestino,proximo,interagir,snapshot,restaurar,parar,
    ativo: () => fase !== 'fora',
    /** onde o boneco está (o som da torcida cresce conforme ele chega perto do estádio) */
    posicao: () => pos,
    fase: () => fase,
    inspect: () => ({ comemorando: comemoraIni >= 0, obstaculos: nObst, fase, pos: pos.toArray(), heading,camYaw,camPitch,destino,proximo:proximo()?.id??null, velocidade: vel, distancia: dist, ritmo: RITMO_PASSEIO, limites: opts.limites ?? LIMITE, input: { ...input }, teclas: [...teclas], escolhida: escolhida?.id ?? null, opcoes: opcoes.map(o => o.id) }),
    dispose() { desligar(); ator?.dispose(); ator = null },
  }
}
