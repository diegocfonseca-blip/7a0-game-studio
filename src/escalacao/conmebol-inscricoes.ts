import { ESTRANGEIROS_LIBERTA_2026, ESTRANGEIROS_SULA_2026, type EntradaConmebol, type EntradaSula } from './conmebol-clubes'
import { RESERVAS_CONMEBOL } from './conmebol-reservas'

// CONMEBOL 2026, Manual de Clubes §3.6.1: vagas nacionais + os dois campeões.
// Campeão já classificado não consome duas vagas. A associação aproveita a vaga
// nacional na inscrição da edição seguinte, antes de qualquer sorteio/jogo.
export const PAISES_CONMEBOL = ['ARG', 'BOL', 'CHI', 'COL', 'EQU', 'PAR', 'PER', 'URU', 'VEN'] as const
export function paisDosClubesConmebol(): Record<string, string> {
  return Object.fromEntries([...ESTRANGEIROS_LIBERTA_2026, ...ESTRANGEIROS_SULA_2026, ...RESERVAS_CONMEBOL].map(c => [c.nome, c.pais]))
}
export function ordemNacionalConmebol(pais: string) {
  // Mantém os classificados nacionais de referência de 2026. Lanús era o
  // campeão continental de 2025, não uma sétima vaga nacional argentina.
  return [...new Set([
    ...ESTRANGEIROS_LIBERTA_2026.filter(c => c.pais === pais && c.nome !== 'Lanús').map(c => c.nome),
    ...ESTRANGEIROS_SULA_2026.filter(c => c.pais === pais).flatMap(c => pais === 'ARG' && c.nome === 'San Lorenzo' ? [c.nome, 'Lanús'] : [c.nome]),
    ...RESERVAS_CONMEBOL.filter(c => c.pais === pais).map(c => c.nome),
  ])]
}
export function estrangeirosLibertadores(campeoes: readonly string[], pais: Record<string, string>): EntradaConmebol[] {
  const out: EntradaConmebol[] = []
  for (const p of PAISES_CONMEBOL) {
    const base = ESTRANGEIROS_LIBERTA_2026.filter(c => c.pais === p && c.nome !== 'Lanús')
    const candidatos = ordemNacionalConmebol(p).filter(n => !campeoes.includes(n))
    for (const slot of base) {
      const nome = candidatos.shift()
      if (!nome) throw new Error(`Inscrição da Libertadores: faltam clubes elegíveis de ${p}.`)
      out.push({ nome, pais: p, fase: slot.fase })
    }
    for (const nome of campeoes.filter(n => pais[n] === p)) out.push({ nome, pais: p, fase: 'grupos' })
  }
  return out
}
export function estrangeirosSulAmericana(naLiberta: readonly string[]): EntradaSula[] {
  const out: EntradaSula[] = []
  for (const p of PAISES_CONMEBOL) {
    const n = p === 'ARG' ? 6 : 4
    const candidatos = ordemNacionalConmebol(p).filter(nome => !naLiberta.includes(nome)).slice(0, n)
    if (candidatos.length !== n) throw new Error(`Inscrição da Sul-Americana: faltam clubes elegíveis de ${p}.`)
    for (const nome of candidatos) out.push({ nome, pais: p, fase: p === 'ARG' ? 'grupos' : 'fase1' })
  }
  return out
}
