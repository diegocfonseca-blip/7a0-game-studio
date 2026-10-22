// 📺 MOTOR 2D v2 (EXPERIMENTAL) — (A) a simulação. Plano: `docs/motor-2d-v2.md`.
// Diferença pro v1: aqui NADA é decidido antes. O jogo começa com os 22 no lugar e a bola no meio; daí cada jogador decide a
// cada 0,25 s (`decide.ts` / `coletivo.ts`), a bola obedece a física (`fisica.ts`), as disputas saem dos atributos da carta
// (`atributos.ts`) e o placar, as estatísticas e a narração (`narra.ts`) são CONSEQUÊNCIA do que aconteceu.
// Fala a mesma "língua" do desenho de hoje (`campo2d.tsx` lê atl, bola, bolaAnt, entre, narra, placar, festa, rede, t,
// tatica), então o campinho, a torcida e os bonecos não mudam.
// ⚠️ Isolado: só a bancada e a trava usam. Não decide placar de ninguém.
import { nivelDe, perfilDe } from './atributos'
import { estilo2De, estiloDe, type Estilo } from '../campo2d-estilos'
import { alvoDe, andaBloco, ancora, linhaImpedimento, planeja, type Bloco } from './coletivo'
import { decide, pressaoEm, type Acao } from './decide'
import { AREA_LARG, AREA_PROF, DECISAO, DT, G, GOL_MEIO, L, SEG_POR_MIN, TRAVESSAO, W, ATRITO_AR, ATRITO_CHAO, clamp, dist, frente, fundo, len, linhaAtaque, sorteio, vRasteira, xgDe, yDe } from './fisica'
import { Narrador, PESO } from './narra'
import type { Atleta, Bola, CartaCampo, Estatistica, Evento, Grupo, Lado, TipoEvento } from './tipos'
import type { Clima } from '../campo2d-clima'

const grupoDe = (pos?: string): Grupo => (pos === 'GOL' ? 'GOL' : pos === 'LAT' ? 'LAT' : pos === 'ZAG' ? 'DEF' : pos === 'MEI' ? 'MEI' : 'ATA')
const NEED: Record<string, Record<string, number>> = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }, '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 }, '4-5-1': { GOL: 1, LAT: 2, ZAG: 2, MEI: 5, ATA: 1 },
  '3-4-3': { GOL: 1, LAT: 2, ZAG: 1, MEI: 4, ATA: 3 }, '5-3-2': { GOL: 1, LAT: 2, ZAG: 3, MEI: 3, ATA: 2 }, '4-2-4': { GOL: 1, LAT: 2, ZAG: 2, MEI: 2, ATA: 4 },
  '5-4-1': { GOL: 1, LAT: 2, ZAG: 3, MEI: 4, ATA: 1 },
}
/** os 11 pela formação do técnico (igual ao v1) */
function onze(cartas0: CartaCampo[], formacao?: string): CartaCampo[] {
  const cartas = cartas0.map(c => (c.pos || !c.sec ? c : { ...c, pos: c.sec }))
  if (cartas.length <= 11) return cartas
  const need = NEED[formacao ?? ''] ?? NEED['4-3-3'], out: CartaCampo[] = []
  for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']) out.push(...cartas.filter(c => c.pos === pos).sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0)).slice(0, need[pos]))
  for (const c of cartas) if (out.length < 11 && !out.includes(c)) out.push(c)
  return out.slice(0, 11)
}

let idSeq = 0
// 🎲 O DIA DO JOGADOR (Diego 20/10: *"o Ronaldinho pode ter over de 90 a 96… 90 é o nível mais baixo do dia dele, ele pode estar
// num meio termo ou no ápice"*): cada carta entra no jogo com um nível sorteado DENTRO da faixa lo–hi dela — preso na semente do jogo
// e no nome (o mesmo jogo dá o mesmo dia em todo aparelho). Média de dois sorteios: o meio é o mais comum, o ápice e o dia ruim são
// mais raros. Carta sem faixa: o nível da categoria, como sempre.
function diaDe(seed: number, c: CartaCampo, lado: Lado = 0): number {
  if (c.lo == null || c.hi == null || c.fake) return nivelDe(c)
  let h = (seed ^ 0x5D1A) >>> 0
  for (let i = 0; i < c.name.length; i++) h = Math.imul(h ^ c.name.charCodeAt(i), 0x01000193) >>> 0
  const u1 = (h >>> 0) / 4294967296; h = Math.imul(h ^ (h >>> 15), 0x2C1B3C6D) >>> 0
  const u2 = (h >>> 0) / 4294967296
  // 🌞 O DIA DO TIME (Diego 22/10: *"tem momento que pode ter goleada, como tem momento que pode ser 1-0"*): em parte dos jogadores o
  // dia é o MESMO do time — o time inteiro acorda inspirado ou o time inteiro está num dia ruim. Cada um continua DENTRO da faixa
  // lo–hi dele, e o dia ruim e o ápice seguem tão comuns quanto o meio; só que agora eles vêm juntos (é daí que sai a goleada)
  let t = (Math.imul((seed ^ 0x7E3) >>> 0, 0x9E3779B1) ^ (lado + 1) * 0x85EBCA6B) >>> 0
  t = Math.imul(t ^ (t >>> 13), 0xC2B2AE35) >>> 0
  const uTime = ((t ^ (t >>> 16)) >>> 0) / 4294967296
  const u = u2 < DIA_DO_TIME ? clamp(uTime + (u1 - 0.5) * 0.2, 0, 1) : u1
  return c.lo + u * (c.hi - c.lo) // (sorteio CHEIO na faixa: dia ruim e dia de ápice tão frequentes quanto o meio — Diego 21/10: o dia tem que pesar)
}
/** 🌞 em quantos jogadores o dia é o do TIME (0 = cada um no seu, 1 = o time inteiro no mesmo dia) */
const DIA_DO_TIME = 0.6
/** 😵 quanto o time abalado perde por gol de diferença além do 1º (até ABALO_MAX) */
const ABALO = 0.1, ABALO_MAX = 0.25
/** 🔥 a FORMA do dia (−1 = o pior dia da faixa · +1 = o ápice): além do nível, ela pesa no quanto ele RENDE em campo — jogador
 *  num dia ruim erra mais, no ápice acerta mais. Vale pros 22, dos dois lados (Diego 21/10). */
function formaDe(c: CartaCampo, dia: number): number {
  if (c.lo == null || c.hi == null || c.hi <= c.lo) return 0
  return ((dia - c.lo) / (c.hi - c.lo)) * 2 - 1
}
/** o que muda o nível de TODO o time hoje: técnico (a 12ª carta, mesma régua da simulação) e o evento da rodada */
export interface Ajuste { seed: number; tecnico?: number | null; evento?: number }
function montaTime(lado: Lado, cartas: CartaCampo[], formacao?: string, peloJeitoOn = false, aj?: Ajuste): Atleta[] {
  const lista = onze(cartas, formacao).slice(0, 11)
  while (lista.length < 11) lista.push({ name: '', pos: lista.some(c => c.pos === 'GOL') ? 'MEI' : 'GOL' })
  const por: Record<Grupo, CartaCampo[]> = { GOL: [], DEF: [], LAT: [], MEI: [], ATA: [] }
  for (const c of lista) por[grupoDe(c.pos)].push(c)
  if (!por.GOL.length) por.GOL.push((por.DEF.pop() ?? por.MEI.pop() ?? por.LAT.pop() ?? por.ATA.pop())!)
  const out: Atleta[] = []
  // 🎯 SÓ PRA TIME DE BOT (ninguém escalou): quem joga no meio e quem joga aberto sai do JEITO do jogador — finalizador/
  // cabeceador no centro do ataque, driblador/velocista pela ponta; no meio, desarmador de volante e passador por dentro.
  // ⚠️ TIME DE GENTE SEGUE A VAGA DO CAMPINHO (Diego 20/10: *"se o Romário está numa posição no campinho ele deveria estar ali
  // também, com base na qual o usuário decidiu botar ele"*): a ordem da escalação É a vaga (1º atacante = esquerda, 2º = meio…),
  // igual ao campinho desenha. Por isso o padrão é NÃO reordenar.
  const CENTRO: Record<Grupo, Partial<Record<Estilo, number>>> = {
    ATA: { finalizador: 3, cabeceador: 3, chutador: 2, passador: 1, driblador: -1, velocista: -1, apoiador: -2 },
    MEI: { desarmador: 3, passador: 2, chutador: 1, finalizador: 0, driblador: -1, velocista: -1, apoiador: -2 },
    GOL: {}, DEF: {}, LAT: {},
  }
  const peloJeito = (cs: CartaCampo[], g: Grupo): CartaCampo[] => {
    const n = cs.length
    if (n < 2 || !peloJeitoOn) return cs
    const nota = (c: CartaCampo) => (CENTRO[g][estiloDe(c.name, c.fame)] ?? 0) + (CENTRO[g][estilo2De(c.name, c.fame)] ?? 0) * 0.5
    const ord = cs.map((c, i) => ({ c, i, n: nota(c) })).sort((a, b) => b.n - a.n || a.i - b.i)
    // (as vagas, da mais central pra mais aberta: o mais "de meio" pega a do meio, e assim por diante)
    const vagas = [...Array(n).keys()].sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2) || a - b)
    const out: CartaCampo[] = new Array(n)
    ord.forEach((o, k) => { out[vagas[k]] = o.c })
    return out
  }
  const linha = (cs: CartaCampo[], dep: number, gr: (i: number, n: number) => Grupo) => cs.forEach((c, i) => {
    // (dupla de ataque joga por dentro — 22 e 46 —, não colada na linha lateral)
    const n = cs.length, bx = n === 1 ? 34 : n === 2 && gr(0, 2) === 'ATA' ? (i === 0 ? 22 : 46) : 9 + (50 * i) / (n - 1), g = gr(i, n)
    const centro = n > 1 ? Math.abs(i - (n - 1) / 2) / ((n - 1) / 2) : 0
    // (nível do dia + técnico: 1/12 da diferença entre ele e o jogador, igual à simulação · + o evento da rodada)
    const dia = aj && c.name ? diaDe(aj.seed, c, lado) : undefined
    const nivel = dia == null ? undefined : dia + (aj?.tecnico != null ? (aj.tecnico - dia) / 12 : 0) + (aj?.evento ?? 0)
    const pf = perfilDe(c, g, nivel)
    const forma = dia == null ? 0 : formaDe(c, dia)
    out.push({
      id: idSeq++, lado, nome: c.name, carta: c, grupo: g, estilo: pf.estilo, golpes: pf.golpes, pe: pf.pe, at: { ...pf.at }, base: pf.at, forma, tend: pf.tend,
      // (meio-campo ESCALONADO: o do meio é o volante (0,45), os de fora são os "8" que chegam na área (0,75). Três meias
      // na mesma linha deixavam um vazio de 20 m entre a bola e os atacantes)
      bx, dep: g === 'MEI' ? 0.45 + centro * 0.3 : g === 'ATA' ? dep - (1 - centro) * 0.04 : dep,
      x: 34, y: 52.5, vx: 0, vy: 0, alvo: { x: 34, y: 52.5, v: 0 }, papel: 'forma', marca: null, proxDecisao: 0, atordoado: 0, amarelos: 0, expulso: false, faltas: 0,
      // 😓 quem entra cansado pela régua da carreira (−1 😓 · −2 🥵 · −3 🚑) começa com menos gás — nada de régua nova
      gas: GAS_INICIO[Math.min(3, Math.max(0, -(c.gasMod ?? 0)))],
    })
  })
  linha(por.GOL.slice(0, 1), 0, () => 'GOL')
  const lats = por.LAT, zags = [...por.DEF, ...por.GOL.slice(1)]
  const defesa = lats.length >= 2 ? [lats[0], ...zags, ...lats.slice(1)] : [...lats, ...zags]
  linha(defesa, 0, (i, n) => ((lats.length >= 2 && (i === 0 || i === n - 1)) || (lats.length === 1 && i === 0) ? 'LAT' : 'DEF'))
  linha(peloJeito(por.MEI, 'MEI'), 0.52, () => 'MEI')
  linha(peloJeito(por.ATA, 'ATA'), 1, () => 'ATA')
  return out
}

