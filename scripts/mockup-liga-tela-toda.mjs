// ─── 🏆 MOCKUP: A TELA INTEIRA DA SALA DA LIGA (hoje × proposta) ────────────
//
// Diego, 23/08, depois da primeira entrega: *"ainda tô achando tudo igual"*.
// E ele está certo. Meu erro: o mockup anterior desenhou TRÊS pedaços da tela
// (troféus, regras, botões do dono) e eu tratei como se fosse a tela toda. A
// tela real tem OITO blocos. Consertei os três e o resto continuou igual — de
// fora, nada mudou.
//
// Some-se a isso: a TABELA de troféus (a mudança mais visível) só aparece quando
// existe troféu. A liga dele tem zero. Ou seja, ele não tinha como ver.
//
// O problema de verdade é a ORDEM e o PESO. Hoje, pra chegar no botão de começar
// o jogo, a pessoa passa por: 5 botões de data · um bloco roxo grande de convite ·
// a lista de técnicos · OITO botões de zoeira · o chat · os troféus · as regras.
// O que ela quer (quem chegou + começar) está soterrado.
//
// Regra deste desenho: o que a pessoa PRECISA fica aberto; o que ela às vezes usa
// fica atrás de um toque. Nada some — tudo continua a um toque de distância.
//
//   node scripts/mockup-liga-tela-toda.mjs [--saida x.png]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'liga-tela-toda.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const ESCURO = '#141414'

const bl = (inner, bg = CREME, extra = '') =>
  `<div style="background:${bg};border:3px solid ${INK};border-radius:15px;box-shadow:3px 3px 0 ${INK};padding:10px 11px;${extra}">${inner}</div>`
const bt = (t, bg = '#fff', cor = INK, fs = 11.5) =>
  `<div style="border:2px solid ${INK};border-radius:9px;background:${bg};color:${cor};${OSW};font-size:${fs}px;text-align:center;padding:7px 5px">${t}</div>`
const rot = t => `<div style="${OSW};text-transform:uppercase;font-size:9px;letter-spacing:.1em;opacity:.5;margin-bottom:5px">${t}</div>`
const g2 = its => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${its.join('')}</div>`
const g3 = its => `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">${its.join('')}</div>`

const topo = `<div style="text-align:center;color:#fff">
  <div style="${OSW};font-size:16px">Liga do Neymarzetti 👑</div>
  <div style="${OSW};font-weight:600;font-size:9px;letter-spacing:.14em;opacity:.5">CÓDIGO DA SALA</div>
  <div style="${OSW};font-size:27px;letter-spacing:.16em">DIOGBI</div></div>`

const faixa = `<div style="background:${GREEN};border:3px solid ${INK};border-radius:15px;box-shadow:3px 3px 0 ${INK};padding:9px 11px">
  <div style="${OSW};font-size:8.5px;letter-spacing:.12em;color:rgba(255,255,255,.7)">🏆 LIGA · PRÓXIMO JOGO</div>
  <div style="${OSW};font-size:17px;color:#fff;line-height:1.15">DOM, 23/8 · 21:00 · amanhã</div>
  <div style="${OSW};font-weight:600;font-size:10px;color:rgba(255,255,255,.72)">🤖 com bots até 20 times</div>`

const tecnicos = extra => bl(`${rot('👥 Técnicos (1/20)')}
  <div style="display:flex;align-items:center;gap:7px;border:2px solid ${INK};border-radius:10px;background:#fff;padding:5px 8px">
    <div style="width:22px;height:22px;border-radius:99px;border:2px solid ${INK};background:${GOLD};${OSW};font-size:11px;display:flex;align-items:center;justify-content:center">N</div>
    <span style="${OSW};font-size:12.5px;flex:1">Neymarzetti 👑</span>
    <span style="${OSW};font-size:9px;background:${GOLD};border:2px solid ${INK};border-radius:6px;padding:1px 6px">HOST</span>
  </div>
  <div style="${OSW};font-weight:600;font-size:10.5px;opacity:.45;margin-top:5px">Aguardando mais técnicos…</div>${extra}`)

