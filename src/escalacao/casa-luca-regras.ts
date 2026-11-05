// 💙 CASA LUCA · regras PURAS (05/11). Testadas em `npm run casa-luca` (scripts/testa-casa-luca.mts).
// Quem COBRA é o servidor: o desconto do Plano Coração sai do `vendria-checkout` (mesma conta de `precoCoracaoCentavos`) e o valor
// da doação sai do `esc_mp_preco_ref` (mesma faixa de DOACAO_MIN/DOACAO_MAX). Aqui é só o que a TELA mostra e manda.
import { MENSAIS } from './planos-regras'

/** 💙 Plano Coração = 50% em TODOS os planos mensais, enquanto a pessoa pagar */
export const CORACAO_DESCONTO = 0.5
/** metade do preço, em centavos (990 → 495 · 1490 → 745) — IGUAL à do `vendria-checkout` */
export const precoCoracaoCentavos = (centavos: number): number => Math.round(centavos * (1 - CORACAO_DESCONTO))
/** o preço do mês em reais pra quem tem (ou não) o Plano Coração */
export function precoMensal(plano: keyof typeof MENSAIS, coracao: boolean): number {
  const c = Math.round(MENSAIS[plano].preco * 100)
  return (coracao ? precoCoracaoCentavos(c) : c) / 100
}

/** 💙 doação: botões prontos + "outro valor" (mínimo R$ 2; teto R$ 1.000 só pra pegar dedo errado) — IGUAL ao banco */
export const DOACAO_VALORES = [5, 10, 20] as const
export const DOACAO_MIN = 2
export const DOACAO_MAX = 1000
/** lê o "outro valor" digitado ("7", "7,50", "R$ 12.5") → reais com 2 casas, ou null se não vale */
export function valorDoacao(txt: string): number | null {
  const limpo = String(txt ?? '').replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null
  const v = Math.round(Number(limpo) * 100) / 100
  return v >= DOACAO_MIN && v <= DOACAO_MAX ? v : null
}
/** a ref que vai pro Pix: 'v' + centavos ('v500' = R$ 5). O banco confere a faixa e devolve o preço. */
export const refDoacao = (reais: number): string => 'v' + Math.round(reais * 100)
export function reaisDaRef(ref: string): number | null {
  const m = /^v(\d{3,6})$/.exec(ref)
  if (!m) return null
  const c = Number(m[1])
  return c >= DOACAO_MIN * 100 && c <= DOACAO_MAX * 100 ? c / 100 : null
}

/** 🧱 mural: só NOME + DATA. Qualquer outro campo que viesse do banco é jogado fora aqui (nada de valor, total ou contagem). */
export type LinhaMural = { nome: string; criado_em: string }
export function muralParaTela(linhas: unknown): LinhaMural[] {
  if (!Array.isArray(linhas)) return []
  return linhas
    .map(l => ({ nome: String((l as LinhaMural)?.nome ?? '').trim(), criado_em: String((l as LinhaMural)?.criado_em ?? '') }))
    .filter(l => l.nome.length >= 2 && !Number.isNaN(Date.parse(l.criado_em)))
    .sort((a, b) => Date.parse(b.criado_em) - Date.parse(a.criado_em))
}
/** o mural só aparece com pelo menos 1 nome */
export const muralAparece = (linhas: LinhaMural[]): boolean => linhas.length > 0
/** o nome que a pessoa escolhe pro mural: sem emoji/link, até 30 letras (o banco confere de novo) */
export function nomeMural(txt: string): string | null {
  const n = String(txt ?? '').replace(/[\p{Extended_Pictographic}‍️⁡-⁤⁪-⁯]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30)
  if (n.length < 2 || /(https?:|www\.|\.com|\.br|@)/i.test(n)) return null
  return n
}