/** gás de entrada pelo desconto da régua de condição (0 · −1 · −2 · −3) */
const GAS_INICIO = [1, 0.82, 0.68, 0.55]
/** 🏁 rotina de bola parada do time (sorteada por jogo, com variação a cada cobrança) */
export type Rotina = 'primeiro_pau' | 'segundo_pau' | 'curta'
/** 🧤 o goleiro pega mais o chute de longe: +`por` de chance a cada metro além de `de`, até `max` */
const LONGE_GK = { de: 20, por: 9, max: 0.7 }
/** 🎯 a mira abre mais rápido a partir de 18 m (quanto menor, mais torto o chute de longe) */
const MIRA_LONGE = 22
/** 🧤 o pulo do goleiro no chute de longe: o alcance cresce até (1 + max × isto) */
const PULO_LONGE = 1.2
/** ⚔️ o duelo atacante × goleiro: a diferença (reflexo − finalização) ÷ isto entra na chance da defesa (menor = pesa mais) */
const DUELO_GK = 35
/** ⚔️ (22/10) o nível tem que aparecer em campo: o passe do perna-de-pau sai mais torto e a bola foge do pé dele (menor DOMINIO =
 *  pesa mais). Antes lendas × fracos tinham 56% de posse e o placar não passava de 4×0 */
/** 🦵 botes por segundo do marcador colado (× a diferença desarme − condução ÷ BOTE_DIF) */
const BOTE = 5.5, BOTE_DIF = 40
const ERRO_PASSE = 0.004, DOMINIO = 120
/** 🧤 a chance-base de o goleiro pegar o chute que vai no gol (antes do alcance, da força e da distância) */
/** 🧑‍⚖️ ÁRBITRO (Diego 21/10, "juiz quase não trabalha"): chance de falta no bote · na chegada atrasada na bola · na dividida
 *  pelo alto · e de amarelo numa falta comum (carrinho, por trás, reincidência e último homem somam por cima) */
const FALTA_BASE = 0.42, FALTA_CHEGADA = 0.3, FALTA_AEREA = 0.14, AMARELO_BASE = 0.2
/** 🏁 corte de cabeça na própria área que sai pela linha de fundo (escanteio) */
const CORTE_ESCANTEIO = 0.4
/** 🎯 quanto a bola longa errada passa do ponto (× o erro do passe) */
const PASSOU_DO_PONTO = 1.4
/** 🦵 o passe que o rival desvia sem dominar, pelo lado do campo, vai pra lateral */
const DESVIO_LATERAL = 0.8
/** 🏁 …e o desviado dentro da própria área vai pra linha de fundo */
const DESVIO_ESCANTEIO = 0.6
const GK_BASE = -0.2
type TipoParada = 'saida' | 'lateral' | 'escanteio' | 'tiro_de_meta' | 'falta' | 'penalti'
export interface Parada { tipo: TipoParada; lado: Lado; x: number; y: number; cobrador: Atleta; desde: number }
// (jogo corrido em 1:30: a bola parada demora o mínimo que a animação pede — cada segundo parado é 1% do jogo)
const ESPERA: Record<TipoParada, number> = { saida: 0.9, lateral: 0.6, escanteio: 1.5, tiro_de_meta: 1.0, falta: 1.3, penalti: 1.8 }

const zero2 = (): [number, number] => [0, 0]

export class Motor2 {
  t = 0
  atl: Atleta[]
  bola: Bola = { x: 34, y: L / 2, h: 0, vx: 0, vy: 0, vh: 0, dono: null, ultimo: null, lance: null }
  bolaAnt = { x: 34, y: L / 2, h: 0 }
  entre = 1
  narra = ''
  placar: [number, number] = [0, 0]
  tatica: [number, number] = [0, 0]
  /** a tática que o técnico escolheu (a `tatica` de agora pode subir quando o time está perdendo) */
  private taticaBase: [number, number] = [0, 0]
  festa: { lado: Lado; autor: string; assist?: string; min: number; ate: number } | null = null
  rede: { y0: number; t0: number } | null = null
  parada: Parada | null = null
  fim = false
  posseLado: Lado = 0
  bloco: Bloco[] = []
  opcaoDe = new Map<Atleta, { x: number; y: number }>()
  corrida = new Map<Atleta, { ate: number; alvo: { x: number; y: number } }>()
  donoDesde: number | null = null
  /** até quando quem acabou de receber segura a bola (não passa nem chuta — a não ser apertado ou de frente pro gol) */
  segurarAte = 0
  /** 🌤️ o clima do jogo (chuva: a bola rasteira corre mais e o domínio erra mais) */
  clima: Clima
  /** 🏁 a rotina de bola parada de cada time nesta cobrança */
  rotina: [Rotina, Rotina] = ['primeiro_pau', 'segundo_pau']
  private rotinaBase: [Rotina, Rotina] = ['primeiro_pau', 'segundo_pau']
  /** ⏱️ acréscimos de cada tempo (minutos), calculados pelo que aconteceu */
  acrescimo: [number, number] = [0, 0]
  /** 🧑‍⚖️ lei da vantagem: a falta que o juiz deixou seguir (se o time perder a bola logo, ele volta e marca) */
  private vantagem: { z: Atleta; d: Atleta; x: number; y: number; t: number; carrinho: boolean; porTras: boolean; ultimoHomem: boolean } | null = null
  eventos: Evento[] = []
  stats: Estatistica = { posse: zero2(), passes: zero2(), passesCertos: zero2(), chutes: zero2(), noAlvo: zero2(), gols: zero2(), xg: zero2(), faltas: zero2(), amarelos: zero2(), vermelhos: zero2(), escanteios: zero2(), impedimentos: zero2(), laterais: zero2(), desarmes: zero2(), dribles: zero2(), interceptacoes: zero2(), defesas: zero2(), penaltis: zero2(), vantagens: zero2() }
  /** erros de REGRA achados pelo próprio motor (a trava reprova se aparecer algum) */
  diag = { foraDoCampo: 0, pulos: 0, reinicioErrado: 0, erros: [] as string[] }
  r: () => number
  private n: () => number
  private nar: Narrador
  private narraPeso = 0
  private narraAte = 0
  private passo = 0
  private tentou = new Map<Atleta, number>()
  private garcom: { de: Atleta; para: Atleta; t: number } | null = null
  private intervalo = false
  private acaoDe = new Map<Atleta, Acao>()

  /** `bots`: qual lado é time de BOT (sem escalação de gente) — só nesse o motor escolhe quem joga aberto e quem joga no meio pelo jeito do jogador */
  /** `extra`: técnico (nível do dia dele) e evento da rodada de cada lado — o que a simulação da carreira também usa */
  constructor(seed: number, casa: CartaCampo[], fora: CartaCampo[], en = false, formacoes: [string?, string?] = [], tatica: [number, number] = [0, 0], clima: Clima = 'sol', bots: [boolean, boolean] = [false, false], extra: { tecnico?: [number | null, number | null]; evento?: [number, number] } = {}) {
    const s = sorteio(seed)
    this.r = s.r; this.n = s.n
    this.nar = new Narrador(en, this.r)
    this.tatica = [...tatica] as [number, number]; this.taticaBase = [...tatica] as [number, number]
    this.clima = clima
    // 🏁 cada time tem a sua rotina preferida de bola parada neste jogo (o Diego pediu 1º pau · 2º pau · curta)
    const ROT: Rotina[] = ['primeiro_pau', 'segundo_pau', 'curta']
    this.rotinaBase = [ROT[Math.floor(this.r() * 3)], ROT[Math.floor(this.r() * 3)]]
    this.rotina = [...this.rotinaBase] as [Rotina, Rotina]
    this.ajuste = [0, 1].map(l => ({ seed, tecnico: extra.tecnico?.[l] ?? null, evento: extra.evento?.[l] ?? 0 }))
    this.atl = [...montaTime(0, casa, formacoes[0], bots[0], this.ajuste[0]), ...montaTime(1, fora, formacoes[1], bots[1], this.ajuste[1])]
    for (const p of this.atl) this.rende(p)
    this.atl.forEach((p, i) => { p.proxDecisao = (i % 5) * 0.05 })
    for (const l of [0, 1] as Lado[]) this.bloco[l] = { tras: 18, frente: 48, largura: 0.75, desliza: 0 }
    for (const p of this.atl) { const a = ancora(this, p); p.x = a.x; p.y = clamp(a.y, p.lado === 0 ? L / 2 + 1 : 2, p.lado === 0 ? L - 2 : L / 2 - 1) }
    this.saida(0, true)
  }

