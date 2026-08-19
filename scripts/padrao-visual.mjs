#!/usr/bin/env node
// ─── 🎨 PADRÃO VISUAL DA CASA — a folha oficial ──────────────────────────────
//
// O Diego perguntou (19/08): *"como é nosso padrão visual hoje de fontes artes
// e etc"*. Isto responde numa folha só, e existe pra ele PODER MANDAR: colar no
// GPT/Gemini quando for pedir arte, ou mandar pra um designer.
//
// ⚠️ TODO valor aqui foi LIDO DO CÓDIGO, não da memória:
//   · cores: `src/escalacao/screens.tsx` (CREAM, INK, GOLD, GREEN, RED, PURPLE)
//   · tiers: `src/escalacao/apoio.tsx` (APOIO_PERKS)
//   · fontes: `index.html`
//   · tetos de peso: `CLAUDE.md`
// Se mudar no código, mudar AQUI junto — senão a folha vira mentira.
//
//   node scripts/padrao-visual.mjs --saida /tmp/padrao.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'padrao-visual.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

// ── as cores, direto de screens.tsx ────────────────────────────────────────
const CORES = [
  { hex: '#F4ECD6', nome: 'Creme', uso: 'fundo de tudo', ink: '#0C0C0C' },
  { hex: '#0C0C0C', nome: 'Tinta', uso: 'texto, borda, sombra', ink: '#fff' },
  { hex: '#FFC400', nome: 'Dourado', uso: 'destaque, Lenda, moeda', ink: '#0C0C0C' },
  { hex: '#1B7A3D', nome: 'Verde', uso: 'confirmar, gol, campo', ink: '#fff' },
  { hex: '#E8503A', nome: 'Vermelho', uso: 'alerta, manchete', ink: '#fff' },
  { hex: '#C2452F', nome: 'Vermelho escuro', uso: 'título, marca', ink: '#fff' },
  { hex: '#7C3AED', nome: 'Roxo', uso: 'promessa, 💎', ink: '#fff' },
]

