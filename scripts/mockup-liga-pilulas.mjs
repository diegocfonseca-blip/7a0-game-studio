// ─── 🏆 MOCKUP: LIGA — espera limpa + pílulas DEPOIS DO PREGÃO ─────────────
//
// Desenho fechado com o Diego em 23/08, depois de várias voltas. As palavras dele:
//   · *"talvez então n tenha nada na sala de espera... tb é uma ideia p n confundir"*
//   · *"seria em pílulas no final né tipo rank estante temporadas ajustes, isso
//      apenas qd INICIA a simulação né? Mas tem q ter algo pro criador da sala
//      tipo os ajustes ter p ele na sala de espera... pq o jogo já começa no pregão"*
//
// O PROBLEMA QUE ISTO RESOLVE: hoje a MESMA informação (a tabela `game_champions`)
// aparece em dois lugares, com dois nomes e duas caras — "Sala de troféus da liga"
// na espera (lista + planilha) e "Hall da Fama da sala" no fim (cartões bonitos).
// Nada batia. E, pior, o RANKING só existia na espera: a pessoa ganhava a liga e
// não via a classificação mudar, que é justamente a hora que importa.
//
// A FORMA:
//   · ESPERA → o bloco de troféus SAI. A tela volta a ser a de sempre. O dono só
//     ganha, junto dos botões dele, o "⚖️ Regras do ranking" (que hoje mora perdido
//     dentro do bloco de troféus). Ele precisa disso ANTES do pregão — depois que
//     a bola rola não tem volta.
//   · DEPOIS DO PREGÃO → uma área só, com pílulas: 🏆 Rank · 🏅 Estante ·
//     📜 Temporadas · ⚙️ Ajustes (a última só pro dono). Abre no Rank.
//     ⏰ QUANDO: assim que o leilão ACABA — que é a hora em que a simulação dos
//     jogos começa. O Diego repetiu isso em 23/08: *"as pílulas novas devem
//     aparecer logo após acabar o leilão, q inicia a simulação dos jogos"*.
//     (No 1º desenho eu tinha posto "no fim do jogo" — era leitura minha, errada.)
//     Não é spoiler: rank/estante/temporadas só mostram temporadas ENCERRADAS.
//
// ⚠️ A ORDEM DA TELA DE ESPERA NÃO MUDA — ele recusou isso em 23/08 (ver
// `mockup-liga-tela-toda.mjs`). Aqui a espera só PERDE um bloco e GANHA um botão.
//
//   node scripts/mockup-liga-pilulas.mjs [--saida x.png]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'liga-pilulas.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const ESCURO = '#141414'

const bl = (inner, bg = CREME) =>
  `<div style="background:${bg};border:3px solid ${INK};border-radius:15px;box-shadow:3px 3px 0 ${INK};padding:10px 11px">${inner}</div>`
const bt = (t, bg = '#fff', cor = INK) =>
  `<div style="border:2px solid ${INK};border-radius:9px;background:${bg};color:${cor};${OSW};font-size:11.5px;text-align:center;padding:7px 5px">${t}</div>`
const rot = t => `<div style="${OSW};text-transform:uppercase;font-size:9px;letter-spacing:.1em;opacity:.5;margin-bottom:5px">${t}</div>`

