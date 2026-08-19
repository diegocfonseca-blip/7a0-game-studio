// 👑 MOCKUP DAS NOVAS LENDAS — quem subiu de ⭐ CRAQUE pra 👑 LENDA
//
// Nasceu em 19/08, quando o Diego promoveu 17 craques de uma vez e pediu pra VER
// como as cartas ficam. Mora no repo (e não no scratchpad) pela mesma razão do
// `mockup-batismo.mjs`: mockup feito à mão se perde, e aí a próxima leva de
// promoções teria que ser desenhada do zero de novo.
//
// A carta aqui é a MESMA do jogo (`CollectibleCard` em `screens.tsx`): degradê
// dourado do tier LENDA, borda preta grossa, sombra dura, Oswald, selo da
// posição, bolinha com a inicial e as 5 estrelas. Nada de arte inventada.
//
//   node scripts/mockup-lendas.mjs                 → lê os promovidos do git
//   node scripts/mockup-lendas.mjs --saida x.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

// 🔤 Oswald vem do ARQUIVO local (mesmo caminho do mockup do campinho): fonte
// baixada da internet na hora não carrega em máquina sem rede, e o mockup sai
// com a letra errada — o Diego reconhece a fonte da casa de olho.
const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'lendas.png')
// 📋 lista pronta, separada por vírgula. Serve pra REMONTAR uma leva que já foi
// absorvida pela foto do baralho (`catalogo-snapshot.json`): depois que o
// `npm run novidades` roda, a leva anterior some do arquivo gerado e o mockup
// dela não teria como ser refeito. Aconteceu em 19/08 — duas sessões
// promoveram no mesmo dia e o Diego quis as duas levas num mockup só.
const NOMES = arg('--nomes', null)

// ── quem subiu: lê do arquivo GERADO pelo `npm run novidades` (fonte única —
//    assim o mockup nunca discorda do que a home vai anunciar pro jogador) ──
const ger = readFileSync('src/escalacao/novidades-jogadores.ts', 'utf8')
const bloco = ger.match(/export const MUDANCAS_JOGADORES: MudancaJogador\[\] = (\[[\s\S]*?\n\])/)[1]
const mudancas = JSON.parse(bloco)
const viraramLenda = mudancas.filter(m => m.tipo === 'nivel' && m.para === 'lenda')
// só a leva MAIS NOVA por padrão (o arquivo guarda o histórico das levas
// anteriores também). `--tudo` mostra todas as promoções que ainda estão lá.
const ultima = viraramLenda.map(m => m.data).sort().pop()
const subiram = NOMES ? NOMES.split(',').map(x => x.trim()).filter(Boolean)
  : (process.argv.includes('--tudo') ? viraramLenda : viraramLenda.filter(m => m.data === ultima)).map(m => m.nome)

