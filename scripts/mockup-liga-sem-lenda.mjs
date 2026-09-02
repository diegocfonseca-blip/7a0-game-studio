// ─── 👑 MOCKUP: o que quem NÃO é Lenda vê ao escolher 🏆 Liga ────────────────
//
// Pedido do Diego (29/08): *"quem não é lenda fica com botão de apoie em cima
// sei lá.. e aí quando aperta informa que lenda pra cima pode criar mas você
// pode jogar se ele criar"*.
//
// O "sei lá" é ele dizendo que não sabe a forma — então vai o desenho antes de
// subir, que é a regra da casa.
//
// Mostra os DOIS lados lado a lado, pra dar pra comparar num print só:
//   ESQUERDA  = quem é 👑 Lenda (o formulário de sempre)
//   DIREITA   = quem não é (o convite, com o "jogar é de graça" colado embaixo)
//
//   node scripts/mockup-liga-sem-lenda.mjs [--saida x.png]
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const saida = process.argv.includes('--saida') ? process.argv[process.argv.indexOf('--saida') + 1] : 'liga-sem-lenda.png'
const INK = '#0C0C0C'

const quadro = (titulo, selo, corpo) => `
  <div style="width:420px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <span style="font:900 13px Oswald;letter-spacing:.6px;text-transform:uppercase;color:#0C0C0C;background:${selo};border:2px solid #000;border-radius:999px;padding:4px 12px">${titulo}</span>
    </div>
    <div style="background:#141414;border:3px solid #000;border-radius:16px;padding:14px;box-shadow:4px 4px 0 #000">
      <div style="font:900 11px Oswald;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:8px">Modo de jogo (teste)</div>
      <div style="display:flex;gap:0;border:2.5px solid #000;border-radius:10px;overflow:hidden;margin-bottom:10px">
        <div style="flex:1;text-align:center;font:900 12px Oswald;padding:9px 0;background:#fff;color:#000">⚡ Rápido</div>
        <div style="flex:1;text-align:center;font:900 12px Oswald;padding:9px 0;background:#FFC400;color:#000;border-left:2.5px solid #000">🏆 Liga</div>
        <div style="flex:1;text-align:center;font:900 12px Oswald;padding:9px 0;background:#fff;color:#000;border-left:2.5px solid #000">🌐 Carreira</div>
        <div style="flex:1;text-align:center;font:900 12px Oswald;padding:9px 0;background:#fff;color:#000;border-left:2.5px solid #000">🃏 Bafo</div>
      </div>
      ${corpo}
    </div>
  </div>`

const CORPO_LENDA = `
  <div style="margin-top:12px;border:3px solid #000;border-radius:12px;padding:12px;background:rgba(255,196,0,.16);box-shadow:3px 3px 0 ${INK}">
    <div style="font:900 11px Oswald;letter-spacing:1.1px;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:8px">🏆 A sua liga</div>
    <div style="font:900 11px Oswald;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:6px">🖋️ Nome da liga</div>
    <div style="background:#fff;border:2.5px solid #000;border-radius:8px;padding:8px 10px;font:900 14px Oswald;color:#000">Liga do Neymarzetti 👑</div>
    <div style="font:900 11px Oswald;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.55);margin:12px 0 6px">📅 Quando vocês jogam</div>
    <div style="display:flex;gap:8px">
      <div style="flex:1;background:#fff;border:2.5px solid #000;border-radius:8px;padding:8px 10px;font:900 14px Oswald;color:#000">28/08/2026</div>
      <div style="width:104px;background:#fff;border:2.5px solid #000;border-radius:8px;padding:8px 10px;font:900 14px Oswald;color:#000">23:00</div>
    </div>
    <div style="font:900 11px Oswald;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.55);margin:12px 0 6px">🤖 Bots na tabela</div>
    <div style="display:flex;border:2.5px solid #000;border-radius:10px;overflow:hidden">
      <div style="flex:1;text-align:center;font:900 12px Oswald;padding:9px 0;background:#FFC400;color:#000">Com bots até 20</div>
      <div style="flex:1;text-align:center;font:900 12px Oswald;padding:9px 0;background:#fff;color:#000;border-left:2.5px solid #000">Sem bots — só vocês</div>
    </div>
    <div style="font:700 10.5px system-ui;color:rgba(255,255,255,.4);margin-top:7px;line-height:1.4">🤖 Padrão. Tabela de 20 times — os que faltam entram como CPU, como no rápido de sempre.</div>
  </div>`

