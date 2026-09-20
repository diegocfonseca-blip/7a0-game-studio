// 🕴️ MOCKUP — SUA AGÊNCIA aperfeiçoada (a forma dos 22 que o Diego escolheu manter)
//
// Depois de recusar cinco direções novas (transferências, fantasy, álbum, museu de
// ídolos, telefone do empresário), a decisão dele foi clara: *"a minha forma dos 22
// ainda parece melhor. Quero que melhore, aperfeiçoe"*. Então a MECÂNICA não muda:
// título dá carta · até 22 na ativa · cada um rende por categoria · obras destravam.
// O que muda é tudo o que estava faltando pra pessoa ENTENDER e DECIDIR:
//
//   ① sai do Elenco e vai pro CLUBE (decisão dele, 19/09), com o nome "Sua Agência"
//   ② a frase que explica o negócio em uma linha
//   ③ o porquê do 22 escrito na tela — some o número mágico
//   ④ ⚡ um toque deixa os melhores na ativa (hoje é escolha manual entre dezenas)
//   ⑤ quem está de fora aparece, e diz quanto renderia — decisão com informação
//   ⑥ aviso quando chega carta nova melhor que alguém da ativa
//   ⑦ o dinheiro travado nas obras vira chamada, não letra miúda
//   ⑧ o total que a agência já rendeu na carreira
//
// Rodar (da raiz do repo): node scripts/mockup-agencia-22.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', ROXO = '#7C3AED', VERM = '#C2452F'
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const GRAD = {
  lenda: 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)',
  craque: 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)',
  promessa: 'linear-gradient(160deg,#C9A9FF,#8B5CF6 52%,#5B2FB0)',
  bom: 'linear-gradient(160deg,#41C07A,#2E9E5B 55%,#1E7A45)',
  prof: 'linear-gradient(160deg,#EFE6CC,#D9CCA8)',
}
const cliente = (nome, clube, cat, val, extra = '') => `
  <div class="cli ${extra}">
    <span class="sel" style="background:${GRAD[cat]}"></span>
    <span class="nm"><b>${nome}</b><i>${clube}</i></span>
    <span class="vl">${val > 0 ? `+${val}` : '—'}</span>
  </div>`

const tela = `
<div class="subabas"><span>🏟️ Estádio</span><span class="on">🕴️ Sua Agência</span><span>💰 Finanças</span><span>🤝 Patrocínio</span></div>

<div class="cab">
  <span class="ic">🕴️</span>
  <div><b>SUA AGÊNCIA</b><i>Sua agência de empresários. Todo título te traz um cliente — e cliente paga mensalidade todo ano.</i></div>
</div>

<div class="renda">
  <span class="rot">💰 MENSALIDADES DESTA TEMPORADA</span>
  <b>+64 🪙</b>
  <small>cai no caixa na virada · no extrato aparece como <u>🕴️ Agência</u></small>
  <div class="hist">🏦 a agência já te rendeu <b>412 🪙</b> nesta carreira</div>
</div>

<!-- ⑥ o aviso que hoje não existe -->
<div class="aviso">
  <b>🆕 Romário chegou na sua carteira</b>
  <p>Ele rende <b>+7</b> e o <b>Zé Carlos</b>, que está na ativa, rende <b>+1</b>. Quer trocar?</p>
  <div class="avbtn"><span class="ok">TROCAR</span><span>DEIXA ASSIM</span></div>
</div>

<div class="bloco">
  <p class="tt">🃏 NA ATIVA <span>22 de 31 clientes</span></p>
  <!-- ③ o porquê do 22, escrito -->
  <p class="pq">Você cuida de <b>22 ao mesmo tempo</b> — é quanta gente uma agência dá conta de acompanhar. Só quem está na ativa paga mensalidade; o resto espera a vez.</p>
  ${cliente('Romário', 'Vasco · 1997', 'lenda', 7)}
  ${cliente('Jairzinho', 'Botafogo · 1972', 'lenda', 6)}
  ${cliente('Bebeto', 'Flamengo · 1989', 'craque', 4)}
  ${cliente('Sócrates', 'Corinthians · 1983', 'craque', 4)}
  <p class="mais">+ 18 na ativa · <u>ver todos</u></p>
  <!-- ④ o toque único -->
  <div class="btn gold">⚡ DEIXAR OS QUE MAIS RENDEM NA ATIVA</div>
  <div class="btn branco">🧢 Escolher na mão</div>
</div>

<!-- ⑤ quem está de fora, com o número -->
<div class="bloco fora">
  <p class="tt">💤 ESPERANDO A VEZ <span>9 clientes</span></p>
  ${cliente('Edmundo', 'Palmeiras · 1996', 'craque', 4, 'off')}
  ${cliente('Zé Carlos', 'Guarani · 1988', 'prof', 1, 'off')}
  <p class="mais">+ 7 esperando · juntos renderiam <b>+21</b> se coubessem</p>
</div>

<!-- ⑦ o dinheiro parado nas obras -->
<div class="trava">
  <b>🔒 +36 🪙 por temporada parados</b>
  <p>Você tem <b>6 lendas</b> na carteira, mas lenda só paga depois que a <b>SAF (filial)</b> existir. Abra a filial em <u>🏗️ Estrutura</u> e esse dinheiro entra sozinho.</p>
</div>`

