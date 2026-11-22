import pkg from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pkg
const css = `body{margin:0;background:#3a3a3a;font-family:Inter,Arial,sans-serif;display:flex;gap:28px;padding:24px;align-items:flex-start}
.tel{width:400px;background:#F4ECD6;border-radius:26px;padding:14px;border:3px solid #000;box-sizing:border-box}
.box{background:#fff;border:3px solid #000;border-radius:16px;box-shadow:4px 4px 0 #000;padding:12px;margin-bottom:12px}
h3{margin:0 0 6px;font:900 15px Oswald;text-transform:uppercase}.sub{font-size:10.5px;font-weight:700;color:#0008;margin:0 0 8px}
.pts{display:grid;grid-template-columns:1fr auto;gap:4px 10px;font-size:12.5px;font-weight:800}.pts span:nth-child(even){font:900 13px Oswald;color:#1B7A3D;text-align:right}
.lin{display:flex;align-items:center;gap:8px;padding:7px 4px;border-top:1px solid #0001;font-size:13px;font-weight:700}
.lin .n{width:24px;font:900 15px Oswald}.lin .p{margin-left:auto;font:900 15px Oswald}.lin small{display:block;font-size:10.5px;color:#0007;font-weight:700}
.eu{background:linear-gradient(135deg,#FFE27A,#FFC400);border-radius:8px}
.abas{display:flex;gap:6px;margin-bottom:10px}.abas div{flex:1;text-align:center;border:2px solid #000;border-radius:9px;padding:7px 2px;font:900 11px Oswald;background:#fff}.abas .on{background:#FFC400}`
const rows = [['1','Garrafão do Zé','🇺🇸 EUA Oficial · Celtics','💍2 · 🏆1 · 🏀3',190],['2','Rua 9 Ballers','Street → NBA','💍1 · 🏀2 · 🔷1',100],['3','Diego','🇺🇸 EUA Oficial · Pelicans','🏆1',30],['4','Quadra Norte','Street → NBA','🔷2 · 🛝3',29],['5','Kobe Lover','🇺🇸 EUA Oficial · Lakers','🏀1',20]]
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@500;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
<div class="tel"><div class="abas"><div>Central</div><div>Jogos</div><div>Elenco</div><div class="on">Rank</div><div>Clube</div></div>
<div class="box"><h3>🌍 Ranking global do basquete</h3><p class="sub">Todo título vale pontos e o ranking soma. Conta a carreira de sempre e a EUA Oficial.</p>
<div class="pts"><span>💍 Anel da NBA (campeão das Finals)</span><span>+50</span><span>🏆 NBA Cup</span><span>+30</span><span>🏀 Melhor campanha da NBA (temporada regular)</span><span>+20</span><span>🔷 Campeão da G League</span><span>+10</span><span>🛝 Campeão da Street League</span><span>+3</span></div></div>
<div class="box" style="padding:8px 10px"><h3 style="padding:4px">Classificação geral</h3>${rows.map(([n,t,c,tt,p])=>`<div class="lin ${t==='Diego'?'eu':''}"><span class="n">${n}º</span><div><span>${t}</span><small>${c} · ${tt}</small></div><span class="p">${p}</span></div>`).join('')}</div>
<p class="sub" style="text-align:center">Mesma régua do futebol: a taça maior vale mais, e empate desempata pelo caixa.</p></div></body></html>`
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 460, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(2500)
await p.screenshot({ path: '/home/user/7a0-game-studio/scripts/mockups/basquete-ranking-global.png', fullPage: true }); await b.close()
