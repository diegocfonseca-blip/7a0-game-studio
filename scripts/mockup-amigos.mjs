#!/usr/bin/env node
// 🎨 MOCKUP — AMIGOS + PERFIL COM CONQUISTAS (14/10)
// Diego: *"dentro da minha conta… uma área de amigos… quando o amigo entra online aparece o bonequinho… apertando no
// usuário você vê tudo que ele já conquistou, carreira e online… e o próprio usuário vê os mesmos dados dele"*.
// 4 telas: Minha conta (meu mural) · Amigos · Perfil do amigo · Convite chegando. Números e nomes são de EXEMPLO.
// uso: node scripts/mockup-amigos.mjs → scripts/mockups/amigos.png
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(`src/escalacao/img/${f}`).toString('base64')}`
const PRES = { polo: img('career-president-polo.webp'), terno: img('career-president-terno.webp'), casual: img('career-president-casual.webp'), social: img('career-president-social.webp') }
const ESC = { ney: img('neymarzetti-escudo.webp'), fut: img('futpoint-escudo.webp'), gui: img('guimaraes-escudo.webp'), lab: img('labubu-escudo.webp'), arr: img('arruda-escudo.webp') }
const OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'
const BEGE = 'linear-gradient(160deg,#FBF4E2,#E9DCB8)'
const boneco = (p, fundo, on = null) => `<div class="bon" style="background:${fundo}"><img src="${PRES[p]}">${on === true ? '<i class="on"></i>' : on === false ? '<i class="off"></i>' : ''}</div>`
const st = (n, t, ic = '') => `<div class="st"><b>${ic}${n}</b><small>${t}</small></div>`

// o mural é o MESMO pra mim e pro amigo (um componente só)
const mural = (o, c) => `
<div class="mur">
  <div class="mh on">🌐 ONLINE <small>salas e Minhas Ligas</small></div>
  <div class="sg">${st(o.t, 'títulos', '🏆')}${st(o.l, 'ligas')}${st(o.c, 'copas')}${st(o.m, 'Copa do Mundo', '🌍')}${st(o.a, 'artilharias', '⚽')}${st(o.s, 'salas jogadas')}</div>
  <div class="semana">📊 Ranking da semana: <b>${o.rk}</b></div>
  <div class="mh car">🏟️ CARREIRA <small>${c.clube} · ${c.temp} temporadas</small></div>
  <div class="tacas">${c.tacas.map(([ic, n, t]) => `<div class="tc"><span>${ic}</span><b>${n}×</b><small>${t}</small></div>`).join('')}</div>
  <div class="sg">${st(c.div, 'melhor divisão')}${st(c.bo, 'Bola de Ouro', '🥇')}${st(c.cart, 'cartinhas', '🃏')}</div>
