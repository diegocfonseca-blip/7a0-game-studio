// ─── 🏠 MOCKUP: HOME v2 — CALMA, NÃO MENOS ─────────────────────────────────
//
// Segunda rodada. Na primeira eu errei duas coisas e o Diego cortou (20/08):
//   *"não acho legal tirar as cartas e também não acho legal pôr as regras na
//   home de cara... ou então podemos fazer um scroll maior, sei lá, mais clean,
//   com mais espaços... e talvez abas... botões de regras, botão de apoio, mas o
//   apoio também entra o negócio emocional do meu filho"*
//
// ❌ O QUE EU TINHA ERRADO
//   1. Tirei as cartas do alto. Errado: a carta é o MOTIVO de jogar (colecionar).
//      Ela tem que ser a primeira coisa bonita que a pessoa vê.
//   2. Enfiei os 5 passos na cara. Errado: ninguém chega num jogo querendo ler
//      manual. Regra tem que ser uma PORTA, não um texto.
//
// ✅ A IDEIA CERTA: a home tem UM trabalho — fazer apertar jogar. O resto fica a
//    UM TOQUE. E a poluição não se resolve tirando coisa: resolve dando ESPAÇO.
//    Um assunto por "andar", ar entre eles. Scroll maior é barato; tela lotada não.
//
// 🚫 ABAS: não. Aba esconde e ainda obriga a escolher onde clicar antes de saber
//    o que tem dentro. O que ele quer é CALMA — e calma vem de espaço, não de aba.
//
// ⚠️ O BLOCO DO APOIO está com o texto MARCADO como pendente de propósito: ele
//    citou "o negócio emocional do meu filho" e eu NÃO sei essa história. A casa
//    não inventa vida de gente de verdade (regra do Diego, 18/08).
//
//   node scripts/mockup-home-v2.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'home-v2.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CREME = '#F4ECD6'

// ── telefone ────────────────────────────────────────────────────────────────
const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 380px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  ${nota ? `<div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px">${nota}</div>` : '<div style="height:9px"></div>'}
  <div style="width:380px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};
    overflow:hidden">${inner}</div>
