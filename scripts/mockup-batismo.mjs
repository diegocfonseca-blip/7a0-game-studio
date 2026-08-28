#!/usr/bin/env node
// ─── 🎨 MOCKUP PADRÃO DE BATISMO — o post oficial de "clube batizado" ────────
//
// Regra permanente do Diego (17/08): *"esse aqui é o mockup padrão cara powww,
// e tem que ter as animações também"*. O formato é ESTE — não se inventa layout
// novo a cada batismo. O do Coringas do Diniz foi feito à mão e morava só no
// scratchpad da sessão; quando a máquina trocou, sumiu. Por isso mora no repo.
//
// ── COMO USAR ───────────────────────────────────────────────────────────────
//   node scripts/mockup-batismo.mjs \
//     --clube "Skyy FC" --serie D --antigo "Fortuna SAF" \
//     --escudo src/escalacao/img/skyy-escudo.webp \
//     --mascote src/escalacao/img/skyy-mascote.webp \
//     --mascote-nome "A Águia" --mascote-emoji "🦅" \
//     --c1 "#237581" --c1-nome "azul-piscina" --c2 "#0D3558" --c2-nome "azul-marinho" \
//     --dono "Matheus" --coracao "Corinthians" --fundador 24 \
//     --saida /tmp/skyy-post.png
//
// ── O QUE O POST TEM, DE CIMA PRA BAIXO (não mexer sem o Diego mandar) ──────
//   1. pílula "BATISMO DE LENDA" (ou "CLUBE DE SÓCIO", com --socio)
//   2. manchete "NASCEU O <CLUBE>" (a 1ª palavra do nome sai em vermelho)
//   3. uma frase explicando quem é o dono, a divisão e de quem tomou a vaga
//   4. cartão dourado: escudo + nome + coração + o resumo do clube
//   5. mascote e manto lado a lado
//   6. 🎬 "ONDE A <MASCOTE> APARECE" — as TRÊS animações, escritas pro jogador
//   7. rodapé: quem batizou + os selos (Lenda / sócio nº / fundador nº)
//
// ── 🎫 MODO SÓCIO (--socio) ─────────────────────────────────────────────────
// Nem todo clube de apoiador é BATISMO. Batismo = o clube toma o lugar de um
// time de CPU na pirâmide (e o dono ganha número de FUNDADOR). Sócio = o clube
// é do dono e NÃO tira o lugar de ninguém (mesmo caso do Eros FC, Sapekeiros FC
// e Marinheiros AS). Confundir os dois deu ruim no Futpoint FC (19/08): o Diego
// avisou *"eu N pedi p ele entrar no lugar de ng... eu disse q ele era sócio e
// N batismo"*. Com --socio o post troca a pílula, a manchete e some com o
// "entra no lugar de" e com a divisão.
//
// A Oswald vem de `scripts/fonts/` (64 KB, fora do bundle do jogo — isto aqui
// nunca é baixado por jogador nenhum, só roda na máquina de quem gera o post).

import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}

const o = {
  clube: arg('clube'), serie: arg('serie', 'D'), antigo: arg('antigo'),
  escudo: arg('escudo'), mascote: arg('mascote'),
  mascoteNome: arg('mascote-nome', 'a mascote'), mascoteEmoji: arg('mascote-emoji', '⭐'),
  c1: arg('c1', '#FFC400'), c1nome: arg('c1-nome', ''),
  c2: arg('c2', '#0C0C0C'), c2nome: arg('c2-nome', ''),
  camisa: arg('camisa', ''), // 🎽 a camisa DE VERDADE, quando o dono manda uma
  dono: arg('dono', ''), coracao: arg('coracao', ''), fundador: arg('fundador', ''),
  insta: arg('insta', ''), // 📸 @ do dono — entra no rodapé, do lado do nome dele
  socio: process.argv.includes('--socio'), socioN: arg('socio-n', ''),
  saida: arg('saida', 'mockup-batismo.png'),
  escala: Number(arg('escala', '1')), // 🔍 2 = o dobro de pixels (pro Instagram)
}
if (!o.clube || !o.escudo || !o.mascote) {
  console.error('faltou --clube, --escudo ou --mascote (veja o cabeçalho do arquivo)')
  process.exit(1)
}

const b64 = (p) => fs.readFileSync(p).toString('base64')
const img = (p) => `data:image/${path.extname(p).slice(1)};base64,${b64(p)}`
const fonte = (w) => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

