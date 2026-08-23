// ─── 🏆 MOCKUP: DENTRO DA SALA DA LIGA (host × convidado) ───────────────────
//
// Por que este mockup existe (Diego, 22/08, com prints da tela real):
//   *"o visual mockup q vc fez de liga fechada era bonito, agora esse q vc
//    entregou está péssimo pro host pqp e provavelmente vai ser um péssimo pros
//    convidados tb.. q tb precisam enxergar as regras e coisas. Tudo tem que ser
//    claro."*
//
// O QUE ESTAVA ERRADO na tela entregue (dá pra ver nos prints dele):
//   1. O FORMULÁRIO de arrumar troféu vinha ABERTO, com todos os campos vazios
//      ("nome do time", "vazio se não teve", "nome do jogador"…) — antes mesmo de
//      existir um troféu. Parecia lição de casa pra preencher.
//   2. As REGRAS DO RANKING vinham abertas logo abaixo, com mais 4 campos e 4
//      chips. Duas paredes de formulário, uma em cima da outra.
//   3. Resultado: a pessoa rola meia tela de campos até achar o "ABRIR O PREGÃO".
//
// A REGRA DO MOCKUP APROVADO (19-20/08) era outra: troféus em TABELA, um lápis
// por linha, e as regras atrás de um link. Nada aberto até a pessoa pedir.
//
// E o pedido novo: o CONVIDADO também precisa ENXERGAR troféus e regras — ele só
// não arruma nada. Antes ele não via.
//
//   node scripts/mockup-liga-sala.mjs [--saida x.png]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'liga-sala.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const caixa = (inner, bg = '#fff', pad = '13px 14px') =>
  `<div style="background:${bg};border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:${pad}">${inner}</div>`
const rot = t => `<div style="${OSW};text-transform:uppercase;font-size:10.5px;letter-spacing:.09em;opacity:.5;margin:0 0 6px">${t}</div>`
const btn = (txt, bg = '#fff', cor = INK, extra = '') =>
  `<div style="border:2.5px solid ${INK};border-radius:11px;background:${bg};color:${cor};box-shadow:2px 2px 0 ${INK};
     ${OSW};font-size:12.5px;text-align:center;padding:9px 8px;${extra}">${txt}</div>`
const NOVO = `<span style="background:${GREEN};color:#fff;${OSW};font-size:9px;border-radius:5px;padding:2px 6px;letter-spacing:.05em">NOVO</span>`

// ── faixa verde do próximo jogo (já existe hoje, fica igual) ────────────────
const faixaJogo = `
<div style="background:${GREEN};border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:11px 13px">
  <div style="${OSW};font-size:9.5px;letter-spacing:.12em;color:rgba(255,255,255,.72)">🏆 LIGA · PRÓXIMO JOGO</div>
  <div style="${OSW};font-size:19px;color:#fff;line-height:1.15">SÁB, 24/8 · 21:00 · faltam 2 dias</div>
  <div style="${OSW};font-weight:600;font-size:11px;color:rgba(255,255,255,.75);margin-top:1px">🚫 sem bots — só a galera na tabela</div>
</div>`

// ── 🏆 sala de troféus: TABELA, e nada de formulário aberto ─────────────────
const linhaTrof = (t, campeao, copa, art, mico, lapis) => `
<tr>
  <td style="${OSW};font-size:11px;opacity:.55;padding:7px 6px;white-space:nowrap">T${t}</td>
  <td style="${OSW};font-size:12.5px;padding:7px 6px">🏆 ${campeao}</td>
  <td style="${OSW};font-size:12.5px;padding:7px 6px">${copa ? '🏆🇧🇷 ' + copa : '<span style="opacity:.3">—</span>'}</td>
  <td style="${OSW};font-size:12.5px;padding:7px 6px;white-space:nowrap">⚽ ${art}</td>
  <td style="${OSW};font-size:12.5px;padding:7px 6px;color:${RED}">🔻 ${mico}</td>
  ${lapis ? `<td style="padding:7px 2px"><div style="border:2px solid ${INK};border-radius:8px;width:26px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px">✏️</div></td>` : ''}
</tr>`