</div>`

// ── peças ───────────────────────────────────────────────────────────────────
const carta = (nome, clube, g1, g2, tier) => `
  <div style="flex:0 0 108px;height:150px;border:3px solid ${INK};border-radius:12px;
    background:linear-gradient(160deg,${g1},${g2});box-shadow:3px 3px 0 ${INK};
    display:flex;flex-direction:column;justify-content:space-between;padding:7px 8px;position:relative">
    <span style="${OSW};font-size:8px;background:rgba(0,0,0,.55);color:#fff;border-radius:5px;padding:1px 5px;align-self:flex-start">${tier}</span>
    <div><div style="${OSW};font-size:12.5px;line-height:1">${nome}</div>
      <div style="font-family:system-ui;font-weight:600;font-size:8.5px;opacity:.65">${clube}</div></div>
  </div>`

const miniBtn = (ic, txt) => `
  <div style="flex:1;border:3px solid ${INK};border-radius:13px;background:#fff;box-shadow:3px 3px 0 ${INK};
    padding:11px 4px;text-align:center">
    <div style="font-size:17px;line-height:1">${ic}</div>
    <div style="${OSW};font-size:10.5px;margin-top:3px;letter-spacing:.02em">${txt}</div>
  </div>`

const modo = (ic, nome, sub, cor) => `
  <div style="display:flex;align-items:center;gap:11px;border:3px solid ${INK};border-radius:14px;
    background:#fff;box-shadow:3px 3px 0 ${INK};padding:11px 13px">
    <div style="flex:none;width:36px;height:36px;border:2.5px solid ${INK};border-radius:11px;background:${cor};
      display:grid;place-items:center;font-size:17px">${ic}</div>
    <div style="min-width:0;flex:1">
      <div style="${OSW};font-size:14px;text-transform:uppercase;line-height:1.05">${nome}</div>
      <div style="font-family:system-ui;font-weight:600;font-size:10.5px;color:rgba(12,12,12,.6);margin-top:1px">${sub}</div>
    </div>
    <div style="${OSW};font-size:16px;color:rgba(12,12,12,.28)">›</div>
  </div>`

// ── 🟢 A HOME NOVA ──────────────────────────────────────────────────────────
const nova = `
<div style="padding:0 0 18px">

  <!-- ANDAR 1 · quem é o jogo (só isso) -->
  <div style="padding:26px 18px 0;text-align:center">
    <span style="background:${GOLD};border:2.5px solid ${INK};border-radius:999px;padding:3px 12px;
      ${OSW};font-size:9px;letter-spacing:.09em;box-shadow:2px 2px 0 ${INK}">⚽ LEILÃO ÀS CEGAS DE LENDAS</span>
    <div style="${OSW};font-size:33px;margin-top:11px;line-height:.98;letter-spacing:-.5px">LEILÃO<br>LEGENDS</div>
    <div style="font-family:system-ui;font-weight:600;font-size:12px;color:rgba(12,12,12,.66);line-height:1.4;margin-top:9px;padding:0 8px">
      Dê lance <b>no nome</b>, sem ver o nível. Monte o time e colecione as lendas.</div>
  </div>

  <!-- ANDAR 2 · as cartas, DEITADAS (o prêmio, e o que dá vontade) -->
  <div style="margin-top:22px">
    <div style="display:flex;gap:9px;padding:0 18px;overflow:hidden">
      ${carta('Pelé', 'Santos · 1962', '#FFD34D', '#F0A500', '👑 LENDA')}
      ${carta('Gabigol', 'Flamengo · 2019', '#EFEFEF', '#BDBDBD', '⭐ CRAQUE')}
      ${carta('Rayan', 'Vasco · 2025', '#C9A9FF', '#8B5CF6', '💎 PROMESSA')}
      <div style="flex:0 0 40px;height:150px;border:3px dashed rgba(12,12,12,.3);border-radius:12px;
        display:grid;place-items:center;${OSW};font-size:15px;color:rgba(12,12,12,.35)">›</div>
    </div>
    <div style="text-align:center;font-family:system-ui;font-weight:600;font-size:10.5px;color:rgba(12,12,12,.48);margin-top:9px">
      desliza sozinho · 148 craques pra colecionar</div>
  </div>

  <!-- ANDAR 3 · os TRÊS modos — a CARREIRA é a principal (Diego 20/08:
       *"quero fazer as pessoas jogarem mais o carreira"*). Os três continuam ali;
       o que muda é o TAMANHO. Hierarquia é o jeito de empurrar sem esconder. -->
  <div style="padding:26px 18px 0">
    <div style="border:4px solid ${INK};border-radius:16px;background:${PURPLE};color:#fff;
      box-shadow:5px 5px 0 ${INK};padding:17px 14px">
      <div style="${OSW};font-size:22px;text-transform:uppercase;line-height:1.02">🪜 Começar carreira</div>
      <div style="font-family:system-ui;font-weight:600;font-size:11.5px;opacity:.88;line-height:1.35;margin-top:5px">
        Comece na <b>Várzea</b> e suba até a Série A. Cada título vira carta no seu álbum.</div>
      <div style="display:inline-block;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.4);
        border-radius:999px;padding:2px 9px;${OSW};font-size:9.5px;margin-top:9px;letter-spacing:.05em">
        🆓 SEM PRECISAR DE CONTA</div>
    </div>
    <div style="display:flex;gap:9px;margin-top:11px">
      <div style="flex:1;border:3px solid ${INK};border-radius:14px;background:${GREEN};color:#fff;
        box-shadow:3px 3px 0 ${INK};padding:12px 9px;text-align:center">
        <div style="${OSW};font-size:14px;text-transform:uppercase;line-height:1.05">👥 Com<br>amigos</div>
        <div style="font-family:system-ui;font-weight:600;font-size:9.5px;opacity:.85;margin-top:3px">até 20 na sala</div>
      </div>
      <div style="flex:1;border:3px solid ${INK};border-radius:14px;background:#fff;
        box-shadow:3px 3px 0 ${INK};padding:12px 9px;text-align:center">
        <div style="${OSW};font-size:14px;text-transform:uppercase;line-height:1.05">⚡ Partida<br>rápida</div>
        <div style="font-family:system-ui;font-weight:600;font-size:9.5px;color:rgba(12,12,12,.6);margin-top:3px">uns 6 minutos</div>
      </div>
    </div>
  </div>

  <!-- ANDAR 4 · as portas (regra é PORTA, não texto) -->
  <div style="padding:26px 18px 0">
    <div style="display:flex;gap:9px">
      ${miniBtn('📘', 'COMO SE JOGA')}
      ${miniBtn('📖', 'ÁLBUM')}
      ${miniBtn('🏆', 'RANKING')}
    </div>
  </div>

  <!-- ANDAR 5 · continuar (só pra quem já tem — fica colado na carreira) -->
  <div style="padding:22px 18px 0">
    <div style="border:3px solid ${INK};border-radius:14px;background:${PURPLE};color:#fff;
      box-shadow:3px 3px 0 ${INK};padding:12px 13px">
      <div style="${OSW};font-size:11px;letter-spacing:.05em;opacity:.85">SUA CARREIRA · TEMPORADA 11</div>
      <div style="${OSW};font-size:17px;margin-top:1px">Neymarzetti</div>
      <div style="border:2.5px solid ${INK};border-radius:10px;background:#fff;color:${INK};
        ${OSW};font-size:12.5px;text-align:center;padding:8px;margin-top:9px">▶️ Continuar de onde parei</div>
    </div>
    <div style="font-family:system-ui;font-weight:600;font-size:10px;color:rgba(12,12,12,.42);text-align:center;margin-top:7px">
      só aparece pra quem já tem carreira</div>
  </div>

  <!-- ANDAR 6 · novidades, fechadas -->
  <div style="padding:24px 18px 0">
    <div style="border:3px solid ${INK};border-radius:13px;background:#fff;box-shadow:3px 3px 0 ${INK};
      padding:11px 13px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="${OSW};font-size:12.5px">📣 O que mudou por aqui</div>
        <div style="font-family:system-ui;font-weight:600;font-size:10px;color:rgba(12,12,12,.5)">5 novidades novas</div></div>
      <div style="${OSW};font-size:15px;color:rgba(12,12,12,.35)">▾</div>
    </div>
  </div>

  <!-- ANDAR 7 · o apoio, com o espaço que merece -->
  <div style="padding:30px 18px 0">
    <div style="border:4px solid ${INK};border-radius:18px;background:#FFF6D6;box-shadow:4px 4px 0 ${INK};padding:17px 16px">
      <div style="${OSW};font-size:16px;text-transform:uppercase;line-height:1.05">💛 Quem faz esse jogo</div>
      <div style="border:2.5px dashed ${RED};border-radius:11px;background:rgba(194,69,47,.07);padding:10px 11px;margin-top:10px">
        <div style="${OSW};font-size:10px;color:${RED};letter-spacing:.06em">⚠️ TEXTO PENDENTE — O DIEGO PRECISA ME CONTAR</div>
        <div style="font-family:system-ui;font-weight:600;font-size:11px;color:rgba(12,12,12,.62);line-height:1.4;margin-top:4px">
          Aqui entra a sua história e a do seu filho. <b>Eu não invento isso.</b> Você me conta em duas linhas
          e eu escrevo — ou você mesmo escreve e eu só encaixo.</div>
      </div>
      <div style="border:3px solid ${INK};border-radius:12px;background:${GOLD};box-shadow:3px 3px 0 ${INK};
        ${OSW};font-size:14px;text-align:center;padding:11px;margin-top:11px">💛 APOIAR O PROJETO (PIX)</div>
      <div style="font-family:system-ui;font-weight:600;font-size:10.5px;color:rgba(12,12,12,.55);text-align:center;margin-top:8px;line-height:1.4">
        O jogo é de graça e vai continuar. Quem apoia<br>ganha cor de tier, clube batizado e mimos.</div>
    </div>
  </div>

  <!-- rodapé -->
  <div style="padding:22px 18px 0;text-align:center">
    <div style="font-family:system-ui;font-weight:600;font-size:10.5px;color:rgba(12,12,12,.45);line-height:1.5">
      📤 Compartilhar com os amigos · 📲 @leilaolegendscom</div>
  </div>
