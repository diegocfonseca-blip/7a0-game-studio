#!/usr/bin/env node
// ─── 🧩 MOCKUP: criar sala reorganizada (26/10) ─────────────────────────────
//
// Diego: *"preciso de uma reformulação de ideia do mockup pra criação de salas mais organizada!"*
// Nenhuma opção nova e nenhuma some: as MESMAS escolhas de hoje (lobby.tsx), agrupadas em 5 blocos com
// nome de gente — O JOGO · O LEILÃO · O TIME · O CAMPEONATO · A PARTIDA · A SALA — e o resumo "📋 Sua sala"
// grudado no pé, com o botão de criar. Celular (412 px), duas metades lado a lado.
//
// Rodar:  node scripts/mockup-criar-sala-organizada.mjs [saida.png]

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = process.argv[2] ?? `${ROOT}/scripts/mockups/criar-sala-organizada.png`
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTS = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

// chip: [texto, frase, faixa roxa (plano/meta), coroa]
const chips = (lista, marcado, { cols = 0 } = {}) => `<div class="chips${cols ? ` c${cols}` : ''}">${lista.map(([t, sub, faixa, coroa]) =>
  `<span class="chip${t === marcado ? ' on' : ''}${faixa ? ' fx' : ''}">${faixa ? `<em>${faixa}</em>` : ''}<b>${coroa ? '⭐ ' : ''}${t}</b>${sub ? `<small>${sub}</small>` : ''}</span>`).join('')}</div>`
const linha = (rot, corpo, dica = '') => `<div class="ln"><p class="rot">${rot}</p>${corpo}${dica}</div>`
const bloco = (n, ic, titulo, frase, corpo) => `<section class="bl"><header><span class="n">${n}</span><div><h3>${ic} ${titulo}</h3><p>${frase}</p></div></header>${corpo}</section>`
const IG = '@leilaolegendscom'
const PLANO = '', META = k => `LANÇA COM ${k}K 👥 NO INSTA`
const MODOS = [
  ['⚡ Rápido', 'Uma temporada. Começa agora.'],
  ['🏆 Minhas ligas', 'A sala da turma que não acaba.', PLANO, true],
  ['📋 Liga Draft', 'Todo mundo começa fraco.', META(5), true],
  ['🌐 Carreira', '4 divisões + Várzea.', META(7), true],
  ['🃏 Bafo', 'Valendo carta.', META(3)],
]
// o aviso que aparece NO LUGAR do resto quando a pessoa toca num modo travado
const aviso = (titulo, linhas) => `<div class="av"><p class="avt">${titulo}</p>${linhas.map(l => `<p>${l}</p>`).join('')}</div>`
const GRATIS = '✅ <b>Jogar é GRÁTIS pra todo mundo.</b> Se um amigo criar a sala e te passar o código, você entra e joga igual a todos.'

const tel1 = `
<div class="top"><span class="voltar">‹</span><h1>CRIAR SALA</h1><span class="lang">BR · EN</span></div>
${bloco(1, '🎮', 'O jogo', 'O que vocês vão jogar hoje', chips(MODOS, '⚡ Rápido', { cols: 2 }))}
${bloco(2, '🔨', 'O leilão', 'Como os jogadores vão ser comprados', `
  ${linha('Jeito do lance', chips([['✉️ Envelope'], ['🐊 Tocaia'], ['🔨 Pregão aberto']], '✉️ Envelope'), '<p class="dica">✉️ Lance secreto: ninguém vê o do outro até abrir.</p>')}
  ${linha('O que vai a leilão', chips([['🃏 Jogador'], ['🧱 Clubes']], '🃏 Jogador'))}`)}
${bloco(3, '🃏', 'O time', 'De onde vêm as cartas e como o time joga', `
  ${linha('Baralho', chips([['🇧🇷 Brasil'], ['🌍 Europa'], ['🌎 Mundo'], ['♾️ Todos']], '♾️ Todos', { cols: 2 }), '<p class="dica cinza">🧱 Leilão de Clubes e Liga Draft usam sempre o Todos.</p>')}
  ${linha('Formação (vale pra todos)', chips([['4-3-3'], ['4-4-2']], '4-3-3'))}
  ${linha('Quem comanda cada time', chips([['👤 Solo'], ['🤝 Duplas']], '👤 Solo'))}`)}`

