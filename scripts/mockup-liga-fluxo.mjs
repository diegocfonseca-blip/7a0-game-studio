// ─── 🗺️ A VIDA DE UMA LIGA, DIA POR DIA ─────────────────────────────────────
//
// O Diego, em 29/08: *"ainda não ficou claro o fluxo completo que ocorre quando se
// cria uma sala do Minhas Ligas, seja com senha ou sem senha… o botão de sair da
// sala confunde, porque na sala rápida quando qualquer um sai, ele sai de vez…
// alguém criou hoje e agendou pra amanhã à noite: essa sala vai ficar aparecendo
// se ele botou sem senha? Enfim, tô perdido"*.
//
// A confusão é culpa da EXPLICAÇÃO, não dele: eu vinha misturando regra de sala
// rápida com regra de liga em texto corrido. Então aqui é o fluxo inteiro numa
// figura, com as DUAS perguntas dele respondidas em cada momento:
//    • quem vê a liga na lista?
//    • o que cada botão faz?
//
//   node scripts/mockup-liga-fluxo.mjs [--saida x.png]
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const saida = process.argv.includes('--saida') ? process.argv[process.argv.indexOf('--saida') + 1] : 'liga-fluxo.png'
const GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#E8503A'

const passo = (n, quando, titulo, corpo, lista, corLista) => `
  <div style="width:300px;background:#161616;border:3px solid #000;border-radius:14px;padding:13px;box-shadow:4px 4px 0 #000">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">
      <span style="width:24px;height:24px;border-radius:999px;background:${GOLD};border:2px solid #000;font:900 13px Oswald;color:#000;display:flex;align-items:center;justify-content:center">${n}</span>
      <span style="font:900 11px Oswald;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.45)">${quando}</span>
    </div>
    <div style="font:900 14px Oswald;color:#fff;text-transform:uppercase;line-height:1.05;margin-bottom:7px">${titulo}</div>
    <div style="font:700 11px system-ui;color:rgba(255,255,255,.6);line-height:1.5">${corpo}</div>
    <div style="margin-top:10px;border-radius:8px;border:2px solid #000;padding:7px 9px;background:${corLista}">
      <div style="font:900 9.5px Oswald;letter-spacing:.8px;text-transform:uppercase;color:rgba(0,0,0,.55);margin-bottom:2px">Na lista de salas abertas</div>
      <div style="font:900 12px Oswald;color:#000">${lista}</div>
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{background:#0a0a0a;padding:34px;font-family:system-ui}
b{color:#fff}</style>
</head><body>
  <div style="font:900 27px Oswald;color:#fff;text-transform:uppercase;margin-bottom:4px">🗺️ A vida de uma liga, dia por dia</div>
  <div style="font:700 13px system-ui;color:rgba(255,255,255,.5);margin-bottom:24px">Criou hoje 22h · agendou pra amanhã 21h · botou (ou não) senha. O que acontece em cada momento.</div>

  <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
    ${passo(1, 'Hoje, 22h', 'Você cria a liga',
      'Escolhe nome, dia/hora, bots e (se quiser) senha. Você já entra dentro dela — é a sua sala de espera.',
      '⚠️ APARECE (você está dentro)', '#FFD98A')}
    ${passo(2, 'Hoje, 22h05', 'Você vai dormir',
      'Aperta <b>🚪 Sair</b> ou só <b>fecha a aba</b> — tanto faz. Na liga, os dois são seguros: <b>nada é apagado</b>. A liga fica guardada em 🏆 Minhas ligas.',
      '❌ SOME em até 3 min', '#B7E0C2')}
    ${passo(3, 'Amanhã, o dia todo', 'A liga está dormindo',
      'Ninguém precisa ficar online. Ela existe, guarda os troféus e espera. <b>Com ou sem senha, é igual.</b>',
      '❌ NINGUÉM VÊ', '#B7E0C2')}
    ${passo(4, 'Amanhã, 21h', 'Você abre a liga',
      'Entra por 🏆 Minhas ligas. A galera entra pelo <b>código</b> (e pela senha, se você pôs). Só <b>você</b> abre o pregão.',
      '✅ APARECE (tem gente)', '#B7E0C2')}
    ${passo(5, 'Ninguém veio 😔', 'Não acontece nada',
      'Você sai, a liga <b>continua inteira</b>. Entra em Minhas ligas e <b>remarca</b> pra outro dia. Nada é perdido, nada é apagado.',
      '❌ SOME quando você sai', '#B7E0C2')}
  </div>

  <div style="display:flex;gap:20px;margin-top:26px;flex-wrap:wrap">
    <div style="flex:1;min-width:430px;background:#161616;border:3px solid ${RED};border-radius:14px;padding:15px;box-shadow:4px 4px 0 #000">
      <div style="font:900 15px Oswald;color:${RED};text-transform:uppercase;margin-bottom:8px">⚠️ O furo que sobra — preciso da sua decisão</div>
      <div style="font:700 11.5px system-ui;color:rgba(255,255,255,.65);line-height:1.6">
        No <b>passo 1</b> a liga aparece na lista, porque você está dentro montando ela. São uns minutinhos, mas: se você deixou <b>SEM senha</b>, um estranho pode entrar nesses minutos e sentar numa cadeira da sua liga — <b>hoje</b>, não amanhã.<br><br>
        <b style="color:${GOLD}">Minha sugestão:</b> a liga só entrar na lista <b>a partir de 1h antes do horário marcado</b>. Aí montar a sala é sempre em paz, e ela aparece na hora certa — que é quando você quer gente chegando.
      </div>
    </div>
    <div style="flex:1;min-width:430px;background:#161616;border:3px solid ${GREEN};border-radius:14px;padding:15px;box-shadow:4px 4px 0 #000">
      <div style="font:900 15px Oswald;color:#7BD69B;text-transform:uppercase;margin-bottom:8px">🚪 O botão "sair" — por que confunde</div>
      <div style="font:700 11.5px system-ui;color:rgba(255,255,255,.65);line-height:1.6">
        Você tem razão: é o <b>mesmo botão</b> com dois significados.<br><br>
        ⚡ <b>Sala rápida</b> — dono sai, <b>a sala acaba</b>. Certo: sala sem dono é lixo.<br>
        🏆 <b>Liga</b> — dono sai, <b>não acontece nada</b>. Ela é feita pra ficar de pé.<br><br>
        <b style="color:${GOLD}">Minha sugestão:</b> na liga o botão deixa de se chamar "Sair da sala" e vira <b>"✅ Guardar e sair"</b>, com a linha embaixo: <i>"sua liga fica guardada — volta quando quiser"</i>.
      </div>
    </div>
  </div>

  <div style="margin-top:22px;background:#161616;border:3px solid #000;border-radius:14px;padding:15px;box-shadow:4px 4px 0 #000">
    <div style="font:900 15px Oswald;color:#fff;text-transform:uppercase;margin-bottom:9px">🔑 E o que a senha muda, afinal?</div>
    <div style="font:700 11.5px system-ui;color:rgba(255,255,255,.65);line-height:1.6">
      A senha <b>NÃO muda quando a liga aparece</b> — isso é sempre a mesma regra: aparece quando tem gente dentro, some quando esvazia.<br>
      A senha muda só <b>QUEM CONSEGUE ENTRAR</b> quando ela está aparecendo:<br><br>
      🔒 <b>Com senha</b> → o estranho vê a liga na lista, tenta entrar e para na porta. (É de propósito: dá vontade.)<br>
      🔓 <b>Sem senha</b> → o estranho vê e <b>entra</b>. Serve pra quem quer achar gente nova — mas o que ele ganhar fica na estante pra sempre.
    </div>
  </div>
</body></html>`

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch(existsSync(CHROME) ? { executablePath: CHROME } : {})
const page = await browser.newPage({ viewport: { width: 1640, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(700)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`✅ ${saida}`)
