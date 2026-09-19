// ─── 🥇 MOCKUP: BOLA DE OURO — no jornal e no Rank ──────────────────────────
//
// Ideia do Diego (19/09): *"quero q tenha do jogador q teve mais gols C
// assistência junto.. Esse jogdor será considerado o melhor do mundo no ano…
// Lembrando q N é o artilheiro e Tb N é o garçom. E o cara q conseguiu unir os
// dois juntos"*. Depois, com a arte na mão: *"agora também lançar um novo que
// seria Bola de Ouro… não importa se o cara ganhar vários anos seguidos ou não,
// mas teria que ser por temporada. Só não sei como seria o mockup disso… se o
// cara tem mil temporadas, não sei como apareceria uma por uma"*.
//
// 🧩 A DÚVIDA DELE É O PROBLEMA DE VERDADE, e tem resposta simples: **a lista não
//    mostra TEMPORADAS, mostra DONOS**. Mil temporadas cabem numa tabela de 20
//    linhas, porque os ganhadores são muito menos que os anos — e as temporadas de
//    cada um entram como etiquetas na própria linha dele.
//
// 🎨 A arte é a que ELE mandou. ⚠️ A original vinha com "FIFA BALLON D'OR" escrito
//    na bola — marca de terceiro, não pode entrar no jogo. O painel foi
//    reconstruído (superfície quadrática ajustada nos pixels limpos do próprio
//    painel + grão, com a borda desvanecida na margem já limpa), então não sobrou
//    letra, fantasma nem emenda. O resto da arte é exatamente a dele.
//
// Rodar: node scripts/mockup-melhor-mundo.mjs [--saida /tmp/melhor.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/melhor-mundo.png')

const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const ARTE = `data:image/webp;base64,${fs.readFileSync('src/escalacao/img/jornal-bola-ouro-v1.webp').toString('base64')}`

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', VERDE = '#1B7A3D'

const bloco = (titulo, nota, dentro) => `
  <section style="margin-bottom:18px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:16px;letter-spacing:.5px;color:${INK};text-transform:uppercase">${titulo}</div>
    <div style="font-size:11.5px;color:rgba(12,12,12,.62);margin:1px 0 8px;line-height:1.45">${nota}</div>
    ${dentro}
  </section>`

const caixa = (dentro, fundo = '#fff', pad = 12) => `
  <div style="background:${fundo};border:3px solid ${INK};border-radius:12px;padding:${pad}px;box-shadow:3px 3px 0 rgba(0,0,0,.2);overflow:hidden">${dentro}</div>`

// ── 1) o bloco no JORNAL, com a arte dele ──────────────────────────────────
const jornal = caixa(`
  <div style="margin:-12px -12px 0;position:relative">
    <img src="${ARTE}" style="width:100%;display:block">
    <div style="position:absolute;left:0;right:0;bottom:0;padding:22px 12px 9px;background:linear-gradient(to top,rgba(0,0,0,.92),rgba(0,0,0,0))">
      <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:10.5px;letter-spacing:1.4px;color:${GOLD}">🥇 BOLA DE OURO · TEMPORADA 25</div>
      <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:24px;line-height:1.05;color:#fff">Julián Álvarez</div>
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.62)">Atlético de Madrid · 2025 — Neymarzetti</div>
    </div>
  </div>
  <div style="display:flex;gap:10px;align-items:baseline;justify-content:center;margin-top:10px">
    <span><b style="font-family:Oswald,sans-serif;font-weight:700;font-size:20px">24</b><span style="font-size:9px;font-weight:800;color:rgba(12,12,12,.5)"> GOLS</span></span>
    <span style="font-size:15px;color:rgba(12,12,12,.35);font-weight:800">+</span>
    <span><b style="font-family:Oswald,sans-serif;font-weight:700;font-size:20px">13</b><span style="font-size:9px;font-weight:800;color:rgba(12,12,12,.5)"> ASSIST.</span></span>
    <span style="font-size:15px;color:rgba(12,12,12,.35);font-weight:800">=</span>
    <span style="background:${GOLD};border:2.5px solid ${INK};border-radius:8px;padding:1px 10px;box-shadow:2px 2px 0 ${INK}">
      <b style="font-family:Oswald,sans-serif;font-weight:700;font-size:20px;color:${INK}">37</b></span>
  </div>`, '#fff')

// ── 2) a seção no RANK — o jeito de caber MIL temporadas ───────────────────
const anos = (lista, mais) => `
  <span style="display:inline-flex;flex-wrap:wrap;gap:3px;vertical-align:middle">
    ${lista.map(t => `<span style="font-size:8.5px;font-weight:800;color:#8a6d1f;background:rgba(255,196,0,.20);border-radius:4px;padding:0 4px">${t}</span>`).join('')}
    ${mais ? `<span style="font-size:8.5px;font-weight:800;color:rgba(12,12,12,.4)">+${mais}</span>` : ''}
  </span>`

