// 🖼️ MOCKUP — CONDIÇÃO / GÁS do jogador na aba ELENCO (pedido do Diego 12/09).
// Três variantes visuais lado a lado, na MESMA linha de 48px que a aba já usa
// (titulares | reservas), mais o campinho com o sinal no boneco, o aviso do
// preparador nos tempos mortos e a volta gradual de lesão. Nada aqui está no
// jogo — é só pra ele escolher o visual ANTES de codar (regra nº 2).
// Rodar: node scripts/mockup-condicao-elenco.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const b64 = (p, t = 'image/webp') => { try { return `data:${t};base64,` + readFileSync(join(raiz, p)).toString('base64') } catch { return '' } }
const av = n => b64(`public/avatars/lendas-v1/${n}.webp`)
const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', CREME = '#F4ECD6'
const C1 = '#0A0A0A', C2 = '#E3E2E1'
const MANTO = `repeating-linear-gradient(100deg,${C1} 0 13px,${C2} 13px 26px)`

// gás 0-100 · estado: ok (≥60) · cansado (30-59) · no limite (<30) · lesão em volta
const TIT = [
  { pos:'GOL', nome:'Rogério Ceni', clube:'São Paulo', ano:2005, gas:88, jogos:9, rosto:av('rogerio-ceni-sao-paulo-2005') },
  { pos:'LAT', nome:'Cafu', clube:'Milan', ano:2004, gas:52, jogos:9, rosto:av('cafu-milan-2004') },
  { pos:'ZAG', nome:'Aldair', clube:'Roma', ano:1994, gas:71, jogos:7 },
  { pos:'ZAG', nome:'Lúcio', clube:'Inter', ano:2010, gas:24, jogos:9 },
  { pos:'LAT', nome:'Roberto Carlos', clube:'Real Madrid', ano:2002, gas:64, jogos:8, rosto:av('roberto-carlos-real-madrid-2002') },
  { pos:'MEI', nome:'Falcão', clube:'Internacional', ano:1979, gas:80, jogos:6, rosto:av('falcao-internacional-1979') },
  { pos:'MEI', nome:'Sócrates', clube:'Corinthians', ano:1983, gas:41, jogos:9, rosto:av('socrates-corinthians-1983') },
  { pos:'MEI', nome:'Zico', clube:'Flamengo', ano:1981, gas:93, jogos:9, gols:14, rosto:av('zico-flamengo-1981') },
  { pos:'ATA', nome:'Romário', clube:'Vasco', ano:2000, gas:35, jogos:9, gols:19, rosto:av('romario-vasco-2000') },
  { pos:'ATA', nome:'Careca', clube:'São Paulo', ano:1986, gas:77, jogos:5, gols:11, rosto:av('careca-sao-paulo-1986') },
  { pos:'ATA', nome:'Bebeto', clube:'Vasco', ano:1989, gas:69, jogos:8, gols:9, rosto:av('bebeto-vasco-1989') },
]
const RES = [
  { pos:'GOL', nome:'Taffarel', clube:'Internacional', ano:1989, gas:100, jogos:0, rosto:av('taffarel-internacional-1989') },
  { pos:'LAT', nome:'Júnior', clube:'Flamengo', ano:1981, gas:100, jogos:1 },
  { pos:'ZAG', nome:'Mozer', clube:'Flamengo', ano:1987, gas:100, jogos:2 },
  { pos:'MEI', nome:'Raí', clube:'São Paulo', ano:1992, gas:100, jogos:3, gols:6, rosto:av('rai-sao-paulo-1992') },
  { pos:'MEI', nome:'Djalminha', clube:'Palmeiras', ano:1996, gas:100, jogos:0 },
  { pos:'ATA', nome:'Edmundo', clube:'Vasco', ano:1997, lesao:{ volta:2, forca:60 }, jogos:4, gols:8 },
  { pos:'ATA', nome:'Túlio', clube:'Botafogo', ano:1995, gas:100, jogos:1 },
]

const est = c => c.lesao ? 'lesao' : c.gas >= 60 ? 'ok' : c.gas >= 30 ? 'cansado' : 'limite'
const cor = e => e === 'ok' ? GREEN : e === 'cansado' ? '#D9A000' : e === 'limite' ? RED : '#7C3AED'
const emo = e => e === 'ok' ? '💪' : e === 'cansado' ? '😓' : e === 'limite' ? '🥵' : '🩹'
const rotulo = e => e === 'ok' ? 'inteiro' : e === 'cansado' ? 'cansado' : e === 'limite' ? 'no limite' : 'voltando'

