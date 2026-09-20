// 🕴️ MOCKUP — "SUA AGÊNCIA" (era Agenciados) + o que fazer com os 22
//
// Decisão do Diego (19/09), depois de reclamar que *"os agenciados estão escondidinhos
// na aba de elenco… ninguém está entendendo nada"*: **fica onde está, mas muda o nome**
// — *"coloque nome Sua Agência. Lá dentro diz sua agência de empresários"*. E sobre o
// limite de 22: *"ainda não tá claro o que fazer"* — por isso este mockup propõe UMA
// saída e mostra ela funcionando.
//
// Três painéis:
//   ① ANTES  — a pílula "AGENCIADOS" e o cabeçalho de hoje
//   ② DEPOIS — "SUA AGÊNCIA", com a frase que explica o negócio em uma linha
//   ③ OS 22  — a proposta: o jogo escala os 22 sozinho, e trocar vira opcional
//
// Rodar (da raiz do repo): node scripts/mockup-sua-agencia.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', ROXO = '#7C3AED'
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const pilulas = (ativo) => `
  <div class="pilulas">
    <span class="${ativo === 'time' ? 'on' : ''}">🎽 TIME</span>
    <span class="${ativo === 'ag' ? 'on' : ''}">🕴️ ${ativo === 'ag' ? 'SUA AGÊNCIA' : 'AGENCIADOS'}</span>
  </div>`

const carta = (nome, clube, cat, val, folk) => `
  <div class="cta"><b>${nome}</b><i>${clube}</i><span class="${cat}">${cat}${folk ? ' 🃏' : ''}</span><em>+${val}</em></div>`

const antes = `
${pilulas('agenciados')}
<div class="cab preto">
  <span class="ic">🕴️</span>
  <div><b>SUA AGÊNCIA</b><i>Convoque até 22 cartas de título DESTA carreira pra "ativa" — só elas rendem. A grana cai no Rei da Bola FC (1º clube).</i></div>
  <div class="cont"><b>22/22</b><span>NA ATIVA</span></div>
</div>
<div class="renda"><span>💰 RENDA GARANTIDA POR TEMPORADA</span><b>+64 🪙</b></div>
<div class="btn roxo">🧢 Convocar agenciados — trocar os 22</div>
<p class="obs">É esse o ponto que trava: a pessoa abre, lê "convoque 22", e não sabe o que é isso nem por que 22.</p>`

const depois = `
${pilulas('ag')}
<div class="cab preto">
  <span class="ic">🕴️</span>
  <div><b>SUA AGÊNCIA</b><i>Sua agência de empresários. Todo título que você ganha te traz um cliente — e cliente paga <u>mensalidade todo ano</u>.</i></div>
  <div class="cont"><b>31</b><span>CLIENTES</span></div>
</div>
<div class="renda"><span>💰 MENSALIDADES DESTA TEMPORADA</span><b>+64 🪙</b>
  <small>já entra no caixa na virada · aparece no extrato como <u>🕴️ Agência</u></small></div>
<div class="lista">
  <p class="tit">🃏 OS QUE ESTÃO RENDENDO <span>22 de 31</span></p>
  ${carta('Romário', 'Vasco · 1997', 'lenda', 7, true)}
  ${carta('Bebeto', 'Flamengo · 1989', 'craque', 4)}
  ${carta('Jairzinho', 'Botafogo · 1972', 'lenda', 6)}
  <p class="mais">+ 19 clientes rendendo · <u>ver todos</u></p>
</div>
<p class="obs ok">Mesmas regras de hoje: mesma renda, mesmos destraves pelas obras, mesma comissão de artilheiro. Muda o NOME e a frase que explica.</p>`

const vinte2 = `
<div class="prop">
  <span class="tag">A PROPOSTA</span>
  <p class="h">Os 22 deixam de ser tarefa</p>
  <p class="p">Hoje a pessoa <b>tem que</b> abrir a convocação e escolher 22 entre todas as cartas. Só que a escolha é sempre a mesma: as que rendem mais. Ninguém pensa, só clica.</p>
  <div class="passo"><b>1.</b> O jogo já deixa na ativa os <b>22 que rendem mais</b>, sozinho, toda vez que chega carta nova.</div>
  <div class="passo"><b>2.</b> A tela diz isso em uma linha: <i>"a gente já deixou na ativa os 22 que mais rendem"</i>.</div>
  <div class="passo"><b>3.</b> Quem quiser mexer, mexe: o botão vira <b>🧢 Escolher na mão</b> — opcional, não pedido.</div>
  <p class="p pq"><b>Por que manter o teto de 22?</b> É o que segura a renda: sem teto, quem tem 80 cartas ganharia 3× mais que quem tem 25, só por ter jogado mais tempo. O teto mantém a agência como uma renda de apoio, não como a principal.</p>
  <div class="alt"><b>Se preferir o contrário:</b> tirar o limite e <u>baixar o valor por carta</u> (ex.: lenda 6 → 3). Aí todas rendem, mas cada uma vale menos. Dá pra medir antes com a simulação de caixa.</div>
</div>`

