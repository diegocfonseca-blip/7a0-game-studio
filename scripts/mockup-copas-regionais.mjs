// ─── 🏟️ MOCKUP: COPAS REGIONAIS CONVOCADAS NAS SALAS ONLINE (Diego 10/10) ──────
// Pedido: liga + copa regional (Rio × SP · Sul × Minas-PR · Nordeste), 16 clubes em
// dois lados de 8 (cada um joga contra os 8 do OUTRO lado, formato real da Copa do
// Nordeste 2018-22), escolha do clube pela ordem da liga + convocação, 4 de cada lado
// pras quartas. Cartas de clube pequeno ficam num BARALHO REGIONAL que nunca entra no
// leilão normal. ⚠️ SÓ DESENHO — nada disto está no jogo.
//   node scripts/mockup-copas-regionais.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'copas-regionais.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [500, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', CREME = '#F4ECD6', RED = '#C2452F'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// clube: [nome, cor1, cor2]
const RIO = [['Flamengo', '#C8102E', '#111'], ['Vasco', '#111', '#fff'], ['Botafogo', '#111', '#fff'], ['Fluminense', '#7A1F3D', '#0B6B3A'], ['Bangu', '#C8102E', '#fff'], ['America-RJ', '#C8102E', '#fff'], ['Madureira', '#F2C200', '#1B3E8A'], ['Olaria', '#1B3E8A', '#fff']]
const SP = [['Corinthians', '#fff', '#111'], ['São Paulo', '#C8102E', '#111'], ['Palmeiras', '#0B6B3A', '#fff'], ['Santos', '#fff', '#111'], ['Portuguesa', '#C8102E', '#0B6B3A'], ['Guarani', '#0B6B3A', '#fff'], ['Ponte Preta', '#111', '#fff'], ['São Caetano', '#1B3E8A', '#fff']]
const bola = ([n, c1, c2], s = 26) => `<span style="flex:none;width:${s}px;height:${s}px;border-radius:50%;border:2.5px solid ${INK};background:linear-gradient(135deg,${c1} 50%,${c2} 50%);display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(s * .38)}px;${OSW};color:${GOLD};text-shadow:0 0 2px #000">${n[0]}</span>`
const fone = (titulo, corpo) => `<div class="fone"><p class="cap">${titulo}</p>${corpo}</div>`
const caixa = (c, bg = CREME) => `<div style="background:${bg};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:13px 12px;margin-bottom:14px">${c}</div>`
const h = (t, s = 19) => `<p style="margin:0;${OSW};font-size:${s}px;text-transform:uppercase">${t}</p>`
const sub = t => `<p style="margin:4px 0 10px;font-size:11.5px;font-weight:700;color:#555;line-height:1.4">${t}</p>`

