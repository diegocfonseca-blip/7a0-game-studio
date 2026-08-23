// ─── 📧 MOCKUP: E-MAIL MARKETING "olha o tanto que mudou" (Diego 23/08) ──────
//
// Pedido: *"conseguimos enviar pra todos e-mail marketing com todas novidades
// do jogo? … pelo nosso e-mail contato@leilaolegends.com … muita gente entrou
// há um mês e nunca mais voltou e não sabe o tanto que mudou … um mockup de
// tantas novidades: escudos, mascotes, campinho da várzea e iniciando na
// várzea, além de muitas outras coisas"*.
//
// Números do banco na hora do pedido: 7.706 contas · 2.611 sumidos há 30+ dias
// · 6.205 há 14+ dias. Este arquivo é o DESENHO do e-mail (o e-mail real vai em
// HTML de e-mail — tabelas e estilo inline — mas com ESTA cara). Largura 600px
// = padrão de e-mail. ⚠️ SÓ DESENHO — aguardando OK visual do Diego.
//   node scripts/mockup-email-novidades.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'email-novidades.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img64 = p => { try { return `data:image/webp;base64,${readFileSync(p).toString('base64')}` } catch { return '' } }
// escudos reais dos batismos (no e-mail real: PNGs hospedados no site)
const ESCUDOS = [
  'src/escalacao/img/papao-escudo.webp',
  'src/escalacao/img/leao-estradinha-escudo.webp',
  'src/escalacao/img/theuzudo-escudo.webp',
  'src/escalacao/img/saoluiz-escudo.webp',
  'src/escalacao/img/coringas-escudo.webp',
].map(img64).filter(Boolean)

const INK = '#0C0C0C', GOLD = '#FFC400', RED = '#C2452F', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const nov = (emoji, titulo, texto, borda = INK) => `
<div style="background:#fff;border:3px solid ${borda};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:11px 13px;margin-bottom:10px">
  <div style="display:flex;gap:10px;align-items:flex-start">
    <span style="font-size:24px;line-height:1.1">${emoji}</span>
    <div>
      <div style="${OSW};font-size:14.5px;text-transform:uppercase;line-height:1.15">${titulo}</div>
      <div style="font-weight:600;font-size:11.5px;line-height:1.45;color:rgba(12,12,12,.75);margin-top:3px">${texto}</div>
    </div>
  </div>
</div>`

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#d8d2c0;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:24px 0}
.mail{width:600px;margin:0 auto;background:#F4ECD6;border:1px solid rgba(0,0,0,.15)}
.remet{background:#fff;border-bottom:1px solid rgba(0,0,0,.12);padding:10px 18px;font-size:11px;font-weight:700;color:rgba(0,0,0,.6)}
.remet b{color:${INK}}
.topo{background:linear-gradient(150deg,#1c1c1e,#0C0C0C 60%,#26221a);padding:22px 22px 20px;color:#fff;text-align:center}
.marca{${OSW};font-size:20px;color:#fff}
.marca b{color:${GOLD}}
.topo h1{${OSW};font-size:34px;line-height:1.02;text-transform:uppercase;margin:12px 0 0;color:${GOLD}}
.topo p{font-size:13px;font-weight:600;color:#EDE7D3;line-height:1.45;margin:10px auto 0;max-width:480px}
.corpo{padding:18px 20px 6px}
.cta{display:block;background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};${OSW};font-size:17px;text-transform:uppercase;text-align:center;color:${INK};padding:14px 10px;margin:14px 20px 6px;text-decoration:none}
.sub-cta{text-align:center;font-size:11px;font-weight:700;color:rgba(12,12,12,.55);margin:8px 0 16px}
.rodape{background:#EFE6CC;border-top:1px solid rgba(0,0,0,.12);padding:13px 20px;text-align:center;font-size:10px;font-weight:600;color:rgba(12,12,12,.55);line-height:1.6}
.rodape a{color:rgba(12,12,12,.55)}
.escudos{display:flex;justify-content:center;gap:12px;align-items:center;background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:12px 10px 8px;margin-bottom:10px;flex-wrap:wrap}
.escudos .tit{width:100%;${OSW};font-size:14.5px;text-transform:uppercase;text-align:center;margin:0 0 4px}
.escudos img{height:58px;width:auto}
.escudos .leg{width:100%;text-align:center;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.75);margin-top:6px;line-height:1.45}
</style>
<div class="mail">
  <div class="remet">De: <b>Leilão Legends · contato@leilaolegends.com</b><br>Assunto: <b>Você não vai reconhecer o jogo ⚽🔨</b></div>
  <div class="topo">
    <div class="marca">⚽ Leilão <b>Legends</b></div>
    <h1>Você não vai<br>reconhecer o jogo</h1>
    <p>Você entrou, montou um time, deu uma olhada… e a gente <b>não parou mais</b>. Olha o que mudou desde a sua última visita: 👇</p>
  </div>
  <div class="corpo">
    ${nov('🪜', 'Agora TODO MUNDO começa na várzea', 'Campinho de terra, trave torta e um sonho: subir da <b>Várzea</b> até a <b>Série A</b>. Cada acesso destrava jogador melhor no pregão — a escada inteira é sua.', GREEN)}
    <div class="escudos">
      <p class="tit">🛡️ Clubes BATIZADOS pela galera</p>
      ${ESCUDOS.map(s => `<img src="${s}">`).join('')}
      <p class="leg">Jogadores viraram DONOS de clube: escudo próprio, mascote que carimba a tela no gol e o nome na pirâmide. O seu também pode ter. 👑</p>
    </div>
    ${nov('🏆', 'Copa do Brasil, Supercopa, Liberta e Copa do Mundo', 'A carreira ganhou mata-mata de verdade — e de 10 em 10 temporadas o mundo para pra <b>Copa do Mundo Legends</b> de 24 seleções.')}
    ${nov('🏅', 'Salas online com estante de troféus', 'A sala dos amigos agora guarda a história: rank somando temporadas, estante de taças de cada um — e o <b>Troféu Mico</b> pro lanterna. 💀')}
    ${nov('📺', 'A TV paga pra ver seu clube', 'A <b>Rede Martelo TV</b> deposita cota por temporada — e paga <b>cota extra</b> se você postar um vídeo do seu jogo marcando @leilaolegendscom.', ROXO)}
    ${nov('🎭', 'O jogo criou vida', 'Eventos de vestiário, crise financeira, jornal da temporada, banco pra capitalizar o clube, departamento médico, agência de jogadores… e o leilão às cegas continua sendo o coração de tudo. 🔨')}
  </div>
  <a class="cta">⚽ Voltar pro meu time — leilaolegends.com</a>
  <p class="sub-cta">Grátis, direto do navegador — seu time continua onde você deixou.</p>
  <div class="rodape">
    Você recebeu este e-mail porque criou uma conta no Leilão Legends.<br>
    Não quer mais receber as novidades? <a>Clique aqui pra sair da lista</a> — sem mágoa. 🤝
  </div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 660, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
