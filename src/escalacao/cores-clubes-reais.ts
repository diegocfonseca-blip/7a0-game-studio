// 🎽 CORES DOS CLUBES DE VERDADE NAS COPAS CONVOCADAS (26/11, print do Diego: *"cores erradas dos times oficiais convocados"*).
// A Libertadores da sala no Campo 2D vestia Flamengo de verde e Palmeiras de vermelho: as copas convocadas mandavam o verde/vermelho
// FIXO de "casa × fora" em vez da camisa do clube. Agora a cor é a do CLUBE:
//   1º os selos do Leilão de Clubes (`SELOS`, cores já aprovadas) · 2º esta tabela (os que não estão lá, pela camisa titular
//   conhecida) · 3º o escudo genérico de sempre (`escudoDe`), pros poucos sem referência segura (Ipatinga, River-PI) — não se chuta cor.
// Camisa parecida dos dois lados quem resolve é o Campo 2D (`camisasDoJogo`: o visitante vai de 2ª cor / reserva).
import { SELOS } from './selos-clubes'
import { clubCanon } from './data'
import { escudoDe } from './escudos'

export const CORES_CLUBES_REAIS: Record<string, [string, string]> = {
  // 🌎 Libertadores
  'Racing': ['#6CACE4', '#FFFFFF'], 'Independiente': ['#D50032', '#FFFFFF'], 'Estudiantes': ['#D50032', '#FFFFFF'],
  'San Lorenzo': ['#1B3F8F', '#C8102E'], "Newell's Old Boys": ['#D50032', '#111111'], 'Rosario Central': ['#003DA5', '#FFD100'],
  'Argentinos Juniors': ['#E4002B', '#FFFFFF'], 'Peñarol': ['#FFD100', '#111111'], 'Nacional-URU': ['#FFFFFF', '#002F6C'],
  'Colo-Colo': ['#FFFFFF', '#111111'], 'Olimpia': ['#FFFFFF', '#111111'], 'Cerro Porteño': ['#C8102E', '#003DA5'],
  'Libertad': ['#111111', '#FFFFFF'], 'Emelec': ['#0055A4', '#FFFFFF'], 'Millonarios': ['#0033A0', '#FFFFFF'],
  'Universitario': ['#F2E6C8', '#8B1A2B'],
  // 🌍 Super Mundial
  'Salzburg': ['#FFFFFF', '#D50032'], 'Urawa Reds': ['#E60012', '#111111'], 'Al Ain': ['#5B2C83', '#FFFFFF'],
  'Ulsan HD': ['#0047AB', '#FFD100'], 'Wydad': ['#D50032', '#FFFFFF'], 'Espérance': ['#C8102E', '#FFD100'],
  'Mamelodi Sundowns': ['#FFD100', '#007A33'], 'Monterrey': ['#002D72', '#FFFFFF'], 'Seattle Sounders': ['#5D9741', '#236192'],
  'Pachuca': ['#0033A0', '#FFFFFF'], 'LAFC': ['#111111', '#C39E6D'], 'Auckland City': ['#1D3A8A', '#FFFFFF'],
  // ⭐ Champions
  'Athletic Bilbao': ['#E30613', '#FFFFFF'], 'Atalanta': ['#1E71B8', '#111111'], 'Eintracht Frankfurt': ['#E1000F', '#111111'],
  'Union SG': ['#FFD100', '#003DA5'], 'Brugge': ['#005CA9', '#111111'], 'Galatasaray': ['#A90432', '#FDB912'],
  'Slavia Praga': ['#C8102E', '#FFFFFF'], 'Copenhagen': ['#FFFFFF', '#003DA5'], 'Bodø/Glimt': ['#FFE600', '#111111'],
  'Qarabağ': ['#111111', '#FFFFFF'], 'Pafos': ['#1A3E8C', '#FFFFFF'], 'Kairat': ['#FFD100', '#111111'],
  // 🏟️ regionais
  'America-RJ': ['#C8102E', '#FFFFFF'], 'Madureira': ['#FFD100', '#003DA5'], 'Volta Redonda': ['#FFD100', '#111111'],
  'Portuguesa': ['#D50032', '#00843D'], 'Juventude': ['#00843D', '#FFFFFF'], 'Caxias': ['#7A1F3D', '#FFFFFF'],
  'Figueirense': ['#111111', '#FFFFFF'], 'Avaí': ['#0055A4', '#FFFFFF'], 'Criciúma': ['#FFD100', '#111111'],
  'Paraná': ['#0033A0', '#C8102E'], 'Londrina': ['#4BA3DD', '#FFFFFF'], 'ABC': ['#FFFFFF', '#111111'],
  'América-RN': ['#C8102E', '#FFFFFF'], 'Botafogo-PB': ['#111111', '#FFFFFF'], 'CRB': ['#C8102E', '#FFFFFF'],
  'CSA': ['#0033A0', '#FFFFFF'], 'Confiança': ['#0033A0', '#FFFFFF'], 'Sampaio Corrêa': ['#FFD100', '#00843D'],
  'Moto Club': ['#C8102E', '#111111'],
}

/** a cor da camisa titular de um clube de verdade (a chave é o nome do clube nas cartas) */
export function corDoClubeReal(clube: string): string {
  const s = SELOS[clubCanon(clube)] ?? SELOS[clube]
  if (s) return s.c1
  const t = CORES_CLUBES_REAIS[clube] ?? CORES_CLUBES_REAIS[clubCanon(clube)]
  return t ? t[0] : escudoDe(clube).c1
}
