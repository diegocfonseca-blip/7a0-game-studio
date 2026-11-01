// 🏆⬆️⬇️ MOCKUP (01/11): MINHAS LIGAS EM PIRÂMIDE (Várzea → Série A) com PRÊMIO em moedas + DRAFT + LEILÃO.
// Diego: *"série B nas minhas ligas… poderia ter várzea até série A… deveria ter vantagem e draft também pro vencedor
// escolher uma carta de todo o jogo, além de ganhar moedas com base no ranking… no draft o primeiro escolhe primeiro"*.
// O draft é o MESMO da Liga Draft (19/10): 1 carta de todo o jogo, 60s, única na liga, carta coberta até virar.
//   node scripts/mockup-ligas-piramide.mjs <saida.png>
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? 'mockup-ligas-piramide.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const F = [400, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')

const SERIES = [
  { s: 'Série A', cor: GOLD, ink: INK, times: ['Butinas FC', 'Fabulous EC', 'K9 FC', 'Tocaia SC'] },
  { s: 'Série B', cor: '#B794FF', ink: INK, times: ['Chelsão', 'Corneta', 'Rubão FC', 'Gui'] },
  { s: 'Série C', cor: '#5AA0E8', ink: INK, times: ['Noronha FC', 'Spfcb', 'Zoides FC', 'Km01'] },
  { s: 'Série D', cor: '#2FBF5A', ink: INK, times: ['Borges FC', 'Freire FC', 'Leozinho', 'Nemuh'] },
  { s: 'Várzea', cor: '#C98A3A', ink: INK, times: ['Paizão', 'Elmagofc', 'Lothus21x', 'Cabecinhas'] },
]
const cel = (titulo, sub, corpo) => `<div class="cel"><div class="cab"><b>${titulo}</b><small>${sub}</small></div>${corpo}</div>`

// 1 — a pirâmide
const piramide = cel('🏆 Liga da Firma · Temporada 4', 'a turma inteira em 5 séries', `
  ${SERIES.map((x, i) => `<div style="margin:8px 0;border:3px solid ${INK};border-radius:12px;overflow:hidden;background:#fff;width:${100 - i * 6}%;margin-left:auto;margin-right:auto">
    <div style="background:${x.cor};color:${x.ink};font:700 15px Oswald;padding:4px 10px;display:flex;justify-content:space-between;text-transform:uppercase"><span>${x.s}</span><span>${i === 0 ? '🃏 lendas e craques' : i === 4 ? '🪵 só profissional e bom' : '🃏 baralho da série'}</span></div>
    ${x.times.map((t, j) => `<div style="display:flex;gap:6px;padding:3px 10px;font:600 13px Oswald;border-top:1px solid #eee"><span style="width:20px;color:#888">${j + 1}º</span><span style="flex:1">${t}</span>${i > 0 && j === 0 ? '<span style="color:#1B7A3D">⬆️ sobe</span>' : ''}${i < 4 && j === 3 ? '<span style="color:#C2452F">⬇️ cai</span>' : ''}</div>`).join('')}
  </div>`).join('')}
  <p class="nota">Sobe e cai no fim de cada temporada. Quem entra numa liga já começada começa na Várzea.</p>`)

// 2 — o prêmio em moedas
const tab = [['Série A', [40, 32, 26, 20]], ['Série B', [30, 24, 18, 14]], ['Série C', [22, 18, 14, 10]], ['Série D', [16, 12, 10, 8]], ['Várzea', [12, 10, 8, 6]]]
const premio = cel('💰 Fim da temporada · o prêmio', 'moedas pela colocação, pro próximo leilão', `
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;overflow:hidden">
    <div style="display:grid;grid-template-columns:1.3fr repeat(4,1fr);background:${INK};color:${GOLD};font:700 13px Oswald;padding:6px 10px;text-transform:uppercase"><span>Série</span><span>1º</span><span>2º</span><span>3º</span><span>4º…</span></div>
    ${tab.map(([s, v]) => `<div style="display:grid;grid-template-columns:1.3fr repeat(4,1fr);font:600 15px Oswald;padding:6px 10px;border-top:1px solid #eee"><span>${s}</span>${v.map(n => `<b>+${n}🪙</b>`).join('')}</div>`).join('')}
  </div>
  <div style="margin-top:12px;background:${GOLD};border:3px solid ${INK};border-radius:12px;padding:10px 12px;font:500 14px/1.4 system-ui;box-shadow:3px 3px 0 ${INK}">
    <b style="font:700 16px Oswald;text-transform:uppercase">🏆 Butinas FC, campeão da Série A</b><br>leva <b>+40 🪙</b> pro próximo leilão e é o <b>1º a escolher no draft</b>.</div>
  <p class="nota">Todo mundo começa o leilão com o MESMO dinheiro; o prêmio vem por cima. Números de exemplo — você decide os valores.</p>`)

