export async function load(url, context, next) {
  if (/\.(webp|png|jpg|jpeg|svg|gif|mp3|css|woff2?)(\?.*)?$/.test(url)) return { format: 'module', source: `export default ${JSON.stringify(url)}`, shortCircuit: true }
  const r = await next(url, context)
  if (url.includes('/src/') && r.source) {
    const src = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8')
    if (src.includes('import.meta.env')) return { ...r, source: src.replaceAll('import.meta.env', '(globalThis.__IMEnv)') }
  }
  return r
}
