#!/usr/bin/env node
// ─── 🎨 MOCKUP — o caminho do calendário: Central → dia de jogo → Jogos → Central (25/10) ───
// Diego: *"não deveria jogar pra aba de jogos só quando fosse ter jogo… acabou o jogo volta pra central, na qual a pessoa
// fica livre… quando chegar no dia do jogo automaticamente jogaria ele pra aba do jogo"*. HTML estático.
// uso: node scripts/mockup-calendario-fluxo.mjs → scripts/mockups/calendario-fluxo.png
import { chromium } from 'playwright-core'
const css = `
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;padding:22px;font-family:Inter,system-ui;color:#0C0C0C}
.o{font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font:700 32px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{font:600 13px Inter;color:#53534b;margin:0 0 16px}
.row{display:flex;gap:14px;align-items:flex-start}
.ph{width:330px;flex:none}.hd{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.n{font:700 18px Oswald;background:#FFC400;border:3px solid #000;border-radius:9px;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;box-shadow:3px 3px 0 #000}
.hd b{font:700 18px Oswald;text-transform:uppercase}.ph>p{font:600 11.5px Inter;color:#53534b;margin:0 0 8px;min-height:62px}
.seta{font:700 30px Oswald;align-self:center;margin-top:60px}
.tela{border:4px solid #000;border-radius:26px;box-shadow:6px 6px 0 #000;background:#F4ECD6;overflow:hidden;height:640px;position:relative}
.top{background:#0C0C0C;color:#fff;padding:8px 12px;display:flex;align-items:center;gap:8px;font:700 13px Oswald}
.top .t1{background:#C8B98A;color:#000;border-radius:6px;padding:1px 6px}
.dark{background:#0C0C0C;color:#fff;padding:10px}
.sem{display:flex;gap:4px;margin-top:8px}
.d{flex:1;text-align:center;border:2px solid #444;border-radius:8px;padding:3px 0;color:#bbb;font:700 9px Oswald;text-transform:uppercase;background:#26261d}
.d b{display:block;font:700 17px Oswald;color:#fff}.d i{display:block;font-style:normal;font-size:11px}
.d.hoje{border-color:#FFC400;background:#3a3420}.d.hoje b{color:#FFC400}
.d.jogo{background:#1B7A3D;border-color:#000;color:#fff}.d.copa{background:#7C3AED;border-color:#000;color:#fff}.d.passou{opacity:.35}
.body{padding:10px}
.box{background:#fff;border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:9px;margin-bottom:9px}
.cinza{background:#e9e0c6;border:3px dashed #9c9478;border-radius:14px;padding:12px;margin-bottom:9px;font:700 12px Oswald;text-transform:uppercase;color:#7a735c;text-align:center}
.nav{position:absolute;bottom:0;left:0;right:0;background:#fff;border-top:2px solid #0002;display:flex;padding:6px 0 8px}
.nav span{flex:1;text-align:center;font:700 9.5px Oswald;text-transform:uppercase;color:#888;position:relative}
.nav span.on{color:#000;text-decoration:underline 3px #FFC400}
.nav em{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font:700 8.5px Oswald;font-style:normal;background:#C2452F;color:#fff;border:2px solid #000;border-radius:6px;padding:0 4px;white-space:nowrap}
.nav em.v{background:#1B7A3D}
.esc{width:46px;height:46px;border-radius:50%;background:#fff;border:3px solid #000;display:flex;align-items:center;justify-content:center;font:700 15px Oswald;color:#000}
.vs{display:flex;align-items:center;justify-content:space-around;margin:6px 0}
.btn{display:block;text-align:center;font:700 15px Oswald;text-transform:uppercase;background:#FFC400;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;padding:8px}
.mini{font:600 10.5px Inter;color:#53534b;margin:0}
.over{position:absolute;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:20px}
.strip{background:#14140f;color:#fff;padding:6px 10px;display:flex;align-items:center;gap:8px;border-bottom:3px solid #FFC400;font:700 12px Oswald;text-transform:uppercase}
.strip span.p{margin-left:auto;background:#FFC400;color:#000;border:2px solid #000;border-radius:7px;padding:2px 7px;font-size:10.5px}
`
const sem = (hoje, passou) => '<div class="sem">' + [['DOM', 15, 'jogo', '⚽'], ['SEG', 16], ['TER', 17], ['QUA', 18, 'copa', '🏆'], ['QUI', 19], ['SEX', 20], ['SÁB', 21]]
  .map(([n, d, k, ic], i) => `<div class="d ${k ?? ''} ${d === hoje ? 'hoje' : ''} ${i < passou ? 'passou' : ''}">${n}<b>${d}</b><i>${ic ?? '&nbsp;'}</i></div>`).join('') + '</div>'
