// ─── 🛒 MOCKUP: aba MERCADO na carreira Brasil Oficial (Diego 18/11) ─────────
// Pedido: *"gostaria também que no oficial clubes modo carreira tivesse uma aba sobre mercado ou transferências… mas mantendo nosso
// padrão de sondar jogadores e técnicos"*. As REGRAS do sondar não mudam (1 técnico + 1 jogador por janela, só quem fica sem contrato,
// olheiro pela categoria, carta virada). O que muda: durante a temporada dá pra ficar DE OLHO em quem tem contrato acabando; quando a
// janela abre, quem você marcou já chega como o seu sondado. ⚠️ SÓ DESENHO.  node scripts/mockups/mercado-oficial.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', BG = '#0E1210', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const carta = pos => `<span style="flex:none;width:34px;height:46px;border:2.5px solid ${INK};border-radius:7px;background:repeating-linear-gradient(45deg,${GOLD} 0 5px,#f2b400 5px 10px);display:flex;flex-direction:column;align-items:center;justify-content:center;${OSW};font-size:10px;line-height:1"><span style="font-size:15px">?</span>${pos}</span>`
const tec = `<span style="flex:none;width:34px;height:46px;border:2.5px solid ${INK};border-radius:7px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:20px">🧢</span>`
const btn = (t, on) => `<span style="flex:none;${OSW};font-size:11px;text-transform:uppercase;border:2.5px solid ${on ? GREEN : INK};background:${on ? GREEN : GOLD};color:${on ? '#fff' : INK};border-radius:10px;padding:5px 8px;box-shadow:2px 2px 0 #000;white-space:nowrap">${t}</span>`
const linha = (ic, nome, sub, b, on) => `<div style="display:flex;align-items:center;gap:9px;background:#fff;border:3px solid ${on ? GREEN : INK};border-radius:13px;padding:7px 9px;margin-bottom:7px;box-shadow:2px 2px 0 ${on ? GREEN : INK}">${ic}<div style="flex:1;min-width:0"><p style="margin:0;${OSW};font-size:15px;text-transform:uppercase;line-height:1.1">${nome}</p><p style="margin:2px 0 0;font:600 11px/1.3 system-ui;color:#5a5647">${sub}</p></div>${b}</div>`
const caixa = (titulo, sub, corpo) => `<div style="background:${CREME};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 #000;padding:12px 12px 8px;margin-bottom:14px">
<p style="margin:0;${OSW};font-size:19px;text-transform:uppercase">${titulo}</p><p style="margin:2px 0 10px;font:600 12px/1.4 system-ui;color:#4a4536">${sub}</p>${corpo}</div>`
const vaga = (ic, rot, txt, cheio) => `<div style="flex:1;border:3px ${cheio ? 'solid' : 'dashed'} ${cheio ? GREEN : INK};background:${cheio ? '#E6F3EA' : 'rgba(255,255,255,.6)'};border-radius:13px;padding:8px 9px"><p style="margin:0;${OSW};font-size:11px;letter-spacing:.06em;color:#5a5647">${ic} ${rot}</p><p style="margin:3px 0 0;${OSW};font-size:15px;text-transform:uppercase;line-height:1.1">${txt}</p></div>`

const topo = `<p style="margin:0;${OSW};font-size:12px;letter-spacing:.12em;color:#E8C66A">SANTA CRUZ · SÉRIE C · TEMPORADA 1</p>
<p style="margin:3px 0 4px;${OSW};font-size:30px;color:${CREME};text-transform:uppercase;line-height:1">🛒 Mercado</p>
<p style="margin:0 0 12px;font:600 12.5px/1.4 system-ui;color:#d9d0b8">A janela abre depois da última rodada · <b style="color:${GOLD}">faltam 14 jogos</b> · <span style="${OSW};font-size:11px;border:2px solid #d9d0b8;border-radius:999px;padding:1px 8px">🕵️ Olheiro básico</span></p>`

