// ─── 🃏 POST: OS JOGADORES QUE ACABARAM DE ENTRAR NO JOGO ───────────────────
// Pedido do Diego (28/08): *"me mande uma arte dos últimos jogadores que
// entraram no jogo, sem falar a categoria e overall deles"*.
//
// 🎨 MESMO TRATAMENTO QUE ELE JÁ APROVOU no post da Chape (21/08): todas as
// cartas na MESMA cor, **sem estrelas**, **sem nome de categoria** e **sem a
// faixa de nível**. No jogo cada carta sai na cor do tier dela; aqui não —
// senão o post entregaria quem é lenda e quem não é, que é justamente o que ele
// não quer mostrar. Fica só: posição, nome, clube e ano.
//
// 📌 A lista sai do PRÓPRIO `data.ts` (blocos L27_*), não escrita à mão — se
// alguém mexer no baralho, a arte acompanha sozinha.
//
//   node scripts/mockup-jogadores-novos.mjs [--saida jogadores-novos.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'jogadores-novos.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', VERDE = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// ── lê os blocos L27_* do data.ts (é a leva que acabou de entrar) ──
const src = readFileSync('src/escalacao/data.ts', 'utf8')
const cartas = []
for (const m of src.matchAll(/const L27_(BR|EU)_(GOL|LAT|ZAG|MEI|ATA): C\[\] = \[([\s\S]*?)\n\]/g)) {
  const pos = m[2]
  for (const c of m[3].matchAll(/name: '([^']+)', club: '([^']+)', year: (\d+)/g)) {
    cartas.push({ nome: c[1], club: c[2], year: c[3], pos })
  }
}
if (!cartas.length) throw new Error('não achei os blocos L27_* no data.ts')
// ordem: por posição (do gol pro ataque), depois por ano
const ORDEM = { GOL: 0, LAT: 1, ZAG: 2, MEI: 3, ATA: 4 }
cartas.sort((a, b) => ORDEM[a.pos] - ORDEM[b.pos] || a.year - b.year)
console.log(`${cartas.length} cartas novas:`)
for (const c of cartas) console.log(`  ${c.pos.padEnd(3)} ${c.nome.padEnd(18)} ${c.club} · ${c.year}`)

// 💚 UMA COR SÓ (aprovado pelo Diego no post da Chape): sem tier, sem estrela,
// sem nível. O verde é o do jogo; aqui ele não significa categoria nenhuma.
const VERDE_CARTA = 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)'

const carta = c => `
  <div style="width:100%;position:relative;overflow:hidden;border:3px solid ${INK};border-radius:14px;
              display:flex;flex-direction:column;justify-content:space-between;
              background:${VERDE_CARTA};aspect-ratio:3/4.2;box-shadow:4px 5px 0 0 ${INK};padding:10px">
    <div style="position:relative">
      <span style="${OSW};background:${INK};color:#fff;border:2px solid rgba(255,255,255,.25);
                   border-radius:7px;font-size:10px;padding:2px 7px">${c.pos}</span>
    </div>
    <div style="position:relative;align-self:center;width:58px;height:58px;border-radius:50%;
                display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.35);
                color:#14532d;border:3px solid rgba(0,0,0,.28);${OSW};font-size:25px;
                box-shadow:inset 0 0 12px rgba(255,255,255,.6)">${c.nome.trim()[0].toUpperCase()}</div>
    <div style="position:relative;text-align:center">
      <p style="${OSW};color:#fff;font-size:17px;line-height:1.12;margin:0;white-space:nowrap;
                overflow:hidden;text-overflow:ellipsis">${c.nome}</p>
      <p style="font-weight:800;color:#fff;opacity:.72;font-size:10px;margin:3px 0 0">${c.club} · ${c.year}</p>
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};color:${INK};font-family:system-ui,-apple-system,sans-serif;
     width:1080px;height:1920px;padding:52px 52px 40px;display:flex;flex-direction:column}
</style></head><body>

  <div style="flex:none">
    <div style="display:inline-block;background:${GOLD};border:4px solid ${INK};border-radius:999px;
      box-shadow:5px 5px 0 ${INK};padding:9px 26px;${OSW};font-size:23px;letter-spacing:1.4px;text-transform:uppercase">
      🃏 entraram agora no jogo</div>

    <h1 style="${OSW};font-size:86px;line-height:1.04;margin:20px 0 0;text-transform:uppercase">
      ${cartas.length} jogadores<br>novos no <span style="color:${VERDE}">Leilão Legends</span></h1>

    <p style="font-size:25px;font-weight:600;line-height:1.42;margin:20px 0 0">
      Do artilheiro da Libertadores de 99 ao lateral que virou o melhor do país.
      Agora eles estão no pregão — e podem cair no seu time.</p>
  </div>

  <div style="flex:1;min-height:0;display:flex;align-items:center">
    <div style="width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:20px 18px">
      ${cartas.map(carta).join('')}
    </div>
  </div>

  <p style="flex:none;${OSW};font-size:26px;text-align:center">
    ⚽ Leilão <span style="color:#C2452F">Legends</span>
    <span style="font-weight:600;font-size:20px;opacity:.55;margin-left:10px">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mock-jog-novos-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(500)
await p.screenshot({ path: SAIDA })
await b.close()
console.log(`\n${SAIDA} — 1080x1920`)