// ── 1) SALA DE ESPERA ──────────────────────────────────────────────────────
const espera = `
<div style="text-align:center;color:#fff">
  <div style="${OSW};font-size:16px">Liga do Neymarzetti 👑</div>
  <div style="${OSW};font-weight:600;font-size:9px;letter-spacing:.14em;opacity:.5">CÓDIGO DA SALA</div>
  <div style="${OSW};font-size:27px;letter-spacing:.16em">DIOGBI</div></div>
<div style="background:${GREEN};border:3px solid ${INK};border-radius:15px;box-shadow:3px 3px 0 ${INK};padding:9px 11px">
  <div style="${OSW};font-size:8.5px;letter-spacing:.12em;color:rgba(255,255,255,.7)">🏆 LIGA · PRÓXIMO JOGO</div>
  <div style="${OSW};font-size:17px;color:#fff;line-height:1.15">DOM, 23/8 · 21:00 · amanhã</div>
  <div style="${OSW};font-weight:600;font-size:10px;color:rgba(255,255,255,.72)">🤖 com bots até 20 times</div>
  <div style="${OSW};font-weight:600;font-size:9.5px;color:rgba(255,255,255,.6);margin-top:3px;padding-top:5px;border-top:1.5px solid rgba(255,255,255,.2)">
    ⚖️ Conta por pontos · liga 20 · copa 30 · artilheiro 5 · rebaixamento −10
    <span style="opacity:.7">— todo mundo vê</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">${bt('📅 Mudar dia e hora')}${bt('🤖 Tirar bots')}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">${bt('📅 +1 dia')}${bt('📅 +1 semana')}${bt('📅 +15 dias')}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">${bt('⭐ Quem mais pode mexer (0)')}${bt('⚖️ Regras do ranking', GOLD)}</div>
</div>
${bl(`<div style="${OSW};font-size:13px;color:#fff">📣 Chame a galera</div>
  <div style="display:flex;gap:6px;margin-top:7px">${bt('📤 COMPARTILHAR CONVITE')}<div style="width:42px">${bt('📋', GOLD)}</div></div>`, PURPLE)}
${bl(`${rot('👥 Técnicos (2/20)')}
  <div style="display:flex;align-items:center;gap:7px;border:2px solid ${INK};border-radius:10px;background:#fff;padding:5px 8px;margin-bottom:5px">
    <div style="width:22px;height:22px;border-radius:99px;border:2px solid ${INK};background:${GOLD};${OSW};font-size:11px;display:flex;align-items:center;justify-content:center">N</div>
    <span style="${OSW};font-size:12.5px;flex:1">Neymarzetti 👑</span>
    <span style="${OSW};font-size:9px;background:${GOLD};border:2px solid ${INK};border-radius:6px;padding:1px 6px">HOST</span></div>
  <div style="display:flex;align-items:center;gap:7px;border:2px solid ${INK};border-radius:10px;background:#fff;padding:5px 8px">
    <div style="width:22px;height:22px;border-radius:99px;border:2px solid ${INK};background:#ddd;${OSW};font-size:11px;display:flex;align-items:center;justify-content:center">T</div>
    <span style="${OSW};font-size:12.5px;flex:1">Tôka10</span></div>`)}
${bl(`${rot('😜 Enquanto espera… zoa a galera')}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${bt('😏 Calma que já vai…')}${bt('📣 Chamando mais gente!')}${bt('😈 Preparados pra perder?')}${bt('🍿 Senta que o show vai…')}</div>
  <div style="margin-top:6px">${bt('💬 Abrir chat da sala')}</div>`)}
<div style="border:3px solid ${INK};border-radius:14px;background:${GREEN};color:#fff;box-shadow:3px 3px 0 ${INK};
  ${OSW};font-size:17px;text-align:center;padding:12px">🔨 ABRIR O PREGÃO!</div>
<div style="display:flex;gap:7px">
  <div style="flex:1;border:2px dashed rgba(255,255,255,.3);border-radius:9px;${OSW};font-size:11.5px;color:rgba(255,255,255,.6);text-align:center;padding:7px">🚪 Sair da sala</div>
  <div style="flex:1">${bt('🗑️ Excluir a liga', RED, '#fff')}</div></div>`

// ── 2) FIM DO JOGO: as pílulas ─────────────────────────────────────────────
const pilula = (t, on) => `<div style="flex:1;border:2.5px solid ${INK};border-radius:999px;padding:6px 4px;text-align:center;
  ${OSW};font-size:11px;background:${on ? GOLD : '#fff'};color:${INK};box-shadow:${on ? `2px 2px 0 ${INK}` : 'none'}">${t}</div>`
