// 👟 MOCKUP — FORNECEDOR DE MATERIAL com as 20 marcas (esperando OK do Diego)
//
// Ele mandou as 20 marcas e perguntou: *"vai ser com base na divisão ou você acha
// melhor variar? A pessoa pode renovar contrato com a atual ou sempre varia entre
// mais 4 diferentes? Ou cada divisão tem sempre as mesmas 4?"*. O desenho que ele
// topou ("Topo"):
//   ① a FORMA não muda — 4 papéis na mesa, um de cada prazo (1 · 2 · 3 · 5);
//   ② quem OCUPA cada papel é sorteado no seu andar de ambição, então a vitrine
//      nunca é a mesma duas viradas seguidas;
//   ③ subir de divisão = marca maior bate na porta (o `desde` que já existe hoje);
//   ④ a marca ATUAL pode renovar, numa faixa em cima dos 4 papéis, com bônus de
//      fidelidade — continua um toque só, e nasce história ("12 anos de Abibas").
//
// A cena copia a tela de verdade (`FornPapel`/`FornBanner` em estadio.tsx): mesmo
// papel creme, mesma borda preta, mesmo chip de prazo, mesmos números.
// ⚠️ Nada disto está no jogo — é desenho pra aprovar.
//
// Rodar (da raiz do repo):  node scripts/mockup-fornecedores.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

// 💰 a régua REAL do jogo (loja.ts): base por divisão × (1,25 + (anos−1)/2)
const FORN_BASE = { V: 2, D: 3, C: 6, B: 12, A: 24 }
const porTemp = (div, anos) => Math.round(FORN_BASE[div] * (1.25 + (anos - 1) / 2))
// 🛍️ o bônus de loja continua preso ao PRAZO (como hoje): 10 · 20 · 30 · 45
const BONUS = { 1: 10, 2: 20, 3: 30, 5: 45 }

// 🪜 OS 5 ANDARES — a escada que o DIEGO montou (20/09), com os nomes dele:
//   1ª Elite e Luxo · 2ª Desafiantes de Peso · 3ª Forças Tradicionais ·
//   4ª Clássicas Regionais · 5ª Várzea e Improviso.
// O PRAZO de cada marca dentro do andar é proposta minha (esperando OK): quanto
// mais "de futebol" a marca, mais longo o contrato; grife faz contrato curto.
// ⚠️ As 4 marcas que JÁ EXISTEM no jogo mantêm o prazo que sempre tiveram —
// Naique 5 · Pumba 3 · Abibas (Adibas) 2 · Penality (Pênalti do Bairro) 1 —
// senão contrato correndo de save antigo mudaria de tamanho no meio.
const ANDARES = {
  V: { nome: 'Várzea', apelido: 'Várzea e Improviso', marcas: [['Hawaianos', '🩴', 1], ['Vanps', '▤', 2], ['Filia', 'Ⅎ', 3], ['Reboque', '↺', 5]] },
  D: { nome: 'Série D', apelido: 'Clássicas Regionais', marcas: [['Penality', '⬤', 1], ['Olímpicos', '◎', 2], ['Toppeira', '👟', 3], ['Tiadora', '◐', 5]] },
  C: { nome: 'Série C', apelido: 'Forças Tradicionais', marcas: [['Kasppa', '◈', 1], ['Ombro', '◣', 2], ['Meuzuno', '〜', 3], ['Under Amor', '⩓', 5]] },
  B: { nome: 'Série B', apelido: 'Desafiantes de Peso', marcas: [['Luis Vitão', '⧗', 1], ['Lacospe', '🐊', 2], ['Eisics', '≋', 3], ['New Bala', 'N', 5]] },
  A: { nome: 'Série A', apelido: 'Elite e Luxo', marcas: [['GuchiGuchi', '⊛', 1], ['Abibas', '◤', 2], ['Pumba', '🐆', 3], ['Naique', '✓', 5]] },
}

const papel = (div, [nome, simb, anos], sel) => `
  <button class="papel${sel ? ' sel' : ''}">
    <span class="rot">MATERIAL ESPORTIVO</span>
    <span class="simb">${simb}</span>
    <span class="nome">${nome}</span>
    <span class="prazo">${anos} ${anos > 1 ? 'TEMPORADAS' : 'TEMPORADA'}</span>
    <span class="total">${porTemp(div, anos) * anos} 🪙</span>
    <span class="mini">no total</span>
    <span class="temp">= +${porTemp(div, anos)} por temporada</span>
    <span class="loja">+${BONUS[anos]}% na loja</span>
    <span class="pe">${sel ? 'toque em ASSINAR embaixo' : 'toque pra escolher'}</span>
  </button>`

