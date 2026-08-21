// ─── 🔨 MOCKUP: O PREGÃO (opção 4) ──────────────────────────────────────────
//
// 🔎 MEDIDO NO CÓDIGO (screens.tsx · EscAuction), numa rodada de pregão da
// CARREIRA. Antes da primeira carta aparecer, entram na tela:
//   1. a fala do narrador (NarradorDica "envelope");
//   2. o cabeçalho: 🔨 GOLEIROS + "Lance cego: distribua suas moedas em
//      segredo" + o chip "📦 Leva 1 de 3" + o relógio;
//   3. o quadro dourado 🏆 GANHA QUEM DÁ O MAIOR LANCE;
//   4. o quadro verde "Você tem N vagas…";
//   5. o quadro roxo 🎁 JOGADOR SURPRESA (quando tem);
//   6. o quadro 🔒 "o número esmaecido é o piso — não é lance".
//
// ⏱️ E AQUI ESTÁ O QUE MUDA TUDO: o pregão tem RELÓGIO (42s). Em qualquer outra
// tela uma parede de texto é chata; aqui ela COME O TEMPO da pessoa. É o único
// lugar do jogo onde a explicação cobra pedágio.
//
// 📌 E os quadros 3, 4 e 6 aparecem em TODO setor, de TODA temporada, pra
// sempre. Só a dica dourada some depois da 1ª vez (localStorage
// 'esc-tip-lance-v1'). Quem está na T11 já leu "ganha quem dá o maior lance"
// centenas de vezes — com o relógio correndo.
//
// 📌 E o quadro do PISO é redundante: a carta JÁ mostra "mín 🔒 7" em cima da
// caixa do lance (o rótulo existe no código, linha ~3095). O parágrafo explica
// uma coisa que já está etiquetada.
//
// 💡 A PROPOSTA: ensinar UMA VEZ, e o que a pessoa precisa AGORA vira barra fixa.
//   · 🏆 e 🔒 saem da frente e viram o chip "❓" (abre sem parar o relógio);
//   · as VAGAS sobem pra barra do pregão, junto das moedas — sempre na tela;
//   · o 🎁 surpresa vira selo na própria carta;
//   · e o ensino INTEIRO volta no 1º pregão de CADA CARREIRA NOVA (hoje é só
//     uma vez na vida do aparelho — quem começa a 2ª carreira já não vê nada).
//
//   node scripts/mockup-pregao.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'pregao.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:64px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const quadro = (bg, inner, mb = 9) =>
  `<div style="border:3px solid ${INK};border-radius:14px;background:${bg};box-shadow:3px 3px 0 ${INK};margin:0 0 ${mb}px;overflow:hidden">${inner}</div>`

// barra do pregão (setores + moedas). `vagas` = o que eu proponho acrescentar.
const barra = (vagas, ajuda) => `
  <div style="background:${CREME};border-bottom:3px solid ${INK};padding:9px 11px;display:flex;align-items:center;justify-content:space-between;gap:6px">
    <div style="display:flex;gap:4px">
      ${['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].map((p, i) => `
        <span style="border:2px solid ${INK};border-radius:999px;padding:1px 7px;${OSW};font-size:9.5px;background:${i === 0 ? GOLD : '#fff'}">${p}</span>`).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:5px">
      ${vagas ? `<span style="border:2px solid ${INK};border-radius:999px;padding:1px 8px;${OSW};font-size:9.5px;background:#E7F7EC;color:#146c33;white-space:nowrap">2 vagas</span>` : ''}
      ${ajuda ? `<span style="border:2px solid ${INK};border-radius:999px;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;${OSW};font-size:10px;background:#fff">❓</span>` : ''}
      <span style="${OSW};font-size:13px;white-space:nowrap">💰 100</span>
    </div>
  </div>`

