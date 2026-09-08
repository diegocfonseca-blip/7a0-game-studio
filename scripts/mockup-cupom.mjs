// ─── 🎟️ MOCKUP: cupom de influenciador no BATISMO + relatório no Painel ──────
// Pedido do Diego (07/09): *"o influenciador terá um cupom com o nome dele…
// 10% de desconto somente no plano de batismo… preciso de relatório pro
// influenciador; limite de uso e validade aí decido… só bota esse cupom quem
// souber"*.
//
// Três telas (390 de largura), do jeito que o código desenha:
//   1. a tela do batismo ANTES de digitar (campo vazio — nenhum código aparece)
//   2. a mesma tela com PANTERA aplicado (preço riscado → novo, Pix com o valor)
//   3. o Painel do Criador: criar cupom + relatório por influenciador
//
//   node scripts/mockup-cupom.mjs [--saida cupom.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'cupom.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const num = n => `<span style="display:inline-block;width:20px;height:20px;border-radius:999px;text-align:center;font-size:11px;line-height:20px;margin-right:6px;background:${INK};color:${GOLD}">${n}</span>`
const serie = (t, p, on) => `<div style="flex:1;border:2px solid ${INK};border-radius:8px;padding:6px 8px;font-size:9.5px;font-weight:900;text-align:center;background:${on ? GOLD : '#fff'};box-shadow:${on ? `2px 2px 0 ${INK}` : 'none'}">${t}<br><span style="font-size:12px;${OSW}">${p}</span></div>`

const caixaCupom = (aplicado) => aplicado ? `
  <p style="font-size:10px;font-weight:700;text-align:center;margin:6px 0 0;color:${GREEN}">🎟️ cupom <b>PANTERA</b> aplicado · 10% off · <s style="color:rgba(0,0,0,.4)">R$ 59,90</s> <b>R$ 53,91</b> <u style="color:rgba(0,0,0,.4)">tirar</u></p>` : `
  <p style="text-align:center;margin:6px 0 0"><u style="font-size:10px;font-weight:700;color:rgba(0,0,0,.4)">tem cupom?</u></p>`

const pix = (valor) => `
  <div style="border:3px solid ${INK};border-radius:14px;padding:10px 12px;margin-top:8px;background:#fff;box-shadow:3px 3px 0 ${INK}">
    <p style="${OSW};font-size:12px;margin:0">🟢 Pix copia e cola · <b>R$ ${valor}</b></p>
    <div style="border:3px solid ${INK};border-radius:12px;padding:10px;margin-top:6px;text-align:center;background:${GREEN};color:#fff;${OSW};font-size:13px;text-transform:uppercase;box-shadow:3px 3px 0 ${INK}">📋 copiar Pix (R$ ${valor})</div>
  </div>`

const batismo = (aplicado) => `
  <p style="${OSW};font-size:24px;text-align:center;margin:0">⚽ BATIZA TEU CLUBE</p>
  <p style="font-size:12px;font-weight:700;color:rgba(0,0,0,.6);text-align:center;margin:4px 0 0">3 coisinhas e teu time entra em campo:</p>
  <p style="${OSW};font-size:13px;margin:12px 0 0">${num(1)}Escolhe o nome do clube</p>
  <div style="border:3px solid ${INK};border-radius:12px;padding:9px 12px;margin-top:8px;background:#fff;${OSW};font-size:16px">Atlético do Jefão</div>
  <p style="${OSW};font-size:13px;margin:14px 0 0">${num(2)}Escolhe a série e faz o Pix</p>
  <div style="display:flex;gap:6px;margin-top:6px">${serie('Série B·C·D e Várzea', 'R$ 59,90', true)}${serie('👑 Série A (a elite)', 'R$ 69,90', false)}</div>
  <p style="font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:4px 0 0;line-height:1.35">a <b>Série A</b> custa mais porque é a elite: são os clubes que aparecem no <b>jogo rápido</b> e os rivais que todo mundo enfrenta.</p>
  ${pix(aplicado ? '53,91' : '59,90')}
  ${caixaCupom(aplicado)}
  <p style="${OSW};font-size:13px;margin:14px 0 0">${num(3)}Manda comprovante + nome</p>
  <div style="border:3px solid ${INK};border-radius:12px;padding:12px;margin-top:8px;text-align:center;background:#E1306C;color:#fff;${OSW};font-size:15px;box-shadow:4px 4px 0 ${INK}">📸 CHAMAR NO @leilaolegendscom</div>
  <p style="font-size:10px;font-weight:700;color:rgba(0,0,0,.45);text-align:center;margin:6px 0 0">(a mensagem já vai copiada${aplicado ? ' — e já diz "usei o cupom PANTERA, paguei R$ 53,91"' : ''})</p>`

