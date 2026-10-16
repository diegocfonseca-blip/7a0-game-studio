// 🧑‍💼 MOCKUP · ONDE O PRESIDENTE APARECE (16/10) — cada lugar lado a lado: QUEM TEM presidente (⭐ Craque pra cima) ×
// QUEM É GRÁTIS (no mesmo lugar vai o ESCUDO do clube). Pedido do Diego: *"me mande mockup onde tudo que irá aparecer, quem
// tem personagem e quem não tem, fica como nos mesmos lugares"*. Pódio fora (*"não faz pódio não"*). Bonecos montados com
// as artes REAIS do editor (base + cabelo), em scripts/… via PIL antes (pasta --bonecos).
// uso: node scripts/mockup-presidente-lugares.mjs --bonecos <pasta com pirlo/r10/astro -busto/-corpo .png>
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const DIR = arg('--bonecos', '.')
const SAIDA = arg('--saida', 'scripts/mockups/presidente-lugares.png')
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const img = n => `data:image/png;base64,${b64(`${DIR}/${n}.png`)}`
const B = { p: img('pirlo-busto'), r: img('r10-busto'), a: img('astro-busto') }, C = { p: img('pirlo-corpo'), a: img('astro-corpo') }
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
// escudo genérico do clube de quem é grátis (o jogo desenha o escudo do clube)
const esc = (s, sig = 'AT', c1 = '#1B3A6B', c2 = '#FFC400') => `<svg width="${s}" height="${s * 1.15}" viewBox="0 0 100 115"><path d="M50 3 L95 15 L92 62 Q88 95 50 112 Q12 95 8 62 L5 15 Z" fill="${c1}" stroke="${INK}" stroke-width="6"/><path d="M50 14 L84 23 L82 60 Q79 85 50 99 Q21 85 18 60 L16 23 Z" fill="none" stroke="${c2}" stroke-width="4"/><text x="50" y="68" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="34" fill="#fff">${sig}</text></svg>`
const av = (src, s = 44) => `<img src="${src}" style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover;object-position:top;border:3px solid ${INK};background:#e9dcc0">`
const avEsc = (s = 44, sig, c1, c2) => `<span style="width:${s}px;height:${s}px;border-radius:50%;border:3px solid ${INK};background:#fff;display:inline-flex;align-items:center;justify-content:center">${esc(s * .62, sig, c1, c2)}</span>`
const lado = (titulo, cor, corpo) => `<div class="lado"><div class="tag" style="background:${cor}">${titulo}</div><div class="cx">${corpo}</div></div>`
const lugar = (n, nome, onde, com, sem) => `<div class="lugar"><div class="h"><b>${n}</b><span>${nome}<small>${onde}</small></span></div><div class="dois">${lado('⭐ COM PRESIDENTE', GOLD, com)}${lado('GRÁTIS · ESCUDO', '#e6dcbf', sem)}</div></div>`
const linhaTec = (a, nome, sub) => `<div class="row">${a}<div><b>${nome}</b><small>${sub}</small></div></div>`