const tel2 = `
${bloco(4, '🏆', 'O campeonato', 'O que vem depois das 38 rodadas', `
  ${linha('Depois da liga', chips([['📊 Só liga'], ['🏆 + Copa dos 8'], ['🌎 + Liberta'], ['⭐ Só Champions'], ['🌐 + Copa do Mundo'], ['🗺️ + Regional', 'Rio-SP · Sul-Minas · Nordeste']], '🏆 + Copa dos 8', { cols: 2 }))}`)}
${bloco(5, '📺', 'A partida', 'Como o jogo passa na tela', `
  ${linha('Ritmo', chips([['⚡ Auto'], ['🎮 Manual', '', PLANO, true]], '🎮 Manual'), `
    <p class="alerta">⚠️ <b>Só use com gente que você conhece.</b> No Manual, quem criou a sala decide quando cada rodada começa. Se ele sumir, a sala para. Com desconhecidos, prefira o Auto.</p>`)}
  ${linha('Jogo', chips([['📊 Placar padrão'], ['📺 Campo 2D', '', META(3), true]], '📊 Placar padrão'))}`)}
${bloco(6, '🚪', 'A sala', 'Quem entra e como fica', `
  ${linha('Nome', '<div class="inp">Sala do Diego</div>')}
  ${linha('Entrada', chips([['🔓 Aberta'], ['🔒 Com senha']], '🔓 Aberta'))}
  ${linha('Chat', chips([['💬 Chat ligado'], ['🔇 Sem chat']], '💬 Chat ligado'))}
  ${linha('Vai transmitir ao vivo?', chips([['Não'], ['🔴 Modo Stream']], '🔴 Modo Stream'), `
    <div class="sub2"><p class="rot">⏱️ Tempo de cada envelope <span class="pd">só no Modo Stream</span></p>
    ${chips([['Sem tempo', 'você avança'], ['20s'], ['30s'], ['45s', 'PADRÃO'], ['60s'], ['90s']], '45s', { cols: 3 })}
    <p class="dica cinza">Já vem nos <b>45s</b>, o tempo de sempre. No "Sem tempo", você fecha cada envelope no botão, na hora que quiser.</p></div>`)}`)}
<div class="pe">
  <p class="rot">📋 Sua sala</p>
  <div class="resumo"><span>⚡ Rápido</span><span>✉️ Envelope 45s</span><span>♾️ Todos</span><span>4-3-3</span><span>🏆 + Copa dos 8</span><span>🎮 Manual</span><span>🔴 Stream · 45s</span><span>🔓 Aberta</span></div>
  <button>🔨 CRIAR SALA</button>
</div>`

// 3º celular: o que aparece quando a pessoa toca num modo travado (nada abre embaixo)
const tel3 = `
<p class="leg">QUANDO TOCA NA CARREIRA</p>
${bloco(1, '🎮', 'O jogo', 'O que vocês vão jogar hoje', chips(MODOS, '🌐 Carreira', { cols: 2 }) + aviso('🌐 A Carreira online chega com 7 mil seguidores', [
  `Estamos juntando gente no Instagram <b>${IG}</b>. Quando a página bater <b>7 mil seguidores</b>, a Carreira online abre pra todo mundo.`,
  '<small>👉 Siga a página e chame os amigos: quanto antes bater a meta, antes abre.</small>',
  GRATIS, '⭐ <b>Pra CRIAR a sala</b>, só com plano.',
]))}
<p class="leg">QUANDO TOCA NO CAMPO 2D</p>
<section class="bl">${chips([['📊 Placar padrão'], ['📺 Campo 2D', '', META(3), true]], '📺 Campo 2D')}${aviso('📺 O Campo 2D chega com 3 mil seguidores', [
  `O jogo com o campinho e os bonecos correndo abre quando o <b>${IG}</b> bater <b>3 mil seguidores</b>.`,
  GRATIS, '⭐ <b>Pra CRIAR a sala com o 2D</b>, só com plano.',
])}</section>`

