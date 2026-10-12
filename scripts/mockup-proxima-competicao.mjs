// 🔜 MOCKUP — "NÃO SAI, AINDA TEM COMPETIÇÃO" (13/10)
//
// Diego, com print da sala do Neymarzetti no Rio × São Paulo: *"a gente chega nessa área e não
// sabe que tem outra competição e sai antes disso... e aí chega na hora de escolher o time a
// pessoa já saiu"*. Vale pra TODA competição de sala online com convocação (Copa regional,
// Copa do Mundo, Libertadores, Champions, Copa dos 8).
// Culpado nº 1 achado no código: o cartão do fim diz "Ano que vem tem pregão de novo" — parece
// que o jogo ACABOU — e o banner da próxima competição vem DEPOIS dele.
//
//   node scripts/mockup-proxima-competicao.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'

const tabela = ['Rei de Copas', 'João Maduro', 'Didico', 'DOMCITY', 'Las Mulas', 'Eh Rogo', 'Neymarzetti 👑'].map((n, i) =>
  `<div class="tr ${i === 6 ? 'eu' : ''}"><b>${i + 1}º</b><span>${n}</span><i>${[30, 27, 25, 22, 20, 18, 15][i]}</i></div>`).join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Inter,Arial,sans-serif;color:${INK};width:1320px;padding:40px 44px}
