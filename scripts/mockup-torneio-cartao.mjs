#!/usr/bin/env node
// ─── 🏆🎫 MOCKUP: o cartão do TORNEIO no topo das salas abertas ─────────────
//
// Conversa de 25/09. O Diego procurava um jeito de dar "água na boca" pra quem
// joga ONLINE querer escudo e mascote. Duas ideias minhas ele recusou (o aviso
// depois da mascote e o escudo de 2 cores de graça) — e foi ELE quem achou o
// lugar, mandando o print da lista de salas: *"talvez algo por aqui né, que é
// onde eles entram pra jogar nas salas abertas"*.
//
// Ele tem razão: é a tela por onde TODO jogador online passa. Vitrine natural.
//
// E a ideia virou DINHEIRO quando ele disse: *"mas é como ganhar dinheiro também
// se eu quiser, com torneios… hoje um escudo vale 59,90, craque 19,90, lenda
// 39,90"*. Daí o formato: a INSCRIÇÃO já é um produto (o Craque, 19,90 — ninguém
// sai de mãos vazias) e o CAMPEÃO leva o batismo + Lenda.
//
// 📐 O que este mockup mostra: o cartão no lugar exato do print dele (topo da
// lista, antes das salas normais), em três estados — com torneio aberto, com o
// torneio cheio, e sem torneio marcado (que é o estado em que a tela passa a
// maior parte do tempo, e não pode virar propaganda solta).
//
// Rodar: node scripts/mockup-torneio-cartao.mjs /tmp/torneio.png
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// uma sala normal da lista (igual à do print dele), pra dar a referência de tamanho
const sala = (nome, gente, cod, modo) => `
  <div class="sala">
    <div style="flex:1;min-width:0">
      <p class="sn">🔴 ${nome} <span class="tag br">BR</span> <span class="tag">${modo}</span></p>
      <p class="si">👥 ${gente}/20 · ${cod} · ⚡ auto · 🌎 liga+liberta · 🔴 jogo rolando</p>
    </div>
    <span class="emjogo">EM JOGO</span>
  </div>`

// o cartão do torneio — preto e dourado, destacado das salas creme
const torneio = ({ vagas, cheio = false }) => `
  <div class="torn ${cheio ? 'cheio' : ''}">
    <div class="tfaixa">🏆 TORNEIO DO SÁBADO · 21H</div>
    <p class="tpremio">O campeão vira <b>clube batizado</b></p>
    <p class="tsub">escudo desenhado, mascote própria e manto — o pacote inteiro</p>
    <div class="tlinha">
      <span class="tvagas ${cheio ? 'zero' : ''}">👥 ${cheio ? 'LOTADO' : `${vagas}/20 vagas`}</span>
      <span class="tbtn ${cheio ? 'off' : ''}">${cheio ? 'AVISA QUANDO ABRIR' : 'GARANTIR VAGA · R$ 19,90'}</span>
    </div>
    <p class="tpe">${cheio
      ? 'o próximo abre domingo às 20h — toque pra entrar na fila'
      : 'a inscrição já te dá o <b>⭐ Craque</b> na hora (cor, selo e modo manual). Perdeu? O Craque é seu do mesmo jeito.'}</p>
  </div>`

// e o estado SEM torneio marcado — o espaço não pode ficar vazio nem virar anúncio
const semTorneio = () => `
  <div class="torn quieto">
    <div class="tfaixa quieta">🏆 PRÓXIMO TORNEIO</div>
    <p class="tpremio" style="font-size:19px">Sábado, 21h — <b>o campeão vira clube batizado</b></p>
    <div class="tlinha"><span class="tvagas">🔔 abre sexta</span><span class="tbtn off">ME AVISA</span></div>
  </div>`