const top = '<div class="top"><span class="t1">T1</span>Rodada 3/38<span style="color:#aaa;font:600 11px Inter">Várzea</span><span style="margin-left:auto">🥇 14º · 🪙 104</span></div>'
const nav = (on, badge) => `<div class="nav">${['Central', 'Jogos + tabela', 'Elenco', 'Rank', 'Clube'].map(t => `<span class="${t === on ? 'on' : ''}">${t === 'Jogos + tabela' && badge ? badge : ''}▢<br>${t}</span>`).join('')}</div>`
const central = (hoje, passou, extra = '') => top + `<div class="dark"><div class="o" style="font:700 22px Oswald">📺 Central <span style="color:#FFC400">Legends</span></div>
<div style="display:flex;align-items:center;gap:8px;margin-top:6px"><div><div class="o" style="font:700 15px Oswald;color:#FFC400">📅 ${hoje === 16 ? 'Segunda, 16 de fevereiro' : 'Terça, 17 de fevereiro'}</div><div style="font:600 11px Inter;color:#d8cfae">os dias passam sozinhos · ⏸️ toque pra parar</div></div><span class="btn" style="margin-left:auto;padding:4px 8px;font-size:11px">⏩ Pular</span></div>
${sem(hoje, passou)}</div>
<div class="body"><div class="box" style="background:#0C0C0C;color:#fff"><div class="o" style="font:700 11px Oswald;color:#FFC400">🏆 Próximo jogo · quarta, 18 · Copa</div><div class="vs"><div class="esc">NE</div><div class="o" style="font:700 24px Oswald;color:#FFC400">${hoje === 16 ? '2 dias' : 'amanhã'}</div><div class="esc">BB</div></div></div>
<div class="cinza">📰 jornal · notícias · transferências</div><div class="cinza">giro da rodada</div>${extra}</div>` + nav('Central', `<em class="v">${hoje === 16 ? '2 DIAS' : 'AMANHÃ'}</em>`)
const aviso = central(17, 2) + `<div class="over"><div class="box" style="text-align:center;padding:16px;width:100%"><div style="font-size:40px">⚽</div><div class="o" style="font:700 26px Oswald">Dia de jogo!</div><p class="mini" style="margin:4px 0 10px">Quarta, 18 · Copa · Nova Eclipse × Boleiros da Brisa</p><div class="btn" style="background:#1B7A3D;color:#fff">🏟️ Indo pro estádio… 3</div><p class="mini" style="margin-top:8px">vai sozinho em 3s · <u>ficar aqui</u></p></div></div>`
const jogos = top + `<div class="strip">🏆 Quarta, 18 · Copa<span class="p">⏸️</span></div><div class="body"><div class="box" style="background:#0C0C0C;color:#fff;height:210px"><div class="o" style="font:700 11px Oswald;color:#FFC400">placar cinema · do mesmo tamanho de hoje</div><div class="vs" style="margin-top:30px"><div class="esc">NE</div><div class="o" style="font:700 40px Oswald">1 × 0</div><div class="esc">BB</div></div><div style="text-align:center;font:700 14px Oswald;color:#FFC400">63'</div></div><div class="cinza">tática embaixo dos gols</div><div class="cinza">chaveamento da copa / tabela da liga</div><div class="cinza">outros jogos</div></div>` + nav('Jogos + tabela', '<em>AO VIVO</em>')
const volta = central(19, 4, '').replace('Segunda, 16 de fevereiro', 'Quinta, 19 de fevereiro').replace('Terça, 17 de fevereiro', 'Quinta, 19 de fevereiro').replace(/amanhã|2 dias/, '3 dias').replace('AMANHÃ</em>', '3 DIAS</em>').replace('quarta, 18 · Copa', 'domingo, 22 · Liga').replace('🏆 Próximo', '⚽ Próximo').replace('<div class="cinza">📰', '<div class="box" style="border-color:#1B7A3D"><b class="o" style="font-size:13px">✅ Copa: Nova Eclipse 2 × 1 Boleiros da Brisa</b><p class="mini">o resultado fica aqui em cima até o próximo jogo · <u>ver súmula</u></p></div><div class="cinza">📰')
const ph = (n, tit, sub, html) => `<div class="ph"><div class="hd"><span class="n">${n}</span><b>${tit}</b></div><p>${sub}</p><div class="tela">${html}</div></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@500;600;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
<h1>📅 A semana da carreira · <span style="color:#C2452F">a Central é a casa</span></h1>
<p class="sub">Os dias passam na CENTRAL. Chegou o dia do jogo, o jogo te leva pro estádio (aba Jogos). Apitou, volta pra Central. Nas abas Elenco, Rank e Clube: só a faixa fina com a data e o ⏸️.</p>
<div class="row">
${ph('1', 'Central: os dias passam', 'É onde você fica. A semana de domingo a sábado em cima (hoje em amarelo, ⚽ domingo liga, 🏆 quarta copa), o próximo jogo com a contagem, e o jornal/giro embaixo.', central(16, 1))}
<div class="seta">→</div>
${ph('2', 'Chegou o dia: aviso', 'No dia do jogo aparece "Dia de jogo!" e em 3s vai sozinho pro estádio. Quem estiver mexendo no elenco pode tocar em "ficar aqui" e ir depois.', aviso)}
<div class="seta">→</div>
${ph('3', 'Jogos: só no dia do jogo', 'O placar cinema do mesmo tamanho de hoje, a tática, a tabela ou o chaveamento e os outros jogos. Igual ao que já está no ar.', jogos)}
<div class="seta">→</div>
${ph('4', 'Apitou: volta pra Central', 'Acabou o jogo (e a coletiva), volta pra Central e os dias voltam a passar. O resultado fica em cima até o próximo jogo.', volta)}
</div></body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await (await b.newContext({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: 2 })).newPage()
await p.setContent(html, { waitUntil: 'networkidle' }).catch(() => {})
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'scripts/mockups/calendario-fluxo.png', fullPage: true })
await b.close(); console.log('ok')