const CSS = `${FONTS}
*{box-sizing:border-box;margin:0}body{background:#F4ECD6;font-family:Inter,system-ui,sans-serif;color:#0C0C0C;padding:22px;width:1360px}
.cap{font:700 26px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{font-size:13.5px;font-weight:600;margin:0 0 16px;color:#3b3527}
.duo{display:flex;gap:22px;align-items:flex-start}.tel{width:412px;background:#F4ECD6;border:4px solid #0C0C0C;border-radius:28px;box-shadow:6px 6px 0 #0C0C0C;padding:14px 12px 16px;overflow:hidden}
.lado{flex:1;font-size:13px;font-weight:600;line-height:1.45}.lado h4{font:700 15px Oswald;text-transform:uppercase;margin:0 0 6px}.lado li{margin:0 0 6px 16px}
.top{display:flex;align-items:center;gap:10px;margin:0 0 10px}.top h1{font:700 26px Oswald;letter-spacing:.02em;flex:1}.voltar{font:700 26px Oswald}.lang{font:700 11px Oswald;border:2.5px solid #0C0C0C;border-radius:8px;padding:3px 7px;background:#fff}
.bl{background:#fff;border:3px solid #0C0C0C;border-radius:16px;box-shadow:3px 3px 0 #0C0C0C;padding:11px 11px 4px;margin:0 0 12px}
.bl header{display:flex;gap:9px;align-items:center;margin:0 0 8px}.n{flex:none;width:28px;height:28px;border-radius:50%;background:#0C0C0C;color:#FFC400;font:700 15px/28px Oswald;text-align:center}
.bl h3{font:700 17px Oswald;text-transform:uppercase;line-height:1}.bl header p{font-size:11.5px;font-weight:600;color:#6b6250;margin-top:2px}
.ln{border-top:2px dashed #e3d8bb;padding:8px 0}.ln:first-of-type{border-top:0;padding-top:0}
.rot{font:700 11px Oswald;letter-spacing:.08em;text-transform:uppercase;color:#6b6250;margin:0 0 5px}
.chips{display:flex;gap:6px;flex-wrap:wrap}.chips.c2{display:grid;grid-template-columns:1fr 1fr}.chips.c3{display:grid;grid-template-columns:1fr 1fr 1fr}
.chip{position:relative;flex:1;min-width:0;border:2.5px solid #0C0C0C;border-radius:10px;background:#F4ECD6;padding:7px 8px;text-align:center}
.chip b{display:block;font:700 13px Oswald;text-transform:uppercase;line-height:1.15}.chip small{display:block;font-size:10.5px;font-weight:600;color:#6b6250;margin-top:2px;line-height:1.2}
.chip.on{background:#FFC400;box-shadow:2px 2px 0 #0C0C0C}.chip.on small{color:#3b3000}
.chip i{position:absolute;top:-8px;right:6px;font:700 9px Oswald;font-style:normal;background:#7C3AED;color:#fff;border:2px solid #0C0C0C;border-radius:6px;padding:0 4px}
.dica{font-size:11px;font-weight:600;color:#1B7A3D;margin-top:5px}.dica.cinza{color:#6b6250}.chip.fx{padding-top:16px}.chip em{position:absolute;left:-2.5px;right:-2.5px;top:-2.5px;font:700 9px/1 Oswald;font-style:normal;letter-spacing:.06em;background:#7C3AED;color:#fff;border:2.5px solid #0C0C0C;border-radius:10px 10px 0 0;padding:3px 2px}.alerta{margin-top:7px;font-size:11.5px;font-weight:600;line-height:1.35;background:#FDE8E3;border:2.5px solid #C2452F;border-radius:10px;padding:7px 9px}.av{margin:10px 0 8px;background:#F3EDFF;border:3px solid #7C3AED;border-radius:12px;padding:10px;font-size:12px;font-weight:600;line-height:1.4}.av p{margin:0 0 6px}.avt{font:700 15px Oswald;text-transform:uppercase;color:#5B21B6}.barra{display:block;height:12px;border:2.5px solid #0C0C0C;border-radius:8px;background:#fff;overflow:hidden}.barra span{display:block;height:100%;background:#7C3AED}.av small{font-size:10.5px;color:#5B21B6;font-weight:700}.sub2{margin-top:8px;background:#EEF4FB;border:2.5px solid #2E6FB0;border-radius:10px;padding:8px}.pd{font:700 9px Oswald;background:#2E6FB0;color:#fff;border-radius:5px;padding:1px 5px;margin-left:4px}.leg{font:700 13px Oswald;letter-spacing:.06em;color:#7C3AED;margin:2px 0 6px}
.inp{border:2.5px solid #0C0C0C;border-radius:10px;background:#fff;padding:7px 10px;font:700 14px Oswald}
.pe{position:relative;background:#0C0C0C;border-radius:16px;padding:11px;margin-top:4px}.pe .rot{color:#FFC400}
.resumo{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 10px}.resumo span{font:700 11px Oswald;text-transform:uppercase;background:#2b241a;color:#F4ECD6;border-radius:7px;padding:3px 7px}
.pe button{width:100%;font:700 20px Oswald;background:#1B7A3D;color:#fff;border:3px solid #F4ECD6;border-radius:12px;padding:11px;box-shadow:3px 3px 0 #FFC400}
`
const html = `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
<p class="cap">🧩 Criar sala — proposta organizada (v3)</p>
<p class="sub">v3 · ⭐ = precisa de plano pra CRIAR (quem tem plano usa normal) · faixa roxa = ainda não lançado, abre com N mil seguidores no Instagram · jogar é sempre grátis. 3º celular: o que aparece quando toca num modo travado (nada abre embaixo).</p>
<div class="duo"><div class="tel">${tel1}</div><div class="tel">${tel2}</div><div class="tel">${tel3}</div></div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1360, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' }); await p.waitForTimeout(300)
await p.screenshot({ path: OUT, fullPage: true })
await b.close()
console.log('ok →', OUT)
