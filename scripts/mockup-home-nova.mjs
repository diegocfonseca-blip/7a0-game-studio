// ─── 🏠 MOCKUP: HOME NOVA (o jogo se explicando em 10 segundos) ─────────────
//
// Reclamação do Diego (20/08), e ele está certo nas três:
//   *"o visual da home ainda acho que não tá legal, ainda acho que tá poluído, e
//   ainda acho que tá desorganizado! e ainda acho que o jogo não está claro as
//   regras dele... as pessoas começam o jogo e não entendem o que tem que fazer
//   no leilão, moedas que tem pra completar 11, a disputa... e que depois tem uma
//   simulação, não está muito claro isso também"*
//
// 🔎 O DIAGNÓSTICO (medido na home de hoje, não é achismo):
//  1. A primeira tela tem **11 botões** e a explicação do jogo vem DEPOIS deles.
//     A pessoa escolhe antes de saber o que está escolhendo.
//  2. As 4 cartas gigantes comem uma tela inteira de altura — no lugar exato onde
//     deveria estar "como se joga". Carta é PRÊMIO, não explicação.
//  3. Os 4 quadros (Pregão · Níveis ocultos · Pirâmide · Vale o auge) são um
//     GLOSSÁRIO. Falta o CAMINHO, na ordem em que as coisas acontecem.
//  4. "O que mudou por aqui" é o maior bloco da página — e é o único que não
//     interessa a quem chegou agora. Tamanho errado pro público errado.
//  5. Dois botões "em breve" ocupam espaço nobre sem fazer nada.
//
// 💡 A PROPOSTA: a home responde 3 perguntas, nesta ordem —
//    (1) o que é isso · (2) como se joga · (3) por onde começo.
// Álbum, ranking, cartas e novidades DESCEM. Um botão principal, só um.
//
//   node scripts/mockup-home-nova.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'home-nova.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CREME = '#F4ECD6'

// ── telefone (a home é vista no celular; é assim que ela precisa fechar) ─────
const fone = (inner, rot, cor) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor};margin-bottom:9px">${rot}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};
    overflow:hidden;padding:13px 12px 16px">${inner}</div>
</div>`

const btn = (txt, bg, cor, sub, alt = 13) => `
  <div style="border:3px solid ${INK};border-radius:13px;background:${bg};color:${cor};box-shadow:3px 3px 0 ${INK};
    padding:${alt}px 11px;margin-bottom:7px;text-align:center">
    <div style="${OSW};font-size:15px;text-transform:uppercase;line-height:1.05">${txt}</div>
    ${sub ? `<div style="font-family:system-ui;font-weight:600;font-size:10px;opacity:.72;margin-top:2px">${sub}</div>` : ''}
  </div>`

const mini = txt => `<div style="flex:1;border:2.5px solid ${INK};border-radius:10px;background:#fff;padding:7px 2px;text-align:center;${OSW};font-size:10px">${txt}</div>`

// ── 🔴 A HOME DE HOJE, com os problemas apontados ───────────────────────────
const marca = n => `<span style="display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;border-radius:999px;
  background:${RED};color:#fff;${OSW};font-size:11px;vertical-align:middle;margin-right:5px">${n}</span>`

