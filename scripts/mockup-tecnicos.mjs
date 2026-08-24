// 🎓 MOCKUP — ESCOLHER O TÉCNICO (proposta, 21/08)
//
// O Diego pediu ideias de técnico com "perk" (Telê ganha formação tal, Luxemburgo
// dá desconto em salário) e mandou seguir. Isto é a TELA, do jeito que ficaria no
// celular, pra ele aprovar ANTES de qualquer código — regra dele: UI nova = mockup
// primeiro.
//
// Decisões desenhadas aqui, pra discutir olhando:
//   · a escolha mora na VIRADA DE TEMPORADA, do lado do patrocínio. Um toque,
//     vale o ano inteiro. NÃO é passo novo no meio do jogo (regra de ouro do
//     ritmo).
//   · técnico é PRÊMIO, não compra: começa todo mundo com o Seu Zé (sem perk) e
//     os famosos abrem com título — igual carta.
//   · o perk é PEQUENO e CONDICIONAL: só vale se combinar com o elenco que você
//     arrematou. Pep sem meia bom não faz nada.
//
// ⚠️ Nenhum perk inventa personalidade de gente real: cada um está amarrado no
//    que o técnico é publicamente conhecido por fazer.
//
//   node scripts/mockup-tecnicos.mjs --saida tecnicos.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tecnicos.png')

const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif'
const box = (bg = '#fff', r = 16, sh = 4) => `background:${bg};border:3px solid ${INK};border-radius:${r}px;box-shadow:${sh}px ${sh}px 0 ${INK}`

// avatar do técnico: prancheta com a inicial (arte neutra — não é retrato de
// ninguém, e o Diego já cortou rosto inventado de gente real uma vez)
const cara = (ini, cor, size = 40) => `
  <span style="width:${size}px;height:${size}px;flex:none;border-radius:11px;border:2.5px solid ${INK};background:${cor};
               display:flex;align-items:center;justify-content:center;${OSW};font-weight:700;font-size:${Math.round(size * .45)}px;color:#fff">${ini}</span>`

const linha = (t) => {
  const trancado = !!t.trava
  return `
  <div style="${box(t.on ? '#E9F5EC' : trancado ? '#EFE7D2' : '#fff', 14, 3)};padding:9px 11px;margin-bottom:8px;display:flex;gap:10px;align-items:center;${trancado ? 'opacity:.62;' : ''}">
    ${cara(t.ini, trancado ? '#9C9484' : t.cor)}
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-weight:700;font-size:15px;margin:0;line-height:1.1;text-transform:uppercase">${t.nome}
        <span style="color:${trancado ? 'rgba(0,0,0,.4)' : PURPLE};font-size:11px">· ${t.apelido}</span></p>
      <p style="font-size:11.5px;font-weight:700;color:rgba(0,0,0,.62);margin:2px 0 0;line-height:1.28">${trancado ? t.trava : t.perk}</p>
    </div>
    <span style="flex:none;width:24px;height:24px;border-radius:8px;border:2.5px solid ${INK};background:${t.on ? GREEN : '#fff'};color:${t.on ? '#fff' : 'rgba(0,0,0,.4)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900">${t.on ? '✓' : trancado ? '🔒' : ''}</span>
  </div>`
}

const LIBERADOS = [
  { ini: 'Z', cor: '#8A8272', nome: 'Seu Zé', apelido: 'o de sempre', perk: 'Sem truque nenhum. O time joga o que o elenco vale.' },
  { ini: 'T', cor: GREEN, nome: 'Telê Santana', apelido: 'futebol arte', perk: 'Escalou com 3 atacantes? Seu time cria mais e faz mais gol.', on: true },
  { ini: 'L', cor: '#2E6C9E', nome: 'Luxemburgo', apelido: 'o negociador', perk: 'Renovar contrato sai mais barato — e quem você vende, sai mais caro.' },
  { ini: 'P', cor: '#0EA5A5', nome: 'Pep Guardiola', apelido: 'posse de bola', perk: 'Escalou com 3 meias? Time toma menos gol e cria mais.' },
]
const TRANCADOS = [
  { ini: 'Z', cor: '#B45309', nome: 'Zagallo', apelido: 'o velho lobo', trava: '🔒 Ganhe uma Copa do Brasil pra liberar.' },
  { ini: 'F', cor: '#1D4ED8', nome: 'Felipão', apelido: 'a família', trava: '🔒 Fique 3 temporadas sem cair pra liberar.' },
  { ini: 'T', cor: '#0F766E', nome: 'Tite', apelido: 'time treinado', trava: '🔒 Seja campeão da Série A pra liberar.' },
  { ini: 'M', cor: '#7C3AED', nome: 'Mourinho', apelido: 'o especialista', trava: '🔒 Ganhe uma final nos pênaltis pra liberar.' },
  { ini: 'F', cor: '#B91C1C', nome: 'Alex Ferguson', apelido: 'a fábrica', trava: '🔒 Suba da Várzea até a Série A pra liberar.' },
  { ini: 'A', cor: '#334155', nome: 'Ancelotti', apelido: 'camarim tranquilo', trava: '🔒 Termine uma temporada sem lesão grave.' },
  { ini: 'K', cor: '#C2410C', nome: 'Klopp', apelido: 'heavy metal', trava: '🔒 Encha o estádio 10 vezes pra liberar.' },
]

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,sans-serif;width:412px;padding:16px 14px 24px}
</style></head><body>