const salaTrofeus = (dono) => caixa(`
  <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">
    <div style="${OSW};font-size:16px">🏆 Sala de troféus</div>
    <div style="${OSW};font-weight:600;font-size:11px;opacity:.5">3 temporadas</div>
  </div>
  <div style="overflow-x:auto">
  <table style="width:100%;border-collapse:collapse">
    <tr style="border-bottom:2px solid rgba(12,12,12,.15)">
      <td style="${OSW};font-size:9px;letter-spacing:.08em;opacity:.45;padding:0 6px 5px">TEMP.</td>
      <td style="${OSW};font-size:9px;letter-spacing:.08em;opacity:.45;padding:0 6px 5px">CAMPEÃO</td>
      <td style="${OSW};font-size:9px;letter-spacing:.08em;opacity:.45;padding:0 6px 5px">COPA</td>
      <td style="${OSW};font-size:9px;letter-spacing:.08em;opacity:.45;padding:0 6px 5px">ARTILHEIRO</td>
      <td style="${OSW};font-size:9px;letter-spacing:.08em;opacity:.45;padding:0 6px 5px">MICO</td>
      ${dono ? '<td></td>' : ''}
    </tr>
    ${linhaTrof(3, 'Nata de SP', 'Tôka10', 'Zico · 27', 'Marreco FC', dono)}
    ${linhaTrof(2, 'Skyy FC', 'Nata de SP', 'Romário · 31', 'Tôka10', dono)}
    ${linhaTrof(1, 'Nata de SP', 'Skyy FC', 'Gabigol · 24', 'Murriz FC', dono)}
  </table>
  </div>
  ${dono ? `<div style="margin-top:9px">${btn('＋ Escrever uma temporada que faltou', '#fff', PURPLE)}</div>
  <div style="${OSW};font-weight:600;font-size:10px;opacity:.45;margin-top:7px;line-height:1.35">
    O lápis arruma qualquer troféu, de qualquer um. Vale só dentro desta liga — o ranking do jogo não muda.</div>`
  : `<div style="${OSW};font-weight:600;font-size:10px;opacity:.45;margin-top:8px;line-height:1.35">
    Quem arruma troféu é o dono da liga.</div>`}
`, '#FFF9E8')

// ── ⚖️ regras: UMA LINHA fechada. Convidado vê igual (só não muda) ──────────
const regras = (dono) => caixa(`
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
    <div style="min-width:0">
      <div style="${OSW};font-size:13.5px">⚖️ Como o ranking conta</div>
      <div style="${OSW};font-weight:600;font-size:11px;opacity:.55;margin-top:1px">
        Por pontos · liga 20 · copa 30 · artilheiro 5 · rebaixamento −10</div>
    </div>
    <div style="border:2.5px solid ${INK};border-radius:10px;padding:6px 11px;${OSW};font-size:11.5px;white-space:nowrap;box-shadow:2px 2px 0 ${INK}">
      ${dono ? '⚖️ Mudar' : '👁️ Ver'}</div>
  </div>`)

// ── 👑 botões do dono: grade curtinha, não uma pilha ────────────────────────
const botoesDono = caixa(`
  ${rot('👑 Só o dono da liga vê')}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    ${btn('📅 Dia e hora')}${btn('🤖 Bots: sem')}
    ${btn('👥 Quem manda junto')}${btn('📤 Chamar a galera')}
  </div>`)

// 🚪🗑️ SAIR e EXCLUIR ficam JUNTOS, no pé da tela (Diego, 22/08: *"eu acho q além
// de sair da sala deve ter um botão dentro da sala de excluir sala tb não?"*).
// Ele tem razão e o motivo é bom: hoje o "excluir a liga" existe, mas mora LÁ EM
// CIMA, dentro da faixa verde do próximo jogo — e ninguém procura "apagar" no topo
// da tela. Procura-se no pé, do lado do "sair". Repare na diferença de peso: sair é
// discreto (você volta quando quiser), excluir é vermelho e some com tudo.
const pesDono = `
<div style="display:flex;gap:9px">
  <div style="flex:1">${btn('🚪 Sair da sala', 'transparent', 'rgba(12,12,12,.55)', 'border-style:dashed;box-shadow:none')}</div>
  <div style="flex:1">${btn('🗑️ Excluir a liga', RED, '#fff')}</div>
</div>
<div style="${OSW};font-weight:600;font-size:10px;opacity:.45;text-align:center;line-height:1.35">
  Sair não apaga nada — a liga fica de pé com os troféus.<br>Excluir some com a sala e a sala de troféus, pra todo mundo.</div>`

const pesConvidado = `
<div>${btn('🚪 Sair da sala', 'transparent', 'rgba(12,12,12,.55)', 'border-style:dashed;box-shadow:none')}</div>
<div style="${OSW};font-weight:600;font-size:10px;opacity:.45;text-align:center">Você volta quando quiser — é só o código.</div>`

const abrir = `<div style="border:4px solid ${INK};border-radius:16px;background:${GREEN};color:#fff;box-shadow:4px 4px 0 ${INK};
  ${OSW};font-size:19px;text-align:center;padding:14px">🔨 ABRIR O PREGÃO!</div>`

const esperaConvidado = caixa(`
  <div style="${OSW};font-size:13px;text-align:center;line-height:1.4">👑 O dono abre o pregão quando quiser.<br>
  <span style="${OSW};font-weight:600;font-size:11px;opacity:.55">Ele já está aqui — pode chamar no chat da sala.</span></div>`, '#FFF9E8')