const abrir = `<div style="border:3px solid ${INK};border-radius:14px;background:${GREEN};color:#fff;box-shadow:3px 3px 0 ${INK};
  ${OSW};font-size:17px;text-align:center;padding:12px">🔨 ABRIR O PREGÃO!</div>`

// ── HOJE (o que está no ar — copiado dos prints do Diego) ───────────────────
const HOJE = `
${topo}
${faixa}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">${bt('📅 Mudar dia e hora')}${bt('🤖 Tirar bots')}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">${bt('📅 +1 dia')}${bt('📅 +1 semana')}${bt('📅 +15 dias')}</div>
  <div style="margin-top:6px">${bt('⭐ Quem mais pode mexer (0)')}</div>
</div>
${bl(`<div style="${OSW};font-size:13px;color:#fff">📣 Chame a galera</div>
  <div style="${OSW};font-weight:600;font-size:10.5px;color:rgba(255,255,255,.8);margin:3px 0 7px;line-height:1.35">Manda o link — quem já tem conta cai direto na sala; quem não tem, cadastra e vem parar aqui.</div>
  <div style="display:flex;gap:6px">${bt('📤 COMPARTILHAR CONVITE')}<div style="width:42px">${bt('📋', GOLD)}</div></div>`, PURPLE)}
${tecnicos('')}
${bl(`${rot('😜 Enquanto espera… zoa a galera')}
  ${g2([bt('😏 Calma que já vai começar…'), bt('📣 Chamando mais gente, segura!'), bt('😈 Preparados pra perder?'), bt('🍿 Senta que o show vai começar!'), bt('📞 "Posso te ligar agora?" 🔊', GOLD), bt('🎙️ AQUELE áudio 🔊', GOLD), bt('🗣️ SIIIIUU! 🔊', GOLD), bt('🔊 Áudio novo 🔊', GOLD)])}
  <div style="margin-top:6px">${bt('💬 Abrir chat da sala')}</div>`)}
${bl(`<div style="${OSW};font-size:13px;color:#7a4d00">🏆 Sala de troféus da liga</div>
  <div style="${OSW};font-weight:600;font-size:10.5px;opacity:.6;margin:3px 0 7px;line-height:1.35">Ainda sem troféu nenhum — o primeiro campeão sai no fim deste jogo.</div>
  <div style="border:2px solid ${INK};border-radius:11px;background:#fff;padding:8px">
    <div style="${OSW};font-size:11.5px;margin-bottom:5px">✏️ Temporada 1</div>
    ${['🏆 CAMPEÃO DA LIGA|nome do time', '🏆🇧🇷 CAMPEÃO DA COPA|vazio se não teve', '⚽ ARTILHEIRO|nome do jogador', '⚽ TIME DO ARTILHEIRO|é ele que pontua', '🔻 REBAIXADO / MICO|último colocado']
      .map(x => { const [r, ph] = x.split('|'); return `<div style="${OSW};font-size:8.5px;opacity:.45;margin:5px 0 2px">${r}</div>
        <div style="border:2px solid ${INK};border-radius:8px;padding:6px 8px;${OSW};font-weight:600;font-size:11px;opacity:.4">${ph}</div>` }).join('')}
    <div style="display:flex;gap:6px;margin-top:7px">${bt('Salvar', GREEN, '#fff')}${bt('Cancelar')}</div>
  </div>`, '#FFF4CF')}
${bl(`<div style="display:flex;gap:8px;align-items:center"><div style="flex:1"><div style="${OSW};font-size:12px">⚖️ Como o ranking conta</div>
  <div style="${OSW};font-weight:600;font-size:10px;opacity:.55">Por títulos · liga > copa > artilheiro</div></div>${`<div style="width:64px">${bt('Fechar', '#fff', PURPLE)}</div>`}</div>
  <div style="border:2px solid ${INK};border-radius:11px;background:#fff;padding:8px;margin-top:7px">
    ${rot('Como conta')}${g2([bt('🏆 Por títulos', GOLD), bt('🔢 Por pontos')])}
    ${rot('O que vale mais')}${['1º · 🏆 Título da liga', '2º · 🏆🇧🇷 Copa', '3º · ⚽ Artilheiro'].map(t => `<div style="margin-bottom:5px">${bt(t)}</div>`).join('')}
    ${rot('O que conta nesta liga')}${g2([bt('✓ 🏆 Título', GREEN, '#fff'), bt('✓ 🏆🇧🇷 Copa', GREEN, '#fff'), bt('✓ ⚽ Artilheiro', GREEN, '#fff'), bt('✓ 🔻 Rebaixamento', GREEN, '#fff')])}
  </div>`)}
${abrir}
<div style="${OSW};font-size:12px;color:rgba(255,255,255,.7);text-align:center;text-decoration:underline">🚪 Sair da sala</div>`

