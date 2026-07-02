import { useState, useEffect } from 'react'

const cache = new Map<string, string | null>()

export function useWikiPhoto(wikiTitle: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    wikiTitle && cache.has(wikiTitle) ? (cache.get(wikiTitle) ?? null) : null
  )

  useEffect(() => {
    if (!wikiTitle) return
    if (cache.has(wikiTitle)) {
      setUrl(cache.get(wikiTitle) ?? null)
      return
    }

    const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`

    fetch(endpoint)
      .then(r => (r.ok ? r.json() : null))
      .then((data: { thumbnail?: { source: string } } | null) => {
        const imgUrl = data?.thumbnail?.source ?? null
        cache.set(wikiTitle, imgUrl)
        setUrl(imgUrl)
      })
      .catch(() => {
        cache.set(wikiTitle, null)
        setUrl(null)
      })
  }, [wikiTitle])

  return url
}
