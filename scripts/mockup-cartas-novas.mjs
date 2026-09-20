// 🃏 MOCKUP — CARTAS NOVAS NO BARALHO (story do Instagram, 1080×1920)
//
// Pedido do Diego (20/09): *"me mande mockup da lista d jogadores novos q entraram
// p eu por no stories do Instagram"* — e, na volta: *"era C todos jogadores e N
// alguns… E sem falar nível"*. Então:
//   · a lista é COMPLETA (todo mundo da leva, não uma seleção de seis);
//   · o story NÃO mostra categoria nem nível — só quem entrou, o clube e o auge.
//     Nível/categoria é conversa de bastidor; o post é a chamada.
//
// A lista mora na constante LEVA aqui embaixo: cortou um nome, mudou um auge, é
// uma linha e roda de novo. O mockup fica no repo porque o do Coringas foi feito
// à mão e se perdeu junto com o scratchpad.
//
// Rodar (da raiz do repo):  node scripts/mockup-cartas-novas.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERM = '#C2452F'
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

// ─── A LEVA ─────────────────────────────────────────────────────────────────
// `br: true` = baralho Brasil · sem a marca = baralho Europa.
const LEVA = [
  { grupo: '🧤 Goleiros', jogadores: [
    { n: 'David Raya', c: 'Arsenal', y: 2025 },
    { n: 'Diogo Costa', c: 'Porto', y: 2026 },
    { n: 'Gregor Kobel', c: 'Dortmund', y: 2024 },
    { n: 'Lucas Chevalier', c: 'Lille', y: 2025 },
    { n: 'Mamardashvili', c: 'Liverpool', y: 2026 },
    { n: 'Matz Sels', c: 'Nottingham Forest', y: 2025 },
    { n: 'Vicario', c: 'Tottenham', y: 2024 },
    { n: 'Rafael', c: 'São Paulo', y: 2024, br: true },
    { n: 'Bento', c: 'Athletico-PR', y: 2023, br: true },
    { n: 'Agustín Rossi', c: 'Flamengo', y: 2025, br: true },
    { n: 'Lucas Perri', c: 'Botafogo', y: 2023, br: true },
    { n: 'João Ricardo', c: 'Fortaleza', y: 2026, br: true },
  ] },
  { grupo: '🛡️ Zagueiros', jogadores: [
    { n: 'Marquinhos', c: 'PSG', y: 2023 },
    { n: 'Éder Militão', c: 'Real Madrid', y: 2022 },
    { n: 'Bastoni', c: 'Inter', y: 2023 },
    { n: 'Cristian Romero', c: 'Tottenham', y: 2025 },
    { n: 'Jules Koundé', c: 'Barcelona', y: 2024 },
    { n: 'Willian Pacho', c: 'PSG', y: 2025 },
    { n: 'Dean Huijsen', c: 'Real Madrid', y: 2026 },
    { n: 'Ilya Zabarnyi', c: 'PSG', y: 2026 },
    { n: 'Calafiori', c: 'Bologna', y: 2024 },
    { n: 'Leny Yoro', c: 'Lille', y: 2024 },
    { n: 'Lucas Beraldo', c: 'PSG', y: 2025 },
    { n: 'Niklas Süle', c: 'Bayern', y: 2020 },
    { n: 'Konaté', c: 'Liverpool', y: 2025 },
    { n: 'Schlotterbeck', c: 'Dortmund', y: 2024 },
    { n: 'Van de Ven', c: 'Tottenham', y: 2025 },
    { n: 'Sven Botman', c: 'Newcastle', y: 2023 },
    { n: 'Murillo', c: 'Nottingham Forest', y: 2025 },
    { n: 'Vitor Reis', c: 'Palmeiras', y: 2024, br: true },
    { n: 'Murilo', c: 'Palmeiras', y: 2024, br: true },
    { n: 'Bastos', c: 'Botafogo', y: 2024, br: true },
    { n: 'Bruno Fuchs', c: 'Atlético-MG', y: 2024, br: true },
  ] },
  { grupo: '🏃 Laterais', jogadores: [
    { n: 'Nuno Mendes', c: 'PSG', y: 2025 },
    { n: 'Grimaldo', c: 'Leverkusen', y: 2024 },
    { n: 'Dimarco', c: 'Inter', y: 2024 },
    { n: 'Wesley', c: 'Roma', y: 2026 },
    { n: 'Dumfries', c: 'Inter', y: 2025 },
    { n: 'Frimpong', c: 'Leverkusen', y: 2024 },
    { n: 'Pedro Porro', c: 'Tottenham', y: 2025 },
    { n: 'Aït-Nouri', c: 'Wolves', y: 2025 },
    { n: 'Vanderson', c: 'Monaco', y: 2025 },
    { n: 'Álvaro Carreras', c: 'Benfica', y: 2025 },
    { n: 'Milos Kerkez', c: 'Bournemouth', y: 2025 },
    { n: 'Yan Couto', c: 'Girona', y: 2024 },
    { n: 'Varela', c: 'Flamengo', y: 2025, br: true },
    { n: 'Vanderlan', c: 'Palmeiras', y: 2024, br: true },
    { n: 'Agustín Giay', c: 'Palmeiras', y: 2025, br: true },
  ] },
  { grupo: '⚡ Meias e atacantes', jogadores: [
    { n: 'Dirceu Krüger', c: 'Coritiba', y: 1973, br: true },
    { n: 'Tuta', c: 'Fluminense', y: 2006, br: true },
    { n: 'Fábio Rochemback', c: 'Sporting', y: 2005 },
  ] },
]
const TOTAL = LEVA.reduce((n, g) => n + g.jogadores.length, 0)
// ────────────────────────────────────────────────────────────────────────────