</div>`

const tela1 = `<div class="tela">
<div class="th"><h1>👤 Minha conta</h1></div>
<div class="perfil" style="background:${OURO}">${boneco('terno', 'rgba(255,255,255,.55)')}<div class="pi"><b>Neymarzetti</b><small>🖋 FUNDADOR nº 1 · desde 08/2026</small><div class="esc"><img src="${ESC.ney}">clube principal</div></div></div>
<div class="tit">🏆 MEU MURAL <small>é isto que seus amigos veem</small></div>
${mural({ t: 41, l: 18, c: 19, m: 4, a: 9, s: 96, rk: '7º · 6 títulos' }, { clube: 'Neymarzetti', temp: 38, div: 'Série A', bo: 3, cart: 112, tacas: [['🏆', 5, 'Série A'], ['🇧🇷', 3, 'Copa do Brasil'], ['🌎', 2, 'Libertadores'], ['⭐', 1, 'Champions'], ['🌐', 1, 'Mundial']] })}
<div class="amg">👥 AMIGOS <em>2 online</em><span>›</span></div>
<p class="obs">👆 O mural é <b>o mesmo</b> pra você e pros amigos — você vê exatamente o que eles veem. E-mail nunca aparece.</p>
</div>`

const amigo = (p, fundo, esc, nome, tier, on, onde, bt, btc = '') => `<div class="am">
${boneco(p, fundo, on)}<div class="ai"><b>${nome}</b><small>${tier}</small><span class="${on ? 'v' : 'c'}">${onde}</span></div>
${bt ? `<button class="${btc}">${bt}</button>` : ''}</div>`

const tela2 = `<div class="tela">
<div class="th"><h1>👥 Amigos</h1><span class="cnt">5</span></div>
<div class="add"><span>🔎 apelido do amigo…</span><button>+ ADICIONAR</button></div>
<div class="ped"><b>📩 1 pedido de amizade</b><div class="am mini">${boneco('casual', OURO)}<div class="ai"><b>Leão da Estradinha</b><small>quer ser seu amigo</small></div><button class="ok">✓</button><button class="no">✕</button></div></div>
<div class="tit sm">🟢 JOGANDO AGORA</div>
${amigo('polo', OURO, ESC.fut, 'Futpoint FC', '👑 LENDA', true, '🌐 na Sala do Futpoint · leilão', 'ENTRAR NA SALA', 'g')}
${amigo('social', OURO, ESC.lab, 'LABUBU F.C', '🖋 BATISMO', true, '🏟️ na carreira · Série A', '📣 CHAMAR', 'y')}
<div class="tit sm">⚪ FORA DO JOGO</div>
${amigo('terno', OURO, ESC.gui, 'Guimarães SCI', '🖋 BATISMO', false, 'visto há 2 h', '')}
${amigo('casual', OURO, ESC.arr, 'Tricolor do Arruda', '🖋 FUNDADOR', false, 'visto ontem', '')}
<p class="obs">Toque no amigo pra ver o mural dele. 🟢 = está numa sala ou na carreira <b>agora</b>. O botão muda sozinho: <b>ENTRAR</b> se ele está numa sala aberta, <b>CHAMAR</b> se está fora de sala.</p>
</div>`

const tela3 = `<div class="tela">
<div class="th"><span class="volta">‹ Amigos</span></div>
<div class="perfil" style="background:${OURO}">${boneco('social', 'rgba(255,255,255,.55)', true)}<div class="pi"><b>LABUBU F.C</b><small>🖋 BATISMO · amigo desde 14/10</small><div class="esc"><img src="${ESC.lab}">clube principal</div></div></div>
<div class="agora">🟢 Na carreira agora · Série A, temporada 4</div>
${mural({ t: 27, l: 16, c: 10, m: 1, a: 5, s: 61, rk: '🥇 1º · 24 títulos' }, { clube: 'Labubu FC', temp: 4, div: 'Série A', bo: 0, cart: 9, tacas: [['🏆', 1, 'Série A'], ['🇧🇷', 1, 'Copa do Brasil']] })}
<div class="x1"><div class="xh">⚔️ VOCÊS DOIS</div><div class="xr"><div><b>12</b><small>salas juntos</small></div><div><b class="vd">5</b><small>você levou a taça</small></div><div><b class="vm">7</b><small>ele levou</small></div></div></div>
<button class="big g">📣 CHAMAR PRA MINHA SALA</button>
<p class="obs">⚔️ "Vocês dois" é ideia extra: quem ganhou mais nas salas em que os dois jogaram. Dá pra deixar de fora.</p>
</div>`

const tela4 = `<div class="tela dim">
<div class="fundo">
  <div class="bt">🏆 CARREIRA</div><div class="bt">⚡ PARTIDA RÁPIDA</div><div class="bt">🌐 SALAS ONLINE</div><div class="bt">📋 MINHAS LIGAS</div>
</div>
<div class="conv">
  <div class="cb">${boneco('polo', OURO, true)}</div>
  <small>🔔 CONVITE DE AMIGO</small>
  <b>Futpoint FC te chamou<br>pra sala dele!</b>
  <div class="sala"><img src="${ESC.fut}"><div><b>Sala do Futpoint</b><small>👥 6/20 · ✉️ às cegas · liga+copa · esperando</small></div></div>
  <button class="big g">⚡ ENTRAR AGORA</button>
  <button class="big w">Agora não</button>
