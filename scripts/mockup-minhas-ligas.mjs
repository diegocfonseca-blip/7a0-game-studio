// ─── 🏆 MINHAS LIGAS — como ficou depois de tudo (29/08) ────────────────────
//
// Pergunta do Diego no fim do dia: *"como ficará o Minhas Ligas então?"*. Depois de
// uma tarde inteira mexendo em regra, ele merece ver o resultado, não ler.
//
// Mostra os TRÊS lugares em que a liga aparece, que é a resposta inteira:
//   1. 🏆 Minhas ligas — o card no topo do lobby (dono e convidado)
//   2. ✏️ Editar — o que dá pra mexer sem entrar na sala
//   3. ⚡ Salas abertas — o que um ESTRANHO vê (só liga rolando, e trancada)
//
//   node scripts/mockup-minhas-ligas.mjs [--saida x.png]
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const saida = process.argv.includes('--saida') ? process.argv[process.argv.indexOf('--saida') + 1] : 'minhas-ligas.png'
const INK = '#0C0C0C', GREEN = '#1B7A3D', GOLD = '#FFC400', RED = '#E8503A'

const linhaLiga = (nome, sub, quando, corQuando, botao, dono) => `
  <div style="border:2px solid #000;border-radius:12px;padding:9px 11px;background:#fff;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:9px">
      <div style="flex:1;min-width:0">
        <div style="font:900 14px Oswald;color:#000">${nome}</div>
        <div style="font:700 11px system-ui;color:rgba(0,0,0,.6);margin-top:1px">${sub}</div>
        <div style="font:900 11.5px Oswald;color:${corQuando};margin-top:2px">📅 ${quando}</div>
      </div>
      <div style="border:2px solid #000;border-radius:9px;padding:8px 13px;font:900 11px Oswald;text-transform:uppercase;background:${GREEN};color:#fff">${botao}</div>
    </div>
    ${dono ? `<div style="display:flex;gap:8px;margin-top:9px">
      <div style="flex:1;text-align:center;border:2px solid #000;border-radius:9px;padding:6px 0;font:900 11.5px Oswald;background:#fff;color:#000">✏️ Editar</div>
      <div style="flex:1;text-align:center;border:2px solid #000;border-radius:9px;padding:6px 0;font:900 11.5px Oswald;background:${RED};color:#fff">🗑️ Excluir a liga</div>
    </div>` : ''}
  </div>`

const CARD = `
  <div style="width:400px;background:#FFF4CF;border:3px solid #000;border-radius:16px;padding:12px;box-shadow:4px 4px 0 #000">
    <div style="font:900 14px Oswald;color:#7a4d00;margin-bottom:9px">🏆 Minhas ligas</div>
    ${linhaLiga('Liga dos Amigos 🔒', '👥 4 · 7X2K · sem bots', 'é HOJE, 21:00', '#1B7A3D', '▶️ Entrar', true)}
    ${linhaLiga('Copa do Trampo 🔒', '👥 0 · B4M9 · com bots · você é convidado', 'sexta, faltam 3 dias', '#7a4d00', '▶️ Entrar', false)}
    ${linhaLiga('Liga da Família 🔒', '👥 0 · K1P8 · sem bots', 'já passou — remarque', '#C2452F', '▶️ Entrar', true)}
  </div>`

const EDITAR = `
  <div style="width:400px;background:#FFF4CF;border:3px solid #000;border-radius:16px;padding:12px;box-shadow:4px 4px 0 #000">
    <div style="font:900 14px Oswald;color:#7a4d00;margin-bottom:9px">✏️ Editar sem entrar na sala</div>
    <div style="border:2px solid #000;border-radius:12px;padding:10px;background:#FFF4CF">
      ${['🖋️ Nome da liga|Liga dos Amigos', '🔒 Trocar a senha|Deixe em branco pra manter a atual'].map(x => {
        const [rot, val] = x.split('|')
        const vazio = rot.includes('senha')
        return `<div style="font:900 10.5px Oswald;letter-spacing:.8px;text-transform:uppercase;color:rgba(0,0,0,.5);margin-bottom:4px">${rot}</div>
        <div style="background:#fff;border:2px solid #000;border-radius:8px;padding:7px 10px;font:900 13px Oswald;color:${vazio ? 'rgba(0,0,0,.35)' : '#000'};margin-bottom:9px">${val}</div>`
      }).join('')}
      <div style="font:900 10.5px Oswald;letter-spacing:.8px;text-transform:uppercase;color:rgba(0,0,0,.5);margin-bottom:4px">📅 Quando vocês jogam</div>
      <div style="display:flex;gap:7px;margin-bottom:9px">
        <div style="flex:1;background:#fff;border:2px solid #000;border-radius:8px;padding:7px 10px;font:900 13px Oswald;color:#000">30/08/2026</div>
        <div style="width:92px;background:#fff;border:2px solid #000;border-radius:8px;padding:7px 10px;font:900 13px Oswald;color:#000">21:00</div>
      </div>
      <div style="font:900 10.5px Oswald;letter-spacing:.8px;text-transform:uppercase;color:rgba(0,0,0,.5);margin-bottom:4px">🤖 Bots na tabela</div>
      <div style="display:flex;border:2px solid #000;border-radius:9px;overflow:hidden;margin-bottom:10px">
        <div style="flex:1;text-align:center;font:900 11.5px Oswald;padding:7px 0;background:${GOLD};color:#000">Com bots até 20</div>
        <div style="flex:1;text-align:center;font:900 11.5px Oswald;padding:7px 0;background:#fff;color:#000;border-left:2px solid #000">Sem bots</div>
      </div>
      <div style="display:flex;gap:7px">
        <div style="flex:1;text-align:center;border:2px solid #000;border-radius:8px;padding:7px 0;font:900 11.5px Oswald;background:${GREEN};color:#fff">Salvar</div>
        <div style="flex:1;text-align:center;border:2px solid #000;border-radius:8px;padding:7px 0;font:900 11.5px Oswald;background:#fff;color:#000">Cancelar</div>
      </div>
    </div>
  </div>`

