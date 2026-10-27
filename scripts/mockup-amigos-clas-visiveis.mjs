// 👥⚔️ MOCKUP · AMIGOS E CLÃS À VISTA (27/10, Diego: "precisamos melhorar a forma de aparecer convites de amigos, add amigos, aceitar…
// e tb dos clãs… só tem 3 clãs feitos… tô achando q visualmente o pessoal N percebeu mt coisa… no chat tb de add").
// Medido no banco (27/10): 159 pedidos de amizade sem resposta (137 há mais de 2 dias) · 4 clãs · 34 pedidos pra entrar em clã sem resposta.
// O pedido mora num 🔔 de 40px e o aviso que pula NÃO aparece no jogo/leilão (onde o pessoal passa o tempo) — então ninguém vê.
// uso: node scripts/mockup-amigos-clas-visiveis.mjs → scripts/mockups/amigos-clas-visiveis.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')

const rosto = (cor, ini) => `<span class="ro" style="background:${cor}">${ini}</span>`
const pedido = (cor, ini, nome, txt, bt = 'ACEITAR') => `<div class="ln">${rosto(cor, ini)}<div><b>${nome}</b><small>${txt}</small></div><span class="ok">${bt}</span><span class="no">✕</span></div>`

const home = `<div class="cel"><div class="top">🔨 LEILÃO LEGENDS <span class="sino">🔔<i>5</i></span></div><div class="pad">
 <div class="card amg"><div class="ch">🤝 3 PESSOAS QUEREM SER SEU AMIGO</div>
  ${pedido('#1B7A3D', 'F', 'Futpoint FC', 'jogou com você ontem na Saideira')}
  ${pedido('#C2452F', 'N', 'Neymarzetti', 'jogou com você hoje')}
  ${pedido('#7C3AED', 'J', 'Januzaj FC', 'do clã Lado A-DPA')}
 </div>
 <div class="card cla"><div class="ch">⚔️ 2 QUEREM ENTRAR NO SEU CLÃ</div>
  ${pedido('#0E3E86', 'G', 'Gui', 'pediu pra entrar no Pontuadores')}
  ${pedido('#B8860B', 'R', 'Real Pirituba', 'pediu pra entrar no Pontuadores')}
 </div>
 <div class="bloco">⚡ PARTIDA RÁPIDA</div><div class="bloco">◎ JOGAR ONLINE</div><div class="bloco">★ MODO CARREIRA</div>
 <p class="nota">Some sozinho quando não tem pedido. Aceitar é ali mesmo, sem abrir nada.</p>
</div></div>`

const jogo = `<div class="cel"><div class="top">✉️ ENVELOPE · MEIAS <span class="pilula">🤝 2</span></div><div class="pad fundo">
 <div class="carta">Zico<br><small>Flamengo · 1981</small></div>
 <div class="lance">− &nbsp; 12 &nbsp; +</div>
 <div class="bt verde">SELAR 🔒</div>
 <p class="nota">No meio do jogo NADA pula na tela (regra de ouro do ritmo). Só a pilulinha 🤝 2 no canto, que guarda pra depois.</p>
</div></div>`

const chat = `<div class="cel"><div class="top">💬 CHAT DA SALA</div><div class="pad">
 <div class="msg"><b>Futpoint FC</b> pagou 40 no Romário kkkk</div>
 <div class="msg"><b class="toc">Neymarzetti</b> vai perder tudo 😂</div>
 <div class="menu">${rosto('#C2452F', 'N')}<div><b>Neymarzetti</b><small>👑 Lenda · clã Futpoint</small></div></div>
 <div class="mb"><span class="bt verde">➕ ADICIONAR AMIGO</span><span class="bt branco">👤 VER PERFIL</span></div>
 <p class="nota">Tocou no nome de alguém no chat → adiciona dali mesmo.</p>
 <div class="fim"><b>🏆 FIM DE JOGO</b><span class="bt roxo">🤝 ADICIONAR TODO MUNDO DA SALA (6)</span><small>só manda pra quem ainda não é seu amigo</small></div>
</div></div>`

