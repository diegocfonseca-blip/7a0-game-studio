// 🎩 OS PRESIDENTES DA KINGS LEAGUE (12/11, lista do Diego): a 5ª posição do leilão da Kings, depois do ataque.
// Decisões dele: *"como se fosse uma posição da Kings League apenas"* · *"não bota presidentes repetidos e Gaules sem apelido"* ·
// 1s 2s 3s 4s = o presidente comprado bate o 🎩 pênalti do presidente (não muda a força do time) · TODOS com a mesma força
// (*"Neymar não fica acima não… tudo igual"*) · Kelvin Oliveira fica como jogador E presidente · só na Kings (os dois baralhos).
// Juninho Manella entrou e SAIU no mesmo dia (*"não coloque mais"*).
// 🎨 A carta é a PADRÃO, mas no lugar da cor da categoria vai o VISUAL DO TIME na carta toda — sem boneco, sem avatar.
// No motor o presidente mora na vaga 'LAT' (a Kings não tem lateral: a vaga estava vazia) — `ehPresidente` diz quem é.
// Clube = o da última participação dele (o mais recente da lista); nome curto igual ao do baralho da Kings (`kings-baralho.ts`).
import type { Card } from './types'

/** cores do time (medidas no escudo/camisa: pesquisa + prints do Diego de 12/11) — [fundo, destaque] */
export const CORES_TIME_KINGS: Record<string, [string, string]> = {
  Furia: ['#111111', '#F2F2F2'],
  Loud: ['#0E8F4A', '#0B0B0B'],
  Capim: ['#1B8A3A', '#F2F2F2'],
  Nyvelados: ['#111111', '#FF2E93'],
  'Real Elite': ['#0030F0', '#F03078'],
  Dendele: ['#1F4FBF', '#F2C230'],
  Funkbol: ['#B0168A', '#111111'],
  G3X: ['#F2F2F2', '#1B8A3A'],
  Fluxo: ['#E2462A', '#111111'],
  Desimpain: ['#0A0606', '#DB3223'],
  Dibrados: ['#622F6F', '#270E36'],
  'Desimpedidos Goti': ['#25397F', '#53AF6C'], // ≠ Desimpain (Diego: *"não é o mesmo time"*) — azul-marinho e verde, medidos no escudo que ele mandou
}

export type PresidenteKings = { name: string; club: string; year: number }
const P = (name: string, club: string, year: number): PresidenteKings => ({ name, club, year })

export const PRESIDENTES_KINGS: PresidenteKings[] = [
  P('Allan Stag', 'Dibrados', 2026),
  P('Lucas Tylty', 'Dibrados', 2026),
  P('Gaules', 'G3X', 2026),
  P('Kelvin Oliveira', 'G3X', 2026),
  P('Jon Vlogs', 'Capim', 2026),
  P('Luva de Pedreiro', 'Capim', 2026),
  P('Racha', 'Capim', 2026),
  P('Paulinho o Loko', 'Dendele', 2025),
  P('LuquEt4', 'Dendele', 2025),
  P('Toguro', 'Fluxo', 2026),
  P('Nobru', 'Fluxo', 2026),
  P('Cerol', 'Fluxo', 2026),
  P('Benja', 'Fluxo', 2026),
  P('Yuri 22', 'Desimpedidos Goti', 2025),
  P('Renatin', 'Desimpain', 2026),
  P('Ludmilla', 'Real Elite', 2025),
  P('Whindersson Nunes', 'Real Elite', 2025),
  P('Lucas Freestyle', 'Real Elite', 2025),
  P('Kond', 'Funkbol', 2025),
  P('Michel Elias', 'Funkbol', 2026),
  P('MC Hariel', 'Funkbol', 2026),
  P('Igão', 'Funkbol', 2026),
  P('Neymar Jr.', 'Furia', 2025),
  P('Cris Guedes', 'Furia', 2025),
  P('Coringa', 'Loud', 2026),
  P('Brabox', 'Loud', 2026),
  P('Nyvi Estephan', 'Nyvelados', 2026),
  P('Falcão', 'Nyvelados', 2026),
]

/** a força é IGUAL pra todos (decisão do Diego) — só pesa na cobrança do pênalti do presidente */
export const PRES_LO = 70, PRES_HI = 70
/** como entra no catálogo do leilão (vaga 'LAT' da Kings): categoria "bom jogador", a mesma pra todos */
export const CATALOGO_PRESIDENTES = PRESIDENTES_KINGS.map(p => ({ name: p.name, club: p.club, year: p.year, fame: 2 as const, lo: PRES_LO, hi: PRES_HI, presidente: true as const }))

export const ehPresidente = (c: Pick<Card, 'presidente'> | null | undefined): boolean => !!c?.presidente
export const coresDoPresidente = (club: string): [string, string] => CORES_TIME_KINGS[club] ?? ['#6B6B6B', '#2A2A2A']

const CHAVES_PRES = new Set(PRESIDENTES_KINGS.map(p => `${p.name}|${p.club}|${p.year}`))
/** a carta (nome+clube+ano) é de presidente? — a carta não depende do modo: onde ela aparecer, sai com as cores do time */
export const ehCartaPresidente = (name: string, club: string, year: number): boolean => CHAVES_PRES.has(`${name}|${club}|${year}`)
/** tinta legível sobre a cor de fundo */
export const tintaSobre = (hex: string): string => {
  const n = parseInt(hex.replace('#', ''), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#0C0C0C' : '#FFFFFF'
}
