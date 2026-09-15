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
// encher o tanque em menos rodadas ainda"*.
//
// 💸 SALÁRIO E CONTRATO COPIAM O TÉCNICO, sem inventar regra nova:
//   · salário = 10% do preço, por temporada (a mesma conta de `careerTecnicoPago`/10)
//   · contrato de 5 temporadas (`seasonNo + 4`), renova pelo MESMO preço quando vence
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

// ⚖️ o banco hoje devolve +4 e cada jogo gasta 1,4 (condicao.ts) → "joga 2, senta 1"
// é o ritmo em que o tanque nunca desce. Cada preparador só mexe NESSE número:
//   +6 → joga 4 e senta 1 · +9 → joga 6 · +12 → joga 8 · +20 → joga 14
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
    preco: 600, banco: 12,
  },
  {
    key: 'seirulo', nome: 'Paco Seirulo', pais: '🇪🇸', tier: 'ouro', selo: '👑', cat: ['Lenda', 'Legend'],
    bio: ['Décadas no Barcelona — a preparação física por trás da era mais vitoriosa do clube.',
      'Decades at Barcelona — the fitness work behind the club\'s most successful era.'],
    preco: 1000, banco: 20,
  },
]

export const preparadorDe = (key?: string | null): Preparador | null =>
  (key ? PREPARADORES.find(p => p.key === key) ?? null : null)

/** salário por temporada — a MESMA conta do técnico (10% do preço) */
export const salarioPreparador = (p: Preparador | null): number => (p ? Math.round(p.preco / 10) : 0)

/** 📝 contrato de 5 temporadas, igual ao técnico */
export const CONTRATO_TEMPORADAS = 5
export const fimDoContrato = (seasonNo: number): number => seasonNo + CONTRATO_TEMPORADAS - 1
