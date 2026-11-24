/** Referência do atleta, independente da taxa de contratação. Só Brasil Oficial. */
export type AtletaEconomico = { lo: number; hi: number; fame?: number; promessa?: boolean; calibracaoCarreira?: {versao:number} }
export function referenciaAtleta(c: AtletaEconomico): number {
  const categoria = (c.fame ?? 1) >= 5 ? 30 : c.promessa ? 12 : c.fame === 4 ? 20 : (c.fame ?? 1) >= 2 ? 8 : 3
  const nivel = (c.lo + c.hi) / 2
  return Math.max(categoria, Math.round(Math.pow(Math.max(0, nivel - 40) / 10, 1.55) * 3.2 * 1.15))
}
export function salarioReferencia(valor: number): number { return Math.max(1, Math.round(valor / 10)) }

/** Mesma leitura para loja/patrocínio: só queda REAL pode ser chamada rebaixamento. */
export function faixaCampanha(pos: number, total: number, div: string, proxima?: string): 'campeao' | 'acesso' | 'manteve' | 'caiu' {
  const ordem = ['V', 'D', 'C', 'B', 'A']
  if (pos === 1) return 'campeao'
  if (proxima && proxima !== div) return ordem.indexOf(proxima) > ordem.indexOf(div) ? 'acesso' : 'caiu'
  if (proxima) return 'manteve'
  // Fallback só para telas sem resultado oficial; D nunca tem queda nesse formato.
  if (div === 'D' || div === 'V' || total !== 20) return 'manteve'
  return pos >= 17 ? 'caiu' : pos <= 4 ? 'acesso' : 'manteve'
}

/** Normaliza avaliação por tamanho da tabela, sem confundir 17/96 com 17/20. */
export function posicaoComparavel(pos: number, total: number): number {
  return total <= 1 ? 1 : Math.min(20, Math.max(1, Math.ceil(pos * 20 / total)))
}