const ESC = n => `data:image/webp;base64,${readFileSync(`public/escudos-clubes/${n}.webp`).toString('base64')}`
const pil = (t, on) => `<span style="${OSW};font-size:11.5px;background:${on ? INK : '#fff'};color:${on ? '#fff' : INK};border:2px solid ${INK};border-radius:999px;padding:2px 10px;white-space:nowrap">${t}</span>`
const jog = (pos, nome, contrato, livre, b) => `<div style="display:flex;align-items:center;gap:8px;background:${livre ? '#fff' : '#efe9d8'};border:2.5px solid ${INK};border-radius:11px;padding:5px 8px;margin:0 0 6px;opacity:${livre ? 1 : .7}">${carta(pos)}<div style="flex:1;min-width:0"><p style="margin:0;${OSW};font-size:14.5px;text-transform:uppercase;line-height:1.1">${nome}</p><p style="margin:2px 0 0;font:700 11px system-ui;color:${livre ? RED : '#6b6553'}">${contrato}</p></div>${b}</div>`
const tecL = (nome, contrato, livre, b, on) => `<div style="display:flex;align-items:center;gap:8px;background:${on ? '#E6F3EA' : livre ? '#fff' : '#efe9d8'};border:2.5px solid ${on ? GREEN : INK};border-radius:11px;padding:5px 8px;margin:0 0 6px;opacity:${livre || on ? 1 : .7}">${tec}<div style="flex:1;min-width:0"><p style="margin:0;${OSW};font-size:14.5px;text-transform:uppercase;line-height:1.1">${nome}</p><p style="margin:2px 0 0;font:700 11px system-ui;color:${livre ? RED : '#6b6553'}">${contrato}</p></div>${b}</div>`
const cad = t => `<span style="flex:none;${OSW};font-size:10.5px;color:#6b6553;white-space:nowrap">🔒 ${t}</span>`
const clube = (esc, nome, pos, livres, aberto, corpo, rival) => `<div style="border:3px solid ${INK};border-radius:14px;background:#fff;margin-bottom:8px;box-shadow:2px 2px 0 #000;overflow:hidden">
  <div style="display:flex;align-items:center;gap:9px;padding:7px 10px;background:${aberto ? '#FFF6D6' : '#fff'};border-bottom:${aberto ? '2px solid ' + INK : 'none'}">
   <span style="${OSW};font-size:12px;color:#6b6553;width:22px">${pos}º</span><img src="${ESC(esc)}" style="width:28px;height:28px;object-fit:contain">
   <div style="flex:1;min-width:0"><p style="margin:0;${OSW};font-size:15px;text-transform:uppercase;line-height:1.1">${nome}${rival ? ` <span style="font-size:10px;background:${RED};color:#fff;border-radius:6px;padding:0 5px;vertical-align:2px">RIVAL</span>` : ''}</p>
   <p style="margin:1px 0 0;font:700 11px system-ui;color:#5a5647">${livres}</p></div><span style="${OSW};font-size:16px">${aberto ? '▲' : '▼'}</span></div>
  ${aberto ? `<div style="padding:8px 8px 2px">${corpo}</div>` : ''}</div>`