const tela = (div, atual, selIdx) => {
  const a = ANDARES[div]
  const [nomeA, simbA, anosA] = atual
  return `
  <div class="tela">
    <div class="cab"><span>👟 FORNECEDOR DE MATERIAL</span><i>${a.nome.toUpperCase()} · CONTRATO ACABOU</i></div>
    <div class="corpo">
      <!-- ④ a faixa da renovação, em cima dos 4 papéis -->
      <div class="renova">
        <div class="rtxt">
          <b>🤝 A ${nomeA} quer ficar</b>
          <i>${anosA} temporadas de casa · renova por mais ${anosA} com <u>+5% na loja</u> de fidelidade</i>
        </div>
        <span class="rbtn">RENOVAR</span>
      </div>
      <p class="ou">— ou escolha uma das quatro que bateram na porta —</p>
      <div class="grade">${a.marcas.map((m, i) => papel(div, m, i === selIdx)).join('')}</div>
      <p class="expl">${(() => { const m = a.marcas[selIdx]; const t = porTemp(div, m[2]) * m[2]
        return `${t} moedas em ${m[2]} temporada${m[2] > 1 ? 's' : ''} = +${porTemp(div, m[2])} por temporada, e +${BONUS[m[2]]}% em tudo que a loja vender. O valor trava na ${a.nome}: subiu ou caiu, continua igual até o fim.` })()}</p>
      <div class="assinar">✍️ ASSINAR · ${a.marcas[selIdx][0].toUpperCase()} · ${a.marcas[selIdx][2]} ${a.marcas[selIdx][2] > 1 ? 'TEMPORADAS' : 'TEMPORADA'}</div>
    </div>
  </div>`
}

const escada = Object.entries(ANDARES).map(([k, a]) => `
  <div class="lin"><b>${a.nome}<i>${a.apelido}</i></b><span>${a.marcas.map(m => `${m[0]} <em>${m[2]}</em>`).join(' · ')}</span></div>`).reverse().join('')

