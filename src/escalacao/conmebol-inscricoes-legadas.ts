// Compatibilidade de inscrições JÁ COMPLETAS de uma temporada em andamento.
// Não há simulador nem repescagem aqui: listas incompletas são recusadas pelo
// seletor e reparadas com as novas inscrições ANTES de gerar qualquer partida.
import { ESTRANGEIROS_LIBERTA_2026, ESTRANGEIROS_SULA_2026 } from './conmebol-clubes'
import { BRASILEIROS_LIBERTA_2026, type VagasLiberta } from './libertadores-oficial'
import { BRASILEIROS_SULA_2026, type VagasSula } from './sul-americana-oficial'
export function vagasLibertaLegadas(anterior: { serieA: string[]; copa: string; copaVice: string; liberta?: string; sula?: string } | null, paisDe: Record<string, string> = {}): VagasLiberta {
  const pais: Record<string, string> = {}
  for (const e of ESTRANGEIROS_LIBERTA_2026) pais[e.nome] = e.pais
  const estr = ESTRANGEIROS_LIBERTA_2026.map(e => ({ ...e }))
  if (!anterior) {
    for (const n of [...BRASILEIROS_LIBERTA_2026.grupos, ...BRASILEIROS_LIBERTA_2026.fase2]) pais[n] = 'BRA'
    return { grupos: [...BRASILEIROS_LIBERTA_2026.grupos, ...estr.filter(e => e.fase === 'grupos').map(e => e.nome)], fase2: [...BRASILEIROS_LIBERTA_2026.fase2, ...estr.filter(e => e.fase === 'fase2').map(e => e.nome)], fase1: estr.filter(e => e.fase === 'fase1').map(e => e.nome), pais }
  }
  // a vaga do campeão da Sul-Americana (a do Lanús em 2026)
  let sulaBR: string | null = null
  if (anterior.sula && anterior.sula !== 'Lanús') {
    const iL = estr.findIndex(e => e.nome === 'Lanús')
    if (iL >= 0) estr.splice(iL, 1)
    const ja = estr.some(e => e.nome === anterior.sula)
    if (!ja && paisDe[anterior.sula]) { estr.push({ nome: anterior.sula, pais: paisDe[anterior.sula], fase: 'grupos' }); pais[anterior.sula] = paisDe[anterior.sula] }
    else if (!ja) sulaBR = anterior.sula
  }
  const campEstr = anterior.liberta ? estr.find(e => e.nome === anterior.liberta) : undefined
  const campBR = anterior.liberta && !campEstr ? anterior.liberta : null
  if (campEstr && campEstr.fase !== 'grupos') {
    // ⚠️ INCERTO (acima): o campeão estrangeiro sobe e o último do país dele nos grupos desce pra fase dele
    const troca = [...estr].reverse().find(e => e.pais === campEstr.pais && e.fase === 'grupos')
    if (troca) troca.fase = campEstr.fase
    campEstr.fase = 'grupos'
  }
  const nGrupos = 5 + (campBR ? 1 : 0) + (sulaBR ? 1 : 0), nFase2 = 2 // campeão da Copa + G4 (+ a extra do campeão brasileiro) · 5º e vice da Copa
  const ordem = [...(campBR ? [campBR] : []), ...(sulaBR ? [sulaBR] : []), anterior.copa, ...anterior.serieA]
  const G: string[] = []
  for (const n of ordem) { if (G.length >= nGrupos) break; if (n && !G.includes(n)) G.push(n) }
  const F2: string[] = []
  if (anterior.copaVice && !G.includes(anterior.copaVice)) F2.push(anterior.copaVice)
  for (const n of anterior.serieA) { if (F2.length >= nFase2) break; if (!G.includes(n) && !F2.includes(n)) F2.push(n) }
  for (const n of [...G, ...F2]) pais[n] = 'BRA'
  return { grupos: [...G, ...estr.filter(e => e.fase === 'grupos').map(e => e.nome)], fase2: [...F2, ...estr.filter(e => e.fase === 'fase2').map(e => e.nome)], fase1: estr.filter(e => e.fase === 'fase1').map(e => e.nome), pais }
}

export function vagasSulaLegadas(serieA: string[] | null, naLiberta: readonly string[]): VagasSula {
  const pais: Record<string, string> = {}
  for (const e of ESTRANGEIROS_SULA_2026) pais[e.nome] = e.pais
  const br = serieA ? serieA.filter(n => !naLiberta.includes(n)).slice(0, 6) : BRASILEIROS_SULA_2026
  for (const n of br) pais[n] = 'BRA'
  const est = ESTRANGEIROS_SULA_2026.filter(e => !naLiberta.includes(e.nome))
  return { grupos: [...br, ...est.filter(e => e.fase === 'grupos').map(e => e.nome)], fase1: est.filter(e => e.fase === 'fase1').map(e => e.nome), pais }
}
