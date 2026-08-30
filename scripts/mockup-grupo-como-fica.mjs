// ─── 📱 O BLOCO DO GRUPO, DO JEITO QUE ESTÁ NO AR ───────────────────────────
//
// Diego (29/08): *"mostre pra mim como é que aparece a parada do WhatsApp… pra eu
// ver como as pessoas enxergam"*.
//
// Ele é 👑 ouro, e o bloco só aparece pra quem NÃO é Lenda — e mesmo com a prévia
// ligada na conta dele, o lugar em que ele mora é o FIM de uma partida online, ou
// seja, ele teria que jogar um campeonato inteiro pra ver. Este desenho copia o
// bloco exatamente como está codado (mesmas cores, mesmo texto, mesma ordem) e
// mostra o entorno: a votação de continuar e a linha de saídas.
//
//   node scripts/mockup-grupo-como-fica.mjs [--saida x.png]
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const saida = process.argv.includes('--saida') ? process.argv[process.argv.indexOf('--saida') + 1] : 'grupo-como-fica.png'
const GREEN = '#1B7A3D', GOLD = '#FFC400'

const tela = (rotulo, corRot, miolo) => `
  <div style="width:400px">
    <div style="font:900 12.5px Oswald;letter-spacing:.6px;text-transform:uppercase;color:#0C0C0C;background:${corRot};border:2px solid #000;border-radius:999px;padding:4px 12px;display:inline-block;margin-bottom:10px">${rotulo}</div>
    <div style="background:#1b1b1b;border:3px solid #000;border-radius:16px;padding:14px;box-shadow:4px 4px 0 #000">
      <div style="font:900 15px Oswald;color:#fff;text-transform:uppercase">🏁 Fim de papo</div>
      <div style="font:700 11px system-ui;color:rgba(255,255,255,.5);margin:2px 0 11px">Vocês jogam de novo?</div>
      <div style="display:flex;gap:8px">
        <div style="flex:1;text-align:center;background:${GOLD};border:2.5px solid #000;border-radius:10px;font:900 12px Oswald;color:#000;padding:10px 0">🔨 MESMO TIME</div>
        <div style="flex:1;text-align:center;background:#fff;border:2.5px solid #000;border-radius:10px;font:900 12px Oswald;color:#000;padding:10px 0">🎲 NOVO LEILÃO</div>
      </div>
      <div style="font:900 11px Oswald;color:#FFDD70;text-align:center;padding:7px 0 2px">👆 Toque no seu voto pra ficar PRONTO!</div>
      ${miolo}
      <div style="display:flex;justify-content:center;gap:24px;padding-top:10px;margin-top:10px;border-top:2px solid rgba(255,255,255,.2)">
        <span style="font:700 11px system-ui;color:rgba(255,255,255,.7);text-decoration:underline">🏠 Voltar pro menu</span>
        <span style="font:700 11px system-ui;color:rgba(255,255,255,.7);text-decoration:underline">🚪 Sair da sala</span>
      </div>
    </div>
  </div>`

// cópia fiel do que está no código (screens.tsx → GrupoOnlineBox)
const BLOCO = (previa) => `
  <div style="border:3px solid #000;border-radius:12px;padding:12px;background:rgba(27,122,61,.22);box-shadow:3px 3px 0 #0C0C0C;margin-top:12px">
    ${previa ? `<div style="display:inline-block;font:900 9.5px Oswald;letter-spacing:.8px;text-transform:uppercase;background:${GOLD};color:#0C0C0C;border:2px solid #000;border-radius:999px;padding:2px 8px;margin-bottom:8px">👁️ prévia — só você vê isto (você é Lenda)</div>` : ''}
    <div style="font:900 13.5px Oswald;color:#fff;text-transform:uppercase;line-height:1;margin-bottom:6px">📱 Grupo de quem joga online</div>
    <div style="font:700 11px system-ui;color:rgba(255,255,255,.7);line-height:1.45;margin-bottom:11px">
      Sem galera pra chamar? No grupo tem gente marcando pregão <b style="color:#fff">todo dia</b> — e é de lá que saem as ligas.
    </div>
    <div style="background:${GREEN};border:3px solid #000;border-radius:11px;text-align:center;font:900 13.5px Oswald;color:#fff;padding:11px 0;box-shadow:3px 3px 0 #0C0C0C">👑 ENTRAR NO GRUPO — VIRE LENDA</div>
    <div style="font:700 10.5px system-ui;color:rgba(255,255,255,.5);line-height:1.45;margin-top:9px">
      🔑 O grupo é do <b style="color:#fff">Lenda</b> — é o que segura a bagunça e mantém a turma boa. Assim que o apoio cair, o Diego te põe no grupo.
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{background:#0a0a0a;padding:34px;font-family:system-ui}</style>
</head><body>
  <div style="font:900 26px Oswald;color:#fff;text-transform:uppercase;margin-bottom:4px">📱 O grupo, do jeito que está no ar</div>
  <div style="font:700 13px system-ui;color:rgba(255,255,255,.5);margin-bottom:22px;max-width:900px;line-height:1.5">
    Ele aparece no <b style="color:#fff">fim de uma partida online</b>, logo acima da linha de sair. Cópia fiel do que está codado — mesmas cores, mesmo texto, mesma ordem.
  </div>
  <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
    ${tela('👤 O que a galera vê', '#E8503A', BLOCO(false))}
    ${tela('👑 O que VOCÊ vê (prévia ligada)', GOLD, BLOCO(true))}
    ${tela('👑 O que outro Lenda vê', '#fff', '')}
  </div>
  <div style="margin-top:24px;font:700 12px system-ui;color:rgba(255,255,255,.45);max-width:1250px;line-height:1.7">
    O 3º quadro não está vazio por engano: <b style="color:#fff">quem já é Lenda (ou dono de batismo) não vê nada</b> — foi você que pediu, e está certo, quem pagou já está no grupo.<br>
    Na sua conta a prévia está ligada, então você vê o bloco <b style="color:${GOLD}">com o selo dourado</b> — é assim que dá pra aprovar o desenho sem deixar de ser Lenda.<br>
    O botão leva pra tela de <b style="color:#fff">Apoiar</b> com o card do Lenda aceso. <b style="color:#fff">Não existe link de WhatsApp no código</b> — a entrada no grupo é você quem faz, depois do pagamento.
  </div>
</body></html>`

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch(existsSync(CHROME) ? { executablePath: CHROME } : {})
const page = await browser.newPage({ viewport: { width: 1330, height: 800 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(700)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`✅ ${saida}`)
