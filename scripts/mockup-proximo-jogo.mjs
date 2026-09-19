// ─── ⚔️ MOCKUP: A LINHA DO PRÓXIMO JOGO, MAIS SUTIL (Diego 19/09) ───────────
//
// Palavras dele, olhando a tela da sala em live: *"tá mt exagerado esse negócio de
// próximo jogo e equilíbrio retranca e ataque. Não precisa escrever o que é
// retranca, equilíbrio e ataque, só bote. E de forma mais sutil também o próximo
// jogo. Além disso, no próximo jogo, se tiver alguma rivalidade mostre se já teve
// jogo entre usuários APENAS. Se for usuário e bot não mostre nada. Mas se for
// entre dois usuários que já jogaram entre si, mostra quantidade de vitórias tipo
// Rivalidade V=2 D=1 ou algo do tipo. Mas só vale entre usuários"*.
//
// Três colunas: como está hoje · como fica · e o caso do clássico entre usuários.
// uso: node scripts/mockup-proximo-jogo.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'mockup-proximo-jogo.png')
const b64 = f => fs.readFileSync(f).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const CREME = '#F4ECD6', TINTA = '#0C0C0C', OURO = '#FFC400'

const botoes = `<div class="tres">
  <button>🧱 Retranca</button><button class="on">⚖️ Equilíbrio</button><button>🔥 Ataque</button>
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;font-weight:700;src:url(${fonte(700)}) format('woff2')}
*{box-sizing:border-box}
body{margin:0;background:${CREME};font:14px/1.45 Arial,sans-serif;color:${TINTA};padding:26px}
h1{font:800 20px Oswald;margin:0 0 4px}
.sub{font-size:12.5px;color:#6b6252;margin:0 0 20px}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:start}
.rotulo{font:800 12px Oswald;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px}
.caixa{background:#fff;border:3px solid ${TINTA};border-radius:16px;box-shadow:4px 4px 0 ${TINTA};padding:14px}
.caixa.ouro{background:${OURO}}
.tres{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.tres button{border:3px solid ${TINTA};border-radius:12px;padding:9px 2px;font:800 12px Oswald;background:#fff}
.tres button.on{background:${OURO};box-shadow:3px 3px 0 ${TINTA}}
/* como está HOJE */
.hoje .titulo{font:800 19px/1.2 Oswald;margin:0}
.hoje .casa{font-size:12px;color:rgba(0,0,0,.7)}
.hoje .explica{font-size:11px;font-weight:600;color:rgba(0,0,0,.7);margin:10px 0 0}
/* como FICA */
.novo .rot{font:800 10px Oswald;letter-spacing:1.4px;color:rgba(0,0,0,.45);text-transform:uppercase;margin:0 0 2px}
.novo .titulo{font:800 15px/1.25 Oswald;margin:0}
.novo .casa{font:700 10.5px Oswald;color:rgba(0,0,0,.5);text-transform:uppercase;letter-spacing:.6px}
.chip{display:inline-flex;align-items:center;gap:6px;margin-top:7px;border:2px solid ${TINTA};border-radius:999px;padding:3px 9px;font:800 11px Oswald;background:#fff}
.chip b{font:800 11px Oswald}
.nota{font-size:11px;color:#6b6252;margin:9px 2px 0;line-height:1.4}
</style>
<h1>⚔️ A linha do próximo jogo — mais sutil</h1>
<p class="sub">Mesma caixa, mesmo lugar na tela. Muda só o peso do texto e sai a explicação das táticas.</p>
<div class="cols">

  <div>
    <p class="rotulo">Hoje</p>
    <div class="caixa hoje">
      <p class="titulo">PRÓXIMO: Futpoint FC 👑 × Bagres de Wall Street FC <span class="casa">(em casa)</span></p>
      ${botoes}
      <p class="explica">Retranca segura ataque · ataque atropela equilíbrio · equilíbrio fura retranca.</p>
    </div>
    <p class="nota">O nome do jogo em 19px ocupa três linhas no celular, e a explicação das táticas aparece toda rodada — ele já sabe o que é retranca.</p>
  </div>

  <div>
    <p class="rotulo">Como fica · contra bot</p>
    <div class="caixa novo">
      <p class="rot">Próximo jogo · em casa</p>
      <p class="titulo">Futpoint FC 👑 × Bagres de Wall Street FC</p>
      ${botoes}
    </div>
    <p class="nota">Título menor, "PRÓXIMO" e "em casa" viram uma etiqueta miúda em cima, e a explicação sai. <b>Adversário bot: nenhuma rivalidade aparece.</b></p>
  </div>

  <div>
    <p class="rotulo">Como fica · contra outro usuário</p>
    <div class="caixa novo ouro">
      <p class="rot">Próximo jogo · fora</p>
      <p class="titulo">Fala D10 × Futpoint FC 👑</p>
      <span class="chip">⚔️ RIVALIDADE <b>V=2 · E=1 · D=1</b></span>
      ${botoes}
    </div>
    <p class="nota">Só entre <b>dois usuários que já se enfrentaram</b>. Primeiro duelo entre eles: nada aparece ainda (não existe retrospecto). Empate só aparece se houver.</p>
  </div>

</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 520 }, deviceScaleFactor: 2 })
await p.setContent(html)
await p.waitForTimeout(300)
await p.screenshot({ path: saida, fullPage: true })
await b.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024) | 0} KB`)
