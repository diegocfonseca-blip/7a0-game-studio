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
//   1. pílula "BATISMO DE LENDA"
//   2. manchete "NASCEU O <CLUBE>" (a 1ª palavra do nome sai em vermelho)
//   3. uma frase explicando quem é o dono, a divisão e de quem tomou a vaga
//   4. cartão dourado: escudo + nome + coração + o resumo do clube
//   5. mascote e manto lado a lado
//   6. 🎬 "ONDE A <MASCOTE> APARECE" — as TRÊS animações, escritas pro jogador
//   7. rodapé: quem batizou + os selos (Lenda / fundador nº)
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
  dono: arg('dono', ''), coracao: arg('coracao', ''), fundador: arg('fundador', ''),
  saida: arg('saida', 'mockup-batismo.png'),
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
const destaque = partes[0].toUpperCase()
const resto = partes.slice(1).join(' ').toUpperCase()

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
const art = /^[AÁE]/i.test(o.mascoteNome.replace(/^(O|A)\s+/i, '')) || /^A\s/i.test(o.mascoteNome)
const mascCurto = o.mascoteNome.replace(/^(O|A)\s+/i, '')

// 🎽 o MANTO é desenhado aqui (camisa genérica, listras nas 2 cores do clube).
// É molde do POST, não arte de batismo — não entra no jogo nem pesa no bundle.
const camisa = `
<svg viewBox="0 0 200 230" style="width:190px;height:auto">
  <defs><clipPath id="c"><path d="M100 16c-10 0-18 5-28 7L28 34 12 76l30 12 6-10v134c0 4 3 7 7 7h90c4 0 7-3 7-7V78l6 10 30-12-16-42-44-11c-10-2-18-7-28-7z"/></clipPath></defs>
  <g clip-path="url(#c)">
    <rect x="0" y="0" width="200" height="230" fill="${o.c1}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${8 + i * 24}" y="0" width="12" height="230" fill="${o.c2}"/>`).join('')}
  </g>
  <path d="M100 16c-10 0-18 5-28 7L28 34 12 76l30 12 6-10v134c0 4 3 7 7 7h90c4 0 7-3 7-7V78l6 10 30-12-16-42-44-11c-10-2-18-7-28-7z" fill="none" stroke="#0C0C0C" stroke-width="6" stroke-linejoin="round"/>
  <path d="M72 23c8 12 20 18 28 18s20-6 28-18" fill="none" stroke="#0C0C0C" stroke-width="6" stroke-linejoin="round"/>
  <!-- ⚠️ o corpo da camisa vai de x=48 a x=152. O escudo TEM que caber aí dentro:
       antes ele estava em x=112 com 46 de largura (ia até 158) e vazava pra fora
       do desenho, que foi o que o Diego viu. -->
  <image href="${img(o.escudo)}" x="106" y="92" width="38" height="38" preserveAspectRatio="xMidYMid meet"/>
</svg>`

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
.hero .esc{background:#fff;border:4px solid #0C0C0C;border-radius:18px;padding:12px;flex:none;
  width:186px;height:186px;display:flex;align-items:center;justify-content:center}
.hero .esc img{max-width:100%;max-height:100%;display:block}
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
.corpo{padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:250px}
.corpo img{max-height:186px;max-width:100%;display:block}
/* 🎽 o MANTO mostra as DUAS coisas (pedido do Diego 17/08): a faixa de listras
   lisas, que é como o jogo pinta o time, E a camisa montada com o escudo. */
.manto{display:flex;align-items:center;gap:16px}
.listras{width:74px;height:186px;border:3px solid #0C0C0C;border-radius:12px;flex:none;
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
<div class="pill">${o.mascoteEmoji} BATISMO DE LENDA</div>
<h1>Nasceu o<br><span class="r">${destaque}</span>${resto ? `<br>${resto}` : ''}</h1>
<p class="lead">O clube ${o.dono ? `do <b>${o.dono}</b>` : ''} chega na <b>Série ${o.serie}</b>${o.antigo ? ` no lugar do ${o.antigo}` : ''} — ${cores}, com ${art ? 'a' : 'o'} ${mascCurto} de mascote.</p>

<div class="card hero">
  <div class="esc"><img src="${img(o.escudo)}"></div>
  <div>
    <h2>${destaque}${resto ? `<small>${resto}</small>` : ''}</h2>
    ${o.coracao ? `<div class="cor">❤️ Coração: ${o.coracao}</div>` : ''}
    <p>${cores[0].toUpperCase() + cores.slice(1)}.${o.antigo ? ` Entra no lugar do ${o.antigo} — mesma vaga, mesmo elenco, cara nova.` : ''}</p>
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
      <div class="leg">Listras:<br>${cores} (igual no jogador)</div></div></div>
</div>

<div class="card anim">
  <div class="tit">🎬 Onde ${art ? 'a' : 'o'} ${mascCurto} aparece</div>
  <div class="linha"><div class="ic">⚽</div><p><b>No placar, quando o time faz gol:</b> ${art ? 'a' : 'o'} ${mascCurto} <b>${jeito.gol}</b> por cima do resultado e some sozinh${art ? 'a' : 'o'}. Não para o relógio, não pede toque.</p></div>
  <div class="linha"><div class="ic">🏆</div><p><b>Quando é CAMPEÃO:</b> depois do apito, ${art ? 'a' : 'o'} ${mascCurto} toma a tela inteira e <b>${jeito.festa}</b>, com chuva de confete e o nome do clube. Só o campeão vê, uma vez só.</p></div>
  <div class="linha"><div class="ic">🥅</div><p><b>No pênalti decisivo:</b> converteu? ${art ? 'A' : 'O'} ${mascCurto} aparece <b>comemorando na narração</b>, junto com o gol.</p></div>
</div>

<div class="card pe">
  <div><div class="q">Batizado por</div><div class="n">${o.dono || '—'}</div></div>
  <div class="selos">
    <div class="selo"><div class="e">👑</div><div class="t">Lenda</div></div>
    ${o.fundador ? `<div class="selo"><div class="e">🏛️</div><div class="t">Fundador nº${o.fundador}</div></div>` : ''}
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 890, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: o.saida, fullPage: true })
await browser.close()
console.log(`${o.saida} · ${(fs.statSync(o.saida).size / 1024).toFixed(0)} KB`)
