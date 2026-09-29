// ─── 💛 MOCKUP: TELA DE PLANOS "ÁGUA NA BOCA" (Diego 29/09) ──────────────────
//
// Pedido: *"se vc pudesse dar mais água na boca pra quem vê os planos e mostrar
// como se tivesse vindo mais coisas… pra quem olhar ter vontade de comprar o plano
// Craque, Lenda e Batismo, como seria?"*
//
// A ideia: MOSTRAR em vez de listar. Hoje a tela de planos é texto (lista de
// benefícios). Aqui cada plano ganha uma PRÉVIA desenhada com as peças reais do
// jogo — o nome prateado/dourado na sala, os controles do Manual, a nota na carta,
// e no Batismo o escudo + mascote + camisa de verdade (Al Takhadao / Neymarzetti)
// com os lugares onde a mascote aparece.
//
// ⚠️ SÓ DESENHO — nada disto está no jogo. A faixa "🔜 vem por aí" é SUGESTÃO de
// teaser: o Diego decide o que entra de verdade.
//   node scripts/mockup-planos-agua-na-boca.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'planos-agua-na-boca.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const img = f => `data:image/webp;base64,${readFileSync(f).toString('base64')}`
const ESC_AL = img('src/escalacao/img/al-takahdao-escudo.webp'), MAS_AL = img('src/escalacao/img/al-takahdao-mascote.webp'), CAM_AL = img('scripts/kits/al-takahdao-camisa.webp')
const ESC_NEY = img('src/escalacao/img/neymarzetti-escudo.webp'), MAS_NEY = img('src/escalacao/img/neymarzetti-mascote.webp')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const G_PRATA = 'linear-gradient(160deg,#F4F7FB,#CBD4DE 52%,#9BA7B5)'
const G_OURO = 'linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const G_BEGE = 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'
const HOLO = `background-image:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.7) 48%,transparent 62%);background-size:250% 250%;background-position:40% 40%`

// uma linha da SALA (lista de técnicos), como no jogo
const linha = ({ grad, nome, selo = '', esc = null, mas = null, holo = false, ink = INK }) => `
<div style="position:relative;overflow:hidden;background:${grad};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:${esc ? '4px 8px' : '8px 10px'};display:flex;align-items:center;gap:8px;margin-bottom:7px;color:${ink}">
  ${holo ? `<div style="position:absolute;inset:0;${HOLO};pointer-events:none"></div>` : ''}
  ${esc ? `<img src="${esc}" style="height:34px;position:relative">` : `<b style="width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid ${INK};display:flex;align-items:center;justify-content:center;${OSW};font-size:13px;position:relative">${nome[0]}</b>`}
  <b style="${OSW};font-size:14px;text-transform:uppercase;flex:1;position:relative">${nome} ${selo}</b>
  ${mas ? `<img src="${mas}" style="height:44px;margin:-8px 0 -10px;position:relative;transform:rotate(4deg)">` : ''}
</div>`

const secao = (n, tag = '') => `<div style="display:flex;align-items:center;gap:8px;margin:18px 0 10px">
  <span style="${OSW};font-size:16px;text-transform:uppercase">${n}</span>
  ${tag ? `<span style="margin-left:auto;${OSW};font-size:9px;text-transform:uppercase;letter-spacing:.08em;border:2px solid ${INK};border-radius:999px;padding:2px 9px;background:#fff">${tag}</span>` : ''}
</div>`
const ok = t => `<div style="display:flex;gap:7px;align-items:flex-start;margin-top:5px"><span style="color:${GREEN};font-weight:900;font-size:12px;line-height:1.35">✓</span><span style="font-weight:700;font-size:11.5px;line-height:1.35">${t}</span></div>`

