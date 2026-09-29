// ─── 🛡️ ESCUDOS OFICIAIS DO LEILÃO DE CLUBES ─────────────────────────────────
//
// Diego (28/09): *"faz oficial mesmo"* — e *"é melhor pegar na internet e botar…
// aquele webp, que fica menor"*. Avisei do risco de marca registrada (escudo é marca
// do clube) e a decisão foi dele. Se algum clube reclamar, basta apagar o arquivo do
// clube em `public/escudos-clubes/` (e a linha em `escudos-oficiais.ts`): ele volta
// sozinho pro selo estilo B.
//
// De onde vêm (a rede desta máquina só alcança GitHub e npm):
//   · Europa  → github.com/luukhopman/football-logos (PNG, temporada atual + histórico)
//   · Brasil e América do Sul → npm `football-badges` (SVG, MIT) e
//     npm `react-brasileirao-logos` (SVG em React, ISC)
//   · EUA → npm `mls-team-logos` (SVG em React, ISC)
// Clube sem escudo em nenhuma das três fica no selo estilo B (nada quebra).
//
// Saída: `public/escudos-clubes/<slug>.webp` (160 px no lado maior, recortado no
// desenho) — fica FORA do bundle, só baixa pra quem vê o clube — e o índice
// `src/escalacao/escudos-oficiais.ts` com a proporção real de cada arquivo.
//
// uso: node scripts/escudos-oficiais.mjs [--fontes pasta-de-trabalho]
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const FONTES = path.resolve(arg('--fontes', '/tmp/escudos-fontes'))
const SAIDA = 'public/escudos-clubes'
mkdirSync(FONTES, { recursive: true }); mkdirSync(SAIDA, { recursive: true })

