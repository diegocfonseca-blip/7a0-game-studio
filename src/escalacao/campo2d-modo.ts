// 📺 CAMPO 2D LIGADO OU NÃO (20/10). Diego: *"o 2D é para funcionar em qualquer jogo, em qualquer liga, em qualquer Copa…
// online, offline, serve para tudo"*. Por isso a decisão mora num lugar só e o `LiveScoreCard` (o placar de TODAS as
// competições) desenha o campinho sozinho quando ela diz sim.
//  · OFFLINE (carreira, partida rápida, copas): a escolha é do aparelho (`esc-campo2d`), e só pra quem o 2D está liberado.
//  · SALA ONLINE: quem decide é a SALA (`state.campo2d`, escolhido pelo dono ao criar) — vale igual pra todo mundo dela,
//    porque o tempo do jogo muda junto e os relógios da sala têm que bater.
import { PASSOS_2D_BANCO_MS } from './vel2d-regra'
import { createContext, useContext, useSyncExternalStore } from 'react'
import { useCampo2DLiberado } from './sport'
import { useEscTalvez } from './store'
import { estadioNoCampinho } from './estadiodata' // 🌱🏟️ o estádio do mandante no campinho (21/10)

export const CAMPO2D_CHAVE = 'esc-campo2d'
let pref = (() => { try { return localStorage.getItem(CAMPO2D_CHAVE) === '1' } catch { return false } })()
const ouvintes = new Set<() => void>()
export function trocaCampo2D() {
  pref = !pref
  try { localStorage.setItem(CAMPO2D_CHAVE, pref ? '1' : '0') } catch { /* sem armazenamento: vale só nesta aba */ }
  ouvintes.forEach(f => f())
}
function usePref() {
  return useSyncExternalStore(f => { ouvintes.add(f); return () => { ouvintes.delete(f) } }, () => pref)
}

// 💳 FORA DA SALA ONLINE O 2D É PAGO (Diego 20/10: *"só para quem é craque… quando ele pagar, ele ganha os dois, o botão manual
// e o campinho 2D"*). O direito é o MESMO do Modo Manual (`temManual`: Craque pra cima, batismo, selo manual). Quem confere é o
// botão do 2D (`Botao2D`, uma consulta só por tela) e o resultado fica guardado no aparelho — assim o placar de cada competição
// não precisa consultar o banco sozinho. Na sala online o 2D é escolha da sala e vale pra todos (convidado nunca paga).
const PAGO_CHAVE = 'esc-campo2d-pago'
let pago = (() => { try { return localStorage.getItem(PAGO_CHAVE) === '1' } catch { return false } })()
export function marcaPago2D(v: boolean) {
  if (v === pago) return
  pago = v
  try { localStorage.setItem(PAGO_CHAVE, v ? '1' : '0') } catch { /* sem armazenamento: vale só nesta aba */ }
  ouvintes.forEach(f => f())
}
export function usePago2D(): boolean {
  return useSyncExternalStore(f => { ouvintes.add(f); return () => { ouvintes.delete(f) } }, () => pago)
}

/** 📺⚡ 05/11: nas copas com relógio no BANCO (Copa do Mundo/Euro/regionais) quem diz se o PASSO da vez é 2D é a linha do
 *  relógio (a duração que o banco carimbou no `next`), não o estado da sala — assim, se o dono trocou, todo aparelho muda
 *  junto no passo seguinte, e nunca no meio de um jogo. `undefined` = sem relógio: vale a sala. */
export const Campo2DDoPassoCtx = createContext<boolean | undefined>(undefined)
/** o banco carimba 36585 ms (÷ velocidade) no passo 2D — 3× desde 05/11 (`docs/sql/campo2d-sala-3x.sql`; antes 109756, que
 *  continua valendo pra passo carimbado antes da troca) — e 16000 no normal */