// a manchete quebra o nome do clube: 1ª palavra em VERMELHO, o resto embaixo.
// "Nata de SP" → NATA / DE SP · "Skyy FC" → SKYY / FC
const partes = o.clube.trim().split(/\s+/)
// 🔤 QUEBRA DO NOME: por padrão é 1ª palavra em vermelho e o resto embaixo
// ("NATA / DE SP", "SKYY / FC"). Mas quando a 1ª palavra é curtinha e o nome tem
// 3+ pedaços, isso deixava uma sílaba solta e feia no vermelho — "DE / LA Ó FUT",
// "SÃO / LUIZ FC". Nesses casos o vermelho leva tudo menos a última palavra:
// "DE LA Ó / FUT", "SÃO LUIZ / FC".
const corte = (partes[0].length <= 3 && partes.length >= 3) ? partes.length - 1 : 1
const destaque = partes.slice(0, corte).join(' ').toUpperCase()
const resto = partes.slice(corte).join(' ').toUpperCase()

const cores = [o.c1nome, o.c2nome].filter(Boolean).join(' e ') || 'as cores do clube'

// 🎬 CADA MASCOTE COMEMORA DO SEU JEITO (Diego, 17/08): *"se é águia tem que ser
// algo relacionado a águia. Cada um depende do que ele é, as coisas que faz"*.
// O jogo já anima cada uma diferente (CARIMBO_ANIM em mascotes.tsx) — aqui o
// post CONTA isso com o verbo do bicho. Mascote sem verbo próprio cai no
// genérico, então batismo novo nunca sai com o post quebrado.
const JEITOS = {
  aguia:   { gol: 'MERGULHA de cima', festa: 'atravessa a tela PLANANDO lá no alto' },
  palhaco: { gol: 'entra QUICANDO, gingando pros dois lados', festa: 'atravessa a tela aos pulos' },
  cobra:   { gol: 'RASTEJA por cima do placar', festa: 'atravessa ONDULANDO, rente ao chão' },
  coringa: { gol: 'VIRA NO AR feito carta sendo dada', festa: 'atravessa a tela aos pulos' },
  abelha:  { gol: 'chega ZUMBINDO e para no ar', festa: 'atravessa a tela VOANDO' },
  generico:{ gol: 'CARIMBA a tela', festa: 'atravessa a tela aos pulos' },
}
const jeito = JEITOS[arg('jeito', 'generico')] || JEITOS.generico
// 🇧🇷 ARTIGO (o/a) da mascote. Antes era ADIVINHADO pela 1ª letra, e errava:
// "O Esquecido" (Esqueceram do Lluch FC, 28/08) virava "a Esquecido" porque
// começa com E. Agora manda o artigo que o PRÓPRIO nome já traz — "O Papão" é
// ele, "A Águia" é ela. Sem artigo no nome, aí sim cai no palpite pela letra.
const art = /^A\s/i.test(o.mascoteNome) ? true
  : /^O\s/i.test(o.mascoteNome) ? false
  : /^[AÁE]/i.test(o.mascoteNome)
const mascCurto = o.mascoteNome.replace(/^(O|A)\s+/i, '')

// 🎽 O MANTO NO POST: se o dono mandou a CAMISA, é ela que aparece — foi o que
// o Diego cobrou ("a camisa eu mandei pra você, cara"), e ele tem razão: a arte
// que o dono pagou/pediu é sempre melhor que qualquer desenho meu.
// O desenho abaixo é só o PLANO B, pra batismo que não veio com camisa.
// As camisas ficam em `scripts/kits/` — NÃO em `src/escalacao/img/`: elas são
// do post, não do jogo (no jogo o manto é listra em CSS, 0 KB), então não
// entram no bundle nem contam no teto de peso do batismo.
const camisaDesenhada = `
<svg viewBox="0 0 200 230" style="width:190px;height:auto">
  <defs><clipPath id="c"><path d="M100 16c-10 0-18 5-28 7L28 34 12 76l30 12 6-10v134c0 4 3 7 7 7h90c4 0 7-3 7-7V78l6 10 30-12-16-42-44-11c-10-2-18-7-28-7z"/></clipPath></defs>
  <g clip-path="url(#c)">
    <rect x="0" y="0" width="200" height="230" fill="${o.c1}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${8 + i * 24}" y="0" width="12" height="230" fill="${o.c2}"/>`).join('')}
  </g>
  <path d="M100 16c-10 0-18 5-28 7L28 34 12 76l30 12 6-10v134c0 4 3 7 7 7h90c4 0 7-3 7-7V78l6 10 30-12-16-42-44-11c-10-2-18-7-28-7z" fill="none" stroke="#0C0C0C" stroke-width="6" stroke-linejoin="round"/>
  <path d="M72 23c8 12 20 18 28 18s20-6 28-18" fill="none" stroke="#0C0C0C" stroke-width="6" stroke-linejoin="round"/>
  <image href="${img(o.escudo)}" x="106" y="92" width="38" height="38" preserveAspectRatio="xMidYMid meet"/>