  // ── consultas usadas pelo coletivo e pela decisão ──
  // 😓 o gás pesa: sem gás, −28% de velocidade e −25% de arranque (o 🥵 entra em 0,68 e termina o jogo perto de 0,45)
  vmax(p: Atleta) { return (5.6 + p.at.vel * 0.038) * (p === this.bola.dono ? 0.88 : 1) * (0.72 + 0.28 * p.gas) }
  acel(p: Atleta) { return (4.2 + p.at.acel * 0.05) * (0.75 + 0.25 * p.gas) }
  /** 🧤 um rival vem cara a cara com este goleiro? (dono da bola do outro time, dentro dos 25 m, ninguém da defesa entre ele e o gol) */
  caraACara(gk: Atleta): Atleta | null {
    const d = this.bola.dono
    if (!d || d.lado === gk.lado) return null
    const f = fundo(gk.lado, d.y)
    if (f > 20 || Math.abs(d.x - 34) > 16) return null
    const defesa = this.atl.some(a => a.lado === gk.lado && a !== gk && fundo(gk.lado, a.y) < f + 0.5 && Math.abs(a.x - d.x) < 5 && dist(a, d) < 12)
    if (defesa) return null
    return d
  }
  /** 🏁 o jogador mandado pro ponto da rotina (1º pau / 2º pau) — alvo do cruzamento ensaiado */
  alvoDaRotina(l: Lado): Atleta | null { return this.ensaio[l]?.[0] ?? null }
  /** o companheiro que veio buscar o escanteio curto */
  curtaDe(t: Atleta): boolean { return this.ensaio[t.lado]?.curta === t }
  private ensaio: ({ 0: Atleta | null; curta: Atleta | null } | null)[] = [null, null]
  private ccNarrado: Atleta | null = null
  /** o PRIMEIRO ponto da trajetória da bola que `p` consegue alcançar (ir ao ENCONTRO dela — não pra onde ela vai parar).
   *  Antes era "onde ela estará quando eu chegar", e pra bola vindo na direção do jogador isso dava um ponto lá na frente:
   *  o receptor saía correndo pra longe do passe e o rival pegava. Anda a trajetória de 0,1 em 0,1 s (ar e chão) e devolve o
   *  ponto em que a distância cabe no tempo. Mesmas contas da física (`fisicaBola`), então o encontro bate. */
  pontoBola(p?: Atleta): { x: number; y: number } {
    const b = this.bola
    if (b.dono || !p) return { x: b.x, y: b.y }
    const vm = this.vmax(p), molhado = this.clima === 'chuva' ? 0.8 : 1, passo = 0.1
    let x = b.x, y = b.y, vx = b.vx, vy = b.vy, h = b.h, vh = b.vh
    const pt = (x: number, y: number) => ({ x: clamp(x, 0.5, W - 0.5), y: clamp(y, 0.5, L - 0.5) })
    for (let tau = 0; tau <= 4; tau += passo) {
      // (alcança: bola na altura do pé/cabeça e dá tempo de chegar — com 0,8 m de folga do passo e do alcance do pé)
      // (bola acima da cabeça não se pega: espera ela baixar até a altura do cabeceio — senão ele ia ao encontro e ela passava por cima)
      if (h <= 2 && len(p.x - x, p.y - y) <= vm * tau + (h > 0.05 ? 0 : 0.8)) return pt(x, y)
      if (h > 0 || vh > 0) {
        vh -= G * passo; h += vh * passo
        const k = 1 - ATRITO_AR * passo; vx *= k; vy *= k
        if (h <= 0) { h = 0; if (vh < -2.5) { vh = -vh * 0.4; vx *= 0.45; vy *= 0.45 } else { vh = 0; vx *= 0.8; vy *= 0.8 } }
      } else {
        const v = len(vx, vy)
        if (v < 0.05) return pt(x, y) // (parou: vai até ela)
        const nv = Math.max(0, v - (ATRITO_CHAO + 0.07 * v) * molhado * passo); vx *= nv / v; vy *= nv / v
      }
      x += vx * passo; y += vy * passo
    }
    return pt(x, y)
  }
  /** o goleiro sai na bola se chega bem antes de todo mundo */
  goleiroSai(gk: Atleta) {
    const pt = this.pontoBola(gk), tg = dist(gk, pt) / this.vmax(gk)
    return this.atl.every(a => a === gk || a.lado === gk.lado || dist(a, pt) / this.vmax(a) > tg + 0.25)
  }
  /** onde cada um fica na bola parada (respeitando as distâncias da regra) */
  lugarNaCobranca(p: Atleta): { x: number; y: number; v: number } {
    const r = this.lugarNaCobranca0(p)
    // (longe do lugar, volta correndo — a saída depois do gol esperava o atacante que ainda estava no campo do rival)
    return { ...r, v: dist(p, r) > 12 ? Math.max(r.v, 8.5) : r.v }
  }
  private lugarNaCobranca0(p: Atleta): { x: number; y: number; v: number } {
    const pa = this.parada!, v = 6
    if (p === pa.cobrador) return { x: pa.x, y: pa.y, v: 7 }
    if (p.grupo === 'GOL' && p.lado !== pa.lado && pa.tipo !== 'saida') { const g = { x: 34, y: linhaAtaque((1 - p.lado) as Lado) + (p.lado === 0 ? -0.6 : 0.6) }; return { ...g, v } }
    const an = ancora(this, p)
    let x = an.x, y = an.y
    if (pa.tipo === 'saida') {
      // cada um no seu campo; o rival fora do círculo
      y = p.lado === 0 ? Math.max(y, L / 2 + 1.2) : Math.min(y, L / 2 - 1.2)
      if (p.lado !== pa.lado) { const dy = y - L / 2, dx = x - 34; if (len(dx, dy) < 10.5) y = L / 2 + (p.lado === 0 ? 10.5 : -10.5) }
      return { x, y, v }
    }
    if (pa.tipo === 'escanteio' || (pa.tipo === 'falta' && frente(pa.lado, pa.y) < 32)) {
      // 🏁 BOLA PARADA ENSAIADA (Diego 20/10): a rotina do time manda onde os 5 sobem — 1º PAU (bloco no poste perto do
      // cobrador, um na marca pra sobra), 2º PAU (bloco no poste longe, um no 1º pau de isca) ou CURTA (um vem buscar a 5 m)
      const at = pa.lado, lin = linhaAtaque(at), rot = this.rotina[at]
      const esq = pa.x < 34, sx = esq ? -1 : 1 // o lado do cobrador
      const ataca = this.atl.filter(a => a.lado === at && a !== pa.cobrador && a.grupo !== 'GOL').sort((a, b) => b.at.cabeceio - a.at.cabeceio)
      const sobe = ataca.slice(0, 5)
      if (!this.ensaio[at]) this.ensaio[at] = { 0: sobe[0] ?? null, curta: rot === 'curta' ? ataca.slice(0, 5).sort((a, b) => b.at.passe - a.at.passe)[0] ?? null : null }
      const i = sobe.indexOf(p)
      if (i >= 0) {
        // (x em relação ao gol: o 1º pau é o poste do lado de quem cobra)
        const P1: [number, number][] = [[34 + sx * 3, 5.5], [34 + sx * 4.5, 8], [34 + sx * 1, 10.5], [34 - sx * 4, 11], [34 - sx * 7, 13]]
        const P2: [number, number][] = [[34 - sx * 3.5, 6], [34 - sx * 5, 9], [34 - sx * 1.5, 11], [34 + sx * 3, 6.5], [34 + sx * 6, 12]]
        let [x, y] = (rot === 'segundo_pau' ? P2 : P1)[i]
        if (this.ensaio[at]?.curta === p && pa.tipo === 'escanteio') { x = pa.x + (esq ? 5 : -5); y = lin + (at === 0 ? 4.5 : -4.5); return { x: clamp(x, 2, W - 2), y, v: 7 } }
        return { x: clamp(x, 2, W - 2), y: lin + (at === 0 ? y : -y), v: 7 }
      }
      if (p.lado !== at && p.grupo !== 'GOL') {
        // 🧱 BARREIRA na falta frontal: os 3 mais perto se põem a 9,15 m entre a bola e o gol
        if (pa.tipo === 'falta' && Math.abs(pa.x - 34) < 20) {
          const barra = this.atl.filter(a => a.lado !== at && a.grupo !== 'GOL').sort((a, b) => dist(a, pa) - dist(b, pa)).slice(0, 3)
          const bi = barra.indexOf(p)
          if (bi >= 0) { const gx = 34 - pa.x, gy = linhaAtaque(at) - pa.y, gd = len(gx, gy) || 1, px = -gy / gd, py = gx / gd; return { x: clamp(pa.x + (gx / gd) * 9.6 + px * (bi - 1) * 1.1, 2, W - 2), y: clamp(pa.y + (gy / gd) * 9.6 + py * (bi - 1) * 1.1, 2, L - 2), v: 7 } }
        }
        const alvo = sobe[this.atl.filter(a => a.lado !== at && a.grupo !== 'GOL').indexOf(p) % Math.max(1, sobe.length)]
        // (o marcador vai junto do atacante — mas nunca a menos de 9,15 m da bola: quem marca o "curto" espera na distância da regra)
        if (alvo && (p.grupo === 'DEF' || p.grupo === 'LAT' || p.grupo === 'MEI')) { const a = this.lugarNaCobranca0(alvo); x = a.x + 0.8; y = a.y + (at === 0 ? 1.2 : -1.2) }
      }
    }
    // rival a 9,15 m da bola (falta/escanteio) · fora da área no tiro de meta · 2 m no lateral
    if (p.lado !== pa.lado) {
      const raio = pa.tipo === 'lateral' ? 2.5 : pa.tipo === 'tiro_de_meta' ? 0 : 9.6
      const dx = x - pa.x, dy = y - pa.y, d = len(dx, dy)
      if (raio && d < raio) { const k = raio / (d || 1); x = pa.x + dx * k; y = pa.y + dy * k }
      if (pa.tipo === 'tiro_de_meta' && fundo(pa.lado, y) < AREA_PROF + 1 && Math.abs(x - 34) < AREA_LARG + 1) y = yDe(pa.lado, AREA_PROF + 2)
    }
    return { x: clamp(x, 2, W - 2), y: clamp(y, 2, L - 2), v }
  }

  // ── 🔁 TROCA NO INTERVALO (carreira, Diego): o técnico escolhe os 11 do 2º tempo com o jogo parado aos 45'. A troca vale
  // quando o juiz apita o intervalo — o 1º tempo fica IGUAL (mesma semente, nada mudou até ali), então o jogo que a tela mostrou
  // e o que decide o placar são o mesmo jogo. Quem foi expulso no 1º tempo não volta.
  private trocas: ({ cartas: CartaCampo[]; formacao?: string } | null)[] = [null, null]
  trocaTime(lado: Lado, cartas: CartaCampo[], formacao?: string) {
    this.trocas[lado] = { cartas, formacao }
    if (this.intervalo && this.t < this.intervaloT + 0.05) this.aplicaTrocas() // (pedida bem no apito: aplica na hora)
  }
  private intervaloT = 0
  private aplicaTrocas() {
    this.intervaloT = this.t
    for (const l of [0, 1] as Lado[]) {
      const tr = this.trocas[l]
      if (!tr) continue
      this.trocas[l] = null
      const velhos = this.atl.filter(a => a.lado === l)
      const fora = this.expulsos.filter(n => n.lado === l).map(n => n.nome)
      let novos = montaTime(l, tr.cartas.filter(c => !fora.includes(c.name)), tr.formacao, false, this.ajuste[l])
      if (novos.length > velhos.length) novos = [...novos.filter(a => a.nome), ...novos.filter(a => !a.nome)].slice(0, Math.max(velhos.length, novos.filter(a => a.nome).length)) // (sem o expulso, o montaTime completaria com um "sem nome")
      for (const a of novos) {
        const v = velhos.find(x => x.nome === a.nome) ?? velhos.find(x => x.grupo === a.grupo && !novos.some(n => n.nome === x.nome))
        if (v) { a.x = v.x; a.y = v.y; a.vx = v.vx; a.vy = v.vy; if (v.nome === a.nome) { a.gas = v.gas; a.amarelos = v.amarelos; a.faltas = v.faltas } }
        a.proxDecisao = this.t
        this.rende(a)
      }
      while (novos.length > velhos.length) novos.pop() // (expulso no 1º tempo: o time segue com menos)
      this.atl = [...this.atl.filter(a => a.lado !== l), ...novos]
    }
  }
  private expulsos: { lado: Lado; nome: string }[] = []