const cabecalho = (curto) => `
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px">
    <div style="flex:1;min-width:0">
      <div style="${OSW};font-size:25px;line-height:1">🔨 GOLEIROS</div>
      <div style="font-family:system-ui;font-size:11px;font-weight:600;color:rgba(0,0,0,.7);margin-top:2px;line-height:1.35">
        ${curto ? 'Lance cego — ninguém vê nada até a revelação.' : 'Lance cego: distribua suas moedas em segredo. Ninguém vê nada até a revelação.'}
      </div>
      <div style="display:inline-flex;align-items:center;gap:5px;border:3px solid ${INK};border-radius:999px;padding:2px 9px;margin-top:6px;background:#2E6FB0;box-shadow:2px 2px 0 ${INK}">
        <span style="font-size:11px">📦</span>
        <span style="${OSW};font-size:9.5px;color:#fff;text-transform:uppercase;letter-spacing:.03em">Leva 1 de 3 · ainda vêm mais 2</span>
      </div>
    </div>
    <div style="border:3px solid ${INK};border-radius:12px;background:#2E6FB0;box-shadow:3px 3px 0 ${INK};padding:5px 10px;text-align:center;flex-shrink:0">
      <div style="${OSW};font-size:8px;text-transform:uppercase;color:#fff">Tempo</div>
      <div style="${OSW};font-size:20px;line-height:1;color:#fff">42s</div>
    </div>
  </div>`

// carta de jogador (com o rótulo "mín 🔒 7" que JÁ existe hoje)
const carta = (nome, clube, ano, piso, selo) => `
  <div style="border:3px solid ${INK};border-radius:14px;background:#fff;box-shadow:3px 3px 0 ${INK};padding:9px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
    <div style="min-width:0">
      ${selo ? `<span style="display:inline-block;border:2px solid ${INK};border-radius:999px;padding:1px 6px;${OSW};font-size:8.5px;background:${PURPLE};color:#fff;margin-bottom:3px">🎁 SURPRESA</span><br>` : ''}
      <span style="display:inline-block;border:2px solid ${INK};border-radius:6px;padding:0 5px;${OSW};font-size:9px;background:#EDE6D4">GOL</span>
      <div style="${OSW};font-size:15px;margin-top:2px;line-height:1.1">${nome}</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5)">${clube} · ${ano}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0">
      <span style="${OSW};font-size:8.5px;text-transform:uppercase;letter-spacing:.04em;color:#B8860B;margin-bottom:2px">mín 🔒 ${piso}</span>
      <div style="display:flex;align-items:center;gap:5px">
        <span style="border:2px solid ${INK};border-radius:8px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;${OSW};font-size:14px;background:#fff">−</span>
        <span style="border:2px solid ${INK};border-radius:8px;width:44px;height:26px;display:flex;align-items:center;justify-content:center;${OSW};font-size:14px;background:#fff;color:rgba(0,0,0,.35)">${piso}</span>
        <span style="border:2px solid ${INK};border-radius:8px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;${OSW};font-size:14px;background:${GOLD}">+</span>
      </div>
    </div>
  </div>`

// ── ① COMO ESTÁ HOJE ───────────────────────────────────────────────────────
const HOJE = `${barra(false, false)}
  <div style="padding:11px">
    ${quadro('#1B2A5B', `<div style="padding:9px 11px;color:#fff;font-family:system-ui;font-size:10.5px;font-weight:700;line-height:1.4">
      🎙️ ✉️ Escreve teu lance ESCONDIDO — ninguém vê o de ninguém! Quem der mais, leva no martelo. E se segura: são 5 posições pra encher o time. 💰</div>`)}
    ${cabecalho(false)}
    ${quadro('linear-gradient(180deg,#FFE07A,' + GOLD + ')', `<div style="padding:8px 11px;text-align:center">
      <div style="${OSW};font-size:16px;line-height:1.1">🏆 GANHA QUEM DÁ O MAIOR LANCE</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.7);margin-top:2px">Não é 1 moeda que leva — é quem <b>paga mais</b>. Empate? Re-lance às cegas.</div>
    </div>`)}
    ${quadro('#E7F7EC', `<div style="padding:7px 11px;text-align:center;${OSW};font-size:12px;color:#146c33">
      Você tem <b>2 vagas</b> — pode dar lance em até 2 jogadores DE UMA VEZ nesta rodada, não só em um! 👈</div>`)}
    ${quadro('#FFF3D6', `<div style="padding:7px 11px;text-align:center;font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.75);line-height:1.4">
      🔒 O número esmaecido é o <b>piso</b> do jogador — <b>não é lance</b>. Só vira lance quando você aperta <b>+</b> (aí fica preto). Abaixo do piso fica vermelho e é anulado.</div>`)}
    ${carta('Marcelo Lomba', 'Bahia', 2012, 7, false)}
    ${carta('Doni', 'Roma', 2008, 11, false)}
  </div>`