h1{font:700 50px/1 Oswald;text-transform:uppercase;margin:0}h1 span{color:${RED}}
.sub{font:500 22px Oswald;color:rgba(0,0,0,.6);margin-top:8px}
.cols{display:flex;gap:30px;margin-top:28px}.col{flex:1}
.lab{font:700 26px Oswald;text-transform:uppercase;text-align:center;margin-bottom:12px}.lab b{display:inline-grid;place-items:center;width:38px;height:38px;border:3px solid #000;border-radius:11px;background:${GOLD};box-shadow:3px 3px 0 #000;margin-right:8px}
.ph{width:380px;height:740px;margin:0 auto;border:5px solid #000;border-radius:42px;box-shadow:8px 8px 0 #000;overflow:hidden;position:relative;background:#F4ECD6;padding:16px 14px}
.cap{font:700 13px Oswald;letter-spacing:.14em;color:rgba(0,0,0,.45);text-align:center;margin:4px 0 8px;text-transform:uppercase}
.placar{background:${INK};color:#fff;border-radius:16px;border:3px solid #000;padding:14px;text-align:center;box-shadow:4px 4px 0 #000}
.placar .r{font:700 14px Oswald;color:${GOLD};letter-spacing:.1em}.placar .s{font:700 40px Oswald;margin-top:4px}
.faixa{margin-top:12px;border:3px solid #000;border-radius:14px;background:${GOLD};box-shadow:4px 4px 0 #000;padding:10px 12px;display:flex;gap:10px;align-items:center}
.faixa .e{font-size:34px}.faixa b{font:700 19px/1.05 Oswald;text-transform:uppercase;display:block}.faixa span{font-size:13px;font-weight:600}
.tab{margin-top:12px;background:#fff;border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:6px 10px}
.tr{display:flex;gap:10px;font-size:14px;font-weight:600;padding:5px 2px;border-bottom:1px solid #eee}.tr b{font:700 14px Oswald;width:24px}.tr span{flex:1}.tr i{font-style:normal;font:700 14px Oswald}
.tr.eu{background:#FFF3D6;border-radius:6px}
.stage{background:linear-gradient(180deg,#151515,#262626);color:#fff;border:3px solid #000;border-radius:18px;box-shadow:4px 4px 0 #000;padding:16px 14px}
.stage .k{font:700 12px Oswald;letter-spacing:.16em;color:${GOLD}}.stage h2{font:700 34px/1 Oswald;margin:6px 0 6px;text-transform:uppercase}
.stage p{font-size:13px;margin:0;color:rgba(255,255,255,.85)}
.nao{margin-top:12px;background:${RED};color:#fff;border:3px solid #000;border-radius:14px;padding:10px 12px;box-shadow:3px 3px 0 #000}
.nao b{font:700 22px Oswald;display:block;text-transform:uppercase}.nao span{font-size:13px;font-weight:600}
.fila{margin-top:10px;background:#fff;color:${INK};border-radius:12px;border:2px solid #000;padding:8px 10px;font:700 15px Oswald;display:flex;justify-content:space-between}
.fila i{font-style:normal;color:${GREEN}}
.fim{margin-top:12px;background:${INK};color:#fff;border-radius:16px;border:3px solid #000;padding:12px;text-align:center;opacity:.92}
.fim b{font:700 22px Oswald;display:block}.fim span{font-size:12px;color:rgba(255,255,255,.75)}.fim em{font-style:normal;color:${GOLD};font-weight:800}
.vez{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px}
.vez .c{background:${GOLD};border:4px solid #000;border-radius:22px;box-shadow:6px 6px 0 #000;padding:22px 18px;text-align:center;width:100%}
.vez .c .e{font-size:58px}.vez .c b{font:700 40px/1 Oswald;display:block;text-transform:uppercase;margin-top:6px}
.vez .c span{display:block;font-size:15px;font-weight:600;margin-top:8px}.vez .c .bt{margin-top:16px;background:${GREEN};color:#fff;border:3px solid #000;border-radius:12px;box-shadow:3px 3px 0 #000;font:700 22px Oswald;padding:10px;text-transform:uppercase}
.aba{position:absolute;top:0;left:0;right:0;background:#2b2b2b;color:#fff;font:700 13px Oswald;padding:7px 14px;display:flex;gap:8px;align-items:center}
.aba span{background:#444;border-radius:8px 8px 0 0;padding:4px 10px}
.leg{margin-top:26px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.lg{background:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 16px}
.lg b{font:700 22px Oswald;text-transform:uppercase;display:block;margin-bottom:4px}.lg span{font-size:16px;line-height:1.35;font-weight:500}
.nota{margin-top:20px;background:${GREEN};color:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 20px;font:700 21px/1.3 Oswald}
</style></head><body>
<h1>🔜 Não sai! <span>Ainda tem competição</span></h1>
<div class="sub">Vale pra toda competição com convocação nas salas online: Copa regional (Rio × SP…), Copa do Mundo, Libertadores, Champions e Copa dos 8.</div>
<div class="cols">
  <div class="col"><div class="lab"><b>1</b>Avisar antes</div>
    <div class="ph"><div class="cap">Liga · rodada 35 de 38</div>
      <div class="placar"><div class="r">RODADA 35</div><div class="s">2 × 1</div></div>
      <div class="faixa"><div class="e">🏖️🏙️</div><div><b>Depois da liga: Rio × São Paulo</b><span>Os 16 primeiros escolhem clube e convocam. Fica até o fim!</span></div></div>
      <div class="tab">${tabela}</div>
    </div>
  </div>
  <div class="col"><div class="lab"><b>2</b>Competição em 1º lugar</div>
    <div class="ph"><div class="cap">🏁 Fim da liga</div>
      <div class="stage"><div class="k">A LIGA TERMINOU · AGORA TEM</div><h2>🏖️🏙️ Rio × São Paulo</h2><p>Os 16 primeiros escolhem um clube na ordem da tabela e convocam os 11.</p>
        <div class="nao"><b>⏳ Não sai! Você joga</b><span>Você é o 7º a escolher. Sua vez em ~2 min.</span></div>
        <div class="fila"><span>Agora: Didico escolhendo</span><i>43s</i></div>
      </div>
      <div class="fim"><b>8º lugar na Liga</b><span>Campeão: Rei de Copas. <em>Agora tem Rio × São Paulo ↑</em></span></div>
    </div>
  </div>
  <div class="col"><div class="lab"><b>3</b>Chamar na sua vez</div>
    <div class="ph"><div class="aba"><span>⚠️ SUA VEZ! · Leilão Legends</span></div>
      <div class="cap" style="margin-top:34px">(o celular vibra e toca o apito)</div>
      <div class="vez"><div class="c"><div class="e">📣</div><b>Sua vez de escolher!</b><span>Rio × São Paulo · você tem 45s pra pegar o clube</span><div class="bt">Escolher meu clube</div></div></div>
    </div>
  </div>
</div>
<div class="leg">
  <div class="lg"><b>1 · Avisar antes</b><span>Nas últimas 5 rodadas da liga aparece uma faixa: "Depois da liga tem Rio × São Paulo". Ninguém chega no fim achando que acabou.</span></div>
  <div class="lg"><b>2 · Competição em 1º lugar</b><span>No fim, a competição sobe pro topo com "Não sai! Sua vez em ~2 min". A frase "ano que vem tem pregão de novo", que dava a impressão de que o jogo tinha acabado, sai.</span></div>
  <div class="lg"><b>3 · Chamar na sua vez</b><span>Na sua vez, o celular vibra, o apito toca (se o som estiver ligado) e a aba do navegador muda pra "⚠️ SUA VEZ!", mesmo se a pessoa estiver em outra aba.</span></div>
</div>
<div class="nota">Não muda nenhuma regra nem o tempo de escolha. É só aviso, e não gasta mensagem a mais do Supabase.</div>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1320, height: 1300 } })
const tmp = resolve(tmpdir(), `prox-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/proxima-competicao.png', fullPage: true }); await b.close()
console.log('🔜 scripts/mockups/proxima-competicao.png')