  // ── relógio ──
  avancaAte(minuto: number) {
    const alvo = minuto * SEG_POR_MIN
    let n = 0
    while (this.t + DT <= alvo && n++ < 4000) {
      for (const a of this.atl) { a.ax = a.x; a.ay = a.y }
      this.bolaAnt.x = this.bola.x; this.bolaAnt.y = this.bola.y; this.bolaAnt.h = this.bola.h
      this.passa()
    }
    this.entre = clamp((alvo - this.t) / DT, 0, 1)
  }

  // ── um passo de simulação ──
  private passa() {
    const dt = DT
    this.t += dt
    this.passo++
    if (this.fim) { for (const p of this.atl) { p.vx *= 0.9; p.vy *= 0.9; p.x = clamp(p.x + p.vx * dt, -1.5, W + 1.5); p.y = clamp(p.y + p.vy * dt, -2, L + 2) } return }
    // posse
    const d = this.bola.dono
    if (d) this.posseLado = d.lado
    else if (this.bola.lance && this.bola.lance.tipo !== 'chute' && this.bola.lance.tipo !== 'cabeceio_gol') this.posseLado = this.bola.lance.de.lado
    if (d) this.stats.posse[d.lado] += dt
    else if (this.bola.lance) this.stats.posse[this.bola.lance.de.lado] += dt

    andaBloco(this, dt)
    if (this.passo % 5 === 0) planeja(this)
    this.cansa(dt)
    this.cobraVantagem()
    // 🧤 narra a saída cara a cara (uma vez por lance)
    for (const gk of this.atl) if (gk.grupo === 'GOL') { const cc = this.caraACara(gk); if (cc && this.ccNarrado !== cc) { this.ccNarrado = cc; this.emite({ tipo: 'cara_a_cara', lado: gk.lado, a: gk.nome }) } else if (!cc && this.ccNarrado && this.ccNarrado.lado !== gk.lado) this.ccNarrado = null }

    // 🎉 festa do gol
    if (this.festa) {
      if (this.t >= this.festa.ate) {
        // 📺 CORTE DE TV (Diego 22/10, "tem momento que pode ter goleada"): a comemoração cobre o campinho inteiro, e quando a tela volta
        // o time já está arrumado pra saída — igual à transmissão, que mostra o abraço e volta com a bola no meio. Antes cada gol custava
        // ~6,5 s de tela com todo mundo voltando a pé: num 5×0 era 1/3 do jogo parado, e era isso que impedia a goleada de existir
        const sofreu = (1 - this.festa.lado) as Lado; this.festa = null; this.saida(sofreu, true, false)
      }
      else this.moveFesta()
    } else if (this.parada) this.cuidaParada()
    else {
      // ⏱️ intervalo e fim (só com a bola longe das áreas e sem chute no ar)
      const calmo = !(this.bola.lance && (this.bola.lance.tipo === 'chute' || this.bola.lance.tipo === 'cabeceio_gol')) && frente(0, this.bola.y) > 20 && frente(1, this.bola.y) > 20
      // ⏱️ ACRÉSCIMOS PELO QUE ACONTECEU (Diego 20/10): anunciados aos 44' e 89'; o tempo segue até 45+N e 90+N
      if (!this.acrescimo[0] && this.t >= 44 * SEG_POR_MIN) { this.acrescimo[0] = this.calculaAcrescimo(0, 1, 3); this.emite({ tipo: 'acrescimo', lado: 0, a: String(this.acrescimo[0]) }) }
      if (this.intervalo && !this.acrescimo[1] && this.t >= 89 * SEG_POR_MIN) { this.acrescimo[1] = this.calculaAcrescimo(45, 1, 3); this.emite({ tipo: 'acrescimo', lado: 0, a: String(this.acrescimo[1]) }) }
      const fim1 = (45 + (this.acrescimo[0] || 1)) * SEG_POR_MIN, fim2 = (90 + (this.acrescimo[1] || 3)) * SEG_POR_MIN
      if (!this.intervalo && this.t >= fim1 && (calmo || this.t >= fim1 + 1.5 * SEG_POR_MIN)) { this.intervalo = true; this.emite({ tipo: 'intervalo', lado: 0 }); this.aplicaTrocas(); this.saida(1); return }
      // (⏱️ nunca passa dos 93': é onde o relógio da tela para — gol depois disso contaria sem ninguém ver)
      if (this.intervalo && ((this.t >= fim2 && (calmo || this.t >= fim2 + 1.5 * SEG_POR_MIN)) || this.t >= 92.9 * SEG_POR_MIN)) { this.fim = true; this.emite({ tipo: 'fim', lado: 0 }); this.bola.dono = null; this.bola.vx = this.bola.vy = 0; return }
      this.decisoes()
    }
    this.movimenta(dt)
    if (!this.festa && !this.parada) { this.fisicaBola(dt); this.disputas(); this.checaLinhas() }
    else this.grudaBolaParada()
  }

  private decisoes() {
    const d = this.bola.dono
    if (d && this.t >= d.proxDecisao) {
      // reavalia mais cedo se o marcador chegou
      const a = decide(this, d)
      this.acaoDe.set(d, a)
      d.proxDecisao = this.t + DECISAO
      this.executa(d, a)
    } else if (d && this.t >= d.proxDecisao - DECISAO + 0.1 && pressaoEm(this, d, d.lado) > 0.75 && this.acaoDe.get(d)?.tipo !== 'drible') d.proxDecisao = this.t
  }

  /** 😓 o gás cai ao longo dos 90': mais pra quem corre, pra quem tem pouco físico e na chuva. Inteiro termina em ~0,78. */
  private ajuste: Ajuste[] = []
  /** 😓 O CANSAÇO PESA NA TÉCNICA (Diego 20/10: *"o Romário é 90, o Jardel 80, mas o Romário cansado… o Jardel fica muito melhor"*):
   *  o que ele rende agora = o nível do dia × (0,7 + 0,3 × gás). Inteiro = 100%; 😓 entra ~95%; 🚑 entra ~87% e cai mais no fim.
   *  Velocidade e arranque já caem pelo gás em `vmax`/`acel`; goleiro não cansa. */
  private rende(p: Atleta) {
    // (forma do dia: ±8% na técnica e no reflexo — o goleiro também tem dia)
    const fdia = 1 + p.forma * 0.08
    if (p.grupo === 'GOL') { p.at.reflexo = p.base.reflexo * fdia; p.at.posicionamento = p.base.posicionamento * fdia }
    const f = (p.grupo === 'GOL' ? 1 : 0.7 + 0.3 * p.gas) * fdia
    for (const k of ['passe', 'visao', 'finalizacao', 'cabeceio', 'desarme', 'posicionamento', 'conducao', 'decisao', 'fisico'] as const) p.at[k] = p.base[k] * f
    // 😵 TIME ABALADO (Diego 22/10): quem já toma 2+ de diferença se desorganiza — marca pior, se posiciona pior, decide pior (o goleiro
    // também sente). É assim que o 2×0 vira 5×0 no dia em que tudo dá errado
    const deficit = this.placar[(1 - p.lado) as Lado] - this.placar[p.lado]
    if (deficit >= 2) {
      const ab = 1 - Math.min(ABALO_MAX, ABALO * (deficit - 1))
      for (const k of ['desarme', 'posicionamento', 'decisao', 'reflexo'] as const) p.at[k] *= ab
    }
  }
  private cansa(dt: number) {
    if (this.passo % 20 === 0) {
      for (const p of this.atl) this.rende(p) // (1× por segundo de jogo)
      // 📣 quem está PERDENDO no 2º tempo se lança pro ataque (sobe o bloco) — e deixa espaço atrás pro contra-ataque
      for (const l of [0, 1] as Lado[]) { const df = this.placar[(1 - l) as Lado] - this.placar[l]; this.tatica[l] = this.taticaBase[l] + (this.intervalo && df >= 1 ? 1 : 0) } // (tomando de 2+, se lança de vez — e abre a defesa)
    }
    if (this.festa || this.parada) return
    const chuva = this.clima === 'chuva' ? 1.15 : 1
    for (const p of this.atl) {
      if (p.grupo === 'GOL') continue
      const v = len(p.vx, p.vy), corre = v > 6 ? 1 + (v - 6) * 0.25 : 1
      p.gas = Math.max(0.3, p.gas - 0.00245 * (1.25 - p.at.fisico * 0.005) * corre * chuva * dt)
    }
  }
  /** ⏱️ minutos de acréscimo de um tempo: gols, cartões e faltas desde `desde` */
  private calculaAcrescimo(desde: number, min: number, max: number): number {
    const t0 = desde * SEG_POR_MIN
    let n = 1
    for (const e of this.eventos) {
      if (e.t < t0) continue
      if (e.tipo === 'gol') n += 0.6; else if (e.tipo === 'amarelo' || e.tipo === 'vermelho') n += 0.35; else if (e.tipo === 'falta') n += 0.12; else if (e.tipo === 'escanteio') n += 0.06
    }
    return Math.max(min, Math.min(max, Math.round(n)))
  }
  /** 🧑‍⚖️ a vantagem dada: se o time que sofreu a falta perde a bola em até 2,5 s sem ter chegado perto do gol, o juiz volta e marca */
  private cobraVantagem() {
    const v = this.vantagem
    if (!v) return
    const passou = this.t - v.t
    const perdeu = this.posseLado !== v.d.lado && !this.bola.lance
    if (passou > 2.5 || this.festa || this.parada) { this.vantagem = null; return }
    if (perdeu && frente(v.d.lado, this.bola.y) > frente(v.d.lado, v.y) - 8) {
      this.vantagem = null
      this.emite({ tipo: 'falta', lado: v.z.lado, a: v.z.nome, b: v.d.nome })
      this.cartao(v.z, v.d, v.carrinho, v.porTras, v.ultimoHomem)
      this.para('falta', v.d.lado, v.x, v.y)
    }
  }
  /** 🟨🟥 CARTÃO PELA GRAVIDADE: carrinho por trás, último homem, reincidência */
  private cartao(z: Atleta, d: Atleta, carrinho: boolean, porTras: boolean, ultimoHomem: boolean) {
    z.faltas++
    let pAm = AMARELO_BASE + (carrinho ? 0.12 : 0) + (porTras ? 0.2 : 0) + (z.faltas >= 3 ? 0.18 : z.faltas === 2 ? 0.08 : 0) + (ultimoHomem ? 0.3 : 0)
    const pVerm = (ultimoHomem && frente(d.lado, d.y) < 30 ? 0.55 : 0) + (carrinho && porTras ? 0.06 : 0)
    if (this.r() < pVerm) { this.stats.vermelhos[z.lado]++; this.emite({ tipo: 'vermelho', lado: z.lado, a: z.nome }); z.expulso = true; this.expulsos.push({ lado: z.lado, nome: z.nome }); this.atl = this.atl.filter(a => a !== z); return }
    if (this.r() < pAm) {
      z.amarelos++
      this.stats.amarelos[z.lado]++
      if (z.amarelos >= 2) { this.stats.vermelhos[z.lado]++; this.emite({ tipo: 'vermelho', lado: z.lado, a: z.nome }); z.expulso = true; this.expulsos.push({ lado: z.lado, nome: z.nome }); this.atl = this.atl.filter(a => a !== z) }
      else this.emite({ tipo: 'amarelo', lado: z.lado, a: z.nome })
    }
  }