const pilulas = sel => `<div style="display:flex;gap:5px">${['🏆 Rank', '🏅 Estante', '📜 Temporadas', '⚙️ Ajustes'].map((t, i) => pilula(t, i === sel)).join('')}</div>`

const linhaRank = (pos, nome, det, pts, top) => `
<div style="display:flex;align-items:center;gap:7px;border:2px solid ${INK};border-radius:10px;background:#fff;padding:5px 8px;margin-bottom:5px">
  <span style="${OSW};font-size:12px;width:22px;text-align:center;color:${top ? '#7a4d00' : 'rgba(12,12,12,.4)'}">${pos}</span>
  <div style="flex:1;min-width:0">
    <div style="${OSW};font-size:12.5px">${nome}</div>
    <div style="${OSW};font-weight:600;font-size:9.5px;opacity:.55">${det}</div></div>
  <span style="${OSW};font-size:12.5px;border:2px solid ${INK};border-radius:8px;background:${GOLD};padding:0 7px">${pts}</span></div>`

const trofeuCard = (emoji, n, label, grad, fg) => `
<div style="width:74px;border:2.5px solid ${INK};border-radius:12px;padding:6px 3px 5px;text-align:center;box-shadow:2px 2px 0 ${INK};background:${grad};color:${fg}">
  <span style="font-size:21px;display:block;line-height:1.1">${emoji}</span>
  <span style="display:block;${OSW};font-size:13px">×${n}</span>
  <span style="display:block;${OSW};font-weight:600;font-size:7px;text-transform:uppercase;letter-spacing:.04em">${label}</span></div>`

const abaRank = `${pilulas(0)}
${bl(`${rot('🏆 Classificação da liga · 3 temporadas')}
  ${linhaRank('🥇', 'Nata de SP 👑', '🏆 2 · 🏆🇧🇷 1 · ⚽ 1', '75', true)}
  ${linhaRank('2º', 'Skyy FC ⭐', '🏆 1 · 🏆🇧🇷 1 · ⚽ 1', '55')}
  ${linhaRank('3º', 'Tôka10 👑', '🏆🇧🇷 1 · 🔻 1', '20')}
  <div style="${OSW};font-weight:600;font-size:9.5px;opacity:.5;margin-top:6px;line-height:1.35">
    Conta por pontos · liga 20 · copa 30 · artilheiro 5 · rebaixamento −10.<br>Só a galera pontua — bot não entra.</div>`, '#FFF9E8')}`

const abaEstante = `${pilulas(1)}
${bl(`${rot('🏅 A estante da resenha')}
  <div style="border:2.5px solid ${INK};border-radius:12px;overflow:hidden;box-shadow:2px 2px 0 ${INK};margin-bottom:7px">
    <div style="background:linear-gradient(120deg,#F6E9C0,#C9A227);${OSW};font-size:12.5px;padding:5px 9px;border-bottom:2.5px solid ${INK};display:flex">
      <span style="flex:1">Nata de SP 👑</span><span style="background:rgba(0,0,0,.7);color:${GOLD};border-radius:7px;font-size:9px;padding:1px 7px">4 troféus</span></div>
    <div style="display:flex;gap:6px;padding:8px 9px;background:#FFF9E8">
      ${trofeuCard('🏆', 2, 'Liga', 'linear-gradient(170deg,#FFD84D,#F5B301)', INK)}
      ${trofeuCard('🏆', 1, 'Copa', 'linear-gradient(170deg,#FFF3C9,#FFE07A)', INK)}
      ${trofeuCard('⚽', 1, 'Artilharia', 'linear-gradient(170deg,#57C983,#1B7A3D)', '#fff')}</div></div>
  <div style="border:2.5px solid ${INK};border-radius:12px;overflow:hidden;box-shadow:2px 2px 0 ${INK}">
    <div style="background:#E9E9E9;${OSW};font-size:12.5px;padding:5px 9px;border-bottom:2.5px solid ${INK};display:flex">
      <span style="flex:1">Tôka10 👑</span><span style="background:rgba(0,0,0,.7);color:${GOLD};border-radius:7px;font-size:9px;padding:1px 7px">1 troféu</span></div>
    <div style="display:flex;gap:6px;padding:8px 9px;background:#FFF9E8">
      ${trofeuCard('🏆', 1, 'Copa', 'linear-gradient(170deg,#FFF3C9,#FFE07A)', INK)}
      ${trofeuCard('🙈', 1, 'Mico', 'linear-gradient(170deg,#C9986B,#8B5E3C)', '#fff')}</div></div>
  <div style="${OSW};font-weight:600;font-size:9.5px;background:#FDECEA;border:2px solid ${RED};color:#7a2418;border-radius:8px;padding:5px 7px;margin-top:7px;line-height:1.35">
    🙈 <b>MICO DA TEMPORADA:</b> o ônibus do Tôka10 voltou DE RÉ pra garagem. 🚌</div>`, '#FFF9E8')}`

