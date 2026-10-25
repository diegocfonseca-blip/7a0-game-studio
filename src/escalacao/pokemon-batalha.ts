// ⚡ MODO POKÉMON — o MOTOR da batalha e da liga (puro: sem tela, sem banco). Regras fechadas com o Diego (25/10):
//  · antes de CADA batalha o treinador escolhe 3 dos 6, a ORDEM em que entram e a tática;
//  · "QUEM GANHA FICA": 1º contra 1º; quem perde sai e entra o próximo DAQUELE lado; quem ganha continua com a vida
//    que sobrou (não cura). Acaba quando um lado perde os 3;
//  · dano = nível do dia (faixa inteira lo–hi, igual aos jogadores) × tipo OFICIAL (2× super efetivo, ½, 0) × tática;
//  · liga de 10, só de ida (9 rodadas) → semifinal (1×4, 2×3) e final em jogo único. Vitória = 3 pts, desempate pelo
//    saldo de NOCAUTES (o "saldo de gols").
// Trava: `npx tsx scripts/testa-pokemon.mts`.
import { efetividade, type TipoPoke } from './pokemon-dados'

export type TaticaPoke = 'agressivo' | 'equilibrio' | 'defensivo'
export interface LutadorPoke { id: string; nome: string; tipos: TipoPoke[]; lo: number; hi: number }
export interface LadoBatalha { nome: string; time: LutadorPoke[]; tatica: TaticaPoke }

export type EventoPoke =
  | { t: 'entra'; lado: 'a' | 'b'; quem: string }
  | { t: 'golpe'; lado: 'a' | 'b'; quem: string; alvo: string; tipo: TipoPoke; mult: number; dano: number; hpAlvo: number; crit: boolean }
  | { t: 'ko'; lado: 'a' | 'b'; quem: string }
  | { t: 'fim'; vencedor: 'a' | 'b' }

export interface ResultadoBatalha { eventos: EventoPoke[]; vencedor: 'a' | 'b'; nocA: number; nocB: number }

