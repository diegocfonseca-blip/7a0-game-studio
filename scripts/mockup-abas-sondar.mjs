// ─── 🕵️ MOCKUP: as abas VENDER · SONDAR mais visíveis ──────────────────────
// Pedido do Diego (28/08): *"ninguém tá achando a aba do rodapé dos técnicos na
// carreira que se chama Sondar… deixa aí, mas coloque duas pílulas em cima
// também… ou deixe colorido… faça o mockup de antes e depois"*.
//
// Compara três estados da MESMA tela (a janela antes do leilão, na carreira):
//   ANTES   — só o rodapé, ícone cinza quando desligado (é o que está no ar)
//   DEPOIS  — pílulas em CIMA + rodapé COLORIDO, com bolinha de "não viu ainda"
//
// 📐 Tamanho de celular real (390×844) pra ele ver do jeito que vai ver no
// aparelho. As duas telas lado a lado, com legenda embaixo de cada uma.
//
//   node scripts/mockup-abas-sondar.mjs [--saida abas-sondar.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'abas-sondar.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
// cor do jogador (tier) — no jogo vem do APOIO_PERKS; aqui o verde do padrão
const COR = GREEN

// ── miolo da tela: é o mesmo nos dois lados, pra a diferença ficar só nas abas ──
const cabecalho = `
  <div style="background:${INK};color:#fff;border:3px solid ${INK};border-radius:14px;
              box-shadow:3px 3px 0 ${INK};padding:10px 12px;margin-bottom:10px">
    <span style="${OSW};font-weight:900;font-size:13">📋 LISTAR PRA LEILÃO · TEMP. 3</span>
  </div>`

const cartaoJogador = (nome, pos, clube) => `
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};
              padding:8px 10px;margin-bottom:7px;display:flex;align-items:center;gap:8px">
    <span style="background:${INK};color:#fff;${OSW};font-size:9;border-radius:6px;padding:2px 6px">${pos}</span>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-weight:900;font-size:12.5;margin:0">${nome}</p>
      <p style="font-size:9.5;font-weight:700;color:rgba(0,0,0,.5);margin:1px 0 0">${clube}</p>
    </div>
    <span style="background:#EFE9D6;border:2px solid ${INK};border-radius:8px;${OSW};font-size:9.5;padding:3px 8px">📋 listar</span>
  </div>`

const miolo = `
  ${cartaoJogador('Ronaldinho Gaúcho', 'MEI', 'Atlético-MG · 2013')}
  ${cartaoJogador('Zico', 'MEI', 'Flamengo · 1981')}
  ${cartaoJogador('Bruno Rangel', 'ATA', 'Chapecoense · 2016')}
  ${cartaoJogador('Alan Ruschel', 'LAT', 'Chapecoense · 2016')}`

