// ⚔️ MOCKUP — a cor da caixa do DESEMPATE (pedido do Diego 04/09, vendo a live do
// canalmeianacanela): *"esse dourado no empate tá confundindo pq não é lenda"*.
//
// O PROBLEMA: a caixa do duelo é SEMPRE dourada (`Box bg={GOLD}`), e no jogo
// dourado quer dizer 👑 LENDA. O Mauro Icardi apareceu em fundo de lenda sem ser.
//
// ⚠️ E A ARMADILHA: na REVELAÇÃO o jogo já acerta (`bg={fame >= 5 ? GOLD : '#fff'}`),
// mas lá o nível JÁ foi revelado. O desempate acontece no meio do pregão ÀS CEGAS —
// pintar por raridade aqui vira SPOILER DO NÍVEL. Então a cor do duelo tem que ser
// uma que não signifique raridade nenhuma.
//
// uso: node scripts/mockup-desempate-cor.mjs [--saida arquivo.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'mockup-desempate-cor.png')

const CREAM = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', RED = '#E8503A', VERM = '#C2452F'

const face = w => `@font-face{font-family:Oswald;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(new URL(`./fonts/oswald-latin-${w}-normal.woff2`, import.meta.url)).toString('base64')}) format('woff2')}`

// a carta como ela aparece no duelo: nome, clube·ano e a tag da posição.
// Nível NÃO aparece (o pregão é às cegas) — é justamente esse o ponto.
const carta = (inkClaro) => `
  <div style="display:flex;align-items:center;gap:10px">
    <span style="border:2px solid ${INK};border-radius:6px;padding:1px 6px;font:900 10px Oswald;background:${inkClaro ? 'rgba(255,255,255,.9)' : '#fff'};color:${INK}">ATA</span>
    <div>
      <div style="font:900 21px Oswald;color:${inkClaro ? '#fff' : INK};line-height:1">Mauro Icardi</div>
      <div style="font:600 12px Oswald;color:${inkClaro ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.6)'};margin-top:2px">Inter · 2018</div>
    </div>
  </div>`

const bloco = (rotulo, tag, tagCor, bg, inkClaro, nota) => `
<div style="width:330px">
  <span style="display:inline-block;border:3px solid ${INK};border-radius:999px;padding:2px 10px;font:900 10.5px Oswald;background:${tagCor};color:#fff;box-shadow:3px 3px 0 ${INK};margin-bottom:7px">${tag}</span>
  <p style="font:900 15px Oswald;text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px;color:${INK}">${rotulo}</p>
  <p style="font:500 11.5px Oswald;line-height:1.35;margin:0 0 11px;color:rgba(0,0,0,.66)">${nota}</p>

  <p style="font:900 11px Oswald;text-transform:uppercase;color:${VERM};margin:0 0 5px;text-align:center">⚔️ Desempate 2 / 3 · empate no maior lance</p>
  <div style="text-align:center;margin-bottom:5px">
    <span style="border:2px solid ${INK};border-radius:999px;padding:1px 9px;font:900 11px Oswald;background:${RED};color:#fff">Freezo FC ⭐</span>
    <span style="font:900 12px Oswald;color:rgba(0,0,0,.4);margin:0 3px">×</span>
    <span style="border:2px solid ${INK};border-radius:999px;padding:1px 9px;font:900 11px Oswald;background:#2E6BD6;color:#fff">Th Sigma</span>
  </div>
  <p style="font:600 11px Oswald;color:rgba(0,0,0,.7);margin:0 0 9px;text-align:center;line-height:1.3">Empataram em <b>5</b>. Re-lance <b>às cegas</b> só nesta carta.</p>

  <div style="background:${bg};border:4px solid ${INK};border-radius:16px;box-shadow:6px 6px 0 ${INK};padding:16px">
    ${carta(inkClaro)}
    <p style="font:900 16px Oswald;text-align:center;margin:14px 0 0;color:${inkClaro ? '#fff' : INK}">🍿 Você assiste este duelo</p>
    <p style="font:700 12px Oswald;text-align:center;margin:2px 0 0;color:${inkClaro ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.6)'}">Já re-lançaram: 0/2</p>
  </div>
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
${[400, 500, 600, 700].map(face).join('\n')}
*{box-sizing:border-box}body{margin:0;background:${CREAM};padding:26px;font-family:Oswald,sans-serif}
.wrap{display:flex;gap:24px;align-items:flex-start}
</style><body><div class="wrap">
${bloco('Como está hoje', 'HOJE', VERM, GOLD, false,
  'Dourado é a cor de 👑 LENDA no jogo inteiro. O Icardi não é lenda — e o fundo diz que é.')}
${bloco('Opção A · branco', 'A', '#5b5b5b', '#fff', false,
  'Neutro, e é o mesmo fundo que a carta comum já tem na revelação. Some a confusão, mas o duelo perde o destaque.')}
${bloco('Opção B · vermelho do duelo', 'B', '#1B7A3D', VERM, true,
  'Vermelho não é cor de raridade nenhuma no jogo — é a cor do ⚔️ que já está no título. Destaca o duelo sem prometer nível.')}
</div>
<p style="font:600 12px Oswald;color:rgba(0,0,0,.6);margin:22px 0 0;max-width:1050px;line-height:1.5">
⚠️ Não dá pra pintar de dourado "só quando for lenda", como a revelação faz: o desempate acontece <b>no meio do pregão às cegas</b> — a cor entregaria o nível antes do martelo.
</p>
</body>`

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const pg = await nav.newPage({ viewport: { width: 1100, height: 620 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: resolve(process.cwd(), SAIDA), fullPage: true })
await nav.close()
console.log(SAIDA)
