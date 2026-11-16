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
// 🌵 30/10 (Diego: "clubes da Copa do Nordeste e estaduais sem escudo oficial"): mais 2 acervos do GitHub
//   · JoseArroyave/football-logos (SVG, por país) — Bangu, America-RJ, Madureira, Volta Redonda, Guarani, Juventude,
//     Caxias, Figueirense, Avaí, Londrina, ABC, Botafogo-PB, CSA
//   · Brasfoot-Next/database (crest.png) — CRB, Criciúma
//   Ainda SEM escudo em acervo nenhum (ficam no selo estilo B): Portuguesa, São Caetano, Ipatinga, América-RN,
//   Confiança, Moto Club, River-PI.
const JA = clonaSem('JoseArroyave/football-logos', 'josearroyave'), BFN = clonaSem('Brasfoot-Next/database', 'brasfoot')
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
const J = n => ({ svg: () => readFileSync(doGit(JA, `logos/brazil/${n}.svg`), 'utf8') }), JP = (pais, n) => ({ svg: () => readFileSync(doGit(JA, `logos/${pais}/${n}.svg`), 'utf8') }), B = c => ({ git: [BFN, `clubs/bra/${c}/crest.png`] })
// 🇧🇷 15/11: escudo baixado da página do clube na Wikipédia (upload.wikimedia.org) — clubes pequenos que nenhum acervo tem
const Wk = u => ({ url: u })
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
  // 🏆 Brasil Oficial: os estrangeiros da Libertadores 2026 (16/11, Diego: "tem que ter os escudos") — football-badges (MIT),
  // JoseArroyave e sportlogos. Sem escudo em acervo nenhum (ficam no selo estilo B): Nacional Potosí e Universidad Católica-EQU.
  'Lanús': F('lanus'), 'Platense': F('platense'), 'Estudiantes': F('estudiantes-de-la-plata'), 'Independiente Rivadavia': F('independiente-rivadavia'),
  'Rosario Central': F('rosario-central'), 'Argentinos Juniors': JP('argentina', 'Argeninos_Juniors'), 'Always Ready': F('always-ready'), 'Bolívar': F('bolivar'),
  'The Strongest': JP('bolivia', 'The_Strongest'), 'Coquimbo Unido': F('coquimbo-unido'), 'Universidad Católica': F('universidad-catolica'),
  "O'Higgins": JP('chile', "O'Higgins"), 'Huachipato': JP('chile', 'Huachipato'), 'Santa Fe': F('independiente-santa-fe'), 'Junior Barranquilla': F('atletico-junior'),
  'Deportes Tolima': F('deportes-tolima'), 'Independiente Medellín': F('independiente-medellin'), 'Independiente del Valle': F('independiente-del-valle'),
  'Libertad': F('libertad'), 'Cerro Porteño': F('cerro-porteno'), 'Guaraní-PAR': S('south-america/py-paraguay/guarani.png'), '2 de Mayo': JP('paraguay', '2_de_Mayo'),
  'Universitario': F('universitario'), 'Cusco': F('cusco'), 'Nacional-URU': JP('uruguay', 'Nacional'), 'Peñarol': F('penarol'), 'Liverpool-URU': JP('uruguay', 'Liverpool'),
  'Juventud': JP('uruguay', 'Juventud'), 'Universidad Central': F('universidad-central'), 'Deportivo La Guaira': F('deportivo-la-guaira'), 'Carabobo': JP('venezuela', 'Carabobo_FC'),
  'Deportivo Táchira': S('south-america/ve-venezuela/deportivotachira.png'),
  // 🏆 Brasil Oficial: os estrangeiros da Sul-Americana 2026 (16/11) — JoseArroyave. Sem escudo em acervo nenhum: Guabirá, Libertad-EQU,
  // Macará, Alianza Atlético (e o América de Cali, que já estava na lista de espera)
  'Racing': JP('argentina', 'Racing_Club'), 'Deportivo Riestra': JP('argentina', 'Deportivo_Riestra'), 'San Lorenzo': JP('argentina', 'San_Lorenzo_de_Almagro'),
  'Tigre': JP('argentina', 'Tigre'), 'Barracas Central': JP('argentina', 'Barracas_Central'), 'San Antonio Bulo Bulo': JP('bolivia', 'CD_San_Antonio_Bulo_Bulo'),
  'Blooming': JP('bolivia', 'Blooming'), 'Independiente Petrolero': JP('bolivia', 'Independiente_Petrolero'), 'Audax Italiano': JP('chile', 'Audax_Italiano'),
  'Palestino': JP('chile', 'Palestino'), 'Cobresal': JP('chile', 'Cobresal'), 'Atlético Bucaramanga': JP('colombia', 'Bucaramanga'), 'Millonarios': JP('colombia', 'Millonarios'),
  'Orense': JP('ecuador', 'Orense'), 'Deportivo Cuenca': JP('ecuador', 'Deportivo_Cuenca'), 'Sportivo Trinidense': JP('paraguay', 'Trinidense'),
  'Nacional-PAR': JP('paraguay', 'Nacional'), 'Recoleta': JP('paraguay', 'Club_Deportivo_Recoleta'), 'Olimpia': JP('paraguay', 'Olimpia'),
  'Melgar': JP('peru', 'FBC_Melgar'), 'Deportivo Garcilaso': JP('peru', 'Deportivo_Garcilaso'), 'Cienciano': JP('peru', 'Cienciano_del_Cusco'),
  'Defensor Sporting': JP('uruguay', 'Defensor_Sporting'), 'Boston River': JP('uruguay', 'Boston_River'), 'Racing-URU': JP('uruguay', 'Racing'),
  'Montevideo City Torque': JP('uruguay', 'Montevideo_City_Torque'), 'Academia Puerto Cabello': JP('venezuela', 'Academia_Puerto_Cabello'),
  'Monagas': JP('venezuela', 'Monagas_SC'), 'Caracas': JP('venezuela', 'Caracas'), 'Metropolitanos': JP('venezuela', 'Metropolitanos_FC'),
  // 🌵 copas regionais (30/10)
  'Bangu': J('Bangu'), 'America-RJ': J('America_Football_Club_(RJ)'), 'Madureira': J('Madureira_Esporte_Clube'),
  'Volta Redonda': J('Volta_Redonda'), 'Guarani': J('Guarani'), 'Juventude': J('Juventude'), 'Caxias': J('Caxias'),
  'Figueirense': J('Figueirense'), 'Avaí': J('Avai'), 'Londrina': J('Londrina'), 'ABC': J('ABC_Futebol_Clube'),
  'Botafogo-PB': J('Botafogo_PB'), 'CSA': J('CSA'), 'CRB': B('crb'), 'Criciúma': B('criciuma'),
  'Paraná': H('parana'), 'Sampaio Corrêa': H('sampaio-correa'),
  // 🇧🇷 Brasil Oficial (15/11, Diego: "todos os times com escudos oficiais") — Séries A/B de 2026 que faltavam
  'Mirassol': J('Mirassol'), 'Remo': J('Clube_do_Remo'), 'Athletic': J('Athletic'), 'Atlético-GO': J('Atlético_Goianiense'),
  'Botafogo-SP': J('Botafogo_SP'), 'Cuiabá': J('Cuiabá'), 'Novorizontino': J('Grêmio_Novorizontino'),
  'Operário-PR': J('Operário_Ferroviário'), 'São Bernardo': J('São_Bernardo'), // ⚠️ o SVG vem sem viewBox e sai CORTADO: o .webp do repo foi refeito à mão (15/11) — depois de rodar, `git checkout public/escudos-clubes/sao-bernardo.webp` e w 160 / h 159 no índice
  'Vila Nova': J('Vila_Nova'),
  // 🇧🇷 Série C 2026 (15/11)
  'Amazonas': J('Amazonas'), 'Anápolis': J('Anápolis'), 'Barra': J('Barra'), 'Brusque': J('Brusque'), 'Confiança': J('Confiança'),
  'Ferroviária': J('Ferroviaria'), 'Floresta': J('Floresta'), 'Inter de Limeira': J('Inter_de_Limeira'), 'Itabaiana': J('Itabaiana'),
  'Ituano': J('Ituano'), 'Maranhão': J('Maranhão'), 'Maringá': J('Maringá'), 'Paysandu': J('Paysandu'), 'Ypiranga': J('Ypiranga'),
  // 🇧🇷 Brasil Oficial: Série D 2026, estaduais e Copa do Brasil (15/11) — acervo JoseArroyave
  'Galvez': J('Galvez_Esporte_Clube'), 'Humaitá': J('Sport_Clube_Humaitá'), 'Independência': J('Independência_Futebol_Clube'), 'ASA': J('ASA_de_Arapiraca'),
  'CSE': J('CSE'), 'Manauara': J('Manauara_Esporte_Clube'), 'Manaus': J('Manaus_Futebol_Clube'), 'Nacional-AM': J('Nacional_Futebol_Clube'),
  'Oratório': J('Oratório_Recreativo_Clube'), 'Trem': J('Trem_Desportivo_Clube'), 'Atlético-BA': J('Atlético_de_Alagoinhas'), 'Bahia de Feira': J('Bahia_de_Feira'),
  'Barcelona de Ilhéus': J('Barcelona_de_Ilhéus'), 'Jacuipense': J('EC_Jacuipense'), 'Jequié': J('Jequié'), 'Juazeirense': J('Juazeirense'),
  'Porto-BA': J('Porto-BA'), 'Atlético-CE': J('Futebol_Clube_Atlético_Cearense'), 'Ferroviário-CE': J('Ferroviário_Atlético_Clube'), 'Iguatu': J('Associação_Desportiva_Iguatu'),
  'Maracanã-CE': J('Maracanã_Esporte_Clube'), 'Tirol': J('Centro_de_Formação_de_Atletas_Tirol'), 'Brasiliense': J('Brasiliense_Futebol_Clube'), 'Capital': J('Capital_Clube_de_Futebol'),
  'Ceilândia': J('Ceilândia_Esporte_Clube'), 'Gama': J('Sociedade_Esportiva_do_Gama'), 'Real Noroeste': J('Real_Noroeste'), 'Rio Branco-ES': J('Rio_Branco-ES'),
  'Vitória-ES': J('Vitória-ES'), 'ABECAT': J('ABECAT_Ouvidorense'), 'Anapolina': J('Anapolina'), 'Aparecidense': J('Associação_Atlética_Aparecidense'),
  'Centro Oeste': J('Centro_Oeste_FC'), 'CRAC': J('CRAC'), 'Goiatuba': J('Goiatuba_Esporte_Clube'), 'Inhumas': J('Inhumas_Esporte_Clube'),
  'Jataiense': J('Jataiense'), 'IAPE': J('Instituto_de_Administração_de_Projetos_Educacionais_Futebol_Clube'), 'Imperatriz': J('Sociedade_Imperatriz_de_Desportos'), 'Moto Club': J('Moto_Club_de_São_Luís'),
  'Betim': J('Betim_Futebol'), 'Democrata-GV': J('Democrata-GV'), 'Itabirito': J('Itabirito_FC'), 'North': J('North_Esporte_Clube'),
  'Pouso Alegre': J('Pouso_Alegre_Futebol_Clube'), 'Tombense': J('Tombense_FC'), 'Uberlândia': J('Uberlândia_Esporte_Clube'), 'URT': J('URT'),
  'Ivinhema': J('Ivinhema_Futebol_Clube'), 'Operário-MS': J('Operário-MS'), 'Luverdense': J('Luverdense_Esporte_Clube'), 'Mixto': J('Mixto_Esporte_Clube'),
  'Operário VG': J('Operário_Várzea-Grandense'), 'Primavera-MT': J('Primavera_Atlético_Clube'), 'União Rondonópolis': J('União_Esporte_Clube'), 'Várzea Grande': J('Várzea_Grande_Esporte_Clube'),
  'Tuna Luso': J('Tuna_Luso_Brasileira'), 'Águia de Marabá': J('Águia_de_Marabá_Futebol_Clube'), 'Campinense': J('Campinense'), 'Serra Branca': J('Serra_Branca_EC'),
  'Sousa': J('Sousa_Esporte_Clube'), 'Treze': J('Treze_FC'), 'Central': J('Central_Sport_Club'), 'Decisão': J('Decisão_Goiana_FC'),
  'Maguary': J('Associação_Atlética_Maguary'), 'Retrô': J('Retrô_FC'), 'Altos': J('Associação_Atlética_de_Altos'), 'Fluminense-PI': J('Fluminense_Esporte_Clube'),
  'Parnahyba': J('Parnahyba_Sport_Club'), 'Piauí': J('Piauí_Esporte_Clube'), 'Andraus': J('Andraus'), 'Azuriz': J('Azuriz_FC'),
  'Cascavel': J('FC_Cascavel'), 'Cianorte': J('Cianorte_FC'), 'Foz do Iguaçu': J('Foz_do_Iguaçu_FC'), 'Galo Maringá': J('Galo_Maringá'),
  'São Joseense': J('São_Joseense'), 'Boavista-RJ': J('Boavista_SC'), 'Maricá': J('Maricá_FC'), 'Nova Iguaçu': J('Nova_Iguaçu_FC'),
  'Portuguesa-RJ': J('Associação_Atlética_Portuguesa_(RJ)'), 'Sampaio Corrêa-RJ': J('Sampaio_Corrêa-RJ'), 'América-RN': J('América_de_Natal'), 'Laguna': J('Clube_Laguna_SAF'),
  'Guaporé': J('Guaporé_Futebol_Clube'), 'Porto Velho': J('Porto_Velho_Esporte_Clube'), 'GAS': J('Grêmio_Atlético_Sampaio_(GAS)'), 'Monte Roraima': J('Monte_Roraima'),
  'São Raimundo-RR': J('São_Raimundo-RR'), 'Avenida': J('Avenida'), 'Brasil de Pelotas': J('Brasil_de_Pelotas'), 'Guarany de Bagé': J('Guarany_de_Bagé'),
  'Inter-SM': J('Internacional_de_Santa_Maria'), 'Monsoon': J('Monsoon_FC'), 'Novo Hamburgo': J('Novo_Hamburgo'), 'São José-RS': J('EC_São_José'),
  'São Luiz-RS': J('EC_São_Luiz'), 'Blumenau': J('Blumenau_Esporte_Clube'), 'Joinville': J('Joinville_Esporte_Clube'), 'Marcílio Dias': J('Marcílio_Dias'),
  'Santa Catarina': J('Santa_Catarina_Clube'), 'Atlético Gloriense': J('Atlético_Gloriense'), 'Lagarto': J('Lagarto_FC'), 'Sergipe': J('Club_Sportivo_Sergipe'),
  'Noroeste': J('Noroeste'), 'Portuguesa': J('Associação_Portuguesa_de_Desportos'), 'Primavera-SP': J('Primavera'), 'Velo Clube': J('Velo_Clube'),
  'XV de Piracicaba': J('XV_de_Piracicaba'), 'Água Santa': J('Esporte_Clube_Água_Santa'), 'Araguaína': J('Araguaína_Futebol_e_Regatas'), 'Tocantinópolis': J('Tocantinópolis_Esporte_Clube'),
  // 🇧🇷 Brasil Oficial (15/11): os que nenhum acervo tem — escudo da página do clube na pt.wikipedia
  'Vasco-AC': Wk('https://upload.wikimedia.org/wikipedia/pt/a/ac/ADVascoAC.png'),
  'Coruripe': Wk('https://upload.wikimedia.org/wikipedia/pt/b/b4/EscudoAACoruripe.png'),
  'Cruzeiro-AL': Wk('https://upload.wikimedia.org/wikipedia/pt/9/96/ECCruzeiroAL.png'),
  'Murici': Wk('https://upload.wikimedia.org/wikipedia/commons/7/77/Murici_FC_%282017%29.png'),
  'Itacoatiara': Wk('https://upload.wikimedia.org/wikipedia/pt/a/a7/Itacoatiara_FC-49.png'),
  'Parintins': Wk('https://upload.wikimedia.org/wikipedia/pt/f/f9/ParintinsFC.png'),
  'Princesa do Solimões': Wk('https://upload.wikimedia.org/wikipedia/pt/1/1d/Princesa_do_Solim%C3%B5es-AM.png'),
  'São Raimundo-AM': Wk('https://upload.wikimedia.org/wikipedia/commons/7/7d/S%C3%A3o_Raimundo-AM_2017.png'),
  'Independente-AP': Wk('https://upload.wikimedia.org/wikipedia/pt/f/ff/Logo_Independente-AP.png'),
  'Horizonte': Wk('https://upload.wikimedia.org/wikipedia/commons/a/a8/Horizonte_Futebol_Clube.png'),
  'Maranguape': Wk('https://upload.wikimedia.org/wikipedia/commons/d/d3/Escudo_do_Maranguape_com_Estrelas.png'),
  'Quixadá': Wk('https://upload.wikimedia.org/wikipedia/pt/d/d8/Quixada_logo.png'),
  'Porto Vitória': Wk('https://upload.wikimedia.org/wikipedia/pt/f/fa/Escudo_Porto_Vit%C3%B3ria.png'),
  'ITZ': Wk('https://upload.wikimedia.org/wikipedia/pt/c/c9/ITZ_Sport.png'),
  'Luminense': Wk('https://upload.wikimedia.org/wikipedia/pt/2/28/Luminense_AC.png'),
  'Tuntum': Wk('https://upload.wikimedia.org/wikipedia/pt/7/7c/Escudo_Tuntum_EC.png'),
  'FC Pantanal': Wk('https://upload.wikimedia.org/wikipedia/commons/2/26/FC_Pantanal-MS_%28BRA%29_2025.png'),
  'Chapada': Wk('https://upload.wikimedia.org/wikipedia/commons/5/5d/ChapadaFC.png'),
  'Nova Mutum': Wk('https://upload.wikimedia.org/wikipedia/pt/8/81/NovaMutumEC.png'),
  // 'Sinop': a pt.wikipedia só tem o escudo do Sinop FC antigo; quem joga 2026 é o Clube Sport Sinop (outro clube) — fica no selo
  'Amazônia': Wk('https://upload.wikimedia.org/wikipedia/pt/7/72/Escudo_AIFC.png'),
  'Bragantino-PA': Wk('https://upload.wikimedia.org/wikipedia/pt/9/96/BragantinoCP2018.png'),
  'Cametá': Wk('https://upload.wikimedia.org/wikipedia/pt/3/3b/CametaSC.png'),
  'Capitão Poço': Wk('https://upload.wikimedia.org/wikipedia/pt/0/02/Escudo_CPEC.png'),
  'Santa Rosa': Wk('https://upload.wikimedia.org/wikipedia/pt/1/19/SantaRosaEC.png'),
  'São Francisco-PA': Wk('https://upload.wikimedia.org/wikipedia/pt/b/b8/S%C3%A3o_Francisco_Futebol_Clube_Santar%C3%A9m_Par%C3%A1.png'),
  'São Raimundo-PA': Wk('https://upload.wikimedia.org/wikipedia/pt/2/29/SaoRaimundoPA.png'),
  'Esporte de Patos': Wk('https://upload.wikimedia.org/wikipedia/pt/c/c8/Esporte_Clube_de_Patos_logo.png'),
  'Nacional de Patos': Wk('https://upload.wikimedia.org/wikipedia/pt/3/32/NacionalPatos.png'),
  'Pombal': Wk('https://upload.wikimedia.org/wikipedia/pt/0/0a/Escudo_Pombal.png'),
  'Vitória das Tabocas': Wk('https://upload.wikimedia.org/wikipedia/pt/1/1e/AADVitoriaT.png'),
  'Ji-Paraná': Wk('https://upload.wikimedia.org/wikipedia/pt/5/54/Ji-Paran%C3%A1FutebolClube.png'),
  'Camboriú': Wk('https://upload.wikimedia.org/wikipedia/pt/1/17/Escudo_do_Cambori%C3%BA_FC_%282022%29.png'),
  'Carlos Renaux': Wk('https://upload.wikimedia.org/wikipedia/pt/f/f1/CACarlos_Renaux.png'),
  'Concórdia': Wk('https://upload.wikimedia.org/wikipedia/pt/1/16/Conc%C3%B3rdia_Atl%C3%A9tico_Clube.png'),
  'América-SE': Wk('https://upload.wikimedia.org/wikipedia/pt/2/22/AmericaSE.png'),
  'Dorense': Wk('https://upload.wikimedia.org/wikipedia/pt/e/ef/Dorense_FC_escudo.png'),
  'Falcon': Wk('https://upload.wikimedia.org/wikipedia/pt/6/6f/Falcon_FC.png'),
  'Capivariano': Wk('https://upload.wikimedia.org/wikipedia/commons/4/43/Capivariano_FC.png'),
  // 🌍 football-logos.cc (baixa quando o host estiver liberado)
  'Blackburn': W('england/blackburn-rovers'), 'América de Cali': W('colombia/america-de-cali'),
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
  if (src.url) {
    const ext = src.url.split('?')[0].split('.').pop().toLowerCase()
    const dst = path.join(FONTES, 'wk-' + slug(chave) + '.' + ext)
    if (!existsSync(dst)) try { execSync(`curl -sSfL -m 30 -A "Mozilla/5.0 (X11; Linux x86_64)" -o "${dst}" "${src.url}"`, { stdio: 'ignore' }) } catch { falta.push(chave); continue }
    if (ext === 'svg') {
      await pg.setContent(`<html><body style="margin:0;background:transparent"><div id="zzcaixa" style="width:400px;height:400px;display:flex;align-items:center;justify-content:center">${readFileSync(dst, 'utf8')}</div><style>#zzcaixa svg{width:400px;height:400px}</style></body></html>`)
      await pg.locator("#zzcaixa").screenshot({ path: png, omitBackground: true })
    } else writeFileSync(png, readFileSync(dst))
  } else if (src.git) {
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
    await pg.setContent(`<html><body style="margin:0;background:transparent"><div id="zzcaixa" style="width:400px;height:400px;display:flex;align-items:center;justify-content:center">${svg}</div><style>#zzcaixa svg{width:400px;height:400px}</style></body></html>`)
    await pg.locator("#zzcaixa").screenshot({ path: png, omitBackground: true })
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