const css = `
${FONTES}
*{box-sizing:border-box}body{margin:0;background:#cfc4a6;font-family:system-ui,sans-serif;color:${INK}}
.wrap{display:flex;gap:24px;padding:24px;justify-content:center;align-items:flex-start}
.col{width:400px}
h1{font-family:Oswald;font-weight:700;font-size:22px;text-transform:uppercase;margin:0 0 9px;letter-spacing:.5px}
h1 span{display:block;font-family:system-ui;font-weight:700;font-size:12px;color:#4e4936;text-transform:none;letter-spacing:0;margin-top:2px}
.tela{background:${CREME};border:4px solid ${INK};border-radius:20px;box-shadow:5px 6px 0 ${INK};padding:12px}
.pilulas{display:flex;gap:7px;margin-bottom:10px}
.pilulas span{flex:1;text-align:center;border:3px solid ${INK};border-radius:11px;padding:7px 4px;font-family:Oswald;font-weight:700;font-size:12px;background:#fff}
.pilulas .on{background:${GOLD};box-shadow:2px 2px 0 ${INK}}
.cab{display:flex;align-items:center;gap:9px;border:3px solid ${INK};border-radius:14px;padding:10px 11px;margin-bottom:9px}
.preto{background:#141210;color:#fff}
.cab .ic{font-size:24px}
.cab b{display:block;font-family:Oswald;font-weight:700;font-size:15px;text-transform:uppercase}
.cab i{display:block;font-style:normal;font-size:9.5px;font-weight:700;color:rgba(255,255,255,.66);line-height:1.4;margin-top:2px}
.cab i u{text-decoration:none;color:#fff}
.renda small u{text-decoration:none;color:#fff}
.cab .cont{flex:none;background:${GOLD};color:${INK};border:2px solid rgba(255,255,255,.25);border-radius:10px;padding:4px 9px;text-align:center}
.cab .cont b{font-family:Oswald;font-size:16px;line-height:1}
.cab .cont span{display:block;font-size:7px;font-weight:900;letter-spacing:1}
.renda{background:linear-gradient(160deg,${VERDE},#14401f);color:#fff;border:3px solid ${INK};border-radius:14px;padding:10px 12px;margin-bottom:9px}
.renda span{font-size:9px;font-weight:800;letter-spacing:1;color:rgba(255,255,255,.66)}
.renda b{display:block;font-family:Oswald;font-size:25px;line-height:1.1}
.renda small{display:block;font-size:9px;font-weight:700;color:rgba(255,255,255,.7);margin-top:4px}
.btn{border:3px solid ${INK};border-radius:13px;padding:11px;text-align:center;font-family:Oswald;font-weight:700;font-size:13px;box-shadow:3px 3px 0 ${INK}}
.roxo{background:${ROXO};color:#fff}
.lista{background:#fff;border:3px solid ${INK};border-radius:14px;padding:9px 10px}
.tit{font-family:Oswald;font-weight:700;font-size:11.5px;margin:0 0 7px;display:flex;justify-content:space-between}
.tit span{color:#8a8069;font-size:10px}
.cta{display:flex;align-items:center;gap:7px;border-bottom:2px dashed #e6dcbf;padding:5px 2px;font-size:11px;font-weight:700}
.cta b{flex:none;font-family:Oswald;font-size:13px}
.cta i{flex:1;font-style:normal;color:#8a8069;font-size:9.5px}
.cta span{font-family:Oswald;font-size:9px;text-transform:uppercase;border:2px solid ${INK};border-radius:6px;padding:1px 5px}
.cta .lenda{background:linear-gradient(160deg,#FFE79A,${GOLD} 45%,#E8A200)}
.cta .craque{background:linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)}
.cta em{font-style:normal;font-family:Oswald;font-size:14px;color:${VERDE}}
.mais{font-size:10px;font-weight:700;color:#8a8069;margin:7px 0 0;text-align:center}
.obs{font-size:10.5px;font-weight:700;color:#5a4a2a;background:#FFF3C9;border:2.5px solid ${INK};border-radius:10px;padding:7px 9px;margin:9px 0 0;line-height:1.45}
.obs.ok{background:#E9F9EF;color:#1c5231}
/* ③ */
.prop{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 6px 0 ${INK};padding:13px 14px;position:relative}
.tag{position:absolute;top:-12px;left:12px;background:${ROXO};color:#fff;font-family:Oswald;font-weight:700;font-size:10px;letter-spacing:.1em;border:2.5px solid ${INK};border-radius:7px;padding:2px 8px}
.h{font-family:Oswald;font-weight:700;font-size:20px;margin:6px 0 6px;text-transform:uppercase;line-height:1.05}
.p{font-size:12px;font-weight:600;line-height:1.5;margin:0 0 10px;color:#3d3a30}
.passo{background:#F7F2E2;border:2.5px solid ${INK};border-radius:10px;padding:8px 10px;margin-bottom:7px;font-size:11.5px;font-weight:700;line-height:1.45}
.passo b{font-family:Oswald;font-size:14px;margin-right:4px}
.pq{margin-top:10px;background:#FFF3C9;border:2.5px solid ${INK};border-radius:10px;padding:8px 10px}
.alt{margin-top:9px;font-size:11px;font-weight:700;line-height:1.5;background:#EEE9FB;border:2.5px solid ${ROXO};border-radius:10px;padding:8px 10px;color:#3b2a66}
`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap">
<div class="col"><h1>① Hoje<span>a sub-aba dentro do Elenco</span></h1><div class="tela">${antes}</div></div>
<div class="col"><h1>② Proposta<span>mesmo lugar, nome e frase novos</span></h1><div class="tela">${depois}</div></div>
<div class="col"><h1>③ E os 22?<span>a parte que faltava decidir</span></h1>${vinte2}</div>
</div></body></html>`

const out = process.argv[2] ?? 'mockup-sua-agencia.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-sua-agencia.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1320, height: 780 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
