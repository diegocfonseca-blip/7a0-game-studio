#!/usr/bin/env node
// ─── 🛡️ MOCKUP: o convite que nasce DEPOIS do bicho passar ──────────────────
//
// Pergunta do Diego (24/09): *"como bolar ideias pra quem tá no online fazer mais
// mascote, escudo etc… eles verem realmente que é top e dar gostinho de água na
// boca?"*.
//
// A ideia: hoje a mascote de um batizado atravessa a tela de TODO MUNDO — e quem
// não tem acha lindo, mas **não faz ideia de que aquilo é comprável**. Falta a
// ponte. Então, quando a animação ACABA, quem NÃO tem clube batizado recebe uma
// linha miúda com o convite, e o clique abre o batismo.
//
// ⚠️ TRÊS REGRAS DELE QUE ESTE DESENHO RESPEITA:
//   1. 🎭 *"quando solta o mascote não precisa frase subindo, já tem o mascote
//      passando"* (21/09) — por isso o convite entra **DEPOIS** que o bicho sai,
//      nunca por cima dele.
//   2. 🚫 nada de placeholder pra quem não comprou — não existe escudo cinza
//      "bloqueado" em lugar nenhum; o que aparece é o clube de quem TEM.
//   3. ⏱️ nada atrasa o jogo — é a mesma faixa das reações, que já existe e some
//      sozinha.
//
// E o convite aparece **UMA VEZ POR SALA**. Duas já é propaganda.
//
// Rodar: node scripts/mockup-convite-mascote.mjs /tmp/convite.png
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const arte = p => `data:image/webp;base64,${readFileSync(`${ROOT}/${p}`).toString('base64')}`
const MASCOTE = arte('src/escalacao/img/pantera-mascote.webp')

const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// as 3 formas de escrever o convite — a régua é a mesma: UMA linha, miúda,
// com o nome de quem tem na frente (é o dono que dá a prova, não a propaganda).
const OPCOES = [
  { id: 'A', tit: 'Direto ao ponto',
    txt: `🛡️ Esse é o clube do <b>Pantera Negra FC</b>. O seu também pode ter. <a>quero o meu</a>`,
    nota: 'A mais curta. Diz o essencial: aquilo tem dono, e você pode ser um.' },
  { id: 'B', tit: 'Explicando o que é',
    txt: `🛡️ <b>Pantera Negra FC</b> é um clube batizado — escudo e mascote próprios. <a>como consigo?</a>`,
    nota: 'Ensina o nome da coisa ("clube batizado"). Boa pra quem nunca ouviu falar.' },
  { id: 'C', tit: 'Provocando',
    txt: `🛡️ Mascote pulando na tela é coisa de <b>clube batizado</b>. O seu ainda não tem. <a>quero o meu</a>`,
    nota: 'A mais provocativa. Cutuca — mas também é a que mais pode soar cobrança.' },
]