const hoje = `
  <div style="border:3px solid ${INK};border-radius:13px;background:${PURPLE};color:#fff;padding:8px 10px;margin-bottom:7px">
    <div style="${OSW};font-size:11px">🪜 Carreira offline em andamento</div>
    <div style="font-family:system-ui;font-size:9px;opacity:.8;margin-bottom:5px">Neymarzetti · Temporada 11</div>
    <div style="border:2px solid ${INK};border-radius:8px;background:#fff;color:${INK};${OSW};font-size:10px;text-align:center;padding:5px;margin-bottom:4px">▶️ Continuar carreira</div>
    <div style="border:2px solid ${INK};border-radius:8px;background:#fff;color:${INK};${OSW};font-size:10px;text-align:center;padding:5px">🗂️ Minhas carreiras · trocar de save</div>
  </div>
  <div style="text-align:center;margin:9px 0 3px">
    <span style="background:${GOLD};border:2.5px solid ${INK};border-radius:999px;padding:3px 11px;${OSW};font-size:9px">⚽ LEILÃO ÀS CEGAS DE LENDAS</span>
    <div style="${OSW};font-size:29px;margin-top:6px;letter-spacing:-.5px">LEILÃO LEGENDS</div>
    <div style="font-family:system-ui;font-weight:600;font-size:10.5px;color:rgba(12,12,12,.65);line-height:1.35;margin-top:5px">
      Dê lance no <b>nome</b>, sem ver o nível. Monte o time no pregão, ganhe o campeonato e colecione os craques no seu álbum.</div>
  </div>
  ${btn('🪜 Nova carreira', PURPLE, '#fff', 'Comece na Várzea e suba até a Série A')}
  ${btn('👥 Jogar com amigos (online)', GREEN, '#fff', 'Crie a sala, mande o código no zap')}
  ${btn('⚡ Só uma partida rápida (vs CPU)', '#fff', INK, '')}
  <div style="display:flex;gap:5px;margin-bottom:7px">${mini('📖<br>ÁLBUM')}${mini('🏆<br>RANKING')}${mini('📘<br>MANUAL')}${mini('💛<br>APOIAR')}</div>
  <div style="border:2.5px solid rgba(12,12,12,.25);border-radius:10px;background:rgba(0,0,0,.05);padding:6px;text-align:center;${OSW};font-size:10px;color:rgba(12,12,12,.4);margin-bottom:4px">🌐 Carreira Online · 4 divisões (em breve)</div>
  <div style="border:2.5px solid rgba(12,12,12,.25);border-radius:10px;background:rgba(0,0,0,.05);padding:6px;text-align:center;${OSW};font-size:10px;color:rgba(12,12,12,.4);margin-bottom:9px">🏆 Liga Fechada · só com amigos (em breve)</div>
  <div style="position:relative;border:2px dashed ${RED};border-radius:12px;padding:7px;margin-bottom:8px">
    <div style="position:absolute;top:-9px;left:8px;background:${RED};color:#fff;${OSW};font-size:9px;padding:1px 7px;border-radius:5px">${'11 BOTÕES ANTES DE EXPLICAR O JOGO'}</div>
    <div style="display:flex;gap:6px;margin-top:4px">
      <div style="flex:1;height:118px;border:2.5px solid ${INK};border-radius:10px;background:linear-gradient(160deg,#FFD34D,#F0A500);display:flex;align-items:flex-end;padding:6px"><span style="${OSW};font-size:10px">Pelé</span></div>
      <div style="flex:1;height:118px;border:2.5px solid ${INK};border-radius:10px;background:linear-gradient(160deg,#E9E9E9,#B9B9B9);display:flex;align-items:flex-end;padding:6px"><span style="${OSW};font-size:10px">Gabigol</span></div>
    </div>
    <div style="font-family:system-ui;font-weight:700;font-size:9.5px;color:${RED};margin-top:6px;line-height:1.3">
      ${marca(2)}As cartas comem uma TELA INTEIRA aqui — no lugar exato onde deveria estar "como se joga".</div>
  </div>
  <div style="display:flex;gap:5px;margin-bottom:6px">
    <div style="flex:1;border:2.5px solid ${INK};border-radius:10px;background:#fff;padding:6px"><div style="${OSW};font-size:9.5px">🔨 O PREGÃO</div></div>
    <div style="flex:1;border:2.5px solid ${INK};border-radius:10px;background:#fff;padding:6px"><div style="${OSW};font-size:9.5px">🎭 NÍVEIS OCULTOS</div></div>
  </div>
  <div style="display:flex;gap:5px;margin-bottom:6px">
    <div style="flex:1;border:2.5px solid ${INK};border-radius:10px;background:#fff;padding:6px"><div style="${OSW};font-size:9.5px">🪜 PIRÂMIDE</div></div>
    <div style="flex:1;border:2.5px solid ${INK};border-radius:10px;background:#fff;padding:6px"><div style="${OSW};font-size:9.5px">💎 VALE O AUGE</div></div>
  </div>
  <div style="font-family:system-ui;font-weight:700;font-size:9.5px;color:${RED};margin-bottom:9px;line-height:1.3">
    ${marca(3)}Isto é um <b>glossário</b>, não um passo a passo. Não diz a ORDEM em que as coisas acontecem.</div>
  <div style="border:3px solid ${INK};border-radius:12px;background:#F1E7FB;padding:8px;margin-bottom:5px">
    <div style="${OSW};font-size:10px">📣 O que mudou por aqui</div>
    <div style="font-family:system-ui;font-size:8px;color:rgba(12,12,12,.55);line-height:1.45;margin-top:3px">
      🌎 Libertadores — No Rápido…<br>🏅 Ranking agora é por pontos…<br>🌍 Copa do Mundo com 24 seleções…<br>🏠 Home nova…<br>🆓 Carreira sem cadastro…<br>
      <b>NO BARALHO</b> · Nelinho: craque→lenda · Ashley Cole… <br><b>RECÉM-CHEGADOS</b> · Marcelo Lomba, Lucas Arcanjo, Milagres…</div>
  </div>
  <div style="font-family:system-ui;font-weight:700;font-size:9.5px;color:${RED};line-height:1.3">
    ${marca(4)}O <b>maior bloco da página</b> — e o único que não interessa a quem chegou agora.</div>`