  // ── execução das ações de quem tem a bola ──
  private executa(p: Atleta, a: Acao) {
    switch (a.tipo) {
      case 'chute': return this.chuta(p)
      case 'conduz': case 'drible': case 'segura': {
        const v = a.tipo === 'segura' ? 2.6 : this.vmax(p)
        // (drible = vai PRA CIMA do marcador e passa por ele: o alvo é 2 m além do rival, não um ponto genérico à frente)
        if (a.tipo === 'drible' && a.contra) { const z = a.contra, dx = z.x - p.x, dy = z.y - p.y, d = len(dx, dy) || 1; p.alvo = { x: clamp(z.x + (dx / d) * 2.5, 2, W - 2), y: clamp(z.y + (dy / d) * 2.5, 2, L - 2), v }; return }
        p.alvo = { x: a.alvo.x, y: a.alvo.y, v }
        if (a.tipo === 'conduz' && p.tend.drible + (p.estilo === 'velocista' ? 0.3 : 0) > 0.45 && this.r() < 0.12) this.emite({ tipo: 'arrancada', lado: p.lado, a: p.nome })
        return
      }
      default: return this.passa_(p, a)
    }
  }
  private passa_(p: Atleta, a: Extract<Acao, { para: Atleta }>) {
    const l = p.lado, alvo = { ...a.alvo }
    const d0 = dist(p, alvo)
    // erro de execução: técnica, distância e pressão
    const pres = pressaoEm(this, p, l)
    const erro = (0.02 + (100 - p.at.passe) * ERRO_PASSE) * (1 + pres * 0.8) * (1 + (1 - p.gas) * 0.5) * (this.clima === 'chuva' ? 1.12 : 1) * d0
    alvo.x = clamp(alvo.x + this.n() * erro * 0.6, -3, W + 3); alvo.y = clamp(alvo.y + this.n() * erro * 0.6, -3, L + 3)
    // (bola longa errada costuma passar do ponto — a inversão forte demais sai pela lateral, como no jogo de verdade)
    if (a.aereo && a.tipo !== 'cruzamento') { const k = Math.abs(this.n()) * erro * PASSOU_DO_PONTO / (d0 || 1); alvo.x = clamp(alvo.x + (alvo.x - p.x) * k, -6, W + 6); alvo.y = clamp(alvo.y + (alvo.y - p.y) * k, -3, L + 3) }
    const d = dist(this.bola, alvo) || 0.1
    const ux = (alvo.x - this.bola.x) / d, uy = (alvo.y - this.bola.y) / d
    const b = this.bola
    b.dono = null; b.ultimo = p; this.donoDesde = null
    if (this.parada) this.parada = null
    if (a.aereo) {
      const T = a.tipo === 'cruzamento' ? clamp(d / 21, 0.75, 1.5) : clamp(d / 18, 0.8, 2.2) // (bola longa vai em parábola e cai ~18 m/s: dá pra dominar)
      const hFim = a.tipo === 'cruzamento' ? 1.9 : 0.3
      b.vx = (ux * d) / T; b.vy = (uy * d) / T; b.vh = (hFim + 0.5 * G * T * T) / T; b.h = 0.05
    } else {
      // passe rasteiro na MEDIDA: chega no pé a ~13 m/s (dá pra dominar e ainda anda); a enfiada chega mais mansa (~7 m/s) no
      // espaço onde o companheiro vai pegar. Antes a bola era batida pra CHEGAR a 18 m/s — e, se ninguém dominava, seguia 40 m e
      // saía pela linha de fundo (era assim que 1 em 5 bolas na área virava tiro de meta)
      const v = a.tipo === 'chutao' ? clamp(vRasteira(d, 9), 12, 28) : clamp(vRasteira(d, a.tipo === 'enfiada' ? 7 : 13) + p.at.passe * 0.015, 9, 27)
      b.vx = ux * v; b.vy = uy * v; b.vh = 0; b.h = 0
    }
    // 🚩 impedimento: o alvo do passe à frente da bola e do penúltimo rival, no campo de ataque, NA HORA do passe
    const r = a.para
    const linha = linhaImpedimento(this, l)
    const impedido = r.lado === l && frente(l, r.y) < linha - 0.3 && frente(l, r.y) < frente(l, b.y) && frente(l, r.y) < L / 2
    b.lance = { tipo: a.tipo, de: p, para: r, t0: this.t, impedido }
    this.stats.passes[l]++
    if (a.alvo.x >= 0 && a.alvo.x <= W) r.papel = 'recebe' // (chutão pra lateral: ninguém corre atrás dela pra fora do campo)
    const tipo: TipoEvento = a.tipo === 'enfiada' ? 'enfiada' : a.tipo === 'lancamento' ? 'lancamento' : a.tipo === 'inversao' ? 'inversao' : a.tipo === 'cruzamento' ? 'cruzamento' : a.tipo === 'chutao' ? 'chutao' : 'passe'
    this.emite({ tipo, lado: l, a: p.nome, b: r.nome })
  }

  private chuta(p: Atleta, cabeca = false) {
    const l = p.lado, lin = linhaAtaque(l), b = this.bola
    const pres = pressaoEm(this, p, l), f = frente(l, p.y), dGol = len(p.x - 34, f)
    const xg = xgDe(l, p.x, p.y, pres, cabeca)
    // mira: um canto (quem finaliza bem mira mais no cantinho)
    const canto = (this.r() < 0.5 ? -1 : 1) * (GOL_MEIO - 0.5 - (p.at.finalizacao / 100) * 1.4 + this.r() * 0.6)
    // (erro de mira de gente: ~metade dos chutes de 20 m vai pra fora ou por cima — antes 85% ia no gol)
    // (e de longe a mira abre mais rápido que a distância: o chute de 30 m é muito mais torto que o de 15)
    const sigma = (0.3 + (100 - p.at.finalizacao) / 34) * (dGol / 15) * (1 + Math.max(0, dGol - 18) / MIRA_LONGE) * (1 + pres * 0.7) * (cabeca ? 1.3 : 1)
    const xAlvo = 34 + canto + this.n() * sigma
    const hAlvo = clamp((cabeca ? 0.6 : 0.3 + this.r() * 1.6) + this.n() * sigma * 0.6, 0.1, 6)
    const bomba = p.golpes.includes('bomba') || p.golpes.includes('falta_bomba')
    const v = cabeca ? 13 + p.at.cabeceio * 0.04 : clamp(17 + p.at.finalizacao * 0.09 + (bomba ? 5 : 0) + this.n() * 1.5, 14, 33)
    const dx = xAlvo - b.x, dy = lin - b.y, d = len(dx, dy) || 1, T = d / v
    b.dono = null; b.ultimo = p; this.donoDesde = null
    b.vx = (dx / d) * v; b.vy = (dy / d) * v; b.vh = (hAlvo - b.h + 0.5 * G * T * T) / T
    if (this.parada) this.parada = null
    b.lance = { tipo: cabeca ? 'cabeceio_gol' : 'chute', de: p, para: null, t0: this.t, impedido: false, xg, saiuDe: { x: p.x, y: p.y } }
    this.stats.chutes[l]++; this.stats.xg[l] += xg
    this.emite({ tipo: cabeca ? 'cabeceio' : 'chute', lado: l, a: p.nome })
  }