// ── 1. baixa as fontes (uma vez) ──
const LUUK = path.join(FONTES, 'logos-luuk')
if (!existsSync(LUUK)) execSync(`git clone -q --depth 1 https://github.com/luukhopman/football-logos "${LUUK}"`, { stdio: 'inherit' })
const npmPack = (nome, pasta) => {
  const dst = path.join(FONTES, pasta)
  if (existsSync(path.join(dst, 'package'))) return path.join(dst, 'package')
  mkdirSync(dst, { recursive: true })
  const tgz = execSync(`npm pack ${nome} --silent`, { cwd: dst }).toString().trim().split('\n').pop()
  execSync(`tar xzf "${tgz}"`, { cwd: dst })
  return path.join(dst, 'package')
}
const FB = npmPack('football-badges@0.1.3', 'football-badges')
const RB = npmPack('react-brasileirao-logos@1.0.4', 'react-brasileirao')
const MLS = npmPack('mls-team-logos@1.6.0', 'mls-team-logos') // 🇺🇸 Orlando City (ISC)
// 🌍 catálogo do npm `football-logos` (MIT): só a LISTA (país/slug/hash); a imagem mora em
// assets.football-logos.cc — que a rede desta máquina NÃO alcança hoje (28/09). O script já
// tenta: no dia em que o host for liberado, é só rodar de novo e os que faltam entram.
// 🔎 28/09 (Diego: "pesquise os que faltam na internet e bote"): mais 3 acervos do GitHub
//   · FCLOGO/fclogo.top (PNG em alta, várias versões por clube) — River, Vélez, Al Ahly, Al-Hilal,
//     Al-Nassr, Yokohama Marinos, Pohang, Suwon
//   · hugomiura/escudos-times-brasil-svg (SVG das Séries A/B) — Sport, Náutico, Santa Cruz, Ponte Preta
//   · sportlogos/football.db.logos (PNG/GIF menores) — os mexicanos, Stoke, Atlético Nacional,
//     Alianza Lima, U. de Chile
const clonaSem = (repo, pasta, cheio = false) => { const d = path.join(FONTES, pasta); if (!existsSync(d)) execSync(`git clone -q --depth 1 ${cheio ? '' : '--filter=blob:none --no-checkout'} https://github.com/${repo} "${d}"`, { stdio: 'inherit' }); return d }
const FCL = clonaSem('FCLOGO/fclogo.top', 'fclogo'), SPL = clonaSem('sportlogos/football.db.logos', 'sportlogos'), HUGO = clonaSem('hugomiura/escudos-times-brasil-svg', 'hugo', true)
const doGit = (repo, arq) => { const dst = path.join(FONTES, 'git-' + arq.replace(/[^a-zA-Z0-9.]+/g, '_')); if (!existsSync(dst)) writeFileSync(dst, execSync(`git -C "${repo}" show "HEAD:${arq}"`, { maxBuffer: 64 << 20 })); return dst }
const hugoSvg = id => { for (const f of ['serie-a.svg', 'serie-b.svg']) { const t = readFileSync(path.join(HUGO, f), 'utf8'); const m = t.match(new RegExp(`<symbol viewBox="([^"]+)" id="${id}">([\\s\\S]*?)</symbol>`)); if (m) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m[1]}">${m[2]}</svg>` } return null }
const FLC = npmPack('football-logos@0.4.0', 'football-logos')
const flIdx = new Map()
for (const f of readdirSync(path.join(FLC, 'catalog/v1/countries'))) { const c = JSON.parse(readFileSync(path.join(FLC, 'catalog/v1/countries', f), 'utf8')).country; for (const [slug, cl] of Object.entries(c.clubs ?? {})) flIdx.set(`${c.slug}/${slug}`, cl.hash) }
const flBaixa = (chave) => { const h = flIdx.get(chave); if (!h) return null; const [pais, slug] = chave.split('/'); const dst = path.join(FONTES, 'fl-' + slug + '.png'); if (existsSync(dst)) return dst
  try { execSync(`curl -sSf -m 20 -o "${dst}" "https://assets.football-logos.cc/logos/${pais}/512x512/${slug}.${h}.png"`, { stdio: 'ignore' }); return dst } catch { return null } }
if (!existsSync(path.join(MLS, 'node_modules'))) execSync(`ln -s "${path.resolve('node_modules')}" "${path.join(MLS, 'node_modules')}"`)
// o pacote pede `react` de dentro da pasta dele: aponta pro React do próprio jogo
if (!existsSync(path.join(RB, 'node_modules'))) execSync(`ln -s "${path.resolve('node_modules')}" "${path.join(RB, 'node_modules')}"`)

// PNGs da Europa: o arquivo MAIS NOVO com aquele nome (logos/ ganha do histórico)
const pngs = new Map()
const anda = (d, prio) => { for (const f of readdirSync(d)) { const p = path.join(d, f); if (statSync(p).isDirectory()) anda(p, prio); else if (f.endsWith('.png')) { const n = f.slice(0, -4); const velho = pngs.get(n); if (!velho || velho.prio < prio) pngs.set(n, { p, prio }) } } }
for (const s of readdirSync(path.join(LUUK, 'history')).sort()) anda(path.join(LUUK, 'history', s), Number(s.slice(0, 4)))
anda(path.join(LUUK, 'logos'), 9999)

// SVG do react-brasileirao: renderiza o componente pra texto
const req = createRequire(path.resolve('package.json'))
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server')
const rbSvg = code => { const m = req(path.join(RB, 'dist/Icons', `${code}.js`)); const C = m[code.toUpperCase()]; return renderToStaticMarkup(React.createElement(C, { size: 400 })) }

// ── 2. o mapa: chave do jogo (clubCanon) → de onde vem ──
// football-badges guarda por país: badges/<país>/<nome>.svg
const fbSvgs = new Map()
for (const pais of readdirSync(path.join(FB, 'badges'))) { const d = path.join(FB, 'badges', pais); if (statSync(d).isDirectory()) for (const f of readdirSync(d)) if (f.endsWith('.svg')) fbSvgs.set(f.slice(0, -4), path.join(d, f)) }
const mlsSvg = code => { const m = req(path.join(MLS, 'dist/logos', `${code}.js`)); const C = m.default ?? Object.values(m).find(v => typeof v === 'function'); return renderToStaticMarkup(React.createElement(C, { size: 400, width: 400, height: 400 })) }
const U = c => ({ svg: () => mlsSvg(c) }), W = c => ({ fl: c })
const C = a => ({ git: [FCL, 'src/data/logos/' + a] }), S = a => ({ git: [SPL, a] }), H = id => ({ svg: () => hugoSvg(id) })
const E = n => ({ png: n }), F = n => ({ svgFile: fbSvgs.get(n) ?? '', n }), R = c => ({ svg: () => rbSvg(c) })
const MAPA = {
  // 🇧🇷
  'Flamengo': F('flamengo'), 'Palmeiras': F('palmeiras'), 'Corinthians': F('corinthians'), 'São Paulo': F('sao-paulo'),
  'Santos': F('santos'), 'Vasco': F('vasco-da-gama'), 'Fluminense': F('fluminense'), 'Botafogo': F('botafogo'),
  'Grêmio': F('gremio'), 'Internacional': F('internacional'), 'Atlético-MG': F('atletico-mineiro'), 'Cruzeiro': F('cruzeiro'),
  'América-MG': R('ame'), 'Bahia': F('bahia'), 'Vitória': F('vitoria'), 'Ceará': R('cea'), 'Fortaleza': R('for'),
  'Athletico-PR': F('athletico-paranaense'), 'Coritiba': F('coritiba'), 'Goiás': R('goi'), 'Chapecoense': F('chapecoense'),
  'Bragantino': F('rb-bragantino'),
  // 🌎
  // 🌍 Lote 38 (29/09): clubes do Mundo que viraram pacote no Leilão de Clubes
  'Inter Miami': U('mia'), 'LA Galaxy': U('lag'), 'Toronto': U('tor'),
  'Al-Ittihad': C('SAFF/clubs/08-Al-Ittihad/png/Ittihad-Saudi-Arabian-Club-v2015.png'), 'Al-Ahli': C('SAFF/clubs/01-Al-Ahli/png/Al-Ahli-v2025.png'),
  'Vissel Kobe': C('JFA/clubs/001_Vissel Kobe/png/vissel-kobe-v2005.png'), 'Kashima Antlers': C('JFA/clubs/010_Kashima Antlers/png/kashima-antlers-v1992.png'),
  'Guangzhou': C('CFA/clubs/001-100/Guangzhou FC/png/guangzhoufc-v2015.png'),
  'Boca Juniors': F('boca-juniors'), 'Orlando City': U('orl'), 'Barcelona SC': F('barcelona-sc'), 'LDU Quito': F('liga-de-quito'), 'Sporting Cristal': F('sporting-cristal'),
  // 🔎 acervos do GitHub
  'Sport': H('sport'), 'Náutico': H('nautico'), 'Santa Cruz': H('santa-cruz'), 'Ponte Preta': H('ponte-preta'),
  'River Plate': C('AFA/clubs/002_River Plate/png/Club-Atletico-River-Plate-v2022.png'), 'Vélez Sarsfield': C('AFA/clubs/030_Vélez/png/Club-Atletico-Velez-Sarsfield-v0000.png'),
  'Al Ahly': C('EFA/clubs/001_Al Ahly SC/png/Al-Ahly-SC-v2023.png'), 'Al-Hilal': C('SAFF/clubs/06-Al Hilal/png/al-hilal-saudi-v2022.png'),
  'Al-Nassr': C('SAFF/clubs/11-Al-Nassr/png/Al-Nassr-v2020.png'), 'Yokohama F. Marinos': C('JFA/clubs/002_Yokohama Marinos/png/yokohama-marinos-v1999.png'),
  'Pohang Steelers': C('KFA/clubs/002_Pohang Steelers/png/fc-pohang-steelers-v2003.png'), 'Suwon': C('KFA/clubs/018-Suwon Samsung/png/suwon-samsung-bluewings-v0000.png'),
  'América do México': S('north-america/mx-mexico/america.gif'), 'Chivas': S('north-america/mx-mexico/chivas.gif'), 'Cruz Azul': S('north-america/mx-mexico/cruzazul.gif'),
  'Necaxa': S('north-america/mx-mexico/necaxa.gif'), 'Pumas': S('north-america/mx-mexico/pumas.gif'), 'Tigres': S('north-america/mx-mexico/tigres.gif'),
  'Toluca': S('north-america/mx-mexico/toluca.gif'), 'Stoke City': S('europe/en-england/stoke.png'), 'Atlético Nacional': S('south-america/co-colombia/atleticonacional.png'),
  'Alianza Lima': S('south-america/pe-peru/alianzalima.gif'), 'U. de Chile': S('south-america/cl-chile/udechile.gif'),
  // 🌍 football-logos.cc (baixa quando o host estiver liberado)
  'Bangu': W('brazil/bangu'), 'Blackburn': W('england/blackburn-rovers'), 'América de Cali': W('colombia/america-de-cali'),
  // 🇪🇺
  'Real Madrid': E('Real Madrid'), 'Barcelona': E('FC Barcelona'), 'Atlético de Madrid': E('Atlético de Madrid'), 'Sevilla': E('Sevilla FC'),
  'Valencia': E('Valencia CF'), 'Villarreal': E('Villarreal CF'), 'Real Betis': E('Real Betis Balompié'), 'Real Sociedad': E('Real Sociedad'),
  'Espanyol': E('RCD Espanyol Barcelona'), 'Granada': E('Granada CF'),
  'Man United': E('Manchester United'), 'Man City': E('Manchester City'), 'Liverpool': E('Liverpool FC'), 'Chelsea': E('Chelsea FC'),
  'Arsenal': E('Arsenal FC'), 'Tottenham': E('Tottenham Hotspur'), 'Newcastle': E('Newcastle United'), 'Aston Villa': E('Aston Villa'),
  'Everton': E('Everton FC'), 'West Ham': E('West Ham United'), 'Leicester': E('Leicester City'), 'Nottingham Forest': E('Nottingham Forest'),
  'Fulham': E('Fulham FC'), 'Wolves': E('Wolverhampton Wanderers'), 'Celtic': E('Celtic FC'), 'Rangers': E('Rangers FC'),
  'Milan': E('AC Milan'), 'Inter': E('Inter Milan'), 'Juventus': E('Juventus FC'), 'Roma': E('AS Roma'), 'Lazio': E('SS Lazio'),
  'Napoli': E('SSC Napoli'), 'Fiorentina': E('ACF Fiorentina'), 'Parma': E('Parma Calcio 1913'),
  'Bayern': E('Bayern Munich'), 'Dortmund': E('Borussia Dortmund'), 'Leverkusen': E('Bayer 04 Leverkusen'), 'Schalke': E('FC Schalke 04'),
  'Werder Bremen': E('SV Werder Bremen'), 'PSG': E('Paris Saint-Germain'), 'Marseille': E('Olympique Marseille'), 'Lyon': E('Olympique Lyon'),
  'Monaco': E('AS Monaco'), 'Lille': E('LOSC Lille'), 'Porto': E('FC Porto'), 'Benfica': E('SL Benfica'), 'Sporting': E('Sporting CP'),
  'Ajax': E('Ajax Amsterdam'), 'PSV': E('PSV Eindhoven'), 'Standard Liège': E('Standard Liège'), 'Oostende': E('KV Oostende'),
  'Olympiacos': E('Olympiacos Piraeus'), 'Fenerbahçe': E('Fenerbahce SK'), 'Dinamo Zagreb': E('GNK Dinamo Zagreb'),
  'Spartak Moscou': E('Spartak Moscow'), 'Dínamo de Moscou': E('Dynamo Moscow'),
}
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ── 3. vira PNG (SVG é desenhado no Chromium), recorta, reduz e salva em webp ──
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 400, height: 400 } })
const TMP = path.join(FONTES, 'png'); mkdirSync(TMP, { recursive: true })
const indice = {}, falta = []
for (const [chave, src] of Object.entries(MAPA)) {
  const png = path.join(TMP, slug(chave) + '.png')
  if (src.git) {
    writeFileSync(png, readFileSync(doGit(src.git[0], src.git[1])))
  } else if (src.fl) {
    const baixado = flBaixa(src.fl)
    if (!baixado) { falta.push(chave); continue }
    writeFileSync(png, readFileSync(baixado))
  } else if (src.png) {
    const achado = pngs.get(src.png)
    if (!achado) { falta.push(chave); continue }
    writeFileSync(png, readFileSync(achado.p))
  } else {
    const svg = src.svg ? src.svg() : existsSync(src.svgFile) ? readFileSync(src.svgFile, 'utf8') : null
    if (!svg) { falta.push(chave); continue }
    await pg.setContent(`<html><body style="margin:0;background:transparent"><div id="c" style="width:400px;height:400px;display:flex;align-items:center;justify-content:center">${svg}</div><style>#c svg{width:400px;height:400px}</style></body></html>`)
    await pg.locator('#c').screenshot({ path: png, omitBackground: true })
  }
  const out = path.join(SAIDA, slug(chave) + '.webp')
  const dims = execSync(`python3 - "${png}" "${out}"`, { input: `
import sys
from PIL import Image, ImageDraw
im = Image.open(sys.argv[1]).convert('RGBA')
# 🧽 arquivo SEM transparência (os GIF/PNG antigos vêm com fundo branco): apaga o fundo
# ligado à BORDA (flood fill a partir dos cantos) — o branco de dentro do escudo fica
if min(im.split()[3].getdata()) == 255:
    im = im.convert('RGB')
    for xy in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
        if sum(im.getpixel(xy)) > 690: ImageDraw.floodfill(im, xy, (255, 0, 255), thresh=40)
    im = im.convert('RGBA')
    im.putdata([(0, 0, 0, 0) if p[:3] == (255, 0, 255) else p for p in im.getdata()])
a = im.split()[3].point(lambda v: 255 if v >= 40 else 0)
bb = a.getbbox() or (0, 0, im.width, im.height)
im = im.crop(bb)
esc = 160 / max(im.size)
im = im.resize((max(1, round(im.width * esc)), max(1, round(im.height * esc))), Image.LANCZOS)
im.save(sys.argv[2], 'WEBP', quality=88, method=6)
print(im.width, im.height)
` }).toString().trim().split(' ').map(Number)
  indice[chave] = { src: `escudos-clubes/${slug(chave)}.webp`, w: dims[0], h: dims[1] }
  process.stdout.write('.')
}
await br.close()
const kb = Object.keys(indice).reduce((s, k) => s + statSync(path.join('public', indice[k].src)).size, 0) / 1024
writeFileSync('src/escalacao/escudos-oficiais.ts', `// ⚠️ ARQUIVO GERADO por \`node scripts/escudos-oficiais.mjs\` — não editar na mão.
// 🛡️ Escudo OFICIAL de cada clube do Leilão de Clubes (decisão do Diego, 28/09).
// A imagem mora em \`public/\` (fora do bundle, só baixa pra quem vê o clube).
// Clube fora desta lista usa o selo estilo B (\`selo-clube.tsx\`).
// ${Object.keys(indice).length} escudos · ${kb.toFixed(0)} KB somados.
export const ESCUDOS_OFICIAIS: Record<string, { src: string; w: number; h: number }> = ${JSON.stringify(indice, null, 2)}
`)
console.log(`\n✅ ${Object.keys(indice).length} escudos (${kb.toFixed(0)} KB) · sem arquivo: ${falta.join(', ') || 'nenhum'}`)
