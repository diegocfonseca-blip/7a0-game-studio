// 🧪 SÓ BANCADA (import dinâmico atrás de import.meta.env.DEV): um álbum de mentira pra fotografar as
// abas de Coleções/Trocas sem servidor. Nunca roda no site — o vite corta o ramo no build.
import { COLECOES, BARALHO_TODO } from './colecoes'
import type { CartaDoAlbum } from './album-colecoes'

export function copiasDemo(): CartaDoAlbum[] {
  const out: CartaDoAlbum[] = []
  let n = 0
  const poe = (c: { name: string; club: string; year: number; pos: string; fame: number }, extra: Partial<CartaDoAlbum> = {}) => out.push({ id: `d${n++}`, ...c, ...extra })
  const clube = (nome: string) => COLECOES.find(c => c.clube === nome)?.cartas ?? []
  clube('Peñarol').forEach(c => poe(c)) // fechado, pronto pra receber
  clube('Real Madrid').slice(0, 45).forEach((c, i) => { poe(c); if (i < 4) poe(c) }) // 45 de 52, com repetidas
  clube('Flamengo').slice(0, 58).forEach((c, i) => { poe(c); if (i % 9 === 0) poe(c) })
  clube('Santos').forEach(c => poe(c, { usadaEm: 'sim', usadaNome: 'Nova Eclipse' })) // já recebida 1x
  clube('Santos').slice(0, 12).forEach(c => poe(c)) // 2ª vez em andamento
  clube('Boca Juniors').slice(0, 9).forEach((c, i) => poe(c, i === 0 ? { presa: true } : {}))
  BARALHO_TODO.filter(c => c.club === 'Inter Miami').forEach(c => poe(c))
  { const col = new Set(COLECOES.flatMap(c => c.cartas.map(x => `${x.name}|${x.club}|${x.year}`))); BARALHO_TODO.filter(c => !col.has(`${c.name}|${c.club}|${c.year}`)).slice(0, 6).forEach(c => poe(c)) } // cartas avulsas
  COLECOES.find(c => c.especial)?.cartas.slice(0, 3).forEach(c => poe(c)) // 3 das 4 lendas avulsas
  return out
}
export function albumDemo() {
  return copiasDemo().map(c => ({ name: c.name, club: c.club, year: c.year, pos: c.pos as 'GOL', fame: c.fame, origin: 'online' as const, at: 0 }))
}
