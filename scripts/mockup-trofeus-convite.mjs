#!/usr/bin/env node
// ─── 🛡️ MOCKUP: a linhazinha de convite na Sala de Troféus ──────────────────
//
// Pedido do Diego (21/09): *"nessa parte aqui, um dos troféus, na área do online,
// preciso que você coloque uma linhazinha assim também: quer ter escudo e mascote
// pulando na tela? clique aqui… ou algo assim: tá vendo todos esses times com
// escudo e mascote? todos eles são usuários reais… é pra pessoa não achar que é
// um bot, esses mascotes que estão pulando na tela e escudos, que são realmente
// reais. Mas eu queria fazer tudo pequeno ali pra não ficar muita informação"*.
//
// O lugar: logo abaixo da linha de pontuação ("🏆 Título +5 · 🎟️ Top 8 +1…"), no
// MESMO tamanho miúdo — é recado, não banner (a mesma régua do contato no rodapé).
//
// Rodar:  node scripts/mockup-trofeus-convite.mjs /tmp/trofeus.png

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTS = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', ROXO = '#7C3AED'

// as 3 formas de escrever — a régua é a MESMA: uma linha, miúda, com o clique no fim
// 🖊️ A FRASE É DELE (21/09): *"o escudo que aparece nos times e o mascote que pula
// na tela são de jogadores de verdade. Algo assim, melhore"*. Ele acertou o miolo —
// citar as DUAS coisas que a pessoa vê (o escudo no time e o bicho pulando).
//
// ⚠️ A ÚNICA troca na palavra dele: **"jogador" no jogo é a CARTA** (Pelé, Romário).
// "Jogadores de verdade" leria como "cartas reais", não como "pessoas reais" — que
// é o contrário do que ele quer dizer. Por isso as três usam "gente de verdade".
const OPCOES = [
  {
    id: 'A', titulo: 'A frase dele, limpa',
    txt: `🛡️ O escudo dos times e o mascote que pula na tela são de <b>gente de verdade</b>. <a>Quer o seu aqui?</a>`,
    nota: 'A dele, só enxugada e com "gente" no lugar de "jogadores". A mais direta.',
  },
  {
    id: 'B', titulo: 'Com o "não é bot" escrito',
    txt: `🛡️ Escudo no time, mascote pulando na tela — tudo de <b>gente de verdade</b>, não de bot. <a>Quer o seu?</a>`,
    nota: 'Diz com todas as letras o que te incomodou. Uma linha mais cheia.',
  },
  {
    id: 'C', titulo: 'Puxando pro convite',
    txt: `🛡️ Todo escudo e todo mascote daí tem <b>dono de verdade</b>. <a>Quer ser um deles?</a>`,
    nota: '"Quer ser um deles" convida mais que "quer o seu". A mais curta das três.',
  },
]

const ranking = `
  <div class="lin"><span class="pos">🥇</span><div class="nm"><b>mancheter zisena</b></div><span class="pt">11 pts</span></div>
  <div class="chips"><span class="ch">🏆 Liga ×1</span><span class="ch rx">🏆 Copa ×1</span><span class="ch vd">🎟️ Top 8 ×1</span></div>
  <div class="lin"><span class="pos">2º</span><div class="nm"><b>Neymarzetti 👑🖋️</b></div><span class="pt">1 pts</span></div>
  <div class="chips"><span class="ch vd">🎟️ Top 8 ×1</span></div>`

const bloco = (o) => `
<div class="col">
  <h1>Opção ${o.id}<span>${o.titulo}</span></h1>
  <div class="fone">
    <p class="tt">🏆 RANKING DA GALERA · 3 USUÁRIOS</p>
    ${ranking}
    <p class="regra">🏆 Título +5 · 🎟️ Top 8 +1 · 🔻 Rebaixamento −1. Nas Copas, só o campeão pontua. Bots não entram.</p>
    <p class="convite">${o.txt}</p>
  </div>
  <p class="cap">${o.nota}</p>
</div>`

const css = `${FONTS}
*{box-sizing:border-box}
body{margin:0;background:#EFE9DA;font-family:Oswald,sans-serif;color:${INK};padding:24px}
.wrap{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;max-width:1140px;margin:0 auto}
.col{width:340px}
h1{font-size:14px;font-weight:700;text-transform:uppercase;margin:0 0 9px;letter-spacing:.4px}
h1 span{display:block;font-size:11px;font-weight:500;text-transform:none;opacity:.55;letter-spacing:0}
.fone{background:${CREME};border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:13px}
.tt{font-size:11px;font-weight:700;letter-spacing:1.1px;color:rgba(12,12,12,.45);margin:0 0 9px}
.lin{display:flex;align-items:center;gap:8px;border:2.5px solid ${INK};border-radius:11px;background:#fff;padding:7px 9px 5px;box-shadow:2px 2px 0 ${INK};margin-top:7px}
.pos{font-weight:700;font-size:15px;width:26px;text-align:center}
.nm{flex:1;font-size:13px;font-weight:700}
.pt{border:2px solid ${INK};border-radius:8px;background:${GOLD};font-weight:700;font-size:13px;padding:1px 7px}
.chips{display:flex;gap:4px;margin:4px 0 0 35px;flex-wrap:wrap}
.ch{font-size:9px;font-weight:700;border:1.5px solid ${INK};border-radius:999px;padding:1px 6px;background:#FFF6D6}
.ch.rx{background:#F1E8FF}.ch.vd{background:#E6F7EC}
.regra{font-size:10px;font-weight:700;color:rgba(12,12,12,.55);line-height:1.4;margin:11px 0 0}
/* 👇 a linha nova — MESMO tamanho da regra de cima, só que com o clique */
.convite{font-size:10px;font-weight:700;color:rgba(12,12,12,.55);line-height:1.45;margin:6px 0 0;padding-top:6px;border-top:1.5px dashed rgba(12,12,12,.14)}
.convite b{color:rgba(12,12,12,.8)}
.convite a{color:${ROXO};text-decoration:underline;font-weight:700;white-space:nowrap}
.cap{font-size:11.5px;font-weight:500;line-height:1.5;margin:10px 2px 0;color:#3d3a30}
.nota{background:#fff;border:3px solid ${INK};border-radius:13px;padding:11px 13px;font-size:12px;font-weight:500;line-height:1.55;color:#3d3a30;max-width:700px;margin:22px auto 0}
`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="wrap">${OPCOES.map(bloco).join('')}</div>
<div class="nota">📏 <b>As três são uma linha só, no mesmo tamanho miúdo da regra de pontuação</b> — separadas dela por um tracinho leve, pra ler como "recado", não como banner. O clique abre a tela de apoio (onde mora o batismo, que é o que dá escudo e mascote). A frase é a SUA. A única coisa que mexi foi trocar <b>jogadores</b> por <b>gente</b>: no jogo, <b>jogador é a CARTA</b> (Pelé, Romário), então "jogadores de verdade" leria como carta real em vez de pessoa real.</div>
</body></html>`

const out = process.argv[2] ?? 'mockup-trofeus.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-trofeus.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1140, height: 520 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
