// 🔒 CARREIRA GRÁTIS ATÉ A TEMPORADA 50 (27/10, Diego, mockup `scripts/mockups/carreira-50.png` aprovado): *"quem não tem plano…
// chegando na temporada 50 só avança quem tem plano pago… não deixa ela seguir jogando mais aquele save, somente após ela adquirir
// qualquer plano. Ela pagando descongela"*. 🔁 Mesmo dia: *"quem já passou da temporada 50 do plano grátis, coloque um limite de mais
// dez temporadas"* — a carreira grátis que JÁ estava acima da 50 ganha +10 a partir de agora: na 1ª virada sem plano o save grava
// `careerGratisAte` (= temporada de agora + 10) e trava no fim dela. Quem tem plano não vê nada, nunca.
// A régua é UMA só, lida pela tela da decisão E pelo motor (CAREER_ADVANCE): nada de botão mudo. Trava: `npm run carreira-gratis`.
export const CARREIRA_GRATIS_ATE = 50
/** quantas temporadas a mais ganha quem já estava acima da 50 quando a regra chegou */
export const CARREIRA_GRATIS_EXTRA = 10

/** a última temporada que a carreira grátis joga (no fim dela, a virada trava) */
export function limiteGratis(seasonNo: number | undefined, gratisAte?: number | null): number {
  const t = seasonNo ?? 1
  if (gratisAte != null) return gratisAte
  return t > CARREIRA_GRATIS_ATE ? t + CARREIRA_GRATIS_EXTRA : CARREIRA_GRATIS_ATE
}

/** true = sem plano, no fim da última temporada grátis: a virada fica trancada até assinar qualquer plano */
export function travaCarreiraGratis(seasonNo: number | undefined, pagante: boolean, gratisAte?: number | null): boolean {
  return !pagante && (seasonNo ?? 1) >= limiteGratis(seasonNo, gratisAte)
}

/** o que gravar no save na virada sem plano: quem já estava acima da 50 sem marca ganha a marca (+10 a partir de agora) */
export function marcaGratis(seasonNo: number | undefined, pagante: boolean, gratisAte?: number | null): number | undefined {
  if (pagante || gratisAte != null) return gratisAte ?? undefined
  const t = seasonNo ?? 1
  return t > CARREIRA_GRATIS_ATE ? t + CARREIRA_GRATIS_EXTRA : undefined
}