// ── os 5 tiers, direto de apoio.tsx (APOIO_PERKS) ──────────────────────────
const TIERS = [
  { n: 'Bege', s: '', g: 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)', ink: '#0C0C0C', o: 'grátis' },
  { n: 'Verde', s: '', g: 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)', ink: '#fff', o: 'apoiador' },
  { n: 'Roxo', s: '💎', g: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)', ink: '#fff', o: 'brilho 30%' },
  { n: 'Prata', s: '⭐', g: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)', ink: '#0C0C0C', o: 'Craque · brilho 50%' },
  { n: 'Ouro', s: '👑', g: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', ink: '#0C0C0C', o: 'Lenda · brilho 75%' },
]

const PESOS = [
  { o: 'Escudo de clube', t: '360px no lado maior', p: '≤ 30 KB', n: 'na tela nunca passa de 78px' },
  { o: 'Mascote', t: '440px no lado maior', p: '≤ 45 KB', n: 'na tela: 176px' },
  { o: 'Rosto de jogador', t: '256px no lado maior', p: '≤ 14 KB', n: 'campinho 96px · carta 100px' },
  { o: 'Total por batismo', t: 'escudo + mascote', p: '≤ 75 KB', n: 'passou disso, recomprimir' },
]

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;background:#F4ECD6;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#0C0C0C;padding:34px 30px 26px}
.pill{display:inline-flex;align-items:center;gap:9px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:9px 20px;font-weight:700;font-size:16px;letter-spacing:.10em;box-shadow:4px 4px 0 #0C0C0C;
  font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:62px;line-height:.98;margin:20px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:17.5px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:13px;max-width:900px}
.lead b{color:#0C0C0C}
h2{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:23px;margin:28px 0 12px;
  letter-spacing:.03em;display:flex;align-items:baseline;gap:10px}
h2 small{font-family:system-ui,sans-serif;font-size:13.5px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.48)}
.cores{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.cor{border:3.5px solid #0C0C0C;border-radius:14px;box-shadow:4px 4px 0 #0C0C0C;overflow:hidden}
.cor .amostra{height:76px;display:flex;align-items:flex-end;padding:8px 10px;font-family:Oswald,sans-serif;
  font-weight:700;font-size:15px;letter-spacing:.06em}
.cor .pe{background:#fff;padding:7px 10px 9px;border-top:3.5px solid #0C0C0C}
.cor .n{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:14px}
.cor .u{font-size:11px;font-weight:700;color:rgba(12,12,12,.5);margin-top:1px}
.tiers{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.tier{border:3.5px solid #0C0C0C;border-radius:14px;box-shadow:4px 4px 0 #0C0C0C;overflow:hidden;text-align:center}
.tier .a{height:78px;display:flex;align-items:center;justify-content:center;font-size:30px}
.tier .pe{background:#fff;padding:7px 6px 9px;border-top:3.5px solid #0C0C0C}
.tier .n{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:14px}
.tier .u{font-size:10.5px;font-weight:700;color:rgba(12,12,12,.5)}
.duas{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.card{border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;overflow:hidden}
.card .tit{background:#0C0C0C;color:#fff;font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:14.5px;letter-spacing:.12em;padding:10px 16px}
.card .corpo{padding:14px 16px 16px}
.linha{display:flex;align-items:baseline;gap:8px;padding:6px 0;border-bottom:1.5px solid rgba(12,12,12,.08);font-size:14.5px}
.linha:last-child{border-bottom:0}
.linha b{font-family:Oswald,sans-serif;text-transform:uppercase;font-size:13px;letter-spacing:.06em;min-width:118px;flex:none}
.linha span{font-weight:600;color:rgba(12,12,12,.75)}
.amostras{display:flex;gap:14px;align-items:flex-end;padding:6px 0 2px}
.ex1{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:34px;line-height:1}
.ex2{font-family:Oswald,sans-serif;font-weight:600;text-transform:uppercase;font-size:17px;letter-spacing:.10em}
.ex3{font-size:15px;font-weight:600;color:rgba(12,12,12,.7)}
.demo{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:4px}
.btn{border:3px solid #0C0C0C;border-radius:12px;box-shadow:3px 3px 0 #0C0C0C;padding:9px 16px;
  font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:15px;letter-spacing:.04em}
.peso{width:100%;border-collapse:collapse;font-size:14px}
.peso th{font-family:Oswald,sans-serif;text-transform:uppercase;font-size:11.5px;letter-spacing:.10em;
  text-align:left;color:rgba(12,12,12,.45);padding:0 8px 6px 0}
.peso td{padding:7px 8px 7px 0;border-top:1.5px solid rgba(12,12,12,.09);font-weight:600;vertical-align:top}
.peso td.o{font-family:Oswald,sans-serif;text-transform:uppercase;font-size:13.5px;font-weight:700}
.peso td.p{font-family:Oswald,sans-serif;font-weight:700;color:#C2452F;white-space:nowrap}
.peso td.n{font-size:12px;color:rgba(12,12,12,.5)}
.prompt{background:#FFF6DF;border:3px dashed #0C0C0C;border-radius:14px;padding:14px 16px;margin-top:14px;
  font-size:14.5px;line-height:1.5;font-weight:600}
.prompt b{background:#FFC400;padding:0 4px;border-radius:4px}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 4px}
.marca{font-family:Oswald,sans-serif;font-weight:700;font-size:21px;display:flex;align-items:center;gap:8px}
.marca span{color:#C2452F}
.site{font-size:13px;color:rgba(12,12,12,.42)}
</style>
<div class="pill">🎨 Padrão visual da casa</div>
<h1>A cara do <span class="r">Leilão Legends</span></h1>
<p class="lead">Tudo aqui foi <b>lido do código do jogo</b>, não de memória. Serve pra colar no GPT quando for pedir
arte, ou pra mandar pra um designer — se a peça seguir esta folha, ela entra no jogo sem retoque.</p>

<h2>1 · Cores <small>são estas e só estas — nada de tom novo</small></h2>
<div class="cores">${CORES.map(c => `
  <div class="cor">
    <div class="amostra" style="background:${c.hex};color:${c.ink}">${c.hex}</div>
    <div class="pe"><div class="n">${c.nome}</div><div class="u">${c.uso}</div></div>
  </div>`).join('')}</div>

<h2>2 · Fonte <small>duas, e cada uma no seu lugar</small></h2>
<div class="duas">
  <div class="card"><div class="tit">Oswald — títulos e números</div><div class="corpo">
    <div class="amostras"><span class="ex1">Nasceu o clube</span></div>
    <div class="amostras"><span class="ex2">Batismo de lenda</span></div>
    <div class="linha"><b>Peso</b><span>700 a 900 (bem grosso)</span></div>
    <div class="linha"><b>Caixa</b><span>MAIÚSCULA em título e selo</span></div>
    <div class="linha"><b>Espaço</b><span>letras coladas no título, abertas no selo</span></div>
  </div></div>
  <div class="card"><div class="tit">Inter — texto que se lê</div><div class="corpo">
    <div class="amostras"><span class="ex3">Explicação curta, direta, sem tecniquês — sempre embaixo do botão que ela explica.</span></div>
    <div class="linha"><b>Peso</b><span>600 a 800</span></div>
    <div class="linha"><b>Tamanho</b><span>9 a 15px na tela do jogo</span></div>
    <div class="linha"><b>Cor</b><span>tinta a 45–75% (nunca cinza claro)</span></div>
  </div></div>
</div>

<h2>3 · O traço <small>é isto que faz parecer o nosso jogo</small></h2>
<div class="card"><div class="corpo">
  <div class="demo">
    <div class="btn" style="background:#FFC400">Dourado</div>
    <div class="btn" style="background:#1B7A3D;color:#fff">Verde</div>
    <div class="btn" style="background:#E8503A;color:#fff">Vermelho</div>
    <div class="btn" style="background:#fff">Branco</div>
    <div class="btn" style="background:#0C0C0C;color:#fff;box-shadow:3px 3px 0 #C2452F">Tinta</div>
  </div>
  <div class="linha" style="margin-top:10px"><b>Borda</b><span>preta, <b>3 a 4px</b> — grossa, sempre visível</span></div>
  <div class="linha"><b>Canto</b><span>arredondado <b>10 a 18px</b> (quanto maior a peça, maior o canto)</span></div>
  <div class="linha"><b>Sombra</b><span><b>dura e deslocada</b>: <code>3px 3px 0 #0C0C0C</code> ou <code>4px 4px 0</code>. Nunca sombra borrada.</span></div>
  <div class="linha"><b>Cor</b><span><b>chapada</b>. Degradê só nos tiers de apoio e no cartão dourado — em peça de arte, não.</span></div>
</div></div>

<h2>4 · As cores de quem apoia <small>cada um leva a cor do PRÓPRIO tier pra todo canto</small></h2>
<div class="tiers">${TIERS.map(t => `
  <div class="tier">
    <div class="a" style="background:${t.g};color:${t.ink}">${t.s || '&nbsp;'}</div>
    <div class="pe"><div class="n">${t.n}</div><div class="u">${t.o}</div></div>
  </div>`).join('')}</div>
<p class="lead" style="margin-top:10px;font-size:15px">⚠️ Regra que não se quebra: <b>gratuito vê bege, quem paga ouro vê ouro</b> — em todas as telas.
Nenhuma cor emprestada, nunca dourado fixo pra todo mundo.</p>

<h2>5 · Peso da arte <small>o que passa disso não entra</small></h2>
<div class="card"><div class="corpo">
  <table class="peso">
    <tr><th>O quê</th><th>Tamanho do arquivo</th><th>Teto</th><th>Por quê</th></tr>
    ${PESOS.map(p => `<tr><td class="o">${p.o}</td><td>${p.t}</td><td class="p">${p.p}</td><td class="n">${p.n}</td></tr>`).join('')}
  </table>
  <div class="prompt">
    <b>📋 Cola isto no GPT/Gemini</b><br><br>
    Ilustração de <b>[ESCUDO / MASCOTE / BUSTO DO JOGADOR]</b> — estilo vetorial chapado, cores sólidas,
    <b>contorno preto grosso</b>, sem degradê e sem textura. Paleta: preto #0C0C0C, creme #F4ECD6, dourado #FFC400,
    verde #1B7A3D, vermelho #E8503A, roxo #7C3AED (e as cores do clube quando houver).
    <b>Fundo branco liso</b> (ou transparente), peça centralizada, pouca margem sobrando.
    Entregar em <b>PNG 1024×1024</b>.
  </div>
</div></div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
