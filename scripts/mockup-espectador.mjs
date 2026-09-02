#!/usr/bin/env node
// ─── 🎥 MOCKUP: MODO ESPECTADOR / TRANSMISSÃO (30/08) ────────────────────────
//
// Pedido do Diego: *"eu quero esse modo só pra mim e pro usuário q eu disser.
// Modo espectador, q é justamente p criar campeonatos e ver oq está se
// passando"*. Veio de uma sacada dele: o cara que organizou o campeonato do
// Instagram **teve que jogar no próprio torneio**, porque não existe jeito de
// só assistir.
//
// ── A DECISÃO QUE TIRA O RISCO ──────────────────────────────────────────────
// O espectador NÃO ENTRA NA SALA. Ele LÊ a sala de fora.
//
// Por que isso importa: hoje toda pessoa que entra numa sala ganha um ASSENTO
// (`player_index`), e assento é a parte mais perigosa do código — 224 usos, 126
// só no store, e é de onde vieram os bugs "virei bot" e "dei lance por outro".
// Conferido no banco em 30/08: o RLS de `game_rooms` e `room_players` já deixa
// QUALQUER UM LER (`SELECT ... true`); só escrever é travado. Então a
// transmissão é uma tela SÓ DE LEITURA, que não mexe em uma linha do jogo.
// Se ela quebrar, quebra sozinha — a partida nem fica sabendo que ela existe.
//
// ── 🚫 ANTI-SPOILER (regra do Diego) ────────────────────────────────────────
// O espectador vê QUEM já lacrou, nunca QUANTO. Se ele visse os envelopes antes
// do martelo, um organizador poderia contar pros amigos — e, pior, ele veria o
// resultado antes da animação, que é coisa que o Diego odeia.
//
//   node scripts/mockup-espectador.mjs --saida /tmp/espectador.png

import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'mockup-espectador.png')
const b64 = f => fs.readFileSync(f).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const CREME = '#F4ECD6', TINTA = '#0C0C0C', OURO = '#FFC400', VERDE = '#1B7A3D', ROXO = '#7C3AED', VERM = '#C2452F'

const tecnico = (nome, moedas, lacrou, cor) => `
  <div class="tec ${lacrou ? 'ok' : ''}">
    <span class="tec-cor" style="background:${cor}"></span>
    <span class="tec-nome">${nome}</span>
    <span class="tec-moedas">🪙 ${moedas}</span>
    <span class="tec-selo">${lacrou ? '🔒 lacrou' : '⏳ pensando'}</span>
  </div>`

