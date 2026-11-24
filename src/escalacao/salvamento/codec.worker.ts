/// <reference lib="webworker" />
// Fora da renderização: serialização, compressão e comparação de saves grandes.
function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k, x]) => k !== '_saveSync' && k !== '_ll' && x !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, x]) => [k, canonical(x)]))
  return v
}
self.onmessage = async ({ data }) => {
  try {
    if (data.op === 'encode') {
      const json = JSON.stringify(data.save)
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical(data.save))))), n => n.toString(16).padStart(2, '0')).join('')
      const raw = new Blob([json], { type: 'application/json' })
      const gzip = typeof CompressionStream !== 'undefined'
      const blob = gzip ? await new Response(raw.stream().pipeThrough(new CompressionStream('gzip'))).blob() : raw
      self.postMessage({ id: data.id, result: { blob, digest, gzip, rawBytes: raw.size } })
    } else {
      const stream = data.gzip ? data.blob.stream().pipeThrough(new DecompressionStream('gzip')) : data.blob.stream()
      self.postMessage({ id: data.id, result: JSON.parse(await new Response(stream).text()) })
    }
  } catch (e) { self.postMessage({ id: data.id, error: String(e) }) }
}
export {}