// ── ② PROPOSTA ─────────────────────────────────────────────────────────────
const PROPOSTA = `${barra(true, true)}
  <div style="padding:11px">
    ${cabecalho(true)}
    ${carta('Marcelo Lomba', 'Bahia', 2012, 7, false)}
    ${carta('Doni', 'Roma', 2008, 11, false)}
    ${carta('Vozinha', 'Casa Pia', 2024, 5, true)}
    <div style="text-align:center;font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.4);padding:4px 6px 0;line-height:1.4">
      Moedas, vagas e tempo estão sempre na barra — não rolam junto com as cartas.
    </div>
  </div>`

// ── ③ O QUE O "❓" ABRE ────────────────────────────────────────────────────
const AJUDA = `${barra(true, true)}
  <div style="padding:11px">
    <div style="border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden">
      <div style="background:${INK};padding:9px 12px;display:flex;align-items:center;justify-content:space-between">
        <span style="${OSW};font-size:14px;color:${GOLD}">❓ REGRAS DO PREGÃO</span>
        <span style="${OSW};font-size:15px;color:#fff">×</span>
      </div>
      <div style="padding:11px 12px">
        ${[['🏆', 'Ganha quem dá o maior lance', 'Não é 1 moeda que leva — é quem paga mais. Empate? Re-lance às cegas.'],
           ['✉️', 'O lance é cego', 'Ninguém vê o seu, você não vê o dos outros. Tudo aparece só na revelação.'],
           ['🎟️', 'Suas vagas', 'Dá pra dar lance em até 2 jogadores DE UMA VEZ nesta leva — não só em um.'],
           ['🔒', 'O piso', 'O número apagado é o mínimo do jogador, não um lance. Vira lance quando você aperta +.'],
           ['🎁', 'Jogador surpresa', 'O nome fica escondido: você só vê posição, clube e ano. Sai no martelo.']]
          .map(([ic, t, s], i, a) => `
          <div style="display:flex;gap:9px;padding:8px 0;${i < a.length - 1 ? `border-bottom:1.5px solid rgba(12,12,12,.10)` : ''}">
            <span style="font-size:16px;flex-shrink:0">${ic}</span>
            <div><div style="${OSW};font-size:11.5px;line-height:1.15">${t}</div>
            <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.55);margin-top:2px;line-height:1.4">${s}</div></div>
          </div>`).join('')}
      </div>
      <div style="background:#E7F7EC;border-top:3px solid ${INK};padding:9px 12px;text-align:center;font-family:system-ui;font-size:9.5px;font-weight:800;color:#146c33">
        ⏱️ O relógio NÃO para enquanto isso está aberto — mas também não some: dá pra fechar e dar lance na hora.
      </div>
    </div>
  </div>`