const telefone = (titulo, sub, corpo) => `
<div style="flex:1;min-width:340px;max-width:390px">
  <div style="${OSW};font-size:15px;margin-bottom:2px">${titulo}</div>
  <div style="${OSW};font-weight:600;font-size:11.5px;opacity:.55;margin-bottom:9px">${sub}</div>
  <div style="background:${CREME};border:4px solid ${INK};border-radius:22px;box-shadow:5px 5px 0 ${INK};padding:13px;display:flex;flex-direction:column;gap:11px">
    <div style="text-align:center">
      <div style="${OSW};font-size:17px">Resenha dos Cria</div>
      <div style="${OSW};font-weight:600;font-size:10px;letter-spacing:.14em;opacity:.5">CÓDIGO DA SALA</div>
      <div style="${OSW};font-size:30px;letter-spacing:.18em">KX7M2A</div>
    </div>
    ${corpo}
  </div>
</div>`

const HTML = `<style>${FONTES}
*{box-sizing:border-box;margin:0}
body{background:${CREME};color:${INK};font-family:Oswald,sans-serif;padding:30px}
</style>
<div style="max-width:1120px;margin:0 auto">
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;padding:5px 14px;${OSW};font-size:11.5px;letter-spacing:.1em;box-shadow:3px 3px 0 ${INK}">
    🏆 MOCKUP · DENTRO DA SALA DA LIGA</div>
  <h1 style="${OSW};font-size:40px;text-transform:uppercase;margin:14px 0 6px;line-height:1">
    NADA ABERTO<span style="color:${RED}"> À TOA</span></h1>
  <p style="${OSW};font-weight:600;font-size:14px;max-width:760px;line-height:1.45;opacity:.8">
    O que está no ar hoje escancara o formulário de arrumar troféu (campos vazios!) e as regras do ranking,
    um embaixo do outro — meia tela de campos antes do botão de começar. Aqui é o contrário:
    <b>troféu é TABELA</b>, <b>regra é uma linha</b>, e formulário só abre quando a pessoa pede.
    E o <b>convidado enxerga tudo</b> — só não arruma.</p>

  <div style="display:flex;gap:26px;flex-wrap:wrap;margin-top:26px">
    ${telefone('👑 Quem criou a liga', 'vê os troféus, as regras e os botões dele', `
      ${faixaJogo}${salaTrofeus(true)}${regras(true)}${botoesDono}${abrir}${pesDono}`)}
    ${telefone('👥 Convidado', 'vê os MESMOS troféus e as MESMAS regras — só não muda', `
      ${faixaJogo}${salaTrofeus(false)}${regras(false)}${esperaConvidado}${pesConvidado}`)}
  </div>

  <div style="margin-top:30px">${caixa(`
    <div style="${OSW};font-size:17px;margin-bottom:9px">O que muda de hoje pra isto ${NOVO}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px 22px;${OSW};font-weight:600;font-size:12.5px;line-height:1.45">
      <div>❌ <b>Hoje:</b> o formulário de troféu vem aberto, com 5 campos vazios, mesmo sem troféu nenhum.</div>
      <div>✅ <b>Assim:</b> sem troféu, uma frase calma. Com troféu, uma tabela. O formulário só abre no ✏️.</div>
      <div>❌ <b>Hoje:</b> as regras do ranking abrem embaixo com mais 4 campos e 4 chips.</div>
      <div>✅ <b>Assim:</b> uma linha que já diz a regra em palavras. Quem quiser mudar, toca em "Mudar".</div>
      <div>❌ <b>Hoje:</b> o convidado não vê troféu nem regra — entra sem saber onde pisa.</div>
      <div>✅ <b>Assim:</b> vê os dois, do jeitinho que o dono vê. Só não tem lápis nem botão.</div>
      <div>❌ <b>Hoje:</b> o "ABRIR O PREGÃO" fica lá embaixo, depois de tudo.</div>
      <div>✅ <b>Assim:</b> a tela cabe, e o botão fica logo à mão.</div>
      <div>❌ <b>Hoje:</b> o "🗑️ Excluir a liga" mora LÁ EM CIMA, na faixa verde — ninguém acha.</div>
      <div>✅ <b>Assim:</b> desce pro pé da tela, colado no "Sair", que é onde a pessoa procura.</div>
    </div>`)}
  </div>
  <div style="${OSW};font-weight:600;font-size:11px;opacity:.4;margin-top:20px">🔨 Leilão Legends · nada disto está no jogo ainda — é desenho pro Diego aprovar</div>
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const pg = await b.newPage({ viewport: { width: 1180, height: 1400 }, deviceScaleFactor: 2 })
await pg.setContent(HTML, { waitUntil: 'load' })
await pg.evaluate(() => document.fonts.ready)
await pg.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
