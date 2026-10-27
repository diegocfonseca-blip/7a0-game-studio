// 🔒 CARREIRA GRÁTIS ATÉ A TEMPORADA 50 (27/10, Diego, mockup `scripts/mockups/carreira-50.png` aprovado): *"quem não tem plano…
// chegando na temporada 50 só avança quem tem plano pago… não deixa ela seguir jogando mais aquele save, somente após ela adquirir
// qualquer plano. Ela pagando descongela"*. Quem JÁ passou da 50 segue livre (*"quem já passou sem problemas"*) — e como só se
// passa da 50 com plano daqui pra frente, "temporada acima de 50" já é a prova de que passou antes (ou com plano). A régua é UMA
// só, lida pela tela da decisão E pelo motor (CAREER_ADVANCE): nada de botão mudo. Trava: `npm run carreira-gratis`.
export const CARREIRA_GRATIS_ATE = 50

/** true = sem plano, no fim da temporada 50: a virada pra 51 fica trancada até assinar qualquer plano */
export function travaCarreiraGratis(seasonNo: number | undefined, pagante: boolean): boolean {
  return !pagante && (seasonNo ?? 1) === CARREIRA_GRATIS_ATE
}
