// 🖼️ MOCKUP — a imagem de COMPARTILHAR O ELENCO.
// Mesmo caso do jornal: a TELA já mudou (o jogador ficou SOLTO na grama, com o
// rosto quando existe e a bolinha no manto do clube quando não existe, mais a
// placa do patrocinador atrás do gol) e a imagem que vai pro zap continua
// desenhando fichinha branca com o nome escrito. Aqui a imagem vira cópia da tela.
// Rodar: node scripts/mockup-share-elenco.mjs
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const b64 = (p, t = 'image/webp') => { try { return `data:${t};base64,` + readFileSync(join(raiz, p)).toString('base64') } catch { return '' } }
const av = n => b64(`public/avatars/lendas-v1/${n}.webp`)
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6'
const C1 = '#0A0A0A', C2 = '#E3E2E1' // manto medido do Nova Eclipse
const escudo = b64('src/escalacao/img/novaeclipse-escudo.webp')
const mascote = b64('src/escalacao/img/novaeclipse-mascote.webp')
const MANTO = `repeating-linear-gradient(100deg,${C1} 0 13px,${C2} 13px 26px)`

const XI = [
  [{ pos:'GOL', nome:'Rogério Ceni', clube:'São Paulo', ano:2005, gols:4, rosto:av('rogerio-ceni-sao-paulo-2005') }],
  [{ pos:'LAT', nome:'Cafu', clube:'Milan', ano:2004, gols:1, rosto:av('cafu-milan-2004') },
   { pos:'ZAG', nome:'Aldair', clube:'Roma', ano:1994, gols:2, rosto:'' },
   { pos:'ZAG', nome:'Lúcio', clube:'Inter', ano:2010, gols:3, rosto:'' },
   { pos:'LAT', nome:'Roberto Carlos', clube:'Real Madrid', ano:2002, gols:6, rosto:av('roberto-carlos-real-madrid-2002') }],
  [{ pos:'MEI', nome:'Falcão', clube:'Internacional', ano:1979, gols:5, rosto:av('falcao-internacional-1979') },
   { pos:'MEI', nome:'Sócrates', clube:'Corinthians', ano:1983, gols:7, rosto:av('socrates-corinthians-1983') },
   { pos:'MEI', nome:'Zico', clube:'Flamengo', ano:1981, gols:14, rosto:av('zico-flamengo-1981') }],
  [{ pos:'ATA', nome:'Romário', clube:'Vasco', ano:2000, gols:19, rosto:av('romario-vasco-2000') },
   { pos:'ATA', nome:'Careca', clube:'São Paulo', ano:1986, gols:11, rosto:av('careca-sao-paulo-1986') },
   { pos:'ATA', nome:'Bebeto', clube:'Vasco', ano:1989, gols:9, rosto:av('bebeto-vasco-1989') }],
]
const BANCO = [
  [{ pos:'GOL', nome:'Taffarel', clube:'Internacional', ano:1989, gols:0, rosto:av('taffarel-internacional-1989') },
   { pos:'ZAG', nome:'Mozer', clube:'Flamengo', ano:1987, gols:1, rosto:'' },
   { pos:'MEI', nome:'Raí', clube:'São Paulo', ano:1992, gols:6, rosto:av('rai-sao-paulo-1992') },
   { pos:'ATA', nome:'Edmundo', clube:'Vasco', ano:1997, gols:8, rosto:'' }],
]

const jog = (c, alt) => `<div class="jg">
  ${c.rosto ? `<img class="ros" style="height:${alt}px" src="${c.rosto}"/>`
            : `<div class="bol" style="width:${Math.round(alt*0.72)}px;height:${Math.round(alt*0.72)}px;background:${MANTO}"><span>${c.pos}</span></div>`}
  <div class="nm">${c.nome}</div>
  <div class="cl">${c.clube} · ${c.ano}</div>
  ${c.gols ? `<div class="gl">⚽ ${c.gols}</div>` : ''}</div>`
const campo = (linhas, titulo, alt) => `<div class="campo">
  <div class="cbar" style="background:${MANTO}"><span>${titulo}</span></div>
  <div class="grama">${linhas.map(l => `<div class="lin">${l.map(c => jog(c, alt)).join('')}</div>`).join('')}</div>
  <div class="placa">VADICO VEÍCULOS</div></div>`