</div>
<p class="obs cv">O convite aparece por cima de qualquer tela, só quando o jogo está aberto. Sumiu em 2 min sem resposta = some sozinho.</p>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#e9dfc4;font-family:Inter,Arial,sans-serif;color:#0C0C0C;display:flex;gap:18px;padding:18px;width:1800px;align-items:flex-start}
.tela{width:420px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:22px;box-shadow:4px 4px 0 #0C0C0C;padding:16px;position:relative;overflow:hidden}
h1{font:700 28px/1 Oswald;text-transform:uppercase;margin:0}
.th{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}.cnt{font:700 14px Oswald;background:#0C0C0C;color:#FFC400;border-radius:8px;padding:2px 8px}
.volta{font:700 16px Oswald;text-transform:uppercase;background:#fff;border:3px solid #0C0C0C;border-radius:10px;box-shadow:2px 2px 0 #0C0C0C;padding:3px 10px}
.perfil{display:flex;gap:12px;align-items:center;border:4px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #0C0C0C;padding:10px 12px}
.pi b{font:700 26px/1 Oswald;text-transform:uppercase;display:block}.pi small{font:700 12px Oswald;letter-spacing:.04em;display:block;margin-top:4px}
.esc{display:inline-flex;align-items:center;gap:6px;margin-top:6px;font:700 11px Oswald;text-transform:uppercase;background:#fff;border:2px solid #0C0C0C;border-radius:8px;padding:2px 8px 2px 3px}.esc img{height:26px}
.bon{position:relative;width:64px;height:64px;border:3px solid #0C0C0C;border-radius:16px;overflow:hidden;flex:none}.bon img{position:absolute;left:50%;top:-2px;width:88px;transform:translateX(-50%)}
.perfil .bon{width:86px;height:86px}.perfil .bon img{width:118px}
.bon .on,.bon .off{position:absolute;right:3px;bottom:3px;width:15px;height:15px;border-radius:50%;border:2.5px solid #0C0C0C}.bon .on{background:#2BD45A;box-shadow:0 0 8px #2BD45A}.bon .off{background:#bdb6a4}
.tit{font:700 18px Oswald;text-transform:uppercase;margin:14px 2px 8px;display:flex;justify-content:space-between;align-items:baseline}.tit small{font:600 11px Arial;text-transform:none;color:#53534b}.tit.sm{font-size:14px;margin:12px 2px 6px;color:#53534b}
.mur{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:10px}
.mh{font:700 15px Oswald;text-transform:uppercase;border:2px solid #0C0C0C;border-radius:9px;padding:4px 9px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:baseline}.mh small{font:600 10.5px Arial;text-transform:none;opacity:.85}
.mh.on{background:#7C3AED;color:#fff}.mh.car{background:#1B7A3D;color:#fff;margin-top:12px}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.st{background:#F4ECD6;border:2px solid #0C0C0C;border-radius:10px;padding:5px 4px;text-align:center}.st b{font:700 20px/1.1 Oswald;display:block}.st small{font-size:10px;font-weight:700;color:#53534b}
.semana{margin-top:7px;font-size:12px;font-weight:700;background:#FFF3C4;border:2px dashed #E8A200;border-radius:9px;padding:5px 8px}
.tacas{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}.tc{flex:1 1 60px;background:${OURO};border:2px solid #0C0C0C;border-radius:10px;padding:4px;text-align:center}.tc span{font-size:20px;display:block}.tc b{font:700 16px Oswald}.tc small{display:block;font-size:9.5px;font-weight:700}
.amg{display:flex;align-items:center;gap:10px;font:700 20px Oswald;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:12px 14px;margin-top:12px}.amg em{font-style:normal;font:700 12px Oswald;background:#2BD45A;border:2px solid #0C0C0C;border-radius:8px;padding:1px 7px}.amg span{margin-left:auto;font-size:26px}
.obs{font-size:11.5px;color:#53534b;font-weight:600;margin:10px 2px 0;line-height:1.45}
.add{display:flex;gap:8px}.add span{flex:1;background:#fff;border:3px solid #0C0C0C;border-radius:12px;padding:9px 10px;font-size:13px;color:#8a8577;font-weight:600}.add button{font:700 14px Oswald;background:#1B7A3D;color:#fff;border:3px solid #0C0C0C;border-radius:12px;box-shadow:2px 2px 0 #0C0C0C;padding:0 10px}
.ped{margin-top:10px;background:#FFF3C4;border:3px solid #0C0C0C;border-radius:14px;padding:8px 10px}.ped>b{font:700 13px Oswald;text-transform:uppercase}
.am{display:flex;gap:10px;align-items:center;background:#fff;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #0C0C0C;padding:8px 10px;margin-bottom:8px}.am.mini{box-shadow:none;margin:6px 0 0;padding:6px 8px}.am.mini .bon{width:44px;height:44px}.am.mini .bon img{width:62px}
.ai{flex:1;min-width:0}.ai b{font:700 17px Oswald;text-transform:uppercase;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ai small{font:700 10.5px Oswald;color:#6b6656;display:block}.ai span{font-size:11.5px;font-weight:700}.ai .v{color:#1B7A3D}.ai .c{color:#8a8577}
.am button{font:700 12.5px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:10px;box-shadow:2px 2px 0 #0C0C0C;padding:7px 8px;white-space:nowrap}
button.g{background:#1B7A3D;color:#fff}button.y{background:#FFC400}button.ok{background:#1B7A3D;color:#fff;padding:5px 9px}button.no{background:#fff;padding:5px 9px}
.agora{margin:10px 0 0;font:700 13px Oswald;background:#e6f4ea;border:2px solid #0C0C0C;border-radius:10px;padding:5px 9px}
.x1{margin-top:10px;background:#0C0C0C;color:#F4ECD6;border:3px solid #0C0C0C;border-radius:14px;box-shadow:3px 3px 0 #C2452F;padding:8px 10px}.xh{font:700 14px Oswald;color:#FFC400;text-align:center}.xr{display:flex;justify-content:space-around;text-align:center;margin-top:4px}.xr b{font:700 26px Oswald;display:block}.xr small{font-size:10px;font-weight:700;opacity:.85}.vd{color:#2BD45A}.vm{color:#ff8a7a}
.big{display:block;width:100%;font:700 17px Oswald;text-transform:uppercase;border:3px solid #0C0C0C;border-radius:13px;box-shadow:3px 3px 0 #0C0C0C;padding:11px;margin-top:10px}.big.w{background:#fff}
.dim .fundo{filter:blur(1.5px) brightness(.55);padding-top:30px}.dim .bt{font:700 20px Oswald;text-align:center;background:#fff;border:3px solid #0C0C0C;border-radius:14px;padding:13px;margin-bottom:10px}
.conv{position:absolute;left:22px;right:22px;top:70px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:20px;box-shadow:5px 5px 0 #0C0C0C;padding:16px;text-align:center}
.cb{display:flex;justify-content:center;margin-top:-50px}.cb .bon{width:84px;height:84px;background:${OURO}}.cb .bon img{width:116px}
.conv>small{display:block;font:700 12px Oswald;letter-spacing:.18em;color:#7C3AED;margin-top:8px}.conv>b{display:block;font:700 23px/1.1 Oswald;text-transform:uppercase;margin-top:4px}
.sala{display:flex;gap:10px;align-items:center;text-align:left;background:#fff;border:3px solid #0C0C0C;border-radius:13px;padding:8px 10px;margin-top:12px}.sala img{height:42px}.sala b{font:700 16px Oswald;text-transform:uppercase;display:block}.sala small{font-size:11px;font-weight:600;color:#53534b}
.cv{position:absolute;left:16px;right:16px;bottom:16px;color:#F4ECD6}
.dim{min-height:640px;background:#3a3528}
</style></head><body>${tela1}${tela2}${tela3}${tela4}</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `amigos-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/amigos.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/amigos.png')
