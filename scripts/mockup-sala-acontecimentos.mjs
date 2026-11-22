// 🛩️🏃🚚⚔️ 21/11: mockup das 4 ideias que o Diego pediu pra VER (partida nas salas): avião do acontecimento, mascote do novo líder,
// trio elétrico do campeão e "declarar rival". uso: node scripts/mockup-sala-acontecimentos.mjs  → scripts/mockups/sala-acontecimentos.png
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const img = n => 'data:image/webp;base64,' + fs.readFileSync(new URL(`../src/escalacao/img/${n}`, import.meta.url)).toString('base64')
const E = { ney: img('neymarzetti-escudo.webp'), dua: img('duarte-escudo.webp'), mon: img('monarca-tricolor-escudo.webp'), fut: img('futpoint-escudo.webp') }
const M = { ney: img('neymarzetti-mascote.webp'), dua: img('duarte-mascote.webp'), mon: img('monarca-tricolor-mascote.webp') }
const pres = img('career-president-terno.webp')
const placar = (a, b, ea, eb, g, min) => `<div class="pl"><div class="tm"><img src="${ea}"><b>${a}</b></div><div class="sc"><i>${min}</i><b>${g}</b></div><div class="tm"><img src="${eb}"><b>${b}</b></div></div>`
const linha = (p, e, n, pts, cls = '', extra = '') => `<div class="ln ${cls}"><span class="p">${p}</span><img src="${e}"><span class="n">${n}${extra}</span><b>${pts}</b></div>`
const tabela = (rows) => `<div class="tb"><div class="th">TABELA · RODADA 12</div>${rows}</div>`
const aviao = (txt, cor = '#C2452F') => `<div class="av"><div class="fx" style="background:${cor}">${txt}</div><div class="corda"></div><svg width="78" height="44" viewBox="0 0 78 44"><ellipse cx="38" cy="24" rx="30" ry="9" fill="#F4ECD6" stroke="#0C0C0C" stroke-width="3"/><path d="M30 22 L44 4 L52 4 L46 22Z M30 26 L44 42 L52 42 L46 26Z" fill="#FFC400" stroke="#0C0C0C" stroke-width="3" stroke-linejoin="round"/><path d="M8 22 L2 10 L12 10 L18 20Z" fill="#FFC400" stroke="#0C0C0C" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="22" r="3.5" fill="#7fd0ff" stroke="#0C0C0C" stroke-width="2"/><rect x="68" y="12" width="3" height="24" rx="1.5" fill="#0C0C0C"/></svg></div>`
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;800&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box}body{margin:0;background:#1b1b1b;font-family:Inter,Arial,sans-serif;padding:26px}
h1{font-family:Oswald;color:#FFC400;font-size:30px;margin:0 0 4px;text-transform:uppercase}.sub{color:#cfc6ae;font-size:15px;margin:0 0 22px}
.g{display:grid;grid-template-columns:repeat(4,390px);gap:26px}.c h2{font-family:Oswald;color:#fff;font-size:21px;margin:0 0 3px;text-transform:uppercase}.c p{color:#cfc6ae;font-size:13.5px;line-height:1.35;margin:0 0 10px;min-height:56px}
.ph{width:390px;height:760px;background:#0a0f0d;border:4px solid #000;border-radius:28px;position:relative;overflow:hidden;padding:14px}
.pl{background:linear-gradient(160deg,#143524,#0b1a12);border:3px solid #000;border-radius:18px;padding:16px 10px;display:flex;align-items:center;justify-content:space-between;box-shadow:4px 4px 0 #000}
.tm{width:104px;text-align:center}.tm img{height:62px}.tm b{display:block;font-family:Oswald;color:#fff;font-size:15px;margin-top:4px;text-transform:uppercase}
.sc{background:#F4ECD6;border:3px solid #000;border-radius:12px;padding:5px 14px;text-align:center}.sc i{display:block;font:800 12px Oswald;color:#C2452F;font-style:normal}.sc b{font:800 28px Oswald;color:#0C0C0C;white-space:nowrap}
.tb{background:#F4ECD6;border:3px solid #000;border-radius:16px;margin-top:14px;padding:8px 10px;box-shadow:4px 4px 0 #000}.th{font:800 13px Oswald;letter-spacing:1px;margin-bottom:5px}
.ln{display:flex;align-items:center;gap:8px;padding:5px 4px;border-top:1.5px solid rgba(0,0,0,.14);font-weight:700;font-size:14px}.ln img{height:24px;width:24px;object-fit:contain}.ln .p{width:18px;font:800 14px Oswald}.ln .n{flex:1}.ln b{font:800 15px Oswald}
.ln.eu{background:#FFE79A;border-radius:8px;border:2px solid #000}.ln.rv{background:#ffd9d2;border-radius:8px;border:2px solid #C2452F}
.tag{font:800 9.5px Oswald;background:#C2452F;color:#fff;border-radius:999px;padding:1px 6px;margin-left:6px;letter-spacing:.5px}
.av{position:absolute;top:470px;left:22px;display:flex;align-items:center;transform:rotate(-3deg)}.av svg{transform:scale(1.35);margin-left:12px}.fx{font:800 15px Oswald;color:#fff;border:3px solid #000;border-radius:8px;padding:7px 12px;box-shadow:3px 3px 0 #000;text-transform:uppercase;white-space:nowrap}.corda{width:22px;height:3px;background:#000}
.masc{position:absolute;left:150px;top:440px;text-align:center}.masc img{height:190px;filter:drop-shadow(5px 5px 0 #000);transform:rotate(-8deg)}.placa{font:800 16px Oswald;background:#FFC400;border:3px solid #000;border-radius:10px;padding:5px 12px;box-shadow:3px 3px 0 #000;display:inline-block;transform:rotate(-4deg);margin-bottom:-6px}
.risco{position:absolute;top:610px;left:20px;right:250px;height:4px;background:repeating-linear-gradient(90deg,#fff 0 14px,transparent 14px 26px);opacity:.55}
.trio{position:absolute;left:18px;right:18px;top:300px}.palco{display:flex;align-items:flex-end;justify-content:center;gap:6px;margin-bottom:-6px;position:relative;z-index:2}.palco img{filter:drop-shadow(3px 3px 0 #000)}
.cam{background:#7C3AED;border:4px solid #000;border-radius:14px 14px 8px 8px;padding:12px 10px 16px;box-shadow:5px 5px 0 #000;text-align:center;position:relative}
.cam .fa{background:#FFC400;border:3px solid #000;border-radius:8px;font:800 19px Oswald;padding:6px;text-transform:uppercase}.cx{display:flex;gap:8px;justify-content:center;margin-top:8px}.cx span{width:34px;height:34px;border-radius:50%;background:#0C0C0C;border:3px solid #F4ECD6;display:block}
.rodas{display:flex;justify-content:space-between;padding:0 34px;margin-top:-13px;position:relative;z-index:3}.rodas span{width:40px;height:40px;border-radius:50%;background:#0C0C0C;border:5px solid #888}
.conf{position:absolute;inset:0;pointer-events:none}.conf i{position:absolute;width:9px;height:15px;border:1.5px solid #000}
.cl{background:linear-gradient(160deg,#3a0d0d,#120606);border:3px solid #000;border-radius:18px;padding:12px 10px;box-shadow:4px 4px 0 #000;text-align:center;color:#fff}.cl .k{font:800 13px Oswald;color:#FFC400;letter-spacing:2px}.cl .vs{display:flex;align-items:center;justify-content:space-around;margin:8px 0}.cl .vs img{height:74px}.cl .vs b{font:800 44px Oswald;color:#E8503A}.cl .h{font-size:13px;font-weight:700;background:rgba(255,255,255,.1);border-radius:8px;padding:5px}
.bt{margin-top:12px;background:#C2452F;color:#fff;border:3px solid #000;border-radius:12px;font:800 16px Oswald;padding:10px;text-align:center;box-shadow:3px 3px 0 #000;text-transform:uppercase}
.duelo{margin-top:12px;background:#F4ECD6;border:3px solid #000;border-radius:14px;padding:9px;box-shadow:4px 4px 0 #000;font-weight:700;font-size:13.5px;text-align:center}.duelo b{font:800 15px Oswald}
</style>
<h1>Partida nas salas — 4 ideias pra ver</h1><p class="sub">Mockup, nada disso está no jogo. Escudos e mascotes são de clubes reais só pra dar a cara certa.</p>
<div class="g">
<div class="c"><h2>🛩️ Avião do acontecimento</h2><p>Cruza a tela de todos uma vez, no máximo 1 por rodada, com o lance mais forte (virada, hat-trick, clássico).</p>
<div class="ph">${placar('Neymarzetti','Duarte FC',E.ney,E.dua,'1 × 2','78′')}${aviao('🔥 VIRADA! Duarte FC 2×1')}${tabela(linha(1,E.mon,'Monarca Tricolor',27)+linha(2,E.dua,'Duarte FC',25)+linha(3,E.ney,'Neymarzetti',24,'eu')+linha(4,E.fut,'Futpoint FC',21))}</div></div>
<div class="c"><h2>🏃 Mascote do novo líder</h2><p>No apito da rodada, só quando a liderança TROCA: a mascote do novo líder atravessa a tela de todos em 2–3 s.</p>
<div class="ph">${placar('Duarte FC','Futpoint FC',E.dua,E.fut,'3 × 0','FIM')}${tabela(linha(1,E.dua,'Duarte FC',28)+linha(2,E.mon,'Monarca Tricolor',27)+linha(3,E.ney,'Neymarzetti',24,'eu')+linha(4,E.fut,'Futpoint FC',21))}<div class="risco"></div><div class="masc"><div class="placa">👑 NOVO LÍDER</div><br><img src="${M.dua}"></div></div></div>
<div class="c"><h2>🚚 Trio elétrico do campeão</h2><p>No apito final da liga, o trio passa pela tela de todos (~5 s, toque pula). Depois vêm o pacote e o jornal, como hoje.</p>
<div class="ph">${placar('Monarca Tricolor','Neymarzetti',E.mon,E.ney,'2 × 0','FIM')}<div class="conf">${Array.from({length:34},(_,i)=>`<i style="left:${(i*53)%370}px;top:${120+(i*97)%560}px;background:${['#FFC400','#C2452F','#1B7A3D','#fff'][i%4]};transform:rotate(${i*37}deg)"></i>`).join('')}</div>
<div class="trio"><div class="palco"><img src="${pres}" height="118"><img src="${E.mon}" height="104"><img src="${M.mon}" height="128"></div><div class="cam"><div class="fa">🏆 Monarca Tricolor campeão</div><div class="cx"><span></span><span></span><span></span><span></span><span></span></div></div><div class="rodas"><span></span><span></span></div></div></div></div>
<div class="c"><h2>⚔️ Declarar rival</h2><p>Cada técnico escolhe 1 rival na sala. O jogo entre os dois vira CLÁSSICO, a tabela marca o rival e o jornal fecha a conta no fim.</p>
<div class="ph"><div class="cl"><div class="k">⚔️ CLÁSSICO · RODADA 13</div><div class="vs"><img src="${E.ney}"><b>×</b><img src="${E.dua}"></div><div class="h">Histórico na sala: você 1 · empates 1 · ele 2</div></div>
${tabela(linha(1,E.dua,'Duarte FC',28,'rv','<span class="tag">SEU RIVAL</span>')+linha(2,E.mon,'Monarca Tricolor',27)+linha(3,E.ney,'Neymarzetti',24,'eu')+linha(4,E.fut,'Futpoint FC',21))}
<div class="duelo">⚔️ <b>VOCÊ × DUARTE FC</b><br>ele está 4 pontos na sua frente</div><div class="bt">⚔️ Declarar rival</div></div></div>
</div>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1720, height: 980 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' }).catch(() => {})
await p.waitForTimeout(600)
await p.screenshot({ path: new URL('./mockups/sala-acontecimentos.png', import.meta.url).pathname, fullPage: true })
// uma imagem por ideia (pra ver no celular)
const nomes = ['aviao', 'mascote-lider', 'trio-campeao', 'rival']
const cs = await p.locator('.c').all()
for (let i = 0; i < cs.length; i++) await cs[i].screenshot({ path: new URL(`./mockups/sala-${nomes[i]}.png`, import.meta.url).pathname })
await b.close()
