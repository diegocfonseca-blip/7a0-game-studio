// ─── 🃏➡️📰 O FLUXO: A CARTA DO CAMPEÃO E DEPOIS O JORNAL (mockup) ───────────
// Pedido do Diego (27/08): *"sobre a carta do campeão não tem graça aparecer
// automático sem o cara ver… quem for campeão já aparece de cara a carta pra ele
// apertar, sem ter como ele correr, um banner só pra isso, rápido. Se ele apertar
// fora do banner tudo bem, aí conta automático. E logo quando ele pegar já aparece
// o jornal pra ele. E pros outros já aparece de cara"*.
//
// ✅ POR QUE ISSO É SEGURO (conferido em `screens.tsx`): a carta é sorteada e
//    GRAVADA na conta no efeito de `status === 'picking'` (linha ~6465), antes de
//    qualquer toque, com `resilientWrite` (re-tenta se a rede cair). Então tocar,
//    tocar fora ou fechar o app dá no MESMO resultado: a carta é do campeão.
//    O banner é só a CERIMÔNIA de ver qual foi — que é justamente o que o Diego
//    quer que não passe batido.
//
// ⚠️ A REGRA QUE SAI DISSO: o jornal entra DEPOIS da tela do campeão, nunca no
//    lugar dela — é ao montar aquela tela que a gravação dispara.
//
// 📌 Hoje o pacote abre SOZINHO quando o cronômetro de 45 s zera
//    (`CARD_PICK_SECONDS`, screens.tsx:6346). É exatamente o "aparecer automático
//    sem o cara ver" que ele reclamou.
//
//   node scripts/mockup-fluxo-carta-jornal.mjs [--saida fluxo-carta.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'fluxo-carta.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A', PURPLE = '#7C3AED'
const SERIF = "font-family:Georgia,'Times New Roman',serif"
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// "telinha" de celular pra cada passo do fluxo
const tela = (conteudo, bg = CREME) => `
  <div style="width:268px;height:530px;flex:none;background:${bg};border:5px solid ${INK};border-radius:24px;
    box-shadow:6px 6px 0 ${INK};overflow:hidden;position:relative;display:flex;flex-direction:column">${conteudo}</div>`

const passo = (n, titulo, sub, corpo) => `
  <div style="flex:none;width:268px">
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">
      <span style="${OSW};font-size:19px;background:${INK};color:${GOLD};border-radius:50%;width:34px;height:34px;
        display:inline-flex;align-items:center;justify-content:center;flex:none">${n}</span>
      <p style="${OSW};font-size:19px;text-transform:uppercase;line-height:1.1">${titulo}</p>
    </div>
    ${corpo}
    <p style="${SERIF};font-size:16px;line-height:1.4;color:rgba(0,0,0,.68);margin-top:11px">${sub}</p>
  </div>`

const seta = `<div style="flex:none;display:flex;align-items:center;${OSW};font-size:34px;color:rgba(0,0,0,.28);padding-top:158px">➜</div>`

// ── passo 1: o banner da carta, esperando o toque ──
const bannerCarta = tela(`
  <div style="position:absolute;inset:0;background:rgba(12,12,12,.82)"></div>
  <div style="position:relative;margin:auto;padding:0 20px;text-align:center;width:100%">
    <p style="${OSW};font-size:15px;color:${GOLD};letter-spacing:.12em">🏆 VOCÊ É O CAMPEÃO</p>
    <p style="${OSW};font-size:26px;color:#fff;line-height:1.1;margin:6px 0 16px">A SUA CARTA<br>CHEGOU</p>
    <div style="margin:0 auto;width:150px;height:206px;border-radius:14px;border:5px solid ${INK};position:relative;overflow:hidden;
      background:linear-gradient(160deg,#FFD44A,${GOLD} 45%,#E0A800);box-shadow:0 12px 34px rgba(0,0,0,.55)">
      <div style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.65) 48%,transparent 64%)"></div>
      <div style="position:relative;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px">
        <span style="font-size:52px">🎁</span>
        <span style="${OSW};font-size:16px;letter-spacing:.08em">PACOTE</span>
      </div>
    </div>
    <div style="margin:18px auto 0;display:inline-block;background:${GREEN};color:#fff;border:4px solid ${INK};border-radius:999px;
      box-shadow:4px 4px 0 ${INK};padding:11px 26px;${OSW};font-size:19px">👆 TOQUE PRA ABRIR</div>
    <p style="${SERIF};font-style:italic;font-size:13.5px;color:rgba(255,255,255,.72);margin-top:14px;line-height:1.35">
      tocou fora? a carta é sua<br>do mesmo jeito ✅</p>
  </div>`)

