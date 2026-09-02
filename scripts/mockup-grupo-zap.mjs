// ─── 📱 MOCKUP: O GRUPO DE QUEM JOGA ONLINE (perk do Lenda) ─────────────────
//
// Ideia do Diego (29/08), logo depois de fechar que a liga é sempre privada:
// *"mas e se o cara coitado não tinha ver amigos… aí eu pensei em criar no final
// das salas, perto do botão de sair, com corre. do whatsapp alguma coisa também,
// que aperta e o cara paga lenda pra entrar no grupo da galera que joga online"*.
//
// O PROBLEMA QUE ISTO RESOLVE. Fechar a liga (decisão dele, e certa) tira o único
// jeito que um cara sem turma tinha de achar gente. Este botão devolve isso — e
// devolve num lugar melhor: no FIM da partida, quando ele acabou de jogar com
// gente de verdade e está no clima de marcar a próxima.
//
// ONDE FICA: colado na linha de saídas do fim da sala online (screens.tsx, a
// faixa `🏠 Voltar pro menu · 🚪 Sair da sala`), logo ACIMA dela. Não atrapalha
// a votação de continuar nem empurra nada pra baixo do dedo.
//
// DOIS ESTADOS, porque a conta muda o que faz sentido oferecer:
//   • quem NÃO é Lenda  → o convite (o que é o grupo + virar Lenda)
//   • quem JÁ é Lenda   → o botão direto, sem propaganda nenhuma
//
// 🎨 Usa o VERDE DO JOGO (#1B7A3D), não o verde do WhatsApp — a regra da casa é
// não inventar cor nova. Se o Diego preferir o verde da marca, é um valor.
//
//   node scripts/mockup-grupo-zap.mjs [--saida x.png]
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const saida = process.argv.includes('--saida') ? process.argv[process.argv.indexOf('--saida') + 1] : 'grupo-zap.png'
const INK = '#0C0C0C', GREEN = '#1B7A3D'

// a moldura escura do fim da sala online, pra o botão ser julgado no contexto real
const fim = (miolo) => `
  <div style="width:400px;background:#1b1b1b;border:3px solid #000;border-radius:16px;padding:14px;box-shadow:4px 4px 0 #000">
    <div style="font:900 15px Oswald;color:#fff;text-transform:uppercase;margin-bottom:3px">🏁 Fim de papo</div>
    <div style="font:700 11px system-ui;color:rgba(255,255,255,.5);margin-bottom:12px">Vocês jogam de novo?</div>
    <div style="display:flex;gap:8px;margin-bottom:6px">
      <div style="flex:1;text-align:center;background:#FFC400;border:2.5px solid #000;border-radius:10px;font:900 12px Oswald;color:#000;padding:10px 0">🔨 MESMO TIME</div>
      <div style="flex:1;text-align:center;background:#fff;border:2.5px solid #000;border-radius:10px;font:900 12px Oswald;color:#000;padding:10px 0">🎲 NOVO LEILÃO</div>
    </div>
    <div style="font:900 11px Oswald;color:#FFDD70;text-align:center;padding:6px 0 12px">👆 Toque no seu voto pra ficar PRONTO!</div>
    ${miolo}
    <div style="display:flex;justify-content:center;gap:24px;padding-top:10px;margin-top:10px;border-top:2px solid rgba(255,255,255,.2)">
      <span style="font:700 11px system-ui;color:rgba(255,255,255,.7);text-decoration:underline">🏠 Voltar pro menu</span>
      <span style="font:700 11px system-ui;color:rgba(255,255,255,.7);text-decoration:underline">🚪 Sair da sala</span>
    </div>
  </div>`

const CONVITE = `
  <div style="border:3px solid #000;border-radius:12px;padding:12px;background:rgba(27,122,61,.22);box-shadow:3px 3px 0 ${INK}">
    <div style="font:900 13.5px Oswald;color:#fff;text-transform:uppercase;line-height:1;margin-bottom:6px">📱 Grupo de quem joga online</div>
    <div style="font:700 11px system-ui;color:rgba(255,255,255,.68);line-height:1.45;margin-bottom:11px">
      Sem galera pra chamar? No grupo tem gente marcando pregão <b style="color:#fff">todo dia</b> — e é de lá que saem as ligas.
    </div>
    <div style="background:${GREEN};border:3px solid #000;border-radius:11px;text-align:center;font:900 13.5px Oswald;color:#fff;padding:11px 0;box-shadow:3px 3px 0 ${INK}">👑 ENTRAR NO GRUPO — VIRE LENDA</div>
    <div style="font:700 10.5px system-ui;color:rgba(255,255,255,.5);line-height:1.45;margin-top:9px">
      🔑 O grupo é do <b style="color:#fff">Lenda</b> — é o que segura a bagunça e mantém a turma boa. Vem junto com liga própria, cor de ouro e o resto.
    </div>
  </div>`