const html = `<!doctype html><meta charset="utf-8"><style>
${FONTES}
*{box-sizing:border-box;margin:0}
body{background:#cfc4a6;font-family:system-ui,Arial,sans-serif;color:${INK}}
.board{display:flex;gap:26px;padding:28px;align-items:flex-start;width:max-content}
.col{width:430px}.col.notas{width:470px}
h1{font-family:Oswald;font-weight:700;font-size:26px;text-transform:uppercase;margin-bottom:4px;letter-spacing:.5px}
h1 span{display:block;font-family:system-ui;font-weight:700;font-size:13px;color:#4e4936;text-transform:none;letter-spacing:0;margin-top:3px}
.tela{background:${CREME};border:4px solid ${INK};border-radius:20px;box-shadow:5px 6px 0 ${INK};overflow:hidden;margin-top:12px}
.cab{background:linear-gradient(150deg,#1b2e1b,#2d6e3b);color:#fff;padding:11px 14px;display:flex;flex-direction:column;gap:2px}
.cab span{font-family:Oswald;font-weight:700;font-size:15px}
.cab i{font-style:normal;font-size:10px;font-weight:700;opacity:.75;letter-spacing:.08em}
.corpo{padding:12px}
.renova{background:${INK};color:#fff;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px}
.rtxt b{display:block;font-family:Oswald;font-weight:700;font-size:16px;color:${GOLD}}
.rtxt i{display:block;font-style:normal;font-size:10.5px;font-weight:700;color:rgba(255,255,255,.8);margin-top:2px;line-height:1.35}
.rtxt u{text-decoration:none;color:#9BE3B0}
.rbtn{flex:none;background:${GOLD};color:${INK};font-family:Oswald;font-weight:700;font-size:13px;border:3px solid ${INK};border-radius:10px;padding:8px 12px;box-shadow:2px 2px 0 rgba(255,255,255,.25)}
.ou{text-align:center;font-size:10.5px;font-weight:700;color:#6b6453;margin:9px 0}
.grade{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.papel{background:#f6efdc;border:3px solid ${INK};border-radius:6px;padding:9px 6px 7px;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:3px 3px 0 rgba(0,0,0,.55);text-align:center}
.papel.sel{border-color:${ROXO};outline:3px solid ${ROXO};outline-offset:1px;box-shadow:3px 3px 0 ${INK}}
.rot{font-family:Oswald;font-weight:600;font-size:7.5px;letter-spacing:.08em}
.simb{height:26px;display:flex;align-items:center;font-size:22px}
.nome{font-family:Oswald;font-weight:700;font-size:15px;line-height:1.05}
.prazo{font-family:Oswald;font-weight:700;font-size:11px;background:${INK};color:${GOLD};border-radius:5px;padding:1px 7px;margin-top:1px}
.total{font-family:Oswald;font-weight:700;font-size:24px;line-height:1;margin-top:4px}
.mini{font-size:9.5px;font-weight:600;opacity:.75}
.temp{font-family:Oswald;font-weight:700;font-size:12px;color:${GREEN};margin-top:2px}
.loja{font-family:Oswald;font-weight:700;font-size:10px;color:${ROXO}}
.pe{align-self:stretch;border-top:1px solid #897b5d;margin-top:5px;padding-top:3px;font-size:8px;font-weight:500;color:#62573f}
.expl{font-size:10.5px;font-weight:700;line-height:1.45;margin:10px 0 0;color:rgba(0,0,0,.7)}
.assinar{margin-top:10px;background:${GOLD};border:3px solid ${INK};border-radius:12px;padding:11px 10px;text-align:center;font-family:Oswald;font-weight:700;font-size:13.5px;box-shadow:3px 3px 0 ${INK}}
.nota{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:5px 6px 0 ${INK};padding:16px 18px;margin-top:12px}
.nota h2{font-family:Oswald;font-weight:700;font-size:20px;text-transform:uppercase;margin-bottom:8px}
.nota ul{margin:0 0 0 17px;padding:0}
.nota li{font-size:13px;font-weight:600;line-height:1.5;margin-bottom:7px}
.nota li b{font-weight:800}
.lin{display:flex;gap:8px;align-items:baseline;padding:6px 0;border-bottom:2px solid rgba(0,0,0,.07)}
.lin:last-child{border-bottom:0}
.lin b{font-family:Oswald;font-weight:700;font-size:15px;width:118px;flex:none}
.lin b i{display:block;font-style:normal;font-family:system-ui;font-weight:700;font-size:10px;color:#8a8069;margin-top:1px}
.lin em{font-style:normal;background:#0C0C0C;color:#FFC400;border-radius:4px;padding:0 4px;font-size:10px}
.lin span{font-size:12.5px;font-weight:700;color:#4e4936}
.tag{display:inline-block;background:${INK};color:${GOLD};font-family:Oswald;font-weight:700;font-size:11px;letter-spacing:1px;padding:3px 10px;border-radius:999px}
</style>
<div class="board">
  <div class="col">
    <h1>Quem está começando<span>Série D · a vitrine que bate na porta de quem ainda sobe</span></h1>
    ${tela('D', ['Toppeira', '👟', 3], 3)}
  </div>
  <div class="col">
    <h1>Quem chegou lá<span>Série A · mesma tela, marcas e cifras de gente grande</span></h1>
    ${tela('A', ['Abibas', '◤', 2], 2)}
  </div>
  <div class="col notas">
    <h1>As regras<span>o que muda e o que continua igual</span></h1>
    <div class="nota">
      <h2>🎯 A forma não muda</h2>
      <ul>
        <li><b>Sempre 4 papéis na mesa, um de cada prazo</b> (1 · 2 · 3 · 5 temporadas). A decisão é a mesma de hoje, e continua um toque: mais tempo = mais moeda no total e mais bônus na Loja.</li>
        <li><b>Quem ocupa cada papel é que muda.</b> As marcas são sorteadas dentro do seu andar — a vitrine nunca é a mesma duas viradas seguidas.</li>
        <li><b>O sorteio é preso na semente da carreira</b>: ninguém fecha e reabre o jogo pra "rolar de novo", e a temporada continua re-simulável igualzinho.</li>
        <li><b>Subir de divisão = marca maior bate na porta.</b> É o degrau de ambição que já existe hoje, agora com 20 nomes em vez de 4.</li>
        <li><b>A atual pode renovar</b>, na faixa preta em cima: mesmo prazo dela, com <b>+5% de fidelidade</b> na Loja. Dá pra ficar 12 anos com a mesma marca e virar história do clube.</li>
        <li><b>Toda marca do mesmo prazo vale o mesmo.</b> Não existe marca com regra especial: quem manda no dinheiro é o <b>prazo</b> e a <b>divisão</b>. A marca é só a cara e o nome na camisa.</li>
      </ul>
      <p style="font-size:12.5px;font-weight:700;line-height:1.5;margin-top:4px">⚖️ <b>Nada muda na economia:</b> o valor continua saindo da régua de hoje (base da divisão × prazo) e <b>trava na divisão em que você assinou</b> — subiu ou caiu, o contrato não quebra. Proposta nova só quando acabar.</p>
    </div>
    <div class="nota">
      <h2>🪜 Os cinco andares</h2>
      ${escada}
      <p style="font-size:12px;font-weight:700;color:#6b6453;margin-top:8px;line-height:1.45">O numerinho preto é o <b>prazo</b> de cada marca. Em cada andar tem uma de cada prazo, e <b>todas valem o mesmo dentro do prazo</b>. Você vê as do <b>seu andar e do de baixo</b> — na Série A são 8 concorrendo a 4 vagas, na Várzea são as 4 do bairro mesmo.</p>
    </div>
    <div class="nota">
      <h2>🛟 Quem já tem contrato</h2>
      <p style="font-size:13px;font-weight:600;line-height:1.5">Os 4 nomes de hoje continuam vivos por dentro (Adibas vira <b>Abibas</b>, Pênalti do Bairro vira <b>Penality</b>, <b>Naique</b> e <b>Pumba</b> ficam como estão) — e com o MESMO prazo de sempre: Naique 5, Pumba 3, Abibas 2, Penality 1. Assim <b>ninguém com contrato correndo perde a marca</b> nem vê a faixa quebrar no meio da carreira.</p>
    </div>
  </div>
</div>`

const out = process.argv[2] ?? `${ROOT}/fornecedores.png`
const tmp = `${ROOT}/.mockup-fornecedores.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1480, height: 1200 }, deviceScaleFactor: 2 })
await p.goto(`file://${tmp}`, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('✅', out)
