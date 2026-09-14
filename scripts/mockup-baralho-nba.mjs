// 🖼️ MOCKUP — 🃏 o BARALHO do BidLegends depois do Lote 6.
// Pedido do Diego (14/09): *"pode encher mais, porém lembrando que também tem que
// ter jogador RUIM. Mas sempre FAMOSOS. Sendo bom ou ruim, teve polêmica ou fama
// ou qualquer coisa nesse tipo — igual Carlos Kaiser e Mauro Shampoo"*.
//
// Mostra o baralho por CATEGORIA (as 5 que ele listou) e abre as cartas novas do
// lote, pra ele conferir o tom das bios antes de qualquer coisa ir pra frente.
// Lê o baralho de verdade (`data-basquete.ts`) — nada é escrito à mão aqui.
//
// Rodar: npx tsx scripts/mockup-baralho-nba.mjs   → /tmp/mockup-baralho-nba.png
import { chromium } from 'playwright-core'
import { CATALOG_NBA, BPOS_LABEL } from '../src/escalacao/data-basquete.ts'

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400'
// as 5 categorias, com as palavras do Diego
const CAT = {
  5: { emoji: '👑', nome: 'LENDA', cor: '#FFC400' },
  4: { emoji: '⭐', nome: 'CRAQUE', cor: '#D8D8DE' },
  3: { emoji: '🎯', nome: 'BOM JOGADOR', cor: '#D8F0DE' },
  2: { emoji: '🎯', nome: 'BOM JOGADOR', cor: '#D8F0DE' },
  1: { emoji: '🪵', nome: 'FOI PROFISSIONAL', cor: '#E7DFC9' },
}
const todas = Object.entries(CATALOG_NBA).flatMap(([pos, lista]) => lista.map(c => ({ ...c, pos })))

// conta por categoria (promessa é um selo à parte, como no futebol)
const conta = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
for (const c of todas) conta[c.fame]++
const promessas = todas.filter(c => c.promessa).length
const folk = todas.filter(c => c.folk).length

// o arquivo do baralho não guarda "lote", então a lista dos 60 nomes do Lote 6
// mora aqui — é mockup, não regra de jogo.
const NOMES_LOTE6 = [
  'Mahmoud Abdul-Rauf', 'Rafer Alston (Skip To My Lou)', 'Michael Carter-Williams', 'Jimmer Fredette',
  'Sebastian Telfair', 'Brandon Jennings', 'Kenny Smith (The Jet)', 'Deron Williams', 'Raymond Felton',
  'Josh Giddey', 'Cade Cunningham', 'Lance Stephenson', 'Ricky Davis', 'Isaiah Rider',
  'Vernon Maxwell (Mad Max)', 'Bruce Bowen', 'Michael Beasley', 'Dion Waiters', 'Jason Richardson',
  'Allan Houston', 'Brandon Roy', 'Monta Ellis', 'Jalen Green', 'Christian Laettner', 'Darius Miles',
  'Matt Barnes', 'Xavier McDaniel (X-Man)', 'Tayshaun Prince', 'Hedo Türkoğlu', 'Rudy Gay', 'Danny Green',
  'Wally Szczerbiak', 'Michael Kidd-Gilchrist', 'Brandon Miller', 'Trevor Ariza', 'Charles Oakley',
  'Anthony Mason', 'Rick Mahorn', 'A.C. Green', 'Kenneth Faried (Manimal)', 'Joe Smith', 'Stromile Swift',
  'Jan Veselý', 'Nikoloz Tskitishvili', 'Rafael Araújo', 'Cristiano Felício', 'Carlos Boozer',
  'JaVale McGee', 'Gheorghe Mureșan', 'Mark Eaton', 'Todd Fuller', 'Greg Ostertag', 'Yinka Dare',
  'Jahlil Okafor', 'Zaza Pachulia', 'Bismack Biyombo', 'Roy Hibbert', 'Chris Kaman', 'Lucas Nogueira',
  'Jason Collins',
]
const doLote = todas.filter(c => NOMES_LOTE6.includes(c.name))

const carta = c => {
  const cat = CAT[c.fame]
  const selo = c.promessa ? '💎 PROMESSA' : `${cat.emoji} ${cat.nome}`
  return `<div class="carta">
    <div class="topo" style="background:${c.promessa ? '#E9DAFB' : cat.cor}">
      <span class="selo">${selo}</span><span class="pos">${c.pos}</span>
    </div>
    <p class="nome">${c.name}${c.folk ? ' <i>🃏</i>' : ''}</p>
    <p class="clube">${c.club} · ${c.year} <b>${c.lo}–${c.hi}</b></p>
    <p class="bio">${c.bioPt}</p>
  </div>`
}

