// ─── 🧑‍💼 PRESIDENTE × PLANO (15/10, ordem do Diego) — as regras PURAS, num lugar só ──────────────
//
// Palavras dele: *"quero vender eles!! Nada é de graça até msm no plano gratuito.. Começa a ganhar
// boneco apenas no modo craque pra cima"*. Então:
//   · GRÁTIS: monta o boneco pra ver como fica, mas NÃO salva (vitrine). Nada do editor é grátis.
//   · ⭐ CRAQUE: cria o presidente — pele, cabelos/barbas e as roupas BÁSICAS (as que o catálogo chama de 'free').
//   · 👑 LENDA: + as roupas ESPECIAIS (as 'craque' do catálogo: couro, smoking, motoqueiro…).
//   · 🖋 BATISMO / FUNDADOR: + as roupas de GALA (as 'lenda': traje real, Rei do Pregão…).
//   · 🖋 SÓ FUNDADOR (16/10, Diego: *"camisa do astronauta quero apenas no plano fundador, e gala dourada smoking dourado
//     também"*): astronauta e traje de gala dourado (nível 'fundador' do catálogo).
//   · Camisa de time, cabelo avulso etc. NÃO existem aqui ainda: Diego parou a camisa do Flamengo em 15/10 e
//     não fechou preço de avulso — quando fechar, entra como `compra` ao lado do plano, nunca como "free".
//
// Este arquivo é PURO (sem banco, sem React, sem catálogo): o editor, o reducer da carreira e a trava
// `npm run presidente` leem as MESMAS funções — regra de ouro contra botão mudo (19/09). O plano vem de
// `planoAtual()` (planos-regras.ts), nunca do rascunho nem do nome do clube.
import type { PlanoUnico } from './planos-regras'

/** degrau de cada plano na escada do presidente (0 = grátis, não cria) */
export const DEGRAU_PLANO: Record<PlanoUnico, number> = { craque: 1, lenda: 2, batismo: 3, fundador: 4 }
export function degrauDoPlano(plano: PlanoUnico | null | undefined): number { return plano ? DEGRAU_PLANO[plano] : 0 }

/** o degrau que cada nível de roupa do catálogo exige: 'free' → Craque · 'craque' → Lenda · 'lenda' → Batismo+ */
export const DEGRAU_ROUPA = { free: 1, craque: 2, lenda: 3, fundador: 4 } as const
export type AcessoRoupa = keyof typeof DEGRAU_ROUPA

/** pode CRIAR/SALVAR o presidente? Só com plano (Craque pra cima). Grátis só olha. */
export function podeSalvarPresidente(plano: PlanoUnico | null | undefined): boolean { return degrauDoPlano(plano) >= 1 }

/** peça do rosto (pele, cabelo, barba, brinco): tudo é do Craque pra cima — nada grátis */
export function podeUsarPeca(plano: PlanoUnico | null | undefined): boolean { return degrauDoPlano(plano) >= 1 }

/** nível de acesso de uma roupa (`access` do catálogo) × plano */
export function podeVestirAcesso(access: string | undefined, plano: PlanoUnico | null | undefined): boolean {
  if (!access || !(access in DEGRAU_ROUPA)) return false
  return degrauDoPlano(plano) >= DEGRAU_ROUPA[access as AcessoRoupa]
}

export const SELO_DEGRAU: Record<1 | 2 | 3 | 4, readonly [string, string]> = {
  1: ['⭐ CRAQUE', '⭐ STAR'],
  2: ['👑 LENDA', '👑 LEGEND'],
  3: ['🖋 BATISMO', '🖋 CLUB NAMING'],
  4: ['🖋 FUNDADOR', '🖋 FOUNDER'],
}
/** o selo que a tela mostra numa roupa daquele nível (PT, EN) — nunca diz GRÁTIS */
export function seloAcesso(access: string | undefined): readonly [string, string] {
  if (!access || !(access in DEGRAU_ROUPA)) return ['INDISPONÍVEL', 'UNAVAILABLE']
  return SELO_DEGRAU[DEGRAU_ROUPA[access as AcessoRoupa]]
}
/** o selo das peças do rosto */
export function seloPeca(): readonly [string, string] { return SELO_DEGRAU[1] }

/** a frase da trava, pra tela explicar o PORQUÊ e o CAMINHO (regra do Diego: toda trava diz os dois) */
export function motivoTrava(plano: PlanoUnico | null | undefined): readonly [string, string] | null {
  if (podeSalvarPresidente(plano)) return null
  return ['🔒 Pra criar e salvar o seu presidente precisa do ⭐ Craque. Você pode montar à vontade pra ver como fica.',
    '🔒 Creating and saving your president needs ⭐ Star. You can mix and match freely to see how it looks.']
}
