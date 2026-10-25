#!/usr/bin/env node
// ─── 🎨 MOCKUP — o calendário da carreira em todas as abas (25/10) ───
// Diego: *"organizar em relação ao que fizemos de passar os dias e ter jogos domingo e quarta… aperfeiçoe melhor ainda e
// melhore nas outras abas… não sei se vai ficar lá em cima no topo… fica em todas as abas ou não?"*. HTML estático.
// uso: node scripts/mockup-calendario-abas.mjs → scripts/mockups/calendario-abas.png
import { chromium } from 'playwright-core'
const css = `
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;padding:22px;font-family:Inter,system-ui;color:#0C0C0C}
.o{font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font:700 32px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{font:600 13px Inter;color:#53534b;margin:0 0 16px}
.row{display:flex;gap:20px;align-items:flex-start}
.ph{width:340px;flex:none}.hd{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.n{font:700 18px Oswald;background:#FFC400;border:3px solid #000;border-radius:9px;min-width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;box-shadow:3px 3px 0 #000;padding:0 6px}
.hd b{font:700 19px Oswald;text-transform:uppercase}.ph>p{font:600 11.5px Inter;color:#53534b;margin:0 0 8px;min-height:46px}
.tela{border:4px solid #000;border-radius:26px;box-shadow:6px 6px 0 #000;background:#F4ECD6;overflow:hidden;height:640px;position:relative}
.top{background:#0C0C0C;color:#fff;padding:8px 12px;display:flex;align-items:center;gap:8px;font:700 13px Oswald}
.top .t1{background:#C8B98A;color:#000;border-radius:6px;padding:1px 6px}
.strip{background:#14140f;color:#fff;padding:7px 10px;display:flex;align-items:center;gap:8px;border-bottom:3px solid #FFC400}
.strip .dt{font:700 13px Oswald;text-transform:uppercase}.strip .px{font:600 10.5px Inter;color:#d8cfae}
.pular{margin-left:auto;font:700 11px Oswald;text-transform:uppercase;background:#FFC400;color:#000;border:2px solid #000;border-radius:8px;padding:4px 8px;box-shadow:2px 2px 0 #000;white-space:nowrap}
.sem{display:flex;gap:4px;padding:8px 10px;background:#1d1d16}
.d{flex:1;text-align:center;border:2px solid #444;border-radius:8px;padding:3px 0;color:#bbb;font:700 9px Oswald;text-transform:uppercase;background:#26261d}
.d b{display:block;font:700 15px Oswald;color:#fff}
.d.hoje{border-color:#FFC400;background:#3a3420}.d.hoje b{color:#FFC400}
.d.jogo{background:#1B7A3D;border-color:#000;color:#fff}.d.copa{background:#7C3AED;border-color:#000;color:#fff}.d.passou{opacity:.4}
.d i{display:block;font-style:normal;font-size:11px;line-height:1.1}
.body{padding:10px}
.box{background:#fff;border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:9px;margin-bottom:9px}
.cinza{background:#e9e0c6;border:3px dashed #9c9478;border-radius:14px;padding:10px;margin-bottom:9px;font:700 12px Oswald;text-transform:uppercase;color:#7a735c;text-align:center}
.nav{position:absolute;bottom:0;left:0;right:0;background:#fff;border-top:2px solid #0002;display:flex;padding:6px 0 8px}
.nav span{flex:1;text-align:center;font:700 9.5px Oswald;text-transform:uppercase;color:#777;position:relative}
.nav span.on{color:#000}.nav em{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font:700 8.5px Oswald;font-style:normal;background:#C2452F;color:#fff;border:2px solid #000;border-radius:6px;padding:0 4px;white-space:nowrap}
.nav em.v{background:#1B7A3D}
.big{background:#0C0C0C;color:#fff;border-radius:16px;border:3px solid #000;padding:10px;margin-bottom:9px}
.vs{display:flex;align-items:center;justify-content:space-around;margin:6px 0}
.esc{width:48px;height:48px;border-radius:50%;background:#fff;border:3px solid #000;display:flex;align-items:center;justify-content:center;font:700 16px Oswald;color:#000}
.cnt{font:700 26px Oswald;color:#FFC400;text-align:center}
.mini{font:600 10.5px Inter;color:#53534b;margin:0}
.reco{background:#1B7A3D;color:#fff;border:3px solid #000;border-radius:10px;padding:2px 8px;font:700 12px Oswald;text-transform:uppercase;margin-left:6px}
`
const semana = (hoje, passou = 0) => {
  const dias = [['DOM', 15, 'jogo', '⚽'], ['SEG', 16], ['TER', 17], ['QUA', 18, 'copa', '🏆'], ['QUI', 19], ['SEX', 20], ['SÁB', 21]]
  return '<div class="sem">' + dias.map(([n, d, k, ic], i) => `<div class="d ${k ?? ''} ${d === hoje ? 'hoje' : ''} ${i < passou ? 'passou' : ''}">${n}<b>${d}</b>${ic ? `<i>${ic}</i>` : '<i>&nbsp;</i>'}</div>`).join('') + '</div>'
}
const top = (rod = 'Rodada 3/38') => `<div class="top"><span class="t1">T1</span>${rod}<span style="color:#aaa;font:600 11px Inter">Várzea</span><span style="margin-left:auto">🥇 14º · 🪙 104</span></div>`
const strip = (sub = 'quarta: Copa × Boleiros da Brisa · daqui 2 dias') => `<div class="strip"><span style="font-size:18px">📅</span><div><div class="dt">Seg, 16 de fevereiro</div><div class="px">${sub}</div></div><span class="pular">⏩ Pular</span></div>`
const nav = (on, badge) => `<div class="nav">${['Central', 'Jogos + tabela', 'Elenco', 'Rank', 'Clube'].map(t => `<span class="${t === on ? 'on' : ''}">${t === 'Jogos + tabela' && badge ? badge : ''}▢<br>${t}</span>`).join('')}</div>`
const elenco = `<div class="box"><b class="o" style="font-size:15px">👥 Nova Eclipse</b><div style="display:flex;gap:6px;margin-top:6px"><span class="box" style="flex:1;margin:0;padding:5px;text-align:center;font:700 12px Oswald">4-3-3 ▾</span><span class="box" style="flex:1;margin:0;padding:5px;text-align:center;font:700 12px Oswald">Dinâmico ▾</span></div></div><div class="cinza" style="height:300px;padding-top:120px">campinho do elenco</div>`
// A — faixa fina em TODAS as abas + semana grande no Jogos
const A1 = top() + strip() + semana(16, 1) + `<div class="body"><div class="big"><div class="o" style="font:700 11px Oswald;color:#FFC400">🏆 Copa · quarta, 18 · 21h30</div><div class="vs"><div class="esc">NE</div><div class="cnt">2 DIAS</div><div class="esc">BB</div></div><div class="mini" style="color:#d8cfae;text-align:center">Nova Eclipse × Boleiros da Brisa · ida</div></div><div class="cinza">tabela da liga</div><div class="cinza">jogos da rodada</div></div>` + nav('Jogos + tabela', '<em class="v">2 DIAS</em>')
const A2 = top() + strip() + `<div class="body">${elenco}</div>` + nav('Elenco', '<em class="v">2 DIAS</em>')
// B — calendário só no Jogos; nas outras, só o selo na barra de baixo
const B2 = top('Seg 16 fev · Rodada 3/38') + `<div class="body">${elenco}</div>` + nav('Elenco', '<em class="v">QUA 18</em>')
// C — o cabeçalho preto vira o calendário (sem faixa nova)
const C2 = `<div class="top" style="flex-wrap:wrap"><span class="t1">T1</span>📅 SEG 16 FEV<span style="margin-left:auto">🥇 14º · 🪙 104</span><div style="flex-basis:100%;display:flex;gap:3px;margin-top:5px">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => `<span style="flex:1;text-align:center;font:700 9px Oswald;border-radius:5px;padding:2px 0;background:${i === 0 ? '#1B7A3D' : i === 3 ? '#7C3AED' : i === 1 ? '#FFC400' : '#2b2b22'};color:${i === 1 ? '#000' : '#fff'};opacity:${i === 0 ? .4 : 1}">${d}${i === 0 ? ' ⚽' : i === 3 ? ' 🏆' : ''}</span>`).join('')}<span class="pular" style="margin-left:4px;padding:1px 6px">⏩</span></div></div>` + `<div class="body">${elenco}</div>` + nav('Elenco', '<em class="v">2 DIAS</em>')
const ph = (n, tit, sub, html, reco) => `<div class="ph"><div class="hd"><span class="n">${n}</span><b>${tit}</b>${reco ? '<span class="reco">minha escolha</span>' : ''}</div><p>${sub}</p><div class="tela">${html}</div></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@500;600;800&display=swap" rel="stylesheet"><style>${css}</style></head><body>
<h1>📅 O calendário nas abas · <span style="color:#C2452F">3 jeitos</span></h1>
<p class="sub">Domingo ⚽ liga · quarta 🏆 copa · os outros dias passam. A semana vai de DOMINGO a SÁBADO, com o dia de hoje em amarelo e os jogos marcados.</p>
<div class="row">
${ph('A', 'Jogos: a semana inteira', 'Na aba Jogos, a semana inteira em cima e o PRÓXIMO JOGO grande com a contagem ("2 dias"). Tabela e jogos da rodada embaixo, como hoje.', A1, false)}
${ph('A', 'Outras abas: faixa fina', 'Em todas as outras abas, UMA linha fina no topo: a data, o próximo jogo e o botão Pular. Você mexe no elenco e vê os dias passando.', A2, true)}
${ph('B', 'Outras abas: só um selo', 'Nas outras abas, nada em cima. A data vai pro cabeçalho preto e a barra de baixo mostra "QUA 18" em cima de Jogos. Mais limpo, mas sem botão de pular ali.', B2, false)}
${ph('C', 'Cabeçalho vira calendário', 'O cabeçalho preto, que já existe em todas as abas, ganha a semana em bolinhas e o ⏩. Não cria faixa nova, mas fica apertado no celular.', C2, false)}
</div></body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await (await b.newContext({ viewport: { width: 1520, height: 900 }, deviceScaleFactor: 2 })).newPage()
await p.setContent(html, { waitUntil: 'networkidle' }).catch(() => {})
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: 'scripts/mockups/calendario-abas.png', fullPage: true })
await b.close(); console.log('ok')