// ── cabeçalho de plano (cor do tier + preço) ──
const cab = (grad, emoji, nome, preco, quando, frase, ink = INK, holo = true) => `
<div style="background:${grad};padding:11px 13px;position:relative;overflow:hidden;color:${ink}">
  ${holo ? `<div style="position:absolute;inset:0;${HOLO}"></div>` : ''}
  <div style="display:flex;align-items:center;gap:8px;position:relative">
    <span style="${OSW};font-size:20px;text-transform:uppercase">${emoji} ${nome}</span>
    <span style="margin-left:auto;text-align:right"><span style="display:block;${OSW};font-size:18px;line-height:1">${preco}</span><span style="display:block;font-weight:800;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;opacity:.8">${quando}</span></span>
  </div>
  <p style="margin:4px 0 0;font-weight:700;font-size:11.5px;line-height:1.35;position:relative">${frase}</p>
</div>`
const cta = (txt, bg, cor = INK) => `<div style="background:${bg};color:${cor};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};${OSW};font-size:14px;text-align:center;text-transform:uppercase;padding:11px 8px;margin-top:12px">${txt}</div>`
const card = inner => `<div style="background:#fff;border:3.5px solid ${INK};border-radius:17px;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:14px">${inner}</div>`
// a "vitrine": quadro creme com as prévias desenhadas
const vitrine = (titulo, inner) => `<div style="background:${CREME};border:2.5px solid ${INK};border-radius:13px;padding:9px 10px;margin:10px 0 4px">
  <p style="margin:0 0 7px;${OSW};font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:rgba(12,12,12,.55)">${titulo}</p>${inner}</div>`
const mini = (rot, inner) => `<div style="flex:1;min-width:0;background:#fff;border:2.5px solid ${INK};border-radius:10px;box-shadow:2px 2px 0 ${INK};padding:7px 7px 8px;text-align:center">
  ${inner}<p style="margin:5px 0 0;font-weight:800;font-size:9px;line-height:1.25">${rot}</p></div>`