<div style="text-align:center;margin-bottom:12px">
  <span style="display:inline-block;${box(GOLD, 999, 3)};padding:5px 14px;${OSW};font-weight:700;font-size:11px;letter-spacing:1.1px;text-transform:uppercase">🎓 Mockup · escolher o técnico</span>
</div>

<div style="${box(PURPLE, 18, 4)};padding:14px 15px;color:#fff;margin-bottom:12px">
  <p style="${OSW};font-weight:700;font-size:10.5px;letter-spacing:1.2px;margin:0;opacity:.8;text-transform:uppercase">Pré-temporada · Temporada 7</p>
  <p style="${OSW};font-weight:700;font-size:26px;margin:2px 0 4px;line-height:1">Quem vai comandar?</p>
  <p style="font-size:12.5px;font-weight:600;line-height:1.35;margin:0;opacity:.92">Escolha agora, antes do pregão. Vale a temporada inteira — e dá pra trocar na virada da próxima.</p>
</div>

<div style="${box(GREEN, 16, 4)};padding:12px 13px;color:#fff;margin-bottom:16px;display:flex;gap:11px;align-items:center">
  ${cara('T', 'rgba(255,255,255,.22)', 44)}
  <div style="flex:1;min-width:0">
    <p style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.2px;margin:0;opacity:.75;text-transform:uppercase">No comando hoje</p>
    <p style="${OSW};font-weight:700;font-size:19px;margin:1px 0 0;line-height:1">Telê Santana</p>
    <p style="font-size:11.5px;font-weight:700;margin:2px 0 0;opacity:.9;line-height:1.25">Com 3 atacantes, seu time cria mais e faz mais gol.</p>
  </div>
</div>

<p style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(0,0,0,.45);margin:0 0 8px">Liberados</p>
${LIBERADOS.map(linha).join('')}

<p style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:rgba(0,0,0,.45);margin:18px 0 8px">Ainda trancados</p>
${TRANCADOS.map(linha).join('')}

<div style="${box('#FBF6E9', 16, 4)};padding:13px 14px;margin-top:16px">
  <p style="${OSW};font-weight:700;font-size:13.5px;margin:0 0 5px;text-transform:uppercase">⚠️ O técnico só ajuda se combinar com o time</p>
  <p style="font-size:12px;font-weight:600;line-height:1.4;margin:0;color:rgba(0,0,0,.72)">
    Pegou o <b>Pep</b> e não arrematou meia bom no leilão? Ele não faz nada. Pegou o <b>Telê</b> e só tem 2 atacantes? Também não.
    Por isso a escolha é <b>depois</b> de você ver o elenco — o técnico é parte da jogada do pregão, não um bônus de graça.
  </p>
</div>

<div style="${box('#fff', 16, 4)};padding:13px 14px;margin-top:12px">
  <p style="${OSW};font-weight:700;font-size:13.5px;margin:0 0 5px;text-transform:uppercase">🏆 Técnico é prêmio, não compra</p>
  <p style="font-size:12px;font-weight:600;line-height:1.4;margin:0;color:rgba(0,0,0,.72)">
    Todo mundo começa com o <b>Seu Zé</b>, que não dá nada. Os famosos abrem <b>ganhando título</b> — igual carta.
    Ninguém fica pra trás por não pagar.
  </p>
</div>

<p style="margin:18px 0 0;${OSW};font-weight:700;font-size:13px;text-align:center;opacity:.5">⚽ Leilão Legends · mockup, não está no ar</p>

</body></html>`

const tmp = `/tmp/mockup-tecnicos-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
