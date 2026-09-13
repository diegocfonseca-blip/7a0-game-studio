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
// ─── 🗂️ CARTA RENOMEADA: o álbum guarda a carta VELHA ────────────────────────
// Quando a gente troca o auge de uma carta no `data.ts` (ex.: 03/09, a pedido do
// Diego, o Zidane saiu do Real Madrid 2002 e virou Juventus 1998), quem já tinha
// a carta continua com a VELHA — o álbum guarda a carta como ela era no dia em que
// foi ganha, e o rosto é achado por nome+clube+ano. Resultado: 86 donos do Zidane
// viam a LETRA no lugar do rosto que existe. Aqui a carta velha aponta pro rosto
// da carta nova. ⚠️ SÓ entra rename ÓBVIO — MESMA PESSOA e o mesmo clube (ou o
// caso documentado do Zidane). Nada de "chutar" que duas cartas são a mesma:
// o Ronaldinho do Grêmio 1999 (1 dono) ficou de FORA de propósito, porque não dá
// pra afirmar qual carta substituiu aquela. Conferido no banco em 13/09.
for (const [velho, novo] of [
  [['Zinedine Zidane', 'Real Madrid', 2002], ['Zinedine Zidane', 'Juventus', 1998]],   // 86 donos · troca de 03/09
  [['Zizinho', 'Flamengo', 1950], ['Zizinho', 'Flamengo', 1943]],                       // 50 donos · mesmo clube
  [['Marcos', 'Palmeiras', 1999], ['Marcos', 'Palmeiras', 2002]],                       // 39 donos · mesmo clube
  [['Zlatan Ibrahimović', 'Milan', 2013], ['Zlatan Ibrahimović', 'Milan', 2012]],       // 35 donos · mesmo clube
] as const) {
  const art = byIdentity.get(legendAvatarKey(novo[0], novo[1], novo[2]))
  if (art) byIdentity.set(legendAvatarKey(velho[0], velho[1], velho[2]), art)
}
export function legendAvatar(name: string, club?: string, year?: number) {
  if (!club || !year) return undefined
  return byIdentity.get(legendAvatarKey(name, club, year))
}
