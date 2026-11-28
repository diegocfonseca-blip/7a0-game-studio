/** Cache curto, pertencente a um único conjunto de entradas da temporada.
 * O chamador recria a função quando muda elenco, plano, decisões ou temporada.
 * Não guarda temporadas globalmente nem altera o que a simulação calcula. */
export function memoizaPorRodada<T>(calcular: (rodada: number) => T, limite = 6): (rodada: number) => T {
  const cache = new Map<number, T>()
  return rodada => {
    if (cache.has(rodada)) {
      const valor = cache.get(rodada)!
      cache.delete(rodada); cache.set(rodada, valor)
      return valor
    }
    const valor = calcular(rodada)
    cache.set(rodada, valor)
    if (cache.size > Math.max(1, limite)) cache.delete(cache.keys().next().value!)
    return valor
  }
}
