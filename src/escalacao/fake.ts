// ─── 🃏🚫 QUEM NÃO CONTA PRA ESTATÍSTICA (ordem do Diego, 19/09) ────────────
//
// Palavras dele: *"tem um monte de jogador fake, Zé Ninguém, Trapalhão, ganhando
// a bola de ouro. Eles podem fazer gols ou assistência durante o jogo, não tem
// problema nenhum. Mas não podem contar pra estatística de artilharia,
// assistência e bola de ouro"*.
//
// 👉 A REGRA, em uma linha: **jogador tapa-buraco joga, marca e some** — o gol
//    dele conta no PLACAR, aparece na narração e na ficha do time, mas ele não
//    entra em artilharia, garçons, artilheiro da divisão, artilheiro de copa nem
//    Bola de Ouro. Ranking é lugar de carta de verdade.
//
// Existem DOIS tipos de tapa-buraco no jogo, e os dois valem por esta regra:
//  1. **FILLER de várzea** (`fil-…`, clube `Várzea` — no basquete, `Pickup`):
//     nível 30-40, nome de zoeira (Zé Ninguém, Trapalhão, Bola Murcha). Entra só
//     pra fechar elenco de time de CPU. É o que o Diego viu ganhando o prêmio.
//  2. **INCÓGNITA** (`inc-…`, `fake: true`): nome e clube inventados
//     (`makeIncognita` em `data.ts`), usada quando o catálogo real de uma posição
//     acaba. Também não é gente do baralho, então também fica fora do ranking.
//
// ⚠️ POR QUE EXISTE `ehLinhaFake` ALÉM DE `ehCartaFake`: o histórico de todos os
//    tempos guarda só `nome|clube|ano` — o `cardId` é jogado fora de propósito
//    (muda todo leilão). Então, pra LIMPAR o passado de quem já tem carreira
//    rolando, dá pra olhar só nome e clube. Conferi contra o baralho inteiro
//    (1.466 cartas): **zero** cartas reais com clube Várzea/Pickup, **zero** com
//    nome de filler e **zero** que batem nome de incógnita E clube de incógnita
//    ao mesmo tempo. Ou seja: nenhum jogador de verdade é confundido.
import type { Card } from './types'

/** clube-sentinela do tapa-buraco: 'Várzea' no futebol, 'Pickup' no basquete */
export const isFillerClub = (club?: string): boolean => club === 'Várzea' || club === 'Pickup'

/** a carta em si (tem `id`, `fake`, `club`) — o teste forte, usado na simulação */
export const ehCartaFake = (c: Pick<Card, 'name' | 'club'> & { fake?: boolean; id?: string }): boolean =>
  !!c.fake || isFillerClub(c.club) || /^(fil|inc)-/.test(c.id ?? '')

// ── Só pra RECONHECER o passado (não é a lista que GERA nome nenhum) ─────────
// ⚠️ NÃO transformar isto na fonte dos geradores. As listas de `pyramidseason.tsx`
// (8 nomes) e `dinastia.tsx` (10) têm tamanhos diferentes, e o sorteio é por
// índice com semente — mudar o tamanho de uma delas mudaria jogo já simulado.
// Aqui é a UNIÃO das duas, e serve só pra perguntar "este nome é tapa-buraco?".
const NOMES_TAPA_BURACO = new Set(['Perna-de-pau', 'Ferro Velho', 'Pé de Anjo', 'Canela Seca', 'Zé Ninguém', 'Trapalhão', 'Bola Murcha', 'Café com Leite', 'Pastelão', 'Meia-Boca'])
const INC_FIRST = new Set(['Valdir', 'Josimar', 'Cleiton', 'Ednaldo', 'Wanderson', 'Gonçalves', 'Íris', 'Baltemar', 'Osmarino', 'Delei', 'Nivaldo', 'Juraci', 'Aloísio', 'Ademilson', 'Zé Roberto', 'Toninho', 'Gersinho', 'Maurício', 'Índio', 'Fumagalli'])
const INC_NICK = new Set(['da Ilha', 'Perna Torta', 'Bola Sete', 'do Sertão', 'Trovoada', 'Canela Fina', 'Pé de Ferro', 'Maestro', 'Furacão', 'da Baixada', 'Gaúcho', 'Paraíba', 'Matuto', 'Serrano', 'do Brejo', 'Cigano', 'Foguete', 'Peixe Frito', 'da Várzea', 'Bicudo'])
const INC_CLUBS = new Set(['Operário', 'Treze', 'Caldense', 'Ypiranga', 'Ferroviário', 'Uberlândia', 'Anapolina', 'Itabaiana', 'River-PI', 'Sergipe', 'Central-PE', 'Mixto', 'Rio Branco', 'Olaria', 'Bangu', 'Portuguesa', 'Inter de Limeira', 'União São João', 'Tuna Luso', 'XV de Piracicaba'])

/** nome de incógnita = <primeiro nome da lista> + <apelido da lista>, colados */
const nomeDeIncognita = (nome: string): boolean => {
  const p = nome.split(' ')
  for (let i = 1; i < p.length; i++) if (INC_FIRST.has(p.slice(0, i).join(' ')) && INC_NICK.has(p.slice(i).join(' '))) return true
  return false
}

/**
 * linha de estatística guardada (só tem nome/clube — e às vezes `fake`/`cardId`).
 * É por aqui que o histórico velho é limpo quando a carreira abre.
 */
export const ehLinhaFake = (r: { name: string; club?: string; fake?: boolean; cardId?: string }): boolean =>
  !!r.fake
  || isFillerClub(r.club)
  || /^(fil|inc)-/.test(r.cardId ?? '')
  || NOMES_TAPA_BURACO.has(r.name)
  || (nomeDeIncognita(r.name) && INC_CLUBS.has(r.club ?? ''))