const tela = (titulo, corpo, nota) => `
<div class="col">
  <p class="passo">${titulo}</p>
  <div class="fone">
    <p class="lbl">BUSCAR SALA</p>
    <div class="busca">Buscar sala…</div>
    ${corpo}
  </div>
  <p class="cap">${nota}</p>
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE9DA;font-family:system-ui;color:${INK};padding:26px}
.wrap{max-width:1200px;margin:0 auto}
h1{${OSW};font-size:21px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
.sub{font-size:13px;font-weight:600;color:#3d3a30;margin-bottom:20px;line-height:1.55}
.linha{display:flex;gap:20px;align-items:flex-start}
.col{width:360px}
.passo{${OSW};font-size:12.5px;letter-spacing:1px;text-transform:uppercase;color:rgba(12,12,12,.45);margin-bottom:7px}
.fone{background:#151517;border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:13px}
.lbl{color:rgba(255,255,255,.45);font-size:9.5px;${OSW};letter-spacing:1.2px;margin-bottom:5px}
.busca{background:#fff;border-radius:10px;padding:9px 11px;font-size:12.5px;color:#9a9a9a;font-weight:600;margin-bottom:11px}
.sala{background:${CREME};border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 ${INK};padding:8px 10px;display:flex;gap:8px;align-items:center;margin-bottom:9px}
.sn{${OSW};font-size:13.5px;line-height:1.2}
.si{font-size:9.5px;font-weight:700;color:rgba(12,12,12,.55);margin-top:2px}
.tag{border:1.5px solid ${INK};border-radius:5px;padding:0 4px;font-size:8.5px;background:#fff;vertical-align:middle}
.tag.br{background:${GOLD}}
.emjogo{${OSW};font-size:10px;border:2.5px solid ${INK};border-radius:9px;background:#DCDCDC;padding:7px 8px;box-shadow:2px 2px 0 ${INK};flex:none}
/* 🏆 o cartão do torneio: preto e dourado — salta da lista creme sem gritar */
.torn{background:linear-gradient(160deg,#1C1A16,#2A2418);border:3px solid ${GOLD};border-radius:15px;box-shadow:4px 4px 0 ${INK};padding:11px 12px;margin-bottom:12px}
.torn.cheio{border-color:rgba(255,196,0,.45)}
.torn.quieto{background:#1A1A1C;border-color:rgba(255,196,0,.35);padding:10px 12px}
.tfaixa{display:inline-block;background:${GOLD};color:${INK};${OSW};font-size:10px;letter-spacing:1.1px;border-radius:999px;padding:2px 9px;margin-bottom:8px}
.tfaixa.quieta{background:rgba(255,196,0,.22);color:${GOLD}}
.tpremio{${OSW};font-size:21px;color:#fff;line-height:1.12}
.tpremio b{color:${GOLD}}
.tsub{font-size:10.5px;font-weight:700;color:rgba(255,255,255,.5);margin-top:4px;line-height:1.35}
.tlinha{display:flex;gap:8px;align-items:center;margin-top:10px}
.tvagas{${OSW};font-size:12px;color:${GOLD};background:rgba(255,196,0,.13);border:1.5px solid rgba(255,196,0,.4);border-radius:999px;padding:4px 9px;flex:none}
.tvagas.zero{color:#FF8A7A;background:rgba(255,120,100,.12);border-color:rgba(255,120,100,.4)}
.tbtn{flex:1;text-align:center;${OSW};font-size:12.5px;background:${GOLD};color:${INK};border:2.5px solid ${INK};border-radius:11px;padding:7px 6px;box-shadow:2px 2px 0 ${INK}}
.tbtn.off{background:transparent;color:rgba(255,255,255,.55);border-color:rgba(255,255,255,.3);box-shadow:none}
.tpe{font-size:9.5px;font-weight:700;color:rgba(255,255,255,.45);margin-top:8px;line-height:1.4}
.tpe b{color:rgba(255,255,255,.75)}
.cap{font-size:12px;font-weight:500;color:#3d3a30;line-height:1.5;margin-top:10px}
.nota{background:#fff;border:3px solid ${INK};border-radius:13px;padding:12px 14px;font-size:12.5px;font-weight:500;line-height:1.6;color:#3d3a30;margin-top:22px}
.nota b{font-weight:700}
.conta{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}
.conta div{background:${CREME};border:2.5px solid ${INK};border-radius:11px;box-shadow:2px 2px 0 ${INK};padding:8px 11px;font-size:12px;font-weight:700}
.conta b{${OSW};font-size:15px;display:block}
</style></head><body><div class="wrap">

<h1>🏆 O torneio no topo das salas abertas</h1>
<p class="sub">No lugar que <b>você apontou</b> — é por ali que todo jogador online passa. O cartão fica <b>antes</b> das salas normais, em preto e dourado, pra saltar da lista creme sem precisar gritar.</p>

<div class="linha">
  ${tela('① torneio aberto', torneio({ vagas: 14 }) + sala('Sala do KIKITOS FC', 3, 'KKR3TC', '✉️ ÀS CEGAS') + sala('Sala do Legends FCB', 8, 'QEF5NX', '✉️ ÀS CEGAS'),
    'O que vende é a <b>vaga sumindo</b>. E a inscrição não é taxa: ela <b>já entrega o Craque</b> — quem perde na 1ª rodada continua saindo com uma cor e um selo.')}
  ${tela('② lotou', torneio({ vagas: 0, cheio: true }) + sala('Sala do PiuPiu MALUCO', 3, 'LIZR52', '🐊 TOCAIA') + sala('Sala do Biscoito FC', 2, 'JTN2WA', '✉️ ÀS CEGAS'),
    'Lotar é <b>bom</b>: quem ficou de fora vira fila pro próximo. O botão troca pra "avisa quando abrir" — e aí você já tem o público do sábado seguinte.')}
  ${tela('③ sem torneio marcado', semTorneio() + sala('RESENHA', 4, 'CBZK4B', '✉️ ÀS CEGAS') + sala('Sala do haxixe Fc', 4, 'FVBRT3', '✉️ ÀS CEGAS'),
    'O espaço <b>nunca fica vazio nem vira anúncio</b>: some o preço, fica só a data do próximo. É informação, não propaganda.')}
</div>

<div class="nota">
  💰 <b>A conta de uma noite cheia</b>, com os seus preços de hoje:
  <div class="conta">
    <div>entra<b>20 × R$ 19,90 = R$ 398</b></div>
    <div>sai (em valor)<b>batismo 59,90 + Lenda 39,90</b></div>
    <div>sobra<b>≈ R$ 300</b></div>
    <div>custo real seu<b>1 arte</b></div>
  </div>
  <p style="margin-top:10px">Ou seja: você não está vendendo "torneio", está <b>vendendo 20 Craques de uma vez</b> — com a disputa em cima. E o jogo continua <b>de graça</b>: o torneio é o opcional, nunca a porta de entrada.</p>
  <p style="margin-top:8px">⚠️ <b>O trabalho de verdade não é a tela, é a porta:</b> conferir quem pagou antes de liberar a vaga. Dá pra começar <b>na mão</b> pelo Painel do Criador (do jeito que você já libera os apoios) e só automatizar se pegar.</p>
</div>

</div></body></html>`

const out = process.argv[2] ?? 'mockup-torneio.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-torneio.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