const linhaTab = (p, time, j, pts, cor) => `
  <div class="tl"><span class="tl-p">${p}º</span><span class="tl-cor" style="background:${cor}"></span>
  <span class="tl-nome">${time}</span><span class="tl-j">${j}</span><span class="tl-pts">${pts}</span></div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url('${fonte(400)}') format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url('${fonte(600)}') format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url('${fonte(700)}') format('woff2');font-weight:700}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};font-family:Inter,system-ui,sans-serif;color:${TINTA};width:1180px;padding:28px 26px 34px}
.osw{font-family:Oswald;font-weight:700}
h1{font-family:Oswald;font-weight:700;font-size:36px;text-transform:uppercase;line-height:1}
.pil{display:inline-block;font-family:Oswald;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1.4px;
  background:${OURO};border:2.5px solid ${TINTA};border-radius:99px;padding:3px 12px;box-shadow:3px 3px 0 ${TINTA};margin-bottom:9px}
.lead{font-size:13px;font-weight:700;color:rgba(12,12,12,.6);margin-top:6px;line-height:1.45;max-width:760px}
.par{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px}
.tela{border:4px solid ${TINTA};border-radius:18px;background:#fff;box-shadow:6px 6px 0 ${TINTA};overflow:hidden}
.cab{background:${TINTA};color:#fff;padding:9px 15px;display:flex;justify-content:space-between;align-items:center}
.cab b{font-family:Oswald;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.6px}
.cab span{font-size:11px;font-weight:700;color:rgba(255,255,255,.6)}
.corpo{padding:14px 15px 16px;background:${CREME}}
/* entrada */
.campo{border:3px solid ${TINTA};border-radius:11px;background:#fff;padding:11px 13px;margin-bottom:9px}
.campo p{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:rgba(12,12,12,.5)}
.campo b{font-family:Oswald;font-weight:700;font-size:24px;letter-spacing:4px;display:block;margin-top:2px}
.big{display:block;width:100%;text-align:center;border:3px solid ${TINTA};border-radius:12px;background:${VERDE};color:#fff;
  font-family:Oswald;font-weight:700;font-size:17px;padding:11px;box-shadow:4px 4px 0 ${TINTA};text-transform:uppercase}
.aberta{border:3px solid ${TINTA};border-radius:11px;background:#fff;padding:9px 11px;margin-top:9px;display:flex;align-items:center;gap:9px}
.aberta b{font-family:Oswald;font-weight:700;font-size:14px;flex:1}
.aberta span{font-size:10.5px;font-weight:700;color:rgba(12,12,12,.5)}
.aberta i{font-style:normal;font-family:Oswald;font-weight:700;font-size:11px;background:${ROXO};color:#fff;border:2px solid ${TINTA};border-radius:7px;padding:3px 9px}
/* transmissão */
.faixa{display:flex;align-items:center;gap:9px;border:3px solid ${TINTA};border-radius:12px;background:${VERM};color:#fff;padding:8px 11px;margin-bottom:11px}
.faixa .ao{font-family:Oswald;font-weight:700;font-size:12px;background:#fff;color:${VERM};border-radius:99px;padding:2px 9px}
.faixa b{font-family:Oswald;font-weight:700;font-size:16px;flex:1}
.faixa span{font-size:11px;font-weight:700;color:rgba(255,255,255,.85)}
.setor{border:3px solid ${TINTA};border-radius:12px;background:${OURO};padding:10px 12px;margin-bottom:10px;text-align:center}
.setor p{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:rgba(12,12,12,.6)}
.setor b{font-family:Oswald;font-weight:700;font-size:22px;display:block;line-height:1.1;margin-top:1px}
.setor i{font-style:normal;font-size:11.5px;font-weight:700;color:rgba(12,12,12,.65)}
.relogio{font-family:Oswald;font-weight:700;font-size:34px;display:block;line-height:1}
.tec{display:flex;align-items:center;gap:8px;border:2.5px solid ${TINTA};border-radius:10px;background:#fff;padding:6px 9px;margin-bottom:5px}
.tec.ok{background:#EAF6EE}
.tec-cor{width:14px;height:14px;border:2px solid ${TINTA};border-radius:4px;flex:none}
.tec-nome{font-family:Oswald;font-weight:700;font-size:13.5px;flex:1}
.tec-moedas{font-size:11px;font-weight:800;color:rgba(12,12,12,.6)}
.tec-selo{font-size:10.5px;font-weight:800;width:74px;text-align:right}
.trava{border:3px solid ${TINTA};border-radius:11px;background:#FFF4CF;padding:9px 11px;margin-top:10px;font-size:11.5px;font-weight:700;line-height:1.4}
/* tabela */
.tl{display:flex;align-items:center;gap:8px;border-bottom:1.5px solid rgba(12,12,12,.1);padding:4px 2px}
.tl-p{font-family:Oswald;font-weight:700;font-size:12px;width:22px;color:rgba(12,12,12,.5)}
.tl-cor{width:12px;height:12px;border:2px solid ${TINTA};border-radius:3px;flex:none}
.tl-nome{flex:1;font-weight:800;font-size:12.5px}
.tl-j{font-size:11px;font-weight:700;color:rgba(12,12,12,.45);width:26px;text-align:right}
.tl-pts{font-family:Oswald;font-weight:700;font-size:14px;width:26px;text-align:right}
.sub{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:rgba(12,12,12,.45);margin:12px 0 5px}
.rod{text-align:center;font-size:12px;font-weight:700;color:rgba(12,12,12,.45);margin-top:20px}
.nota{font-size:11.5px;font-weight:700;color:rgba(12,12,12,.6);margin-top:9px;line-height:1.4}
</style></head><body>

<span class="pil">🎥 novo · só pra você e pra quem você indicar</span>
<h1>Modo Espectador</h1>
<p class="lead">Pra organizar campeonato sem ter que jogar no próprio torneio. O espectador <b>não entra na sala</b> —
ele lê a sala de fora, pelo código. Não pega assento, não dá lance, não aparece na tabela. A partida nem fica sabendo que ele existe.</p>

<div class="par">
  <div class="tela">
    <div class="cab"><b>1 · Entrar pra assistir</b><span>pela aba Online</span></div>
    <div class="corpo">
      <div class="campo"><p>Código da sala</p><b>4FTOS5</b></div>
      <span class="big">🎥 Assistir a sala</span>
      <p class="sub">salas rolando agora</p>
      <div class="aberta"><b>Resenha FC</b><span>6 de 8 · 2ª rodada</span><i>assistir</i></div>
      <div class="aberta"><b>Peladão da Firma</b><span>8 de 8 · pregão</span><i>assistir</i></div>
      <div class="aberta"><b>Copa dos Crias</b><span>4 de 6 · esperando</span><i>assistir</i></div>
      <p class="nota">👁️ Como você entra sem ocupar vaga, dá pra assistir até sala CHEIA — que é justamente o caso do campeonato de 20 jogadores.</p>
    </div>
  </div>

  <div class="tela">
    <div class="cab"><b>2 · A transmissão</b><span>atualiza sozinha</span></div>
    <div class="corpo">
      <div class="faixa"><span class="ao">● AO VIVO</span><b>Resenha FC</b><span>código 4FTOS5</span></div>

      <div class="setor">
        <p>Pregão · setor 3 de 5</p>
        <b>MEIO-CAMPO</b>
        <i>Zico · Flamengo · 1981</i>
        <span class="relogio">0:12</span>
      </div>

      <p class="sub">quem já lacrou · 4 de 6</p>
      ${tecnico('Bagres do Asfalto', 46, true, VERDE)}
      ${tecnico('Xurupitas FC', 31, true, ROXO)}
      ${tecnico('Manfré FC', 58, true, '#0135A3')}
      ${tecnico('Craques do Zap', 22, true, OURO)}
      ${tecnico('Peladão da Firma', 40, false, VERM)}
      ${tecnico('Resenha FC', 63, false, '#8B1A3A')}

      <div class="trava">🚫 <b>Você vê QUEM lacrou, nunca QUANTO.</b> O envelope só abre no martelo, igual pra todo mundo —
      senão o organizador saberia o resultado antes da animação, e ainda poderia contar pros amigos.</div>
    </div>
  </div>
</div>

<div class="par">
  <div class="tela">
    <div class="cab"><b>3 · A tabela, ao vivo</b><span>o que o organizador precisa anotar</span></div>
    <div class="corpo">
      ${linhaTab(1, 'Manfré FC', 12, 28, '#0135A3')}
      ${linhaTab(2, 'Xurupitas FC', 12, 25, ROXO)}
      ${linhaTab(3, 'Bagres do Asfalto', 12, 22, VERDE)}
      ${linhaTab(4, 'Resenha FC', 12, 18, '#8B1A3A')}
      ${linhaTab(5, 'Craques do Zap', 12, 14, OURO)}
      ${linhaTab(6, 'Peladão da Firma', 12, 9, VERM)}
      <p class="nota">📋 No fim da partida a transmissão mostra campeão, artilheiro e a tabela final —
      é o que o organizador copia pro grupo, sem precisar pedir print pra ninguém.</p>
    </div>
  </div>

  <div class="tela">
    <div class="cab"><b>4 · Quem pode assistir</b><span>trava por conta</span></div>
    <div class="corpo">
      <div class="aberta"><b>diego.c.fonseca@gmail.com</b><span>dono do jogo</span><i>✔️</i></div>
      <div class="aberta"><b>o organizador que você indicar</b><span>você me passa o e-mail</span><i>✔️</i></div>
      <div class="aberta" style="opacity:.5"><b>todo o resto</b><span>não vê nem o botão</span><i style="background:#ccc;color:#000">—</i></div>
      <p class="nota">🔒 Mesmo esquema do Salão dos Batismos: uma lista de e-mails no código. Quem não está nela não vê o botão
      e não consegue abrir a tela. Quando quiser soltar pra geral (ou só pra Lenda), é trocar uma linha.</p>
      <div class="trava">💡 <b>Por que isso é seguro:</b> a transmissão é SÓ LEITURA. Ela não escreve nada, não ocupa vaga e não
      toca no assento — que é a parte do código de onde vieram os bugs "virei bot" e "dei lance por outro". Se a transmissão
      quebrar, ela quebra sozinha: a partida continua igual.</div>
    </div>
  </div>
</div>

<p class="rod">⚽ Leilão Legends · mockup pra decisão — nada disso está no ar</p>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.waitForTimeout(400)
await p.screenshot({ path: saida, fullPage: true })
await b.close()
console.log(`${saida} · ${Math.round(fs.statSync(saida).size / 1024)} KB`)
