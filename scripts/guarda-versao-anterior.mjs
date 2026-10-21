// ─── 🗄️ PUBLICAR SEM DERRUBAR QUEM ESTÁ JOGANDO (21/10) ─────────────────────────
//
// Roda no deploy (`.github/workflows/deploy.yml`), DEPOIS de montar a versão nova e ANTES de subir.
//
// Por quê: cada publicação troca o nome dos arquivos do jogo (`assets/salao-XXXX.js`) e o site novo
// não tinha mais os velhos. Quem estava com o jogo aberto (no meio de uma sala!) caía ao abrir um
// pedaço que carrega na hora. Foi o que bagunçou a sala de duplas do Futpoint em 21/10 (13 pessoas,
// ao vivo, duas publicações seguidas). E o Diego mandou: *"não quero mais que publicando coisa nova
// faça atualizar a página sozinho… só atualiza se ele atualizar mesmo manualmente"*.
//
// O que faz: lê o site QUE ESTÁ NO AR, descobre todos os arquivos que a versão de agora usa (seguindo
// o index.html e os .js), e copia pra versão nova os que ela não tem. Também carrega os que já
// estavam guardados de publicações anteriores, por até 3 dias. Assim quem abriu o jogo antes segue
// jogando na versão dele até atualizar por conta própria.
//
// 🛟 Nunca reprova a publicação: se o site não responder, a versão nova sobe do mesmo jeito (só sem
// os arquivos velhos — o mesmo de antes deste script).
//
//   node scripts/guarda-versao-anterior.mjs https://leilaolegends.com/ final-dist
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [, , siteArg, distArg] = process.argv
const DIAS = 3
const MAX_BYTES = 400 * 1024 * 1024 // trava de segurança: nunca baixar mais que isso
const LISTA = 'assets-mantidos.json'

async function baixa(url, comoTexto) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 20_000)
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' })
    if (!r.ok) return null
    return comoTexto ? await r.text() : Buffer.from(await r.arrayBuffer())
  } catch { return null } finally { clearTimeout(t) }
}

async function principal() {
  if (!siteArg || !distArg) { console.log('uso: guarda-versao-anterior.mjs <site> <pasta>'); return }
  const site = siteArg.endsWith('/') ? siteArg : siteArg + '/'
  const pasta = join(distArg, 'assets')
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true })
  const agora = Date.now()

  // 1. o que já vinha guardado (com a data em que saiu do ar)
  const antes = new Map()
  try {
    const txt = await baixa(site + LISTA, true)
    for (const x of JSON.parse(txt ?? '[]')) if (x && typeof x.f === 'string' && typeof x.t === 'number') antes.set(x.f, x.t)
  } catch { /* primeira vez ou lista ruim: segue */ }

  // 2. os arquivos da versão que está no ar AGORA (index.html → .js → .js…)
  const achados = new Set()
  const fila = []
  const html = await baixa(site + 'index.html', true)
  const pegaRefs = (txt, deAssets) => {
    for (const m of txt.matchAll(/assets\/([\w.-]+\.[a-z0-9]+)/gi)) achados.has(m[1]) || (achados.add(m[1]), fila.push(m[1]))
    if (deAssets) for (const m of txt.matchAll(/["'`]\.\/([\w.-]+\.(?:js|css))["'`]/g)) achados.has(m[1]) || (achados.add(m[1]), fila.push(m[1]))
  }
  if (html) pegaRefs(html, false)
  const textos = new Map()
  for (let i = 0; i < fila.length && i < 3000; i++) {
    const f = fila[i]
    if (!/\.(js|css)$/.test(f)) continue
    const txt = await baixa(site + 'assets/' + f, true)
    if (txt == null) continue
    textos.set(f, txt)
    pegaRefs(txt, true)
  }

  // 3. o que guardar: a versão de agora + os guardados com menos de 3 dias, tirando o que a nova já tem
  const guardar = new Map()
  for (const f of achados) guardar.set(f, antes.get(f) ?? agora)
  for (const [f, t] of antes) if (agora - t < DIAS * 86_400_000 && !guardar.has(f)) guardar.set(f, t)
  let bytes = 0, copiados = 0
  const lista = []
  for (const [f, t] of guardar) {
    const destino = join(pasta, f)
    if (existsSync(destino)) continue // a versão nova tem o mesmo arquivo (mesmo conteúdo, mesmo nome)
    const dado = textos.has(f) ? Buffer.from(textos.get(f)) : await baixa(site + 'assets/' + f, false)
    if (!dado) continue
    if (bytes + dado.length > MAX_BYTES) break
    writeFileSync(destino, dado)
    bytes += dado.length; copiados++
    lista.push({ f, t })
  }
  writeFileSync(join(distArg, LISTA), JSON.stringify(lista))
  console.log(`🗄️ ${site}: ${copiados} arquivos da(s) versão(ões) anterior(es) mantidos (${(bytes / 1048576).toFixed(1)} MB)`)
}

principal().catch(e => console.log('🗄️ não deu pra guardar a versão anterior (a publicação segue):', e?.message ?? e))
