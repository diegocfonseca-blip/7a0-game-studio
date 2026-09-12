// ─── 😓 CONDIÇÃO / GÁS do jogador (carreira SOLO) — módulo PURO, sem React ────
//
// Pedido do Diego (12/09/2026): *"precisamos da condição do jogador.. energia
// com base na quantidade de jogos ou qd se machuca e volta aos poucos"*. Regras
// fechadas com ele no mesmo dia (mockup `scripts/mockup-condicao-elenco.mjs`,
// variante A — a barrinha):
//
//   · cada jogo como TITULAR: −7 de gás · cada rodada no BANCO: +15 (teto 100)
//   · ≥ 35 = 💪 inteiro (nada) · 25–34 = 😓 cansado (−1 de força no jogo)
//     · 20–24 = 🥵 no limite (−2 · 2× de chance de ser o lesionado da temporada)
//     · < 20 = 🚑 esgotado (−3 · 3× lesão)
//     A escada é a que o Diego pediu (12/09, 2ª versão — ele esticou: *"vai ser 1
//     a 10 normal, dps 11, 12, 13 a 14 em diante"*) → 1º–10º jogo seguido inteiro
//     · 11º 😓 · 12º 🥵 · 13º+ 🚑. (gás antes do jogo N = 100 − 7·(N−1):
//     10º = 37 · 11º = 30 · 12º = 23 · 13º = 16 · 14º = 9)
//   · lesão VOLTA AOS POUCOS: na rodada da volta joga a 60% (−2), na seguinte
//     a 80% (−1), depois 100%.
//   · 🩹 LESÃO POR DESGASTE (Diego 12/09: *"quero sim q qd chegue no 9 e no 10
//     em diante a chance aumente de lesão, senão não tem sentido"*): FORA o causo
//     da temporada, todo jogo o 🥵 tem 15% e o 🚑 tem 30% de se machucar (1-3
//     rodadas). Mesmo banner, mesmos Crias sem reserva. Roda só quando ninguém
//     do time já está fora (o jogo guarda UM causo por vez — limitação assumida).
//   · 🏥 O DEP. MÉDICO SAIU DO JOGO (Diego 12/09, três vezes até eu entender:
//     *"não quero dep médico, já disse… quem comprou esquece, vai ser igual p
//     todos"*). Ninguém é imune, ninguém encurta lesão. Igual pra todo mundo.
//   · 🪑 BANCO RECUPERA +15 POR RODADA (Diego 12/09: *"a condição dele não deve
//     ser recuperada de cara"*): quem só está 😓 volta inteiro com 1 rodada fora;
//     quem está 🚑 precisa de 2-3. Quem volta de lesão volta com o gás QUE TEM —
//     nunca zerado pra 100 só porque o jogo precisou dele.
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

export const GAS_JOGO = 7      // desconto por jogo como titular
export const GAS_BANCO = 15    // recuperação por rodada no banco (era 20; Diego achou rápido demais)
export const GAS_CANSADO = 35  // abaixo disto = 😓
export const GAS_LIMITE = 25   // abaixo disto = 🥵
export const GAS_ESGOTADO = 20 // abaixo disto = 🚑
export const MOD_CANSADO = -1
export const MOD_LIMITE = -2
export const MOD_ESGOTADO = -3
export const MOD_VOLTA = [-2, -1] as const // rodada da volta (60%) · seguinte (80%)
export const LESAO_LIMITE_PCT = 0.15   // 🥵 chance de lesão por desgaste, por jogo
export const LESAO_ESGOTADO_PCT = 0.30 // 🚑 idem

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

// ─── 🩹 LESÃO POR DESGASTE: o sorteio de cada rodada ────────────────────────
// Determinístico (seed + temporada + rodada): reload não re-sorteia. Olha os
// titulares do pior gás pro melhor; o primeiro que "cair" no dado é o lesionado.
// Inteiro/cansado nunca se machucam por aqui (só 🥵 e 🚑). Devolve null = nada.
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
export function sorteiaLesaoDesgaste<T extends { id: string }>(args: { seed: number; seasonNo: number; round: number; xi: T[]; gas: Record<string, number> }): { card: T; rodadas: number; gas: number } | null {
  const { seed, seasonNo, round, xi, gas } = args
  const rng = mulberry((seed ^ Math.imul(seasonNo, 2654435761) ^ Math.imul(round + 1, 0x9E3779B1) ^ 0xD35647E) >>> 0)
  const cands = xi.filter(c => { const e = estadoGas(gas[c.id] ?? 100); return e === 'limite' || e === 'esgotado' }).sort((a, b) => (gas[a.id] ?? 100) - (gas[b.id] ?? 100))
  for (const c of cands) {
    const g = gas[c.id] ?? 100
    const p = estadoGas(g) === 'esgotado' ? LESAO_ESGOTADO_PCT : LESAO_LIMITE_PCT
    if (rng() < p) return { card: c, rodadas: 1 + Math.floor(rng() * 3), gas: g } // 1-3 rodadas
  }
  return null
}

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