const sondar = caixa('🕵️ Sondar · 1 técnico + 1 jogador',
  'Fica <b>de olho</b> durante a temporada em quem tem contrato acabando. Na janela, ele vira o seu <b>sondado</b> e vai pro pregão, igual sempre.',
  `<div style="display:flex;gap:8px;margin-bottom:12px">${vaga('🧢', 'TÉCNICO', '✔ Rúben Amorim', true)}${vaga('⚽', 'JOGADOR', 'escolha 1 abaixo', false)}</div>
  <div style="display:flex;align-items:center;gap:7px;background:#fff;border:2.5px solid ${INK};border-radius:11px;padding:6px 10px;margin-bottom:8px;font:600 13px system-ui;color:#8a846f">🔎 Buscar jogador ou técnico…</div>
  <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">${pil('TODOS', true)}${pil('GOL')}${pil('LAT')}${pil('ZAG')}${pil('MEI')}${pil('ATA')}${pil('🧢 TÉC')}</div>
  <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:11px">${pil('⏳ SÓ QUEM FICA LIVRE', true)}${pil('TODOS OS CONTRATOS')}</div>
  <p style="margin:0 0 7px;${OSW};font-size:11.5px;letter-spacing:.08em;color:#5a5647">SÉRIE C · 19 CLUBES · NA ORDEM DA TABELA</p>
  ${clube('paysandu', 'Paysandu', 1, '2 jogadores ficam livres · técnico com contrato até a T2', true,
    jog('GOL', 'Gabriel Mesquita', '⏳ fica livre no fim da T1', true, btn('👀 De olho')) +
    jog('MEI', 'Rogerinho Gameleira', '⏳ fica livre no fim da T1', true, btn('👀 De olho')) +
    jog('LAT', 'Edílson', 'contrato até a T3', false, cad('T3')) +
    tecL('Mauricio Pochettino', 'contrato até a T2', false, cad('T2')))}
  ${clube('ypiranga', 'Ypiranga', 2, '1 jogador fica livre · <b style="color:' + GREEN + '">técnico fica livre</b>', false, '')}
  ${clube('maringa', 'Maringá', 3, '3 jogadores ficam livres', false, '', true)}
  ${clube('volta-redonda', 'Volta Redonda', 4, 'ninguém fica livre nesta temporada', false, '')}
  <p style="margin:2px 0 8px;font:700 11.5px system-ui;color:#5a5647;text-align:center">… mais 15 clubes</p>
  <div style="border:3px dashed ${INK};border-radius:14px;padding:8px 10px;margin-bottom:8px;background:rgba(255,255,255,.6)"><p style="margin:0 0 6px;${OSW};font-size:14px;text-transform:uppercase">🆓 Técnicos sem clube · 4</p>
   ${tecL('Rúben Amorim', '🇵🇹 sem clube · livre já', true, btn('✔ De olho', true), true)}
   ${tecL('Roberto De Zerbi', '🇮🇹 sem clube · livre já', true, btn('👀 De olho'))}</div>
  <p style="margin:6px 0 4px;font:700 11.5px/1.4 system-ui;color:#5a5647">🔒 Mais 2 jogadores estão acima do seu olheiro. <u>⭐ Olheiro Craque</u> acha craques; <u>👑 Olheiro Lenda</u> acha lendas.</p>
  <p style="margin:0 0 4px;font:600 11px/1.4 system-ui;color:#6b6553">Categoria, nível e cor da carta só aparecem quando ela for sua (regra de sempre). Gols e jogos de jogador de outro time o jogo não guarda — por isso não aparecem.</p>`)

const transf = caixa('📰 Transferências', 'Quem foi pra onde nos leilões da sua série. (Hoje mora na Central, no cartão 💸 Mercado — passa a morar aqui.)',
  `<div style="display:flex;gap:5px;margin-bottom:9px">${pil('TODAS', true)}${pil('⚽ JOGADORES')}${pil('🧢 TÉCNICOS')}</div>` + linha('<span style="font-size:22px">🔨</span>', 'Marcelo Rangel', 'Remo → Botafogo-PB · 18 🪙 · janela da T1', '') +
  linha('<span style="font-size:22px">🔨</span>', 'Douglas Borges', 'Portuguesa-RJ → <b>Santa Cruz (você)</b> · 12 🪙', '', true) +
  linha('<span style="font-size:22px">🧢</span>', 'Gian Piero Gasperini', 'sem clube → Ypiranga · técnico', ''))

