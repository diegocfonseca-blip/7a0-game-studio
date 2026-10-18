// 🎁 MOCKUP · PREGÃO ABERTO SEM MONTE (16/10)
// Diego: sem Monte no fim; vaga vazia ganha profissional/bom DE GRAÇA. E perguntou: "como ele verá esse jogador de graça…
// e terá algum aviso na tela?". 3 lugares: faixa no topo · recado do "ninguém quis" · janela no fim com as cartas dadas.
// uso: node scripts/mockup-pregao-sem-monte.mjs → scripts/mockups/pregao-sem-monte.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const carta = (pos, nome, clube, cat, cor) => `<div class="ct" style="background:${cor}"><span class="pos">${pos}</span><span class="cat">${cat}</span><span class="ini">${nome[0]}</span><b>${nome}</b><small>${clube}</small><span class="gr">🎁 DE GRAÇA</span></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;color:#0C0C0C;padding:20px}
h1{margin:0;font-size:28px;text-transform:uppercase}.sub{margin:2px 0 16px;font-weight:500}
.cols{display:flex;gap:18px;align-items:flex-start}.col{width:330px}
.tag{display:inline-block;font-weight:700;text-transform:uppercase;border:3px solid #000;border-radius:10px;padding:2px 10px;box-shadow:3px 3px 0 #000;background:#FFC400;margin-bottom:10px;font-size:14px}
.nota{font-weight:500;font-size:13.5px;margin:10px 2px 0;line-height:1.3}
.hd{background:#141414;color:#fff;border-radius:16px;padding:12px;display:flex;gap:10px;align-items:center;box-shadow:3px 3px 0 #000}
.hd b{font-size:19px;text-transform:uppercase}.hd small{display:block;font-weight:500;font-size:11.5px;opacity:.85}
.cx{margin-left:auto;background:#FFC400;color:#000;border:2px solid #fff;border-radius:10px;padding:4px 8px;text-align:center;font-weight:700}
.novo{display:block;margin-top:6px;background:#1B7A3D;border:2px solid #fff;border-radius:8px;padding:3px 7px;font-size:11.5px;font-weight:700;opacity:1}
.roxo{background:#7C3AED;color:#fff;border:3px solid #000;border-radius:12px;padding:8px 10px;font-size:13px;font-weight:700;font-family:sans-serif}
.velho{opacity:.45;text-decoration:line-through;margin-bottom:8px}
.modal{background:#F4ECD6;border:4px solid #000;border-radius:20px;box-shadow:5px 5px 0 #000;padding:14px;text-align:center}
.modal h2{margin:0;font-size:24px;text-transform:uppercase;line-height:1.05}.modal p{margin:4px 0 12px;font-weight:500;font-size:13px}
.cards{display:flex;gap:8px;justify-content:center}
.ct{position:relative;width:96px;height:132px;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:6px;text-align:left}
.ct .pos{position:absolute;top:5px;left:5px;background:#000;border-radius:6px;padding:0 5px;font-size:11px}
.ct .cat{position:absolute;top:6px;right:5px;font-size:8.5px}
.ct .ini{position:absolute;top:34px;left:50%;transform:translateX(-50%);width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.25);display:grid;place-items:center;font-size:20px;font-weight:700}
.ct b{font-size:12.5px;line-height:1}.ct small{font-size:9px;opacity:.85}
.ct .gr{position:absolute;bottom:-11px;left:50%;transform:translateX(-50%);background:#FFC400;color:#000;border:2px solid #000;border-radius:7px;font-size:9.5px;padding:0 5px;white-space:nowrap}
@keyframes enc{from{width:100%}to{width:0}}.barra{height:6px;background:#1B7A3D;border-radius:4px;width:62%;margin:-4px 0 8px}.btn{display:inline-block;margin-top:20px;background:#1B7A3D;color:#fff;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:6px 18px;font-weight:700;font-size:16px;text-transform:uppercase}
</style></head><body>
<h1>🎁 Pregão aberto sem Monte</h1><p class="sub">Onde a pessoa fica sabendo do jogador de graça.</p>
<div class="cols">
 <div class="col"><span class="tag">1 · Aviso no topo, desde o começo</span>
  <div class="hd"><span style="font-size:28px">🔨</span><div><b>Pregão aberto</b><small>carta 45 de 115 · ordem embaralhada: ninguém sabe a próxima</small>
   <span class="novo">🎁 Sem Monte: vaga vazia no fim ganha jogador de graça (nunca craque nem lenda)</span></div><span class="cx">32<br><small style="font-size:9px">SEU CAIXA</small></span></div>
  <p class="nota">Uma linha verde fixa embaixo do título. Quem entra já sabe que não tem Monte e que não vai ficar com time furado.</p></div>
 <div class="col"><span class="tag">2 · Quando ninguém quer a carta</span>
  <div class="roxo velho">🙈 Ninguém quis Robert Pires. Foi pro Monte.</div>
  <div class="roxo">🙈 Ninguém quis Robert Pires. Fica na sobra e pode cair de graça em quem terminar com vaga vazia.</div>
  <p class="nota">O texto de cima (riscado) é o de hoje. Sai o "foi pro Monte", que não existe mais nesse modo.</p></div>
 <div class="col"><span class="tag">3 · No fim, sem botão</span>
  <div class="modal"><div class="barra"></div><div style="font-size:34px">🎁</div><h2>Seu time fechou de graça!</h2><p>Você terminou com 3 vagas vazias. Elas ganharam jogador de graça.</p>
   <div class="cards">${carta('ATA', 'Robert Pires', 'Arsenal · 2004', '🎯 BOM', '#2fa65a')}${carta('LAT', 'Zé Roberto', 'Bayern · 2003', '⚽ PROF.', '#5f7f99')}${carta('ZAG', 'Gamarra', 'Corinthians · 1998', '🎯 BOM', '#2fa65a')}</div>
   <p style="margin:18px 0 0;font-size:11px;opacity:.6">some sozinho em 6s · toque fora pra fechar antes</p></div>
  <p class="nota">SEM BOTÃO e sem parar nada: aparece por cima da tela seguinte, some sozinho em 6s (a barrinha em cima mostra o tempo) e não segura a sala. Só pra quem ganhou carta.</p></div>
</div></body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(600)
await p.screenshot({ path: 'scripts/mockups/pregao-sem-monte.png', fullPage: true }); await b.close()
console.log('scripts/mockups/pregao-sem-monte.png')