// fichinha branca do desenho ANTIGO (o que vai pro zap hoje)
const velha = c => `<div class="ch"><div class="chp">${c.pos}</div><div class="chn">${c.nome}</div>${c.gols?`<div class="chg">⚽ ${c.gols}</div>`:''}</div>`

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#2a2a2a;display:flex;gap:40px;padding:34px;font-family:Oswald,Arial,sans-serif;align-items:flex-start}
.col{width:1080px}
.tag{font-weight:900;font-size:30px;color:#fff;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.tag b{color:${GOLD}} .tag i{color:#7CE0A3;font-style:normal}
.card{border:6px solid ${INK};overflow:hidden}
/* ---- HOJE ---- */
.h-head{background:#1B7A3D;padding:30px 44px 24px}
.h-k{color:${GOLD};font-weight:800;font-size:26px}
.h-t{color:#fff;font-weight:900;font-size:62px;line-height:1.05;margin-top:8px}
.h-s{color:rgba(255,255,255,.85);font-weight:700;font-size:27px;font-family:Arial;margin-top:10px}
.h-chips{display:flex;gap:14px;margin-top:16px}
.h-chip{background:rgba(0,0,0,.3);border:2.5px solid rgba(245,179,1,.75);border-radius:12px;padding:8px 17px;color:${GOLD};font-weight:800;font-size:25px}
.h-field{background:repeating-linear-gradient(180deg,#1B7A3D 0 66px,#166332 66px 132px);padding:26px 20px}
.h-lin{display:flex;justify-content:center;gap:18px;margin:22px 0}
.ch{background:#fff;border:5px solid ${INK};border-radius:18px;width:206px;height:104px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.chp{color:#1B7A3D;font-weight:800;font-size:20px}.chn{color:${INK};font-weight:800;font-size:28px;line-height:1}
.chg{color:#166332;font-weight:800;font-size:22px;margin-top:4px}
.h-lists{background:#1B7A3D;padding:26px 44px 30px;display:flex;gap:26px}
.h-col{flex:1}.h-ct{color:#fff;font-weight:900;font-size:30px;margin-bottom:14px}
.h-row{background:#fff;border-radius:10px;padding:8px 12px;margin-bottom:8px;display:flex;gap:12px;align-items:center}
.h-rp{color:#1B7A3D;font-weight:800;font-size:16px;width:44px}.h-rn{color:${INK};font-weight:800;font-size:24px;flex:1}
.h-rv{color:rgba(0,0,0,.55);font-weight:800;font-size:20px}
.foot{background:${GOLD};border-top:6px solid ${INK};padding:22px;text-align:center}
.foot b{display:block;color:${INK};font-weight:900;font-size:34px}
.foot span{color:rgba(0,0,0,.6);font-weight:800;font-size:23px;font-family:Arial}
/* ---- PROPOSTA (cópia da tela) ---- */
.n-head{position:relative;padding:24px 38px;background:${MANTO};border-bottom:6px solid ${INK}}
.n-veu{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.84) 54%,rgba(0,0,0,.3))}
.n-in{position:relative;display:flex;align-items:center;gap:22px}
.n-esc{width:126px;height:126px;object-fit:contain;filter:drop-shadow(3px 3px 0 rgba(0,0,0,.55));flex:none}
.n-k{color:${GOLD};font-weight:800;font-size:24px}
.n-t{color:#fff;font-weight:900;font-size:62px;line-height:1;margin:4px 0 8px}
.n-s{color:rgba(255,255,255,.9);font-weight:700;font-size:24px;font-family:Arial}
.n-chips{position:relative;display:flex;gap:12px;margin-top:15px}
.n-chip{background:rgba(0,0,0,.55);border:2.5px solid ${GOLD};border-radius:12px;padding:7px 16px;color:${GOLD};font-weight:800;font-size:24px}
.campo{border-bottom:6px solid ${INK}}
.cbar{position:relative;height:46px;border-bottom:4px solid ${INK};display:flex;align-items:center;justify-content:center}
.cbar::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.45))}
.cbar span{position:relative;color:#fff;font-weight:900;font-size:22px;text-transform:uppercase;letter-spacing:1px;text-shadow:1px 1px 0 rgba(0,0,0,.9)}
.grama{background:repeating-linear-gradient(180deg,#2E8B4E 0 46px,#27793F 46px 92px);padding:18px 14px 14px}
.lin{display:flex;justify-content:center;align-items:flex-end;gap:16px;margin-bottom:14px}
.jg{width:168px;text-align:center}
.ros{display:block;margin:0 auto;object-fit:contain;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45))}
.bol{margin:0 auto;border:4px solid ${INK};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:2px 3px 0 rgba(0,0,0,.45)}
.bol span{color:#fff;font-weight:900;font-size:22px;text-shadow:1px 1px 0 rgba(0,0,0,.9)}
.nm{color:#fff;font-weight:900;font-size:23px;line-height:1.05;margin-top:5px;text-shadow:1px 1px 0 rgba(0,0,0,.75)}
.cl{color:rgba(255,255,255,.82);font-weight:700;font-size:15px;font-family:Arial;text-shadow:1px 1px 0 rgba(0,0,0,.7)}
.gl{display:inline-block;margin-top:4px;background:${GOLD};border:2.5px solid ${INK};border-radius:999px;padding:1px 10px;color:${INK};font-weight:900;font-size:16px}
.placa{background:#fff;border-top:4px solid ${INK};height:44px;display:flex;align-items:center;justify-content:center;color:#0E3E86;font-weight:900;font-size:22px;letter-spacing:2px}
.n-foot{background:${GOLD};border-top:6px solid ${INK};padding:18px 28px;display:flex;align-items:center;gap:20px}
.n-masc{width:112px;height:112px;object-fit:contain;flex:none}
.n-ft{flex:1;text-align:center}
.n-ft b{display:block;color:${INK};font-weight:900;font-size:33px}
.n-ft span{color:rgba(0,0,0,.62);font-weight:800;font-size:22px;font-family:Arial}
</style></head><body>

<div class="col"><div class="tag">a imagem que vai pro zap <b>HOJE</b></div>
<div class="card">
  <div class="h-head"><div class="h-k">🔨 LEILÃO LEGENDS · MEU ELENCO</div><div class="h-t">Nova Eclipse</div>
    <div class="h-s">Série A · 1º lugar · Temporada 388 · 4-3-3</div>
    <div class="h-chips"><div class="h-chip">🏆 3 títulos</div><div class="h-chip">🏷️ Elenco vale 412 💵</div><div class="h-chip">🪙 Caixa: 168</div></div></div>
  <div class="h-field">${XI.map(l=>`<div class="h-lin">${l.map(velha).join('')}</div>`).join('')}</div>
  <div class="h-lists">
    <div class="h-col"><div class="h-ct">⭐ TITULARES</div>${XI[1].map(c=>`<div class="h-row"><div class="h-rp">${c.pos}</div><div class="h-rn">${c.nome}</div><div class="h-rv">💰 ${20+c.gols}</div></div>`).join('')}</div>
    <div class="h-col"><div class="h-ct">🔁 RESERVAS</div>${BANCO[0].map(c=>`<div class="h-row"><div class="h-rp">${c.pos}</div><div class="h-rn">${c.nome}</div><div class="h-rv">💰 ${12+c.gols}</div></div>`).join('')}</div>
  </div>
  <div class="foot"><b>mostra teu elenco e marca a gente! 📲 @leilaolegendscom</b><span>monta o teu de graça em leilaolegends.com 🔨</span></div>
</div></div>

<div class="col"><div class="tag">a proposta: a imagem vira <i>CÓPIA DA TELA</i></div>
<div class="card">
  <div class="n-head"><div class="n-veu"></div>
    <div class="n-in"><img class="n-esc" src="${escudo}"/>
      <div><div class="n-k">🔨 LEILÃO LEGENDS · MEU ELENCO</div><div class="n-t">Nova Eclipse</div>
        <div class="n-s">Série A · 1º lugar · Temporada 388 · 4-3-3</div></div></div>
    <div class="n-chips"><div class="n-chip">🏆 3 títulos</div><div class="n-chip">🏷️ Elenco vale 412 💵</div><div class="n-chip">🪙 Caixa: 168</div></div></div>
  ${campo(XI, '⭐ Titulares', 96)}
  ${campo(BANCO, '🔁 Reservas', 74)}
  <div class="n-foot"><img class="n-masc" src="${mascote}"/>
    <div class="n-ft"><b>mostra teu elenco e marca a gente! 📲 @leilaolegendscom</b><span>monta o teu de graça em leilaolegends.com 🔨</span></div></div>
</div></div>

</body></html>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 2320, height: 1600 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(1400)
const saida = process.env.SAIDA || '/tmp/mockup-share-elenco.png'
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log('✅', saida)
