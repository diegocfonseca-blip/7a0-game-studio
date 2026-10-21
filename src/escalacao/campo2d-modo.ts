// 📺 CAMPO 2D LIGADO OU NÃO (20/10). Diego: *"o 2D é para funcionar em qualquer jogo, em qualquer liga, em qualquer Copa…
// online, offline, serve para tudo"*. Por isso a decisão mora num lugar só e o `LiveScoreCard` (o placar de TODAS as
// competições) desenha o campinho sozinho quando ela diz sim.
//  · OFFLINE (carreira, partida rápida, copas): a escolha é do aparelho (`esc-campo2d`), e só pra quem o 2D está liberado.
//  · SALA ONLINE: quem decide é a SALA (`state.campo2d`, escolhido pelo dono ao criar) — vale igual pra todo mundo dela,
//    porque o tempo do jogo muda junto e os relógios da sala têm que bater.
import { useSyncExternalStore } from 'react'
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

/** o 2D está ligado AQUI? (a sala online manda; fora dela, a escolha do aparelho de quem está liberado E pagou) */
export function useCampo2DLigado(): boolean {
  const liberado = useCampo2DLiberado()
  const p = usePref()
  const pg = usePago2D()
  const s = useEscTalvez()?.state
  if (s && s.onlineMode === 'online') return !!s.campo2d
  return liberado && p && pg
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
