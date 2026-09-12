// 🌐 IDIOMA DO SITE (BR/EN) — um só, pro jogo INTEIRO.
//
// Nasceu no BidLegends (basquete, NBA, público internacional). Em 11/09/2026 o
// Diego mandou valer pro futebol também: *"preciso q vc faça tradução do jogo
// p english de todo o jogo e tenha esse botão de traduzir, igual fizemos pro
// bidlegends"*. Então a regra antiga ("isto é SÓ do basquete, o futebol segue
// 100% em PT") está REVOGADA por ele.
//
// A escolha é ÚNICA pro site: quem virou pra EN no basquete continua em EN no
// futebol, e vice-versa. Mesma chave de sempre no aparelho (`bl_lang`), pra
// ninguém perder a escolha que já tinha feito.
//
// ⚠️ O QUE NUNCA SE TRADUZ (senão quebra o jogo ou mente pro jogador):
//   · nome de jogador, de clube, de mascote e de país — é identidade da carta,
//     e em vários lugares o NOME é a chave que casa carta, escudo e save;
//   · texto que o código compara ou guarda no save (posição GOL/LAT/ZAG/MEI/ATA,
//     letra de divisão, chave de formação);
//   · nome de clube batizado — é o clube de uma pessoa de verdade.
// Traduz-se o que a pessoa LÊ: título, botão, explicação, aviso, narração.
//
// Padrão esperto: se o navegador é PT, abre em BR; senão, abre em EN. A escolha
// manual fica gravada no aparelho e manda sobre o padrão.

import { useEffect, useState } from 'react'

export type Lang = 'pt' | 'en'

const LS_KEY = 'bl_lang'

function detect(): Lang {
  try { return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en' } catch { return 'pt' }
}

function readStored(): Lang | null {
  try { const v = localStorage.getItem(LS_KEY); if (v === 'pt' || v === 'en') return v } catch { /* ignora */ }
  return null
}

let current: Lang = readStored() ?? detect()

const listeners = new Set<() => void>()

export function getLang(): Lang { return current }

export function setLang(l: Lang): void {
  if (l === current) return
  current = l
  try { localStorage.setItem(LS_KEY, l) } catch { /* ignora */ }
  listeners.forEach(fn => { try { fn() } catch { /* ignora */ } })
}

export function onLangChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

// hook React: [idioma, trocar]
export function useLang(): [Lang, (l: Lang) => void] {
  const [, force] = useState(0)
  useEffect(() => onLangChange(() => force(n => n + 1)), [])
  return [current, setLang]
}

// helper de tradução inline: const t = useT(); t('Português', 'English')
export function useT(): (pt: string, en: string) => string {
  const [lang] = useLang()
  return (pt: string, en: string) => (lang === 'en' ? en : pt)
}

// colocação: "3º" em PT · "3rd" em EN (o inglês muda a terminação por número)
export function ordinal(n: number, lang: Lang = current): string {
  if (lang !== 'en') return `${n}º`
  const d = n % 100
  if (d >= 11 && d <= 13) return `${n}th`
  return `${n}${(['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`
}