const JA_LENDA = `
  <div style="border:3px solid #000;border-radius:12px;padding:12px;background:rgba(27,122,61,.22);box-shadow:3px 3px 0 ${INK}">
    <div style="font:900 13.5px Oswald;color:#fff;text-transform:uppercase;line-height:1;margin-bottom:6px">📱 Grupo de quem joga online</div>
    <div style="font:700 11px system-ui;color:rgba(255,255,255,.68);line-height:1.45;margin-bottom:11px">
      Marque o próximo pregão com a turma — o grupo tá lá.
    </div>
    <div style="background:${GREEN};border:3px solid #000;border-radius:11px;text-align:center;font:900 13.5px Oswald;color:#fff;padding:11px 0;box-shadow:3px 3px 0 ${INK}">📱 ABRIR O GRUPO</div>
  </div>`

const LIGA_SENHA = `
  <div style="width:400px;background:#141414;border:3px solid #000;border-radius:16px;padding:14px;box-shadow:4px 4px 0 #000">
    <div style="font:900 15px Oswald;color:#fff;text-transform:uppercase;margin-bottom:10px">🏆 Criar liga — agora é sempre privada</div>
    <div style="border:3px solid #000;border-radius:12px;padding:12px;background:rgba(255,196,0,.16);box-shadow:3px 3px 0 ${INK}">
      <div style="font:900 11px Oswald;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:6px">🖋️ Nome da liga</div>
      <div style="background:#fff;border:2.5px solid #000;border-radius:8px;padding:8px 10px;font:900 14px Oswald;color:#000">Liga do Neymarzetti 👑</div>
      <div style="font:900 11px Oswald;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.55);margin:12px 0 6px">🔒 Senha da liga</div>
      <div style="background:#fff;border:2.5px solid #000;border-radius:8px;padding:8px 10px;font:900 14px Oswald;color:#000">••••••</div>
      <div style="font:700 10.5px system-ui;color:rgba(255,255,255,.42);margin-top:7px;line-height:1.45">
        🔒 A liga é <b style="color:#fff">só da sua turma</b>: não aparece na lista pública. Quem entra precisa do código <b style="color:#fff">e</b> da senha.
      </div>
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{background:#0a0a0a;padding:34px;font-family:system-ui}
.rot{font:900 12.5px Oswald;letter-spacing:.6px;text-transform:uppercase;color:#0C0C0C;border:2px solid #000;border-radius:999px;padding:4px 12px;display:inline-block;margin-bottom:10px}</style>
</head><body>
  <div style="font:900 26px Oswald;color:#fff;text-transform:uppercase;margin-bottom:4px">📱 O grupo de quem joga online</div>
  <div style="font:700 13px system-ui;color:rgba(255,255,255,.5);margin-bottom:24px;max-width:1000px;line-height:1.5">
    Fechar a liga tira o único jeito que um cara sem turma tinha de achar gente. Este botão devolve isso — no fim da partida, que é quando ele acabou de jogar e está no clima de marcar a próxima.
  </div>
  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
    <div><span class="rot" style="background:#E8503A">👤 Conta comum</span>${fim(CONVITE)}</div>
    <div><span class="rot" style="background:#FFC400">👑 Já é Lenda</span>${fim(JA_LENDA)}</div>
    <div><span class="rot" style="background:#fff">🔒 A liga fechada (decisão de hoje)</span>${LIGA_SENHA}</div>
  </div>
  <div style="margin-top:26px;font:700 12px system-ui;color:rgba(255,255,255,.45);max-width:1000px;line-height:1.7">
    ⚠️ <b style="color:#E8503A">Falta o link do grupo</b> — não invento link de WhatsApp. Me manda o convite do grupo que eu ligo o botão.<br>
    🎨 Usei o <b style="color:#fff">verde do jogo</b> (#1B7A3D), não o verde do WhatsApp — a regra é não inventar cor nova. Se preferir o verde da marca, é um valor só.<br>
    📌 Vale lembrar: isso vira um <b style="color:#FFC400">benefício novo do Lenda</b>, então também precisa aparecer no card do Lenda lá na tela de Apoiar — senão quem paga não fica sabendo que ganhou.
  </div>
</body></html>`

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch(existsSync(CHROME) ? { executablePath: CHROME } : {})
const page = await browser.newPage({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(700)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`✅ ${saida}`)