/** dado preso numa semente (a mesma batalha dá sempre o mesmo resultado) */
export function rngPoke(seed: number): () => number {
  let a = seed >>> 0
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const TAT_ATQ: Record<TaticaPoke, number> = { agressivo: 1.12, equilibrio: 1, defensivo: 0.9 }
const TAT_DEF: Record<TaticaPoke, number> = { agressivo: 0.9, equilibrio: 1, defensivo: 1.12 }
const DANO_BASE = 24
/** teto de golpes num duelo (dois que não se machucam nunca prendem a batalha) */
const TETO_GOLPES = 40

/** o melhor golpe de quem ataca contra quem defende: usa o tipo dele que mais machuca (o que um treinador faria) */
export function melhorGolpe(ataque: TipoPoke[], defesa: TipoPoke[]): { tipo: TipoPoke; mult: number } {
  let best = { tipo: ataque[0], mult: efetividade(ataque[0], defesa) }
  for (const t of ataque.slice(1)) { const m = efetividade(t, defesa); if (m > best.mult) best = { tipo: t, mult: m } }
  return best
}

export function batalha(a: LadoBatalha, b: LadoBatalha, seed: number): ResultadoBatalha {
  const rng = rngPoke(seed)
  const dia = (l: LutadorPoke) => l.lo + rng() * (l.hi - l.lo) // a faixa INTEIRA (dia ruim e ápice tão comuns quanto o meio)
  type Vivo = { l: LutadorPoke; nivel: number; hp: number }
  const fila = (lado: LadoBatalha): Vivo[] => lado.time.map(l => ({ l, nivel: dia(l), hp: 100 }))
  const fa = fila(a), fb = fila(b)
  const ev: EventoPoke[] = []
  let ia = 0, ib = 0
  ev.push({ t: 'entra', lado: 'a', quem: fa[0].l.nome }, { t: 'entra', lado: 'b', quem: fb[0].l.nome })
  while (ia < fa.length && ib < fb.length) {
    const A = fa[ia], B = fb[ib]
    // quem bate primeiro: o mais rápido NAQUELE dia (nível do dia + um tanto de sorte)
    let vez: 'a' | 'b' = A.nivel + rng() * 10 >= B.nivel + rng() * 10 ? 'a' : 'b'
    let golpes = 0
    while (A.hp > 0 && B.hp > 0 && golpes < TETO_GOLPES) {
      const [at, df, ladoAt, tatAt, tatDf] = vez === 'a' ? [A, B, 'a' as const, a.tatica, b.tatica] : [B, A, 'b' as const, b.tatica, a.tatica]
      const g = melhorGolpe(at.l.tipos, df.l.tipos)
      const crit = rng() < 0.06
      const bruto = DANO_BASE * Math.pow(at.nivel / df.nivel, 2) * g.mult * TAT_ATQ[tatAt] / TAT_DEF[tatDf] * (0.85 + rng() * 0.3) * (crit ? 1.5 : 1)
      const dano = g.mult === 0 ? 0 : Math.max(1, Math.round(bruto))
      df.hp = Math.max(0, df.hp - dano)
      ev.push({ t: 'golpe', lado: ladoAt, quem: at.l.nome, alvo: df.l.nome, tipo: g.tipo, mult: g.mult, dano, hpAlvo: df.hp, crit })
      vez = vez === 'a' ? 'b' : 'a'
      golpes++
    }
    // teto: quem está com menos vida cai (nunca empata: na igualdade cai quem entrou depois de apanhar mais)
    if (A.hp > 0 && B.hp > 0) { if (A.hp <= B.hp) A.hp = 0; else B.hp = 0 }
    if (A.hp <= 0) { ev.push({ t: 'ko', lado: 'a', quem: A.l.nome }); ia++; if (ia < fa.length) ev.push({ t: 'entra', lado: 'a', quem: fa[ia].l.nome }) }
    if (B.hp <= 0) { ev.push({ t: 'ko', lado: 'b', quem: B.l.nome }); ib++; if (ib < fb.length) ev.push({ t: 'entra', lado: 'b', quem: fb[ib].l.nome }) }
  }
  // os dois caírem no mesmo golpe só acontece no teto; quem ficou com alguém de pé vence
  const vencedor: 'a' | 'b' = ia >= fa.length && ib < fb.length ? 'b' : ib >= fb.length && ia < fa.length ? 'a' : (fa.length - ia) >= (fb.length - ib) ? 'a' : 'b'
  ev.push({ t: 'fim', vencedor })
  return { eventos: ev, vencedor, nocA: ib, nocB: ia }
}

// ── O BOT ESCOLHE (3 dos 6 + ordem + tática) ─────────────────────────────────────────────────────────────────
/** o bot olha os TIPOS do rival (ele também viu a cerimônia) e escala quem tem mais vantagem; a Lenda costuma fechar */
export function escolhaBot(meus: LutadorPoke[], rival: LutadorPoke[], rng: () => number): { ids: string[]; tatica: TaticaPoke } {
  const nota = (m: LutadorPoke) => {
    const vant = rival.reduce((s, r) => s + melhorGolpe(m.tipos, r.tipos).mult - 0.5 * melhorGolpe(r.tipos, m.tipos).mult, 0) / Math.max(1, rival.length)
    return (m.lo + m.hi) / 2 + vant * 8 + rng() * 6
  }
  const top = [...meus].sort((x, y) => nota(y) - nota(x)).slice(0, 3)
  // ordem: abre com o 2º melhor, guarda o melhor pro fim (às vezes inverte — bot imprevisível)
  const ordem = rng() < 0.7 ? [top[1], top[2], top[0]] : top
  const r = rng()
  return { ids: ordem.filter(Boolean).map(m => m.id), tatica: r < 0.34 ? 'agressivo' : r < 0.67 ? 'equilibrio' : 'defensivo' }
}

// ── A LIGA ────────────────────────────────────────────────────────────────────────────────────────────────────
export interface LinhaPoke { id: number; nome: string; j: number; v: number; d: number; pts: number; nocP: number; nocC: number }
export function ordenaPoke(t: LinhaPoke[]): LinhaPoke[] {
  return [...t].sort((x, y) => y.pts - x.pts || (y.nocP - y.nocC) - (x.nocP - x.nocC) || y.nocP - x.nocP || x.nome.localeCompare(y.nome))
}
export function anotaBatalha(t: LinhaPoke[], idA: number, idB: number, r: Pick<ResultadoBatalha, 'vencedor' | 'nocA' | 'nocB'>): void {
  const a = t.find(x => x.id === idA), b = t.find(x => x.id === idB)
  if (!a || !b) return
  a.j++; b.j++; a.nocP += r.nocA; a.nocC += r.nocB; b.nocP += r.nocB; b.nocC += r.nocA
  if (r.vencedor === 'a') { a.v++; a.pts += 3; b.d++ } else { b.v++; b.pts += 3; a.d++ }
}

// ── O ESTADO DA LIGA (vai no save da partida rápida: `state.pokeLiga`) ──────────────────────────────────────────
export interface EscalaPoke { ids: string[]; tatica: TaticaPoke }
export interface BatalhaFeita { a: number; b: number; vencedor: 'a' | 'b'; nocA: number; nocB: number; seed: number; escA: EscalaPoke; escB: EscalaPoke }
export interface PokeLigaEstado {
  ids: number[]            // os 10 treinadores (ids dos managers)
  cal: [number, number][][] // 9 rodadas
  rodada: number           // 0..8 liga · 9 semis · 10 final · 11 acabou
  feitas: BatalhaFeita[][] // por rodada (liga 0..8, semis 9, final 10)
  tabela: LinhaPoke[]
  minha?: EscalaPoke       // a última escalação do usuário (quem não escolhe a tempo entra com ela)
  campeao?: number
  semis?: [number, number][]
  final?: [number, number]
}