// ── passo 2: a carta revelada ──
const cartaAberta = tela(`
  <div style="position:absolute;inset:0;background:rgba(12,12,12,.82)"></div>
  <div style="position:relative;margin:auto;padding:0 20px;text-align:center;width:100%">
    <p style="${OSW};font-size:15px;color:${GOLD};letter-spacing:.12em">✨ FOI ESSA</p>
    <div style="margin:12px auto 0;width:158px;height:214px;border-radius:14px;border:5px solid ${INK};position:relative;overflow:hidden;
      background:linear-gradient(150deg,#FFD95C,#F0A500 55%,#C97B00);box-shadow:0 12px 34px rgba(0,0,0,.55);
      display:flex;flex-direction:column;justify-content:space-between;padding:11px">
      <div style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.5) 48%,transparent 64%)"></div>
      <span style="${OSW};font-size:12px;background:${INK};color:#fff;border-radius:7px;padding:2px 8px;align-self:flex-start;position:relative">ATA</span>
      <div style="position:relative;align-self:center;width:62px;height:62px;border-radius:50%;background:rgba(255,255,255,.4);
        border:3px solid rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;${OSW};font-size:26px;color:#7a4a00">R</div>
      <div style="position:relative;text-align:center">
        <p style="${OSW};font-size:19px;color:#fff;line-height:1.1;margin:0">Romário</p>
        <p style="font-size:11px;font-weight:800;color:rgba(255,255,255,.75);margin:2px 0 0">Barcelona · 1994</p>
        <p style="${OSW};font-size:11px;color:${INK};background:#fff;border-radius:6px;display:inline-block;padding:1px 8px;margin-top:5px">👑 LENDA</p>
      </div>
    </div>
    <p style="${OSW};font-size:17px;color:#fff;margin-top:16px">foi pro seu álbum 📗</p>
    <div style="margin:14px auto 0;display:inline-block;background:${GOLD};border:4px solid ${INK};border-radius:999px;
      box-shadow:4px 4px 0 ${INK};padding:11px 22px;${OSW};font-size:17px">📰 VER O JORNAL</div>
  </div>`)

// ── passo 3: o jornal (mini) ──
const jornalMini = (etiqueta, cor) => tela(`
  <div style="flex:none;background:${cor};color:#fff;${OSW};font-size:14px;padding:7px 12px;text-align:center;letter-spacing:.06em">${etiqueta}</div>
  <div style="flex:1;background:#FBF6E9;padding:13px 13px 0;overflow:hidden">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;border-bottom:3px solid ${INK};padding-bottom:6px">
      <span style="${SERIF};font-weight:700;font-size:24px">O <span style="color:#B23A2A">MARTELO</span></span>
      <span style="${OSW};font-size:8.5px;color:rgba(0,0,0,.6);text-align:right;line-height:1.35">EDIÇÃO DA SALA<br>1 MOEDA</span>
    </div>
    <p style="${SERIF};font-weight:700;font-size:19px;line-height:1.14;margin:11px 0 0;text-transform:uppercase">
      Noite de dois donos: o Milhaça leva a liga, o Neymarzetti leva a copa!</p>
    <div style="display:flex;gap:7px;margin-top:11px">
      <div style="flex:1;height:96px;border:3px solid ${INK};border-radius:6px;background:linear-gradient(160deg,#2E9E5B,#14532d);
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px">
        <span style="width:38px;height:38px;border-radius:50%;border:3px solid ${INK};background:linear-gradient(160deg,#F3B212,#AE1A13);
          display:flex;align-items:center;justify-content:center;${OSW};font-size:17px;color:#fff">M</span>
        <span style="${SERIF};font-weight:700;font-size:12px;color:#fff">Milhaça FC</span>
      </div>
      <div style="flex:1;height:96px;border:3px solid ${INK};border-radius:6px;background:linear-gradient(160deg,#8B5CF6,#4C1D95);
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px">
        <span style="width:38px;height:38px;border-radius:50%;border:3px solid ${INK};background:linear-gradient(160deg,#B6B7B8,#141416);
          display:flex;align-items:center;justify-content:center;${OSW};font-size:17px;color:#fff">N</span>
        <span style="${SERIF};font-weight:700;font-size:12px;color:#fff">Neymarzetti</span>
      </div>
    </div>
    <div style="margin-top:9px;border:3px solid ${INK};border-radius:6px;overflow:hidden;background:#fff">
      <p style="${OSW};font-size:10px;background:#B23A2A;color:#fff;padding:5px 8px">📝 AS NOTAS DA REDAÇÃO</p>
      ${[['1º', 'Milhaça FC', '🏆 CAMPEÃO'], ['2º', 'Nata de SP', 'entregou na última'], ['9º', 'Tricolor do Arruda', '❗ fora por 1 gol']]
        .map(([p, t, n]) => `<div style="display:flex;gap:7px;padding:5px 8px;border-top:1.5px solid rgba(0,0,0,.1)">
          <span style="${OSW};font-size:11px;color:rgba(0,0,0,.4);width:22px">${p}</span>
          <span style="${SERIF};font-weight:700;font-size:11.5px;flex:1">${t}</span>
          <span style="${SERIF};font-size:11px;color:rgba(0,0,0,.6)">${n}</span></div>`).join('')}
    </div>
    <div style="margin-top:9px;background:linear-gradient(100deg,#FFD44A,${GOLD} 45%,#E0A800);border:3px solid ${INK};
      border-radius:6px;padding:8px;text-align:center;${OSW};font-size:14px">🔨 leilaolegends.com</div>
    <div style="margin-top:9px;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:8px;
      padding:9px;text-align:center;${OSW};font-size:14px">📲 Compartilhar o jornal</div>
  </div>`)

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};width:1080px;padding:40px 34px;font-family:system-ui}</style>
<body>

