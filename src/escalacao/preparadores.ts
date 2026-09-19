// ─── 🏋️ PREPARADOR FÍSICO (carreira) — catálogo e regras ─────────────────────
//
// Pedido do Diego (14-15/09): *"a gente tem que tirar esse botão de rodiziar, e só
// aparecer esse botão se comprar o preparador físico… ele vai ter salário também…
// e também vai ter contrato de renovação"*.
//
// 👤 GENTE DE VERDADE, por ordem dele. Quando ofereci nomes folclóricos, ele cortou:
// *"falei preparadores famosos"*. Então vale a regra da casa pra pessoa real
// (*"não inventar como uma pessoa real é"*): aqui só entra o NOME e UMA LINHA
// factual da carreira. Nada de rosto, nada de bio inventada, nada de "jeitão".
// O tier é o preço/benefício do item no jogo, não julgamento sobre ninguém.
//
// 💰 Preços fechados com ele (ele achou 300/800/1500 caro: *"pode ser cem,
// quinhentos e mil"*) e depois pediu um 4º degrau, o 💎 roxo: *"pode ter mais um
// q seria roxo da categoria promessa pq acho q o preparador de seleção deveria
// encher o tanque em menos rodadas ainda"*. Em 19/09 ele baixou os dois de cima:
// **100 · 300 · 500 · 800** (ver nota da renovação abaixo).
//
// 💸 SALÁRIO E CONTRATO COPIAM O TÉCNICO, sem inventar regra nova:
//   · salário = 10% do preço, por temporada (a mesma conta de `careerTecnicoPago`/10)
//   · contrato de 5 temporadas (`seasonNo + 4`)
//   · 🔁 RENOVAÇÃO PELA METADE DO PREÇO (Diego 19/09): *"tá mt caro renovar contrato
//     de preparador, principalmente o de mil… quero q seja metade todos eles, como se
//     o valor desse é mil mas fosse 500 p cálculos de renovação"*. Antes copiava o
//     técnico (preço cheio). Vale pros QUATRO.
//   · 💰 PREÇOS DE 19/09 (ordem dele, logo depois): *"coloque preço principal de
//     100, 300, 500, 800"*. Era 100/300/600/1000. Com isso: salário 10/30/50/80 e
//     renovação 50/150/250/400.
//   · dispensa sem multa depois de vencido
import type { ApoioTier } from './apoio'

export type PreparadorKey = 'faria' | 'pintus' | 'paixao' | 'seirulo'

export type Preparador = {
  key: PreparadorKey
  nome: string        // 🚫 nome de pessoa real NÃO se traduz (regra do CLAUDE.md)
  pais: string
  tier: ApoioTier     // a cor vem do tier de apoio.tsx — cor de tier é sagrada
  selo: string
  cat: [string, string]  // [PT, EN] — a palavra da categoria
  bio: [string, string]  // [PT, EN] — UMA linha factual, nada inventado
  preco: number
  banco: number       // quanto de gás cada rodada no banco devolve (sem preparador: GAS_BANCO)
}

// 🤖 O AUTOMÁTICO É SÓ DO 👑 LENDA (Diego 15/09: *"botão automático podemos pôr
// apenas pro que pagar o preparador lenda, o que acha? melhor né"*). A escada fica:
// 🟢💎⭐ dão o BOTÃO (você aperta quando quiser) · 👑 dá o PILOTO AUTOMÁTICO.
// Eu avisei que o automático hoje é de graça pra todo mundo e que quem usa vai
// perder — ele seguiu assim mesmo, junto com o "começa do zero" (ninguém ganha
// preparador de brinde).
export const temAutomatico = (p: Preparador | null): boolean => p?.key === 'seirulo'