// ── A: barrinha de gás (bateria) com a cor do estado, embaixo do clube · ano
const chipA = c => { const e = est(c); return c.lesao
  ? `<span class="bar"><i style="width:${c.lesao.forca}%;background:${cor(e)}"></i></span><span class="lb" style="color:${cor(e)}">🩹 volta em ${c.lesao.volta} · ${c.lesao.forca}%</span>`
  : `<span class="bar"><i style="width:${c.gas}%;background:${cor(e)}"></i></span><span class="lb" style="color:${cor(e)}">${c.gas}%</span>` }
// ── B: só o emoji do estado (3 caras + curativo), sem número
const chipB = c => { const e = est(c); return `<span class="emo" title="${rotulo(e)}">${emo(e)}</span>${c.lesao ? `<span class="lb" style="color:${cor(e)}">volta em ${c.lesao.volta}</span>` : ''}` }
// ── C: bolinha colorida colada na posição (verde/âmbar/vermelho/roxo)
const chipC = c => { const e = est(c); return `<span class="dot" style="background:${cor(e)};box-shadow:0 0 5px 1px ${cor(e)}"></span>` }

const row = (c, tit, chip, variante) => `<div class="row ${tit?'tit':'res'}">
  <span class="l">
    <span class="nm"><span class="pos">${variante==='C'?chipC(c):''}${c.pos}</span>${c.nome}</span>
    <span class="cl"><span class="clt">${c.clube} · ${c.ano}</span>${variante==='A'?chipA(c):variante==='B'?chipB(c):''}</span>
  </span>
  <span class="r">
    ${c.gols?`<span class="g">⚽ ${c.gols}</span>`:''}
    <span class="pv">💰 ${18+(c.gols||0)} <span class="sal">💸 ${2+Math.round((c.gols||0)/6)}</span></span>
    <span class="jg">🏃 ${c.jogos} jogos</span>
  </span></div>`

const listas = (variante) => `<div class="listas">
  <div class="col"><div class="ct">⭐ TITULARES</div>${TIT.map(c=>row(c,true,null,variante)).join('')}</div>
  <div class="col"><div class="ct">🔁 RESERVAS</div>${RES.map(c=>row(c,false,null,variante)).join('')}</div>
</div>`

// boneco do campinho com o sinal (a peça de jogadorcampo.tsx, simplificada)
const peca = c => { const e = est(c); return `<div class="pc">
  <div class="pcw">${c.rosto?`<img src="${c.rosto}"/>`:`<div class="bol" style="background:${MANTO}"><span>${c.pos}</span></div>`}
    <span class="pcb" style="background:${cor(e)}">${emo(e)}</span></div>
  <div class="pcn">${c.nome}</div>
  ${e!=='ok'?`<div class="pcg" style="color:${cor(e)}">${c.gas}%</div>`:''}
</div>` }
const campo = `<div class="campo">
  <div class="lin">${TIT.filter(c=>c.pos==='ATA').map(peca).join('')}</div>
  <div class="lin">${TIT.filter(c=>c.pos==='MEI').map(peca).join('')}</div>
  <div class="lin">${[TIT[1],TIT[2],TIT[3],TIT[4]].map(peca).join('')}</div>
  <div class="lin">${peca(TIT[0])}</div>
</div>`

const aviso = `<div class="aviso">
  <div class="avt">🧑‍⚕️ PREPARADOR FÍSICO</div>
  <div class="avx"><b>Lúcio</b> e <b>Romário</b> estão <b style="color:${RED}">no limite</b> (🥵) — jogando assim rendem menos e o risco de lesão dobra. <b>Sócrates</b> e <b>Cafu</b> estão cansados (😓).</div>
  <div class="avb"><button class="bt btg">🔁 RODIZIAR — pôr os descansados</button><button class="bt btw">deixa como está</button></div>
  <div class="avs">valendo do próximo jogo · banco recupera +20 por rodada · o jogo NUNCA troca por você</div>
</div>`

const volta = `<div class="volta">
  <div class="vt">🩹 VOLTA AOS POUCOS — Edmundo (lesão de 3 rodadas)</div>
  <div class="vl">
    <div class="vs"><b style="color:${RED}">fora</b><span>rod. 12–14</span><i style="width:0%"></i></div>
    <div class="vs"><b style="color:#7C3AED">60%</b><span>rod. 15</span><i style="width:60%;background:#7C3AED"></i></div>
    <div class="vs"><b style="color:#D9A000">80%</b><span>rod. 16</span><i style="width:80%;background:#D9A000"></i></div>
    <div class="vs"><b style="color:${GREEN}">100%</b><span>rod. 17</span><i style="width:100%;background:${GREEN}"></i></div>
  </div>
  <div class="vx">volta jogando, mas com a força reduzida nas 2 primeiras rodadas — com o 🏥 Dep. Médico, volta em 100% direto.</div>
</div>`

