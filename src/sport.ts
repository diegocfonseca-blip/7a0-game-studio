// ─── Qual esporte o app está rodando ───
// bidlegendsarena.com → 🏀 basquete (BidLegends)
// leilaolegends.com (e qualquer outro host) → ⚽ futebol (Leilão Legends)
//
// O futebol NÃO muda em nada: 'futebol' é sempre o default. O basquete só
// entra quando o hostname é o do BidLegends OU quando forçamos pelo override
// ?sport=basquete — que fica salvo pra dar pra testar TUDO antes do DNS.

export type Sport = 'futebol' | 'basquete'

const STORAGE_KEY = 'bl_sport'

/** Esporte-padrão da home, decidido por override (?sport=) → salvo → hostname. */
export function detectSport(): Sport {
  try {
    // 1) Override explícito na URL — persiste pra sobreviver à navegação.
    const q = new URLSearchParams(window.location.search).get('sport')
    if (q === 'basquete' || q === 'futebol') {
      localStorage.setItem(STORAGE_KEY, q)
      return q
    }
    // 2) Override salvo de um ?sport= anterior (útil pra testar sem o DNS).
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'basquete' || saved === 'futebol') return saved
    // 3) Hostname: só o domínio do BidLegends abre no basquete.
    const host = window.location.hostname.toLowerCase()
    if (host.includes('bidlegendsarena')) return 'basquete'
  } catch {
    /* SSR / storage bloqueado — cai no default */
  }
  return 'futebol'
}

/** Guarda a escolha do override (usado pelos botões de teste, não pela troca de aba). */
export function rememberSport(sport: Sport) {
  try {
    localStorage.setItem(STORAGE_KEY, sport)
  } catch {
    /* ignora */
  }
}

export const SPORT_LABEL: Record<Sport, string> = {
  futebol: '⚽ Futebol',
  basquete: '🏀 Basquete',
}

/** Marca visível de cada esporte (o "arena" mora só no endereço). */
export const SPORT_BRAND: Record<Sport, string> = {
  futebol: 'Leilão Legends',
  basquete: 'BidLegends',
}
