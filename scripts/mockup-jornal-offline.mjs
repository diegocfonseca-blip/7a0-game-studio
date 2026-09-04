// 📰 MOCKUP — O MARTELO no JOGO RÁPIDO OFFLINE (pedido do Diego 04/09:
// "no modo rápido offline tem q ter jornal tb pow… igual no rápido online,
// qd acaba o torneio").
//
// Renderiza o JORNAL DE VERDADE (`jornal-sala.tsx`, o mesmo do rápido online)
// com um fim de torneio OFFLINE por dentro — não é desenho, é o componente.
// Mostra lado a lado:
//   A) como fica HOJE se a gente só tirar a trava `online &&`
//   B) a proposta (mais linhas, e as palavras certas pro offline)
//
// uso: node scripts/mockup-jornal-offline.mjs [--saida arquivo.png]
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'mockup-jornal-offline.png')

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } })
const { JornalDaSala, montaEdicao } = await vite.ssrLoadModule('/src/escalacao/jornal-sala.tsx')

// ── um fim de torneio OFFLINE plausível: 20 times, 1 humano (você), 19 CPU ──
const CPU = ['Casa de Vó', 'Zé Colmeia', 'Fatality FC', 'Miúdo EC', 'Zequinha SAF', 'Mano Paulista',
  'Brodeiragem', 'Adão Esporte', 'Zorra FC', 'Tetéia SAF', 'Napolitano', 'Ponte Branca', 'CRBebê',
  'Stocco FC', 'Goiaba FC', 'Leve-cuscuz', 'Serra Azul FR', 'Torta de Rã', 'Kombi United']
const TEC = ['Casa de Vó', 'Zé Colmeia', 'Waguinho Pipa', 'Miúdo do Gol', 'Zequinha Ferro', 'Nego do Xote',
  'Zé Chapéu', 'Adãozinho', 'Zorra Total FC', 'Bilu Tetéia', 'Gugu Canela', 'Toninho Grelha', 'Vavá Peteca',
  'Relâmpago', 'Mão de Onça', 'Beto Foguete', 'Lelê da Serra', 'Cabelo de Fogo', 'Baixinho da Kombi']

const managers = [
  { id: 0, name: 'Você', teamName: 'Leões do Beco', isHuman: true, auctionRival: true },
  ...CPU.map((t, i) => ({ id: i + 1, name: TEC[i], teamName: t, isHuman: false, auctionRival: i < 3 })),
]
// tabela: você em 4º (fora da Copa por 1 posição seria 9º; aqui você VAI à Copa)
const PTS = [46, 44, 41, 40, 38, 36, 35, 33, 32, 30, 29, 27, 26, 24, 22, 21, 19, 17, 14, 9]
const league = managers.map((m, i) => ({
  id: m.id, name: m.teamName, isManager: true, baseAtk: 70, baseDef: 70,
  pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
}))
// coloca você em 4º e distribui o resto
const ordem = [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
ordem.forEach((idx, pos) => {
  const t = league[idx]
  t.pts = PTS[pos]; t.w = Math.round(PTS[pos] / 3); t.d = PTS[pos] % 3
  t.l = 19 - t.w - t.d; t.gf = 60 - pos * 2; t.ga = 20 + pos * 2
})

const base = {
  seed: 20260904, youIdx: 0, managers, league, onlineMode: 'solo', copaMode: 'liga_copa',
  quickCopa: { champion: { id: 0, name: 'Leões do Beco' }, scorers: [], bracket: [], ties: [] },
  scorers: [{ name: 'Romário', teamId: 0, teamName: 'Leões do Beco', goals: 17 }],
}

// o jornal lê o artilheiro pelo topScorers(state) — passamos um state com a
// mesma cara que o motor entrega no fim do torneio.
function edicao(state) { return montaEdicao(state, 8, 17, null) }

// A = como a SALA (online) montaria esta mesma tabela: só usuário ganha linha.
// B = como o OFFLINE monta agora: top 5 + você + lanterna, palavras de torneio.
// Os dois saem do MESMO montaEdicao — muda só o onlineMode do estado.

const nada = () => {}
function capa(ed) {
  return renderToStaticMarkup(React.createElement(JornalDaSala, { ed, onCompartilhar: nada, compartilhando: false }))
}

const A = capa(edicao({ ...base, onlineMode: 'online' }))
const B = capa(edicao({ ...base, onlineMode: 'cpu' }))

const face = w => `@font-face{font-family:Oswald;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(new URL(`./fonts/oswald-latin-${w}-normal.woff2`, import.meta.url)).toString('base64')}) format('woff2')}`
const html = `<!doctype html><meta charset="utf-8"><style>
${[400,500,600,700].map(face).join('\n')}
*{box-sizing:border-box}
body{margin:0;background:#F4ECD6;font-family:Oswald,sans-serif;padding:26px}
.wrap{display:flex;gap:26px;align-items:flex-start}
.col{width:430px}
.rot{font-weight:900;font-size:15px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 4px;color:#0C0C0C}
.sub{font-weight:500;font-size:11.5px;line-height:1.35;margin:0 0 12px;color:rgba(0,0,0,.66)}
.tag{display:inline-block;border:3px solid #0C0C0C;border-radius:999px;padding:2px 10px;font-weight:900;font-size:10.5px;margin-bottom:6px;box-shadow:3px 3px 0 #000}
</style><body><div class="wrap">
<div class="col"><span class="tag" style="background:#E8503A;color:#fff">ANTES</span>
<p class="rot">Se fosse só destravar</p>
<p class="sub">Offline só VOCÊ é gente. A regra da sala ("só usuário ganha linha") deixaria 3 linhas, e a capa continuaria falando de "sala" e "técnicos".</p>${A}</div>
<div class="col"><span class="tag" style="background:#1B7A3D;color:#fff">DEPOIS · NO AR</span>
<p class="rot">Como ficou</p>
<p class="sub">Top 5 + você + lanterna ganham linha, e "sala/noite/técnicos" viraram "torneio/contra a máquina". Mesma capa, mesmo arquivo.</p>${B}</div>
</div></body>`

const arq = resolve(process.cwd(), SAIDA)
const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const pg = await nav.newPage({ viewport: { width: 940, height: 900 }, deviceScaleFactor: 2 })
await pg.setContent(html, { waitUntil: 'load' })
await pg.screenshot({ path: arq, fullPage: true })
await nav.close()
await vite.close()
console.log(SAIDA)
