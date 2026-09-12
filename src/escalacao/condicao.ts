// ─── 😓 CONDIÇÃO / GÁS do jogador (carreira SOLO) — módulo PURO, sem React ────
//
// Pedido do Diego (12/09/2026): *"precisamos da condição do jogador.. energia
// com base na quantidade de jogos ou qd se machuca e volta aos poucos"*. Regras
// fechadas com ele no mesmo dia (mockup `scripts/mockup-condicao-elenco.mjs`,
// variante A — a barrinha):
//
//   · cada jogo como TITULAR: −10 de gás · cada rodada no BANCO: +20 (teto 100)
//   · ≥ 40 = 💪 inteiro (nada) · 30–39 = 😓 cansado (−1 de força no jogo)
//     · 20–29 = 🥵 no limite (−2 · 2× de chance de ser o lesionado da temporada)
//     · < 20 = 🚑 esgotado (−3 · 3× lesão)
//     A escada é a que o Diego pediu (12/09): *"do 1 ao 7 💪, dps 8, dps 9 e dps
//     10 em diante"* → 1º–7º jogo seguido inteiro · 8º 😓 · 9º 🥵 · 10º+ 🚑.
//     (gás antes do jogo N = 100 − 10·(N−1): 7º = 40 · 8º = 30 · 9º = 20 · 10º = 10)
//   · lesão VOLTA AOS POUCOS: na rodada da volta joga a 60% (−2), na seguinte
//     a 80% (−1), depois 100%. O 🏥 Dep. Médico continua acabando com as lesões
//     PRA SEMPRE (o Diego mandou NÃO mexer nele) — então quem tem médico nunca
//     passa por isto.
//   · liga quando o clube SOBE PRA SÉRIE C (não por temporada — *"3ª temporada
//     acho mt rápido… apenas quando subir pra Série C, que o usuário está mais
//     experiente"*). Uma vez ligado, não desliga se cair de volta.
//   · bots NÃO cansam (baseline plano): quem rodizia bem também não paga nada —
//     é camada de gestão, não imposto. Copa Legends também fica de fora.
//
// 🧮 O GÁS NÃO É GUARDADO NO SAVE — é DERIVADO da escalação congelada de cada
// rodada (`careerLineup`, que o PLAY_ROUND grava pra toda rodada jogada). Isso
// dá três garantias de graça: (1) nada de migração de save; (2) reload/relogin
// não perde nem duplica cansaço; (3) o passado é imutável — o gás de uma rodada
// já jogada depende só de rodadas anteriores, também congeladas, então nenhum
// placar antigo muda (a família de bug "os gols do Evaristo foram pro Jairzinho").
//
// 🛡️ Segurança (prioridade nº 1): NADA aqui trava rodada nem inventa jogador.
// Sem reserva na posição, o cara joga cansado (−1/−2) e o preparador avisa o
// caminho ("contrate no mercado"); se a lesão vier, entra o MESMO banner dos
// 3 Crias da Base que os eventos já usam.
import { CONDICAO_ON } from './career-feature-release'

export const GAS_JOGO = 10     // desconto por jogo como titular
export const GAS_BANCO = 20    // recuperação por rodada no banco
export const GAS_CANSADO = 40  // abaixo disto = 😓
export const GAS_LIMITE = 30   // abaixo disto = 🥵
export const GAS_ESGOTADO = 20 // abaixo disto = 🚑
export const MOD_CANSADO = -1
export const MOD_LIMITE = -2
export const MOD_ESGOTADO = -3
export const MOD_VOLTA = [-2, -1] as const // rodada da volta (60%) · seguinte (80%)

export type EstadoGas = 'ok' | 'cansado' | 'limite' | 'esgotado'
export function estadoGas(g: number): EstadoGas { return g >= GAS_CANSADO ? 'ok' : g >= GAS_LIMITE ? 'cansado' : g >= GAS_ESGOTADO ? 'limite' : 'esgotado' }
export function modGas(g: number): number { const e = estadoGas(g); return e === 'ok' ? 0 : e === 'cansado' ? MOD_CANSADO : e === 'limite' ? MOD_LIMITE : MOD_ESGOTADO }
// peso do jogador no sorteio da LESÃO da temporada (1 = normal · 2 = 🥵 · 3 = 🚑)
export function pesoLesao(g: number): number { const e = estadoGas(g); return e === 'esgotado' ? 3 : e === 'limite' ? 2 : 1 }
export const emojiGas = (e: EstadoGas): string => (e === 'ok' ? '💪' : e === 'cansado' ? '😓' : e === 'limite' ? '🥵' : '🚑')
export const corGas = (e: EstadoGas): string => (e === 'ok' ? '#1B7A3D' : e === 'cansado' ? '#D9A000' : e === 'limite' ? '#C2452F' : '#7A1B1B')

// ─── ligado ou não, PARA ESTA CARREIRA/TEMPORADA ─────────────────────────────
// `condicaoDesde` = temporada em que o clube chegou na Série C (gravado na
// virada, CAREER_ADVANCE). Temporada em andamento nunca muda de regra no meio.
export function condicaoAtiva(s: { careerOnline?: boolean; onlineMode?: string; agenciaOn?: boolean; condicaoDesde?: number; seasonNo?: number }): boolean {
  if (!CONDICAO_ON) return false
  if (!s.careerOnline || s.onlineMode === 'online' || !s.agenciaOn) return false
  return s.condicaoDesde != null && (s.seasonNo ?? 1) >= s.condicaoDesde
}