const notas = `
<div class="nota">
  <span class="tag">O QUE MUDA</span>
  <p class="h">Mesma regra, tudo explicado</p>
  <ul>
    <li><b>Sai do Elenco, vai pro Clube.</b> Agência não é escalação — o lugar dela é junto de estádio, finanças e patrocínio. O desenho do estádio continua sendo a primeira coisa da área do clube.</li>
    <li><b>Nome e frase.</b> "Sua Agência", e embaixo o que é: todo título traz um cliente, cliente paga mensalidade todo ano.</li>
    <li><b>O 22 deixa de ser número mágico.</b> A tela diz por que é 22 e o que acontece com quem fica de fora.</li>
    <li><b>Um toque resolve.</b> O botão ⚡ põe na ativa quem mais rende. Quem gosta de mexer continua com o "escolher na mão".</li>
    <li><b>Chegou carta boa, o jogo avisa</b> e compara com o pior da ativa. Antes você tinha que descobrir sozinho.</li>
    <li><b>O dinheiro aparece</b>: no extrato, no recibo da virada e no total da carreira. Hoje ele some dentro do caixa.</li>
    <li><b>O travado vira chamada.</b> "+36 parados esperando a SAF" é convite pra obra, não letra miúda.</li>
    <li><b>Jornal:</b> cliente artilheiro ou campeão vira manchete no Caderno do Empresário, como já acontece, só que agora com a agência tendo cara.</li>
  </ul>
  <p class="p2">⚖️ <b>Nada muda na economia:</b> mesmos valores por categoria (lenda 6 · craque 4 · promessa 3 · bom 2 · profissional 1 · folclórico +1), mesmos destraves pelas obras, mesma comissão de artilheiro. É a mesma agência, agora legível.</p>
</div>`