const abaTemp = `${pilulas(2)}
${bl(`${rot('📜 Temporada a temporada')}
  <table style="width:100%;border-collapse:collapse">
    <tr>${['TEMP.', 'CAMPEÃO', 'COPA', 'ARTILHEIRO', 'MICO', ''].map(h => `<td style="${OSW};font-size:8px;opacity:.42;padding:0 4px 4px">${h}</td>`).join('')}</tr>
    ${[[3, 'Nata de SP', 'Tôka10', 'Zico · 27', 'Marreco FC'], [2, 'Skyy FC', 'Nata de SP', 'Romário · 31', 'Tôka10'], [1, 'Nata de SP', 'Skyy FC', 'Gabigol · 24', 'Murriz FC']]
      .map(([t, c, cp, a, m]) => `<tr style="border-top:2px solid rgba(12,12,12,.12)">
        <td style="${OSW};font-size:10px;opacity:.5;padding:5px 4px">T${t}</td>
        <td style="${OSW};font-size:11.5px;padding:5px 4px">🏆 ${c}</td>
        <td style="${OSW};font-size:11.5px;padding:5px 4px">🏆🇧🇷 ${cp}</td>
        <td style="${OSW};font-size:11.5px;padding:5px 4px;white-space:nowrap">⚽ ${a}</td>
        <td style="${OSW};font-size:11.5px;padding:5px 4px;color:${RED}">🔻 ${m}</td>
        <td style="padding:5px 2px"><div style="border:2px solid ${INK};border-radius:7px;width:23px;height:21px;display:flex;align-items:center;justify-content:center;font-size:10px">✏️</div></td></tr>`).join('')}
  </table>
  <div style="margin-top:8px">${bt('＋ Escrever uma temporada que faltou', '#fff', PURPLE)}</div>
  <div style="${OSW};font-weight:600;font-size:9.5px;opacity:.45;margin-top:6px">O ✏️ é só do dono. Vale só dentro desta liga.</div>`, '#FFF9E8')}`

const abaAjustes = `${pilulas(3)}
${bl(`${rot('⚙️ Só o dono da liga vê')}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
    ${bt('📅 Dia e hora')}${bt('🤖 Bots: com')}
    ${bt('⚖️ Regras do ranking')}${bt('⭐ Quem manda junto')}</div>
  <div style="margin-top:6px">${bt('🗑️ Excluir a liga', RED, '#fff')}</div>
  <div style="${OSW};font-weight:600;font-size:9.5px;opacity:.45;margin-top:7px;line-height:1.35">
    Os mesmos ajustes da sala de espera, à mão aqui também.</div>`, '#FFF9E8')}`