// ── painel do criador (fundo escuro, igual ao admin) ──
const GOLDA = GOLD
const inp = (t) => `<div style="border:2px solid ${GOLDA};border-radius:10px;padding:8px 10px;color:rgba(242,232,207,.45);font-weight:700;font-size:12px">${t}</div>`
const painel = () => `
  <div style="border:2px solid ${GOLDA};border-radius:16px;padding:14px;color:#F2E8CF">
    <p style="${OSW};font-size:15px;color:${GOLDA};text-transform:uppercase;margin:0 0 4px">🎟️ Cupons de influenciador · só no Batismo</p>
    <p style="font-size:10.5px;font-weight:700;color:rgba(242,232,207,.6);margin:0 0 10px;line-height:1.4">Cria o cupom aqui e ele já vale no jogo (sem deploy). Quem usa aparece embaixo; quando o Pix cair, marca como PAGO — o relatório do influenciador conta só os pagos.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${inp('CÓDIGO (ex.: PANTERA)')}${inp('nome do influenciador')}<div style="font-size:11px;font-weight:700;color:rgba(242,232,207,.7);display:flex;align-items:center;gap:6px">desconto <div style="border:2px solid ${GOLDA};border-radius:10px;padding:8px 10px;width:44px;color:#F2E8CF">10</div>%</div>${inp('limite de usos (vazio = sem)')}<div style="grid-column:1/-1">${inp('📅 válido até (vazio = sem validade)')}</div></div>
    <div style="border-radius:12px;padding:10px;margin-top:8px;text-align:center;${OSW};font-size:13px;text-transform:uppercase;background:${GOLDA};color:${INK}">➕ CRIAR CUPOM</div>
    <p style="${OSW};font-size:12.5px;color:${GOLDA};text-transform:uppercase;margin:14px 0 6px">📊 Relatório por influenciador</p>
    <div style="border:1px solid rgba(242,232,207,.25);border-radius:12px;padding:9px 11px">
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700"><span style="${OSW};font-size:15px;letter-spacing:2px;color:${GOLDA}">PANTERA</span><span>Pantera</span><span style="opacity:.7">10% off</span><span style="margin-left:auto;font-size:10.5px;font-weight:800;color:#6fdb8f">🟢 ativo</span></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;font-weight:700;margin:5px 0 0;color:rgba(242,232,207,.8)"><span>👥 usaram: <b>4</b></span><span>✅ pagos: <b style="color:#6fdb8f">3</b></span><span>💰 entrou: <b>R$ 170,72</b></span><span>🎁 desconto dado: <b>R$ 18,97</b></span></div>
      <div style="display:flex;gap:7px;margin-top:7px"><div style="flex:1;border:1.5px solid ${GOLDA};border-radius:10px;padding:7px;text-align:center;${OSW};font-size:11.5px;text-transform:uppercase;background:${GOLDA};color:${INK}">fechar usos</div><div style="flex:1;border:1.5px solid #ff8a75;border-radius:10px;padding:7px;text-align:center;${OSW};font-size:11.5px;text-transform:uppercase;color:#ff8a75">⏸️ desligar</div></div>
      ${[['Atlético do Jefão', 'B/C/D', 'jefao@gmail.com', '59,90', '53,91', '✅ pago', '#6fdb8f', ''], ['Real Quebrada', 'A', 'kaka10@hotmail.com', '69,90', '62,91', '✅ pago', '#6fdb8f', ''], ['Galo da Vila', 'B/C/D', 'não logado', '59,90', '53,91', '✅ pago', '#6fdb8f', ''], ['Bonde do Tigrão', 'B/C/D', 'tigrao@gmail.com', '59,90', '53,91', '⏳ usou (esperando Pix)', '#ffd763', 'botoes']]
        .map(([c, s, e, v1, v2, st, cor, b]) => `<div style="border-top:1px solid rgba(242,232,207,.15);padding:6px 0;font-size:11px;font-weight:700;margin-top:6px">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span style="color:${GOLDA}">${c}</span><span style="opacity:.7">Série ${s}</span><span style="opacity:.55;font-size:10.5px">${e}</span><span style="margin-left:auto;opacity:.55;font-size:10px">07/09/2026</span></div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:3px;flex-wrap:wrap"><span><s style="opacity:.5">R$ ${v1}</s> → <b>R$ ${v2}</b></span><span style="color:${cor}">${st}</span>${b ? `<span style="margin-left:auto;border-radius:8px;padding:4px 9px;background:#2f9e57;color:#fff;${OSW};font-size:10.5px">✅ Pix caiu</span><span style="border:1px solid #ff8a75;border-radius:8px;padding:4px 9px;color:#ff8a75;${OSW};font-size:10.5px">❌ não pagou</span>` : ''}</div>
        </div>`).join('')}
    </div>
  </div>`

