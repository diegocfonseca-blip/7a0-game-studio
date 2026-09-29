// 📱 STORIES DAS CARTAS NOVAS — todas as categorias (29/09)
//
// Pedido do Diego: *"mockup de todos novos jogadores que falamos pra postar um story no
// insta… de todos novos que entraram"* (Lotes 37, 38 e 39). O `mockup-lendas.mjs` só
// sabe desenhar LENDA (ouro); este aqui desenha cada carta no tier dela, com as MESMAS
// cores do `FAME_TIER` do jogo (`screens.tsx`): 👑 ouro · ⭐ prata · 🎯 verde.
// Mesmo formato de stories aprovado em 27/09: título, grade 4×4, rodapé da marca, sem
// explicação técnica. Ordem = peso do nome (lenda → craque → bom jogador).
//
//   node scripts/mockup-novos-stories.mjs --lotes L37,L38,L39 [--saida novos.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'novos.png')
const LOTES = arg('--lotes', 'L37,L38,L39').split(',').map(s => s.trim())
const PRIMEIRO = (arg('--primeiro', 'Pelé,Zico') || '').split(',').map(s => s.trim()).filter(Boolean)

// ── as cartas dos lotes pedidos, direto do data.ts ──
const data = readFileSync('src/escalacao/data.ts', 'utf8')
const cartas = []
for (const m of data.matchAll(/const (\w+): C\[\] = \[([\s\S]*?)\n\]/g)) {
  const [, nome, corpo] = m
  if (!LOTES.some(l => nome.startsWith(l + '_'))) continue
  const pos = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].find(p => nome.endsWith('_' + p))
  for (const c of corpo.matchAll(/name:\s*("[^"]+"|'[^']+'),\s*club:\s*("[^"]*"|'[^']*'),\s*year:\s*(\d+),\s*fame:\s*(\d)/g))
    cartas.push({ nome: c[1].slice(1, -1), club: c[2].slice(1, -1), year: +c[3], fame: +c[4], pos })
}
// categoria manda (lenda → craque → bom); dentro dela, quem está em `--primeiro` vem na ordem da lista
const ordem = c => { const i = PRIMEIRO.indexOf(c.nome); return i >= 0 ? i : 999 }
cartas.sort((a, b) => b.fame - a.fame || ordem(a) - ordem(b) || a.club.localeCompare(b.club) || a.nome.localeCompare(b.nome))

// ── tiers: cópia do FAME_TIER do jogo ──
const TIER = {
  5: { label: '👑 LENDA', grad: 'linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)', ink: '#0C0C0C', tc: '#7a4d00', cb: 'rgba(255,255,255,.42)', ci: '#7a4d00', holo: .85 },
  4: { label: '⭐ CRAQUE', grad: 'linear-gradient(150deg,#F4F7FB,#CBD4DE 45%,#9BA7B5 78%,#EAEFF4)', ink: '#0C0C0C', tc: '#44546a', cb: 'rgba(255,255,255,.5)', ci: '#44546a', holo: .72 },
  3: { label: '🎯 BOM JOGADOR', grad: 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)', ink: '#fff', tc: 'rgba(255,255,255,.92)', cb: 'rgba(255,255,255,.35)', ci: '#14532d', holo: 0 },
}
// 🙈 29/09 (Diego: *"não quero que bote as categorias nos jogadores… faça igual aos últimos"*):
// por padrão a carta é CEGA — todas no mesmo dourado dos stories de 27/09, sem selo de nível
// e sem estrelas (no leilão a pessoa tem que saber quem é quem). `--com-categoria` volta os tiers.
const CEGA = !process.argv.includes('--com-categoria')
const carta = c => { const t = CEGA ? { ...TIER[5], label: '' } : (TIER[c.fame] ?? TIER[3]); return `
  <div style="position:relative;overflow:hidden;border:3px solid #0C0C0C;border-radius:16px;display:flex;flex-direction:column;justify-content:space-between;
              background:${t.grad};aspect-ratio:3/4.2;box-shadow:5px 6px 0 0 #0C0C0C;padding:11px">
    ${t.holo ? `<div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,${t.holo}) 48%,transparent 62%);background-size:250% 250%;background-position:60% 60%"></div>` : ''}
    <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:4px">
      <span style="font-family:Oswald,sans-serif;font-weight:700;background:#0C0C0C;color:#fff;border:2px solid rgba(255,255,255,.25);border-radius:8px;font-size:11px;padding:2px 7px">${c.pos}</span>
      <span style="font-family:Oswald,sans-serif;font-weight:700;letter-spacing:.5px;color:${t.tc};font-size:9px;text-align:right">${t.label}</span>
    </div>
    <div style="position:relative;align-self:center;width:66px;height:66px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                background:${t.cb};color:${t.ci};border:3px solid rgba(0,0,0,.28);font-family:Oswald,sans-serif;font-weight:700;font-size:27px;
                ${t.holo ? 'box-shadow:inset 0 0 14px rgba(255,255,255,.7)' : ''}">${c.nome.trim()[0].toUpperCase()}</div>
    <div style="position:relative">
      <p style="font-family:Oswald,sans-serif;font-weight:700;color:${t.ink};font-size:${c.nome.length > 20 ? 11.5 : c.nome.length > 16 ? 13 : 15}px;line-height:1.2;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nome}</p>
      <p style="font-weight:800;color:${t.ink};opacity:.62;font-size:${(c.club + ' · ' + c.year).length > 22 ? 8 : (c.club + ' · ' + c.year).length > 20 ? 9 : 10}px;margin:1px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.club} · ${c.year}</p>
      ${CEGA ? '' : `<p style="font-size:11px;letter-spacing:1px;margin:3px 0 0">${'⭐'.repeat(c.fame)}</p>`}
    </div>
  </div>` }

const conta = f => cartas.filter(c => c.fame === f).length
const resumo = [[5, '👑', 'lenda', 'lendas'], [4, '⭐', 'craque', 'craques'], [3, '🎯', 'bom jogador', 'bons jogadores']]
  .filter(([f]) => conta(f)).map(([f, e, s, p]) => `${e} ${conta(f)} ${conta(f) === 1 ? s : p}`).join(' · ')
const COLS = 4
const html = (lote, pag, total) => `<!doctype html><html><head><meta charset="utf-8">
<style>${FONTES}
body{margin:0;background:#F4ECD6;color:#0C0C0C;font-family:system-ui,-apple-system,sans-serif;width:1080px;height:1920px;box-sizing:border-box;padding:70px 46px 50px;display:flex;flex-direction:column}</style>
</head><body>
  <div style="text-align:center">
    <div style="display:inline-block;background:#FFC400;border:4px solid #0C0C0C;border-radius:999px;box-shadow:4px 4px 0 #0C0C0C;padding:8px 22px;
                font-family:Oswald,sans-serif;font-weight:700;font-size:26px;letter-spacing:2px;text-transform:uppercase">🔨 Chegaram no leilão</div>
    <h1 style="font-family:Oswald,sans-serif;font-weight:700;font-size:96px;line-height:.95;margin:22px 0 10px;text-transform:uppercase">${cartas.length} cartas <span style="color:#C2452F">novas</span></h1>
    <p style="font-size:28px;font-weight:700;margin:0 0 34px;line-height:1.3">${CEGA ? arg('--subtitulo', '🇸🇦 Arábia · 🇺🇸 EUA · 🇯🇵 Japão · 🇨🇳 China · Europa · Brasil') : resumo}</p>
  </div>
  <div style="width:659px;zoom:1.5;display:flex;flex-wrap:wrap;justify-content:center;gap:14px 12px">${lote.map(c => `<div style="width:calc((100% - 36px) / ${COLS})">${carta(c)}</div>`).join('')}</div>
  <div style="text-align:center;margin-top:auto">
    ${total > 1 ? `<p style="font-family:Oswald,sans-serif;font-weight:700;font-size:24px;margin:0 0 10px;opacity:.55">${pag} / ${total}${pag < total ? ' · continua ➜' : ''}</p>` : ''}
    <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:40px;margin:0">⚽ Leilão <span style="color:#C2452F">Legends</span></p>
    <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:26px;margin:4px 0 0;opacity:.6">leilaolegends.com</p>
  </div>
</body></html>`

// 📋 29/09 (Diego: *"sem mostrar as cartas com cores… não entendi por que estão douradas"*):
// o padrão agora é LISTA — nada de carta, nada de cor de nível. Caixa branca por CLUBE, com
// o escudo oficial (quando tem), e em cada linha só POSIÇÃO · NOME · ANO. `--cartas` volta
// o formato de cartas.
const LISTA = !process.argv.includes('--cartas')
const escMap = JSON.parse(readFileSync('src/escalacao/escudos-oficiais.ts', 'utf8').match(/= (\{[\s\S]*\})\s*$/)[1])
const esc = clube => { const e = escMap[clube]; return e ? `data:image/webp;base64,${readFileSync('public/' + e.src).toString('base64')}` : null }
const grupos = []
for (const c of cartas) { let g = grupos.find(x => x.club === c.club); if (!g) grupos.push(g = { club: c.club, cs: [] }); g.cs.push(c) }
const bloco = g => `
  <div style="background:#fff;border:4px solid #0C0C0C;border-radius:22px;box-shadow:5px 5px 0 #0C0C0C;padding:16px 20px;margin-bottom:18px;break-inside:avoid">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">
      ${esc(g.club) ? `<img src="${esc(g.club)}" style="height:54px;width:auto">` : `<span style="width:54px;height:54px;border-radius:50%;background:#F4ECD6;border:3px solid #0C0C0C;display:flex;align-items:center;justify-content:center;font-size:28px">⚽</span>`}
      <b style="font-family:Oswald,sans-serif;font-weight:700;font-size:36px;text-transform:uppercase;line-height:1">${g.club}</b>
    </div>
    ${g.cs.map(c => `<div style="display:flex;align-items:center;gap:12px;padding:6px 0;border-top:2px solid rgba(0,0,0,.07)">
      <span style="font-family:Oswald,sans-serif;font-weight:700;background:#0C0C0C;color:#fff;border-radius:8px;font-size:20px;padding:2px 10px;min-width:44px;text-align:center">${c.pos}</span>
      <b style="font-family:Oswald,sans-serif;font-weight:600;font-size:32px;flex:1">${c.nome}</b>
      <span style="font-size:24px;font-weight:800;opacity:.5">${c.year}</span>
    </div>`).join('')}
  </div>`
const htmlLista = (gs, pag, total) => `<!doctype html><html><head><meta charset="utf-8">
<style>${FONTES}
body{margin:0;background:#F4ECD6;color:#0C0C0C;font-family:system-ui,-apple-system,sans-serif;width:1080px;height:1920px;box-sizing:border-box;padding:64px 50px 46px;display:flex;flex-direction:column}</style>
</head><body>
  <div style="text-align:center">
    <div style="display:inline-block;background:#FFC400;border:4px solid #0C0C0C;border-radius:999px;box-shadow:4px 4px 0 #0C0C0C;padding:8px 22px;
                font-family:Oswald,sans-serif;font-weight:700;font-size:26px;letter-spacing:2px;text-transform:uppercase">🔨 Chegaram no leilão</div>
    <h1 style="font-family:Oswald,sans-serif;font-weight:700;font-size:88px;line-height:.95;margin:20px 0 30px;text-transform:uppercase">${cartas.length} jogadores <span style="color:#C2452F">novos</span></h1>
  </div>
  <div style="columns:2;column-gap:22px">${gs.map(bloco).join('')}</div>
  <div style="text-align:center;margin-top:auto">
    ${total > 1 ? `<p style="font-family:Oswald,sans-serif;font-weight:700;font-size:24px;margin:0 0 10px;opacity:.55">${pag} / ${total}${pag < total ? ' · continua ➜' : ''}</p>` : ''}
    <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:40px;margin:0">⚽ Leilão <span style="color:#C2452F">Legends</span></p>
    <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:26px;margin:4px 0 0;opacity:.6">leilaolegends.com</p>
  </div>
</body></html>`
if (LISTA) {
  // divide em telas pelo "tamanho" de cada clube (cabeçalho + 1 por jogador), ~22 por tela
  const custo = g => 2.2 + g.cs.length, TETO = Number(arg('--teto', '27'))
  const telasG = []; let atual = [], soma = 0
  for (const g of grupos) { if (soma + custo(g) > TETO && atual.length) { telasG.push(atual); atual = []; soma = 0 } atual.push(g); soma += custo(g) }
  if (atual.length) telasG.push(atual)
  const bl = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  for (let i = 0; i < telasG.length; i++) {
    const out = telasG.length > 1 ? SAIDA.replace(/\.png$/, `-${i + 1}.png`) : SAIDA
    const f = `/tmp/mockup-novos-lista-${process.pid}-${i}.html`
    writeFileSync(f, htmlLista(telasG[i], i + 1, telasG.length))
    const pg = await bl.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
    await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(500)
    const estoura = await pg.evaluate(() => document.body.scrollHeight > 1920)
    await pg.screenshot({ path: out }); await pg.close()
    console.log(`${out} · ${telasG[i].reduce((a, g) => a + g.cs.length, 0)} jogadores${estoura ? ' · ⚠️ ESTOUROU a tela' : ''}`)
  }
  await bl.close(); process.exit(0)
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const telas = Math.ceil(cartas.length / 16), por = Math.ceil(cartas.length / telas)
for (let i = 0; i < telas; i++) {
  const out = telas > 1 ? SAIDA.replace(/\.png$/, `-${i + 1}.png`) : SAIDA
  const f = `/tmp/mockup-novos-${process.pid}-${i}.html`
  writeFileSync(f, html(cartas.slice(i * por, (i + 1) * por), i + 1, telas))
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
  await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(500)
  await pg.screenshot({ path: out }); await pg.close()
  console.log(`${out} · ${Math.min(por, cartas.length - i * por)} cartas`)
}
await b.close()
console.log(`total ${cartas.length} · ${resumo}`)