</svg>`
const camisa = o.camisa
  ? `<img class="kit" src="${img(o.camisa)}" alt="Manto do ${o.clube}">`
  : camisaDesenhada

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url(${fonte(500)}) format('woff2');font-weight:500}
@font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:890px;background:#F4ECD6;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#0C0C0C;padding:34px 30px 22px}
.osw{font-family:Oswald,sans-serif;text-transform:uppercase}
.pill{display:inline-flex;align-items:center;gap:9px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:9px 20px;font-weight:700;font-size:17px;letter-spacing:.10em;box-shadow:4px 4px 0 #0C0C0C}
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:74px;line-height:.98;letter-spacing:-.01em;margin:22px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:19px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:16px;max-width:800px}
.lead b{color:#0C0C0C}
.card{border:4px solid #0C0C0C;border-radius:22px;box-shadow:6px 6px 0 #0C0C0C;overflow:hidden;background:#fff}
.hero{margin-top:24px;display:flex;gap:22px;align-items:center;padding:22px;
  background:linear-gradient(105deg,#FFC400 0%,#FFD84D 46%,#E8A800 100%)}
/* 📐 A CAIXA SEGUE A ARTE, não o contrário (Diego 23/08: *"tá mt desproporcional
   o escudo no encaixe da janela.. n está igual o do coringas"*).
   ⚠️ A CAUSA REAL não era o CSS, era o ARQUIVO: o webp do Papão vinha 150x360 com
   ~100px de MOLDURA VAZIA (poeira de alfa quase invisível, que o bbox lia como
   desenho). O navegador encaixava a moldura, não o escudo — por isso sobrava
   branco por todo lado. Está na regra 3 do CLAUDE.md e passou batido; a conferência
   virou passo fixo (medir bbox com alfa >= 40, não bbox cru).
   Aqui a altura manda e a largura acompanha a proporção REAL do arquivo. Sem
   min-width largo: escudo estreito ganha caixa estreita e CHEIA, igual o Coringas. */
.hero .esc{background:#fff;border:4px solid #0C0C0C;border-radius:18px;padding:14px;flex:none;
  min-width:110px;height:210px;display:flex;align-items:center;justify-content:center}
.hero .esc img{height:100%;width:auto;max-width:260px;display:block;object-fit:contain}
.hero h2{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:46px;line-height:1.02}
/* ⚠️ line-height apertado CORTA o til/acento das maiúsculas (o "Ã" de BIGÃO
   sumia no cartão dourado). Nome de clube brasileiro tem acento — o respiro
   aqui não é estética, é pra não sair errado no post. */
.hero h2 small{display:block;font-size:29px;font-weight:600;opacity:.82;line-height:1.12}
.cor{display:inline-flex;align-items:center;gap:8px;background:rgba(12,12,12,.10);border-radius:999px;
  padding:7px 16px;font-weight:700;font-size:16px;margin-top:12px}
.hero p{font-size:15.5px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:12px;max-width:420px}
.dois{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
.tit{background:#0C0C0C;color:#fff;font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:17px;letter-spacing:.14em;padding:11px 18px;display:flex;align-items:center;gap:9px}
.corpo{padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px}
/* o mascote também ocupava pouco do cartão: 186px num corpo de 274. Sobe pra 232
   e o cartão cresce junto, pra a fera não ficar perdida no meio do branco. */
.corpo img{max-height:232px;max-width:100%;display:block}
/* 🎽 o MANTO mostra as DUAS coisas (pedido do Diego 17/08): a faixa de listras
   lisas, que é como o jogo pinta o time, E a camisa montada com o escudo. */
.manto{display:flex;align-items:center;gap:16px}
/* 🎽 mesma história do escudo: a camisa do Papão vinha 175x620 e MAIS DA METADE
   do arquivo era vazio (o desenho ocupava só as linhas 144→465). Encaixando pela
   altura, o navegador esticava o VAZIO e a camisa saía uma tirinha de ~65px do
   lado de uma faixa de listras de 84px — *"está mt pequena do lado do manto"*.
   Recortada no limite, ela fica 175x321 e enche os 232px de altura. */
.manto .kit{height:232px;width:auto;display:block;object-fit:contain}
.listras{width:84px;height:232px;border:3px solid #0C0C0C;border-radius:12px;flex:none;
  background:repeating-linear-gradient(90deg,${o.c1} 0 15px,${o.c2} 15px 26px)}
.leg{text-align:center;font-size:14.5px;line-height:1.35;color:rgba(12,12,12,.62);margin-top:12px}
.leg b{color:#0C0C0C}
.anim{margin-top:20px}
.linha{display:flex;gap:14px;padding:16px 18px;border-bottom:2px solid rgba(12,12,12,.09);align-items:flex-start}
.linha:last-child{border-bottom:0}
.ic{flex:none;width:42px;height:42px;border-radius:11px;background:#C2452F;border:3px solid #0C0C0C;
  display:flex;align-items:center;justify-content:center;font-size:20px}
.linha p{font-size:16px;line-height:1.42;color:rgba(12,12,12,.75)}
.linha p b{color:#0C0C0C}
.pe{margin-top:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;
  background:linear-gradient(100deg,#FFE9A8 0%,#FFC400 100%)}
.pe .q{font-family:Oswald,sans-serif;text-transform:uppercase;font-size:14px;font-weight:600;letter-spacing:.16em;opacity:.62}
.pe .n{font-family:Oswald,sans-serif;font-weight:700;font-size:34px;line-height:1}
.selos{display:flex;gap:12px}
.selo{background:#0C0C0C;color:#fff;border-radius:14px;padding:10px 16px;text-align:center;min-width:96px}
.selo .e{font-size:22px;line-height:1}
.selo .t{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;font-size:13px;letter-spacing:.10em;margin-top:3px}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding:0 4px}
.marca{font-family:Oswald,sans-serif;font-weight:700;font-size:22px;display:flex;align-items:center;gap:8px}
.marca span{color:#C2452F}
.site{font-size:14px;color:rgba(12,12,12,.42)}
</style>
<div class="pill">${o.mascoteEmoji} ${o.socio ? 'CLUBE DE SÓCIO' : 'BATISMO DE LENDA'}</div>
<h1>${o.socio ? 'Chegou o' : 'Nasceu o'}<br><span class="r">${destaque}</span>${resto ? `<br>${resto}` : ''}</h1>
<p class="lead">${o.socio
  ? `O clube ${o.dono ? `do <b>${o.dono}</b>` : ''} agora tem <b>escudo, mascote e manto no jogo</b> — ${cores}, com ${art ? 'a' : 'o'} ${mascCurto} de mascote. Clube próprio de sócio: <b>não tira o lugar de ninguém</b> na pirâmide.`
  : `O clube ${o.dono ? `do <b>${o.dono}</b>` : ''} chega na <b>Série ${o.serie}</b>${o.antigo ? ` no lugar do ${o.antigo}` : ''} — ${cores}, com ${art ? 'a' : 'o'} ${mascCurto} de mascote.`}</p>

<div class="card hero">
  <div class="esc"><img src="${img(o.escudo)}"></div>
  <div>
    <h2>${destaque}${resto ? `<small>${resto}</small>` : ''}</h2>
    ${o.coracao ? `<div class="cor">❤️ Coração: ${o.coracao}</div>` : ''}
    <p>${cores[0].toUpperCase() + cores.slice(1)}.${o.socio ? ' Clube próprio do sócio — entra em campo com a cara dele, sem tirar o lugar de nenhum time.' : (o.antigo ? ` Entra no lugar do ${o.antigo} — mesma vaga, mesmo elenco, cara nova.` : '')}</p>
  </div>
</div>

<div class="dois">
  <div class="card"><div class="tit">${o.mascoteEmoji} Mascote</div>
    <div class="corpo"><img src="${img(o.mascote)}">
      <div class="leg"><b>${o.mascoteNome}</b><br>${jeito.gol.toLowerCase()} no gol</div></div></div>
  <div class="card"><div class="tit">👕 Manto</div>
    <div class="corpo">
      <div class="manto">
        <div class="listras"></div>
        ${camisa}
      </div>
      <div class="leg">${o.camisa ? 'O manto do clube' : 'Listras'}:<br>${cores} (igual no jogador)</div></div></div>
</div>

<div class="card anim">
  <div class="tit">🎬 Onde ${art ? 'a' : 'o'} ${mascCurto} aparece</div>
  <div class="linha"><div class="ic">⚽</div><p><b>No placar, quando o time faz gol:</b> ${art ? 'a' : 'o'} ${mascCurto} <b>${jeito.gol}</b> por cima do resultado e some sozinh${art ? 'a' : 'o'}. Não para o relógio, não pede toque.</p></div>
  <div class="linha"><div class="ic">🏆</div><p><b>Quando é CAMPEÃO:</b> depois do apito, ${art ? 'a' : 'o'} ${mascCurto} toma a tela inteira e <b>${jeito.festa}</b>, com chuva de confete e o nome do clube. Só o campeão vê, uma vez só.</p></div>
  <div class="linha"><div class="ic">🥅</div><p><b>No pênalti decisivo:</b> converteu? ${art ? 'A' : 'O'} ${mascCurto} aparece <b>comemorando na narração</b>, junto com o gol.</p></div>
</div>

<div class="card pe">
  <div><div class="q">${o.socio ? 'Clube de' : 'Batizado por'}</div><div class="n">${o.dono || '—'}${o.insta ? `<span style="font-family:system-ui;font-weight:800;font-size:15px;color:rgba(0,0,0,.55);margin-left:9px">@${o.insta.replace(/^@/, '')}</span>` : ''}</div></div>
  <div class="selos">
    <div class="selo"><div class="e">👑</div><div class="t">Lenda</div></div>
    ${o.socioN ? `<div class="selo"><div class="e">🎫</div><div class="t">Sócio nº${o.socioN}</div></div>` : ''}
    ${o.fundador ? `<div class="selo"><div class="e">🏛️</div><div class="t">Fundador nº${o.fundador}</div></div>` : ''}
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 890, height: 1400 }, deviceScaleFactor: o.escala || 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)

// 📏 CONFERÊNCIA DE MOLDURA (nasceu do erro do Papão, 23/08)
// O escudo e a camisa saíam pequenos no post e a culpa parecia do CSS. Não era:
// os arquivos tinham MOLDURA VAZIA dentro (a camisa era metade vazio). O
// navegador encaixa o ARQUIVO, então ele encaixava o vazio junto e a arte
// encolhia. Aqui o próprio navegador mede o desenho de verdade (alfa >= 40) e
// avisa antes de o post ir pro Diego — assim nenhum batismo repete isso.
const sobras = await page.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('.hero .esc img, .corpo img, .manto .kit')) {
    const w = el.naturalWidth, h = el.naturalHeight
    if (!w || !h) continue
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const g = c.getContext('2d'); g.drawImage(el, 0, 0)
    const d = g.getImageData(0, 0, w, h).data
    let x0 = w, y0 = h, x1 = -1, y1 = -1
    for (let y = 0; y < h; y++) {
      let n = 0, xa = w, xb = -1
      for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] >= 40) { n++; if (x < xa) xa = x; if (x > xb) xb = x }
      if (n >= 3) { if (y < y0) y0 = y; y1 = y; if (xa < x0) x0 = xa; if (xb > x1) x1 = xb }
    }
    if (x1 < 0) continue
    const dw = x1 - x0 + 1, dh = y1 - y0 + 1
    out.push({ src: el.src.split('/').pop(), arquivo: `${w}x${h}`, desenho: `${dw}x${dh}`,
               sobra: Math.round(100 * (1 - (dw * dh) / (w * h))) })
  }
  return out
})
for (const s of sobras) {
  if (s.sobra >= 4) console.log(`⚠️  ${s.src}: arquivo ${s.arquivo} mas o desenho é só ${s.desenho} (${s.sobra}% de moldura vazia) — RECORTAR antes de mandar o post, senão a arte sai pequena na janela.`)
}
if (!sobras.some(s => s.sobra >= 4)) console.log('📏 arte encaixada: nenhum arquivo com moldura vazia sobrando.')

await page.screenshot({ path: o.saida, fullPage: true })
await browser.close()
console.log(`${o.saida} · ${(fs.statSync(o.saida).size / 1024).toFixed(0)} KB`)