// ⚠️ nome em uma linha SÓ dele: com clube na mesma linha, "Éder Militão" e
// "Mamardashvili" apareciam cortados ("Éder Mili…"). Nome de jogador não corta.
const item = j => `<div class="it"><b>${j.n}</b><i><span class="${j.br ? 'br' : 'eu'}">${j.br ? 'BR' : 'EU'}</span>${j.c} · ${j.y}</i></div>`
const grupo = g => `<section><h2>${g.grupo} <em>${g.jogadores.length}</em></h2>${g.jogadores.map(item).join('')}</section>`

const html = `<!doctype html><meta charset="utf-8"><style>
${FONTES}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;background:${CREME};font-family:system-ui,Arial,sans-serif;color:${INK};overflow:hidden}
.pag{padding:52px 44px 40px;height:100%;display:flex;flex-direction:column}
.chip{display:inline-block;background:${INK};color:${GOLD};font-family:Oswald;font-weight:700;font-size:25px;letter-spacing:2px;padding:8px 20px;border-radius:999px}
h1{font-family:Oswald;font-weight:700;font-size:92px;line-height:.9;text-transform:uppercase;margin:16px 0 6px;letter-spacing:-2px}
h1 em{font-style:normal;color:${VERM}}
.sub{font-size:24px;font-weight:700;color:#5a5647;margin-bottom:20px;line-height:1.35}
.lista{flex:1;column-count:3;column-gap:18px}
section{break-inside:avoid;margin-bottom:14px;border:4px solid ${INK};border-radius:18px;box-shadow:5px 6px 0 0 ${INK};background:#fff;padding:12px 13px 10px}
h2{font-family:Oswald;font-weight:700;font-size:23px;text-transform:uppercase;letter-spacing:.5px;line-height:1;padding-bottom:9px;margin-bottom:8px;border-bottom:3px solid rgba(12,12,12,.14);display:flex;align-items:center;gap:6px}
h2 em{font-style:normal;background:${INK};color:${GOLD};font-size:16px;border-radius:999px;padding:2px 9px;margin-left:auto}
.it{padding:4px 0;border-bottom:2px solid rgba(12,12,12,.06)}
.it:last-child{border-bottom:0}
.it b{display:block;font-family:Oswald;font-weight:700;font-size:25px;line-height:1.02;white-space:nowrap}
.it i{display:flex;align-items:center;gap:6px;font-style:normal;font-weight:700;font-size:15px;color:rgba(12,12,12,.52);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.it span{font-family:Oswald;font-weight:700;font-size:13px;letter-spacing:1px;border-radius:6px;padding:1px 6px;flex:0 0 auto}
.br{background:#1B7A3D;color:#fff}
.eu{background:#2F6BAE;color:#fff}
.rodape{margin-top:14px;background:${INK};border-radius:20px;padding:20px 26px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.rodape b{font-family:Oswald;font-weight:700;font-size:32px;color:${GOLD};text-transform:uppercase}
.rodape span{font-size:22px;font-weight:800;color:rgba(255,255,255,.82)}
</style>
<div class="pag">
  <div><span class="chip">⚽ LEILÃO LEGENDS</span></div>
  <h1><em>${TOTAL}</em> cartas novas<br>no baralho</h1>
  <p class="sub">Todo mundo que entrou agora — já aparece no leilão da sua próxima temporada 👀<br><b>BR</b> baralho Brasil &nbsp;·&nbsp; <b>EU</b> baralho Europa</p>
  <div class="lista">${LEVA.map(grupo).join('')}</div>
  <div class="rodape"><b>O baralho não para de crescer</b><span>leilaolegends.com</span></div>
</div>`

const out = process.argv[2] ?? `${ROOT}/cartas-novas.png`
const tmp = `${ROOT}/.mockup-cartas-novas.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.goto(`file://${tmp}`, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
await p.screenshot({ path: out })
await b.close()
console.log('✅', out, `· ${TOTAL} cartas`)
