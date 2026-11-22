// Mockup: a caixa de explicação do 🃏 Bafo na tela de criar sala (com o pacotinho verde do campeão)
import { createRequire } from 'module'
const { chromium } = createRequire(import.meta.url)('playwright')
import fs from 'fs'
const pack = 'data:image/webp;base64,' + fs.readFileSync('src/escalacao/img/online-pacote-v20.webp').toString('base64')
const modos = [['🔨','Rápido','Leilão e uma temporada.'],['🏆','Liga da Turma','A liga dos amigos, que não acaba.'],['📋','Liga Draft','Começa fraco e pega 1 no draft.'],['👑','Kings League','As regras da Kings.'],['🃏','Bafo','Suas cartas de campeão em jogo.',1],['🌐','Carreira','Subam juntos até a Série A.']]
const html = (w) => `<html><head><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>body{margin:0;background:#0d1410;font-family:Inter,sans-serif;padding:14px}
.sec{background:#fff;border:3px solid #0C0C0C;box-shadow:3px 3px 0 #0C0C0C;border-radius:16px;padding:12px;color:#0C0C0C;max-width:${w}px;margin:auto}
.os{font-family:Oswald;font-weight:700;text-transform:uppercase}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.m{border:2.5px solid #0C0C0C;border-radius:12px;background:#F4ECD6;padding:8px;text-align:center;min-height:48px}
.m.sel{background:#FFC400;box-shadow:2px 2px 0 #0C0C0C}.m b{font-family:Oswald;font-size:14px;text-transform:uppercase;display:block}.m small{font-size:10.5px;font-weight:600;color:#6b6250}
.ex{margin-top:10px;border:2.5px solid #0C0C0C;border-radius:12px;background:#F4ECD6;padding:10px;display:flex;gap:12px;align-items:center}
.ex img{width:${w<500?78:104}px;flex-shrink:0;filter:drop-shadow(3px 3px 0 rgba(0,0,0,.35));transform:rotate(-5deg)}
.ex h4{margin:0 0 4px;font-family:Oswald;font-size:16px;text-transform:uppercase;line-height:1.1}
.ex p{margin:3px 0;font-size:12px;font-weight:600;line-height:1.35}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.tag{font-size:10.5px;font-weight:800;border:2px solid #0C0C0C;border-radius:8px;padding:3px 7px;background:#fff}
.tag.g{background:#1B7A3D;color:#fff}.tag.r{background:#FFE3DC}
</style></head><body><div class="sec">
<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px"><span class="os" style="width:28px;height:28px;border-radius:50%;background:#0C0C0C;color:#FFC400;display:grid;place-items:center">1</span><div><div class="os" style="font-size:17px">🎮 O jogo</div><div style="font-size:11.5px;font-weight:600;color:#6b6250">O que vocês vão jogar hoje</div></div></div>
<div class="grid">${modos.map(m=>`<div class="m ${m[3]?'sel':''}"><b>${m[0]} ${m[1]}</b><small>${m[2]}</small></div>`).join('')}</div>
<div class="ex"><img src="${pack}"><div>
<h4>🃏 Bafo: suas cartinhas de campeão em jogo</h4>
<p>Sabe o pacotinho que você abre quando é campeão? No Bafo você joga com <b>essas cartas</b>.</p>
<p>Cada um convoca 22. Sem leilão, sem bots, só liga. <b>O campeão toma 1 carta de alguém.</b></p>
<div class="tags"><span class="tag g">🆓 1ª sala do dia é grátis</span><span class="tag">🚪 Entrar é livre, quantas quiser</span><span class="tag r">🃏 Precisa de 11+ cartinhas de campeão</span></div>
</div></div></div></body></html>`
const b = await chromium.launch()
for (const [nome, w, vw] of [['cel', 362, 390], ['pc', 760, 820]]) {
  const p = await b.newPage({ viewport: { width: vw, height: 600 }, deviceScaleFactor: 2 })
  await p.setContent(html(w)); await p.waitForTimeout(900)
  await p.screenshot({ path: `scripts/mockups/bafo-criar-${nome}.png`, fullPage: true })
}
await b.close()