// ── ④ PRIMEIRO PREGÃO DA CARREIRA (ensino inteiro, preservado) ─────────────
const PRIMEIRO = `${barra(true, true)}
  <div style="padding:11px">
    ${quadro('#1B2A5B', `<div style="padding:9px 11px;color:#fff;font-family:system-ui;font-size:10.5px;font-weight:700;line-height:1.4">
      🎙️ ✉️ Escreve teu lance ESCONDIDO — ninguém vê o de ninguém! Quem der mais, leva no martelo. E se segura: são 5 posições pra encher o time. 💰</div>`)}
    ${quadro('linear-gradient(180deg,#FFE07A,' + GOLD + ')', `<div style="padding:9px 11px;text-align:center">
      <div style="${OSW};font-size:9px;letter-spacing:.09em;color:rgba(0,0,0,.5)">SEU PRIMEIRO PREGÃO DESTA CARREIRA</div>
      <div style="${OSW};font-size:16px;line-height:1.1;margin-top:2px">🏆 GANHA QUEM DÁ O MAIOR LANCE</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.7);margin-top:2px">Não é 1 moeda que leva — é quem <b>paga mais</b>. Empate? Re-lance às cegas. Você tem <b>2 vagas</b> nesta leva.</div>
      <div style="margin-top:7px;border:2.5px solid ${INK};border-radius:9px;background:#fff;padding:5px;${OSW};font-size:10.5px">Entendi, bora dar lance 👊</div>
    </div>`)}
    ${cabecalho(true)}
    ${carta('Marcelo Lomba', 'Bahia', 2012, 7, false)}
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 38px;font-family:system-ui}</style>
<body>
  <div style="${OSW};font-size:31px;text-transform:uppercase">🔨 Opção 4 — o pregão</div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:5px 0 8px;max-width:1120px;line-height:1.5">
    Antes da primeira carta aparecer são <b>4 quadros de regra</b> + a fala do narrador. E aqui isso pesa mais que em
    qualquer outra tela do jogo, porque <b style="color:${RED}">o pregão tem relógio de 42 segundos</b> — cada segundo
    lendo é um segundo sem dar lance. É o único lugar onde a explicação <b>cobra pedágio</b>.
  </div>
  <div style="font-family:system-ui;font-weight:600;font-size:13.5px;color:rgba(12,12,12,.6);margin:0 0 24px;max-width:1120px;line-height:1.5">
    E eles voltam <b>em todo setor, de toda temporada, pra sempre</b>. Só a fala do narrador some depois da 1ª vez.
    Quem está na temporada 11 já leu "ganha quem dá o maior lance" umas duzentas vezes.
  </div>

  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:30px">
    ${fone(HOJE, '① Como está hoje', RED, 'Narrador + cabeçalho + 🏆 + vagas + 🔒 piso. Repara: o quadro do piso explica uma coisa que a carta <b>já mostra</b> ("mín 🔒 7" em cima da caixa). E o relógio está correndo esse tempo todo.')}
    ${fone(PROPOSTA, '② Proposta', GREEN, 'Cabeçalho e cartas, mais nada. As <b>vagas subiram pra barra</b> junto das moedas, o 🎁 surpresa virou selo na carta, e as regras foram pro <b>❓</b> ao lado do dinheiro.')}
    ${fone(AJUDA, '③ O que o ❓ abre', PURPLE, 'Nada se perde: as 5 regras ficam a um toque, escritas melhor do que estão hoje soltas. E o aviso é honesto — o relógio não para.')}
    ${fone(PRIMEIRO, '④ 1º pregão da carreira', '#2E6FB0', 'Quem está começando <b>vê tudo</b>, com um "entendi" pra fechar. E isso volta em <b>toda carreira nova</b> — hoje é só uma vez na vida do aparelho, então quem começa a 2ª carreira já não vê nada.')}
  </div>

  <div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:1;min-width:430px">
      ${bloco('📏 A regra', '#EAF3FF', `
        <b>O que a pessoa precisa AGORA fica fixo na barra</b> (moedas · vagas · tempo) — nunca rola junto com as cartas.<br><br>
        <b>O que ela precisa UMA VEZ</b> (as regras) é ensinado no começo da carreira e depois fica no ❓, a um toque.<br><br>
        <b>O que é sobre uma carta</b> (piso, surpresa) fica <b>na carta</b>, não num parágrafo em cima.`)}
      ${bloco('🔎 O que eu achei conferindo', '#FFF6D6', `
        · O quadro do <b>piso</b> é redundante: a carta já mostra <b>"mín 🔒 7"</b> em cima da caixa do lance.<br>
        · A fala do narrador e a dica dourada <b>já somem</b> depois da 1ª vez (ficam gravadas no aparelho) — o resto não.<br>
        · Como a marca é do <b>aparelho</b> e não da carreira, quem começa a <b>2ª carreira</b> não recebe ensino nenhum.
        Isso eu consertaria junto: o ensino volta a cada carreira nova.`)}
    </div>
    <div style="flex:1;min-width:430px">
      ${bloco('⚠️ O risco — e eu quero falar dele', '#FBE7E3', `
        Você mesmo disse que <b>"as pessoas começam e não entendem o que fazer no leilão"</b>. Então tirar explicação
        daqui é mexer <b>exatamente na ferida</b>.<br><br>
        A diferença é <b>quando</b> ensinar: no começo da carreira e a um toque de distância, em vez de toda rodada
        pra sempre. Se você achar arriscado, dá pra fazer <b>em passos</b>: primeiro só tirar o quadro do piso (que é
        redundante) e subir as vagas pra barra. Só isso já limpa metade da tela, sem tirar nenhuma regra do caminho.`)}
      ${bloco('🛡️ O que NÃO muda / dá pra voltar', '#F1EDE0', `
        <b>Nenhuma regra do leilão muda.</b> Mesmo tempo (42s), mesmo lance cego, mesmo empate com re-lance, mesmo
        piso, mesmo monte final. O motor não é tocado — é arrumação de tela.<br><br>
        <b>Nada de ritmo:</b> nenhum passo novo, nenhuma espera, nenhum clique a mais pra dar lance.<br><br>
        Commit isolado, revertível — e dá pra ligar <b>só na sua conta</b> primeiro.`)}
    </div>
  </div>

  <p style="margin-top:16px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-pregao-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