// uma carta do jogo com a NOTA visível (a coisa que o gratuito não vê)
const cartaNota = (grad, nome, nota, ink = INK, holo = true) => `
<div style="position:relative;overflow:hidden;width:76px;margin:0 auto;background:${grad};border:2.5px solid ${INK};border-radius:9px;box-shadow:2px 3px 0 ${INK};padding:5px;color:${ink};text-align:left">
  ${holo ? `<div style="position:absolute;inset:0;${HOLO};pointer-events:none"></div>` : ''}
  <span style="${OSW};background:${INK};color:#fff;border-radius:4px;font-size:7px;padding:1px 4px;position:relative">ATA</span>
  <div style="width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.5);border:2px solid rgba(0,0,0,.28);margin:5px auto;display:flex;align-items:center;justify-content:center;${OSW};font-size:12px;position:relative">${nome[0]}</div>
  <p style="margin:0;${OSW};font-size:9.5px;line-height:1.1;position:relative">${nome}</p>
  <p style="margin:2px 0 0;position:relative;display:flex;align-items:center;gap:3px"><span style="${OSW};font-size:13px;background:#fff;border:2px solid ${INK};border-radius:6px;padding:0 4px">${nota}</span><span style="font-size:7px;font-weight:800;opacity:.7">NÍVEL</span></p>
</div>`
const controles = `<div style="display:flex;gap:3px;justify-content:center;flex-wrap:wrap">${['¼×', '½×', '<b style="background:#0C0C0C;color:#fff;border-radius:5px;padding:0 5px">2×</b>', '4×', '⏭ PULAR'].map(v => `<span style="${OSW};font-size:9px;border:2px solid ${INK};border-radius:6px;padding:2px 5px;background:#fff">${v}</span>`).join('')}</div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#cfc8b4;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:20px 0}
.fone{width:430px;margin:0 auto;background:${CREME};border:3px solid ${INK};border-radius:20px;overflow:hidden}
.topo{background:${INK};color:#fff;padding:12px 15px;display:flex;align-items:center;gap:10px}
.topo .t{${OSW};font-size:17px;text-transform:uppercase;color:${GOLD}} .topo .x{margin-left:auto;border:2px solid rgba(255,255,255,.35);border-radius:9px;padding:2px 9px;${OSW};font-size:13px}
.corpo{padding:14px 15px 22px}
.hero{background:${INK};color:#fff;border:3.5px solid ${INK};border-radius:17px;box-shadow:4px 4px 0 ${INK};padding:14px 13px 12px;position:relative;overflow:hidden}
.hero h1{${OSW};font-size:28px;line-height:.95;text-transform:uppercase;margin:0 0 6px} .hero h1 b{color:${GOLD}}
.hero p{margin:0;font-weight:700;font-size:11.5px;line-height:1.4;color:rgba(255,255,255,.8)}
.nota{text-align:center;font-weight:700;font-size:10px;color:rgba(12,12,12,.5);margin-top:14px;line-height:1.5}
.breve{background:linear-gradient(160deg,#241d0c,#141414 60%,#1d1708);border:3.5px solid ${INK};border-radius:17px;box-shadow:4px 4px 0 ${INK};padding:12px 13px;color:rgba(255,255,255,.9)}
.breve h3{${OSW};font-size:16px;text-transform:uppercase;color:${GOLD};margin:0 0 8px}
.breve .it{display:flex;gap:9px;align-items:center;background:rgba(255,255,255,.07);border:2px solid rgba(255,196,0,.35);border-radius:11px;padding:8px 10px;margin-top:7px}
.breve .it b{${OSW};font-size:12.5px;text-transform:uppercase;display:block;color:#fff} .breve .it span{font-weight:700;font-size:10.5px;color:rgba(255,255,255,.7)}
.breve .lock{margin-left:auto;${OSW};font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;border:2px solid ${GOLD};color:${GOLD};border-radius:999px;padding:2px 7px;white-space:nowrap}
</style><body><div class="fone">
<div class="topo"><span class="t">💛 Apoiar o Leilão Legends</span><span class="x">✕</span></div>
<div class="corpo">

  <!-- HERO: a mesma sala, três jeitos de entrar -->
  <div class="hero">
    <h1>Na mesma sala,<br><b>cada um entra de um jeito.</b></h1>
    <p>O jogo é grátis e ninguém leva vantagem em campo. O que o apoio muda é <b style="color:#fff">como o seu clube aparece</b> — pra você e pra todo mundo.</p>
    <div style="background:${CREME};border:2.5px solid ${INK};border-radius:13px;padding:9px 10px 3px;margin-top:11px;color:${INK}">
      <p style="margin:0 0 7px;${OSW};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(12,12,12,.55)">🌐 Técnicos na sala</p>
      ${linha({ grad: G_OURO, nome: 'Neymarzetti', selo: '👑', esc: ESC_NEY, mas: MAS_NEY, holo: true })}
      ${linha({ grad: G_OURO, nome: 'Al Takhadao FC', selo: '👑', esc: ESC_AL, mas: MAS_AL, holo: true })}
      ${linha({ grad: G_PRATA, nome: 'Bolacha FC', selo: '⭐', holo: true })}
      ${linha({ grad: G_BEGE, nome: 'Seu Time', selo: '' })}
    </div>
    <p style="margin:8px 0 0;font-size:10.5px;text-align:center;color:rgba(255,255,255,.65)">👆 é assim que os outros te veem hoje. <b style="color:${GOLD}">Bora mudar isso?</b></p>
  </div>

  ${secao('⚡ Paga uma vez', 'é seu pra sempre')}

  <!-- CRAQUE -->
  ${card(`
    ${cab(G_PRATA, '⭐', 'Craque', 'R$ 19,90', 'pagamento único', 'Manda no ritmo do jogo, vê o nível dos jogadores até Craque e brilha em prata na sala.')}
    <div style="padding:10px 13px 13px">
      ${vitrine('o que muda na sua tela', `
        ${linha({ grad: G_PRATA, nome: 'Seu Time', selo: '⭐', holo: true })}
        <div style="display:flex;gap:7px;margin-top:3px">
          ${mini('🎮 Modo Manual: pausa, acelera 2×/4×, pula rodada', controles)}
          ${mini('🔎 vê o NÍVEL do jogador: até Craque', cartaNota(G_PRATA, 'Zé Craque', 82))}
        </div>`)}
      ${ok('<b>🕵️ Olheiro:</b> chance de achar jogador <b>fora do leilão</b>, de nível até Craque')}
      ${ok('<b>4 carreiras</b> salvas ao mesmo tempo · grupo VIP no zap com o Diego')}
      ${cta('Escolher Craque · R$ 19,90', G_PRATA)}
    </div>`)}

  <!-- LENDA -->
  ${card(`
    ${cab(G_OURO, '👑', 'Lenda', 'R$ 39,90', 'pagamento único · ou +R$ 20 se já é Craque', 'Tudo do Craque, sem teto: vê o nível até Lenda, acha jogador fora do leilão até Lenda, brilha em ouro e cria a sua liga.')}
    <div style="padding:10px 13px 13px">
      ${vitrine('o que muda na sua tela', `
        ${linha({ grad: G_OURO, nome: 'Seu Time', selo: '👑', holo: true })}
        <div style="display:flex;gap:7px;margin-top:3px">
          ${mini('🔎 vê o NÍVEL do jogador: até 👑 Lenda', cartaNota(G_OURO, 'Pelé', 96))}
          ${mini('🏆 Minhas Ligas: até 5, com a sua turma', `<div style="${OSW};font-size:22px;line-height:1">🏆</div><div style="${OSW};font-size:9px;background:${INK};color:${GOLD};border-radius:6px;padding:2px 6px;display:inline-block;margin-top:3px">LIGA DOS CRIA</div>`)}
          ${mini('🎨 ouro — ou a cor que você escolher', `<div style="display:flex;gap:3px;justify-content:center">${['#FFC400', '#8B5CF6', '#2E9E5B', '#E8503A'].map(c => `<span style="width:16px;height:16px;border-radius:50%;background:${c};border:2px solid ${INK}"></span>`).join('')}</div>`)}
        </div>`)}
      ${ok('<b>🕵️ Olheiro:</b> chance de achar jogador <b>fora do leilão</b>, de nível até Lenda')}
      ${ok('<b>6 carreiras</b> salvas · 🎮 Modo Manual · grupo VIP no zap')}
      ${cta('Escolher Lenda · R$ 39,90', G_OURO)}
    </div>`)}

  <!-- BATISMO -->
  ${card(`
    ${cab('linear-gradient(160deg,#1a1a1a,#0C0C0C)', '🖋', 'Batismo', 'R$ 59,90', 'a partir de · uma vez · Série A R$ 69,90', 'O SEU clube entra no jogo de todo mundo — com escudo, mascote e manto desenhados pra você.', '#fff', false)}
    <div style="padding:10px 13px 13px">
      ${vitrine('as artes são suas (exemplo real: Al Takhadao FC)', `
        <div style="display:flex;gap:8px;align-items:flex-end;justify-content:center;background:#fff;border:2.5px solid ${INK};border-radius:10px;padding:8px 6px 6px">
          <div style="text-align:center"><img src="${ESC_AL}" style="height:72px"><p style="margin:3px 0 0;${OSW};font-size:9px;text-transform:uppercase">🛡️ escudo</p></div>
          <div style="text-align:center"><img src="${MAS_AL}" style="height:96px"><p style="margin:3px 0 0;${OSW};font-size:9px;text-transform:uppercase">🐦 mascote</p></div>
          <div style="text-align:center"><img src="${CAM_AL}" style="height:84px"><p style="margin:3px 0 0;${OSW};font-size:9px;text-transform:uppercase">🎽 manto</p></div>
        </div>`)}
      ${vitrine('e onde tudo isso aparece', `
        <div style="display:flex;gap:6px">
          ${mini('👑 entrada de gala: a sala inteira para pra te ver chegar', `<div style="background:radial-gradient(ellipse at 50% 30%,#3a2e0a,#000 75%);border-radius:7px;padding:6px 4px 2px"><img src="${ESC_AL}" style="height:30px;filter:drop-shadow(0 0 6px rgba(255,196,0,.9))"><p style="margin:2px 0 0;${OSW};font-size:7px;color:${GOLD};letter-spacing:2px">CHEGOU NA SALA</p><img src="${MAS_AL}" style="height:26px;float:left;margin:-8px 0 0 -2px"></div>`)}
          ${mini('⚽ carimbo no gol: a mascote comemora cada bola na rede', `<div style="position:relative;background:${GREEN};border-radius:7px;height:56px;overflow:hidden"><span style="position:absolute;left:4px;top:4px;${OSW};font-size:11px;color:#fff">2 × 0</span><img src="${MAS_AL}" style="position:absolute;right:2px;bottom:-4px;height:54px;transform:rotate(-8deg)"></div>`)}
          ${mini('📋 tabela, jornal e ⭐ Champions com o seu escudo', `<div style="text-align:left;background:#fff;border:2px solid ${INK};border-radius:7px;padding:3px 4px">${[['1º', ESC_AL, 'Al Takhadao', true], ['2º', null, 'Bolacha FC', false]].map(([p, e, n, me]) => `<div style="display:flex;align-items:center;gap:3px;${OSW};font-size:8px;padding:2px 0;${me ? `background:${G_OURO};border-radius:4px;padding:2px 3px` : ''}">${p} ${e ? `<img src="${e}" style="height:12px">` : '<span style="width:12px;height:12px;border-radius:50%;background:#ddd;display:inline-block"></span>'} ${n}</div>`).join('')}</div>`)}
        </div>`)}
      ${ok('<b>Tudo do Lenda incluído</b> + <b>sócio pra sempre</b> (sem mensalidade): 30 🪙 a cada 30 dias, estádio com o seu nome')}
      ${ok('<b>Selo de Fundador</b> nº <b>81</b> e seu nome no mural do jogo')}
      ${ok('<b>8 carreiras</b> salvas · seu clube disputa a pirâmide de TODO mundo que joga')}
      <div style="background:#FFF6DE;border:2.5px dashed ${INK};border-radius:11px;padding:8px 10px;margin-top:10px;font-weight:800;font-size:10.5px;line-height:1.4">🖋 Como funciona: você manda o nome e a ideia (ou a arte) · o Diego desenha escudo, mascote e manto · em até 7 dias seu clube está no ar, num post com a sua cara.</div>
      ${cta('Quero batizar meu clube →', INK, GOLD)}
    </div>`)}

  <!-- vem por aí: o teaser -->
  <div class="breve">
    <h3>✨ E vem mais por aí — só pra quem apoia</h3>
    <div class="it"><span style="font-size:22px">🚁</span><div><b>Entrada de gala do SEU jeito</b><span>cada clube batizado com a entrada própria: helicóptero, moto, fumaça…</span></div><span class="lock">batismo</span></div>
    <div class="it"><span style="font-size:22px">🛡️</span><div><b>Seu escudo na tela de TODO mundo</b><span>trocou o nome do clube? escudo e mascote seguem você pra qualquer sala</span></div><span class="lock">batismo</span></div>
    <p style="margin:9px 0 0;font-size:10px;color:rgba(255,255,255,.55);text-align:center">quem já apoiou recebe tudo isso sem pagar de novo 💛</p>
  </div>

  <p class="nota">Jogar continua grátis. Os planos mudam visual, ritmo e informação — <b>nunca a força dos jogadores</b>.</p>
</div></div></body>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 470, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