// ① CRIAR SALA
const opc = (t, on, selo) => `<div style="position:relative;background:${on ? GOLD : '#fff'};border:3px solid ${INK};border-radius:11px;box-shadow:${on ? `3px 3px 0 ${INK}` : 'none'};padding:9px 6px;text-align:center;${OSW};font-size:12.5px">${t}${selo ? `<span style="position:absolute;top:-9px;right:-6px;background:${RED};color:#fff;font-size:9px;border:2px solid ${INK};border-radius:6px;padding:1px 5px">${selo}</span>` : ''}</div>`
const grade = itens => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${itens.join('')}</div>`
const tela1 = fone('① Criar sala', caixa(`${h('🏆 Depois da liga')}
<p style="margin:10px 0 6px;${OSW};font-size:12px;color:#555">⚽ COM O SEU TIME</p>
${grade([opc('🏆 Liga + Copa'), opc('🌎 Liga + Liberta'), opc('⭐ Só Champions'), opc('📊 Só liga')])}
<p style="margin:14px 0 6px;${OSW};font-size:12px;color:#555">📋 CONVOCANDO</p>
${grade([opc('🌐 Liga + Mundo'), opc('🔥 Liga + Rio × SP', true, 'NOVO'), opc('🧉 Liga + Sul × Minas', false, 'NOVO'), opc('🌵 Liga + Nordeste', false, 'NOVO')])}
<div style="margin-top:12px;background:#fff;border:2.5px dashed ${INK};border-radius:12px;padding:10px 11px;font-size:11.5px;font-weight:700;line-height:1.5">
🔥 Acabou a liga, os <b>16 primeiros</b> escolhem um clube do Rio ou de SP, <b>na ordem da tabela</b>: o 1º escolhe qualquer um, depois o 2º, e assim por diante. Cada um tem <b>60s</b>; se não escolher, fica com o <b>pior clube que sobrou</b>. Depois todos convocam em <b>90s</b>, igual ao Leilão de Clubes. <b>Cada clube joga contra os 8 do outro lado.</b> Os 4 melhores de cada lado vão pras quartas.</div>
<div style="margin-top:10px;background:#FFF3C4;border:2.5px solid ${INK};border-radius:12px;padding:9px 11px;font-size:11px;font-weight:700;line-height:1.45">🃏 Jogador de clube pequeno (Bangu, Olaria, São Caetano…) só existe nesta copa. <b>Nunca aparece no leilão normal.</b></div>`))

// ② ESCOLHA DO CLUBE
const dono = { Flamengo: '1º Neymarzetti', Corinthians: '2º Murriz FC', Palmeiras: '3º Al Takhadao', Vasco: '4º Fabulous EC', 'São Paulo': '5º Bagres 1993' }
const card = (c, vez) => { const d = dono[c[0]]; return `<div style="display:flex;align-items:center;gap:7px;background:${d ? '#e7e1d0' : vez ? GOLD : '#fff'};border:2.5px solid ${INK};border-radius:10px;padding:6px 7px;opacity:${d ? .75 : 1}">${bola(c, 24)}<div style="min-width:0"><p style="margin:0;${OSW};font-size:12px;white-space:nowrap">${c[0]}</p><p style="margin:0;font-size:9.5px;font-weight:800;color:${d ? RED : GREEN}">${d ? '🔒 ' + d : '🆓 livre'}</p></div></div>` }
const tela2 = fone('② Escolha do clube', caixa(`${h('🔥 Rio × São Paulo')}
<div style="background:${INK};color:#fff;border-radius:12px;padding:10px 12px;margin:10px 0 12px;display:flex;align-items:center;gap:10px"><span style="${OSW};font-size:30px;color:${GOLD}">6º</span><div style="flex:1"><p style="margin:0;${OSW};font-size:15px">SUA VEZ DE ESCOLHER</p><p style="margin:2px 0 0;font-size:11px;font-weight:700;color:#ccc">Você terminou a liga em 6º</p></div><span style="${OSW};font-size:26px;color:${GOLD}">60s</span></div>
<p style="margin:0 0 6px;${OSW};font-size:13px">🏖️ LADO DO RIO</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${RIO.map(c => card(c, c[0] === 'Botafogo')).join('')}</div>
<p style="margin:12px 0 6px;${OSW};font-size:13px">🏙️ LADO DE SÃO PAULO</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${SP.map(c => card(c)).join('')}</div>
<div style="margin-top:12px;${OSW};font-size:15px;text-align:center;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:11px">✅ PEGAR O BOTAFOGO E CONVOCAR</div>
<div style="margin-top:10px;background:#FFE3DD;border:2.5px solid ${INK};border-radius:12px;padding:9px 11px;font-size:11px;font-weight:700;line-height:1.45">⏱️ <b>Acabou o tempo sem escolher?</b> Você fica com o <b>pior clube que sobrou</b>.</div><p style="margin:8px 0 0;font-size:10.5px;font-weight:700;color:#666;text-align:center">Quando os 16 escolherem: <b>90s pra convocar</b>, igual à convocação do Leilão de Clubes.</p>`))

// ③ TABELA DOS DOIS LADOS
const linha = (pos, c, pts, sg, eu) => `<div style="display:flex;align-items:center;gap:7px;padding:5px 7px;border-bottom:1.5px solid #0002;background:${eu ? '#FFE07A' : pos <= 4 ? '#E3F2E6' : '#fff'};${eu ? `outline:3px solid ${INK};outline-offset:-3px;` : ''}"><span style="${OSW};font-size:12px;width:16px">${pos}</span>${bola(c, 20)}<span style="flex:1;${OSW};font-size:12px">${c[0]}${eu ? ' 🫵' : ''}</span><span style="font-size:11px;font-weight:800;width:26px;text-align:right;color:#555">${sg > 0 ? '+' : ''}${sg}</span><span style="${OSW};font-size:13px;width:22px;text-align:right">${pts}</span></div>`
const corte = `<div style="background:${GREEN};color:#fff;${OSW};font-size:9.5px;text-align:center;padding:2px">▲ 4 PRIMEIROS VÃO PRAS QUARTAS</div>`
const lado = (titulo, arr, pts, eu) => `<p style="margin:12px 0 5px;${OSW};font-size:13px">${titulo}</p><div style="border:3px solid ${INK};border-radius:11px;overflow:hidden">${arr.slice(0, 4).map((c, i) => linha(i + 1, c, pts[i][0], pts[i][1], c[0] === eu)).join('')}${corte}${arr.slice(4).map((c, i) => linha(i + 5, c, pts[i + 4][0], pts[i + 4][1], c[0] === eu)).join('')}</div>`
const rioOrd = [RIO[2], RIO[0], RIO[3], RIO[1], RIO[4], RIO[6], RIO[5], RIO[7]]
const spOrd = [SP[1], SP[0], SP[2], SP[3], SP[5], SP[4], SP[6], SP[7]]
const P1 = [[13, 6], [12, 5], [10, 3], [9, 1], [7, -1], [5, -2], [4, -4], [2, -7]], P2 = [[14, 7], [11, 4], [10, 2], [8, 0], [6, -1], [5, -3], [3, -5], [2, -6]]
const jogo = (a, x, y, b) => `<div style="display:flex;align-items:center;gap:6px;background:#fff;border:2.5px solid ${INK};border-radius:10px;padding:6px 8px;margin-top:6px">${bola(a, 20)}<span style="flex:1;${OSW};font-size:12px">${a[0]}</span><span style="${OSW};font-size:15px">${x} × ${y}</span><span style="flex:1;${OSW};font-size:12px;text-align:right">${b[0]}</span>${bola(b, 20)}</div>`
const tela3 = fone('③ Tabela · rodada 5 de 8', caixa(`${h('🔥 Rio × São Paulo')}
${sub('Cada clube joga contra os 8 do outro lado. A tabela é separada por lado.')}
<p style="margin:0;${OSW};font-size:12px;color:#555">⚽ RODADA 5 · CLÁSSICOS DA NOITE</p>
${jogo(RIO[2], 2, 1, SP[2])}${jogo(RIO[0], 1, 1, SP[0])}${jogo(RIO[3], 0, 2, SP[1])}
${lado('🏖️ LADO DO RIO', rioOrd, P1, 'Botafogo')}
${lado('🏙️ LADO DE SÃO PAULO', spOrd, P2)}
<div style="margin-top:12px;background:#fff;border:2.5px dashed ${INK};border-radius:12px;padding:9px 11px;font-size:11px;font-weight:700;line-height:1.5">🏆 <b>Quartas cruzadas:</b> 1º do Rio × 4º de SP · 2º × 3º · e vice-versa. Depois semifinal e final.</div>`))

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}*{box-sizing:border-box}body{margin:0;background:#cfc8b4;font-family:system-ui,sans-serif;color:${INK};padding:22px}
.wrap{display:flex;gap:22px;align-items:flex-start}.fone{width:400px;background:#1a120c;border:3px solid ${INK};border-radius:22px;padding:14px 12px 4px}
.cap{margin:0 0 10px;${OSW};font-size:15px;color:${GOLD};text-transform:uppercase;letter-spacing:.5px}</style><body><div class="wrap">${tela1}${tela2}${tela3}</div></body>`
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
await p.screenshot({ path: SAIDA, fullPage: true }); await b.close(); console.log(SAIDA)