  // ── movimento dos 22 ──
  private movimenta(dt: number) {
    const d = this.bola.dono
    for (const p of this.atl) {
      if (!this.festa && !this.fim) {
        if (p === d) {
          const ac = this.acaoDe.get(p)
          if (!ac || ac.tipo === 'chute' || 'para' in ac) p.alvo = { x: p.x, y: p.y, v: 0 }
        } else if (p.atordoado > this.t) p.alvo = { x: p.x, y: p.y, v: 0 }
        else p.alvo = alvoDe(this, p)
      }
      const dx = p.alvo.x - p.x, dy = p.alvo.y - p.y, dd = len(dx, dy)
      let vq = Math.min(p.alvo.v, this.vmax(p))
      if (dd < 1.6) vq *= dd / 1.6
      const wx = dd > 0.01 ? (dx / dd) * vq : 0, wy = dd > 0.01 ? (dy / dd) * vq : 0
      const ax = wx - p.vx, ay = wy - p.vy, aa = len(ax, ay)
      // (frear/virar é mais rápido que arrancar: quem corre pro lado errado para em meio segundo, não em dois)
      const freia = wx * p.vx + wy * p.vy < len(p.vx, p.vy) * vq * 0.5
      const lim = this.acel(p) * (freia ? 1.9 : 1) * dt
      const k = aa > lim ? lim / aa : 1
      p.vx += ax * k; p.vy += ay * k
      p.x += p.vx * dt; p.y += p.vy * dt
    }
    // ninguém dentro de ninguém (o dono e quem disputa com ele podem colar)
    const n = this.atl.length
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = this.atl[i], b = this.atl[j]
      // (perto da bola a disputa é de corpo: 1 m basta — senão o empurra-empurra não deixava ninguém chegar nela)
      const naBola = dist(a, this.bola) < 3 || dist(b, this.bola) < 3
      const min = naBola ? 1.0 : a.lado === b.lado ? 2.2 : 1.6
      const dx = b.x - a.x, dy = b.y - a.y, dd = len(dx, dy)
      if (dd < min && dd > 0.001) {
        const emp = Math.min(0.12, (min - dd) / 2), ux = dx / dd, uy = dy / dd
        if (a !== d) { a.x -= ux * emp; a.y -= uy * emp }
        if (b !== d) { b.x += ux * emp; b.y += uy * emp }
      }
    }
    for (const p of this.atl) {
      p.x = clamp(p.x, -1.5, W + 1.5); p.y = clamp(p.y, -2, L + 2)
      if (p.ax != null && len(p.x - p.ax, p.y - p.ay!) / dt > 13.5) this.diag.pulos++
    }
    // a bola no pé de quem conduz
    if (d) {
      const v = len(d.vx, d.vy), fy = d.lado === 0 ? -1 : 1
      const ux = v > 0.6 ? d.vx / v : 0, uy = v > 0.6 ? d.vy / v : fy
      const b = this.bola
      b.x = d.x + ux * 0.75; b.y = d.y + uy * 0.75; b.h = 0; b.vx = d.vx; b.vy = d.vy; b.vh = 0
    }
  }

  // ── a bola sem dono ──
  private fisicaBola(dt: number) {
    const b = this.bola
    if (b.dono) return
    if (b.h > 0 || b.vh > 0) {
      b.vh -= G * dt; b.h += b.vh * dt
      const k = 1 - ATRITO_AR * dt
      b.vx *= k; b.vy *= k
      if (b.h <= 0) {
        b.h = 0
        // (no quique a bola perde boa parte da velocidade — senão o lançamento caía e saía rolando 70 m)
        if (b.vh < -2.5) { b.vh = -b.vh * 0.4; b.vx *= 0.45; b.vy *= 0.45 } else { b.vh = 0; b.vx *= 0.8; b.vy *= 0.8 }
      }
    } else {
      const v = len(b.vx, b.vy)
      // (rasteira: a grama freia mais a bola rápida)
      const molhado = this.clima === 'chuva' ? 0.8 : 1 // 🌧️ no molhado a bola rasteira corre mais
      if (v > 0) { const nv = Math.max(0, v - (ATRITO_CHAO + 0.07 * v) * molhado * dt); b.vx *= nv / v; b.vy *= nv / v }
    }
    const yAnt = b.y
    b.x += b.vx * dt; b.y += b.vy * dt
    this.goleiroNoChute(yAnt)
    // bola parou de vez sem ninguém: o lance acabou
    if (b.lance && len(b.vx, b.vy) < 0.3 && b.h <= 0) b.lance = null
  }

  /** 🧤 o chute cruzando a linha do goleiro: defende (encaixa ou espalma) ou passa */
  private goleiroNoChute(yAnt: number) {
    const b = this.bola, lc = b.lance
    if (!lc || (lc.tipo !== 'chute' && lc.tipo !== 'cabeceio_gol') || lc.defendido) return
    const def = (1 - lc.de.lado) as Lado, gk = this.atl.find(a => a.lado === def && a.grupo === 'GOL')
    if (!gk) return
    if ((yAnt - gk.y) * (b.y - gk.y) > 0) return // ainda não cruzou a linha dele
    // 🧤 cara a cara: saído do gol, ele "fica grande" — o alcance cresce com a distância da linha (o ângulo fechado)
    const fora = fundo(def, gk.y)
    // 🎯 CHANCE BOA × CHUTE DE LONGE (Diego 21/10, "finalização boa demais"): quanto mais longe saiu o chute, mais tempo o goleiro
    // tem pra ver a bola e PULAR — o alcance dele cresce. Antes o chute de 30 m no canto passava longe da mão e entrava metade
    // das vezes, igual ao de dentro da área
    const dOrig = lc.saiuDe ? len(lc.saiuDe.x - 34, frente(lc.de.lado, lc.saiuDe.y)) : 16
    // (22/10, Diego: "quero que seja real em relação aos dois times"): a distância pesa muito pro chute do perna-de-pau e pouco pro
    // do craque — o Roberto Carlos de 30 m é perigo de verdade; o lateral da várzea de 30 m é tiro de meta
    const longe = clamp((dOrig - LONGE_GK.de) / LONGE_GK.por, 0, LONGE_GK.max) * (1 - clamp((lc.de.at.finalizacao - 65) / 40, -0.4, 0.85))
    const dx = Math.abs(b.x - gk.x), alc = (0.9 + 1.55 * (gk.at.reflexo / 100) + (gk.golpes.includes('defesa_milagrosa') ? 0.15 : 0)) * (1 + Math.min(fora, 9) * 0.07) * (1 + longe * PULO_LONGE)
    if (dx > alc || b.h > 2.55 + Math.min(fora, 9) * 0.1 + longe * 0.4) return
    const v = len(b.vx, b.vy)
    // 🧤 bola que vai pra FORA (ou por cima) não é defesa: o goleiro deixa passar e ela sai — antes ele "defendia" chute que ia
    // 5 m pra fora e o jogo nunca tinha tiro de meta depois de chute
    const lin = linhaAtaque(lc.de.lado), tGol = Math.abs(b.vy) > 0.5 ? (lin - b.y) / b.vy : 9
    if (tGol > 0) { const xGol = b.x + b.vx * tGol, hGol = b.h + b.vh * tGol - 0.5 * G * tGol * tGol; if (Math.abs(xGol - 34) > GOL_MEIO + 0.3 || hGol > TRAVESSAO + 0.35) return }
    // (goleiro de jogo de 1:30: pega menos que o de verdade — senão 7 chutes dão 1 gol e o placar fica 0×0)
    // (o goleiro ruim toma mais e o paredão segura mais: a diferença entre profissional e lenda vale ~0,35 de chance de defesa)
    // ⚔️ QUEM CHUTA × QUEM DEFENDE (Diego 22/10, "quero que seja real em relação aos dois times"): o craque contra goleiro fraco
    // faz gol de qualquer lugar; o perna-de-pau contra o paredão quase não faz. A distância pesa menos pra quem chuta bem
    const duelo = (gk.at.reflexo - lc.de.at.finalizacao) / DUELO_GK
    const p = clamp(GK_BASE - (dx / alc) * 0.55 - (v - 15) / 42 + (gk.at.reflexo - 75) / 85 + duelo + longe + (this.clima === 'chuva' ? -0.05 : 0), 0.06, 0.96)
    lc.defendido = true
    if (this.r() >= p) return // passou por ele
    this.stats.defesas[def]++
    if (v < 21 && dx < 0.8 && this.r() < 0.5 + gk.at.reflexo / 400 - (this.clima === 'chuva' ? 0.12 : 0)) {
      b.vx = b.vy = b.vh = 0; b.h = 0; b.lance = null; b.ultimo = gk; this.pega(gk)
      this.emite({ tipo: 'encaixa', lado: def, a: gk.nome }); return
    }
    // 🧤 REBOTE PRO LADO CERTO (Diego 20/10): o bom goleiro espalma pro LADO e pra longe (vira escanteio ou lateral); o fraco —
    // ou na chuva — dá rebote NA FRENTE do gol, bola viva pro atacante
    const lado = b.x < 34 ? -1 : 1
    const bem = this.r() < 0.3 + gk.at.reflexo / 170 - (this.clima === 'chuva' ? 0.15 : 0)
    b.ultimo = gk; lc.tipo = 'desvio'
    if (bem) {
      // (espalma pro lado e PRA FRENTE da linha dele: a bola segue até a linha de fundo e vira escanteio — ou lateral se for de longe)
      b.vx = lado * (9 + this.r() * 7); b.vy = b.vy * (0.15 + this.r() * 0.2); b.vh = 2.5 + this.r() * 2
      this.emite({ tipo: dx > alc * 0.6 ? 'espalma' : 'defesa', lado: def, a: gk.nome })
    } else {
      b.vx = (this.r() - 0.5) * 5; b.vy = -b.vy * (0.22 + this.r() * 0.2); b.vh = 0.8 + this.r() * 1.2
      this.emite({ tipo: 'rebote', lado: def, a: gk.nome })
    }
  }

  // ── quem domina a bola solta / corta o passe / cabeceia / desarma ──
  private disputas() {
    const b = this.bola
    if (b.dono) { this.desarmes(); return }
    const v = len(b.vx, b.vy), lc = b.lance
    const cands = this.atl.filter(p => !p.expulso && p.atordoado <= this.t && (this.tentou.get(p) ?? -9) < this.t - 0.35 && !(lc && lc.de === p && this.t - lc.t0 < 0.7)) // (quem chutou/passou não reencosta na bola na hora)
      .map(p => ({ p, d: dist(p, b) })).filter(c => c.d < (c.p.grupo === 'GOL' && this.naAreaDele(c.p, b) ? 1.9 : b.h > 1.5 ? 1.2 : 1.45)) // (um passo e o pé alcançam ~1,4 m)
      .sort((a, c) => a.d - c.d)
    for (const { p } of cands) {
      this.tentou.set(p, this.t)
      const gk = p.grupo === 'GOL' && this.naAreaDele(p, b)
      if (b.h > (gk ? 2.7 : 2.4)) continue // (bola acima da cabeça passa — só o goleiro, com a mão, alcança mais alto)
      // 🧤 chute vindo: o goleiro NÃO "recolhe" a bola como se fosse um passe — a defesa é decidida em `goleiroNoChute`, quando
      // ela cruza a linha dele (encaixa / espalma / rebote / passou). Sem isto todo chute virava "saída do goleiro" e o jogo
      // não tinha gol nem defesa nem bola fora: 88% dos chutes sumiam assim.
      if (gk && lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol') && v > 7) continue
      // chute: rival na frente pode bloquear (o goleiro trata no `goleiroNoChute`)
      if (lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol') && p.lado !== lc.de.lado && !gk) {
        if (this.t - lc.t0 > 0.12 && this.r() < 0.22 + p.at.desarme / 400) {
          // (1 em 3 bloqueios desvia a bola pra FRENTE, pro lado — e ela sai pela linha de fundo: escanteio)
          if (this.r() < 0.5) { b.vx = (this.r() < 0.5 ? -1 : 1) * (6 + this.r() * 8); b.vy *= 0.5; b.vh = 1 + this.r() * 3 } else { b.vx *= -0.3 + this.r() * 0.2; b.vy *= -0.35; b.vx += (this.r() - 0.5) * 8 }
          b.ultimo = p; lc.tipo = 'desvio'; this.emite({ tipo: 'bloqueio', lado: p.lado, a: p.nome })
        }
        continue
      }
      if (lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol') && p === lc.de) continue
      // bola alta: cabeceio
      if (b.h > 1.5 && !gk) { this.cabeceia(p); return }
      const meu = !!lc && lc.de.lado === p.lado
      const pOk = gk ? 0.93 : meu || !lc ? clamp(1.1 - v / 70 + (p.at.conducao - 60) / DOMINIO, 0.4, 0.98) : clamp(0.24 + (p.at.desarme + p.at.posicionamento - 110) / 220 + (v < 7 ? 0.3 : 0), 0.12, 0.85)
      if (this.r() < pOk) {
        // 🚩 impedimento: quem estava impedido NA HORA do passe e é o alvo, tocou primeiro
        if (lc && lc.impedido && lc.para === p && meu) {
          this.stats.impedimentos[p.lado]++
          this.emite({ tipo: 'impedimento', lado: p.lado, a: p.nome })
          this.para('falta', (1 - p.lado) as Lado, p.x, p.y); return
        }
        if (lc && meu && lc.tipo !== 'chute' && lc.tipo !== 'desvio' && lc.de !== p) { this.stats.passesCertos[p.lado]++; this.garcom = { de: lc.de, para: p, t: this.t } }
        if (lc && !meu && lc.tipo !== 'chute' && lc.tipo !== 'desvio' && lc.tipo !== 'chutao') { this.stats.interceptacoes[p.lado]++; this.emite({ tipo: 'intercepta', lado: p.lado, a: p.nome }) }
        if (gk && lc && !meu) this.emite({ tipo: 'saida_goleiro', lado: p.lado, a: p.nome })
        this.pega(p, gk ? 0.6 : 0.06 + (100 - p.at.conducao) * 0.003)
        // 🧑‍⚖️ falta na chegada: o rival que veio junto na bola, atrasado, pega o jogador em vez da bola (1 em 8 das recepções disputadas)
        if (!gk) { const z = this.atl.find(a => a.lado !== p.lado && a.grupo !== 'GOL' && a.atordoado <= this.t && dist(a, p) < 1.7); if (z && this.r() < FALTA_CHEGADA && !this.naAreaDele(z, p)) { this.falta(z, p); return } }
        return
      }
      // não dominou: a bola espirra
      b.vx = b.vx * (0.3 + this.r() * 0.3) + (this.r() - 0.5) * 4; b.vy = b.vy * (0.3 + this.r() * 0.3) + (this.r() - 0.5) * 4; b.ultimo = p
      // (perto da linha lateral, a bola que espirra do domínio sai de campo metade das vezes: lateral)
      if ((b.x < 9 || b.x > W - 9) && this.r() < 0.5) b.vx = (b.x < 34 ? -1 : 1) * (4 + this.r() * 4)
      // (o RIVAL que estica a perna no passe e não domina desvia a bola de lado — pelo lado do campo, ela sai: lateral)
      // (e o zagueiro que desvia o cruzamento/passe dentro da própria área manda pela linha de fundo: escanteio)
      else if (lc && lc.de.lado !== p.lado && fundo(p.lado, b.y) < AREA_PROF + 4 && this.r() < DESVIO_ESCANTEIO) { const fy = p.lado === 0 ? 1 : -1; b.vy = fy * (7 + this.r() * 5); b.vx = (b.x < 34 ? -1 : 1) * (3 + this.r() * 5); b.vh = 1 + this.r() * 2 }
      else if (lc && lc.de.lado !== p.lado && (b.x < 27 || b.x > W - 27) && this.r() < DESVIO_LATERAL) { b.vx = (b.x < 34 ? -1 : 1) * (9 + this.r() * 6); b.vy *= 0.4 }
      p.atordoado = this.t + 0.3
      return
    }
  }
  private naAreaDele(p: Atleta, pt: { x: number; y: number }) { return fundo(p.lado, pt.y) < AREA_PROF && Math.abs(pt.x - 34) < AREA_LARG }

  /** bola alta perto: quem ataca na área finaliza de cabeça; quem defende corta; no meio do campo vira passe de cabeça */
  private cabeceia(p: Atleta): void {
    const b = this.bola, l = p.lado
    // disputa aérea com quem estiver junto
    const rival = this.atl.filter(a => a.lado !== l && a.grupo !== 'GOL' && dist(a, b) < 1.6).sort((a, c) => dist(a, b) - dist(c, b))[0]
    if (rival) {
      // 🧑‍⚖️ empurrão na dividida pelo alto (quem defende segura/empurra; dentro da própria área o juiz deixa mais passar)
      const zag = b.lance && b.lance.de.lado === l ? rival : b.lance && b.lance.de.lado !== l ? p : null
      if (zag && this.r() < FALTA_AEREA * (this.naAreaDele(zag, b) ? 0.3 : 1)) return this.falta(zag, zag === rival ? p : rival)
      const pa = clamp(0.5 + (p.at.cabeceio + p.at.fisico - rival.at.cabeceio - rival.at.fisico) / 160, 0.15, 0.85)
      if (this.r() > pa) { this.tentou.set(rival, this.t - 1); return this.cabeceia(rival) }
    }
    const atacaArea = frente(l, b.y) < AREA_PROF + 2 && Math.abs(b.x - 34) < AREA_LARG + 2
    if (atacaArea && b.lance && b.lance.de.lado === l) {
      if (b.lance.de !== p) { this.stats.passesCertos[l]++; this.garcom = { de: b.lance.de, para: p, t: this.t } }
      b.h = 1.8; return this.chuta(p, true)
    }
    const fy = l === 0 ? -1 : 1
    if (fundo(l, b.y) < 30) { // corte
      // (na própria área, apertado, 1 em 4 cortes vai pra trás/de lado e sai pela linha de fundo: escanteio)
      const praFundo = fundo(l, b.y) < AREA_PROF + 2 && this.r() < CORTE_ESCANTEIO
      if (praFundo) { b.vx = (b.x < 34 ? -1 : 1) * (8 + this.r() * 6); b.vy = -fy * (6 + this.r() * 5); b.vh = 3 + this.r() * 2; b.ultimo = p; b.lance = { tipo: 'desvio', de: p, para: null, t0: this.t, impedido: false }; return this.emite({ tipo: 'corte', lado: l, a: p.nome }) }
      b.vx = (this.r() - 0.5) * 14; b.vy = fy * (12 + this.r() * 6); b.vh = 4 + this.r() * 2; b.ultimo = p; b.lance = { tipo: 'desvio', de: p, para: null, t0: this.t, impedido: false }
      return this.emite({ tipo: 'corte', lado: l, a: p.nome })
    }
    // passe de cabeça pra um companheiro perto
    const c = this.atl.filter(a => a.lado === l && a !== p && a.grupo !== 'GOL').sort((a, z) => dist(a, b) - dist(z, b))[0]
    if (c) { const d = dist(c, b) || 1; b.vx = ((c.x - b.x) / d) * 10; b.vy = ((c.y - b.y) / d) * 10; b.vh = 1.5; b.ultimo = p; b.lance = { tipo: 'cabeceio', de: p, para: c, t0: this.t, impedido: false } }
  }

  /** marcador colado no dono: desarme, falta ou drible (atributo contra atributo) */
  private desarmes() {
    const d = this.bola.dono!
    if (d.grupo === 'GOL' && this.naAreaDele(d, d)) return // (goleiro com a bola na mão ninguém toca)
    if (this.donoDesde != null && this.t - this.donoDesde < 0.15) return
    for (const z of this.atl) {
      if (z.lado === d.lado || z.atordoado > this.t || z.grupo === 'GOL') continue
      if (dist(z, d) > 2.2) continue
      const ac = this.acaoDe.get(d), dribla = ac?.tipo === 'drible'
      // (quem decidiu DRIBLAR encara na hora: o duelo acontece assim que encosta; o resto é o marcador que tenta, ~24%/s)
      if (!(dribla && ac.contra === z && dist(z, d) < 1.9) && this.r() > BOTE * clamp(1 + (z.at.desarme - d.at.conducao) / BOTE_DIF, 0.4, 3) * DT) continue // (22/10: o zagueiro bom contra o perna-de-pau dá bote muito mais vezes)
      const carrinho = z.golpes.includes('carrinho') || (z.grupo === 'DEF' && this.r() < 0.15)
      // falta? (chegando por trás, com o atacante em velocidade, é mais fácil derrubar)
      const porTras = fundo(d.lado, z.y) < fundo(d.lado, d.y) - 0.6, veloz = len(d.vx, d.vy) > 5
      let pF = clamp(FALTA_BASE + (60 - z.at.desarme) / 250 + (carrinho ? 0.06 : 0) + (porTras ? 0.07 : 0) + (veloz ? 0.04 : 0) + (d.at.conducao - 70) / 450, 0.06, FALTA_BASE + 0.14)
      if (this.naAreaDele(z, d)) pF *= 0.35
      if (this.r() < pF) return this.falta(z, d)
      const pW = clamp(0.42 + (z.at.desarme - d.at.conducao) / 105 + (z.at.fisico - d.at.fisico) / 450 - (dribla ? 0.07 : 0), 0.12, 0.82)
      if (this.r() < pW) {
        this.stats.desarmes[z.lado]++
        this.emite({ tipo: carrinho ? 'carrinho' : 'desarme', lado: z.lado, a: z.nome, b: d.nome })
        d.atordoado = this.t + 0.5
        if (this.r() < 0.62) this.pega(z, 0.3)
        else {
          const b = this.bola; b.dono = null; b.ultimo = z; b.lance = null; b.vx = (this.r() - 0.5) * 9; b.vy = (this.r() - 0.5) * 9; this.donoDesde = null
          // (perto da linha lateral, a bola dividida espirra pra FORA metade das vezes: lateral — Diego 21/10, "a bola quase nunca sai")
          if ((d.x < 9 || d.x > W - 9) && this.r() < 0.5) b.vx = (d.x < 34 ? -1 : 1) * (6 + this.r() * 5)
        }
        return
      }
      // passou por ele
      z.atordoado = this.t + 0.85
      this.stats.dribles[d.lado]++
      const moves = d.golpes.filter(g => ['elastico', 'pedalada', 'chapeu', 'roleta', 'caneta', 'slalom', 'croqueta', 'corta_pra_dentro', 'cruyff'].includes(g))
      const golpe = moves.length && this.r() < 0.7 ? moves[Math.floor(this.r() * moves.length)] : undefined
      this.emite({ tipo: 'drible', lado: d.lado, a: d.nome, b: z.nome, golpe })
      return
    }
  }

  private falta(z: Atleta, d: Atleta) {
    this.stats.faltas[z.lado]++
    const carrinho = z.golpes.includes('carrinho') || (z.grupo === 'DEF' && this.r() < 0.15)
    // por trás = o faltoso está do lado do PRÓPRIO gol do atacante (atrás dele em relação ao gol que ele ataca)
    const porTras = fundo(d.lado, z.y) < fundo(d.lado, d.y) - 0.6
    const ultimoHomem = fundo(z.lado, d.y) < 40 && !this.atl.some(a => a.lado === z.lado && a !== z && a.grupo !== 'GOL' && fundo(z.lado, a.y) < fundo(z.lado, d.y) - 0.5)
    const pen = this.naAreaDele(z, d)
    // 🧑‍⚖️ LEI DA VANTAGEM (Diego 20/10): falta no ataque, o atacante segue de pé com a bola → o juiz deixa seguir e só volta
    // se o time perder a bola logo. Nunca no pênalti nem no último homem (aí ele marca e pune na hora).
    if (!pen && !ultimoHomem && frente(d.lado, d.y) < 60 && this.bola.dono === d && this.r() < 0.35 + d.at.fisico / 300) {
      this.stats.vantagens[d.lado]++
      this.vantagem = { z, d, x: d.x, y: d.y, t: this.t, carrinho, porTras, ultimoHomem }
      z.atordoado = this.t + 0.9
      this.emite({ tipo: 'vantagem', lado: d.lado, a: z.nome, b: d.nome })
      return
    }
    this.emite({ tipo: 'falta', lado: z.lado, a: z.nome, b: d.nome })
    this.cartao(z, d, carrinho, porTras, ultimoHomem)
    if (pen) { this.stats.penaltis[d.lado]++; this.para('penalti', d.lado, 34, yDe(z.lado, 11)) }
    else this.para('falta', d.lado, d.x, d.y)
  }

  /** a bola passou de alguma linha? gol · trave · escanteio · tiro de meta · lateral */
  private checaLinhas() {
    const b = this.bola
    // (conduzindo, a bola saiu do campo: vale como bola fora, tocada por ele)
    if (b.dono && (b.x < 0 || b.x > W || b.y < 0 || b.y > L)) { b.ultimo = b.dono; b.dono = null; b.lance = null; this.donoDesde = null }
    if (b.dono) return
    if (b.y < 0 || b.y > L) {
      const def: Lado = b.y < 0 ? 1 : 0, ata = (1 - def) as Lado, x = b.x
      const dx = Math.abs(x - 34), lc = b.lance
      const chute = !!lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol' || lc.tipo === 'desvio')
      if (dx > GOL_MEIO - 0.13 && dx < GOL_MEIO + 0.2 && b.h < TRAVESSAO + 0.1 && chute) {
        // 🥅 trave: volta pro campo
        b.y = def === 1 ? 0.3 : L - 0.3; b.vy = -b.vy * 0.5; b.vx = -b.vx * 0.4 + (this.r() - 0.5) * 6; if (lc) lc.tipo = 'desvio'
        return this.emite({ tipo: 'trave', lado: ata, a: lc?.de.nome })
      }
      if (dx <= GOL_MEIO && b.h <= TRAVESSAO) return this.gol(ata)
      if (lc && (lc.tipo === 'chute' || lc.tipo === 'cabeceio_gol')) this.emite({ tipo: b.h > TRAVESSAO + 1 ? 'isolou' : 'fora', lado: ata, a: lc.de.nome })
      if (b.ultimo && b.ultimo.lado === def) { this.stats.escanteios[ata]++; this.emite({ tipo: 'escanteio', lado: ata }); return this.para('escanteio', ata, x < 34 ? 0.6 : W - 0.6, def === 1 ? 0.6 : L - 0.6) }
      this.emite({ tipo: 'tiro_de_meta', lado: def })
      return this.para('tiro_de_meta', def, 34 + (x < 34 ? -9 : 9), yDe(def, 5.5))
    }
    if (b.x < 0 || b.x > W) {
      const quem = b.ultimo ? ((1 - b.ultimo.lado) as Lado) : ((1 - this.posseLado) as Lado)
      this.stats.laterais[quem]++
      this.emite({ tipo: 'lateral', lado: quem })
      return this.para('lateral', quem, b.x < 0 ? 0 : W, clamp(b.y, 1, L - 1))
    }
  }

  private gol(lado: Lado) {
    const lc = this.bola.lance, autor = lc && lc.de.lado === lado ? lc.de : this.bola.ultimo?.lado === lado ? this.bola.ultimo : null
    if (lc && lc.tipo !== 'desvio') this.stats.noAlvo[lado]++
    this.placar[lado]++; this.stats.gols[lado]++
    const g = this.garcom && autor && this.garcom.para === autor && this.t - this.garcom.t < 9 ? this.garcom.de.nome : undefined
    const nome = autor?.nome ?? (this.bola.ultimo?.nome ? `${this.bola.ultimo.nome} (contra)` : '')
    this.festa = { lado, autor: nome, assist: g, min: Math.min(93, Math.floor(this.t / SEG_POR_MIN) + 1), ate: this.t + 2.5 }
    this.rede = { y0: linhaAtaque(lado), t0: this.t }
    this.emite({ tipo: 'gol', lado, a: nome, b: g })
    const b = this.bola; b.dono = null; b.vx *= 0.15; b.vy *= 0.15; b.lance = null; this.garcom = null
  }

  private moveFesta() {
    const f = this.festa!, autor = this.atl.find(a => a.lado === f.lado && a.nome === f.autor)
    // (no fim da festa todo mundo já volta correndo pro seu campo — a saída de bola não espera o abraço no bandeirinha)
    const voltando = this.t > f.ate - 1.8
    // (só os 2 mais perto vão abraçar quem fez o gol; o resto já volta)
    const abraco = autor ? this.atl.filter(a => a.lado === f.lado && a !== autor && a.grupo !== 'GOL').sort((a, c) => dist(a, autor) - dist(c, autor)).slice(0, 2) : []
    for (const p of this.atl) {
      if (voltando) { const a = ancora(this, p); p.alvo = { x: a.x, y: p.lado === 0 ? Math.max(a.y, L / 2 + 2) : Math.min(a.y, L / 2 - 2), v: 7.5 }; continue }
      // (comemora correndo pra lateral mais perto — não até o bandeirinha: a volta pra saída de bola custava 7 s)
      // (comemora correndo de braço aberto pra lateral e JÁ NA DIREÇÃO do próprio campo — 22/10: a volta pra saída era o que mais custava)
      if (autor && p === autor) { p.alvo = { x: autor.x < 34 ? Math.max(3, autor.x - 9) : Math.min(W - 3, autor.x + 9), y: clamp(autor.y + (f.lado === 0 ? 14 : -14), 2, L - 2), v: 6.5 }; continue }
      if (autor && p.lado === f.lado && dist(p, autor) < 22 && p.grupo !== 'GOL' && abraco.includes(p)) { p.alvo = { x: autor.x + (p.x < autor.x ? -1.5 : 1.5), y: autor.y + (p.y < autor.y ? -1.5 : 1.5), v: 6 }; continue }
      // (22/10: quem não foi abraçar já volta CORRENDO pro seu campo — antes voltava andando e cada gol custava ~8 s de tela parada:
      // num 5×0 seriam 40 s sem jogo, e era isso que impedia a goleada de existir)
      const a = ancora(this, p); p.alvo = { x: a.x, y: p.lado === 0 ? Math.max(a.y, L / 2 + 2) : Math.min(a.y, L / 2 - 2), v: 7 }
    }
  }

  // ── bola parada ──
  private para(tipo: TipoParada, lado: Lado, x: number, y: number) {
    const b = this.bola
    b.dono = null; b.vx = b.vy = b.vh = 0; b.h = 0; b.lance = null; b.x = clamp(x, 0, W); b.y = clamp(y, 0, L); this.donoDesde = null
    const time = this.atl.filter(a => a.lado === lado)
    let cob: Atleta
    if (tipo === 'tiro_de_meta') cob = time.find(a => a.grupo === 'GOL') ?? time[0]
    else if (tipo === 'saida') cob = time.filter(a => a.grupo === 'ATA' || a.grupo === 'MEI').sort((a, c) => dist(a, b) - dist(c, b))[0] ?? time[0]
    // (o cobrador do escanteio é o melhor cruzador entre os 4 MAIS PERTO — o melhor do time vindo lá da zaga gastava 5 s a cobrança)
    else if (tipo === 'escanteio') cob = time.filter(a => a.grupo !== 'GOL').sort((a, c) => dist(a, b) - dist(c, b)).slice(0, 4).sort((a, c) => c.at.passe + c.tend.cruza * 30 - a.at.passe - a.tend.cruza * 30)[0]
    else if (tipo === 'penalti') cob = time.filter(a => a.grupo !== 'GOL').sort((a, c) => c.at.finalizacao - a.at.finalizacao)[0]
    else if (tipo === 'falta' && frente(lado, y) < 30) cob = time.filter(a => a.grupo !== 'GOL').sort((a, c) => c.at.finalizacao + c.tend.chuteLonge * 25 - a.at.finalizacao - a.tend.chuteLonge * 25)[0]
    else cob = time.filter(a => a.grupo !== 'GOL').sort((a, c) => dist(a, b) - dist(c, b))[0] ?? time[0]
    this.parada = { tipo, lado, x: b.x, y: b.y, cobrador: cob, desde: this.t }
    this.posseLado = lado
    this.vantagem = null
    // 🏁 a rotina desta cobrança: a preferida do time, com variação (1 em 4 muda) pra não ficar previsível
    this.ensaio = [null, null]
    if (tipo === 'escanteio' || tipo === 'falta') { const ROT: Rotina[] = ['primeiro_pau', 'segundo_pau', 'curta']; this.rotina[lado] = this.r() < 0.25 ? ROT[Math.floor(this.r() * 3)] : this.rotinaBase[lado] }
    planeja(this)
  }
  private saida(lado: Lado, inicio = false, anuncia = true) {
    this.para('saida', lado, 34, L / 2)
    if (inicio) {
      for (const p of this.atl) { const a = this.lugarNaCobranca(p); p.x = a.x; p.y = a.y; p.ax = a.x; p.ay = a.y; p.vx = 0; p.vy = 0 }
      if (anuncia) this.emite({ tipo: 'saida', lado })
    }
  }
  private cuidaParada() {
    const pa = this.parada!, c = pa.cobrador
    if (!this.atl.includes(c)) { this.para(pa.tipo, pa.lado, pa.x, pa.y); return }
    const pronto = dist(c, pa) < 0.9 && this.t - pa.desde >= ESPERA[pa.tipo]
    // (depois do gol o time volta da festa lá do bandeirinha: dá mais tempo pra todo mundo chegar no seu campo)
    const folga = pa.tipo === 'saida' ? 8 : 4
    if (!pronto && this.t - pa.desde < ESPERA[pa.tipo] + folga) return
    // REGRA da distância (rival a 9,15 m na falta/escanteio, fora da área no tiro de meta, no próprio campo na saída)
    const ok = this.atl.every(a => {
      if (a === c) return true
      if (pa.tipo === 'saida') return a.lado === 0 ? a.y >= L / 2 - 0.5 : a.y <= L / 2 + 0.5
      if (a.lado === pa.lado) return true
      if (pa.tipo === 'falta' || pa.tipo === 'escanteio') return dist(a, pa) > 8.6
      if (pa.tipo === 'tiro_de_meta') return !(fundo(pa.lado, a.y) < AREA_PROF && Math.abs(a.x - 34) < AREA_LARG)
      return true
    })
    if (!ok && this.t - pa.desde < ESPERA[pa.tipo] + folga) return
    if (!ok) this.diag.reinicioErrado++
    // cobra: a decisão é a de sempre, com a restrição da cobrança (lateral só passa, escanteio cruza, tiro de meta não dribla…)
    if (dist(c, pa) > 1.2 && this.t - pa.desde < ESPERA[pa.tipo] + 6) return // (o cobrador ainda está chegando — nada de teletransporte)
    this.bola.dono = c; this.bola.ultimo = c; this.donoDesde = this.t
    const a = decide(this, c)
    this.acaoDe.set(c, a)
    if (a.tipo === 'conduz' || a.tipo === 'drible' || a.tipo === 'segura') { this.parada = null; c.proxDecisao = this.t + DECISAO; return }
    this.executa(c, a)
    this.parada = null
  }
  private grudaBolaParada() {
    const pa = this.parada
    if (pa) { this.bola.x = pa.x; this.bola.y = pa.y; this.bola.h = 0 }
    else if (this.festa) { const b = this.bola; b.vx *= 0.9; b.vy *= 0.9; b.x += b.vx * DT; b.y += b.vy * DT }
  }

  private pega(p: Atleta, toque = 0.15) {
    const b = this.bola
    b.dono = p; b.ultimo = p; b.lance = null; b.h = 0; b.vh = 0
    this.posseLado = p.lado; this.donoDesde = this.t
    // ⏳ quem recebe fica um tempo com a bola (domina, levanta a cabeça, conduz) antes de soltar — 0,4 a 1,3 s; quem joga de
    // primeira (passador, finalizador) às vezes solta na hora. Apertado pelo marcador, solta antes (`decide` olha a pressão).
    const primeira = (p.estilo === 'passador' || p.golpes.includes('de_primeira')) && this.r() < 0.25
    this.segurarAte = primeira ? this.t : this.t + (0.1 + this.r() * 0.45 - p.at.decisao * 0.0015) * (1 - pressaoEm(this, p, p.lado) * 0.6 * (1 - p.tend.drible * 0.7)) * (1 + p.tend.drible * 0.8) // (livre, dá um toque e olha o jogo; apertado, solta antes — MENOS quem gosta de driblar: esse segura e encara) // (ritmo alto: o jogo inteiro cabe em 1:30)
    p.proxDecisao = this.t + toque
    this.acaoDe.delete(p)
  }

  emite(e: Omit<Evento, 't'>) {
    const ev: Evento = { t: this.t, ...e }
    this.eventos.push(ev)
    const peso = PESO[e.tipo]
    if (peso == null) return
    if (peso < this.narraPeso && this.t < this.narraAte) return
    const txt = this.nar.texto(ev)
    if (!txt) return
    this.narra = txt; this.narraPeso = peso; this.narraAte = this.t + (peso >= 6 ? 2.2 : 1.3)
  }
}

export { DT, SEG_POR_MIN, W, L }