// ⚖️ o banco hoje devolve +4 e cada jogo gasta 1,4 (condicao.ts) → 1 descanso paga 2
// jogos. Cada preparador só mexe NESSE número (ver `jogosPorDescanso`):
//   +6 → 1 descanso paga 4 jogos · +9 → 6 · +12 → 8 · +20 → 14
export const PREPARADORES: Preparador[] = [
  {
    key: 'faria', nome: 'Rui Faria', pais: '🇵🇹', tier: 'verde', selo: '', cat: ['Bom', 'Good'],
    bio: ['Começou como preparador físico do Mourinho e virou auxiliar dele no Porto, Chelsea, Inter, Real e United.',
      'Started as Mourinho\'s fitness coach and became his assistant at Porto, Chelsea, Inter, Real and United.'],
    preco: 100, banco: 6,
  },
  {
    key: 'pintus', nome: 'Antonio Pintus', pais: '🇮🇹', tier: 'roxo', selo: '💎', cat: ['Promessa', 'Prospect'],
    bio: ['Preparador físico da Juventus, Inter, Monaco e do Real Madrid.',
      'Fitness coach at Juventus, Inter, Monaco and Real Madrid.'],
    preco: 300, banco: 9,
  },
  {
    key: 'paixao', nome: 'Paulo Paixão', pais: '🇧🇷', tier: 'prata', selo: '⭐', cat: ['Craque', 'Star'],
    bio: ['Preparador físico da Seleção Brasileira em quatro Copas do Mundo seguidas.',
      'Fitness coach for the Brazil national team in four straight World Cups.'],
    preco: 500, banco: 12,
  },
  {
    key: 'seirulo', nome: 'Paco Seirulo', pais: '🇪🇸', tier: 'ouro', selo: '👑', cat: ['Lenda', 'Legend'],
    bio: ['Décadas no Barcelona — a preparação física por trás da era mais vitoriosa do clube.',
      'Decades at Barcelona — the fitness work behind the club\'s most successful era.'],
    preco: 800, banco: 20,
  },
]

export const preparadorDe = (key?: string | null): Preparador | null =>
  (key ? PREPARADORES.find(p => p.key === key) ?? null : null)

/** salário por temporada — a MESMA conta do técnico (10% do preço) */
export const salarioPreparador = (p: Preparador | null): number => (p ? Math.round(p.preco / 10) : 0)

/** 📝 renovar custa METADE do preço de contratação (Diego 19/09) — vale pros quatro */
export const precoRenovacaoPreparador = (p: Preparador | null): number => (p ? Math.round(p.preco / 2) : 0)

// 🔋 O QUE O PREPARADOR FAZ, EM PALAVRAS QUE NÃO CONFUNDEM (Diego 19/09): *"tá mt
// confuso esse negócio de joga 8 seguidas e senta 1… o jogador q nem tem preparador
// cansa só dps de 50 partidas"*. Ele tem razão: o "joga N, senta 1" era o ritmo em
// que o tanque NUNCA DESCE, não o ponto em que o cara cansa. O jogador aguenta 54
// jogos seguidos antes do 😓 COM OU SEM preparador — o preparador não muda a escada,
// muda quanto UMA rodada no banco devolve (+4 sem ele; +6/+9/+12/+20 com).
// Então a tela agora diz isso: quanto o banco devolve e quantos jogos um descanso paga.
/** quantos jogos de titular UMA rodada no banco paga (gás devolvido ÷ gasto por jogo) */
export const jogosPorDescanso = (banco: number): number => Math.floor(banco / 1.4)

// ─── 📝 O PRAZO DO CONTRATO DA COMISSÃO (18/09) ──────────────────────────────
// Antes era SEMPRE 5 temporadas, cravado. O Diego olhou e pediu variedade, com a
// régua já existente: *"sobre contratos, mesmo tempo igual faz pro jogador"* e,
// quando ofereci um sorteio curtinho de 4/5/6, *"opção A, mas quero mais tempos,
// acho que falta um de dez, sei lá"*.
// 👉 Então o prazo sai SORTEADO na assinatura, na MESMA escada do jogador
// (`renewOptions` em store.tsx oferece 1 · 2 · 3 · 5 · 10). Pra comissão ficam os
// três degraus que fazem sentido pra quem custa moeda contada: **3 · 5 · 10**.
// ⚖️ Os pesos são de propósito: o 5 é o normal, o 3 é o azar e o 10 é a sorte
// grande. Na média dá 5,65 — ou seja, ninguém fica pior do que era, e ainda pode
// tirar um contratão. Um item PAGO não pode virar aposta ruim.
// 🔎 E o número sorteado aparece na hora de assinar: a tela nunca promete 5 e
// entrega 3.
export const CONTRATO_PRAZOS = [3, 5, 10] as const
/** o prazo de referência (o que a loja mostra como "normal") */
export const CONTRATO_TEMPORADAS = 5
/** teto absoluto: nenhuma ficha de comissão pode faltar mais que isto */
export const CONTRATO_MAX = 10

/** sorteia o prazo: 3 (30%) · 5 (45%) · 10 (25%) */
export function sorteiaPrazo(rng: () => number): number {
  const r = rng()
  return r < 0.30 ? 3 : r < 0.75 ? 5 : 10
}

/** temporada em que o contrato ENCERRA. Sem `rng` (saves/telas antigas) vale o prazo normal. */
export const fimDoContrato = (seasonNo: number, rng?: () => number): number =>
  seasonNo + (rng ? sorteiaPrazo(rng) : CONTRATO_TEMPORADAS) - 1
