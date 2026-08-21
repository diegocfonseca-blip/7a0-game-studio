// 💚 MOCKUP STORIES — HOMENAGEM À CHAPECOENSE
//
// Nasceu em 21/08, quando o Diego completou o time da Chape no jogo (Follmann,
// Cléber Santana, Bruno Rangel e Kempes entraram junto dos que já estavam) e
// pediu um post pra marcar o clube, a família e os sobreviventes.
//
// Mora no repo (e não no scratchpad) pela mesma razão do `mockup-batismo.mjs`:
// mockup feito à mão SE PERDE, e a próxima leva de cartas da Chape teria que
// ser desenhada do zero. Quando entrar mais gente, é só rodar de novo — a lista
// sai do próprio `data.ts`, então o post nunca discorda do jogo.
//
// A carta aqui é a MESMA do jogo (`FAME_TIER` em `screens.tsx`): degradê por
// tier, borda preta grossa, sombra dura, Oswald, selo da posição, bolinha com a
// inicial e as estrelas. Nada de arte inventada.
//
//   node scripts/mockup-chape.mjs                → chape.png (1080×1920, Stories)
//   node scripts/mockup-chape.mjs --saida x.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'chape.png')

// ── quem é da Chape: lê do BARALHO, não de lista escrita à mão ──
const data = readFileSync('src/escalacao/data.ts', 'utf8')
const re = /\{[^{}]*?name:\s*("[^"]+"|'[^']+'),\s*club:\s*("[^"]*"|'[^']*'),\s*year:\s*(\d+),\s*fame:\s*(\d)/g
const st = s => s.slice(1, -1)
const blocos = [...data.matchAll(/const (\w+): C\[\] = \[/g)].map(m => ({ n: m[1], p: m.index }))
const blocoDe = p => { let r = ''; for (const b of blocos) { if (b.p < p) r = b.n; else break } return r }
const posDe = b => b.includes('GOL') ? 'GOL' : b.includes('LAT') ? 'LAT' : b.includes('ZAG') ? 'ZAG' : b.includes('MEI') ? 'MEI' : 'ATA'
const ORD = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const cartas = [...data.matchAll(re)]
  .map(m => ({ nome: st(m[1]), club: st(m[2]), year: +m[3], fame: +m[4], pos: posDe(blocoDe(m.index)) }))
  .filter(c => c.club === 'Chapecoense')
  .sort((a, b) => ORD.indexOf(a.pos) - ORD.indexOf(b.pos) || b.fame - a.fame)

// ── 💚 TODAS VERDES, SEM NÍVEL (decisão do Diego, 21/08) ────────────────────
// No JOGO cada carta sai na cor do tier dela (verde = bom jogador, bege = foi
// profissional, dourado = lenda). NESTE POST, não: as sete saem no MESMO verde,
// sem estrela e sem o nome da categoria. É homenagem — aqui ninguém é melhor
// que ninguém, e o post não fica parecendo tabela de ranking dos mortos e dos
// sobreviventes. O verde é o do tier "bom jogador" do jogo, que por acaso é o
// verde da Chape. O NOME vem maior justamente porque é ele que importa aqui.
const VERDE_CARTA = 'linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45)'

const carta = c => `
  <div style="width:234px;position:relative;overflow:hidden;border:3px solid #0C0C0C;border-radius:16px;display:flex;flex-direction:column;justify-content:space-between;
              background:${VERDE_CARTA};aspect-ratio:3/4.2;box-shadow:5px 6px 0 0 #0C0C0C;padding:11px">
    <div style="position:relative">
      <span style="font-family:Oswald,sans-serif;font-weight:700;background:#0C0C0C;color:#fff;border:2px solid rgba(255,255,255,.25);border-radius:8px;font-size:11px;padding:2px 7px">${c.pos}</span>
    </div>
    <div style="position:relative;align-self:center;width:66px;height:66px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                background:rgba(255,255,255,.35);color:#14532d;border:3px solid rgba(0,0,0,.28);font-family:Oswald,sans-serif;font-weight:700;font-size:28px;
                box-shadow:inset 0 0 14px rgba(255,255,255,.6)">${c.nome.trim()[0].toUpperCase()}</div>
    <div style="position:relative;text-align:center">
      <p style="font-family:Oswald,sans-serif;font-weight:700;color:#fff;font-size:20px;line-height:1.12;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nome}</p>
      <p style="font-weight:800;color:#fff;opacity:.7;font-size:11px;margin:3px 0 0">${c.club} · ${c.year}</p>
    </div>
  </div>`

const VERDE = '#1B7A3D'
const html = `<!doctype html><html><head><meta charset="utf-8">
<style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:#F4ECD6;color:#0C0C0C;font-family:system-ui,-apple-system,sans-serif;width:1080px;height:1920px;
     padding:64px 52px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between}</style>
</head><body>

  <div>
    <div style="display:inline-block;background:${VERDE};color:#fff;border:4px solid #0C0C0C;border-radius:999px;box-shadow:5px 5px 0 #0C0C0C;padding:10px 26px;
                font-family:Oswald,sans-serif;font-weight:700;font-size:24px;letter-spacing:1.6px;text-transform:uppercase">💚 Homenagem</div>

    <h1 style="font-family:Oswald,sans-serif;font-weight:700;font-size:92px;line-height:1.22;margin:18px 0 0;text-transform:uppercase">
      A Chape está<br>no <span style="color:${VERDE}">Leilão Legends</span></h1>

    <p style="font-size:27px;font-weight:600;line-height:1.42;margin:26px 0 0">
      Sete cartas do <b>Verdão do Oeste</b> dentro do jogo — do goleiro-herói da campanha de 2016
      ao maior artilheiro da história do clube. Cada um com a <b>história dele escrita na carta</b>.
    </p>
  </div>

  <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:10px 0 0">
    ${cartas.map(carta).join('')}
  </div>

  <div>
    <p style="text-align:center;font-family:Oswald,sans-serif;font-weight:700;font-size:30px;letter-spacing:.5px;margin:0 0 26px;color:#1B7A3D">
      28 de novembro de 2016 &middot; nunca esquecemos 💚</p>
    <div style="background:#fff;border:5px solid #0C0C0C;border-radius:22px;box-shadow:6px 6px 0 #0C0C0C;padding:26px 30px">
      <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:29px;margin:0 0 12px;text-transform:uppercase">Eles disputam leilão como qualquer lenda</p>
      <p style="font-size:24px;font-weight:600;line-height:1.4;margin:0">
        Não é enfeite: eles entram no sorteio do leilão, você briga pra arrematar e escala eles no seu time.
        Quem pega, leva a história junto. 💚
      </p>
    </div>

    <div style="margin-top:26px;background:${VERDE};color:#fff;border:5px solid #0C0C0C;border-radius:22px;box-shadow:6px 6px 0 #0C0C0C;padding:26px 30px;text-align:center">
      <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:44px;margin:0;text-transform:uppercase;line-height:1.05">Em breve, mais deles aqui!</p>
    </div>

    <p style="margin:30px 0 0;font-family:Oswald,sans-serif;font-weight:700;font-size:32px;display:flex;justify-content:space-between;align-items:baseline">
      <span>⚽ Leilão <span style="color:#C2452F">Legends</span></span>
      <span style="font-size:23px;opacity:.55">leilaolegends.com</span></p>
    <p style="margin:6px 0 0;font-size:21px;font-weight:600;opacity:.62">Grátis, direto no navegador — não precisa baixar nada.</p>
  </div>

</body></html>`

const tmp = `/tmp/mockup-chape-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA })
await b.close()
console.log(`${SAIDA} · ${cartas.length} cartas da Chape: ${cartas.map(c => c.nome).join(', ')}`)