const fone = (corpo, alt = 250) => `<div class="fone" style="height:${alt}px">${corpo}</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE9DA;font-family:system-ui;color:${INK};padding:26px}
.wrap{max-width:1180px;margin:0 auto}
h1{${OSW};font-size:21px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
.sub{font-size:13px;font-weight:600;color:#3d3a30;margin-bottom:18px;line-height:1.5}
.linha{display:flex;gap:18px;align-items:flex-start;margin-bottom:26px}
.col{width:340px}
.passo{${OSW};font-size:12.5px;letter-spacing:1px;text-transform:uppercase;color:rgba(12,12,12,.45);margin-bottom:7px}
.fone{background:${CREME};border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:12px;position:relative;overflow:hidden}
.bal{display:inline-flex;align-items:center;gap:6px;background:#fff;border:2px solid ${INK};border-radius:999px;padding:4px 10px;box-shadow:2px 2px 0 ${INK};font-size:11px;font-weight:700;margin-top:6px}
/* ⚠️ NADA de display:flex aqui — o <b> do nome do clube virava COLUNA e a frase
   se despedaçava (1º corte). A linha é texto corrido, como toda reação do jogo. */
.conv{display:block;background:#fff;border:2px solid ${INK};border-radius:12px;box-shadow:2px 2px 0 ${INK};
  padding:8px 11px;font-size:11.5px;font-weight:700;color:rgba(12,12,12,.62);line-height:1.5}
.conv b{color:rgba(12,12,12,.85)}
.conv a{color:${ROXO};text-decoration:underline;white-space:nowrap}
.cap{font-size:12px;font-weight:500;color:#3d3a30;line-height:1.5;margin-top:9px}
.nota{background:#fff;border:3px solid ${INK};border-radius:13px;padding:12px 14px;font-size:12.5px;font-weight:500;line-height:1.6;color:#3d3a30;margin-top:6px}
.nota b{font-weight:700}
</style></head><body><div class="wrap">

<h1>🛡️ O convite nasce depois do bicho passar</h1>
<p class="sub">Quem <b>não tem</b> clube batizado vê a mascote de outro atravessar a tela — acha lindo — e não sabe que aquilo é comprável. O convite entra <b>quando a animação acaba</b>, nunca por cima dela, e <b>uma vez por sala</b>.</p>

<div class="linha">
  <div class="col">
    <p class="passo">① agora · o bicho atravessa</p>
    ${fone(`<img src="${MASCOTE}" style="height:196px;position:absolute;left:38%;bottom:26px">
      <span style="position:absolute;left:12px;bottom:12px;width:96px;height:11px;border-radius:99px;background:rgba(0,0,0,.18)"></span>`)}
    <p class="cap"><b>Nada muda aqui.</b> É o que já acontece hoje — e é exatamente o que ele mandou não poluir: animação grande não leva legenda em cima.</p>
  </div>
  <div class="col">
    <p class="passo">② 1 segundo depois · o convite</p>
    ${fone(`<div style="position:absolute;left:12px;right:12px;bottom:12px">
      <div class="conv">${OPCOES[0].txt}</div></div>
      <p style="${OSW};font-size:11px;color:rgba(12,12,12,.3);text-align:center;margin-top:8px">a tela do jogo segue igual atrás</p>`)}
    <p class="cap">Entra na <b>mesma faixa das reações</b> que já existe, some sozinha, e não pede toque nenhum pra continuar jogando.</p>
  </div>
  <div class="col">
    <p class="passo">③ quem TEM clube batizado</p>
    ${fone(`<img src="${MASCOTE}" style="height:196px;position:absolute;left:38%;bottom:26px">
      <span style="position:absolute;left:12px;bottom:12px;width:96px;height:11px;border-radius:99px;background:rgba(0,0,0,.18)"></span>`)}
    <p class="cap"><b>Não vê convite nenhum, nunca.</b> Quem já comprou não leva propaganda — vê só o bicho, como sempre.</p>
  </div>
</div>

<h1>Os 3 jeitos de escrever a linha</h1>
<p class="sub">A régua é a mesma nos três: uma linha só, miúda, com o <b>nome de quem tem</b> na frente — é o dono que dá a prova, não a propaganda.</p>
<div class="linha">
  ${OPCOES.map(o => `<div class="col">
    <p class="passo">opção ${o.id} · ${o.tit}</p>
    <div class="conv">${o.txt}</div>
    <p class="cap">${o.nota}</p>
  </div>`).join('')}
</div>

<div class="nota">⏱️ <b>Uma vez por sala, e só pra quem não tem.</b> Na segunda mascote que pular, ninguém vê convite nenhum — duas vezes já é propaganda, e propaganda no meio do pregão é exatamente o que atrasa o ritmo. O clique abre o <b>batismo</b> direto (a mesma tela do botão 💛), sem passar por menu.</div>

</div></body></html>`

const out = process.argv[2] ?? 'mockup-convite-mascote.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-convite-mascote.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