// ── RODAPÉ (o que existe hoje) ──
const rodape = (colorido) => {
  const aba = (ico, label, on, aviso) => {
    const cor = on ? COR : (colorido ? 'rgba(12,12,12,.55)' : 'rgba(12,12,12,.45)')
    // ANTES: ícone dessaturado quando desligado. DEPOIS: ícone sempre colorido.
    const filtro = (!on && !colorido) ? 'filter:grayscale(1) opacity(.5);' : ''
    return `
      <button style="flex:1;position:relative;background:${on && colorido ? 'rgba(27,122,61,.10)' : 'transparent'};
                     border:none;border-radius:10px;padding:3px 0 1px;color:${cor}">
        ${aviso ? `<span style="position:absolute;top:1px;right:22%;width:9px;height:9px;border-radius:50%;
                    background:#C2452F;border:1.5px solid #fff"></span>` : ''}
        <span style="display:block;font-size:19px;line-height:24px;${filtro}">${ico}</span>
        <span style="display:block;${OSW};font-weight:${on ? 900 : 700};font-size:9.5px;
                     text-transform:uppercase;letter-spacing:.02em;margin-top:2px">${label}</span>
      </button>`
  }
  return `
    <div style="position:absolute;left:0;right:0;bottom:0;background:rgba(250,247,238,.97);
                border-top:1.5px solid rgba(12,12,12,.13);box-shadow:0 -2px 12px rgba(0,0,0,.05);
                display:flex;gap:2px;padding:6px 6px 10px">
      ${aba('📋', 'Vender', true, false)}
      ${aba('🕵️', 'Sondar', false, colorido)}
    </div>`
}

// ── PÍLULAS DE CIMA (o que entra de novo) ──
const pilulas = `
  <div style="display:flex;gap:7px;margin-bottom:10px">
    <div style="flex:1;background:${COR};color:#fff;border:3px solid ${INK};border-radius:999px;
                box-shadow:3px 3px 0 ${INK};padding:7px 4px;text-align:center;${OSW};font-size:11.5;
                text-transform:uppercase;letter-spacing:.3px">📋 Vender</div>
    <div style="flex:1;position:relative;background:${GOLD};color:${INK};border:3px solid ${INK};border-radius:999px;
                box-shadow:3px 3px 0 ${INK};padding:7px 4px;text-align:center;${OSW};font-size:11.5;
                text-transform:uppercase;letter-spacing:.3px">🕵️ Sondar técnico
      <span style="position:absolute;top:-5px;right:-3px;background:#C2452F;color:#fff;font-size:8px;
                   font-weight:900;border:2px solid ${INK};border-radius:999px;padding:1px 6px">NOVO</span>
    </div>
  </div>`

const tela = (titulo, legenda, { comPilulas, colorido }) => `
  <div style="flex:none">
    <div style="${OSW};font-size:19px;text-transform:uppercase;text-align:center;margin-bottom:9px">${titulo}</div>
    <div style="position:relative;width:390px;height:600px;background:${CREME};border:4px solid ${INK};
                border-radius:22px;box-shadow:5px 6px 0 ${INK};overflow:hidden">
      <div style="padding:14px 13px 70px">
        ${cabecalho}
        ${comPilulas ? pilulas : ''}
        ${miolo}
      </div>
      ${rodape(colorido)}
    </div>
    <p style="font-size:14px;font-weight:600;line-height:1.45;margin:12px auto 0;max-width:390px;
              text-align:center;color:rgba(0,0,0,.72)">${legenda}</p>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE7D2;color:${INK};font-family:system-ui,-apple-system,sans-serif;
     width:1000px;padding:34px 30px 30px}
</style></head><body>
  <div style="text-align:center;margin-bottom:24px">
    <div style="display:inline-block;background:${GOLD};border:4px solid ${INK};border-radius:999px;
      box-shadow:4px 4px 0 ${INK};padding:7px 22px;${OSW};font-size:17px;text-transform:uppercase;letter-spacing:1px">
      🕵️ achar a aba SONDAR</div>
    <p style="font-size:15px;font-weight:600;margin:12px auto 0;max-width:740px;line-height:1.45">
      A aba existe e funciona — o problema é que ninguém vê. Do lado esquerdo o que está no ar hoje;
      do lado direito a proposta.</p>
  </div>
  <div style="display:flex;gap:34px;justify-content:center;align-items:flex-start">
    ${tela('Antes', 'Só o rodapé, e o ícone do Sondar fica <b>cinza e apagado</b> quando não está selecionado — parece desligado, não parece botão.', { comPilulas: false, colorido: false })}
    ${tela('Depois', 'Duas <b>pílulas grandes em cima</b> (com selo NOVO) + o rodapé <b>colorido</b>, com <b>bolinha vermelha</b> enquanto a pessoa nunca abriu.', { comPilulas: true, colorido: true })}
  </div>
</body></html>`

const tmp = `/tmp/mock-abas-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 820 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(`${SAIDA}`)