const fone = (titulo, sub, corpo, borda, escuro) => `
<div style="flex:1;min-width:300px;max-width:340px">
  <div style="${OSW};font-size:14px;margin-bottom:1px">${titulo}</div>
  <div style="${OSW};font-weight:600;font-size:10.5px;opacity:.55;margin-bottom:8px">${sub}</div>
  <div style="background:${escuro ? ESCURO : CREME};border:4px solid ${borda};border-radius:20px;box-shadow:5px 5px 0 ${INK};padding:11px;display:flex;flex-direction:column;gap:8px">${corpo}</div>
</div>`

const HTML = `<style>${FONTES}*{box-sizing:border-box;margin:0}
body{background:${CREME};color:${INK};font-family:Oswald,sans-serif;padding:26px}</style>
<div style="max-width:1250px;margin:0 auto">
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;padding:5px 14px;${OSW};font-size:11px;letter-spacing:.1em;box-shadow:3px 3px 0 ${INK}">
    🏆 MOCKUP · LIGA: ESPERA LIMPA + PÍLULAS NO FIM</div>
  <h1 style="${OSW};font-size:36px;text-transform:uppercase;margin:12px 0 6px;line-height:1">
    UM LUGAR SÓ<span style="color:${RED}"> PRA CADA COISA</span></h1>
  <p style="${OSW};font-weight:600;font-size:13px;max-width:820px;line-height:1.45;opacity:.82">
    Hoje a MESMA informação aparece em dois lugares com dois nomes e duas caras — e o
    <b>ranking só existia na espera</b>, então você ganhava a liga e não via a classificação mudar.
    Agora: <b>espera</b> = quem chegou e começar (o dono ganha o ⚖️ ali, porque depois do pregão não tem volta);
    <b>depois do pregão</b> = a liga inteira, em pílulas, e fica lá até o fim.</p>

  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:22px">
    ${fone('① Sala de espera', 'o bloco de troféus SAI · o dono ganha o ⚖️', espera, GREEN, true)}
    ${fone('② Depois do pregão · 🏆 Rank', 'abre nesta — é o que mudou agora', abaRank, GOLD)}
    ${fone('③ Depois do pregão · 🏅 Estante', 'os cartões bonitos, só de gente', abaEstante, GOLD)}
  </div>
  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:20px">
    ${fone('④ Depois do pregão · 📜 Temporadas', 'a tabela ano a ano, com o ✏️ do dono', abaTemp, GOLD)}
    ${fone('⑤ Depois do pregão · ⚙️ Ajustes', 'só o dono vê esta pílula', abaAjustes, GOLD)}
    <div style="flex:1;min-width:300px;max-width:340px">${bl(`
      <div style="${OSW};font-size:15px;margin-bottom:7px">O que muda</div>
      <div style="${OSW};font-weight:600;font-size:11.5px;line-height:1.5">
      ✅ A espera <b>perde o paredão de troféus</b> e volta a ser a tela de sempre.<br><br>
      ✅ O dono <b>ganha o ⚖️ Regras do ranking</b> junto dos botões dele — ele precisa disso ANTES do pregão.<br><br>
      ✅ Todo mundo vê a regra <b>numa linha</b> dentro da faixa verde. O convidado não entra mais no escuro.<br><br>
      ✅ <b>Assim que o pregão acaba</b> (a hora em que a simulação começa), aparece <b>uma área só, em pílulas</b>. Abre no Rank, e continua lá até o fim do jogo.<br><br>
      ✅ <b>Um nome só</b> pra coisa: some o "Hall da Fama da sala" × "Sala de troféus da liga".<br><br>
      🔒 A ordem da tela de espera <b>não muda</b> — você recusou isso e eu não mexi.</div>`, '#fff')}</div>
  </div>
  <div style="${OSW};font-weight:600;font-size:11px;opacity:.4;margin-top:18px">🔨 Leilão Legends · desenho pro Diego aprovar — nada disto está no jogo</div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const pg = await b.newPage({ viewport: { width: 1310, height: 1400 }, deviceScaleFactor: 2 })
await pg.setContent(HTML, { waitUntil: 'load' })
await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
