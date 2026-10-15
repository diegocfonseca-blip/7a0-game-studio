#!/usr/bin/env node
// 🎨 MOCKUP — GALA ÚNICA do 🐍 TRICOLOR DO ARRUDA FC (14/10). Pedido do dono (Geovany), aprovado pra mockup pelo Diego:
// a arquibancada do Arruda com o bandeirão e o ESCUDO SUBINDO na tela. Mesma régua das outras galas únicas (Neymarzetti/K9):
// tela escurece → show → a MASCOTE sobe → volta (14/10, Diego: "o mascote é que chega subindo; o escudo fica no bandeirão"), ~5 s. Tudo desenhado aqui (mosaico em quadradinhos = 0 KB); NADA da foto que ele
// mandou (tinha escudo oficial do Santa Cruz e placa de patrocinador de verdade). Usa o escudo e a cobra do BATISMO dele.
// uso: node scripts/mockup-gala-arruda.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const F = w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`
const ESC = `data:image/webp;base64,${b64('src/escalacao/img/arruda-escudo.webp')}`
const MAS = `data:image/webp;base64,${b64('src/escalacao/img/arruda-mascote.webp')}`
// mosaico da arquibancada: faixas vermelho/branco/preto em LINHA RETA (14/10, Diego: "tem que ser uma linha reta")
const mosaico = (lin, col) => { let h = ''; for (let y = 0; y < lin; y++) for (let x = 0; x < col; x++) { const faixa = Math.floor(x / 6) % 3; const c = ['#C8102E', '#F4F4F4', '#111'][faixa]; h += `<i style="background:${c}"></i>` } return h }
const cena = (fase) => `<div class="tela">
  <div class="estadio">
    <div class="teto"></div>
    <div class="band"><span class="t1">TRICOLOR DO ARRUDA</span><span class="t2">A TORCIDA MAIS APAIXONADA</span><img class="cobra" src="${ESC}"></div>
    <div class="mos">${mosaico(14, 36)}</div>
    <div class="gram"></div>
  </div>
  ${fase === 1 ? '' : `<img class="esc ${fase === 2 ? 'sub' : 'top'}" src="${MAS}">`}
  ${fase === 3 ? `<div class="faixa"><small>CHEGOU NA SALA</small><b>TRICOLOR DO ARRUDA FC</b><em>🎤 "Ô ARRUDA! Ô ARRUDA!"</em></div>` : ''}
  <div class="tag">${fase === 1 ? '0,0 s · a arquibancada acende' : fase === 2 ? '1,5 s · a cobra vem subindo' : '3,0 s · a cobra no telão + a torcida canta'}</div>
</div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${F(500)}${F(700)}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Arial,sans-serif;padding:18px;width:1170px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{font-weight:700;font-size:13px;color:#3a3a32;margin:0 0 14px}
.row{display:flex;gap:18px}
.tela{position:relative;width:360px;height:640px;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;overflow:hidden;background:#05070a}
.estadio{position:absolute;inset:0;background:linear-gradient(#0b0d12,#151a22 30%,#0b0d12)}
.teto{position:absolute;left:0;right:0;top:0;height:70px;background:repeating-linear-gradient(90deg,#2a3340 0 10px,#1a2028 10px 40px);opacity:.8;border-bottom:3px solid #333}
.band{position:absolute;left:-10px;right:-10px;top:120px;height:110px;background:#F4F4F4;border-top:5px solid #C8102E;border-bottom:5px solid #111;transform:rotate(-2deg);display:flex;flex-direction:column;justify-content:center;padding-left:24px;box-shadow:0 6px 0 rgba(0,0,0,.4)}
.band .t1{font:700 21px/1 Oswald;color:#C8102E;letter-spacing:.02em;text-shadow:2px 2px 0 #111}.band .t2{font:700 13px Oswald;color:#111;letter-spacing:.12em;margin-top:4px}
.cobra{position:absolute;right:8px;top:12px;height:72px;transform:rotate(2deg);filter:drop-shadow(2px 3px 0 rgba(0,0,0,.5))}
.mos{position:absolute;left:0;right:0;top:250px;height:300px;display:grid;grid-template-columns:repeat(36,1fr);grid-template-rows:repeat(14,1fr);gap:1px;padding:2px;background:#000;}
.mos i{display:block;border-radius:1px}
.gram{position:absolute;left:0;right:0;bottom:0;height:80px;background:repeating-linear-gradient(90deg,#1B7A3D 0 30px,#219048 30px 60px);border-top:4px solid #F4ECD6}
.esc{position:absolute;left:50%;width:auto;filter:drop-shadow(0 0 22px rgba(255,255,255,.55)) drop-shadow(4px 4px 0 #000)}
.esc.sub{height:260px;bottom:-110px;transform:translateX(-50%)}
.esc.top{height:300px;top:230px;transform:translateX(-50%)}
.faixa{position:absolute;left:14px;right:14px;bottom:96px;background:#0C0C0C;border:3px solid #FFC400;border-radius:14px;padding:8px;text-align:center;color:#fff}
.faixa small{display:block;font:700 12px Oswald;letter-spacing:.2em;color:#FFC400}.faixa b{display:block;font:700 24px Oswald}.faixa em{display:block;font-style:normal;font:700 14px Oswald;color:#ff6b6b;margin-top:2px}
.tag{position:absolute;left:10px;top:10px;background:#FFC400;border:2px solid #0C0C0C;border-radius:8px;font:700 12px Oswald;padding:2px 8px}
.notas{margin-top:16px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:12px 14px;font-size:13px;font-weight:700;line-height:1.5}
</style></head><body>
<h1>🐍 Gala única · Tricolor do Arruda FC</h1><p class="sub">Mesma régua das galas do Neymarzetti e do K9: a tela escurece, entra o show, a mascote sobe e volta tudo · ~5 s · quem já estava na sala não espera nada.</p>
<div class="row">${cena(1)}${cena(2)}${cena(3)}</div>
<div class="notas">• A arquibancada é desenhada em quadradinhos (vermelho, branco e preto) — <b>0 KB</b> a mais no jogo.<br>• O bandeirão diz <b>TRICOLOR DO ARRUDA</b> com o <b>escudo do batismo</b> na ponta.<br>• Quem <b>sobe</b> é a <b>cobra, a mascote do batismo dele</b>. Nada do escudo oficial do Santa Cruz nem placa de patrocinador real.<br>• O canto da torcida que ele já tem toca junto.</div>
</body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1170, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `gala-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/gala-arruda.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/gala-arruda.png')