</div>`

// ── comparação: quantas coisas por tela ─────────────────────────────────────
const conta = (rot, n, cor, txt) => `
  <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:13px">
    <div style="flex:none;width:52px;text-align:center">
      <div style="${OSW};font-size:27px;color:${cor};line-height:1">${n}</div>
      <div style="font-family:system-ui;font-weight:700;font-size:8.5px;color:rgba(12,12,12,.45);text-transform:uppercase">${rot}</div>
    </div>
    <p style="font-size:12.5px;font-weight:600;line-height:1.45;margin:0">${txt}</p>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}body{margin:0;background:#EDE3C9;color:${INK};font-family:system-ui,-apple-system,sans-serif;padding:32px 30px}</style></head><body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🏠 MOCKUP · HOME v2</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:44px;margin:14px 0 6px;line-height:1">
    CALMA — NÃO <span style="color:${RED}">MENOS COISA</span></h1>
  <p style="font-size:15px;font-weight:600;max-width:960px;line-height:1.5;margin:0 0 26px">
    A poluição não se resolve tirando coisa: resolve dando <b>espaço</b>. Um assunto por andar, ar entre eles.
    O scroll fica maior — e tudo bem, <b>scroll é barato, tela lotada não</b>. As cartas ficam (são o motivo de
    jogar) e a regra vira <b>uma porta</b>, não um texto na cara.</p>

  <div style="display:flex;gap:46px;align-items:flex-start">
    ${fone(nova, '🟢 A home v2', GREEN, 'sete andares, um assunto cada · role pra ver tudo')}
    <div style="flex:1;min-width:320px;max-width:520px">

      <div style="border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px">
        <div style="${OSW};font-size:17px;text-transform:uppercase;margin-bottom:12px">O que eu tinha errado</div>
        ${[['Tirei as cartas do alto', 'Você cortou e tem razão: a carta é o <b>motivo de jogar</b>. Voltaram — mas <b>deitadas</b>, deslizando sozinhas, ocupando 1/3 da altura em vez de uma tela inteira.'],
           ['Enfiei as regras na cara', 'Ninguém chega num jogo querendo ler manual. A regra virou <b>um botão</b> — 📘 Como se joga — do lado do Álbum e do Ranking. Quem quer, abre.'],
           ['Deixei um botão só', 'Você cortou de novo: quer os <b>três modos</b> visíveis e a galera na <b>Carreira</b>. Agora os três estão lá — a Carreira grande, Amigos e Rápida menores do lado dela.']]
          .map(([t, d]) => `<div style="display:flex;gap:9px;align-items:flex-start;margin-bottom:11px">
            <span style="color:${RED};${OSW};font-size:15px;line-height:1.1">✕</span>
            <p style="font-size:12.5px;font-weight:600;line-height:1.45;margin:0"><b style="${OSW};text-transform:uppercase;font-size:13px">${t}</b><br>${d}</p></div>`).join('')}
      </div>

      <div style="border:4px solid ${INK};border-radius:18px;background:#F6FBF7;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px">
        <div style="${OSW};font-size:17px;text-transform:uppercase;margin-bottom:12px">Como o "clean" acontece</div>
        ${conta('hoje', '11', RED, '<b>botões na primeira tela</b>, todos do mesmo peso. Sem hierarquia, a pessoa não sabe por onde começar — e escolhe qualquer um.')}
        ${conta('v2', '3', GREEN, '<b>modos, com tamanhos diferentes</b>: a <b>Carreira</b> grande (é onde você quer a galera), Amigos e Rápida menores do lado. Os três continuam ali — muda o peso, não a existência.')}
        <p style="font-size:12.5px;font-weight:600;line-height:1.45;margin:14px 0 0;padding-top:12px;border-top:2px solid rgba(12,12,12,.12)">
          <b>Cada andar tem um assunto só</b> e respiro entre eles. É isso que faz parecer limpo — não ter menos coisa,
          e sim <b>nunca ter duas coisas disputando o mesmo olhar</b>.</p>
      </div>

      <div style="border:4px solid ${INK};border-radius:18px;background:#EFE4FB;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px">
        <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:8px">🪜 Por que a Carreira grande está certa</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          Você quer a galera na Carreira — e os números te dão razão: são <b>118.219 temporadas</b> jogadas,
          média na <b>26ª</b>, e 349 carreiras passaram das 100. É o modo onde a pessoa <b>fica</b>.<br><br>
          E tem o lado comercial: é na Carreira que o <b>patrocinador aparece toda temporada</b>. Empurrar ela
          é empurrar retenção <b>e</b> receita ao mesmo tempo.<br><br>
          <b>O jeito de empurrar é o TAMANHO, não esconder os outros.</b> Amigos e Rápida continuam na mesma
          tela, do lado, só menores.</p>
      </div>

      <div style="border:4px solid ${INK};border-radius:18px;background:#FFF6D6;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px">
        <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:8px">🚫 Abas: eu não faria</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          Aba <b>esconde</b> e ainda obriga a pessoa a escolher onde clicar <b>antes</b> de saber o que tem dentro —
          é mais uma decisão, não menos. O que você quer é <b>calma</b>, e calma vem de espaço.<br><br>
          Se depois de rolar você achar a home comprida demais, o remédio certo é <b>cortar andar</b>, não empilhar
          aba em cima.</p>
      </div>

      <div style="border:4px solid ${INK};border-radius:18px;background:#FDF0EE;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px">
        <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:8px;color:${RED}">⚠️ O bloco do apoio está em branco</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          Você falou do <b>"negócio emocional do meu filho"</b> no apoio. <b>Eu não sei essa história</b> e não vou
          inventar — inventar a vida de alguém de verdade é pior que não ter nada escrito.<br><br>
          Me conta em duas linhas o que você quer que apareça ali, ou escreve do seu jeito que eu só encaixo.
          <b>E o "sobre" eu deixei de fora</b>, como você decidiu no fim.</p>
      </div>

      <div style="border:4px solid ${INK};border-radius:18px;background:#F1EDE0;box-shadow:4px 4px 0 ${INK};padding:16px 18px">
        <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:8px">🛡️ Nada quebra</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          É só a tela de abertura. <b>Nenhum botão some</b> — Carreira, Online, Álbum, Ranking, Manual e Apoiar
          continuam todos lá, em outro lugar e outro tamanho. O motor do jogo não é tocado. Volta atrás num commit.</p>
      </div>
    </div>
  </div>
  <p style="margin-top:26px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-home2-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
