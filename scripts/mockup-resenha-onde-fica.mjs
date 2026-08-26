// 🗺️ MOCKUP — ONDE ENTRA A PREMIAÇÃO DA RESENHA (25/08)
//
// Dúvida do Diego: *"o 3 deveria aparecer depois do leilão acabar… mas o
// problema é que vem a Cerimônia aí, não sei o que fazer"*.
//
// RESPOSTA, conferida no código: a Cerimônia **é** o depois-do-leilão, e ela já
// tem tudo que a premiação precisa:
//   · `CEREMONY_MS = 45_000` (store.tsx) — 45 segundos de tempo morto já
//     existentes, com o texto "Aproveite pra ver os times de todo mundo 👀";
//   · já carrega o 🏅 Achado e o 🐴 Mico (bestDeal/worstDeal em screens.tsx),
//     jogados como duas linhas soltas no card do ÚLTIMO técnico;
//   · e os CINCO prêmios novos usam SÓ dado do leilão (2º lance, lance de 1,
//     tempo de lacre, tempo de espera, XI escalado) — nenhum precisa do
//     campeonato ter rodado.
//
// Então não nasce tela nova: a premiação vira o ÚLTIMO CARD da Cerimônia,
// depois dos elencos e antes do apito. Zero passo novo, zero espera nova.
//
//   node scripts/mockup-resenha-onde-fica.mjs --saida onde-fica.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'onde-fica.png')

const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif'
const box = (bg = '#fff', r = 16, sh = 4) => `background:${bg};border:3px solid ${INK};border-radius:${r}px;box-shadow:${sh}px ${sh}px 0 ${INK}`

const passo = (ic, titulo, sub, opts = {}) => `
  <div style="${box(opts.novo ? GOLD : '#fff', 14, opts.novo ? 5 : 3)};padding:11px 13px;display:flex;gap:11px;align-items:center;${opts.dentro ? 'margin-left:26px;' : ''}">
    <span style="font-size:22px;flex:none">${ic}</span>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-weight:700;font-size:15px;margin:0;line-height:1.1;text-transform:uppercase">${titulo}</p>
      <p style="font-size:11.5px;font-weight:700;color:rgba(0,0,0,.6);margin:2px 0 0;line-height:1.3">${sub}</p>
    </div>
    ${opts.novo ? `<span style="${OSW};font-weight:700;font-size:10px;background:${INK};color:${GOLD};border-radius:999px;padding:3px 10px;flex:none">NOVO</span>` : ''}
  </div>`

const seta = (dentro) => `<p style="text-align:center;margin:3px 0;font-size:15px;color:rgba(0,0,0,.3);${dentro ? 'margin-left:26px;' : ''}">▼</p>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,sans-serif;width:412px;padding:16px 14px 22px}
</style></head><body>

<div style="text-align:center;margin-bottom:12px">
  <span style="display:inline-block;${box(GOLD, 999, 3)};padding:5px 14px;${OSW};font-weight:700;font-size:11px;letter-spacing:1.1px;text-transform:uppercase">🗺️ Onde entra a premiação</span>
</div>

<div style="${box(GREEN, 16, 4)};padding:13px 14px;color:#fff;margin-bottom:14px">
  <p style="${OSW};font-weight:700;font-size:22px;margin:0;line-height:1.05">A Cerimônia JÁ É o depois do leilão</p>
  <p style="font-size:12.5px;font-weight:600;line-height:1.4;margin:5px 0 0;opacity:.92">
    Não precisa de tela nova. A premiação vira o <b>último card da Cerimônia</b> — depois dos elencos, antes do apito.</p>
</div>

${passo('🔨', 'Leilão', 'Os 6 setores, lance secreto, martelo.')}
${seta()}
${passo('👕', 'Monte', 'Quem ficou com buraco pega as sobras.')}
${seta()}

<div style="${box('#EFE7D2', 16, 4)};padding:12px;margin:0 0 4px">
  <p style="${OSW};font-weight:700;font-size:13px;margin:0 0 9px;text-transform:uppercase">🎭 Cerimônia da Revelação · <span style="color:${RED}">45 segundos</span></p>
  ${passo('🃏', 'Os elencos, um a um', 'As faixas de nível abrem. Todo mundo vê o que comprou.', { dentro: true })}
  ${seta(true)}
  ${passo('🏆', 'A premiação da resenha', 'Achado · Mico · Mão furada · Mão de vaca · Afobado · Enrolado · Perna-de-pau.', { dentro: true, novo: true })}
</div>

${seta()}
${passo('⚽', 'O campeonato', '38 rodadas em 3 minutos.')}
${seta()}
${passo('🏅', 'Troféu', 'O campeão leva a carta. <b>E o botão de rever a premiação fica aqui.</b>')}

<div style="${box('#FBF6E9', 14, 3)};padding:12px 13px;margin-top:16px">
  <p style="${OSW};font-weight:700;font-size:13px;margin:0 0 5px;text-transform:uppercase">✅ Por que cabe direitinho ali</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.45;margin:0 0 7px;color:rgba(0,0,0,.72)">
    <b>1.</b> A Cerimônia já tem <b>45 segundos parados</b>, e o texto dela hoje é literalmente <i>"aproveite pra ver os times de todo mundo"</i>. O tempo já está lá, vazio.</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.45;margin:0 0 7px;color:rgba(0,0,0,.72)">
    <b>2.</b> O <b>Achado</b> e o <b>Mico</b> já moram nela. Só estão mal servidos: duas linhas soltas no card do último técnico.</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.45;margin:0;color:rgba(0,0,0,.72)">
    <b>3.</b> Os cinco prêmios novos usam <b>só dado do leilão</b> — 2º lance, lance de 1, tempo de lacre, tempo de espera e o time escalado. <b>Nenhum precisa do campeonato</b>. Por isso funciona ali e não precisa esperar o fim.</p>
</div>

<div style="${box('#fff', 14, 3)};padding:12px 13px;margin-top:10px">
  <p style="${OSW};font-weight:700;font-size:13px;margin:0 0 5px;text-transform:uppercase">⏱️ E o cronômetro?</p>
  <p style="font-size:11.5px;font-weight:700;line-height:1.45;margin:0;color:rgba(0,0,0,.72)">
    <b>Não mexe.</b> Continua 45s e o campeonato começa sozinho. Quem estava rindo e não terminou de ler <b>não perde nada</b>: o botão <b>🏆 rever a premiação</b> fica no fim, do lado do troféu — e é de lá que sai o <b>📤 mandar no grupo</b>.</p>
</div>

<p style="margin:16px 0 0;${OSW};font-weight:700;font-size:12.5px;text-align:center;opacity:.5">⚽ Leilão Legends · mockup, não está no ar</p>

</body></html>`

const tmp = `/tmp/onde-fica-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
