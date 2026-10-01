import type { InternationalHistoryEntry } from './career-international-season'

export type InternationalTitleCounts = {
  mundial_titles: number
  libertadores_titles: number
  champions_titles: number
}

/** Um resultado encerrado por temporada. O snapshot da T seguinte não antecipa títulos. */
export function internationalTitleCounts(
  history: readonly InternationalHistoryEntry[] | undefined,
  throughSeason: number,
): InternationalTitleCounts {
  const counts: InternationalTitleCounts = { mundial_titles: 0, libertadores_titles: 0, champions_titles: 0 }
  const seen = new Set<number>()
  for (const entry of history ?? []) {
    if (!Number.isInteger(entry.season) || entry.season < 40 || entry.season > throughSeason || seen.has(entry.season)) continue
    seen.add(entry.season)
    if (entry.mundial === 1) counts.mundial_titles++
    if (entry.libertadores === 1) counts.libertadores_titles++
    if (entry.champions === 1) counts.champions_titles++
  }
  return counts
}