const clas = `<div class="cel"><div class="top">⚔️ CLÃS DA SEMANA</div><div class="pad">
 <p class="sub2">Todo título nas salas soma pro clã. O campeão leva 🏆 no selo e 30 🪙 pra cada membro.</p>
 <div class="clan"><span class="pos">🥇</span><div><b>Lado A-DPA</b><small>22 membros · 41 títulos</small></div><span class="tag2">🔒 pede</span></div>
 <div class="clan"><span class="pos">🥈</span><div><b>Futpoint</b><small>21 membros · 33 títulos</small></div><span class="ok">ENTRAR</span></div>
 <div class="clan"><span class="pos">🥉</span><div><b>Oliver Clã</b><small>4 membros · 12 títulos</small></div><span class="tag2">🔒 pede</span></div>
 <div class="clan"><span class="pos">4º</span><div><b>Pontuadores</b><small>10 membros · 6 títulos</small></div><span class="ok">ENTRAR</span></div>
 <div class="bt ouro">⚔️ CRIAR MEU CLÃ</div>
 <p class="nota">Vira um bloco na home, embaixo dos modos (hoje mora em 👥 Amigos → ⚔️ Clã, 2 toques escondido). Quem já tem clã vê o SEU clã e a posição dele.</p>
</div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:#0C0C0C;padding:22px;width:1960px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 16px;font-weight:700;opacity:.75;font-size:15px;max-width:1880px}
.cols{display:flex;gap:22px;align-items:flex-start}.c{width:460px}.tag{display:inline-block;font:700 13px Oswald;letter-spacing:1px;border:3px solid #0C0C0C;border-radius:999px;padding:3px 12px;margin-bottom:10px;box-shadow:3px 3px 0 #000;background:#7C3AED;color:#fff}
.cel{width:460px;border:4px solid #0C0C0C;border-radius:26px;overflow:hidden;background:#F4ECD6;box-shadow:5px 5px 0 #000}
.top{background:#0C0C0C;color:#FFC400;font:700 18px Oswald;padding:12px 16px;position:relative}
.sino{position:absolute;right:12px;top:6px;background:#fff;border:3px solid #FFC400;border-radius:10px;padding:2px 7px;font-size:17px}.sino i{position:absolute;top:-8px;right:-8px;background:#C2452F;color:#fff;font:700 11px Oswald;border:2px solid #0C0C0C;border-radius:10px;padding:0 5px;font-style:normal}
.pilula{position:absolute;right:12px;top:8px;background:#7C3AED;color:#fff;border:2px solid #fff;border-radius:999px;padding:1px 10px;font-size:14px}
.pad{padding:14px}.fundo{background:#2a1d14;color:#F4ECD6;min-height:330px}
.card{border:3px solid #0C0C0C;border-radius:16px;box-shadow:4px 4px 0 #000;padding:10px 12px;margin-bottom:14px}.amg{background:#fff}.cla{background:#FFF3C4}
.ch{font:700 16px Oswald;letter-spacing:.3px;margin-bottom:4px}
.ln{display:flex;align-items:center;gap:9px;padding:7px 0;border-top:1px dashed #cbbd96}.ln div{flex:1;min-width:0}.ln b{font:700 15px Oswald}.ln small{display:block;font-size:11.5px;font-weight:600;opacity:.65}
.ro{width:36px;height:36px;border-radius:50%;border:2px solid #0C0C0C;display:inline-flex;align-items:center;justify-content:center;color:#fff;font:700 16px Oswald;flex:none}
.ok{font:700 13px Oswald;background:#1B7A3D;color:#fff;border:2px solid #0C0C0C;border-radius:9px;padding:5px 10px;box-shadow:2px 2px 0 #000;white-space:nowrap}.no{font:700 13px Oswald;background:#fff;border:2px solid #0C0C0C;border-radius:9px;padding:5px 8px}
.bloco{background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #000;padding:12px;font:700 17px Oswald;margin-bottom:10px}
.nota{font-weight:700;font-size:13px;margin:10px 2px 0;line-height:1.4}.fundo .nota{color:#FFE79A}
.carta{margin:20px auto 14px;width:160px;height:120px;border:4px solid #FFC400;border-radius:14px;background:#14251a;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 24px Oswald}.carta small{font:600 12px system-ui;opacity:.7}
.lance{text-align:center;font:700 24px Oswald;background:#F4ECD6;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:12px;padding:6px;width:200px;margin:0 auto 12px}
.bt{display:block;text-align:center;font:700 15px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:11px;padding:9px;box-shadow:3px 3px 0 #000;margin-top:8px}
.bt.verde{background:#1B7A3D;color:#fff}.bt.ouro{background:#0C0C0C;color:#FFC400}.bt.branco{background:#fff;color:#0C0C0C}.bt.roxo{background:#7C3AED;color:#fff}
.msg{background:#fff;border:2px solid #0C0C0C;border-radius:12px;padding:7px 10px;margin-bottom:7px;font-size:13.5px;font-weight:600}.msg b{font-family:Oswald}.toc{background:#FFE79A;outline:3px solid #7C3AED;border-radius:4px;padding:0 3px}
.menu{display:flex;align-items:center;gap:10px;background:#FFF8E6;border:3px solid #7C3AED;border-radius:14px 14px 0 0;padding:9px 11px;margin-top:6px}.menu b{font:700 16px Oswald}.menu small{display:block;font-size:11.5px;font-weight:600;opacity:.7}
.mb{display:flex;gap:8px;background:#FFF8E6;border:3px solid #7C3AED;border-top:none;border-radius:0 0 14px 14px;padding:0 11px 11px}.mb .bt{flex:1;font-size:13px;padding:7px}
.fim{margin-top:16px;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px;text-align:center}.fim b{font:700 17px Oswald}.fim small{display:block;font-size:11.5px;font-weight:600;opacity:.65;margin-top:6px}
.sub2{font-size:13px;font-weight:700;margin:0 0 10px;line-height:1.4}
.clan{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #0C0C0C;border-radius:12px;padding:8px 10px;margin-bottom:7px}.clan div{flex:1}.clan b{font:700 15px Oswald}.clan small{display:block;font-size:11.5px;font-weight:600;opacity:.7}.pos{font:700 20px Oswald;width:30px;text-align:center}
.tag2{font:700 12px Oswald;border:2px dashed #0C0C0C;border-radius:9px;padding:4px 8px;white-space:nowrap}
</style></head><body>
<h1>👥⚔️ Amigos e clãs à vista</h1>
<p class="sub">Hoje: 159 pedidos de amizade sem resposta (137 há mais de 2 dias), 34 pedidos pra entrar em clã esperando o dono, e no chat não dá pra adicionar ninguém. O pedido mora num 🔔 pequeno e o aviso não aparece durante o jogo — ninguém vê. Proposta: o pedido vem pra home, onde dá pra aceitar na hora; no jogo, só uma pilulinha; no chat e no fim de jogo, adicionar com um toque; e os clãs viram um bloco na home.</p>
<div class="cols">
 <div class="c"><span class="tag">1 · HOME: PEDIDOS EM CIMA</span>${home}</div>
 <div class="c"><span class="tag">2 · NO JOGO: SÓ A PILULINHA</span>${jogo}</div>
 <div class="c"><span class="tag">3 · CHAT E FIM DE JOGO</span>${chat}</div>
 <div class="c"><span class="tag">4 · CLÃS NA HOME</span>${clas}</div>
</div></body></html>`

mkdirSync('scripts/mockups', { recursive: true })
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: 1960, height: 1000 }, deviceScaleFactor: 1.2 })
await page.setContent(html)
await page.waitForTimeout(300)
await page.screenshot({ path: 'scripts/mockups/amigos-clas-visiveis.png', fullPage: true })
await browser.close()
console.log('scripts/mockups/amigos-clas-visiveis.png')