const css = `
${FONTES}
*{box-sizing:border-box}body{margin:0;background:#cfc4a6;font-family:system-ui,sans-serif;color:${INK}}
.wrap{display:flex;gap:26px;padding:26px;justify-content:center;align-items:flex-start}
.col{width:430px}.col.larga{width:470px}
h1{font-family:Oswald;font-weight:700;font-size:23px;text-transform:uppercase;margin:0 0 10px;letter-spacing:.5px}
h1 span{display:block;font-family:system-ui;font-weight:700;font-size:12.5px;color:#4e4936;text-transform:none;letter-spacing:0;margin-top:2px}
.tela{background:${CREME};border:4px solid ${INK};border-radius:20px;box-shadow:5px 6px 0 ${INK};padding:12px}
.subabas{display:flex;gap:5px;margin-bottom:10px}
.subabas span{flex:1;text-align:center;border:2.5px solid ${INK};border-radius:9px;padding:6px 2px;font-family:Oswald;font-weight:700;font-size:9.5px;background:#fff}
.subabas .on{background:${GOLD};box-shadow:2px 2px 0 ${INK}}
.cab{display:flex;align-items:center;gap:9px;background:#141210;color:#fff;border:3px solid ${INK};border-radius:14px;padding:10px 11px;margin-bottom:9px}
.cab .ic{font-size:24px}
.cab b{display:block;font-family:Oswald;font-weight:700;font-size:15px;text-transform:uppercase}
.cab i{display:block;font-style:normal;font-size:9.5px;font-weight:700;color:rgba(255,255,255,.66);line-height:1.4;margin-top:2px}
.renda{background:linear-gradient(160deg,${VERDE},#14401f);color:#fff;border:3px solid ${INK};border-radius:14px;padding:10px 12px;margin-bottom:9px}
.rot{font-size:9px;font-weight:800;letter-spacing:1;color:rgba(255,255,255,.66)}
.renda b{display:block;font-family:Oswald;font-size:26px;line-height:1.1}
.renda small{display:block;font-size:9px;font-weight:700;color:rgba(255,255,255,.72);margin-top:3px}
.renda small u{text-decoration:none;color:#fff}
.hist{margin-top:7px;background:rgba(0,0,0,.28);border-radius:8px;padding:5px 8px;font-size:9.5px;font-weight:700}
.aviso{background:#FFF3C9;border:3px solid ${INK};border-radius:14px;padding:9px 11px;margin-bottom:9px;box-shadow:3px 3px 0 ${INK}}
.aviso b{font-family:Oswald;font-size:13px}
.aviso p{font-size:10.5px;font-weight:700;margin:3px 0 7px;line-height:1.4;color:#4a4636}
.avbtn{display:flex;gap:6px}
.avbtn span{flex:1;text-align:center;border:2.5px solid ${INK};border-radius:9px;padding:6px;font-family:Oswald;font-weight:700;font-size:11px;background:#fff}
.avbtn .ok{background:${VERDE};color:#fff}
.bloco{background:#fff;border:3px solid ${INK};border-radius:14px;padding:9px 10px;margin-bottom:9px}
.tt{font-family:Oswald;font-weight:700;font-size:12px;margin:0 0 5px;display:flex;justify-content:space-between}
.tt span{color:#8a8069;font-size:10px}
.pq{font-size:10px;font-weight:700;color:#6b6450;background:#F7F2E2;border-radius:8px;padding:6px 8px;margin:0 0 7px;line-height:1.4}
.cli{display:flex;align-items:center;gap:8px;border-bottom:2px dashed #e6dcbf;padding:5px 2px}
.cli .sel{flex:none;width:22px;height:22px;border:2.5px solid ${INK};border-radius:7px}
.cli .nm{flex:1;min-width:0}
.cli b{display:block;font-family:Oswald;font-size:13px;line-height:1.1}
.cli i{display:block;font-style:normal;font-size:9px;font-weight:700;color:#8a8069}
.cli .vl{font-family:Oswald;font-size:15px;color:${VERDE}}
.cli.off{opacity:.5}.cli.off .vl{color:#8a8069}
.mais{font-size:10px;font-weight:700;color:#8a8069;margin:7px 0 0;text-align:center}
.btn{border:3px solid ${INK};border-radius:12px;padding:10px;text-align:center;font-family:Oswald;font-weight:700;font-size:12.5px;margin-top:8px;box-shadow:3px 3px 0 ${INK}}
.gold{background:${GOLD}}.branco{background:#fff;box-shadow:none;font-size:11.5px;padding:8px}
.fora{background:#FBF7EC}
.trava{background:#141210;color:#fff;border:3px solid ${INK};border-radius:14px;padding:10px 12px}
.trava b{font-family:Oswald;font-size:14px;color:${GOLD}}
.trava p{font-size:10px;font-weight:700;color:rgba(255,255,255,.75);margin:4px 0 0;line-height:1.45}
.trava u{color:#fff}
/* notas */
.nota{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 6px 0 ${INK};padding:14px 15px;position:relative}
.tag{position:absolute;top:-12px;left:12px;background:${ROXO};color:#fff;font-family:Oswald;font-weight:700;font-size:10px;letter-spacing:.1em;border:2.5px solid ${INK};border-radius:7px;padding:2px 8px}
.h{font-family:Oswald;font-weight:700;font-size:21px;margin:6px 0 9px;text-transform:uppercase}
.nota ul{margin:0;padding-left:17px}
.nota li{font-size:12px;font-weight:600;line-height:1.5;margin-bottom:8px;color:#3d3a30}
.p2{font-size:11.5px;font-weight:700;line-height:1.5;background:#E9F9EF;border:2.5px solid ${VERDE};border-radius:10px;padding:9px 10px;margin:10px 0 0;color:#1c5231}
`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="wrap">
<div class="col"><h1>A tela nova<span>Clube › 🕴️ Sua Agência (saiu do Elenco)</span></h1><div class="tela">${tela}</div></div>
<div class="col larga"><h1>O que muda<span>a regra é a mesma — muda o que dá pra entender e decidir</span></h1>${notas}</div>
</div></body></html>`

const out = process.argv[2] ?? 'mockup-agencia-22.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-agencia-22.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 820 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