const porCat = [5, 4, 3, 1].map(f => {
  const n = f === 3 ? conta[3] + conta[2] : conta[f]
  const cat = CAT[f]
  return `<div class="cel" style="background:${cat.cor}"><b>${cat.emoji} ${cat.nome}</b><span>${n}</span></div>`
}).join('')

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};padding:26px;width:1000px}
  h1{font-size:32px;margin:0 0 2px;text-transform:uppercase;letter-spacing:.5px}
  h2{font-size:19px;margin:24px 0 10px;text-transform:uppercase}
  p.sub{margin:0 0 16px;font-size:15px;color:#4a4636;font-family:system-ui;line-height:1.45}
  .box{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:14px 16px}
  .linha{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .cel{border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 ${INK};padding:9px;text-align:center}
  .cel b{display:block;font-size:13px;text-transform:uppercase}
  .cel span{display:block;font-size:27px;font-weight:800;line-height:1.1}
  .cartas{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}
  .carta{background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};overflow:hidden}
  .topo{display:flex;justify-content:space-between;align-items:center;padding:3px 8px;border-bottom:3px solid ${INK}}
  .selo{font-size:9.5px;font-weight:800;letter-spacing:.3px}
  .pos{font-size:11px;font-weight:800;background:${INK};color:#fff;border-radius:6px;padding:0 6px}
  p.nome{margin:7px 9px 0;font-size:15.5px;font-weight:800;line-height:1.15}
  p.nome i{font-style:normal;font-size:12px}
  p.clube{margin:1px 9px 0;font-size:11.5px;font-family:system-ui;color:#6a6555;font-weight:600}
  p.clube b{color:${INK};font-family:Oswald;font-size:12.5px;margin-left:4px}
  p.bio{margin:6px 9px 9px;font-size:11.5px;font-family:system-ui;line-height:1.4;color:#2f2c22}
  .nota{margin-top:18px;font-family:system-ui;font-size:13.5px;line-height:1.5;color:#2f2c22;background:#fff7d6;
        border:3px solid ${INK};border-radius:14px;padding:11px 13px;box-shadow:3px 3px 0 ${INK}}
  .nota b{font-family:Oswald}
</style>
<h1>🃏 BidLegends — o baralho depois do lote novo</h1>
<p class="sub"><b>${todas.length} cartas</b> (eram 270), sendo ${promessas} promessas e ${folk} folclóricos 🃏. Subiram ${doLote.length} nomes neste lote, puxando pro lado que estava fraco: <b>famoso ruim</b>.</p>

<h2>1. As 5 categorias</h2>
<div class="box"><div class="linha">${porCat}<div class="cel" style="background:#E9DAFB"><b>💎 PROMESSA</b><span>${promessas}</span></div></div></div>
<p class="sub" style="margin-top:8px">A categoria 🪵 <b>foi profissional</b> era o buraco: tinha só 19 cartas em 270. Agora são ${conta[1]}.</p>

<h2>2. As cartas novas — "sendo bom ou ruim, teve polêmica ou fama"</h2>
<div class="cartas">${doLote.map(carta).join('')}</div>

<div class="nota">
  <b>O crivo é FAMA, não qualidade:</b> entra quem o torcedor reconhece — lenda, mico de draft, meme, encrenqueiro, personagem. Jogador anônimo não entra, por melhor que seja a estatística.<br>
  <b>Nada inventado:</b> toda bio fala de fato público e conhecido (posição de draft, apelido, lance famoso, título). Nenhuma piada em cima de doença, vício, tragédia ou crime — a zoeira é com o basquete, nunca com a desgraça de ninguém. Sem referência, a carta não nasce.<br>
  <b>O futebol não foi tocado:</b> este lote mexeu só no arquivo do baralho de basquete.
</div>`

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1052, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: '/tmp/mockup-baralho-nba.png', fullPage: true })
await browser.close()
console.log('🖼️  /tmp/mockup-baralho-nba.png')
console.log(`   ${todas.length} cartas · lote novo: ${doLote.length} · foi profissional: ${conta[1]} · ${Object.keys(BPOS_LABEL).length} posições`)