export function doisDDoPasso(row: { step: number; duration_ms: number; speed: number } | null | undefined): boolean | undefined {
  if (!row || row.step <= 0) return undefined // nenhum passo começou ainda: vale a sala
  // ⏩📺 06/11: com a régua ABSOLUTA (`docs/sql/campo2d-sala-2-5x.sql`) o banco carimba 109756 ÷ a marcha (1×–4×, padrão 2,5× =
  // 43902), sem dividir pela `speed` — esses valores batem EXATOS (±2 ms). O placar normal é 16000 ÷ speed e nunca cai neles (o
  // mais perto: 32000 × 31359). E o 36585 (3×, carimbado até o banco trocar) segue pela régua de baixo.
  if (PASSOS_2D_BANCO_MS.some(p => Math.abs(row.duration_ms - p) <= 2)) return true
  const d = row.duration_ms * (row.speed || 1)
  return Math.abs(d - 36585) < 1500 || Math.abs(d - 54878) < 1500 || Math.abs(d - 109756) < 1500 // 3× (05/11) · 2× · 1:30 (passos carimbados antes)
}

/** o 2D está ligado AQUI? (a sala online manda; fora dela, a escolha do aparelho de quem está liberado E pagou) */
export function useCampo2DLigado(): boolean {
  const liberado = useCampo2DLiberado()
  const p = usePref()
  const pg = usePago2D()
  const s = useEscTalvez()?.state
  const doPasso = useContext(Campo2DDoPassoCtx)
  if (s && s.onlineMode === 'online') return doPasso ?? !!s.campo2d
  // 🏆 07/11 (Diego): na CARREIRA o 2D é de graça (*"o campo 2D liberado para ainda assim esse usuário decidir se ele quer o campo 2D ou o
  // placar cinema"*) — o Manual continua com o cadeado. Partida Rápida offline segue do plano. (A carreira OFFLINE tem careerOnline = true.)
  return liberado && p && (pg || !!s?.careerOnline)
}

/** o que a tela do jogo sabe e o campinho usa: nome do técnico (carreira) e a tática de cada clube (🧱 −1 · ⚖️ 0 · 🔥 +1) */
export function useCampo2DExtras(): { tecnicoDe: (nome: string) => string | null; taticaDe: (nome: string) => number; estadioDe: (nome: string) => { grama: number; lotacao: number } | undefined; meuTime: string | null; offline: boolean } {
  const s = useEscTalvez()?.state
  return {
    meuTime: s?.managers?.[s.youIdx]?.teamName ?? null, // 🧑‍💼 o presidente na beira do campo é o do MEU time
    offline: !s || (s.onlineMode !== 'online' && !s.co2), // 🎬 o replay dos gols só existe fora do online
    // 🌱🏟️ o estádio do MANDANTE no campinho: só carreira e só clube de gente (bot e os outros modos = gramado perfeito e casa cheia)
    estadioDe: nome => {
      if (!s?.careerOnline) return undefined
      const m = s.managers?.find(x => x.isHuman && x.teamName === nome)
      return m ? estadioNoCampinho(s.stadiums?.[m.id]) : undefined
    },
    tecnicoDe: nome => s?.careerTecnicos?.[nome] ?? null,
    taticaDe: nome => {
      const m = s?.managers?.find(x => x.teamName === nome)
      if (!s || !m) return 0
      // carreira: a tática é POR RODADA (vale da rodada em que trocou em diante); fora dela, uma por técnico
      let tac = s.tactics?.[m.id]
      const porRodada = s.careerTactics?.[m.id]
      if (porRodada) { let k = -1; for (const r in porRodada) { const n = +r; if (n <= s.round - 1 && n > k) { k = n; tac = porRodada[n] } } }
      return tac === 'ataque' ? 1 : tac === 'retranca' ? -1 : 0
    },
  }
}

// 📢 O TELÃO SEMPRE EMBAIXO DO JOGO (Diego 20/10: *"e o telão sempre embaixo do jogo"*). Com o 2D, o próprio campinho traz o
// telão logo abaixo dele; enquanto houver um campinho na tela, o telão solto da página se esconde (nunca aparece duas vezes).
let campos = 0
const ouvCampo = new Set<() => void>()
export function campoNaTela(delta: 1 | -1) { campos += delta; ouvCampo.forEach(f => f()) }
export function useCampoNaTela(): boolean {
  return useSyncExternalStore(f => { ouvCampo.add(f); return () => { ouvCampo.delete(f) } }, () => campos > 0)
}
