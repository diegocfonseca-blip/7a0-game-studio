// 🌐 IDIOMA DO BIDLEGENDS (BR/EN) — o basquete é internacional (NBA), então
// TODO texto novo do BidLegends nasce bilíngue. Regra do Diego (26/07): botão
// BR/EN no canto direito do header; troca a língua do BidLegends inteiro.
//
// IMPORTANTE: isto é SÓ do basquete. O futebol (Leilão Legends) segue 100% em
// PT — não traduzir o jogo de futebol.
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