// ── 🟢 A PROPOSTA ───────────────────────────────────────────────────────────
const passo = (n, emoji, titulo, texto, cor) => `
  <div style="display:flex;gap:9px;align-items:flex-start;border:3px solid ${INK};border-radius:13px;background:#fff;
    box-shadow:3px 3px 0 ${INK};padding:9px 10px;margin-bottom:6px">
    <div style="flex:0 0 34px;height:34px;border:2.5px solid ${INK};border-radius:10px;background:${cor};color:#fff;
      display:flex;align-items:center;justify-content:center;${OSW};font-size:17px">${emoji}</div>
    <div style="min-width:0">
      <div style="${OSW};font-size:12.5px;text-transform:uppercase;line-height:1.05">
        <span style="color:rgba(12,12,12,.32)">${n}.</span> ${titulo}</div>
      <div style="font-family:system-ui;font-weight:600;font-size:10px;color:rgba(12,12,12,.7);line-height:1.38;margin-top:2px">${texto}</div>
    </div>
  </div>`

const proposta = `
  <div style="text-align:center;margin-bottom:10px">
    <span style="background:${GOLD};border:2.5px solid ${INK};border-radius:999px;padding:3px 11px;${OSW};font-size:9px">⚽ LEILÃO ÀS CEGAS DE LENDAS</span>
    <div style="${OSW};font-size:31px;margin-top:6px;letter-spacing:-.5px">LEILÃO LEGENDS</div>
    <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.72);line-height:1.4;margin-top:6px;padding:0 6px">
      Você dá lance <b>no nome</b> do jogador — <b>sem ver o nível dele</b>. Monta um time às cegas e coloca pra jogar.</div>
  </div>

  <div style="border:3px solid ${INK};border-radius:14px;background:#FFF6D6;box-shadow:3px 3px 0 ${INK};padding:9px 10px 4px;margin-bottom:9px">
    <div style="${OSW};font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:7px;text-align:center">▶️ Como funciona uma partida</div>
    ${passo(1, '🪙', 'Você tem 100 moedas', 'O baralho vem por posição: goleiro, lateral, zaga, meio e ataque. Você <b>só vê o nome</b>.', GOLD)}
    ${passo(2, '✉️', 'Lance secreto', 'Escreve quanto vale cada nome e <b>lacra o envelope</b>. Ninguém vê o lance de ninguém.', PURPLE)}
    ${passo(3, '🔨', 'O martelo revela', 'Quem pagou mais leva. <b>Só aí</b> aparece se era craque ou perna-de-pau — e todo mundo vê junto.', RED)}
    ${passo(4, '👕', 'Fecha os 11', 'Faltou posição? O <b>Monte</b> tem as sobras: na sua vez você pega de graça.', GREEN)}
    ${passo(5, '⚽', 'O campeonato roda', '38 rodadas em <b>3 minutos</b>, com o placar subindo ao vivo. Campeão leva <b>uma carta</b> pro álbum.', '#1B2A5B')}
  </div>

  <div style="border:3px solid ${INK};border-radius:13px;background:${GREEN};color:#fff;box-shadow:4px 4px 0 ${INK};padding:15px 11px;text-align:center;margin-bottom:6px">
    <div style="${OSW};font-size:19px;text-transform:uppercase;line-height:1">▶️ Jogar agora</div>
    <div style="font-family:system-ui;font-weight:600;font-size:10px;opacity:.85;margin-top:3px">Uma partida contra a CPU · uns 6 minutos · não precisa de conta</div>
  </div>
  <div style="display:flex;gap:6px;margin-bottom:9px">
    <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:8px 4px;text-align:center;${OSW};font-size:10.5px">👥 COM AMIGOS</div>
    <div style="flex:1;border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:8px 4px;text-align:center;${OSW};font-size:10.5px">🪜 CARREIRA</div>
  </div>

  <div style="border:3px solid ${INK};border-radius:12px;background:${PURPLE};color:#fff;padding:8px 10px;margin-bottom:9px">
    <div style="${OSW};font-size:11px">🪜 Sua carreira · Neymarzetti · T11</div>
    <div style="border:2px solid ${INK};border-radius:8px;background:#fff;color:${INK};${OSW};font-size:10.5px;text-align:center;padding:6px;margin-top:5px">▶️ Continuar de onde parei</div>
  </div>

  <div style="display:flex;gap:5px;margin-bottom:9px">${mini('📖<br>ÁLBUM')}${mini('🏆<br>RANKING')}${mini('📘<br>MANUAL')}${mini('💛<br>APOIAR')}</div>

  <div style="border:2.5px solid rgba(12,12,12,.2);border-radius:11px;background:rgba(0,0,0,.04);padding:7px 9px;margin-bottom:9px">
    <div style="font-family:system-ui;font-weight:700;font-size:9.5px;color:rgba(12,12,12,.5);line-height:1.4">
      🔜 <b>Em breve:</b> Carreira Online · Liga Fechada — <i>os dois "em breve" viram UMA linha</i></div>
  </div>

  <div style="border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:8px 10px;margin-bottom:9px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="${OSW};font-size:10.5px">📣 O que mudou por aqui <span style="color:rgba(12,12,12,.4)">· 5 novidades</span></div>
      <div style="${OSW};font-size:12px;color:rgba(12,12,12,.4)">▾</div>
    </div>
    <div style="font-family:system-ui;font-weight:600;font-size:9px;color:rgba(12,12,12,.5);margin-top:3px">fechado por padrão — abre em quem quiser ver</div>
  </div>

  <div style="display:flex;gap:6px">
    <div style="flex:1;height:86px;border:2.5px solid ${INK};border-radius:10px;background:linear-gradient(160deg,#FFD34D,#F0A500);display:flex;align-items:flex-end;padding:5px"><span style="${OSW};font-size:9px">Pelé</span></div>
    <div style="flex:1;height:86px;border:2.5px solid ${INK};border-radius:10px;background:linear-gradient(160deg,#E9E9E9,#B9B9B9);display:flex;align-items:flex-end;padding:5px"><span style="${OSW};font-size:9px">Gabigol</span></div>
    <div style="flex:1;height:86px;border:2.5px solid ${INK};border-radius:10px;background:linear-gradient(160deg,#C9A9FF,#8B5CF6);display:flex;align-items:flex-end;padding:5px"><span style="${OSW};font-size:9px">Rayan</span></div>
  </div>
  <div style="font-family:system-ui;font-weight:700;font-size:9.5px;color:${GREEN};margin-top:6px;line-height:1.3">
    ✅ As cartas viram uma <b>tirinha no rodapé</b>: continuam bonitas, mas não roubam mais o lugar da explicação.</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}body{margin:0;background:#EDE3C9;color:${INK};font-family:system-ui,-apple-system,sans-serif;padding:32px 30px}</style></head><body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🏠 MOCKUP · HOME</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:44px;margin:14px 0 6px;line-height:1">
    O JOGO PRECISA SE <span style="color:${RED}">EXPLICAR</span> ANTES DE PEDIR ESCOLHA</h1>
  <p style="font-size:15px;font-weight:600;max-width:1000px;line-height:1.5;margin:0 0 26px">
    Hoje a pessoa passa por <b>11 botões</b> antes de qualquer explicação, e o que explica é um <b>glossário</b> —
    não diz a ordem em que as coisas acontecem. A proposta troca a ordem: <b>o que é</b> → <b>como se joga</b> →
    <b>por onde começo</b>. Nada é apagado; o que não serve pra quem chegou agora só <b>desce</b>.</p>

  <div style="display:flex;gap:46px;align-items:flex-start">
    ${fone(hoje, '🔴 Como está hoje', RED)}
    ${fone(proposta, '🟢 A proposta', GREEN)}
    <div style="flex:1;min-width:300px;max-width:460px">
      <div style="border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:4px 4px 0 ${INK};padding:15px 17px;margin-bottom:16px">
        <div style="${OSW};font-size:17px;text-transform:uppercase;margin-bottom:10px">O que muda de verdade</div>
        ${[['A explicação sobe', 'Os 5 passos vêm ANTES dos botões. Quem chegou agora entende o jogo sem clicar em nada.'],
           ['Um botão principal, só um', '"Jogar agora" — a partida rápida, sem conta, que é o caminho mais curto pra entender. Amigos e Carreira ficam menores do lado.'],
           ['A dúvida que o Diego apontou vira passo', 'As moedas, o lance secreto, o martelo, fechar os 11 e o campeonato rodando: cada uma virou um passo numerado, na ordem real.'],
           ['As cartas descem', 'Viram uma tirinha no rodapé. Continuam bonitas, mas param de roubar a tela da explicação.'],
           ['As novidades fecham', 'Vira uma linha que abre no toque. Quem volta acha; quem chegou agora não tromba.'],
           ['Os "em breve" viram uma linha', 'Dois botões apagados ocupando espaço nobre viram um aviso pequeno.']]
          .map(([t, d]) => `<div style="display:flex;gap:9px;align-items:flex-start;margin-bottom:9px">
            <span style="color:${GREEN};${OSW};font-size:15px;line-height:1.1">✓</span>
            <p style="font-size:12.5px;font-weight:600;line-height:1.45;margin:0"><b style="${OSW};text-transform:uppercase;font-size:13px">${t}</b><br>${d}</p></div>`).join('')}
      </div>
      <div style="border:4px solid ${INK};border-radius:18px;background:#FFF6D6;box-shadow:4px 4px 0 ${INK};padding:15px 17px;margin-bottom:16px">
        <div style="${OSW};font-size:15px;text-transform:uppercase;margin-bottom:8px">🤔 A pergunta que sobra</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          A home explicando resolve <b>metade</b>. A outra metade é <b>dentro do jogo</b>: no primeiro pregão da pessoa,
          o jogo precisa dizer o que fazer <b>na hora</b> — e depois avisar que o campeonato vai rodar sozinho.
          Hoje isso existe em pedaços (o "COMO FUNCIONA" do pregão), mas não como um caminho.<br><br>
          <b>Isso é um segundo passo</b>, e eu não faria junto: primeiro a home, você joga, e aí a gente vê se ainda falta.</p>
      </div>
      <div style="border:4px solid ${INK};border-radius:18px;background:#F1EDE0;box-shadow:4px 4px 0 ${INK};padding:15px 17px">
        <div style="${OSW};font-size:15px;text-transform:uppercase;margin-bottom:8px">🛡️ Nada quebra</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          É <b>só a tela de abertura</b>. Nenhum botão some, nenhum modo muda, o motor do jogo não é tocado —
          muda a <b>ordem</b> e o <b>tamanho</b> das coisas. Dá pra voltar atrás num commit só.</p>
      </div>
    </div>
  </div>
  <p style="margin-top:26px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-home-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
