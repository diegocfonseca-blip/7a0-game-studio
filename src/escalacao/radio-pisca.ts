// 📻 26/10 (Diego, prints do Football Manager): no GOL a faixa de narração PISCA SEM PARAR durante o momento do gol, trocando
// [verde do Bom Jogador · letra bege] ⇄ [bege · letra preta] (o normal da faixa é bege com letra preta), e grita "GOOOOL DO <time>!" (*"trocando entre o verde… e o creme… igual nas fotos do FM"*) — a cor é sempre essa, de qualquer time.
// Serve o placar cinema (rádio) e o Campo 2D (faixa do locutor). Só cor: não mexe em placar nem relógio.
import type { CSSProperties } from 'react'
import './radio-pisca.css'

/** RESERVA: o pisca acaba junto com a cena do gol; isto só vale se a tela não tiver cena (igual à cena: ~1,7 s) */
export const PISCA_GOL_MS = 1800
/** o verde do 🎯 Bom Jogador (o mesmo do selo da carta) e o creme do jogo */
const VERDE = '#2E9E5B', CREME = '#F4ECD6'

export function estiloPisca(): CSSProperties {
  return { '--ll44-a': VERDE, '--ll44-b': CREME } as CSSProperties
}
/** 🔁 26/10 (2ª conversa): durante o pisca a faixa não narra o lance — ela grita o gol, com o time E o autor
 *  (Diego: *"gooooollll do Neymarzetti, Ronaldo é o nome dele! — com esse bordão falando o nome do jogador"*).
 *  O bordão varia um pouco (preso no nome + minuto: o mesmo gol grita sempre igual). */
const BORDOES: [string, string][] = [
  ['{J} É O NOME DELE!', "{J}'S THE NAME!"],
  ['É DELE, É DO {J}!', "IT'S {J}, WHO ELSE!"],
  ['PODE CHAMAR DE {J}!', 'CALL HIM {J}!'],
  ['QUE GOLAÇO DE {J}!', 'WHAT A GOAL FROM {J}!'],
]
export function gritoGol(time: string, en: boolean, jogador?: string, min?: number): string {
  const t = time.toUpperCase()
  const base = en ? `⚽ GOOOOAL FOR ${t}!` : `⚽ GOOOOOOL DO ${t}!`
  if (!jogador) return base
  let h = (min ?? 0) * 31; for (const c of jogador) h = (h * 33 + c.charCodeAt(0)) >>> 0
  const b = BORDOES[h % BORDOES.length][en ? 1 : 0].replace('{J}', jogador.toUpperCase())
  return `${base} ${b}`
}
