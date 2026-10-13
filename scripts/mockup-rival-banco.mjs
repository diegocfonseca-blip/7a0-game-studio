// 🔁 MOCKUP — RIVAL CANSA, SE MACHUCA E TEM BANCO DE 22 (+ mais dinheiro pros bots) (13/10)
//
// Diego: *"gostei do rival também cansa e machuca e também pode comprar 22 jogadores"* e
// *"de alguma forma rival e bots têm que ganhar mais dinheiro também no jogo"*.
// Hoje: bot comum tem só 11 (rival/backstop chega a 22 no leilão de reservas), nunca cansa
// (`guardaCansaco` pula bot) e nunca se machuca (`sorteiaLesaoDesgaste` só rola o XI humano).
// Dinheiro do bot hoje: TV + bilheteria − folha (`balancoBot`). Com 22 a folha dobra → entra
// PATROCÍNIO (a mesma régua do Master de 2 temporadas) e PRÊMIO PELA COLOCAÇÃO.
//
//   node scripts/mockup-rival-banco.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const b64 = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w}}`).join('')
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'

const linha = (pos, nome, gas, st = '') => {
  const cor = gas > 70 ? GREEN : gas > 49 ? '#C77800' : RED
  return `<div class="ln"><b>${pos}</b><span>${nome}</span><div class="gb"><i style="width:${gas}%;background:${cor}"></i></div><em>${st}</em></div>`
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Inter,Arial,sans-serif;color:${INK};width:1320px;padding:40px 44px}
h1{font:700 48px/1 Oswald;text-transform:uppercase;margin:0}h1 span{color:${RED}}
.sub{font:500 21px Oswald;color:rgba(0,0,0,.6);margin-top:8px}
.cols{display:flex;gap:28px;margin-top:26px}.col{flex:1}
.lab{font:700 25px Oswald;text-transform:uppercase;text-align:center;margin-bottom:12px}.lab b{display:inline-grid;place-items:center;width:38px;height:38px;border:3px solid #000;border-radius:11px;background:${GOLD};box-shadow:3px 3px 0 #000;margin-right:8px}
.ph{width:380px;height:720px;margin:0 auto;border:5px solid #000;border-radius:42px;box-shadow:8px 8px 0 #000;overflow:hidden;background:#F4ECD6;padding:18px 14px}
.cap{font:700 13px Oswald;letter-spacing:.14em;color:rgba(0,0,0,.45);text-align:center;margin:2px 0 10px;text-transform:uppercase}
.box{background:#fff;border:3px solid #000;border-radius:14px;box-shadow:3px 3px 0 #000;padding:10px 12px;margin-bottom:12px}
.box h3{font:700 16px Oswald;text-transform:uppercase;margin:0 0 6px}
.ln{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;padding:4px 0;border-bottom:1px solid #eee}
.ln b{font:700 12px Oswald;width:30px}.ln span{flex:1}.ln em{font-style:normal;font:700 12px Oswald;width:62px;text-align:right}
.gb{width:62px;height:8px;border:1.5px solid #000;border-radius:5px;overflow:hidden;background:#eee}.gb i{display:block;height:100%}
.sai{color:${RED}}.entra{color:${GREEN}}
.news{background:${INK};color:#fff;border-radius:14px;border:3px solid #000;box-shadow:3px 3px 0 #000;padding:10px 12px;margin-bottom:10px}
.news .k{font:700 11px Oswald;letter-spacing:.14em;color:${GOLD}}.news p{margin:4px 0 0;font-size:14px;font-weight:600;line-height:1.35}
.ec{display:flex;justify-content:space-between;font-size:14px;font-weight:600;padding:5px 0;border-bottom:1px dashed #ddd}
.ec.n{color:${GREEN}}.ec.n b::after{content:' NOVO';font:700 10px Oswald;background:${GOLD};color:#000;border:1.5px solid #000;border-radius:5px;padding:0 4px;margin-left:6px}
.ec.t{border:0;font:700 18px Oswald;padding-top:8px}
.leg{margin-top:24px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.lg{background:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 16px}
.lg b{font:700 22px Oswald;text-transform:uppercase;display:block;margin-bottom:4px}.lg span{font-size:16px;line-height:1.35;font-weight:500}
.nota{margin-top:20px;background:${GREEN};color:#fff;border:4px solid #000;border-radius:18px;box-shadow:5px 5px 0 #000;padding:14px 20px;font:700 21px/1.3 Oswald}
</style></head><body>
<h1>🔁 Rival com banco <span>— cansa, se machuca e roda o time</span></h1>
<div class="sub">Só na carreira. A mesma regra de gás e lesão que vale pro seu time passa a valer pros bots.</div>
<div class="cols">
  <div class="col"><div class="lab"><b>1</b>Elenco de 22</div>
    <div class="ph"><div class="cap">Ficha do rival · Flamengo (bot)</div>
      <div class="box"><h3>⚽ Titulares · rodada 24</h3>
        ${linha('GOL', 'Júlio César', 88)}${linha('ZAG', 'Aldair', 41, '😓 sai')}${linha('ZAG', 'Lúcio', 76)}${linha('MEI', 'Zico', 63)}${linha('MEI', 'Adílio', 0, '🚑 3 jogos')}${linha('ATA', 'Romário', 55)}
      </div>
      <div class="box"><h3>🪑 Banco · entrou no lugar</h3>
        ${linha('ZAG', 'Mozer', 97, '<span class=entra>↑ entra</span>')}${linha('MEI', 'Andrade', 92, '<span class=entra>↑ entra</span>')}${linha('ATA', 'Nunes', 100, '')}
        <p style="font-size:12px;font-weight:700;color:rgba(0,0,0,.55);margin:6px 0 0">2 por posição, igual ao seu. Bot que não comprou o reserva joga com o cansado.</p>
      </div>
    </div>
  </div>
  <div class="col"><div class="lab"><b>2</b>Aparece no giro</div>
    <div class="ph"><div class="cap">📺 Central Legends · giro da rodada</div>
      <div class="news"><div class="k">🚑 DEPARTAMENTO MÉDICO</div><p>Adílio sente a coxa e desfalca o Flamengo por 3 jogos.</p></div>
      <div class="news"><div class="k">🔁 POUPADOS</div><p>Palmeiras poupa 3 titulares cansados contra o Bahia.</p></div>
      <div class="news"><div class="k">😓 NO LIMITE</div><p>Corinthians sem reserva na zaga: Gamarra vai pro 13º jogo seguido.</p></div>
      <div class="box" style="margin-top:4px"><h3>🆚 Seu próximo jogo</h3><p style="margin:0;font-size:14px;font-weight:600">Flamengo vem <b style="color:${RED}">sem Adílio</b> e com Aldair no banco.</p></div>
    </div>
  </div>
  <div class="col"><div class="lab"><b>3</b>Mais dinheiro pro bot</div>
    <div class="ph"><div class="cap">💰 Caixa dos rivais · Série A (por temporada)</div>
      <div class="box"><h3>Flamengo · entra e sai</h3>
        <div class="ec"><span>📺 TV</span><b>+50</b></div>
        <div class="ec"><span>🎟️ Bilheteria</span><b>+40</b></div>
        <div class="ec n"><span>🤝 Patrocínio</span><b>+56</b></div>
        <div class="ec n"><span>🏅 Prêmio da colocação (5º)</span><b>+24</b></div>
        <div class="ec"><span>👕 Salários (22 jogadores)</span><b style="color:${RED}">−130</b></div>
        <div class="ec t"><span>Sobra</span><b style="color:${GREEN}">+40</b></div>
      </div>
      <div class="box"><h3>🏅 Prêmio pela colocação</h3><p style="margin:0;font-size:13px;font-weight:600;line-height:1.4">Campeão 40 · 2º–4º 30 · 5º–8º 24 · meio 15 · Z4 8 (Série A — nas outras divisões, menos)</p></div>
    </div>
  </div>
</div>
<div class="leg">
  <div class="lg"><b>1 · Elenco de 22</b><span>Todo bot monta 2 por posição no leilão de reservas. Quem cansa (49% pra baixo) senta e o mais cheio do banco entra, igual ao seu rodízio.</span></div>
  <div class="lg"><b>2 · Aparece no giro</b><span>Lesão e poupados dos rivais viram notícia na Central. E você vê antes do jogo se o adversário vem desfalcado.</span></div>
  <div class="lg"><b>3 · Mais dinheiro pro bot</b><span>Com 22 a folha dobra. Entram 2 receitas novas: patrocínio (a mesma régua do seu Master) e prêmio pela colocação. Gastador continua quebrando.</span></div>
</div>
<div class="nota">Seu time não muda nada. Regra de gás, lesão e preço de jogador continuam iguais. Só os bots ganham banco, cansaço e dinheiro novo.</div>
</body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1320, height: 1300 } })
const tmp = resolve(tmpdir(), `rival-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.waitForTimeout(500); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/rival-banco.png', fullPage: true }); await b.close()
console.log('🔁 scripts/mockups/rival-banco.png')