const CORPO_COMUM = `
  <div style="margin-top:12px;border:3px solid #000;border-radius:12px;padding:14px;background:rgba(255,196,0,.16);box-shadow:3px 3px 0 ${INK}">
    <div style="font:900 15px Oswald;text-transform:uppercase;color:#fff;margin-bottom:8px;line-height:1">👑 Criar uma liga é do Lenda</div>
    <div style="font:700 11.5px system-ui;color:rgba(255,255,255,.7);line-height:1.45;margin-bottom:12px">
      A liga é a sala que <b style="color:#fff">fica de pé</b>: sempre a mesma, com dia e hora marcados, e a estante guardando campeão e artilheiro <b style="color:#fff">temporada após temporada</b>.
    </div>
    <div style="background:linear-gradient(180deg,#FFE07A,#F5B301);border:3px solid #000;border-radius:12px;text-align:center;font:900 15px Oswald;color:#0C0C0C;padding:12px 0;box-shadow:4px 4px 0 ${INK}">👑 QUERO SER LENDA</div>
    <div style="font:700 11px system-ui;color:rgba(255,255,255,.55);line-height:1.45;margin-top:10px">
      ✅ <b style="color:#fff">Pra JOGAR você não precisa de nada.</b> Se um Lenda criar a liga e te passar o código, você entra e joga igual a todo mundo — com troféu e tudo.
    </div>
    <div style="font:700 10px system-ui;color:rgba(255,255,255,.35);line-height:1.45;margin-top:8px">
      Quer só jogar agora? Use o <b style="color:rgba(255,255,255,.6)">⚡ Rápido</b> aqui em cima — é de graça e sempre foi.
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{background:#0a0a0a;padding:34px;font-family:system-ui}</style>
</head><body>
  <div style="font:900 26px Oswald;color:#fff;text-transform:uppercase;margin-bottom:4px">🏆 Minhas Ligas — quem cria e quem joga</div>
  <div style="font:700 13px system-ui;color:rgba(255,255,255,.5);margin-bottom:22px">A MESMA tela, vista por duas contas diferentes. Só muda o miolo do quadro da liga.</div>
  <div style="display:flex;gap:26px;align-items:flex-start">
    ${quadro('👑 Conta Lenda — pode criar', '#FFC400', CORPO_LENDA)}
    ${quadro('👤 Conta comum — não pode criar', '#E8503A', CORPO_COMUM)}
  </div>
  <div style="margin-top:24px;font:700 12px system-ui;color:rgba(255,255,255,.45);max-width:900px;line-height:1.6">
    O botão <b style="color:#FFC400">QUERO SER LENDA</b> abre a tela de Apoiar já com o card do Lenda aceso (link <code style="color:#fff">?apoie=lenda</code>, que o jogo já sabia fazer).<br>
    A frase do "jogar é de graça" fica <b style="color:#fff">colada embaixo do botão</b> — do jeito que o Diego pede: explicação no lugar exato, não em parágrafo solto.
  </div>
</body></html>`

// 🖥️ o navegador vem PRONTO no ambiente (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers).
// Quando a versão do pacote não bate com a da pasta, o launch normal não acha o
// binário — então aponta direto pro executável quando ele existir.
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch(existsSync(CHROME) ? { executablePath: CHROME } : {})
const page = await browser.newPage({ viewport: { width: 990, height: 900 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(700) // deixa a Oswald chegar
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`✅ ${saida}`)
