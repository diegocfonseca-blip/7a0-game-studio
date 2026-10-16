#!/usr/bin/env node
// 📧 MOCKUP — telas do modo KINGS LEAGUE pro e-mail ao comercial da Kings (16/10, Diego: "faça o mockups de algumas
// telas pra eu mostrar também no e-mail"). Não desenha nada novo: recorta as FOTOS REAIS do jogo que já estão em
// scripts/mockups (kings-rapida-telas · kings-v2-no-jogo · kings-arena-no-jogo) e monta 2 folhas com legenda.
// uso: node scripts/mockup-kings-email.mjs  →  scripts/mockups/kings-email-1.png e kings-email-2.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const SRC = {
  rapida: { url: `data:image/png;base64,${b64('scripts/mockups/kings-rapida-telas.png')}`, w: 2400, h: 800, col: 400, top: 0, alt: 800, esc: 0.75 },
  v2: { url: `data:image/png;base64,${b64('scripts/mockups/kings-v2-no-jogo.png')}`, w: 1200, h: 1290, col: 300, top: 45, alt: 600, esc: 1, linha: 645 },
  arena: { url: `data:image/png;base64,${b64('scripts/mockups/kings-arena-no-jogo.png')}`, w: 1800, h: 645, col: 300, top: 45, alt: 600, esc: 1 },
}
// recorta UMA tela (coluna/linha) da foto real, sempre 300 × 600 na folha
const tela = (s, col, linha, n, titulo, texto) => {
  const S = SRC[s]
  const x = col * S.col * S.esc, y = ((linha ?? 0) * (S.linha ?? 0) + S.top) * S.esc
  return `<div class="cel"><div class="fone"><div class="img" style="background-image:url(${S.url});background-size:${S.w * S.esc}px ${S.h * S.esc}px;background-position:-${x}px -${y}px"></div></div>
  <div class="leg"><span class="n">${n}</span><b>${titulo}</b><small>${texto}</small></div></div>`
}
const topo = (t, s) => `<div class="topo"><div class="coroa">👑</div><div><h1>${t}</h1><p>${s}</p></div><div class="site">leilaolegends.com</div></div>`

const folha1 = `${topo('Kings League no Leilão Legends', 'O modo pronto, em teste fechado · fotos reais do jogo no celular')}
<div class="grade">
${tela('rapida', 0, 0, 1, 'As regras num lugar só', 'Antes de começar, um resumo curto. E o aviso: o jogo explica cada regra na hora que ela acontece.')}
${tela('rapida', 1, 0, 2, 'Leilão de Futebol 7', 'Cada um monta o time num leilão às cegas: goleiro, 2 zagueiros, 2 meias e 2 atacantes.')}
${tela('rapida', 2, 0, 3, 'Vestiário: carta secreta', 'Antes da rodada, cada um escolhe a sua carta: pênalti, shootout, suspensão ou gol em dobro.')}
${tela('arena', 3, 0, 4, 'A bola cai do alto', 'A partida começa como na Kings: a bola cai no meio e entra um jogador de cada lado por minuto.')}
</div>`

const folha2 = `${topo('Cada regra explicada na hora', 'O jogo para alguns segundos, mostra a regra e volta sozinho · aprende jogando')}
<div class="grade">
${tela('v2', 1, 1, 5, 'Minuto 18: o dado', 'O dado decide quantos jogam até o intervalo. Mesma regra, mesmo minuto, em todos os jogos.')}
${tela('v2', 2, 0, 6, 'Pênalti do presidente', 'O próprio jogador bate o pênalti. Contra outra pessoa, um bate e o outro defende ao mesmo tempo.')}
${tela('v2', 0, 1, 7, 'Carta secreta em campo', 'No 2º tempo a carta entra em ação, com a explicação de cada uma na tela.')}
${tela('rapida', 5, 0, 8, 'Tabela e campeão', 'Pontos da Kings: vitória 3, vitória no shootout 2, derrota no shootout 1. No fim, o campeão.')}
</div>`

const css = `${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Arial,sans-serif;color:#0C0C0C;padding:26px;width:1400px}
.topo{display:flex;align-items:center;gap:16px;background:#0C0C0C;color:#fff;border-radius:20px;padding:16px 22px;box-shadow:5px 5px 0 #C2452F;margin-bottom:24px}
.coroa{font-size:44px}.topo h1{font:700 36px/1 Oswald;text-transform:uppercase;margin:0;color:#FFC400}.topo p{margin:6px 0 0;font-weight:700;font-size:15px;opacity:.85}
.site{margin-left:auto;font:700 16px Oswald;background:#FFC400;color:#0C0C0C;border:2px solid #fff;border-radius:10px;padding:6px 12px}
.grade{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
.cel{display:flex;flex-direction:column;align-items:center;gap:12px}
.fone{background:#0C0C0C;border-radius:28px;padding:10px;box-shadow:5px 5px 0 #0C0C0C;border:3px solid #0C0C0C}
.img{width:300px;height:600px;border-radius:18px;background-repeat:no-repeat}
.leg{position:relative;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:10px 12px 10px 16px;width:320px;min-height:96px}
.leg .n{position:absolute;left:-11px;top:-11px;width:28px;height:28px;border-radius:999px;background:#FFC400;border:2px solid #0C0C0C;font:700 15px Oswald;display:grid;place-items:center}
.leg b{font:700 17px Oswald;text-transform:uppercase;display:block}.leg small{font-size:12.5px;font-weight:700;line-height:1.35;color:#3a3a32;display:block;margin-top:3px}`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
for (const [i, corpo] of [folha1, folha2].entries()) {
  const tmp = resolve(tmpdir(), `kings-email-${process.pid}-${i}.html`)
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${corpo}</body></html>`)
  await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
  await p.screenshot({ path: `scripts/mockups/kings-email-${i + 1}.png`, fullPage: true })
  console.log(`📸 scripts/mockups/kings-email-${i + 1}.png`)
}
await b.close()