const meus = caixa('📋 Seus contratos acabando', 'Quem do SEU elenco fica livre no fim da temporada. Renovar ou deixar ir continua na janela, como sempre.',
  linha(carta('ZAG').replace(/repeating[^;]+;/, 'background:#fff;').replace('?', '⚽'), 'Danny Morais', 'ZAG · acaba na T1 · renovar na janela', '<span style="' + OSW + ';font-size:11px;color:' + RED + '">⏳ T1</span>'))

const barra = `<div style="display:flex;justify-content:space-around;background:#0b0b0b;border-top:2px solid #2a2a2a;padding:8px 2px 10px;margin:14px -16px -18px;border-radius:0 0 20px 20px">${['📺 CENTRAL', '📅 JOGOS', '🛡️ ELENCO', '🛒 MERCADO', '🏆 RANK', '🏠 CLUBE'].map(t => `<span style="${OSW};font-size:10px;color:${t.includes('MERCADO') ? INK : '#ddd'};background:${t.includes('MERCADO') ? GOLD : 'none'};border-radius:8px;padding:5px 4px;text-align:center;white-space:pre-line">${t.replace(' ', '\n')}</span>`).join('')}</div>`

const FONE = `<div style="width:390px;flex:none"><p style="margin:0 0 8px;${OSW};font-size:17px;text-transform:uppercase">📱 Celular</p>
<div style="background:${BG};border:3px solid ${INK};border-radius:22px;padding:18px 16px;box-shadow:5px 5px 0 #000">${topo}${sondar}${transf}${meus}${barra}</div></div>`
const abasDesk = `<div style="display:flex;gap:8px;margin-bottom:16px">${['📺 Central', '📅 Jogos + Tabela', '🛡️ Elenco', '🛒 Mercado', '🏆 Rank', '🏠 Clube'].map(t => `<span style="${OSW};font-size:14px;text-transform:uppercase;border:2px solid ${t.includes('Mercado') ? GOLD : '#555'};background:${t.includes('Mercado') ? GOLD : 'none'};color:${t.includes('Mercado') ? INK : '#eee'};border-radius:10px;padding:6px 12px">${t}</span>`).join('')}</div>`
const DESK = `<div style="flex:1"><p style="margin:0 0 8px;${OSW};font-size:17px;text-transform:uppercase">🖥️ Computador</p>
<div style="background:${BG};border:3px solid ${INK};border-radius:22px;padding:22px;box-shadow:5px 5px 0 #000">${abasDesk}${topo}
<div style="display:grid;grid-template-columns:1.15fr 1fr;gap:16px;align-items:start"><div>${sondar}</div><div>${transf}${meus}</div></div></div></div>`
const NOTA = `<div style="background:${CREME};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 #000;padding:14px 18px;margin-bottom:18px">
<p style="margin:0;${OSW};font-size:24px;text-transform:uppercase">🛒 Aba Mercado · carreira Brasil Oficial</p>
<p style="margin:6px 0 0;font:600 14px/1.5 system-ui">As regras do sondar <b>não mudam</b>: 1 técnico + 1 jogador por janela, só quem fica <b>sem contrato</b>, o olheiro decide quem você enxerga e a carta continua <b>virada</b> (só a posição). A novidade é poder ficar <b>de olho durante a temporada</b>: quem você marcar chega na janela como o seu sondado. Agora <b>organizado por clube</b> (na ordem da tabela da sua série, toca pra abrir), com <b>busca</b>, filtro de <b>posição</b> e de <b>contrato</b>, e até quando vai o contrato de cada um. A aba junta as <b>transferências</b> (que saem do cartão 💸 da Central) e os <b>seus contratos acabando</b>.</p></div>`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}body{margin:0;background:#E9DFC4;padding:22px;font-family:system-ui;width:1400px}</style></head><body>
${NOTA}<div style="display:flex;gap:26px;align-items:flex-start">${FONE}${DESK}</div></body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await b.newPage({ viewport: { width: 1444, height: 900 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: 'scripts/mockups/mercado-oficial.png', fullPage: true })
await b.close()
console.log('ok scripts/mockups/mercado-oficial.png')