// ── dados da carta (nome/clube/ano/posição) direto do baralho ──
const data = readFileSync('src/escalacao/data.ts', 'utf8')
const re = /\{[^{}]*?name:\s*("[^"]+"|'[^']+'),\s*club:\s*("[^"]*"|'[^']*'),\s*year:\s*(\d+),\s*fame:\s*(\d)/g
const st = s => s.slice(1, -1)
const blocos = [...data.matchAll(/const (\w+): C\[\] = \[/g)].map(m => ({ n: m[1], p: m.index }))
const blocoDe = p => { let r = ''; for (const b of blocos) { if (b.p < p) r = b.n; else break } return r }
const posDe = b => b.includes('GOL') ? 'GOL' : b.includes('LAT') ? 'LAT' : b.includes('ZAG') ? 'ZAG' : b.includes('MEI') ? 'MEI' : 'ATA'
const todas = [...data.matchAll(re)].map(m => {
  const bl = blocoDe(m.index)
  return { nome: st(m[1]), club: st(m[2]), year: +m[3], fame: +m[4], pos: posDe(bl) }
})
const cartas = subiram
  .map(n => todas.find(c => c.nome === n && c.fame === 5))
  .filter(Boolean)
  .sort((a, b) => ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].indexOf(a.pos) - ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'].indexOf(b.pos) || a.year - b.year)
const totalLendas = todas.filter(c => c.fame === 5).length

// ── a carta, pixel a pixel igual à do jogo (tier 👑 LENDA) ──
const OURO = 'linear-gradient(150deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)'
const carta = c => `
  <div style="position:relative;overflow:hidden;border:3px solid #0C0C0C;border-radius:16px;display:flex;flex-direction:column;justify-content:space-between;
              background:${OURO};aspect-ratio:3/4.2;box-shadow:5px 6px 0 0 #0C0C0C;padding:11px">
    <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.85) 48%,transparent 62%);background-size:250% 250%;background-position:60% 60%"></div>
    <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:4px">
      <span style="font-family:Oswald,sans-serif;font-weight:700;background:#0C0C0C;color:#fff;border:2px solid rgba(255,255,255,.25);border-radius:8px;font-size:11px;padding:2px 7px">${c.pos}</span>
      <span style="font-family:Oswald,sans-serif;font-weight:700;letter-spacing:.5px;color:#7a4d00;font-size:9px">👑 LENDA</span>
    </div>
    <div style="position:relative;align-self:center;width:66px;height:66px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                background:rgba(255,255,255,.42);color:#7a4d00;border:3px solid rgba(0,0,0,.28);font-family:Oswald,sans-serif;font-weight:700;font-size:27px;
                box-shadow:inset 0 0 14px rgba(255,255,255,.7)">${c.nome.trim()[0].toUpperCase()}</div>
    <div style="position:relative">
      <p style="font-family:Oswald,sans-serif;font-weight:700;color:#0C0C0C;font-size:15px;line-height:1.2;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nome}</p>
      <p style="font-weight:800;color:#0C0C0C;opacity:.62;font-size:10px;margin:1px 0 0">${c.club} · ${c.year}</p>
      <p style="font-size:11px;letter-spacing:1px;margin:3px 0 0">⭐⭐⭐⭐⭐</p>
    </div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>${FONTES}
body{margin:0;background:#F4ECD6;color:#0C0C0C;font-family:system-ui,-apple-system,sans-serif;width:1100px;padding:34px 30px 30px}</style>
</head><body>
  <div style="display:inline-block;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;box-shadow:3px 3px 0 #0C0C0C;padding:6px 16px;
              font-family:Oswald,sans-serif;font-weight:700;font-size:14px;letter-spacing:1.2px;text-transform:uppercase">👑 Mockup · as novas lendas</div>
  <h1 style="font-family:Oswald,sans-serif;font-weight:700;font-size:58px;line-height:.98;margin:14px 0 6px;text-transform:uppercase">
    ${cartas.length} craques viraram <span style="color:#C2452F">lenda</span></h1>
  <p style="font-size:16px;font-weight:600;max-width:760px;margin:0 0 22px;line-height:1.4">
    A carta é a mesma do jogo — só troca o tier: sai o prateado do <b>⭐ CRAQUE</b> e entra o
    <b>dourado brilhante do 👑 LENDA</b>, com as 5 estrelas. O jogo passa a ter <b>${totalLendas} lendas</b>.
  </p>
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:16px">${cartas.map(carta).join('')}</div>
  <div style="margin-top:24px;background:#fff;border:4px solid #0C0C0C;border-radius:18px;box-shadow:4px 4px 0 #0C0C0C;padding:16px 18px">
    <p style="font-family:Oswald,sans-serif;font-weight:700;font-size:15px;margin:0 0 8px;text-transform:uppercase">O que muda pra quem joga</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13.5px;font-weight:600;line-height:1.45">
      <p style="margin:0">🔨 <b>No leilão</b> eles passam a sair na cota de LENDA (16% por posição) e valem mais caro — o nível muda, a <b>força de cada um continua a mesma</b>.</p>
      <p style="margin:0">🃏 <b>No álbum</b> a carta vira dourada com o brilho passando. Quem já tinha a carta prateada guardada vê ela virar ouro.</p>
      <p style="margin:0">📣 <b>Na home</b> as ${cartas.length} subidas são anunciadas sozinhas (saiu do <code>npm run novidades</code>) — ninguém precisa escrever nada.</p>
      <p style="margin:0">↩️ <b>Dá pra voltar atrás</b>: é um commit isolado, e voltar não mexe em carreira, álbum nem ranking de ninguém.</p>
    </div>
  </div>
  <p style="margin-top:18px;font-family:Oswald,sans-serif;font-weight:700;font-size:15px">⚽ Leilão <span style="color:#C2452F">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-lendas-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(`${SAIDA} · ${cartas.length} cartas · ${totalLendas} lendas no total`)