// ─── o gás de cada carta ANTES da rodada `round` ─────────────────────────────
// `byRound` = careerLineup[mgrId] (rodada → ids dos 11). Só rodadas < round
// contam; rodada sem escalação gravada (não deveria existir depois de jogada)
// não mexe em ninguém. Carta que não existia numa rodada (chegou depois) só
// sobe até o teto — nasce inteira.
export function gasDoElenco(byRound: Record<number, string[]> | undefined, round: number, squad: { id: string }[]): Record<string, number> {
  const gas: Record<string, number> = {}
  for (const c of squad) gas[c.id] = 100
  if (!byRound) return gas
  for (let r = 0; r < round; r++) {
    const ids = byRound[r]
    if (!ids) continue
    const xi = new Set(ids)
    for (const c of squad) gas[c.id] = xi.has(c.id) ? Math.max(0, gas[c.id] - GAS_JOGO) : Math.min(100, gas[c.id] + GAS_BANCO)
  }
  return gas
}

// quantos jogos cada carta fez na temporada (o "🏃 9 jogos" da aba Elenco)
export function jogosDoElenco(byRound: Record<number, string[]> | undefined, round: number, squad: { id: string }[]): Record<string, number> {
  const n: Record<string, number> = {}
  for (const c of squad) n[c.id] = 0
  if (!byRound) return n
  for (let r = 0; r < round; r++) for (const id of byRound[r] ?? []) if (id in n) n[id]++
  return n
}

// ─── 🩹 volta gradual da lesão ───────────────────────────────────────────────
// `ev` = eventoTemporada (só conta se for LESÃO desta temporada e já decidida
// pro banco). Devolve o modificador do jogador na rodada `r`: −2 na volta, −1
// na seguinte, 0 fora disso. Também serve pra tela ("voltando · 60%").
export function modVolta(ev: { tipo: string; season: number; status: string; volta?: number; cardId: string } | null | undefined, seasonNo: number, r: number, cardId: string): number {
  if (!ev || ev.tipo !== 'lesao' || ev.season !== seasonNo || ev.status !== 'banco' || ev.volta == null || ev.cardId !== cardId) return 0
  const d = r - ev.volta
  return d >= 0 && d < MOD_VOLTA.length ? MOD_VOLTA[d] : 0
}
export const pctVolta = (mod: number): number => (mod === -2 ? 60 : mod === -1 ? 80 : 100)

// ─── modificadores POR JOGADOR pra simulação, rodada a rodada ────────────────
// Record<rodada, Record<cardId, mod>>. Só rodadas 0..round (a atual inclusa —
// é a que ainda vai rolar). Passado é determinístico (ver cabeçalho).
export type CardModsPorRodada = Record<number, Record<string, number>>
export function modsDoElenco(
  byRound: Record<number, string[]> | undefined, round: number, squad: { id: string }[],
  xiAt: (r: number) => string[],
  ev: { tipo: string; season: number; status: string; volta?: number; cardId: string } | null | undefined, seasonNo: number,
): CardModsPorRodada {
  const out: CardModsPorRodada = {}
  for (let r = 0; r <= round; r++) {
    const gas = gasDoElenco(byRound, r, squad)
    const m: Record<string, number> = {}
    for (const id of xiAt(r)) {
      const v = modGas(gas[id] ?? 100) + modVolta(ev, seasonNo, r, id)
      if (v) m[id] = v
    }
    if (Object.keys(m).length) out[r] = m
  }
  return out
}

// ─── 🔁 RODIZIAR: a sugestão do preparador (nunca aplica sozinho) ────────────
// Pra cada titular cansado (pior primeiro), entra o MELHOR reserva da mesma
// posição que esteja inteiro e não seja suspenso/fake. Mantém a vaga (mesmo
// índice) — o campinho não embaralha. Devolve null se não há o que trocar.
export function sugerirRodizio<T extends { id: string; pos: string; lo: number; hi: number; fake?: boolean }>(
  xiIds: string[], squad: T[], gas: Record<string, number>, bloqueados: Set<string> = new Set(),
): { ids: string[]; trocas: { sai: T; entra: T }[] } | null {
  const byId = new Map(squad.map(c => [c.id, c]))
  const ids = xiIds.slice()
  const emCampo = new Set(ids)
  const cansados = ids.map(id => byId.get(id)).filter((c): c is T => !!c && estadoGas(gas[c.id] ?? 100) !== 'ok').sort((a, b) => (gas[a.id] ?? 100) - (gas[b.id] ?? 100))
  const trocas: { sai: T; entra: T }[] = []
  for (const sai of cansados) {
    const cand = squad.filter(c => c.pos === sai.pos && !emCampo.has(c.id) && !c.fake && !bloqueados.has(c.id) && estadoGas(gas[c.id] ?? 100) === 'ok')
      .sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))[0]
    if (!cand) continue
    const i = ids.indexOf(sai.id); if (i < 0) continue
    ids[i] = cand.id; emCampo.delete(sai.id); emCampo.add(cand.id)
    trocas.push({ sai, entra: cand })
  }
  return trocas.length ? { ids, trocas } : null
}