// 3 — o draft
const ordem = [['Butinas FC', 'campeão da A', '✓ Neymar'], ['Fabulous EC', '2º da A', '✓ Romário'], ['K9 FC', '3º da A', '⏱ NA VEZ'], ['Tocaia SC', '4º da A', '…'], ['Chelsão', '1º da B', '…'], ['…', 'e assim até o último da Várzea', '']]
const draft = cel('📋 A noite do draft', '1 carta de TODO o jogo · o primeiro escolhe primeiro', `
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;overflow:hidden">
    <div style="background:${INK};color:${GOLD};font:700 13px Oswald;padding:6px 10px;letter-spacing:.06em">ORDEM DO DRAFT · A TABELA MANDA</div>
    ${ordem.map(([t, d, st], i) => `<div style="display:flex;gap:8px;align-items:center;padding:6px 10px;font:600 14px Oswald;border-top:1px solid #eee;${st.includes('NA VEZ') ? 'background:#FFF3C4' : ''}"><span style="width:24px">${i < 5 ? `${i + 1}º` : ''}</span><span style="flex:1">${t} <span style="color:#888;font-weight:400">${d}</span></span><span style="color:${st.startsWith('✓') ? GREEN : RED}">${st}</span></div>`).join('')}
  </div>
  <div style="margin-top:12px;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:12px;padding:12px;text-align:center;font:700 20px Oswald;text-transform:uppercase">Com a 3ª escolha… K9 FC escolhe</div>
  <div style="margin-top:10px;border:3px dashed ${GOLD};border-radius:12px;padding:16px;text-align:center;background:#111;color:${GOLD};font:700 30px Oswald">? <span style="font:600 14px Oswald">a carta vira em 3… 2… 1…</span></div>
  <p class="nota">O mesmo draft da Liga Draft: 60s pra escolher, a carta é única na liga, fica coberta até virar pra todo mundo.</p>`)

// 4 — o leilão
const leilao = cel('🔨 Depois: o leilão da sua série', 'na mesma noite, uma sala por série', `
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:12px">
    <div style="font:700 16px Oswald;text-transform:uppercase">K9 FC · Série A</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <span class="chip">💰 300 🪙 de todos</span><span class="chip" style="background:${GOLD}">+26 🪙 do prêmio</span><span class="chip" style="background:#E9E3FF">📋 Romário já no time</span></div>
    <div style="font:500 13.5px/1.45 system-ui;margin-top:10px">O jogador do draft entra no elenco <b>antes</b> do leilão. O resto do time sai no leilão de sempre, com o baralho da Série A (o mais forte).</div>
  </div>
  <div style="margin-top:12px;background:${CREME};border:3px solid ${INK};border-radius:12px;padding:10px 12px;font:500 13.5px/1.45 system-ui">
    <b style="font:700 15px Oswald;text-transform:uppercase">Por que vale subir?</b><br>
    🃏 baralho melhor · 💰 prêmio maior · 📋 escolhe antes no draft.<br>Caiu? No ano seguinte o leilão é da série de baixo.</div>`)

const linha = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;font:700 20px Oswald;text-transform:uppercase">
  ${['⚽ Temporada', '💰 Prêmio', '📋 Draft', '🔨 Leilão', '⚽ Temporada nova'].map(x => `<span style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:8px 14px;box-shadow:3px 3px 0 ${INK}">${x}</span>`).join('<span>➜</span>')}</div>`

const html = `<html><head><style>${F}body{margin:0;background:${CREME};color:${INK};padding:26px;width:1560px;font-family:Oswald}
.cel{background:#141210;border:3px solid ${INK};border-radius:22px;padding:14px;width:360px;box-sizing:border-box;box-shadow:5px 5px 0 #000}
.cab{border:2px solid #333;border-radius:12px;padding:8px 12px;margin-bottom:10px;color:#fff}.cab b{display:block;font:700 17px Oswald;text-transform:uppercase}.cab small{font:400 12px system-ui;opacity:.75}
.nota{color:#ddd;font:400 12.5px/1.4 system-ui;margin:10px 2px 0}
.chip{font:600 13px Oswald;border:2px solid ${INK};border-radius:8px;padding:3px 8px;background:#fff}</style></head><body>
<div style="font:700 34px Oswald;text-transform:uppercase">🏆 Minhas Ligas em pirâmide · prêmio + draft + leilão</div>
<div style="font:400 16px Oswald;color:#444;margin:4px 0 18px">A turma vira Várzea → D → C → B → A. Quanto melhor a colocação, mais moedas e mais cedo no draft.</div>
<div style="display:flex;gap:18px;align-items:flex-start">${piramide}${premio}${draft}${leilao}</div>
${linha}
</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await br.newPage({ viewport: { width: 1612, height: 900 } })
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: OUT, fullPage: true }); await br.close()
console.log('✅', OUT)