<div style="text-align:center;margin-bottom:10px">
  <span style="display:inline-block;background:${GOLD};border:4px solid ${INK};border-radius:999px;box-shadow:4px 4px 0 ${INK};
    padding:8px 24px;${OSW};font-size:20px;letter-spacing:.06em">🃏➡️📰 A CARTA E DEPOIS O JORNAL</span>
</div>
<p style="${SERIF};font-style:italic;font-size:21px;text-align:center;color:rgba(0,0,0,.72);margin-bottom:26px;line-height:1.4">
  "não tem graça aparecer automático sem o cara ver" — então o campeão ganha um banner só pra isso.</p>

<div style="background:#fff;border:5px solid ${INK};border-radius:16px;box-shadow:6px 6px 0 ${INK};padding:22px;margin-bottom:22px">
  <p style="${OSW};font-size:23px;text-transform:uppercase;margin-bottom:18px;color:${GREEN}">🏆 quem foi campeão</p>
  <div style="display:flex;gap:11px;align-items:flex-start">
    ${passo(1, 'o pacote espera', 'Aparece de cara e <b>fica lá</b> — não abre sozinho. Se ele tocar fora, fecha e a carta conta do mesmo jeito.', bannerCarta)}
    ${seta}
    ${passo(2, 'ele vê qual foi', 'A carta estoura na tela. É o momento que hoje passa batido quando o cronômetro abre sozinho.', cartaAberta)}
    ${seta}
    ${passo(3, 'aí entra o jornal', 'Só depois que ele pegou. Nunca antes — é ao montar a tela do campeão que a carta é gravada.', jornalMini('DEPOIS DA CARTA', GREEN))}
  </div>
</div>

<div style="background:#fff;border:5px solid ${INK};border-radius:16px;box-shadow:6px 6px 0 ${INK};padding:22px">
  <p style="${OSW};font-size:23px;text-transform:uppercase;margin-bottom:18px;color:${PURPLE}">👥 todos os outros</p>
  <div style="display:flex;gap:22px;align-items:center">
    <div style="flex:none">${jornalMini('DE CARA, SEM ESPERAR', PURPLE)}</div>
    <div style="flex:1">
      <p style="${SERIF};font-size:22px;line-height:1.5;color:rgba(0,0,0,.8)">
        Quem não foi campeão <b>não tem carta pra abrir</b>, então não faz sentido esperar nada:
        o jornal abre <b>na hora</b> que o apito toca.<br><br>
        E ninguém fica travado esperando o campeão abrir o pacote dele — isso já foi decidido
        em <b>30/07</b> (<i>"amigo ganhou não trava ninguém"</i>) e continua valendo.</p>
    </div>
  </div>
</div>

<div style="background:#E6F3EA;border:5px solid ${INK};border-radius:16px;box-shadow:6px 6px 0 ${INK};padding:20px 22px;margin-top:22px">
  <p style="${OSW};font-size:21px;text-transform:uppercase;margin-bottom:9px">✅ ninguém perde carta, de jeito nenhum</p>
  <p style="${SERIF};font-size:21px;line-height:1.5;color:rgba(0,0,0,.8)">
    A carta é sorteada e <b>gravada na conta no instante em que o cara vira campeão</b> — antes de
    qualquer toque, e com re-tentativa se a internet cair. Tocar, tocar fora, fechar o app ou perder
    o sinal dão todos <b>no mesmo resultado</b>. O banner é só a cerimônia de ver qual foi.</p>
</div>

<p style="text-align:center;${OSW};font-size:18px;color:rgba(0,0,0,.5);margin-top:20px">
  🔨 mockup — não está no jogo · leilaolegends.com</p>
</body>`

const tmp = `/tmp/mock-fluxo-carta-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA, fullPage: true })
const alt = await p.evaluate(() => document.body.scrollHeight)
await b.close()
console.log(`${SAIDA} — 1080x${alt}`)
