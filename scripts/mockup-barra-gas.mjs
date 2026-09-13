// 🖼️ MOCKUP — a BARRINHA de gás "hoje × proposta" (pedido do Diego 13/09: *"está
// diminuindo muito rápido… amarelo depois de 50%"*). Usa a função REAL do jogo
// (pctBarra/corBarra em condicao.ts) — o que aparece aqui é o que vai pra tela.
// Rodar: npx tsx scripts/mockup-barra-gas.mjs   (gera /tmp/mockup-barra-gas.png)
import { chromium } from 'playwright-core'
import { pctBarra, corBarra, estadoGas, corGas, emojiGas, GAS_JOGO } from '../src/escalacao/condicao.ts'

const INK = '#0C0C0C', CREME = '#F4ECD6'
const gasNoJogo = n => Math.max(0, Math.round((100 - GAS_JOGO * (n - 1)) * 10) / 10) // gás ANTES do jogo N
const JOGOS = [1, 13, 25, 40, 50, 51, 55, 60, 65, 70]
const NOMES = ['Zico', 'Lúcio', 'Cafu', 'Sócrates', 'Romário', 'Falcão', 'Careca', 'Bebeto', 'Júnior', 'Aldair']

const barra = (p, cor) => `<span class="bar"><i style="width:${p}%;background:${cor}"></i></span><b style="color:${cor}">${p}%</b>`
const linhas = JOGOS.map((n, i) => {
  const g = gasNoJogo(n), e = estadoGas(g)
  return `<tr>
    <td class="nm">${NOMES[i]}<small>🏃 ${n}º jogo · ${emojiGas(e)}</small></td>
    <td>${barra(Math.round(g), corGas(e))}</td>
    <td class="nova">${barra(pctBarra(g), corBarra(g))}</td>
  </tr>`
}).join('')

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};padding:26px;width:720px}
  h1{font-size:30px;margin:0 0 4px;text-transform:uppercase;letter-spacing:.5px}
  p.sub{margin:0 0 18px;font-size:15px;color:#4a4636;font-family:system-ui;line-height:1.35}
  .box{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:14px 16px}
  table{width:100%;border-collapse:collapse}
  th{font-size:14px;text-transform:uppercase;text-align:left;padding:4px 8px 10px;border-bottom:3px solid ${INK}}
  th.nova{color:#1B7A3D}
  td{padding:8px;border-bottom:1.5px dashed #d9d0b3;font-size:15px;vertical-align:middle}
  td.nm{width:170px;font-weight:700}
  td.nm small{display:block;font-weight:500;font-size:12px;color:#5a5647}
  td.nova{background:#f3fbf4}
  .bar{display:inline-block;width:120px;height:12px;border:2px solid ${INK};border-radius:7px;background:#e9dfbe;overflow:hidden;vertical-align:middle;margin-right:8px}
  .bar i{display:block;height:100%}
  b{font-size:16px;vertical-align:middle}
  .nota{margin-top:14px;font-family:system-ui;font-size:13.5px;line-height:1.45;color:#2f2c22;background:#fff7d6;border:3px solid ${INK};border-radius:14px;padding:10px 12px;box-shadow:3px 3px 0 ${INK}}
</style>
<h1>😓 Barrinha de gás — hoje × proposta</h1>
<p class="sub">O MOTOR não muda: inteiro até o 54º jogo · 😓 no 55º · 🥵 no 60º · 🚑 no 65º. Só muda o que a barra MOSTRA.</p>
<div class="box"><table>
  <tr><th>Jogador</th><th>Hoje (gás cru)</th><th class="nova">Proposta (leitura)</th></tr>
  ${linhas}
</table></div>
<div class="nota">
  ✅ <b>1º ao 50º jogo</b>: a barra vai de 100% a 50%, verde (cai ~1% por jogo).<br>
  🟡 <b>51º em diante</b>: passa de 49% e fica <b>amarela</b> — mesmo com o jogador ainda 💪 (é o aviso de que está chegando).<br>
  🔻 Daí cai mais rápido, como a zona do cansaço: 55º ≈ 40% (😓) · 60º ≈ 28% (🥵, vermelho) · 65º ≈ 17% (🚑, escuro).<br>
  🪑 Banco recupera igual ao de hoje (o motor é o mesmo) — na barra aparece ~+3% por rodada de descanso.
</div>`

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 772, height: 900 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const out = process.env.OUT || '/tmp/mockup-barra-gas.png'
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log('✅', out)
for (const n of JOGOS) { const g = gasNoJogo(n); console.log(`${String(n).padStart(2)}º jogo · gás ${g} · barra ${pctBarra(g)}% · ${estadoGas(g)}`) }
