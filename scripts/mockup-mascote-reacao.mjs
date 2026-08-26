// 🐊 ANTES x DEPOIS — o tamanho da mascote na reação do leilão (26/08)
//
// Reclamação do Diego, com print do jogo ao vivo: *"não deu certo o mascote
// soltar ele!"*. O bicho estava desenhado com 30px de altura — tamanho de
// emoji. Emoji é UM desenho só; a mascote é um bicho de corpo inteiro, então a
// 30px ela vira um risquinho e ninguém reconhece de quem é.
//
// Este script desenha o botão e o balão do jeito que estava (30px) e do jeito
// que ficou (44px no botão, 52px no balão), com as mascotes de verdade tiradas
// do jogo — pro Diego comparar de olho.
//
//   node scripts/mockup-mascote-reacao.mjs --saida mascote-antes-depois.png
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'mascote-antes-depois.png')

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const CREME = '#F4ECD6', INK = '#0C0C0C', PURPLE = '#7C3AED', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { MASCOTES } = await vite.ssrLoadModule('/src/escalacao/mascotes.tsx')

// as 4 mascotes da amostra: 2 de imagem (.webp) e 2 de SVG, pra provar que
// o tamanho vale pros dois tipos de arte
const AMOSTRA = [
  ['neymarzetti_mascarado', 'Neymarzetti'],
  ['saoluiz_pitbull', 'São Luiz FC'],
  ['galo', 'Nightfull FC'],
  ['leao_seven', 'Seven City'],
]

const MASC_W = 170, MASC_H = 204
const mini = (art, alt) => {
  const s = alt / MASC_H
  return renderToStaticMarkup(
    React.createElement('span', { style: { display: 'inline-block', width: Math.round(MASC_W * s), height: alt, position: 'relative', flex: 'none', verticalAlign: 'bottom' } },
      React.createElement('span', { style: { position: 'absolute', left: 0, top: 0, width: MASC_W, height: MASC_H, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transform: `scale(${s})`, transformOrigin: 'top left' } }, art)))
}

const botao = (k, alt) => `<span style="display:inline-flex;align-items:center;gap:8px;background:#fff;border:2px solid ${PURPLE};border-radius:999px;padding:2px 13px 2px 6px;box-shadow:2px 2px 0 0 ${INK}">
  ${mini(MASCOTES[k], alt)}<span style="${OSW};font-weight:700;font-size:12px">SOLTA A SUA MASCOTE</span></span>`

const balao = (k, alt, quem) => `<span style="display:inline-flex;align-items:center;gap:7px;background:#fff;border:2px solid ${INK};border-radius:999px;padding:3px 13px 3px 7px;box-shadow:2px 2px 0 0 ${INK}">
  ${mini(MASCOTES[k], alt)}<span style="${OSW};font-weight:700;font-size:12px"><span style="color:${PURPLE}">${quem}:</span> soltou o bicho! 🔊</span></span>`

const bloco = (titulo, cor, nota, linhas) => `
  <div style="background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px 13px;margin-bottom:14px">
    <p style="${OSW};font-weight:700;font-size:14px;margin:0 0 2px;text-transform:uppercase;color:${cor}">${titulo}</p>
    <p style="font-size:11.5px;font-weight:700;color:rgba(0,0,0,.6);margin:0 0 11px;line-height:1.35">${nota}</p>
    ${linhas}
  </div>`

const linhasBotao = (alt) => AMOSTRA.map(([k, nome]) =>
  `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
     <span style="font-size:10.5px;font-weight:700;color:rgba(0,0,0,.45);width:88px;flex:none">${nome}</span>${botao(k, alt)}</div>`).join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box} img,video{max-width:100%;height:auto} img,svg{display:block}
body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,sans-serif;width:412px;padding:16px 14px 22px}
</style></head><body>

<div style="text-align:center;margin-bottom:12px">
  <span style="display:inline-block;background:#FFC400;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};padding:5px 14px;${OSW};font-weight:700;font-size:11px;letter-spacing:1.1px;text-transform:uppercase">🐊 A mascote na reação · antes x depois</span>
</div>

${bloco('❌ Como estava (30px)', RED, 'Do tamanho de um emoji. Só que emoji é um desenho só — a mascote é um bicho de corpo inteiro. Some.', linhasBotao(30))}
${bloco('✅ Como ficou (44px no botão)', GREEN, 'Mesma arte, mesmo peso de download. Só cresceu o bastante pra dar pra ver de quem é.', linhasBotao(44))}

<div style="background:#EFE7D2;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px 13px">
  <p style="${OSW};font-weight:700;font-size:14px;margin:0 0 2px;text-transform:uppercase">💬 O balão que sobe na tela (52px)</p>
  <p style="font-size:11.5px;font-weight:700;color:rgba(0,0,0,.6);margin:0 0 11px;line-height:1.35">É a hora dela aparecer, então no balão ela vem maior ainda.</p>
  <div style="display:flex;flex-direction:column;gap:7px;align-items:flex-start">
    ${balao('neymarzetti_mascarado', 30, 'Você')}
    <span style="font-size:11px;font-weight:700;color:${RED}">▲ antes &nbsp;·&nbsp; ▼ agora</span>
    ${balao('neymarzetti_mascarado', 52, 'Você')}
    ${balao('galo', 52, 'Braguinha')}
  </div>
</div>

<p style="margin:16px 0 0;${OSW};font-weight:700;font-size:12.5px;text-align:center;opacity:.5">⚽ Leilão Legends</p>
</body></html>`

// os .webp viram data URI (o SSR devolve só o caminho)
const htmlD = html.replace(/src="[^"]*?\/(src\/escalacao\/img\/[^"?]+\.webp)[^"]*"/g, (m, p1) =>
  `src="data:image/webp;base64,${readFileSync(p1).toString('base64')}"`)

const tmp = `/tmp/mascote-reacao-${process.pid}.html`
writeFileSync(tmp, htmlD)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close(); await vite.close()
console.log(SAIDA)
