import catalog from './legend-avatars.json'

// Presentation only: no card/save mutations. No guessing another club or year.
const normalized = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
const clubs: Record<string, string> = {
  'manchester united': 'man united', 'manchester city': 'man city',
  'inter de milao': 'inter', 'bayern munchen': 'bayern',
}
export const legendAvatarKey = (name: string, club: string, year: number) => {
  const c = normalized(club)
  return `${normalized(name)}|${clubs[c] ?? c}|${year}`
}
const byIdentity = new Map(catalog.map(p => [legendAvatarKey(p.name, p.club, p.year), p]))
for (const [alias, name, club, year] of [
  ['Gérson Canhotinha de Ouro', 'Gérson', 'Botafogo', 1968],
  ['Cerezo', 'Toninho Cerezo', 'Atlético-MG', 1980],
  ["Samuel Eto'o", 'Samuel Eto’o', 'Barcelona', 2006],
] as const) {
  const art = byIdentity.get(legendAvatarKey(name, club, year))
  if (art) byIdentity.set(legendAvatarKey(alias, club, year), art)
}
export function legendAvatar(name: string, club?: string, year?: number) {
  if (!club || !year) return undefined
  return byIdentity.get(legendAvatarKey(name, club, year))
}