const painel = (t, sub, corpo) => `<div class="painel"><div class="ptag"><b>${t}</b><span>${sub}</span></div><div class="card">${corpo}</div></div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#2a2a2a;display:flex;gap:34px;padding:30px;font-family:Oswald,Arial,sans-serif;align-items:flex-start;flex-wrap:wrap;width:2540px}
.painel{width:600px}
.ptag{color:#fff;font-weight:800;font-size:22px;margin:0 0 12px;display:flex;flex-direction:column;gap:2px}
.ptag span{font-family:Arial;font-size:14px;font-weight:700;color:rgba(255,255,255,.7)}
.card{background:${GOLD};border:4px solid ${INK};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:14px;background-image:linear-gradient(160deg,#FFE79A,#FFC400 40%,#E8A200 70%,#FFDD70)}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.head b{color:#fff;font-size:20px;font-weight:900;text-shadow:1px 1px 0 rgba(0,0,0,.35)}
.head span{background:#fff;border:2px solid ${INK};border-radius:8px;padding:2px 9px;font-weight:900;font-size:14px}
.resumo{background:#fff;border:2px solid ${INK};border-radius:8px;padding:6px 10px;font-weight:900;font-size:14px;margin-bottom:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.resumo .k{font-family:Arial;font-weight:700;font-size:11px;color:#5a5647}
.listas{display:flex;gap:8px}
.col{flex:1;min-width:0}
.ct{font-weight:900;font-size:11px;color:#fff;text-shadow:1px 1px 0 rgba(0,0,0,.35);margin:0 0 5px 2px;letter-spacing:.5px}
.row{display:flex;align-items:center;justify-content:space-between;gap:4px;height:52px;padding:0 7px;border-radius:6px;background:#fff;margin-bottom:3px;border:2px solid transparent}
.row.res{background:rgba(255,255,255,.88)}
.l{min-width:0;display:flex;flex-direction:column;gap:2px}
.nm{display:block;font-weight:800;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.res .nm{font-weight:700;color:#4a4740}
.pos{font-weight:900;font-size:9.5px;color:#C9A227;margin-right:4px;display:inline-flex;align-items:center;gap:3px}
.cl{display:flex;align-items:center;gap:5px;font-family:Arial;font-weight:700;font-size:10px;color:rgba(0,0,0,.45);white-space:nowrap;overflow:hidden}
.clt{overflow:hidden;text-overflow:ellipsis;max-width:110px}
.r{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0;line-height:1.2;gap:1px}
.g{font-weight:900;font-size:11px;color:${GREEN}}
.pv{font-weight:900;font-size:11px;color:#5a5647;display:flex;gap:3px;align-items:center}
.sal{font-size:10px;color:${RED};background:rgba(194,69,47,.10);border:1px solid rgba(194,69,47,.3);border-radius:5px;padding:0 3px}
.jg{font-family:Arial;font-weight:800;font-size:9px;color:rgba(0,0,0,.45)}
/* A: barra */
.bar{display:inline-block;width:44px;height:7px;border:1.5px solid ${INK};border-radius:4px;background:#e9dfbe;overflow:hidden;flex:none}
.bar i{display:block;height:100%}
.lb{font-weight:900;font-size:9.5px;font-family:Oswald}
/* B: emoji */
.emo{font-size:13px;line-height:1;flex:none}
/* C: bolinha */
.dot{display:inline-block;width:9px;height:9px;border-radius:99px;border:1.5px solid ${INK};flex:none}
/* campinho */
.campo{border:3px solid ${INK};border-radius:12px;overflow:hidden;background:repeating-linear-gradient(180deg,${GREEN} 0 44px,#166332 44px 88px);padding:14px 6px 16px;display:flex;flex-direction:column;gap:12px;margin-bottom:10px}
.lin{display:flex;justify-content:center;align-items:flex-end;gap:6px}
.pc{display:flex;flex-direction:column;align-items:center;width:96px}
.pcw{position:relative;height:66px;display:flex;align-items:flex-end}
.pcw img{height:66px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))}
.bol{width:48px;height:48px;border-radius:99px;border:2.5px solid ${INK};display:flex;align-items:center;justify-content:center;margin-bottom:6px}
.bol span{background:rgba(0,0,0,.42);color:#fff;font-weight:900;font-size:11px;border-radius:6px;padding:1px 5px}
.pcb{position:absolute;right:-8px;bottom:14px;width:22px;height:22px;border-radius:99px;border:2px solid ${INK};display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:1.5px 1.5px 0 ${INK}}
.pcn{color:#fff;font-weight:800;font-size:11px;text-shadow:1px 1px 0 rgba(0,0,0,.6);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px}
.pcg{font-weight:900;font-size:10px;background:#fff;border:1.5px solid ${INK};border-radius:5px;padding:0 4px;margin-top:2px}
/* aviso do preparador */
.aviso{border:3px solid ${INK};background:#FFF6D6;border-radius:11px;padding:10px 12px;box-shadow:3px 3px 0 ${INK};margin-bottom:10px}
.avt{font-weight:900;font-size:12px;letter-spacing:.6px;color:#5a5647}
.avx{font-family:Arial;font-weight:700;font-size:12.5px;line-height:1.45;margin:4px 0 8px}
.avb{display:flex;gap:6px}
.bt{border:2.5px solid ${INK};border-radius:9px;padding:8px 10px;font-weight:900;font-size:12.5px;font-family:Oswald;box-shadow:2px 2px 0 ${INK}}
.btg{background:${GREEN};color:#fff;flex:1}.btw{background:#fff}
.avs{font-family:Arial;font-weight:700;font-size:10px;color:#5a5647;margin-top:6px}
/* volta da lesão */
.volta{border:3px solid ${INK};background:#fff;border-radius:11px;padding:10px 12px;box-shadow:3px 3px 0 ${INK}}
.vt{font-weight:900;font-size:12px;letter-spacing:.4px}
.vl{display:flex;gap:6px;margin:8px 0 6px}
.vs{flex:1;position:relative;background:#e9dfbe;border:2px solid ${INK};border-radius:7px;height:46px;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center}
.vs b{font-weight:900;font-size:14px;position:relative;z-index:2}.vs span{font-family:Arial;font-size:9px;font-weight:700;color:#5a5647;position:relative;z-index:2}
.vs i{position:absolute;left:0;bottom:0;height:5px;display:block}
.vx{font-family:Arial;font-weight:700;font-size:10.5px;color:#5a5647;line-height:1.4}
</style></head><body>

${painel('A · BATERIA DE GÁS', 'barrinha + % na cor do estado, embaixo do clube · ano (onde já mora o overall do Olheiro)', `
  <div class="head"><b>👥 Nova Eclipse 👑🖋️</b><span>22/22</span></div>
  <div class="resumo">🏃 Gás do time: <b style="color:#D9A000">62%</b> <span class="k">· 2 no limite 🥵 · 2 cansados 😓 · 1 voltando 🩹</span></div>
  ${listas('A')}`)}

${painel('B · TRÊS CARAS', 'só o emoji do estado (💪 😓 🥵 + 🩹) — sem número, leitura de relance', `
  <div class="head"><b>👥 Nova Eclipse 👑🖋️</b><span>22/22</span></div>
  <div class="resumo">🏃 Gás do time: <b style="color:#D9A000">62%</b> <span class="k">· 2 no limite 🥵 · 2 cansados 😓 · 1 voltando 🩹</span></div>
  ${listas('B')}`)}

${painel('C · BOLINHA NA POSIÇÃO', 'um pontinho colorido colado na sigla (verde · âmbar · vermelho · roxo) — o mais discreto', `
  <div class="head"><b>👥 Nova Eclipse 👑🖋️</b><span>22/22</span></div>
  <div class="resumo">🏃 Gás do time: <b style="color:#D9A000">62%</b> <span class="k">· 2 no limite 🥵 · 2 cansados 😓 · 1 voltando 🩹</span></div>
  ${listas('C')}`)}

${painel('NO CAMPINHO + TEMPO MORTO', 'o sinal no boneco (só quem NÃO está inteiro ganha o %) · aviso do preparador ANTES da rodada · lesão volta aos poucos', `
  <div class="head"><b>👥 Nova Eclipse 👑🖋️</b><span>4-3-3</span></div>
  ${campo}
  ${aviso}
  ${volta}`)}

</body></html>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 2600, height: 1500 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(1400)
const saida = process.env.SAIDA || '/tmp/mockup-condicao-elenco.png'
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log('✅', saida)