// ── PROPOSTA ───────────────────────────────────────────────────────────────
const PROPOSTA = `
${topo}
${faixa}
  <div style="margin-top:7px">${bt('⚙️ Ajustes da liga')}</div>
</div>
${tecnicos(`<div style="margin-top:7px">${bt('📤 Chamar a galera (link / código)')}</div>`)}
${abrir}
${bl(`<div style="display:flex;align-items:baseline;gap:7px"><div style="${OSW};font-size:13px;color:#7a4d00">🏆 Sala de troféus</div>
  <div style="${OSW};font-weight:600;font-size:10px;opacity:.5">3 temporadas</div></div>
  <table style="width:100%;border-collapse:collapse;margin-top:6px">
    <tr>${['TEMP.', 'CAMPEÃO', 'COPA', 'ARTILHEIRO', 'MICO', ''].map(h => `<td style="${OSW};font-size:8px;letter-spacing:.06em;opacity:.42;padding:0 4px 4px">${h}</td>`).join('')}</tr>
    ${[[3, 'Nata de SP', 'Tôka10', 'Zico · 27', 'Marreco FC'], [2, 'Skyy FC', 'Nata de SP', 'Romário · 31', 'Tôka10'], [1, 'Nata de SP', 'Skyy FC', 'Gabigol · 24', 'Murriz FC']]
      .map(([t, c, cp, a, m]) => `<tr style="border-top:2px solid rgba(12,12,12,.12)">
        <td style="${OSW};font-size:10px;opacity:.5;padding:5px 4px">T${t}</td>
        <td style="${OSW};font-size:11.5px;padding:5px 4px">🏆 ${c}</td>
        <td style="${OSW};font-size:11.5px;padding:5px 4px">🏆🇧🇷 ${cp}</td>
        <td style="${OSW};font-size:11.5px;padding:5px 4px;white-space:nowrap">⚽ ${a}</td>
        <td style="${OSW};font-size:11.5px;padding:5px 4px;color:${RED}">🔻 ${m}</td>
        <td style="padding:5px 2px"><div style="border:2px solid ${INK};border-radius:7px;width:23px;height:21px;display:flex;align-items:center;justify-content:center;font-size:10px">✏️</div></td></tr>`).join('')}
  </table>
  <div style="${OSW};font-weight:600;font-size:9.5px;opacity:.45;margin-top:6px">O ✏️ arruma qualquer troféu. Vale só dentro desta liga.</div>`, '#FFF4CF')}
${bl(`<div style="display:flex;gap:8px;align-items:center"><div style="flex:1">
  <div style="${OSW};font-size:12px">⚖️ Como o ranking conta</div>
  <div style="${OSW};font-weight:600;font-size:10px;opacity:.55">Por títulos · liga > copa > artilheiro</div></div>
  <div style="width:64px">${bt('⚖️ Mudar', '#fff', PURPLE)}</div></div>`)}
${bl(`${g2([bt('😜 Zoar a galera'), bt('💬 Chat da sala')])}`)}
<div style="display:flex;gap:7px">
  <div style="flex:1;border:2px dashed rgba(255,255,255,.3);border-radius:9px;${OSW};font-size:11.5px;color:rgba(255,255,255,.6);text-align:center;padding:7px">🚪 Sair da sala</div>
  <div style="flex:1">${bt('🗑️ Excluir a liga', RED, '#fff')}</div></div>
<div style="${OSW};font-weight:600;font-size:9.5px;color:rgba(255,255,255,.4);text-align:center;line-height:1.35">
  Sair não apaga nada — a liga fica de pé com os troféus.<br>Excluir some com a sala e a sala de troféus.</div>`