const linhaDono = (i, nome, carta, n, lista, mais, voce) => `
  <tr style="border-top:1px solid rgba(0,0,0,.1);font-weight:600;${voce ? 'background:rgba(255,196,0,.14)' : ''}">
    <td style="padding:4px 4px 4px 0;vertical-align:top">${i}</td>
    <td style="vertical-align:top">
      <div style="font-weight:700">${voce ? '👤 ' : ''}${nome}</div>
      <div style="font-size:8.5px;font-weight:700;color:rgba(0,0,0,.45);line-height:1.15">${carta}</div>
      <div style="margin-top:3px">${anos(lista, mais)}</div>
    </td>
    <td style="text-align:center;vertical-align:top"><b style="font-family:Oswald,sans-serif;font-weight:700;font-size:17px">${n}</b><span style="font-size:11px"> 🥇</span></td>
  </tr>`

const rank = caixa(`
  <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">🥇 BOLA DE OURO · TODOS OS TEMPOS</div>
  <div style="font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin-bottom:9px">Quem mais foi o melhor do mundo — gols + assistências somados, liga e copas.</div>
  <table style="width:100%;font-size:12px;border-collapse:collapse">
    <thead><tr style="text-align:left;font-size:9.5px;font-weight:800;color:rgba(0,0,0,.45)">
      <th style="padding-right:4px">#</th><th>Jogador · temporadas</th><th style="text-align:center">Bolas</th></tr></thead>
    <tbody>
      ${linhaDono(1, 'Zico', 'Flamengo · 1981', 12, ['T3', 'T5', 'T6', 'T9'], 8)}
      ${linhaDono(2, 'Julián Álvarez', 'Atlético de Madrid · 2025', 4, ['T18', 'T21', 'T24', 'T25'], 0, true)}
      ${linhaDono(3, 'Romário', 'Vasco · 2000', 3, ['T11', 'T12', 'T17'], 0)}
      ${linhaDono(4, 'Cafu', 'Milan · 2004', 1, ['T7'], 0)}
    </tbody>
  </table>
  <div style="font-size:9.5px;font-weight:700;color:rgba(0,0,0,.42);margin-top:9px;text-align:center;line-height:1.4">
    A lista mostra os <b>donos</b>, não as temporadas — por isso mil temporadas cabem aqui.
  </div>`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:20px 18px 26px;width:430px}
</style></head><body>
  <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:25px;color:${INK};line-height:1.05">🥇 BOLA DE OURO</div>
  <div style="font-size:12px;color:rgba(12,12,12,.6);margin:3px 0 14px;line-height:1.5">
    O prêmio de quem <b>uniu os dois</b>: mais gols <b>+</b> assistências no ano. Não é o artilheiro, não é o garçom.
  </div>

  <div style="background:#FFF6E0;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2);margin-bottom:18px">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:${INK}">⚠️ TIREI O ESCRITO DA BOLA</div>
    <div style="font-size:12px;color:rgba(12,12,12,.78);margin-top:6px;line-height:1.55">
      A arte que você mandou veio com <b>“FIFA BALLON D'OR”</b> escrito na bola. Isso é <b>marca dos outros</b> — não dá pra pôr num jogo que está no ar, é o tipo de coisa que dá dor de cabeça de verdade.
      <br><br>Então apaguei <b>só o escrito</b> e refiz aquele painel da bola. <b>O resto é exatamente a tua arte</b>: mesmo estádio, mesma silhueta, mesmo ouro. Dá uma olhada aí embaixo e me diz se ficou bom.
      <br><br>📏 Ficou <b>1080×608 · 57 KB</b>, o mesmo peso da chuteira de ouro do artilheiro.
    </div>
  </div>

  ${bloco('1 · No jornal (por temporada)', 'Vem em <b>Os donos da temporada</b>, no topo — é o prêmio individual mais importante do ano.', jornal)}

  ${bloco('2 · No Rank — e a tua dúvida das mil temporadas', 'Você perguntou como caberia uma temporada por vez. <b>Não cabe, e não precisa</b>: a lista mostra <b>quem ganhou</b>, com as temporadas dele como etiquetas na linha. Quem tem 12 bolas ocupa <b>uma</b> linha, não 12.', rank)}

  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2)">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:14px;color:${INK}">📋 O RESTO, EM DUAS LINHAS</div>
    <div style="font-size:12px;color:rgba(12,12,12,.75);margin-top:5px;line-height:1.5">
      ✅ <b>O garçom de todos os tempos já está feito</b> — subiu antes da tua mensagem, e está no Rank do lado da artilharia, com o clube da carta embaixo do nome.
      <br><br>✅ <b>Começa a contar agora</b>, como você pediu: a Bola de Ouro é anotada no fim de cada temporada, a partir da próxima virada.
      <br><br>⚙️ <b>O motor já está pronto e testado</b> (gol + assistência, liga + todas as copas, o mundo inteiro, por carta, com desempate fixo pra não divergir entre os amigos na sala).
      <br><br>👉 <b>Falta só o teu OK</b> pra eu montar essas duas telas. Nada disso está no ar.
    </div>
  </div>
</body></html>`

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await nav.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: SAIDA, fullPage: true })
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
