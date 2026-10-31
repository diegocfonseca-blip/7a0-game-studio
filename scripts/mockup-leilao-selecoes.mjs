// 🌍📅 MOCKUP (30/10): 3º tipo de leilão — 🌍 Seleções — e a escolha "📦 Inteiro / 📅 Por década" pra Clubes e Seleções.
// Diego: *"se criar no jogador não muda nada… mas se criar clubes ou seleção teria opção de escolher por década ou não"*.
// Exemplos com cartas DE VERDADE do baralho (contadas em 30/10).
//   node scripts/mockup-leilao-selecoes.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? 'mockup-leilao-selecoes.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = (p, h) => `<img src="data:image/webp;base64,${readFileSync(p).toString('base64')}" style="height:${h}px;width:auto">`
const NAC = n => `src/escalacao/img/nations-v25/${n}.webp`

const seg = (ops, esc, selo = {}) => `<div style="display:grid;grid-template-columns:repeat(${ops.length},1fr);gap:6px">${ops.map(o => `
  <div style="padding:9px 4px;text-align:center;font-weight:700;font-size:13px;text-transform:uppercase;background:${o === esc ? GOLD : CREME};border:2.5px solid ${INK};border-radius:10px;${o === esc ? `box-shadow:2px 2px 0 ${INK}` : ''}">
    ${selo[o] ? `<span style="display:block;margin:0 auto 3px;width:fit-content;font-size:8.5px;padding:1px 6px;border-radius:6px;border:1.5px solid ${INK};background:${GREEN};color:#fff">${selo[o]}</span>` : ''}${o}</div>`).join('')}</div>`
const campo = (rot, html, dica = '') => `<div style="margin:12px 0"><div style="font-size:11px;letter-spacing:.08em;color:#6b6250;text-transform:uppercase;margin-bottom:5px">${rot}</div>${html}${dica ? `<div style="font-size:11.5px;color:#5a5141;margin-top:5px;line-height:1.3">${dica}</div>` : ''}</div>`

const tela = (titulo, tipo, pacote) => `<div class="cel">
  <div style="font-weight:700;font-size:19px;text-transform:uppercase;margin-bottom:2px">${titulo}</div>
  ${campo('Tipo do leilão', seg(['🃏 Jogador', '🧱 Clubes', '🌍 Seleções'], tipo, { '🌍 Seleções': 'NOVO' }),
    tipo === '🃏 Jogador' ? '🃏 O leilão de sempre: um jogador por lote.' : tipo === '🧱 Clubes' ? '🧱 Cada lote é um clube numa posição (ex.: Meias do Flamengo).' : '🌍 Cada lote é uma seleção numa posição (ex.: Atacantes da Argentina).')}
  ${tipo === '🃏 Jogador' ? `<div style="font-size:12px;color:#8a8170;border:2px dashed #b9ad8f;border-radius:10px;padding:10px;text-align:center">no Jogador não aparece nada a mais — fica igual a hoje</div>`
    : campo('Como vêm os pacotes', seg(['📦 Inteiro', '📅 Por década'], pacote),
      pacote === '📦 Inteiro' ? (tipo === '🧱 Clubes' ? '📦 O clube inteiro, de todas as épocas (igual a hoje).' : '📦 A seleção de todas as épocas. Seleção grande (Brasil, Argentina) vem com 8 sorteados da posição.')
        : (tipo === '🧱 Clubes' ? '📅 Um clube numa década: "Flamengo anos 2010". Só entram os clubes com jogador suficiente naquela década.' : '📅 Uma seleção numa década: "Brasil anos 70". Seleção pequena vem inteira.'))}
  ${campo('Jeito do lance', seg(['✉️ Envelope', '🐊 Tocaia', '🔨 Pregão'], '✉️ Envelope'))}
</div>`

const pacote = (escudo, nome, sub, nomes) => `<div style="background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 #000;padding:10px 12px;width:250px;box-sizing:border-box">
  <div style="display:flex;align-items:center;gap:10px">${escudo}<div><div style="font-weight:700;font-size:17px;text-transform:uppercase;line-height:1.05">${nome}</div><div style="font-size:12px;color:#5a5141;text-transform:uppercase">${sub}</div></div></div>
  <div style="margin-top:8px;font-size:12.5px;line-height:1.45">${nomes.map(n => `• ${n}`).join('<br>')}</div></div>`

const html = `<html><head><style>${FONTES}body{margin:0;background:${CREME};font-family:Oswald,sans-serif;color:${INK};padding:26px;width:1180px}
.cel{background:#fff;border:3px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 #000;padding:14px;width:360px;box-sizing:border-box}
h1{font-weight:700;text-transform:uppercase;font-size:34px;margin:0}h2{font-weight:700;text-transform:uppercase;font-size:21px;margin:22px 0 10px}</style></head><body>
<h1>🌍 Leilão de Seleções + 📅 por década</h1>
<div style="font-size:16px;color:#444;margin-top:4px">Na hora de criar a sala: o tipo ganha a 3ª opção, e Clubes/Seleções ganham a escolha de como vêm os pacotes.</div>
<h2>1 · Criar sala</h2>
<div style="display:flex;gap:16px;align-items:flex-start">
  ${tela('Jogador', '🃏 Jogador', '')}
  ${tela('Clubes', '🧱 Clubes', '📅 Por década')}
  ${tela('Seleções', '🌍 Seleções', '📅 Por década')}
</div>
<h2>2 · Como fica o pacote no leilão (cartas de verdade)</h2>
<div style="display:flex;gap:14px;flex-wrap:wrap">
  ${pacote(img('public/escudos-clubes/flamengo.webp', 46), 'Flamengo anos 2010', '🧱 Clubes · 📅 por década · atacantes', ['Gabigol 2019', 'Bruno Henrique 2019', 'Vinicius Jr 2018', 'Reinier 2019', 'Hernane Brocador 2013', '+ 4'])}
  ${pacote(img(NAC('brazil'), 46), 'Brasil anos 70', '🌍 Seleções · 📅 por década · atacantes', ['Pelé 1977', 'Tostão 1970', 'Jairzinho 1970', 'Reinaldo 1977', 'Dadá Maravilha 1971', '+ 3'])}
  ${pacote(img(NAC('argentina'), 46), 'Argentina anos 80', '🌍 Seleções · 📅 por década · atacantes', ['Diego Maradona 1981', 'Gabriel Batistuta 1988', 'Jorge Burruchaga 1984', 'Abel Balbo 1988', 'Ricardo Gareca 1985', '+ 3'])}
  ${pacote(img(NAC('ghana'), 46), 'Gana', '🌍 Seleções · 📦 inteiro · meias', ['Michael Essien 2007', 'Abedi Pelé 1993', 'Kevin-Prince Boateng 2011', 'Sulley Muntari 2010', 'Thomas Partey 2020'])}
</div>
<div style="margin-top:16px;font-size:14px;color:#444;line-height:1.4">⚠️ O que os números mostram: <b>por década</b>, só uns 40 clubes têm atacante suficiente numa década (quase todos dos anos 2000/2010) — o resto fica de fora dessa opção. E o <b>Brasil inteiro</b> tem 260 atacantes, por isso seleção grande vem com 8 sorteados.</div>
</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1232, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