const fone = (titulo, sub, corpo, borda) => `
<div style="flex:1;min-width:330px;max-width:370px">
  <div style="${OSW};font-size:15px;margin-bottom:1px">${titulo}</div>
  <div style="${OSW};font-weight:600;font-size:11px;opacity:.55;margin-bottom:8px">${sub}</div>
  <div style="background:${ESCURO};border:4px solid ${borda};border-radius:20px;box-shadow:5px 5px 0 ${INK};padding:12px;display:flex;flex-direction:column;gap:9px">${corpo}</div>
</div>`

const HTML = `<style>${FONTES}*{box-sizing:border-box;margin:0}
body{background:${CREME};color:${INK};font-family:Oswald,sans-serif;padding:28px}</style>
<div style="max-width:1080px;margin:0 auto">
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;padding:5px 14px;${OSW};font-size:11px;letter-spacing:.1em;box-shadow:3px 3px 0 ${INK}">
    🏆 MOCKUP · A TELA INTEIRA DA SALA DA LIGA</div>
  <h1 style="${OSW};font-size:38px;text-transform:uppercase;margin:13px 0 6px;line-height:1">
    O BOTÃO DE COMEÇAR<span style="color:${RED}"> LÁ EM CIMA</span></h1>
  <p style="${OSW};font-weight:600;font-size:13.5px;max-width:790px;line-height:1.45;opacity:.82">
    Meu erro na entrega anterior: desenhei TRÊS pedaços da tela e tratei como se fosse a tela toda.
    A tela tem OITO blocos — arrumei três e, de fora, nada mudou.
    Aqui está ela inteira. <b>Nada some</b>: o que a pessoa precisa fica aberto, o que ela às vezes usa
    fica a UM toque.</p>

  <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:24px">
    ${fone('❌ Hoje', '8 blocos até o botão de começar', HOJE, '#8a2f24')}
    ${fone('✅ Proposta', 'quem chegou → começar → o resto', PROPOSTA, GREEN)}
  </div>

  <div style="margin-top:28px">${bl(`
    <div style="${OSW};font-size:16px;margin-bottom:8px">O que muda</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;${OSW};font-weight:600;font-size:12px;line-height:1.45">
      <div>🔨 <b>ABRIR O PREGÃO sobe</b> pra logo depois de "quem já chegou". É a única coisa que a pessoa entrou pra fazer.</div>
      <div>📅 <b>Os 6 botões de data e bots</b> viram um só: <b>⚙️ Ajustes da liga</b>. Abre com um toque, tudo lá dentro.</div>
      <div>😜 <b>Os 8 botões de zoeira</b> viram <b>😜 Zoar a galera</b>, do lado do chat. A zoeira continua inteira lá dentro.</div>
      <div>📣 <b>O bloco roxo do convite</b> vira uma linha dentro de "Técnicos" — é ali que a pessoa olha quem falta.</div>
      <div>🏆 <b>Troféus e regras descem</b>: são pra ver entre um jogo e outro, não na hora de começar.</div>
      <div>🚪 <b>Sair e Excluir no pé</b>, com pesos diferentes e o texto dizendo o que cada um faz.</div>
    </div>`, '#fff')}</div>
  <div style="${OSW};font-weight:600;font-size:11px;opacity:.4;margin-top:18px">🔨 Leilão Legends · desenho pro Diego aprovar — nada disto está no jogo</div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const pg = await b.newPage({ viewport: { width: 1140, height: 1400 }, deviceScaleFactor: 2 })
await pg.setContent(HTML, { waitUntil: 'load' })
await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