const ESTRANHO = `
  <div style="width:400px;background:#1b1b1b;border:3px solid #000;border-radius:16px;padding:12px;box-shadow:4px 4px 0 #000">
    <div style="font:900 14px Oswald;color:#fff;margin-bottom:3px">⚡ Salas abertas</div>
    <div style="font:700 10.5px system-ui;color:rgba(255,255,255,.45);margin-bottom:10px">O que um estranho vê. A liga só entra aqui com a partida ROLANDO.</div>
    ${[['⚡', 'Sala do Zé', '👥 7/20 · A3K2 · ⚡ auto · 🏆 liga+copa', 'Entrar', GREEN, false],
       ['🔒', 'Liga dos Amigos', '👥 6/20 · 7X2K · fechada · 🔴 jogo rolando', 'Em jogo', '#ccc', true],
       ['⚡', 'Pregão do Braguinha', '👥 3/20 · P9L4 · ⚡ auto · 🏆 liga+copa', 'Entrar', GREEN, false]]
      .map(([ic, nm, sub, bt, cor, liga]) => `
      <div style="display:flex;align-items:center;gap:9px;border:3px solid #000;border-radius:12px;padding:9px 11px;background:${liga ? '#EFE6C8' : '#F4ECD6'};box-shadow:3px 3px 0 #000;margin-bottom:8px">
        <div style="flex:1;min-width:0">
          <div style="font:900 13.5px Oswald;color:#000;display:flex;align-items:center;gap:5px">
            ${liga ? '<span style="width:7px;height:7px;border-radius:99px;background:#e11;display:inline-block"></span>' : ''}${ic} ${nm}
            <span style="font:900 8.5px Oswald;border:2px solid #000;border-radius:4px;padding:1px 5px;background:${GOLD};color:#000">BR</span>
            ${liga ? `<span style="font:900 8.5px Oswald;border:2px solid #000;border-radius:4px;padding:1px 5px;background:${GREEN};color:#fff">🏆 LIGA</span>` : ''}
          </div>
          <div style="font:700 10.5px system-ui;color:rgba(0,0,0,.6);margin-top:2px">${sub}</div>
        </div>
        <div style="border:2px solid #000;border-radius:9px;padding:8px 12px;font:900 11px Oswald;text-transform:uppercase;background:${cor};color:${cor === '#ccc' ? '#000' : '#fff'}">${bt}</div>
      </div>`).join('')}
    <div style="font:700 10.5px system-ui;color:rgba(255,255,255,.4);line-height:1.5;margin-top:2px">
      Ele vê que tem liga rolando, mas <b style="color:#fff">não consegue entrar</b> — é sala em jogo e ainda tem senha. É de propósito: dá vontade.
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{background:#0a0a0a;padding:34px;font-family:system-ui}
.rot{font:900 12.5px Oswald;letter-spacing:.6px;text-transform:uppercase;color:#0C0C0C;border:2px solid #000;border-radius:999px;padding:4px 12px;display:inline-block;margin-bottom:10px}</style>
</head><body>
  <div style="font:900 27px Oswald;color:#fff;text-transform:uppercase;margin-bottom:4px">🏆 Minhas Ligas — como ficou</div>
  <div style="font:700 13px system-ui;color:rgba(255,255,255,.5);margin-bottom:24px">Os três lugares em que a liga aparece. Só isso — e é tudo.</div>
  <div style="display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap">
    <div><span class="rot" style="background:${GOLD}">1 · No topo do lobby</span>${CARD}</div>
    <div><span class="rot" style="background:#fff">2 · Editar sem entrar</span>${EDITAR}</div>
    <div><span class="rot" style="background:${RED}">3 · O que o estranho vê</span>${ESTRANHO}</div>
  </div>
  <div style="margin-top:24px;background:#161616;border:3px solid #000;border-radius:14px;padding:15px;box-shadow:4px 4px 0 #000;max-width:1290px">
    <div style="font:900 15px Oswald;color:#fff;text-transform:uppercase;margin-bottom:9px">🔒 O buraco que eu fechei junto</div>
    <div style="font:700 11.5px system-ui;color:rgba(255,255,255,.65);line-height:1.6">
      Com a senha virando obrigatória, quem <b style="color:#fff">esquecesse a própria senha</b> nunca mais poria um amigo novo na liga — o dono entra sem senha, mas ela ficaria trancada pros outros pra sempre, e a única saída seria <b style="color:${RED}">excluir a liga inteira</b>, perdendo a estante.<br>
      Agora tem <b style="color:${GOLD}">🔒 Trocar a senha</b> ali no Editar (em branco = mantém a atual). Ninguém consegue LER a senha — nem o banco guarda ela de verdade, só o embaralhado — então o certo é poder trocar.
    </div>
  </div>
</body></html>`

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch(existsSync(CHROME) ? { executablePath: CHROME } : {})
const page = await browser.newPage({ viewport: { width: 1360, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(700)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`✅ ${saida}`)
