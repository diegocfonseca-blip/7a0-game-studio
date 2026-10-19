// ─── 🧑‍💼 PEÇAS AVULSAS DO PRESIDENTE (19/10, Diego: "ok pode fazer tudo nisso já pelo pix do mercado pago") ─────────
//
// Regra fechada com ele:
//  · Cada peça tem o PREÇO DO NÍVEL dela: ⭐ Craque R$ 1,99 · 👑 Lenda R$ 2,99 · 🖋 Batismo R$ 3,99 · 🖋 Fundador R$ 4,99.
//    (Ele liberou a peça do Fundador a 4,99 no avulso — antes ela era só do plano.)
//  · Quem tem plano compra as peças dos planos ACIMA do seu; as do seu plano pra baixo já são dele.
//  · 🆓 GRÁTIS não tem boneco. A 1ª compra TEM que ser uma ROUPA: comprou, ganha o boneco junto — careca, sem barba, sem
//    acessório e com o tom de pele que quiser (de graça). Depois compra cabelo, barba e acessório um por um (nível Craque).
//  · Quem confere o preço e entrega a peça é o BANCO (`esc_mp_preco_ref` / `esc_mp_entregar`, produto `peca_presidente`):
//    a peça só aparece depois que o Pix CAI. A tela lê as MESMAS regras daqui (regra de ouro contra botão mudo).
//
// Ref de cada peça no Pix: `r-<roupa>` (roupa modular) · `p-<peça>` (cabelo/barba/acessório).
import { VESTUARIO_MODULAR, roupaModularValida, type RoupaModular } from './presidente-vestuario-modular'
import { REGRA_ROUPA_MODULAR } from './presidente-vestuario-acesso'
import { PRESIDENTE_ROUPAS } from './presidente-roupas'
import { PECAS_PRESIDENTE } from './presidente-pecas'
import { DEGRAU_ROUPA, degrauDoPlano, type AcessoRoupa } from './presidente-plano'
import type { PlanoUnico } from './planos-regras'

export const PRECO_NIVEL: Record<1 | 2 | 3 | 4, number> = { 1: 1.99, 2: 2.99, 3: 3.99, 4: 4.99 }
export const refRoupa = (id: string) => `r-${id}`
export const refPeca = (id: string) => `p-${id}`

/** o nível (1..4) de uma roupa modular, pelo catálogo de acesso */
export function nivelRoupa(id: RoupaModular): 1 | 2 | 3 | 4 {
  const acc = PRESIDENTE_ROUPAS.find(r => r.id === REGRA_ROUPA_MODULAR[id])?.access as AcessoRoupa | undefined
  return (acc ? DEGRAU_ROUPA[acc] : 1) as 1 | 2 | 3 | 4
}
/** todas as peças vendáveis, com o nível — é daqui que sai o catálogo do banco */
export function catalogoAvulsas(): { ref: string; nivel: 1 | 2 | 3 | 4 }[] {
  return [
    ...VESTUARIO_MODULAR.map(r => ({ ref: refRoupa(r.id), nivel: nivelRoupa(r.id) })),
    ...PECAS_PRESIDENTE.filter(p => p.ready).map(p => ({ ref: refPeca(p.id), nivel: 1 as const })),
  ]
}

/** o que a conta tem: plano + peças compradas (refs) */
export type PosseAvulsa = { plano: PlanoUnico | null | undefined; compradas: readonly string[] }
export const temBoneco = (p: PosseAvulsa) => degrauDoPlano(p.plano) >= 1 || p.compradas.some(r => r.startsWith('r-'))
export function podeVestirRoupaAvulsa(id: RoupaModular, p: PosseAvulsa): boolean {
  return degrauDoPlano(p.plano) >= nivelRoupa(id) || p.compradas.includes(refRoupa(id))
}
/** aceita o plano sozinho (código velho) ou a posse inteira */
export function posseDe(x: PosseAvulsa | PlanoUnico | null | undefined): PosseAvulsa {
  return x && typeof x === 'object' ? x : { plano: x ?? null, compradas: [] }
}
/** pode vestir essa roupa (válida) com o que tem? — a régua da carreira, da Loja e do sorteio */
export function podeVestirComPosse(id: unknown, x: PosseAvulsa | PlanoUnico | null | undefined): id is RoupaModular {
  return roupaModularValida(id) && podeVestirRoupaAvulsa(id, posseDe(x))
}
/** peça do rosto: quem tem plano já tem todas; grátis só a que comprou ('none' = careca/sem barba, sempre pode com boneco) */
export function podeUsarPecaAvulsa(id: string, p: PosseAvulsa): boolean {
  if (id === 'none') return temBoneco(p)
  return degrauDoPlano(p.plano) >= 1 || p.compradas.includes(refPeca(id))
}
/** tom de pele: de graça pra quem tem boneco */
export const podeEscolherPele = (p: PosseAvulsa) => temBoneco(p)
/** pode comprar essa peça? (já tem = não; peça do rosto sem boneco = primeiro a roupa) */
export function compraPossivel(ref: string, p: PosseAvulsa): { ok: true; preco: number } | { ok: false; motivo: 'ja_tem' | 'roupa_primeiro' | 'invalida' } {
  const item = catalogoAvulsas().find(c => c.ref === ref)
  if (!item) return { ok: false, motivo: 'invalida' }
  if (p.compradas.includes(ref) || degrauDoPlano(p.plano) >= item.nivel) return { ok: false, motivo: 'ja_tem' }
  if (ref.startsWith('p-') && !temBoneco(p)) return { ok: false, motivo: 'roupa_primeiro' }
  return { ok: true, preco: PRECO_NIVEL[item.nivel] }
}