const tela = (titulo, corpo, sub, escuro = false) => `
  <div style="width:390px;flex:none">
    <p style="${OSW};font-size:13px;text-transform:uppercase;margin:0 0 6px">${titulo}</p>
    <div style="width:390px;min-height:760px;background:${escuro ? '#111' : CREME};border:3px solid ${INK};border-radius:22px;box-shadow:4px 4px 0 ${INK};overflow:hidden;padding:16px 14px">${escuro ? corpo : `<div style="background:${CREME};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:14px 12px">${corpo}</div>`}</div>
    <p style="font-size:11px;font-weight:700;color:#5a5647;margin:8px 2px 0;line-height:1.4">${sub}</p>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}*{box-sizing:border-box}body{margin:0;background:#e9e2cf;font-family:system-ui,sans-serif;color:${INK};padding:22px}h1{${OSW};font-size:22px;text-transform:uppercase;margin:0 0 14px}</style>
<h1>🎟️ Cupom de influenciador — só no batismo</h1>
<div style="display:flex;gap:22px;align-items:flex-start">
  ${tela('1 · batismo · antes de digitar', batismo(false), 'Um campo vazio entre a série e o Pix. <b>Nenhum código aparece</b>: só usa quem souber. Cupom errado ou vencido: "não encontrado", e o preço fica cheio.')}
  ${tela('2 · batismo · com PANTERA aplicado', batismo(true), 'Caixa fica verde com o desconto e o preço riscado → novo. O <b>Pix copia-e-cola já sai com R$ 53,91</b>. A mensagem da DM já diz "usei o cupom PANTERA, paguei R$ 53,91", e o uso é registrado pro relatório.')}
  ${tela('3 · Painel do Criador · cupons e relatório', painel(), 'Você cria o cupom aqui (código, nome, %, limite e validade opcionais) e ele vale na hora, sem deploy. Embaixo, por influenciador: quantos usaram, quantos você marcou como PAGOS, quanto entrou e quanto de desconto deu. Cada uso tem o botão "Pix caiu".', true)}
</div>`

writeFileSync('/tmp/mockup-cupom.html', html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await b.newPage({ viewport: { width: 1290, height: 900 }, deviceScaleFactor: 2 })
await pg.goto('file:///tmp/mockup-cupom.html'); await pg.waitForTimeout(400)
await pg.screenshot({ path: SAIDA, fullPage: true }); await b.close()
console.log('✅', SAIDA)