const L = [
  lugar(1, 'Lista de técnicos da sala', 'salas online', linhaTec(av(B.p), 'Pirlo FC', 'host'), linhaTec(avEsc(44, 'AT'), 'Atlético Tuta', '')),
  lugar(2, 'Chat da sala', 'salas online', `<div class="row">${av(B.r, 38)}<div class="bal"><b>R10 United</b> esse Zico é meu 😤</div></div>`, `<div class="row">${avEsc(38, 'AT')}<div class="bal"><b>Atlético Tuta</b> vai sonhando 😂</div></div>`),
  lugar(3, 'Martelo de quem ganhou', 'leilão (online e carreira)', `<div class="mart">${av(B.p, 70)}<div>🔨 <b>VENDIDO!</b><br>Zico pro <b>Pirlo FC</b></div></div>`, `<div class="mart">${avEsc(70, 'AT')}<div>🔨 <b>VENDIDO!</b><br>Zico pro <b>Atlético Tuta</b></div></div>`),
  lugar(4, 'Campeões de hoje · Ranking da semana', 'lista de salas', linhaTec(av(B.a, 38), '🏆 Astro FC', 'Liga · há 4 min'), linhaTec(avEsc(38, 'AT'), '🏆 Atlético Tuta', 'Liga · há 4 min')),
  lugar(5, 'Capa do O MARTELO (campeão)', 'jornal do fim da liga', `<div class="jornal"><div class="mast">O MARTELO</div><div class="capa"><img src="${C.p}" style="height:150px"><div class="manch">PIRLO FC É CAMPEÃO!</div></div></div>`, `<div class="jornal"><div class="mast">O MARTELO</div><div class="capa">${esc(90, 'AT')}<div class="manch">ATLÉTICO TUTA É CAMPEÃO!</div></div></div>`),
  lugar(6, 'Sala da presidência', 'carreira', `<div class="sala"><img src="${C.a}" style="height:150px"><div class="mesa">🖥️ 🗄️</div></div>`, `<div class="sala">${esc(80, 'AT')}<div class="mesa">🖥️ 🗄️</div><small style="position:absolute;top:6px;left:8px">escudo na parede</small></div>`),
  lugar(7, 'Sala de Troféus', 'carreira', `<div class="trof"><img src="${C.p}" style="height:130px"><span>🏆🏆🥇</span></div>`, `<div class="trof">${esc(70, 'AT')}<span>🏆🏆🥇</span></div>`),
  lugar(8, 'Caixa do fim de temporada', 'roteiro da virada (passo 2)', `<div class="row">${av(B.r, 54)}<div><b>💰 +480 🪙</b><small>o presidente fecha o caixa</small></div></div>`, `<div class="row">${avEsc(54, 'AT')}<div><b>💰 +480 🪙</b><small>o clube fecha o caixa</small></div></div>`),
  lugar(9, 'Convite internacional', 'Libertadores / Champions', `<div class="row">${av(B.a, 54)}<div><b>✉️ O Flamengo te chama</b><small>técnico convidado: Astro FC</small></div></div>`, `<div class="row">${avEsc(54, 'AT')}<div><b>✉️ O Flamengo te chama</b><small>técnico convidado: Atlético Tuta</small></div></div>`),
  lugar(10, 'Central Legends', 'home da carreira', `<div class="central">${av(B.p, 60)}<div><b>PIRLO FC</b><small>Série B · 3º lugar</small></div></div>`, `<div class="central">${avEsc(60, 'AT')}<div><b>ATLÉTICO TUTA</b><small>Série B · 3º lugar</small></div></div>`),
  lugar(11, 'Perfil', 'perfil da conta', `<div class="perfil"><img src="${C.a}" style="height:150px"><b>Astro FC</b></div>`, `<div class="perfil">${esc(70, 'AT')}<b>Atlético Tuta</b><div class="silh">🔒 Crie seu presidente no ⭐ Craque</div></div>`),
]
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:system-ui,sans-serif;color:${INK};padding:24px;width:1200px}
h1{font:700 34px Oswald;text-transform:uppercase;margin:0 0 4px}.sub{margin:0 0 18px;font-weight:700;opacity:.65;font-size:15px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.lugar{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:12px}
.h{display:flex;gap:10px;align-items:center;margin-bottom:10px}.h b{font:700 18px Oswald;background:${INK};color:${GOLD};border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center}
.h span{font:700 17px Oswald;text-transform:uppercase}.h small{display:block;font:600 11px system-ui;text-transform:none;opacity:.6}
.dois{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lado{border:2px solid ${INK};border-radius:12px;overflow:hidden;background:#F4ECD6}
.tag{font:700 11px Oswald;letter-spacing:.08em;padding:3px 8px;border-bottom:2px solid ${INK}}
.cx{padding:10px;min-height:130px;display:flex;align-items:center;justify-content:center;position:relative}
.row{display:flex;align-items:center;gap:8px;width:100%}.row b{font:700 14px Oswald;display:block}.row small{font-size:10.5px;font-weight:700;opacity:.6}
.bal{background:#fff;border:2px solid ${INK};border-radius:12px;padding:6px 8px;font-size:12px}
.mart{display:flex;align-items:center;gap:8px;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:12px;padding:8px;font:700 14px Oswald;width:100%}
.jornal{background:#fbf7ec;border:2px solid ${INK};width:100%}.mast{font:700 18px Oswald;text-align:center;border-bottom:2px solid ${INK};letter-spacing:.1em}
.capa{display:flex;align-items:flex-end;justify-content:center;gap:6px;padding:6px}.manch{font:700 15px Oswald;line-height:1.05;max-width:120px}
.sala{position:relative;width:100%;height:160px;background:linear-gradient(#6b4226 0 70%,#3b2414 70%);border-radius:8px;display:flex;align-items:flex-end;justify-content:center;gap:10px;padding-bottom:6px}
.sala small{color:#fff;font-weight:700;font-size:10px}.mesa{font-size:26px}
.trof{display:flex;align-items:flex-end;gap:10px}.trof span{font-size:34px}
.central{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#0b2f5c,#14401f);color:#fff;border:3px solid ${INK};border-radius:12px;padding:10px;width:100%}.central b{font:700 17px Oswald;display:block}.central small{font-size:11px;opacity:.8}
.perfil{display:flex;flex-direction:column;align-items:center;gap:4px}.perfil b{font:700 15px Oswald}
.silh{font-size:10.5px;font-weight:800;background:#fff;border:2px dashed ${INK};border-radius:8px;padding:4px 6px;text-align:center}
.nota{margin-top:18px;font-weight:700;font-size:15px;line-height:1.5}
</style></head><body>
<h1>🧑‍💼 Onde o presidente aparece</h1>
<p class="sub">Mesmos lugares pra todo mundo. Quem tem presidente (⭐ Craque pra cima) aparece com o boneco; quem é grátis aparece com o escudo do clube. Pódio fora.</p>
<div class="grid">${L.join('')}</div>
<p class="nota">• O boneco é a PESSOA (o presidente); o escudo é o CLUBE. Tabela, placar e gol continuam sempre com o escudo, pra todo mundo.<br>
• Grátis nunca fica com buraco nem com emoji genérico: vai o escudo do clube dele.<br>
• Só no perfil aparece o convite "🔒 Crie seu presidente no ⭐ Craque" — em nenhum outro lugar, pra não virar propaganda.</p>
</body></html>`
mkdirSync('scripts/mockups', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1.5 })
await p.setContent(html); await p.waitForTimeout(800)
await p.screenshot({ path: SAIDA, fullPage: true }); await b.close()
console.log(SAIDA)
