// ─── 🃏 BARALHO REGIONAL — as cartas que SÓ existem nas copas regionais (10/10) ──
//
// Regra fechada com o Diego (10/10): jogador de clube pequeno (Bangu, Olaria, Treze,
// CSA…) entra AQUI, e não no `data.ts`. Palavras dele: *"pôr muito time desconhecido
// pra depois esses jogadores não tão famosos irem pro leilão vai ser foda"*.
//   · fora da sala de copa regional estas cartas NÃO EXISTEM: não entram na carreira,
//     nem em sala nenhuma de outro modo (nem 🃏 Jogador, nem 🧱 Clubes);
//   · na sala de copa regional entram no leilão MISTURADAS com o baralho inteiro, do
//     jeito de sempre, e na convocação do clube delas.
// Os clubes grandes (Flamengo, Bahia, Grêmio…) usam as cartas que JÁ existem no
// baralho do Brasil — nada de duplicar jogador (regra de 26/09: o mesmo jogador só
// em baralho diferente).
//
// ⚠️ Carta nova aqui é gente de verdade: só entra depois que o Diego aprovar a lista
// (nome + clube + ano), com a categoria daquele jogador NAQUELE clube e ano.
// Formato idêntico às cartas do `data.ts` (`fame` 1 perna-de-pau … 5 lenda).
import type { Sector } from './types'

export type CartaRegional = { name: string; club: string; year: number; fame: 1 | 2 | 3 | 4 | 5; lo: number; hi: number; bio?: string; folk?: boolean }

export const CARTAS_REGIONAIS: Record<Sector, CartaRegional[]> = {
  GOL: [],
  LAT: [],
  ZAG: [],
  MEI: [],
  ATA: [],
}
